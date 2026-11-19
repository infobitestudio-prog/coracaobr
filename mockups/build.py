"""Gera as três propostas da página inicial (v1.html, v2.html, v3.html)."""
I = '../img/'
ICON = {
    'home': '<path d="M3 10.5 12 3l9 7.5V20a1 1 0 0 1-1 1h-5v-6H9v6H4a1 1 0 0 1-1-1z"/>',
    'compass': '<circle cx="12" cy="12" r="9"/><path d="M15.5 8.5l-2 5-5 2 2-5z"/>',
    'star': '<path d="M12 3l2.7 5.6 6.1.8-4.5 4.3 1.1 6.1L12 16.9l-5.4 2.9 1.1-6.1L3.2 9.4l6.1-.8z"/>',
    'user': '<circle cx="12" cy="8" r="4"/><path d="M4 21a8 8 0 0 1 16 0"/>',
    'search': '<circle cx="11" cy="11" r="7"/><path d="M20 20l-3.5-3.5"/>',
    'pin': '<path d="M12 21s7-6.3 7-11.5A7 7 0 0 0 5 9.5C5 14.7 12 21 12 21z"/><circle cx="12" cy="9.5" r="2.5"/>',
    'landmark': '<path d="M3 21h18M5 21V10M19 21V10M9.5 21V10M14.5 21V10M2 10l10-6 10 6z"/>',
    'leaf': '<path d="M5 19c0-8 5-13 14-14 0 9-5 14-13 14zM5 19l7-7"/>',
    'utensils': '<path d="M6 3v7a2 2 0 0 0 4 0V3M8 12v9M16 3c-1.5 1.5-2 4-2 6s.5 3 2 3v9"/>',
    'briefcase': '<path d="M3 8h18v11H3zM9 8V5h6v3"/>',
    'flag': '<path d="M5 21V4M5 4h13l-3 4.5 3 4.5H5"/>',
    'arrow': '<path d="M5 12h14M13 6l6 6-6 6"/>',
    'down': '<path d="M6 9l6 6 6-6"/>',
}


def ic(n, s=22):
    return f'<svg viewBox="0 0 24 24" width="{s}" height="{s}" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round">{ICON[n]}</svg>'


BASE = '''<!doctype html><html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Manrope:wght@400;500;600;700;800&family=DM+Sans:opsz,wght@9..40,400;9..40,500;9..40,600;9..40,700&family=Fraunces:opsz,wght@9..144,400;9..144,500&family=Plus+Jakarta+Sans:wght@400;500;600;700;800&display=swap">
<style>*{box-sizing:border-box;margin:0}body{width:390px;color:#1A1C1B;-webkit-font-smoothing:antialiased}img{display:block;width:100%;height:100%;object-fit:cover}
:root{--g:#163832;--g2:#235347;--bg:#F3F3F1;--card:#fff;--ink:#1A1C1B;--mut:#70756F;--line:#E3E4E0}@CSS@</style></head><body>@BODY@</body></html>'''


def page(name, css, body):
    open(name, 'w').write(BASE.replace('@CSS@', css).replace('@BODY@', body))


P = [('Dallas Arboretum', 'Natureza · East Dallas', '5.0', 'US$ 21,95', 'dallas-arboretum-1'),
     ('Fort Worth Stockyards', 'Histórico · Fort Worth', '5.0', 'Grátis', 'fort-worth-stockyards-2'),
     ('Sixth Floor Museum', 'Museu · Downtown', '5.0', 'US$ 24', 'sixth-floor-museum-1'),
     ('Klyde Warren Park', 'Parque · Uptown', '4.5', 'Grátis', 'klyde-warren-park-1'),
     ('White Rock Lake', 'Parque · East Dallas', '4.5', 'Grátis', 'white-rock-lake-1'),
     ('Bishop Arts District', 'Bairro · Oak Cliff', '4.5', 'Grátis', 'bishop-arts-district-1'),
     ('Deep Ellum', 'Bairro · Dallas', '4.5', 'Grátis', 'deep-ellum-1')]


def rows(ps, cls='l', num=False):
    out = ''
    for i, p in enumerate(ps):
        out += f'<div class="{cls}">' + (f'<u>{i + 1}</u>' if num else '') + f'<div class="t"><img src="{I}{p[4]}.jpg"></div><div><b>{p[0]}</b><span>{p[1]}</span></div><i>★ {p[2]}</i></div>'
    return out


TABS = lambda s: f'<div class="tb"><span class="on">{ic("home", s)}</span><span>{ic("compass", s)}</span><span>{ic("star", s)}</span><span>{ic("user", s)}</span></div>'

