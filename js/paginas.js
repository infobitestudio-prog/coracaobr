/* Páginas institucionais da CoraçãoBR: sobre e contato, termos de uso e privacidade. */
(function () {
  "use strict";
  var G = window.Guia, esc = G.esc;
  function pagina(eyebrow, titulo, corpo) {
    G.app.innerHTML = '<section class="block"><div class="wrap stack in prose-pg" style="max-width:760px"><div><p class="eyebrow">' + eyebrow + '</p><h1 class="page-h" style="margin-top:4px">' + titulo + "</h1></div>" + corpo + "</div></section>";
  }
  function email() { var e = String(G.config().emailOficial || "").trim(); return /^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(e) ? e : "coracaobr.oficial@gmail.com"; }
  function mailto(assunto) { return "mailto:" + email() + (assunto ? "?subject=" + encodeURIComponent("CoraçãoBR: " + assunto) : ""); }
  function contato() {
    var c = G.config(), zap = String(c.whatsappAviso || "").replace(/\D/g, "");
    return '<p><b>E-mail oficial:</b> <a href="' + mailto("") + '">' + esc(email()) + "</a></p>" + (c.contato && c.contato !== email() ? "<p><b>Contato comercial:</b> " + esc(c.contato) + "</p>" : "") + (zap ? '<p><b>WhatsApp:</b> <a href="https://wa.me/' + esc(zap) + '" target="_blank" rel="noopener">+' + esc(zap) + "</a></p>" : "");
  }
  /* cartões de contato por assunto: o e-mail já abre com o assunto certo */
  function contatoCards() {
    var t = function (ic, tit, txt, ass) { return '<a class="ct-card" href="' + mailto(ass) + '"><span class="ct-ic">' + ic + "</span><b>" + tit + "</b><small>" + txt + "</small></a>"; };
    return '<div class="ct-mail"><span>E-mail oficial</span><a href="' + mailto("") + '">' + esc(email()) + '</a><button type="button" class="btn ghost sm" data-copiar="' + esc(email()) + '">Copiar</button></div>' +
      '<div class="ct-grid">' + t("📣", "Anúncios e pagamentos", "Planos, promoção, confirmação de pagamento e notas.", "anúncios e pagamentos") +
      t("🤝", "Parcerias e patrocínio", "Empresas, criadores e eventos que querem aparecer.", "parceria") +
      t("📍", "Corrigir informação", "Preço, horário ou endereço errado em algum lugar.", "correção de informação") +
      t("🔒", "Privacidade e dados", "Remover sua conta, avaliações ou dados pessoais.", "privacidade e dados") + "</div>" +
      (function () { var zap = String(G.config().whatsappAviso || "").replace(/\D/g, ""); return zap ? '<p class="small muted">Também atendemos no WhatsApp: <a href="https://wa.me/' + esc(zap) + '" target="_blank" rel="noopener">+' + esc(zap) + "</a>.</p>" : ""; })();
  }
  function viewSobre() {
    var n = G.lugares().length, ev = G.lugares().filter(function (l) { return l.categoria === "evento"; }).length;
    pagina("Sobre", "CoraçãoBR",
      '<p class="lead">Coração brasileiro, em qualquer lugar do mundo. Reunimos em português o que um brasileiro precisa para viver ou passear fora do Brasil: passeios, eventos, restaurantes, serviços, documentos e comunidade. Dallas–Fort Worth, no Texas, é o nosso primeiro mercado.</p>' +
      '<div class="kpis"><div class="kpi"><b class="num">' + n + '</b><span>lugares no guia</span></div><div class="kpi"><b class="num">' + ev + '</b><span>eventos acompanhados</span></div><div class="kpi"><b class="num">3</b><span>idiomas na interface</span></div></div>' +
      "<h2>Como funciona</h2><ul><li>A curadoria visita fontes oficiais e confere preços, horários e endereços. Cada lugar mostra a data da última conferência.</li><li>Eventos, hotéis, avisos da comunidade e a cotação do dólar são atualizados todos os dias.</li><li>As notas combinam a avaliação da curadoria com as avaliações de quem foi.</li><li>Empresas anunciam com plano mensal e aparecem marcadas como Patrocinado.</li></ul>" +
      "<h2 id=\"contato\">Fale com a gente</h2>" + contatoCards() +
      '<div class="row"><a class="btn" href="#anuncie">Anunciar meu negócio</a><a class="btn ghost" href="#termos">Termos de uso</a><a class="btn ghost" href="#privacidade">Privacidade</a></div>');
  }
  function viewTermos() {
    pagina("CoraçãoBR", "Termos de uso",
      '<p class="muted small">Atualizado em novembro de 2026.</p>' +
      "<h2>1. O serviço</h2><p>A CoraçãoBR é um guia informativo. Preços, horários e datas são conferidos em fontes oficiais, mas podem mudar sem aviso. Confirme com o estabelecimento antes de ir.</p>" +
      "<h2>2. Avaliações e conteúdo enviado</h2><p>Ao avaliar um lugar ou publicar no mural você declara que o conteúdo é verdadeiro e seu. Não são permitidos conteúdo ofensivo, discriminatório, enganoso, propaganda disfarçada ou dados pessoais de terceiros. A equipe pode remover publicações que descumpram estas regras.</p>" +
      "<h2>3. Mural de vagas e classificados</h2><p>A CoraçãoBR não intermedeia negócios, não garante anúncios de terceiros e não recebe pagamentos entre usuários. Desconfie de quem pede pagamento adiantado.</p>" +
      "<h2>4. Anunciantes</h2><p>O anunciante é responsável pelas informações, ofertas e cupons publicados. A assinatura é mensal, com renovação automática, e pode ser cancelada a qualquer momento no painel do anunciante; o anúncio fica no ar até o fim do período pago. Anúncios aparecem marcados como Patrocinado.</p>" +
      "<h2>5. Roteiro com IA</h2><p>As sugestões são geradas a partir dos lugares cadastrados e servem como ponto de partida. Verifique horários e preços.</p>" +
      "<h2>6. Contato</h2>" + contato());
  }
  function viewPrivacidade() {
    pagina("CoraçãoBR", "Privacidade",
      '<p class="muted small">Atualizado em novembro de 2026.</p>' +
      "<h2>O que guardamos</h2><ul><li><b>Na sua conta:</b> lista de lugares salvos, lembretes, roteiros e o nome que você escolher, para aparecerem em qualquer aparelho.</li><li><b>Públicos:</b> avaliações e publicações no mural, com o nome que você escolheu.</li><li><b>Estatísticas anônimas:</b> quantas vezes um anúncio foi visto ou clicado, sem identificar você para o anunciante.</li></ul>" +
      "<h2>Localização</h2><p>A localização é usada só no seu aparelho, para calcular distâncias e, se você ativar, avisar sobre lugares por perto. Ela não é enviada nem guardada pela CoraçãoBR.</p>" +
      "<h2>Notificações</h2><p>Só com a sua permissão, e você pode desligar a qualquer momento em Minha conta.</p>" +
      "<h2>Seus direitos</h2><p>Você pode apagar suas avaliações, roteiros e publicações a qualquer momento. Para remover todos os seus dados, escreva para <a href=\"" + mailto("privacidade e dados") + "\">" + esc(email()) + "</a>.</p>" + "<h2>Contato</h2>" + contato());
  }
  G.views.sobre = viewSobre; G.emailOficial = email; G.mailto = mailto; G.views.termos = viewTermos; G.views.privacidade = viewPrivacidade;
})();
