---
read_when:
    - 受信メッセージがどのように返信になるかの説明
    - session、キューイングモード、またはストリーミング動作の明確化
    - 推論の可視性と使用上の影響のドキュメント化
summary: メッセージフロー、session、キューイング、推論の可視性
title: メッセージ
x-i18n:
    generated_at: "2026-04-26T11:27:52Z"
    model: gpt-5.4
    provider: openai
    source_hash: 7b77d344ed0cab80566582f43127c91ec987e892eeed788aeb9988b377a96e06
    source_path: concepts/messages.md
    workflow: 15
---

このページでは、OpenClawが受信メッセージ、session、キューイング、
ストリーミング、推論の可視性をどのように扱うかをまとめて説明します。

## メッセージフロー（概要）

```
受信メッセージ
  -> ルーティング/バインディング -> sessionキー
  -> キュー（実行がアクティブな場合）
  -> agent実行（ストリーミング + tool）
  -> 送信返信（チャンネル制限 + チャンク分割）
```

主な設定項目はconfigurationにあります:

- 接頭辞、キューイング、グループ動作は `messages.*`
- ブロックストリーミングとチャンク分割のデフォルトは `agents.defaults.*`
- 上限やストリーミング切り替えのためのチャンネル上書きは `channels.whatsapp.*`、`channels.telegram.*` など

完全なschemaは [Configuration](/ja-JP/gateway/configuration) を参照してください。

## 受信重複排除

チャンネルは、再接続後に同じメッセージを再配信することがあります。OpenClawは、channel/account/peer/session/message idをキーにした短命キャッシュを保持し、重複配信で別のagent実行が起きないようにします。

## 受信デバウンス

**同じ送信者** からの高速な連続メッセージは、`messages.inbound` によって1つのagentターンにまとめることができます。デバウンスはchannel + conversation単位で適用され、返信スレッド/IDには最新メッセージを使います。

設定例（グローバルデフォルト + チャンネルごとの上書き）:

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

注記:

