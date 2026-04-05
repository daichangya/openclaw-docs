---
read_when:
    - Você quer rotear o OpenClaw por meio de um proxy LiteLLM
    - Você precisa de rastreamento de custos, logs ou roteamento de modelos por meio do LiteLLM
summary: Execute o OpenClaw por meio do LiteLLM Proxy para acesso unificado a modelos e rastreamento de custos
title: LiteLLM
x-i18n:
    generated_at: "2026-04-05T12:51:02Z"
    model: gpt-5.4
    provider: openai
    source_hash: 4e8ca73458186285bc06967b397b8a008791dc58eea1159d6c358e1a794982d1
    source_path: providers/litellm.md
    workflow: 15
---

# LiteLLM

[LiteLLM](https://litellm.ai) é um gateway de LLM de código aberto que fornece uma API unificada para mais de 100 provedores de modelo. Roteie o OpenClaw por meio do LiteLLM para obter rastreamento centralizado de custos, logs e a flexibilidade de trocar de backend sem alterar sua configuração do OpenClaw.

## Por que usar LiteLLM com OpenClaw?

- **Rastreamento de custos** — Veja exatamente quanto o OpenClaw gasta em todos os modelos
- **Roteamento de modelos** — Alterne entre Claude, GPT-4, Gemini, Bedrock sem mudanças de configuração
- **Chaves virtuais** — Crie chaves com limites de gasto para o OpenClaw
- **Logs** — Logs completos de solicitação/resposta para depuração
- **Fallbacks** — Failover automático se seu provedor principal estiver indisponível

## Início rápido

### Via onboarding

```bash
openclaw onboard --auth-choice litellm-api-key
```

### Configuração manual

1. Inicie o LiteLLM Proxy:

```bash
pip install 'litellm[proxy]'
litellm --model claude-opus-4-6
```

2. Aponte o OpenClaw para o LiteLLM:

```bash
export LITELLM_API_KEY="your-litellm-key"

openclaw
```

É só isso. O OpenClaw agora roteia por meio do LiteLLM.

## Configuração

### Variáveis de ambiente

```bash
export LITELLM_API_KEY="sk-litellm-key"
```

### Arquivo de configuração

```json5
{
  models: {
    providers: {
      litellm: {
        baseUrl: "http://localhost:4000",
        apiKey: "${LITELLM_API_KEY}",
        api: "openai-completions",
        models: [
          {
            id: "claude-opus-4-6",
            name: "Claude Opus 4.6",
            reasoning: true,
            input: ["text", "image"],
            contextWindow: 200000,
            maxTokens: 64000,
          },
          {
            id: "gpt-4o",
            name: "GPT-4o",
            reasoning: false,
            input: ["text", "image"],
            contextWindow: 128000,
            maxTokens: 8192,
          },
        ],
      },
    },
  },
  agents: {
    defaults: {
      model: { primary: "litellm/claude-opus-4-6" },
    },
  },
}
```

## Chaves virtuais

Crie uma chave dedicada para o OpenClaw com limites de gasto:

```bash
curl -X POST "http://localhost:4000/key/generate" \
  -H "Authorization: Bearer $LITELLM_MASTER_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "key_alias": "openclaw",
    "max_budget": 50.00,
    "budget_duration": "monthly"
  }'
```

Use a chave gerada como `LITELLM_API_KEY`.

## Roteamento de modelos

O LiteLLM pode rotear solicitações de modelo para diferentes backends. Configure no seu `config.yaml` do LiteLLM:

```yaml
model_list:
  - model_name: claude-opus-4-6
    litellm_params:
      model: claude-opus-4-6
      api_key: os.environ/ANTHROPIC_API_KEY

  - model_name: gpt-4o
    litellm_params:
      model: gpt-4o
      api_key: os.environ/OPENAI_API_KEY
```

O OpenClaw continua solicitando `claude-opus-4-6` — o LiteLLM cuida do roteamento.

## Visualizando o uso

Consulte o dashboard ou a API do LiteLLM:

```bash
# Informações da chave
curl "http://localhost:4000/key/info" \
  -H "Authorization: Bearer sk-litellm-key"

# Logs de gasto
curl "http://localhost:4000/spend/logs" \
  -H "Authorization: Bearer $LITELLM_MASTER_KEY"
```

## Observações

- O LiteLLM roda em `http://localhost:4000` por padrão
- O OpenClaw se conecta por meio do endpoint `/v1` compatível com OpenAI em estilo proxy do LiteLLM
- A modelagem de solicitação nativa exclusiva do OpenAI não se aplica por meio do LiteLLM:
  sem `service_tier`, sem `store` de Responses, sem dicas de cache de prompt e sem
  modelagem de payload compatível com raciocínio do OpenAI
- Headers ocultos de atribuição do OpenClaw (`originator`, `version`, `User-Agent`)
  não são injetados em URLs base personalizadas do LiteLLM

## Veja também

- [LiteLLM Docs](https://docs.litellm.ai)
- [Model Providers](/pt-BR/concepts/model-providers)
