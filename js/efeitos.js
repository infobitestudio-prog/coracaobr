/* Efeitos leves: carrossel contínuo na fileira "Mais bem avaliados" (para ao toque e volta sozinho) e inclinação 3D dos cards no mouse.
   Tudo respeita "reduzir movimento" do sistema e pausa quando o carrossel não está na tela. */
(function () {
  "use strict";
  var calmo = matchMedia("(prefers-reduced-motion: reduce)").matches;
  /* Carrossel contínuo só na fileira "Mais bem avaliados" (.hscroll.auto): desliza devagar e sem parar.
     Ao tocar ou arrastar, para; volta a andar sozinho 5 s depois que a pessoa solta. Fora da tela ou com a aba escondida, pausa. */
  var VEL = 28; /* pixels por segundo */
  var vistos = new WeakSet();
  function armar(el) {
    if (vistos.has(el) || calmo) return; vistos.add(el);
    var orig = Array.from(el.children);
    if (orig.length < 3) return;
    orig.forEach(function (c) { var k = c.cloneNode(true); k.setAttribute("aria-hidden", "true"); k.setAttribute("tabindex", "-1"); k.classList.add("clone"); el.appendChild(k); });
    var visivel = true, mexendo = false, voltaEm = 0, ult = 0, pos = el.scrollLeft;
    if ("IntersectionObserver" in window) new IntersectionObserver(function (es) { visivel = es[0].isIntersecting; }, { threshold: 0.2 }).observe(el);
    function para() { mexendo = true; voltaEm = Infinity; }
    function solta() { mexendo = false; voltaEm = performance.now() + 5000; }
    el.addEventListener("pointerdown", para, { passive: true }); el.addEventListener("touchstart", para, { passive: true });
    el.addEventListener("pointerup", solta, { passive: true }); el.addEventListener("touchend", solta, { passive: true }); el.addEventListener("pointercancel", solta, { passive: true });
    el.addEventListener("wheel", function () { voltaEm = performance.now() + 5000; }, { passive: true });
    el.addEventListener("mouseenter", function () { if (matchMedia("(hover: hover)").matches) voltaEm = Infinity; });
    el.addEventListener("mouseleave", function () { if (!mexendo) voltaEm = performance.now() + 1200; });
    function passo(t) {
      if (!document.body.contains(el)) return;
      var dt = ult ? Math.min(0.05, (t - ult) / 1000) : 0; ult = t;
      var metade = el.scrollWidth / 2;
      if (!mexendo && t >= voltaEm && visivel && !document.hidden && metade > el.clientWidth) {
        if (Math.abs(el.scrollLeft - pos) > 2) pos = el.scrollLeft; /* a pessoa arrastou: continua de onde parou */
        pos += VEL * dt;
        if (pos >= metade) pos -= metade;
        el.scrollLeft = pos;
      } else pos = el.scrollLeft;
      if (el.scrollLeft >= metade) { el.scrollLeft -= metade; pos = el.scrollLeft; }
      requestAnimationFrame(passo);
    }
    voltaEm = performance.now() + 1500;
    requestAnimationFrame(passo);
  }
  function varrer() { Array.from(document.querySelectorAll(".hscroll.auto")).forEach(armar); }
  new MutationObserver(function () { varrer(); }).observe(document.body, { childList: true, subtree: true });
  varrer();

  /* Inclinação 3D com reflexo: só em telas com mouse, para não atrapalhar a rolagem no celular. */
  if (!calmo && matchMedia("(hover: hover) and (pointer: fine)").matches) {
    var atual = null;
    document.addEventListener("pointermove", function (e) {
      var c = e.target.closest && e.target.closest(".ocard, .bn, .tile, .plan");
      if (atual && atual !== c) { atual.style.transform = ""; atual.style.removeProperty("--mx"); atual = null; }
      if (!c) return; atual = c;
      var r = c.getBoundingClientRect(), x = (e.clientX - r.left) / r.width - 0.5, y = (e.clientY - r.top) / r.height - 0.5;
      c.style.transform = "perspective(800px) rotateY(" + (x * 7).toFixed(2) + "deg) rotateX(" + (-y * 7).toFixed(2) + "deg) translateY(-4px)";
      c.style.setProperty("--mx", ((x + 0.5) * 100).toFixed(1) + "%"); c.style.setProperty("--my", ((y + 0.5) * 100).toFixed(1) + "%");
    }, { passive: true });
  }
})();
