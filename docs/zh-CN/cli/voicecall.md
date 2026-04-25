---
read_when:
    - 你使用语音通话插件，并且想了解 CLI 入口点
    - 你想查看 `voicecall setup|smoke|call|continue|dtmf|status|tail|expose` 的快速示例
summary: '`openclaw voicecall` 的 CLI 参考（语音通话插件命令界面）'
title: 语音通话
x-i18n:
    generated_at: "2026-04-25T04:55:01Z"
    model: gpt-5.4
    provider: openai
    source_hash: 7c8b83ef75f792920024a67b0dee1b07aff9f55486de1149266c6d94854ca0fe
    source_path: cli/voicecall.md
    workflow: 15
---

# `openclaw voicecall`

`voicecall` 是一个由插件提供的命令。只有在安装并启用语音通话插件后，它才会显示。

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

`setup` 默认会输出人类可读的就绪检查结果。对于脚本，请使用 `--json`：

```bash
openclaw voicecall setup --json
```

对于外部提供商（`twilio`、`telnyx`、`plivo`），设置必须从 `publicUrl`、隧道或 Tailscale 暴露中解析一个公开的 webhook URL。由于运营商无法访问，local loopback/私有服务的回退方案会被拒绝。

`smoke` 会运行相同的就绪检查。除非同时提供 `--to` 和 `--yes`，否则它不会拨打真实电话：

```bash
openclaw voicecall smoke --to "+15555550123"        # 试运行
openclaw voicecall smoke --to "+15555550123" --yes  # 实际通知呼叫
```

## 暴露 webhook（Tailscale）

```bash
openclaw voicecall expose --mode serve
openclaw voicecall expose --mode funnel
openclaw voicecall expose --mode off
```

安全说明：只将 webhook 端点暴露给你信任的网络。条件允许时，优先使用 Tailscale Serve 而不是 Funnel。

## 相关内容

- [CLI 参考](/zh-CN/cli)
- [语音通话插件](/zh-CN/plugins/voice-call)
