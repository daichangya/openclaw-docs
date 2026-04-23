---
read_when:
    - 你正在使用语音通话插件，并希望了解 CLI 入口点
    - 你想查看 `voicecall call|continue|status|tail|expose` 的快速示例
summary: '`openclaw voicecall` 的 CLI 参考（语音通话插件命令界面）'
title: Voicecall
x-i18n:
    generated_at: "2026-04-23T20:45:23Z"
    model: gpt-5.4
    provider: openai
    source_hash: 0346aaef09f153b288c7610eb34e1295e18655eb54aeead66f14fc1e998cb511
    source_path: cli/voicecall.md
    workflow: 15
---

# `openclaw voicecall`

`voicecall` 是由插件提供的命令。只有在语音通话插件已安装并启用时，它才会出现。

主文档：

- 语音通话插件：[Voice Call](/zh-CN/plugins/voice-call)

## 常用命令

```bash
openclaw voicecall status --call-id <id>
openclaw voicecall call --to "+15555550123" --message "Hello" --mode notify
openclaw voicecall continue --call-id <id> --message "Any questions?"
openclaw voicecall end --call-id <id>
```

## 暴露 webhook（Tailscale）

```bash
openclaw voicecall expose --mode serve
openclaw voicecall expose --mode funnel
openclaw voicecall expose --mode off
```

安全说明：仅将 webhook 端点暴露给你信任的网络。可以的话，优先使用 Tailscale Serve，而不是 Funnel。
