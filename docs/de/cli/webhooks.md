---
read_when:
    - Sie möchten Gmail-Pub/Sub-Ereignisse in OpenClaw einbinden
    - Sie möchten Webhook-Hilfsbefehle verwenden
summary: CLI-Referenz für `openclaw webhooks` (Webhook-Helfer + Gmail Pub/Sub)
title: webhooks
x-i18n:
    generated_at: "2026-04-05T12:39:22Z"
    model: gpt-5.4
    provider: openai
    source_hash: 2b22ce879c3a94557be57919b4d2b3e92ff4d41fbae7bc88d2ab07cd4bbeac83
    source_path: cli/webhooks.md
    workflow: 15
---

# `openclaw webhooks`

Webhook-Helfer und Integrationen (Gmail Pub/Sub, Webhook-Helfer).

Verwandt:

- Webhooks: [Webhooks](/automation/cron-jobs#webhooks)
- Gmail Pub/Sub: [Gmail Pub/Sub](/automation/cron-jobs#gmail-pubsub-integration)

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

`gog watch serve` zusammen mit der automatischen Watch-Erneuerungsschleife ausführen.

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

Siehe [Gmail-Pub/Sub-Dokumentation](/automation/cron-jobs#gmail-pubsub-integration) für den vollständigen Einrichtungsablauf und betriebliche Details.
