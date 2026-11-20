/* Pagamento mensal do anunciante.
   - Preço: promocional (config.precoAnuncio, US$ 10) até config.precoFuturoEm; depois config.precoFuturo (US$ 20).
   - Formas: cartão de crédito/débito e PayPal (link de assinatura configurado no painel), Pix e Zelle (dados no painel; o anunciante informa o pagamento e anexa o comprovante).
   - O anúncio só aparece ao público depois da confirmação, 1 hora após ela. Vence todo mês; há 2 dias de tolerância; depois disso sai do ar até novo pagamento.
   - O master confirma pagamentos e pode aprovar sem pagamento até uma data escolhida (cortesia).
   A situação de cada conta fica em pagamentos/<uid>, que só a equipe grava. */
(function () {
  "use strict";
  var G = window.Guia, esc = G.esc, ic = G.ic, $ = function (s, r) { return (r || document).querySelector(s); };
  var TOLERANCIA = 2, ATIVA_EM_MIN = 60;
  function cfg() { return G.config(); }
  function hoje() { return G.hojeISO(); }
  function somaDias(iso, n) { var d = new Date(iso + "T12:00:00"); d.setDate(d.getDate() + n); return d.toISOString().slice(0, 10); }
  function maisUmMes(iso) { var d = new Date((iso || hoje()) + "T12:00:00"), dia = d.getDate(); d.setDate(1); d.setMonth(d.getMonth() + 1); d.setDate(Math.min(dia, new Date(d.getFullYear(), d.getMonth() + 1, 0).getDate())); return d.toISOString().slice(0, 10); }
  function br(iso) { return iso ? String(iso).slice(0, 10).split("-").reverse().join("/") : "—"; }
  function hora(iso) { try { return new Date(iso).toLocaleString("pt-BR", { timeZone: "America/Chicago", day: "2-digit", month: "2-digit", hour: "2-digit", minute: "2-digit" }); } catch (e) { return iso; } }

  /* ---------- preço ---------- */
  function precoFuturoEm() { return cfg().precoFuturoEm || "9999-12-31"; }
  function preco(dia) { var c = cfg(), d = dia || hoje(); return d >= precoFuturoEm() && Number(c.precoFuturo) > 0 ? Number(c.precoFuturo) : Number(c.precoAnuncio) || 10; }
  function promocional() { return !!(window.Promo && Promo.ativa()); }
  function chamada() {
    return window.Promo ? Promo.chamada() : "";
  }

  /* ---------- situação da conta ---------- */
  function doc(uid) { return uid ? Store.obter("pagamentos", uid) : null; }
  function estado(uid) {
    var p = doc(uid), h = hoje();
    if (!p) return { fase: "pendente", txt: "Aguardando o primeiro pagamento" };
    if (p.status === "suspenso") return { fase: "suspenso", txt: "Suspenso pela equipe" };
    if (p.status === "cortesia") {
      if (p.cortesiaAte && h <= p.cortesiaAte) return { fase: "cortesia", ate: p.cortesiaAte, txt: "Aprovado pela equipe até " + br(p.cortesiaAte) };
      return { fase: "vencido", ate: p.cortesiaAte, txt: "Aprovação da equipe terminou em " + br(p.cortesiaAte) };
    }
    if (!p.pagoAte) return { fase: "pendente", txt: "Aguardando o primeiro pagamento" };
    if (p.ativaEm && Date.now() < new Date(p.ativaEm).getTime()) return { fase: "ativando", ate: p.pagoAte, txt: "Pagamento confirmado · entra no ar às " + hora(p.ativaEm) };
    if (h <= p.pagoAte) return { fase: "ativo", ate: p.pagoAte, txt: "Ativo · próximo vencimento em " + br(p.pagoAte) };
    if (h <= somaDias(p.pagoAte, TOLERANCIA)) return { fase: "tolerancia", ate: p.pagoAte, txt: "Venceu em " + br(p.pagoAte) + " · sai do ar em " + br(somaDias(p.pagoAte, TOLERANCIA + 1)) + " sem pagamento" };
    return { fase: "vencido", ate: p.pagoAte, txt: "Fora do ar desde " + br(somaDias(p.pagoAte, TOLERANCIA + 1)) + " · pagamento pendente" };
  }
  function noAr(fase) { return fase === "ativo" || fase === "tolerancia" || fase === "cortesia"; }
  function visivel(l) {
    if (!l._dono) return true; if (!noAr(estado(l._dono).fase)) return false;
    var d = doc(l._dono); if (!d || d.plano !== "promo" || !window.Promo) return true;
    var n = Math.max(1, Promo.creditosAtivos(l._dono).length), meus = Store.lista("lugares").filter(function (x) { return x._dono === l._dono; }).sort(function (a, b) { return String(a.criadoEm || a.id) < String(b.criadoEm || b.id) ? -1 : 1; });
    return meus.indexOf(l) < n;
  }
  function informados(uid) { return Store.lista("avisos").filter(function (a) { return a.tipo === "pagamento-informado" && !a.confirmado && !a.recusado && (!uid || a.uid === uid); }); }

  /* ---------- formas de pagamento ---------- */
  function formas() {
    var p = cfg().pagamentos || {}, out = [];
    var cartao = G.url(p.cartao || p.anuncio || p.basico), paypal = G.url(p.paypal);
    if (cartao) out.push({ k: "cartao", nome: "Cartão de crédito ou débito", ic: "ticket", desc: "Pagamento seguro com renovação mensal automática.", link: cartao });
    if (paypal) out.push({ k: "paypal", nome: "PayPal", ic: "globe", desc: "Assinatura mensal pela sua conta PayPal (aceita cartão também).", link: paypal });
    if (p.pix) out.push({ k: "pix", nome: "Pix", ic: "bulb", desc: "Do Brasil, em reais, pela cotação do dia.", chave: p.pix, titular: p.pixNome || "" });
    if (p.zelle) out.push({ k: "zelle", nome: "Zelle", ic: "phone", desc: "De conta bancária americana, em dólar.", chave: p.zelle, titular: p.zelleNome || "" });
    return out;
  }

  /* ---------- página de pagamento do anunciante (#pagar) ---------- */
  function viewPagar(promo) {
    promo = promo === true && window.Promo && (Promo.ativa() || Store.admin());
    var uid = Store.uid(), e = estado(uid), fs = formas(), valor = promo ? Number(Promo.cfg().preco) : preco(), cot = Number(cfg().cotacao) || 0, pend = informados(uid);
    if (!uid) { G.app.innerHTML = '<section class="block"><div class="wrap narrow stack" style="text-align:center;justify-items:center;padding-block:40px"><h1 class="page-h">Entre na sua conta</h1><p class="muted">Para pagar o anúncio, entre com o e-mail e a senha da sua conta de anunciante.</p><a class="btn" href="#entrar">Entrar</a></div></section>'; return; }
    var meus = G.lugares ? Store.lista("lugares").filter(function (l) { return l._dono === uid; }) : [];
    G.app.innerHTML = '<section class="block pg"' + (promo ? ' data-promo="1"' : "") + '><div class="wrap">' +
      '<header class="xp-h"><div><p class="eyebrow">' + (promo ? "Promoção de dezembro" : "Pagamento do anúncio") + '</p><h1 class="page-h">' + (promo ? "Comprar crédito promocional" : "Ative seu anúncio") + "</h1></div></header>" + (promo ? '<div class="pg-st pg-cortesia" style="margin-bottom:14px"><b>1 crédito = ' + Promo.cfg().anuncios + " anúncio por 1 mês + " + Promo.cfg().curadorias + " curadorias</b><span>Pague " + G.usd(valor) + " e avise abaixo. A equipe confirma e o saldo aparece na página da promoção.</span></div>" : "") +
      '<div class="pg-grid"><div class="pg-main">' +
      '<div class="pg-st pg-' + e.fase + '"><b>' + esc(e.txt) + "</b>" + (pend.length ? "<span>Você informou um pagamento em " + br(pend[0].criadoEm) + ". A equipe confere e confirma; o anúncio entra no ar 1 hora depois da confirmação.</span>" : noAr(e.fase) ? "<span>Seu anúncio está visível para o público.</span>" : "<span>Até a confirmação, só você vê o anúncio, em modo prévia.</span>") + "</div>" +
      (fs.length ? '<h2 class="pg-h">Escolha como pagar</h2><div class="pg-fs">' + fs.map(function (f, i) {
        var corpo = f.link ? '<a class="btn" href="' + esc(f.link) + '" target="_blank" rel="noopener" data-pg-link="' + f.k + '">Pagar ' + G.usd(valor) + (promo ? "" : "/mês") + " " + ic("arrow") + "</a>"
          : '<div class="pg-chave"><small>' + (f.k === "pix" ? "Chave Pix" : "Zelle (e-mail ou telefone)") + "</small><b>" + esc(f.chave) + "</b>" + (f.titular ? "<small>Em nome de " + esc(f.titular) + "</small>" : "") + '<button type="button" class="btn ghost sm" data-copiar="' + esc(f.chave) + '">Copiar</button></div>' +
            '<p class="pg-val">Valor: <b>' + (f.k === "pix" && cot ? "R$ " + (valor * cot).toFixed(2).replace(".", ",") + "</b> <small>(" + G.usd(valor) + " pela cotação de R$ " + cot.toFixed(2).replace(".", ",") + ")</small>" : G.usd(valor) + "</b>") + "</p>";
        return '<details class="pg-f"' + (i === 0 ? " open" : "") + '><summary><span class="pg-ic">' + ic(f.ic) + "</span><span><b>" + f.nome + "</b><small>" + f.desc + "</small></span></summary><div class=\"pg-fc\">" + corpo +
          '<form class="pg-inf" data-pg-form="' + f.k + '"><p class="small muted">Depois de pagar, avise aqui para a equipe confirmar.</p><div class="field"><label>Código, nome do pagador ou referência</label><input name="ref" maxlength="120" required placeholder="Ex.: ID da transação ou nome de quem pagou"></div>' +
          (f.link ? "" : '<div class="field"><label>Comprovante (foto ou print, opcional)</label><input type="file" name="comp" accept="image/*"></div>') + '<button class="btn ghost sm" type="submit">Já paguei</button></form></div></details>';
      }).join("") + "</div>" : '<div class="note">As formas de pagamento ainda estão sendo configuradas pela equipe. Fale com o CoraçãoBR pelo WhatsApp para ativar seu anúncio.</div>') +
      "</div>" +
      '<aside class="pg-side"><div class="an-plan"><p class="an-pl">' + (promocional() ? "Preço promocional" : "Plano único") + '</p><div class="an-pv">' + G.usd(valor) + "<small>/mês</small></div>" + (promocional() ? '<p class="pg-promo">' + esc(chamada()) + "</p>" : "") +
      '<ul class="an-ck"><li>' + ic("clock") + "Pagamento mensal, sem fidelidade</li><li>" + ic("star") + "Até 3 anúncios com banner</li><li>" + ic("bell") + "Entra no ar 1 hora após a confirmação</li><li>" + ic("leaf") + "2 dias de tolerância após o vencimento</li></ul></div>" +
      (meus.length ? '<div class="xp-box"><p class="xp-t">Seus anúncios (prévia)</p>' + meus.map(function (l) { return '<a class="pg-prev" href="#lugar-' + esc(l.id) + '">' + (G.foto(l) ? '<img src="' + esc(G.foto(l)) + '" alt="">' : "<span></span>") + "<b>" + esc(l.nome) + "</b>" + ic("arrow") + "</a>"; }).join("") + "</div>" : "") + "</aside></div></div></section>";
  }
  document.addEventListener("submit", async function (ev) {
    var f = ev.target.closest("[data-pg-form]"); if (!f) return; ev.preventDefault();
    var uid = Store.uid(), b = f.querySelector("button"), arq = f.comp && f.comp.files && f.comp.files[0], comp = "";
    b.disabled = true;
    try {
      if (arq) comp = await Store.salvarFoto(arq);
      var meus = Store.lista("lugares").filter(function (l) { return l._dono === uid; }), l = meus[0] || {};
      await Store.gravar("avisos", Store.novoId("pg"), { tipo: "pagamento-informado", plano: f.closest(".pg").dataset.promo ? "promo" : "anuncio", uid: uid, metodo: f.dataset.pgForm, ref: f.ref.value.trim().slice(0, 120), comprovante: comp, valor: f.closest(".pg").dataset.promo ? Number(Promo.cfg().preco) : preco(), lugarId: l.id || "", nome: l.nome || "", categoria: l.categoria || "", criadoEm: new Date().toISOString(), lido: false });
      G.toast("Pagamento informado. A equipe confirma e o anúncio entra no ar 1 hora depois.");
      if (f.closest(".pg").dataset.promo) location.hash = "promo"; else viewPagar();
    } catch (er) { b.disabled = false; G.toast(er.message || "Não foi possível enviar agora."); }
  });

  /* ---------- bloco no painel do anunciante ---------- */
  function blocoPainel(uid) {
    var e = estado(uid), pend = informados(uid);
    return '<div class="dk-card dk-flat pg-mini pg-' + e.fase + '"><div class="dk-ch"><h3>Pagamento</h3><span class="pill ' + (noAr(e.fase) ? "ok" : "warn") + '">' + (noAr(e.fase) ? "No ar" : e.fase === "ativando" ? "Ativando" : "Fora do ar") + "</span></div>" +
      "<p>" + esc(e.txt) + "</p>" + (pend.length ? '<p class="small muted">Pagamento informado em ' + br(pend[0].criadoEm) + ", aguardando confirmação da equipe.</p>" : "") +
      '<dl class="kv"><dt>Valor</dt><dd>' + G.usd(preco()) + "/mês" + (promocional() ? " (promocional)" : "") + "</dd></dl>" + (promocional() ? '<p class="small muted">' + esc(chamada()) + "</p>" : "") +
      (noAr(e.fase) && e.fase !== "tolerancia" ? '<a class="btn ghost sm" href="#pagar">Formas de pagamento</a>' : '<a class="btn" href="#pagar">Pagar agora</a>') + "</div>";
  }
  /* aviso de prévia na página do anúncio para o dono */
  function avisoPrevia(l) {
    if (!l._dono || visivel(l)) return "";
    var dono = Store.uid() === l._dono || Store.admin(); if (!dono) return "";
    return '<div class="pg-pv">' + ic("bell") + "<div><b>Prévia do seu anúncio</b><span>" + esc(estado(l._dono).txt) + ". O público só vê este anúncio depois da confirmação do pagamento.</span></div>" + (Store.uid() === l._dono ? '<a class="btn sm" href="#pagar">Pagar</a>' : "") + "</div>";
  }

  /* ---------- aba do master ---------- */
  function abaMaster(el) {
    var contas = {}, c = cfg(), p = c.pagamentos || {};
    Store.lista("lugares").forEach(function (l) { if (l._dono) (contas[l._dono] = contas[l._dono] || []).push(l); });
    var pend = informados();
    var linhaConta = function (uid) {
      var ls = contas[uid] || [], e = estado(uid), d = doc(uid) || {};
      return '<div class="pgm-c" data-uid="' + esc(uid) + '"><div class="pgm-t"><b>' + esc(ls.map(function (l) { return l.nome; }).join(" · ") || uid) + '</b><small>' + esc(e.txt) + "</small></div>" +
        '<span class="pill ' + (noAr(e.fase) ? "ok" : "warn") + '">' + (noAr(e.fase) ? "No ar" : e.fase === "ativando" ? "Ativando" : "Fora do ar") + "</span>" +
        '<div class="pgm-a"><button type="button" class="btn sm" data-pgm-conf>Confirmar pagamento</button>' + (window.Promo ? '<button type="button" class="btn ghost sm" data-pgm-promo>+1 crédito promocional</button>' : "") + '<button type="button" class="btn ghost sm" data-pgm-cort>Aprovar sem pagamento</button>' + (d.status !== "suspenso" ? '<button type="button" class="btn danger sm" data-pgm-susp>Suspender</button>' : "") + "</div>" +
        '<div class="pgm-cort" hidden><label class="small">Aprovado até <input type="date" data-pgm-ate value="' + somaDias(hoje(), 30) + '" min="' + hoje() + '"></label><input data-pgm-nota maxlength="120" placeholder="Motivo (opcional)"><button type="button" class="btn sm" data-pgm-cort-ok>Aprovar</button></div></div>';
    };
    el.innerHTML = '<div class="stack">' +
      '<div class="panel stack" style="gap:12px"><h3>Pagamentos informados' + (pend.length ? " (" + pend.length + ")" : "") + "</h3>" +
      (pend.length ? pend.map(function (a) { return '<div class="pgm-c"><div class="pgm-t"><b>' + esc(a.nome || a.uid) + " · " + esc((a.metodo || "").toUpperCase()) + " · " + G.usd(a.valor || 0) + (a.plano === "promo" ? " · crédito promocional" : "") + "</b><small>" + br(a.criadoEm) + " · ref.: " + esc(a.ref || "—") + "</small>" + (a.comprovante ? '<a class="small" href="' + esc(Store.urlFoto(a.comprovante)) + '" target="_blank" rel="noopener">ver comprovante</a>' : "") + '</div><div class="pgm-a"><button type="button" class="btn sm" data-pgm-ok="' + esc(a.id) + '" data-uid="' + esc(a.uid) + '">Confirmar</button><button type="button" class="btn ghost sm" data-pgm-no="' + esc(a.id) + '">Recusar</button></div></div>'; }).join("") : '<p class="muted small">Nenhum pagamento aguardando confirmação.</p>') + "</div>" +
      '<div class="panel stack" style="gap:12px"><h3>Contas de anunciantes</h3><p class="small muted">Confirmar soma 1 mês a partir do vencimento atual (ou de hoje, se já venceu) e o anúncio entra no ar 1 hora depois. Tolerância de ' + TOLERANCIA + " dias após o vencimento.</p>" +
      (Object.keys(contas).length ? Object.keys(contas).map(linhaConta).join("") : '<p class="muted small">Nenhuma conta de anunciante ainda.</p>') + "</div>" +
      '<form class="panel stack" style="gap:12px" id="pgm-cfg"><h3>Preço e formas de pagamento</h3><div class="form2">' +
      campo("pc-p", "Preço atual (US$/mês)", c.precoAnuncio || 10, 'type="number" min="0" step="0.01"') + campo("pc-pi", "Promoção · início", (c.promo || {}).inicio || "2026-12-01", 'type="date"') + campo("pc-pf", "Promoção · fim", (c.promo || {}).fim || "2026-12-31", 'type="date"') + campo("pc-pv", "Promoção · preço do crédito (US$)", (c.promo || {}).preco || 3, 'type="number" min="0" step="0.01"') + "</div>" +
      '<div class="form2">' + campo("pc-card", "Link de assinatura · cartão de crédito/débito (Stripe, Square…)", p.cartao || p.anuncio || "", 'placeholder="https://"') + campo("pc-pp", "Link de assinatura · PayPal", p.paypal || "", 'placeholder="https://"') +
      campo("pc-pix", "Chave Pix", p.pix || "") + campo("pc-pixn", "Titular do Pix", p.pixNome || "") + campo("pc-ze", "Zelle (e-mail ou telefone)", p.zelle || "") + campo("pc-zen", "Titular do Zelle", p.zelleNome || "") + "</div>" +
      '<button class="btn" type="submit" style="justify-self:start">Salvar</button></form></div>';
    el.onclick = function (ev) {
      var b, box = ev.target.closest(".pgm-c"), uid = box && box.dataset.uid;
      if ((b = ev.target.closest("[data-pgm-ok]"))) { var av = Store.obter("avisos", b.dataset.pgmOk); if (av && av.plano === "promo") confirmaPromo(b.dataset.uid, b.dataset.pgmOk); else confirma(b.dataset.uid, "", b.dataset.pgmOk); return; }
      if ((b = ev.target.closest("[data-pgm-no]"))) { var a = Store.obter("avisos", b.dataset.pgmNo); if (a) Store.gravar("avisos", a.id, Object.assign({}, a, { recusado: true, lido: true })).then(function () { abaMaster(el); }); return; }
      if (!uid) return;
      if (ev.target.closest("[data-pgm-conf]")) { confirma(uid, ""); return; }
      if (ev.target.closest("[data-pgm-promo]")) { confirmaPromo(uid, ""); return; }
      if (ev.target.closest("[data-pgm-cort]")) { box.querySelector(".pgm-cort").hidden = false; return; }
      if (ev.target.closest("[data-pgm-cort-ok]")) { var ate = box.querySelector("[data-pgm-ate]").value; if (!ate) { G.toast("Escolha a data de expiração."); return; } grava(uid, { status: "cortesia", cortesiaAte: ate, nota: box.querySelector("[data-pgm-nota]").value.trim() }, "Aprovado até " + br(ate) + "."); return; }
      if ((b = ev.target.closest("[data-pgm-susp]"))) { if (!b.dataset.ok) { b.dataset.ok = 1; b.textContent = "Confirmar suspensão"; return; } grava(uid, { status: "suspenso" }, "Conta suspensa."); }
    };
    $("#pgm-cfg", el).onsubmit = function (ev) {
      ev.preventDefault(); var v = function (id) { return $("#" + id, el).value.trim(); }, pg = Object.assign({}, cfg().pagamentos || {});
      pg.cartao = v("pc-card"); pg.paypal = v("pc-pp"); pg.pix = v("pc-pix"); pg.pixNome = v("pc-pixn"); pg.zelle = v("pc-ze"); pg.zelleNome = v("pc-zen"); pg.anuncio = pg.cartao;
      var novo = Object.assign({}, cfg(), { precoAnuncio: Number(v("pc-p")) || 10, precoFuturo: 0, precoFuturoEm: "", promo: Object.assign({}, cfg().promo || {}, { inicio: v("pc-pi"), fim: v("pc-pf"), preco: Number(v("pc-pv")) || 3, anuncios: 1, curadorias: 5 }), pagamentos: pg });
      delete novo.id; Store.gravar("config", "geral", novo).then(function () { G.toast("Preço e formas de pagamento salvos."); }).catch(function (er) { G.toast(er.message || "Não foi possível salvar."); });
    };
    function grava(uid, extra, msg) {
      var d = Object.assign({}, doc(uid) || {}, extra, { atualizadoEm: new Date().toISOString() }); delete d.id; delete d._dono;
      return Store.gravar("pagamentos", uid, d).then(function () { G.toast(msg); abaMaster(el); }).catch(function (er) { G.toast(er.message || "Não foi possível salvar."); });
    }
    function confirma(uid, metodo, avisoId) {
      var d = doc(uid) || {}, base = d.pagoAte && d.pagoAte >= hoje() ? d.pagoAte : hoje(), ate = maisUmMes(base);
      var hist = (d.historico || []).slice(-23); hist.push({ em: new Date().toISOString(), valor: preco(), ate: ate, aviso: avisoId || "" });
      var ativa = d.pagoAte && d.pagoAte >= somaDias(hoje(), -TOLERANCIA) && d.status !== "suspenso" ? new Date().toISOString() : new Date(Date.now() + ATIVA_EM_MIN * 60000).toISOString();
      grava(uid, { status: "ativo", pagoAte: ate, ativaEm: ativa, historico: hist }, "Pagamento confirmado. Ativo até " + br(ate) + (ativa > new Date().toISOString() ? "; entra no ar em 1 hora." : "."));
      if (avisoId) { var a = Store.obter("avisos", avisoId); if (a) Store.gravar("avisos", a.id, Object.assign({}, a, { confirmado: true, lido: true })); }
    }
    /* crédito promocional: +1 anúncio por 1 mês e +5 curadorias */
    function confirmaPromo(uid, avisoId) {
      var d = doc(uid) || {}, pc = window.Promo ? Promo.cfg() : { anuncios: 1, curadorias: 5, preco: 3 }, ate = maisUmMes(hoje());
      var cr = (d.creditos || []).slice(-50); cr.push({ em: new Date().toISOString(), ate: ate, aviso: avisoId || "" });
      var hist = (d.historico || []).slice(-23); hist.push({ em: new Date().toISOString(), valor: pc.preco, ate: ate, aviso: avisoId || "", promo: true });
      var ativa = d.pagoAte && d.pagoAte >= hoje() && d.status === "ativo" ? new Date().toISOString() : new Date(Date.now() + ATIVA_EM_MIN * 60000).toISOString();
      grava(uid, { status: "ativo", plano: d.plano === "anuncio" && d.pagoAte >= hoje() ? "anuncio" : "promo", creditos: cr, curadorias: (Number(d.curadorias) || 0) + Number(pc.curadorias || 5), pagoAte: !d.pagoAte || d.pagoAte < ate ? ate : d.pagoAte, ativaEm: ativa, historico: hist }, "Crédito promocional confirmado: +1 anúncio por 1 mês e +" + (pc.curadorias || 5) + " curadorias.");
      if (avisoId) { var a = Store.obter("avisos", avisoId); if (a) Store.gravar("avisos", a.id, Object.assign({}, a, { confirmado: true, lido: true })); }
    }
  }
  function confirmaPromoGlobal() {}
  function campo(id, rot, val, extra) { return '<div class="field"><label for="' + id + '">' + rot + '</label><input id="' + id + '" value="' + esc(val == null ? "" : val) + '" ' + (extra || "") + "></div>"; }

  G.views.pagar = function () { viewPagar(false); }; G.views["pagar-promo"] = function () { viewPagar(true); };
  window.Pag = { preco: preco, promocional: promocional, chamada: chamada, estado: estado, visivel: visivel, noAr: noAr, blocoPainel: blocoPainel, avisoPrevia: avisoPrevia, abaMaster: abaMaster, formas: formas };
})();
