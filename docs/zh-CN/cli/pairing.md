---
read_when:
    - 你正在使用 pairing 模式私信，并需要批准发送方
summary: '`openclaw pairing` 的 CLI 参考（批准/列出配对请求）'
title: 配对
x-i18n:
    generated_at: "2026-04-23T20:44:35Z"
    model: gpt-5.4
    provider: openai
    source_hash: c4e75b1a12dcddabee19ec68c5a317f097265f95651cb681f95d5b1380a968d2
    source_path: cli/pairing.md
    workflow: 15
---

# `openclaw pairing`

批准或查看私信配对请求（适用于支持配对的渠道）。

相关内容：

- 配对流程：[配对](/zh-CN/channels/pairing)

## 命令

```bash
openclaw pairing list telegram
openclaw pairing list --channel telegram --account work
openclaw pairing list telegram --json

openclaw pairing approve <code>
openclaw pairing approve telegram <code>
openclaw pairing approve --channel telegram --account work <code> --notify
```

## `pairing list`

列出某个渠道的待处理配对请求。

选项：

- `[channel]`：位置参数渠道 id
- `--channel <channel>`：显式渠道 id
- `--account <accountId>`：多账户渠道的账户 id
- `--json`：机器可读输出

说明：

- 如果配置了多个支持配对的渠道，则必须通过位置参数或 `--channel` 提供渠道。
- 只要渠道 id 有效，也允许使用扩展渠道。

## `pairing approve`

批准待处理的配对码，并允许该发送方。

用法：

- `openclaw pairing approve <channel> <code>`
- `openclaw pairing approve --channel <channel> <code>`
- 当仅配置了一个支持配对的渠道时，可使用 `openclaw pairing approve <code>`

选项：

- `--channel <channel>`：显式渠道 id
- `--account <accountId>`：多账户渠道的账户 id
- `--notify`：在同一渠道向请求方发送确认消息

## 说明

- 渠道输入：可作为位置参数传入（`pairing list telegram`），或使用 `--channel <channel>`。
- `pairing list` 支持多账户渠道的 `--account <accountId>`。
- `pairing approve` 支持 `--account <accountId>` 和 `--notify`。
- 如果只配置了一个支持配对的渠道，则允许使用 `pairing approve <code>`。
