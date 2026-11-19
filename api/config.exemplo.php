<?php
/* Copie este arquivo para config.php (na mesma pasta) só se quiser mudar algo. Sem config.php, valem os padrões abaixo. */
return [
  // Onde fica o banco. Mais seguro: uma pasta fora de public_html, ex.: '/home/SEU_USUARIO/dados-coracaobr/coracaobr.sqlite'
  'db' => __DIR__ . '/../dados/coracaobr.sqlite',
  // Remetente dos e-mails de "Esqueci minha senha". Crie esta caixa no hPanel → E-mails para não cair no spam.
  'email_remetente' => 'nao-responda@infobitestudio.com.br',
  // Quantos dias a pessoa fica conectada sem precisar entrar de novo
  'sessao_dias' => 30,
];
