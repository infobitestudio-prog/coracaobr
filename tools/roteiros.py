#!/usr/bin/env python3
"""Gera js/roteiros-dados.js: roteiros prontos por cidade do guia (DFW, Houston, Austin, San Antonio).

Usa os lugares reais da base (localização, categoria, tempo de visita, preço, horário, dica) e monta roteiros por tema
com paradas PERTO umas das outras: cada salto entre paradas tem limite de distância e a ordem evita ida e volta.
Para cada parada guarda o horário sugerido de chegada e quanto tempo ficar; o site calcula o resto (trajeto, preço, se está aberto).
Rode de novo sempre que a base crescer:  python3 tools/roteiros.py
"""
import json, math, re, random
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
L = [l for l in json.loads((ROOT / "data" / "seed.json").read_text())["lugares"] if l.get("lat") and l.get("publicado", True) is not False]
CID = {
    "dfw": ("Dallas–Fort Worth", 32.7767, -96.797, 60), "houston": ("Houston", 29.7604, -95.3698, 55),
    "austin": ("Austin", 30.2672, -97.7431, 45), "sanantonio": ("San Antonio", 29.4241, -98.4936, 45),
}
def mi(a, b):
    R = 3958.8; la1, la2 = math.radians(a["lat"]), math.radians(b["lat"]); dl = la2 - la1; dg = math.radians(b["lng"] - a["lng"])
    h = math.sin(dl / 2) ** 2 + math.cos(la1) * math.cos(la2) * math.sin(dg / 2) ** 2
    return 2 * R * math.asin(math.sqrt(h))
def regiao(l):
    best = None
    for k, (_, la, lo, raio) in CID.items():
        d = mi(l, {"lat": la, "lng": lo})
        if d <= raio and (best is None or d < best[1]): best = (k, d)
    return best[0] if best else None
for l in L: l["_r"] = regiao(l)

COMIDA = {"restaurante-brasileiro", "churrascaria", "padaria", "acai-cafe", "bbq", "tex-mex", "steakhouse", "hamburguer", "brunch-cafe", "comida-sulista", "asiatico", "pizza", "bar"}
BR = {"restaurante-brasileiro", "churrascaria", "padaria", "acai-cafe", "mercado-brasileiro"}
NAO_ROTEIRO = {"servico", "governo", "transporte", "saude", "comunidade", "igreja", "hotel", "evento"}
def txt(l): return (l.get("nome", "") + " " + l.get("historia", "") + " " + l.get("categoria", "")).lower()
def kw(l, *ws): t = txt(l); return any(w in t for w in ws)
def visita_min(l):
    t = str(l.get("tempoVisita") or "").lower().replace("–", "-").replace("—", "-")
    m = None
    if "dia inteiro" in t or "o dia todo" in t: m = 300
    elif "meio dia" in t or "meio-dia" in t: m = 210
    else:
        hm = re.search(r"(\d+)\s*h\s*(\d{2})", t)
        if hm: m = int(hm.group(1)) * 60 + int(hm.group(2))
        else:
            n = [float(x.replace(",", ".")) for x in re.findall(r"\d+(?:[.,]\d+)?", t)][:2]
            if n:
                v = sum(n) / len(n)
                m = int(v) if re.search(r"\bmin", t) and not re.search(r"\d\s*h(?:ora)?", t) else int(v * 60)
    if m is None:
        c = l.get("categoria")
        m = {"museu": 120, "arte": 90, "parque": 75, "natureza": 90, "historico": 45, "mirante": 45, "bairro": 90, "compras": 120, "familia": 120,
             "esporte": 120, "show": 150, "bar": 90, "mercado-brasileiro": 30, "mercado": 40, "padaria": 30, "acai-cafe": 30}.get(c, 75 if c in COMIDA else 60)
    return max(20, min(m, 240))
def pontos(l):
    s = 1.0 + (1 if l.get("fotos") else 0) + (0.6 if l.get("historia") else 0) + (0.5 if l.get("dica") else 0) + (0.4 if l.get("tempoVisita") else 0)
    s += 1.2 if l.get("categoria") in BR or l.get("brasileiro") else 0
    s += (float(l.get("notaCuradoria") or 0) - 4) * 0.6 if not l.get("notaProvisoria") else 0
    return s

