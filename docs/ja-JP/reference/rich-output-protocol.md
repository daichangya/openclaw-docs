---
read_when:
    - Control UI での assistant 出力レンダリングを変更する
    - '`[embed ...]`、`MEDIA:`、reply、または音声プレゼンテーションディレクティブをデバッグする'
summary: embed、メディア、音声ヒント、返信のためのリッチ出力 shortcode プロトコル
title: リッチ出力プロトコル
x-i18n:
    generated_at: "2026-04-25T13:58:41Z"
    model: gpt-5.4
    provider: openai
    source_hash: 643d1594d05174abf984f06c76a675670968c42c7260e7b73821f346e3f683df
    source_path: reference/rich-output-protocol.md
    workflow: 15
---

assistant 出力には、小さな配信/レンダリング用ディレクティブセットを含めることができます。

- 添付ファイル配信用の `MEDIA:`
- 音声プレゼンテーションヒント用の `[[audio_as_voice]]`
- reply メタデータ用の `[[reply_to_current]]` / `[[reply_to:<id>]]`
- Control UI のリッチレンダリング用の `[embed ...]`

これらのディレクティブは別物です。`MEDIA:` と reply/voice タグは引き続き配信メタデータであり、`[embed ...]` は web 専用のリッチレンダリング経路です。

block ストリーミングが有効な場合でも、`MEDIA:` は 1
ターンあたり 1 回だけ配信されるメタデータのままです。同じメディア URL がストリーミング block で送信され、
最終 assistant ペイロードで繰り返された場合、OpenClaw は添付ファイルを 1 回だけ配信し、最終ペイロードから重複分を削除します。

## `[embed ...]`

`[embed ...]` は、Control UI 向けの agent 対応リッチレンダリング構文として唯一のものです。

自己終了形式の例:

```text
[embed ref="cv_123" title="Status" /]
```

ルール:

- `[view ...]` は新しい出力ではもはや有効ではありません。
- embed shortcode は assistant メッセージ画面でのみレンダリングされます。
- URL ベースの embed のみレンダリングされます。`ref="..."` または `url="..."` を使ってください。
- block 形式のインライン HTML embed shortcode はレンダリングされません。
- web UI は shortcode を可視テキストから取り除き、embed をインラインでレンダリングします。
- `MEDIA:` は embed の別名ではなく、リッチ embed レンダリングには使うべきではありません。

## 保存されるレンダリング形状

正規化/保存される assistant content block は、構造化された `canvas` item です。

```json
{
  "type": "canvas",
  "preview": {
    "kind": "canvas",
    "surface": "assistant_message",
    "render": "url",
    "viewId": "cv_123",
    "url": "/__openclaw__/canvas/documents/cv_123/index.html",
    "title": "Status",
    "preferredHeight": 320
  }
}
```

保存/レンダリングされるリッチ block は、この `canvas` 形状を直接使います。`present_view` は認識されません。

## 関連

- [RPC adapters](/ja-JP/reference/rpc)
- [Typebox](/ja-JP/concepts/typebox)
