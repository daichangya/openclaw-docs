---
read_when:
    - Você quer usar o MiniMax para `web_search`
    - Você precisa de uma chave do MiniMax Coding Plan
    - Você quer orientações sobre host de pesquisa MiniMax CN/global
summary: MiniMax Search via a API de pesquisa do Coding Plan
title: MiniMax Search
x-i18n:
    generated_at: "2026-04-05T12:55:14Z"
    model: gpt-5.4
    provider: openai
    source_hash: b8c3767790f428fc7e239590a97e9dbee0d3bd6550ca3299ae22da0f5a57231a
    source_path: tools/minimax-search.md
    workflow: 15
---

# MiniMax Search

O OpenClaw oferece suporte ao MiniMax como provedor de `web_search` por meio da API de pesquisa do MiniMax
Coding Plan. Ela retorna resultados de pesquisa estruturados com títulos, URLs,
snippets e consultas relacionadas.

## Obtenha uma chave do Coding Plan

<Steps>
  <Step title="Crie uma chave">
    Crie ou copie uma chave do MiniMax Coding Plan em
    [MiniMax Platform](https://platform.minimax.io/user-center/basic-information/interface-key).
  </Step>
  <Step title="Armazene a chave">
    Defina `MINIMAX_CODE_PLAN_KEY` no ambiente do Gateway ou configure via:

    ```bash
    openclaw configure --section web
    ```

  </Step>
</Steps>

O OpenClaw também aceita `MINIMAX_CODING_API_KEY` como alias de variável de ambiente. `MINIMAX_API_KEY`
ainda é lido como fallback de compatibilidade quando já aponta para um token de coding-plan.

## Configuração

```json5
{
  plugins: {
    entries: {
      minimax: {
        config: {
          webSearch: {
            apiKey: "sk-cp-...", // opcional se MINIMAX_CODE_PLAN_KEY estiver definido
            region: "global", // ou "cn"
          },
        },
      },
    },
  },
  tools: {
    web: {
      search: {
        provider: "minimax",
      },
    },
  },
}
```

**Alternativa por ambiente:** defina `MINIMAX_CODE_PLAN_KEY` no ambiente do Gateway.
Para uma instalação do gateway, coloque isso em `~/.openclaw/.env`.

## Seleção de região

O MiniMax Search usa estes endpoints:

- Global: `https://api.minimax.io/v1/coding_plan/search`
- CN: `https://api.minimaxi.com/v1/coding_plan/search`

Se `plugins.entries.minimax.config.webSearch.region` não estiver definido, o OpenClaw resolve
a região nesta ordem:

1. `tools.web.search.minimax.region` / `webSearch.region` sob propriedade do plugin
2. `MINIMAX_API_HOST`
3. `models.providers.minimax.baseUrl`
4. `models.providers.minimax-portal.baseUrl`

Isso significa que onboarding em CN ou `MINIMAX_API_HOST=https://api.minimaxi.com/...`
automaticamente também mantém o MiniMax Search no host CN.

Mesmo quando você autenticou o MiniMax pelo caminho OAuth `minimax-portal`,
a pesquisa na web ainda é registrada como id de provedor `minimax`; a URL base do provedor OAuth
é usada apenas como dica de região para seleção do host CN/global.

## Parâmetros compatíveis

O MiniMax Search oferece suporte a:

- `query`
- `count` (o OpenClaw reduz a lista de resultados retornados para a contagem solicitada)

No momento, filtros específicos do provedor não são compatíveis.

## Relacionado

- [Visão geral de Web Search](/tools/web) -- todos os provedores e detecção automática
- [MiniMax](/providers/minimax) -- configuração de modelo, imagem, fala e autenticação
