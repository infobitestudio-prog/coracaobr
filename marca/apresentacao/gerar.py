"""Gera a apresentação animada da CoraçãoBR (um único HTML, imagens embutidas)."""
import base64, json, re
M = '/home/user/guia-texas/marca/'
demo = json.load(open(M + 'demo/demo.json'))
for f in demo:
    for s in f['passos']:
        s['src'] = 'data:image/jpeg;base64,' + base64.b64encode(open(M + 'demo/' + s['img'], 'rb').read()).decode()
        del s['img']

def svg(n, cls='', uid=''):
    s = open(M + 'final/svg/' + n + '.svg').read()
    s = re.sub(r' width="\d+" height="\d+"', '', s, count=1)
    if uid:
        s = s.replace('id="g', 'id="' + uid + 'g').replace('url(#g', 'url(#' + uid + 'g').replace('id="ko"', 'id="' + uid + 'ko"').replace('url(#ko)', 'url(#' + uid + 'ko)')
    return s.replace('<svg ', '<svg class="%s" aria-hidden="true" ' % cls, 1)

logo_neg = svg('coracaobr-logo-negativo', 'lg', 'a')
simb = svg('coracaobr-simbolo', 'simb', 'b')
logo_fim = svg('coracaobr-logo', 'lg', 'c')
logo_fim2 = svg('coracaobr-logo-negativo', 'lg', 'e')
logo_top = svg('coracaobr-logo-negativo', 'lg-top', 'd')

html = open(M + 'apresentacao/modelo.html').read()
html = html.replace('/*DEMO*/[]', json.dumps(demo, ensure_ascii=False))
html = html.replace('<!--LOGO-->', logo_neg).replace('<!--SIMB-->', simb).replace('<!--LOGOFIM-->', logo_fim).replace('<!--LOGOTOP-->', logo_top).replace('<!--LOGOFIM2-->', logo_fim2)
open(M + 'apresentacao/coracaobr-apresentacao.html', 'w').write(html)
print(len(html) // 1024, 'KB')

# versão standalone para hospedagem própria: declara UTF-8, viewport e o reset que o Artifact acrescenta ao publicar
HEAD = ('<!doctype html><html lang="pt-BR"><head><meta charset="utf-8">'
        '<meta name="viewport" content="width=device-width,initial-scale=1,viewport-fit=cover">'
        '<style>:root{padding-top:env(safe-area-inset-top,0px);padding-bottom:env(safe-area-inset-bottom,0px)}body{margin:0}img{max-width:100%}[hidden]{display:none!important}</style>')
corpo = html.replace('<meta name="claude:viewport-fit-sides" content="cover">\n', '')
i = corpo.index('</style>') + len('</style>')
standalone = HEAD + corpo[:i] + '</head><body>' + corpo[i:] + '</body></html>'
open(M + 'apresentacao/apresentacao.html', 'w', encoding='utf-8').write(standalone)
print('standalone ok')
