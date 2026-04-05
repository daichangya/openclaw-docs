---
read_when:
    - cronジョブを作成せずにシステムイベントをキューに追加したい場合
    - heartbeatを有効または無効にする必要がある場合
    - システムpresenceエントリを確認したい場合
summary: '`openclaw system` のCLIリファレンス（システムイベント、heartbeat、presence）'
title: system
x-i18n:
    generated_at: "2026-04-05T12:40:12Z"
    model: gpt-5.4
    provider: openai
    source_hash: a7d19afde9d9cde8a79b0bb8cec6e5673466f4cb9b575fb40111fc32f4eee5d7
    source_path: cli/system.md
    workflow: 15
---

# `openclaw system`

Gateway用のシステムレベルのヘルパーです。システムイベントをキューに追加し、heartbeatを制御し、
presenceを表示します。

すべての `system` サブコマンドはGateway RPCを使用し、共通のクライアントフラグを受け付けます。

- `--url <url>`
- `--token <token>`
- `--timeout <ms>`
- `--expect-final`

## 一般的なコマンド

```bash
openclaw system event --text "Check for urgent follow-ups" --mode now
openclaw system event --text "Check for urgent follow-ups" --url ws://127.0.0.1:18789 --token "$OPENCLAW_GATEWAY_TOKEN"
openclaw system heartbeat enable
openclaw system heartbeat last
openclaw system presence
```

## `system event`

**main** セッションでシステムイベントをキューに追加します。次のheartbeatで、
プロンプトに `System:` 行として挿入されます。`--mode now` を使うとheartbeatが
即座にトリガーされ、`next-heartbeat` は次回のスケジュール済みティックまで待機します。

フラグ:

- `--text <text>`: 必須のシステムイベントテキスト。
- `--mode <mode>`: `now` または `next-heartbeat`（デフォルト）。
- `--json`: マシン可読な出力。
- `--url`, `--token`, `--timeout`, `--expect-final`: 共通のGateway RPCフラグ。

## `system heartbeat last|enable|disable`

heartbeatの制御:

- `last`: 最後のheartbeatイベントを表示します。
- `enable`: heartbeatを再び有効にします（無効にされていた場合に使用します）。
- `disable`: heartbeatを一時停止します。

フラグ:

- `--json`: マシン可読な出力。
- `--url`, `--token`, `--timeout`, `--expect-final`: 共通のGateway RPCフラグ。

## `system presence`

Gatewayが認識している現在のシステムpresenceエントリ（ノード、
インスタンス、その他の同様のステータス行）を一覧表示します。

フラグ:

- `--json`: マシン可読な出力。
- `--url`, `--token`, `--timeout`, `--expect-final`: 共通のGateway RPCフラグ。

## 注意

- 現在の設定で到達可能な、実行中のGatewayが必要です（ローカルまたはリモート）。
- システムイベントは一時的なもので、再起動後も保持されません。
