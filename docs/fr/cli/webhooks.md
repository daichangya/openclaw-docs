---
read_when:
    - Vous voulez connecter les événements Gmail Pub/Sub à OpenClaw
    - Vous voulez des commandes utilitaires webhook
summary: Référence CLI pour `openclaw webhooks` (assistants webhook + Gmail Pub/Sub)
title: webhooks
x-i18n:
    generated_at: "2026-04-05T12:39:13Z"
    model: gpt-5.4
    provider: openai
    source_hash: 2b22ce879c3a94557be57919b4d2b3e92ff4d41fbae7bc88d2ab07cd4bbeac83
    source_path: cli/webhooks.md
    workflow: 15
---

# `openclaw webhooks`

Assistants webhook et intégrations (Gmail Pub/Sub, assistants webhook).

Voir aussi :

- Webhooks : [Webhooks](/automation/cron-jobs#webhooks)
- Gmail Pub/Sub : [Gmail Pub/Sub](/automation/cron-jobs#gmail-pubsub-integration)

## Gmail

```bash
openclaw webhooks gmail setup --account you@example.com
openclaw webhooks gmail run
```

### `webhooks gmail setup`

Configure la surveillance Gmail, Pub/Sub et la livraison webhook OpenClaw.

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

Consultez la [documentation Gmail Pub/Sub](/automation/cron-jobs#gmail-pubsub-integration) pour le flux de configuration de bout en bout et les détails opérationnels.
