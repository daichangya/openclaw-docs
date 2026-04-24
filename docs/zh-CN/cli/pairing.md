---
read_when:
    - 你正在使用配对模式私信，并且需要批准发送者
summary: '`openclaw pairing` 的 CLI 参考（批准/列出配对请求）'
title: 配对
x-i18n:
    generated_at: "2026-04-24T03:15:08Z"
    model: gpt-5.4
    provider: openai
    source_hash: 9e81dc407138e958e41d565b0addb600ad1ba5187627bb219f0b85b92bd112d1
    source_path: cli/pairing.md
    workflow: 15
---

# `openclaw pairing`

批准或查看私信配对请求（适用于支持配对的渠道）。

相关内容：

- 配对流程： [配对](/zh-CN/channels/pairing)

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
- `--channel <channel>`：显式指定渠道 id
- `--account <accountId>`：多账号渠道的账号 id
- `--json`：机器可读输出

注意事项：

- 如果配置了多个支持配对的渠道，你必须通过位置参数或 `--channel` 提供一个渠道。
- 只要渠道 id 有效，也允许使用扩展渠道。

## `pairing approve`

批准待处理的配对代码，并允许该发送者。

用法：

- `openclaw pairing approve <channel> <code>`
- `openclaw pairing approve --channel <channel> <code>`
- 当只配置了一个支持配对的渠道时，可使用 `openclaw pairing approve <code>`

选项：

- `--channel <channel>`：显式指定渠道 id
- `--account <accountId>`：多账号渠道的账号 id
- `--notify`：在同一渠道向请求者发送确认消息

## 注意事项

- 渠道输入：可通过位置参数传入（`pairing list telegram`），或使用 `--channel <channel>`。
- `pairing list` 支持多账号渠道的 `--account <accountId>`。
- `pairing approve` 支持 `--account <accountId>` 和 `--notify`。
- 如果只配置了一个支持配对的渠道，则允许使用 `pairing approve <code>`。

## 相关内容

- [CLI 参考](/zh-CN/cli)
- [渠道配对](/zh-CN/channels/pairing)
