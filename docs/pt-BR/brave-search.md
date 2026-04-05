---
read_when:
    - Você quer usar Brave Search para `web_search`
    - Você precisa de uma `BRAVE_API_KEY` ou de detalhes do plano
summary: Configuração da Brave Search API para `web_search`
title: Brave Search (caminho legado)
x-i18n:
    generated_at: "2026-04-05T12:34:25Z"
    model: gpt-5.4
    provider: openai
    source_hash: 7788e4cee7dc460819e55095c87df8cea29ba3a8bd3cef4c0e98ac601b45b651
    source_path: brave-search.md
    workflow: 15
---

# Brave Search API

O OpenClaw oferece suporte à Brave Search API como provedor de `web_search`.

## Obtenha uma chave de API

1. Crie uma conta da Brave Search API em [https://brave.com/search/api/](https://brave.com/search/api/)
2. No painel, escolha o plano **Search** e gere uma chave de API.
3. Armazene a chave na configuração ou defina `BRAVE_API_KEY` no ambiente do Gateway.

## Exemplo de configuração

```json5
{
  plugins: {
    entries: {
      brave: {
        config: {
          webSearch: {
            apiKey: "BRAVE_API_KEY_HERE",
            mode: "web", // or "llm-context"
          },
        },
      },
    },
  },
  tools: {
    web: {
      search: {
        provider: "brave",
        maxResults: 5,
        timeoutSeconds: 30,
      },
    },
  },
}
```

As configurações de pesquisa Brave específicas do provedor agora ficam em `plugins.entries.brave.config.webSearch.*`.
O legado `tools.web.search.apiKey` ainda é carregado pelo shim de compatibilidade, mas não é mais o caminho de configuração canônico.

`webSearch.mode` controla o transporte do Brave:

- `web` (padrão): pesquisa normal na web do Brave com títulos, URLs e snippets
- `llm-context`: API LLM Context do Brave com blocos de texto pré-extraídos e fontes para grounding

## Parâmetros da ferramenta

| Parameter     | Description                                                         |
| ------------- | ------------------------------------------------------------------- |
| `query`       | Consulta de pesquisa (obrigatório)                                  |
| `count`       | Número de resultados a retornar (1-10, padrão: 5)                   |
| `country`     | Código de país ISO de 2 letras (ex.: "US", "DE")                    |
| `language`    | Código de idioma ISO 639-1 para resultados de pesquisa (ex.: "en", "de", "fr") |
| `search_lang` | Código de idioma de pesquisa do Brave (ex.: `en`, `en-gb`, `zh-hans`) |
| `ui_lang`     | Código de idioma ISO para elementos da interface                    |
| `freshness`   | Filtro de tempo: `day` (24h), `week`, `month` ou `year`             |
| `date_after`  | Apenas resultados publicados após esta data (AAAA-MM-DD)            |
| `date_before` | Apenas resultados publicados antes desta data (AAAA-MM-DD)          |

**Exemplos:**

```javascript
// Country and language-specific search
await web_search({
  query: "renewable energy",
  country: "DE",
  language: "de",
});

// Recent results (past week)
await web_search({
  query: "AI news",
  freshness: "week",
});

// Date range search
await web_search({
  query: "AI developments",
  date_after: "2024-01-01",
  date_before: "2024-06-30",
});
```

## Observações

- O OpenClaw usa o plano **Search** do Brave. Se você tiver uma assinatura legada (por exemplo, o plano Free original com 2.000 consultas/mês), ela continua válida, mas não inclui recursos mais novos, como LLM Context ou limites de taxa mais altos.
- Cada plano do Brave inclui **US$ 5/mês em crédito grátis** (renovável). O plano Search custa US$ 5 por 1.000 solicitações, então o crédito cobre 1.000 consultas/mês. Defina seu limite de uso no painel do Brave para evitar cobranças inesperadas. Consulte o [portal da API do Brave](https://brave.com/search/api/) para ver os planos atuais.
- O plano Search inclui o endpoint LLM Context e direitos de inferência de IA. Armazenar resultados para treinar ou ajustar modelos exige um plano com direitos explícitos de armazenamento. Consulte os [Termos de Serviço](https://api-dashboard.search.brave.com/terms-of-service) do Brave.
- O modo `llm-context` retorna entradas de fonte com grounding em vez do formato normal de snippet de pesquisa na web.
- O modo `llm-context` não oferece suporte a `ui_lang`, `freshness`, `date_after` nem `date_before`.
- `ui_lang` deve incluir uma subtag de região, como `en-US`.
- Os resultados ficam em cache por 15 minutos por padrão (configurável via `cacheTtlMinutes`).

Consulte [Ferramentas da web](/tools/web) para ver a configuração completa de `web_search`.
