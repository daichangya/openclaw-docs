---
read_when:
    - 你想使用当前令牌打开 Control UI。
    - 你想打印 URL 而不启动浏览器。
summary: '`openclaw dashboard` 的 CLI 参考（打开 Control UI）'
title: 仪表板
x-i18n:
    generated_at: "2026-04-25T10:48:36Z"
    model: gpt-5.4
    provider: openai
    source_hash: ce485388465fb93551be8ccf0aa01ea52e4feb949ef0d48c96b4f8ea65a6551c
    source_path: cli/dashboard.md
    workflow: 15
---

# `openclaw dashboard`

使用你当前的身份验证打开控制界面。

```bash
openclaw dashboard
openclaw dashboard --no-open
```

注意：

- `dashboard` 会在可能的情况下解析已配置的 `gateway.auth.token` SecretRefs。
- `dashboard` 会遵循 `gateway.tls.enabled`：启用 TLS 的 Gateway 网关会打印/打开 `https://` 控制界面 URL，并通过 `wss://` 连接。
- 对于由 SecretRef 管理的令牌（无论已解析还是未解析），`dashboard` 会打印/复制/打开不带令牌的 URL，以避免在终端输出、剪贴板历史记录或浏览器启动参数中暴露外部密钥。
- 如果 `gateway.auth.token` 由 SecretRef 管理，但在此命令路径中未解析，该命令会打印不带令牌的 URL 和明确的修复指导，而不是嵌入无效的令牌占位符。

## 相关内容

- [CLI 参考](/zh-CN/cli)
- [仪表板](/zh-CN/web/dashboard)
