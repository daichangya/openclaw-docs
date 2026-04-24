---
read_when:
    - Sie möchten Gmail-Pub/Sub-Ereignisse in OpenClaw einspeisen
    - Sie möchten Hilfsbefehle für Webhooks
summary: CLI-Referenz für `openclaw webhooks` (Webhook-Hilfsfunktionen + Gmail Pub/Sub)
title: Webhooks
x-i18n:
    generated_at: "2026-04-24T06:33:05Z"
    model: gpt-5.4
    provider: openai
    source_hash: ce9b085904918f1fea4daa7728470d492ab3e7d92ad43a6b1e7efe8d9f70868f
    source_path: cli/webhooks.md
    workflow: 15
---

# `openclaw webhooks`

Webhook-Hilfsfunktionen und Integrationen (Gmail Pub/Sub, Webhook-Hilfsfunktionen).

Verwandt:

- Webhooks: [Webhooks](/de/automation/cron-jobs#webhooks)
- Gmail Pub/Sub: [Gmail PubSub](/de/automation/cron-jobs#gmail-pubsub-integration)

## Gmail

```bash
openclaw webhooks gmail setup --account you@example.com
openclaw webhooks gmail run
```

### `webhooks gmail setup`

Gmail-Watch, Pub/Sub und OpenClaw-Webhook-Zustellung konfigurieren.

Erforderlich:

- `--account <email>`

Optionen:

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

Beispiele:

```bash
openclaw webhooks gmail setup --account you@example.com
openclaw webhooks gmail setup --account you@example.com --project my-gcp-project --json
openclaw webhooks gmail setup --account you@example.com --hook-url https://gateway.example.com/hooks/gmail
```

### `webhooks gmail run`

`gog watch serve` zusammen mit der Auto-Renew-Schleife für Watch ausführen.

Optionen:

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

Beispiel:

```bash
openclaw webhooks gmail run --account you@example.com
```

Siehe [Gmail-PubSub-Dokumentation](/de/automation/cron-jobs#gmail-pubsub-integration) für den vollständigen Einrichtungsablauf und betriebliche Details.

## Verwandt

- [CLI-Referenz](/de/cli)
- [Webhook-Automatisierung](/de/automation/cron-jobs)
