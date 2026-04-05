---
read_when:
    - Gmail Pub/SubイベントをOpenClawに接続したい場合
    - Webhookヘルパーコマンドを使いたい場合
summary: '`openclaw webhooks` のCLIリファレンス（Webhookヘルパー + Gmail Pub/Sub）'
title: webhooks
x-i18n:
    generated_at: "2026-04-05T12:40:15Z"
    model: gpt-5.4
    provider: openai
    source_hash: 2b22ce879c3a94557be57919b4d2b3e92ff4d41fbae7bc88d2ab07cd4bbeac83
    source_path: cli/webhooks.md
    workflow: 15
---

# `openclaw webhooks`

Webhookヘルパーと連携機能（Gmail Pub/Sub、Webhookヘルパー）。

関連:

- Webhooks: [Webhooks](/ja-JP/automation/cron-jobs#webhooks)
- Gmail Pub/Sub: [Gmail Pub/Sub](/ja-JP/automation/cron-jobs#gmail-pubsub-integration)

## Gmail

```bash
openclaw webhooks gmail setup --account you@example.com
openclaw webhooks gmail run
```

### `webhooks gmail setup`

Gmail watch、Pub/Sub、およびOpenClawへのWebhook配信を設定します。

必須:

- `--account <email>`

オプション:

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

例:

```bash
openclaw webhooks gmail setup --account you@example.com
openclaw webhooks gmail setup --account you@example.com --project my-gcp-project --json
openclaw webhooks gmail setup --account you@example.com --hook-url https://gateway.example.com/hooks/gmail
```

### `webhooks gmail run`

`gog watch serve` と watch の自動更新ループを実行します。

オプション:

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

例:

```bash
openclaw webhooks gmail run --account you@example.com
```

エンドツーエンドのセットアップ手順と運用の詳細については、[Gmail Pub/Sub documentation](/ja-JP/automation/cron-jobs#gmail-pubsub-integration) を参照してください。
