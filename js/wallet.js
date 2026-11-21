/* Salvar no celular: cupom do guia e carteirinha do Clube na Apple Wallet (iPhone) ou no Google Wallet (Android).
   O servidor gera o passe com as credenciais cadastradas no Painel master. Sem credenciais, o botão salva o cartão como
   imagem (com o QR que abre a página de resgate/validação), para guardar nas Fotos e mostrar no balcão. */
(function () {
  "use strict";
  var cfg = null;
  function esc(s) { return String(s == null ? "" : s).replace(/[&<>"']/g, function (c) { return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]; }); }
  function plataforma() { var ua = navigator.userAgent || ""; if (/iPhone|iPad|iPod/.test(ua) || (/Macintosh/.test(ua) && "ontouchend" in document)) return "apple"; if (/Android/.test(ua)) return "google"; return "outro"; }
  var IC = '<svg class="i" viewBox="0 0 24 24" aria-hidden="true"><rect x="3" y="5" width="18" height="14" rx="3"/><path d="M3 10h18M15 15h3"/></svg>';
  function botao(tipo, id, info) {
    info = info || {}; var p = plataforma();
    return '<button type="button" class="btn sm wl-bt" data-wallet="' + esc(tipo) + '" data-wallet-id="' + esc(id) + '" data-wl-nome="' + esc(info.nome || "") + '" data-wl-linha="' + esc(info.linha || "") + '">' + IC +
      (p === "apple" ? "Adicionar à Apple Wallet" : p === "google" ? "Salvar no Google Wallet" : "Salvar no celular") + "</button>";
  }
  function carregaCfg() {
    if (cfg) return Promise.resolve(cfg);
    if (!(window.Store && Store.servidor && Store.servidor())) return Promise.resolve({});
    return fetch("api/index.php?acao=wallet_cfg", { credentials: "same-origin" }).then(function (r) { return r.json(); }).then(function (j) { cfg = j || {}; return cfg; }).catch(function () { return {}; });
  }
  function link(tipo, id) { return location.href.split("#")[0] + (tipo === "cupom" ? "#resgate-" + id : "#clube-validar-" + encodeURIComponent(id)); }
  /* plano B: o cartão como imagem (1080 × 1350), com o QR e o código */
  function imagem(tipo, id, b) {
    var W = 1080, H = 1350, c = document.createElement("canvas"); c.width = W; c.height = H; var x = c.getContext("2d");
    var verde = tipo === "cupom", fundo = verde ? "#087A36" : "#FFC20E", tinta = verde ? "#FFFFFF" : "#111111";
    var gr = x.createLinearGradient(0, 0, W, H); gr.addColorStop(0, fundo); gr.addColorStop(1, verde ? "#12A24C" : "#FFDA55"); x.fillStyle = gr; x.fillRect(0, 0, W, H);
    x.fillStyle = tinta; x.font = "800 64px system-ui, -apple-system, sans-serif"; x.fillText("CoraçãoBR", 80, 140);
    x.font = "600 34px system-ui, sans-serif"; x.globalAlpha = .85; x.fillText(verde ? "CUPOM DO GUIA" : "CLUBE CORAÇÃOBR · CARTEIRINHA", 80, 200); x.globalAlpha = 1;
    var quebra = function (t, y, tam, max) { x.font = "800 " + tam + "px system-ui, sans-serif"; var ps = String(t || "").split(" "), l = "", n = 0; ps.forEach(function (p) { var t2 = l ? l + " " + p : p; if (x.measureText(t2).width > W - 160 && l) { x.fillText(l, 80, y + n * (tam + 10)); l = p; n++; } else l = t2; }); if (l && n < max) x.fillText(l, 80, y + n * (tam + 10)); return y + (n + 1) * (tam + 10); };
    var y = quebra(b.dataset.wlLinha || (verde ? "Desconto do guia" : "Membro do Clube"), 300, 64, 3);
    x.font = "500 40px system-ui, sans-serif"; x.globalAlpha = .9; x.fillText(String(b.dataset.wlNome || "").slice(0, 40), 80, y + 10); x.globalAlpha = 1;
    // QR num quadro branco
    var q = window.qrcode ? window.qrcode(0, "M") : null, lado = 560, qx = (W - lado) / 2, qy = 620;
    x.fillStyle = "#FFFFFF"; x.beginPath(); if (x.roundRect) x.roundRect(qx - 30, qy - 30, lado + 60, lado + 60, 36); else x.rect(qx - 30, qy - 30, lado + 60, lado + 60); x.fill();
    if (q) { q.addData(link(tipo, id)); q.make(); var n = q.getModuleCount(), cel = lado / n; x.fillStyle = "#111111"; for (var r = 0; r < n; r++) for (var k = 0; k < n; k++) if (q.isDark(r, k)) x.fillRect(qx + k * cel, qy + r * cel, Math.ceil(cel), Math.ceil(cel)); }
    x.fillStyle = tinta; x.textAlign = "center"; x.font = "800 56px ui-monospace, Menlo, monospace"; x.fillText(verde ? id : "Nº " + (b.dataset.wlCodigo || String(id).slice(-8).toUpperCase()), W / 2, qy + lado + 110);
    x.font = "500 30px system-ui, sans-serif"; x.globalAlpha = .9; x.fillText("Mostre no balcão: o atendente aponta a câmera para o QR.", W / 2, qy + lado + 165); x.globalAlpha = 1;
    c.toBlob(function (blob) {
      if (!blob) return; var nome = (verde ? "cupom-" + id : "clube-coracaobr") + ".png", f = null;
      try { f = new File([blob], nome, { type: "image/png" }); } catch (e) { f = null; }
      if (f && navigator.canShare && navigator.canShare({ files: [f] })) { navigator.share({ files: [f], title: verde ? "Cupom CoraçãoBR" : "Carteirinha do Clube CoraçãoBR" }).catch(function () {}); return; }
      var a = document.createElement("a"); a.href = URL.createObjectURL(blob); a.download = nome; document.body.appendChild(a); a.click(); setTimeout(function () { URL.revokeObjectURL(a.href); a.remove(); }, 2000);
      if (window.Guia && Guia.toast) Guia.toast("Imagem salva. Guarde nas Fotos para mostrar no balcão.");
    }, "image/png");
  }
  document.addEventListener("click", function (e) {
    var b = e.target.closest && e.target.closest("[data-wallet]"); if (!b) return; e.preventDefault();
    var tipo = b.dataset.wallet, id = b.dataset.walletId, p = plataforma();
    carregaCfg().then(function (c) {
      var url = "api/index.php?acao=wallet&tipo=" + encodeURIComponent(tipo) + "&id=" + encodeURIComponent(id);
      if (p === "apple" && c.apple) { location.href = url; return; }
      if (p === "google" && c.google) { location.href = url + "&fmt=google"; return; }
      if (p === "outro" && c.google) { window.open(url + "&fmt=google", "_blank", "noopener"); return; }
      imagem(tipo, id, b);
    });
  });
  window.Wallet = { botao: botao, plataforma: plataforma };
})();
