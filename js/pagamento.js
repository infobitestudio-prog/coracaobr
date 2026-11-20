/* Planos do anunciante, em reais.
   - Pacote: R$ 50 = 3 anúncios por 1 mês (valores no Painel master → Pagamentos). Pacotes somam: 2 pacotes = 6 anúncios por R$ 100, 3 = 9 por R$ 150…
   - Cada compra vira um pacote com data de pagamento, início e fim. Dá para comprar "agora" (mais vagas já) ou "depois do plano atual" (renovação).
   - Promoção de curadoria: R$ 20 = 1 anúncio por 1 mês + 5 depoimentos de empresas que a pessoa conhece.
   - Formas: cartão/débito e PayPal (link), Pix e Zelle (o anunciante informa o pagamento). O master confirma e o pacote entra no ar 1 hora depois.
   - 2 dias de tolerância depois do fim. O master pode aprovar sem pagamento até uma data (cortesia) e suspender.
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
  function reais(n) { return G.reais(n); }
  function diaLocal(iso) { try { return new Date(iso).toLocaleDateString("pt-BR", { timeZone: "America/Chicago" }); } catch (e) { return br(iso); } }

  /* ---------- preço ---------- */
  function preco() { return Number(cfg().precoAnuncio) || 50; }              /* valor de 1 pacote */
  function porPacote() { return Math.max(1, Number(cfg().anunciosPorPacote) || 3); }
  function promoCfg() { return window.Promo ? Promo.cfg() : { preco: 20, anuncios: 1, curadorias: 5 }; }
  function precoSelo() { return Number(cfg().precoVerificado) || 30; }
  function precoImpulso() { return Number(cfg().precoImpulso) || 25; }
  function diasImpulso() { return Math.max(1, Number(cfg().diasImpulso) || 7); }
  /* selo Verificado CoraçãoBR: pago uma vez e aprovado pela equipe */
  function verificacao(uid) { var p = doc(uid) || {}; return p.verificacao || null; }
  function verificado(uid) { var v = verificacao(uid); return !!(v && v.status === "aprovado"); }
  function selo(l) { return !!(l && l._dono && verificado(l._dono)); }
  /* impulsionar: o anúncio vai para o topo das listas por N dias */
  function impulsos(uid) { return pacotes(uid).filter(function (pk) { return pk.tipo === "impulso"; }); }
  function impulsionado(l) { if (!l || !l._dono) return false; var h = hoje(); return impulsos(l._dono).some(function (pk) { return pk.lugarId === l.id && pk.inicio <= h && h <= pk.fim && !(pk.ativaEm && Date.now() < new Date(pk.ativaEm).getTime()); }); }
  function promocional() { return !!(window.Promo && Promo.ativa()); }
  function chamada() { return window.Promo ? Promo.chamada() : ""; }

  /* ---------- pacotes ---------- */
  function doc(uid) { return uid ? Store.obter("pagamentos", uid) : null; }
  /* lista de pacotes (inclui os registros antigos, de antes dos pacotes) */
  function pacotes(uid) {
    var p = doc(uid) || {}, out = (Array.isArray(p.pacotes) ? p.pacotes : []).filter(function (x) { return x && x.inicio && x.fim; }).slice();
    if (!Array.isArray(p.pacotes)) {
      if (p.pagoAte) out.push({ id: "antigo", tipo: "pacote", qtd: 1, anuncios: 3, inicio: somaDias(p.pagoAte, -30), fim: p.pagoAte, ativaEm: p.ativaEm || "", pagoEm: "", valor: 0, antigo: true });
      (p.creditos || []).forEach(function (c, i) { if (c && c.ate) out.push({ id: "cred" + i, tipo: "promo", qtd: 1, anuncios: 1, inicio: String(c.em || "").slice(0, 10) || somaDias(c.ate, -30), fim: c.ate, ativaEm: c.em || "", pagoEm: c.em || "", valor: 0, antigo: true }); });
    }
    return out.sort(function (a, b) { return a.inicio < b.inicio ? -1 : a.inicio > b.inicio ? 1 : 0; });
  }
  function situacao(pk, dia) {
    dia = dia || hoje();
    if (dia < pk.inicio || (pk.ativaEm && Date.now() < new Date(pk.ativaEm).getTime())) return dia > pk.fim ? "encerrado" : "agendado";
    if (dia <= pk.fim) return "ativo";
    if (dia <= somaDias(pk.fim, TOLERANCIA)) return "tolerancia";
    return "encerrado";
  }
  function emVigor(uid, dia) { return pacotes(uid).filter(function (pk) { var s = situacao(pk, dia); return s === "ativo" || s === "tolerancia"; }); }
  function vagas(uid, dia) {
    var p = doc(uid) || {};
    if (p.status === "suspenso") return 0;
    var n = emVigor(uid, dia).reduce(function (s, pk) { return s + (Number(pk.anuncios) || 0); }, 0);
    if (p.status === "cortesia" && p.cortesiaAte && (dia || hoje()) <= p.cortesiaAte) n = Math.max(n, Number(p.cortesiaVagas) || porPacote());
    return n;
  }
  function banners(uid) { return Math.max(vagas(uid) > 0 ? 1 : 0, emVigor(uid).filter(function (pk) { return pk.tipo !== "promo"; }).reduce(function (s, pk) { return s + (Number(pk.qtd) || 1); }, 0)); }
  function fimAtual(uid) { var v = emVigor(uid); return v.length ? v.reduce(function (m, pk) { return pk.fim > m ? pk.fim : m; }, "") : ""; }
  function proximoFim(uid) { var v = emVigor(uid); return v.length ? v.reduce(function (m, pk) { return !m || pk.fim < m ? pk.fim : m; }, "") : ""; }
  function agendados(uid) { return pacotes(uid).filter(function (pk) { return situacao(pk) === "agendado"; }); }

  /* ---------- situação da conta ---------- */
  function estado(uid) {
    var p = doc(uid) || {}, h = hoje(), n = vagas(uid), vig = emVigor(uid), ag = agendados(uid);
    if (p.status === "suspenso") return { fase: "suspenso", vagas: 0, txt: "Conta suspensa pela equipe" };
    if (p.status === "cortesia" && p.cortesiaAte && h <= p.cortesiaAte && !vig.length) return { fase: "cortesia", vagas: n, ate: p.cortesiaAte, txt: "Aprovado pela equipe até " + br(p.cortesiaAte) + " · " + n + " anúncios" };
    if (vig.length) {
      var tol = vig.every(function (pk) { return situacao(pk) === "tolerancia"; }), fim = fimAtual(uid);
      return tol ? { fase: "tolerancia", vagas: n, ate: fim, txt: "Plano venceu em " + br(fim) + " · sai do ar em " + br(somaDias(fim, TOLERANCIA + 1)) + " sem renovação" }
        : { fase: "ativo", vagas: n, ate: fim, txt: n + (n === 1 ? " anúncio liberado" : " anúncios liberados") + " · próximo término em " + br(proximoFim(uid)) };
    }
    if (ag.length) { var a = ag[0]; return { fase: "ativando", vagas: 0, ate: a.fim, txt: a.inicio > h ? "Pacote agendado · começa em " + br(a.inicio) : "Pagamento confirmado · entra no ar às " + hora(a.ativaEm) }; }
    if (pacotes(uid).length) return { fase: "vencido", vagas: 0, txt: "Plano encerrado · contrate um pacote para voltar ao ar" };
    return { fase: "pendente", vagas: 0, txt: "Nenhum pacote contratado ainda" };
  }
  function noAr(fase) { return fase === "ativo" || fase === "tolerancia" || fase === "cortesia"; }
  /* anúncios do dono, do mais antigo para o mais novo: os N primeiros (N = vagas) aparecem ao público */
  function anunciosDe(uid) { return Store.lista("lugares").filter(function (x) { return x._dono === uid; }).sort(function (a, b) { return String(a.criadoEm || a.id) < String(b.criadoEm || b.id) ? -1 : 1; }); }
  function visivel(l) {
    if (!l._dono) return true;
    var n = vagas(l._dono); if (!n) return false;
    return anunciosDe(l._dono).indexOf(l) < n;
  }
  function informados(uid) { return Store.lista("avisos").filter(function (a) { return a.tipo === "pagamento-informado" && !a.confirmado && !a.recusado && (!uid || a.uid === uid); }); }

  /* ---------- formas de pagamento ---------- */
  /* todo pagamento é por Pix, para a chave oficial (QR Code e copia e cola gerados com o valor) */
  function formas() {
    var d = window.Pix ? Pix.dados() : { chave: (cfg().pagamentos || {}).pix || "32.021.268/0001-04", nome: (cfg().pagamentos || {}).pixNome || "Danilo Araujo Santos Desenvolvedor" };
    return [{ k: "pix", nome: "Pix", ic: "bulb", desc: "Na hora, em reais. QR Code e copia e cola com o valor certo.", chave: d.chave, titular: d.nome }];
  }

  /* ---------- calculadora (página de contratar e painel do anunciante) ---------- */
  var Q = { qtd: 1, comeca: "agora" };
  /* programa de indicação: cada indicado que paga dá 50% de desconto em 1 pacote para quem indicou */
  function creditosIndicacao(uid) { return Math.max(0, Number((doc(uid) || {}).creditosIndicacao) || 0); }
  function previsao(uid, qtd, comeca) {
    var ini = comeca === "renovar" && fimAtual(uid) ? somaDias(fimAtual(uid), 1) : hoje(), desc = creditosIndicacao(uid) > 0 ? Math.round(preco() * 50) / 100 : 0;
    return { inicio: ini, fim: maisUmMes(ini), anuncios: qtd * porPacote(), bruto: qtd * preco(), desconto: desc, valor: Math.round((qtd * preco() - desc) * 100) / 100 };
  }
  function calculadora(uid, compacta) {
    var pr = previsao(uid, Q.qtd, Q.comeca), temAtual = !!fimAtual(uid);
    var opc = [1, 2, 3, 4, 5, 10].map(function (n) { return '<button type="button" class="pk-q" data-pk-q="' + n + '" aria-pressed="' + (Q.qtd === n) + '"><b>' + n * porPacote() + "</b><small>anúncios</small><em>" + reais(n * preco()) + "</em></button>"; }).join("");
    return '<div class="pk-calc" data-pk-calc><div class="pk-hd"><div><p class="pk-k">Monte seu plano</p><h3>' + reais(preco()) + " = " + porPacote() + ' anúncios por 1 mês</h3><p class="pk-s">Cada pacote soma mais ' + porPacote() + " anúncios. Compre quantos quiser.</p></div></div>" +
      '<div class="pk-qs">' + opc + "</div>" +
      '<div class="pk-step"><span>Pacotes</span><button type="button" data-pk-mais="-1" aria-label="Menos um pacote">−</button><b data-pk-n>' + Q.qtd + '</b><button type="button" data-pk-mais="1" aria-label="Mais um pacote">+</button></div>' +
      (temAtual ? '<div class="pk-quando" role="radiogroup" aria-label="Quando começa"><label class="pk-op"><input type="radio" name="pk-comeca" value="agora"' + (Q.comeca === "agora" ? " checked" : "") + '><span><b>Somar agora</b><small>Mais anúncios no ar assim que o pagamento for confirmado.</small></span></label><label class="pk-op"><input type="radio" name="pk-comeca" value="renovar"' + (Q.comeca === "renovar" ? " checked" : "") + '><span><b>Renovar depois do plano atual</b><small>Começa em ' + br(somaDias(fimAtual(uid), 1)) + ", sem perder nenhum dia.</small></span></label></div>" : "") +
      '<div class="pk-res"><div><small>Anúncios</small><b>' + pr.anuncios + '</b></div><div><small>Início</small><b>' + br(pr.inicio) + '</b></div><div><small>Término</small><b>' + br(pr.fim) + '</b></div><div class="pk-tot"><small>Total</small><b>' + reais(pr.valor) + "</b>" + (pr.desconto ? '<small class="pk-desc">' + reais(pr.bruto) + " − 50% de 1 pacote (indicação)</small>" : "") + "</div></div>" +
      (compacta ? '<a class="btn pk-go" href="#pagar">Contratar ' + pr.anuncios + " anúncios por " + reais(pr.valor) + " " + ic("arrow") + "</a>" : "") + "</div>";
  }
  function redesenhaCalc() { var el = document.querySelector("[data-pk-calc]"); if (!el) return; var compacta = !!el.querySelector(".pk-go"); el.outerHTML = calculadora(Store.uid(), compacta); if (document.querySelector(".pg")) viewPagar(document.querySelector(".pg").dataset.promo === "1"); }
  document.addEventListener("click", function (e) {
    var b = e.target.closest("[data-pk-q]"); if (b) { Q.qtd = Number(b.dataset.pkQ); redesenhaCalc(); return; }
    b = e.target.closest("[data-pk-mais]"); if (b) { Q.qtd = Math.max(1, Math.min(30, Q.qtd + Number(b.dataset.pkMais))); redesenhaCalc(); }
  });
  document.addEventListener("change", function (e) { if (e.target.name === "pk-comeca") { Q.comeca = e.target.value; redesenhaCalc(); } });

  /* ---------- linha do tempo dos pacotes ---------- */
  var NOME_SIT = { ativo: ["No ar", "ok"], tolerancia: ["Tolerância", "warn"], agendado: ["Agendado", "xp"], encerrado: ["Encerrado", ""] };
  function linhaDoTempo(uid) {
    var ps = pacotes(uid).slice().reverse(), pend = informados(uid);
    if (!ps.length && !pend.length) return '<p class="small muted">Nenhum pacote ainda. Quando você contratar, cada compra aparece aqui com a data do pagamento, o início e o término.</p>';
    return '<div class="pk-tl">' + pend.map(function (a) { return '<div class="pk-it pend"><span class="pk-dot"></span><div><b>' + (a.plano === "verificado" ? "Selo Verificado CoraçãoBR" : a.plano === "impulso" ? "Impulso de " + diasImpulso() + " dias" : a.plano === "promo" ? "Promoção de curadoria" : (a.qtd || 1) + (Number(a.qtd) > 1 ? " pacotes" : " pacote") + " · " + (Number(a.qtd || 1) * porPacote()) + " anúncios") + '</b><small>Pagamento informado em ' + diaLocal(a.criadoEm) + " · " + esc((a.metodo || "").toUpperCase()) + ' · aguardando confirmação</small></div><span class="pk-v">' + reais(a.valor || 0) + '</span><span class="pill warn">Aguardando</span></div>'; }).join("") +
      ps.map(function (pk) { var s = situacao(pk), ns = NOME_SIT[s] || [s, ""]; return '<div class="pk-it ' + s + '"><span class="pk-dot"></span><div><b>' + (pk.tipo === "impulso" ? "Impulso de " + diasImpulso() + " dias · " + esc(((Store.obter("lugares", pk.lugarId) || {}).nome) || "anúncio") : pk.tipo === "bonus" ? "Bônus de indicação · " + (pk.anuncios || 3) + " anúncios grátis" : pk.tipo === "promo" ? "Promoção de curadoria · 1 anúncio + " + (pk.curadorias || 5) + " depoimentos" : (pk.qtd || 1) + (Number(pk.qtd) > 1 ? " pacotes" : " pacote") + " · " + (pk.anuncios || 3) + " anúncios") + (pk.cortesia ? " · cortesia" : "") + "</b><small>" + (pk.pagoEm ? "Pago em " + diaLocal(pk.pagoEm) + " · " : "") + "Início " + br(pk.inicio) + " · Término " + br(pk.fim) + (s === "tolerancia" ? " · sai do ar em " + br(somaDias(pk.fim, TOLERANCIA + 1)) : "") + '</small></div><span class="pk-v">' + (pk.valor ? reais(pk.valor) : "—") + '</span><span class="pill ' + ns[1] + '">' + ns[0] + "</span></div>"; }).join("") + "</div>";
  }

  /* ---------- página de contratar / pagar (#pagar e #pagar-promo) ---------- */
  function viewPagar(promo) {
    promo = promo === true && window.Promo && (Promo.ativa() || Store.admin());
    var uid = Store.uid(), e = estado(uid), fs = formas(), pend = informados(uid), cot = Number(cfg().cotacao) || 0;
    if (!uid) { G.app.innerHTML = '<section class="block"><div class="wrap narrow stack" style="text-align:center;justify-items:center;padding-block:40px"><h1 class="page-h">Entre na sua conta</h1><p class="muted">Para contratar anúncios, entre com o e-mail e a senha da sua conta de anunciante.</p><a class="btn" href="#entrar" data-acesso="anunciar">Entrar como anunciante</a></div></section>'; return; }
    var pc = promoCfg(), pr = previsao(uid, Q.qtd, Q.comeca), valor = promo ? Number(pc.preco) : pr.valor;
    PED = promo ? { plano: "promo", qtd: 1, comeca: "agora", valor: valor, volta: "promo", rotulo: "CoracaoBR promocao" } : { plano: "pacote", qtd: Q.qtd, comeca: Q.comeca, valor: valor, volta: "anunciante", rotulo: "CoracaoBR " + (Q.qtd * porPacote()) + " anuncios" };
    var resumo = promo ? '<div class="an-plan"><p class="an-pl">Promoção de curadoria</p><div class="an-pv">' + reais(pc.preco) + '</div><ul class="an-ck"><li>' + ic("star") + pc.anuncios + " anúncio no ar por 1 mês</li><li>" + ic("star") + pc.curadorias + " depoimentos de empresas que você conhece</li><li>" + ic("bell") + "Entra no ar 1 hora após a confirmação</li></ul></div>"
      : '<div class="an-plan"><p class="an-pl">Resumo da compra</p><div class="an-pv">' + reais(pr.valor) + '</div><ul class="an-ck"><li>' + ic("star") + Q.qtd + (Q.qtd === 1 ? " pacote" : " pacotes") + " · " + pr.anuncios + " anúncios</li><li>" + ic("clock") + "De " + br(pr.inicio) + " a " + br(pr.fim) + "</li><li>" + ic("bell") + "Entra no ar 1 hora após a confirmação</li><li>" + ic("leaf") + TOLERANCIA + " dias de tolerância no fim</li></ul></div>";
    G.app.innerHTML = '<section class="block pg"' + (promo ? ' data-promo="1"' : "") + '><div class="wrap">' +
      '<header class="xp-h"><div><a class="more" href="#anunciante">← Painel do anunciante</a><p class="eyebrow" style="margin-top:8px">' + (promo ? "Promoção de curadoria" : "Contratar anúncios") + '</p><h1 class="page-h">' + (promo ? "1 anúncio + " + pc.curadorias + " depoimentos por " + reais(pc.preco) : "Quantos anúncios você quer?") + "</h1></div></header>" +
      '<div class="pg-grid"><div class="pg-main">' +
      '<div class="pg-st pg-' + e.fase + '"><b>' + esc(e.txt) + "</b>" + (pend.length ? "<span>Você informou um pagamento em " + br(pend[0].criadoEm) + ". A equipe confere e confirma; o pacote entra no ar 1 hora depois da confirmação.</span>" : noAr(e.fase) ? "<span>Seus anúncios liberados estão visíveis para o público.</span>" : "<span>Até a confirmação do pagamento, só você vê seus anúncios, em modo prévia.</span>") + "</div>" +
      (promo ? "" : calculadora(uid, false)) +
      pagamentoHtml(uid) +
      '<div class="dk-card dk-flat"><div class="dk-ch"><h3>Seus pacotes</h3></div>' + linhaDoTempo(uid) + "</div>" +
      "</div>" + '<aside class="pg-side">' + resumo + "</aside></div></div></section>";
  }
  /* bloco de pagamento (Pix automático ou Pix pela chave + "Já paguei") para o pedido atual (PED) */
  var PED = null;
  function pagamentoHtml(uid) {
    var fs = formas(), valor = PED.valor;
    return '<h2 class="pg-h">Pague ' + reais(valor) + ' por Pix</h2><div class="pg-fs">' + fs.map(function (f, i) {
      var txid = "CBR" + String(uid || "").replace(/[^A-Za-z0-9]/g, "").slice(-8).toUpperCase() + PED.plano.slice(0, 2).toUpperCase() + (PED.qtd || 1) + new Date().toISOString().slice(5, 10).replace("-", "");
      if (pixAuto()) return '<div class="pg-f pxa-box" data-pxa><div class="pg-fc">' + pixAutoHtml() + "</div></div>";
      var corpo = window.Pix ? Pix.bloco(valor, txid, PED.rotulo) : '<div class="pg-chave"><small>Chave Pix</small><b>' + esc(f.chave) + "</b><small>Em nome de " + esc(f.titular) + '</small><button type="button" class="btn ghost sm" data-copiar="' + esc(f.chave) + '">Copiar</button></div><p class="pg-val">Valor: <b>' + reais(valor) + "</b></p>";
      return '<details class="pg-f"' + (i === 0 ? " open" : "") + '><summary><span class="pg-ic">' + ic(f.ic) + "</span><span><b>" + f.nome + "</b><small>" + f.desc + "</small></span></summary><div class=\"pg-fc\">" + corpo +
        '<form class="pg-inf" data-pg-form="' + f.k + '"><p class="small muted">Depois de pagar, avise aqui para a equipe confirmar.</p><div class="field"><label>Código, nome do pagador ou referência</label><input name="ref" maxlength="120" required placeholder="Ex.: ID da transação ou nome de quem pagou"></div>' +
        '<div class="field"><label>Comprovante (foto ou print, opcional)</label><input type="file" name="comp" accept="image/*"></div><button class="btn ghost sm" type="submit">Já paguei ' + reais(valor) + "</button></form></div></details>";
    }).join("") + "</div>";
  }
  document.addEventListener("submit", async function (ev) {
    var f = ev.target.closest("[data-pg-form]"); if (!f || !PED) return; ev.preventDefault();
    var uid = Store.uid(), b = f.querySelector("button"), arq = f.comp && f.comp.files && f.comp.files[0], comp = "";
    b.disabled = true;
    try {
      if (arq) comp = await Store.salvarFoto(arq);
      var meus = anunciosDe(uid), l = (PED.lugarId && Store.obter("lugares", PED.lugarId)) || meus[0] || {};
      await Store.gravar("avisos", Store.novoId("pg"), { tipo: "pagamento-informado", plano: PED.plano, qtd: PED.qtd || 1, comeca: PED.comeca || "agora", lugarAlvo: PED.lugarId || "", itemId: PED.itemId || "", uid: uid, metodo: f.dataset.pgForm, ref: f.ref.value.trim().slice(0, 120), comprovante: comp, valor: PED.valor, moeda: "BRL", lugarId: l.id || "", nome: l.nome || (Store.conta && Store.conta() ? Store.conta().nome : ""), categoria: l.categoria || "", criadoEm: new Date().toISOString(), lido: false });
      G.toast("Pagamento informado. A equipe confere e libera em seguida.");
      location.hash = PED.volta || "anunciante";
    } catch (er) { b.disabled = false; G.toast(er.message || "Não foi possível enviar agora."); }
  });

  /* ---------- selo Verificado e impulsionar (#extra-selo, #extra-impulso-<anúncio>) ---------- */
  function viewExtra(rota) {
    var uid = Store.uid(); if (!uid) { location.hash = "#entrar"; return; }
    var impulso = /^extra-impulso-/.test(rota), lid = impulso ? decodeURIComponent(rota.slice(14)) : "", l = lid ? Store.obter("lugares", lid) : null, v = verificacao(uid);
    if (impulso && !l) { location.hash = "#anunciante"; return; }
    PED = impulso ? { plano: "impulso", qtd: 1, comeca: "agora", lugarId: lid, valor: precoImpulso(), volta: "anunciante", rotulo: "CoracaoBR impulso" } : { plano: "verificado", qtd: 1, comeca: "agora", valor: precoSelo(), volta: "anunciante", rotulo: "CoracaoBR selo verificado" };
    var titulo = impulso ? "Impulsionar " + l.nome : "Selo Verificado CoraçãoBR", ativo = impulso && impulsionado(l);
    var lado = impulso ? '<div class="an-plan"><p class="an-pl">Impulso</p><div class="an-pv">' + reais(precoImpulso()) + '</div><ul class="an-ck"><li>' + ic("star") + "Topo das listas e buscas por " + diasImpulso() + " dias</li><li>" + ic("star") + "Etiqueta Destaque no card</li><li>" + ic("star") + "Pagamento único, sem renovação</li><li>" + ic("bell") + (pixAuto() ? "Começa na hora em que o Pix for aprovado" : "Começa assim que a equipe confirmar") + "</li></ul></div>"
      : '<div class="an-plan"><p class="an-pl">Selo Verificado</p><div class="an-pv">' + reais(precoSelo()) + '</div><ul class="an-ck"><li>' + ic("star") + "Selo verde em todos os seus anúncios</li><li>" + ic("star") + "A equipe confere o negócio (nome, contato, endereço)</li><li>" + ic("star") + "Pagamento único, vale enquanto o negócio seguir ativo</li><li>" + ic("bell") + "Aprovação em até 2 dias úteis</li></ul></div>";
    var status = impulso ? (ativo ? '<div class="pg-st pg-ativo"><b>Este anúncio já está impulsionado.</b><span>Comprar de novo soma mais ' + diasImpulso() + " dias.</span></div>" : "")
      : v ? '<div class="pg-st pg-' + (v.status === "aprovado" ? "ativo" : "ativando") + '"><b>' + (v.status === "aprovado" ? "Seu negócio já é Verificado CoraçãoBR." : v.status === "recusado" ? "Verificação não aprovada." : "Pagamento recebido · verificação em análise pela equipe.") + "</b>" + (v.nota ? "<span>" + esc(v.nota) + "</span>" : "") + "</div>" : "";
    G.app.innerHTML = '<section class="block pg"><div class="wrap"><header class="xp-h"><div><a class="more" href="#anunciante">← Painel do anunciante</a><p class="eyebrow" style="margin-top:8px">' + (impulso ? "Destaque" : "Confiança") + '</p><h1 class="page-h">' + esc(titulo) + "</h1></div></header>" +
      '<div class="pg-grid"><div class="pg-main">' + status +
      '<div class="dk-card dk-flat"><p>' + (impulso ? "Seu anúncio aparece em primeiro em Explorar, no Ranking, nas categorias e no mapa durante " + diasImpulso() + " dias, com a etiqueta <b>Destaque</b>." : "O selo mostra para os brasileiros que o negócio existe de verdade e foi conferido pela equipe do CoraçãoBR. Anúncios verificados recebem mais cliques e contatos.") + "</p></div>" +
      (impulso || !(v && v.status === "aprovado") ? pagamentoHtml(uid) : "") +
      "</div>" + '<aside class="pg-side">' + lado + "</aside></div></div></section>";
  }

  /* ---------- Pix automático: cobrança do Mercado Pago, confirmação e liberação sozinhas ---------- */
  var PX = null, pxT = null;
  function pixAuto() { return !!(Store.servidor && Store.servidor() && Store.estado.sessao && Store.estado.sessao.pixAuto); }
  function pixAutoHtml() {
    var valor = PED.valor, chave = [PED.plano, PED.qtd, PED.comeca, PED.lugarId || "", PED.itemId || "", valor].join(":");
    if (PX && PX.chave !== chave && PX.status !== "aprovado") PX = null;
    if (!PX) return '<div class="pxa"><div class="pxa-hd"><span class="pg-ic">' + ic("bulb") + "</span><div><b>Pix com confirmação automática</b><small>Gere o Pix, pague no app do banco e seus anúncios entram no ar sozinhos, na hora.</small></div></div>" +
      '<button type="button" class="btn pxa-go" data-pxa-gerar data-chave="' + esc(chave) + '">Gerar Pix de ' + reais(valor) + "</button></div>";
    if (PX.status === "aprovado") return '<div class="pxa pxa-ok"><span class="pxa-ck">✓</span><div><b>Pagamento confirmado!</b><small>' + (PED.plano === "verificado" ? "A equipe já recebeu o pedido do selo." : PED.plano === "impulso" ? "Seu anúncio já está no topo." : PED.plano === "clube" ? "Sua carteirinha do Clube já está ativa." : PED.plano === "mural" ? "Sua publicação já está em destaque." : "Seus anúncios já estão liberados.") + ' Levando você de volta…</small></div></div>';
    if (PX.status === "expirado" || PX.status === "cancelado") return '<div class="pxa"><p><b>Este Pix ' + (PX.status === "expirado" ? "expirou" : "foi cancelado") + ".</b> Gere um novo para continuar.</p><button type=\"button\" class=\"btn\" data-pxa-novo>Gerar novo Pix</button></div>";
    return '<div class="pix"><div class="pix-qr"><img src="data:image/png;base64,' + esc(PX.qr) + '" alt="QR Code Pix" style="width:100%;display:block"></div><div class="pix-info"><p class="pix-v"><small>Valor</small><b>' + reais(PX.valor) + "</b></p>" +
      '<label class="pix-l" for="pix-cc">Pix copia e cola</label><textarea id="pix-cc" class="pix-cc" readonly rows="3">' + esc(PX.copiaecola) + '</textarea><div class="row" style="gap:8px"><button type="button" class="btn sm" data-copiar="' + esc(PX.copiaecola) + '">Copiar código Pix</button></div>' +
      '<div class="pxa-wait"><span class="pxa-sp"></span><span><b>Aguardando o pagamento…</b><small>A confirmação é automática. Pode deixar esta tela aberta. Expira em <b data-pxa-t>30:00</b>.</small></span></div></div></div>';
  }
  function redesenhaPix() { var el = document.querySelector("[data-pxa] .pg-fc"); if (el && PED) el.innerHTML = pixAutoHtml(); }
  function acompanha() {
    clearInterval(pxT);
    pxT = setInterval(function () {
      if (!PX || PX.status !== "pendente") { clearInterval(pxT); return; }
      var t = document.querySelector("[data-pxa-t]"), rest = Math.max(0, Math.round((new Date(PX.expira).getTime() - Date.now()) / 1000));
      if (t) t.textContent = String(Math.floor(rest / 60)).padStart(2, "0") + ":" + String(rest % 60).padStart(2, "0");
      if (!document.querySelector("[data-pxa]")) { clearInterval(pxT); return; }
      if ((PX.n = (PX.n || 0) + 1) % 4) return;   /* consulta a cada 4 s */
      Store.api("pix_status", null, "&id=" + encodeURIComponent(PX.id)).then(function (j) {
        if (!PX || j.status === PX.status) return;
        PX.status = j.status; redesenhaPix();
        if (j.status === "aprovado") { clearInterval(pxT); G.toast(PED && PED.plano === "clube" ? "Pagamento confirmado! Bem-vindo ao Clube CoraçãoBR." : PED && PED.plano === "mural" ? "Pagamento confirmado! Publicação em destaque." : "Pagamento confirmado! Seus anúncios estão no ar."); Store.sincronizarAgora().then(function () { setTimeout(function () { PX = null; location.hash = (PED && PED.volta) || "anunciante"; }, 2200); }); }
      }).catch(function () { /* tenta de novo no próximo ciclo */ });
    }, 1000);
  }
  document.addEventListener("click", function (e) {
    var b = e.target.closest("[data-pxa-gerar]");
    if (e.target.closest("[data-pxa-novo]")) { PX = null; redesenhaPix(); return; }
    if (!b) return;
    b.disabled = true; b.textContent = "Gerando Pix…";
    Store.api("pix_criar", { plano: PED.plano, qtd: PED.qtd, comeca: PED.comeca, lugarId: PED.lugarId || "", itemId: PED.itemId || "" }).then(function (j) {
      PX = { chave: b.dataset.chave, id: j.id, valor: j.valor, qr: j.qr, copiaecola: j.copiaecola, expira: j.expira, status: "pendente" }; redesenhaPix(); acompanha();
    }).catch(function (er) { b.disabled = false; b.textContent = "Tentar de novo"; G.toast(er.message || "Não foi possível gerar o Pix agora."); });
  });

  /* ---------- bloco resumido (painel do anunciante) ---------- */
  function blocoPainel(uid) {
    var e = estado(uid), pend = informados(uid), usados = anunciosDe(uid).length;
    return '<div class="dk-card dk-flat pg-mini pg-' + e.fase + '"><div class="dk-ch"><h3>Seu plano</h3><span class="pill ' + (noAr(e.fase) ? "ok" : "warn") + '">' + (noAr(e.fase) ? "No ar" : e.fase === "ativando" ? "Ativando" : "Fora do ar") + "</span></div>" +
      "<p>" + esc(e.txt) + "</p>" + (pend.length ? '<p class="small muted">Pagamento informado em ' + br(pend[0].criadoEm) + ", aguardando confirmação da equipe.</p>" : "") +
      '<dl class="kv"><dt>Anúncios</dt><dd>' + usados + " criados · " + e.vagas + " liberados</dd><dt>Valor</dt><dd>" + reais(preco()) + " a cada " + porPacote() + " anúncios por mês</dd></dl>" +
      '<a class="btn' + (noAr(e.fase) ? " ghost" : "") + ' sm" href="#pagar">' + (noAr(e.fase) ? "Contratar mais anúncios" : "Contratar agora") + "</a></div>";
  }
  /* aviso de prévia na página do anúncio para o dono */
  function avisoPrevia(l) {
    if (!l._dono || visivel(l)) return "";
    var dono = Store.uid() === l._dono || Store.admin(); if (!dono) return "";
    var n = vagas(l._dono);
    return '<div class="pg-pv">' + ic("bell") + "<div><b>Prévia do seu anúncio</b><span>" + (n ? "Seu plano libera " + n + (n === 1 ? " anúncio" : " anúncios") + " e este passou do limite. Contrate mais um pacote para ele aparecer." : esc(estado(l._dono).txt) + ". O público só vê este anúncio depois da confirmação do pagamento.") + "</span></div>" + (Store.uid() === l._dono ? '<a class="btn sm" href="#pagar">Contratar</a>' : "") + "</div>";
  }

  /* ---------- aba do master ---------- */
  function abaMaster(el) {
    var contas = {}, c = cfg(), p = c.pagamentos || {};
    Store.lista("lugares").forEach(function (l) { if (l._dono) (contas[l._dono] = contas[l._dono] || []).push(l); });
    Store.lista("pagamentos").forEach(function (d) { if (d && d.id && !contas[d.id]) contas[d.id] = []; });
    var pend = informados();
    var linhaConta = function (uid) {
      var ls = contas[uid] || [], e = estado(uid), d = doc(uid) || {};
      return '<div class="pgm-c" data-uid="' + esc(uid) + '"><div class="pgm-t"><b>' + esc(ls.map(function (l) { return l.nome; }).join(" · ") || uid) + '</b><small>' + esc(e.txt) + " · " + ls.length + " criados</small></div>" +
        '<span class="pill ' + (noAr(e.fase) ? "ok" : "warn") + '">' + (noAr(e.fase) ? e.vagas + " no ar" : e.fase === "ativando" ? "Ativando" : "Fora do ar") + "</span>" +
        '<div class="pgm-a"><span class="pgm-qtd">Pacotes <input type="number" min="1" max="30" value="1" data-pgm-n></span><button type="button" class="btn sm" data-pgm-conf>+ Pacote pago</button>' + (window.Promo ? '<button type="button" class="btn ghost sm" data-pgm-promo>+ Promoção de curadoria</button>' : "") + '<button type="button" class="btn ghost sm" data-pgm-cort>Aprovar sem pagamento</button>' + (verificado(uid) ? '<span class="pill ok">✓ Verificado</span>' : '<button type="button" class="btn ghost sm" data-pgm-selo>Conceder selo</button>') + '' + (d.status !== "suspenso" ? '<button type="button" class="btn danger sm" data-pgm-susp>Suspender</button>' : '<button type="button" class="btn ghost sm" data-pgm-reat>Reativar</button>') + "</div>" +
        '<div class="pgm-cort" hidden><label class="small">Aprovado até <input type="date" data-pgm-ate value="' + somaDias(hoje(), 30) + '" min="' + hoje() + '"></label><label class="small">Anúncios <input type="number" min="1" max="60" value="' + porPacote() + '" data-pgm-vagas></label><input data-pgm-nota maxlength="120" placeholder="Motivo (opcional)"><button type="button" class="btn sm" data-pgm-cort-ok>Aprovar</button></div>' +
        '<details class="pgm-hist"><summary>Pacotes desta conta</summary>' + linhaDoTempo(uid) + "</details></div>";
    };
    el.innerHTML = '<div class="stack">' +
      '<div class="panel stack" style="gap:12px"><h3>Pagamentos informados' + (pend.length ? " (" + pend.length + ")" : "") + "</h3>" +
      (function () { var fila = Store.lista("pagamentos").filter(function (d) { return d.verificacao && d.verificacao.status === "analise"; }); return fila.length ? '<div class="panel stack" style="gap:12px"><h3>Selo Verificado · em análise (' + fila.length + ")</h3>" + fila.map(function (d) { var ls = contas[d.id] || []; return '<div class="pgm-c"><div class="pgm-t"><b>' + esc(ls.map(function (l) { return l.nome; }).join(" · ") || d.id) + "</b><small>Pago em " + diaLocal(d.verificacao.pagoEm || "") + " · confira nome, contato e endereço dos anúncios</small>" + ls.map(function (l) { return '<a class="small" href="#lugar-' + esc(l.id) + '">ver ' + esc(l.nome) + "</a>"; }).join(" ") + '</div><div class="pgm-a"><button type="button" class="btn sm" data-vf="aprovado" data-uid="' + esc(d.id) + '">Aprovar selo</button><button type="button" class="btn ghost sm" data-vf="recusado" data-uid="' + esc(d.id) + '">Recusar</button></div></div>'; }).join("") + "</div>" : ""; })() + '<div class="panel stack" style="gap:12px"><h3>Pagamentos informados · lista</h3>' +
      (pend.length ? pend.map(function (a) { return '<div class="pgm-c"><div class="pgm-t"><b>' + esc(a.nome || a.uid) + " · " + esc((a.metodo || "").toUpperCase()) + " · " + reais(a.valor || 0) + " · " + (a.plano === "clube" ? "Clube CoraçãoBR (1 mês)" : a.plano === "mural" ? "destaque no Mural" : a.plano === "verificado" ? "selo Verificado" : a.plano === "impulso" ? "impulso" : a.plano === "promo" ? "promoção de curadoria" : (a.qtd || 1) + (Number(a.qtd) > 1 ? " pacotes" : " pacote") + " (" + (Number(a.qtd || 1) * porPacote()) + " anúncios)" + (a.comeca === "renovar" ? " · renovação" : "")) + "</b><small>" + br(a.criadoEm) + " · ref.: " + esc(a.ref || "—") + "</small>" + (a.comprovante ? '<a class="small" href="' + esc(Store.urlFoto(a.comprovante)) + '" target="_blank" rel="noopener">ver comprovante</a>' : "") + '</div><div class="pgm-a"><button type="button" class="btn sm" data-pgm-ok="' + esc(a.id) + '" data-uid="' + esc(a.uid) + '">Confirmar</button><button type="button" class="btn ghost sm" data-pgm-no="' + esc(a.id) + '">Recusar</button></div></div>'; }).join("") : '<p class="muted small">Nenhum pagamento aguardando confirmação.</p>') + "</div>" +
      '<div class="panel stack" style="gap:12px"><h3>Contas de anunciantes</h3><p class="small muted">Cada pacote pago libera ' + porPacote() + " anúncios por 1 mês e entra no ar 1 hora depois da confirmação. Pacotes somam. Tolerância de " + TOLERANCIA + " dias depois do término.</p>" +
      (Object.keys(contas).length ? Object.keys(contas).map(linhaConta).join("") : '<p class="muted small">Nenhuma conta de anunciante ainda.</p>') + "</div>" +
      (Store.servidor && Store.servidor() ? '<div class="panel stack" style="gap:12px" id="pgm-mp"><h3>Pix automático (Mercado Pago)</h3><p class="small muted">Com o Pix automático, cada compra gera uma cobrança Pix com QR Code. Quando o pagamento cai, o pacote é liberado na hora, sem confirmação manual, e o anunciante recebe e-mail. Sem ele, vale o Pix pela chave e a confirmação manual acima.</p><p data-mp-st class="small">Verificando…</p>' +
        '<form class="row" style="gap:8px" data-mp-form><input type="password" name="token" autocomplete="off" placeholder="Access Token de produção (APP_USR-…)" style="flex:1;min-width:220px;padding:10px 12px;border:1px solid var(--line);border-radius:12px;background:var(--surface);color:var(--ink)"><button class="btn sm" type="submit">Salvar e testar</button><button class="btn ghost sm" type="button" data-mp-off>Desligar</button></form>' +
        '<details class="small"><summary>Como pegar o Access Token</summary><ol class="passos"><li>Entre em mercadopago.com.br/developers com a conta do CNPJ 32.021.268/0001-04.</li><li>Suas integrações → Criar aplicação (pagamentos online, Pix).</li><li>Credenciais de produção → copie o <b>Access Token</b> (começa com APP_USR-) e cole aqui.</li><li>Em Webhooks, cadastre o endereço mostrado acima, evento <b>Pagamentos</b>.</li></ol><p>O token fica guardado só no servidor, nunca aparece no site.</p></details></div>' : "") +
      '<form class="panel stack" style="gap:12px" id="pgm-cfg"><h3>Preços (em reais) e formas de pagamento</h3><div class="form2">' +
      campo("pc-p", "Valor do pacote (R$)", preco(), 'type="number" min="0" step="0.01"') + campo("pc-n", "Anúncios por pacote", porPacote(), 'type="number" min="1" max="20"') +
      campo("pc-pv", "Promoção de curadoria · valor (R$)", promoCfg().preco, 'type="number" min="0" step="0.01"') + campo("pc-pc", "Promoção · depoimentos incluídos", promoCfg().curadorias, 'type="number" min="1" max="20"') +
      campo("pc-vf", "Selo Verificado · valor (R$)", precoSelo(), 'type="number" min="0" step="0.01"') + campo("pc-im", "Impulsionar · valor (R$)", precoImpulso(), 'type="number" min="0" step="0.01"') + campo("pc-imd", "Impulsionar · dias", diasImpulso(), 'type="number" min="1" max="60"') + campo("pc-pi", "Promoção · início", (c.promo || {}).inicio || promoCfg().inicio, 'type="date"') + campo("pc-pf", "Promoção · fim", (c.promo || {}).fim || promoCfg().fim, 'type="date"') + "</div>" +
      '<p class="small muted">Todos os pagamentos são por Pix. O site gera o QR Code e o Pix copia e cola com o valor de cada compra.</p><div class="form2">' + campo("pc-pix", "Chave Pix (CNPJ)", p.pix || "32.021.268/0001-04") + campo("pc-pixn", "Favorecido (como aparece no banco)", p.pixNome || "Danilo Araujo Santos Desenvolvedor") + campo("pc-pixc", "Cidade do favorecido (no QR Code)", p.pixCidade || "BRASIL") + "</div>" +
      '<button class="btn" type="submit" style="justify-self:start">Salvar</button></form></div>';
    el.onclick = function (ev) {
      var b, box = ev.target.closest(".pgm-c"), uid = box && box.dataset.uid;
      if ((b = ev.target.closest("[data-pgm-ok]"))) { var av = Store.obter("avisos", b.dataset.pgmOk); if (!av) return; novoPacote(av.uid, { tipo: av.plano, qtd: Number(av.qtd) || 1, comeca: av.comeca, lugarId: av.lugarAlvo, itemId: av.itemId, valor: av.valor, nome: av.nome }, av); return; }
      if ((b = ev.target.closest("[data-vf]"))) { var vu = b.dataset.uid, vv = Object.assign({}, verificacao(vu) || {}); vv.status = b.dataset.vf; vv.revisadoEm = new Date().toISOString(); if (b.dataset.vf === "recusado") vv.nota = (prompt("Motivo (aparece para o anunciante):") || "").slice(0, 160); grava(vu, { verificacao: vv }, b.dataset.vf === "aprovado" ? "Selo Verificado aprovado." : "Verificação recusada."); return; }
      if ((b = ev.target.closest("[data-pgm-no]"))) { var a = Store.obter("avisos", b.dataset.pgmNo); if (a) Store.gravar("avisos", a.id, Object.assign({}, a, { recusado: true, lido: true })).then(function () { abaMaster(el); }); return; }
      if (!uid) return;
      if (ev.target.closest("[data-pgm-conf]")) { novoPacote(uid, { qtd: Math.max(1, Number(box.querySelector("[data-pgm-n]").value) || 1), comeca: "agora" }, null); return; }
      if (ev.target.closest("[data-pgm-promo]")) { novoPacote(uid, { tipo: "promo" }, null); return; }
      if (ev.target.closest("[data-pgm-selo]")) { grava(uid, { verificacao: Object.assign({}, verificacao(uid) || {}, { status: "aprovado", revisadoEm: new Date().toISOString(), cortesia: true }) }, "Selo Verificado concedido."); return; }
      if (ev.target.closest("[data-pgm-cort]")) { box.querySelector(".pgm-cort").hidden = false; return; }
      if (ev.target.closest("[data-pgm-cort-ok]")) { var ate = box.querySelector("[data-pgm-ate]").value; if (!ate) { G.toast("Escolha a data de expiração."); return; } grava(uid, { status: "cortesia", cortesiaAte: ate, cortesiaVagas: Math.max(1, Number(box.querySelector("[data-pgm-vagas]").value) || porPacote()), nota: box.querySelector("[data-pgm-nota]").value.trim() }, "Aprovado até " + br(ate) + "."); return; }
      if (ev.target.closest("[data-pgm-reat]")) { grava(uid, { status: "ativo" }, "Conta reativada."); return; }
      if ((b = ev.target.closest("[data-pgm-susp]"))) { if (!b.dataset.ok) { b.dataset.ok = 1; b.textContent = "Confirmar suspensão"; return; } grava(uid, { status: "suspenso" }, "Conta suspensa."); }
    };
    var mp = $("#pgm-mp", el);
    if (mp) {
      var info = function () { Store.api("pix_info").then(function (j) { $("[data-mp-st]", mp).innerHTML = (j.ligado ? '<span class="pill ok">Ligado</span> Pagamentos Pix são confirmados sozinhos.' : '<span class="pill warn">Desligado</span> Cole o Access Token para ligar.') + '<br>Endereço do aviso (webhook): <code style="user-select:all">' + esc(j.webhook) + "</code>"; }).catch(function () { $("[data-mp-st]", mp).textContent = "Não foi possível consultar."; }); };
      info();
      $("[data-mp-form]", mp).onsubmit = function (ev) { ev.preventDefault(); var t = this.token.value.trim(); if (!t) return; Store.api("pix_token", { token: t }).then(function (j) { G.toast(j.msg); mp.querySelector("[name=token]").value = ""; if (Store.estado.sessao) Store.estado.sessao.pixAuto = true; info(); }).catch(function (er) { G.toast(er.message); }); };
      $("[data-mp-off]", mp).onclick = function () { Store.api("pix_token", { token: "" }).then(function (j) { G.toast(j.msg); if (Store.estado.sessao) Store.estado.sessao.pixAuto = false; info(); }); };
    }
    $("#pgm-cfg", el).onsubmit = function (ev) {
      ev.preventDefault(); var v = function (id) { return $("#" + id, el).value.trim(); }, pg = Object.assign({}, cfg().pagamentos || {});
      pg.pix = v("pc-pix") || "32.021.268/0001-04"; pg.pixNome = v("pc-pixn") || "Danilo Araujo Santos Desenvolvedor"; pg.pixCidade = v("pc-pixc") || "BRASIL";
      var novo = Object.assign({}, cfg(), { moedaAnuncio: "BRL", precoAnuncio: Number(v("pc-p")) || 50, anunciosPorPacote: Math.max(1, Number(v("pc-n")) || 3), precoVerificado: Number(v("pc-vf")) || 30, precoImpulso: Number(v("pc-im")) || 25, diasImpulso: Math.max(1, Number(v("pc-imd")) || 7), precoFuturo: 0, precoFuturoEm: "", promo: Object.assign({}, cfg().promo || {}, { inicio: v("pc-pi"), fim: v("pc-pf"), preco: Number(v("pc-pv")) || 20, anuncios: 1, curadorias: Math.max(1, Number(v("pc-pc")) || 5) }), pagamentos: pg });
      delete novo.id; Store.gravar("config", "geral", novo).then(function () { G.toast("Preços e formas de pagamento salvos."); }).catch(function (er) { G.toast(er.message || "Não foi possível salvar."); });
    };
    function grava(uid, extra, msg) {
      var d = Object.assign({}, doc(uid) || {}, extra, { atualizadoEm: new Date().toISOString() }); delete d.id; delete d._dono;
      return Store.gravar("pagamentos", uid, d).then(function () { G.toast(msg); abaMaster(el); }).catch(function (er) { G.toast(er.message || "Não foi possível salvar."); });
    }
    /* cria o pacote confirmado: agora (soma vagas) ou depois do plano atual (renovação) */
    function novoPacote(uid, o, aviso) {
      if (o.tipo === "verificado") { grava(uid, { verificacao: { status: "analise", pagoEm: new Date().toISOString(), valor: precoSelo(), aviso: aviso ? aviso.id : "" } }, "Pagamento do selo confirmado. Agora é só conferir o negócio e aprovar."); if (aviso) Store.gravar("avisos", aviso.id, Object.assign({}, aviso, { confirmado: true, lido: true })); return; }
      if (o.tipo === "clube" || o.tipo === "mural") {
        var dc = doc(uid) || {}, agoraI = new Date().toISOString(), base = { valor: Number(o.valor) || (o.tipo === "clube" ? Number(cfg().precoClube) || 15 : Number(cfg().precoMural) || 10), pagoEm: agoraI, aviso: aviso ? aviso.id : "", metodo: aviso ? aviso.metodo || "" : "equipe" };
        if (o.tipo === "clube") {
          var cl = dc.clube || {}, iniC = cl.ate && cl.ate >= hoje() ? somaDias(cl.ate, 1) : hoje(), pc = Object.assign({ id: "cl" + Date.now().toString(36), inicio: iniC, fim: maisUmMes(iniC) }, base);
          grava(uid, { clubePag: (dc.clubePag || []).concat([pc]).slice(-60), clube: { desde: cl.desde || hoje(), ate: pc.fim, nome: cl.nome || o.nome || "", numero: cl.numero || "" } }, "Clube confirmado até " + br(pc.fim) + ".");
        } else {
          var jaM = (dc.mural || []).filter(function (m) { return m.itemId === o.itemId && m.fim >= hoje(); }).reduce(function (m, x) { return x.fim > m ? x.fim : m; }, ""), iniM = jaM ? somaDias(jaM, 1) : hoje(), dm = Math.max(1, Number(cfg().diasMural) || 30);
          grava(uid, { mural: (dc.mural || []).concat([Object.assign({ id: "mu" + Date.now().toString(36), itemId: o.itemId || "", inicio: iniM, fim: somaDias(iniM, dm - 1) }, base)]).slice(-60) }, "Destaque no Mural confirmado.");
        }
        if (aviso) Store.gravar("avisos", aviso.id, Object.assign({}, aviso, { confirmado: true, lido: true })); return;
      }
      if (o.tipo === "impulso") {
        var d0 = doc(uid) || {}, l0 = (Array.isArray(d0.pacotes) ? d0.pacotes : pacotes(uid).map(function (x) { var y = Object.assign({}, x); delete y.antigo; return y; })).slice(), ja = impulsos(uid).filter(function (pk) { return pk.lugarId === o.lugarId && pk.fim >= hoje(); }).reduce(function (m, pk) { return pk.fim > m ? pk.fim : m; }, "");
        var ini0 = ja ? somaDias(ja, 1) : hoje(), pki = { id: "im" + Date.now().toString(36), tipo: "impulso", lugarId: o.lugarId || "", qtd: 1, anuncios: 0, valor: precoImpulso(), moeda: "BRL", pagoEm: new Date().toISOString(), inicio: ini0, fim: somaDias(ini0, diasImpulso() - 1), ativaEm: "", aviso: aviso ? aviso.id : "", metodo: aviso ? aviso.metodo || "" : "equipe" };
        l0.push(pki); grava(uid, { pacotes: l0.slice(-120) }, "Impulso confirmado de " + br(pki.inicio) + " a " + br(pki.fim) + ".");
        if (aviso) Store.gravar("avisos", aviso.id, Object.assign({}, aviso, { confirmado: true, lido: true })); return;
      }
      var d = doc(uid) || {}, lista = pacotes(uid).filter(function (x) { return !x.antigo; }), agora = new Date(), pc = promoCfg();
      if (!Array.isArray(d.pacotes)) lista = pacotes(uid).map(function (x) { return Object.assign({}, x, { antigo: undefined }); });
      var promo = o.tipo === "promo", qtd = promo ? 1 : Math.max(1, Number(o.qtd) || 1);
      var ini = o.comeca === "renovar" && fimAtual(uid) ? somaDias(fimAtual(uid), 1) : hoje();
      var usaDesc = !promo && creditosIndicacao(uid) > 0 && (!aviso || Number(aviso.valor) < qtd * preco());
      var pk = { id: "pk" + Date.now().toString(36), tipo: promo ? "promo" : "pacote", qtd: qtd, anuncios: promo ? Number(pc.anuncios) || 1 : qtd * porPacote(), curadorias: promo ? Number(pc.curadorias) || 5 : 0, valor: promo ? Number(pc.preco) : qtd * preco() - (usaDesc ? preco() / 2 : 0), desconto: usaDesc ? preco() / 2 : 0, moeda: "BRL", pagoEm: agora.toISOString(), inicio: ini, fim: maisUmMes(ini), ativaEm: ini === hoje() ? new Date(agora.getTime() + ATIVA_EM_MIN * 60000).toISOString() : ini + "T00:00:00", aviso: aviso ? aviso.id : "", metodo: aviso ? aviso.metodo || "" : "equipe" };
      lista.push(pk);
      var extra = { pacotes: lista.slice(-120), status: d.status === "suspenso" ? "suspenso" : "ativo" };
      if (promo) extra.curadorias = (Number(d.curadorias) || 0) + pk.curadorias;
      if (usaDesc) extra.creditosIndicacao = creditosIndicacao(uid) - 1;
      grava(uid, extra, (promo ? "Promoção confirmada: 1 anúncio + " + pk.curadorias + " depoimentos" : qtd + (qtd === 1 ? " pacote confirmado" : " pacotes confirmados") + ": " + pk.anuncios + " anúncios") + " de " + br(pk.inicio) + " a " + br(pk.fim) + (ini === hoje() ? "; entra no ar em 1 hora." : "."));
      if (aviso) Store.gravar("avisos", aviso.id, Object.assign({}, aviso, { confirmado: true, lido: true }));
    }
  }
  function campo(id, rot, val, extra) { return '<div class="field"><label for="' + id + '">' + rot + '</label><input id="' + id + '" value="' + esc(val == null ? "" : val) + '" ' + (extra || "") + "></div>"; }

  function checkout(ped) { PED = ped; return pagamentoHtml(Store.uid()); }
  G.views.extra = viewExtra;
  G.views.pagar = function () { viewPagar(false); }; G.views["pagar-promo"] = function () { viewPagar(true); };
  window.Pag = { checkout: checkout, creditosIndicacao: creditosIndicacao, precoSelo: precoSelo, precoImpulso: precoImpulso, diasImpulso: diasImpulso, verificacao: verificacao, verificado: verificado, selo: selo, impulsos: impulsos, impulsionado: impulsionado, preco: preco, porPacote: porPacote, promocional: promocional, chamada: chamada, estado: estado, vagas: vagas, banners: banners, pacotes: pacotes, situacao: situacao, fimAtual: fimAtual, anunciosDe: anunciosDe, visivel: visivel, noAr: noAr, blocoPainel: blocoPainel, calculadora: calculadora, linhaDoTempo: linhaDoTempo, avisoPrevia: avisoPrevia, abaMaster: abaMaster, formas: formas, informados: informados };
})();
