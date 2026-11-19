#!/usr/bin/env python3
"""Segunda leva do guia: junta as pesquisas novas em data/seed.json, confere endereços e garante uma foto por lugar.

- Lê research/lazer2.json, eventos.json, governo.json, comida2.json (os que existirem).
- Coordenadas: US Census Geocoder pelo endereço; se não achar, fica a coordenada da pesquisa.
- Fotos: Wikimedia Commons, só licenças livres. A foto só é aceita como "do lugar" se o título do arquivo
  contiver a palavra-chave do lugar. Sem isso, entra uma foto ilustrativa da categoria, marcada como ilustrativa.
Uso: python3 tools/build_seed2.py
"""
import io, json, re, sys, time, unicodedata, urllib.parse, urllib.request
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
UA = "GuideSeedBuilder/0.2 (static site build; generic client)"
HOJE = "2026-11"
LIVRES = re.compile(r"^(cc0|cc by|cc-by|public domain|pd)", re.I)
ILUSTRA_OLD = {
    "bbq": "Texas barbecue brisket", "churrascaria": "churrasco picanha espeto", "tex-mex": "Tex-Mex enchiladas plate", "hamburguer": "cheeseburger fries",
    "steakhouse": "ribeye steak plate", "brunch-cafe": "pancakes breakfast plate", "acai-cafe": "açaí na tigela", "restaurante-brasileiro": "feijoada prato",
    "mercado-brasileiro": "pão de queijo", "padaria": "pão de queijo", "comida-sulista": "fried chicken plate", "asiatico": "ramen bowl", "pizza": "pizza margherita",
    "bar": "craft beer glasses bar", "mercado": "supermarket produce aisle", "compras": "shopping mall interior", "governo": "City hall", "transporte": "DART light rail train Dallas",
    "saude": "hospital building exterior", "comunidade": "public library interior", "evento": "festival crowd Texas", "show": "concert stage lights crowd", "servico": "passaporte brasileiro",
    "museu": "Museum", "parque": "Texas park lake trail", "natureza": "Texas bluebonnets field", "familia": "amusement park ride", "esporte": "stadium crowd Texas",
    "historico": "Texas historic courthouse", "bairro": "Dallas skyline", "arte": "sculpture garden", "mirante": "Dallas skyline night",
}
ILUSTRA = {
    "bbq": "Brisket", "churrascaria": "Churrasco", "tex-mex": "Tex-Mex", "hamburguer": "Hamburger", "steakhouse": "Steakhouse", "brunch-cafe": "Pancake",
    "acai-cafe": "Açaí na tigela", "restaurante-brasileiro": "Brazilian cuisine", "mercado-brasileiro": "Pão de queijo", "padaria": "Doughnut", "comida-sulista": "Fried chicken",
    "asiatico": "Ramen", "pizza": "Pizza", "bar": "Beer", "mercado": "Supermarket", "compras": "Shopping mall", "governo": "City hall",
    "transporte": "Light rail", "saude": "Hospital", "comunidade": "Library", "evento": "Festival",
    "show": "Concert", "servico": "Passport", "museu": "Museum", "parque": "Urban park", "natureza": "Lupinus texensis",
    "familia": "Amusement park", "esporte": "Stadium", "historico": "Historic district", "bairro": "Downtown Dallas", "arte": "Sculpture garden", "mirante": "Downtown Dallas",
}
PARADAS = {"the", "and", "of", "at", "de", "do", "da", "em", "park", "museum", "center", "centre", "dallas", "texas", "fort", "worth", "city", "restaurant", "steakhouse", "brazilian", "barbecue", "bbq"}


_ult = {}
LIM = [False]


def get(url, tent=4):
    host = urllib.parse.urlparse(url).netloc
    for i in range(tent):
        espera = 2.5 - (time.time() - _ult.get(host, 0))
        if espera > 0 and "wiki" in host:
            time.sleep(espera)
        _ult[host] = time.time()
        try:
            return urllib.request.urlopen(urllib.request.Request(url, headers={"User-Agent": UA}), timeout=40).read()
        except Exception as e:  # noqa: BLE001
            if "429" in str(e):
                if "api.php" in url and i >= 1:
                    LIM[0] = True
                    return None  # deixa o outro serviço tentar
                time.sleep(45)
            else:
                time.sleep(2)
    return None


