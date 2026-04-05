---
read_when:
    - Você quer pesquisa na web com suporte do Tavily
    - Você precisa de uma chave de API do Tavily
    - Você quer usar o Tavily como provedor de `web_search`
    - Você quer extrair conteúdo de URLs
summary: Ferramentas de pesquisa e extração do Tavily
title: Tavily
x-i18n:
    generated_at: "2026-04-05T12:56:13Z"
    model: gpt-5.4
    provider: openai
    source_hash: db530cc101dc930611e4ca54e3d5972140f116bfe168adc939dc5752322d205e
    source_path: tools/tavily.md
    workflow: 15
---

# Tavily

O OpenClaw pode usar o **Tavily** de duas formas:

- como provedor de `web_search`
- como ferramentas explícitas do plugin: `tavily_search` e `tavily_extract`

O Tavily é uma API de pesquisa projetada para aplicações de IA, retornando resultados estruturados otimizados para consumo por LLMs. Ela oferece suporte a profundidade de pesquisa configurável, filtragem por tópico, filtros de domínio, resumos de respostas gerados por IA e extração de conteúdo de URLs (incluindo páginas renderizadas por JavaScript).

## Obtenha uma chave de API

1. Crie uma conta do Tavily em [tavily.com](https://tavily.com/).
2. Gere uma chave de API no painel.
3. Armazene-a na configuração ou defina `TAVILY_API_KEY` no ambiente do gateway.

## Configure a pesquisa Tavily

```json5
{
  plugins: {
    entries: {
      tavily: {
        enabled: true,
        config: {
          webSearch: {
            apiKey: "tvly-...", // optional if TAVILY_API_KEY is set
            baseUrl: "https://api.tavily.com",
          },
        },
      },
    },
  },
  tools: {
    web: {
      search: {
        provider: "tavily",
      },
    },
  },
}
```

Observações:

- Escolher Tavily no onboarding ou em `openclaw configure --section web` ativa automaticamente o plugin Tavily incluído.
- Armazene a configuração do Tavily em `plugins.entries.tavily.config.webSearch.*`.
- `web_search` com Tavily oferece suporte a `query` e `count` (até 20 resultados).
- Para controles específicos do Tavily, como `search_depth`, `topic`, `include_answer` ou filtros de domínio, use `tavily_search`.

## Ferramentas do plugin Tavily

### `tavily_search`

Use isto quando quiser controles de pesquisa específicos do Tavily em vez de `web_search` genérico.

| Parâmetro          | Descrição                                                             |
| ------------------ | --------------------------------------------------------------------- |
| `query`            | String de consulta de pesquisa (mantenha abaixo de 400 caracteres)    |
| `search_depth`     | `basic` (padrão, equilibrado) ou `advanced` (maior relevância, mais lento) |
| `topic`            | `general` (padrão), `news` (atualizações em tempo real) ou `finance`  |
| `max_results`      | Número de resultados, 1-20 (padrão: 5)                                |
| `include_answer`   | Inclui um resumo de resposta gerado por IA (padrão: false)            |
| `time_range`       | Filtra por recência: `day`, `week`, `month` ou `year`                 |
| `include_domains`  | Array de domínios para restringir os resultados                       |
| `exclude_domains`  | Array de domínios para excluir dos resultados                         |

**Profundidade da pesquisa:**

| Profundidade | Velocidade | Relevância | Melhor para                           |
| ------------ | ---------- | ---------- | ------------------------------------- |
| `basic`      | Mais rápido | Alta       | Consultas de uso geral (padrão)       |
| `advanced`   | Mais lento | Máxima     | Precisão, fatos específicos, pesquisa |

### `tavily_extract`

Use isto para extrair conteúdo limpo de uma ou mais URLs. Lida com páginas renderizadas por JavaScript e oferece suporte a segmentação focada em consulta para extração direcionada.

| Parâmetro           | Descrição                                                 |
| ------------------- | --------------------------------------------------------- |
| `urls`              | Array de URLs para extrair (1-20 por solicitação)         |
| `query`             | Reordena os trechos extraídos por relevância para esta consulta |
| `extract_depth`     | `basic` (padrão, rápido) ou `advanced` (para páginas com muito JS) |
| `chunks_per_source` | Trechos por URL, 1-5 (requer `query`)                     |
| `include_images`    | Inclui URLs de imagens nos resultados (padrão: false)     |

**Profundidade da extração:**

| Profundidade | Quando usar                                  |
| ------------ | -------------------------------------------- |
| `basic`      | Páginas simples - tente isto primeiro        |
| `advanced`   | SPAs renderizadas por JS, conteúdo dinâmico, tabelas |

Dicas:

- Máximo de 20 URLs por solicitação. Divida listas maiores em várias chamadas.
- Use `query` + `chunks_per_source` para obter apenas o conteúdo relevante em vez de páginas completas.
- Tente `basic` primeiro; use `advanced` se o conteúdo estiver ausente ou incompleto.

## Escolhendo a ferramenta certa

| Necessidade                            | Ferramenta       |
| -------------------------------------- | ---------------- |
| Pesquisa rápida na web, sem opções especiais | `web_search`     |
| Pesquisa com profundidade, tópico, respostas de IA | `tavily_search`  |
| Extrair conteúdo de URLs específicas   | `tavily_extract` |

## Relacionado

- [Visão geral da pesquisa na web](/tools/web) -- todos os provedores e a detecção automática
- [Firecrawl](/pt-BR/tools/firecrawl) -- pesquisa + scraping com extração de conteúdo
- [Exa Search](/pt-BR/tools/exa-search) -- pesquisa neural com extração de conteúdo
