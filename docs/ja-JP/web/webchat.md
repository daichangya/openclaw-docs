---
read_when:
    - WebChat アクセスをデバッグまたは設定する場合
summary: チャット UI のための loopback WebChat 静的ホストと Gateway WS の使用方法
title: WebChat
x-i18n:
    generated_at: "2026-04-25T14:03:07Z"
    model: gpt-5.4
    provider: openai
    source_hash: c112aca6c6fb29c5752fe931dcd47749acf0b8d8d505522f75b82533fc3ffb5a
    source_path: web/webchat.md
    workflow: 15
---

ステータス: macOS/iOS の SwiftUI チャット UI は、Gateway WebSocket と直接通信します。

## これは何か

- Gateway 用のネイティブチャット UI です（埋め込みブラウザーやローカル静的サーバーはありません）。
- 他のチャネルと同じセッションおよびルーティングルールを使います。
- 決定的なルーティング: 返信は常に WebChat に戻ります。

## クイックスタート

1. Gateway を起動します。
2. WebChat UI（macOS/iOS アプリ）または Control UI のチャットタブを開きます。
3. 有効な Gateway 認証経路が設定されていることを確認します（loopback 上でも、デフォルトは shared-secret です）。

## 仕組み（動作）

- UI は Gateway WebSocket に接続し、`chat.history`、`chat.send`、`chat.inject` を使います。
- `chat.history` は安定性のために制限されています。Gateway は長いテキストフィールドを切り詰めたり、重いメタデータを省略したり、過大なエントリを `[chat.history omitted: message too large]` に置き換えたりすることがあります。
- `chat.history` は表示向けにも正規化されます。ランタイム専用の OpenClaw コンテキスト、
  inbound envelope ラッパー、`[[reply_to_*]]` や `[[audio_as_voice]]` のようなインライン配信ディレクティブタグ、プレーンテキストのツール呼び出し XML ペイロード
  （`<tool_call>...</tool_call>`、
  `<function_call>...</function_call>`、`<tool_calls>...</tool_calls>`、
  `<function_calls>...</function_calls>`、および切り詰められたツール呼び出しブロックを含む）、
  および漏れ出した ASCII/全角のモデル制御トークンは可視テキストから取り除かれ、表示テキスト全体が完全にサイレントトークン `NO_REPLY` / `no_reply` のみである assistant エントリは省略されます。
- `chat.inject` は assistant の注記を transcript に直接追加し、それを UI にブロードキャストします（エージェント実行はありません）。
- 中断された実行では、部分的な assistant 出力が UI に表示されたままになることがあります。
- Gateway は、バッファされた出力が存在する場合、中断された部分的 assistant テキストを transcript 履歴に永続化し、それらのエントリに abort メタデータを付けます。
- 履歴は常に Gateway から取得されます（ローカルファイル監視はありません）。
- Gateway に到達できない場合、WebChat は読み取り専用になります。

## Control UI エージェントツールパネル

- Control UI の `/agents` Tools パネルには、2 つの別々のビューがあります。
  - **現在利用可能** は `tools.effective(sessionKey=...)` を使用し、現在の
    セッションが実行時に実際に使用できるものを表示します。core、プラグイン、チャネル所有ツールを含みます。
  - **ツール設定** は `tools.catalog` を使用し、プロファイル、上書き、
    カタログの意味論に焦点を当てたままです。
- 実行時の利用可否はセッションスコープです。同じエージェントでもセッションを切り替えると
  **現在利用可能** の一覧は変わることがあります。
- 設定エディターは実行時利用可否を意味しません。実効アクセスは引き続きポリシーの
  優先順位（`allow`/`deny`、エージェントごとおよび Provider/チャネルごとの上書き）に従います。

## リモート利用

- リモートモードでは、Gateway WebSocket を SSH/Tailscale 上でトンネルします。
- 別の WebChat サーバーを実行する必要はありません。

## 設定リファレンス（WebChat）

完全な設定: [Configuration](/ja-JP/gateway/configuration)

WebChat オプション:

- `gateway.webchat.chatHistoryMaxChars`: `chat.history` レスポンス内のテキストフィールドの最大文字数。この制限を transcript エントリが超えると、Gateway は長いテキストフィールドを切り詰め、過大なメッセージをプレースホルダーに置き換えることがあります。クライアントは、1 回の `chat.history` 呼び出しに対してのみこのデフォルトを上書きするため、リクエストごとの `maxChars` も送信できます。

関連するグローバルオプション:

- `gateway.port`, `gateway.bind`: WebSocket の host/port。
- `gateway.auth.mode`, `gateway.auth.token`, `gateway.auth.password`:
  shared-secret WebSocket 認証。
- `gateway.auth.allowTailscale`: 有効な場合、ブラウザー Control UI のチャットタブは Tailscale
  Serve identity ヘッダーを使用できます。
- `gateway.auth.mode: "trusted-proxy"`: identity-aware な **非 loopback** プロキシ元の背後にあるブラウザークライアント向けの reverse-proxy 認証（[Trusted Proxy Auth](/ja-JP/gateway/trusted-proxy-auth) を参照）。
- `gateway.remote.url`, `gateway.remote.token`, `gateway.remote.password`: リモート Gateway の接続先。
- `session.*`: セッション保存と main key のデフォルト。

## 関連

- [Control UI](/ja-JP/web/control-ui)
- [ダッシュボード](/ja-JP/web/dashboard)
