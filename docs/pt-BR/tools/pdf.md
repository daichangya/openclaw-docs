---
read_when:
    - Você quer analisar PDFs a partir de agentes
    - Você precisa dos parâmetros e limites exatos da tool PDF
    - Você está depurando o modo PDF nativo versus fallback por extração
summary: Analise um ou mais documentos PDF com suporte nativo do provider e fallback por extração
title: Tool PDF
x-i18n:
    generated_at: "2026-04-05T12:55:32Z"
    model: gpt-5.4
    provider: openai
    source_hash: d7aaaa7107d7920e7c31f3e38ac19411706e646186acf520bc02f2c3e49c0517
    source_path: tools/pdf.md
    workflow: 15
---

# Tool PDF

`pdf` analisa um ou mais documentos PDF e retorna texto.

Comportamento rápido:

- Modo nativo do provider para providers de modelo Anthropic e Google.
- Modo de fallback por extração para outros providers (extrai o texto primeiro, depois imagens das páginas quando necessário).
- Suporta entrada única (`pdf`) ou múltipla (`pdfs`), no máximo 10 PDFs por chamada.

## Disponibilidade

A tool é registrada apenas quando o OpenClaw consegue resolver uma configuração de modelo compatível com PDF para o agente:

1. `agents.defaults.pdfModel`
2. fallback para `agents.defaults.imageModel`
3. fallback para o modelo resolvido da sessão/padrão do agente
4. se providers de PDF nativo forem respaldados por autenticação, prefira-os antes de candidatos genéricos de fallback de imagem

Se nenhum modelo utilizável puder ser resolvido, a tool `pdf` não é exposta.

Observações sobre disponibilidade:

- A cadeia de fallback reconhece autenticação. Um `provider/model` configurado só conta se
  o OpenClaw realmente conseguir autenticar esse provider para o agente.
- Os providers de PDF nativo atualmente são **Anthropic** e **Google**.
- Se o provider resolvido da sessão/padrão já tiver um modelo de visão/PDF configurado,
  a tool PDF o reutiliza antes de recorrer a outros
  providers respaldados por autenticação.

## Referência de entrada

- `pdf` (`string`): um caminho ou URL de PDF
- `pdfs` (`string[]`): múltiplos caminhos ou URLs de PDF, até 10 no total
- `prompt` (`string`): prompt de análise, padrão `Analyze this PDF document.`
- `pages` (`string`): filtro de páginas como `1-5` ou `1,3,7-9`
- `model` (`string`): override opcional de modelo (`provider/model`)
- `maxBytesMb` (`number`): limite de tamanho por PDF em MB

Observações sobre entrada:

- `pdf` e `pdfs` são mesclados e deduplicados antes do carregamento.
- Se nenhuma entrada de PDF for fornecida, a tool retorna erro.
- `pages` é interpretado como números de página começando em 1, deduplicados, ordenados e limitados ao máximo configurado de páginas.
- `maxBytesMb` assume por padrão `agents.defaults.pdfMaxBytesMb` ou `10`.

## Referências de PDF compatíveis

- caminho de arquivo local (incluindo expansão de `~`)
- URL `file://`
- URL `http://` e `https://`

Observações sobre referências:

- Outros esquemas de URI (por exemplo `ftp://`) são rejeitados com `unsupported_pdf_reference`.
- No modo sandbox, URLs remotas `http(s)` são rejeitadas.
- Com a política de arquivos restrita ao workspace habilitada, caminhos de arquivo local fora das raízes permitidas são rejeitados.

## Modos de execução

### Modo nativo do provider

O modo nativo é usado para o provider `anthropic` e `google`.
A tool envia bytes brutos do PDF diretamente para as APIs do provider.

Limites do modo nativo:

- `pages` não é compatível. Se definido, a tool retorna erro.
- A entrada com múltiplos PDFs é compatível; cada PDF é enviado como um bloco de documento nativo /
  parte inline de PDF antes do prompt.

### Modo de fallback por extração

O modo de fallback é usado para providers não nativos.

Fluxo:

1. Extrai texto das páginas selecionadas (até `agents.defaults.pdfMaxPages`, padrão `20`).
2. Se o comprimento do texto extraído ficar abaixo de `200` caracteres, renderiza as páginas selecionadas em imagens PNG e as inclui.
3. Envia o conteúdo extraído mais o prompt para o modelo selecionado.

Detalhes do fallback:

- A extração de imagens de página usa um orçamento de pixels de `4,000,000`.
- Se o modelo de destino não oferecer suporte a entrada de imagem e não houver texto extraível, a tool retorna erro.
- Se a extração de texto tiver êxito, mas a extração de imagem exigir visão em um
  modelo somente de texto, o OpenClaw descarta as imagens renderizadas e continua com o
  texto extraído.
- O fallback por extração exige `pdfjs-dist` (e `@napi-rs/canvas` para renderização de imagem).

## Configuração

```json5
{
  agents: {
    defaults: {
      pdfModel: {
        primary: "anthropic/claude-opus-4-6",
        fallbacks: ["openai/gpt-5.4-mini"],
      },
      pdfMaxBytesMb: 10,
      pdfMaxPages: 20,
    },
  },
}
```

Consulte [Configuration Reference](/pt-BR/gateway/configuration-reference) para detalhes completos dos campos.

## Detalhes de saída

A tool retorna texto em `content[0].text` e metadados estruturados em `details`.

Campos comuns de `details`:

- `model`: ref do modelo resolvido (`provider/model`)
- `native`: `true` para modo nativo do provider, `false` para fallback
- `attempts`: tentativas de fallback que falharam antes do sucesso

Campos de caminho:

- entrada de PDF único: `details.pdf`
- entrada de múltiplos PDFs: `details.pdfs[]` com entradas `pdf`
- metadados de reescrita de caminho do sandbox (quando aplicável): `rewrittenFrom`

## Comportamento de erro

- Entrada de PDF ausente: gera `pdf required: provide a path or URL to a PDF document`
- PDFs demais: retorna erro estruturado em `details.error = "too_many_pdfs"`
- Esquema de referência não compatível: retorna `details.error = "unsupported_pdf_reference"`
- Modo nativo com `pages`: gera o erro claro `pages is not supported with native PDF providers`

## Exemplos

PDF único:

```json
{
  "pdf": "/tmp/report.pdf",
  "prompt": "Summarize this report in 5 bullets"
}
```

Múltiplos PDFs:

```json
{
  "pdfs": ["/tmp/q1.pdf", "/tmp/q2.pdf"],
  "prompt": "Compare risks and timeline changes across both documents"
}
```

Modelo de fallback com filtro de páginas:

```json
{
  "pdf": "https://example.com/report.pdf",
  "pages": "1-3,7",
  "model": "openai/gpt-5.4-mini",
  "prompt": "Extract only customer-impacting incidents"
}
```

## Relacionado

- [Tools Overview](/tools) — todas as tools de agente disponíveis
- [Configuration Reference](/pt-BR/gateway/configuration-reference#agent-defaults) — configuração de pdfMaxBytesMb e pdfMaxPages
