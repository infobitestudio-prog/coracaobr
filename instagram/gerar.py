#!/usr/bin/env python3
"""Gera instagram/posts.html: 10 posts em retrato (1080 x 1350) sobre as funcionalidades do CoraçãoBR.
As telas vêm de apresentacao/telas e as fotos do próprio guia. Uso: python3 instagram/gerar.py"""
from pathlib import Path
import re

ROOT = Path(__file__).resolve().parent.parent
logo = open(ROOT / "index.html").read()
i = logo.index('<svg class="bsym"'); LOGO = logo[i:logo.index("</svg>", i) + 6].replace('class="bsym"', 'class="lg"')

IC = {
    "check": '<path d="M4.5 12.5l4.5 4.5L19.5 6.5"/>',
    "pin": '<path d="M12 21s-7-6.2-7-11.5A7 7 0 0 1 19 9.5C19 14.8 12 21 12 21z"/><circle cx="12" cy="9.5" r="2.5"/>',
    "clock": '<circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/>',
    "image": '<rect x="3" y="4" width="18" height="16" rx="3"/><circle cx="9" cy="10" r="2"/><path d="M21 17l-5-5-9 8"/>',
    "menu": '<path d="M5 4h11a3 3 0 0 1 3 3v13H8a3 3 0 0 1-3-3z"/><path d="M9 9h6M9 13h6"/>',
    "star": '<path d="M12 3.5l2.6 5.3 5.9.9-4.3 4.1 1 5.8L12 16.9l-5.2 2.7 1-5.8-4.3-4.1 5.9-.9z"/>',
    "shield": '<path d="M12 3l8 3v6c0 4.5-3.4 8.3-8 9-4.6-.7-8-4.5-8-9V6z"/><path d="M8.5 12l2.5 2.5 4.5-5"/>',
    "bolt": '<path d="M13 2L4 14h7l-1 8 9-12h-7z"/>',
    "pix": '<path d="M12 3l9 9-9 9-9-9z"/><path d="M8 12h8"/>',
    "qr": '<rect x="3" y="3" width="7" height="7" rx="1"/><rect x="14" y="3" width="7" height="7" rx="1"/><rect x="3" y="14" width="7" height="7" rx="1"/><path d="M14 14h3v3M21 14v7h-4M17 21v-2"/>',
    "ticket": '<path d="M3 8a2 2 0 0 0 0 4v4h18v-4a2 2 0 0 1 0-4V4H3z"/><path d="M13 5v2M13 11v2M13 17v2"/>',
    "gift": '<rect x="3" y="8" width="18" height="13" rx="2"/><path d="M12 8v13M3 12h18M12 8S10 3 7.5 4.5 9 8 12 8zm0 0s2-5 4.5-3.5S15 8 12 8z"/>',
    "chart": '<path d="M4 20V10M10 20V4M16 20v-7M22 20H2"/>',
    "megafone": '<path d="M3 11v3h3l7 5V6L6 11z"/><path d="M17 9a4 4 0 0 1 0 6"/>',
}
def ic(n, cls="i"): return f'<svg class="{cls}" viewBox="0 0 24 24">{IC[n]}</svg>'

def fone(img, style, cls="", escuro=False, topo0=False):
    return (f'<div class="fone {cls}" style="{style}"><div class="bz"><div class="tela"><span class="ilha"></span>'
            f'<div class="sb{" esc" if escuro else ""}"><span>9:41</span><i></i></div>'
            f'<img class="shot{" topo0" if topo0 else ""}" src="../apresentacao/telas/{img}.jpg" alt=""></div></div></div>')

def topo(n): return f'<header class="topo"><span class="marca">{LOGO}<span>Coração<b>BR</b></span></span><span class="num">{n:02d} / 10</span></header>'
def pe(cta="Link na bio", cid="O guia dos brasileiros no Texas"): return f'<footer class="pe"><span class="cta">{ic("pin")} {cta}</span>' + (f'<span class="cid">{cid}</span>' if cid else "") + "</footer>"
def txt(eb, h1, sub=""): return f'<div class="txt"><span class="eb">{eb}</span><h1>{h1}</h1>' + (f'<p class="sub">{sub}</p>' if sub else "") + "</div>"

posts = []

# 1 · Quatro cidades
posts.append(f'''<section class="post" id="p1">{topo(1)}<span class="anel"></span>
{txt("Agora em 4 cidades", "Seu guia brasileiro no <em>Texas inteiro.</em>", "Escolha a cidade uma vez. O guia lembra e mostra o que está perto de você.")}
<div class="cids">
<div class="cid"><img src="../img/hero/klyde-warren-park-m.jpg" alt=""><span><b>Dallas–Fort Worth</b><small>414 LUGARES</small></span></div>
<div class="cid"><img src="../fotos_cidades/houston/hou-buffalo-bayou-park/hou-buffalo-bayou-park-1.jpg" alt=""><span><b>Houston</b><small>100 LUGARES</small></span></div>
<div class="cid"><img src="../fotos_cidades/austin/aus-texas-state-capitol/aus-texas-state-capitol-1.jpg" alt=""><span><b>Austin</b><small>100 LUGARES</small></span></div>
<div class="cid"><img src="../fotos_cidades/sanantonio/sat-river-walk/sat-river-walk-1.jpg" alt=""><span><b>San Antonio</b><small>100 LUGARES</small></span></div>
</div>{pe()}</section>''')

