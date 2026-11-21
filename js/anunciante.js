/* Setor do anunciante: painel (anúncios, plano, contratar pacotes, depoimentos, divulgação) e editor do anúncio.
   Preço em reais por pacote (R$ 50 = 3 anúncios por 1 mês; pacotes somam). Quem decide o que fica no ar é Pag.visivel (pagamento.js):
   os N anúncios mais antigos da conta, sendo N as vagas dos pacotes em vigor. Sem pagamento, os anúncios ficam em prévia. */
(function () {
  "use strict";
  var G = window.Guia, esc = G.esc, $ = function (s, r) { return (r || document).querySelector(s); };
  var D = null, ocupado = false, removidas = [];
  var CATEG = G.SERVICOS.concat(G.COMIDA, ["mercado-brasileiro", "mercado", "compras"]);
  function catOpcoes(sel) {
    var usados = {}, h = (G.CAT_GRUPOS || []).map(function (g) {
      var ks = g[1].filter(function (k) { return G.CATS[k] && CATEG.indexOf(k) >= 0; }); ks.forEach(function (k) { usados[k] = 1; });
      return ks.length ? '<optgroup label="' + esc(g[0]) + '">' + ks.map(function (k) { return '<option value="' + k + '"' + (k === sel ? " selected" : "") + ">" + esc(G.CATS[k]) + "</option>"; }).join("") + "</optgroup>" : "";
    }).join("");
    var resto = CATEG.filter(function (k) { return !usados[k]; });
    return h + (resto.length ? '<optgroup label="Mais">' + resto.map(function (k) { return '<option value="' + k + '"' + (k === sel ? " selected" : "") + ">" + esc(G.CATS[k] || k) + "</option>"; }).join("") + "</optgroup>" : "");
  }
  function catBusca(q) {
    var n = G.norm || function (s) { return String(s || "").toLowerCase(); }, termos = n(q).split(/\s+/).filter(Boolean); if (!termos.length) return [];
    var grupoDe = {}, pos = {}, c = 0; (G.CAT_GRUPOS || []).forEach(function (g) { g[1].forEach(function (k) { grupoDe[k] = g[0]; pos[k] = c++; }); });
    return CATEG.map(function (k) {
      var nome = n(G.CATS[k] || k), extra = n(k.replace(/-/g, " ") + " " + ((G.CAT_SIN || {})[k] || "") + " " + (grupoDe[k] || "")), pts = 0;
      for (var i = 0; i < termos.length; i++) { var w = termos[i]; if (nome.indexOf(w) === 0) pts += 6; else if (nome.indexOf(w) >= 0) pts += 4; else if (extra.indexOf(w) >= 0) pts += 2; else return null; }
      return { k: k, pts: pts, g: grupoDe[k] || "" };
    }).filter(Boolean).sort(function (a, b) { return b.pts - a.pts || (pos[a.k] == null ? 999 : pos[a.k]) - (pos[b.k] == null ? 999 : pos[b.k]); }).slice(0, 8);
  }
  var MAX_FOTOS = 20, LIMITE = 3;
  var CIDADES_DFW = [["Dallas", 32.7767, -96.797], ["Fort Worth", 32.7555, -97.3308], ["Plano", 33.0198, -96.6989], ["Frisco", 33.1507, -96.8236], ["McKinney", 33.1972, -96.6398], ["Allen", 33.1032, -96.6706], ["Irving", 32.814, -96.9489], ["Carrollton", 32.9756, -96.89], ["Richardson", 32.9483, -96.7299], ["Garland", 32.9126, -96.6389], ["Arlington", 32.7357, -97.1081], ["Grand Prairie", 32.746, -96.9978], ["Grapevine", 32.9343, -97.0781], ["Euless", 32.8371, -97.082], ["Bedford", 32.844, -97.1431], ["Hurst", 32.8235, -97.1706], ["Lewisville", 33.0462, -96.9942], ["Denton", 33.2148, -97.1331], ["Addison", 32.9618, -96.8292], ["Coppell", 32.9546, -97.015], ["Southlake", 32.9412, -97.1342], ["The Colony", 33.0807, -96.8928], ["Mesquite", 32.7668, -96.5992], ["Rockwall", 32.9312, -96.4597]];
  /* cidades de cada região do guia: [nome, lat, lng, regiaoGuia] */
  var CIDADES = CIDADES_DFW.map(function (c) { return c.concat("dfw"); }).concat([
    ["Houston", 29.7604, -95.3698, "houston"], ["Sugar Land", 29.6197, -95.6349, "houston"], ["Katy", 29.7858, -95.8245, "houston"], ["The Woodlands", 30.1658, -95.4613, "houston"], ["Pearland", 29.5636, -95.286, "houston"], ["Spring", 30.0799, -95.4172, "houston"], ["Cypress", 29.9691, -95.6972, "houston"], ["Pasadena", 29.6911, -95.2091, "houston"], ["League City", 29.5075, -95.0949, "houston"], ["Galveston", 29.3013, -94.7977, "houston"], ["Conroe", 30.3119, -95.456, "houston"], ["Missouri City", 29.6186, -95.5377, "houston"],
    ["Austin", 30.2672, -97.7431, "austin"], ["Round Rock", 30.5083, -97.6789, "austin"], ["Cedar Park", 30.5052, -97.8203, "austin"], ["Pflugerville", 30.4394, -97.62, "austin"], ["Georgetown", 30.6333, -97.6779, "austin"], ["Leander", 30.5788, -97.8531, "austin"], ["Kyle", 29.9891, -97.8772, "austin"], ["Buda", 30.0852, -97.8403, "austin"], ["San Marcos", 29.8833, -97.9414, "austin"], ["Lakeway", 30.3633, -97.9795, "austin"],
    ["San Antonio", 29.4241, -98.4936, "sanantonio"], ["New Braunfels", 29.703, -98.1245, "sanantonio"], ["Boerne", 29.7947, -98.732, "sanantonio"], ["Schertz", 29.5522, -98.2697, "sanantonio"], ["Seguin", 29.5688, -97.9647, "sanantonio"], ["Converse", 29.518, -98.316, "sanantonio"], ["Helotes", 29.5786, -98.6897, "sanantonio"], ["Universal City", 29.548, -98.2911, "sanantonio"]
  ]);
  CIDADES = CIDADES.concat([["Anália Franco", -23.5615, -46.5602, "spzl", "São Paulo"], ["Tatuapé", -23.5403, -46.5766, "spzl", "São Paulo"], ["Mooca", -23.559, -46.599, "spzl", "São Paulo"], ["Vila Formosa", -23.566, -46.546, "spzl", "São Paulo"], ["Carrão", -23.551, -46.539, "spzl", "São Paulo"], ["Belém", -23.5343, -46.5888, "spzl", "São Paulo"], ["Vila Prudente", -23.5936, -46.5856, "spzl", "São Paulo"], ["Aricanduva", -23.566, -46.504, "spzl", "São Paulo"], ["Penha", -23.525, -46.544, "spzl", "São Paulo"], ["Vila Matilde", -23.536, -46.53, "spzl", "São Paulo"], ["Itaquera", -23.5408, -46.4705, "spzl", "São Paulo"], ["São Miguel Paulista", -23.4983, -46.4447, "spzl", "São Paulo"]]);
  var NOME_REG = { dfw: "Dallas–Fort Worth", houston: "Região de Houston", austin: "Região de Austin", sanantonio: "Região de San Antonio", spzl: "São Paulo · Zona Leste (bairros)" };

  /* "Onde anunciar": país (bandeira) → estado › região › cidade/bairro. Mexe no select #n-reg (escondido), que o resto do editor já usa. */
  var BAND = { BR: "🇧🇷", US: "🇺🇸" };
  function regsVisiveis(D) { return Object.keys(NOME_REG).filter(function (rg) { return rg === D.regiaoGuia || !G.regiaoVisivel || G.regiaoVisivel(rg); }); }
  function paisDe(rg) { return (((G.CIDADES_GUIA || {})[rg] || {}).pais) || (rg === "spzl" ? "BR" : "US"); }
  function ondeHtml(D) {
    var rgs = regsVisiveis(D), paises = []; rgs.forEach(function (rg) { var p = paisDe(rg); if (paises.indexOf(p) < 0) paises.push(p); });
    return '<div class="on-ps">' + paises.map(function (p) { var nome = p === "BR" ? "Brasil" : "Estados Unidos"; return '<button type="button" class="on-p" data-on-pais="' + p + '"><span>' + BAND[p] + "</span><b>" + nome + "</b><small>" + (p === "BR" ? "São Paulo" : "Texas") + "</small></button>"; }).join("") + "</div>" +
      paises.map(function (p) {
        var meus = rgs.filter(function (rg) { return paisDe(rg) === p; });
        return '<div class="on-box" data-on-box="' + p + '" hidden><p class="on-est">' + (p === "BR" ? "Estado de São Paulo (SP)" : "Texas (TX)") + "</p>" + meus.map(function (rg) {
          return '<div class="on-reg"><b>' + esc(NOME_REG[rg].replace(" (bairros)", "")) + '</b><div class="on-cs">' + CIDADES.filter(function (c) { return c[3] === rg; }).map(function (c) { return '<button type="button" class="on-c" data-on-c="' + esc(c[0]) + '">' + esc(c[0]) + "</button>"; }).join("") + "</div></div>";
        }).join("") + '<p class="on-av">' + (p === "BR" ? "Seu anúncio aparece só para quem está vendo <b>São Paulo (SP)</b> no guia, em reais." : "Seu anúncio aparece só para quem está vendo a região escolhida no <b>Texas</b>, em dólar.") + "</p></div>";
      }).join("") + '<p class="on-res" data-on-res></p>';
  }
  function ondeLiga(f) {
    var sel = f.querySelector("#n-reg"); if (!sel || !f.querySelector(".on-ps")) return;
    var pinta = function (paisForcado) {
      var c = CIDADES.filter(function (x) { return x[0] === sel.value; })[0], rg = c ? c[3] : "dfw", p = paisForcado || paisDe(rg);
      f.querySelectorAll("[data-on-pais]").forEach(function (b) { b.classList.toggle("on", b.dataset.onPais === p); });
      f.querySelectorAll("[data-on-box]").forEach(function (b) { b.hidden = b.dataset.onBox !== p; });
      f.querySelectorAll("[data-on-c]").forEach(function (b) { b.classList.toggle("on", b.dataset.onC === sel.value && paisDe(rg) === p); });
      var r = f.querySelector("[data-on-res]"); if (r) r.innerHTML = c && paisDe(rg) === p ? "📍 Anunciar em: <b>" + esc(c[4] ? (c[4] + " › " + c[0]) : (NOME_REG[rg] + " › " + c[0])) + "</b>" : "Escolha a cidade ou o bairro.";
    };
    f.addEventListener("click", function (e) {
      var pb = e.target.closest("[data-on-pais]"); if (pb) { var c = CIDADES.filter(function (x) { return x[0] === sel.value; })[0]; if (!c || paisDe(c[3]) !== pb.dataset.onPais) { var pri = CIDADES.filter(function (x) { return paisDe(x[3]) === pb.dataset.onPais && regsVisiveis({}).indexOf(x[3]) >= 0; })[0]; if (pri) { sel.value = pri[0]; sel.dispatchEvent(new Event("change", { bubbles: true })); } } pinta(pb.dataset.onPais); return; }
      var cb = e.target.closest("[data-on-c]"); if (cb) { sel.value = cb.dataset.onC; sel.dispatchEvent(new Event("change", { bubbles: true })); pinta(); }
    });
    sel.addEventListener("change", function () { pinta(); });
    pinta();
  }
  function meusIds() { try { return JSON.parse(localStorage.getItem("meus-anuncios") || "[]"); } catch (e) { return []; } }
  function guardaMeu(id) { var m = meusIds(); if (m.indexOf(id) < 0) m.push(id); try { localStorage.setItem("meus-anuncios", JSON.stringify(m)); } catch (e) { /* ok */ } }
  function meusLugares() { return lugaresDe(Store.uid()); }
  /* Dono de verdade: só o que o servidor guarda no anúncio (documento da conta, donoUid ou o id que começa com o uid).
     A memória do aparelho ("meus-anuncios") só vale no modo sem servidor e sem conta, para não mostrar anúncios de outra conta
     que usou o mesmo celular ou computador. */
  function donoDe(l) { return (l && (l._dono || l.donoUid || (String(l.id).indexOf("~") > 0 ? String(l.id).split("~")[0] : ""))) || ""; }
  function ehMeu(l) { if (!l) return false; var u = Store.uid(); if (Store.admin && Store.admin()) return true; if (u) return donoDe(l) === u; return !(Store.servidor && Store.servidor()) && meusIds().indexOf(l.id) >= 0; }
  function lugaresDe(uid) {
    var local = !uid && !(Store.servidor && Store.servidor()), ids = local ? meusIds() : [];
    return Store.lista("lugares").filter(function (l) { return (uid && donoDe(l) === uid) || (local && l.assinatura && ids.indexOf(l.id) >= 0); })
      .sort(function (a, b) { return String(a.criadoEm || a.id) < String(b.criadoEm || b.id) ? -1 : 1; });
  }
  function dono(l) { return donoDe(l) || Store.uid(); }
  /* a mesma foto pode estar no original e na cópia: o arquivo só é apagado quando nenhum outro lugar usa */
  function fotoEmUso(src, excetoId) { return Store.lista("lugares").some(function (l) { return l.id !== excetoId && ((l.fotos || []).some(function (f) { return f && f.src === src; }) || (l.banner && l.banner.src === src)); }); }
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
  /* Duplicar: novo anúncio com tudo do original (fotos, contatos, redes, horário, cardápio, cupom, endereço);
     ficam de fora o que é só do original: estatísticas, avaliações e fotos do Google, selo/destaque pagos e o banner se não houver vaga. */
  var SO_DO_ORIGINAL = ["id", "_dono", "donoUid", "criadoEm", "assinatura", "googlePlaceId", "notaExterna", "avaliacoesExternas", "fotosGoogle", "horarioFonte", "fechadoGoogle", "fechadoIA", "iaConferidoEm",
    "destaque", "destaqueAte", "impulso", "impulsoAte", "verificado", "verificadoEm", "selo", "visualizacoes", "metricas", "publicado", "pausadoEm"];
  var dupInfo = null;
  function copiaDe(src) {
    var c = JSON.parse(JSON.stringify(src)); SO_DO_ORIGINAL.forEach(function (k) { delete c[k]; });
    var avisoBanner = false; if (c.banner && c.banner.src && bannersLivres(null) <= 0) { delete c.banner; avisoBanner = true; }
    dupInfo = { de: src.id, nome: src.nome, cep: src.cep || "", lat: src.lat, lng: src.lng, aprox: !!src.coordsAprox, semBanner: avisoBanner };
    return c;
  }
  function viewAnunciar(id, dupId) {
    var existente = id ? Store.obter("lugares", id) : null;
    if (existente && !ehMeu(existente)) { G.toast("Esse anúncio não é da sua conta."); location.replace("#conta"); return; }
    var origem = !existente && dupId ? Store.obter("lugares", dupId) : null;
    if (origem && !ehMeu(origem)) { G.toast("Esse anúncio não é da sua conta."); location.replace("#conta"); return; }
    dupInfo = null;
    if (!existente && meusLugares().length >= maximo()) {
      G.app.innerHTML = '<section class="block"><div class="wrap narrow stack" style="text-align:center;justify-items:center;padding-block:30px"><h1 class="page-h">Você usou todos os seus anúncios</h1><p class="muted">Seu plano libera ' + maximo() + ' anúncios. Cada pacote de ' + G.reais(window.Pag ? Pag.preco() : 50) + " soma mais " + (window.Pag ? Pag.porPacote() : 3) + ' anúncios.</p><a class="btn" href="#pagar">Contratar mais anúncios</a><a class="more" href="#anunciante">Voltar ao painel</a></div></section>';
      return;
    }
    D = existente ? JSON.parse(JSON.stringify(existente)) : origem ? copiaDe(origem) : { id: "", tipo: "estabelecimento", nome: "", categoria: "", brasileiro: true, cidade: G.cid ? G.cid().principal : "Dallas", fotos: [], menu: [] };
    D.fotos = D.fotos || []; removidas = [];
    var podeBanner = (D.banner && D.banner.src) || bannersLivres(existente && existente.id) > 0, n = 0, prox = function () { return ++n; };
    var corpo =
      sec(prox(), "onde", "Onde você vai anunciar?", "Escolha o país e depois a cidade ou o bairro. O anúncio aparece só para quem está vendo essa região do guia.", ondeHtml(D)) +
      sec(prox(), "empresa", "Sua empresa", "O que aparece no topo do anúncio.",
        '<div class="ae-g2">' + fld("n-nome", "Nome da empresa", D.nome, 'required maxlength="80" autocomplete="organization"') +
        '<div class="field cat-f"><label for="n-cat">Categoria</label><div class="cat-busca"><input type="search" id="n-cat-q" placeholder="Pesquisa rápida: babá, handyman, eletricista, piscina…" autocomplete="off" aria-label="Pesquisar categoria" aria-controls="n-cat-res"><div class="cat-res" id="n-cat-res" role="listbox" hidden></div></div>' +
          '<select id="n-cat" required>' + (D.categoria ? "" : '<option value="" selected disabled>Ou escolha na lista</option>') + catOpcoes(D.categoria) + "</select></div></div>" +
        '<div class="field"><label for="n-oferta">O que você oferece?</label><select id="n-oferta"' + (D.oferta ? ' data-manual="1"' : "") + ">" + Object.keys(G.PERFIS || {}).map(function (k) { return '<option value="' + k + '"' + ((G.perfilNegocio ? G.perfilNegocio(D) : "servico") === k ? " selected" : "") + ">" + esc(G.PERFIS[k].nome) + "</option>"; }).join("") + '</select><small class="muted">Escolhido pela categoria; troque se não combinar. Define como o preço e a lista de itens aparecem no anúncio (ex.: “produto” em vez de “prato principal”).</small></div>' +
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
        '<div class="ae-g2">' + fld("n-cep", "CEP (Brasil) ou ZIP code (EUA)", D.cep || "", 'data-cep placeholder="CEP (Brasil) ou ZIP (EUA)"', "Digite e o endereço aparece sozinho. Depois é só completar o número.") +
        fld("n-end", "Endereço", D.endereco, 'autocomplete="street-address" placeholder="Rua, número, bairro, cidade"') +
        '<div class="field" hidden><label for="n-reg">Cidade</label><select id="n-reg">' + Object.keys(NOME_REG).filter(function (rg) { return rg === D.regiaoGuia || !G.regiaoVisivel || G.regiaoVisivel(rg); }).map(function (rg) { var padrao = (D.bairro && CIDADES.some(function (p) { return p[4] && p[0] === D.bairro; }) ? D.bairro : CIDADES.some(function (p) { return p[0] === D.cidade; }) ? D.cidade : "") || (G.cid ? (G.cid().pais === "BR" ? "Anália Franco" : G.cid().principal) : "Dallas"); return '<optgroup label="' + NOME_REG[rg] + '">' + CIDADES.filter(function (p) { return p[3] === rg; }).map(function (p) { return "<option" + (p[0] === padrao ? " selected" : "") + ">" + esc(p[0]) + "</option>"; }).join("") + "</optgroup>"; }).join("") + "</select></div></div>" +
        '<div class="field"><span>Horário de atendimento</span>' + Horario.editor(D) + "</div>") +
      sec(prox(), "cardapio", '<span data-oferta-tit>Cardápio, catálogo e preços</span>', "Livreto com as páginas, tabela de preços ou o link do seu catálogo.",
        '<div class="ae-g2">' + fld("n-cat-link", "Link do catálogo, portfólio ou loja", D.catalogo, 'placeholder="https://"') + fld("n-cat-nome", "Nome do botão", D.catalogoNome, 'maxlength="24" placeholder="Catálogo"') + "</div>" +
        '<div class="ae-g2">' + fld("n-pmin", "Preço a partir de", D.precoMin, 'inputmode="decimal" placeholder="Ex.: 12"', "O menor valor. Aparece como \"a partir de\" no anúncio.") + fld("n-pmed", "Preço médio", D.precoMedio, 'inputmode="decimal" placeholder="Ex.: 25"', "Se você preencher a lista de itens com preços, o guia calcula sozinho.") + "</div>" + (window.Cardapio ? Cardapio.editor(D) : ""));
    var nav = ["empresa", "fotos", "banner", "contato", "endereco", "cardapio"], nomes = ["Empresa", "Fotos", "Banner", "Contato", "Endereço", "Cardápio"];
    var situ = existente ? (noArDe(existente) ? '<span class="pill ok">No ar</span>' : '<span class="pill warn">Prévia</span>') : '<span class="pill xp">Novo</span>';
    G.app.innerHTML = '<section class="block ae"><div class="wrap"><form id="f-an" novalidate>' +
      '<header class="ae-hd"><a class="more" href="#anunciante">← Meu negócio</a><div class="ae-ti"><h1 class="page-h">' + (existente ? "Editar anúncio" : dupInfo ? "Duplicar anúncio" : "Novo anúncio") + "</h1>" + situ + '</div>' + (dupInfo ? '<div class="ae-dup">' + Dash.ic("plus") + '<span><b>Cópia de “' + esc(dupInfo.nome) + '”.</b> Já vem com fotos, contatos, redes, horário, cardápio e cupom. Altere só o que for diferente (nome, endereço, CEP, horário…) e salve: o anúncio original continua igual.' + (dupInfo.semBanner ? " O banner não foi copiado porque seu plano não tem outra vaga de banner." : "") + "</span></div>" : "") + '<p class="muted">O que ficar vazio não aparece. Você pode editar quando quiser.</p>' +
      '<nav class="ae-nav" aria-label="Seções do anúncio">' + nav.map(function (s, i) { return '<a href="#ae-' + s + '" data-ae-ir="' + s + '"><b>' + (i + 1) + "</b>" + nomes[i] + "</a>"; }).join("") + "</nav></header>" +
      '<div class="ae-grid"><div class="ae-main">' + corpo + '</div><aside class="ae-side"><div class="ae-prev" id="ae-prev"></div><div class="ae-info">' +
      '<p><b>' + meusLugares().length + (existente ? "" : " + 1") + " de " + maximo() + "</b> anúncios da conta" + (vagas() ? " · " + vagas() + " liberados pelo plano" : " · em prévia até o pagamento") + '</p><a class="more" href="#pagar">Contratar mais anúncios</a></div></aside></div>' +
      '<div class="ae-bar"><span class="small muted" id="ae-st">' + (existente ? "Alterações não salvas aparecem aqui." : "Preencha nome, categoria e descrição para publicar.") + '</span><button class="btn" type="submit">' + (existente ? "Salvar alterações" : "Salvar anúncio") + "</button></div>" +
      "</form></div></section>";
    window.scrollTo(0, 0); preview();
    var f = $("#f-an");
    /* pesquisa rápida de categoria: mostra as profissões que combinam (nome, sinônimos em português e inglês) */
    function catMostra(q) {
      var box = $("#n-cat-res"); if (!box) return; var r = catBusca(q);
      if (!String(q || "").trim()) { box.hidden = true; box.innerHTML = ""; return; }
      box.hidden = false;
      box.innerHTML = r.length ? r.map(function (x, i) { return '<button type="button" role="option" data-cat-k="' + x.k + '"' + (i === 0 ? ' class="on"' : "") + "><b>" + esc(G.CATS[x.k]) + "</b><small>" + esc(x.g) + "</small></button>"; }).join("")
        : '<p class="small muted">Nada encontrado para “' + esc(q) + '”.</p><button type="button" role="option" data-cat-k="outros-servicos"><b>' + esc(G.CATS["outros-servicos"]) + "</b><small>Use e descreva o serviço no texto do anúncio</small></button>";
    }
    function catEscolhe(k) {
      var s = $("#n-cat"), q = $("#n-cat-q"), box = $("#n-cat-res"); if (!s || !k) return;
      s.value = k; s.dispatchEvent(new Event("change", { bubbles: true })); s.dispatchEvent(new Event("input", { bubbles: true }));
      if (q) q.value = ""; if (box) { box.hidden = true; box.innerHTML = ""; }
      s.classList.add("cat-ok"); setTimeout(function () { s.classList.remove("cat-ok"); }, 900);
    }
    f.addEventListener("click", function (e) { var b = e.target.closest("[data-cat-k]"); if (b) { e.preventDefault(); catEscolhe(b.dataset.catK); } });
    f.addEventListener("keydown", function (e) { if (e.target.id === "n-cat-q" && e.key === "Enter") { e.preventDefault(); var b = $("#n-cat-res [data-cat-k]"); if (b) catEscolhe(b.dataset.catK); } if (e.target.id === "n-cat-q" && e.key === "Escape") { e.target.value = ""; catMostra(""); } });
    f.addEventListener("input", function (e) { if (e.target.id === "n-cat-q") { catMostra(e.target.value); return; } }, true);
    f.addEventListener("input", function (e) { if (e.target.id === "n-cat-q") return; if (e.target.id === "n-desc") $("#n-dc").textContent = e.target.value.length; $("#ae-st").textContent = "Alterações não salvas."; preview(); });
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
    if (dupInfo) dupInfo.regSel = v("n-reg");
    /* "O que você oferece?": sugerido pela categoria, ajusta os rótulos de preço, o título da lista e a moeda (R$ no Brasil, US$ nos EUA) */
    var ajustaOferta = function () {
      var so = $("#n-oferta"); if (!so || !G.PERFIS) return; var alvo = { categoria: v("n-cat"), oferta: so.value, tipo: "estabelecimento" }, pf = G.perfilDe ? G.perfilDe(alvo) : (G.PERFIS[so.value] || G.PERFIS.servico), un = G.unidadeDe ? G.unidadeDe(alvo) : { de: "" };
      pf.ajuda = "O menor valor " + un.de + ".";
      var rg = (CIDADES.filter(function (p) { return p[0] === v("n-reg"); })[0] || [])[3] || "dfw", moeda = ((G.CIDADES_GUIA || {})[rg] || {}).pais === "BR" ? "R$" : "US$";
      var l1 = document.querySelector('label[for="n-pmin"]'), l2 = document.querySelector('label[for="n-pmed"]'), a1 = l1 && l1.parentNode.querySelector("small");
      if (l1) l1.textContent = pf.pmin + " (" + moeda + ")"; if (l2) l2.textContent = pf.pmed + " (" + moeda + ")"; if (a1) a1.textContent = pf.ajuda + ' Aparece como "a partir de" no anúncio.';
      var tt = document.querySelector("[data-oferta-tit]"); if (tt) tt.textContent = pf.tabela;
      var ct = document.querySelector("[data-cp-tit]"); if (ct) ct.textContent = so.value === "comida" ? "Cardápio digital" : "Catálogo digital";
      var nv = document.querySelector('.ae-nav [data-ae-ir="cardapio"]'); if (nv && nv.lastChild && nv.lastChild.nodeType === 3) nv.lastChild.textContent = so.value === "comida" ? "Cardápio" : "Preços";
    };
    f.addEventListener("change", function (e) {
      if (e.target.id === "n-oferta") { e.target.dataset.manual = "1"; ajustaOferta(); }
      if (e.target.id === "n-cat") { var so = $("#n-oferta"); if (so && !so.dataset.manual && G.perfilNegocio) so.value = G.perfilNegocio({ categoria: e.target.value, tipo: "estabelecimento" }); ajustaOferta(); }
      if (e.target.id === "n-reg") ajustaOferta();
    });
    ajustaOferta(); ondeLiga(f);
    /* CEP/ZIP: preenche o endereço e escolhe a cidade na lista */
    var nc = $("#n-cep"); if (nc) nc.addEventListener("cep", function (e) {
      var o = e.detail, end = $("#n-end"), sel = $("#n-reg"), nn = G.norm || function (s) { return String(s || "").toLowerCase(); };
      if (end && (!end.value.trim() || end.dataset.auto)) { end.value = o.pais === "BR" ? [o.rua, o.bairro, o.cidade + " - " + o.uf, o.cep].filter(Boolean).join(", ") : o.cidade + ", " + o.uf + " " + o.cep; end.dataset.auto = "1"; }
      if (sel) { var alvo = nn(o.pais === "BR" ? o.bairro : o.cidade), op = Array.prototype.filter.call(sel.options, function (x) { return nn(x.value) === alvo; })[0]; if (op) { sel.value = op.value; sel.dispatchEvent(new Event("change", { bubbles: true })); } }
      if (end && end.dataset.auto && o.rua) { G.toast("Endereço encontrado. Complete com o número."); try { end.focus(); end.setSelectionRange(o.rua.length, o.rua.length); } catch (er) { /* ok */ } }
      else if (end && end.dataset.auto) G.toast("Cidade encontrada: " + o.cidade + ", " + o.uf + ". Complete com a rua e o número.");
    });
    if ($("#n-end")) $("#n-end").addEventListener("input", function () { delete this.dataset.auto; });
    f.addEventListener("submit", function (e) {
      e.preventDefault(); if (ocupado) return;
      if (!v("n-cat")) { G.toast("Escolha a categoria do seu negócio."); var sc = $("#n-cat"); if (sc) { sc.scrollIntoView({ behavior: "smooth", block: "center" }); sc.focus(); } return; }
      if (!v("n-nome") || !v("n-desc")) { G.toast("Preencha o nome da empresa e o que você faz."); var s = $("#ae-empresa"); if (s) s.scrollIntoView({ behavior: "smooth" }); return; }
      var reg = CIDADES.filter(function (p) { return p[0] === v("n-reg"); })[0] || CIDADES[0];
      D.nome = v("n-nome"); D.categoria = v("n-cat"); D.oferta = v("n-oferta") || ""; D.historia = v("n-desc"); D.cupom = v("n-cupom");  D.descontoClube = v("n-clube"); D.brasileiro = $("#n-br").checked; D.falaPortugues = $("#n-pt").checked;
      if (window.Cardapio) Cardapio.ler(document, D); D.menuVerificadoEm = (D.menu || []).length ? G.hojeISO().slice(0, 7) : "";
      var pn = function (id) { var x = String(v(id) || "").replace(/[^\d,.]/g, "").replace(",", "."); return x === "" || isNaN(Number(x)) || Number(x) <= 0 ? null : Math.round(Number(x) * 100) / 100; };
      D.precoMin = pn("n-pmin"); D.precoMedio = pn("n-pmed"); if (D.precoMedio && D.precoMin && D.precoMedio < D.precoMin) D.precoMedio = D.precoMin; D.precoConferidoEm = D.precoMin ? G.hojeISO().slice(0, 7) : ""; D.precoBase = D.precoMin ? "informado pela empresa" : "";
      D.whatsapp = v("n-wa"); D.telefone = v("n-tel"); D.instagram = v("n-ig"); D.facebook = v("n-fb"); D.telegram = v("n-tg"); D.x = v("n-x"); D.linkedin = v("n-li"); D.site = v("n-site");
      var cl = v("n-cat-link"); D.catalogo = /^https?:\/\//i.test(cl) ? cl.slice(0, 400) : ""; D.catalogoNome = v("n-cat-nome").slice(0, 24);
      D.endereco = v("n-end"); D.regiaoGuia = reg[3] || "dfw"; if (reg[4]) { D.cidade = reg[4]; D.bairro = reg[0]; D.pais = "Brasil"; D.estado = "SP"; } else D.cidade = reg[0];
      var sem = Horario.lerEditor($("#f-an .hed")); if (sem) sem = sem.map(function (x) { return x || []; }); delete D.semana; D.horas = sem ? Horario.paraObj(sem) : null; D.horario = sem ? Horario.texto(sem) : (existente || dupInfo ? D.horario : "");
      D.cep = window.Cep ? Cep.normal(v("n-cep")) : v("n-cep");
      var ach = ($("#n-cep") || {})._cep;
      if (!existente && dupInfo && dupInfo.lat != null && (D.cep || "") === (dupInfo.cep || "") && v("n-reg") === (dupInfo.regSel || v("n-reg"))) { D.lat = dupInfo.lat; D.lng = dupInfo.lng; D.coordsAprox = dupInfo.aprox; }   /* cópia no mesmo endereço: localização exata do original */
      else if (ach && ach.lat != null && D.cep === ach.cep) { D.lat = ach.lat; D.lng = ach.lng; D.coordsAprox = !ach.rua; if (ach.pais === "BR" && ach.bairro && !D.bairro) D.bairro = ach.bairro; }
      else if (!existente || !D.lat || D.coordsAprox) { D.lat = reg[1]; D.lng = reg[2]; D.coordsAprox = true; }
      if (document.querySelector("[data-an-etq]")) D.etiquetas = Array.from(document.querySelectorAll("[data-an-etq]")).filter(function (x) { return x.checked; }).map(function (x) { return x.dataset.anEtq; });
      if (D.banner && D.banner.src) D.banner.texto = v("n-btxt");
      D.tipo = "estabelecimento"; D.anunciante = true; if (D.publicado == null) D.publicado = true; D.atualizadoEm = G.hojeISO().slice(0, 7);
      D.assinatura = Object.assign({ plano: "pacote", status: "ativa" }, D.assinatura || {}, { plano: "pacote" });
      var novo = !existente, nid = D.id;
      if (novo) { nid = Store.idProprio((D.nome.toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, "").replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "").slice(0, 44) || "empresa") + "-" + Date.now().toString(36).slice(-4)); D.donoUid = Store.uid() || ""; D.criadoEm = new Date().toISOString(); }
      ocupado = true; $("#ae-st").textContent = "Salvando…";
      Store.gravar("lugares", nid, D).then(function () {
        ocupado = false; removidas.filter(function (src) { return !fotoEmUso(src, nid); }).forEach(Store.apagarFoto); D.id = nid; perfil = nid;
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
  /* ---------- "Meu negócio": seções do anunciante dentro da Minha conta ----------
     Uma conta só. Sem pagamento as ferramentas ficam bloqueadas (a pessoa monta o anúncio e vê os planos);
     com pacote em vigor tudo libera. Quando o plano vence, os anúncios ficam guardados e ocultos até a renovação.
     O master abre a área de qualquer conta com tudo liberado (Anunciante.abrirConta / abrirPerfil). */
  var carregando = false;
  function temPlanoDe(uid, ls) { return (window.Pag ? Pag.vagas(uid) > 0 : true) || (ls || lugaresDe(uid)).some(noArDe); }
  function situacaoAn(x, e) {
    if (noArDe(x)) return { t: "No ar", c: "ok", why: "" };
    if (x.publicado === false) return { t: "Pausado", c: "", why: "Você pausou este anúncio. Retome quando quiser." };
    if (e.fase === "suspenso") return { t: "Suspenso", c: "warn", why: "Conta suspensa pela equipe. Fale com o CoraçãoBR." };
    if (e.fase === "vencido") return { t: "Oculto · plano vencido", c: "warn", why: "O plano venceu e o anúncio saiu do ar. Nada foi apagado: pague um pacote e ele volta como estava.", pagar: "Reativar" };
    if (e.fase === "ativando") return { t: "Ativando", c: "ok", why: e.txt };
    if (e.vagas) return { t: "Fora do plano", c: "warn", why: "Passou do limite do plano: contrate mais um pacote para este anúncio entrar no ar.", pagar: "Contratar mais" };
    return { t: "Rascunho · aguardando pagamento", c: "warn", why: "Pague o pacote por Pix para publicar. As ferramentas liberam assim que o pagamento é confirmado.", pagar: "Pagar e publicar" };
  }
  var FERRAMENTAS = [["chart", "Resultados", "visualizações, rotas e contatos"], ["mega", "Publicar no feed", "fotos e novidades"], ["grid", "Mural", "vagas, vendas e quartos"], ["share", "Kit de divulgação", "QR Avalie-nos e texto pronto"],
    ["tag", "Cupom com validação", "o cliente usa no balcão"], ["spark", "Destaque e selo", "topo da lista e Verificado"], ["star", "Arte para Instagram", "pronta para postar"], ["home", "Banner na página inicial", "carrossel de anunciantes"]];

  /* o = { uid, master, grupo, depois } → { liberado, menu, secoes, init, ls, estado } */
  function negocio(o) {
    var uid = o.uid, mst = !!o.master, ls = o.ls || lugaresDe(uid);
    var faltam = ls.filter(function (x) { return !metCache[x.id]; });
    if (faltam.length && !carregando) { carregando = true; Promise.all(faltam.map(function (x) { return carrega(x.id).catch(function () { metCache[x.id] = []; }); })).then(function () { carregando = false; if (o.depois) o.depois(); }); }
    var l = ls.filter(function (x) { return x.id === perfil; })[0] || ls[0] || null; perfil = l ? l.id : null;
    var e = window.Pag ? Pag.estado(uid) : { fase: "ativo", vagas: LIMITE, txt: "" }, lib = mst || !!o.liberar || temPlanoDe(uid, ls);
    var lim = mst ? Math.max(ls.length, e.vagas) : maximo(), usados = ls.length, noArN = ls.filter(noArDe).length;
    var preco = G.reais(window.Pag ? Pag.preco() : 50), npk = window.Pag ? Pag.porPacote() : 3, grupo = o.grupo || "Meu negócio";
    var cardAn = function (x) {
      var fx = (x.fotos || [])[0], s = situacaoAn(x, e), pausado = x.publicado === false, on = s.c === "ok" && s.t === "No ar";
      return '<div class="ad-an' + (x.id === perfil ? " on" : "") + (on ? "" : " off") + '"><span class="ad-anf">' + (fx ? '<img src="' + esc(Store.urlFoto(fx.src)) + '" alt="">' : "<b>Sem foto</b>") + '<span class="pill ' + s.c + '">' + esc(s.t) + "</span></span>" +
        '<div class="ad-ant"><b>' + esc(x.nome) + "</b><small>" + esc(G.CATS[x.categoria] || "Sem categoria") + " · " + (x.fotos || []).length + " fotos" + (x.banner && x.banner.src ? " · banner" : "") + (lib ? " · " + soma(x.id, 30).v + " visualizações" : "") + "</small>" + (s.why ? '<small class="ad-why">' + esc(s.why) + "</small>" : "") + "</div>" +
        '<div class="ad-ana">' + (s.pagar && !mst ? '<a class="btn sm" href="#pagar">' + s.pagar + "</a>" : "") + '<button type="button" class="btn ' + (s.pagar && !mst ? "ghost " : "") + 'sm" data-editar-id="' + esc(x.id) + '">Editar</button><a class="btn ghost sm" href="#lugar-' + esc(x.id) + '">' + (on ? "Ver" : "Prévia") + "</a>" +
        (on || pausado ? '<button type="button" class="btn ghost sm" data-pausa-an="' + esc(x.id) + '">' + (pausado ? "Retomar" : "Pausar") + "</button>" : "") +
        (mst ? "" : '<button type="button" class="btn ghost sm" data-duplica-an="' + esc(x.id) + '" title="Cria um anúncio novo com os mesmos dados, fotos, contatos e horário">' + Dash.ic("plus") + " Duplicar</button>") + "</div></div>";
    };
    var novoCard = mst ? "" : usados < lim ? '<a class="ad-novo" href="#anunciar" data-novo-anuncio>' + Dash.ic("plus") + "<b>Criar anúncio</b><small>" + (lib ? (lim - usados) + (lim - usados === 1 ? " vaga disponível" : " vagas disponíveis") : "fica guardado até o pagamento") + "</small></a>"
      : '<a class="ad-novo ad-mais" href="#pagar">' + Dash.ic("plus") + "<b>Mais " + npk + " anúncios</b><small>por " + preco + " · contratar pacote</small></a>";
    var listaAn = '<div class="ad-ans">' + ls.map(cardAn).join("") + novoCard + "</div>" +
      (usados ? '<p class="small muted">' + usados + (usados === 1 ? " anúncio criado" : " anúncios criados") + " · " + e.vagas + " liberados pelo plano · " + noArN + " no ar agora. Os anúncios mais antigos usam as vagas primeiro.</p>" : "");
    var comoFunciona = '<div class="dk-card dk-flat"><div class="dk-ch"><h3>Como funciona</h3></div><ul class="ad-how"><li><b>Pacotes somam.</b> ' + preco + " = " + npk + " anúncios; 2 pacotes = " + 2 * npk + " anúncios, e assim por diante.</li><li><b>Pagamento por Pix.</b> O QR Code e o copia e cola já vêm com o valor. Confirmado o pagamento, o anúncio entra no ar e as ferramentas liberam.</li><li><b>Datas automáticas.</b> Cada pacote mostra o dia do pagamento, o início e o término (1 mês).</li><li><b>Nada se perde.</b> Quando o plano vence, os anúncios ficam guardados e ocultos. Renove e eles voltam como estavam.</li><li><b>Avisos por e-mail.</b> Você recebe e-mail 3, 2 e 1 dia antes do fim.</li></ul></div>";
    var contratar = (mst ? '<div class="dk-card dk-flat ng-mst"><div class="dk-ch"><h3>Plano desta conta</h3><span class="pill ' + (e.vagas ? "ok" : "warn") + '">' + esc(e.txt) + '</span></div><p class="small muted">Para dar cortesia, confirmar Pix ou suspender, use a aba Pagamentos do painel master.</p><a class="btn sm" href="#painel" data-painel-aba="pagamentos">Abrir Pagamentos</a></div>' : window.Pag ? Pag.calculadora(uid, true) : "") +
      '<div class="dk-card dk-flat"><div class="dk-ch"><h3>Histórico de pacotes</h3></div>' + (window.Pag ? Pag.linhaDoTempo(uid) : "") + "</div>" + comoFunciona;
    var menu, secoes = {};
    if (!lib) {
      var vencido = e.fase === "vencido", ctas = ls.length ? '<a class="btn" href="#pagar">' + (vencido ? "Reativar por " : "Pagar e publicar · ") + preco + '</a><button type="button" class="btn ghost" data-editar-id="' + esc(ls[0].id) + '">Editar anúncio</button>'
        : '<a class="btn" href="#anunciar" data-novo-anuncio>' + Dash.ic("plus") + 'Criar meu anúncio</a><button type="button" class="btn ghost" data-dk-ir="contratar">Ver planos</button>';
      var hero = '<div class="ng-hero dk-card dk-dark"><div class="ng-hc"><small>' + (vencido ? "Seu plano venceu" : e.fase === "ativando" ? "Pagamento confirmado" : "Para donos de negócio") + "</small><h2>" + (vencido ? "Reative seus anúncios e as ferramentas" : e.fase === "ativando" ? "Seu anúncio está entrando no ar" : "Anuncie e libere as ferramentas do seu negócio") + "</h2><p>" +
        (vencido ? "Seus anúncios estão guardados e ocultos. Pague um pacote por Pix e tudo volta ao ar do jeito que estava." : e.fase === "ativando" ? esc(e.txt) + ". O painel completo libera em seguida." : "Monte o anúncio, escolha o plano e pague por Pix. Quando o pagamento entra, o anúncio vai ao ar e o painel completo do anunciante é liberado.") + '</p><div class="ng-ha">' + ctas + "</div></div>" +
        '<ol class="ng-steps"><li' + (ls.length ? ' class="ok"' : "") + "><i>" + (ls.length ? Dash.ic("check") : "1") + "</i><b>Monte o anúncio</b><small>fotos, contato e endereço</small></li><li><i>2</i><b>Pague por Pix</b><small>" + preco + " = " + npk + " anúncios por mês</small></li><li><i>3</i><b>Ferramentas liberadas</b><small>anúncio no ar e painel completo</small></li></ol></div>";
      var bloq = '<div class="dk-card dk-flat"><div class="dk-ch"><h3>Ferramentas do anunciante</h3><span class="ng-lk">' + Dash.ic("lock") + "liberam com o pagamento</span></div><div class=\"ng-ts\">" +
        FERRAMENTAS.map(function (t) { return '<div class="ng-t">' + Dash.ic(t[0]) + "<b>" + t[1] + "</b><small>" + t[2] + "</small><i>" + Dash.ic("lock") + "</i></div>"; }).join("") + "</div></div>";
      secoes.negocio = hero + (ls.length ? '<div class="dk-card dk-flat"><div class="dk-ch"><h3>Seus anúncios</h3><button type="button" class="more" data-dk-ir="anuncios">ver todos</button></div><div class="ad-ans">' + ls.slice(0, 2).map(cardAn).join("") + "</div></div>" : "") + bloq;
      secoes.anuncios = listaAn;
      secoes.contratar = contratar;
      menu = [
        { id: "negocio", nome: "Meu negócio", ic: "store", grupo: grupo, titulo: "Meu negócio", sub: vencido ? "Plano vencido: seus anúncios estão guardados e ocultos." : "As ferramentas de anúncio liberam com o pagamento." },
        { id: "anuncios", nome: "Meus anúncios", ic: "grid", n: usados || "", grupo: grupo, titulo: "Meus anúncios", sub: "Criados por você. Ficam guardados até o pagamento ser confirmado.", acao: usados < lim ? '<a class="btn sm" href="#anunciar" data-novo-anuncio>' + Dash.ic("plus") + "Criar anúncio</a>" : "" },
        { id: "contratar", nome: "Planos e Pix", ic: "card", grupo: grupo, titulo: "Planos e pagamento", sub: "Monte seu plano e pague por Pix. Pacotes somam." }
      ];
      if (!usados) menu = menu.filter(function (m) { return m.id !== "anuncios"; });
      return { liberado: false, menu: menu, secoes: secoes, init: initNegocio(l), ls: ls, estado: e };
    }
    var tot = { v: 0, r: 0, c: 0 }, dias = [], max = 1;
    ls.forEach(function (x) { var m = soma(x.id, 30); tot.v += m.v; tot.r += m.r; tot.c += m.c; });
    for (var i = 13; i >= 0; i--) { var d = new Date(); d.setDate(d.getDate() - i); var iso = d.getFullYear() + "-" + String(d.getMonth() + 1).padStart(2, "0") + "-" + String(d.getDate()).padStart(2, "0"); var q = ls.reduce(function (s, x) { return s + (soma(x.id, 30).porDia[iso] || 0); }, 0); max = Math.max(max, q); dias.push([iso, q]); }
    var kpi = function (nm, t, icn) { return '<div class="dk-card"><small>' + t + '</small><b class="dk-big">' + nm + "</b>" + Dash.ic(icn) + "</div>"; };
    var grafico = '<div class="dk-card dk-flat"><div class="dk-ch"><h3>Visualizações · 14 dias</h3><span class="small muted">' + (tot.v ? "maior dia: " + max : "sem acessos ainda") + '</span></div><div class="bars">' + dias.map(function (dd, k) { return '<div title="' + dd[0] + ": " + dd[1] + '"><i style="height:' + Math.max(3, Math.round(dd[1] / max * 100)) + "%;animation-delay:" + (k * 0.03) + 's"></i><small>' + dd[0].slice(8) + "</small></div>"; }).join("") + "</div></div>";
    var de30 = new Date(); de30.setDate(de30.getDate() - 30); de30 = de30.toISOString().slice(0, 10);
    var cupons30 = ls.reduce(function (s2, x) { return s2 + (x.validados || []).filter(function (vv) { return String(vv.em || "") >= de30; }).length; }, 0);
    var plano = '<div class="ad-plan dk-card dk-dark"><div><small>' + (mst ? "Plano desta conta" : "Seu plano") + '</small><b class="dk-big">' + e.vagas + "<span> " + (e.vagas === 1 ? "anúncio liberado" : "anúncios liberados") + "</span></b><p>" + esc(e.txt) + "</p></div>" + (mst ? "" : '<div class="ad-pl-a"><a class="btn" href="#pagar">Contratar mais</a><button type="button" class="btn ghost" data-dk-ir="contratar">Ver pacotes</button></div>') + "</div>";
    var seletor = ls.length > 1 ? '<label class="ng-sel"><span>Anúncio</span><select data-ng-sel>' + ls.map(function (x) { return '<option value="' + esc(x.id) + '"' + (l && x.id === l.id ? " selected" : "") + ">" + esc(x.nome) + "</option>"; }).join("") + "</select></label>" : "";
    var depo = window.Promo && !mst ? Promo.blocoPainel(uid) : "";
    secoes.negocio = plano + '<div class="dk-grid dk-g4">' + kpi(tot.v, "Visualizações · 30 dias", "eye") + kpi(tot.r + tot.c, "Rotas e contatos", "route") + kpi(cupons30, "Cupons usados · 30 dias", "tag") + kpi(noArN + "/" + usados, "Anúncios no ar", "store") + "</div>" +
      (ls.length ? grafico + '<div class="dk-card dk-flat"><div class="dk-ch"><h3>' + (mst ? "Anúncios desta conta" : "Seus anúncios") + '</h3><button type="button" class="more" data-dk-ir="anuncios">ver todos</button></div><div class="ad-ans">' + ls.slice(0, 3).map(cardAn).join("") + "</div></div>"
        : '<div class="dk-card dk-flat ad-vazio"><h3>' + (mst ? "Esta conta ainda não criou anúncios" : "Crie seu primeiro anúncio") + "</h3>" + (mst ? "" : '<p class="muted">Até 20 fotos, banner, WhatsApp, redes sociais, endereço, horário, cardápio ou catálogo.</p><a class="btn" href="#anunciar" data-novo-anuncio>Criar anúncio</a>') + "</div>");
    secoes.anuncios = listaAn;
    secoes.contratar = contratar;
    secoes.turbinar = window.Diferenciais && !mst ? Diferenciais.blocoTurbinar(uid, ls) : "";
    secoes.depoimentos = depo;
    secoes.publicar = l && window.Social && Social.blocoPainel(l) ? seletor + Social.blocoPainel(l) : "";
    secoes.divulgar = l ? seletor + qrAvalie(l) + (window.Novidades ? Novidades.botaoArte(l) : "") + divulgar(l) + (window.Extras ? Extras.kit(l) : "") : "";
    secoes.cupom = l && l.cupom && window.Comunidade ? seletor + Comunidade.validador(l) : "";
    menu = [
      { id: "negocio", nome: mst ? "Visão do negócio" : "Painel do negócio", ic: "store", grupo: grupo, titulo: mst ? "Negócio desta conta" : "Meu negócio", sub: mst ? "Anúncios, plano e resultados desta conta (visão do master)." : "Seus anúncios, seu plano e os resultados dos últimos 30 dias." },
      { id: "anuncios", nome: "Meus anúncios", ic: "grid", n: usados + "/" + lim, grupo: grupo, titulo: mst ? "Anúncios desta conta" : "Meus anúncios", acao: mst ? "" : '<a class="btn sm" href="#anunciar" data-novo-anuncio>' + Dash.ic("plus") + "Criar anúncio</a>" },
      { id: "contratar", nome: "Planos e Pix", ic: "card", grupo: grupo, titulo: "Planos e pagamento", sub: mst ? "" : "Monte seu plano, pague por Pix e acompanhe as datas de cada pacote." },
      { id: "turbinar", nome: "Destaque e selo", ic: "spark", grupo: grupo, titulo: "Destaque, selo e indicação", sub: "Apareça no topo, ganhe o selo Verificado e indique outras empresas com 50% de desconto." },
      { id: "depoimentos", nome: "Depoimentos", ic: "star", grupo: grupo, titulo: "Depoimentos de empresas", sub: "Na promoção de curadoria, você ganha 1 anúncio e escreve depoimentos de lugares que conhece." },
      { id: "publicar", nome: "Publicar no feed", ic: "mega", grupo: grupo, titulo: "Publicar no feed" },
      { id: "divulgar", nome: "Kit de divulgação", ic: "share", grupo: grupo, titulo: "Kit de divulgação" },
      { id: "cupom", nome: "Cupom", ic: "tag", grupo: grupo, titulo: "Validar cupom" }
    ].filter(function (m) { return m.id === "negocio" || m.id === "anuncios" || m.id === "contratar" || secoes[m.id]; });
    return { liberado: true, menu: menu, secoes: secoes, init: initNegocio(l), ls: ls, estado: e };
  }
  function initNegocio(l) { return function () { if (l && l.cupom && window.Comunidade && document.querySelector("[data-dk-sec=cupom]")) Comunidade.validadorInit(l); if (l && window.Extras) Extras.kitInit(l); }; }
  function rerender() { var y = window.scrollY; G.render(); window.scrollTo(0, y); }
  document.addEventListener("click", function (ev) {
    if (!ev.target.closest(".dk")) return;
    var cp = ev.target.closest("[data-copia]");
    if (cp) { var tx = document.getElementById("dv-texto"); if (!tx) return; (navigator.clipboard ? navigator.clipboard.writeText(tx.value) : Promise.reject()).then(function () { G.toast("Texto copiado. Cole no Facebook ou no grupo."); }).catch(function () { tx.select(); G.toast("Selecione e copie o texto."); }); return; }
    var ed = ev.target.closest("[data-editar-id]"); if (ed) { editar = ed.dataset.editarId; location.hash = "anunciar"; return; }
    var dp = ev.target.closest("[data-duplica-an]");
    if (dp) {
      var o = Store.obter("lugares", dp.dataset.duplicaAn); if (!o || !ehMeu(o)) { G.toast("Esse anúncio não é da sua conta."); return; }
      if (meusLugares().length >= maximo()) { G.toast("Seu plano libera " + maximo() + " anúncios. Contrate mais um pacote para duplicar."); location.hash = "pagar"; return; }
      editar = null; duplicar = o.id; location.hash = "anunciar"; return;
    }
    var tg = ev.target.closest("[data-pausa-an]");
    if (tg) { var x = Store.obter("lugares", tg.dataset.pausaAn); if (!x) return; if (!ehMeu(x)) { G.toast("Esse anúncio não é da sua conta."); return; } x.publicado = x.publicado === false; Store.gravar("lugares", x.id, x).then(function () { G.toast(x.publicado ? "Anúncio retomado." : "Anúncio pausado."); rerender(); }).catch(falha); }
  });
  document.addEventListener("change", function (ev) { var s = ev.target.closest("[data-ng-sel]"); if (s) { perfil = s.value; rerender(); } });

  /* #anunciante: para a própria conta, abre a Minha conta direto em "Meu negócio"; o master vê a área de qualquer conta. */
  var contaVista = null, uidVisto = null;
  function viewAnunciante() {
    if (!master || !uidVisto) { try { sessionStorage.setItem("dash-usuario", "negocio"); } catch (e) { /* ok */ } location.replace("#conta"); return; }
    var uid = uidVisto, c = contaVista;
    if (!c && uid.charAt(0) !== "~" && Store.servidor && Store.servidor() && !viewAnunciante.buscou) {
      viewAnunciante.buscou = true;
      Store.api("usuarios").then(function (j) { contaVista = (j.usuarios || []).filter(function (u) { return u.id === uid; })[0] || null; if (location.hash === "#anunciante") viewAnunciante(); }).catch(function () { /* sem lista: segue só com os anúncios */ });
    }
    var n = negocio({ uid: uid, master: true, grupo: "Negócio", ls: uid.charAt(0) === "~" ? [Store.obter("lugares", uid.slice(1))].filter(Boolean) : null, depois: function () { if (location.hash === "#anunciante") viewAnunciante(); } });
    var nome = (c && c.nome) || (n.ls[0] && n.ls[0].nome) || "Conta", e = n.estado;
    var dado = function (k, v) { return v ? '<div class="ng-dd"><small>' + k + "</small><b>" + esc(v) + "</b></div>" : ""; };
    var sec = '<div class="dk-card dk-flat ng-conta"><div class="ng-ct"><span class="dk-av">' + esc(nome.charAt(0).toUpperCase()) + "</span><div><b>" + esc(nome) + "</b><small>" + esc((c && c.email) || uid) + '</small></div><span class="pill ' + (e.vagas ? "ok" : "warn") + '">' + (e.vagas ? "Anunciante ativo" : "Usuário") + "</span></div>" +
      '<div class="ng-dds">' + dado("CEP / ZIP", c && c.zip ? c.zip + (c.zip_cidade ? " · " + c.zip_cidade : "") : "não informado") + dado("Papel", c ? (c.papel === "master" ? "Master" : "Usuário") : "") + dado("Plano", e.txt) + dado("Anúncios", n.ls.length + " criados · " + n.ls.filter(noArDe).length + " no ar") + dado("Criada em", c && c.criado ? dataBR(String(c.criado).slice(0, 10)) : "") + dado("Último acesso", c && c.ultimo ? dataBR(String(c.ultimo).slice(0, 10)) : "") + "</div></div>";
    var menu = [{ id: "conta", nome: "Conta", ic: "user", grupo: "", titulo: nome, sub: "Visão do master: tudo o que esta conta vê na área de negócio, com acesso total." }].concat(n.menu);
    n.secoes.conta = sec;
    G.app.innerHTML = Dash.montar({ chave: "an-master", marca: "Visão do master", titulo: nome, avatar: nome.charAt(0).toUpperCase(), menu: menu, secoes: n.secoes, pe: [{ nome: "Voltar ao painel master", ic: "back", href: "#painel" }] });
    n.init();
  }
  window.addEventListener("hashchange", function () { if (!/^#(anunciante|anunciar|lugar-)/.test(location.hash)) { master = false; uidVisto = null; contaVista = null; viewAnunciante.buscou = false; } });
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
  G.views.anunciante = viewAnunciante;

  var editar = null, duplicar = null;
  document.addEventListener("click", function (e) { if (e.target.closest("[data-novo-anuncio]")) { editar = null; duplicar = null; } });
  G.views.anunciar = function () { var id = editar, dp = duplicar; editar = null; duplicar = null; viewAnunciar(id, dp); };
  function temPlano() { return temPlanoDe(Store.uid()); }
  window.Anunciante = { temPlano: temPlano, temPlanoDe: temPlanoDe, negocio: negocio, lugaresDe: lugaresDe, ehMeu: ehMeu, LIMITE: LIMITE, soma: soma, carrega: carrega,
    abrirPerfil: function (id) { var l = Store.obter("lugares", id); perfil = id; master = true; uidVisto = (l && (l._dono || l.donoUid)) || "~" + id; contaVista = null; viewAnunciante.buscou = false; location.hash = "anunciante"; },
    abrirConta: function (u) { perfil = null; master = true; uidVisto = u && u.id; contaVista = u || null; viewAnunciante.buscou = false; location.hash = "anunciante"; } };
})();
