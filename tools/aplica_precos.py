#!/usr/bin/env python3
"""Aplica em data/seed.json (e data/seed.js) os preços conferidos nos sites oficiais.
Entrada: arquivos JSON (uma lista por arquivo) com, para cada lugar, id, precoMin, precoMedio, precoMax, base, resumo,
fonte, fonteTipo, conferidoEm, gratuito, fechado/encerrado. Só grava valores que vieram com fonte; nunca inventa.
Uso: python3 tools/aplica_precos.py pasta/out-*.json"""
import json, sys, time
from pathlib import Path
ROOT = Path(__file__).resolve().parent.parent
SEED = ROOT / "data" / "seed.json"

def num(v):
    try:
        v = float(v)
        return round(v, 2) if v > 0 else None
    except (TypeError, ValueError):
        return None

def main(arqs):
    seed = json.loads(SEED.read_text())
    por = {l["id"]: l for l in seed["lugares"]}
    n = {"preco": 0, "fechado": 0, "gratis": 0, "ignorado": 0}
    for a in arqs:
        for r in json.loads(Path(a).read_text()):
            l = por.get(r.get("id"))
            if not l or l.get("anunciante"):
                continue
            if r.get("fechado"):
                l["fechado"] = True; l["publicado"] = False; l["precoConferidoEm"] = r.get("conferidoEm") or "2026-11"; n["fechado"] += 1
                continue
            if r.get("gratuito") is True and l.get("tipo") != "estabelecimento" and r.get("fonte"):
                l.update(gratuito=True, precoMin=0, preco=r.get("resumo") or "Gratuito", precoConfirmado=True, fontePreco=r["fonte"], precoConferidoEm=r.get("conferidoEm") or "2026-11")
                for k in ("precoMedio", "precoMax"): l.pop(k, None)
                n["gratis"] += 1
                continue
            mn, md, mx = num(r.get("precoMin")), num(r.get("precoMedio")), num(r.get("precoMax"))
            if not mn or not str(r.get("fonte") or "").startswith("http"):
                # sem um "a partir de" fixo (preço varia por noite, grátis em parte do ano...): atualiza só o texto da tabela, com a fonte
                if l.get("tipo") != "estabelecimento" and r.get("resumo") and str(r.get("fonte") or "").startswith("http"):
                    l["preco"] = str(r["resumo"])[:240]; l["fontePreco"] = r["fonte"][:400]; l["precoConferidoEm"] = r.get("conferidoEm") or "2026-11"; l["precoConfirmado"] = True
                    n["texto"] = n.get("texto", 0) + 1
                else:
                    n["ignorado"] += 1
                continue
            if not md and mx and mx > mn and "rodízio" in str(r.get("base") or "").lower() + str(r.get("base") or "").lower().replace("churrasco completo", "rodízio"):
                md = round((mn + mx) / 2)   # churrascaria: média entre o rodízio do almoço e o do jantar
            if mx and mx < mn: mx = None
            if md and (md < mn or (mx and md > mx)): md = None
            l["precoMin"] = mn
            if md: l["precoMedio"] = round(md)
            else: l.pop("precoMedio", None)
            if mx: l["precoMax"] = mx
            else: l.pop("precoMax", None)
            l["precoBase"] = str(r.get("base") or "")[:60]
            l["fontePreco"] = r["fonte"][:400]
            l["fontePrecoTipo"] = "terceiros" if r.get("fonteTipo") == "terceiros" else "oficial"
            l["precoConferidoEm"] = r.get("conferidoEm") or "2026-11"
            if l.get("tipo") != "estabelecimento":
                l["gratuito"] = False; l["precoConfirmado"] = True
                if r.get("resumo"): l["preco"] = str(r["resumo"])[:240]
            n["preco"] += 1
    seed["versao"] = "2026-11-coracaobr-%d" % int(time.time())
    SEED.write_text(json.dumps(seed, ensure_ascii=False, indent=1))
    js = ROOT / "data" / "seed.js"
    if js.exists():
        js.write_text("window.SEED = " + json.dumps(seed, ensure_ascii=False) + ";\n")
    print(n, "versao", seed["versao"])

if __name__ == "__main__":
    main(sys.argv[1:])
