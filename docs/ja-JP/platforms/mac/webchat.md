---
read_when:
    - mac WebChat ビューまたは loopback port をデバッグしている
summary: mac app が Gateway WebChat をどのように埋め込み、どうデバッグするか
title: WebChat（macOS）
x-i18n:
    generated_at: "2026-04-05T12:51:01Z"
    model: gpt-5.4
    provider: openai
    source_hash: 4f2c45fa5512cc9c5d3b3aa188d94e2e5a90e4bcce607d959d40bea8b17c90c5
    source_path: platforms/mac/webchat.md
    workflow: 15
---

# WebChat（macOS app）

macOS メニューバー app は、WebChat UI をネイティブな SwiftUI ビューとして埋め込みます。これは
Gateway に接続し、選択されたエージェントの**main session**をデフォルトにします
（他のセッション用の session switcher 付き）。

- **Local mode**: ローカル Gateway WebSocket に直接接続します。
- **Remote mode**: Gateway control port を SSH 経由で転送し、その
  トンネルをデータプレーンとして使います。

## 起動とデバッグ

- 手動: Lobster メニュー → 「Open Chat」。
- テスト用の自動オープン:

  ```bash
  dist/OpenClaw.app/Contents/MacOS/OpenClaw --webchat
  ```

- ログ: `./scripts/clawlog.sh`（subsystem `ai.openclaw`、category `WebChatSwiftUI`）。

## 接続方法

- データプレーン: Gateway WS メソッド `chat.history`、`chat.send`、`chat.abort`、
  `chat.inject` とイベント `chat`、`agent`、`presence`、`tick`、`health`。
- `chat.history` は表示用に正規化された transcript 行を返します。インライン directive
  タグは可視テキストから除去され、プレーンテキストの tool-call XML payload
  （`<tool_call>...</tool_call>`、
  `<function_call>...</function_call>`、`<tool_calls>...</tool_calls>`、
  `<function_calls>...</function_calls>`、および途中で切れた tool-call ブロックを含む）と
  漏えいした ASCII / 全角のモデル制御トークンは除去され、正確に `NO_REPLY` / `no_reply` であるような
  純粋な silent-token の assistant 行は省略され、大きすぎる行は
  プレースホルダーに置き換えられることがあります。
- Session: デフォルトは primary session（`main`、または scope が
  global の場合は `global`）です。UI からセッションを切り替えられます。
- オンボーディングは、初回セットアップを分離するため専用 session を使います。

## セキュリティサーフェス

- Remote mode では、Gateway WebSocket control port のみを SSH 経由で転送します。

## 既知の制限

- UI はチャットセッション向けに最適化されており（完全な browser sandbox ではありません）。
