/* Painel do dono do guia: lugares, fotos, cardápio, anúncios, avaliações e configurações. Na nuvem, só quem tem permissão de edição do Artifact abre o painel e grava em lugares, anúncios e configurações (regras do banco). */
(function () {
  "use strict";
  var G = window.Guia, esc = G.esc, $ = function (s, r) { return (r || document).querySelector(s); };
  var raiz = null, aba = "resumo", busca = "", dlg = $("#dlg"), D = null, removidas = [], ocupado = false;
  var ATR = ["museu", "parque", "historico", "mirante", "bairro", "esporte", "familia", "compras", "arte", "natureza"];
  var EST = G.COMIDA.concat(["mercado-brasileiro", "mercado", "compras", "hotel", "servico", "governo", "transporte", "saude", "comunidade"], G.SERVICOS);
  ATR = ATR.concat(["evento", "show"]);
  var POS = { faixa: "Banner na página inicial e no Explorar", grade: "Card no meio do guia", lugar: "Dentro do card do lugar", popup: "Popup na página inicial" };

  function fld(id, label, val, extra) { return '<div class="field ' + ((extra && extra.cls) || "") + '"><label for="' + id + '">' + label + '</label><input id="' + id + '" value="' + esc(val == null ? "" : val) + '" ' + ((extra && extra.attr) || "") + "></div>"; }
  function area(id, label, val, cls) { return '<div class="field ' + (cls || "") + '"><label for="' + id + '">' + label + '</label><textarea id="' + id + '">' + esc(val || "") + "</textarea></div>"; }
  function sel(id, label, val, opts) { return '<div class="field"><label for="' + id + '">' + label + '</label><select id="' + id + '">' + opts.map(function (o) { return '<option value="' + esc(o[0]) + '"' + (String(o[0]) === String(val) ? " selected" : "") + ">" + esc(o[1]) + "</option>"; }).join("") + "</select></div>"; }
  function v(id) { var e = $("#" + id, dlg) || $("#" + id); return e ? e.value.trim() : ""; }
  function num(id) { var x = v(id).replace(",", "."); return x === "" || isNaN(Number(x)) ? null : Number(x); }
  function falha(e) { ocupado = false; G.toast(e && e.message && !e.code ? e.message : "Não foi possível salvar. Confira se você tem permissão de edição."); }

  /* ---------- painel master: menu lateral em grupos, cada seção em cards ---------- */
  function aviso(t) { return Store.lista("avisos").filter(function (a) { return a.tipo === t && !a.confirmado && !a.recusado && !a.lido; }).length; }
  function pixPend() { return window.Pag && Pag.informados ? Pag.informados().length : 0; }
  function menuMaster() {
    var srv = Store.servidor && Store.servidor(), R = window.PainelRecursos ? PainelRecursos.abas.map(function (a) { return a[0]; }) : [];
    var m = [
      { id: "resumo", nome: "Visão geral", ic: "home", titulo: "Painel master", sub: "Tudo do CoraçãoBR num lugar só: dinheiro, pessoas, conteúdo e aparência do site." },
      { id: "pagamentos", nome: "Pagamentos e Pix", ic: "pix", grupo: "Dinheiro", n: pixPend() || "", sub: "Confirme Pix, dê cortesia, suspenda e acompanhe o plano de cada conta." },
      { id: "receita", nome: "Receita", ic: "chart", grupo: "Dinheiro", sub: "Quanto entrou, de onde veio e a evolução mês a mês." },
      { id: "financas", nome: "Valores e preços", ic: "money", grupo: "Dinheiro", sub: "Preço do pacote, anúncios por pacote, Clube, Mural e chave Pix." },
      { id: "usuarios", nome: "Contas", ic: "users", grupo: "Pessoas", sub: "Todas as contas, com CEP, região e plano. Abra a área de qualquer conta com acesso total." },
      { id: "anunciantes", nome: "Anunciantes", ic: "store", grupo: "Pessoas", sub: "Empresas com anúncio, métricas e acesso ao painel de cada uma." },
      { id: "avisos", nome: "Avisos", ic: "bell", grupo: "Pessoas", n: naoLidos() || "", sub: "Cadastros, pagamentos e denúncias, na hora em que acontecem." },
      { id: "comunidade", nome: "Comunidade", ic: "chat", grupo: "Pessoas" },
      { id: "lugares", nome: "Lugares", ic: "pin", grupo: "Conteúdo", n: Store.lista("lugares").length, sub: "Lugares e eventos das 4 cidades: fotos, notas, cardápio e status." },
      { id: "avaliacoes", nome: "Avaliações", ic: "star", grupo: "Conteúdo" },
      { id: "publicacoes", nome: "Publicações do feed", ic: "mega", grupo: "Conteúdo" },
      { id: "banners", nome: "Banners", ic: "image", grupo: "Conteúdo" },
      { id: "anuncios", nome: "Anúncios do site", ic: "grid", grupo: "Conteúdo", sub: "Faixas, cards e popup que aparecem no guia." },
      { id: "parceiros", nome: "Parceiros", ic: "heart", grupo: "Conteúdo" },
      { id: "novidades", nome: "Novidades e IA", ic: "spark", grupo: "Crescimento", sub: "Assistente com IA, push, patrocínio de seções e arte para Instagram." },
      { id: "newsletter", nome: "Newsletter", ic: "list", grupo: "Crescimento" },
      { id: "pesquisa", nome: "Pesquisa", ic: "chart", grupo: "Crescimento" },
      { id: "recursos", nome: "Recursos", ic: "grid", grupo: "Crescimento" },
      { id: "aparencia", nome: "Aparência", ic: "image", grupo: "Site", sub: "Cores, banner do topo, ordem e títulos das seções." },
      { id: "config", nome: "Configurações", ic: "gear", grupo: "Site", sub: "Contato, avisos, integrações e chaves do servidor." }
    ];
    return m.filter(function (x) { if (x.id === "usuarios") return !!srv; if (R.length && ["recursos", "banners", "publicacoes", "parceiros", "newsletter", "pesquisa"].indexOf(x.id) >= 0) return R.indexOf(x.id) >= 0; if (!R.length && ["recursos", "parceiros", "newsletter", "pesquisa"].indexOf(x.id) >= 0) return false; return true; });
  }
  function abrir(el) {
    raiz = el;
    if (!Store.admin()) {
      el.innerHTML = '<section class="block"><div class="wrap narrow"><p class="eyebrow">Área restrita</p><h1 class="page-h">Painel master</h1><p class="muted">Só a conta master da CoraçãoBR abre este painel. Para o seu negócio, use <a href="#conta">Minha conta → Meu negócio</a>.</p></div></section>';
      return;
    }
    var menu = menuMaster(), ids = menu.map(function (m) { return m.id; });
    try { var salvo = sessionStorage.getItem("dash-master"); if (salvo && ids.indexOf(salvo) >= 0) aba = salvo; } catch (e) { /* ok */ }
    if (ids.indexOf(aba) < 0) aba = "resumo";
    try { sessionStorage.setItem("dash-master", aba); } catch (e) { /* ok */ }
    var secoes = {}; ids.forEach(function (id) { secoes[id] = '<div class="pm-aba" data-pm="' + id + '"' + (id === aba ? ' id="aba"' : "") + "></div>"; });
    var c = (Store.conta && Store.conta()) || {}, nome = c.nome || "Equipe CoraçãoBR";
    el.innerHTML = Dash.montar({ chave: "master", marca: "Painel master", titulo: nome, avatar: nome.charAt(0).toUpperCase(), menu: menu, secoes: secoes,
      pe: [{ nome: "Minha conta", ic: "user", href: "#conta" }, { nome: "Ver o site", ic: "eye", href: "#inicio" }].concat(Store.servidor && Store.servidor() ? [{ nome: "Sair", ic: "out", acao: "data-sair" }] : []) });
    corpo();
  }
  document.addEventListener("dash-secao", function (e) {
    if (!e.detail || e.detail.chave !== "master" || !raiz) return;
    var velho = $("#aba", raiz); if (velho) velho.removeAttribute("id");
    aba = e.detail.id; var novo = raiz.querySelector('[data-pm="' + aba + '"]'); if (novo) { novo.id = "aba"; corpo(); }
  });
  /* links de outras telas que abrem o painel numa seção (ex.: "Abrir Pagamentos") */
  document.addEventListener("click", function (e) { var b = e.target.closest("[data-painel-aba]"); if (b) { aba = b.dataset.painelAba; try { sessionStorage.setItem("dash-master", aba); } catch (er) { /* ok */ } } }, true);
  function atualizar() {
    if (["newsletter", "pesquisa", "recursos", "usuarios", "banners", "novidades"].indexOf(aba) >= 0) return true;
    if (!raiz || !$("#aba", raiz)) return false;
    var a = document.activeElement;
    if (a && $("#aba", raiz).contains(a) && /INPUT|TEXTAREA|SELECT/.test(a.tagName)) return true;
    corpo(); return true;
  }
  function corpo() {
    var el = $("#aba", raiz); if (!el) return;
    ({ resumo: abaResumo, avisos: abaAvisos, aparencia: abaAparencia, financas: abaFinancas, receita: function (x) { if (window.Novidades) Novidades.abaReceita(x); }, novidades: function (x) { if (window.Novidades) Novidades.abaNovidades(x); }, comunidade: abaComunidade, anunciantes: abaAnunciantes, pagamentos: function (x) { if (window.Pag) Pag.abaMaster(x); }, lugares: abaLugares, anuncios: abaAnuncios, avaliacoes: abaAvaliacoes, config: abaConfig, usuarios: function (x) { if (window.Auth) Auth.abaUsuarios(x); }, recursos: function (x) { PainelRecursos.recursos(x); }, banners: function (x) { if (window.Social) Social.abaBanners(x); }, publicacoes: function (x) { if (window.Social) Social.abaPosts(x); }, parceiros: function (x) { PainelRecursos.parceiros(x); }, newsletter: function (x) { PainelRecursos.newsletter(x); }, pesquisa: function (x) { PainelRecursos.pesquisa(x); } })[aba](el);
  }

  function naoLidos() { return Store.lista("avisos").filter(function (a) { return !a.lido; }).length; }
  var TIPOS = { cadastro: "Novo cadastro", pagamento: "Assinatura", cancelamento: "Renovação cancelada", classificado: "Novo classificado", denuncia: "Denúncia no mural" };
  function abaAvisos(el) {
    var av = Store.lista("avisos").sort(function (a, b) { return (b.criadoEm || "").localeCompare(a.criadoEm || ""); });
    el.innerHTML = '<div class="stack"><div class="row" style="justify-content:space-between"><p class="muted" style="max-width:60ch">Cada empresa que se cadastra e cada pagamento aparecem aqui na hora. Anúncios entram no ar sem aprovação.</p>' + (naoLidos() ? '<button class="btn ghost sm" data-lidos>Marcar tudo como lido</button>' : "") + '</div><div class="list">' +
      (av.map(function (a) { return '<div class="lrow" style="grid-template-columns:minmax(0,1fr) auto;padding:14px 18px;cursor:default' + (a.lido ? ";opacity:.6" : "") + '"><span><b>' + esc(TIPOS[a.tipo] || a.tipo) + ": " + esc(a.nome) + "</b><small>" + esc(G.CATS[a.categoria] || "") + (a.valor ? " · " + G.usd(a.valor) : "") + " · " + esc((a.criadoEm || "").replace("T", " ").slice(0, 16)) + '</small></span><span class="row">' + (a.tipo === "denuncia" && a.lugarId ? '<a class="btn ghost sm" href="#mural-' + esc(a.lugarId) + '">Ver no mural</a>' : a.tipo === "classificado" ? '<a class="btn ghost sm" href="#mural">Ver no mural</a>' : Store.obter("lugares", a.lugarId) ? '<a class="btn ghost sm" href="#lugar-' + esc(a.lugarId) + '">Ver</a>' : "") + (a.lido ? "" : '<button class="btn soft sm" data-lido="' + esc(a.id) + '">Lido</button>') + "</span></div>"; }).join("") || '<div class="panel muted">Nenhum aviso ainda. Quando uma empresa se cadastrar ou pagar, aparece aqui.</div>') + "</div></div>";
    el.onclick = function (e) {
      var b = e.target.closest("[data-lido]");
      if (b) { var a = Store.obter("avisos", b.dataset.lido); if (a) { a.lido = true; Store.gravar("avisos", a.id, a).then(corpo).catch(falha); } }
      if (e.target.closest("[data-lidos]")) Promise.all(Store.lista("avisos").filter(function (a) { return !a.lido; }).map(function (a) { a.lido = true; return Store.gravar("avisos", a.id, a); })).then(corpo).catch(falha);
    };
  }
  /* ---------- aparência: cores, banner do topo, ordem e títulos das seções, caixinha ---------- */
  function salvaCfg(parcial, msg) { return Store.gravar("config", "geral", Object.assign({}, Store.obter("config", "geral") || {}, parcial)).then(function () { G.toast(msg || "Salvo."); }).catch(falha); }
  function abaAparencia(el) {
    var c = G.config(), S = G.SECOES, ordem = (c.secoes && c.secoes.length ? c.secoes.slice() : Object.keys(S)).filter(function (k) { return S[k]; });
    Object.keys(S).forEach(function (k) { if (ordem.indexOf(k) < 0) ordem.push(k); });
    var ocultas = (c.ocultas || []).slice(), tema = c.tema || {}, slides = (c.heroSlides || []).slice(), tx = c.textos || {};
    var comFoto = Store.lista("lugares").filter(function (l) { return (l.fotos || []).length && !(l.fotos[0].ilustrativa); }).sort(function (a, b) { return String(a.nome).localeCompare(String(b.nome)); });
    while (slides.length < 3) slides.push({ lugar: "", titulo: "" });
    function op(v, sel) { return comFoto.map(function (l) { return '<option value="' + esc(l.id) + '"' + (l.id === sel ? " selected" : "") + ">" + esc(l.nome) + "</option>"; }).join(""); }
    function lista() {
      return ordem.map(function (k, i) { return '<div class="lrow" style="grid-template-columns:auto minmax(0,1fr) auto;padding:10px 14px;cursor:default"><input type="checkbox" data-vis="' + k + '"' + (ocultas.indexOf(k) < 0 ? " checked" : "") + ' aria-label="Mostrar ' + esc(S[k]) + '"><span><b>' + esc(S[k]) + "</b></span><span class=\"row\" style=\"gap:4px;flex-wrap:nowrap\"><button type=\"button\" class=\"mini\" data-sobe=\"" + i + '"' + (i ? "" : " disabled") + ' aria-label="Subir">↑</button><button type="button" class="mini" data-desce="' + i + '"' + (i < ordem.length - 1 ? "" : " disabled") + ' aria-label="Descer">↓</button></span></div>'; }).join("");
    }
    el.innerHTML = '<div class="stack in" style="max-width:820px">' +
      '<div class="panel stack" style="gap:12px"><h3>Cores do site</h3><div class="form2">' +
      '<div class="field"><label for="ap-acc">Cor principal (botões e destaques)</label><input id="ap-acc" type="color" value="' + esc(tema.accent || "#163832") + '"></div>' +
      '<div class="field"><label for="ap-acc2">Cor de apoio (ícones e links)</label><input id="ap-acc2" type="color" value="' + esc(tema.accent2 || "#235347") + '"></div>' +
      '<div class="field"><label for="ap-bg">Fundo da página</label><input id="ap-bg" type="color" value="' + esc(tema.bg || "#F5F5F3") + '"></div></div>' +
      '<div class="row"><button class="btn" type="button" data-salva="tema">Salvar cores</button><button class="btn ghost" type="button" data-salva="tema-padrao">Voltar às cores originais</button></div></div>' +
      '<div class="panel stack" style="gap:12px"><h3>Banner do topo (fachada)</h3><p class="small muted">Até 3 fotos que se alternam no topo da página inicial. Um anunciante entra sozinho em segundo lugar, marcado como patrocinado.</p>' +
      slides.slice(0, 3).map(function (sl, i) { return '<div class="form2"><div class="field"><label for="ap-sl' + i + '">Foto ' + (i + 1) + '</label><select id="ap-sl' + i + '"><option value="">Padrão</option>' + op(null, sl.lugar) + '</select></div><div class="field"><label for="ap-st' + i + '">Título</label><input id="ap-st' + i + '" value="' + esc(sl.titulo || "") + '" maxlength="60"></div></div>'; }).join("") +
      '<div><button class="btn" type="button" data-salva="slides">Salvar banner</button></div></div>' +
      '<div class="panel stack" style="gap:12px"><h3>Seções da página inicial</h3><p class="small muted">Marque para mostrar, use as setas para mudar a posição.</p><div class="list" id="ap-ordem">' + lista() + '</div><div><button class="btn" type="button" data-salva="secoes">Salvar ordem</button></div></div>' +
      '<div class="panel stack" style="gap:12px"><h3>Títulos das seções</h3><div class="form2">' + ["alertas", "patrocinados", "avaliados", "perto", "gratis", "brasil", "texano", "morar", "hospedagem", "mural", "ia", "custo", "cidades", "anunciante"].map(function (k) { return '<div class="field"><label for="ap-tx-' + k + '">' + esc(S[k]) + '</label><input id="ap-tx-' + k + '" value="' + esc(tx[k] || "") + '" placeholder="' + esc(S[k]) + '" maxlength="80"></div>'; }).join("") + '</div><div><button class="btn" type="button" data-salva="textos">Salvar títulos</button></div></div>' +
      '<p class="note">Preços, planos, caixinha e cotação ficam na aba Finanças.</p></div>';
    el.onclick = function (e) {
      var s1 = e.target.closest("[data-sobe]"), d1 = e.target.closest("[data-desce]"), sv = e.target.closest("[data-salva]"), i;
      if (s1) { i = Number(s1.dataset.sobe); ordem.splice(i - 1, 0, ordem.splice(i, 1)[0]); $("#ap-ordem", el).innerHTML = lista(); return; }
      if (d1) { i = Number(d1.dataset.desce); ordem.splice(i + 1, 0, ordem.splice(i, 1)[0]); $("#ap-ordem", el).innerHTML = lista(); return; }
      if (!sv) return;
      var t = sv.dataset.salva, val = function (id) { var x = el.querySelector("#" + id); return x ? x.value.trim() : ""; };
      if (t === "tema") salvaCfg({ tema: { accent: val("ap-acc"), accent2: val("ap-acc2"), bg: val("ap-bg") } }, "Cores salvas.");
      if (t === "tema-padrao") salvaCfg({ tema: {} }, "Cores originais de volta.").then(function () { corpo(); });
      if (t === "slides") salvaCfg({ heroSlides: [0, 1, 2].map(function (k) { return { lugar: val("ap-sl" + k), titulo: val("ap-st" + k) }; }).filter(function (x) { return x.lugar; }) }, "Banner salvo.");
      if (t === "secoes") salvaCfg({ secoes: ordem, ocultas: Array.from(el.querySelectorAll("[data-vis]")).filter(function (x) { return !x.checked; }).map(function (x) { return x.dataset.vis; }) }, "Ordem das seções salva.");
      if (t === "textos") { var o = {}; ["alertas", "patrocinados", "avaliados", "perto", "gratis", "brasil", "texano", "morar", "hospedagem", "mural", "ia", "custo", "cidades", "anunciante"].forEach(function (k) { if (val("ap-tx-" + k)) o[k] = val("ap-tx-" + k); }); salvaCfg({ textos: o }, "Títulos salvos."); }
      if (t === "caixinha") { var lk = val("ap-cx-link"); if (lk && !/^https:\/\//i.test(lk)) { G.toast("O link precisa começar com https://"); return; } salvaCfg({ caixinha: { link: lk, pix: val("ap-cx-pix"), zelle: val("ap-cx-zelle"), texto: val("ap-cx-txt") } }, "Caixinha salva."); }
    };
    el.onchange = function (e) { var v = e.target.closest("[data-vis]"); if (!v) return; var k = v.dataset.vis, j = ocultas.indexOf(k); if (v.checked && j >= 0) ocultas.splice(j, 1); if (!v.checked && j < 0) ocultas.push(k); };
  }
  function abaAnunciantes(el) {
    var ls = Store.lista("lugares").filter(function (l) { return l.assinatura; }).sort(function (a, b) { return (b.criadoEm || "").localeCompare(a.criadoEm || ""); });
    el.innerHTML = '<div class="stack in"><p class="muted" style="max-width:60ch">Todas as empresas que se cadastraram. Abra o perfil para ver o painel do anunciante com as métricas dele, pausar ou editar o anúncio.</p><div class="list">' +
      (ls.map(function (l) { var a = l.assinatura; return '<div class="lrow" style="grid-template-columns:minmax(0,1fr) auto;padding:14px 18px;cursor:default"><span><b>' + esc(l.nome) + "</b> " + (l.publicado === false ? '<span class="pill warn">Pausado</span>' : a.status === "ativa" ? '<span class="pill ok">Ativo</span>' : '<span class="pill warn">Cancelado</span>') + "<small><br>" + esc(G.CATS[l.categoria] || "") + " · " + G.usd(a.valor || 0) + "/mês · " + (a.status === "ativa" ? "renova em " : "no ar até ") + esc(a.proximaCobranca || "") + ' · <span data-met="' + esc(l.id) + '">carregando métricas…</span></small></span><button class="btn sm" data-perfil="' + esc(l.id) + '">Abrir perfil</button></div>'; }).join("") || '<div class="panel muted">Nenhuma empresa cadastrada ainda. O cadastro fica em Anuncie → Cadastrar minha empresa.</div>') + "</div></div>";
    ls.forEach(function (l) { if (window.Anunciante) Anunciante.carrega(l.id).then(function () { var m = Anunciante.soma(l.id, 30), sp = el.querySelector('[data-met="' + l.id + '"]'); if (sp) sp.textContent = m.v + " visualizações, " + (m.r + m.c) + " cliques em 30 dias"; }); });
    el.onclick = function (e) { var b = e.target.closest("[data-perfil]"); if (b && window.Anunciante) Anunciante.abrirPerfil(b.dataset.perfil); };
  }
  function abaResumo(el) {
    var ls = Store.lista("lugares"), atr = ls.filter(function (l) { return l.tipo !== "estabelecimento"; }), av = Store.lista("avaliacoes");
    var semFoto = ls.filter(function (l) { return !(l.fotos || []).length; }).length, prov = ls.filter(function (l) { return l.notaProvisoria; }).length;
    var semPreco = atr.filter(function (l) { return !l.gratuito && l.precoConfirmado === false; }).length;
    var semMenu = ls.filter(function (l) { return l.tipo === "estabelecimento" && /restaurante|churrascaria|padaria|acai|bbq|tex-mex|steakhouse|hamburguer|brunch/.test(l.categoria) && !(l.menu || []).length; }).length;
    var mes = G.hojeISO().slice(0, 7), pags = Store.lista("pagamentos"), ativos = pags.filter(function (d) { return window.Pag && Pag.vagas(d.id) > 0; }).length, receitaMes = 0, vendas = 0;
    pags.forEach(function (d) { (d.pacotes || []).forEach(function (pk) { if (String(pk.pagoEm || "").slice(0, 7) === mes && Number(pk.valor) > 0) { receitaMes += Number(pk.valor); vendas++; } }); });
    var pix = pixPend(), nl = naoLidos(), den = aviso("denuncia");
    var D = Dash.ic, card = function (n, t, icn, ir) { return '<button type="button" class="dk-card" data-dk-ir="' + ir + '"><small>' + t + '</small><b class="dk-big"' + (ir === "usuarios" ? " data-pm-contas" : "") + ">" + n + "</b>" + D(icn) + "</button>"; };
    var pend = [[pix, "Pix informados para confirmar", "pagamentos", "pix"], [nl, "Avisos não lidos", "avisos", "bell"], [den, "Denúncias no Mural", "avisos", "shield"], [prov, "Notas de curadoria provisórias", "lugares", "star"], [semFoto, "Lugares sem foto", "lugares", "image"], [semPreco, "Atrações com preço a confirmar", "lugares", "money"], [semMenu, "Comida sem cardápio", "lugares", "list"]];
    var abertas = pend.filter(function (r) { return r[0] > 0; });
    var REG = window.Guia.CIDADES_GUIA || {}, porReg = {};
    ls.forEach(function (l) { var r = G.regiaoGuia ? G.regiaoGuia(l) : "dfw"; porReg[r] = (porReg[r] || 0) + 1; });
    var srvOn = Store.servidor && Store.servidor(), auto = !!(Store.estado.sessao && Store.estado.sessao.pixAuto);
    var cardMp = srvOn && !auto ? '<form class="dk-card pm-mp" data-pm-mp><div class="pm-mp-t">' + D("pix") + '<div><b>Pix automático desligado</b><small>Hoje cada pagamento espera a equipe confirmar. Cole o <b>Access Token</b> da conta Mercado Pago do coracaobr.oficial@gmail.com: o Pix passa a ser confirmado sozinho e o anúncio é liberado na hora.</small></div></div>' +
      '<div class="pm-mp-f"><label class="sr" for="pm-mp-tk">Access Token do Mercado Pago</label><input id="pm-mp-tk" name="token" type="password" autocomplete="off" placeholder="APP_USR-..." required><button class="btn" type="submit">Ligar Pix automático</button></div>' +
      '<button type="button" class="more" data-dk-ir="pagamentos">Como pegar o Access Token</button><p class="pm-mp-m small" role="status"></p></form>'
      : srvOn ? '<div class="dk-card pm-mp ok"><div class="pm-mp-t">' + D("check") + '<div><b>Pix automático ligado</b><small>Pagamentos confirmados pelo Mercado Pago liberam os anúncios na hora, sem a equipe.</small></div></div></div>' : "";
    el.innerHTML = '<div class="pm-res">' + cardMp +
      '<div class="dk-card dk-dark pm-hero"><div><small>Receita do mês</small><b class="dk-big">' + G.reais(receitaMes) + "</b><p>" + vendas + (vendas === 1 ? " pacote vendido" : " pacotes vendidos") + " · " + ativos + (ativos === 1 ? " anunciante ativo" : " anunciantes ativos") + '</p></div><div class="ad-pl-a"><button type="button" class="btn" data-dk-ir="pagamentos">' + (pix ? "Confirmar " + pix + " Pix" : "Pagamentos") + '</button><button type="button" class="btn ghost" data-dk-ir="receita">Ver receita</button></div></div>' +
      '<div class="dk-grid dk-g4">' + (Store.servidor && Store.servidor() ? card("…", "Contas", "users", "usuarios") : card(ls.length, "Lugares no guia", "pin", "lugares")) + card(ativos, "Anunciantes ativos", "store", "anunciantes") + card(pix, "Pix a confirmar", "pix", "pagamentos") + card(av.length, "Avaliações", "star", "avaliacoes") + "</div>" +
      '<div class="dk-grid dk-g2"><div class="dk-card dk-flat"><div class="dk-ch"><h3>Pendências</h3><span class="pill ' + (abertas.length ? "warn" : "ok") + '">' + (abertas.length ? abertas.length + " para resolver" : "tudo em dia") + "</span></div>" +
      (abertas.length ? '<div class="pm-pend">' + abertas.map(function (r) { return '<button type="button" class="pm-pi" data-dk-ir="' + r[2] + '">' + D(r[3]) + "<span>" + r[1] + "</span><b>" + r[0] + "</b></button>"; }).join("") + "</div>" : '<p class="muted small">Nenhuma pendência agora.</p>') + "</div>" +
      '<div class="dk-card dk-flat"><div class="dk-ch"><h3>Lugares por cidade</h3><button type="button" class="more" data-dk-ir="lugares">abrir</button></div><div class="pm-cid">' + Object.keys(REG).map(function (k) { return '<div><b>' + (porReg[k] || 0) + "</b><small>" + esc(REG[k].nome) + "</small></div>"; }).join("") + "</div>" +
      '<p class="small muted" style="margin:10px 0 0">' + atr.length + " atrações (" + atr.filter(function (l) { return l.gratuito; }).length + " grátis) · " + (ls.length - atr.length) + " estabelecimentos</p></div></div>" +
      '<div class="dk-card dk-flat"><div class="dk-ch"><h3>Acesso rápido</h3></div><div class="dk-ats dk-ats4">' +
      [["usuarios", "Abrir uma conta", "área de qualquer pessoa", "users"], ["financas", "Valores e Pix", "preços e chave Pix", "money"], ["aparencia", "Aparência", "cores e banner do topo", "image"], ["novidades", "Assistente e push", "IA e notificações", "spark"]].filter(function (a) { return a[0] !== "usuarios" || (Store.servidor && Store.servidor()); }).map(function (a) { return '<button type="button" class="dk-at" data-dk-ir="' + a[0] + '">' + D(a[3]) + "<b>" + a[1] + "</b><small>" + a[2] + "</small></button>"; }).join("") + "</div></div></div>";
    var fm = el.querySelector("[data-pm-mp]");
    if (fm) fm.onsubmit = function (ev) {
      ev.preventDefault(); var t = fm.token.value.trim(), m = fm.querySelector(".pm-mp-m"), b = fm.querySelector("button[type=submit]"); if (!t) return;
      b.disabled = true; b.textContent = "Conferindo no Mercado Pago…"; m.textContent = "";
      Store.api("pix_token", { token: t }).then(function (j) { if (Store.estado.sessao) Store.estado.sessao.pixAuto = true; G.toast(j.msg); abaResumo(el); })
        .catch(function (er) { b.disabled = false; b.textContent = "Ligar Pix automático"; m.textContent = er.message || "Não foi possível ligar agora."; });
    };
    if (Store.servidor && Store.servidor()) Store.api("usuarios").then(function (j) { var b = el.querySelector("[data-pm-contas]"); if (b) b.textContent = (j.usuarios || []).length; }).catch(function () { var b = el.querySelector("[data-pm-contas]"); if (b) b.textContent = "—"; });
  }

  var filtroP = "";
  var FILTROS = { "": ["Todos", function () { return true; }], semfoto: ["Sem foto", function (l) { return !(l.fotos || []).length; }], ilustra: ["Foto ilustrativa", function (l) { return (l.fotos || [])[0] && l.fotos[0].ilustrativa; }],
    prov: ["Nota provisória", function (l) { return l.notaProvisoria; }], conferir: ["A conferir", function (l) { return l.naoConferido || l.precoConfirmado === false; }], eventos: ["Eventos", function (l) { return l.categoria === "evento" || l.categoria === "show"; }], oculto: ["Ocultos", function (l) { return l.publicado === false; }] };
  function abaLugares(el) {
    function lista() {
      var q = busca.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, ""), f = FILTROS[filtroP][1];
      return Store.lista("lugares").filter(function (l) { return f(l) && (!q || (l.nome + " " + (l.bairro || "") + " " + (l.cidade || "") + " " + (G.CATS[l.categoria] || "")).toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").indexOf(q) >= 0); }).sort(function (a, b) { return a.nome.localeCompare(b.nome); });
    }
    var ls = lista();
    el.innerHTML = '<div class="stack"><div class="row" style="justify-content:space-between"><div class="field" style="flex:1;max-width:340px"><label for="p-busca">Filtrar</label><input id="p-busca" type="search" value="' + esc(busca) + '" placeholder="Nome, cidade ou categoria"></div>' +
      '<div class="row"><button class="btn" data-novo="atracao">Novo ponto turístico</button><button class="btn ghost" data-novo="estabelecimento">Novo estabelecimento</button></div></div>' +
      '<div class="chips" id="p-filtros">' + Object.keys(FILTROS).map(function (k) { var n = Store.lista("lugares").filter(FILTROS[k][1]).length; return '<button type="button" class="chip" data-f="' + k + '" aria-pressed="' + (filtroP === k) + '">' + FILTROS[k][0] + " · " + n + "</button>"; }).join("") + "</div>" +
      '<div class="tablebox"><table><thead><tr><th>Lugar</th><th>Tipo</th><th>Região</th><th>Curadoria</th><th>Preço</th><th>Fotos</th><th>Status</th><th></th></tr></thead><tbody id="p-linhas"></tbody></table></div></div>';
    function linhas() {
      $("#p-linhas", el).innerHTML = ls.map(function (l) {
        return "<tr><td><b>" + esc(l.nome) + "</b>" + (l.anunciante ? ' <span class="pill ok">Anunciante</span>' : "") + '<div class="small muted">' + esc(G.CATS[l.categoria] || "") + "</div></td><td>" + (l.tipo === "estabelecimento" ? "Estabelecimento" : "Ponto turístico") + "</td><td>" + esc(l.bairro || l.cidade || "") +
          '</td><td class="num">' + (l.notaCuradoria ? Number(l.notaCuradoria).toFixed(1) + (l.notaProvisoria ? ' <span class="pill warn">provisória</span>' : "") : "–") +
          "</td><td>" + (l.tipo === "estabelecimento" ? esc(G.precoCurto(l) || "–") : l.gratuito ? '<span class="pill ok">Gratuito</span>' : (l.precoMin ? G.usd(l.precoMin) : "–") + (l.precoConfirmado === false ? ' <span class="pill warn">a confirmar</span>' : "")) +
          '</td><td class="num">' + (l.fotos || []).length + "/10" + ((l.fotos || [])[0] && l.fotos[0].ilustrativa ? ' <span class="pill warn">ilustrativa</span>' : "") + "</td><td>" + (l.publicado === false ? '<span class="pill warn">Oculto</span>' : '<span class="pill ok">Publicado</span>') +
          '</td><td><button class="btn sm ghost" data-editar="' + esc(l.id) + '">Editar</button></td></tr>';
      }).join("") || '<tr><td colspan="8" class="muted">Nenhum lugar encontrado.</td></tr>';
    }
    linhas();
    $("#p-busca", el).addEventListener("input", function (e) { busca = e.target.value; ls = lista(); linhas(); });
    $("#p-filtros", el).addEventListener("click", function (e) { var c = e.target.closest("[data-f]"); if (!c) return; filtroP = c.dataset.f; Array.from(this.children).forEach(function (x) { x.setAttribute("aria-pressed", x === c); }); ls = lista(); linhas(); });
    el.onclick = function (e) {
      var b = e.target.closest("[data-editar]"), n = e.target.closest("[data-novo]");
      if (b) editarLugar(Store.obter("lugares", b.dataset.editar));
      if (n) editarLugar({ id: "", tipo: n.dataset.novo, nome: "", categoria: n.dataset.novo === "atracao" ? "museu" : "restaurante-brasileiro", cidade: "Dallas", gratuito: false, fotos: [], menu: [], publicado: true });
    };
  }

  /* ---------- editar lugar ---------- */
  function fotosHtml() {
    return (D.fotos || []).map(function (f, i) { return '<figure><img src="' + esc(Store.urlFoto(f.src)) + '" alt=""><button type="button" data-tirar="' + i + '" aria-label="Remover foto">×</button></figure>'; }).join("");
  }
  function menuRows() {
    return (D.menu || []).map(function (m, i) {
      return '<div class="mrow" data-i="' + i + '"><input data-k="secao" value="' + esc(m.secao || "") + '" placeholder="Seção" aria-label="Seção"><input data-k="item" value="' + esc(m.item || "") + '" placeholder="Item" aria-label="Item"><input data-k="descricao" value="' + esc(m.descricao || "") + '" placeholder="Descrição" aria-label="Descrição"><input data-k="preco" value="' + esc(m.preco == null ? "" : m.preco) + '" placeholder="US$" inputmode="decimal" aria-label="Preço em dólar"><button type="button" class="btn sm danger" data-menos="' + i + '" aria-label="Remover item">×</button></div>';
    }).join("");
  }
  function lerMenu() {
    D.menu = Array.from(dlg.querySelectorAll(".mrow")).map(function (r) {
      var o = {}; Array.from(r.querySelectorAll("input")).forEach(function (i) { o[i.dataset.k] = i.value.trim(); });
      var p = o.preco.replace(",", "."); o.preco = p === "" || isNaN(Number(p)) ? null : Number(p); return o;
    });
  }
  function editarLugar(l) {
    if (!l) return;
    D = JSON.parse(JSON.stringify(l)); D.fotos = D.fotos || []; D.menu = D.menu || []; removidas = [];
    var est = D.tipo === "estabelecimento", cats = (est ? EST : ATR).map(function (c) { return [c, G.CATS[c] || c]; });
    dlg.innerHTML = '<form method="dialog" id="f-lugar"><div class="dlg-head"><h3>' + (D.id ? "Editar: " + esc(D.nome) : est ? "Novo estabelecimento" : "Novo ponto turístico") + '</h3><button type="button" class="btn sm ghost" data-fechar>Fechar</button></div><div class="dlg-body">' +
      '<div class="form2">' + fld("e-nome", "Nome", D.nome, { attr: "required maxlength=90" }) + sel("e-cat", "Categoria", D.categoria, cats) +
      '<div class="field"><label for="e-reg">Cidade do guia</label><select id="e-reg">' + Object.keys(G.CIDADES_GUIA || { dfw: { nome: "Dallas–Fort Worth" } }).map(function (k) { return '<option value="' + k + '"' + ((D.regiaoGuia || (D.id ? "dfw" : (G.cidadeAtual ? G.cidadeAtual() : "dfw"))) === k ? " selected" : "") + ">" + esc(G.CIDADES_GUIA[k].nome) + "</option>"; }).join("") + "</select></div>" +
      fld("e-cidade", "Cidade", D.cidade) + fld("e-bairro", "Bairro ou região", D.bairro) + fld("e-end", "Endereço completo", D.endereco, { cls: "full" }) +
      fld("e-lat", "Latitude", D.lat, { attr: 'inputmode="decimal"' }) + fld("e-lng", "Longitude", D.lng, { attr: 'inputmode="decimal"' }) +
      '<div class="field full"><span>Horário por dia</span>' + Horario.editor(D) + "</div>" + fld("e-hor", "Horário em texto (usado quando os dias acima não forem alterados)", D.horario, { cls: "full" }) + fld("e-site", "Site", D.site, { attr: 'placeholder="https://"' }) + fld("e-tel", "Telefone", D.telefone) + fld("e-ig", "Instagram (@usuario)", D.instagram) + fld("e-wa", "WhatsApp (com DDD)", D.whatsapp, { attr: 'inputmode="tel"' }) + fld("e-cupom", "Oferta para quem vem pelo guia", D.cupom, { cls: "full" }) + fld("e-estac", "Estacionamento (onde parar e quanto custa)", D.estacionamento, { cls: "full" }) + fld("e-quando", "Quando acontece (só para eventos)", D.quando) + fld("e-di", "Data de início", D.dataInicio, { attr: 'type="date"' }) + fld("e-df", "Data de término (some do guia depois dela)", D.dataFim, { attr: 'type="date"' }) + "</div>" +
      '<fieldset><legend>Nota e publicação</legend><div class="form2">' + fld("e-nota", "Nota da curadoria (1 a 5)", D.notaCuradoria, { attr: 'type="number" min="1" max="5" step="0.5"' }) +
      sel("e-pub", "Status", D.publicado === false ? "0" : "1", [["1", "Publicado"], ["0", "Oculto"]]) + sel("e-br", "Negócio brasileiro", D.brasileiro ? "1" : "0", [["0", "Não"], ["1", "Sim"]]) + sel("e-pt", "Atende em português", D.falaPortugues ? "1" : "0", [["0", "Não"], ["1", "Sim (selo Fala português)"]]) + sel("e-fx1", "Movimento em dia de semana", D.fluxoSemana || "", [["", "Não informar"], ["pouco", "Pouco fluxo"], ["medio", "Médio fluxo"], ["alto", "Bem movimentado"]]) + sel("e-fx2", "Movimento no fim de semana", D.fluxoFds || "", [["", "Não informar"], ["pouco", "Pouco fluxo"], ["medio", "Médio fluxo"], ["alto", "Bem movimentado"]]) + sel("e-anun", "Anunciante (aparece primeiro)", D.anunciante ? "1" : "0", [["0", "Não"], ["1", "Sim"]]) +
      (D.notaProvisoria ? '<p class="note full">Esta nota é provisória. Ao salvar, ela passa a valer como sua.</p>' : "") + "</div></fieldset>" +
      (est ? '<fieldset><legend>Preço e cardápio</legend><div class="form2">' + sel("e-faixa", "Faixa de preço", D.faixaPreco || "$$", [["$", "$ barato"], ["$$", "$$ médio"], ["$$$", "$$$ caro"], ["$$$$", "$$$$ muito caro"]]) + fld("e-mver", "Preços conferidos em (AAAA-MM)", D.menuVerificadoEm) + fld("e-mfonte", "Link do cardápio oficial", D.fonteMenu, { cls: "full" }) + fld("e-epmin", "A partir de (US$)", D.precoMin, { attr: 'inputmode="decimal"' }) + fld("e-epmed", "Média por pessoa (US$)", D.precoMedio, { attr: 'inputmode="decimal"' }) + fld("e-epmax", "Até (US$)", D.precoMax, { attr: 'inputmode="decimal"' }) + fld("e-epbase", "O que é o \"a partir de\"", D.precoBase, { attr: 'placeholder="prato principal, rodízio no almoço…"' }) + fld("e-epfonte", "Link onde o preço aparece", D.fontePreco, { cls: "full" }) + fld("e-epconf", "Preço conferido em (AAAA-MM)", D.precoConferidoEm) + '</div></fieldset>'  + (window.Cardapio ? Cardapio.editor(D) : "")
        : '<fieldset><legend>Entrada</legend><div class="form2">' + sel("e-gratis", "Cobrança", D.gratuito ? "1" : "0", [["1", "Gratuito"], ["0", "Pago"]]) + fld("e-pmin", "Menor preço de adulto (US$)", D.precoMin, { attr: 'inputmode="decimal"' }) + fld("e-pmed2", "Preço médio (US$)", D.precoMedio, { attr: 'inputmode="decimal"' }) + fld("e-pmax2", "Ingresso mais caro (US$)", D.precoMax, { attr: 'inputmode="decimal"' }) + fld("e-preco", "Tabela de preços (texto)", D.preco, { cls: "full", attr: 'placeholder="Adulto US$ 25 · Criança US$ 18"' }) + sel("e-pconf", "Preço confirmado na fonte", D.precoConfirmado === false ? "0" : "1", [["1", "Sim"], ["0", "Ainda não"]]) + fld("e-pfonte", "Link da fonte do preço", D.fontePreco) + fld("e-tempo", "Tempo de visita", D.tempoVisita) + fld("e-atual", "Conferido em (AAAA-MM)", D.atualizadoEm) + "</div></fieldset>") +
      area("e-hist", est ? "Sobre o lugar" : "História do lugar", D.historia) + area("e-dica", "Dica para brasileiros", D.dica) +
      (window.Recursos ? Recursos.editorHtml(D) : "") +
      '<fieldset><legend>Fotos (<span id="e-nf">' + D.fotos.length + '</span> de 10)</legend><div class="photos" id="e-fotos">' + fotosHtml() + '</div><div class="row" style="margin-top:10px"><input type="file" id="e-file" accept="image/*" multiple><span class="small muted">' + (Store.estado.modo === "nuvem" && !Store.estado.podeFotosNuvem ? "Envio de fotos disponível só para quem edita o guia." : "JPG ou PNG. A primeira foto vira a capa do card.") + "</span></div></fieldset>" +
      '</div><div class="dlg-foot">' + (D.id ? '<button type="button" class="btn danger" data-excluir style="margin-right:auto">Excluir lugar</button>' : "") + '<button type="button" class="btn ghost" data-fechar>Cancelar</button><button class="btn" type="submit">Salvar</button></div></form>';
    dlg.showModal(); if (window.Recursos) Recursos.ligarEditor(dlg);
    $("#e-file", dlg).addEventListener("change", async function (e) {
      var files = Array.from(e.target.files || []), livres = 10 - D.fotos.length;
      if (files.length > livres) G.toast("Cada lugar aceita até 10 fotos. " + (livres > 0 ? "Só as primeiras " + livres + " entram." : "Remova uma para incluir outra."));
      for (var i = 0; i < Math.min(files.length, livres); i++) {
        try { D.fotos.push({ src: await Store.salvarFoto(files[i]), credito: "" }); } catch (err) { G.toast(err.message || "Não foi possível enviar a foto."); break; }
        $("#e-fotos", dlg).innerHTML = fotosHtml(); $("#e-nf", dlg).textContent = D.fotos.length;
      }
      e.target.value = "";
    });
    dlg.onclick = function (e) {
      var t = e.target;
      if (t.closest("[data-fechar]")) { dlg.close(); return; }
      if (t.closest("[data-tirar]")) { var x = D.fotos.splice(Number(t.closest("[data-tirar]").dataset.tirar), 1)[0]; if (x) removidas.push(x.src); $("#e-fotos", dlg).innerHTML = fotosHtml(); $("#e-nf", dlg).textContent = D.fotos.length; return; }
      if (t.closest("[data-mais]")) { lerMenu(); D.menu.push({ secao: (D.menu[D.menu.length - 1] || {}).secao || "", item: "", descricao: "", preco: null }); $("#e-menu", dlg).innerHTML = menuRows(); return; }
      if (t.closest("[data-menos]")) { lerMenu(); D.menu.splice(Number(t.closest("[data-menos]").dataset.menos), 1); $("#e-menu", dlg).innerHTML = menuRows(); return; }
      var ex = t.closest("[data-excluir]");
      if (ex) {
        if (!ex.dataset.ok) { ex.dataset.ok = "1"; ex.textContent = "Confirmar exclusão"; return; }
        var fotos = D.fotos.map(function (f) { return f.src; });
        Store.apagar("lugares", D.id).then(function () { fotos.concat(removidas).forEach(Store.apagarFoto); dlg.close(); G.toast("Lugar excluído."); corpo(); }).catch(falha);
      }
    };
    $("#f-lugar", dlg).addEventListener("submit", function (e) {
      e.preventDefault(); if (ocupado) return;
      D.nome = v("e-nome"); D.categoria = v("e-cat"); D.cidade = v("e-cidade"); D.regiaoGuia = v("e-reg") || "dfw"; D.bairro = v("e-bairro"); D.endereco = v("e-end");
      D.lat = num("e-lat"); D.lng = num("e-lng"); var txtAntes = D.horario || ""; D.horario = v("e-hor"); var hed = dlg.querySelector(".hed");
      if (hed && hed.dataset.mudou) { var sem = Horario.lerEditor(hed); delete D.semana; D.horas = sem ? Horario.paraObj(sem) : null; if (sem) D.horario = Horario.texto(sem); }
      else if (D.horario !== txtAntes) { delete D.semana; D.horas = null; } D.site = v("e-site"); D.telefone = v("e-tel"); D.instagram = v("e-ig"); D.whatsapp = v("e-wa"); D.cupom = v("e-cupom"); D.estacionamento = v("e-estac"); D.quando = v("e-quando"); D.dataInicio = v("e-di"); D.dataFim = v("e-df");
      D.notaCuradoria = num("e-nota"); D.notaProvisoria = false; D.publicado = v("e-pub") === "1"; D.brasileiro = v("e-br") === "1"; D.falaPortugues = v("e-pt") === "1"; D.anunciante = v("e-anun") === "1"; D.fluxoSemana = v("e-fx1"); D.fluxoFds = v("e-fx2");
      D.historia = v("e-hist"); D.dica = v("e-dica"); if (window.Recursos) Recursos.lerEditor(dlg, D);
      if (est) { if (window.Cardapio) Cardapio.ler(dlg, D); D.faixaPreco = v("e-faixa"); D.menuVerificadoEm = v("e-mver"); D.fonteMenu = v("e-mfonte"); D.precoMin = num("e-epmin"); D.precoMedio = num("e-epmed"); D.precoMax = num("e-epmax"); D.precoBase = v("e-epbase"); D.fontePreco = v("e-epfonte"); D.precoConferidoEm = v("e-epconf"); }
      else { D.gratuito = v("e-gratis") === "1"; D.precoMin = D.gratuito ? 0 : num("e-pmin"); D.precoMedio = D.gratuito ? null : num("e-pmed2"); D.precoMax = D.gratuito ? null : num("e-pmax2"); D.preco = v("e-preco") || (D.gratuito ? "Gratuito" : ""); D.precoConfirmado = v("e-pconf") === "1"; D.fontePreco = v("e-pfonte"); D.tempoVisita = v("e-tempo"); D.atualizadoEm = v("e-atual"); }
      var id = D.id || (D.nome.toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, "").replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "").slice(0, 50) || "lugar") + (Store.obter("lugares", D.nome) ? "" : "");
      if (!D.id && Store.obter("lugares", id)) id = id + "-" + Date.now().toString(36).slice(-4);
      ocupado = true;
      Store.gravar("lugares", id, D).then(function () { ocupado = false; removidas.forEach(Store.apagarFoto); dlg.close(); G.toast("Lugar salvo."); corpo(); }).catch(falha);
    });
  }

  /* ---------- anúncios ---------- */
  function abaAnuncios(el) {
    var ads = Store.lista("anuncios").sort(function (a, b) { return (a.titulo || "").localeCompare(b.titulo || ""); });
    el.innerHTML = '<div class="stack"><div class="row" style="justify-content:space-between"><p class="muted" style="max-width:60ch">Cada anúncio ocupa uma posição do guia. Onde não houver anúncio ativo, aparece o convite “Anuncie aqui”.</p><button class="btn" data-novo-ad>Novo anúncio</button></div>' +
      '<div class="tablebox"><table><thead><tr><th>Anúncio</th><th>Anunciante</th><th>Posição</th><th>Valor mensal</th><th>Status</th><th></th></tr></thead><tbody>' +
      (ads.map(function (a) { return "<tr><td><b>" + esc(a.titulo) + '</b><div class="small muted">' + esc(a.texto || "") + "</div></td><td>" + esc(a.anunciante || "–") + "</td><td>" + esc(POS[a.posicao] || a.posicao) + '</td><td class="num">' + (a.valorMensal ? G.usd(a.valorMensal) : "–") + "</td><td>" + (a.ativo === false ? '<span class="pill warn">Pausado</span>' : '<span class="pill ok">Ativo</span>') + '</td><td><button class="btn sm ghost" data-ad="' + esc(a.id) + '">Editar</button></td></tr>'; }).join("") || '<tr><td colspan="6" class="muted">Nenhum anúncio cadastrado. Crie o primeiro para ver como ele aparece na página inicial e no guia.</td></tr>') +
      "</tbody></table></div></div>";
    el.onclick = function (e) {
      var b = e.target.closest("[data-ad]");
      if (b) editarAd(Store.obter("anuncios", b.dataset.ad));
      if (e.target.closest("[data-novo-ad]")) editarAd({ id: "", titulo: "", texto: "", botao: "Saiba mais", link: "", posicao: "faixa", anunciante: "", valorMensal: null, ativo: true, imagem: "" });
    };
  }
  function editarAd(a) {
    if (!a) return; D = JSON.parse(JSON.stringify(a)); var imgAntiga = D.imagem || "";
    function img() { return D.imagem ? '<figure><img src="' + esc(Store.urlFoto(D.imagem)) + '" alt=""><button type="button" data-sem-img aria-label="Remover imagem">×</button></figure>' : ""; }
    dlg.innerHTML = '<form method="dialog" id="f-ad"><div class="dlg-head"><h3>' + (D.id ? "Editar anúncio" : "Novo anúncio") + '</h3><button type="button" class="btn sm ghost" data-fechar>Fechar</button></div><div class="dlg-body"><div class="form2">' +
      fld("a-titulo", "Título", D.titulo, { attr: "required maxlength=70", cls: "full" }) + fld("a-texto", "Texto de apoio", D.texto, { cls: "full", attr: "maxlength=140" }) +
      fld("a-botao", "Texto do botão", D.botao) + fld("a-link", "Link de destino", D.link, { attr: 'placeholder="https://"' }) +
      sel("a-pos", "Posição", D.posicao, Object.keys(POS).map(function (k) { return [k, POS[k]]; })) + sel("a-ativo", "Status", D.ativo === false ? "0" : "1", [["1", "Ativo"], ["0", "Pausado"]]) +
      fld("a-anun", "Anunciante", D.anunciante) + fld("a-valor", "Valor mensal (US$)", D.valorMensal, { attr: 'inputmode="decimal"' }) + "</div>" +
      '<fieldset><legend>Imagem</legend><div class="photos" id="a-img">' + img() + '</div><div class="row" style="margin-top:10px"><input type="file" id="a-file" accept="image/*"></div></fieldset>' +
      '</div><div class="dlg-foot">' + (D.id ? '<button type="button" class="btn danger" data-excluir style="margin-right:auto">Excluir anúncio</button>' : "") + '<button type="button" class="btn ghost" data-fechar>Cancelar</button><button class="btn" type="submit">Salvar</button></div></form>';
    dlg.showModal();
    $("#a-file", dlg).addEventListener("change", async function (e) {
      var f = (e.target.files || [])[0]; if (!f) return;
      try { D.imagem = await Store.salvarFoto(f); $("#a-img", dlg).innerHTML = img(); } catch (err) { G.toast(err.message || "Não foi possível enviar a imagem."); }
      e.target.value = "";
    });
    dlg.onclick = function (e) {
      if (e.target.closest("[data-fechar]")) { dlg.close(); return; }
      if (e.target.closest("[data-sem-img]")) { D.imagem = ""; $("#a-img", dlg).innerHTML = ""; return; }
      var ex = e.target.closest("[data-excluir]");
      if (ex) {
        if (!ex.dataset.ok) { ex.dataset.ok = "1"; ex.textContent = "Confirmar exclusão"; return; }
        Store.apagar("anuncios", D.id).then(function () { if (imgAntiga) Store.apagarFoto(imgAntiga); dlg.close(); G.toast("Anúncio excluído."); corpo(); }).catch(falha);
      }
    };
    $("#f-ad", dlg).addEventListener("submit", function (e) {
      e.preventDefault(); if (ocupado) return;
      D.titulo = v("a-titulo"); D.texto = v("a-texto"); D.botao = v("a-botao"); D.link = v("a-link"); D.posicao = v("a-pos"); D.ativo = v("a-ativo") === "1"; D.anunciante = v("a-anun"); D.valorMensal = num("a-valor");
      ocupado = true;
      Store.gravar("anuncios", D.id || Store.novoId("ad"), D).then(function () { ocupado = false; if (imgAntiga && imgAntiga !== D.imagem) Store.apagarFoto(imgAntiga); dlg.close(); G.toast("Anúncio salvo."); corpo(); }).catch(falha);
    });
  }

  /* ---------- avaliações ---------- */
  function abaAvaliacoes(el) {
    var av = Store.lista("avaliacoes").sort(function (a, b) { return (b.criadoEm || "").localeCompare(a.criadoEm || ""); });
    el.innerHTML = '<div class="tablebox"><table><thead><tr><th>Data</th><th>Lugar</th><th>Nota</th><th>Quem</th><th>Comentário</th><th></th></tr></thead><tbody>' +
      (av.map(function (a) { var l = Store.obter("lugares", a.lugarId); return '<tr><td class="num" style="white-space:nowrap">' + esc((a.criadoEm || "").slice(0, 10)) + "</td><td>" + esc(l ? l.nome : a.lugarId) + '</td><td style="white-space:nowrap">' + G.stars(a.estrelas) + "</td><td>" + esc(a.nome || "") + "</td><td>" + esc(a.texto || "") + '</td><td><button class="btn sm danger" data-av="' + esc(a.id) + '">Remover</button></td></tr>'; }).join("") || '<tr><td colspan="6" class="muted">Nenhuma avaliação ainda. Elas chegam pela página de cada lugar e entram aqui para você moderar.</td></tr>') + "</tbody></table></div>";
    el.onclick = function (e) {
      var b = e.target.closest("[data-av]"); if (!b) return;
      if (!b.dataset.ok) { b.dataset.ok = "1"; b.textContent = "Confirmar"; return; }
      Store.apagar("avaliacoes", b.dataset.av).then(function () { G.toast("Avaliação removida."); corpo(); }).catch(falha);
    };
  }

  /* ---------- configurações ---------- */
  function abaConfig(el) {
    var c = G.config();
    el.innerHTML = '<form id="f-cfg" class="stack" style="max-width:760px">' +
      '<fieldset><legend>Contato e avisos</legend><div class="form2">' + fld("c-wa", "WhatsApp do SAC e dos avisos (com código do país)", c.whatsappAviso || "5511983573266", { attr: 'inputmode="tel"' }) + fld("c-email", "E-mail oficial (contato do site e avisos importantes)", c.emailOficial || "coracaobr.oficial@gmail.com", { attr: 'type="email" inputmode="email"' }) + fld("c-contato", "Contato comercial extra (opcional)", c.contato) + "</div><p class=\"small muted\">O e-mail oficial aparece no rodapé, em Sobre e contato, Termos, Privacidade e Anuncie. No servidor da Hostinger, os avisos importantes (pagamento informado, novo anunciante, denúncia) chegam no e-mail definido em api/config.php.</p></fieldset>" +
      '<fieldset><legend>Faixa de aviso no topo</legend><div class="form2">' + fld("c-faixa", "Texto da faixa (vazio esconde)", c.faixaAtiva ? c.faixaTexto : "", { cls: "full", attr: "maxlength=120" }) + "</div></fieldset>" +
      '<fieldset><legend>Google e anúncios (tráfego pago)</legend><p class="small muted">Cole só os códigos; o site carrega as tags depois do aceite de cookies e mede sozinho: visitas por tela, cadastro, Pix confirmado (com valor) e clique no WhatsApp de um lugar.</p><div class="form2">' +
      fld("c-ga4", "Google Analytics 4 (ID de medição)", (c.marketing || {}).ga4, { attr: 'placeholder="G-XXXXXXXXXX"' }) + fld("c-gtm", "Google Tag Manager (opcional)", (c.marketing || {}).gtm, { attr: 'placeholder="GTM-XXXXXXX"' }) +
      fld("c-ads", "Google Ads (ID da conta)", (c.marketing || {}).ads, { attr: 'placeholder="AW-123456789"' }) + fld("c-ads-cad", "Rótulo da conversão: cadastro", (c.marketing || {}).adsCadastro, { attr: 'placeholder="AbCdEf..."' }) +
      fld("c-ads-buy", "Rótulo da conversão: pagamento", (c.marketing || {}).adsCompra, { attr: 'placeholder="AbCdEf..."' }) + fld("c-ads-ct", "Rótulo da conversão: contato (WhatsApp)", (c.marketing || {}).adsContato, { attr: 'placeholder="AbCdEf..."' }) +
      fld("c-pixel", "Pixel da Meta (Facebook/Instagram)", (c.marketing || {}).pixel, { attr: 'placeholder="123456789012345" inputmode="numeric"' }) + fld("c-gsc", "Search Console: arquivo de verificação", (c.marketing || {}).gsc, { attr: 'placeholder="google1234abcd5678.html"' }) +
      '</div><p class="small muted">Search Console: escolha a verificação por "Arquivo HTML", copie só o nome do arquivo (google…​.html) e cole acima; o site responde no endereço certo. O mapa do site fica em <b>' + esc(location.origin + location.pathname.replace(/[^/]*$/, "")) + 'sitemap.xml</b>.</p></fieldset>' +
      '<p class="note">Preços, planos, caixinha e cotação do dólar ficam na aba Finanças.</p><div><button class="btn" type="submit">Salvar configurações</button></div></form>';
    $("#f-cfg", el).addEventListener("submit", function (e) {
      e.preventDefault();
      salvaCfg({ whatsappAviso: v("c-wa").replace(/\D/g, ""), contato: v("c-contato"), emailOficial: (/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(v("c-email").trim()) ? v("c-email").trim() : "coracaobr.oficial@gmail.com"), faixaTexto: v("c-faixa"), faixaAtiva: !!v("c-faixa"), marketing: { ga4: v("c-ga4").toUpperCase(), gtm: v("c-gtm").toUpperCase(), ads: v("c-ads").toUpperCase(), adsCadastro: v("c-ads-cad"), adsCompra: v("c-ads-buy"), adsContato: v("c-ads-ct"), pixel: v("c-pixel").replace(/\D/g, ""), gsc: (v("c-gsc").match(/google[0-9a-f]+\.html/i) || [""])[0] } }, "Configurações salvas.");
    });
  }

  /* ---------- finanças: todos os preços num lugar só, e o resumo do que entra por mês ---------- */
  function abaFinancas(el) {
    var c = G.config(), pg = c.pagamentos || {}, cx = c.caixinha || {}, vals = (cx.valores && cx.valores.length ? cx.valores : [5, 10, 20]);
    var ans = Store.lista("lugares").filter(function (l) { return l.assinatura && !l.demo; }), hoje = G.hojeISO();
    var ativos = ans.filter(function (l) { var a = l.assinatura; return a.status === "ativa" || (a.proximaCobranca || "") >= hoje; });
    var mrr = ativos.filter(function (l) { return l.assinatura.status === "ativa"; }).reduce(function (t, l) { return t + (Number(l.assinatura.valor) || 0); }, 0);
    var porPlano = { basico: 0, destaque: 0 }; ativos.forEach(function (l) { porPlano[l.assinatura.plano === "destaque" ? "destaque" : "basico"]++; });
    var cls = Store.lista("classificados"), clMes = cls.filter(function (x) { return (x.criadoEm || "").slice(0, 7) === hoje.slice(0, 7); }), clRec = clMes.filter(function (x) { return x.pago === "link"; }).reduce(function (t, x) { return t + (Number(x.valor) || 0); }, 0), clCobrar = clMes.filter(function (x) { return x.pago === "teste"; }).reduce(function (t, x) { return t + (Number(x.valor) || 0); }, 0);
    var k = function (n, t) { return '<div class="kpi"><b class="num">' + n + "</b><span>" + t + "</span></div>"; };
    el.innerHTML = '<div class="stack in" style="max-width:860px">' +
      '<div class="kpis">' + k(G.usd(mrr), "receita mensal recorrente") + k(ativos.length, "anunciantes ativos") + k(G.usd(clRec), "classificados pagos no mês") + k(G.usd(clCobrar), "classificados a cobrar") + "</div>" +
      '<form id="f-fin" class="stack">' +
      '<fieldset><legend>Plano do anunciante (valor único)</legend><div class="form2">' + fld("fi-bas", "Preço por mês (US$)", c.precoAnuncio, { attr: 'inputmode="decimal"' }) +
      fld("fi-lbas", "Link de pagamento mensal (Stripe Payment Link)", pg.anuncio || pg.basico || "", { cls: "full", attr: 'placeholder="https://buy.stripe.com/..."' }) + '</div><p class="small muted">Quem já assina continua pagando o valor que contratou. O novo preço vale para novos anunciantes e reativações.</p></fieldset>' +
      '<fieldset><legend>Mural de classificados</legend><div class="form2">' + fld("fi-cl", "Preço por anúncio (US$, 0 = grátis)", c.precoClassificado, { attr: 'inputmode="decimal"' }) + fld("fi-cld", "Dias no ar", c.diasClassificado, { attr: 'inputmode="numeric"' }) + fld("fi-lcl", "Link de pagamento do classificado", pg.classificado || "", { cls: "full", attr: 'placeholder="https://"' }) + "</div></fieldset>" +
      '<fieldset><legend>Passe de acesso ao guia</legend><div class="form2">' + sel("fi-pago", "Passe de acesso", c.acessoPago ? "1" : "0", [["0", "Desligado: guia liberado"], ["1", "Ligado"]]) + fld("fi-acesso", "Valor do passe (US$)", c.precoAcesso, { attr: 'inputmode="decimal"' }) + "</div></fieldset>" +
      '<fieldset><legend>Apoie o CoraçãoBR (caixinha)</legend><div class="form2">' + fld("fi-cx1", "Valor sugerido 1 (US$)", vals[0], { attr: 'inputmode="decimal"' }) + fld("fi-cx2", "Valor sugerido 2", vals[1], { attr: 'inputmode="decimal"' }) + fld("fi-cx3", "Valor sugerido 3", vals[2], { attr: 'inputmode="decimal"' }) +
      fld("fi-cxl", "Link de pagamento (Stripe, PayPal)", cx.link || "", { cls: "full", attr: 'placeholder="https://"' }) + fld("fi-pix", "Chave PIX", cx.pix || "") + fld("fi-zelle", "Zelle (e-mail ou telefone)", cx.zelle || "") + fld("fi-cxt", "Mensagem da caixinha", cx.texto || "", { cls: "full", attr: "maxlength=160" }) + "</div></fieldset>" +
      '<fieldset><legend>Cotação do dólar</legend><div class="form2">' + fld("fi-cot", "Reais por dólar", c.cotacao || "", { attr: 'inputmode="decimal"' }) + sel("fi-cauto", "Atualização", c.cotacaoAuto === false ? "0" : "1", [["1", "Automática (o robô atualiza todo dia)"], ["0", "Manual (fica o valor ao lado)"]]) + '<p class="note full">Última atualização: ' + esc(c.cotacaoEm || "manual") + "</p></div></fieldset>" +
      '<div><button class="btn" type="submit">Salvar finanças</button></div></form>' +
      '<div class="panel stack" style="gap:10px"><h3>Assinaturas</h3>' + (ans.length ? '<div class="list">' + ans.sort(function (a, b) { return (a.assinatura.proximaCobranca || "").localeCompare(b.assinatura.proximaCobranca || ""); }).map(function (l) { var a = l.assinatura; return '<div class="lrow" style="grid-template-columns:minmax(0,1fr) auto;padding:12px 16px;cursor:default"><span><b>' + esc(l.nome) + "</b><small>" + (a.plano === "destaque" ? "Destaque" : "Básico") + " · " + G.usd(a.valor || 0) + "/mês · " + (a.modo === "link" ? "cartão (link)" : "cobrança manual") + '</small></span><span class="pill ' + (a.status === "ativa" ? "ok" : "warn") + '">' + (a.status === "ativa" ? "renova " : "até ") + esc(a.proximaCobranca || "") + "</span></div>"; }).join("") + "</div>" : '<p class="muted small">Nenhuma assinatura de verdade ainda (os 3 anúncios de demonstração não entram na conta).</p>') + "</div>" +
      '<p class="note">Como receber de verdade: crie no Stripe um "Payment Link" de assinatura mensal para cada plano e cole aqui. Ao publicar, o anunciante é levado para a página segura do Stripe. Quando o Stripe confirmar, a cobrança mensal passa a ser automática.</p></div>';
    $("#f-fin", el).addEventListener("submit", function (e) {
      e.preventDefault();
      var links = { anuncio: v("fi-lbas"), classificado: v("fi-lcl"), cx: v("fi-cxl") };
      for (var x in links) if (links[x] && !/^https:\/\//i.test(links[x])) { G.toast("Os links precisam começar com https://"); return; }
      salvaCfg({ precoAnuncio: num("fi-bas") || 0, precoClassificado: num("fi-cl") || 0, diasClassificado: Math.max(1, Math.round(num("fi-cld") || 30)), acessoPago: v("fi-pago") === "1", precoAcesso: num("fi-acesso") || 0,
        pagamentos: Object.assign({}, c.pagamentos || {}, { anuncio: links.anuncio, classificado: links.classificado }),
        caixinha: Object.assign({}, cx, { valores: [num("fi-cx1") || 5, num("fi-cx2") || 10, num("fi-cx3") || 20], link: links.cx, pix: v("fi-pix"), zelle: v("fi-zelle"), texto: v("fi-cxt") }),
        cotacao: num("fi-cot") || 0, cotacaoAuto: v("fi-cauto") === "1" }, "Finanças salvas.").then(function () { corpo(); });
    });
  }

  /* ---------- comunidade: avisos, brasileiro do mês, mural, interesse por cidade e o robô de atualização ---------- */
  /* quadro da atualização diária do servidor (Hostinger) */
  function painelDiario() {
    var box = document.getElementById("srv-diario"); if (!box) return;
    Store.api("cron_info").then(function (j) {
      var robo = Store.obter("config", "robo") || {}, r = robo.servidor || {};
      box.innerHTML = '<h3>Atualização diária no servidor · 5h de Dallas</h3><p class="small muted">Atualiza o dólar (PTAX do Banco Central), o metrô (GTFS oficial, toda semana), tira do ar eventos encerrados e, com a chave do Google, atualiza nota, avaliações reais, horário, telefone e site dos lugares.</p>' +
        '<dl class="kv"><dt>Última execução</dt><dd>' + esc(r.data ? String(r.data).slice(0, 16).replace("T", " ") : j.ultimo || "ainda não rodou") + "</dd><dt>Resultado</dt><dd>" + esc((r.feito || []).join(" · ") || "–") + "</dd>" + ((r.erros || []).length ? "<dt>Avisos</dt><dd>" + esc(r.erros.join(" · ")) + "</dd>" : "") + "<dt>Chave do Google</dt><dd>" + (j.google ? '<span class="pill ok">configurada</span>' : '<span class="pill warn">não configurada</span>') + "</dd></dl>" +
        '<div class="field"><label>Comando para o Cron Jobs da Hostinger (de hora em hora)</label><input readonly value="' + esc("curl -s \"" + j.diario + "\" > /dev/null") + '" onclick="this.select()"></div>' +
        '<form class="row" id="f-gk" style="gap:8px"><input type="password" id="gk" placeholder="Colar a chave da Google Places API" autocomplete="off" style="flex:1;min-width:220px;padding:10px 12px;border:1px solid var(--line);border-radius:10px;background:var(--surface);color:var(--ink)"><button class="btn sm" type="submit">Salvar chave</button></form>' +
        '<div class="row" style="gap:8px"><button type="button" class="btn ghost sm" data-diario>Rodar agora</button><button type="button" class="btn sm" data-diario-todos>Buscar fotos e avaliações do Google para o guia inteiro</button></div><p class="small muted">Fotos e avaliações reais vêm só pela API oficial do Google Places, com o nome do autor. A imagem oficial do site de cada lugar também entra. O guia inteiro leva alguns minutos.</p>';
      box.querySelector("#f-gk").onsubmit = function (e) { e.preventDefault(); Store.api("chave_google", { chave: box.querySelector("#gk").value.trim() }).then(function (x) { G.toast(x.msg); painelDiario(); }).catch(function (er) { G.toast(er.message); }); };
      box.querySelector("[data-diario-todos]").onclick = function (e) { var b = e.target; b.disabled = true; b.textContent = "Buscando no Google… (alguns minutos)"; fetch("api/?acao=atualizar_diario&forcar=1&todos=1", { credentials: "same-origin" }).then(function (x) { return x.json(); }).then(function (x) { b.disabled = false; b.textContent = "Buscar fotos e avaliações do Google para o guia inteiro"; G.toast((x.feito || []).concat(x.erros || []).join(" · ") || x.erro || "Pronto."); }).catch(function () { b.disabled = false; b.textContent = "Tentar de novo"; G.toast("O servidor demorou para responder. Veja o resultado em alguns minutos."); }); };
      box.querySelector("[data-diario]").onclick = function (e) { var b = e.target; b.disabled = true; b.textContent = "Rodando…"; fetch("api/?acao=atualizar_diario&forcar=1", { credentials: "same-origin" }).then(function (x) { return x.json(); }).then(function (x) { G.toast((x.feito || []).join(" · ") || x.msg || x.erro || "Pronto."); setTimeout(painelDiario, 1500); }).catch(function () { G.toast("Não foi possível rodar agora."); b.disabled = false; b.textContent = "Rodar agora"; }); };
    }).catch(function (er) { box.innerHTML = '<p class="small muted">' + esc(er.message || "Indisponível.") + "</p>"; });
  }
  function abaComunidade(el) {
    var c = G.config(), dm = c.destaqueMes || {}, robo = Store.obter("config", "robo") || {}, TA = window.Comunidade ? Comunidade.TIPOS_AL : {};
    var als = Store.lista("alertas").sort(function (a, b) { return (b.de || b.criadoEm || "").localeCompare(a.de || a.criadoEm || ""); });
    var cls = Store.lista("classificados").sort(function (a, b) { return (b.criadoEm || "").localeCompare(a.criadoEm || ""); });
    var cont = {}; Store.lista("interesse").forEach(function (i) { (i.cidades || []).forEach(function (x) { cont[x] = (cont[x] || 0) + 1; }); });
    var bras = Store.lista("lugares").filter(function (l) { return l.brasileiro; }).sort(function (a, b) { return String(a.nome).localeCompare(String(b.nome)); });
    el.innerHTML = '<div class="stack in" style="max-width:860px">' +
      '<div class="panel stack" style="gap:8px"><h3>Atualização automática</h3><p class="small muted">Um robô pesquisa todo dia no Google, em sites de eventos, turismo e hotelaria, e grava aqui: eventos novos, hotéis, avisos da comunidade e a cotação do dólar. Eventos que já passaram somem sozinhos.</p><dl class="kv"><dt>Última execução</dt><dd>' + esc(robo.ultimaExecucao || "ainda não rodou") + "</dd><dt>Resumo</dt><dd>" + esc(robo.resumo || "–") + "</dd><dt>Novos na última vez</dt><dd>" + esc(String(robo.adicionados == null ? "–" : robo.adicionados)) + "</dd></dl></div>" +
      (Store.servidor && Store.servidor() ? '<div class="panel stack" style="gap:10px" id="srv-diario"><h3>Atualização diária no servidor · 5h de Dallas</h3><p class="small muted">Carregando…</p></div>' : "") +
      '<div class="panel stack" style="gap:12px"><h3>Brasileiro do mês</h3><p class="small muted">Sem escolha, o guia escolhe sozinho todo mês entre os negócios brasileiros mais bem avaliados (anunciante Destaque primeiro).</p><div class="form2">' + sel("cm-bm", "Negócio", dm.lugar || "", [["", "Automático"]].concat(bras.map(function (l) { return [l.id, l.nome]; }))) + fld("cm-bmt", "Título (opcional)", dm.titulo || "") + fld("cm-bmx", "Texto (opcional)", dm.texto || "", { cls: "full", attr: "maxlength=300" }) + '</div><div><button class="btn" type="button" data-bm>Salvar</button></div></div>' +
      '<div class="panel stack" style="gap:12px"><h3>Avisos da comunidade</h3><form class="form2" id="f-al">' + sel("al-tipo", "Tipo", "consulado", Object.keys(TA).map(function (k) { return [k, TA[k][0]]; })) + fld("al-tit", "Título", "", { attr: "required maxlength=120" }) + fld("al-de", "De (data)", "", { attr: 'type="date"' }) + fld("al-ate", "Até (data)", "", { attr: 'type="date"' }) + fld("al-txt", "Texto", "", { cls: "full", attr: "maxlength=600" }) + fld("al-link", "Link (opcional)", "", { cls: "full", attr: 'placeholder="https://"' }) + '<div><button class="btn" type="submit">Adicionar aviso</button></div></form>' +
      '<div class="list">' + (als.map(function (a) { return '<div class="lrow" style="grid-template-columns:minmax(0,1fr) auto;padding:12px 16px;cursor:default"><span><b>' + esc(a.titulo) + "</b><small>" + esc((TA[a.tipo] || ["Aviso"])[0]) + (a.de ? " · " + esc(a.de) : "") + (a.ate ? " até " + esc(a.ate) : "") + (a.origem === "robo" ? " · pelo robô" : "") + '</small></span><button type="button" class="btn sm danger" data-del-al="' + esc(a.id) + '">Excluir</button></div>'; }).join("") || '<p class="muted small">Nenhum aviso.</p>') + "</div></div>" +
      '<div class="panel stack" style="gap:12px"><h3>Mural de classificados (' + cls.length + ')</h3><div class="list">' + (cls.slice(0, 60).map(function (x) { return '<div class="lrow" style="grid-template-columns:minmax(0,1fr) auto;padding:12px 16px;cursor:default"><span><b>' + esc(x.titulo) + "</b><small>" + esc(x.tipo || "") + " · " + esc((x.criadoEm || "").slice(0, 10)) + " · expira " + esc(x.expira || "") + " · " + esc(x.pago || "") + '</small></span><button type="button" class="btn sm danger" data-del-cl="' + esc(x.id) + '">Remover</button></div>'; }).join("") || '<p class="muted small">Nenhum classificado.</p>') + "</div></div>" +
      '<div class="panel stack" style="gap:8px"><h3>Interesse em outras cidades</h3><div class="kpis">' + (window.Comunidade ? Comunidade.CIDADES : []).map(function (k) { return '<div class="kpi"><b class="num">' + (cont[k[0]] || 0) + "</b><span>" + esc(k[0]) + "</span></div>"; }).join("") + "</div></div></div>";
    painelDiario();
    el.onclick = function (e) {
      if (e.target.closest("[data-bm]")) salvaCfg({ destaqueMes: { lugar: v("cm-bm"), titulo: v("cm-bmt"), texto: v("cm-bmx") } }, "Brasileiro do mês salvo.");
      var a = e.target.closest("[data-del-al]"); if (a) Store.apagar("alertas", a.dataset.delAl).then(function () { G.toast("Aviso excluído."); corpo(); }).catch(falha);
      var b = e.target.closest("[data-del-cl]"); if (b) Store.apagar("classificados", b.dataset.delCl).then(function () { G.toast("Classificado removido."); corpo(); }).catch(falha);
    };
    $("#f-al", el).onsubmit = function (e) {
      e.preventDefault(); var lk = v("al-link"); if (lk && !/^https:\/\//i.test(lk)) { G.toast("O link precisa começar com https://"); return; }
      Store.gravar("alertas", Store.novoId("al"), { tipo: v("al-tipo"), titulo: v("al-tit"), texto: v("al-txt"), de: v("al-de"), ate: v("al-ate"), link: lk, publicado: true, criadoEm: new Date().toISOString(), origem: "painel" }).then(function () { G.toast("Aviso publicado."); corpo(); }).catch(falha);
    };
  }

  dlg.addEventListener("close", function () { dlg.innerHTML = ""; ocupado = false; });
  window.Painel = { abrir: abrir, atualizar: atualizar };
})();
