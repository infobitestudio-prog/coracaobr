#!/usr/bin/env python3
"""Junta research/atracoes.json e research/estabelecimentos.json em data/seed.json
e baixa as fotos (Wikimedia Commons) para img/, redimensionadas.

Uso: python3 tools/build_seed.py [--sem-fotos]
"""
import io, json, os, sys, time, urllib.request
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
HOJE = "2026-11"
UA = "GuiaSeedBuilder/0.1 (static site build; generic client)"

# Notas provisórias de curadoria (1 a 5), para o guia não nascer vazio. O dono confirma no Painel.
NOTAS = json.loads((ROOT / "tools" / "notas_provisorias.json").read_text()) if (ROOT / "tools" / "notas_provisorias.json").exists() else {}


def baixar(url, destino, largura=1100):
    from PIL import Image
    if destino.exists():
        return True
    for tentativa in range(3):
        try:
            req = urllib.request.Request(url, headers={"User-Agent": UA})
            dados = urllib.request.urlopen(req, timeout=40).read()
            im = Image.open(io.BytesIO(dados)).convert("RGB")
            if im.width > largura:
                im = im.resize((largura, round(im.height * largura / im.width)), Image.LANCZOS)
            destino.parent.mkdir(parents=True, exist_ok=True)
            im.save(destino, "JPEG", quality=78, optimize=True, progressive=True)
            return True
        except Exception as e:  # noqa: BLE001
            print("  falhou", url[:90], type(e).__name__, str(e)[:60])
            time.sleep(4 * (tentativa + 1))
    return False


def meia(n):
    return max(1.0, min(5.0, round(float(n) * 2) / 2))


def main():
    com_fotos = "--sem-fotos" not in sys.argv
    lugares = []
    atr = json.loads((ROOT / "research" / "atracoes.json").read_text())
    for a in atr:
        fotos = []
        for i, im in enumerate((a.get("imagens") or [])[:2]):
            nome = f"img/{a['id']}-{i + 1}.jpg"
            if com_fotos and baixar(im["url"], ROOT / nome):
                fotos.append({"src": nome, "credito": (im.get("autor") or "Wikimedia Commons")[:60], "licenca": im.get("licenca", ""), "pagina": im.get("pagina", "")})
                time.sleep(1.2)
        lugares.append({
            "id": a["id"], "tipo": "atracao", "nome": a["nome"], "categoria": a.get("categoria", ""),
            "cidade": a.get("cidade", "Dallas"), "bairro": a.get("bairro", ""), "endereco": a.get("endereco", ""),
            "lat": a.get("lat"), "lng": a.get("lng"), "gratuito": bool(a.get("gratuito")),
            "preco": a.get("preco", ""), "precoMin": a.get("preco_min_usd") or 0,
            "precoConfirmado": bool(a.get("preco_confirmado", False)), "fontePreco": a.get("fonte_preco", ""),
            "horario": a.get("horario", ""), "site": a.get("site", ""), "historia": a.get("historia", ""),
            "dica": a.get("dica", ""), "tempoVisita": a.get("tempo_visita", ""),
            "notaCuradoria": meia(NOTAS.get(a["id"], 4.0)), "notaProvisoria": True,
            "fotos": fotos, "menu": [], "atualizadoEm": HOJE, "publicado": True, "brasileiro": False,
        })
    est = json.loads((ROOT / "research" / "estabelecimentos.json").read_text())
    vistos = {l["id"] for l in lugares}
    for e in est:
        if e["id"] in vistos:  # já entrou como ponto turístico
            continue
        ext = e.get("nota_externa") or {}
        nota = NOTAS.get(e["id"], ext.get("nota") or 4.0)
        menu = [{"secao": m.get("secao", ""), "item": m.get("item", ""), "descricao": m.get("descricao", ""), "preco": m.get("preco_usd")} for m in (e.get("menu") or [])[:10]]
        lugares.append({
            "id": e["id"], "tipo": "estabelecimento", "nome": e["nome"], "categoria": e.get("categoria", ""),
            "brasileiro": bool(e.get("brasileiro")), "cidade": e.get("cidade", "Dallas"), "bairro": e.get("bairro", ""),
            "endereco": e.get("endereco", ""), "lat": e.get("lat"), "lng": e.get("lng"),
            "telefone": e.get("telefone", ""), "site": e.get("site", ""), "instagram": e.get("instagram", ""),
            "horario": e.get("horario", ""), "faixaPreco": e.get("faixa_preco", ""), "historia": e.get("descricao", ""),
            "dica": e.get("dica", ""), "menu": menu, "fonteMenu": e.get("fonte_menu", ""),
            "menuVerificadoEm": e.get("menu_verificado_em", "") if menu else "",
            "notaCuradoria": meia(nota), "notaProvisoria": True, "gratuito": False,
            "fotos": [], "atualizadoEm": HOJE, "publicado": True,
        })
    ids = [l["id"] for l in lugares]
    assert len(ids) == len(set(ids)), "ids repetidos"
    out = {"versao": f"{HOJE}-{len(lugares)}-{int(time.time())}", "lugares": lugares}
    (ROOT / "data").mkdir(exist_ok=True)
    (ROOT / "data" / "seed.json").write_text(json.dumps(out, ensure_ascii=False, indent=1))
    print(len(lugares), "lugares;", sum(1 for l in lugares if l["fotos"]), "com foto")


if __name__ == "__main__":
    main()
