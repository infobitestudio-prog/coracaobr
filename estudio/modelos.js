/* Estúdio CoraçãoBR: 30 modelos prontos e o gerador automático de criativos.
   Tudo é montado a partir do seed lido em tempo de execução (../data/seed.json). */
(function () {
  "use strict";
  var E = window.E, L = E.L;
  var T = L.text, IMG = L.image, RECT = L.rect, CIRC = L.circle, FAIXA = L.faixa, LOGO = L.logo, QR = L.qr, IC = L.icon, BADGE = L.badge;
  var M = 72;

  /* ---------- Consultas ao seed ---------- */
  function S() {
    var all = E.seed.lugares;
    function inReg(l, reg) { return !reg || reg === "todas" || E.regKey(l) === reg || (l.cidade && l.cidade.toLowerCase() === reg); }
    function score(l) { return (E.realFotos(l).length ? 10 : 0) + (l.notaCuradoria || 3) + (l.anunciante ? 0.5 : 0); }
    var api = {
      all: all,
      byId: function (id) { for (var i = 0; i < all.length; i++) if (all[i].id === id) return all[i]; return null; },
      where: function (fn, reg) { return all.filter(function (l) { return inReg(l, reg) && fn(l); }); },
      top: function (cats, n, reg, uniq) {
        var seen = {}, out = [];
        api.where(function (l) { return cats.indexOf(l.categoria) >= 0 && !l.demo; }, reg)
          .sort(function (a, b) { return score(b) - score(a); })
          .forEach(function (l) {
            var k = uniq ? l.nome.split(/[ (]/)[0].toLowerCase() + (l.nome.split(" ")[1] || "").toLowerCase() : l.id;
            if (seen[k] || out.length >= n) return; seen[k] = 1; out.push(l);
          });
        return out;
      },
      eventos: function (reg) {
        var hoje = E.hoje();
        return api.where(function (l) { return l.dataInicio && (l.dataFim || l.dataInicio) >= hoje; }, reg)
          .sort(function (a, b) { return a.dataInicio < b.dataInicio ? -1 : a.dataInicio > b.dataInicio ? 1 : 0; });
      },
      cupons: function (reg) { return api.where(function (l) { return !!l.cupom; }, reg); },
      comFotoReal: function (reg, fn) {
        return api.where(function (l) { return E.realFotos(l).length && (!fn || fn(l)); }, reg)
          .sort(function (a, b) { return score(b) - score(a); });
      },
      regioes: function () {
        var c = {};
        all.forEach(function (l) { var k = E.regKey(l); c[k] = (c[k] || 0) + 1; });
        return c;
      },
      cidades: function () {
        var c = {};
        all.forEach(function (l) { if (l.cidade) c[l.cidade] = (c[l.cidade] || 0) + 1; });
        return c;
      }
    };
    return api;
  }
  E.S = S;

  function pick(list, i) { return list.length ? list[(i || 0) % list.length] : null; }
  function fotoDe(s, ids, fallbackFn) {
    for (var i = 0; i < ids.length; i++) { var l = s.byId(ids[i]); if (l && E.foto(l)) return E.foto(l); }
    var r = s.comFotoReal(null, fallbackFn);
    return r.length ? E.foto(r[0]) : "";
  }
  function quando(l) {
    if (!l) return "";
    if (l.dataInicio) {
      var a = E.dataCurta(l.dataInicio), b = l.dataFim && l.dataFim !== l.dataInicio ? E.dataCurta(l.dataFim) : "";
      return b ? a + " a " + b : a;
    }
    return E.frase(l.quando, 60);
  }
  function lugarLinha(l) { return [l.bairro && l.bairro.length < 24 ? l.bairro : "", l.cidade].filter(Boolean).join(", "); }

  /* Rodapé padrão: logo à esquerda, endereço do site à direita */
  function foot(d, o) {
    o = o || {};
    var y = d.h - M - 50;
    d.layers.push(LOGO(M, y, 50, o.logo || "auto", { name: "Logo" }));
    if (!o.semSite) d.layers.push(T(E.site().host, d.w - M - 420, y + 8, 420, { size: 28, weight: 500, align: "right", color: o.cor || "@ink", opacity: 0.8, name: "Site", font: "Outfit" }));
    return d;
  }
  function stack(list, y, gap) { list.forEach(function (l) { E.fitText(l); l.y = y; y += l.h + (gap || 0); }); return y; }
  function chip(d, text, x, y, o) {
    o = o || {};
    var size = o.size || 30, padX = o.padX || 26, h = o.h || size * 1.9;
    var w = E.measure(o.upper ? text.toLocaleUpperCase("pt-BR") : text, o.font || "Outfit", size, o.weight || 700, o.ls || 0) + padX * 2;
    d.layers.push(RECT(x, y, w, h, o.fill || "@accent", { radius: h / 2, name: "Etiqueta" }));
    d.layers.push(T(text, x, y + (h - size * 1.15) / 2, w, { size: size, weight: o.weight || 700, align: "center", color: o.color || "@accentInk", lh: 1.15, font: o.font || "Outfit", ls: o.ls || 0, upper: !!o.upper }));
    return w;
  }

  /* =====================================================================
     30 MODELOS (15 consumidor + 15 anunciante)
     ===================================================================== */
  var MODELOS = [];
  function M_(id, titulo, publico, fn) { MODELOS.push({ id: id, titulo: titulo, publico: publico, build: fn }); }

  /* ---------- CONSUMIDOR ---------- */

  M_("churrascarias-dfw", "5 churrascarias brasileiras", "consumidor", function (s) {
    var d = E.newDoc("5 churrascarias brasileiras em Dallas", 1080, "claro");
    var list = s.top(["churrascaria"], 5, "dfw", true);
    d.layers.push(RECT(0, 0, 1080, 300, "@accent", { name: "Faixa do título" }));
    d.layers.push(T("Rodízio sem sair do Texas", M, 62, 900, { size: 32, weight: 600, color: "@soft", font: "Outfit" }));
    d.layers.push(T(list.length + " churrascarias brasileiras em Dallas e região", M, 112, 940, { size: 70, weight: 800, color: "@accentInk", lh: 1.0, font: "Bricolage Grotesque", ls: -1.5 }));
    list.forEach(function (l, i) {
      var y = 340 + i * 118;
      d.layers.push(IMG(E.foto(l), M, y, 96, 96, { mask: "circle", name: "Foto " + (i + 1) }));
      d.layers.push(T(l.nome.replace(/ Brazilian Steakhouse$/, ""), M + 124, y + 10, 700, { size: 38, weight: 700, color: "@ink", font: "Outfit" }));
      d.layers.push(T(l.cidade, M + 124, y + 58, 700, { size: 26, weight: 500, color: "@accent", font: "Outfit" }));
      if (i < list.length - 1) d.layers.push(RECT(M + 124, y + 108, 1080 - M * 2 - 124, 2, "@ink", { opacity: 0.1, name: "Linha" }));
    });
    return foot(d);
  });

  M_("evento-semana", "Evento da semana", "consumidor", function (s) {
    var ev = s.eventos()[0] || s.where(function (l) { return l.categoria === "evento"; })[0];
    var d = E.newDoc("Evento da semana", 1350, "escuro");
    d.layers.push(IMG(E.foto(ev), 0, 0, 1080, 1350, { overlay: { color: "#04341A", opacity: 0.92, grad: "down" }, name: "Foto do evento" }));
    chip(d, "Evento da semana", M, M, { fill: "#FFC20E", color: "#04341A", size: 30 });
    if (ev && ev.dataInicio) {
      var p = ev.dataInicio.split("-");
      d.layers.push(BADGE(String(+p[2]), E.MES[+p[1] - 1], 1080 - M - 170, M - 10, 170, { fill: "#FFFFFF", color: "#04341A", s1: 0.42, s2: 0.16, name: "Data" }));
    }
    var t = T(ev ? ev.nome : "Nome do evento", M, 0, 936, { size: 88, weight: 800, color: "#FFFFFF", lh: 1.0, font: "Bricolage Grotesque", ls: -2 });
    var q = T(quando(ev), M, 0, 936, { size: 34, weight: 600, color: "#FFC20E", font: "Outfit" });
    var c = T(ev ? lugarLinha(ev) : "", M, 0, 936, { size: 30, weight: 500, color: "#FFFFFF", opacity: 0.85, font: "Outfit" });
    E.fitText(t); E.fitText(q); E.fitText(c);
    stack([t, q, c], 1350 - M - 90 - (t.h + q.h + c.h + 36), 18);
    d.layers.push(t, q, c);
    return foot(d, { cor: "#FFFFFF", logo: "clara" });
  });

  M_("cupom-mes", "Cupom do mês", "consumidor", function (s) {
    var c = s.cupons()[0];
    var d = E.newDoc("Cupom do mês", 1080, "amarelo");
    d.layers.push(T("Cupom do mês", M, 70, 936, { size: 132, weight: 400, font: "Anton", color: "@ink", lh: 1, upper: true }));
    d.layers.push(RECT(M, 300, 936, 520, "@surface", { radius: 36, name: "Cupom" }));
    d.layers.push(RECT(M + 700, 330, 2, 460, "@ink", { opacity: 0, stroke: "@ink", strokeW: 4, dash: true, name: "Picote" }));
    d.layers.push(CIRC(M + 668, 268, 64, "@bg", { name: "Recorte" }));
    d.layers.push(CIRC(M + 668, 788, 64, "@bg", { name: "Recorte" }));
    d.layers.push(T(c ? c.nome : "Nome do lugar", M + 56, 350, 600, { size: 34, weight: 600, color: "@soft", font: "Outfit" }));
    d.layers.push(T(c ? c.cupom : "Seu cupom aqui", M + 56, 420, 590, { size: 66, weight: 800, color: "@surfaceInk", lh: 1.02, font: "Bricolage Grotesque", ls: -1 }));
    d.layers.push(T(c ? c.cidade : "", M + 56, 730, 600, { size: 30, weight: 500, color: "@surfaceInk", opacity: 0.7, font: "Outfit" }));
    d.layers.push(T("CUPOM", M + 712, 530, 300, { size: 64, weight: 400, font: "Anton", color: "@soft", align: "center", rot: -90, ls: 8 }));
    d.layers.push(T("Pegue no app CoraçãoBR", M, 860, 936, { size: 34, weight: 600, color: "@ink", font: "Outfit" }));
    return foot(d, { semSite: true });
  });

  M_("primeiros-30-dias", "Chegou agora? Primeiros 30 dias", "consumidor", function (s) {
    var d = E.newDoc("Chegou agora? Seus primeiros 30 dias", 1350, "verde");
    var nM = s.where(function (l) { return l.categoria === "mercado-brasileiro"; }).length;
    d.layers.push(T("Chegou agora?", M, 96, 936, { size: 132, weight: 900, font: "Fraunces", italic: true, color: "@accent", lh: 1, ls: -3 }));
    d.layers.push(T("Seus primeiros 30 dias no Texas", M, 250, 936, { size: 52, weight: 600, color: "@ink", font: "Outfit", lh: 1.1 }));
    var itens = [
      "Chip de celular e número americano",
      "Conta no banco e cartão de débito",
      "Carteira de motorista no Texas DPS",
      nM ? nM + " mercados brasileiros no guia" : "Mercado brasileiro perto de casa",
      "Perguntas da comunidade e Mural"
    ];
    itens.forEach(function (t, i) {
      var y = 420 + i * 132;
      d.layers.push(IC("check", M, y, 76, "@accentInk", { bgc: "@accent", sw: 3, name: "Check " + (i + 1) }));
      d.layers.push(T(t, M + 108, y + 14, 820, { size: 42, weight: 600, color: "@ink", font: "Outfit", lh: 1.1 }));
    });
    d.layers.push(T("Tudo em português no CoraçãoBR", M, 1110, 936, { size: 36, weight: 500, color: "@soft", font: "Outfit" }));
    return foot(d);
  });

  M_("pergunte", "Pergunte ao CoraçãoBR", "consumidor", function (s) {
    var d = E.newDoc("Pergunte ao CoraçãoBR", 1080, "escuro");
    var merc = s.where(function (l) { return l.categoria === "mercado-brasileiro"; }).slice(0, 3);
    d.layers.push(T("Pergunte ao CoraçãoBR", M, 80, 936, { size: 84, weight: 800, font: "Bricolage Grotesque", color: "@ink", lh: 1, ls: -2 }));
    d.layers.push(T("Responde em português, com o que está no guia.", M, 190, 936, { size: 34, weight: 500, color: "@ink", opacity: 0.75, font: "Outfit" }));
    d.layers.push(RECT(330, 300, 678, 130, "@accent", { radius: 40, name: "Balão pergunta" }));
    d.layers.push(T("Onde compro pão de queijo perto de Plano?", 368, 322, 610, { size: 36, weight: 600, color: "@accentInk", font: "Outfit", lh: 1.2 }));
    var resp = merc.length ? "Separei mercados brasileiros da região: " + merc.map(function (l) { return l.nome + " (" + l.cidade + ")"; }).join(", ") + "." : "Separei os mercados brasileiros mais perto de você.";
    var r = T(resp, M + 38, 492, 600, { size: 34, weight: 500, color: "@surfaceInk", font: "Outfit", lh: 1.3 });
    d.layers.push(RECT(M, 466, 680, r.h + 54, "@surface", { radius: 40, name: "Balão resposta" }));
    d.layers.push(r);
    d.layers.push(IC("chat", M, 466 + r.h + 84, 64, "@soft", { name: "Ícone" }));
    d.layers.push(T("Toque em Pergunte, no app", M + 84, 466 + r.h + 92, 800, { size: 34, weight: 600, color: "@soft", font: "Outfit" }));
    return foot(d);
  });

  M_("clube", "Clube CoraçãoBR R$ 15", "consumidor", function () {
    var d = E.newDoc("Clube CoraçãoBR R$ 15", 1350, "mata");
    d.layers.push(T("Clube CoraçãoBR", M, 92, 936, { size: 40, weight: 600, color: "@soft", font: "Outfit" }));
    d.layers.push(T("Descontos com a carteirinha digital no celular", M, 150, 936, { size: 86, weight: 800, color: "@ink", font: "Bricolage Grotesque", lh: 1.0, ls: -2 }));
    var cy = 560;
    d.layers.push(RECT(M + 40, cy, 856, 520, "#04341A", { radius: 40, rot: -4, name: "Carteirinha" }));
    d.layers.push(RECT(M + 40, cy, 856, 520, "#FFFFFF", { radius: 40, rot: 3, name: "Carteirinha frente" }));
    d.layers.push(LOGO(M + 100, cy + 64, 54, "escura", { rot: 3 }));
    d.layers.push(T("CARTEIRINHA DIGITAL", M + 104, cy + 170, 520, { size: 26, weight: 700, color: "#0B7A35", ls: 3, font: "Outfit", rot: 3 }));
    d.layers.push(T("Seu nome aqui", M + 104, cy + 214, 520, { size: 52, weight: 800, color: "#0E1311", font: "Outfit", rot: 3 }));
    d.layers.push(T("Sócio do Clube", M + 104, cy + 284, 520, { size: 30, weight: 500, color: "#0E1311", opacity: 0.6, font: "Outfit", rot: 3 }));
    d.layers.push(QR(E.site().url + "#clube", M + 620, cy + 230, 220, { rot: 3, color: "#04341A", bg: "#F3F6F2" }));
    d.layers.push(BADGE("R$ 15", "por mês", 1080 - M - 250, cy - 120, 250, { shape: "estrela", fill: "#FFC20E", color: "#04341A", s1: 0.3, s2: 0.11, rot: 8, name: "Preço" }));
    return foot(d);
  });

  M_("pets", "Pets perdidos", "consumidor", function () {
    var d = E.newDoc("Pets perdidos e achados", 1080, "amarelo");
    d.layers.push(CIRC(560, 90, 560, "@surface", { name: "Círculo" }));
    d.layers.push(IC("pata", 650, 180, 380, "@ink", { filled: true, name: "Pata" }));
    d.layers.push(T("Perdeu ou achou um pet?", M, 120, 560, { size: 92, weight: 400, font: "Anton", color: "@ink", lh: 1.02, upper: true }));
    d.layers.push(T("Publique no CoraçãoBR com foto e bairro. A comunidade brasileira ajuda a espalhar.", M, 660, 760, { size: 40, weight: 600, color: "@ink", font: "Outfit", lh: 1.25 }));
    d.layers.push(T("Plaquinha QR-DOG: quem encontra aponta a câmera e fala com você.", M, 830, 860, { size: 30, weight: 500, color: "@ink", opacity: 0.8, font: "Outfit", lh: 1.25 }));
    return foot(d, { semSite: true });
  });

  M_("novas-cidades", "Agora também em Houston, Austin e San Antonio", "consumidor", function (s) {
    var d = E.newDoc("Agora também em Houston, Austin e San Antonio", 1350, "verde");
    var regs = s.regioes(), outra = Object.keys(regs).filter(function (k) { return k !== "dfw"; });
    var fotoNova = "";
    outra.some(function (k) { var r = s.comFotoReal(k); if (r.length) { fotoNova = E.foto(r[0]); return true; } });
    if (fotoNova) d.layers.push(IMG(fotoNova, 0, 0, 1080, 1350, { overlay: { color: "#04341A", opacity: 0.78 }, name: "Foto da cidade" }));
    d.layers.push(T("O guia brasileiro do Texas cresceu", M, 110, 936, { size: 40, weight: 600, color: "@ink", font: "Outfit" }));
    d.layers.push(T("Agora também em", M, 200, 936, { size: 76, weight: 800, color: "@ink", font: "Bricolage Grotesque", ls: -2 }));
    d.layers.push(T("Houston", M - 6, 300, 1000, { size: 230, weight: 400, font: "Anton", color: "@accent", lh: 1, upper: true }));
    d.layers.push(T("Austin", M - 6, 530, 1000, { size: 230, weight: 400, font: "Anton", color: "@ink", lh: 1, upper: true }));
    d.layers.push(T("San Antonio", M - 6, 760, 1000, { size: 168, weight: 400, font: "Anton", color: "@soft", lh: 1, upper: true }));
    d.layers.push(T("Além de Dallas–Fort Worth", M, 1000, 936, { size: 36, weight: 500, color: "@ink", opacity: 0.85, font: "Outfit" }));
    return foot(d);
  });

  M_("passeio-fds", "Passeio do fim de semana", "consumidor", function (s) {
    var l = s.byId("fort-worth-stockyards") || s.comFotoReal(null, function (x) { return x.tipo === "atracao"; })[0];
    var d = E.newDoc("Passeio do fim de semana", 1350, "claro");
    d.layers.push(RECT(0, 0, 1080, 560, "@accent", { name: "Bloco" }));
    d.layers.push(IMG(E.foto(l), 150, 120, 780, 700, { rot: -3, border: { w: 22, color: "#FFFFFF" }, name: "Foto" }));
    d.layers.push(T("passeio do fim de semana", 470, 742, 560, { size: 58, weight: 700, font: "Caveat", color: "@ink", rot: -4, align: "center", lh: 0.95 }));
    var n = T(l ? l.nome : "Nome do lugar", M, 920, 936, { size: 72, weight: 800, color: "@ink", font: "Bricolage Grotesque", lh: 1, ls: -1.5 });
    var c = T(l ? lugarLinha(l) : "", M, 0, 936, { size: 32, weight: 600, color: "@accent", font: "Outfit" });
    var dc = T(l ? E.frase(l.dica, 110) : "", M, 0, 936, { size: 30, weight: 500, color: "@ink", opacity: 0.8, font: "Outfit", lh: 1.3 });
    stack([n, c, dc], 920, 14);
    d.layers.push(n, c, dc);
    return foot(d);
  });

  M_("gratis-dfw", "4 passeios grátis", "consumidor", function (s) {
    var d = E.newDoc("4 passeios grátis em Dallas–Fort Worth", 1080, "escuro");
    var list = s.comFotoReal("dfw", function (l) { return l.gratuito && l.tipo === "atracao"; }).slice(0, 4);
    d.layers.push(T(list.length + " passeios grátis em DFW", M, 70, 760, { size: 70, weight: 800, font: "Barlow Condensed", color: "@ink", upper: true, lh: 1, ls: 0.5 }));
    var g = 14, tw = (1080 - M * 2 - g) / 2, th = 360;
    list.forEach(function (l, i) {
      var x = M + (i % 2) * (tw + g), y = 210 + Math.floor(i / 2) * (th + g);
      d.layers.push(IMG(E.foto(l), x, y, tw, th, { radius: 24, overlay: { color: "#000000", opacity: 0.85, grad: "down" }, name: "Foto " + (i + 1) }));
      var nm = T(l.nome, x + 24, 0, tw - 48, { size: 34, weight: 700, color: "#FFFFFF", font: "Outfit", lh: 1.05 });
      nm.y = y + th - 54 - nm.h;
      d.layers.push(nm);
      d.layers.push(T(l.cidade, x + 24, y + th - 46, tw - 48, { size: 24, weight: 500, color: "#FFC20E", font: "Outfit" }));
    });
    d.layers.push(BADGE("GRÁTIS", "", 1080 - M - 150, 150, 150, { shape: "estrela", fill: "@soft", color: "#0E1311", s1: 0.2, rot: 10, name: "Selo" }));
    return foot(d);
  });

  M_("mural", "Mural da comunidade", "consumidor", function () {
    var d = E.newDoc("Mural da comunidade", 1080, "claro");
    d.layers.push(T("O mural da comunidade brasileira no Texas", M, 76, 936, { size: 70, weight: 800, font: "Bricolage Grotesque", color: "@ink", lh: 1.02, ls: -1.5 }));
    var notas = [["Vagas de emprego", "#FFC20E", "#04341A", -5, "mala"], ["Quartos e aluguel", "#FFFFFF", "#0E1311", 3, "casa"], ["Pets perdidos", "#34C46A", "#04341A", -2, "pata"]];
    notas.forEach(function (n, i) {
      var x = M + i * 312, y = 380 + (i % 2) * 50;
      d.layers.push(RECT(x, y, 290, 330, n[1], { rot: n[3], radius: 6, name: "Nota " + (i + 1) }));
      d.layers.push(IC(n[4], x + 30, y + 40, 72, n[2], { rot: n[3] }));
      d.layers.push(T(n[0], x + 30, y + 170, 240, { size: 42, weight: 700, font: "Outfit", color: n[2], rot: n[3], lh: 1.05 }));
    });
    d.layers.push(T("Publique e encontre no Mural do CoraçãoBR", M, 840, 936, { size: 36, weight: 600, color: "@accent", font: "Outfit" }));
    return foot(d);
  });

  M_("alertas", "Alertas no celular", "consumidor", function (s) {
    var d = E.newDoc("Alertas no celular", 1350, "mata");
    var ev = s.eventos()[0], cp = s.cupons()[0];
    d.layers.push(T("Fique sabendo antes", M, 90, 936, { size: 96, weight: 800, font: "Bricolage Grotesque", color: "@ink", lh: 1, ls: -2.5 }));
    d.layers.push(T("Ative os alertas do CoraçãoBR no celular", M, 300, 936, { size: 40, weight: 600, color: "@soft", font: "Outfit" }));
    d.layers.push(RECT(190, 420, 700, 1000, "#0E1311", { radius: 80, name: "Celular" }));
    d.layers.push(RECT(214, 444, 652, 952, "#1C2420", { radius: 60, name: "Tela" }));
    var notif = [
      ["calendario", "Evento perto de você", ev ? ev.nome : "Evento da semana"],
      ["etiqueta", "Cupom novo", cp ? cp.cupom : "Desconto em lugar brasileiro"],
      ["pata", "Pet perdido no seu bairro", "Veja a foto e ajude a achar"],
      ["chat", "Pergunte ao CoraçãoBR", "Sua resposta chegou, em português"]
    ];
    notif.forEach(function (n, i) {
      var y = 530 + i * 200;
      d.layers.push(RECT(244, y, 592, 172, "#FFFFFF", { radius: 30, name: "Alerta " + (i + 1) }));
      d.layers.push(IC(n[0], 272, y + 46, 76, "#04341A", { bgc: "#FFC20E" }));
      d.layers.push(T(n[1], 372, y + 34, 440, { size: 26, weight: 700, color: "#0B7A35", font: "Outfit" }));
      d.layers.push(T(n[2], 372, y + 74, 440, { size: 30, weight: 600, color: "#0E1311", font: "Outfit", lh: 1.15 }));
    });
    return d;
  });

  M_("agenda", "Agenda: próximos eventos (story)", "consumidor", function (s) {
    var evs = s.eventos().slice(0, 5);
    var d = E.newDoc("Agenda: próximos eventos", 1920, "verde");
    d.layers.push(IMG(E.foto(evs[0]), 0, 0, 1080, 760, { overlay: { color: "#04341A", opacity: 1, grad: "down" }, name: "Foto" }));
    d.layers.push(T("Agenda", M, 420, 936, { size: 200, weight: 400, font: "Anton", color: "@ink", upper: true, lh: 1 }));
    d.layers.push(T("Próximos eventos em Dallas–Fort Worth", M, 640, 936, { size: 42, weight: 600, color: "@accent", font: "Outfit" }));
    evs.forEach(function (ev, i) {
      var y = 780 + i * 190, p = ev.dataInicio.split("-");
      d.layers.push(RECT(M, y, 150, 150, "@accent", { radius: 24, name: "Data " + (i + 1) }));
      d.layers.push(T(String(+p[2]), M, y + 16, 150, { size: 72, weight: 800, color: "@accentInk", align: "center", font: "Outfit", lh: 1 }));
      d.layers.push(T(E.MES[+p[1] - 1], M, y + 92, 150, { size: 32, weight: 600, color: "@accentInk", align: "center", font: "Outfit", upper: true, ls: 2 }));
      d.layers.push(T(ev.nome, M + 186, y + 18, 750, { size: 40, weight: 700, color: "@ink", font: "Outfit", lh: 1.05 }));
      d.layers.push(T(ev.cidade, M + 186, y + 104, 750, { size: 28, weight: 500, color: "@ink", opacity: 0.75, font: "Outfit" }));
    });
    return foot(d);
  });

  M_("saudade", "Saudade do Brasil", "consumidor", function (s) {
    var d = E.newDoc("Saudade do Brasil tem endereço", 1080, "amarelo");
    var list = s.top(["mercado-brasileiro", "acai-cafe", "restaurante-brasileiro"], 3, "dfw", true);
    d.layers.push(T("Saudade do Brasil tem endereço", M, 70, 936, { size: 96, weight: 900, font: "Fraunces", color: "@ink", lh: 0.98, ls: -2 }));
    var w = (1080 - M * 2 - 28) / 3;
    list.forEach(function (l, i) {
      var x = M + i * (w + 14);
      d.layers.push(IMG(E.foto(l), x, 330, w, 400, { radius: 200, name: "Foto " + (i + 1) }));
      d.layers.push(T(l.nome, x, 760, w, { size: 30, weight: 700, color: "@ink", align: "center", font: "Outfit", lh: 1.1 }));
      d.layers.push(T(l.cidade, x, 0, w, { size: 24, weight: 500, color: "@soft", align: "center", font: "Outfit" }));
      var last = d.layers[d.layers.length - 1], nm = d.layers[d.layers.length - 2];
      E.fitText(nm); last.y = 760 + nm.h + 8;
    });
    return foot(d, { semSite: true });
  });

  M_("dica-guia", "Dica do guia", "consumidor", function (s) {
    var l = s.byId("klyde-warren-park") || s.comFotoReal(null, function (x) { return x.dica && x.dica.length > 80; })[0];
    var d = E.newDoc("Dica do guia", 1350, "claro");
    d.layers.push(IMG(E.foto(l), 0, 0, 1080, 640, { name: "Foto" }));
    chip(d, "Dica do guia", M, 600, { size: 32, h: 76 });
    d.layers.push(T("“", 1080 - M - 160, 640, 160, { size: 260, weight: 900, font: "Fraunces", color: "@soft", align: "right", lh: 1, name: "Aspas" }));
    var q = T(l ? E.frase(l.dica, 170) : "Escreva a dica aqui", M, 740, 936, { size: 54, weight: 500, italic: true, font: "Fraunces", color: "@ink", lh: 1.22 });
    var n = T(l ? l.nome + ", " + l.cidade : "", M, 0, 936, { size: 30, weight: 700, color: "@ink", opacity: 0.7, font: "Outfit" });
    stack([q, n], 760, 30);
    d.layers.push(q, n);
    return foot(d);
  });

  /* ---------- ANUNCIANTE ---------- */

  M_("anuncie-50", "Anuncie: 3 anúncios por R$ 50", "anunciante", function () {
    var d = E.newDoc("Anuncie: 3 anúncios por R$ 50", 1080, "amarelo");
    d.layers.push(T("Seu negócio no guia dos brasileiros no Texas", M, 76, 936, { size: 34, weight: 600, color: "@ink", font: "Outfit", lh: 1.15 }));
    d.layers.push(T("3 anúncios", M - 4, 190, 1000, { size: 220, weight: 400, font: "Anton", color: "@ink", upper: true, lh: 1 }));
    d.layers.push(T("por R$ 50 por mês", M, 430, 936, { size: 84, weight: 800, font: "Bricolage Grotesque", color: "@soft", ls: -2 }));
    for (var i = 0; i < 3; i++) {
      var x = M + i * 70, y = 600 + i * 26;
      d.layers.push(RECT(x, y, 380, 230, "@surface", { radius: 26, rot: -6 + i * 4, name: "Anúncio " + (i + 1) }));
      d.layers.push(RECT(x + 28, y + 30, 120, 120, "#0B7A35", { radius: 18, rot: -6 + i * 4, opacity: 0.18 + i * 0.25 }));
    }
    d.layers.push(T("Pagamento por Pix. Pacotes somam.", 690, 690, 320, { size: 36, weight: 700, color: "@ink", font: "Outfit", lh: 1.2 }));
    return foot(d, { semSite: true });
  });

  M_("pacotes-somam", "Pacotes somam", "anunciante", function () {
    var d = E.newDoc("Pacotes somam", 1080, "claro");
    d.layers.push(T("Precisa de mais espaço? Os pacotes somam.", M, 80, 936, { size: 72, weight: 800, font: "Bricolage Grotesque", color: "@ink", lh: 1.02, ls: -1.5 }));
    [[1, 3, 50], [2, 6, 100], [3, 9, 150]].forEach(function (r, i) {
      var y = 340 + i * 180;
      d.layers.push(RECT(M, y, 936, 156, i === 2 ? "@accent" : "@surface", { radius: 28, name: "Linha " + (i + 1) }));
      var ink = i === 2 ? "@accentInk" : "@surfaceInk";
      d.layers.push(T(r[0] + (r[0] > 1 ? " pacotes" : " pacote"), M + 40, y + 52, 300, { size: 40, weight: 600, color: ink, font: "Outfit" }));
      d.layers.push(T(r[1] + " anúncios", M + 330, y + 46, 330, { size: 48, weight: 800, color: ink, font: "Outfit" }));
      d.layers.push(T("R$ " + r[2], M + 640, y + 38, 260, { size: 64, weight: 400, font: "Anton", color: i === 2 ? "@soft" : "@accent", align: "right" }));
    });
    d.layers.push(T("Cada pacote: R$ 50 por mês, 3 anúncios", M, 900, 936, { size: 30, weight: 500, color: "@ink", opacity: 0.75, font: "Outfit" }));
    return foot(d, { semSite: true });
  });

  M_("verificado", "Selo Verificado R$ 30", "anunciante", function () {
    var d = E.newDoc("Selo Verificado", 1080, "verde");
    d.layers.push(CIRC(560, 120, 440, "@surface", { name: "Halo" }));
    d.layers.push(IC("escudo", 630, 190, 300, "@accent", { sw: 1.6, name: "Escudo" }));
    d.layers.push(T("Selo Verificado", M, 140, 520, { size: 108, weight: 400, font: "Anton", color: "@ink", upper: true, lh: 1 }));
    d.layers.push(T("Mais confiança para quem procura seu negócio em português.", M, 640, 820, { size: 48, weight: 700, color: "@ink", font: "Outfit", lh: 1.15 }));
    d.layers.push(BADGE("R$ 30", "", M, 790, 190, { fill: "@accent", color: "@accentInk", s1: 0.3, name: "Preço" }));
    d.layers.push(T("Peça no painel do anunciante", M + 220, 860, 700, { size: 34, weight: 600, color: "@soft", font: "Outfit" }));
    return d;
  });

  M_("impulsione", "Impulsione 7 dias", "anunciante", function () {
    var d = E.newDoc("Impulsione 7 dias", 1350, "escuro");
    d.layers.push(FAIXA(-40, 520, 1160, 300, "@accent", { rot: -8, skew: 0, name: "Faixa" }));
    d.layers.push(T("Apareça no topo", M, 110, 936, { size: 46, weight: 600, color: "@soft", font: "Outfit" }));
    d.layers.push(T("Impulsione seu anúncio", M, 180, 936, { size: 108, weight: 800, font: "Bricolage Grotesque", color: "@ink", lh: 0.98, ls: -3 }));
    d.layers.push(T("7 dias", 140, 540, 900, { size: 240, weight: 400, font: "Anton", color: "@accentInk", upper: true, rot: -8, lh: 1 }));
    d.layers.push(IC("foguete", 840, 860, 170, "@soft", { name: "Foguete" }));
    d.layers.push(BADGE("R$ 25", "7 dias", M, 900, 230, { fill: "@soft", color: "#0E1311", s1: 0.32, s2: 0.12, name: "Preço" }));
    return foot(d);
  });

  M_("destaque-mural", "Destaque no Mural R$ 10", "anunciante", function () {
    var d = E.newDoc("Destaque no Mural", 1080, "amarelo");
    d.layers.push(T("Destaque no Mural", M, 70, 936, { size: 112, weight: 400, font: "Anton", color: "@ink", upper: true, lh: 1 }));
    d.layers.push(T("Seu post fica em evidência para a comunidade.", M, 200, 936, { size: 40, weight: 600, color: "@ink", font: "Outfit" }));
    d.layers.push(RECT(M + 20, 330, 400, 300, "@surface", { rot: -4, radius: 8, opacity: 0.7, name: "Post comum" }));
    d.layers.push(RECT(M + 20, 660, 400, 200, "@surface", { rot: 2, radius: 8, opacity: 0.7, name: "Post comum" }));
    d.layers.push(RECT(490, 330, 520, 520, "@surface", { radius: 12, stroke: "@ink", strokeW: 12, rot: 2, name: "Post em destaque" }));
    d.layers.push(IC("megafone", 540, 380, 100, "@soft", { rot: 2 }));
    d.layers.push(T("Seu post aqui", 540, 520, 420, { size: 56, weight: 800, color: "@surfaceInk", font: "Outfit", rot: 2 }));
    d.layers.push(BADGE("R$ 10", "", 870, 780, 190, { shape: "estrela", fill: "@ink", color: "@bg", s1: 0.3, rot: -10, name: "Preço" }));
    return foot(d, { semSite: true });
  });

  M_("pix", "Pix na hora", "anunciante", function () {
    var d = E.newDoc("Pix na hora", 1080, "mata");
    d.layers.push(IC("pix", 620, 80, 400, "@soft", { filled: true, opacity: 0.95, name: "Pix" }));
    d.layers.push(T("Pix na hora", M, 470, 936, { size: 168, weight: 400, font: "Anton", color: "@ink", upper: true, lh: 1 }));
    d.layers.push(T("Pague seu pacote de anúncios por Pix, sem cartão internacional.", M, 680, 860, { size: 44, weight: 600, color: "@ink", font: "Outfit", lh: 1.2 }));
    return foot(d);
  });

  M_("avalie-qr", "QR Avalie-nos", "anunciante", function () {
    var d = E.newDoc("QR Avalie-nos", 1350, "claro");
    d.layers.push(T("Um QR no balcão. Avaliações no seu perfil.", M, 90, 936, { size: 84, weight: 800, font: "Bricolage Grotesque", color: "@ink", lh: 1.0, ls: -2 }));
    d.layers.push(RECT(220, 420, 640, 780, "#04341A", { radius: 40, name: "Display" }));
    d.layers.push(T("Avalie-nos", 220, 480, 640, { size: 76, weight: 800, color: "#FFFFFF", align: "center", font: "Outfit" }));
    d.layers.push(T("no CoraçãoBR", 220, 570, 640, { size: 40, weight: 600, color: "#FFC20E", align: "center", font: "Outfit" }));
    d.layers.push(QR(E.site().url, 340, 660, 400, { color: "#04341A", bg: "#FFFFFF", radius: 24 }));
    d.layers.push(LOGO(380, 1100, 50, "clara"));
    d.layers.push(T("Peça seu QR no painel do anunciante", M, 1236, 936, { size: 32, weight: 600, align: "center", color: "@accent", font: "Outfit" }));
    return d;
  });

  M_("indique", "Indique e ganhe 50%", "anunciante", function () {
    var d = E.newDoc("Indique e ganhe 50%", 1080, "verde");
    d.layers.push(T("Indique e ganhe", M, 70, 936, { size: 64, weight: 800, font: "Bricolage Grotesque", color: "@ink", ls: -1.5 }));
    d.layers.push(T("50%", M - 10, 190, 1000, { size: 400, weight: 400, font: "Anton", color: "@accent", lh: 1 }));
    d.layers.push(T("Indique uma empresa para anunciar. Quando ela fizer o primeiro pagamento, você ganha 50% de desconto em 1 pacote.", M, 630, 900, { size: 38, weight: 600, color: "@ink", font: "Outfit", lh: 1.3 }));
    d.layers.push(T("Sem limite de indicações.", M, 840, 900, { size: 34, weight: 700, color: "@soft", font: "Outfit" }));
    return foot(d);
  });

  M_("no-mapa", "Seu negócio no mapa", "anunciante", function (s) {
    var d = E.newDoc("Seu negócio no mapa", 1080, "claro");
    var pts = s.where(function (l) { return l.lat && l.lng && E.regKey(l) === "dfw"; });
    var box = { x: M, y: 300, w: 936, h: 600 };
    d.layers.push(RECT(box.x, box.y, box.w, box.h, "@surface", { radius: 36, name: "Mapa" }));
    var num = function (a, b) { return a - b; };
    var lats = pts.map(function (p) { return +p.lat; }).sort(num), lngs = pts.map(function (p) { return +p.lng; }).sort(num);
    var q = function (a, f) { return a[Math.floor(a.length * f)]; };
    var la0 = q(lats, 0.04), la1 = q(lats, 0.96), lo0 = q(lngs, 0.04), lo1 = q(lngs, 0.96);
    var dots = 0;
    pts.forEach(function (p) {
      if (p.lat < la0 || p.lat > la1 || p.lng < lo0 || p.lng > lo1 || dots > 180) return;
      var x = box.x + 40 + ((p.lng - lo0) / (lo1 - lo0)) * (box.w - 80), y = box.y + 40 + (1 - (p.lat - la0) / (la1 - la0)) * (box.h - 80);
      d.layers.push(CIRC(x - 7, y - 7, 14, "@accent", { opacity: 0.55, name: "Ponto" }));
      dots++;
    });
    d.layers.push(IC("pin", 560, 430, 150, "@soft", { filled: true, name: "Seu pin" }));
    chip(d, "Seu negócio aqui", 470, 590, { fill: "@ink", color: "@bg", size: 30 });
    d.layers.push(T("Seu negócio no mapa", M, 70, 936, { size: 96, weight: 400, font: "Anton", color: "@ink", upper: true, lh: 1 }));
    d.layers.push(T("Ao lado de " + s.all.length + " lugares que os brasileiros já consultam no guia", M, 190, 936, { size: 36, weight: 600, color: "@accent", font: "Outfit", lh: 1.15 }));
    return foot(d, { semSite: true });
  });

  M_("painel", "Painel com estatísticas", "anunciante", function () {
    var d = E.newDoc("Painel com estatísticas", 1080, "escuro");
    d.layers.push(T("Acompanhe seu anúncio no painel", M, 80, 936, { size: 84, weight: 800, font: "Bricolage Grotesque", color: "@ink", lh: 1, ls: -2 }));
    d.layers.push(RECT(M, 330, 936, 560, "@surface", { radius: 36, name: "Painel" }));
    var hs = [0.35, 0.5, 0.42, 0.66, 0.58, 0.8, 0.95];
    hs.forEach(function (h, i) {
      var bh = 300 * h;
      d.layers.push(RECT(M + 70 + i * 120, 700 - bh, 70, bh, i === 6 ? "@soft" : "@accent", { radius: 14, name: "Barra" }));
    });
    ["Visitas", "Rotas", "Contatos"].forEach(function (t, i) {
      d.layers.push(T(t, M + 70 + i * 290, 760, 260, { size: 34, weight: 600, color: "@surfaceInk", font: "Outfit" }));
      d.layers.push(RECT(M + 70 + i * 290, 816, 200, 14, "@surfaceInk", { radius: 7, opacity: 0.25 }));
    });
    d.layers.push(T("Ilustração: os números aparecem no seu painel.", M, 910, 936, { size: 24, weight: 500, color: "@ink", opacity: 0.6, font: "Outfit" }));
    return foot(d, { semSite: true });
  });

  M_("crie-cupom", "Ofereça um cupom", "anunciante", function (s) {
    var c = s.cupons()[1] || s.cupons()[0];
    var d = E.newDoc("Ofereça um cupom", 1080, "amarelo");
    d.layers.push(T("Ofereça um cupom para a comunidade", M, 80, 936, { size: 86, weight: 800, font: "Bricolage Grotesque", color: "@ink", lh: 1, ls: -2 }));
    d.layers.push(RECT(M, 380, 936, 380, "@surface", { radius: 30, rot: -2, name: "Cupom" }));
    d.layers.push(RECT(M + 30, 410, 876, 320, "transparent", { radius: 20, rot: -2, stroke: "@soft", strokeW: 4, dash: true, name: "Picote" }));
    d.layers.push(IC("etiqueta", M + 70, 470, 96, "@soft", { rot: -2 }));
    d.layers.push(T(c ? c.cupom : "10% no primeiro pedido", M + 200, 470, 680, { size: 58, weight: 800, color: "@surfaceInk", font: "Outfit", rot: -2, lh: 1.05 }));
    d.layers.push(T(c ? "Exemplo do guia: " + c.nome : "Exemplo", M + 200, 650, 680, { size: 26, weight: 500, color: "@surfaceInk", opacity: 0.65, font: "Outfit", rot: -2 }));
    d.layers.push(T("O cupom aparece no seu anúncio e no app.", M, 840, 936, { size: 38, weight: 600, color: "@ink", font: "Outfit" }));
    return foot(d, { semSite: true });
  });

  M_("cliente-portugues", "Seu cliente fala português", "anunciante", function (s) {
    var f = fotoDe(s, ["fogo-de-chao-uptown-dallas", "deep-ellum", "bishop-arts-district"]);
    var d = E.newDoc("Seu cliente fala português", 1350, "verde");
    d.layers.push(IMG(f, 0, 0, 1080, 1350, { overlay: { color: "#04341A", opacity: 0.95, grad: "down" }, sat: 80, name: "Foto" }));
    d.layers.push(T("Seu próximo cliente procura em português", M, 690, 936, { size: 104, weight: 800, font: "Bricolage Grotesque", color: "#FFFFFF", lh: 0.98, ls: -3 }));
    d.layers.push(T("Anuncie no CoraçãoBR: 3 anúncios por R$ 50 por mês", M, 1040, 936, { size: 38, weight: 600, color: "#FFC20E", font: "Outfit", lh: 1.2 }));
    return foot(d, { logo: "clara", cor: "#FFFFFF" });
  });

  M_("combo", "Monte seu combo", "anunciante", function () {
    var d = E.newDoc("Monte seu combo", 1350, "claro");
    d.layers.push(T("Monte seu combo", M, 90, 936, { size: 124, weight: 400, font: "Anton", color: "@ink", upper: true, lh: 1 }));
    d.layers.push(RECT(150, 300, 780, 860, "#FFFFFF", { radius: 8, rot: 1.5, name: "Recibo" }));
    var itens = [["Pacote: 3 anúncios por mês", 50], ["Selo Verificado", 30], ["Impulsionar 7 dias", 25], ["Destaque no Mural", 10]];
    d.layers.push(T("COMBO CORAÇÃOBR", 210, 360, 660, { size: 34, weight: 800, font: "Barlow Condensed", color: "#0E1311", ls: 4, rot: 1.5 }));
    itens.forEach(function (it, i) {
      var y = 470 + i * 120;
      d.layers.push(T(it[0], 210, y, 470, { size: 38, weight: 600, font: "Barlow Condensed", color: "#0E1311", rot: 1.5, lh: 1.1 }));
      d.layers.push(T("R$ " + it[1], 690, y, 180, { size: 44, weight: 800, font: "Barlow Condensed", color: "#0B7A35", align: "right", rot: 1.5 }));
      d.layers.push(RECT(210, y + 86, 660, 2, "#0E1311", { rot: 1.5, opacity: 0.2, name: "Linha" }));
    });
    d.layers.push(T("TOTAL", 210, 980, 300, { size: 52, weight: 800, font: "Barlow Condensed", color: "#0E1311", rot: 1.5 }));
    d.layers.push(T("R$ 115", 560, 966, 310, { size: 76, weight: 400, font: "Anton", color: "#0B7A35", align: "right", rot: 1.5 }));
    d.layers.push(T("Escolha só o que fizer sentido. Pague por Pix.", M, 1190, 936, { size: 32, weight: 600, color: "@accent", font: "Outfit", align: "center" }));
    return d;
  });

  M_("tres-passos", "Anuncie em 3 passos (story)", "anunciante", function () {
    var d = E.newDoc("Anuncie em 3 passos", 1920, "verde");
    d.layers.push(T("Anuncie em 3 passos", M, 200, 936, { size: 150, weight: 400, font: "Anton", color: "@ink", upper: true, lh: 1 }));
    var p = [["Escolha o pacote", "3 anúncios por R$ 50 por mês"], ["Pague por Pix", "Pagamento simples, em reais"], ["Monte seu anúncio", "Fotos, horário, cupom e WhatsApp"]];
    p.forEach(function (it, i) {
      var y = 640 + i * 340;
      d.layers.push(T(String(i + 1), M, y - 20, 200, { size: 260, weight: 400, font: "Anton", color: "@accent", lh: 1 }));
      d.layers.push(T(it[0], M + 230, y + 50, 700, { size: 64, weight: 800, color: "@ink", font: "Outfit", lh: 1.05 }));
      d.layers.push(T(it[1], M + 230, y + 140, 700, { size: 36, weight: 500, color: "@soft", font: "Outfit", lh: 1.2 }));
    });
    return foot(d);
  });

  M_("categorias", "Onde seu cliente procura", "anunciante", function (s) {
    var d = E.newDoc("Onde seu cliente procura", 1350, "escuro");
    d.layers.push(T("Onde seu cliente procura", M, 90, 936, { size: 100, weight: 800, font: "Bricolage Grotesque", color: "@ink", lh: 0.98, ls: -3 }));
    d.layers.push(T("Categorias do guia hoje, com o número de lugares em cada uma", M, 310, 936, { size: 34, weight: 500, color: "@ink", opacity: 0.75, font: "Outfit", lh: 1.2 }));
    var c = {};
    s.all.forEach(function (l) { if (E.CAT[l.categoria] && l.tipo === "estabelecimento" && ["governo", "transporte", "saude"].indexOf(l.categoria) < 0) c[l.categoria] = (c[l.categoria] || 0) + 1; });
    var cats = Object.keys(c).sort(function (a, b) { return c[b] - c[a]; }).slice(0, 12);
    var x = M, y = 440;
    cats.forEach(function (k, i) {
      var t = E.CAT[k] + "  " + c[k], w = E.measure(t, "Outfit", 34, 700) + 56;
      if (x + w > 1080 - M) { x = M; y += 92; }
      chip(d, t, x, y, { size: 34, fill: i < 3 ? "@accent" : "@surface", color: i < 3 ? "@accentInk" : "@surfaceInk" });
      x += w + 14;
    });
    d.layers.push(T("Seu anúncio aparece na categoria certa.", M, y + 150, 936, { size: 42, weight: 700, color: "@soft", font: "Outfit" }));
    return foot(d);
  });

  E.MODELOS = MODELOS;
  E.buildModelos = function () {
    var s = S();
    return MODELOS.map(function (m) {
      var d;
      try { d = m.build(s); } catch (e) { console.warn("Modelo falhou", m.id, e); d = E.newDoc(m.titulo, 1080, "verde", [T(m.titulo, M, M, 936, { size: 80 })]); }
      d.modelo = m.id; d.publico = m.publico; d.titulo = m.titulo;
      return d;
    });
  };

  /* =====================================================================
     GERADOR AUTOMÁTICO
     ===================================================================== */
  function shuffle(a) { a = a.slice(); for (var i = a.length - 1; i > 0; i--) { var j = Math.floor(Math.random() * (i + 1)); var t = a[i]; a[i] = a[j]; a[j] = t; } return a; }
  var THEMES = ["verde", "amarelo", "escuro", "claro", "mata"];
  var TITLE_FONTS = [["Bricolage Grotesque", 800, -2, false], ["Anton", 400, 0, true], ["Fraunces", 900, -2, false], ["Outfit", 800, -1.5, false], ["Barlow Condensed", 800, 0, true]];
  function tf(i) { var f = TITLE_FONTS[i % TITLE_FONTS.length]; return { font: f[0], weight: f[1], ls: f[2], upper: f[3] }; }
  function sz(base, f) { return f.font === "Anton" || f.font === "Barlow Condensed" ? Math.round(base * 1.15) : base; }

  /* Layouts de lugar: recebem {foto, kicker, titulo, linha, texto, cta} */
  var LAYOUTS = {
    cheia: function (d, c, f) {
      d.layers.push(IMG(c.foto, 0, 0, d.w, d.h, { overlay: { color: "#04341A", opacity: 0.94, grad: "down" }, name: "Foto" }));
      chip(d, c.kicker, M, M, { fill: "#FFC20E", color: "#04341A", size: 30 });
      var t = T(c.titulo, M, 0, d.w - M * 2, Object.assign({ size: sz(d.h > 1100 ? 96 : 80, f), color: "#FFFFFF", lh: 1.0 }, f));
      var l = T(c.linha, M, 0, d.w - M * 2, { size: 32, weight: 600, color: "#FFC20E", font: "Outfit" });
      var x = T(c.texto || "", M, 0, d.w - M * 2, { size: 30, weight: 500, color: "#FFFFFF", opacity: 0.88, font: "Outfit", lh: 1.3 });
      [t, l, x].forEach(E.fitText);
      stack([t, l, x], d.h - M - 90 - (t.h + l.h + x.h + 40), 18);
      d.layers.push(t, l, x);
      foot(d, { logo: "clara", cor: "#FFFFFF" });
    },
    moldura: function (d, c, f) {
      var ph = d.h > 1500 ? 1000 : d.h > 1100 ? 720 : 560;
      d.layers.push(T(c.kicker, M, M, d.w - M * 2, { size: 32, weight: 600, color: "@accent", font: "Outfit" }));
      d.layers.push(IMG(c.foto, M, M + 64, d.w - M * 2, ph, { radius: 36, name: "Foto" }));
      var t = T(c.titulo, M, 0, d.w - M * 2, Object.assign({ size: sz(70, f), color: "@ink", lh: 1.0 }, f));
      var l = T(c.linha, M, 0, d.w - M * 2, { size: 30, weight: 600, color: "@accent", font: "Outfit" });
      var x = T(c.texto || "", M, 0, d.w - M * 2, { size: 28, weight: 500, color: "@ink", opacity: 0.8, font: "Outfit", lh: 1.3 });
      stack([t, l, x], M + 64 + ph + 36, 12);
      d.layers.push(t, l);
      if (x.y + x.h < d.h - M - 70) d.layers.push(x);
      foot(d);
    },
    split: function (d, c, f) {
      var half = Math.round(d.w * 0.5);
      d.layers.push(IMG(c.foto, half, 0, d.w - half, d.h, { name: "Foto" }));
      d.layers.push(RECT(half - 10, 0, 20, d.h, "@accent", { name: "Fio" }));
      d.layers.push(T(c.kicker, M, M + 10, half - M - 40, { size: 30, weight: 600, color: "@accent", font: "Outfit", lh: 1.15 }));
      var t = T(c.titulo, M, 0, half - M - 40, Object.assign({ size: sz(d.h > 1100 ? 72 : 62, f), color: "@ink", lh: 1.0 }, f));
      var l = T(c.linha, M, 0, half - M - 40, { size: 28, weight: 600, color: "@accent", font: "Outfit", lh: 1.2 });
      var x = T(c.texto || "", M, 0, half - M - 40, { size: 26, weight: 500, color: "@ink", opacity: 0.85, font: "Outfit", lh: 1.3 });
      stack([t, l, x], M + 120, 16);
      d.layers.push(t, l);
      if (x.y + x.h < d.h - M - 80) d.layers.push(x);
      d.layers.push(LOGO(M, d.h - M - 46, 46, "auto"));
    },
    polaroid: function (d, c, f) {
      var pw = 760, ph = d.h > 1100 ? 760 : 560, rot = Math.random() > 0.5 ? -3 : 3;
      d.layers.push(RECT(0, 0, d.w, d.h * 0.45, "@accent", { name: "Bloco" }));
      d.layers.push(IMG(c.foto, (d.w - pw) / 2, M + 30, pw, ph, { rot: rot, border: { w: 20, color: "#FFFFFF" }, name: "Foto" }));
      d.layers.push(T(c.kicker, d.w - 520, M + ph - 10, 460, { size: 58, weight: 700, font: "Caveat", color: "@ink", rot: -rot, align: "center", lh: 0.95 }));
      var t = T(c.titulo, M, 0, d.w - M * 2, Object.assign({ size: sz(70, f), color: "@ink", lh: 1.0 }, f));
      var l = T(c.linha, M, 0, d.w - M * 2, { size: 30, weight: 600, color: "@accent", font: "Outfit" });
      stack([t, l], M + ph + 130, 12);
      d.layers.push(t, l);
      foot(d);
    }
  };
  var LAYOUT_KEYS = Object.keys(LAYOUTS);

  function lista(d, titulo, kicker, itens, f) {
    d.layers.push(T(kicker, M, M, d.w - M * 2, { size: 32, weight: 600, color: "@accent", font: "Outfit" }));
    var t = T(titulo, M, M + 56, d.w - M * 2, Object.assign({ size: sz(d.h > 1100 ? 84 : 70, f), color: "@ink", lh: 1.0 }, f));
    d.layers.push(t);
    var y = t.y + t.h + 50, avail = d.h - M - 100 - y, n = itens.length, row = Math.min(170, avail / n);
    var ph = Math.min(row - 18, 130);
    itens.forEach(function (it, i) {
      var yy = y + i * row;
      if (it.foto) d.layers.push(IMG(it.foto, M, yy, ph, ph, { radius: ph * 0.22, name: "Foto " + (i + 1) }));
      else d.layers.push(RECT(M, yy, ph, ph, "@accent", { radius: ph * 0.22 }));
      if (it.data) {
        d.layers.push(T(it.data, M, yy + ph / 2 - 26, ph, { size: 30, weight: 800, color: "@accentInk", align: "center", font: "Outfit", lh: 0.9, upper: true }));
      }
      d.layers.push(T(it.nome, M + ph + 28, yy + 8, d.w - M * 2 - ph - 28, { size: Math.min(38, ph * 0.32), weight: 700, color: "@ink", font: "Outfit", lh: 1.08 }));
      var nm = d.layers[d.layers.length - 1];
      d.layers.push(T(it.sub, M + ph + 28, yy + 8 + nm.h + 6, d.w - M * 2 - ph - 28, { size: Math.min(26, ph * 0.22), weight: 500, color: "@accent", font: "Outfit" }));
    });
    foot(d);
  }

  function formato(opt, i) {
    if (opt.formato && opt.formato !== "misto") return +opt.formato;
    return [1080, 1350, 1080, 1920, 1350][i % 5];
  }

  E.gerar = function (opt) {
    var s = S(), reg = opt.cidade || "todas", out = [], n = +opt.qtd || 6;
    var regNome = reg === "todas" ? "no Texas" : (E.REG[reg] ? "em " + E.REG[reg] : "em " + reg.replace(/(^|\s)\S/g, function (m) { return m.toUpperCase(); }));
    var usados = {};
    var tipos = opt.tipo === "misto" ? ["destaque", "top", "eventos", "cupons", "institucional"] : [opt.tipo];
    var regFn = function (l) { return reg === "todas" || E.regKey(l) === reg || (l.cidade || "").toLowerCase() === reg; };
    var themes = shuffle(THEMES), lays = shuffle(LAYOUT_KEYS), fonts = shuffle([0, 1, 2, 3, 4]);
    var lugares = shuffle(s.where(function (l) { return E.foto(l) && l.categoria !== "governo" && l.categoria !== "transporte"; }).filter(regFn))
      .sort(function (a, b) { return (E.realFotos(b).length ? 1 : 0) - (E.realFotos(a).length ? 1 : 0); });
    var eventos = s.eventos().filter(regFn), cupons = s.cupons().filter(regFn);
    var catCount = {};
    s.all.filter(regFn).forEach(function (l) { if (E.CAT[l.categoria] && l.categoria !== "governo") catCount[l.categoria] = (catCount[l.categoria] || 0) + 1; });
    var cats = shuffle(Object.keys(catCount).filter(function (k) { return catCount[k] >= 3; }));
    var ia = 0, ie = 0, ic = 0, icat = 0, iinst = shuffle([0, 1, 2, 3, 4, 5, 6, 7]);

    for (var i = 0; i < n * 3 && out.length < n; i++) {
      var tipo = tipos[i % tipos.length], h = formato(opt, out.length);
      var theme = themes[out.length % themes.length], f = tf(fonts[out.length % fonts.length]), lay = lays[out.length % lays.length];
      var d = E.newDoc("", h, theme), ok = true;
      var cons = opt.publico !== "anunciante";

      if (tipo === "destaque") {
        var l = lugares[ia++];
        if (!l) { ok = false; }
        else if (cons) {
          d.name = "Destaque: " + l.nome;
          LAYOUTS[lay](d, { foto: E.foto(l, ia), kicker: E.CAT[l.categoria] || "Lugar em destaque", titulo: l.nome, linha: lugarLinha(l), texto: E.frase(l.dica || l.historia, 120) }, f);
        } else {
          d.name = "Anuncie ao lado de " + l.nome;
          LAYOUTS[lay](d, { foto: E.foto(l, ia), kicker: "Para anunciantes", titulo: "Seu anúncio ao lado de " + l.nome, linha: "3 anúncios por R$ 50 por mês", texto: "Apareça para quem procura " + (E.CAT[l.categoria] || "lugares").toLowerCase() + " " + regNome + ", em português." }, f);
        }
      } else if (tipo === "top") {
        var cat = cats[icat++ % Math.max(1, cats.length)];
        if (!cat) { ok = false; }
        else {
          var top = s.top([cat], h > 1500 ? 6 : h > 1100 ? 5 : 4, reg === "todas" ? null : reg, true);
          if (top.length < 3) ok = false;
          else if (cons) {
            d.name = "Top " + E.CAT[cat] + " " + regNome;
            lista(d, E.CAT[cat] + " " + regNome + ": top " + top.length, "Top do guia", top.map(function (l) { return { foto: E.foto(l), nome: l.nome, sub: l.cidade }; }), f);
          } else {
            d.name = E.CAT[cat] + ": anuncie " + regNome;
            LAYOUTS[lay](d, { foto: E.foto(top[0]), kicker: "Para anunciantes", titulo: "Quem procura " + E.CAT[cat].toLowerCase() + " " + regNome + " abre o CoraçãoBR", linha: catCount[cat] + " lugares nessa categoria no guia", texto: "Anuncie: 3 anúncios por R$ 50 por mês, pagamento por Pix." }, f);
          }
        }
      } else if (tipo === "eventos") {
        if (!eventos.length || ie >= eventos.length) ok = false;
        else if (cons && (out.length % 2 === 0 || eventos.length < 3)) {
          var ev = eventos[ie++ % eventos.length];
          d.name = "Evento: " + ev.nome;
          LAYOUTS[lay](d, { foto: E.foto(ev, ie), kicker: "Evento " + E.dataCurta(ev.dataInicio), titulo: ev.nome, linha: quando(ev) + (ev.cidade ? ", " + ev.cidade : ""), texto: E.frase(ev.dica || ev.historia, 110) }, f);
        } else if (cons) {
          var prox = eventos.slice(ie, ie + (h > 1500 ? 6 : h > 1100 ? 5 : 4)); ie += 2;
          if (prox.length < 3) prox = eventos.slice(0, 4);
          d.name = "Próximos eventos " + regNome;
          lista(d, "Próximos eventos " + regNome, "Agenda CoraçãoBR", prox.map(function (e) { return { foto: "", data: E.dataCurta(e.dataInicio).replace(" ", "\n"), nome: e.nome, sub: e.cidade }; }), f);
        } else {
          var ev2 = eventos[ie++ % eventos.length];
          d.name = "Impulsione no " + ev2.nome;
          LAYOUTS[lay](d, { foto: E.foto(ev2), kicker: "Para anunciantes", titulo: "Evento grande perto do seu negócio? Impulsione 7 dias", linha: ev2.nome + ", " + quando(ev2), texto: "Impulsionar: R$ 25 por 7 dias no topo do guia." }, f);
        }
      } else if (tipo === "cupons") {
        if (ic >= cupons.length) ok = false;
        else {
          var c = cupons[ic++ % cupons.length];
          d.name = (cons ? "Cupom: " : "Crie seu cupom: ") + c.nome;
          var top2 = cons ? "Cupom no CoraçãoBR" : "Ofereça um cupom";
          d.layers.push(T(top2, M, M, d.w - M * 2, Object.assign({ size: sz(h > 1100 ? 104 : 88, f), color: "@ink", lh: 1 }, f)));
          var ph = h > 1500 ? 900 : h > 1100 ? 600 : 440, cy = Math.round((h - ph) / 2) + 30;
          d.layers.push(IMG(E.foto(c), M, cy, d.w - M * 2, ph, { radius: 36, overlay: { color: "#04341A", opacity: 0.75 }, name: "Foto" }));
          d.layers.push(RECT(M + 30, cy + 30, d.w - M * 2 - 60, ph - 60, "transparent", { radius: 24, stroke: "#FFC20E", strokeW: 5, dash: true, name: "Picote" }));
          d.layers.push(T(c.cupom, M + 70, cy + 90, d.w - M * 2 - 140, { size: h > 1500 ? 84 : 60, weight: 800, color: "#FFFFFF", font: "Outfit", lh: 1.05 }));
          d.layers.push(T(c.nome + ", " + c.cidade, M + 70, cy + ph - 120, d.w - M * 2 - 140, { size: 28, weight: 600, color: "#FFC20E", font: "Outfit" }));
          d.layers.push(T(cons ? "Pegue no app CoraçãoBR" : "Exemplo do guia. O cupom aparece no seu anúncio e no app.", M, cy + ph + 40, d.w - M * 2, { size: 34, weight: 600, color: "@accent", font: "Outfit", lh: 1.2 }));
          foot(d);
        }
      } else {
        var k = iinst[(out.length + i) % iinst.length];
        var inst = cons ? [
          ["Pergunte ao CoraçãoBR", "O assistente responde em português, com o que está no guia.", "chat"],
          ["Clube CoraçãoBR", "R$ 15 por mês. Carteirinha digital com descontos.", "estrela"],
          ["Pets perdidos e achados", "Publique com foto e bairro. A comunidade ajuda a achar.", "pata"],
          ["Mural da comunidade", "Vagas, quartos, aluguel e avisos dos brasileiros " + regNome + ".", "mala"],
          ["Alertas no celular", "Eventos, cupons e avisos perto de você.", "sino"],
          ["Serviços em português", "Encontre quem atende na sua língua " + regNome + ".", "usuarios"],
          ["Chegou agora no Texas?", "Seus primeiros 30 dias, passo a passo, no CoraçãoBR.", "aviao"],
          [s.all.length + " lugares no guia", "Restaurantes, passeios, eventos e serviços, em português.", "pin"]
        ] : [
          ["3 anúncios por R$ 50", "Por mês. Os pacotes somam. Pagamento por Pix.", "megafone"],
          ["Selo Verificado", "R$ 30. Mais confiança para quem procura em português.", "escudo"],
          ["Impulsione 7 dias", "R$ 25 para aparecer no topo.", "foguete"],
          ["Destaque no Mural", "R$ 10 para seu post ficar em evidência.", "estrela"],
          ["Pix na hora", "Pague seus anúncios por Pix.", "pix"],
          ["QR Avalie-nos", "Um QR no balcão para receber avaliações.", "qr"],
          ["Indique e ganhe 50%", "Desconto em 1 pacote quando a empresa indicada fizer o primeiro pagamento.", "presente"],
          ["Painel do anunciante", "Acompanhe visitas, rotas e contatos do seu anúncio.", "grafico"]
        ];
        var it = inst[k];
        d.name = it[0];
        var big = T(it[0], M, 0, d.w - M * 2, Object.assign({ size: sz(h > 1500 ? 140 : h > 1100 ? 120 : 104, f), color: "@ink", lh: 0.98 }, f));
        var sub = T(it[1], M, 0, d.w - M * 2 - 80, { size: h > 1100 ? 46 : 40, weight: 600, color: "@ink", opacity: 0.88, font: "Outfit", lh: 1.22 });
        E.fitText(big); E.fitText(sub);
        var icS = h > 1100 ? 320 : 240, variant = out.length % 3;
        if (variant === 0) {
          d.layers.push(CIRC(d.w - icS - 20, M, icS + 60, "@accent", { name: "Círculo" }));
          d.layers.push(IC(it[2], d.w - icS + 10, M + 30, icS, "@accentInk", { name: "Ícone" }));
          stack([big, sub], Math.max(M + icS + 120, d.h - M - 140 - big.h - sub.h - 30), 30);
        } else if (variant === 1) {
          d.layers.push(FAIXA(-60, d.h * 0.62, d.w + 120, d.h * 0.2, "@accent", { rot: -6, skew: 0, name: "Faixa" }));
          d.layers.push(IC(it[2], M, M, 120, "@soft", { name: "Ícone" }));
          stack([big, sub], M + 180, 30);
        } else {
          d.layers.push(IC(it[2], d.w - M - icS * 1.2, d.h - M - 120 - icS * 1.2, icS * 1.2, "@soft", { opacity: 0.9, name: "Ícone" }));
          d.layers.push(RECT(M, M, 140, 14, "@accent", { radius: 7, name: "Fio" }));
          stack([big, sub], M + 70, 30);
        }
        d.layers.push(big, sub);
        foot(d);
      }
      if (!ok) continue;
      d.publico = opt.publico; d.gerado = true; d.titulo = d.name;
      out.push(d);
    }
    return out;
  };
})();
