---
read_when:
    - 你想使用当前令牌打开控制 UI
    - 你想打印 URL 而不启动浏览器
summary: '`openclaw dashboard` 的 CLI 参考（打开控制 UI）'
title: 仪表盘
x-i18n:
    generated_at: "2026-04-23T20:43:39Z"
    model: gpt-5.4
    provider: openai
    source_hash: 7e2efad499eca9364668ffce2cce52b63e28dc1773aeee64fe20ccafae9d1628
    source_path: cli/dashboard.md
    workflow: 15
---

# `openclaw dashboard`

使用你当前的认证打开控制 UI。

```bash
openclaw dashboard
openclaw dashboard --no-open
```

说明：

- `dashboard` 会在可能的情况下解析已配置的 `gateway.auth.token` SecretRef。
- 对于由 SecretRef 管理的令牌（无论已解析还是未解析），`dashboard` 都会打印/复制/打开不带令牌的 URL，以避免在终端输出、剪贴板历史记录或浏览器启动参数中暴露外部密钥。
- 如果 `gateway.auth.token` 由 SecretRef 管理，但在此命令路径中无法解析，则该命令会打印不带令牌的 URL，并给出明确的修复指导，而不是嵌入无效的令牌占位符。
