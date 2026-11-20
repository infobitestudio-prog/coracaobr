/* Jornada do visitante:
   1) "Quero esse roteiro": o roteiro vira um checklist. Em cada parada a pessoa marca "estive aqui", dá nota e comenta.
      A avaliação vai para as Avaliações do lugar com o selo "Esteve aqui", e o progresso fica em Conta → Meus roteiros.
   2) "Por perto": com a permissão de localização, o guia avisa quando a pessoa passa perto de um restaurante, mercado,
      loja ou serviço cadastrado, com uma sugestão que muda conforme o tipo do lugar e a hora do dia.
      Anunciantes têm prioridade e o aviso conta nas métricas deles. Tudo roda no aparelho; nada da localização é enviado. */
(function () {
  "use strict";
  var G = window.Guia, esc = G.esc, ic = G.ic, $ = function (s, r) { return (r || document).querySelector(s); };
  function ler(k, d) { try { var v = JSON.parse(localStorage.getItem(k) || "null"); return v == null ? d : v; } catch (e) { return d; } }
  function grava(k, v) { try { localStorage.setItem(k, JSON.stringify(v)); } catch (e) { /* sem armazenamento */ } }
  function lugar(id) { return Store.obter("lugares", id); }
  function agoraDallas() { var p = new Intl.DateTimeFormat("en-US", { timeZone: "America/Chicago", hour: "numeric", hour12: false, weekday: "short" }).formatToParts(new Date()); var h = Number((p.filter(function (x) { return x.type === "hour"; })[0] || {}).value) % 24; return { h: h }; }

  /* ================= roteiros em checklist ================= */
  function meus() { return ler("meus-roteiros", []); }
  function salvaMeus(a) { grava("meus-roteiros", a); }
  function adotar(titulo, ids, origem) {
    var a = meus(), rid = "r" + Date.now().toString(36);
    a.unshift({ id: rid, titulo: titulo, origem: origem || "pronto", criadoEm: new Date().toISOString(), paradas: ids.filter(lugar).map(function (id) { return { id: id, feito: false, nota: 0, texto: "", em: "" }; }) });
    salvaMeus(a.slice(0, 30)); location.hash = "meu-roteiro-" + rid;
  }
  function progresso(r) { var f = r.paradas.filter(function (p) { return p.feito; }).length; return { feitos: f, total: r.paradas.length, pct: r.paradas.length ? Math.round(f / r.paradas.length * 100) : 0 }; }
  function barra(pr) { return '<div class="prog" role="progressbar" aria-valuemin="0" aria-valuemax="100" aria-valuenow="' + pr.pct + '"><i style="width:' + pr.pct + '%"></i></div>'; }
  function estrelas(n, nome) { if (window.Reacoes) return '<div class="rate rx-pick" role="radiogroup" aria-label="Sua reação">' + Reacoes.botoes(n, function (k) { return ' data-nota="' + k + '" data-p="' + esc(nome) + '"'; }) + "</div>"; return '<div class="rate" role="radiogroup" aria-label="Sua nota">' + [1, 2, 3, 4, 5].map(function (k) { return '<button type="button" data-nota="' + k + '" data-p="' + esc(nome) + '" aria-pressed="' + (k <= n) + '" aria-label="' + k + ' estrela' + (k > 1 ? "s" : "") + '">★</button>'; }).join("") + "</div>"; }

  var abertos = {};
  function viewMeuRoteiro(rota) {
    var rid = rota.replace("meu-roteiro-", ""), a = meus(), r = a.filter(function (x) { return x.id === rid; })[0];
    if (!r) { viewMeusRoteiros(); return; }
    var pr = progresso(r), prox = r.paradas.filter(function (p) { return !p.feito; })[0];
    G.app.innerHTML = '<section class="block"><div class="wrap stack in" style="max-width:760px"><div><a class="more" href="#meus-roteiros">← meus roteiros</a><p class="eyebrow" style="margin-top:10px">Checklist do roteiro</p><h1 class="page-h" style="margin-top:4px">' + esc(r.titulo) + "</h1></div>" +
      '<div class="panel stack" style="gap:10px"><div class="row" style="justify-content:space-between"><b>' + pr.feitos + " de " + pr.total + ' paradas</b><span class="muted small">' + pr.pct + "%</span></div>" + barra(pr) +
      (pr.feitos === pr.total && pr.total ? '<p class="fim">🎉 Roteiro completo! Obrigado por contar como foi cada lugar.</p>' : prox ? '<p class="small muted">Próxima parada: <b>' + esc((lugar(prox.id) || {}).nome || "") + "</b></p>" : "") + "</div>" +
      '<ol class="check-list">' + r.paradas.map(function (p, i) {
        var l = lugar(p.id); if (!l) return "";
        var aberto = !p.enviado && (abertos[p.id] || (p.feito && !p.nota)), f = G.foto(l);
        return '<li class="ck' + (p.feito ? " ok" : "") + (prox && prox.id === p.id ? " now" : "") + '" data-id="' + esc(p.id) + '"><div class="ckh"><button type="button" class="box" data-feito="' + esc(p.id) + '" aria-pressed="' + p.feito + '" aria-label="Marcar ' + esc(l.nome) + ' como visitado">' + (p.feito ? "✓" : i + 1) + '</button><a class="ckl" href="#lugar-' + esc(l.id) + '">' + (f ? '<img src="' + esc(f) + '" alt="" loading="lazy">' : "") + "<span><b>" + esc(l.nome) + "</b><small>" + esc(G.CATS[l.categoria] || "") + " · " + esc(G.regiao(l)) + "</small></span></a>" +
          (p.feito && p.nota ? (window.Reacoes ? Reacoes.selo(p.nota, { individual: true, nome: true, cls: "nota-ck" }) : '<span class="nota-ck">' + "★".repeat(p.nota) + "</span>") : "") + "</div>" +
          (aberto ? '<div class="ckb"><p class="small"><b>Como foi?</b> Sua nota aparece nas avaliações do lugar com o selo "Esteve aqui".</p>' + estrelas(p.nota, p.id) + '<textarea data-txt="' + esc(p.id) + '" maxlength="600" placeholder="Conte em poucas palavras (opcional)">' + esc(p.texto || "") + '</textarea><div class="row"><button type="button" class="btn sm" data-envia="' + esc(p.id) + '">Salvar experiência</button><button type="button" class="btn sm ghost" data-depois="' + esc(p.id) + '">Depois</button></div></div>' :
            !p.feito ? '<div class="ckb mini"><a class="btn sm ghost" target="_blank" rel="noopener" href="https://www.google.com/maps/dir/?api=1&destination=' + encodeURIComponent(l.lat != null ? l.lat + "," + l.lng : (l.endereco || l.nome)) + '">' + ic("pin") + ' Como chegar</a></div>' : "") + "</li>";
      }).join("") + "</ol>" +
      '<div class="row"><button type="button" class="btn ghost sm danger" data-apaga-rot>Excluir este roteiro</button></div></div></section>';
    G.app.querySelector("section").onclick = function (e) {
      var b = e.target.closest("[data-feito]");
      if (b) { var p = acha(r, b.dataset.feito); p.feito = !p.feito; p.em = p.feito ? G.hojeISO() : ""; abertos[p.id] = p.feito && !p.enviado; salva(a); viewMeuRoteiro(rota); return; }
      var n = e.target.closest("[data-nota]");
      if (n) { var q = acha(r, n.dataset.p); q.nota = Number(n.dataset.nota); var t = $('[data-txt="' + CSS.escape(q.id) + '"]'); if (t) q.texto = t.value; salva(a); viewMeuRoteiro(rota); return; }
      var d = e.target.closest("[data-depois]"); if (d) { abertos[d.dataset.depois] = false; viewMeuRoteiro(rota); return; }
      var s = e.target.closest("[data-envia]");
      if (s) {
        var x = acha(r, s.dataset.envia), tx = $('[data-txt="' + CSS.escape(x.id) + '"]'); x.texto = tx ? tx.value.trim() : "";
        if (!x.nota) { G.toast("Escolha de 1 a 5 estrelas."); return; }
        var nome = ler("meu-nome", "") || "Visitante";
        var doc = { lugarId: x.id, estrelas: x.nota, nome: nome, texto: x.texto, criadoEm: new Date().toISOString(), tipo: "experiencia", roteiro: r.titulo };
        var aid = Store.idProprio(Store.novoId("av"));
        Store.gravar("avaliacoes", aid, doc).then(function () {
          x.enviado = true; abertos[x.id] = false; salva(a); G.toast("Experiência salva. Obrigado!");
          if (window.Usuario) Usuario.registraAval(aid); viewMeuRoteiro(rota);
        }).catch(function (er) { salva(a); G.toast(er && er.message && !er.code ? er.message : "Guardamos aqui no aparelho. Tente enviar de novo mais tarde."); });
        return;
      }
      if (e.target.closest("[data-apaga-rot]")) { if (!confirm("Excluir este roteiro do aparelho?")) return; salvaMeus(a.filter(function (y) { return y.id !== r.id; })); location.hash = "meus-roteiros"; }
    };
    function salva(arr) { salvaMeus(arr); }
  }
  function acha(r, id) { return r.paradas.filter(function (p) { return p.id === id; })[0]; }
  function viewMeusRoteiros() {
    var a = meus();
    G.app.innerHTML = '<section class="block"><div class="wrap stack in" style="max-width:760px"><div><a class="more" href="#conta">← conta</a><h1 class="page-h" style="margin-top:8px">Meus roteiros</h1><p class="muted">Marque cada parada e conte como foi. Suas notas ajudam outros brasileiros.</p></div>' +
      (a.length ? '<div class="list">' + a.map(function (r) { var pr = progresso(r); return '<a class="lrow rotrow" href="#meu-roteiro-' + esc(r.id) + '"><span><b>' + esc(r.titulo) + "</b><small>" + pr.feitos + " de " + pr.total + " paradas" + (r.origem === "ia" ? " · montado com IA" : "") + "</small>" + barra(pr) + "</span>" + ic("arrow") + "</a>"; }).join("") + "</div>" : '<div class="panel"><p class="muted">Você ainda não começou um roteiro.</p></div>') +
      '<div class="row"><a class="btn" href="#roteiros">Roteiros prontos</a><a class="btn ghost" href="#roteiro-ia">' + ic("sparkle") + " Montar com IA</a></div></div></section>";
  }
  function botaoQuero(titulo, ids, origem) { return '<button type="button" class="btn" data-quero=\'' + esc(JSON.stringify({ t: titulo, ids: ids, o: origem || "pronto" })) + "'>" + ic("star") + " Quero esse roteiro</button>"; }
  document.addEventListener("click", function (e) { var b = e.target.closest("[data-quero]"); if (!b) return; try { var d = JSON.parse(b.dataset.quero); adotar(d.t, d.ids, d.o); } catch (er) { /* ignora */ } });

  /* ================= por perto ================= */
  var COMIDA = G.COMIDA, PERTO_RAIO = 0.35, PERTO_RAIO_AN = 0.8;
  function permitido() { return ler("perto-ativo", false) === true; }
  function sugestao(l) {
    var h = agoraDallas().h, c = l.categoria;
    if (c === "padaria") return h < 11 ? "um café da manhã com pão de queijo" : "um café com pão de queijo";
    if (c === "acai-cafe") return h < 11 ? "um café para começar o dia" : "um açaí ou um café";
    if (c === "mercado-brasileiro") return "matar a saudade com produtos do Brasil";
    if (c === "mercado") return "fazer as compras da semana";
    if (c === "compras") return "dar uma olhada nas lojas";
    if (c === "bar") return h >= 17 ? "um happy hour" : "um drink mais tarde";
    if (COMIDA.indexOf(c) >= 0) return h < 10.5 ? "um café da manhã" : h < 15 ? "um almoço" : h < 17.5 ? "um lanche" : "um jantar";
    if (G.SERVICOS.indexOf(c) >= 0) return "conhecer o serviço (" + (G.CATS[c] || "atendimento") + ") e pedir um orçamento";
    return "uma visita";
  }
  function elegivel(l) {
    if (!l || l.publicado === false || l.coordsAprox || typeof l.lat !== "number" || typeof l.lng !== "number") return false;
    if (l.categoria === "hotel" || ["governo", "transporte", "saude", "servico", "comunidade", "evento", "show"].indexOf(l.categoria) >= 0) return false;
    if (!(l.tipo === "estabelecimento" || l.anunciante)) return false;
    if (window.Extras && Extras.aberto(l) === false) return false;
    return true;
  }
  function podeAvisar(id) {
    var st = ler("perto-hist", { dia: "", n: 0, ult: 0, por: {} }), hoje = G.hojeISO();
    if (st.dia !== hoje) { st.dia = hoje; st.n = 0; }
    if (st.n >= 4 || Date.now() - (st.ult || 0) < 45 * 60000) return false;
    if (st.por[id] && Date.now() - st.por[id] < 7 * 864e5) return false;
    return st;
  }
  function registra(st, id) { st.n++; st.ult = Date.now(); st.por[id] = Date.now(); Object.keys(st.por).forEach(function (k) { if (Date.now() - st.por[k] > 30 * 864e5) delete st.por[k]; }); grava("perto-hist", st); }
  /* dentro de alguma região do guia (Dallas–Fort Worth, Houston, Austin, San Antonio)? */
  function naRegiao(c) { var cs = G.CIDADES_GUIA || {}; return Object.keys(cs).some(function (k) { return G.dist(c, cs[k]) <= 250; }); }
  function checaPosicao(pos) {
    var c = { lat: pos.coords.latitude, lng: pos.coords.longitude };
    if (!naRegiao(c)) return;
    paradaPerto(c);
    if (!permitido() || document.querySelector("#perto-card.on")) return;
    /* todas as regiões (a pessoa pode estar numa cidade diferente da escolhida no guia); só lugares públicos e anúncios pagos */
    var cands = (G.todosLugares ? G.todosLugares() : G.lugares()).filter(elegivel).map(function (l) { return { l: l, d: G.dist(c, l) }; })
      .filter(function (x) { return x.d <= (x.l.anunciante ? PERTO_RAIO_AN : PERTO_RAIO); });
    if (!cands.length) return;
    cands.sort(function (a, b) { var pa = (G.destaque(a.l) ? 2 : a.l.anunciante ? 1 : 0), pb = (G.destaque(b.l) ? 2 : b.l.anunciante ? 1 : 0); return pb - pa || a.d - b.d; });
    for (var i = 0; i < cands.length; i++) { var st = podeAvisar(cands[i].l.id); if (st) { mostra(cands[i].l, cands[i].d); registra(st, cands[i].l.id); return; } }
  }
  /* notificação do sistema pelo service worker (Android e app instalado no iPhone); sem ele, a do navegador */
  function notificaSistema(titulo, msg, url, tag) {
    if (G.notifica) return G.notifica(titulo, msg, url, tag);
    if (!("Notification" in window) || Notification.permission !== "granted") return;
    var op = { body: msg, icon: "icon-192.png", badge: "icon-192.png", tag: tag, data: { url: url } };
    var direto = function () { try { new Notification(titulo, op); } catch (e) { /* sem suporte */ } };
    if (navigator.serviceWorker && navigator.serviceWorker.getRegistration) navigator.serviceWorker.getRegistration().then(function (r) { if (r && r.showNotification) r.showNotification(titulo, op); else direto(); }).catch(direto);
    else direto();
  }
  function textoDist(km) { var m = km * 1000; return m < 150 ? "pertinho" : m < 1000 ? "a " + Math.round(m / 10) * 10 + " m" : "a " + km.toFixed(1).replace(".", ",") + " km"; }
  function mostra(l, km) {
    var msg = "Vi que você está aqui perto de " + l.nome + " (" + textoDist(km) + "). Que tal passar para " + sugestao(l) + "?";
    var el = $("#perto-card"); if (!el) { el = document.createElement("div"); el.id = "perto-card"; el.setAttribute("role", "status"); document.body.appendChild(el); }
    var f = G.foto(l);
    el.innerHTML = (f ? '<img src="' + esc(f) + '" alt="">' : '<span class="aic">' + ic("pin") + "</span>") + '<div><small>' + ic("bell") + " Por perto" + (l.anunciante ? " · Patrocinado" : "") + "</small><p>" + esc(msg) + "</p>" + (l.cupom ? '<p class="cup">🎟️ ' + esc(l.cupom) + "</p>" : "") +
      '<div class="row"><a class="btn sm" href="#lugar-' + esc(l.id) + '" data-perto-fecha>Ver lugar</a><a class="btn sm ghost" target="_blank" rel="noopener" href="https://www.google.com/maps/dir/?api=1&travelmode=walking&destination=' + l.lat + "," + l.lng + '" data-perto-fecha>Ir a pé</a><button type="button" class="btn sm ghost" data-perto-fecha>Agora não</button></div></div>';
    el.hidden = false; requestAnimationFrame(function () { el.classList.add("on"); });
    if (G.medir) G.medir(l.id, "p");
    if (document.hidden) notificaSistema("Por perto: " + l.nome, msg, "./#lugar-" + l.id, "perto-" + l.id);
  }
  document.addEventListener("click", function (e) { if (!e.target.closest("[data-perto-fecha]")) return; var el = $("#perto-card"); if (el) { el.classList.remove("on"); setTimeout(function () { el.hidden = true; }, 300); } });

  /* Ao chegar perto de uma parada de um roteiro em andamento, oferece marcar como visitada. */
  function paradaPerto(c) {
    var a = meus(), mudou = false;
    a.forEach(function (r) { r.paradas.forEach(function (p) { if (p.feito || p.sugerido) return; var l = lugar(p.id); if (l && typeof l.lat === "number" && G.dist(c, l) < 0.15) { p.sugerido = true; mudou = true; G.toast("Você chegou em " + l.nome + "? Marque no seu roteiro."); } }); });
    if (mudou) salvaMeus(a);
  }

  var vigia = null;
  /* localização negada: desliga os avisos e explica como liberar */
  function erroLocal(er) {
    if (!er || er.code !== 1) return;
    grava("perto-ativo", false); if (vigia != null) { try { navigator.geolocation.clearWatch(vigia); } catch (e) { /* ok */ } vigia = null; }
    Array.from(document.querySelectorAll("[data-perto-switch]")).forEach(function (s) { s.setAttribute("aria-checked", "false"); });
    G.toast("Para receber avisos de lugares por perto, libere a localização do CoraçãoBR nas configurações do celular.");
  }
  function liga() {
    if (vigia != null || !navigator.geolocation) return;
    try { vigia = navigator.geolocation.watchPosition(checaPosicao, erroLocal, { maximumAge: 60000, timeout: 30000, enableHighAccuracy: false }); } catch (e) { vigia = null; }
  }
  function ativar(on) {
    grava("perto-ativo", !!on);
    if (on) {
      liga();
      if ("Notification" in window && Notification.permission === "default") { try { Notification.requestPermission(); } catch (e) { /* ok */ } }
      if (navigator.geolocation) navigator.geolocation.getCurrentPosition(checaPosicao, erroLocal, { maximumAge: 60000, timeout: 30000 });
      G.toast("Avisos de lugares por perto ativados.");
    } else { if (vigia != null) { navigator.geolocation.clearWatch(vigia); vigia = null; } G.toast("Avisos de lugares por perto desligados."); }
  }
  function blocoConfig() {
    var on = permitido();
    return '<div class="panel stack" style="gap:10px"><div class="row" style="justify-content:space-between;flex-wrap:nowrap"><span><b>Avisos de lugares por perto</b><br><span class="small muted">Quando você passar perto de um restaurante, mercado ou serviço do guia, sugerimos uma visita. A qualquer hora, no máximo 4 por dia. Sua localização fica só no aparelho.</span></span><button type="button" class="switch" role="switch" aria-checked="' + on + '" data-perto-switch aria-label="Avisos de lugares por perto"><i></i></button></div></div>';
  }
  document.addEventListener("click", function (e) { var s = e.target.closest("[data-perto-switch]"); if (!s) return; var on = s.getAttribute("aria-checked") !== "true"; s.setAttribute("aria-checked", on); ativar(on); });
  function convite() {
    if (ler("perto-convidado", false) || permitido()) return "";
    return '<section class="block reveal"><div class="panel perto-convite"><span class="aic">' + ic("bell") + '</span><span><b>Quer dicas quando passar perto de um lugar bom?</b><small class="muted">A gente avisa sobre restaurantes, mercados e serviços brasileiros por perto.</small></span><div class="row"><button type="button" class="btn sm" data-perto-sim>Ativar</button><button type="button" class="btn sm ghost" data-perto-nao>Agora não</button></div></div></section>';
  }
  document.addEventListener("click", function (e) {
    if (e.target.closest("[data-perto-sim]")) { grava("perto-convidado", true); ativar(true); var s = e.target.closest("section"); if (s) s.remove(); }
    if (e.target.closest("[data-perto-nao]")) { grava("perto-convidado", true); var s2 = e.target.closest("section"); if (s2) s2.remove(); }
  });
  if (permitido()) setTimeout(liga, 1500);

  G.views["meus-roteiros"] = viewMeusRoteiros;
  G.views["meu-roteiro"] = viewMeuRoteiro;
  /* Teste do painel master: mostra o aviso "Por perto" de verdade (cartão na tela + notificação no celular), sem gastar o limite diário. */
  function teste() {
    var c = G.cid ? G.cid() : { lat: 32.7767, lng: -96.797 };
    var ls = (G.todosLugares ? G.todosLugares() : G.lugares()).filter(function (l) { return typeof l.lat === "number" && l.tipo === "estabelecimento"; });
    var l = ls.filter(function (x) { return x.anunciante; })[0] || ls.sort(function (a, b) { return G.dist(c, a) - G.dist(c, b); })[0];
    if (!l) return Promise.resolve({ ok: false, msg: "Nenhum lugar no guia para o teste." });
    mostra(l, 0.4);
    var msg = "Vi que você está aqui perto de " + l.nome + " (" + textoDist(0.4) + "). Que tal passar para " + sugestao(l) + "?";
    return Promise.resolve(notificaSistema("Por perto: " + l.nome, msg, "./#lugar-" + l.id, "teste-perto")).then(function (ok) { return { ok: true, sistema: !!ok, lugar: l.nome }; });
  }
  window.Jornada = { teste: teste, checaPosicao: checaPosicao, adotar: adotar, botaoQuero: botaoQuero, blocoConfig: blocoConfig, convite: convite, meus: meus, progresso: progresso };
})();
