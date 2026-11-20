/* Contas da CoraçãoBR no servidor próprio: entrar, criar conta, esqueci a senha, sair, e quem abre cada painel.
   Três papéis: usuario (salvos, avaliações, roteiros), anunciante (contrata e edita anúncios) e master (painel completo).
   Só age quando o site roda com a pasta api/ (Store.servidor()). No Artifact do Claude, as contas são as do próprio Claude. */
(function () {
  "use strict";
  var G = window.Guia; if (!G) return;
  var esc = G.esc, ic = G.ic, $ = function (s, r) { return (r || document).querySelector(s); };
  function srv() { return !!(Store.servidor && Store.servidor()); }
  function conta() { return Store.conta ? Store.conta() : null; }
  function papel() { return Store.papel ? Store.papel() : ""; }
  var NOMES = { usuario: "Usuário", anunciante: "Usuário", master: "Master" };
  /* Conta única: todo mundo é usuário; as ferramentas de anúncio liberam com o pagamento. */
  function rotulo(c) { if (!c) return ""; if (c.papel === "master") return "Master"; return window.Anunciante && Anunciante.temPlano && Anunciante.temPlano() ? "Anunciante ativo" : "Usuário"; }

  /* Dois acessos: "interagir" (curtir, comentar, avaliar, checklist) e "anunciar" (tudo isso + painel de anúncios). */
  function acesso() { return "interagir"; }   /* um só acesso: a conta do usuário (as ferramentas de anúncio liberam com o pagamento) */
  function defineAcesso(a) { try { sessionStorage.setItem("acesso", a); sessionStorage.setItem("tipo-cadastro", a === "anunciar" ? "anunciante" : "usuario"); } catch (e) { /* ok */ } }
  document.addEventListener("click", function (e) {
    var b = e.target.closest("[data-acesso]"); if (!b) return;
    defineAcesso(b.dataset.acesso);
    if (b.tagName === "BUTTON" && /^#(entrar|cadastro)$/.test(location.hash)) { if (location.hash === "#cadastro") telaCadastro(); else telaEntrar(); if (semServidor()) avisoSemServidor(); }
  });
  function seletorAcesso(tela) {
    var a = acesso(), op = function (k, icn, t, d) { return '<button type="button" class="acs-b" role="tab" data-acesso="' + k + '" aria-selected="' + (a === k) + '"><span class="acs-i">' + icn + "</span><span><b>" + t + "</b><small>" + d + "</small></span></button>"; };
    void op; return '<div class="acs-tabs"><a href="#entrar" aria-current="' + (tela === "entrar") + '">Entrar</a><a href="#cadastro" aria-current="' + (tela === "cadastro") + '">Criar conta</a></div>';
  }
  /* Para onde voltar depois de entrar. */
  function lembra(h) { try { sessionStorage.setItem("depois-login", h); } catch (e) { /* ok */ } }
  function destino(c) {
    var h = null; try { h = sessionStorage.getItem("depois-login"); sessionStorage.removeItem("depois-login"); } catch (e) { /* ok */ }
    if (h && !/^#(entrar|cadastro|esqueci|redefinir)/.test(h)) return h;
    return c && c.papel === "master" ? "#painel" : "#conta";
  }
  /* Recarrega para o guia inteiro reler os dados com a nova sessão. */
  function vaiPara(h) { if (location.hash === h) location.reload(); else { location.hash = h; setTimeout(function () { location.reload(); }, 30); } }

  function campo(id, rotulo, tipo, attr, ajuda) {
    return '<div class="field"><label for="' + id + '">' + rotulo + '</label>' +
      (tipo === "password" ? '<div class="senha"><input id="' + id + '" type="password" ' + (attr || "") + '><button type="button" class="link" data-ver="' + id + '" aria-label="Mostrar senha">Mostrar</button></div>' : '<input id="' + id + '" type="' + tipo + '" ' + (attr || "") + ">") +
      (ajuda ? '<small class="muted">' + ajuda + "</small>" : "") + "</div>";
  }
  function moldura(titulo, sub, corpo, lado, tela) {
    var cd = G.cid ? G.cid() : null, capa = cd && cd.capa ? cd.capa : "", logo = (document.querySelector(".top .brand svg") || {}).outerHTML || "";
    G.app.innerHTML = '<section class="block"><div class="wrap auth' + (tela ? " auth-" + acesso() : "") + '"' + (capa ? ' style="--capa:url(\'' + esc(capa) + '\')"' : "") + ">" +
      '<div class="auth-capa" aria-hidden="true"><span class="auth-cl">' + logo + '</span><b>Coração<span>BR</span></b><small>O guia dos brasileiros' + (cd ? " em " + esc(cd.nome) : " no Texas") + "</small></div>" +
      '<div class="auth-lado">' + (lado || ladoPadrao()) + "</div>" +
      '<div class="auth-card panel stack">' + (tela ? seletorAcesso(tela) : "") + '<div><p class="eyebrow">' + (tela ? "Sua conta CoraçãoBR" : "CoraçãoBR") + '</p><h1 class="page-h" style="margin-top:4px">' + titulo + "</h1>" + (sub ? '<p class="muted" style="margin-top:6px">' + sub + "</p>" : "") + "</div>" + corpo + botaoApp() + "</div></div></section>";
    var f = $("form", G.app), i = f && f.querySelector("input"); if (i && matchMedia("(min-width:760px)").matches) i.focus();
  }
  /* já instalado (aberto como app)? então não mostra o botão */
  function instalado() { return (window.matchMedia && matchMedia("(display-mode: standalone)").matches) || navigator.standalone === true; }
  function botaoApp() {
    if (instalado()) return "";
    return '<div class="auth-app"><button type="button" class="auth-app-bt" data-instalar-app>' +
      '<span class="auth-app-ic"><svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><rect x="6" y="2.5" width="12" height="19" rx="2.5"/><path d="M12 7v7m0 0-3-3m3 3 3-3M10 18.5h4"/></svg></span>' +
      "<span><b>Instalar no celular</b><small>Abre como app, direto da tela inicial. Sem loja e grátis.</small></span><i aria-hidden=\"true\">→</i></button></div>";
  }
  function ladoPadrao() {
    var it = function (t, d) { return '<li><span class="auth-ok" aria-hidden="true">✓</span><span><b>' + t + "</b><small>" + d + "</small></span></li>"; };
    var pr = G.reais(window.Pag ? Pag.preco() : 50), n = window.Pag ? Pag.porPacote() : 3;
    return '<div class="auth-hero"><p class="auth-kick">Uma conta para tudo</p><h2>O guia dos brasileiros no Texas.</h2>' +
      '<p class="auth-sub">Grátis para participar da comunidade. Quando quiser anunciar, é na mesma conta.</p><ul class="auth-lista">' +
      it("Curta, comente e avalie", "Dê estrelas, conte como foi e siga quem você gosta.") +
      it("Avisos do que está perto de você", "Pelo seu CEP, avisamos de eventos e lugares novos na sua região.") +
      it("Roteiros e checklist", "Monte seu roteiro, marque o que visitou e guarde tudo na conta.") +
      it("Tem um negócio? Anuncie aqui", "Monte o anúncio na sua conta e libere as ferramentas com o pagamento: " + pr + " = " + n + " anúncios por mês.") + "</ul></div>";
  }
  function msg(el, texto, ok) { el.textContent = texto || ""; el.className = "auth-msg" + (ok ? " ok" : ""); el.hidden = !texto; }
  function ocupa(f, sim) { Array.from(f.querySelectorAll("button, input")).forEach(function (x) { x.disabled = sim; }); }
  document.addEventListener("click", function (e) {
    var b = e.target.closest("[data-ver]"); if (!b) return;
    var i = document.getElementById(b.dataset.ver); if (!i) return;
    var ver = i.type === "password"; i.type = ver ? "text" : "password"; b.textContent = ver ? "Ocultar" : "Mostrar"; b.setAttribute("aria-label", ver ? "Ocultar senha" : "Mostrar senha");
  });

  /* ---------- entrar ---------- */
  function telaEntrar(aviso, tipo) {
    void tipo;
    moldura("Entrar", aviso || "Use o e-mail e a senha da sua conta.",
      '<form id="f-entrar" class="stack" style="gap:14px" novalidate>' +
      campo("a-email", "E-mail", "email", 'autocomplete="username" required maxlength="160" inputmode="email"') +
      campo("a-senha", "Senha", "password", 'autocomplete="current-password" required maxlength="200"') +
      '<p class="auth-msg" id="a-msg" role="alert" hidden></p>' +
      '<button class="btn" type="submit">Entrar</button>' +
      '<div class="row" style="justify-content:space-between"><a class="more" href="#esqueci">Esqueci minha senha</a><a class="more" href="#cadastro">Primeiro acesso? Criar conta</a></div></form>', null, "entrar");
    $("#f-entrar").onsubmit = function (e) {
      e.preventDefault(); var f = this, m = $("#a-msg");
      var email = $("#a-email").value.trim(), senha = $("#a-senha").value;
      if (!email || !senha) { msg(m, "Informe e-mail e senha."); return; }
      ocupa(f, true); msg(m, "");
      Store.api("entrar", { email: email, senha: senha }).then(function (j) { vaiPara(destino(j.conta)); }).catch(function (er) { ocupa(f, false); msg(m, er.message); });
    };
  }

  /* ---------- criar conta ---------- */
  function telaCadastro() {
    moldura("Criar conta", "Primeiro acesso. Leva menos de um minuto.",
      '<form id="f-cad" class="stack" style="gap:14px" novalidate>' +
      campo("c-nome", "Nome", "text", 'autocomplete="name" required maxlength="60"') +
      campo("c-email", "E-mail", "email", 'autocomplete="email" required maxlength="160" inputmode="email"') +
      campo("c-zip", "CEP nos EUA (ZIP code)", "text", 'autocomplete="postal-code" required inputmode="numeric" maxlength="10" pattern="[0-9]{5}(-[0-9]{4})?" placeholder="Ex.: 75201"', "Obrigatório. Com ele avisamos de eventos e lugares perto de você. Ainda não mora nos EUA? Use o ZIP de onde vai ficar.") +
      campo("c-senha", "Senha", "password", 'autocomplete="new-password" required minlength="8" maxlength="200"', "Pelo menos 8 caracteres, com letras e números.") +
      campo("c-senha2", "Repita a senha", "password", 'autocomplete="new-password" required maxlength="200"') +
      '<label class="check"><input type="checkbox" id="c-aceite"><span>Li e aceito os <a href="#termos" target="_blank">termos de uso</a> e a <a href="#privacidade" target="_blank">política de privacidade</a>.</span></label>' +
      '<p class="auth-msg" id="c-msg" role="alert" hidden></p>' +
      '<button class="btn" type="submit">Criar conta</button>' +
      '<p class="small muted">Já tem conta? <a href="#entrar">Entrar</a></p></form>', null, "cadastro");
    $("#f-cad").onsubmit = function (e) {
      e.preventDefault(); var f = this, m = $("#c-msg");
      var d = { nome: $("#c-nome").value.trim(), email: $("#c-email").value.trim(), zip: $("#c-zip").value.trim(), senha: $("#c-senha").value, ref: window.Diferenciais ? Diferenciais.refIndicacao() : "", aceite: $("#c-aceite").checked };
      if (!d.nome) return msg(m, "Informe seu nome.");
      if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(d.email)) return msg(m, "Informe um e-mail válido.");
      if (!/^\d{5}(-?\d{4})?$/.test(d.zip)) return msg(m, "Informe o seu CEP americano (ZIP code com 5 números, ex.: 75201).");
      if (d.senha.length < 8 || !/[A-Za-z]/.test(d.senha) || !/\d/.test(d.senha)) return msg(m, "A senha precisa ter pelo menos 8 caracteres, com letras e números.");
      if (d.senha !== $("#c-senha2").value) return msg(m, "As duas senhas não são iguais.");
      if (!d.aceite) return msg(m, "Para criar a conta, aceite os termos de uso e a política de privacidade.");
      ocupa(f, true); msg(m, "");
      Store.api("cadastrar", d).then(function (j) {
        try { sessionStorage.removeItem("tipo-cadastro"); localStorage.setItem("meu-nome", JSON.stringify(j.conta.nome)); } catch (er) { /* ok */ }
        /* sem cidade escolhida ainda: o guia abre na região do CEP */
        var c = j.conta || {}, perto = c.zipLat && G.cidadeMaisPerto && !(G.escolheuCidade && G.escolheuCidade()) ? G.cidadeMaisPerto({ lat: c.zipLat, lng: c.zipLng }) : null;
        if (perto) try { localStorage.setItem("cidade", perto.id); } catch (er) { /* ok */ }
        if (window.Mkt) Mkt.evento("sign_up", Object.assign({ method: "email" }, Mkt.utm()));
        vaiPara(destino(j.conta));
      }).catch(function (er) { ocupa(f, false); msg(m, er.message); });
    };
  }

  /* ---------- senha ---------- */
  function telaEsqueci() {
    moldura("Esqueci minha senha", "Enviamos um link para você criar uma nova senha.",
      '<form id="f-esq" class="stack" style="gap:14px" novalidate>' + campo("e-email", "E-mail da conta", "email", 'autocomplete="email" required maxlength="160" inputmode="email"') +
      '<p class="auth-msg" id="e-msg" role="alert" hidden></p><button class="btn" type="submit">Enviar link</button><a class="more" href="#entrar">← voltar para Entrar</a></form>');
    $("#f-esq").onsubmit = function (e) {
      e.preventDefault(); var f = this, m = $("#e-msg"), email = $("#e-email").value.trim();
      if (!email) return msg(m, "Informe o e-mail.");
      ocupa(f, true);
      Store.api("esqueci", { email: email }).then(function (j) { msg(m, j.msg, true); }).catch(function (er) { ocupa(f, false); msg(m, er.message); });
    };
  }
  function telaRedefinir(r) {
    var tok = String(r || "").replace(/^redefinir-/, "");
    moldura("Criar nova senha", "Escolha uma senha nova para a sua conta.",
      '<form id="f-red" class="stack" style="gap:14px" novalidate>' + campo("r-senha", "Nova senha", "password", 'autocomplete="new-password" required maxlength="200"', "Pelo menos 8 caracteres, com letras e números.") +
      campo("r-senha2", "Repita a nova senha", "password", 'autocomplete="new-password" required maxlength="200"') +
      '<p class="auth-msg" id="r-msg" role="alert" hidden></p><button class="btn" type="submit">Salvar e entrar</button></form>');
    $("#f-red").onsubmit = function (e) {
      e.preventDefault(); var f = this, m = $("#r-msg"), s = $("#r-senha").value;
      if (s !== $("#r-senha2").value) return msg(m, "As duas senhas não são iguais.");
      ocupa(f, true);
      Store.api("redefinir", { token: tok, senha: s }).then(function (j) { vaiPara(destino(j.conta)); }).catch(function (er) { ocupa(f, false); msg(m, er.message); });
    };
  }

  /* ---------- primeira instalação: cria a conta master ---------- */
  function telaInstalar() {
    moldura("Criar a conta master", "Primeiro acesso a este servidor. Esta conta administra o guia inteiro: guarde bem a senha.",
      '<form id="f-ins" class="stack" style="gap:14px" novalidate>' + campo("i-chave", "Código de instalação", "text", 'required maxlength="40" autocomplete="off" inputmode="text" style="text-transform:uppercase;letter-spacing:.12em"', "O código que a equipe recebeu junto com o pacote do site.") + campo("i-nome", "Seu nome", "text", 'autocomplete="name" required maxlength="60"') +
      campo("i-email", "E-mail", "email", 'autocomplete="username" required maxlength="160"') +
      campo("i-senha", "Senha", "password", 'autocomplete="new-password" required maxlength="200"', "Use uma senha forte: 12 caracteres ou mais, com letras e números.") +
      campo("i-senha2", "Repita a senha", "password", 'autocomplete="new-password" required maxlength="200"') +
      '<p class="auth-msg" id="i-msg" role="alert" hidden></p><button class="btn" type="submit">Criar conta master</button></form>',
      '<div class="auth-hero"><p class="auth-kick">Primeiro acesso</p><h2>Crie o login da equipe CoraçãoBR.</h2><p class="auth-sub">Esta tela aparece só uma vez, enquanto o site não tem conta master.</p><ul class="auth-lista">' +
      '<li><span class="auth-ok">1</span><span><b>Digite o código de instalação</b><small>O código que veio com o pacote do site.</small></span></li>' +
      '<li><span class="auth-ok">2</span><span><b>Escolha e-mail e senha</b><small>Esse será o login do painel master. Guarde bem a senha.</small></span></li>' +
      '<li><span class="auth-ok">3</span><span><b>Pronto: painel master aberto</b><small>Depois, entre sempre pelo ícone de conta no topo → Painel master.</small></span></li></ul></div>');
    $("#f-ins").onsubmit = function (e) {
      e.preventDefault(); var f = this, m = $("#i-msg");
      if ($("#i-senha").value !== $("#i-senha2").value) return msg(m, "As duas senhas não são iguais.");
      ocupa(f, true);
      Store.api("instalar", { chave: $("#i-chave").value.trim(), nome: $("#i-nome").value.trim(), email: $("#i-email").value.trim(), senha: $("#i-senha").value }).then(function () { vaiPara("#painel"); }).catch(function (er) { ocupa(f, false); msg(m, er.message); });
    };
  }

  /* ---------- usuário que quer anunciar ---------- */
  function telaVirarAnunciante(volta) {
    moldura("Ativar conta de anunciante", "Sua conta é de usuário. Para contratar e editar anúncios, ative o perfil de anunciante. Seus salvos e avaliações continuam iguais.",
      '<div class="stack" style="gap:12px"><button class="btn" type="button" id="v-ok">Ativar e continuar</button><a class="more" href="#conta">Agora não</a><p class="auth-msg" id="v-msg" role="alert" hidden></p></div>');
    $("#v-ok").onclick = function () {
      var b = this; b.disabled = true;
      Store.api("virar_anunciante", {}).then(function () { vaiPara(volta || "#anunciar"); }).catch(function (er) { b.disabled = false; msg($("#v-msg"), er.message); });
    };
  }

  /* ---------- bloco "Sua conta" dentro de Minha conta ---------- */
  function blocoConta() {
    var c = conta(); if (!srv() || !c) return "";
    var atalhos = (c.papel === "master" ? '<a class="btn sm" href="#painel">Painel master</a>' : "") + '<button type="button" class="btn ' + (c.papel === "master" ? "ghost " : "") + 'sm" data-dk-ir="negocio">Meu negócio</button>';
    return '<div class="panel stack conta-box" style="gap:12px"><div class="row" style="justify-content:space-between;align-items:flex-start"><div><h3 style="margin:0">Sua conta</h3><p class="small muted" style="margin-top:4px">' + esc(c.email) + ' · <span class="pill ok">' + esc(rotulo(c) || NOMES[c.papel] || c.papel) + "</span></p></div>" +
      '<button type="button" class="btn ghost sm" data-sair>Sair</button></div>' +
      '<div class="row" style="gap:8px">' + atalhos + '<button type="button" class="btn ghost sm" data-dados>Dados e senha</button>' + (window.Recursos && Recursos.on("paraVoce") ? '<button type="button" class="btn ghost sm" data-abre-int>Meus interesses</button>' : "") + '</div>' +
      (window.Recursos && Recursos.on("newsletter") ? '<label class="check" style="font-size:.92rem"><input type="checkbox" id="c-news" data-news-conta> Receber a newsletter semanal por e-mail</label>' : "") +
      '<form id="f-dados" class="stack" style="gap:12px" hidden novalidate>' +
      campo("d-nome", "Nome", "text", 'maxlength="60" value="' + esc(c.nome) + '"') +
      campo("d-email", "E-mail", "email", 'maxlength="160" value="' + esc(c.email) + '"') +
      campo("d-zip", "CEP nos EUA (ZIP code)", "text", 'maxlength="10" inputmode="numeric" autocomplete="postal-code" value="' + esc(c.zip || "") + '"', c.zipCidade ? "Sua região: " + esc(c.zipCidade) : "Usamos para avisar do que está perto de você.") +
      campo("d-nova", "Nova senha (deixe em branco para manter)", "password", 'autocomplete="new-password" maxlength="200"') +
      campo("d-atual", "Senha atual (obrigatória para trocar e-mail ou senha)", "password", 'autocomplete="current-password" maxlength="200"') +
      '<p class="auth-msg" id="d-msg" role="alert" hidden></p><div class="row" style="gap:8px"><button class="btn sm" type="submit">Salvar</button>' +
      (c.papel !== "master" ? '<button type="button" class="link" data-excluir-conta style="color:var(--danger,#B3261E)">Excluir minha conta</button>' : "") + "</div></form></div>";
  }
  /* newsletter na conta: mostra o estado e liga/desliga */
  document.addEventListener("change", function (e) {
    var c = e.target.closest("[data-news-conta]"); if (!c) return;
    Store.api("newsletter_alterar", { inscrito: c.checked }).then(function () { G.toast(c.checked ? "Inscrição feita." : "Você saiu da newsletter."); }).catch(function (er) { c.checked = !c.checked; G.toast(er.message); });
  });
  var olhaNews = new MutationObserver(function () { var c = document.getElementById("c-news"); if (c && !c.dataset.lido && conta()) { c.dataset.lido = "1"; Store.api("newsletter_status").then(function (j) { c.checked = !!j.inscrito; }).catch(function () {}); } });
  olhaNews.observe(document.documentElement, { childList: true, subtree: true });
  document.addEventListener("click", function (e) {
    if (e.target.closest("[data-sair]")) { Store.api("sair", {}).then(function () { vaiPara("#inicio"); }).catch(function () { vaiPara("#inicio"); }); return; }
    if (e.target.closest("[data-dados]")) { var f = $("#f-dados"); if (f) { f.hidden = !f.hidden; ligaDados(); } return; }
    if (e.target.closest("[data-excluir-conta]")) {
      var m = $("#d-msg"), s = $("#d-atual") ? $("#d-atual").value : "";
      if (!s) { msg(m, "Para excluir a conta, digite a sua senha atual e toque de novo em Excluir minha conta."); return; }
      var b = e.target.closest("[data-excluir-conta]");
      if (!b.dataset.confirma) { b.dataset.confirma = "1"; b.textContent = "Confirmar exclusão definitiva"; msg(m, "Isto apaga a conta, as avaliações, os roteiros e os anúncios. Não dá para desfazer."); return; }
      Store.api("excluir_conta", { senha: s }).then(function () { try { ["lista", "checklist", "lembretes", "meus-roteiros", "minhas-avaliacoes", "meu-nome", "meus-anuncios"].forEach(function (k) { localStorage.removeItem(k); }); } catch (er) { /* ok */ } vaiPara("#inicio"); }).catch(function (er) { msg(m, er.message); });
    }
  });
  function ligaDados() {
    var f = $("#f-dados"); if (!f || f.dataset.ligado) return; f.dataset.ligado = "1";
    f.onsubmit = function (e) {
      e.preventDefault(); var m = $("#d-msg");
      var d = { nome: $("#d-nome").value.trim(), email: $("#d-email").value.trim(), zip: $("#d-zip").value.trim(), senhaNova: $("#d-nova").value, senhaAtual: $("#d-atual").value };
      if (!/^\d{5}(-?\d{4})?$/.test(d.zip)) return msg(m, "Informe o seu CEP americano (ZIP code com 5 números).");
      if (d.senhaNova && (d.senhaNova.length < 8 || !/[A-Za-z]/.test(d.senhaNova) || !/\d/.test(d.senhaNova))) return msg(m, "A nova senha precisa ter pelo menos 8 caracteres, com letras e números.");
      ocupa(f, true);
      Store.api("perfil", d).then(function (j) { ocupa(f, false); msg(m, "Dados salvos.", true); if (Store.estado.sessao) Store.estado.sessao.conta = j.conta; Store.estado.nome = j.conta.nome; $("#d-nova").value = ""; $("#d-atual").value = ""; })
        .catch(function (er) { ocupa(f, false); msg(m, er.message); });
    };
  }

  /* ---------- painel master: contas ---------- */
  var listaContas = [], filtro = "", filtroPapel = "";
  function abaUsuarios(el) {
    el.innerHTML = '<p class="muted">Carregando contas…</p>';
    Store.api("usuarios").then(function (j) { listaContas = j.usuarios || []; desenhaContas(el); }).catch(function (er) { el.innerHTML = '<p class="note">' + esc(er.message) + "</p>"; });
  }
  function dataBR(iso) { if (!iso) return "—"; var d = new Date(iso); return isNaN(d) ? "—" : d.toLocaleDateString("pt-BR") + " " + d.toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" }); }
  function desenhaContas(el) {
    var eu = conta() || {}, D = Dash.ic;
    var F = { "": ["Todas", function () { return true; }], plano: ["Com plano ativo", function (u) { return +u.plano > 0; }], semplano: ["Sem plano", function (u) { return !(+u.plano > 0) && u.papel !== "master"; }],
      semzip: ["Sem CEP", function (u) { return !u.zip; }], master: ["Master", function (u) { return u.papel === "master"; }], suspensas: ["Suspensas", function (u) { return +u.bloqueado; }] };
    if (!F[filtroPapel]) filtroPapel = "";
    var nPlano = listaContas.filter(F.plano[1]).length, nZip = listaContas.filter(F.semzip[1]).length;
    var q = filtro.toLowerCase(), vis = listaContas.filter(function (u) { return F[filtroPapel][1](u) && (!q || (u.nome + " " + u.email + " " + (u.zip || "") + " " + (u.zip_cidade || "")).toLowerCase().indexOf(q) >= 0); });
    var kc = function (n, t, icn, f) { return '<button type="button" class="dk-card' + (filtroPapel === f ? " on" : "") + '" data-ct-f="' + f + '"><small>' + t + '</small><b class="dk-big">' + n + "</b>" + D(icn) + "</button>"; };
    el.innerHTML = '<div class="stack ct">' +
      '<div class="dk-grid dk-g4">' + kc(listaContas.length, "Contas", "users", "") + kc(nPlano, "Com plano ativo", "store", "plano") + kc(nZip, "Sem CEP", "pin", "semzip") + kc(listaContas.filter(F.master[1]).length, "Master", "shield", "master") + "</div>" +
      '<div class="ct-bar"><label class="sr" for="u-q">Buscar conta</label><input id="u-q" placeholder="Buscar por nome, e-mail, CEP ou cidade" value="' + esc(filtro) + '">' +
      '<label class="sr" for="u-p">Filtrar contas</label><select id="u-p">' + Object.keys(F).map(function (k) { return '<option value="' + k + '"' + (filtroPapel === k ? " selected" : "") + ">" + F[k][0] + "</option>"; }).join("") + "</select></div>" +
      '<div class="ct-cards">' + (vis.length ? vis.map(function (u) {
        var proprio = u.id === eu.uid, bloq = +u.bloqueado, plano = +u.plano > 0, mst = u.papel === "master";
        return '<div class="ct-c' + (bloq ? " off" : "") + '" data-uid="' + esc(u.id) + '"><div class="ct-h"><span class="ct-av">' + esc((u.nome || "?").charAt(0).toUpperCase()) + '</span><div><b>' + esc(u.nome) + (proprio ? " (você)" : "") + "</b><small>" + esc(u.email) + "</small></div></div>" +
          '<div class="ct-tags"><em class="' + (mst ? "m" : plano ? "ok" : "") + '">' + (mst ? "Master" : plano ? "Anunciante · " + u.plano + " anúncios" : "Usuário") + "</em>" + (u.zip ? "<em>" + D("pin") + esc(u.zip) + (u.zip_cidade ? " · " + esc(u.zip_cidade) : "") + "</em>" : '<em class="w">sem CEP</em>') + (bloq ? '<em class="w">Suspensa</em>' : "") + "</div>" +
          '<small class="ct-d">Criada em ' + esc(dataBR(u.criado)) + " · último acesso " + esc(dataBR(u.ultimo)) + "</small>" +
          '<div class="ct-a"><button type="button" class="btn sm" data-op="abrir">' + D("store") + "Abrir área</button>" +
          (proprio ? "" : '<label class="sr" for="pp-' + esc(u.id) + '">Papel de ' + esc(u.nome) + '</label><select id="pp-' + esc(u.id) + '" data-papel><option value="usuario"' + (mst ? "" : " selected") + '>Usuário</option><option value="master"' + (mst ? " selected" : "") + ">Master</option></select>" +
            '<button type="button" class="btn ghost sm" data-op="' + (bloq ? "liberar" : "bloquear") + '">' + (bloq ? "Reativar" : "Suspender") + "</button>") +
          '<button type="button" class="btn ghost sm" data-op="link">Nova senha</button>' +
          (proprio || mst ? "" : '<button type="button" class="btn ghost sm ct-x" data-op="excluir">Excluir</button>') + "</div></div>";
      }).join("") : '<p class="muted" style="padding:16px">Nenhuma conta encontrada.</p>') + "</div>" +
      '<div id="u-link" class="dk-card dk-flat stack" style="gap:8px" hidden></div>' +
      '<p class="small muted">"Abrir área" mostra tudo o que a pessoa vê em Meu negócio, com acesso total. O link de nova senha vale por 24 horas: envie pelo WhatsApp ou e-mail. A equipe nunca vê nem guarda senhas: elas ficam criptografadas no servidor.</p></div>';
    Array.from(el.querySelectorAll("[data-ct-f]")).forEach(function (b) { b.onclick = function () { filtroPapel = b.dataset.ctF; desenhaContas(el); }; });
    var qi = $("#u-q", el); qi.oninput = function () { filtro = qi.value; var pos = qi.selectionStart; desenhaContas(el); var n2 = $("#u-q", el); n2.focus(); try { n2.setSelectionRange(pos, pos); } catch (e) { /* ok */ } };
    $("#u-p", el).onchange = function () { filtroPapel = this.value; desenhaContas(el); };
    el.onchange = function (e) {
      var s = e.target.closest("[data-papel]"); if (!s) return;
      var id = s.closest("[data-uid]").dataset.uid;
      Store.api("usuario", { id: id, op: "papel", papel: s.value }).then(function () { G.toast("Papel alterado."); abaUsuarios(el); }).catch(function (er) { G.toast(er.message); abaUsuarios(el); });
    };
    el.onclick = function (e) {
      var b = e.target.closest("[data-op]"); if (!b) return;
      var id = b.closest("[data-uid]").dataset.uid, op = b.dataset.op;
      if (op === "abrir") { var u = listaContas.filter(function (x) { return x.id === id; })[0]; if (u && window.Anunciante) Anunciante.abrirConta(u); return; }
      if (op === "excluir" && !b.dataset.confirma) { b.dataset.confirma = "1"; b.textContent = "Confirmar exclusão"; return; }
      Store.api("usuario", { id: id, op: op }).then(function (j) {
        if (op === "link") {
          var box = $("#u-link", el); box.hidden = false;
          box.innerHTML = '<h3 style="margin:0">Link de nova senha</h3><p style="overflow-wrap:anywhere;user-select:all"><b>' + esc(j.link) + '</b></p><button type="button" class="btn ghost sm" data-copiar="' + esc(j.link) + '">Copiar link</button>';
          box.scrollIntoView({ block: "nearest" });
          return;
        }
        G.toast(op === "excluir" ? "Conta excluída." : op === "bloquear" ? "Conta suspensa." : "Conta reativada."); abaUsuarios(el);
      }).catch(function (er) { G.toast(er.message); });
    };
  }

  /* ---------- quem abre cada tela ---------- */
  var V = G.views, orig = { conta: V.conta, anunciante: V.anunciante, anunciar: V.anunciar };
  /* site sem servidor (GitHub Pages / arquivo local): mostra as telas, mas avisa que as contas só funcionam no site oficial */
  function semServidor() { return !srv() && Store.estado.modo === "local"; }
  function avisoSemServidor() {
    var f = $("form", G.app); if (!f) return;
    var p = document.createElement("p"); p.className = "auth-msg"; p.innerHTML = "<b>Esta é uma cópia de demonstração.</b> Criar conta e entrar só funcionam no site oficial, hospedado na Hostinger (com a pasta api/). Lá, no primeiro acesso, a equipe cria o login master com o código de instalação.";
    f.insertBefore(p, f.firstChild); Array.from(f.querySelectorAll("button[type=submit]")).forEach(function (b) { b.disabled = true; });
  }
  V.cadastro = function () { if (semServidor()) { telaCadastro(); avisoSemServidor(); return; } if (!srv()) return orig.conta(); if (conta()) return vaiPara(destino(conta())); telaCadastro(); };
  V.esqueci = function () { if (!srv()) return orig.conta(); telaEsqueci(); };
  V.redefinir = function (r) { if (!srv()) return orig.conta(); telaRedefinir(r); };
  V.instalar = function () { if (srv() && Store.estado.sessao && Store.estado.sessao.precisaInstalar) telaInstalar(); else location.hash = "#entrar"; };
  V.entrar = function () {
    if (semServidor()) { telaEntrar(); avisoSemServidor(); return; }
    if (!srv()) return orig.conta();
    if (Store.estado.sessao && Store.estado.sessao.precisaInstalar) return telaInstalar();
    if (conta()) return orig.conta();
    telaEntrar();
  };
  V.conta = function () {
    if (srv() && !conta()) { lembra("#conta"); return telaEntrar("Entre para ver os seus salvos, roteiros e avaliações."); }
    orig.conta();
  };
  function exigeAnunciante(h, fn) {
    return function (r) {
      if (srv()) {
        if (!conta()) { lembra(h); return telaEntrar("Para anunciar, entre na sua conta ou crie a sua, grátis. As ferramentas de anúncio liberam com o pagamento.", ""); }
      }
      fn(r);
    };
  }
  V.anunciar = exigeAnunciante("#anunciar", orig.anunciar);
  V.anunciante = exigeAnunciante("#anunciante", orig.anunciante);
  if (window.Painel) {
    var abrePainel = Painel.abrir;
    Painel.abrir = function (el) {
      if (srv()) {
        if (Store.estado.sessao && Store.estado.sessao.precisaInstalar) return telaInstalar();
        if (!conta()) { lembra("#painel"); return telaEntrar("O painel master é só para a equipe CoraçãoBR."); }
      }
      abrePainel(el);
    };
  }

  /* Ícone de conta no topo: mostra a inicial de quem entrou. */
  function topo() {
    var a = document.querySelector('header a.glass[href="#entrar"]'), c = conta(); if (!a || !srv()) return;
    if (c) { a.setAttribute("aria-label", "Menu da conta de " + c.nome); a.setAttribute("aria-haspopup", "menu"); a.dataset.contaMenu = "1"; a.innerHTML = '<span class="ini">' + esc((c.nome || "?").trim().charAt(0).toUpperCase()) + "</span>"; }
    else { a.removeAttribute("data-conta-menu"); a.removeAttribute("aria-haspopup"); }
  }
  /* Menu da conta (clique na inicial no topo): minha conta, painéis e Sair */
  function fechaMenu() { var m = document.getElementById("conta-menu"); if (m) m.remove(); }
  document.addEventListener("click", function (e) {
    var a = e.target.closest("a[data-conta-menu]");
    if (!a) { if (!e.target.closest("#conta-menu")) fechaMenu(); return; }
    e.preventDefault(); if (document.getElementById("conta-menu")) { fechaMenu(); return; }
    var c = conta(); if (!c) { location.hash = "#entrar"; return; }
    var DI = window.Dash && Dash.ic ? Dash.ic : ic, p = c.papel, it = function (h, i, t) { return '<a role="menuitem" href="' + h + '">' + DI(i) + "<span>" + t + "</span></a>"; };
    var m = document.createElement("div"); m.id = "conta-menu"; m.className = "conta-menu"; m.setAttribute("role", "menu");
    m.innerHTML = '<div class="cm-who"><span class="ini">' + esc((c.nome || "?").trim().charAt(0).toUpperCase()) + "</span><div><b>" + esc(c.nome || "") + "</b><small>" + esc(c.email || "") + '</small><em class="cm-papel">' + esc(rotulo(c)) + "</em></div></div>" +
      it("#conta", "user", "Minha conta") + it("#lista", "route", "Meu roteiro") +
      it("#anunciante", "store", "Meu negócio") +
      (p === "master" ? it("#painel", "chart", "Painel master") : "") +
      '<button type="button" role="menuitem" class="cm-sair" data-sair>' + DI("out") + "<span>Sair da conta</span></button>";
    document.body.appendChild(m);
    var r = a.getBoundingClientRect(); m.style.top = Math.round(r.bottom + 10) + "px"; m.style.right = Math.max(10, Math.round(innerWidth - r.right)) + "px";
  });
  window.addEventListener("hashchange", fechaMenu); window.addEventListener("resize", fechaMenu);
  document.addEventListener("keydown", function (e) { if (e.key === "Escape") fechaMenu(); });
  Store.assinar(function () { if (Store.estado.pronto) topo(); });

  window.Auth = { blocoConta: blocoConta, abaUsuarios: abaUsuarios, telaEntrar: telaEntrar, rotulo: rotulo };
})();
