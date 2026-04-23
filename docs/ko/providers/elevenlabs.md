---
read_when:
    - OpenClaw에서 ElevenLabs text-to-speech를 사용하려고 합니다.
    - 오디오 첨부 파일에 ElevenLabs Scribe speech-to-text를 사용하려고 합니다.
    - Voice Call에 ElevenLabs 실시간 전사를 사용하려고 합니다.
summary: ElevenLabs 음성, Scribe STT, 실시간 전사를 OpenClaw와 함께 사용하기
title: ElevenLabs
x-i18n:
    generated_at: "2026-04-23T06:07:14Z"
    model: gpt-5.4
    provider: openai
    source_hash: 62768d0b8a951548be2a5b293a766432f6345087ed145afc942134513dd9618c
    source_path: providers/elevenlabs.md
    workflow: 15
---

# ElevenLabs

OpenClaw는 text-to-speech, Scribe v2를 사용한 배치 speech-to-text, 그리고 Scribe v2 Realtime을 사용한 Voice Call 스트리밍 STT에 ElevenLabs를 사용합니다.

| 기능 | OpenClaw 표면 | 기본값 |
| ------------------------ | --------------------------------------------- | ------------------------ |
| Text-to-speech | `messages.tts` / `talk` | `eleven_multilingual_v2` |
| 배치 speech-to-text | `tools.media.audio` | `scribe_v2` |
| 스트리밍 speech-to-text | Voice Call `streaming.provider: "elevenlabs"` | `scribe_v2_realtime` |

## 인증

환경 변수에 `ELEVENLABS_API_KEY`를 설정하세요. 기존 ElevenLabs 도구와의 호환성을 위해 `XI_API_KEY`도 허용됩니다.

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

## Speech-to-text

수신 오디오 첨부 파일과 짧게 녹음된 음성 구간에는 Scribe v2를 사용하세요.

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

OpenClaw는 멀티파트 오디오를 `model_id: "scribe_v2"`와 함께 ElevenLabs `/v1/speech-to-text`로 전송합니다. 언어 힌트가 있으면 `language_code`에 매핑됩니다.

## Voice Call 스트리밍 STT

bundled `elevenlabs` Plugin은 Voice Call 스트리밍 전사를 위해 Scribe v2 Realtime을 등록합니다.

| 설정 | config 경로 | 기본값 |
| --------------- | ------------------------------------------------------------------------- | ------------------------------------------------- |
| API 키 | `plugins.entries.voice-call.config.streaming.providers.elevenlabs.apiKey` | `ELEVENLABS_API_KEY` / `XI_API_KEY`로 대체 |
| 모델 | `...elevenlabs.modelId` | `scribe_v2_realtime` |
| 오디오 형식 | `...elevenlabs.audioFormat` | `ulaw_8000` |
| 샘플 레이트 | `...elevenlabs.sampleRate` | `8000` |
| 커밋 전략 | `...elevenlabs.commitStrategy` | `vad` |
| 언어 | `...elevenlabs.languageCode` | (설정되지 않음) |

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
Voice Call은 Twilio 미디어를 8 kHz G.711 u-law로 수신합니다. ElevenLabs 실시간 provider는 기본값이 `ulaw_8000`이므로, 전화 프레임을 트랜스코딩 없이 그대로 전달할 수 있습니다.
</Note>