# ---------- V1: Calmo ----------
css1 = '''body{font-family:Manrope,sans-serif;background:var(--bg);padding:14px 20px 96px}
.top{display:flex;justify-content:space-between;align-items:center;height:44px}.logo{font-weight:800;letter-spacing:-.02em;font-size:15px}.logo i{font-style:normal;color:var(--g2)}
.av{width:34px;height:34px;border-radius:50%;background:#DADBD7;display:grid;place-items:center;color:#555}
.loc{margin-top:22px;font-size:12px;font-weight:600;color:var(--mut);display:flex;gap:5px;align-items:center}
h1{font-size:34px;line-height:1.05;letter-spacing:-.035em;font-weight:700;margin-top:6px}
.s{margin-top:18px;height:52px;border-radius:16px;background:#E8E9E5;display:flex;align-items:center;gap:10px;padding:0 16px;color:var(--mut);font-size:15px}
.tabs{display:flex;gap:22px;margin-top:22px;font-size:14px;font-weight:600;color:var(--mut);border-bottom:1px solid var(--line)}.tabs span{padding-bottom:11px;white-space:nowrap}.tabs .on{color:var(--ink);box-shadow:0 2px 0 var(--g)}
.hero{margin-top:20px;border-radius:26px;overflow:hidden;position:relative;height:400px}.hero:after{content:"";position:absolute;inset:0;background:linear-gradient(180deg,transparent 45%,rgba(10,14,12,.78))}
.hero div{position:absolute;left:20px;right:20px;bottom:20px;color:#fff;z-index:1}.hero small{font-size:11px;font-weight:700;letter-spacing:.1em;text-transform:uppercase;opacity:.85}
.hero b{display:block;font-size:26px;letter-spacing:-.03em;line-height:1.1;margin:6px 0 8px;font-weight:700}.hero p{font-size:13.5px;opacity:.85}
.pg{position:absolute;top:18px;right:18px;z-index:1;background:rgba(255,255,255,.92);color:var(--ink);font-size:11px;font-weight:700;padding:5px 10px;border-radius:99px}
.h{display:flex;justify-content:space-between;align-items:baseline;margin:30px 0 14px}.h b{font-size:19px;letter-spacing:-.02em}.h span{font-size:13px;color:var(--mut);font-weight:600}
.r{display:grid;grid-template-columns:1fr 1fr;gap:14px}.c .p{aspect-ratio:1/1.15;border-radius:20px;overflow:hidden;position:relative}.c .f{position:absolute;top:10px;left:10px;background:#fff;font-size:10.5px;font-weight:700;padding:4px 9px;border-radius:99px;color:var(--g)}
.c b{display:block;font-size:14.5px;margin-top:10px;letter-spacing:-.01em}.c span{font-size:12.5px;color:var(--mut)}.c em{font-style:normal;color:var(--g2);font-weight:700}
.ad{margin-top:28px;border:1px solid var(--line);border-radius:18px;padding:14px 16px;display:flex;justify-content:space-between;align-items:center;font-size:13.5px;background:#fff}.ad small{display:block;font-size:10px;letter-spacing:.1em;text-transform:uppercase;color:var(--mut);font-weight:700;margin-bottom:2px}
.l{display:flex;gap:14px;align-items:center;padding:12px 0;border-bottom:1px solid var(--line)}.l .t{width:60px;height:60px;border-radius:16px;overflow:hidden;flex:none}.l b{font-size:15px;display:block}.l span{font-size:12.5px;color:var(--mut)}.l i{margin-left:auto;font-style:normal;font-size:13px;font-weight:700;color:var(--g)}
.tb{position:fixed;left:0;right:0;bottom:0;height:74px;background:rgba(255,255,255,.94);border-top:1px solid var(--line);display:flex;justify-content:space-around;align-items:center;color:#A3A7A1}.tb .on{color:var(--g);position:relative}.tb .on:after{content:"";position:absolute;left:50%;bottom:-9px;width:4px;height:4px;border-radius:50%;background:var(--g);margin-left:-2px}'''


def c1(p):
    free = '<span class="f">Grátis</span>' if p[3] == 'Grátis' else ''
    extra = '' if p[3] == 'Grátis' else ' · ' + p[3]
    return f'<div class="c"><div class="p"><img src="{I}{p[4]}.jpg">{free}</div><b>{p[0]}</b><span><em>★ {p[2]}</em> · {p[1].split(" · ")[1]}{extra}</span></div>'


