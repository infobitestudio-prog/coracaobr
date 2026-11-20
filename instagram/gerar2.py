#!/usr/bin/env python3
"""Gera instagram/posts-fotos.html: 10 posts em retrato (1080 x 1350) SEM aparelho, com foto em alta e a funcionalidade em destaque.
Usa as fotos em alta de instagram/fotos/ (Wikimedia Commons, com crédito); se faltar, usa a foto do guia."""
import json, sys
from pathlib import Path
ROOT = Path(__file__).resolve().parent.parent
sys.path.insert(0, str(ROOT / "instagram"))
import gerar as g  # reaproveita logo, ícones, topo, rodapé

F = ROOT / "instagram" / "fotos"
CRED = json.loads((F / "creditos.json").read_text()) if (F / "creditos.json").exists() else {}
RESERVA = {
    "dallas": ("../img/hero/klyde-warren-park.jpg", "Klyde Warren Park, Dallas"),
    "houston": ("../fotos_cidades/houston/hou-buffalo-bayou-park/hou-buffalo-bayou-park-1.jpg", "Michael Barera · CC BY-SA 4.0"),
    "austin": ("../fotos_cidades/austin/aus-texas-state-capitol/aus-texas-state-capitol-2.jpg", "Daderot · CC0"),
    "sanantonio": ("../fotos_cidades/sanantonio/sat-river-walk/sat-river-walk-1.jpg", "Mikael Häggström · CC0"),
    "churrasco": ("../img/fogo-de-chao-uptown-dallas-1.jpg", "Mariordo Mario Roberto Duran Ortiz · CC BY-SA 3.0"),
    "rodeio": ("../fotos_eventos/fort-worth-stock-show-rodeo/fort-worth-stock-show-rodeo-2.jpg", "Maciej Kraus · CC BY 2.0"),
    "rodeio2": ("../fotos_eventos/fort-worth-stock-show-rodeo/fort-worth-stock-show-rodeo-1.jpg", "Hu Nhu · CC BY-SA 4.0"),
    "dancando": ("../fotos_eventos/billy-bobs-texas/billy-bobs-texas-1.jpg", "Wikiicaro · CC BY-SA 4.0"),
    "lago": ("../img/hero/white-rock-lake.jpg", "White Rock Lake, Dallas"),
    "mural": ("../fotos_cidades/austin/aus-jos-coffee-south-congress/aus-jos-coffee-south-congress-2.jpg", "Lars Plougmann · CC BY-SA 2.0"),
    "cafe": ("../fotos_cidades/austin/aus-jos-coffee-south-congress/aus-jos-coffee-south-congress-1.jpg", "Tom Purves · CC BY 2.0"),
    "aeroporto": ("../img/dfw-international-airport-1.jpg", "Todd MacDonald · CC BY 2.0"),
    "ruas": ("../img/bishop-arts-district-1.jpg", "Michael Barera · CC BY-SA 4.0"),
    "padaria": ("../img/deep-ellum-2.jpg", "Joe Mabel · CC BY-SA 3.0"),
    "barton": ("../fotos_cidades/austin/aus-barton-springs-pool/aus-barton-springs-pool-1.jpg", "Ligocsicnarf89 · CC BY 4.0"),
}
def foto(k):
    if (F / (k + ".jpg")).exists():
        c = CRED.get(k, {})
        return "fotos/" + k + ".jpg", (c.get("autor", "") + (" · " + c["licenca"] if c.get("licenca") else "")).strip(" ·") or RESERVA[k][1]
    return RESERVA[k]
def bg(k, pos="center"):
    src, cr = foto(k)
    return f'<div class="bg"><img src="{src}" alt="" style="object-position:{pos}"></div>', f'<span class="cred">Foto: {cr}</span>'

ic, topo, pe, txt, LOGO = g.ic, g.topo, g.pe, g.txt, g.LOGO
CK = f'<i>{ic("check")}</i>'
posts = []

# 1 · 4 cidades
m = ""
for k, nome, n in [("dallas", "Dallas–Fort Worth", "414"), ("houston", "Houston", "100"), ("austin", "Austin", "100"), ("sanantonio", "San Antonio", "100")]:
    src, _ = foto(k); m += f'<div><img src="{src}" alt=""><span>{nome}<small>{n} LUGARES</small></span></div>'
