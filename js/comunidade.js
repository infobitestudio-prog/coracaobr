/* Comunidade: avisos, Brasileiro do mês, mural de vagas e classificados, roteiro com IA, custo de vida,
   outras cidades, instalar no celular e cupom com QR Code. Os preços vêm de Painel → Finanças. */
(function () {
  "use strict";
  var G = window.Guia, esc = G.esc, ic = G.ic, $ = function (s, r) { return (r || document).querySelector(s); };
  var TIPOS_CL = { emprego: "Vagas de emprego", aluguel: "Aluguel e quartos", carona: "Caronas", venda: "Compra e venda", servico: "Procuro serviço" };
  var TIPOS_AL = { consulado: ["Consulado", "doc"], jogo: ["Jogo do Brasil", "flag"], documento: ["Documentos", "doc"], clima: ["Clima", "bell"], comunidade: ["Comunidade", "users"], evento: ["Evento", "ticket"] };
  function hoje() { return G.hojeISO(); }
  function dataBR(iso) { var p = String(iso || "").slice(0, 10).split("-"); return p.length === 3 ? esc(p[2] + "/" + p[1]) : ""; }
  function zap(n) { var d = String(n || "").replace(/\D/g, ""); if (d.length === 10) d = "1" + d; return d ? "https://wa.me/" + d : ""; }
  function lugar(id) { return Store.obter("lugares", id); }

  /* ---------- avisos (alertas) ---------- */
  function alertasAtivos() {
    var h = hoje();
    return Store.lista("alertas").filter(function (a) { return a.publicado !== false && (!a.ate || a.ate >= h) && (!a.de || a.de <= addDias(h, 21)); })
      .sort(function (a, b) { return (a.de || a.criadoEm || "").localeCompare(b.de || b.criadoEm || ""); });
  }
  function addDias(iso, n) { var d = new Date(iso + "T12:00:00"); d.setDate(d.getDate() + n); return d.toISOString().slice(0, 10); }
  function cardAlerta(a) {
    var t = TIPOS_AL[a.tipo] || TIPOS_AL.comunidade, lk = G.url(a.link);
    return '<' + (lk ? 'a href="' + esc(lk) + '" target="_blank" rel="noopener"' : "div") + ' class="alerta"><span class="aic">' + ic(t[1]) + "</span><span><small>" + esc(t[0]) + (a.de ? " · " + dataBR(a.de) + (a.ate && a.ate !== a.de ? "–" + dataBR(a.ate) : "") : "") + "</small><b>" + esc(a.titulo) + "</b>" + (a.texto ? "<em>" + esc(a.texto) + "</em>" : "") + "</span></" + (lk ? "a" : "div") + ">";
  }

  /* ---------- Brasileiro do mês: escolhido no Painel; sem escolha, o guia pega sozinho o negócio brasileiro mais bem avaliado ---------- */
  function brasileiroDoMes(ls) {
    var c = G.config().destaqueMes || {}, l = c.lugar ? lugar(c.lugar) : null;
    if (!l) {
      var cands = ls.filter(function (x) { return x.brasileiro && x.tipo === "estabelecimento" && (x.fotos || []).length; });
      cands = G.primeiro(cands.sort(G.ordenaNota));
      var mes = Number(hoje().slice(5, 7)); l = cands.length ? cands[(mes - 1) % Math.min(cands.length, 6)] : null;
      if (l && cands[0] && cands[0].anunciante) l = cands[0];
    }
    return l ? { l: l, titulo: c.titulo || "", texto: c.texto || l.historia || "" } : null;
  }

  /* ---------- seções da página inicial ---------- */
  function secoes(ls) {
    var c = G.config(), tx = function (k, d) { return (c.textos && c.textos[k]) || d; };
    var al = alertasAtivos(), bm = brasileiroDoMes(ls), cl = classificadosAtivos().slice(0, 6);
    var out = {};
    out.alertas = al.length ? '<section class="block reveal"><div class="head"><h2>' + esc(tx("alertas", "Avisos da comunidade")) + '</h2><span class="more">atualizado sozinho</span></div><div class="hscroll alertas">' + al.slice(0, 8).map(cardAlerta).join("") + "</div></section>" : "";
    if (bm) {
      var f = G.foto(bm.l), resumo = String(bm.texto).split(/(?<=\.)\s/).slice(0, 2).join(" ");
      out.destaqueMes = '<section class="block reveal"><a class="bmes" href="#lugar-' + esc(bm.l.id) + '">' + (f ? '<img src="' + esc(f) + '" alt="" loading="lazy">' : "") + '<span class="bmt"><small>' + ic("star") + " Brasileiro do mês</small><b>" + esc(bm.titulo || bm.l.nome) + "</b><em>" + esc(resumo.slice(0, 220)) + '</em><span class="btn sm">Conhecer ' + ic("arrow") + "</span></span></a></section>";
    } else out.destaqueMes = "";
    out.ia = '<section class="block reveal"><a class="bn ia" href="#roteiro-ia"><i></i><small>' + ic("sparkle") + " Novo</small><b>" + esc(tx("ia", "Diga quanto tempo e quanto quer gastar. A IA monta o seu dia.")) + "</b><span>Montar meu roteiro " + ic("arrow") + "</span></a></section>";
    out.mural = '<section class="block reveal"><div class="head"><h2>' + esc(tx("mural", "Mural de vagas e classificados")) + '</h2><a class="more" href="#mural">ver todos</a></div>' +
      (cl.length ? '<div class="hscroll">' + cl.map(cardClass).join("") + "</div>" : '<a class="panel muralvazio" href="#mural"><b>Emprego, aluguel, carona e venda entre brasileiros.</b><span class="muted small">Seja o primeiro a publicar.</span></a>') + "</section>";
    out.custo = '<section class="block reveal"><a class="bn alt" href="#custo"><i></i><small>Vai morar no Texas?</small><b>' + esc(tx("custo", "Compare aluguel, escolas e impostos em 14 cidades da região")) + "</b><span>Comparar cidades " + ic("arrow") + "</span></a></section>";
    out.cidades = '<section class="block reveal"><div class="head"><h2>' + esc(tx("cidades", "Em breve em outras cidades")) + '</h2><a class="more" href="#cidades">avise-me</a></div><div class="cityrow">' + CIDADES.map(function (k) { return '<a class="city" href="#cidades"><b>' + esc(k[0]) + "</b><small>" + esc(k[1]) + "</small></a>"; }).join("") + "</div></section>";
    /* Depoimentos: só avaliações reais de quem usa o guia (4 ou 5 estrelas e com texto). */
    var depo = Store.lista("avaliacoes").filter(function (a) { return Number(a.estrelas) >= 4 && String(a.texto || "").trim().length >= 25 && lugar(a.lugarId); })
      .sort(function (a, b) { return (b.criadoEm || "").localeCompare(a.criadoEm || ""); }).slice(0, 10);
    out.depoimentos = depo.length ? '<section class="block reveal"><div class="head"><h2>' + esc(tx("depoimentos", "Quem foi, recomenda")) + '</h2><a class="more" href="#ranking">ver ranking</a></div><div class="hscroll depos">' + depo.map(function (a) { var l = lugar(a.lugarId), n = String(a.nome || "Visitante").trim(); return '<a class="depo" href="#lugar-' + esc(l.id) + '"><span class="dq">“</span><p>' + esc(String(a.texto).slice(0, 220)) + '</p><span class="dp"><span class="avatar sm">' + esc(n.charAt(0).toUpperCase()) + "</span><span><b>" + esc(n.split(" ")[0]) + "</b><small>" + "★".repeat(Math.round(a.estrelas)) + " · " + esc(l.nome) + (a.tipo === "experiencia" ? " · esteve aqui" : "") + "</small></span></span></a>"; }).join("") + "</div></section>" : "";
    out.instalar = '<section class="block reveal instalar-sec"><a class="panel instalar" href="#instalar"><span class="aic">' + ic("phone") + '</span><span><b>Tenha o guia na tela do celular</b><small class="muted">Abre como um app, sem ocupar espaço.</small></span>' + ic("arrow") + "</a></section>";
    return out;
  }

  /* ---------- mural ---------- */
  function classificadosAtivos() {
    var h = hoje();
    return Store.lista("classificados").filter(function (c) { return c.publicado !== false && (!c.expira || c.expira >= h); }).sort(function (a, b) { return (b.criadoEm || "").localeCompare(a.criadoEm || ""); });
  }
  function cardClass(c) {
    return '<a class="clcard" href="#mural-' + esc(c.id) + '"><small>' + esc(TIPOS_CL[c.tipo] || "Classificado") + (c.cidade ? " · " + esc(c.cidade) : "") + "</small><b>" + esc(c.titulo) + "</b><span>" + esc(String(c.texto || "").slice(0, 90)) + "</span>" + (c.preco ? '<em class="num">' + G.usd(c.preco) + "</em>" : "") + "</a>";
  }
  var filtroCl = "";
  function meusCl() { try { return JSON.parse(localStorage.getItem("meus-classificados") || "[]"); } catch (e) { return []; } }
  function viewMural(r) {
    var abrir = r && r.indexOf("mural-") === 0 ? r.slice(6) : null, c = G.config(), preco = Number(c.precoClassificado) || 0, dias = Number(c.diasClassificado) || 30;
    var ls = classificadosAtivos().filter(function (x) { return !filtroCl || x.tipo === filtroCl; }), uid = Store.uid();
    G.app.innerHTML = '<section class="block"><div class="wrap stack" style="gap:16px"><div class="head" style="margin:0"><div><p class="eyebrow">Entre brasileiros</p><h1 class="page-h">Mural</h1></div><button type="button" class="btn" data-novo-cl>Publicar anúncio</button></div>' +
      '<p class="muted" style="max-width:60ch">Vagas, aluguel de quarto, carona para o aeroporto, compra e venda, publicados por anunciantes do CoraçãoBR. Cada publicação fica ' + dias + ' dias no ar.</p>' +
      '<div class="chips"><button type="button" class="chip" data-tcl="" aria-pressed="' + !filtroCl + '">Todos</button>' + Object.keys(TIPOS_CL).map(function (k) { return '<button type="button" class="chip" data-tcl="' + k + '" aria-pressed="' + (filtroCl === k) + '">' + TIPOS_CL[k] + "</button>"; }).join("") + "</div>" +
      (ls.length ? '<div class="clgrid">' + ls.map(function (x) {
        var meu = (uid && String(x.id).indexOf(uid + "~") === 0) || meusCl().indexOf(x.id) >= 0, w = zap(x.whatsapp);
        return '<article class="panel clitem" id="cl-' + esc(x.id) + '"' + (abrir === x.id ? ' data-foco="1"' : "") + '><small class="eyebrow">' + esc(TIPOS_CL[x.tipo] || "Classificado") + (x.cidade ? " · " + esc(x.cidade) : "") + " · " + dataBR(x.criadoEm) + "</small><h3>" + esc(x.titulo) + "</h3><p>" + esc(x.texto) + "</p>" + (x.preco ? '<p class="num"><b>' + G.usd(x.preco) + "</b>" + G.brl(x.preco) + "</p>" : "") +
          '<div class="row">' + (w ? '<a class="btn sm" href="' + w + "?text=" + encodeURIComponent("Olá! Vi seu anúncio no CoraçãoBR: " + x.titulo) + '" target="_blank" rel="noopener">' + ic("chat") + " WhatsApp</a>" : "") + (meu ? '<button type="button" class="btn sm danger" data-apaga-cl="' + esc(x.id) + '">Remover</button>' : '<button type="button" class="btn sm ghost" data-denuncia="' + esc(x.id) + '">Denunciar</button>') + "</div></article>";
      }).join("") + "</div>" : '<div class="panel"><h3>Nenhum anúncio ainda</h3><p class="muted">Publique o primeiro.</p></div>') +
      '<p class="note">O guia não intermedeia negócios. Desconfie de quem pede pagamento adiantado.</p></div></section>';
    var foco = $("[data-foco]"); if (foco) foco.scrollIntoView({ block: "center" });
    G.app.querySelector("section").onclick = function (e) {
      var t = e.target.closest("[data-tcl]"); if (t) { filtroCl = t.dataset.tcl; viewMural(); return; }
      if (e.target.closest("[data-novo-cl]")) { if (podePublicar()) formClass(); else soAnunciante(); return; }
      var a = e.target.closest("[data-apaga-cl]"); if (a) { Store.apagar("classificados", a.dataset.apagaCl).then(function () { G.toast("Anúncio removido."); viewMural(); }).catch(function () { G.toast("Não deu para remover agora."); }); return; }
      var d = e.target.closest("[data-denuncia]"); if (d) { Store.gravar("avisos", Store.novoId("av"), { tipo: "denuncia", lugarId: d.dataset.denuncia, nome: "Classificado denunciado", criadoEm: new Date().toISOString(), lido: false }).then(function () { G.toast("Obrigado. A equipe vai olhar."); }).catch(function () { G.toast("Não deu para enviar agora."); }); }
    };
  }
  /* Só quem paga publica: o Mural é dos anunciantes (plano único de US$ 20/mês). */
  function podePublicar() { if (Store.admin()) return true; if (Store.servidor && Store.servidor()) return Store.papel() === "anunciante" && !!(window.Anunciante && Anunciante.temPlano()); return !!(window.Anunciante && Anunciante.temPlano()); }
  function soAnunciante() {
    var dlg = $("#dlg"), c = G.config();
    dlg.innerHTML = '<div class="dlg stack" style="gap:12px"><h3>Publicar é para anunciantes</h3><p class="muted">Vagas, quartos, vendas e novidades são publicados por quem anuncia no CoraçãoBR. O plano custa ' + G.usd(c.precoAnuncio || 20) + ' por mês e inclui até 3 anúncios, banner no carrossel, publicações no feed e no Mural.</p><div class="row"><a class="btn" href="#anuncie" data-fecha>Ver o plano</a><button class="btn ghost" type="button" data-fecha>Agora não</button></div></div>';
    dlg.showModal(); Array.from(dlg.querySelectorAll("[data-fecha]")).forEach(function (b) { b.onclick = function () { dlg.close(); }; });
  }
  function formClass() {
    var c = G.config(), preco = 0, dias = Number(c.diasClassificado) || 30, lk = G.url((c.pagamentos || {}).classificado), dlg = $("#dlg");
    dlg.innerHTML = '<form method="dialog" class="dlg stack" id="f-cl" style="gap:12px"><h3>Publicar no mural</h3>' +
      '<div class="field"><label for="cl-tipo">Tipo</label><select id="cl-tipo">' + Object.keys(TIPOS_CL).map(function (k) { return '<option value="' + k + '">' + TIPOS_CL[k] + "</option>"; }).join("") + "</select></div>" +
      '<div class="field"><label for="cl-tit">Título</label><input id="cl-tit" maxlength="90" required placeholder="Ex.: Quarto mobiliado em Plano"></div>' +
      '<div class="field"><label for="cl-txt">Detalhes</label><textarea id="cl-txt" maxlength="800" required></textarea></div>' +
      '<div class="form2"><div class="field"><label for="cl-preco">Valor em US$ (opcional)</label><input id="cl-preco" inputmode="decimal"></div><div class="field"><label for="cl-cid">Cidade</label><input id="cl-cid" maxlength="40" placeholder="Dallas"></div></div>' +
      '<div class="field"><label for="cl-wa">Seu WhatsApp (com código do país)</label><input id="cl-wa" inputmode="tel" required placeholder="+1 214 555 0100"></div>' +
      '<p class="small muted">' + (preco ? "Valor: " + G.usd(preco) + " por " + dias + " dias." + (lk ? " Ao publicar, abrimos a página de pagamento." : " A equipe envia a cobrança pelo WhatsApp informado.") : "Incluído no seu plano de anunciante. Fica " + dias + " dias no ar.") + '</p><div class="row"><button class="btn" type="submit">Publicar</button><button class="btn ghost" type="button" data-fecha>Cancelar</button></div></form>';
    dlg.showModal();
    dlg.querySelector("[data-fecha]").onclick = function () { dlg.close(); };
    dlg.querySelector("#f-cl").onsubmit = function (e) {
      e.preventDefault();
      var v = function (id) { return dlg.querySelector("#" + id).value.trim(); }, p = Number(v("cl-preco").replace(",", "."));
      if (v("cl-wa").replace(/\D/g, "").length < 10) { G.toast("Informe um WhatsApp válido, com código do país e DDD."); return; }
      var doc = { tipo: v("cl-tipo"), titulo: v("cl-tit"), texto: v("cl-txt"), preco: isFinite(p) && p > 0 ? p : null, cidade: v("cl-cid"), whatsapp: v("cl-wa"), criadoEm: new Date().toISOString(), expira: addDias(hoje(), dias), pago: preco ? (lk ? "link" : "teste") : "gratis", valor: preco, publicado: true };
      var cid = Store.idProprio(Store.novoId("cl"));
      Store.gravar("classificados", cid, doc).then(function () {
        try { var mm = JSON.parse(localStorage.getItem("meus-classificados") || "[]"); mm.push(cid); localStorage.setItem("meus-classificados", JSON.stringify(mm)); } catch (er) { /* ok */ }
        dlg.close(); G.toast("Anúncio publicado no mural."); if (preco && lk) window.open(lk, "_blank", "noopener");
        Store.gravar("avisos", Store.novoId("av"), { tipo: "classificado", nome: doc.titulo, valor: preco, criadoEm: doc.criadoEm, lido: false }).catch(function () {});
        viewMural();
      }).catch(function (er) { G.toast(er && er.message && !er.code ? er.message : "Não deu para publicar agora."); });
    };
  }

  /* ---------- roteiro com IA ---------- */
  var IA = { tempo: "tarde", verba: 60, criancas: false, gostos: [], resultado: null, carregando: false };
  var GOSTOS = [["museu", "Museus e arte"], ["natureza", "Parques e natureza"], ["brasil", "Comida brasileira"], ["bbq", "BBQ e Tex-Mex"], ["compras", "Compras"], ["historia", "História e cowboys"], ["noite", "Bares e shows"]];
  function candidatos() {
    var ls = G.lugares().filter(function (l) { return l.categoria !== "evento" || (l.dataInicio && l.dataInicio <= addDias(hoje(), 3) && (!l.dataFim || l.dataFim >= hoje())); })
      .filter(function (l) { return ["governo", "transporte", "saude", "servico", "comunidade"].indexOf(l.categoria) < 0 && G.SERVICOS.indexOf(l.categoria) < 0 && l.categoria !== "hotel"; });
    var km = function (l) { var k = G.kmDe(l); return k == null ? 999 : k; };
    return ls.filter(function (l) { return km(l) < 60; }).sort(function (a, b) { return km(a) - km(b); }).slice(0, 90);
  }
  function precoDe(l) { return l.gratuito ? 0 : Number(l.precoMin) || (l.faixaPreco ? 15 * String(l.faixaPreco).length : 0); }
  function local(cands) {
    /* Sem IA disponível: escolhe por gosto, proximidade e orçamento. */
    var mapa = { museu: ["museu", "arte"], natureza: ["parque", "natureza", "mirante"], brasil: ["restaurante-brasileiro", "churrascaria", "padaria", "acai-cafe", "mercado-brasileiro"], bbq: ["bbq", "tex-mex", "steakhouse", "comida-sulista"], compras: ["compras", "mercado"], historia: ["historico", "bairro"], noite: ["bar", "show"] };
    var quer = IA.gostos.length ? IA.gostos : ["museu", "natureza", "brasil"], n = IA.tempo === "dia" ? 5 : 3, soma = 0, out = [];
    quer.forEach(function (g) { (mapa[g] || []).forEach(function (cat) { var x = cands.filter(function (l) { return l.categoria === cat && out.indexOf(l) < 0; })[0]; if (x && out.length < n && soma + precoDe(x) <= IA.verba) { out.push(x); soma += precoDe(x); } }); });
    cands.filter(function (l) { return l.gratuito; }).forEach(function (l) { if (out.length < n && out.indexOf(l) < 0) out.push(l); });
    return { titulo: "Seu roteiro", resumo: "Montado pelo guia com base nos seus gostos, na distância e no orçamento.", paradas: out.map(function (l) { return { id: l.id, dica: l.dica || "" }; }) };
  }
  function pedeIA() {
    var cands = candidatos(); IA.carregando = true; viewIA();
    var lista = cands.map(function (l) { return { id: l.id, nome: l.nome, categoria: G.CATS[l.categoria] || l.categoria, regiao: G.regiao(l), precoUS: precoDe(l), gratis: !!l.gratuito, km: Math.round((G.kmDe(l) || 0) * 10) / 10, criancas: l.categoria === "familia" }; });
    var pedido = "Você monta roteiros para brasileiros em Dallas-Fort Worth. Escolha de 3 a 6 lugares SÓ desta lista (use os ids exatos), em ordem lógica de deslocamento, respeitando: tempo disponível = " + ({ manha: "uma manhã (4h)", tarde: "uma tarde (5h)", dia: "o dia todo (10h)", noite: "uma noite (4h)" })[IA.tempo] + "; orçamento total por pessoa = US$ " + IA.verba + (IA.criancas ? "; com crianças" : "") + "; gostos = " + (IA.gostos.map(function (g) { return GOSTOS.filter(function (x) { return x[0] === g; })[0][1]; }).join(", ") || "variado") + "; partindo de " + G.Geo.nome + ". Inclua uma refeição se o tempo passar de 4h. Responda em português do Brasil, JSON puro no formato {\"titulo\":\"...\",\"resumo\":\"1 frase\",\"paradas\":[{\"id\":\"...\",\"hora\":\"14h\",\"dica\":\"1 frase prática\"}],\"custoEstimado\":0}. Lista: " + JSON.stringify(lista);
    var feito = function (r) { IA.carregando = false; IA.resultado = r; if (location.hash === "#roteiro-ia") viewIA(); };
    (window.claude && window.claude.use ? window.claude.use("sample") : Promise.resolve(null)).then(function (s) {
      if (!s || !s.json) return feito(local(cands));
      return s.json(pedido, { modelTier: "quick" }).then(function (r) {
        var ok = r && Array.isArray(r.paradas) ? r.paradas.filter(function (p) { return p && lugar(p.id); }) : [];
        if (!ok.length) return feito(local(cands));
        r.paradas = ok; r.ia = true; feito(r);
      });
    }).catch(function () { feito(local(cands)); });
  }
  function viewIA() {
    var r = IA.resultado, paradas = r ? r.paradas.map(function (p) { return { p: p, l: lugar(p.id) }; }).filter(function (x) { return x.l; }) : [];
    var rota = paradas.length ? "https://www.google.com/maps/dir/" + [G.Geo.lat + "," + G.Geo.lng].concat(paradas.map(function (x) { return x.l.lat != null ? x.l.lat + "," + x.l.lng : encodeURIComponent(x.l.endereco || x.l.nome); })).join("/") : "";
    G.app.innerHTML = '<section class="block"><div class="wrap stack" style="gap:16px;max-width:820px"><div><p class="eyebrow">' + ic("sparkle") + ' Roteiro com IA</p><h1 class="page-h">Monte o seu dia</h1><p class="muted">Diga quanto tempo e quanto quer gastar. O guia escolhe entre os lugares cadastrados, saindo de <b>' + esc(G.Geo.nome) + "</b>.</p></div>" +
      '<form class="panel stack" id="f-ia" style="gap:14px"><div class="field"><span>Quanto tempo</span><div class="chips">' + [["manha", "Manhã"], ["tarde", "Tarde"], ["dia", "Dia todo"], ["noite", "Noite"]].map(function (t) { return '<button type="button" class="chip" data-t="' + t[0] + '" aria-pressed="' + (IA.tempo === t[0]) + '">' + t[1] + "</button>"; }).join("") + "</div></div>" +
      '<div class="field"><label for="ia-verba">Orçamento por pessoa: <b id="ia-v">US$ ' + IA.verba + '</b></label><input type="range" id="ia-verba" min="0" max="300" step="10" value="' + IA.verba + '"></div>' +
      '<div class="field"><span>Do que você gosta</span><div class="chips">' + GOSTOS.map(function (g) { return '<button type="button" class="chip" data-g="' + g[0] + '" aria-pressed="' + (IA.gostos.indexOf(g[0]) >= 0) + '">' + g[1] + "</button>"; }).join("") + "</div></div>" +
      '<label class="check"><input type="checkbox" id="ia-kids"' + (IA.criancas ? " checked" : "") + "> Vou com crianças</label>" +
      '<div class="row"><button class="btn" type="submit"' + (IA.carregando ? " disabled" : "") + ">" + ic("sparkle") + (IA.carregando ? " Montando…" : " Montar roteiro") + '</button><button type="button" class="btn ghost" data-partida>Mudar ponto de partida</button></div></form>' +
      (paradas.length ? '<div class="panel stack" style="gap:12px"><div><h3>' + esc(r.titulo || "Seu roteiro") + '</h3><p class="muted small">' + esc(r.resumo || "") + (r.custoEstimado ? " Custo estimado: " + G.usd(r.custoEstimado) + "." : "") + '</p></div><ol class="roteiro">' + paradas.map(function (x) { return "<li>" + G.linha(x.l) + (x.p.hora || x.p.dica ? '<p class="small muted">' + esc((x.p.hora ? x.p.hora + " · " : "") + (x.p.dica || "")) + "</p>" : "") + "</li>"; }).join("") + '</ol><div class="row">' + (window.Jornada ? Jornada.botaoQuero(r.titulo || "Meu roteiro", paradas.map(function (x) { return x.l.id; }), "ia") : "") + '<a class="btn ghost" href="' + esc(rota) + '" target="_blank" rel="noopener">' + ic("pin") + ' Abrir rota no Maps</a><button type="button" class="btn ghost" data-salva-ia>Salvar na minha lista</button></div></div>' : "") +
      "</div></section>";
    var f = $("#f-ia");
    f.onclick = function (e) {
      var t = e.target.closest("[data-t]"); if (t) { IA.tempo = t.dataset.t; Array.from(f.querySelectorAll("[data-t]")).forEach(function (b) { b.setAttribute("aria-pressed", b === t); }); }
      var g = e.target.closest("[data-g]"); if (g) { var i = IA.gostos.indexOf(g.dataset.g); if (i >= 0) IA.gostos.splice(i, 1); else IA.gostos.push(g.dataset.g); g.setAttribute("aria-pressed", i < 0); }
    };
    $("#ia-verba").oninput = function () { IA.verba = Number(this.value); $("#ia-v").textContent = "US$ " + IA.verba; };
    $("#ia-kids").onchange = function () { IA.criancas = this.checked; };
    f.onsubmit = function (e) { e.preventDefault(); if (!IA.carregando) pedeIA(); };
    var sv = $("[data-salva-ia]"); if (sv) sv.onclick = function () { var m = []; try { m = JSON.parse(localStorage.getItem("lista") || "[]"); } catch (er) { m = []; } paradas.forEach(function (x) { if (m.indexOf(x.l.id) < 0) m.push(x.l.id); }); try { localStorage.setItem("lista", JSON.stringify(m)); } catch (er) { /* ok */ } G.toast("Paradas salvas na sua lista."); };
  }

  /* ---------- custo de vida ---------- */
  function dadosCusto() { var d = Store.obter("config", "custo"); return d && Array.isArray(d.cidades) && d.cidades.length ? d : (window.CUSTO_VIDA || null); }
  var ordCusto = "aluguel1q";
  function viewCusto() {
    var d = dadosCusto();
    if (!d) { G.app.innerHTML = '<section class="block"><div class="wrap"><h1 class="page-h">Custo de vida</h1><p class="muted">Os dados ainda estão sendo carregados.</p></div></section>'; return; }
    var cs = d.cidades.slice().sort(function (a, b) { var x = a[ordCusto], y = b[ordCusto]; if (typeof x === "number" && typeof y === "number") return x - y; return String(x || "zz").localeCompare(String(y || "zz")); });
    var g = d.geral || {};
    G.app.innerHTML = '<section class="block"><div class="wrap stack" style="gap:16px"><div><p class="eyebrow">Para quem vai morar</p><h1 class="page-h">Custo de vida por cidade</h1><p class="muted" style="max-width:62ch">Aluguel médio, distrito escolar, nota oficial das escolas (TEA) e imposto sobre imóveis. Valores de referência' + (d.atualizadoEm ? " (" + esc(d.atualizadoEm) + ")" : "") + '; confirme antes de fechar contrato.</p></div>' +
      '<div class="kpis">' + [["Imposto sobre vendas", g.impostoVendas], ["Conta de luz", g.energia], ["Seguro do carro", g.seguroCarro]].filter(function (x) { return x[1]; }).map(function (x) { return '<div class="kpi"><b class="num" style="font-size:1.05rem">' + esc(x[1]) + "</b><span>" + x[0] + "</span></div>"; }).join("") + "</div>" +
      '<div class="selrow"><div class="field"><label for="cv-ord">Ordenar por</label><select id="cv-ord">' + [["aluguel1q", "Aluguel de 1 quarto"], ["aluguel2q", "Aluguel de 2 quartos"], ["notaTEA", "Nota das escolas"], ["cidade", "Nome"]].map(function (o) { return '<option value="' + o[0] + '"' + (o[0] === ordCusto ? " selected" : "") + ">" + o[1] + "</option>"; }).join("") + "</select></div></div>" +
      '<div class="cvgrid">' + cs.map(function (c) {
        return '<article class="panel cv"><h3>' + esc(c.cidade) + '</h3><p class="small muted">' + esc(c.perfil || "") + '</p><dl class="kv"><dt>1 quarto</dt><dd class="num">' + (c.aluguel1q ? G.usd(c.aluguel1q) + "/mês" + G.brl(c.aluguel1q) : "–") + '</dd><dt>2 quartos</dt><dd class="num">' + (c.aluguel2q ? G.usd(c.aluguel2q) + "/mês" : "–") + "</dd><dt>Escolas</dt><dd>" + esc(c.isd || "–") + (c.notaTEA ? ' <span class="pill ok">' + esc(String(c.notaTEA).replace(/^([A-F]) \((\d{4}).*$/, "$1 ($2)")) + "</span>" : "") + "</dd><dt>Imposto do imóvel</dt><dd>" + esc(c.impostoPropriedade || "–") + "</dd></dl>" + (c.fonteAluguel ? '<p class="small muted">Aluguel: ' + esc(c.fonteAluguel) + "</p>" : "") + "</article>";
      }).join("") + "</div>" +
      ((d.fontes || []).length ? '<p class="note">Fontes: ' + d.fontes.map(function (u) { var v = G.url(u); return v ? '<a href="' + esc(v) + '" target="_blank" rel="noopener">' + esc(v.replace(/^https?:\/\/(www\.)?/, "").split("/")[0]) + "</a>" : ""; }).filter(Boolean).join(" · ") + "</p>" : "") +
      '<a class="btn ghost" href="#chegada">Guia de chegada, passo a passo</a></div></section>';
    $("#cv-ord").onchange = function () { ordCusto = this.value; viewCusto(); };
  }

  /* ---------- outras cidades ---------- */
  var CIDADES = [["Houston", "Maior comunidade brasileira do Texas"], ["Austin", "Capital, tecnologia e música"], ["San Antonio", "Riverwalk e as missões espanholas"]];
  function viewCidades() {
    var meu = Store.obter("interesse", Store.idProprio("cidades")) || {}, sel = meu.cidades || [];
    G.app.innerHTML = '<section class="block"><div class="wrap stack" style="gap:16px;max-width:760px"><div><p class="eyebrow">Expansão</p><h1 class="page-h">Próximas cidades</h1><p class="muted">Dallas é a cidade piloto. Marque onde você quer o guia e avisamos quando abrir.</p></div>' +
      '<div class="cityrow big">' + CIDADES.map(function (k) { var on = sel.indexOf(k[0]) >= 0; return '<button type="button" class="city" data-cid="' + esc(k[0]) + '" aria-pressed="' + on + '"><b>' + esc(k[0]) + "</b><small>" + esc(k[1]) + '</small><span class="pill ' + (on ? "ok" : "") + '">' + (on ? "Vou ser avisado" : "Avise-me") + "</span></button>"; }).join("") + "</div>" +
      '<p class="note">Quer ser parceiro em uma dessas cidades? Fale com a equipe pelo <a href="#anuncie">Anuncie</a>.</p></div></section>';
    G.app.querySelector(".cityrow").onclick = function (e) {
      var b = e.target.closest("[data-cid]"); if (!b) return; var c = b.dataset.cid, i = sel.indexOf(c); if (i >= 0) sel.splice(i, 1); else sel.push(c);
      Store.gravar("interesse", Store.idProprio("cidades"), { cidades: sel, criadoEm: new Date().toISOString() }).then(function () { G.toast(i >= 0 ? "Aviso removido." : "Pronto. Avisamos quando " + c + " abrir."); viewCidades(); }).catch(function (er) { G.toast(er && er.message && !er.code ? er.message : "Não deu para salvar agora."); });
    };
  }

  /* ---------- instalar no celular ---------- */
  var promptInstalar = null;
  window.addEventListener("beforeinstallprompt", function (e) { e.preventDefault(); promptInstalar = e; });
  function viewInstalar() {
    var ios = /iphone|ipad|ipod/i.test(navigator.userAgent);
    G.app.innerHTML = '<section class="block"><div class="wrap stack" style="gap:16px;max-width:720px"><div><p class="eyebrow">Atalho</p><h1 class="page-h">Guia na tela do celular</h1><p class="muted">Abre direto, como um aplicativo, sem baixar nada da loja.</p></div>' +
      (promptInstalar ? '<button type="button" class="btn" data-instala>Instalar agora</button>' : "") +
      '<div class="panel stack"' + (ios ? "" : ' style="order:2"') + '><h3>iPhone (Safari)</h3><ol class="passos"><li>Toque no botão Compartilhar (quadrado com seta para cima).</li><li>Role e toque em <b>Adicionar à Tela de Início</b>.</li><li>Confirme em <b>Adicionar</b>.</li></ol></div>' +
      '<div class="panel stack"><h3>Android (Chrome)</h3><ol class="passos"><li>Toque nos três pontinhos no canto de cima.</li><li>Toque em <b>Instalar app</b> ou <b>Adicionar à tela inicial</b>.</li><li>Confirme.</li></ol></div>' +
      '<div class="panel stack"><h3>Computador</h3><p class="muted">No Chrome ou no Edge, clique no ícone de instalar na barra de endereço, ou adicione o guia aos favoritos.</p></div></div></section>';
    var b = $("[data-instala]"); if (b) b.onclick = function () { promptInstalar.prompt(); promptInstalar = null; };
  }

  /* ---------- cupom com QR Code ---------- */
  function codigo(l) {
    var base = (Store.uid() || G.loc("vk") || "anon") + "|" + l.id, h = 0;
    for (var i = 0; i < base.length; i++) h = (h * 31 + base.charCodeAt(i)) >>> 0;
    return "CB" + h.toString(36).toUpperCase().slice(0, 5).padStart(5, "0");
  }
  function botaoCupom(l) { return '<button type="button" class="btn sm" data-cupom="' + esc(l.id) + '" style="margin-top:8px">' + ic("ticket") + " Gerar meu código</button>"; }
  document.addEventListener("click", function (e) {
    var b = e.target.closest("[data-cupom]"); if (!b) return;
    var l = lugar(b.dataset.cupom); if (!l) return; var cod = codigo(l), box = b.parentNode;
    var qr = ""; if (window.qrcode) { try { var q = window.qrcode(0, "M"); q.addData(cod); q.make(); qr = q.createSvgTag({ cellSize: 4, margin: 0, scalable: true }); } catch (er) { qr = ""; } }
    b.outerHTML = '<div class="cupom"><div class="qr">' + qr + '</div><div><small>Seu código</small><b class="num">' + cod + '</b><span class="small muted">O atendente confirma este código no painel dele.</span></div></div>';
    Store.gravar("cupons", Store.idProprio(l.id), { lugarId: l.id, codigo: cod, criadoEm: new Date().toISOString() }).catch(function () {});
    if (box && box.querySelector) { /* nada */ }
  });
  function validador(l) {
    var v = (l.validados || []);
    return '<div class="panel stack" style="gap:10px"><h3>Validar cupom</h3><p class="small muted">Quando o cliente mostrar o código do guia (começa com CB), digite aqui para confirmar e contar nas métricas.</p><form class="row" id="f-val"><input id="val-cod" placeholder="CBXXXXX" maxlength="8" style="max-width:160px;text-transform:uppercase" aria-label="Código do cupom"><button class="btn sm" type="submit">Validar</button></form><p class="small"><b class="num">' + v.length + "</b> cupons validados" + (v.length ? " · último em " + dataBR(v[v.length - 1].em) : "") + "</p></div>";
  }
  function validadorInit(l) {
    var f = $("#f-val"); if (!f) return;
    f.onsubmit = function (e) {
      e.preventDefault(); var cod = $("#val-cod").value.trim().toUpperCase(); if (!/^(CB|GT)[0-9A-Z]{5}$/.test(cod)) { G.toast("Código inválido."); return; }
      if ((l.validados || []).some(function (x) { return x.codigo === cod; })) { G.toast("Este código já foi usado."); return; }
      Store.consultar("cupons", "codigo", cod).then(function (cs) {
        var ok = cs.filter(function (c) { return c.lugarId === l.id; })[0];
        if (!ok) { G.toast("Código não encontrado para este anúncio."); return; }
        l.validados = (l.validados || []).concat([{ codigo: cod, em: hoje() }]).slice(-500);
        return Store.gravar("lugares", l.id, l).then(function () { G.toast("Cupom válido. Pode aplicar o desconto."); if (G.views.anunciante) G.views.anunciante(); });
      }).catch(function () { G.toast("Não deu para validar agora."); });
    };
  }

  G.views.mural = viewMural; G.views["roteiro-ia"] = viewIA; G.views.custo = viewCusto; G.views.cidades = viewCidades; G.views.instalar = viewInstalar;
  window.Comunidade = { secoes: secoes, botaoCupom: botaoCupom, validador: validador, validadorInit: validadorInit, TIPOS_AL: TIPOS_AL, TIPOS_CL: TIPOS_CL, classificadosAtivos: classificadosAtivos, alertasAtivos: alertasAtivos, CIDADES: CIDADES, viewMural: viewMural };
})();
