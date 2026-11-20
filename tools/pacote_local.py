#!/usr/bin/env python3
"""Monta dist/coracaobr: versão completa para abrir direto no computador (duplo clique no index.html)
ou subir em qualquer hospedagem. O index.html ganha o cabeçalho HTML completo que a publicação no claude.ai acrescenta sozinha."""
import json, shutil, zipfile
from pathlib import Path
ROOT = Path(__file__).resolve().parent.parent
OUT = ROOT / "dist" / "coracaobr"
if OUT.exists():
    shutil.rmtree(OUT)
(OUT / "js").mkdir(parents=True); (OUT / "data").mkdir(); (OUT / "img").mkdir()
corpo = (ROOT / "index.html").read_text()
head = ('<!doctype html><html lang="pt-BR"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1,viewport-fit=cover">'
        '<style>:root{color-scheme:light;padding-top:env(safe-area-inset-top,0px);padding-bottom:env(safe-area-inset-bottom,0px)}body{margin:0;font:14px system-ui}img{max-width:100%}[hidden]{display:none!important}</style></head><body>')
import re, time
VER = time.strftime("%Y%m%d%H%M")
# Carimbo de versão: força o navegador a baixar os arquivos novos a cada atualização (a Hostinger guarda .js por 7 dias)
corpo = re.sub(r'src="(js/[\w-]+\.js)"', lambda m: 'src="' + m.group(1) + '?v=' + VER + '"', corpo)
(OUT / "index.html").write_text(head + corpo + "</body></html>")
for f in (ROOT / "js").glob("*.js"):
    shutil.copy(f, OUT / "js" / f.name)
for f in ("seed.json", "seed.js", "fotos-site.json"):
    shutil.copy(ROOT / "data" / f, OUT / "data" / f)
L = json.loads((ROOT / "data" / "seed.json").read_text())["lugares"]
for src in {ft["src"] for l in L for ft in l.get("fotos", [])}:
    (OUT / src).parent.mkdir(parents=True, exist_ok=True); shutil.copy(ROOT / src, OUT / src)
shutil.copytree(ROOT / "img" / "hero", OUT / "img" / "hero")
shutil.copytree(ROOT / "img" / "patrocinadores", OUT / "img" / "patrocinadores")
for f in ("manifest.webmanifest", "sw.js", "icon-192.png", "icon-512.png"):
    shutil.copy(ROOT / f, OUT / f)
# servidor próprio: API em PHP, configuração inicial e regras da hospedagem
(OUT / "api").mkdir()
for f in ("index.php", "config.exemplo.php", "metro_gtfs.php", "composer.json"):
    shutil.copy(ROOT / "api" / f, OUT / "api" / f)
# biblioteca oficial da Anthropic (assistente com IA): instale com "composer install --no-dev" dentro de api/ antes de empacotar
if (ROOT / "api" / "vendor" / "autoload.php").exists():
    shutil.copytree(ROOT / "api" / "vendor", OUT / "api" / "vendor", ignore=shutil.ignore_patterns(".git", "tests", "docs", ".github", "*.md", "examples"))
    (OUT / "api" / "vendor" / ".htaccess").write_text("Require all denied\nDeny from all\n")
else:
    print("AVISO: api/vendor ausente; o assistente vai usar só a busca do guia. Rode: cd api && composer install --no-dev")
# páginas para o Google (categoria × cidade) + índice usado pelo sitemap.xml
import sys; sys.path.insert(0, str(ROOT / "tools")); import seo
print("SEO:", len(seo.gerar(OUT, L, time.strftime("%Y-%m-%d"))), "páginas")
shutil.copy(ROOT / "data" / "config-inicial.json", OUT / "data" / "config-inicial.json")
shutil.copy(ROOT / "data" / "metro.json", OUT / "data" / "metro.json")
shutil.copy(ROOT / ".htaccess.site", OUT / ".htaccess")
shutil.copy(ROOT / "INSTALAR.txt", OUT / "INSTALAR.txt")
(OUT / "vendor").mkdir()
for f in ("leaflet.js", "leaflet.css"):
    shutil.copy(ROOT / "vendor" / f, OUT / "vendor" / f)
# sistemas à parte, servidos pelo mesmo site: estúdio de artes (/estudio/) e apresentação (/apresentacao/)
for pasta in ("estudio", "apresentacao"):
    if (ROOT / pasta).exists():
        shutil.copytree(ROOT / pasta, OUT / pasta)
import sys as _sys
if "--zip" not in _sys.argv:
    print(OUT, "(sem zip; use --zip para gerar o pacote)"); raise SystemExit(0)
z = ROOT / "dist" / "coracaobr.zip"
with zipfile.ZipFile(z, "w", zipfile.ZIP_DEFLATED) as zz:
    for f in OUT.rglob("*"):
        zz.write(f, f.relative_to(OUT.parent))
print(z, round(z.stat().st_size / 1e6, 1), "MB")
