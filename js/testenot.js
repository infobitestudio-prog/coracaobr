/* Painel master → "TESTE AS NOTIFICAÇÕES DA PLATAFORMA EM SEU CELULAR".
   Testa cada aviso da plataforma neste aparelho e no e-mail do master, sem criar anúncio, evento nem pagamento:
   permissão, app instalado, notificação local, push do servidor, "passou perto", evento dos temas, avisos automáticos
   do servidor, tela de pagamento confirmado, e-mails para o cliente e aviso para a equipe. */
(function () {
  "use strict";
  var G = window.Guia; if (!G) return;
  var esc = G.esc, ic = G.ic;
  var ov = null, rodando = false;
  function srv() { return !!(Store.servidor && Store.servidor()); }
  function instalado() { try { return matchMedia("(display-mode: standalone)").matches || navigator.standalone === true; } catch (e) { return false; } }
  function ios() { return /iPhone|iPad|iPod/.test(navigator.userAgent); }
  function espera(ms) { return new Promise(function (r) { setTimeout(r, ms); }); }
  async function inscricao() {
    if (!("serviceWorker" in navigator) || !("PushManager" in window)) return null;
    var reg = await navigator.serviceWorker.getRegistration(); var sub = reg && await reg.pushManager.getSubscription();
    return sub;
  }

  var TESTES = [
    { id: "perm", t: "Permissão de notificações", d: "O celular precisa permitir que o CoraçãoBR mostre avisos.", run: async function () {
      if (!("Notification" in window)) return ios() && !instalado() ? ["er", "No iPhone, as notificações só funcionam com o app instalado: Compartilhar → Adicionar à Tela de Início. Depois abra pelo ícone e teste de novo."] : ["er", "Este navegador não mostra notificações. Use o Chrome (Android) ou o app instalado (iPhone)."];
      var p = Notification.permission;
      if (p === "default") p = await Notification.requestPermission();
      return p === "granted" ? ["ok", "Permitido neste aparelho."] : p === "denied" ? ["er", "Bloqueado. Abra as configurações do celular → Notificações → CoraçãoBR (ou o navegador) e permita."] : ["av", "Ainda sem resposta. Toque de novo e escolha Permitir."];
    } },
    { id: "app", t: "App instalado e serviço de avisos", d: "O serviço do app (service worker) entrega os avisos com o app fechado.", run: async function () {
      if (!("serviceWorker" in navigator)) return ["er", "Este navegador não tem service worker."];
      var reg = await navigator.serviceWorker.getRegistration(); if (!reg) { try { reg = await navigator.serviceWorker.register("sw.js"); await navigator.serviceWorker.ready; } catch (e) { return ["er", "O serviço do app não iniciou: " + e.message]; } }
      return instalado() ? ["ok", "App instalado e serviço ativo."] : ["av", "Serviço ativo, mas o site está aberto no navegador. " + (ios() ? "No iPhone, instale na Tela de Início para receber push." : "Instale o app para receber avisos com o celular bloqueado.")];
    } },
    { id: "local", t: "Notificação na tela do celular", d: "Uma notificação de teste aparece agora, pelo próprio app.", run: async function () {
      if (!("Notification" in window) || Notification.permission !== "granted") return ["er", "Permita as notificações primeiro (item 1)."];
      var ok = await G.notifica("Teste do CoraçãoBR", "Notificações funcionando neste celular ✓", "./#painel", "teste-local");
      return ok ? ["ok", "Enviada. Ela aparece na barra de notificações."] : ["er", "O celular não aceitou mostrar a notificação."];
    } },
    { id: "push", t: "Push do servidor (app fechado ou celular bloqueado)", d: "O servidor manda um push só para este aparelho. Bloqueie a tela depois de tocar: ele chega em segundos.", run: async function () {
      if (!srv()) return ["er", "O push precisa do site na hospedagem (Hostinger), com a API ligada."];
      if (!window.Novidades || !Novidades.pushSuportado || !Novidades.pushSuportado()) return ["er", ios() && !instalado() ? "No iPhone, instale o app na Tela de Início e abra pelo ícone." : "Este aparelho não recebe push."];
      try { await Novidades.pushLigar(); } catch (e) { return ["er", e.message]; }
      var sub = await inscricao(); if (!sub) return ["er", "Não consegui inscrever este aparelho."];
      try { await Store.api("push_teste", { endpoint: sub.endpoint, tipo: "teste" }); return ["ok", "Push enviado pelo servidor. Se não aparecer em 1 minuto, confira o modo silencioso/foco do celular."]; }
      catch (e) { return ["er", e.message]; }
    } },
    { id: "perto", t: "Passou perto de um lugar", d: "O aviso que a pessoa recebe ao passar perto de um negócio do guia (cartão na tela e notificação).", run: async function () {
      if (!window.Jornada || !Jornada.teste) return ["er", "Módulo de avisos por perto não carregou."];
      var r = await Jornada.teste();
      return !r.ok ? ["er", r.msg] : r.sistema ? ["ok", "Mostrado: " + r.lugar + " (cartão + notificação)."] : ["av", "Cartão mostrado (" + r.lugar + "). A notificação do celular precisa da permissão do item 1."];
    } },
    { id: "temas", t: "Evento novo dos temas escolhidos", d: "A faixa \"Evento novo para você\" e a notificação, com um evento real da agenda.", run: async function () {
      if (!window.Diferenciais || !Diferenciais.testeTemas) return ["er", "Módulo de alertas não carregou."];
      var r = await Diferenciais.testeTemas();
      return r.sistema ? ["ok", "Faixa e notificação mostradas."] : ["av", "Faixa mostrada. A notificação precisa da permissão do item 1."];
    } },
    { id: "auto", t: "Avisos automáticos do servidor", d: "Os pushes do robô diário: eventos do fim de semana e lugar novo perto do CEP.", run: async function () {
      if (!srv()) return ["er", "Precisa do site na hospedagem, com a API ligada."];
      var sub = await inscricao(); if (!sub) return ["av", "Rode antes o teste do push do servidor (item 4) para inscrever este aparelho."];
      try { await Store.api("push_teste", { endpoint: sub.endpoint, tipo: "fds" }); await espera(4000); await Store.api("push_teste", { endpoint: sub.endpoint, tipo: "perto" }); return ["ok", "Dois pushes enviados: fim de semana e novidade perto do CEP."]; }
      catch (e) { return ["er", e.message]; }
    } },
    { id: "pag", t: "Pagamento confirmado (tela de agradecimento)", d: "A tela que a empresa vê quando o Pix é confirmado. Não cria pagamento nenhum.", run: async function () {
      if (!window.Pag || !Pag.obrigado) return ["er", "Módulo de pagamento não carregou."];
      fecha();
      Pag.obrigado({ k: "Pagamento confirmado · TESTE", titulo: "Obrigado! Seu anúncio já pode entrar no ar.", texto: "Este é só um teste do painel: nenhum pagamento foi criado.", botao: "Voltar ao teste", segundos: 6, ir: function () { abre(); } });
      return ["ok", "Tela mostrada (volta sozinha em 6 segundos)."];
    } },
    { id: "email", t: "E-mails para o cliente", d: "Manda para o seu e-mail um teste, um aviso de vencimento e uma confirmação de pagamento (marcados como [TESTE]).", run: async function () {
      if (!srv()) return ["er", "Os e-mails saem do servidor (Hostinger)."];
      try { var r = await Store.api("email_teste", {}); var e = r.enviados || {}, n = ["teste", "vencimento", "pagamento"].filter(function (k) { return e[k]; }).length;
        TESTES[TESTES.length - 1]._r = e.equipe ? ["ok", "Aviso de teste enviado para " + r.equipePara + "."] : ["er", "O servidor não conseguiu enviar para " + r.equipePara + "."];
        return n === 3 ? ["ok", "3 e-mails enviados para " + r.para + ". Confira também o spam."] : n ? ["av", n + " de 3 e-mails saíram para " + r.para + "."] : ["er", "O servidor não conseguiu enviar e-mails. Peça à Hostinger para liberar o envio do PHP ou crie o e-mail nao-responda@ no hPanel."];
      } catch (e) { return ["er", e.message]; }
    } },
    { id: "equipe", t: "Aviso para a equipe (e-mail oficial)", d: "Pagamentos, novos anunciantes e denúncias chegam no e-mail oficial do CoraçãoBR.", run: async function () {
      var me = TESTES[TESTES.length - 1]; if (me._r) { var x = me._r; me._r = null; return x; }
      if (!srv()) return ["er", "Os e-mails saem do servidor (Hostinger)."];
      return ["av", "Roda junto com o teste de e-mails (item 9)."];
    } }
  ];
  var R = {};

  function html() {
    var feitos = Object.keys(R).length, ok = Object.keys(R).filter(function (k) { return R[k][0] === "ok"; }).length;
    return '<div class="tn-box" role="dialog" aria-modal="true" aria-labelledby="tn-t"><div class="tn-top"><span class="tn-ic">' + ic("bell") + '</span><div><p class="tn-k">Painel master · teste</p><h2 id="tn-t">Notificações da plataforma</h2></div><button type="button" class="tn-x" data-tn-x aria-label="Fechar">×</button></div>' +
      '<p class="tn-sub">Teste neste celular, com o app instalado. Nada é cadastrado: nenhum anúncio, evento ou pagamento é criado.</p>' +
      '<div class="tn-bar" aria-hidden="true"><i style="width:' + Math.round(feitos / TESTES.length * 100) + '%"></i></div><p class="tn-res">' + (feitos ? ok + " de " + TESTES.length + " OK" + (rodando ? " · testando…" : "") : "Toque em Testar todas ou teste um por um.") + "</p>" +
      '<ol class="tn-lista">' + TESTES.map(function (x, i) {
        var r = R[x.id], st = r ? r[0] : "";
        return '<li class="tn-it' + (st ? " tn-" + st : "") + '"><span class="tn-st">' + (st === "ok" ? "✓" : st === "er" ? "×" : st === "av" ? "!" : st === "run" ? "…" : i + 1) + '</span><div><b>' + esc(x.t) + '</b><small>' + esc(r && r[1] ? r[1] : x.d) + '</small></div><button type="button" class="btn sm ghost" data-tn-um="' + i + '"' + (rodando ? " disabled" : "") + ">Testar</button></li>";
      }).join("") + "</ol>" +
      '<div class="tn-acoes"><button type="button" class="btn" data-tn-todas' + (rodando ? " disabled" : "") + ">" + (rodando ? "Testando…" : "Testar todas") + '</button><a class="btn ghost" href="diagnostico.html" target="_blank" rel="noopener">Diagnóstico completo</a></div></div>';
  }
  function pinta() { if (ov) ov.innerHTML = html(); }
  async function um(i) {
    var x = TESTES[i]; R[x.id] = ["run", "Testando…"]; pinta();
    try { R[x.id] = await x.run(); } catch (e) { R[x.id] = ["er", e.message || "Falhou."]; }
    pinta();
  }
  async function todas() {
    rodando = true; R = {}; pinta();
    for (var i = 0; i < TESTES.length; i++) { if (TESTES[i].id === "pag") continue; await um(i); await espera(TESTES[i].id === "push" ? 2500 : 900); if (!ov) break; }
    rodando = false; pinta();
  }
  function abre() {
    if (!ov) { ov = document.createElement("div"); ov.className = "tn-ov"; document.body.appendChild(ov); document.documentElement.classList.add("tn-on"); }
    pinta();
  }
  function fecha() { if (ov) { ov.remove(); ov = null; document.documentElement.classList.remove("tn-on"); } }
  document.addEventListener("click", function (e) {
    if (e.target.closest("[data-teste-not]")) { if (!Store.admin || !Store.admin()) { G.toast("Só a conta master testa as notificações."); return; } abre(); return; }
    if (!ov) return;
    if (e.target.closest("[data-tn-x]") || e.target === ov) { if (!rodando) fecha(); return; }
    var b = e.target.closest("[data-tn-um]"); if (b && !rodando) { um(+b.dataset.tnUm); return; }
    if (e.target.closest("[data-tn-todas]") && !rodando) todas();
  });
  document.addEventListener("keydown", function (e) { if (e.key === "Escape" && ov && !rodando) fecha(); });
  window.TesteNot = { abre: abre, fecha: fecha, todas: todas, TESTES: TESTES, R: function () { return R; } };
})();
