<?php
/* CoraçãoBR · API do servidor próprio (PHP 8 + SQLite).
   Contas com e-mail e senha, três papéis (usuario, anunciante, master) e os dados do guia.
   As regras de quem lê e quem grava cada coleção ficam aqui, no servidor; o navegador nunca decide permissão.
   Configuração opcional em api/config.php (veja config.exemplo.php). */
declare(strict_types=1);

$CFG = [
  'db' => __DIR__ . '/../dados/coracaobr.sqlite',
  'uploads' => __DIR__ . '/../uploads',
  'seed' => __DIR__ . '/../data/seed.json',
  'config_inicial' => __DIR__ . '/../data/config-inicial.json',
  'email_remetente' => '',          // ex.: nao-responda@seudominio.com.br (vazio = nao-responda@<domínio do site>)
  'email_oficial' => 'coracaobr.oficial@gmail.com',   // contato oficial: recebe avisos importantes (pagamentos, novos anunciantes, denúncias) e as respostas dos e-mails do site
  'sessao_dias' => 30,
];
if (is_file(__DIR__ . '/config.php')) { $extra = require __DIR__ . '/config.php'; if (is_array($extra)) $CFG = array_merge($CFG, $extra); }

const COLS = ['lugares','avaliacoes','anuncios','config','fluxos','avisos','metricas','anunciantes','classificados','alertas','cupons','interesse','perfis','parceiros','respostas','posts','curtidas','seguindo','pagamentos','pets','perguntas'];
const PUBLICAS = ['lugares','config','anuncios','alertas','anunciantes','avaliacoes','fluxos','metricas','classificados','cupons','parceiros','posts','curtidas','seguindo','pagamentos','pets','perguntas'];
const SO_MASTER = ['lugares','config','anuncios','alertas','parceiros','pagamentos'];
const POR_PESSOA = ['avaliacoes','fluxos','avisos','metricas','anunciantes','classificados','cupons','interesse','perfis','respostas','posts','curtidas','seguindo','pets','perguntas'];
const PAPEIS = ['usuario','anunciante','master'];
const ID_RE = '/^[A-Za-z0-9_-]{1,120}$/';

header('Content-Type: application/json; charset=utf-8');
header('X-Content-Type-Options: nosniff');
header('Cache-Control: no-store');
header('Referrer-Policy: same-origin');

function sai(array $o, int $cod = 200): never { http_response_code($cod); echo json_encode($o, JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES); exit; }
function erro(string $msg, int $cod = 400): never { sai(['ok' => false, 'erro' => $msg], $cod); }
function agora(): string { return gmdate('c'); }

/* ---------- sessão ---------- */
$https = (!empty($_SERVER['HTTPS']) && $_SERVER['HTTPS'] !== 'off') || (($_SERVER['HTTP_X_FORWARDED_PROTO'] ?? '') === 'https');
$caminho = rtrim(str_replace('\\', '/', dirname(dirname($_SERVER['SCRIPT_NAME'] ?? '/api/index.php'))), '/') . '/';
$vida = 86400 * (int)$CFG['sessao_dias'];
ini_set('session.gc_maxlifetime', (string)$vida);
ini_set('session.use_strict_mode', '1');
session_name('CBRSESS');
session_set_cookie_params(['lifetime' => $vida, 'path' => $caminho, 'secure' => $https, 'httponly' => true, 'samesite' => 'Lax']);
session_start();
if (empty($_SESSION['csrf'])) $_SESSION['csrf'] = bin2hex(random_bytes(24));
if (empty($_SESSION['visitante'])) $_SESSION['visitante'] = 'v' . bin2hex(random_bytes(8));

