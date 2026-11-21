#!/usr/bin/env python3
"""Amplia a região São Paulo · Zona Leste com as pesquisas de restaurantes/bares, parques e eventos.

Entrada (JSON gerados pela pesquisa): pesquisa/restaurantes_bares.json, pesquisa/parques.json, pesquisa/eventos.json
Saída: research/cidades/spzl.json (lugares novos + fotos novas nos que já existiam) e fotos em fotos_cidades/spzl/<id>/.
Fotos: baixadas da fonte (Commons ou site oficial), sem repetir a mesma imagem em dois lugares,
comprimidas até 1280 px, JPEG progressivo q80, sem metadados. Depois rode: python3 tools/cidades.py spzl
Uso: python3 tools/zl_ampliar.py <pasta-da-pesquisa>
"""
import hashlib, io, json, re, sys, time, unicodedata, urllib.parse, urllib.request
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
UA = "CoracaoBR/1.0 (guia brasileiro; https://coracaobr.com.br)"
REV = time.strftime("%Y-%m-%d") + "a"
HOJE = time.strftime("%Y-%m")
BAIRROS_OK = {"tatuape": "Tatuapé", "analia franco": "Anália Franco", "jardim analia franco": "Anália Franco", "vila formosa": "Vila Formosa"}


def slug(s):
    s = unicodedata.normalize("NFKD", str(s or "")).encode("ascii", "ignore").decode().lower()
    return re.sub(r"[^a-z0-9]+", "-", s).strip("-")[:60]


def norm(s):
    return re.sub(r"\b(parque|shopping|center|municipal|estadual|linear|ecologico|do|da|de|dos|das)\b", "", slug(s).replace("-", " ")).split()


def baixa(url):
    req = urllib.request.Request(url, headers={"User-Agent": UA, "Accept": "image/*"})
    with urllib.request.urlopen(req, timeout=40) as r:
        return r.read()


VISTAS = {}   # hash da imagem → id do lugar (não repetir a mesma foto em lugares diferentes)


def salva_fotos(id_, fotos, maximo):
    from PIL import Image
    pasta = ROOT / "fotos_cidades" / "spzl" / id_
    pasta.mkdir(parents=True, exist_ok=True)
    out = []
    for f in fotos:
        if len(out) >= maximo:
            break
        u = str(f.get("url") or "")
        if not u.startswith("http") or re.search(r"instagram|fbcdn|googleusercontent|gstatic|tripadvisor|ifood", u):
            continue
        try:
            raw = baixa(u)
            im = Image.open(io.BytesIO(raw))
            im.load()
        except Exception as e:
            print("   foto falhou", id_, u[:90], type(e).__name__)
            continue
        if min(im.size) < 360:
            continue
        im = im.convert("RGB")
        h = hashlib.md5(im.resize((16, 16)).tobytes()).hexdigest()
        if h in VISTAS and VISTAS[h] != id_:
            print("   foto repetida ignorada", id_, "=", VISTAS[h])
            continue
        if any(o["_h"] == h for o in out):
            continue
        VISTAS[h] = id_
        im.thumbnail((1280, 1280), Image.LANCZOS)
        p = pasta / f"{id_}-{len(out) + 1}.jpg"
        im.save(p, "JPEG", quality=80, optimize=True, progressive=True)
        out.append({"_h": h, "src": str(p.relative_to(ROOT)), "credito": str(f.get("credito") or "Divulgação")[:80],
                    "licenca": str(f.get("licenca") or "")[:40], "pagina": str(f.get("pagina") or u)})
    for o in out:
        o.pop("_h", None)
    return out


def geocode(q):
    try:
        u = "https://nominatim.openstreetmap.org/search?format=json&limit=1&countrycodes=br&q=" + urllib.parse.quote(q)
        d = json.loads(urllib.request.urlopen(urllib.request.Request(u, headers={"User-Agent": UA}), timeout=30).read())
        time.sleep(1.1)
        if d:
            return round(float(d[0]["lat"]), 6), round(float(d[0]["lon"]), 6)
    except Exception:
        pass
    try:
        u = "https://photon.komoot.io/api/?limit=1&q=" + urllib.parse.quote(q)
        d = json.loads(urllib.request.urlopen(urllib.request.Request(u, headers={"User-Agent": UA}), timeout=30).read())
        c = d["features"][0]["geometry"]["coordinates"]
        return round(c[1], 6), round(c[0], 6)
    except Exception:
        return None, None


def coords(o, q):
    if o.get("lat") and o.get("lng"):
        return
    la, lo = geocode(q)
    if la is not None and -24.2 < la < -23.2 and -47.0 < lo < -46.2:
        o["lat"], o["lng"] = la, lo


def precos_de(txt):
    nums = [float(x.replace(".", "").replace(",", ".")) for x in re.findall(r"R\$\s*([\d.]+(?:,\d{1,2})?)", str(txt or ""))]
    nums += [float(x) for x in re.findall(r"[–-]\s*(\d{2,4})\b", str(txt or "")) if "R$" in str(txt or "")]
    nums = [n for n in nums if 0 < n < 5000]
    return (min(nums), max(nums)) if nums else (None, None)