TEMAS = [
    # id, nome do tema, filtro, refeição no meio?, paradas (min, max), salto máximo (mi), início, sub
    ("essencial", "em 1 dia", lambda l: l["categoria"] in {"historico", "museu", "mirante", "bairro", "parque", "arte"} and l["tipo"] == "atracao", True, (5, 6), 6, "9h", "O essencial, na ordem certa e sem ida e volta"),
    ("gratis", "sem gastar com entrada", lambda l: l["tipo"] == "atracao" and l.get("gratuito") and l["categoria"] not in NAO_ROTEIRO, True, (5, 6), 6, "9h", "Um dia inteiro só com lugares gratuitos"),
    ("criancas", "com crianças", lambda l: l["categoria"] in {"familia", "parque", "museu", "natureza"} and (l["categoria"] in {"familia", "parque"} or kw(l, "kids", "crian", "children", "zoo", "aquar", "science", "ciência", "dinos", "natural")), True, (4, 5), 9, "9h30", "Ciência, bichos, parque e pausa para lanche"),
    ("brasil", "com sabor do Brasil", lambda l: l["categoria"] in BR or (l.get("brasileiro") and l["categoria"] in COMIDA), False, (4, 5), 9, "10h", "Padaria, açaí, mercado e almoço brasileiro"),
    ("arte", "de arte e museus", lambda l: l["categoria"] in {"museu", "arte"}, True, (4, 5), 6, "10h", "Os melhores acervos, com almoço perto"),
    ("natureza", "ao ar livre", lambda l: l["categoria"] in {"parque", "natureza", "mirante"}, True, (4, 5), 9, "8h30", "Parques, trilhas e mirantes antes do calor"),
    ("historia", "de história", lambda l: l["categoria"] in {"historico", "museu"} and kw(l, "histór", "histor", "missão", "mission", "1800", "18", "19", "memorial", "capitólio", "capitol", "kennedy", "alamo"), True, (4, 6), 6, "9h", "Do passado do Texas aos marcos da cidade"),
    ("compras", "de compras", lambda l: l["categoria"] in {"compras", "mercado", "mercado-brasileiro"}, True, (3, 5), 12, "10h", "Shoppings, outlets e mercado brasileiro"),
    ("noite", "à noite", lambda l: l["categoria"] in {"bar", "show", "mirante", "bairro", "steakhouse", "tex-mex", "bbq"} or kw(l, "noite", "night", "live music", "música ao vivo", "pôr do sol", "sunset"), False, (3, 4), 5, "17h30", "Pôr do sol, jantar e música ao vivo"),
    ("texas", "raiz texana", lambda l: l["categoria"] in {"bbq", "tex-mex", "steakhouse", "comida-sulista", "historico", "esporte"} or kw(l, "cowboy", "rodeo", "rodeio", "stockyard", "western", "texano", "texas"), False, (4, 5), 8, "10h", "Churrasco texano, cowboys e Tex-Mex"),
    ("cafe", "de cafés e brunch", lambda l: l["categoria"] in {"brunch-cafe", "acai-cafe", "padaria", "bairro", "parque"}, False, (4, 5), 4, "8h30", "Manhã sem pressa: café, brunch e passeio leve"),
]
COMER = lambda l: l["categoria"] in COMIDA and l["categoria"] not in {"bar"}
LEVE = {"padaria", "acai-cafe", "mercado-brasileiro", "brunch-cafe", "mercado"}
REFEICAO = lambda l: l["categoria"] in COMIDA and l["categoria"] not in LEVE and l["categoria"] != "bar"

