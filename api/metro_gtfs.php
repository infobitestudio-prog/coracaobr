<?php
/* Monta o arquivo do metrô e trens de DFW (metro.json) a partir dos dados oficiais GTFS de cada empresa.
   Usado na linha de comando (php metro_gtfs.php <pasta-gtfs> <saida.json>) e pelo servidor na atualização semanal. */

const METRO_FONTES = [
  'dart'    => ['url' => 'https://www.dart.org/transitdata/latest/google_transit.zip', 'nome' => 'DART', 'rotas' => ['RED','BLUE','GREEN','ORANGE','SILVER','TRE']],
  'trinity' => ['url' => 'https://gtfsdata.ridetm.org/gtfs/fwtatransitdata.zip', 'nome' => 'Trinity Metro', 'rotas' => ['TEXRail']],
  'dcta'    => ['url' => 'https://gtfs.remix.com/dcta_denton_tx_us.zip', 'nome' => 'DCTA', 'rotas' => ['A-train']],
];
const METRO_NOMES = ['RED' => 'Linha Vermelha', 'BLUE' => 'Linha Azul', 'GREEN' => 'Linha Verde', 'ORANGE' => 'Linha Laranja', 'SILVER' => 'Silver Line', 'TRE' => 'TRE · Trinity Railway Express', 'TEXRail' => 'TEXRail', 'A-train' => 'A-train'];
const METRO_CORES = ['TEXRail' => 'C8102E', 'SILVER' => '8C9196'];

function m_csv(string $arq, callable $cada): void {
  if (!is_file($arq)) return;
  $f = fopen($arq, 'r'); $cab = fgetcsv($f);
  if (!$cab) { fclose($f); return; }
  $cab[0] = preg_replace('/^\xEF\xBB\xBF/', '', $cab[0]); $cab = array_map('trim', $cab);
  while (($l = fgetcsv($f)) !== false) { if (count($l) < count($cab)) $l = array_pad($l, count($cab), ''); $cada(array_combine($cab, array_slice($l, 0, count($cab)))); }
  fclose($f);
}
function m_min(string $t): int { $p = explode(':', trim($t)); return (int)$p[0] * 60 + (int)($p[1] ?? 0); }
function m_dist(float $a, float $b, float $c, float $d): float { $r = 6371000; $x = deg2rad($d - $b) * cos(deg2rad(($a + $c) / 2)); $y = deg2rad($c - $a); return sqrt($x * $x + $y * $y) * $r; }
function m_simplifica(array $p, float $tol): array {
  if (count($p) < 3) return $p;
  $max = 0; $i0 = 0; $a = $p[0]; $b = $p[count($p) - 1];
  for ($i = 1; $i < count($p) - 1; $i++) {
    $dx = $b[1] - $a[1]; $dy = $b[0] - $a[0]; $n = sqrt($dx * $dx + $dy * $dy) ?: 1e-9;
    $d = abs($dy * ($p[$i][1] - $a[1]) - $dx * ($p[$i][0] - $a[0])) / $n;
    if ($d > $max) { $max = $d; $i0 = $i; }
  }
  if ($max * 111000 < $tol) return [$a, $b];
  $l = m_simplifica(array_slice($p, 0, $i0 + 1), $tol); $r = m_simplifica(array_slice($p, $i0), $tol);
  return array_merge(array_slice($l, 0, -1), $r);
}
function m_nome(string $n): string {
  $n = preg_replace('/\s+(STATION|STA\.?|RAIL STATION|TRE STATION|- ?(NB|SB|EB|WB|PLATFORM.*)|PLATFORM.*|\(.*\))$/i', '', trim($n));
  $n = preg_replace('/\s+(STATION|STA)$/i', '', $n);
  $n = mb_convert_case(mb_strtolower($n), MB_CASE_TITLE, 'UTF-8');
  return strtr($n, [' Dfw ' => ' DFW ', 'Dfw ' => 'DFW ', ' Utd' => ' UTD', 'Dart ' => 'DART ', ' Ut ' => ' UT ', 'Ut Southwestern' => 'UT Southwestern', 'Smu' => 'SMU', 'Unt' => 'UNT', 'Lbj' => 'LBJ', 'Mlk' => 'MLK', 'Ih ' => 'IH ', ' Tre' => ' TRE', 'Mcarthur' => 'MacArthur', 'Mckinney' => 'McKinney', 'Downtown Ft Worth' => 'Downtown Fort Worth', 'Ft Worth' => 'Fort Worth', 'Ebj ' => 'EBJ ', 'Ddtc Rail' => 'Downtown Denton', 'Ddtc' => 'Downtown Denton', '8Th' => '8th', '12Th' => '12th', 'Ut Dallas' => 'UT Dallas', 'Va Medical' => 'VA Medical', 'Illinois Tc/Station' => 'Illinois', 'Medical/Market Ctr' => 'Medical/Market Center', 'T&p' => 'T&P', 'Tex' => 'TEX', ' Of ' => ' of ', ' And ' => ' and ', ' At ' => ' at ', ' / ' => ' / ']);
}

