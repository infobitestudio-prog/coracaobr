/* Estúdio CoraçãoBR: editor (interface, seleção, painéis, galeria, projetos, exportação). */
(function () {
  "use strict";
  var E = window.E;
  var $ = function (s, r) { return (r || document).querySelector(s); };
  var $$ = function (s, r) { return Array.prototype.slice.call((r || document).querySelectorAll(s)); };
  function h(tag, attrs, kids) {
    var el = document.createElement(tag);
    if (attrs) for (var k in attrs) {
      if (k === "class") el.className = attrs[k];
      else if (k === "html") el.innerHTML = attrs[k];
      else if (k === "text") el.textContent = attrs[k];
      else if (k.slice(0, 2) === "on") el.addEventListener(k.slice(2), attrs[k]);
      else if (attrs[k] !== false && attrs[k] != null) el.setAttribute(k, attrs[k] === true ? "" : attrs[k]);
    }
    (kids || []).forEach(function (c) { if (c != null) el.appendChild(typeof c === "string" ? document.createTextNode(c) : c); });
    return el;
  }
  function svgI(id) { return '<svg aria-hidden="true"><use href="#' + id + '"/></svg>'; }
  function lsGet(k, d) { try { var v = localStorage.getItem(k); return v ? JSON.parse(v) : d; } catch (e) { return d; } }
  function lsSet(k, v) { try { localStorage.setItem(k, JSON.stringify(v)); return true; } catch (e) { return false; } }

  var cv = $("#cv"), ctx = cv.getContext("2d"), ov = $("#ov"), stage = $("#stage"), wrap = $("#stageWrap");
  var st = {
    doc: E.newDoc("Arte sem nome", 1080, "verde", []),
    sel: null, zoom: 0.5, fit: true, hist: [], hi: -1, editing: null, crop: false, clip: null,
    modelos: [], gerados: lsGet("estudio.gerados", []), gTab: "modelos", gFiltro: "todos", aberto: false, fotos: []
  };
  window.ESTUDIO = st; // útil para testes

  /* ---------- Toast ---------- */
  var tt;
  function toast(msg, ms) {
    var t = $("#toast"); t.textContent = msg; t.classList.add("on");
    clearTimeout(tt); tt = setTimeout(function () { t.classList.remove("on"); }, ms || 2600);
  }

  /* ---------- Desenho ---------- */
  var raf = 0;
  function draw() {
    if (raf) return;
    raf = requestAnimationFrame(function () {
      raf = 0;
      E.render(ctx, st.doc, { skip: st.editing });
      drawSel();
    });
  }
  E.onImage = function () { draw(); };
  function layer(id) { id = id || st.sel; for (var i = 0; i < st.doc.layers.length; i++) if (st.doc.layers[i].id === id) return st.doc.layers[i]; return null; }
  function idx(id) { return st.doc.layers.indexOf(layer(id)); }

  /* ---------- Histórico ---------- */
  function snap() { return JSON.stringify(st.doc); }
  function commit() {
    clearTimeout(commit.t);
    var s = snap();
    if (st.hist[st.hi] === s) return;
    st.hist = st.hist.slice(0, st.hi + 1);
    st.hist.push(s);
    if (st.hist.length > 120) st.hist.shift();
    st.hi = st.hist.length - 1;
    updHist();
    autosave();
  }
  function commitSoon() { clearTimeout(commit.t); commit.t = setTimeout(commit, 450); }
  function restore(s) {
    st.doc = JSON.parse(s);
    if (!layer(st.sel)) st.sel = null;
    applySize(); draw(); renderProps(); renderLayers(); syncTop();
  }
  function undo() { commit(); if (st.hi > 0) { st.hi--; restore(st.hist[st.hi]); updHist(); autosave(); } }
  function redo() { if (st.hi < st.hist.length - 1) { st.hi++; restore(st.hist[st.hi]); updHist(); autosave(); } }
  function updHist() { $("#btnUndo").disabled = st.hi <= 0; $("#btnRedo").disabled = st.hi >= st.hist.length - 1; }
  function autosave() { clearTimeout(autosave.t); autosave.t = setTimeout(function () { lsSet("estudio.atual", st.doc); }, 600); }

  /* ---------- Abrir arte ---------- */
  function openDoc(d, keepId) {
    st.doc = E.clone(d);
    if (!keepId) delete st.doc.projId;
    st.sel = null; st.crop = false; st.editing = null;
    st.hist = [snap()]; st.hi = 0; updHist();
    st.fit = true; applySize();
    E.preload(st.doc).then(draw);
    draw(); renderProps(); renderLayers(); renderTema(); syncTop();
    showGal(false);
    st.aberto = true;
    autosave();
  }
  function syncTop() {
    $("#docName").value = st.doc.name || "";
    $("#selFormato").value = String(st.doc.h);
  }

  /* ---------- Tamanho e zoom ---------- */
  function fitZoom() {
    var r = wrap.getBoundingClientRect();
    var pad = r.width < 600 ? 20 : 56;
    return Math.max(0.08, Math.min((r.width - pad) / st.doc.w, (r.height - pad - 40) / st.doc.h));
  }
  function applySize() {
    if (cv.width !== st.doc.w || cv.height !== st.doc.h) { cv.width = st.doc.w; cv.height = st.doc.h; }
    if (st.fit) st.zoom = fitZoom();
    var z = st.zoom;
    stage.style.width = st.doc.w + "px"; stage.style.height = st.doc.h + "px";
    stage.style.transform = "scale(" + z + ")";
    var r = wrap.getBoundingClientRect();
    var sw = st.doc.w * z, sh = st.doc.h * z;
    stage.style.left = Math.max(10, (r.width - sw) / 2) + "px";
    stage.style.top = Math.max(10, (r.height - 40 - sh) / 2) + "px";
    $("#stageSizer") && ($("#stageSizer").style.cssText = "width:" + (sw + 20) + "px;height:" + (sh + 60) + "px");
    stage.style.setProperty("--k", 1 / z);
    $("#zFit").textContent = Math.round(z * 100) + "%";
    drawSel();
  }
  function setZoom(z) { st.fit = false; st.zoom = E.clamp(z, 0.08, 3); applySize(); }
  window.addEventListener("resize", function () { clearTimeout(applySize.t); applySize.t = setTimeout(applySize, 80); });

  /* ---------- Seleção (overlay) ---------- */
  var selBox = h("div", { class: "sel" }), guides = h("div", { class: "guides" });
  ["nw", "n", "ne", "e", "se", "s", "sw", "w"].forEach(function (k) { selBox.appendChild(h("i", { class: "hd hd-" + k, "data-h": k })); });
  selBox.appendChild(h("i", { class: "hd hd-rot", "data-h": "rot", title: "Girar" }));
  selBox.appendChild(h("b", { class: "sel-tag" }));
  ov.appendChild(guides); ov.appendChild(selBox);

  function drawSel() {
    var l = layer();
    if (!l || l.hidden || st.editing === l.id) { selBox.style.display = "none"; return; }
    selBox.style.display = "block";
    selBox.style.left = l.x + "px"; selBox.style.top = l.y + "px";
    selBox.style.width = l.w + "px"; selBox.style.height = l.h + "px";
    selBox.style.transform = "rotate(" + (l.rot || 0) + "deg)";
    selBox.className = "sel" + (l.locked ? " locked" : "") + (st.crop ? " crop" : "") + " t-" + l.type;
    selBox.querySelector(".sel-tag").textContent = l.locked ? "Travado" : st.crop ? "Arraste para enquadrar" : "";
  }
  function select(id) {
    if (st.editing) endEdit();
    if (st.sel !== id) st.crop = false;
    st.sel = id;
    drawSel(); renderProps(); markLayers();
  }

  function toDoc(e) {
    var r = cv.getBoundingClientRect();
    return { x: (e.clientX - r.left) / r.width * st.doc.w, y: (e.clientY - r.top) / r.height * st.doc.h };
  }
  function rot(p, deg) { var a = deg * Math.PI / 180, c = Math.cos(a), s = Math.sin(a); return { x: p.x * c - p.y * s, y: p.x * s + p.y * c }; }
  function local(l, p) { return rot({ x: p.x - (l.x + l.w / 2), y: p.y - (l.y + l.h / 2) }, -(l.rot || 0)); }
  function hit(p) {
    for (var i = st.doc.layers.length - 1; i >= 0; i--) {
      var l = st.doc.layers[i];
      if (l.hidden) continue;
      var q = local(l, p), pad = 6 / st.zoom;
      if (Math.abs(q.x) <= l.w / 2 + pad && Math.abs(q.y) <= l.h / 2 + pad) return l;
    }
    return null;
  }

  var drag = null;
  ov.addEventListener("pointerdown", function (e) {
    if (e.button === 2) return;
    if (e.target.closest(".txed")) return;
    var p = toDoc(e), hd = e.target.dataset && e.target.dataset.h, l = layer();
    if (hd && l && !l.locked) {
      e.preventDefault();
      drag = { mode: hd === "rot" ? "rot" : "resize", h: hd, l: l, g0: { x: l.x, y: l.y, w: l.w, h: l.h, rot: l.rot || 0, size: l.size }, p0: p };
      ov.setPointerCapture(e.pointerId);
      return;
    }
    var t = hit(p);
    if (st.crop && l && l.type === "image" && t === l) {
      drag = { mode: "pan", l: l, p0: p, fx: l.fx == null ? 0.5 : l.fx, fy: l.fy == null ? 0.5 : l.fy };
      ov.setPointerCapture(e.pointerId); e.preventDefault(); return;
    }
    if (!t) { select(null); return; }
    if (t.id !== st.sel) select(t.id);
    if (t.locked) return;
    e.preventDefault();
    drag = { mode: "move", l: t, p0: p, x0: t.x, y0: t.y, moved: false };
    ov.setPointerCapture(e.pointerId);
  });
  ov.addEventListener("pointermove", function (e) {
    if (!drag) return;
    var p = toDoc(e), l = drag.l;
    if (drag.mode === "move") {
      var nx = drag.x0 + p.x - drag.p0.x, ny = drag.y0 + p.y - drag.p0.y;
      if (!drag.moved && Math.abs(p.x - drag.p0.x) + Math.abs(p.y - drag.p0.y) < 3 / st.zoom) return;
      drag.moved = true;
      var s = e.shiftKey ? null : snapMove(l, nx, ny);
      l.x = Math.round(s ? s.x : nx); l.y = Math.round(s ? s.y : ny);
      showGuides(s ? s.g : []);
    } else if (drag.mode === "rot") {
      var c = { x: drag.g0.x + drag.g0.w / 2, y: drag.g0.y + drag.g0.h / 2 };
      var a = Math.atan2(p.y - c.y, p.x - c.x) * 180 / Math.PI + 90;
      if (e.shiftKey) a = Math.round(a / 15) * 15;
      else { var r15 = Math.round(a / 45) * 45; if (Math.abs(a - r15) < 4) a = r15; }
      a = ((a + 540) % 360) - 180;
      l.rot = Math.round(a * 10) / 10;
    } else if (drag.mode === "resize") resize(l, drag, p, e.shiftKey);
    else if (drag.mode === "pan") {
      var r = E.img(l.src);
      if (r && r.ok) {
        var d = rot({ x: p.x - drag.p0.x, y: p.y - drag.p0.y }, -(l.rot || 0));
        var l0 = Object.assign({}, l, { fx: drag.fx, fy: drag.fy }), g = E.imgGeom(l0, r);
        if (l.w - g.dw !== 0) l.fx = E.clamp((g.dx + d.x) / (l.w - g.dw), 0, 1);
        if (l.h - g.dh !== 0) l.fy = E.clamp((g.dy + d.y) / (l.h - g.dh), 0, 1);
      }
    }
    draw();
  });
  function endDrag() {
    if (!drag) return;
    var d = drag; drag = null;
    showGuides([]);
    if (d.mode !== "move" || d.moved) { commit(); renderProps(); }
  }
  ov.addEventListener("pointerup", endDrag);
  ov.addEventListener("pointercancel", endDrag);
  ov.addEventListener("dblclick", function (e) {
    var t = hit(toDoc(e));
    if (!t || t.locked) return;
    select(t.id);
    if (t.type === "text") startEdit(t);
    else if (t.type === "image") { st.crop = !st.crop; drawSel(); renderProps(); }
  });
  ov.addEventListener("wheel", function (e) {
    var l = layer();
    if (st.crop && l && l.type === "image") {
      e.preventDefault();
      l.zoom = E.clamp((l.zoom || 1) * (e.deltaY < 0 ? 1.06 : 0.94), 1, 6); draw(); commitSoon();
    } else if (e.ctrlKey || e.metaKey) { e.preventDefault(); setZoom(st.zoom * (e.deltaY < 0 ? 1.1 : 0.9)); }
  }, { passive: false });

  var KEEP = { image: false, text: true, logo: true, qr: true, icon: true, badge: false, shape: false };
  function resize(l, d, p, shift) {
    var g = d.g0, hx = /w/.test(d.h) ? -1 : /e/.test(d.h) ? 1 : 0, hy = /n/.test(d.h) ? -1 : /s/.test(d.h) ? 1 : 0;
    var C0 = { x: g.x + g.w / 2, y: g.y + g.h / 2 };
    var a = rot({ x: -hx * g.w / 2, y: -hy * g.h / 2 }, g.rot), A = { x: C0.x + a.x, y: C0.y + a.y };
    var q = rot({ x: p.x - A.x, y: p.y - A.y }, -g.rot);
    var nw = hx ? Math.max(12, q.x * hx) : g.w, nh = hy ? Math.max(12, q.y * hy) : g.h;
    var corner = hx && hy;
    var keep = corner && (KEEP[l.type] ? !shift : shift);
    if (l.type === "text" && !corner) { nh = g.h; }
    if (l.type === "logo" || l.type === "qr" || (l.type === "icon" && !l.emoji && false)) keep = true;
    if (keep || l.type === "logo" || l.type === "qr") {
      var s = hx && hy ? Math.max(nw / g.w, nh / g.h) : hx ? nw / g.w : nh / g.h;
      s = Math.max(s, 0.05);
      nw = g.w * s; nh = g.h * s;
      if (l.type === "text") l.size = Math.max(6, Math.round(g.size * s * 10) / 10);
    }
    if (l.type === "logo") { l.h = Math.round(nh); nw = E.logoWidth(l); }
    var c = rot({ x: hx * nw / 2, y: hy * nh / 2 }, g.rot);
    var C = { x: A.x + c.x, y: A.y + c.y };
    if (!hx) { var cy = rot({ x: 0, y: hy * nh / 2 }, g.rot); C = { x: A.x + cy.x, y: A.y + cy.y }; }
    l.w = Math.round(nw);
    if (l.type === "text") E.fitText(l); else l.h = Math.round(nh);
    l.x = Math.round(C.x - l.w / 2); l.y = Math.round(C.y - l.h / 2);
    if (l.type === "text" && !keep) { l.y = Math.round(g.y + (g.h - l.h) * 0); if (hx === -1) l.x = Math.round(g.x + g.w - l.w); else if (hx === 1) l.x = g.x; }
  }
  function snapMove(l, x, y) {
    if (l.rot) return null;
    var W = st.doc.w, H = st.doc.h, th = 8 / st.zoom, g = [], rx = x, ry = y;
    var xs = [[0, 0], [W / 2, l.w / 2], [W, l.w]], ys = [[0, 0], [H / 2, l.h / 2], [H, l.h]];
    var bx = null, by = null;
    [0, l.w / 2, l.w].forEach(function (off) {
      xs.forEach(function (t) { var d = Math.abs(x + off - t[0]); if (d < th && (!bx || d < bx.d)) bx = { d: d, v: t[0] - off, line: t[0] }; });
    });
    [0, l.h / 2, l.h].forEach(function (off) {
      ys.forEach(function (t) { var d = Math.abs(y + off - t[0]); if (d < th && (!by || d < by.d)) by = { d: d, v: t[0] - off, line: t[0] }; });
    });
    if (bx) { rx = bx.v; g.push({ v: true, at: bx.line }); }
    if (by) { ry = by.v; g.push({ v: false, at: by.line }); }
    return { x: rx, y: ry, g: g };
  }
  function showGuides(list) {
    guides.innerHTML = "";
    list.forEach(function (g) {
      guides.appendChild(h("i", { class: g.v ? "gv" : "gh", style: g.v ? "left:" + g.at + "px" : "top:" + g.at + "px" }));
    });
  }

  /* ---------- Edição de texto no lugar ---------- */
  function startEdit(l) {
    endEdit();
    st.editing = l.id;
    var ta = h("textarea", { class: "txed", spellcheck: "false", "aria-label": "Editar texto" });
    ta.value = l.text;
    var col = E.col(l.color, st.doc);
    ta.style.cssText = "left:" + l.x + "px;top:" + l.y + "px;width:" + (l.w + 4) + "px;height:" + (l.h + 8) + "px;transform:rotate(" + (l.rot || 0) + "deg);" +
      "font:" + (l.italic ? "italic " : "") + (l.weight || 700) + " " + l.size + "px/" + (l.lh || 1.15) + " \"" + l.font + "\";letter-spacing:" + (l.ls || 0) + "px;" +
      "text-align:" + (l.align || "left") + ";color:" + col + ";text-transform:" + (l.upper ? "uppercase" : "none") + ";caret-color:" + col;
    ta.addEventListener("input", function () {
      l.text = ta.value; E.fitText(l);
      ta.style.height = (l.h + 8) + "px";
      draw(); commitSoon();
      var pt = $("#propText"); if (pt) pt.value = ta.value;
    });
    ta.addEventListener("keydown", function (e) { if (e.key === "Escape") { e.preventDefault(); endEdit(); } e.stopPropagation(); });
    ta.addEventListener("blur", function () { setTimeout(endEdit, 0); });
    ov.appendChild(ta);
    draw();
    ta.focus(); ta.select();
  }
  function endEdit() {
    if (!st.editing) return;
    st.editing = null;
    $$(".txed", ov).forEach(function (t) { t.remove(); });
    commit(); draw(); renderProps();
  }

  /* ---------- Ações sobre camadas ---------- */
  function add(l, noSelect) {
    if (l.type === "text") E.fitText(l);
    // centraliza se não tiver posição definida
    if (l.x == null || l._center) { l.x = Math.round((st.doc.w - l.w) / 2); l.y = Math.round((st.doc.h - l.h) / 2); delete l._center; }
    st.doc.layers.push(l);
    if (l.type === "image") E.img(l.src);
    if (!noSelect) select(l.id);
    commit(); renderLayers(); draw();
    closeSheetsMobile();
  }
  function centered(l) { l._center = true; return l; }
  function del() { var i = idx(); if (i < 0) return; st.doc.layers.splice(i, 1); st.sel = null; commit(); draw(); renderProps(); renderLayers(); }
  function dup() {
    var l = layer(); if (!l) return;
    var c = E.clone(l); c.id = E.uid(); c.x += 30; c.y += 30; c.locked = false;
    st.doc.layers.splice(idx() + 1, 0, c); select(c.id); commit(); renderLayers(); draw();
  }
  function order(dir) {
    var i = idx(); if (i < 0) return;
    var L = st.doc.layers, l = L[i];
    L.splice(i, 1);
    var j = dir === "top" ? L.length : dir === "bottom" ? 0 : E.clamp(i + dir, 0, L.length);
    L.splice(j, 0, l);
    commit(); draw(); renderLayers();
  }
  function align(k) {
    var l = layer(); if (!l) return;
    var W = st.doc.w, H = st.doc.h, m = 72;
    if (k === "l") l.x = m; if (k === "c") l.x = Math.round((W - l.w) / 2); if (k === "r") l.x = W - m - l.w;
    if (k === "t") l.y = m; if (k === "m") l.y = Math.round((H - l.h) / 2); if (k === "b") l.y = H - m - l.h;
    commit(); draw(); renderProps();
  }
  function toggleLock(l) { l = l || layer(); if (!l) return; l.locked = !l.locked; commit(); drawSel(); renderProps(); renderLayers(); }

  /* ---------- Imagens enviadas ---------- */
  var fileCb = null;
  $("#fileImg").addEventListener("change", function (e) {
    var f = e.target.files[0]; e.target.value = "";
    if (!f || !fileCb) return;
    var cb = fileCb; fileCb = null;
    readImage(f, cb.logo ? 900 : 1800, cb.logo).then(cb.fn).catch(function () { toast("Não foi possível ler essa imagem."); });
  });
  function pickFile(fn, logo) { fileCb = { fn: fn, logo: logo }; $("#fileImg").click(); }
  function readImage(file, max, png) {
    return new Promise(function (res, rej) {
      var fr = new FileReader();
      fr.onerror = rej;
      fr.onload = function () {
        var im = new Image();
        im.onerror = rej;
        im.onload = function () {
          var s = Math.min(1, max / Math.max(im.width, im.height));
          var c = document.createElement("canvas"); c.width = Math.round(im.width * s); c.height = Math.round(im.height * s);
          c.getContext("2d").drawImage(im, 0, 0, c.width, c.height);
          var keepPng = png || /png|webp|gif|svg/.test(file.type);
          res({ src: c.toDataURL(keepPng ? "image/png" : "image/jpeg", 0.88), w: c.width, h: c.height });
        };
        im.src = fr.result;
      };
      fr.readAsDataURL(file);
    });
  }
  function imageLayerFrom(info, logo) {
    var max = logo ? 360 : 640, s = Math.min(max / info.w, max / info.h);
    return centered(E.L.image(info.src, 0, 0, Math.round(info.w * s), Math.round(info.h * s), logo ? { fit: "contain", name: "Logo do anunciante" } : { name: "Imagem enviada" }));
  }
  function setPhoto(src) {
    var l = layer();
    if (l && l.type === "image") { l.src = src; l.fx = 0.5; l.fy = 0.5; l.zoom = 1; E.img(src); commit(); draw(); toast("Foto trocada."); closeSheetsMobile(); }
    else add(centered(E.L.image(src, 0, 0, 640, 640, { radius: 24, name: "Foto do guia" })));
  }

  /* ---------- Painel: Adicionar ---------- */
  function sec(title, kids, cls) { return h("section", { class: "psec " + (cls || "") }, [h("h3", { text: title })].concat(kids)); }
  function renderAdd() {
    var p = $("#pAdd"); p.innerHTML = "";
    var t = st.doc;
    p.appendChild(sec("Texto", [
      h("button", { class: "addt addt-1", onclick: function () { add(centered(E.L.text("Seu título aqui", 0, 0, 860, { size: 96, weight: 800, font: "Bricolage Grotesque", ls: -2, lh: 1 }))); } }, ["Adicionar título"]),
      h("button", { class: "addt addt-2", onclick: function () { add(centered(E.L.text("Subtítulo curto", 0, 0, 760, { size: 48, weight: 600 }))); } }, ["Adicionar subtítulo"]),
      h("button", { class: "addt addt-3", onclick: function () { add(centered(E.L.text("Texto de apoio, em uma ou duas linhas.", 0, 0, 760, { size: 32, weight: 500, lh: 1.3 }))); } }, ["Adicionar texto"])
    ]));
    p.appendChild(sec("Imagem", [
      h("div", { class: "grid2" }, [
        h("button", { class: "tile", html: svgI("i-upload") + "<span>Enviar foto</span>", onclick: function () { pickFile(function (i) { add(imageLayerFrom(i)); }); } }),
        h("button", { class: "tile", html: svgI("i-img") + "<span>Fotos do guia</span>", onclick: function () { openTab("fotos"); } })
      ])
    ]));
    var shapes = [
      ["Retângulo", function () { return E.L.rect(0, 0, 520, 320, "@accent", { radius: 0 }); }],
      ["Cartão", function () { return E.L.rect(0, 0, 520, 320, "@surface", { radius: 36 }); }],
      ["Círculo", function () { return E.L.circle(0, 0, 360, "@accent"); }],
      ["Faixa", function () { return E.L.faixa(0, 0, 900, 140, "@accent", { rot: -4 }); }],
      ["Estrela", function () { return Object.assign(E.L.rect(0, 0, 300, 300, "@soft"), { shape: "estrela" }); }],
      ["Degradê", function () { return E.L.rect(0, 0, st.doc.w, Math.round(st.doc.h / 2), "#000000", { grad: "down", opacity: 0.8 }); }],
      ["Contorno", function () { return E.L.rect(0, 0, 520, 320, "transparent", { radius: 24, stroke: "@ink", strokeW: 6 }); }],
      ["Picote", function () { return E.L.rect(0, 0, 600, 300, "transparent", { radius: 24, stroke: "@ink", strokeW: 5, dash: true }); }]
    ];
    p.appendChild(sec("Formas", [h("div", { class: "grid4" }, shapes.map(function (s) {
      return h("button", { class: "tile tile-s", "data-shape": s[0], onclick: function () { var l = s[1](); l.name = s[0]; add(centered(l)); } }, [h("i", { class: "shp shp-" + E.slug(s[0]) }), h("span", { text: s[0] })]);
    }))]));
    p.appendChild(sec("Logo", [
      h("div", { class: "grid2" }, [
        h("button", { class: "tile logo-d", onclick: function () { add(centered(E.L.logo(0, 0, 70, "clara", { name: "Logo claro" }))); } }, [h("span", { html: '<svg class="mini-sym" viewBox="0 0 270 200"><use href="#symLogo"/></svg><b>Coração<i>BR</i></b>' }), h("small", { text: "Para fundo escuro" })]),
        h("button", { class: "tile logo-l", onclick: function () { add(centered(E.L.logo(0, 0, 70, "escura", { name: "Logo escuro" }))); } }, [h("span", { html: '<svg class="mini-sym" viewBox="0 0 270 200"><use href="#symLogo"/></svg><b>Coração<i>BR</i></b>' }), h("small", { text: "Para fundo claro" })]),
        h("button", { class: "tile", onclick: function () { add(centered(E.L.logo(0, 0, 160, "simbolo", { name: "Símbolo" }))); } }, [h("span", { html: '<svg class="mini-sym big" viewBox="0 0 270 200"><use href="#symLogo"/></svg>' }), h("small", { text: "Só o símbolo" })]),
        h("button", { class: "tile", html: svgI("i-upload") + "<span>Logo do anunciante</span>", onclick: function () { pickFile(function (i) { add(imageLayerFrom(i, true)); }, true); } })
      ])
    ]));
    p.appendChild(sec("QR code e selos", [
      h("div", { class: "grid2" }, [
        h("button", { class: "tile", html: svgI("i-qr") + "<span>QR code</span>", onclick: function () { add(centered(E.L.qr(E.site().url, 0, 0, 320, { name: "QR code" }))); } }),
        h("button", { class: "tile", html: svgI("i-tag") + "<span>Selo R$ 50/mês</span>", onclick: function () { add(centered(E.L.badge("R$ 50", "por mês", 0, 0, 260, { name: "Selo de preço" }))); } }),
        h("button", { class: "tile", html: svgI("i-star") + "<span>Selo estrela</span>", onclick: function () { add(centered(E.L.badge("R$ 25", "7 dias", 0, 0, 280, { shape: "estrela", fill: "@soft", color: "#0E1311", name: "Selo estrela" }))); } }),
        h("button", { class: "tile", html: '<b class="pill-prev">GRÁTIS</b><span>Selo pílula</span>', onclick: function () { add(centered(E.L.badge("GRÁTIS", "", 0, 0, 300, { shape: "pilula", s1: 0.46, name: "Selo pílula", h: 110 }))); } })
      ])
    ]));
    var icons = Object.keys(E.ICONS);
    p.appendChild(sec("Ícones", [h("div", { class: "grid6" }, icons.map(function (n) {
      return h("button", { class: "icb", title: E.ICON_NAMES[n] || n, "aria-label": E.ICON_NAMES[n] || n, html: '<svg viewBox="0 0 24 24"><path d="' + E.ICONS[n] + '"/></svg>', onclick: function () { add(centered(E.L.icon(n, 0, 0, 180, "@accent", { name: "Ícone " + (E.ICON_NAMES[n] || n) }))); } });
    }))]));
    var emojis = ["🇧🇷", "💚", "💛", "⭐", "🔥", "🎉", "📍", "🍖", "🥩", "☕", "🧀", "🐶", "✅", "📣", "🎶", "⚽"];
    p.appendChild(sec("Emojis", [h("div", { class: "grid8" }, emojis.map(function (em) {
      return h("button", { class: "emb", text: em, onclick: function () { add(centered(Object.assign(E.L.icon("estrela", 0, 0, 160, "#000000", { name: "Emoji" }), { emoji: em }))); } });
    }))]));
  }

  /* ---------- Painel: Fotos do guia ---------- */
  function buildFotos() {
    var out = [], seen = {};
    E.seed.lugares.forEach(function (l) {
      (l.fotos || []).forEach(function (f) {
        if (!f.src || seen[f.src]) return; seen[f.src] = 1;
        out.push({ src: E.fotoSrc(f), nome: l.nome, cidade: l.cidade || "", cat: E.CAT[l.categoria] || l.categoria, reg: E.regNome(E.regKey(l)), il: !!f.ilustrativa, q: (l.nome + " " + l.cidade + " " + (E.CAT[l.categoria] || "") + " " + l.categoria + " " + E.regNome(E.regKey(l)) + " " + (f.tema || "")).normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase() });
      });
    });
    out.sort(function (a, b) { return a.il - b.il; });
    st.fotos = out;
  }
  var fotoLimit = 60;
  function renderFotos() {
    var p = $("#pFotos");
    if (!p.firstChild) {
      p.appendChild(h("div", { class: "fsearch" }, [
        h("input", { type: "search", id: "fq", placeholder: "Buscar: churrascaria, Plano, museu…", "aria-label": "Buscar fotos do guia", oninput: function () { fotoLimit = 60; listFotos(); } }),
        h("label", { class: "ck" }, [h("input", { type: "checkbox", id: "fReal", checked: true, onchange: function () { fotoLimit = 60; listFotos(); } }), h("span", { text: "Só fotos reais (sem ilustrativas)" })]),
        h("button", { class: "btn btn-q btn-s", html: svgI("i-upload") + "<span>Enviar do aparelho</span>", onclick: function () { pickFile(function (i) { var l = layer(); if (l && l.type === "image") setPhoto(i.src); else add(imageLayerFrom(i)); }); } })
      ]));
      p.appendChild(h("p", { class: "hint", id: "fHint" }));
      p.appendChild(h("div", { class: "fgrid", id: "fGrid" }));
      p.appendChild(h("button", { class: "btn btn-q btn-s more", id: "fMore", text: "Mostrar mais", onclick: function () { fotoLimit += 60; listFotos(); } }));
    }
    listFotos();
  }
  function listFotos() {
    var q = ($("#fq").value || "").normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase().trim();
    var real = $("#fReal").checked;
    var list = st.fotos.filter(function (f) { return (!real || !f.il) && (!q || q.split(/\s+/).every(function (w) { return f.q.indexOf(w) >= 0; })); });
    var l = layer();
    $("#fHint").textContent = list.length + " fotos. " + (l && l.type === "image" ? "Toque numa foto para trocar a imagem selecionada." : "Toque numa foto para colocar na arte.");
    var g = $("#fGrid"); g.innerHTML = "";
    list.slice(0, fotoLimit).forEach(function (f) {
      g.appendChild(h("button", { class: "fimg", title: f.nome + " (" + f.cidade + ")" + (f.il ? " — ilustrativa" : ""), onclick: function () { setPhoto(f.src); } }, [
        h("img", { src: f.src, alt: f.nome, loading: "lazy" }), h("span", { text: f.nome }), f.il ? h("em", { text: "ilustrativa" }) : null
      ]));
    });
    $("#fMore").hidden = list.length <= fotoLimit;
  }

  /* ---------- Painel: Camadas ---------- */
  var TYPE_NOME = { text: "Texto", image: "Imagem", shape: "Forma", logo: "Logo", qr: "QR code", icon: "Ícone", badge: "Selo" };
  function lname(l) {
    if (l.type === "text") return (l.text || "").split("\n")[0].slice(0, 34) || "Texto";
    return l.name || TYPE_NOME[l.type];
  }
  function renderLayers() {
    var p = $("#pCamadas"); p.innerHTML = "";
    p.appendChild(h("p", { class: "hint", text: "A de cima fica na frente. Toque para selecionar." }));
    var ul = h("ul", { class: "lyr" });
    st.doc.layers.slice().reverse().forEach(function (l) {
      ul.appendChild(h("li", { class: (l.id === st.sel ? "on" : "") + (l.hidden ? " off" : ""), "data-id": l.id, onclick: function (e) { if (e.target.closest("button")) return; select(l.id); } }, [
        h("span", { class: "lyr-t", text: TYPE_NOME[l.type] }),
        h("span", { class: "lyr-n", text: lname(l) }),
        h("button", { class: "ib ib-s", title: l.hidden ? "Mostrar" : "Esconder", "aria-label": l.hidden ? "Mostrar" : "Esconder", html: svgI(l.hidden ? "i-eyeoff" : "i-eye"), onclick: function () { l.hidden = !l.hidden; commit(); draw(); renderLayers(); } }),
        h("button", { class: "ib ib-s" + (l.locked ? " act" : ""), title: l.locked ? "Destravar" : "Travar", "aria-label": l.locked ? "Destravar" : "Travar", html: svgI(l.locked ? "i-lock" : "i-unlock"), onclick: function () { toggleLock(l); } })
      ]));
    });
    p.appendChild(ul);
  }
  function markLayers() { $$("#pCamadas li").forEach(function (li) { li.classList.toggle("on", li.dataset.id === st.sel); }); }

  /* ---------- Painel: Paleta ---------- */
  function renderTema() {
    var p = $("#pTema"); p.innerHTML = "";
    p.appendChild(sec("Paleta da arte", [
      h("p", { class: "hint", text: "Troca todas as cores ligadas à paleta de uma vez." }),
      h("div", { class: "themes" }, Object.keys(E.THEMES).map(function (k) {
        var t = E.THEMES[k];
        return h("button", { class: "theme" + (st.doc.theme === k ? " on" : ""), onclick: function () { st.doc.theme = k; commit(); draw(); renderTema(); renderProps(); } }, [
          h("span", { class: "th-sw", style: "background:" + t.bg }, [h("i", { style: "background:" + t.accent }), h("i", { style: "background:" + t.soft }), h("i", { style: "background:" + t.ink })]),
          h("b", { text: t.nome })
        ]);
      }))
    ]));
    p.appendChild(sec("Fundo", [colorRow("Cor de fundo", function () { return st.doc.bg; }, function (v) { st.doc.bg = v; })]));
    p.appendChild(sec("Cores da marca", [h("div", { class: "brandlist" }, E.BRAND.map(function (b) {
      return h("div", { class: "bl" }, [h("i", { style: "background:" + b.hex }), h("span", { text: b.nome }), h("code", { text: b.hex })]);
    }))]));
  }

  /* ---------- Controles de propriedades ---------- */
  function row(label, ctl, cls) { return h("div", { class: "prow " + (cls || "") }, [h("label", { text: label }), ctl]); }
  function slider(label, get, set, min, max, step, unit) {
    var v = h("output", { text: fmt(get()) + (unit || "") });
    var r = h("input", { type: "range", min: min, max: max, step: step || 1, value: get(), "aria-label": label,
      oninput: function () { set(+r.value); v.textContent = fmt(+r.value) + (unit || ""); draw(); commitSoon(); },
      onchange: function () { commit(); } });
    return h("div", { class: "prow sl" }, [h("label", { text: label }), r, v]);
  }
  function fmt(n) { return Math.round(n * 100) / 100; }
  function num(label, get, set, step) {
    var i = h("input", { type: "number", value: Math.round(get() * 10) / 10, step: step || 1, "aria-label": label,
      onchange: function () { set(+i.value); draw(); commit(); } });
    return h("label", { class: "numf" }, [h("span", { text: label }), i]);
  }
  function seg(label, opts, get, set) {
    var box = h("div", { class: "segb" });
    opts.forEach(function (o) {
      box.appendChild(h("button", { class: get() === o[0] ? "on" : "", title: o[2] || o[1], "aria-label": o[2] || o[1], html: o[1].charAt(0) === "#" ? svgI(o[1].slice(1)) : o[1],
        onclick: function () { set(o[0]); draw(); commit(); renderProps(); } }));
    });
    return row(label, box);
  }
  function sel(label, opts, get, set) {
    var s = h("select", { "aria-label": label, onchange: function () { set(s.value); draw(); commit(); renderProps(); } });
    opts.forEach(function (o) { s.appendChild(h("option", { value: o[0], text: o[1], selected: String(get()) === String(o[0]) })); });
    return row(label, s);
  }
  function check(label, get, set) {
    return h("label", { class: "ck" }, [h("input", { type: "checkbox", checked: !!get(), onchange: function (e) { set(e.target.checked); draw(); commit(); renderProps(); } }), h("span", { text: label })]);
  }
  function colorRow(label, get, set) {
    var cur = get() || "";
    var box = h("div", { class: "cols" });
    E.ROLES.forEach(function (r) {
      var tok = "@" + r[0];
      box.appendChild(h("button", { class: "cw tok" + (cur === tok ? " on" : ""), title: "Paleta: " + r[1], "aria-label": "Paleta: " + r[1], style: "background:" + E.col(tok, st.doc),
        onclick: function () { set(tok); draw(); commit(); renderProps(); renderTema(); } }));
    });
    box.appendChild(h("span", { class: "cdiv" }));
    E.BRAND.forEach(function (b) {
      box.appendChild(h("button", { class: "cw" + (cur.toUpperCase() === b.hex ? " on" : ""), title: b.nome, "aria-label": b.nome, style: "background:" + b.hex,
        onclick: function () { set(b.hex); draw(); commit(); renderProps(); renderTema(); } }));
    });
    box.appendChild(h("button", { class: "cw none" + (cur === "transparent" ? " on" : ""), title: "Sem cor", "aria-label": "Sem cor", onclick: function () { set("transparent"); draw(); commit(); renderProps(); } }));
    var hex = E.col(cur, st.doc);
    var pick = h("input", { type: "color", value: /^#[0-9a-f]{6}$/i.test(hex) ? hex : "#000000", title: "Escolher qualquer cor", "aria-label": "Escolher qualquer cor",
      oninput: function () { set(pick.value); draw(); commitSoon(); }, onchange: function () { commit(); renderProps(); } });
    box.appendChild(h("label", { class: "cw pick" }, [pick]));
    return h("div", { class: "prow colr" }, [h("label", { text: label }), box]);
  }

  /* ---------- Painel de propriedades ---------- */
  function renderProps() {
    var p = $("#props"); p.innerHTML = "";
    var l = layer();
    if (!l) { renderDocProps(p); return; }
    var head = h("div", { class: "phead" }, [
      h("h2", { text: TYPE_NOME[l.type] }),
      h("div", { class: "pacts" }, [
        h("button", { class: "ib", title: "Duplicar (Ctrl+D)", "aria-label": "Duplicar", html: svgI("i-copy"), onclick: dup }),
        h("button", { class: "ib" + (l.locked ? " act" : ""), title: l.locked ? "Destravar (Ctrl+L)" : "Travar (Ctrl+L)", "aria-label": "Travar", html: svgI(l.locked ? "i-lock" : "i-unlock"), onclick: function () { toggleLock(); } }),
        h("button", { class: "ib danger", title: "Apagar (Delete)", "aria-label": "Apagar", html: svgI("i-trash"), onclick: del })
      ])
    ]);
    p.appendChild(head);
    var c = h("div", { class: "pbody" });
    p.appendChild(c);
    if (l.locked) c.appendChild(h("p", { class: "hint warn", text: "Camada travada: destrave para mover ou editar." }));

    if (l.type === "text") {
      var ta = h("textarea", { id: "propText", rows: 3, "aria-label": "Conteúdo do texto", oninput: function () { l.text = ta.value; E.fitText(l); draw(); commitSoon(); } });
      ta.value = l.text;
      c.appendChild(sec("Conteúdo", [ta, h("p", { class: "hint", text: "Dica: dê dois cliques no texto da arte para editar ali mesmo." })]));
      c.appendChild(sec("Fonte", [
        sel("Família", E.FONTS.map(function (f) { return [f.f, f.nome]; }), function () { return l.font; }, function (v) {
          l.font = v; var f = E.FONTS.filter(function (x) { return x.f === v; })[0];
          if (f && f.pesos.indexOf(l.weight) < 0) l.weight = f.pesos[f.pesos.length - 1];
          E.loadFonts(st.doc).then(draw);
        }),
        sel("Peso", (E.FONTS.filter(function (x) { return x.f === l.font; })[0] || E.FONTS[0]).pesos.map(function (w) { return [w, { 400: "Regular", 500: "Médio", 600: "Semi", 700: "Negrito", 800: "Extra", 900: "Black" }[w]]; }), function () { return l.weight; }, function (v) { l.weight = +v; E.loadFonts(st.doc).then(draw); }),
        slider("Tamanho", function () { return l.size; }, function (v) { l.size = v; E.fitText(l); }, 10, 400, 1, " px"),
        colorRow("Cor", function () { return l.color; }, function (v) { l.color = v; }),
        seg("Alinhar", [["left", "#i-al-l", "Esquerda"], ["center", "#i-al-c", "Centro"], ["right", "#i-al-r", "Direita"]], function () { return l.align; }, function (v) { l.align = v; }),
        slider("Altura da linha", function () { return l.lh || 1.15; }, function (v) { l.lh = v; E.fitText(l); }, 0.7, 2, 0.02),
        slider("Espaçamento", function () { return l.ls || 0; }, function (v) { l.ls = v; E.fitText(l); }, -10, 30, 0.5, " px"),
        h("div", { class: "cks" }, [
          check("MAIÚSCULAS", function () { return l.upper; }, function (v) { l.upper = v; E.fitText(l); }),
          check("Itálico", function () { return l.italic; }, function (v) { l.italic = v; E.loadFonts(st.doc).then(draw); })
        ])
      ]));
      l.shadow = l.shadow || { on: false, color: "rgba(0,0,0,.45)", blur: 18, x: 0, y: 4 };
      l.stroke = l.stroke || { on: false, w: 4, color: "#04341A" };
      l.hl = l.hl || { on: false, color: "@accent", pad: 14, radius: 8 };
      c.appendChild(sec("Efeitos", [
        check("Sombra", function () { return l.shadow.on; }, function (v) { l.shadow.on = v; }),
        l.shadow.on ? slider("Desfoque", function () { return l.shadow.blur; }, function (v) { l.shadow.blur = v; }, 0, 60) : null,
        l.shadow.on ? slider("Distância", function () { return l.shadow.y; }, function (v) { l.shadow.y = v; }, -30, 30) : null,
        check("Contorno", function () { return l.stroke.on; }, function (v) { l.stroke.on = v; }),
        l.stroke.on ? slider("Espessura", function () { return l.stroke.w; }, function (v) { l.stroke.w = v; }, 1, 24) : null,
        l.stroke.on ? colorRow("Cor do contorno", function () { return l.stroke.color; }, function (v) { l.stroke.color = v; }) : null,
        check("Fundo de destaque", function () { return l.hl.on; }, function (v) { l.hl.on = v; }),
        l.hl.on ? colorRow("Cor do destaque", function () { return l.hl.color; }, function (v) { l.hl.color = v; }) : null,
        l.hl.on ? slider("Margem", function () { return l.hl.pad; }, function (v) { l.hl.pad = v; }, 0, 50) : null,
        l.hl.on ? slider("Cantos", function () { return l.hl.radius; }, function (v) { l.hl.radius = v; }, 0, 60) : null
      ]));
    }

    if (l.type === "image") {
      c.appendChild(sec("Foto", [
        h("div", { class: "imgprev" }, [h("img", { src: l.src || "", alt: "" })]),
        h("div", { class: "grid2" }, [
          h("button", { class: "btn btn-q btn-s", html: svgI("i-img") + "<span>Fotos do guia</span>", onclick: function () { openTab("fotos"); } }),
          h("button", { class: "btn btn-q btn-s", html: svgI("i-upload") + "<span>Enviar</span>", onclick: function () { pickFile(function (i) { setPhoto(i.src); }, l.fit === "contain"); } })
        ]),
        h("button", { class: "btn btn-s " + (st.crop ? "btn-pri" : "btn-q"), html: svgI("i-crop") + "<span>" + (st.crop ? "Concluir enquadramento" : "Ajustar enquadramento") + "</span>", onclick: function () { st.crop = !st.crop; drawSel(); renderProps(); } }),
        seg("Encaixe", [["cover", "Preencher"], ["contain", "Inteira"]], function () { return l.fit || "cover"; }, function (v) { l.fit = v; }),
        l.fit !== "contain" ? slider("Zoom", function () { return l.zoom || 1; }, function (v) { l.zoom = v; }, 1, 5, 0.01) : null,
        slider("Posição horizontal", function () { return Math.round((l.fx == null ? 0.5 : l.fx) * 100); }, function (v) { l.fx = v / 100; }, 0, 100),
        slider("Posição vertical", function () { return Math.round((l.fy == null ? 0.5 : l.fy) * 100); }, function (v) { l.fy = v / 100; }, 0, 100)
      ]));
      l.overlay = l.overlay || { color: "#000000", opacity: 0, grad: "none" };
      c.appendChild(sec("Ajustes", [
        slider("Brilho", function () { return l.br || 100; }, function (v) { l.br = v; }, 30, 180, 1, "%"),
        slider("Contraste", function () { return l.ct || 100; }, function (v) { l.ct = v; }, 30, 180, 1, "%"),
        slider("Saturação", function () { return l.sat == null ? 100 : l.sat; }, function (v) { l.sat = v; }, 0, 200, 1, "%"),
        seg("Máscara", [["rect", "Retângulo"], ["circle", "Círculo"]], function () { return l.mask || "rect"; }, function (v) { l.mask = v; }),
        l.mask !== "circle" ? slider("Cantos", function () { return l.radius || 0; }, function (v) { l.radius = v; }, 0, 400) : null,
        slider("Filtro escuro", function () { return Math.round((l.overlay.opacity || 0) * 100); }, function (v) { l.overlay.opacity = v / 100; }, 0, 100, 1, "%"),
        l.overlay.opacity > 0 ? colorRow("Cor do filtro", function () { return l.overlay.color; }, function (v) { l.overlay.color = v; }) : null,
        l.overlay.opacity > 0 ? seg("Filtro", [["none", "Uniforme"], ["down", "Embaixo"], ["up", "Em cima"]], function () { return l.overlay.grad || "none"; }, function (v) { l.overlay.grad = v; }) : null,
        check("Borda", function () { return l.border && l.border.w > 0; }, function (v) { l.border = v ? { w: 16, color: "#FFFFFF" } : null; }),
        l.border && l.border.w > 0 ? slider("Espessura da borda", function () { return l.border.w; }, function (v) { l.border.w = v; }, 1, 60) : null,
        l.border && l.border.w > 0 ? colorRow("Cor da borda", function () { return l.border.color; }, function (v) { l.border.color = v; }) : null
      ]));
    }

    if (l.type === "shape") {
      c.appendChild(sec("Forma", [
        sel("Tipo", [["rect", "Retângulo"], ["circle", "Círculo"], ["faixa", "Faixa inclinada"], ["estrela", "Estrela"]], function () { return l.shape; }, function (v) { l.shape = v; }),
        colorRow("Preenchimento", function () { return l.fill; }, function (v) { l.fill = v; }),
        seg("Degradê", [["none", "Não"], ["down", "↓"], ["up", "↑"], ["right", "→"]], function () { return l.grad || "none"; }, function (v) { l.grad = v; }),
        l.shape === "rect" ? slider("Cantos", function () { return l.radius || 0; }, function (v) { l.radius = v; }, 0, 500) : null,
        l.shape === "faixa" ? slider("Inclinação", function () { return Math.round((l.skew == null ? 0.35 : l.skew) * 100); }, function (v) { l.skew = v / 100; }, 0, 100) : null,
        slider("Contorno", function () { return l.strokeW || 0; }, function (v) { l.strokeW = v; if (v && !l.stroke) l.stroke = "@ink"; }, 0, 40),
        l.strokeW ? colorRow("Cor do contorno", function () { return l.stroke; }, function (v) { l.stroke = v; }) : null,
        l.strokeW ? check("Tracejado (picote)", function () { return l.dash; }, function (v) { l.dash = v; }) : null
      ]));
    }

    if (l.type === "logo") {
      c.appendChild(sec("Logo", [
        seg("Versão", [["clara", "Clara"], ["escura", "Escura"], ["auto", "Automática"], ["simbolo", "Símbolo"]], function () { return l.variant; }, function (v) { l.variant = v; l.w = E.logoWidth(l); }),
        slider("Tamanho", function () { return l.h; }, function (v) { l.h = v; l.w = E.logoWidth(l); }, 20, 400)
      ]));
    }

    if (l.type === "qr") {
      var qi = h("input", { type: "url", value: l.text, "aria-label": "Link do QR", oninput: function () { l.text = qi.value; draw(); commitSoon(); } });
      c.appendChild(sec("QR code", [row("Link ou texto", qi),
        colorRow("Cor", function () { return l.color; }, function (v) { l.color = v; }),
        colorRow("Fundo", function () { return l.bg; }, function (v) { l.bg = v; }),
        slider("Cantos", function () { return l.radius || 0; }, function (v) { l.radius = v; }, 0, 80),
        h("p", { class: "hint", text: "Teste a leitura com a câmera do celular antes de publicar." })
      ]));
    }

    if (l.type === "icon") {
      if (l.emoji) {
        var ei = h("input", { type: "text", value: l.emoji, "aria-label": "Emoji", oninput: function () { l.emoji = ei.value; draw(); commitSoon(); } });
        c.appendChild(sec("Emoji", [row("Emoji", ei), h("p", { class: "hint", text: "A aparência do emoji depende do sistema do aparelho." })]));
      } else {
        c.appendChild(sec("Ícone", [
          h("div", { class: "grid6" }, Object.keys(E.ICONS).map(function (n) {
            return h("button", { class: "icb" + ((l.icon || l.name) === n ? " on" : ""), title: E.ICON_NAMES[n], "aria-label": E.ICON_NAMES[n], html: '<svg viewBox="0 0 24 24"><path d="' + E.ICONS[n] + '"/></svg>', onclick: function () { l.icon = n; l.name = "Ícone " + (E.ICON_NAMES[n] || n); draw(); commit(); renderProps(); } });
          })),
          colorRow("Cor", function () { return l.color; }, function (v) { l.color = v; }),
          colorRow("Fundo redondo", function () { return l.bgc || "transparent"; }, function (v) { l.bgc = v; }),
          check("Preenchido", function () { return l.filled; }, function (v) { l.filled = v; }),
          !l.filled ? slider("Traço", function () { return l.sw || 1.9; }, function (v) { l.sw = v; }, 0.6, 4, 0.1) : null
        ]));
      }
    }

    if (l.type === "badge") {
      var i0 = h("input", { type: "text", value: l.top || "", placeholder: "opcional", "aria-label": "Linha de cima", oninput: function () { l.top = i0.value; draw(); commitSoon(); } });
      var i1 = h("input", { type: "text", value: l.line1 || "", "aria-label": "Preço", oninput: function () { l.line1 = i1.value; draw(); commitSoon(); } });
      var i2 = h("input", { type: "text", value: l.line2 || "", "aria-label": "Linha de baixo", oninput: function () { l.line2 = i2.value; draw(); commitSoon(); } });
      c.appendChild(sec("Selo de preço", [row("Em cima", i0), row("Destaque", i1), row("Embaixo", i2),
        sel("Formato", [["circle", "Círculo"], ["estrela", "Estrela"], ["pilula", "Pílula"], ["etiqueta", "Etiqueta"]], function () { return l.shape; }, function (v) { l.shape = v; }),
        sel("Fonte", E.FONTS.map(function (f) { return [f.f, f.nome]; }), function () { return l.font; }, function (v) { l.font = v; E.loadFonts(st.doc).then(draw); }),
        colorRow("Fundo", function () { return l.fill; }, function (v) { l.fill = v; }),
        colorRow("Texto", function () { return l.color; }, function (v) { l.color = v; }),
        slider("Tamanho do destaque", function () { return Math.round((l.s1 || 0.34) * 100); }, function (v) { l.s1 = v / 100; }, 10, 70),
        slider("Tamanho das linhas", function () { return Math.round((l.s2 || 0.12) * 100); }, function (v) { l.s2 = v / 100; }, 5, 30),
        check("Anel interno", function () { return l.ring; }, function (v) { l.ring = v; })
      ]));
    }

    /* Posição e ordem (todas as camadas) */
    c.appendChild(sec("Posição", [
      h("div", { class: "alg" }, [["l", "i-al-l", "Encostar à esquerda"], ["c", "i-al-c", "Centralizar na horizontal"], ["r", "i-al-r", "Encostar à direita"], ["t", "i-al-t", "Encostar no topo"], ["m", "i-al-m", "Centralizar na vertical"], ["b", "i-al-b", "Encostar embaixo"]].map(function (a) {
        return h("button", { class: "ib", title: a[2], "aria-label": a[2], html: svgI(a[1]), onclick: function () { align(a[0]); } });
      })),
      h("div", { class: "nums" }, [
        num("X", function () { return l.x; }, function (v) { l.x = v; }),
        num("Y", function () { return l.y; }, function (v) { l.y = v; }),
        num("L", function () { return l.w; }, function (v) { l.w = Math.max(10, v); E.fitText(l); }),
        l.type === "text" ? null : num("A", function () { return l.h; }, function (v) { l.h = Math.max(10, v); }),
        num("Giro", function () { return l.rot || 0; }, function (v) { l.rot = v; })
      ]),
      slider("Opacidade", function () { return Math.round((l.opacity == null ? 1 : l.opacity) * 100); }, function (v) { l.opacity = v / 100; }, 0, 100, 1, "%"),
      h("div", { class: "ordr" }, [
        h("button", { class: "btn btn-q btn-s", html: svgI("i-up") + "<span>Para frente</span>", title: "Ctrl+]", onclick: function () { order(1); } }),
        h("button", { class: "btn btn-q btn-s", html: svgI("i-dn") + "<span>Para trás</span>", title: "Ctrl+[", onclick: function () { order(-1); } }),
        h("button", { class: "btn btn-q btn-s", text: "Na frente de tudo", title: "Ctrl+Shift+]", onclick: function () { order("top"); } }),
        h("button", { class: "btn btn-q btn-s", text: "Atrás de tudo", title: "Ctrl+Shift+[", onclick: function () { order("bottom"); } })
      ])
    ]));
    if (l.locked) $$("input,select,textarea", c).forEach(function (i) { i.disabled = true; });
  }

  function renderDocProps(p) {
    p.appendChild(h("div", { class: "phead" }, [h("h2", { text: "Arte" })]));
    var c = h("div", { class: "pbody" }); p.appendChild(c);
    c.appendChild(sec("Paleta", [h("div", { class: "themes sm" }, Object.keys(E.THEMES).map(function (k) {
      var t = E.THEMES[k];
      return h("button", { class: "theme" + (st.doc.theme === k ? " on" : ""), onclick: function () { st.doc.theme = k; commit(); draw(); renderTema(); renderProps(); } }, [
        h("span", { class: "th-sw", style: "background:" + t.bg }, [h("i", { style: "background:" + t.accent }), h("i", { style: "background:" + t.soft })]), h("b", { text: t.nome })
      ]);
    }))]));
    c.appendChild(sec("Fundo", [colorRow("Cor de fundo", function () { return st.doc.bg; }, function (v) { st.doc.bg = v; })]));
    c.appendChild(sec("Atalhos", [h("dl", { class: "keys", html:
      "<dt>Ctrl Z</dt><dd>Desfazer</dd><dt>Ctrl Shift Z</dt><dd>Refazer</dd><dt>Ctrl D</dt><dd>Duplicar</dd><dt>Delete</dt><dd>Apagar</dd>" +
      "<dt>Setas</dt><dd>Mover 1 px (Shift: 10)</dd><dt>Ctrl ] / [</dt><dd>Frente / trás</dd><dt>Ctrl L</dt><dd>Travar</dd><dt>Ctrl C / V</dt><dd>Copiar / colar</dd>" +
      "<dt>Ctrl S</dt><dd>Salvar</dd><dt>Ctrl E</dt><dd>Baixar PNG</dd><dt>2 cliques</dt><dd>Editar texto ou enquadrar foto</dd><dt>Shift</dt><dd>Girar de 15 em 15°, soltar dos guias</dd>" })]));
  }

  /* ---------- Abas e folhas (celular) ---------- */
  function openTab(tab) {
    $$(".tabs button").forEach(function (b) { b.classList.toggle("on", b.dataset.tab === tab); });
    $$(".tabp").forEach(function (p) { p.classList.toggle("on", p.dataset.panel === tab); });
    if (tab === "fotos") renderFotos();
    if (isMobile()) openSheet(tab);
  }
  $$(".tabs button").forEach(function (b) { b.addEventListener("click", function () { openTab(b.dataset.tab); }); });
  function isMobile() { return window.matchMedia("(max-width: 899px)").matches; }
  function openSheet(k) {
    var L = $("#paneL"), R = $("#paneR");
    var same = (k === "props" ? R : L).classList.contains("open") && (k === "props" || $(".tabs button.on").dataset.tab === k);
    L.classList.remove("open"); R.classList.remove("open");
    $$("#mobileBar button").forEach(function (b) { b.classList.remove("on"); });
    if (same) return;
    if (k === "props") R.classList.add("open");
    else {
      $$(".tabs button").forEach(function (b) { b.classList.toggle("on", b.dataset.tab === k); });
      $$(".tabp").forEach(function (p) { p.classList.toggle("on", p.dataset.panel === k); });
      if (k === "fotos") renderFotos();
      L.classList.add("open");
    }
    var mb = $('#mobileBar [data-sheet="' + k + '"]'); if (mb) mb.classList.add("on");
  }
  function closeSheetsMobile() { if (!isMobile()) return; $("#paneL").classList.remove("open"); $("#paneR").classList.remove("open"); $$("#mobileBar button").forEach(function (b) { b.classList.remove("on"); }); }
  $$("#mobileBar button").forEach(function (b) { b.addEventListener("click", function () { openSheet(b.dataset.sheet); }); });
  $$(".pane").forEach(function (p) {
    p.insertBefore(h("button", { class: "sheet-x", "aria-label": "Fechar painel", html: svgI("i-x"), onclick: closeSheetsMobile }), p.firstChild);
  });

  /* ---------- Barra do topo ---------- */
  $("#btnUndo").addEventListener("click", undo);
  $("#btnRedo").addEventListener("click", redo);
  $("#docName").addEventListener("input", function (e) { st.doc.name = e.target.value; commitSoon(); });
  $("#selFormato").addEventListener("change", function (e) { changeFormat(+e.target.value); });
  $("#zIn").addEventListener("click", function () { setZoom(st.zoom * 1.2); });
  $("#zOut").addEventListener("click", function () { setZoom(st.zoom / 1.2); });
  $("#zFit").addEventListener("click", function () { st.fit = true; applySize(); });
  $("#btnExportar").addEventListener("click", exportar);
  $("#btnSalvar").addEventListener("click", salvar);
  $("#btnGaleria").addEventListener("click", function () { showGal(true); });
  $("#btnGerar").addEventListener("click", abrirGerador);

  function changeFormat(H) {
    var d = st.doc, H0 = d.h;
    if (H === H0) return;
    d.layers.forEach(function (l) {
      var full = l.x <= 1 && l.y <= 1 && l.x + l.w >= d.w - 1 && l.y + l.h >= H0 - 1;
      if (full) { l.h = H; return; }
      var cy = l.y + l.h / 2;
      l.y = Math.round(cy * H / H0 - l.h / 2);
    });
    d.h = H;
    st.fit = true; applySize(); draw(); commit(); renderProps();
    toast("Formato trocado. Confira as posições.");
  }

  function exportar() {
    if (st.editing) endEdit();
    toast("Preparando o PNG…");
    E.downloadPNG(st.doc).then(function () { toast("PNG baixado (" + st.doc.w + " × " + st.doc.h + ")."); })
      .catch(function (e) {
        console.warn(e);
        toast(location.protocol === "file:" ? "O navegador bloqueia o PNG com o arquivo aberto do disco. Abra pelo endereço do site ou por um servidor local." : "Não foi possível gerar o PNG. Tente trocar fotos externas.", 6000);
      });
  }

  /* ---------- Projetos (localStorage) ---------- */
  function projetos() { return lsGet("estudio.projetos", []); }
  function salvar() {
    if (st.editing) endEdit();
    var list = projetos(), d = st.doc, thumb = "";
    try { thumb = E.toCanvas(d, 0.22).toDataURL("image/jpeg", 0.7); } catch (e) { thumb = ""; }
    if (!d.projId) d.projId = "p" + Date.now().toString(36);
    var item = { id: d.projId, nome: d.name || "Arte sem nome", atualizado: Date.now(), doc: d, thumb: thumb };
    list = list.filter(function (x) { return x.id !== d.projId; });
    list.unshift(item);
    if (lsSet("estudio.projetos", list)) { toast("Salvo em Meus projetos, neste navegador."); }
    else {
      toast("Sem espaço no navegador. Apague projetos antigos ou use fotos menores.", 6000);
    }
    updCounts();
  }

  /* ---------- Teclado ---------- */
  document.addEventListener("keydown", function (e) {
    var tg = e.target, typing = /INPUT|TEXTAREA|SELECT/.test(tg.tagName) || tg.isContentEditable;
    var mod = e.ctrlKey || e.metaKey, k = e.key.toLowerCase();
    if ($("#gal").classList.contains("on") || $("#dlgGerar").open) return;
    if (mod && k === "s") { e.preventDefault(); salvar(); return; }
    if (mod && k === "e") { e.preventDefault(); exportar(); return; }
    if (typing) return;
    if (mod && k === "z") { e.preventDefault(); if (e.shiftKey) redo(); else undo(); return; }
    if (mod && k === "y") { e.preventDefault(); redo(); return; }
    var l = layer();
    if (mod && k === "c" && l) { st.clip = E.clone(l); toast("Camada copiada."); return; }
    if (mod && k === "v" && st.clip) { e.preventDefault(); var c = E.clone(st.clip); c.id = E.uid(); c.x += 30; c.y += 30; st.clip = E.clone(c); st.doc.layers.push(c); select(c.id); commit(); renderLayers(); draw(); return; }
    if (!l) return;
    if (mod && k === "d") { e.preventDefault(); dup(); return; }
    if (mod && k === "l") { e.preventDefault(); toggleLock(); return; }
    if (mod && (e.key === "]" || e.code === "BracketRight")) { e.preventDefault(); order(e.shiftKey ? "top" : 1); return; }
    if (mod && (e.key === "[" || e.code === "BracketLeft")) { e.preventDefault(); order(e.shiftKey ? "bottom" : -1); return; }
    if (k === "delete" || k === "backspace") { e.preventDefault(); if (!l.locked) del(); return; }
    if (k === "escape") { if (st.crop) { st.crop = false; drawSel(); renderProps(); } else select(null); return; }
    if (k === "enter" && l.type === "text" && !l.locked) { e.preventDefault(); startEdit(l); return; }
    var mv = { arrowleft: [-1, 0], arrowright: [1, 0], arrowup: [0, -1], arrowdown: [0, 1] }[k];
    if (mv && !l.locked) { e.preventDefault(); var s = e.shiftKey ? 10 : 1; l.x += mv[0] * s; l.y += mv[1] * s; draw(); commitSoon(); }
  });

  /* ---------- Galeria ---------- */
  function showGal(on) {
    $("#gal").classList.toggle("on", on);
    document.body.classList.toggle("gal-open", on);
    $("#gVoltar").hidden = !st.aberto;
    if (on) renderGal();
  }
  function updCounts() {
    $("#nModelos").textContent = st.modelos.length;
    $("#nGerados").textContent = st.gerados.length;
    $("#nProjetos").textContent = projetos().length;
  }
  $$("#gTabs button").forEach(function (b) { b.addEventListener("click", function () { st.gTab = b.dataset.g; $$("#gTabs button").forEach(function (x) { x.classList.toggle("on", x === b); }); renderGal(); }); });
  $$("#gFiltro button").forEach(function (b) { b.addEventListener("click", function () { st.gFiltro = b.dataset.f; $$("#gFiltro button").forEach(function (x) { x.classList.toggle("on", x === b); }); renderGal(); }); });
  $("#gNovo").addEventListener("click", function () { openDoc(E.newDoc("Arte sem nome", 1080, "verde", [E.L.logo(72, 958, 50, "auto", { name: "Logo" })])); });
  $("#gVoltar").addEventListener("click", function () { showGal(false); });
  $("#gGerar").addEventListener("click", abrirGerador);
  $("#gExportarTodas").addEventListener("click", exportarTodas);

  function galItems() {
    var f = st.gFiltro;
    var src = st.gTab === "modelos" ? st.modelos : st.gTab === "gerados" ? st.gerados : projetos().map(function (p) { var d = p.doc; d.projId = p.id; d._thumb = p.thumb; d._at = p.atualizado; return d; });
    return src.filter(function (d) { return f === "todos" || !d.publico || d.publico === f; });
  }
  var thumbQueue = [], thumbBusy = false, galToken = 0;
  function renderGal() {
    updCounts();
    var g = $("#gGrid"); g.innerHTML = "";
    galToken++;
    thumbQueue = [];
    var items = galItems();
    $("#gFiltro").style.visibility = st.gTab === "projetos" ? "hidden" : "";
    $("#gExportarTodas").disabled = !items.length;
    if (!items.length) {
      var msg = st.gTab === "gerados" ? ["Nenhum criativo gerado ainda.", "Gerar criativos", abrirGerador] : st.gTab === "projetos" ? ["Nenhum projeto salvo neste navegador.", "Começar uma arte em branco", function () { $("#gNovo").click(); }] : ["Nenhum modelo neste filtro.", null];
      g.appendChild(h("div", { class: "empty" }, [h("p", { text: msg[0] }), msg[1] ? h("button", { class: "btn btn-pri", text: msg[1], onclick: msg[2] }) : null]));
      return;
    }
    items.forEach(function (d, i) {
      var c = h("canvas", { width: 300, height: Math.round(300 * d.h / d.w), class: "gthumb", "aria-hidden": "true" });
      var fmtN = d.h === 1920 ? "Story" : d.h === 1350 ? "Retrato" : "Feed";
      var card = h("article", { class: "gcard " + (d.h === 1920 ? "story" : d.h === 1350 ? "ret" : "feed") }, [
        h("button", { class: "gopen", "aria-label": "Abrir " + (d.titulo || d.name) + " no editor", onclick: function () { openDoc(d, st.gTab === "projetos"); } }, [c]),
        h("div", { class: "gmeta" }, [
          h("b", { text: d.titulo || d.name || "Arte" }),
          h("span", { class: "gtags" }, [d.publico ? h("em", { class: "pub-" + d.publico, text: d.publico === "anunciante" ? "Anunciante" : "Consumidor" }) : null, h("em", { text: fmtN })]),
          h("div", { class: "gact" }, [
            h("button", { class: "ib ib-s", title: "Baixar PNG", "aria-label": "Baixar PNG", html: svgI("i-down"), onclick: function () { E.downloadPNG(d).then(function () { toast("PNG baixado."); }).catch(function () { toast("Não foi possível gerar o PNG."); }); } }),
            st.gTab !== "modelos" ? h("button", { class: "ib ib-s danger", title: "Remover", "aria-label": "Remover", html: svgI("i-trash"), onclick: function () { removerItem(d); } }) : null
          ])
        ])
      ]);
      g.appendChild(card);
      thumbQueue.push({ c: c, d: d, t: galToken });
    });
    pumpThumbs();
  }
  function pumpThumbs() {
    if (thumbBusy) return;
    var job = thumbQueue.shift();
    if (!job) return;
    if (job.t !== galToken) { pumpThumbs(); return; }
    thumbBusy = true;
    E.preload(job.d).then(function () {
      try { E.render(job.c.getContext("2d"), job.d, { scale: job.c.width / job.d.w }); } catch (e) { console.warn(e); }
      thumbBusy = false;
      setTimeout(pumpThumbs, 0);
    });
  }
  function removerItem(d) {
    if (st.gTab === "gerados") { st.gerados = st.gerados.filter(function (x) { return x !== d; }); lsSet("estudio.gerados", st.gerados); }
    else if (st.gTab === "projetos") { lsSet("estudio.projetos", projetos().filter(function (p) { return p.id !== d.projId; })); }
    renderGal();
  }
  var exporting = false;
  function exportarTodas() {
    if (exporting) { exporting = false; return; }
    var items = galItems();
    if (!items.length) return;
    exporting = true;
    var btn = $("#gExportarTodas"), i = 0;
    btn.querySelector("span").textContent = "Parar";
    (function next() {
      if (!exporting || i >= items.length) {
        exporting = false;
        btn.querySelector("span").textContent = "Baixar todas desta aba";
        toast(i >= items.length ? items.length + " PNGs baixados. Se o navegador perguntar, permita vários downloads." : "Download interrompido em " + i + " de " + items.length + ".", 5000);
        return;
      }
      toast("Baixando " + (i + 1) + " de " + items.length + "…", 8000);
      E.downloadPNG(items[i]).catch(function (e) { console.warn(e); }).then(function () { i++; setTimeout(next, 450); });
    })();
  }

  /* ---------- Gerador ---------- */
  function abrirGerador() {
    if (!E.seed.ok) { toast("A base do guia não carregou. Abra o estúdio pelo endereço do site."); return; }
    var sel = $("#gCidade");
    if (!sel.options.length) {
      var regs = E.S().regioes(), cids = E.S().cidades();
      sel.appendChild(h("option", { value: "todas", text: "Todas as regiões" }));
      var og = h("optgroup", { label: "Regiões" });
      Object.keys(regs).sort().forEach(function (k) { og.appendChild(h("option", { value: k, text: E.regNome(k) + " (" + regs[k] + ")" })); });
      ["houston", "austin", "san-antonio"].forEach(function (k) { if (!regs[k] && !cids[E.regNome(k)]) og.appendChild(h("option", { value: k, text: E.regNome(k) + " (em breve)", disabled: true })); });
      sel.appendChild(og);
      var oc = h("optgroup", { label: "Cidades com mais lugares" });
      Object.keys(cids).sort(function (a, b) { return cids[b] - cids[a]; }).slice(0, 14).forEach(function (c) { oc.appendChild(h("option", { value: c.toLowerCase(), text: c + " (" + cids[c] + ")" })); });
      sel.appendChild(oc);
    }
    $("#dlgGerar").showModal();
  }
  $("#formGerar").addEventListener("submit", function (e) {
    var sub = e.submitter && e.submitter.value;
    if (sub !== "ok") return;
    var fd = new FormData(e.target), opt = {};
    fd.forEach(function (v, k) { opt[k] = v; });
    var docs = E.gerar(opt);
    if (!docs.length) { toast("Não há dados suficientes para esse filtro. Tente outra região ou tipo.", 5000); return; }
    docs.forEach(function (d) { d.geradoEm = Date.now(); });
    st.gerados = docs.concat(st.gerados).slice(0, 60);
    lsSet("estudio.gerados", st.gerados);
    st.gTab = "gerados"; st.gFiltro = "todos";
    $$("#gTabs button").forEach(function (x) { x.classList.toggle("on", x.dataset.g === "gerados"); });
    $$("#gFiltro button").forEach(function (x) { x.classList.toggle("on", x.dataset.f === "todos"); });
    showGal(true);
    toast(docs.length + " criativos gerados. Toque em um para editar.", 4000);
  });

  /* ---------- Início ---------- */
  function boot() {
    renderAdd(); renderLayers(); renderTema(); renderProps(); updHist();
    var sizer = h("div", { id: "stageSizer" }); wrap.insertBefore(sizer, wrap.firstChild);
    applySize();
    var fontLoads = [];
    if (document.fonts && document.fonts.load) E.FONTS.forEach(function (f) {
      f.pesos.forEach(function (w) { fontLoads.push(document.fonts.load(w + " 40px \"" + f.f + "\"").catch(function () {})); if (f.f === "Fraunces" || f.f === "Playfair Display") fontLoads.push(document.fonts.load("italic " + w + " 40px \"" + f.f + "\"").catch(function () {})); });
    });
    var fontsReady = Promise.race([Promise.all(fontLoads), new Promise(function (r) { setTimeout(r, 6000); })]);
    showGal(true);
    $("#gGrid").innerHTML = '<div class="empty"><p>Carregando a base do guia…</p></div>';
    Promise.all([E.loadSeed().catch(function (e) { return { erro: e }; }), fontsReady]).then(function (r) {
      if (r[0] && r[0].erro) {
        $("#gGrid").innerHTML = "";
        $("#gGrid").appendChild(h("div", { class: "empty" }, [
          h("p", { text: "Não consegui ler a base do guia (../data/seed.json)." }),
          h("p", { class: "muted", text: location.protocol === "file:" ? "Abra o estúdio pelo endereço do site (ex.: https://seudominio/estudio/) ou rode um servidor local na pasta do site. Veja o LEIA-ME.txt." : "Confira se a pasta data/ está publicada junto com o site." })
        ]));
        return;
      }
      st.modelos = E.buildModelos();
      buildFotos();
      var atual = lsGet("estudio.atual", null);
      if (atual && atual.layers && atual.layers.length) {
        st.doc = atual; st.hist = [snap()]; st.hi = 0; st.aberto = true; updHist();
        applySize(); E.preload(st.doc).then(draw); draw(); renderLayers(); renderTema(); renderProps(); syncTop();
      }
      renderGal();
    });
    if (document.fonts) document.fonts.addEventListener && document.fonts.addEventListener("loadingdone", draw);
  }
  boot();
})();
