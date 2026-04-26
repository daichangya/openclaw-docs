---
read_when:
    - Control UI でのアシスタント出力レンダリングの変更
    - '`[embed ...]`、`MEDIA:`、reply、または audio presentation directives のデバッグ'
summary: 埋め込み、メディア、音声ヒント、返信のためのリッチ出力ショートコードプロトコル
title: リッチ出力プロトコル
x-i18n:
    generated_at: "2026-04-26T11:39:55Z"
    model: gpt-5.4
    provider: openai
    source_hash: 3c62e41073196c2ff4867230af55469786fcfb29414f5cc5b7d38f6b1ffc3718
    source_path: reference/rich-output-protocol.md
    workflow: 15
---

アシスタント出力には、配信・レンダリング用の少数のディレクティブを含めることができます。

- 添付ファイル配信用の `MEDIA:`
- 音声表示ヒント用の `[[audio_as_voice]]`
- 返信メタデータ用の `[[reply_to_current]]` / `[[reply_to:<id>]]`
- Control UI のリッチレンダリング用の `[embed ...]`

リモートの `MEDIA:` 添付ファイルは公開された `https:` URL である必要があります。通常の `http:`、loopback、link-local、プライベート、および内部ホスト名は、添付ファイルディレクティブとしては無視されます。サーバー側のメディアフェッチャーでは、引き続き独自のネットワークガードが適用されます。

これらのディレクティブはそれぞれ独立しています。`MEDIA:` と reply/voice タグは引き続き配信メタデータであり、`[embed ...]` は Web 専用のリッチレンダリング経路です。
信頼されたツール結果メディアでも、配信前に同じ `MEDIA:` / `[[audio_as_voice]]` パーサーが使われるため、テキストのツール出力でも音声添付をボイスノートとしてマークできます。

ブロックストリーミングが有効な場合、`MEDIA:` は引き続き 1 ターンにつき 1 回だけの配信メタデータです。同じメディア URL がストリーミングされたブロック内で送られ、最終的なアシスタント payload でも繰り返された場合、OpenClaw は添付ファイルを 1 回だけ配信し、最終 payload から重複分を削除します。

## `[embed ...]`

`[embed ...]` は、Control UI 向けの唯一の agent-facing リッチレンダリング構文です。

自己終了の例:

```text
[embed ref="cv_123" title="Status" /]
```

ルール:

- `[view ...]` は新しい出力では有効ではありません。
- Embed ショートコードは、アシスタントメッセージサーフェス内でのみレンダリングされます。
- URL ベースの埋め込みのみがレンダリングされます。`ref="..."` または `url="..."` を使用してください。
- ブロック形式のインライン HTML 埋め込みショートコードはレンダリングされません。
- Web UI は表示テキストからショートコードを取り除き、埋め込みをインラインでレンダリングします。
- `MEDIA:` は embed の別名ではないため、リッチな埋め込みレンダリングには使用しないでください。

## 保存されるレンダリング形状

正規化・保存されるアシスタント content ブロックは、構造化された `canvas` アイテムです。

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

保存・レンダリングされるリッチブロックでは、この `canvas` 形状が直接使われます。`present_view` は認識されません。

## 関連

- [RPC adapters](/ja-JP/reference/rpc)
- [Typebox](/ja-JP/concepts/typebox)
