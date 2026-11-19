#!/usr/bin/env python3
"""Diversifica as fotos ilustrativas: várias imagens por categoria, distribuídas em rodízio para que cards vizinhos
não repitam. Eventos sem foto própria usam a foto do local onde acontecem (quando ele tem foto real)."""
import json, math, sys, time
from pathlib import Path
sys.path.insert(0, str(Path(__file__).resolve().parent))
import build_seed2 as B
ROOT = B.ROOT
POOLS = {
    "churrascaria": ["Churrasco", "Picanha", "Rodízio", "Farofa", "Caipirinha", "Chimichurri", "Linguiça", "Feijoada"],
    "restaurante-brasileiro": ["Feijoada", "Brazilian cuisine", "Pão de queijo", "Coxinha", "Brigadeiro", "Moqueca", "Pastel (food)", "Acarajé"],
    "bbq": ["Brisket", "Barbecue in Texas", "Burnt ends", "Pulled pork", "Spare ribs", "Smoked meat", "Barbecue sauce", "Coleslaw"],
    "tex-mex": ["Enchilada", "Fajita", "Nachos", "Chile con queso", "Breakfast taco", "Tamale", "Chili con carne", "Guacamole"],
    "steakhouse": ["Steakhouse", "Ribeye", "T-bone steak", "Filet mignon", "Porterhouse steak", "Baked potato", "Creamed spinach"],
    "hamburguer": ["Hamburger", "Cheeseburger", "French fries", "Milkshake", "Onion ring", "Bacon cheeseburger"],
    "brunch-cafe": ["Pancake", "Waffle", "Eggs Benedict", "Biscuits and gravy", "Cappuccino", "Latte", "French toast", "Avocado toast"],
    "acai-cafe": ["Açaí na tigela", "Smoothie bowl", "Espresso", "Cappuccino"],
    "padaria": ["Doughnut", "Kolache", "Pecan pie", "Croissant", "Cinnamon roll"],
    "comida-sulista": ["Fried chicken", "Chicken fried steak", "Biscuit (bread)", "Macaroni and cheese", "Cornbread", "Collard greens"],
    "asiatico": ["Ramen", "Sushi", "Dim sum", "Korean barbecue", "Pho", "Bibimbap", "Xiaolongbao"],
    "pizza": ["Pizza", "Neapolitan pizza", "Pizza Margherita", "Pepperoni"],
    "bar": ["Beer", "Craft beer", "Cocktail", "Margarita", "Brewery", "Michelada", "Beer garden"],
    "compras": ["Shopping mall", "Outlet store", "Supermarket", "Department store", "Shopping cart", "Grocery store"],
    "mercado": ["Supermarket", "Grocery store", "Farmers' market", "Produce"],
    "mercado-brasileiro": ["Pão de queijo", "Guaraná Antarctica", "Brigadeiro", "Requeijão", "Farofa", "Coxinha"],
    "governo": ["City hall", "Courthouse", "Texas State Capitol", "Seal of Texas", "Town hall", "Government building"],
    "saude": ["Hospital", "Emergency department", "Ambulance", "Physician", "Nursing"],
    "transporte": ["Light rail", "Airport", "Intercity bus service", "Train station", "Commuter rail"],
    "comunidade": ["Library", "Public library", "Church (building)", "Community centre"],
    "servico": ["Passport", "Consulate", "Visa (document)"],
    "evento": ["Festival", "Parade", "Fireworks", "Marathon", "Rodeo", "Christmas lights", "Hot air balloon festival", "Oktoberfest", "Street fair"],
    "show": ["Concert", "Theatre", "Opera house", "Stand-up comedy", "Rock concert", "Country music", "Nightclub", "Symphony orchestra"],
    "parque": ["Urban park", "Trail", "Lake", "Picnic", "Nature reserve"],
    "museu": ["Museum", "Art museum", "Art gallery", "Natural history museum"],
    "familia": ["Amusement park", "Water park", "Roller coaster", "Aquarium", "Zoo"],
    "natureza": ["Lupinus texensis", "Texas Hill Country", "Nature reserve", "Lake"],
    "esporte": ["Stadium", "American football", "Baseball park", "Golf course"],
    "historico": ["Historic district", "Courthouse square", "Texas Historical Commission"],
    "bairro": ["Downtown Dallas", "Main street", "Street art"],
    "arte": ["Sculpture garden", "Public art", "Mural"],
    "mirante": ["Downtown Dallas", "Skyline"],
}
seed = json.loads((ROOT / "data" / "seed.json").read_text()); L = seed["lugares"]
def km(a, b):
    r = math.pi / 180
    return 6371 * 2 * math.asin(math.sqrt(math.sin((b["lat"] - a["lat"]) * r / 2) ** 2 + math.cos(a["lat"] * r) * math.cos(b["lat"] * r) * math.sin((b["lng"] - a["lng"]) * r / 2) ** 2))
reais = [l for l in L if l.get("fotos") and not l["fotos"][0].get("ilustrativa") and l.get("lat") is not None and l["categoria"] != "evento"]
ilus = [l for l in L if l.get("fotos") and l["fotos"][0].get("ilustrativa")]
# 1) eventos: foto do local onde acontecem
n_ev = 0
for l in ilus:
    if l["categoria"] == "evento" and l.get("lat") is not None:
        perto = sorted(reais, key=lambda r: km(l, r))
        if perto and km(l, perto[0]) < 1.0:
            f = dict(perto[0]["fotos"][0]); f["ilustrativa"] = True; l["fotos"] = [f]; l["_feito"] = True; n_ev += 1
print(n_ev, "eventos com foto do local", flush=True)
# 2) pools por categoria
cats = sorted({l["categoria"] for l in ilus if not l.get("_feito")})
mapa = {f"{c}|{t}": t for c in cats for t in POOLS.get(c, [])}
achados = B.fotos_por_titulo(mapa)
print(len(achados), "de", len(mapa), "imagens encontradas", flush=True)
pool = {}
for k, r in sorted(achados.items()):
    c = k.split("|")[0]; i = len(pool.get(c, [])) + 1
    dest = ROOT / "img" / f"ilustra-{c}-{i}.jpg"
    if B.baixa(r["url"], dest):
        pool.setdefault(c, []).append({"src": f"img/ilustra-{c}-{i}.jpg", "credito": r["autor"], "licenca": r["licenca"], "pagina": r["pagina"], "ilustrativa": True, "_url": r["url"]})
# evita a mesma imagem duas vezes na mesma categoria
for c in pool:
    vist, uni = set(), []
    for f in pool[c]:
        if f["_url"] not in vist: vist.add(f["_url"]); uni.append(f)
    pool[c] = [{k: v for k, v in f.items() if k != "_url"} for f in uni]
print({c: len(v) for c, v in pool.items()}, flush=True)
n = 0
for c in cats:
    if len(pool.get(c, [])) < 2:
        continue
    grupo = sorted([l for l in ilus if l["categoria"] == c and not l.get("_feito")], key=lambda l: (-(l.get("notaCuradoria") or 0), l["nome"]))
    for i, l in enumerate(grupo):
        l["fotos"] = [dict(pool[c][i % len(pool[c])])]; n += 1
for l in L:
    l.pop("_feito", None)
seed["versao"] = f"{B.HOJE}-{len(L)}-{int(time.time())}"
(ROOT / "data" / "seed.json").write_text(json.dumps(seed, ensure_ascii=False, indent=1))
print(n, "lugares com foto ilustrativa variada", flush=True)
