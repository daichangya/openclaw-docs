---
read_when:
    - voice-call Plugin を使用していて、CLI のエントリポイントを知りたい場合
    - '`voicecall setup|smoke|call|continue|dtmf|status|tail|expose` のクイック例を見たい場合'
summary: '`openclaw voicecall` の CLI リファレンス（voice-call Plugin のコマンド画面）'
title: Voicecall
x-i18n:
    generated_at: "2026-04-25T13:44:56Z"
    model: gpt-5.4
    provider: openai
    source_hash: 7c8b83ef75f792920024a67b0dee1b07aff9f55486de1149266c6d94854ca0fe
    source_path: cli/voicecall.md
    workflow: 15
---

# `openclaw voicecall`

`voicecall` は Plugin 提供のコマンドです。voice-call Plugin がインストールされ、有効化されている場合にのみ表示されます。

主なドキュメント:

- voice-call Plugin: [Voice Call](/ja-JP/plugins/voice-call)

## よく使うコマンド

```bash
openclaw voicecall setup
openclaw voicecall smoke
openclaw voicecall status --call-id <id>
openclaw voicecall call --to "+15555550123" --message "Hello" --mode notify
openclaw voicecall continue --call-id <id> --message "Any questions?"
openclaw voicecall dtmf --call-id <id> --digits "ww123456#"
openclaw voicecall end --call-id <id>
```

`setup` はデフォルトで人間が読みやすい準備状況チェックを表示します。スクリプトでは `--json` を使用してください:

```bash
openclaw voicecall setup --json
```

外部プロバイダー（`twilio`、`telnyx`、`plivo`）では、setup は `publicUrl`、トンネル、または Tailscale 公開からパブリックな Webhook URL を解決する必要があります。loopback/private の serve フォールバックは、キャリアから到達できないため拒否されます。

`smoke` は同じ準備状況チェックを実行します。`--to` と `--yes` の両方が指定されていない限り、実際の電話は発信しません:

```bash
openclaw voicecall smoke --to "+15555550123"        # ドライラン
openclaw voicecall smoke --to "+15555550123" --yes  # 実際の通知コール
```

## Webhook の公開（Tailscale）

```bash
openclaw voicecall expose --mode serve
openclaw voicecall expose --mode funnel
openclaw voicecall expose --mode off
```

セキュリティに関する注記: Webhook エンドポイントは、信頼できるネットワークにのみ公開してください。可能な場合は Tailscale Funnel より Tailscale Serve を優先してください。

## 関連

- [CLI reference](/ja-JP/cli)
- [Voice call plugin](/ja-JP/plugins/voice-call)
