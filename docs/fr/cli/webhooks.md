---
read_when:
    - Vous souhaitez connecter les événements Gmail Pub/Sub à OpenClaw
    - Vous souhaitez des commandes d’assistance Webhook
summary: Référence CLI pour `openclaw webhooks` (assistants Webhook + Gmail Pub/Sub)
title: Webhooks
x-i18n:
    generated_at: "2026-04-24T07:05:53Z"
    model: gpt-5.4
    provider: openai
    source_hash: ce9b085904918f1fea4daa7728470d492ab3e7d92ad43a6b1e7efe8d9f70868f
    source_path: cli/webhooks.md
    workflow: 15
---

# `openclaw webhooks`

Assistants et intégrations Webhook (Gmail Pub/Sub, assistants Webhook).

Associé :

- Webhooks : [Webhooks](/fr/automation/cron-jobs#webhooks)
- Gmail Pub/Sub : [Gmail Pub/Sub](/fr/automation/cron-jobs#gmail-pubsub-integration)

## Gmail

```bash
openclaw webhooks gmail setup --account you@example.com
openclaw webhooks gmail run
```

### `webhooks gmail setup`

Configure la surveillance Gmail, Pub/Sub et la livraison Webhook OpenClaw.

Requis :

- `--account <email>`

Options :

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

Exemples :

```bash
openclaw webhooks gmail setup --account you@example.com
openclaw webhooks gmail setup --account you@example.com --project my-gcp-project --json
openclaw webhooks gmail setup --account you@example.com --hook-url https://gateway.example.com/hooks/gmail
```

### `webhooks gmail run`

Exécute `gog watch serve` ainsi que la boucle de renouvellement automatique de la surveillance.

Options :

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

Exemple :

```bash
openclaw webhooks gmail run --account you@example.com
```

Consultez la [documentation Gmail Pub/Sub](/fr/automation/cron-jobs#gmail-pubsub-integration) pour le flux complet de configuration et les détails opérationnels.

## Associé

- [Référence CLI](/fr/cli)
- [Automatisation Webhook](/fr/automation/cron-jobs)
