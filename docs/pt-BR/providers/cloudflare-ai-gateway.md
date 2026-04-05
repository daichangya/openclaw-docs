---
read_when:
    - Você quer usar o Cloudflare AI Gateway com o OpenClaw
    - Você precisa do ID da conta, ID do gateway ou da variável de ambiente da chave de API
summary: Configuração do Cloudflare AI Gateway (auth + seleção de modelo)
title: Cloudflare AI Gateway
x-i18n:
    generated_at: "2026-04-05T12:50:29Z"
    model: gpt-5.4
    provider: openai
    source_hash: db77652c37652ca20f7c50f32382dbaeaeb50ea5bdeaf1d4fd17dc394e58950c
    source_path: providers/cloudflare-ai-gateway.md
    workflow: 15
---

# Cloudflare AI Gateway

O Cloudflare AI Gateway fica na frente das APIs dos provedores e permite adicionar análises, cache e controles. Para Anthropic, o OpenClaw usa a API Anthropic Messages por meio do endpoint do seu Gateway.

- Provedor: `cloudflare-ai-gateway`
- URL base: `https://gateway.ai.cloudflare.com/v1/<account_id>/<gateway_id>/anthropic`
- Modelo padrão: `cloudflare-ai-gateway/claude-sonnet-4-5`
- Chave de API: `CLOUDFLARE_AI_GATEWAY_API_KEY` (sua chave de API do provedor para solicitações por meio do Gateway)

Para modelos Anthropic, use sua chave de API da Anthropic.

## Início rápido

1. Defina a chave de API do provedor e os detalhes do Gateway:

```bash
openclaw onboard --auth-choice cloudflare-ai-gateway-api-key
```

2. Defina um modelo padrão:

```json5
{
  agents: {
    defaults: {
      model: { primary: "cloudflare-ai-gateway/claude-sonnet-4-5" },
    },
  },
}
```

## Exemplo não interativo

```bash
openclaw onboard --non-interactive \
  --mode local \
  --auth-choice cloudflare-ai-gateway-api-key \
  --cloudflare-ai-gateway-account-id "your-account-id" \
  --cloudflare-ai-gateway-gateway-id "your-gateway-id" \
  --cloudflare-ai-gateway-api-key "$CLOUDFLARE_AI_GATEWAY_API_KEY"
```

## Gateways autenticados

Se você ativou a autenticação do Gateway no Cloudflare, adicione o header `cf-aig-authorization` (isso é adicional à sua chave de API do provedor).

```json5
{
  models: {
    providers: {
      "cloudflare-ai-gateway": {
        headers: {
          "cf-aig-authorization": "Bearer <cloudflare-ai-gateway-token>",
        },
      },
    },
  },
}
```

## Observação sobre ambiente

Se o Gateway for executado como daemon (`launchd`/`systemd`), verifique se `CLOUDFLARE_AI_GATEWAY_API_KEY` está disponível para esse processo (por exemplo, em `~/.openclaw/.env` ou via `env.shellEnv`).
