#!/usr/bin/env python3
"""Levanta a região São Paulo · Zona Leste (Brasil › São Paulo › São Paulo › bairros) para o guia:
só parques públicos e shoppings. Coordenadas e endereço pelo OpenStreetMap (Nominatim) e até 3 fotos reais
por lugar na Wikimedia Commons (com autor e licença). Grava research/cidades/spzl.json e as fotos em
fotos_cidades/spzl/<id>/. Depois rode: python3 tools/cidades.py spzl
"""
import json, re, time, html, urllib.parse, urllib.request
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
UA = "CoracaoBR/1.0 (guia brasileiro; https://coracaobr.com.br)"
HOR_PARQUE = "Parques municipais de São Paulo costumam abrir todos os dias, das 5h às 20h. Confira o horário do dia no site da Prefeitura antes de ir."
HOR_SHOP = "Lojas: segunda a sábado, das 10h às 22h; domingos e feriados, em geral das 14h às 20h. Praça de alimentação e cinema têm horário próprio; confira no site do shopping."
P = "parque"; S = "compras"
LUGARES = [
    # id, nome, categoria, bairro, busca no mapa, busca de fotos, site, história, dica
    ("parque-ceret", "Parque CERET", P, "Anália Franco", "Parque CERET, São Paulo", "CERET São Paulo", "https://www.prefeitura.sp.gov.br/cidade/secretarias/meio_ambiente/parques/",
     "O Centro Esportivo, Recreativo e Educativo do Trabalhador é um dos parques mais queridos da Zona Leste, entre o Jardim Anália Franco e o Tatuapé. Tem lago, pistas de caminhada e corrida arborizadas, quadras, campos e muito espaço verde para piquenique.",
     "Vá cedo no fim de semana: as pistas ficam cheias a partir das 9h. Fica a poucos minutos a pé do Shopping Anália Franco."),
    ("parque-piqueri", "Parque Piqueri", P, "Tatuapé", "Parque Piqueri, Tatuapé, São Paulo", "Parque Piqueri", "https://www.prefeitura.sp.gov.br/cidade/secretarias/meio_ambiente/parques/",
     "Área verde tranquila no Tatuapé, com bosque, lago, playground e pista de caminhada. Ótimo para uma pausa com as crianças perto das estações Tatuapé e Carrão do metrô.",
     "Combine com o Shopping Metrô Tatuapé ou o Boulevard Tatuapé, que ficam pertinho."),
    ("parque-ecologico-do-tiete", "Parque Ecológico do Tietê", P, "Penha", "Parque Ecológico do Tietê, São Paulo", "Parque Ecológico do Tietê", "https://www.infraestruturameioambiente.sp.gov.br/",
     "Parque estadual enorme às margens do Rio Tietê, com lagos, ciclovia, quadras, áreas de churrasco e muita fauna: é comum ver capivaras e aves. Um dos melhores passeios ao ar livre da Zona Leste.",
     "Leve bicicleta ou alugue no parque nos fins de semana. Tem estacionamento e lanchonetes."),
    ("parque-do-carmo", "Parque do Carmo", P, "Itaquera", "Parque do Carmo, São Paulo", "Parque do Carmo", "https://www.prefeitura.sp.gov.br/cidade/secretarias/meio_ambiente/parques/",
     "Um dos maiores parques da cidade, com bosques, lagos e grandes gramados. Fica famoso no inverno pelas cerejeiras floridas e pela tradicional Festa das Cerejeiras da comunidade japonesa.",
     "Para ver as cerejeiras, a florada costuma acontecer entre julho e agosto. O parque é grande: use calçado confortável."),
    ("parque-tiquatira", "Parque Linear Tiquatira", P, "Penha", "Parque Linear Tiquatira, São Paulo", "Parque Linear Tiquatira", "https://www.prefeitura.sp.gov.br/cidade/secretarias/meio_ambiente/parques/",
     "Parque linear que acompanha o córrego Tiquatira, com ciclovia, pista de caminhada, aparelhos de ginástica e quadras ao longo de um corredor verde comprido na região da Penha.",
     "Bom para pedalar: a ciclovia é contínua e plana. Leve água, há trechos com pouca sombra."),
    ("parque-raul-seixas", "Parque Raul Seixas", P, "Itaquera", "Parque Raul Seixas, São Paulo", "Parque Raul Seixas", "https://www.prefeitura.sp.gov.br/cidade/secretarias/meio_ambiente/parques/",
     "Parque de bairro em Itaquera com área verde, playground, quadras e espaço para caminhada, muito usado pelas famílias da região.",
     "Programa leve para uma manhã com as crianças. Fica perto do Shopping Metrô Itaquera."),
    ("parque-chico-mendes", "Parque Chico Mendes", P, "São Miguel Paulista", "Parque Chico Mendes, São Paulo", "Parque Chico Mendes São Paulo", "https://www.prefeitura.sp.gov.br/cidade/secretarias/meio_ambiente/parques/",
     "Parque arborizado no extremo leste, com lago, trilhas, viveiro e muitas espécies de árvores. Um respiro verde para quem mora na região de São Miguel Paulista e Vila Curuçá.",
     "Ótimo para observar aves logo cedo. Leve repelente perto do lago."),
    ("parque-belem", "Parque Belém", P, "Belém", "Parque Belém, São Paulo", "Parque Belém São Paulo", "https://www.prefeitura.sp.gov.br/cidade/secretarias/meio_ambiente/parques/",
     "Área verde no bairro do Belém, perto da Mooca e do Tatuapé, com pista de caminhada, playground e espaço para descanso.",
     "Bom ponto de partida para um passeio pela Zona Leste mais próxima do centro."),
    ("shopping-analia-franco", "Shopping Anália Franco", S, "Anália Franco", "Shopping Anália Franco, São Paulo", "Shopping Anália Franco", "https://www.shoppinganaliafranco.com.br/",
     "Um dos maiores e mais completos shoppings da Zona Leste, no Jardim Anália Franco. Reúne grandes lojas de departamento, marcas nacionais e internacionais, restaurantes, cinema e serviços.",
     "Fins de semana à tarde são os horários mais cheios. O Parque CERET fica a poucos minutos a pé."),
    ("shopping-metro-tatuape", "Shopping Metrô Tatuapé", S, "Tatuapé", "Shopping Metrô Tatuapé, São Paulo", "Shopping Metrô Tatuapé", "https://www.shoppingtatuape.com.br/",
     "Shopping ligado direto à estação Tatuapé do metrô e da CPTM, com lojas populares e de marca, praça de alimentação e cinema. Prático para quem chega de transporte público.",
     "Desça na estação Tatuapé e entre sem sair na rua. Do outro lado fica o Boulevard Tatuapé."),
    ("boulevard-tatuape", "Boulevard Tatuapé", S, "Tatuapé", "Boulevard Tatuapé, São Paulo", "Boulevard Tatuapé", "https://www.boulevardtatuape.com.br/",
     "Shopping vizinho à estação Tatuapé, com lojas, academia, restaurantes e cinema, formando com o Shopping Metrô Tatuapé um grande polo de compras da região.",
     "Dá para visitar os dois shoppings do Tatuapé no mesmo passeio, a pé pela estação."),
    ("mooca-plaza-shopping", "Mooca Plaza Shopping", S, "Mooca", "Mooca Plaza Shopping, São Paulo", "Mooca Plaza Shopping", "https://www.moocaplaza.com.br/",
     "Shopping moderno na Mooca, com lojas de grandes marcas, restaurantes, cinema e área de lazer, servindo a Mooca, a Vila Prudente e o Ipiranga.",
     "Combine com um passeio pelas cantinas italianas tradicionais da Mooca."),
    ("shopping-aricanduva", "Shopping Aricanduva", S, "Aricanduva", "Shopping Aricanduva, São Paulo", "Shopping Aricanduva", "https://www.shoppingaricanduva.com.br/",
     "Complexo de compras gigante na Avenida Aricanduva, com centenas de lojas, hipermercado, lojas de construção e móveis, restaurantes e cinema. Um dos maiores centros de compras do país.",
     "É enorme: anote em qual estacionamento deixou o carro e vá com tempo."),
    ("shopping-penha", "Shopping Center Penha", S, "Penha", "Shopping Penha, São Paulo", "Shopping Center Penha", "https://www.shoppingpenha.com.br/",
     "Shopping tradicional da Penha, com lojas, serviços, praça de alimentação e cinema, perto do centro histórico do bairro.",
     "Aproveite para conhecer a Basílica da Penha, um dos marcos da região."),
    ("shopping-metro-itaquera", "Shopping Metrô Itaquera", S, "Itaquera", "Shopping Metrô Itaquera, São Paulo", "Shopping Metrô Itaquera", "https://www.shoppingmetroitaquera.com.br/",
     "Shopping ao lado da estação Corinthians-Itaquera e da Neo Química Arena, com lojas, restaurantes e cinema.",
     "Em dia de jogo do Corinthians a região fica cheia; prefira outro dia ou chegue cedo."),
    ("shopping-central-plaza", "Central Plaza Shopping", S, "Vila Prudente", "Central Plaza Shopping, São Paulo", "Central Plaza Shopping São Paulo", "https://www.centralplaza.com.br/",
     "Shopping na Vila Prudente, perto da Avenida do Estado, com lojas, serviços, alimentação e cinema para a região da Vila Prudente, Mooca e Ipiranga.",
     "Fica perto do monotrilho (Linha 15-Prata) e de vias rápidas."),
]

