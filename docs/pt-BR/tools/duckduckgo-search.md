---
read_when:
    - Você quer um provedor de pesquisa na web que não exija chave de API
    - Você quer usar o DuckDuckGo para `web_search`
    - Você precisa de um fallback de pesquisa sem configuração
summary: Pesquisa na web com DuckDuckGo -- provedor de fallback sem chave (experimental, baseado em HTML)
title: Pesquisa DuckDuckGo
x-i18n:
    generated_at: "2026-04-05T12:54:26Z"
    model: gpt-5.4
    provider: openai
    source_hash: 31f8e3883584534396c247c3d8069ea4c5b6399e0ff13a9dd0c8ee0c3da02096
    source_path: tools/duckduckgo-search.md
    workflow: 15
---

# Pesquisa DuckDuckGo

O OpenClaw oferece suporte ao DuckDuckGo como um provedor `web_search` **sem chave**. Nenhuma
chave de API ou conta é necessária.

<Warning>
  O DuckDuckGo é uma integração **experimental e não oficial** que obtém resultados
  das páginas de pesquisa sem JavaScript do DuckDuckGo — não de uma API oficial. Espere
  quebras ocasionais causadas por páginas de desafio anti-bot ou mudanças no HTML.
</Warning>

## Setup

Nenhuma chave de API é necessária — basta definir o DuckDuckGo como seu provedor:

<Steps>
  <Step title="Configurar">
    ```bash
    openclaw configure --section web
    # Selecione "duckduckgo" como provedor
    ```
  </Step>
</Steps>

## Configuração

```json5
{
  tools: {
    web: {
      search: {
        provider: "duckduckgo",
      },
    },
  },
}
```

Configurações opcionais no nível do plugin para região e SafeSearch:

```json5
{
  plugins: {
    entries: {
      duckduckgo: {
        config: {
          webSearch: {
            region: "us-en", // código de região do DuckDuckGo
            safeSearch: "moderate", // "strict", "moderate", ou "off"
          },
        },
      },
    },
  },
}
```

## Parâmetros da ferramenta

| Parâmetro    | Descrição                                                           |
| ------------ | ------------------------------------------------------------------- |
| `query`      | Consulta de pesquisa (obrigatória)                                  |
| `count`      | Resultados a retornar (1-10, padrão: 5)                             |
| `region`     | Código de região do DuckDuckGo (por exemplo, `us-en`, `uk-en`, `de-de`) |
| `safeSearch` | Nível de SafeSearch: `strict`, `moderate` (padrão) ou `off`         |

`region` e `safeSearch` também podem ser definidos na configuração do plugin (veja acima) — os
parâmetros da ferramenta substituem os valores de configuração por consulta.

## Observações

- **Sem chave de API** — funciona imediatamente, sem configuração
- **Experimental** — coleta resultados das páginas de pesquisa HTML sem JavaScript
  do DuckDuckGo, não de uma API ou SDK oficial
- **Risco de desafio anti-bot** — o DuckDuckGo pode exibir CAPTCHAs ou bloquear solicitações
  sob uso intenso ou automatizado
- **Parsing de HTML** — os resultados dependem da estrutura da página, que pode mudar sem
  aviso
- **Ordem de autodetecção** — o DuckDuckGo é o primeiro fallback sem chave
  (ordem 100) na autodetecção. Provedores com chave de API configurada são executados
  primeiro, depois Ollama Web Search (ordem 110), depois SearXNG (ordem 200)
- **SafeSearch usa `moderate` por padrão** quando não configurado

<Tip>
  Para uso em produção, considere [Brave Search](/tools/brave-search) (com camada gratuita
  disponível) ou outro provedor com API oficial.
</Tip>

## Relacionado

- [Visão geral do Web Search](/tools/web) -- todos os provedores e autodetecção
- [Brave Search](/tools/brave-search) -- resultados estruturados com camada gratuita
- [Exa Search](/tools/exa-search) -- pesquisa neural com extração de conteúdo
