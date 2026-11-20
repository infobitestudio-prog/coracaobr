/* Recursos extras: aberto agora, favoritos e Minha lista, roteiros prontos, eventos na página inicial,
   guia de chegada, kit de divulgação com imagem e QR code, e instalação como aplicativo. */
(function () {
  "use strict";
  var G = window.Guia, esc = G.esc, ic = G.ic, $ = function (s, r) { return (r || document).querySelector(s); };
  var CORACAO = '<svg class="i" viewBox="0 0 24 24" aria-hidden="true"><path d="M12 20s-7-4.4-7-10a4 4 0 0 1 7-2.5A4 4 0 0 1 19 10c0 5.6-7 10-7 10z"/></svg>';

  /* ---------- aberto agora ----------
     Só responde quando o horário cadastrado é inequívoco ("Diariamente 10h–17h", "Seg a dom 11h às 22h", "24 horas").
     Em qualquer outro formato devolve null e nada é mostrado, para não afirmar o que não se sabe. */
  function aberto(l) { var a = window.Horario ? Horario.agora(l) : null; return a ? a.aberto : null; }
  function selos() { return ""; }

  /* ---------- favoritos e Minha lista ---------- */
  function lista() { try { return JSON.parse(localStorage.getItem("lista") || "[]"); } catch (e) { return []; } }
  function salva(a) { try { localStorage.setItem("lista", JSON.stringify(a)); } catch (e) { G.toast("Este navegador não deixou salvar a lista."); } }
  function botaoFav(l) { return '<button type="button" class="round fav" data-fav="' + esc(l.id) + '" aria-pressed="' + (lista().indexOf(l.id) >= 0) + '" aria-label="Salvar na minha lista">' + CORACAO + "</button>"; }
  document.addEventListener("click", function (e) {
    var b = e.target.closest("[data-fav]"); if (!b) return;
    var a = lista(), i = a.indexOf(b.dataset.fav);
    if (i >= 0) a.splice(i, 1); else a.push(b.dataset.fav);
    salva(a); b.setAttribute("aria-pressed", i < 0); G.toast(i < 0 ? "Salvo na sua lista." : "Removido da sua lista.");
  });
  function carro(km) { if (km == null) return null; var r = km * 1.35, v = r < 5 ? 30 : r < 20 ? 50 : 75; return Math.max(2, Math.round(r / v * 60)); }
  function dur(m) { return m < 60 ? m + " min" : Math.floor(m / 60) + "h" + (m % 60 ? String(m % 60).padStart(2, "0") : ""); }
  function mapsRota(ls) {
    var pt = function (l) { return l.lat != null ? l.lat + "," + l.lng : encodeURIComponent(l.nome + ", " + (l.endereco || "")); };
    if (!ls.length) return "";
    return "https://www.google.com/maps/dir/?api=1&travelmode=driving&destination=" + pt(ls[ls.length - 1]) + (ls.length > 1 ? "&waypoints=" + ls.slice(0, -1).map(pt).join("%7C") : "") + (G.Geo.gps ? "&origin=" + G.Geo.lat.toFixed(5) + "," + G.Geo.lng.toFixed(5) : "");
  }
  function paradas(ls, editar) {
    var total = 0, html = "";
    ls.forEach(function (l, i) {
      if (i) { var m = carro(G.dist(ls[i - 1], l)); if (m != null) { total += m; html += '<div class="leg">' + dur(m) + " de carro</div>"; } }
      var f = G.foto(l);
      html += '<div class="lrow" style="cursor:default' + (editar ? ";grid-template-columns:auto 58px minmax(0,1fr) auto" : "") + '"><span class="pos num">' + (i + 1) + '</span><a class="th" aria-label="' + esc(l.nome) + '" href="#lugar-' + esc(l.id) + '">' + (f ? '<img src="' + esc(f) + '" alt="" loading="lazy">' : "") + '</a><a href="#lugar-' + esc(l.id) + '" style="text-decoration:none;color:inherit;min-width:0"><b>' + esc(l.nome) + "</b><small>" + esc(G.CATS[l.categoria] || "") + " · " + esc(l.tipo === "estabelecimento" ? (l.faixaPreco || G.regiao(l)) : l.gratuito ? "Grátis" : l.precoMin > 0 ? G.usd(l.precoMin) : "Pago") + "</small></a>" +
        (editar ? '<span class="row" style="gap:4px;flex-wrap:nowrap"><button type="button" class="mini" data-sobe="' + i + '" aria-label="Subir"' + (i ? "" : " disabled") + ">↑</button><button type=\"button\" class=\"mini\" data-desce=\"" + i + '" aria-label="Descer"' + (i < ls.length - 1 ? "" : " disabled") + '>↓</button><button type="button" class="mini" data-fora="' + i + '" aria-label="Remover">×</button></span>' : '<span class="val num">' + (G.tempo(l, "carro") || "") + "</span>") + "</div>";
    });
    return { html: html, total: total };
  }
  function viewLista() {
    var ls = lista().map(function (id) { return Store.obter("lugares", id); }).filter(Boolean), p = paradas(ls, true);
    G.app.innerHTML = '<section class="block"><div class="wrap stack in" style="max-width:720px"><div><p class="eyebrow">Seu roteiro</p><h1 class="page-h" style="margin-top:4px">Minha lista</h1><p class="muted" style="margin-top:6px">' + (ls.length ? ls.length + (ls.length === 1 ? " parada" : " paradas") + (p.total ? " · " + dur(p.total) + " de carro entre elas" : "") + ". Use as setas para definir a ordem da visita." : "Toque no coração de um lugar para guardá-lo aqui e montar o roteiro do seu dia.") + "</p></div>" +
      (ls.length ? '<div class="list" id="paradas">' + p.html + '</div><div class="row"><a class="btn" href="' + esc(mapsRota(ls)) + '" target="_blank" rel="noopener">' + ic("pin") + ' Abrir rota no Maps</a><button type="button" class="btn ghost" id="limpar">Limpar lista</button></div><p class="small muted">Os tempos entre as paradas são estimativas pela distância. A lista fica guardada só neste aparelho.</p>' : '<a class="btn" href="#explorar">Explorar lugares</a><a class="btn ghost" href="#roteiros">Ver roteiros prontos</a>') + "</div></section>";
    var el = $("#paradas");
    if (el) el.onclick = function (e) {
      var a = lista(), s = e.target.closest("[data-sobe]"), d = e.target.closest("[data-desce]"), f = e.target.closest("[data-fora]"), i;
      if (s) { i = Number(s.dataset.sobe); a.splice(i - 1, 0, a.splice(i, 1)[0]); }
      else if (d) { i = Number(d.dataset.desce); a.splice(i + 1, 0, a.splice(i, 1)[0]); }
      else if (f) a.splice(Number(f.dataset.fora), 1); else return;
      salva(a); viewLista();
    };
    var lp = $("#limpar"); if (lp) lp.onclick = function () { if (!lp.dataset.ok) { lp.dataset.ok = "1"; lp.textContent = "Confirmar"; return; } salva([]); viewLista(); };
  }

  /* ---------- roteiros prontos ---------- */
  var ROTEIROS = [
    { id: "dallas-em-1-dia", nome: "Dallas em 1 dia", sub: "O essencial do centro, a pé e de carro", texto: "Comece pela história de Kennedy, atravesse o centro pelos bois de bronze, almoce churrasco texano em Deep Ellum e feche com o pôr do sol do alto da torre.", paradas: ["sixth-floor-museum", "dealey-plaza", "pioneer-plaza", "pecan-lodge", "klyde-warren-park", "dallas-museum-of-art", "reunion-tower"] },
    { id: "dallas-de-graca", nome: "Dallas sem gastar com entrada", sub: "Um dia inteiro só com lugares gratuitos", texto: "Praças históricas, um museu de arte de primeira linha, o parque sobre a rodovia e um fim de tarde no bairro mais charmoso da cidade.", paradas: ["dealey-plaza", "jfk-memorial-plaza", "thanks-giving-square", "dallas-museum-of-art", "klyde-warren-park", "katy-trail", "bishop-arts-district"] },
    { id: "com-criancas", nome: "Fim de semana com crianças", sub: "Ciência, bichos e parque", texto: "Dois dias pensados para os pequenos: museu interativo e parque no primeiro, aquário e zoológico no segundo.", paradas: ["perot-museum", "klyde-warren-park", "dallas-world-aquarium", "dallas-zoo", "dallas-arboretum"] },
    { id: "fort-worth-em-1-dia", nome: "Fort Worth em 1 dia", sub: "Cowboys de manhã, museus à tarde", texto: "Chegue cedo para ver o desfile do gado no Stockyards, almoce Tex-Mex no pátio mais famoso da cidade e passe a tarde entre arte e jardins.", paradas: ["fort-worth-stockyards", "joe-t-garcias", "kimbell-art-museum", "fort-worth-botanic-garden", "fort-worth-water-gardens"] },
    { id: "dia-de-compras", nome: "Dia de compras", sub: "Shoppings e outlet", texto: "Do shopping com obras de arte ao outlet com as marcas mais procuradas pelos brasileiros. Leve o passaporte para pedir os cupons de visitante.", paradas: ["northpark-center", "highland-park-village", "galleria-dallas", "allen-premium-outlets"] }
  ];
  function stops(r) { return r.paradas.map(function (id) { return Store.obter("lugares", id); }).filter(function (l) { return l && l.publicado !== false; }); }
  function cardRoteiro(r) {
    var ls = stops(r), f = ls.map(G.foto).filter(Boolean)[0];
    return '<a class="ocard" href="#roteiro-' + r.id + '">' + (f ? '<img src="' + esc(f) + '" alt="" loading="lazy">' : "") + '<span class="m"><span>' + ls.length + ' paradas</span></span><span class="n"><b>' + esc(r.nome) + "</b><small>" + esc(r.sub) + "</small></span></a>";
  }
  function viewRoteiros() {
    G.app.innerHTML = '<section class="block"><div class="wrap stack in"><div><p class="eyebrow">Prontos para seguir</p><h1 class="page-h" style="margin-top:4px">Roteiros</h1><p class="muted" style="margin-top:6px;max-width:56ch">Sequências de visita já montadas, com o tempo de carro entre uma parada e outra.</p></div><div class="grid">' + ROTEIROS.filter(function (r) { return stops(r).length > 1; }).map(cardRoteiro).join("") + "</div></div></section>";
  }
  function viewRoteiro(rota) {
    var r = ROTEIROS.filter(function (x) { return "roteiro-" + x.id === rota; })[0];
    if (!r) { viewRoteiros(); return; }
    var ls = stops(r), p = paradas(ls, false), custo = ls.reduce(function (s, l) { return s + (l.tipo !== "estabelecimento" && !l.gratuito ? Number(l.precoMin) || 0 : 0); }, 0);
    G.app.innerHTML = '<section class="block"><div class="wrap stack in" style="max-width:720px"><div><a class="more" href="#roteiros">← roteiros</a><p class="eyebrow" style="margin-top:10px">' + esc(r.sub) + '</p><h1 class="page-h" style="margin-top:4px">' + esc(r.nome) + '</h1><p class="muted" style="margin-top:8px">' + esc(r.texto) + '</p></div>' +
      '<div class="attrs" style="grid-template-columns:repeat(3,minmax(0,1fr))"><div>' + ic("pin") + "<b>" + ls.length + "</b><small>paradas</small></div><div>" + ic("clock") + "<b>" + dur(p.total) + "</b><small>de carro no total</small></div><div>" + ic("ticket") + "<b>" + (custo ? G.usd(custo) : "Grátis") + "</b><small>" + (custo ? "em entradas, por adulto" : "sem entrada paga") + "</small></div></div>" +
      '<div class="list">' + p.html + '</div><div class="row">' + (window.Jornada ? Jornada.botaoQuero(r.nome, ls.map(function (l) { return l.id; }), "pronto") : "") + '<a class="btn ghost" href="' + esc(mapsRota(ls)) + '" target="_blank" rel="noopener">' + ic("pin") + ' Abrir rota no Maps</a><button type="button" class="btn ghost" id="copiar-rot">Salvar na minha lista</button></div><p class="small muted">Tempos estimados pela distância, sem trânsito. Confira horários e preços na página de cada lugar.</p></div></section>';
    $("#copiar-rot").onclick = function () { var a = lista(); ls.forEach(function (l) { if (a.indexOf(l.id) < 0) a.push(l.id); }); salva(a); G.toast("Roteiro salvo na sua lista."); location.hash = "lista"; };
  }

  /* ---------- blocos da página inicial ---------- */
  function secoes(ls) {
    var hoje = G.hojeISO();
    var ev = ls.filter(function (l) { return l.categoria === "evento" && (!l.dataFim || l.dataFim >= hoje); }).sort(function (a, b) { return (a.dataInicio || "9999") < (b.dataInicio || "9999") ? -1 : 1; });
    var rs = ROTEIROS.filter(function (r) { return stops(r).length > 1; });
    return {
      eventos: ev.length ? '<section class="block reveal"><div class="head"><h2>Próximos eventos</h2><a class="more" href="#explorar" data-grupo="eventos">ver todos</a></div><div class="hscroll">' + G.unificaEventos(G.primeiro(ev)).slice(0, 8).map(G.card).join("") + "</div></section>" : "",
      roteiros: rs.length ? '<section class="block reveal"><div class="head"><h2>Roteiros prontos</h2><a class="more" href="#roteiros">ver todos</a></div><div class="hscroll">' + rs.map(cardRoteiro).join("") + "</div></section>" : "",
      chegada: '<section class="block reveal"><a class="adband" href="#chegada"><div><span class="sponsor">Vai morar no Texas?</span><b>Guia de chegada, passo a passo</b><span class="small muted">Celular, banco, carteira de motorista, carro, escola e saúde.</span></div>' + ic("arrow") + "</a></section>"
    };
  }

  /* ---------- guia de chegada ---------- */
  var PASSOS = [
    ["Celular e internet", "Um chip pré-pago resolve os primeiros dias e costuma ser vendido só com o passaporte. Ter um número americano destrava banco, aluguel e aplicativos.", null],
    ["Endereço e moradia", "Quase tudo pede comprovante de endereço. No aluguel, quem ainda não tem histórico de crédito nos Estados Unidos costuma pagar um depósito maior ou apresentar fiador.", ["Imóveis", "servicos", "imoveis"]],
    ["Social Security ou ITIN", "Quem tem autorização de trabalho pede o Social Security Number em um escritório da SSA. Quem não pode ter o SSN e precisa declarar imposto pede o ITIN ao IRS.", ["Órgãos públicos", "servicos", "governo"]],
    ["Conta no banco", "Leve passaporte e comprovante de endereço. Alguns bancos abrem conta sem SSN; a regra muda de banco para banco, então pergunte antes de ir.", null],
    ["Carteira de motorista do Texas", "Quem passa a morar no Texas tem 90 dias para tirar a carteira estadual no DPS. O atendimento é com hora marcada pelo site, e as vagas esgotam com semanas de antecedência.", ["Onde tirar", "servicos", "governo"]],
    ["Carro: seguro, registro e pedágio", "O seguro é obrigatório para rodar. O registro do carro é feito no tax office do condado. Nas vias pedagiadas da região não há cabine: quem não tem a TollTag recebe a cobrança mais cara pelo correio.", ["Mecânicos e seguros", "servicos", "mecanico"]],
    ["Saúde", "Não há sistema público como o SUS. Para problemas simples, as clínicas urgent care custam bem menos que o pronto-socorro dos hospitais. Em emergência, ligue 911.", ["Hospitais de referência", "servicos", "saude"]],
    ["Escola das crianças", "A escola pública é definida pelo endereço da casa. A matrícula pede comprovante de residência, certidão de nascimento e carteira de vacinação.", ["Aulas e escolas", "servicos", "aulas"]],
    ["Impostos", "O Texas não cobra imposto de renda estadual, mas o federal existe e a declaração é anual, normalmente até abril. Um contador que fale português evita erro no primeiro ano.", ["Contadores", "servicos", "contador"]],
    ["Documentos brasileiros", "Passaporte, procurações e registros são feitos pelo Consulado-Geral do Brasil em Houston, que atende todo o Texas e às vezes faz atendimentos itinerantes em Dallas.", ["Consulado", "servicos", "servico"]]
  ];
  function viewChegada() {
    var n = function (cat) { return G.lugares().filter(function (l) { return l.categoria === cat; }).length; };
    G.app.innerHTML = '<section class="block"><div class="wrap stack in" style="max-width:720px"><div><p class="eyebrow">Para quem vai morar</p><h1 class="page-h" style="margin-top:4px">Guia de chegada</h1><p class="muted" style="margin-top:8px">Os dez passos que quase todo brasileiro dá nos primeiros meses no Texas, na ordem em que costumam acontecer.</p></div>' +
      PASSOS.map(function (p, i) { return '<div class="panel step"><span class="sn">' + (i + 1) + "</span><div><h3>" + p[0] + '</h3><p class="muted" style="margin-top:6px">' + p[1] + "</p>" + (p[2] && n(p[2][2]) ? '<a class="more" style="display:inline-block;margin-top:10px;color:var(--accent-mid);font-weight:600" href="#explorar" data-grupo="' + p[2][1] + '" data-cat="' + p[2][2] + '">' + p[2][0] + " no guia (" + n(p[2][2]) + ") →</a>" : "") + "</div></div>"; }).join("") +
      '<p class="note">Orientação geral para você se organizar, não é assessoria jurídica, fiscal ou médica. Prazos e exigências mudam: confirme sempre no site oficial de cada órgão antes de ir.</p></div></section>';
  }

  /* ---------- kit do anunciante: imagem de post e QR code ---------- */
  function kit(l) {
    return '<div class="panel stack" style="gap:12px"><h3>Imagem pronta para postar</h3><p class="muted small">Arte quadrada com sua foto, seu nome e sua oferta, no tamanho do Facebook e do Instagram.</p><img id="kit-img" alt="Arte do anúncio" style="width:100%;max-width:360px;border-radius:18px;box-shadow:var(--shadow);background:var(--surface-2);aspect-ratio:1"><p class="small muted">Para salvar: toque e segure a imagem no celular, ou clique com o botão direito no computador.</p></div>' +
      '<div class="panel stack" style="gap:12px"><h3>QR code para o balcão</h3><p class="muted small">Imprima e deixe no caixa, no cartão ou no carro. Quem aponta a câmera abre seu anúncio e pode avaliar você.</p><div id="kit-qr" style="width:180px;height:180px;background:#fff;border-radius:16px;padding:10px;box-shadow:var(--shadow)"></div></div>';
  }
  function quebra(ctx, t, x, y, w, lh, max) {
    var ps = String(t).split(/\s+/), linha = "", n = 0;
    for (var i = 0; i < ps.length; i++) {
      var tenta = linha ? linha + " " + ps[i] : ps[i];
      if (ctx.measureText(tenta).width > w && linha) { ctx.fillText(linha, x, y + n * lh); n++; linha = ps[i]; if (n >= max - 1) { linha = ps.slice(i).join(" "); while (ctx.measureText(linha + "…").width > w && linha.length > 3) linha = linha.slice(0, -1); if (i < ps.length - 1 || ctx.measureText(ps.slice(i).join(" ")).width > w) linha += "…"; break; } }
      else linha = tenta;
    }
    ctx.fillText(linha, x, y + n * lh); return n + 1;
  }
  function kitInit(l) {
    var img = $("#kit-img"), qr = $("#kit-qr"), link = location.origin + location.pathname + "#lugar-" + l.id;
    if (qr) {
      if (window.qrcode) { try { var q = window.qrcode(0, "M"); q.addData(link); q.make(); qr.innerHTML = q.createSvgTag({ cellSize: 4, margin: 0, scalable: true }); var sv = qr.querySelector("svg"); if (sv) { sv.style.width = "100%"; sv.style.height = "100%"; } } catch (e) { qr.textContent = "Não foi possível gerar o QR code."; } }
      else qr.innerHTML = '<span class="small muted">QR code indisponível sem conexão.</span>';
    }
    if (!img) return;
    var c = document.createElement("canvas"); c.width = c.height = 1080; var x = c.getContext("2d");
    function pinta(foto) {
      x.fillStyle = "#163832"; x.fillRect(0, 0, 1080, 1080);
      if (foto) { var k = Math.max(1080 / foto.width, 1080 / foto.height), w = foto.width * k, h = foto.height * k; x.drawImage(foto, (1080 - w) / 2, (1080 - h) / 2, w, h); }
      var g = x.createLinearGradient(0, 0, 0, 1080); g.addColorStop(0, "rgba(12,16,14,.35)"); g.addColorStop(0.45, "rgba(12,16,14,.15)"); g.addColorStop(1, "rgba(12,16,14,.92)"); x.fillStyle = g; x.fillRect(0, 0, 1080, 1080);
      x.fillStyle = "#fff"; x.textBaseline = "top";
      x.font = '500 34px "DM Sans", sans-serif'; x.fillText("CORAÇÃOBR", 72, 72);
      x.font = '600 30px "DM Sans", sans-serif'; x.fillStyle = "#DAF1DE"; x.fillText(String(G.CATS[l.categoria] || "").toUpperCase() + (l.cidade ? " · " + l.cidade.toUpperCase() : ""), 72, 640);
      x.fillStyle = "#fff"; x.font = '500 92px "Fraunces", Georgia, serif';
      var n = quebra(x, l.nome, 72, 692, 936, 100, 2), y = 692 + n * 100 + 24;
      if (l.cupom) { x.font = '600 36px "DM Sans", sans-serif'; var tw = Math.min(900, x.measureText(l.cupom).width + 56); x.fillStyle = "#DAF1DE"; x.beginPath(); if (x.roundRect) x.roundRect(72, y, tw, 70, 35); else x.rect(72, y, tw, 70); x.fill(); x.fillStyle = "#163832"; x.fillText(l.cupom, 100, y + 16, 840); y += 96; }
      x.fillStyle = "rgba(255,255,255,.85)"; x.font = '400 32px "DM Sans", sans-serif'; x.fillText("Fotos, avaliações e como chegar no CoraçãoBR", 72, 990);
      try { img.src = c.toDataURL("image/jpeg", 0.9); } catch (e) { img.alt = "Não foi possível gerar a arte com esta foto."; }
    }
    var src = G.foto(l), pronto = (document.fonts && document.fonts.ready) || Promise.resolve();
    pronto.then(function () { if (!src) { pinta(null); return; } var f = new Image(); f.onload = function () { pinta(f); }; f.onerror = function () { pinta(null); }; f.src = src; });
  }

  G.views.lista = viewLista; G.views.roteiros = viewRoteiros; G.views.roteiro = viewRoteiro; G.views.chegada = viewChegada;
  window.Extras = { aberto: aberto, selos: selos, botaoFav: botaoFav, mapsRota: mapsRota, secoes: secoes, kit: kit, kitInit: kitInit };

  /* ---------- instalar como aplicativo ----------
     Só fora da página de prévia: service worker não funciona dentro dela. */
  if (!window.claude && "serviceWorker" in navigator && (location.protocol === "https:" || location.hostname === "localhost" || location.hostname === "127.0.0.1")) {
    window.addEventListener("load", function () { navigator.serviceWorker.register("sw.js").catch(function () {}); });
  }
})();