def get(url, as_json=True):
    r = urllib.request.urlopen(urllib.request.Request(url, headers={"User-Agent": UA}), timeout=30).read()
    return json.loads(r) if as_json else r

CACHE = ROOT / "research" / "cidades" / "spzl-geo.json"
GEO = json.loads(CACHE.read_text()) if CACHE.exists() else {}

def _end(rua, bairro, cep): return ", ".join(x for x in [rua, bairro, "São Paulo - SP", cep] if x)

def _nominatim(q):
    for t in range(3):
        try:
            m = get("https://nominatim.openstreetmap.org/search?format=json&addressdetails=1&limit=1&countrycodes=br&q=" + urllib.parse.quote(q))
            time.sleep(1.5)
            if not m: return None
            a = m[0].get("address", {})
            rua = " ".join(x for x in [a.get("road", ""), a.get("house_number", "")] if x).strip()
            return {"lat": round(float(m[0]["lat"]), 6), "lng": round(float(m[0]["lon"]), 6), "endereco": _end(rua, a.get("suburb") or a.get("neighbourhood") or a.get("quarter") or "", a.get("postcode", ""))}
        except urllib.error.HTTPError as e:
            if e.code != 429: raise
            time.sleep(20 * (t + 1))
    return None

def _photon(q):
    d = get("https://photon.komoot.io/api/?limit=1&lat=-23.55&lon=-46.55&q=" + urllib.parse.quote(q))
    f = (d.get("features") or [None])[0]
    if not f: return None
    p = f["properties"]; lng, lat = f["geometry"]["coordinates"]
    if not (-23.75 < lat < -23.40 and -46.75 < lng < -46.30): return None
    rua = " ".join(x for x in [p.get("street", ""), p.get("housenumber", "")] if x).strip()
    return {"lat": round(lat, 6), "lng": round(lng, 6), "endereco": _end(rua, p.get("district") or p.get("locality") or "", p.get("postcode", ""))}

