/* Mapa vivo: tela de mapa com filtros, pins agrupados e lista do que está na área visível.
   Usa Leaflet (vendor/leaflet.js, no próprio site) e o desenho do mapa configurado no Painel → Recursos.
   Se as imagens do mapa não carregarem (rede bloqueada), desenha rodovias, rios e lagos principais por conta própria. */
(function () {
  "use strict";
  var G = window.Guia; if (!G || !window.Recursos) return;
  var R = window.Recursos, esc = G.esc, ic = G.ic, $ = function (s, r) { return (r || document).querySelector(s); };
  var mapa = null, camada = null, reserva = null, F = R.novoFiltro(), rota = "", estado = "meio", entendi = null, falhas = 0, cssPronto = false, ultimaLista = [];
  var CENTRO_PADRAO = [32.7894, -96.8017];

  function cfgMapa() { return Object.assign({ tiles: "https://tile.openstreetmap.org/{z}/{x}/{y}.png", atribuicao: "© OpenStreetMap", zoom: 12 }, G.config().mapa || {}); }
  function carregaCss() {
    if (cssPronto || document.getElementById("css-leaflet")) return; cssPronto = true;
    fetch("vendor/leaflet.css").then(function (r) { return r.text(); }).then(function (t) { var s = document.createElement("style"); s.id = "css-leaflet"; s.textContent = t; document.head.appendChild(s); }).catch(function () { cssPronto = false; });
  }

  /* ---------- etiquetas dos pins ---------- */
  function rotuloPin(l) {
    if (R.ehEvento(l)) { if (R.acontecendoAgora(l)) return "Agora"; var ps = R.proximasSessoes(l), d = ps.length ? ps[0].d : (l.dataInicio && l.dataInicio >= R.hoje() ? l.dataInicio : ""); if (d) return d.slice(8, 10) + "/" + d.slice(5, 7); return "Evento"; }
    if (gratis(l)) return "Grátis";
    var n = G.notas(l).guia; if (n != null) return (window.Reacoes ? Reacoes.emoji(n) : "★") + " " + n.toFixed(1).replace(".", ",");
    var p = G.precos(l); return p && !p.gratis ? "US$ " + Math.round(p.min) + "+" : l.faixaPreco || (G.CATS[l.categoria] || "Ver").split(" ")[0];
  }
  /* Cores: verde = anunciante, amarelo = programação gratuita, vermelho = acontecendo agora, branco = demais lugares. */
  function gratis(l) { return l.tipo !== "estabelecimento" && (l.gratuito || Number(l.precoMin) === 0); }
  function classePin(l) { if (R.ehEvento(l) && R.acontecendoAgora(l)) return "vivo"; if (l.anunciante) return "anun"; if (gratis(l)) return "gr"; return ""; }

  /* ---------- reserva: desenho próprio quando as imagens do mapa não carregam ---------- */
  var VIAS = [[[32.737, -97.47], [32.75, -97.33], [32.745, -97.1], [32.765, -96.97], [32.776, -96.8], [32.8, -96.62], [32.87, -96.43]], [[32.67, -97.47], [32.68, -97.1], [32.68, -96.8], [32.72, -96.45]], [[32.5, -96.86], [32.7, -96.83], [32.78, -96.81], [32.85, -96.89], [32.95, -96.92], [33.05, -97.0], [33.25, -97.13]], [[32.5, -97.32], [32.75, -97.32], [32.9, -97.31], [33.25, -97.13]], [[32.83, -97.03], [32.92, -96.95], [32.925, -96.8], [32.91, -96.68], [32.83, -96.61], [32.75, -96.62]], [[32.79, -96.8], [32.9, -96.77], [33.02, -96.71], [33.22, -96.63]], [[32.8, -96.81], [33.0, -96.83], [33.25, -96.82]], [[32.82, -97.28], [32.84, -97.05], [32.81, -96.88]], [[32.73, -97.43], [32.84, -97.38], [32.86, -97.25], [32.8, -97.2], [32.68, -97.25]], [[32.9, -97.1], [33.0, -96.95], [33.1, -96.77], [33.2, -96.62]]];
  var RIO = [[32.77, -97.48], [32.76, -97.33], [32.79, -97.18], [32.8, -97.05], [32.8, -96.9], [32.77, -96.82], [32.7, -96.75], [32.5, -96.62]];
  var LAGOS = [[33.07, -96.98, 6000], [32.97, -97.07, 3000], [32.835, -96.72, 1200], [32.86, -96.52, 4000], [32.62, -97.0, 3500], [32.88, -97.48, 2800]];
  var CIDADES = [["Dallas", 32.79, -96.78], ["Fort Worth", 32.755, -97.33], ["Arlington", 32.73, -97.11], ["Irving", 32.86, -96.97], ["Plano", 33.02, -96.7], ["Frisco", 33.15, -96.82], ["Grapevine", 32.94, -97.08], ["Garland", 32.91, -96.64], ["Grand Prairie", 32.7, -97.0], ["McKinney", 33.2, -96.62], ["Denton", 33.21, -97.13]];
  function ligaReserva() {
    if (reserva || !mapa) return;
    reserva = L.layerGroup();
    LAGOS.forEach(function (x) { L.circle([x[0], x[1]], { radius: x[2], stroke: false, fillColor: "#BFDCEA", fillOpacity: 1, interactive: false }).addTo(reserva); });
    L.polyline(RIO, { color: "#BFDCEA", weight: 7, interactive: false }).addTo(reserva);
    VIAS.forEach(function (v) { L.polyline(v, { color: "#E2C46B", weight: 6, interactive: false }).addTo(reserva); L.polyline(v, { color: "#F8E3A0", weight: 3.5, interactive: false }).addTo(reserva); });
    CIDADES.forEach(function (c) { L.marker([c[1], c[2]], { interactive: false, icon: L.divIcon({ className: "mv-cid", html: esc(c[0]), iconSize: null }) }).addTo(reserva); });
    reserva.addTo(mapa); mapa.getContainer().classList.add("sem-tiles");
  }

  /* ---------- pins agrupados ---------- */
  function desenhaPins() {
    if (!mapa) return;
    camada.clearLayers();
    var lista = ultimaLista.filter(function (l) { return typeof l.lat === "number" && typeof l.lng === "number"; });
    var b = mapa.getBounds().pad(0.15), cel = 58, grupos = {};
    lista.forEach(function (l) {
      if (!b.contains([l.lat, l.lng])) return;
      var p = mapa.latLngToContainerPoint([l.lat, l.lng]), k = Math.floor(p.x / cel) + ":" + Math.floor(p.y / cel);
      (grupos[k] = grupos[k] || []).push(l);
    });
    Object.keys(grupos).forEach(function (k) {
      var g = grupos[k];
      if (g.length === 1 || mapa.getZoom() >= 17) {
        g.forEach(function (l) {
          var m = L.marker([l.lat, l.lng], { icon: L.divIcon({ className: "mv-pin " + classePin(l), html: "<span>" + esc(rotuloPin(l)) + "</span>", iconSize: null, iconAnchor: [0, 0] }), title: l.nome, keyboard: true, riseOnHover: true });
          m.on("click", function () { location.hash = "#lugar-" + l.id; });
          m.addTo(camada);
        });
        return;
      }
      var lat = 0, lng = 0; g.forEach(function (l) { lat += l.lat; lng += l.lng; });
      var c = L.marker([lat / g.length, lng / g.length], { icon: L.divIcon({ className: "mv-grupo", html: "<span>" + g.length + "</span>", iconSize: [40, 40] }), title: g.length + " lugares aqui", keyboard: true });
      c.on("click", function () { mapa.fitBounds(L.latLngBounds(g.map(function (l) { return [l.lat, l.lng]; })).pad(0.3), { maxZoom: 17 }); });
      c.addTo(camada);
    });
  }

  /* ---------- lista da área visível ---------- */
  function linha(l) {
    var f = G.foto(l), n = G.notas(l).guia, t = G.tempo(l, "carro"), ps = R.ehEvento(l) ? R.proximasSessoes(l) : [];
    var sub = [G.CATS[l.categoria] || "", G.regiao(l)].filter(Boolean).join(" · ");
    var info = R.ehEvento(l) ? (ps.length ? R.dataCurta(ps[0].d) + (ps[0].i ? " · " + ps[0].i : "") + (ps.length > 1 ? " · +" + (ps.length - 1) : "") : (l.quando || "")) : [n != null ? (window.Reacoes ? Reacoes.emoji(n) : "★") + " " + n.toFixed(1).replace(".", ",") : "", G.precoCurto(l) === "Pago" ? "" : G.precoCurto(l)].filter(Boolean).join(" · ");
    var tags = (R.acontecendoAgora(l) ? '<span class="mv-t vivo">Agora</span>' : "") + (l.esgotado ? '<span class="mv-t x">Esgotado</span>' : "") + (l.anunciante ? '<span class="mv-t">Patrocinado</span>' : "") + (l.falaPortugues ? '<span class="mv-t br">Fala português</span>' : "");
    return '<a class="mv-row" href="#lugar-' + esc(l.id) + '"><span class="ft">' + (f ? '<img src="' + esc(f) + '" alt="" loading="lazy">' : "") + "</span><span class=\"tx\"><b>" + esc(l.nome) + "</b><small>" + tags + esc(sub) + "</small><small>" + esc(info) + '</small></span><span class="km">' + (t ? esc(t) + "<small>de carro</small>" : "") + "</span></a>";
  }
  function corpoLista() {
    var c = $("#mv-corpo"); if (!c) return;
    var dentro = ultimaLista;
    if (mapa) { var b = mapa.getBounds(); dentro = ultimaLista.filter(function (l) { return typeof l.lat === "number" && b.contains([l.lat, l.lng]); }); }
    dentro = G.primeiro(dentro.slice().sort(function (a, b2) { var da = G.kmDe(a), db = G.kmDe(b2); if (da != null && db != null) return da - db; return (G.notas(b2).guia || 0) - (G.notas(a).guia || 0); }));
    var rot = R.rotulo(F), titulo = rot.length ? rot.join(" · ") : (G.Geo && G.Geo.gps ? "Perto de você" : "Nesta área do mapa");
    c.innerHTML = '<div class="mv-cab"><div><h2>' + esc(titulo) + '</h2><small>' + dentro.length + (dentro.length === 1 ? " lugar" : " lugares") + " nesta área" + (ultimaLista.length > dentro.length ? " · " + ultimaLista.length + " no total" : "") + "</small></div>" +
      (R.on("compartilhar") && rot.length ? '<button type="button" class="btn ghost sm" data-mv-share>' + ic("share") + " Compartilhar</button>" : "") + "</div>" +
      '<p class="mv-legenda"><span><i style="background:#0AA23C"></i>Anunciantes</span><span><i style="background:#FFBC04"></i>Grátis</span><span><i style="background:#E0443A"></i>Agora</span><span><i style="background:#fff"></i>Outros lugares</span></p>' +
      (entendi ? '<p class="mv-entendi"><b>Entendi:</b> ' + entendi.map(function (x) { return '<span>' + esc(x) + "</span>"; }).join("") + "</p>" : "") +
      (relaxou ? '<p class="note small">Nada com as palavras da busca; mostramos o que bate com os outros filtros.</p>' : "") +
      (dentro.length ? '<div class="mv-lista">' + dentro.slice(0, 60).map(linha).join("") + "</div>" : '<div class="mv-vazio"><p>Nada nesta área com estes filtros.</p>' + (ultimaLista.length ? '<button type="button" class="btn sm" data-mv-tudo>Mostrar os ' + ultimaLista.length + " no mapa</button>" : '<button type="button" class="btn sm" data-mv-limpar>Limpar filtros</button>') + "</div>");
  }
  var relaxou = false;
  function atualiza(ajustar) {
    var r = R.aplica(F); ultimaLista = r.lista; relaxou = r.relaxou;
    chips();
    if (mapa) { desenhaPins(); if (ajustar && ultimaLista.length) enquadra(); }
    corpoLista();
  }
  function enquadra() {
    var pts = ultimaLista.filter(function (l) { return typeof l.lat === "number"; }).map(function (l) { return [l.lat, l.lng]; });
    if (!pts.length || !mapa) return;
    if (pts.length === 1) mapa.setView(pts[0], 15); else mapa.fitBounds(L.latLngBounds(pts).pad(0.12), { maxZoom: 15, paddingBottomRight: grande() ? [0, 0] : [0, Math.round(alturaFolha() * 0.6)] });
  }

  /* ---------- filtros ---------- */
  var GR = [["passeios", "Passeios"], ["comer", "Comer"], ["eventos", "Eventos"], ["brasileiros", "Brasileiros"], ["compras", "Compras"]];
  var FILTRO_IC = '<svg class="i" viewBox="0 0 24 24" aria-hidden="true"><path d="M4 6h10M18 6h2M4 12h4M12 12h8M4 18h12M20 18h0"/><circle cx="16" cy="6" r="2"/><circle cx="10" cy="12" r="2"/><circle cx="18" cy="18" r="2"/></svg>';
  function chip(attr, txt, on, extra) { return '<button type="button" class="mv-chip" ' + attr + ' aria-pressed="' + !!on + '">' + (extra || "") + esc(txt) + "</button>"; }
  function contaFiltros(X) { X = X || F; return (X.agora ? 1 : 0) + (X.data ? 1 : 0) + (X.preco ? 1 : 0) + (X.grupo ? 1 : 0) + (X.pv ? 1 : 0) + (X.kids ? 1 : 0) + X.etq.length + (X.cidade ? 1 : 0) + X.cats.length; }
  /* Abaixo da busca: só os filtros ativos (com ×). Sem filtro ativo, três atalhos. */
  function chips() {
    var el = $("#mv-chips"), bt = $("#mv-fbtn"); if (!el) return;
    var n = contaFiltros();
    if (bt) { bt.querySelector("b").textContent = n || ""; bt.querySelector("b").hidden = !n; bt.setAttribute("aria-label", "Filtros" + (n ? " (" + n + " ativos)" : "")); }
    var h = "", x = function (k, txt) { return '<button type="button" class="mv-chip ativo" data-mv-rm="' + esc(k) + '" aria-label="Remover filtro ' + esc(txt) + '">' + esc(txt) + ' <span aria-hidden="true">×</span></button>'; };
    if (!n) {
      if (R.on("agora")) h += chip('data-mv="agora"', "Agora", false, '<i class="dot vivo"></i>');
      if (R.on("filtros")) h += chip('data-mv="fds"', "Este FDS", false) + chip('data-mv="gratis"', "Grátis", false);
      if (R.on("paraVoce")) h += chip('data-mv="pv"', "Para você", false);
    } else {
      var per = R.rotulo({ data: F.data, de: F.de, ate: F.ate, q: "", agora: false, preco: "", etq: [], grupo: "", cats: [], cidade: "", pv: false, kids: false })[0];
      if (F.agora) h += x("agora", "Agora"); if (F.data) h += x("data", per || "Datas");
      if (F.preco) h += x("preco", F.preco === "gratis" ? "Grátis" : "Até US$ " + F.preco);
      if (F.grupo) h += x("grupo", (GR.filter(function (g) { return g[0] === F.grupo; })[0] || [0, F.grupo])[1]);
      if (F.cats.length) h += x("cats", F.cats.map(function (c) { return G.CATS[c] || c; }).slice(0, 2).join(" ou "));
      if (F.pv) h += x("pv", "Para você"); if (F.kids) h += x("kids", "Para crianças");
      F.etq.forEach(function (e) { h += x("etq:" + e, R.nomeEtq(e)); });
      if (F.cidade) h += x("cidade", F.cidade);
      h += '<button type="button" class="mv-chip limpar" data-mv-limpar>Limpar</button>';
    }
    el.innerHTML = h;
  }
  function mudou(ajustar) { entendi = null; atualizaRota(); atualiza(ajustar); }
  function atualizaRota() { var h = R.paraLink(F), alvo = h === "busca-tudo" ? "mapa" : h; rota = alvo; if (location.hash.slice(1) !== alvo) location.hash = alvo; }
  /* Painel completo de filtros: folha que sobe no celular, janela lateral no computador. Mostra quantos resultados dá antes de aplicar. */
  function maisFiltros() {
    var dlg = $("#dlg"), T = JSON.parse(JSON.stringify(F)), cidades = {}; G.lugares().forEach(function (l) { if (l.cidade) cidades[l.cidade] = (cidades[l.cidade] || 0) + 1; });
    var cs = Object.keys(cidades).sort(function (a, b) { return cidades[b] - cidades[a]; });
    function op(grupo, val, txt, ativo) { return '<button type="button" class="mv-op" data-g="' + grupo + '" data-v="' + esc(val) + '" aria-pressed="' + !!ativo + '">' + esc(txt) + "</button>"; }
    function desenha() {
      var dataSel = T.data === "dia" ? "intervalo" : T.data;
      dlg.innerHTML = '<form method="dialog" id="f-mv" class="mv-filtros"><div class="dlg-head"><h3>Filtros</h3><button type="button" class="btn sm ghost" data-fechar>Fechar</button></div><div class="dlg-body stack" style="gap:18px">' +
        (R.on("agora") ? '<div class="mv-sec"><h4>Agora</h4><div class="mv-ops">' + op("agora", "1", "Acontecendo ou aberto agora", T.agora) + "</div></div>" : "") +
        (R.on("filtros") ? '<div class="mv-sec"><h4>Quando <small>eventos</small></h4><div class="mv-ops">' + [["", "Qualquer data"], ["hoje", "Hoje"], ["amanha", "Amanhã"], ["fds", "Este fim de semana"], ["7d", "Próximos 7 dias"], ["intervalo", "Escolher datas"]].map(function (o) { return op("data", o[0], o[1], dataSel === o[0]); }).join("") + "</div>" +
          (dataSel === "intervalo" ? '<div class="form2" style="margin-top:8px"><div class="field"><label for="mv-de">De</label><input type="date" id="mv-de" value="' + esc(T.de) + '"></div><div class="field"><label for="mv-ate">Até</label><input type="date" id="mv-ate" value="' + esc(T.ate) + '"></div></div>' : "") + "</div>" +
          '<div class="mv-sec"><h4>Preço</h4><div class="mv-ops">' + [["", "Qualquer"], ["gratis", "Grátis"], ["20", "Até US$ 20"], ["50", "Até US$ 50"]].map(function (o) { return op("preco", o[0], o[1], T.preco === o[0]); }).join("") + '</div><p class="small muted" style="margin-top:6px">Restaurantes entram pela faixa de preço ($ e $$).</p></div>' : "") +
        '<div class="mv-sec"><h4>Tipo</h4><div class="mv-ops">' + op("grupo", "", "Tudo", !T.grupo) + GR.map(function (g) { return op("grupo", g[0], g[1], T.grupo === g[0]); }).join("") + "</div></div>" +
        (R.on("paraVoce") ? '<div class="mv-sec"><h4>Para você</h4><div class="mv-ops">' + op("pv", "1", R.meusInteresses().length >= 2 ? "Só o que combina com meus interesses" : "Escolher meus interesses", T.pv) + "</div></div>" : "") +
        (R.on("etiquetas") ? '<div class="mv-sec"><h4>Etiquetas</h4><div class="mv-ops">' + op("kids", "1", "Para crianças", T.kids) + R.etiquetas().filter(function (e) { return e.id !== "criancas"; }).map(function (e) { return op("etq", e.id, e.nome, T.etq.indexOf(e.id) >= 0); }).join("") + "</div></div>" : "") +
        '<div class="mv-sec"><h4>Cidade</h4><label class="sr" for="mv-cid">Cidade</label><select id="mv-cid"><option value="">Todas as cidades</option>' + cs.map(function (c) { return "<option" + (T.cidade === c ? " selected" : "") + ">" + esc(c) + " (" + cidades[c] + ")</option>"; }).join("") + "</select></div>" +
        '</div><div class="dlg-foot"><button type="button" class="btn ghost" data-mv-zerar>Limpar</button><button class="btn" type="submit" id="mv-ver"></button></div></form>';
      conta();
    }
    function leDatas() { var de = $("#mv-de", dlg), ate = $("#mv-ate", dlg); if (de) { T.de = de.value; T.ate = ate.value; T.data = !T.de && !T.ate ? "intervalo" : T.de && (!T.ate || T.ate === T.de) ? "dia" : "intervalo"; if (T.data === "dia") T.ate = ""; } }
    function conta() { var X = JSON.parse(JSON.stringify(T)); if (X.data === "intervalo" && !X.de && !X.ate) X.data = ""; var n = R.aplica(X).lista.length; $("#mv-ver", dlg).textContent = "Ver " + n + (n === 1 ? " resultado" : " resultados"); }
    desenha();
    dlg.classList.add("folha-dlg"); dlg.addEventListener("close", function () { dlg.classList.remove("folha-dlg"); }, { once: true });
    if (!dlg.open) dlg.showModal();
    dlg.onclick = function (e) {
      if (e.target.closest("[data-fechar]")) { dlg.close(); return; }
      if (e.target.closest("[data-mv-zerar]")) { T = R.novoFiltro(); desenha(); return; }
      var b = e.target.closest(".mv-op"); if (!b) return;
      var g = b.dataset.g, val = b.dataset.v; leDatas();
      if (g === "agora") T.agora = !T.agora;
      else if (g === "data") { T.data = val; if (val !== "intervalo") { T.de = ""; T.ate = ""; } }
      else if (g === "preco") T.preco = val;
      else if (g === "grupo") { T.grupo = val; T.cats = []; }
      else if (g === "pv") { if (!T.pv && R.meusInteresses().length < 2) { dlg.close(); R.abreInteresses(function () { F = T; F.pv = true; mudou(true); }); return; } T.pv = !T.pv; }
      else if (g === "kids") T.kids = !T.kids;
      else if (g === "etq") { var i = T.etq.indexOf(val); if (i >= 0) T.etq.splice(i, 1); else T.etq.push(val); }
      desenha();
    };
    dlg.onchange = function (e) { if (e.target.id === "mv-cid") T.cidade = e.target.value; leDatas(); conta(); };
    $("#f-mv", dlg).onsubmit = function (e) { e.preventDefault(); leDatas(); if (T.data === "intervalo" && !T.de && !T.ate) T.data = ""; F = T; dlg.close(); mudou(true); };
  }

  /* ---------- folha (celular) ---------- */
  var ALT = { baixo: 0.30, meio: 0.48, alto: 0.86 };
  function grande() { return window.innerWidth >= 900; }
  function alturaFolha() { var s = $(".mv"); return s ? s.clientHeight * ALT[estado] : 300; }
  function aplicaAltura() { var s = $(".mv"); if (s && !grande()) s.style.setProperty("--folha", Math.round(alturaFolha()) + "px"); }
  function dimensiona() {
    var s = $(".mv"); if (!s) return;
    var top = s.getBoundingClientRect().top + window.scrollY, tab = document.getElementById("tabbar"), tb = tab && getComputedStyle(tab).display !== "none" ? tab.offsetHeight + 12 : 0;
    s.style.height = Math.max(420, window.innerHeight - top - tb) + "px";
    aplicaAltura(); if (mapa) mapa.invalidateSize();
  }

  /* ---------- montagem da tela ---------- */
  function monta() {
    G.app.innerHTML = '<section class="mv" aria-label="Mapa">' +
      '<div class="mv-mapa" id="mv-mapa"></div>' +
      '<div class="mv-topo"><form class="mv-busca" id="mv-form" role="search">' + ic("search") + '<label class="sr" for="mv-q">Buscar</label><input id="mv-q" type="search" autocomplete="off" placeholder="' + (R.on("busca") ? "Ex.: samba neste sábado, grátis com crianças" : "Buscar lugar ou evento") + '"><button type="button" class="mv-fbtn" id="mv-fbtn" data-mv="mais" aria-label="Filtros">' + FILTRO_IC + '<span>Filtros</span><b hidden></b></button><button type="submit" class="btn sm mv-ir">Buscar</button></form><div class="mv-chips" id="mv-chips"></div></div>' +
      '<button type="button" class="mv-local" data-mv-local aria-label="Centralizar no meu ponto de partida">' + ic("pin") + "</button>" +
      '<div class="mv-folha" id="mv-folha"><button type="button" class="mv-alca" id="mv-alca" aria-label="Aumentar ou diminuir a lista"></button><div class="mv-corpo" id="mv-corpo"></div></div></section>';
    dimensiona();
    if (!window.L) { $("#mv-mapa").innerHTML = '<p class="note" style="margin:120px 16px">O mapa não carregou. A lista abaixo mostra os resultados.</p>'; return; }
    var c = cfgMapa(), centro = G.Geo && typeof G.Geo.lat === "number" ? [G.Geo.lat, G.Geo.lng] : CENTRO_PADRAO;
    mapa = L.map("mv-mapa", { zoomControl: false, attributionControl: true, tap: true }).setView(centro, Number(c.zoom) || 12);
    L.control.zoom({ position: "topright" }).addTo(mapa);
    if (c.tiles) {
      var tl = L.tileLayer(c.tiles, { maxZoom: 19, attribution: c.atribuicao || "" });
      tl.on("tileerror", function () { falhas++; if (falhas >= 3) { ligaReserva(); } });
      tl.on("tileload", function () { falhas = 0; });
      tl.addTo(mapa);
    } else ligaReserva();
    camada = L.layerGroup().addTo(mapa);
    if (G.Geo && typeof G.Geo.lat === "number") L.marker([G.Geo.lat, G.Geo.lng], { interactive: false, icon: L.divIcon({ className: "mv-eu", iconSize: [18, 18] }) }).addTo(mapa);
    var t = null; mapa.on("moveend zoomend", function () { clearTimeout(t); t = setTimeout(function () { desenhaPins(); corpoLista(); }, 60); });
  }
  function view(r) {
    r = r || "mapa";
    if (!R.on("mapa")) { G.app.innerHTML = '<section class="block"><div class="wrap narrow"><h1 class="page-h">Mapa</h1><p class="muted">O mapa está desligado no momento.</p><a class="btn" href="#explorar">Explorar lugares</a></div></section>'; return; }
    carregaCss();
    var mesmaTela = mapa && document.getElementById("mv-mapa") && mapa.getContainer() === document.getElementById("mv-mapa");
    if (mesmaTela && r === rota) { atualiza(false); return; }
    var novoF = r.indexOf("busca-") === 0 ? R.deLink(r) : R.novoFiltro();
    entendi = null; try { var s = JSON.parse(sessionStorage.getItem("busca-entendi") || "null"); if (s && r.indexOf("busca-") === 0) { entendi = s.entendi; sessionStorage.removeItem("busca-entendi"); var q = s.frase; setTimeout(function () { var i = $("#mv-q"); if (i) i.value = q; }, 0); } } catch (e) { /* ok */ }
    F = novoF; rota = r;
    if (!mesmaTela) { if (mapa) { try { mapa.remove(); } catch (e) { /* ok */ } } mapa = null; reserva = null; falhas = 0; monta(); }
    var ajustar = r.indexOf("busca-") === 0 && R.rotulo(F).length > 0;
    if (F.pv && R.meusInteresses().length < 2) R.abreInteresses(function () { atualiza(true); });
    atualiza(ajustar);
    if (!ajustar && mapa) setTimeout(function () { mapa.invalidateSize(); }, 50);
  }

  /* ---------- eventos da tela ---------- */
  document.addEventListener("click", function (e) {
    if (!document.querySelector(".mv")) return;
    var b = e.target.closest("[data-mv]");
    if (b) {
      var k = b.dataset.mv;
      if (k === "agora") F.agora = !F.agora;
      else if (k === "hoje" || k === "fds") { F.data = F.data === k ? "" : k; F.de = ""; F.ate = ""; }
      else if (k === "gratis") F.preco = F.preco === "gratis" ? "" : "gratis";
      else if (k === "ate20") F.preco = F.preco === "20" ? "" : "20";
      else if (k === "pv") { if (!F.pv && R.meusInteresses().length < 2) { R.abreInteresses(function () { F.pv = true; mudou(true); }); return; } F.pv = !F.pv; }
      else if (k === "datas" || k === "mais") { maisFiltros(); return; }
      mudou(true); return;
    }
    var g = e.target.closest("[data-mv-g]"); if (g) { F.grupo = F.grupo === g.dataset.mvG ? "" : g.dataset.mvG; mudou(true); return; }
    var rm = e.target.closest("[data-mv-rm]");
    if (rm) { var k = rm.dataset.mvRm; if (k.indexOf("etq:") === 0) F.etq = F.etq.filter(function (x) { return x !== k.slice(4); }); else if (k === "data") { F.data = ""; F.de = ""; F.ate = ""; } else if (k === "cats") F.cats = []; else if (k === "preco" || k === "grupo" || k === "cidade") F[k] = ""; else F[k] = false; mudou(false); return; }
    if (e.target.closest("[data-mv-limpar]")) { F = R.novoFiltro(); var q = $("#mv-q"); if (q) q.value = ""; mudou(false); return; }
    if (e.target.closest("[data-mv-tudo]")) { enquadra(); return; }
    if (e.target.closest("[data-mv-share]")) { R.compartilhar(F, R.rotulo(F).join(" · ") + " no CoraçãoBR"); return; }
    if (e.target.closest("[data-mv-local]") && mapa) { var c = G.Geo && typeof G.Geo.lat === "number" ? [G.Geo.lat, G.Geo.lng] : CENTRO_PADRAO; mapa.setView(c, 13); return; }
  });
  document.addEventListener("submit", function (e) {
    if (e.target.id !== "mv-form") return; e.preventDefault();
    var t = $("#mv-q").value.trim();
    if (!t) { F.q = ""; mudou(false); return; }
    if (R.on("busca")) { var r = R.interpreta(t); F = r.F; atualizaRota(); entendi = r.entendi; atualiza(true); }
    else { F.q = t; mudou(true); }
  });
  /* alça da folha: tocar alterna; arrastar escolhe a altura */
  var fy = null, fh0 = 0;
  document.addEventListener("pointerdown", function (e) { var a = e.target.closest("#mv-alca"); if (!a || grande()) return; fy = e.clientY; fh0 = $("#mv-folha").offsetHeight; a.setPointerCapture(e.pointerId); $(".mv").classList.add("arrastando"); });
  document.addEventListener("pointermove", function (e) { if (fy == null) return; var s = $(".mv"); if (s) s.style.setProperty("--folha", Math.max(120, Math.min(s.clientHeight * 0.9, fh0 + fy - e.clientY)) + "px"); });
  document.addEventListener("pointerup", function (e) {
    if (fy == null) return; var s = $(".mv"), dy = fy - e.clientY; fy = null; if (!s) return; s.classList.remove("arrastando");
    if (Math.abs(dy) < 6) estado = estado === "baixo" ? "meio" : estado === "meio" ? "alto" : "baixo";
    else { var r = $("#mv-folha").offsetHeight / s.clientHeight; estado = r < 0.38 ? "baixo" : r < 0.66 ? "meio" : "alto"; }
    aplicaAltura();
  });
  window.addEventListener("resize", function () { if ($(".mv")) dimensiona(); });

  G.views.mapa = view;
  window.Mapa = { atualizar: function () { if ($(".mv")) atualiza(false); } };
})();
