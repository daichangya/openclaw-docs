---
read_when:
    - 音声通話プラグインを使用していて、CLIのエントリーポイントを知りたい場合
    - '`voicecall call|continue|status|tail|expose` のクイック例を知りたい場合'
summary: '`openclaw voicecall` のCLIリファレンス（音声通話プラグインのコマンドインターフェース）'
title: voicecall
x-i18n:
    generated_at: "2026-04-05T12:40:07Z"
    model: gpt-5.4
    provider: openai
    source_hash: 2c99e7a3d256e1c74a0f07faba9675cc5a88b1eb2fc6e22993caf3874d4f340a
    source_path: cli/voicecall.md
    workflow: 15
---

# `openclaw voicecall`

`voicecall` はプラグインによって提供されるコマンドです。音声通話プラグインがインストールされ、有効になっている場合にのみ表示されます。

主要ドキュメント:

- 音声通話プラグイン: [Voice Call](/plugins/voice-call)

## 一般的なコマンド

```bash
openclaw voicecall status --call-id <id>
openclaw voicecall call --to "+15555550123" --message "Hello" --mode notify
openclaw voicecall continue --call-id <id> --message "Any questions?"
openclaw voicecall end --call-id <id>
```

## Webhookの公開（Tailscale）

```bash
openclaw voicecall expose --mode serve
openclaw voicecall expose --mode funnel
openclaw voicecall expose --mode off
```

セキュリティに関する注意: webhookエンドポイントは、信頼できるネットワークにのみ公開してください。可能であれば、Funnel よりも Tailscale Serve を優先してください。
