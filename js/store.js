/* Camada de dados do Guia.
   Três modos, mesma API:
   - "servidor": hospedado com a pasta api/ (PHP), usa contas com e-mail e senha e o banco do próprio servidor.
   - "nuvem": publicado como Artifact, usa o banco compartilhado (db) e o armazenamento de fotos (assets).
   - "local": aberto fora do Artifact, usa IndexedDB do navegador e carrega data/seed.json na primeira vez.
   Trocar por um backend próprio (Supabase, Firebase, API) significa reescrever só este arquivo. */
(function () {
  "use strict";
  var COLS = ["lugares", "avaliacoes", "anuncios", "config", "fluxos", "avisos", "metricas", "anunciantes", "classificados", "alertas", "cupons", "interesse", "perfis", "parceiros", "respostas", "posts", "curtidas", "seguindo", "pagamentos"];
  /* Coleções "por pessoa": na nuvem cada pessoa grava só o próprio documento (id = seu id de usuário), com os itens dentro de "itens".
     As regras do banco impedem escrever no documento de outra pessoa. Aqui cada item vira um registro com id "<dono>~<chave>". */
  var POR_PESSOA = ["avaliacoes", "fluxos", "avisos", "metricas", "anunciantes", "classificados", "cupons", "interesse", "perfis", "respostas", "posts", "curtidas", "seguindo"];
  var brutos = {}; POR_PESSOA.forEach(function (c) { brutos[c] = new Map(); });
  var ID_OK = /^[\w-]{1,120}(~[\w.|-]{1,160})?$/;
  function txt(v) { return v == null ? "" : typeof v === "string" ? v : typeof v === "number" ? String(v) : ""; }
  function num(v) { var n = Number(v); return v === "" || v == null || !isFinite(n) ? null : n; }
  /* Corrige documentos malformados para que um registro ruim não quebre a página de todo mundo. */
  function normaliza(col, o) {
    if (!o || typeof o !== "object") return null;
    if (col === "lugares" || col === "anunciantes") {
      ["nome", "categoria", "tipo", "endereco", "cidade", "bairro", "regiao", "descricao", "historia", "dica", "horario", "quando", "dataInicio", "dataFim", "preco", "telefone", "whatsapp", "instagram", "facebook", "site", "telegram", "x", "linkedin", "catalogo", "catalogoNome"].forEach(function (k) { if (o[k] != null && typeof o[k] !== "string") o[k] = txt(o[k]); });
      if (!o.nome) return null;
      o.lat = num(o.lat); o.lng = num(o.lng);
      ["precoMin", "precoMax", "notaCuradoria"].forEach(function (k) { if (o[k] != null) o[k] = num(o[k]); });
      o.fotos = Array.isArray(o.fotos) ? o.fotos.filter(function (f) { return f && typeof f === "object" && typeof f.src === "string"; }) : [];
      o.fotos.forEach(function (f) { if (typeof f.credito === "string") f.credito = f.credito.replace(/(Unknown author\s*)+/gi, "autor desconhecido").trim(); });
      if (o.menu != null && !Array.isArray(o.menu)) delete o.menu;
      if (o.cardapioPaginas != null) o.cardapioPaginas = Array.isArray(o.cardapioPaginas) ? o.cardapioPaginas.filter(function (x) { return typeof x === "string"; }).slice(0, 16) : [];
      if (o.cardapioLink != null && typeof o.cardapioLink !== "string") delete o.cardapioLink;
      if (Array.isArray(o.menu)) o.menu = o.menu.filter(function (m) { return m && typeof m === "object"; });
      if (o.semana != null && !(Array.isArray(o.semana) && o.semana.length === 7 && o.semana.every(function (d) { return d == null || (Array.isArray(d) && d.every(function (x) { return Array.isArray(x) && x.length === 2 && isFinite(x[0]) && isFinite(x[1]); })); }))) delete o.semana;
      if (o.horas != null) { if (typeof o.horas !== "object" || Array.isArray(o.horas)) delete o.horas; else Object.keys(o.horas).forEach(function (k) { var v = o.horas[k]; o.horas[k] = Array.isArray(v) ? v.filter(function (x) { return x && typeof x === "object"; }) : []; }); }
      if (o.categoria === undefined) o.categoria = "";
    }
    if (col === "avaliacoes") { var e = Math.round(Number(o.estrelas)); if (!(e >= 1)) return null; o.estrelas = Math.min(5, e); o.nome = txt(o.nome).slice(0, 60); o.texto = txt(o.texto).slice(0, 1200); o.lugarId = txt(o.lugarId); o.tipo = o.tipo === "experiencia" || o.tipo === "parceiro" ? o.tipo : ""; o.roteiro = txt(o.roteiro).slice(0, 60); o.dica = txt(o.dica).slice(0, 160); o.quando = txt(o.quando).slice(0, 7); o.parceiro = txt(o.parceiro).slice(0, 80); }
    if (col === "fluxos") { if (o.nivel === "baixo") o.nivel = "pouco"; if (["pouco", "medio", "alto"].indexOf(o.nivel) < 0) return null; o.lugarId = txt(o.lugarId); }
    if (col === "classificados") { o.titulo = txt(o.titulo).slice(0, 90); o.texto = txt(o.texto).slice(0, 800); o.tipo = txt(o.tipo); o.cidade = txt(o.cidade).slice(0, 40); o.whatsapp = txt(o.whatsapp).replace(/[^\d+]/g, "").slice(0, 18); o.preco = num(o.preco); if (!o.titulo) return null; }
    if (col === "alertas") { o.titulo = txt(o.titulo).slice(0, 120); o.texto = txt(o.texto).slice(0, 600); o.tipo = txt(o.tipo); if (!o.titulo) return null; }
    if (col === "posts") { o.texto = txt(o.texto).slice(0, 1000); o.tipo = txt(o.tipo).slice(0, 20); o.lugarId = txt(o.lugarId); o.link = txt(o.link).slice(0, 300); o.fotos = Array.isArray(o.fotos) ? o.fotos.filter(function (f) { return typeof f === "string"; }).slice(0, 4) : []; o.criadoEm = txt(o.criadoEm); if (!o.lugarId || (!o.texto && !o.fotos.length)) return null; }
    if (col === "curtidas") { o.p = txt(o.p); if (!o.p) return null; }
    if (col === "seguindo") { o.l = txt(o.l); if (!o.l) return null; }
    if (col === "metricas") { ["v", "r", "c", "p"].forEach(function (k) { o[k] = Math.max(0, Math.min(50, Math.floor(Number(o[k]) || 0))); }); }
    return o;
  }
  /* Expande um documento da nuvem em registros. Documentos antigos (sem "itens") continuam como estão. */
  function expande(col, id, data, m) {
    if (!ID_OK.test(id)) return;
    if (POR_PESSOA.indexOf(col) >= 0 && data && data.itens && typeof data.itens === "object") {
      brutos[col].set(id, data.itens);
      Object.keys(data.itens).forEach(function (k) {
        var o = normaliza(col, Object.assign({}, data.itens[k])); if (!o) return;
        o.id = id + "~" + k; o._dono = id; if (ID_OK.test(o.id)) m.set(o.id, o);
      });
      return;
    }
    var o = normaliza(col, Object.assign({}, data)); if (!o) return;
    o.id = id; m.set(id, o);
  }
  var cache = {}, loaded = {};
  COLS.forEach(function (c) { cache[c] = new Map(); loaded[c] = false; });
  var subs = new Set();
  var st = { modo: "local", pronto: false, aviso: "", podeFotosNuvem: false };
  var db = null, assets = null, user = null, uid = null;
  var chains = new Map();

  /* Coleções que a página acompanha ao vivo. "metricas" cresce rápido e só é lida sob demanda (Store.consultar). */
  var VIVAS = COLS.filter(function (c) { return c !== "metricas" && c !== "cupons" && c !== "perfis" && c !== "respostas"; });
  function emit(col) { subs.forEach(function (fn) { try { fn(col); } catch (e) { console.error(e); } }); }
  function clean(o) { return JSON.parse(JSON.stringify(o)); }

  /* ---------- IndexedDB (modo local) ---------- */
  var idb = null;
  function idbOpen() {
    return new Promise(function (res, rej) {
      var r = indexedDB.open("guia-texas", 1);
      r.onupgradeneeded = function () { r.result.createObjectStore("docs"); };
      r.onsuccess = function () { res(r.result); };
      r.onerror = function () { rej(r.error); };
    });
  }
  function idbTx(mode, fn) {
    return new Promise(function (res, rej) {
      var tx = idb.transaction("docs", mode), out = fn(tx.objectStore("docs"));
      tx.oncomplete = function () { res(out && out.result); };
      tx.onerror = function () { rej(tx.error); };
    });
  }
  function idbAll() {
    return new Promise(function (res, rej) {
      var tx = idb.transaction("docs", "readonly"), s = tx.objectStore("docs");
      var k = s.getAllKeys(), v = s.getAll();
      tx.oncomplete = function () { res(k.result.map(function (key, i) { return [key, v.result[i]]; })); };
      tx.onerror = function () { rej(tx.error); };
    });
  }

  /* Carrega a lista inicial de lugares. Aberto direto do computador (file://), o navegador bloqueia fetch:
     nesse caso a mesma lista vem de data/seed.js, que define window.SEED. */
  function carregaSeed() {
    if (window.SEED) return Promise.resolve(window.SEED);
    var viaFetch = location.protocol === "file:" ? Promise.reject() : fetch("data/seed.json", { cache: "no-store" }).then(function (r) { if (!r.ok) throw new Error(); return r.json(); });
    return viaFetch.catch(function () {
      return new Promise(function (res) {
        var sc = document.createElement("script"); sc.src = "data/seed.js";
        sc.onload = function () { res(window.SEED || null); }; sc.onerror = function () { res(null); };
        document.head.appendChild(sc);
      });
    });
  }
  async function bootLocal() {
    st.modo = "local";
    try {
      idb = await idbOpen();
      var rows = await idbAll(), meta = null;
      rows.forEach(function (r) {
        var p = String(r[0]).split("/");
        if (p[0] === "_meta") meta = r[1];
        else if (cache[p[0]]) { var o = normaliza(p[0], r[1]); if (o) cache[p[0]].set(p[1], o); }
      });
      var seed = null;
      seed = await carregaSeed();
      if (seed && (!meta || meta.versao !== seed.versao)) {
        await idbTx("readwrite", function (s) {
          (seed.lugares || []).forEach(function (l) { s.put(l, "lugares/" + l.id); var o = normaliza("lugares", Object.assign({}, l)); if (o) cache.lugares.set(l.id, o); });
          s.put({ versao: seed.versao }, "_meta/seed");
        });
      }
    } catch (e) {
      st.aviso = "Este navegador bloqueou o armazenamento local. O guia abre, mas nada do que você alterar fica salvo.";
      try {
        var sd = (await carregaSeed()) || {};
        (sd.lugares || []).forEach(function (l) { cache.lugares.set(l.id, l); });
      } catch (e2) { /* nada a mostrar */ }
    }
    COLS.forEach(function (c) { loaded[c] = true; });
    st.pronto = true; emit();
  }

  /* Só lugares e configurações seguram a abertura do guia. As outras coleções chegam depois, sem travar a página;
     uma coleção que não responder em 8 s é tratada como vazia até responder. */
  var ESSENCIAIS = ["lugares", "config"];
  function bootCloud() {
    st.modo = "nuvem";
    var timer = setTimeout(function () {
      if (!st.pronto) { st.aviso = "Os dados ainda não responderam. Verifique a conexão; a página atualiza sozinha quando chegarem."; emit(); }
    }, 12000);
    loaded.metricas = true; loaded.cupons = true; loaded.perfis = true; loaded.respostas = true;
    function confere() {
      if (ESSENCIAIS.every(function (k) { return loaded[k]; })) { if (!st.pronto || st.aviso) { clearTimeout(timer); st.aviso = ""; } st.pronto = true; }
    }
    VIVAS.forEach(function (c) {
      var espera = setTimeout(function () { if (!loaded[c]) { loaded[c] = true; console.warn("Coleção sem resposta:", c); confere(); emit(c); } }, 8000);
      try {
        db.collection(c).limit(1000).onSnapshot(function (snap) {
          var m = new Map();
          if (brutos[c]) brutos[c] = new Map();
          (snap.docs || []).forEach(function (d) { try { expande(c, d.id, d.data(), m); } catch (e) { console.warn("Documento ignorado:", c, d.id, e); } });
          cache[c] = m; loaded[c] = true; clearTimeout(espera);
          confere(); emit(c);
        }, function (err) {
          clearTimeout(espera); loaded[c] = true; console.warn("Coleção com erro:", c, err && err.code);
          if (ESSENCIAIS.indexOf(c) >= 0) { clearTimeout(timer); st.pronto = true; st.aviso = "Não foi possível ler os dados agora (" + (err && err.code || "erro") + ")."; }
          confere(); emit();
        });
      } catch (e) { clearTimeout(espera); loaded[c] = true; console.warn("Falha ao abrir:", c, e); confere(); }
    });
  }


  /* ---------- servidor próprio (api/ em PHP) ----------
     Imita a interface do banco do Artifact (collection/doc/onSnapshot) para o resto do código não mudar.
     As permissões são decididas no servidor; aqui só se repassa o pedido. */
  var csrf = "", ouvintes = {}, versoes = {}, syncT = null, syncando = null;
  function api(acao, corpo, extra) {
    var q = "api/?acao=" + acao + (extra || "");
    var op = { credentials: "same-origin", headers: { "X-CSRF": csrf } };
    if (corpo instanceof FormData) { op.method = "POST"; op.body = corpo; }
    else if (corpo) { op.method = "POST"; op.headers["Content-Type"] = "application/json"; op.body = JSON.stringify(corpo); }
    return fetch(q, op).then(function (r) {
      return r.json().catch(function () { return { ok: false, erro: "O servidor não respondeu como esperado." }; }).then(function (j) {
        if (!j || !j.ok) { var e = new Error((j && j.erro) || "Não foi possível concluir agora."); e.status = r.status; throw e; }
        if (j.csrf) csrf = j.csrf;
        return j;
      });
    });
  }
  function snap(docs) { return { docs: (docs || []).map(function (d) { return { id: d.id, data: function () { return d.data || {}; } }; }) }; }
  function sincroniza() {
    if (syncando) return syncando;
    var v = {}; Object.keys(ouvintes).forEach(function (c) { v[c] = versoes[c] == null ? -1 : versoes[c]; });
    syncando = api("sync", null, "&v=" + encodeURIComponent(JSON.stringify(v))).then(function (j) {
      Object.keys(j.cols || {}).forEach(function (c) { versoes[c] = j.cols[c].v; var sn = snap(j.cols[c].docs); (ouvintes[c] || []).forEach(function (o) { o.ok(sn); }); });
    }).catch(function (e) { Object.keys(ouvintes).forEach(function (c) { if (versoes[c] == null) (ouvintes[c] || []).forEach(function (o) { o.err && o.err({ code: e.status || "rede" }); }); }); })
      .then(function () { syncando = null; });
    return syncando;
  }
  function agendaSync(ms) { clearTimeout(syncT); syncT = setTimeout(function () { sincroniza().then(function () { agendaSync(document.hidden ? 60000 : 15000); }); }, ms == null ? 15000 : ms); }
  document.addEventListener("visibilitychange", function () { if (st.servidor && !document.hidden) agendaSync(0); });
  var dbServidor = {
    collection: function (c) {
      var q = {
        limit: function () { return q; },
        onSnapshot: function (ok, err) { (ouvintes[c] = ouvintes[c] || []).push({ ok: ok, err: err }); agendaSync(0); return function () {}; },
        doc: function (id) {
          return {
            get: function () { return api("doc", null, "&col=" + c + "&id=" + encodeURIComponent(id)).then(function (j) { return { exists: !!j.existe, data: function () { return j.data || {}; } }; }); },
            set: function (body) { return api("gravar", { col: c, id: id, data: body }).then(function () { agendaSync(150); }); },
            delete: function () { return api("apagar", { col: c, id: id }).then(function () { agendaSync(150); }); }
          };
        },
        where: function (f, op, val) { var w = { limit: function () { return w; }, get: function () { return api("lista", null, "&col=" + c).then(function (j) { return snap((j.docs || []).filter(function (d) { return d.data && d.data[f] === val; })); }); } }; return w; },
        get: function () { return api("lista", null, "&col=" + c).then(function (j) { return snap(j.docs); }); }
      };
      return q;
    }
  };
  var assetsServidor = {
    upload: function (blob) { var fd = new FormData(); fd.append("foto", blob, "foto.jpg"); return api("foto", fd); },
    delete: function (id) { return api("apagar_foto", { id: id }); }
  };
  async function tentaServidor() {
    if (location.protocol === "file:") return false;
    try {
      var j = await api("sessao");
      st.servidor = true; st.sessao = j; st.visitante = j.visitante;
      var c = j.conta;
      db = dbServidor; assets = c && (c.papel === "anunciante" || c.papel === "master") ? assetsServidor : null;
      uid = c ? c.uid : null; st.admin = !!(c && c.papel === "master"); st.nome = c ? c.nome : ""; st.papel = c ? c.papel : "";
      st.podeFotosNuvem = !!assets;
      bootCloud();
      return true;
    } catch (e) { return false; }
  }

  async function boot() {
    if (await tentaServidor()) return;
    var cl = window.claude;
    if (cl && typeof cl.use === "function") {
      try { db = await cl.use("db"); } catch (e) { db = null; }
      if (db) {
        try { assets = await cl.use("assets"); } catch (e) { assets = null; }
        try { user = await cl.use("user"); uid = user ? await user.id() : null; } catch (e) { user = null; }
        try { st.admin = user ? !!(await user.canEdit()) : false; } catch (e) { st.admin = false; }
        try { var eu = user ? await user.me() : null; st.nome = eu && eu.name ? String(eu.name) : ""; } catch (e) { st.nome = ""; }
        st.podeFotosNuvem = !!assets;
        bootCloud();
        return;
      }
    }
    bootLocal();
  }

  /* ---------- escrita ---------- */
  function serial(key, job) {
    var prev = chains.get(key) || Promise.resolve();
    var next = prev.catch(function () {}).then(job);
    chains.set(key, next);
    return next;
  }
  /* Grava um item dentro do documento da pessoa (nuvem). Só o dono escreve; o administrador pode moderar. */
  async function gravaItem(col, id, body, apagar) {
    var i = id.indexOf("~"), dono = id.slice(0, i), chave = id.slice(i + 1);
    return serial(col + "/" + dono, async function () {
      var ref = db.collection(col).doc(dono), itens = brutos[col].get(dono);
      if (!itens) { try { var sn = await ref.get(); itens = (sn.exists && sn.data().itens) || {}; } catch (e) { itens = {}; } }
      itens = Object.assign({}, itens);
      if (apagar) delete itens[chave]; else { delete body._dono; itens[chave] = body; }
      if (col === "metricas") { var lim = new Date(Date.now() - 31 * 864e5).toISOString().slice(0, 10); Object.keys(itens).forEach(function (k) { if ((itens[k].dia || "") < lim) delete itens[k]; }); }
      brutos[col].set(dono, itens);
      if (!Object.keys(itens).length) await ref.delete(); else await ref.set({ itens: itens, atualizadoEm: new Date().toISOString() });
      if (VIVAS.indexOf(col) < 0) { if (apagar) cache[col].delete(id); else cache[col].set(id, Object.assign({ id: id, _dono: dono }, body)); }
    });
  }
  /* Id para um item novo da pessoa: na nuvem leva o id do usuário na frente. */
  function idProprio(base) { return st.modo === "nuvem" && uid ? uid + "~" + base : base; }
  function set(col, id, data) {
    var body = clean(data); delete body.id; delete body._dono;
    if (col === "lugares" && (cache.anunciantes.has(id) || (st.modo === "nuvem" && !st.admin))) col = "anunciantes";
    if (!ID_OK.test(id)) return Promise.reject(new Error("Identificador inválido."));
    if (st.modo === "nuvem" && POR_PESSOA.indexOf(col) >= 0 && id.indexOf("~") > 0) return gravaItem(col, id, body, false);
    if (st.modo === "nuvem" && POR_PESSOA.indexOf(col) >= 0 && !st.admin) {
      if (!uid && st.servidor && col === "metricas" && st.visitante) return gravaItem(col, st.visitante + "~" + id, body, false);
      if (!uid) return Promise.reject(new Error("Entre na sua conta para continuar: toque em Conta, no menu."));
      return gravaItem(col, uid + "~" + id, body, false);
    }
    return serial(col + "/" + id, async function () {
      var o = Object.assign({ id: id }, body);
      if (st.modo === "nuvem") { await db.collection(col).doc(id).set(body); if (VIVAS.indexOf(col) < 0) cache[col].set(id, o); return; }
      cache[col].set(id, o);
      if (idb) await idbTx("readwrite", function (s) { s.put(o, col + "/" + id); });
      emit(col);
    });
  }
  function del(col, id) {
    if (col === "lugares" && cache.anunciantes.has(id)) col = "anunciantes";
    if (st.modo === "nuvem" && POR_PESSOA.indexOf(col) >= 0 && id.indexOf("~") > 0) return gravaItem(col, id, null, true);
    return serial(col + "/" + id, async function () {
      if (st.modo === "nuvem") { await db.collection(col).doc(id).delete(); return; }
      cache[col].delete(id);
      if (idb) await idbTx("readwrite", function (s) { s.delete(col + "/" + id); });
      emit(col);
    });
  }

  /* ---------- fotos ---------- */
  function resize(file, max) {
    return new Promise(function (res, rej) {
      var url = URL.createObjectURL(file), img = new Image();
      img.onload = function () {
        var k = Math.min(1, max / Math.max(img.width, img.height));
        var c = document.createElement("canvas");
        c.width = Math.round(img.width * k); c.height = Math.round(img.height * k);
        c.getContext("2d").drawImage(img, 0, 0, c.width, c.height);
        URL.revokeObjectURL(url);
        c.toBlob(function (b) { b ? res({ blob: b, canvas: c }) : rej(new Error("Imagem inválida")); }, "image/jpeg", 0.82);
      };
      img.onerror = function () { URL.revokeObjectURL(url); rej(new Error("Não foi possível ler a imagem")); };
      img.src = url;
    });
  }
  /* Devolve a referência a gravar em lugar.fotos[].src */
  async function salvarFoto(file) {
    var r = await resize(file, st.modo === "nuvem" ? 1600 : 1100);
    if (st.modo === "nuvem") {
      if (!assets) throw new Error("Só quem pode editar este guia envia fotos.");
      var up = await assets.upload(r.blob, { type: "image/jpeg" });
      return "asset:" + up.id;
    }
    return r.canvas.toDataURL("image/jpeg", 0.8);
  }
  async function apagarFoto(src) {
    if (st.modo === "nuvem" && assets && /^asset:/.test(src)) {
      try { await assets.delete(src.slice(6)); } catch (e) { /* já removida */ }
    }
  }
  /* Só aceita fotos do próprio guia (pasta img/, armazenamento do Artifact) ou imagens embutidas; links externos de terceiros são ignorados. */
  var FOTO_OK = /^(asset:[0-9a-f-]{8,64}$|img\/[\w.-]+\.(jpe?g|png|webp)$|fotos_eventos\/[\w-]+\/[\w.-]+\.(jpe?g|png|webp)$|data:image\/(jpeg|png|webp);base64,)/i;
  function urlFoto(src) {
    if (!src || typeof src !== "string" || !FOTO_OK.test(src)) return "";
    if (/^asset:/.test(src)) return st.servidor ? "uploads/" + src.slice(6) + ".jpg" : "/_blob/" + src.slice(6);
    return src;
  }

  window.Store = {
    estado: st,
    iniciar: boot,
    assinar: function (fn) { subs.add(fn); return function () { subs.delete(fn); }; },
    /* "lugares" inclui os anúncios que cada anunciante grava no próprio documento. */
    lista: function (col) { var a = Array.from(cache[col].values()); return col === "lugares" ? a.concat(Array.from(cache.anunciantes.values())) : a; },
    obter: function (col, id) { return cache[col].get(id) || (col === "lugares" ? cache.anunciantes.get(id) : null) || null; },
    gravar: set,
    /* Lê os documentos de uma coleção com campo == valor (na nuvem, uma consulta; localmente, filtra o que está guardado). */
    consultar: function (col, campo, valor) {
      if (st.modo === "nuvem" && db && POR_PESSOA.indexOf(col) >= 0) return db.collection(col).limit(1000).get().then(function (sn) { var m = new Map(); sn.docs.forEach(function (d) { expande(col, d.id, d.data(), m); }); return Array.from(m.values()).filter(function (o) { return o[campo] === valor; }); }).catch(function () { return []; });
      if (st.modo === "nuvem" && db) return db.collection(col).where(campo, "==", valor).limit(1000).get().then(function (sn) { return sn.docs.map(function (d) { var o = Object.assign({}, d.data()); o.id = d.id; return o; }); }).catch(function () { return []; });
      return Promise.resolve(Array.from(cache[col].values()).filter(function (o) { return o[campo] === valor; }));
    },
    apagar: del,
    novoId: function (p) { return (p || "x") + "-" + Date.now().toString(36) + Math.random().toString(36).slice(2, 6); },
    salvarFoto: salvarFoto,
    apagarFoto: apagarFoto,
    urlFoto: urlFoto,
    uid: function () { return uid; },
    idProprio: idProprio,
    /* Lê um item do documento da própria pessoa (ex.: perfis → "<uid>~app"). */
    meuItem: function (col, chave) {
      if (st.modo !== "nuvem" || !db || !uid) return Promise.resolve(cache[col] ? cache[col].get(chave) || null : null);
      return db.collection(col).doc(uid).get().then(function (sn) { var it = sn.exists && sn.data().itens; if (it) brutos[col].set(uid, it); return it && it[chave] ? it[chave] : null; }).catch(function () { return null; });
    },
    nome: function () { return st.nome || ""; },
    /* Fora do servidor e do Artifact, só quem abre os arquivos no próprio computador (file://) edita, e só neste navegador. */
    admin: function () { return st.modo !== "nuvem" ? location.protocol === "file:" : !!st.admin; },
    servidor: function () { return !!st.servidor; },
    conta: function () { return st.sessao && st.sessao.conta ? st.sessao.conta : null; },
    papel: function () { return st.papel || ""; },
    api: api,
    normaliza: normaliza
  };
})();
