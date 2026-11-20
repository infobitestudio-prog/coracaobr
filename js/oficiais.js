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
    }
  ];
  function ativos() { var off = (G.config().oficiaisOcultos || []); return LISTA.filter(function (o) { return off.indexOf(o.id) < 0; }); }
  function obter(id) { return LISTA.filter(function (o) { return o.id === id; })[0]; }

  /* slides do carrossel: os oficiais entram sempre, antes dos anunciantes da rodada */
  function slides() { return ativos().map(function (o) { return { tipo: "oficial", o: o }; }); }
  function slideHtml(o, i) { return '<a class="vit-slide" href="#oficial-' + esc(o.id) + '" aria-label="' + esc(o.nome) + ' (patrocinador oficial)"><img src="' + esc(o.banner) + '" alt="' + esc(o.nome + ": " + o.resumo) + '"' + (i ? ' loading="lazy"' : "") + "></a>"; }

  /* seção da página inicial */
  function secao() {
    var ls = ativos(); if (!ls.length) return "";
    return '<section class="block reveal ofc-sec"><div class="head"><div><p class="eyebrow">Patrocinadores oficiais</p><h2>Quem faz o CoraçãoBR acontecer</h2></div></div><div class="ofc-grid">' +
      ls.map(function (o) {
        return '<a class="ofc" href="#oficial-' + esc(o.id) + '" style="--ofc:' + o.cor + '"><span class="ofc-av"><img src="' + esc(o.avatar) + '" alt="" loading="lazy"></span><span class="ofc-t"><small>' + esc(o.tipo) + "</small><b>" + esc(o.nome) + "</b><span>" + esc(o.resumo) + '</span></span><span class="ofc-n">' + o.numeros.slice(0, 1).map(function (n) { return "<b>" + esc(n[0]) + "</b><small>" + esc(n[1]) + "</small>"; }).join("") + "</span>" + ic("arrow") + "</a>";
      }).join("") + "</div></section>";
  }

  /* página do patrocinador */
  function view(r) {
    var o = obter(String(r).replace(/^oficial-/, ""));
    if (!o) { location.hash = "inicio"; return; }
    G.app.innerHTML = '<section class="block ofp" style="--ofc:' + o.cor + '"><div class="wrap">' +
      '<a class="more" href="#inicio">← início</a>' +
      '<div class="ofp-ban"><img src="' + esc(o.banner) + '" alt="' + esc(o.nome) + '"></div>' +
      '<div class="ofp-grid"><div class="ofp-main">' +
      '<div class="ofp-h"><span class="ofc-av big"><img src="' + esc(o.avatar) + '" alt=""></span><div><p class="eyebrow">Patrocinador oficial · ' + esc(o.tipo) + "</p><h1 class=\"page-h\">" + esc(o.nome) + "</h1></div></div>" +
      '<p class="ofp-txt">' + esc(o.texto) + "</p>" +
      '<div class="xp-box"><p class="xp-t">Como funciona</p><ul class="ofp-como">' + o.como.map(function (c) { return "<li>" + ic("star") + "<span>" + esc(c) + "</span></li>"; }).join("") + "</ul></div>" +
      '<div class="ofp-num">' + o.numeros.map(function (n) { return "<div><b>" + esc(n[0]) + "</b><small>" + esc(n[1]) + "</small></div>"; }).join("") + '</div><p class="small muted">Números públicos consultados em ' + DATA + ".</p></div>" +
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
  window.Oficiais = { lista: ativos, slides: slides, slideHtml: slideHtml, secao: secao, rodape: rodape };
})();
