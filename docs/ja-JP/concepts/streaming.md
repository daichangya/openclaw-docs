---
read_when:
    - channelでストリーミングやチャンク分割がどのように動作するかを説明すること
    - ブロックストリーミングやchannelのチャンク分割動作を変更すること
    - 重複した早すぎるブロック返信やchannelプレビューのストリーミングをデバッグすること
summary: ストリーミングとチャンク分割の動作（ブロック返信、channelプレビューのストリーミング、モード対応表）
title: ストリーミングとチャンク分割
x-i18n:
    generated_at: "2026-04-25T13:46:08Z"
    model: gpt-5.4
    provider: openai
    source_hash: ba308b79b12886f3a1bc36bc277e3df0e2b9c6018aa260b432ccea89a235819f
    source_path: concepts/streaming.md
    workflow: 15
---

OpenClawには、別々の2つのストリーミング層があります。

- **ブロックストリーミング（channels）:** assistantが書き進めるにつれて、完了した**ブロック**を送信します。これらは通常のchannelメッセージです（token deltaではありません）。
- **プレビューストリーミング（Telegram/Discord/Slack）:** 生成中に一時的な**プレビューメッセージ**を更新します。

現時点では、channelメッセージへの**真のtoken-deltaストリーミング**はありません。プレビューストリーミングはメッセージベースです（送信 + 編集/追記）。

## ブロックストリーミング（channelメッセージ）

ブロックストリーミングは、assistantの出力を利用可能になったタイミングで大まかなチャンクとして送信します。

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

- `text_delta/events`: モデルのストリームイベント（ストリーミング非対応モデルでは疎になる場合があります）。
- `chunker`: `EmbeddedBlockChunker`が最小/最大境界 + 区切り優先順位を適用したもの。
- `channel send`: 実際の送信メッセージ（ブロック返信）。

**制御項目:**

- `agents.defaults.blockStreamingDefault`: `"on"`/`"off"`（デフォルトはoff）。
- Channel上書き: channelごとに`"on"`/`"off"`を強制する`*.blockStreaming`（およびアカウントごとの派生設定）。
- `agents.defaults.blockStreamingBreak`: `"text_end"`または`"message_end"`。
- `agents.defaults.blockStreamingChunk`: `{ minChars, maxChars, breakPreference? }`。
- `agents.defaults.blockStreamingCoalesce`: `{ minChars?, maxChars?, idleMs? }`（送信前にストリーミングされたブロックをマージ）。
- Channelのハード上限: `*.textChunkLimit`（例: `channels.whatsapp.textChunkLimit`）。
- Channelのchunk mode: `*.chunkMode`（デフォルトは`length`、`newline`は長さによる分割の前に空行単位（段落境界）で分割）。
- Discordのソフト上限: `channels.discord.maxLinesPerMessage`（デフォルト17）。UIの切り詰めを避けるため、縦長の返信を分割します。

**境界セマンティクス:**

- `text_end`: chunkerが出力したらすぐにブロックをストリームし、各`text_end`でflushします。
- `message_end`: assistantメッセージが完了するまで待ち、その後にバッファ済み出力をflushします。

`message_end`でも、バッファ済みテキストが`maxChars`を超える場合はchunkerを使用するため、最後に複数チャンクを送ることがあります。

### ブロックストリーミング時のメディア配信

`MEDIA:`ディレクティブは通常の配信メタデータです。ブロックストリーミングがメディアブロックを早めに送信した場合、OpenClawはそのターンのその配信を記録します。最終assistant payloadが同じメディアURLを繰り返した場合、最終配信では重複メディアを削除し、添付ファイルを再送しません。

完全に同一の最終payloadは抑制されます。最終payloadが、すでにストリーム済みのメディアの前後に別のテキストを追加している場合、OpenClawはメディアを単一配信のまま維持しつつ、その新しいテキストを送信します。これにより、agentがストリーミング中に`MEDIA:`を出力し、providerも完成した返信にそれを含めた場合でも、Telegramのようなchannelで音声メモやファイルが重複するのを防ぎます。

## チャンク分割アルゴリズム（低/高境界）

ブロックのチャンク分割は`EmbeddedBlockChunker`で実装されています。

