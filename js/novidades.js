/* Novidades do CoraçãoBR
   Receita: Clube CoraçãoBR (assinatura com carteirinha digital e QR), destaque pago no Mural, patrocínio de seção, painel de receita do master.
   Engajamento: assistente "Pergunte ao CoraçãoBR" (IA no servidor), notificações no celular, pets perdidos e achados (com QR-DOG),
   perguntas e respostas da comunidade. Crescimento: seletor de cidades e gerador de arte para o Instagram. */
(function () {
  "use strict";
  var G = window.Guia; if (!G) return;
  var esc = G.esc, ic = G.ic, $ = function (s, r) { return (r || document).querySelector(s); };
  function hoje() { return G.hojeISO(); }
  function br(iso) { return iso ? String(iso).slice(0, 10).split("-").reverse().join("/") : "—"; }
  function somaDias(iso, n) { var d = new Date(iso + "T12:00:00"); d.setDate(d.getDate() + n); return d.toISOString().slice(0, 10); }
  function reais(n) { return G.reais(n); }
  function cfg() { return G.config(); }
  function servidor() { return !!(Store.servidor && Store.servidor()); }
  function norm(t) { return String(t || "").toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, ""); }
  function cab(eb, t, sub) { return '<div><p class="eyebrow">' + eb + '</p><h1 class="page-h" style="margin-top:4px">' + t + "</h1>" + (sub ? '<p class="muted" style="margin-top:8px;max-width:62ch">' + sub + "</p>" : "") + "</div>"; }
  function nomeConta() { var c = Store.conta && Store.conta(); return (c && c.nome) || ""; }
  function pgDoc(uid) { return uid ? Store.obter("pagamentos", uid) || {} : {}; }
  function quando(iso) { try { return new Date(iso).toLocaleDateString("pt-BR", { timeZone: "America/Chicago", day: "2-digit", month: "short" }); } catch (e) { return br(iso); } }
  function dlgAbre(html) { var d = $("#dlg"); d.innerHTML = '<div class="dlg stack" style="gap:12px">' + html + "</div>"; d.showModal(); Array.from(d.querySelectorAll("[data-fecha]")).forEach(function (b) { b.onclick = function () { d.close(); }; }); return d; }
  function precoClube() { return Number(cfg().precoClube) || 15; }
  function precoMural() { return Number(cfg().precoMural) || 10; }
  function diasMural() { return Math.max(1, Number(cfg().diasMural) || 30); }

  /* ======================= Clube CoraçãoBR ======================= */
  function clubeDe(uid) { var c = pgDoc(uid).clube; return c && c.ate ? c : null; }
  function membro(uid) { var c = clubeDe(uid); return !!(c && c.ate >= hoje()); }
  function parceirosClube() { return G.lugares().filter(function (l) { return l.descontoClube && (!window.Pag || Pag.visivel(l)); }); }
  function numeroClube(uid) { var c = clubeDe(uid); if (c && c.numero) return c.numero; var h = 0; String(uid).split("").forEach(function (ch) { h = (h * 31 + ch.charCodeAt(0)) >>> 0; }); return ("0000000" + h.toString(16).toUpperCase()).slice(-8); }
  function linkValidar(uid) { return location.href.split("#")[0] + "#clube-validar-" + encodeURIComponent(uid); }
  function qrSvg(txt, cel) { try { var q = window.qrcode(0, "M"); q.addData(txt); q.make(); return q.createSvgTag({ cellSize: cel || 5, margin: 1, scalable: true }); } catch (e) { return ""; } }
  function carteirinha(uid) {
    var c = clubeDe(uid) || {}, ok = membro(uid);
    return '<div class="clb-card' + (ok ? "" : " off") + '"><div class="clb-top"><span class="clb-brand">Coração<b>BR</b></span><span class="clb-tag">Clube</span></div>' +
      '<div class="clb-mid"><div><small>Membro</small><b>' + esc(c.nome || nomeConta() || "Membro") + "</b><small>Nº " + esc(numeroClube(uid)) + "</small><small>" + (ok ? "Válido até " + br(c.ate) : "Assinatura vencida em " + br(c.ate)) + '</small></div><div class="clb-qr">' + qrSvg(linkValidar(uid), 4) + "</div></div>" +
      '<p class="clb-pe">Mostre esta tela no caixa. O atendente aponta a câmera para o QR e confere na hora.</p></div>';
  }
  function viewClube() {
    var uid = Store.uid(), ok = uid && membro(uid), ps = parceirosClube(), c = clubeDe(uid);
    var lista = ps.length ? '<div class="clb-ps">' + ps.slice(0, 40).map(function (l) { var f = G.foto ? G.foto(l) : ""; return '<a class="clb-p' + (f ? " com-foto" : "") + '" href="#lugar-' + esc(l.id) + '">' + (f ? '<span class="clb-pf"><img src="' + esc(f) + '" alt="" loading="lazy"><em>' + esc(l.descontoClube) + "</em></span>" : "") + '<span class="clb-pt"><b>' + esc(l.nome) + "</b>" + (f ? "" : "<span>" + esc(l.descontoClube) + "</span>") + "<small>" + esc((G.CATS[l.categoria] ? G.CATS[l.categoria] + " · " : "") + G.regiao(l)) + "</small></span></a>"; }).join("") + "</div>"
      : '<div class="dk-card dk-flat"><p class="muted">Os primeiros negócios parceiros estão entrando agora. Anunciantes podem oferecer um desconto para membros direto no painel.</p></div>';
    var comprar = "";
    if (!uid) comprar = '<div class="clb-cta"><p>Entre na sua conta para assinar.</p><a class="btn" href="#entrar">Entrar ou criar conta</a></div>';
    else if (window.Pag && Pag.checkout) comprar = Pag.checkout({ plano: "clube", qtd: 1, comeca: "agora", valor: precoClube(), volta: "clube", rotulo: "CoracaoBR clube" });
    G.app.innerHTML = '<section class="block clb"><div class="wrap stack" style="max-width:980px;gap:22px">' +
      cab("Para quem mora aqui", "Clube CoraçãoBR", "Descontos nos negócios brasileiros do guia, carteirinha digital no celular e o orgulho de manter vivo o guia da nossa comunidade.") +
      '<div class="clb-grid"><div class="stack" style="gap:16px">' + (uid && c ? carteirinha(uid) + (ok && window.Wallet ? '<div class="clb-wl">' + Wallet.botao("clube", uid, { nome: c.nome || nomeConta() || "", linha: "Membro do Clube CoraçãoBR" }) + "</div>" : "") : '<div class="clb-card demo"><div class="clb-top"><span class="clb-brand">Coração<b>BR</b></span><span class="clb-tag">Clube</span></div><div class="clb-mid"><div><small>Membro</small><b>Seu nome aqui</b><small>Nº 00000000</small><small>Carteirinha digital</small></div><div class="clb-qr">' + qrSvg("https://coracaobr", 4) + '</div></div><p class="clb-pe">Exemplo da carteirinha.</p></div>') +
      '<ul class="an-ck clb-ben"><li>' + ic("ticket") + "Descontos exclusivos nos parceiros (lista abaixo)</li><li>" + ic("star") + "Carteirinha digital com QR, validada na hora</li><li>" + ic("bell") + "Avisos de eventos e cupons antes de todo mundo</li><li>" + ic("heart") + "Ajuda a manter o guia gratuito para quem acabou de chegar</li></ul></div>" +
      '<div class="pg-main">' + (ok ? '<div class="pg-st pg-ativo"><b>Você é membro do Clube até ' + br(c.ate) + ".</b><span>Renovar agora soma mais 1 mês.</span></div>" : "") +
      '<div class="an-plan"><p class="an-pl">Assinatura mensal</p><div class="an-pv">' + reais(precoClube()) + '<small style="font-size:.9rem;font-weight:600"> / mês</small></div><p class="small muted">Pagamento por Pix, sem renovação automática: você renova quando quiser.</p></div>' + comprar + "</div></div>" +
      '<div class="head" style="margin:6px 0 0"><h2 style="font-size:1.3rem">Parceiros com desconto</h2></div>' + lista +
      '<p class="note">O desconto é oferecido e cumprido por cada negócio. Confira as condições no local.</p></div></section>';
  }
  function viewValidar(r) {
    var uid = decodeURIComponent(r.replace(/^clube-validar-/, "")), c = clubeDe(uid), ok = membro(uid);
    G.app.innerHTML = '<section class="block"><div class="wrap stack" style="max-width:520px;gap:16px;text-align:center">' +
      '<div class="clb-val ' + (ok ? "ok" : "no") + '"><span>' + (ok ? "✓" : "!") + "</span><b>" + (ok ? "Membro ativo do Clube CoraçãoBR" : c ? "Assinatura vencida" : "Carteirinha não encontrada") + "</b>" +
      (c ? "<p>" + esc(c.nome || "Membro") + " · Nº " + esc(numeroClube(uid)) + "</p><p>" + (ok ? "Válida até " + br(c.ate) : "Venceu em " + br(c.ate)) + "</p>" : "<p>Confira se o QR é do Clube CoraçãoBR.</p>") +
      '<small>Consultado em ' + new Date().toLocaleString("pt-BR") + "</small></div>" +
      (ok ? '<p class="muted small">Confira o nome com um documento, se quiser. O desconto vale conforme o combinado no seu anúncio.</p>' : "") +
      '<a class="more" href="#clube">Conheça o Clube CoraçãoBR →</a></div></section>';
  }

  /* ======================= Destaque pago no Mural ======================= */
  function muralDestaque(c) {
    if (!c || !c._dono) { var dono = String((c && c.id) || "").split("~")[0]; if (!dono) return false; c = Object.assign({}, c, { _dono: dono }); }
    var h = hoje();
    return ((pgDoc(c._dono).mural) || []).some(function (m) { return m.itemId === c.id && m.inicio <= h && h <= m.fim; });
  }
  function viewMuralPago(r) {
    var uid = Store.uid(); if (!uid) { location.hash = "#entrar"; return; }
    var id = decodeURIComponent(r.replace(/^extra-mural-/, "")), it = Store.obter("classificados", id);
    if (!it) { location.hash = "#mural"; return; }
    var ja = muralDestaque(it);
    G.app.innerHTML = '<section class="block pg"><div class="wrap"><header class="xp-h"><div><a class="more" href="#mural">← Mural</a><p class="eyebrow" style="margin-top:8px">Destaque</p><h1 class="page-h">Destacar no Mural</h1></div></header>' +
      '<div class="pg-grid"><div class="pg-main">' + (ja ? '<div class="pg-st pg-ativo"><b>Esta publicação já está em destaque.</b><span>Comprar de novo soma mais ' + diasMural() + " dias.</span></div>" : "") +
      '<div class="dk-card dk-flat"><p><b>' + esc(it.titulo) + "</b></p><p class=\"small muted\">Sua publicação fica em primeiro no Mural, com a etiqueta Destaque, por " + diasMural() + " dias.</p></div>" +
      (window.Pag && Pag.checkout ? Pag.checkout({ plano: "mural", qtd: 1, comeca: "agora", itemId: id, valor: precoMural(), volta: "mural", rotulo: "CoracaoBR mural" }) : "") +
      '</div><aside class="pg-side"><div class="an-plan"><p class="an-pl">Destaque no Mural</p><div class="an-pv">' + reais(precoMural()) + '</div><ul class="an-ck"><li>' + ic("star") + "Primeiro lugar no Mural por " + diasMural() + " dias</li><li>" + ic("star") + "Etiqueta Destaque</li><li>" + ic("bell") + "Pagamento único por Pix</li></ul></div></aside></div></div></section>";
  }

  /* ======================= Patrocínio de seção (Explorar) ======================= */
  function patrocinio(grade, grupo) {
    var velho = grade.parentNode && grade.parentNode.querySelector(".pat-sec"); if (velho) velho.remove();
    var p = (cfg().patrocinios || {})[grupo || ""]; if (!p || !p.nome || (p.ate && p.ate < hoje())) return;
    var el = document.createElement("a"); el.className = "pat-sec"; el.href = p.lugarId ? "#lugar-" + p.lugarId : (p.link || "#anuncie");
    if (!p.lugarId && /^https?:/.test(p.link || "")) { el.target = "_blank"; el.rel = "noopener sponsored"; }
    el.innerHTML = '<span class="pat-k">Seção oferecida por</span><b>' + esc(p.nome) + "</b>" + (p.texto ? "<span>" + esc(p.texto) + "</span>" : "") + '<em>Saiba mais →</em>';
    grade.parentNode.insertBefore(el, grade);
  }

  /* ======================= Assistente "Pergunte ao CoraçãoBR" ======================= */
  var CHAT = [], pensando = false;
  var SUGESTOES = ["Onde comer churrasco brasileiro?", "Tem evento brasileiro neste fim de semana?", "Dentista que fala português", "Mercado com produtos do Brasil", "Igreja com culto em português", "O que fazer com crianças de graça?"];
  function buscaLocal(q) {
    var STOP = "onde qual quais como para pra com que uma tem quero perto aqui dallas texas melhor bom boa".split(" ");
    var ts = norm(q).split(/[^a-z0-9]+/).filter(function (t) { return t.length > 2 && STOP.indexOf(t) < 0; });
    if (!ts.length) return [];
    return G.lugares().map(function (l) {
      var nome = norm(l.nome), txt = norm([l.nome, G.CATS[l.categoria] || l.categoria, l.bairro, l.cidade, l.descricao].join(" ")), sc = 0;
      ts.forEach(function (t) { if (nome.indexOf(t) >= 0) sc += 5; else if (txt.indexOf(t.slice(0, Math.max(4, t.length - 2))) >= 0) sc += 2; });
      return { l: l, sc: sc ? sc + (Number(l.nota) || 0) / 2.5 : 0 };
    }).filter(function (x) { return x.sc > 0; }).sort(function (a, b) { return b.sc - a.sc; }).slice(0, 8).map(function (x) { return x.l.id; });
  }
  function textoResposta(t) {
    return esc(t).replace(/\[\[([A-Za-z0-9_~-]{1,130})\]\]/g, function (m, id) { var l = Store.obter("lugares", id); return l ? '<a class="as-lk" href="#lugar-' + esc(id) + '">' + esc(l.nome) + "</a>" : ""; }).replace(/\n/g, "<br>");
  }
  function cardsIds(ids) {
    var ls = (ids || []).map(function (id) { return Store.obter("lugares", id); }).filter(Boolean).slice(0, 6);
    return ls.length ? '<div class="as-cards">' + ls.map(function (l) { return '<a class="as-c" href="#lugar-' + esc(l.id) + '"><b>' + esc(l.nome) + "</b><small>" + esc(G.CATS[l.categoria] || l.categoria || "") + " · " + esc(G.regiao(l)) + (l.nota ? " · " + (window.Reacoes ? Reacoes.selo(l.nota) : "★") + " " + Number(l.nota).toFixed(1) : "") + "</small></a>"; }).join("") + "</div>" : "";
  }
  function viewAssistente() {
    G.app.innerHTML = '<section class="block as"><div class="wrap stack" style="max-width:760px;gap:16px">' +
      cab("Assistente", "Pergunte ao CoraçãoBR", "Pergunte do seu jeito: onde comer, eventos do fim de semana, profissionais que falam português. A resposta vem com os lugares do guia.") +
      '<div class="as-box" id="as-box" aria-live="polite">' + (CHAT.length ? CHAT.map(function (m) { return m.role === "user" ? '<div class="as-m eu">' + esc(m.content) + "</div>" : '<div class="as-m ela">' + (m.html || textoResposta(m.content)) + "</div>"; }).join("") : '<div class="as-vazio"><span class="as-av">' + ic("chat") + '</span><p>Oi! Sou o assistente do CoraçãoBR. Em que posso ajudar?</p><div class="chips">' + SUGESTOES.map(function (s) { return '<button type="button" class="chip" data-as-sug>' + esc(s) + "</button>"; }).join("") + "</div></div>") +
      (pensando ? '<div class="as-m ela as-pens"><i></i><i></i><i></i></div>' : "") + "</div>" +
      '<form class="as-form" data-as-form><input name="q" maxlength="500" autocomplete="off" placeholder="Escreva sua pergunta…" aria-label="Sua pergunta"' + (pensando ? " disabled" : "") + '><button class="btn" type="submit"' + (pensando ? " disabled" : "") + ">" + ic("send") + '<span class="sr">Enviar</span></button></form>' +
      (CHAT.length ? '<button type="button" class="more" data-as-limpa style="justify-self:start">Começar outra conversa</button>' : "") +
      '<p class="note">As respostas podem ter erros. Confirme horários e preços com o lugar. Orientação geral, não é assessoria jurídica, médica ou fiscal.</p></div></section>';
    var box = $("#as-box"); if (box) box.scrollTop = box.scrollHeight;
    var inp = G.app.querySelector("[data-as-form] input"); if (inp && !pensando && CHAT.length) inp.focus({ preventScroll: true });
  }
  function pergunta(q) {
    q = String(q || "").trim(); if (q.length < 3 || pensando) return;
    var hist = CHAT.filter(function (m) { return m.content; }).slice(-6).map(function (m) { return { role: m.role, content: m.content }; });
    CHAT.push({ role: "user", content: q }); pensando = true; viewAssistente();
    var fim = function (txt, ids, aviso) {
      pensando = false;
      var html = (txt ? textoResposta(txt) : "") + (aviso ? "<p>" + esc(aviso) + "</p>" : "") + cardsIds(ids);
      if (!txt && !(ids || []).length) html = "Não encontrei isso no guia. Tente outras palavras ou veja o <a href=\"#explorar\">Explorar</a>.";
      CHAT.push({ role: "assistant", content: txt || "", html: html });
      if (location.hash === "#assistente") viewAssistente();
    };
    if (servidor()) {
      Store.api("assistente", { pergunta: q, historico: hist, cidade: G.cidadeAtual ? G.cidadeAtual() : "dfw" }).then(function (j) { fim(j.resposta, j.ids, j.modo === "busca" && !j.resposta ? "Veja o que encontrei no guia:" : ""); })
        .catch(function (er) { fim("", buscaLocal(q), er.message || "Não consegui responder agora. Veja o que encontrei no guia:"); });
    } else setTimeout(function () { var ids = buscaLocal(q); fim("", ids, ids.length ? "Veja o que encontrei no guia:" : ""); }, 350);
  }
  document.addEventListener("submit", function (e) { var f = e.target.closest("[data-as-form]"); if (!f) return; e.preventDefault(); pergunta(f.q.value); });
  document.addEventListener("click", function (e) {
    var s = e.target.closest("[data-as-sug]"); if (s) { pergunta(s.textContent); return; }
    if (e.target.closest("[data-as-limpa]")) { CHAT = []; viewAssistente(); }
  });

  /* ======================= Notificações no celular ======================= */
  function b64uBytes(s) { s = s.replace(/-/g, "+").replace(/_/g, "/"); while (s.length % 4) s += "="; var b = atob(s), u = new Uint8Array(b.length); for (var i = 0; i < b.length; i++) u[i] = b.charCodeAt(i); return u; }
  function pushSuportado() { return servidor() && "serviceWorker" in navigator && "PushManager" in window && "Notification" in window; }
  function pushLigado() { try { return localStorage.getItem("push-ok") === "1" && Notification.permission === "granted"; } catch (e) { return false; } }
  async function pushLigar() {
    if (!pushSuportado()) throw new Error("Este navegador não recebe notificações. No iPhone, instale o app na tela inicial primeiro.");
    var perm = await Notification.requestPermission(); if (perm !== "granted") throw new Error("Permissão negada. Libere as notificações nas configurações do navegador.");
    var reg = await navigator.serviceWorker.register("sw.js"); await navigator.serviceWorker.ready;
    var k = await Store.api("push_chave");
    var sub = await reg.pushManager.getSubscription(); if (!sub) sub = await reg.pushManager.subscribe({ userVisibleOnly: true, applicationServerKey: b64uBytes(k.chave) });
    var temas = []; try { temas = JSON.parse(localStorage.getItem("temas") || "[]"); } catch (e) { /* ok */ }
    await Store.api("push_inscrever", { endpoint: sub.endpoint, temas: ["eventos"].concat(temas) });
    try { localStorage.setItem("push-ok", "1"); localStorage.setItem("push-uid", Store.uid() || ""); } catch (e) { /* ok */ }
    return sub;
  }
  /* O aparelho fica ligado à conta que está logada (para o aviso pelo CEP): se a pessoa ativou antes de entrar ou trocou de conta, reinscreve sozinho. */
  async function pushSincroniza() {
    if (!pushSuportado() || Notification.permission !== "granted" || !Store.uid()) return;
    var ult = ""; try { ult = localStorage.getItem("push-uid") || ""; } catch (e) { /* ok */ }
    if (ult === Store.uid()) return;
    var reg = await navigator.serviceWorker.getRegistration(); var sub = reg && await reg.pushManager.getSubscription(); if (!sub) return;
    var temas = []; try { temas = JSON.parse(localStorage.getItem("temas") || "[]"); } catch (e) { /* ok */ }
    await Store.api("push_inscrever", { endpoint: sub.endpoint, temas: ["eventos"].concat(temas) });
    try { localStorage.setItem("push-ok", "1"); localStorage.setItem("push-uid", Store.uid()); } catch (e) { /* ok */ }
  }
  (function espera(n) { if (window.Store && Store.estado && Store.estado.pronto) { pushSincroniza().catch(function () { /* tenta na próxima visita */ }); return; } if (n < 40) setTimeout(function () { espera(n + 1); }, 500); })(0);
  /* Teste do aviso "perto de você" neste celular (qualquer conta) */
  async function pushTestePerto() {
    var sub = null; try { var reg = await navigator.serviceWorker.getRegistration(); sub = reg && await reg.pushManager.getSubscription(); } catch (e) { sub = null; }
    if (!sub || Notification.permission !== "granted") sub = await pushLigar();
    return Store.api("push_perto_teste", { endpoint: sub.endpoint });
  }
  async function pushDesligar() {
    try { var reg = await navigator.serviceWorker.getRegistration(); var sub = reg && await reg.pushManager.getSubscription(); if (sub) { await Store.api("push_sair", { endpoint: sub.endpoint }); await sub.unsubscribe(); } } catch (e) { /* ok */ }
    try { localStorage.removeItem("push-ok"); } catch (e) { /* ok */ }
  }
  function blocoPush() {
    if (!pushSuportado()) return "";
    var on = pushLigado();
    return '<div class="df-cta push-box"><div><b>' + (on ? "Notificações ligadas neste aparelho" : "Receber avisos no celular") + "</b><span>" + (on ? "Você recebe os eventos do fim de semana e novidades do guia." : "Eventos do fim de semana, cupons e novidades, direto na tela do celular.") + '</span></div><button type="button" class="btn' + (on ? " ghost" : "") + '" data-push="' + (on ? "off" : "on") + '">' + (on ? "Desligar" : "Ligar notificações") + "</button></div>";
  }
  document.addEventListener("click", function (e) {
    var b = e.target.closest("[data-push]"); if (!b) return;
    b.disabled = true;
    (b.dataset.push === "on" ? pushLigar() : pushDesligar()).then(function () { G.toast(b.dataset.push === "on" ? "Pronto! Você vai receber os avisos neste aparelho." : "Notificações desligadas."); var box = b.closest(".push-box"); if (box) box.outerHTML = blocoPush(); })
      .catch(function (er) { b.disabled = false; G.toast(er.message || "Não foi possível ligar agora."); });
  });

  /* ======================= Pets perdidos e achados ======================= */
  var filtroPet = "";
  function petsAtivos() { return Store.lista("pets").filter(function (p) { return p.titulo !== undefined || p.nome; }).sort(function (a, b) { return (a.resolvido ? 1 : 0) - (b.resolvido ? 1 : 0) || String(b.criadoEm || "").localeCompare(String(a.criadoEm || "")); }); }
  function zap(n) { var d = String(n || "").replace(/\D/g, ""); return d.length >= 10 ? "https://wa.me/" + (d.length === 10 ? "1" + d : d) : ""; }
  function viewPets() {
    var uid = Store.uid(), ls = petsAtivos().filter(function (p) { return !filtroPet || p.tipo === filtroPet; });
    G.app.innerHTML = '<section class="block pets"><div class="wrap stack" style="gap:16px">' +
      '<div class="head" style="margin:0">' + cab("Comunidade", "Pets perdidos e achados", "Perdeu ou encontrou um bichinho? Publique aqui, de graça. A comunidade brasileira de DFW ajuda a espalhar.") + '<button type="button" class="btn" data-pet-novo>Publicar</button></div>' +
      '<a class="pet-qr" href="#oficial-qr-dog"><span class="pet-qr-ic">' + ic("heart") + '</span><div><b>Proteja seu pet com a plaquinha QR-DOG</b><span>Quem encontra aponta a câmera e fala com você na hora, sem aplicativo.</span></div><em>Conhecer →</em></a>' +
      '<div class="chips"><button type="button" class="chip" data-pet-f="" aria-pressed="' + !filtroPet + '">Todos</button><button type="button" class="chip" data-pet-f="perdido" aria-pressed="' + (filtroPet === "perdido") + '">Perdidos</button><button type="button" class="chip" data-pet-f="achado" aria-pressed="' + (filtroPet === "achado") + '">Achados</button></div>' +
      (ls.length ? '<div class="pet-grid">' + ls.map(function (p) {
        var meu = uid && String(p.id).indexOf(uid + "~") === 0, w = zap(p.whatsapp), f = Store.urlFoto(p.foto);
        return '<article class="panel pet' + (p.resolvido ? " ok" : "") + '">' + (f ? '<img src="' + esc(f) + '" alt="Foto de ' + esc(p.nome || "pet") + '" loading="lazy">' : '<div class="pet-sem">' + ic("heart") + "</div>") +
          '<div class="pet-b"><span class="pill ' + (p.resolvido ? "ok" : p.tipo === "achado" ? "" : "warn") + '">' + (p.resolvido ? (p.tipo === "achado" ? "Dono encontrado" : "Encontrado!") : p.tipo === "achado" ? "Achado" : "Perdido") + "</span><h3>" + esc(p.nome || (p.tipo === "achado" ? "Pet encontrado" : "Pet perdido")) + "</h3>" +
          "<p class=\"small muted\">" + esc([p.especie, p.raca, p.cor].filter(Boolean).join(" · ")) + "</p><p class=\"small\">" + ic("pin") + " " + esc([p.bairro, p.cidade].filter(Boolean).join(", ") || "DFW") + " · " + br(p.data || p.criadoEm) + "</p>" + (p.texto ? "<p>" + esc(p.texto) + "</p>" : "") + (p.qrdog ? '<p class="small"><b>Tem plaquinha QR-DOG</b></p>' : "") +
          '<div class="row">' + (w && !p.resolvido ? '<a class="btn sm" href="' + w + "?text=" + encodeURIComponent("Olá! Vi no CoraçãoBR sobre o pet " + (p.nome || "") + ".") + '" target="_blank" rel="noopener">' + ic("chat") + " WhatsApp</a>" : "") +
          (meu ? (p.resolvido ? "" : '<button type="button" class="btn sm ghost" data-pet-ok="' + esc(p.id) + '">Marcar como resolvido</button>') + '<button type="button" class="btn sm danger" data-pet-apaga="' + esc(p.id) + '">Remover</button>' : '<button type="button" class="btn sm ghost" data-pet-share="' + esc(p.id) + '">' + ic("share") + " Compartilhar</button>") + "</div></div></article>";
      }).join("") + "</div>" : '<div class="panel"><h3>Nenhum pet publicado</h3><p class="muted">Tomara que continue assim. Se precisar, publique aqui.</p></div>') +
      '<p class="note">Nunca pague recompensa adiantada para quem diz ter encontrado seu pet sem mandar foto atual.</p></div></section>';
  }
  function formPet() {
    if (!Store.uid()) { location.hash = "#entrar"; G.toast("Entre na sua conta para publicar."); return; }
    var d = dlgAbre('<h3>Publicar pet perdido ou achado</h3><form class="stack" style="gap:10px" data-pet-form><div class="chips" style="margin:0;padding:0"><label class="chip"><input type="radio" name="tipo" value="perdido" checked> Perdi meu pet</label><label class="chip"><input type="radio" name="tipo" value="achado"> Encontrei um pet</label></div>' +
      '<div class="form2"><div class="field"><label for="pt-n">Nome do pet</label><input id="pt-n" name="nome" maxlength="40"></div><div class="field"><label for="pt-e">Espécie</label><select id="pt-e" name="especie"><option>Cachorro</option><option>Gato</option><option>Outro</option></select></div>' +
      '<div class="field"><label for="pt-r">Raça</label><input id="pt-r" name="raca" maxlength="40"></div><div class="field"><label for="pt-c">Cor</label><input id="pt-c" name="cor" maxlength="40"></div>' +
      '<div class="field"><label for="pt-b">Bairro ou região</label><input id="pt-b" name="bairro" maxlength="60"></div><div class="field"><label for="pt-ci">Cidade</label><input id="pt-ci" name="cidade" maxlength="40" placeholder="Dallas, Irving, Plano…"></div>' +
      '<div class="field"><label for="pt-d">Data</label><input id="pt-d" name="data" type="date" value="' + hoje() + '" max="' + hoje() + '"></div><div class="field"><label for="pt-w">WhatsApp para contato</label><input id="pt-w" name="whatsapp" inputmode="tel" maxlength="20" required></div></div>' +
      '<div class="field"><label for="pt-t">Detalhes</label><textarea id="pt-t" name="texto" maxlength="400" rows="3" placeholder="Coleira, comportamento, onde foi visto…"></textarea></div>' +
      '<div class="field"><label for="pt-f">Foto</label><input id="pt-f" name="foto" type="file" accept="image/*"></div><label class="small"><input type="checkbox" name="qrdog"> O pet usa plaquinha QR-DOG</label>' +
      '<div class="row"><button class="btn" type="submit">Publicar</button><button class="btn ghost" type="button" data-fecha>Cancelar</button></div></form>');
    $("[data-pet-form]", d).onsubmit = async function (ev) {
      ev.preventDefault(); var f = this, bt = f.querySelector("[type=submit]"); bt.disabled = true; bt.textContent = "Publicando…";
      try {
        var foto = f.foto.files[0] ? await Store.salvarFoto(f.foto.files[0]) : "";
        var doc = { tipo: f.tipo.value, nome: f.nome.value.trim(), especie: f.especie.value, raca: f.raca.value.trim(), cor: f.cor.value.trim(), bairro: f.bairro.value.trim(), cidade: f.cidade.value.trim(), data: f.data.value, whatsapp: f.whatsapp.value.trim(), texto: f.texto.value.trim(), qrdog: f.qrdog.checked, foto: foto, criadoEm: new Date().toISOString() };
        await Store.gravar("pets", Store.novoId("pet"), doc); d.close(); G.toast("Publicado. Boa sorte! 💚"); viewPets();
      } catch (er) { bt.disabled = false; bt.textContent = "Publicar"; G.toast(er.message || "Não deu para publicar agora."); }
    };
  }
  document.addEventListener("click", function (e) {
    if (!e.target.closest(".pets")) return;
    var b;
    if (e.target.closest("[data-pet-novo]")) { formPet(); return; }
    if ((b = e.target.closest("[data-pet-f]"))) { filtroPet = b.dataset.petF; viewPets(); return; }
    if ((b = e.target.closest("[data-pet-ok]"))) { var p = Store.obter("pets", b.dataset.petOk); if (p) Store.gravar("pets", p.id, Object.assign({}, p, { resolvido: true, resolvidoEm: new Date().toISOString() })).then(function () { G.toast("Que notícia boa! 💚💛"); viewPets(); }); return; }
    if ((b = e.target.closest("[data-pet-apaga]"))) { if (!b.dataset.ok) { b.dataset.ok = 1; b.textContent = "Confirmar"; return; } Store.apagar("pets", b.dataset.petApaga).then(function () { G.toast("Removido."); viewPets(); }); return; }
    if ((b = e.target.closest("[data-pet-share]"))) { var pp = Store.obter("pets", b.dataset.petShare) || {}, t = (pp.tipo === "achado" ? "Pet encontrado" : "Pet perdido") + (pp.nome ? ": " + pp.nome : "") + " · " + [pp.bairro, pp.cidade].filter(Boolean).join(", ") + " · CoraçãoBR", u = location.href.split("#")[0] + "#pets"; if (navigator.share) navigator.share({ title: t, text: t, url: u }).catch(function () {}); else { navigator.clipboard && navigator.clipboard.writeText(t + " " + u); G.toast("Link copiado."); } }
  });

  /* ======================= Perguntas e respostas da comunidade ======================= */
  var TEMAS_Q = { documentos: "Documentos e imigração", moradia: "Moradia", trabalho: "Trabalho", saude: "Saúde", escola: "Escola e filhos", carro: "Carro e carteira", dinheiro: "Dinheiro e impostos", lazer: "Lazer", outros: "Outros" };
  var filtroQ = "";
  function perguntasTodas() { return Store.lista("perguntas").filter(function (q) { return q.tipo === "pergunta"; }).sort(function (a, b) { return String(b.criadoEm || "").localeCompare(String(a.criadoEm || "")); }); }
  function respostasDe(id) { return Store.lista("perguntas").filter(function (r) { return r.tipo === "resposta" && r.perguntaId === id; }).sort(function (a, b) { return String(a.criadoEm || "").localeCompare(String(b.criadoEm || "")); }); }
  function viewPerguntas(r) {
    var abre = r && r.indexOf("pergunta-") === 0 ? decodeURIComponent(r.slice(9)) : "", uid = Store.uid();
    if (abre) return viewPergunta(abre);
    var ls = perguntasTodas().filter(function (q) { return !filtroQ || q.tema === filtroQ; });
    G.app.innerHTML = '<section class="block qa"><div class="wrap stack" style="max-width:860px;gap:16px">' +
      '<div class="head" style="margin:0">' + cab("Comunidade", "Perguntas e respostas", "Dúvidas de quem chegou e respostas de quem já passou por isso. Pergunte e ajude.") + '<button type="button" class="btn" data-q-nova>Fazer uma pergunta</button></div>' +
      '<div class="chips"><button type="button" class="chip" data-q-f="" aria-pressed="' + !filtroQ + '">Todas</button>' + Object.keys(TEMAS_Q).map(function (k) { return '<button type="button" class="chip" data-q-f="' + k + '" aria-pressed="' + (filtroQ === k) + '">' + TEMAS_Q[k] + "</button>"; }).join("") + "</div>" +
      (ls.length ? '<div class="qa-l">' + ls.map(function (q) { var n = respostasDe(q.id).length; return '<a class="panel qa-i" href="#pergunta-' + esc(q.id) + '"><small class="eyebrow">' + esc(TEMAS_Q[q.tema] || "Outros") + " · " + quando(q.criadoEm) + "</small><b>" + esc(q.titulo) + "</b>" + (q.texto ? "<span>" + esc(String(q.texto).slice(0, 140)) + "</span>" : "") + '<em class="qa-n' + (n ? "" : " zero") + '">' + (n ? n + (n === 1 ? " resposta" : " respostas") : "Sem resposta ainda · ajude") + "</em></a>"; }).join("") + "</div>"
        : '<div class="panel"><h3>Nenhuma pergunta ' + (filtroQ ? "neste tema" : "ainda") + '</h3><p class="muted">Faça a primeira. Alguém da comunidade vai responder.</p></div>') +
      '<p class="note">Respostas são opiniões de outros membros. Para assuntos jurídicos, médicos ou de imigração, confirme com um profissional.</p></div></section>';
    void uid;
  }
  function viewPergunta(id) {
    var q = Store.obter("perguntas", id), uid = Store.uid();
    if (!q) { G.app.innerHTML = '<section class="block"><div class="wrap"><p class="muted">Pergunta não encontrada.</p><a class="more" href="#perguntas">← Perguntas</a></div></section>'; return; }
    var rs = respostasDe(id), meu = function (x) { return uid && String(x.id).indexOf(uid + "~") === 0; };
    G.app.innerHTML = '<section class="block qa"><div class="wrap stack" style="max-width:760px;gap:16px"><a class="more" href="#perguntas">← Todas as perguntas</a>' +
      '<article class="panel qa-p"><small class="eyebrow">' + esc(TEMAS_Q[q.tema] || "Outros") + " · " + esc(q.nome || "Membro") + " · " + quando(q.criadoEm) + "</small><h1 class=\"page-h\" style=\"font-size:1.5rem\">" + esc(q.titulo) + "</h1>" + (q.texto ? "<p>" + esc(q.texto) + "</p>" : "") +
      '<div class="row">' + (meu(q) ? '<button type="button" class="btn sm danger" data-q-apaga="' + esc(q.id) + '">Remover pergunta</button>' : '<button type="button" class="btn sm ghost" data-q-denuncia="' + esc(q.id) + '">Denunciar</button>') + "</div></article>" +
      '<h2 style="font-size:1.15rem">' + (rs.length ? rs.length + (rs.length === 1 ? " resposta" : " respostas") : "Ainda sem respostas") + "</h2>" +
      rs.map(function (x) { return '<div class="panel qa-r"><small class="muted">' + esc(x.nome || "Membro") + " · " + quando(x.criadoEm) + "</small><p>" + esc(x.texto) + "</p>" + (meu(x) ? '<button type="button" class="more" data-q-apaga="' + esc(x.id) + '">Remover</button>' : '<button type="button" class="more" data-q-denuncia="' + esc(x.id) + '">Denunciar</button>') + "</div>"; }).join("") +
      (uid ? '<form class="panel stack" style="gap:10px" data-q-resp="' + esc(id) + '"><label for="q-rt"><b>Sua resposta</b></label><textarea id="q-rt" name="texto" rows="3" maxlength="1200" required placeholder="Conte o que você sabe ou viveu."></textarea><button class="btn" type="submit" style="justify-self:start">Responder</button></form>'
        : '<div class="panel"><p>Entre na sua conta para responder.</p><a class="btn sm" href="#entrar">Entrar</a></div>') + "</div></section>";
  }
  function formPergunta() {
    if (!Store.uid()) { location.hash = "#entrar"; G.toast("Entre na sua conta para perguntar."); return; }
    var d = dlgAbre('<h3>Fazer uma pergunta</h3><form class="stack" style="gap:10px" data-q-form><div class="field"><label for="q-t">Pergunta</label><input id="q-t" name="titulo" maxlength="140" required placeholder="Ex.: Como tirar a carteira de motorista do Texas?"></div>' +
      '<div class="field"><label for="q-tm">Tema</label><select id="q-tm" name="tema">' + Object.keys(TEMAS_Q).map(function (k) { return '<option value="' + k + '">' + TEMAS_Q[k] + "</option>"; }).join("") + "</select></div>" +
      '<div class="field"><label for="q-x">Detalhes (opcional)</label><textarea id="q-x" name="texto" rows="3" maxlength="800"></textarea></div><p class="small muted">Não publique documentos, endereço completo ou dados pessoais.</p><div class="row"><button class="btn" type="submit">Publicar pergunta</button><button class="btn ghost" type="button" data-fecha>Cancelar</button></div></form>');
    $("[data-q-form]", d).onsubmit = function (ev) {
      ev.preventDefault(); var f = this, id = Store.novoId("q");
      Store.gravar("perguntas", id, { tipo: "pergunta", titulo: f.titulo.value.trim(), tema: f.tema.value, texto: f.texto.value.trim(), nome: nomeConta().split(" ")[0] || "Membro", criadoEm: new Date().toISOString() })
        .then(function () { d.close(); G.toast("Pergunta publicada."); viewPerguntas(); }).catch(function (er) { G.toast(er.message || "Não deu para publicar agora."); });
    };
  }
  document.addEventListener("click", function (e) {
    if (!e.target.closest(".qa")) return;
    var b;
    if (e.target.closest("[data-q-nova]")) { formPergunta(); return; }
    if ((b = e.target.closest("[data-q-f]"))) { filtroQ = b.dataset.qF; viewPerguntas(); return; }
    if ((b = e.target.closest("[data-q-apaga]"))) { if (!b.dataset.ok) { b.dataset.ok = 1; b.textContent = "Confirmar remoção"; return; } var era = Store.obter("perguntas", b.dataset.qApaga) || {}; Store.apagar("perguntas", b.dataset.qApaga).then(function () { G.toast("Removido."); if (era.tipo === "pergunta") location.hash = "#perguntas"; else viewPergunta(era.perguntaId); }); return; }
    if ((b = e.target.closest("[data-q-denuncia]"))) { Store.gravar("avisos", Store.novoId("av"), { tipo: "denuncia", lugarId: b.dataset.qDenuncia, nome: "Pergunta ou resposta denunciada", criadoEm: new Date().toISOString(), lido: false }).then(function () { G.toast("Obrigado. A equipe vai olhar."); }).catch(function () { G.toast("Não deu para enviar agora."); }); }
  });
  document.addEventListener("submit", function (e) {
    var f = e.target.closest("[data-q-resp]"); if (!f) return; e.preventDefault();
    var pid = f.dataset.qResp, t = f.texto.value.trim(); if (t.length < 2) return;
    Store.gravar("perguntas", Store.novoId("r"), { tipo: "resposta", perguntaId: pid, texto: t, nome: nomeConta().split(" ")[0] || "Membro", criadoEm: new Date().toISOString() })
      .then(function () { G.toast("Resposta publicada. Obrigado por ajudar!"); viewPergunta(pid); }).catch(function (er) { G.toast(er.message || "Não deu para publicar agora."); });
  });

  /* ======================= Cidades ======================= */
  var CIDADES = [["orlando", "Orlando", "FL"], ["miami", "Miami", "FL"], ["boston", "Boston", "MA"], ["novayork", "Nova York", "NY"], ["newark", "Newark", "NJ"], ["atlanta", "Atlanta", "GA"], ["charlotte", "Charlotte", "NC"], ["losangeles", "Los Angeles", "CA"]];
  function seletorCidade() {
    var avisos = []; try { avisos = JSON.parse(localStorage.getItem("cidades-aviso") || "[]"); } catch (e) { /* ok */ }
    var d = dlgAbre('<h3>Próximas cidades</h3><p class="small muted">O CoraçãoBR já está em ' + esc((G.regioesVisiveis ? G.regioesVisiveis() : []).map(function (k) { return G.CIDADES_GUIA[k].nome; }).join(", ") || "Dallas–Fort Worth") + ' e vai chegar a outras cidades com muitos brasileiros. Peça para ser avisado.</p><div class="cid-l">' + CIDADES.map(function (c) {
      return c[3] ? '<button type="button" class="cid on" data-fecha><b>' + c[1] + "</b><small>" + c[2] + ' · você está aqui</small><span class="pill ok">Ativa</span></button>'
        : '<div class="cid"><b>' + c[1] + "</b><small>" + c[2] + ' · em breve</small><button type="button" class="btn sm' + (avisos.indexOf(c[0]) >= 0 ? " ghost" : "") + '" data-cid-av="' + c[0] + '">' + (avisos.indexOf(c[0]) >= 0 ? "Vamos te avisar ✓" : "Avise-me") + "</button></div>";
    }).join("") + '</div><button class="btn ghost" type="button" data-fecha>Fechar</button>');
    d.onclick = function (ev) {
      var b = ev.target.closest("[data-cid-av]"); if (!b) return;
      var cid = b.dataset.cidAv, nome = (CIDADES.filter(function (c) { return c[0] === cid; })[0] || [])[1];
      var salva = function () { if (avisos.indexOf(cid) < 0) avisos.push(cid); try { localStorage.setItem("cidades-aviso", JSON.stringify(avisos)); } catch (e) { /* ok */ } b.textContent = "Vamos te avisar ✓"; b.classList.add("ghost"); };
      if (Store.uid()) { Store.gravar("interesse", Store.novoId("cid"), { tipo: "cidade", cidade: nome, criadoEm: new Date().toISOString() }).then(function () { salva(); G.toast("Combinado! Avisamos quando " + nome + " entrar no ar."); }).catch(function () { salva(); }); return; }
      if (servidor()) {
        var em = prompt("Seu e-mail para avisarmos quando " + nome + " entrar no ar:"); if (!em) return;
        Store.api("newsletter_inscrever", { email: em.trim(), nome: "", origem: "cidade:" + cid }).then(function () { salva(); G.toast("Combinado! Avisamos por e-mail."); }).catch(function (er) { G.toast(er.message); });
      } else { salva(); G.toast("Anotado neste aparelho."); }
    };
  }
  function botaoCidade() {
    var top = $("header.top .wrap"); if (!top || $(".cid-bt", top)) return;
    var b = document.createElement("button"); b.type = "button"; b.className = "cid-bt";
    var rot = function () { var c = G.cid ? G.cid() : { nome: "Dallas–Fort Worth", curto: "DFW" }; b.setAttribute("aria-label", "Cidade: " + c.nome + ". Trocar cidade"); b.innerHTML = ic("pin") + "<span>" + esc(c.curto) + "</span>"; };
    rot(); document.addEventListener("cidade", rot); b.onclick = function () { if (G.perguntaCidade) G.perguntaCidade(false); else seletorCidade(); };
    var brand = $(".brand", top); brand.parentNode.insertBefore(b, brand.nextSibling);
  }

  /* ======================= Arte para o Instagram ======================= */
  function carregaImg(src) { return new Promise(function (ok) { if (!src) return ok(null); var im = new Image(); im.crossOrigin = "anonymous"; im.onload = function () { ok(im); }; im.onerror = function () { ok(null); }; im.src = src; setTimeout(function () { ok(null); }, 8000); }); }
  function quebra(ctx, txt, max, linhas) { var ps = String(txt || "").split(/\s+/), out = [], l = ""; ps.forEach(function (p) { var t = l ? l + " " + p : p; if (ctx.measureText(t).width > max && l) { out.push(l); l = p; } else l = t; }); if (l) out.push(l); if (out.length > linhas) { out = out.slice(0, linhas); out[linhas - 1] = out[linhas - 1].replace(/\s*\S*$/, "…"); } return out; }
  async function desenhaArte(cv, l, fmt) {
    var W = 1080, H = fmt === "story" ? 1920 : 1080, ctx = cv.getContext("2d"); cv.width = W; cv.height = H;
    var verde = "#024E25", amarelo = "#E3A600";
    var f = G.fotosDe ? G.fotosDe(l, 1200)[0] : null, im = await carregaImg(f && f.src);
    var fotoH = fmt === "story" ? 1100 : 640;
    ctx.fillStyle = verde; ctx.fillRect(0, 0, W, H);
    if (im) { var r = Math.max(W / im.width, fotoH / im.height), w = im.width * r, h = im.height * r; try { ctx.drawImage(im, (W - w) / 2, (fotoH - h) / 2, w, h); } catch (e) { /* imagem sem permissão */ } }
    else { var g = ctx.createLinearGradient(0, 0, W, fotoH); g.addColorStop(0, "#036B33"); g.addColorStop(1, "#012E16"); ctx.fillStyle = g; ctx.fillRect(0, 0, W, fotoH); ctx.fillStyle = "rgba(255,255,255,.12)"; ctx.font = "700 300px system-ui, sans-serif"; ctx.textAlign = "center"; ctx.fillText("♥", W / 2, fotoH / 2 + 100); ctx.textAlign = "left"; }
    var gr = ctx.createLinearGradient(0, fotoH - 260, 0, fotoH); gr.addColorStop(0, "rgba(2,78,37,0)"); gr.addColorStop(1, "rgba(2,78,37,1)"); ctx.fillStyle = gr; ctx.fillRect(0, fotoH - 260, W, 262);
    ctx.fillStyle = amarelo; ctx.beginPath(); if (ctx.roundRect) ctx.roundRect(60, 60, 330, 72, 36); else ctx.rect(60, 60, 330, 72); ctx.fill();
    ctx.fillStyle = verde; ctx.font = "800 36px system-ui, sans-serif"; ctx.fillText("Coração", 92, 108); ctx.fillStyle = "#fff"; var wc = ctx.measureText("Coração").width; ctx.fillStyle = verde; ctx.fillText("BR", 92 + wc + 4, 108);
    var y = fotoH + 40;
    ctx.fillStyle = amarelo; ctx.font = "700 34px system-ui, sans-serif"; ctx.fillText(String(G.CATS[l.categoria] || l.categoria || "No guia").toUpperCase(), 70, y + 10);
    ctx.fillStyle = "#fff"; ctx.font = "800 " + (fmt === "story" ? 88 : 76) + "px system-ui, sans-serif";
    quebra(ctx, l.nome, W - 140, 2).forEach(function (t, i) { ctx.fillText(t, 70, y + 100 + i * (fmt === "story" ? 96 : 84)); });
    var y2 = y + 100 + (ctx.measureText(l.nome).width > W - 140 ? 2 : 1) * (fmt === "story" ? 96 : 84) + 10;
    ctx.font = "500 36px system-ui, sans-serif"; ctx.fillStyle = "rgba(255,255,255,.88)";
    var sub = l.cupom ? "🎟 " + l.cupom : (l.dataInicio ? "📅 " + br(l.dataInicio) + " · " : "") + (G.regiao(l) || "Dallas–Fort Worth");
    quebra(ctx, sub, W - 140, 2).forEach(function (t, i) { ctx.fillText(t, 70, y2 + i * 46); });
    ctx.fillStyle = amarelo; ctx.fillRect(70, H - 150, 90, 8);
    ctx.fillStyle = "#fff"; ctx.font = "700 38px system-ui, sans-serif"; ctx.fillText(l.nota ? (window.Reacoes ? Reacoes.emoji(l.nota) : "★") + " " + Number(l.nota).toFixed(1) + " no CoraçãoBR" : "Veja no CoraçãoBR", 70, H - 90);
    ctx.font = "500 28px system-ui, sans-serif"; ctx.fillStyle = "rgba(255,255,255,.75)"; ctx.fillText("O guia dos brasileiros em DFW", 70, H - 50);
    var q = null; try { q = window.qrcode(0, "M"); q.addData(location.href.split("#")[0] + "#lugar-" + l.id); q.make(); } catch (e) { q = null; }
    if (q) { var n = q.getModuleCount(), tam = 190, c = tam / n, x0 = W - 70 - tam - 16, y0 = H - 70 - tam - 16; ctx.fillStyle = "#fff"; ctx.fillRect(x0, y0, tam + 32, tam + 32); ctx.fillStyle = "#111"; for (var a = 0; a < n; a++) for (var b2 = 0; b2 < n; b2++) if (q.isDark(a, b2)) ctx.fillRect(x0 + 16 + b2 * c, y0 + 16 + a * c, Math.ceil(c), Math.ceil(c)); }
  }
  function arte(l) {
    if (!l) return;
    var d = dlgAbre('<h3>Arte para o Instagram</h3><p class="small muted">Pronta para postar: foto, nome, nota e QR que abre o anúncio no guia.</p><div class="chips" style="margin:0;padding:0"><button type="button" class="chip" data-arte-f="feed" aria-pressed="true">Feed (quadrado)</button><button type="button" class="chip" data-arte-f="story" aria-pressed="false">Story</button></div>' +
      '<div class="arte-prev"><canvas aria-label="Prévia da arte"></canvas></div><div class="row"><button type="button" class="btn" data-arte-baixa>' + ic("down") + ' Baixar imagem</button><button type="button" class="btn ghost" data-fecha>Fechar</button></div>');
    var cv = $("canvas", d), fmt = "feed";
    var gera = function () { desenhaArte(cv, l, fmt); };
    gera();
    d.onclick = function (ev) {
      var b = ev.target.closest("[data-arte-f]"); if (b) { fmt = b.dataset.arteF; Array.from(d.querySelectorAll("[data-arte-f]")).forEach(function (x) { x.setAttribute("aria-pressed", x === b); }); gera(); return; }
      if (ev.target.closest("[data-arte-baixa]")) {
        try { var a = document.createElement("a"); a.download = "coracaobr-" + String(l.nome || "arte").toLowerCase().normalize("NFD").replace(/[^a-z0-9]+/g, "-").slice(0, 40) + "-" + fmt + ".png"; a.href = cv.toDataURL("image/png"); a.click(); }
        catch (e) { desenhaArte(cv, Object.assign({}, l, { fotos: [], fotoSite: "" }), fmt).then(function () { G.toast("A foto não pôde entrar na arte. Gerei sem a foto, toque em Baixar de novo."); }); }
      }
    };
  }
  document.addEventListener("click", function (e) { var b = e.target.closest("[data-arte]"); if (!b) return; arte(Store.obter("lugares", b.dataset.arte)); });
  function botaoArte(l) { return l ? '<div class="panel stack" style="gap:10px"><h3>Arte para o Instagram</h3><p class="muted small">Gere em 1 clique uma imagem com a foto, o nome, a nota e um QR para o seu anúncio. Ideal para feed e stories.</p><button type="button" class="btn" data-arte="' + esc(l.id) + '" style="justify-self:start">' + ic("insta") + " Criar arte</button></div>" : ""; }

  /* ======================= Painel master: Receita ======================= */
  function vendas() {
    var out = [];
    Store.lista("pagamentos").forEach(function (d) {
      var uid = d.id;
      (Array.isArray(d.pacotes) ? d.pacotes : []).forEach(function (pk) { if (Number(pk.valor) > 0 && pk.pagoEm) out.push({ uid: uid, tipo: pk.tipo === "impulso" ? "Impulso" : pk.tipo === "promo" ? "Promoção" : "Pacotes de anúncio", valor: Number(pk.valor), em: pk.pagoEm, fim: pk.fim }); });
      if (d.verificacao && Number(d.verificacao.valor) > 0 && d.verificacao.pagoEm) out.push({ uid: uid, tipo: "Selo Verificado", valor: Number(d.verificacao.valor), em: d.verificacao.pagoEm });
      (d.clubePag || []).forEach(function (c) { if (Number(c.valor) > 0) out.push({ uid: uid, tipo: "Clube", valor: Number(c.valor), em: c.pagoEm, fim: c.fim }); });
      (d.mural || []).forEach(function (m) { if (Number(m.valor) > 0) out.push({ uid: uid, tipo: "Destaque no Mural", valor: Number(m.valor), em: m.pagoEm, fim: m.fim }); });
    });
    return out.sort(function (a, b) { return String(b.em).localeCompare(String(a.em)); });
  }
  function abaReceita(el) {
    var vs = vendas(), h = hoje(), mes = h.slice(0, 7), meses = [];
    for (var i = 5; i >= 0; i--) { var dt = new Date(h + "T12:00:00"); dt.setDate(1); dt.setMonth(dt.getMonth() - i); meses.push(dt.toISOString().slice(0, 7)); }
    var porMes = meses.map(function (m) { return vs.filter(function (v) { return String(v.em).slice(0, 7) === m; }).reduce(function (s, v) { return s + v.valor; }, 0); });
    var mx = Math.max.apply(null, porMes.concat([1])), noMes = vs.filter(function (v) { return String(v.em).slice(0, 7) === mes; });
    var porTipo = {}; noMes.forEach(function (v) { porTipo[v.tipo] = (porTipo[v.tipo] || 0) + v.valor; });
    var contas = {}; Store.lista("lugares").forEach(function (l) { if (l._dono) contas[l._dono] = 1; }); Store.lista("pagamentos").forEach(function (d) { if (d.pacotes && d.pacotes.length) contas[d.id] = 1; });
    var ativos = window.Pag ? Object.keys(contas).filter(function (u) { return Pag.noAr(Pag.estado(u).fase); }) : [];
    var em7 = somaDias(h, 7), vencendo = window.Pag ? ativos.filter(function (u) { var f = Pag.fimAtual(u); return f && f >= h && f <= em7; }) : [];
    var membros = Store.lista("pagamentos").filter(function (d) { return d.clube && d.clube.ate >= h; });
    var nome = function (u) { var ls = Store.lista("lugares").filter(function (l) { return l._dono === u; }); var d = pgDoc(u); return (ls[0] && ls[0].nome) || (d.clube && d.clube.nome) || u; };
    var k = function (n, t) { return '<div class="kpi"><b class="num">' + n + "</b><span>" + t + "</span></div>"; };
    var ant = porMes[4] || 0, var_ = ant ? Math.round((porMes[5] - ant) / ant * 100) : null;
    el.innerHTML = '<div class="stack in" style="max-width:920px">' +
      '<div class="kpis">' + k(reais(porMes[5]), "receita em " + mesNome(mes) + (var_ != null ? " (" + (var_ >= 0 ? "+" : "") + var_ + "%)" : "")) + k(reais(porMes.reduce(function (a, b) { return a + b; }, 0)), "últimos 6 meses") + k(ativos.length, "anunciantes no ar") + k(membros.length, "membros do Clube") + "</div>" +
      '<div class="panel stack" style="gap:12px"><h3>Receita por mês</h3><div class="rc-bars" role="img" aria-label="Receita dos últimos 6 meses">' + meses.map(function (m, j) { return '<div class="rc-b"><span class="rc-v">' + (porMes[j] ? reais(porMes[j]).replace(",00", "") : "") + '</span><i style="height:' + Math.max(2, Math.round(porMes[j] / mx * 100)) + '%"></i><small>' + mesNome(m, true) + "</small></div>"; }).join("") + "</div></div>" +
      '<div class="form2"><div class="panel stack" style="gap:10px"><h3>Este mês por tipo</h3>' + (Object.keys(porTipo).length ? '<dl class="kv">' + Object.keys(porTipo).sort(function (a, b) { return porTipo[b] - porTipo[a]; }).map(function (t) { return "<dt>" + esc(t) + "</dt><dd>" + reais(porTipo[t]) + "</dd>"; }).join("") + "</dl>" : '<p class="muted small">Nenhuma venda neste mês ainda.</p>') + "</div>" +
      '<div class="panel stack" style="gap:10px"><h3>Vencendo em 7 dias (' + vencendo.length + ")</h3>" + (vencendo.length ? vencendo.map(function (u) { return '<p class="small"><b>' + esc(nome(u)) + "</b> · termina em " + br(Pag.fimAtual(u)) + "</p>"; }).join("") + '<p class="small muted">Eles recebem e-mail 3, 2 e 1 dia antes. Um contato pelo WhatsApp ajuda a renovar.</p>' : '<p class="muted small">Nenhum plano terminando nesta semana.</p>') + "</div></div>" +
      '<div class="panel stack" style="gap:10px"><h3>Últimas vendas</h3>' + (vs.length ? '<div class="rc-t">' + vs.slice(0, 25).map(function (v) { return '<div><span>' + br(v.em) + "</span><b>" + esc(nome(v.uid)) + "</b><span>" + esc(v.tipo) + '</span><span class="num">' + reais(v.valor) + "</span></div>"; }).join("") + "</div>" : '<p class="muted small">As vendas aparecem aqui assim que o primeiro Pix for confirmado.</p>') + "</div>" +
      '<div class="panel stack" style="gap:10px"><h3>Clube CoraçãoBR · membros ativos (' + membros.length + ")</h3>" + (membros.length ? membros.map(function (d) { return '<p class="small"><b>' + esc(d.clube.nome || d.id) + "</b> · Nº " + esc(numeroClube(d.id)) + " · até " + br(d.clube.ate) + "</p>"; }).join("") : '<p class="muted small">Ainda sem membros.</p>') + "</div></div>";
  }
  function mesNome(m, curto) { var n = ["janeiro", "fevereiro", "março", "abril", "maio", "junho", "julho", "agosto", "setembro", "outubro", "novembro", "dezembro"][Number(m.slice(5, 7)) - 1] || m; return curto ? n.slice(0, 3) : n; }

  /* ======================= Painel master: Novidades (IA, push, patrocínio de seção, preços, arte) ======================= */
  function abaNovidades(el) {
    var c = cfg(), pats = c.patrocinios || {}, grupos = Object.keys(G.GRUPOS).filter(function (g) { return g !== "tudo"; });
    var campo = function (id, rot, val, extra) { return '<div class="field"><label for="' + id + '">' + rot + '</label><input id="' + id + '" value="' + esc(val == null ? "" : val) + '" ' + (extra || "") + "></div>"; };
    var lugares = G.lugares().slice().sort(function (a, b) { return String(a.nome).localeCompare(String(b.nome)); });
    el.innerHTML = '<div class="stack in" style="max-width:920px">' +
      (servidor() ? '<div class="panel stack" style="gap:14px" id="nv-ia"><h3>Inteligência artificial · respostas e atualizações</h3><p class="small muted">A IA responde no assistente "Pergunte ao CoraçãoBR" (sempre com os lugares do guia) e, todo dia às 5h, confere horários, telefones e sites e sugere eventos novos. Sem chave, o assistente responde com a busca do guia.</p><p data-ia-st class="small">Verificando…</p>' +
        '<div class="ia-prov" role="radiogroup" aria-label="Qual IA usar"><label class="ia-op"><input type="radio" name="ia-prov" value="gemini"><span><b>Gemini · Google</b><small>Gratuito (com limite diário). Recomendado.</small></span></label><label class="ia-op"><input type="radio" name="ia-prov" value="claude"><span><b>Claude · Anthropic</b><small>Pago por uso, com cartão.</small></span></label></div>' +
        '<div class="stack" style="gap:8px" data-ia-box="gemini"><b>Chave do Gemini</b><form class="row" style="gap:8px" data-ia-form="gemini"><input type="password" name="chave" autocomplete="off" placeholder="Cole a chave do Gemini (começa com AIza…)" style="flex:1;min-width:220px;padding:10px 12px;border:1px solid var(--line);border-radius:12px;background:var(--surface);color:var(--ink)"><button class="btn sm" type="submit">Salvar e testar</button></form>' +
        '<div class="row" style="gap:8px"><button type="button" class="btn ghost sm" data-ia-teste>Testar a IA agora</button><button type="button" class="btn ghost sm" data-ia-off="gemini">Apagar chave do Gemini</button></div><p class="small" data-ia-res hidden></p>' +
        '<details class="small" open><summary>Como pegar a chave grátis (2 minutos)</summary><ol class="passos"><li>Abra <a href="https://aistudio.google.com/apikey" target="_blank" rel="noopener">aistudio.google.com/apikey</a> e entre com uma conta Google.</li><li>Toque em <b>Criar chave de API</b> (Create API key) e aceite os termos.</li><li>Copie a chave (começa com AIza) e cole no campo acima. Ela fica só no servidor e nunca aparece no site.</li></ol><p class="muted">No plano gratuito o Google limita as chamadas por minuto e por dia e pode usar os textos enviados para melhorar os produtos dele. O CoraçãoBR manda só a pergunta e os lugares do guia, sem dados pessoais.</p></details>' +
        '<details class="small"><summary>Modelo do Gemini (avançado)</summary><form class="row" style="gap:8px;margin-top:8px" data-ia-modg><input name="m" placeholder="gemini-flash-latest" style="flex:1;min-width:220px;padding:10px 12px;border:1px solid var(--line);border-radius:12px;background:var(--surface);color:var(--ink)"><button class="btn sm ghost" type="submit">Salvar modelo</button></form><p class="muted">Deixe em branco para usar sempre o Flash mais novo (gemini-flash-latest). Se um modelo for aposentado, o site troca sozinho.</p></details></div>' +
        '<div class="stack" style="gap:8px" data-ia-box="claude" hidden><b>Chave da Anthropic</b><form class="row" style="gap:8px" data-ia-form="claude"><input type="password" name="chave" autocomplete="off" placeholder="Chave da API da Anthropic (sk-ant-…)" style="flex:1;min-width:220px;padding:10px 12px;border:1px solid var(--line);border-radius:12px;background:var(--surface);color:var(--ink)"><button class="btn sm" type="submit">Salvar chave</button><button class="btn ghost sm" type="button" data-ia-off="claude">Apagar</button></form>' +
        '<div class="field" style="max-width:420px"><label for="nv-mod">Modelo</label><select id="nv-mod" data-ia-mod><option value="claude-opus-5-5">Claude Opus 5.5 (melhor qualidade)</option><option value="claude-sonnet-5-5">Claude Sonnet 5.5 (equilibrado)</option><option value="claude-haiku-5-5">Claude Haiku 5.5 (mais barato)</option></select></div>' +
        '<details class="small"><summary>Como pegar a chave</summary><ol class="passos"><li>Entre em console.anthropic.com e crie uma conta.</li><li>Em Billing, adicione um cartão e um limite de gasto mensal.</li><li>Em API Keys, crie uma chave e cole aqui. Ela fica só no servidor, nunca aparece no site.</li></ol></details></div>' +
        '<form class="stack ia-robo" style="gap:8px" data-ia-cfg><b>Atualizações automáticas com IA (usa o Gemini)</b><label class="small"><input type="checkbox" name="robo"> Conferir lugares todo dia às 5h: horário, telefone, site e se fechou</label><label class="small">Lugares por dia <input type="number" name="porDia" min="1" max="40" style="width:70px;padding:6px 8px;border:1px solid var(--line);border-radius:8px;background:var(--surface);color:var(--ink)"> <span class="muted">(o plano gratuito aguenta bem até 20)</span></label><label class="small"><input type="checkbox" name="eventos"> Toda segunda, sugerir eventos novos de cada cidade do guia</label><label class="small"><input type="checkbox" name="aplicar"> Atualizar sozinho telefone, site e horário quando a IA trouxer a fonte (sem isso, tudo fica para você aprovar). Fechar um lugar sempre pede sua aprovação.</label>' +
        '<div class="row" style="gap:8px"><button class="btn sm" type="submit">Salvar</button><button type="button" class="btn ghost sm" data-ia-robo>Conferir 3 lugares agora</button><button type="button" class="btn ghost sm" data-ia-ev>Buscar eventos agora</button></div><p class="small muted" data-ia-robo-st></p></form>' +
        '<div class="stack" style="gap:8px" data-ia-sug></div></div>' : "") +
      (servidor() ? '<div class="panel stack" style="gap:12px" id="nv-push"><h3>Notificações no celular</h3><p class="small muted">Quem liga as notificações (página Alertas) recebe o aviso na tela do celular. Toda sexta sai sozinho o aviso dos eventos do fim de semana.</p><p data-push-st class="small">Verificando…</p>' +
        '<form class="stack" style="gap:8px" data-push-form><div class="form2">' + campo("pu-t", "Título", "", 'maxlength="60" required') + campo("pu-u", "Abrir ao tocar (opcional)", "", 'maxlength="200" placeholder="#explorar ou #lugar-..."') + "</div>" + campo("pu-x", "Mensagem", "", 'maxlength="160" required') + '<button class="btn sm" type="submit" style="justify-self:start">Enviar para todos</button></form></div>' : "") +
      '<form class="panel stack" style="gap:12px" id="nv-precos"><h3>Clube e Mural · preços</h3><div class="form2">' + campo("nv-pc", "Clube CoraçãoBR · mensalidade (R$)", c.precoClube || 15, 'type="number" min="1" step="0.01"') + campo("nv-pm", "Destaque no Mural · valor (R$)", c.precoMural || 10, 'type="number" min="1" step="0.01"') + campo("nv-dm", "Destaque no Mural · dias", c.diasMural || 30, 'type="number" min="1" max="90"') + '</div><label class="small"><input type="checkbox" id="nv-fds"' + (c.pushFds !== false ? " checked" : "") + '> Enviar aviso de eventos do fim de semana toda sexta</label><button class="btn sm" type="submit" style="justify-self:start">Salvar</button></form>' +
      '<form class="panel stack" style="gap:12px" id="nv-pat"><h3>Patrocínio de seção</h3><p class="small muted">Um banner "Seção oferecida por" aparece no topo da seção escolhida, no Explorar. Deixe o nome vazio para tirar.</p>' +
      grupos.map(function (g) { var p = pats[g] || {}; return '<details' + (p.nome ? " open" : "") + '><summary><b>' + esc(G.GRUPOS[g].nome) + "</b>" + (p.nome ? " · " + esc(p.nome) + (p.ate ? " até " + br(p.ate) : "") : "") + '</summary><div class="form2" data-pat="' + g + '" style="margin-top:8px">' + campo("pt-n-" + g, "Patrocinador", p.nome, 'maxlength="60" data-k="nome"') + campo("pt-t-" + g, "Frase", p.texto, 'maxlength="90" data-k="texto"') +
        '<div class="field"><label for="pt-l-' + g + '">Anúncio do patrocinador no guia</label><select id="pt-l-' + g + '" data-k="lugarId"><option value="">— nenhum (usar link) —</option>' + lugares.map(function (l) { return '<option value="' + esc(l.id) + '"' + (p.lugarId === l.id ? " selected" : "") + ">" + esc(l.nome) + "</option>"; }).join("") + "</select></div>" + campo("pt-k-" + g, "Ou link externo", p.link, 'maxlength="200" data-k="link" placeholder="https://"') + campo("pt-a-" + g, "Até (data)", p.ate, 'type="date" data-k="ate"') + "</div></details>"; }).join("") +
      '<button class="btn sm" type="submit" style="justify-self:start">Salvar patrocínios</button></form>' +
      '<div class="panel stack" style="gap:12px"><h3>Arte para o Instagram</h3><p class="small muted">Escolha um lugar ou evento e gere a imagem para postar no Instagram do CoraçãoBR.</p><div class="row" style="gap:8px"><select data-nv-arte style="flex:1;min-width:220px">' + lugares.map(function (l) { return '<option value="' + esc(l.id) + '">' + esc(l.nome) + "</option>"; }).join("") + '</select><button type="button" class="btn sm" data-nv-arte-go>' + ic("insta") + " Criar arte</button></div></div></div>";
    var ia = $("#nv-ia", el);
    if (ia) {
      var CAMPO = { horario: "Horário", telefone: "Telefone", site: "Site", fechado: "Situação", evento: "Evento novo" };
      var caixa = function (pv) { Array.prototype.forEach.call(ia.querySelectorAll("[data-ia-box]"), function (b) { b.hidden = b.dataset.iaBox !== pv; }); };
      var sugestoes = function () {
        var box = $("[data-ia-sug]", ia);
        Store.api("ia_sugestoes").then(function (j) {
          var it = j.itens || [];
          box.innerHTML = '<div class="row" style="justify-content:space-between"><b>Sugestões da IA para aprovar (' + it.length + ")</b>" + (it.length ? '<button type="button" class="link" data-sg-todas>Ignorar todas</button>' : "") + "</div>" +
            (it.length ? it.slice(0, 60).map(function (x) {
              var e = x.evento || {}, fts = (x.fontes || []).map(function (f, i) { return '<a href="' + esc(f.url) + '" target="_blank" rel="noopener">' + esc(f.titulo || "fonte " + (i + 1)) + "</a>"; }).join(" · ");
              return '<div class="ia-sg"><div><small class="muted">' + esc(CAMPO[x.campo] || x.campo) + "</small><b>" + esc(x.nome) + "</b>" +
                (x.tipo === "evento" ? '<p class="small">' + esc([e.dataInicio, e.quando, e.local || e.endereco, e.cidade].filter(Boolean).join(" · ")) + (e.descricao ? "<br>" + esc(e.descricao) : "") + (e.link ? '<br><a href="' + esc(e.link) + '" target="_blank" rel="noopener">link do evento</a>' : "") + "</p>"
                  : '<p class="small">' + (x.campo === "fechado" ? "A IA encontrou sinais de que o lugar <b>fechou definitivamente</b>. Aprovar tira o lugar do ar." : '<span class="ia-de">' + esc(x.atual || "(vazio)") + '</span> → <span class="ia-para">' + esc(x.novo) + "</span>") + "</p>") +
                (x.obs ? '<p class="small muted">' + esc(x.obs) + "</p>" : "") + (fts ? '<p class="small muted">Fontes: ' + fts + "</p>" : '<p class="small muted">Sem fonte citada: confira antes de aprovar.</p>') +
                '</div><div class="row" style="gap:6px"><button type="button" class="btn sm" data-sg-ok="' + esc(x.id) + '">' + (x.tipo === "evento" ? "Publicar" : "Aplicar") + '</button><button type="button" class="btn ghost sm" data-sg-no="' + esc(x.id) + '">Ignorar</button></div></div>';
            }).join("") : '<p class="small muted">Nada pendente. Quando a IA achar algo diferente no guia, aparece aqui.</p>');
        }).catch(function () { box.innerHTML = ""; });
      };
      var infoIa = function () {
        Store.api("ia_info").then(function (j) {
          var nome = j.provedor === "gemini" ? "Gemini (" + esc(j.modeloGemini) + ")" : j.provedor === "claude" ? "Claude (" + esc(j.modelo) + ")" : "";
          $("[data-ia-st]", ia).innerHTML = (j.ligado ? '<span class="pill ok">Ligado</span> Respondendo com ' + nome : '<span class="pill warn">Sem chave</span> Respondendo com a busca do guia') + " · " + j.mes + " respostas com IA neste mês" +
            (j.sugestoes ? ' · <b>' + j.sugestoes + " sugestões para aprovar</b>" : "") + (j.erro && j.erro.msg ? '<br><span class="muted">Último aviso (' + esc(String(j.erro.em || "").slice(0, 10)) + "): " + esc(j.erro.msg) + "</span>" : "") +
            (j.robo && (j.robo.feito || []).length ? '<br><span class="muted">Última conferência: ' + esc(j.robo.feito.join(" · ")) + "</span>" : "");
          var pv = j.escolhido || j.provedor || "gemini"; var r = ia.querySelector('[name=ia-prov][value="' + pv + '"]'); if (r) r.checked = true; caixa(pv);
          $("[data-ia-mod]", ia).value = j.modelo; ia.querySelector("[data-ia-modg] [name=m]").value = j.modeloGemini === "gemini-flash-latest" ? "" : j.modeloGemini;
          ia.querySelector("[data-ia-form=gemini] [name=chave]").placeholder = j.gemini ? "Chave salva ✓ (cole outra para trocar)" : "Cole a chave do Gemini (começa com AIza…)";
          ia.querySelector("[data-ia-form=claude] [name=chave]").placeholder = j.claude ? "Chave salva ✓ (cole outra para trocar)" : "Chave da API da Anthropic (sk-ant-…)";
          var f = $("[data-ia-cfg]", ia), c = j.cfg || {}; f.robo.checked = !!c.robo; f.porDia.value = c.porDia || 8; f.eventos.checked = !!c.eventos; f.aplicar.checked = !!c.aplicar;
          var rst = $("[data-ia-robo-st]", ia); if (!j.gemini) rst.textContent = "As atualizações automáticas funcionam com a chave do Gemini."; else if (/funcionam com a chave/.test(rst.textContent)) rst.textContent = "";
        }).catch(function () { $("[data-ia-st]", ia).textContent = "Não foi possível consultar."; });
        sugestoes();
      };
      infoIa();
      Array.prototype.forEach.call(ia.querySelectorAll("[name=ia-prov]"), function (r) { r.onchange = function () { caixa(this.value); Store.api("chave_ia", { usar: this.value }).then(function (j) { G.toast(j.msg); infoIa(); }).catch(function (er) { G.toast(er.message); }); }; });
      Array.prototype.forEach.call(ia.querySelectorAll("[data-ia-form]"), function (f) {
        f.onsubmit = function (ev) {
          ev.preventDefault(); var k = this.chave.value.trim(), bt = this.querySelector("[type=submit]"); if (!k) { G.toast("Cole a chave primeiro."); return; }
          bt.disabled = true; bt.textContent = "Testando…";
          Store.api("chave_ia", { provedor: f.dataset.iaForm, chave: k }).then(function (j) { G.toast(j.msg); f.chave.value = ""; infoIa(); }).catch(function (er) { G.toast(er.message); })
            .then(function () { bt.disabled = false; bt.textContent = f.dataset.iaForm === "gemini" ? "Salvar e testar" : "Salvar chave"; });
        };
      });
      Array.prototype.forEach.call(ia.querySelectorAll("[data-ia-off]"), function (b) { b.onclick = function () { if (!confirm("Apagar a chave salva?")) return; Store.api("chave_ia", { provedor: b.dataset.iaOff, chave: "", apagar: 1 }).then(function (j) { G.toast(j.msg); infoIa(); }).catch(function (er) { G.toast(er.message); }); }; });
      $("[data-ia-mod]", ia).onchange = function () { Store.api("chave_ia", { provedor: "claude", modelo: this.value }).then(function (j) { G.toast(j.msg); }); };
      $("[data-ia-modg]", ia).onsubmit = function (ev) { ev.preventDefault(); Store.api("chave_ia", { provedor: "gemini", modeloGemini: this.m.value.trim() }).then(function (j) { G.toast(j.msg); infoIa(); }).catch(function (er) { G.toast(er.message); }); };
      $("[data-ia-teste]", ia).onclick = function () {
        var res = $("[data-ia-res]", ia), b = this; b.disabled = true; res.hidden = false; res.textContent = "Perguntando à IA…";
        Store.api("ia_teste").then(function (j) { res.innerHTML = '<span class="pill ok">Funcionando</span> ' + esc(j.provedor + " · " + j.modelo) + (j.ms ? " · " + (j.ms / 1000).toFixed(1).replace(".", ",") + " s" : "") + "<br>“" + esc(j.texto) + "”"; })
          .catch(function (er) { res.innerHTML = '<span class="pill warn">Não funcionou</span> ' + esc(er.message); }).then(function () { b.disabled = false; });
      };
      $("[data-ia-cfg]", ia).onsubmit = function (ev) { ev.preventDefault(); var f = this; Store.api("chave_ia", { cfg: { robo: f.robo.checked, porDia: Number(f.porDia.value) || 8, eventos: f.eventos.checked, aplicar: f.aplicar.checked } }).then(function (j) { G.toast(j.msg); }).catch(function (er) { G.toast(er.message); }); };
      $("[data-ia-robo]", ia).onclick = function () {
        var b = this, st = $("[data-ia-robo-st]", ia); b.disabled = true; st.textContent = "Conferindo com a IA e o Google… (até 1 minuto)";
        Store.api("ia_robo", { quantos: 3 }).then(function (j) { st.textContent = (j.feito || []).concat(j.erros || []).join(" · ") || "Pronto."; if (Store.sincronizarAgora) Store.sincronizarAgora(); infoIa(); }).catch(function (er) { st.textContent = er.message; }).then(function () { b.disabled = false; });
      };
      $("[data-ia-ev]", ia).onclick = function () {
        var b = this, st = $("[data-ia-robo-st]", ia); b.disabled = true; st.textContent = "Procurando eventos com a IA e o Google em cada cidade… (pode levar 1 minuto)";
        Store.api("ia_robo", { quantos: 0, eventos: true }).then(function (j) { st.textContent = (j.feito || []).concat(j.erros || []).join(" · ") || "Nenhum evento novo encontrado agora."; infoIa(); }).catch(function (er) { st.textContent = er.message; }).then(function () { b.disabled = false; });
      };
      ia.addEventListener("click", function (ev) {
        var ok = ev.target.closest("[data-sg-ok]"), no = ev.target.closest("[data-sg-no]"), todas = ev.target.closest("[data-sg-todas]");
        if (!ok && !no && !todas) return;
        if (todas && !confirm("Ignorar todas as sugestões pendentes?")) return;
        var corpo = todas ? { acao: "ignorar_todas" } : { acao: ok ? "aplicar" : "ignorar", id: (ok || no).dataset[ok ? "sgOk" : "sgNo"] };
        Store.api("ia_sugestao", corpo).then(function (j) { G.toast(j.msg); if (Store.sincronizarAgora) Store.sincronizarAgora(); infoIa(); }).catch(function (er) { G.toast(er.message); });
      });
    }
    var pu = $("#nv-push", el);
    if (pu) {
      var infoPu = function () { Store.api("push_info").then(function (j) { $("[data-push-st]", pu).innerHTML = "<b>" + j.inscritos + "</b> aparelhos inscritos" + (j.ultima ? " · último aviso: " + esc(j.ultima.titulo) + " (" + br(j.ultima.em) + ")" : ""); }).catch(function () { $("[data-push-st]", pu).textContent = "Não foi possível consultar."; }); };
      infoPu();
      $("[data-push-form]", pu).onsubmit = function (ev) { ev.preventDefault(); var bt = this.querySelector("[type=submit]"); bt.disabled = true; Store.api("push_enviar", { titulo: $("#pu-t", pu).value.trim(), texto: $("#pu-x", pu).value.trim(), url: $("#pu-u", pu).value.trim() }).then(function (j) { bt.disabled = false; G.toast("Enviado para " + j.enviados + " aparelhos."); infoPu(); }).catch(function (er) { bt.disabled = false; G.toast(er.message); }); };
    }
    var salva = function (extra, msg) { var novo = Object.assign({}, cfg(), extra); delete novo.id; return Store.gravar("config", "geral", novo).then(function () { G.toast(msg); }).catch(function (er) { G.toast(er.message || "Não foi possível salvar."); }); };
    $("#nv-precos", el).onsubmit = function (ev) { ev.preventDefault(); salva({ precoClube: Number($("#nv-pc", el).value) || 15, precoMural: Number($("#nv-pm", el).value) || 10, diasMural: Math.max(1, Number($("#nv-dm", el).value) || 30), pushFds: $("#nv-fds", el).checked }, "Preços salvos."); };
    $("#nv-pat", el).onsubmit = function (ev) {
      ev.preventDefault(); var ps = {};
      Array.from(el.querySelectorAll("[data-pat]")).forEach(function (box) { var p = {}; Array.from(box.querySelectorAll("[data-k]")).forEach(function (i) { var v = i.value.trim(); if (v) p[i.dataset.k] = v; }); if (p.link && !/^https?:\/\//.test(p.link)) delete p.link; if (p.nome) ps[box.dataset.pat] = p; });
      salva({ patrocinios: ps }, "Patrocínios salvos.");
    };
    $("[data-nv-arte-go]", el).onclick = function () { arte(Store.obter("lugares", $("[data-nv-arte]", el).value)); };
  }

  /* ======================= ligações com as outras telas ======================= */
  G.views.clube = viewClube; G.views.assistente = viewAssistente; G.views.pets = viewPets; G.views.perguntas = viewPerguntas;
  var extra0 = G.views.extra;
  G.views.extra = function (r) { if (/^extra-mural-/.test(r)) return viewMuralPago(r); return extra0 && extra0(r); };
  G.views["clube-validar"] = viewValidar;
  setTimeout(function () {
    var temas = G.views.temas;
    if (temas && !temas._push) { G.views.temas = function (r) { temas(r); var w = G.app.querySelector(".wrap"); if (w && !w.querySelector(".push-box")) { var bx = blocoPush(); if (bx) w.children[0].insertAdjacentHTML("afterend", bx); } }; G.views.temas._push = true; }
  }, 0);
  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", botaoCidade); else botaoCidade();
  window.Novidades = { pushLigar: pushLigar, pushSuportado: pushSuportado, pushLigado: pushLigado, pushTestePerto: pushTestePerto, pushSincroniza: pushSincroniza, patrocinio: patrocinio, muralDestaque: muralDestaque, membro: membro, arte: arte, botaoArte: botaoArte, blocoPush: blocoPush, abaReceita: abaReceita, abaNovidades: abaNovidades, seletorCidade: seletorCidade, CIDADES: CIDADES };
})();
