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
  var NOMES = { usuario: "Usuário", anunciante: "Anunciante", master: "Master" };

  /* Para onde voltar depois de entrar. */
  function lembra(h) { try { sessionStorage.setItem("depois-login", h); } catch (e) { /* ok */ } }
  function destino(c) {
    var h = null; try { h = sessionStorage.getItem("depois-login"); sessionStorage.removeItem("depois-login"); } catch (e) { /* ok */ }
    if (h && !/^#(entrar|cadastro|esqueci|redefinir)/.test(h)) return h;
    return c && c.papel === "master" ? "#painel" : c && c.papel === "anunciante" ? "#anunciante" : "#conta";
  }
  /* Recarrega para o guia inteiro reler os dados com a nova sessão. */
  function vaiPara(h) { if (location.hash === h) location.reload(); else { location.hash = h; setTimeout(function () { location.reload(); }, 30); } }

  function campo(id, rotulo, tipo, attr, ajuda) {
    return '<div class="field"><label for="' + id + '">' + rotulo + '</label>' +
      (tipo === "password" ? '<div class="senha"><input id="' + id + '" type="password" ' + (attr || "") + '><button type="button" class="link" data-ver="' + id + '" aria-label="Mostrar senha">Mostrar</button></div>' : '<input id="' + id + '" type="' + tipo + '" ' + (attr || "") + ">") +
      (ajuda ? '<small class="muted">' + ajuda + "</small>" : "") + "</div>";
  }
  function moldura(titulo, sub, corpo, lado) {
    G.app.innerHTML = '<section class="block"><div class="wrap auth">' +
      '<div class="auth-lado">' + (lado || ladoPadrao()) + "</div>" +
      '<div class="auth-card panel stack"><div><p class="eyebrow">CoraçãoBR</p><h1 class="page-h" style="margin-top:4px">' + titulo + "</h1>" + (sub ? '<p class="muted" style="margin-top:6px">' + sub + "</p>" : "") + "</div>" + corpo + "</div></div></section>";
    var f = $("form", G.app), i = f && f.querySelector("input"); if (i && matchMedia("(min-width:760px)").matches) i.focus();
  }
  function ladoPadrao() {
    return '<h2>Uma conta, três jeitos de usar</h2><ul class="auth-lista">' +
      "<li><b>Usuário</b><span>Salve lugares, ative lembretes, monte roteiros e avalie o que visitou, em qualquer aparelho.</span></li>" +
      "<li><b>Anunciante</b><span>Contrate um plano, publique o anúncio da sua empresa, edite quando quiser e acompanhe os resultados.</span></li>" +
      "<li><b>Equipe</b><span>A conta master administra o guia, os anunciantes e as finanças.</span></li></ul>";
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
    if (tipo) try { sessionStorage.setItem("tipo-cadastro", tipo); } catch (e) { /* ok */ }
    moldura("Entrar", aviso || "Use o e-mail e a senha da sua conta.",
      '<form id="f-entrar" class="stack" style="gap:14px" novalidate>' +
      campo("a-email", "E-mail", "email", 'autocomplete="username" required maxlength="160" inputmode="email"') +
      campo("a-senha", "Senha", "password", 'autocomplete="current-password" required maxlength="200"') +
      '<p class="auth-msg" id="a-msg" role="alert" hidden></p>' +
      '<button class="btn" type="submit">Entrar</button>' +
      '<div class="row" style="justify-content:space-between"><a class="more" href="#esqueci">Esqueci minha senha</a><a class="more" href="#cadastro">Criar conta</a></div></form>');
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
    var tipo = "usuario"; try { tipo = sessionStorage.getItem("tipo-cadastro") || "usuario"; } catch (e) { /* ok */ }
    var op = function (v, t, d) { return '<label class="opt"><input type="radio" name="a-tipo" value="' + v + '"' + (tipo === v ? " checked" : "") + "><span><b>" + t + "</b><small>" + d + "</small></span></label>"; };
    moldura("Criar conta", "Leva menos de um minuto.",
      '<form id="f-cad" class="stack" style="gap:14px" novalidate>' +
      '<fieldset class="pick" style="border:0;padding:0;margin:0"><legend class="small muted" style="margin-bottom:8px">Como você vai usar a CoraçãoBR?</legend>' +
      op("usuario", "Quero usar o guia", "Salvar lugares, lembretes, roteiros e avaliações.") +
      op("anunciante", "Quero anunciar minha empresa", "Contratar um plano, publicar e editar o anúncio.") + "</fieldset>" +
      campo("c-nome", "Nome", "text", 'autocomplete="name" required maxlength="60"') +
      campo("c-email", "E-mail", "email", 'autocomplete="email" required maxlength="160" inputmode="email"') +
      campo("c-senha", "Senha", "password", 'autocomplete="new-password" required minlength="8" maxlength="200"', "Pelo menos 8 caracteres, com letras e números.") +
      campo("c-senha2", "Repita a senha", "password", 'autocomplete="new-password" required maxlength="200"') +
      '<label class="check"><input type="checkbox" id="c-aceite"><span>Li e aceito os <a href="#termos" target="_blank">termos de uso</a> e a <a href="#privacidade" target="_blank">política de privacidade</a>.</span></label>' +
      '<p class="auth-msg" id="c-msg" role="alert" hidden></p>' +
      '<button class="btn" type="submit">Criar conta</button>' +
      '<p class="small muted">Já tem conta? <a href="#entrar">Entrar</a></p></form>');
    $("#f-cad").onsubmit = function (e) {
      e.preventDefault(); var f = this, m = $("#c-msg");
      var d = { nome: $("#c-nome").value.trim(), email: $("#c-email").value.trim(), senha: $("#c-senha").value, tipo: (f.querySelector('input[name="a-tipo"]:checked') || {}).value, aceite: $("#c-aceite").checked };
      if (!d.nome) return msg(m, "Informe seu nome.");
      if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(d.email)) return msg(m, "Informe um e-mail válido.");
      if (d.senha.length < 8 || !/[A-Za-z]/.test(d.senha) || !/\d/.test(d.senha)) return msg(m, "A senha precisa ter pelo menos 8 caracteres, com letras e números.");
      if (d.senha !== $("#c-senha2").value) return msg(m, "As duas senhas não são iguais.");
      if (!d.aceite) return msg(m, "Para criar a conta, aceite os termos de uso e a política de privacidade.");
      ocupa(f, true); msg(m, "");
      Store.api("cadastrar", d).then(function (j) {
        try { sessionStorage.removeItem("tipo-cadastro"); localStorage.setItem("meu-nome", JSON.stringify(j.conta.nome)); } catch (er) { /* ok */ }
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
      '<form id="f-ins" class="stack" style="gap:14px" novalidate>' + campo("i-chave", "Chave de instalação", "text", 'required maxlength="40" autocomplete="off" style="text-transform:uppercase;letter-spacing:.12em"', "No hPanel: Gerenciador de Arquivos → public_html/coracaobr/dados/CHAVE-INSTALACAO.txt") + campo("i-nome", "Seu nome", "text", 'autocomplete="name" required maxlength="60"') +
      campo("i-email", "E-mail", "email", 'autocomplete="username" required maxlength="160"') +
      campo("i-senha", "Senha", "password", 'autocomplete="new-password" required maxlength="200"', "Use uma senha forte: 12 caracteres ou mais, com letras e números.") +
      campo("i-senha2", "Repita a senha", "password", 'autocomplete="new-password" required maxlength="200"') +
      '<p class="auth-msg" id="i-msg" role="alert" hidden></p><button class="btn" type="submit">Criar conta master</button></form>',
      '<h2>Instalação</h2><p class="muted">Este formulário só funciona enquanto não existe conta master, e só com a chave guardada no servidor. Depois de criada a conta, a chave é apagada e o formulário some.</p>');
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
    var atalhos = (c.papel === "master" ? '<a class="btn sm" href="#painel">Painel master</a><a class="btn ghost sm" href="#anunciante">Anúncios</a>' : c.papel === "anunciante" ? '<a class="btn sm" href="#anunciante">Painel do anunciante</a><a class="btn ghost sm" href="#anunciar" data-novo-anuncio>Novo anúncio</a>' : '<a class="btn ghost sm" href="#anunciar">Quero anunciar</a>');
    return '<div class="panel stack conta-box" style="gap:12px"><div class="row" style="justify-content:space-between;align-items:flex-start"><div><h3 style="margin:0">Sua conta</h3><p class="small muted" style="margin-top:4px">' + esc(c.email) + ' · <span class="pill ok">' + esc(NOMES[c.papel] || c.papel) + "</span></p></div>" +
      '<button type="button" class="btn ghost sm" data-sair>Sair</button></div>' +
      '<div class="row" style="gap:8px">' + atalhos + '<button type="button" class="btn ghost sm" data-dados>Dados e senha</button>' + (window.Recursos && Recursos.on("paraVoce") ? '<button type="button" class="btn ghost sm" data-abre-int>Meus interesses</button>' : "") + '</div>' +
      (window.Recursos && Recursos.on("newsletter") ? '<label class="check" style="font-size:.92rem"><input type="checkbox" id="c-news" data-news-conta> Receber a newsletter semanal por e-mail</label>' : "") +
      '<form id="f-dados" class="stack" style="gap:12px" hidden novalidate>' +
      campo("d-nome", "Nome", "text", 'maxlength="60" value="' + esc(c.nome) + '"') +
      campo("d-email", "E-mail", "email", 'maxlength="160" value="' + esc(c.email) + '"') +
      campo("d-nova", "Nova senha (deixe em branco para manter)", "password", 'autocomplete="new-password" maxlength="200"') +
      campo("d-atual", "Senha atual (obrigatória para trocar e-mail ou senha)", "password", 'autocomplete="current-password" maxlength="200"') +
      '<p class="auth-msg" id="d-msg" role="alert" hidden></p><div class="row" style="gap:8px"><button class="btn sm" type="submit">Salvar</button>' +
      (c.papel !== "master" ? '<button type="button" class="link" data-excluir style="color:var(--danger,#B3261E)">Excluir minha conta</button>' : "") + "</div></form></div>";
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
    if (e.target.closest("[data-excluir]")) {
      var m = $("#d-msg"), s = $("#d-atual") ? $("#d-atual").value : "";
      if (!s) { msg(m, "Para excluir a conta, digite a sua senha atual e toque de novo em Excluir minha conta."); return; }
      var b = e.target.closest("[data-excluir]");
      if (!b.dataset.confirma) { b.dataset.confirma = "1"; b.textContent = "Confirmar exclusão definitiva"; msg(m, "Isto apaga a conta, as avaliações, os roteiros e os anúncios. Não dá para desfazer."); return; }
      Store.api("excluir_conta", { senha: s }).then(function () { try { ["lista", "lembretes", "meus-roteiros", "minhas-avaliacoes", "meu-nome", "meus-anuncios"].forEach(function (k) { localStorage.removeItem(k); }); } catch (er) { /* ok */ } vaiPara("#inicio"); }).catch(function (er) { msg(m, er.message); });
    }
  });
  function ligaDados() {
    var f = $("#f-dados"); if (!f || f.dataset.ligado) return; f.dataset.ligado = "1";
    f.onsubmit = function (e) {
      e.preventDefault(); var m = $("#d-msg");
      var d = { nome: $("#d-nome").value.trim(), email: $("#d-email").value.trim(), senhaNova: $("#d-nova").value, senhaAtual: $("#d-atual").value };
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
    var eu = conta() || {}, n = { usuario: 0, anunciante: 0, master: 0 };
    listaContas.forEach(function (u) { n[u.papel] = (n[u.papel] || 0) + 1; });
    var q = filtro.toLowerCase(), vis = listaContas.filter(function (u) { return (!filtroPapel || u.papel === filtroPapel) && (!q || (u.nome + " " + u.email).toLowerCase().indexOf(q) >= 0); });
    el.innerHTML = '<div class="stack">' +
      '<div class="kpis"><div class="kpi"><b class="num">' + listaContas.length + '</b><span>contas</span></div><div class="kpi"><b class="num">' + n.usuario + '</b><span>usuários</span></div><div class="kpi"><b class="num">' + n.anunciante + '</b><span>anunciantes</span></div><div class="kpi"><b class="num">' + n.master + "</b><span>master</span></div></div>" +
      '<div class="row" style="gap:8px"><label class="sr" for="u-q">Buscar conta</label><input id="u-q" placeholder="Buscar por nome ou e-mail" value="' + esc(filtro) + '" style="flex:1;min-width:0;padding:10px 12px;border:1px solid var(--line);border-radius:12px;background:var(--surface);color:var(--ink);font:inherit">' +
      '<label class="sr" for="u-p">Filtrar por papel</label><select id="u-p" style="padding:10px 12px;border:1px solid var(--line);border-radius:12px;background:var(--surface);color:var(--ink);font:inherit"><option value="">Todos</option><option value="usuario"' + (filtroPapel === "usuario" ? " selected" : "") + '>Usuários</option><option value="anunciante"' + (filtroPapel === "anunciante" ? " selected" : "") + '>Anunciantes</option><option value="master"' + (filtroPapel === "master" ? " selected" : "") + ">Master</option></select></div>" +
      '<div class="list">' + (vis.length ? vis.map(function (u) {
        var proprio = u.id === eu.uid, bloq = +u.bloqueado;
        return '<div class="lrow conta-row" style="cursor:default" data-uid="' + esc(u.id) + '"><span><b>' + esc(u.nome) + (proprio ? " (você)" : "") + (bloq ? ' <span class="pill warn">Suspensa</span>' : "") + "</b><small>" + esc(u.email) + " · criada em " + esc(dataBR(u.criado)) + " · último acesso " + esc(dataBR(u.ultimo)) + "</small></span>" +
          '<span class="row" style="gap:6px;justify-content:flex-end">' +
          (proprio ? '<span class="pill ok">' + esc(NOMES[u.papel]) + "</span>" :
            '<label class="sr" for="pp-' + esc(u.id) + '">Papel de ' + esc(u.nome) + '</label><select id="pp-' + esc(u.id) + '" data-papel>' + ["usuario", "anunciante", "master"].map(function (p) { return '<option value="' + p + '"' + (u.papel === p ? " selected" : "") + ">" + NOMES[p] + "</option>"; }).join("") + "</select>" +
            '<button type="button" class="btn ghost sm" data-op="' + (bloq ? "liberar" : "bloquear") + '">' + (bloq ? "Reativar" : "Suspender") + "</button>") +
          '<button type="button" class="btn ghost sm" data-op="link">Link de nova senha</button>' +
          (proprio || u.papel === "master" ? "" : '<button type="button" class="btn ghost sm" data-op="excluir">Excluir</button>') + "</span></div>";
      }).join("") : '<p class="muted" style="padding:16px">Nenhuma conta encontrada.</p>') + "</div>" +
      '<div id="u-link" class="panel stack" style="gap:8px" hidden></div>' +
      '<p class="small muted">O link de nova senha vale por 24 horas. Envie para a pessoa pelo WhatsApp ou e-mail. A equipe nunca vê nem guarda senhas: elas ficam criptografadas no servidor.</p></div>';
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
  V.cadastro = function () { if (!srv()) return orig.conta(); if (conta()) return vaiPara(destino(conta())); telaCadastro(); };
  V.esqueci = function () { if (!srv()) return orig.conta(); telaEsqueci(); };
  V.redefinir = function (r) { if (!srv()) return orig.conta(); telaRedefinir(r); };
  V.instalar = function () { if (srv() && Store.estado.sessao && Store.estado.sessao.precisaInstalar) telaInstalar(); else location.hash = "#entrar"; };
  V.entrar = function () {
    if (!srv()) return orig.conta();
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
        if (!conta()) { lembra(h); return telaEntrar("Para anunciar, entre na sua conta ou crie uma conta de anunciante.", "anunciante"); }
        if (papel() === "usuario") return telaVirarAnunciante(h);
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
    if (c) { a.setAttribute("aria-label", "Conta de " + c.nome); a.innerHTML = '<span class="ini">' + esc((c.nome || "?").trim().charAt(0).toUpperCase()) + "</span>"; }
  }
  Store.assinar(function () { if (Store.estado.pronto) topo(); });

  window.Auth = { blocoConta: blocoConta, abaUsuarios: abaUsuarios, telaEntrar: telaEntrar };
})();
