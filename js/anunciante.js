/* Setor do anunciante: painel (anúncios, plano, contratar pacotes, depoimentos, divulgação) e editor do anúncio.
   Preço em reais por pacote (R$ 50 = 3 anúncios por 1 mês; pacotes somam). Quem decide o que fica no ar é Pag.visivel (pagamento.js):
   os N anúncios mais antigos da conta, sendo N as vagas dos pacotes em vigor. Sem pagamento, os anúncios ficam em prévia. */
(function () {
  "use strict";
  var G = window.Guia, esc = G.esc, $ = function (s, r) { return (r || document).querySelector(s); };
  var D = null, ocupado = false, removidas = [];
  var CATEG = G.SERVICOS.concat(G.COMIDA, ["mercado-brasileiro", "mercado", "compras"]);
  var MAX_FOTOS = 20, LIMITE = 3;
  var CIDADES = [["Dallas", 32.7767, -96.797], ["Fort Worth", 32.7555, -97.3308], ["Plano", 33.0198, -96.6989], ["Frisco", 33.1507, -96.8236], ["McKinney", 33.1972, -96.6398], ["Allen", 33.1032, -96.6706], ["Irving", 32.814, -96.9489], ["Carrollton", 32.9756, -96.89], ["Richardson", 32.9483, -96.7299], ["Garland", 32.9126, -96.6389], ["Arlington", 32.7357, -97.1081], ["Grand Prairie", 32.746, -96.9978], ["Grapevine", 32.9343, -97.0781], ["Euless", 32.8371, -97.082], ["Bedford", 32.844, -97.1431], ["Hurst", 32.8235, -97.1706], ["Lewisville", 33.0462, -96.9942], ["Denton", 33.2148, -97.1331], ["Addison", 32.9618, -96.8292], ["Coppell", 32.9546, -97.015], ["Southlake", 32.9412, -97.1342], ["The Colony", 33.0807, -96.8928], ["Mesquite", 32.7668, -96.5992], ["Rockwall", 32.9312, -96.4597]];

  function meusIds() { try { return JSON.parse(localStorage.getItem("meus-anuncios") || "[]"); } catch (e) { return []; } }
  function guardaMeu(id) { var m = meusIds(); if (m.indexOf(id) < 0) m.push(id); try { localStorage.setItem("meus-anuncios", JSON.stringify(m)); } catch (e) { /* ok */ } }
  function meusLugares() {
    var ids = meusIds(), uid = Store.uid();
    return Store.lista("lugares").filter(function (l) { return (uid && (l._dono === uid || l.donoUid === uid || String(l.id).indexOf(uid + "~") === 0)) || (l.assinatura && ids.indexOf(l.id) >= 0); })
      .sort(function (a, b) { return String(a.criadoEm || a.id) < String(b.criadoEm || b.id) ? -1 : 1; });
  }
  function dono(l) { return (l && (l._dono || l.donoUid)) || Store.uid(); }
  function vagas() { return window.Pag ? Pag.vagas(Store.uid()) : LIMITE; }
  function maximo() { return Math.max(LIMITE, vagas()); }                       /* até 3 em prévia, sem pagar; acima disso, pelos pacotes */
  function noArDe(l) { return l.publicado !== false && (!window.Pag || Pag.visivel(l)); }
  function bannersLivres(excetoId) { var lim = window.Pag ? Math.max(1, Pag.banners(Store.uid())) : 1; return lim - meusLugares().filter(function (x) { return x.id !== excetoId && x.banner && x.banner.src; }).length; }
  function dataBR(iso) { var p = String(iso || "").split("-"); return p.length === 3 && /^\d{4}$/.test(p[0]) ? esc(p[2].slice(0, 2) + "/" + p[1].slice(0, 2) + "/" + p[0]) : ""; }
  function fld(id, label, val, attr, ajuda) { return '<div class="field"><label for="' + id + '">' + label + '</label><input id="' + id + '" value="' + esc(val == null ? "" : val) + '" ' + (attr || "") + ">" + (ajuda ? '<small class="muted">' + ajuda + "</small>" : "") + "</div>"; }
  function v(id) { var e = $("#" + id); return e ? e.value.trim() : ""; }
  function aviso(tipo, l, valor) { return Store.gravar("avisos", Store.novoId("av"), { tipo: tipo, lugarId: l.id, nome: l.nome, categoria: l.categoria, valor: valor || 0, criadoEm: new Date().toISOString(), lido: false }); }
  function falha(er) { ocupado = false; G.toast(er && er.message && !er.code ? er.message : "Não foi possível salvar agora. Tente de novo."); }

  /* ---------- editor do anúncio ---------- */
  function fotosHtml() {
    return (D.fotos || []).map(function (f, i) { return '<figure class="ae-ft' + (i === 0 ? " capa" : "") + '"><img src="' + esc(Store.urlFoto(f.src)) + '" alt="">' + (i === 0 ? "<em>Capa</em>" : '<button type="button" class="ae-cp" data-capa="' + i + '" title="Usar como capa">★</button>') + '<button type="button" class="ae-x" data-tirar="' + i + '" aria-label="Remover foto">×</button></figure>'; }).join("") +
      (D.fotos.length < MAX_FOTOS ? '<label class="ae-add" for="n-file"><span>+</span><small>Adicionar fotos</small></label>' : "");
  }
  function bannerHtml() { return D.banner && D.banner.src ? '<figure class="ban-prev"><img src="' + esc(Store.urlFoto(D.banner.src)) + '" alt=""><button type="button" id="n-btira" aria-label="Remover banner">×</button></figure>' : '<label class="ae-ban0" for="n-bfile"><b>Enviar banner</b><small>1600 × 640 px · JPG ou PNG</small></label>'; }
  function sec(n, id, titulo, sub, corpo) { return '<section class="ae-sec" id="ae-' + id + '"><header><span class="ae-n">' + n + '</span><div><h2>' + titulo + "</h2>" + (sub ? "<p>" + sub + "</p>" : "") + "</div></header>" + corpo + "</section>"; }
  function viewAnunciar(id) {
    var existente = id ? Store.obter("lugares", id) : null;
    if (!existente && meusLugares().length >= maximo()) {
      G.app.innerHTML = '<section class="block"><div class="wrap narrow stack" style="text-align:center;justify-items:center;padding-block:30px"><h1 class="page-h">Você usou todos os seus anúncios</h1><p class="muted">Seu plano libera ' + maximo() + ' anúncios. Cada pacote de ' + G.reais(window.Pag ? Pag.preco() : 50) + " soma mais " + (window.Pag ? Pag.porPacote() : 3) + ' anúncios.</p><a class="btn" href="#pagar">Contratar mais anúncios</a><a class="more" href="#anunciante">Voltar ao painel</a></div></section>';
      return;
    }
    D = existente ? JSON.parse(JSON.stringify(existente)) : { id: "", tipo: "estabelecimento", nome: "", categoria: "handyman", brasileiro: true, cidade: "Dallas", fotos: [], menu: [] };
    D.fotos = D.fotos || []; removidas = [];
    var podeBanner = (D.banner && D.banner.src) || bannersLivres(existente && existente.id) > 0, n = 0, prox = function () { return ++n; };
    var corpo =
      sec(prox(), "empresa", "Sua empresa", "O que aparece no topo do anúncio.",
        '<div class="ae-g2">' + fld("n-nome", "Nome da empresa", D.nome, 'required maxlength="80" autocomplete="organization"') +
        '<div class="field"><label for="n-cat">Categoria</label><select id="n-cat">' + CATEG.map(function (k) { return '<option value="' + k + '"' + (k === D.categoria ? " selected" : "") + ">" + esc(G.CATS[k] || k) + "</option>"; }).join("") + "</select></div></div>" +
        '<div class="field"><label for="n-desc">O que você faz</label><textarea id="n-desc" maxlength="900" rows="5" required placeholder="Conte o que você oferece, há quanto tempo, para quem e o diferencial.">' + esc(D.historia || "") + '</textarea><small class="muted"><span id="n-dc">' + String(D.historia || "").length + "</span>/900</small></div>" +
        fld("n-cupom", "Oferta para quem vem pelo CoraçãoBR (opcional)", D.cupom, 'maxlength="90" placeholder="Ex.: 10% de desconto na primeira visita"') +
        fld("n-clube", "Desconto para membros do Clube CoraçãoBR (opcional)", D.descontoClube, 'maxlength="90" placeholder="Ex.: 15% para membros do Clube"') +
        '<div class="ae-chk"><label class="check"><input type="checkbox" id="n-br"' + (D.brasileiro !== false ? " checked" : "") + '> Negócio de brasileiro</label><label class="check"><input type="checkbox" id="n-pt"' + (D.falaPortugues !== false ? " checked" : "") + "> Atendemos em português (selo Fala português)</label></div>" +
        (window.Recursos && Recursos.on("etiquetas") ? '<fieldset class="ae-etq"><legend>Marque o que vale para o seu negócio</legend><div class="pv-op">' + Recursos.etiquetas().map(function (e) { return '<label class="check"><input type="checkbox" data-an-etq="' + esc(e.id) + '"' + ((D.etiquetas || []).indexOf(e.id) >= 0 ? " checked" : "") + "> " + esc(e.nome) + "</label>"; }).join("") + "</div></fieldset>" : "")) +
      sec(prox(), "fotos", "Fotos", "Até " + MAX_FOTOS + " fotos. A primeira é a capa; toque na estrela para trocar.",
        '<div class="ae-fotos" id="n-fotos">' + fotosHtml() + '</div><input type="file" id="n-file" accept="image/*" multiple hidden><p class="small muted"><b id="n-nf">' + D.fotos.length + "</b> de " + MAX_FOTOS + " fotos · as imagens são reduzidas automaticamente para carregar rápido.</p>") +
      sec(prox(), "banner", "Banner do carrossel", "Aparece no carrossel da página inicial, em rodízio com os outros anunciantes. Cada pacote inclui 1 banner.",
        podeBanner ? '<div id="n-ban">' + bannerHtml() + '</div><input type="file" id="n-bfile" accept="image/*" hidden>' + fld("n-btxt", "Texto do banner para leitores de tela", D.banner && D.banner.texto, 'maxlength="120" placeholder="Ex.: Restaurante X, feijoada aos sábados"')
          : '<p class="note">Seus banners já estão em uso em outros anúncios. Contrate mais um pacote para ganhar outro banner, ou remova o banner de um anúncio.</p><input type="file" id="n-bfile" hidden><div id="n-ban" hidden></div><input id="n-btxt" type="hidden">') +
      sec(prox(), "contato", "Contato e redes sociais", "Preencha só o que tiver. Cada um vira um botão no anúncio.",
        '<div class="ae-g2">' + fld("n-wa", "WhatsApp (com código do país)", D.whatsapp, 'inputmode="tel" placeholder="+1 214 555 0100"') + fld("n-tel", "Telefone", D.telefone, 'inputmode="tel"') +
        fld("n-ig", "Instagram", D.instagram, 'placeholder="@suaempresa"') + fld("n-fb", "Facebook (link da página)", D.facebook, 'placeholder="https://facebook.com/suaempresa"') +
        fld("n-tg", "Telegram", D.telegram, 'placeholder="@usuario ou link t.me"') + fld("n-x", "X (Twitter)", D.x, 'placeholder="@suaempresa"') +
        fld("n-li", "LinkedIn (link)", D.linkedin, 'placeholder="https://linkedin.com/company/…"') + fld("n-site", "Site da empresa", D.site, 'placeholder="https://"') + "</div>") +
      sec(prox(), "endereco", "Endereço e horário", "Quem atende em domicílio pode deixar o endereço em branco.",
        '<div class="ae-g2">' + fld("n-end", "Endereço", D.endereco, 'autocomplete="street-address" placeholder="Rua, número, cidade, TX"') +
        '<div class="field"><label for="n-reg">Cidade</label><select id="n-reg">' + CIDADES.map(function (p) { return "<option" + (p[0] === D.cidade ? " selected" : "") + ">" + esc(p[0]) + "</option>"; }).join("") + "</select></div></div>" +
        '<div class="field"><span>Horário de atendimento</span>' + Horario.editor(D) + "</div>") +
      sec(prox(), "cardapio", "Cardápio, catálogo e preços", "Cardápio em livreto, tabela de preços ou o link do seu catálogo.",
        '<div class="ae-g2">' + fld("n-cat-link", "Link do catálogo, portfólio ou loja", D.catalogo, 'placeholder="https://"') + fld("n-cat-nome", "Nome do botão", D.catalogoNome, 'maxlength="24" placeholder="Catálogo"') + "</div>" + (window.Cardapio ? Cardapio.editor(D) : ""));
    var nav = ["empresa", "fotos", "banner", "contato", "endereco", "cardapio"], nomes = ["Empresa", "Fotos", "Banner", "Contato", "Endereço", "Cardápio"];
    var situ = existente ? (noArDe(existente) ? '<span class="pill ok">No ar</span>' : '<span class="pill warn">Prévia</span>') : '<span class="pill xp">Novo</span>';
    G.app.innerHTML = '<section class="block ae"><div class="wrap"><form id="f-an" novalidate>' +
      '<header class="ae-hd"><a class="more" href="#anunciante">← Painel do anunciante</a><div class="ae-ti"><h1 class="page-h">' + (existente ? "Editar anúncio" : "Novo anúncio") + "</h1>" + situ + '</div><p class="muted">O que ficar vazio não aparece. Você pode editar quando quiser.</p>' +
      '<nav class="ae-nav" aria-label="Seções do anúncio">' + nav.map(function (s, i) { return '<a href="#ae-' + s + '" data-ae-ir="' + s + '"><b>' + (i + 1) + "</b>" + nomes[i] + "</a>"; }).join("") + "</nav></header>" +
      '<div class="ae-grid"><div class="ae-main">' + corpo + '</div><aside class="ae-side"><div class="ae-prev" id="ae-prev"></div><div class="ae-info">' +
      '<p><b>' + meusLugares().length + (existente ? "" : " + 1") + " de " + maximo() + "</b> anúncios da conta" + (vagas() ? " · " + vagas() + " liberados pelo plano" : " · em prévia até o pagamento") + '</p><a class="more" href="#pagar">Contratar mais anúncios</a></div></aside></div>' +
      '<div class="ae-bar"><span class="small muted" id="ae-st">' + (existente ? "Alterações não salvas aparecem aqui." : "Preencha nome, categoria e descrição para publicar.") + '</span><button class="btn" type="submit">' + (existente ? "Salvar alterações" : "Salvar anúncio") + "</button></div>" +
      "</form></div></section>";
    window.scrollTo(0, 0); preview();
    var f = $("#f-an");
    f.addEventListener("input", function (e) { if (e.target.id === "n-desc") $("#n-dc").textContent = e.target.value.length; $("#ae-st").textContent = "Alterações não salvas."; preview(); });
    f.addEventListener("click", function (e) { var a = e.target.closest("[data-ae-ir]"); if (a) { e.preventDefault(); var s = document.getElementById("ae-" + a.dataset.aeIr); if (s) s.scrollIntoView({ behavior: "smooth", block: "start" }); } });
    $("#n-file").addEventListener("change", async function (e) {
      var files = Array.from(e.target.files || []), livres = MAX_FOTOS - D.fotos.length;
      if (files.length > livres) G.toast("Cada anúncio aceita até " + MAX_FOTOS + " fotos.");
      for (var i = 0; i < Math.min(files.length, livres); i++) {
        try { D.fotos.push({ src: await Store.salvarFoto(files[i]), credito: "" }); } catch (err) { G.toast(err.message || "Não foi possível enviar a foto."); break; }
        $("#n-fotos").innerHTML = fotosHtml(); $("#n-nf").textContent = D.fotos.length; preview();
      }
      e.target.value = "";
    });
    $("#n-fotos").addEventListener("click", function (e) {
      var b = e.target.closest("[data-tirar]"), c = e.target.closest("[data-capa]");
      if (b) { var x = D.fotos.splice(Number(b.dataset.tirar), 1)[0]; if (x) removidas.push(x.src); }
      else if (c) { var y = D.fotos.splice(Number(c.dataset.capa), 1)[0]; D.fotos.unshift(y); }
      else return;
      this.innerHTML = fotosHtml(); $("#n-nf").textContent = D.fotos.length; preview();
    });
    $("#n-bfile").addEventListener("change", function (e) {
      var fl = (e.target.files || [])[0]; if (!fl) return;
      Store.salvarFoto(fl).then(function (src) { if (D.banner && D.banner.src) removidas.push(D.banner.src); D.banner = { src: src, texto: v("n-btxt") }; $("#n-ban").innerHTML = bannerHtml(); }).catch(function (er) { G.toast(er.message || "Não foi possível enviar o banner."); });
      e.target.value = "";
    });
    $("#n-ban").addEventListener("click", function (e) { if (e.target.closest("#n-btira")) { if (D.banner && D.banner.src) removidas.push(D.banner.src); D.banner = null; $("#n-ban").innerHTML = bannerHtml(); } });
    f.addEventListener("submit", function (e) {
      e.preventDefault(); if (ocupado) return;
      if (!v("n-nome") || !v("n-desc")) { G.toast("Preencha o nome da empresa e o que você faz."); var s = $("#ae-empresa"); if (s) s.scrollIntoView({ behavior: "smooth" }); return; }
      var reg = CIDADES.filter(function (p) { return p[0] === v("n-reg"); })[0] || CIDADES[0];
      D.nome = v("n-nome"); D.categoria = v("n-cat"); D.historia = v("n-desc"); D.cupom = v("n-cupom"); if (!D.regiaoGuia) D.regiaoGuia = G.cidadeAtual ? G.cidadeAtual() : "dfw"; D.descontoClube = v("n-clube"); D.brasileiro = $("#n-br").checked; D.falaPortugues = $("#n-pt").checked;
      if (window.Cardapio) Cardapio.ler(document, D); D.menuVerificadoEm = (D.menu || []).length ? G.hojeISO().slice(0, 7) : "";
      D.whatsapp = v("n-wa"); D.telefone = v("n-tel"); D.instagram = v("n-ig"); D.facebook = v("n-fb"); D.telegram = v("n-tg"); D.x = v("n-x"); D.linkedin = v("n-li"); D.site = v("n-site");
      var cl = v("n-cat-link"); D.catalogo = /^https?:\/\//i.test(cl) ? cl.slice(0, 400) : ""; D.catalogoNome = v("n-cat-nome").slice(0, 24);
      D.endereco = v("n-end"); D.cidade = reg[0];
      var sem = Horario.lerEditor($("#f-an .hed")); if (sem) sem = sem.map(function (x) { return x || []; }); delete D.semana; D.horas = sem ? Horario.paraObj(sem) : null; D.horario = sem ? Horario.texto(sem) : (existente ? D.horario : "");
      if (!existente || !D.lat || D.coordsAprox) { D.lat = reg[1]; D.lng = reg[2]; D.coordsAprox = true; }
      if (document.querySelector("[data-an-etq]")) D.etiquetas = Array.from(document.querySelectorAll("[data-an-etq]")).filter(function (x) { return x.checked; }).map(function (x) { return x.dataset.anEtq; });
      if (D.banner && D.banner.src) D.banner.texto = v("n-btxt");
      D.tipo = "estabelecimento"; D.anunciante = true; if (D.publicado == null) D.publicado = true; D.atualizadoEm = G.hojeISO().slice(0, 7);
      D.assinatura = Object.assign({ plano: "pacote", status: "ativa" }, D.assinatura || {}, { plano: "pacote" });
      var novo = !existente, nid = D.id;
      if (novo) { nid = Store.idProprio((D.nome.toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, "").replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "").slice(0, 44) || "empresa") + "-" + Date.now().toString(36).slice(-4)); D.donoUid = Store.uid() || ""; D.criadoEm = new Date().toISOString(); }
      ocupado = true; $("#ae-st").textContent = "Salvando…";
      Store.gravar("lugares", nid, D).then(function () {
        ocupado = false; removidas.forEach(Store.apagarFoto); D.id = nid; perfil = nid;
        if (novo) { guardaMeu(nid); aviso("novo-anuncio", D, 0); }
        var liberado = window.Pag ? Pag.vagas(Store.uid()) > meusLugares().length - 1 : true;
        G.toast(novo ? (liberado && vagas() ? "Anúncio publicado." : "Anúncio salvo em prévia. Ele entra no ar quando o pacote for confirmado.") : "Anúncio atualizado.");
        location.hash = novo && !vagas() ? "pagar" : "anunciante";
      }).catch(falha);
    });
  }
  /* prévia ao vivo do card, como aparece no guia */
  function preview() {
    var el = $("#ae-prev"); if (!el) return;
    var f = (D.fotos || [])[0], nome = v("n-nome") || "Nome da sua empresa", cat = G.CATS[v("n-cat")] || "", cid = v("n-reg") || "", desc = v("n-desc");
    var redes = [["n-wa", "WhatsApp"], ["n-ig", "Instagram"], ["n-fb", "Facebook"], ["n-tg", "Telegram"], ["n-x", "X"], ["n-li", "LinkedIn"], ["n-site", "Site"], ["n-cat-link", "Catálogo"]].filter(function (r) { return v(r[0]); }).map(function (r) { return "<i>" + r[1] + "</i>"; }).join("");
    el.innerHTML = '<p class="ae-pk">Prévia no guia</p><div class="ae-card"><span class="ae-cf">' + (f ? '<img src="' + esc(Store.urlFoto(f.src)) + '" alt="">' : "<b>Sem foto</b>") + "<em>Patrocinado</em></span><div><b>" + esc(nome) + "</b><small>" + esc(cat) + (cid ? " · " + esc(cid) : "") + "</small>" + (desc ? "<p>" + esc(desc.slice(0, 120)) + (desc.length > 120 ? "…" : "") + "</p>" : "") + (redes ? '<span class="ae-rd">' + redes + "</span>" : "") + "</div></div>";
  }

  /* ---------- painel do anunciante ---------- */
  var perfil = null, master = false, metCache = {};
  function carrega(id) { return Store.consultar("metricas", "lugarId", id).then(function (ms) { metCache[id] = ms; return ms; }); }
  function soma(id, dias, lista) {
    var ini = new Date(G.hojeISO() + "T12:00:00"); ini.setDate(ini.getDate() - dias + 1); var de = ini.getFullYear() + "-" + String(ini.getMonth() + 1).padStart(2, "0") + "-" + String(ini.getDate()).padStart(2, "0");
    var t = { v: 0, r: 0, c: 0, p: 0, porDia: {} }, n = function (x) { x = Number(x); return isFinite(x) && x > 0 ? Math.floor(x) : 0; };
    (lista || metCache[id] || []).forEach(function (m) { if (m.lugarId !== id || String(m.dia) < de) return; t.v += n(m.v); t.r += n(m.r); t.c += n(m.c); t.p += n(m.p); var d = String(m.dia).slice(0, 10); if (/^\d{4}-\d{2}-\d{2}$/.test(d)) t.porDia[d] = (t.porDia[d] || 0) + n(m.v); });
    return t;
  }
  function viewPainelAn() {
    var ls = master && perfil ? [Store.obter("lugares", perfil)].filter(Boolean) : meusLugares();
    var l = ls.filter(function (x) { return x.id === perfil; })[0] || ls[0] || null; perfil = l ? l.id : null;
    var faltam = ls.filter(function (x) { return !metCache[x.id]; });
    if (faltam.length) { G.app.innerHTML = '<section class="block"><div class="wrap"><p class="muted" style="padding-block:40px">Carregando seu painel…</p></div></section>'; Promise.all(faltam.map(function (x) { return carrega(x.id).catch(function () { metCache[x.id] = []; }); })).then(function () { if (location.hash === "#anunciante") viewPainelAn(); }); return; }
    var uid = l ? dono(l) : Store.uid(), e = window.Pag ? Pag.estado(uid) : { fase: "ativo", vagas: LIMITE, txt: "" }, lim = master ? ls.length : maximo(), usados = ls.length;
    var tot = { v: 0, r: 0, c: 0 }, dias = [], max = 1;
    ls.forEach(function (x) { var m = soma(x.id, 30); tot.v += m.v; tot.r += m.r; tot.c += m.c; });
    for (var i = 13; i >= 0; i--) { var d = new Date(); d.setDate(d.getDate() - i); var iso = d.getFullYear() + "-" + String(d.getMonth() + 1).padStart(2, "0") + "-" + String(d.getDate()).padStart(2, "0"); var q = ls.reduce(function (s, x) { return s + (soma(x.id, 30).porDia[iso] || 0); }, 0); max = Math.max(max, q); dias.push([iso, q]); }
    var kpi = function (nm, t, icn, dark) { return '<div class="dk-card' + (dark ? " dk-dark" : "") + '"><small>' + t + '</small><b class="dk-big">' + nm + "</b>" + Dash.ic(icn) + "</div>"; };
    var grafico = '<div class="dk-card dk-flat"><div class="dk-ch"><h3>Visualizações dos seus anúncios · 14 dias</h3><span class="small muted">' + (tot.v ? "maior dia: " + max : "sem acessos ainda") + '</span></div><div class="bars">' + dias.map(function (dd, k) { return '<div title="' + dd[0] + ": " + dd[1] + '"><i style="height:' + Math.max(3, Math.round(dd[1] / max * 100)) + "%;animation-delay:" + (k * 0.03) + 's"></i><small>' + dd[0].slice(8) + "</small></div>"; }).join("") + "</div></div>";
    var noArN = ls.filter(noArDe).length, de30 = new Date(); de30.setDate(de30.getDate() - 30); de30 = de30.toISOString().slice(0, 10);
    var cupons30 = ls.reduce(function (s2, x) { return s2 + (x.validados || []).filter(function (vv) { return String(vv.em || "") >= de30; }).length; }, 0);
    var plano = '<div class="ad-plan dk-card dk-dark"><div><small>Seu plano</small><b class="dk-big">' + e.vagas + '<span> anúncios liberados</span></b><p>' + esc(e.txt) + '</p></div><div class="ad-pl-a"><a class="btn" href="#pagar">' + (e.vagas ? "Contratar mais" : "Contratar agora") + '</a><button type="button" class="btn ghost" data-dk-ir="contratar">Ver pacotes</button></div></div>';
    var cardAn = function (x) {
      var fx = (x.fotos || [])[0], on = noArDe(x), pausado = x.publicado === false;
      return '<div class="ad-an' + (x.id === perfil ? " on" : "") + '"><span class="ad-anf">' + (fx ? '<img src="' + esc(Store.urlFoto(fx.src)) + '" alt="">' : "<b>Sem foto</b>") + '<span class="pill ' + (on ? "ok" : pausado ? "" : "warn") + '">' + (on ? "No ar" : pausado ? "Pausado" : "Prévia") + "</span></span>" +
        "<div class=\"ad-ant\"><b>" + esc(x.nome) + "</b><small>" + esc(G.CATS[x.categoria] || "") + " · " + (x.fotos || []).length + " fotos" + (x.banner && x.banner.src ? " · banner" : "") + " · " + soma(x.id, 30).v + " visualizações</small>" + (!on && !pausado ? '<small class="ad-why">' + (e.vagas ? "Passou do limite do plano: contrate mais um pacote." : "Aguardando pagamento do pacote.") + "</small>" : "") + "</div>" +
        '<div class="ad-ana"><button type="button" class="btn sm" data-editar-id="' + esc(x.id) + '">Editar</button><a class="btn ghost sm" href="#lugar-' + esc(x.id) + '">Ver</a><button type="button" class="btn ghost sm" data-toggle="' + esc(x.id) + '">' + (pausado ? "Retomar" : "Pausar") + "</button></div></div>";
    };
    var novoCard = master ? "" : usados < lim ? '<a class="ad-novo" href="#anunciar" data-novo-anuncio>' + Dash.ic("plus") + "<b>Criar anúncio</b><small>" + (lim - usados) + (lim - usados === 1 ? " vaga disponível" : " vagas disponíveis") + "</small></a>"
      : '<a class="ad-novo ad-mais" href="#pagar">' + Dash.ic("plus") + "<b>Mais " + (window.Pag ? Pag.porPacote() : 3) + " anúncios</b><small>por " + G.reais(window.Pag ? Pag.preco() : 50) + " · contratar pacote</small></a>";
    var anuncios = '<div class="ad-ans">' + ls.map(cardAn).join("") + novoCard + "</div>" +
      '<p class="small muted">' + usados + " criados · " + e.vagas + " liberados pelo plano · " + noArN + " no ar agora. Os anúncios mais antigos usam as vagas primeiro.</p>";
    var geral = plano + '<div class="dk-grid dk-g4">' + kpi(tot.v, "Visualizações · 30 dias", "eye", false) + kpi(tot.r + tot.c, "Rotas e contatos", "route") + kpi(cupons30, "Cupons usados · 30 dias", "tag") + kpi(noArN + "/" + usados, "Anúncios no ar", "store") + "</div>" +
      (ls.length ? grafico + '<div class="dk-card dk-flat"><div class="dk-ch"><h3>Seus anúncios</h3><button type="button" class="more" data-dk-ir="anuncios">ver todos</button></div><div class="ad-ans">' + ls.slice(0, 3).map(cardAn).join("") + "</div></div>"
        : '<div class="dk-card dk-flat ad-vazio"><h3>Crie seu primeiro anúncio</h3><p class="muted">Até 20 fotos, banner, WhatsApp, redes sociais, endereço, horário, cardápio ou catálogo. Ele fica em prévia até o pagamento.</p><a class="btn" href="#anunciar" data-novo-anuncio>Criar anúncio</a></div>');
    var contratar = (window.Pag ? Pag.calculadora(uid, true) : "") + '<div class="dk-card dk-flat"><div class="dk-ch"><h3>Histórico de pacotes</h3></div>' + (window.Pag ? Pag.linhaDoTempo(uid) : "") + '</div><div class="dk-card dk-flat"><div class="dk-ch"><h3>Como funciona</h3></div><ul class="ad-how"><li><b>Pacotes somam.</b> ' + G.reais(window.Pag ? Pag.preco() : 50) + " = " + (window.Pag ? Pag.porPacote() : 3) + " anúncios; 2 pacotes = " + 2 * (window.Pag ? Pag.porPacote() : 3) + " anúncios, e assim por diante.</li><li><b>Pagamento por Pix.</b> O QR Code e o copia e cola já vêm com o valor. A equipe confirma e o pacote entra no ar 1 hora depois.</li><li><b>Datas automáticas.</b> Cada pacote mostra o dia do pagamento, o início e o término (1 mês).</li><li><b>Avisos por e-mail.</b> Você recebe e-mail 3, 2 e 1 dia antes do fim. Renove antes e não perca nenhum dia.</li></ul></div>";
    var depo = window.Promo ? Promo.blocoPainel(uid) : "";
    var menu = [
      { id: "geral", nome: "Visão geral", ic: "home", titulo: master && l ? l.nome : "Painel do anunciante", sub: master ? "Perfil do anunciante (visão do administrador)" : "Seus anúncios, seu plano e os resultados dos últimos 30 dias." },
      { id: "anuncios", nome: "Meus anúncios", ic: "store", n: usados + "/" + lim, titulo: "Meus anúncios", acao: master ? "" : '<a class="btn sm" href="#anunciar" data-novo-anuncio>' + Dash.ic("plus") + "Criar anúncio</a>" },
      { id: "contratar", nome: "Contratar anúncios", ic: "card", titulo: "Contratar anúncios", sub: "Monte seu plano, pague por Pix e acompanhe as datas de cada pacote." },
      { id: "turbinar", nome: "Destaque e selo", ic: "spark", titulo: "Destaque, selo e indicação", sub: "Apareça no topo, ganhe o selo Verificado e indique outras empresas com 50% de desconto." },
      { id: "depoimentos", nome: "Depoimentos", ic: "star", titulo: "Depoimentos de empresas", sub: "Na promoção de curadoria, você ganha 1 anúncio e escreve depoimentos de lugares que conhece." },
      { id: "publicar", nome: "Publicar no feed", ic: "mega", grupo: "Divulgação" },
      { id: "divulgar", nome: "Kit de divulgação", ic: "share", grupo: "Divulgação" }
    ];
    if (!depo) menu = menu.filter(function (x) { return x.id !== "depoimentos"; });
    if (master || !window.Diferenciais) menu = menu.filter(function (x) { return x.id !== "turbinar"; });
    if (l && l.cupom && window.Comunidade) menu.splice(menu.length, 0, { id: "cupom", nome: "Cupom", ic: "tag", grupo: "Divulgação" });
    if (!l || !(window.Social && Social.blocoPainel(l))) menu = menu.filter(function (x) { return x.id !== "publicar"; });
    if (!l) menu = menu.filter(function (x) { return x.id !== "divulgar"; });
    var pe = master ? [{ nome: "Voltar ao painel master", ic: "back", href: "#painel" }] : [{ nome: "Minha conta", ic: "user", href: "#conta" }, { nome: "Tema claro/escuro", ic: "moon", acao: "data-cor" }, { nome: "Sair", ic: "out", acao: "data-sair" }];
    var nomeConta = (Store.conta && Store.conta() && Store.conta().nome) || (l && l.nome) || "Anunciante";
    G.app.innerHTML = Dash.montar({ chave: "anunciante", marca: master ? "Visão do administrador" : "Painel do anunciante", titulo: master && l ? l.nome : nomeConta, avatar: (nomeConta || "?").charAt(0).toUpperCase(), menu: menu, pe: pe,
      secoes: { geral: geral, anuncios: anuncios, contratar: contratar, turbinar: window.Diferenciais && !master ? Diferenciais.blocoTurbinar(uid, ls) : "", depoimentos: depo, publicar: l && window.Social ? Social.blocoPainel(l) : "", divulgar: l ? qrAvalie(l) + (window.Novidades ? Novidades.botaoArte(l) : "") + divulgar(l) + (window.Extras ? Extras.kit(l) : "") : "", cupom: l && l.cupom && window.Comunidade ? Comunidade.validador(l) : "" } });
    if (l && l.cupom && window.Comunidade) Comunidade.validadorInit(l);
    if (l && window.Extras) Extras.kitInit(l);
    G.app.querySelector("section").onclick = function (ev) {
      var cp = ev.target.closest("[data-copia]");
      if (cp) { var tx = document.getElementById("dv-texto").value; (navigator.clipboard ? navigator.clipboard.writeText(tx) : Promise.reject()).then(function () { G.toast("Texto copiado. Cole no Facebook ou no grupo."); }).catch(function () { document.getElementById("dv-texto").select(); G.toast("Selecione e copie o texto."); }); return; }
      var ed = ev.target.closest("[data-editar-id]"); if (ed) { editar = ed.dataset.editarId; location.hash = "anunciar"; return; }
      var tg = ev.target.closest("[data-toggle]");
      if (tg) { var x = Store.obter("lugares", tg.dataset.toggle); if (!x) return; x.publicado = x.publicado === false; Store.gravar("lugares", x.id, x).then(function () { G.toast(x.publicado ? "Anúncio retomado." : "Anúncio pausado."); viewPainelAn(); }).catch(falha); }
    };
  }
  /* Kit de divulgação: texto pronto e botões para Facebook e WhatsApp. */
  /* QR Code "Avalie-nos no CoraçãoBR": o cliente aponta a câmera e cai direto no formulário de avaliação (estrelas, depoimento e fotos) */
  function qrAvalie(l) {
    var link = location.origin + location.pathname + "#avaliar-" + encodeURIComponent(l.id), svg = "";
    try { var q = window.qrcode(0, "M"); q.addData(link); q.make(); svg = q.createSvgTag({ cellSize: 6, margin: 2, scalable: true }); } catch (e) { svg = ""; }
    return '<div class="panel stack av-qr" style="gap:12px"><h3>QR Code "Avalie-nos"</h3><p class="muted small">Imprima e deixe no balcão, na mesa ou no cartão. O cliente aponta a câmera e avalia seu negócio no CoraçãoBR com estrelas, depoimento e fotos. Avaliações reais deixam seu anúncio mais forte.</p>' +
      '<div class="av-qr-b"><div class="av-qr-c" data-qr-svg>' + svg + '</div><div class="stack" style="gap:8px"><b>' + esc(l.nome) + '</b><input readonly value="' + esc(link) + '" aria-label="Link de avaliação"><div class="row" style="gap:8px"><button type="button" class="btn sm" data-copiar="' + esc(link) + '">Copiar link</button><button type="button" class="btn ghost sm" data-imprime-qr="' + esc(l.id) + '">Imprimir cartaz</button><a class="btn ghost sm" target="_blank" rel="noopener" href="https://wa.me/?text=' + encodeURIComponent("Você já veio no " + l.nome + "? Deixe sua avaliação no CoraçãoBR: " + link) + '">Pedir no WhatsApp</a></div></div></div></div>';
  }
  document.addEventListener("click", function (e) {
    var b = e.target.closest("[data-imprime-qr]"); if (!b) return;
    var l = Store.obter("lugares", b.dataset.imprimeQr), box = b.closest(".av-qr"), svg = box ? box.querySelector("[data-qr-svg]").innerHTML : ""; if (!l) return;
    var w = window.open("", "_blank"); if (!w) { G.toast("Permita janelas pop-up para imprimir."); return; }
    w.document.write('<!doctype html><html lang="pt-BR"><head><meta charset="utf-8"><title>Avalie-nos · ' + esc(l.nome) + '</title><style>body{margin:0;font-family:system-ui,sans-serif;display:grid;place-items:center;min-height:100vh;background:#fff;color:#0E1311}.c{width:520px;text-align:center;padding:40px;border:3px solid #0BA84A;border-radius:28px}.k{font:700 14px/1 monospace;letter-spacing:.2em;color:#0B7A35}h1{font-size:44px;margin:14px 0 6px}h1 span{color:#E8A800}p{font-size:19px;color:#444;margin:0 0 22px}.q svg{width:300px;height:300px}.n{font-size:24px;font-weight:700;margin-top:16px}.f{margin-top:18px;font-size:15px;color:#666}@media print{.c{border-width:2px}}</style></head><body><div class="c"><div class="k">CORAÇÃOBR</div><h1>Avalie-<span>nos</span>!</h1><p>Aponte a câmera do celular e conte como foi.</p><div class="q">' + svg + '</div><div class="n">' + esc(l.nome) + '</div><div class="f">Sua opinião ajuda outros brasileiros 💚💛</div></div><script>setTimeout(function(){print()},400)<\/script></body></html>');
    w.document.close();
  });
  function divulgar(l) {
    var link = location.origin + location.pathname + "#lugar-" + l.id;
    var texto = l.nome + " · " + (G.CATS[l.categoria] || "") + (l.cidade ? " em " + l.cidade : "") + "\n\n" + (l.historia || "") + (l.cupom ? "\n\nOferta: " + l.cupom + " (mostre o anúncio do CoraçãoBR)." : "") + (l.whatsapp ? "\n\nWhatsApp: " + l.whatsapp : l.telefone ? "\n\nTelefone: " + l.telefone : "") + "\n\nVeja fotos, avaliações e como chegar: " + link + "\n\n#BrasileirosEmDallas #BrasileirosNoTexas #CoracaoBR";
    return '<div class="panel stack" style="gap:12px"><h3>Divulgue seu anúncio</h3><p class="muted small">Poste este texto na sua página e nos grupos de brasileiros do Facebook e do WhatsApp.</p><div class="field"><label for="dv-texto">Texto pronto para postar</label><textarea id="dv-texto" readonly style="min-height:190px">' + esc(texto) + '</textarea></div><div class="row"><button type="button" class="btn" data-copia>Copiar texto</button><a class="btn ghost" href="https://www.facebook.com/sharer/sharer.php?u=' + encodeURIComponent(link) + '" target="_blank" rel="noopener">Compartilhar no Facebook</a><a class="btn ghost" href="https://wa.me/?text=' + encodeURIComponent(texto) + '" target="_blank" rel="noopener">Enviar no WhatsApp</a></div></div>';
  }
  G.views.anunciante = viewPainelAn;

  /* ---------- meus anúncios (na página Minha conta) ---------- */
  function meus(el) {
    if (!el) return; var ls = meusLugares();
    el.innerHTML = ls.length ? '<p class="eyebrow" style="margin-bottom:8px">Meus anúncios</p><div class="list" style="margin-bottom:6px">' + ls.map(function (l) { return '<button type="button" class="lrow" style="grid-template-columns:minmax(0,1fr) auto;padding:14px 18px" data-meu="' + esc(l.id) + '"><span><b>' + esc(l.nome) + "</b><small>" + (noArDe(l) ? "No ar" : "Prévia") + '</small></span><span class="pill ' + (noArDe(l) ? "ok" : "warn") + '">Painel</span></button>'; }).join("") + "</div>" : "";
    el.onclick = function (e) { var b = e.target.closest("[data-meu]"); if (b) { perfil = b.dataset.meu; master = false; location.hash = "anunciante"; } };
  }
  var editar = null;
  document.addEventListener("click", function (e) { if (e.target.closest("[data-novo-anuncio]")) editar = null; });
  G.views.anunciar = function () { var id = editar; editar = null; viewAnunciar(id); };
  function temPlano() { return (window.Pag && Pag.vagas(Store.uid()) > 0) || meusLugares().some(function (l) { return noArDe(l); }); }
  window.Anunciante = { temPlano: temPlano, LIMITE: LIMITE, meus: meus, soma: soma, carrega: carrega, abrirPerfil: function (id) { perfil = id; master = true; location.hash = "anunciante"; } };
})();
