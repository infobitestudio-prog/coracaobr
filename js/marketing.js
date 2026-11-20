/* Google e tráfego pago: GA4, Google Tag Manager, Google Ads (conversões) e Pixel da Meta, configurados no
   Painel master → Configurações → Google e anúncios (config geral.marketing). Nada é carregado sem o aceite
   do aviso de cookies (LGPD). Eventos medidos: page_view (cada tela), sign_up (cadastro), purchase (Pix
   confirmado, com valor em BRL), contact (clique no WhatsApp/telefone de um lugar) e generate_lead (Anunciar). */
(function () {
  "use strict";
  var G = window.Guia; if (!G) return;
  var carregado = false, fila = [];
  function cfg() { return (G.config && G.config().marketing) || {}; }
  function ativo() { var c = cfg(); return !!(c.ga4 || c.gtm || c.ads || c.pixel); }
  function consent(v) { try { if (v === undefined) return localStorage.getItem("cookies-ok"); localStorage.setItem("cookies-ok", v); } catch (e) { return null; } return v; }
  function script(src) { var s = document.createElement("script"); s.async = true; s.src = src; document.head.appendChild(s); }
  function valido(id, re) { return re.test(String(id || "")); }
  function carrega() {
    if (carregado || !ativo() || consent() !== "sim") return; carregado = true;
    var c = cfg();
    window.dataLayer = window.dataLayer || [];
    window.gtag = window.gtag || function () { window.dataLayer.push(arguments); };
    if (valido(c.gtm, /^GTM-[A-Z0-9]{4,12}$/)) { window.dataLayer.push({ "gtm.start": Date.now(), event: "gtm.js" }); script("https://www.googletagmanager.com/gtm.js?id=" + c.gtm); }
    var gid = valido(c.ga4, /^G-[A-Z0-9]{4,14}$/) ? c.ga4 : valido(c.ads, /^AW-\d{6,14}$/) ? c.ads : "";
    if (gid) {
      script("https://www.googletagmanager.com/gtag/js?id=" + gid);
      gtag("js", new Date());
      if (valido(c.ga4, /^G-[A-Z0-9]{4,14}$/)) gtag("config", c.ga4, { send_page_view: false });
      if (valido(c.ads, /^AW-\d{6,14}$/)) gtag("config", c.ads);
    }
    if (valido(c.pixel, /^\d{8,20}$/)) {
      (function (f, b, e, v, n, t, s) { if (f.fbq) return; n = f.fbq = function () { n.callMethod ? n.callMethod.apply(n, arguments) : n.queue.push(arguments); }; if (!f._fbq) f._fbq = n; n.push = n; n.loaded = true; n.version = "2.0"; n.queue = []; t = b.createElement(e); t.async = true; t.src = v; s = b.getElementsByTagName(e)[0]; s.parentNode.insertBefore(t, s); })(window, document, "script", "https://connect.facebook.net/en_US/fbevents.js");
      window.fbq("init", c.pixel);
    }
    fila.splice(0).forEach(function (x) { evento(x[0], x[1]); });
    pagina();
  }
  /* evento de conversão: vai para GA4, Google Ads (se houver rótulo) e Pixel da Meta */
  function evento(nome, dados) {
    if (!ativo()) return; if (!carregado) { if (fila.length < 30) fila.push([nome, dados]); return; }
    var c = cfg(), d = dados || {};
    if (window.gtag && valido(c.ga4, /^G-[A-Z0-9]{4,14}$/)) gtag("event", nome, d);
    var rot = { sign_up: c.adsCadastro, purchase: c.adsCompra, contact: c.adsContato }[nome];
    if (window.gtag && valido(c.ads, /^AW-\d{6,14}$/) && rot) gtag("event", "conversion", Object.assign({ send_to: c.ads + "/" + rot }, d.value ? { value: d.value, currency: d.currency || "BRL" } : {}));
    if (window.fbq) { var fb = { sign_up: "CompleteRegistration", purchase: "Purchase", contact: "Contact", generate_lead: "Lead", page_view: "PageView" }[nome]; if (fb) window.fbq("track", fb, d.value ? { value: d.value, currency: d.currency || "BRL" } : {}); }
    if (c.gtm && window.dataLayer) window.dataLayer.push(Object.assign({ event: nome }, d));
  }
  function pagina() { var h = location.hash || "#inicio"; evento("page_view", { page_location: location.href, page_path: "/" + h.replace(/^#/, ""), page_title: document.title }); }
  /* aviso de cookies: só aparece se alguma tag estiver configurada */
  function aviso() {
    if (!ativo() || consent() || document.getElementById("ck")) return;
    var d = document.createElement("div"); d.id = "ck"; d.className = "ck"; d.setAttribute("role", "dialog"); d.setAttribute("aria-label", "Aviso de cookies");
    d.innerHTML = '<p>Usamos cookies para medir as visitas e melhorar o CoraçãoBR. Veja a <a href="#privacidade">política de privacidade</a>.</p><div class="ck-a"><button type="button" class="btn sm" data-ck="sim">Aceitar</button><button type="button" class="btn sm ghost" data-ck="nao">Agora não</button></div>';
    document.body.appendChild(d);
    d.addEventListener("click", function (e) { var b = e.target.closest("[data-ck]"); if (!b) return; consent(b.dataset.ck); d.remove(); if (b.dataset.ck === "sim") carrega(); });
  }
  /* parâmetros de campanha (utm_*, gclid, fbclid) guardados para atribuir cadastro e pagamento */
  try { var q = new URLSearchParams(location.search), utm = {}; ["utm_source", "utm_medium", "utm_campaign", "utm_content", "utm_term", "gclid", "fbclid"].forEach(function (k) { if (q.get(k)) utm[k] = q.get(k).slice(0, 120); }); if (Object.keys(utm).length) sessionStorage.setItem("utm", JSON.stringify(utm)); } catch (e) { /* ok */ }
  function utm() { try { return JSON.parse(sessionStorage.getItem("utm") || "{}"); } catch (e) { return {}; } }
  window.addEventListener("hashchange", function () { if (carregado) pagina(); });
  document.addEventListener("click", function (e) {
    var a = e.target.closest("a[href]"); if (!a) return; var h = a.getAttribute("href") || "";
    if (/wa\.me\/|api\.whatsapp\.com|^tel:/.test(h) && /#lugar-/.test(location.hash)) evento("contact", { method: /^tel:/.test(h) ? "telefone" : "whatsapp", lugar: location.hash.replace("#lugar-", "") });
    if (h === "#anuncie" || h === "#anunciante" || a.hasAttribute("data-acesso")) evento("generate_lead", { origem: location.hash || "#inicio" });
  });
  function inicia() { if (consent() === "sim") carrega(); else setTimeout(aviso, 4000); }
  if (window.Store && Store.assinar) Store.assinar(function f() { if (Store.estado && Store.estado.pronto && !f.ok) { f.ok = true; inicia(); } });
  window.Mkt = { evento: evento, utm: utm, carrega: carrega, ativo: ativo };
})();
