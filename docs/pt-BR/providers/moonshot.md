---
read_when:
    - Você quer configurar Moonshot K2 (Moonshot Open Platform) vs Kimi Coding
    - Você precisa entender endpoints, chaves e referências de modelo separados
    - Você quer uma configuração de copiar e colar para qualquer um dos provedores
summary: Configure Moonshot K2 vs Kimi Coding (provedores + chaves separados)
title: Moonshot AI
x-i18n:
    generated_at: "2026-04-05T12:51:20Z"
    model: gpt-5.4
    provider: openai
    source_hash: a80c71ef432b778e296bd60b7d9ec7c72d025d13fd9bdae474b3d58436d15695
    source_path: providers/moonshot.md
    workflow: 15
---

# Moonshot AI (Kimi)

A Moonshot fornece a API Kimi com endpoints compatíveis com OpenAI. Configure o
provedor e defina o modelo padrão como `moonshot/kimi-k2.5`, ou use
Kimi Coding com `kimi/kimi-code`.

IDs atuais de modelo Kimi K2:

[//]: # "moonshot-kimi-k2-ids:start"

- `kimi-k2.5`
- `kimi-k2-thinking`
- `kimi-k2-thinking-turbo`
- `kimi-k2-turbo`

[//]: # "moonshot-kimi-k2-ids:end"

```bash
openclaw onboard --auth-choice moonshot-api-key
# ou
openclaw onboard --auth-choice moonshot-api-key-cn
```

Kimi Coding:

```bash
openclaw onboard --auth-choice kimi-code-api-key
```

Observação: Moonshot e Kimi Coding são provedores separados. As chaves não são intercambiáveis, os endpoints são diferentes e as referências de modelo também (Moonshot usa `moonshot/...`, Kimi Coding usa `kimi/...`).

A pesquisa na web do Kimi também usa o plugin Moonshot:

```bash
openclaw configure --section web
```

Escolha **Kimi** na seção de pesquisa na web para armazenar
`plugins.entries.moonshot.config.webSearch.*`.

## Trecho de configuração (API Moonshot)

```json5
{
  env: { MOONSHOT_API_KEY: "sk-..." },
  agents: {
    defaults: {
      model: { primary: "moonshot/kimi-k2.5" },
      models: {
        // moonshot-kimi-k2-aliases:start
        "moonshot/kimi-k2.5": { alias: "Kimi K2.5" },
        "moonshot/kimi-k2-thinking": { alias: "Kimi K2 Thinking" },
        "moonshot/kimi-k2-thinking-turbo": { alias: "Kimi K2 Thinking Turbo" },
        "moonshot/kimi-k2-turbo": { alias: "Kimi K2 Turbo" },
        // moonshot-kimi-k2-aliases:end
      },
    },
  },
  models: {
    mode: "merge",
    providers: {
      moonshot: {
        baseUrl: "https://api.moonshot.ai/v1",
        apiKey: "${MOONSHOT_API_KEY}",
        api: "openai-completions",
        models: [
          // moonshot-kimi-k2-models:start
          {
            id: "kimi-k2.5",
            name: "Kimi K2.5",
            reasoning: false,
            input: ["text", "image"],
            cost: { input: 0, output: 0, cacheRead: 0, cacheWrite: 0 },
            contextWindow: 262144,
            maxTokens: 262144,
          },
          {
            id: "kimi-k2-thinking",
            name: "Kimi K2 Thinking",
            reasoning: true,
            input: ["text"],
            cost: { input: 0, output: 0, cacheRead: 0, cacheWrite: 0 },
            contextWindow: 262144,
            maxTokens: 262144,
          },
          {
            id: "kimi-k2-thinking-turbo",
            name: "Kimi K2 Thinking Turbo",
            reasoning: true,
            input: ["text"],
            cost: { input: 0, output: 0, cacheRead: 0, cacheWrite: 0 },
            contextWindow: 262144,
            maxTokens: 262144,
          },
          {
            id: "kimi-k2-turbo",
            name: "Kimi K2 Turbo",
            reasoning: false,
            input: ["text"],
            cost: { input: 0, output: 0, cacheRead: 0, cacheWrite: 0 },
            contextWindow: 256000,
            maxTokens: 16384,
          },
          // moonshot-kimi-k2-models:end
        ],
      },
    },
  },
}
```

## Kimi Coding

```json5
{
  env: { KIMI_API_KEY: "sk-..." },
  agents: {
    defaults: {
      model: { primary: "kimi/kimi-code" },
      models: {
        "kimi/kimi-code": { alias: "Kimi" },
      },
    },
  },
}
```

## Pesquisa na web do Kimi

O OpenClaw também inclui **Kimi** como provedor `web_search`, com base na pesquisa
na web da Moonshot.

O setup interativo pode solicitar:

- a região da API Moonshot:
  - `https://api.moonshot.ai/v1`
  - `https://api.moonshot.cn/v1`
- o modelo padrão de pesquisa na web do Kimi (o padrão é `kimi-k2.5`)

A configuração fica em `plugins.entries.moonshot.config.webSearch`:

```json5
{
  plugins: {
    entries: {
      moonshot: {
        config: {
          webSearch: {
            apiKey: "sk-...", // ou use KIMI_API_KEY / MOONSHOT_API_KEY
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

## Observações

- As referências de modelo Moonshot usam `moonshot/<modelId>`. As referências de modelo Kimi Coding usam `kimi/<modelId>`.
- A referência de modelo padrão atual do Kimi Coding é `kimi/kimi-code`. O legado `kimi/k2p5` continua aceito como ID de modelo de compatibilidade.
- A pesquisa na web do Kimi usa `KIMI_API_KEY` ou `MOONSHOT_API_KEY` e, por padrão, usa `https://api.moonshot.ai/v1` com o modelo `kimi-k2.5`.
- Os endpoints nativos da Moonshot (`https://api.moonshot.ai/v1` e
  `https://api.moonshot.cn/v1`) anunciam compatibilidade de uso de streaming no
  transporte compartilhado `openai-completions`. Agora o OpenClaw baseia isso nas
  capacidades do endpoint, então IDs de provedor personalizados compatíveis que apontam para os mesmos
  hosts nativos da Moonshot herdam o mesmo comportamento de uso de streaming.
- Substitua preços e metadados de contexto em `models.providers` se necessário.
- Se a Moonshot publicar limites de contexto diferentes para um modelo, ajuste
  `contextWindow` adequadamente.
- Use `https://api.moonshot.ai/v1` para o endpoint internacional e `https://api.moonshot.cn/v1` para o endpoint da China.
- Opções de onboarding:
  - `moonshot-api-key` para `https://api.moonshot.ai/v1`
  - `moonshot-api-key-cn` para `https://api.moonshot.cn/v1`

## Modo nativo de thinking (Moonshot)

O Moonshot Kimi oferece suporte a thinking nativo binário:

- `thinking: { type: "enabled" }`
- `thinking: { type: "disabled" }`

Configure isso por modelo via `agents.defaults.models.<provider/model>.params`:

```json5
{
  agents: {
    defaults: {
      models: {
        "moonshot/kimi-k2.5": {
          params: {
            thinking: { type: "disabled" },
          },
        },
      },
    },
  },
}
```

O OpenClaw também mapeia níveis de `/think` em runtime para Moonshot:

- `/think off` -> `thinking.type=disabled`
- qualquer nível de thinking diferente de off -> `thinking.type=enabled`

Quando o thinking da Moonshot está habilitado, `tool_choice` precisa ser `auto` ou `none`. O OpenClaw normaliza valores incompatíveis de `tool_choice` para `auto` por compatibilidade.
