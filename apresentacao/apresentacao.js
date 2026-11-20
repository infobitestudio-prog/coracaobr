/* CoraçãoBR — apresentação animada por categorias (JS puro) */
(function () {
  'use strict';

  /* ---------- velocidade ----------
     VEL < 1 deixa tudo mais rápido (tempo de leitura, toques, transições). ?vel=0.8 na URL também funciona. */
  var VEL = (function () { var m = /[?&]vel=([\d.]+)/.exec(location.search); var v = m ? Number(m[1]) : 1; return v > .3 && v < 3 ? v : 1; })();
  function ms(n) { return Math.round(n * VEL); }

  /* ---------- telas (capturas reais do app, 880×1912, WebP) ---------- */
  var NAV = { inicio: [22.7, 94.9], explorar: [37.5, 94.9], mapa: [51.1, 94.9], conta: [64.8, 94.9], feed: [78.4, 94.9] };
  // cor da barra de status por tela (fundo, texto)
  var SB = {
    'a01-gate': ['#071d10', '#fff'], 'a02-cidade': ['#2b2f2c', '#fff'], 'a03-inicio': ['#1d2124', '#fff'], 'c01-banner': ['#2a2a28', '#fff'],
    'd01-escuro': ['#151a1c', '#fff'], 'f01-houston': ['#1a1d22', '#fff'], 'f02-austin': ['#3a4048', '#fff'], 'f03-sanantonio': ['#2c3330', '#fff'],
    'b04-obrigado': ['#0b3a1f', '#fff'], 'c02-anuncio': ['#e9ece9', '#0E1311']
  };

  /* ---------- categorias ---------- */
  var CAT = [
    { n: '', nome: 'Abertura', tone: 'green' },
    { n: '1', nome: 'Usuário que chegou agora', longo: 'Usuário que chegou agora nas regiões da plataforma', tone: 'paper' },
    { n: '2', nome: 'Empresas brasileiras', longo: 'Empresas brasileiras que se cadastram', tone: 'ink' },
    { n: '3', nome: 'Empresa e usuário', longo: 'Interação entre empresa e usuário', tone: 'paper' },
    { n: '4', nome: 'Diferencial', longo: 'Diferencial', tone: 'green' },
    { n: '5', nome: 'Inteligente e necessário', longo: 'Por que é inteligente e necessário', tone: 'ink' },
    { n: '6', nome: 'Crescimento', longo: 'Expectativa de crescimento', tone: 'paper' },
    { n: '7', nome: 'Valores', longo: 'Valores', tone: 'paper' },
    { n: '8', nome: 'Créditos', longo: 'Créditos', tone: 'green' }
  ];

  /* ---------- roteiro ----------
     passo: s (tela), tr (transição: push, back, fade, sheet, scroll, none), tap [x%, y%] ou swipe [[x,y],[x,y]],
     zoom [x%, y%, escala], dur (ms de leitura), t (título), p (texto), facts, chips, e blocos especiais
     (difs, cities, rev, credits, notif, src). */
  var CH = [
    { cat: 0, name: 'O CoraçãoBR', steps: [
      { s: 'a03-inicio', intro: 'back', dur: 4200, logo: true,
        t: 'A plataforma brasileira para quem vive e viaja nos EUA.',
        p: 'Guia, comunidade e vitrine de negócios em português. Começamos pelo Texas: Dallas–Fort Worth, Houston, Austin e San Antonio.' },
      { s: 'a03-inicio', intro: 'front', dur: 5200,
        t: 'Tudo em português, num app que cabe no bolso.',
        p: 'Lugares, eventos, serviços e empresas brasileiras com preço conferido, mapa, avisos por perto e Pix. Instala no celular sem loja de aplicativos.',
        facts: [['700+', 'lugares, eventos e serviços'], ['4', 'regiões do Texas no ar'], ['3', 'idiomas: português, inglês e espanhol']] }
    ] },

    /* 1 · quem chegou agora */
    { cat: 1, name: 'Instalar e escolher a cidade', steps: [
      { s: 'a01-gate', tr: 'fade', dur: 5200, zoom: [50, 84, 1.32],
        t: 'No primeiro acesso, o site vira aplicativo.',
        p: 'No navegador do celular, o CoraçãoBR convida a instalar com um toque: iPhone ou Android. Instalado, abre direto como app e pode avisar o que acontece por perto.',
        chips: ['iPhone', 'Android', 'Sem loja de aplicativos', 'Notificações'] },
      { s: 'a02-cidade', tr: 'fade', tap: [26, 89.7], dur: 4600, zoom: [50, 52, 1.22],
        t: 'Escolhe a região ou usa a localização.',
        p: 'Dallas–Fort Worth, Houston, Austin e San Antonio. O guia lembra a escolha e mostra primeiro o que está mais perto.' },
      { s: 'a03-inicio', tr: 'fade', tap: [50, 63.5], dur: 4600,
        t: 'A tela inicial abre com o cartão-postal da cidade.',
        p: 'Fotos em alta das cidades, banners das empresas e busca em português: restaurante brasileiro, passeio grátis, dentista.' },
      { s: 'a04-painel', tr: 'scroll', swipe: [[50, 78], [50, 30]], dur: 5200, zoom: [50, 20, 1.2],
        t: 'O que importa hoje, logo de cara.',
        p: 'Hora local, dólar do dia, eventos dos próximos 7 dias, passeios de graça, negócios brasileiros e atalhos para cada seção.',
        chips: ['Agora em Dallas', 'Dólar hoje', 'Eventos', 'De graça', 'Brasileiros', 'Metrô', 'Pets', 'Clube'] }
    ] },
    { cat: 1, name: 'Conta e primeiros 30 dias', steps: [
      { s: 'a05-cadastro', tr: 'push', tap: [93, 3.6], dur: 5200, zoom: [50, 70, 1.22],
        t: 'Conta grátis com e-mail, senha e CEP.',
        p: 'O CEP americano (ZIP) define a região da pessoa: é com ele que o guia avisa sobre eventos e negócios perto de casa. A mesma conta serve para curtir, avaliar e, se quiser, anunciar.' },
      { s: 'a06-chegada', tr: 'push', tap: [50, 89], dur: 4800, zoom: [8, 46, 1.2],
        t: 'Os primeiros 30 dias, passo a passo.',
        p: 'Celular, moradia, Social Security ou ITIN, banco, carteira de motorista. A pessoa marca o que já resolveu e o progresso fica salvo.',
        facts: [['30', 'dias de roteiro de chegada'], ['10', 'passos explicados']] }
    ] },
    { cat: 1, name: 'Explorar com preço', steps: [
      { s: 'a07-explorar', tr: 'push', tap: NAV.explorar, dur: 5200, zoom: [50, 30, 1.18],
        t: 'Explorar: tudo com preço “a partir de”.',
        p: 'Cada cartão mostra o menor valor conferido no site oficial do lugar: prato, rodízio, ingresso ou entrada. Filtros de grátis, aberto agora e fala português.' },
      { s: 'a08-ficha-precos', tr: 'push', tap: [27, 36], dur: 5800, zoom: [50, 22, 1.22],
        t: 'Quanto custa, antes de sair de casa.',
        p: 'A partir de, média por pessoa e até, em dólar e em reais. O guia compara com a média da categoria na cidade e mostra a fonte e o mês da conferência.',
        facts: [['121', 'lugares com preço conferido no site oficial'], ['US$ 55', 'média por pessoa nas churrascarias de Dallas–Fort Worth']] }
    ] },
    { cat: 1, name: 'Mapa, metrô e roteiro', steps: [
      { s: 'a09-mapa', tr: 'push', tap: NAV.mapa, dur: 4600, zoom: [45, 22, 1.3],
        t: 'O mapa mostra o que existe ao redor.',
        p: 'Lugares agrupados por região, preço no pino e a lista do que está na área visível do mapa.' },
      { s: 'a10-metro', tr: 'push', dur: 4600, zoom: [50, 52, 1.28],
        t: 'Metrô e trens de Dallas–Fort Worth.',
        p: 'Linhas e estações do DART no mapa, rota entre estações e o modo “Estou no trem”.',
        facts: [['8', 'linhas'], ['90', 'estações']] },
      { s: 'a11-assistente', tr: 'sheet', dur: 5000, zoom: [10, 52, 1.2],
        t: 'Roteiro I.A.: pergunte do seu jeito.',
        p: 'Onde comer, o que fazer no fim de semana, quem fala português. O assistente responde com lugares que estão no guia e monta o roteiro.' },
      { s: 'a12-alertas', tr: 'push', dur: 4800, zoom: [10, 62, 1.2],
        t: 'Avisos só do que a pessoa gosta.',
        p: 'Ela escolhe os temas e recebe a notificação na tela do celular quando surge algo novo.',
        chips: ['Rodeio e sertanejo', 'Shows brasileiros', 'Futebol', 'Igreja em português', 'Festas brasileiras', 'Para crianças', 'Eventos grátis'] }
    ] },

    /* 2 · empresas */
    { cat: 2, name: 'Anunciar', steps: [
      { s: 'b01-anuncie', tr: 'fade', dur: 5200, zoom: [50, 74, 1.18],
        t: 'O negócio na frente de quem fala português.',
        p: 'Restaurante, mercado, salão, handyman, babá, contador. O anúncio fica pronto em minutos e aparece para quem está decidindo aonde ir.',
        facts: [['R$ 50', 'por mês'], ['3', 'anúncios por pacote'], ['20', 'fotos por anúncio']] },
      { s: 'b02-negocio-bloqueado', tr: 'push', tap: NAV.conta, dur: 5200, zoom: [10, 36, 1.2],
        t: 'Uma conta só. As ferramentas liberam com o pagamento.',
        p: 'A empresa usa a mesma conta de usuário. Monta o anúncio, escolhe o plano e paga por Pix: o painel do anunciante abre na hora.' }
    ] },
    { cat: 2, name: 'Pix automático', steps: [
      { s: 'b03-pix', tr: 'push', tap: [72, 56], dur: 5400, zoom: [50, 40, 1.28],
        t: 'O Pix é gerado com o valor certo.',
        p: 'QR Code e copia e cola, pagos na conta oficial do CoraçãoBR no Mercado Pago. Para apoiar o projeto, a caixinha aceita Pix com valor em aberto.' },
      { s: 'b04-obrigado', tr: 'fade', dur: 5200,
        t: 'Pagou, liberou. Sem esperar ninguém.',
        p: 'O Mercado Pago confirma o Pix, a tela agradece e leva a empresa direto ao painel. Antes de vencer, o sistema avisa por e-mail 3, 2 e 1 dia antes.',
        facts: [['Na hora', 'liberação automática'], ['3, 2, 1', 'dias: avisos de vencimento']] }
    ] },
    { cat: 2, name: 'Painel do anunciante', steps: [
      { s: 'b06-negocio', tr: 'push', tap: [50, 66], dur: 5000, zoom: [10, 22, 1.2],
        t: 'Meu negócio: plano, anúncios e resultados.',
        p: 'Quantos anúncios estão liberados, até quando o plano vale e o botão para contratar mais. Plano vencido deixa os anúncios guardados, com o botão Reativar.' },
      { s: 'b07-negocio-kpis', tr: 'scroll', swipe: [[50, 76], [50, 32]], dur: 4800,
        t: 'Resultados de verdade, todo mês.',
        p: 'Visualizações, rotas e contatos, cupons usados e anúncios no ar, com gráfico de 14 dias e relatório mensal.' },
      { s: 'b05-editor', tr: 'push', tap: [12, 80], dur: 5200, zoom: [10, 30, 1.2],
        t: 'Editor completo, com preço e cardápio.',
        p: 'Até 20 fotos, banner, WhatsApp e redes, horário, cardápio em livreto e o preço “a partir de”. As fotos são comprimidas em WebP, leves e sem perder qualidade.',
        chips: ['20 fotos', 'Banner', 'Cardápio', 'Horário', 'Cupom', 'Preço a partir de'] }
    ] },

    /* 3 · interação */
    { cat: 3, name: 'Vitrine em rodízio', steps: [
      { s: 'c01-banner', tr: 'fade', dur: 5400,
        t: 'Banners das empresas, em rodízio.',
        p: 'Os banners são montados em HTML com o que cada empresa faz, todos do mesmo tamanho e sem botões falsos. A cada 30 minutos entra uma nova rodada, sem repetir, o dia todo.',
        facts: [['30 min', 'por rodada'], ['3', 'banners por rodada'], ['24 h', 'sem pausa']] }
    ] },
    { cat: 3, name: 'Do anúncio ao balcão', steps: [
      { s: 'c02-anuncio', tr: 'sheet', tap: [50, 46], dur: 5200, zoom: [50, 62, 1.18],
        t: 'Do anúncio ao WhatsApp em um toque.',
        p: 'Curtir, salvar no roteiro, WhatsApp, Instagram, agendar e enviar. Selo “Fala português”, horário e preço “a partir de” calculado do cardápio da empresa.' },
      { s: 'c03-cupom', tr: 'scroll', swipe: [[50, 74], [50, 34]], dur: 4800, zoom: [50, 22, 1.2],
        t: 'Cupom que vira cliente no caixa.',
        p: 'A pessoa gera o código, mostra no atendimento e a empresa acompanha no painel quantos cupons foram usados.' }
    ] },
    { cat: 3, name: 'Passou perto, recebeu o aviso', steps: [
      { s: 'c07-perto', tr: 'push', tap: NAV.conta, dur: 6400,
        notif: { t: 'Por perto: Sabor de Minas (exemplo)', p: 'Vi que você está aqui perto (400 m). Que tal passar para almoçar? Tem 10% para quem vem pelo CoraçãoBR.' },
        t: 'Passou perto, o celular avisa.',
        p: 'Com o app instalado, o guia percebe quando a pessoa passa perto de um negócio ou evento e manda a notificação, com limite por dia para não incomodar. O CEP também traz as novidades da região.',
        facts: [['4', 'avisos por dia, no máximo'], ['45 min', 'entre um aviso e outro']] }
    ] },
    { cat: 3, name: 'Comunidade', steps: [
      { s: 'c04-mural', tr: 'push', dur: 4400,
        t: 'Mural: vagas, aluguel e classificados.',
        p: 'Vagas de emprego, quarto para alugar, carona, compra e venda. O destaque pago coloca a publicação no topo por 30 dias.' },
      { s: 'c05-pets', tr: 'push', dur: 4400, zoom: [8, 38, 1.2],
        t: 'Pets perdidos e achados.',
        p: 'Publicar é grátis. Com a plaquinha QR-DOG, quem acha o bichinho aponta a câmera e fala com o dono.' },
      { s: 'c06-clube', tr: 'push', dur: 4800, zoom: [30, 34, 1.2],
        t: 'Clube CoraçãoBR: carteirinha com QR.',
        p: 'Descontos nos negócios do guia, validados na hora pelo atendente. A empresa ganha clientes; o membro economiza.',
        facts: [['R$ 15', 'por mês'], ['QR', 'validado no caixa']] }
    ] },

    /* 4 · diferencial */
    { cat: 4, name: 'Tudo num lugar só', steps: [
      { s: 'd01-escuro', tr: 'fade', tap: [66, 3.6], dur: 7800,
        t: 'O que estava espalhado, agora num lugar só.',
        p: 'Grupos, posts e sites em inglês viram um guia organizado por cidade, em português, conferido pela equipe.',
        difs: [['Preço conferido', 'a partir de, média e até, com a fonte'], ['Avisos por perto', 'notificação ao passar perto'], ['App sem loja', 'instala no iPhone e no Android'], ['Pix automático', 'pagou, liberou'],
          ['Fala português', 'filtro e selo nos lugares'], ['Roteiro I.A.', 'assistente que conhece o guia'], ['4 regiões', 'Dallas–Fort Worth, Houston, Austin e San Antonio'], ['3 idiomas', 'e tema escuro para a noite']] },
      { s: 'b07-negocio-kpis', tr: 'fade', dur: 5600,
        t: 'Para a empresa: custo baixo e resultado medido.',
        p: 'R$ 50 por mês para 3 anúncios, falando direto com o público brasileiro, com os números no painel. Extras quando quiser crescer mais.',
        chips: ['Selo Verificado', 'Impulsionar 7 dias', 'Cupom com QR', 'Banner no rodízio', 'Desconto do Clube', 'Indique e ganhe 50%'] }
    ] },

    /* 5 · inteligente e necessário */
    { cat: 5, name: 'Por que é necessário', steps: [
      { s: 'a03-inicio', tr: 'fade', dur: 6200,
        t: 'Milhões de brasileiros já estão nos EUA.',
        p: 'Quem chega precisa de informação confiável em português desde o primeiro dia: onde comer, morar, trabalhar, tirar documentos e quem fala a nossa língua.',
        facts: [['2,08 mi', 'brasileiros vivendo nos EUA (Itamaraty, 2023)'], ['1,9 mi', 'visitantes brasileiros nos EUA em 2024 (NTTO)']],
        fonte: 'Fontes: Ministério das Relações Exteriores, Comunidades Brasileiras no Exterior (2024); NTTO/Departamento de Comércio dos EUA, via Panrotas (2025).' }
    ] },
    { cat: 5, name: 'Por que é inteligente', steps: [
      { s: 'e01-master', tr: 'fade', dur: 5400, zoom: [50, 36, 1.22],
        t: 'Um painel master controla tudo.',
        p: 'Receita, Pix a confirmar, contas, anúncios, banners, preços e aparência do site, em cartões. O master abre a área de qualquer conta para ajudar.' },
      { s: 'e02-master-contas', tr: 'push', dur: 4600, zoom: [50, 46, 1.22],
        t: 'Cada conta com CEP, região e plano.',
        p: 'Busca, filtros e ação rápida: abrir a área, mudar o papel, suspender ou excluir. Tudo conferido no servidor.' },
      { s: 'a04-painel', tr: 'fade', dur: 6000,
        t: 'Funciona sozinho, todo dia às 5h.',
        p: 'Atualiza dólar, eventos vencidos, metrô, fotos e notas. Gera páginas para o Google com sitemap e dados estruturados, e mede campanhas com GA4, Google Ads e Pixel da Meta, só depois do aceite de cookies (LGPD).',
        facts: [['5h', 'atualização diária'], ['172', 'páginas para o Google'], ['WebP', 'fotos leves, sem perder qualidade']] }
    ] },

    /* 6 · crescimento */
    { cat: 6, name: 'Já no ar no Texas', steps: [
      { s: 'f01-houston', tr: 'fade', tap: [58, 3.6], dur: 3600,
        t: 'Uma marca, várias cidades.',
        p: 'Cada região tem tela inicial própria, cartão-postal, eventos e passeios grátis. Houston já está no ar.' },
      { s: 'f02-austin', tr: 'fade', dur: 3000, t: 'Austin.', p: 'A capital do Texas, com o mesmo guia completo.' },
      { s: 'f03-sanantonio', tr: 'fade', dur: 3000, t: 'San Antonio.', p: 'River Walk, missões históricas e a comunidade brasileira da região.' }
    ] },
    { cat: 6, name: 'Próximas cidades e países', steps: [
      { s: 'e03-parcerias', tr: 'push', dur: 9200,
        t: 'Pronto para novas cidades, nos EUA, no Brasil e na Europa.',
        p: 'A estrutura é a mesma em qualquer lugar: guia, anunciantes, Pix e painel. A expansão segue onde vivem mais brasileiros e onde turistas e negócios mais procuram.',
        cities: [
          ['Estados Unidos', 'onde vivem e viajam mais brasileiros', ['Orlando', 'Miami', 'Nova York', 'Boston', 'Newark (NJ)', 'Los Angeles', 'Las Vegas', 'Atlanta', 'Chicago']],
          ['Brasil', 'turismo e negócios', ['São Paulo', 'Rio de Janeiro', 'Florianópolis', 'Foz do Iguaçu', 'Gramado', 'Salvador', 'Brasília', 'Belo Horizonte', 'Recife']],
          ['Europa', 'comunidades brasileiras e turismo', ['Lisboa', 'Porto', 'Londres', 'Dublin', 'Paris', 'Madri', 'Barcelona', 'Roma', 'Milão']]
        ] }
    ] },

    /* 7 · valores (sempre no fim) */
    { cat: 7, name: 'Valores', steps: [
      { s: 'b01-anuncie', tr: 'fade', dur: 11000, rev: true,
        t: 'Para o usuário, é grátis. Para as empresas:',
        p: 'Receita recorrente de anunciantes e membros, extras avulsos e patrocínio. Todos os valores são ajustáveis no painel master.' }
    ] },

    /* 8 · créditos */
    { cat: 8, name: 'Créditos', steps: [
      { s: 'a03-inicio', tr: 'fade', spin: true, dur: 9000, end: true, credits: true,
        t: 'O Texas em português, num toque.',
        p: 'Um produto pronto, que se atualiza sozinho e cresce cidade a cidade.' }
    ] }
  ];

  var REV = [
    ['Pacote de anúncios', 'R$ 50', '/mês', '3 anúncios por pacote; os pacotes somam'],
    ['Promoção de lançamento', 'R$ 20', '', '1 anúncio por 1 mês + 5 depoimentos'],
    ['Selo Verificado', 'R$ 30', '', 'selo verde em todos os anúncios'],
    ['Impulsionar', 'R$ 25', '', 'topo das listas por 7 dias'],
    ['Destaque no Mural', 'R$ 10', '', 'primeiro lugar por 30 dias'],
    ['Clube CoraçãoBR', 'R$ 15', '/mês', 'carteirinha com descontos'],
    ['Indique e ganhe', '50%', '', 'de desconto em 1 pacote'],
    ['Patrocínio de seção', 'Sob consulta', '', 'banner “oferecido por” no Explorar', true],
    ['Patrocinador oficial', 'Sob consulta', '', 'destaque na tela inicial e no rodízio', true],
    ['Apoie o projeto', 'Valor livre', '', 'caixinha do desenvolvedor por Pix', true]
  ];

  /* ---------- lista linear de passos ---------- */
  var STEPS = [];
  CH.forEach(function (c, ci) {
    c.steps.forEach(function (s, si) {
      s.ci = ci; s.si = si; s.src = 'telas/' + s.s + '.webp';
      STEPS.push(s);
    });
  });

  /* ---------- elementos ---------- */
  var $ = function (id) { return document.getElementById(id); };
  var body = document.body;
  var phone = $('phone'), zoomer = $('zoomer'), viewport = $('viewport'), touch = $('touch'), notif = $('notif');
  var sbar = $('sbar'), copy = $('copy'), segs = $('segs'), count = $('count'), aud = $('aud');
  var btnPlay = $('btnPlay'), btnPrev = $('btnPrev'), btnNext = $('btnNext');
  var indexEl = $('index'), indexList = $('indexList'), btnIndex = $('btnIndex');
  var layers = [$('layerA'), $('layerB')], curLayer = 0;

  var mq = window.matchMedia('(prefers-reduced-motion: reduce)');
  var reduced = mq.matches;
  if (mq.addEventListener) mq.addEventListener('change', function (e) { reduced = e.matches; });

  /* espessura do celular: poucas camadas = giro leve e fluido */
  (function () {
    var sl = $('slices');
    for (var z = -3.9; z <= 3.91; z += 1.3) {
      var i = document.createElement('i');
      i.style.transform = 'translateZ(' + z.toFixed(2) + 'em)';
      sl.appendChild(i);
    }
  })();

  /* cor do aparelho (laranja ou grafite), lembrada neste navegador */
  function corPhone(c) {
    body.classList.toggle('ph-grafite', c === 'grafite');
    try { localStorage.setItem('apres-cor', c); } catch (e) { /* ok */ }
    Array.prototype.forEach.call(document.querySelectorAll('[data-cor]'), function (b) { b.setAttribute('aria-pressed', b.dataset.cor === c ? 'true' : 'false'); });
  }
  (function () { var c = 'laranja'; try { c = localStorage.getItem('apres-cor') || c; } catch (e) { /* ok */ } if (/[?&]cor=grafite/.test(location.search)) c = 'grafite'; corPhone(c); })();

  /* pré-carregamento: a tela atual e as duas seguintes primeiro; o resto quando o navegador estiver livre */
  var cache = {};
  function load(src) {
    if (!cache[src]) {
      var im = new Image();
      im.decoding = 'async';
      im.src = src;
      cache[src] = (im.decode ? im.decode() : new Promise(function (r) { im.onload = im.onerror = r; })).catch(function () {});
    }
    return cache[src];
  }
  function preload(i) { for (var k = i; k < Math.min(STEPS.length, i + 3); k++) load(STEPS[k].src); }
  preload(0);
  window.addEventListener('load', function () {
    var k = 0, ric = window.requestIdleCallback || function (f) { return setTimeout(f, 120); };
    (function um() { if (k >= STEPS.length) return; load(STEPS[k++].src).then(function () { ric(um); }); })();
  });

  /* ---------- estado ---------- */
  var idx = -1, token = 0, paused = false, ended = false, elapsed = 0, seqDone = false;
  var zoomed = false, last = performance.now(), overlayOpen = false;
  var REST = [88, 70];

  /* espera que respeita a pausa e o cancelamento */
  function wait(t, tok) {
    return new Promise(function (res) {
      var left = t, t0 = performance.now();
      function f(now) {
        if (tok !== token) return res(false);
        if (!paused) left -= now - t0;
        t0 = now;
        if (left <= 0) return res(true);
        requestAnimationFrame(f);
      }
      requestAnimationFrame(f);
    });
  }

  /* ---------- celular: barra de status, toque, zoom, notificação, transições ---------- */
  function setStatus(name) {
    var c = SB[name] || ['#f4f6f5', '#0E1311'];
    sbar.style.setProperty('--sb-bg', c[0]);
    sbar.style.setProperty('--sb-fg', c[1]);
  }
  function moveTouch(p) { touch.style.left = p[0] + '%'; touch.style.top = p[1] + '%'; }
  function press(p) {
    touch.classList.add('press');
    var r = document.createElement('span');
    r.className = 'ripple';
    r.style.left = p[0] + '%';
    r.style.top = p[1] + '%';
    viewport.appendChild(r);
    setTimeout(function () { r.remove(); }, 650);
    setTimeout(function () { touch.classList.remove('press'); }, 180);
  }
  function setZoom(z) {
    if (z && !reduced) {
      zoomer.style.transformOrigin = z[0] + '% ' + z[1] + '%';
      zoomer.style.transform = 'scale(' + z[2] + ')';
      zoomed = true;
    } else {
      zoomer.style.transform = 'scale(1)';
      zoomed = false;
    }
  }
  function showNotif(n) {
    if (!n) { notif.classList.remove('on'); return; }
    $('nfT').textContent = n.t; $('nfP').textContent = n.p;
    notif.classList.add('on');
  }

  function showScreen(src, type) {
    var cur = layers[curLayer], nxt = layers[1 - curLayer];
    if (cur.getAttribute('src') === src && cur.classList.contains('on')) return Promise.resolve();
    if (!cur.getAttribute('src') || type === 'none') type = cur.getAttribute('src') ? 'fade' : 'instant';
    if (reduced && type !== 'instant') type = 'fade';
    nxt.src = src;
    return load(src).then(function () {
      if (type === 'instant') {
        nxt.classList.add('on'); cur.classList.remove('on');
        curLayer = 1 - curLayer;
        return;
      }
      var D = ms(type === 'fade' ? 300 : type === 'scroll' ? 520 : 460);
      var ease = 'cubic-bezier(.32,.72,0,1)';
      var kn, kc, zN = 2, zC = 1;
      if (type === 'push') {
        kn = [{ transform: 'translate3d(100%,0,0)' }, { transform: 'translate3d(0,0,0)' }];
        kc = [{ transform: 'translate3d(0,0,0)', opacity: 1 }, { transform: 'translate3d(-28%,0,0)', opacity: .55 }];
      } else if (type === 'back') {
        zN = 1; zC = 2;
        kn = [{ transform: 'translate3d(-28%,0,0)', opacity: .55 }, { transform: 'translate3d(0,0,0)', opacity: 1 }];
        kc = [{ transform: 'translate3d(0,0,0)' }, { transform: 'translate3d(100%,0,0)' }];
      } else if (type === 'scroll') {
        kn = [{ transform: 'translate3d(0,100%,0)' }, { transform: 'translate3d(0,0,0)' }];
        kc = [{ transform: 'translate3d(0,0,0)' }, { transform: 'translate3d(0,-100%,0)' }];
      } else if (type === 'sheet') {
        kn = [{ transform: 'translate3d(0,100%,0)' }, { transform: 'translate3d(0,0,0)' }];
        kc = [{ transform: 'scale(1)', opacity: 1 }, { transform: 'scale(.94)', opacity: .5 }];
      } else {
        kn = [{ opacity: 0 }, { opacity: 1 }];
        kc = [{ opacity: 1 }, { opacity: 1 }];
      }
      nxt.style.zIndex = zN; cur.style.zIndex = zC;
      nxt.classList.add('on', 'mv'); cur.classList.add('mv');
      var a1 = nxt.animate(kn, { duration: D, easing: ease, fill: 'both' });
      var a2 = cur.animate(kc, { duration: D, easing: ease, fill: 'both' });
      return a1.finished.catch(function () {}).then(function () {
        cur.classList.remove('on', 'mv'); nxt.classList.remove('mv');
        cur.style.zIndex = ''; nxt.style.zIndex = '';
        a1.cancel(); a2.cancel();
        curLayer = 1 - curLayer;
      });
    });
  }

  /* ---------- texto ---------- */
  function esc(s) { return String(s).replace(/[&<>"]/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]; }); }

  function renderCopy(step) {
    var c = CH[step.ci], k = CAT[c.cat];
    var h = '';
    if (step.logo) {
      h += '<div class="logo-big"><svg viewBox="0 0 270 200" aria-hidden="true"><use href="#bsym"/></svg><span>Coração<b>BR</b></span></div>';
    } else {
      h += '<p class="cat-k">' + (k.n ? '<span class="cat-n">' + k.n + '</span>' : '') + '<span class="cat-t">' + esc(k.longo || k.nome) + '</span></p>';
      h += '<p class="kicker">' + esc(c.name) + '</p>';
    }
    h += '<h1 class="title">' + esc(step.t) + '</h1>';
    h += '<p class="lede">' + esc(step.p) + '</p>';
    if (step.facts) h += '<dl class="facts">' + step.facts.map(function (f) { return '<div><dt>' + esc(f[0]) + '</dt><dd>' + esc(f[1]) + '</dd></div>'; }).join('') + '</dl>';
    if (step.chips) h += '<ul class="chips">' + step.chips.map(function (x) { return '<li>' + esc(x) + '</li>'; }).join('') + '</ul>';
    if (step.difs) h += '<ul class="difs">' + step.difs.map(function (d) { return '<li><b>' + esc(d[0]) + '</b><span>' + esc(d[1]) + '</span></li>'; }).join('') + '</ul>';
    if (step.cities) h += '<div class="cities">' + step.cities.map(function (g) {
      return '<div class="cty"><p class="cty-h"><b>' + esc(g[0]) + '</b><span>' + esc(g[1]) + '</span></p><ul>' + g[2].map(function (n) { return '<li>' + esc(n) + '</li>'; }).join('') + '</ul></div>';
    }).join('') + '</div><p class="cty-now"><b>No ar hoje:</b> Dallas–Fort Worth · Houston · Austin · San Antonio</p>';
    if (step.rev) h += '<ul class="rev">' + REV.map(function (r) {
      return '<li><span class="rv-n">' + esc(r[0]) + '</span><span class="rv-p' + (r[4] ? ' word' : '') + '">' + esc(r[1]) + (r[2] ? '<small>' + esc(r[2]) + '</small>' : '') + '</span><span class="rv-d">' + esc(r[3]) + '</span></li>';
    }).join('') + '</ul>';
    if (step.fonte) h += '<p class="src">' + esc(step.fonte) + '</p>';
    if (step.credits) {
      h += '<div class="cred"><svg class="cred-sym" viewBox="0 0 270 200" aria-hidden="true"><use href="#bsym"/></svg><div><p class="cred-k">Desenvolvido por</p><p class="cred-n">Danilo Araujo Santos</p><p class="cred-e">Infobite · produto, design e tecnologia</p></div></div>' +
        '<p class="cred-c">Contato oficial do CoraçãoBR: coracaobr.oficial@gmail.com · WhatsApp (11) 98357-3266</p>';
      h += '<div class="cta"><button class="primary" type="button" data-act="restart">Assistir de novo</button><button class="ghost" type="button" data-act="index">Ver capítulos</button></div>';
    }
    var anim = !reduced && copy.innerHTML;
    if (anim) copy.animate([{ opacity: 1 }, { opacity: 0, transform: 'translate3d(0,-6px,0)' }], { duration: ms(130), easing: 'ease-in' }).finished.then(put);
    else put();
    function put() {
      copy.innerHTML = h;
      copy.scrollTop = 0;
      if (reduced) return;
      Array.prototype.forEach.call(copy.children, function (el, i) {
        el.animate([{ opacity: 0, transform: 'translate3d(0,12px,0)' }, { opacity: 1, transform: 'none' }],
          { duration: ms(420), delay: ms(i * 45), easing: 'cubic-bezier(.16,1,.3,1)', fill: 'backwards' });
      });
      // listas animadas em cascata (cidades, diferenciais, valores)
      Array.prototype.forEach.call(copy.querySelectorAll('.cty li, .difs li, .rev li'), function (el, i) {
        el.animate([{ opacity: 0, transform: 'translate3d(0,8px,0) scale(.98)' }, { opacity: 1, transform: 'none' }],
          { duration: ms(360), delay: ms(260 + i * 38), easing: 'cubic-bezier(.16,1,.3,1)', fill: 'backwards' });
      });
    }
  }

  /* ---------- barra de progresso e índice ---------- */
  CH.forEach(function (c, ci) {
    var b = document.createElement('button');
    b.className = 'seg' + (ci && CH[ci - 1].cat !== c.cat ? ' nova' : '');
    b.type = 'button';
    b.title = (CAT[c.cat].n ? CAT[c.cat].n + '. ' : '') + CAT[c.cat].nome + ' · ' + c.name;
    b.setAttribute('aria-label', b.title);
    b.innerHTML = '<span><i></i></span>';
    b.addEventListener('click', function () { jumpChapter(ci); });
    segs.appendChild(b);
  });
  var segEls = segs.children;

  (function () {
    var g = null, h = '';
    CH.forEach(function (c, ci) {
      if (c.cat !== g) { g = c.cat; h += '<p class="index-group">' + (CAT[g].n ? '<b>' + CAT[g].n + '</b> ' : '') + esc(CAT[g].longo || CAT[g].nome) + '</p>'; }
      h += '<button class="index-item" type="button" data-ch="' + ci + '"><span class="n">' + (ci + 1) + '</span><span>' + esc(c.name) + '</span></button>';
    });
    indexList.innerHTML = h;
  })();

  function updateChrome() {
    var s = STEPS[idx];
    for (var i = 0; i < segEls.length; i++) {
      segEls[i].classList.toggle('done', i < s.ci);
      segEls[i].setAttribute('aria-current', i === s.ci ? 'step' : 'false');
      if (i !== s.ci) segEls[i].firstChild.firstChild.style.transform = i < s.ci ? '' : 'scaleX(0)';
    }
    var k = CAT[CH[s.ci].cat];
    count.textContent = k.n ? 'Categoria ' + k.n + ' de 8' : 'Abertura';
    Array.prototype.forEach.call(indexList.querySelectorAll('.index-item'), function (b) {
      b.setAttribute('aria-current', +b.dataset.ch === s.ci ? 'true' : 'false');
    });
  }
  function updateProgress() {
    var s = STEPS[idx];
    if (!s) return;
    var n = CH[s.ci].steps.length;
    var f = (s.si + Math.min(1, elapsed / ms(s.dur))) / n;
    segEls[s.ci].firstChild.firstChild.style.transform = 'scaleX(' + f.toFixed(4) + ')';
  }

  /* ---------- reprodução ---------- */
  function setPaused(p) {
    paused = p;
    btnPlay.classList.toggle('paused', p && !ended);
    btnPlay.classList.toggle('ended', ended);
    btnPlay.setAttribute('aria-label', ended ? 'Assistir de novo' : (p ? 'Continuar' : 'Pausar'));
    phone.style.animationPlayState = p ? 'paused' : '';
  }

  function go(i, mode) {
    if (i < 0 || i >= STEPS.length) return;
    var prev = STEPS[idx], step = STEPS[i];
    token++;
    var tok = token;
    idx = i; elapsed = 0; seqDone = false; ended = false;
    setPaused(paused);
    preload(i);
    var c = CH[step.ci], k = CAT[c.cat];
    if (!prev || CH[prev.ci].cat !== c.cat) { body.dataset.tone = k.tone; aud.textContent = k.n ? k.n + ' · ' + k.nome : 'Apresentação da plataforma'; }
    updateChrome();
    updateProgress();
    run(step, prev, mode, tok);
  }

  async function run(step, prev, mode, tok) {
    var seq = mode === 'next' && prev;
    showNotif(null);

    // abertura: celular de costas girando
    if (step.intro === 'back') {
      touch.classList.add('hidden');
      setZoom(null);
      await showScreen(step.src, 'instant');
      setStatus(step.s);
      renderCopy(step);
      if (reduced) phone.classList.remove('is-back', 'sway');
      else { phone.classList.add('is-back'); setTimeout(function () { if (tok === token) phone.classList.add('sway'); }, ms(1100)); }
      seqDone = true;
      return;
    }
    if (phone.classList.contains('is-back')) {
      phone.classList.remove('sway');
      void phone.offsetWidth;
      phone.classList.remove('is-back');
      renderCopy(step);
      await showScreen(step.src, 'instant');
      setStatus(step.s);
      if (!(await wait(reduced ? 150 : ms(1000), tok))) return;
      touch.classList.remove('hidden');
      moveTouch(REST);
      if (step.zoom) { await wait(ms(320), tok); setZoom(step.zoom); }
      seqDone = true;
      return;
    }

    touch.classList.remove('hidden');

    // desfaz o zoom anterior
    if (zoomed && !(step.tr === 'none' && step.zoom)) {
      setZoom(null);
      if (seq && !(await wait(reduced ? 40 : ms(360), tok))) return;
    }

    if (seq && (step.tap || step.swipe) && !reduced) {
      touch.classList.add('active');
      if (step.swipe) {
        moveTouch(step.swipe[0]);
        if (!(await wait(ms(520), tok))) return;
        press(step.swipe[0]);
        touch.style.transitionDuration = ms(480) / 1000 + 's';
        moveTouch(step.swipe[1]);
        renderCopy(step);
        setStatus(step.s);
        var pr = showScreen(step.src, step.tr);
        await wait(ms(500), tok);
        touch.style.transitionDuration = '';
        await pr;
      } else {
        moveTouch(step.tap);
        if (!(await wait(ms(520), tok))) return;
        press(step.tap);
        if (!(await wait(ms(150), tok))) return;
        renderCopy(step);
        setStatus(step.s);
        await showScreen(step.src, step.tr);
      }
      if (tok !== token) return;
      touch.classList.remove('active');
      if (!(await wait(ms(160), tok))) return;
      moveTouch(REST);
    } else {
      if (seq && step.tap && reduced) press(step.tap);
      renderCopy(step);
      setStatus(step.s);
      var type = step.tr;
      if (mode === 'prev') type = 'back';
      else if (mode === 'jump') type = 'fade';
      await showScreen(step.src, type);
      if (tok !== token) return;
      moveTouch(REST);
    }

    if (step.notif) {
      if (!(await wait(ms(420), tok))) return;
      showNotif(step.notif);
    }

    if (step.spin && !reduced) {
      if (!(await wait(ms(200), tok))) return;
      phone.animate([
        { transform: 'rotateY(0deg)' },
        { transform: 'rotateY(180deg) rotateX(4deg)', offset: .45 },
        { transform: 'rotateY(360deg)' }
      ], { duration: ms(2400), easing: 'cubic-bezier(.62,0,.18,1)' });
    }

    if (step.zoom) {
      if (!(await wait(step.tr === 'none' ? ms(200) : ms(380), tok))) return;
      setZoom(step.zoom);
    }
    seqDone = true;
  }

  function next() { if (idx < STEPS.length - 1) go(idx + 1, 'next'); }
  function prev() { if (idx > 0) go(idx - 1, 'prev'); }
  function jumpChapter(ci) {
    if (ci === 0) return restart();
    var i = STEPS.findIndex(function (s) { return s.ci === ci; });
    phone.classList.remove('is-back', 'sway');
    go(i, 'jump');
  }
  function restart() {
    phone.classList.remove('is-back', 'sway');
    paused = false;
    go(0, 'jump');
  }

  function loop(now) {
    var dt = Math.min(100, now - last);
    last = now;
    if (idx >= 0 && !paused && !overlayOpen) {
      var s = STEPS[idx];
      elapsed += dt;
      if (elapsed >= ms(s.dur) && seqDone) {
        if (idx < STEPS.length - 1) next();
        else if (!ended) { elapsed = ms(s.dur); ended = true; setPaused(true); }
      }
      updateProgress();
    }
    requestAnimationFrame(loop);
  }

  /* ---------- eventos ---------- */
  btnPlay.addEventListener('click', function () { if (ended) return restart(); setPaused(!paused); });
  btnNext.addEventListener('click', next);
  btnPrev.addEventListener('click', prev);
  $('brandHome').addEventListener('click', function (e) { e.preventDefault(); restart(); });

  copy.addEventListener('click', function (e) {
    var b = e.target.closest('[data-act]');
    if (!b) return;
    if (b.dataset.act === 'restart') restart();
    if (b.dataset.act === 'index') openIndex();
  });

  var lastFocus = null;
  function openIndex() {
    lastFocus = document.activeElement;
    indexEl.hidden = false;
    overlayOpen = true;
    btnIndex.setAttribute('aria-expanded', 'true');
    var cur = indexList.querySelector('[aria-current="true"]') || indexList.querySelector('button');
    if (cur) cur.focus();
  }
  function closeIndex() {
    indexEl.hidden = true;
    overlayOpen = false;
    btnIndex.setAttribute('aria-expanded', 'false');
    if (lastFocus && lastFocus.focus) lastFocus.focus();
  }
  btnIndex.addEventListener('click', openIndex);
  indexEl.addEventListener('click', function (e) {
    if (e.target.closest('[data-close]')) return closeIndex();
    var cb = e.target.closest('[data-cor]');
    if (cb) return corPhone(cb.dataset.cor);
    var it = e.target.closest('.index-item');
    if (it) { closeIndex(); jumpChapter(+it.dataset.ch); }
  });

  document.addEventListener('keydown', function (e) {
    if (e.altKey || e.ctrlKey || e.metaKey) return;
    if (overlayOpen) {
      if (e.key === 'Escape') { e.preventDefault(); closeIndex(); }
      if (e.key === 'Tab') {
        var f = indexEl.querySelectorAll('button');
        var first = f[0], lastB = f[f.length - 1];
        if (e.shiftKey && document.activeElement === first) { e.preventDefault(); lastB.focus(); }
        else if (!e.shiftKey && document.activeElement === lastB) { e.preventDefault(); first.focus(); }
      }
      return;
    }
    if (e.key === 'ArrowRight' || e.key === 'PageDown') { e.preventDefault(); next(); }
    else if (e.key === 'ArrowLeft' || e.key === 'PageUp') { e.preventDefault(); prev(); }
    else if (e.key === ' ' || e.key === 'Spacebar') {
      e.preventDefault();
      if (document.activeElement === btnPlay) return;
      if (ended) restart(); else setPaused(!paused);
    } else if (/^[1-8]$/.test(e.key)) {
      var ci = CH.findIndex(function (c) { return String(CAT[c.cat].n) === e.key; });
      if (ci >= 0) jumpChapter(ci);
    }
  });

  // deslizar no palco (celular)
  var sx = null, sy = null;
  var stage = $('stage');
  stage.addEventListener('touchstart', function (e) { sx = e.touches[0].clientX; sy = e.touches[0].clientY; }, { passive: true });
  stage.addEventListener('touchend', function (e) {
    if (sx === null) return;
    var dx = e.changedTouches[0].clientX - sx, dy = e.changedTouches[0].clientY - sy;
    sx = null;
    if (Math.abs(dx) > 60 && Math.abs(dx) > Math.abs(dy) * 1.4) { if (dx < 0) next(); else prev(); }
  }, { passive: true });

  // pausa quando a aba fica oculta
  var hiddenPaused = false;
  document.addEventListener('visibilitychange', function () {
    if (document.hidden && !paused) { hiddenPaused = true; setPaused(true); }
    else if (!document.hidden && hiddenPaused) { hiddenPaused = false; setPaused(false); }
  });

  /* ---------- início ---------- */
  btnIndex.setAttribute('aria-expanded', 'false');
  go(0, 'jump');
  requestAnimationFrame(function (t) { last = t; loop(t); });

  // gancho de teste
  window.__apresentacao = { go: go, steps: STEPS.length, chapters: CH.length, lista: STEPS.map(function (s) { return s.s; }), state: function () { return { idx: idx, ci: STEPS[idx].ci, cat: CH[STEPS[idx].ci].cat, paused: paused, ended: ended }; } };
})();
