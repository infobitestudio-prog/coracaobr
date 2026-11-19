#!/usr/bin/env python3
"""Fotos ilustrativas por categoria: uma consulta em lote na Wikipédia para todos os títulos de ILUSTRA,
baixa as imagens e aplica aos lugares sem foto (ou com ilustrativa sem crédito conhecido)."""
import json, sys, time
from pathlib import Path
sys.path.insert(0, str(Path(__file__).resolve().parent))
import build_seed2 as B

ROOT = B.ROOT
seed = json.loads((ROOT / "data" / "seed.json").read_text())
L = seed["lugares"]
cats = sorted({l["categoria"] for l in L if not l.get("fotos") or l["fotos"][0].get("ilustrativa")})
mapa = {c: B.ILUSTRA.get(c, "Dallas") for c in cats}
achados = B.fotos_por_titulo(mapa)
print(len(achados), "de", len(cats), "categorias com foto", flush=True)
ok = {}
for c, r in achados.items():
    dest = ROOT / "img" / f"ilustra-{c}.jpg"
    if dest.exists():
        dest.unlink()
    if B.baixa(r["url"], dest):
        ok[c] = r
n = 0
for l in L:
    c = l["categoria"]
    if c in ok and (not l.get("fotos") or l["fotos"][0].get("ilustrativa")):
        r = ok[c]
        l["fotos"] = [{"src": f"img/ilustra-{c}.jpg", "credito": r["autor"], "licenca": r["licenca"], "pagina": r["pagina"], "ilustrativa": True}]
        n += 1
seed["versao"] = f"{B.HOJE}-{len(L)}-{int(time.time())}"
(ROOT / "data" / "seed.json").write_text(json.dumps(seed, ensure_ascii=False, indent=1))
sem = [l["id"] for l in L if not l.get("fotos")]
print(n, "lugares com ilustrativa aplicada;", len(sem), "ainda sem foto", flush=True)
