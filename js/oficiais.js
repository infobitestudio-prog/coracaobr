/* Patrocinadores oficiais do CoraçãoBR: destaque permanente e gratuito (não passam pelo pagamento).
   Aparecem no início do carrossel, em uma seção da página inicial, numa página própria (#oficial-<id>) e no rodapé.
   Dados levantados nas páginas oficiais de cada um em 20/11/2026. */
(function () {
  "use strict";
  var G = window.Guia, esc = G.esc, ic = G.ic;
  var DATA = "20/11/2026";
  var LISTA = [
    {
      id: "brtvmax", nome: "BRTVMAX", tipo: "Canal de TV · rodeio e sertanejo", cor: "#00784A",
      banner: "img/patrocinadores/brtvmax.jpg", avatar: "img/patrocinadores/brtvmax-avatar.jpg",
      resumo: "O canal dos maiores rodeios do Brasil: rodeio, música sertaneja, agro e vida no interior.",
      texto: "O BRTVMAX é um canal brasileiro dedicado ao rodeio e ao mundo sertanejo. Une a tradição da TV Rodeio com transmissão ao vivo pela internet, e é a casa do programa No Trecho, com Gerson TC.",
      como: ["No Brasil, pela parabólica digital, no canal 200.", "De qualquer lugar do mundo, ao vivo pelo site brtvmax.com.", "No YouTube, com rodeios, programas e acervo; membros do canal têm conteúdos extras."],
      numeros: [["424 mil", "inscritos no YouTube"], ["13,4 mil", "seguidores no TikTok"]],
      cta: ["Assistir ao vivo", "https://www.brtvmax.com"],
      links: [["Site", "https://www.brtvmax.com", "globe"], ["YouTube", "https://www.youtube.com/@brtvmax", "share"], ["Instagram", "https://www.instagram.com/brtvmax", "insta"], ["TikTok", "https://www.tiktok.com/@brtvmax", "share"], ["Facebook", "https://www.facebook.com/brasilruraltv", "fb"]],
      contato: "contato@brtvmax.com"
    },
    {
      id: "gerson-no-trecho", nome: "Gerson TC no Trecho", tipo: "Programa de rodeio · apresentador", cor: "#8A6A3A",
      banner: "img/patrocinadores/gerson-no-trecho.jpg", avatar: "img/patrocinadores/gerson-no-trecho-avatar.jpg",
      resumo: "O rodeio e o Reino Western no Brasil e nos EUA, com o apresentador Gerson TC.",
      texto: "No Trecho é o programa do apresentador Gerson TC sobre rodeio e o universo western. Mostra montarias, bastidores e histórias de cowboys, da PBR Brasil e Barretos aos peões brasileiros que competem nos Estados Unidos, como no rodeio de Aledo, no Texas.",
      como: ["Programa exibido no canal BRTVMAX.", "Episódios, reportagens e entrevistas no YouTube, com vídeos novos com frequência.", "Novidades e bastidores no Instagram e no Facebook."],
      numeros: [["9,99 mil", "inscritos no YouTube"], ["500+", "vídeos publicados"]],
      cta: ["Assistir no YouTube", "https://www.youtube.com/@gersontcnotrecho9720"],
      links: [["YouTube", "https://www.youtube.com/@gersontcnotrecho9720", "share"], ["Canal No Trecho", "https://www.youtube.com/@notrecho2190", "share"], ["Instagram", "https://www.instagram.com/tcgerson", "insta"], ["Facebook", "https://www.facebook.com/notrechocomgersontc", "fb"]],
      contato: ""
    },
    {
      id: "alexandre-no-texas", nome: "Alexandre no Texas", tipo: "Criador de conteúdo · Dallas, TX", cor: "#C62828",
      banner: "img/patrocinadores/alexandre-no-texas.jpg", avatar: "img/patrocinadores/alexandre-no-texas-avatar.jpg",
      resumo: "Brasileiro morando em Dallas, mostrando o dia a dia nos EUA e o melhor rodeio do mundo, a PBR.",
      texto: "Alexandre é um brasileiro que mora em Dallas e mostra a vida nos Estados Unidos e o rodeio de perto. Toda semana acompanha a PBR Stockyards Showcase, em Fort Worth, com as montarias dos peões brasileiros, visitas a ranchos e entrevistas com cowboys. Piazada!",
      como: ["Cobertura das quintas-feiras de PBR no Stockyards, em Fort Worth.", "Dia a dia de brasileiro nos EUA: mudança, trabalho, passeios e dicas.", "Vídeos no YouTube e no TikTok, com novidades no Instagram."],
      numeros: [["35,2 mil", "inscritos no YouTube"], ["16,3 mil", "seguidores no TikTok"]],
      cta: ["Seguir @alexandrenotexas", "https://www.instagram.com/alexandrenotexas"],
      links: [["YouTube", "https://www.youtube.com/@AlexandrenoTexas", "share"], ["Instagram", "https://www.instagram.com/alexandrenotexas", "insta"], ["TikTok", "https://www.tiktok.com/@alexandrenotexas", "share"]],
      contato: "alexandrenotexas@gmail.com"
    },
    {
      id: "infobite-studio", nome: "Infobite Studio", tipo: "Tecnologia, sites e conteúdo", cor: "#F0821A",
      banner: "img/patrocinadores/infobite-studio.jpg", avatar: "img/patrocinadores/infobite-studio-avatar.jpg",
      resumo: "Sites, automações com inteligência artificial, social media e estúdio próprio de podcast e vídeo.",
      texto: "O Grupo Infobite cria plataformas, sites e automações com inteligência artificial, como atendimento no WhatsApp, CRM e painéis. Mantém produtos digitais próprios, como o Infobite Card e o QR-DOG, e tem o Infobite Studio, com sala de podcast, produção de vídeo e social media.",
      como: ["Contato pelo WhatsApp, com diagnóstico em até um dia útil.", "Social media e audiovisual: planos mensais de R$ 1.100 a R$ 1.500, sem contrato.", "Criação de sites: landing page R$ 600, institucional R$ 700, e-commerce R$ 1.500, em até 12x."],
      numeros: [["6", "produtos digitais próprios"], ["1 dia útil", "para o diagnóstico"]],
      cta: ["Falar no WhatsApp", "https://wa.me/5511983573266"],
      links: [["Site", "https://infobitestudio.com.br", "globe"], ["Instagram", "https://instagram.com/infobite.studio", "insta"], ["WhatsApp", "https://wa.me/5511983573266", "chat"]],
      contato: "infobitestudio@gmail.com"
    },
    {
      id: "infobite-card", nome: "Infobite Card", tipo: "Cartão de visita digital", cor: "#FF5A1F",
      banner: "img/patrocinadores/infobite-card.jpg", avatar: "img/patrocinadores/infobite-card-avatar.jpg",
      resumo: "Seu cartão em um toque: WhatsApp, agenda, rotas e redes num link só, com QR Code e NFC.",
      texto: "O Infobite Card é um cartão de visita digital para profissionais. Junta WhatsApp com mensagem pronta, ligação, agenda, rotas (Maps, Waze, Uber) e redes sociais num link só, com QR Code, cartão NFC e métricas de visitas e cliques. Mostra o registro profissional com selo depois da conferência da equipe.",
      como: ["Crie a conta e monte o cartão no painel, com prévia ao vivo: profissão, cores e botões.", "Compartilhe por link, QR Code ou cartão NFC; quem recebe abre no navegador, sem app.", "Plano mensal de R$ 19,90 ou anual de R$ 199,90, com os mesmos recursos."],
      numeros: [["130+", "profissões reconhecidas"], ["R$ 19,90", "por mês"]],
      cta: ["Criar meu cartão", "https://infobitecard.com.br/"],
      links: [["Site", "https://infobitecard.com.br/", "globe"], ["Entrar", "https://infobitecard.com.br/login.html", "users"], ["WhatsApp", "https://wa.me/5511983573266", "chat"]],
      contato: ""
    },
    {
      id: "qr-dog", nome: "QR-DOG", tipo: "Medalha com QR Code para pets", cor: "#9DBB1F",
      banner: "img/patrocinadores/qr-dog.jpg", avatar: "img/patrocinadores/qr-dog-avatar.jpg",
      resumo: "Seu pet se perdeu? Um scan na medalha da coleira traz ele de volta.",
      texto: "O QR-DOG é uma medalha com QR Code para a coleira de cães e gatos. Quem encontra o animal aponta a câmera, vê o perfil do pet com o aviso de animal perdido e fala com o tutor na hora pelo WhatsApp. Não precisa de aplicativo nem de bateria.",
      como: ["O tutor compra a medalha e monta o perfil do pet no painel.", "Quem acha o animal escaneia o QR e vê nome, raça, porte e temperamento.", "O tutor é chamado pelo WhatsApp. Pagamento único de R$ 39,90."],
      numeros: [["130+", "raças de cães e gatos"], ["R$ 39,90", "pagamento único"]],
      cta: ["Quero a medalha", "https://www.qrdogdados.com.br/"],
      links: [["Site", "https://www.qrdogdados.com.br/", "globe"], ["WhatsApp", "https://wa.me/5511983573266", "chat"]],
      contato: ""
    }
  ];
  /* Banners em HTML (nada de botão desenhado: o banner inteiro é o link). Foto de fundo em alta, ou um visual
     feito em código de acordo com o que a empresa faz. */
  var BAN = {
    "brtvmax": { bg: "img/postais/rodeio-arena", kick: "Canal de TV · rodeio e sertanejo", titulo: "Os maiores rodeios do Brasil, ao vivo.", sub: "Rodeio, música sertaneja e vida no interior. Na parabólica digital, canal 200, e em brtvmax.com.", info: ["424 mil inscritos no YouTube", "Parabólica · canal 200"], selo: "Ao vivo" },
    "gerson-no-trecho": { bg: "img/postais/rodeio-touro", kick: "Programa de rodeio · Gerson TC", titulo: "O rodeio do Brasil aos EUA, com Gerson TC.", sub: "Montarias, bastidores e peões brasileiros: da PBR Brasil e Barretos aos rodeios do Texas.", info: ["No canal BRTVMAX", "500+ vídeos no YouTube"] },
    "alexandre-no-texas": { bg: "img/hero/fort-worth-stockyards", kick: "Criador de conteúdo · Dallas, TX", titulo: "A vida de brasileiro no Texas e a PBR de perto.", sub: "Toda quinta, as montarias no Stockyards de Fort Worth, ranchos e o dia a dia nos EUA.", info: ["@alexandrenotexas", "35,2 mil no YouTube"] },
    "infobite-studio": { visual: "studio", kick: "Tecnologia, sites e conteúdo", titulo: "Sites, automações com IA e estúdio de podcast.", sub: "Atendimento no WhatsApp com IA, CRM, social media e audiovisual. Landing page a partir de R$ 600.", info: ["Diagnóstico em 1 dia útil", "Em até 12x"] },
    "infobite-card": { visual: "cartao", kick: "Cartão de visita digital", titulo: "Seu cartão de visita em um toque.", sub: "WhatsApp, agenda, rotas e redes num link só, com QR Code e cartão NFC.", info: ["R$ 19,90 por mês", "130+ profissões"] },
    "qr-dog": { visual: "qrdog", kick: "Medalha com QR Code para pets", titulo: "Seu pet perdido volta para casa com um scan.", sub: "Medalha com QR Code na coleira: sem app e sem bateria. Pagamento único de R$ 39,90.", info: ["130+ raças", "R$ 39,90 pagamento único"] }
  };
  var CRED = window.CREDITOS_FOTOS || {};
  function credDe(bg) { var k = String(bg || "").split("/").pop(); var c = CRED[k]; return c ? "Foto: " + c.autor + " · " + c.licenca : ""; }
  /* foto de fundo só se o cartão-postal já estiver no site; senão, o logo grande na cor da marca */
  function temFoto(bg) { if (!bg) return false; if (bg.indexOf("img/postais/") < 0) return true; return (window.POSTAIS || []).indexOf(bg.split("/").pop()) >= 0; }
  function item(o) { var b = BAN[o.id] || {}, f = temFoto(b.bg); return { k: "of", id: o.id, href: "#oficial-" + o.id, bg: f ? b.bg + ".jpg" : "", bgM: f ? b.bg + "-m.jpg" : "", visual: b.visual || (f ? "" : "logo"), cor: o.cor, logo: o.avatar, nome: o.nome, kick: b.kick || o.tipo, titulo: b.titulo || o.resumo, sub: b.sub || "", info: b.info || [], selo: b.selo || "", tag: "Patrocinador oficial", cred: f ? credDe(b.bg) : "" }; }
  var QR_SVG = '<svg viewBox="0 0 21 21" aria-hidden="true">' + (function () { var m = "111111101011101111111100000101100101000001101110100011101011101101110101110001011101101110101001101011101100000101010101000001111111101010101111111000000000110100000000101101110011101001101100100100110110101010101111001011101001011011110010000000000101001100100101111111100110101100101100000101110101100100101110100001111111001101110101001010100010101101110100110111011010100000101101011100110111111110101111010110100"; var o = ""; for (var y = 0; y < 21; y++) for (var x = 0; x < 21; x++) if (m.charAt(y * 21 + x) === "1") o += '<rect x="' + x + '" y="' + y + '" width="1" height="1"/>'; return o; })() + "</svg>";
  /* visuais feitos em código (não são botões: só ilustração) */
  function visual(v, it) {
    if (v === "logo" && it && it.logo) return '<span class="bv bv-logo" aria-hidden="true"><i></i><i></i><img src="' + esc(it.logo) + '" alt=""></span>';
    if (v === "cartao") return '<span class="bv bv-card" aria-hidden="true"><span class="bv-ct"><i class="bv-av"></i><span><b>Ana Souza</b><small>Corretora de imóveis</small></span></span><span class="bv-cq">' + QR_SVG + '</span><span class="bv-nfc"><svg viewBox="0 0 24 24"><path d="M6 8.5a5 5 0 0 1 0 7M9.5 6a8.5 8.5 0 0 1 0 12M13 3.5a12 12 0 0 1 0 17"/></svg>NFC</span><span class="bv-ic"><i></i><i></i><i></i><i></i></span></span>';
    if (v === "studio") return '<span class="bv bv-std" aria-hidden="true"><span class="bv-win"><span class="bv-dots"><i></i><i></i><i></i></span><code><b>const</b> atendimento = <em>IA</em>();<br><b>await</b> whatsapp.<em>responder</em>(cliente);<br><b>site</b>.publicar(<em>"no ar"</em>);</code></span><span class="bv-mic"><svg viewBox="0 0 24 24"><rect x="9" y="3" width="6" height="11" rx="3"/><path d="M5.5 11a6.5 6.5 0 0 0 13 0M12 17.5V21M8.5 21h7"/></svg></span><span class="bv-wave"><i></i><i></i><i></i><i></i><i></i><i></i><i></i></span></span>';
    return "";
  }
  /* banner do carrossel (mesmo formato para patrocinador, anunciante e evento) */
  function bannerVit(it, i) {
    var lz = i ? ' loading="lazy"' : "", bg = it.visual === "qrdog" ? qrdogFrame() : it.bg ? '<img class="bn2-bg" src="' + esc(it.bg) + '"' + (it.bgM ? ' srcset="' + esc(it.bgM) + " 1280w, " + (it.bg.indexOf("img/postais/") >= 0 ? esc(it.bg.replace(/\.jpg$/, "-g.jpg")) + " 1920w, " : "") + esc(it.bg) + ' 2560w" sizes="(max-width: 860px) 100vw, 1200px"' : "") + ' alt=""' + lz + ' decoding="async">' : "";
    return '<a class="vit-slide bn2 bn2-' + (it.visual || "foto") + ' bn2-' + it.k + '" href="' + esc(it.href) + '" style="--c:' + esc(it.cor || "#0BA84A") + '" aria-label="' + esc(it.nome || it.titulo) + (it.tag ? " (" + esc(it.tag.toLowerCase()) + ")" : "") + '">' + bg + visual(it.visual, it) +
      (it.visual === "qrdog" ? "" : '<span class="bn2-tx"><span class="bn2-k">' + (it.logo ? '<img src="' + esc(it.logo) + '" alt=""' + lz + ">" : "") + esc(it.kick) + "</span><b class=\"bn2-t\">" + esc(it.titulo) + "</b>" + (it.sub ? '<span class="bn2-s">' + esc(it.sub) + "</span>" : "") +
        (it.info && it.info.length || it.selo ? '<span class="bn2-i">' + (it.selo ? '<em class="bn2-live"><i></i>' + esc(it.selo) + "</em>" : "") + esc((it.info || []).filter(Boolean).join(" · ")) + "</span>" : "") + "</span>") +
      (it.tag ? '<span class="bn2-tag">' + esc(it.tag) + "</span>" : "") + (it.cred ? '<span class="bn2-cr">' + esc(it.cred) + "</span>" : "") + "</a>";
  }
  /* slide do banner principal (mesmo formato dos slides com título) */
  function slideHero(it, i) {
    var lz = i ? ' loading="lazy"' : "";
    var fundo = it.visual === "qrdog" ? '<span class="bnh bnh-qd">' + qrdogFrame() + "</span>" : it.bg ? '<img src="' + esc(it.bg) + '"' + (it.bgM ? ' srcset="' + esc(it.bgM) + " 1280w, " + (it.bg.indexOf("img/postais/") >= 0 ? esc(it.bg.replace(/\.jpg$/, "-g.jpg")) + " 1920w, " : "") + esc(it.bg) + ' 2560w" sizes="100vw"' : "") + ' alt="" decoding="async"' + lz + ">" : '<span class="bnh bnh-' + esc(it.visual) + '" style="--c:' + esc(it.cor) + '">' + visual(it.visual, it) + "</span>";
    return fundo + '<div class="cap' + (it.visual === "qrdog" ? " cap-qd" : "") + '"><div class="wrap"><span class="kick bn-kick">' + (it.logo ? '<img src="' + esc(it.logo) + '" alt="">' : "") + esc(it.tag ? it.tag + " · " + it.nome : it.kick) + '</span><div class="h1">' + esc(it.titulo) + '</div><p class="hsub">' + esc(it.sub) + "</p>" +
      (it.info && it.info.length || it.selo ? '<p class="bn-info">' + (it.selo ? '<em class="bn2-live"><i></i>' + esc(it.selo) + "</em>" : "") + esc(it.info.join(" · ")) + "</p>" : "") + "</div></div>" + (it.cred ? '<span class="bn-cred">' + esc(it.cred) + "</span>" : "");
  }
  function ig(o) { var l = o.links.filter(function (x) { return /instagram\.com/.test(x[1]); })[0]; return l ? l[1].replace(/^https?:\/\/(www\.)?instagram\.com\//, "").replace(/\/.*$/, "") : ""; }
  var ORDEM = ["qr-dog", "brtvmax", "infobite-card", "alexandre-no-texas", "infobite-studio", "gerson-no-trecho"];
  LISTA.sort(function (a, b) { return ORDEM.indexOf(a.id) - ORDEM.indexOf(b.id); });
  function ativos() { var off = (G.config().oficiaisOcultos || []); return LISTA.filter(function (o) { return off.indexOf(o.id) < 0; }); }
  function obter(id) { return LISTA.filter(function (o) { return o.id === id; })[0]; }

  /* slides do carrossel: os oficiais entram sempre, antes dos anunciantes da rodada */
  function slides() { return ativos().map(function (o) { return { tipo: "oficial", o: o }; }); }
  function qrdogFrame() { return '<iframe class="qda-f" src="img/patrocinadores/qrdog-apresentacao/index.html" title="QR-DOG: a medalha que leva seu pet de volta para casa" tabindex="-1" aria-hidden="true" scrolling="no" loading="lazy"></iframe>'; }
  /* banner do QR-DOG: a capa da apresentação oficial (qrdogdados.com.br/apresentacao), animada em HTML num quadro 5:2 */
  function qrdogAnim(tag, extra) {
    return "<" + tag + ' class="qda" ' + (extra || "") + ' aria-label="QR-DOG: a medalha que leva seu pet de volta para casa">' +
      '<iframe class="qda-f" src="img/patrocinadores/qrdog-apresentacao/index.html" title="QR-DOG: a medalha que leva seu pet de volta para casa" tabindex="-1" aria-hidden="true" scrolling="no"></iframe>' +
      '<span class="qdv-selo">Patrocinador oficial</span>' +
      "</" + tag + ">";
  }
  /* slide do banner principal da home: banner inteiro sobre um fundo desfocado do próprio banner */
  function heroSlide(o, i) {
    var lz = i ? ' loading="lazy"' : "";
    return '<span class="hof-bg" style="background-image:url(' + esc(o.banner) + ')"></span>' +
      '<span class="hof-box"><span class="hof-in">' + (o.id === "qr-dog" ? qrdogAnim("span") : '<img src="' + esc(o.banner) + '" alt="' + esc(o.nome + ": " + o.resumo) + '"' + lz + ">") +
      '<span class="hof-tag">Patrocinador oficial</span></span></span>';
  }
  function slideHtml(o, i) {
    if (o.id === "qr-dog") return qrdogAnim("a", 'href="#oficial-qr-dog"').replace('class="qda"', 'class="vit-slide qda"'); return '<a class="vit-slide" href="#oficial-' + esc(o.id) + '" aria-label="' + esc(o.nome) + ' (patrocinador oficial)"><img src="' + esc(o.banner) + '" alt="' + esc(o.nome + ": " + o.resumo) + '"' + (i ? ' loading="lazy"' : "") + "></a>"; }

  /* seção da página inicial */
  function secao() {
    var ls = ativos(); if (!ls.length) return "";
    /* destaques no estilo do Instagram: círculo com a foto, anel nas cores do Brasil e o nome embaixo */
    return '<section class="block reveal ofc-sec"><div class="head"><div><p class="eyebrow">Patrocinadores oficiais</p><h2>Quem faz o CoraçãoBR bater</h2></div></div><nav class="dst" aria-label="Patrocinadores oficiais">' +
      ls.map(function (o) {
        return '<a class="dst-it" href="#oficial-' + esc(o.id) + '" title="' + esc(o.nome + " · " + o.tipo) + '"><span class="dst-ring"><span class="dst-av"><img src="' + esc(o.avatar) + '" alt="" loading="lazy"></span></span><b>' + esc(o.nome) + "</b><small>" + esc(o.tipo) + "</small></a>";
      }).join("") + "</nav></section>";
  }

  /* página do patrocinador */
  function view(r) {
    var o = obter(String(r).replace(/^oficial-/, ""));
    if (!o) { location.hash = "inicio"; return; }
    G.app.innerHTML = '<section class="block ofp" style="--ofc:' + o.cor + '"><div class="wrap">' +
      '<a class="more" href="#inicio">← início</a>' +
      (o.id === "qr-dog" ? '<div class="ofp-ban">' + qrdogAnim("div") + "</div>" : '<div class="ofp-ban vit">' + bannerVit(Object.assign(item(o), { href: "#oficial-" + o.id }), 0) + "</div>") +
      '<div class="ofp-grid"><div class="ofp-main">' +
      '<div class="ofp-h"><span class="ofc-av big"><img src="' + esc(o.avatar) + '" alt=""></span><div><p class="eyebrow">Patrocinador oficial · ' + esc(o.tipo) + "</p><h1 class=\"page-h\">" + esc(o.nome) + "</h1></div></div>" +
      '<p class="ofp-txt">' + esc(o.texto) + "</p>" +
      '<div class="xp-box"><p class="xp-t">Como funciona</p><ul class="ofp-como">' + o.como.map(function (c) { return "<li>" + ic("star") + "<span>" + esc(c) + "</span></li>"; }).join("") + "</ul></div>" +
      '<div class="ofp-num">' + o.numeros.map(function (n) { return "<div><b>" + esc(n[0]) + "</b><small>" + esc(n[1]) + "</small></div>"; }).join("") + (ig(o) ? '<a class="ofp-ig" href="https://www.instagram.com/' + esc(ig(o)) + '" target="_blank" rel="noopener">' + ic("insta") + "<span><b>@" + esc(ig(o)) + "</b><small>Seguir no Instagram</small></span></a>" : "") + '</div><p class="small muted">Números públicos consultados em ' + DATA + ".</p></div>" +
      '<aside class="ofp-side"><a class="btn ofp-cta" href="' + esc(o.cta[1]) + '" target="_blank" rel="noopener">' + esc(o.cta[0]) + " " + ic("arrow") + "</a>" +
      '<div class="xp-box"><p class="xp-t">Onde acompanhar</p>' + o.links.map(function (l) { return '<a class="ofp-lk" href="' + esc(l[1]) + '" target="_blank" rel="noopener">' + ic(l[2]) + "<span>" + esc(l[0]) + "</span>" + ic("arrow") + "</a>"; }).join("") + (o.contato ? '<p class="small muted">Contato: <a href="mailto:' + esc(o.contato) + '">' + esc(o.contato) + "</a></p>" : "") + "</div>" +
      '<div class="xp-box"><p class="xp-t">Outros patrocinadores oficiais</p>' + ativos().filter(function (x) { return x.id !== o.id; }).map(function (x) { return '<a class="pg-prev" href="#oficial-' + esc(x.id) + '"><img src="' + esc(x.avatar) + '" alt=""><b>' + esc(x.nome) + "</b>" + ic("arrow") + "</a>"; }).join("") + "</div></aside></div></div></section>";
    window.scrollTo(0, 0);
  }
  /* rodapé */
  function rodape() {
    var el = document.getElementById("f-ofc"); if (!el) return;
    el.innerHTML = '<span class="f-ofc-t">Patrocinadores oficiais</span>' + ativos().map(function (o) { return '<a href="#oficial-' + esc(o.id) + '"><img src="' + esc(o.avatar) + '" alt="" loading="lazy">' + esc(o.nome) + "</a>"; }).join("");
  }
  G.views.oficial = view;
  window.Oficiais = { lista: ativos, slides: slides, slideHtml: slideHtml, heroSlide: heroSlide, secao: secao, rodape: rodape, item: item, bannerVit: bannerVit, slideHero: slideHero };
})();
