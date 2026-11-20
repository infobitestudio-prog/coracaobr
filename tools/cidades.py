#!/usr/bin/env python3
"""Junta as pesquisas das cidades novas (research/cidades/<slug>.json) em data/seed.json e data/seed.js.

- Pode rodar quantas vezes quiser: os lugares da cidade são substituídos pela versão nova da pesquisa.
- Confere cada lugar: categoria válida, id único, coordenadas perto da cidade, fotos que existem no disco.
- Fotos maiores que 200 KB são recomprimidas (1000 px, JPEG 72). Lugar sem foto real ganha uma ilustrativa da categoria.
Uso: python3 tools/cidades.py [houston austin sanantonio]
"""
import json, math, re, sys, time
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
CENTROS = {"houston": (29.7604, -95.3698), "austin": (30.2672, -97.7431), "sanantonio": (29.4241, -98.4936)}
PREFIXO = {"houston": "hou-", "austin": "aus-", "sanantonio": "sat-"}
CATS = set("""museu parque historico mirante bairro esporte familia compras arte natureza restaurante-brasileiro churrascaria padaria
mercado-brasileiro acai-cafe bbq tex-mex steakhouse hamburguer brunch-cafe comida-sulista asiatico pizza bar mercado evento show governo
transporte saude comunidade servico igreja hotel""".split())
ESTAB = {"restaurante-brasileiro", "churrascaria", "padaria", "mercado-brasileiro", "acai-cafe", "bbq", "tex-mex", "steakhouse", "hamburguer",
         "brunch-cafe", "comida-sulista", "asiatico", "pizza", "bar", "mercado"}
CAMPOS = ["id", "regiaoGuia", "tipo", "nome", "categoria", "brasileiro", "cidade", "bairro", "endereco", "lat", "lng", "telefone", "site", "instagram",
          "horario", "historia", "dica", "gratuito", "preco", "precoMin", "faixaPreco", "tempoVisita", "quando", "dataInicio", "dataFim",
          "notaCuradoria", "notaProvisoria", "menu", "fotos", "atualizadoEm", "publicado"]


def km(a, b):
    R = 6371.0
    la1, lo1, la2, lo2 = map(math.radians, (a[0], a[1], b[0], b[1]))
    h = math.sin((la2 - la1) / 2) ** 2 + math.cos(la1) * math.cos(la2) * math.sin((lo2 - lo1) / 2) ** 2
    return 2 * R * math.asin(math.sqrt(h))


def ilustrativa(cat):
    base = "comunidade" if cat in ("igreja", "servico") else cat
    for nome in (f"img/ilustra-{base}-1.jpg", f"img/ilustra-{base}.jpg", "img/ilustra-comunidade-1.jpg"):
        if (ROOT / nome).exists():
            return {"src": nome, "credito": "Foto ilustrativa", "licenca": "", "pagina": "", "ilustrativa": True}
    return None


def comprime(p):
    from PIL import Image
    if p.stat().st_size <= 200_000:
        return
    im = Image.open(p).convert("RGB")
    if im.width > 1000:
        im = im.resize((1000, round(im.height * 1000 / im.width)), Image.LANCZOS)
    im.save(p, "JPEG", quality=72, optimize=True, progressive=True)


