/* Estúdio CoraçãoBR: núcleo (modelo da arte, temas, renderizador em canvas, dados do guia).
   Um único renderizador desenha a tela do editor, as miniaturas e o PNG exportado, para que o
   arquivo baixado seja igual ao que se vê. */
(function () {
  "use strict";
  var E = (window.E = {});

  /* ---------- Marca ---------- */
  E.BRAND = [
    { hex: "#04341A", nome: "Verde profundo" },
    { hex: "#0B7A35", nome: "Verde" },
    { hex: "#34C46A", nome: "Verde claro" },
    { hex: "#FFC20E", nome: "Amarelo sol" },
    { hex: "#0E1311", nome: "Tinta" },
    { hex: "#F3F6F2", nome: "Fundo claro" },
    { hex: "#FFFFFF", nome: "Branco" }
  ];

  /* Papéis de cor: as artes usam "@papel" e trocam de paleta inteira num clique. */
  E.ROLES = [
    ["bg", "Fundo"], ["ink", "Texto"], ["accent", "Destaque"], ["accentInk", "Texto no destaque"],
    ["surface", "Cartão"], ["surfaceInk", "Texto no cartão"], ["soft", "Apoio"]
  ];
  E.THEMES = {
    verde:   { nome: "Verde",   bg: "#04341A", ink: "#FFFFFF", accent: "#FFC20E", accentInk: "#04341A", surface: "#0B7A35", surfaceInk: "#FFFFFF", soft: "#34C46A" },
    amarelo: { nome: "Amarelo", bg: "#FFC20E", ink: "#04341A", accent: "#04341A", accentInk: "#FFC20E", surface: "#FFFFFF", surfaceInk: "#04341A", soft: "#0B7A35" },
    escuro:  { nome: "Escuro",  bg: "#0E1311", ink: "#F3F6F2", accent: "#34C46A", accentInk: "#0E1311", surface: "#1C2420", surfaceInk: "#F3F6F2", soft: "#FFC20E" },
    claro:   { nome: "Claro",   bg: "#F3F6F2", ink: "#0E1311", accent: "#0B7A35", accentInk: "#FFFFFF", surface: "#FFFFFF", surfaceInk: "#0E1311", soft: "#FFC20E" },
    mata:    { nome: "Mata",    bg: "#0B7A35", ink: "#FFFFFF", accent: "#FFFFFF", accentInk: "#04341A", surface: "#04341A", surfaceInk: "#FFC20E", soft: "#FFC20E" }
  };

  E.FONTS = [
    { f: "Outfit", nome: "Outfit", pesos: [400, 500, 600, 700, 800, 900] },
    { f: "Bricolage Grotesque", nome: "Bricolage", pesos: [400, 500, 600, 700, 800] },
    { f: "Anton", nome: "Anton", pesos: [400] },
    { f: "Archivo Black", nome: "Archivo Black", pesos: [400] },
    { f: "Barlow Condensed", nome: "Barlow Condensed", pesos: [500, 700, 800] },
    { f: "Fraunces", nome: "Fraunces", pesos: [400, 500, 600, 700, 800, 900] },
    { f: "Playfair Display", nome: "Playfair", pesos: [500, 600, 700, 800, 900] },
    { f: "Caveat", nome: "Caveat (à mão)", pesos: [500, 700] }
  ];

  E.uid = function () { return "l" + Math.random().toString(36).slice(2, 9); };
  E.clone = function (o) { return JSON.parse(JSON.stringify(o)); };
  E.clamp = function (v, a, b) { return Math.max(a, Math.min(b, v)); };

  E.col = function (c, doc) {
    if (!c) return "rgba(0,0,0,0)";
    if (c === "transparent") return "rgba(0,0,0,0)";
    if (c.charAt(0) === "@") {
      var t = E.THEMES[(doc && doc.theme) || "verde"] || E.THEMES.verde;
      return t[c.slice(1)] || "#000";
    }
    return c;
  };
  E.rgba = function (hex, a) {
    if (!hex || hex.charAt(0) !== "#") return hex;
    var h = hex.slice(1);
    if (h.length === 3) h = h.replace(/./g, "$&$&");
    var n = parseInt(h.slice(0, 6), 16);
    return "rgba(" + (n >> 16 & 255) + "," + (n >> 8 & 255) + "," + (n & 255) + "," + a + ")";
  };

  /* ---------- Ícones vetoriais (traço, grade 24) ---------- */
  E.ICONS = {
    pin: "M12 21s-7-6.2-7-11.5a7 7 0 0 1 14 0C19 14.8 12 21 12 21zM12 12.5a3 3 0 1 0 0-6 3 3 0 0 0 0 6z",
    coracao: "M12 20s-8-4.9-8-10.8A4.6 4.6 0 0 1 12 6.6a4.6 4.6 0 0 1 8 2.6C20 15.1 12 20 12 20z",
    estrela: "m12 3 2.7 5.6 6.1.9-4.4 4.3 1 6.1L12 17l-5.4 2.9 1-6.1-4.4-4.3 6.1-.9z",
    check: "M4.5 12.5l5 5L19.5 7",
    calendario: "M4 6h16v14H4zM4 10h16M8 3v5M16 3v5",
    sino: "M6 16V11a6 6 0 0 1 12 0v5l2 2H4zM10 20.5a2 2 0 0 0 4 0",
    chat: "M4 5h16v11H9l-5 4z",
    cifrao: "M12 3v18M16.5 7.5C16 6 14.3 5 12 5 9.5 5 7.5 6.3 7.5 8.4c0 4.6 9 2.6 9 7.2 0 2.1-2 3.4-4.5 3.4-2.4 0-4.2-1.1-4.7-2.8",
    etiqueta: "M3 12V3h9l9 9-9 9zM8 9.5a1.5 1.5 0 1 0 0-3 1.5 1.5 0 0 0 0 3z",
    pata: "M12 20c-3 0-5-1.6-5-3.6 0-2.2 2.4-4.4 5-4.4s5 2.2 5 4.4c0 2-2 3.6-5 3.6zM6 10.5a1.8 2.2 0 1 0 0-4.4 1.8 2.2 0 0 0 0 4.4zM18 10.5a1.8 2.2 0 1 0 0-4.4 1.8 2.2 0 0 0 0 4.4zM9.5 7.5a1.8 2.3 0 1 0 0-4.6 1.8 2.3 0 0 0 0 4.6zM14.5 7.5a1.8 2.3 0 1 0 0-4.6 1.8 2.3 0 0 0 0 4.6z",
    casa: "M3 11 12 4l9 7M5 9.5V20h14V9.5M10 20v-6h4v6",
    mala: "M3 8h18v12H3zM8 8V5h8v3M3 13h18",
    grafico: "M4 20V4M4 20h16M8 16v-4M12 16V8M16 16v-6",
    foguete: "M12 15c4-3 6-7 6-12-5 0-9 2-12 6l-2 4 4 2zM9 15l-3 5M14 10a1.5 1.5 0 1 0 0-3 1.5 1.5 0 0 0 0 3zM5 19l2-2",
    escudo: "M12 3l8 3v6c0 5-3.5 8-8 9-4.5-1-8-4-8-9V6zM8.5 12l2.5 2.5 4.5-5",
    megafone: "M3 10v4h3l7 4V6L6 10zM16 9a4 4 0 0 1 0 6M18.5 6.5a7.5 7.5 0 0 1 0 11",
    presente: "M3 9h18v4H3zM5 13v8h14v-8M12 9v12M12 9C10 5 6.5 5 6.5 7S10 9 12 9zM12 9c2-4 5.5-4 5.5-2S14 9 12 9z",
    garfo: "M7 3v8M5 3v5a2 2 0 0 0 4 0V3M7 11v10M16 21V3c-2.2 0-3.5 3-3.5 7 0 2 1.2 3 3.5 3",
    sol: "M12 16a4 4 0 1 0 0-8 4 4 0 0 0 0 8zM12 2v2.5M12 19.5V22M2 12h2.5M19.5 12H22M4.9 4.9l1.8 1.8M17.3 17.3l1.8 1.8M4.9 19.1l1.8-1.8M17.3 6.7l1.8-1.8",
    seta: "M4 12h15M13 6l6 6-6 6",
    telefone: "M7 3h10v18H7zM11 18h2",
    usuarios: "M9 11a3.5 3.5 0 1 0 0-7 3.5 3.5 0 0 0 0 7zM2.5 20c.6-3.5 3.2-5.5 6.5-5.5s5.9 2 6.5 5.5M16 4.3a3.5 3.5 0 0 1 0 6.4M18 14.8c2 .7 3.2 2.6 3.5 5.2",
    raio: "M13 2 4 14h7l-1 8 9-12h-7z",
    pix: "M12 3l4.2 4.2-2.4 2.4L12 7.8l-1.8 1.8-2.4-2.4zM3 12l4.2-4.2 2.4 2.4L7.8 12l1.8 1.8-2.4 2.4zM21 12l-4.2 4.2-2.4-2.4 1.8-1.8-1.8-1.8 2.4-2.4zM12 21l-4.2-4.2 2.4-2.4 1.8 1.8 1.8-1.8 2.4 2.4z",
    qr: "M3 3h7v7H3zM14 3h7v7h-7zM3 14h7v7H3zM14 14h3v3h-3zM18 18h3v3h-3z",
    musica: "M9 18V5l11-2v13M9 18a3 3 0 1 1-6 0 3 3 0 0 1 6 0zM20 16a3 3 0 1 1-6 0 3 3 0 0 1 6 0z",
    lupa: "M11 18a7 7 0 1 0 0-14 7 7 0 0 0 0 14zM16 16l5 5",
    aviao: "M2 13l20-8-6 16-3.5-6.5zM12.5 14.5 22 5"
  };
  E.ICON_NAMES = {
    pin: "Local", coracao: "Coração", estrela: "Estrela", check: "Certo", calendario: "Data", sino: "Alerta", chat: "Conversa",
    cifrao: "Preço", etiqueta: "Etiqueta", pata: "Pet", casa: "Casa", mala: "Vaga", grafico: "Gráfico", foguete: "Impulso",
    escudo: "Verificado", megafone: "Anúncio", presente: "Presente", garfo: "Comida", sol: "Sol", seta: "Seta", telefone: "Celular",
    usuarios: "Comunidade", raio: "Rápido", pix: "Pix", qr: "QR", musica: "Música", lupa: "Busca", aviao: "Viagem"
  };
  var pathCache = {};
  function iconPath(n) {
    if (!pathCache[n]) pathCache[n] = new Path2D(E.ICONS[n] || E.ICONS.estrela);
    return pathCache[n];
  }

  /* ---------- Símbolo do logo (do index.html, class="bsym") ---------- */
  E.LOGO_SVG = '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 270 200" width="810" height="600"><defs>' +
    '<linearGradient id="hgL" x1="0" y1="0" x2=".8" y2="1"><stop offset="0" stop-color="#0AA23C"/><stop offset=".6" stop-color="#088F36"/><stop offset="1" stop-color="#05692A"/></linearGradient>' +
    '<linearGradient id="hgF" x1="0" y1="1" x2=".6" y2="0"><stop offset="0" stop-color="#05501F"/><stop offset="1" stop-color="#0B7A32" stop-opacity="0"/></linearGradient>' +
    '<linearGradient id="hgY" x1="0" y1="1" x2="1" y2="0"><stop offset="0" stop-color="#F7B500"/><stop offset="1" stop-color="#FFC20E"/></linearGradient>' +
    '<linearGradient id="hgC" x1="0" y1="1" x2="1" y2="0"><stop offset="0" stop-color="#078A35"/><stop offset=".8" stop-color="#0A9A3D"/><stop offset="1" stop-color="#46B86E"/></linearGradient>' +
    '</defs><g transform="scale(0.3333)">' +
    '<path fill="url(#hgL)" d="M270 30 C330 32 365 60 385 100 L330 190 C300 165 250 150 200 160 C160 168 148 200 152 240 C160 330 230 430 330 520 L368 556 C240 520 110 430 50 340 C10 270 15 160 70 90 C120 40 200 28 270 30 Z"/>' +
    '<path fill="url(#hgF)" d="M152 200 C160 120 195 66 250 38 L292 34 C238 66 210 112 206 162 C180 166 160 176 152 200 Z"/>' +
    '<path fill="url(#hgY)" d="M322 188 C360 110 440 30 540 22 C610 18 670 50 705 105 L640 148 C600 122 540 112 480 132 C440 146 410 190 386 255 Z"/>' +
    '<path fill="none" stroke="url(#hgC)" stroke-width="108" stroke-linecap="round" stroke-linejoin="round" d="M270 382 L394 518 L748 172"/>' +
    '</g></svg>';
  E.LOGO_URL = "data:image/svg+xml;charset=utf-8," + encodeURIComponent(E.LOGO_SVG);

  /* ---------- Imagens ---------- */
  var imgs = {};
  E.onImage = null; // o editor redesenha quando uma imagem termina de carregar
  E.img = function (src) {
    if (!src) return null;
    var r = imgs[src];
    if (!r) {
      r = imgs[src] = { ok: false, err: false, el: new Image() };
      r.p = new Promise(function (res) {
        r.el.onload = function () { r.ok = true; res(r); if (E.onImage) E.onImage(src); };
        r.el.onerror = function () { r.err = true; res(r); if (E.onImage) E.onImage(src); };
      });
      if (!/^data:|^blob:/.test(src)) r.el.crossOrigin = "anonymous";
      r.el.src = src;
    }
    return r;
  };
  E.img(E.LOGO_URL);

  /* ---------- Fontes ---------- */
  function fontsOf(doc) {
    var set = {};
    doc.layers.forEach(function (l) {
      if (l.type === "text" || l.type === "badge") set[(l.italic ? "italic " : "") + (l.weight || 700) + " 40px \"" + (l.font || "Outfit") + "\""] = 1;
      if (l.type === "badge") set["600 40px \"" + (l.font || "Outfit") + "\""] = 1;
      if (l.type === "logo") set["700 40px \"Outfit\""] = 1;
    });
    return Object.keys(set);
  }
  E.loadFonts = function (doc) {
    if (!document.fonts || !document.fonts.load) return Promise.resolve();
    return Promise.all(fontsOf(doc).map(function (f) { return document.fonts.load(f).catch(function () {}); }));
  };
  E.preload = function (doc) {
    var ps = [E.loadFonts(doc), E.img(E.LOGO_URL).p];
    doc.layers.forEach(function (l) { if (l.type === "image" && l.src) ps.push(E.img(l.src).p); });
    return Promise.all(ps);
  };

  /* ---------- Texto ---------- */
  function fontStr(l, size) {
    return (l.italic ? "italic " : "") + (l.weight || 700) + " " + (size || l.size) + "px \"" + (l.font || "Outfit") + "\", system-ui, sans-serif";
  }
  var mctx = document.createElement("canvas").getContext("2d");
  var hasLS = "letterSpacing" in mctx;
  function setLS(ctx, px) { if (hasLS) ctx.letterSpacing = (px || 0) + "px"; }

  E.layoutText = function (l) {
    var ctx = mctx;
    ctx.font = fontStr(l);
    setLS(ctx, l.ls);
    var txt = String(l.text == null ? "" : l.text);
    if (l.upper) txt = txt.toLocaleUpperCase("pt-BR");
    var maxW = Math.max(10, l.w), lines = [];
    txt.split("\n").forEach(function (par) {
      var words = par.split(/ +/), cur = "";
      if (!par.length) { lines.push(""); return; }
      words.forEach(function (w) {
        var test = cur ? cur + " " + w : w;
        if (ctx.measureText(test).width <= maxW || !cur) {
          if (!cur && ctx.measureText(w).width > maxW) {
            // palavra maior que a caixa: quebra por letra
            var piece = "";
            for (var i = 0; i < w.length; i++) {
              if (ctx.measureText(piece + w[i]).width > maxW && piece) { lines.push(piece); piece = ""; }
              piece += w[i];
            }
            cur = piece;
          } else cur = test;
        } else { lines.push(cur); cur = w; }
      });
      lines.push(cur);
    });
    var out = lines.map(function (s) { return { s: s, w: ctx.measureText(s).width - (hasLS && s ? (l.ls || 0) : 0) }; });
    setLS(ctx, 0);
    var lh = l.size * (l.lh || 1.15);
    return { lines: out, lh: lh, h: Math.max(lh, out.length * lh) };
  };
  E.fitText = function (l) { if (l.type === "text") l.h = Math.round(E.layoutText(l).h); };

  function rr(ctx, x, y, w, h, r) {
    r = Math.max(0, Math.min(r || 0, w / 2, h / 2));
    ctx.beginPath();
    if (ctx.roundRect) { ctx.roundRect(x, y, w, h, r); return; }
    ctx.moveTo(x + r, y); ctx.arcTo(x + w, y, x + w, y + h, r); ctx.arcTo(x + w, y + h, x, y + h, r);
    ctx.arcTo(x, y + h, x, y, r); ctx.arcTo(x, y, x + w, y, r); ctx.closePath();
  }
  E.rr = rr;

  function drawText(ctx, l, doc) {
    var L = E.layoutText(l);
    l.h = Math.round(L.h);
    ctx.font = fontStr(l);
    setLS(ctx, l.ls);
    ctx.textBaseline = "middle";
    ctx.textAlign = "left";
    var color = E.col(l.color, doc);
    L.lines.forEach(function (ln, i) {
      var x = l.align === "center" ? (l.w - ln.w) / 2 : l.align === "right" ? l.w - ln.w : 0;
      var cy = i * L.lh + L.lh / 2;
      if (l.hl && l.hl.on && ln.s) {
        var p = l.hl.pad == null ? 14 : l.hl.pad;
        var hh = l.size * 1.12 + p * 0.6;
        ctx.fillStyle = E.col(l.hl.color, doc);
        rr(ctx, x - p, cy - hh / 2, ln.w + p * 2, hh, l.hl.radius || 0);
        ctx.fill();
      }
      if (l.stroke && l.stroke.on && l.stroke.w > 0) {
        ctx.lineJoin = "round";
        ctx.lineWidth = l.stroke.w * 2;
        ctx.strokeStyle = E.col(l.stroke.color, doc);
        ctx.strokeText(ln.s, x, cy);
      }
      if (l.shadow && l.shadow.on) {
        ctx.shadowColor = E.col(l.shadow.color || "rgba(0,0,0,.45)", doc);
        ctx.shadowBlur = l.shadow.blur == null ? 18 : l.shadow.blur;
        ctx.shadowOffsetX = l.shadow.x || 0;
        ctx.shadowOffsetY = l.shadow.y == null ? 4 : l.shadow.y;
      }
      ctx.fillStyle = color;
      ctx.fillText(ln.s, x, cy);
      ctx.shadowColor = "transparent"; ctx.shadowBlur = 0; ctx.shadowOffsetX = 0; ctx.shadowOffsetY = 0;
    });
    setLS(ctx, 0);
  }

  /* ---------- Imagem ---------- */
  E.imgGeom = function (l, r) {
    var iw = r.el.naturalWidth || 1, ih = r.el.naturalHeight || 1;
    var s = l.fit === "contain" ? Math.min(l.w / iw, l.h / ih) : Math.max(l.w / iw, l.h / ih) * (l.zoom || 1);
    var dw = iw * s, dh = ih * s;
    var fx = l.fx == null ? 0.5 : l.fx, fy = l.fy == null ? 0.5 : l.fy;
    return { dx: (l.w - dw) * fx, dy: (l.h - dh) * fy, dw: dw, dh: dh };
  };
  function clipShape(ctx, l) {
    if (l.mask === "circle") { ctx.beginPath(); ctx.ellipse(l.w / 2, l.h / 2, l.w / 2, l.h / 2, 0, 0, Math.PI * 2); }
    else rr(ctx, 0, 0, l.w, l.h, l.radius || 0);
  }
  function drawImage(ctx, l, doc) {
    var r = E.img(l.src);
    ctx.save();
    clipShape(ctx, l);
    ctx.clip();
    if (r && r.ok) {
      var g = E.imgGeom(l, r);
      var f = [];
      if ((l.br || 100) !== 100) f.push("brightness(" + l.br + "%)");
      if ((l.ct || 100) !== 100) f.push("contrast(" + l.ct + "%)");
      if (l.sat != null && l.sat !== 100) f.push("saturate(" + l.sat + "%)");
      if (l.blur) f.push("blur(" + l.blur + "px)");
      if (f.length && "filter" in ctx) ctx.filter = f.join(" ");
      ctx.drawImage(r.el, g.dx, g.dy, g.dw, g.dh);
      ctx.filter = "none";
    } else if (l.fit !== "contain") {
      ctx.fillStyle = "#C9D3CB";
      ctx.fillRect(0, 0, l.w, l.h);
      ctx.fillStyle = "#6B7A70";
      ctx.font = "600 " + Math.max(14, Math.min(l.w, l.h) * 0.07) + "px Geist, system-ui, sans-serif";
      ctx.textAlign = "center"; ctx.textBaseline = "middle";
      ctx.fillText(r && r.err ? "Foto não encontrada" : l.src ? "Carregando foto" : "Escolha uma foto", l.w / 2, l.h / 2);
    }
    if (l.overlay && l.overlay.opacity > 0) {
      var oc = E.col(l.overlay.color || "#000000", doc);
      var op = l.overlay.opacity;
      if (l.overlay.grad && l.overlay.grad !== "none") {
        var gr = l.overlay.grad === "up" ? ctx.createLinearGradient(0, l.h, 0, 0) : ctx.createLinearGradient(0, 0, 0, l.h);
        gr.addColorStop(0, E.rgba(oc, 0));
        gr.addColorStop(0.35, E.rgba(oc, op * 0.15));
        gr.addColorStop(1, E.rgba(oc, op));
        ctx.fillStyle = gr;
      } else ctx.fillStyle = E.rgba(oc, op);
      ctx.fillRect(0, 0, l.w, l.h);
    }
    ctx.restore();
    if (l.border && l.border.w > 0) {
      ctx.lineWidth = l.border.w;
      ctx.strokeStyle = E.col(l.border.color, doc);
      clipShape(ctx, l);
      ctx.stroke();
    }
  }

  /* ---------- Formas ---------- */
  function shapePath(ctx, l) {
    var w = l.w, h = l.h;
    if (l.shape === "circle") { ctx.beginPath(); ctx.ellipse(w / 2, h / 2, w / 2, h / 2, 0, 0, Math.PI * 2); }
    else if (l.shape === "faixa") {
      var k = Math.min(w * 0.3, h * (l.skew == null ? 0.35 : l.skew));
      ctx.beginPath(); ctx.moveTo(k, 0); ctx.lineTo(w, 0); ctx.lineTo(w - k, h); ctx.lineTo(0, h); ctx.closePath();
    } else if (l.shape === "estrela") starPath(ctx, w, h, 14, 0.82);
    else rr(ctx, 0, 0, w, h, l.radius || 0);
  }
  function starPath(ctx, w, h, n, inner) {
    ctx.beginPath();
    for (var i = 0; i < n * 2; i++) {
      var a = (Math.PI * i) / n - Math.PI / 2, r = i % 2 ? inner : 1;
      var x = w / 2 + Math.cos(a) * (w / 2) * r, y = h / 2 + Math.sin(a) * (h / 2) * r;
      if (i) ctx.lineTo(x, y); else ctx.moveTo(x, y);
    }
    ctx.closePath();
  }
  function drawShape(ctx, l, doc) {
    shapePath(ctx, l);
    var fill = E.col(l.fill, doc);
    if (l.grad && l.grad !== "none" && fill.charAt(0) === "#") {
      var g = l.grad === "up" ? ctx.createLinearGradient(0, l.h, 0, 0) : l.grad === "right" ? ctx.createLinearGradient(0, 0, l.w, 0) : ctx.createLinearGradient(0, 0, 0, l.h);
      g.addColorStop(0, E.rgba(fill, 0)); g.addColorStop(1, E.rgba(fill, 1));
      ctx.fillStyle = g;
    } else ctx.fillStyle = fill;
    if (l.fill && l.fill !== "transparent") ctx.fill();
    if (l.stroke && l.strokeW > 0) {
      ctx.lineWidth = l.strokeW;
      ctx.strokeStyle = E.col(l.stroke, doc);
      if (l.dash) ctx.setLineDash([l.strokeW * 2.5, l.strokeW * 2]);
      ctx.stroke();
      ctx.setLineDash([]);
    }
  }

  /* ---------- Logo ---------- */
  E.logoWidth = function (l) {
    var h = l.h;
    if (l.variant === "simbolo") return Math.round(h * 1.35);
    mctx.font = "700 " + h * 0.62 + "px Outfit, system-ui, sans-serif";
    setLS(mctx, -h * 0.006);
    var w = h * 1.35 + h * 0.18 + mctx.measureText("CoraçãoBR").width;
    setLS(mctx, 0);
    return Math.round(w);
  };
  E.isLight = function (hex) {
    if (!hex || hex.charAt(0) !== "#") return false;
    var n = parseInt(hex.slice(1, 7), 16), r = n >> 16 & 255, g = n >> 8 & 255, b = n & 255;
    return (0.299 * r + 0.587 * g + 0.114 * b) > 150;
  };
  E.measure = function (text, font, size, weight, ls) {
    mctx.font = (weight || 700) + " " + size + "px \"" + font + "\", sans-serif";
    setLS(mctx, ls || 0);
    var w = mctx.measureText(text).width;
    setLS(mctx, 0);
    return w;
  };
  function drawLogo(ctx, l, doc) {
    var h = l.h;
    l.w = E.logoWidth(l);
    var r = E.img(E.LOGO_URL);
    if (r.ok) ctx.drawImage(r.el, 0, 0, h * 1.35, h);
    if (l.variant === "simbolo") return;
    ctx.font = "700 " + h * 0.62 + "px Outfit, system-ui, sans-serif";
    setLS(ctx, -h * 0.006);
    ctx.textBaseline = "middle"; ctx.textAlign = "left";
    var x = h * 1.35 + h * 0.18, y = h * 0.54;
    var dark = l.variant === "escura" || (l.variant === "auto" && E.isLight(E.col(doc.bg || "@bg", doc)));
    ctx.fillStyle = dark ? "#04341A" : "#FFFFFF";
    ctx.fillText("Coração", x, y);
    var wc = ctx.measureText("Coração").width;
    var bgc = E.col(doc.bg || "@bg", doc);
    ctx.fillStyle = !dark ? "#FFC20E" : (/^#F[A-F0-9]C[0-9A-F]0/i.test(bgc) || bgc.toUpperCase() === "#FFC20E") ? "#0B7A35" : "#E9A800";
    ctx.fillText("BR", x + wc, y);
    setLS(ctx, 0);
  }

  /* ---------- QR ---------- */
  function drawQR(ctx, l, doc) {
    var bg = E.col(l.bg || "#FFFFFF", doc), fg = E.col(l.color || "#04341A", doc);
    ctx.fillStyle = bg;
    rr(ctx, 0, 0, l.w, l.h, l.radius || 0); ctx.fill();
    var pad = l.w * (l.pad == null ? 0.08 : l.pad);
    if (typeof window.qrcode !== "function") {
      ctx.fillStyle = fg; ctx.font = "600 " + l.w * 0.08 + "px Geist, sans-serif"; ctx.textAlign = "center"; ctx.textBaseline = "middle";
      ctx.fillText("QR indisponível", l.w / 2, l.h / 2); return;
    }
    var q;
    try { q = window.qrcode(0, "M"); q.addData(unescape(encodeURIComponent(l.text || " "))); q.make(); }
    catch (e) { return; }
    var n = q.getModuleCount(), cell = (l.w - pad * 2) / n;
    ctx.fillStyle = fg;
    for (var r = 0; r < n; r++) for (var c = 0; c < n; c++) if (q.isDark(r, c))
      ctx.fillRect(pad + c * cell - 0.3, pad + r * cell - 0.3, cell + 0.6, cell + 0.6);
  }

  /* ---------- Ícone / emoji ---------- */
  function drawIcon(ctx, l, doc) {
    var c = E.col(l.color, doc);
    if (l.emoji) {
      ctx.font = l.h * 0.86 + "px \"Apple Color Emoji\",\"Segoe UI Emoji\",\"Noto Color Emoji\",sans-serif";
      ctx.textAlign = "center"; ctx.textBaseline = "middle";
      ctx.fillStyle = c;
      ctx.fillText(l.emoji, l.w / 2, l.h / 2 + l.h * 0.04);
      return;
    }
    if (l.bgc && l.bgc !== "transparent") {
      ctx.fillStyle = E.col(l.bgc, doc);
      ctx.beginPath(); ctx.ellipse(l.w / 2, l.h / 2, l.w / 2, l.h / 2, 0, 0, Math.PI * 2); ctx.fill();
    }
    var inset = l.bgc && l.bgc !== "transparent" ? 0.22 : 0;
    var s = (Math.min(l.w, l.h) * (1 - inset * 2)) / 24;
    ctx.save();
    ctx.translate(l.w / 2 - 12 * s, l.h / 2 - 12 * s);
    ctx.scale(s, s);
    var p = iconPath(l.icon || l.name);
    if (l.filled) { ctx.fillStyle = c; ctx.fill(p); }
    else { ctx.lineWidth = l.sw || 1.9; ctx.lineCap = "round"; ctx.lineJoin = "round"; ctx.strokeStyle = c; ctx.stroke(p); }
    ctx.restore();
  }

  /* ---------- Selo de preço ---------- */
  function drawBadge(ctx, l, doc) {
    var w = l.w, h = l.h;
    ctx.fillStyle = E.col(l.fill, doc);
    if (l.shape === "estrela") starPath(ctx, w, h, 18, 0.88);
    else if (l.shape === "pilula") rr(ctx, 0, 0, w, h, h / 2);
    else if (l.shape === "etiqueta") { ctx.beginPath(); ctx.moveTo(h * 0.35, 0); ctx.lineTo(w, 0); ctx.lineTo(w, h); ctx.lineTo(h * 0.35, h); ctx.lineTo(0, h / 2); ctx.closePath(); }
    else { ctx.beginPath(); ctx.ellipse(w / 2, h / 2, w / 2, h / 2, 0, 0, Math.PI * 2); }
    ctx.fill();
    if (l.ring) {
      ctx.lineWidth = Math.max(2, Math.min(w, h) * 0.018);
      ctx.strokeStyle = E.col(l.color, doc);
      ctx.setLineDash([]);
      ctx.save(); ctx.translate(w * 0.06, h * 0.06); ctx.scale(0.88, 0.88);
      if (l.shape === "pilula") rr(ctx, 0, 0, w, h, h / 2); else { ctx.beginPath(); ctx.ellipse(w / 2, h / 2, w / 2, h / 2, 0, 0, Math.PI * 2); }
      ctx.restore(); ctx.stroke();
    }
    var c = E.col(l.color, doc), font = l.font || "Outfit";
    var base = l.shape === "pilula" || l.shape === "etiqueta" ? h : Math.min(w, h);
    var s1 = base * (l.s1 || 0.34), s2 = base * (l.s2 || 0.12);
    var cx = l.shape === "etiqueta" ? w / 2 + h * 0.12 : w / 2;
    ctx.textAlign = "center"; ctx.textBaseline = "middle"; ctx.fillStyle = c;
    var t0 = l.top || "", t1 = l.line1 || "", t2 = l.line2 || "";
    var tot = (t0 ? s2 * 1.25 : 0) + s1 * 1.0 + (t2 ? s2 * 1.25 : 0);
    var y = h / 2 - tot / 2;
    if (t0) { ctx.font = "600 " + s2 + "px \"" + font + "\", sans-serif"; ctx.fillText(t0, cx, y + s2 * 0.6); y += s2 * 1.25; }
    ctx.font = (l.weight || 800) + " " + s1 + "px \"" + font + "\", sans-serif";
    fitLine(ctx, t1, cx, y + s1 * 0.52, w * 0.82);
    y += s1;
    if (t2) { ctx.font = "600 " + s2 + "px \"" + font + "\", sans-serif"; ctx.fillText(t2, cx, y + s2 * 0.65); }
  }
  function fitLine(ctx, s, x, y, max) {
    var m = ctx.measureText(s).width;
    if (m > max) { ctx.save(); ctx.translate(x, y); ctx.scale(max / m, max / m); ctx.fillText(s, 0, 0); ctx.restore(); }
    else ctx.fillText(s, x, y);
  }

  /* ---------- Desenho de uma arte ---------- */
  E.render = function (ctx, doc, opt) {
    opt = opt || {};
    var sc = opt.scale || 1;
    ctx.save();
    ctx.setTransform(sc, 0, 0, sc, 0, 0);
    ctx.clearRect(0, 0, doc.w, doc.h);
    ctx.fillStyle = E.col(doc.bg || "@bg", doc);
    ctx.fillRect(0, 0, doc.w, doc.h);
    doc.layers.forEach(function (l) {
      if (l.hidden || l.id === opt.skip) return;
      if (l.type === "logo") l.w = E.logoWidth(l);
      if (l.type === "text") E.fitText(l);
      ctx.save();
      ctx.globalAlpha = l.opacity == null ? 1 : l.opacity;
      ctx.translate(l.x + l.w / 2, l.y + l.h / 2);
      if (l.rot) ctx.rotate((l.rot * Math.PI) / 180);
      ctx.translate(-l.w / 2, -l.h / 2);
      try {
        if (l.type === "text") drawText(ctx, l, doc);
        else if (l.type === "image") drawImage(ctx, l, doc);
        else if (l.type === "shape") drawShape(ctx, l, doc);
        else if (l.type === "logo") drawLogo(ctx, l, doc);
        else if (l.type === "qr") drawQR(ctx, l, doc);
        else if (l.type === "icon") drawIcon(ctx, l, doc);
        else if (l.type === "badge") drawBadge(ctx, l, doc);
      } catch (e) { console.warn("Falha ao desenhar camada", l.type, e); }
      ctx.restore();
    });
    ctx.restore();
  };

  E.toCanvas = function (doc, scale) {
    scale = scale || 1;
    var c = document.createElement("canvas");
    c.width = Math.round(doc.w * scale); c.height = Math.round(doc.h * scale);
    E.render(c.getContext("2d"), doc, { scale: scale });
    return c;
  };

  E.slug = function (s) {
    return String(s || "arte").normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "").slice(0, 60) || "arte";
  };
  E.downloadPNG = function (doc) {
    return E.preload(doc).then(function () {
      var c = E.toCanvas(doc, 1);
      return new Promise(function (res, rej) {
        try {
          c.toBlob(function (b) {
            if (!b) return rej(new Error("vazio"));
            var a = document.createElement("a");
            a.href = URL.createObjectURL(b);
            a.download = "coracaobr-" + E.slug(doc.name) + "-" + doc.w + "x" + doc.h + ".png";
            document.body.appendChild(a); a.click(); a.remove();
            setTimeout(function () { URL.revokeObjectURL(a.href); }, 4000);
            res();
          }, "image/png");
        } catch (e) { rej(e); }
      });
    });
  };

  /* ---------- Fábrica de camadas ---------- */
  function base(type, x, y, w, h, o) {
    var l = { id: E.uid(), type: type, x: x, y: y, w: w, h: h, rot: 0, opacity: 1 };
    for (var k in o) if (o.hasOwnProperty(k)) l[k] = o[k];
    return l;
  }
  E.L = {
    text: function (text, x, y, w, o) {
      var l = base("text", x, y, w, 50, Object.assign({ text: text, font: "Outfit", size: 56, weight: 700, color: "@ink", align: "left", lh: 1.1, ls: 0 }, o || {}));
      E.fitText(l); return l;
    },
    image: function (src, x, y, w, h, o) { return base("image", x, y, w, h, Object.assign({ src: src, zoom: 1, fx: 0.5, fy: 0.5, br: 100, ct: 100, sat: 100, radius: 0 }, o || {})); },
    rect: function (x, y, w, h, fill, o) { return base("shape", x, y, w, h, Object.assign({ shape: "rect", fill: fill, radius: 0 }, o || {})); },
    circle: function (x, y, d, fill, o) { return base("shape", x, y, d, d, Object.assign({ shape: "circle", fill: fill }, o || {})); },
    faixa: function (x, y, w, h, fill, o) { return base("shape", x, y, w, h, Object.assign({ shape: "faixa", fill: fill }, o || {})); },
    logo: function (x, y, h, variant, o) { var l = base("logo", x, y, 100, h, Object.assign({ variant: variant || "clara" }, o || {})); l.w = E.logoWidth(l); return l; },
    qr: function (text, x, y, s, o) { return base("qr", x, y, s, s, Object.assign({ text: text, color: "#04341A", bg: "#FFFFFF", pad: 0.08, radius: 16 }, o || {})); },
    icon: function (name, x, y, s, color, o) { return base("icon", x, y, s, s, Object.assign({ icon: name, color: color || "@accent" }, o || {})); },
    badge: function (line1, line2, x, y, s, o) { return base("badge", x, y, s, s, Object.assign({ line1: line1, line2: line2, shape: "circle", fill: "@accent", color: "@accentInk", font: "Outfit" }, o || {})); }
  };
  E.newDoc = function (name, h, theme, layers, meta) {
    return Object.assign({ v: 1, id: "d" + Math.random().toString(36).slice(2, 10), name: name || "Arte sem nome", w: 1080, h: h || 1080, theme: theme || "verde", bg: "@bg", layers: layers || [] }, meta || {});
  };

  /* ---------- Dados do guia (lidos do seed em tempo de execução) ---------- */
  E.CAT = {
    churrascaria: "Churrascarias", "restaurante-brasileiro": "Restaurantes brasileiros", "mercado-brasileiro": "Mercados brasileiros",
    "acai-cafe": "Açaí e café", padaria: "Padarias e doces", bbq: "Churrasco texano (BBQ)", "tex-mex": "Tex-Mex", steakhouse: "Steakhouses",
    hamburguer: "Hambúrguer", pizza: "Pizza", asiatico: "Comida asiática", "comida-sulista": "Comida sulista", "brunch-cafe": "Brunch e café",
    bar: "Bares", museu: "Museus", parque: "Parques", natureza: "Natureza", compras: "Compras", evento: "Eventos", show: "Shows",
    familia: "Programas em família", bairro: "Bairros", historico: "Lugares históricos", arte: "Arte", esporte: "Esporte", saude: "Saúde",
    transporte: "Transporte", comunidade: "Comunidade", mirante: "Mirantes", servico: "Serviços", governo: "Serviços públicos"
  };
  E.REG = { dfw: "Dallas–Fort Worth", houston: "Houston", austin: "Austin", "san-antonio": "San Antonio", sanantonio: "San Antonio", "san antonio": "San Antonio", sa: "San Antonio" };
  E.regKey = function (l) { return String(l.regiaoGuia || "DFW").toLowerCase().trim().replace(/\s+/g, "-"); };
  E.regNome = function (k) { return E.REG[k] || k.replace(/(^|-)([a-z])/g, function (m, a, b) { return (a ? " " : "") + b.toUpperCase(); }); };

  E.seed = { lugares: [], ok: false };
  E.loadSeed = function () {
    return fetch("../data/seed.json", { cache: "no-store" }).then(function (r) {
      if (!r.ok) throw new Error("HTTP " + r.status);
      return r.json();
    }).then(function (j) {
      var L = (j.lugares || []).filter(function (l) { return l && l.nome && l.publicado !== false; });
      E.seed = { lugares: L, ok: true, versao: j.versao };
      return E.seed;
    });
  };
  E.fotoSrc = function (f) { if (!f || !f.src) return ""; return /^(https?:|data:)/.test(f.src) ? f.src : "../" + f.src.replace(/^\.?\//, ""); };
  E.realFotos = function (l) { return (l.fotos || []).filter(function (f) { return f.src && !f.ilustrativa; }); };
  E.foto = function (l, i) {
    if (!l) return "";
    var r = E.realFotos(l), all = (l.fotos || []).filter(function (f) { return f.src; });
    var list = r.length ? r : all;
    if (!list.length) return "";
    return E.fotoSrc(list[(i || 0) % list.length]);
  };
  E.hoje = function () { var d = new Date(); return d.getFullYear() + "-" + String(d.getMonth() + 1).padStart(2, "0") + "-" + String(d.getDate()).padStart(2, "0"); };
  E.MES = ["jan", "fev", "mar", "abr", "mai", "jun", "jul", "ago", "set", "out", "nov", "dez"];
  E.dataCurta = function (iso) { if (!iso) return ""; var p = iso.split("-"); return +p[2] + " " + E.MES[+p[1] - 1]; };
  E.nomeLimpo = function (n) { return String(n || "").trim(); };
  E.frase = function (t, max) {
    t = String(t || "").replace(/\s+/g, " ").trim();
    if (!t) return "";
    var m = t.match(/^.*?[.!?](\s|$)/);
    var s = m ? m[0].trim() : t;
    if (s.length > max) { s = s.slice(0, max); s = s.slice(0, s.lastIndexOf(" ")) + "…"; }
    return s;
  };
  E.site = function () {
    var h = location.host;
    if (!h || /^(localhost|127\.|0\.0\.0\.0|\[)/.test(h)) return { url: "https://seudominio.com/", host: "seudominio.com" };
    return { url: location.origin + "/", host: h.replace(/^www\./, "") };
  };
})();
