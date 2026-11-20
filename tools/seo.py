#!/usr/bin/env python3
"""Páginas estáticas para o Google: uma por categoria × cidade (e por categoria em toda a DFW), com lista dos lugares,
dados estruturados (ItemList) e links para o guia. Também grava guia/paginas.json, usado pelo sitemap.xml do servidor.
Uso: gerar(destino, lugares, hoje) a partir do pacote_local.py."""
import html, json, re, unicodedata
from pathlib import Path

CATS = {
    "museu": "Museus", "parque": "Parques", "historico": "Lugares históricos", "mirante": "Mirantes", "bairro": "Bairros para conhecer", "esporte": "Esportes",
    "familia": "Passeios em família", "compras": "Compras", "arte": "Arte", "natureza": "Natureza",
    "restaurante-brasileiro": "Restaurantes brasileiros", "churrascaria": "Churrascarias", "padaria": "Padarias brasileiras",
    "mercado-brasileiro": "Mercados brasileiros", "acai-cafe": "Açaí e café", "bbq": "Texas BBQ", "tex-mex": "Tex-Mex",
    "steakhouse": "Steakhouses", "hamburguer": "Hambúrguer", "brunch-cafe": "Brunch e café", "servico": "Consulado e documentos",
    "comida-sulista": "Comida sulista", "asiatico": "Restaurantes asiáticos", "pizza": "Pizzarias", "bar": "Bares", "mercado": "Mercados",
    "evento": "Eventos", "show": "Casas de shows", "governo": "Prefeitura e órgãos públicos", "transporte": "Transporte", "saude": "Hospitais", "comunidade": "Comunidade brasileira",
    "handyman": "Handyman e reparos", "baba": "Babás e cuidadores", "piscina": "Manutenção de piscinas", "limpeza": "Limpeza", "jardinagem": "Jardinagem",
    "construcao": "Construção e reforma", "mudanca": "Mudanças e fretes", "mecanico": "Mecânicos", "beleza": "Beleza e estética", "contador": "Contadores e impostos",
    "imigracao": "Imigração e advogados", "imoveis": "Imóveis", "seguros": "Seguros", "aulas": "Aulas e escolas", "fotografia": "Foto e eventos", "pet": "Pets",
    "saude-pt": "Saúde em português", "outros-servicos": "Outros serviços", "hotel": "Hotéis e hospedagem",
}
CSS = (":root{color-scheme:light dark;--bg:#F6F8F6;--card:#fff;--ink:#0E1311;--mut:#5A6560;--line:#E3E7E4;--ac:#0B7A35;--deep:#04341A;--sun:#FFC20E}"
       "@media (prefers-color-scheme:dark){:root{--bg:#0B0F0D;--card:#131816;--ink:#EEF2F0;--mut:#9AA5A0;--line:#252C29;--ac:#34C46A}}"
       "*{box-sizing:border-box}body{margin:0;background:var(--bg);color:var(--ink);font:16px/1.55 system-ui,-apple-system,Segoe UI,Roboto,sans-serif}"
       "a{color:var(--ac)}.w{max-width:920px;margin:0 auto;padding:0 16px}header{background:var(--deep);color:#fff;padding:14px 0}"
       "header a{color:#fff;text-decoration:none;font-weight:800;font-size:1.2rem}header b{color:var(--sun)}"
       "h1{font-size:clamp(1.6rem,4vw,2.3rem);line-height:1.15;margin:28px 0 8px}.sub{color:var(--mut);margin:0 0 20px;max-width:62ch}"
       ".l{display:grid;gap:12px;padding:0;list-style:none}.c{background:var(--card);border:1px solid var(--line);border-radius:16px;padding:16px 18px}"
       ".c h2{font-size:1.15rem;margin:0 0 4px}.c p{margin:4px 0;color:var(--mut)}.c .n{color:var(--ink);font-weight:700}"
       ".bt{display:inline-block;margin-top:8px;background:var(--ac);color:#fff;text-decoration:none;font-weight:700;padding:9px 14px;border-radius:12px}"
       ".tags{display:flex;flex-wrap:wrap;gap:8px;padding:0;list-style:none}.tags a{display:inline-block;padding:6px 12px;border:1px solid var(--line);border-radius:999px;background:var(--card);text-decoration:none;color:var(--ink);font-size:.9rem}"
       ".cta{margin:28px 0;padding:18px;border-radius:16px;background:var(--deep);color:#fff}.cta a{color:var(--sun);font-weight:800}"
       "footer{color:var(--mut);font-size:.85rem;padding:24px 0 40px}")


