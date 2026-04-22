---
read_when:
    - チャンネルでのストリーミングやチャンク化の仕組みの説明
    - ブロックストリーミングやチャンネルのチャンク化動作の変更
    - 重複した/早すぎるブロック返信やチャンネルプレビューストリーミングのデバッグ
summary: ストリーミング + チャンク化の動作（ブロック返信、チャンネルプレビューストリーミング、モードマッピング）
title: ストリーミングとチャンク化
x-i18n:
    generated_at: "2026-04-22T04:22:20Z"
    model: gpt-5.4
    provider: openai
    source_hash: c6b246025ea1b1be57705bde60c0cdb485ffda727392cf00ea5a165571e37fce
    source_path: concepts/streaming.md
    workflow: 15
---

# ストリーミング + チャンク化

OpenClawには、別々の2つのストリーミング層があります:

- **ブロックストリーミング（channels）:** アシスタントが書き進めるにつれて、完成した**ブロック**を出力します。これらは通常のチャンネルメッセージです（token deltaではありません）。
- **プレビューストリーミング（Telegram/Discord/Slack）:** 生成中に一時的な**プレビューメッセージ**を更新します。

現在、チャンネルメッセージへの**真のtoken-deltaストリーミング**はありません。プレビューストリーミングはメッセージベースです（送信 + 編集/追記）。

## ブロックストリーミング（チャンネルメッセージ）

ブロックストリーミングは、利用可能になった時点でアシスタント出力を大まかな塊にして送信します。

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

- `text_delta/events`: モデルのストリームイベント（非ストリーミングモデルでは疎になる場合があります）。
- `chunker`: 最小/最大境界 + 分割優先設定を適用する `EmbeddedBlockChunker`。
- `channel send`: 実際の送信メッセージ（ブロック返信）。

**制御項目:**

- `agents.defaults.blockStreamingDefault`: `"on"`/`"off"`（デフォルトはoff）。
- チャンネル上書き: チャンネルごとに `"on"`/`"off"` を強制する `*.blockStreaming`（およびアカウントごとのバリアント）。
- `agents.defaults.blockStreamingBreak`: `"text_end"` または `"message_end"`。
- `agents.defaults.blockStreamingChunk`: `{ minChars, maxChars, breakPreference? }`。
- `agents.defaults.blockStreamingCoalesce`: `{ minChars?, maxChars?, idleMs? }`（送信前にストリーミングされたブロックを結合）。
- チャンネルのハード上限: `*.textChunkLimit`（例: `channels.whatsapp.textChunkLimit`）。
- チャンネルのチャンクモード: `*.chunkMode`（デフォルトは `length`、`newline` は長さで分割する前に空行（段落境界）で分割）。
- Discordのソフト上限: `channels.discord.maxLinesPerMessage`（デフォルト17）は、UIのクリッピングを避けるため背の高い返信を分割します。

**境界の意味:**

- `text_end`: chunkerが出力し次第ブロックをストリームし、各 `text_end` でフラッシュします。
- `message_end`: アシスタントメッセージが完了するまで待ち、その後バッファ済み出力をフラッシュします。

`message_end` でも、バッファ済みテキストが `maxChars` を超える場合はchunkerを使うため、最後に複数チャンクを出力できます。

## チャンク化アルゴリズム（下限/上限境界）

ブロックチャンク化は `EmbeddedBlockChunker` によって実装されています:

- **下限境界:** バッファが `minChars` 以上になるまで出力しません（強制時を除く）。
- **上限境界:** `maxChars` より前での分割を優先し、強制時は `maxChars` で分割します。
- **分割優先順:** `paragraph` → `newline` → `sentence` → `whitespace` → ハード分割。
- **コードフェンス:** フェンス内では決して分割しません。`maxChars` で強制分割する場合は、Markdownの妥当性を保つためにフェンスを閉じて再度開きます。

`maxChars` はチャンネルの `textChunkLimit` にクランプされるため、チャンネルごとの上限を超えることはできません。

## 結合（ストリーミングされたブロックのマージ）

ブロックストリーミングが有効な場合、OpenClawは送信前に**連続するブロックチャンクを結合**できます。これにより、段階的な出力を維持しつつ「1行スパム」を減らせます。

- 結合はフラッシュ前に**アイドル間隔**（`idleMs`）を待ちます。
- バッファは `maxChars` で上限管理され、それを超えるとフラッシュされます。
- `minChars` により、十分なテキストがたまるまで小さな断片は送信されません（最終フラッシュでは残りテキストを必ず送信します）。
- joinerは `blockStreamingChunk.breakPreference` から導出されます（`paragraph` → `\n\n`, `newline` → `\n`, `sentence` → 半角スペース）。
- チャンネルごとの上書きは `*.blockStreamingCoalesce` で利用できます（アカウントごとの設定を含む）。
- デフォルトの結合 `minChars` は、上書きされない限りSignal/Slack/Discordで1500に引き上げられます。

## ブロック間の人間らしい間隔

ブロックストリーミングが有効な場合、ブロック返信の間（最初のブロックの後）に**ランダムな待機**を追加できます。これにより、複数バブルの返信がより自然に感じられます。

- 設定: `agents.defaults.humanDelay`（エージェントごとの上書きは `agents.list[].humanDelay`）。
- モード: `off`（デフォルト）、`natural`（800–2500ms）、`custom`（`minMs`/`maxMs`）。
- 適用対象は**ブロック返信**のみで、最終返信やツールサマリーには適用されません。

## 「チャンクをストリームする」または「最後にまとめて送る」

これは次に対応します:

