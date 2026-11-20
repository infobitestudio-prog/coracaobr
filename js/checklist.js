/* Meu roteiro: curtidos (coração) e checklist de passeios (check verde).
   A pessoa curte e/ou coloca no checklist; quando visita, dá o CHECK e avalia com estrelas e depoimento.
   Dados no aparelho (localStorage "lista" = curtidos, "checklist" = [{id, feito, em, estrelas, aval}]) e
   sincronizados com a conta pelo usuario.js. A avaliação vai para a coleção "avaliacoes", como na página do lugar. */
(function () {
  "use strict";
  var G = window.Guia; if (!G) return;
  var esc = G.esc, $ = function (s, r) { return (r || document).querySelector(s); };
  var CORACAO = '<svg class="i" viewBox="0 0 24 24" aria-hidden="true"><path d="M12 20s-7-4.4-7-10a4 4 0 0 1 7-2.5A4 4 0 0 1 19 10c0 5.6-7 10-7 10z"/></svg>';
  var CHECK = '<svg class="i" viewBox="0 0 24 24" aria-hidden="true"><path d="M4.5 12.5l4.5 4.5L19.5 6.5"/></svg>';
  var LISTA = '<svg class="i" viewBox="0 0 24 24" aria-hidden="true"><path d="M9 6h11M9 12h11M9 18h11M4 6l1 1 2-2M4 12l1 1 2-2M4 18l1 1 2-2"/></svg>';

  function ler(k) { try { var v = JSON.parse(localStorage.getItem(k) || "[]"); return Array.isArray(v) ? v : []; } catch (e) { return []; } }
  function grava(k, v) { try { localStorage.setItem(k, JSON.stringify(v)); } catch (e) { G.toast("Este navegador não deixou salvar."); } }
  function curtidos() { return ler("lista").filter(function (x, i, a) { return a.indexOf(x) === i; }); }
  /* sem repetidos: a sincronização entre aparelhos pode juntar cópias do mesmo lugar; fica a mais completa */
  function itens() {
    var por = {}, ordem = [];
    ler("checklist").forEach(function (x) {
      if (!x || !x.id) return;
      var a = por[x.id];
      if (!a) { por[x.id] = x; ordem.push(x.id); return; }
      var pontos = function (y) { return (y.aval ? 4 : 0) + (y.estrelas ? 2 : 0) + (y.feito ? 1 : 0); };
      if (pontos(x) > pontos(a) || (pontos(x) === pontos(a) && String(x.visitadoEm || x.em || "") > String(a.visitadoEm || a.em || ""))) por[x.id] = x;
    });
    return ordem.map(function (id) { return por[id]; });
  }
  function item(id) { return itens().filter(function (x) { return x.id === id; })[0] || null; }
  function salvaItem(id, dados) {
    var a = itens(), i = a.map(function (x) { return x.id; }).indexOf(id); /* regrava já sem repetidos */
    if (dados === null) { if (i >= 0) a.splice(i, 1); }
    else if (i >= 0) a[i] = Object.assign({}, a[i], dados); else a.push(Object.assign({ id: id, feito: false, em: new Date().toISOString() }, dados));
    grava("checklist", a);
  }
  function curtido(id) { return curtidos().indexOf(id) >= 0; }
  function noCheck(id) { return !!item(id); }

  /* botões grandes da página do lugar */
  function botoes(l) {
    var c = curtido(l.id), it = item(l.id);
    return '<div class="ck-bts" data-ck-lugar="' + esc(l.id) + '">' +
      '<button type="button" class="ck-bt ck-like" data-fav="' + esc(l.id) + '" aria-pressed="' + c + '"><span class="ck-ic">' + CORACAO + '</span><span class="ck-tx"><b>' + (c ? "Curtido" : "Curtir") + "</b><small>" + (c ? "está nos seus favoritos" : "salvar nos favoritos") + "</small></span></button>" +
      '<button type="button" class="ck-bt ck-chk" data-chk="' + esc(l.id) + '" aria-pressed="' + !!it + '"' + (it && it.feito ? ' data-feito="1"' : "") + '><span class="ck-ic">' + CHECK + '</span><span class="ck-tx"><b>' + (it ? (it.feito ? "Visitado" : "No checklist") : "Checklist") + "</b><small>" + (it ? (it.feito ? (it.estrelas ? "★".repeat(it.estrelas) + " avaliado" : "toque para avaliar") : "toque em ✓ quando visitar") : "quero visitar") + "</small></span></button></div>";
  }
  function atualizaBotoes(id) {
    var l = Store.obter("lugares", id); if (!l) return;
    document.querySelectorAll('[data-ck-lugar="' + id + '"]').forEach(function (el) { el.outerHTML = botoes(l); });
    document.querySelectorAll('.round.fav[data-fav="' + id + '"]').forEach(function (b) { b.setAttribute("aria-pressed", curtido(id)); });
    var p = $("#ck-painel"); if (p) p.outerHTML = painel(p.dataset.aba);
  }

  document.addEventListener("click", function (e) {
    var f = e.target.closest("[data-fav]");
    if (f) setTimeout(function () { atualizaBotoes(f.dataset.fav); }, 0); /* o extras.js grava; aqui só redesenha */
    var c = e.target.closest("[data-chk]");
    if (c) {
      var id = c.dataset.chk, it = item(id);
      if (!it) { salvaItem(id, {}); G.toast("Adicionado ao checklist. Quando visitar, dê o check ✓."); atualizaBotoes(id); }
      else if (!it.feito) avaliar(id, true);
      else avaliar(id, false);
      return;
    }
    var v = e.target.closest("[data-ck-feito]"); if (v) { avaliar(v.dataset.ckFeito, true); return; }
    var d = e.target.closest("[data-ck-desfaz]"); if (d) { salvaItem(d.dataset.ckDesfaz, { feito: false }); atualizaBotoes(d.dataset.ckDesfaz); return; }
    var r = e.target.closest("[data-ck-tira]"); if (r) { salvaItem(r.dataset.ckTira, null); G.toast("Removido do checklist."); atualizaBotoes(r.dataset.ckTira); return; }
    var p = e.target.closest("[data-ck-poe]"); if (p) { salvaItem(p.dataset.ckPoe, {}); G.toast("Adicionado ao checklist."); atualizaBotoes(p.dataset.ckPoe); return; }
    var a = e.target.closest("[data-ck-aba]"); if (a) { var pn = $("#ck-painel"); if (pn) pn.outerHTML = painel(a.dataset.ckAba); return; }
  });

  /* ---------- check + avaliação (estrelas e depoimento) ---------- */
  function avaliar(id, marcar) {
    var l = Store.obter("lugares", id); if (!l) return;
    if (marcar) { salvaItem(id, { feito: true, visitadoEm: new Date().toISOString() }); atualizaBotoes(id); }
    var it = item(id) || {}, nome = ""; try { nome = JSON.parse(localStorage.getItem("meu-nome") || '""') || Store.nome() || ""; } catch (er) { nome = ""; }
    var cx = document.createElement("div"); cx.className = "ck-modal"; cx.setAttribute("role", "dialog"); cx.setAttribute("aria-modal", "true"); cx.setAttribute("aria-label", "Avaliar " + l.nome);
    var est = it.estrelas || 0;
    cx.innerHTML = '<div class="ck-box"><button type="button" class="ck-x" data-ck-fecha aria-label="Fechar">×</button>' +
      '<div class="ck-head"><span class="ck-ok">' + CHECK + "</span><div><small>" + (marcar ? "Visitado! Como foi?" : "Sua visita") + "</small><b>" + esc(l.nome) + "</b></div></div>" +
      '<form class="ck-form"><p class="ck-lb">Como foi?</p><div class="ck-stars rx-pick" role="radiogroup" aria-label="Sua reação">' + (window.Reacoes ? Reacoes.botoes(est, function (n) { return ' data-n="' + n + '"'; }) : [1, 2, 3, 4, 5].map(function (n) { return '<button type="button" role="radio" data-n="' + n + '" aria-checked="' + (n === est) + '" aria-label="' + n + (n > 1 ? " estrelas" : " estrela") + '"' + (n <= est ? ' class="on"' : "") + ">★</button>"; }).join("")) + "</div>" +
      '<label class="ck-lb" for="ck-txt">Depoimento</label><textarea id="ck-txt" maxlength="800" rows="4" placeholder="Conte como foi: o que gostou, dicas para quem vai, se vale a pena…"></textarea>' +
      '<label class="ck-lb" for="ck-nome">Seu nome</label><input id="ck-nome" maxlength="40" value="' + esc(nome) + '" placeholder="Como aparece na avaliação">' +
      '<div class="ck-acts"><button type="button" class="btn ghost" data-ck-fecha>' + (it.aval ? "Fechar" : "Avaliar depois") + "</button>" + (Store.uid && Store.uid() ? '<button type="submit" class="btn">' + (it.aval ? "Publicar nova avaliação" : "Publicar avaliação") + "</button>" : '<a class="btn" href="#entrar" data-ck-entrar>Entrar para publicar</a>') + "</div>" +
      (Store.uid && Store.uid() ? "" : '<p class="ck-nota"><b>O check já ficou salvo.</b> Para publicar estrelas e depoimento, entre na sua conta (é grátis) e volte aqui.</p>') +
      (it.aval ? '<p class="ck-nota">Você já avaliou este lugar com ' + (window.Reacoes ? Reacoes.selo(it.estrelas, { individual: true, nome: true }) : "★".repeat(it.estrelas || 0)) + ". Uma nova avaliação fica junto da anterior.</p>" : '<p class="ck-nota">A avaliação aparece na página do lugar, com o seu nome.</p>') + "</form></div>";
    document.body.appendChild(cx); requestAnimationFrame(function () { cx.classList.add("on"); });
    var fecha = function () { cx.classList.remove("on"); setTimeout(function () { cx.remove(); }, 220); document.removeEventListener("keydown", tecla); };
    var tecla = function (ev) { if (ev.key === "Escape") fecha(); };
    document.addEventListener("keydown", tecla);
    window.addEventListener("hashchange", fecha, { once: true });
    cx.addEventListener("click", function (ev) {
      if (ev.target === cx || ev.target.closest("[data-ck-fecha]")) { fecha(); return; }
      if (ev.target.closest("[data-ck-entrar]")) { try { sessionStorage.setItem("depois-login", "#lugar-" + id); } catch (er) { /* ok */ } return; }
      var s = ev.target.closest("[data-n]"); if (!s) return;
      est = Number(s.dataset.n); cx.querySelectorAll("[data-n]").forEach(function (b) { var n = Number(b.dataset.n); b.classList.toggle("on", window.Reacoes ? n === est : n <= est); b.setAttribute("aria-checked", n === est); });
    });
    setTimeout(function () { var t = $("#ck-txt"); if (t && matchMedia("(min-width:760px)").matches) t.focus(); }, 60);
    $(".ck-form", cx).onsubmit = function (ev) {
      ev.preventDefault();
      if (!est) { G.toast("Escolha de 1 a 5 estrelas."); return; }
      var nm = $("#ck-nome", cx).value.trim().slice(0, 40), tx = $("#ck-txt", cx).value.trim();
      var doc = { lugarId: id, estrelas: est, nome: nm || "Visitante", texto: tx, criadoEm: new Date().toISOString(), uid: Store.uid() || "" };
      var nid = Store.novoId("av"), bt = $("button[type=submit]", cx); bt.disabled = true;
      try { if (nm) localStorage.setItem("meu-nome", JSON.stringify(nm)); } catch (er) { /* ok */ }
      Store.gravar("avaliacoes", nid, doc).then(function () {
        if (window.Usuario) Usuario.registraAval(nid);
        salvaItem(id, { feito: true, estrelas: est, aval: nid }); atualizaBotoes(id); fecha(); G.toast("Obrigado! Avaliação publicada.");
      }).catch(function (er) { bt.disabled = false; G.toast(er && er.message && !er.code ? er.message : "Não deu para publicar agora. Tente de novo."); });
    };
  }

  /* ---------- painel "Meu roteiro" (página #lista e painel do usuário) ---------- */
  function linha(l, it) {
    var f = G.foto(l), feito = it && it.feito;
    return '<div class="ck-row' + (feito ? " feito" : "") + '">' +
      (it ? (feito ? '<button type="button" class="ck-box-ok on" data-ck-desfaz="' + esc(l.id) + '" aria-label="Desmarcar visita">' + CHECK + "</button>" : '<button type="button" class="ck-box-ok" data-ck-feito="' + esc(l.id) + '" aria-label="Marcar como visitado">' + CHECK + "</button>") : '<button type="button" class="ck-box-ok add" data-ck-poe="' + esc(l.id) + '" aria-label="Pôr no checklist">+</button>') +
      '<a class="ck-th" href="#lugar-' + esc(l.id) + '">' + (f ? '<img src="' + esc(f) + '" alt="" loading="lazy">' : "") + "</a>" +
      '<a class="ck-nm" href="#lugar-' + esc(l.id) + '"><b>' + esc(l.nome) + "</b><small>" + esc(G.CATS[l.categoria] || "") + " · " + esc(G.regiao(l)) + "</small>" +
      (feito ? (it.estrelas ? (window.Reacoes ? Reacoes.selo(it.estrelas, { individual: true, nome: true, cls: "ck-st" }) : '<span class="ck-st">' + "★".repeat(it.estrelas) + '<i>' + "★".repeat(5 - it.estrelas) + "</i></span>") : '<span class="ck-pend">Falta avaliar</span>') : "") + "</a>" +
      '<span class="ck-ac">' + (feito ? '<button type="button" class="btn sm ' + (it.estrelas ? "ghost" : "") + '" data-chk="' + esc(l.id) + '">' + (it.estrelas ? "Ver avaliação" : "Avaliar") + "</button>" : it ? '<button type="button" class="btn sm" data-ck-feito="' + esc(l.id) + '">' + CHECK + " Visitei</button>" : "") +
      '<button type="button" class="ck-mini' + (curtido(l.id) ? " on" : "") + '" data-fav="' + esc(l.id) + '" aria-pressed="' + curtido(l.id) + '" aria-label="Curtir">' + CORACAO + "</button>" +
      (it ? '<button type="button" class="ck-mini" data-ck-tira="' + esc(l.id) + '" aria-label="Tirar do checklist">×</button>' : "") + "</span></div>";
  }
  function painel(aba) {
    aba = aba || "check";
    var its = itens(), ob = function (id) { return Store.obter("lugares", id); };
    var pend = its.filter(function (x) { return !x.feito && ob(x.id); }), feitos = its.filter(function (x) { return x.feito && ob(x.id); });
    var cur = curtidos().map(ob).filter(Boolean), total = pend.length + feitos.length, pct = total ? Math.round(feitos.length / total * 100) : 0;
    var corpo;
    if (aba === "check") {
      corpo = total ? '<div class="ck-prog"><div><b>' + feitos.length + " de " + total + "</b> visitados</div><span><i style=\"width:" + pct + '%"></i></span></div>' +
        (pend.length ? '<p class="ck-gr">Para visitar</p><div class="ck-list">' + pend.map(function (x) { return linha(ob(x.id), x); }).join("") + "</div>" : "") +
        (feitos.length ? '<p class="ck-gr">Visitados</p><div class="ck-list">' + feitos.map(function (x) { return linha(ob(x.id), x); }).join("") + "</div>" : "")
        : '<div class="ck-vazio">' + LISTA + "<b>Seu checklist está vazio</b><p>Abra um lugar e toque no <b>check verde</b> para colocar no checklist. Quando visitar, dê o check e conte como foi.</p><a class=\"btn\" href=\"#explorar\">Explorar passeios</a></div>";
    } else {
      corpo = cur.length ? '<div class="ck-list">' + cur.map(function (l) { return linha(l, item(l.id)); }).join("") + "</div>" + (window.Extras && Extras.mapsRota ? '<div class="row" style="margin-top:12px"><a class="btn ghost" href="' + esc(Extras.mapsRota(cur)) + '" target="_blank" rel="noopener">Abrir rota dos curtidos no Maps</a></div>' : "")
        : '<div class="ck-vazio">' + CORACAO + "<b>Nenhum curtido ainda</b><p>Toque no <b>coração</b> dos lugares que você gostou para guardar aqui.</p><a class=\"btn\" href=\"#explorar\">Explorar lugares</a></div>";
    }
    return '<div id="ck-painel" class="ck-painel" data-aba="' + aba + '"><div class="ck-tabs" role="tablist">' +
      '<button type="button" role="tab" data-ck-aba="check" aria-selected="' + (aba === "check") + '"><span class="ck-t-ic g">' + CHECK + "</span>Checklist <em>" + total + "</em></button>" +
      '<button type="button" role="tab" data-ck-aba="curt" aria-selected="' + (aba === "curt") + '"><span class="ck-t-ic r">' + CORACAO + "</span>Curtidos <em>" + cur.length + "</em></button></div>" + corpo + "</div>";
  }
  function viewLista() {
    G.app.innerHTML = '<section class="block"><div class="wrap stack in" style="max-width:820px"><div><p class="eyebrow">Seu roteiro</p><h1 class="page-h" style="margin-top:4px">Meu roteiro</h1><p class="muted" style="margin-top:6px">Monte o checklist dos passeios, marque o que já visitou e conte como foi.</p></div>' + painel("check") + "</div></section>";
  }
  G.views.lista = viewLista;
  /* quando a lista ou o checklist mudam em outro aparelho (sincronização), redesenha o painel aberto */
  Store.assinar && Store.assinar(function () { var p = $("#ck-painel"); if (p && !document.querySelector(".ck-modal")) p.outerHTML = painel(p.dataset.aba); });

  window.Checklist = { botoes: botoes, painel: painel, itens: itens, avaliar: avaliar };
})();
