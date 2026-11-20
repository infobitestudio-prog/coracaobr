/* Estrutura dos painéis do usuário e do anunciante: menu lateral no desktop, menu em pílulas no celular.
   Visual: preto e branco com detalhes verdes. Cada seção é mostrada por vez; a escolha fica guardada na sessão. */
(function () {
  "use strict";
  var IC = {
    home: '<path d="M3 10.5 12 3l9 7.5V20a1 1 0 0 1-1 1h-5v-6H9v6H4a1 1 0 0 1-1-1z"/>',
    user: '<circle cx="12" cy="8" r="4"/><path d="M4 21a8 8 0 0 1 16 0"/>',
    cal: '<rect x="3.5" y="5" width="17" height="15.5" rx="3"/><path d="M3.5 10h17M8 3v4M16 3v4"/>',
    heart: '<path d="M12 20s-7.5-4.6-7.5-10A4.3 4.3 0 0 1 12 7a4.3 4.3 0 0 1 7.5 3c0 5.4-7.5 10-7.5 10z"/>',
    star: '<path d="m12 3.5 2.6 5.3 5.9.9-4.3 4.1 1 5.8L12 16.9l-5.2 2.7 1-5.8-4.3-4.1 5.9-.9z"/>',
    spark: '<path d="M12 3v4M12 17v4M3 12h4M17 12h4M6 6l2.5 2.5M15.5 15.5 18 18M6 18l2.5-2.5M15.5 8.5 18 6"/>',
    route: '<circle cx="6" cy="18" r="2.5"/><circle cx="18" cy="6" r="2.5"/><path d="M8.5 18H15a3.5 3.5 0 0 0 0-7H9a3.5 3.5 0 0 1 0-7h6.5"/>',
    grid: '<rect x="4" y="4" width="7" height="7" rx="2"/><rect x="13" y="4" width="7" height="7" rx="2"/><rect x="4" y="13" width="7" height="7" rx="2"/><rect x="13" y="13" width="7" height="7" rx="2"/>',
    chart: '<path d="M4 20V10M10 20V4M16 20v-7M22 20H2"/>',
    card: '<rect x="3" y="5.5" width="18" height="13" rx="3"/><path d="M3 10h18M7 15h4"/>',
    mega: '<path d="M4 10v4a1 1 0 0 0 1 1h2l5 4V5L7 9H5a1 1 0 0 0-1 1zM16 8.5a5 5 0 0 1 0 7M18.5 6a8.5 8.5 0 0 1 0 12"/>',
    tag: '<path d="M3 12V4h8l10 10-8 8z"/><circle cx="7.5" cy="7.5" r="1.5"/>',
    share: '<circle cx="18" cy="5" r="2.5"/><circle cx="6" cy="12" r="2.5"/><circle cx="18" cy="19" r="2.5"/><path d="m8.2 10.8 7.6-4.4M8.2 13.2l7.6 4.4"/>',
    store: '<path d="M4 9.5 5.5 4h13L20 9.5M4 9.5V20h16V9.5M4 9.5a2.7 2.7 0 0 0 5.3 0 2.7 2.7 0 0 0 5.4 0 2.7 2.7 0 0 0 5.3 0M10 20v-5h4v5"/>',
    plus: '<path d="M12 5v14M5 12h14"/>',
    eye: '<path d="M2 12s3.6-7 10-7 10 7 10 7-3.6 7-10 7S2 12 2 12z"/><circle cx="12" cy="12" r="3"/>',
    moon: '<path d="M20 14.5A8 8 0 0 1 9.5 4a8 8 0 1 0 10.5 10.5z"/>',
    out: '<path d="M15 4h3a2 2 0 0 1 2 2v12a2 2 0 0 1-2 2h-3M10 17l5-5-5-5M15 12H3"/>',
    back: '<path d="M15 5l-7 7 7 7"/>',
    side: '<rect x="3.5" y="4" width="17" height="16" rx="3.5"/><path d="M9.5 4v16M14.5 10l-2 2 2 2"/>',
    link: '<path d="M10 14a4 4 0 0 0 5.7 0l3-3a4 4 0 0 0-5.7-5.7l-1 1M14 10a4 4 0 0 0-5.7 0l-3 3a4 4 0 0 0 5.7 5.7l1-1"/>',
    lock: '<rect x="5" y="10.5" width="14" height="10" rx="2.5"/><path d="M8.5 10.5V7.5a3.5 3.5 0 0 1 7 0v3"/>',
    check: '<path d="m5 12.5 4.5 4.5L19 7.5"/>',
    arrow: '<path d="M5 12h14M13 6l6 6-6 6"/>',
    pin: '<path d="M12 21s-6.5-5.6-6.5-11a6.5 6.5 0 0 1 13 0c0 5.4-6.5 11-6.5 11z"/><circle cx="12" cy="10" r="2.3"/>',
    users: '<circle cx="9" cy="8" r="3.5"/><path d="M2.5 20a6.5 6.5 0 0 1 13 0M16 4.6a3.5 3.5 0 0 1 0 6.8M18 14a6.5 6.5 0 0 1 3.5 6"/>',
    bell: '<path d="M6 16V11a6 6 0 0 1 12 0v5l1.5 2h-15zM10 20.5a2.2 2.2 0 0 0 4 0"/>',
    money: '<rect x="2.5" y="6" width="19" height="12" rx="2.5"/><circle cx="12" cy="12" r="2.8"/><path d="M6 9.5v5M18 9.5v5"/>',
    gear: '<circle cx="12" cy="12" r="3"/><path d="M12 2.5v3M12 18.5v3M4.2 6.2l2.1 2.1M17.7 15.7l2.1 2.1M2.5 12h3M18.5 12h3M4.2 17.8l2.1-2.1M17.7 8.3l2.1-2.1"/>',
    image: '<rect x="3" y="4.5" width="18" height="15" rx="3"/><circle cx="9" cy="10" r="1.8"/><path d="m21 16-5-5-9 8.5"/>',
    chat: '<path d="M4 5.5h16v10H9l-5 4z"/>',
    list: '<path d="M9 6h11M9 12h11M9 18h11M4.5 6h.01M4.5 12h.01M4.5 18h.01"/>',
    shield: '<path d="M12 3 5 6v5.5c0 4.5 3 7.8 7 9.5 4-1.7 7-5 7-9.5V6z"/><path d="m9 12 2 2 4-4"/>',
    pix: '<path d="m12 3 4 4-4 4-4-4zM12 13l4 4-4 4-4-4zM3 12l4-4 4 4-4 4zM13 12l4-4 4 4-4 4z"/>'
  };
  function ic(n) { return '<svg class="i" viewBox="0 0 24 24" aria-hidden="true">' + (IC[n] || IC.grid) + "</svg>"; }
  function esc(s) { return String(s == null ? "" : s).replace(/[&<>"']/g, function (c) { return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]; }); }
  function lerAtivo(ch) { try { return sessionStorage.getItem("dash-" + ch) || ""; } catch (e) { return ""; } }
  function gravaAtivo(ch, v) { try { sessionStorage.setItem("dash-" + ch, v); } catch (e) { /* ok */ } }
  function compacto() { try { return localStorage.getItem("dash-compacto") === "1"; } catch (e) { return false; } }

  /* o = { chave, marca, titulo, sub, avatar, menu: [{id, nome, ic, n, grupo}], secoes: {id: html}, pe: [{nome, ic, href|acao}] } */
  function montar(o) {
    var ids = o.menu.map(function (m) { return m.id; }), at = lerAtivo(o.chave);
    if (ids.indexOf(at) < 0) at = ids[0];
    var grupos = [], porGrupo = {};
    o.menu.forEach(function (m) { var g = m.grupo || ""; if (!porGrupo[g]) { porGrupo[g] = []; grupos.push(g); } porGrupo[g].push(m); });
    function item(m) { return '<button type="button" class="dk-it" data-dk="' + esc(m.id) + '" aria-current="' + (m.id === at) + '" title="' + esc(m.nome) + '">' + ic(m.ic) + "<span>" + esc(m.nome) + "</span>" + (m.n ? "<em>" + esc(m.n) + "</em>" : "") + "</button>"; }
    var lado = '<aside class="dk-side" aria-label="Menu do painel"><div class="dk-top"><span class="dk-av">' + esc(o.avatar || "?") + '</span><span class="dk-who"><b>' + esc(o.titulo) + "</b><small>" + esc(o.marca) + '</small></span><button type="button" class="dk-min" data-dk-min aria-label="Recolher menu">' + ic("side") + "</button></div>" +
      '<nav class="dk-nav">' + grupos.map(function (g) { return (g ? '<p class="dk-g">' + esc(g) + "</p>" : "") + porGrupo[g].map(item).join(""); }).join("") + "</nav>" +
      '<div class="dk-pe">' + (o.pe || []).map(function (p) { return p.href ? '<a class="dk-it" href="' + esc(p.href) + '" title="' + esc(p.nome) + '">' + ic(p.ic) + "<span>" + esc(p.nome) + "</span></a>" : '<button type="button" class="dk-it" ' + p.acao + ' title="' + esc(p.nome) + '">' + ic(p.ic) + "<span>" + esc(p.nome) + "</span></button>"; }).join("") + "</div></aside>";
    var pilulas = '<nav class="dk-pills" aria-label="Seções do painel">' + grupos.map(function (g) { return (g && grupos.length > 1 ? '<p class="dk-pg">' + esc(g) + "</p>" : "") + porGrupo[g].map(function (m) { return '<button type="button" data-dk="' + esc(m.id) + '" aria-current="' + (m.id === at) + '">' + ic(m.ic) + esc(m.nome) + (m.n ? "<em>" + esc(m.n) + "</em>" : "") + "</button>"; }).join(""); }).join("") + "</nav>";
    var corpo = o.menu.map(function (m) { return '<div class="dk-sec" data-dk-sec="' + esc(m.id) + '"' + (m.id === at ? "" : " hidden") + '><header class="dk-h"><div><p class="dk-eb">' + esc(o.marca) + '</p><h1>' + esc(m.titulo || m.nome) + "</h1>" + (m.sub ? '<p class="dk-sub">' + m.sub + "</p>" : "") + "</div>" + (m.acao || "") + "</header>" + (o.secoes[m.id] || "") + "</div>"; }).join("");
    return '<section class="dk' + (compacto() ? " mini" : "") + '" data-dk-chave="' + esc(o.chave) + '">' + lado + '<div class="dk-main">' + (o.topo || "") + pilulas + corpo + "</div></section>";
  }
  function vai(root, id) {
    var ch = root.dataset.dkChave; gravaAtivo(ch, id);
    Array.from(root.querySelectorAll("[data-dk]")).forEach(function (b) { b.setAttribute("aria-current", b.dataset.dk === id); });
    Array.from(root.querySelectorAll("[data-dk-sec]")).forEach(function (s) { s.hidden = s.dataset.dkSec !== id; });
    var pb = root.querySelector('.dk-pills [data-dk="' + id + '"]'); if (pb && pb.scrollIntoView) pb.scrollIntoView({ block: "nearest", inline: "center" });
    var sec = root.querySelector('[data-dk-sec="' + id + '"]'), alvo = window.innerWidth < 960 && sec ? sec : root, top = alvo.getBoundingClientRect().top;
    if (top < 0 || (alvo === sec && top > window.innerHeight * 0.45)) window.scrollTo({ top: top + window.scrollY - 84, behavior: "smooth" });
    document.dispatchEvent(new CustomEvent("dash-secao", { detail: { chave: ch, id: id } }));
  }
  document.addEventListener("click", function (e) {
    var b = e.target.closest("[data-dk]"), root = e.target.closest(".dk");
    if (b && root) { vai(root, b.dataset.dk); return; }
    var ir = e.target.closest("[data-dk-ir]"); if (ir) { var r = document.querySelector(".dk"); if (r) vai(r, ir.dataset.dkIr); return; }
    if (e.target.closest("[data-dk-min]") && root) { var m = !root.classList.contains("mini"); root.classList.toggle("mini", m); try { localStorage.setItem("dash-compacto", m ? "1" : "0"); } catch (er) { /* ok */ } }
  });
  window.Dash = { montar: montar, ic: ic, vai: function (id) { var r = document.querySelector(".dk"); if (r) vai(r, id); } };
})();