b1 = f'''<div class="top"><div class="logo">guia<i>texas</i>brasil</div><div class="av">{ic("user", 18)}</div></div>
<div class="loc">{ic("pin", 14)} Dallas, Texas</div><h1>Aonde vamos<br>hoje?</h1>
<div class="s">{ic("search", 20)} Museu, churrasco, pão de queijo…</div>
<div class="tabs"><span class="on">Tudo</span><span>Passeios</span><span>De graça</span><span>Comer</span><span>Serviços</span></div>
<div class="hero"><img src="{I}klyde-warren-park-1.jpg"><span class="pg">1 / 3</span><div><small>Destaque da semana</small><b>Klyde Warren Park, o parque sobre a rodovia</b><p>★ 4.5 · Uptown · Grátis</p></div></div>
<div class="h"><b>Mais bem avaliados</b><span>ver todos</span></div><div class="r">{c1(P[0])}{c1(P[1])}</div>
<div class="ad"><div><small>Patrocinado</small><b>Seu negócio aqui</b></div>{ic("arrow", 18)}</div>
<div class="h"><b>De graça</b><span>31 lugares</span></div>{rows(P[4:7])}{TABS(24)}'''
page('v1.html', css1, b1)

# ---------- V2: Imersivo ----------
css2 = '''body{font-family:"DM Sans",sans-serif;background:#F5F5F3;padding-bottom:110px}
.ph{height:560px;position:relative;color:#fff}.ph:after{content:"";position:absolute;inset:0;background:linear-gradient(180deg,rgba(12,16,14,.45) 0,rgba(12,16,14,0) 28%,rgba(12,16,14,.15) 55%,rgba(12,16,14,.8) 100%)}
.ph>*:not(img){position:absolute;z-index:1}.ph>img{position:absolute;inset:0}
.bar{top:16px;left:20px;right:20px;display:flex;justify-content:space-between;align-items:center}.bar b{font-family:Fraunces,serif;font-weight:500;font-size:19px}
.gl{width:42px;height:42px;border-radius:50%;background:rgba(255,255,255,.18);backdrop-filter:blur(14px);display:grid;place-items:center;border:1px solid rgba(255,255,255,.25)}
.tx{left:22px;right:22px;bottom:128px}.tx small{font-size:11px;letter-spacing:.14em;text-transform:uppercase;font-weight:600;opacity:.85;display:flex;gap:6px;align-items:center}
.tx h1{font-family:Fraunces,serif;font-weight:400;font-size:46px;line-height:1;letter-spacing:-.02em;margin-top:10px}
.sr{left:20px;right:20px;bottom:54px;height:56px;border-radius:99px;background:rgba(255,255,255,.2);backdrop-filter:blur(18px);border:1px solid rgba(255,255,255,.3);display:flex;align-items:center;gap:12px;padding:0 20px;font-size:15.5px}
.sh{background:#F5F5F3;border-radius:30px 30px 0 0;margin-top:-30px;position:relative;z-index:2;padding:12px 20px 0}.gr{width:40px;height:4px;border-radius:9px;background:#D0D2CD;margin:0 auto 20px}
.cs{display:flex;justify-content:space-between}.cs div{display:grid;justify-items:center;gap:7px;font-size:11.5px;font-weight:600;color:var(--mut)}.cs span{width:54px;height:54px;border-radius:50%;background:#fff;display:grid;place-items:center;color:#3B403D;box-shadow:0 1px 2px rgba(0,0,0,.05)}.cs .on span{background:var(--g);color:#fff}.cs .on{color:var(--ink)}
.h{display:flex;justify-content:space-between;align-items:baseline;margin:28px 0 14px}.h b{font-family:Fraunces,serif;font-weight:500;font-size:23px;letter-spacing:-.01em}.h span{font-size:13px;color:var(--mut)}
.row{display:flex;gap:12px;margin-right:-20px;overflow:hidden}.o{flex:none;width:200px;height:260px;border-radius:24px;overflow:hidden;position:relative;color:#fff}.o:after{content:"";position:absolute;inset:0;background:linear-gradient(180deg,rgba(0,0,0,.25) 0,transparent 30%,rgba(0,0,0,.72))}
.o>*:not(img){position:absolute;z-index:1}.o>img{position:absolute;inset:0}.o .m{top:12px;left:12px;display:flex;gap:6px}.o .m span{font-size:11px;font-weight:600;background:rgba(255,255,255,.2);backdrop-filter:blur(10px);padding:4px 9px;border-radius:99px}
.o .n{left:14px;right:14px;bottom:14px}.o b{font-family:Fraunces,serif;font-weight:500;font-size:19px;line-height:1.15;display:block}.o small{font-size:12px;opacity:.85}
.bn{margin-top:26px;background:var(--g);color:#DDE8E1;border-radius:24px;padding:22px;position:relative;overflow:hidden}.bn small{font-size:10.5px;letter-spacing:.14em;text-transform:uppercase;opacity:.7;font-weight:600}.bn b{display:block;font-family:Fraunces,serif;font-weight:400;font-size:25px;line-height:1.1;color:#fff;margin:8px 0 10px;max-width:230px}.bn span{font-size:13.5px;display:flex;gap:6px;align-items:center}
.bn i{position:absolute;right:-30px;bottom:-40px;width:150px;height:150px;border-radius:50%;border:26px solid rgba(255,255,255,.07)}
.l{display:flex;gap:14px;align-items:center;background:#fff;border-radius:20px;padding:8px 16px 8px 8px;margin-bottom:10px}.l .t{width:58px;height:58px;border-radius:14px;overflow:hidden;flex:none}.l b{font-size:15px;display:block;font-weight:600}.l span{font-size:12.5px;color:var(--mut)}.l i{margin-left:auto;font-style:normal;font-size:13px;font-weight:600}
.tb{position:fixed;left:50%;bottom:22px;transform:translateX(-50%);height:62px;padding:0 10px;border-radius:99px;background:rgba(28,30,29,.92);display:flex;gap:6px;align-items:center;color:#9A9F9A;box-shadow:0 12px 30px rgba(0,0,0,.25)}.tb span{width:54px;height:44px;display:grid;place-items:center;border-radius:99px}.tb .on{background:var(--g2);color:#fff}'''