creds = " · ".join(foto(k)[1].split(" · ")[0] for k in ("houston", "austin", "sanantonio"))
posts.append(f'''<section class="post foto" id="f1"><div class="mosaico">{m}</div><div class="vu" style="background:linear-gradient(180deg,rgba(3,18,10,.85),rgba(3,18,10,0) 26%,rgba(3,18,10,0) 74%,rgba(3,18,10,.9))"></div>{topo(1)}
<div class="selo4"><span><b>4</b><small>cidades<br>do Texas</small></span></div>
{pe("714 lugares · link na bio", "")}<span class="cred">Fotos: {creds} e outros (Wikimedia Commons)</span></section>''')

# 2 · Churrascaria / Explorar com filtros
b, cr = bg("churrasco")
posts.append(f'''<section class="post foto" id="f2">{b}<div class="vu"></div>{topo(2)}
{txt("Explorar", "Bateu saudade de um <em>churrasco de verdade?</em>")}
<div class="txt baixo" style="bottom:300px"><p class="sub" style="margin:0">35 churrascarias no guia, com nota, horário e como chegar.</p></div>
<div class="chips" style="left:72px; bottom:150px;"><span class="chip sol">{ic("check")} Fala português</span><span class="chip">{ic("clock")} Aberto agora</span><span class="chip">{ic("star")} Melhor nota</span><span class="chip">{ic("pin")} Mais perto de mim</span></div>
{pe(cid="")}{cr}</section>''')

# 3 · Eventos e alertas
b, cr = bg("rodeio2")
posts.append(f'''<section class="post foto" id="f3">{b}<div class="vu"></div>{topo(3)}
{txt("Eventos e alertas", "Rodeio, shows e <em>festa brasileira.</em>", "Escolha o que você curte. O aviso chega no seu celular.")}
<div class="vidro branco" style="left:72px; right:72px; bottom:170px; padding:28px 30px; display:flex; gap:22px; align-items:flex-start; border-radius:34px;">
<span style="width:84px;height:84px;flex:none;border-radius:22px;background:#04341A;display:grid;place-items:center">{LOGO.replace('class="lg"', 'class="lg" style="width:60px"')}</span>
<div style="flex:1"><div style="display:flex;justify-content:space-between;font:600 23px/1 var(--body);color:#5A6560"><span>CoraçãoBR</span><span>agora</span></div>
<b style="display:block;margin-top:10px;font:700 32px/1.25 var(--body)">Fim de semana brasileiro em DFW</b><p style="margin:6px 0 0;font:400 27px/1.35 var(--body);color:#333">78 eventos no guia. Veja o que tem perto de você neste fim de semana.</p></div></div>
{pe(cid="")}{cr}</section>''')

# 4 · Passeios de graça
b, cr = bg("lago")
posts.append(f'''<section class="post foto" id="f4">{b}<div class="vu"></div>{topo(4)}
{txt("Passeios", "Lazer sem gastar nada <em>no Texas.</em>")}
<div class="big" style="left:66px; bottom:170px;">158<small>passeios de graça nas 4 cidades</small></div>
{pe(cid="")}{cr}</section>''')

# 5 · Assistente IA
b, cr = bg("mural", "center 30%")
posts.append(f'''<section class="post foto" id="f5">{b}<div class="vu forte"></div>{topo(5)}
{txt("Pergunte ao CoraçãoBR", "Pergunte do seu jeito. <em>O guia responde.</em>")}
<div class="chat" style="top:560px; left:72px; width:936px;">
<div class="bal eu" style="max-width:640px">Onde tem pão de queijo perto de mim?</div>
<div class="bal ela" style="max-width:760px">Separei padarias e cafés brasileiros perto de você, com horário e como chegar.</div>
<div class="bal eu" style="max-width:640px">E igreja com culto em português?</div>
<div class="bal ela" style="max-width:520px"><b>15 igrejas</b> no guia, nas 4 cidades.</div>
</div>{pe(cid="")}{cr}</section>''')

# 6 · Clube
b, cr = bg("cafe")
posts.append(f'''<section class="post foto" id="f6">{b}<div class="vu forte"></div>{topo(6)}
{txt("Clube CoraçãoBR", "Desconto nos negócios brasileiros com a <em>carteirinha no celular.</em>")}
<div class="cart" style="top:640px; left:72px;"><div class="ct"><span class="mk">Coração<b>BR</b></span><em>CLUBE</em></div>
<div class="cm"><div><small>Membro</small><b>Seu nome aqui</b><small>Nº 00000000 · válido até 12/2026</small></div><div class="qr" data-qr="https://coracaobr/clube"></div></div></div>
<span class="preco" style="right:72px; top:560px;"><span><small>Só</small><b>R$ 15</b><small>por mês</small></span></span>
{pe(cid="")}{cr}</section>''')

