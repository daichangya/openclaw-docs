---
read_when:
    - タイピングインジケーターの動作またはデフォルトを変更する
summary: OpenClawがタイピングインジケーターを表示するタイミングと、その調整方法
title: タイピングインジケーター
x-i18n:
    generated_at: "2026-04-23T04:44:52Z"
    model: gpt-5.4
    provider: openai
    source_hash: 2e7e8ca448b6706b6f53fcb6a582be6d4a84715c82dfde3d53abe4268af3ae0d
    source_path: concepts/typing-indicators.md
    workflow: 15
---

# タイピングインジケーター

タイピングインジケーターは、実行がアクティブな間、チャットチャネルに送信されます。
`agents.defaults.typingMode` を使って、タイピングを**いつ**開始するかを制御し、
`typingIntervalSeconds` を使って、**どのくらいの頻度で**更新するかを制御します。

## デフォルト

`agents.defaults.typingMode` が**未設定**の場合、OpenClaw は従来の動作を維持します。

- **ダイレクトチャット**: モデルループが始まるとすぐにタイピングを開始します。
- **メンションありのグループチャット**: すぐにタイピングを開始します。
- **メンションなしのグループチャット**: メッセージテキストのストリーミングが始まった時点でのみタイピングを開始します。
- **Heartbeat 実行**: 解決された Heartbeat ターゲットがタイピング可能なチャットであり、かつタイピングが無効化されていない場合、Heartbeat 実行の開始時にタイピングを開始します。

## モード

`agents.defaults.typingMode` を次のいずれかに設定します。

- `never` — タイピングインジケーターを一切表示しません。
- `instant` — **モデルループが始まるとすぐに**タイピングを開始します。後からその実行が無音応答トークンだけを返す場合でも開始します。
- `thinking` — **最初の reasoning 差分**でタイピングを開始します（この実行で `reasoningLevel: "stream"` が必要です）。
- `message` — **最初の非無音テキスト差分**でタイピングを開始します（`NO_REPLY` 無音トークンは無視します）。

「どれだけ早く発火するか」の順序:
`never` → `message` → `thinking` → `instant`

## 設定

```json5
{
  agent: {
    typingMode: "thinking",
    typingIntervalSeconds: 6,
  },
}
```

セッションごとにモードまたは間隔を上書きできます。

```json5
{
  session: {
    typingMode: "message",
    typingIntervalSeconds: 4,
  },
}
```

## 注意点

- `message` モードでは、ペイロード全体が完全に無音トークンである場合（たとえば `NO_REPLY` / `no_reply`。大文字小文字は区別されません）、無音専用の応答に対してタイピングは表示されません。
- `thinking` は、実行が reasoning をストリーミングする場合にのみ発火します（`reasoningLevel: "stream"`）。モデルが reasoning 差分を出力しない場合、タイピングは開始されません。
- Heartbeat のタイピングは、解決された配信ターゲットに対する生存シグナルです。`message` または `thinking` のストリームタイミングには従わず、Heartbeat 実行の開始時に始まります。無効化するには `typingMode: "never"` を設定してください。
- `target: "none"` の場合、ターゲットを解決できない場合、Heartbeat のチャット配信が無効な場合、またはチャネルがタイピングをサポートしていない場合、Heartbeat はタイピングを表示しません。
- `typingIntervalSeconds` は**更新間隔**を制御するものであり、開始時刻を制御するものではありません。デフォルトは6秒です。
