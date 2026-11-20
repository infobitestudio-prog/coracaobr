/* Horários estruturados.
   Cada lugar pode ter `semana`: 7 listas (0 = domingo) de faixas [abre, fecha] em minutos.
   Lugares antigos só têm o texto `horario`; o leitor abaixo converte os formatos comuns ("Seg–sex 8h–17h · Sáb 9h–13h",
   "Diariamente 10h–17h", "Fechado seg e ter", "24 horas"). O que não der para ler com segurança fica como observação. */
(function () {
  "use strict";
  var NOMES = ["Domingo", "Segunda", "Terça", "Quarta", "Quinta", "Sexta", "Sábado"];
  var CURTO = ["Dom", "Seg", "Ter", "Qua", "Qui", "Sex", "Sáb"];
  var DIA = { dom: 0, domingo: 0, domingos: 0, seg: 1, segunda: 1, segundas: 1, ter: 2, terca: 2, tercas: 2, qua: 3, quarta: 3, quartas: 3, qui: 4, quinta: 4, quintas: 4, sex: 5, sexta: 5, sextas: 5, sab: 6, sabado: 6, sabados: 6 };
  var MES = /\b(jan|fev|mar|abr|mai|jun|jul|ago|set|out|nov|dez)\w*\s*(-|–|:|a )/i;
  var VAGO = /em geral|varia|sazonal|temporada|consulte|confira|calend|agenda|dias de (evento|jogo)|amanhecer|anoitecer|comercial|limitad|selecionad/i;
  var cache = {};

  function semAc(s) { return s.normalize("NFD").replace(/[̀-ͯ]/g, ""); }
  function min(t) { if (t === "meio-dia") return 720; var m = t.match(/(\d{1,2})h(\d{2})?/); return m ? Number(m[1]) * 60 + Number(m[2] || 0) : null; }
  function junta(fs) {
    fs.sort(function (a, b) { return a[0] - b[0]; });
    var out = [];
    fs.forEach(function (f) { var u = out[out.length - 1]; if (u && f[0] <= u[1]) u[1] = Math.max(u[1], f[1]); else out.push([f[0], f[1]]); });
    return out;
  }

  function ler(texto) {
    var t = String(texto || "").trim();
    if (!t) return null;
    if (cache[t]) return cache[t];
    var notas = [], semana = [null, null, null, null, null, null, null], vago = VAGO.test(t), achou = false;
    if (MES.test(t)) return (cache[t] = { semana: null, notas: [t], vago: true });
    var base = t.replace(/\(([^)]*)\)/g, function (m, x) { if (/\d{1,2}h/.test(x) && !/[uú]ltima entrada/i.test(x)) vago = true; notas.push(x.charAt(0).toUpperCase() + x.slice(1)); return " "; });
    if (/\b(m[eê]s|primeir[oa]|[uú]ltim[oa] (s[aá]b|dom|seg|sex))\b/i.test(t)) vago = true;
    base = base.replace(/24\s*h(oras)?/gi, "0h-24h").replace(/[–—]/g, "-");
    base.split(/[·;]/).forEach(function (seg) {
      var s = semAc(seg.toLowerCase()).trim(); if (!s) return;
      if (/happy hour/.test(s)) return;
      if (/\b(antes|depois|sess(ao|oes)|fogos|shows?)\b/.test(s)) { notas.push(seg.trim()); return; }
      var tk = s.match(/\d{1,2}h\d{0,2}|meio-dia|[a-z]+|-|,/g) || [];
      var dias = [], fechado = false, usou = false, de = null, ultimo = null, inicio = null, temHora = false, temDia = false, i;
      function poeDia(d) { if (usou) { dias = []; usou = false; } if (de != null) { for (var k = (de + 1) % 7; k !== d; k = (k + 1) % 7) dias.push(k); de = null; } dias.push(d); ultimo = d; temDia = true; }
      function aplica(ab, fe) {
        if (fe <= ab) fe += 1440;
        var alvo = dias.length ? dias : (temDia ? [] : [0, 1, 2, 3, 4, 5, 6]);
        alvo.forEach(function (d) { (semana[d] = semana[d] || []).push([ab, fe]); });
        if (alvo.length) achou = true;
        usou = true; temHora = true; inicio = ab;
      }
      for (i = 0; i < tk.length; i++) {
        var w = tk[i];
        if (w === "fechado" || w === "fechada" || w === "fecha") { fechado = true; dias = []; usou = false; continue; }
        if (w === "diariamente" || (w === "todos" && tk[i + 1] === "os" && tk[i + 2] === "dias")) { dias = [0, 1, 2, 3, 4, 5, 6]; usou = false; temDia = true; continue; }
        if (w === "dias" && tk[i + 1] === "uteis") { dias = [1, 2, 3, 4, 5]; usou = false; temDia = true; i++; continue; }
        if (DIA.hasOwnProperty(w)) { poeDia(DIA[w]); continue; }
        if ((w === "-" || w === "a") && ultimo != null && !usou && DIA.hasOwnProperty(tk[i + 1] || "")) { de = ultimo; continue; }
        if (/^\d{1,2}h|meio-dia/.test(w)) {
          var ab = min(w), j = i + 1;
          while (tk[j] === "as" || tk[j] === "-" || tk[j] === "a" || tk[j] === "ate") j++;
          if (j < tk.length && /^\d{1,2}h|meio-dia/.test(tk[j]) && j - i <= 3) { aplica(ab, min(tk[j])); i = j; }
          continue;
        }
        if (w === "ate" && /^\d{1,2}h/.test(tk[i + 1] || "") && inicio != null) { aplica(inicio, min(tk[i + 1])); i++; continue; }
      }
      if (fechado && dias.length) { dias.forEach(function (d) { semana[d] = []; }); achou = true; }
      else if (fechado && !dias.length) notas.push(seg.trim());
      else if (!temHora) { notas.push(seg.trim()); if (temDia) vago = true; }
    });
    semana = semana.map(function (f) { return f ? junta(f) : (achou && !vago ? [] : null); });
    var r = { semana: achou ? semana : null, notas: notas.filter(Boolean), vago: vago };
    cache[t] = r; return r;
  }

  function deObj(o) {
    var s = [], ok = false;
    for (var k = 0; k < 7; k++) { var v = o[String(k)]; if (v == null) s.push(null); else { s.push(v.map(function (f) { return [Number(f.a), Number(f.f)]; })); ok = true; } }
    return ok ? s : null;
  }
  function paraObj(s) { var o = {}; s.forEach(function (d, k) { if (d != null) o[String(k)] = d.map(function (f) { return { a: f[0], f: f[1] }; }); }); return o; }
  function dados(l) {
    if (l && l.horas && typeof l.horas === "object") { var sm = deObj(l.horas); if (sm) return { semana: sm, notas: l.horarioNota ? [l.horarioNota] : [], vago: false }; }
    if (l && Array.isArray(l.semana) && l.semana.length === 7) return { semana: l.semana, notas: l.horarioNota ? [l.horarioNota] : [], vago: false };
    return ler(l && l.horario) || { semana: null, notas: [], vago: false };
  }
  function agoraDallas() { try { return new Date(new Date().toLocaleString("en-US", { timeZone: "America/Chicago" })); } catch (e) { return new Date(); } }
  function hhmm(m) { m = ((m % 1440) + 1440) % 1440; return Math.floor(m / 60) + "h" + (m % 60 ? String(m % 60).padStart(2, "0") : ""); }
  function faixaTxt(f) { return f[1] - f[0] >= 1440 ? "24 horas" : hhmm(f[0]) + " – " + hhmm(f[1]); }

  /* Situação agora: {aberto: true/false, txt} ou null quando o horário daquele dia não é conhecido. */
  function agora(l) {
    var d = dados(l), s = d.semana; if (!s || d.vago) return null;
    var n = agoraDallas(), hoje = n.getDay(), m = n.getHours() * 60 + n.getMinutes(), ontem = (hoje + 6) % 7;
    if (s[hoje] == null) return null;
    var dentro = (s[hoje] || []).filter(function (f) { return m >= f[0] && m < f[1]; })[0] || (s[ontem] || []).filter(function (f) { return f[1] > 1440 && m + 1440 < f[1]; })[0];
    if (dentro) return { aberto: true, txt: dentro[1] - dentro[0] >= 1440 ? "Aberto 24 horas" : "Aberto · fecha às " + hhmm(dentro[1]) };
    var prox = (s[hoje] || []).filter(function (f) { return f[0] > m; })[0];
    if (prox) return { aberto: false, txt: "Fechado · abre às " + hhmm(prox[0]) };
    for (var k = 1; k <= 7; k++) { var dd = (hoje + k) % 7; if (s[dd] && s[dd].length) return { aberto: false, txt: "Fechado · abre " + (k === 1 ? "amanhã" : NOMES[dd].toLowerCase()) + " às " + hhmm(s[dd][0][0]) }; }
    return { aberto: false, txt: "Fechado" };
  }

  function html(l, esc) {
    var d = dados(l), ag = agora(l), n = agoraDallas(), hoje = n.getDay(), mAgora = n.getHours() * 60 + n.getMinutes();
    if (!d.semana) {
      return '<div class="hor"><div class="hor-top"><span class="hor-st var">Horário variável</span></div>' + (l.horario ? '<p class="hor-res">' + esc(l.horario) + "</p>" : "") + "</div>";
    }
    var ordem = [1, 2, 3, 4, 5, 6, 0], partes = ag ? ag.txt.split(" · ") : [];
    var st = ag ? '<span class="hor-st ' + (ag.aberto ? "ab" : "fe") + '">' + esc(partes[0]) + "</span>" + (partes[1] ? '<span class="hor-tx">' + esc(partes[1]) + "</span>" : "") : d.vago ? '<span class="hor-st var">Horário aproximado</span>' : "";
    var pct = function (m) { return Math.max(0, Math.min(100, m / 1440 * 100)).toFixed(2); };
    var linhas = ordem.map(function (k) {
      var f = d.semana[k], txt = f == null ? "—" : f.length ? f.map(faixaTxt).join(" · ") : "Fechado";
      var barras = (f || []).map(function (x) { var a = x[0], fim = Math.min(x[1], 1440); return '<i style="left:' + pct(a) + "%;width:" + (pct(fim) - pct(a)).toFixed(2) + '%"></i>'; }).join("");
      var vira = d.semana[(k + 6) % 7] || []; vira.forEach(function (x) { if (x[1] > 1440) barras += '<i style="left:0;width:' + pct(x[1] - 1440) + '%"></i>'; });
      return '<li class="' + (k === hoje ? "hoje" : "") + (f && !f.length ? " fechado" : "") + '"><span class="hd">' + CURTO[k] + (k === hoje ? "<em>hoje</em>" : "") + '</span><span class="hb">' + barras + (k === hoje ? '<b class="agora" style="left:' + pct(mAgora) + '%"></b>' : "") + '</span><span class="ht">' + txt + "</span></li>";
    }).join("");
    return '<div class="hor"><div class="hor-top">' + st + "</div>" +
      '<ul class="semana2">' + linhas + '</ul><div class="hor-esc"><span></span><span>0h</span><span>6h</span><span>12h</span><span>18h</span><span>24h</span></div>' +
      '<p class="hor-res">' + esc(texto(d.semana.map(function (x) { return x || []; }))) + "</p>" +
      (d.notas.length ? '<p class="small muted">' + d.notas.map(esc).join(" · ") + "</p>" : "") + "</div>";
  }

  /* Editor de 7 dias (painel e cadastro do anunciante). */
  function editor(l) {
    var d = dados(l), s = (d.semana && !d.vago) ? d.semana : [null, null, null, null, null, null, null], ordem = [1, 2, 3, 4, 5, 6, 0];
    function hm(m) { m = m % 1440; return String(Math.floor(m / 60)).padStart(2, "0") + ":" + String(m % 60).padStart(2, "0"); }
    function faixa(f, ab, extra) { return '<span class="hed-f' + (extra ? " extra" : "") + '"><input type="time" data-ab value="' + (f ? hm(f[0]) : "09:00") + '"' + (ab ? "" : " disabled") + ' aria-label="Abre às"><span>às</span><input type="time" data-fe value="' + (f ? hm(f[1]) : "18:00") + '"' + (ab ? "" : " disabled") + ' aria-label="Fecha às">' + (extra ? '<button type="button" class="hed-x" data-tira-faixa aria-label="Remover este horário">×</button>' : "") + '</span>'; }
    return '<div class="hed">' + ordem.map(function (k) {
      var fs = s[k] || [], ab = fs.length > 0;
      return '<div class="hed-r" data-dia="' + k + '"' + (s[k] == null ? ' data-desconhecido="1"' : "") + '><label class="hed-d"><input type="checkbox" data-aberto' + (ab ? " checked" : "") + "> " + CURTO[k] + '</label><div class="hed-fs">' + (fs.length ? fs.map(function (f, i) { return faixa(f, true, i > 0); }).join("") : faixa(null, false)) + '</div><button type="button" class="mini" data-mais-faixa aria-label="Adicionar outro horário neste dia"' + (ab ? "" : " disabled") + ">+</button></div>";
    }).join("") + '<p class="small muted">Marque os dias abertos. Use + para um segundo horário no mesmo dia (almoço e jantar). Para 24 horas, use 00:00 às 00:00.</p></div>';
  }
  function lerEditor(el) {
    var s = [null, null, null, null, null, null, null], algum = false;
    Array.from(el.querySelectorAll(".hed-r")).forEach(function (r) {
      var k = Number(r.dataset.dia), cb = r.querySelector("[data-aberto]");
      if (r.dataset.desconhecido && !r.dataset.mexeu) return;
      if (!cb.checked) { s[k] = []; return; }
      s[k] = Array.from(r.querySelectorAll(".hed-f")).map(function (f) {
        var a = f.querySelector("[data-ab]").value.split(":"), b = f.querySelector("[data-fe]").value.split(":");
        var ab = Number(a[0]) * 60 + Number(a[1] || 0), fe = Number(b[0]) * 60 + Number(b[1] || 0); if (fe <= ab) fe += 1440;
        return [ab, fe];
      }); s[k] = junta(s[k]);
      algum = true;
    });
    return algum ? s : null;
  }
  function texto(s) {
    var ordem = [1, 2, 3, 4, 5, 6, 0], grupos = [];
    ordem.forEach(function (k) { var v = s[k] && s[k].length ? s[k].map(faixaTxt).join(", ") : "Fechado", g = grupos[grupos.length - 1]; if (g && g.v === v) g.dias.push(k); else grupos.push({ v: v, dias: [k] }); });
    return grupos.map(function (g) { return CURTO[g.dias[0]] + (g.dias.length > 1 ? "–" + CURTO[g.dias[g.dias.length - 1]].toLowerCase() : "") + " " + g.v; }).join(" · ");
  }
  document.addEventListener("change", function (e) {
    var h = e.target.closest(".hed"); if (h) h.dataset.mudou = "1";
    var r = e.target.closest(".hed-r"); if (r) r.dataset.mexeu = "1";
    var c = e.target.closest(".hed-r [data-aberto]"); if (!c) return;
    Array.from(r.querySelectorAll("input[type=time], [data-mais-faixa]")).forEach(function (i) { i.disabled = !c.checked; });
  });

  document.addEventListener("click", function (e) {
    var x = e.target.closest("[data-tira-faixa]");
    if (x) { var rr = x.closest(".hed-r"); x.closest(".hed-f").remove(); if (rr) { rr.dataset.mexeu = "1"; var hh = rr.closest(".hed"); if (hh) hh.dataset.mudou = "1"; } return; }
    var b = e.target.closest("[data-mais-faixa]"); if (!b) return;
    var r = b.closest(".hed-r"), fs = r.querySelector(".hed-fs"); if (fs.children.length >= 3) return;
    fs.insertAdjacentHTML("beforeend", '<span class="hed-f extra"><input type="time" data-ab value="17:00" aria-label="Abre às"><span>às</span><input type="time" data-fe value="22:00" aria-label="Fecha às"><button type="button" class="hed-x" data-tira-faixa aria-label="Remover este horário">×</button></span>');
    r.dataset.mexeu = "1"; var h = r.closest(".hed"); if (h) h.dataset.mudou = "1";
  });
  window.Horario = { paraObj: paraObj, agoraDallas: agoraDallas, ler: ler, dados: dados, agora: agora, html: html, editor: editor, lerEditor: lerEditor, texto: texto };
})();