# 7 · Recém-chegado
b, cr = bg("aeroporto")
posts.append(f'''<section class="post foto" id="f7">{b}<div class="vu forte"></div>{topo(7)}
{txt("Chegou agora?", "Seus primeiros <em>30 dias no Texas,</em> passo a passo.")}
<div class="vidro ck" style="left:72px; right:240px; top:600px;">
<h3>Primeiros 30 dias</h3>
<div>{CK}Chip de celular e internet</div><div>{CK}Conta no banco</div><div>{CK}Social Security (SSN)</div><div><i class="vazio"></i>Carteira de motorista (DPS)</div><div><i class="vazio"></i>Escola das crianças</div></div>
{pe(cid="")}{cr}</section>''')

# 8 · Comunidade
b, cr = bg("dancando")
posts.append(f'''<section class="post foto" id="f8">{b}<div class="vu"></div>{topo(8)}
{txt("Comunidade", "Brasileiro ajudando <em>brasileiro.</em>")}
<div class="selos" style="left:72px; right:72px; bottom:160px;">
<div class="selo"><span class="ic">{ic("megafone")}</span><div><b>Mural</b><span>Vagas, aluguel de quarto, carona e venda.</span></div></div>
<div class="selo"><span class="ic">{ic("pin")}</span><div><b>Pets perdidos e achados</b><span>Publique de graça. A comunidade espalha.</span></div></div>
<div class="selo"><span class="ic">{ic("menu")}</span><div><b>Perguntas e respostas</b><span>Dúvidas de quem chegou, respostas de quem já passou.</span></div></div>
</div>{pe(cid="")}{cr}</section>''')

# 9 · Anuncie
b, cr = bg("ruas")
posts.append(f'''<section class="post foto" id="f9">{b}<div class="vu lado"></div>{topo(9)}
{txt("Para empresas", "Seu negócio na frente de quem <em>fala português.</em>")}
<div class="etq" style="left:72px; top:640px;"><small>Pacote mensal</small><b>R$ 50</b><span>3 anúncios por mês · pacotes somam</span></div>
<div class="chips" style="left:72px; right:200px; top:960px;"><span class="chip verde">{ic("pix")} Pix na hora</span><span class="chip">{ic("image")} Até 20 fotos</span><span class="chip">{ic("pin")} Pin no mapa</span><span class="chip">{ic("chart")} Painel</span></div>
{pe("Anuncie: link na bio", "")}{cr}</section>''')

# 10 · Ferramentas
b, cr = bg("padaria")
posts.append(f'''<section class="post foto" id="f10">{b}<div class="vu forte"></div>{topo(10)}
{txt("Ferramentas do anunciante", "Mais clientes com <em>poucos cliques.</em>")}
<div class="selos" style="left:72px; right:72px; top:560px;">
<div class="selo vf"><span class="ic">{ic("shield")}</span><div><b>Selo Verificado</b><span>A equipe confere o seu negócio.</span></div><em>R$ 30</em></div>
<div class="selo dq"><span class="ic">{ic("bolt")}</span><div><b>Impulsionar 7 dias</b><span>Topo das listas e etiqueta Destaque.</span></div><em>R$ 25</em></div>
<div class="selo"><span class="ic">{ic("qr")}</span><div><b>QR Avalie-nos e cupom</b><span>O cliente avalia e usa o cupom no balcão.</span></div></div>
<div class="selo"><span class="ic">{ic("gift")}</span><div><b>Indique e ganhe</b><span>50% de desconto em 1 pacote.</span></div></div>
</div>{pe("Anuncie: link na bio", "")}{cr}</section>''')

html = ('<!doctype html><html lang="pt-BR"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">'
        '<title>CoraçãoBR · posts com foto</title>'
        '<link rel="preconnect" href="https://fonts.googleapis.com"><link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>'
        '<link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Bricolage+Grotesque:opsz,wght@12..96,600;12..96,800&family=Inter:wght@400;500;600;700;800&display=swap">'
        '<link rel="stylesheet" href="posts.css"><link rel="stylesheet" href="posts-fotos.css"></head><body>\n' + "\n".join(posts) +
        '\n<script src="https://cdnjs.cloudflare.com/ajax/libs/qrcode-generator/1.4.4/qrcode.min.js"></script>'
        '<script>document.querySelectorAll("[data-qr]").forEach(function(e){try{var q=qrcode(0,"M");q.addData(e.dataset.qr);q.make();e.innerHTML=q.createSvgTag({cellSize:6,margin:0,scalable:true});}catch(x){}});</script>'
        '</body></html>')
(ROOT / "instagram" / "posts-fotos.html").write_text(html)
print("ok", len(posts), "posts com foto")
