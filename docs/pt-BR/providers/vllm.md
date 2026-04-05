---
read_when:
    - Você quer executar o OpenClaw com um servidor vLLM local
    - Você quer endpoints `/v1` compatíveis com OpenAI com seus próprios modelos
summary: Execute o OpenClaw com vLLM (servidor local compatível com OpenAI)
title: vLLM
x-i18n:
    generated_at: "2026-04-05T12:51:51Z"
    model: gpt-5.4
    provider: openai
    source_hash: ebde34d0453586d10340680b8d51465fdc98bd28e8a96acfaeb24606886b50f4
    source_path: providers/vllm.md
    workflow: 15
---

# vLLM

O vLLM pode servir modelos open source (e alguns modelos personalizados) por meio de uma API HTTP **compatível com OpenAI**. O OpenClaw pode se conectar ao vLLM usando a API `openai-completions`.

O OpenClaw também pode **descobrir automaticamente** os modelos disponíveis no vLLM quando você optar por isso com `VLLM_API_KEY` (qualquer valor funciona se seu servidor não exigir autenticação) e você não definir uma entrada explícita `models.providers.vllm`.

## Início rápido

1. Inicie o vLLM com um servidor compatível com OpenAI.

Sua base URL deve expor endpoints `/v1` (por exemplo, `/v1/models`, `/v1/chat/completions`). O vLLM normalmente é executado em:

- `http://127.0.0.1:8000/v1`

2. Ative a opção (qualquer valor funciona se nenhuma autenticação estiver configurada):

```bash
export VLLM_API_KEY="vllm-local"
```

3. Selecione um modelo (substitua por um dos IDs de modelo do seu vLLM):

```json5
{
  agents: {
    defaults: {
      model: { primary: "vllm/your-model-id" },
    },
  },
}
```

## Descoberta de modelo (provedor implícito)

Quando `VLLM_API_KEY` estiver definido (ou existir um perfil de autenticação) e você **não** definir `models.providers.vllm`, o OpenClaw consultará:

- `GET http://127.0.0.1:8000/v1/models`

...e converterá os IDs retornados em entradas de modelo.

Se você definir `models.providers.vllm` explicitamente, a descoberta automática será ignorada e você precisará definir os modelos manualmente.

## Configuração explícita (modelos manuais)

Use configuração explícita quando:

- o vLLM estiver sendo executado em outro host/porta
- você quiser fixar os valores de `contextWindow`/`maxTokens`
- seu servidor exigir uma chave de API real (ou você quiser controlar os headers)

```json5
{
  models: {
    providers: {
      vllm: {
        baseUrl: "http://127.0.0.1:8000/v1",
        apiKey: "${VLLM_API_KEY}",
        api: "openai-completions",
        models: [
          {
            id: "your-model-id",
            name: "Modelo vLLM local",
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
curl http://127.0.0.1:8000/v1/models
```

- Se as solicitações falharem com erros de autenticação, defina uma `VLLM_API_KEY` real que corresponda à configuração do seu servidor ou configure o provedor explicitamente em `models.providers.vllm`.

## Comportamento no estilo proxy

O vLLM é tratado como um backend `/v1` compatível com OpenAI no estilo proxy, não como um
endpoint OpenAI nativo.

- a formatação de requisição nativa exclusiva da OpenAI não se aplica aqui
- sem `service_tier`, sem `store` de Responses, sem dicas de cache de prompt e sem
  formatação de payload de compatibilidade de raciocínio da OpenAI
- headers ocultos de atribuição do OpenClaw (`originator`, `version`, `User-Agent`)
  não são injetados em base URLs personalizadas de vLLM
