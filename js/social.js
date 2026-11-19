/* Parte social da CoraçãoBR, no estilo Instagram, mas só quem paga publica:
   - Anunciante (US$ 20/mês, até 3 anúncios): publica no feed e tem 1 banner por anúncio no carrossel da página inicial.
   - Usuário com conta: curte, salva, segue e avalia com estrelas. Não publica.
   - Carrossel: até 10 banners por rodada, troca a cada 30 minutos, sem repetir anunciante na mesma rodada;
     quando faltam anunciantes, eventos gratuitos completam as vagas.
   Tudo ligável no painel master (Recursos, Banners e Publicações). */
(function () {
  "use strict";
  var G = window.Guia; if (!G) return;
  var esc = G.esc, ic = G.ic, $ = function (s, r) { return (r || document).querySelector(s); };
  function on(k) { return window.Recursos ? Recursos.on(k) : true; }
  var TIPOS = { novidade: "Novidade", oferta: "Oferta", evento: "Evento", vaga: "Vaga de emprego", quarto: "Quarto e aluguel", venda: "Compra e venda", servico: "Serviço" };
  var BOOK = '<svg class="i" viewBox="0 0 24 24" aria-hidden="true"><path d="M6 3h12v18l-6-4-6 4z"/></svg>';
  var CORACAO = '<svg class="i" viewBox="0 0 24 24" aria-hidden="true"><path d="M12 20s-7-4.4-7-10a4 4 0 0 1 7-2.6A4 4 0 0 1 19 10c0 5.6-7 10-7 10z"/></svg>';
  var MAIS = '<svg class="i" viewBox="0 0 24 24" aria-hidden="true"><circle cx="5" cy="12" r="1.6"/><circle cx="12" cy="12" r="1.6"/><circle cx="19" cy="12" r="1.6"/></svg>';
  function loc(k, v) { try { if (v === undefined) return JSON.parse(localStorage.getItem(k) || "null"); localStorage.setItem(k, JSON.stringify(v)); } catch (e) { return null; } }
  function chave(id) { return String(id).replace(/~/g, "|"); }
  function donoDe(id) { var i = String(id).indexOf("~"); return i > 0 ? String(id).slice(0, i) : ""; }
  function logado() { return !!Store.uid(); }
  function pedeLogin(msg) { G.toast(msg || "Entre na sua conta para continuar."); try { sessionStorage.setItem("depois-login", location.hash || "#feed"); } catch (e) { /* ok */ } location.hash = "#entrar"; }
  function quando(iso) {
    var s = (Date.now() - new Date(iso).getTime()) / 1000; if (!isFinite(s)) return "";
    if (s < 3600) return "há " + Math.max(1, Math.round(s / 60)) + " min"; if (s < 86400) return "há " + Math.round(s / 3600) + " h";
    if (s < 86400 * 7) { var d = Math.round(s / 86400); return "há " + d + (d === 1 ? " dia" : " dias"); }
    var p = String(iso).slice(0, 10).split("-"); return p[2] + "/" + p[1];
  }

  /* ---------- dados ---------- */
  function ativo(l) { return !!l && G.lugares().indexOf(l) >= 0; }
  function anuncioDe(p) { var l = Store.obter("lugares", p.lugarId); return l && l.anunciante && ativo(l) && donoDe(l.id) === p._dono ? l : null; }
  function posts() { return Store.lista("posts").filter(function (p) { return p.ativo !== false && anuncioDe(p); }).sort(function (a, b) { return a.criadoEm < b.criadoEm ? 1 : -1; }); }
  function meus(col) { var u = Store.uid(); return u ? Store.lista(col).filter(function (x) { return x._dono === u; }) : []; }
  function curtidasDe(postId) { return Store.lista("curtidas").filter(function (c) { return c.p === postId; }).length; }
  function curti(postId) { return meus("curtidas").some(function (c) { return c.p === postId; }); }
  function seguidores(lid) { return Store.lista("seguindo").filter(function (s) { return s.l === lid; }).length; }
  function sigo(lid) { return meus("seguindo").some(function (s) { return s.l === lid; }); }
  function salvos() { var s = loc("posts-salvos"); return Array.isArray(s) ? s : []; }

  function curtir(postId) {
    if (!logado()) return pedeLogin("Entre na sua conta para curtir.");
    var k = Store.uid() + "~" + chave(postId);
    return (curti(postId) ? Store.apagar("curtidas", k) : Store.gravar("curtidas", k, { p: postId, em: new Date().toISOString() })).catch(function (e) { G.toast(e.message || "Não deu agora."); });
  }
  function seguir(lid) {
    if (!logado()) return pedeLogin("Entre na sua conta para seguir.");
    var k = Store.uid() + "~" + chave(lid), ja = sigo(lid);
    return (ja ? Store.apagar("seguindo", k) : Store.gravar("seguindo", k, { l: lid, em: new Date().toISOString() })).then(function () { G.toast(ja ? "Você deixou de seguir." : "Seguindo. As publicações aparecem no seu feed."); }).catch(function (e) { G.toast(e.message || "Não deu agora."); });
  }
  function salvar(postId) { var s = salvos(), i = s.indexOf(postId); if (i >= 0) s.splice(i, 1); else s.unshift(postId); loc("posts-salvos", s.slice(0, 300)); G.toast(i >= 0 ? "Removido dos salvos." : "Salvo na sua conta."); }
  function denunciar(p) {
    if (!logado()) return pedeLogin("Entre na sua conta para denunciar.");
    var l = anuncioDe(p) || {};
    Store.gravar("avisos", Store.novoId("av"), { tipo: "denuncia", postId: p.id, lugarId: p.lugarId, nome: "Publicação denunciada: " + (l.nome || ""), criadoEm: new Date().toISOString(), lido: false })
      .then(function () { G.toast("Obrigado. A equipe vai analisar."); }).catch(function () { G.toast("Não deu para enviar agora."); });
  }

  /* ---------- cartão de publicação ---------- */
  function avatar(l) { var f = G.foto(l); return f ? '<img src="' + esc(f) + '" alt="">' : '<span>' + esc(String(l.nome || "?").charAt(0)) + "</span>"; }
  function zap(t) { var d = String(t || "").replace(/\D/g, ""); if (d.length === 10) d = "1" + d; return d.length >= 11 ? "https://wa.me/" + d : ""; }
  function cartao(p) {
    var l = anuncioDe(p); if (!l) return "";
    var fs = (p.fotos || []).map(Store.urlFoto).filter(Boolean), n = curtidasDe(p.id), eu = curti(p.id), sv = salvos().indexOf(p.id) >= 0, w = zap(l.whatsapp);
    return '<article class="post" data-post="' + esc(p.id) + '"><header><a class="pav" href="#perfil-' + esc(l.id) + '">' + avatar(l) + '</a><div><a href="#perfil-' + esc(l.id) + '"><b>' + esc(l.nome) + "</b></a><small>" + esc([G.CATS[l.categoria] || "", l.cidade || "", quando(p.criadoEm)].filter(Boolean).join(" · ")) + '</small></div><span class="ptipo">' + esc(TIPOS[p.tipo] || "Novidade") + "</span></header>" +
      (fs.length ? '<div class="pfotos' + (fs.length > 1 ? " varias" : "") + '">' + fs.map(function (f) { return '<img src="' + esc(f) + '" alt="" loading="lazy">'; }).join("") + "</div>" : "") +
      '<div class="pacoes"><button type="button" data-curtir="' + esc(p.id) + '" aria-pressed="' + eu + '" aria-label="Curtir">' + CORACAO + "<span>" + (n || "") + '</span></button><button type="button" data-salvar-post="' + esc(p.id) + '" aria-pressed="' + sv + '" aria-label="Salvar">' + BOOK + '</button><button type="button" data-partilha-post="' + esc(p.id) + '" aria-label="Compartilhar">' + ic("share") + '</button><span class="esp"></span><button type="button" data-denuncia-post="' + esc(p.id) + '" aria-label="Denunciar">' + MAIS + "</button></div>" +
      '<p class="ptxt">' + esc(p.texto || "") + "</p>" +
      '<div class="pcta">' + (w ? '<a class="btn sm" href="' + w + "?text=" + encodeURIComponent("Olá! Vi sua publicação no CoraçãoBR.") + '" target="_blank" rel="noopener">' + ic("chat") + " WhatsApp</a>" : "") + (G.url(p.link) ? '<a class="btn ghost sm" href="' + esc(p.link) + '" target="_blank" rel="noopener">Saiba mais</a>' : "") + '<a class="btn ghost sm" href="#lugar-' + esc(l.id) + '">Ver anúncio</a></div></article>';
  }

  /* ---------- feed ---------- */
  var abaFeed = "tudo", tipoFeed = "";
  function viewFeed() {
    if (!on("feed")) { G.app.innerHTML = '<section class="block"><div class="wrap narrow"><h1 class="page-h">Feed</h1><p class="muted">O feed está desligado no momento.</p></div></section>'; return; }
    var ps = posts(), seg = meus("seguindo").map(function (s) { return s.l; });
    if (abaFeed === "seguindo") ps = ps.filter(function (p) { return seg.indexOf(p.lugarId) >= 0; });
    if (tipoFeed) ps = ps.filter(function (p) { return p.tipo === tipoFeed; });
    G.app.innerHTML = '<section class="block"><div class="wrap feed">' +
      '<div class="head" style="margin:0"><div><p class="eyebrow">Feed</p><h1 class="page-h" style="margin-top:2px">Novidades de quem anuncia</h1></div><a class="more" href="#anuncie">Quero publicar</a></div>' +
      '<div class="chips"><button type="button" class="chip" data-aba-feed="tudo" aria-pressed="' + (abaFeed === "tudo") + '">Tudo</button><button type="button" class="chip" data-aba-feed="seguindo" aria-pressed="' + (abaFeed === "seguindo") + '">Seguindo</button><span class="sep"></span>' +
      Object.keys(TIPOS).map(function (k) { return '<button type="button" class="chip" data-tipo-feed="' + k + '" aria-pressed="' + (tipoFeed === k) + '">' + TIPOS[k] + "</button>"; }).join("") + "</div>" +
      (ps.length ? ps.slice(0, 80).map(cartao).join("") : '<div class="panel"><h3>' + (abaFeed === "seguindo" ? "Você ainda não segue ninguém" : "Nada por aqui ainda") + '</h3><p class="muted">' + (abaFeed === "seguindo" ? "Abra o perfil de uma empresa e toque em Seguir para ver as publicações dela aqui." : "As publicações das empresas que anunciam no CoraçãoBR aparecem aqui.") + "</p></div>") +
      '<p class="note small">Só anunciantes publicam no feed. Usuários curtem, salvam, seguem e avaliam com estrelas.</p></div></section>';
  }

  /* ---------- perfil do anunciante ---------- */
  function viewPerfil(r) {
    var id = String(r).replace(/^perfil-/, ""), l = Store.obter("lugares", id);
    if (!l || !l.anunciante || !ativo(l)) { G.app.innerHTML = '<section class="block"><div class="wrap narrow"><h1 class="page-h">Perfil não encontrado</h1><p><a href="#feed">Voltar ao feed</a></p></div></section>'; return; }
    var ps = posts().filter(function (p) { return p.lugarId === id; }), n = G.notas(l), s = sigo(id), w = zap(l.whatsapp);
    G.app.innerHTML = '<section class="block"><div class="wrap feed"><div class="pperfil"><span class="pav g">' + avatar(l) + '</span><div class="stack" style="gap:6px"><div><p class="eyebrow">' + esc(G.CATS[l.categoria] || "") + " · " + esc(l.cidade || "") + '</p><h1 class="page-h" style="margin-top:2px">' + esc(l.nome) + "</h1></div>" +
      '<div class="pnums"><span><b>' + ps.length + "</b> publicações</span><span><b>" + seguidores(id) + "</b> seguidores</span><span><b>" + (n.guia != null ? n.guia.toFixed(1).replace(".", ",") : "–") + "</b> nota</span></div>" +
      (l.historia ? '<p class="muted">' + esc(String(l.historia).slice(0, 220)) + "</p>" : "") +
      '<div class="row" style="gap:8px"><button type="button" class="btn sm' + (s ? " ghost" : "") + '" data-seguir="' + esc(id) + '">' + (s ? "Seguindo" : "Seguir") + "</button>" + (w ? '<a class="btn ghost sm" href="' + w + '" target="_blank" rel="noopener">' + ic("chat") + " WhatsApp</a>" : "") + '<a class="btn ghost sm" href="#lugar-' + esc(id) + '">Ver anúncio e avaliações</a></div></div></div>' +
      (ps.length ? '<div class="pgrade">' + ps.map(function (p) { var f = (p.fotos || []).map(Store.urlFoto).filter(Boolean)[0]; return '<button type="button" class="pmini" data-abre-post="' + esc(p.id) + '">' + (f ? '<img src="' + esc(f) + '" alt="" loading="lazy">' : '<span>' + esc(String(p.texto || "").slice(0, 90)) + "</span>") + "</button>"; }).join("") + "</div>" : '<div class="panel"><p class="muted">Ainda sem publicações.</p></div>') + "</div></section>";
  }
  function abrePost(id) {
    var p = Store.lista("posts").filter(function (x) { return x.id === id; })[0]; if (!p) return;
    var dlg = $("#dlg"); dlg.innerHTML = '<div class="dlg-head"><h3>Publicação</h3><button type="button" class="btn sm ghost" data-fecha-post>Fechar</button></div><div class="dlg-body">' + cartao(p) + "</div>"; dlg.showModal();
  }

  /* ---------- eventos de clique ---------- */
  function rerender() { var h = location.hash; if (h === "#feed") viewFeed(); else if (h.indexOf("#perfil-") === 0) viewPerfil(h.slice(1)); var d = $("#dlg[open] .post"); if (d) { var id = d.dataset.post; var p = Store.lista("posts").filter(function (x) { return x.id === id; })[0]; if (p) d.outerHTML = cartao(p); } if (/^#(conta|entrar)$/.test(h)) atividade(); }
  document.addEventListener("click", function (e) {
    var t = e.target, b;
    if ((b = t.closest("[data-curtir]"))) { var r = curtir(b.dataset.curtir); if (r && r.then) r.then(rerender); return; }
    if ((b = t.closest("[data-salvar-post]"))) { salvar(b.dataset.salvarPost); rerender(); return; }
    if ((b = t.closest("[data-seguir]"))) { var r2 = seguir(b.dataset.seguir); if (r2 && r2.then) r2.then(function () { rerender(); if (G.folha) G.folha(); }); return; }
    if ((b = t.closest("[data-denuncia-post]"))) { var p = Store.lista("posts").filter(function (x) { return x.id === b.dataset.denunciaPost; })[0]; if (!p) return; if (!b.dataset.ok) { b.dataset.ok = "1"; G.toast("Toque de novo para denunciar esta publicação."); setTimeout(function () { delete b.dataset.ok; }, 4000); return; } denunciar(p); return; }
    if ((b = t.closest("[data-partilha-post]"))) { var pp = Store.lista("posts").filter(function (x) { return x.id === b.dataset.partilhaPost; })[0], l = pp && anuncioDe(pp); if (!l) return; var u = location.href.split("#")[0] + "#perfil-" + l.id; if (navigator.share) navigator.share({ title: l.nome, text: (pp.texto || "").slice(0, 120), url: u }).catch(function () {}); else (navigator.clipboard ? navigator.clipboard.writeText(u) : Promise.reject()).then(function () { G.toast("Link copiado."); }).catch(function () { G.toast(u); }); return; }
    if ((b = t.closest("[data-abre-post]"))) { abrePost(b.dataset.abrePost); return; }
    if (t.closest("[data-fecha-post]")) { $("#dlg").close(); return; }
    if ((b = t.closest("[data-aba-feed]"))) { abaFeed = b.dataset.abaFeed; if (abaFeed === "seguindo" && !logado()) { abaFeed = "tudo"; pedeLogin("Entre para ver quem você segue."); return; } viewFeed(); return; }
    if ((b = t.closest("[data-tipo-feed]"))) { tipoFeed = tipoFeed === b.dataset.tipoFeed ? "" : b.dataset.tipoFeed; viewFeed(); return; }
    if ((b = t.closest("[data-ativ]"))) { abaAtiv = b.dataset.ativ; atividade(); }
  });

  /* ---------- bloco na página do anúncio ---------- */
  function blocoLugar(l) {
    if (!l || !l.anunciante || !on("feed")) return "";
    var n = posts().filter(function (p) { return p.lugarId === l.id; }).length, s = sigo(l.id);
    return '<div class="lrow" style="grid-template-columns:minmax(0,1fr) auto;padding:12px 16px;cursor:default"><span><b>' + seguidores(l.id) + " seguidores · " + n + (n === 1 ? " publicação" : " publicações") + '</b><small><a href="#perfil-' + esc(l.id) + '">Ver o perfil e as publicações</a></small></span><button type="button" class="btn sm' + (s ? " ghost" : "") + '" data-seguir="' + esc(l.id) + '">' + (s ? "Seguindo" : "Seguir") + "</button></div>";
  }

  /* ---------- atividade do usuário (Minha conta) ---------- */
  var abaAtiv = "curtidas";
  function blocoConta() { return on("feed") ? '<div class="panel stack" id="ativ" style="gap:10px"></div>' : ""; }
  function atividade() {
    var el = document.getElementById("ativ"); if (!el) return;
    var lista = [];
    if (abaAtiv === "curtidas") lista = meus("curtidas").map(function (c) { return Store.lista("posts").filter(function (p) { return p.id === c.p; })[0]; }).filter(function (p) { return p && anuncioDe(p); });
    if (abaAtiv === "salvos") lista = salvos().map(function (id) { return Store.lista("posts").filter(function (p) { return p.id === id; })[0]; }).filter(function (p) { return p && anuncioDe(p); });
    var seg = meus("seguindo").map(function (s) { return Store.obter("lugares", s.l); }).filter(function (l) { return l && ativo(l); });
    el.innerHTML = '<h3 style="margin:0">Minha atividade</h3><div class="chips"><button type="button" class="chip" data-ativ="curtidas" aria-pressed="' + (abaAtiv === "curtidas") + '">Curtidas</button><button type="button" class="chip" data-ativ="salvos" aria-pressed="' + (abaAtiv === "salvos") + '">Publicações salvas</button><button type="button" class="chip" data-ativ="seguindo" aria-pressed="' + (abaAtiv === "seguindo") + '">Seguindo (' + seg.length + ")</button></div>" +
      (abaAtiv === "seguindo" ? (seg.length ? '<div class="list">' + seg.map(function (l) { return '<a class="lrow nopos" href="#perfil-' + esc(l.id) + '"><span class="th">' + (G.foto(l) ? '<img src="' + esc(G.foto(l)) + '" alt="">' : "") + "</span><span><b>" + esc(l.nome) + "</b><small>" + esc(G.CATS[l.categoria] || "") + " · " + esc(l.cidade || "") + '</small></span><span class="val">perfil</span></a>'; }).join("") + "</div>" : '<p class="muted small">Você ainda não segue nenhuma empresa. Abra um perfil e toque em Seguir.</p>')
        : (lista.length ? '<div class="pgrade">' + lista.map(function (p) { var f = (p.fotos || []).map(Store.urlFoto).filter(Boolean)[0]; return '<button type="button" class="pmini" data-abre-post="' + esc(p.id) + '">' + (f ? '<img src="' + esc(f) + '" alt="">' : "<span>" + esc(String(p.texto || "").slice(0, 80)) + "</span>") + "</button>"; }).join("") + "</div>" : '<p class="muted small">' + (abaAtiv === "curtidas" ? "As publicações que você curtir aparecem aqui." : "Toque no marcador de uma publicação para guardá-la aqui.") + ' <a href="#feed">Abrir o feed</a></p>'));
  }
  new MutationObserver(function () { var el = document.getElementById("ativ"); if (el && !el.dataset.pronto) { el.dataset.pronto = "1"; atividade(); } }).observe(document.documentElement, { childList: true, subtree: true });

  /* ---------- publicar (painel do anunciante) ---------- */
  var novasFotos = [];
  function blocoPainel(l) {
    if (!on("feed")) return "";
    var ps = Store.lista("posts").filter(function (p) { return p.lugarId === l.id; }).sort(function (a, b) { return a.criadoEm < b.criadoEm ? 1 : -1; });
    novasFotos = [];
    return '<div class="panel stack" style="gap:12px" id="sp-box"><h3>Publicar no feed</h3><p class="small muted">Sua publicação aparece no feed para todo mundo e no topo para quem segue ' + esc(l.nome) + ". Vagas, quartos e vendas também entram aqui.</p>" +
      '<div class="form2"><div class="field"><label for="sp-tipo">Tipo</label><select id="sp-tipo">' + Object.keys(TIPOS).map(function (k) { return '<option value="' + k + '">' + TIPOS[k] + "</option>"; }).join("") + '</select></div><div class="field"><label for="sp-link">Link (opcional)</label><input id="sp-link" placeholder="https://"></div>' +
      '<div class="field full"><label for="sp-txt">Texto</label><textarea id="sp-txt" maxlength="1000" placeholder="Conte a novidade, a oferta ou a vaga."></textarea></div>' +
      '<div class="field full"><label for="sp-fotos">Fotos (até 4)</label><input type="file" id="sp-fotos" accept="image/*" multiple><div class="photos" id="sp-prev"></div></div></div>' +
      '<button type="button" class="btn" data-sp-publicar="' + esc(l.id) + '" style="justify-self:start">Publicar</button>' +
      (ps.length ? '<h3 style="margin-top:8px">Suas publicações</h3><div class="list">' + ps.map(function (p) { return '<div class="lrow" style="grid-template-columns:minmax(0,1fr) auto;padding:12px 16px;cursor:default"><span><b>' + esc(TIPOS[p.tipo] || "Novidade") + " · " + esc(quando(p.criadoEm)) + "</b><small>" + esc(String(p.texto || "").slice(0, 120)) + "</small><small>" + curtidasDe(p.id) + ' curtidas</small></span><button type="button" class="btn ghost sm" data-sp-apagar="' + esc(p.id) + '">Apagar</button></div>'; }).join("") + "</div>" : "") + "</div>";
  }
  document.addEventListener("change", function (e) {
    if (e.target.id !== "sp-fotos") return;
    var fs = Array.from(e.target.files || []).slice(0, 4 - novasFotos.length), prev = $("#sp-prev");
    (async function () { for (var i = 0; i < fs.length; i++) { try { novasFotos.push(await Store.salvarFoto(fs[i])); } catch (er) { G.toast(er.message || "Não foi possível enviar a foto."); break; } prev.innerHTML = novasFotos.map(function (s) { return '<figure><img src="' + esc(Store.urlFoto(s)) + '" alt=""></figure>'; }).join(""); } e.target.value = ""; })();
  });
  document.addEventListener("click", function (e) {
    var b = e.target.closest("[data-sp-publicar]");
    if (b) {
      var txt = $("#sp-txt").value.trim(), lk = $("#sp-link").value.trim();
      if (!txt && !novasFotos.length) { G.toast("Escreva um texto ou inclua uma foto."); return; }
      if (lk && !/^https:\/\//i.test(lk)) { G.toast("O link precisa começar com https://"); return; }
      b.disabled = true;
      Store.gravar("posts", Store.idProprio(Store.novoId("p")), { lugarId: b.dataset.spPublicar, tipo: $("#sp-tipo").value, texto: txt, fotos: novasFotos.slice(), link: lk, criadoEm: new Date().toISOString(), ativo: true })
        .then(function () { G.toast("Publicado no feed."); novasFotos = []; if (G.render) location.hash === "#anunciante" && G.views.anunciante(); }).catch(function (er) { b.disabled = false; G.toast(er.message || "Não foi possível publicar."); });
      return;
    }
    var a = e.target.closest("[data-sp-apagar]");
    if (a) { if (!a.dataset.ok) { a.dataset.ok = "1"; a.textContent = "Confirmar"; return; } Store.apagar("posts", a.dataset.spApagar).then(function () { G.toast("Publicação apagada."); G.views.anunciante(); }); }
  });

  /* ---------- carrossel de banners ---------- */
  function cfgVitrine() { return Object.assign({ minutos: 30, limite: 10 }, G.config().vitrine || {}); }
  function rodada() { return Math.floor(Date.now() / (Math.max(5, Number(cfgVitrine().minutos) || 30) * 60000)); }
  function hash(s) { var h = 0; for (var i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) | 0; return Math.abs(h); }
  function bannersAtivos() { return G.lugares().filter(function (l) { return l.anunciante && l.banner && l.banner.src && Store.urlFoto(l.banner.src) && !l.bannerPausado; }); }
  /* Monta a rodada: um banner por anunciante, até o limite; o rodízio muda a cada intervalo, igual para todo mundo. */
  function montaRodada(k) {
    var c = cfgVitrine(), lim = Math.max(1, Math.min(10, Number(c.limite) || 10)); k = k == null ? rodada() : k;
    var porConta = {}; bannersAtivos().forEach(function (l) { var d = donoDe(l.id) || l.donoUid || l.id; (porConta[d] = porConta[d] || []).push(l); });
    var contas = Object.keys(porConta).sort(function (a, b) { return hash(a) - hash(b); }), N = contas.length, esc2 = [];
    if (N) { var ini = (k * lim) % N; for (var i = 0; i < Math.min(lim, N); i++) esc2.push(contas[(ini + i) % N]); }
    var slides = esc2.map(function (d) { var bs = porConta[d].sort(function (a, b) { return a.id < b.id ? -1 : 1; }); var l = bs[k % bs.length]; return { tipo: "anuncio", l: l }; });
    if (slides.length < lim) {
      var hj = G.hojeISO(), R = window.Recursos;
      var evs = G.lugares().filter(function (l) { return (l.categoria === "evento" || l.categoria === "show") && (l.gratuito || Number(l.precoMin) === 0) && G.foto(l) && !(R && (R.encerrado(l) || l.cancelado)) && (!l.dataFim || l.dataFim >= hj); })
        .sort(function (a, b) { return (a.dataInicio || "9999") < (b.dataInicio || "9999") ? -1 : 1; });
      if (evs.length) { var off = k % evs.length; for (var j = 0; j < evs.length && slides.length < lim; j++) slides.push({ tipo: "evento", l: evs[(off + j) % evs.length] }); }
    }
    return slides;
  }
  function secaoVitrine() {
    if (!on("vitrine")) return "";
    var s = montaRodada(); if (!s.length) return "";
    return '<section class="block reveal vit-sec"><div class="vit" data-rodada="' + rodada() + '" aria-roledescription="carrossel" aria-label="Anunciantes e eventos"><div class="vit-trilho">' + s.map(function (x, i) {
      var l = x.l;
      if (x.tipo === "anuncio") return '<a class="vit-slide" href="#lugar-' + esc(l.id) + '" aria-label="' + esc(l.nome) + ' (patrocinado)"><img src="' + esc(Store.urlFoto(l.banner.src)) + '" alt="' + esc(l.banner.texto || l.nome) + '"' + (i ? ' loading="lazy"' : "") + '><span class="vit-tag">Patrocinado</span></a>';
      return '<a class="vit-slide ev" href="#lugar-' + esc(l.id) + '"><img src="' + esc(G.foto(l)) + '" alt=""' + (i ? ' loading="lazy"' : "") + '><span class="vit-cap"><small>Evento grátis' + (l.quando ? " · " + esc(String(l.quando).split(" (")[0]) : "") + "</small><b>" + esc(l.nome) + "</b></span></a>";
    }).join("") + '</div><div class="vit-dots">' + s.map(function (x, i) { return '<button type="button" data-vit="' + i + '" aria-label="Banner ' + (i + 1) + '" aria-current="' + (i === 0) + '"></button>'; }).join("") + "</div></div></section>";
  }
  /* avanço automático a cada 6 s e troca da rodada no horário certo */
  function vitAtual(v) { var tr = v.querySelector(".vit-trilho"); return Math.round(tr.scrollLeft / Math.max(1, tr.clientWidth)); }
  function vitVai(v, i) { var tr = v.querySelector(".vit-trilho"), n = tr.children.length; i = (i + n) % n; tr.scrollTo({ left: i * tr.clientWidth, behavior: matchMedia("(prefers-reduced-motion: reduce)").matches ? "auto" : "smooth" }); Array.from(v.querySelectorAll(".vit-dots button")).forEach(function (b, k) { b.setAttribute("aria-current", k === i); }); }
  var tocado = 0;
  document.addEventListener("pointerdown", function (e) { if (e.target.closest(".vit")) tocado = Date.now(); });
  document.addEventListener("click", function (e) { var b = e.target.closest("[data-vit]"); if (b) { tocado = Date.now(); vitVai(b.closest(".vit"), Number(b.dataset.vit)); } });
  document.addEventListener("scroll", function (e) { var tr = e.target && e.target.classList && e.target.classList.contains("vit-trilho") ? e.target : null; if (!tr) return; var v = tr.closest(".vit"), i = vitAtual(v); Array.from(v.querySelectorAll(".vit-dots button")).forEach(function (b, k) { b.setAttribute("aria-current", k === i); }); }, true);
  setInterval(function () {
    var v = document.querySelector(".vit"); if (!v || document.hidden) return;
    if (Number(v.dataset.rodada) !== rodada()) { var sec = v.closest(".vit-sec"), novo = secaoVitrine(); if (sec && novo) { var tmp = document.createElement("div"); tmp.innerHTML = novo; sec.replaceWith(tmp.firstChild); } return; }
    if (Date.now() - tocado > 8000 && !matchMedia("(prefers-reduced-motion: reduce)").matches) vitVai(v, vitAtual(v) + 1);
  }, 6000);

  /* ---------- painel master: Banners e Publicações ---------- */
  function abaBanners(el) {
    var c = cfgVitrine(), k = rodada(), agora = montaRodada(k), prox = montaRodada(k + 1), bs = bannersAtivos();
    var semBanner = G.lugares().filter(function (l) { return l.anunciante && !(l.banner && l.banner.src); });
    function lin(x) { return '<div class="lrow" style="grid-template-columns:96px minmax(0,1fr);padding:8px 12px;cursor:default"><span class="th" style="width:96px;height:38px;border-radius:8px;overflow:hidden">' + '<img src="' + esc(x.tipo === "anuncio" ? Store.urlFoto(x.l.banner.src) : G.foto(x.l)) + '" alt="" style="width:100%;height:100%;object-fit:cover"></span><span><b>' + esc(x.l.nome) + "</b><small>" + (x.tipo === "anuncio" ? "Anunciante" : "Evento grátis (completa a rodada)") + "</small></span></div>"; }
    el.innerHTML = '<div class="stack"><div class="panel stack" style="gap:10px"><h3>Carrossel da página inicial</h3><p class="small muted">Cada anúncio pago tem 1 banner. Por rodada entram até ' + Math.min(10, c.limite) + " anunciantes, um banner de cada, sem repetir anunciante. A rodada muda a cada " + c.minutos + " minutos, igual para todos os visitantes. Se faltarem anunciantes, eventos grátis completam as vagas.</p>" +
      '<div class="form2"><div class="field"><label for="vt-min">Troca a cada (minutos)</label><input id="vt-min" type="number" min="5" max="240" value="' + esc(c.minutos) + '"></div><div class="field"><label for="vt-lim">Banners por rodada (até 10)</label><input id="vt-lim" type="number" min="1" max="10" value="' + esc(c.limite) + '"></div></div><button type="button" class="btn" data-vt-salvar style="justify-self:start">Salvar carrossel</button></div>' +
      '<div class="panel stack" style="gap:8px"><h3>No ar agora (' + agora.length + ")</h3>" + (agora.length ? '<div class="list">' + agora.map(lin).join("") + "</div>" : '<p class="muted small">Nada para mostrar: nenhum banner enviado e nenhum evento grátis com foto.</p>') + "</div>" +
      '<div class="panel stack" style="gap:8px"><h3>Próxima rodada</h3>' + (prox.length ? '<div class="list">' + prox.map(lin).join("") + "</div>" : '<p class="muted small">—</p>') + "</div>" +
      '<div class="panel stack" style="gap:8px"><h3>Banners enviados (' + bs.length + ")</h3>" + (G.lugares().filter(function (l) { return l.anunciante && l.banner && l.banner.src; }).map(function (l) { return '<div class="lrow" style="grid-template-columns:96px minmax(0,1fr) auto;padding:8px 12px;cursor:default"><span class="th" style="width:96px;height:38px;border-radius:8px;overflow:hidden"><img src="' + esc(Store.urlFoto(l.banner.src)) + '" alt="" style="width:100%;height:100%;object-fit:cover"></span><span><b>' + esc(l.nome) + "</b><small>" + (l.bannerPausado ? "Pausado pela equipe" : "No rodízio") + '</small></span><button type="button" class="btn ghost sm" data-vt-pausa="' + esc(l.id) + '">' + (l.bannerPausado ? "Voltar ao rodízio" : "Pausar") + "</button></div>"; }).join("") || '<p class="muted small">Nenhum anunciante enviou banner ainda.</p>') + "</div>" +
      (semBanner.length ? '<div class="panel stack" style="gap:8px"><h3>Anúncios sem banner (' + semBanner.length + ')</h3><p class="small muted">Não entram no carrossel até o anunciante enviar o banner no painel dele.</p><p class="small">' + semBanner.map(function (l) { return esc(l.nome); }).join(" · ") + "</p></div>" : "") + "</div>";
    el.onclick = function (e) {
      if (e.target.closest("[data-vt-salvar]")) { var cfg = Object.assign({}, Store.obter("config", "geral") || {}); cfg.vitrine = { minutos: Math.max(5, Math.min(240, Number($("#vt-min", el).value) || 30)), limite: Math.max(1, Math.min(10, Number($("#vt-lim", el).value) || 10)) }; Store.gravar("config", "geral", cfg).then(function () { G.toast("Carrossel salvo."); abaBanners(el); }); return; }
      var p = e.target.closest("[data-vt-pausa]"); if (p) { var l = Store.obter("lugares", p.dataset.vtPausa); if (!l) return; var d = Object.assign({}, l); d.bannerPausado = !l.bannerPausado; Store.gravar("lugares", l.id, d).then(function () { G.toast(d.bannerPausado ? "Banner pausado." : "Banner de volta ao rodízio."); setTimeout(function () { abaBanners(el); }, 300); }); }
    };
  }
  function abaPosts(el) {
    var ps = Store.lista("posts").sort(function (a, b) { return a.criadoEm < b.criadoEm ? 1 : -1; });
    var den = {}; Store.lista("avisos").forEach(function (a) { if (a.tipo === "denuncia" && a.postId) den[a.postId] = (den[a.postId] || 0) + 1; });
    el.innerHTML = '<div class="stack"><div class="kpis"><div class="kpi"><b class="num">' + ps.length + '</b><span>publicações</span></div><div class="kpi"><b class="num">' + Object.keys(den).length + '</b><span>com denúncia</span></div><div class="kpi"><b class="num">' + Store.lista("curtidas").length + '</b><span>curtidas</span></div><div class="kpi"><b class="num">' + Store.lista("seguindo").length + '</b><span>seguidores</span></div></div>' +
      '<div class="list">' + (ps.length ? ps.slice(0, 200).map(function (p) { var l = Store.obter("lugares", p.lugarId) || {}; return '<div class="lrow" style="grid-template-columns:minmax(0,1fr) auto;padding:12px 16px;cursor:default;align-items:start"><span><b>' + esc(l.nome || "Anúncio removido") + " · " + esc(TIPOS[p.tipo] || "") + (den[p.id] ? ' <span class="pill warn">' + den[p.id] + " denúncia" + (den[p.id] > 1 ? "s" : "") + "</span>" : "") + (p.ativo === false ? ' <span class="pill">oculta</span>' : "") + "</b><small>" + esc(quando(p.criadoEm)) + " · " + curtidasDe(p.id) + " curtidas</small><small>" + esc(String(p.texto || "").slice(0, 220)) + '</small></span><span class="row" style="gap:6px"><button type="button" class="btn ghost sm" data-mp-ver="' + esc(p.id) + '">Ver</button><button type="button" class="btn ghost sm" data-mp-ocultar="' + esc(p.id) + '">' + (p.ativo === false ? "Mostrar" : "Ocultar") + '</button><button type="button" class="btn ghost sm" data-mp-apagar="' + esc(p.id) + '">Apagar</button></span></div>'; }).join("") : '<p class="muted small" style="padding:12px">Nenhuma publicação ainda.</p>') + "</div></div>";
    el.onclick = function (e) {
      var v = e.target.closest("[data-mp-ver]"); if (v) { abrePost(v.dataset.mpVer); return; }
      var o = e.target.closest("[data-mp-ocultar]"); if (o) { var p = Store.lista("posts").filter(function (x) { return x.id === o.dataset.mpOcultar; })[0]; if (!p) return; var d = Object.assign({}, p); d.ativo = p.ativo === false; Store.gravar("posts", p.id, d).then(function () { G.toast(d.ativo ? "Publicação visível." : "Publicação oculta."); setTimeout(function () { abaPosts(el); }, 300); }); return; }
      var a = e.target.closest("[data-mp-apagar]"); if (a) { if (!a.dataset.ok) { a.dataset.ok = "1"; a.textContent = "Confirmar"; return; } Store.apagar("posts", a.dataset.mpApagar).then(function () { G.toast("Publicação apagada."); setTimeout(function () { abaPosts(el); }, 300); }); }
    };
  }

  Store.assinar(function (col) { if (!Store.estado.pronto) return; if (col === "posts" || col === "curtidas" || col === "seguindo") { var h = location.hash; if (h === "#feed" || h.indexOf("#perfil-") === 0) rerender(); } });
  G.views.feed = viewFeed; G.views.perfil = viewPerfil;
  window.Social = { secao: secaoVitrine, blocoLugar: blocoLugar, blocoConta: blocoConta, blocoPainel: blocoPainel, abaBanners: abaBanners, abaPosts: abaPosts, montaRodada: montaRodada, TIPOS: TIPOS };
})();
