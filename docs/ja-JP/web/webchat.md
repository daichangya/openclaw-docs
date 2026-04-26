---
read_when:
    - ウェブチャットのアクセスをデバッグまたは設定する
summary: チャット UI 向けの loopback WebChat 静的ホストと Gateway WS の使用法
title: ウェブチャット
x-i18n:
    generated_at: "2026-04-26T11:43:42Z"
    model: gpt-5.4
    provider: openai
    source_hash: eb64bf7771f833a6d97c1b0ad773e763422af25e85a3084519e05aa8d3d0ab69
    source_path: web/webchat.md
    workflow: 15
---

ステータス: macOS/iOS の SwiftUI チャット UI は Gateway WebSocket と直接通信します。

## 概要

- gateway 用のネイティブチャット UI です（埋め込みブラウザーやローカル静的サーバーはありません）。
- 他のチャネルと同じセッションおよびルーティングルールを使用します。
- 決定的なルーティング: 返信は常に WebChat に戻ります。

## クイックスタート

1. gateway を起動します。
2. WebChat UI（macOS/iOS アプリ）または Control UI のチャットタブを開きます。
3. 有効な gateway 認証経路が設定されていることを確認します（デフォルトでは共有シークレットで、loopback 上でも必要です）。

## 仕組み（動作）

- UI は Gateway WebSocket に接続し、`chat.history`、`chat.send`、`chat.inject` を使用します。
- `chat.history` は安定性のために制限されています: Gateway は長いテキストフィールドを切り詰めたり、重いメタデータを省略したり、サイズが大きすぎるエントリを `[chat.history omitted: message too large]` に置き換えたりすることがあります。
- `chat.history` は表示向けに正規化もされます: ランタイム専用の OpenClaw コンテキスト、
  受信エンベロープラッパー、`[[reply_to_*]]` や `[[audio_as_voice]]` のようなインライン配信ディレクティブタグ、
  プレーンテキストの tool-call XML
  ペイロード（`<tool_call>...</tool_call>`、
  `<function_call>...</function_call>`、`<tool_calls>...</tool_calls>`、
  `<function_calls>...</function_calls>`、および切り詰められた tool-call ブロックを含む）、および
  漏れ出した ASCII/全角の model 制御トークンは表示テキストから削除され、
  可視テキスト全体が完全にサイレントトークン
  `NO_REPLY` / `no_reply` のみである assistant エントリは省略されます。
- 推論フラグ付き返信ペイロード（`isReasoning: true`）は、WebChat の assistant コンテンツ、トランスクリプト再生テキスト、および音声コンテンツブロックから除外されるため、thinking 専用ペイロードが可視 assistant メッセージや再生可能な音声として表示されることはありません。
- `chat.inject` は assistant ノートをトランスクリプトに直接追加し、それを UI にブロードキャストします（エージェント実行なし）。
- 中断された実行では、部分的な assistant 出力が UI に表示されたままになることがあります。
- Gateway は、バッファリングされた出力が存在する場合、中断された部分 assistant テキストをトランスクリプト履歴に保持し、それらのエントリに中断メタデータを付けます。
- 履歴は常に gateway から取得されます（ローカルファイル監視はありません）。
- gateway に到達できない場合、WebChat は読み取り専用です。

## Control UI の agents tools パネル

- Control UI の `/agents` Tools パネルには、2 つの別々のビューがあります:
  - **現在利用可能** は `tools.effective(sessionKey=...)` を使用し、core、plugin、チャネル所有 tools を含め、現在の
    セッションが実行時に実際に使用できるものを表示します。
  - **Tool Configuration** は `tools.catalog` を使用し、プロファイル、上書き、および
    カタログのセマンティクスに焦点を当て続けます。
- ランタイムでの可用性はセッションスコープです。同じエージェント上でセッションを切り替えると、
  **現在利用可能** の一覧が変わることがあります。
- 設定エディターはランタイムでの可用性を意味しません。実効アクセスは引き続きポリシーの
  優先順位（`allow`/`deny`、エージェントごと、およびプロバイダー/チャネルごとの上書き）に従います。

## リモート利用

- リモートモードでは、gateway WebSocket を SSH/Tailscale 経由でトンネルします。
- 別の WebChat サーバーを実行する必要はありません。

## 設定リファレンス（WebChat）

完全な設定: [Configuration](/ja-JP/gateway/configuration)

WebChat オプション:

- `gateway.webchat.chatHistoryMaxChars`: `chat.history` 応答内のテキストフィールドの最大文字数。この上限をトランスクリプトエントリが超える場合、Gateway は長いテキストフィールドを切り詰め、サイズが大きすぎるメッセージをプレースホルダーに置き換えることがあります。単一の `chat.history` 呼び出しに対してこのデフォルトを上書きするため、クライアントはリクエストごとの `maxChars` を送信することもできます。

関連するグローバルオプション:

- `gateway.port`, `gateway.bind`: WebSocket ホスト/ポート。
- `gateway.auth.mode`, `gateway.auth.token`, `gateway.auth.password`:
  共有シークレット WebSocket 認証。
- `gateway.auth.allowTailscale`: ブラウザーの Control UI チャットタブは、
  有効な場合に Tailscale Serve の ID ヘッダーを使用できます。
- `gateway.auth.mode: "trusted-proxy"`: ID 認識対応の**非 loopback**
  プロキシソースの背後にあるブラウザークライアント向けのリバースプロキシ認証（[Trusted Proxy Auth](/ja-JP/gateway/trusted-proxy-auth) を参照）。
- `gateway.remote.url`, `gateway.remote.token`, `gateway.remote.password`: リモート gateway 対象。
- `session.*`: セッションストレージとメインキーデフォルト。

## 関連

- [Control UI](/ja-JP/web/control-ui)
- [Dashboard](/ja-JP/web/dashboard)