- デバウンスは**テキストのみ**のメッセージに適用されます。メディア/添付ファイルは即座にフラッシュされます。
- 制御コマンドは単独性を保つためデバウンスをバイパスします — ただし、チャンネルが明示的に同一送信者DM結合にオプトインしている場合（例: [BlueBubbles `coalesceSameSenderDms`](/ja-JP/channels/bluebubbles#coalescing-split-send-dms-command--url-in-one-composition)）は例外で、その場合DMコマンドはデバウンスウィンドウ内で待機し、分割送信payloadが同じagentターンに参加できるようにします。

## sessionとデバイス

sessionはクライアントではなくgatewayが所有します。

- ダイレクトチャットはagentのmain sessionキーに集約されます。
- グループ/チャンネルはそれぞれ専用のsessionキーを持ちます。
- session storeとtranscriptはgateway host上にあります。

複数のデバイス/チャンネルを同じsessionに対応付けることはできますが、履歴はすべてのクライアントへ完全には同期されません。長い会話ではコンテキスト分岐を避けるため、主に1つのプライマリデバイスを使うことを推奨します。Control UIとTUIは常にgatewayバックのsession transcriptを表示するため、これらが信頼できる情報源です。

詳細: [Session management](/ja-JP/concepts/session)。

## tool結果メタデータ

tool結果の `content` はmodelから見える結果です。tool結果の `details` は、UIレンダリング、診断、メディア配信、Plugin用のruntimeメタデータです。

OpenClawはこの境界を明示的に保ちます:

- `toolResult.details` は、provider replayとCompaction入力の前に取り除かれます。
- 永続化されたsession transcriptには、上限付きの `details` だけが保持されます。大きすぎるメタデータは、`persistedDetailsTruncated: true` が付いたコンパクトな要約に置き換えられます。
- Pluginsとtoolsは、modelが読む必要のあるテキストを `details` だけでなく `content` に入れる必要があります。

## 受信本文と履歴コンテキスト

OpenClawは、**プロンプト本文** と **コマンド本文** を分離します:

- `Body`: agentへ送るプロンプトテキスト。これにはチャンネルのenvelopeや任意の履歴wrapperが含まれる場合があります。
- `CommandBody`: directive/command解析用の生のユーザーテキスト。
- `RawBody`: `CommandBody` のレガシーエイリアス（互換性のため維持）。

チャンネルが履歴を提供する場合、共通wrapperを使います:

- `[Chat messages since your last reply - for context]`
- `[Current message - respond to this]`

**非ダイレクトチャット**（グループ/チャンネル/room）では、**現在メッセージ本文** に送信者ラベルが接頭辞として付きます（履歴エントリーと同じ形式）。これにより、リアルタイムとキュー済み/履歴メッセージの一貫性がagent prompt内で保たれます。

履歴バッファは **pending-only** です。実行をトリガーしなかったグループメッセージ（たとえばmention gatingされたメッセージ）は含まれますが、session transcriptにすでに入っているメッセージは除外されます。

directive strippingは **現在メッセージ** セクションにのみ適用されるため、履歴はそのまま保たれます。履歴を包むチャンネルは、元のメッセージテキストを `CommandBody`（または `RawBody`）に設定し、`Body` は結合済みプロンプトのままにしておく必要があります。
履歴バッファは `messages.groupChat.historyLimit`（グローバルデフォルト）と、`channels.slack.historyLimit` や `channels.telegram.accounts.<id>.historyLimit` のようなチャンネルごとの上書きで設定できます（`0` で無効化）。

## キューイングとfollowup

すでに実行がアクティブな場合、受信メッセージはキューに入れるか、現在の実行へ誘導するか、followupターン用に収集できます。

- 設定は `messages.queue`（および `messages.queue.byChannel`）で行います。
- モード: `interrupt`、`steer`、`followup`、`collect`、およびbacklogバリアント。

詳細: [Queueing](/ja-JP/concepts/queue)。

## ストリーミング、チャンク分割、バッチ化

ブロックストリーミングは、modelがテキストブロックを生成するたびに部分返信を送信します。
チャンク分割はチャンネルのテキスト上限を尊重し、fenced codeの途中分割を避けます。

主な設定:

- `agents.defaults.blockStreamingDefault`（`on|off`、デフォルトoff）
- `agents.defaults.blockStreamingBreak`（`text_end|message_end`）
- `agents.defaults.blockStreamingChunk`（`minChars|maxChars|breakPreference`）
- `agents.defaults.blockStreamingCoalesce`（アイドルベースのバッチ化）
- `agents.defaults.humanDelay`（ブロック返信間の人間らしい待機）
- チャンネルごとの上書き: `*.blockStreaming` と `*.blockStreamingCoalesce`（Telegram以外のチャンネルでは明示的な `*.blockStreaming: true` が必要）

詳細: [Streaming + chunking](/ja-JP/concepts/streaming)。

## 推論の可視性とトークン

OpenClawはmodelの推論を表示または非表示にできます:

- `/reasoning on|off|stream` で可視性を制御します。
- 推論内容は、modelが生成した場合、引き続きトークン使用量に含まれます。
- Telegramはdraft bubbleへの推論ストリームをサポートします。

詳細: [Thinking + reasoning directives](/ja-JP/tools/thinking) と [Token use](/ja-JP/reference/token-use)。

## 接頭辞、スレッド、返信

送信メッセージの整形は `messages` に集約されています:

- `messages.responsePrefix`、`channels.<channel>.responsePrefix`、`channels.<channel>.accounts.<id>.responsePrefix`（送信接頭辞のカスケード）、および `channels.whatsapp.messagePrefix`（WhatsApp受信接頭辞）
- `replyToMode` とチャンネルごとのデフォルトによる返信スレッド

詳細: [Configuration](/ja-JP/gateway/config-agents#messages) と各チャンネルdocsを参照してください。

## サイレント返信

正確なサイレントトークン `NO_REPLY` / `no_reply` は「ユーザーに見える返信を配信しない」という意味です。
ターンに生成TTS音声のような保留中toolメディアもある場合、OpenClawはサイレントテキストを取り除きますが、メディア添付は引き続き配信します。
OpenClawはこの動作を会話タイプごとに解決します:

- ダイレクト会話では、デフォルトでサイレンスは許可されず、素のサイレント返信は短い可視fallbackに書き換えられます。
- グループ/チャンネルでは、デフォルトでサイレンスが許可されます。
- 内部オーケストレーションでは、デフォルトでサイレンスが許可されます。

OpenClawはまた、非ダイレクトチャットでassistant返信前に起きた内部runner failureに対してサイレント返信を使うため、グループ/チャンネルにはgateway error boilerplateが表示されません。ダイレクトチャットでは、デフォルトでコンパクトなfailureコピーが表示されます。生のrunner詳細が表示されるのは `/verbose` が `on` または `full` のときだけです。

デフォルトは `agents.defaults.silentReply` と
`agents.defaults.silentReplyRewrite` にあります。`surfaces.<id>.silentReply` と
`surfaces.<id>.silentReplyRewrite` でsurfaceごとに上書きできます。

親sessionに1つ以上の保留中spawned subagent実行がある場合、素のサイレント返信は書き換えられず、すべてのsurfaceで破棄されます。そのため、子の完了イベントが実際の返信を届けるまで親は静かなままになります。

## 関連

- [Streaming](/ja-JP/concepts/streaming) — リアルタイムのメッセージ配信
- [Retry](/ja-JP/concepts/retry) — メッセージ配信の再試行動作
- [Queue](/ja-JP/concepts/queue) — メッセージ処理キュー
- [Channels](/ja-JP/channels) — メッセージングプラットフォーム連携
