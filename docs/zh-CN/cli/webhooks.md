---
read_when:
    - 你想将 Gmail Pub/Sub 事件接入 OpenClaw
    - 你想要 webhook 辅助命令
summary: '`openclaw webhooks` 的 CLI 参考（webhook 辅助工具 + Gmail Pub/Sub）'
title: webhooks
x-i18n:
    generated_at: "2026-04-23T20:45:23Z"
    model: gpt-5.4
    provider: openai
    source_hash: 7e42359194d3682e824757b301d83d22042c68f6d24b5b1b0550b65a7e5e460d
    source_path: cli/webhooks.md
    workflow: 15
---

# `openclaw webhooks`

Webhook 辅助工具与集成（Gmail Pub/Sub、webhook 辅助工具）。

相关内容：

- Webhooks：[Webhooks](/zh-CN/automation/cron-jobs#webhooks)
- Gmail Pub/Sub：[Gmail Pub/Sub](/zh-CN/automation/cron-jobs#gmail-pubsub-integration)

## Gmail

```bash
openclaw webhooks gmail setup --account you@example.com
openclaw webhooks gmail run
```

### `webhooks gmail setup`

配置 Gmail watch、Pub/Sub 和 OpenClaw webhook 传递。

必需项：

- `--account <email>`

选项：

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

示例：

```bash
openclaw webhooks gmail setup --account you@example.com
openclaw webhooks gmail setup --account you@example.com --project my-gcp-project --json
openclaw webhooks gmail setup --account you@example.com --hook-url https://gateway.example.com/hooks/gmail
```

### `webhooks gmail run`

运行 `gog watch serve` 以及 watch 自动续订循环。

选项：

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

示例：

```bash
openclaw webhooks gmail run --account you@example.com
```

端到端设置流程和运维细节请参见 [Gmail Pub/Sub 文档](/zh-CN/automation/cron-jobs#gmail-pubsub-integration)。
