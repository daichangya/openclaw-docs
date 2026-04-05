---
read_when:
    - Você quer usar Ollama para `web_search`
    - Você quer um provedor `web_search` sem chave
    - Você precisa de orientações de configuração do Ollama Web Search
summary: Busca na web com Ollama via seu host Ollama configurado
title: Ollama Web Search
x-i18n:
    generated_at: "2026-04-05T12:55:18Z"
    model: gpt-5.4
    provider: openai
    source_hash: 3c1d0765594e0eb368c25cca21a712c054e71cf43e7bfb385d10feddd990f4fd
    source_path: tools/ollama-search.md
    workflow: 15
---

# Ollama Web Search

O OpenClaw oferece suporte ao **Ollama Web Search** como um provedor `web_search` empacotado.
Ele usa a API experimental de busca na web do Ollama e retorna resultados estruturados
com títulos, URLs e snippets.

Ao contrário do provedor de modelo Ollama, esta configuração não precisa de chave de API por
padrão. Ela exige:

- um host Ollama que possa ser alcançado a partir do OpenClaw
- `ollama signin`

## Configuração

<Steps>
  <Step title="Iniciar o Ollama">
    Verifique se o Ollama está instalado e em execução.
  </Step>
  <Step title="Fazer login">
    Execute:

    ```bash
    ollama signin
    ```

  </Step>
  <Step title="Escolher Ollama Web Search">
    Execute:

    ```bash
    openclaw configure --section web
    ```

    Depois selecione **Ollama Web Search** como provedor.

  </Step>
</Steps>

Se você já usa o Ollama para modelos, o Ollama Web Search reutiliza o mesmo
host configurado.

## Configuração

```json5
{
  tools: {
    web: {
      search: {
        provider: "ollama",
      },
    },
  },
}
```

Substituição opcional do host Ollama:

```json5
{
  models: {
    providers: {
      ollama: {
        baseUrl: "http://ollama-host:11434",
      },
    },
  },
}
```

Se nenhuma base URL explícita do Ollama for definida, o OpenClaw usa `http://127.0.0.1:11434`.

Se o seu host Ollama espera autenticação bearer, o OpenClaw reutiliza
`models.providers.ollama.apiKey` (ou a autenticação correspondente do provedor baseada em env)
também para requisições de busca na web.

## Observações

- Nenhum campo específico de chave de API para busca na web é necessário para esse provedor.
- Se o host Ollama estiver protegido por autenticação, o OpenClaw reutiliza a chave de API
  normal do provedor Ollama quando presente.
- O OpenClaw emite um aviso durante a configuração se o Ollama estiver inacessível ou sem login, mas
  não bloqueia a seleção.
- A detecção automática em runtime pode usar Ollama Web Search como fallback quando nenhum provedor com credenciais de prioridade maior estiver configurado.
- O provedor usa o endpoint experimental `/api/experimental/web_search`
  do Ollama.

## Relacionado

- [Visão geral de busca na web](/tools/web) -- todos os provedores e detecção automática
- [Ollama](/providers/ollama) -- configuração de modelo Ollama e modos cloud/local
