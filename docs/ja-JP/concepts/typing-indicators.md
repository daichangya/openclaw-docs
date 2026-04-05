---
read_when:
    - 入力中インジケーターの動作やデフォルトを変更する場合
summary: OpenClaw が入力中インジケーターを表示するタイミングとその調整方法
title: 入力中インジケーター
x-i18n:
    generated_at: "2026-04-05T12:42:37Z"
    model: gpt-5.4
    provider: openai
    source_hash: 28c8c395a135fc0745181aab66a93582177e6acd0b3496debcbb98159a4f11dc
    source_path: concepts/typing-indicators.md
    workflow: 15
---

# 入力中インジケーター

入力中インジケーターは、実行がアクティブな間、チャットチャンネルに送信されます。開始する**タイミング**は
`agents.defaults.typingMode` で制御し、更新する**頻度**は `typingIntervalSeconds`
で制御します。

## デフォルト

`agents.defaults.typingMode` が**未設定**の場合、OpenClaw は従来の動作を維持します。

- **ダイレクトチャット**: モデルループが始まるとすぐに入力中を開始します。
- **メンション付きのグループチャット**: すぐに入力中を開始します。
- **メンションなしのグループチャット**: メッセージテキストのストリーミングが始まったときにのみ入力中を開始します。
- **ハートビート実行**: 入力中は無効です。

## モード

`agents.defaults.typingMode` を次のいずれかに設定します。

- `never` — 入力中インジケーターを一切表示しません。
- `instant` — 実行が後からサイレント返信トークンだけを返す場合でも、**モデルループが始まるとすぐに**入力中を開始します。
- `thinking` — **最初の推論デルタ**で入力中を開始します（その実行で
  `reasoningLevel: "stream"` が必要です）。
- `message` — **最初の非サイレントなテキストデルタ**で入力中を開始します（
  `NO_REPLY` のサイレントトークンは無視します）。

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

セッションごとにモードまたは頻度を上書きできます。

```json5
{
  session: {
    typingMode: "message",
    typingIntervalSeconds: 4,
  },
}
```

## 注意

- `message` モードでは、ペイロード全体が完全にサイレントトークンそのもの
  （たとえば `NO_REPLY` / `no_reply`。大文字小文字を区別せず一致）である場合、
  サイレントのみの返信に対して入力中は表示されません。
- `thinking` は、実行が推論をストリーミングする場合にのみ発火します（`reasoningLevel: "stream"`）。
  モデルが推論デルタを出力しない場合、入力中は開始されません。
- ハートビートでは、モードに関係なく入力中は表示されません。
- `typingIntervalSeconds` は**更新頻度**を制御するものであり、開始時刻ではありません。
  デフォルトは 6 秒です。
