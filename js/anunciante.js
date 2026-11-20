/* Cadastro feito pelo próprio anunciante: ele monta o anúncio, paga US$ 10 por mês e a página entra no ar na hora, sem aprovação.
   Cada cadastro e cada pagamento gera um aviso no Painel.
   Nesta versão o pagamento é de TESTE: nenhum cartão é pedido. A cobrança real entra ligando um processador (Stripe) num servidor. */
(function () {
  "use strict";
  var G = window.Guia, esc = G.esc, $ = function (s, r) { return (r || document).querySelector(s); };
  var D = null, ocupado = false, removidas = [];
  var CIDADES_AN = null;
  var CATEG = G.SERVICOS.concat(G.COMIDA, ["mercado-brasileiro", "mercado", "compras"]);

  function meusIds() { try { return JSON.parse(localStorage.getItem("meus-anuncios") || "[]"); } catch (e) { return []; } }
  function guardaMeu(id) { var m = meusIds(); if (m.indexOf(id) < 0) m.push(id); try { localStorage.setItem("meus-anuncios", JSON.stringify(m)); } catch (e) { /* ok */ } }
  function meusLugares() {
    var ids = meusIds(), uid = Store.uid();
    return Store.lista("lugares").filter(function (l) { return l.assinatura && (ids.indexOf(l.id) >= 0 || (uid && (l.donoUid === uid || String(l.id).indexOf(uid + "~") === 0))); });
  }
  function maisUmMes(iso) { var d = new Date((iso || G.hojeISO()) + "T12:00:00"), dia = d.getDate(); d.setDate(1); d.setMonth(d.getMonth() + 1); d.setDate(Math.min(dia, new Date(d.getFullYear(), d.getMonth() + 1, 0).getDate())); return d.getFullYear() + "-" + String(d.getMonth() + 1).padStart(2, "0") + "-" + String(d.getDate()).padStart(2, "0"); }
  function dataBR(iso) { var p = String(iso || "").split("-"); return p.length === 3 && /^\d{4}$/.test(p[0]) ? esc(p[2].slice(0, 2) + "/" + p[1].slice(0, 2) + "/" + p[0]) : ""; }
  function fld(id, label, val, attr, cls) { return '<div class="field ' + (cls || "") + '"><label for="' + id + '">' + label + '</label><input id="' + id + '" value="' + esc(val == null ? "" : val) + '" ' + (attr || "") + "></div>"; }
  function v(id) { var e = $("#" + id); return e ? e.value.trim() : ""; }
  /* Planos: preço e link de pagamento vêm de Painel → Finanças. */
  var planoEscolhido = "anuncio"; /* plano único; "basico" e "destaque" ficam só para assinaturas antigas */
  document.addEventListener("click", function (e) { var b = e.target.closest("[data-plano]"); if (b) planoEscolhido = "anuncio"; });
  function precoPlano() { return Number(G.config().precoAnuncio) || 0; }
  function linkPlano() { var pg = G.config().pagamentos || {}; return G.url(pg.anuncio || pg.basico); }
  function nomePlano(a) { return a && a.plano === "destaque" ? "Destaque (plano antigo)" : a && a.plano === "basico" ? "Básico (plano antigo)" : "Anunciante"; }
  var LIMITE = 3;
  /* Plano único por conta: o primeiro anúncio paga; o 2º e o 3º entram incluídos e acompanham a situação do plano. */
  function principal() { var ls = meusLugares(); return ls.filter(function (l) { return l.assinatura && Number(l.assinatura.valor) > 0; })[0] || ls[0] || null; }
  function sincroniza(base, exceto, zerar) {
    meusLugares().forEach(function (o) {
      if (o.id === exceto) return;
      var na = Object.assign({}, o.assinatura || {}, { status: base.status, renovacaoAutomatica: base.renovacaoAutomatica, proximaCobranca: base.proximaCobranca });
      if (zerar) { na.valor = 0; na.incluido = true; }
      if (JSON.stringify(na) !== JSON.stringify(o.assinatura)) Store.gravar("lugares", o.id, Object.assign({}, o, { assinatura: na })).catch(function () {});
    });
  }
  function bannerHtml() { return D.banner && D.banner.src ? '<figure class="ban-prev"><img src="' + esc(Store.urlFoto(D.banner.src)) + '" alt=""><button type="button" id="n-btira" aria-label="Remover banner">×</button></figure>' : '<p class="small muted">Nenhum banner enviado.</p>'; }
  function aviso(tipo, l, valor) { return Store.gravar("avisos", Store.novoId("av"), { tipo: tipo, lugarId: l.id, nome: l.nome, categoria: l.categoria, valor: valor || 0, criadoEm: new Date().toISOString(), lido: false }); }
  function fotosHtml() { return (D.fotos || []).map(function (f, i) { return '<figure><img src="' + esc(Store.urlFoto(f.src)) + '" alt=""><button type="button" data-tirar="' + i + '" aria-label="Remover foto">×</button></figure>'; }).join(""); }

  /* ---------- formulário ---------- */
  function viewAnunciar(id) {
    var c = G.config(), existente = id ? Store.obter("lugares", id) : null;
    if (!existente && meusLugares().length >= LIMITE) {
      G.app.innerHTML = '<section class="block"><div class="wrap narrow stack" style="text-align:center;justify-items:center;padding-block:30px"><h1 class="page-h">Limite de ' + LIMITE + ' anúncios</h1><p class="muted">O plano do anunciante inclui até ' + LIMITE + ' anúncios, cada um com o seu banner. Para cadastrar outro, apague ou edite um dos atuais.</p><a class="btn" href="#anunciante">Ir para o painel do anunciante</a></div></section>';
      return;
    }
    var prin = existente ? null : principal(), incluido = !!(prin && prin.assinatura && prin.assinatura.status === "ativa");
    D = existente ? JSON.parse(JSON.stringify(existente)) : { id: "", tipo: "estabelecimento", nome: "", categoria: "handyman", brasileiro: true, cidade: "", fotos: [], menu: [] };
    D.fotos = D.fotos || []; removidas = [];
    var CID = CIDADES_AN = [["Dallas", 32.7767, -96.797], ["Fort Worth", 32.7555, -97.3308], ["Plano", 33.0198, -96.6989], ["Frisco", 33.1507, -96.8236], ["McKinney", 33.1972, -96.6398], ["Allen", 33.1032, -96.6706], ["Irving", 32.814, -96.9489], ["Carrollton", 32.9756, -96.89], ["Richardson", 32.9483, -96.7299], ["Garland", 32.9126, -96.6389], ["Arlington", 32.7357, -97.1081], ["Grand Prairie", 32.746, -96.9978], ["Grapevine", 32.9343, -97.0781], ["Euless", 32.8371, -97.082], ["Bedford", 32.844, -97.1431], ["Hurst", 32.8235, -97.1706], ["Lewisville", 33.0462, -96.9942], ["Denton", 33.2148, -97.1331], ["Addison", 32.9618, -96.8292], ["Coppell", 32.9546, -97.015], ["Southlake", 32.9412, -97.1342], ["The Colony", 33.0807, -96.8928], ["Mesquite", 32.7668, -96.5992], ["Rockwall", 32.9312, -96.4597]], partida = CID.map(function (p) { return p[0]; });
    G.app.innerHTML = '<section class="block"><div class="wrap"><form id="f-an" class="stack" style="max-width:640px;margin:0 auto">' +
      '<div><a class="more" href="#' + (existente ? "anunciante" : "anuncie") + '">← voltar</a><h1 class="page-h" style="margin-top:8px">' + (existente ? "Editar meu anúncio" : "Cadastrar minha empresa") + '</h1><p class="muted" style="margin-top:6px">Preencha só o que tiver. O que ficar vazio não aparece.</p></div>' +
      '<div class="panel stack" style="gap:12px"><h3>Sua empresa</h3>' + fld("n-nome", "Nome da empresa", D.nome, "required maxlength=80") +
      '<div class="field"><label for="n-cat">Tipo de serviço</label><select id="n-cat">' + CATEG.map(function (k) { return '<option value="' + k + '"' + (k === D.categoria ? " selected" : "") + ">" + esc(G.CATS[k] || k) + "</option>"; }).join("") + "</select></div>" +
      '<div class="field"><label for="n-desc">O que você faz</label><textarea id="n-desc" maxlength="700" required placeholder="Conte o que você oferece, há quanto tempo e para quem.">' + esc(D.historia || "") + "</textarea></div>" +
      fld("n-cupom", "Oferta para quem vem pelo guia (opcional)", D.cupom, 'maxlength=90 placeholder="Ex.: 10% de desconto na primeira visita"') +
      '<div class="field"><label for="n-br">Negócio de brasileiro</label><select id="n-br"><option value="1"' + (D.brasileiro !== false ? " selected" : "") + '>Sim</option><option value="0"' + (D.brasileiro === false ? " selected" : "") + ">Não</option></select></div>" +
      '<label class="check"><input type="checkbox" id="n-pt"' + (D.falaPortugues !== false ? " checked" : "") + '> Atendemos em português (ganha o selo Fala português)</label>' +
      (window.Recursos && Recursos.on("etiquetas") ? '<fieldset style="border:0;padding:0;margin:0"><legend class="small muted" style="margin-bottom:6px">Marque o que vale para o seu negócio</legend><div class="pv-op">' + Recursos.etiquetas().map(function (e) { return '<label class="check"><input type="checkbox" data-an-etq="' + esc(e.id) + '"' + ((D.etiquetas || []).indexOf(e.id) >= 0 ? " checked" : "") + "> " + esc(e.nome) + "</label>"; }).join("") + "</div></fieldset>" : "") + '</div>' +
      '<div class="panel stack" style="gap:12px"><h3>Contato</h3>' + fld("n-wa", "WhatsApp (com DDD)", D.whatsapp, 'inputmode="tel"') + fld("n-tel", "Telefone", D.telefone, 'inputmode="tel"') + fld("n-ig", "Instagram (@usuario)", D.instagram) + fld("n-fb", "Página no Facebook (link)", D.facebook, 'placeholder="https://facebook.com/suapagina"') + fld("n-site", "Site", D.site, 'placeholder="https://"') + "</div>" +
      '<div class="panel stack" style="gap:12px"><h3>Onde você atende</h3>' + fld("n-end", "Endereço (opcional para quem atende em domicílio)", D.endereco) +
      '<div class="field"><label for="n-reg">Cidade</label><select id="n-reg">' + partida.map(function (p) { return '<option' + (p === D.cidade ? " selected" : "") + ">" + esc(p) + "</option>"; }).join("") + "</select></div>" +
      '<div class="field"><span>Horário de atendimento</span>' + Horario.editor(D) + "</div>" + "</div>" +
      (window.Cardapio ? Cardapio.editor(D) : "") +
      (existente ? '<div class="panel stack" style="gap:10px"><h3>Assinatura</h3><p>' + (D.assinatura.status === "ativa" ? "Ativa. Próxima cobrança de " + G.usd(D.assinatura.valor) + " em <b>" + dataBR(D.assinatura.proximaCobranca) + "</b>." : "Renovação cancelada. O anúncio fica no ar até <b>" + dataBR(D.assinatura.proximaCobranca) + "</b>.") + '</p><div class="row"><button class="btn" type="submit">Salvar alterações</button>' + (D.assinatura.status === "ativa" ? '<button type="button" class="btn danger" id="n-cancelar">Cancelar renovação</button>' : '<button type="button" class="btn ghost" id="n-reativar">Reativar por ' + G.usd(c.precoAnuncio) + "</button>") + "</div></div>"
        : incluido ? '<div class="panel stack" style="gap:12px"><h3>Plano</h3><p>Este é o anúncio ' + (meusLugares().length + 1) + ' de ' + LIMITE + ' e está <b>incluído no seu plano</b>. Não há cobrança extra.</p><button class="btn" type="submit" id="n-pagar">Publicar anúncio</button></div>'
        : '<div class="panel stack" style="gap:12px"><h3>Plano e pagamento</h3><div class="opt" style="cursor:default"><span><b>Anunciante · ' + G.usd(precoPlano()) + ' por mês</b><small>Até 3 anúncios, cada um com banner no carrossel, publicações no feed, cupom e métricas</small></span></div><p class="small muted">Renovação automática todo mês. Cancele quando quiser.</p>' + (linkPlano() ? '<p class="note">Depois de publicar, abrimos a página segura de pagamento (cartão) para ativar a cobrança mensal.</p>' : '<p class="note">O anúncio entra no ar na hora. A equipe CoraçãoBR envia a cobrança mensal pelo WhatsApp informado (cartão, Zelle ou PIX).</p>') + '<button class="btn" type="submit" id="n-pagar">' + (linkPlano() ? "Publicar e ir para o pagamento" : "Publicar anúncio") + '</button></div>') +
      "</form></div></section>";

    $("#n-file").addEventListener("change", async function (e) {
      var files = Array.from(e.target.files || []), livres = 10 - D.fotos.length;
      if (files.length > livres) G.toast("Cada anúncio aceita até 10 fotos.");
      for (var i = 0; i < Math.min(files.length, livres); i++) {
        try { D.fotos.push({ src: await Store.salvarFoto(files[i]), credito: "" }); } catch (err) { G.toast(err.message || "Não foi possível enviar a foto."); break; }
        $("#n-fotos").innerHTML = fotosHtml(); $("#n-nf").textContent = D.fotos.length;
      }
      e.target.value = "";
    });
    $("#n-fotos").addEventListener("click", function (e) { var b = e.target.closest("[data-tirar]"); if (!b) return; var x = D.fotos.splice(Number(b.dataset.tirar), 1)[0]; if (x) removidas.push(x.src); this.innerHTML = fotosHtml(); $("#n-nf").textContent = D.fotos.length; });
    $("#n-bfile").addEventListener("change", function (e) {
      var f = (e.target.files || [])[0]; if (!f) return;
      Store.salvarFoto(f).then(function (src) { if (D.banner && D.banner.src) removidas.push(D.banner.src); D.banner = { src: src, texto: v("n-btxt") }; $("#n-ban").innerHTML = bannerHtml(); }).catch(function (er) { G.toast(er.message || "Não foi possível enviar o banner."); });
      e.target.value = "";
    });
    $("#n-ban").addEventListener("click", function (e) { if (e.target.closest("#n-btira")) { if (D.banner && D.banner.src) removidas.push(D.banner.src); D.banner = null; $("#n-ban").innerHTML = bannerHtml(); } });
    var cx = $("#n-cancelar"), rx = $("#n-reativar");
    if (cx) cx.addEventListener("click", function () {
      if (!cx.dataset.ok) { cx.dataset.ok = "1"; cx.textContent = "Confirmar cancelamento"; return; }
      existente.assinatura.status = "cancelada"; existente.assinatura.renovacaoAutomatica = false;
      Store.gravar("lugares", existente.id, existente).then(function () { sincroniza(existente.assinatura, existente.id, false); aviso("cancelamento", existente, 0); G.toast("Renovação cancelada."); viewAnunciar(existente.id); }).catch(falha);
    });
    if (rx) rx.addEventListener("click", function () {
      var aa = existente.assinatura || {}, aindaPago = (aa.proximaCobranca || "") >= G.hojeISO();
      existente.assinatura = aindaPago ? Object.assign({}, aa, { status: "ativa", renovacaoAutomatica: true }) : { plano: "anuncio", valor: precoPlano(), inicio: G.hojeISO(), proximaCobranca: maisUmMes(), renovacaoAutomatica: true, status: "ativa", modo: linkPlano() ? "link" : "teste" };
      Store.gravar("lugares", existente.id, existente).then(function () { sincroniza(existente.assinatura, existente.id, !aindaPago); if (!aindaPago) aviso("pagamento", existente, existente.assinatura.valor); G.toast(aindaPago ? "Renovação automática reativada. Nada foi cobrado agora." : "Assinatura reativada."); viewAnunciar(existente.id); }).catch(falha);
    });
    $("#f-an").addEventListener("submit", function (e) {
      e.preventDefault(); if (ocupado) return;
      var reg = CIDADES_AN.filter(function (p) { return p[0] === v("n-reg"); })[0] || CIDADES_AN[0];
      D.nome = v("n-nome"); D.categoria = v("n-cat"); D.historia = v("n-desc"); D.cupom = v("n-cupom"); D.brasileiro = v("n-br") === "1";
      if (window.Cardapio) Cardapio.ler(document, D); D.menuVerificadoEm = (D.menu || []).length ? G.hojeISO().slice(0, 7) : ""; D.whatsapp = v("n-wa"); D.telefone = v("n-tel"); D.instagram = v("n-ig"); D.facebook = v("n-fb"); D.site = v("n-site"); D.endereco = v("n-end"); D.cidade = reg[0]; var sem = Horario.lerEditor($("#f-an .hed")); if (sem) sem = sem.map(function (x) { return x || []; }); delete D.semana; D.horas = sem ? Horario.paraObj(sem) : null; D.horario = sem ? Horario.texto(sem) : (existente ? D.horario : "");
      if (!existente || !D.lat || D.coordsAprox) { D.lat = reg[1]; D.lng = reg[2]; D.coordsAprox = true; }
      D.falaPortugues = !!($("#n-pt") && $("#n-pt").checked);
      if (document.querySelector("[data-an-etq]")) D.etiquetas = Array.from(document.querySelectorAll("[data-an-etq]")).filter(function (x) { return x.checked; }).map(function (x) { return x.dataset.anEtq; });
      if (D.banner && D.banner.src) D.banner.texto = v("n-btxt");
      D.tipo = "estabelecimento"; D.anunciante = true; D.publicado = true; D.atualizadoEm = G.hojeISO().slice(0, 7);
      var novo = !existente, nid = D.id;
      if (novo) {
        nid = (D.nome.toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, "").replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "").slice(0, 44) || "empresa") + "-" + Date.now().toString(36).slice(-4); nid = Store.idProprio(nid);
        var pl = "anuncio";
        D.assinatura = incluido ? { plano: pl, valor: 0, incluido: true, principal: prin.id, inicio: G.hojeISO(), proximaCobranca: prin.assinatura.proximaCobranca, renovacaoAutomatica: prin.assinatura.renovacaoAutomatica, status: prin.assinatura.status, modo: prin.assinatura.modo }
          : { plano: pl, valor: precoPlano(), inicio: G.hojeISO(), proximaCobranca: maisUmMes(), renovacaoAutomatica: true, status: "ativa", modo: linkPlano() ? "link" : "teste" };
        D.donoUid = Store.uid() || ""; D.criadoEm = new Date().toISOString();
      }
      ocupado = true;
      Store.gravar("lugares", nid, D).then(function () {
        ocupado = false; removidas.forEach(Store.apagarFoto); D.id = nid;
        if (novo) { guardaMeu(nid); aviso("cadastro", D, 0); if (!D.assinatura.incluido) aviso("pagamento", D, D.assinatura.valor); sucesso(D); var lk = !D.assinatura.incluido && linkPlano(); if (lk) window.open(lk, "_blank", "noopener"); } else { G.toast("Anúncio atualizado."); perfil = nid; location.replace("#anunciante"); }
      }).catch(falha);
    });
  }
  function falha() { ocupado = false; G.toast("Não foi possível salvar agora. Tente de novo."); }
  function sucesso(l) {
    var c = G.config(), msg = "Novo anunciante no CoraçãoBR: " + l.nome + " (" + (G.CATS[l.categoria] || l.categoria) + ").  Plano " + nomePlano(l.assinatura) + " de " + G.usd(l.assinatura.valor) + " por mês.";
    G.app.innerHTML = '<section class="block"><div class="wrap"><div class="stack" style="max-width:560px;margin:0 auto;text-align:center;justify-items:center;padding-block:30px"><span class="eyebrow">' + (l.assinatura.modo === "link" ? "Anúncio publicado · conclua o pagamento na página que abriu" : "Anúncio publicado · cobrança pela equipe") + '</span><h1 class="page-h">Seu anúncio está no ar.</h1><p class="muted">' + esc(l.nome) + " já aparece na frente das listas. A próxima renovação é em " + dataBR(l.assinatura.proximaCobranca) + '.</p><a class="btn" href="#lugar-' + esc(l.id) + '">Ver meu anúncio</a>' +
      (c.whatsappAviso ? '<a class="btn ghost" href="https://wa.me/' + esc(String(c.whatsappAviso).replace(/\D/g, "")) + "?text=" + encodeURIComponent(msg) + '" target="_blank" rel="noopener">' + G.ic("chat") + " Avisar a equipe do guia no WhatsApp</a>" : "") +
      '<a class="more" href="#entrar">Gerenciar em Conta → Meus anúncios</a></div></div></section>';
    window.scrollTo(0, 0);
  }

  /* ---------- painel do anunciante ---------- */
  var perfil = null, master = false;
  var metCache = {};
  function carrega(id) { return Store.consultar("metricas", "lugarId", id).then(function (ms) { metCache[id] = ms; return ms; }); }
  function soma(id, dias, lista) {
    var ini = new Date(G.hojeISO() + "T12:00:00"); ini.setDate(ini.getDate() - dias + 1); var de = ini.getFullYear() + "-" + String(ini.getMonth() + 1).padStart(2, "0") + "-" + String(ini.getDate()).padStart(2, "0");
    var t = { v: 0, r: 0, c: 0, p: 0, porDia: {} }, n = function (x) { x = Number(x); return isFinite(x) && x > 0 ? Math.floor(x) : 0; };
    (lista || metCache[id] || []).forEach(function (m) { if (m.lugarId !== id || String(m.dia) < de) return; t.v += n(m.v); t.r += n(m.r); t.c += n(m.c); t.p += n(m.p); var d = String(m.dia).slice(0, 10); if (/^\d{4}-\d{2}-\d{2}$/.test(d)) t.porDia[d] = (t.porDia[d] || 0) + n(m.v); });
    return t;
  }
  function viewPainelAn() {
    var ls = master && perfil ? [Store.obter("lugares", perfil)].filter(Boolean) : meusLugares();
    if (!ls.length) { G.app.innerHTML = '<section class="block"><div class="wrap"><div class="stack" style="max-width:520px;margin:0 auto;text-align:center;justify-items:center;padding-block:40px"><h1 class="page-h">Painel do anunciante</h1><p class="muted">Você ainda não tem anúncio neste aparelho. Cadastre sua empresa e ela entra no ar na hora.</p><a class="btn" href="#anunciar">Cadastrar minha empresa</a></div></div></section>'; return; }
    var l = ls.filter(function (x) { return x.id === perfil; })[0] || ls[0]; perfil = l.id;
    if (!metCache[l.id]) { G.app.innerHTML = '<section class="block"><div class="wrap"><p class="muted" style="padding-block:40px">Carregando métricas…</p></div></section>'; carrega(l.id).then(function () { if (location.hash === "#anunciante") viewPainelAn(); }); return; }
    var m = soma(l.id, 30), n = G.notas(l), a = l.assinatura || {}, noAr = l.publicado !== false, dias = [], max = 1;
    for (var i = 13; i >= 0; i--) { var d = new Date(); d.setDate(d.getDate() - i); var iso = d.getFullYear() + "-" + String(d.getMonth() + 1).padStart(2, "0") + "-" + String(d.getDate()).padStart(2, "0"); var q = m.porDia[iso] || 0; max = Math.max(max, q); dias.push([iso, q]); }
    var f = (l.fotos || [])[0];
    function k(nm, t, ic) { return '<div class="kpi"><span class="kic">' + G.ic(ic) + '</span><b class="num">' + nm + "</b><span>" + t + "</span></div>"; }
    var kpi = function (nm, t, icn, dark) { return '<div class="dk-card' + (dark ? " dk-dark" : "") + '"><small>' + t + '</small><b class="dk-big">' + nm + "</b>" + Dash.ic(icn) + "</div>"; };
    var status = '<div class="dk-card dk-flat dk-status"><span class="th" style="width:64px;height:64px;border-radius:18px;overflow:hidden;background:linear-gradient(160deg,#3A423E,#163832);display:block">' + (f ? '<img src="' + esc(Store.urlFoto(f.src)) + '" alt="" style="width:100%;height:100%;object-fit:cover">' : "") + "</span><span><b>" + (noAr ? '<i class="dk-dot"></i>Anúncio no ar' : "Anúncio pausado") + '</b><br><span class="small muted">' + esc(G.CATS[l.categoria] || "") + " · " + (noAr ? "pin verde no mapa e prioridade nas listas" : "ninguém está vendo agora") + '</span></span><button type="button" class="switch" role="switch" aria-checked="' + noAr + '" aria-label="Anúncio no ar" data-toggle><i></i></button></div>';
    var grafico = '<div class="dk-card dk-flat"><div class="dk-ch"><h3>Visualizações · 14 dias</h3><span class="small muted">' + (m.v ? "maior dia: " + max : "sem acessos ainda") + '</span></div><div class="bars">' + dias.map(function (d, i) { return '<div title="' + d[0] + ": " + d[1] + '"><i style="height:' + Math.max(3, Math.round(d[1] / max * 100)) + "%;animation-delay:" + (i * 0.03) + 's"></i><small>' + d[0].slice(8) + "</small></div>"; }).join("") + "</div>" + (m.v ? "" : '<p class="small muted" style="margin-top:8px">Compartilhe seu anúncio para começar a aparecer aqui.</p>') + "</div>";
    var geral = status + '<div class="dk-grid dk-g4">' + kpi(m.v, "Visualizações · 30 dias", "eye", true) + kpi(m.r, "Como chegar e apps", "route") + kpi(m.c, "Cliques em contato", "link") + kpi(n.guia != null ? n.guia.toFixed(1) : "–", n.qtd + (n.qtd === 1 ? " avaliação" : " avaliações"), "star") + "</div>" + grafico;
    var lim = LIMITE, usados = ls.length;
    var anuncios = '<div class="dk-grid dk-g3">' + ls.map(function (x) { var fx = (x.fotos || [])[0], b = x.banner && x.banner.src; return '<div class="dk-card dk-flat dk-an' + (x.id === l.id ? " on" : "") + '"><span class="dk-anf">' + (fx ? '<img src="' + esc(Store.urlFoto(fx.src)) + '" alt="">' : "") + "</span><b>" + esc(x.nome) + '</b><small>' + (x.publicado !== false ? "No ar" : "Pausado") + " · " + (b ? "banner no carrossel" : "sem banner") + '</small><div class="row" style="gap:6px"><button type="button" class="btn sm' + (x.id === l.id ? " soft" : " ghost") + '" data-outro="' + esc(x.id) + '">' + (x.id === l.id ? "Selecionado" : "Gerenciar") + '</button><button type="button" class="btn ghost sm" data-editar-id="' + esc(x.id) + '">Editar</button></div></div>'; }).join("") +
      (!master && usados < lim ? '<a class="dk-card dk-flat dk-novo" href="#anunciar" data-novo-anuncio>' + Dash.ic("plus") + "<b>Novo anúncio</b><small>" + (lim - usados) + (lim - usados === 1 ? " vaga incluída" : " vagas incluídas") + " no plano</small></a>" : "") + "</div>" +
      '<p class="small muted">' + usados + " de " + lim + " anúncios usados. Cada anúncio pode ter 1 banner no carrossel da página inicial (troca a cada 30 minutos).</p>";
    var assin = '<div class="dk-card dk-flat stack" style="gap:10px"><dl class="kv"><dt>Plano</dt><dd>' + nomePlano(a) + " · " + G.usd(a.valor || 0) + " por mês" + (a.modo === "teste" ? " (cobrança pela equipe)" : "") + "</dd><dt>Situação</dt><dd>" + (a.status === "ativa" ? '<span class="pill ok">Ativa, renova sozinha</span>' : '<span class="pill warn">Renovação cancelada</span>') + "</dd><dt>" + (a.status === "ativa" ? "Próxima cobrança" : "No ar até") + "</dt><dd>" + dataBR(a.proximaCobranca) + '</dd></dl><div class="row"><button type="button" class="btn" data-editar>Editar anúncio</button><a class="btn ghost" href="#lugar-' + esc(l.id) + '">Ver como o público vê</a></div></div>';
    var menu = [
      { id: "geral", nome: "Visão geral", ic: "home", titulo: l.nome, sub: master ? "Perfil do anunciante (visão do administrador)" : "Resultados dos últimos 30 dias." },
      { id: "anuncios", nome: "Meus anúncios", ic: "store", n: usados + "/" + lim, titulo: "Meus anúncios" },
      { id: "publicar", nome: "Publicar no feed", ic: "mega", grupo: "Divulgação" },
      { id: "divulgar", nome: "Kit de divulgação", ic: "share", grupo: "Divulgação" },
      { id: "assinatura", nome: "Assinatura", ic: "card", grupo: "Conta" }
    ];
    if (l.cupom && window.Comunidade) menu.splice(4, 0, { id: "cupom", nome: "Cupom", ic: "tag", grupo: "Divulgação" });
    if (!(window.Social && Social.blocoPainel(l))) menu = menu.filter(function (x) { return x.id !== "publicar"; });
    var pe = master ? [{ nome: "Voltar ao painel master", ic: "back", href: "#painel" }] : [{ nome: "Minha conta", ic: "user", href: "#entrar" }, { nome: "Ver no guia", ic: "eye", href: "#lugar-" + l.id }, { nome: "Tema claro/escuro", ic: "moon", acao: "data-tema" }];
    G.app.innerHTML = Dash.montar({ chave: "anunciante", marca: master ? "Visão do administrador" : "Painel do anunciante", titulo: l.nome, avatar: (l.nome || "?").charAt(0).toUpperCase(), menu: menu, pe: pe,
      secoes: { geral: geral, anuncios: anuncios, publicar: window.Social ? Social.blocoPainel(l) : "", divulgar: divulgar(l) + (window.Extras ? Extras.kit(l) : ""), cupom: l.cupom && window.Comunidade ? Comunidade.validador(l) : "", assinatura: assin } });
    if (l.cupom && window.Comunidade) Comunidade.validadorInit(l);
    if (window.Extras) Extras.kitInit(l);
    G.app.querySelector("section").onclick = function (e) {
      var cp = e.target.closest("[data-copia]");
      if (cp) { var tx = document.getElementById("dv-texto").value; (navigator.clipboard ? navigator.clipboard.writeText(tx) : Promise.reject()).then(function () { G.toast("Texto copiado. Cole no Facebook ou no grupo."); }).catch(function () { document.getElementById("dv-texto").select(); G.toast("Selecione e copie o texto."); }); return; }
      var o = e.target.closest("[data-outro]");
      if (o) { perfil = o.dataset.outro; viewPainelAn(); return; }
      if (e.target.closest("[data-editar]")) { editar = l.id; location.hash = "anunciar"; return; }
      var ed = e.target.closest("[data-editar-id]"); if (ed) { editar = ed.dataset.editarId; location.hash = "anunciar"; return; }
      if (e.target.closest("[data-toggle]")) { l.publicado = !noAr; Store.gravar("lugares", l.id, l).then(function () { G.toast(l.publicado ? "Anúncio no ar." : "Anúncio pausado."); viewPainelAn(); }).catch(falha); }
    };
  }
  /* Kit de divulgação: texto pronto e botões para Facebook e WhatsApp, para o anunciante levar gente até o anúncio. */
  function divulgar(l) {
    var link = location.origin + location.pathname + "#lugar-" + l.id;
    var texto = l.nome + " · " + (G.CATS[l.categoria] || "") + (l.cidade ? " em " + l.cidade : "") + "\n\n" + (l.historia || "") + (l.cupom ? "\n\nOferta: " + l.cupom + " (mostre o anúncio do CoraçãoBR)." : "") + (l.whatsapp ? "\n\nWhatsApp: " + l.whatsapp : l.telefone ? "\n\nTelefone: " + l.telefone : "") + "\n\nVeja fotos, avaliações e como chegar: " + link + "\n\n#BrasileirosEmDallas #BrasileirosNoTexas #CoracaoBR";
    return '<div class="panel stack" style="gap:12px"><h3>Divulgue seu anúncio</h3><p class="muted small">Quanto mais gente abre seu anúncio, mais a assinatura rende. Poste este texto na sua página e nos grupos de brasileiros do Facebook e do WhatsApp.</p><div class="field"><label for="dv-texto">Texto pronto para postar</label><textarea id="dv-texto" readonly style="min-height:190px">' + esc(texto) + '</textarea></div><div class="row"><button type="button" class="btn" data-copia>Copiar texto</button><a class="btn ghost" href="https://www.facebook.com/sharer/sharer.php?u=' + encodeURIComponent(link) + '" target="_blank" rel="noopener">Compartilhar no Facebook</a><a class="btn ghost" href="https://wa.me/?text=' + encodeURIComponent(texto) + '" target="_blank" rel="noopener">Enviar no WhatsApp</a></div><p class="small muted">Dica: peça a três clientes para avaliarem você no guia. Anúncios com nota aparecem com estrelas e recebem mais cliques.</p></div>';
  }
  G.views.anunciante = viewPainelAn;

  /* ---------- meus anúncios (na página Conta) ---------- */
  function meus(el) {
    if (!el) return; var ls = meusLugares();
    el.innerHTML = ls.length ? '<p class="eyebrow" style="margin-bottom:8px">Meus anúncios</p><div class="list" style="margin-bottom:6px">' + ls.map(function (l) { return '<button type="button" class="lrow" style="grid-template-columns:minmax(0,1fr) auto;padding:14px 18px" data-meu="' + esc(l.id) + '"><span><b>' + esc(l.nome) + "</b><small>" + (l.assinatura.status === "ativa" ? "Ativo · renova em " + dataBR(l.assinatura.proximaCobranca) : "Cancelado · no ar até " + dataBR(l.assinatura.proximaCobranca)) + '</small></span><span class="pill ' + (l.assinatura.status === "ativa" ? "ok" : "warn") + '">Painel</span></button>'; }).join("") + "</div>" : "";
    el.onclick = function (e) { var b = e.target.closest("[data-meu]"); if (b) { perfil = b.dataset.meu; master = false; location.hash = "anunciante"; } };
  }
  var editar = null;
  G.views.anunciar = function () { var id = editar; editar = null; viewAnunciar(id); };
  function temPlano() { return meusLugares().some(function (l) { return l.assinatura && l.assinatura.status === "ativa"; }); }
  window.Anunciante = { temPlano: temPlano, LIMITE: LIMITE, meus: meus, soma: soma, carrega: carrega, abrirPerfil: function (id) { perfil = id; master = true; location.hash = "anunciante"; } };
})();
