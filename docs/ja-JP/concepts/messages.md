---
read_when:
    - 受信メッセージがどのように返信になるかを説明する場合
    - セッション、キューイングモード、またはストリーミング動作を明確にする場合
    - 推論の可視性と使用量への影響を文書化する場合
summary: メッセージフロー、セッション、キューイング、推論の可視性
title: Messages
x-i18n:
    generated_at: "2026-04-05T12:41:41Z"
    model: gpt-5.4
    provider: openai
    source_hash: 475f892bd534fdb10a2ee5d3c57a3d4a7fb8e1ab68d695189ba186004713f6f3
    source_path: concepts/messages.md
    workflow: 15
---

# Messages

このページでは、OpenClaw が受信メッセージ、セッション、キューイング、
ストリーミング、および推論の可視性をどのように扱うかをまとめています。

## メッセージフロー（概要）

```
Inbound message
  -> routing/bindings -> session key
  -> queue (if a run is active)
  -> agent run (streaming + tools)
  -> outbound replies (channel limits + chunking)
```

主要な調整項目は設定にあります:

- プレフィックス、キューイング、グループ動作には `messages.*`。
- ブロックストリーミングとチャンク化のデフォルトには `agents.defaults.*`。
- 上限とストリーミング切り替えにはチャネルごとのオーバーライド（`channels.whatsapp.*`、`channels.telegram.*` など）。

完全なスキーマについては、[Configuration](/gateway/configuration) を参照してください。

## 受信重複排除

チャネルは、再接続後に同じメッセージを再配信することがあります。OpenClaw は、
channel/account/peer/session/message id をキーにした短命なキャッシュを保持し、
重複配信によって別のエージェント実行がトリガーされないようにします。

## 受信デバウンス

**同じ送信者** からの短時間の連続メッセージは、`messages.inbound` によって単一の
エージェントターンにバッチ化できます。デバウンスはチャネルごと + 会話ごとに適用され、
返信のスレッディング/ID には最新のメッセージを使います。

設定（グローバルデフォルト + チャネルごとのオーバーライド）:

```json5
{
  messages: {
    inbound: {
      debounceMs: 2000,
      byChannel: {
        whatsapp: 5000,
        slack: 1500,
        discord: 1500,
      },
    },
  },
}
```

注意:

- デバウンスは **テキストのみ** のメッセージに適用されます。メディア/添付は即座にフラッシュされます。
- 制御コマンドはデバウンスをバイパスし、単独のまま維持されます。

## セッションとデバイス

セッションはクライアントではなく Gateway が所有します。

- ダイレクトチャットはエージェントのメインセッションキーに集約されます。
- グループ/チャネルはそれぞれ独自のセッションキーを持ちます。
- セッションストアとトランスクリプトは Gateway ホスト上にあります。

複数のデバイス/チャネルが同じセッションにマップされることはありますが、履歴がすべての
クライアントに完全に同期されるわけではありません。推奨事項: 長い会話では 1 つの主要デバイスを使い、
コンテキストの分岐を避けてください。Control UI と TUI は常に
Gateway に裏付けられたセッショントランスクリプトを表示するため、それらが信頼できる情報源です。

詳細: [Session management](/concepts/session)。

## 受信本文と履歴コンテキスト

OpenClaw は **プロンプト本文** と **コマンド本文** を分離します:

- `Body`: エージェントに送られるプロンプトテキスト。これにはチャネルエンベロープと
  任意の履歴ラッパーが含まれることがあります。
- `CommandBody`: ディレクティブ/コマンド解析用の生のユーザーテキスト。
- `RawBody`: `CommandBody` の旧来のエイリアス（互換性のために維持）。

チャネルが履歴を提供する場合、共通のラッパーを使います:

- `[Chat messages since your last reply - for context]`
- `[Current message - respond to this]`

**非ダイレクトチャット**（グループ/チャネル/ルーム）では、**現在のメッセージ本文** に
送信者ラベルがプレフィックスとして付きます（履歴エントリで使われるのと同じスタイル）。
これにより、リアルタイムメッセージとキュー済み/履歴メッセージがエージェントプロンプト内で一貫します。

履歴バッファは **保留中のみ** です。つまり、実行をトリガーしなかった
グループメッセージ（たとえば mention-gated メッセージ）を含み、すでに
セッショントランスクリプトにあるメッセージは **除外** します。

ディレクティブの除去は **現在のメッセージ** セクションにのみ適用されるため、
履歴はそのまま維持されます。履歴をラップするチャネルは、`CommandBody`（または
`RawBody`）に元のメッセージテキストを設定し、`Body` は結合されたプロンプトのままにしてください。
履歴バッファは `messages.groupChat.historyLimit`（グローバルデフォルト）と、
`channels.slack.historyLimit` や `channels.telegram.accounts.<id>.historyLimit` のような
チャネルごとのオーバーライドで設定できます（無効化するには `0` を設定）。

## キューイングとフォローアップ

すでに実行中の run がある場合、受信メッセージはキューに入れることも、現在の
run に誘導することも、フォローアップターン用に収集することもできます。

- 設定は `messages.queue`（および `messages.queue.byChannel`）で行います。
- モード: `interrupt`、`steer`、`followup`、`collect`、および backlog バリアント。

詳細: [Queueing](/concepts/queue)。

## ストリーミング、チャンク化、バッチ化

ブロックストリーミングは、モデルがテキストブロックを生成するのに合わせて部分返信を送信します。
チャンク化はチャネルのテキスト上限を尊重し、フェンス付きコードを分割しないようにします。

主要な設定:

- `agents.defaults.blockStreamingDefault`（`on|off`、デフォルトは off）
- `agents.defaults.blockStreamingBreak`（`text_end|message_end`）
- `agents.defaults.blockStreamingChunk`（`minChars|maxChars|breakPreference`）
- `agents.defaults.blockStreamingCoalesce`（アイドルベースのバッチ化）
- `agents.defaults.humanDelay`（ブロック返信の間の人間らしい間隔）
- チャネルごとのオーバーライド: `*.blockStreaming` と `*.blockStreamingCoalesce`（Telegram 以外のチャネルでは明示的な `*.blockStreaming: true` が必要）

詳細: [Streaming + chunking](/concepts/streaming)。

## 推論の可視性とトークン

OpenClaw はモデルの推論を表示または非表示にできます:

- `/reasoning on|off|stream` で可視性を制御します。
- 推論内容は、モデルが生成した場合、トークン使用量に引き続きカウントされます。
- Telegram は下書きバブルへの推論ストリームをサポートしています。

詳細: [Thinking + reasoning directives](/tools/thinking) と [Token use](/reference/token-use)。

## プレフィックス、スレッディング、返信

送信メッセージの書式設定は `messages` に集約されています:

- `messages.responsePrefix`、`channels.<channel>.responsePrefix`、および `channels.<channel>.accounts.<id>.responsePrefix`（送信プレフィックスのカスケード）、および `channels.whatsapp.messagePrefix`（WhatsApp 受信プレフィックス）
- `replyToMode` とチャネルごとのデフォルトによる返信スレッディング

詳細: [Configuration](/gateway/configuration-reference#messages) と各チャネルのドキュメントを参照してください。

## 関連

- [Streaming](/concepts/streaming) — リアルタイムのメッセージ配信
- [Retry](/concepts/retry) — メッセージ配信のリトライ動作
- [Queue](/concepts/queue) — メッセージ処理キュー
- [Channels](/ja-JP/channels) — メッセージングプラットフォーム連携