def limpa(html):
    return re.sub(r"\s+", " ", re.sub(r"<[^>]+>", "", html or "")).strip()


WP = "https://en.wikipedia.org/w/api.php?format=json&"


def busca_wiki(q, palavra):
    """Procura na Wikipédia em inglês um artigo do lugar e usa a imagem principal dele (só imagens de licença livre)."""
    raw = get(WP + "action=query&generator=search&gsrlimit=4&prop=pageimages&piprop=name&pilicense=free&gsrsearch=" + urllib.parse.quote(q)); time.sleep(0.6)
    if not raw:
        return None
    try:
        pages = sorted(json.loads(raw).get("query", {}).get("pages", {}).values(), key=lambda p: p.get("index", 99))
    except Exception:  # noqa: BLE001
        return None
    pal = sem_acento(palavra or "").lower()
    for p in pages:
        nome = p.get("pageimage")
        if not nome or re.search(r"\.(svg|png|gif)$", nome, re.I) or re.search(r"logo|map|seal|flag|icon", nome, re.I):
            continue
        if pal and pal not in sem_acento(p.get("title", "")).lower():
            continue
        raw2 = get(WP + "action=query&prop=imageinfo&iiprop=url|extmetadata&iiurlwidth=960&titles=" + urllib.parse.quote("File:" + nome)); time.sleep(0.6)
        try:
            ii = list(json.loads(raw2)["query"]["pages"].values())[0]["imageinfo"][0]
        except Exception:  # noqa: BLE001
            continue
        md = ii.get("extmetadata") or {}
        lic = (md.get("LicenseShortName") or {}).get("value", "")
        if not LIVRES.match(lic) or not ii.get("thumburl"):
            continue
        return {"url": ii["thumburl"], "autor": limpa((md.get("Artist") or {}).get("value", ""))[:60] or "Wikimedia Commons", "licenca": lic, "pagina": ii.get("descriptionurl", "")}
    return None


def busca_arquivo(q, palavra):
    """Busca direta de arquivos no Wikimedia Commons; exige a palavra-chave no nome do arquivo."""
    raw = get("https://commons.wikimedia.org/w/api.php?action=query&format=json&generator=search&gsrnamespace=6&gsrlimit=8&gsrsearch="
              + urllib.parse.quote(q + " filetype:bitmap") + "&prop=imageinfo&iiprop=url|extmetadata|mime&iiurlwidth=960")
    if not raw:
        return None
    try:
        pages = sorted(json.loads(raw).get("query", {}).get("pages", {}).values(), key=lambda p: p.get("index", 99))
    except Exception:  # noqa: BLE001
        return None
    pal = sem_acento(palavra or "").lower()
    for p in pages:
        ii = (p.get("imageinfo") or [{}])[0]; md = ii.get("extmetadata") or {}
        lic = (md.get("LicenseShortName") or {}).get("value", "")
        if ii.get("mime") != "image/jpeg" or not LIVRES.match(lic) or not ii.get("thumburl"):
            continue
        if pal and pal not in sem_acento(p.get("title", "")).lower():
            continue
        return {"url": ii["thumburl"], "autor": limpa((md.get("Artist") or {}).get("value", ""))[:60] or "Wikimedia Commons", "licenca": lic, "pagina": ii.get("descriptionurl", "")}
    return None


CACHE = ROOT / "research" / "fotos_cache.json"
_fc = json.loads(CACHE.read_text()) if CACHE.exists() else {}


def busca_commons(q, palavra):
    k = q + "|" + (palavra or "")
    if k in _fc:
        return _fc[k]
    LIM[0] = False
    r = busca_wiki(q, palavra)
    if r is None:
        r = busca_arquivo(q, palavra) if palavra else None
    if r is None and LIM[0]:
        return None
    _fc[k] = r
    CACHE.write_text(json.dumps(_fc))
    return r


