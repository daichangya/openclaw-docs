---
read_when:
    - チャネルでのストリーミングまたはチャンク化の仕組みを説明する場合
    - ブロックストリーミングまたはチャネルのチャンク化動作を変更する場合
    - 重複した/早すぎるブロック返信やチャネルのプレビューストリーミングをデバッグする場合
summary: ストリーミング + チャンク化の動作（ブロック返信、チャネルのプレビューストリーミング、モード対応）
title: Streaming and Chunking
x-i18n:
    generated_at: "2026-04-05T12:42:40Z"
    model: gpt-5.4
    provider: openai
    source_hash: 44b0d08c7eafcb32030ef7c8d5719c2ea2d34e4bac5fdad8cc8b3f4e9e9fad97
    source_path: concepts/streaming.md
    workflow: 15
---

# Streaming + chunking

OpenClaw には、別個のストリーミングレイヤーが 2 つあります:

- **ブロックストリーミング（チャネル）:** assistant の書き込みに合わせて、完了した**ブロック**を発行します。これらは通常のチャネルメッセージであり、トークン差分ではありません。
- **プレビューストリーミング（Telegram/Discord/Slack）:** 生成中に一時的な**プレビューメッセージ**を更新します。

現在、チャネルメッセージへの**真のトークン差分ストリーミング**はありません。プレビューストリーミングはメッセージベースです（送信 + 編集/追記）。

## ブロックストリーミング（チャネルメッセージ）

ブロックストリーミングは、assistant の出力が利用可能になるにつれて粗いチャンクで送信します。

```
Model output
  └─ text_delta/events
       ├─ (blockStreamingBreak=text_end)
       │    └─ chunker emits blocks as buffer grows
       └─ (blockStreamingBreak=message_end)
            └─ chunker flushes at message_end
                   └─ channel send (block replies)
```

凡例:

- `text_delta/events`: モデルのストリームイベント（ストリーミング非対応モデルではまばらな場合があります）。
- `chunker`: 最小/最大境界 + 分割優先を適用する `EmbeddedBlockChunker`。
- `channel send`: 実際の送信メッセージ（ブロック返信）。

**制御項目:**

- `agents.defaults.blockStreamingDefault`: `"on"`/`"off"`（デフォルトは off）。
- チャネルごとのオーバーライド: `*.blockStreaming`（およびアカウントごとのバリアント）でチャネル単位に `"on"`/`"off"` を強制します。
- `agents.defaults.blockStreamingBreak`: `"text_end"` または `"message_end"`。
- `agents.defaults.blockStreamingChunk`: `{ minChars, maxChars, breakPreference? }`。
- `agents.defaults.blockStreamingCoalesce`: `{ minChars?, maxChars?, idleMs? }`（送信前にストリーミングブロックを結合）。
- チャネルのハード上限: `*.textChunkLimit`（例: `channels.whatsapp.textChunkLimit`）。
- チャネルのチャンクモード: `*.chunkMode`（デフォルトは `length`、`newline` は長さでのチャンク化の前に空行で分割します（段落境界））。
- Discord のソフト上限: `channels.discord.maxLinesPerMessage`（デフォルトは 17）は、UI の切り詰めを避けるために縦長の返信を分割します。

**境界セマンティクス:**

- `text_end`: chunker が発行したらすぐにブロックをストリームし、各 `text_end` でフラッシュします。
- `message_end`: assistant メッセージが完了するまで待機し、その後でバッファされた出力をフラッシュします。

`message_end` でも、バッファされたテキストが `maxChars` を超える場合は chunker が使われるため、最後に複数チャンクを発行することがあります。

## チャンク化アルゴリズム（下限/上限）

ブロックのチャンク化は `EmbeddedBlockChunker` によって実装されています:

- **下限:** バッファが `minChars` 以上になるまで発行しません（強制時を除く）。
- **上限:** `maxChars` の前で分割することを優先します。強制時は `maxChars` で分割します。
- **分割優先:** `paragraph` → `newline` → `sentence` → `whitespace` → 強制分割。
- **コードフェンス:** フェンス内では分割しません。`maxChars` で強制分割する場合は、Markdown の妥当性を保つためにフェンスを閉じて再度開きます。

`maxChars` はチャネルの `textChunkLimit` にクランプされるため、チャネルごとの上限を超えることはできません。

## Coalescing（ストリーミングブロックの結合）

ブロックストリーミングが有効な場合、OpenClaw は連続するブロックチャンクを**結合**
してから送信できます。これにより、進行状況を段階的に提供しつつ
「1 行ごとのスパム」を減らせます。

