---
read_when:
    - Você quer usar o Kimi para `web_search`
    - Você precisa de `KIMI_API_KEY` ou `MOONSHOT_API_KEY`
summary: Pesquisa na web do Kimi via pesquisa na web do Moonshot
title: Kimi Search
x-i18n:
    generated_at: "2026-04-05T12:54:57Z"
    model: gpt-5.4
    provider: openai
    source_hash: 753757a5497a683c35b4509ed3709b9514dc14a45612675d0f729ae6668c82a5
    source_path: tools/kimi-search.md
    workflow: 15
---

# Kimi Search

O OpenClaw oferece suporte ao Kimi como provedor de `web_search`, usando a pesquisa na web do Moonshot
para produzir respostas sintetizadas por IA com citações.

## Obtenha uma chave de API

<Steps>
  <Step title="Crie uma chave">
    Obtenha uma chave de API em [Moonshot AI](https://platform.moonshot.cn/).
  </Step>
  <Step title="Armazene a chave">
    Defina `KIMI_API_KEY` ou `MOONSHOT_API_KEY` no ambiente do Gateway, ou
    configure via:

    ```bash
    openclaw configure --section web
    ```

  </Step>
</Steps>

Quando você escolhe **Kimi** durante `openclaw onboard` ou
`openclaw configure --section web`, o OpenClaw também pode perguntar por:

- a região da API do Moonshot:
  - `https://api.moonshot.ai/v1`
  - `https://api.moonshot.cn/v1`
- o modelo padrão de pesquisa na web do Kimi (o padrão é `kimi-k2.5`)

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
            model: "kimi-k2.5",
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
`https://api.moonshot.cn/v1`), o OpenClaw reutiliza esse mesmo host para `web_search`
do Kimi quando `tools.web.search.kimi.baseUrl` é omitido, para que chaves de
[platform.moonshot.cn](https://platform.moonshot.cn/) não atinjam o
endpoint internacional por engano (que frequentemente retorna HTTP 401). Substitua
com `tools.web.search.kimi.baseUrl` quando precisar de uma URL base de pesquisa diferente.

**Alternativa por ambiente:** defina `KIMI_API_KEY` ou `MOONSHOT_API_KEY` no
ambiente do Gateway. Para uma instalação do gateway, coloque isso em `~/.openclaw/.env`.

Se você omitir `baseUrl`, o OpenClaw usará `https://api.moonshot.ai/v1` por padrão.
Se você omitir `model`, o OpenClaw usará `kimi-k2.5` por padrão.

## Como funciona

O Kimi usa a pesquisa na web do Moonshot para sintetizar respostas com citações em linha,
de forma semelhante à abordagem de resposta fundamentada do Gemini e do Grok.

## Parâmetros compatíveis

A pesquisa Kimi oferece suporte a `query`.

`count` é aceito para compatibilidade compartilhada com `web_search`, mas o Kimi ainda
retorna uma única resposta sintetizada com citações em vez de uma lista de N resultados.

No momento, filtros específicos do provedor não são compatíveis.

## Relacionado

- [Visão geral de Web Search](/tools/web) -- todos os provedores e detecção automática
- [Moonshot AI](/providers/moonshot) -- documentação do provedor de modelo Moonshot + Kimi Coding
- [Gemini Search](/tools/gemini-search) -- respostas sintetizadas por IA via grounding do Google
- [Grok Search](/tools/grok-search) -- respostas sintetizadas por IA via grounding do xAI
