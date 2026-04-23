---
read_when:
    - 你想要一个用于 Gateway 网关的终端 UI（适合远程使用）
    - 你想从脚本传递 url/token/session
    - 你想在没有 Gateway 网关的情况下，以本地嵌入模式运行 TUI
    - 你想使用 `openclaw chat` 或 `openclaw tui --local`
summary: '`openclaw tui` 的 CLI 参考（基于 Gateway 网关或本地嵌入式终端 UI）'
title: tui
x-i18n:
    generated_at: "2026-04-23T07:05:18Z"
    model: gpt-5.4
    provider: openai
    source_hash: 4fca025a15f5e985ca6f2eaf39fcbe784bd716f24841f43450b71936db26d141
    source_path: cli/tui.md
    workflow: 15
---

# `openclaw tui`

打开连接到 Gateway 网关的终端 UI，或以本地嵌入模式运行它。

相关内容：

- TUI 指南：[TUI](/zh-CN/web/tui)

注意：

- `chat` 和 `terminal` 是 `openclaw tui --local` 的别名。
- `--local` 不能与 `--url`、`--token` 或 `--password` 组合使用。
- `tui` 会在可能的情况下，为 token/password 认证解析已配置的 Gateway 网关认证 `SecretRef`（`env`/`file`/`exec` 提供商）。
- 当从已配置的智能体工作区目录内启动时，TUI 会自动为会话键默认值选择该智能体（除非 `--session` 明确为 `agent:<id>:...`）。
- 本地模式直接使用嵌入式智能体运行时。大多数本地工具都可用，但仅限 Gateway 网关的功能不可用。
- 本地模式会在 TUI 命令界面中添加 `/auth [provider]`。
- 即使在本地模式下，插件审批门控仍然适用。需要审批的工具会在终端中提示你做出决定；不会因为未使用 Gateway 网关而被静默自动批准。

## 示例

```bash
openclaw chat
openclaw tui --local
openclaw tui
openclaw tui --url ws://127.0.0.1:18789 --token <token>
openclaw tui --session main --deliver
openclaw chat --message "Compare my config to the docs and tell me what to fix"
# when run inside an agent workspace, infers that agent automatically
openclaw tui --session bugfix
```

## 配置修复循环

当当前配置已经通过校验，并且你希望嵌入式智能体检查它、将其与文档对比，并从同一个终端帮助修复时，请使用本地模式：

如果 `openclaw config validate` 已经失败，请先使用 `openclaw configure` 或
`openclaw doctor --fix`。`openclaw chat` 不会绕过无效配置保护。

```bash
openclaw chat
```

然后在 TUI 内：

```text
!openclaw config file
!openclaw docs gateway auth token secretref
!openclaw config validate
!openclaw doctor
```

使用 `openclaw config set` 或 `openclaw configure` 应用有针对性的修复，然后
重新运行 `openclaw config validate`。请参见 [TUI](/zh-CN/web/tui) 和 [配置](/zh-CN/cli/config)。
