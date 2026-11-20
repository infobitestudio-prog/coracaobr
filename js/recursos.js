/* Recursos de descoberta da CoraçãoBR, todos ligáveis e desligáveis no painel master (Painel → Recursos):
   "Agora", filtros de data e preço, etiquetas práticas, busca escrita, compartilhar busca, "Para você",
   várias sessões por evento, selos Esgotado/Cancelado/Encerrado, página de cada local, "Quem Recomendou",
   pesquisa com recompensa e newsletter por e-mail. O mapa fica em mapa.js e usa os filtros daqui. */
(function () {
  "use strict";
  var G = window.Guia; if (!G) return;
  var esc = G.esc, ic = G.ic, $ = function (s, r) { return (r || document).querySelector(s); };

  /* ---------- configuração (Painel → Recursos) ---------- */
  var REC_PADRAO = { vitrine: true, feed: true, mapa: true, mapaInicio: false, agora: true, filtros: true, etiquetas: true, busca: true, compartilhar: true, paraVoce: true, sessoes: true, local: true, recomendados: true, newsletter: true, pesquisa: false };
  function rec() { return Object.assign({}, REC_PADRAO, G.config().recursos || {}); }
  function on(k) { return rec()[k] !== false; }
  var ETQ_PADRAO = [
    { id: "criancas", nome: "Bom para crianças" }, { id: "pets", nome: "Aceita pets" }, { id: "acessivel", nome: "Acessível para cadeira de rodas" },
    { id: "lgbt", nome: "LGBT+ friendly" }, { id: "grupos", nome: "Bom para grupos" }, { id: "ar-livre", nome: "Ao ar livre" }, { id: "estacionamento", nome: "Estacionamento fácil" }
  ];
  function etiquetas(todas) { var c = G.config(), l = c.etiquetas && c.etiquetas.length ? c.etiquetas : ETQ_PADRAO; return todas ? l : l.filter(function (e) { return e.ativo !== false; }); }
  function nomeEtq(id) { var e = etiquetas(true).filter(function (x) { return x.id === id; })[0]; return e ? e.nome : id; }
  var INT_PADRAO = [
    { id: "brasil", nome: "Comida brasileira", cats: ["restaurante-brasileiro", "churrascaria", "padaria", "acai-cafe", "mercado-brasileiro"] },
    { id: "bbq", nome: "Churrasco e BBQ", cats: ["bbq", "churrascaria", "steakhouse"] },
    { id: "museus", nome: "Museus e arte", cats: ["museu", "arte", "historico"] },
    { id: "natureza", nome: "Parques e natureza", cats: ["parque", "natureza", "mirante"] },
    { id: "eventos", nome: "Shows e eventos", cats: ["evento", "show"] },
    { id: "familia", nome: "Família e crianças", cats: ["familia"], etq: ["criancas"] },
    { id: "compras", nome: "Compras", cats: ["compras"] },
    { id: "esporte", nome: "Esportes", cats: ["esporte"] },
    { id: "noite", nome: "Bares e vida noturna", cats: ["bar"] },
    { id: "gratis", nome: "Passeios grátis", gratis: true }
  ];
  function interesses() { var c = G.config().paraVoce || {}; return c.interesses && c.interesses.length ? c.interesses : INT_PADRAO; }
  function loc(k, v) { try { if (v === undefined) return JSON.parse(localStorage.getItem(k) || "null"); localStorage.setItem(k, JSON.stringify(v)); } catch (e) { return null; } }
  function meusInteresses() { var m = loc("interesses"); return Array.isArray(m) ? m : []; }

  /* ---------- datas e horários (horário de Dallas) ---------- */
  function hoje() { return G.hojeISO(); }
  function isoDe(d) { return d.getFullYear() + "-" + String(d.getMonth() + 1).padStart(2, "0") + "-" + String(d.getDate()).padStart(2, "0"); }
  function soma(iso, n) { var d = new Date(iso + "T12:00:00"); d.setDate(d.getDate() + n); return isoDe(d); }
  function diaSemana(iso) { return new Date(iso + "T12:00:00").getDay(); }
  function proximo(dow) { var h = hoje(), k = (dow - diaSemana(h) + 7) % 7; return soma(h, k); }
  function fds() { var h = hoje(), d = diaSemana(h), sex = d === 0 ? soma(h, -2) : d === 6 ? soma(h, -1) : soma(h, 5 - d); if (d === 5 || d === 6 || d === 0) sex = h; return [sex, soma(sex, d === 6 ? 1 : d === 0 ? 0 : 2)]; }
  function hm(t) { var m = String(t || "").match(/^(\d{1,2}):(\d{2})/); return m ? Number(m[1]) * 60 + Number(m[2]) : null; }
  function minAgora() { var n = window.Horario ? Horario.agoraDallas() : new Date(); return n.getHours() * 60 + n.getMinutes(); }
  var DIAS = ["Dom", "Seg", "Ter", "Qua", "Qui", "Sex", "Sáb"];
  function dataCurta(iso) { var p = String(iso).split("-"); return DIAS[diaSemana(iso)] + ", " + p[2] + "/" + p[1]; }

  function ehEvento(l) { return l && (l.categoria === "evento" || l.categoria === "show"); }
  function sessoes(l) {
    return (Array.isArray(l.sessoes) ? l.sessoes : []).filter(function (s) { return s && /^\d{4}-\d\d-\d\d$/.test(s.d || ""); })
      .sort(function (a, b) { return (a.d + (a.i || "")) < (b.d + (b.i || "")) ? -1 : 1; });
  }
  function intervalos(l) {
    var ss = sessoes(l); if (ss.length) return ss.map(function (s) { return { ini: s.d, fim: s.d }; });
    return l.dataInicio ? [{ ini: l.dataInicio, fim: l.dataFim || l.dataInicio }] : [];
  }
  function encerrado(l) { if (!ehEvento(l)) return false; var iv = intervalos(l), h = hoje(); return iv.length > 0 && iv.every(function (x) { return x.fim < h; }); }
  function noPeriodo(l, de, ate) { return intervalos(l).some(function (x) { return x.ini <= ate && x.fim >= de; }); }
  function acontecendoAgora(l) {
    if (l.cancelado || !ehEvento(l)) return false;
    var h = hoje(), m = minAgora(), ss = sessoes(l);
    if (ss.length) return ss.some(function (s) {
      var i = hm(s.i), f = hm(s.f); if (i == null) return false; if (f == null) f = i + 180;
      if (s.d === h) return f > i ? m >= i && m < f : m >= i;
      return f < i && s.d === soma(h, -1) && m < f;
    });
    if (!l.dataInicio || !(l.dataInicio <= h && (l.dataFim || l.dataInicio) >= h)) return false;
    var a = window.Horario ? Horario.agora(l) : null; return !!(a && a.aberto);
  }
  function abertoAgora(l) { return ehEvento(l) ? acontecendoAgora(l) : !!(window.Extras && Extras.aberto(l) === true); }
  function proximasSessoes(l) { var h = hoje(); return sessoes(l).filter(function (s) { return s.d >= h; }); }

  /* ---------- filtros ---------- */
  var FP = { q: "", agora: false, data: "", de: "", ate: "", preco: "", etq: [], grupo: "", cats: [], cidade: "", pv: false, kids: false };
  function novoFiltro() { return JSON.parse(JSON.stringify(FP)); }
  function norm(t) { return String(t || "").toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, ""); }
  function periodo(F) {
    var h = hoje();
    if (F.data === "hoje") return [h, h]; if (F.data === "amanha") return [soma(h, 1), soma(h, 1)];
    if (F.data === "fds") return fds(); if (F.data === "7d") return [h, soma(h, 6)];
    if (F.data === "dia" && F.de) return [F.de, F.de];
    if (F.data === "intervalo" && (F.de || F.ate)) return [F.de || h, F.ate || F.de || h];
    return null;
  }
  function precoOk(l, p) {
    if (!p) return true;
    var est = l.tipo === "estabelecimento", fx = String(l.faixaPreco || "");
    var gratis = !est && (l.gratuito || Number(l.precoMin) === 0);
    if (p === "gratis") return gratis;
    var lim = p === "20" ? 20 : 50;
    if (gratis) return true;
    var pz = G.precos ? G.precos(l) : null; if (pz && !pz.gratis) return (pz.med || pz.min) <= lim;
    if (est) return fx ? fx.length <= (lim === 20 ? 1 : 2) : false;
    return l.precoMin != null && Number(l.precoMin) > 0 && Number(l.precoMin) <= lim;
  }
  function interesseOk(l, ids) {
    var lst = interesses().filter(function (x) { return ids.indexOf(x.id) >= 0; });
    return lst.some(function (x) {
      if (x.gratis && precoOk(l, "gratis")) return true;
      if ((x.cats || []).indexOf(l.categoria) >= 0) return true;
      return (x.etq || []).some(function (e) { return (l.etiquetas || []).indexOf(e) >= 0; });
    });
  }
  function textoDe(l) { return norm([l.nome, G.CATS[l.categoria], l.bairro, l.cidade, l.historia, l.dica, l.quando, l.endereco].concat((l.etiquetas || []).map(nomeEtq)).join(" ")); }
  function passa(l, F, semTexto) {
    if (ehEvento(l) && (encerrado(l) || l.cancelado)) return false;
    if (F.agora && !abertoAgora(l)) return false;
    var p = periodo(F); if (p && !(ehEvento(l) && noPeriodo(l, p[0], p[1]))) return false;
    if (!precoOk(l, F.preco)) return false;
    if (F.etq.length && !F.etq.every(function (e) { return (l.etiquetas || []).indexOf(e) >= 0; })) return false;
    if (F.kids && !(l.categoria === "familia" || (l.etiquetas || []).indexOf("criancas") >= 0)) return false;
    if (F.grupo && G.GRUPOS[F.grupo] && !G.GRUPOS[F.grupo].f(l)) return false;
    if (F.cats.length && F.cats.indexOf(l.categoria) < 0) return false;
    if (F.cidade && norm(l.cidade) !== norm(F.cidade)) return false;
    if (F.pv && !interesseOk(l, meusInteresses())) return false;
    if (!semTexto && F.q) { var t = textoDe(l); if (!norm(F.q).split(/\s+/).filter(Boolean).every(function (w) { return t.indexOf(w) >= 0; })) return false; }
    return true;
  }
  function aplica(F, lista) {
    var ls = lista || G.lugares(), r = ls.filter(function (l) { return passa(l, F); }), relaxou = false;
    if (!r.length && F.q) { var r2 = ls.filter(function (l) { return passa(l, F, true); }); if (r2.length && (F.data || F.agora || F.cats.length || F.grupo || F.preco || F.etq.length || F.cidade || F.kids)) { r = r2; relaxou = true; } }
    return { lista: r, relaxou: relaxou };
  }

  /* ---------- busca escrita (português, inglês e espanhol) ---------- */
  var CAT_RX = [
    [/restaurante brasileiro|comida brasileira|brazilian (food|restaurant)|comida brasilena|restaurantes? brasileiros?/, { cats: ["restaurante-brasileiro"] }],
    [/churrascaria|rodizio/, { cats: ["churrascaria"] }],
    [/churrasco|\bbbq\b|barbecue|barbacoa|brisket/, { cats: ["bbq", "churrascaria", "steakhouse"] }],
    [/steak|carne/, { cats: ["steakhouse", "churrascaria", "bbq"] }],
    [/tex.?mex|mexican|mexicana|\btacos?\b/, { cats: ["tex-mex"] }],
    [/hamburg|burger/, { cats: ["hamburguer"] }], [/pizza/, { cats: ["pizza"] }],
    [/brunch|cafe da manha|breakfast|\bcafe\b|coffee|cafeteria/, { cats: ["brunch-cafe", "acai-cafe"] }], [/acai/, { cats: ["acai-cafe"] }],
    [/padaria|bakery|panaderia|pao de queijo/, { cats: ["padaria"] }], [/mercado brasileiro|brazilian market|mercadinho|produtos brasileiros/, { cats: ["mercado-brasileiro"] }],
    [/japones|sushi|asiatic|chines|ramen|asian/, { cats: ["asiatico"] }],
    [/museu|museum|museo/, { cats: ["museu"] }], [/\barte\b|\bart\b|galeria|gallery/, { cats: ["arte", "museu"] }],
    [/parque|\bpark|natureza|nature|trilha|\btrail|jardim|garden/, { cats: ["parque", "natureza"] }], [/mirante|vista|observation|skyline/, { cats: ["mirante"] }],
    [/historic|historia|history/, { cats: ["historico"] }],
    [/\bshows?\b|concert|musica|music|samba|pagode|sertanejo|forro|banda|\bdj\b|\bfesta|party|fiesta|balada/, { cats: ["show", "evento"] }],
    [/evento|event|festival|feira|\bfair\b|feria|natal|christmas|halloween|rodeo|rodeio/, { cats: ["evento", "show"] }],
    [/\bbar\b|bares|\bpub\b|cerveja|beer|drinks?|vida noturna|nightlife|happy hour/, { cats: ["bar"] }],
    [/compras|shopping|outlet|\bloja|\bstore/, { cats: ["compras"] }],
    [/esporte|sports?|\bjogo\b|\bgame\b|cowboys|mavericks|rangers|\bstars\b|futebol|soccer/, { cats: ["esporte"] }],
    [/crianca|kids|\bfamilia|family|ninos|familiar|infantil/, { kids: true }],
    [/\bpets?\b|cachorro|\bdogs?\b|perro/, { etq: ["pets"] }], [/acessivel|cadeira de rodas|wheelchair|accesible|cadeirante/, { etq: ["acessivel"] }],
    [/lgbt|\bgay\b|queer/, { etq: ["lgbt"] }], [/ao ar livre|outdoor|aire libre/, { etq: ["ar-livre"] }],
    [/brasileir|brazilian|brasilen/, { grupo: "brasileiros" }],
    [/servico|handyman|faxina|limpeza|cleaning|\bbaba\b|babysit|contador|imigracao|advogad|mecanic/, { grupo: "servicos" }]
  ];
  var VAZIAS = "de do da dos das em no na nos nas para pra com um uma uns umas o a os as que e ou the in at for to on with a an and or y el la los las en con un una que neste nesta nesse nessa este esta esse essa hoje amanha agora aberto aberta abertos open now quero ir lugar lugares perto onde algo alguma algum tem ter ver fazer opcoes opcao barato barata baratos gratis gratuito gratuita free near me cerca semana fim final fds weekend sabado domingo sexta saturday sunday friday tonight noite manha tarde dia dias proximos proximo proxima this next today tomorrow manana hoy ahora finde barata cheap dolares dolar usd ate under menos hasta mais pelo pela vivo ao live musica music show shows".split(" ");
  function sinonimosMaster() {
    var txt = ((G.config().busca || {}).sinonimos) || "", out = [];
    String(txt).split(/\n+/).forEach(function (ln) {
      var p = ln.split("="); if (p.length !== 2) return; var termo = norm(p[0]).trim(); if (!termo) return;
      var alvo = { cats: [], etq: [] };
      p[1].split(",").forEach(function (x) { x = x.trim(); if (/^etiqueta:/i.test(x)) alvo.etq.push(x.slice(9).trim()); else if (/^grupo:/i.test(x)) alvo.grupo = x.slice(6).trim(); else if (x) alvo.cats.push(x); });
      out.push([new RegExp("\\b" + termo.replace(/[.*+?^${}()|[\]\\]/g, "\\$&") + "\\b"), alvo]);
    });
    return out;
  }
  function interpreta(frase) {
    var F = novoFiltro(), t = " " + norm(frase).replace(/[^a-z0-9$ ]/g, " ").replace(/\s+/g, " ") + " ", ent = [];
    var cidades = {}; G.lugares().forEach(function (l) { if (l.cidade) cidades[norm(l.cidade)] = l.cidade; });
    function tira(rx) { t = t.replace(rx, " "); }
    // quando
    if (/\b(agora|aberto agora|abertos agora|open now|ahora|right now)\b/.test(t)) { F.agora = true; ent.push("Agora"); tira(/\b(aberto agora|abertos agora|open now|right now|agora|ahora)\b/g); }
    if (/\b(hoje|today|hoy|tonight|esta noche|hoje a noite)\b/.test(t)) { F.data = "hoje"; ent.push("Hoje"); }
    else if (/\b(amanha|tomorrow|manana)\b/.test(t)) { F.data = "amanha"; ent.push("Amanhã"); }
    else if (/\b(fim de semana|final de semana|fds|weekend|finde|fin de semana)\b/.test(t)) { F.data = "fds"; ent.push("Este fim de semana"); }
    else if (/\b(sabado|saturday)\b/.test(t)) { F.data = "dia"; F.de = proximo(6); ent.push("Sábado"); }
    else if (/\b(domingo|sunday)\b/.test(t)) { F.data = "dia"; F.de = proximo(0); ent.push("Domingo"); }
    else if (/\b(sexta|friday|viernes)\b/.test(t)) { F.data = "dia"; F.de = proximo(5); ent.push("Sexta"); }
    else if (/\b(esta semana|this week|proximos dias|proxima semana|next week|semana que vem)\b/.test(t)) { F.data = "7d"; ent.push("Próximos 7 dias"); }
    // quanto
    var lim = t.match(/\b(?:ate|under|menos de|hasta|max)\s*(?:us\s*)?\$?\s*(\d{1,4})/);
    if (/\b(gratis|gratuito|gratuita|de graca|free|sem pagar|sin costo)\b/.test(t)) { F.preco = "gratis"; ent.push("Grátis"); }
    else if (lim) { F.preco = Number(lim[1]) <= 20 ? "20" : "50"; ent.push(F.preco === "20" ? "Até US$ 20" : "Até US$ 50"); tira(/\b(?:ate|under|menos de|hasta|max)\s*(?:us\s*)?\$?\s*\d{1,4}/); }
    else if (/\b(barat|cheap|economic)/.test(t)) { F.preco = "20"; ent.push("Até US$ 20"); }
    // o quê
    sinonimosMaster().concat(CAT_RX).forEach(function (par) {
      if (!par[0].test(t)) return; var a = par[1]; t = t.replace(new RegExp(par[0].source, "g"), " ");
      if (a.cats && a.cats.length) a.cats.forEach(function (c) { if (F.cats.indexOf(c) < 0) F.cats.push(c); });
      if (a.etq) a.etq.forEach(function (e) { if (F.etq.indexOf(e) < 0) { F.etq.push(e); ent.push(nomeEtq(e)); } });
      if (a.grupo && G.GRUPOS[a.grupo]) { F.grupo = a.grupo; ent.push(G.GRUPOS[a.grupo].nome || a.grupo); }
      if (a.kids) { F.kids = true; ent.push("Para crianças"); }
    });
    if (F.cats.length) ent.push(F.cats.map(function (c) { return G.CATS[c] || c; }).slice(0, 3).join(" ou "));
    // onde
    Object.keys(cidades).sort(function (a, b) { return b.length - a.length; }).some(function (c) { if (t.indexOf(" " + c + " ") >= 0) { F.cidade = cidades[c]; ent.push(cidades[c]); t = t.replace(" " + c + " ", " "); return true; } return false; });
    // o que sobrou vira texto
    var resto = t.split(" ").filter(function (w) { return w.length > 2 && VAZIAS.indexOf(w) < 0 && !/^\d+$/.test(w); });
    F.q = resto.join(" ");
    if (F.q) ent.push("“" + F.q + "”");
    return { F: F, entendi: ent };
  }

  /* ---------- link de compartilhar: #busca-agora-fds-gratis-cmuseu-qsamba ---------- */
  function slug(t) { return norm(t).replace(/[^a-z0-9]+/g, "").slice(0, 24); }
  function paraLink(F) {
    var p = [];
    if (F.agora) p.push("agora");
    if (F.data === "hoje" || F.data === "amanha" || F.data === "fds" || F.data === "7d") p.push(F.data);
    if ((F.data === "dia" || F.data === "intervalo") && F.de) p.push("d" + F.de.replace(/-/g, "")); if (F.data === "intervalo" && F.ate) p.push("a" + F.ate.replace(/-/g, ""));
    if (F.preco === "gratis") p.push("gratis"); else if (F.preco) p.push("ate" + F.preco);
    if (F.kids) p.push("kids"); if (F.pv) p.push("pv");
    if (F.grupo) p.push("g" + F.grupo);
    F.cats.forEach(function (c) { p.push("c" + c.replace(/-/g, "_")); });
    F.etq.forEach(function (e) { p.push("e" + e.replace(/-/g, "_")); });
    if (F.cidade) p.push("cid" + slug(F.cidade));
    if (F.q) norm(F.q).split(/\s+/).filter(Boolean).slice(0, 5).forEach(function (w) { p.push("q" + slug(w)); });
    return "busca-" + (p.join("-") || "tudo");
  }
  function deLink(h) {
    var F = novoFiltro(), qs = [];
    var cidades = {}; G.lugares().forEach(function (l) { if (l.cidade) cidades[slug(l.cidade)] = l.cidade; });
    String(h).replace(/^#?busca-/, "").split("-").forEach(function (tk) {
      if (tk === "agora") F.agora = true; else if (/^(hoje|amanha|fds|7d)$/.test(tk)) F.data = tk;
      else if (/^d\d{8}$/.test(tk)) { F.de = tk.slice(1, 5) + "-" + tk.slice(5, 7) + "-" + tk.slice(7); F.data = F.data || "dia"; }
      else if (/^a\d{8}$/.test(tk)) { F.ate = tk.slice(1, 5) + "-" + tk.slice(5, 7) + "-" + tk.slice(7); F.data = "intervalo"; }
      else if (tk === "gratis") F.preco = "gratis"; else if (tk === "ate20") F.preco = "20"; else if (tk === "ate50") F.preco = "50";
      else if (tk === "kids") F.kids = true; else if (tk === "pv") F.pv = true;
      else if (/^cid/.test(tk)) F.cidade = cidades[tk.slice(3)] || "";
      else if (/^g[a-z]+$/.test(tk) && G.GRUPOS[tk.slice(1)]) F.grupo = tk.slice(1);
      else if (/^c[a-z_]+$/.test(tk)) F.cats.push(tk.slice(1).replace(/_/g, "-"));
      else if (/^e[a-z_]+$/.test(tk)) F.etq.push(tk.slice(1).replace(/_/g, "-"));
      else if (/^q[a-z0-9]+$/.test(tk)) qs.push(tk.slice(1));
    });
    F.q = qs.join(" ");
    return F;
  }
  function compartilhar(F, titulo) {
    var u = location.href.split("#")[0] + "#" + paraLink(F);
    if (navigator.share) { navigator.share({ title: "CoraçãoBR", text: titulo || "Veja no CoraçãoBR", url: u }).catch(function () {}); return; }
    (navigator.clipboard ? navigator.clipboard.writeText(u) : Promise.reject()).then(function () { G.toast("Link copiado. Cole no WhatsApp ou onde quiser."); }).catch(function () { prompt("Copie o link:", u); });
  }
  function rotulo(F) {
    var p = [], per = periodo(F);
    if (F.agora) p.push("Agora");
    if (F.data === "hoje") p.push("Hoje"); else if (F.data === "amanha") p.push("Amanhã"); else if (F.data === "fds") p.push("Este fim de semana"); else if (F.data === "7d") p.push("Próximos 7 dias");
    else if (per) p.push(per[0] === per[1] ? dataCurta(per[0]) : dataCurta(per[0]) + " a " + dataCurta(per[1]));
    if (F.preco === "gratis") p.push("Grátis"); else if (F.preco) p.push("Até US$ " + F.preco);
    if (F.pv) p.push("Para você"); if (F.kids) p.push("Para crianças");
    if (F.grupo && G.GRUPOS[F.grupo]) p.push(G.GRUPOS[F.grupo].nome || F.grupo);
    if (F.cats.length) p.push(F.cats.map(function (c) { return G.CATS[c] || c; }).slice(0, 2).join(" ou "));
    F.etq.forEach(function (e) { p.push(nomeEtq(e)); });
    if (F.cidade) p.push(F.cidade); if (F.q) p.push("“" + F.q + "”");
    return p;
  }
  /* Busca da página inicial: entende a frase e abre o mapa com os filtros. Devolve false para usar a busca antiga. */
  function buscar(frase) {
    if (!frase || !on("busca") || !on("mapa")) return false;
    var r = interpreta(frase);
    try { sessionStorage.setItem("busca-entendi", JSON.stringify({ frase: frase, entendi: r.entendi })); } catch (e) { /* ok */ }
    location.hash = paraLink(r.F);
    return true;
  }

  /* ---------- selos e blocos na página do lugar ---------- */
  function selos(l) {
    var h = "";
    if (ehEvento(l)) {
      if (l.cancelado) h += '<span class="badge selo-x">Cancelado</span>';
      else if (encerrado(l)) h += '<span class="badge selo-x">Evento encerrado</span>';
      else if (on("agora") && acontecendoAgora(l)) h += '<span class="badge selo-ok"><i class="dot" style="background:#2E8B57"></i>Acontecendo agora</span>';
      if (l.esgotado && !l.cancelado) h += '<span class="badge selo-x">Esgotado</span>';
      var ps = proximasSessoes(l); if (on("sessoes") && ps.length > 1) h += '<span class="badge">' + ps.length + " sessões</span>";
    }
    if (on("etiquetas")) (l.etiquetas || []).forEach(function (e) { if (etiquetas().some(function (x) { return x.id === e; })) h += '<span class="badge etq">' + esc(nomeEtq(e)) + "</span>"; });
    return h;
  }
  function gcal(l, s) {
    var d = s.d.replace(/-/g, ""), i = (s.i || "").replace(":", ""), f = (s.f || "").replace(":", "");
    var datas = i ? d + "T" + i + "00/" + (f && f > i ? d : String(Number(d) + 0)) + "T" + (f || i) + "00" : d + "/" + soma(s.d, 1).replace(/-/g, "");
    return "https://calendar.google.com/calendar/render?action=TEMPLATE&text=" + encodeURIComponent(l.nome) + "&dates=" + datas + "&ctz=America/Chicago&location=" + encodeURIComponent(l.endereco || l.cidade || "");
  }
  function eventosAqui(l) { var k = G.chaveLocal(l); return G.lugares().filter(function (o) { return ehEvento(o) && !encerrado(o) && !o.cancelado && (G.chaveLocal(o) === k || o.localId === l.id || (l.localId && o.localId === l.localId)); }); }
  function venueDe(l) {
    if (l.localId) return Store.obter("lugares", l.localId);
    var k = G.chaveLocal(l); return G.lugares().filter(function (o) { return !ehEvento(o) && o.id !== l.id && G.chaveLocal(o) === k; })[0] || null;
  }
  function parceiros() { return Store.lista("parceiros").filter(function (p) { return p.ativo !== false && p.nome; }); }
  function parceiro(id) { return parceiros().filter(function (p) { return p.id === id; })[0]; }
  function fotoP(p) { return p.foto ? Store.urlFoto(p.foto) : ""; }
  function blocoLugar(l) {
    var h = "";
    if (ehEvento(l) && on("sessoes")) {
      var ss = proximasSessoes(l);
      if (ss.length) h += '<div class="panel stack sessoes" style="gap:8px"><h3 style="margin:0">' + (ss.length > 1 ? "Escolha a sessão" : "Data e horário") + '</h3><div class="list">' + ss.slice(0, 20).map(function (s) {
        return '<div class="lrow sess" style="cursor:default"><span><b>' + esc(dataCurta(s.d)) + (s.i ? " · " + esc(s.i) + (s.f ? "–" + esc(s.f) : "") : "") + "</b><small>" + esc([s.p != null && s.p !== "" ? (Number(s.p) === 0 ? "Grátis" : "US$ " + s.p) : "", s.obs || "", s.esgotado ? "Esgotada" : ""].filter(Boolean).join(" · ")) + '</small></span><a class="btn ghost sm" target="_blank" rel="noopener" href="' + esc(gcal(l, s)) + '">Agenda</a></div>';
      }).join("") + "</div></div>";
    }
    if (on("local") && ehEvento(l)) { var v = venueDe(l), n = eventosAqui(l).length; if (v || n > 1) h += '<a class="lrow" style="grid-template-columns:minmax(0,1fr) auto;padding:14px 16px" href="#local-' + esc(v ? v.id : l.id) + '"><span><b>' + esc(v ? v.nome : "Tudo neste local") + "</b><small>" + (n > 1 ? n + " eventos neste local" : "Ver o local") + "</small></span>" + ic("arrow") + "</a>"; }
    if (on("recomendados")) {
      var rs = (l.recomendacoes || []).map(function (r) { return { r: r, p: parceiro(r.p) }; }).filter(function (x) { return x.p; });
      if (rs.length) h += '<div class="panel stack recs" style="gap:10px"><h3 style="margin:0">Quem recomendou</h3>' + rs.map(function (x) {
        return '<a class="rec" href="#parceiro-' + esc(x.p.id) + '">' + (fotoP(x.p) ? '<img src="' + esc(fotoP(x.p)) + '" alt="">' : '<span class="av">' + esc(x.p.nome.charAt(0)) + "</span>") + "<span><b>" + esc(x.p.nome) + (x.p.pago ? ' <span class="pill warn">Parceria paga</span>' : "") + "</b><small>" + esc(x.p.tipo || "") + "</small>" + (x.r.t ? "<q>" + esc(x.r.t) + "</q>" : "") + "</span></a>";
      }).join("") + "</div>";
    }
    return h;
  }

  /* ---------- página do local ---------- */
  function viewLocal(r) {
    var id = String(r).replace(/^local-/, ""), l = Store.obter("lugares", id);
    if (!l || !on("local")) { G.app.innerHTML = '<section class="block"><div class="wrap narrow"><h1 class="page-h">Local não encontrado</h1><p><a href="#mapa">Ver o mapa</a></p></div></section>'; return; }
    var evs = eventosAqui(l);
    evs.sort(function (a, b) { var x = (proximasSessoes(a)[0] || {}).d || a.dataInicio || "9999", y = (proximasSessoes(b)[0] || {}).d || b.dataInicio || "9999"; return x < y ? -1 : 1; });
    var f = G.foto(l), nome = ehEvento(l) ? (String(l.endereco || "").split(",")[0] || l.nome) : l.nome;
    G.app.innerHTML = '<section class="block"><div class="wrap stack" style="max-width:860px">' +
      '<div class="local-top">' + (f && !ehEvento(l) ? '<img src="' + esc(f) + '" alt="">' : "") + '<div><p class="eyebrow">' + esc(ehEvento(l) ? "Local" : (G.CATS[l.categoria] || "Local")) + " · " + esc(l.cidade || "") + '</p><h1 class="page-h" style="margin-top:4px">' + esc(nome) + "</h1>" +
      (l.endereco ? '<p class="muted">' + esc(l.endereco) + "</p>" : "") + '<div class="row" style="gap:8px;margin-top:10px">' + (!ehEvento(l) ? '<a class="btn sm" href="#lugar-' + esc(l.id) + '">Ver o lugar</a>' : "") + '<a class="btn ghost sm" target="_blank" rel="noopener" href="https://www.google.com/maps/dir/?api=1&destination=' + encodeURIComponent([nome, l.endereco].filter(Boolean).join(", ")) + '">Como chegar</a></div></div></div>' +
      '<div class="head"><h2>' + (evs.length ? "Próximos eventos aqui" : "Nenhum evento marcado") + '</h2><span class="more">' + evs.length + "</span></div>" +
      (evs.length ? '<div class="list">' + evs.map(function (o) { var ps = proximasSessoes(o); return '<a class="lrow nopos" href="#lugar-' + esc(o.id) + '"><span class="th">' + (G.foto(o) ? '<img src="' + esc(G.foto(o)) + '" alt="" loading="lazy">' : "") + "</span><span><b>" + esc(o.nome) + "</b><small>" + esc(ps.length ? dataCurta(ps[0].d) + (ps.length > 1 ? " · +" + (ps.length - 1) + (ps.length === 2 ? " sessão" : " sessões") : "") : (o.quando || "")) + (o.esgotado ? " · Esgotado" : "") + '</small></span><span class="val">' + esc(G.precoCurto ? (G.precoCurto(o) === "Pago" ? "" : G.precoCurto(o)) : "") + "</span></a>"; }).join("") + "</div>" : '<p class="muted">Quando houver eventos neste local, eles aparecem aqui.</p>') +
      "</div></section>";
  }
  /* ---------- página do parceiro ---------- */
  function viewParceiro(r) {
    var p = parceiro(String(r).replace(/^parceiro-/, ""));
    if (!p || !on("recomendados")) { G.app.innerHTML = '<section class="block"><div class="wrap narrow"><h1 class="page-h">Parceiro não encontrado</h1></div></section>'; return; }
    var ls = G.lugares().filter(function (l) { return (l.recomendacoes || []).some(function (x) { return x.p === p.id; }); });
    var ig = String(p.instagram || "").replace(/^@/, "");
    G.app.innerHTML = '<section class="block"><div class="wrap stack" style="max-width:860px"><div class="perfil">' + (fotoP(p) ? '<img class="avatar" src="' + esc(fotoP(p)) + '" alt="" style="object-fit:cover">' : '<span class="avatar">' + esc(p.nome.charAt(0)) + "</span>") +
      '<div class="stack" style="gap:6px"><p class="eyebrow">' + esc(p.tipo || "Quem recomenda") + (p.pago ? ' · <span class="pill warn">Parceria paga</span>' : "") + '</p><h1 class="page-h" style="margin-top:2px">' + esc(p.nome) + "</h1>" + (p.bio ? '<p class="muted">' + esc(p.bio) + "</p>" : "") + (ig ? '<a class="more" target="_blank" rel="noopener" href="https://instagram.com/' + esc(ig) + '">@' + esc(ig) + "</a>" : "") + "</div></div>" +
      '<div class="head"><h2>Recomendações</h2><span class="more">' + ls.length + "</span></div>" + (ls.length ? '<div class="grid">' + ls.map(G.card).join("") + "</div>" : '<p class="muted">Ainda sem recomendações publicadas.</p>') + "</div></section>";
  }

  /* ---------- Para você ---------- */
  function abreInteresses(depois) {
    var dlg = $("#dlg"), sel = meusInteresses().slice(), cfg = G.config().paraVoce || {};
    dlg.innerHTML = '<form method="dialog" class="pv-dlg"><div class="dlg-head"><h3>' + esc(cfg.titulo || "O que mais te interessa?") + '</h3><button type="button" class="btn sm ghost" data-fechar>Fechar</button></div><div class="dlg-body stack"><p class="muted">Escolha ao menos 2. Você pode mudar quando quiser em Minha conta.</p><div class="pv-op">' +
      interesses().map(function (x) { return '<button type="button" class="chip" data-int="' + esc(x.id) + '" aria-pressed="' + (sel.indexOf(x.id) >= 0) + '">' + esc(x.nome) + "</button>"; }).join("") +
      '</div></div><div class="dlg-foot"><button type="button" class="btn ghost" data-fechar>Agora não</button><button class="btn" type="button" data-salvar-int' + (sel.length < 2 ? " disabled" : "") + ">Salvar</button></div></form>";
    dlg.showModal();
    dlg.onclick = function (e) {
      var c = e.target.closest("[data-int]");
      if (c) { var i = sel.indexOf(c.dataset.int); if (i >= 0) sel.splice(i, 1); else sel.push(c.dataset.int); c.setAttribute("aria-pressed", i < 0); $("[data-salvar-int]", dlg).disabled = sel.length < 2; return; }
      if (e.target.closest("[data-fechar]")) { dlg.close(); return; }
      if (e.target.closest("[data-salvar-int]")) { loc("interesses", sel); dlg.close(); G.toast("Pronto. Separamos o que combina com você."); if (depois) depois(); else if (G.render) G.render(); }
    };
  }

  /* ---------- seções da página inicial ---------- */
  function secao(k, ls) {
    if (k === "paraVoce" && on("paraVoce")) {
      var ids = meusInteresses(), cfg = G.config().paraVoce || {};
      if (ids.length < 2) return '<section class="block reveal"><div class="panel pv-convite"><div><h3>' + esc(cfg.titulo || "O que mais te interessa?") + '</h3><p class="muted small">Escolha seus interesses e o guia separa o que combina com você.</p></div><button type="button" class="btn" data-abre-int>Escolher interesses</button></div></section>';
      var lst = G.primeiro(ls.filter(function (l) { return interesseOk(l, ids) && !(ehEvento(l) && encerrado(l)); }).sort(G.ordenaNota)).slice(0, 12);
      return lst.length ? '<section class="block reveal"><div class="head"><h2>Para você</h2><span class="row" style="gap:12px"><button type="button" class="more" data-abre-int>mudar interesses</button>' + (on("mapa") ? '<a class="more" href="#busca-pv">ver no mapa</a>' : "") + '</span></div><div class="hscroll">' + lst.map(G.card).join("") + "</div></section>" : "";
    }
    if (k === "agora" && on("agora")) {
      var ag = ls.filter(function (l) { return ehEvento(l) && acontecendoAgora(l); });
      return ag.length ? '<section class="block reveal"><div class="head"><h2><i class="dot vivo"></i> Acontecendo agora</h2>' + (on("mapa") ? '<a class="more" href="#busca-agora">ver no mapa</a>' : "") + '</div><div class="hscroll">' + ag.map(G.card).join("") + "</div></section>" : "";
    }
    if (k === "newsletter" && on("newsletter") && Store.servidor && Store.servidor()) {
      var nc = G.config().newsletterTexto || {};
      return '<section class="block reveal"><form class="panel news" id="f-news" novalidate><div><h3>' + esc(nc.titulo || "A semana no CoraçãoBR, no seu e-mail") + '</h3><p class="muted small">' + esc(nc.texto || "Eventos da semana e lugares que valem a visita. Um e-mail por semana, sem spam.") + '</p></div><div class="row" style="gap:8px"><label class="sr" for="news-email">Seu e-mail</label><input id="news-email" type="email" placeholder="seu@email.com" autocomplete="email" required style="flex:1;min-width:0;padding:11px 12px;border:1px solid var(--line);border-radius:12px;background:var(--surface);color:var(--ink);font:inherit"><input type="text" name="site" tabindex="-1" autocomplete="off" aria-hidden="true" style="position:absolute;left:-9999px" id="news-site"><button class="btn" type="submit">Quero receber</button></div><p class="small" id="news-msg" hidden></p></form></section>';
    }
    return "";
  }
  document.addEventListener("click", function (e) { if (e.target.closest("[data-abre-int]")) abreInteresses(); });
  document.addEventListener("submit", function (e) {
    var f = e.target; if (f.id !== "f-news") return; e.preventDefault();
    var m = $("#news-msg"), em = $("#news-email").value.trim(); if (!em) return;
    Store.api("newsletter_inscrever", { email: em, site: $("#news-site").value, origem: "inicio" }).then(function (j) { m.hidden = false; m.textContent = j.msg; f.querySelector("button").disabled = true; }).catch(function (er) { m.hidden = false; m.textContent = er.message; });
  });

  /* ---------- pesquisa com recompensa ---------- */
  function pesquisa() { var p = G.config().pesquisa; return p && p.id && p.ativa && on("pesquisa") && (p.perguntas || []).length ? p : null; }
  var pesqTimer = null;
  function agendaPesquisa() {
    clearTimeout(pesqTimer); var p = pesquisa(); if (!p) return;
    if (loc("pesq-" + p.id)) return;
    pesqTimer = setTimeout(function tenta() {
      if (!pesquisa()) return;
      var livre = /^(#|#inicio|#explorar|#ranking|)$/.test(location.hash) && !$("dialog[open]") && !document.querySelector(".sheet.on");
      if (livre) mostraConvitePesquisa(p); else pesqTimer = setTimeout(tenta, 15000);
    }, Math.max(5, Number(p.atraso) || 45) * 1000);
  }
  function mostraConvitePesquisa(p) {
    if ($("#pesq-card")) return;
    var d = document.createElement("div"); d.id = "pesq-card"; d.className = "pesq-card"; d.setAttribute("role", "dialog"); d.setAttribute("aria-label", p.titulo || "Pesquisa");
    d.innerHTML = "<b>" + esc(p.titulo || "Ajude a melhorar o CoraçãoBR") + "</b><p>" + esc(p.convite || "Responda em 1 minuto.") + (p.recompensa ? " <strong>" + esc(p.recompensa) + "</strong>" : "") + '</p><div class="row" style="gap:8px"><button type="button" class="btn sm" data-pesq-sim>Responder</button><button type="button" class="btn ghost sm" data-pesq-nao>Agora não</button></div>';
    document.body.appendChild(d);
  }
  function formPesquisa(p) {
    var dlg = $("#dlg");
    if (Store.servidor && Store.servidor() && !Store.conta()) { try { sessionStorage.setItem("depois-login", location.hash || "#inicio"); } catch (e) { /* ok */ } G.toast("Entre na sua conta para responder e receber a recompensa."); location.hash = "#entrar"; return; }
    dlg.innerHTML = '<form method="dialog" id="f-pesq"><div class="dlg-head"><h3>' + esc(p.titulo || "Pesquisa") + '</h3><button type="button" class="btn sm ghost" data-fechar>Fechar</button></div><div class="dlg-body stack">' + (p.descricao ? '<p class="muted">' + esc(p.descricao) + "</p>" : "") +
      p.perguntas.map(function (q, i) {
        var id = "pq" + i, lbl = '<label for="' + id + '"><b>' + esc(q.texto) + "</b></label>";
        if (q.tipo === "nota") return '<div class="field">' + lbl + '<select id="' + id + '"><option value="">Escolha</option>' + [5, 4, 3, 2, 1].map(function (n) { return "<option>" + n + "</option>"; }).join("") + "</select></div>";
        if (q.tipo === "escolha") return '<div class="field">' + lbl + '<select id="' + id + '"><option value="">Escolha</option>' + (q.opcoes || []).map(function (o) { return "<option>" + esc(o) + "</option>"; }).join("") + "</select></div>";
        return '<div class="field">' + lbl + '<textarea id="' + id + '" maxlength="600"></textarea></div>';
      }).join("") +
      (p.recompensa ? '<div class="field"><label for="pq-pix"><b>Sua chave PIX ou Zelle, para a recompensa</b></label><input id="pq-pix" maxlength="120"></div>' : "") +
      '<p class="small" id="pq-msg" hidden></p></div><div class="dlg-foot"><button type="button" class="btn ghost" data-fechar>Cancelar</button><button class="btn" type="submit">Enviar respostas</button></div></form>';
    dlg.showModal();
    dlg.onclick = function (e) { if (e.target.closest("[data-fechar]")) dlg.close(); };
    $("#f-pesq", dlg).onsubmit = function (e) {
      e.preventDefault();
      var resp = p.perguntas.map(function (q, i) { return { pergunta: q.texto, resposta: $("#pq" + i, dlg).value.trim() }; });
      if (resp.some(function (r, i) { return p.perguntas[i].obrigatoria !== false && !r.resposta; })) { var m = $("#pq-msg", dlg); m.hidden = false; m.textContent = "Responda todas as perguntas."; return; }
      Store.gravar("respostas", Store.idProprio(p.id), { pesquisa: p.id, titulo: p.titulo || "", respostas: resp, pix: ($("#pq-pix", dlg) || {}).value || "", em: new Date().toISOString(), nome: Store.nome() || "", pago: false })
        .then(function () { loc("pesq-" + p.id, "respondida"); dlg.close(); G.toast("Obrigado! Recebemos suas respostas."); })
        .catch(function (er) { var m = $("#pq-msg", dlg); m.hidden = false; m.textContent = er.message || "Não foi possível enviar."; });
    };
  }
  document.addEventListener("click", function (e) {
    var p = pesquisa();
    if (e.target.closest("[data-pesq-nao]")) { var c = $("#pesq-card"); if (c) c.remove(); if (p) loc("pesq-" + p.id, "dispensada"); }
    if (e.target.closest("[data-pesq-sim]")) { var c2 = $("#pesq-card"); if (c2) c2.remove(); if (p) formPesquisa(p); }
  });

  /* ---------- navegação: link do Mapa e mapa como início ---------- */
  function navegacao() {
    var r = rec();
    Array.from(document.querySelectorAll('[data-nav-rec="mapa"]')).forEach(function (a) { a.hidden = !r.mapa; });
    if (r.mapa && r.mapaInicio && (!location.hash || location.hash === "#" || location.hash === "#inicio") && !sessionStorage.getItem("viu-inicio")) {
      try { sessionStorage.setItem("viu-inicio", "1"); } catch (e) { /* ok */ }
      location.replace("#mapa");
    }
  }
  var pronto = false;
  Store.assinar(function (col) {
    if (!Store.estado.pronto) return;
    if (!pronto) { pronto = true; navegacao(); agendaPesquisa(); }
    else if (col === "config") { navegacao(); agendaPesquisa(); }
  });

  /* ---------- painel: campos extras do editor de lugares ---------- */
  function editorHtml(D) {
    var ev = ehEvento(D), venues = G.lugares().filter(function (o) { return !ehEvento(o) && o.id !== D.id; }).sort(function (a, b) { return String(a.nome).localeCompare(String(b.nome)); });
    var ps = parceiros();
    return '<fieldset class="full rec-ed"><legend>Etiquetas</legend><div class="pv-op">' + etiquetas(true).map(function (e) { return '<label class="check"><input type="checkbox" data-etq="' + esc(e.id) + '"' + ((D.etiquetas || []).indexOf(e.id) >= 0 ? " checked" : "") + "> " + esc(e.nome) + (e.ativo === false ? " (desligada)" : "") + "</label>"; }).join("") + "</div></fieldset>" +
      (ev ? '<fieldset class="full rec-ed"><legend>Sessões, status e local</legend><p class="small muted">Uma linha por sessão. Sem sessões, valem as datas de início e fim acima.</p><div id="e-sess">' + (D.sessoes || []).map(linhaSessao).join("") + '</div><button type="button" class="btn sm ghost" data-mais-sess>Adicionar sessão</button>' +
        '<div class="form2" style="margin-top:12px"><label class="check"><input type="checkbox" id="e-esg"' + (D.esgotado ? " checked" : "") + '> Esgotado</label><label class="check"><input type="checkbox" id="e-canc"' + (D.cancelado ? " checked" : "") + '> Cancelado</label>' +
        '<div class="field full"><label for="e-local">Local do evento (página do local)</label><select id="e-local"><option value="">Automático, pelo endereço</option>' + venues.map(function (o) { return '<option value="' + esc(o.id) + '"' + (D.localId === o.id ? " selected" : "") + ">" + esc(o.nome) + " · " + esc(o.cidade || "") + "</option>"; }).join("") + "</select></div></div></fieldset>" : "") +
      '<fieldset class="full rec-ed"><legend>Quem recomendou</legend>' + (ps.length ? '<div id="e-recs">' + (D.recomendacoes || []).map(function (r) { return linhaRec(r, ps); }).join("") + '</div><button type="button" class="btn sm ghost" data-mais-rec>Adicionar recomendação</button>' : '<p class="small muted">Cadastre parceiros em Painel → Parceiros para usar aqui.</p>') + "</fieldset>";
  }
  function linhaSessao(s) { s = s || {}; return '<div class="mrow sess-ed"><input type="date" data-s="d" value="' + esc(s.d || "") + '" aria-label="Data"><input type="time" data-s="i" value="' + esc(s.i || "") + '" aria-label="Início"><input type="time" data-s="f" value="' + esc(s.f || "") + '" aria-label="Fim"><input data-s="p" inputmode="decimal" placeholder="US$" value="' + esc(s.p == null ? "" : s.p) + '" aria-label="Preço"><input data-s="obs" placeholder="Observação" value="' + esc(s.obs || "") + '" aria-label="Observação"><label class="check" style="white-space:nowrap"><input type="checkbox" data-s="esgotado"' + (s.esgotado ? " checked" : "") + '> esgotada</label><button type="button" class="btn sm ghost" data-menos-sess aria-label="Remover sessão">×</button></div>'; }
  function linhaRec(r, ps) { r = r || {}; return '<div class="mrow rec-ed-l"><select data-r="p" aria-label="Parceiro">' + ps.map(function (p) { return '<option value="' + esc(p.id) + '"' + (r.p === p.id ? " selected" : "") + ">" + esc(p.nome) + (p.pago ? " (paga)" : "") + "</option>"; }).join("") + '</select><input data-r="t" placeholder="O que disse (opcional)" maxlength="240" value="' + esc(r.t || "") + '" aria-label="Recomendação"><button type="button" class="btn sm ghost" data-menos-rec aria-label="Remover">×</button></div>'; }
  function ligarEditor(dlg) {
    if (dlg.dataset.recLigado) return; dlg.dataset.recLigado = "1";
    dlg.addEventListener("click", function (e) {
      if (e.target.closest("[data-mais-sess]")) { $("#e-sess", dlg).insertAdjacentHTML("beforeend", linhaSessao()); return; }
      if (e.target.closest("[data-menos-sess]")) { e.target.closest(".sess-ed").remove(); return; }
      if (e.target.closest("[data-mais-rec]")) { $("#e-recs", dlg).insertAdjacentHTML("beforeend", linhaRec({}, parceiros())); return; }
      if (e.target.closest("[data-menos-rec]")) { e.target.closest(".rec-ed-l").remove(); }
    });
  }
  function lerEditor(dlg, D) {
    D.etiquetas = Array.from(dlg.querySelectorAll("[data-etq]")).filter(function (x) { return x.checked; }).map(function (x) { return x.dataset.etq; });
    if (ehEvento(D)) {
      D.sessoes = Array.from(dlg.querySelectorAll(".sess-ed")).map(function (r) {
        var g = function (k) { var x = r.querySelector('[data-s="' + k + '"]'); return x ? (x.type === "checkbox" ? x.checked : x.value.trim()) : ""; };
        var p = String(g("p")).replace(",", "."); return { d: g("d"), i: g("i"), f: g("f"), p: p === "" || isNaN(Number(p)) ? null : Number(p), obs: g("obs"), esgotado: g("esgotado") };
      }).filter(function (s) { return /^\d{4}-\d\d-\d\d$/.test(s.d); });
      if (D.sessoes.length) { var ds = D.sessoes.map(function (s) { return s.d; }).sort(); D.dataInicio = ds[0]; D.dataFim = ds[ds.length - 1]; }
      var esg = $("#e-esg", dlg), canc = $("#e-canc", dlg), lc = $("#e-local", dlg);
      D.esgotado = !!(esg && esg.checked); D.cancelado = !!(canc && canc.checked); D.localId = lc ? lc.value : "";
    }
    D.recomendacoes = Array.from(dlg.querySelectorAll(".rec-ed-l")).map(function (r) { return { p: r.querySelector('[data-r="p"]').value, t: r.querySelector('[data-r="t"]').value.trim() }; }).filter(function (r) { return r.p; });
  }

  G.views.local = viewLocal; G.views.parceiro = viewParceiro;
  window.Recursos = {
    rec: rec, on: on, etiquetas: etiquetas, ETQ_PADRAO: ETQ_PADRAO, INT_PADRAO: INT_PADRAO, interesses: interesses, meusInteresses: meusInteresses, abreInteresses: abreInteresses,
    novoFiltro: novoFiltro, aplica: aplica, passa: passa, interpreta: interpreta, paraLink: paraLink, deLink: deLink, compartilhar: compartilhar, rotulo: rotulo, buscar: buscar,
    ehEvento: ehEvento, encerrado: encerrado, acontecendoAgora: acontecendoAgora, abertoAgora: abertoAgora, proximasSessoes: proximasSessoes, dataCurta: dataCurta, nomeEtq: nomeEtq,
    selos: selos, blocoLugar: blocoLugar, secao: secao, parceiros: parceiros, editorHtml: editorHtml, ligarEditor: ligarEditor, lerEditor: lerEditor, fds: fds, hoje: hoje
  };
})();
