---
read_when:
    - Você quer usar o Grok para `web_search`
    - Você precisa de uma `XAI_API_KEY` para busca na web
summary: Busca Grok via respostas fundamentadas na web da xAI
title: Busca Grok
x-i18n:
    generated_at: "2026-04-05T12:54:46Z"
    model: gpt-5.4
    provider: openai
    source_hash: ae2343012eebbe75d3ecdde3cb4470415c3275b694d0339bc26c46675a652054
    source_path: tools/grok-search.md
    workflow: 15
---

# Busca Grok

O OpenClaw oferece suporte ao Grok como provider de `web_search`, usando respostas
fundamentadas na web da xAI para produzir respostas sintetizadas por IA com base em resultados de busca ao vivo
com citações.

A mesma `XAI_API_KEY` também pode alimentar a ferramenta integrada `x_search` para busca de posts no X
(antigo Twitter). Se você armazenar a chave em
`plugins.entries.xai.config.webSearch.apiKey`, o OpenClaw agora também a reutiliza como
fallback para o provider de modelo xAI empacotado.

Para métricas de posts do X, como reposts, respostas, favoritos ou visualizações, prefira
`x_search` com a URL exata do post ou o ID do status em vez de uma consulta ampla
de busca.

## Onboarding e configuração

Se você escolher **Grok** durante:

- `openclaw onboard`
- `openclaw configure --section web`

O OpenClaw pode mostrar uma etapa adicional separada para ativar `x_search` com a mesma
`XAI_API_KEY`. Essa etapa adicional:

- aparece apenas depois que você escolhe Grok para `web_search`
- não é uma escolha separada de provider de busca na web no nível superior
- pode opcionalmente definir o modelo `x_search` durante o mesmo fluxo

Se você pular essa etapa, poderá ativar ou alterar `x_search` depois na configuração.

## Obtenha uma chave de API

<Steps>
  <Step title="Crie uma chave">
    Obtenha uma chave de API em [xAI](https://console.x.ai/).
  </Step>
  <Step title="Armazene a chave">
    Defina `XAI_API_KEY` no ambiente do Gateway ou configure por meio de:

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
      xai: {
        config: {
          webSearch: {
            apiKey: "xai-...", // opcional se XAI_API_KEY estiver definida
          },
        },
      },
    },
  },
  tools: {
    web: {
      search: {
        provider: "grok",
      },
    },
  },
}
```

**Alternativa por ambiente:** defina `XAI_API_KEY` no ambiente do Gateway.
Para uma instalação de gateway, coloque-a em `~/.openclaw/.env`.

## Como funciona

O Grok usa respostas fundamentadas na web da xAI para sintetizar respostas com
citações inline, de forma semelhante à abordagem de grounding do Google Search do Gemini.

## Parâmetros compatíveis

A busca Grok oferece suporte a `query`.

`count` é aceito para compatibilidade compartilhada com `web_search`, mas o Grok ainda
retorna uma resposta sintetizada com citações em vez de uma lista com N resultados.

Filtros específicos do provider não são compatíveis no momento.

## Relacionados

- [Visão geral do Web Search](/tools/web) -- todos os providers e detecção automática
- [x_search em Web Search](/tools/web#x_search) -- busca de primeira classe no X via xAI
- [Busca Gemini](/tools/gemini-search) -- respostas sintetizadas por IA via grounding do Google
