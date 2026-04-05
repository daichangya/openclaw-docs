---
read_when:
    - Você quer configurar o Perplexity como provedor de pesquisa na web
    - Você precisa da chave de API do Perplexity ou da configuração de proxy do OpenRouter
summary: Configuração do provedor de pesquisa na web Perplexity (chave de API, modos de pesquisa, filtragem)
title: Perplexity (Provedor)
x-i18n:
    generated_at: "2026-04-05T12:51:25Z"
    model: gpt-5.4
    provider: openai
    source_hash: df9082d15d6a36a096e21efe8cee78e4b8643252225520f5b96a0b99cf5a7a4b
    source_path: providers/perplexity-provider.md
    workflow: 15
---

# Perplexity (Provedor de Pesquisa na Web)

O plugin Perplexity fornece recursos de pesquisa na web por meio da
API de Search do Perplexity ou do Perplexity Sonar via OpenRouter.

<Note>
Esta página cobre a configuração do **provedor** Perplexity. Para a
**ferramenta** Perplexity (como o agente a utiliza), consulte [Perplexity tool](/tools/perplexity-search).
</Note>

- Tipo: provedor de pesquisa na web (não é um provedor de modelo)
- Autenticação: `PERPLEXITY_API_KEY` (direto) ou `OPENROUTER_API_KEY` (via OpenRouter)
- Caminho de configuração: `plugins.entries.perplexity.config.webSearch.apiKey`

## Início rápido

1. Defina a chave de API:

```bash
openclaw configure --section web
```

Ou defina-a diretamente:

```bash
openclaw config set plugins.entries.perplexity.config.webSearch.apiKey "pplx-xxxxxxxxxxxx"
```

2. O agente usará automaticamente o Perplexity para pesquisas na web quando estiver configurado.

## Modos de pesquisa

O plugin seleciona automaticamente o transporte com base no prefixo da chave de API:

| Prefixo da chave | Transporte                     | Recursos                                        |
| ---------------- | ------------------------------ | ----------------------------------------------- |
| `pplx-`          | API nativa de Search do Perplexity | Resultados estruturados, filtros de domínio/idioma/data |
| `sk-or-`         | OpenRouter (Sonar)             | Respostas sintetizadas por IA com citações      |

## Filtragem da API nativa

Ao usar a API nativa do Perplexity (`pplx-` key), as pesquisas têm suporte a:

- **País**: código de país de 2 letras
- **Idioma**: código de idioma ISO 639-1
- **Intervalo de datas**: dia, semana, mês, ano
- **Filtros de domínio**: allowlist/denylist (máximo de 20 domínios)
- **Orçamento de conteúdo**: `max_tokens`, `max_tokens_per_page`

## Observação sobre o ambiente

Se o Gateway estiver em execução como daemon (launchd/systemd), certifique-se de que
`PERPLEXITY_API_KEY` esteja disponível para esse processo (por exemplo, em
`~/.openclaw/.env` ou via `env.shellEnv`).
