---
read_when:
    - Você quer usar o Vercel AI Gateway com o OpenClaw
    - Você precisa da variável de ambiente da chave de API ou da opção de autenticação da CLI
summary: Configuração do Vercel AI Gateway (autenticação + seleção de modelo)
title: Vercel AI Gateway
x-i18n:
    generated_at: "2026-04-05T12:51:47Z"
    model: gpt-5.4
    provider: openai
    source_hash: f30768dc3db49708b25042d317906f7ad9a2c72b0fa03263bc04f5eefbf7a507
    source_path: providers/vercel-ai-gateway.md
    workflow: 15
---

# Vercel AI Gateway

O [Vercel AI Gateway](https://vercel.com/ai-gateway) fornece uma API unificada para acessar centenas de modelos por um único endpoint.

- Provedor: `vercel-ai-gateway`
- Autenticação: `AI_GATEWAY_API_KEY`
- API: compatível com Anthropic Messages
- O OpenClaw detecta automaticamente o catálogo `/v1/models` do Gateway, então `/models vercel-ai-gateway`
  inclui referências atuais de modelos como `vercel-ai-gateway/openai/gpt-5.4`.

## Início rápido

1. Defina a chave de API (recomendado: armazená-la para o Gateway):

```bash
openclaw onboard --auth-choice ai-gateway-api-key
```

2. Defina um modelo padrão:

```json5
{
  agents: {
    defaults: {
      model: { primary: "vercel-ai-gateway/anthropic/claude-opus-4.6" },
    },
  },
}
```

## Exemplo não interativo

```bash
openclaw onboard --non-interactive \
  --mode local \
  --auth-choice ai-gateway-api-key \
  --ai-gateway-api-key "$AI_GATEWAY_API_KEY"
```

## Observação sobre ambiente

Se o Gateway for executado como daemon (launchd/systemd), certifique-se de que `AI_GATEWAY_API_KEY`
esteja disponível para esse processo (por exemplo, em `~/.openclaw/.env` ou via
`env.shellEnv`).

## Forma abreviada de ID de modelo

O OpenClaw aceita referências abreviadas de modelos Claude do Vercel e as normaliza em
runtime:

- `vercel-ai-gateway/claude-opus-4.6` -> `vercel-ai-gateway/anthropic/claude-opus-4.6`
- `vercel-ai-gateway/opus-4.6` -> `vercel-ai-gateway/anthropic/claude-opus-4-6`