- **チャンクをストリームする:** `blockStreamingDefault: "on"` + `blockStreamingBreak: "text_end"`（進行しながら出力）。Telegram以外のチャンネルでは `*.blockStreaming: true` も必要です。
- **最後にすべてストリームする:** `blockStreamingBreak: "message_end"`（最後に一度フラッシュ。非常に長い場合は複数チャンクになる場合あり）。
- **ブロックストリーミングなし:** `blockStreamingDefault: "off"`（最終返信のみ）。

**チャンネルに関する注意:** ブロックストリーミングは、`*.blockStreaming` が明示的に `true` に設定されていない限り**off**です。チャンネルは、ブロック返信なしでも `channels.<channel>.streaming` でライブプレビューをストリームできます。

設定場所に関する注意: `blockStreaming*` のデフォルトは、ルート設定ではなく `agents.defaults` 配下にあります。

## プレビューストリーミングモード

正規キー: `channels.<channel>.streaming`

モード:

- `off`: プレビューストリーミングを無効化します。
- `partial`: 最新テキストで置き換えられる単一プレビュー。
- `block`: チャンク化/追記ステップで更新されるプレビュー。
- `progress`: 生成中は進捗/ステータスプレビューを表示し、完了時に最終回答を表示します。

### チャンネルマッピング

| Channel    | `off` | `partial` | `block` | `progress`        |
| ---------- | ----- | --------- | ------- | ----------------- |
| Telegram   | ✅    | ✅        | ✅      | `partial` にマップ |
| Discord    | ✅    | ✅        | ✅      | `partial` にマップ |
| Slack      | ✅    | ✅        | ✅      | ✅                |
| Mattermost | ✅    | ✅        | ✅      | ✅                |

Slack専用:

- `channels.slack.streaming.nativeTransport` は、`channels.slack.streaming.mode="partial"` のときにSlackネイティブストリーミングAPI呼び出しを切り替えます（デフォルト: `true`）。
- SlackネイティブストリーミングとSlackアシスタントスレッドステータスには返信スレッドターゲットが必要です。トップレベルDMでは、そのスレッド形式のプレビューは表示されません。

レガシーキー移行:

- Telegram: `streamMode` + 真偽値 `streaming` は `streaming` enum に自動移行されます。
- Discord: `streamMode` + 真偽値 `streaming` は `streaming` enum に自動移行されます。
- Slack: `streamMode` は `streaming.mode` に自動移行され、真偽値 `streaming` は `streaming.mode` と `streaming.nativeTransport` に自動移行され、レガシーの `nativeStreaming` は `streaming.nativeTransport` に自動移行されます。

### ランタイム動作

Telegram:

- DMおよびグループ/トピック全体で `sendMessage` + `editMessageText` プレビュー更新を使います。
- Telegramのブロックストリーミングが明示的に有効な場合、プレビューストリーミングはスキップされます（重複ストリーミングを避けるため）。
- `/reasoning stream` はプレビューにreasoningを書き込めます。

Discord:

- 送信 + 編集によるプレビューメッセージを使います。
- `block` モードでは `draftChunk` によるチャンク化を使います。
- Discordのブロックストリーミングが明示的に有効な場合、プレビューストリーミングはスキップされます。
- 最終メディア、エラー、明示的返信ペイロードは、新しいドラフトをフラッシュせずに保留中プレビューをキャンセルし、その後通常配信を使います。

Slack:

- `partial` は、利用可能な場合にSlackネイティブストリーミング（`chat.startStream`/`append`/`stop`）を使えます。
- `block` は追記形式のドラフトプレビューを使います。
- `progress` はステータスプレビューテキストを使い、その後最終回答を表示します。
- 最終メディア/エラーペイロードとprogress finalは、使い捨てドラフトメッセージを作成しません。プレビューを編集できるテキスト/ブロックfinalだけが、保留中のドラフトテキストをフラッシュします。

Mattermost:

- thinking、ツールアクティビティ、部分返信テキストを単一のドラフトプレビューポストにストリームし、最終回答を安全に送信できる時点でその場で確定します。
- 確定時にプレビューポストが削除されている、または利用できない場合は、新しい最終ポスト送信にフォールバックします。
- 最終メディア/エラーペイロードは、一時的なプレビューポストをフラッシュする代わりに、通常配信の前に保留中プレビュー更新をキャンセルします。

Matrix:

- 最終テキストがプレビューイベントを再利用できる場合、ドラフトプレビューはその場で確定します。
- メディアのみ、エラー、返信ターゲット不一致のfinalは、通常配信の前に保留中プレビュー更新をキャンセルします。すでに表示されている古いプレビューはredactされます。

### ツール進捗のプレビュー更新

プレビューストリーミングには、**ツール進捗**更新も含められます。これは「ウェブを検索中」「ファイルを読んでいます」「ツールを呼び出しています」といった短いステータス行で、ツール実行中に同じプレビューメッセージ内へ最終返信より先に表示されます。これにより、複数段階のツールターンが、最初のthinkingプレビューから最終回答までの間に無言にならず、視覚的に生きた状態になります。

対応している画面:

- **Discord**、**Slack**、**Telegram** はツール進捗をライブプレビュー編集にストリームします。
- **Mattermost** はすでにツールアクティビティを単一のドラフトプレビューポストへ統合しています（上記参照）。
- ツール進捗の編集は、現在アクティブなプレビューストリーミングモードに従います。プレビューストリーミングが `off` の場合、またはブロックストリーミングがそのメッセージを引き継いでいる場合はスキップされます。

## 関連

- [Messages](/ja-JP/concepts/messages) — メッセージライフサイクルと配信
- [Retry](/ja-JP/concepts/retry) — 配信失敗時のリトライ動作
- [Channels](/ja-JP/channels) — チャンネルごとのストリーミング対応
