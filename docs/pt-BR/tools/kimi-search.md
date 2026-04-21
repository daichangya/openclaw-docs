---
read_when:
    - Você quer usar o Kimi para `web_search`
    - Você precisa de um `KIMI_API_KEY` ou `MOONSHOT_API_KEY`
summary: Busca na web com Kimi via busca na web da Moonshot
title: Busca Kimi
x-i18n:
    generated_at: "2026-04-21T05:43:43Z"
    model: gpt-5.4
    provider: openai
    source_hash: ee0c8cd0e7c2edf8e05d22fbb5ef7338c9f68e7ac791eee024c73333936bb75a
    source_path: tools/kimi-search.md
    workflow: 15
---

# Busca Kimi

O OpenClaw oferece suporte ao Kimi como provider de `web_search`, usando a busca na web da Moonshot
para produzir respostas sintetizadas por IA com citações.

## Obtenha uma chave de API

<Steps>
  <Step title="Crie uma chave">
    Obtenha uma chave de API em [Moonshot AI](https://platform.moonshot.cn/).
  </Step>
  <Step title="Armazene a chave">
    Defina `KIMI_API_KEY` ou `MOONSHOT_API_KEY` no ambiente do Gateway, ou
    configure por meio de:

    ```bash
    openclaw configure --section web
    ```

  </Step>
</Steps>

Quando você escolhe **Kimi** durante `openclaw onboard` ou
`openclaw configure --section web`, o OpenClaw também pode perguntar por:

- a região da API Moonshot:
  - `https://api.moonshot.ai/v1`
  - `https://api.moonshot.cn/v1`
- o modelo padrão de busca na web do Kimi (o padrão é `kimi-k2.6`)

## Configuração

```json5
{
  plugins: {
    entries: {
      moonshot: {
        config: {
          webSearch: {
            apiKey: "sk-...", // opcional se KIMI_API_KEY ou MOONSHOT_API_KEY estiver definido
            baseUrl: "https://api.moonshot.ai/v1",
            model: "kimi-k2.6",
          },
        },
      },
    },
  },
  tools: {
    web: {
      search: {
        provider: "kimi",
      },
    },
  },
}
```

Se você usar o host da API da China para chat (`models.providers.moonshot.baseUrl`:
`https://api.moonshot.cn/v1`), o OpenClaw reutiliza esse mesmo host para
`web_search` do Kimi quando `tools.web.search.kimi.baseUrl` é omitido, para que chaves de
[platform.moonshot.cn](https://platform.moonshot.cn/) não atinjam o
endpoint internacional por engano (o que frequentemente retorna HTTP 401). Substitua
com `tools.web.search.kimi.baseUrl` quando precisar de uma URL base de busca diferente.

**Alternativa por ambiente:** defina `KIMI_API_KEY` ou `MOONSHOT_API_KEY` no
ambiente do Gateway. Para uma instalação do gateway, coloque-a em `~/.openclaw/.env`.

Se você omitir `baseUrl`, o OpenClaw usará por padrão `https://api.moonshot.ai/v1`.
Se você omitir `model`, o OpenClaw usará por padrão `kimi-k2.6`.

## Como funciona

O Kimi usa a busca na web da Moonshot para sintetizar respostas com citações inline,
de forma semelhante à abordagem de resposta fundamentada do Gemini e do Grok.

## Parâmetros compatíveis

A busca Kimi aceita `query`.

`count` é aceito para compatibilidade com `web_search` compartilhado, mas o Kimi ainda
retorna uma resposta sintetizada com citações, em vez de uma lista com N resultados.

Filtros específicos do provider não são compatíveis no momento.

## Relacionado

- [Visão geral da busca na web](/pt-BR/tools/web) -- todos os providers e detecção automática
- [Moonshot AI](/pt-BR/providers/moonshot) -- documentação do provider de modelo Moonshot + Kimi Coding
- [Busca Gemini](/pt-BR/tools/gemini-search) -- respostas sintetizadas por IA via grounding do Google
- [Busca Grok](/pt-BR/tools/grok-search) -- respostas sintetizadas por IA via grounding do xAI