def geocode(q):
    if q in GEO: return GEO[q]
    g = None
    try: g = _photon(q)
    except Exception as e: print("   photon falhou", type(e).__name__)
    if not g:
        try: g = _nominatim(q)
        except Exception as e: print("   nominatim falhou", type(e).__name__)
    if g: GEO[q] = g; CACHE.write_text(json.dumps(GEO, ensure_ascii=False, indent=1))
    return g

def limpa_txt(s): return re.sub(r"\s+", " ", html.unescape(re.sub(r"<[^>]+>", "", str(s or "")))).strip()

def fotos(termo, pasta, id_):
    q = ("https://commons.wikimedia.org/w/api.php?action=query&generator=search&gsrnamespace=6&gsrlimit=10&prop=imageinfo&iiprop=url|extmetadata|mime&iiurlwidth=1280&format=json&gsrsearch="
         + urllib.parse.quote(termo))
    d = None
    for t in range(4):
        try: d = get(q); break
        except urllib.error.HTTPError as e:
            if e.code != 429: break
            time.sleep(15 * (t + 1))
        except Exception: break
    if not d: print("   commons falhou", id_); return []
    pages = sorted((d.get("query", {}) or {}).get("pages", {}).values(), key=lambda p: p.get("index", 99))
    out = []
    for p in pages:
        ii = (p.get("imageinfo") or [{}])[0]; m = ii.get("extmetadata", {})
        lic = limpa_txt(m.get("LicenseShortName", {}).get("value", ""))
        if ii.get("mime") not in ("image/jpeg", "image/png") or not re.search(r"CC|Public domain|PD", lic, re.I): continue
        if re.search(r"logo|mapa|map|planta|brasão|bandeira", p.get("title", ""), re.I): continue
        url = ii.get("thumburl") or ii.get("url")
        try: bin_ = get(url, False)
        except Exception: continue
        if len(bin_) < 15000: continue
        pasta.mkdir(parents=True, exist_ok=True); arq = pasta / f"{id_}-{len(out) + 1}.jpg"; arq.write_bytes(bin_)
        out.append({"src": str(arq.relative_to(ROOT)), "credito": limpa_txt(m.get("Artist", {}).get("value", "Wikimedia Commons"))[:80] or "Wikimedia Commons", "licenca": lic[:40], "pagina": ii.get("descriptionurl", "")})
        if len(out) >= 3: break
        time.sleep(0.3)
    return out

