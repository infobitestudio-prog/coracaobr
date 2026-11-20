/* Painel do usuário (aba Conta): salvos, roteiro, avaliações feitas, lembretes de eventos com aviso no horário de Dallas
   e "adicionar ao calendário" (Google Agenda e arquivo .ics para iPhone/Android). Também a Apoie o CoraçãoBR. */
(function () {
  "use strict";
  var G = window.Guia, esc = G.esc, ic = G.ic, $ = function (s, r) { return (r || document).querySelector(s); };
  function ler(k) { try { return JSON.parse(localStorage.getItem(k) || "[]"); } catch (e) { return []; } }
  function grava(k, v) { try { localStorage.setItem(k, JSON.stringify(v)); } catch (e) { /* sem armazenamento */ } }

  /* ---------- lembretes ---------- */
  function lembretes() { return ler("lembretes"); }
  function temLembrete(id) { return lembretes().indexOf(id) >= 0; }
  function alternaLembrete(id) { var a = lembretes(), i = a.indexOf(id); if (i >= 0) a.splice(i, 1); else a.push(id); grava("lembretes", a); return i < 0; }
  function diasAte(iso) { if (!iso) return null; var h = new Date(G.hojeISO() + "T12:00:00"), d = new Date(iso + "T12:00:00"); return Math.round((d - h) / 864e5); }
  function quandoTxt(l) { var n = diasAte(l.dataInicio); if (n == null) return l.quando || ""; if (n < 0) return (l.dataFim && diasAte(l.dataFim) >= 0) ? "Acontecendo agora" : "Já aconteceu"; return n === 0 ? "É hoje" : n === 1 ? "É amanhã" : "Faltam " + n + " dias"; }
  /* Avisa uma vez por dia sobre eventos salvos que começam hoje ou amanhã (horário de Dallas). */
  function verificar() {
    var hoje = G.hojeISO(), chave = "avisado-" + hoje, ja = ler(chave);
    lembretes().forEach(function (id) {
      var l = Store.obter("lugares", id); if (!l || !l.dataInicio || ja.indexOf(id) >= 0) return;
      var n = diasAte(l.dataInicio); if (n == null || n < 0 || n > 1) return;
      var msg = l.nome + (n === 0 ? " começa hoje." : " começa amanhã.");
      G.toast(msg);
      try { if ("Notification" in window && Notification.permission === "granted") new Notification("CoraçãoBR", { body: msg, icon: "icon-192.png" }); } catch (e) { /* bloqueado */ }
      ja.push(id);
    });
    grava(chave, ja);
  }
  setTimeout(function () { if (Store.estado.pronto) verificar(); else Store.assinar(function f() { if (Store.estado.pronto && !f.ok) { f.ok = true; verificar(); } }); }, 3000);
  setInterval(verificar, 30 * 60 * 1000);

  /* ---------- calendário ---------- */
  function ymd(iso) { return String(iso || "").replace(/-/g, ""); }
  function diaSeguinte(iso) { var d = new Date(iso + "T12:00:00"); d.setDate(d.getDate() + 1); return d.toISOString().slice(0, 10); }
  function googleCal(l) {
    var ini = l.dataInicio, fim = diaSeguinte(l.dataFim || l.dataInicio);
    return "https://calendar.google.com/calendar/render?action=TEMPLATE&text=" + encodeURIComponent(l.nome) + "&dates=" + ymd(ini) + "/" + ymd(fim) + "&ctz=America/Chicago&location=" + encodeURIComponent(l.endereco || l.cidade || "") + "&details=" + encodeURIComponent((l.quando ? l.quando + "\n" : "") + "CoraçãoBR");
  }
  function ics(l) {
    var esc2 = function (t) { return String(t || "").replace(/[\\,;]/g, "\\$&").replace(/\n/g, "\\n"); };
    return ["BEGIN:VCALENDAR", "VERSION:2.0", "PRODID:-//CoraçãoBR//PT", "BEGIN:VEVENT", "UID:" + l.id + "@coracaobr", "DTSTAMP:" + new Date().toISOString().replace(/[-:]/g, "").slice(0, 15) + "Z",
      "DTSTART;VALUE=DATE:" + ymd(l.dataInicio), "DTEND;VALUE=DATE:" + ymd(diaSeguinte(l.dataFim || l.dataInicio)), "SUMMARY:" + esc2(l.nome), "LOCATION:" + esc2(l.endereco || l.cidade), "DESCRIPTION:" + esc2(l.quando || ""),
      "BEGIN:VALARM", "TRIGGER:-P1D", "ACTION:DISPLAY", "DESCRIPTION:" + esc2(l.nome), "END:VALARM", "END:VEVENT", "END:VCALENDAR"].join("\r\n");
  }
  async function baixaIcs(l) {
    var nome = l.id + ".ics", txt = ics(l);
    var dl = window.claude && window.claude.use ? await window.claude.use("downloads").catch(function () { return null; }) : null;
    if (dl) { try { await dl.save({ filename: nome, data: new Blob([txt], { type: "text/calendar" }) }); return; } catch (e) { G.toast("O arquivo não foi salvo."); return; } }
    try { var a = document.createElement("a"); a.href = URL.createObjectURL(new Blob([txt], { type: "text/calendar" })); a.download = nome; document.body.appendChild(a); a.click(); setTimeout(function () { URL.revokeObjectURL(a.href); a.remove(); }, 1000); }
    catch (e) { G.toast("Use o botão do Google Agenda."); }
  }
  function blocoEvento(l) {
    if (l.categoria !== "evento") return "";
    var on = temLembrete(l.id);
    return '<div class="panel stack" style="gap:10px"><div class="row" style="justify-content:space-between"><h3 style="margin:0">Não perca</h3><span class="small muted">' + esc(quandoTxt(l)) + "</span></div>" +
      '<div class="row"><button type="button" class="btn ' + (on ? "soft" : "") + ' sm" data-lembrar="' + esc(l.id) + '">' + ic("clock") + (on ? " Lembrete ativo" : " Lembrar-me") + "</button>" +
      (l.dataInicio ? '<a class="btn ghost sm" target="_blank" rel="noopener" href="' + esc(googleCal(l)) + '">Google Agenda</a><button type="button" class="btn ghost sm" data-ics="' + esc(l.id) + '">iPhone / Outlook (.ics)</button>' : "") + "</div>" +
      '<p class="small muted">' + (l.dataInicio ? "O lembrete avisa na véspera e no dia, no horário de Dallas (Central Time)." : "A data desta edição ainda não foi divulgada; o lembrete avisa assim que ela entrar no guia.") + "</p></div>";
  }
  document.addEventListener("click", function (e) {
    var b = e.target.closest("[data-lembrar]"), c = e.target.closest("[data-ics]"), n = e.target.closest("[data-notif]");
    if (b) {
      var on = alternaLembrete(b.dataset.lembrar); G.toast(on ? "Lembrete ativado." : "Lembrete removido.");
      b.className = "btn " + (on ? "soft " : "") + "sm"; b.innerHTML = ic("clock") + (on ? " Lembrete ativo" : " Lembrar-me");
      if (on && "Notification" in window && Notification.permission === "default") { try { Notification.requestPermission(); } catch (er) { /* ok */ } }
    }
    if (c) { var l = Store.obter("lugares", c.dataset.ics); if (l) baixaIcs(l); }
    if (n) { try { Notification.requestPermission().then(function (p) { G.toast(p === "granted" ? "Notificações ativadas." : "O navegador não liberou as notificações; os avisos aparecem dentro do site."); }); } catch (er) { G.toast("Este navegador não permite notificações aqui."); } }
  });

  /* ---------- minhas avaliações ---------- */
  function minhasAval() { var ids = ler("minhas-avaliacoes"), uid = Store.uid(); return Store.lista("avaliacoes").filter(function (a) { return ids.indexOf(a.id) >= 0 || (uid && a.uid === uid); }); }
  function registraAval(id) { var a = ler("minhas-avaliacoes"); a.push(id); grava("minhas-avaliacoes", a); }

  /* ---------- painel do usuário ---------- */
  function viewConta() {
    var salvos = ler("lista").map(function (i) { return Store.obter("lugares", i); }).filter(Boolean);
    var lem = lembretes().map(function (i) { return Store.obter("lugares", i); }).filter(Boolean).sort(function (a, b) { return (a.dataInicio || "9999") < (b.dataInicio || "9999") ? -1 : 1; });
    var av = minhasAval();
    var nome = meuNome(), cta = (Store.conta && Store.conta()) || null, logado = !!cta, ehMaster = !!(cta && cta.papel === "master") || (Store.papel && Store.papel() === "master");
    var nomeV = nome || (cta && cta.nome) || "Visitante", primeiro = nomeV.split(" ")[0];
    var srvOn = !!(Store.servidor && Store.servidor()), neg = window.Anunciante && (logado || !srvOn) ? Anunciante.negocio({ uid: Store.uid(), liberar: ehMaster, depois: function () { if (location.hash === "#conta") { var y = window.scrollY; viewConta(); window.scrollTo(0, y); } } }) : null;
    var linhaEv = function (l) { return '<a class="lrow nopos" href="#lugar-' + esc(l.id) + '"><span class="th">' + (G.foto(l) ? '<img src="' + esc(G.foto(l)) + '" alt="" loading="lazy">' : "") + "</span><span><b>" + esc(l.nome) + "</b><small>" + esc(l.quando || "") + '</small></span><span class="val">' + esc(quandoTxt(l)) + "</span></a>"; };
    var vazio = function (t, href, bt) { return '<div class="dk-vazio"><p>' + t + "</p>" + (href ? '<a class="btn sm" href="' + href + '">' + bt + "</a>" : "") + "</div>"; };
    var atalho = function (h, t, d, i) { return '<a class="dk-at" href="' + h + '">' + Dash.ic(i) + "<b>" + t + "</b><small>" + d + "</small></a>"; };
    var prox = lem[0];
    /* cartão do CEP: contas antigas sem ZIP */
    var cartaoZip = logado && !cta.zip ? '<form class="dk-card cz" id="f-zip"><div class="cz-t">' + Dash.ic("pin") + '<div><b>Complete seu cadastro: informe seu CEP nos EUA</b><small>Com o ZIP code avisamos de eventos e lugares novos perto de você. Obrigatório para contas novas.</small></div></div><div class="cz-f"><label class="sr" for="cz-zip">CEP nos EUA (ZIP code)</label><input id="cz-zip" inputmode="numeric" autocomplete="postal-code" maxlength="10" placeholder="Ex.: 75024" required pattern="[0-9]{5}(-?[0-9]{4})?"><button class="btn sm" type="submit">Salvar</button></div><p class="cz-m small" role="status"></p></form>' : "";
    /* cartão do negócio na visão geral */
    var cartaoNeg = "";
    if (neg && neg.liberado) cartaoNeg = '<button type="button" class="dk-card dk-neg ok" data-dk-ir="negocio"><span class="dk-neg-i">' + Dash.ic("store") + '</span><span class="dk-neg-t"><small>Meu negócio</small><b>' + (ehMaster && !neg.estado.vagas ? "Ferramentas liberadas (master)" : "Anunciante ativo") + "</b><span>" + neg.ls.filter(function (l) { return l.publicado !== false && (!window.Pag || Pag.visivel(l)); }).length + " no ar · " + esc(neg.estado.txt || "") + '</span></span><span class="dk-cta">Abrir painel ' + Dash.ic("arrow") + "</span></button>";
    else if (neg) cartaoNeg = '<button type="button" class="dk-card dk-neg" data-dk-ir="negocio"><span class="dk-neg-i">' + Dash.ic("lock") + '</span><span class="dk-neg-t"><small>Meu negócio</small><b>' + (neg.estado.fase === "vencido" ? "Plano vencido · anúncios ocultos" : neg.ls.length ? "Anúncio pronto · falta o pagamento" : "Tem um negócio? Anuncie aqui") + "</b><span>" + (neg.estado.fase === "vencido" ? "Pague um pacote e tudo volta ao ar como estava." : "As ferramentas de anúncio liberam com o pagamento por Pix.") + '</span></span><span class="dk-cta">' + (neg.estado.fase === "vencido" ? "Reativar" : "Começar") + " " + Dash.ic("arrow") + "</span></button>";
    else cartaoNeg = '<a class="dk-card dk-neg" href="#entrar"><span class="dk-neg-i">' + Dash.ic("user") + '</span><span class="dk-neg-t"><small>Sua conta CoraçãoBR</small><b>Entre ou crie sua conta grátis</b><span>Salvos em qualquer aparelho, avisos perto de você e, se tiver um negócio, anúncios.</span></span><span class="dk-cta">Entrar ' + Dash.ic("arrow") + "</span></a>";
    var cartaoPerto = logado && cta.zip ? '<div class="dk-card dk-flat dk-perto"><div class="dk-ch"><h3>Perto de você</h3><span class="pill ok">' + Dash.ic("pin") + esc(cta.zipCidade || cta.zip) + '</span></div><p class="small muted">Avisamos quando surgem eventos e lugares novos na sua região (ZIP ' + esc(cta.zip) + ').</p><div class="row" style="gap:8px"><button type="button" class="btn sm" data-notif>' + Dash.ic("bell") + 'Ativar notificações</button><button type="button" class="btn ghost sm" data-dk-ir="perfil">Trocar CEP</button></div></div>' : "";
    var geral = cartaoZip + cartaoNeg + '<div class="dk-grid">' +
      '<a class="dk-card dk-dark dk-span2" href="#lista"><small>Seu roteiro</small><b class="dk-big">' + salvos.length + '</b><span>' + (salvos.length === 1 ? "lugar salvo" : "lugares salvos") + '</span><span class="dk-cta">Abrir roteiro ' + Dash.ic("route") + "</span></a>" +
      '<button type="button" class="dk-card" data-dk-ir="eventos"><small>Eventos</small><b class="dk-big">' + lem.length + '</b><span>com lembrete</span>' + Dash.ic("cal") + '</button>' +
      '<button type="button" class="dk-card" data-dk-ir="avaliacoes"><small>Avaliações</small><b class="dk-big">' + av.length + '</b><span>feitas por você</span>' + Dash.ic("star") + "</button></div>" +
      '<div class="dk-grid dk-g2"><div class="dk-card dk-flat"><div class="dk-ch"><h3>Próximo evento</h3><button type="button" class="more" data-dk-ir="eventos">ver todos</button></div>' + (prox ? '<div class="list">' + linhaEv(prox) + "</div>" : vazio("Nenhum evento com lembrete ainda.", "#explorar", "Ver eventos")) + "</div>" +
      (cartaoPerto || '<div class="dk-card dk-flat"><div class="dk-ch"><h3>Atalhos</h3></div><div class="dk-ats">' + atalho("#mapa", "Mapa", "o que tem perto", "pin") + atalho("#feed", "Feed", "novidades", "grid") + atalho("#meus-roteiros", "Checklists", "seus roteiros", "route") + atalho("#roteiro-ia", "Roteiro IA", "monte em segundos", "spark") + "</div></div>") + "</div>" +
      (cartaoPerto ? '<div class="dk-card dk-flat"><div class="dk-ch"><h3>Atalhos</h3></div><div class="dk-ats dk-ats4">' + atalho("#mapa", "Mapa", "o que tem perto", "pin") + atalho("#feed", "Feed", "novidades", "grid") + atalho("#meus-roteiros", "Checklists", "seus roteiros", "route") + atalho("#roteiro-ia", "Roteiro IA", "monte em segundos", "spark") + "</div></div>" : "");
    var perfilSec = '<div class="dk-card dk-flat">' + cabecalho() + "</div>" + (window.Auth ? Auth.blocoConta() : "") + (window.Jornada ? Jornada.blocoConfig() : "");
    var eventos = '<div class="dk-card dk-flat">' + (lem.length ? '<div class="list">' + lem.map(linhaEv).join("") + "</div>" : vazio('Abra um evento e toque em "Lembrar-me" para receber aviso na véspera e no dia.', "#explorar", "Encontrar eventos")) + "</div>";
    var roteiro = window.Checklist ? Checklist.painel("check") : ''; var roteiroAntigo = '<div class="dk-card dk-flat">' + (salvos.length ? '<div class="list">' + salvos.slice(0, 12).map(G.linha).join("") + "</div>" + (salvos.length > 12 ? '<a class="more" href="#lista">ver os ' + salvos.length + "</a>" : "") : vazio("Toque no coração de um lugar para montar o seu roteiro.", "#explorar", "Explorar lugares")) + "</div>" +
      '<div class="dk-grid dk-g3">' + atalho("#meus-roteiros", "Meus roteiros", "checklist por dia", "route") + atalho("#roteiro-ia", "Roteiro com IA", "pronto em segundos", "spark") + atalho("#roteiros", "Roteiros prontos", "feitos pela equipe", "grid") + "</div>";
    if (window.Checklist) roteiro = '<div class="dk-card dk-flat">' + roteiro + "</div>" + (roteiroAntigo.indexOf('<div class="dk-grid dk-g3">') >= 0 ? roteiroAntigo.slice(roteiroAntigo.indexOf('<div class="dk-grid dk-g3">')) : ""); else roteiro = roteiroAntigo;
    var avs = '<div class="dk-card dk-flat">' + (av.length ? '<div class="list">' + av.map(function (a) { var l = Store.obter("lugares", a.lugarId); return '<a class="lrow nopos" href="#lugar-' + esc(a.lugarId) + '"><span class="th">' + (l && G.foto(l) ? '<img src="' + esc(G.foto(l)) + '" alt="">' : "") + "</span><span><b>" + esc(l ? l.nome : "") + "</b><small>" + esc(a.texto || "") + '</small></span><span class="val">' + G.stars(a.estrelas) + "</span></a>"; }).join("") + "</div>" : vazio("Suas avaliações aparecem aqui. Avalie os lugares que você visitou: isso ajuda outros brasileiros.", "#explorar", "Avaliar um lugar")) + "</div>";
    var mais = '<div class="dk-grid dk-g3">' + atalho("#mural", "Mural", "vagas e classificados", "tag") + atalho("#custo", "Custo de vida", "por cidade", "chart") + atalho("#chegada", "Primeiros 30 dias", "checklist da chegada", "home") + atalho("#temas", "Alertas de eventos", "seus temas", "bell") + atalho("#fala-portugues", "Fala português", "profissionais", "user") + atalho("#conversor", "Conversor", "dólar ↔ real", "money") + atalho("#cidades", "Outras cidades", "avise-me", "share") + atalho("#instalar", "Instalar no celular", "como app", "plus") + atalho("#caixinha", "Apoie o guia", "caixinha", "heart") + "</div>";
    var menu = [
      { id: "geral", nome: "Visão geral", ic: "home", titulo: logado || nome ? "Olá, " + primeiro : "Minha conta", sub: logado ? "Sua conta em um lugar: guia, avisos e o seu negócio." : "Seus salvos ficam neste aparelho. <a href=\"#entrar\">Entre</a> para levar para qualquer lugar." },
      { id: "eventos", nome: "Meus eventos", ic: "cal", n: lem.length || "", grupo: "Guia", acao: '<button type="button" class="btn ghost sm" data-notif>' + Dash.ic("bell") + "Ativar notificações</button>" },
      { id: "roteiro", nome: "Meu roteiro", ic: "route", n: (window.Checklist ? Checklist.itens().filter(function (x) { return !x.feito; }).length : salvos.length) || "", grupo: "Guia", sub: "Checklist dos passeios: marque o que visitou e conte como foi." },
      { id: "atividade", nome: "Curtidas e seguindo", ic: "heart", grupo: "Guia", sub: "Publicações que você curtiu, salvou e os perfis que segue." },
      { id: "avaliacoes", nome: "Avaliações", ic: "star", n: av.length || "", grupo: "Guia", sub: "Depoimentos e estrelas que você deu." }
    ];
    if (!(window.Social && Social.blocoConta())) menu = menu.filter(function (m) { return m.id !== "atividade"; });
    var secoes = { geral: geral, eventos: eventos, roteiro: roteiro, atividade: window.Social ? Social.blocoConta() : "", avaliacoes: avs, perfil: perfilSec, mais: mais };
    if (neg) { menu = menu.concat(neg.menu); Object.keys(neg.secoes).forEach(function (k) { secoes[k] = neg.secoes[k]; }); }
    else menu.push({ id: "negocio", nome: "Meu negócio", ic: "store", grupo: "Meu negócio", titulo: "Meu negócio", sub: "Para donos de negócio." }), secoes.negocio = '<div class="ng-hero dk-card dk-dark"><div class="ng-hc"><small>Para donos de negócio</small><h2>Uma conta para tudo</h2><p>Crie sua conta grátis, monte o anúncio e pague por Pix. Quando o pagamento entra, o anúncio vai ao ar e as ferramentas do anunciante liberam.</p><div class="ng-ha"><a class="btn" href="#entrar">Entrar ou criar conta</a><a class="btn ghost" href="#anuncie">Ver como funciona</a></div></div></div>';
    menu.push({ id: "perfil", nome: "Perfil e conta", ic: "user", grupo: "Conta", sub: logado ? "Nome, e-mail, CEP e senha." : "" }, { id: "mais", nome: "Mais do guia", ic: "grid", grupo: "Conta" });
    var pe = [];
    if (ehMaster || Store.admin()) pe.push({ nome: "Painel master", ic: "shield", href: "#painel" });
    if (logado) pe.push({ nome: "Sair", ic: "out", acao: "data-sair" });
    var rot = window.Auth && Auth.rotulo ? Auth.rotulo(cta) : "";
    var topo = '<div class="dk-hero"><span class="dk-av">' + esc(nomeV.trim().charAt(0).toUpperCase() || "?") + '</span><div class="dk-hw"><small>Minha conta</small><b>' + esc(nomeV) + '</b><span class="dk-tags">' + (rot ? '<em class="' + (rot === "Usuário" ? "" : "ok") + '">' + esc(rot) + "</em>" : '<em>Visitante</em>') + (cta && cta.zipCidade ? "<em>" + Dash.ic("pin") + esc(cta.zipCidade) + "</em>" : "") + "</span></div>" + (ehMaster ? '<a class="btn sm" href="#painel">Master</a>' : logado ? "" : '<a class="btn sm" href="#entrar">Entrar</a>') + "</div>";
    G.app.innerHTML = Dash.montar({ chave: "usuario", marca: rot || "Minha conta", titulo: nomeV, avatar: nomeV.trim().charAt(0).toUpperCase() || "?", menu: menu, pe: pe, topo: topo, secoes: secoes });
    if (neg) neg.init();
    var fn = $("#f-nome"); if (fn) fn.onsubmit = function (e) { e.preventDefault(); var v = $("#p-nome").value.trim().slice(0, 40); try { localStorage.setItem("meu-nome", JSON.stringify(v)); } catch (er) { /* ok */ } sobe(); G.toast(v ? "Pronto, " + v.split(" ")[0] + "." : "Nome removido."); viewConta(); };
    var fz = $("#f-zip"); if (fz) fz.onsubmit = function (e) {
      e.preventDefault(); var z = $("#cz-zip").value.trim(), m = fz.querySelector(".cz-m"), bt = fz.querySelector("button");
      if (!/^\d{5}(-?\d{4})?$/.test(z)) { m.textContent = "Digite os 5 números do ZIP code (ex.: 75024)."; return; }
      bt.disabled = true; m.textContent = "Salvando…";
      Store.api("perfil", { nome: cta.nome, email: "", zip: z }).then(function (j) { if (Store.estado.sessao) Store.estado.sessao.conta = j.conta; G.toast(j.conta.zipCidade ? "CEP salvo: " + j.conta.zipCidade + "." : "CEP salvo."); viewConta(); })
        .catch(function (er) { bt.disabled = false; m.textContent = er.message || "Não foi possível salvar agora."; });
    };
  }

  /* ---------- perfil: nome e sincronização entre aparelhos ---------- */
  function meuNome() { var n = ""; try { n = JSON.parse(localStorage.getItem("meu-nome") || '""') || ""; } catch (e) { n = ""; } return String(n || Store.nome() || ""); }
  function cabecalho() {
    var nome = meuNome(), nuvem = Store.estado.modo === "nuvem" && Store.uid();
    return '<div class="perfil"><span class="avatar" aria-hidden="true">' + esc((nome || "?").trim().charAt(0).toUpperCase() || "?") + '</span><div class="stack" style="gap:6px"><div><p class="eyebrow">Sua área</p><h1 class="page-h" style="margin-top:2px">' + (nome ? "Olá, " + esc(nome.split(" ")[0]) : "Minha conta") + "</h1></div>" +
      '<p class="small muted">' + (nuvem ? '<span class="pill ok">Conectado</span> Você entrou com a sua conta. Lista, lembretes, roteiros e avaliações ficam salvos e aparecem em qualquer aparelho.' : "Seus salvos ficam guardados neste aparelho.") + "</p>" +
      '<form id="f-nome" class="row" style="gap:8px"><label class="sr" for="p-nome">Nome que aparece nas suas avaliações</label><input id="p-nome" value="' + esc(nome) + '" maxlength="40" placeholder="Como podemos te chamar?" style="flex:1;min-width:0;padding:10px 12px;border:1px solid var(--line);border-radius:12px;background:var(--surface);color:var(--ink);font:inherit"><button class="btn sm" type="submit">Salvar</button></form></div></div>';
  }
  var SYNC = ["lista", "checklist", "chegada", "temas", "temas-vistos", "lembretes", "meus-roteiros", "minhas-avaliacoes", "meu-nome", "interesses", "posts-salvos"], ultimo = "", baixou = false;
  function pacote() { var o = {}; SYNC.forEach(function (k) { try { var v = localStorage.getItem(k); if (v != null) o[k] = v; } catch (e) { /* ok */ } }); return o; }
  function sobe() {
    if (Store.estado.modo !== "nuvem" || !Store.uid() || !baixou) return;
    var p = pacote(), j = JSON.stringify(p); if (j === ultimo) return; ultimo = j;
    Store.gravar("perfis", Store.idProprio("app"), { dados: p, em: new Date().toISOString() }).catch(function () { ultimo = ""; });
  }
  function juntaLista(a, b) { var out = []; [].concat(a || [], b || []).forEach(function (x) { if (out.indexOf(x) < 0) out.push(x); }); return out; }
  function desce() {
    if (baixou || Store.estado.modo !== "nuvem" || !Store.uid()) return; baixou = true;
    Store.meuItem("perfis", "app").then(function (d) {
      var r = (d && d.dados) || {};
      SYNC.forEach(function (k) {
        var loc = null, rem = null; try { loc = JSON.parse(localStorage.getItem(k) || "null"); } catch (e) { loc = null; } try { rem = JSON.parse(r[k] || "null"); } catch (e) { rem = null; }
        var v = loc;
        if (k === "meu-nome") v = loc || rem;
        else if (k === "meus-roteiros") { var ids = {}; v = []; (loc || []).concat(rem || []).forEach(function (x) { if (x && x.id && !ids[x.id]) { ids[x.id] = 1; v.push(x); } }); }
        else if (k === "checklist") { var por = {}, ord = [], pt = function (y) { return (y.aval ? 4 : 0) + (y.estrelas ? 2 : 0) + (y.feito ? 1 : 0); }; (loc || []).concat(rem || []).forEach(function (x) { if (!x || !x.id) return; if (!por[x.id]) { por[x.id] = x; ord.push(x.id); } else if (pt(x) > pt(por[x.id])) por[x.id] = x; }); v = ord.map(function (id) { return por[id]; }); }
        else if (Array.isArray(loc) || Array.isArray(rem)) v = juntaLista(loc, rem);
        if (v != null) try { localStorage.setItem(k, JSON.stringify(v)); } catch (e) { /* ok */ }
      });
      sobe(); if (/^#(conta|entrar)$/.test(location.hash)) viewConta();
    });
  }
  Store.assinar(function () { if (Store.estado.pronto) desce(); });
  window.addEventListener("hashchange", sobe); document.addEventListener("visibilitychange", function () { if (document.hidden) sobe(); }); setInterval(sobe, 20000);

  /* ---------- caixinha ---------- */
  /* Caixinha: Pix para a chave oficial com valor livre (a pessoa digita no app do banco) ou um valor sugerido */
  var CX = 0;
  function viewCaixinha() {
    var c = G.config().caixinha || {}, vals = (c.valoresPix && c.valoresPix.length) ? c.valoresPix : [5, 10, 20, 50];
    G.app.innerHTML = '<section class="block cx"><div class="wrap stack in" style="max-width:720px">' +
      '<div style="text-align:center;display:grid;justify-items:center;gap:10px"><span class="tic" style="width:64px;height:64px">' + ic("heart") + '</span><h1 class="page-h">Apoie o CoraçãoBR</h1>' +
      '<p class="muted" style="max-width:52ch">' + esc(c.texto || "Gostou do guia? Qualquer valor ajuda a manter o site gratuito, atualizado todos os dias e a levar o guia para outras cidades.") + "</p></div>" +
      '<div class="panel stack cx-box"><div class="cx-vs" role="group" aria-label="Valor do apoio"><button type="button" data-cx="0" aria-pressed="' + (CX === 0) + '">Valor livre</button>' + vals.map(function (v) { return '<button type="button" data-cx="' + v + '" aria-pressed="' + (CX === v) + '">' + G.reais(v) + "</button>"; }).join("") + '</div>' +
      '<div class="cx-out"><label for="cx-v">Outro valor (R$)</label><input id="cx-v" type="number" min="1" step="1" inputmode="decimal" placeholder="Digite o valor" value="' + (CX && vals.indexOf(CX) < 0 ? CX : "") + '"></div>' +
      '<div id="cx-pix">' + pixCaixinha() + "</div>" +
      '<p class="small muted" style="text-align:center">Com <b>valor livre</b>, o QR Code vem sem valor e você digita quanto quiser no app do banco. Obrigado por fazer o CoraçãoBR bater mais forte. 💚💛</p></div>' +
      "</div></section>";
  }
  function pixCaixinha() {
    if (!window.Pix) return "";
    var h = Pix.bloco(CX, "CAIXINHA" + (CX ? String(CX).replace(/\D/g, "") : "LIVRE"), "Apoio CoracaoBR");
    return CX ? h : h.replace(/<p class="pix-v">[\s\S]*?<\/p>/, '<p class="pix-v"><small>Valor</small><b>Você escolhe</b></p>');
  }
  document.addEventListener("click", function (e) {
    var b = e.target.closest("[data-cx]"); if (!b) return;
    CX = Number(b.dataset.cx) || 0; var i = $("#cx-v"); if (i) i.value = "";
    Array.from(document.querySelectorAll("[data-cx]")).forEach(function (x) { x.setAttribute("aria-pressed", x === b); });
    var el = $("#cx-pix"); if (el) el.innerHTML = pixCaixinha();
  });
  document.addEventListener("input", function (e) {
    if (e.target.id !== "cx-v") return; var v = Math.round(Number(String(e.target.value).replace(",", ".")) * 100) / 100;
    CX = v > 0 ? v : 0; Array.from(document.querySelectorAll("[data-cx]")).forEach(function (x) { x.setAttribute("aria-pressed", Number(x.dataset.cx) === CX && !e.target.value ? "true" : x.dataset.cx === "0" && !CX ? "true" : "false"); });
    clearTimeout(e.target._t); e.target._t = setTimeout(function () { var el = $("#cx-pix"); if (el) el.innerHTML = pixCaixinha(); }, 250);
  });


  G.views.entrar = viewConta; G.views.conta = viewConta; G.views.caixinha = viewCaixinha;
  window.Usuario = { blocoEvento: blocoEvento, registraAval: registraAval, verificar: verificar };
})();