def o2(p):
    return f'<div class="o"><img src="{I}{p[4]}.jpg"><div class="m"><span>★ {p[2]}</span><span>{p[3]}</span></div><div class="n"><b>{p[0]}</b><small>{p[1]}</small></div></div>'


b2 = f'''<div class="ph"><img src="{I}white-rock-lake-1.jpg"><div class="bar"><b>Guia Texas Brasil</b><span class="gl">{ic("user", 19)}</span></div>
<div class="tx"><small>{ic("pin", 14)} Dallas, Texas</small><h1>Dallas em<br>português.</h1></div>
<div class="sr">{ic("search", 20)} Para onde?</div></div>
<div class="sh"><div class="gr"></div><div class="cs">
<div class="on"><span>{ic("compass")}</span>Tudo</div><div><span>{ic("landmark")}</span>Passeios</div><div><span>{ic("leaf")}</span>De graça</div><div><span>{ic("utensils")}</span>Comer</div><div><span>{ic("briefcase")}</span>Serviços</div></div>
<div class="h"><b>Mais bem avaliados</b><span>ver todos</span></div><div class="row">{o2(P[0])}{o2(P[1])}</div>
<div class="bn"><i></i><small>Sem pagar entrada</small><b>31 passeios de graça em Dallas</b><span>Ver a lista {ic("arrow", 16)}</span></div>
<div class="h"><b>Perto do centro</b><span>ver todos</span></div>{rows((P[2], P[3], P[6]))}</div>{TABS(22)}'''
page('v2.html', css2, b2)

