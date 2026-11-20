/* Galeria de fotos em tela cheia com zoom: abre ao clicar na foto de um lugar ou anúncio.
   Setas e miniaturas para trocar; zoom com duplo clique/toque, roda do mouse, pinça (dois dedos) e botões +/−;
   arrastar move a foto ampliada; deslizar para o lado troca de foto; Esc fecha. */
(function () {
  "use strict";
  var G = window.Guia; if (!G) return;
  var esc = G.esc;
  var aberta = null;

  function fotosDoLugar() {
    var m = /^#lugar-(.+)$/.exec(location.hash), l = m && Store.obter("lugares", decodeURIComponent(m[1]));
    if (!l) return null;
    return { nome: l.nome, fotos: (l.fotos || []).slice(0, 10).map(function (f) { return { src: Store.urlFoto(f.src), cred: f.credito ? (f.ilustrativa ? "Foto ilustrativa: " : "Foto: ") + f.credito + (f.licenca ? " · " + f.licenca : "") : "" }; }) };
  }

  document.addEventListener("click", function (e) {
    var img = e.target.closest(".sheet-photo > img"); if (!img) return;
    var d = fotosDoLugar(); if (!d || !d.fotos.length) return;
    var atual = img.getAttribute("src"), i = d.fotos.map(function (f) { return f.src; }).indexOf(atual);
    abrir(d, i < 0 ? 0 : i);
  });

  function abrir(d, ini) {
    if (aberta) return;
    var i = ini, z = 1, tx = 0, ty = 0, n = d.fotos.length;
    var el = document.createElement("div"); el.className = "gal"; el.setAttribute("role", "dialog"); el.setAttribute("aria-modal", "true"); el.setAttribute("aria-label", "Fotos de " + d.nome);
    el.innerHTML = '<div class="gal-top"><span class="gal-n"></span><b class="gal-t">' + esc(d.nome) + '</b><span class="gal-z"><button type="button" data-g="menos" aria-label="Diminuir zoom">−</button><button type="button" data-g="mais" aria-label="Aumentar zoom">+</button></span><button type="button" class="gal-x" data-g="fecha" aria-label="Fechar">×</button></div>' +
      '<div class="gal-palco"><img class="gal-img" alt="" draggable="false"></div>' +
      (n > 1 ? '<button type="button" class="gal-arr gal-p" data-g="ant" aria-label="Foto anterior"><svg viewBox="0 0 24 24"><path d="M15 5l-7 7 7 7"/></svg></button><button type="button" class="gal-arr gal-s" data-g="prox" aria-label="Próxima foto"><svg viewBox="0 0 24 24"><path d="M9 5l7 7-7 7"/></svg></button>' : "") +
      '<div class="gal-pe"><span class="gal-cred"></span>' + (n > 1 ? '<div class="gal-ths">' + d.fotos.map(function (f, k) { return '<button type="button" data-gi="' + k + '" aria-label="Foto ' + (k + 1) + '"><img src="' + esc(f.src) + '" alt="" loading="lazy"></button>'; }).join("") + "</div>" : "") + '<span class="gal-dica">Toque duas vezes ou use dois dedos para dar zoom</span></div>';
    document.body.appendChild(el); aberta = el;
    var foto = el.querySelector(".gal-img"), palco = el.querySelector(".gal-palco");
    var rolagem = document.documentElement.style.overflow; document.documentElement.style.overflow = "hidden";

    function aplica(anim) { foto.style.transition = anim ? "transform .25s ease" : "none"; foto.style.transform = "translate(" + tx + "px," + ty + "px) scale(" + z + ")"; el.classList.toggle("zoom", z > 1.01); }
    function limita() {
      var r = palco.getBoundingClientRect(), w = foto.offsetWidth * z, h = foto.offsetHeight * z;
      var mx = Math.max(0, (w - r.width) / 2), my = Math.max(0, (h - r.height) / 2);
      tx = Math.max(-mx, Math.min(mx, tx)); ty = Math.max(-my, Math.min(my, ty));
    }
    function zoom(nz, cx, cy, anim) {
      nz = Math.max(1, Math.min(5, nz));
      var r = palco.getBoundingClientRect(), ox = (cx == null ? r.width / 2 : cx - r.left) - r.width / 2, oy = (cy == null ? r.height / 2 : cy - r.top) - r.height / 2;
      tx = ox - (ox - tx) * nz / z; ty = oy - (oy - ty) * nz / z; z = nz; if (z === 1) { tx = 0; ty = 0; }
      limita(); aplica(anim);
    }
    function mostra(k) {
      i = (k + n) % n; z = 1; tx = 0; ty = 0; aplica(false);
      foto.src = d.fotos[i].src; foto.alt = "Foto " + (i + 1) + " de " + d.nome;
      el.querySelector(".gal-n").textContent = n > 1 ? (i + 1) + " / " + n : "";
      el.querySelector(".gal-cred").textContent = d.fotos[i].cred || "";
      el.querySelectorAll("[data-gi]").forEach(function (b) { b.setAttribute("aria-current", Number(b.dataset.gi) === i); });
      var at = el.querySelector('[data-gi="' + i + '"]'); if (at && at.scrollIntoView) at.scrollIntoView({ block: "nearest", inline: "center" });
      if (n > 1) { [i + 1, i - 1].forEach(function (p) { var im = new Image(); im.src = d.fotos[(p + n) % n].src; }); }
    }
    function fecha() {
      el.classList.remove("on"); document.removeEventListener("keydown", tecla); document.documentElement.style.overflow = rolagem;
      setTimeout(function () { el.remove(); aberta = null; }, 200);
    }
    function tecla(e) {
      if (e.key === "Escape") { e.stopPropagation(); fecha(); }
      else if (e.key === "ArrowRight" && n > 1) mostra(i + 1); else if (e.key === "ArrowLeft" && n > 1) mostra(i - 1);
      else if (e.key === "+" || e.key === "=") zoom(z * 1.5, null, null, true); else if (e.key === "-") zoom(z / 1.5, null, null, true);
    }
    document.addEventListener("keydown", tecla, true);
    el.addEventListener("click", function (e) {
      var b = e.target.closest("[data-g]"), t = e.target.closest("[data-gi]");
      if (t) { mostra(Number(t.dataset.gi)); return; }
      if (!b) { if (e.target === palco && z === 1) fecha(); return; }
      var g = b.dataset.g;
      if (g === "fecha") fecha(); else if (g === "ant") mostra(i - 1); else if (g === "prox") mostra(i + 1);
      else if (g === "mais") zoom(z * 1.6, null, null, true); else if (g === "menos") zoom(z / 1.6, null, null, true);
    });
    palco.addEventListener("dblclick", function (e) { zoom(z > 1.01 ? 1 : 2.5, e.clientX, e.clientY, true); });
    palco.addEventListener("wheel", function (e) { e.preventDefault(); zoom(z * (e.deltaY < 0 ? 1.15 : 1 / 1.15), e.clientX, e.clientY, false); }, { passive: false });

    /* toques e mouse: arrastar, deslizar, pinça e toque duplo */
    var pts = {}, ini0 = null, pinca = null, ultimoToque = 0;
    palco.addEventListener("pointerdown", function (e) {
      palco.setPointerCapture(e.pointerId); pts[e.pointerId] = { x: e.clientX, y: e.clientY };
      var ids = Object.keys(pts);
      if (ids.length === 2) { var a = pts[ids[0]], b = pts[ids[1]]; pinca = { d: Math.hypot(a.x - b.x, a.y - b.y), z: z }; ini0 = null; }
      else { ini0 = { x: e.clientX, y: e.clientY, tx: tx, ty: ty, t: Date.now() }; }
    });
    palco.addEventListener("pointermove", function (e) {
      if (!pts[e.pointerId]) return; pts[e.pointerId] = { x: e.clientX, y: e.clientY };
      var ids = Object.keys(pts);
      if (pinca && ids.length === 2) { var a = pts[ids[0]], b = pts[ids[1]]; zoom(pinca.z * Math.hypot(a.x - b.x, a.y - b.y) / pinca.d, (a.x + b.x) / 2, (a.y + b.y) / 2, false); return; }
      if (!ini0) return;
      var dx = e.clientX - ini0.x, dy = e.clientY - ini0.y;
      if (z > 1.01) { tx = ini0.tx + dx; ty = ini0.ty + dy; limita(); aplica(false); }
      else if (n > 1) { foto.style.transition = "none"; foto.style.transform = "translateX(" + dx + "px)"; }
    });
    function solta(e) {
      if (!pts[e.pointerId]) return; delete pts[e.pointerId];
      if (pinca) { if (Object.keys(pts).length < 2) pinca = null; ini0 = null; return; }
      if (!ini0) return;
      var dx = e.clientX - ini0.x, dy = e.clientY - ini0.y, dt = Date.now() - ini0.t; ini0 = null;
      if (z <= 1.01) {
        if (n > 1 && Math.abs(dx) > 60 && Math.abs(dx) > Math.abs(dy)) { mostra(i + (dx < 0 ? 1 : -1)); return; }
        if (dy > 110 && Math.abs(dy) > Math.abs(dx)) { fecha(); return; }
        aplica(true);
      }
      if (e.pointerType !== "mouse" && Math.abs(dx) < 10 && Math.abs(dy) < 10 && dt < 250) {
        var ag = Date.now(); if (ag - ultimoToque < 300) { zoom(z > 1.01 ? 1 : 2.5, e.clientX, e.clientY, true); ultimoToque = 0; } else ultimoToque = ag;
      }
    }
    palco.addEventListener("pointerup", solta); palco.addEventListener("pointercancel", solta);

    mostra(i); requestAnimationFrame(function () { el.classList.add("on"); });
    setTimeout(function () { var x = el.querySelector(".gal-x"); if (x) x.focus({ preventScroll: true }); }, 50);
  }
  window.Galeria = { abrir: abrir };
})();