def rota_de(seed, cands, nmin, nmax, salto, usados):
    r = [seed]; pool = [c for c in cands if c["id"] != seed["id"]]
    while len(r) < nmax:
        ult = r[-1]; viz = sorted([c for c in pool if c["id"] not in {x["id"] for x in r}], key=lambda c: mi(ult, c) - pontos(c) * 0.35)
        viz = [c for c in viz if mi(ult, c) <= salto and not (REFEICAO(c) and sum(1 for x in r if REFEICAO(x)) >= 2)]
        if not viz: break
        r.append(viz[0])
    return r if len(r) >= nmin else None
def ordena(r):
    # começa pela ponta (mais longe do centro) e segue sempre para a mais perto: evita ida e volta
    cx = sum(p["lat"] for p in r) / len(r); cy = sum(p["lng"] for p in r) / len(r)
    ini = max(r, key=lambda p: mi(p, {"lat": cx, "lng": cy})); out = [ini]; rest = [p for p in r if p is not ini]
    while rest: n = min(rest, key=lambda p: mi(out[-1], p)); out.append(n); rest.remove(n)
    return out
def comprimento(r): return sum(mi(a, b) for a, b in zip(r, r[1:]))
def com_refeicao(r, regiao_l, usados_ref):
    if any(p["categoria"] in COMIDA for p in r): return r
    meio = len(r) // 2; alvo = r[meio - 1]
    op = sorted([l for l in regiao_l if COMER(l)], key=lambda l: mi(alvo, l) - (1.5 if l["categoria"] in BR or l.get("brasileiro") else 0) - pontos(l) * 0.2)
    op = [l for l in op if mi(alvo, l) <= 4 and l["id"] not in usados_ref]
    if not op: return r
    usados_ref.add(op[0]["id"])
    return r[:meio] + [op[0]] + r[meio:]
def hhmm(m): return f"{m // 60}h" + (f"{m % 60:02d}" if m % 60 else "")
def agenda(r, ini):
    h, mm = re.match(r"(\d+)h(\d*)", ini).groups(); t = int(h) * 60 + int(mm or 0); out = []
    for i, p in enumerate(r):
        if i: d = mi(r[i - 1], p); t += int(round(d * 1.35 / 24 * 60 + 6))   # carro, com folga para estacionar
        v = visita_min(p)
        if p["categoria"] in COMIDA and 11 * 60 <= t <= 14 * 60: v = max(v, 70)
        out.append({"id": p["id"], "chega": hhmm(t), "fica": v}); t += v
    return out, t

def frase(nome_cid, tema, r):
    n = [p["nome"] for p in r]; comida = [p for p in r if p["categoria"] in COMIDA]
    base = {
        "essencial": f"Comece por {n[0]} e siga para {n[1]}, sempre com o próximo endereço a poucos minutos.",
        "gratis": f"Tudo de graça: de {n[0]} a {n[-1]}, um dia inteiro sem pagar entrada.",
        "criancas": f"Pensado para os pequenos: {n[0]} para gastar energia e {n[1]} para aprender brincando.",
        "brasil": f"Matar a saudade sem sair de {nome_cid}: {', '.join(n[:-1])} e {n[-1]}.",
        "arte": f"Arte de primeira linha em sequência: {n[0]}, {n[1]} e mais, com pausa para comer no meio.",
        "natureza": f"Saia cedo para aproveitar a sombra: {n[0]} abre o dia e {n[-1]} fecha com vista.",
        "historia": f"A história da cidade contada em ordem: de {n[0]} até {n[-1]}.",
        "compras": f"Roteiro de compras sem atravessar a cidade toda: {', '.join(n)}.",
        "noite": f"Fim de tarde em {n[0]} e noite seguindo para {n[-1]}.",
        "texas": f"O Texas de verdade: {n[0]}, {n[1]} e o melhor da comida local.",
        "cafe": f"Manhã tranquila: café em {n[0]} e passeio leve até {n[-1]}.",
    }[tema]
    if comida and tema not in ("brasil", "cafe", "noite", "texas"): base += f" A refeição fica em {comida[0]['nome']}."
    return base
