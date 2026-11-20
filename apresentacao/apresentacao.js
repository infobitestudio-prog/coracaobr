/* CoraçãoBR — apresentação animada (JS puro) */
(function () {
  'use strict';

  /* ---------- telas ---------- */
  var T = {
    cidade: '01-cidade', inicio: '02-inicio', menu: '03-inicio-menu', explorar: '04-explorar',
    filtros: '05-filtros', ficha: '06-ficha', mapa: '07-mapa', metro: '08-metro',
    assistente: '09-assistente', clube: '10-clube', pets: '11-pets', perguntas: '12-perguntas',
    chegada: '13-chegada', alertas: '14-alertas', conta: '15-conta', anuncie: '16-anuncie',
    pagar: '17-pagar', mural: '18-mural', austin: '19-austin', austinFicha: '20-austin-ficha',
    sanantonio: '21-sanantonio', receita: '22-master-receita', novidades: '23-master-novidades',
    escuro: '24-escuro'
  };
  // cor da barra de status por tela
  var SB = {
    '01-cidade': ['#0d1313', '#fff'], '02-inicio': ['#161b1e', '#fff'], '03-inicio-menu': ['#e7e9e6', '#0E1311'],
    '06-ficha': ['#6f7470', '#fff'], '07-mapa': ['#cfd3d1', '#0E1311'], '15-conta': ['#eeeeee', '#0E1311'],
    '19-austin': ['#2a2c2a', '#fff'], '20-austin-ficha': ['#141915', '#fff'], '24-escuro': ['#161b1e', '#fff']
  };
  // pontos de toque comuns (em % da tela do app)
  var NAV = { inicio: [22.5, 94.8], explorar: [37.5, 94.8], mapa: [51, 94.8], conta: [64.5, 94.8], menu: [78, 94.8] };

  /* ---------- roteiro ----------
     cada passo: s (tela), tr (transição), tap (toque na tela anterior), swipe, zoom [x, y, escala],
     t (título), p (texto), facts, chips, extra */
  var CH = [
    {
      id: 'abertura', name: 'Abertura', tone: 'green', aud: 'Apresentação do produto', group: 'Visão geral',
      steps: [
        { s: T.inicio, intro: 'back', dur: 5200, logo: true,
          t: 'O guia do brasileiro no Texas.',
          p: 'Como o CoraçãoBR funciona para quem mora, para quem anuncia e para quem administra. Tudo dentro de um celular.' },
        { s: T.inicio, intro: 'front', dur: 7200,
          t: 'Tudo em português, na palma da mão.',
          p: 'Lugares com fotos de licença livre e crédito, eventos, serviços e comunidade. Funciona como app no celular, pode ser instalado e tem tema claro e escuro.',
          facts: [['700+', 'lugares no guia'], ['4', 'cidades: Dallas–Fort Worth, Houston, Austin e San Antonio'], ['3', 'idiomas: português, inglês e espanhol']] }
      ]
    },
    {
      id: 'oportunidade', name: 'A oportunidade', tone: 'green', aud: 'Visão geral', group: 'Visão geral',
      steps: [
        { s: T.inicio, tr: 'none', dur: 6800,
          t: 'Quem chega ao Texas procura tudo em português.',
          p: 'Onde comer, onde morar, como tirar documento, quem fala a nossa língua. A resposta costuma estar espalhada em grupos, posts e sites em inglês. O CoraçãoBR junta tudo num lugar só.' },
        { s: T.menu, tr: 'scroll', swipe: [[50, 80], [50, 34]], dur: 7400, zoom: [50, 20, 1.4],
          t: 'Um guia vivo, que abre com o que importa hoje.',
          p: 'Logo na tela inicial: hora local, dólar do dia, eventos dos próximos 7 dias, passeios de graça, negócios de brasileiros e atalhos para todas as seções.',
          chips: ['Agora em Dallas', 'Dólar hoje', 'Eventos', 'De graça', 'Brasileiros', 'Metrô', 'Pets', 'Clube'] }
      ]
    },
    {
      id: 'cidade', name: 'Escolha da cidade', tone: 'green', aud: 'Para quem mora e visita', group: 'Para quem mora e visita',
      steps: [
        { s: T.cidade, tr: 'sheet', tap: [86, 4.2], dur: 7000, zoom: [50, 80, 1.32],
          t: 'Na primeira visita, a pessoa escolhe a cidade.',
          p: 'Dallas–Fort Worth, Houston, Austin e San Antonio, cada uma com seus lugares, eventos e igrejas. A escolha fica lembrada e pode ser trocada no topo a qualquer momento.' },
        { s: T.inicio, tr: 'fade', tap: [50, 61.8], dur: 6600, zoom: [30, 60, 1.43],
          t: 'Ou deixa o guia descobrir onde ela está.',
          p: 'Com “Usar minha localização”, a tela inicial já abre na região certa e mostra primeiro os lugares mais perto de você.' }
      ]
    },
    {
      id: 'explorar', name: 'Explorar e filtros', tone: 'green', aud: 'Para quem mora e visita', group: 'Para quem mora e visita',
      steps: [
        { s: T.explorar, tr: 'push', tap: NAV.explorar, dur: 7000, zoom: [50, 31, 1.36],
          t: 'Explorar: o guia completo, organizado por tipo.',
          p: 'Passeios, de graça, comer, brasileiros, serviços, eventos e compras. Busca por nome, bairro ou tipo, com preço e distância em cada cartão.' },
        { s: T.filtros, tr: 'sheet', tap: [26, 44.2], dur: 7400, zoom: [62, 32, 1.65],
          t: 'Filtros pensados para quem acabou de chegar.',
          p: 'Um toque mostra só o que está aberto agora, onde se fala português ou o que é de graça. Dá para ordenar por melhor nota e escolher a região.',
          chips: ['Aberto agora', 'Fala português', 'Gratuitos', 'Pagos', 'Melhor nota', 'Região'] }
      ]
    },
    {
      id: 'ficha', name: 'A ficha do lugar', tone: 'green', aud: 'Para quem mora e visita', group: 'Para quem mora e visita',
      steps: [
        { s: T.ficha, tr: 'push', tap: [73, 64], dur: 7000, zoom: [50, 50, 1.4],
          t: 'Cada lugar tem uma ficha completa.',
          p: 'Fotos com zoom e crédito, horário (aberto ou fechado agora), selo de quem fala português, faixa de preço, como chegar, cardápio e avaliações reais.',
          chips: ['Sobre', 'Como ir', 'Cardápio', 'Avaliações'] },
        { s: T.ficha, tr: 'none', dur: 6800, zoom: [50, 64, 1.47],
          t: 'Curtir, checklist e Meu roteiro.',
          p: 'A pessoa salva favoritos, marca o que quer visitar e monta o próprio roteiro. Ligar, abrir o site, enviar para alguém e “Como chegar” ficam a um toque.' }
      ]
    },
    {
      id: 'mapa', name: 'Mapa e metrô', tone: 'green', aud: 'Para quem mora e visita', group: 'Para quem mora e visita',
      steps: [
        { s: T.mapa, tr: 'back', tap: [7.5, 13.8], dur: 7000, zoom: [42, 14, 1.43],
          t: 'O mapa mostra o que existe à sua volta.',
          p: 'Os lugares aparecem agrupados por região e, embaixo, a lista do que está na área visível. A legenda separa anunciantes, passeios grátis e o que está acontecendo agora.' },
        { s: T.metro, tr: 'push', tap: NAV.menu, dur: 7000, zoom: [50, 56, 1.43],
          t: 'Metrô e trens de Dallas–Fort Worth sem complicação.',
          p: 'As linhas e estações do DART no mapa, com rota entre estações e o modo “Estou no trem”.',
          facts: [['8', 'linhas'], ['90', 'estações']] }
      ]
    },
    {
      id: 'assistente', name: 'Assistente com IA', tone: 'green', aud: 'Para quem mora e visita', group: 'Para quem mora e visita',
      steps: [
        { s: T.assistente, tr: 'sheet', tap: NAV.menu, dur: 7400, zoom: [50, 55, 1.32],
          t: 'Pergunte ao CoraçãoBR.',
          p: 'A pessoa escreve do seu jeito: onde comer, o que fazer no fim de semana, quem fala português. A IA (Claude, da Anthropic) responde com lugares que estão no guia.' },
        { s: T.assistente, tr: 'none', dur: 6600, zoom: [50, 89, 1.65],
          t: 'E ajuda a planejar o passeio.',
          p: 'Além dos roteiros prontos, a IA monta um roteiro sob medida. O que a pessoa curte vai para o Meu roteiro, com checklist.' }
      ]
    },
    {
      id: 'comunidade', name: 'Comunidade', tone: 'green', aud: 'Para quem mora e visita', group: 'Para quem mora e visita',
      steps: [
        { s: T.mural, tr: 'push', tap: NAV.menu, dur: 6800, zoom: [50, 28, 1.43],
          t: 'Mural: vagas, aluguel e classificados.',
          p: 'Vagas de emprego, aluguel de quarto, carona para o aeroporto, compra e venda. Cada publicação fica 30 dias no ar.' },
        { s: T.pets, tr: 'push', tap: NAV.menu, dur: 7000, zoom: [50, 37, 1.5],
          t: 'Pets perdidos e achados.',
          p: 'Publicar é de graça e a comunidade ajuda a espalhar. Com a plaquinha QR-DOG, quem encontra o bichinho aponta a câmera e fala com o dono na hora, sem aplicativo.' },
        { s: T.perguntas, tr: 'push', tap: NAV.menu, dur: 6600, zoom: [50, 38, 1.43],
          t: 'Perguntas e respostas da comunidade.',
          p: 'Dúvidas de quem chegou, respondidas por quem já passou por isso.',
          chips: ['Documentos e imigração', 'Moradia', 'Trabalho'] }
      ]
    },
    {
      id: 'clube', name: 'Clube CoraçãoBR', tone: 'green', aud: 'Para quem mora e visita', group: 'Para quem mora e visita',
      steps: [
        { s: T.clube, tr: 'push', tap: NAV.menu, dur: 7600, zoom: [55, 38, 1.43],
          t: 'Clube CoraçãoBR: a carteirinha da comunidade.',
          p: 'Carteirinha digital com QR, validada na hora no caixa do parceiro. Descontos nos negócios do guia e avisos de eventos e cupons antes de todo mundo.',
          facts: [['R$ 15', 'por mês, cancela quando quiser'], ['QR', 'conferido na hora pelo atendente']] }
      ]
    },
    {
      id: 'alertas', name: 'Alertas e chegada', tone: 'green', aud: 'Para quem mora e visita', group: 'Para quem mora e visita',
      steps: [
        { s: T.alertas, tr: 'push', tap: NAV.menu, dur: 7000, zoom: [50, 28, 1.4],
          t: 'Eventos do seu jeito, avisados no celular.',
          p: 'A pessoa escolhe os temas que curte e recebe aviso de evento novo no site e notificação na tela do celular.',
          chips: ['Rodeio e sertanejo', 'Shows brasileiros', 'Futebol', 'Igreja em português', 'Festas brasileiras', 'Para crianças', 'Eventos grátis'] },
        { s: T.chegada, tr: 'push', tap: NAV.menu, dur: 7200, zoom: [50, 44, 1.36],
          t: 'Os primeiros 30 dias, passo a passo.',
          p: 'Celular e internet, endereço e moradia, Social Security ou ITIN, conta no banco. A pessoa marca o que já resolveu e o progresso fica salvo na conta.',
          facts: [['30', 'dias de roteiro de chegada'], ['10', 'passos com explicação']] },
        { s: T.conta, tr: 'push', tap: NAV.conta, dur: 6600, zoom: [50, 46, 1.32],
          t: 'Minha conta guarda tudo.',
          p: 'Roteiro, lugares salvos, eventos com lembrete e avaliações, em qualquer aparelho. E toda semana sai uma newsletter automática com as novidades.' }
      ]
    },
    {
      id: 'cidades', name: 'Várias cidades', tone: 'green', aud: 'Para quem mora e visita', group: 'Para quem mora e visita',
      steps: [
        { s: T.austin, tr: 'fade', tap: [56, 4.2], dur: 6800, zoom: [50, 74, 1.36],
          t: 'Uma marca, várias cidades.',
          p: 'Cada cidade tem sua tela inicial, com hora, dólar, eventos e passeios grátis de lá. Austin e San Antonio já estão no ar ao lado de Dallas–Fort Worth.' },
        { s: T.austinFicha, tr: 'sheet', tap: [70, 32], dur: 6600, zoom: [50, 50, 1.36],
          t: 'Austin: Capitólio do Texas.',
          p: 'História, fotos com crédito, entrada livre e “Como chegar”. A mesma ficha completa, em qualquer cidade.' },
        { s: T.sanantonio, tr: 'push', tap: [8, 14], dur: 6600, zoom: [50, 60, 1.36],
          t: 'San Antonio no Explorar.',
          p: 'Catedral de San Fernando, Fiesta San Antonio e muito mais, já separados entre grátis e pago.' },
        { s: T.escuro, tr: 'fade', tap: [68, 4.2], dur: 6400,
          t: 'Três idiomas e tema escuro.',
          p: 'Português, inglês e espanhol com um toque nas bandeiras. O tema escuro deixa a leitura confortável à noite.',
          facts: [['PT', 'português'], ['EN', 'inglês'], ['ES', 'espanhol']] }
      ]
    },
    {
      id: 'empresas', name: 'Para empresas', tone: 'ink', aud: 'Para empresas e anunciantes', group: 'Para empresas',
      steps: [
        { s: T.anuncie, tr: 'push', tap: [22, 40.9], dur: 7400, zoom: [50, 52, 1.43],
          t: 'O negócio na frente de quem fala português.',
          p: 'Restaurante, mercado, salão, handyman, babá: o anúncio fica pronto em minutos e entra no guia que os brasileiros usam para decidir.',
          facts: [['R$ 50', 'por mês'], ['3', 'anúncios por pacote, e os pacotes somam'], ['20', 'fotos por anúncio']] },
        { s: T.anuncie, tr: 'none', dur: 7000, zoom: [50, 80, 1.36],
          t: 'O que vem em cada anúncio.',
          p: 'Ficha completa com fotos, banner no carrossel e contato direto. O anunciante aparece no mapa, no feed e no Mural.',
          chips: ['Até 20 fotos', 'Banner no carrossel', 'WhatsApp e redes', 'Pin verde no mapa', 'Topo das buscas', 'Feed e Mural'] },
        { s: T.pagar, tr: 'push', tap: [25, 41.6], dur: 7600, zoom: [50, 55, 1.43],
          t: 'Contrata e paga por Pix.',
          p: 'Escolhe quantos pacotes quer e paga por Pix pelo Mercado Pago. A confirmação é automática, e o sistema avisa por e-mail antes de vencer.',
          facts: [['3, 2, 1', 'dias antes do vencimento, um e-mail de aviso'], ['Pix', 'confirmado automaticamente']] },
        { s: T.ficha, tr: 'back', tap: [16, 11.6], dur: 8000, zoom: [50, 70, 1.36],
          t: 'Extras que ajudam a vender mais.',
          p: 'Selo, impulso e destaque são avulsos. O painel do anunciante mostra estatísticas e manda relatório mensal.',
          chips: [['Selo Verificado', 'R$ 30'], ['Impulsionar 7 dias', 'R$ 25'], ['Destaque no Mural', 'R$ 10'], 'Desconto para membros do Clube', 'Cupom com QR', 'QR “Avalie-nos”', 'Pedido e agendamento pelo anúncio', 'Estatísticas e relatório mensal', ['Indique e ganhe', '50% off']] }
      ]
    },
    {
      id: 'admin', name: 'Para a administração', tone: 'paper', aud: 'Para a administração e investidores', group: 'Para a administração',
      steps: [
        { s: T.receita, tr: 'fade', dur: 7400, zoom: [50, 62, 1.36],
          t: 'Painel master: o negócio num relance.',
          p: 'Receita por mês, anunciantes no ar, vencimentos dos próximos 7 dias e membros do Clube. Pagamentos, contas, lugares e avaliações no mesmo painel.',
          chips: ['Receita', 'Pagamentos', 'Contas', 'Lugares', 'Avaliações', 'Newsletter'] },
        { s: T.novidades, tr: 'push', tap: [92, 21.8], dur: 7600, zoom: [50, 40, 1.36],
          t: 'IA, notificações e patrocínio, tudo pelo painel.',
          p: 'A administração liga a chave da IA, envia notificações para os celulares inscritos, vende patrocínio de cada seção do Explorar e coloca patrocinadores oficiais em destaque.' },
        { s: T.menu, tr: 'fade', tap: [50, 94.8], dur: 7800, zoom: [76, 9, 1.65],
          t: 'O guia se atualiza sozinho, todo dia às 5h.',
          p: 'Dólar, eventos vencidos, metrô, fotos e notas. Gera páginas para o Google por categoria e cidade, com sitemap. Roda em servidor próprio (Hostinger), com senhas protegidas e permissões checadas no servidor.',
          facts: [['5h', 'atualização diária automática'], ['SEO', 'páginas por categoria e cidade + sitemap']] }
      ]
    },
    {
      id: 'receita', name: 'Modelo de receita', tone: 'paper', aud: 'Para a administração e investidores', group: 'Para a administração',
      steps: [
        { s: T.receita, tr: 'fade', dur: 9800,
          t: 'Sete fontes de receita para o mesmo público.',
          p: 'Receita recorrente de anunciantes e membros, extras avulsos e patrocínio.',
          rev: true }
      ]
    },
    {
      id: 'fim', name: 'Encerramento', tone: 'green', aud: 'CoraçãoBR', group: 'Encerramento',
      steps: [
        { s: T.inicio, tr: 'fade', spin: true, dur: 9000, end: true,
          t: 'O Texas em português, num toque.',
          p: 'Um produto pronto, que se atualiza sozinho e cresce cidade a cidade.' }
      ]
    }
  ];

  var REV = [
    ['Pacotes de anúncios', 'R$ 50', '/mês', '3 anúncios por pacote; os pacotes somam'],
    ['Selo Verificado', 'R$ 30', '', 'selo no anúncio'],
    ['Impulsionar', 'R$ 25', '', 'impulso de 7 dias'],
    ['Destaque no Mural', 'R$ 10', '', 'publicação em evidência'],
    ['Clube CoraçãoBR', 'R$ 15', '/mês', 'por membro'],
    ['Patrocínio de seção', 'Seções do Explorar', '', 'cada seção pode ter patrocinador', true],
    ['Patrocinadores oficiais', 'Em destaque', '', 'marcas parceiras com destaque no guia', true]
  ];

  /* ---------- lista linear de passos ---------- */
  var STEPS = [];
  CH.forEach(function (c, ci) {
    c.steps.forEach(function (s, si) {
      s.ci = ci; s.si = si; s.src = 'telas/' + s.s + '.jpg';
      STEPS.push(s);
    });
  });

  /* ---------- elementos ---------- */
  var $ = function (id) { return document.getElementById(id); };
  var body = document.body;
  var phone = $('phone'), zoomer = $('zoomer'), viewport = $('viewport'), touch = $('touch');
  var sbar = $('sbar'), copy = $('copy'), segs = $('segs'), count = $('count'), aud = $('aud');
  var btnPlay = $('btnPlay'), btnPrev = $('btnPrev'), btnNext = $('btnNext');
  var indexEl = $('index'), indexList = $('indexList'), btnIndex = $('btnIndex');
  var layers = [$('layerA'), $('layerB')], curLayer = 0;

  var mq = window.matchMedia('(prefers-reduced-motion: reduce)');
  var reduced = mq.matches;
  if (mq.addEventListener) mq.addEventListener('change', function (e) { reduced = e.matches; });

  /* espessura do celular */
  (function () {
    var sl = $('slices');
    for (var z = -4.2; z <= 4.21; z += 0.7) {
      var i = document.createElement('i');
      i.style.transform = 'translateZ(' + z.toFixed(2) + 'em)';
      sl.appendChild(i);
    }
  })();

  /* pré-carregamento */
  var cache = {};
  function load(src) {
    if (!cache[src]) {
      var im = new Image();
      im.src = src;
      cache[src] = (im.decode ? im.decode() : Promise.resolve()).catch(function () {});
    }
    return cache[src];
  }
  STEPS.forEach(function (s, i) { if (i < 4) load(s.src); });
  window.addEventListener('load', function () { STEPS.forEach(function (s) { load(s.src); }); });

  /* ---------- estado ---------- */
  var idx = -1, token = 0, paused = false, ended = false, elapsed = 0, seqDone = false;
  var zoomed = false, last = performance.now(), overlayOpen = false;
  var REST = [88, 70];

  /* espera que respeita a pausa e o cancelamento */
  function wait(ms, tok) {
    return new Promise(function (res) {
      var left = ms, t0 = performance.now();
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

  /* ---------- celular: barra de status, toque, zoom, transições ---------- */
  function setStatus(name) {
    var c = SB[name] || ['#f2f4f3', '#0E1311'];
    sbar.style.setProperty('--sb-bg', c[0]);
    sbar.style.setProperty('--sb-fg', c[1]);
  }

  function moveTouch(p) {
    touch.style.left = p[0] + '%';
    touch.style.top = p[1] + '%';
  }

  function press(p) {
    touch.classList.add('press');
    var r = document.createElement('span');
    r.className = 'ripple';
    r.style.left = p[0] + '%';
    r.style.top = p[1] + '%';
    viewport.appendChild(r);
    setTimeout(function () { r.remove(); }, 800);
    setTimeout(function () { touch.classList.remove('press'); }, 220);
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
      var D = type === 'fade' ? 420 : 640;
      var ease = 'cubic-bezier(.62,0,.18,1)';
      var a1, a2, kn, kc, zN = 2, zC = 1;
      if (type === 'push') {
        kn = [{ transform: 'translateX(100%)' }, { transform: 'translateX(0)' }];
        kc = [{ transform: 'translateX(0)', filter: 'brightness(1)' }, { transform: 'translateX(-30%)', filter: 'brightness(.7)' }];
      } else if (type === 'back') {
        zN = 1; zC = 2;
        kn = [{ transform: 'translateX(-30%)', filter: 'brightness(.7)' }, { transform: 'translateX(0)', filter: 'brightness(1)' }];
        kc = [{ transform: 'translateX(0)' }, { transform: 'translateX(100%)' }];
      } else if (type === 'scroll') {
        D = 760;
        kn = [{ transform: 'translateY(100%)' }, { transform: 'translateY(0)' }];
        kc = [{ transform: 'translateY(0)' }, { transform: 'translateY(-100%)' }];
      } else if (type === 'sheet') {
        kn = [{ transform: 'translateY(100%)', borderRadius: '8% 8% 0 0' }, { transform: 'translateY(0)', borderRadius: '0' }];
        kc = [{ transform: 'scale(1)', filter: 'brightness(1)' }, { transform: 'scale(.93)', filter: 'brightness(.6)' }];
      } else { // fade
        kn = [{ opacity: 0 }, { opacity: 1 }];
        kc = [{ opacity: 1 }, { opacity: 1 }];
      }
      nxt.style.zIndex = zN; cur.style.zIndex = zC;
      nxt.classList.add('on');
      a1 = nxt.animate(kn, { duration: D, easing: ease, fill: 'both' });
      a2 = cur.animate(kc, { duration: D, easing: ease, fill: 'both' });
      return a1.finished.catch(function () {}).then(function () {
        cur.classList.remove('on');
        cur.style.zIndex = ''; nxt.style.zIndex = '';
        a1.cancel(); a2.cancel();
        curLayer = 1 - curLayer;
      });
    });
  }

  /* ---------- texto ---------- */
  function esc(s) { return String(s).replace(/[&<>"]/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]; }); }

  function renderCopy(step) {
    var c = CH[step.ci];
    var h = '';
    if (step.logo) {
      h += '<div class="logo-big"><svg viewBox="0 0 270 200" aria-hidden="true"><use href="#bsym"/></svg><span>Coração<b>BR</b></span></div>';
    } else {
      h += '<p class="kicker"><span class="kn">' + String(step.ci + 1).padStart(2, '0') + '</span><span>' + esc(c.name) + '</span></p>';
    }
    h += '<h1 class="title">' + esc(step.t) + '</h1>';
    h += '<p class="lede">' + esc(step.p) + '</p>';
    if (step.facts) {
      h += '<dl class="facts">' + step.facts.map(function (f) {
        return '<div><dt>' + esc(f[0]) + '</dt><dd>' + esc(f[1]) + '</dd></div>';
      }).join('') + '</dl>';
    }
    if (step.chips) {
      h += '<ul class="chips">' + step.chips.map(function (x) {
        return Array.isArray(x) ? '<li>' + esc(x[0]) + '<b>' + esc(x[1]) + '</b></li>' : '<li>' + esc(x) + '</li>';
      }).join('') + '</ul>';
    }
    if (step.rev) {
      h += '<ul class="rev">' + REV.map(function (r) {
        return '<li><span class="rv-n">' + esc(r[0]) + '</span><span class="rv-p' + (r[4] ? ' word' : '') + '">' + esc(r[1]) +
          (r[2] ? '<small>' + esc(r[2]) + '</small>' : '') + '</span><span class="rv-d">' + esc(r[3]) + '</span></li>';
      }).join('') + '</ul>';
    }
    if (step.end) {
      h += '<ul class="aud-list">' +
        '<li><b>Quem chega</b><span>encontra o caminho, em português, desde o primeiro dia.</span></li>' +
        '<li><b>Quem anuncia</b><span>aparece para a comunidade brasileira a partir de R$ 50 por mês.</span></li>' +
        '<li><b>Quem investe</b><span>encontra sete fontes de receita numa plataforma que já funciona.</span></li>' +
        '</ul>';
      h += '<div class="cta"><button class="primary" type="button" data-act="restart">Assistir de novo</button>' +
        '<button class="ghost" type="button" data-act="index">Ver capítulos</button></div>';
    }
    var anim = !reduced && copy.innerHTML;
    if (anim) {
      copy.animate([{ opacity: 1 }, { opacity: 0, transform: 'translateY(-6px)' }], { duration: 160, easing: 'ease-in' })
        .finished.then(function () { put(); });
    } else put();
    function put() {
      copy.innerHTML = h;
      copy.scrollTop = 0;
      if (!reduced) {
        Array.prototype.forEach.call(copy.children, function (el, i) {
          el.animate([{ opacity: 0, transform: 'translateY(14px)' }, { opacity: 1, transform: 'none' }],
            { duration: 560, delay: i * 70, easing: 'cubic-bezier(.16,1,.3,1)', fill: 'backwards' });
        });
      }
    }
  }

  /* ---------- barra de progresso e índice ---------- */
  CH.forEach(function (c, ci) {
    var b = document.createElement('button');
    b.className = 'seg';
    b.type = 'button';
    b.title = (ci + 1) + '. ' + c.name;
    b.setAttribute('aria-label', 'Capítulo ' + (ci + 1) + ': ' + c.name);
    b.innerHTML = '<span><i></i></span>';
    b.addEventListener('click', function () { jumpChapter(ci); });
    segs.appendChild(b);
  });
  var segEls = segs.children;

  (function () {
    var g = null, h = '';
    CH.forEach(function (c, ci) {
      if (c.group !== g) { g = c.group; h += '<p class="index-group">' + esc(g) + '</p>'; }
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
    count.textContent = 'Capítulo ' + (s.ci + 1) + ' de ' + CH.length;
    Array.prototype.forEach.call(indexList.querySelectorAll('.index-item'), function (b) {
      b.setAttribute('aria-current', +b.dataset.ch === s.ci ? 'true' : 'false');
    });
  }

  function updateProgress() {
    var s = STEPS[idx];
    if (!s) return;
    var n = CH[s.ci].steps.length;
    var f = (s.si + Math.min(1, elapsed / s.dur)) / n;
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
    var prev = STEPS[idx];
    var step = STEPS[i];
    token++;
    var tok = token;
    idx = i;
    elapsed = 0;
    seqDone = false;
    ended = false;
    setPaused(paused);

    var chapterChanged = !prev || prev.ci !== step.ci;
    var c = CH[step.ci];
    if (chapterChanged) {
      body.dataset.tone = c.tone;
      aud.textContent = c.aud;
    }
    updateChrome();
    updateProgress();
    run(step, prev, mode, tok);
  }

  async function run(step, prev, mode, tok) {
    var seq = mode === 'next' && prev;

    // abertura: celular de costas girando
    if (step.intro === 'back') {
      touch.classList.add('hidden');
      setZoom(null);
      await showScreen(step.src, 'instant');
      setStatus(step.s);
      renderCopy(step);
      if (reduced) { phone.classList.remove('is-back', 'sway'); }
      else { phone.classList.add('is-back'); setTimeout(function () { if (tok === token) phone.classList.add('sway'); }, 1700); }
      seqDone = true;
      return;
    }
    if (phone.classList.contains('is-back')) {
      phone.classList.remove('sway');
      // fixa a posição atual antes de girar para a frente
      void phone.offsetWidth;
      phone.classList.remove('is-back');
      renderCopy(step);
      await showScreen(step.src, 'instant');
      setStatus(step.s);
      if (!(await wait(reduced ? 200 : 1500, tok))) return;
      touch.classList.remove('hidden');
      moveTouch(REST);
      if (step.zoom) { await wait(500, tok); setZoom(step.zoom); }
      seqDone = true;
      return;
    }

    touch.classList.remove('hidden');

    // desfaz o zoom anterior
    if (zoomed && !(step.tr === 'none' && step.zoom)) {
      setZoom(null);
      if (seq && !(await wait(reduced ? 50 : 600, tok))) return;
    }

    if (seq && (step.tap || step.swipe) && !reduced) {
      touch.classList.add('active');
      if (step.swipe) {
        moveTouch(step.swipe[0]);
        if (!(await wait(820, tok))) return;
        press(step.swipe[0]);
        touch.style.transitionDuration = '.7s';
        moveTouch(step.swipe[1]);
        renderCopy(step);
        setStatus(step.s);
        var pr = showScreen(step.src, step.tr);
        await wait(780, tok);
        touch.style.transitionDuration = '';
        await pr;
      } else {
        moveTouch(step.tap);
        if (!(await wait(820, tok))) return;
        press(step.tap);
        if (!(await wait(260, tok))) return;
        renderCopy(step);
        setStatus(step.s);
        await showScreen(step.src, step.tr);
      }
      if (tok !== token) return;
      touch.classList.remove('active');
      if (!(await wait(250, tok))) return;
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

    if (step.spin && !reduced) {
      if (!(await wait(300, tok))) return;
      phone.animate([
        { transform: 'rotateY(0deg)' },
        { transform: 'rotateY(180deg) rotateX(4deg)', offset: .45 },
        { transform: 'rotateY(360deg)' }
      ], { duration: 3200, easing: 'cubic-bezier(.62,0,.18,1)' });
    }

    if (step.zoom) {
      if (!(await wait(step.tr === 'none' ? 300 : 650, tok))) return;
      setZoom(step.zoom);
    }
    seqDone = true;
  }

  function next() {
    if (idx < STEPS.length - 1) go(idx + 1, 'next');
  }
  function prev() {
    if (idx > 0) go(idx - 1, 'prev');
  }
  function jumpChapter(ci) {
    var i = STEPS.findIndex(function (s) { return s.ci === ci; });
    if (ci === 0) return restart();
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
      if (elapsed >= s.dur && seqDone) {
        if (idx < STEPS.length - 1) next();
        else if (!ended) { elapsed = s.dur; ended = true; setPaused(true); }
      }
      updateProgress();
    }
    requestAnimationFrame(loop);
  }

  /* ---------- eventos ---------- */
  btnPlay.addEventListener('click', function () {
    if (ended) return restart();
    setPaused(!paused);
  });
  btnNext.addEventListener('click', function () { if (idx < STEPS.length - 1) next(); });
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
    var it = e.target.closest('.index-item');
    if (it) { closeIndex(); jumpChapter(+it.dataset.ch); }
  });

  document.addEventListener('keydown', function (e) {
    if (e.altKey || e.ctrlKey || e.metaKey) return;
    if (overlayOpen) {
      if (e.key === 'Escape') { e.preventDefault(); closeIndex(); }
      if (e.key === 'Tab') { // mantém o foco dentro do painel
        var f = indexEl.querySelectorAll('button');
        var first = f[0], lastB = f[f.length - 1];
        if (e.shiftKey && document.activeElement === first) { e.preventDefault(); lastB.focus(); }
        else if (!e.shiftKey && document.activeElement === lastB) { e.preventDefault(); first.focus(); }
      }
      return;
    }
    if (e.key === 'ArrowRight') { e.preventDefault(); if (idx < STEPS.length - 1) next(); }
    else if (e.key === 'ArrowLeft') { e.preventDefault(); prev(); }
    else if (e.key === ' ' || e.key === 'Spacebar') {
      // espaço sempre pausa/continua (Enter continua ativando o botão focado)
      e.preventDefault();
      if (document.activeElement === btnPlay) return; // o clique do botão já trata
      if (ended) restart(); else setPaused(!paused);
    }
  });

  // deslizar no palco (celular)
  var sx = null, sy = null;
  var stage = $('stage');
  stage.addEventListener('touchstart', function (e) {
    sx = e.touches[0].clientX; sy = e.touches[0].clientY;
  }, { passive: true });
  stage.addEventListener('touchend', function (e) {
    if (sx === null) return;
    var dx = e.changedTouches[0].clientX - sx, dy = e.changedTouches[0].clientY - sy;
    sx = null;
    if (Math.abs(dx) > 60 && Math.abs(dx) > Math.abs(dy) * 1.4) {
      if (dx < 0) { if (idx < STEPS.length - 1) next(); } else prev();
    }
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
  window.__apresentacao = { go: go, steps: STEPS.length, chapters: CH.length, state: function () { return { idx: idx, ci: STEPS[idx].ci, paused: paused, ended: ended }; } };
})();
