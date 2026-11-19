#!/usr/bin/env python3
"""Prepara os lotes de escrita do banco do site a partir de data/seed.json.
Lugares novos: "set". Lugares que já estavam no banco e ganharam foto: "update" só do campo fotos (com a versão conhecida).
Grava um JSON por documento em <saida>/docs e a lista de lotes (até 45 por lote) em <saida>/lotes.json."""
import json, sys
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
saida = Path(sys.argv[1]); (saida / "docs").mkdir(parents=True, exist_ok=True)
versoes = json.loads(Path(sys.argv[2]).read_text()) if len(sys.argv) > 2 else {}
antigos = {l["id"]: l for l in json.loads((ROOT / "data" / "seed.v1.json").read_text())["lugares"]}
writes = []
for l in json.loads((ROOT / "data" / "seed.json").read_text())["lugares"]:
    i = l["id"]
    if i in antigos:
        if l.get("fotos") and not antigos[i].get("fotos"):
            f = saida / "docs" / f"{i}.json"; f.write_text(json.dumps({"fotos": l["fotos"]}, ensure_ascii=False))
            writes.append({"op": "update", "collection": "lugares", "doc_id": i, "file_path": str(f), "if_version": versoes.get(i, 1)})
        continue
    f = saida / "docs" / f"{i}.json"; f.write_text(json.dumps({k: v for k, v in l.items() if k != "id"}, ensure_ascii=False))
    writes.append({"op": "set", "collection": "lugares", "doc_id": i, "file_path": str(f)})
lotes = [writes[k:k + 45] for k in range(0, len(writes), 45)]
(saida / "lotes.json").write_text(json.dumps(lotes))
print(len(writes), "escritas em", len(lotes), "lotes")