DICAS = {
    "essencial": ["Saia antes das 9h para pegar os museus vazios.", "Estacionamentos do centro cobram por hora; anote onde parou."],
    "gratis": ["Leve garrafa de água: quase todos os lugares têm bebedouro.", "Fins de semana têm mais movimento nos parques; durante a semana é mais tranquilo."],
    "criancas": ["Leve lanche e protetor solar.", "Muitos museus infantis têm entrada grátis ou reduzida em dias específicos; confira na página do lugar."],
    "brasil": ["Pergunte pelos produtos do dia na padaria: pão de queijo sai quentinho cedo.", "Mercados brasileiros aceitam encomenda por WhatsApp."],
    "arte": ["Vários museus têm uma noite por mês com entrada gratuita.", "Guarda-volumes costuma ser gratuito na entrada."],
    "natureza": ["Comece cedo: depois das 11h o calor do Texas pesa, principalmente no verão.", "Repelente ajuda perto de lagos e rios."],
    "historia": ["Visitas guiadas gratuitas acontecem em horários fixos; chegue 15 minutos antes.", "Use calçado confortável: há trechos a pé."],
    "compras": ["Leve o passaporte: alguns shoppings dão cupom de desconto para turistas.", "O imposto (sales tax) é somado no caixa, não está no preço da etiqueta."],
    "noite": ["Reserve o jantar com antecedência nas sextas e sábados.", "Combine a volta: Uber e Lyft ficam mais caros depois das 23h."],
    "texas": ["Churrascarias texanas famosas formam fila antes de abrir; chegue cedo.", "Muitos lugares vendem até acabar a carne do dia."],
    "cafe": ["Brunch nos fins de semana enche entre 10h e 13h.", "Bom roteiro para o dia seguinte à chegada, com jet lag."],
}
def gera():
    out = []; vistos = []; rnd = random.Random(7); nomes = {m[2] for m in MANUAIS}
    for k, (nome_cid, *_rest) in CID.items():
        reg = [l for l in L if l["_r"] == k and l["categoria"] not in NAO_ROTEIRO]
        principal = nome_cid.split("–")[0]
        for tid, tnome, filt, refeicao, (nmin, nmax), salto, ini, sub in TEMAS:
            cands = [l for l in reg if filt(l)]
            if len(cands) < nmin: continue
            seeds = sorted(cands, key=lambda l: -pontos(l))[:14]
            feitos = 0; usados_ref = set()
            for s in seeds:
                r = rota_de(s, cands, nmin, nmax, salto, set())
                if not r: continue
                r = ordena(r)
                if refeicao: r = com_refeicao(r, reg, usados_ref)
                ids = {p["id"] for p in r}
                if any(len(ids & v) / len(ids | v) > 0.5 for v in vistos): continue
                vistos.append(ids); feitos += 1
                ag, fim = agenda(r, ini); lim = 23 * 60 if tid == 'noite' else 20 * 60
                while fim > lim and len(r) > nmin: r = r[:-1]; ag, fim = agenda(r, ini)
                bairros = [p.get("bairro") or p.get("cidade") for p in r]; area = max(set(bairros), key=bairros.count)
                nome = (f"{principal} {tnome}" if feitos == 1 else f"{area.split('/')[0].strip()} {tnome}")
                if nome in nomes: nome = f"{area.split('/')[0].strip()} {tnome}"
                if nome in nomes: nome = f"{tnome[0].upper() + tnome[1:]}: {r[0]['nome'].split(' (')[0]} e arredores"
                if nome in nomes: nome = f"{nome} · {feitos}"
                nomes.add(nome)
                km = comprimento(r)
                out.append({"id": f"{k}-{tid}-{feitos}", "regiao": k, "tema": tid, "nome": nome, "sub": sub, "texto": frase(principal, tid, r),
                            "inicio": ini, "fim": hhmm(fim), "distMi": round(km, 1), "area": area, "dicas": DICAS[tid], "paradas": ag})
                if feitos >= (3 if tid in ("essencial", "gratis", "brasil") else 2): break
    return out