- Coalescing は、フラッシュ前に**アイドルギャップ**（`idleMs`）を待ちます。
- バッファは `maxChars` で上限管理され、それを超えるとフラッシュされます。
- `minChars` は、十分なテキストがたまるまで小さな断片が送信されるのを防ぎます
  （最終フラッシュでは残りのテキストを常に送信します）。
- Joiner は `blockStreamingChunk.breakPreference` から導出されます
  （`paragraph` → `\n\n`、`newline` → `\n`、`sentence` → 空白）。
- チャネルごとのオーバーライドは `*.blockStreamingCoalesce` で利用できます（アカウントごとの設定を含む）。
- デフォルトの coalesce `minChars` は、上書きされない限り Signal/Slack/Discord では 1500 に引き上げられます。

## ブロック間の人間らしいペーシング

ブロックストリーミングが有効な場合、ブロック返信の間に**ランダム化された待機**
を追加できます（最初のブロックの後）。これにより、複数バブルの応答が
より自然に感じられます。

- 設定: `agents.defaults.humanDelay`（エージェントごとの上書きは `agents.list[].humanDelay`）。
- モード: `off`（デフォルト）、`natural`（800–2500ms）、`custom`（`minMs`/`maxMs`）。
- 適用対象は **ブロック返信** のみで、最終返信やツール要約には適用されません。

## 「チャンクをストリームする」か「最後に全部送る」か

これは次のように対応します:

- **チャンクをストリームする:** `blockStreamingDefault: "on"` + `blockStreamingBreak: "text_end"`（生成しながら発行）。Telegram 以外のチャネルでは、さらに `*.blockStreaming: true` も必要です。
- **最後にすべてをストリームする:** `blockStreamingBreak: "message_end"`（最後に 1 回フラッシュ。ただし非常に長い場合は複数チャンクになることがあります）。
- **ブロックストリーミングなし:** `blockStreamingDefault: "off"`（最終返信のみ）。

**チャネル注記:** ブロックストリーミングは、`*.blockStreaming` が明示的に `true` に設定されていない限り **off** です。チャネルはブロック返信なしでもライブプレビュー（`channels.<channel>.streaming`）をストリームできます。

設定場所の注意: `blockStreaming*` のデフォルトは、ルート設定ではなく
`agents.defaults` の下にあります。

## プレビューストリーミングモード

正式なキー: `channels.<channel>.streaming`

モード:

- `off`: プレビューストリーミングを無効化。
- `partial`: 最新のテキストで置き換えられる単一プレビュー。
- `block`: チャンク化/追記ステップでプレビューを更新。
- `progress`: 生成中は進行状況/ステータスのプレビューを表示し、完了時に最終回答を表示。

### チャネル対応

| Channel  | `off` | `partial` | `block` | `progress`        |
| -------- | ----- | --------- | ------- | ----------------- |
| Telegram | ✅    | ✅        | ✅      | `partial` に対応 |
| Discord  | ✅    | ✅        | ✅      | `partial` に対応 |
| Slack    | ✅    | ✅        | ✅      | ✅                |

Slack 専用:

- `channels.slack.nativeStreaming` は、`streaming=partial` のときに Slack ネイティブストリーミング API 呼び出しを切り替えます（デフォルト: `true`）。

レガシーキーの移行:

- Telegram: `streamMode` + 真偽値の `streaming` は自動的に `streaming` enum に移行されます。
- Discord: `streamMode` + 真偽値の `streaming` は自動的に `streaming` enum に移行されます。
- Slack: `streamMode` は自動的に `streaming` enum に移行されます。真偽値の `streaming` は自動的に `nativeStreaming` に移行されます。

### 実行時の動作

Telegram:

- DM とグループ/トピック全体で、`sendMessage` + `editMessageText` のプレビュー更新を使います。
- Telegram のブロックストリーミングが明示的に有効な場合、プレビューストリーミングはスキップされます（重複ストリーミングを避けるため）。
- `/reasoning stream` は推論をプレビューに書き込めます。

Discord:

- 送信 + 編集のプレビューメッセージを使います。
- `block` モードはドラフトチャンク化（`draftChunk`）を使います。
- Discord のブロックストリーミングが明示的に有効な場合、プレビューストリーミングはスキップされます。

Slack:

- `partial` は、利用可能な場合、Slack ネイティブストリーミング（`chat.startStream`/`append`/`stop`）を使えます。
- `block` は追記スタイルのドラフトプレビューを使います。
- `progress` はステータスプレビューテキストを使い、その後で最終回答を表示します。

## 関連

- [Messages](/concepts/messages) — メッセージのライフサイクルと配信
- [Retry](/concepts/retry) — 配信失敗時のリトライ動作
- [Channels](/ja-JP/channels) — チャネルごとのストリーミング対応
