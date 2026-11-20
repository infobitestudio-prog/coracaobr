#!/usr/bin/env python3
"""Converte as fotos dos lugares e eventos para WebP (qualidade 80, método 6): ~35% menores sem perda visível.
Só troca quando o WebP fica pelo menos 8% menor. Atualiza as referências em data/seed.json, data/seed.js,
js/app.js, tools/cidades.py e research/cidades/*.json, e apaga o original convertido.
Logo, cartões-postais e fotos de patrocinadores continuam em JPEG (prévias de compartilhamento)."""
import glob, json, os, re
from pathlib import Path
from PIL import Image
ROOT = Path(__file__).resolve().parent.parent; os.chdir(ROOT)
arqs = sorted(glob.glob("fotos_cidades/**/*.jpg", recursive=True) + glob.glob("fotos_eventos/**/*.jpg", recursive=True) + glob.glob("img/*.jpg") + glob.glob("img/*.jpeg") + glob.glob("img/*.png"))
troca, antes, depois = {}, 0, 0
for f in arqs:
    try:
        im = Image.open(f); im.load()
        if im.mode not in ("RGB", "RGBA"): im = im.convert("RGB")
        if im.width > 1600: im = im.resize((1600, round(im.height * 1600 / im.width)), Image.LANCZOS)
        novo = re.sub(r"\.(jpe?g|png)$", ".webp", f)
        im.save(novo, "WEBP", quality=80, method=6)
        a, b = os.path.getsize(f), os.path.getsize(novo)
        if b <= a * 0.92: troca[f] = novo; antes += a; depois += b
        else: os.remove(novo)
    except Exception as e: print("pulei", f, e)
alvos = ["data/seed.json", "data/seed.js", "js/app.js", "tools/cidades.py"] + glob.glob("research/cidades/*.json")
pad = re.compile("|".join(re.escape(k) for k in sorted(troca, key=len, reverse=True))) if troca else None
for t in alvos:
    if not pad or not os.path.exists(t): continue
    s = open(t, encoding="utf-8").read(); n = pad.sub(lambda m: troca[m.group(0)], s)
    if n != s: open(t, "w", encoding="utf-8").write(n); print("referências atualizadas:", t)
for f in troca: os.remove(f)
print(f"{len(troca)} fotos em WebP: {antes/1e6:.1f} MB → {depois/1e6:.1f} MB (-{(1 - depois/max(1, antes))*100:.0f}%)")
