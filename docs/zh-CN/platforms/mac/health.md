---
read_when:
    - 调试 mac 应用健康状态指示器
summary: macOS 应用如何报告 Gateway 网关 / Baileys 健康状态
title: 健康检查（macOS）
x-i18n:
    generated_at: "2026-04-23T20:55:36Z"
    model: gpt-5.4
    provider: openai
    source_hash: 17961525351f144236d215956dd3ee324f84d8fc59df97e5f377e1cd66992fb8
    source_path: platforms/mac/health.md
    workflow: 15
---

# macOS 上的健康检查

如何从菜单栏应用中查看已链接渠道是否健康。

## 菜单栏

- 状态点现在会反映 Baileys 健康状态：
  - 绿色：已链接 + socket 最近已打开。
  - 橙色：正在连接 / 重试中。
  - 红色：已登出或探测失败。
- 次级行显示 “linked · auth 12m”，或显示失败原因。
- “Run Health Check” 菜单项会触发按需探测。

## 设置

- General 标签页新增一个 Health 卡片，显示：已链接认证时长、session-store 路径 / 数量、上次检查时间、上次错误 / 状态码，以及 Run Health Check / Reveal Logs 按钮。
- 使用缓存快照，因此 UI 能立即加载，并且在离线时也能优雅回退。
- **Channels 标签页**会显示渠道状态 + WhatsApp / Telegram 控件（登录 QR、登出、探测、上次断开 / 错误）。

## 探测如何工作

- 应用每约 60 秒，以及在按需触发时，通过 `ShellExecutor` 运行 `openclaw health --json`。该探测会加载凭证并报告状态，但不会发送消息。
- 分别缓存最后一次成功快照和最后一次错误，以避免闪烁；并显示各自的时间戳。

## 如果拿不准

- 你仍然可以使用 [Gateway health](/zh-CN/gateway/health) 中的 CLI 流程（`openclaw status`、`openclaw status --deep`、`openclaw health --json`），并跟踪 `/tmp/openclaw/openclaw-*.log` 中的 `web-heartbeat` / `web-reconnect`。
