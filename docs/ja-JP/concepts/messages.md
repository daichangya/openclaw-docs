---
read_when:
    - 受信メッセージがどのように返信になるかの説明
    - セッション、キューイングモード、またはストリーミング動作の明確化
    - 推論の可視性と使用上の影響の文書化
summary: メッセージフロー、セッション、キューイング、および推論の可視性
title: メッセージ
x-i18n:
    generated_at: "2026-04-23T04:44:09Z"
    model: gpt-5.4
    provider: openai
    source_hash: d4490d87835f44f703b45b29ad69878fec552caf81f4bd07d29614f71ee15cfb
    source_path: concepts/messages.md
    workflow: 15
---

# メッセージ

このページでは、OpenClawが受信メッセージ、セッション、キューイング、
ストリーミング、および推論の可視性をどのように扱うかをまとめて説明します。

## メッセージフロー（概要）

```
Inbound message
  -> routing/bindings -> session key
  -> queue (if a run is active)
  -> agent run (streaming + tools)
  -> outbound replies (channel limits + chunking)
```

主要な調整項目は設定にあります。

- プレフィックス、キューイング、グループ動作には `messages.*`。
- ブロックストリーミングとチャンク化のデフォルトには `agents.defaults.*`。
- 上限やストリーミング切り替えにはチャンネルごとのオーバーライド（`channels.whatsapp.*`、`channels.telegram.*` など）。

完全なスキーマについては[設定](/ja-JP/gateway/configuration)を参照してください。

## 受信重複排除

チャンネルは再接続後に同じメッセージを再配信することがあります。OpenClawは
channel/account/peer/session/message id をキーにした短期間のキャッシュを保持し、
重複配信が別のエージェント実行を引き起こさないようにします。

## 受信デバウンス

**同じ送信者**から短時間に連続して届くメッセージは、`messages.inbound` を通じて単一の
エージェントターンにまとめることができます。デバウンスはチャンネルごと + 会話ごとに適用され、
返信スレッド/ID には最新のメッセージが使われます。

設定（グローバルデフォルト + チャンネルごとのオーバーライド）:

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