def main():
    res = []
    ant = {x["id"]: x for x in json.loads((ROOT / "research" / "cidades" / "spzl.json").read_text())} if (ROOT / "research" / "cidades" / "spzl.json").exists() else {}
    for id_, nome, cat, bairro, busca, termo, site, hist, dica in LUGARES:
        g = geocode(busca)
        if not g: print("sem coordenada, fica de fora:", nome); continue
        fs = (ant.get("spzl-" + id_) or {}).get("fotos") or fotos(termo, ROOT / "fotos_cidades" / "spzl" / ("spzl-" + id_), "spzl-" + id_)
        res.append({"id": "spzl-" + id_, "regiaoGuia": "spzl", "nome": nome, "categoria": cat, "tipo": "atracao", "pais": "Brasil", "estado": "SP", "cidade": "São Paulo", "bairro": bairro,
                    "endereco": g["endereco"], "lat": g["lat"], "lng": g["lng"], "site": site, "historia": hist, "dica": dica, "horario": HOR_PARQUE if cat == P else HOR_SHOP,
                    "gratuito": True, "preco": "Entrada gratuita", "fotos": fs, "atualizadoEm": "2026-11"})
        time.sleep(2)
        print(f"{nome:32} {g['lat']:.4f},{g['lng']:.4f}  fotos: {len(fs)}  {g['endereco'][:60]}")
    (ROOT / "research" / "cidades" / "spzl.json").write_text(json.dumps(res, ensure_ascii=False, indent=1))
    print(len(res), "lugares gravados em research/cidades/spzl.json")

if __name__ == "__main__":
    main()
