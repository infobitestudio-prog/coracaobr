/* CEP do Brasil ou ZIP code dos EUA: o formato identifica o país (8 números = Brasil; 5 números, ou ZIP+4 = EUA).
   Qualquer campo com data-cep ganha, sozinho: marca d'água, máscara (00000-000 ou 00000), selo do país enquanto digita e a busca do
   endereço (Brasil: rua, bairro, cidade e UF; EUA: cidade e estado, porque o ZIP cobre uma área e não uma rua).
   Quando acha, dispara o evento "cep" no campo com os dados (para os editores preencherem endereço e coordenadas). */
(function () {
  "use strict";
  var PH = "CEP (Brasil) ou ZIP (EUA)";
  var cache = {};
  function dig(v) { return String(v == null ? "" : v).replace(/\D/g, ""); }
  function tipo(v) { var n = dig(v).length; return n === 8 ? "BR" : (n === 5 || n === 9) ? "US" : null; }
  function valido(v) { return !!tipo(v); }
  function formata(v) { var d = dig(v).slice(0, 9); return d.length > 5 ? d.slice(0, 5) + "-" + d.slice(5) : d; }
  function normal(v) { var d = dig(v), t = tipo(d); return t === "BR" ? d.slice(0, 5) + "-" + d.slice(5) : t === "US" ? d.slice(0, 5) : ""; }
  function esc(s) { return String(s == null ? "" : s).replace(/[&<>"']/g, function (c) { return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]; }); }
  /* selo enquanto digita */
  function selo(v) {
    var n = dig(v).length;
    if (!n) return { cls: "", txt: "" };
    if (n < 5) return { cls: "", txt: "digitando…" };
    if (n === 5) return { cls: "us", txt: "🇺🇸 ZIP · EUA" };
    if (n < 8) return { cls: "br", txt: "🇧🇷 CEP · Brasil…" };
    if (n === 8) return { cls: "br", txt: "🇧🇷 CEP · Brasil" };
    return { cls: "us", txt: "🇺🇸 ZIP+4 · EUA" };
  }
  function servidor() { return !!(window.Store && Store.servidor && Store.servidor()); }
  /* busca direta (sem servidor): ViaCEP no Brasil, Zippopotam nos EUA */
  function direto(cep, t) {
    if (t === "BR") return fetch("https://viacep.com.br/ws/" + dig(cep) + "/json/").then(function (r) { return r.json(); }).then(function (v) {
      if (!v || v.erro || !v.localidade) throw new Error("CEP não encontrado. Confira os 8 números.");
      var o = { pais: "BR", paisNome: "Brasil", cep: cep, rua: v.logradouro || "", bairro: v.bairro || "", cidade: v.localidade, uf: v.uf || "", lat: null, lng: null };
      o.regiao = (o.bairro ? o.bairro + ", " : "") + o.cidade + "/" + o.uf; o.endereco = [o.rua, o.bairro, o.cidade + " - " + o.uf, cep].filter(Boolean).join(", "); return o;
    });
    return fetch("https://api.zippopotam.us/us/" + cep).then(function (r) { if (!r.ok) throw new Error("ZIP code não encontrado. Confira os 5 números."); return r.json(); }).then(function (j) {
      var p = (j.places || [])[0]; if (!p) throw new Error("ZIP code não encontrado. Confira os 5 números.");
      var o = { pais: "US", paisNome: "Estados Unidos", cep: cep, rua: "", bairro: "", cidade: p["place name"], uf: p["state abbreviation"], lat: Number(p.latitude), lng: Number(p.longitude) };
      o.regiao = o.cidade + ", " + o.uf; o.endereco = o.cidade + ", " + o.uf + " " + cep; return o;
    });
  }
  function busca(v) {
    var cep = normal(v), t = tipo(v);
    if (!cep) return Promise.reject(new Error("Digite um CEP do Brasil (8 números) ou um ZIP code dos EUA (5 números)."));
    if (cache[cep]) return Promise.resolve(cache[cep]);
    var p = servidor()
      ? fetch("api/index.php?acao=cep&cep=" + encodeURIComponent(cep), { credentials: "same-origin" }).then(function (r) { return r.json().then(function (j) { if (!r.ok || !j.ok) throw new Error(j.erro || "Não encontrado."); return j; }); })
      : direto(cep, t);
    return p.then(function (o) { cache[cep] = o; return o; });
  }
  function texto(o) { return o.pais === "BR" ? [o.rua, o.bairro, o.cidade + "/" + o.uf].filter(Boolean).join(" · ") + " · Brasil" : o.cidade + ", " + o.uf + " · EUA"; }
  /* liga um campo: cria o selo e a linha do resultado ao lado */
  function prepara(inp) {
    if (inp.dataset.cepOk) return; inp.dataset.cepOk = "1";
    if (!inp.placeholder || /75201|75024|ZIP/.test(inp.placeholder)) inp.placeholder = PH;
    inp.setAttribute("maxlength", "10"); inp.setAttribute("inputmode", "numeric"); inp.setAttribute("autocomplete", "postal-code"); inp.removeAttribute("pattern");
    inp.setAttribute("aria-describedby", (inp.id || "cep") + "-res");
    var w = document.createElement("span"); w.className = "cep-w"; inp.parentNode.insertBefore(w, inp); w.appendChild(inp);
    var s = document.createElement("span"); s.className = "cep-id"; s.setAttribute("aria-hidden", "true"); w.appendChild(s);
    var r = document.createElement("small"); r.className = "cep-res"; r.id = (inp.id || "cep") + "-res"; r.setAttribute("aria-live", "polite"); w.parentNode.insertBefore(r, w.nextSibling);
    pinta(inp, true);
  }
  function pinta(inp, inicial) {
    var w = inp.parentNode, s = w.querySelector(".cep-id"), r = w.nextSibling, sl = selo(inp.value);
    s.textContent = sl.txt; s.className = "cep-id " + sl.cls;
    clearTimeout(inp._cepT); var cep = normal(inp.value);
    if (!cep) { r.textContent = ""; r.className = "cep-res"; return; }
    var acha = function () {
      r.textContent = "Buscando o endereço…"; r.className = "cep-res";
      busca(cep).then(function (o) {
        if (normal(inp.value) !== cep) return;
        r.innerHTML = "📍 " + esc(texto(o)); r.className = "cep-res ok"; inp._cep = o;
        if (!inicial) inp.dispatchEvent(new CustomEvent("cep", { detail: o, bubbles: true }));
      }).catch(function (er) { if (normal(inp.value) !== cep) return; r.textContent = er.message || "Não encontramos esse código."; r.className = "cep-res erro"; inp._cep = null; });
    };
    /* 5 números pode ser um ZIP completo ou o começo de um CEP: espera um pouco antes de buscar */
    inp._cepT = setTimeout(acha, inicial ? 0 : (dig(inp.value).length === 5 ? 900 : 250));
  }
  document.addEventListener("input", function (e) {
    var inp = e.target; if (!inp.matches || !inp.matches("input[data-cep]")) return;
    prepara(inp); var f = formata(inp.value); if (f !== inp.value) inp.value = f; pinta(inp, false);
  });
  /* campos que aparecem na tela já com valor (ex.: Meus dados) */
  function varre(root) { Array.prototype.forEach.call((root || document).querySelectorAll("input[data-cep]:not([data-cep-ok])"), prepara); }
  var agendado = false;
  new MutationObserver(function () { if (agendado) return; agendado = true; requestAnimationFrame(function () { agendado = false; varre(); }); }).observe(document.documentElement, { childList: true, subtree: true });
  document.addEventListener("DOMContentLoaded", function () { varre(); });
  window.Cep = { tipo: tipo, valido: valido, formata: formata, normal: normal, busca: busca, texto: texto, PH: PH, ERRO: "Informe seu CEP do Brasil (8 números, ex.: 03081-003) ou o ZIP code dos EUA (5 números, ex.: 75201)." };
})();