def slug(t):
    t = unicodedata.normalize("NFD", str(t or "")).encode("ascii", "ignore").decode().lower()
    return re.sub(r"[^a-z0-9]+", "-", t).strip("-")


def nota(l):
    for k in ("notaCuradoria", "nota", "notaProvisoria"):
        try:
            v = float(l.get(k) or 0)
            if v > 0:
                return v
        except (TypeError, ValueError):
            pass
    return 0.0


def pagina(destino, rel, titulo, desc, h1, sub, itens, links, raiz):
    e = html.escape
    lista = []
    for i, l in enumerate(itens, 1):
        n = nota(l)
        lista.append('<li class="c"><h2>%d. %s</h2><p class="n">%s%s</p>%s%s<a class="bt" href="%s#lugar-%s">Ver no CoraçãoBR</a></li>' % (
            i, e(l["nome"]), e(", ".join(x for x in (l.get("bairro"), l.get("cidade")) if x)), (" · ★ %.1f" % n) if n else "",
            ('<p>%s</p>' % e(l["endereco"])) if l.get("endereco") else "",
            ('<p>%s</p>' % e(re.sub(r"\s+", " ", str(l.get("historia") or l.get("descricao") or ""))[:220])) if (l.get("historia") or l.get("descricao")) else "",
            raiz, e(str(l["id"]))))
    ld = {"@context": "https://schema.org", "@type": "ItemList", "name": h1,
          "itemListElement": [{"@type": "ListItem", "position": i, "name": l["nome"]} for i, l in enumerate(itens, 1)]}
    corpo = ('<!doctype html><html lang="pt-BR"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">'
             '<title>%s</title><meta name="description" content="%s"><meta property="og:title" content="%s"><meta property="og:description" content="%s">'
             '<meta property="og:type" content="website"><meta property="og:locale" content="pt_BR"><link rel="icon" href="%sicon-192.png"><style>%s</style>'
             '<script type="application/ld+json">%s</script></head><body><header><div class="w"><a href="%s">Coração<b>BR</b></a></div></header>'
             '<main class="w"><h1>%s</h1><p class="sub">%s</p><ol class="l">%s</ol>'
             '<div class="cta">Mapa, horários, avaliações de brasileiros e cupons: <a href="%s">abra o guia CoraçãoBR</a>.</div>%s</main>'
             '<footer class="w">CoraçãoBR · o guia dos brasileiros em Dallas–Fort Worth, Texas. Informações conferidas pela equipe; confirme horários antes de ir.</footer></body></html>') % (
        e(titulo), e(desc), e(titulo), e(desc), raiz, CSS, json.dumps(ld, ensure_ascii=False).replace("</", "<\\/"), raiz, e(h1), e(sub), "".join(lista), raiz, links)
    p = destino / rel
    p.mkdir(parents=True, exist_ok=True)
    (p / "index.html").write_text(corpo)