- デバウンスは**テキストのみ**のメッセージに適用されます。メディア/添付ファイルは即座にフラッシュされます。
- 制御コマンドはデバウンスをバイパスするため、単独のまま維持されます。ただし、チャンネルが同一送信者 DM の結合を明示的に有効にしている場合は例外です（例: [BlueBubbles `coalesceSameSenderDms`](/ja-JP/channels/bluebubbles#coalescing-split-send-dms-command--url-in-one-composition)）。この場合、DM コマンドはデバウンスウィンドウ内で待機し、分割送信されたペイロードが同じエージェントターンに加われます。

## セッションとデバイス

セッションはクライアントではなくGatewayによって管理されます。

- ダイレクトチャットはエージェントのメインセッションキーに集約されます。
- グループ/チャンネルはそれぞれ独自のセッションキーを持ちます。
- セッションストアとトランスクリプトはGatewayホスト上に保存されます。

複数のデバイス/チャンネルが同じセッションに対応することはありますが、履歴はすべての
クライアントに完全には同期されません。推奨事項として、長い会話ではコンテキストの分岐を避けるために
主要なデバイスを 1 台使ってください。Control UI と TUI は常にGateway側の
セッショントランスクリプトを表示するため、これらが信頼できる情報源です。

詳細: [セッション管理](/ja-JP/concepts/session)。

## 受信本文と履歴コンテキスト

OpenClawは**プロンプト本文**と**コマンド本文**を分離しています。

- `Body`: エージェントに送信されるプロンプトテキスト。これにはチャンネルエンベロープと
  任意の履歴ラッパーが含まれる場合があります。
- `CommandBody`: ディレクティブ/コマンド解析用の生のユーザーテキスト。
- `RawBody`: `CommandBody` のレガシーエイリアス（互換性のため維持）。

チャンネルが履歴を提供する場合、共通のラッパーを使用します。

- `[Chat messages since your last reply - for context]`
- `[Current message - respond to this]`

**非ダイレクトチャット**（グループ/チャンネル/ルーム）では、**現在のメッセージ本文**の先頭に
送信者ラベルが付きます（履歴エントリに使われるものと同じ形式）。これにより、リアルタイムメッセージと
キュー/履歴メッセージの一貫性がエージェントプロンプト内で保たれます。

履歴バッファは**pending-only**です。つまり、実行をトリガーしなかったグループメッセージ
（たとえば、メンション制御されたメッセージ）を含み、すでにセッショントランスクリプトにある
メッセージは**除外**します。

ディレクティブの除去は**現在のメッセージ**セクションにのみ適用されるため、履歴はそのまま保持されます。
履歴をラップするチャンネルでは、`CommandBody`（または `RawBody`）に元のメッセージテキストを設定し、
`Body` は結合済みプロンプトのままにしてください。
履歴バッファは `messages.groupChat.historyLimit`（グローバルデフォルト）および
`channels.slack.historyLimit` や `channels.telegram.accounts.<id>.historyLimit` のような
チャンネルごとのオーバーライドで設定できます（無効化するには `0` を設定）。

## キューイングとフォローアップ

すでに実行中のランがある場合、受信メッセージはキューに入れる、現在のランに誘導する、
またはフォローアップターン用に収集することができます。

- 設定は `messages.queue`（および `messages.queue.byChannel`）で行います。
- モード: `interrupt`、`steer`、`followup`、`collect`、および backlog バリアント。

詳細: [キューイング](/ja-JP/concepts/queue)。

## ストリーミング、チャンク化、バッチ処理

ブロックストリーミングは、モデルがテキストブロックを生成するのに合わせて部分的な返信を送信します。
チャンク化はチャンネルのテキスト制限を尊重し、フェンス付きコードの分割を避けます。

主要な設定:

- `agents.defaults.blockStreamingDefault` (`on|off`、デフォルトは off)
- `agents.defaults.blockStreamingBreak` (`text_end|message_end`)
- `agents.defaults.blockStreamingChunk` (`minChars|maxChars|breakPreference`)
- `agents.defaults.blockStreamingCoalesce`（アイドル時間ベースのバッチ処理）
- `agents.defaults.humanDelay`（ブロック返信間の人間らしい待機）
- チャンネルごとのオーバーライド: `*.blockStreaming` および `*.blockStreamingCoalesce`（Telegram 以外のチャンネルでは明示的な `*.blockStreaming: true` が必要）

詳細: [ストリーミング + チャンク化](/ja-JP/concepts/streaming)。

## 推論の可視性とトークン

OpenClawではモデルの推論を表示または非表示にできます。

- `/reasoning on|off|stream` で可視性を制御します。
- 推論内容は、モデルによって生成された場合、引き続きトークン使用量にカウントされます。
- Telegramは下書きバブルへの推論ストリーム表示をサポートしています。

詳細: [Thinking + 推論ディレクティブ](/ja-JP/tools/thinking) と [トークン使用](/ja-JP/reference/token-use)。

## プレフィックス、スレッド、返信

送信メッセージの形式は `messages` で一元管理されます。

- `messages.responsePrefix`、`channels.<channel>.responsePrefix`、`channels.<channel>.accounts.<id>.responsePrefix`（送信プレフィックスのカスケード）、および `channels.whatsapp.messagePrefix`（WhatsApp受信プレフィックス）
- `replyToMode` とチャンネルごとのデフォルトによる返信スレッド

詳細: [設定](/ja-JP/gateway/configuration-reference#messages) と各チャンネルのドキュメントを参照してください。

## サイレント返信

厳密なサイレントトークン `NO_REPLY` / `no_reply` は「ユーザーに見える返信を配信しない」ことを意味します。
OpenClawはこの動作を会話タイプごとに解決します。

- ダイレクト会話ではデフォルトで無音は許可されず、素のサイレント返信は短い可視フォールバックに書き換えられます。
- グループ/チャンネルではデフォルトで無音が許可されます。
- 内部オーケストレーションではデフォルトで無音が許可されます。

デフォルトは `agents.defaults.silentReply` と
`agents.defaults.silentReplyRewrite` にあり、
`surfaces.<id>.silentReply` と
`surfaces.<id>.silentReplyRewrite` でサーフェスごとにオーバーライドできます。

親セッションに保留中の spawn されたサブエージェント実行が 1 つ以上ある場合、
素のサイレント返信は書き換えられずにすべてのサーフェスで破棄されるため、
子の完了イベントが実際の返信を配信するまで親は静かなままになります。

## 関連

- [ストリーミング](/ja-JP/concepts/streaming) — リアルタイムメッセージ配信
- [リトライ](/ja-JP/concepts/retry) — メッセージ配信の再試行動作
- [キュー](/ja-JP/concepts/queue) — メッセージ処理キュー
- [チャンネル](/ja-JP/channels) — メッセージングプラットフォーム統合