def endereco(o):
    e = str(o.get("endereco") or "").strip()
    cep = str(o.get("cep") or "").strip()
    if cep and cep not in e:
        e = (e + ", " + cep).strip(", ")
    return e


def bairro_de(s, padrao=""):
    b = BAIRROS_OK.get(slug(s).replace("-", " "))
    return b or (str(s or "").strip() or padrao)


def categoria_comida(r):
    c = slug((r.get("cozinha") or "") + " " + (r.get("nome") or ""))
    if r.get("tipo") == "bar" or re.search(r"bar|boteco|cervej|chopp|pub|botequim", c):
        return "bar"
    for rx, cat in ((r"japon|sushi|temaki|oriental|chines|asiat|corean|thai", "japones" if re.search(r"japon|sushi|temaki", c) else "asiatico"),
                    (r"pizz", "pizza"), (r"ital|cantina|massa", "italiano"), (r"churrasc|rodizio-de-carne|steak|parrilla", "churrascaria"),
                    (r"hamburg|burger", "hamburguer"), (r"padaria|confeitaria|cafe|brunch", "brunch-cafe")):
        if re.search(rx, c):
            return cat
    return "restaurante"


def main():
    pasta = Path(sys.argv[1] if len(sys.argv) > 1 else ".")
    base_f = ROOT / "research" / "cidades" / "spzl.json"
    base = json.loads(base_f.read_text())
    por_id = {l["id"]: l for l in base}
    for l in base:   # fotos que já existem também entram no controle de repetidas
        for f in l.get("fotos") or []:
            p = ROOT / str(f.get("src") or "")
            if p.exists():
                try:
                    from PIL import Image
                    VISTAS.setdefault(hashlib.md5(Image.open(p).convert("RGB").resize((16, 16)).tobytes()).hexdigest(), l["id"])
                except Exception:
                    pass
    novos = 0

    # ---------- parques ----------
    pq = json.loads((pasta / "parques.json").read_text()) if (pasta / "parques.json").exists() else []
    existentes = {tuple(norm(l["nome"])): l for l in base if l.get("categoria") == "parque"}
    for p in pq:
        if not p.get("nome"):
            continue
        k = tuple(norm(p["nome"]))
        l = existentes.get(k)
        if not l:
            id_ = "spzl-parque-" + slug(re.sub(r"(?i)^parque\s+", "", p["nome"]))
            while id_ in por_id:
                id_ += "-2"
            l = {"id": id_, "regiaoGuia": "spzl", "nome": p["nome"], "categoria": "parque", "tipo": "atracao", "pais": "Brasil", "estado": "SP",
                 "cidade": "São Paulo", "gratuito": True, "preco": "Entrada gratuita", "oferta": "ingresso"}
            base.append(l); por_id[id_] = l; existentes[k] = l; novos += 1
        l["bairro"] = bairro_de(p.get("bairro"), l.get("bairro") or "Zona Leste")
        for a, b in (("endereco", endereco(p)), ("site", p.get("site")), ("horario", p.get("horario")), ("subprefeitura", p.get("subprefeitura"))):
            if b:
                l[a] = b
        if p.get("lat") and p.get("lng"):
            l["lat"], l["lng"] = round(float(p["lat"]), 6), round(float(p["lng"]), 6)
        desc = str(p.get("descricao") or "").strip()
        est = [str(x) for x in (p.get("estrutura") or []) if x]
        if desc and not l.get("historia"):
            l["historia"] = desc
        elif desc and len(desc) > 40 and l.get("revisao") is None and novos == 0:
            pass
        if est:
            l["estrutura"] = est[:14]
            l["dica"] = l.get("dica") or ("Estrutura: " + ", ".join(est[:8]) + ".")
        if not l.get("historia"):
            l["historia"] = desc or f"Parque público em {l['bairro']}, Zona Leste de São Paulo."
        if p.get("fontes"):
            l["fontes"] = [str(x) for x in p["fontes"]][:6]
        coords(l, f"{p['nome']}, São Paulo")
        fs = salva_fotos(l["id"], p.get("fotos") or [], 8)
        if fs:
            l["fotos"] = fs
        elif l.get("fotos"):   # mantém as antigas só se não repetem a foto de outro lugar
            pass
        l["revisao"] = REV; l["atualizadoEm"] = HOJE
        print("parque", l["id"], len(l.get("fotos") or []), "fotos")

    # ---------- restaurantes e bares ----------
    rb = json.loads((pasta / "restaurantes_bares.json").read_text()) if (pasta / "restaurantes_bares.json").exists() else []
    nomes = {slug(l["nome"]) for l in base}
    for r in rb:
        if not r.get("nome") or slug(r["nome"]) in nomes:
            continue
        cat = categoria_comida(r)
        id_ = "spzl-" + slug(r["nome"])
        while id_ in por_id:
            id_ += "-2"
        l = {"id": id_, "regiaoGuia": "spzl", "nome": r["nome"], "categoria": cat, "tipo": "estabelecimento", "oferta": "comida",
             "pais": "Brasil", "estado": "SP", "cidade": "São Paulo", "bairro": bairro_de(r.get("bairro"), "Tatuapé")}
        for a, b in (("endereco", endereco(r)), ("telefone", r.get("telefone")), ("site", r.get("site")), ("horario", r.get("horario"))):
            if b:
                l[a] = str(b).strip()
        if r.get("instagram"):
            l["instagram"] = str(r["instagram"]).lstrip("@").strip().split("/")[-1]
        desc = str(r.get("descricao") or "").strip()
        coz = str(r.get("cozinha") or "").strip()
        l["historia"] = desc or ((coz.capitalize() + " em ") if coz else ("Bar em " if cat == "bar" else "Restaurante em ")) + l["bairro"] + ", São Paulo."
        n = r.get("nota") or {}
        try:
            if n.get("media") and float(n["media"]) > 0:
                l["notaExterna"] = {"fonte": str(n.get("fonte") or "avaliações na internet")[:40], "media": round(float(n["media"]), 1),
                                    "total": int(n.get("total") or 0), "link": str(n.get("url") or ""), "em": time.strftime("%Y-%m-%d")}
        except (TypeError, ValueError):
            pass
        pr = r.get("preco") or {}
        mn, mx = precos_de(pr.get("texto") if isinstance(pr, dict) else pr)
        if mn:
            l["precoMin"] = mn
            if mx and mx > mn:
                l["precoMax"] = mx
            l["precoBase"] = "por pessoa"
            l["fontePreco"] = str(pr.get("fonte") or "") if isinstance(pr, dict) else ""
            l["fontePrecoTipo"] = "terceiros"
            l["precoConferidoEm"] = time.strftime("%Y-%m-%d")
        if r.get("fontes"):
            l["fontes"] = [str(x) for x in r["fontes"]][:6]
        coords(l, endereco(r) or f"{r['nome']}, {l['bairro']}, São Paulo")
        fs = salva_fotos(id_, r.get("fotos") or [], 8)
        l["fotos"] = fs
        l["revisao"] = REV; l["atualizadoEm"] = HOJE
        base.append(l); por_id[id_] = l; nomes.add(slug(r["nome"])); novos += 1
        print(cat, id_, len(fs), "fotos", "nota" if "notaExterna" in l else "", "preço" if mn else "")

    # ---------- eventos ----------
    ev = json.loads((pasta / "eventos.json").read_text()) if (pasta / "eventos.json").exists() else []
    hoje = time.strftime("%Y-%m-%d")
    for e in ev:
        if not e.get("nome") or not re.fullmatch(r"\d{4}-\d{2}-\d{2}", str(e.get("dataInicio") or "")):
            continue
        if (e.get("dataFim") or e["dataInicio"]) < hoje:
            continue
        id_ = "spzl-ev-" + slug(e["nome"])[:48] + "-" + e["dataInicio"][5:].replace("-", "")
        if id_ in por_id:
            continue
        l = {"id": id_, "regiaoGuia": "spzl", "nome": e["nome"], "categoria": "evento", "tipo": "atracao", "oferta": "ingresso",
             "pais": "Brasil", "estado": "SP", "cidade": "São Paulo", "bairro": bairro_de(e.get("bairro"), "Zona Leste"),
             "dataInicio": e["dataInicio"], "dataFim": e.get("dataFim") if re.fullmatch(r"\d{4}-\d{2}-\d{2}", str(e.get("dataFim") or "")) else e["dataInicio"]}
        for a, b in (("endereco", endereco(e)), ("site", e.get("site")), ("local", e.get("local")), ("quando", e.get("quando"))):
            if b:
                l[a] = str(b).strip()
        grat = bool(e.get("gratuito")) or bool(re.search(r"gr[aá]tis|gratuito|livre", str(e.get("preco") or ""), re.I))
        l["gratuito"] = grat
        l["preco"] = "Grátis" if grat else str(e.get("preco") or "").strip()
        if not grat:
            mn, mx = precos_de(e.get("preco"))
            if mn:
                l["precoMin"] = mn
                if mx and mx > mn:
                    l["precoMax"] = mx
                l["precoBase"] = "ingresso"
                l["fontePreco"] = str(e.get("site") or "")
                l["precoConferidoEm"] = hoje
            else:
                l["precoConfirmado"] = False
        tipo = str(e.get("tipo") or "").strip()
        l["historia"] = str(e.get("descricao") or "").strip() or (tipo.capitalize() + " em " + (l.get("local") or l["bairro"]) + ".")
        if e.get("fontes"):
            l["fontes"] = [str(x) for x in e["fontes"]][:6]
        coords(l, endereco(e) or f"{e.get('local') or ''}, São Paulo")
        l["fotos"] = salva_fotos(id_, e.get("fotos") or [], 4)
        l["revisao"] = REV; l["atualizadoEm"] = HOJE
        base.append(l); por_id[id_] = l; novos += 1
        print("evento", id_, l["dataInicio"], l["preco"][:30], len(l["fotos"]), "fotos")

    base_f.write_text(json.dumps(base, ensure_ascii=False, indent=1))
    print(f"\n{novos} lugares novos · total spzl: {len(base)}")


if __name__ == "__main__":
    main()
