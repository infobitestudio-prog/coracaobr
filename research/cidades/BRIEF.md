# Pesquisa de cidade para o CoraçãoBR (guia em português para brasileiros no Texas)

Você vai montar o guia de UMA cidade, no mesmo padrão do guia de Dallas–Fort Worth que já existe em `data/seed.json`
(olhe 3 ou 4 lugares de lá para ver o tom e o formato). Tudo em português do Brasil, texto próprio (não copie frases de sites).

## Saída
1. `research/cidades/<slug>.json`: uma lista JSON de lugares, já no formato final abaixo.
2. Fotos em `fotos_cidades/<slug>/<id>/<id>-<n>.jpg`.
3. Ao terminar, responda só com um resumo curto: quantos lugares por categoria, quantos com foto real, problemas.

## Quantidade e mistura (alvo: 80 a 100 lugares)
- Comida (~35): restaurantes brasileiros, churrascarias, padarias/açaí/mercados brasileiros (procure bem: comunidade brasileira local),
  e os clássicos da cidade: Texas BBQ, Tex-Mex, steakhouse, hambúrguer, brunch/café, asiático, pizza, comida sulista.
- Bares e vida noturna (~8): categoria `bar`; casas de show em `show`.
- Igrejas (~6): igrejas com culto em português (evangélicas, católicas com missa em português) e 1 ou 2 igrejas históricas famosas. Categoria `igreja`.
- Passeios (~25): museus, parques, natureza, mirantes, bairros, históricos, arte, família, esporte (estádios), compras.
- Festas e eventos (~12): eventos anuais e recorrentes (rodeio, festivais, feiras, festas brasileiras, Carnaval/Festa Junina se houver),
  com `quando` (texto) e `dataInicio`/`dataFim` da PRÓXIMA edição entre 2026-11 e 2027-12 (AAAA-MM-DD), só se a data estiver confirmada em fonte oficial; senão deixe `dataInicio`/`dataFim` vazios e explique em `quando`.
- Serviços úteis (~6): consulado do Brasil se houver na cidade (Houston tem), prefeitura/DPS (carteira de motorista), hospitais grandes, aeroporto/transporte.
Só lugares que existem e estão abertos hoje (confira o site oficial ou fonte recente). Sem lugares fechados. Sem inventar telefone, preço, horário ou endereço: se não achar, deixe "".

## Formato de cada lugar (campos exatamente assim)
```
{"id": "<slug-unico-com-prefixo-da-cidade, ex.: hou-space-center-houston>",
 "regiaoGuia": "<houston|austin|sanantonio>",
 "tipo": "atracao" (passeios, eventos, shows, igrejas, serviços) ou "estabelecimento" (restaurantes, bares, mercados, padarias),
 "nome": "", "categoria": "<uma das categorias abaixo>", "brasileiro": true/false (negócio de brasileiros ou foco na comunidade),
 "cidade": "<cidade real do endereço, ex.: Houston, Sugar Land, Katy, Round Rock>", "bairro": "", "endereco": "<rua, cidade, TX CEP>",
 "lat": 0, "lng": 0, "telefone": "", "site": "", "instagram": "<só o @, sem link>", "horario": "<em português, resumido>",
 "historia": "<2 a 4 frases contando o que é e por que vale a pena para um brasileiro>", "dica": "<1 frase prática>",
 "gratuito": true/false, "preco": "<texto, ex.: Adulto US$ 25 · Crianças grátis>", "precoMin": 0, "faixaPreco": "$|$$|$$$|$$$$ (restaurantes)",
 "tempoVisita": "<passeios, ex.: 2–3 horas>", "quando": "", "dataInicio": "", "dataFim": "",
 "notaCuradoria": <3.5 a 5.0, de meio em meio, sua avaliação honesta pela reputação>, "notaProvisoria": true,
 "menu": [], "fotos": [ ... ], "atualizadoEm": "2026-11", "publicado": true}
```
Categorias permitidas: museu, parque, historico, mirante, bairro, esporte, familia, compras, arte, natureza, restaurante-brasileiro, churrascaria,
padaria, mercado-brasileiro, acai-cafe, bbq, tex-mex, steakhouse, hamburguer, brunch-cafe, comida-sulista, asiatico, pizza, bar, mercado,
evento, show, governo, transporte, saude, comunidade, servico, igreja, hotel.

## Coordenadas
Geocodifique pelo endereço com o US Census Geocoder:
`https://geocoding.geo.census.gov/geocoder/locations/onelineaddress?benchmark=Public_AR_Current&format=json&address=<endereço>`
(se não achar, use a coordenada de uma fonte confiável). lat/lng com 6 casas.

## Fotos (o mais importante)
- Só fotos com licença livre e crédito: Openverse (`https://api.openverse.org/v1/images/?q=<busca>&license_type=all-cc&page_size=20`)
  e Wikimedia Commons (API `https://commons.wikimedia.org/w/api.php`, namespace 6, `prop=imageinfo&iiprop=url|extmetadata`).
  Licenças aceitas: CC0, Public Domain, CC BY, CC BY-SA. Nada de Google, Yelp, Instagram ou fotos de sites sem licença.
- A foto tem que ser DO LUGAR (título/descrição citando o lugar). Confira antes de aceitar.
- Até 15 fotos por lugar no máximo. Use: atrações grandes 5 a 8, demais 2 a 4. Melhor poucas boas do que muitas ruins.
- Se não houver nenhuma foto real com licença livre, use UMA ilustrativa que já existe no projeto: `img/ilustra-<categoria>-<n>.jpg`
  (veja quais existem com `ls img/ilustra-*`), e marque `"ilustrativa": true`. Para `igreja` use `img/ilustra-comunidade-1.jpg`.
- Compressão: redimensione para 1000 px de largura (não aumente imagens menores), JPEG qualidade 72, progressivo, sem metadados
  (Pillow: `im.convert("RGB").save(dest, "JPEG", quality=72, optimize=True, progressive=True)`). Meta: menos de 150 KB cada.
- Cada foto no JSON: `{"src": "fotos_cidades/<slug>/<id>/<id>-1.jpg", "credito": "<autor>", "licenca": "<ex.: CC BY-SA 4.0>", "pagina": "<página da foto>"}`.
- Respeite os servidores: User-Agent `CoracaoBR-GuideBuilder/1.0 (https://github.com/infobitestudio-prog/coracaobr)`, uma requisição por vez,
  1 a 2 segundos entre chamadas; em erro 429 ou "too many requests", espere 30–60 s e tente de novo. Outros agentes estão pesquisando outras cidades ao mesmo tempo.
- Escreva seus scripts em `/tmp/claude-0/cidades/<slug>/` (não dentro do projeto). Salve o JSON aos poucos, para não perder trabalho.

## Não faça
- Não altere nenhum outro arquivo do projeto (nada em js/, data/, index.html). Não faça git commit.
- Não invente avaliações nem depoimentos.
