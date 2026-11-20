/* Reações no lugar das estrelas.
   A nota continua guardada de 1 a 5 (médias, ranking, Google e relatórios seguem iguais); o que muda é como ela é escolhida e mostrada:
   ❤️ Amei (5) · 👍 Gostei (4) · 😐 Regular (3) · 😢 Decepcionou (2) · 😡 Péssimo (1).
   Os ícones são desenhados aqui em SVG (o mesmo visual em iPhone, Android e computador) e ficam num "sprite" único na página.
   A nuvem de reações faz os emojis subirem e se espalharem na proporção das avaliações: a reação da maioria é a que mais aparece. */
(function () {
  "use strict";
  var LISTA = [
    { n: 5, k: "amei", t: "Amei", e: "❤️", c: "#E8344E" },
    { n: 4, k: "gostei", t: "Gostei", e: "👍", c: "#1877F2" },
    { n: 3, k: "regular", t: "Regular", e: "😐", c: "#E9A800" },
    { n: 2, k: "decepcionou", t: "Decepcionou", e: "😢", c: "#E07B00" },
    { n: 1, k: "pessimo", t: "Péssimo", e: "😡", c: "#E2452A" }
  ];
  var POR = {}; LISTA.forEach(function (r) { POR[r.n] = r; });

  /* ---------- desenhos (um sprite por página) ---------- */
  var OLHOS = '<ellipse cx="17" cy="21.5" rx="2.6" ry="3.4" fill="#5A3A12"/><ellipse cx="31" cy="21.5" rx="2.6" ry="3.4" fill="#5A3A12"/>';
  var SPRITE = '<svg xmlns="http://www.w3.org/2000/svg" aria-hidden="true" focusable="false" style="position:absolute;width:0;height:0;overflow:hidden"><defs>' +
    '<linearGradient id="rx-g5" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#FF6F86"/><stop offset="1" stop-color="#E3203F"/></linearGradient>' +
    '<linearGradient id="rx-g4" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#4AA8FF"/><stop offset="1" stop-color="#0F66E6"/></linearGradient>' +
    '<linearGradient id="rx-gy" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#FFE36E"/><stop offset="1" stop-color="#F6B200"/></linearGradient>' +
    '<linearGradient id="rx-g1" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#F0442A"/><stop offset=".62" stop-color="#F98B2E"/><stop offset="1" stop-color="#FFC23A"/></linearGradient>' +
    '<symbol id="rx-s5" viewBox="0 0 48 48"><circle cx="24" cy="24" r="24" fill="url(#rx-g5)"/><path fill="#fff" d="M24 36c-.6 0-1.2-.2-1.6-.6C15.4 29.3 11 25.4 11 20.3 11 16.2 14.2 13 18.1 13c2.4 0 4.5 1.1 5.9 3 1.4-1.9 3.5-3 5.9-3 3.9 0 7.1 3.2 7.1 7.3 0 5.1-4.4 9-11.4 15.1-.4.4-1 .6-1.6.6z"/></symbol>' +
    '<symbol id="rx-s4" viewBox="0 0 48 48"><circle cx="24" cy="24" r="24" fill="url(#rx-g4)"/><path fill="#fff" d="M12.5 22.5h4.6c.8 0 1.4.6 1.4 1.4v11.2c0 .8-.6 1.4-1.4 1.4h-4.6c-.8 0-1.4-.6-1.4-1.4V23.9c0-.8.6-1.4 1.4-1.4zm8.5 13V23.2l5.3-8.4c.6-1 1.9-1.3 2.9-.6.8.5 1.1 1.5.9 2.4l-1.2 4.9h6.3c2 0 3.5 1.9 3 3.8l-2.3 8.9c-.4 1.5-1.7 2.5-3.2 2.5h-10.3c-.8 0-1.4-.5-1.4-1.2z"/></symbol>' +
    '<symbol id="rx-s3" viewBox="0 0 48 48"><circle cx="24" cy="24" r="24" fill="url(#rx-gy)"/>' + OLHOS + '<rect x="15.5" y="31" width="17" height="3.2" rx="1.6" fill="#5A3A12"/></symbol>' +
    '<symbol id="rx-s2" viewBox="0 0 48 48"><circle cx="24" cy="24" r="24" fill="url(#rx-gy)"/><path d="M12.5 16.5l7-2.6M35.5 16.5l-7-2.6" stroke="#5A3A12" stroke-width="2.6" stroke-linecap="round" fill="none"/>' + OLHOS + '<path d="M16 36c2.6-4.6 13.4-4.6 16 0" stroke="#5A3A12" stroke-width="3" stroke-linecap="round" fill="none"/><path fill="#4FA8FF" d="M34.6 25.5s-3.4 4.4-3.4 6.6a3.4 3.4 0 0 0 6.8 0c0-2.2-3.4-6.6-3.4-6.6z"/></symbol>' +
    '<symbol id="rx-s1" viewBox="0 0 48 48"><circle cx="24" cy="24" r="24" fill="url(#rx-g1)"/><path d="M11.5 17.5l9 3.4M36.5 17.5l-9 3.4" stroke="#4A1E08" stroke-width="3.2" stroke-linecap="round" fill="none"/><ellipse cx="17" cy="24" rx="2.6" ry="3" fill="#4A1E08"/><ellipse cx="31" cy="24" rx="2.6" ry="3" fill="#4A1E08"/><path d="M17 35.5c3-2.6 11-2.6 14 0" stroke="#4A1E08" stroke-width="3" stroke-linecap="round" fill="none"/></symbol>' +
    "</defs></svg>";
  function instala() { if (document.getElementById("rx-sprite")) return; var d = document.createElement("div"); d.innerHTML = SPRITE; var s = d.firstChild; s.id = "rx-sprite"; document.body.appendChild(s); }
  if (document.body) instala(); else document.addEventListener("DOMContentLoaded", instala);

  /* ---------- utilidades ---------- */
  function nota(v) { var n = Math.round(Number(v)); return n >= 1 && n <= 5 ? n : 0; }
  function de(v) { return POR[nota(v)] || null; }
  function icone(v, cls) { var r = de(v); if (!r) return ""; return '<svg class="rx-i rx-' + r.n + (cls ? " " + cls : "") + '" viewBox="0 0 48 48" aria-hidden="true" focusable="false"><use href="#rx-s' + r.n + '"/></svg>'; }
  function virgula(v) { return Number(v).toFixed(1).replace(".", ","); }
  /* pesos de cada reação: pelas avaliações reais quando existem; senão, pela média (o "clima" da nota) */
  function pesos(media, contagens) {
    var c = contagens || {}, tot = 0, p = {};
    [1, 2, 3, 4, 5].forEach(function (n) { tot += Number(c[n]) || 0; });
    if (tot > 0) { [1, 2, 3, 4, 5].forEach(function (n) { p[n] = (Number(c[n]) || 0) / tot; }); return p; }
    var m = Number(media); if (!(m >= 1)) return null;
    var s = 0; [1, 2, 3, 4, 5].forEach(function (n) { p[n] = Math.exp(-Math.pow(n - m, 2) / 0.9); s += p[n]; });
    [1, 2, 3, 4, 5].forEach(function (n) { p[n] /= s; }); return p;
  }
  function ordem(p) { return [5, 4, 3, 2, 1].filter(function (n) { return p[n] > 0.0001; }).sort(function (a, b) { return p[b] - p[a] || b - a; }); }

  /* selo compacto: uma reação (nota individual) ou as duas mais fortes (média), opcionalmente com o nome e a nota */
  function selo(v, op) {
    op = op || {}; var m = Number(v); if (!(m >= 1)) return op.vazio || "";
    var inteira = op.individual || Math.abs(m - Math.round(m)) < 0.05, r = de(m), ics;
    if (inteira) ics = icone(m);
    else { var o = ordem(pesos(m)).slice(0, 2); ics = o.map(function (n) { return icone(n); }).join(""); }
    return '<span class="rx-selo' + (op.cls ? " " + op.cls : "") + '" title="' + r.t + (inteira && op.individual ? "" : " · " + virgula(m)) + '"><span class="rx-ics">' + ics + "</span>" +
      (op.nome ? '<span class="rx-nome">' + r.t + "</span>" : "") + (op.num ? '<b class="num">' + virgula(m) + "</b>" : "") + "</span>";
  }
  function emoji(v) { var r = de(v); return r ? r.e : ""; }
  function texto(v) { var r = de(v); return r ? r.t : ""; }

  /* barra de escolha (substitui as 5 estrelas): attrs(n) devolve os atributos que o formulário já usa (data-n, data-nota…) */
  function botoes(atual, attrs) {
    var a = nota(atual);
    return LISTA.map(function (r) {
      return '<button type="button" class="rx-b' + (r.n === a ? " on" : "") + '" role="radio" aria-checked="' + (r.n === a) + '" aria-label="' + r.t + " (" + r.n + ' de 5)"' + (attrs ? attrs(r.n) : "") + ">" +
        '<svg class="rx-i" viewBox="0 0 48 48" aria-hidden="true" focusable="false"><use href="#rx-s' + r.n + '"/></svg><span>' + r.t + "</span></button>";
    }).join("");
  }
  /* marca a reação escolhida num grupo (só a escolhida fica destacada, diferente das estrelas) */
  function marca(grupo, n, chave) {
    if (!grupo) return; Array.prototype.forEach.call(grupo.querySelectorAll("button"), function (b) {
      var v = Number(chave ? b.dataset[chave] : (b.dataset.n || b.dataset.nota || b.dataset.prN));
      b.classList.toggle("on", v === n); b.setAttribute("aria-checked", v === n);
    });
  }

  /* nuvem de reações: emojis sobem e se espalham; quantos de cada tipo = proporção das avaliações */
  function aleat(seed) { var s = 0; for (var i = 0; i < seed.length; i++) s = (s * 31 + seed.charCodeAt(i)) >>> 0; return function () { s = (s * 1664525 + 1013904223) >>> 0; return s / 4294967296; }; }
  function nuvem(media, contagens, op) {
    op = op || {}; var p = pesos(media, contagens); if (!p) return "";
    var total = op.total || 22, rnd = aleat(String(op.seed || "cbr") + String(media)), lista = [], o = ordem(p);
    o.forEach(function (n) { var q = Math.round(p[n] * total); for (var i = 0; i < q; i++) lista.push(n); });
    if (!lista.length) lista.push(o[0]);
    while (lista.length > total) lista.pop();
    for (var i = lista.length - 1; i > 0; i--) { var j = Math.floor(rnd() * (i + 1)), t = lista[i]; lista[i] = lista[j]; lista[j] = t; }
    return '<div class="rx-nuvem' + (op.cls ? " " + op.cls : "") + '" aria-hidden="true">' + lista.map(function (n, k) {
      var tam = (0.55 + rnd() * 0.85).toFixed(2), x = (4 + rnd() * 92).toFixed(1), dx = ((rnd() - 0.5) * 60).toFixed(0), dur = (5.5 + rnd() * 5).toFixed(1), atraso = (-rnd() * 10).toFixed(1);
      return '<i style="--x:' + x + "%;--dx:" + dx + "px;--s:" + tam + ";--t:" + dur + "s;--d:" + atraso + 's"><svg class="rx-i" viewBox="0 0 48 48"><use href="#rx-s' + n + '"/></svg></i>';
    }).join("") + "</div>";
  }
  /* explosão rápida ao escolher a reação (como um "curtir" voando) */
  function estouro(el, n) {
    if (!el || matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    var r = el.getBoundingClientRect(), box = document.createElement("div"); box.className = "rx-estouro"; box.style.left = (r.left + r.width / 2) + "px"; box.style.top = (r.top + r.height / 2) + "px";
    var h = ""; for (var i = 0; i < 9; i++) { var ang = (-90 + (Math.random() - 0.5) * 120) * Math.PI / 180, dist = 50 + Math.random() * 70; h += '<i style="--tx:' + (Math.cos(ang) * dist).toFixed(0) + "px;--ty:" + (Math.sin(ang) * dist).toFixed(0) + "px;--s:" + (0.6 + Math.random() * 0.7).toFixed(2) + ";--d:" + (i * 25) + 'ms"><svg class="rx-i" viewBox="0 0 48 48"><use href="#rx-s' + n + '"/></svg></i>'; }
    box.innerHTML = h; document.body.appendChild(box); setTimeout(function () { box.remove(); }, 1300);
  }
  document.addEventListener("click", function (e) { var b = e.target.closest && e.target.closest(".rx-b"); if (!b) return; var n = Number(b.dataset.n || b.dataset.nota || b.dataset.prN); if (n) estouro(b, n); });

  window.Reacoes = { LISTA: LISTA, de: de, icone: icone, selo: selo, emoji: emoji, texto: texto, botoes: botoes, marca: marca, nuvem: nuvem, pesos: pesos, ordem: ordem, estouro: estouro, virgula: virgula };
})();
