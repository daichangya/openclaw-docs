---
read_when:
    - OpenClaw で ElevenLabs の text-to-speech を使いたい場合
    - 音声添付ファイルに ElevenLabs Scribe speech-to-text を使いたい場合
    - Voice Call に ElevenLabs の realtime transcription を使いたい場合
summary: OpenClaw で ElevenLabs の speech、Scribe STT、Realtime transcription を使う
title: ElevenLabs
x-i18n:
    generated_at: "2026-04-25T13:57:09Z"
    model: gpt-5.4
    provider: openai
    source_hash: 1f858a344228c6355cd5fdc3775cddac39e0075f2e9fcf7683271f11be03a31a
    source_path: providers/elevenlabs.md
    workflow: 15
---

OpenClaw は、text-to-speech、Scribe
v2 によるバッチ speech-to-text、そして Scribe v2 Realtime による Voice Call ストリーミング STT に ElevenLabs を使います。

| Capability               | OpenClaw 画面                                   | デフォルト                 |
| ------------------------ | ----------------------------------------------- | -------------------------- |
| Text-to-speech           | `messages.tts` / `talk`                         | `eleven_multilingual_v2`   |
| Batch speech-to-text     | `tools.media.audio`                             | `scribe_v2`                |
| Streaming speech-to-text | Voice Call `streaming.provider: "elevenlabs"`   | `scribe_v2_realtime`       |

## 認証

環境変数に `ELEVENLABS_API_KEY` を設定してください。既存の ElevenLabs ツールとの
互換性のため、`XI_API_KEY` も受け付けられます。

```bash
export ELEVENLABS_API_KEY="..."
```

## Text-to-speech

```json5
{
  messages: {
    tts: {
      providers: {
        elevenlabs: {
          apiKey: "${ELEVENLABS_API_KEY}",
          voiceId: "pMsXgVXv3BLzUgSXRplE",
          modelId: "eleven_multilingual_v2",
        },
      },
    },
  },
}
```

ElevenLabs v3 TTS を使うには `modelId` を `eleven_v3` に設定してください。OpenClaw は既存インストール向けのデフォルトとして
`eleven_multilingual_v2` を維持しています。

## Speech-to-text

受信音声添付ファイルや短い録音音声セグメントには Scribe v2 を使います。

```json5
{
  tools: {
    media: {
      audio: {
        enabled: true,
        models: [{ provider: "elevenlabs", model: "scribe_v2" }],
      },
    },
  },
}
```

OpenClaw は multipart 音声を ElevenLabs の `/v1/speech-to-text` に
`model_id: "scribe_v2"` 付きで送信します。言語ヒントがある場合は `language_code` にマッピングされます。

## Voice Call ストリーミング STT

バンドルされた `elevenlabs` Plugin は、Voice Call
ストリーミング文字起こし用に Scribe v2 Realtime を登録します。

| Setting         | Config path                                                               | デフォルト                                          |
| --------------- | ------------------------------------------------------------------------- | --------------------------------------------------- |
| API key         | `plugins.entries.voice-call.config.streaming.providers.elevenlabs.apiKey` | `ELEVENLABS_API_KEY` / `XI_API_KEY` にフォールバック |
| Model           | `...elevenlabs.modelId`                                                   | `scribe_v2_realtime`                                |
| Audio format    | `...elevenlabs.audioFormat`                                               | `ulaw_8000`                                         |
| Sample rate     | `...elevenlabs.sampleRate`                                                | `8000`                                              |
| Commit strategy | `...elevenlabs.commitStrategy`                                            | `vad`                                               |
| Language        | `...elevenlabs.languageCode`                                              | （未設定）                                          |

```json5
{
  plugins: {
    entries: {
      "voice-call": {
        config: {
          streaming: {
            enabled: true,
            provider: "elevenlabs",
            providers: {
              elevenlabs: {
                apiKey: "${ELEVENLABS_API_KEY}",
                audioFormat: "ulaw_8000",
                commitStrategy: "vad",
                languageCode: "en",
              },
            },
          },
        },
      },
    },
  },
}
```

<Note>
Voice Call は、Twilio メディアを 8 kHz G.711 u-law として受信します。ElevenLabs の realtime
provider はデフォルトで `ulaw_8000` を使うため、電話音声フレームは
トランスコードなしで転送できます。
</Note>

## 関連

- [Text-to-speech](/ja-JP/tools/tts)
- [Model selection](/ja-JP/concepts/model-providers)
