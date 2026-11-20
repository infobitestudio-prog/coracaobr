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
  function ig(o) { var l = o.links.filter(function (x) { return /instagram\.com/.test(x[1]); })[0]; return l ? l[1].replace(/^https?:\/\/(www\.)?instagram\.com\//, "").replace(/\/.*$/, "") : ""; }
  var ORDEM = ["qr-dog", "brtvmax", "infobite-card", "alexandre-no-texas", "infobite-studio", "gerson-no-trecho"];
  LISTA.sort(function (a, b) { return ORDEM.indexOf(a.id) - ORDEM.indexOf(b.id); });
  function ativos() { var off = (G.config().oficiaisOcultos || []); return LISTA.filter(function (o) { return off.indexOf(o.id) < 0; }); }
  function obter(id) { return LISTA.filter(function (o) { return o.id === id; })[0]; }

  /* slides do carrossel: os oficiais entram sempre, antes dos anunciantes da rodada */
  function slides() { return ativos().map(function (o) { return { tipo: "oficial", o: o }; }); }
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
      (o.id === "qr-dog" ? '<div class="ofp-ban">' + qrdogAnim("div") + "</div>" : '<div class="ofp-ban"><img src="' + esc(o.banner) + '" alt="' + esc(o.nome) + '"></div>') +
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
  window.Oficiais = { lista: ativos, slides: slides, slideHtml: slideHtml, heroSlide: heroSlide, secao: secao, rodape: rodape };
})();
