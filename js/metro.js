/* Metrô e trens de Dallas–Fort Worth (DART Vermelha/Azul/Verde/Laranja, Silver Line, TRE, TEXRail e A-train).
   Dados oficiais GTFS de cada empresa, convertidos em data/metro.json (o servidor atualiza toda semana).
   Abas: Mapa · Linhas · Rota · Estou no trem (acompanha a sua posição real pelo GPS ao longo da linha).
   Os horários dos trens vêm da tabela oficial; a posição do passageiro é em tempo real. */
(function () {
  "use strict";
  var G = window.Guia, esc = G.esc, $ = function (s, r) { return (r || document).querySelector(s); };
  G.IC.train = '<rect x="5" y="3" width="14" height="14" rx="3.5"/><path d="M5 11h14M9 21l1.5-4M15 21l-1.5-4M8.5 14h.01M15.5 14h.01"/>';
  G.IC.swap = '<path d="M7 4v16M7 4 4 7M7 4l3 3M17 20V4M17 20l-3-3M17 20l3-3"/>';
  G.IC.nav = '<path d="M12 2 4.5 20.3 12 16.5l7.5 3.8z"/>';
  var ic = G.ic;
  var D = null, carregando = null, M = { aba: "mapa", est: null, linha: null, sent: 0, de: "", para: "", plano: null }, mapa = null, vivo = { watch: null, ult: null, hist: [], linha: null, alvo: null, avisou: false };

  /* ---------- dados ---------- */
  function carrega() {
    if (D) return Promise.resolve(D); if (carregando) return carregando;
    var srv = Store.servidor && Store.servidor();
    carregando = (srv ? fetch("api/?acao=metro").then(function (r) { if (!r.ok) throw 0; return r.json(); }) : Promise.reject())
      .catch(function () { return fetch("data/metro.json").then(function (r) { return r.json(); }); })
      .then(function (d) { D = d; D.porId = {}; D.linhas.forEach(function (l) { D.porId[l.id] = l; }); return D; });
    return carregando;
  }
  function E(id) { return D.estacoes[id]; }
  function linhasDe(eid) { return (E(eid).linhas || []).map(function (k) { return D.porId[k]; }).filter(Boolean); }
  function dist(a, b, c, d) { var R = 6371000, x = (d - b) * Math.PI / 180 * Math.cos((a + c) / 2 * Math.PI / 180), y = (c - a) * Math.PI / 180; return Math.sqrt(x * x + y * y) * R; }
  function km(m) { return m < 1000 ? Math.round(m / 10) * 10 + " m" : (m / 1000).toFixed(1).replace(".", ",") + " km"; }

  /* ---------- relógio de Dallas e horários ---------- */
  function agora() { var n = window.Horario ? Horario.agoraDallas() : new Date(); return { min: n.getHours() * 60 + n.getMinutes() + n.getSeconds() / 60, dia: n.getDay() }; }
  function tipo(dia) { return dia === 0 ? "d" : dia === 6 ? "s" : "u"; }
  function hhmm(m) { m = ((Math.round(m) % 1440) + 1440) % 1440; return String(Math.floor(m / 60)).padStart(2, "0") + ":" + String(m % 60).padStart(2, "0"); }
  /* próximas partidas (em minutos a partir de "a partir de") de um sentido de linha numa estação */
  function proximos(L, si, eid, n, desde) {
    var S = L.sentidos[si], i = S.estacoes.indexOf(eid); if (i < 0) return [];
    var a = agora(), t0 = desde == null ? a.min : desde, off = S.tempos[i], out = [];
    var hoje = S.saidas[tipo(a.dia)] || [], ontem = S.saidas[tipo((a.dia + 6) % 7)] || [];
    ontem.forEach(function (t) { var x = t + off - 1440; if (x >= t0) out.push(x); });
    hoje.forEach(function (t) { var x = t + off; if (x >= t0) out.push(x); });
    if (out.length < n) (S.saidas[tipo((a.dia + 1) % 7)] || []).forEach(function (t) { out.push(t + off + 1440); });
    out.sort(function (x, y) { return x - y; }); return out.slice(0, n);
  }
  function intervalo(L, si) {
    var a = agora(), xs = (L.sentidos[si].saidas[tipo(a.dia)] || []).filter(function (t) { return t >= a.min - 60 && t <= a.min + 90; });
    if (xs.length < 2) return null; return Math.round((xs[xs.length - 1] - xs[0]) / (xs.length - 1));
  }
  function emMin(x) { var d = Math.round(x - agora().min); return d <= 0 ? "agora" : d < 60 ? d + " min" : hhmm(x); }
  function bolinha(L, peq) { return '<i class="mt-b' + (peq ? " p" : "") + '" style="background:' + L.cor + '" title="' + esc(L.nome) + '"></i>'; }
  function selo(L) { return '<span class="mt-sel" style="--c:' + L.cor + '">' + esc(curto(L)) + "</span>"; }
  function curto(L) { return { red: "Vermelha", blue: "Azul", green: "Verde", orange: "Laranja", silver: "Silver", tre: "TRE", texrail: "TEXRail", "a-train": "A-train" }[L.id] || L.nome; }

  /* ---------- rota (menor tempo com penalidade por baldeação) ---------- */
  function rota(de, para) {
    if (!de || !para || de === para) return null;
    var dist2 = {}, prev = {}, fila = [], TROCA = 6;
    linhasDe(de).forEach(function (L) { L.sentidos.forEach(function (S, si) { if (S.estacoes.indexOf(de) >= 0) { var k = de + "|" + L.id + "|" + si; dist2[k] = 0; fila.push([0, k]); } }); });
    while (fila.length) {
      fila.sort(function (a, b) { return a[0] - b[0]; }); var cur = fila.shift(), c = cur[0], k = cur[1]; if (c > dist2[k]) continue;
      var p = k.split("|"), e = p[0], L = D.porId[p[1]], si = +p[2], S = L.sentidos[si], i = S.estacoes.indexOf(e);
      if (e === para) { var cam = [], x = k; while (x) { cam.unshift(x); x = prev[x]; } return montaPlano(cam, c); }
      var viz = [];
      if (i >= 0 && i < S.estacoes.length - 1) viz.push([S.estacoes[i + 1] + "|" + L.id + "|" + si, S.tempos[i + 1] - S.tempos[i]]);
      linhasDe(e).forEach(function (L2) { L2.sentidos.forEach(function (S2, s2) { if ((L2.id !== L.id || s2 !== si) && S2.estacoes.indexOf(e) >= 0 && S2.estacoes.indexOf(e) < S2.estacoes.length - 1) viz.push([e + "|" + L2.id + "|" + s2, L2.id === L.id ? 30 : TROCA]); }); });
      viz.forEach(function (v) { var nc = c + Math.max(0, v[1]); if (dist2[v[0]] == null || nc < dist2[v[0]]) { dist2[v[0]] = nc; prev[v[0]] = k; fila.push([nc, v[0]]); } });
    }
    return null;
  }
  function montaPlano(cam, custo) {
    var pernas = [];
    cam.forEach(function (k) { var p = k.split("|"), u = pernas[pernas.length - 1]; if (u && u.l === p[1] && u.s === +p[2]) u.ate = p[0]; else pernas.push({ l: p[1], s: +p[2], de: p[0], ate: p[0] }); });
    pernas = pernas.filter(function (x) { return x.de !== x.ate; });
    var t = agora().min, saida = null;
    pernas.forEach(function (x) {
      var L = D.porId[x.l], S = L.sentidos[x.s], ia = S.estacoes.indexOf(x.de), ib = S.estacoes.indexOf(x.ate), nx = proximos(L, x.s, x.de, 1, t)[0];
      x.paradas = ib - ia; x.viagem = S.tempos[ib] - S.tempos[ia]; x.parte = nx; x.chega = nx != null ? nx + x.viagem : null; x.para = S.para;
      if (saida == null) saida = nx; t = x.chega != null ? x.chega + 3 : t + x.viagem + 10;
    });
    var regional = pernas.some(function (x) { return ["tre", "texrail", "a-train"].indexOf(x.l) >= 0; }), soTre = pernas.every(function (x) { return x.l === "tre"; });
    return { pernas: pernas, saida: saida, chegada: pernas.length ? pernas[pernas.length - 1].chega : null, trocas: pernas.length - 1, tarifa: soTre ? ["TRE, viagem simples", 6] : regional ? ["Passe regional diário", 9] : ["Passe local de 3 horas (DART)", 3] };
  }

  /* ---------- tela ---------- */
  function view() {
    G.app.innerHTML = '<section class="block mt"><div class="wrap"><header class="xp-h"><div><p class="eyebrow">Metrô e trens · Dallas–Fort Worth</p><h1 class="page-h">Metrô</h1></div><span class="xp-n" id="mt-n">carregando…</span></header><div id="mt-c"><p class="muted">Carregando as linhas…</p></div></div></section>';
    carrega().then(function () {
      $("#mt-n").textContent = D.linhas.length + " linhas · " + Object.keys(D.estacoes).length + " estações";
      if (!M.de) perto(function (eid) { if (eid && !M.de) M.de = eid; });
      tela();
    }).catch(function () { $("#mt-c").innerHTML = '<div class="note">Não foi possível carregar o mapa do metrô agora.</div>'; });
  }
  function tela() {
    var abas = [["mapa", "Mapa", "pin"], ["linhas", "Linhas", "train"], ["rota", "Rota", "swap"], ["vivo", "Estou no trem", "nav"]];
    $("#mt-c").innerHTML = (vivo.watch != null && M.aba !== "vivo" ? '<button type="button" class="mt-faixa" data-mt-aba="vivo">' + ic("nav") + "<span>Acompanhando sua viagem</span><b>abrir</b></button>" : "") +
      '<nav class="menubar mb-4" aria-label="Metrô">' + abas.map(function (a) { return '<button type="button" class="mb-it" data-mt-aba="' + a[0] + '" aria-pressed="' + (M.aba === a[0]) + '">' + ic(a[2]) + "<span>" + a[1] + "</span></button>"; }).join("") + "</nav>" +
      '<div id="mt-v"></div>' +
      '<p class="mt-fonte">Horários pela tabela oficial (GTFS) de ' + D.fontes.map(function (f) { return esc(f.sistema); }).join(", ") + ", atualizada em " + esc(String(D.atualizado).slice(0, 10).split("-").reverse().join("/")) + ". Não é a posição dos trens em tempo real; a sua posição, no modo Estou no trem, é em tempo real.</p>";
    if (mapa) { mapa.remove(); mapa = null; }
    ({ mapa: vMapa, linhas: vLinhas, rota: vRota, vivo: vVivo })[M.aba]($("#mt-v"));
  }
  document.addEventListener("click", function (e) {
    if (!e.target.closest(".mt")) return;
    var b;
    if ((b = e.target.closest("[data-mt-aba]"))) { M.aba = b.dataset.mtAba; tela(); return; }
    if ((b = e.target.closest("[data-mt-est]"))) { M.est = b.dataset.mtEst; if (M.aba !== "mapa") { M.aba = "mapa"; tela(); } else { painel(); if (mapa) mapa.flyTo([E(M.est).lat, E(M.est).lng], 14, { duration: .6 }); } return; }
    if ((b = e.target.closest("[data-mt-linha]"))) { M.linha = b.dataset.mtLinha; M.sent = 0; M.aba = "linhas"; tela(); return; }
    if ((b = e.target.closest("[data-mt-sent]"))) { M.sent = +b.dataset.mtSent; tela(); return; }
    if (e.target.closest("[data-mt-voltar]")) { M.linha = null; tela(); return; }
    if ((b = e.target.closest("[data-mt-de]"))) { M.de = b.dataset.mtDe; M.aba = "rota"; tela(); return; }
    if ((b = e.target.closest("[data-mt-para]"))) { M.para = b.dataset.mtPara; M.aba = "rota"; tela(); return; }
    if (e.target.closest("[data-mt-troca]")) { var t = M.de; M.de = M.para; M.para = t; tela(); return; }
    if (e.target.closest("[data-mt-perto]")) { perto(function (eid, d) { if (!eid) { G.toast("Ative a localização para achar a estação mais perto."); return; } M.de = eid; G.toast("Estação mais perto: " + E(eid).nome + " (" + km(d) + ")."); tela(); }, true); return; }
    if (e.target.closest("[data-mt-iniciar]")) { vivo.alvo = M.para; vivo.avisou = false; M.aba = "vivo"; tela(); liga(); return; }
    if (e.target.closest("[data-mt-ligar]")) { liga(); return; }
    if (e.target.closest("[data-mt-parar]")) { para(); tela(); return; }
    if ((b = e.target.closest("[data-mt-vl]"))) { vivo.linha = b.dataset.mtVl; atualizaVivo(); return; }
    if ((b = e.target.closest("[data-mt-alvo]"))) { vivo.alvo = b.dataset.mtAlvo || null; vivo.avisou = false; atualizaVivo(); }
  });
  document.addEventListener("change", function (e) {
    if (!e.target.closest(".mt")) return;
    if (e.target.id === "mt-de" || e.target.id === "mt-para") { M[e.target.id === "mt-de" ? "de" : "para"] = e.target.value; tela(); }
    if (e.target.id === "mt-alvo") { vivo.alvo = e.target.value || null; vivo.avisou = false; atualizaVivo(); }
  });
  function perto(cb, pedir) {
    var ok = function (p) { var me = null, md = 1e12; Object.keys(D.estacoes).forEach(function (k) { var d = dist(p.coords.latitude, p.coords.longitude, E(k).lat, E(k).lng); if (d < md) { md = d; me = k; } }); cb(me, md, p); };
    if (G.Geo && G.Geo.gps && !pedir) { ok({ coords: { latitude: G.Geo.lat, longitude: G.Geo.lng } }); return; }
    if (!pedir || !navigator.geolocation) { cb(null); return; }
    navigator.geolocation.getCurrentPosition(ok, function () { cb(null); }, { enableHighAccuracy: true, timeout: 10000, maximumAge: 30000 });
  }

  /* ----- Mapa ----- */
  function css() { if (document.getElementById("css-leaflet")) return Promise.resolve(); return fetch("vendor/leaflet.css").then(function (r) { return r.text(); }).then(function (t) { if (!document.getElementById("css-leaflet")) { var s = document.createElement("style"); s.id = "css-leaflet"; s.textContent = t; document.head.appendChild(s); } }).catch(function () {}); }
  function vMapa(el) {
    el.innerHTML = '<div class="mt-mapa"><div class="mt-m" id="mt-mapa"></div><aside class="mt-p" id="mt-p"></aside></div>';
    painel();
    if (!window.L) { $("#mt-mapa").innerHTML = '<p class="muted" style="padding:20px">Mapa indisponível.</p>'; return; }
    var box = $("#mt-mapa");
    css().then(function () {
      if (!document.body.contains(box) || box._leaflet_id) return;
      var c = Object.assign({ tiles: "https://tile.openstreetmap.org/{z}/{x}/{y}.png", atribuicao: "© OpenStreetMap" }, G.config().mapa || {});
      mapa = L.map(box, { zoomControl: false, attributionControl: true }).setView([32.84, -96.95], 10);
      L.control.zoom({ position: "topright" }).addTo(mapa);
      if (c.tiles) L.tileLayer(c.tiles, { maxZoom: 19, attribution: c.atribuicao || "", className: "mt-tiles" }).addTo(mapa);
      var lim = L.latLngBounds([]);
      D.linhas.forEach(function (Ln) { var sh = Ln.sentidos[0].shape; if (!sh.length) return; L.polyline(sh, { color: "#fff", weight: 9, opacity: .9 }).addTo(mapa); L.polyline(sh, { color: Ln.cor, weight: 5, opacity: .95 }).addTo(mapa).bindTooltip(Ln.nome, { sticky: true }); sh.forEach(function (p) { lim.extend(p); }); });
      Object.keys(D.estacoes).forEach(function (k) {
        var e = E(k), tr = e.linhas.length > 1;
        L.circleMarker([e.lat, e.lng], { radius: tr ? 7 : 5, color: "#0E1311", weight: tr ? 3 : 2, fillColor: "#fff", fillOpacity: 1 }).addTo(mapa).bindTooltip(e.nome, { direction: "top", offset: [0, -6] }).on("click", function () { M.est = k; painel(); });
      });
      if (lim.isValid()) mapa.fitBounds(lim, { padding: [20, 20] });
      if (M.est) mapa.setView([E(M.est).lat, E(M.est).lng], 14);
      if (G.Geo && G.Geo.gps) L.circleMarker([G.Geo.lat, G.Geo.lng], { radius: 8, color: "#fff", weight: 3, fillColor: "#2F7DD3", fillOpacity: 1 }).addTo(mapa).bindTooltip("Você");
      setTimeout(function () { if (mapa) mapa.invalidateSize(); }, 200);
    });
  }
  function painel() {
    var p = $("#mt-p"); if (!p) return;
    if (!M.est) {
      p.innerHTML = '<div class="xp-box"><p class="xp-t">Linhas</p>' + D.linhas.map(function (L) { return '<button type="button" class="mt-li" data-mt-linha="' + L.id + '">' + bolinha(L) + "<span><b>" + esc(L.nome) + "</b><small>" + esc(L.sentidos[0].para) + " ↔ " + esc(L.sentidos[1] ? L.sentidos[1].para : "") + "</small></span>" + ic("arrow") + "</button>"; }).join("") + '</div><p class="small muted">Toque numa estação no mapa para ver os próximos trens e o que tem perto.</p>';
      return;
    }
    var e = E(M.est), ls = linhasDe(M.est);
    var prox = ls.map(function (L) {
      return L.sentidos.map(function (S, si) { var i = S.estacoes.indexOf(M.est); if (i < 0 || i === S.estacoes.length - 1) return ""; var xs = proximos(L, si, M.est, 3); return '<div class="mt-px">' + bolinha(L, 1) + "<span><b>sentido " + esc(S.para) + "</b><small>" + (xs.length ? xs.map(function (x, j) { return j ? hhmm(x) : "<em>" + emMin(x) + "</em>"; }).join(" · ") : "sem mais trens hoje") + "</small></span></div>"; }).join("");
    }).join("");
    var lugares = G.lugares().filter(function (l) { return l.lat != null && dist(e.lat, e.lng, l.lat, l.lng) < 900; }).sort(function (a, b) { return dist(e.lat, e.lng, a.lat, a.lng) - dist(e.lat, e.lng, b.lat, b.lng); });
    lugares = G.primeiro(lugares).slice(0, 6);
    p.innerHTML = '<div class="xp-box mt-est"><div class="mt-eh"><div><p class="xp-t">Estação</p><h2>' + esc(e.nome) + '</h2></div><button type="button" class="lv-b" data-mt-est="" aria-label="Fechar" onclick="this.closest(\'.mt\')">' + ic("x") + "</button></div>" +
      '<div class="row" style="gap:6px">' + ls.map(selo).join("") + "</div>" +
      '<div class="mt-pxs"><p class="xp-t">Próximos trens</p>' + (prox || '<p class="small muted">Sem partidas daqui.</p>') + "</div>" +
      '<div class="row" style="gap:8px"><button type="button" class="btn sm" data-mt-de="' + M.est + '">' + ic("swap") + ' Sair daqui</button><button type="button" class="btn ghost sm" data-mt-para="' + M.est + '">Ir para cá</button><a class="btn ghost sm" target="_blank" rel="noopener" href="https://www.google.com/maps/dir/?api=1&destination=' + e.lat + "," + e.lng + '&travelmode=walking">' + ic("walk") + " A pé</a></div></div>" +
      (lugares.length ? '<div class="xp-box"><p class="xp-t">Perto da estação · até 900 m</p>' + lugares.map(function (l) { return '<a class="pg-prev" href="#lugar-' + esc(l.id) + '">' + (G.foto(l) ? '<img src="' + esc(G.foto(l)) + '" alt="" loading="lazy">' : "<span></span>") + "<b>" + esc(l.nome) + '<small class="mt-dm">' + km(dist(e.lat, e.lng, l.lat, l.lng)) + " a pé · " + esc(G.CATS[l.categoria] || "") + "</small></b>" + ic("arrow") + "</a>"; }).join("") + "</div>" : "");
  }
  document.addEventListener("click", function (e) { var b = e.target.closest('.mt-est [data-mt-est=""]'); if (b) { e.stopPropagation(); M.est = null; painel(); } }, true);

  /* ----- Linhas ----- */
  function vLinhas(el) {
    if (!M.linha) {
      el.innerHTML = '<div class="mt-grid">' + D.linhas.map(function (L) {
        var S = L.sentidos[0], iv = intervalo(L, 0), nx = proximos(L, 0, S.estacoes[0], 1)[0];
        return '<button type="button" class="mt-card" data-mt-linha="' + L.id + '" style="--c:' + L.cor + '"><span class="mt-cb"></span><span class="mt-ct"><small>' + esc(L.sistema) + "</small><b>" + esc(L.nome) + "</b><span>" + esc(S.para) + " ↔ " + esc(L.sentidos[1] ? L.sentidos[1].para : "") + '</span></span><span class="mt-cn"><span><b>' + S.estacoes.length + "</b><small>estações</small></span><span><b>" + S.tempos[S.tempos.length - 1] + "</b><small>min ponta a ponta</small></span><span><b>" + (iv ? iv : "–") + "</b><small>" + (iv ? "min entre trens agora" : nx != null ? "próximo às " + hhmm(nx) : "sem trens agora") + "</small></span></span></button>";
      }).join("") + "</div>" + tarifas();
      return;
    }
    var L = D.porId[M.linha], S = L.sentidos[M.sent] || L.sentidos[0], iv = intervalo(L, M.sent), a = agora(), sd = S.saidas[tipo(a.dia)] || [];
    el.innerHTML = '<div class="mt-ld" style="--c:' + L.cor + '"><button type="button" class="more" data-mt-voltar>← todas as linhas</button>' +
      '<div class="mt-lh"><span class="mt-cb"></span><div><p class="eyebrow">' + esc(L.sistema) + '</p><h2>' + esc(L.nome) + "</h2></div></div>" +
      (L.sentidos.length > 1 ? '<div class="mt-sents">' + L.sentidos.map(function (x, i) { return '<button type="button" data-mt-sent="' + i + '" aria-pressed="' + (i === M.sent) + '">sentido <b>' + esc(x.para) + "</b></button>"; }).join("") + "</div>" : "") +
      '<dl class="an-st mt-st"><div><dt>Primeiro trem</dt><dd>' + (sd.length ? hhmm(sd[0]) : "–") + "</dd></div><div><dt>Último trem</dt><dd>" + (sd.length ? hhmm(sd[sd.length - 1]) : "–") + "</dd></div><div><dt>Intervalo agora</dt><dd>" + (iv ? iv + " min" : "–") + "</dd></div></dl>" +
      '<ol class="mt-diag">' + S.estacoes.map(function (eid, i) {
        var e = E(eid), outras = linhasDe(eid).filter(function (x) { return x.id !== L.id; }), nx = i < S.estacoes.length - 1 ? proximos(L, M.sent, eid, 1)[0] : null;
        return '<li class="' + (outras.length ? "tr" : "") + (i === 0 || i === S.estacoes.length - 1 ? " ponta" : "") + '"><span class="mt-dt">' + (S.tempos[i] ? "+" + S.tempos[i] + " min" : "início") + '</span><i class="mt-dd"></i><button type="button" class="mt-dn" data-mt-est="' + eid + '"><b>' + esc(e.nome) + "</b>" + (outras.length ? '<span class="row" style="gap:4px">' + outras.map(selo).join("") + "</span>" : "") + "</button>" + (nx != null ? '<span class="mt-dx">' + emMin(nx) + "</span>" : "") + "</li>";
      }).join("") + "</ol></div>";
  }
  function tarifas() { return D.tarifas ? '<div class="xp-box mt-tar"><p class="xp-t">Tarifas</p>' + D.tarifas.itens.map(function (t) { return '<div class="mt-tr"><span>' + esc(t[0]) + "</span><b>" + G.usd(t[1]) + "</b></div>"; }).join("") + '<p class="small muted">Fonte: ' + esc(D.tarifas.fonte) + '. Compre pelo app GoPass ou nas máquinas das estações.</p></div>' : ""; }

  /* ----- Rota ----- */
  function opcoes(sel) { return '<option value="">Escolha a estação</option>' + Object.keys(D.estacoes).sort(function (a, b) { return E(a).nome.localeCompare(E(b).nome); }).map(function (k) { return '<option value="' + k + '"' + (k === sel ? " selected" : "") + ">" + esc(E(k).nome) + "</option>"; }).join(""); }
  function vRota(el) {
    var P = rota(M.de, M.para); M.plano = P;
    el.innerHTML = '<div class="mt-rota"><div class="xp-box mt-form"><div class="field"><label for="mt-de">Saindo de</label><select id="mt-de">' + opcoes(M.de) + '</select></div><button type="button" class="lv-b mt-sw" data-mt-troca aria-label="Inverter">' + ic("swap") + '</button><div class="field"><label for="mt-para">Indo para</label><select id="mt-para">' + opcoes(M.para) + "</select></div>" +
      '<button type="button" class="btn ghost sm" data-mt-perto>' + ic("nav") + " Usar a estação mais perto de mim</button></div>" +
      (P ? '<div class="mt-res"><div class="mt-sum"><div><small>Saída</small><b>' + (P.saida != null ? hhmm(P.saida) : "–") + "</b></div><div><small>Chegada</small><b>" + (P.chegada != null ? hhmm(P.chegada) : "–") + "</b></div><div><small>Tempo</small><b>" + (P.saida != null && P.chegada != null ? Math.round(P.chegada - agora().min) + " min" : "–") + "</b></div><div><small>Baldeações</small><b>" + P.trocas + "</b></div></div>" +
        '<ol class="mt-tl">' + P.pernas.map(function (x, i) { var L = D.porId[x.l]; return '<li style="--c:' + L.cor + '"><div class="mt-tlh">' + selo(L) + "<span>sentido <b>" + esc(x.para) + "</b></span></div>" +
          '<div class="mt-tlb"><p><b>' + (x.parte != null ? hhmm(x.parte) : "") + "</b> embarque em <b>" + esc(E(x.de).nome) + "</b>" + (x.parte != null ? ' <em>(' + emMin(x.parte) + ")</em>" : "") + "</p><p class=\"muted small\">" + x.paradas + (x.paradas === 1 ? " parada" : " paradas") + " · " + x.viagem + " min</p><p><b>" + (x.chega != null ? hhmm(x.chega) : "") + "</b> desça em <b>" + esc(E(x.ate).nome) + "</b></p>" + (i < P.pernas.length - 1 ? '<p class="mt-troca">' + ic("walk") + " Baldeação: troque de trem na mesma estação</p>" : "") + "</div></li>"; }).join("") + "</ol>" +
        '<div class="mt-tf"><span>' + esc(P.tarifa[0]) + "</span><b>" + G.usd(P.tarifa[1]) + "</b></div>" +
        '<button type="button" class="btn mt-go" data-mt-iniciar>' + ic("nav") + " Iniciar viagem e me avisar onde descer</button></div>"
        : M.de && M.para ? '<div class="note">Não achamos ligação por trilhos entre essas estações.</div>' : '<div class="note">Escolha a estação de saída e a de destino. O guia calcula o caminho mais rápido, as baldeações e os horários.</div>') + "</div>";
  }

  /* ----- Estou no trem ----- */
  function vVivo(el) {
    el.innerHTML = '<div class="mt-vivo"><div class="xp-box mt-vc" id="mt-vc"></div><div class="xp-box"><p class="xp-t">Avisar quando chegar em</p><select id="mt-alvo" class="mt-sel2">' + opcoes(vivo.alvo || "").replace("Escolha a estação", "Nenhuma (só acompanhar)") + '</select><p class="small muted">Com o destino escolhido, o guia avisa (e vibra o celular) uma estação antes de descer.</p></div></div>';
    atualizaVivo();
  }
  function liga() {
    if (!navigator.geolocation) { G.toast("Este navegador não tem localização."); return; }
    if (vivo.watch != null) { atualizaVivo(); return; }
    vivo.hist = []; vivo.ult = null;
    try { if ("Notification" in window && Notification.permission === "default") Notification.requestPermission(); } catch (e) { /* ok */ }
    vivo.watch = navigator.geolocation.watchPosition(function (p) { vivo.ult = p; vivo.hist.push({ t: Date.now(), lat: p.coords.latitude, lng: p.coords.longitude }); if (vivo.hist.length > 12) vivo.hist.shift(); atualizaVivo(); },
      function (er) { vivo.erro = er && er.code === 1 ? "A localização foi negada. Libere a localização deste site nas configurações do navegador." : "Não foi possível ler a localização."; atualizaVivo(); },
      { enableHighAccuracy: true, maximumAge: 3000, timeout: 20000 });
    atualizaVivo();
  }
  function para() { if (vivo.watch != null) navigator.geolocation.clearWatch(vivo.watch); vivo.watch = null; vivo.ult = null; vivo.hist = []; }
  /* projeta a posição nos trechos entre estações de cada linha */
  function onde(lat, lng) {
    var cands = [];
    D.linhas.forEach(function (L) {
      var S = L.sentidos[0], best = null;
      for (var i = 0; i < S.estacoes.length - 1; i++) {
        var a = E(S.estacoes[i]), b = E(S.estacoes[i + 1]), kx = Math.cos(lat * Math.PI / 180) * 111320, ky = 110540;
        var ax = (a.lng - lng) * kx, ay = (a.lat - lat) * ky, bx = (b.lng - lng) * kx, by = (b.lat - lat) * ky, dx = bx - ax, dy = by - ay, L2 = dx * dx + dy * dy || 1;
        var t = Math.max(0, Math.min(1, -(ax * dx + ay * dy) / L2)), px = ax + t * dx, py = ay + t * dy, d = Math.sqrt(px * px + py * py);
        if (!best || d < best.d) best = { d: d, i: i, t: t };
      }
      if (best && best.d < 450) cands.push({ L: L, d: best.d, pos: best.i + best.t });
    });
    return cands.sort(function (a, b) { return a.d - b.d; });
  }
  function atualizaVivo() {
    var el = $("#mt-vc"); if (!el) { if (M.aba !== "vivo" && document.querySelector(".mt-faixa") == null && vivo.watch != null && document.querySelector(".mt")) tela(); return; }
    if (vivo.watch == null) {
      el.innerHTML = '<div class="mt-vi">' + ic("nav") + '<div><b>Acompanhe a viagem em tempo real</b><p class="small muted">Ative a localização e o guia mostra em que linha você está, a próxima estação, quanto falta e avisa onde descer. A localização fica só no seu aparelho.</p></div></div><button type="button" class="btn" data-mt-ligar>' + ic("nav") + " Ativar localização</button>" + (vivo.erro ? '<p class="note">' + esc(vivo.erro) + "</p>" : "");
      return;
    }
    var p = vivo.ult;
    if (!p) { el.innerHTML = '<div class="mt-vi"><span class="mt-pulse"></span><div><b>Procurando sua posição…</b><p class="small muted">Dentro do trem o GPS pode demorar alguns segundos.</p></div></div><button type="button" class="btn ghost sm" data-mt-parar>Parar</button>' + (vivo.erro ? '<p class="note">' + esc(vivo.erro) + "</p>" : ""); return; }
    var lat = p.coords.latitude, lng = p.coords.longitude, cs = onde(lat, lng);
    if (!cs.length) {
      var me = null, md = 1e12; Object.keys(D.estacoes).forEach(function (k) { var d = dist(lat, lng, E(k).lat, E(k).lng); if (d < md) { md = d; me = k; } });
      el.innerHTML = '<div class="mt-vi"><span class="mt-pulse"></span><div><b>Você não está numa linha de trem</b><p class="small muted">Estação mais perto: <b>' + esc(E(me).nome) + "</b>, a " + km(md) + ".</p></div></div>" +
        '<div class="row" style="gap:8px"><button type="button" class="btn sm" data-mt-est="' + me + '">Ver a estação</button><a class="btn ghost sm" target="_blank" rel="noopener" href="https://www.google.com/maps/dir/?api=1&destination=' + E(me).lat + "," + E(me).lng + '&travelmode=walking">' + ic("walk") + ' Ir a pé</a><button type="button" class="btn ghost sm" data-mt-parar>Parar</button></div>';
      return;
    }
    var plan = M.plano && M.plano.pernas.map(function (x) { return x.l; }) || [];
    var c = cs.filter(function (x) { return x.L.id === vivo.linha; })[0] || cs.filter(function (x) { return plan.indexOf(x.L.id) >= 0; })[0] || cs[0];
    vivo.linha = c.L.id;
    var L = c.L, S0 = L.sentidos[0];
    // sentido pelo movimento: posição ao longo da linha aumentando = sentido 0
    var h = vivo.hist, dir = null;
    if (h.length >= 2) { var o = onde(h[0].lat, h[0].lng).filter(function (x) { return x.L.id === L.id; })[0]; if (o && Math.abs(c.pos - o.pos) > .04) dir = c.pos > o.pos ? 0 : 1; }
    if (dir == null && vivo.alvo) { var ia = S0.estacoes.indexOf(vivo.alvo); if (ia >= 0) dir = ia > c.pos ? 0 : 1; }
    var seq = dir === 1 ? S0.estacoes.slice().reverse() : S0.estacoes, pos = dir === 1 ? (S0.estacoes.length - 1 - c.pos) : c.pos, iNext = Math.min(seq.length - 1, Math.floor(pos + 1e-6) + 1);
    var nxt = E(seq[iNext]), dNext = dist(lat, lng, nxt.lat, nxt.lng);
    var vel = p.coords.speed != null && p.coords.speed > 2 && p.coords.speed < 45 ? p.coords.speed : null;
    if (!vel && h.length >= 2) { var a0 = h[0], a1 = h[h.length - 1], dt = (a1.t - a0.t) / 1000; if (dt > 4) { var v2 = dist(a0.lat, a0.lng, a1.lat, a1.lng) / dt; if (v2 > 2 && v2 < 45) vel = v2; } }
    var Sd = L.sentidos[dir === 1 ? 1 : 0] || S0, ti = Sd.estacoes.indexOf(seq[iNext]), tp = Sd.estacoes.indexOf(seq[Math.max(0, iNext - 1)]);
    var segMin = ti > 0 && tp >= 0 ? Math.abs(Sd.tempos[ti] - Sd.tempos[tp]) : 2, eta = vel ? dNext / vel / 60 : segMin * (1 - (pos % 1));
    var alvoI = vivo.alvo ? seq.indexOf(vivo.alvo) : -1, faltam = alvoI >= 0 ? alvoI - iNext + 1 : null;
    if (alvoI >= 0 && alvoI >= iNext) {
      var etaAlvo = eta + (Sd.estacoes.indexOf(vivo.alvo) >= 0 && ti >= 0 ? Math.abs(Sd.tempos[Sd.estacoes.indexOf(vivo.alvo)] - Sd.tempos[ti]) : 0);
      if (!vivo.avisou && (alvoI === iNext || (alvoI === iNext + 0 && dNext < 900))) { vivo.avisou = true; avisa(alvoI === iNext ? "Prepare-se: a próxima estação é " + E(vivo.alvo).nome + ". Desça nela." : "Seu destino está chegando."); }
    }
    el.innerHTML = '<div class="mt-vh" style="--c:' + L.cor + '"><span class="mt-pulse"></span><div><small>Você está na</small><b>' + esc(L.nome) + "</b>" + (dir != null ? "<span>sentido " + esc(dir === 1 ? (L.sentidos[1] || {}).para || S0.estacoes[0] : S0.para) + "</span>" : "<span>descobrindo o sentido…</span>") + "</div></div>" +
      (cs.length > 1 ? '<div class="row" style="gap:6px"><span class="small muted">Trecho com mais de uma linha:</span>' + cs.filter(function (x, i, a) { return a.findIndex(function (y) { return y.L.id === x.L.id; }) === i; }).map(function (x) { return '<button type="button" class="mt-sel' + (x.L.id === L.id ? " on" : "") + '" style="--c:' + x.L.cor + '" data-mt-vl="' + x.L.id + '">' + esc(curto(x.L)) + "</button>"; }).join("") + "</div>" : "") +
      '<div class="mt-vn"><small>Próxima estação</small><b>' + esc(nxt.nome) + '</b><div class="mt-vm"><span><b>' + (eta < 1 ? "&lt;1" : Math.round(eta)) + "</b> min</span><span><b>" + km(dNext) + "</b></span>" + (vel ? "<span><b>" + Math.round(vel * 2.237) + "</b> mph</span>" : "") + "</div></div>" +
      (faltam != null && faltam > 0 ? '<div class="mt-va' + (faltam === 1 ? " ja" : "") + '">' + (faltam === 1 ? "Desça na próxima estação: <b>" + esc(E(vivo.alvo).nome) + "</b>" : "Faltam <b>" + faltam + "</b> estações até <b>" + esc(E(vivo.alvo).nome) + "</b>" + (etaAlvo ? " · cerca de " + Math.round(etaAlvo) + " min" : "")) + "</div>" : faltam != null && faltam <= 0 ? '<div class="mt-va">Seu destino não está à frente neste sentido.</div>' : "") +
      '<ol class="mt-prox">' + seq.slice(Math.max(0, iNext - 1), iNext + 5).map(function (eid, k) { var i = Math.max(0, iNext - 1) + k; return '<li class="' + (i < iNext ? "pass" : i === iNext ? "now" : "") + (eid === vivo.alvo ? " alvo" : "") + '"><i></i><span>' + esc(E(eid).nome) + "</span>" + (linhasDe(eid).length > 1 ? '<span class="row" style="gap:3px">' + linhasDe(eid).filter(function (x) { return x.id !== L.id; }).map(function (x) { return bolinha(x, 1); }).join("") + "</span>" : "") + "</li>"; }).join("") + "</ol>" +
      '<p class="small muted">Precisão do GPS: ' + Math.round(p.coords.accuracy || 0) + ' m · atualizado às ' + hhmm(agora().min) + '</p><button type="button" class="btn ghost sm" data-mt-parar>Parar de acompanhar</button>';
  }
  function avisa(msg) {
    G.toast(msg); try { navigator.vibrate && navigator.vibrate([300, 120, 300]); } catch (e) { /* ok */ }
    try { if ("Notification" in window && Notification.permission === "granted") new Notification("CoraçãoBR · Metrô", { body: msg, icon: "icon-192.png" }); } catch (e) { /* ok */ }
  }
  setInterval(function () { if (M.aba === "linhas" && document.querySelector(".mt-ld,.mt-grid")) { /* horários relativos */ var y = window.scrollY; tela(); window.scrollTo(0, y); } else if (M.aba === "mapa" && M.est && document.querySelector(".mt-est")) painel(); }, 60000);
  window.addEventListener("hashchange", function () { if (location.hash !== "#metro" && vivo.watch == null && mapa) { mapa.remove(); mapa = null; } });

  G.views.metro = view;
  window.Metro = { carrega: carrega, rota: function (a, b) { return rota(a, b); }, onde: function (a, b) { return onde(a, b); }, dados: function () { return D; }, estado: M, vivo: vivo };
})();
