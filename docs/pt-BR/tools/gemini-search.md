---
read_when:
    - Você quer usar Gemini para `web_search`
    - Você precisa de uma `GEMINI_API_KEY`
    - Você quer grounding do Google Search
summary: Busca na web com Gemini usando grounding do Google Search
title: Gemini Search
x-i18n:
    generated_at: "2026-04-05T12:54:44Z"
    model: gpt-5.4
    provider: openai
    source_hash: 42644176baca6b4b041142541618f6f68361d410d6f425cc4104cd88d9f7c480
    source_path: tools/gemini-search.md
    workflow: 15
---

# Gemini Search

O OpenClaw oferece suporte a modelos Gemini com
[grounding do Google Search](https://ai.google.dev/gemini-api/docs/grounding)
integrado, que retorna respostas sintetizadas por IA com base em resultados ao vivo do Google Search e com
citações.

## Obter uma chave de API

<Steps>
  <Step title="Criar uma chave">
    Vá para o [Google AI Studio](https://aistudio.google.com/apikey) e crie uma
    chave de API.
  </Step>
  <Step title="Armazenar a chave">
    Defina `GEMINI_API_KEY` no ambiente do Gateway ou configure via:

    ```bash
    openclaw configure --section web
    ```

  </Step>
</Steps>

## Configuração

```json5
{
  plugins: {
    entries: {
      google: {
        config: {
          webSearch: {
            apiKey: "AIza...", // opcional se GEMINI_API_KEY estiver definida
            model: "gemini-2.5-flash", // padrão
          },
        },
      },
    },
  },
  tools: {
    web: {
      search: {
        provider: "gemini",
      },
    },
  },
}
```

**Alternativa por ambiente:** defina `GEMINI_API_KEY` no ambiente do Gateway.
Para uma instalação do gateway, coloque-a em `~/.openclaw/.env`.

## Como funciona

Ao contrário de provedores de busca tradicionais que retornam uma lista de links e snippets,
o Gemini usa grounding do Google Search para produzir respostas sintetizadas por IA com
citações embutidas. Os resultados incluem tanto a resposta sintetizada quanto as
URLs de origem.

- URLs de citação do grounding do Gemini são automaticamente resolvidas de URLs
  de redirecionamento do Google para URLs diretas.
- A resolução de redirecionamento usa o caminho de proteção SSRF (HEAD + verificações de redirecionamento +
  validação de http/https) antes de retornar a URL de citação final.
- A resolução de redirecionamento usa padrões estritos de SSRF, portanto redirecionamentos para
  destinos privados/internos são bloqueados.

## Parâmetros compatíveis

A busca Gemini oferece suporte a `query`.

`count` é aceito para compatibilidade compartilhada com `web_search`, mas o grounding do Gemini
ainda retorna uma única resposta sintetizada com citações em vez de uma lista
com N resultados.

Filtros específicos do provedor como `country`, `language`, `freshness` e
`domain_filter` não são compatíveis.

## Seleção de modelo

O modelo padrão é `gemini-2.5-flash` (rápido e com bom custo-benefício). Qualquer modelo Gemini
que ofereça suporte a grounding pode ser usado via
`plugins.entries.google.config.webSearch.model`.

## Relacionado

- [Visão geral de busca na web](/tools/web) -- todos os provedores e detecção automática
- [Brave Search](/tools/brave-search) -- resultados estruturados com snippets
- [Perplexity Search](/tools/perplexity-search) -- resultados estruturados + extração de conteúdo
