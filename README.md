# CoraçãoBR

Guia em português para brasileiros fora do Brasil (começando por Dallas–Fort Worth).

## Rodar localmente
Requer PHP 8.1+ (com SQLite):

    python3 tools/pacote_local.py        # monta dist/coracaobr
    php -S 127.0.0.1:8000 -t dist/coracaobr

Abra http://127.0.0.1:8000/ e siga o INSTALAR.txt (chave em dados/CHAVE-INSTALACAO.txt).

## Estrutura
- `index.html`, `js/` — site (sem build)
- `api/index.php` — API PHP + SQLite
- `data/` — conteúdo inicial; `img/`, `fotos_eventos/` — fotos com crédito
- `marca/` — logo, manual, mídia kit e apresentação
- `tools/` — scripts de pacote e dados