def gerar(destino, lugares, hoje):
    destino = Path(destino)
    ok = [l for l in lugares if l.get("nome") and l.get("publicado", True) is not False and not l.get("demo") and l.get("categoria") in CATS
          and not (l.get("categoria") in ("evento", "show") and str(l.get("dataFim") or l.get("dataInicio") or "9999") < hoje and l.get("categoria") == "evento")]
    por_cat, por_cid_cat, por_cid = {}, {}, {}
    for l in ok:
        por_cat.setdefault(l["categoria"], []).append(l)
        if l.get("cidade"):
            por_cid_cat.setdefault((l["cidade"], l["categoria"]), []).append(l)
            por_cid.setdefault(l["cidade"], []).append(l)
    ordena = lambda xs: sorted(xs, key=lambda l: (-nota(l), l["nome"]))
    paginas = []
    # por categoria em toda a DFW
    cats_ok = [c for c, xs in por_cat.items() if len(xs) >= 2]
    for c in cats_ok:
        xs = ordena(por_cat[c])[:40]
        cids = sorted({l["cidade"] for l in xs if l.get("cidade") and len(por_cid_cat.get((l["cidade"], c), [])) >= 2})
        links = ('<h2>%s por cidade</h2><ul class="tags">%s</ul>' % (html.escape(CATS[c]), "".join('<li><a href="../%s/%s/">%s</a></li>' % (slug(ci), slug(c), html.escape(ci)) for ci in cids))) if cids else ""
        links += '<h2>Mais no guia</h2><ul class="tags">%s</ul>' % "".join('<li><a href="../%s/">%s</a></li>' % (slug(o), html.escape(CATS[o])) for o in sorted(cats_ok, key=lambda k: CATS[k]) if o != c)
        rel = "guia/%s/" % slug(c)
        pagina(destino, rel, "%s em Dallas–Fort Worth, Texas · CoraçãoBR" % CATS[c], "%s em Dallas–Fort Worth escolhidos para brasileiros: %s e mais. Endereço, nota e dicas em português." % (CATS[c], ", ".join(l["nome"] for l in xs[:3])),
               "%s em Dallas–Fort Worth" % CATS[c], "%d opções em DFW, com nota, endereço e dicas em português, do guia CoraçãoBR." % len(xs), xs, links, "../../")
        paginas.append(rel)
    # por cidade × categoria (só quando há pelo menos 2 lugares, para não criar páginas vazias)
    for (ci, c), xs in por_cid_cat.items():
        if len(xs) < 2 or c not in cats_ok:
            continue
        xs = ordena(xs)[:40]
        outras = sorted({k for (cc, k), ys in por_cid_cat.items() if cc == ci and k != c and len(ys) >= 2 and k in cats_ok}, key=lambda k: CATS[k])
        links = '<p><a href="../../%s/">Ver %s em toda a DFW →</a></p>' % (slug(c), html.escape(CATS[c].lower()))
        if outras:
            links += '<h2>Mais em %s</h2><ul class="tags">%s</ul>' % (html.escape(ci), "".join('<li><a href="../%s/">%s</a></li>' % (slug(k), html.escape(CATS[k])) for k in outras))
        rel = "guia/%s/%s/" % (slug(ci), slug(c))
        pagina(destino, rel, "%s em %s, Texas · CoraçãoBR" % (CATS[c], ci), "%s em %s (TX) para brasileiros: %s. Nota, endereço e dicas em português." % (CATS[c], ci, ", ".join(l["nome"] for l in xs[:3])),
               "%s em %s, Texas" % (CATS[c], ci), "%d opções em %s, com nota, endereço e dicas em português." % (len(xs), ci), xs, links, "../../../")
        paginas.append(rel)
    # índice
    e = html.escape
    idx = '<h2>Categorias</h2><ul class="tags">%s</ul>' % "".join('<li><a href="%s/">%s</a></li>' % (slug(c), e(CATS[c])) for c in sorted(cats_ok, key=lambda k: CATS[k]))
    for ci in sorted(por_cid, key=lambda k: -len(por_cid[k])):
        ks = sorted([k for (cc, k), ys in por_cid_cat.items() if cc == ci and len(ys) >= 2 and k in cats_ok], key=lambda k: CATS[k])
        if ks:
            idx += '<h2>%s</h2><ul class="tags">%s</ul>' % (e(ci), "".join('<li><a href="%s/%s/">%s</a></li>' % (slug(ci), slug(k), e(CATS[k])) for k in ks))
    top = ordena(ok)[:10]
    pagina(destino, "guia/", "Guia dos brasileiros em Dallas–Fort Worth · CoraçãoBR", "Restaurantes brasileiros, mercados, eventos, serviços em português e passeios em Dallas–Fort Worth, Texas.",
           "Guia dos brasileiros em Dallas–Fort Worth", "Os lugares mais bem avaliados do CoraçãoBR e todas as categorias por cidade.", top, idx, "../")
    paginas.insert(0, "guia/")
    (destino / "guia" / "paginas.json").write_text(json.dumps(paginas, ensure_ascii=False))
    return paginas
