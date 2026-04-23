---
read_when:
    - OpenClaw で ElevenLabs のテキスト読み上げを使いたい場合
    - 音声添付ファイルに ElevenLabs Scribe speech-to-text を使いたい場合
    - Voice Call に ElevenLabs のリアルタイム文字起こしを使いたい場合
summary: OpenClawでElevenLabs音声、Scribe STT、リアルタイム文字起こしを使用する
title: ElevenLabs
x-i18n:
    generated_at: "2026-04-23T04:50:03Z"
    model: gpt-5.4
    provider: openai
    source_hash: 62768d0b8a951548be2a5b293a766432f6345087ed145afc942134513dd9618c
    source_path: providers/elevenlabs.md
    workflow: 15
---

# ElevenLabs

OpenClaw は、テキスト読み上げ、Scribe
v2 を使ったバッチ speech-to-text、および Scribe v2 Realtime を使った Voice Call のストリーミング STT に ElevenLabs を使用します。

| 機能 | OpenClaw surface | デフォルト |
| ------------------------ | --------------------------------------------- | ------------------------ |
| テキスト読み上げ | `messages.tts` / `talk` | `eleven_multilingual_v2` |
| バッチ speech-to-text | `tools.media.audio` | `scribe_v2` |
| ストリーミング speech-to-text | Voice Call `streaming.provider: "elevenlabs"` | `scribe_v2_realtime` |

## 認証

環境変数に `ELEVENLABS_API_KEY` を設定します。既存の ElevenLabs ツールとの
互換性のため、`XI_API_KEY` も受け付けられます。

```bash
export ELEVENLABS_API_KEY="..."
```

## テキスト読み上げ

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

## Speech-to-text

受信した音声添付ファイルと短い録音済み音声セグメントには Scribe v2 を使用します。

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

OpenClaw は、`model_id: "scribe_v2"` を付けて multipart 音声を ElevenLabs の `/v1/speech-to-text` に送信します。
言語ヒントがある場合は `language_code` にマッピングされます。

## Voice Call ストリーミング STT

バンドルされた `elevenlabs` plugin は、Voice Call の
ストリーミング文字起こし用に Scribe v2 Realtime を登録します。

| 設定 | 設定パス | デフォルト |
| --------------- | ------------------------------------------------------------------------- | ------------------------------------------------- |
| API キー | `plugins.entries.voice-call.config.streaming.providers.elevenlabs.apiKey` | `ELEVENLABS_API_KEY` / `XI_API_KEY` にフォールバック |
| モデル | `...elevenlabs.modelId` | `scribe_v2_realtime` |
| 音声形式 | `...elevenlabs.audioFormat` | `ulaw_8000` |
| サンプルレート | `...elevenlabs.sampleRate` | `8000` |
| commit 戦略 | `...elevenlabs.commitStrategy` | `vad` |
| 言語 | `...elevenlabs.languageCode` | （未設定） |

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
Voice Call は Twilio メディアを 8 kHz G.711 u-law として受信します。ElevenLabs の realtime
provider はデフォルトで `ulaw_8000` を使用するため、電話フレームを
トランスコードなしで転送できます。
</Note>
