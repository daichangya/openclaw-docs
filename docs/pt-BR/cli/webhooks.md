---
read_when:
    - Você quer integrar eventos do Gmail Pub/Sub ao OpenClaw
    - Você quer comandos auxiliares de webhook
summary: Referência da CLI para `openclaw webhooks` (auxiliares de webhook + Gmail Pub/Sub)
title: webhooks
x-i18n:
    generated_at: "2026-04-05T12:38:58Z"
    model: gpt-5.4
    provider: openai
    source_hash: 2b22ce879c3a94557be57919b4d2b3e92ff4d41fbae7bc88d2ab07cd4bbeac83
    source_path: cli/webhooks.md
    workflow: 15
---

# `openclaw webhooks`

Auxiliares e integrações de webhook (Gmail Pub/Sub, auxiliares de webhook).

Relacionado:

- Webhooks: [Webhooks](/automation/cron-jobs#webhooks)
- Gmail Pub/Sub: [Gmail Pub/Sub](/automation/cron-jobs#gmail-pubsub-integration)

## Gmail

```bash
openclaw webhooks gmail setup --account you@example.com
openclaw webhooks gmail run
```

### `webhooks gmail setup`

Configure Gmail watch, Pub/Sub e entrega de webhook do OpenClaw.

Obrigatório:

- `--account <email>`

Opções:

- `--project <id>`
- `--topic <name>`
- `--subscription <name>`
- `--label <label>`
- `--hook-url <url>`
- `--hook-token <token>`
- `--push-token <token>`
- `--bind <host>`
- `--port <port>`
- `--path <path>`
- `--include-body`
- `--max-bytes <n>`
- `--renew-minutes <n>`
- `--tailscale <funnel|serve|off>`
- `--tailscale-path <path>`
- `--tailscale-target <target>`
- `--push-endpoint <url>`
- `--json`

Exemplos:

```bash
openclaw webhooks gmail setup --account you@example.com
openclaw webhooks gmail setup --account you@example.com --project my-gcp-project --json
openclaw webhooks gmail setup --account you@example.com --hook-url https://gateway.example.com/hooks/gmail
```

### `webhooks gmail run`

Execute `gog watch serve` junto com o loop de renovação automática do watch.

Opções:

- `--account <email>`
- `--topic <topic>`
- `--subscription <name>`
- `--label <label>`
- `--hook-url <url>`
- `--hook-token <token>`
- `--push-token <token>`
- `--bind <host>`
- `--port <port>`
- `--path <path>`
- `--include-body`
- `--max-bytes <n>`
- `--renew-minutes <n>`
- `--tailscale <funnel|serve|off>`
- `--tailscale-path <path>`
- `--tailscale-target <target>`

Exemplo:

```bash
openclaw webhooks gmail run --account you@example.com
```

Consulte a [documentação do Gmail Pub/Sub](/automation/cron-jobs#gmail-pubsub-integration) para o fluxo completo de configuração ponta a ponta e detalhes operacionais.
