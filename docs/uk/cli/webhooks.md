---
read_when:
    - Ви хочете підключити події Gmail Pub/Sub до OpenClaw
    - Вам потрібні допоміжні команди Webhook
summary: Довідка CLI для `openclaw webhooks` (допоміжні засоби Webhook + Gmail Pub/Sub)
title: Webhooks
x-i18n:
    generated_at: "2026-04-24T04:13:19Z"
    model: gpt-5.4
    provider: openai
    source_hash: ce9b085904918f1fea4daa7728470d492ab3e7d92ad43a6b1e7efe8d9f70868f
    source_path: cli/webhooks.md
    workflow: 15
---

# `openclaw webhooks`

Допоміжні засоби Webhook та інтеграції (Gmail Pub/Sub, допоміжні засоби webhook).

Пов’язане:

- Webhooks: [Webhooks](/uk/automation/cron-jobs#webhooks)
- Gmail Pub/Sub: [Gmail Pub/Sub](/uk/automation/cron-jobs#gmail-pubsub-integration)

## Gmail

```bash
openclaw webhooks gmail setup --account you@example.com
openclaw webhooks gmail run
```

### `webhooks gmail setup`

Налаштувати Gmail watch, Pub/Sub і доставку Webhook OpenClaw.

Обов’язково:

- `--account <email>`

Параметри:

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

Приклади:

```bash
openclaw webhooks gmail setup --account you@example.com
openclaw webhooks gmail setup --account you@example.com --project my-gcp-project --json
openclaw webhooks gmail setup --account you@example.com --hook-url https://gateway.example.com/hooks/gmail
```

### `webhooks gmail run`

Запустити `gog watch serve` разом із циклом автоматичного поновлення watch.

Параметри:

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

Приклад:

```bash
openclaw webhooks gmail run --account you@example.com
```

Див. [документацію Gmail Pub/Sub](/uk/automation/cron-jobs#gmail-pubsub-integration) для наскрізного процесу налаштування та операційних деталей.

## Пов’язане

- [Довідка CLI](/uk/cli)
- [Автоматизація Webhook](/uk/automation/cron-jobs)
