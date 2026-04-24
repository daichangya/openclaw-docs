---
read_when:
    - OpenClaw에서 ElevenLabs text-to-speech를 사용하고 싶습니다
    - 오디오 첨부 파일에 ElevenLabs Scribe speech-to-text를 사용하고 싶습니다
    - Voice Call에 ElevenLabs 실시간 전사를 사용하고 싶습니다
summary: OpenClaw에서 ElevenLabs 음성, Scribe STT, 실시간 전사 사용하기
title: ElevenLabs
x-i18n:
    generated_at: "2026-04-24T06:30:36Z"
    model: gpt-5.4
    provider: openai
    source_hash: cdf86afb839cf90c8caf73a194cb6eae0078661d3ab586d63b9e1276c845e7f7
    source_path: providers/elevenlabs.md
    workflow: 15
---

OpenClaw는 ElevenLabs를 텍스트 음성 변환, Scribe
v2를 사용한 배치 speech-to-text, Scribe v2 Realtime을 사용한 Voice Call 스트리밍 STT에 사용합니다.

| Capability               | OpenClaw 표면                                   | 기본값                   |
| ------------------------ | ----------------------------------------------- | ------------------------ |
| 텍스트 음성 변환         | `messages.tts` / `talk`                         | `eleven_multilingual_v2` |
| 배치 speech-to-text      | `tools.media.audio`                             | `scribe_v2`              |
| 스트리밍 speech-to-text  | Voice Call `streaming.provider: "elevenlabs"`   | `scribe_v2_realtime`     |

## 인증

환경에 `ELEVENLABS_API_KEY`를 설정하세요. 기존 ElevenLabs 도구와의 호환성을 위해 `XI_API_KEY`도 허용됩니다.

```bash
export ELEVENLABS_API_KEY="..."
```

## 텍스트 음성 변환

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

수신 오디오 첨부 파일과 짧게 녹음된 음성 구간에는 Scribe v2를 사용하세요:

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

OpenClaw는 멀티파트 오디오를 `model_id: "scribe_v2"`와 함께 ElevenLabs `/v1/speech-to-text`로 전송합니다. 언어 힌트가 있으면 `language_code`로 매핑됩니다.

## Voice Call 스트리밍 STT

번들된 `elevenlabs` Plugin은 Voice Call 스트리밍 전사용으로
Scribe v2 Realtime을 등록합니다.

| 설정            | 구성 경로                                                                | 기본값                                            |
| --------------- | ------------------------------------------------------------------------ | ------------------------------------------------- |
| API 키          | `plugins.entries.voice-call.config.streaming.providers.elevenlabs.apiKey` | `ELEVENLABS_API_KEY` / `XI_API_KEY`로 폴백        |
| 모델            | `...elevenlabs.modelId`                                                  | `scribe_v2_realtime`                              |
| 오디오 형식     | `...elevenlabs.audioFormat`                                              | `ulaw_8000`                                       |
| 샘플링 레이트   | `...elevenlabs.sampleRate`                                               | `8000`                                            |
| 커밋 전략       | `...elevenlabs.commitStrategy`                                           | `vad`                                             |
| 언어            | `...elevenlabs.languageCode`                                             | (설정 안 됨)                                      |

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
Voice Call은 Twilio 미디어를 8 kHz G.711 u-law로 받습니다. ElevenLabs 실시간
provider의 기본값이 `ulaw_8000`이므로, 전화 프레임을
트랜스코딩 없이 전달할 수 있습니다.
</Note>

## 관련

- [텍스트 음성 변환](/ko/tools/tts)
- [모델 선택](/ko/concepts/model-providers)