- **低境界:** バッファが`minChars`以上になるまで送信しません（強制時を除く）。
- **高境界:** `maxChars`前での分割を優先し、強制時は`maxChars`で分割します。
- **区切り優先順位:** `paragraph` → `newline` → `sentence` → `whitespace` → 強制区切り。
- **コードフェンス:** フェンス内では決して分割しません。`maxChars`で強制分割する場合は、Markdownの妥当性を保つためにフェンスを閉じて再度開きます。

`maxChars`はchannelの`textChunkLimit`にクランプされるため、channelごとの上限を超えることはできません。

## Coalescing（ストリーミングされたブロックのマージ）

ブロックストリーミングが有効なとき、OpenClawは送信前に**連続するブロックチャンクをマージ**できます。これにより、段階的な出力を維持しつつ、「1行だけのスパム」を減らせます。

- Coalescingは、flush前に**アイドルギャップ**（`idleMs`）を待ちます。
- バッファは`maxChars`で上限管理され、それを超えるとflushされます。
- `minChars`は、十分なテキストがたまるまで小さすぎる断片の送信を防ぎます（最終flushでは残りテキストを常に送信）。
- Joinerは`blockStreamingChunk.breakPreference`から導出されます（`paragraph` → `\n\n`、`newline` → `\n`、`sentence` → 半角スペース）。
- Channel上書きは`*.blockStreamingCoalesce`でも利用できます（アカウントごとの設定を含む）。
- デフォルトのcoalesce `minChars`は、Signal/Slack/Discordでは上書きされない限り1500に引き上げられます。

## ブロック間の人間らしいペーシング

ブロックストリーミングが有効なとき、ブロック返信の間に**ランダム化された一時停止**を追加できます（最初のブロックの後）。これにより、複数バブルの返信がより自然に感じられます。

- Config: `agents.defaults.humanDelay`（agentごとの上書きは`agents.list[].humanDelay`）。
- モード: `off`（デフォルト）、`natural`（800–2500ms）、`custom`（`minMs`/`maxMs`）。
- 適用されるのは**ブロック返信**のみで、最終返信やツール要約には適用されません。

## 「チャンクでストリームする」か「最後にまとめて送る」か

これは次のように対応します。

- **チャンクでストリームする:** `blockStreamingDefault: "on"` + `blockStreamingBreak: "text_end"`（生成しながら送信）。Telegram以外のchannelでは、さらに`*.blockStreaming: true`も必要です。
- **最後にまとめてストリームする:** `blockStreamingBreak: "message_end"`（最後に1回flush。非常に長い場合は複数チャンクになることがあります）。
- **ブロックストリーミングなし:** `blockStreamingDefault: "off"`（最終返信のみ）。

**Channelに関する注記:** ブロックストリーミングは、`*.blockStreaming`が明示的に`true`に設定されていない限り**off**です。channelは、ブロック返信なしでライブプレビュー（`channels.<channel>.streaming`）をストリームできます。

config配置の注意: `blockStreaming*`のデフォルトは、ルートconfigではなく`agents.defaults`配下にあります。

## プレビューストリーミングモード

正式なキー: `channels.<channel>.streaming`

モード:

- `off`: プレビューストリーミングを無効化。
- `partial`: 単一のプレビューを最新テキストで置き換えます。
- `block`: チャンク単位/追記単位でプレビューを更新します。
- `progress`: 生成中に進捗/ステータスのプレビューを表示し、完了時に最終回答を送ります。

### Channel対応表

| Channel | `off` | `partial` | `block` | `progress` |
| ---------- | ----- | --------- | ------- | ----------------- |
| Telegram | ✅ | ✅ | ✅ | `partial`に対応付け |
| Discord | ✅ | ✅ | ✅ | `partial`に対応付け |
| Slack | ✅ | ✅ | ✅ | ✅ |
| Mattermost | ✅ | ✅ | ✅ | ✅ |

Slack専用:

- `channels.slack.streaming.nativeTransport`は、`channels.slack.streaming.mode="partial"`のときにSlackネイティブストリーミングAPI呼び出しを切り替えます（デフォルト: `true`）。
- SlackネイティブストリーミングとSlack assistant thread statusには返信スレッドターゲットが必要です。トップレベルDMではそのスレッド形式プレビューは表示されません。

従来キーの移行:

- Telegram: 従来の`streamMode`とスカラー/booleanの`streaming`値は検出され、doctor/config互換パスによって`streaming.mode`へ移行されます。
- Discord: `streamMode` + boolean `streaming`は自動的に`streaming` enumへ移行されます。
- Slack: `streamMode`は自動的に`streaming.mode`へ移行され、boolean `streaming`は`streaming.mode` + `streaming.nativeTransport`へ自動移行され、従来の`nativeStreaming`は`streaming.nativeTransport`へ自動移行されます。

### 実行時の動作

Telegram:

- DMおよびグループ/トピック全体で、`sendMessage` + `editMessageText`によるプレビュー更新を使用します。
- Telegramのブロックストリーミングが明示的に有効な場合、プレビューストリーミングはスキップされます（重複ストリーミングを避けるため）。
- `/reasoning stream`は、reasoningをプレビューへ書き込めます。

Discord:

- 送信 + 編集のプレビューメッセージを使用します。
- `block`モードではドラフトのチャンク分割（`draftChunk`）を使用します。
- Discordのブロックストリーミングが明示的に有効な場合、プレビューストリーミングはスキップされます。
- 最終メディア、エラー、明示的返信payloadは、保留中のプレビューを新しいドラフトとしてflushせずにキャンセルし、その後通常配信を使用します。

Slack:

- `partial`は、利用可能であればSlackネイティブストリーミング（`chat.startStream`/`append`/`stop`）を使用できます。
- `block`は追記型のドラフトプレビューを使用します。
- `progress`はステータスプレビューテキストを使用し、その後に最終回答を送ります。
- ネイティブとドラフトのプレビューストリーミングは、そのターンのブロック返信を抑制するため、Slack返信は1つの配信経路だけでストリームされます。
- 最終メディア/エラーpayloadとprogress finalは使い捨てドラフトメッセージを作成しません。プレビューを編集できるテキスト/ブロックfinalだけが、保留中のドラフトテキストをflushします。

Mattermost:

- thinking、ツールアクティビティ、部分返信テキストを単一のドラフトプレビューポストへストリームし、最終回答を安全に送信できる時点でその場で確定します。
- プレビューポストが削除された、または確定時に利用できない場合は、新しい最終ポスト送信にフォールバックします。
- 最終メディア/エラーpayloadは、一時的なプレビューポストをflushする代わりに、通常配信の前に保留中のプレビュー更新をキャンセルします。

Matrix:

- 最終テキストがプレビューイベントを再利用できる場合、ドラフトプレビューはその場で確定されます。
- メディアのみ、エラー、および返信先不一致のfinalは、通常配信の前に保留中のプレビュー更新をキャンセルします。すでに表示されている古いプレビューはredactされます。

### ツール進捗プレビュー更新

プレビューストリーミングには、**ツール進捗**更新も含められます。これは「webを検索中」「ファイルを読み取り中」「ツールを呼び出し中」のような短いステータス行で、ツール実行中に最終返信に先立って同じプレビューメッセージ内へ表示されます。これにより、複数段階のツールターンが、最初のthinkingプレビューから最終回答までの間に無音にならず、視覚的に進行しているように見えます。

対応するsurface:

- **Discord**、**Slack**、**Telegram**では、プレビューストリーミングが有効なとき、デフォルトでツール進捗をライブプレビュー編集へストリームします。
- Telegramでは、ツール進捗プレビュー更新は`v2026.4.22`以降有効化された状態で出荷されており、有効のままにすることでそのリリース済み動作を維持できます。
- **Mattermost**は、すでにツールアクティビティを単一のドラフトプレビューポストへ統合します（上記参照）。
- ツール進捗の編集は、現在有効なプレビューストリーミングモードに従います。プレビューストリーミングが`off`のとき、またはブロックストリーミングがそのメッセージを引き継いだときはスキップされます。
- プレビューストリーミングは維持しつつツール進捗行を隠したい場合は、そのchannelで`streaming.preview.toolProgress`を`false`に設定してください。プレビュー編集自体を無効にするには、`streaming.mode`を`off`に設定してください。

例:

```json
{
  "channels": {
    "telegram": {
      "streaming": {
        "mode": "partial",
        "preview": {
          "toolProgress": false
        }
      }
    }
  }
}
```

## 関連

- [Messages](/ja-JP/concepts/messages) — メッセージライフサイクルと配信
- [Retry](/ja-JP/concepts/retry) — 配信失敗時のリトライ動作
- [Channels](/ja-JP/channels) — channelごとのストリーミングサポート