/* ---------- banco ---------- */
function banco(): PDO {
  static $pdo = null; global $CFG;
  if ($pdo) return $pdo;
  $dir = dirname($CFG['db']);
  if (!is_dir($dir)) { @mkdir($dir, 0750, true); }
  if (!is_file($dir . '/.htaccess')) @file_put_contents($dir . '/.htaccess', "Require all denied\nDeny from all\n");
  if (!is_file($dir . '/index.html')) @file_put_contents($dir . '/index.html', '');
  $novo = !is_file($CFG['db']);
  $pdo = new PDO('sqlite:' . $CFG['db'], null, null, [PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION, PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC]);
  $pdo->exec('PRAGMA journal_mode=WAL; PRAGMA foreign_keys=ON; PRAGMA busy_timeout=4000;');
  $pdo->exec('CREATE TABLE IF NOT EXISTS usuarios (id TEXT PRIMARY KEY, email TEXT NOT NULL UNIQUE COLLATE NOCASE, nome TEXT NOT NULL, hash TEXT NOT NULL, papel TEXT NOT NULL, bloqueado INTEGER NOT NULL DEFAULT 0, criado TEXT NOT NULL, ultimo TEXT, reset_hash TEXT, reset_exp INTEGER);
    CREATE TABLE IF NOT EXISTS docs (col TEXT NOT NULL, id TEXT NOT NULL, data TEXT NOT NULL, em TEXT NOT NULL, PRIMARY KEY (col, id));
    CREATE TABLE IF NOT EXISTS versoes (col TEXT PRIMARY KEY, v INTEGER NOT NULL);
    CREATE TABLE IF NOT EXISTS tentativas (chave TEXT NOT NULL, em INTEGER NOT NULL);
    CREATE INDEX IF NOT EXISTS tent_chave ON tentativas (chave, em);
    CREATE TABLE IF NOT EXISTS fotos (id TEXT PRIMARY KEY, dono TEXT NOT NULL, em TEXT NOT NULL);
    CREATE TABLE IF NOT EXISTS meta (k TEXT PRIMARY KEY, v TEXT);
    CREATE TABLE IF NOT EXISTS assinantes (email TEXT PRIMARY KEY COLLATE NOCASE, nome TEXT, token TEXT NOT NULL, ativo INTEGER NOT NULL DEFAULT 1, origem TEXT, uid TEXT, criado TEXT NOT NULL, saiu TEXT);
    CREATE TABLE IF NOT EXISTS envios (id INTEGER PRIMARY KEY AUTOINCREMENT, assunto TEXT, modo TEXT, enviados INTEGER, falhas INTEGER, em TEXT);');
  $cols = array_column($pdo->query('PRAGMA table_info(usuarios)')->fetchAll(), 'name');
  foreach (['zip' => 'TEXT', 'zip_lat' => 'REAL', 'zip_lng' => 'REAL', 'zip_cidade' => 'TEXT'] as $c => $t) if (!in_array($c, $cols, true)) $pdo->exec("ALTER TABLE usuarios ADD COLUMN $c $t");
  importaBase($pdo, $novo);
  return $pdo;
}
/* Na criação do banco, e quando data/seed.json muda de versão, entram os lugares que ainda não existem. Nada já salvo é sobrescrito. */
function importaBase(PDO $pdo, bool $novo): void {
  global $CFG;
  if (!is_file($CFG['seed'])) return;
  $seed = json_decode((string)file_get_contents($CFG['seed']), true);
  if (!is_array($seed)) return;
  $versao = (string)($seed['versao'] ?? '');
  $atual = $pdo->query("SELECT v FROM meta WHERE k='seed'")->fetchColumn();
  if ($atual === $versao && !$novo) return;
  $pdo->beginTransaction();
  $ins = $pdo->prepare('INSERT OR IGNORE INTO docs (col, id, data, em) VALUES (?, ?, ?, ?)');
  foreach (($seed['lugares'] ?? []) as $l) {
    if (!is_array($l) || !preg_match(ID_RE, (string)($l['id'] ?? ''))) continue;
    $id = $l['id']; unset($l['id']);
    $ins->execute(['lugares', $id, json_encode($l, JSON_UNESCAPED_UNICODE), agora()]);
    if (!empty($l['fotoSite']['src'])) {   // imagem oficial do site: completa lugares já existentes, sem mexer no resto
      $st = $pdo->prepare("SELECT data FROM docs WHERE col = 'lugares' AND id = ?"); $st->execute([$id]); $d = json_decode((string)$st->fetchColumn(), true);
      if (is_array($d) && empty($d['fotoSite']['src'])) { $d['fotoSite'] = $l['fotoSite']; $pdo->prepare("UPDATE docs SET data = ?, em = ? WHERE col = 'lugares' AND id = ?")->execute([json_encode($d, JSON_UNESCAPED_UNICODE), agora(), $id]); }
    }
  }
  if (is_file($CFG['config_inicial'])) {
    $cfg = json_decode((string)file_get_contents($CFG['config_inicial']), true);
    if (is_array($cfg)) foreach ($cfg as $id => $d) if (preg_match(ID_RE, (string)$id) && is_array($d)) $ins->execute(['config', $id, json_encode($d, JSON_UNESCAPED_UNICODE), agora()]);
  }
  $pdo->prepare("INSERT OR REPLACE INTO meta (k, v) VALUES ('seed', ?)")->execute([$versao]);
  $pdo->exec("INSERT OR IGNORE INTO versoes (col, v) VALUES ('lugares', 1), ('config', 1)");
  $pdo->exec("UPDATE versoes SET v = v + 1 WHERE col IN ('lugares','config')");
  $pdo->commit();
}

/* ---------- quem está pedindo ---------- */
function eu(): ?array {
  static $u = false;
  if ($u !== false) return $u;
  $u = null;
  if (!empty($_SESSION['uid'])) {
    $st = banco()->prepare('SELECT id, email, nome, papel, bloqueado FROM usuarios WHERE id = ?');
    $st->execute([$_SESSION['uid']]);
    $r = $st->fetch();
    if ($r && !(int)$r['bloqueado']) $u = $r; else { unset($_SESSION['uid']); }
  }
  return $u;
}
function master(): bool { $u = eu(); return $u && $u['papel'] === 'master'; }
function exigeLogin(): array { $u = eu(); if (!$u) erro('Entre na sua conta para continuar.', 401); return $u; }
function exigeMaster(): void { if (!master()) erro('Só a conta master pode fazer isso.', 403); }

/* ---------- limites contra abuso ---------- */
function limite(string $chave, int $max, int $janela): bool {
  $pdo = banco(); $t = time();
  if (random_int(1, 50) === 1) $pdo->prepare('DELETE FROM tentativas WHERE em < ?')->execute([$t - 86400]);
  $st = $pdo->prepare('SELECT COUNT(*) FROM tentativas WHERE chave = ? AND em > ?');
  $st->execute([$chave, $t - $janela]);
  return (int)$st->fetchColumn() < $max;
}
function marca(string $chave): void { banco()->prepare('INSERT INTO tentativas (chave, em) VALUES (?, ?)')->execute([$chave, time()]); }
function ip(): string { return substr((string)($_SERVER['REMOTE_ADDR'] ?? '0'), 0, 64); }

/* ---------- entrada ---------- */
$acao = (string)($_GET['acao'] ?? '');
$metodo = $_SERVER['REQUEST_METHOD'] ?? 'GET';
$corpo = [];
if ($metodo === 'POST' && $acao !== 'pix_webhook') {   // o aviso do Mercado Pago não traz CSRF; ele é conferido consultando o pagamento na API
  $origem = $_SERVER['HTTP_ORIGIN'] ?? '';
  if ($origem !== '' && parse_url($origem, PHP_URL_HOST) !== parse_url('//' . ($_SERVER['HTTP_HOST'] ?? ''), PHP_URL_HOST)) erro('Origem não permitida.', 403);
  if (!hash_equals($_SESSION['csrf'], (string)($_SERVER['HTTP_X_CSRF'] ?? ''))) erro('Sessão expirada. Recarregue a página.', 403);
  if (stripos((string)($_SERVER['CONTENT_TYPE'] ?? ''), 'application/json') === 0) {
    $bruto = file_get_contents('php://input', false, null, 0, 1_200_000);
    $corpo = json_decode((string)$bruto, true);
    if (!is_array($corpo)) erro('Pedido inválido.');
  }
}
function campo(string $k, int $max = 200): string { global $corpo; $v = $corpo[$k] ?? ''; return is_string($v) ? trim(mb_substr($v, 0, $max)) : ''; }
function senhaOk(string $s): ?string {
  if (mb_strlen($s) < 8) return 'A senha precisa ter pelo menos 8 caracteres.';
  if (mb_strlen($s) > 200) return 'Senha longa demais.';
  if (!preg_match('/[A-Za-z]/', $s) || !preg_match('/\d/', $s)) return 'Use letras e números na senha.';
  return null;
}
function publico(array $u): array {
  if (!array_key_exists('zip', $u)) { $st = banco()->prepare('SELECT zip, zip_lat, zip_lng, zip_cidade FROM usuarios WHERE id = ?'); $st->execute([$u['id']]); $u += ($st->fetch() ?: []); }
  return ['uid' => $u['id'], 'nome' => $u['nome'], 'email' => $u['email'], 'papel' => $u['papel'] === 'master' ? 'master' : 'usuario', 'zip' => (string)($u['zip'] ?? ''), 'zipCidade' => (string)($u['zip_cidade'] ?? ''),
    'zipLat' => isset($u['zip_lat']) ? (float)$u['zip_lat'] : null, 'zipLng' => isset($u['zip_lng']) ? (float)$u['zip_lng'] : null];
}
/* CEP americano (ZIP code): 5 dígitos. Busca cidade e coordenadas para avisar do que fica perto. */
function zipLimpo(string $z): string { $z = preg_replace('/\D/', '', $z); return strlen($z) >= 5 ? substr($z, 0, 5) : ''; }
function zipInfo(string $zip): ?array {
  $ctx = stream_context_create(['http' => ['timeout' => 8, 'ignore_errors' => true, 'header' => 'User-Agent: CoracaoBR/1.0']]);
  $j = json_decode((string)@file_get_contents('https://api.zippopotam.us/us/' . $zip, false, $ctx), true);
  $p = $j['places'][0] ?? null; if (!$p) return zipAprox($zip);
  return ['lat' => round((float)$p['latitude'], 5), 'lng' => round((float)$p['longitude'], 5), 'cidade' => trim(($p['place name'] ?? '') . ', ' . ($p['state abbreviation'] ?? ''), ', ')];
}
/* Sem resposta do serviço de CEP: posição aproximada pelos 3 primeiros números (regiões do guia no Texas). */
function zipAprox(string $zip): ?array {
  $t = ['750' => [32.95, -96.75, 'Dallas'], '751' => [32.78, -96.8, 'Dallas'], '752' => [32.78, -96.8, 'Dallas'], '753' => [32.78, -96.8, 'Dallas'], '754' => [33.14, -96.11, 'Greenville'],
    '760' => [32.74, -97.11, 'Arlington'], '761' => [32.75, -97.33, 'Fort Worth'], '762' => [33.21, -97.13, 'Denton'], '770' => [29.76, -95.37, 'Houston'], '772' => [29.76, -95.37, 'Houston'],
    '773' => [30.17, -95.46, 'The Woodlands'], '774' => [29.62, -95.63, 'Sugar Land'], '775' => [29.59, -95.12, 'Pasadena'], '786' => [30.51, -97.68, 'Round Rock'], '787' => [30.27, -97.74, 'Austin'],
    '780' => [29.55, -98.3, 'San Antonio'], '781' => [29.7, -98.12, 'New Braunfels'], '782' => [29.42, -98.49, 'San Antonio']];
  $k = substr($zip, 0, 3); if (!isset($t[$k])) return null;
  return ['lat' => $t[$k][0], 'lng' => $t[$k][1], 'cidade' => 'Região de ' . $t[$k][2] . ', TX'];
}
function gravaZip(string $uid, string $zip): void {
  $i = zipInfo($zip);
  banco()->prepare('UPDATE usuarios SET zip = ?, zip_lat = ?, zip_lng = ?, zip_cidade = ? WHERE id = ?')->execute([$zip, $i['lat'] ?? null, $i['lng'] ?? null, $i['cidade'] ?? '', $uid]);
}
/* Ferramentas de anúncio liberadas: pacote em vigor (ou cortesia) */
function temPlano(string $uid): bool { return vagasDe(pagamentoDe($uid)) > 0; }
function entra(array $u): void {
  session_regenerate_id(true);
  $_SESSION['uid'] = $u['id'];
  $_SESSION['csrf'] = bin2hex(random_bytes(24));
  banco()->prepare('UPDATE usuarios SET ultimo = ? WHERE id = ?')->execute([agora(), $u['id']]);
}
function novoUid(): string { return 'u' . bin2hex(random_bytes(8)); }
/* Chave de instalação: um arquivo em dados/ (bloqueado para a web) que só quem tem acesso à hospedagem lê.
   Sem ela, ninguém cria a conta master, mesmo que abra o site antes do dono. */
function chaveInstalacao(): string {
  global $CFG;
  if (!empty($CFG['chave_instalacao'])) return strtoupper(trim((string)$CFG['chave_instalacao']));   // definida em api/config.php (fora do repositório)
  $f = dirname($CFG['db']) . '/CHAVE-INSTALACAO.txt';
  if (!is_file($f)) @file_put_contents($f, strtoupper(bin2hex(random_bytes(5))) . "\n");
  return trim((string)@file_get_contents($f));
}
function pagamentoDe(string $uid): array { $s = banco()->prepare("SELECT data FROM docs WHERE col = 'pagamentos' AND id = ?"); $s->execute([$uid]); $j = $s->fetchColumn(); return $j ? (json_decode($j, true) ?: []) : []; }
/* Pacotes do anunciante (R$ 50 = 3 anúncios por 1 mês; somam). Inclui os registros antigos (pagoAte/creditos). */
function pacotesDe(array $pg): array {
  if (isset($pg['pacotes']) && is_array($pg['pacotes'])) return array_values(array_filter($pg['pacotes'], fn($x) => is_array($x) && !empty($x['inicio']) && !empty($x['fim'])));
  $out = [];
  if (!empty($pg['pagoAte'])) $out[] = ['id' => 'antigo', 'tipo' => 'pacote', 'anuncios' => 3, 'inicio' => date('Y-m-d', strtotime($pg['pagoAte'] . ' -30 day')), 'fim' => $pg['pagoAte']];
  foreach ((array)($pg['creditos'] ?? []) as $i => $c) if (is_array($c) && !empty($c['ate'])) $out[] = ['id' => "cred$i", 'tipo' => 'promo', 'anuncios' => 1, 'inicio' => substr((string)($c['em'] ?? $c['ate']), 0, 10), 'fim' => $c['ate']];
  return $out;
}
/* Quantos anúncios a conta pode ter no ar hoje (pacotes em vigor + 2 dias de tolerância, ou cortesia da equipe). */
function vagasDe(array $pg, ?string $hoje = null): int {
  $hoje = $hoje ?: date('Y-m-d'); if (($pg['status'] ?? '') === 'suspenso') return 0;
  $n = 0; $tol = date('Y-m-d', strtotime($hoje . ' -2 day'));
  foreach (pacotesDe($pg) as $pk) if ($pk['inicio'] <= $hoje && $pk['fim'] >= $tol) $n += (int)($pk['anuncios'] ?? 0);
  if (($pg['status'] ?? '') === 'cortesia' && !empty($pg['cortesiaAte']) && $hoje <= $pg['cortesiaAte']) $n = max($n, (int)($pg['cortesiaVagas'] ?? 3));
  return $n;
}
/* ===== Pix automático (Mercado Pago): cobrança com QR Code por compra; o pagamento aprovado libera o pacote sozinho ===== */
function mpToken(): string { global $CFG; $t = trim((string)($CFG['mercadopago_token'] ?? '')); if ($t === '') $t = trim((string)@file_get_contents(dirname($CFG['db']) . '/MERCADOPAGO.token')); return $t; }
function mp(string $metodo, string $caminho, ?array $corpo = null, string $idem = ''): ?array {
  $h = ['Authorization: Bearer ' . mpToken(), 'Content-Type: application/json', 'User-Agent: CoracaoBR/1.0'];
  if ($idem !== '') $h[] = 'X-Idempotency-Key: ' . $idem;
  $ctx = stream_context_create(['http' => ['method' => $metodo, 'header' => implode("\r\n", $h), 'content' => $corpo === null ? '' : json_encode($corpo, JSON_UNESCAPED_UNICODE), 'timeout' => 25, 'ignore_errors' => true]]);
  $r = @file_get_contents('https://api.mercadopago.com' . $caminho, false, $ctx); return $r === false ? null : json_decode($r, true);
}
/* preços em reais, do Painel master (com os padrões novos se a configuração ainda for a antiga, em dólar) */
function precosServidor(): array {
  $g = configDoc('geral'); $brl = ($g['moedaAnuncio'] ?? '') === 'BRL'; $pr = (array)($g['promo'] ?? []);
  return ['pacote' => $brl ? (float)($g['precoAnuncio'] ?? 50) : 50.0, 'porPacote' => $brl ? max(1, (int)($g['anunciosPorPacote'] ?? 3)) : 3,
    'promo' => $brl ? (float)($pr['preco'] ?? 20) : 20.0, 'promoDepo' => $brl ? max(1, (int)($pr['curadorias'] ?? 5)) : 5, 'promoAnuncios' => 1,
    'selo' => (float)($g['precoVerificado'] ?? 30) ?: 30.0, 'impulso' => (float)($g['precoImpulso'] ?? 25) ?: 25.0, 'diasImpulso' => max(1, (int)($g['diasImpulso'] ?? 7)),
    'clube' => (float)($g['precoClube'] ?? 15) ?: 15.0, 'mural' => (float)($g['precoMural'] ?? 10) ?: 10.0, 'diasMural' => max(1, (int)($g['diasMural'] ?? 30))];
}
function hojeDallas(): string { return (new DateTime('now', new DateTimeZone('America/Chicago')))->format('Y-m-d'); }
function maisUmMesPhp(string $iso): string { $d = new DateTime($iso . ' 12:00'); $dia = (int)$d->format('j'); $d->modify('first day of next month'); $d->setDate((int)$d->format('Y'), (int)$d->format('n'), min($dia, (int)$d->format('t'))); return $d->format('Y-m-d'); }
/* grava o pacote pago na conta (mesma regra do painel master) e avisa por e-mail */
function aplicaPacote(string $uid, array $c, string $pagId): array {
  $pdo = banco(); $pg = pagamentoDe($uid); $hoje = hojeDallas(); $p = precosServidor();
  $lista = pacotesDe($pg);
  foreach ($lista as $x) if (($x['aviso'] ?? '') === 'mp:' . $pagId) return $x;   // já aplicado
  $fimAtual = ''; $tol = date('Y-m-d', strtotime($hoje . ' -2 day'));
  foreach ($lista as $x) if ($x['inicio'] <= $hoje && $x['fim'] >= $tol && $x['fim'] > $fimAtual) $fimAtual = $x['fim'];
  $plano = (string)($c['plano'] ?? 'pacote');
  if ($plano === 'verificado') {
    $pg['verificacao'] = ['status' => 'analise', 'pagoEm' => gmdate('c'), 'valor' => (float)($c['valor'] ?? 0), 'aviso' => 'mp:' . $pagId];
    $pdo->prepare('INSERT INTO docs (col, id, data, em) VALUES (?, ?, ?, ?) ON CONFLICT(col, id) DO UPDATE SET data = excluded.data, em = excluded.em')->execute(['pagamentos', $uid, json_encode($pg, JSON_UNESCAPED_UNICODE), agora()]); versao('pagamentos');
    avisaEquipe('Selo Verificado pago · conferir negócio', "Pix do selo Verificado aprovado. Abra Painel master → Pagamentos → Selo Verificado para conferir e aprovar.\nConta: $uid");
    return ['tipo' => 'verificado'];
  }
  if ($plano === 'clube' || $plano === 'mural') {
    foreach ((array)($pg[$plano === 'clube' ? 'clubePag' : 'mural'] ?? []) as $x) if (($x['aviso'] ?? '') === 'mp:' . $pagId) return $x;
    $u0 = $pdo->prepare('SELECT nome FROM usuarios WHERE id = ?'); $u0->execute([$uid]); $nome0 = (string)($u0->fetchColumn() ?: '');
    if ($plano === 'clube') {
      $cl = (array)($pg['clube'] ?? []); $ini = !empty($cl['ate']) && $cl['ate'] >= $hoje ? date('Y-m-d', strtotime($cl['ate'] . ' +1 day')) : $hoje;
      $pk = ['id' => 'cl' . base_convert((string)time(), 10, 36), 'valor' => (float)($c['valor'] ?? 0), 'pagoEm' => gmdate('c'), 'inicio' => $ini, 'fim' => maisUmMesPhp($ini), 'aviso' => 'mp:' . $pagId, 'metodo' => 'pix-auto'];
      $pg['clubePag'] = array_slice(array_merge((array)($pg['clubePag'] ?? []), [$pk]), -60);
      $pg['clube'] = ['desde' => $cl['desde'] ?? $hoje, 'ate' => $pk['fim'], 'nome' => $nome0, 'numero' => $cl['numero'] ?? strtoupper(substr(hash('sha256', $uid), 0, 8))];
      avisaEquipe('Novo membro do Clube · R$ ' . number_format($pk['valor'], 2, ',', '.'), "Assinatura do Clube CoraçãoBR paga e liberada automaticamente.\nConta: $nome0 ($uid)\nVálida até " . date('d/m/Y', strtotime($pk['fim'])));
    } else {
      $item = (string)($c['itemId'] ?? ''); $ja = ''; foreach ((array)($pg['mural'] ?? []) as $x) if (($x['itemId'] ?? '') === $item && $x['fim'] >= $hoje && $x['fim'] > $ja) $ja = $x['fim'];
      $ini = $ja ? date('Y-m-d', strtotime($ja . ' +1 day')) : $hoje;
      $pk = ['id' => 'mu' . base_convert((string)time(), 10, 36), 'itemId' => $item, 'valor' => (float)($c['valor'] ?? 0), 'pagoEm' => gmdate('c'), 'inicio' => $ini, 'fim' => date('Y-m-d', strtotime($ini . ' +' . ($p['diasMural'] - 1) . ' day')), 'aviso' => 'mp:' . $pagId, 'metodo' => 'pix-auto'];
      $pg['mural'] = array_slice(array_merge((array)($pg['mural'] ?? []), [$pk]), -60);
    }
    $pg['atualizadoEm'] = gmdate('c');
    $pdo->prepare('INSERT INTO docs (col, id, data, em) VALUES (?, ?, ?, ?) ON CONFLICT(col, id) DO UPDATE SET data = excluded.data, em = excluded.em')->execute(['pagamentos', $uid, json_encode($pg, JSON_UNESCAPED_UNICODE), agora()]); versao('pagamentos');
    return $pk;
  }
  if ($plano === 'impulso') {
    $ja = ''; foreach ($lista as $x) if (($x['tipo'] ?? '') === 'impulso' && ($x['lugarId'] ?? '') === ($c['lugarId'] ?? '') && $x['fim'] >= $hoje && $x['fim'] > $ja) $ja = $x['fim'];
    $ini = $ja ? date('Y-m-d', strtotime($ja . ' +1 day')) : $hoje;
    $pk = ['id' => 'im' . base_convert((string)time(), 10, 36), 'tipo' => 'impulso', 'lugarId' => (string)($c['lugarId'] ?? ''), 'qtd' => 1, 'anuncios' => 0, 'valor' => (float)($c['valor'] ?? 0), 'moeda' => 'BRL', 'pagoEm' => gmdate('c'), 'inicio' => $ini, 'fim' => date('Y-m-d', strtotime($ini . ' +' . ($p['diasImpulso'] - 1) . ' day')), 'ativaEm' => '', 'aviso' => 'mp:' . $pagId, 'metodo' => 'pix-auto'];
    $lista[] = $pk; $pg['pacotes'] = array_slice($lista, -120);
    $pdo->prepare('INSERT INTO docs (col, id, data, em) VALUES (?, ?, ?, ?) ON CONFLICT(col, id) DO UPDATE SET data = excluded.data, em = excluded.em')->execute(['pagamentos', $uid, json_encode($pg, JSON_UNESCAPED_UNICODE), agora()]); versao('pagamentos');
    return $pk;
  }
  $promo = $plano === 'promo'; $qtd = $promo ? 1 : max(1, min(30, (int)($c['qtd'] ?? 1)));
  $ini = ($c['comeca'] ?? '') === 'renovar' && $fimAtual ? date('Y-m-d', strtotime($fimAtual . ' +1 day')) : $hoje;
  $pk = ['id' => 'pk' . base_convert((string)time(), 10, 36) . substr($pagId, -4), 'tipo' => $promo ? 'promo' : 'pacote', 'qtd' => $qtd, 'anuncios' => $promo ? $p['promoAnuncios'] : $qtd * $p['porPacote'], 'curadorias' => $promo ? $p['promoDepo'] : 0,
    'valor' => (float)($c['valor'] ?? 0), 'moeda' => 'BRL', 'pagoEm' => gmdate('c'), 'inicio' => $ini, 'fim' => maisUmMesPhp($ini), 'ativaEm' => $ini === $hoje ? gmdate('c') : $ini . 'T00:00:00', 'aviso' => 'mp:' . $pagId, 'metodo' => 'pix-auto'];
  $lista[] = $pk; $pg['pacotes'] = array_slice($lista, -120);
  if (($pg['status'] ?? '') !== 'suspenso') $pg['status'] = 'ativo';
  if ($promo) $pg['curadorias'] = (int)($pg['curadorias'] ?? 0) + $pk['curadorias'];
  if (!$promo && (float)($c['desconto'] ?? 0) > 0) { $pk['desconto'] = (float)$c['desconto']; $pg['pacotes'][count($pg['pacotes']) - 1]['desconto'] = $pk['desconto']; $pg['creditosIndicacao'] = max(0, (int)($pg['creditosIndicacao'] ?? 0) - 1); }
  $pg['atualizadoEm'] = gmdate('c');
  $pdo->prepare('INSERT INTO docs (col, id, data, em) VALUES (?, ?, ?, ?) ON CONFLICT(col, id) DO UPDATE SET data = excluded.data, em = excluded.em')->execute(['pagamentos', $uid, json_encode($pg, JSON_UNESCAPED_UNICODE), agora()]);
  versao('pagamentos');
  premiaIndicacao($uid);
  $u = $pdo->prepare('SELECT email, nome FROM usuarios WHERE id = ?'); $u->execute([$uid]); $u = $u->fetch() ?: ['email' => '', 'nome' => ''];
  $desc = $promo ? '1 anúncio + ' . $pk['curadorias'] . ' depoimentos' : $pk['anuncios'] . ' anúncios';
  avisaEquipe('Pix aprovado · R$ ' . number_format($pk['valor'], 2, ',', '.'), "Pagamento Pix aprovado e liberado automaticamente.\n\nConta: {$u['nome']} <{$u['email']}>\nPlano: $desc\nPeríodo: " . date('d/m/Y', strtotime($pk['inicio'])) . ' a ' . date('d/m/Y', strtotime($pk['fim'])) . "\nMercado Pago: $pagId");
  if (filter_var($u['email'], FILTER_VALIDATE_EMAIL)) {
    global $CFG; $host = preg_replace('/[^a-z0-9.-]/i', '', (string)($_SERVER['HTTP_HOST'] ?? 'localhost')); $de = $CFG['email_remetente'] ?: 'nao-responda@' . preg_replace('/^www\./', '', $host);
    @mail($u['email'], '=?UTF-8?B?' . base64_encode('CoraçãoBR: pagamento confirmado, seus anúncios estão no ar') . '?=', "Olá, {$u['nome']}.\n\nRecebemos seu Pix de R$ " . number_format($pk['valor'], 2, ',', '.') . ".\nPlano: $desc, de " . date('d/m/Y', strtotime($pk['inicio'])) . ' a ' . date('d/m/Y', strtotime($pk['fim'])) . ".\n\nAcompanhe no painel: " . baseUrl() . "#anunciante" . sacAssinatura(), "From: CoraçãoBR <$de>\r\nReply-To: " . emailOficial() . "\r\nContent-Type: text/plain; charset=UTF-8\r\n");
  }
  return $pk;
}
/* programa de indicação: quando o indicado faz o 1º pagamento, quem indicou ganha 50% de desconto em 1 pacote */
function premiaIndicacao(string $uid): void {
  $pdo = banco(); $st = $pdo->prepare("SELECT data FROM docs WHERE col = 'indicacoes' AND id = ?"); $st->execute([$uid]); $ind = json_decode((string)$st->fetchColumn(), true);
  if (!is_array($ind) || !empty($ind['premiado']) || empty($ind['por'])) return;
  $pago = false; foreach (pacotesDe(pagamentoDe($uid)) as $x) if (in_array($x['tipo'] ?? 'pacote', ['pacote', 'promo'], true) && (float)($x['valor'] ?? 0) > 0) $pago = true;
  if (!$pago) return;
  $por = $ind['por']; $pg = pagamentoDe($por); $pg['creditosIndicacao'] = (int)($pg['creditosIndicacao'] ?? 0) + 1; $pg['atualizadoEm'] = gmdate('c');
  $pdo->prepare("INSERT INTO docs (col, id, data, em) VALUES ('pagamentos', ?, ?, ?) ON CONFLICT(col, id) DO UPDATE SET data = excluded.data, em = excluded.em")->execute([$por, json_encode($pg, JSON_UNESCAPED_UNICODE), agora()]);
  $ind['premiado'] = gmdate('c');
  $pdo->prepare("INSERT INTO docs (col, id, data, em) VALUES ('indicacoes', ?, ?, ?) ON CONFLICT(col, id) DO UPDATE SET data = excluded.data, em = excluded.em")->execute([$uid, json_encode($ind, JSON_UNESCAPED_UNICODE), agora()]);
  versao('pagamentos');
  $u = $pdo->prepare('SELECT email, nome FROM usuarios WHERE id = ?'); $u->execute([$por]); $u = $u->fetch();
  if ($u && filter_var($u['email'], FILTER_VALIDATE_EMAIL)) {
    global $CFG; $host = preg_replace('/[^a-z0-9.-]/i', '', (string)($_SERVER['HTTP_HOST'] ?? 'localhost')); $de = $CFG['email_remetente'] ?: 'nao-responda@' . preg_replace('/^www\./', '', $host);
    @mail($u['email'], '=?UTF-8?B?' . base64_encode('CoraçãoBR: você ganhou 50% de desconto') . '?=', "Olá, {$u['nome']}.\n\nUma empresa que você indicou acabou de anunciar no CoraçãoBR. Obrigado!\nVocê ganhou 50% de desconto em 1 pacote. Ele é aplicado sozinho na sua próxima compra:\n" . baseUrl() . "#pagar" . sacAssinatura(), "From: CoraçãoBR <$de>\r\nReply-To: " . emailOficial() . "\r\nContent-Type: text/plain; charset=UTF-8\r\n");
  }
}
/* consulta o pagamento no Mercado Pago e, se aprovado, libera o pacote (usado pelo aviso automático, pela tela do anunciante e pela rotina diária) */
function processaPagamento(string $pagId): array {
  $pdo = banco(); $st = $pdo->prepare("SELECT data FROM docs WHERE col = 'cobrancas' AND id = ?"); $st->execute([$pagId]); $c = json_decode((string)$st->fetchColumn(), true);
  if (!is_array($c)) return ['status' => 'desconhecido'];
  if (($c['status'] ?? '') === 'aprovado') return ['status' => 'aprovado', 'cobranca' => $c];
  $pg = mp('GET', '/v1/payments/' . rawurlencode($pagId));
  if (!is_array($pg) || empty($pg['id'])) return ['status' => $c['status'] ?? 'pendente'];
  $s = (string)($pg['status'] ?? '');
  if ($s === 'approved' && abs((float)($pg['transaction_amount'] ?? 0) - (float)$c['valor']) < 0.01) {
    $c['status'] = 'aprovado'; $c['aprovadoEm'] = gmdate('c');
    if (($c['plano'] ?? '') === 'caixinha') {
      $av = ['tipo' => 'caixinha', 'nome' => 'Apoio pela caixinha', 'valor' => (float)$c['valor'], 'moeda' => 'BRL', 'criadoEm' => gmdate('c'), 'lido' => false, 'pagamento' => 'mp:' . $pagId];
      $pdo->prepare("INSERT INTO docs (col, id, data, em) VALUES ('avisos', ?, ?, ?) ON CONFLICT(col, id) DO NOTHING")->execute(['cx-' . $pagId, json_encode($av, JSON_UNESCAPED_UNICODE), agora()]); versao('avisos');
      try { avisaEquipe('Apoio recebido pela caixinha · R$ ' . number_format((float)$c['valor'], 2, ',', '.'), "Pix da caixinha aprovado pelo Mercado Pago.\nValor: R$ " . number_format((float)$c['valor'], 2, ',', '.') . "\nPagamento: $pagId"); } catch (Throwable $e) { /* o aviso no painel já ficou registrado */ }
    } else $c['pacote'] = aplicaPacote($c['uid'], $c, $pagId);
  }
  elseif (in_array($s, ['cancelled', 'rejected', 'refunded', 'charged_back'], true)) $c['status'] = 'cancelado';
  elseif (!empty($c['expira']) && time() > strtotime($c['expira'])) $c['status'] = 'expirado';
  $pdo->prepare("INSERT INTO docs (col, id, data, em) VALUES ('cobrancas', ?, ?, ?) ON CONFLICT(col, id) DO UPDATE SET data = excluded.data, em = excluded.em")->execute([$pagId, json_encode($c, JSON_UNESCAPED_UNICODE), agora()]);
  return ['status' => $c['status'], 'cobranca' => $c];
}
function temMaster(): bool { return (bool)banco()->query("SELECT 1 FROM usuarios WHERE papel = 'master' LIMIT 1")->fetchColumn(); }
function baseUrl(): string {
  global $https, $caminho;
  return ($https ? 'https://' : 'http://') . ($_SERVER['HTTP_HOST'] ?? 'localhost') . $caminho;
}
function linkSenha(string $uid): string {
  $tok = bin2hex(random_bytes(32));
  banco()->prepare('UPDATE usuarios SET reset_hash = ?, reset_exp = ? WHERE id = ?')->execute([hash('sha256', $tok), time() + 3600 * 24, $uid]);
  return baseUrl() . '#redefinir-' . $tok;
}
function versao(string $col): void {
  $pdo = banco();
  $pdo->prepare('INSERT INTO versoes (col, v) VALUES (?, 1) ON CONFLICT(col) DO UPDATE SET v = v + 1')->execute([$col]);
}

try {
switch ($acao) {

/* ===== conta ===== */
case 'sessao': {
  $u = eu();
  if (!temMaster()) chaveInstalacao();
  sai(['ok' => true, 'csrf' => $_SESSION['csrf'], 'visitante' => $_SESSION['visitante'], 'conta' => $u ? publico($u) : null, 'precisaInstalar' => !temMaster(), 'pixAuto' => mpToken() !== '']);
}
case 'instalar': {
  if ($metodo !== 'POST') erro('Use POST.', 405);
  if (temMaster()) erro('A conta master já foi criada.', 409);
  if (!limite('inst-ip:' . ip(), 8, 3600)) erro('Muitas tentativas. Tente de novo em uma hora.', 429);
  $chave = chaveInstalacao();
  if ($chave === '' || !hash_equals($chave, strtoupper(campo('chave', 40)))) { marca('inst-ip:' . ip()); erro('Chave de instalação incorreta. Ela está no arquivo dados/CHAVE-INSTALACAO.txt da hospedagem.', 403); }
  $nome = campo('nome', 60); $email = mb_strtolower(campo('email', 160)); $senha = (string)($corpo['senha'] ?? '');
  if ($nome === '' || !filter_var($email, FILTER_VALIDATE_EMAIL)) erro('Informe nome e um e-mail válido.');
  if ($m = senhaOk($senha)) erro($m);
  $pdo = banco();
  $st = $pdo->prepare('SELECT id FROM usuarios WHERE email = ?'); $st->execute([$email]);
  if ($id = $st->fetchColumn()) {
    $pdo->prepare("UPDATE usuarios SET papel = 'master', hash = ?, nome = ? WHERE id = ?")->execute([password_hash($senha, PASSWORD_DEFAULT), $nome, $id]);
  } else {
    $id = novoUid();
    $pdo->prepare('INSERT INTO usuarios (id, email, nome, hash, papel, criado) VALUES (?, ?, ?, ?, ?, ?)')->execute([$id, $email, $nome, password_hash($senha, PASSWORD_DEFAULT), 'master', agora()]);
  }
  $u = ['id' => $id, 'email' => $email, 'nome' => $nome, 'papel' => 'master'];
  @unlink(dirname($CFG['db']) . '/CHAVE-INSTALACAO.txt');
  entra($u);
  sai(['ok' => true, 'conta' => publico($u), 'csrf' => $_SESSION['csrf']]);
}
case 'cadastrar': {
  if ($metodo !== 'POST') erro('Use POST.', 405);
  if (!limite('cad:' . ip(), 6, 3600)) erro('Muitos cadastros deste endereço. Tente de novo em uma hora.', 429);
  $nome = campo('nome', 60); $email = mb_strtolower(campo('email', 160)); $senha = (string)($corpo['senha'] ?? '');
  $papel = 'usuario';   // conta única: as ferramentas de anúncio são liberadas pelo pagamento
  $zip = zipLimpo(campo('zip', 12));
  if ($nome === '') erro('Informe seu nome.');
  if ($zip === '') erro('Informe o seu CEP americano (ZIP code, 5 números).');
  if (!filter_var($email, FILTER_VALIDATE_EMAIL)) erro('Informe um e-mail válido.');
  if ($m = senhaOk($senha)) erro($m);
  if (empty($corpo['aceite'])) erro('Para criar a conta, aceite os termos de uso e a política de privacidade.');
  marca('cad:' . ip());
  $pdo = banco();
  $st = $pdo->prepare('SELECT 1 FROM usuarios WHERE email = ?'); $st->execute([$email]);
  if ($st->fetchColumn()) erro('Já existe uma conta com este e-mail. Entre ou use "Esqueci minha senha".', 409);
  $id = novoUid();
  $pdo->prepare('INSERT INTO usuarios (id, email, nome, hash, papel, criado) VALUES (?, ?, ?, ?, ?, ?)')->execute([$id, $email, $nome, password_hash($senha, PASSWORD_DEFAULT), $papel, agora()]);
  gravaZip($id, $zip);
  $u = ['id' => $id, 'email' => $email, 'nome' => $nome, 'papel' => $papel];
  entra($u);
  $ref = preg_replace('/[^A-Za-z0-9]/', '', (string)($corpo['ref'] ?? ''));
  if ($ref !== '' && $ref !== $id) { $q = $pdo->prepare('SELECT 1 FROM usuarios WHERE id = ?'); $q->execute([$ref]); if ($q->fetchColumn()) $pdo->prepare("INSERT OR IGNORE INTO docs (col, id, data, em) VALUES ('indicacoes', ?, ?, ?)")->execute([$id, json_encode(['por' => $ref, 'em' => gmdate('c'), 'nome' => $nome]), agora()]); }
  sai(['ok' => true, 'conta' => publico($u), 'csrf' => $_SESSION['csrf']]);
}
case 'entrar': {
  if ($metodo !== 'POST') erro('Use POST.', 405);
  $email = mb_strtolower(campo('email', 160)); $senha = (string)($corpo['senha'] ?? '');
  if (!limite('login-ip:' . ip(), 10, 900) || !limite('login:' . $email, 6, 900)) erro('Muitas tentativas. Aguarde 15 minutos e tente de novo.', 429);
  $st = banco()->prepare('SELECT id, email, nome, papel, hash, bloqueado FROM usuarios WHERE email = ?'); $st->execute([$email]);
  $u = $st->fetch();
  $ok = $u && password_verify($senha, $u['hash']);
  if (!$ok) { if (!$u) password_verify($senha, '$2y$10$usesomesillystringforsaltdefinitelynotreal.......'); marca('login-ip:' . ip()); marca('login:' . $email); erro('E-mail ou senha incorretos.', 401); }
  if ((int)$u['bloqueado']) erro('Esta conta está suspensa. Fale com a equipe CoraçãoBR.', 403);
  if (password_needs_rehash($u['hash'], PASSWORD_DEFAULT)) banco()->prepare('UPDATE usuarios SET hash = ? WHERE id = ?')->execute([password_hash($senha, PASSWORD_DEFAULT), $u['id']]);
  entra($u);
  sai(['ok' => true, 'conta' => publico($u), 'csrf' => $_SESSION['csrf']]);
}
case 'sair': {
  if ($metodo !== 'POST') erro('Use POST.', 405);
  $_SESSION = [];
  session_regenerate_id(true);
  sai(['ok' => true]);
}
case 'esqueci': {
  if ($metodo !== 'POST') erro('Use POST.', 405);
  $email = mb_strtolower(campo('email', 160));
  $msg = 'Se este e-mail tiver conta, enviamos um link para criar uma nova senha. Ele vale por 24 horas. Confira também a caixa de spam.';
  if (!limite('esq-ip:' . ip(), 5, 3600) || !limite('esq:' . $email, 3, 3600)) sai(['ok' => true, 'msg' => $msg]);
  marca('esq-ip:' . ip()); marca('esq:' . $email);
  $st = banco()->prepare('SELECT id, nome FROM usuarios WHERE email = ? AND bloqueado = 0'); $st->execute([$email]);
  if ($u = $st->fetch()) {
    $link = linkSenha($u['id']);
    $host = preg_replace('/[^a-z0-9.-]/i', '', (string)($_SERVER['HTTP_HOST'] ?? 'localhost'));
    $de = $CFG['email_remetente'] ?: 'nao-responda@' . preg_replace('/^www\./', '', $host);
    $txt = "Olá, {$u['nome']}.\n\nRecebemos um pedido para criar uma nova senha na CoraçãoBR.\nAbra o link abaixo em até 24 horas:\n\n$link\n\nSe não foi você, ignore este e-mail; sua senha atual continua valendo.";
    @mail($email, '=?UTF-8?B?' . base64_encode('CoraçãoBR: crie uma nova senha') . '?=', $txt . sacAssinatura(), "From: CoraçãoBR <$de>\r\nReply-To: " . emailOficial() . "\r\nContent-Type: text/plain; charset=UTF-8\r\n");
  }
  sai(['ok' => true, 'msg' => $msg]);
}
case 'redefinir': {
  if ($metodo !== 'POST') erro('Use POST.', 405);
  $tok = campo('token', 80); $senha = (string)($corpo['senha'] ?? '');
  if (!preg_match('/^[a-f0-9]{64}$/', $tok)) erro('Link inválido. Peça um novo em "Esqueci minha senha".');
  if (!limite('red-ip:' . ip(), 10, 3600)) erro('Muitas tentativas. Tente mais tarde.', 429);
  marca('red-ip:' . ip());
  if ($m = senhaOk($senha)) erro($m);
  $st = banco()->prepare('SELECT id, email, nome, papel, reset_exp FROM usuarios WHERE reset_hash = ? AND bloqueado = 0'); $st->execute([hash('sha256', $tok)]);
  $u = $st->fetch();
  if (!$u || (int)$u['reset_exp'] < time()) erro('Este link expirou ou já foi usado. Peça um novo em "Esqueci minha senha".');
  banco()->prepare('UPDATE usuarios SET hash = ?, reset_hash = NULL, reset_exp = NULL WHERE id = ?')->execute([password_hash($senha, PASSWORD_DEFAULT), $u['id']]);
  entra($u);
  sai(['ok' => true, 'conta' => publico($u), 'csrf' => $_SESSION['csrf']]);
}
case 'perfil': {
  if ($metodo !== 'POST') erro('Use POST.', 405);
  $u = exigeLogin();
  $nome = campo('nome', 60); $email = mb_strtolower(campo('email', 160)); $atual = (string)($corpo['senhaAtual'] ?? ''); $nova = (string)($corpo['senhaNova'] ?? '');
  if ($nome === '') erro('Informe seu nome.');
  $pdo = banco();
  $mudaEmail = $email !== '' && $email !== mb_strtolower($u['email']);
  if ($mudaEmail || $nova !== '') {
    if (!limite('perfil:' . $u['id'], 8, 900)) erro('Muitas tentativas. Aguarde 15 minutos.', 429);
    $st = $pdo->prepare('SELECT hash FROM usuarios WHERE id = ?'); $st->execute([$u['id']]);
    if (!password_verify($atual, (string)$st->fetchColumn())) { marca('perfil:' . $u['id']); erro('Senha atual incorreta.', 401); }
  }
  if ($mudaEmail) {
    if (!filter_var($email, FILTER_VALIDATE_EMAIL)) erro('Informe um e-mail válido.');
    $st = $pdo->prepare('SELECT 1 FROM usuarios WHERE email = ? AND id <> ?'); $st->execute([$email, $u['id']]);
    if ($st->fetchColumn()) erro('Este e-mail já está em uso.', 409);
    $pdo->prepare('UPDATE usuarios SET email = ? WHERE id = ?')->execute([$email, $u['id']]);
  }
  if ($nova !== '') { if ($m = senhaOk($nova)) erro($m); $pdo->prepare('UPDATE usuarios SET hash = ? WHERE id = ?')->execute([password_hash($nova, PASSWORD_DEFAULT), $u['id']]); }
  $pdo->prepare('UPDATE usuarios SET nome = ? WHERE id = ?')->execute([$nome, $u['id']]);
  if (isset($corpo['zip'])) { $zip = zipLimpo((string)$corpo['zip']); if ($zip === '') erro('Informe o seu CEP americano (ZIP code, 5 números).'); gravaZip($u['id'], $zip); }
  $st = $pdo->prepare('SELECT id, email, nome, papel, zip, zip_lat, zip_lng, zip_cidade FROM usuarios WHERE id = ?'); $st->execute([$u['id']]);
  sai(['ok' => true, 'conta' => publico($st->fetch())]);
}
case 'virar_anunciante': {
  if ($metodo !== 'POST') erro('Use POST.', 405);
  $u = exigeLogin();
  if ($u['papel'] === 'usuario') banco()->prepare("UPDATE usuarios SET papel = 'anunciante' WHERE id = ?")->execute([$u['id']]);
  sai(['ok' => true, 'conta' => publico(array_merge($u, ['papel' => $u['papel'] === 'usuario' ? 'anunciante' : $u['papel']]))]);
}
case 'excluir_conta': {
  if ($metodo !== 'POST') erro('Use POST.', 405);
  $u = exigeLogin();
  if ($u['papel'] === 'master') erro('A conta master não pode ser excluída por aqui.', 403);
  $st = banco()->prepare('SELECT hash FROM usuarios WHERE id = ?'); $st->execute([$u['id']]);
  if (!password_verify((string)($corpo['senha'] ?? ''), (string)$st->fetchColumn())) erro('Senha incorreta.', 401);
  apagaUsuario($u['id']);
  $_SESSION = []; session_regenerate_id(true);
  sai(['ok' => true]);
}

/* ===== master: usuários ===== */
case 'usuarios': {
  exigeMaster();
  $rows = banco()->query('SELECT id, email, nome, papel, bloqueado, criado, ultimo, zip, zip_cidade FROM usuarios ORDER BY criado DESC LIMIT 2000')->fetchAll();
  foreach ($rows as &$r) { $r['plano'] = vagasDe(pagamentoDe($r['id'])); } unset($r);
  sai(['ok' => true, 'usuarios' => $rows]);
}
case 'usuario': {
  if ($metodo !== 'POST') erro('Use POST.', 405);
  exigeMaster();
  $id = campo('id', 40); $op = campo('op', 20);
  if (!preg_match(ID_RE, $id)) erro('Conta inválida.');
  $pdo = banco();
  $st = $pdo->prepare('SELECT id, papel FROM usuarios WHERE id = ?'); $st->execute([$id]);
  $alvo = $st->fetch(); if (!$alvo) erro('Conta não encontrada.', 404);
  if ($id === eu()['id'] && $op !== 'link') erro('Para mudar a sua própria conta, use Minha conta.');
  if ($op === 'papel') { $p = campo('papel', 20); if (!in_array($p, PAPEIS, true)) erro('Papel inválido.'); $pdo->prepare('UPDATE usuarios SET papel = ? WHERE id = ?')->execute([$p, $id]); sai(['ok' => true]); }
  if ($op === 'bloquear' || $op === 'liberar') { $pdo->prepare('UPDATE usuarios SET bloqueado = ? WHERE id = ?')->execute([$op === 'bloquear' ? 1 : 0, $id]); sai(['ok' => true]); }
  if ($op === 'link') sai(['ok' => true, 'link' => linkSenha($id)]);
  if ($op === 'excluir') { if ($alvo['papel'] === 'master') erro('Rebaixe a conta antes de excluir uma conta master.'); apagaUsuario($id); sai(['ok' => true]); }
  erro('Operação desconhecida.');
}

/* ===== dados do guia ===== */
case 'sync': {
  $pedidas = json_decode((string)($_GET['v'] ?? '{}'), true);
  if (!is_array($pedidas)) $pedidas = [];
  $pdo = banco(); $u = eu(); $out = [];
  $vers = []; foreach ($pdo->query('SELECT col, v FROM versoes') as $r) $vers[$r['col']] = (int)$r['v'];
  foreach ($pedidas as $col => $v) {
    if (!in_array($col, COLS, true)) continue;
    $atual = $vers[$col] ?? 0;
    if ((int)$v === $atual && $v !== null && (int)$v !== -1) continue;
    $out[$col] = ['v' => $atual, 'docs' => listaDocs($col, $u)];
  }
  sai(['ok' => true, 'cols' => $out]);
}
case 'lista': {
  $col = (string)($_GET['col'] ?? '');
  if (!in_array($col, COLS, true)) erro('Coleção desconhecida.');
  sai(['ok' => true, 'docs' => listaDocs($col, eu())]);
}
case 'doc': {
  $col = (string)($_GET['col'] ?? ''); $id = (string)($_GET['id'] ?? '');
  if (!in_array($col, COLS, true) || !preg_match(ID_RE, $id)) erro('Pedido inválido.');
  if (!podeLer($col, $id)) erro('Sem permissão.', 403);
  $st = banco()->prepare('SELECT data FROM docs WHERE col = ? AND id = ?'); $st->execute([$col, $id]);
  $d = $st->fetchColumn();
  sai(['ok' => true, 'existe' => $d !== false, 'data' => $d !== false ? json_decode($d, true) : null]);
}
case 'gravar':
case 'apagar': {
  if ($metodo !== 'POST') erro('Use POST.', 405);
  $col = campo('col', 30); $id = campo('id', 130);
  if (!in_array($col, COLS, true) || !preg_match(ID_RE, $id)) erro('Pedido inválido.');
  if (!podeGravar($col, $id)) erro(eu() ? 'Sua conta não tem permissão para isso.' : 'Entre na sua conta para continuar.', eu() ? 403 : 401);
  $quem = eu() ? eu()['id'] : $_SESSION['visitante'];
  if (!master() && !limite('w:' . $quem, 400, 600)) erro('Muitas alterações seguidas. Aguarde alguns minutos.', 429);
  if (!master()) marca('w:' . $quem);
  $pdo = banco();
  if ($acao === 'apagar') {
    $pdo->prepare('DELETE FROM docs WHERE col = ? AND id = ?')->execute([$col, $id]);
  } else {
    $data = $corpo['data'] ?? null;
    if (!is_array($data)) erro('Conteúdo inválido.');
    $json = json_encode($data, JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES);
    if (strlen($json) > (master() ? 1_000_000 : 300_000)) erro('Conteúdo grande demais.');
    if (!master() && $col === 'anunciantes') {   // plano normal: até 3 anúncios; promoção: 1 por crédito ativo
      $n = 0; foreach ((array)($data['itens'] ?? []) as $it) if (is_array($it) && !empty($it['nome'])) $n++;
      $lim = max(3, vagasDe(pagamentoDe($id)));   // até 3 em prévia sem pagar; acima disso, conforme os pacotes contratados
      if ($n > $lim) erro('Seu plano libera ' . $lim . ' anúncios. Contrate mais um pacote (3 anúncios) para cadastrar outro.');
    }
    if (!master() && $col === 'avaliacoes') {   // curadorias de parceiro: limitadas às compradas
      $n = 0; foreach ((array)($data['itens'] ?? []) as $it) if (is_array($it) && ($it['tipo'] ?? '') === 'parceiro') $n++;
      if ($n > 0 && $n > (int)(pagamentoDe($id)['curadorias'] ?? 0)) erro('Você não tem curadorias disponíveis. Compre um crédito na promoção.');
    }
    if (!master() && $col === 'posts' && count((array)($data['itens'] ?? [])) > 60) erro('Limite de 60 publicações por conta. Apague as mais antigas.');
    $antes = null;
    if (!master() && $col === 'avisos') { $st = $pdo->prepare('SELECT data FROM docs WHERE col = ? AND id = ?'); $st->execute([$col, $id]); $antes = json_decode((string)$st->fetchColumn(), true) ?: []; }
    $pdo->prepare('INSERT INTO docs (col, id, data, em) VALUES (?, ?, ?, ?) ON CONFLICT(col, id) DO UPDATE SET data = excluded.data, em = excluded.em')->execute([$col, $id, $json, agora()]);
    if (master() && $col === 'pagamentos') premiaIndicacao($id);
    if ($antes !== null) {   // aviso novo de visitante/anunciante: manda para o e-mail oficial
      $novos = isset($data['itens']) && is_array($data['itens']) ? array_diff_key($data['itens'], (array)($antes['itens'] ?? [])) : (empty($antes) ? [$data] : []);
      $NOMES = ['pagamento-informado' => 'pagamento informado', 'denuncia' => 'denúncia', 'classificado' => 'novo classificado no mural', 'novo-anuncio' => 'novo anúncio', 'anuncio' => 'anúncio', 'contato' => 'mensagem de contato'];
      foreach (array_slice($novos, 0, 5) as $a) {
        if (!is_array($a)) continue;
        $t = (string)($a['tipo'] ?? 'aviso'); $nm = $NOMES[$t] ?? $t;
        $linhas = ["Tipo: $nm"]; foreach (['nome' => 'Nome', 'metodo' => 'Forma', 'valor' => 'Valor (US$)', 'ref' => 'Referência', 'plano' => 'Plano', 'lugarId' => 'Lugar', 'texto' => 'Mensagem'] as $k => $r) if (isset($a[$k]) && $a[$k] !== '' && !is_array($a[$k])) $linhas[] = "$r: " . mb_substr((string)$a[$k], 0, 500);
        if (eu()) $linhas[] = 'Conta: ' . eu()['nome'] . ' <' . eu()['email'] . '>';
        avisaEquipe($nm, implode("\n", $linhas));
      }
    }
  }
  versao($col);
  sai(['ok' => true]);
}
case 'foto': {
  if ($metodo !== 'POST') erro('Use POST.', 405);
  $u = exigeLogin();
  $maxH = in_array($u['papel'], ['anunciante', 'master'], true) ? 60 : 12;   // usuários: fotos das avaliações
  if (!master() && !limite('foto:' . $u['id'], $maxH, 3600)) erro('Limite de fotos por hora atingido. Tente de novo mais tarde.', 429);
  $f = $_FILES['foto'] ?? null;
  if (!$f || $f['error'] !== UPLOAD_ERR_OK || $f['size'] > 6_000_000) erro('Foto inválida ou maior que 6 MB.');
  $info = @getimagesize($f['tmp_name']);
  if (!$info || !in_array($info[2], [IMAGETYPE_JPEG, IMAGETYPE_PNG, IMAGETYPE_WEBP], true)) erro('Envie uma foto JPG, PNG ou WebP.');
  if (!function_exists('imagecreatefromstring')) erro('O servidor não tem a extensão de imagens (GD).', 500);
  $img = @imagecreatefromstring((string)file_get_contents($f['tmp_name']));
  if (!$img) erro('Não foi possível ler a foto.');
  $w = imagesx($img); $h = imagesy($img); $k = min(1, 1600 / max($w, $h));
  $nw = max(1, (int)round($w * $k)); $nh = max(1, (int)round($h * $k));
  $dst = imagecreatetruecolor($nw, $nh);
  imagefill($dst, 0, 0, imagecolorallocate($dst, 255, 255, 255));
  imagecopyresampled($dst, $img, 0, 0, 0, 0, $nw, $nh, $w, $h);
  $dir = $CFG['uploads'];
  if (!is_dir($dir)) @mkdir($dir, 0755, true);
  if (!is_file($dir . '/.htaccess')) @file_put_contents($dir . '/.htaccess', "Options -Indexes\nRemoveHandler .php .phtml .phar\nRemoveType .php .phtml .phar\n<FilesMatch \"\\.(php|phtml|phar|pl|py|cgi|sh)$\">\nRequire all denied\n</FilesMatch>\n");
  $id = bin2hex(random_bytes(16));
  if (!imagejpeg($dst, $dir . '/' . $id . '.jpg', 84)) erro('Não foi possível salvar a foto.', 500);
  banco()->prepare('INSERT INTO fotos (id, dono, em) VALUES (?, ?, ?)')->execute([$id, $u['id'], agora()]);
  if (!master()) marca('foto:' . $u['id']);
  sai(['ok' => true, 'id' => $id]);
}
case 'apagar_foto': {
  if ($metodo !== 'POST') erro('Use POST.', 405);
  $u = exigeLogin();
  $id = campo('id', 40);
  if (!preg_match('/^[a-f0-9]{32}$/', $id)) erro('Foto inválida.');
  $st = banco()->prepare('SELECT dono FROM fotos WHERE id = ?'); $st->execute([$id]);
  $dono = $st->fetchColumn();
  if ($dono === false) sai(['ok' => true]);
  if ($dono !== $u['id'] && !master()) erro('Sem permissão.', 403);
  @unlink($CFG['uploads'] . '/' . $id . '.jpg');
  banco()->prepare('DELETE FROM fotos WHERE id = ?')->execute([$id]);
  sai(['ok' => true]);
}

/* ===== newsletter por e-mail ===== */
case 'newsletter_inscrever': {
  if ($metodo !== 'POST') erro('Use POST.', 405);
  if (campo('site', 80) !== '') sai(['ok' => true, 'msg' => 'Inscrição feita.']);   // campo isca contra robôs
  if (!limite('news-ip:' . ip(), 8, 3600)) erro('Muitas inscrições deste endereço. Tente mais tarde.', 429);
  $email = mb_strtolower(campo('email', 160)); $nome = campo('nome', 60);
  if (!filter_var($email, FILTER_VALIDATE_EMAIL)) erro('Informe um e-mail válido.');
  marca('news-ip:' . ip());
  $pdo = banco(); $u = eu();
  $st = $pdo->prepare('SELECT token, ativo FROM assinantes WHERE email = ?'); $st->execute([$email]); $r = $st->fetch();
  if ($r) { $pdo->prepare('UPDATE assinantes SET ativo = 1, saiu = NULL, nome = COALESCE(NULLIF(?, ""), nome) WHERE email = ?')->execute([$nome, $email]); $tok = $r['token']; $novo = !(int)$r['ativo']; }
  else { $tok = bin2hex(random_bytes(16)); $pdo->prepare('INSERT INTO assinantes (email, nome, token, origem, uid, criado) VALUES (?, ?, ?, ?, ?, ?)')->execute([$email, $nome, $tok, campo('origem', 30), $u ? $u['id'] : null, agora()]); $novo = true; }
  if ($novo) { $cfg = configDoc('newsletter'); envia($email, 'Inscrição confirmada na CoraçãoBR', '<p>Olá' . ($nome ? ', ' . htmlspecialchars($nome) : '') . '.</p><p>Você vai receber a seleção da CoraçãoBR por e-mail: eventos da semana e lugares que valem a visita.</p>' . (($cfg['boasVindas'] ?? '') ? '<p>' . nl2br(htmlspecialchars($cfg['boasVindas'])) . '</p>' : ''), $tok); }
  sai(['ok' => true, 'msg' => 'Pronto! Você vai receber a seleção da semana no seu e-mail.']);
}
case 'newsletter_sair': {
  $tok = (string)($_GET['t'] ?? '');
  header('Content-Type: text/html; charset=utf-8');
  $ok = false;
  if (preg_match('/^[a-f0-9]{32}$/', $tok)) { $st = banco()->prepare('UPDATE assinantes SET ativo = 0, saiu = ? WHERE token = ?'); $st->execute([agora(), $tok]); $ok = $st->rowCount() > 0; }
  echo '<!doctype html><html lang="pt-BR"><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>CoraçãoBR</title><body style="font:16px/1.5 system-ui;max-width:520px;margin:60px auto;padding:0 20px;color:#142019"><h1 style="color:#024E25">CoraçãoBR</h1><p>' . ($ok ? 'Pronto. Você não vai mais receber a newsletter.' : 'Este link não é válido ou você já tinha saído da lista.') . '</p><p><a href="' . htmlspecialchars(baseUrl()) . '" style="color:#024E25">Voltar ao guia</a></p></body></html>';
  exit;
}
case 'newsletter_status': {
  $u = exigeLogin();
  $st = banco()->prepare('SELECT ativo FROM assinantes WHERE email = ?'); $st->execute([$u['email']]);
  sai(['ok' => true, 'inscrito' => (bool)$st->fetchColumn()]);
}
case 'newsletter_alterar': {
  if ($metodo !== 'POST') erro('Use POST.', 405);
  $u = exigeLogin(); $pdo = banco();
  if (!empty($corpo['inscrito'])) {
    $st = $pdo->prepare('SELECT 1 FROM assinantes WHERE email = ?'); $st->execute([$u['email']]);
    if ($st->fetchColumn()) $pdo->prepare('UPDATE assinantes SET ativo = 1, saiu = NULL WHERE email = ?')->execute([$u['email']]);
    else $pdo->prepare('INSERT INTO assinantes (email, nome, token, origem, uid, criado) VALUES (?, ?, ?, ?, ?, ?)')->execute([$u['email'], $u['nome'], bin2hex(random_bytes(16)), 'conta', $u['id'], agora()]);
  } else $pdo->prepare('UPDATE assinantes SET ativo = 0, saiu = ? WHERE email = ?')->execute([agora(), $u['email']]);
  sai(['ok' => true]);
}
case 'newsletter_lista': {
  exigeMaster();
  $rows = banco()->query('SELECT email, nome, ativo, origem, criado, saiu FROM assinantes ORDER BY criado DESC LIMIT 20000')->fetchAll();
  $env = banco()->query('SELECT assunto, modo, enviados, falhas, em FROM envios ORDER BY id DESC LIMIT 30')->fetchAll();
  sai(['ok' => true, 'assinantes' => $rows, 'envios' => $env]);
}
case 'newsletter_remover': {
  if ($metodo !== 'POST') erro('Use POST.', 405);
  exigeMaster();
  banco()->prepare('DELETE FROM assinantes WHERE email = ?')->execute([mb_strtolower(campo('email', 160))]);
  sai(['ok' => true]);
}
case 'newsletter_previa': {
  exigeMaster();
  $d = montaNewsletter();
  sai(['ok' => true, 'assunto' => $d['assunto'], 'html' => moldura($d['html'], 'TOKEN-DE-EXEMPLO'), 'itens' => $d['itens']]);
}
case 'newsletter_enviar': {
  if ($metodo !== 'POST') erro('Use POST.', 405);
  exigeMaster();
  @set_time_limit(120);
  $d = montaNewsletter();
  if (!$d['itens']) erro('Não há eventos nem destaques para enviar. Ajuste os dias ou escolha destaques.');
  if (($corpo['modo'] ?? '') === 'teste') {
    $ok = envia(eu()['email'], '[Teste] ' . $d['assunto'], $d['html'], 'TOKEN-DE-TESTE');
    sai(['ok' => true, 'enviados' => $ok ? 1 : 0, 'para' => eu()['email']]);
  }
  $de = max(0, (int)($corpo['de'] ?? 0)); $lote = 40;
  $st = banco()->prepare('SELECT email, token FROM assinantes WHERE ativo = 1 ORDER BY email LIMIT ? OFFSET ?'); $st->execute([$lote, $de]);
  $lista = $st->fetchAll(); $env = 0; $fal = 0;
  foreach ($lista as $a) { if (envia($a['email'], $d['assunto'], $d['html'], $a['token'])) $env++; else $fal++; }
  $total = (int)banco()->query('SELECT COUNT(*) FROM assinantes WHERE ativo = 1')->fetchColumn();
  $fim = $de + count($lista) >= $total;
  if ($de === 0 || $fim) { /* registra um envio por campanha, atualizando o total no último lote */ }
  banco()->prepare('INSERT INTO envios (assunto, modo, enviados, falhas, em) VALUES (?, ?, ?, ?, ?)')->execute([$d['assunto'], 'lote ' . ($de / $lote + 1), $env, $fal, agora()]);
  sai(['ok' => true, 'enviados' => $env, 'falhas' => $fal, 'proximo' => $fim ? null : $de + $lote, 'total' => $total]);
}
case 'newsletter_cron': {
  /* Envio automático semanal: a Hostinger chama este endereço pelo agendador (Cron Jobs). */
  $chave = trim((string)@file_get_contents(dirname($CFG['db']) . '/CHAVE-CRON.txt'));
  if ($chave === '' || !hash_equals($chave, (string)($_GET['chave'] ?? ''))) erro('Chave inválida.', 403);
  sai(['ok' => true] + newsletterAuto());
}
case 'metro': {
  $f = __DIR__ . '/../dados/metro.json'; $g = __DIR__ . '/../data/metro.json';
  $arq = is_file($f) && (!is_file($g) || filemtime($f) >= filemtime($g)) ? $f : $g;
  header('Cache-Control: public, max-age=3600'); readfile($arq); exit;
}
case 'atualizar_diario': {
  /* Atualização diária automática. A Hostinger chama este endereço de hora em hora (Cron Jobs); ele só trabalha às 5h de Dallas, uma vez por dia
     (ou na hora, com &forcar=1 pela equipe). Atualiza: cotação do dólar (PTAX do Banco Central), metrô (GTFS oficial, toda semana),
     eventos vencidos e, com a chave da Google Places API, nota, avaliações, horário, telefone e site dos lugares. */
  $chave = trim((string)@file_get_contents(dirname($CFG['db']) . '/CHAVE-CRON.txt'));
  $porChave = $chave !== '' && hash_equals($chave, (string)($_GET['chave'] ?? ''));
  if (!$porChave && !master()) erro('Chave inválida.', 403);
  $tz = new DateTimeZone('America/Chicago'); $agoraD = new DateTime('now', $tz); $hoje = $agoraD->format('Y-m-d');
  $forcar = !empty($_GET['forcar']);
  $ult = (string)banco()->query("SELECT v FROM meta WHERE k = 'diario'")->fetchColumn();
  if (!$forcar && ((int)$agoraD->format('G') !== 5 || $ult === $hoje)) sai(['ok' => true, 'msg' => 'Fora do horário (roda às 5h de Dallas) ou já rodou hoje.', 'ultima' => $ult]);
  @set_time_limit(900); @ini_set('memory_limit', '1024M');
  $rel = ['data' => $agoraD->format('c'), 'feito' => [], 'erros' => []];
  $pdo = banco();
  $salva = function (string $col, string $id, array $d) use ($pdo) { $pdo->prepare('INSERT INTO docs (col, id, data, em) VALUES (?, ?, ?, ?) ON CONFLICT(col, id) DO UPDATE SET data = excluded.data, em = excluded.em')->execute([$col, $id, json_encode($d, JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES), agora()]); };
  $http = function (string $url, ?array $corpo = null, array $cab = []) {
    $h = array_merge(['User-Agent: CoracaoBR/1.0'], $cab); if ($corpo !== null) $h[] = 'Content-Type: application/json';
    $ctx = stream_context_create(['http' => ['method' => $corpo === null ? 'GET' : 'POST', 'header' => implode("\r\n", $h), 'content' => $corpo === null ? '' : json_encode($corpo), 'timeout' => 30, 'ignore_errors' => true]]);
    $r = @file_get_contents($url, false, $ctx); return $r === false ? null : json_decode($r, true);
  };
  // 1) dólar (PTAX venda do Banco Central do Brasil)
  $geral = configDoc('geral');
  if (($geral['cotacaoAuto'] ?? true) !== false) {
    for ($i = 0; $i < 6; $i++) {
      $d = (new DateTime("-$i day", $tz))->format('m-d-Y');
      $j = $http("https://olinda.bcb.gov.br/olinda/servico/PTAX/versao/v1/odata/CotacaoDolarDia(dataCotacao=@d)?@d='" . $d . "'&\$format=json");
      $v = $j['value'][0]['cotacaoVenda'] ?? null;
      if ($v) { $geral['cotacao'] = round((float)$v, 2); $geral['cotacaoEm'] = (new DateTime("-$i day", $tz))->format('Y-m-d'); $salva('config', 'geral', $geral); $rel['feito'][] = 'Dólar: R$ ' . number_format($geral['cotacao'], 2, ',', '.') . ' (PTAX ' . $geral['cotacaoEm'] . ')'; break; }
    }
    if (empty($geral['cotacaoEm']) || $geral['cotacaoEm'] < (new DateTime('-7 day', $tz))->format('Y-m-d')) $rel['erros'][] = 'Cotação do dólar não atualizada.';
  }
  // 2) metrô (uma vez por semana)
  $mj = dirname($CFG['db']) . '/metro.json';
  if (!is_file($mj) || filemtime($mj) < time() - 6 * 86400 || $forcar && !empty($_GET['metro'])) {
    try { require_once __DIR__ . '/metro_gtfs.php'; $r = atualizarMetro(dirname($CFG['db']), $mj); $rel['feito'][] = 'Metrô: ' . $r['linhas'] . ' linhas, ' . $r['estacoes'] . ' estações (GTFS oficial)'; }
    catch (Throwable $e) { $rel['erros'][] = 'Metrô: ' . $e->getMessage(); }
  }
  // 3) eventos que já terminaram saem do ar
  $n = 0;
  foreach ($pdo->query("SELECT id, data FROM docs WHERE col = 'lugares'")->fetchAll() as $row) {
    $l = json_decode($row['data'], true); if (!is_array($l)) continue;
    if (in_array($l['categoria'] ?? '', ['evento', 'show'], true) && !empty($l['dataFim']) && $l['dataFim'] < $hoje && ($l['publicado'] ?? true) !== false) { $l['publicado'] = false; $l['encerradoEm'] = $hoje; $salva('lugares', $row['id'], $l); $n++; }
  }
  if ($n) $rel['feito'][] = "$n eventos encerrados saíram do ar";
  // 4) Google Places: nota, avaliações reais, horário, telefone e site
  $gk = trim((string)($CFG['google_places_key'] ?? '')) ?: trim((string)@file_get_contents(dirname($CFG['db']) . '/GOOGLE-PLACES.key'));
  if ($gk !== '') {
    $mask = 'id,rating,userRatingCount,reviews,photos,googleMapsUri,regularOpeningHours,nationalPhoneNumber,websiteUri,businessStatus';
    $fila = [];
    foreach ($pdo->query("SELECT id, data FROM docs WHERE col = 'lugares'")->fetchAll() as $row) { $l = json_decode($row['data'], true); if (!is_array($l) || ($l['publicado'] ?? true) === false || !empty($l['demo'])) continue; $fila[] = [$row['id'], $l, (string)($l['notaExterna']['em'] ?? '')]; }
    usort($fila, fn($a, $b) => strcmp($a[2], $b[2]));
    $ok = 0; $lim = !empty($_GET['todos']) && master() ? 600 : (int)($CFG['google_por_dia'] ?? 60);   // &todos=1: a equipe atualiza o guia inteiro de uma vez
    foreach (array_slice($fila, 0, $lim) as [$id, $l]) {
      if (!empty($l['googlePlaceId'])) $p = $http('https://places.googleapis.com/v1/places/' . rawurlencode($l['googlePlaceId']) . '?languageCode=pt-BR', null, ['X-Goog-Api-Key: ' . $gk, 'X-Goog-FieldMask: ' . $mask]);
      else {
        $q = ['textQuery' => trim(($l['nome'] ?? '') . ' ' . ($l['endereco'] ?? ($l['cidade'] ?? 'Dallas') . ' TX')), 'languageCode' => 'pt-BR', 'maxResultCount' => 1];
        if (isset($l['lat'], $l['lng']) && $l['lat']) $q['locationBias'] = ['circle' => ['center' => ['latitude' => (float)$l['lat'], 'longitude' => (float)$l['lng']], 'radius' => 3000.0]];
        $r = $http('https://places.googleapis.com/v1/places:searchText', $q, ['X-Goog-Api-Key: ' . $gk, 'X-Goog-FieldMask: ' . implode(',', array_map(fn($x) => 'places.' . $x, explode(',', $mask)))]);
        if (isset($r['error'])) { $rel['erros'][] = 'Google: ' . ($r['error']['message'] ?? 'erro'); break; }
        $p = $r['places'][0] ?? null;
      }
      if (!is_array($p) || isset($p['error']) || empty($p['id'])) continue;
      $l['googlePlaceId'] = $p['id'];
      if (!empty($p['rating'])) $l['notaExterna'] = ['fonte' => 'Google', 'media' => (float)$p['rating'], 'total' => (int)($p['userRatingCount'] ?? 0), 'link' => $p['googleMapsUri'] ?? '', 'em' => $hoje];
      /* fotos reais do Google: guardamos só a referência e o autor (crédito obrigatório); a imagem é servida na hora por api/?acao=foto_google */
      $l['fotosGoogle'] = array_values(array_filter(array_map(fn($f) => ['ref' => (string)($f['name'] ?? ''), 'autor' => $f['authorAttributions'][0]['displayName'] ?? 'Usuário do Google', 'link' => $f['authorAttributions'][0]['uri'] ?? ($p['googleMapsUri'] ?? '')], array_slice((array)($p['photos'] ?? []), 0, 8)), fn($f) => preg_match('#^places/[\w-]+/photos/[\w-]+$#', $f['ref'])));
      $l['avaliacoesExternas'] = array_values(array_map(fn($v) => ['fonte' => 'Google', 'autor' => $v['authorAttribution']['displayName'] ?? 'Usuário do Google', 'nota' => (int)($v['rating'] ?? 0), 'texto' => $v['text']['text'] ?? ($v['originalText']['text'] ?? ''), 'data' => $v['relativePublishTimeDescription'] ?? '', 'link' => $v['authorAttribution']['uri'] ?? ($p['googleMapsUri'] ?? '')], array_slice((array)($p['reviews'] ?? []), 0, 5)));
      if (!empty($p['regularOpeningHours']['periods']) && empty($l['horasManual'])) {
        $h = []; for ($k = 0; $k < 7; $k++) $h[(string)$k] = [];
        foreach ($p['regularOpeningHours']['periods'] as $pe) {
          if (!isset($pe['open']['day'])) continue; $d0 = (int)$pe['open']['day']; $a = (int)$pe['open']['hour'] * 60 + (int)($pe['open']['minute'] ?? 0);
          if (!isset($pe['close'])) { $f = $a + 1440; } else { $f = (int)$pe['close']['hour'] * 60 + (int)($pe['close']['minute'] ?? 0); $dd = ((int)$pe['close']['day'] - $d0 + 7) % 7; $f += $dd * 1440; }
          $h[(string)$d0][] = ['a' => $a, 'f' => $f];
        }
        $l['horas'] = $h; $l['horarioFonte'] = 'Google · ' . $hoje;
        if (!empty($p['regularOpeningHours']['weekdayDescriptions'])) $l['horario'] = implode(' · ', $p['regularOpeningHours']['weekdayDescriptions']);
      }
      if (empty($l['telefone']) && !empty($p['nationalPhoneNumber'])) $l['telefone'] = $p['nationalPhoneNumber'];
      if (empty($l['site']) && !empty($p['websiteUri'])) $l['site'] = $p['websiteUri'];
      if (($p['businessStatus'] ?? '') === 'CLOSED_PERMANENTLY') { $l['publicado'] = false; $l['fechadoGoogle'] = $hoje; }
      $l['atualizadoEm'] = substr($hoje, 0, 7);
      $salva('lugares', $id, $l); $ok++;
    }
    $rel['feito'][] = "Google: $ok lugares com nota, avaliações e horário atualizados";
  } else $rel['erros'][] = 'Sem chave da Google Places API: avaliações e horários do Google não foram atualizados.';
  // 4c) imagem oficial do site de cada lugar (og:image), renovada a cada 30 dias
  $nS = 0; $limS = !empty($_GET['todos']) && master() ? 400 : 40; $antes30 = date('Y-m-d', strtotime($hoje . ' -30 day'));
  foreach ($pdo->query("SELECT id, data FROM docs WHERE col = 'lugares'")->fetchAll() as $row) {
    if ($nS >= $limS) break;
    $l = json_decode($row['data'], true); if (!is_array($l) || ($l['publicado'] ?? true) === false || empty($l['site']) || !preg_match('#^https?://#i', $l['site'])) continue;
    if (!empty($l['fotoSite']['em']) && $l['fotoSite']['em'] > $antes30) continue;
    $nS++;
    $ctx = stream_context_create(['http' => ['method' => 'GET', 'header' => "User-Agent: Mozilla/5.0 (compatible; CoracaoBR/1.0; +" . baseUrl() . ")\r\nAccept: text/html", 'timeout' => 10, 'ignore_errors' => true, 'follow_location' => 1, 'max_redirects' => 4]]);
    $html = @file_get_contents($l['site'], false, $ctx, 0, 400000); $img = '';
    if ($html && preg_match('#<meta[^>]+(?:property|name)=["\'](?:og:image(?::secure_url)?|twitter:image)["\'][^>]*content=["\']([^"\']+)#i', $html, $m)) $img = html_entity_decode($m[1]);
    elseif ($html && preg_match('#<meta[^>]+content=["\']([^"\']+)["\'][^>]*(?:property|name)=["\'](?:og:image|twitter:image)#i', $html, $m)) $img = html_entity_decode($m[1]);
    if ($img !== '' && !preg_match('#^https?://#i', $img)) { $b = parse_url($l['site']); $img = ($b['scheme'] ?? 'https') . '://' . ($b['host'] ?? '') . '/' . ltrim($img, '/'); }
    $img = preg_replace('#^http://#i', 'https://', $img);
    $l['fotoSite'] = preg_match('#^https://[^\s"\'<>]{8,600}$#', $img) && !preg_match('#logo|favicon|sprite|placeholder#i', $img) ? ['src' => $img, 'pagina' => $l['site'], 'em' => $hoje] : ['src' => '', 'pagina' => $l['site'], 'em' => $hoje];
    $salva('lugares', $row['id'], $l);
  }
  if ($nS) $rel['feito'][] = "Imagens oficiais dos sites conferidas: $nS lugares";
  if ($nS) { $mapa = []; foreach ($pdo->query("SELECT id, data FROM docs WHERE col = 'lugares'")->fetchAll() as $row) { $l = json_decode($row['data'], true); if (!empty($l['fotoSite']['src'])) $mapa[$row['id']] = ['src' => $l['fotoSite']['src'], 'pagina' => $l['fotoSite']['pagina'] ?? '']; } @file_put_contents(__DIR__ . '/../data/fotos-site.json', json_encode($mapa, JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES)); }
  // 4b) Pix automático: confere cobranças pendentes das últimas 48 h (caso algum aviso do Mercado Pago tenha se perdido)
  if (mpToken() !== '') { $nP = 0; foreach ($pdo->query("SELECT id, data FROM docs WHERE col = 'cobrancas'")->fetchAll() as $row) { $c = json_decode($row['data'], true); if (is_array($c) && ($c['status'] ?? '') === 'pendente' && strtotime($c['criadoEm'] ?? 'now') > time() - 172800) { $r = processaPagamento($row['id']); if ($r['status'] === 'aprovado') $nP++; } } $rel['feito'][] = "Pix conferidos: $nP aprovados"; }
  // 5) lembretes por e-mail: 3, 2 e 1 dia antes do fim do pacote (se não houver renovação já paga emendando)
  $env = 0; $pix = (array)($geral['pagamentos'] ?? []);
  foreach ($pdo->query("SELECT id, data FROM docs WHERE col = 'pagamentos'")->fetchAll() as $row) {
    $pg = json_decode($row['data'], true); if (!is_array($pg) || ($pg['status'] ?? '') === 'suspenso') continue;
    $pks = pacotesDe($pg); if (!$pks) continue;
    $feitos = (array)($pg['lembretes'] ?? []); $mudou = false;
    foreach ($pks as $pk) {
      $dias = (int)round((strtotime($pk['fim']) - strtotime($hoje)) / 86400);
      if ($dias < 1 || $dias > 3) continue;
      $emenda = false; foreach ($pks as $o) if ($o !== $pk && $o['fim'] > $pk['fim'] && $o['inicio'] <= date('Y-m-d', strtotime($pk['fim'] . ' +1 day'))) $emenda = true;
      $marca = ($pk['id'] ?? $pk['fim']) . ':' . $dias;
      if ($emenda || in_array($marca, $feitos, true)) continue;
      $u = $pdo->prepare('SELECT email, nome FROM usuarios WHERE id = ?'); $u->execute([$row['id']]); $u = $u->fetch();
      if (!$u || !filter_var($u['email'], FILTER_VALIDATE_EMAIL)) continue;
      $q = (int)($pk['anuncios'] ?? 3); $fim = date('d/m/Y', strtotime($pk['fim']));
      $txt = "Olá, {$u['nome']}.\n\nSeu plano no CoraçãoBR (" . $q . ($q === 1 ? ' anúncio' : ' anúncios') . ") termina em $dias " . ($dias === 1 ? 'dia' : 'dias') . ", no dia $fim.\n\nPara seus anúncios continuarem no ar sem interrupção, renove pelo painel do anunciante:\n" . baseUrl() . "#pagar\n\n"
        . "Pagamento por Pix:\nChave Pix (e-mail · Mercado Pago): " . chavePix($pix['pix'] ?? '') . "\nFavorecido: " . ($pix['pixNome'] ?? 'Danilo Araujo Santos Desenvolvedor') . "\nNo painel você encontra o QR Code e o Pix copia e cola com o valor certo.\n\nDepois do fim, há 2 dias de tolerância; em seguida os anúncios saem do ar até a renovação." . sacAssinatura();
      $host = preg_replace('/[^a-z0-9.-]/i', '', (string)($_SERVER['HTTP_HOST'] ?? 'localhost')); $de = $CFG['email_remetente'] ?: 'nao-responda@' . preg_replace('/^www\./', '', $host);
      if (@mail($u['email'], '=?UTF-8?B?' . base64_encode("CoraçãoBR: seu anúncio termina em $dias " . ($dias === 1 ? 'dia' : 'dias')) . '?=', $txt, "From: CoraçãoBR <$de>\r\nReply-To: " . emailOficial() . "\r\nContent-Type: text/plain; charset=UTF-8\r\n")) { $env++; }
      $feitos[] = $marca; $mudou = true;
    }
    if ($mudou) { $pg['lembretes'] = array_slice($feitos, -60); $salva('pagamentos', $row['id'], $pg); }
  }
  $rel['feito'][] = "Lembretes de vencimento enviados por e-mail: $env";
  // 6) relatório mensal por e-mail (dia 1): visualizações, rotas, contatos, cupons e pedidos do mês anterior
  if ($agoraD->format('j') === '1' && ($pdo->query("SELECT v FROM meta WHERE k = 'relatorio-mensal'")->fetchColumn() ?: '') !== $agoraD->format('Y-m')) {
    $mesAnt = (new DateTime('first day of last month', $tz))->format('Y-m'); $tot = [];
    foreach ($pdo->query("SELECT data FROM docs WHERE col = 'metricas'")->fetchAll() as $row) {
      $d = json_decode($row['data'], true); if (!is_array($d)) continue;
      foreach (isset($d['itens']) && is_array($d['itens']) ? $d['itens'] : [$d] as $m) { if (!is_array($m) || strpos((string)($m['dia'] ?? ''), $mesAnt) !== 0) continue; $l = (string)($m['lugarId'] ?? ''); foreach (['v', 'r', 'c'] as $k) $tot[$l][$k] = ($tot[$l][$k] ?? 0) + min(50, max(0, (int)($m[$k] ?? 0))); }
    }
    $nR = 0;
    foreach ($pdo->query("SELECT id, data FROM docs WHERE col = 'anunciantes'")->fetchAll() as $row) {
      $d = json_decode($row['data'], true); $its = (array)($d['itens'] ?? []); if (!$its) continue;
      $u = $pdo->prepare('SELECT email, nome FROM usuarios WHERE id = ?'); $u->execute([$row['id']]); $u = $u->fetch(); if (!$u || !filter_var($u['email'], FILTER_VALIDATE_EMAIL)) continue;
      $linhas = []; $sv = 0;
      foreach ($its as $k => $it) { if (!is_array($it) || empty($it['nome'])) continue; $lid = $row['id'] . '~' . $k; $t = $tot[$lid] ?? ['v' => 0, 'r' => 0, 'c' => 0]; $cup = 0; foreach ((array)($it['validados'] ?? []) as $vv) if (strpos((string)($vv['em'] ?? ''), $mesAnt) === 0) $cup++; $ped = (int)($pdo->query("SELECT v FROM meta WHERE k = " . $pdo->quote('pedidos:' . $lid . ':' . $mesAnt))->fetchColumn() ?: 0); $sv += $t['v'];
        $linhas[] = "• {$it['nome']}: " . ($t['v'] ?? 0) . " visualizações, " . ($t['r'] ?? 0) . " rotas, " . ($t['c'] ?? 0) . " cliques em contato, $cup cupons usados, $ped pedidos"; }
      if (!$linhas) continue;
      $host = preg_replace('/[^a-z0-9.-]/i', '', (string)($_SERVER['HTTP_HOST'] ?? 'localhost')); $de = $CFG['email_remetente'] ?: 'nao-responda@' . preg_replace('/^www\./', '', $host);
      if (@mail($u['email'], '=?UTF-8?B?' . base64_encode('CoraçãoBR: seu relatório de ' . date('m/Y', strtotime($mesAnt . '-01'))) . '?=', "Olá, {$u['nome']}.\n\nResumo dos seus anúncios em " . date('m/Y', strtotime($mesAnt . '-01')) . ":\n\n" . implode("\n", $linhas) . "\n\nTotal: $sv visualizações.\n\nDicas: anúncios com mais fotos, cupom e selo Verificado recebem mais contatos. Para aparecer no topo por " . precosServidor()['diasImpulso'] . " dias, use Impulsionar no painel:\n" . baseUrl() . "#anunciante" . sacAssinatura(), "From: CoraçãoBR <$de>\r\nReply-To: " . emailOficial() . "\r\nContent-Type: text/plain; charset=UTF-8\r\n")) $nR++;
    }
    $pdo->prepare("INSERT OR REPLACE INTO meta (k, v) VALUES ('relatorio-mensal', ?)")->execute([$agoraD->format('Y-m')]);
    $rel['feito'][] = "Relatórios mensais enviados: $nR";
  }
  // relatório
  $robo = configDoc('robo'); $robo['servidor'] = $rel; $robo['ultimaExecucaoServidor'] = $rel['data']; $salva('config', 'robo', $robo);
  // novos lugares e eventos publicados nas últimas 24 h: avisa no celular quem mora perto (pelo CEP)
  if (($geral['pushPerto'] ?? true) !== false) {
    $novos = [];
    foreach ($pdo->query("SELECT id, data FROM docs WHERE col IN ('lugares', 'anunciantes')") as $r0) { $d0 = json_decode($r0['data'], true); $it = isset($d0['itens']) ? (array)$d0['itens'] : [$r0['id'] => $d0]; foreach ($it as $k0 => $l0) { if (!is_array($l0) || empty($l0['nome']) || !isset($l0['lat']) || ($l0['publicado'] ?? true) === false) continue; if (!empty($l0['criadoEm']) && strtotime($l0['criadoEm']) > time() - 86400) { $l0['id'] = isset($d0['itens']) ? $r0['id'] . '~' . $k0 : $r0['id']; $novos[] = $l0; } } }
    if ($novos) { try { $r = enviaPush('Novidade perto de você', 'Tem lugar novo no CoraçãoBR perto de você.', './#explorar', '', function ($sub) use ($novos) {
      $reg = !empty($sub['uid']) ? regiaoDoUsuario($sub['uid']) : null; if (!$reg) return null;
      foreach ($novos as $l) if (kmEntre($reg['lat'], $reg['lng'], (float)$l['lat'], (float)$l['lng']) <= 30) return ['Novo perto de você: ' . mb_substr((string)$l['nome'], 0, 40), 'Acabou de entrar no CoraçãoBR, perto de ' . ($reg['cidade'] ?: 'você') . '. Toque para ver.', './#lugar-' . ($l['id'] ?? '')];
      return null; }); $rel['feito'][] = 'Novidades perto do CEP: ' . $r['enviados'] . ' aparelhos'; } catch (Throwable $e) { $rel['erros'][] = 'Push perto: ' . $e->getMessage(); } }
  }
  // newsletter semanal (toda quinta, com eventos do fim de semana e cupons) e aviso no celular na sexta
  $dow = (int)$agoraD->format('N');
  if ($dow === 4) { try { $r = newsletterAuto(); $rel['feito'][] = 'Newsletter semanal: ' . ($r['msg'] ?? ($r['enviados'] . ' e-mails enviados')); } catch (Throwable $e) { $rel['erros'][] = 'Newsletter: ' . $e->getMessage(); } }
  if ($dow === 5 && ($geral['pushFds'] ?? true) !== false && (string)$pdo->query("SELECT v FROM meta WHERE k = 'push-fds'")->fetchColumn() !== $hoje) {
    $sab = date('Y-m-d', strtotime($hoje . ' +1 day')); $dom = date('Y-m-d', strtotime($hoje . ' +2 day')); $n = 0;
    foreach ($pdo->query("SELECT data FROM docs WHERE col = 'lugares'") as $r0) { $l0 = json_decode($r0['data'], true); if (!is_array($l0) || !in_array($l0['categoria'] ?? '', ['evento', 'show'], true) || ($l0['publicado'] ?? true) === false || !empty($l0['cancelado'])) continue; $ini = (string)($l0['dataInicio'] ?? ''); $fim = (string)($l0['dataFim'] ?? $ini); if ($ini !== '' && $ini <= $dom && $fim >= $hoje) $n++; }
    $evFds = [];
    foreach ($pdo->query("SELECT data FROM docs WHERE col = 'lugares'") as $r0) { $l0 = json_decode($r0['data'], true); if (!is_array($l0) || !in_array($l0['categoria'] ?? '', ['evento', 'show'], true) || ($l0['publicado'] ?? true) === false || !empty($l0['cancelado'])) continue; $ini = (string)($l0['dataInicio'] ?? ''); $fim = (string)($l0['dataFim'] ?? $ini); if ($ini !== '' && $ini <= $dom && $fim >= $hoje && isset($l0['lat'])) $evFds[] = $l0; }
    if ($n > 0) { try {
      $r = enviaPush('Fim de semana brasileiro', $n . ' eventos neste fim de semana. Veja a programação no CoraçãoBR.', './#explorar', 'eventos', function ($sub) use ($evFds, $n) {
        $reg = !empty($sub['uid']) ? regiaoDoUsuario($sub['uid']) : null;
        if (!$reg) return ['Fim de semana brasileiro', $n . ' eventos neste fim de semana no CoraçãoBR. Veja a programação.', './#explorar'];
        $perto = array_filter($evFds, fn($l) => kmEntre($reg['lat'], $reg['lng'], (float)$l['lat'], (float)$l['lng']) <= 60);
        if (!$perto) return null;
        $k = count($perto); $um = reset($perto);
        return ['Perto de você neste fim de semana', $k . ($k === 1 ? ' evento' : ' eventos') . ' perto de ' . ($reg['cidade'] ?: 'você') . ', como ' . ($um['nome'] ?? '') . '.', './#explorar'];
      });
      $rel['feito'][] = 'Aviso no celular: ' . $r['enviados'] . ' aparelhos'; } catch (Throwable $e) { $rel['erros'][] = 'Push: ' . $e->getMessage(); } }
    $pdo->prepare("INSERT OR REPLACE INTO meta (k, v) VALUES ('push-fds', ?)")->execute([$hoje]);
  }
  $pdo->prepare("INSERT OR REPLACE INTO meta (k, v) VALUES ('diario', ?)")->execute([$hoje]);
  versao('lugares'); versao('config');
  sai(['ok' => true] + $rel);
}
case 'pix_criar': {
  if ($metodo !== 'POST') erro('Use POST.', 405);
  $u = eu(); $caixinha = ($corpo['plano'] ?? '') === 'caixinha';
  if (!$u && !$caixinha) erro('Entre na sua conta para continuar.', 401);
  if (mpToken() === '') erro('O Pix automático ainda não foi ligado pela equipe.', 409);
  if ($caixinha) {
    /* caixinha do desenvolvedor: valor livre, pode ser visitante sem conta */
    $quem = $u ? $u['id'] : $_SESSION['visitante'];
    if (!limite('pix:' . $quem, 20, 3600) || !limite('pixip:' . ip(), 40, 3600)) erro('Muitas cobranças geradas. Aguarde alguns minutos.', 429); marca('pix:' . $quem); marca('pixip:' . ip());
    $valor = round((float)str_replace(',', '.', (string)($corpo['valor'] ?? 0)), 2);
    if ($valor < 1 || $valor > 5000) erro('Escolha um valor entre R$ 1 e R$ 5.000.');
    $expira = (new DateTime('+30 minutes'))->format('Y-m-d\TH:i:s.vP');
    $host = preg_replace('/:\d+$/', '', (string)($_SERVER['HTTP_HOST'] ?? '')); if (!preg_match('/^[a-z0-9-]+(\.[a-z0-9-]+)+$/i', $host) || filter_var($host, FILTER_VALIDATE_IP)) $host = 'coracaobr.app';
    $nome = $u ? explode(' ', trim($u['nome']), 2) : ['Apoiador', 'CoraçãoBR'];
    $r = mp('POST', '/v1/payments', ['transaction_amount' => $valor, 'description' => 'CoraçãoBR · apoio pela caixinha', 'payment_method_id' => 'pix', 'date_of_expiration' => $expira,
      'payer' => ['email' => $u ? $u['email'] : 'apoio+' . substr($quem, 0, 12) . '@' . $host, 'first_name' => $nome[0] ?? '', 'last_name' => $nome[1] ?? ''], 'external_reference' => $quem . '|caixinha|1',
      'notification_url' => baseUrl() . 'api/?acao=pix_webhook'], bin2hex(random_bytes(16)));
    $tx = $r['point_of_interaction']['transaction_data'] ?? null;
    if (!is_array($r) || empty($r['id']) || !$tx) erro('O Mercado Pago não gerou o Pix agora. Tente de novo em instantes.' . (isset($r['message']) ? ' (' . mb_substr((string)$r['message'], 0, 120) . ')' : ''), 502);
    $id = (string)$r['id'];
    $c = ['uid' => $quem, 'plano' => 'caixinha', 'qtd' => 1, 'valor' => $valor, 'status' => 'pendente', 'criadoEm' => gmdate('c'), 'expira' => $expira];
    banco()->prepare("INSERT INTO docs (col, id, data, em) VALUES ('cobrancas', ?, ?, ?) ON CONFLICT(col, id) DO UPDATE SET data = excluded.data, em = excluded.em")->execute([$id, json_encode($c, JSON_UNESCAPED_UNICODE), agora()]);
    sai(['ok' => true, 'id' => $id, 'valor' => $valor, 'copiaecola' => $tx['qr_code'] ?? '', 'qr' => $tx['qr_code_base64'] ?? '', 'expira' => $expira]);
  }
  if (!limite('pix:' . $u['id'], 20, 3600)) erro('Muitas cobranças geradas. Aguarde alguns minutos.', 429); marca('pix:' . $u['id']);
  $p = precosServidor(); $plano = in_array($corpo['plano'] ?? '', ['pacote', 'promo', 'verificado', 'impulso', 'clube', 'mural'], true) ? $corpo['plano'] : 'pacote'; $promo = $plano === 'promo';
  $qtd = $plano === 'pacote' ? max(1, min(30, (int)($corpo['qtd'] ?? 1))) : 1;
  $comeca = ($corpo['comeca'] ?? '') === 'renovar' ? 'renovar' : 'agora';
  $lugarId = (string)($corpo['lugarId'] ?? '');
  if ($plano === 'impulso' && strpos($lugarId, $u['id'] . '~') !== 0) erro('Escolha um dos seus anúncios para impulsionar.');
  $itemId = (string)($corpo['itemId'] ?? '');
  if ($plano === 'mural' && strpos($itemId, $u['id'] . '~') !== 0) erro('Escolha uma das suas publicações do Mural para destacar.');
  $desconto = $plano === 'pacote' && (int)(pagamentoDe($u['id'])['creditosIndicacao'] ?? 0) > 0 ? round($p['pacote'] / 2, 2) : 0;
  $valor = round($plano === 'promo' ? $p['promo'] : ($plano === 'verificado' ? $p['selo'] : ($plano === 'impulso' ? $p['impulso'] : ($plano === 'clube' ? $p['clube'] : ($plano === 'mural' ? $p['mural'] : $qtd * $p['pacote'] - $desconto)))), 2); if ($valor <= 0) erro('Valor inválido.');
  $desc = $plano === 'clube' ? 'CoraçãoBR · Clube CoraçãoBR (1 mês)' : ($plano === 'mural' ? 'CoraçãoBR · destaque no Mural por ' . $p['diasMural'] . ' dias' : '');
  if ($desc === '') $desc = $plano === 'verificado' ? 'CoraçãoBR · selo Verificado' : ($plano === 'impulso' ? 'CoraçãoBR · impulsionar anúncio por ' . $p['diasImpulso'] . ' dias' : ($promo ? 'CoraçãoBR · promoção de curadoria (1 anúncio + ' . $p['promoDepo'] . ' depoimentos)' : 'CoraçãoBR · ' . ($qtd * $p['porPacote']) . ' anúncios por 1 mês'));
  $expira = (new DateTime('+30 minutes'))->format('Y-m-d\TH:i:s.vP');
  $nome = explode(' ', trim($u['nome']), 2);
  $r = mp('POST', '/v1/payments', ['transaction_amount' => $valor, 'description' => $desc, 'payment_method_id' => 'pix', 'date_of_expiration' => $expira,
    'payer' => ['email' => $u['email'], 'first_name' => $nome[0] ?? '', 'last_name' => $nome[1] ?? ''], 'external_reference' => $u['id'] . '|' . $plano . '|' . $qtd,
    'notification_url' => baseUrl() . 'api/?acao=pix_webhook'], bin2hex(random_bytes(16)));
  $tx = $r['point_of_interaction']['transaction_data'] ?? null;
  if (!is_array($r) || empty($r['id']) || !$tx) erro('O Mercado Pago não gerou o Pix agora. Tente de novo em instantes.' . (isset($r['message']) ? ' (' . mb_substr((string)$r['message'], 0, 120) . ')' : ''), 502);
  $id = (string)$r['id'];
  $c = ['uid' => $u['id'], 'plano' => $plano, 'qtd' => $qtd, 'comeca' => $comeca, 'lugarId' => $lugarId, 'itemId' => $itemId, 'desconto' => $desconto, 'valor' => $valor, 'status' => 'pendente', 'criadoEm' => gmdate('c'), 'expira' => $expira];
  banco()->prepare("INSERT INTO docs (col, id, data, em) VALUES ('cobrancas', ?, ?, ?) ON CONFLICT(col, id) DO UPDATE SET data = excluded.data, em = excluded.em")->execute([$id, json_encode($c, JSON_UNESCAPED_UNICODE), agora()]);
  sai(['ok' => true, 'id' => $id, 'valor' => $valor, 'copiaecola' => $tx['qr_code'] ?? '', 'qr' => $tx['qr_code_base64'] ?? '', 'expira' => $expira]);
}
case 'pix_status': {
  $u = eu(); $quem = $u ? $u['id'] : $_SESSION['visitante'];
  $id = preg_replace('/\D/', '', (string)($_GET['id'] ?? ''));
  $st = banco()->prepare("SELECT data FROM docs WHERE col = 'cobrancas' AND id = ?"); $st->execute([$id]); $c = json_decode((string)$st->fetchColumn(), true);
  if (!$u && !(is_array($c) && ($c['plano'] ?? '') === 'caixinha')) erro('Entre na sua conta para continuar.', 401);
  if (!is_array($c) || ($c['uid'] !== $quem && !($u && $c['uid'] === $_SESSION['visitante']) && !master())) erro('Cobrança não encontrada.', 404);
  $r = processaPagamento($id); sai(['ok' => true, 'status' => $r['status'], 'pacote' => $r['cobranca']['pacote'] ?? null]);
}
case 'pix_webhook': {
  /* aviso do Mercado Pago: nunca confia no corpo; consulta o pagamento pelo id e só então libera */
  $b = json_decode((string)file_get_contents('php://input', false, null, 0, 20000), true) ?: [];
  $id = preg_replace('/\D/', '', (string)($b['data']['id'] ?? $_GET['data_id'] ?? $_GET['id'] ?? ''));
  if ($id !== '' && mpToken() !== '') processaPagamento($id);
  http_response_code(200); header('Content-Type: application/json'); echo '{"ok":true}'; exit;
}
case 'pix_token': {
  exigeMaster(); if ($metodo !== 'POST') erro('Use POST.', 405);
  $k = trim((string)($corpo['token'] ?? '')); $f = dirname($CFG['db']) . '/MERCADOPAGO.token';
  if ($k === '') { @unlink($f); sai(['ok' => true, 'msg' => 'Pix automático desligado.']); }
  if (!preg_match('/^(APP_USR|TEST)-[A-Za-z0-9\-]{20,200}$/', $k)) erro('Isso não parece um Access Token do Mercado Pago (começa com APP_USR-).');
  $old = @file_get_contents($f); file_put_contents($f, $k); @chmod($f, 0600);
  $me = mp('GET', '/users/me');
  if (!is_array($me) || empty($me['id'])) { if ($old !== false) file_put_contents($f, $old); else @unlink($f); erro('O Mercado Pago recusou este token. Confira se é o Access Token de produção.'); }
  sai(['ok' => true, 'msg' => 'Pix automático ligado na conta ' . ($me['nickname'] ?? $me['email'] ?? $me['id']) . '.']);
}
case 'pix_info': {
  exigeMaster();
  $n = (int)banco()->query("SELECT COUNT(*) FROM docs WHERE col = 'cobrancas'")->fetchColumn();
  sai(['ok' => true, 'ligado' => mpToken() !== '', 'webhook' => baseUrl() . 'api/?acao=pix_webhook', 'cobrancas' => $n]);
}
case 'indicacoes': {
  $u = eu(); if (!$u) erro('Entre na sua conta para continuar.', 401);
  $n = 0; $pr = 0; foreach (banco()->query("SELECT data FROM docs WHERE col = 'indicacoes'")->fetchAll() as $row) { $d = json_decode($row['data'], true); if (($d['por'] ?? '') === $u['id']) { $n++; if (!empty($d['premiado'])) $pr++; } }
  sai(['ok' => true, 'indicados' => $n, 'premiados' => $pr, 'creditos' => (int)(pagamentoDe($u['id'])['creditosIndicacao'] ?? 0)]);
}
case 'pedido': {
  /* agendamento, pedido ou orçamento enviado pela página do anúncio: vai por e-mail para o dono do anúncio */
  if ($metodo !== 'POST') erro('Use POST.', 405);
  if (!limite('ped:' . ip(), 8, 3600)) erro('Muitos pedidos seguidos. Tente de novo mais tarde.', 429); marca('ped:' . ip());
  $lid = campo('lugarId', 130); $dono = strpos($lid, '~') !== false ? substr($lid, 0, strpos($lid, '~')) : '';
  $nome = campo('nome', 60); $cont = campo('contato', 120); $tipo = campo('tipo', 30); $dia = campo('data', 10); $hora = campo('hora', 5); $msg = campo('mensagem', 800);
  if ($nome === '' || $cont === '') erro('Informe seu nome e como falar com você.');
  $st = banco()->prepare('SELECT email, nome FROM usuarios WHERE id = ?'); $st->execute([$dono]); $u = $st->fetch();
  if (!$u || !filter_var($u['email'], FILTER_VALIDATE_EMAIL)) erro('Este anúncio não recebe pedidos pelo site. Use o WhatsApp.', 404);
  $an = ''; $q = banco()->prepare("SELECT data FROM docs WHERE col = 'anunciantes' AND id = ?"); $q->execute([$dono]); $dd = json_decode((string)$q->fetchColumn(), true); if (is_array($dd)) foreach ((array)($dd['itens'] ?? []) as $k => $it) if ($dono . '~' . $k === $lid || ($it['id'] ?? '') === $lid) $an = (string)($it['nome'] ?? '');
  global $CFG; $host = preg_replace('/[^a-z0-9.-]/i', '', (string)($_SERVER['HTTP_HOST'] ?? 'localhost')); $de = $CFG['email_remetente'] ?: 'nao-responda@' . preg_replace('/^www\./', '', $host);
  $txt = "Olá, {$u['nome']}.\n\nVocê recebeu um pedido pelo CoraçãoBR" . ($an ? " no anúncio \"$an\"" : '') . ":\n\nTipo: " . ($tipo ?: 'Contato') . "\nNome: $nome\nContato: $cont" . ($dia ? "\nData desejada: " . date('d/m/Y', strtotime($dia)) . ($hora ? " às $hora" : '') : '') . ($msg ? "\n\nMensagem:\n$msg" : '') . "\n\nResponda direto para o cliente. Bons negócios!";
  $rt = filter_var($cont, FILTER_VALIDATE_EMAIL) ? $cont : emailOficial();
  $ok = @mail($u['email'], '=?UTF-8?B?' . base64_encode('CoraçãoBR: novo pedido de ' . $nome) . '?=', $txt . sacAssinatura(), "From: CoraçãoBR <$de>\r\nReply-To: $rt\r\nContent-Type: text/plain; charset=UTF-8\r\n");
  $k = 'pedidos:' . $lid . ':' . date('Y-m'); banco()->prepare("INSERT INTO meta (k, v) VALUES (?, '1') ON CONFLICT(k) DO UPDATE SET v = CAST(v AS INTEGER) + 1")->execute([$k]);
  sai(['ok' => true, 'enviado' => (bool)$ok]);
}
case 'foto_google': {
  /* entrega a foto do Google sem expor a chave: pede o endereço da imagem à API oficial e redireciona; o navegador guarda por 1 dia */
  global $CFG; $gk = trim((string)($CFG['google_places_key'] ?? '')) ?: trim((string)@file_get_contents(dirname($CFG['db']) . '/GOOGLE-PLACES.key'));
  $ref = (string)($_GET['ref'] ?? ''); $w = max(200, min(1600, (int)($_GET['w'] ?? 1200)));
  if ($gk === '' || !preg_match('#^places/[\w-]+/photos/[\w-]+$#', $ref)) { http_response_code(404); exit; }
  if (!limite('fg:' . ip(), 600, 3600)) { http_response_code(429); exit; } marca('fg:' . ip());
  $ctx = stream_context_create(['http' => ['method' => 'GET', 'header' => 'X-Goog-Api-Key: ' . $gk, 'timeout' => 15, 'ignore_errors' => true]]);
  $j = json_decode((string)@file_get_contents('https://places.googleapis.com/v1/' . $ref . '/media?maxWidthPx=' . $w . '&skipHttpRedirect=true', false, $ctx), true);
  $u = (string)($j['photoUri'] ?? '');
  if (!preg_match('#^https://[\w.-]+\.(googleusercontent|google|gstatic)\.com/#', $u)) { http_response_code(404); exit; }
  header('Cache-Control: public, max-age=86400'); header('Location: ' . $u, true, 302); exit;
}
case 'chave_google': {
  exigeMaster(); if ($metodo !== 'POST') erro('Use POST.', 405);
  $k = trim((string)($corpo['chave'] ?? '')); $f = dirname($CFG['db']) . '/GOOGLE-PLACES.key';
  if ($k === '') { @unlink($f); sai(['ok' => true, 'msg' => 'Chave removida.']); }
  if (!preg_match('/^[A-Za-z0-9_\-]{20,80}$/', $k)) erro('Chave inválida.');
  file_put_contents($f, $k); @chmod($f, 0600); sai(['ok' => true, 'msg' => 'Chave salva no servidor.']);
}
case 'cron_info': {
  exigeMaster();
  $f = dirname($CFG['db']) . '/CHAVE-CRON.txt';
  if (!is_file($f)) @file_put_contents($f, bin2hex(random_bytes(12)) . "\n");
  $c = trim((string)@file_get_contents($f)); $gk = trim((string)($CFG['google_places_key'] ?? '')) ?: trim((string)@file_get_contents(dirname($CFG['db']) . '/GOOGLE-PLACES.key'));
  sai(['ok' => true, 'url' => baseUrl() . 'api/?acao=newsletter_cron&chave=' . $c, 'diario' => baseUrl() . 'api/?acao=atualizar_diario&chave=' . $c, 'google' => $gk !== '', 'ultimo' => (string)banco()->query("SELECT v FROM meta WHERE k = 'diario'")->fetchColumn()]);
}
/* ===== Assistente "Pergunte ao CoraçãoBR" (Claude, pela API oficial da Anthropic) =====
   O servidor escolhe os lugares do guia que combinam com a pergunta e manda só esses para a IA, que responde citando os lugares.
   Sem a chave (Painel master → Novidades), responde com a busca do próprio guia. */
case 'assistente': {
  if ($metodo !== 'POST') erro('Use POST.', 405);
  $perg = trim(mb_substr((string)($corpo['pergunta'] ?? ''), 0, 500));
  if (mb_strlen($perg) < 3) erro('Escreva sua pergunta.');
  $quem = eu() ? eu()['id'] : ip();
  if (!limite('ia:' . $quem, 30, 3600)) erro('Muitas perguntas seguidas. Tente de novo daqui a pouco.', 429); marca('ia:' . $quem);
  $reg = in_array($corpo['cidade'] ?? '', ['dfw', 'houston', 'austin', 'sanantonio'], true) ? $corpo['cidade'] : 'dfw';
  $nomeReg = ['dfw' => 'Dallas–Fort Worth', 'houston' => 'Houston', 'austin' => 'Austin', 'sanantonio' => 'San Antonio'][$reg];
  $cands = buscaLugares($perg, 30, $reg);
  $ids = array_map(fn($l) => $l['id'], array_slice($cands, 0, 8));
  $key = chaveIA();
  if ($key === '' || !is_file(__DIR__ . '/vendor/autoload.php')) sai(['ok' => true, 'modo' => 'busca', 'resposta' => '', 'ids' => $ids]);
  $hist = [];
  foreach (array_slice((array)($corpo['historico'] ?? []), -6) as $h) {
    $r = ($h['role'] ?? '') === 'assistant' ? 'assistant' : 'user'; $t = trim(mb_substr((string)($h['content'] ?? ''), 0, 1500));
    if ($t === '' || ($hist && end($hist)['role'] === $r)) continue;
    if (!$hist && $r === 'assistant') continue;
    $hist[] = ['role' => $r, 'content' => $t];
  }
  if ($hist && end($hist)['role'] === 'user') array_pop($hist);
  $linhas = [];
  foreach ($cands as $l) {
    $linhas[] = '[' . $l['id'] . '] ' . ($l['nome'] ?? '') . ' | ' . ($l['categoria'] ?? '') . ' | ' . trim(($l['bairro'] ?? '') . ', ' . ($l['cidade'] ?? ''), ', ') .
      (!empty($l['nota']) ? ' | nota ' . $l['nota'] : '') . (!empty($l['dataInicio']) ? ' | data ' . $l['dataInicio'] . (!empty($l['dataFim']) && $l['dataFim'] !== $l['dataInicio'] ? ' a ' . $l['dataFim'] : '') : '') .
      (!empty($l['gratuito']) ? ' | grátis' : '') . (!empty($l['falaPortugues']) || !empty($l['portugues']) ? ' | fala português' : '') . (!empty($l['cupom']) ? ' | cupom: ' . mb_substr((string)$l['cupom'], 0, 60) : '') .
      ' | ' . mb_substr(preg_replace('/\s+/', ' ', strip_tags((string)($l['descricao'] ?? $l['resumo'] ?? ''))), 0, 160);
  }
  $sistema = "Você é o assistente do CoraçãoBR, guia em português para brasileiros que moram ou estão de passagem no Texas (Dallas–Fort Worth, Houston, Austin e San Antonio).\n" .
    "Responda sempre em português do Brasil, de forma calorosa, direta e curta (no máximo 120 palavras).\n" .
    "Para recomendar lugares, eventos ou serviços, use SOMENTE os itens da lista enviada junto com a pergunta e cite cada um com o código entre colchetes duplos, por exemplo [[abc123]]; o site transforma o código em link.\n" .
    "Nunca invente telefone, preço, horário, endereço ou data que não esteja na lista. Se a lista não tiver o que a pessoa procura, diga isso e sugira procurar no Explorar do guia.\n" .
    "Para dúvidas práticas de imigrante (documentos, carteira de motorista, SSN, escola, saúde), dê uma orientação geral e indique o site oficial do órgão; não é assessoria jurídica, médica ou fiscal.\n" .
    "Não responda a pedidos fora do tema do guia e da vida de brasileiros no Texas.";
  $msgs = $hist; $msgs[] = ['role' => 'user', 'content' => "Hoje é " . hojeDallas() . ". A pessoa está vendo o guia de " . $nomeReg . ".\nItens do guia que podem ajudar:\n" . ($linhas ? implode("\n", $linhas) : '(nenhum item encontrado)') . "\n\nPergunta: " . $perg];
  try {
    require_once __DIR__ . '/vendor/autoload.php';
    $cli = new \Anthropic\Client(apiKey: $key);
    $m = $cli->beta->messages->create(
      model: modeloIA(), maxTokens: 4000, system: $sistema, messages: $msgs,
      outputConfig: ['effort' => 'low'], fallbacks: 'default', betas: ['server-side-fallback-2026-07-01'],
    );
    if ($m->stopReason === 'refusal') sai(['ok' => true, 'modo' => 'busca', 'resposta' => 'Não posso ajudar com isso aqui. Veja o que o guia encontrou:', 'ids' => $ids]);
    $txt = ''; foreach ($m->content as $b) if ($b->type === 'text') $txt .= $b->text;
    $citados = []; if (preg_match_all('/\[\[([A-Za-z0-9_~-]{1,130})\]\]/', $txt, $mm)) $citados = array_values(array_unique($mm[1]));
    $validos = array_map(fn($l) => $l['id'], $cands);
    $txt = preg_replace_callback('/\[\[([A-Za-z0-9_~-]{1,130})\]\]/', fn($x) => in_array($x[1], $validos, true) ? $x[0] : '', $txt);
    $k = 'ia:' . date('Y-m'); banco()->prepare("INSERT INTO meta (k, v) VALUES (?, '1') ON CONFLICT(k) DO UPDATE SET v = CAST(v AS INTEGER) + 1")->execute([$k]);
    sai(['ok' => true, 'modo' => 'ia', 'resposta' => trim($txt), 'ids' => array_values(array_intersect($citados, $validos))]);
  } catch (\Anthropic\Core\Exceptions\RateLimitException $e) {
    sai(['ok' => true, 'modo' => 'busca', 'resposta' => 'O assistente está com muita procura agora. Veja o que o guia encontrou:', 'ids' => $ids]);
  } catch (\Anthropic\Core\Exceptions\APIStatusException $e) {
    error_log('[coracaobr] IA: ' . $e->getMessage());
    sai(['ok' => true, 'modo' => 'busca', 'resposta' => 'O assistente não respondeu agora. Veja o que o guia encontrou:', 'ids' => $ids]);
  } catch (\Anthropic\Core\Exceptions\APIConnectionException $e) {
    sai(['ok' => true, 'modo' => 'busca', 'resposta' => 'Sem conexão com o assistente agora. Veja o que o guia encontrou:', 'ids' => $ids]);
  }
}
case 'chave_ia': {
  exigeMaster(); if ($metodo !== 'POST') erro('Use POST.', 405);
  $f = dirname($CFG['db']) . '/ANTHROPIC.key'; $k = trim((string)($corpo['chave'] ?? ''));
  if (isset($corpo['modelo'])) { $mo = in_array($corpo['modelo'], ['claude-opus-5-5', 'claude-sonnet-5-5', 'claude-haiku-5-5'], true) ? $corpo['modelo'] : 'claude-opus-5-5'; @file_put_contents(dirname($CFG['db']) . '/ANTHROPIC.modelo', $mo); if ($k === '' && empty($corpo['apagar'])) sai(['ok' => true, 'msg' => 'Modelo salvo.']); }
  if ($k === '' && !empty($corpo['apagar'])) { @unlink($f); sai(['ok' => true, 'msg' => 'Assistente com IA desligado. A busca do guia continua funcionando.']); }
  if (!preg_match('/^sk-ant-[A-Za-z0-9_\-]{20,300}$/', $k)) erro('Isso não parece uma chave da Anthropic (começa com sk-ant-).');
  file_put_contents($f, $k); @chmod($f, 0600);
  sai(['ok' => true, 'msg' => 'Chave salva no servidor. O assistente já responde com IA.']);
}
case 'ia_info': {
  exigeMaster();
  sai(['ok' => true, 'ligado' => chaveIA() !== '', 'sdk' => is_file(__DIR__ . '/vendor/autoload.php'), 'modelo' => modeloIA(), 'mes' => (int)banco()->query("SELECT v FROM meta WHERE k = 'ia:" . date('Y-m') . "'")->fetchColumn()]);
}
/* ===== Notificações no celular (Web Push com VAPID, sem conteúdo no envio: o aparelho busca a última mensagem) ===== */
case 'push_chave': { sai(['ok' => true, 'chave' => vapid()['pub']]); }
case 'push_inscrever': {
  if ($metodo !== 'POST') erro('Use POST.', 405);
  $ep = (string)($corpo['endpoint'] ?? '');
  if (!preg_match('#^https://[a-z0-9.-]+(:\d+)?/[\x21-\x7e]{10,800}$#i', $ep)) erro('Inscrição inválida.');
  if (!limite('push:' . ip(), 20, 3600)) erro('Tente de novo mais tarde.', 429); marca('push:' . ip());
  $temas = array_values(array_filter(array_map(fn($t) => preg_replace('/[^a-z0-9-]/', '', (string)$t), (array)($corpo['temas'] ?? [])))) ;
  banco()->prepare("INSERT INTO docs (col, id, data, em) VALUES ('push', ?, ?, ?) ON CONFLICT(col, id) DO UPDATE SET data = excluded.data, em = excluded.em")->execute([hash('sha256', $ep), json_encode(['endpoint' => $ep, 'uid' => eu()['id'] ?? '', 'temas' => array_slice($temas, 0, 20), 'em' => gmdate('c')]), agora()]);
  sai(['ok' => true]);
}
case 'push_sair': {
  if ($metodo !== 'POST') erro('Use POST.', 405);
  banco()->prepare("DELETE FROM docs WHERE col = 'push' AND id = ?")->execute([hash('sha256', (string)($corpo['endpoint'] ?? ''))]); sai(['ok' => true]);
}
case 'push_ultima': {
  $ep = (string)($_GET['ep'] ?? '');
  if ($ep !== '') { $st = banco()->prepare("SELECT data FROM docs WHERE col = 'push' AND id = ?"); $st->execute([hash('sha256', $ep)]); $sd = json_decode((string)$st->fetchColumn(), true); if (!empty($sd['ult']['em']) && time() - strtotime($sd['ult']['em']) < 6 * 3600) sai(['ok' => true, 'msg' => $sd['ult']]); }
  $j = json_decode((string)banco()->query("SELECT v FROM meta WHERE k = 'push-ultima'")->fetchColumn(), true);
  sai(['ok' => true, 'msg' => is_array($j) ? $j : ['titulo' => 'CoraçãoBR', 'texto' => 'Novidades no guia para você.', 'url' => './']]);
}
case 'push_enviar': {
  exigeMaster(); if ($metodo !== 'POST') erro('Use POST.', 405);
  $t = campo('titulo', 60); $x = campo('texto', 160); $url = campo('url', 200);
  if ($t === '' || $x === '') erro('Escreva o título e o texto.');
  @set_time_limit(300);
  sai(['ok' => true] + enviaPush($t, $x, $url ?: './'));
}
case 'push_info': {
  exigeMaster(); sai(['ok' => true, 'inscritos' => (int)banco()->query("SELECT COUNT(*) FROM docs WHERE col = 'push'")->fetchColumn(), 'ultima' => json_decode((string)banco()->query("SELECT v FROM meta WHERE k = 'push-ultima'")->fetchColumn(), true)]);
}
/* ===== Mapa do site para o Google (sitemap.xml e robots.txt, com o endereço real do site) ===== */
case 'sitemap': {
  header('Content-Type: application/xml; charset=utf-8'); header('Cache-Control: public, max-age=3600');
  $b = baseUrl(); $urls = [$b];
  $f = __DIR__ . '/../guia/paginas.json'; $pg = is_file($f) ? json_decode((string)file_get_contents($f), true) : [];
  foreach ((array)$pg as $p) if (is_string($p) && preg_match('#^guia/[a-z0-9/-]+/$#', $p)) $urls[] = $b . $p;
  echo '<?xml version="1.0" encoding="UTF-8"?>' . "\n" . '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">';
  foreach ($urls as $u) echo '<url><loc>' . htmlspecialchars($u, ENT_XML1) . '</loc><changefreq>weekly</changefreq></url>';
  echo '</urlset>'; exit;
}
case 'robots': {
  header('Content-Type: text/plain; charset=utf-8'); header('Cache-Control: public, max-age=86400');
  echo "User-agent: *\nAllow: /\nDisallow: /api/\nDisallow: /dados/\nDisallow: /uploads/\n\nSitemap: " . baseUrl() . "sitemap.xml\n"; exit;
}
default: erro('Ação desconhecida.', 404);
}
} catch (Throwable $e) {
  error_log('[coracaobr] ' . $e->getMessage());
  erro('Erro no servidor. Tente de novo em instantes.', 500);
}

/* ---------- regras de acesso ---------- */
function podeLer(string $col, string $id): bool {
  if (master() || in_array($col, PUBLICAS, true)) return true;
  $u = eu();
  return $u && $id === $u['id'];          // avisos, interesse, perfis: só o próprio documento
}
function podeGravar(string $col, string $id): bool {
  if (master()) return true;
  if (in_array($col, SO_MASTER, true)) return false;
  $u = eu();
  if (!$u) return $col === 'metricas' && $id === $_SESSION['visitante'];   // visitante sem conta só conta visualizações
  if (!in_array($col, POR_PESSOA, true) || $id !== $u['id']) return false;  // cada pessoa grava só o próprio documento
  if (in_array($col, ['posts', 'classificados'], true) && !temPlano($u['id'])) return false;   // feed e mural: só com pacote em vigor (rascunho de anúncio qualquer conta pode montar)
  return true;
}
function listaDocs(string $col, ?array $u): array {
  $pdo = banco();
  if (master() || in_array($col, PUBLICAS, true)) {
    $st = $pdo->prepare('SELECT id, data FROM docs WHERE col = ? LIMIT 3000'); $st->execute([$col]);
  } elseif ($u) {
    $st = $pdo->prepare('SELECT id, data FROM docs WHERE col = ? AND id = ?'); $st->execute([$col, $u['id']]);
  } else return [];
  $out = [];
  foreach ($st as $r) $out[] = ['id' => $r['id'], 'data' => json_decode($r['data'], true)];
  return $out;
}
function apagaUsuario(string $id): void {
  global $CFG;
  $pdo = banco();
  $pdo->beginTransaction();
  foreach (POR_PESSOA as $c) { $pdo->prepare('DELETE FROM docs WHERE col = ? AND id = ?')->execute([$c, $id]); versao($c); }
  $st = $pdo->prepare('SELECT id FROM fotos WHERE dono = ?'); $st->execute([$id]);
  foreach ($st->fetchAll(PDO::FETCH_COLUMN) as $f) @unlink($CFG['uploads'] . '/' . $f . '.jpg');
  $pdo->prepare('DELETE FROM fotos WHERE dono = ?')->execute([$id]);
  $pdo->prepare('DELETE FROM usuarios WHERE id = ?')->execute([$id]);
  $pdo->commit();
}

/* ---------- newsletter: montagem e envio ---------- */
function configDoc(string $id): array {
  $st = banco()->prepare("SELECT data FROM docs WHERE col = 'config' AND id = ?"); $st->execute([$id]);
  $d = json_decode((string)$st->fetchColumn(), true);
  return is_array($d) ? $d : [];
}
function montaNewsletter(): array {
  $cfg = configDoc('newsletter'); $dias = max(3, min(30, (int)($cfg['dias'] ?? 10)));
  $hoje = (new DateTime('now', new DateTimeZone('America/Chicago')))->format('Y-m-d');
  $ate = (new DateTime('now', new DateTimeZone('America/Chicago')))->modify("+$dias days")->format('Y-m-d');
  $eventos = []; $por = [];
  foreach (banco()->query("SELECT id, data FROM docs WHERE col = 'lugares'") as $r) {
    $l = json_decode($r['data'], true); if (!is_array($l) || ($l['publicado'] ?? true) === false || !empty($l['demo'])) continue;
    $l['id'] = $r['id']; $por[$r['id']] = $l;
    if (($l['categoria'] ?? '') !== 'evento' && ($l['categoria'] ?? '') !== 'show') continue;
    if (!empty($l['cancelado'])) continue;
    $datas = [];
    foreach (($l['sessoes'] ?? []) as $s) if (!empty($s['d'])) $datas[] = $s['d'];
    if (!$datas && !empty($l['dataInicio'])) { $ini = max($l['dataInicio'], $hoje); $fim = $l['dataFim'] ?? $l['dataInicio']; if ($ini <= $fim) $datas[] = $ini; }
    $prox = null; foreach ($datas as $dt) if ($dt >= $hoje && $dt <= $ate && ($prox === null || $dt < $prox)) $prox = $dt;
    if ($prox) { $l['_d'] = $prox; $eventos[] = $l; }
  }
  usort($eventos, fn($a, $b) => strcmp($a['_d'], $b['_d']));
  $eventos = array_slice($eventos, 0, max(1, min(15, (int)($cfg['maxEventos'] ?? 8))));
  $dest = []; foreach (($cfg['destaques'] ?? []) as $id) if (isset($por[$id])) $dest[] = $por[$id];
  $base = baseUrl(); $e = fn($t) => htmlspecialchars((string)$t, ENT_QUOTES, 'UTF-8');
  $cartao = function ($l, $quando) use ($base, $e) {
    $foto = ''; $f = $l['fotos'][0]['src'] ?? '';
    if ($f && preg_match('#^(img|fotos_eventos|fotos_cidades)/#', $f)) $foto = $base . $f; elseif (preg_match('#^asset:([a-f0-9]{32})$#', $f, $m)) $foto = $base . 'uploads/' . $m[1] . '.jpg';
    $preco = !empty($l['gratuito']) ? 'Grátis' : (!empty($l['precoMin']) ? 'A partir de US$ ' . $e($l['precoMin']) : '');
    return '<tr><td style="padding:10px 0;border-bottom:1px solid #E4E9E3">' . ($foto ? '<img src="' . $e($foto) . '" alt="" width="96" height="72" style="float:left;width:96px;height:72px;object-fit:cover;border-radius:10px;margin-right:12px">' : '') .
      '<a href="' . $e($base . '#lugar-' . $l['id']) . '" style="color:#024E25;font-weight:700;text-decoration:none;font-size:16px">' . $e($l['nome'] ?? '') . '</a><br><span style="color:#5F6B64;font-size:13px">' . $e($quando) . ($preco ? ' · ' . $e($preco) : '') . ' · ' . $e($l['cidade'] ?? '') . '</span></td></tr>';
  };
  $html = '';
  if (!empty($cfg['intro'])) $html .= '<p style="font-size:15px;line-height:1.55">' . nl2br($e($cfg['intro'])) . '</p>';
  if ($eventos) { $html .= '<h2 style="font-size:18px;color:#142019;margin:22px 0 4px">Próximos eventos</h2><table width="100%" cellpadding="0" cellspacing="0">'; foreach ($eventos as $l) { $dt = DateTime::createFromFormat('Y-m-d', $l['_d']); $html .= $cartao($l, $dt ? $dt->format('d/m') : ''); } $html .= '</table>'; }
  $cup = array_slice(array_values(array_filter($por, fn($l) => !empty($l['cupom']) && !in_array($l['categoria'] ?? '', ['evento', 'show'], true))), 0, 6);
  if ($cup) { $html .= '<h2 style="font-size:18px;color:#142019;margin:22px 0 4px">Cupons da semana</h2><table width="100%" cellpadding="0" cellspacing="0">'; foreach ($cup as $l) $html .= $cartao($l, '🎟 ' . mb_substr((string)$l['cupom'], 0, 70)); $html .= '</table>'; }
  if ($dest) { $html .= '<h2 style="font-size:18px;color:#142019;margin:22px 0 4px">' . $e($cfg['tituloDestaques'] ?? 'Vale a visita') . '</h2><table width="100%" cellpadding="0" cellspacing="0">'; foreach ($dest as $l) $html .= $cartao($l, $l['bairro'] ?? ($l['categoria'] ?? '')); $html .= '</table>'; }
  return ['assunto' => ($cfg['assunto'] ?? '') ?: 'A semana na CoraçãoBR', 'html' => $html, 'itens' => count($eventos) + count($dest) + count($cup)];
}
function moldura(string $miolo, string $token): string {
  $base = baseUrl(); $sair = $base . 'api/?acao=newsletter_sair&t=' . $token;
  return '<!doctype html><html><body style="margin:0;background:#EEF1EC"><div style="max-width:600px;margin:0 auto;padding:24px 18px;font-family:Arial,Helvetica,sans-serif;color:#142019">' .
    '<div style="font:700 22px Arial;color:#024E25">Coração<span style="color:#E3A600">BR</span></div>' .
    '<div style="background:#fff;border-radius:16px;padding:20px 22px;margin-top:14px">' . $miolo . '<p style="margin-top:22px"><a href="' . htmlspecialchars($base) . '" style="background:#024E25;color:#fff;padding:12px 18px;border-radius:12px;text-decoration:none;font-weight:700">Abrir o guia</a></p></div>' .
    '<p style="font-size:12px;color:#5F6B64;margin-top:16px">Você recebe este e-mail porque se inscreveu na CoraçãoBR. <a href="' . htmlspecialchars($sair) . '" style="color:#5F6B64">Sair da lista</a>.</p></div></body></html>';
}
/* E-mail oficial da CoraçãoBR (config.php ou o padrão acima). */
/* Todo recebimento cai no Pix do e-mail oficial (conta Mercado Pago); a chave CNPJ antiga é trocada sozinha */
function chavePix(?string $k): string { $k = trim((string)$k); return ($k === '' || preg_replace('/\D/', '', $k) === '32021268000104') ? 'coracaobr.oficial@gmail.com' : $k; }
/* SAC: atendimento por e-mail e WhatsApp, assinado em todo e-mail para clientes */
function sacZap(): string { $g = configDoc('geral'); $z = preg_replace('/\D/', '', (string)($g['whatsappAviso'] ?? '')); return $z !== '' ? $z : '5511983573266'; }
function sacAssinatura(): string {
  $z = sacZap(); $br = strlen($z) >= 12 && substr($z, 0, 2) === '55' ? '(' . substr($z, 2, 2) . ') ' . substr($z, 4, strlen($z) - 8) . '-' . substr($z, -4) : '+' . $z;
  return "\n\nEquipe CoraçãoBR\n\nSAC CoraçãoBR (atendimento)\nE-mail: " . emailOficial() . "\nWhatsApp: $br · https://wa.me/$z";
}
function emailOficial(): string {
  global $CFG; $e = trim((string)($CFG['email_oficial'] ?? ''));
  return filter_var($e, FILTER_VALIDATE_EMAIL) ? $e : 'coracaobr.oficial@gmail.com';
}
/* Avisa a equipe por e-mail sobre algo importante (no máximo 60 por hora, para não lotar a caixa). */
function avisaEquipe(string $assunto, string $texto): void {
  global $CFG;
  if (!limite('mail-equipe', 60, 3600)) return; marca('mail-equipe');
  $host = preg_replace('/[^a-z0-9.-]/i', '', (string)($_SERVER['HTTP_HOST'] ?? 'localhost'));
  $de = $CFG['email_remetente'] ?: 'nao-responda@' . preg_replace('/^www\./', '', $host);
  $txt = $texto . "\n\n— Aviso automático do site " . baseUrl() . "\nAbra o painel master para ver e responder: " . baseUrl() . "#painel";
  @mail(emailOficial(), '=?UTF-8?B?' . base64_encode('CoraçãoBR: ' . $assunto) . '?=', $txt, "From: CoraçãoBR <$de>\r\nContent-Type: text/plain; charset=UTF-8\r\n");
}
function envia(string $para, string $assunto, string $miolo, string $token): bool {
  global $CFG;
  $host = preg_replace('/[^a-z0-9.-]/i', '', (string)($_SERVER['HTTP_HOST'] ?? 'localhost'));
  $de = $CFG['email_remetente'] ?: 'nao-responda@' . preg_replace('/^www\./', '', $host);
  $html = moldura($miolo, $token);
  $txt = trim(html_entity_decode(strip_tags(str_replace(['<br>', '</tr>', '</p>', '</h2>'], "\n", $miolo)), ENT_QUOTES, 'UTF-8')) . "\n\nSair da lista: " . baseUrl() . 'api/?acao=newsletter_sair&t=' . $token;
  $b = 'cbr' . bin2hex(random_bytes(8));
  $h = "From: CoraçãoBR <$de>\r\nReply-To: " . emailOficial() . "\r\nMIME-Version: 1.0\r\nContent-Type: multipart/alternative; boundary=\"$b\"\r\nList-Unsubscribe: <" . baseUrl() . 'api/?acao=newsletter_sair&t=' . $token . ">\r\n";
  $corpo = "--$b\r\nContent-Type: text/plain; charset=UTF-8\r\n\r\n$txt\r\n--$b\r\nContent-Type: text/html; charset=UTF-8\r\n\r\n$html\r\n--$b--";
  return @mail($para, '=?UTF-8?B?' . base64_encode($assunto) . '?=', $corpo, $h);
}

/* ---------- assistente: chave, modelo e busca dos lugares que combinam com a pergunta ---------- */
function chaveIA(): string { global $CFG; $k = trim((string)($CFG['anthropic_key'] ?? '')); if ($k === '') $k = trim((string)@file_get_contents(dirname($CFG['db']) . '/ANTHROPIC.key')); return $k; }
function modeloIA(): string { global $CFG; $m = trim((string)@file_get_contents(dirname($CFG['db']) . '/ANTHROPIC.modelo')); return in_array($m, ['claude-opus-5-5', 'claude-sonnet-5-5', 'claude-haiku-5-5'], true) ? $m : 'claude-opus-5-5'; }
function semAcento(string $t): string { $t = mb_strtolower($t); $t = strtr($t, ['á'=>'a','à'=>'a','â'=>'a','ã'=>'a','ä'=>'a','é'=>'e','ê'=>'e','è'=>'e','í'=>'i','ì'=>'i','ó'=>'o','ô'=>'o','õ'=>'o','ò'=>'o','ú'=>'u','ù'=>'u','ü'=>'u','ç'=>'c','ñ'=>'n']); return $t; }
function buscaLugares(string $perg, int $max = 30, string $reg = 'dfw'): array {
  $SIN = ['comer' => ['restaurante','comida','churrasc','lanchonete','padaria','acai','pizza'], 'comida' => ['restaurante','churrasc','lanchonete','padaria'], 'churrasco' => ['churrasc','steakhouse','rodizio'],
    'mercado' => ['mercado','market','loja','emporio'], 'igreja' => ['igreja','culto','missa','church'], 'medico' => ['medic','clinica','saude','dentista','doctor'], 'dentista' => ['dentista','odonto','dental'],
    'advogado' => ['advoga','imigra','lawyer','attorney'], 'contador' => ['contab','contador','tax','imposto'], 'show' => ['show','evento','festa','balada'], 'festa' => ['festa','evento','show'], 'evento' => ['evento','show','festa'],
    'cabelo' => ['salao','cabelo','barbearia','beleza'], 'unha' => ['salao','manicure','beleza'], 'crianca' => ['crianca','kids','infantil','parque','familia'], 'cafe' => ['cafe','padaria','coffee'], 'pao' => ['padaria','pao'],
    'carro' => ['auto','mecanic','carro','oficina'], 'casa' => ['imobil','corretor','aluguel','casa'], 'futebol' => ['futebol','soccer','esporte'], 'passeio' => ['parque','museu','passeio','atracao','turismo']];
  $STOP = ['onde','qual','quais','como','para','pra','com','que','uma','um','uns','umas','tem','tenho','quero','perto','aqui','dallas','texas','de','do','da','dos','das','no','na','nos','nas','em','e','o','a','os','as','me','eu','voce','algum','alguma','bom','boa','melhor','melhores','hoje','fim','semana'];
  $q = semAcento($perg); $toks = [];
  foreach (preg_split('/[^a-z0-9]+/', $q) as $t) { if (strlen($t) < 3 || in_array($t, $STOP, true)) continue; $toks[] = $t; foreach ($SIN as $k => $vs) if (strpos($t, $k) === 0) $toks = array_merge($toks, $vs); }
  $toks = array_values(array_unique($toks)); $hoje = hojeDallas(); $fds = preg_match('/fim de semana|sabado|domingo|hoje|amanha|semana/', $q);
  $out = [];
  foreach (banco()->query("SELECT id, data FROM docs WHERE col = 'lugares'") as $r) {
    $l = json_decode($r['data'], true); if (!is_array($l) || ($l['publicado'] ?? true) === false || !empty($l['demo']) || !empty($l['cancelado'])) continue;
    if (($l['regiaoGuia'] ?? 'dfw') !== $reg) continue;
    $evento = in_array($l['categoria'] ?? '', ['evento', 'show'], true);
    if ($evento && ($l['dataFim'] ?? $l['dataInicio'] ?? '9999') < $hoje) continue;
    $l['id'] = $r['id'];
    $txt = semAcento(implode(' ', [$l['nome'] ?? '', $l['categoria'] ?? '', $l['subcategoria'] ?? '', $l['bairro'] ?? '', $l['cidade'] ?? '', implode(' ', (array)($l['tags'] ?? [])), mb_substr((string)($l['descricao'] ?? ''), 0, 400)]));
    $nome = semAcento((string)($l['nome'] ?? '')); $sc = 0;
    foreach ($toks as $t) { if (strpos($nome, $t) !== false) $sc += 5; elseif (strpos($txt, $t) !== false) $sc += 2; }
    if ($fds && $evento) $sc += 3;
    if (!$sc && $toks) continue;
    $sc += min(2, (float)($l['nota'] ?? 0) / 2.5);
    $l['_sc'] = $sc; $out[] = $l;
  }
  usort($out, fn($a, $b) => $b['_sc'] <=> $a['_sc']);
  return array_slice($out, 0, $max);
}

/* ---------- Web Push: chave VAPID (gerada no 1º uso, fica só no servidor) e envio ---------- */
function b64u(string $b): string { return rtrim(strtr(base64_encode($b), '+/', '-_'), '='); }
function vapid(): array {
  global $CFG; banco(); $f = dirname($CFG['db']) . '/VAPID.pem';
  if (!is_file($f)) {
    $k = openssl_pkey_new(['curve_name' => 'prime256v1', 'private_key_type' => OPENSSL_KEYTYPE_EC]);
    if (!$k) throw new RuntimeException('OpenSSL sem suporte a curvas elípticas.');
    openssl_pkey_export($k, $pem); if (!@file_put_contents($f, $pem)) throw new RuntimeException('Não foi possível gravar a chave VAPID.'); @chmod($f, 0600);
  }
  $pk = openssl_pkey_get_private((string)file_get_contents($f)); $d = openssl_pkey_get_details($pk);
  $x = str_pad($d['ec']['x'], 32, "\0", STR_PAD_LEFT); $y = str_pad($d['ec']['y'], 32, "\0", STR_PAD_LEFT);
  return ['key' => $pk, 'pub' => b64u("\x04" . $x . $y)];
}
function jwtVapid(string $aud, $key): string {
  $h = b64u(json_encode(['typ' => 'JWT', 'alg' => 'ES256'])); $p = b64u(json_encode(['aud' => $aud, 'exp' => time() + 12 * 3600, 'sub' => 'mailto:' . emailOficial()]));
  openssl_sign("$h.$p", $der, $key, OPENSSL_ALGO_SHA256);
  /* assinatura DER (SEQUENCE de dois INTEGER) → 64 bytes r||s */
  $o = 3; $o += (ord($der[1]) & 0x80) ? (ord($der[1]) & 0x7f) : 0; $rl = ord($der[$o]); $r = substr($der, $o + 1, $rl); $o += 1 + $rl + 1; $sl = ord($der[$o]); $s = substr($der, $o + 1, $sl);
  $r = str_pad(ltrim($r, "\0"), 32, "\0", STR_PAD_LEFT); $s = str_pad(ltrim($s, "\0"), 32, "\0", STR_PAD_LEFT);
  return "$h.$p." . b64u($r . $s);
}
function enviaPush(string $titulo, string $texto, string $url, string $tema = '', ?callable $porSub = null): array {
  $pdo = banco(); $pdo->prepare("INSERT OR REPLACE INTO meta (k, v) VALUES ('push-ultima', ?)")->execute([json_encode(['titulo' => $titulo, 'texto' => $texto, 'url' => $url, 'em' => gmdate('c')], JSON_UNESCAPED_UNICODE)]);
  $v = vapid(); $env = 0; $fal = 0; $jwts = [];
  foreach ($pdo->query("SELECT id, data FROM docs WHERE col = 'push' LIMIT 5000")->fetchAll() as $row) {
    $s = json_decode($row['data'], true); $ep = (string)($s['endpoint'] ?? ''); if ($ep === '') continue;
    if ($tema !== '' && !empty($s['temas']) && !in_array($tema, (array)$s['temas'], true)) continue;
    if ($porSub) {   // mensagem própria de cada aparelho (ex.: o que fica perto do CEP da pessoa); null = não envia para este
      $m = $porSub($s); if (!$m) continue;
      $s['ult'] = ['titulo' => $m[0], 'texto' => $m[1], 'url' => $m[2], 'em' => gmdate('c')];
      $pdo->prepare("UPDATE docs SET data = ? WHERE col = 'push' AND id = ?")->execute([json_encode($s, JSON_UNESCAPED_UNICODE), $row['id']]);
    }
    $pu = parse_url($ep); $aud = $pu['scheme'] . '://' . $pu['host'] . (isset($pu['port']) ? ':' . $pu['port'] : '');
    $jwts[$aud] = $jwts[$aud] ?? jwtVapid($aud, $v['key']);
    $ctx = stream_context_create(['http' => ['method' => 'POST', 'header' => "Authorization: vapid t={$jwts[$aud]}, k={$v['pub']}\r\nTTL: 86400\r\nUrgency: normal\r\nContent-Length: 0", 'content' => '', 'timeout' => 10, 'ignore_errors' => true]]);
    @file_get_contents($ep, false, $ctx); $st = 0; if (!empty($http_response_header[0]) && preg_match('/\s(\d{3})\s?/', $http_response_header[0], $m)) $st = (int)$m[1];
    if ($st >= 200 && $st < 300) $env++; else { $fal++; if ($st === 404 || $st === 410) $pdo->prepare("DELETE FROM docs WHERE col = 'push' AND id = ?")->execute([$row['id']]); }
  }
  return ['enviados' => $env, 'falhas' => $fal];
}

/* ---------- região do usuário (CEP) ---------- */
function kmEntre(float $a1, float $o1, float $a2, float $o2): float { $r = M_PI / 180; $h = sin(($a2 - $a1) * $r / 2) ** 2 + cos($a1 * $r) * cos($a2 * $r) * sin(($o2 - $o1) * $r / 2) ** 2; return 12742 * asin(min(1, sqrt($h))); }
function regiaoDoUsuario(string $uid): ?array { static $c = []; if (array_key_exists($uid, $c)) return $c[$uid]; $st = banco()->prepare('SELECT zip_lat, zip_lng, zip_cidade FROM usuarios WHERE id = ?'); $st->execute([$uid]); $r = $st->fetch(); return $c[$uid] = ($r && $r['zip_lat'] !== null) ? ['lat' => (float)$r['zip_lat'], 'lng' => (float)$r['zip_lng'], 'cidade' => (string)$r['zip_cidade']] : null; }

/* ---------- newsletter semanal automática (usada pelo cron da newsletter e pela rotina diária) ---------- */
function newsletterAuto(bool $forcarLigada = false): array {
  $cfg = configDoc('newsletter');
  if (($cfg['automatica'] ?? true) === false && !$forcarLigada) return ['msg' => 'Envio automático desligado no painel.'];
  $ult = banco()->query("SELECT v FROM meta WHERE k = 'news-auto'")->fetchColumn();
  if ($ult && time() - (int)$ult < 6 * 86400) return ['msg' => 'Já enviado nesta semana.'];
  @set_time_limit(600);
  $d = montaNewsletter();
  if (!$d['itens']) return ['msg' => 'Nada para enviar.'];
  $env = 0; $fal = 0;
  foreach (banco()->query('SELECT email, token FROM assinantes WHERE ativo = 1 LIMIT 2000')->fetchAll() as $a) { if (envia($a['email'], $d['assunto'], $d['html'], $a['token'])) $env++; else $fal++; }
  banco()->prepare("INSERT OR REPLACE INTO meta (k, v) VALUES ('news-auto', ?)")->execute([(string)time()]);
  banco()->prepare('INSERT INTO envios (assunto, modo, enviados, falhas, em) VALUES (?, ?, ?, ?, ?)')->execute([$d['assunto'], 'automático', $env, $fal, agora()]);
  return ['enviados' => $env, 'falhas' => $fal];
}