def limpa(l, slug, vistos, avisos):
    o = {k: l.get(k) for k in CAMPOS if k in l}
    o["regiaoGuia"] = slug
    o["id"] = re.sub(r"[^a-z0-9-]", "", str(o.get("id") or "").lower())
    if not o["id"].startswith(PREFIXO[slug]):
        o["id"] = PREFIXO[slug] + o["id"]
    while o["id"] in vistos:
        o["id"] += "-2"
    if not o.get("nome") or o.get("categoria") not in CATS:
        avisos.append(f"descartado (nome/categoria): {l.get('id')} {l.get('categoria')}")
        return None
    o["tipo"] = "estabelecimento" if o["categoria"] in ESTAB else "atracao"
    for k in ("lat", "lng"):
        try:
            o[k] = round(float(o.get(k)), 6) if o.get(k) not in (None, "") else None
        except (TypeError, ValueError):
            o[k] = None
    if o.get("lat") is not None and o.get("lng") is not None and km((o["lat"], o["lng"]), CENTROS[slug]) > 180:
        avisos.append(f"coordenada longe da cidade, removida: {o['id']}")
        o["lat"] = o["lng"] = None
    try:
        n = float(o.get("notaCuradoria") or 0)
        o["notaCuradoria"] = max(1.0, min(5.0, round(n * 2) / 2)) if n else None
    except (TypeError, ValueError):
        o["notaCuradoria"] = None
    if o["notaCuradoria"] is None:
        o.pop("notaCuradoria", None)
    else:
        o["notaProvisoria"] = True
    for k in ("dataInicio", "dataFim"):
        v = str(o.get(k) or "")
        o[k] = v if re.fullmatch(r"\d{4}-\d{2}-\d{2}", v) else ""
    if o["categoria"] not in ("evento",):
        if not o.get("quando"):
            o.pop("quando", None)
        if not o["dataInicio"]:
            o.pop("dataInicio", None); o.pop("dataFim", None)
    o["instagram"] = str(o.get("instagram") or "").lstrip("@").strip()
    o["brasileiro"] = bool(o.get("brasileiro"))
    o["gratuito"] = bool(o.get("gratuito"))
    o["menu"] = o.get("menu") if isinstance(o.get("menu"), list) else []
    fotos = []
    for f in (o.get("fotos") or [])[:15]:
        src = str((f or {}).get("src") or "")
        if f.get("ilustrativa") and (ROOT / src).exists():
            fotos.append({"src": src, "credito": f.get("credito") or "Foto ilustrativa", "licenca": f.get("licenca", ""), "pagina": f.get("pagina", ""), "ilustrativa": True})
            continue
        p = ROOT / src
        if not src.startswith("fotos_cidades/") or not p.exists() or p.stat().st_size < 4000:
            continue
        comprime(p)
        fotos.append({"src": src, "credito": str(f.get("credito") or "")[:80], "licenca": str(f.get("licenca") or "")[:40], "pagina": str(f.get("pagina") or "")})
    reais = [f for f in fotos if not f.get("ilustrativa")]
    if reais:
        fotos = reais
    elif not fotos:
        il = ilustrativa(o["categoria"])
        fotos = [il] if il else []
    o["fotos"] = fotos
    o["atualizadoEm"] = o.get("atualizadoEm") or "2026-11"
    o["publicado"] = o.get("publicado", True) is not False
    vistos.add(o["id"])
    return o


def main():
    slugs = [a for a in sys.argv[1:] if a in CENTROS] or list(CENTROS)
    seed = json.loads((ROOT / "data" / "seed.json").read_text())
    lugares = seed["lugares"]
    for slug in slugs:
        f = ROOT / "research" / "cidades" / f"{slug}.json"
        if not f.exists():
            print(slug, "sem pesquisa ainda"); continue
        novos = json.loads(f.read_text())
        lugares = [l for l in lugares if (l.get("regiaoGuia") or "dfw") != slug]
        vistos = {l["id"] for l in lugares}
        avisos, ok = [], []
        for l in novos:
            o = limpa(l, slug, vistos, avisos)
            if o:
                ok.append(o)
        lugares += ok
        reais = sum(1 for o in ok if any(not x.get("ilustrativa") for x in o["fotos"]))
        nfotos = sum(len([x for x in o["fotos"] if not x.get("ilustrativa")]) for o in ok)
        print(f"{slug}: {len(ok)} lugares, {reais} com foto real ({nfotos} fotos), {len(avisos)} avisos")
        for a in avisos[:15]:
            print("   ", a)
    seed["lugares"] = lugares
    seed["versao"] = f"2026-11-coracaobr-{int(time.time())}"
    txt = json.dumps(seed, ensure_ascii=False, indent=1)
    (ROOT / "data" / "seed.json").write_text(txt)
    (ROOT / "data" / "seed.js").write_text("window.SEED = " + json.dumps(seed, ensure_ascii=False) + ";\n")
    print("total no guia:", len(lugares))


if __name__ == "__main__":
    main()