# ---------- V3: Mosaico ----------
css3 = '''body{font-family:"Plus Jakarta Sans",sans-serif;background:#EFEFED;padding:14px 16px 100px}
.top{display:flex;justify-content:space-between;align-items:center;height:48px}.lc small{display:block;font-size:11px;color:var(--mut);font-weight:600}.lc b{font-size:16px;display:flex;gap:4px;align-items:center;letter-spacing:-.01em}
.sb{width:44px;height:44px;border-radius:14px;background:#fff;display:grid;place-items:center}
h1{font-size:30px;letter-spacing:-.04em;line-height:1.08;font-weight:800;margin:18px 0 18px}h1 span{color:#A5A9A3}
.bt{display:grid;grid-template-columns:1fr 1fr;gap:10px}.q{border-radius:24px;overflow:hidden;position:relative;background:#fff;padding:16px;min-height:150px;display:flex;flex-direction:column;justify-content:space-between}
.q.big{grid-column:1/-1;height:250px;color:#fff;padding:0}.q.big:after,.q.im:after{content:"";position:absolute;inset:0;background:linear-gradient(180deg,transparent 40%,rgba(8,12,10,.8))}
.q>img{position:absolute;inset:0}.q .in{position:absolute;left:18px;right:18px;bottom:16px;z-index:1;color:#fff}.q .in small{font-size:10.5px;font-weight:700;letter-spacing:.1em;text-transform:uppercase;opacity:.85}.q .in b{display:block;font-size:22px;letter-spacing:-.03em;line-height:1.1;margin-top:4px}
.q .pl{position:absolute;top:14px;left:14px;z-index:1;background:#fff;color:var(--ink);font-size:11px;font-weight:700;padding:5px 10px;border-radius:99px}
.q .n{font-size:44px;font-weight:800;letter-spacing:-.05em;line-height:1}.q .lb{font-size:13.5px;font-weight:600;line-height:1.25}.q .ic{width:38px;height:38px;border-radius:12px;background:#EFEFED;display:grid;place-items:center;color:var(--g)}
.q.gn{background:var(--g);color:#fff}.q.gn .ic{background:rgba(255,255,255,.12);color:#fff}.q.gn .lb{color:#C9D8CF}.q.im{padding:0}
.ch{display:flex;gap:8px;margin:26px -16px 16px 0;overflow:hidden}.ch span{flex:none;font-size:13px;font-weight:600;padding:9px 16px;border-radius:99px;background:#fff;color:#4A4F4B}.ch .on{background:var(--ink);color:#fff}
.g2{display:grid;grid-template-columns:1fr 1fr;gap:10px}.c{background:#fff;border-radius:22px;padding:6px 6px 12px}.c .p{aspect-ratio:1;border-radius:17px;overflow:hidden}.c b{display:block;font-size:14px;margin:10px 8px 2px;letter-spacing:-.01em}.c span{font-size:12px;color:var(--mut);margin:0 8px;display:flex;justify-content:space-between}.c em{font-style:normal;font-weight:700;color:var(--g)}
.h{display:flex;justify-content:space-between;align-items:baseline;margin:28px 0 12px}.h b{font-size:19px;letter-spacing:-.03em;font-weight:800}.h span{font-size:13px;color:var(--mut);font-weight:600}
.rk{background:#fff;border-radius:24px;padding:4px 16px}.l{display:flex;gap:14px;align-items:center;padding:12px 0;border-bottom:1px solid var(--line)}.l:last-child{border:0}.l u{text-decoration:none;font-size:22px;font-weight:800;color:#C3C6C0;width:22px;letter-spacing:-.04em}.l:first-child u{color:var(--g)}.l .t{width:48px;height:48px;border-radius:14px;overflow:hidden;flex:none}.l b{font-size:14.5px;display:block}.l span{font-size:12px;color:var(--mut)}.l i{margin-left:auto;font-style:normal;font-size:13px;font-weight:700}
.tb{position:fixed;left:16px;right:16px;bottom:18px;height:64px;border-radius:22px;background:#fff;display:flex;justify-content:space-around;align-items:center;color:#A3A7A1;box-shadow:0 10px 30px rgba(0,0,0,.1)}.tb .on{color:#fff;background:var(--g);width:48px;height:48px;border-radius:16px;display:grid;place-items:center}'''


def c3(p):
    return f'<div class="c"><div class="p"><img src="{I}{p[4]}.jpg"></div><b>{p[0]}</b><span>{p[1].split(" · ")[1]}<em>★ {p[2]}</em></span></div>'


b3 = f'''<div class="top"><div class="lc"><small>Você está em</small><b>Dallas, Texas {ic("down", 16)}</b></div><div class="sb">{ic("search", 20)}</div></div>
<h1>Descubra Dallas <span>em português.</span></h1>
<div class="bt"><div class="q big"><img src="{I}margaret-hunt-hill-bridge-1.jpg"><span class="pl">Destaque</span><div class="in"><small>50 pontos turísticos</small><b>O que ver em Dallas e região</b></div></div>
<div class="q"><div class="ic">{ic("leaf", 20)}</div><div><div class="n">31</div><div class="lb">passeios<br>de graça</div></div></div>
<div class="q gn"><div class="ic">{ic("flag", 20)}</div><div><div class="n">17</div><div class="lb">negócios<br>brasileiros</div></div></div>
<div class="q im"><img src="{I}fort-worth-stockyards-2.jpg"><div class="in"><small>34 lugares</small><b style="font-size:18px">Onde comer</b></div></div>
<div class="q"><div class="ic">{ic("briefcase", 20)}</div><div><div class="lb" style="font-size:16px;font-weight:700">Serviços em português</div><div class="lb" style="color:var(--mut);margin-top:4px;font-weight:500;font-size:12.5px">Mercados, consulado, outlets</div></div></div></div>
<div class="ch"><span class="on">Em alta</span><span>Museus</span><span>Parques</span><span>Churrasco</span><span>Compras</span></div>
<div class="g2">{c3(P[0])}{c3(P[2])}</div>
<div class="h"><b>Top da semana</b><span>ranking</span></div>
<div class="rk">{rows((P[1], P[3], P[5]), num=True)}</div>{TABS(24)}'''
page('v3.html', css3, b3)
print('ok')
