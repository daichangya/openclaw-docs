---
read_when:
    - 音声添付ファイルにDeepgramのspeech-to-textを使いたい場合
    - Deepgramの簡単な設定例が必要な場合
summary: 受信した音声メモ向けのDeepgram文字起こし
title: Deepgram
x-i18n:
    generated_at: "2026-04-05T12:53:25Z"
    model: gpt-5.4
    provider: openai
    source_hash: dabd1f6942c339fbd744fbf38040b6a663b06ddf4d9c9ee31e3ac034de9e79d9
    source_path: providers/deepgram.md
    workflow: 15
---

# Deepgram（音声文字起こし）

Deepgramはspeech-to-text APIです。OpenClawでは、`tools.media.audio` 経由の**受信音声/ボイスメモの文字起こし**に使用されます。

有効にすると、OpenClawは音声ファイルをDeepgramへアップロードし、その文字起こし結果を
返信パイプラインに注入します（`{{Transcript}}` + `[Audio]` ブロック）。これは**ストリーミングではなく**、
録音済み音声向けの文字起こしエンドポイントを使用します。

Website: [https://deepgram.com](https://deepgram.com)  
Docs: [https://developers.deepgram.com](https://developers.deepgram.com)

## クイックスタート

1. API keyを設定します:

```
DEEPGRAM_API_KEY=dg_...
```

2. providerを有効にします:

```json5
{
  tools: {
    media: {
      audio: {
        enabled: true,
        models: [{ provider: "deepgram", model: "nova-3" }],
      },
    },
  },
}
```

## オプション

- `model`: Deepgram model id（デフォルト: `nova-3`）
- `language`: 言語ヒント（任意）
- `tools.media.audio.providerOptions.deepgram.detect_language`: 言語検出を有効にする（任意）
- `tools.media.audio.providerOptions.deepgram.punctuate`: 句読点を有効にする（任意）
- `tools.media.audio.providerOptions.deepgram.smart_format`: スマート整形を有効にする（任意）

言語指定の例:

```json5
{
  tools: {
    media: {
      audio: {
        enabled: true,
        models: [{ provider: "deepgram", model: "nova-3", language: "en" }],
      },
    },
  },
}
```

Deepgramオプション付きの例:

```json5
{
  tools: {
    media: {
      audio: {
        enabled: true,
        providerOptions: {
          deepgram: {
            detect_language: true,
            punctuate: true,
            smart_format: true,
          },
        },
        models: [{ provider: "deepgram", model: "nova-3" }],
      },
    },
  },
}
```

## 注意

- 認証は標準のprovider auth順序に従います。最も簡単なのは `DEEPGRAM_API_KEY` です。
- proxyを使用する場合は、`tools.media.audio.baseUrl` と `tools.media.audio.headers` でendpointまたはheadersを上書きできます。
- 出力は他のproviderと同じ音声ルールに従います（サイズ上限、タイムアウト、文字起こしの注入）。