# 2 · Explorar e filtros
posts.append(f'''<section class="post claro" id="p2">{topo(2)}<span class="anel"></span>
{txt("Explorar", "Ache em segundos quem <em>fala português.</em>", "Restaurantes, serviços, passeios e eventos com filtros que entendem o brasileiro.")}
{fone("05-filtros", "right:70px; top:470px;", "inclina2")}
<span class="tag" style="left:72px; top:560px;"><span class="ok">{ic("check")}</span>Fala português</span>
<span class="tag" style="left:110px; top:690px;"><span class="ok">{ic("check")}</span>Aberto agora</span>
<span class="tag sol" style="left:72px; top:820px;"><span class="ic" style="background:rgba(27,21,0,.1);color:#1B1500">{ic("star")}</span>Melhor nota primeiro</span>
<span class="tag verde" style="left:130px; top:950px;">714 lugares no guia</span>
{pe(cid="")}</section>''')

# 3 · Ficha completa
posts.append(f'''<section class="post sol" id="p3">{topo(3)}<span class="anel"></span>
{txt("Ficha do lugar", "Tudo sobre o lugar <em>numa tela só.</em>", "Fotos com zoom, horário, como chegar, cardápio e avaliações de quem foi.")}
{fone("20-austin-ficha", "left:60px; top:575px;", "inclina")}
<div class="lista" style="left:600px; top:640px;">
<div><i>{ic("image")}</i>Fotos com zoom</div><div><i>{ic("clock")}</i>Aberto agora?</div><div><i>{ic("pin")}</i>Como chegar</div><div><i>{ic("menu")}</i>Cardápio</div><div><i>{ic("star")}</i>Avaliações reais</div>
</div><footer class="pe" style="justify-content:flex-end"><span class="cta">{ic("pin")} Link na bio</span></footer></section>''')

# 4 · Assistente com IA
posts.append(f'''<section class="post tinta" id="p4">{topo(4)}<span class="anel"></span>
{txt("Pergunte ao CoraçãoBR", "Pergunte do seu jeito. <em>O guia responde.</em>")}
{fone("09-assistente", "right:50px; top:430px; width:430px; height:915px;", "inclina2")}
<div class="chat" style="top:470px; width:540px;">
<div class="bal eu">Onde comer churrasco brasileiro?</div>
<div class="bal ela">Separei as <b>churrascarias</b> mais bem avaliadas perto de você:
<ul><li>Fogo de Chão <i>Uptown</i></li><li>Texas de Brazil <i>Addison</i></li><li>Chama Gaúcha <i>Grapevine</i></li></ul></div>
<div class="bal eu">E tem evento brasileiro no fim de semana?</div>
</div>{pe(cid="")}</section>''')

# 5 · Clube
posts.append(f'''<section class="post" id="p5">{topo(5)}<span class="anel"></span>
{txt("Clube CoraçãoBR", "Desconto nos negócios brasileiros com a <em>carteirinha no celular.</em>")}
<div class="cart" style="top:560px;"><div class="ct"><span class="mk">Coração<b>BR</b></span><em>CLUBE</em></div>
<div class="cm"><div><small>Membro</small><b>Seu nome aqui</b><small>Nº 00000000 · válido até 12/2026</small></div><div class="qr" data-qr="https://coracaobr/clube"></div></div></div>
<span class="preco" style="right:72px; top:470px;"><span><small>Só</small><b>R$ 15</b><small>por mês</small></span></span>
<div class="lista" style="top:1010px;"><div><i>{ic("check")}</i>QR validado na hora pelo comerciante</div><div><i>{ic("check")}</i>Descontos exclusivos nos parceiros</div><div><i>{ic("check")}</i>Pix, sem renovação automática</div></div>
{pe()}</section>''')

# 6 · Comunidade
posts.append(f'''<section class="post claro" id="p6">{topo(6)}<span class="anel"></span>
{txt("Comunidade", "A comunidade brasileira <em>num lugar só.</em>", "Mural de vagas e aluguel, pets perdidos e perguntas de quem já passou por isso.")}
{fone("18-mural", "left:40px; top:610px; width:330px; height:700px; border-radius:58px; padding:7px;", "inclina")}
{fone("11-pets", "left:375px; top:560px; width:330px; height:700px; border-radius:58px; padding:7px; z-index:3;")}
{fone("12-perguntas", "left:710px; top:610px; width:330px; height:700px; border-radius:58px; padding:7px;", "inclina2")}
<span class="tag sol" style="left:72px; top:540px; z-index:5;">Mural</span>
<span class="tag sol" style="left:470px; top:490px; z-index:5;">Pets</span>
<span class="tag sol" style="right:72px; top:540px; z-index:5;">Perguntas</span>
</section>''')