MANUAIS = [  # os 5 roteiros escritos à mão continuam (com horários)
    ("dallas-em-1-dia", "essencial", "Dallas em 1 dia", "O essencial do centro, a pé e de carro", "Comece pela história de Kennedy, atravesse o centro pelos bois de bronze, almoce churrasco texano em Deep Ellum e feche com o pôr do sol do alto da torre.", ["sixth-floor-museum", "dealey-plaza", "pioneer-plaza", "pecan-lodge", "klyde-warren-park", "dallas-museum-of-art", "reunion-tower"], "9h"),
    ("dallas-de-graca", "gratis", "Dallas sem gastar com entrada", "Um dia inteiro só com lugares gratuitos", "Praças históricas, um museu de arte de primeira linha, o parque sobre a rodovia e um fim de tarde no bairro mais charmoso da cidade.", ["dealey-plaza", "jfk-memorial-plaza", "thanks-giving-square", "dallas-museum-of-art", "klyde-warren-park", "katy-trail", "bishop-arts-district"], "9h"),
    ("com-criancas", "criancas", "Fim de semana com crianças", "Ciência, bichos e parque", "Dois dias pensados para os pequenos: museu interativo e parque no primeiro, aquário e zoológico no segundo.", ["perot-museum", "klyde-warren-park", "dallas-world-aquarium", "dallas-zoo", "dallas-arboretum"], "9h30"),
    ("fort-worth-em-1-dia", "texas", "Fort Worth em 1 dia", "Cowboys de manhã, museus à tarde", "Chegue cedo para ver o desfile do gado no Stockyards, almoce Tex-Mex no pátio mais famoso da cidade e passe a tarde entre arte e jardins.", ["fort-worth-stockyards", "joe-t-garcias", "kimbell-art-museum", "fort-worth-botanic-garden", "fort-worth-water-gardens"], "10h"),
    ("dia-de-compras", "compras", "Dia de compras", "Shoppings e outlet", "Do shopping com obras de arte ao outlet com as marcas mais procuradas pelos brasileiros. Leve o passaporte para pedir os cupons de visitante.", ["northpark-center", "highland-park-village", "galleria-dallas", "allen-premium-outlets"], "10h"),
]
POR_ID = {l["id"]: l for l in L}
def manuais():
    out = []
    for rid, tema, nome, sub, texto, ids, ini in MANUAIS:
        r = [POR_ID[i] for i in ids if i in POR_ID]
        if len(r) < 2: continue
        if rid == "com-criancas":   # fim de semana: dia 1 (museu + parque) e dia 2 (aquário, zoológico, jardim)
            a1, _f1 = agenda(r[:2], ini); a2, fim = agenda(r[2:], ini)
            for x in a1: x["dia"] = 1
            for x in a2: x["dia"] = 2
            ag = a1 + a2
        else: ag, fim = agenda(r, ini)
        out.append({"id": rid, "regiao": "dfw", "tema": tema, "nome": nome, "sub": sub, "texto": texto, "inicio": ini, "fim": hhmm(fim), "distMi": round(comprimento(r), 1),
                    "area": "Dallas", "dicas": DICAS[tema], "paradas": ag, "destaque": True})
    return out

if __name__ == "__main__":
    tudo = manuais() + gera()
    js = "/* Roteiros prontos: gerados por tools/roteiros.py a partir da base de lugares (paradas perto umas das outras). Não edite à mão. */\nwindow.ROTEIROS_DADOS = " + json.dumps(tudo, ensure_ascii=False, separators=(",", ":")) + ";\n"
    (ROOT / "js" / "roteiros-dados.js").write_text(js)
    from collections import Counter
    print(len(tudo), "roteiros ·", dict(Counter(r["regiao"] for r in tudo)), "·", dict(Counter(r["tema"] for r in tudo)))
    print("salto máximo entre paradas:", max(max((mi(POR_ID[a["id"]], POR_ID[b["id"]]) for a, b in zip(r["paradas"], r["paradas"][1:])), default=0) for r in tudo).__round__(1), "mi")
    for r in tudo[:3] + tudo[-3:]: print(" -", r["id"], "|", r["nome"], "|", len(r["paradas"]), "paradas |", r["inicio"], "→", r["fim"], "|", r["distMi"], "mi")
