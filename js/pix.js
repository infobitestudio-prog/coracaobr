/* Pix "copia e cola" e QR Code (padrão BR Code do Banco Central), gerados no próprio navegador com o valor da compra.
   Chave, favorecido e cidade vêm do Painel master → Pagamentos. */
(function () {
  "use strict";
  var G = window.Guia; if (!G) return;
  function campo(id, v) { v = String(v); return id + String(v.length).padStart(2, "0") + v; }
  function crc16(s) {
    var crc = 0xFFFF;
    for (var i = 0; i < s.length; i++) { crc ^= s.charCodeAt(i) << 8; for (var j = 0; j < 8; j++) crc = crc & 0x8000 ? (crc << 1) ^ 0x1021 : crc << 1; crc &= 0xFFFF; }
    return crc.toString(16).toUpperCase().padStart(4, "0");
  }
  function limpa(t, n) { return String(t || "").normalize("NFD").replace(/[̀-ͯ]/g, "").replace(/[^A-Za-z0-9 ]/g, "").toUpperCase().trim().slice(0, n); }
  /* chave: CPF/CNPJ só números; telefone com +55; e-mail e chave aleatória como estão */
  /* nome do recebedor no QR: até 25 letras, cortando na palavra inteira */
  function nomeQR(n) { var t = limpa(n, 80); if (t.length <= 25) return t; t = t.slice(0, 26); var i = t.lastIndexOf(" "); return (i > 3 ? t.slice(0, i) : t.slice(0, 25)).trim(); }
  function chave(k) {
    k = String(k || "").trim();
    if (/@/.test(k) || /^[0-9a-f]{8}-[0-9a-f]{4}-/i.test(k)) return k;
    var d = k.replace(/\D/g, "");
    if (/^\+/.test(k)) return "+" + d;
    return d.length === 11 || d.length === 14 ? d : k;
  }
  function payload(o) {
    var gui = campo("00", "br.gov.bcb.pix") + campo("01", chave(o.chave)) + (o.descricao ? campo("02", limpa(o.descricao, 40)) : "");
    var txid = (String(o.txid || "CORACAOBR").replace(/[^A-Za-z0-9]/g, "") || "CORACAOBR").slice(0, 25);
    var s = campo("00", "01") + campo("26", gui) + campo("52", "0000") + campo("53", "986") + (Number(o.valor) > 0 ? campo("54", Number(o.valor).toFixed(2)) : "") +
      campo("58", "BR") + campo("59", nomeQR(o.nome) || "CORACAOBR") + campo("60", limpa(o.cidade, 15) || "BRASIL") + campo("62", campo("05", txid)) + "6304";
    return s + crc16(s);
  }
  function qrSvg(texto) {
    if (!window.qrcode) return "";
    var q = window.qrcode(0, "M"); q.addData(texto); q.make();
    return q.createSvgTag({ cellSize: 5, margin: 2, scalable: true });
  }
  function tipoChave(k) { k = String(k || ""); return /@/.test(k) ? "e-mail · Mercado Pago" : k.replace(/\D/g, "").length === 14 ? "CNPJ" : k.replace(/\D/g, "").length === 11 ? "CPF" : /^\+/.test(k) ? "telefone" : "chave aleatória"; }
  function dados() {
    var p = G.config().pagamentos || {};
    return { chave: G.chavePix ? G.chavePix(p.pix) : "coracaobr.oficial@gmail.com", nome: p.pixNome || "Danilo Araujo Santos Desenvolvedor", cidade: p.pixCidade || "BRASIL" };
  }
  /* bloco pronto: QR + copia e cola + dados do favorecido */
  function bloco(valor, txid, descricao) {
    var d = dados(), code = payload({ chave: d.chave, nome: d.nome, cidade: d.cidade, valor: valor, txid: txid, descricao: descricao });
    return '<div class="pix"><div class="pix-qr" aria-label="QR Code Pix">' + qrSvg(code) + '</div><div class="pix-info"><p class="pix-v"><small>Valor</small><b>' + G.reais(valor) + "</b></p>" +
      '<dl class="pix-dl"><dt>Chave Pix (' + tipoChave(d.chave) + ')</dt><dd>' + G.esc(d.chave) + "</dd><dt>Favorecido</dt><dd>" + G.esc(d.nome) + "</dd></dl>" +
      '<label class="pix-l" for="pix-cc">Pix copia e cola</label><textarea id="pix-cc" class="pix-cc" readonly rows="3">' + G.esc(code) + '</textarea>' +
      '<div class="row" style="gap:8px"><button type="button" class="btn sm" data-copiar="' + G.esc(code) + '">Copiar código Pix</button><button type="button" class="btn ghost sm" data-copiar="' + G.esc(d.chave) + '">Copiar chave</button></div>' +
      '<p class="small muted">Abra o app do seu banco, escolha Pix → Ler QR Code ou Pix copia e cola. ' + (Number(valor) > 0 ? "O valor já vem preenchido." : "Depois é só digitar o valor que quiser.") + '</p></div></div>';
  }
  /* copiar (fora da ficha do lugar, que tem o próprio tratamento) */
  document.addEventListener("click", function (e) {
    var b = e.target.closest("[data-copiar]"); if (!b || b.closest("#sheet-card")) return;
    var t = b.dataset.copiar, ok = function () { G.toast(/^000201/.test(t) ? "Código Pix copiado. Cole no app do banco." : "Copiado."); };
    if (navigator.clipboard) navigator.clipboard.writeText(t).then(ok).catch(function () { G.toast(t); }); else G.toast(t);
  });
  /* gera o Pix pela chave (copia e cola + QR em SVG), com valor ou em aberto */
  function gerar(valor, txid, descricao) { var d = dados(), code = payload({ chave: d.chave, nome: d.nome, cidade: d.cidade, valor: valor, txid: txid, descricao: descricao }); return { code: code, svg: qrSvg(code), chave: d.chave, nome: d.nome }; }
  window.Pix = { payload: payload, bloco: bloco, dados: dados, crc16: crc16, gerar: gerar, nomeQR: nomeQR };
})();
