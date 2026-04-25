---
read_when:
    - 你使用语音通话插件，并且想了解 CLI 入口点
    - 你想查看 `voicecall setup|smoke|call|continue|dtmf|status|tail|expose` 的快速示例
summary: '`openclaw voicecall` 的 CLI 参考（语音通话插件命令接口）'
title: Voicecall
x-i18n:
    generated_at: "2026-04-25T02:35:33Z"
    model: gpt-5.4
    provider: openai
    source_hash: ffed2f9f6edc989066a0b7d1e44752bf30a2356955db2577d350c60070b7b5f0
    source_path: cli/voicecall.md
    workflow: 15
---

# `openclaw voicecall`

`voicecall` 是一个由插件提供的命令。只有在语音通话插件已安装并启用时，它才会显示。

主要文档：

- 语音通话插件：[Voice Call](/zh-CN/plugins/voice-call)

## 常用命令

```bash
openclaw voicecall setup
openclaw voicecall smoke
openclaw voicecall status --call-id <id>
openclaw voicecall call --to "+15555550123" --message "Hello" --mode notify
openclaw voicecall continue --call-id <id> --message "Any questions?"
openclaw voicecall dtmf --call-id <id> --digits "ww123456#"
openclaw voicecall end --call-id <id>
```

默认情况下，`setup` 会输出便于阅读的就绪检查结果。对于脚本，请使用 `--json`：

```bash
openclaw voicecall setup --json
```

`smoke` 会运行相同的就绪检查。除非同时提供 `--to` 和 `--yes`，否则它不会拨打真实电话：

```bash
openclaw voicecall smoke --to "+15555550123"        # 试运行
openclaw voicecall smoke --to "+15555550123" --yes  # 实际 notify 呼叫
```

## 暴露 webhook（Tailscale）

```bash
openclaw voicecall expose --mode serve
openclaw voicecall expose --mode funnel
openclaw voicecall expose --mode off
```

安全注意事项：仅将 webhook 端点暴露给你信任的网络。尽可能优先使用 Tailscale Serve，而不是 Funnel。

## 相关内容

- [CLI 参考](/zh-CN/cli)
- [语音通话插件](/zh-CN/plugins/voice-call)
