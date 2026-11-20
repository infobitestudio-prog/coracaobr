#!/usr/bin/env python3
"""Cartões-postais do banner principal e dos banners dos patrocinadores.
Pega as fotos originais (alta resolução, licença livre) de uma pasta e grava em img/postais/:
  <nome>.jpg   2560 px de largura (telas grandes e retina)
  <nome>-m.jpg 1280 px (celular)
JPEG progressivo, qualidade alta, sem metadados. Também gera js/postais.js com os créditos de cada foto."""
import json, sys
from pathlib import Path
from PIL import Image, ImageFilter
ROOT = Path(__file__).resolve().parent.parent
ORIG = Path(sys.argv[1]) if len(sys.argv) > 1 else Path("/tmp/claude-0/ban/orig")
OUT = ROOT / "img" / "postais"; OUT.mkdir(parents=True, exist_ok=True)
cred = json.loads((ORIG.parent / "creditos.json").read_text()) if (ORIG.parent / "creditos.json").exists() else {}
ok = {}
for f in sorted(ORIG.glob("*.jpg")):
    k = f.stem; im = Image.open(f).convert("RGB")
    for w, suf, q in ((2560, "", 82), (1280, "-m", 80)):
        x = im if im.width <= w else im.resize((w, round(im.height * w / im.width)), Image.LANCZOS)
        if x is not im: x = x.filter(ImageFilter.UnsharpMask(radius=0.6, percent=40, threshold=2))
        x.save(OUT / (k + suf + ".jpg"), "JPEG", quality=q, optimize=True, progressive=True, subsampling="4:2:0")
    ok[k] = cred.get(k, {})
    print(k, im.size, round((OUT / (k + ".jpg")).stat().st_size / 1024), "KB /", round((OUT / (k + "-m.jpg")).stat().st_size / 1024), "KB")
cr = {k + ".jpg": {"autor": v.get("autor", ""), "licenca": v.get("licenca", ""), "pagina": v.get("pagina", "")} for k, v in ok.items()}
cr["fort-worth-stockyards.jpg"] = cr.get("fort-worth-stockyards.jpg", {"autor": "Wikimedia Commons", "licenca": "licença livre", "pagina": ""})
(ROOT / "js" / "postais.js").write_text("/* Gerado por tools/postais.py: cartões-postais disponíveis e o crédito de cada foto (licenças livres). */\n"
  "window.POSTAIS = " + json.dumps(sorted(ok), ensure_ascii=False) + ";\nwindow.CREDITOS_FOTOS = " + json.dumps(cr, ensure_ascii=False) + ";\n")
print("js/postais.js:", sorted(ok))