def fotos_por_titulo(mapa):
    """mapa: {chave: título do artigo}. Devolve {chave: {url, autor, licenca, pagina}} para os artigos com imagem principal de licença livre."""
    out, chaves = {}, list(mapa.items())
    for k in range(0, len(chaves), 40):
        bloco = chaves[k:k + 40]
        raw = get(WP + "action=query&redirects=1&prop=pageimages&piprop=name|thumbnail&pithumbsize=960&pilicense=free&titles=" + urllib.parse.quote("|".join(t for _, t in bloco)), tent=6)
        if not raw:
            continue
        q = json.loads(raw).get("query", {})
        ren = {}
        for x in q.get("normalized", []) + q.get("redirects", []):
            ren[x["from"]] = x["to"]
        por_tit = {p.get("title"): p for p in q.get("pages", {}).values()}
        arquivos = {}
        for chave, t in bloco:
            tt = t
            for _ in range(3):
                tt = ren.get(tt, tt)
            p = por_tit.get(tt)
            if not p or not p.get("pageimage") or not p.get("thumbnail"):
                continue
            nome = p["pageimage"]
            if re.search(r"\.(svg|png|gif)$", nome, re.I) or re.search(r"logo|map|seal|flag|icon|locator", nome, re.I):
                continue
            arquivos[chave] = (nome, p["thumbnail"]["source"])
        if not arquivos:
            continue
        nomes = list({n for n, _ in arquivos.values()})
        meta = {}
        for j in range(0, len(nomes), 40):
            raw2 = get(WP + "action=query&prop=imageinfo&iiprop=extmetadata|url&titles=" + urllib.parse.quote("|".join("File:" + n for n in nomes[j:j + 40])), tent=6)
            if not raw2:
                continue
            q2 = json.loads(raw2).get("query", {})
            norm2 = {x["to"]: x["from"] for x in q2.get("normalized", [])}
            for p in q2.get("pages", {}).values():
                ii = (p.get("imageinfo") or [{}])[0]; md = ii.get("extmetadata") or {}
                tit = norm2.get(p.get("title"), p.get("title", ""))
                meta[tit.replace("File:", "").replace(" ", "_")] = meta[p.get("title", "").replace("File:", "").replace(" ", "_")] = {
                    "licenca": (md.get("LicenseShortName") or {}).get("value", ""), "autor": limpa((md.get("Artist") or {}).get("value", ""))[:60] or "Wikimedia Commons", "pagina": ii.get("descriptionurl", "")}
        for chave, (nome, thumb) in arquivos.items():
            m = meta.get(nome.replace(" ", "_"))
            if m and LIVRES.match(m["licenca"]):
                out[chave] = {"url": thumb, **m}
    return out


def fotos_em_lote(ls):
    """Tenta o nome exato; depois o nome sem parênteses e sem o que vem após travessão/vírgula."""
    achados = {}
    def var1(l): return l["nome"]
    def var2(l): return re.sub(r"\s*[\(\[].*?[\)\]]", "", re.split(r"\s+[–—-]\s+|,\s", l["nome"])[0]).strip()
    def var3(l): return var2(l) + " (" + (l.get("cidade") or "Dallas") + ", Texas)"
    for f in (var1, var2, var3):
        resto = {l["id"]: f(l) for l in ls if l["id"] not in achados and f(l)}
        if not resto:
            break
        achados.update(fotos_por_titulo(resto))
        print("  lote", f.__name__, "→", len(achados), "com foto", flush=True)
    return achados


def baixa(url, destino):
    from PIL import Image
    if destino.exists():
        return True
    raw = get(url); time.sleep(1.0)
    if not raw:
        return False
    try:
        im = Image.open(io.BytesIO(raw)).convert("RGB")
        if im.width > 1000:
            im = im.resize((1000, round(im.height * 1000 / im.width)), Image.LANCZOS)
        destino.parent.mkdir(parents=True, exist_ok=True)
        im.save(destino, "JPEG", quality=74, optimize=True, progressive=True)
        return True
    except Exception as e:  # noqa: BLE001
        print("  imagem inválida", type(e).__name__)
        return False


def sem_acento(s):
    return "".join(c for c in unicodedata.normalize("NFD", s) if unicodedata.category(c) != "Mn")


def palavra_de(nome):
    ws = [w for w in re.findall(r"[A-Za-zÀ-ÿ']{4,}", nome) if w.lower() not in PARADAS]
    return max(ws, key=len) if ws else ""


GEOC = ROOT / "research" / "geocode2.json"
_gc = json.loads(GEOC.read_text()) if GEOC.exists() else {}


def geocode(end):
    if end in _gc:
        return tuple(_gc[end]) if _gc[end] else None
    r = _geocode(end); _gc[end] = list(r) if r else None; GEOC.write_text(json.dumps(_gc))
    return r


