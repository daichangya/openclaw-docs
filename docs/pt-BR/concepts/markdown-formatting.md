---
read_when:
    - Você está alterando a formatação Markdown ou o chunking para canais de saída
    - Você está adicionando um novo formatador de canal ou mapeamento de estilo
    - Você está depurando regressões de formatação entre canais
summary: Pipeline de formatação Markdown para canais de saída
title: Formatação Markdown
x-i18n:
    generated_at: "2026-04-05T12:39:30Z"
    model: gpt-5.4
    provider: openai
    source_hash: f3794674e30e265208d14a986ba9bdc4ba52e0cb69c446094f95ca6c674e4566
    source_path: concepts/markdown-formatting.md
    workflow: 15
---

# Formatação Markdown

O OpenClaw formata Markdown de saída convertendo-o em uma representação
intermediária (IR) compartilhada antes de renderizar a saída específica de cada canal. A IR mantém o
texto de origem intacto enquanto carrega intervalos de estilo/link para que o chunking e a renderização possam
permanecer consistentes entre canais.

## Objetivos

- **Consistência:** uma etapa de análise, vários renderizadores.
- **Chunking seguro:** dividir o texto antes da renderização para que a formatação inline nunca
  seja quebrada entre chunks.
- **Adequação ao canal:** mapear a mesma IR para Slack mrkdwn, HTML do Telegram e
  intervalos de estilo do Signal sem reanalisar o Markdown.

## Pipeline

1. **Analisar Markdown -> IR**
   - A IR é texto simples mais intervalos de estilo (bold/italic/strike/code/spoiler) e intervalos de link.
   - Os deslocamentos são unidades de código UTF-16 para que os intervalos de estilo do Signal se alinhem à sua API.
   - Tabelas são analisadas apenas quando um canal opta pela conversão de tabelas.
2. **Chunking da IR (formatação primeiro)**
   - O chunking acontece no texto da IR antes da renderização.
   - A formatação inline não é dividida entre chunks; os intervalos são fatiados por chunk.
3. **Renderizar por canal**
   - **Slack:** tokens mrkdwn (bold/italic/strike/code), links como `<url|label>`.
   - **Telegram:** tags HTML (`<b>`, `<i>`, `<s>`, `<code>`, `<pre><code>`, `<a href>`).
   - **Signal:** texto simples + intervalos `text-style`; links se tornam `label (url)` quando o rótulo é diferente.

## Exemplo de IR

Markdown de entrada:

```markdown
Hello **world** — see [docs](https://docs.openclaw.ai).
```

IR (esquemática):

```json
{
  "text": "Hello world — see docs.",
  "styles": [{ "start": 6, "end": 11, "style": "bold" }],
  "links": [{ "start": 19, "end": 23, "href": "https://docs.openclaw.ai" }]
}
```

## Onde é usada

- Adaptadores de saída de Slack, Telegram e Signal renderizam a partir da IR.
- Outros canais (WhatsApp, iMessage, Microsoft Teams, Discord) ainda usam texto simples ou
  suas próprias regras de formatação, com conversão de tabela Markdown aplicada antes do
  chunking quando ativada.

## Tratamento de tabelas

Tabelas Markdown não são suportadas de forma consistente entre clientes de chat. Use
`markdown.tables` para controlar a conversão por canal (e por conta).

- `code`: renderizar tabelas como blocos de código (padrão para a maioria dos canais).
- `bullets`: converter cada linha em marcadores (padrão para Signal + WhatsApp).
- `off`: desativar análise e conversão de tabelas; o texto bruto da tabela é repassado.

Chaves de configuração:

```yaml
channels:
  discord:
    markdown:
      tables: code
    accounts:
      work:
        markdown:
          tables: off
```

## Regras de chunking

- Os limites de chunk vêm dos adaptadores/configuração de canal e são aplicados ao texto da IR.
- Blocos de código delimitados são preservados como um único bloco com uma nova linha final para que os canais
  os renderizem corretamente.
- Prefixos de lista e prefixos de blockquote fazem parte do texto da IR, então o chunking
  não divide no meio do prefixo.
- Estilos inline (bold/italic/strike/inline-code/spoiler) nunca são divididos entre
  chunks; o renderizador reabre os estilos dentro de cada chunk.

Se você precisar de mais informações sobre o comportamento de chunking entre canais, consulte
[Streaming + chunking](/concepts/streaming).

## Política de links

- **Slack:** `[label](url)` -> `<url|label>`; URLs simples permanecem simples. O autolink
  é desativado durante a análise para evitar linkagem duplicada.
- **Telegram:** `[label](url)` -> `<a href="url">label</a>` (modo de análise HTML).
- **Signal:** `[label](url)` -> `label (url)` a menos que o rótulo corresponda à URL.

## Spoilers

Marcadores de spoiler (`||spoiler||`) são analisados apenas para o Signal, onde são mapeados para
intervalos de estilo SPOILER. Outros canais os tratam como texto simples.

## Como adicionar ou atualizar um formatador de canal

1. **Analisar uma vez:** use o helper compartilhado `markdownToIR(...)` com opções
   apropriadas ao canal (autolink, estilo de heading, prefixo de blockquote).
2. **Renderizar:** implemente um renderizador com `renderMarkdownWithMarkers(...)` e um
   mapa de marcadores de estilo (ou intervalos de estilo do Signal).
3. **Chunking:** chame `chunkMarkdownIR(...)` antes de renderizar; renderize cada chunk.
4. **Conectar o adaptador:** atualize o adaptador de saída do canal para usar o novo chunker
   e renderizador.
5. **Testar:** adicione ou atualize testes de formatação e um teste de entrega de saída se o
   canal usar chunking.

## Armadilhas comuns

- Tokens com colchetes angulares do Slack (`<@U123>`, `<#C123>`, `<https://...>`) devem ser
  preservados; escape HTML bruto com segurança.
- O HTML do Telegram exige escape do texto fora das tags para evitar markup quebrado.
- Os intervalos de estilo do Signal dependem de deslocamentos UTF-16; não use deslocamentos por ponto de código.
- Preserve novas linhas finais em blocos de código delimitados para que os marcadores de fechamento caiam
  em sua própria linha.