# 7 · Alertas
posts.append(f'''<section class="post sol" id="p7">{topo(7)}<span class="anel"></span>
{txt("Alertas no celular", "Nunca mais perca a <em>festa brasileira.</em>", "Escolha os temas que você curte. O aviso chega na tela do celular.")}
{fone("14-alertas", "right:72px; top:560px;", "inclina2")}
<div class="notif" style="top:640px; width:600px;"><span class="ap">{LOGO}</span><div><span class="l1"><span>CoraçãoBR</span><span>agora</span></span><b>Fim de semana brasileiro em DFW</b><p>5 eventos neste fim de semana. Veja a programação.</p></div></div>
<div class="lista" style="top:920px;"><div><i>{ic("check")}</i>Rodeio, shows e futebol</div><div><i>{ic("check")}</i>Festas brasileiras</div><div><i>{ic("check")}</i>Primeiros 30 dias</div></div>
{pe(cid="")}</section>''')

# 8 · Mapa e metrô
posts.append(f'''<section class="post" id="p8">{topo(8)}<span class="anel"></span>
{txt("Mapa e metrô", "Veja no mapa o que está <em>perto de você.</em>", "Tempo de carro, a pé ou de bike. Em Dallas, o metrô DART com linhas e estações.")}
{fone("07-mapa", "left:72px; top:560px;", "inclina")}
{fone("08-metro", "right:72px; top:610px; z-index:3;", "inclina2")}
<footer class="pe" style="bottom:auto; top:500px; justify-content:flex-end; display:none"></footer></section>''')

# 9 · Anuncie
posts.append(f'''<section class="post tinta" id="p9">{topo(9)}<span class="anel"></span>
{txt("Para empresas", "Seu negócio na frente de quem <em>fala português.</em>")}
<div class="planos" style="top:470px; width:500px;">
<div class="plano sol"><small>Pacote mensal</small><b>R$ 50 <span>= 3 anúncios</span></b><p>Pacotes somam: R$ 100 = 6 anúncios.</p></div>
<div class="plano"><small>Pagamento</small><p><b style="font-size:44px;margin:0">Pix na hora</b>Confirmação automática e aviso antes de vencer.</p></div>
<div class="plano"><small>Inclui</small><p>Até 20 fotos, banner, WhatsApp e redes, pin verde no mapa, feed e mural.</p></div>
</div>
{fone("16-anuncie", "right:40px; top:470px; width:410px; height:872px;", "inclina2")}
{pe("Anuncie: link na bio", "")}</section>''')

# 10 · Ferramentas do anunciante
posts.append(f'''<section class="post claro" id="p10">{topo(10)}<span class="anel"></span>
{txt("Ferramentas do anunciante", "Mais clientes com <em>poucos cliques.</em>")}
<div class="grade">
<div class="fer dest"><span class="ic">{ic("shield")}</span><b>Selo Verificado</b><span>A equipe confere o negócio.</span><em>R$ 30</em></div>
<div class="fer"><span class="ic">{ic("bolt")}</span><b>Impulsionar</b><span>Topo das listas por 7 dias.</span><em>R$ 25</em></div>
<div class="fer"><span class="ic">{ic("qr")}</span><b>QR Avalie-nos</b><span>O cliente avalia no balcão.</span></div>
<div class="fer"><span class="ic">{ic("ticket")}</span><b>Cupom com QR</b><span>Oferta para quem vem pelo guia.</span></div>
<div class="fer"><span class="ic">{ic("chart")}</span><b>Painel e relatório</b><span>Visitas, rotas e contatos do mês.</span></div>
<div class="fer dest"><span class="ic">{ic("gift")}</span><b>Indique e ganhe</b><span>50% de desconto em 1 pacote.</span></div>
</div>
{pe("Anuncie: link na bio")}</section>''')

html = ('<!doctype html><html lang="pt-BR"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">'
        '<title>CoraçãoBR · posts do Instagram</title>'
        '<link rel="preconnect" href="https://fonts.googleapis.com"><link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>'
        '<link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Bricolage+Grotesque:opsz,wght@12..96,600;12..96,800&family=Inter:wght@400;500;600;700;800&display=swap">'
        '<link rel="stylesheet" href="posts.css"></head><body>\n' + "\n".join(posts) +
        '\n<script src="https://cdnjs.cloudflare.com/ajax/libs/qrcode-generator/1.4.4/qrcode.min.js"></script>'
        '<script>document.querySelectorAll("[data-qr]").forEach(function(e){try{var q=qrcode(0,"M");q.addData(e.dataset.qr);q.make();e.innerHTML=q.createSvgTag({cellSize:6,margin:0,scalable:true});}catch(x){}});</script>'
        '</body></html>')
html = html.replace(".lg", ".lg")
(ROOT / "instagram" / "posts.html").write_text(html)
print("ok", len(posts), "posts")
