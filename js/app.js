/* Páginas públicas: início, explorar, ranking, anuncie, entrar. O lugar abre como folha que sobe da base. */
(function () {
  "use strict";
  var $ = function (s, r) { return (r || document).querySelector(s); };
  var app = $("#app"), sheet = $("#sheet"), sheetCard = $("#sheet-card"), popup = $("#popup");
  /* Cidades do guia: cada lugar tem regiaoGuia (sem o campo = Dallas–Fort Worth). A escolha fica salva no aparelho. */
  var CIDADES_GUIA = {
    dfw: { id: "dfw", nome: "Dallas–Fort Worth", curto: "DFW", principal: "Dallas", capa: "img/hero/klyde-warren-park-m.jpg", lat: 32.7767, lng: -96.797, partidas: [["Centro de Dallas", 32.7767, -96.797], ["Aeroporto DFW", 32.8998, -97.0403], ["Aeroporto Love Field", 32.8471, -96.8518], ["Uptown", 32.8003, -96.8003], ["Plano", 33.0198, -96.6989], ["Frisco", 33.1507, -96.8236], ["Irving / Las Colinas", 32.8686, -96.9395], ["Fort Worth", 32.7555, -97.3308], ["Arlington", 32.7357, -97.1081]] },
    houston: { id: "houston", nome: "Houston", curto: "HOU", principal: "Houston", capa: "fotos_cidades/houston/hou-buffalo-bayou-park/hou-buffalo-bayou-park-1.jpg", lat: 29.7604, lng: -95.3698, partidas: [["Centro de Houston", 29.7604, -95.3698], ["Aeroporto IAH (Bush)", 29.9902, -95.3368], ["Aeroporto Hobby", 29.6454, -95.2789], ["Galleria / Uptown", 29.7398, -95.4614], ["Sugar Land", 29.6197, -95.6349], ["Katy", 29.7858, -95.8245], ["The Woodlands", 30.1658, -95.4613], ["Pearland", 29.5636, -95.286]] },
    austin: { id: "austin", nome: "Austin", curto: "AUS", principal: "Austin", capa: "fotos_cidades/austin/aus-texas-state-capitol/aus-texas-state-capitol-1.jpg", lat: 30.2672, lng: -97.7431, partidas: [["Centro de Austin", 30.2672, -97.7431], ["Aeroporto de Austin (AUS)", 30.1975, -97.6664], ["South Congress", 30.2499, -97.7495], ["The Domain", 30.4021, -97.7253], ["Round Rock", 30.5083, -97.6789], ["Cedar Park", 30.5052, -97.8203], ["Pflugerville", 30.4394, -97.62]] },
    sanantonio: { id: "sanantonio", nome: "San Antonio", curto: "SAT", principal: "San Antonio", capa: "fotos_cidades/sanantonio/sat-river-walk/sat-river-walk-1.jpg", lat: 29.4241, lng: -98.4936, partidas: [["Centro / River Walk", 29.4241, -98.4936], ["Aeroporto de San Antonio (SAT)", 29.5337, -98.4698], ["Alamo Heights", 29.4849, -98.4655], ["Stone Oak", 29.6366, -98.4913], ["The Rim / La Cantera", 29.6052, -98.6034], ["New Braunfels", 29.703, -98.1245]] }
  };
  function lerLocal(k) { try { return localStorage.getItem(k); } catch (e) { return null; } }
  var cidadeEscolhida = CIDADES_GUIA[lerLocal("cidade")] ? lerLocal("cidade") : null;
  function cidadeAtual() { return cidadeEscolhida || "dfw"; }
  function cid() { return CIDADES_GUIA[cidadeAtual()]; }
  function regiaoGuia(l) { return (l && l.regiaoGuia) || "dfw"; }
  var CENTRO = { lat: cid().lat, lng: cid().lng };

  var CATS = {
    museu: "Museu", parque: "Parque", historico: "Histórico", mirante: "Mirante", bairro: "Bairro", esporte: "Esporte",
    familia: "Família", compras: "Compras", arte: "Arte", natureza: "Natureza",
    "restaurante-brasileiro": "Restaurante brasileiro", churrascaria: "Churrascaria", padaria: "Padaria",
    "mercado-brasileiro": "Mercado brasileiro", "acai-cafe": "Açaí e café", bbq: "Texas BBQ", "tex-mex": "Tex-Mex",
    steakhouse: "Steakhouse", hamburguer: "Hambúrguer", "brunch-cafe": "Brunch e café", servico: "Consulado e documentos",
    "comida-sulista": "Comida sulista", asiatico: "Asiático", pizza: "Pizza", bar: "Bar", mercado: "Mercado",
    evento: "Evento", show: "Casa de shows", governo: "Prefeitura e órgãos públicos", transporte: "Transporte", saude: "Hospitais", comunidade: "Comunidade",
    handyman: "Handyman e reparos", baba: "Babá e cuidadores", piscina: "Manutenção de piscinas", limpeza: "Limpeza", jardinagem: "Jardinagem",
    construcao: "Construção e reforma", mudanca: "Mudanças e fretes", mecanico: "Mecânico", beleza: "Beleza e estética", contador: "Contador e impostos",
    imigracao: "Imigração e advogados", imoveis: "Imóveis", seguros: "Seguros", aulas: "Aulas e escolas", fotografia: "Foto e eventos", pet: "Pets",
    "saude-pt": "Saúde em português", "outros-servicos": "Outros serviços", hotel: "Hotéis e hospedagem", igreja: "Igreja"
  };
  var SERVICOS = ["handyman", "baba", "piscina", "limpeza", "jardinagem", "construcao", "mudanca", "mecanico", "beleza", "contador", "imigracao", "imoveis", "seguros", "aulas", "fotografia", "pet", "saude-pt", "outros-servicos"];
  var COMIDA = ["restaurante-brasileiro", "churrascaria", "padaria", "acai-cafe", "bbq", "tex-mex", "steakhouse", "hamburguer", "brunch-cafe", "comida-sulista", "asiatico", "pizza", "bar"];
  var SERV = SERVICOS.concat(["servico", "mercado-brasileiro", "governo", "transporte", "saude", "comunidade"]);
  var GRUPOS = {
    tudo: { nome: "Tudo", ic: "grid", f: function () { return true; } },
    passeios: { nome: "Passeios", ic: "landmark", f: function (l) { return l.tipo !== "estabelecimento" && ["compras", "evento", "show", "igreja", "governo", "transporte", "saude", "servico", "comunidade"].indexOf(l.categoria) < 0; } },
    gratis: { nome: "De graça", ic: "leaf", f: function (l) { return l.tipo !== "estabelecimento" && l.gratuito && l.categoria !== "show"; } },
    comer: { nome: "Comer", ic: "utensils", f: function (l) { return COMIDA.indexOf(l.categoria) >= 0; } },
    brasileiros: { nome: "Brasileiros", ic: "flag", f: function (l) { return !!l.brasileiro; } },
    servicos: { nome: "Serviços", ic: "briefcase", f: function (l) { return SERV.indexOf(l.categoria) >= 0; } },
    eventos: { nome: "Eventos", ic: "ticket", f: function (l) { return l.categoria === "evento" || l.categoria === "show"; } },
    compras: { nome: "Compras", ic: "bag", f: function (l) { return l.categoria === "compras" || l.categoria === "mercado"; } },
    igrejas: { nome: "Igrejas", ic: "heart", f: function (l) { return l.categoria === "igreja"; } },
    hospedagem: { nome: "Onde ficar", ic: "bed", f: function (l) { return l.categoria === "hotel"; } }
  };
  var IC = {
    bed: '<path d="M3 18V7M3 14h18v4M21 14v-3a3 3 0 0 0-3-3h-7v6"/><circle cx="7" cy="11" r="1.8"/>',
    sparkle: '<path d="M12 3l1.8 5.2L19 10l-5.2 1.8L12 17l-1.8-5.2L5 10l5.2-1.8z"/><path d="M19 16l.8 2.2L22 19l-2.2.8L19 22l-.8-2.2L16 19l2.2-.8z"/>',
    bell: '<path d="M6 16V11a6 6 0 0 1 12 0v5l2 2H4zM10 20a2 2 0 0 0 4 0"/>',
    chart: '<path d="M4 20V10M10 20V4M16 20v-7M22 20H2"/>',
    grid: '<path d="M4 4h6v6H4zM14 4h6v6h-6zM4 14h6v6H4zM14 14h6v6h-6z"/>',
    landmark: '<path d="M3 21h18M5 21V10M19 21V10M9.5 21V10M14.5 21V10M2 10l10-6 10 6z"/>',
    leaf: '<path d="M5 19c0-8 5-13 14-14 0 9-5 14-13 14zM5 19l7-7"/>',
    utensils: '<path d="M6 3v7a2 2 0 0 0 4 0V3M8 12v9M16 3c-1.5 1.5-2 4-2 6s.5 3 2 3v9"/>',
    flag: '<path d="M5 21V4M5 4h13l-3 4.5 3 4.5H5"/>',
    briefcase: '<path d="M3 8h18v11H3zM9 8V5h6v3"/>',
    bag: '<path d="M5 8h14l-1 13H6zM9 8a3 3 0 0 1 6 0"/>',
    cart: '<path d="M3 4h2l2.5 11h10L20 7H6.5"/><circle cx="9" cy="19" r="1.2"/><circle cx="17" cy="19" r="1.2"/>',
    search: '<circle cx="11" cy="11" r="7"/><path d="M20 20l-3.5-3.5"/>',
    arrow: '<path d="M5 12h14M13 6l6 6-6 6"/>',
    x: '<path d="M6 6l12 12M18 6L6 18"/>',
    down: '<path d="M6 9l6 6 6-6"/>', left: '<path d="M15 6l-6 6 6 6"/>', right: '<path d="M9 6l6 6-6 6"/>',
    ticket: '<path d="M3 8a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2v2a2 2 0 0 0 0 4v2a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-2a2 2 0 0 0 0-4z"/>',
    clock: '<circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/>',
    pin: '<path d="M12 21s7-6.3 7-11.5A7 7 0 0 0 5 9.5C5 14.7 12 21 12 21z"/><circle cx="12" cy="9.5" r="2.5"/>',
    star: '<path d="M12 3l2.7 5.6 6.1.8-4.5 4.3 1.1 6.1L12 16.9l-5.4 2.9 1.1-6.1L3.2 9.4l6.1-.8z"/>',
    megaphone: '<path d="M4 10v4h3l6 4V6l-6 4z"/><path d="M17 9a4 4 0 0 1 0 6"/>',
    doc: '<path d="M6 3h8l4 4v14H6zM14 3v4h4M9 12h6M9 16h6"/>',
    insta: '<rect x="4" y="4" width="16" height="16" rx="5"/><circle cx="12" cy="12" r="3.5"/><circle cx="16.6" cy="7.4" r=".6"/>',
    chat: '<path d="M4 20l1.4-4.2A8 8 0 1 1 8.5 19z"/>',
    mail: '<rect x="3" y="5" width="18" height="14" rx="3"/><path d="m4 7.5 8 6 8-6"/>',
    phone: '<path d="M6 3h3l1.5 4.5-2 1.5a12 12 0 0 0 6.5 6.5l1.5-2L21 15v3a3 3 0 0 1-3 3A15 15 0 0 1 3 6a3 3 0 0 1 3-3z"/>',
    cal: '<rect x="3.5" y="5" width="17" height="15.5" rx="3"/><path d="M3.5 10h17M8 3v4M16 3v4M8 14h3"/>',
    send: '<path d="M21 4 3 11l7 2 2 7 9-16z"/><path d="M10 13l11-9"/>',
    xlogo: '<path d="M4 4l16 16M20 4L4 20"/>',
    linkedin: '<rect x="3" y="3" width="18" height="18" rx="3"/><path d="M8 10v7M8 7v.01M12 17v-4a2 2 0 0 1 4 0v4M12 10v7"/>',
    book: '<path d="M4 5a2 2 0 0 1 2-2h13v16H6a2 2 0 0 0-2 2z"/><path d="M4 19V5M9 7h6"/>',
    fb: '<path d="M14 8h3V4h-3a4 4 0 0 0-4 4v3H7v4h3v6h4v-6h3l1-4h-4V8z"/>',
    share: '<path d="M12 3v12M7 8l5-5 5 5M5 13v6a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2v-6"/>',
    bulb: '<path d="M9 18h6M10 21h4M12 3a6 6 0 0 0-3.5 10.9c.6.5 1 1.3 1 2.1h5c0-.8.4-1.6 1-2.1A6 6 0 0 0 12 3z"/>',
    car: '<path d="M5 17h14M6 17v2M18 17v2M4 13l2-6h12l2 6v4H4z"/><circle cx="8" cy="14" r=".8"/><circle cx="16" cy="14" r=".8"/>',
    walk: '<circle cx="13" cy="4.5" r="1.8"/><path d="M10 21l2-6 3 3v3M9 12l2-4 4 2 2 3M11 8l-2 6"/>',
    bike: '<circle cx="6" cy="16" r="3.5"/><circle cx="18" cy="16" r="3.5"/><path d="M6 16l4-7h5l3 7M10 9l2 7"/>',
    users: '<circle cx="9" cy="8" r="3.5"/><path d="M2.5 20a6.5 6.5 0 0 1 13 0M16 4.5a3.5 3.5 0 0 1 0 7M18 14a6 6 0 0 1 3.5 6"/>',
    heart: '<path d="M12 20s-7-4.4-7-10a4 4 0 0 1 7-2.5A4 4 0 0 1 19 10c0 5.6-7 10-7 10z"/>',
    globe: '<circle cx="12" cy="12" r="9"/><path d="M3 12h18M12 3c3 3.5 3 14.500 0 18M12 3c-3 3.500-3 14.500 0 18"/>'
  };
  function ic(n) { return '<svg class="i" viewBox="0 0 24 24" aria-hidden="true">' + (IC[n] || "") + "</svg>"; }
  var CONFIG_PADRAO = { acessoPago: false, precoAcesso: 2, contato: "", emailOficial: "coracaobr.oficial@gmail.com", moedaAnuncio: "BRL", precoAnuncio: 50, anunciosPorPacote: 3, precoDestaque: 25, precoClassificado: 3, diasClassificado: 30, pagamentos: {}, whatsappAviso: "", cotacao: 5.40, faixaTexto: "" };

  function esc(s) { return String(s == null ? "" : s).replace(/[&<>"']/g, function (c) { return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]; }); }
  function url(u) { return /^https?:\/\//i.test(u || "") ? u : ""; }
  function reais(n) { n = Number(n) || 0; return "R$ " + n.toLocaleString("pt-BR", { minimumFractionDigits: n % 1 ? 2 : 0, maximumFractionDigits: 2 }); }
  function usd(n) { n = Number(n) || 0; return "US$ " + n.toLocaleString("pt-BR", { minimumFractionDigits: n % 1 ? 2 : 0, maximumFractionDigits: 2 }); }
  /* configuração: padrões + o que a equipe salvou. Valores antigos em dólar (antes de moedaAnuncio "BRL") são trocados pelos novos em reais. */
  var PIX_PADRAO = { pix: "coracaobr.oficial@gmail.com", pixNome: "Danilo Araujo Santos Desenvolvedor", pixCidade: "BRASIL" };
  /* Todo recebimento cai no Pix do e-mail oficial (conta Mercado Pago). A chave CNPJ antiga, se ainda estiver salva, é trocada sozinha. */
  function chavePix(k) { k = String(k || "").trim(); return !k || k.replace(/\D/g, "") === "32021268000104" ? PIX_PADRAO.pix : k; }
  /* SAC: atendimento oficial por e-mail e WhatsApp */
  var SAC_ZAP = "5511983573266";
  function sac() {
    var c = config(), em = String(c.emailOficial || "").trim(), zap = String(c.whatsappAviso || "").replace(/\D/g, "") || SAC_ZAP;
    if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(em)) em = "coracaobr.oficial@gmail.com";
    var br = zap.indexOf("55") === 0 && zap.length >= 12 ? "(" + zap.slice(2, 4) + ") " + zap.slice(4, zap.length - 4) + "-" + zap.slice(-4) : "+" + zap;
    return { email: em, zap: zap, zapTxt: br, wa: function (msg) { return "https://wa.me/" + zap + (msg ? "?text=" + encodeURIComponent(msg) : ""); } };
  }
  /* bloco do SAC para colocar em qualquer tela (pagamento, conta, ajuda) */
  function sacHtml(assunto, curto) {
    var s = sac(), msg = "Olá! Preciso de ajuda no CoraçãoBR" + (assunto ? " (" + assunto + ")" : "") + ".";
    return '<div class="sac' + (curto ? " sac-c" : "") + '"><div class="sac-t"><b>SAC CoraçãoBR</b><small>' + (assunto ? "Dúvidas sobre " + esc(assunto) + "? " : "") + "Fale com a gente:</small></div>" +
      '<div class="sac-a"><a class="sac-b sac-z" href="' + esc(s.wa(msg)) + '" target="_blank" rel="noopener"><svg viewBox="0 0 24 24" aria-hidden="true"><path fill="currentColor" d="M12 2.2a9.7 9.7 0 0 0-8.4 14.6L2.3 21.7l5-1.3A9.7 9.7 0 1 0 12 2.2zm0 17.7a8 8 0 0 1-4.1-1.1l-.3-.2-3 .8.8-2.9-.2-.3A8 8 0 1 1 12 19.9zm4.4-6c-.2-.1-1.4-.7-1.7-.8-.2-.1-.4-.1-.5.1l-.8.9c-.1.2-.3.2-.5.1a6.6 6.6 0 0 1-3.3-2.9c-.2-.4.2-.4.7-1.3.1-.2 0-.3 0-.4l-.7-1.8c-.2-.5-.4-.4-.5-.4h-.5a.9.9 0 0 0-.7.3 2.8 2.8 0 0 0-.9 2.1 4.9 4.9 0 0 0 1 2.6 11.2 11.2 0 0 0 4.3 3.8c1.6.7 2.2.7 3 .6a2.6 2.6 0 0 0 1.7-1.2 2.1 2.1 0 0 0 .2-1.2c-.1-.1-.3-.2-.5-.3z"/></svg>WhatsApp ' + esc(s.zapTxt) + "</a>" +
      '<a class="sac-b" href="mailto:' + esc(s.email) + (assunto ? "?subject=" + encodeURIComponent("CoraçãoBR: " + assunto) : "") + '">' + ic("mail") + esc(s.email) + "</a></div></div>";
  }
  function config() {
    var g = Store.obter("config", "geral") || {}, c = Object.assign({}, CONFIG_PADRAO, g);
    if (g.moedaAnuncio !== "BRL") { c.precoAnuncio = 50; c.anunciosPorPacote = 3; c.promo = Object.assign({}, c.promo || {}, { preco: 20, anuncios: 1, curadorias: 5 }); c.moedaAnuncio = "BRL"; c.pagamentos = Object.assign({}, c.pagamentos || {}, PIX_PADRAO); }
    var pg = Object.assign({}, c.pagamentos || {}); Object.keys(PIX_PADRAO).forEach(function (k) { if (!pg[k]) pg[k] = PIX_PADRAO[k]; }); pg.pix = chavePix(pg.pix); c.pagamentos = pg;
    return c;
  }
  /* Valor aproximado em reais, destacado nas cores do Brasil. A cotação é de referência e se edita no Painel. */
  function brl(n) { var c = Number(config().cotacao) || CONFIG_PADRAO.cotacao; n = Number(n); return c > 0 && n > 0 ? ' <span class="brl" title="Cotação de referência: R$ ' + c.toFixed(2).replace(".", ",") + ' por dólar">≈ R$ ' + (n * c).toFixed(2).replace(".", ",") + "</span>" : ""; }
  function toast(msg) { var t = $("#toast"), dl = document.querySelector("dialog[open]"); (dl || document.body).appendChild(t); t.textContent = msg; t.hidden = false; clearTimeout(toast.t); toast.t = setTimeout(function () { t.hidden = true; }, 3200); }
  function sess(k, v) { try { if (v === undefined) return sessionStorage.getItem(k); sessionStorage.setItem(k, v); } catch (e) { return null; } }

  function dist(a, b) {
    if (!a || !b || a.lat == null || b.lat == null) return null;
    var R = 6371, r = Math.PI / 180, dLa = (b.lat - a.lat) * r, dLo = (b.lng - a.lng) * r;
    var h = Math.sin(dLa / 2) * Math.sin(dLa / 2) + Math.cos(a.lat * r) * Math.cos(b.lat * r) * Math.sin(dLo / 2) * Math.sin(dLo / 2);
    return 2 * R * Math.asin(Math.sqrt(h));
  }
  /* ---------- localização e tempo de viagem ----------
     Estimativa pela distância em linha reta com fator de rota; o tempo exato vem do Google Maps em "Como chegar". */
  var PARTIDAS_DFW = [["Centro de Dallas", 32.7767, -96.797], ["Aeroporto DFW", 32.8998, -97.0403], ["Aeroporto Love Field", 32.8471, -96.8518], ["Uptown", 32.8003, -96.8003], ["Plano", 33.0198, -96.6989], ["Frisco", 33.1507, -96.8236], ["Irving / Las Colinas", 32.8662, -96.9408], ["Richardson", 32.9483, -96.7299], ["Arlington", 32.7357, -97.1081], ["Fort Worth", 32.7555, -97.3308], ["Carrollton", 32.9756, -96.89], ["Grapevine", 32.9343, -97.0781]];
  var PARTIDAS = cid().partidas.slice();
  var MODOS = { carro: { nome: "Carro", maps: "driving" }, pe: { nome: "A pé", maps: "walking" }, bike: { nome: "Bicicleta", maps: "bicycling" } };
  var Geo = { lat: CENTRO.lat, lng: CENTRO.lng, nome: PARTIDAS[0][0], gps: false, modo: "carro", estado: "inicial" };
  function loc(k, v) { try { if (v === undefined) return localStorage.getItem(k); localStorage.setItem(k, v); } catch (e) { return null; } }
  (function () { var m = loc("modo"), o = loc("partida"); if (MODOS[m]) Geo.modo = m; var p = PARTIDAS.filter(function (x) { return x[0] === o; })[0]; if (p) { Geo.nome = p[0]; Geo.lat = p[1]; Geo.lng = p[2]; } })();
  function kmDe(l) { return dist(Geo, l); }
  function milhas(l) { var km = kmDe(l); return km == null ? null : km / 1.609; }
  function minutos(l, modo) {
    var km = kmDe(l); if (km == null) return null; modo = modo || Geo.modo;
    if (modo === "pe") return Math.max(1, Math.round(km * 1.25 / 4.8 * 60));
    if (modo === "bike") return Math.max(1, Math.round(km * 1.3 / 15 * 60));
    var rota = km * 1.35, v = rota < 5 ? 30 : rota < 20 ? 50 : 75;
    return Math.max(2, Math.round(rota / v * 60));
  }
  function tempo(l, modo) { var m = minutos(l, modo); if (m == null) return ""; return m < 60 ? m + " min" : Math.floor(m / 60) + "h" + (m % 60 ? String(m % 60).padStart(2, "0") : ""); }
  var vigia = null, ult = null;
  function pedirLocal(manual) {
    if (!navigator.geolocation) { Geo.estado = "indisponivel"; if (manual) escolherPartida(); return; }
    Geo.estado = "pedindo";
    function ok(pos) {
      var c = { lat: pos.coords.latitude, lng: pos.coords.longitude };
      if (ult && dist(ult, c) < 2 && Geo.gps && !manual) return;
      if (dist(c, CENTRO) > 250) {
        var aviso = !Geo.longe || manual; Geo.longe = true; Geo.estado = "longe";
        var perto0 = cidadeMaisPerto(c); if (perto0 && perto0.id !== cidadeAtual() && (!cidadeEscolhida || manual)) { trocaCidade(perto0.id, true); return; } if (aviso) { toast("Você está longe de " + cid().nome + ". Os tempos de viagem são calculados a partir de " + Geo.nome + "."); if (manual) escolherPartida(); render(true); }
        manual = false; return;
      }
      Geo.longe = false; ult = c; Geo.lat = c.lat; Geo.lng = c.lng; Geo.nome = "Sua localização"; Geo.gps = true; Geo.estado = "ok";
      if (manual) toast("Localização ativada. Distâncias calculadas a partir de você.");
      manual = false; render(true);
    }
    function erro() { Geo.estado = "negado"; if (manual) { toast("O navegador não liberou a localização. Escolha um ponto de partida."); escolherPartida(); manual = false; } render(true); }
    try { navigator.geolocation.getCurrentPosition(ok, erro, { enableHighAccuracy: false, timeout: 12000, maximumAge: 60000 }); if (vigia == null) vigia = navigator.geolocation.watchPosition(ok, function () {}, { maximumAge: 60000 }); } catch (e) { erro(); }
  }
  function cidadeMaisPerto(c) { var m = null, md = 1e9; Object.keys(CIDADES_GUIA).forEach(function (k) { var d = dist(c, CIDADES_GUIA[k]); if (d < md) { md = d; m = CIDADES_GUIA[k]; } }); return md < 250 ? m : null; }
  /* Troca a cidade do guia: lista, pontos de partida, mapa e textos passam a ser da cidade escolhida. */
  function trocaCidade(id, porGps) {
    if (!CIDADES_GUIA[id]) return;
    var mudou = id !== cidadeAtual(); cidadeEscolhida = id; loc("cidade", id);
    var c = CIDADES_GUIA[id]; CENTRO.lat = c.lat; CENTRO.lng = c.lng; PARTIDAS.length = 0; c.partidas.forEach(function (p) { PARTIDAS.push(p); });
    if (!Geo.gps || dist(Geo, c) > 250) { Geo.gps = false; Geo.nome = PARTIDAS[0][0]; Geo.lat = PARTIDAS[0][1]; Geo.lng = PARTIDAS[0][2]; }
    limpaFiltro(); document.documentElement.dataset.cidade = id;
    document.dispatchEvent(new CustomEvent("cidade", { detail: c }));
    if (mudou) toast((porGps ? "Você está perto de " : "Mostrando ") + c.nome + (porGps ? ". Mostrando o guia de lá." : "."));
    pintada = null; render(false); window.scrollTo(0, 0);
  }
  /* Na primeira visita o site pergunta a cidade (com atalho pela localização). */
  function perguntaCidade(obrigatorio) {
    var d = $("#dlg"), fotoDe = function (k) { if (CIDADES_GUIA[k].capa) return CIDADES_GUIA[k].capa; var l = primeiro(Store.lista("lugares").filter(function (x) { return regiaoGuia(x) === k && x.tipo !== "estabelecimento" && x.publicado !== false && (x.fotos || []).some(function (f) { return !f.ilustrativa; }); }).sort(ordenaNota))[0]; var f = l && (l.fotos || []).filter(function (f) { return !f.ilustrativa; })[0]; return f ? Store.urlFoto(f.src) || f.src : ""; };
    var n = function (k) { return Store.lista("lugares").filter(function (x) { return regiaoGuia(x) === k && x.publicado !== false && !x.demo; }).length; };
    d.innerHTML = '<div class="dlg cq"><div class="cq-top"><span class="cq-logo">Coração<b>BR</b></span><h3 tabindex="-1" autofocus>Qual cidade você quer explorar?</h3><p class="muted">Escolha uma vez. O guia lembra da sua escolha e você troca quando quiser no botão de cidade, lá no topo.</p></div>' +
      '<button type="button" class="btn cq-gps" data-cq-gps>' + ic("pin") + ' Usar minha localização</button><div class="cq-l">' +
      Object.keys(CIDADES_GUIA).map(function (k) { var c = CIDADES_GUIA[k], f = fotoDe(k), q = n(k); return '<button type="button" class="cq-c' + (k === cidadeAtual() && cidadeEscolhida ? " on" : "") + '" data-cq="' + k + '"' + (q ? "" : " disabled") + ">" + (f ? '<img src="' + esc(f) + '" alt="" loading="lazy">' : "<i></i>") + "<span><b>" + esc(c.nome) + "</b><small>" + (q ? q + " lugares no guia" : "em breve") + "</small></span></button>"; }).join("") +
      "</div>" + '<button type="button" class="more cq-mais" data-cq-mais>Outras cidades em breve →</button>' + (obrigatorio ? "" : '<div class="row"><button type="button" class="btn ghost" data-cq-x>Fechar</button></div>') + "</div>";
    d.onclick = function (e) {
      var b = e.target.closest("[data-cq]"); if (b && !b.disabled) { d.close(); trocaCidade(b.dataset.cq); if (!cidadeEscolhida) loc("cidade", b.dataset.cq); return; }
      if (e.target.closest("[data-cq-x]")) { d.close(); return; }
      if (e.target.closest("[data-cq-mais]")) { d.close(); if (!cidadeEscolhida) { cidadeEscolhida = cidadeAtual(); loc("cidade", cidadeEscolhida); } if (window.Novidades) setTimeout(Novidades.seletorCidade, 60); return; }
      if (e.target.closest("[data-cq-gps]")) {
        if (!navigator.geolocation) { toast("Este aparelho não informa a localização. Escolha a cidade na lista."); return; }
        toast("Buscando sua localização…");
        navigator.geolocation.getCurrentPosition(function (pos) {
          var c = { lat: pos.coords.latitude, lng: pos.coords.longitude }, m = cidadeMaisPerto(c);
          if (!m) { toast("Você ainda está longe das cidades do guia. Escolha uma na lista."); return; }
          d.close(); trocaCidade(m.id, true); pedirLocal(false);
        }, function () { toast("A localização não foi liberada. Escolha a cidade na lista."); }, { timeout: 12000, maximumAge: 300000 });
      }
    };
    d.addEventListener("cancel", function (e) { if (obrigatorio && !cidadeEscolhida) { e.preventDefault(); } }, { once: true });
    d.showModal();
  }
  function escolherPartida() {
    var d = $("#dlg");
    d.innerHTML = '<div class="dlg-head"><h3>De onde você está saindo?</h3><button type="button" class="btn sm ghost" data-x>Fechar</button></div><div class="dlg-body"><button type="button" class="btn" data-gps>' + ic("pin") + ' Usar minha localização</button><p class="small muted">Ou escolha um ponto de partida. As distâncias e os tempos de carro passam a ser calculados a partir dele.</p><div class="list">' +
      PARTIDAS.map(function (p, i) { return '<button type="button" class="lrow" style="grid-template-columns:minmax(0,1fr) auto" data-p="' + i + '"><b>' + esc(p[0]) + "</b>" + (!Geo.gps && Geo.nome === p[0] ? '<span class="pill ok">atual</span>' : "<span></span>") + "</button>"; }).join("") + "</div></div>";
    d.onclick = function (e) {
      if (e.target.closest("[data-x]")) { d.close(); return; }
      if (e.target.closest("[data-gps]")) { d.close(); pedirLocal(true); return; }
      var b = e.target.closest("[data-p]"); if (!b) return;
      var p = PARTIDAS[Number(b.dataset.p)]; Geo.nome = p[0]; Geo.lat = p[1]; Geo.lng = p[2]; Geo.gps = false; loc("partida", p[0]); d.close(); pintada = null; render(false);
    };
    d.showModal();
  }

  /* ---------- dados derivados ---------- */
  /* Anúncio pago some quando a assinatura foi cancelada e o mês já pago terminou. */
  function assinaturaAtiva(l) { if (l._dono && window.Pag) return Pag.visivel(l); var a = l.assinatura; if (l._dono && !a) return false; return !a || a.status === "ativa" || (a.proximaCobranca || "") >= hojeISO(); }
  function lugares() { var c = cidadeAtual(); return Store.lista("lugares").filter(function (l) { return l.publicado !== false && !l.demo && regiaoGuia(l) === c && assinaturaAtiva(l); }); }
  function todosLugares() { return Store.lista("lugares").filter(function (l) { return l.publicado !== false && !l.demo && assinaturaAtiva(l); }); }
  /* Índice de avaliações por lugar, refeito só quando a coleção muda (evita varrer tudo a cada comparação de ordenação). */
  var idxAv = null;
  Store.assinar(function (col) { if (!col || col === "avaliacoes") idxAv = null; });
  function avaliacoesDe(id) {
    if (!idxAv) { idxAv = new Map(); Store.lista("avaliacoes").forEach(function (a) { var k = a.lugarId; if (!idxAv.has(k)) idxAv.set(k, []); idxAv.get(k).push(a); }); idxAv.forEach(function (v) { v.sort(function (a, b) { return (b.criadoEm || "").localeCompare(a.criadoEm || ""); }); }); }
    return (idxAv.get(id) || []).filter(function (a) { return a.tipo !== "parceiro"; });
  }
  /* Nota do guia: só fontes reais. Google (API oficial), nota conferida pela equipe, visitantes e, na falta delas, curadoria de parceiros (sempre identificada). Notas provisórias não aparecem. */
  function notas(l) {
    var av = avaliacoesDe(l.id), u = av.length ? av.reduce(function (s, a) { return s + Number(a.estrelas || 0); }, 0) / av.length : null;
    var c = l.notaCuradoria && !l.notaProvisoria ? Number(l.notaCuradoria) : null;
    var ge = l.notaExterna && Number(l.notaExterna.media) ? Number(l.notaExterna.media) : null;
    var pc = window.Promo ? Promo.media(l) : null, g = null, fonte = "";
    if (ge != null) { g = u != null && av.length >= 3 ? ge * 0.6 + u * 0.4 : ge; fonte = "Google" + (l.notaExterna.total ? " · " + Number(l.notaExterna.total).toLocaleString("pt-BR") + " aval." : ""); }
    else if (c != null) { g = u != null ? c * 0.6 + u * 0.4 : c; fonte = "equipe do guia"; }
    else if (u != null) { g = u; fonte = av.length + (av.length === 1 ? " avaliação" : " avaliações"); }
    else if (pc) { g = pc.m; fonte = pc.n + (pc.n === 1 ? " curadoria de parceiro" : " curadorias de parceiros"); }
    return { curadoria: c, usuarios: u, qtd: av.length, guia: g, fonte: fonte };
  }
  function temFotoReal(l) { return (l.fotos || []).some(function (f) { return !f.ilustrativa; }) || !!l.fotoSite ? 1 : 0; }
  function ordenaNota(a, b) { return (notas(b).guia || 0) - (notas(a).guia || 0) || (Number(b.notaCuradoria) || 0) - (Number(a.notaCuradoria) || 0) || temFotoReal(b) - temFotoReal(a) || String(a.nome || "").localeCompare(String(b.nome || "")); }
  function stars(n) { n = Math.max(0, Math.min(5, Number(n) || 0)); return '<span class="stars" style="--n:' + n + '" aria-hidden="true">★★★★★</span>'; }
  function rateMini(l) { var n = notas(l); return n.guia == null ? '<span class="rate"><i>sem nota</i></span>' : '<span class="rate"><span class="s1">★</span><span class="num">' + n.guia.toFixed(1) + "</span>" + (n.qtd ? "<i>(" + n.qtd + ")</i>" : "") + "</span>"; }
  /* Preços de cada lugar: "a partir de" (o menor valor conferido no site oficial ou no cardápio), a média e o teto.
     Restaurantes: pesquisa no site da empresa (precoMin/precoMedio/precoMax) ou, quando a empresa cadastra o cardápio,
     calculado dos pratos (sem bebidas, sobremesas, acompanhamentos e menu infantil). Atrações e eventos: ingresso adulto. */
  var SEC_FORA = /bebida|drink|sobremesa|dessert|doce|acompanha|happy|libra|\blb\b|salad|salada|\bsides?\b|extra|adiciona|add-?on|kids|infantil|crian|molho|sauce|cerveja|beer|vinho|wine|coquetel|cocktail|caf[eé]s? e ch[aá]s?/i, ITEM_FORA = /crian|kids|infantil|\bchild|s[oó] (a )?[aá]rea de salada|salad (area|bar) only|s[oó] buf[eê]/i;
  function precoDoMenu(l) {
    var v = (l.menu || []).filter(function (it) { return Number(it.preco) > 0 && !SEC_FORA.test(String(it.secao || "")) && !ITEM_FORA.test(String(it.item || "")) && ["/kg", "/mês", "/hora"].indexOf(it.un || "") < 0; }).map(function (it) { return Number(it.preco); });
    if (v.length < 2) return null;
    return { min: Math.min.apply(null, v), med: Math.round(v.reduce(function (a, b) { return a + b; }, 0) / v.length), max: Math.max.apply(null, v) };
  }
  function precos(l) {
    if (!l) return null;
    var est = l.tipo === "estabelecimento";
    if (!est && l.gratuito) return { gratis: true };
    var min = Number(l.precoMin) || 0, med = Number(l.precoMedio) || 0, max = Number(l.precoMax) || 0, menu = false;
    if (est && l.anunciante) { var m = precoDoMenu(l); if (m) { min = m.min; med = m.med; max = m.max; menu = true; } }   // cardápio cadastrado pela própria empresa
    if (!(min > 0)) return null;
    if (med && med < min) med = min; if (max && max < min) max = 0; if (max && med > max) med = max;
    return { min: min, med: med, max: max, base: l.precoBase || (est ? "prato principal" : "entrada adulto"), menu: menu,
      fonte: url(l.fontePreco) ? l.fontePreco : url(l.fonteMenu) ? l.fonteMenu : "", quando: menu ? (l.menuVerificadoEm || "") : (l.precoConferidoEm || l.atualizadoEm || ""), terceiros: !menu && l.fontePrecoTipo === "terceiros" };
  }
  /* Média de preço da categoria na cidade escolhida (só com 3 ou mais lugares com preço conferido). */
  function mediaCategoria(cat) {
    var v = lugares().filter(function (x) { return x.categoria === cat; }).map(function (x) { var p = precos(x); return p && !p.gratis ? (p.med || p.min) : 0; }).filter(Boolean);
    return v.length >= 3 ? { med: Math.round(v.reduce(function (a, b) { return a + b; }, 0) / v.length), n: v.length } : null;
  }
  function precoCurto(l) {
    var p = precos(l);
    if (p && p.gratis) return "Grátis";
    if (p) return "a partir de " + usd(p.min);
    if (l.tipo === "estabelecimento") return l.faixaPreco || "";
    return "Pago";
  }
  /* Bloco de preços da folha do lugar: a partir de, média por pessoa, até, comparação com a categoria e a fonte. */
  function blocoPrecos(l) {
    var p = precos(l), est = l.tipo === "estabelecimento"; if (!p || p.gratis) return "";
    var mc = mediaCategoria(l.categoria), ref = p.med || p.min, comp = "";
    if (mc && mc.n >= 3 && ref) { var dif = (ref - mc.med) / mc.med; comp = dif <= -0.12 ? "Abaixo da média" : dif >= 0.12 ? "Acima da média" : "Na média"; }
    return '<div class="pz"><div class="pz-top"><span class="pz-k">' + ic("ticket") + (est ? " Quanto custa" : " Ingressos") + "</span>" + (comp ? '<span class="pz-cmp' + (comp === "Abaixo da média" ? " ok" : "") + '">' + comp + "</span>" : "") + "</div>" +
      '<div class="pz-g"><div><small>A partir de</small><b>' + usd(p.min) + "</b>" + brl(p.min) + "<i>" + esc(p.base) + "</i></div>" +
      (p.med ? "<div><small>" + (est ? "Média por pessoa" : "Preço médio") + "</small><b>" + usd(p.med) + "</b>" + brl(p.med) + "<i>" + (est ? "sem bebida" : "entre os ingressos") + "</i></div>" : "") +
      (p.max ? "<div><small>Até</small><b>" + usd(p.max) + "</b>" + brl(p.max) + "<i>" + (est ? "maior valor" : "maior valor") + "</i></div>" : "") + "</div>" +
      (mc ? '<p class="pz-cat">Média em ' + esc(CATS[l.categoria] || "lugares parecidos") + " · " + esc(cid().nome) + ": <b>" + usd(mc.med) + "</b> por pessoa (" + mc.n + " lugares com preço conferido)</p>" : "") +
      '<p class="pz-f">' + (p.menu ? "Calculado do cardápio da empresa" : l.anunciante ? "Informado pela empresa" : "Pesquisado no " + (p.terceiros ? "cardápio publicado na internet" : "site oficial")) + (p.quando ? " · conferido em " + esc(mesAno(p.quando)) : "") + (p.fonte ? ' · <a href="' + esc(p.fonte) + '" target="_blank" rel="noopener">ver fonte</a>' : "") + ". Valores sem taxas e gorjeta; podem mudar.</p></div>";
  }
  function mesAno(s) { var m = /^(\d{4})-(\d{2})/.exec(String(s || "")); if (!m) return String(s || ""); return ["jan", "fev", "mar", "abr", "mai", "jun", "jul", "ago", "set", "out", "nov", "dez"][Number(m[2]) - 1] + "/" + m[1]; }
  function precoHtml(l) {
    var t = precoCurto(l); if (!t) return "";
    return '<span class="price' + (l.gratuito && l.tipo !== "estabelecimento" ? " free" : "") + (l.tipo !== "estabelecimento" && !l.gratuito && l.precoConfirmado === false ? " unk" : "") + '">' + esc(t) + "</span>";
  }
  /* Fotos de um lugar: as do guia/anunciante + fotos reais do Google (pela API oficial, com crédito do autor) + imagem oficial do site do lugar.
     As do Google são servidas pelo nosso servidor (api/?acao=foto_google), que não expõe a chave. */
  function fotosDe(l, larg) {
    l = l || {};
    /* ordem: fotos enviadas pelo anunciante → imagem do site oficial → fotos reais do Google → fotos de acervo/ilustrativas */
    var proprias = [], acervo = [], reais = [];
    (l.fotos || []).forEach(function (f) { var u = Store.urlFoto(f.src, larg && larg <= 800 ? "p" : ""); if (!u) return; (/^asset:/.test(f.src) ? proprias : acervo).push(Object.assign({}, f, { src: u })); });
    var fsite = (l.fotoSite && l.fotoSite.src) ? l.fotoSite : FOTOS_SITE[l.id];
    if (fsite && /^https:\/\/[^\s"'<>]+$/.test(fsite.src || "")) reais.push({ src: fsite.src, credito: "Site oficial", pagina: fsite.pagina || "" });
    if (st().servidor && Array.isArray(l.fotosGoogle)) l.fotosGoogle.forEach(function (g) { if (g && /^places\/[\w-]+\/photos\/[\w-]+$/.test(g.ref || "")) reais.push({ src: "api/?acao=foto_google&w=" + (larg || 1200) + "&ref=" + encodeURIComponent(g.ref), credito: (g.autor || "Usuário do Google") + " · Google", pagina: g.link || "", google: true }); });
    return proprias.concat(reais, acervo).slice(0, 24);
  }
  function st() { return Store.estado || {}; }
  /* imagens oficiais dos sites dos lugares (geradas pelo robô diário; servem também nas versões sem servidor) */
  var FOTOS_SITE = {};
  fetch("data/fotos-site.json", { cache: "no-cache" }).then(function (r) { return r.ok ? r.json() : {}; }).then(function (j) { FOTOS_SITE = j || {}; if (Store.estado && Store.estado.pronto && !document.querySelector("form:focus-within")) { try { render(false); } catch (e) { /* ok */ } } }).catch(function () {});
  function foto(l, i) { var x = fotosDe(l, 640)[i || 0]; return x ? x.src : ""; }
  function picHtml(l) { var f = foto(l); return f ? '<img src="' + esc(f) + '" alt="" loading="lazy">' : ""; }
  function regiao(l) { var pr = (CIDADES_GUIA[regiaoGuia(l)] || cid()).principal; return l.cidade === pr || !l.cidade ? (l.bairro || pr) : l.cidade; }
  /* Eventos no mesmo local viram um card só: o próximo a acontecer, com a contagem dos demais. */
  function chaveLocal(l) {
    var e = String(l.endereco || "").toLowerCase().split(",")[0].replace(/[^a-z0-9 ]/g, "").trim();
    return (e ? e + "|" + String(l.cidade || "").toLowerCase() : "") || (typeof l.lat === "number" && typeof l.lng === "number" ? l.lat.toFixed(3) + "," + l.lng.toFixed(3) : l.id);
  }
  function porData(a, b) { var x = a.dataInicio || "9999", y = b.dataInicio || "9999"; return x < y ? -1 : x > y ? 1 : 0; }
  function eventosDoLocal(l) { var k = chaveLocal(l), hj = hojeISO(); return lugares().filter(function (o) { return o.categoria === "evento" && chaveLocal(o) === k && (!o.dataFim || o.dataFim >= hj); }).sort(porData); }
  function unificaEventos(lista) {
    var vistos = {}, out = [];
    lista.forEach(function (l) {
      if (l.categoria !== "evento" || l.anunciante) { out.push(l); return; }
      var k = chaveLocal(l); if (vistos[k]) { vistos[k]._mais++; return; }
      var c = Object.assign({}, l, { _mais: 0 }); vistos[k] = c; out.push(c);
    });
    return out;
  }
  function destaque(l) { return !!(l.anunciante && ((window.Pag && Pag.impulsionado && Pag.impulsionado(l)) || (l.assinatura && l.assinatura.plano === "destaque"))); }
  function primeiro(lista) { return lista.filter(destaque).concat(lista.filter(function (l) { return l.anunciante && !destaque(l); }), lista.filter(function (l) { return !l.anunciante; })); }
  function falaPt(l) { return !!(l.falaPortugues || l.brasileiro || l.categoria === "saude-pt"); }
  function card(l) {
    var f = foto(l), n = notas(l), pr = precoCurto(l), t = tempo(l, "carro");
    return '<a class="ocard" href="#lugar-' + esc(l.id) + '">' + (f ? '<img src="' + esc(f) + '" alt="" loading="lazy" decoding="async">' : '<span class="ph0">' + esc(String(l.nome || "").charAt(0)) + "</span>") +
      '<span class="m">' + (l.anunciante ? '<span class="sp">' + (destaque(l) ? "Destaque" : "Patrocinado") + '</span>' : "") + (window.Pag && Pag.selo && Pag.selo(l) ? '<span class="vf">✓ Verificado</span>' : "") + (falaPt(l) ? '<span class="pt">Fala português</span>' : "") + (l._mais ? "<span>+" + l._mais + (l._mais === 1 ? " evento aqui" : " eventos aqui") + "</span>" : "") + (n.guia != null ? "<span>★ " + n.guia.toFixed(1) + "</span>" : "") + (pr ? "<span>" + esc(pr) + "</span>" : "") + "</span>" +
      '<span class="n"><b>' + esc(l.nome) + "</b><small>" + (l.quando ? esc(l.quando) + " · " + esc(l.cidade || regiao(l)) : esc(regiao(l)) + (t ? " · " + t + " de carro" : "")) + "</small></span></a>";
  }
  function linha(l) {
    var f = foto(l), t = tempo(l, "carro");
    return '<a class="lrow nopos" href="#lugar-' + esc(l.id) + '"><span class="th">' + (f ? '<img src="' + esc(f) + '" alt="" loading="lazy">' : "") + "</span><span><b>" + esc(l.nome) + "</b><small>" + (l.anunciante ? "Patrocinado · " : "") + esc(CATS[l.categoria] || "") + " · " + esc(regiao(l)) + '</small></span><span class="val num">' + (t || "–") + "<small>de carro</small></span></a>";
  }

  /* ---------- anúncios ---------- */
  function anuncios(pos) { return Store.lista("anuncios").filter(function (a) { return a.ativo !== false && a.posicao === pos; }); }
  function alvo(a) { return url(a.link) ? 'href="' + esc(a.link) + '" target="_blank" rel="noopener sponsored"' : 'href="#explorar"'; }
  function adFaixa(convite) {
    var ads = anuncios("faixa"), a = ads[Math.floor(Date.now() / 60000) % (ads.length || 1)];
    if (!a) return convite ? '<a class="adband" href="#anuncie"><div><span class="sponsor">Espaço de anúncio</span><b>Seu negócio aqui</b><span class="small muted">Visto por brasileiros que estão decidindo aonde ir.</span></div>' + ic("arrow") + "</a>" : "";
    return '<a class="adband" ' + alvo(a) + ">" + (a.imagem ? '<img src="' + esc(Store.urlFoto(a.imagem)) + '" alt="">' : "") + '<div><span class="sponsor">Patrocinado</span><b>' + esc(a.titulo) + '</b><span class="small muted">' + esc(a.texto || "") + "</span></div>" + ic("arrow") + "</a>";
  }
  function adCard(i) {
    var ads = anuncios("grade"), a = ads.length ? ads[i % ads.length] : null;
    if (!a) return "";
    return '<a class="ocard' + (a.imagem ? "" : " ad") + '" ' + alvo(a) + ">" + (a.imagem ? '<img src="' + esc(Store.urlFoto(a.imagem)) + '" alt=""><span class="m"><span class="sp">Patrocinado</span></span><span class="n"><b>' + esc(a.titulo) + "</b><small>" + esc(a.texto || "") + "</small></span>" : '<span class="sponsor">Patrocinado</span><b>' + esc(a.titulo) + '</b><span class="small muted">' + esc(a.texto || "") + "</span>") + "</a>";
  }

  /* ---------- início ---------- */
  var slideAtual = 0, slideTimer = null;
  function fileira(titulo, itens, grupo, auto) {
    if (!itens.length) return "";
    return '<section class="block reveal"><div class="head"><h2>' + titulo + '</h2><a class="more" href="#explorar" data-grupo="' + grupo + '">ver todos</a></div><div class="hscroll' + (auto ? " auto" : "") + '">' + itens.slice(0, auto ? 12 : 8).map(card).join("") + "</div></section>";
  }
  /* Fotos do banner principal: versões em alta resolução quando existem (img/hero/<id>.jpg e -m.jpg para celular). */
  var HERO_HD = { "white-rock-lake": 1, "klyde-warren-park": 1, "fort-worth-stockyards": 1 };
  /* cartões-postais de cada cidade (fotos em alta, licença livre; ver js/postais.js) */
  var POSTAIS_CID = { dfw: ["dallas-noite", "dallas-panorama"], houston: ["houston-noite", "houston-bayou"], austin: ["austin"], sanantonio: ["sanantonio"] };
  function postaisDa(c) { var ok = window.POSTAIS || []; return (POSTAIS_CID[c] || []).filter(function (k) { return ok.indexOf(k) >= 0; }); }
  function postalImg(k, i) { var lazy = i ? ' loading="lazy"' : ' fetchpriority="high"'; return '<img src="img/postais/' + k + '.jpg" srcset="img/postais/' + k + '-m.jpg 1280w, img/postais/' + k + '.jpg 2560w" sizes="100vw" alt="" decoding="async"' + lazy + ">"; }
  function credPostal(k) { var c = (window.CREDITOS_FOTOS || {})[k + ".jpg"]; return c && c.autor ? '<span class="bn-cred">Foto: ' + esc(c.autor) + " · " + esc(c.licenca) + "</span>" : ""; }
  function heroImg(l, i) {
    var lazy = i ? ' loading="lazy"' : ' fetchpriority="high"';
    if (HERO_HD[l.id]) return '<img src="img/hero/' + l.id + '.jpg" srcset="img/hero/' + l.id + '-m.jpg 1000w, img/hero/' + l.id + '.jpg 1920w" sizes="100vw" alt="" decoding="async"' + lazy + ">";
    return '<img src="' + esc(foto(l)) + '" alt="" decoding="async"' + lazy + ">";
  }
  /* Painel útil: hora em Dallas, dólar, eventos da semana e passeios grátis (dados reais do guia e da cotação do Painel). */
  function painelUtil(ls, cfg) {
    var hoje = hojeISO(), d7 = new Date(hoje + "T12:00:00"); d7.setDate(d7.getDate() + 7); var lim = d7.toISOString().slice(0, 10);
    var ev = ls.filter(function (l) { return GRUPOS.eventos.f(l) && l.dataInicio && (l.dataFim || l.dataInicio) >= hoje && l.dataInicio <= lim; }).length;
    var gr = ls.filter(GRUPOS.gratis.f).length, br = ls.filter(GRUPOS.brasileiros.f).length;
    var cot = Number(cfg.cotacao) || 0;
    var t = function (h, k, v, s, i) { return '<a class="pu-it" href="' + h + '"><span class="pu-k">' + ic(i) + k + '</span><b class="pu-v">' + v + '</b><span class="pu-s">' + s + "</span></a>"; };
    return '<section class="pu" aria-label="Informações úteis">' +
      t("#mapa", "Agora em " + cid().principal, '<span id="pu-hora">' + horaDallas() + "</span>", diaDallas(), "clock") +
      (cot ? t("#custo", "Dólar hoje", "R$ " + cot.toFixed(2).replace(".", ","), cfg.cotacaoEm ? "atualizado " + String(cfg.cotacaoEm).slice(8, 10) + "/" + String(cfg.cotacaoEm).slice(5, 7) : "cotação do guia", "chart") : "") +
      t("#busca-7d-geventos", "Eventos", ev, ev === 1 ? "nos próximos 7 dias" : "nos próximos 7 dias", "ticket") +
      t("#busca-gratis", "De graça", gr, "passeios sem pagar nada", "leaf") +
      t("#busca-gbrasileiros", "Brasileiros", br, "negócios de brasileiros", "flag") + "</section>";
  }
  function horaDallas() { try { return new Intl.DateTimeFormat("pt-BR", { timeZone: "America/Chicago", hour: "2-digit", minute: "2-digit" }).format(new Date()); } catch (e) { return "--:--"; } }
  function diaDallas() { try { return new Intl.DateTimeFormat("pt-BR", { timeZone: "America/Chicago", weekday: "long", day: "numeric", month: "short" }).format(new Date()); } catch (e) { return ""; } }
  setInterval(function () { var h = document.getElementById("pu-hora"); if (h) h.textContent = horaDallas(); }, 20000);
  function viewInicio() {
    var ls = lugares(), by = function (g) { return primeiro(ls.filter(GRUPOS[g].f).sort(ordenaNota)); };
    var gratis = by("gratis"), com = function (id) { return Store.obter("lugares", id); };
    var cfg = config(), tx = function (k, pad) { return (cfg.textos && cfg.textos[k]) || pad; };
    /* Banner principal: chamadas para anunciantes (foto real da cidade ao fundo) + banners dos patrocinadores oficiais. */
    var preco = Number(cfg.precoAnuncio) || 50;
    var slides = (cfg.heroSlides && cfg.heroSlides.length ? cfg.heroSlides.map(function (h) { return { l: com(h.lugar), t: h.titulo || (com(h.lugar) || {}).nome, h: h.link || "lugar-" + h.lugar }; }) : [
      { l: com("white-rock-lake"), k: "Para empresas", t: "Anuncie sua empresa para novos brasileiros.", s: "Quem acabou de chegar procura tudo em português. Apareça primeiro.", cta: "Anunciar agora", h: "anuncie" },
      { l: com("klyde-warren-park"), k: reais(preco) + " por mês", t: "Seu negócio no mapa de quem fala português.", s: (Number(cfg.anunciosPorPacote) || 3) + " anúncios + 1 banner, pin verde no mapa e publicações no feed.", cta: "Ver planos", h: "anuncie" },
      { l: com("fort-worth-stockyards"), k: "Brasileiros em " + cid().nome, t: "Milhares de brasileiros procurando serviços. Fale com eles aqui.", s: "Restaurantes, beleza, construção, saúde, imóveis e muito mais.", cta: "Quero anunciar", h: "anuncie" }
    ]).map(function (sl, i) { if (cidadeAtual() === "dfw") return sl; var alt = primeiro(ls.filter(function (x) { return x.tipo !== "estabelecimento" && (x.fotos || []).some(function (f) { return !f.ilustrativa; }); }).sort(ordenaNota))[i]; return alt ? Object.assign({}, sl, { l: alt }) : sl; }).filter(function (s) { return s.l && foto(s.l); });
    if (!(cfg.heroSlides && cfg.heroSlides.length)) postaisDa(cidadeAtual()).forEach(function (k, i) { if (slides[i]) slides[i] = Object.assign({}, slides[i], { post: k }); });
    /* rodízio: patrocinadores e anunciantes da rodada atual (troca a cada 30 min), no mesmo tamanho dos slides com título */
    heroRod = window.Social && Social.rodada ? Social.rodada() : 0;
    var bns = window.Social && Social.rodadaItens && window.Oficiais ? Social.rodadaItens(heroRod).map(function (it) { return { bn: it, h: it.href.replace(/^#/, "") }; }) : [];
    if (bns.length) { var mist = []; slides.forEach(function (x, i) { mist.push(x); if (bns[i]) mist.push(bns[i]); }); slides = mist.concat(bns.slice(slides.length)); }
    if (!slides.length) slides = [{ t: cid().principal + " em português.", h: "explorar", g: "tudo" }];
    if (slideAtual >= slides.length) slideAtual = 0;
    var servN = function (c) { return ls.filter(function (l) { return l.categoria === c; }).length; };
    var perto = primeiro(ls.filter(function (l) { return kmDe(l) != null && ["evento", "governo", "transporte", "saude", "comunidade", "servico"].indexOf(l.categoria) < 0; }).sort(function (a, b) { return kmDe(a) - kmDe(b); }).slice(0, 12)).slice(0, 4);
    var ad = adFaixa(false);
    app.innerHTML = '<section class="ph" id="hero">' + slides.map(function (s, i) {
      if (s.bn) return '<a class="slide bnr bnr-' + esc(s.bn.visual || "foto") + (i === slideAtual ? " on" : "") + '" role="group" aria-roledescription="slide" aria-label="' + (i + 1) + " de " + slides.length + ": " + esc(s.bn.nome || s.bn.titulo) + '" href="#' + esc(s.h) + '" style="--c:' + esc(s.bn.cor || "#0BA84A") + '">' + Oficiais.slideHero(s.bn, i) + "</a>";
      return '<a class="slide' + (i === slideAtual ? " on" : "") + '" role="group" aria-roledescription="slide" aria-label="' + (i + 1) + " de " + slides.length + '" href="#' + esc(s.h) + '"' + (s.g ? ' data-grupo="' + esc(s.g) + '"' : "") + ">" + (s.post ? postalImg(s.post, i) + credPostal(s.post) : s.l ? heroImg(s.l, i) : "") + '<div class="cap"><div class="wrap">' + (s.k ? '<span class="kick">' + esc(s.k) + "</span>" : "") + (i ? '<div class="h1">' : "<h1>") + esc(s.t) + (i ? "</div>" : "</h1>") + (s.s ? '<p class="hsub">' + esc(s.s) + "</p>" : "") + (s.cta ? '<span class="hcta">' + esc(s.cta) + ' <svg class="i" viewBox="0 0 24 24"><path d="M5 12h14M13 6l6 6-6 6"/></svg></span>' : "") + "</div></div>" + "</a>";
    }).join("") +
      '<div class="foot"><div class="wrap"><div class="hrow"><form class="gsearch" id="busca">' + ic("search") + '<input id="q" type="search" placeholder="Restaurante brasileiro, passeio grátis, dentista…" aria-label="Buscar no guia" autocomplete="off"><button type="submit" class="gs-btn">Buscar</button></form>' +
      '<button type="button" class="pchip" data-partida>' + ic("pin") + (Geo.gps ? "Perto de você" : '<span class="pc-pre">Saindo de </span>' + esc(Geo.nome)) + "</button>" +
      (slides.length > 1 ? '<div class="hctl"><button type="button" class="harr" data-dir="-1" aria-label="Slide anterior"><svg class="i" viewBox="0 0 24 24"><path d="M15 5l-7 7 7 7"/></svg></button><div class="dots">' + slides.map(function (s, i) { return '<button type="button" data-i="' + i + '" aria-current="' + (i === slideAtual) + '" aria-label="Ir para o slide ' + (i + 1) + '"><i></i></button>'; }).join("") + '</div><button type="button" class="harr" data-dir="1" aria-label="Próximo slide"><svg class="i" viewBox="0 0 24 24"><path d="M9 5l7 7-7 7"/></svg></button></div>' : "") +
      "</div>" + '<nav class="hquick" aria-label="Atalhos">' + [["busca-agora", "Acontecendo agora"], ["busca-fds", "Este fim de semana"], ["busca-gratis", "Grátis"], ["busca-gcomer", "Onde comer"], ["busca-gbrasileiros", "Negócios brasileiros"]].map(function (q) { return '<a href="#' + q[0] + '">' + q[1] + "</a>"; }).join("") + "</nav></div></div></section>" +
      '<div class="sh"><div class="wrap"><div class="gr"></div>' + painelUtil(ls, cfg) +
      '<nav class="menubar mb-home" aria-label="Categorias">' + Object.keys(GRUPOS).filter(function (g) { return g !== "tudo" && ls.some(GRUPOS[g].f); }).map(function (g) { return '<a class="mb-it" href="#explorar" data-grupo="' + g + '">' + ic(GRUPOS[g].ic) + "<span>" + GRUPOS[g].nome + "</span></a>"; }).join("") + '<a class="mb-it" href="#metro">' + ic("train") + "<span>Metrô</span></a>" + '<a class="mb-it" href="#fala-portugues">' + ic("flag") + "<span>Fala PT</span></a>" + '<a class="mb-it" href="#chegada">' + ic("pin") + "<span>Chegada</span></a>" + '<a class="mb-it" href="#temas">' + ic("bell") + "<span>Alertas</span></a>" + '<a class="mb-it" href="#assistente">' + ic("chat") + "<span>Pergunte</span></a>" + '<a class="mb-it" href="#perguntas">' + ic("users") + "<span>Perguntas</span></a>" + '<a class="mb-it" href="#pets">' + ic("heart") + "<span>Pets</span></a>" + '<a class="mb-it" href="#clube">' + ic("star") + "<span>Clube</span></a></nav>" +
      (ls.length ? "" : '<section class="block"><div class="panel"><h3>O guia ainda está vazio</h3><p class="muted">Os lugares aparecem aqui assim que forem cadastrados no <a href="#painel">Painel</a>.</p></div></section>') +
      montaSecoes(cfg, tx, ls, by, gratis, perto, ad, servN) + "</div></div>";
    $("#busca").addEventListener("submit", function (e) { e.preventDefault(); var tq = $("#q").value.trim(); if (window.Recursos && Recursos.buscar(tq)) return; limpaFiltro(); F.q = tq; location.hash = "explorar"; });
    var hero = $("#hero");
    function vai(i) {
      slideAtual = (i + slides.length) % slides.length;
      Array.from(hero.querySelectorAll(".slide")).forEach(function (s, k) { s.classList.toggle("on", k === slideAtual); s.classList.toggle("ant", k === (slideAtual - 1 + slides.length) % slides.length && slides.length > 2); });
      Array.from(hero.querySelectorAll(".dots button")).forEach(function (b, k) { b.setAttribute("aria-current", k === slideAtual); });
    }
    function armar() { clearInterval(slideTimer); if (slides.length > 1 && !matchMedia("(prefers-reduced-motion: reduce)").matches) slideTimer = setInterval(function () { if (!document.body.contains(hero)) { clearInterval(slideTimer); return; } vai(slideAtual + 1); }, 6000); }
    var dd = hero.querySelector(".hctl"); if (dd) dd.addEventListener("click", function (e) { var b = e.target.closest("button"); if (!b) return; vai(b.dataset.dir ? slideAtual + Number(b.dataset.dir) : Number(b.dataset.i)); armar(); });
    var x0 = null; hero.addEventListener("touchstart", function (e) { x0 = e.touches[0].clientX; }, { passive: true });
    hero.addEventListener("touchend", function (e) { if (x0 == null) return; var dx = e.changedTouches[0].clientX - x0; x0 = null; if (Math.abs(dx) > 50) { vai(slideAtual + (dx < 0 ? 1 : -1)); armar(); } });
    hero.addEventListener("click", function (e) { if (e.target.closest(".slide") && hero.dataset.arrastou) { e.preventDefault(); delete hero.dataset.arrastou; } });
    armar(); agendaPopup();
  }

  /* Seções da página inicial: ordem, visibilidade e títulos vêm do Painel (Aparência). */
  var SECOES = { promo: "Promoção de dezembro", vitrine: "Carrossel de anunciantes", oficiais: "Patrocinadores oficiais", patrocinados: "Patrocinadores", alertas: "Avisos da comunidade", agoraSec: "Acontecendo agora", paraVoce: "Para você", convitePerto: "Convite: avisos por perto", destaqueMes: "Brasileiro do mês", avaliados: "Mais bem avaliados", depoimentos: "Depoimentos", perto: "Mais perto", eventos: "Próximos eventos", ia: "Roteiro com IA", gratisBanner: "Banner de passeios grátis", roteiros: "Roteiros prontos", hospedagem: "Onde ficar", chegada: "Guia de chegada", gratis: "De graça", anuncioFaixa: "Banner de anúncio", brasil: "Sabor do Brasil", mural: "Mural de vagas e classificados", texano: "Coma como um texano", morar: "Para quem mora aqui", custo: "Custo de vida", cidades: "Outras cidades", instalar: "Instalar no celular", anunciante: "Chamada para anunciantes", newsletter: "Newsletter por e-mail" };
  function montaSecoes(cfg, tx, ls, by, gratis, perto, ad, servN) {
    var ex = window.Extras ? Extras.secoes(ls) : {}, pats = primeiro(ls.filter(function (l) { return l.anunciante; }).sort(ordenaNota));
    var cm = window.Comunidade ? Comunidade.secoes(ls) : {};
    var html = {
      vitrine: window.Social ? Social.secao() : "", alertas: cm.alertas, depoimentos: cm.depoimentos, paraVoce: window.Recursos ? Recursos.secao("paraVoce", ls) : "", agoraSec: window.Recursos ? Recursos.secao("agora", ls) : "", newsletter: window.Recursos ? Recursos.secao("newsletter", ls) : "", convitePerto: window.Jornada ? Jornada.convite() : "", destaqueMes: cm.destaqueMes, ia: cm.ia, mural: cm.mural, custo: cm.custo, cidades: cm.cidades, instalar: cm.instalar,
      hospedagem: fileira(esc(tx("hospedagem", "Onde ficar")), by("hospedagem"), "hospedagem"),
      oficiais: window.Oficiais ? Oficiais.secao() : "",
      promo: window.Promo && Promo.ativa() ? '<section class="block reveal"><a class="bn pr-bn" href="#promo"><i></i><small>Promoção de lançamento · até ' + esc(String(Promo.cfg().fim).slice(8, 10) + "/" + String(Promo.cfg().fim).slice(5, 7)) + '</small><b>Anuncie por US$ ' + esc(Promo.cfg().preco) + ' e ajude a construir o guia</b><span>1 anúncio por 1 mês + ' + Promo.cfg().curadorias + ' curadorias por crédito ' + ic("arrow") + "</span></a></section>" : "",
      patrocinados: '<section class="block reveal pats"><div class="head"><div><p class="eyebrow">Patrocinadores</p><h2>' + esc(tx("patrocinados", "Negócios que apoiam o guia")) + '</h2></div><a class="more" href="#anuncie">anunciar aqui</a></div><div class="spg">' + pats.slice(0, 7).map(function (l) {
        return '<a class="spc" href="#lugar-' + esc(l.id) + '"><span class="spc-f">' + (foto(l) ? '<img src="' + esc(foto(l)) + '" alt="" loading="lazy" decoding="async">' : "") + '<em>Patrocinado</em></span><span class="spc-t"><b>' + esc(l.nome) + "</b><small>" + esc(CATS[l.categoria] || "") + (l.cidade ? " · " + esc(l.cidade) : "") + "</small></span>" + ic("arrow") + "</a>";
      }).join("") + '<a class="spc spc-cta" href="#anuncie"><span class="spc-t"><small>Pacote mensal</small><b>Seu negócio aqui</b><span>' + reais(window.Pag ? Pag.preco() : (cfg.precoAnuncio || 50)) + ' = ' + (cfg.anunciosPorPacote || 3) + ' anúncios por mês · pacotes somam</span></span>' + ic("arrow") + "</a></div></section>",
      avaliados: fileira(esc(tx("avaliados", "Mais bem avaliados")), by("passeios"), "passeios", true),
      gratisBanner: gratis.length ? '<section class="block reveal"><a class="bn" href="#explorar" data-grupo="gratis"><i></i><small>Sem pagar entrada</small><b>' + gratis.length + " passeios de graça em " + esc(cid().principal) + "</b><span>Ver a lista " + ic("arrow") + "</span></a></section>" : "",
      perto: perto.length ? '<section class="block reveal"><div class="head"><h2>' + esc(Geo.gps ? "Perto de você" : tx("perto", "Mais perto")) + '</h2><button type="button" class="more" data-partida>' + (Geo.gps ? "sua localização" : "saindo de " + esc(Geo.nome)) + '</button></div><div class="list two">' + perto.map(linha).join("") + "</div></section>" : "",
      eventos: ex.eventos || "", roteiros: ex.roteiros || "", chegada: ex.chegada || "",
      gratis: fileira(esc(tx("gratis", "De graça")), gratis, "gratis"),
      anuncioFaixa: ad ? '<section class="block reveal">' + ad + "</section>" : "",
      brasil: fileira(esc(tx("brasil", "Sabor do Brasil")), by("brasileiros").filter(function (l) { return COMIDA.indexOf(l.categoria) >= 0; }), "brasileiros"),
      texano: fileira(esc(tx("texano", "Coma como um texano")), by("comer").filter(function (l) { return !l.brasileiro; }), "comer"),
      morar: '<section class="block reveal"><div class="head"><h2>' + esc(tx("morar", "Para quem mora aqui")) + '</h2><a class="more" href="#explorar" data-grupo="servicos">ver todos</a></div><div class="svc">' +
        [["handyman", "doc"], ["baba", "heart"], ["piscina", "leaf"], ["limpeza", "briefcase"], ["mercado-brasileiro", "cart"], ["servico", "globe"]].map(function (t) { var n = servN(t[0]); return '<a href="' + (n ? "#explorar" : "#anuncie") + '"' + (n ? ' data-grupo="servicos" data-cat="' + t[0] + '"' : "") + '><span class="ic">' + ic(t[1]) + "</span><b>" + CATS[t[0]] + "</b><small>" + (n ? n + (n === 1 ? " opção" : " opções") : "Cadastre sua empresa") + "</small></a>"; }).join("") + "</div></section>",
      anunciante: '<section class="block reveal"><a class="bn" href="#anuncie"><i></i><small>Para donos de negócio</small><b>' + esc(tx("anunciante", "Apareça primeiro para quem está decidindo aonde ir")) + "</b><span>Ver planos " + ic("arrow") + "</span></a></section>"
    };
    var ordem = (cfg.secoes && cfg.secoes.length ? cfg.secoes : Object.keys(SECOES)).filter(function (k) { return SECOES[k]; });
    Object.keys(SECOES).forEach(function (k) { if (ordem.indexOf(k) < 0) ordem.push(k); });
    var ocultas = cfg.ocultas || [];
    return (ls.length ? "" : '<section class="block"><div class="panel"><h3>O guia ainda está vazio</h3><p class="muted">Os lugares aparecem aqui assim que forem cadastrados no <a href="#painel">Painel</a>.</p></div></section>') +
      ordem.filter(function (k) { return ocultas.indexOf(k) < 0; }).map(function (k) { return html[k] || ""; }).join("");
  }

  function revelar() {
    /* Tudo já entra visível: as seções só fazem uma animação curta na carga, sem depender de rolagem. */
    Array.from(app.querySelectorAll(".reveal")).forEach(function (el, i) { el.style.animationDelay = Math.min(i, 4) * 0.06 + "s"; el.classList.add("in"); });
  }


  /* ---------- explorar ---------- */
  var F = { q: "", grupo: "tudo", cat: "", preco: "todos", local: "", ordem: "nota", aberto: false, pt: false };
  function limpaFiltro() { F.q = ""; F.grupo = "tudo"; F.cat = ""; F.preco = "todos"; F.local = ""; }
  /* Busca sem acento e por palavras: "pao de queijo" encontra "pão de queijo". */
  function norm(t) { return String(t || "").toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, ""); }
  function filtrados() {
    var q = norm(F.q).trim(), g = GRUPOS[F.grupo] || GRUPOS.tudo, qs = q ? q.split(/\s+/) : [];
    var out = lugares().filter(function (l) {
      if (!g.f(l)) return false;
      if (F.cat && l.categoria !== F.cat) return false;
      if (F.preco === "gratis" && !(l.gratuito && l.tipo !== "estabelecimento")) return false;
      if (F.preco === "pagos" && (l.gratuito || l.tipo === "estabelecimento")) return false;
      if (F.local && regiao(l) !== F.local) return false;
      if (qs.length) { var tx = norm([l.nome, l.bairro, l.cidade, CATS[l.categoria], l.historia, l.dica, l.endereco].join(" ")); if (!qs.every(function (w) { return tx.indexOf(w) >= 0; })) return false; }
      return true;
    });
    if (F.ordem === "nota") out.sort(ordenaNota);
    if (F.ordem === "nome") out.sort(function (a, b) { return String(a.nome).localeCompare(String(b.nome)); });
    if (F.ordem === "preco") { var pv = function (x) { var p = precos(x); return p ? (p.gratis ? 0 : p.min) : x.faixaPreco ? 15 * String(x.faixaPreco).length + 0.5 : 999; }; out.sort(function (a, b) { return pv(a) - pv(b); }); }
    if (F.ordem === "perto") out.sort(function (a, b) { return (kmDe(a) == null ? 9999 : kmDe(a)) - (kmDe(b) == null ? 9999 : kmDe(b)); });
    if (F.grupo === "eventos") { var hj = hojeISO(); out = unificaEventos(out.filter(function (l) { return !l.dataFim || l.dataFim >= hj; }).sort(porData)); }
    if (F.aberto && window.Extras) out = out.filter(function (l) { return Extras.aberto(l) === true; });
    if (F.pt) out = out.filter(falaPt);
    return primeiro(out);
  }
  function opt(v, t, sel) { return '<option value="' + esc(v) + '"' + (v === sel ? " selected" : "") + ">" + esc(t) + "</option>"; }
  function viewExplorar() {
    var ls = lugares(), cont = {};
    ls.forEach(function (l) { var k = regiao(l); cont[k] = (cont[k] || 0) + 1; });
    app.innerHTML = '<section class="block xp"><div class="wrap">' +
      '<header class="xp-h"><div><p class="eyebrow">Guia completo</p><h1 class="page-h">Explorar</h1></div><span class="xp-n" id="conta"></span></header>' +
      '<div class="search xp-q"><span>' + ic("search") + '</span><input id="f-q" type="search" value="' + esc(F.q) + '" placeholder="Nome, bairro ou tipo" aria-label="Buscar" autocomplete="off"></div>' +
      '<nav class="menubar" id="f-grupo" aria-label="Tipo">' + Object.keys(GRUPOS).filter(function (g) { return g === "tudo" || ls.some(GRUPOS[g].f); }).map(function (g) { return '<button type="button" class="mb-it" data-g="' + g + '" aria-pressed="' + (F.grupo === g) + '">' + ic(GRUPOS[g].ic) + "<span>" + GRUPOS[g].nome + "</span></button>"; }).join("") + "</nav>" +
      '<button type="button" class="xp-fbt" data-xp-filtros aria-expanded="false">' + ic("grid") + '<span>Filtros e ordem</span><em data-xp-n></em></button>' +
      '<div class="xp-body"><aside class="xp-side" aria-label="Filtros">' +
      '<div class="xp-box"><p class="xp-t">Ordenar e região</p><div class="field"><label for="f-ordem">Ordenar por</label><select id="f-ordem">' + opt("nota", "Melhor nota", F.ordem) + opt("preco", "Menor preço", F.ordem) + opt("perto", "Mais perto de mim", F.ordem) + opt("nome", "Nome (A–Z)", F.ordem) + "</select></div>" +
      '<div class="field"><label for="f-local">Região</label><select id="f-local">' + opt("", "Todas as regiões", F.local) + Object.keys(cont).sort(function (a, b) { return a.localeCompare(b); }).map(function (c) { return opt(c, c + " (" + cont[c] + ")", F.local); }).join("") + "</select></div></div>" +
      '<div class="xp-box" id="f-cat"></div></aside>' +
      '<div class="xp-main">' + adFaixa(false) + '<div class="grid" id="grade"></div></div></div></div></section>';
    var tq = null; $("#f-q").addEventListener("input", function (e) { F.q = e.target.value; clearTimeout(tq); tq = setTimeout(function () { grade(true); }, 160); });
    $("#f-local").addEventListener("change", function (e) { F.local = e.target.value; grade(); contaFiltros(); });
    $("#f-ordem").addEventListener("change", function (e) { F.ordem = e.target.value; grade(); contaFiltros(); });
    $("#f-grupo").addEventListener("click", function (e) {
      var b = e.target.closest("button"); if (!b) return;
      F.grupo = b.dataset.g; F.cat = ""; F.preco = "todos";
      Array.from(this.children).forEach(function (c) { c.setAttribute("aria-pressed", c === b); }); subchips(); grade();
    });
    $("#f-cat").addEventListener("click", function (e) {
      var b = e.target.closest("button"); if (!b) return;
      if (b.dataset.limpa) { F.aberto = false; F.pt = false; F.preco = "todos"; F.cat = ""; }
      else if (b.dataset.ab) F.aberto = !F.aberto; else if (b.dataset.fp) F.pt = !F.pt; else if (b.dataset.p) F.preco = F.preco === b.dataset.p ? "todos" : b.dataset.p; else if (b.dataset.c != null) F.cat = F.cat === b.dataset.c ? "" : b.dataset.c;
      var y0 = b.getBoundingClientRect().top;
      marcaFiltros(); grade(true);
      var nb = $("#f-cat") && ($("#f-cat").querySelector(b.dataset.ab ? "[data-ab]" : b.dataset.fp ? "[data-fp]" : b.dataset.p ? '[data-p="' + b.dataset.p + '"]' : b.dataset.c != null ? '[data-c="' + (window.CSS && CSS.escape ? CSS.escape(b.dataset.c) : b.dataset.c) + '"]' : "[data-limpa]") || $("#f-cat"));
      if (nb) { var dy = nb.getBoundingClientRect().top - y0; if (Math.abs(dy) > 2) window.scrollBy(0, dy); }
    });
    subchips(); grade(); contaFiltros();
  }
  /* Atualiza só o estado dos botões, sem recriar o painel (a lista de categorias continua aberta). */
  var catAberta = null;
  function marcaFiltros() {
    var el = $("#f-cat"); if (!el) return;
    Array.from(el.querySelectorAll("[data-ab]")).forEach(function (b) { b.setAttribute("aria-pressed", F.aberto); });
    Array.from(el.querySelectorAll("[data-fp]")).forEach(function (b) { b.setAttribute("aria-pressed", F.pt); });
    Array.from(el.querySelectorAll("[data-p]")).forEach(function (b) { b.setAttribute("aria-pressed", F.preco === b.dataset.p); });
    Array.from(el.querySelectorAll("[data-c]")).forEach(function (b) { b.setAttribute("aria-pressed", (F.cat || "") === b.dataset.c); });
    var lp = el.querySelector("[data-limpa]"); if (lp) lp.hidden = !(F.aberto || F.pt || F.preco !== "todos" || F.cat);
    contaFiltros();
  }
  function contaFiltros() { var n = (F.aberto ? 1 : 0) + (F.pt ? 1 : 0) + (F.preco !== "todos" ? 1 : 0) + (F.cat ? 1 : 0) + (F.local ? 1 : 0) + (F.ordem !== "nota" ? 1 : 0), e = document.querySelector("[data-xp-n]"); if (e) { e.textContent = n ? String(n) : ""; e.hidden = !n; } }
  document.addEventListener("click", function (e) { var b = e.target.closest("[data-xp-filtros]"); if (!b) return; var body = document.querySelector(".xp-body"); if (!body) return; var on = !body.classList.contains("f-open"); body.classList.toggle("f-open", on); b.setAttribute("aria-expanded", on); });
  function subchips() {
    var el = $("#f-cat"); if (!el) return;
    var g = GRUPOS[F.grupo] || GRUPOS.tudo, base = lugares().filter(g.f), n = {};
    base.forEach(function (l) { if (l.categoria) n[l.categoria] = (n[l.categoria] || 0) + 1; });
    var cats = Object.keys(n).sort(function (a, b) { return (CATS[a] || a).localeCompare(CATS[b] || b); });
    var temAtr = base.some(function (l) { return l.tipo !== "estabelecimento"; }) && F.grupo !== "gratis";
    var tg = function (attr, on, txt) { return '<button type="button" class="xp-tg" ' + attr + ' aria-pressed="' + on + '"><i></i>' + txt + "</button>"; };
    var ativos = F.aberto || F.pt || F.preco !== "todos" || F.cat;
    var abre = catAberta != null ? catAberta : (!!F.cat || matchMedia("(min-width: 960px)").matches);
    el.innerHTML = '<div class="xp-th"><p class="xp-t">Filtros</p><button type="button" class="more" data-limpa="1"' + (ativos ? "" : " hidden") + '>limpar</button></div>' +
      tg('data-ab="1"', F.aberto, "Aberto agora") + tg('data-fp="1"', F.pt, "Fala português") +
      (temAtr ? tg('data-p="gratis"', F.preco === "gratis", "Gratuitos") + tg('data-p="pagos"', F.preco === "pagos", "Pagos") : "") +
      (cats.length > 1 ? '<details class="xp-cats"' + (abre ? " open" : "") + '><summary class="xp-t">Categorias <span>' + cats.length + '</span></summary><div class="xp-list"><button type="button" class="xp-c" data-c="" aria-pressed="' + !F.cat + '">Todas<em>' + base.length + "</em></button>" +
        cats.map(function (c) { return '<button type="button" class="xp-c" data-c="' + esc(c) + '" aria-pressed="' + (F.cat === c) + '">' + esc(CATS[c] || c) + "<em>" + n[c] + "</em></button>"; }).join("") + "</div></details>" : "");
    var dt = el.querySelector("details"); if (dt) dt.addEventListener("toggle", function () { catAberta = dt.open; });
  }
  /* Explorar mostra 36 cards por vez e carrega mais ao chegar no fim da lista (celulares mais simples agradecem). */
  var POR_VEZ = 36, gradeLista = [], gradeN = 0, gradeIO = null;
  function gradeHtml(de, ate) { var html = []; gradeLista.slice(de, ate).forEach(function (l, k) { var i = de + k; html.push(card(l)); if (i % 10 === 5) html.push(adCard((i - 5) / 10)); }); return html.join(""); }
  function gradeMais() {
    var g = $("#grade"); if (!g || gradeN >= gradeLista.length) return;
    var s = $("#grade-mais"); if (s) s.remove();
    g.insertAdjacentHTML("beforeend", gradeHtml(gradeN, gradeN + POR_VEZ)); gradeN += POR_VEZ; sentinela(g);
  }
  function sentinela(g) {
    if (gradeN >= gradeLista.length) return;
    g.insertAdjacentHTML("beforeend", '<button type="button" id="grade-mais" class="btn ghost" style="grid-column:1/-1;justify-self:center">Mostrar mais</button>');
    var b = $("#grade-mais"); b.onclick = gradeMais;
    if ("IntersectionObserver" in window) { if (gradeIO) gradeIO.disconnect(); gradeIO = new IntersectionObserver(function (es) { if (es[0].isIntersecting) gradeMais(); }, { rootMargin: "600px" }); gradeIO.observe(b); }
  }
  function grade(calado) {
    var g = $("#grade"); if (!g) return;
    if (window.Novidades) Novidades.patrocinio(g, F.grupo);
    var ls = filtrados(); gradeLista = ls; gradeN = Math.min(ls.length, POR_VEZ);
    var html = gradeHtml(0, gradeN);
    if (!calado) { g.classList.remove("in"); void g.offsetWidth; g.classList.add("in"); }
    g.innerHTML = html || '<div class="panel vazio-f" style="grid-column:1/-1"><h3>Nada com esses filtros</h3><p class="muted">Tente outra região, outra categoria ou limpe os filtros.</p><button type="button" class="btn sm" data-limpa-tudo>Limpar filtros</button></div>';
    var lt = g.querySelector("[data-limpa-tudo]"); if (lt) lt.onclick = function () { F.aberto = false; F.pt = false; F.preco = "todos"; F.cat = ""; F.q = ""; F.local = ""; var q = $("#f-q"); if (q) q.value = ""; var fl = $("#f-local"); if (fl) fl.value = ""; marcaFiltros(); grade(); };
    sentinela(g);
    var mc = F.cat ? mediaCategoria(F.cat) : null;
    $("#conta").textContent = ls.length + (ls.length === 1 ? " lugar" : " lugares") + (mc ? " · média " + usd(mc.med) + " por pessoa" : "");
  }

  /* ---------- folha do lugar ---------- */
  var L = { id: null, foto: 0, estrelas: 0, nome: "", texto: "" }, aberto = false;
  function menuHtml(l) {
    var m = l.menu || []; if (!m.length) return "";
    var out = "", sec = null;
    m.forEach(function (it) {
      if (it.secao !== sec) { sec = it.secao; if (sec) out += "<h4>" + esc(sec) + "</h4>"; }
      out += '<div class="mi"><b>' + esc(it.item) + '</b><span class="dots2"></span><span class="p">' + (it.preco != null && it.preco !== "" ? usd(it.preco) + brl(Number(it.preco)) : "consulte") + "</span></div>";
      if (it.descricao) out += '<div class="d">' + esc(it.descricao) + "</div>";
    });
    return '<div class="panel"><div class="row" style="justify-content:space-between;margin-bottom:6px"><h3 style="margin:0">Cardápio e preços</h3>' + (l.menuVerificadoEm ? '<span class="pill ok">conferido em ' + esc(l.menuVerificadoEm) + "</span>" : '<span class="pill warn">data não informada</span>') + '</div><div class="menu">' + out + '</div><p class="small muted" style="margin-top:12px">Sem imposto e gorjeta. No Texas some cerca de 8,25% de imposto e de 18% a 20% de gorjeta no serviço de mesa.' + (url(l.fonteMenu) ? ' <a href="' + esc(l.fonteMenu) + '" target="_blank" rel="noopener">Cardápio oficial</a>' : "") + "</p></div>";
  }
  /* Movimento do dia: vale o que visitantes informaram hoje; sem isso, a média que o dono cadastrou para dia de semana ou fim de semana. */
  var FLUXO = { pouco: ["Pouco fluxo hoje", "#2E8B57"], medio: ["Médio fluxo hoje", "#C98A12"], alto: ["Bem movimentado hoje", "#C2452D"] };
  function hojeISO() { var d = window.Horario ? Horario.agoraDallas() : new Date(); return d.getFullYear() + "-" + String(d.getMonth() + 1).padStart(2, "0") + "-" + String(d.getDate()).padStart(2, "0"); }
  function fluxoDe(l) {
    var hoje = hojeISO(), rs = Store.lista("fluxos").filter(function (f) { return f.lugarId === l.id && f.dia === hoje && FLUXO.hasOwnProperty(f.nivel); }).sort(function (a, b) { return (b.criadoEm || "").localeCompare(a.criadoEm || ""); }).slice(0, 5);
    if (rs.length) {
      var c = {}; rs.forEach(function (f) { c[f.nivel] = (c[f.nivel] || 0) + 1; });
      var n = Object.keys(c).sort(function (a, b) { return c[b] - c[a]; })[0];
      return { nivel: n, fonte: rs.length === 1 ? "informado por 1 visitante hoje" : "informado por " + rs.length + " visitantes hoje" };
    }
    var dia = new Date(hojeISO() + "T12:00:00").getDay(), tip = dia === 0 || dia === 6 ? l.fluxoFds : l.fluxoSemana;
    return FLUXO.hasOwnProperty(tip) ? { nivel: tip, fonte: dia === 0 || dia === 6 ? "média de fim de semana" : "média de dia de semana" } : null;
  }
  function fluxoHtml(l) {
    var f = fluxoDe(l), meu = sess("fluxo-" + l.id + "-" + hojeISO());
    return '<div class="panel" style="display:grid;gap:10px"><div class="row" style="justify-content:space-between"><h3 style="margin:0">Movimento</h3>' + (f ? '<span class="small muted">' + f.fonte + "</span>" : "") + "</div>" +
      (f ? '<div class="row" style="gap:10px"><span style="width:12px;height:12px;border-radius:50%;background:' + FLUXO[f.nivel][1] + ';flex:none"></span><b style="font-size:1.05rem">' + FLUXO[f.nivel][0] + "</b></div>" : '<p class="muted small">Ainda sem informação de movimento para hoje.</p>') +
      (meu ? '<p class="small muted">Obrigado, sua informação foi registrada.</p>' : '<div><p class="small muted" style="margin-bottom:8px">Está no local? Conte como está agora.</p><div class="chips" style="margin:0;padding:0">' + [["pouco", "Tranquilo"], ["medio", "Médio"], ["alto", "Cheio"]].map(function (o) { return '<button type="button" class="chip" data-fluxo="' + o[0] + '">' + o[1] + "</button>"; }).join("") + "</div></div>") + "</div>";
  }
  /* Apps de carro: Uber e Lyft abrem com o destino preenchido e a partida na localização do aparelho. */
  function apps(l) {
    if (l.lat == null || l.lng == null) return "";
    var nome = encodeURIComponent(l.nome), end = encodeURIComponent(l.endereco || l.nome);
    var uber = "https://m.uber.com/ul/?action=setPickup&pickup=my_location&dropoff[latitude]=" + l.lat + "&dropoff[longitude]=" + l.lng + "&dropoff[nickname]=" + nome + "&dropoff[formatted_address]=" + end;
    var lyft = "https://lyft.com/ride?id=lyft&destination[latitude]=" + l.lat + "&destination[longitude]=" + l.lng;
    return '<div><p class="eyebrow" style="margin-bottom:8px">Chamar um carro</p><div class="row"><a class="btn ghost sm" href="' + esc(uber) + '" target="_blank" rel="noopener">Uber</a><a class="btn ghost sm" href="' + esc(lyft) + '" target="_blank" rel="noopener">Lyft</a><a class="btn ghost sm" href="https://indrive.com/" target="_blank" rel="noopener">inDrive</a>' + (l.endereco ? '<button type="button" class="btn ghost sm" data-copiar="' + esc(l.endereco) + '">Copiar endereço</button>' : "") + "</div></div>";
  }
  /* Instagram, WhatsApp e telefone: só aparece o que estiver preenchido no Painel. */
  function contatos(l) {
    var out = [], ig = String(l.instagram || "").trim().replace(/^https?:\/\/(www\.)?instagram\.com\//i, "").replace(/^@/, "").replace(/\/.*$/, "");
    var wa = String(l.whatsapp || "").replace(/\D/g, ""), tel = String(l.telefone || "").trim();
    if (wa.length === 10) wa = "1" + wa;
    if (ig) out.push('<a class="btn ghost sm" href="https://instagram.com/' + encodeURIComponent(ig) + '" target="_blank" rel="noopener">' + ic("insta") + " @" + esc(ig) + "</a>");
    if (url(l.facebook)) out.push('<a class="btn ghost sm" href="' + esc(l.facebook) + '" target="_blank" rel="noopener">Facebook</a>');
    if (wa) out.push('<a class="btn ghost sm" href="https://wa.me/' + wa + '" target="_blank" rel="noopener">' + ic("chat") + " WhatsApp</a>");
    if (url(l.site)) out.push('<a class="btn ghost sm" href="' + esc(l.site) + '" target="_blank" rel="noopener">' + ic("globe") + " Site</a>");
    if (tel) out.push('<a class="btn ghost sm" href="tel:' + esc(tel.replace(/[^\d+]/g, "")) + '" style="user-select:text">' + ic("phone") + " " + esc(tel) + "</a>");
    return out.length ? '<div class="row">' + out.join("") + "</div>" : "";
  }
  /* ---------- conteúdo do card do lugar, em abas ---------- */
  function acoes(l) {
    var out = [], ig = String(l.instagram || "").trim().replace(/^https?:\/\/(www\.)?instagram\.com\//i, "").replace(/^@/, "").replace(/\/.*$/, "");
    var wa = String(l.whatsapp || "").replace(/\D/g, ""), tel = String(l.telefone || "").trim();
    if (wa.length === 10) wa = "1" + wa;
    function qa(href, icn, nome, extra) { return '<a class="qa" href="' + esc(href) + '"' + (extra || ' target="_blank" rel="noopener"') + '><span>' + ic(icn) + "</span>" + nome + "</a>"; }
    if (wa) out.push(qa("https://wa.me/" + wa, "chat", "WhatsApp"));
    if (tel) out.push(qa("tel:" + tel.replace(/[^\d+]/g, ""), "phone", "Ligar", " "));
    if (ig) out.push(qa("https://instagram.com/" + encodeURIComponent(ig), "insta", "Instagram"));
    if (url(l.facebook)) out.push(qa(l.facebook, "fb", "Facebook"));
    var tg = String(l.telegram || "").trim().replace(/^https?:\/\/(t\.me|telegram\.me)\//i, "").replace(/^@/, "");
    if (tg) out.push(qa(/^https?:/.test(tg) ? tg : "https://t.me/" + encodeURIComponent(tg), "send", "Telegram"));
    var xx = String(l.x || "").trim().replace(/^https?:\/\/(www\.)?(x|twitter)\.com\//i, "").replace(/^@/, "").replace(/\/.*$/, "");
    if (xx) out.push(qa("https://x.com/" + encodeURIComponent(xx), "xlogo", "X"));
    if (url(l.linkedin)) out.push(qa(l.linkedin, "linkedin", "LinkedIn"));
    if (url(l.site)) out.push(qa(l.site, "globe", "Site"));
    if (url(l.catalogo)) out.push(qa(l.catalogo, "book", l.catalogoNome || "Catálogo"));
    if (l.anunciante && l._dono) out.push('<button type="button" class="qa qa-ag" data-agendar="' + esc(l.id) + '"><span>' + ic("cal") + "</span>Agendar</button>");
    out.push('<button type="button" class="qa" data-partilhar><span>' + ic("share") + "</span>Enviar</button>");
    return '<div class="qas">' + out.join("") + "</div>";
  }
  function abasDe(l, av) {
    var t = [["sobre", "Sobre"], ["ir", "Como ir"]];
    if (window.Cardapio ? Cardapio.temAlgo(l) : (l.menu || []).length) t.push(["menu", window.Cardapio ? Cardapio.rotulo(l) : "Cardápio"]);
    t.push(["aval", "Avaliações" + (av.length ? " " + av.length : "")]);
    if (!t.some(function (x) { return x[0] === L.tab; })) L.tab = "sobre";
    return t;
  }
  function tile(icn, rot, val, extra, cls) { return '<div class="tile ' + (cls || "") + '"><span class="tic">' + ic(icn) + '</span><div><small>' + rot + "</small><b>" + val + "</b>" + (extra || "") + "</div></div>"; }
  /* Avaliações de outras plataformas: só por API oficial (gravadas pelo robô com atribuição) e links diretos para cada site. */
  function externas(l) {
    var q = encodeURIComponent(l.nome + " " + (l.cidade || (CIDADES_GUIA[regiaoGuia(l)] || cid()).principal) + " TX"), lista = Array.isArray(l.avaliacoesExternas) ? l.avaliacoesExternas.filter(function (r) { return r && r.texto && r.autor; }).slice(0, 6) : [];
    var nota = l.notaExterna && Number(l.notaExterna.media) ? '<p class="small"><b>' + Number(l.notaExterna.media).toFixed(1) + " ★</b> no " + esc(l.notaExterna.fonte || "Google") + (l.notaExterna.total ? " · " + Number(l.notaExterna.total).toLocaleString("pt-BR") + " avaliações" : "") + "</p>" : "";
    return '<div class="panel stack ext" style="gap:10px"><h3>' + (lista.length ? "Avaliações reais do Google" : "O que dizem em outros sites") + "</h3>" + (l.categoria === "evento" && lista.length ? '<p class="small muted">Avaliações do local onde o evento acontece.</p>' : "") + nota +
      lista.map(function (r) { return '<div class="rv"><span class="av">' + esc(String(r.autor).charAt(0).toUpperCase()) + '</span><div><div class="row" style="gap:8px"><b>' + esc(r.autor) + "</b>" + (r.nota ? stars(r.nota) : "") + '</div><small class="muted">' + esc(r.fonte || "Google") + (r.data ? " · " + esc(r.data) : "") + "</small><p>" + esc(String(r.texto).slice(0, 400)) + "</p>" + (url(r.link) ? '<a class="small" href="' + esc(r.link) + '" target="_blank" rel="noopener">ver no ' + esc(r.fonte || "Google") + "</a>" : "") + "</div></div>"; }).join("") +
      '<div class="row"><a class="btn sm ghost" target="_blank" rel="noopener" href="https://www.google.com/maps/search/?api=1&query=' + q + '">Google</a><a class="btn sm ghost" target="_blank" rel="noopener" href="https://www.yelp.com/search?find_desc=' + encodeURIComponent(l.nome) + "&find_loc=" + encodeURIComponent((l.cidade || (CIDADES_GUIA[regiaoGuia(l)] || cid()).principal) + ", TX") + '">Yelp</a><a class="btn sm ghost" target="_blank" rel="noopener" href="https://www.tripadvisor.com/Search?q=' + q + '">Tripadvisor</a></div></div>';
  }
  /* Mapa do Google embutido, sem chave: mostra o lugar com a nota e o atalho para as avaliações no próprio Google */
  function mapaGoogle(l, alt) {
    var q = encodeURIComponent([l.nome, l.endereco || ((l.cidade || (CIDADES_GUIA[regiaoGuia(l)] || cid()).principal) + ", TX")].filter(Boolean).join(", "));
    return '<div class="gmap"><iframe title="' + esc(l.nome) + ' no Google Maps" loading="lazy" referrerpolicy="no-referrer-when-downgrade" src="https://maps.google.com/maps?q=' + q + '&hl=pt-BR&z=15&output=embed" style="height:' + (alt || 300) + 'px"></iframe>' +
      '<div class="gmap-a"><a class="btn sm" target="_blank" rel="noopener" href="https://www.google.com/maps/search/?api=1&query=' + q + '">' + ic("star") + " Ver avaliações e fotos no Google</a></div></div>";
  }
  /* fotos enviadas junto com a avaliação */
  function fotosAval(a) { var fs = (a.fotos || []).map(function (s) { return Store.urlFoto(s); }).filter(Boolean); return fs.length ? '<div class="rv-fotos">' + fs.map(function (u) { return '<a href="' + esc(u) + '" target="_blank" rel="noopener"><img src="' + esc(u) + '" alt="Foto da avaliação" loading="lazy"></a>'; }).join("") + "</div>" : ""; }
  function abaConteudo(l, tab) {
    var est = l.tipo === "estabelecimento";
    if (tab === "ir") {
      if (l.lat == null) return '<p class="muted">Localização ainda não cadastrada.</p>';
      return '<div class="stack" style="gap:14px"><div class="row" style="justify-content:space-between"><span class="small muted">Tempos estimados</span><button type="button" class="more" data-partida style="color:var(--accent-mid);font-weight:600">' + (Geo.gps ? "da sua localização" : "saindo de " + esc(Geo.nome)) + "</button></div>" +
        '<div class="modes">' + Object.keys(MODOS).map(function (m) { return '<button type="button" class="mode" data-modo="' + m + '" aria-pressed="' + (Geo.modo === m) + '"><span class="tic">' + ic(m === "carro" ? "car" : m === "pe" ? "walk" : "bike") + "</span><b>" + tempo(l, m) + "</b><small>" + MODOS[m].nome + "</small></button>"; }).join("") + "</div>" +
        apps(l) + '<p class="small muted">Calculado pela distância (' + (kmDe(l) < 10 ? kmDe(l).toFixed(1).replace(".", ",") : kmDe(l).toFixed(0)) + " km em linha reta), sem trânsito. O tempo exato aparece no Maps.</p>" +
        (l.estacionamento ? tile("car", "Estacionamento", esc(l.estacionamento), "", "wide") : "") + mapaGoogle(l, 280) + "</div>";
    }
    if (tab === "menu") return window.Cardapio ? Cardapio.bloco(l) : menuHtml(l);
    if (tab === "aval") {
      var av = avaliacoesDe(l.id), n = notas(l), cont = [0, 0, 0, 0, 0, 0];
      av.forEach(function (a) { var k = Math.max(0, Math.min(5, Math.round(Number(a.estrelas)) || 0)); cont[k]++; });
      return '<div class="stack" style="gap:14px"><div class="rsum"><div><b class="num">' + (n.guia != null ? n.guia.toFixed(1) : "–") + "</b>" + stars(n.guia) + '<small>' + (av.length ? av.length + (av.length === 1 ? " avaliação" : " avaliações") : esc(n.fonte || "sem avaliações")) + '</small></div><div class="rbars">' +
        [5, 4, 3, 2, 1].map(function (k) { return '<div><small>' + k + '</small><span><i style="width:' + (av.length ? Math.round(cont[k] / av.length * 100) : 0) + '%"></i></span></div>'; }).join("") + "</div></div>" +
        (av.length ? av.slice(0, 12).map(function (a) { return '<div class="rv"><span class="av">' + esc((a.nome || "V").trim().charAt(0).toUpperCase()) + '</span><div><div class="row" style="gap:8px"><b>' + esc(a.nome || "Visitante") + "</b>" + stars(a.estrelas) + '</div><small class="muted">' + esc((a.criadoEm || "").slice(0, 10).split("-").reverse().join("/")) + "</small>" + (a.tipo === "experiencia" ? ' <span class="pill ok xp">✓ Esteve aqui' + (a.roteiro ? " · " + esc(String(a.roteiro).slice(0, 40)) : "") + "</span>" : "") + (a.texto ? "<p>" + esc(a.texto) + "</p>" : "") + fotosAval(a) + "</div></div>"; }).join("") : '<p class="muted">Ninguém avaliou ainda. A primeira nota pode ser a sua.</p>') +
        (L.avaliando ? '<form id="rev" class="panel stack" style="gap:12px"><div class="field"><span>Sua nota</span><div class="pick" id="pick">' + [1, 2, 3, 4, 5].map(function (i) { return '<button type="button" data-n="' + i + '" class="' + (i <= L.estrelas ? "on" : "") + '" aria-label="' + i + ' estrelas">★</button>'; }).join("") + "</div></div>" +
          '<div class="field"><label for="rev-nome">Seu nome</label><input id="rev-nome" maxlength="40" value="' + esc(L.nome) + '" placeholder="Como quer aparecer"></div><div class="field"><label for="rev-texto">Comentário (opcional)</label><textarea id="rev-texto" maxlength="600" placeholder="O que valeu a pena? O que evitar?">' + esc(L.texto) + '</textarea></div>' +
          '<div class="field"><span>Fotos da sua visita (até 3, opcional)</span><div class="rev-fs" id="rev-fs">' + (L.fotosAv || []).map(function (s2, k) { return '<figure><img src="' + esc(Store.urlFoto(s2)) + '" alt=""><button type="button" data-rev-tira="' + k + '" aria-label="Remover foto">×</button></figure>'; }).join("") + ((L.fotosAv || []).length < 3 ? '<label class="rev-add" for="rev-file">+<small>Foto</small></label>' : "") + '</div><input type="file" id="rev-file" accept="image/*" multiple hidden><small class="muted">Só fotos suas, tiradas no lugar.</small></div>' +
          '<div class="row"><button class="btn" type="submit">Publicar avaliação</button><button class="btn ghost" type="button" data-avaliar="0">Cancelar</button></div></form>'
          : '<button type="button" class="btn soft" data-avaliar="1" style="justify-self:start">' + ic("star") + " Avaliar este lugar</button>") + (window.Promo ? Promo.blocoLugar(l) : "") + externas(l) + '<div class="panel stack" style="gap:10px"><h3>No Google Maps</h3><p class="small muted">Nota e avaliações públicas no Google, direto do mapa.</p>' + mapaGoogle(l, 240) + "</div></div>";
    }
    var hist = String(l.historia || ""), longo = hist.length > 360 && !L.lermais, f = fluxoDe(l), meu = sess("fluxo-" + l.id + "-" + hojeISO());
    var t = [];
    if (l.endereco) t.push(tile("pin", "Endereço", esc(l.endereco), '<button type="button" class="link" data-copiar="' + esc(l.endereco) + '">Copiar</button>', "wide"));
    if (!est) t.push(tile("ticket", "Entrada", esc(l.preco || (l.gratuito ? "Gratuito" : "Valor não levantado")) + (l.precoMin > 0 ? brl(l.precoMin) : ""), '<span class="small muted">' + (l.precoConfirmado === false ? "A confirmar · " : "") + (l.atualizadoEm ? "conferido em " + esc(l.atualizadoEm) : "") + (url(l.fontePreco) ? ' · <a href="' + esc(l.fontePreco) + '" target="_blank" rel="noopener">fonte</a>' : "") + "</span>", "wide"));
    if (l.quando) t.push(tile("clock", "Quando", esc(l.quando), "", "wide"));
    t.push(tile("users", "Movimento", f ? '<i class="dot" style="background:' + FLUXO[f.nivel][1] + '"></i>' + FLUXO[f.nivel][0] : "Sem informação hoje", '<span class="small muted">' + (f ? f.fonte : "") + "</span>" + (meu ? '<span class="small muted">Obrigado pela informação.</span>' : '<span class="row" style="gap:6px;margin-top:8px">' + [["pouco", "Tranquilo"], ["medio", "Médio"], ["alto", "Cheio"]].map(function (o) { return '<button type="button" class="chip xs" data-fluxo="' + o[0] + '">' + o[1] + "</button>"; }).join("") + "</span>"), "wide"));
    if (l.estacionamento) t.push(tile("car", "Estacionamento", esc(l.estacionamento), "", "wide"));
    return '<div class="stack" style="gap:14px"><div class="prose' + (longo ? " clamp" : "") + '">' + hist.split(/\n+/).map(function (p) { return "<p>" + esc(p) + "</p>"; }).join("") + "</div>" + (longo ? '<button type="button" class="link" data-lermais style="justify-self:start">Ler mais</button>' : "") +
      (l.dica ? '<div class="tipc"><span class="tic">' + ic("bulb") + '</span><div><small>Dica para brasileiros</small><p>' + esc(l.dica) + "</p></div></div>" : "") +
      blocoPrecos(l) + '<div class="tiles">' + t.join("") + "</div>" +
      (l.naoConferido ? '<p class="note">Endereço, horário e contato ainda não conferidos pela equipe do guia. Confira no site oficial antes de ir.</p>' : "") +
      (["governo", "transporte", "saude", "comunidade"].indexOf(l.categoria) >= 0 ? '<p class="note">Endereço, telefone e horário de órgãos públicos mudam sem aviso. Confirme no site oficial antes de ir.</p>' : "") + "</div>";
  }
  function trocaAba(tab) {
    var c = $("#tabc", sheetCard), l = Store.obter("lugares", L.id); if (!c || !l) return;
    L.tab = tab; c.classList.remove("swap"); void c.offsetWidth; c.innerHTML = abaConteudo(l, tab); c.classList.add("swap");
    Array.from(sheetCard.querySelectorAll("#seg [data-tab]")).forEach(function (b) { b.setAttribute("aria-selected", b.dataset.tab === tab); });
    pilula(); ligaForm();
    var sc = $(".sheet-scroll", sheetCard), sg = $("#seg", sheetCard), d = c.getBoundingClientRect().top - (sg.getBoundingClientRect().bottom + 12);
    if (d < 0) sc.scrollTo({ top: sc.scrollTop + d, behavior: matchMedia("(prefers-reduced-motion: reduce)").matches ? "auto" : "smooth" });
  }
  function pilula() {
    var s = $("#seg", sheetCard); if (!s) return; var b = s.querySelector('[aria-selected="true"]'), p = s.querySelector(".seg-pill"); if (!b || !p) return;
    p.style.width = b.offsetWidth + "px"; p.style.transform = "translateX(" + b.offsetLeft + "px)";
  }
  var avaliarPend = null;   /* link #avaliar-<lugar> (QR Code "Avalie-nos"): abre a ficha já no formulário */
  function ligaForm() {
    var f = $("#rev", sheetCard); if (!f) return; var id = L.id;
    $("#rev-nome", sheetCard).addEventListener("input", function (e) { L.nome = e.target.value; });
    $("#rev-texto", sheetCard).addEventListener("input", function (e) { L.texto = e.target.value; });
    var rf = $("#rev-file", sheetCard);
    if (rf) rf.addEventListener("change", async function (e) {
      var fl = Array.from(e.target.files || []).slice(0, 3 - (L.fotosAv || []).length); L.fotosAv = L.fotosAv || [];
      for (var i = 0; i < fl.length; i++) { try { L.fotosAv.push(await Store.salvarFoto(fl[i])); } catch (er) { toast(er.message || "Não foi possível enviar a foto."); break; } }
      e.target.value = ""; trocaAba("aval");
    });
    var rfs = $("#rev-fs", sheetCard);
    if (rfs) rfs.addEventListener("click", function (e) { var b = e.target.closest("[data-rev-tira]"); if (!b) return; var x = L.fotosAv.splice(Number(b.dataset.revTira), 1)[0]; if (x) Store.apagarFoto(x); trocaAba("aval"); });
    f.addEventListener("submit", function (e) {
      e.preventDefault();
      if (!L.estrelas) { toast("Escolha de 1 a 5 estrelas antes de publicar."); return; }
      var doc = { lugarId: id, estrelas: L.estrelas, nome: L.nome.trim() || "Visitante", texto: L.texto.trim(), fotos: (L.fotosAv || []).slice(0, 3), criadoEm: new Date().toISOString(), uid: Store.uid() || "" };
      var nid = Store.novoId("av");
      (function () { try { if (doc.nome) localStorage.setItem("meu-nome", JSON.stringify(doc.nome)); } catch (e) { /* ok */ } })(), Store.gravar("avaliacoes", nid, doc).then(function () { if (window.Usuario) Usuario.registraAval(nid); L.estrelas = 0; L.texto = ""; L.fotosAv = []; L.avaliando = false; toast("Avaliação publicada."); trocaAba("aval"); })
        .catch(function (er) { toast(er && er.message && !er.code ? er.message : "Não deu para publicar agora. Tente de novo."); });
    });
  }
  function folha(id, manterScroll) {
    var l = Store.obter("lugares", id);
    if (!l) { fechar(); toast("Este lugar não está mais no guia."); return; }
    if (L.id !== id) L = { id: id, foto: 0, estrelas: 0, nome: L.nome || meuNome(), texto: "", tab: "sobre", lermais: false, avaliando: false };
    if (avaliarPend === id) { L.avaliando = true; L.tab = "aval"; avaliarPend = null; }
    var sc = $(".sheet-scroll", sheetCard), topo = manterScroll && sc ? sc.scrollTop : 0;
    var fs = fotosDe(l); if (L.foto >= fs.length) L.foto = 0;
    var f = fs[L.foto], n = notas(l), av = avaliacoesDe(id), est = l.tipo === "estabelecimento", mi = milhas(l);
    var destino = encodeURIComponent([l.nome, l.endereco].filter(Boolean).join(", "));
    var perto = lugares().filter(function (o) { return o.id !== id && dist(l, o) != null; }).sort(function (a, b) { return dist(l, a) - dist(l, b); }).slice(0, 12); perto = primeiro(perto).slice(0, 6);
    var ad = anuncios("lugar")[0];
    var pz = precos(l), precoBar = pz && pz.gratis ? "Gratuito" : pz ? usd(pz.min) : est ? (l.faixaPreco || "–") : "Pago";
    sheetCard.innerHTML = '<div class="sheet-scroll"><div class="sheet-photo" id="sp"><span class="grab"></span>' +
      (f ? '<img src="' + esc(f.src) + '" alt="Foto de ' + esc(l.nome) + '"' + (f.google ? ' referrerpolicy="no-referrer"' : "") + ">" + (f.credito ? '<span class="cred">' + (f.ilustrativa ? "Foto ilustrativa: " : "Foto: ") + (url(f.pagina) ? '<a href="' + esc(f.pagina) + '" target="_blank" rel="noopener">' + esc(f.credito) + "</a>" : esc(f.credito)) + (f.licenca ? " · " + esc(f.licenca) : "") + "</span>" : "") : '<div class="phx">' + esc(l.nome) + "</div>") +
      '<button type="button" class="round close" data-fechar aria-label="Fechar">' + ic("down") + "</button>" +
      (window.Extras ? Extras.botaoFav(l) : "") +
      (fs.length > 1 ? '<button type="button" class="round prev" data-foto="-1" aria-label="Foto anterior">' + ic("left") + '</button><button type="button" class="round next" data-foto="1" aria-label="Próxima foto">' + ic("right") + '</button><div class="dots">' + fs.map(function (x, i) { return '<button type="button" data-ir="' + i + '" aria-current="' + (i === L.foto) + '" aria-label="Foto ' + (i + 1) + '"></button>'; }).join("") + "</div>" : "") +
      (fs.length > 1 ? '<div class="sp-th">' + fs.map(function (x, i) { return '<button type="button" data-ir="' + i + '" aria-current="' + (i === L.foto) + '" aria-label="Ver foto ' + (i + 1) + '"><img src="' + esc(x.src) + '" alt="" loading="lazy"></button>'; }).join("") + "</div>" : "") + "</div>" +
      '<div class="sheet-body' + (manterScroll ? " quiet" : "") + '"><div class="sb-grid"><div class="sb-main">' +
      (window.Pag ? Pag.avisoPrevia(l) : "") + '<div class="sb-tit"><p class="eyebrow">' + (l.anunciante ? "Patrocinado · " : "") + esc(CATS[l.categoria] || "") + " · " + esc(regiao(l)) + (l.brasileiro ? " · Brasileiro" : "") + '</p><h2 style="margin-top:4px">' + esc(l.nome) + "</h2>" +
      '<div class="row badges">' + (n.guia != null ? '<span class="badge"><span style="color:var(--sun)">★</span> <b class="num">' + n.guia.toFixed(1) + "</b>" + (n.qtd ? " (" + n.qtd + ")" : "") + "</span>" : "") +
      (window.Extras && Extras.aberto(l) != null ? '<span class="badge"><i class="dot" style="background:' + (Extras.aberto(l) ? "#2E8B57" : "#C2452D") + '"></i>' + (Extras.aberto(l) ? "Aberto agora" : "Fechado agora") + "</span>" : "") +
      (fluxoDe(l) ? '<span class="badge"><i class="dot" style="background:' + FLUXO[fluxoDe(l).nivel][1] + '"></i>' + FLUXO[fluxoDe(l).nivel][0] + "</span>" : "") +
      (window.Pag && Pag.selo && Pag.selo(l) ? '<span class="badge vf" title="Negócio conferido pela equipe do CoraçãoBR">✓ Verificado CoraçãoBR</span>' : "") + (window.Pag && Pag.impulsionado && Pag.impulsionado(l) ? '<span class="badge dq">⚡ Destaque</span>' : "") + (falaPt(l) ? '<span class="badge pt">🇧🇷 Fala português</span>' : "") + (window.Recursos ? Recursos.selos(l) : "") + (Store.admin() && Store.estado.modo === "nuvem" && l.notaProvisoria ? '<span class="badge soft">nota provisória</span>' : "") + "</div></div>" +
      (window.Checklist ? Checklist.botoes(l) : "") + acoes(l) +
      (window.Usuario ? Usuario.blocoEvento(l) : "") + (window.Recursos ? Recursos.blocoLugar(l) : "") + (window.Social ? Social.blocoLugar(l) : "") +
      '<div class="seg" role="tablist" id="seg">' + abasDe(l, av).map(function (t) { return '<button type="button" role="tab" data-tab="' + t[0] + '" aria-selected="' + (L.tab === t[0]) + '">' + t[1] + "</button>"; }).join("") + '<span class="seg-pill"></span></div>' +
      '<div id="tabc" class="tabc">' + abaConteudo(l, L.tab) + "</div>" +
      (function () { if (l.categoria !== "evento") return ""; var ou = eventosDoLocal(l).filter(function (o) { return o.id !== l.id; }); return ou.length ? '<div><div class="head"><h2 style="font-size:1.3rem">Outros eventos neste local</h2></div><div class="list">' + ou.map(function (o) { return '<a class="lrow nopos" href="#lugar-' + esc(o.id) + '"><span class="th">' + (foto(o) ? '<img src="' + esc(foto(o)) + '" alt="" loading="lazy">' : "") + "</span><span><b>" + esc(o.nome) + "</b><small>" + esc(o.quando || "") + '</small></span><span class="val">' + esc(precoCurto(o)) + "</span></a>"; }).join("") + "</div></div>" : ""; })() +
      (ad ? '<a class="adband" ' + alvo(ad) + '><div><span class="sponsor">Patrocinado</span><b>' + esc(ad.titulo) + '</b><span class="small muted">' + esc(ad.texto || "") + "</span></div>" + ic("arrow") + "</a>" : "") +
      '</div><aside class="sb-side">' +
      ((l.horario || l.semana || l.horas) ? '<div class="sb-card sb-hor"><p class="xp-t">' + ic("clock") + " Horário</p>" + (window.Horario ? Horario.html(l, esc) : "<b>" + esc(l.horario) + "</b>") + "</div>" : "") +
      '<div class="attrs"><div>' + ic("ticket") + "<b>" + esc(precoBar) + "</b><small>" + (pz && !pz.gratis ? (pz.med ? "a partir de · média " + usd(pz.med) : "a partir de") : est ? "Faixa de preço" : "Entrada") + "</small></div>" +
      "<div>" + ic("clock") + "<b>" + esc(l.quando ? l.quando : est ? (window.Extras && Extras.aberto(l) != null ? (Extras.aberto(l) ? "Aberto" : "Fechado") : "Ver horário") : (l.tempoVisita || "Livre")) + "</b><small>" + (l.quando ? "Quando" : est ? "Agora" : "Tempo de visita") + "</small></div>" +
      "<div>" + ic("pin") + "<b>" + (mi == null ? "–" : tempo(l)) + "</b><small>" + (mi == null ? "Distância" : esc(MODOS[Geo.modo].nome.toLowerCase()) + " · " + (mi < 10 ? mi.toFixed(1).replace(".", ",") : mi.toFixed(0)) + " mi") + "</small></div>" +
      "<div>" + ic("star") + "<b>" + (n.guia != null ? n.guia.toFixed(1) : "–") + "</b><small>" + esc(n.fonte || "sem avaliações") + "</small></div></div>" +
      (l.cupom ? '<div class="ticket"><span class="tic">' + ic("ticket") + '</span><div><span class="sponsor">Oferta para quem vem pelo guia</span><b>' + esc(l.cupom) + '</b><span class="small muted">Mostre esta tela no atendimento.</span>' + (window.Comunidade ? Comunidade.botaoCupom(l) : "") + '</div></div>' : "") +
      (l.descontoClube ? '<a class="ticket tk-clube" href="#clube"><span class="tic">' + ic("star") + '</span><div><span class="sponsor">Clube CoraçãoBR</span><b>' + esc(l.descontoClube) + '</b><span class="small muted">Para membros do Clube. Mostre a carteirinha digital.</span></div></a>' : "") +
      '<a class="btn sb-go" href="https://www.google.com/maps/dir/?api=1&destination=' + destino + "&travelmode=" + MODOS[Geo.modo].maps + (Geo.gps ? "&origin=" + Geo.lat.toFixed(5) + "," + Geo.lng.toFixed(5) : "") + '" target="_blank" rel="noopener">' + ic("pin") + " Como chegar</a></aside></div>" +
      (perto.length ? '<div class="sb-perto"><div class="head"><h2 style="font-size:1.3rem">Perto daqui</h2></div><div class="hscroll">' + perto.map(card).join("") + "</div></div>" : "") +
      '</div></div><div class="sheet-bar"><div class="v">' + (pz && !pz.gratis ? "<small>a partir de</small>" : "") + "<b>" + esc(precoBar) + "</b>" + (pz && !pz.gratis ? brl(pz.min) : "") + "<small>" + (pz && pz.gratis ? "entrada livre" : pz ? (pz.med ? "média " + usd(pz.med) + (est ? " por pessoa" : "") : esc(pz.base)) : est ? "faixa de preço" : "valor a confirmar") + '</small></div><a class="btn" href="https://www.google.com/maps/dir/?api=1&destination=' + destino + "&travelmode=" + MODOS[Geo.modo].maps + (Geo.gps ? "&origin=" + Geo.lat.toFixed(5) + "," + Geo.lng.toFixed(5) : "") + '" target="_blank" rel="noopener">' + ic("pin") + " Como chegar</a></div>";
    $(".sheet-scroll", sheetCard).scrollTop = topo;
    pilula(); ligaForm();
  }
  /* Métricas de acesso: cada navegador grava um documento por lugar e por dia com as próprias contagens (v = visualizações, r = rotas, c = contatos). */
  var meds = {};
  function medir(id, campo) {
    var vk = loc("vk"); if (!vk) { vk = Math.random().toString(36).slice(2, 10); loc("vk", vk); }
    var dia = hojeISO(), k = id + "." + dia + "." + vk, m = meds[k] || Store.obter("metricas", k) || { lugarId: id, dia: dia, v: 0, r: 0, c: 0 };
    m = { lugarId: id, dia: dia, v: m.v || 0, r: m.r || 0, c: m.c || 0, p: m.p || 0 }; m[campo] = (m[campo] || 0) + 1; meds[k] = m;
    Store.gravar("metricas", k, m).catch(function () {});
  }
  function assinatura(id) {
    var l = Store.obter("lugares", id);
    return JSON.stringify(l) + "|" + avaliacoesDe(id).length + "|" + Store.lista("fluxos").filter(function (f) { return f.lugarId === id; }).length + "|" + Geo.lat + "," + Geo.lng + Geo.modo + "|" + Store.lista("anuncios").length + "|" + JSON.stringify(config()) + "|" + Store.lista("lugares").length;
  }
  function abrir(id) {
    if (aberto && L.id === id && L.sig === assinatura(id)) return;
    if (!(aberto && L.id === id) && Store.obter("lugares", id)) medir(id, "v");
    popup.classList.remove("on");
    folha(id, aberto && L.id === id); L.sig = assinatura(id);
    if (!aberto) { aberto = true; trava(); sheet.hidden = false; void sheet.offsetWidth; sheet.classList.add("on"); }
  }
  /* Trava a página por trás sem perder a posição (no iPhone, overflow:hidden sozinho faz a página pular para o topo). */
  var posY = 0;
  function trava() { posY = window.scrollY; var b = document.body.style; b.position = "fixed"; b.top = -posY + "px"; b.left = "0"; b.right = "0"; b.width = "100%"; document.documentElement.classList.add("sheet-aberta"); }
  function destrava() { var b = document.body.style; b.position = b.top = b.left = b.right = b.width = ""; document.documentElement.classList.remove("sheet-aberta"); window.scrollTo(0, posY); }
  /* Arrastar para baixo fecha: vale na foto e em qualquer ponto quando o card está no topo. */
  (function () {
    var y0 = null, dy = 0, ok = false;
    sheetCard.addEventListener("touchstart", function (e) {
      var sc = $(".sheet-scroll", sheetCard); if (!sc || e.touches.length > 1) return;
      ok = sc.scrollTop <= 0 || !!e.target.closest("#sp"); y0 = e.touches[0].clientY; dy = 0;
    }, { passive: true });
    sheetCard.addEventListener("touchmove", function (e) {
      if (!ok || y0 == null) return; dy = e.touches[0].clientY - y0;
      if (dy > 0) { sheetCard.style.transition = "none"; sheetCard.style.transform = "translateY(" + dy + "px)"; sheet.style.setProperty("--arraste", Math.max(0, 1 - dy / 500)); }
      else ok = false;
    }, { passive: true });
    sheetCard.addEventListener("touchend", function () {
      if (y0 == null) return; var fecha = ok && dy > 110; y0 = null; ok = false;
      sheetCard.style.transition = ""; sheetCard.style.transform = ""; sheet.style.removeProperty("--arraste");
      if (fecha) fechar();
    }, { passive: true });
  })();
  var veioDeDentro = false;
  window.addEventListener("hashchange", function (e) { var de = (e.oldURL.split("#")[1] || ""), para = rota(); veioDeDentro = para.indexOf("lugar-") === 0 && de.indexOf("lugar-") !== 0 && de !== ""; });
  function fechar() { if (veioDeDentro && history.length > 1) { veioDeDentro = false; history.back(); } else location.hash = base; }
  function esconder() {
    if (!aberto) return; aberto = false; sheet.classList.remove("on"); destrava();
    setTimeout(function () { if (!aberto) { sheet.hidden = true; sheetCard.innerHTML = ""; } }, 320);
  }
  sheet.addEventListener("click", function (e) {
    if (e.target === sheet || e.target.closest("[data-fechar]")) { fechar(); return; }
    var p = e.target.closest("[data-foto]"), d = e.target.closest("[data-ir]"), s = e.target.closest("#pick button");
    var n = fotosDe(Store.obter("lugares", L.id) || {}).length;
    if (p && n) { L.foto = (L.foto + Number(p.dataset.foto) + n) % n; folha(L.id, true); }
    if (d) { L.foto = Number(d.dataset.ir); folha(L.id, true); }
    var lk = e.target.closest("a[href]");
    if (lk && L.id) { var h = lk.getAttribute("href"); if (/google\.com\/maps|uber\.com|lyft\.com|indrive/.test(h)) medir(L.id, "r"); else if (/wa\.me|instagram\.com|facebook\.com|^tel:/.test(h) || lk.textContent.indexOf("Site") >= 0) medir(L.id, "c"); }
    var tb = e.target.closest("[data-tab]"); if (tb) { trocaAba(tb.dataset.tab); return; }
    if (e.target.closest("[data-lermais]")) { L.lermais = true; trocaAba("sobre"); return; }
    var avb = e.target.closest("[data-avaliar]"); if (avb) { L.avaliando = avb.dataset.avaliar === "1"; trocaAba("aval"); return; }
    if (e.target.closest("[data-partilhar]")) { var lk = location.origin + location.pathname + "#lugar-" + L.id, lg = Store.obter("lugares", L.id) || {}; if (navigator.share) navigator.share({ title: lg.nome, url: lk }).catch(function () {}); else (navigator.clipboard ? navigator.clipboard.writeText(lk) : Promise.reject()).then(function () { toast("Link copiado."); }).catch(function () { toast(lk); }); return; }
    var fx = e.target.closest("[data-fluxo]"), cp = e.target.closest("[data-copiar]");
    if (fx) {
      var idf = L.id; sess("fluxo-" + idf + "-" + hojeISO(), "1");
      Store.gravar("fluxos", Store.novoId("fx"), { lugarId: idf, nivel: fx.dataset.fluxo, dia: hojeISO(), criadoEm: new Date().toISOString() }).then(function () { toast("Obrigado. Movimento atualizado."); if (Store.estado.modo !== "nuvem") folha(idf, true); }).catch(function () { toast("Não deu para registrar agora."); });
      folha(idf, true); return;
    }
    if (cp) { var tx = cp.dataset.copiar; (navigator.clipboard ? navigator.clipboard.writeText(tx) : Promise.reject()).then(function () { toast("Endereço copiado."); }).catch(function () { toast(tx); }); return; }
    var mo = e.target.closest("[data-modo]");
    if (mo) { Geo.modo = mo.dataset.modo; loc("modo", Geo.modo); folha(L.id, true); }
    if (s) { L.estrelas = Number(s.dataset.n); Array.from(s.parentNode.children).forEach(function (c, i) { c.classList.toggle("on", i < L.estrelas); }); }
  });
  document.addEventListener("keydown", function (e) { if (e.key === "Escape" && aberto) fechar(); });

  /* ---------- popup e faixa ---------- */
  window.addEventListener("hashchange", function () { if (rota() !== "inicio" && popup.classList.contains("on")) { popup.classList.remove("on"); setTimeout(function () { if (!popup.classList.contains("on")) popup.hidden = true; }, 350); } });
  function agendaPopup() {
    if (sess("popup-visto")) return;
    clearTimeout(agendaPopup.t);
    agendaPopup.t = setTimeout(function () {
      if (rota() !== "inicio" || aberto || sess("popup-visto") || !cidadeEscolhida || document.querySelector("dialog[open]") || document.getElementById("intro")) { if (!sess("popup-visto") && rota() === "inicio") agendaPopup(); return; }
      var a = anuncios("popup")[0], g = lugares().filter(GRUPOS.gratis.f).length;
      var pats = lugares().filter(function (l) { return l.anunciante; }), pl = pats[Math.floor(Math.random() * pats.length)];
      if (!a && pl) a = { titulo: pl.nome, texto: pl.cupom || (CATS[pl.categoria] || "") + " · " + regiao(pl), botao: "Ver no guia", imagem: (pl.fotos || [])[0] ? pl.fotos[0].src : "", lugar: pl.id };
      popup.innerHTML = (a ? (a.imagem ? '<img src="' + esc(Store.urlFoto(a.imagem)) + '" alt="">' : '<span class="ic">' + ic("megaphone") + "</span>") + "<b>" + esc(a.titulo) + "</b><p>" + esc(a.texto || "") + "</p><a " + (a.lugar ? 'href="#lugar-' + esc(a.lugar) + '"' : alvo(a)) + ">" + esc(a.botao || "Saiba mais") + " →</a>"
        : '<span class="ic">' + ic("leaf") + "</span><b>Chegou agora em " + esc(cid().principal) + "?</b><p>Comece pelos " + g + ' passeios que não cobram entrada.</p><a href="#explorar" data-grupo="gratis">Ver gratuitos →</a>') +
        '<button type="button" class="x" aria-label="Fechar">' + ic("x") + "</button>";
      popup.hidden = false; void popup.offsetWidth; popup.classList.add("on"); sess("popup-visto", "1");
    }, 2500);
  }
  document.addEventListener("cidade", function () { if (popup.classList.contains("on")) { popup.classList.remove("on"); setTimeout(function () { popup.hidden = true; }, 350); } });
  popup.addEventListener("click", function (e) { if (e.target.closest(".x") || e.target.closest("a")) { popup.classList.remove("on"); setTimeout(function () { popup.hidden = true; }, 400); } });
  /* Cores escolhidas no Painel (só aceita cores no formato #RRGGBB). */
  function aplicaTema() {
    var t = config().tema || {}, r = document.documentElement.style, ok = function (c) { return /^#[0-9a-f]{6}$/i.test(c || ""); };
    ["--accent", "--accent-mid", "--bg"].forEach(function (v, i) { var c = [t.accent, t.accent2, t.bg][i]; if (ok(c)) r.setProperty(v, c); else r.removeProperty(v); });
  }
  function faixa() {
    aplicaTema(); rodape();
    /* Faixa de aviso no topo: desligada; só aparece se o master ligar (faixaAtiva) em Aparência. */
    var c = config(), t = c.faixaAtiva === true ? c.faixaTexto : "", el = $("#strip");
    el.hidden = !t || !!sess("faixa-fechada"); $("#strip-txt").textContent = t || "";
  }
  $("#strip-x").addEventListener("click", function () { sess("faixa-fechada", "1"); faixa(); });
  function rodape() {
    if (window.Oficiais) Oficiais.rodape();
    var c = config(), pr = (window.Pag ? Pag.preco() : (c.precoAnuncio || 50)).toLocaleString("pt-BR");
    var a = $("#f-preco"); if (a) a.textContent = pr;
    Array.from(document.querySelectorAll(".f-preco2")).forEach(function (x) { x.textContent = pr; });
    (function () { var s = sac(), em = s.email; var fm = document.getElementById("f-mail"); if (fm) fm.href = "mailto:" + em; Array.from(document.querySelectorAll(".f-mailtx")).forEach(function (x) { x.href = "mailto:" + em; x.textContent = em; });
      var fz = document.getElementById("f-zap"); if (fz) fz.href = s.wa("Olá! Preciso de ajuda no CoraçãoBR."); Array.from(document.querySelectorAll(".f-zaptx")).forEach(function (x) { x.href = s.wa("Olá! Preciso de ajuda no CoraçãoBR."); x.textContent = "SAC · WhatsApp " + s.zapTxt; }); })();
    var y = $("#f-ano"); if (y) y.textContent = new Date().getFullYear();
    var pr2 = $("#f-promo"), pl = $("#f-pl"), promo = window.Pag && Pag.promocional() ? Pag.chamada() : "";
    if (pr2) { pr2.hidden = !promo; pr2.innerHTML = promo ? '<a href="#promo" style="color:inherit">' + esc(promo) + " Ver a promoção →</a>" : ""; } if (pl) pl.textContent = "Pacote mensal · " + (c.anunciosPorPacote || 3) + " anúncios";
  }
  document.addEventListener("click", function (e) {
    if (!e.target.closest("[data-ir-news]")) return; e.preventDefault();
    var ir = function () { var n = document.getElementById("f-news"); if (n) n.scrollIntoView({ behavior: "smooth", block: "center" }); else location.hash = "entrar"; };
    if (location.hash.replace("#", "") !== "inicio" && location.hash) { location.hash = "inicio"; setTimeout(ir, 500); } else ir();
  });

  /* ---------- ranking ---------- */
  var R = { grupo: "passeios" };
  function viewRanking() {
    var gs = ["passeios", "gratis", "comer", "brasileiros"];
    var ls = lugares().filter(GRUPOS[R.grupo].f).filter(function (l) { return notas(l).guia != null; }).sort(ordenaNota).slice(0, 20);
    var pat = lugares().filter(GRUPOS[R.grupo].f).filter(function (l) { return l.anunciante; }).sort(ordenaNota).slice(0, 3);
    var nota = function (l) { var n = notas(l); return '<span class="rk-s"><span><b>' + n.guia.toFixed(1) + "</b> ★</span><small>" + esc(n.fonte) + "</small></span>"; };
    var pod = ls.slice(0, 3).map(function (l, i) { return '<a class="rk-p rk-p' + (i + 1) + '" href="#lugar-' + esc(l.id) + '"><span class="rk-f">' + (foto(l) ? '<img src="' + esc(foto(l)) + '" alt="" loading="lazy" decoding="async">' : "") + '<em>' + (i + 1) + "º</em></span><span class=\"rk-pt\"><b>" + esc(l.nome) + "</b><small>" + esc(CATS[l.categoria] || "") + " · " + esc(regiao(l)) + "</small></span>" + nota(l) + "</a>"; }).join("");
    var resto = ls.slice(3).map(function (l, i) { return '<a class="rk-r" href="#lugar-' + esc(l.id) + '"><span class="rk-n">' + (i + 4) + '</span><span class="th">' + picHtml(l) + "</span><span class=\"rk-rt\"><b>" + esc(l.nome) + "</b><small>" + esc(CATS[l.categoria] || "") + " · " + esc(regiao(l)) + (precoCurto(l) ? " · " + esc(precoCurto(l)) : "") + "</small></span>" + nota(l) + "</a>"; }).join("");
    app.innerHTML = '<section class="block rk"><div class="wrap">' +
      '<header class="xp-h"><div><p class="eyebrow">Os mais bem avaliados</p><h1 class="page-h">Ranking</h1></div></header>' +
      '<nav class="menubar mb-4" id="grupos" aria-label="Lista">' + gs.map(function (g) { return '<button type="button" class="mb-it" data-g="' + g + '" aria-pressed="' + (R.grupo === g) + '">' + ic(GRUPOS[g].ic) + "<span>" + GRUPOS[g].nome + "</span></button>"; }).join("") + "</nav>" +
      (ls.length ? '<div class="rk-pod">' + pod + "</div>" : "") +
      '<div class="rk-body"><div class="rk-list">' + (resto || (ls.length ? "" : '<div class="panel muted">Nenhum lugar com nota nesta lista ainda.</div>')) + "</div>" +
      '<aside class="rk-side">' + (pat.length ? '<div class="xp-box rk-pat"><p class="xp-t">Patrocinados nesta lista</p>' + pat.map(function (l) { return '<a class="spc" href="#lugar-' + esc(l.id) + '"><span class="spc-f">' + (foto(l) ? '<img src="' + esc(foto(l)) + '" alt="" loading="lazy">' : "") + "<em>Patrocinado</em></span><span class=\"spc-t\"><b>" + esc(l.nome) + "</b><small>" + esc(CATS[l.categoria] || "") + "</small></span></a>"; }).join("") + '<a class="more" href="#anuncie">seu negócio aqui</a></div>' : "") +
      '<div class="xp-box"><p class="xp-t">De onde vêm as notas</p><p class="small muted">Só de fontes reais: a nota do <b>Google</b> (pela API oficial), avaliações de <b>visitantes</b> do guia e, quando não há outra, a <b>curadoria de parceiros</b>, sempre identificada. Lugares sem avaliação não entram no ranking.</p><a class="btn ghost sm" href="#explorar">Avaliar um lugar</a></div></aside></div></div></section>';
    $("#grupos").addEventListener("click", function (e) { var b = e.target.closest("button"); if (b) { R.grupo = b.dataset.g; viewRanking(); } });
  }

  /* ---------- anuncie ---------- */
  function viewAnuncie() {
    var c = config(), ls = lugares(), preco = reais(window.Pag ? Pag.preco() : c.precoAnuncio), npk = c.anunciosPorPacote || 3, promo = window.Pag && Pag.promocional() ? Pag.chamada() : "", cks = function (a) { return a.map(function (t) { return '<li><svg class="i" viewBox="0 0 24 24" aria-hidden="true"><path d="M5 12l5 5L20 7"/></svg>' + t + "</li>"; }).join(""); };
    var cidades = Array.from(new Set(ls.map(function (l) { return l.cidade; }).filter(Boolean))).length;
    var onde = [["sparkle", "Carrossel da página inicial", "Seu banner é montado sozinho com a foto de capa, o nome e a sua oferta, e entra no rodízio: a cada 30 minutos, novos anunciantes, sem repetir."], ["pin", "Pin verde no mapa", "No mapa, seu negócio aparece em verde, destacado dos lugares comuns."], ["chart", "Topo das buscas", "Em Explorar e no Ranking, patrocinados aparecem primeiro, com moldura amarela."], ["megaphone", "Feed e Mural", "Publique novidades, ofertas, vagas e classificados para toda a comunidade."]];
    var faq = [["Como funciona o preço?", "Cada pacote custa " + preco + " e libera " + npk + " anúncios por 1 mês. Os pacotes somam: 2 pacotes = " + (2 * npk) + " anúncios, 3 pacotes = " + (3 * npk) + " anúncios, e assim por diante."], ["Como eu pago?", "Por Pix, em reais. O painel gera o QR Code e o Pix copia e cola com o valor certo. A equipe confirma e os anúncios entram no ar 1 hora depois."], ["E quando o plano termina?", "Você recebe e-mail 3, 2 e 1 dia antes do fim. Dá para renovar antes, sem perder nenhum dia. Depois do fim há 2 dias de tolerância."], ["Posso cancelar quando quiser?", "Sim. Não há fidelidade nem renovação automática: é só não renovar."], ["O que é o selo Verificado?", "A equipe confere seu negócio (nome, contato e endereço) e seus anúncios ganham um selo verde de confiança. Pagamento único de " + reais(c.precoVerificado || 30) + "."], ["Como apareço no topo?", "Use Impulsionar no painel: por " + reais(c.precoImpulso || 25) + " seu anúncio fica no topo das listas e do mapa por " + (c.diasImpulso || 7) + " dias, com a etiqueta Destaque."], ["Tem vantagem para quem indica?", "Sim. Cada empresa que você indicar e que fizer o primeiro pagamento dá a você 50% de desconto em 1 pacote. O link fica no seu painel."], ["O cliente consegue agendar comigo?", "Sim. Seu anúncio tem o botão Agendar: o cliente escolhe data e horário e o pedido chega no seu e-mail ou no seu WhatsApp."], ["Precisa de aprovação?", "Não. Você monta o anúncio e ele entra no ar na hora. A equipe pode remover conteúdo que viole os termos de uso."], ["Como é feito o pagamento?", (c.pagamentos && (c.pagamentos.anuncio || c.pagamentos.basico)) ? "Por cartão, em página segura de pagamento, com renovação mensal automática." : "A equipe CoraçãoBR envia a cobrança mensal pelo WhatsApp informado (cartão, Zelle ou PIX)."], ["Quem vê meu anúncio?", "Brasileiros e falantes de português que usam o guia para decidir onde comer, comprar e contratar serviços."]];
    app.innerHTML = '<section class="block an"><div class="wrap">' +
      '<div class="an-hero"><div class="an-copy"><p class="eyebrow">Para negócios e profissionais</p>' + (promo ? '<a class="an-promo" href="#promo">' + ic("sparkle") + esc(promo) + " Ver a promoção →</a>" : "") + '<h1 class="page-h">Seu negócio na frente de quem fala português.</h1><p class="an-sub">Restaurante, mercado, salão, handyman, babá, limpeza: monte seu anúncio em minutos e entre no ar na hora, no guia que os brasileiros usam para decidir.</p>' +
      '<div class="row an-cta"><a class="btn" href="#anunciante" data-acesso="anunciar">Anunciar agora ' + ic("arrow") + '</a>' + (window.Promo && Promo.ativa() ? '<a class="btn ghost" href="#promo">Promoção: ' + reais(Promo.cfg().preco) + " = 1 anúncio + " + Promo.cfg().curadorias + " depoimentos</a>" : "") + '</div>' +
      '<dl class="an-st"><div><dt>Lugares no guia</dt><dd>' + todosLugares().length + '</dd></div><div><dt>Regiões do Texas</dt><dd>' + Object.keys(CIDADES_GUIA).filter(function (k) { return todosLugares().some(function (l) { return regiaoGuia(l) === k; }); }).length + '</dd></div><div><dt>Idiomas</dt><dd>3</dd></div></dl></div>' +
      '<aside class="an-plan"><p class="an-pl">Pacote mensal</p><div class="an-pv">' + preco + '<small>/' + npk + ' anúncios</small></div>' +
      '<ul class="an-ck">' + cks([npk + " anúncios por 1 mês · pacotes somam", "Até 20 fotos, banner, WhatsApp, redes sociais e site", "1 banner no carrossel por pacote", "Pin verde no mapa e topo das buscas", "Publicações no feed e no Mural", "Página com fotos, cardápio, horário e contatos", "Cupom com QR Code e painel de métricas"]) + '</ul>' +
      '<a class="btn an-go" href="#anunciante" data-acesso="anunciar">Começar por ' + preco + '</a><p class="an-fine">' + (promo ? esc(promo) + " · " : "") + 'Pagamento por Pix, em reais · sem fidelidade</p></aside></div>' +
      (window.Pag ? '<section class="an-sec"><p class="eyebrow">Quanto custa</p><h2>Some quantos pacotes quiser</h2>' + Pag.calculadora(Store.uid(), true) + "</section>" : "") +
      '<section class="an-sec"><p class="eyebrow">Onde você aparece</p><h2>Visibilidade em todo o guia</h2><div class="an-grid">' + onde.map(function (o) { return '<div class="an-tile"><span>' + ic(o[0]) + "</span><b>" + o[1] + "</b><p>" + o[2] + "</p></div>"; }).join("") + "</div></section>" +
      '<section class="an-sec"><p class="eyebrow">Como funciona</p><h2>No ar em três passos</h2><ol class="an-steps"><li><b>Crie sua conta</b><p>E-mail e senha, em menos de um minuto.</p></li><li><b>Monte o anúncio</b><p>Fotos, descrição, horário, WhatsApp e o banner do carrossel.</p></li><li><b>Pronto, está no ar</b><p>Acompanhe visualizações, cliques e rotas no seu painel.</p></li></ol></section>' +
      '<section class="an-sec an-two"><div><p class="eyebrow">Dúvidas frequentes</p><h2>Perguntas</h2><div class="an-faq">' + faq.map(function (f) { return "<details><summary>" + f[0] + "</summary><p>" + f[1] + "</p></details>"; }).join("") + '</div></div>' +
      '<div class="an-side"><div class="xp-box"><p class="xp-t">Lugares públicos e eventos</p><p class="small muted">Parques, museus, eventos e órgãos públicos são cadastrados pela equipe, sem custo.</p></div>' +
      '<div class="xp-box"><p class="xp-t">Mural de vagas e classificados</p><p class="small muted">Emprego, aluguel, carona ou venda: publicado por anunciantes, incluído no plano.</p><a class="btn ghost sm" href="#mural">Abrir o mural</a></div>' +
      '<div class="xp-box"><p class="xp-t">Fale com a equipe</p><p class="small">Dúvidas sobre planos, pagamento ou patrocínio:</p><a class="ct-link" href="mailto:' + esc(c.emailOficial || "coracaobr.oficial@gmail.com") + "?subject=" + encodeURIComponent("CoraçãoBR: anúncios e pagamentos") + '">' + esc(c.emailOficial || "coracaobr.oficial@gmail.com") + "</a>" + (c.contato && c.contato !== c.emailOficial ? '<p class="small muted" style="margin-top:6px">' + esc(c.contato) + "</p>" : "") + "</div></div></section>" +
      '<div class="an-final"><div><b>Pronto para aparecer?</b><span>' + preco + ' = ' + npk + ' anúncios por mês. Pacotes somam.</span></div><a class="btn an-go" href="#anunciante" data-acesso="anunciar">Anunciar agora</a></div></div></section>';
  }

  /* ---------- entrar ---------- */
  function meuNome() { try { return String(JSON.parse(localStorage.getItem("meu-nome") || '""') || Store.nome() || ""); } catch (e) { return Store.nome() || ""; } }
  /* A página Conta é montada em usuario.js; esta é só a reserva caso o módulo não carregue. */
  function viewEntrar() { app.innerHTML = '<section class="block"><div class="wrap"><h1 class="page-h">Minha conta</h1></div></section>'; }


  /* ---------- tema ---------- */
  function temaAtual() { return document.documentElement.dataset.theme === "dark" ? "dark" : "light"; }
  /* O tema só muda pelo botão claro/escuro do topo. Sem escolha salva, começa no claro (não segue o aparelho sozinho). */
  var t0 = "light"; try { t0 = localStorage.getItem("tema") === "dark" ? "dark" : "light"; } catch (e) { /* sem armazenamento */ }
  document.documentElement.dataset.theme = t0;
  function marcaBotaoTema() { var d = document.documentElement.dataset.theme === "dark"; Array.from(document.querySelectorAll(".tema-bt")).forEach(function (b) { b.setAttribute("aria-pressed", d); b.setAttribute("aria-label", d ? "Mudar para o tema claro" : "Mudar para o tema escuro"); }); }
  marcaBotaoTema();
  document.addEventListener("click", function (e) { if (!e.target.closest("[data-cor]")) return; var n = temaAtual() === "dark" ? "light" : "dark"; document.documentElement.dataset.theme = n; try { localStorage.setItem("tema", n); } catch (er) { /* ok */ } var mc = document.querySelector('meta[name="theme-color"]'); if (mc) mc.content = n === "dark" ? "#0B110E" : "#04341A"; marcaBotaoTema(); });

  /* ---------- roteador ---------- */
  var views = { inicio: viewInicio, explorar: viewExplorar, guia: viewExplorar, ranking: viewRanking, anuncie: viewAnuncie, entrar: viewEntrar };
  var base = "inicio", pintada = null, sujo = false;
  function rota() { var h = (location.hash || "").replace(/^#/, ""); return h || "inicio"; }
  function pinta(r) {
    if (r.indexOf("avaliar-") === 0) { avaliarPend = decodeURIComponent(r.slice(8)); location.replace("#lugar-" + encodeURIComponent(avaliarPend)); return; }
    var fn = views[r] || (r.indexOf("extra-") === 0 && views.extra) || (r.indexOf("mural-") === 0 && views.mural) || (r.indexOf("meu-roteiro-") === 0 && views["meu-roteiro"]) || (r.indexOf("roteiro-") === 0 && views.roteiro) || (r.indexOf("redefinir-") === 0 && views.redefinir) || (r.indexOf("busca-") === 0 && views.mapa) || (r.indexOf("local-") === 0 && views.local) || (r.indexOf("parceiro-") === 0 && views.parceiro) || (r.indexOf("perfil-") === 0 && views.perfil) || (r.indexOf("oficial-") === 0 && views.oficial) || (r.indexOf("clube-validar-") === 0 && views["clube-validar"]) || (r.indexOf("pergunta-") === 0 && views.perguntas) || viewInicio;
    document.body.classList.toggle("home", r !== "painel" && fn === viewInicio);
    if (r === "painel" && window.Painel) Painel.abrir(app); else fn(r);
    pintada = r; revelar();
  }
  function digitando() { var a = document.activeElement; return !!(a && /^(INPUT|TEXTAREA|SELECT)$/.test(a.tagName) && (app.contains(a) || sheetCard.contains(a))); }
  /* título da aba por tela (Google e relatórios do Analytics) */
  var TITULOS = { inicio: "", explorar: "Explorar lugares, eventos e serviços", mapa: "Mapa", metro: "Metrô de Dallas", feed: "Feed", mural: "Mural de vagas e classificados", ranking: "Os mais bem avaliados", anuncie: "Anuncie para brasileiros nos EUA", "roteiro-ia": "Roteiro com IA", caixinha: "Apoie o CoraçãoBR", conta: "Minha conta", entrar: "Entrar", cadastro: "Criar conta", parcerias: "Parcerias e expansão", sobre: "Sobre", chegada: "Primeiros 30 dias nos EUA", "fala-portugues": "Profissionais que falam português", clube: "Clube CoraçãoBR" };
  function tituloDe(r) {
    var base = "CoraçãoBR";
    if (r.indexOf("lugar-") === 0) { var l = Store.obter("lugares", r.slice(6)); return l ? l.nome + " · " + (CATS[l.categoria] || "") + (l.cidade ? " em " + l.cidade : "") + " · " + base : base; }
    var t = TITULOS[r]; return t ? t + " · " + base : base + " · Guia brasileiro nos EUA: lugares, eventos e serviços em português";
  }
  function render(viaDados, col) {
    var st = Store.estado, r = rota();
    if (st.pronto) { var tt = tituloDe(r); if (document.title !== tt) document.title = tt; }
    $("#aviso").hidden = !st.aviso; $("#aviso-txt").textContent = st.aviso || "";
    if (!st.pronto) return;
    faixa();
    var ehLugar = r.indexOf("lugar-") === 0, b = ehLugar ? base : r;
    if (!ehLugar) base = r;
    Array.from(document.querySelectorAll("#nav a, #tabbar a")).forEach(function (a) { a.getAttribute("href") === "#" + (b === "guia" ? "explorar" : b) ? a.setAttribute("aria-current", "page") : a.removeAttribute("aria-current"); });
    if (viaDados) {
      if (digitando()) return;
      var soDetalhe = col === "fluxos" || col === "avaliacoes" || col === "avisos" || col === "metricas";
      if (soDetalhe && b !== "painel" && b !== "anunciante") { if (ehLugar) abrir(r.slice(6)); return; }
      if (b === "painel" && pintada === b && window.Painel && Painel.atualizar()) { /* painel cuida */ }
      else if ((b === "explorar" || b === "guia") && pintada === b && $("#grade")) grade();
      else if (b === "anunciar" && pintada === b) { /* não apaga o formulário em preenchimento */ }
      else if (!(aberto && pintada === b)) pinta(b);
      else sujo = true;
      if (ehLugar) abrir(r.slice(6));
      return;
    }
    if (pintada !== b || !ehLugar && !aberto) { pinta(b); window.scrollTo(0, 0); }
    if (ehLugar) abrir(r.slice(6)); else { esconder(); if (sujo && pintada === b) { sujo = false; var y = window.scrollY; pinta(b); window.scrollTo(0, y); } }
  }
  document.addEventListener("click", function (e) {
    if (e.target.closest("[data-partida]")) { escolherPartida(); return; }
    var a = e.target.closest("[data-grupo]"); if (!a) return;
    limpaFiltro(); F.grupo = a.dataset.grupo; if (a.dataset.cat) F.cat = a.dataset.cat;
    if (rota() === "explorar") { pintada = null; render(false); }
  });
  window.addEventListener("hashchange", function () { render(false); });
  /* a cada 30 min entra a próxima rodada de banners, sem recarregar a página */
  var heroRod = null;
  setInterval(function () { if (rota() === "inicio" && window.Social && Social.rodada && heroRod != null && Social.rodada() !== heroRod && !document.querySelector("dialog[open]") && !aberto) { var y = window.scrollY; pintada = null; render(false); window.scrollTo(0, y); } }, 60000);
  /* menu do topo em sanfona: o título abre as opções (o mouse por cima também abre, pelo CSS) */
  function fechaNav(exceto) { Array.from(document.querySelectorAll(".nav-g.on")).forEach(function (g) { if (g !== exceto) { g.classList.remove("on"); g.querySelector(".nav-gt").setAttribute("aria-expanded", "false"); } }); }
  document.addEventListener("click", function (e) {
    var t = e.target.closest(".nav-gt");
    if (t) { var g = t.parentNode, abre = !g.classList.contains("on"); fechaNav(g); g.classList.toggle("on", abre); t.setAttribute("aria-expanded", String(abre)); return; }
    if (!e.target.closest(".nav-dd") || e.target.closest("a")) fechaNav();
  });
  document.addEventListener("keydown", function (e) { if (e.key === "Escape") fechaNav(); });
  window.addEventListener("hashchange", function () { fechaNav(); });
  window.Guia = { chavePix: chavePix, sac: sac, sacHtml: sacHtml, cidadeAtual: cidadeAtual, cid: cid, CIDADES_GUIA: CIDADES_GUIA, regiaoGuia: regiaoGuia, trocaCidade: trocaCidade, perguntaCidade: perguntaCidade, cidadeMaisPerto: cidadeMaisPerto, escolheuCidade: function () { return !!cidadeEscolhida; }, todosLugares: todosLugares, fotosDe: fotosDe, reais: reais, chaveLocal: chaveLocal, eventosDoLocal: eventosDoLocal, minutos: minutos, SECOES: SECOES, unificaEventos: unificaEventos, card: card, linha: linha, lugares: lugares, primeiro: primeiro, dist: dist, kmDe: kmDe, tempo: tempo, foto: foto, regiao: regiao, GRUPOS: GRUPOS, F: F, limpaFiltro: limpaFiltro, folha: function () { if (aberto && L.id) folha(L.id, true); }, medir: medir, PARTIDAS: PARTIDAS, Geo: Geo, ic: ic, views: views, SERVICOS: SERVICOS, COMIDA: COMIDA, hojeISO: hojeISO, loc: loc, app: app, esc: esc, usd: usd, precos: precos, precoCurto: precoCurto, mediaCategoria: mediaCategoria, CATS: CATS, config: config, CONFIG_PADRAO: CONFIG_PADRAO, toast: toast, notas: notas, stars: stars, avaliacoesDe: avaliacoesDe, render: render, url: url, brl: brl, ordenaNota: ordenaNota, destaque: destaque, falaPt: falaPt, IC: IC };
  var ligado = false;
  function ligar() { if (ligado) return; ligado = true; document.documentElement.dataset.cidade = cidadeAtual(); Store.assinar(function (col) { render(true, col); if (!perguntou && !cidadeEscolhida && Store.estado.pronto && !/^#(lugar-|clube-validar-|redefinir-|painel|pergunta-)/.test(location.hash)) { perguntou = true; setTimeout(function tenta() { if (document.getElementById("intro")) { setTimeout(tenta, 500); return; } if (!cidadeEscolhida && !document.querySelector("dialog[open]")) perguntaCidade(true); }, 2300); } }); Store.iniciar(); pedirLocal(false); }
  var perguntou = false;
  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", ligar); else setTimeout(ligar, 0);
})();