def _geocode(end):
    raw = get("https://geocoding.geo.census.gov/geocoder/locations/onelineaddress?benchmark=Public_AR_Current&format=json&address=" + urllib.parse.quote(end), tent=2)
    try:
        m = json.loads(raw)["result"]["addressMatches"]
        return (round(m[0]["coordinates"]["y"], 6), round(m[0]["coordinates"]["x"], 6)) if m else None
    except Exception:  # noqa: BLE001
        return None


def km(a, b, c, d):
    import math
    r = math.pi / 180
    return 6371 * 2 * math.asin(math.sqrt(math.sin((c - a) * r / 2) ** 2 + math.cos(a * r) * math.cos(c * r) * math.sin((d - b) * r / 2) ** 2))


def novo_lugar(x):
    est = x.get("tipo") == "estabelecimento"
    cat = x.get("categoria", "")
    l = {
        "id": x["id"], "tipo": "estabelecimento" if est else "atracao", "nome": x["nome"], "categoria": cat, "brasileiro": bool(x.get("brasileiro")),
        "cidade": x.get("cidade", ""), "bairro": x.get("bairro", ""), "endereco": x.get("endereco", ""), "lat": x.get("lat"), "lng": x.get("lng"),
        "telefone": x.get("telefone", ""), "site": x.get("site", ""), "instagram": x.get("instagram", ""), "horario": x.get("horario", ""),
        "historia": x.get("historia") or x.get("descricao") or "", "dica": x.get("dica", ""), "fotos": [], "atualizadoEm": HOJE, "publicado": True,
        "_busca": x.get("commons_busca") or [], "_palavra": x.get("commons_palavra") or "",
    }
    if est:
        menu = [{"secao": m.get("secao", ""), "item": m.get("item", ""), "descricao": m.get("descricao", ""), "preco": m.get("preco_usd")} for m in (x.get("menu") or [])[:10]]
        l.update({"faixaPreco": x.get("faixa_preco", ""), "menu": menu, "fonteMenu": x.get("fonte_menu", ""), "menuVerificadoEm": x.get("menu_verificado_em", "") if menu else "", "gratuito": False})
    else:
        l.update({"gratuito": bool(x.get("gratuito")), "preco": x.get("preco", ""), "precoMin": x.get("preco_min_usd") or 0, "precoConfirmado": bool(x.get("preco_confirmado", False)),
                  "fontePreco": x.get("fonte_preco", ""), "tempoVisita": x.get("tempo_visita", ""), "menu": []})
        if x.get("quando"):
            l.update({"quando": x["quando"], "dataInicio": x.get("data_inicio", ""), "dataFim": x.get("data_fim", "")})
    if cat not in ("governo", "transporte", "saude", "comunidade", "evento"):
        l.update({"notaCuradoria": 4.0, "notaProvisoria": True})
    return l