function construirMetro(string $pasta, string $saida): array {
  $linhas = []; $paradas = []; $fontes = [];
  foreach (METRO_FONTES as $sis => $F) {
    $d = "$pasta/$sis"; if (!is_file("$d/routes.txt")) continue;
    $info = []; m_csv("$d/feed_info.txt", function ($r) use (&$info) { $info = $r; });
    $fontes[] = ['sistema' => $F['nome'], 'versao' => $info['feed_version'] ?? '', 'valido' => ($info['feed_end_date'] ?? '')];
    $rotas = []; m_csv("$d/routes.txt", function ($r) use (&$rotas, $F) { $k = $r['route_short_name'] !== '' ? $r['route_short_name'] : $r['route_long_name']; if (in_array($k, $F['rotas'], true)) $rotas[$r['route_id']] = ['k' => $k, 'cor' => strtoupper($r['route_color'] ?: '444444')]; });
    /* serviços ativos na próxima quarta, sábado e domingo (calendar + exceções de calendar_dates) */
    $cal = []; m_csv("$d/calendar.txt", function ($r) use (&$cal) { $cal[] = $r; });
    $exc = []; m_csv("$d/calendar_dates.txt", function ($r) use (&$exc) { $exc[$r['date']][$r['service_id']] = $r['exception_type']; });
    $DN = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];
    $ativos = function (string $dt) use ($cal, $exc, $DN) {
      $w = $DN[(int)date('w', strtotime($dt))]; $ids = [];
      foreach ($cal as $c) if (($c[$w] ?? '0') === '1' && $c['start_date'] <= $dt && $c['end_date'] >= $dt) $ids[$c['service_id']] = 1;
      foreach ($exc[$dt] ?? [] as $sid => $t) { if ($t === '1') $ids[$sid] = 1; else unset($ids[$sid]); }
      return array_keys($ids);
    };
    $serv = ['u' => [], 's' => [], 'd' => []];
    for ($i = 1; $i <= 21; $i++) {
      $dt = date('Ymd', strtotime("+$i day")); $w = (int)date('w', strtotime($dt)); $k = $w === 0 ? 'd' : ($w === 6 ? 's' : ($w === 3 ? 'u' : ''));
      if ($k && !$serv[$k]) $serv[$k] = array_map('strval', $ativos($dt));
    }
    $viagens = []; m_csv("$d/trips.txt", function ($r) use (&$viagens, $rotas) { if (isset($rotas[$r['route_id']])) $viagens[$r['trip_id']] = ['r' => $r['route_id'], 's' => $r['service_id'], 'dir' => (int)($r['direction_id'] ?? 0), 'shape' => $r['shape_id'] ?? '', 'hs' => $r['trip_headsign'] ?? '']; });
    $pular = []; m_csv("$d/stops.txt", function ($r) use (&$pular) { if (preg_match('/YARD|POCKET|LIMIT|SIDING|INTERLOCK/i', $r['stop_name'])) $pular[$r['stop_id']] = 1; });
    $st = []; m_csv("$d/stop_times.txt", function ($r) use (&$st, $viagens, $pular) { if (isset($viagens[$r['trip_id']]) && !isset($pular[$r['stop_id']])) $st[$r['trip_id']][(int)$r['stop_sequence']] = [$r['stop_id'], m_min($r['departure_time'] ?: $r['arrival_time'])]; });
    $usadas = []; foreach ($st as &$s) { ksort($s); $s = array_values($s); foreach ($s as $x) $usadas[$x[0]] = 1; } unset($s);
    m_csv("$d/stops.txt", function ($r) use (&$paradas, $usadas, $sis) { if (isset($usadas[$r['stop_id']])) $paradas["$sis:" . $r['stop_id']] = ['nome' => m_nome($r['stop_name']), 'lat' => (float)$r['stop_lat'], 'lng' => (float)$r['stop_lon']]; });
    $shapesNec = []; $porRota = [];
    foreach ($st as $tid => $s) { $v = $viagens[$tid]; $porRota[$v['r']][$v['dir']][] = $tid; }
    foreach ($porRota as $rid => $dirs) foreach ($dirs as $dir => $tids) { $m = null; foreach ($tids as $t) if (!$m || count($st[$t]) > count($st[$m])) $m = $t; $shapesNec[$viagens[$m]['shape']] = 1; }
    $shapes = []; m_csv("$d/shapes.txt", function ($r) use (&$shapes, $shapesNec) { if (isset($shapesNec[$r['shape_id']])) $shapes[$r['shape_id']][(int)$r['shape_pt_sequence']] = [round((float)$r['shape_pt_lat'], 5), round((float)$r['shape_pt_lon'], 5)]; });
    foreach ($porRota as $rid => $dirs) {
      $k = $rotas[$rid]['k']; $L = ['id' => strtolower($k), 'nome' => METRO_NOMES[$k] ?? $k, 'sistema' => $F['nome'], 'cor' => '#' . (METRO_CORES[$k] ?? $rotas[$rid]['cor']), 'sentidos' => []];
      ksort($dirs);
      foreach ($dirs as $dir => $tids) {
        $m = null; foreach ($tids as $t) if (!$m || count($st[$t]) > count($st[$m])) $m = $t;
        $seq = array_map(fn($x) => "$sis:" . $x[0], $st[$m]); $t0 = $st[$m][0][1];
        $off = array_map(fn($x) => $x[1] - $t0, $st[$m]); $pos = array_flip($seq);
        $saidas = ['u' => [], 's' => [], 'd' => []];
        foreach ($tids as $t) {
          $s0 = $st[$t][0]; $id0 = "$sis:" . $s0[0]; if (!isset($pos[$id0])) continue;
          $orig = $s0[1] - $off[$pos[$id0]];
          foreach ($serv as $dk => $ids) if (in_array((string)$viagens[$t]['s'], $ids, true)) $saidas[$dk][] = $orig;
        }
        foreach ($saidas as &$x) { $x = array_values(array_unique($x)); sort($x); } unset($x);
        $sh = $shapes[$viagens[$m]['shape']] ?? []; ksort($sh);
        $L['sentidos'][] = ['para' => '', 'estacoes' => $seq, 'tempos' => $off, 'saidas' => $saidas, 'shape' => m_simplifica(array_values($sh), 12)];
      }
      $linhas[] = $L;
    }
  }
  // agrupa plataformas próximas (até 280 m) em uma estação, inclusive entre empresas diferentes (baldeação)
  $grupo = []; $est = []; $ids = array_keys($paradas);
  foreach ($ids as $pid) {
    $p = $paradas[$pid]; $achou = null;
    foreach ($est as $eid => $e) if (m_dist($p['lat'], $p['lng'], $e['lat'], $e['lng']) < 280) { $achou = $eid; break; }
    if ($achou === null) { $achou = 'e' . count($est); $est[$achou] = ['nomes' => [], 'lat' => $p['lat'], 'lng' => $p['lng'], 'n' => 0, 'linhas' => []]; }
    $e = &$est[$achou]; $e['nomes'][] = $p['nome']; $e['lat'] = ($e['lat'] * $e['n'] + $p['lat']) / ($e['n'] + 1); $e['lng'] = ($e['lng'] * $e['n'] + $p['lng']) / ($e['n'] + 1); $e['n']++; unset($e);
    $grupo[$pid] = $achou;
  }
  foreach ($linhas as &$L) {
    foreach ($L['sentidos'] as &$S) {
      $S['estacoes'] = array_map(fn($p) => $grupo[$p], $S['estacoes']);
      foreach ($S['estacoes'] as $eid) if (!in_array($L['id'], $est[$eid]['linhas'], true)) $est[$eid]['linhas'][] = $L['id'];
    } unset($S);
    foreach ($L['sentidos'] as &$S) { $S['para'] = $est[end($S['estacoes'])]['nomes'][0]; } unset($S);
  } unset($L);
  $saidaEst = [];
  foreach ($est as $eid => $e) {
    $cont = array_count_values($e['nomes']); arsort($cont); $nomes = array_keys($cont);
    usort($nomes, fn($a, $b) => ($cont[$b] <=> $cont[$a]) ?: (strlen($a) <=> strlen($b)));
    $saidaEst[$eid] = ['nome' => $nomes[0], 'lat' => round($e['lat'], 5), 'lng' => round($e['lng'], 5), 'linhas' => $e['linhas']];
  }
  foreach ($linhas as &$L) foreach ($L['sentidos'] as &$S) $S['para'] = $saidaEst[end($S['estacoes'])]['nome']; unset($L, $S);
  $out = ['atualizado' => date('c'), 'fontes' => $fontes, 'linhas' => $linhas, 'estacoes' => $saidaEst,
    'tarifas' => ['fonte' => 'GTFS DART (fare_attributes)', 'itens' => [['Passe local 3 horas (DART)', 3], ['Passe local diário (DART)', 6], ['Passe regional diário (DART + TRE + TEXRail + A-train)', 9], ['TRE, viagem simples', 6]]]];
  file_put_contents($saida, json_encode($out, JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES));
  return ['linhas' => count($linhas), 'estacoes' => count($saidaEst), 'bytes' => filesize($saida)];
}
/* baixa os zips oficiais e reconstrói (usado pela atualização semanal do servidor) */
function atualizarMetro(string $pastaDados, string $saida): array {
  $g = "$pastaDados/gtfs"; if (!is_dir($g)) mkdir($g, 0700, true);
  foreach (METRO_FONTES as $sis => $F) {
    $zip = "$g/$sis.zip"; $ctx = stream_context_create(['http' => ['timeout' => 120, 'user_agent' => 'CoracaoBR/1.0']]);
    $dados = @file_get_contents($F['url'], false, $ctx); if (!$dados || strlen($dados) < 10000) continue;
    file_put_contents($zip, $dados); $z = new ZipArchive();
    if ($z->open($zip) === true) { if (!is_dir("$g/$sis")) mkdir("$g/$sis", 0700); foreach (['agency', 'routes', 'trips', 'stop_times', 'stops', 'shapes', 'calendar', 'calendar_dates', 'feed_info'] as $n) { $c = $z->getFromName("$n.txt"); if ($c !== false) file_put_contents("$g/$sis/$n.txt", $c); } $z->close(); }
  }
  return construirMetro($g, $saida);
}
if (PHP_SAPI === 'cli' && isset($argv[2]) && realpath($argv[0]) === realpath(__FILE__)) { print_r(construirMetro($argv[1], $argv[2])); }
