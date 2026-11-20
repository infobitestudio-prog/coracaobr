/* Painel master: controle dos recursos de descoberta (Recursos, Parceiros, Newsletter e Pesquisa).
   Tudo o que aparece para o público nessas áreas sai daqui. */
(function () {
  "use strict";
  var G = window.Guia, R = window.Recursos; if (!G || !R) return;
  var esc = G.esc, $ = function (s, r) { return (r || document).querySelector(s); };
  function cfg() { return Store.obter("config", "geral") || {}; }
  function salva(parcial, msg) { return Store.gravar("config", "geral", Object.assign({}, cfg(), parcial)).then(function () { G.toast(msg || "Salvo."); }).catch(function (e) { G.toast(e.message || "Não foi possível salvar."); }); }
  function slug(t) { return String(t || "").toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, "").replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "").slice(0, 40); }
  function inp(id, rot, val, attr) { return '<div class="field"><label for="' + id + '">' + rot + '</label><input id="' + id + '" value="' + esc(val == null ? "" : val) + '" ' + (attr || "") + "></div>"; }
  function area(id, rot, val, attr) { return '<div class="field full"><label for="' + id + '">' + rot + '</label><textarea id="' + id + '" ' + (attr || "") + ">" + esc(val || "") + "</textarea></div>"; }
  function baixa(nome, texto) {
    var blob = new Blob(["﻿" + texto], { type: "text/csv;charset=utf-8" });
    var cl = window.claude && window.claude.use ? window.claude.use("downloads").catch(function () { return null; }) : Promise.resolve(null);
    cl.then(function (dl) { if (dl) return dl.save({ filename: nome, data: blob }); var a = document.createElement("a"); a.href = URL.createObjectURL(blob); a.download = nome; document.body.appendChild(a); a.click(); setTimeout(function () { URL.revokeObjectURL(a.href); a.remove(); }, 800); });
  }
  function csv(linhas) { return linhas.map(function (l) { return l.map(function (c) { c = String(c == null ? "" : c); return /[",;\n]/.test(c) ? '"' + c.replace(/"/g, '""') + '"' : c; }).join(","); }).join("\n"); }

  /* ================= Recursos ================= */
  var ITENS = [
    ["vitrine", "Carrossel de anunciantes", "Banners dos anunciantes na página inicial, em rodízio (aba Banners)."],
    ["feed", "Feed e perfis", "Anunciantes publicam; usuários curtem, salvam e seguem (aba Publicações)."],
    ["mapa", "Mapa vivo", "Página de mapa com pins agrupados e a lista do que está na área."],
    ["mapaInicio", "Mapa como tela inicial", "Quem abre o site cai direto no mapa (precisa do Mapa vivo ligado)."],
    ["agora", "Agora", "Botão e seção \"Acontecendo agora\": eventos rolando neste momento e lugares abertos."],
    ["filtros", "Filtros de data e preço", "Hoje, Este FDS, escolher datas, Grátis, até US$ 20 e até US$ 50."],
    ["etiquetas", "Etiquetas práticas", "Crianças, pets, acessível e as outras que você cadastrar abaixo."],
    ["busca", "Busca escrita", "Entende frases como \"samba neste sábado\" e transforma em filtros."],
    ["compartilhar", "Compartilhar busca", "Botão que gera um link com os filtros, para mandar em grupos."],
    ["paraVoce", "Para você", "A pessoa escolhe interesses e ganha uma seção e um filtro só dela."],
    ["sessoes", "Várias sessões por evento", "Lista de dias e horários na página do evento."],
    ["local", "Página de cada local", "Todos os eventos de um mesmo lugar numa página."],
    ["recomendados", "Quem Recomendou", "Parceiros e influenciadores indicando lugares (aba Parceiros)."],
    ["newsletter", "Newsletter por e-mail", "Inscrição na página inicial e envios pela aba Newsletter."],
    ["pesquisa", "Pesquisa com recompensa", "Convite para responder a pesquisa da aba Pesquisa."]
  ];
  function abaRecursos(el) {
    var r = R.rec(), c = cfg(), m = Object.assign({ tiles: "https://tile.openstreetmap.org/{z}/{x}/{y}.png", atribuicao: "© OpenStreetMap", zoom: 12 }, c.mapa || {});
    var etq = (c.etiquetas && c.etiquetas.length ? c.etiquetas : R.ETQ_PADRAO).map(function (e) { return Object.assign({ ativo: true }, e); });
    var ints = (c.paraVoce && c.paraVoce.interesses && c.paraVoce.interesses.length ? c.paraVoce.interesses : R.INT_PADRAO);
    el.innerHTML = '<div class="stack">' +
      '<div class="panel stack" style="gap:10px"><h3>Liga e desliga</h3><p class="small muted">Desligado some do site na hora para todo mundo. Os dados continuam guardados.</p><div class="list">' +
      ITENS.map(function (it) { return '<label class="lrow rec-sw" style="grid-template-columns:minmax(0,1fr) auto;padding:12px 16px;cursor:pointer"><span><b>' + esc(it[1]) + "</b><small>" + esc(it[2]) + '</small></span><span class="switch"><input type="checkbox" data-rec="' + it[0] + '"' + (r[it[0]] !== false ? " checked" : "") + "><i></i></span></label>"; }).join("") +
      '</div><button type="button" class="btn" data-salvar-rec style="justify-self:start">Salvar recursos</button></div>' +

      '<div class="panel stack" style="gap:10px"><h3>Mapa</h3><div class="form2">' + inp("mp-tiles", "Endereço das imagens do mapa", m.tiles, 'class="full"') + inp("mp-atr", "Crédito do mapa", m.atribuicao) + inp("mp-zoom", "Zoom inicial (10 a 15)", m.zoom, 'type="number" min="9" max="16"') +
      '</div><p class="small muted">Padrão: OpenStreetMap, gratuito com crédito e uso moderado. Para muito tráfego, use um serviço pago (Mapbox, MapTiler) e cole aqui o endereço com {z}/{x}/{y}. Deixe vazio para usar só o desenho próprio.</p><button type="button" class="btn" data-salvar-mapa style="justify-self:start">Salvar mapa</button></div>' +

      '<div class="panel stack" style="gap:10px"><h3>Etiquetas</h3><p class="small muted">Aparecem nos filtros e na página do lugar. Marque em cada lugar em Painel → Lugares.</p><div id="rc-etq">' +
      etq.map(linhaEtq).join("") + '</div><div class="row" style="gap:8px"><button type="button" class="btn sm ghost" data-mais-etq>Nova etiqueta</button><button type="button" class="btn" data-salvar-etq>Salvar etiquetas</button></div></div>' +

      '<div class="panel stack" style="gap:10px"><h3>Para você</h3>' + inp("pv-tit", "Pergunta", (c.paraVoce || {}).titulo || "O que mais te interessa?") +
      '<p class="small muted">Cada interesse junta categorias (separe por vírgula). Categorias: ' + esc(Object.keys(G.CATS).join(", ")) + '. Use "gratis" para passeios gratuitos.</p><div id="rc-int">' + ints.map(linhaInt).join("") +
      '</div><div class="row" style="gap:8px"><button type="button" class="btn sm ghost" data-mais-int>Novo interesse</button><button type="button" class="btn sm ghost" data-padrao-int>Restaurar padrão</button><button type="button" class="btn" data-salvar-int>Salvar Para você</button></div></div>' +

      '<div class="panel stack" style="gap:10px"><h3>Busca escrita</h3><p class="small muted">A busca já entende datas, preços, cidades e os tipos mais comuns em português, inglês e espanhol. Aqui você ensina palavras novas, uma por linha: <code>termo = categoria, categoria</code>, <code>termo = etiqueta:pets</code> ou <code>termo = grupo:brasileiros</code>.</p>' +
      area("bs-sin", "Palavras extras", (c.busca || {}).sinonimos || "", 'rows="5" placeholder="feijoada = restaurante-brasileiro\nrodeio = evento, show\ncachorro = etiqueta:pets"') +
      '<div class="row" style="gap:8px"><button type="button" class="btn" data-salvar-busca>Salvar palavras</button></div>' +
      '<div class="row" style="gap:8px"><label class="sr" for="bs-teste">Testar uma frase</label><input id="bs-teste" placeholder="Teste: churrasco grátis neste sábado em Plano" style="flex:1;min-width:0;padding:10px 12px;border:1px solid var(--line);border-radius:12px;background:var(--surface);color:var(--ink);font:inherit"><button type="button" class="btn ghost sm" data-testar>Testar</button></div><p class="small" id="bs-res"></p></div>' +
      "</div>";
  }
  function linhaEtq(e) { e = e || { ativo: true }; return '<div class="mrow rc-etq"><input data-k="nome" value="' + esc(e.nome || "") + '" placeholder="Nome da etiqueta" aria-label="Nome"><input data-k="id" value="' + esc(e.id || "") + '" placeholder="código (automático)" aria-label="Código" style="max-width:150px"><label class="check"><input type="checkbox" data-k="ativo"' + (e.ativo !== false ? " checked" : "") + '> ativa</label><button type="button" class="btn sm ghost" data-tira aria-label="Remover">×</button></div>'; }
  function linhaInt(x) { x = x || {}; var cats = (x.cats || []).slice(); if (x.gratis) cats.push("gratis"); return '<div class="mrow rc-int"><input data-k="nome" value="' + esc(x.nome || "") + '" placeholder="Nome (ex.: Comida brasileira)" aria-label="Nome"><input data-k="cats" value="' + esc(cats.join(", ")) + '" placeholder="categorias" aria-label="Categorias"><input data-k="etq" value="' + esc((x.etq || []).join(", ")) + '" placeholder="etiquetas (opcional)" aria-label="Etiquetas" style="max-width:150px"><button type="button" class="btn sm ghost" data-tira aria-label="Remover">×</button></div>'; }
  function lista(t) { return String(t || "").split(",").map(function (x) { return x.trim(); }).filter(Boolean); }
  function ligaRecursos(el) {
    el.onclick = function (e) {
      var t = e.target;
      if (t.closest("[data-tira]")) { t.closest(".mrow").remove(); return; }
      if (t.closest("[data-mais-etq]")) { $("#rc-etq", el).insertAdjacentHTML("beforeend", linhaEtq()); return; }
      if (t.closest("[data-mais-int]")) { $("#rc-int", el).insertAdjacentHTML("beforeend", linhaInt()); return; }
      if (t.closest("[data-padrao-int]")) { $("#rc-int", el).innerHTML = R.INT_PADRAO.map(linhaInt).join(""); return; }
      if (t.closest("[data-salvar-rec]")) { var r = {}; el.querySelectorAll("[data-rec]").forEach(function (x) { r[x.dataset.rec] = x.checked; }); salva({ recursos: r }, "Recursos salvos."); return; }
      if (t.closest("[data-salvar-mapa]")) { salva({ mapa: { tiles: $("#mp-tiles", el).value.trim(), atribuicao: $("#mp-atr", el).value.trim(), zoom: Math.max(9, Math.min(16, Number($("#mp-zoom", el).value) || 12)) } }, "Mapa salvo."); return; }
      if (t.closest("[data-salvar-etq]")) {
        var vistos = {}, etq = Array.from(el.querySelectorAll(".rc-etq")).map(function (r) { var nome = r.querySelector('[data-k="nome"]').value.trim(), id = slug(r.querySelector('[data-k="id"]').value.trim() || nome); return { id: id, nome: nome, ativo: r.querySelector('[data-k="ativo"]').checked }; }).filter(function (e) { if (!e.nome || !e.id || vistos[e.id]) return false; vistos[e.id] = 1; return true; });
        salva({ etiquetas: etq }, "Etiquetas salvas."); return;
      }
      if (t.closest("[data-salvar-int]")) {
        var ints = Array.from(el.querySelectorAll(".rc-int")).map(function (r) { var nome = r.querySelector('[data-k="nome"]').value.trim(), cats = lista(r.querySelector('[data-k="cats"]').value); var o = { id: slug(nome), nome: nome, cats: cats.filter(function (c) { return c !== "gratis"; }), etq: lista(r.querySelector('[data-k="etq"]').value) }; if (cats.indexOf("gratis") >= 0) o.gratis = true; return o; }).filter(function (x) { return x.nome && x.id; });
        salva({ paraVoce: { titulo: $("#pv-tit", el).value.trim(), interesses: ints } }, "Para você salvo."); return;
      }
      if (t.closest("[data-salvar-busca]")) { salva({ busca: { sinonimos: $("#bs-sin", el).value } }, "Palavras salvas."); return; }
      if (t.closest("[data-testar]")) {
        var fr = $("#bs-teste", el).value.trim(); if (!fr) return;
        var x = R.interpreta(fr), n = R.aplica(x.F).lista.length;
        $("#bs-res", el).innerHTML = "<b>Entendi:</b> " + esc(x.entendi.join(" · ") || "nada específico") + " · <b>" + n + "</b> resultado" + (n === 1 ? "" : "s") + ' · <a href="#' + esc(R.paraLink(x.F)) + '">abrir no mapa</a>';
      }
    };
  }

  /* ================= Parceiros ================= */
  function abaParceiros(el) {
    var ps = Store.lista("parceiros").sort(function (a, b) { return String(a.nome).localeCompare(String(b.nome)); });
    var cont = {}; G.lugares().forEach(function (l) { (l.recomendacoes || []).forEach(function (r) { cont[r.p] = (cont[r.p] || 0) + 1; }); });
    el.innerHTML = '<div class="stack"><div class="row" style="justify-content:space-between"><p class="muted small" style="max-width:60ch;margin:0">Parceiros, influenciadores e comunidades que recomendam lugares. Aparecem em "Quem recomendou" na página do lugar. Parcerias pagas recebem o selo "Parceria paga".</p><button type="button" class="btn" data-novo-p>Novo parceiro</button></div>' +
      (ps.length ? '<div class="list">' + ps.map(function (p) { return '<button type="button" class="lrow" style="grid-template-columns:48px minmax(0,1fr) auto;padding:10px 14px;text-align:left" data-ed-p="' + esc(p.id) + '"><span class="th">' + (p.foto ? '<img src="' + esc(Store.urlFoto(p.foto)) + '" alt="">' : "") + "</span><span><b>" + esc(p.nome) + (p.pago ? ' <span class="pill warn">paga</span>' : "") + (p.ativo === false ? ' <span class="pill">oculto</span>' : "") + "</b><small>" + esc(p.tipo || "") + " · " + (cont[p.id] || 0) + ' recomendações</small></span><span class="small muted">editar</span></button>'; }).join("") + "</div>" : '<div class="panel"><p class="muted">Nenhum parceiro ainda.</p></div>') + "</div>";
    el.onclick = function (e) {
      if (e.target.closest("[data-novo-p]")) editaParceiro({});
      var b = e.target.closest("[data-ed-p]"); if (b) editaParceiro(Store.obter("parceiros", b.dataset.edP) || {});
    };
  }
  function editaParceiro(p) {
    var dlg = $("#dlg"), D = JSON.parse(JSON.stringify(p));
    dlg.innerHTML = '<form method="dialog" id="f-par"><div class="dlg-head"><h3>' + (D.id ? "Editar parceiro" : "Novo parceiro") + '</h3><button type="button" class="btn sm ghost" data-fechar>Fechar</button></div><div class="dlg-body"><div class="form2">' +
      inp("p-nome", "Nome", D.nome, 'required maxlength="60"') + inp("p-tipo", "Tipo (ex.: Influenciadora, Associação, Chef)", D.tipo, 'maxlength="40"') + inp("p-ig", "Instagram (@usuario)", D.instagram, 'maxlength="40"') +
      '<div class="field"><label for="p-pago">Parceria</label><select id="p-pago"><option value="0"' + (!D.pago ? " selected" : "") + '>Gratuita</option><option value="1"' + (D.pago ? " selected" : "") + '>Paga (mostra o selo "Parceria paga")</option></select></div>' +
      '<div class="field"><label for="p-ativo">Status</label><select id="p-ativo"><option value="1"' + (D.ativo !== false ? " selected" : "") + '>Visível</option><option value="0"' + (D.ativo === false ? " selected" : "") + ">Oculto</option></select></div>" +
      area("p-bio", "Sobre", D.bio, 'maxlength="400"') +
      '<div class="field full"><label for="p-foto">Foto</label><div class="row" style="gap:10px"><span class="th" id="p-prev" style="width:56px;height:56px;border-radius:50%;overflow:hidden;display:inline-block;background:var(--surface-2)">' + (D.foto ? '<img src="' + esc(Store.urlFoto(D.foto)) + '" alt="" style="width:100%;height:100%;object-fit:cover">' : "") + '</span><input type="file" id="p-foto" accept="image/*"></div></div>' +
      '</div></div><div class="dlg-foot">' + (D.id ? '<button type="button" class="btn danger" data-ex-p style="margin-right:auto">Excluir</button>' : "") + '<button type="button" class="btn ghost" data-fechar>Cancelar</button><button class="btn" type="submit">Salvar</button></div></form>';
    dlg.showModal();
    $("#p-foto", dlg).onchange = function (e) { var f = e.target.files[0]; if (!f) return; Store.salvarFoto(f).then(function (src) { D.foto = src; $("#p-prev", dlg).innerHTML = '<img src="' + esc(Store.urlFoto(src)) + '" alt="" style="width:100%;height:100%;object-fit:cover">'; }).catch(function (er) { G.toast(er.message || "Não foi possível enviar a foto."); }); };
    dlg.onclick = function (e) {
      if (e.target.closest("[data-fechar]")) dlg.close();
      var x = e.target.closest("[data-ex-p]"); if (x) { if (!x.dataset.ok) { x.dataset.ok = 1; x.textContent = "Confirmar exclusão"; return; } Store.apagar("parceiros", D.id).then(function () { dlg.close(); G.toast("Parceiro excluído."); }); }
    };
    $("#f-par", dlg).onsubmit = function (e) {
      e.preventDefault();
      var nome = $("#p-nome", dlg).value.trim(); if (!nome) return;
      var id = D.id || slug(nome) || Store.novoId("p"); if (!D.id && Store.obter("parceiros", id)) id += "-" + Date.now().toString(36).slice(-4);
      var dados = { nome: nome, tipo: $("#p-tipo", dlg).value.trim(), instagram: $("#p-ig", dlg).value.trim().replace(/^@/, ""), bio: $("#p-bio", dlg).value.trim(), pago: $("#p-pago", dlg).value === "1", ativo: $("#p-ativo", dlg).value === "1", foto: D.foto || "" };
      Store.gravar("parceiros", id, dados).then(function () { dlg.close(); G.toast("Parceiro salvo."); }).catch(function (er) { G.toast(er.message || "Não foi possível salvar."); });
    };
  }

  /* ================= Newsletter ================= */
  function abaNewsletter(el) {
    var c = cfg(), nt = c.newsletterTexto || {}, nc = Store.obter("config", "newsletter") || {};
    var srv = Store.servidor && Store.servidor();
    el.innerHTML = '<div class="stack">' + (srv ? "" : '<p class="note">A newsletter envia e-mails pelo servidor próprio (Hostinger). Aqui no Claude ela fica desligada; configure e envie pelo site hospedado.</p>') +
      '<div class="kpis" id="nl-kpis"><div class="kpi"><b class="num">…</b><span>inscritos ativos</span></div></div>' +
      '<div class="panel stack" style="gap:10px"><h3>Na página inicial</h3><div class="form2">' + inp("nl-tit", "Título do convite", nt.titulo || "A semana no CoraçãoBR, no seu e-mail") + inp("nl-txt", "Texto do convite", nt.texto || "Eventos da semana e lugares que valem a visita. Um e-mail por semana, sem spam.", 'class="full"') + '</div><p class="small muted">Para mudar a posição na página inicial, use Painel → Aparência (seção "Newsletter por e-mail").</p><button type="button" class="btn" data-nl-convite style="justify-self:start">Salvar convite</button></div>' +
      '<div class="panel stack" style="gap:10px"><h3>Conteúdo do e-mail</h3><div class="form2">' + inp("nl-ass", "Assunto", nc.assunto || "A semana no CoraçãoBR") + inp("nl-dias", "Eventos dos próximos (dias)", nc.dias || 10, 'type="number" min="3" max="30"') + inp("nl-max", "Máximo de eventos", nc.maxEventos || 8, 'type="number" min="1" max="15"') + inp("nl-tdest", "Título dos destaques", nc.tituloDestaques || "Vale a visita") +
      area("nl-intro", "Introdução (aparece no topo)", nc.intro || "", 'rows="3"') + area("nl-bv", "Mensagem de boas-vindas (e-mail de inscrição)", nc.boasVindas || "", 'rows="2"') +
      '<div class="field full"><label for="nl-dest">Destaques (lugares fixos no e-mail)</label><select id="nl-dest" multiple size="6">' + G.lugares().filter(function (l) { return !R.ehEvento(l); }).sort(function (a, b) { return String(a.nome).localeCompare(String(b.nome)); }).map(function (l) { return '<option value="' + esc(l.id) + '"' + ((nc.destaques || []).indexOf(l.id) >= 0 ? " selected" : "") + ">" + esc(l.nome) + "</option>"; }).join("") + '</select><small class="muted">Segure Ctrl (ou Cmd) para escolher vários.</small></div>' +
      '<label class="check full"><input type="checkbox" id="nl-auto"' + (nc.automatica ? " checked" : "") + "> Enviar sozinho toda semana (precisa do agendador da Hostinger, veja abaixo)</label></div>" +
      '<div class="row" style="gap:8px"><button type="button" class="btn" data-nl-salvar>Salvar conteúdo</button><button type="button" class="btn ghost" data-nl-previa' + (srv ? "" : " disabled") + '>Pré-visualizar</button><button type="button" class="btn ghost" data-nl-teste' + (srv ? "" : " disabled") + '>Enviar teste para mim</button><button type="button" class="btn" data-nl-todos' + (srv ? "" : " disabled") + '>Enviar para todos</button></div><p class="small" id="nl-msg"></p><div id="nl-prev"></div></div>' +
      '<div class="panel stack" style="gap:8px" id="nl-cron"><h3>Envio automático</h3><p class="small muted">No hPanel: Avançado → Cron Jobs → adicione um comando semanal (por exemplo, toda segunda às 9h) chamando o endereço abaixo. Ele só envia se a opção "Enviar sozinho" estiver marcada.</p><p class="small" id="nl-cron-url">' + (srv ? "Carregando…" : "Disponível no site hospedado.") + "</p></div>" +
      '<div class="panel stack" style="gap:10px"><div class="row" style="justify-content:space-between"><h3 style="margin:0">Inscritos</h3><span class="row" style="gap:8px"><input id="nl-busca" placeholder="Buscar e-mail" style="padding:8px 10px;border:1px solid var(--line);border-radius:10px;background:var(--surface);color:var(--ink);font:inherit"><button type="button" class="btn ghost sm" data-nl-csv' + (srv ? "" : " disabled") + '>Baixar CSV</button></span></div><div id="nl-lista" class="list"></div></div>' +
      '<div class="panel stack" style="gap:8px"><h3>Envios</h3><div id="nl-envios" class="small muted">—</div></div></div>';
    var dados = { assinantes: [], envios: [] };
    function desenhaLista() {
      var q = ($("#nl-busca", el).value || "").toLowerCase(), ls = dados.assinantes.filter(function (a) { return !q || a.email.indexOf(q) >= 0 || String(a.nome || "").toLowerCase().indexOf(q) >= 0; });
      $("#nl-lista", el).innerHTML = ls.length ? ls.slice(0, 300).map(function (a) { return '<div class="lrow" style="grid-template-columns:minmax(0,1fr) auto;padding:10px 14px;cursor:default"><span><b>' + esc(a.email) + "</b><small>" + esc([a.nome, a.origem, (a.criado || "").slice(0, 10), +a.ativo ? "ativo" : "saiu"].filter(Boolean).join(" · ")) + '</small></span><button type="button" class="btn ghost sm" data-nl-rem="' + esc(a.email) + '">Remover</button></div>'; }).join("") : '<p class="muted small" style="padding:12px">Nenhum inscrito.</p>';
      var at = dados.assinantes.filter(function (a) { return +a.ativo; }).length;
      $("#nl-kpis", el).innerHTML = '<div class="kpi"><b class="num">' + at + '</b><span>inscritos ativos</span></div><div class="kpi"><b class="num">' + (dados.assinantes.length - at) + '</b><span>saíram da lista</span></div><div class="kpi"><b class="num">' + dados.envios.length + "</b><span>envios registrados</span></div>";
      $("#nl-envios", el).innerHTML = dados.envios.length ? dados.envios.map(function (x) { return esc((x.em || "").slice(0, 16).replace("T", " ") + " · " + x.assunto + " · " + x.modo + " · " + x.enviados + " enviados" + (+x.falhas ? ", " + x.falhas + " falhas" : "")); }).join("<br>") : "Nenhum envio ainda.";
    }
    function carrega() { if (!srv) { $("#nl-kpis", el).innerHTML = ""; return; } Store.api("newsletter_lista").then(function (j) { dados = j; desenhaLista(); }).catch(function (er) { $("#nl-lista", el).textContent = er.message; }); Store.api("cron_info").then(function (j) { $("#nl-cron-url", el).innerHTML = '<span style="user-select:all;overflow-wrap:anywhere"><b>' + esc(j.url) + "</b></span>"; }).catch(function () {}); }
    function salvaConteudo() {
      var d = { assunto: $("#nl-ass", el).value.trim(), dias: Number($("#nl-dias", el).value) || 10, maxEventos: Number($("#nl-max", el).value) || 8, tituloDestaques: $("#nl-tdest", el).value.trim(), intro: $("#nl-intro", el).value.trim(), boasVindas: $("#nl-bv", el).value.trim(), destaques: Array.from($("#nl-dest", el).selectedOptions).map(function (o) { return o.value; }), automatica: $("#nl-auto", el).checked };
      return Store.gravar("config", "newsletter", d);
    }
    var msg = function (t) { $("#nl-msg", el).textContent = t; };
    el.oninput = function (e) { if (e.target.id === "nl-busca") desenhaLista(); };
    el.onclick = function (e) {
      var t = e.target;
      if (t.closest("[data-nl-convite]")) { salva({ newsletterTexto: { titulo: $("#nl-tit", el).value.trim(), texto: $("#nl-txt", el).value.trim() } }, "Convite salvo."); return; }
      if (t.closest("[data-nl-salvar]")) { salvaConteudo().then(function () { G.toast("Conteúdo salvo."); }); return; }
      if (t.closest("[data-nl-previa]")) { salvaConteudo().then(function () { return Store.api("newsletter_previa"); }).then(function (j) { msg("Assunto: " + j.assunto + " · " + j.itens + " itens"); var fr = document.createElement("iframe"); fr.title = "Prévia da newsletter"; fr.style.cssText = "width:100%;height:520px;border:1px solid var(--line);border-radius:12px;background:#fff"; fr.setAttribute("sandbox", ""); fr.srcdoc = j.html; var p = $("#nl-prev", el); p.innerHTML = ""; p.appendChild(fr); }).catch(function (er) { msg(er.message); }); return; }
      if (t.closest("[data-nl-teste]")) { msg("Enviando teste…"); salvaConteudo().then(function () { return Store.api("newsletter_enviar", { modo: "teste" }); }).then(function (j) { msg(j.enviados ? "Teste enviado para " + j.para + ". Confira a caixa de entrada e o spam." : "O servidor não conseguiu enviar. Confira o e-mail remetente em api/config.php."); }).catch(function (er) { msg(er.message); }); return; }
      var tb = t.closest("[data-nl-todos]");
      if (tb) {
        if (!tb.dataset.ok) { tb.dataset.ok = 1; tb.textContent = "Confirmar envio para todos"; return; }
        tb.disabled = true; var tot = 0, fal = 0;
        salvaConteudo().then(function lote(de) {
          return Store.api("newsletter_enviar", { modo: "todos", de: typeof de === "number" ? de : 0 }).then(function (j) { tot += j.enviados; fal += j.falhas; msg("Enviados " + tot + " de " + j.total + (fal ? " (" + fal + " falhas)" : "") + "…"); if (j.proximo != null) return lote(j.proximo); msg("Pronto: " + tot + " e-mails enviados" + (fal ? ", " + fal + " falharam" : "") + "."); tb.disabled = false; tb.textContent = "Enviar para todos"; delete tb.dataset.ok; carrega(); });
        }).catch(function (er) { msg(er.message); tb.disabled = false; });
        return;
      }
      if (t.closest("[data-nl-csv]")) { baixa("inscritos-newsletter.csv", csv([["email", "nome", "ativo", "origem", "criado", "saiu"]].concat(dados.assinantes.map(function (a) { return [a.email, a.nome, +a.ativo ? "sim" : "não", a.origem, a.criado, a.saiu]; })))); return; }
      var rm = t.closest("[data-nl-rem]"); if (rm) { if (!rm.dataset.ok) { rm.dataset.ok = 1; rm.textContent = "Confirmar"; return; } Store.api("newsletter_remover", { email: rm.dataset.nlRem }).then(carrega); }
    };
    carrega();
  }

  /* ================= Pesquisa ================= */
  function abaPesquisa(el) {
    var p = Object.assign({ id: "", ativa: false, titulo: "Ajude a melhorar o CoraçãoBR", convite: "Responda em 1 minuto.", descricao: "", recompensa: "", atraso: 45, perguntas: [] }, cfg().pesquisa || {});
    el.innerHTML = '<div class="stack"><div class="panel stack" style="gap:10px"><h3>Pesquisa</h3><p class="small muted">Aparece num cartão depois de alguns segundos no site, uma vez por pessoa. Só quem tem conta responde, para você poder pagar a recompensa. Ligue também em Recursos → "Pesquisa com recompensa".</p><div class="form2">' +
      '<label class="check"><input type="checkbox" id="pq-ativa"' + (p.ativa ? " checked" : "") + "> Pesquisa ativa</label>" + inp("pq-atraso", "Aparece depois de (segundos)", p.atraso, 'type="number" min="5" max="600"') +
      inp("pq-tit", "Título", p.titulo) + inp("pq-conv", "Convite curto", p.convite) + inp("pq-rec", "Recompensa (ex.: Ganhe US$ 5 no Zelle ou R$ 10 no Pix)", p.recompensa, 'class="full"') + area("pq-desc", "Explicação no formulário", p.descricao, 'rows="2"') +
      '</div><h3 style="margin-top:6px">Perguntas</h3><div id="pq-lista">' + (p.perguntas || []).map(linhaPerg).join("") + '</div><div class="row" style="gap:8px"><button type="button" class="btn sm ghost" data-pq-mais>Nova pergunta</button><button type="button" class="btn" data-pq-salvar>Salvar pesquisa</button><button type="button" class="btn ghost" data-pq-nova>Começar nova pesquisa</button></div><p class="small muted">"Começar nova pesquisa" cria outra rodada: quem já respondeu volta a ver o convite.</p></div>' +
      '<div class="panel stack" style="gap:10px"><div class="row" style="justify-content:space-between"><h3 style="margin:0">Respostas</h3><button type="button" class="btn ghost sm" data-pq-csv>Baixar CSV</button></div><div id="pq-resp" class="list"><p class="muted small" style="padding:12px">Carregando…</p></div></div></div>';
    var resp = [];
    function carrega() {
      if (!p.id) { $("#pq-resp", el).innerHTML = '<p class="muted small" style="padding:12px">Salve a pesquisa para começar a receber respostas.</p>'; return; }
      Store.consultar("respostas", "pesquisa", p.id).then(function (rs) {
        resp = rs.sort(function (a, b) { return a.em < b.em ? 1 : -1; });
        $("#pq-resp", el).innerHTML = resp.length ? resp.map(function (r) { return '<div class="lrow" style="grid-template-columns:minmax(0,1fr) auto;padding:12px 16px;cursor:default;align-items:start"><span><b>' + esc(r.nome || "Sem nome") + "</b><small>" + esc((r.em || "").slice(0, 16).replace("T", " ")) + (r.pix ? " · Pix/Zelle: " + esc(r.pix) : "") + "</small>" + (r.respostas || []).map(function (x) { return "<small><b>" + esc(x.pergunta) + "</b> " + esc(x.resposta) + "</small>"; }).join("") + '</span><button type="button" class="btn ' + (r.pago ? "soft" : "ghost") + ' sm" data-pq-pago="' + esc(r.id) + '">' + (r.pago ? "Pago" : "Marcar pago") + "</button></div>"; }).join("") : '<p class="muted small" style="padding:12px">Nenhuma resposta ainda.</p>';
      });
    }
    function ler(novoId) {
      var ps = Array.from(el.querySelectorAll(".pq-l")).map(function (r) { return { tipo: r.querySelector('[data-k="tipo"]').value, texto: r.querySelector('[data-k="texto"]').value.trim(), opcoes: lista(r.querySelector('[data-k="opcoes"]').value) }; }).filter(function (q) { return q.texto; });
      return { id: novoId ? "pq-" + Date.now().toString(36) : (p.id || "pq-" + Date.now().toString(36)), ativa: $("#pq-ativa", el).checked, atraso: Number($("#pq-atraso", el).value) || 45, titulo: $("#pq-tit", el).value.trim(), convite: $("#pq-conv", el).value.trim(), recompensa: $("#pq-rec", el).value.trim(), descricao: $("#pq-desc", el).value.trim(), perguntas: ps };
    }
    el.onclick = function (e) {
      var t = e.target;
      if (t.closest("[data-tira]")) { t.closest(".mrow").remove(); return; }
      if (t.closest("[data-pq-mais]")) { $("#pq-lista", el).insertAdjacentHTML("beforeend", linhaPerg()); return; }
      if (t.closest("[data-pq-salvar]")) { p = ler(false); if (!p.perguntas.length) { G.toast("Inclua ao menos uma pergunta."); return; } salva({ pesquisa: p }, "Pesquisa salva.").then(carrega); return; }
      var nv = t.closest("[data-pq-nova]"); if (nv) { if (!nv.dataset.ok) { nv.dataset.ok = 1; nv.textContent = "Confirmar nova rodada"; return; } p = ler(true); salva({ pesquisa: p }, "Nova pesquisa criada.").then(function () { abaPesquisa(el); }); return; }
      if (t.closest("[data-pq-csv]")) { baixa("respostas-pesquisa.csv", csv([["nome", "data", "pix_zelle", "pago"].concat((p.perguntas || []).map(function (q) { return q.texto; }))].concat(resp.map(function (r) { return [r.nome, r.em, r.pix, r.pago ? "sim" : "não"].concat((r.respostas || []).map(function (x) { return x.resposta; })); })))); return; }
      var pg = t.closest("[data-pq-pago]"); if (pg) { var r = resp.filter(function (x) { return x.id === pg.dataset.pqPago; })[0]; if (!r) return; var d = Object.assign({}, r); d.pago = !r.pago; Store.gravar("respostas", r.id, d).then(carrega).catch(function (er) { G.toast(er.message); }); }
    };
    carrega();
  }
  function linhaPerg(q) { q = q || { tipo: "texto" }; return '<div class="mrow pq-l"><select data-k="tipo" aria-label="Tipo"><option value="texto"' + (q.tipo === "texto" ? " selected" : "") + '>Texto livre</option><option value="nota"' + (q.tipo === "nota" ? " selected" : "") + '>Nota de 1 a 5</option><option value="escolha"' + (q.tipo === "escolha" ? " selected" : "") + '>Escolha</option></select><input data-k="texto" value="' + esc(q.texto || "") + '" placeholder="Pergunta" aria-label="Pergunta"><input data-k="opcoes" value="' + esc((q.opcoes || []).join(", ")) + '" placeholder="Opções (para Escolha), separadas por vírgula" aria-label="Opções"><button type="button" class="btn sm ghost" data-tira aria-label="Remover">×</button></div>'; }

  window.PainelRecursos = {
    abas: [["recursos", "Recursos"], ["banners", "Banners"], ["publicacoes", "Publicações"], ["parceiros", "Parceiros"], ["newsletter", "Newsletter"], ["pesquisa", "Pesquisa"]],
    recursos: function (el) { abaRecursos(el); ligaRecursos(el); }, parceiros: abaParceiros, newsletter: abaNewsletter, pesquisa: abaPesquisa
  };
})();
