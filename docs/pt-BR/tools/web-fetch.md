---
read_when:
    - Você quer buscar uma URL e extrair conteúdo legível
    - Você precisa configurar o web_fetch ou seu fallback do Firecrawl
    - Você quer entender os limites e o cache do web_fetch
sidebarTitle: Web Fetch
summary: ferramenta web_fetch -- busca HTTP com extração de conteúdo legível
title: Web Fetch
x-i18n:
    generated_at: "2026-04-05T12:56:40Z"
    model: gpt-5.4
    provider: openai
    source_hash: 60c933a25d0f4511dc1683985988e115b836244c5eac4c6667b67c8eb15401e0
    source_path: tools/web-fetch.md
    workflow: 15
---

# Web Fetch

A ferramenta `web_fetch` faz um HTTP GET simples e extrai conteúdo legível
(HTML para markdown ou texto). Ela **não** executa JavaScript.

Para sites com uso intenso de JS ou páginas protegidas por login, use o
[Web Browser](/pt-BR/tools/browser).

## Início rápido

`web_fetch` é **ativado por padrão** -- nenhuma configuração é necessária. O agente pode
chamá-lo imediatamente:

```javascript
await web_fetch({ url: "https://example.com/article" });
```

## Parâmetros da ferramenta

| Parâmetro    | Tipo     | Descrição                                    |
| ------------ | -------- | -------------------------------------------- |
| `url`        | `string` | URL para buscar (obrigatório, apenas http/https) |
| `extractMode`| `string` | `"markdown"` (padrão) ou `"text"`            |
| `maxChars`   | `number` | Trunca a saída para este número de caracteres |

## Como funciona

<Steps>
  <Step title="Busca">
    Envia um HTTP GET com um User-Agent semelhante ao do Chrome e o cabeçalho
    `Accept-Language`. Bloqueia nomes de host privados/internos e verifica novamente os redirecionamentos.
  </Step>
  <Step title="Extração">
    Executa o Readability (extração do conteúdo principal) na resposta HTML.
  </Step>
  <Step title="Fallback (opcional)">
    Se o Readability falhar e o Firecrawl estiver configurado, tenta novamente por meio da
    API do Firecrawl com modo de contorno de bot.
  </Step>
  <Step title="Cache">
    Os resultados ficam em cache por 15 minutos (configurável) para reduzir buscas
    repetidas da mesma URL.
  </Step>
</Steps>

## Configuração

```json5
{
  tools: {
    web: {
      fetch: {
        enabled: true, // padrão: true
        provider: "firecrawl", // opcional; omita para detecção automática
        maxChars: 50000, // máximo de caracteres na saída
        maxCharsCap: 50000, // limite rígido para o parâmetro maxChars
        maxResponseBytes: 2000000, // tamanho máximo de download antes do truncamento
        timeoutSeconds: 30,
        cacheTtlMinutes: 15,
        maxRedirects: 3,
        readability: true, // usa extração do Readability
        userAgent: "Mozilla/5.0 ...", // substitui o User-Agent
      },
    },
  },
}
```

## Fallback do Firecrawl

Se a extração do Readability falhar, `web_fetch` pode usar
[Firecrawl](/pt-BR/tools/firecrawl) como fallback para contorno de bot e melhor extração:

```json5
{
  tools: {
    web: {
      fetch: {
        provider: "firecrawl", // opcional; omita para detecção automática a partir das credenciais disponíveis
      },
    },
  },
  plugins: {
    entries: {
      firecrawl: {
        enabled: true,
        config: {
          webFetch: {
            apiKey: "fc-...", // opcional se FIRECRAWL_API_KEY estiver definido
            baseUrl: "https://api.firecrawl.dev",
            onlyMainContent: true,
            maxAgeMs: 86400000, // duração do cache (1 dia)
            timeoutSeconds: 60,
          },
        },
      },
    },
  },
}
```

`plugins.entries.firecrawl.config.webFetch.apiKey` oferece suporte a objetos SecretRef.
A configuração legada `tools.web.fetch.firecrawl.*` é migrada automaticamente por `openclaw doctor --fix`.

<Note>
  Se o Firecrawl estiver ativado e seu SecretRef não for resolvido, sem
  fallback da variável de ambiente `FIRECRAWL_API_KEY`, a inicialização do gateway falhará imediatamente.
</Note>

<Note>
  As substituições de `baseUrl` do Firecrawl são restritas: elas devem usar `https://` e
  o host oficial do Firecrawl (`api.firecrawl.dev`).
</Note>

Comportamento atual em runtime:

- `tools.web.fetch.provider` seleciona explicitamente o provedor de fallback de busca.
- Se `provider` for omitido, o OpenClaw detectará automaticamente o primeiro
  provedor de web-fetch pronto a partir das credenciais disponíveis. Hoje, o provedor incluído é o Firecrawl.
- Se o Readability estiver desativado, `web_fetch` irá diretamente para o
  fallback do provedor selecionado. Se nenhum provedor estiver disponível, ele falhará de forma fechada.

## Limites e segurança

- `maxChars` é limitado por `tools.web.fetch.maxCharsCap`
- O corpo da resposta é limitado por `maxResponseBytes` antes da análise; respostas
  grandes demais são truncadas com um aviso
- Nomes de host privados/internos são bloqueados
- Os redirecionamentos são verificados e limitados por `maxRedirects`
- `web_fetch` é melhor esforço -- alguns sites precisam do [Web Browser](/pt-BR/tools/browser)

## Perfis de ferramentas

Se você usa perfis de ferramentas ou listas de permissões, adicione `web_fetch` ou `group:web`:

```json5
{
  tools: {
    allow: ["web_fetch"],
    // ou: allow: ["group:web"]  (inclui web_fetch, web_search e x_search)
  },
}
```

## Relacionados

- [Web Search](/tools/web) -- pesquise na web com vários provedores
- [Web Browser](/pt-BR/tools/browser) -- automação completa de navegador para sites com uso intenso de JS
- [Firecrawl](/pt-BR/tools/firecrawl) -- ferramentas de busca e scraping do Firecrawl
