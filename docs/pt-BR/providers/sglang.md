---
read_when:
    - Você quer executar o OpenClaw com um servidor SGLang local
    - Você quer endpoints `/v1` compatíveis com OpenAI com seus próprios modelos
summary: Execute o OpenClaw com SGLang (servidor self-hosted compatível com OpenAI)
title: SGLang
x-i18n:
    generated_at: "2026-04-05T12:51:36Z"
    model: gpt-5.4
    provider: openai
    source_hash: 9850277c6c5e318e60237688b4d8a5b1387d4e9586534ae2eb6ad953abba8948
    source_path: providers/sglang.md
    workflow: 15
---

# SGLang

O SGLang pode servir modelos de código aberto por meio de uma API HTTP **compatível com OpenAI**.
O OpenClaw pode se conectar ao SGLang usando a API `openai-completions`.

O OpenClaw também pode **descobrir automaticamente** os modelos disponíveis no SGLang quando você opta
por isso com `SGLANG_API_KEY` (qualquer valor funciona se seu servidor não exigir autenticação)
e você não define uma entrada explícita `models.providers.sglang`.

## Início rápido

1. Inicie o SGLang com um servidor compatível com OpenAI.

Sua URL base deve expor endpoints `/v1` (por exemplo, `/v1/models`,
`/v1/chat/completions`). O SGLang normalmente roda em:

- `http://127.0.0.1:30000/v1`

2. Ative a opção (qualquer valor funciona se nenhuma autenticação estiver configurada):

```bash
export SGLANG_API_KEY="sglang-local"
```

3. Execute o onboarding e escolha `SGLang`, ou defina um modelo diretamente:

```bash
openclaw onboard
```

```json5
{
  agents: {
    defaults: {
      model: { primary: "sglang/your-model-id" },
    },
  },
}
```

## Descoberta de modelos (provedor implícito)

Quando `SGLANG_API_KEY` está definido (ou existe um perfil de autenticação) e você **não**
define `models.providers.sglang`, o OpenClaw consultará:

- `GET http://127.0.0.1:30000/v1/models`

e converterá os IDs retornados em entradas de modelo.

Se você definir `models.providers.sglang` explicitamente, a descoberta automática será ignorada e
você precisará definir os modelos manualmente.

## Configuração explícita (modelos manuais)

Use configuração explícita quando:

- O SGLang roda em um host/porta diferente.
- Você quer fixar valores de `contextWindow`/`maxTokens`.
- Seu servidor exige uma chave de API real (ou você quer controlar os headers).

```json5
{
  models: {
    providers: {
      sglang: {
        baseUrl: "http://127.0.0.1:30000/v1",
        apiKey: "${SGLANG_API_KEY}",
        api: "openai-completions",
        models: [
          {
            id: "your-model-id",
            name: "Local SGLang Model",
            reasoning: false,
            input: ["text"],
            cost: { input: 0, output: 0, cacheRead: 0, cacheWrite: 0 },
            contextWindow: 128000,
            maxTokens: 8192,
          },
        ],
      },
    },
  },
}
```

## Solução de problemas

- Verifique se o servidor está acessível:

```bash
curl http://127.0.0.1:30000/v1/models
```

- Se as solicitações falharem com erros de autenticação, defina um `SGLANG_API_KEY` real que corresponda
  à configuração do seu servidor, ou configure o provedor explicitamente em
  `models.providers.sglang`.

## Comportamento no estilo proxy

O SGLang é tratado como um backend `/v1` compatível com OpenAI no estilo proxy, não como um
endpoint OpenAI nativo.

- a modelagem de solicitação nativa exclusiva do OpenAI não se aplica aqui
- sem `service_tier`, sem `store` de Responses, sem dicas de cache de prompt e sem
  modelagem de payload compatível com raciocínio do OpenAI
- headers ocultos de atribuição do OpenClaw (`originator`, `version`, `User-Agent`)
  não são injetados em URLs base personalizadas do SGLang
