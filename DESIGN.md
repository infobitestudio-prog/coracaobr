# CoraçãoBR — DESIGN.md

Direção: **clean tecnológico**. Base neutra fria, verde da marca só onde há ação, amarelo reservado a patrocinadores. Informação em blocos claros, números em fonte mono, bordas finas em vez de sombras pesadas. Sem gradientes roxos, sem texto em gradiente, sem emoji como ícone.

> Direção definida a partir da marca existente e das referências do dono (painéis preto e branco com verde). Não foi comparada com sites reais do UXKIN (não conectado).

## Cor

| Token | Claro | Escuro | Papel |
|---|---|---|---|
| `--bg` | #F6F7F6 | #0B0E0D | fundo da página |
| `--surface` | #FFFFFF | #131816 | cartões, painéis |
| `--surface-2` | #EEF1EF | #1B211E | campos, chips, áreas secundárias |
| `--line` | #E3E7E4 | #252C29 | bordas de 1px |
| `--ink` | #0E1311 | #EEF2F0 | texto principal |
| `--muted` | #5A6560 | #9AA5A0 | texto secundário (≥ 4.5:1) |
| `--accent` | #0B7A35 | #34C46A | primária: botões, links, foco |
| `--accent-ink` | #FFFFFF | #04140A | texto sobre a primária |
| `--accent-soft` | #E3F3E9 | #10261A | fundo de estados ativos |
| `--sponsor` | #FFC20E | #FFC20E | só selos/molduras de patrocinador |
| `--sponsor-ink` | #1B1500 | #1B1500 | texto sobre o amarelo |
| `--band` | #0B0F0D | #070908 | faixas escuras (rodapé, CTA) |
| `--danger` | #C0352B | #FF8F84 | erro |

Pins do mapa: verde = anunciante, amarelo = grátis, vermelho = acontecendo agora.

## Tipografia

- **Geist** (títulos e texto), **Geist Mono** (números, rótulos, preços, horários). Outfit só no logotipo.
- Escala: 12 / 14 / 16 / 18 / 22 / 28 / 40 / 56 px. Corpo 16px, linha 1.55. Títulos 600, `letter-spacing: -0.025em`, linha 1.05–1.15.
- Rótulos (eyebrow): Geist Mono 11–12px, maiúsculas, `letter-spacing: .08em`.

## Espaçamento e largura

- Escala 4px: 4, 8, 12, 16, 20, 24, 32, 48, 64.
- Conteúdo máximo 1200px; gutter 20px (celular), 32px (desktop). Seções separadas por 40–56px.

## Forma e profundidade

- Raio: 10 (campos, chips), 16 (cartões), 24 (blocos grandes), 999 (pílulas).
- Sombra `--shadow`: 0 1px 2px rgba(0,0,0,.04), 0 8px 24px -12px rgba(0,0,0,.12). `--shadow-lg` só em flutuantes (sheet, menus).

## Componentes

- **Botão primário**: fundo `--accent`, texto branco, 44px de altura, raio 999; hover escurece 8%; foco anel 3px verde; desabilitado 50%.
- **Botão secundário**: fundo `--surface`, borda `--line`. **Quieto**: só texto.
- **Cartão de lugar**: foto 4:3 com cantos 16, título 600, meta em mono. Patrocinado: moldura e selo amarelos.
- **Chip/filtro**: `--surface-2`, ativo = `--ink` com texto branco.
- **Navegação**: cápsula de vidro fixa no topo; abas flutuantes no celular.
- **Rodapé**: faixa `--band` com CTA de anúncio.

## Imagens e ícones

- Ícones de traço 1.6px (conjunto próprio em `js/app.js` e `js/dash.js`).
- Fotos reais com crédito; banner do topo em alta resolução (`img/hero/`). Sem ilustrações genéricas.