def main():
    seed = json.loads((ROOT / "data" / "seed.json").read_text())
    lugares = seed["lugares"]
    if "--completar" in sys.argv:
        return completar(seed)
    ids = {l["id"] for l in lugares}; nomes = {sem_acento(l["nome"]).lower() for l in lugares}
    novos = []
    for arq in ("lazer2", "eventos", "governo", "comida2"):
        f = ROOT / "research" / f"{arq}.json"
        if not f.exists():
            print("sem", arq); continue
        try:
            itens = json.loads(f.read_text())
        except Exception as e:  # noqa: BLE001
            print("JSON inválido em", arq, e); continue
        n = 0
        for x in itens:
            if not x.get("id") or not x.get("nome") or x["id"] in ids or sem_acento(x["nome"]).lower() in nomes:
                continue
            ids.add(x["id"]); nomes.add(sem_acento(x["nome"]).lower()); nl = novo_lugar(x)
            if arq == "comida2" and not x.get("brasileiro"):
                nl["naoConferido"] = True  # dados da pesquisa sem checagem na web nesta rodada
            novos.append(nl); n += 1
        print(arq, n, "novos")
    # coordenadas dos novos
    for l in novos:
        if l["endereco"]:
            g = geocode(l["endereco"])
            if g and (l["lat"] is None or km(l["lat"], l["lng"], g[0], g[1]) < 6):
                l["lat"], l["lng"] = g
    lugares += novos
    # fotos para todos que não têm: consultas em lote na Wikipédia (até 50 títulos por pedido), para não esbarrar no limite de uso
    faltam = [l for l in lugares if not l.get("fotos")]
    print(len(faltam), "lugares sem foto", flush=True)
    achados = fotos_em_lote(faltam)
    ilustra = {}
    for l in faltam:
        r = achados.get(l["id"])
        if r and baixa(r["url"], ROOT / "img" / f"{l['id']}-1.jpg"):
            l["fotos"] = [{"src": f"img/{l['id']}-1.jpg", "credito": r["autor"], "licenca": r["licenca"], "pagina": r["pagina"]}]
            continue
        cat = l["categoria"]
        if cat not in ilustra:
            t = ILUSTRA.get(cat, "Dallas")
            m = fotos_por_titulo({t: t}).get(t)
            ilustra[cat] = m if m and baixa(m["url"], ROOT / "img" / f"ilustra-{cat}.jpg") else None
        r = ilustra[cat]
        if r:
            l["fotos"] = [{"src": f"img/ilustra-{cat}.jpg", "credito": r["autor"], "licenca": r["licenca"], "pagina": r["pagina"], "ilustrativa": True}]
    for l in lugares:
        l.pop("_busca", None); l.pop("_palavra", None)
    seed["versao"] = f"{HOJE}-{len(lugares)}-{int(time.time())}"
    (ROOT / "data" / "seed.json").write_text(json.dumps(seed, ensure_ascii=False, indent=1))
    reais = sum(1 for l in lugares if l.get("fotos") and not l["fotos"][0].get("ilustrativa"))
    ilus = sum(1 for l in lugares if l.get("fotos") and l["fotos"][0].get("ilustrativa"))
    print(len(lugares), "lugares;", reais, "com foto do lugar;", ilus, "com foto ilustrativa;", len(lugares) - reais - ilus, "sem foto")


def completar(seed):
    """Segunda passada: tenta foto real para quem está sem foto ou com foto ilustrativa; quem continuar sem, recebe a ilustrativa."""
    lugares = seed["lugares"]
    alvo = [l for l in lugares if not l.get("fotos") or l["fotos"][0].get("ilustrativa")]
    print(len(alvo), "para completar", flush=True)
    achados = fotos_em_lote(alvo)
    ilustra = {}
    for l in alvo:
        r = achados.get(l["id"])
        if r and baixa(r["url"], ROOT / "img" / f"{l['id']}-1.jpg"):
            l["fotos"] = [{"src": f"img/{l['id']}-1.jpg", "credito": r["autor"], "licenca": r["licenca"], "pagina": r["pagina"]}]
            continue
        if l.get("fotos"):
            continue
        cat = l["categoria"]
        if cat not in ilustra:
            dest = ROOT / "img" / f"ilustra-{cat}.jpg"
            m = None if dest.exists() else fotos_por_titulo({"t": ILUSTRA.get(cat, "Dallas")}).get("t")
            if dest.exists():
                ref = next((x["fotos"][0] for x in lugares if x.get("fotos") and x["fotos"][0]["src"] == f"img/ilustra-{cat}.jpg"), None)
                ilustra[cat] = ref and {"autor": ref["credito"], "licenca": ref["licenca"], "pagina": ref["pagina"]}
            else:
                ilustra[cat] = m if m and baixa(m["url"], dest) else None
        r = ilustra[cat]
        if r:
            l["fotos"] = [{"src": f"img/ilustra-{cat}.jpg", "credito": r["autor"], "licenca": r["licenca"], "pagina": r["pagina"], "ilustrativa": True}]
    seed["versao"] = f"{HOJE}-{len(lugares)}-{int(time.time())}"
    (ROOT / "data" / "seed.json").write_text(json.dumps(seed, ensure_ascii=False, indent=1))
    reais = sum(1 for l in lugares if l.get("fotos") and not l["fotos"][0].get("ilustrativa"))
    ilus = sum(1 for l in lugares if l.get("fotos") and l["fotos"][0].get("ilustrativa"))
    print(len(lugares), "lugares;", reais, "com foto do lugar;", ilus, "com foto ilustrativa;", len(lugares) - reais - ilus, "sem foto", flush=True)


if __name__ == "__main__":
    main()
