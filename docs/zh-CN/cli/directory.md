---
read_when:
    - 你想查找某个渠道的联系人/群组/自身 ID
    - 你正在开发一个渠道目录适配器
summary: '`openclaw directory` 的 CLI 参考（自身、对等端、组）'
title: 目录
x-i18n:
    generated_at: "2026-04-23T20:43:42Z"
    model: gpt-5.4
    provider: openai
    source_hash: 1b6bd2a4787102f5e0908d9965a2f92d3d59f9a30e5126ef84d4dc3d23a3c2ad
    source_path: cli/directory.md
    workflow: 15
---

# `openclaw directory`

适用于支持该功能的渠道的目录查询（联系人/对等端、群组和“我”）。

## 常用标志

- `--channel <name>`：渠道 id/别名（当配置了多个渠道时必填；如果只配置了一个渠道则会自动选择）
- `--account <id>`：账户 id（默认：渠道默认账户）
- `--json`：输出 JSON

## 说明

- `directory` 旨在帮助你查找可粘贴到其他命令中的 ID（尤其是 `openclaw message send --target ...`）。
- 对于许多渠道，结果是基于配置的（allowlist / 已配置群组），而不是实时提供商目录。
- 默认输出为以制表符分隔的 `id`（有时还包含 `name`）；如需脚本处理，请使用 `--json`。

## 将结果用于 `message send`

```bash
openclaw directory peers list --channel slack --query "U0"
openclaw message send --channel slack --target user:U012ABCDEF --message "hello"
```

## ID 格式（按渠道）

- WhatsApp：`+15551234567`（私信），`1234567890-1234567890@g.us`（群组）
- Telegram：`@username` 或数字聊天 id；群组为数字 id
- Slack：`user:U…` 和 `channel:C…`
- Discord：`user:<id>` 和 `channel:<id>`
- Matrix（插件）：`user:@user:server`、`room:!roomId:server` 或 `#alias:server`
- Microsoft Teams（插件）：`user:<id>` 和 `conversation:<id>`
- Zalo（插件）：用户 id（Bot API）
- Zalo Personal / `zalouser`（插件）：来自 `zca` 的线程 id（私信/群组）（`me`、`friend list`、`group list`）

## 自身（“我”）

```bash
openclaw directory self --channel zalouser
```

## 对等端（联系人/用户）

```bash
openclaw directory peers list --channel zalouser
openclaw directory peers list --channel zalouser --query "name"
openclaw directory peers list --channel zalouser --limit 50
```

## 群组

```bash
openclaw directory groups list --channel zalouser
openclaw directory groups list --channel zalouser --query "work"
openclaw directory groups members --channel zalouser --group-id <id>
```
