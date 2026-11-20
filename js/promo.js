/* Promoção de lançamento (dezembro): cada crédito de US$ 3 dá 1 anúncio por 1 mês + 5 curadorias de lugares ou eventos do guia.
   Fica visível só no período configurado (padrão 01/12 a 31/12); fora dele a página some e vale o plano normal (US$ 10/mês, 3 anúncios + 1 banner).
   As curadorias são gravadas como avaliações do tipo "parceiro" e aparecem sempre identificadas, separadas das avaliações independentes. */
(function () {
  "use strict";
  var G = window.Guia, esc = G.esc, ic = G.ic, $ = function (s, r) { return (r || document).querySelector(s); };
  var PADRAO = { inicio: "2026-12-01", fim: "2026-12-31", preco: 3, anuncios: 1, curadorias: 5 };
  var C = { q: "", g: "tudo", aberto: null, nota: 0 };
  function cfg() { return Object.assign({}, PADRAO, G.config().promo || {}); }
  function hoje() { return G.hojeISO(); }
  function ativa() { var c = cfg(); return !c.desligada && hoje() >= c.inicio && hoje() <= c.fim; }
  function br(iso) { return iso ? String(iso).slice(0, 10).split("-").reverse().join("/") : ""; }
  function pag(uid) { return uid ? Store.obter("pagamentos", uid) || {} : {}; }
  function creditosAtivos(uid) { return (pag(uid).creditos || []).filter(function (c) { return (c.ate || "") >= hoje(); }); }
  function curadoriasCompradas(uid) { return Number(pag(uid).curadorias) || 0; }
  function minhasCuradorias(uid) { return Store.lista("avaliacoes").filter(function (a) { return a.tipo === "parceiro" && (a.uid === uid || a._dono === uid); }); }
  function meusLugares(uid) { return Store.lista("lugares").filter(function (l) { return l._dono === uid; }); }
  function chamada() { var c = cfg(); return ativa() ? "Promoção de dezembro: US$ " + c.preco + " = " + c.anuncios + " anúncio por 1 mês + " + c.curadorias + " curadorias, até " + br(c.fim).slice(0, 5) + "." : ""; }
  function diasRestantes() { var f = new Date(cfg().fim + "T23:59:59"), n = window.Horario ? Horario.agoraDallas() : new Date(); return Math.max(0, Math.ceil((f - n) / 864e5)); }

  /* ---------- página ---------- */
  function view() {
    var c = cfg(), uid = Store.uid(), admin = Store.admin(), aberta = ativa();
    if (!aberta && !admin) {
      G.app.innerHTML = '<section class="block"><div class="wrap narrow stack" style="text-align:center;justify-items:center;padding-block:40px"><h1 class="page-h">Promoção encerrada</h1><p class="muted">A promoção de lançamento não está disponível agora. O plano de anunciante custa ' + G.usd(Pag.preco()) + " por mês, com 3 anúncios e 1 banner.</p><a class=\"btn\" href=\"#anuncie\">Ver o plano</a></div></section>";
      return;
    }
    var papel = Store.papel && Store.papel(), logado = !!uid, creds = creditosAtivos(uid), comp = curadoriasCompradas(uid), usadas = minhasCuradorias(uid).length, livres = Math.max(0, comp - usadas);
    G.app.innerHTML = '<section class="block pr"><div class="wrap">' +
      (!aberta ? '<div class="note" style="margin-bottom:14px">Pré-visualização da equipe: o público vê esta página de ' + br(c.inicio) + " a " + br(c.fim) + ".</div>" : "") +
      '<div class="pr-hero"><div><p class="an-promo">' + ic("sparkle") + "Lançamento no Texas · só em dezembro</p><h1 class=\"page-h\">Anuncie por US$ " + c.preco + " e ajude a construir o guia.</h1>" +
      '<p class="an-sub">Cada crédito de <b>US$ ' + c.preco + "</b> dá <b>" + c.anuncios + " anúncio por 1 mês</b> e <b>" + c.curadorias + " curadorias</b>: você escolhe lugares e eventos que conhece e conta como foi. Compre quantos créditos quiser.</p>" +
      '<div class="row an-cta"><a class="btn" href="#' + (logado ? "pagar-promo" : "entrar") + '">' + (logado ? "Comprar crédito por US$ " + c.preco : "Criar conta e participar") + " " + ic("arrow") + '</a><a class="btn ghost" href="#promo-curadoria" data-pr-ir>Ver lugares para avaliar</a></div></div>' +
      '<aside class="an-plan pr-card"><p class="an-pl">Crédito promocional</p><div class="an-pv">US$ ' + c.preco + '<small>/crédito</small></div><ul class="an-ck"><li>' + ic("star") + c.anuncios + " anúncio no ar por 1 mês</li><li>" + ic("star") + c.curadorias + " curadorias de lugares ou eventos</li><li>" + ic("star") + "Compre mais créditos quando quiser</li></ul>" +
      '<div class="pr-cd"><b>' + diasRestantes() + "</b><span>" + (diasRestantes() === 1 ? "dia" : "dias") + " para acabar · até " + br(c.fim) + '</span></div><p class="an-fine">A partir de janeiro: ' + G.usd(Pag.preco()) + "/mês com 3 anúncios + 1 banner.</p></aside></div>" +
      '<section class="an-sec"><p class="eyebrow">Como funciona</p><h2>Três passos</h2><ol class="an-steps"><li><b>Compre o crédito</b><p>US$ ' + c.preco + " por cartão, débito, PayPal, Pix ou Zelle. A equipe confirma e o anúncio entra no ar em até 1 hora.</p></li><li><b>Publique seu anúncio</b><p>Fotos, horário, WhatsApp, cardápio ou tabela de preços. Ele fica no ar por 1 mês.</p></li><li><b>Faça " + c.curadorias + " curadorias</b><p>Escolha lugares e eventos que você conhece, dê uma nota sincera e conte como foi.</p></li></ol></section>" +
      (logado ? '<section class="an-sec"><p class="eyebrow">Seu saldo</p><div class="pr-saldo"><div><small>Créditos ativos</small><b>' + creds.length + "</b><span>" + (creds.length ? "o mais recente vale até " + br(creds[creds.length - 1].ate) : "nenhum ainda") + "</span></div><div><small>Anúncios</small><b>" + meusLugares(uid).length + " / " + creds.length + "</b><span>usados / liberados</span></div><div><small>Curadorias</small><b>" + usadas + " / " + comp + "</b><span>" + livres + " disponíveis</span></div></div>" +
        '<div class="row" style="gap:8px;margin-top:12px"><a class="btn sm" href="#pagar-promo">Comprar mais 1 crédito</a>' + (papel === "anunciante" || papel === "master" ? '<a class="btn ghost sm" href="#anunciar" data-novo-anuncio>Cadastrar anúncio</a>' : '<a class="btn ghost sm" href="#anunciar">Virar anunciante</a>') + "</div></section>" : "") +
      '<section class="an-sec" id="promo-curadoria"><p class="eyebrow">Curadoria</p><h2>Escolha o que você conhece</h2><p class="muted" style="max-width:62ch;margin:-8px 0 14px">Lugares e eventos do guia. Cada avaliação usa 1 curadoria do seu saldo. Não vale avaliar o próprio negócio.</p>' +
      '<div class="pr-filtros"><div class="search xp-q">' + ic("search") + '<input id="pr-q" type="search" value="' + esc(C.q) + '" placeholder="Procurar lugar ou evento" autocomplete="off"></div><nav class="menubar mb-4" id="pr-g">' + [["tudo", "Tudo", "grid"], ["eventos", "Eventos", "ticket"], ["comer", "Comer", "utensils"], ["passeios", "Passeios", "landmark"]].map(function (g) { return '<button type="button" class="mb-it" data-pr-g="' + g[0] + '" aria-pressed="' + (C.g === g[0]) + '">' + ic(g[2]) + "<span>" + g[1] + "</span></button>"; }).join("") + "</nav></div>" +
      '<div class="pr-lista" id="pr-lista"></div></section>' +
      (logado && usadas ? '<section class="an-sec"><p class="eyebrow">Suas curadorias</p><div class="list">' + minhasCuradorias(uid).map(function (a) { var l = Store.obter("lugares", a.lugarId); return '<a class="lrow nopos" href="#lugar-' + esc(a.lugarId) + '"><span class="th">' + (l && G.foto(l) ? '<img src="' + esc(G.foto(l)) + '" alt="">' : "") + "</span><span><b>" + esc(l ? l.nome : a.lugarId) + "</b><small>" + esc(String(a.texto || "").slice(0, 120)) + '</small></span><span class="val">' + G.stars(a.estrelas) + "</span></a>"; }).join("") + "</div></section>" : "") +
      '<section class="an-sec"><div class="xp-box pr-regras"><p class="xp-t">Transparência</p><ul class="ofp-como"><li>' + ic("star") + "<span>Toda curadoria aparece no guia identificada como <b>Curadoria de parceiro</b>, com o aviso de que foi feita por um anunciante que recebeu desconto.</span></li><li>" + ic("star") + "<span>A nota é sua e precisa ser sincera. Não pedimos nota alta, e notas baixas valem igual.</span></li><li>" + ic("star") + "<span>Curadorias de parceiros ficam separadas das avaliações independentes de visitantes e do Google.</span></li><li>" + ic("star") + "<span>Conteúdo falso, copiado ou sobre o próprio negócio é removido pela equipe.</span></li></ul></div></section>" +
      "</div></section>";
    lista();
  }
  function grupoOk(l) { if (C.g === "tudo") return true; var g = G.GRUPOS[C.g]; return g && g.f(l); }
  function lista() {
    var el = $("#pr-lista"); if (!el) return;
    var uid = Store.uid(), feitos = {}, livres = Math.max(0, curadoriasCompradas(uid) - minhasCuradorias(uid).length), q = C.q.toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, "");
    minhasCuradorias(uid).forEach(function (a) { feitos[a.lugarId] = 1; });
    var hj = hoje(), ls = G.lugares().filter(function (l) { return l._dono !== uid && grupoOk(l) && !(l.dataFim && l.dataFim < hj) && (!q || String(l.nome + " " + (l.cidade || "") + " " + (G.CATS[l.categoria] || "")).toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, "").indexOf(q) >= 0); }).slice(0, 36);
    el.innerHTML = ls.map(function (l) {
      var aberto = C.aberto === l.id;
      return '<div class="pr-it' + (feitos[l.id] ? " feito" : "") + (aberto ? " on" : "") + '"><a class="pr-f" href="#lugar-' + esc(l.id) + '">' + (G.foto(l) ? '<img src="' + esc(G.foto(l)) + '" alt="" loading="lazy">' : "") + '</a><div class="pr-t"><b>' + esc(l.nome) + "</b><small>" + esc(G.CATS[l.categoria] || "") + " · " + esc(l.quando ? String(l.quando).split(" (")[0] : l.cidade || "") + "</small></div>" +
        (feitos[l.id] ? '<span class="pill ok">Avaliado</span>' : '<button type="button" class="btn sm' + (aberto ? " ghost" : "") + '" data-pr-av="' + esc(l.id) + '">' + (aberto ? "Fechar" : "Avaliar") + "</button>") +
        (aberto ? form(l, livres) : "") + "</div>";
    }).join("") || '<p class="muted">Nada encontrado com essa busca.</p>';
  }
  function form(l, livres) {
    if (!Store.uid()) return '<div class="pr-form"><p>Entre na sua conta para fazer curadorias.</p><a class="btn sm" href="#entrar">Entrar</a></div>';
    if (!livres) return '<div class="pr-form"><p>Você não tem curadorias disponíveis. Cada crédito de US$ ' + cfg().preco + " libera " + cfg().curadorias + '.</p><a class="btn sm" href="#pagar-promo">Comprar crédito</a></div>';
    return '<form class="pr-form" data-pr-form="' + esc(l.id) + '"><div class="field"><span>Sua nota</span><div class="pick" id="pr-pick">' + [1, 2, 3, 4, 5].map(function (i) { return '<button type="button" data-pr-n="' + i + '" class="' + (i <= C.nota ? "on" : "") + '" aria-label="' + i + ' estrelas">★</button>'; }).join("") + '</div></div>' +
      '<div class="field"><label>Como foi (depoimento)</label><textarea name="texto" required minlength="40" maxlength="800" placeholder="O que vale a pena, o que evitar, para quem é. Escreva com suas palavras."></textarea></div>' +
      '<div class="form2"><div class="field"><label>Dica para brasileiros (opcional)</label><input name="dica" maxlength="160" placeholder="Estacionamento, melhor horário, prato…"></div><div class="field"><label>Quando você foi</label><input name="quando" type="month" max="' + hoje().slice(0, 7) + '"></div></div>' +
      '<label class="check small"><input type="checkbox" name="ok" required> Conheço este lugar ou evento, a nota é sincera e não tenho ligação com o negócio.</label>' +
      '<button class="btn" type="submit">Publicar curadoria · usa 1 de ' + livres + "</button></form>";
  }
  document.addEventListener("click", function (e) {
    if (!e.target.closest(".pr")) return; var b;
    if ((b = e.target.closest("[data-pr-g]"))) { C.g = b.dataset.prG; Array.from(document.querySelectorAll("[data-pr-g]")).forEach(function (x) { x.setAttribute("aria-pressed", x === b); }); lista(); return; }
    if ((b = e.target.closest("[data-pr-av]"))) { C.aberto = C.aberto === b.dataset.prAv ? null : b.dataset.prAv; C.nota = 0; lista(); return; }
    if ((b = e.target.closest("[data-pr-n]"))) { C.nota = +b.dataset.prN; Array.from(document.querySelectorAll("[data-pr-n]")).forEach(function (x) { x.classList.toggle("on", +x.dataset.prN <= C.nota); }); return; }
    if (e.target.closest("[data-pr-ir]")) { e.preventDefault(); var s = $("#promo-curadoria"); if (s) s.scrollIntoView({ behavior: "smooth" }); }
  });
  var tq = null;
  document.addEventListener("input", function (e) { if (e.target.id !== "pr-q") return; C.q = e.target.value; clearTimeout(tq); tq = setTimeout(lista, 150); });
  document.addEventListener("submit", function (e) {
    var f = e.target.closest("[data-pr-form]"); if (!f) return; e.preventDefault();
    if (!C.nota) { G.toast("Escolha de 1 a 5 estrelas."); return; }
    var l = Store.obter("lugares", f.dataset.prForm), uid = Store.uid(); if (!l) return;
    if (l._dono === uid) { G.toast("Não vale avaliar o próprio negócio."); return; }
    if (minhasCuradorias(uid).some(function (a) { return a.lugarId === l.id; })) { G.toast("Você já fez a curadoria deste lugar."); return; }
    var meu = meusLugares(uid)[0], doc = { lugarId: l.id, estrelas: C.nota, texto: f.texto.value.trim(), dica: f.dica.value.trim(), quando: f.quando.value, tipo: "parceiro", nome: (Store.conta && Store.conta() ? Store.conta().nome : "") || "Parceiro", parceiro: meu ? meu.nome : "", uid: uid, criadoEm: new Date().toISOString() };
    var bt = f.querySelector("button[type=submit]"); bt.disabled = true;
    Store.gravar("avaliacoes", Store.idProprio(Store.novoId("cur")), doc).then(function () { G.toast("Curadoria publicada. Obrigado!"); C.aberto = null; C.nota = 0; view(); }).catch(function (er) { bt.disabled = false; G.toast(er.message || "Não foi possível publicar."); });
  });

  /* ---------- exibição na página do lugar ---------- */
  function blocoLugar(l) {
    var cs = Store.lista("avaliacoes").filter(function (a) { return a.lugarId === l.id && a.tipo === "parceiro"; }); if (!cs.length) return "";
    var m = cs.reduce(function (s, a) { return s + Number(a.estrelas || 0); }, 0) / cs.length;
    return '<div class="panel stack pr-cur" style="gap:10px"><div class="row" style="justify-content:space-between"><h3 style="margin:0">Curadoria de parceiros</h3><span class="pr-m"><b>' + m.toFixed(1) + "</b> ★ · " + cs.length + (cs.length === 1 ? " curadoria" : " curadorias") + '</span></div><p class="small muted">Escritas por anunciantes do CoraçãoBR que receberam desconto no anúncio para avaliar lugares e eventos que conhecem. Ficam separadas das avaliações independentes.</p>' +
      cs.slice(0, 6).map(function (a) { return '<div class="rv"><span class="av">' + esc((a.nome || "P").charAt(0).toUpperCase()) + '</span><div><div class="row" style="gap:8px"><b>' + esc(a.nome || "Parceiro") + "</b>" + G.stars(a.estrelas) + '<span class="pill xp">Parceiro' + (a.parceiro ? " · " + esc(a.parceiro) : "") + "</span></div>" + (a.quando ? '<small class="muted">esteve em ' + esc(a.quando.split("-").reverse().join("/")) + "</small>" : "") + "<p>" + esc(a.texto || "") + "</p>" + (a.dica ? '<p class="small"><b>Dica:</b> ' + esc(a.dica) + "</p>" : "") + "</div></div>"; }).join("") + "</div>";
  }
  function media(l) { var cs = Store.lista("avaliacoes").filter(function (a) { return a.lugarId === l.id && a.tipo === "parceiro"; }); return cs.length ? { m: cs.reduce(function (s, a) { return s + Number(a.estrelas || 0); }, 0) / cs.length, n: cs.length } : null; }

  var tR = null;
  Store.assinar(function () { if (location.hash !== "#promo" || C.aberto || (document.activeElement && document.activeElement.id === "pr-q")) return; clearTimeout(tR); tR = setTimeout(function () { var y = window.scrollY; view(); window.scrollTo(0, y); }, 300); });
  G.views.promo = view;
  window.Promo = { cfg: cfg, ativa: ativa, chamada: chamada, creditosAtivos: creditosAtivos, curadoriasCompradas: curadoriasCompradas, blocoLugar: blocoLugar, media: media, PADRAO: PADRAO };
})();
