# CoraçãoBR — regras do projeto

Responder sempre em português do Brasil.

## Regra de cadastro de lugares e eventos (vale para toda região nova ou ampliação)

1. **Quantidade:** cerca de **5 por nicho em cada bairro/região** (ex.: 5 restaurantes, 5 bares, 5 padarias e cafés,
   5 pizzarias, 5 clínicas veterinárias, 5 pet shops, 5 salões/barbearias, shoppings e parques que existirem).
   Eventos seguem a mesma regra: ~5 por tipo de evento em cada região.
2. **Escolha: os 5 mais bem avaliados** de cada nicho no bairro, pela nota do Google (Places API), exigindo um mínimo
   de avaliações para a nota valer (padrão: 30 para comércio e serviços, 100 para shoppings e parques) e só lugares
   em funcionamento. Empate: mais avaliações primeiro. Não repetir lugar que já está no guia. Sem a chave do Google,
   não há como saber a nota: o levantamento espera a chave (não usar outra ordem como se fosse "mais bem avaliados").
3. **Só dado real:** localização, endereço, telefone, site, Instagram/Facebook e horário apenas quando a fonte tiver.
   **O que não existir fica vazio e o site não mostra.** Nunca inventar telefone, preço, horário, nota ou avaliação.
   Texto do anúncio: só fatos que a fonte confirma (tipo de lugar, cozinha, bairro).
4. **Fontes permitidas:** OpenStreetMap (Overpass/Nominatim), site oficial do lugar (dados estruturados e imagem
   oficial og:image), Wikimedia Commons (licença livre, com autor e licença), ViaCEP. **Google Maps só pela Google
   Places API oficial** (chave no Painel → Atualização diária), nunca copiando páginas do Google.
5. **Imagens:** o máximo de fotos reais por lugar (até ~8), sempre com crédito e licença/fonte. Comprimir sem perder
   qualidade visível: até 1280 px no lado maior, JPEG progressivo qualidade ~80, sem metadados. Fotos do Google
   (Places API) não são baixadas: são servidas pela API com o nome do autor, como manda o Google.
6. **Organização:** país › estado › cidade › bairro (campos `pais`, `estado`, `cidade`, `bairro`, `regiaoGuia`) e o tipo
   de oferta certo (`oferta`: comida, produto, servico, hospedagem, ingresso) para o preço aparecer com a unidade certa.
7. **Brasil × EUA:** lugares do Brasil em reais, hora de São Paulo e km; nada de dólar, conversão ou assuntos dos EUA.

Ferramentas: `tools/bairros_sp.py` (levantamento por bairro e nicho), `tools/cidades.py <região>` (junta na base),
`tools/roteiros.py` (roteiros). Publicar com o pacote `tools/pacote_local.py`.
