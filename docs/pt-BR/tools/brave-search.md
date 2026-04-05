---
read_when:
    - Você quer usar Brave Search para `web_search`
    - Você precisa de um `BRAVE_API_KEY` ou detalhes do plano
summary: Configuração da Brave Search API para `web_search`
title: Brave Search
x-i18n:
    generated_at: "2026-04-05T12:53:53Z"
    model: gpt-5.4
    provider: openai
    source_hash: bc026a69addf74375a0e407805b875ff527c77eb7298b2f5bb0e165197f77c0c
    source_path: tools/brave-search.md
    workflow: 15
---

# Brave Search API

O OpenClaw oferece suporte à Brave Search API como provedor de `web_search`.

## Obtenha uma chave de API

1. Crie uma conta da Brave Search API em [https://brave.com/search/api/](https://brave.com/search/api/)
2. No dashboard, escolha o plano **Search** e gere uma chave de API.
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
            mode: "web", // ou "llm-context"
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

As configurações específicas de busca Brave por provedor agora ficam em `plugins.entries.brave.config.webSearch.*`.
O legado `tools.web.search.apiKey` ainda carrega por meio da camada de compatibilidade, mas não é mais o caminho canônico de configuração.

`webSearch.mode` controla o transporte da Brave:

- `web` (padrão): busca web normal da Brave com títulos, URLs e snippets
- `llm-context`: API LLM Context da Brave com blocos de texto previamente extraídos e fontes para grounding

## Parâmetros da ferramenta

| Parâmetro     | Descrição                                                           |
| ------------- | ------------------------------------------------------------------- |
| `query`       | Consulta de busca (obrigatório)                                     |
| `count`       | Número de resultados a retornar (1-10, padrão: 5)                   |
| `country`     | Código de país ISO de 2 letras (por exemplo, `"US"`, `"DE"`)        |
| `language`    | Código de idioma ISO 639-1 para resultados de busca (por exemplo, `"en"`, `"de"`, `"fr"`) |
| `search_lang` | Código de idioma de busca da Brave (por exemplo, `en`, `en-gb`, `zh-hans`) |
| `ui_lang`     | Código de idioma ISO para elementos da interface                    |
| `freshness`   | Filtro de tempo: `day` (24h), `week`, `month` ou `year`             |
| `date_after`  | Apenas resultados publicados após esta data (YYYY-MM-DD)            |
| `date_before` | Apenas resultados publicados antes desta data (YYYY-MM-DD)          |

**Exemplos:**

```javascript
// Busca específica por país e idioma
await web_search({
  query: "renewable energy",
  country: "DE",
  language: "de",
});

// Resultados recentes (última semana)
await web_search({
  query: "AI news",
  freshness: "week",
});

// Busca por intervalo de datas
await web_search({
  query: "AI developments",
  date_after: "2024-01-01",
  date_before: "2024-06-30",
});
```

## Observações

- O OpenClaw usa o plano **Search** da Brave. Se você tiver uma assinatura legada (por exemplo, o plano Free original com 2.000 consultas/mês), ela continua válida, mas não inclui recursos mais novos, como LLM Context ou limites de taxa mais altos.
- Cada plano Brave inclui **US$5/mês em crédito gratuito** (renovável). O plano Search custa US$5 por 1.000 solicitações, então o crédito cobre 1.000 consultas/mês. Defina seu limite de uso no dashboard da Brave para evitar cobranças inesperadas. Consulte o [portal de API da Brave](https://brave.com/search/api/) para ver os planos atuais.
- O plano Search inclui o endpoint LLM Context e direitos de inferência de IA. Armazenar resultados para treinar ou ajustar modelos exige um plano com direitos explícitos de armazenamento. Consulte os [Terms of Service](https://api-dashboard.search.brave.com/terms-of-service) da Brave.
- O modo `llm-context` retorna entradas de fonte fundamentadas em vez do formato normal de snippet de busca web.
- O modo `llm-context` não oferece suporte a `ui_lang`, `freshness`, `date_after` ou `date_before`.
- `ui_lang` deve incluir uma subtag de região, como `en-US`.
- Os resultados são armazenados em cache por 15 minutos por padrão (configurável via `cacheTtlMinutes`).

## Relacionado

- [Visão geral de Web Search](/tools/web) -- todos os provedores e detecção automática
- [Perplexity Search](/tools/perplexity-search) -- resultados estruturados com filtragem por domínio
- [Exa Search](/tools/exa-search) -- busca neural com extração de conteúdo
