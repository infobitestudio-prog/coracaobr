/* Diferenciais do CoraçãoBR
   Para brasileiros: primeiros 30 dias (checklist com progresso), alertas de eventos por tema, profissionais que falam português,
   conversor dólar ↔ real. Para anunciantes: agendar/pedido direto no anúncio, selo Verificado, impulsionar, indique e ganhe 50%. */
(function () {
  "use strict";
  var G = window.Guia; if (!G) return;
  var esc = G.esc, ic = G.ic, $ = function (s, r) { return (r || document).querySelector(s); };
  function ler(k, pad) { try { var v = JSON.parse(localStorage.getItem(k) || "null"); return v == null ? pad : v; } catch (e) { return pad; } }
  function grava(k, v) { try { localStorage.setItem(k, JSON.stringify(v)); } catch (e) { /* ok */ } }
  function hoje() { return G.hojeISO(); }
  function norm(t) { return String(t || "").toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, ""); }
  function cab(eb, t, sub) { return '<div><p class="eyebrow">' + eb + '</p><h1 class="page-h" style="margin-top:4px">' + t + "</h1>" + (sub ? '<p class="muted" style="margin-top:8px;max-width:62ch">' + sub + "</p>" : "") + "</div>"; }

  /* ======================= 1. Primeiros 30 dias ======================= */
  function viewChegada() {
    var P = (window.Extras && Extras.PASSOS) || [], feitos = ler("chegada", []), n = function (cat) { return G.lugares().filter(function (l) { return l.categoria === cat; }).length; };
    var pct = P.length ? Math.round(feitos.length / P.length * 100) : 0, semana = function (i) { return i < 3 ? "Semana 1" : i < 6 ? "Semana 2" : i < 8 ? "Semana 3" : "Semana 4"; };
    G.app.innerHTML = '<section class="block df"><div class="wrap stack in" style="max-width:820px">' + cab("Recém-chegado", "Seus primeiros 30 dias", "O passo a passo que quase todo brasileiro faz ao chegar ao Texas. Marque o que já resolveu: o progresso fica salvo na sua conta.") +
      '<div class="ck-prog"><div><b>' + feitos.length + " de " + P.length + "</b> passos resolvidos" + (pct === 100 ? " · parabéns, você está em casa! 💚💛" : "") + '</div><span><i style="width:' + pct + '%"></i></span></div>' +
      '<div class="df-pass">' + P.map(function (p, i) {
        var ok = feitos.indexOf(i) >= 0, lk = p[2] && n(p[2][2]) ? '<a class="more" href="#explorar" data-grupo="' + esc(p[2][1]) + '" data-cat="' + esc(p[2][2]) + '">' + esc(p[2][0]) + " no guia →</a>" : "";
        return (i === 0 || semana(i) !== semana(i - 1) ? '<p class="ck-gr">' + semana(i) + "</p>" : "") + '<div class="df-p' + (ok ? " ok" : "") + '"><button type="button" class="ck-box-ok' + (ok ? " on" : "") + '" data-chegada="' + i + '" aria-pressed="' + ok + '" aria-label="Marcar ' + esc(p[0]) + '"><svg class="i" viewBox="0 0 24 24"><path d="M4.5 12.5l4.5 4.5L19.5 6.5"/></svg></button><div><b>' + esc(p[0]) + "</b><p>" + esc(p[1]) + "</p>" + lk + "</div></div>";
      }).join("") + "</div>" +
      '<div class="df-cta"><div><b>Precisa de alguém que fale português?</b><span>Médicos, contadores, advogados e muito mais, todos no guia.</span></div><a class="btn" href="#fala-portugues">Ver profissionais</a></div>' +
      '<p class="note">Orientação geral, não é assessoria jurídica, fiscal ou médica. Confirme sempre no site oficial de cada órgão.</p></div></section>';
  }
  document.addEventListener("click", function (e) {
    var b = e.target.closest("[data-chegada]"); if (!b) return;
    var f = ler("chegada", []), i = Number(b.dataset.chegada), k = f.indexOf(i);
    if (k >= 0) f.splice(k, 1); else f.push(i); grava("chegada", f); viewChegada();
  });

  /* ======================= 2. Alertas de eventos por tema ======================= */
  var TEMAS = [
    ["rodeio", "Rodeio e sertanejo", ["rodeio", "sertanej", "country", "pbr", "cowboy", "vaquejada"]],
    ["shows", "Shows brasileiros", ["show", "samba", "pagode", "forro", "mpb", "funk", "axe", "brasil"]],
    ["futebol", "Futebol e jogo do Brasil", ["futebol", "jogo do brasil", "selecao", "copa", "fc dallas", "soccer"]],
    ["igreja", "Igreja em português", ["igreja", "culto", "missa", "gospel", "evangel"]],
    ["festas", "Festas brasileiras", ["festa junina", "carnaval", "arraia", "junina", "independencia"]],
    ["feiras", "Feiras e mercados", ["feira", "mercado", "market", "bazar"]],
    ["criancas", "Para crianças", ["crianca", "kids", "familia", "infantil"]],
    ["gratis", "Eventos grátis", []]
  ];
  function casa(l, t) { if (t[0] === "gratis") return !!l.gratuito; var x = norm([l.nome, l.descricao, l.historia, l.quando, (l.tags || []).join(" ")].join(" ")); return t[2].some(function (k) { return x.indexOf(k) >= 0; }); }
  function eventosDosTemas() {
    var sel = ler("temas", []), h = hoje(), lim = new Date(h + "T12:00:00"); lim.setDate(lim.getDate() + 30); lim = lim.toISOString().slice(0, 10);
    if (!sel.length) return [];
    return G.lugares().filter(function (l) { return l.categoria === "evento" && l.dataInicio && (l.dataFim || l.dataInicio) >= h && l.dataInicio <= lim && TEMAS.some(function (t) { return sel.indexOf(t[0]) >= 0 && casa(l, t); }); })
      .sort(function (a, b) { return a.dataInicio < b.dataInicio ? -1 : 1; });
  }
  function viewTemas() {
    var sel = ler("temas", []), evs = eventosDosTemas(), perm = "Notification" in window ? Notification.permission : "indisponivel";
    G.app.innerHTML = '<section class="block df"><div class="wrap stack in" style="max-width:860px">' + cab("Alertas", "Eventos do seu jeito", "Escolha os temas que você curte. Avisamos quando aparecer evento novo, aqui no site e no celular.") +
      '<div class="df-temas">' + TEMAS.map(function (t) { return '<button type="button" class="df-tema" data-tema-ev="' + t[0] + '" aria-pressed="' + (sel.indexOf(t[0]) >= 0) + '">' + esc(t[1]) + "</button>"; }).join("") + "</div>" +
      '<div class="df-not"><div><b>Avisos no celular</b><span>' + (perm === "granted" ? "Ligados. Você recebe um aviso quando surgir evento dos seus temas." : perm === "denied" ? "Bloqueados no navegador. Libere as notificações do site nas configurações." : perm === "indisponivel" ? "Este navegador não tem notificações. Instale o site no celular para receber avisos." : "Toque para permitir os avisos.") + "</span></div>" + (perm === "default" ? '<button type="button" class="btn sm" data-tema-not>Ativar avisos</button>' : "") + "</div>" +
      (sel.length ? '<div class="head" style="margin:6px 0 0"><h2 style="font-size:1.3rem">Próximos 30 dias para você</h2><span class="small muted">' + evs.length + (evs.length === 1 ? " evento" : " eventos") + "</span></div>" + (evs.length ? '<div class="list">' + evs.map(G.linha).join("") + "</div>" : '<p class="muted">Nenhum evento desses temas nos próximos 30 dias. Assim que aparecer, avisamos.</p>') : '<p class="muted">Escolha pelo menos um tema acima.</p>') +
      "</div></section>";
    grava("temas-vistos", evs.map(function (l) { return l.id; }));
  }
  document.addEventListener("click", function (e) {
    var b = e.target.closest("[data-tema-ev]");
    if (b) { var s = ler("temas", []), k = s.indexOf(b.dataset.temaEv); if (k >= 0) s.splice(k, 1); else s.push(b.dataset.temaEv); grava("temas", s); viewTemas(); return; }
    if (e.target.closest("[data-tema-not]") && "Notification" in window) Notification.requestPermission().then(function () { viewTemas(); });
  });
  /* ao abrir o site: avisa de eventos novos dos temas escolhidos */
  var avisou = false;
  function checaTemas() {
    if (avisou || !Store.estado.pronto || location.hash === "#temas") return;
    var evs = eventosDosTemas(); if (!evs.length) return;
    var vistos = ler("temas-vistos", []), novos = evs.filter(function (l) { return vistos.indexOf(l.id) < 0; }); if (!novos.length) return;
    avisou = true; grava("temas-vistos", vistos.concat(novos.map(function (l) { return l.id; })).slice(-300));
    var txt = novos.length === 1 ? "Evento novo para você: " + novos[0].nome : novos.length + " eventos novos dos seus temas";
    var bar = document.createElement("a"); bar.className = "df-bar"; bar.href = "#temas"; bar.innerHTML = ic("bell") + "<span>" + esc(txt) + "</span><b>Ver →</b>"; document.body.appendChild(bar); setTimeout(function () { bar.classList.add("on"); }, 50); setTimeout(function () { bar.classList.remove("on"); setTimeout(function () { bar.remove(); }, 400); }, 9000);
    try { if ("Notification" in window && Notification.permission === "granted") new Notification("CoraçãoBR", { body: txt, icon: "icon-192.png", tag: "temas" }); } catch (er) { /* alguns celulares só avisam pelo app instalado */ }
  }
  Store.assinar(function () { setTimeout(checaTemas, 2500); });

  /* ======================= 3. Fala português ======================= */
  var FP = { q: "", c: "" };
  var GRUPOS_FP = [["saude", "Saúde"], ["dentista", "Dentista"], ["advogado", "Advogado"], ["contador", "Contador"], ["imoveis", "Imóveis"], ["beleza", "Beleza"], ["aulas", "Aulas"], ["mecanico", "Mecânico"], ["seguro", "Seguros"]];
  function viewFala() {
    var todos = G.lugares().filter(function (l) { return l.falaPortugues || l.brasileiro; }), q = norm(FP.q);
    var cats = {}; todos.forEach(function (l) { cats[l.categoria] = (cats[l.categoria] || 0) + 1; });
    var ls = todos.filter(function (l) { return (!FP.c || l.categoria === FP.c) && (!q || norm(l.nome + " " + (G.CATS[l.categoria] || "") + " " + (l.cidade || "") + " " + (l.historia || "")).indexOf(q) >= 0); });
    ls = (G.primeiro ? G.primeiro(ls) : ls);
    var chips = Object.keys(cats).sort(function (a, b) { return cats[b] - cats[a]; }).slice(0, 14);
    G.app.innerHTML = '<section class="block df"><div class="wrap stack in">' + cab("Atendimento em português", "Fala português", "Profissionais e negócios que atendem em português ou são de brasileiros. Selo verde = conferido pela equipe.") +
      '<div class="search xp-q df-q">' + ic("search") + '<input id="fp-q" type="search" value="' + esc(FP.q) + '" placeholder="Dentista, contador, cabeleireira, Plano…" autocomplete="off"></div>' +
      '<div class="chips"><button type="button" class="chip" data-fp="" aria-pressed="' + !FP.c + '">Todos · ' + todos.length + "</button>" + chips.map(function (c) { return '<button type="button" class="chip" data-fp="' + esc(c) + '" aria-pressed="' + (FP.c === c) + '">' + esc(G.CATS[c] || c) + " · " + cats[c] + "</button>"; }).join("") + "</div>" +
      (ls.length ? '<div class="grid">' + ls.slice(0, 60).map(G.card).join("") + "</div>" : '<p class="muted">Nada encontrado com essa busca.</p>') +
      '<div class="df-cta"><div><b>Você atende em português?</b><span>Anuncie e ganhe o selo Fala português no seu anúncio.</span></div><a class="btn" href="#anuncie">Anunciar</a></div></div></section>';
  }
  document.addEventListener("click", function (e) { var b = e.target.closest("[data-fp]"); if (b) { FP.c = b.dataset.fp; viewFala(); } });
  var tq = null;
  document.addEventListener("input", function (e) { if (e.target.id !== "fp-q") return; FP.q = e.target.value; clearTimeout(tq); tq = setTimeout(function () { var p = e.target.selectionStart; viewFala(); var i = $("#fp-q"); if (i) { i.focus(); try { i.setSelectionRange(p, p); } catch (er) { /* ok */ } } }, 250); });

  /* ======================= 4. Conversor dólar ↔ real ======================= */
  var CV = { usd: 100, dir: "usd" };
  function cotacao() { return Number(G.config().cotacao) || 5.4; }
  function conversorHtml() {
    var c = cotacao(), usd = CV.dir === "usd" ? CV.usd : CV.usd / c, brl = usd * c, f = function (n) { return n.toLocaleString("pt-BR", { minimumFractionDigits: 2, maximumFractionDigits: 2 }); };
    var itens = [["Café", 5], ["Almoço simples", 15], ["Gasolina (galão)", 3.1], ["Uber curto", 14], ["Aluguel 1 quarto", 1450], ["Plano de celular", 35]];
    return '<div class="df-cv" data-cv><div class="df-cvr"><label>Dólar (US$)<input type="number" min="0" step="0.01" inputmode="decimal" data-cv-usd value="' + (Math.round(usd * 100) / 100) + '"></label><button type="button" class="df-sw" data-cv-sw aria-label="Inverter">⇄</button><label>Real (R$)<input type="number" min="0" step="0.01" inputmode="decimal" data-cv-brl value="' + (Math.round(brl * 100) / 100) + '"></label></div>' +
      '<p class="small muted">Cotação de referência: R$ ' + f(c) + " por dólar" + (G.config().cotacaoEm ? " · atualizada em " + String(G.config().cotacaoEm).split("-").reverse().join("/") : "") + " (Banco Central, PTAX).</p>" +
      '<div class="df-cvt">' + itens.map(function (x) { return "<div><span>" + x[0] + "</span><b>US$ " + f(x[1]) + "</b><small>≈ R$ " + f(x[1] * c) + "</small></div>"; }).join("") + "</div></div>";
  }
  function viewConversor() { G.app.innerHTML = '<section class="block df"><div class="wrap stack in" style="max-width:820px">' + cab("Dinheiro", "Conversor dólar ↔ real", "Converta valores e veja quanto custam as coisas do dia a dia no Texas.") + conversorHtml() + '<div class="df-cta"><div><b>Vai morar no Texas?</b><span>Compare aluguel, escolas e impostos entre as cidades.</span></div><a class="btn" href="#custo">Custo de vida</a></div></div></section>'; }
  document.addEventListener("input", function (e) {
    var u = e.target.closest("[data-cv-usd]"), b = e.target.closest("[data-cv-brl]"); if (!u && !b) return;
    var c = cotacao(), v = Number(e.target.value) || 0, box = e.target.closest("[data-cv]");
    if (u) { CV.usd = v; CV.dir = "usd"; box.querySelector("[data-cv-brl]").value = (Math.round(v * c * 100) / 100); } else { CV.usd = v; CV.dir = "brl"; box.querySelector("[data-cv-usd]").value = (Math.round(v / c * 100) / 100); }
  });
  document.addEventListener("click", function (e) { if (!e.target.closest("[data-cv-sw]")) return; var box = e.target.closest("[data-cv]"), a = box.querySelector("[data-cv-usd]"), b = box.querySelector("[data-cv-brl]"); var t = a.value; a.value = b.value; b.dispatchEvent(new Event("input", { bubbles: true })); a.dispatchEvent(new Event("input", { bubbles: true })); void t; });
  /* o conversor também aparece no topo do Custo de vida */
  setTimeout(function () { if (!G.views.custo || G.views.custo._cv) return; var custo = G.views.custo; G.views.custo = function (r) { custo(r); var w = G.app.querySelector(".wrap"); if (w && !w.querySelector("[data-cv]")) { var d = document.createElement("div"); d.innerHTML = '<div class="head" style="margin:0 0 8px"><h2 style="font-size:1.3rem">Conversor dólar ↔ real</h2></div>' + conversorHtml(); w.insertBefore(d, w.children[1] || null); } }; G.views.custo._cv = true; }, 0);

  /* ======================= 5. Agendar / pedido direto no anúncio ======================= */
  function abrirPedido(id) {
    var l = Store.obter("lugares", id); if (!l) return;
    var wa = String(l.whatsapp || "").replace(/\D/g, ""), srv = !!(Store.servidor && Store.servidor()), nome = ler("meu-nome", "") || (Store.conta && Store.conta() ? Store.conta().nome : "");
    var cx = document.createElement("div"); cx.className = "ck-modal"; cx.setAttribute("role", "dialog"); cx.setAttribute("aria-modal", "true");
    cx.innerHTML = '<div class="ck-box"><button type="button" class="ck-x" data-pd-x aria-label="Fechar">×</button><div class="ck-head"><span class="ck-ok" style="background:var(--accent)">' + ic("cal") + "</span><div><small>Agendar ou pedir</small><b>" + esc(l.nome) + '</b></div></div><form class="ck-form" data-pd-form>' +
      '<div class="df-tp" role="radiogroup">' + ["Agendamento", "Pedido", "Orçamento"].map(function (t, i) { return '<label><input type="radio" name="tipo" value="' + t + '"' + (i === 0 ? " checked" : "") + "><span>" + t + "</span></label>"; }).join("") + "</div>" +
      '<label class="ck-lb" for="pd-n">Seu nome</label><input id="pd-n" name="nome" maxlength="60" required value="' + esc(nome) + '">' +
      '<label class="ck-lb" for="pd-c">WhatsApp ou e-mail para resposta</label><input id="pd-c" name="contato" maxlength="120" required placeholder="+1 214 555 0100 ou voce@email.com">' +
      '<div class="ae-g2"><div><label class="ck-lb" for="pd-d">Data</label><input id="pd-d" name="data" type="date" min="' + hoje() + '"></div><div><label class="ck-lb" for="pd-h">Horário</label><input id="pd-h" name="hora" type="time"></div></div>' +
      '<label class="ck-lb" for="pd-m">O que você precisa</label><textarea id="pd-m" name="mensagem" rows="3" maxlength="800" placeholder="Ex.: corte e escova para 2 pessoas; 3 dúzias de pão de queijo para sábado…"></textarea>' +
      '<div class="ck-acts">' + (wa ? '<button type="button" class="btn ghost" data-pd-wa>' + ic("chat") + " Enviar no WhatsApp</button>" : "") + (srv ? '<button type="submit" class="btn">Enviar pelo site</button>' : "") + "</div>" +
      '<p class="ck-nota">' + (srv ? "O pedido chega no e-mail do anunciante, que responde direto para você." : "O pedido abre no WhatsApp do anunciante já escrito.") + "</p></form></div>";
    document.body.appendChild(cx); requestAnimationFrame(function () { cx.classList.add("on"); });
    var fecha = function () { cx.classList.remove("on"); setTimeout(function () { cx.remove(); }, 200); };
    var dados = function () { var f = $("[data-pd-form]", cx); return { lugarId: l.id, tipo: (f.querySelector("[name=tipo]:checked") || {}).value || "Contato", nome: f.nome.value.trim(), contato: f.contato.value.trim(), data: f.data.value, hora: f.hora.value, mensagem: f.mensagem.value.trim() }; };
    var texto = function (d) { return "Olá! Vi o seu anúncio no CoraçãoBR.\n" + d.tipo + (d.data ? " para " + d.data.split("-").reverse().join("/") + (d.hora ? " às " + d.hora : "") : "") + "\nNome: " + d.nome + (d.mensagem ? "\n" + d.mensagem : ""); };
    cx.addEventListener("click", function (ev) {
      if (ev.target === cx || ev.target.closest("[data-pd-x]")) { fecha(); return; }
      if (ev.target.closest("[data-pd-wa]")) { var d = dados(); if (!d.nome) { G.toast("Informe seu nome."); return; } if (G.medir) G.medir(l.id, "c"); window.open("https://wa.me/" + (wa.length === 10 ? "1" + wa : wa) + "?text=" + encodeURIComponent(texto(d)), "_blank", "noopener"); fecha(); }
    });
    $("[data-pd-form]", cx).onsubmit = function (ev) {
      ev.preventDefault(); var d = dados(), bt = this.querySelector("button[type=submit]"); if (!d.nome || !d.contato) { G.toast("Informe seu nome e como falar com você."); return; }
      bt.disabled = true; Store.api("pedido", d).then(function () { grava("meu-nome", d.nome); G.toast("Pedido enviado! O anunciante vai responder pelo contato informado."); fecha(); }).catch(function (er) { bt.disabled = false; G.toast(er.message || "Não foi possível enviar agora."); });
    };
  }
  document.addEventListener("click", function (e) { var b = e.target.closest("[data-agendar]"); if (b) { e.preventDefault(); abrirPedido(b.dataset.agendar); } });

  /* ======================= 6. Painel do anunciante: destaque, selo e indicação ======================= */
  function blocoTurbinar(uid, ls) {
    if (!window.Pag) return "";
    var v = Pag.verificacao(uid), vf = v && v.status === "aprovado";
    var selo = '<div class="dk-card dk-flat df-tb"><div class="df-tbi vf">✓</div><div><h3>Selo Verificado CoraçãoBR</h3><p class="muted">' + (vf ? "Seu negócio é verificado. O selo aparece em todos os seus anúncios." : v && v.status === "analise" ? "Pagamento recebido. A equipe está conferindo seu negócio." : v && v.status === "recusado" ? "Verificação não aprovada" + (v.nota ? ": " + esc(v.nota) : ".") + " Fale com a equipe." : "A equipe confere seu negócio e seus anúncios ganham o selo verde de confiança. Pagamento único.") + "</p>" +
      (vf ? '<span class="pill ok">Verificado</span>' : v && v.status === "analise" ? '<span class="pill warn">Em análise</span>' : '<a class="btn sm" href="#extra-selo">Quero o selo · ' + G.reais(Pag.precoSelo()) + "</a>") + "</div></div>";
    var imp = '<div class="dk-card dk-flat df-tb"><div class="df-tbi im">⚡</div><div><h3>Impulsionar por ' + Pag.diasImpulso() + ' dias</h3><p class="muted">Seu anúncio vai para o topo de Explorar, Ranking, categorias e mapa, com a etiqueta Destaque. ' + G.reais(Pag.precoImpulso()) + " por anúncio, pagamento único.</p>" +
      (ls.length ? '<div class="df-ims">' + ls.map(function (l) { var on = Pag.impulsionado(l), fim = Pag.impulsos(uid).filter(function (pk) { return pk.lugarId === l.id && pk.fim >= hoje(); }).reduce(function (m, pk) { return pk.fim > m ? pk.fim : m; }, ""); return '<div class="df-im"><b>' + esc(l.nome) + "</b>" + (on ? '<span class="pill ok">No topo até ' + fim.split("-").reverse().join("/") + "</span>" : fim ? '<span class="pill xp">Agendado</span>' : "") + '<a class="btn sm' + (on ? " ghost" : "") + '" href="#extra-impulso-' + encodeURIComponent(l.id) + '">' + (on ? "Somar dias" : "Impulsionar") + "</a></div>"; }).join("") + "</div>" : '<p class="small muted">Crie um anúncio para poder impulsionar.</p>') + "</div></div>";
    var link = location.origin + location.pathname + "?ref=" + encodeURIComponent(uid) + "#anuncie";
    var ind = '<div class="dk-card dk-flat df-tb"><div class="df-tbi in">%</div><div><h3>Indique e ganhe 50%</h3><p class="muted">Indique empresas para anunciar. Quando a empresa indicada fizer o primeiro pagamento, você ganha <b>50% de desconto em 1 pacote</b>. Sem limite de indicações.</p>' +
      '<div class="df-ref"><input readonly value="' + esc(link) + '" aria-label="Seu link de indicação"><button type="button" class="btn sm" data-copiar="' + esc(link) + '">Copiar link</button><a class="btn ghost sm" target="_blank" rel="noopener" href="https://wa.me/?text=' + encodeURIComponent("Anuncie sua empresa para os brasileiros no Texas pelo CoraçãoBR: " + link) + '">WhatsApp</a></div>' +
      '<p class="small" data-ind-st>' + (Pag.creditosIndicacao(uid) ? '<span class="pill ok">' + Pag.creditosIndicacao(uid) + (Pag.creditosIndicacao(uid) === 1 ? " desconto de 50% disponível" : " descontos de 50% disponíveis") + "</span> aplicado sozinho na próxima compra." : "") + "</p></div></div>";
    setTimeout(function () { var el = $("[data-ind-st]"); if (el && Store.servidor && Store.servidor()) Store.api("indicacoes").then(function (j) { el.innerHTML = '<span class="pill">' + j.indicados + (j.indicados === 1 ? " indicado" : " indicados") + "</span> " + '<span class="pill ok">' + j.premiados + " já pagaram</span>" + (j.creditos ? ' <span class="pill ok">' + j.creditos + (j.creditos === 1 ? " desconto disponível" : " descontos disponíveis") + "</span>" : ""); }).catch(function () {}); }, 50);
    return selo + imp + ind;
  }
  /* guarda o código de quem indicou (link ?ref=) para enviar no cadastro */
  (function () { try { var r = new URLSearchParams(location.search).get("ref"); if (r && /^[A-Za-z0-9]{4,40}$/.test(r)) localStorage.setItem("indicado-por", r); } catch (e) { /* ok */ } })();
  function refIndicacao() { try { return localStorage.getItem("indicado-por") || ""; } catch (e) { return ""; } }

  G.views.chegada = viewChegada; G.views.temas = viewTemas; G.views["fala-portugues"] = viewFala; G.views.conversor = viewConversor;
  window.Diferenciais = { blocoTurbinar: blocoTurbinar, refIndicacao: refIndicacao, conversorHtml: conversorHtml, abrirPedido: abrirPedido };
})();
