import os, json, re
M='/home/user/guia-texas/marca/'
def svgf(n): return open(M+'final/svg/'+n+'.svg').read()
def logo(n='coracaobr-logo', w=None, style=''):
    s=svgf(n); s=re.sub(r' width="\d+" height="\d+"','',s,1)
    return s.replace('<svg ','<svg class="lg" style="%s%s" '%(('width:%s;'%w) if w else '',style),1)
CORES=[('Verde Floresta','#024E25','Wordmark "Coração", títulos e fundos institucionais'),
 ('Verde Bandeira','#0AA23C','Coração do símbolo, botões e destaques'),
 ('Verde Mata','#078A35','Check do símbolo, sombras e estados'),
 ('Amarelo Ouro','#FFBC04','"BR" do wordmark e laço do símbolo'),
 ('Areia','#F5F3EC','Fundo claro de páginas e cartões'),
 ('Grafite','#1B1F1D','Texto corrido e fundos escuros')]
def rgb(h): h=h.lstrip('#'); return tuple(int(h[i:i+2],16) for i in (0,2,4))
def cmyk(h):
    r,g,b=[x/255 for x in rgb(h)]; k=1-max(r,g,b)
    if k>=1: return (0,0,0,100)
    return tuple(round(100*x) for x in ((1-r-k)/(1-k),(1-g-k)/(1-k),(1-b-k)/(1-k),k))
CSS='''
@page{size:1600px 900px;margin:0}
*{box-sizing:border-box;margin:0;padding:0}
:root{--vf:#024E25;--vb:#0AA23C;--vm:#078A35;--am:#FFBC04;--ar:#F5F3EC;--gr:#1B1F1D;--mu:#5C6661}
body{font:400 20px/1.5 "DM Sans",system-ui,sans-serif;color:var(--gr);background:#ddd}
.pg{width:1600px;height:900px;position:relative;overflow:hidden;background:#fff;page-break-after:always;padding:84px 104px}
.pg.ar{background:var(--ar)} .pg.vf{background:var(--vf);color:#fff} .pg.gr{background:var(--gr);color:#fff}
.ey{font:700 15px "Outfit";letter-spacing:.16em;text-transform:uppercase;color:var(--vm)} .vf .ey,.gr .ey{color:var(--am)}
h1{font:700 76px/1.02 "Outfit";letter-spacing:-.02em;color:var(--vf)} .vf h1,.gr h1{color:#fff}
h2{font:700 50px/1.08 "Outfit";letter-spacing:-.015em;color:var(--vf);margin:10px 0 22px} .vf h2,.gr h2{color:#fff}
h3{font:700 24px/1.2 "Outfit";color:var(--vf);margin-bottom:6px} .vf h3,.gr h3{color:#fff}
p{max-width:62ch} .lead{font-size:25px;line-height:1.45;color:var(--mu);max-width:52ch} .vf .lead,.gr .lead{color:rgba(255,255,255,.78)}
.mu{color:var(--mu)} .vf .mu,.gr .mu{color:rgba(255,255,255,.65)} .sm{font-size:15px} .xs{font-size:13px}
.ft{position:absolute;left:104px;right:104px;bottom:40px;display:flex;justify-content:space-between;font:500 13px "DM Sans";color:var(--mu);letter-spacing:.04em}
.vf .ft,.gr .ft{color:rgba(255,255,255,.55)}
.g2{display:grid;grid-template-columns:1fr 1fr;gap:56px} .g3{display:grid;grid-template-columns:repeat(3,1fr);gap:28px} .g4{display:grid;grid-template-columns:repeat(4,1fr);gap:24px}
.card{background:#fff;border:1px solid #E4E2DA;border-radius:14px;padding:26px} .ar .card{background:#fff} .vf .card{background:rgba(255,255,255,.07);border-color:rgba(255,255,255,.14)}
.kpi b{display:block;font:700 64px/1 "Outfit";color:var(--vf);letter-spacing:-.02em} .vf .kpi b{color:#fff} .kpi span{display:block;margin-top:8px;color:var(--mu);font-size:17px;line-height:1.35} .vf .kpi span{color:rgba(255,255,255,.7)}
.kpi small{display:block;margin-top:6px;font-size:12px;color:#8A938E}
.tag{display:inline-block;font:600 13px "DM Sans";padding:4px 10px;border-radius:99px;background:#E7F4EB;color:var(--vm)}
ul.li{list-style:none} ul.li li{padding:10px 0 10px 30px;position:relative;border-bottom:1px solid #E6E4DC} ul.li li:before{content:"";position:absolute;left:4px;top:19px;width:12px;height:7px;border-left:3px solid var(--vb);border-bottom:3px solid var(--vb);transform:rotate(-45deg)}
.vf ul.li li{border-color:rgba(255,255,255,.14)}
.lg{display:block;height:auto}
.src{font-size:12px;color:#8A938E;line-height:1.4}
.shot{border-radius:26px;box-shadow:0 18px 50px rgba(0,0,0,.18);display:block}
.num{font:700 15px "Outfit";color:var(--am);background:var(--vf);width:34px;height:34px;border-radius:50%;display:grid;place-items:center;flex:none}
'''
FONTS='<link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Outfit:wght@400;500;600;700;800&family=DM+Sans:opsz,wght@9..40,400;9..40,500;9..40,600;9..40,700&family=Fraunces:opsz,wght@9..144,400;9..144,500&display=swap">'
def doc(title, pages): return '<!doctype html><html lang="pt-BR"><head><meta charset="utf-8"><title>%s</title>%s<style>%s</style></head><body>%s</body></html>'%(title,FONTS,CSS,''.join(pages))
def ft(sec,n,cls=''): return '<div class="ft"><span>CoraçãoBR · %s</span><span>%02d</span></div>'%(sec,n)
