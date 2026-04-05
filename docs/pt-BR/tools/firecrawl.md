---
read_when:
    - Você quer extração na web com suporte do Firecrawl
    - Você precisa de uma chave de API do Firecrawl
    - Você quer o Firecrawl como provedor de `web_search`
    - Você quer extração com bypass anti-bot para `web_fetch`
summary: Pesquisa, scraping e fallback de `web_fetch` com Firecrawl
title: Firecrawl
x-i18n:
    generated_at: "2026-04-05T12:54:47Z"
    model: gpt-5.4
    provider: openai
    source_hash: 45f17fc4b8e81e1bfe25f510b0a64ab0d50c4cc95bcf88d6ba7c62cece26162e
    source_path: tools/firecrawl.md
    workflow: 15
---

# Firecrawl

O OpenClaw pode usar o **Firecrawl** de três formas:

- como provedor de `web_search`
- como ferramentas explícitas do plugin: `firecrawl_search` e `firecrawl_scrape`
- como extrator de fallback para `web_fetch`

É um serviço hospedado de extração/pesquisa com suporte a contorno de bot e cache,
o que ajuda com sites pesados em JS ou páginas que bloqueiam buscas HTTP simples.

## Obtenha uma chave de API

1. Crie uma conta no Firecrawl e gere uma chave de API.
2. Armazene-a na configuração ou defina `FIRECRAWL_API_KEY` no ambiente do gateway.

## Configure a pesquisa do Firecrawl

```json5
{
  tools: {
    web: {
      search: {
        provider: "firecrawl",
      },
    },
  },
  plugins: {
    entries: {
      firecrawl: {
        enabled: true,
        config: {
          webSearch: {
            apiKey: "FIRECRAWL_API_KEY_HERE",
            baseUrl: "https://api.firecrawl.dev",
          },
        },
      },
    },
  },
}
```

Observações:

- Escolher Firecrawl no onboarding ou em `openclaw configure --section web` habilita automaticamente o plugin Firecrawl empacotado.
- `web_search` com Firecrawl oferece suporte a `query` e `count`.
- Para controles específicos do Firecrawl, como `sources`, `categories` ou scraping de resultados, use `firecrawl_search`.
- Substituições de `baseUrl` devem permanecer em `https://api.firecrawl.dev`.
- `FIRECRAWL_BASE_URL` é o fallback compartilhado de variável de ambiente para as URLs base de pesquisa e scraping do Firecrawl.

## Configure scraping do Firecrawl + fallback de `web_fetch`

```json5
{
  plugins: {
    entries: {
      firecrawl: {
        enabled: true,
        config: {
          webFetch: {
            apiKey: "FIRECRAWL_API_KEY_HERE",
            baseUrl: "https://api.firecrawl.dev",
            onlyMainContent: true,
            maxAgeMs: 172800000,
            timeoutSeconds: 60,
          },
        },
      },
    },
  },
}
```

Observações:

- As tentativas de fallback do Firecrawl só são executadas quando uma chave de API está disponível (`plugins.entries.firecrawl.config.webFetch.apiKey` ou `FIRECRAWL_API_KEY`).
- `maxAgeMs` controla a idade máxima permitida dos resultados em cache (ms). O padrão é 2 dias.
- A configuração legada `tools.web.fetch.firecrawl.*` é migrada automaticamente por `openclaw doctor --fix`.
- Substituições da URL base de scraping/base do Firecrawl são restritas a `https://api.firecrawl.dev`.

`firecrawl_scrape` reutiliza as mesmas configurações e variáveis de ambiente de `plugins.entries.firecrawl.config.webFetch.*`.

## Ferramentas do plugin Firecrawl

### `firecrawl_search`

Use isso quando quiser controles de pesquisa específicos do Firecrawl em vez de `web_search` genérico.

Parâmetros principais:

- `query`
- `count`
- `sources`
- `categories`
- `scrapeResults`
- `timeoutSeconds`

### `firecrawl_scrape`

Use isso para páginas pesadas em JS ou protegidas contra bots, onde o `web_fetch` simples é fraco.

Parâmetros principais:

- `url`
- `extractMode`
- `maxChars`
- `onlyMainContent`
- `maxAgeMs`
- `proxy`
- `storeInCache`
- `timeoutSeconds`

## Stealth / contorno de bot

O Firecrawl expõe um parâmetro de **modo proxy** para contorno de bot (`basic`, `stealth` ou `auto`).
O OpenClaw sempre usa `proxy: "auto"` junto com `storeInCache: true` para solicitações do Firecrawl.
Se `proxy` for omitido, o Firecrawl usará `auto` por padrão. `auto` tenta novamente com proxies stealth se uma tentativa básica falhar, o que pode consumir mais créditos
do que scraping somente com modo básico.

## Como `web_fetch` usa o Firecrawl

Ordem de extração do `web_fetch`:

1. Readability (local)
2. Firecrawl (se selecionado ou detectado automaticamente como o fallback ativo de web-fetch)
3. Limpeza básica de HTML (fallback final)

O controle de seleção é `tools.web.fetch.provider`. Se você omiti-lo, o OpenClaw
detectará automaticamente o primeiro provedor de web-fetch pronto com base nas credenciais disponíveis.
Hoje, o provedor empacotado é o Firecrawl.

## Relacionado

- [Visão geral de Web Search](/tools/web) -- todos os provedores e detecção automática
- [Web Fetch](/tools/web-fetch) -- ferramenta `web_fetch` com fallback do Firecrawl
- [Tavily](/tools/tavily) -- ferramentas de pesquisa + extração
