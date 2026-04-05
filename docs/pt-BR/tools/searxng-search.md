---
read_when:
    - Você quer um provedor de pesquisa na web auto-hospedado
    - Você quer usar o SearXNG para `web_search`
    - Você precisa de uma opção de pesquisa focada em privacidade ou isolada da internet
summary: Pesquisa na web com SearXNG -- provedor de meta-pesquisa auto-hospedado e sem chave
title: Pesquisa SearXNG
x-i18n:
    generated_at: "2026-04-05T12:55:58Z"
    model: gpt-5.4
    provider: openai
    source_hash: 0a8fc7f890b7595d17c5ef8aede9b84bb2459f30a53d5d87c4e7423e1ac83ca5
    source_path: tools/searxng-search.md
    workflow: 15
---

# Pesquisa SearXNG

O OpenClaw oferece suporte ao [SearXNG](https://docs.searxng.org/) como um provedor `web_search` **auto-hospedado e sem chave**. O SearXNG é um mecanismo de meta-pesquisa de código aberto que agrega resultados do Google, Bing, DuckDuckGo e outras fontes.

Vantagens:

- **Gratuito e ilimitado** -- nenhuma chave de API nem assinatura comercial é necessária
- **Privacidade / isolamento da internet** -- as consultas nunca saem da sua rede
- **Funciona em qualquer lugar** -- sem restrições regionais de APIs comerciais de pesquisa

## Configuração

<Steps>
  <Step title="Execute uma instância do SearXNG">
    ```bash
    docker run -d -p 8888:8080 searxng/searxng
    ```

    Ou use qualquer implantação existente do SearXNG à qual você tenha acesso. Consulte a [documentação do SearXNG](https://docs.searxng.org/) para a configuração de produção.

  </Step>
  <Step title="Configure">
    ```bash
    openclaw configure --section web
    # Select "searxng" as the provider
    ```

    Ou defina a variável de ambiente e deixe a detecção automática encontrá-lo:

    ```bash
    export SEARXNG_BASE_URL="http://localhost:8888"
    ```

  </Step>
</Steps>

## Configuração

```json5
{
  tools: {
    web: {
      search: {
        provider: "searxng",
      },
    },
  },
}
```

Configurações no nível do plugin para a instância do SearXNG:

```json5
{
  plugins: {
    entries: {
      searxng: {
        config: {
          webSearch: {
            baseUrl: "http://localhost:8888",
            categories: "general,news", // optional
            language: "en", // optional
          },
        },
      },
    },
  },
}
```

O campo `baseUrl` também aceita objetos SecretRef.

Regras de transporte:

- `https://` funciona para hosts SearXNG públicos ou privados
- `http://` é aceito apenas para hosts confiáveis em rede privada ou loopback
- hosts SearXNG públicos devem usar `https://`

## Variável de ambiente

Defina `SEARXNG_BASE_URL` como alternativa à configuração:

```bash
export SEARXNG_BASE_URL="http://localhost:8888"
```

Quando `SEARXNG_BASE_URL` é definida e nenhum provedor explícito está configurado, a detecção automática seleciona o SearXNG automaticamente (na prioridade mais baixa -- qualquer provedor com suporte a API e com chave configurada vence primeiro).

## Referência de configuração do plugin

| Campo        | Descrição                                                          |
| ------------ | ------------------------------------------------------------------ |
| `baseUrl`    | URL base da sua instância do SearXNG (obrigatório)                 |
| `categories` | Categorias separadas por vírgula, como `general`, `news` ou `science` |
| `language`   | Código de idioma para resultados, como `en`, `de` ou `fr`          |

## Observações

- **API JSON** -- usa o endpoint nativo `format=json` do SearXNG, não raspagem de HTML
- **Sem chave de API** -- funciona com qualquer instância do SearXNG pronta para uso
- **Validação da URL base** -- `baseUrl` deve ser uma URL `http://` ou `https://` válida; hosts públicos devem usar `https://`
- **Ordem de detecção automática** -- o SearXNG é verificado por último (ordem 200) na detecção automática. Provedores com suporte a API e com chaves configuradas são executados primeiro, depois o DuckDuckGo (ordem 100) e depois o Ollama Web Search (ordem 110)
- **Auto-hospedado** -- você controla a instância, as consultas e os mecanismos de pesquisa upstream
- **Categories** usa `general` por padrão quando não está configurado

<Tip>
  Para a API JSON do SearXNG funcionar, verifique se a sua instância do SearXNG tem o formato `json` habilitado em `settings.yml`, em `search.formats`.
</Tip>

## Relacionado

- [Visão geral da pesquisa na web](/tools/web) -- todos os provedores e a detecção automática
- [Pesquisa DuckDuckGo](/pt-BR/tools/duckduckgo-search) -- outra alternativa sem chave
- [Pesquisa Brave](/pt-BR/tools/brave-search) -- resultados estruturados com nível gratuito
