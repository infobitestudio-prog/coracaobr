/* Cardápio digital (livreto com as páginas do cardápio, importadas de imagens ou PDF) e tabela de preços organizada
   (escrita item a item ou importada de texto/planilha). Usado no cadastro do anunciante, no painel master e na página do lugar. */
(function () {
  "use strict";
  var G = window.Guia, esc = G.esc, ic = G.ic, $ = function (s, r) { return (r || document).querySelector(s); };
  var MAX_PAG = 16, MAX_ITENS = 80;
  var UN = [["", "Preço fixo"], ["de", "A partir de"], ["/hora", "Por hora"], ["/pessoa", "Por pessoa"], ["/unidade", "Por unidade"], ["/kg", "Por kg"], ["/mês", "Por mês"]];
  function precoNum(v) { var p = String(v == null ? "" : v).replace(/[^\d,.]/g, ""); if (/,\d{1,2}$/.test(p)) p = p.replace(/\./g, "").replace(",", "."); else p = p.replace(/,/g, ""); return p === "" || isNaN(Number(p)) ? null : Math.round(Number(p) * 100) / 100; }
  function ehComida(l) { return /restaurante|churrascaria|padaria|acai|bbq|tex-mex|steakhouse|hamburguer|brunch|pizza|bar|cafe|lanch|comida/.test(String(l.categoria || "")); }

  /* ================= editor ================= */
  function linha(m) {
    m = m || {};
    return '<div class="cp-row"><input data-k="secao" value="' + esc(m.secao || "") + '" placeholder="Seção (ex.: Pratos, Corte de cabelo)" aria-label="Seção">' +
      '<input data-k="item" value="' + esc(m.item || "") + '" placeholder="Nome do item ou serviço" aria-label="Item">' +
      '<input data-k="preco" value="' + esc(m.preco == null ? "" : m.preco) + '" placeholder="US$" inputmode="decimal" aria-label="Preço em dólar">' +
      '<select data-k="un" aria-label="Tipo de preço">' + UN.map(function (u) { return '<option value="' + u[0] + '"' + ((m.un || (m.de ? "de" : "")) === u[0] ? " selected" : "") + ">" + u[1] + "</option>"; }).join("") + "</select>" +
      '<label class="cp-dest" title="Destacar como mais pedido"><input type="checkbox" data-k="dest"' + (m.dest ? " checked" : "") + "><span>★</span></label>" +
      '<button type="button" class="cp-x" data-cp-tira aria-label="Remover item">×</button>' +
      '<input data-k="descricao" class="cp-desc" value="' + esc(m.descricao || "") + '" placeholder="Descrição (opcional)" aria-label="Descrição"></div>';
  }
  function thumbs(pags) {
    return pags.length ? pags.map(function (src, i) { return '<figure class="cp-pg" data-i="' + i + '"><img src="' + esc(Store.urlFoto(src)) + '" alt="Página ' + (i + 1) + '"><figcaption>' + (i + 1) + '</figcaption><div class="cp-pgb"><button type="button" data-cp-mv="-1" aria-label="Mover para antes">‹</button><button type="button" data-cp-mv="1" aria-label="Mover para depois">›</button><button type="button" data-cp-pgx aria-label="Remover página">×</button></div></figure>'; }).join("") : '<p class="small muted">Nenhuma página enviada.</p>';
  }
  function editor(D) {
    var pags = (D.cardapioPaginas || []).slice(0, MAX_PAG);
    return '<div class="cp-ed" data-pags="' + esc(JSON.stringify(pags)) + '">' +
      '<div class="panel stack" style="gap:12px"><div><h3>Cardápio digital</h3><p class="small muted">Tem cardápio pronto? Importe o PDF ou as fotos das páginas, na ordem. No guia ele aparece como um livreto que o cliente folheia.</p></div>' +
      '<div class="cp-pgs" data-cp-pgs>' + thumbs(pags) + '</div>' +
      '<div class="row"><label class="btn ghost sm cp-up">' + ic("doc") + ' Importar PDF ou imagens<input type="file" accept="application/pdf,image/*" multiple data-cp-arq hidden></label><span class="small muted" data-cp-st>Até ' + MAX_PAG + " páginas.</span></div>" +
      '<div class="field"><label for="cp-link">Ou link do cardápio (site ou PDF)</label><input id="cp-link" data-cp-link value="' + esc(D.cardapioLink || D.fonteMenu || "") + '" placeholder="https://"></div></div>' +
      '<div class="panel stack" style="gap:12px"><div><h3>Tabela de preços</h3><p class="small muted">Produtos ou serviços com preço em dólar (o guia mostra também o valor aproximado em reais). Use seções para organizar e ★ para destacar os mais pedidos.</p></div>' +
      '<div class="cp-rows" data-cp-rows>' + (D.menu || []).map(linha).join("") + "</div>" +
      '<div class="row"><button type="button" class="btn ghost sm" data-cp-mais>' + ic("star") + ' Adicionar item</button><button type="button" class="btn ghost sm" data-cp-imp>' + ic("doc") + " Importar lista</button></div>" +
      '<div class="cp-impbox" data-cp-impbox hidden><label class="small" for="cp-txt">Cole sua lista (de uma planilha, do WhatsApp ou do site). Uma linha por item; linhas terminadas em <b>:</b> viram seção.</label>' +
      '<textarea id="cp-txt" data-cp-txt placeholder="Pratos:\nFeijoada completa; 18,90; serve 2 pessoas\nPicanha na chapa .......... 24.50\n\nServiços:\nCorte masculino | 25 | a partir de"></textarea>' +
      '<div class="row"><button type="button" class="btn sm" data-cp-ler>Adicionar à tabela</button><button type="button" class="btn ghost sm" data-cp-imp>Cancelar</button></div></div></div></div>';
  }
  function interpreta(txt) {
    var sec = "", out = [];
    String(txt || "").split(/\r?\n/).forEach(function (raw) {
      var s = raw.trim(); if (!s) return;
      if (/^#+\s*/.test(s) || (/:$/.test(s) && !/\d/.test(s.slice(-4)))) { sec = s.replace(/^#+\s*/, "").replace(/:$/, "").trim(); return; }
      var cols = s.split(/\t|;|\|/).map(function (c) { return c.trim(); });
      if (cols.length >= 2) {
        if (/^(item|produto|servi[cç]o|nome)$/i.test(cols[0]) && /pre[cç]o|valor/i.test(cols[1])) return;
        var un = "", desc = cols[2] || "";
        [cols[2], cols[3]].forEach(function (c) { if (!c) return; var cl = c.toLowerCase(); if (/a partir/.test(cl)) un = "de"; else if (/hora/.test(cl)) un = "/hora"; else if (/pessoa/.test(cl)) un = "/pessoa"; else if (/unid/.test(cl)) un = "/unidade"; else if (/\bkg\b|quilo/.test(cl)) un = "/kg"; else if (/m[eê]s/.test(cl)) un = "/mês"; });
        if (un && desc && /a partir|hora|pessoa|unid|kg|quilo|m[eê]s/i.test(desc) && desc.length < 16) desc = cols[3] && !/a partir|hora|pessoa|unid|kg|m[eê]s/i.test(cols[3]) ? cols[3] : "";
        out.push({ secao: sec, item: cols[0].slice(0, 80), preco: precoNum(cols[1]), descricao: desc.slice(0, 160), un: un });
        return;
      }
      var m = s.match(/^(.*?)[\s.\-–—_:]*(?:US\$|\$)?\s*(\d{1,5}(?:[.,]\d{1,2})?)\s*$/);
      if (m && m[1]) out.push({ secao: sec, item: m[1].trim().slice(0, 80), preco: precoNum(m[2]), descricao: "", un: "" });
      else out.push({ secao: sec, item: s.slice(0, 80), preco: null, descricao: "", un: "" });
    });
    return out;
  }
  function ler(root, D) {
    var ed = $(".cp-ed", root); if (!ed) return;
    D.cardapioPaginas = JSON.parse(ed.dataset.pags || "[]").slice(0, MAX_PAG);
    var lk = $("[data-cp-link]", ed).value.trim(); D.cardapioLink = /^https:\/\//i.test(lk) ? lk.slice(0, 400) : "";
    D.menu = Array.from(ed.querySelectorAll(".cp-row")).map(function (r) {
      var o = {}; Array.from(r.querySelectorAll("[data-k]")).forEach(function (i) { o[i.dataset.k] = i.type === "checkbox" ? i.checked : i.value.trim(); });
      o.preco = precoNum(o.preco); if (!o.dest) delete o.dest; if (!o.un) delete o.un; return o;
    }).filter(function (m) { return m.item; }).slice(0, MAX_ITENS);
  }
  function pagsDe(ed) { return JSON.parse(ed.dataset.pags || "[]"); }
  function setPags(ed, p) { ed.dataset.pags = JSON.stringify(p); $("[data-cp-pgs]", ed).innerHTML = thumbs(p); }
  /* PDF → imagens com o pdf.js (carregado só quando alguém importa um PDF). */
  var pdfjs = null;
  function carregaPdf() {
    if (pdfjs) return pdfjs;
    pdfjs = new Promise(function (ok, ruim) {
      var s = document.createElement("script"); s.src = "https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.min.js";
      s.onload = function () { try { window.pdfjsLib.GlobalWorkerOptions.workerSrc = "https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js"; ok(window.pdfjsLib); } catch (e) { ruim(e); } };
      s.onerror = function () { pdfjs = null; ruim(new Error("Não foi possível abrir o leitor de PDF. Envie as páginas como imagem.")); };
      document.head.appendChild(s);
    });
    return pdfjs;
  }
  async function pdfParaImagens(arq, max, st) {
    var lib = await carregaPdf(), doc = await lib.getDocument({ data: await arq.arrayBuffer() }).promise, out = [];
    for (var i = 1; i <= Math.min(doc.numPages, max); i++) {
      st("Lendo página " + i + " de " + Math.min(doc.numPages, max) + "…");
      var pg = await doc.getPage(i), v0 = pg.getViewport({ scale: 1 }), esc2 = Math.min(2.2, 1600 / v0.width), v = pg.getViewport({ scale: esc2 });
      var c = document.createElement("canvas"); c.width = Math.round(v.width); c.height = Math.round(v.height);
      await pg.render({ canvasContext: c.getContext("2d"), viewport: v }).promise;
      var blob = await new Promise(function (r) { c.toBlob(r, "image/jpeg", 0.86); });
      out.push(new File([blob], "pagina-" + i + ".jpg", { type: "image/jpeg" }));
    }
    return out;
  }
  document.addEventListener("change", async function (e) {
    var inp = e.target.closest("[data-cp-arq]"); if (!inp) return;
    var ed = inp.closest(".cp-ed"), st = function (t) { $("[data-cp-st]", ed).textContent = t; }, p = pagsDe(ed), arqs = Array.from(inp.files || []);
    inp.value = "";
    try {
      var imgs = [];
      for (var k = 0; k < arqs.length; k++) { if (/pdf/i.test(arqs[k].type) || /\.pdf$/i.test(arqs[k].name)) imgs = imgs.concat(await pdfParaImagens(arqs[k], MAX_PAG - p.length - imgs.length, st)); else imgs.push(arqs[k]); }
      imgs = imgs.slice(0, Math.max(0, MAX_PAG - p.length));
      for (var i = 0; i < imgs.length; i++) { st("Enviando página " + (i + 1) + " de " + imgs.length + "…"); p.push(await Store.salvarFoto(imgs[i])); setPags(ed, p); }
      st(p.length + (p.length === 1 ? " página" : " páginas") + " no cardápio.");
    } catch (er) { st(er.message || "Não foi possível importar."); G.toast(er.message || "Não foi possível importar o cardápio."); }
  });
  document.addEventListener("click", function (e) {
    var ed = e.target.closest(".cp-ed"); if (!ed) return;
    var b;
    if ((b = e.target.closest("[data-cp-mais]"))) { var rs = $("[data-cp-rows]", ed); if (rs.children.length >= MAX_ITENS) { G.toast("Até " + MAX_ITENS + " itens."); return; } var ult = rs.lastElementChild; rs.insertAdjacentHTML("beforeend", linha({ secao: ult ? ult.querySelector('[data-k="secao"]').value : "" })); rs.lastElementChild.querySelector('[data-k="item"]').focus(); return; }
    if ((b = e.target.closest("[data-cp-tira]"))) { b.closest(".cp-row").remove(); return; }
    if ((b = e.target.closest("[data-cp-imp]"))) { var bx = $("[data-cp-impbox]", ed); bx.hidden = !bx.hidden; if (!bx.hidden) $("[data-cp-txt]", ed).focus(); return; }
    if ((b = e.target.closest("[data-cp-ler]"))) {
      var its = interpreta($("[data-cp-txt]", ed).value), rows = $("[data-cp-rows]", ed), cabe = MAX_ITENS - rows.children.length;
      if (!its.length) { G.toast("Nenhum item encontrado no texto."); return; }
      rows.insertAdjacentHTML("beforeend", its.slice(0, cabe).map(linha).join(""));
      $("[data-cp-txt]", ed).value = ""; $("[data-cp-impbox]", ed).hidden = true; G.toast(Math.min(its.length, cabe) + " itens adicionados. Confira e salve."); return;
    }
    var fg = e.target.closest(".cp-pg"); if (!fg) return;
    var p = pagsDe(ed), i = Number(fg.dataset.i);
    if ((b = e.target.closest("[data-cp-pgx]"))) { p.splice(i, 1); setPags(ed, p); return; }
    if ((b = e.target.closest("[data-cp-mv]"))) { var j = i + Number(b.dataset.cpMv); if (j < 0 || j >= p.length) return; var t = p[i]; p[i] = p[j]; p[j] = t; setPags(ed, p); }
  });

  /* ================= exibição ================= */
  function temAlgo(l) { return (l.menu || []).length || (l.cardapioPaginas || []).length || /^https:\/\//.test(l.cardapioLink || ""); }
  function rotulo(l) { return ehComida(l) ? "Cardápio" : "Preços"; }
  function precoTxt(it) {
    if (it.preco == null || it.preco === "") return '<span class="cp-con">consulte</span>';
    var un = it.un || (it.de ? "de" : "");
    return (un === "de" ? '<small class="cp-de">a partir de</small>' : "") + '<b>' + G.usd(it.preco) + "</b>" + (un && un !== "de" ? '<small class="cp-un">' + esc(un) + "</small>" : "") + G.brl(Number(it.preco));
  }
  function tabela(l) {
    var m = l.menu || []; if (!m.length) return "";
    var secs = [], por = {};
    m.forEach(function (it) { var s = it.secao || "Itens"; if (!por[s]) { por[s] = []; secs.push(s); } por[s].push(it); });
    var nav = secs.length > 1 ? '<nav class="cp-nav" aria-label="Seções">' + secs.map(function (s, i) { return '<button type="button" data-cp-sec="' + i + '">' + esc(s) + "<em>" + por[s].length + "</em></button>"; }).join("") + "</nav>" : "";
    return '<div class="cp-tab"><div class="cp-th"><div><p class="eyebrow">' + (ehComida(l) ? "Cardápio" : "Tabela de preços") + '</p><h3>' + m.length + (m.length === 1 ? " item" : " itens") + "</h3></div>" + (l.menuVerificadoEm ? '<span class="pill ok">conferido em ' + esc(l.menuVerificadoEm) + "</span>" : "") + "</div>" +
      (m.length > 10 ? '<div class="cp-busca">' + ic("search") + '<input type="search" data-cp-q placeholder="Procurar no ' + (ehComida(l) ? "cardápio" : "catálogo") + '" aria-label="Procurar"></div>' : "") + nav +
      secs.map(function (s, i) {
        return '<section class="cp-sec" data-cp-i="' + i + '"><h4>' + esc(s) + "</h4>" + por[s].map(function (it) {
          return '<div class="cp-it' + (it.dest ? " dest" : "") + '" data-cp-txt="' + esc((it.item + " " + (it.descricao || "")).toLowerCase()) + '"><div class="cp-n"><b>' + esc(it.item) + "</b>" + (it.dest ? '<span class="cp-badge">Mais pedido</span>' : "") + (it.descricao ? "<p>" + esc(it.descricao) + "</p>" : "") + '</div><div class="cp-p">' + precoTxt(it) + "</div></div>";
        }).join("") + "</section>";
      }).join("") + '<p class="small muted">Preços informados pelo estabelecimento' + (l.anunciante ? "" : " ou levantados pela equipe") + '. Valores podem mudar; confirme no local.</p></div>';
  }
  function livreto(l) {
    var p = (l.cardapioPaginas || []).filter(Boolean), lk = /^https:\/\//.test(l.cardapioLink || "") ? l.cardapioLink : "";
    if (!p.length) return lk ? '<a class="cp-link" href="' + esc(lk) + '" target="_blank" rel="noopener">' + ic("doc") + "<span><b>Ver cardápio completo</b><small>abre o cardápio oficial</small></span>" + ic("arrow") + "</a>" : "";
    return '<div class="lv" data-lv="0" data-n="' + p.length + '" tabindex="0" aria-label="Cardápio em livreto, use as setas para folhear">' +
      '<div class="lv-book">' + p.map(function (src, i) { return '<figure class="lv-pg" data-pg="' + i + '"><img src="' + esc(Store.urlFoto(src)) + '" alt="Página ' + (i + 1) + ' do cardápio"' + (i > 1 ? ' loading="lazy"' : "") + ' decoding="async"><figcaption>' + (i + 1) + "</figcaption></figure>"; }).join("") + "</div>" +
      '<div class="lv-bar"><button type="button" class="lv-b" data-lv-dir="-1" aria-label="Página anterior">' + ic("left") + '</button><span class="lv-c" aria-live="polite"></span><button type="button" class="lv-b" data-lv-dir="1" aria-label="Próxima página">' + ic("right") + '</button><button type="button" class="lv-b lv-zoom" data-lv-zoom aria-label="Ampliar página">' + ic("search") + "</button></div>" +
      (lk ? '<a class="small" href="' + esc(lk) + '" target="_blank" rel="noopener">Abrir o cardápio oficial</a>' : "") + "</div>";
  }
  function bloco(l) { return '<div class="cp-wrap">' + livreto(l) + tabela(l) + "</div>"; }
  /* livreto: duas páginas lado a lado quando há espaço, uma no celular; virada com animação */
  function duplo(lv) { return lv.clientWidth >= 620; }
  function mostra(lv, dir) {
    var n = Number(lv.dataset.n), d = duplo(lv), i = Number(lv.dataset.lv), passo = d ? 2 : 1;
    if (d && i % 2) i -= 1;
    if (dir) { var j = i + dir * passo; if (j < 0 || j >= n) return; i = j; }
    lv.dataset.lv = i; lv.classList.toggle("duplo", d);
    Array.from(lv.querySelectorAll(".lv-pg")).forEach(function (f, k) {
      var vis = k === i || (d && k === i + 1);
      f.classList.toggle("on", vis); f.classList.toggle("esq", d && k === i); f.classList.toggle("dir", d && k === i + 1);
      f.classList.remove("vira-f", "vira-t"); if (vis && dir) { void f.offsetWidth; f.classList.add(dir > 0 ? "vira-f" : "vira-t"); }
    });
    lv.querySelector(".lv-c").textContent = (d && i + 1 < n ? (i + 1) + "–" + (i + 2) : (i + 1)) + " de " + n;
    lv.querySelector('[data-lv-dir="-1"]').disabled = i === 0; lv.querySelector('[data-lv-dir="1"]').disabled = i + (d ? 2 : 1) >= n;
  }
  function zoom(lv) {
    var i = Number(lv.dataset.lv), imgs = Array.from(lv.querySelectorAll(".lv-pg img")), dlg = document.createElement("dialog");
    dlg.className = "lv-full"; dlg.innerHTML = '<div class="lv-fz"><img src="' + imgs[i].src + '" alt="' + esc(imgs[i].alt) + '"></div><button type="button" class="lv-fx" aria-label="Fechar">' + ic("x") + "</button>";
    document.body.appendChild(dlg); dlg.showModal();
    var fz = dlg.querySelector(".lv-fz"); fz.addEventListener("click", function () { fz.classList.toggle("grande"); });
    dlg.addEventListener("close", function () { dlg.remove(); }); dlg.querySelector(".lv-fx").onclick = function () { dlg.close(); };
  }
  document.addEventListener("click", function (e) {
    var lv = e.target.closest(".lv"); if (lv) {
      var b = e.target.closest("[data-lv-dir]"); if (b) { mostra(lv, Number(b.dataset.lvDir)); return; }
      if (e.target.closest("[data-lv-zoom]") || e.target.closest(".lv-pg")) { zoom(lv); return; }
    }
    var s = e.target.closest("[data-cp-sec]"); if (s) { var alvo = s.closest(".cp-tab").querySelector('[data-cp-i="' + s.dataset.cpSec + '"]'); if (alvo) alvo.scrollIntoView({ behavior: "smooth", block: "start" }); }
  });
  document.addEventListener("keydown", function (e) { var lv = e.target.closest && e.target.closest(".lv"); if (!lv) return; if (e.key === "ArrowRight") mostra(lv, 1); if (e.key === "ArrowLeft") mostra(lv, -1); });
  document.addEventListener("input", function (e) {
    var q = e.target.closest("[data-cp-q]"); if (!q) return; var t = q.value.trim().toLowerCase(), tab = q.closest(".cp-tab");
    Array.from(tab.querySelectorAll(".cp-it")).forEach(function (it) { it.hidden = t && it.dataset.cpTxt.indexOf(t) < 0; });
    Array.from(tab.querySelectorAll(".cp-sec")).forEach(function (s) { s.hidden = !s.querySelector(".cp-it:not([hidden])"); });
  });
  var x0 = null;
  document.addEventListener("touchstart", function (e) { if (e.target.closest(".lv-book")) x0 = e.touches[0].clientX; }, { passive: true });
  document.addEventListener("touchend", function (e) { if (x0 == null) return; var lv = e.target.closest(".lv"), dx = e.changedTouches[0].clientX - x0; x0 = null; if (lv && Math.abs(dx) > 40) mostra(lv, dx < 0 ? 1 : -1); }, { passive: true });
  /* liga os livretos que aparecem na tela e reajusta ao mudar o tamanho */
  new MutationObserver(function () { Array.from(document.querySelectorAll(".lv:not([data-ok])")).forEach(function (lv) { lv.dataset.ok = "1"; mostra(lv, 0); }); }).observe(document.documentElement, { childList: true, subtree: true });
  window.addEventListener("resize", function () { Array.from(document.querySelectorAll(".lv")).forEach(function (lv) { mostra(lv, 0); }); });

  window.Cardapio = { editor: editor, ler: ler, interpreta: interpreta, bloco: bloco, temAlgo: temAlgo, rotulo: rotulo };
})();
