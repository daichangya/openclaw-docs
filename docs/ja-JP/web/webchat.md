---
read_when:
    - WebChat アクセスをデバッグまたは設定するとき
summary: チャット UI のための loopback WebChat 静的ホストと Gateway WS 利用
title: WebChat
x-i18n:
    generated_at: "2026-04-05T13:01:43Z"
    model: gpt-5.4
    provider: openai
    source_hash: 2588be04e9ae38149bdf284bf4d75b6784d63899026d2351c4e0e7efdf05ff39
    source_path: web/webchat.md
    workflow: 15
---

# WebChat（Gateway WebSocket UI）

状態: macOS/iOS の SwiftUI チャット UI は Gateway WebSocket に直接接続します。

## これは何か

- gateway 用のネイティブチャット UI（埋め込みブラウザーもローカル静的サーバーもありません）。
- 他のチャネルと同じセッションおよびルーティングルールを使います。
- 決定的なルーティング: 返信は常に WebChat に戻ります。

## クイックスタート

1. gateway を起動します。
2. WebChat UI（macOS/iOS アプリ）または Control UI の chat タブを開きます。
3. 有効な gateway 認証経路が設定されていることを確認します（デフォルトでは shared-secret。
   loopback 上でも同様です）。

## 仕組み（動作）

- UI は Gateway WebSocket に接続し、`chat.history`、`chat.send`、`chat.inject` を使います。
- `chat.history` は安定性のために境界付きです。Gateway は長いテキストフィールドを切り詰めたり、重いメタデータを省略したり、巨大なエントリーを `[chat.history omitted: message too large]` に置き換えたりすることがあります。
- `chat.history` は表示向けにも正規化されます。`[[reply_to_*]]` や `[[audio_as_voice]]` のようなインライン配信ディレクティブタグ、
  プレーンテキストのツール呼び出し XML
  ペイロード（`<tool_call>...</tool_call>`、
  `<function_call>...</function_call>`、`<tool_calls>...</tool_calls>`、
  `<function_calls>...</function_calls>`、および切り詰められたツール呼び出しブロックを含む）、
  および漏れた ASCII/全角のモデル制御トークンは可視テキストから取り除かれ、
  可視テキスト全体が正確にサイレントトークン `NO_REPLY` / `no_reply` のみである assistant エントリーは省略されます。
- `chat.inject` は assistant メモを文字起こしに直接追加し、UI にブロードキャストします（エージェント実行なし）。
- 中断された実行では、部分的な assistant 出力が UI に表示されたままになることがあります。
- Gateway は、バッファされた出力が存在する場合、中断された部分 assistant テキストを transcript 履歴に永続化し、それらのエントリーに abort メタデータを付与します。
- 履歴は常に gateway から取得されます（ローカルファイル監視はありません）。
- gateway に到達できない場合、WebChat は読み取り専用になります。

## Control UI の agents ツールパネル

- Control UI の `/agents` Tools パネルには、2 つの別々のビューがあります。
  - **Available Right Now** は `tools.effective(sessionKey=...)` を使い、現在の
    セッションが実行時に実際に使えるものを表示します。コア、プラグイン、チャネル所有ツールを含みます。
  - **Tool Configuration** は `tools.catalog` を使い、プロファイル、上書き、カタログ意味論に
    焦点を当てたままです。
- 実行時の利用可能性はセッション単位です。同じエージェント上でセッションを切り替えると、
  **Available Right Now** の一覧が変わることがあります。
- config エディターは実行時の利用可能性を意味しません。実効アクセスは引き続きポリシーの
  優先順位（`allow`/`deny`、エージェント単位およびプロバイダー/チャネル上書き）に従います。

## リモート利用

- リモートモードでは、gateway WebSocket を SSH/Tailscale 経由でトンネルします。
- 別個の WebChat サーバーを動かす必要はありません。

## 設定リファレンス（WebChat）

完全な設定: [Configuration](/ja-JP/gateway/configuration)

WebChat オプション:

- `gateway.webchat.chatHistoryMaxChars`: `chat.history` レスポンス内のテキストフィールドの最大文字数。この制限を超える transcript エントリーがある場合、Gateway は長いテキストフィールドを切り詰め、巨大なメッセージをプレースホルダーに置き換えることがあります。クライアントはリクエスト単位の `maxChars` を送信して、単一の `chat.history` 呼び出しに対してこのデフォルトを上書きすることもできます。

関連するグローバルオプション:

- `gateway.port`, `gateway.bind`: WebSocket ホスト/ポート。
- `gateway.auth.mode`, `gateway.auth.token`, `gateway.auth.password`:
  shared-secret WebSocket 認証。
- `gateway.auth.allowTailscale`: 有効時、ブラウザーの Control UI chat タブは Tailscale
  Serve の identity headers を使用できます。
- `gateway.auth.mode: "trusted-proxy"`: アイデンティティ対応の**非 loopback**
  プロキシソース配下にあるブラウザークライアント向けの reverse-proxy 認証（[Trusted Proxy Auth](/ja-JP/gateway/trusted-proxy-auth) を参照）。
- `gateway.remote.url`, `gateway.remote.token`, `gateway.remote.password`: リモート gateway の対象。
- `session.*`: セッション保存と main キーのデフォルト。
