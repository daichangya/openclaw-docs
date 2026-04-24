---
read_when:
    - 응답에 텍스트 음성 변환을 활성화하기
    - TTS provider 또는 제한 구성하기
    - '`/tts` 명령 사용하기'
summary: 아웃바운드 응답을 위한 텍스트 음성 변환(TTS)
title: 텍스트 음성 변환(TTS)
x-i18n:
    generated_at: "2026-04-24T06:42:51Z"
    model: gpt-5.4
    provider: openai
    source_hash: 935fec2325a08da6f4ecd8ba5a9b889cd265025c5c7ee43bc4e0da36c1003d8f
    source_path: tools/tts.md
    workflow: 15
---

OpenClaw는 ElevenLabs, Google Gemini, Microsoft, MiniMax, OpenAI, 또는 xAI를 사용해 아웃바운드 응답을 오디오로 변환할 수 있습니다.
OpenClaw가 오디오를 보낼 수 있는 곳이라면 어디서나 동작합니다.

## 지원 서비스

- **ElevenLabs** (기본 또는 폴백 provider)
- **Google Gemini** (기본 또는 폴백 provider; Gemini API TTS 사용)
- **Microsoft** (기본 또는 폴백 provider; 현재 번들 구현은 `node-edge-tts` 사용)
- **MiniMax** (기본 또는 폴백 provider; T2A v2 API 사용)
- **OpenAI** (기본 또는 폴백 provider; 요약에도 사용됨)
- **xAI** (기본 또는 폴백 provider; xAI TTS API 사용)

### Microsoft speech 참고 사항

번들된 Microsoft speech provider는 현재 `node-edge-tts` 라이브러리를 통해 Microsoft Edge의 온라인
neural TTS 서비스를 사용합니다. 이는 로컬이 아닌 호스팅 서비스이며,
Microsoft 엔드포인트를 사용하고 API 키가 필요하지 않습니다.
`node-edge-tts`는 speech 구성 옵션과 출력 형식을 제공하지만,
서비스가 모든 옵션을 지원하는 것은 아닙니다. `edge`를 사용하는 레거시 config 및 directive 입력은
여전히 동작하며 `microsoft`로 정규화됩니다.

이 경로는 게시된 SLA나 quota가 없는 공개 웹 서비스이므로,
best-effort로 취급하세요. 보장된 한도와 지원이 필요하다면 OpenAI
또는 ElevenLabs를 사용하세요.

## 선택적 키

OpenAI, ElevenLabs, Google Gemini, MiniMax, 또는 xAI를 사용하려면:

- `ELEVENLABS_API_KEY` (또는 `XI_API_KEY`)
- `GEMINI_API_KEY` (또는 `GOOGLE_API_KEY`)
- `MINIMAX_API_KEY`
- `OPENAI_API_KEY`
- `XAI_API_KEY`

Microsoft speech는 API 키가 **필요하지 않습니다**.

여러 provider가 구성되어 있으면 선택된 provider가 먼저 사용되고 나머지는 폴백 옵션이 됩니다.
자동 요약은 구성된 `summaryModel`(또는 `agents.defaults.model.primary`)을 사용하므로,
요약을 활성화하면 해당 provider도 인증되어 있어야 합니다.

## 서비스 링크

- [OpenAI Text-to-Speech 가이드](https://platform.openai.com/docs/guides/text-to-speech)
- [OpenAI Audio API 참조](https://platform.openai.com/docs/api-reference/audio)
- [ElevenLabs Text to Speech](https://elevenlabs.io/docs/api-reference/text-to-speech)
- [ElevenLabs 인증](https://elevenlabs.io/docs/api-reference/authentication)
- [MiniMax T2A v2 API](https://platform.minimaxi.com/document/T2A%20V2)
- [node-edge-tts](https://github.com/SchneeHertz/node-edge-tts)
- [Microsoft Speech 출력 형식](https://learn.microsoft.com/azure/ai-services/speech-service/rest-text-to-speech#audio-outputs)
- [xAI Text to Speech](https://docs.x.ai/developers/rest-api-reference/inference/voice#text-to-speech-rest)

## 기본적으로 활성화되어 있나요?

아니요. 자동 TTS는 기본적으로 **꺼져** 있습니다. config에서
`messages.tts.auto`로 활성화하거나 로컬에서 `/tts on`으로 활성화하세요.

`messages.tts.provider`가 설정되지 않은 경우, OpenClaw는
registry 자동 선택 순서에서 처음 구성된 speech provider를 선택합니다.

## 구성

TTS config는 `openclaw.json`의 `messages.tts` 아래에 있습니다.
전체 스키마는 [Gateway 구성](/ko/gateway/configuration)에 있습니다.

### 최소 config(활성화 + provider)

```json5
{
  messages: {
    tts: {
      auto: "always",
      provider: "elevenlabs",
    },
  },
}
```

### ElevenLabs 폴백이 있는 OpenAI 기본 설정

```json5
{
  messages: {
    tts: {
      auto: "always",
      provider: "openai",
      summaryModel: "openai/gpt-4.1-mini",
      modelOverrides: {
        enabled: true,
      },
      providers: {
        openai: {
          apiKey: "openai_api_key",
          baseUrl: "https://api.openai.com/v1",
          model: "gpt-4o-mini-tts",
          voice: "alloy",
        },
        elevenlabs: {
          apiKey: "elevenlabs_api_key",
          baseUrl: "https://api.elevenlabs.io",
          voiceId: "voice_id",
          modelId: "eleven_multilingual_v2",
          seed: 42,
          applyTextNormalization: "auto",
          languageCode: "en",
          voiceSettings: {
            stability: 0.5,
            similarityBoost: 0.75,
            style: 0.0,
            useSpeakerBoost: true,
            speed: 1.0,
          },
        },
      },
    },
  },
}
```

### Microsoft 기본 설정(API 키 없음)

```json5
{
  messages: {
    tts: {
      auto: "always",
      provider: "microsoft",
      providers: {
        microsoft: {
          enabled: true,
          voice: "en-US-MichelleNeural",
          lang: "en-US",
          outputFormat: "audio-24khz-48kbitrate-mono-mp3",
          rate: "+10%",
          pitch: "-5%",
        },
      },
    },
  },
}
```

### MiniMax 기본 설정

```json5
{
  messages: {
    tts: {
      auto: "always",
      provider: "minimax",
      providers: {
        minimax: {
          apiKey: "minimax_api_key",
          baseUrl: "https://api.minimax.io",
          model: "speech-2.8-hd",
          voiceId: "English_expressive_narrator",
          speed: 1.0,
          vol: 1.0,
          pitch: 0,
        },
      },
    },
  },
}
```

### Google Gemini 기본 설정

```json5
{
  messages: {
    tts: {
      auto: "always",
      provider: "google",
      providers: {
        google: {
          apiKey: "gemini_api_key",
          model: "gemini-3.1-flash-tts-preview",
          voiceName: "Kore",
        },
      },
    },
  },
}
```

Google Gemini TTS는 Gemini API 키 경로를 사용합니다. Gemini API로 제한된
Google Cloud Console API 키도 여기서 유효하며, 번들 Google 이미지 생성 provider가
사용하는 것과 같은 형태의 키입니다. 해석 순서는
`messages.tts.providers.google.apiKey` -> `models.providers.google.apiKey` ->
`GEMINI_API_KEY` -> `GOOGLE_API_KEY`입니다.

### xAI 기본 설정

```json5
{
  messages: {
    tts: {
      auto: "always",
      provider: "xai",
      providers: {
        xai: {
          apiKey: "xai_api_key",
          voiceId: "eve",
          language: "en",
          responseFormat: "mp3",
          speed: 1.0,
        },
      },
    },
  },
}
```

xAI TTS는 번들 Grok 모델 provider와 같은 `XAI_API_KEY` 경로를 사용합니다.
해석 순서는 `messages.tts.providers.xai.apiKey` -> `XAI_API_KEY`입니다.
현재 라이브 음성은 `ara`, `eve`, `leo`, `rex`, `sal`, `una`이며, 기본값은 `eve`입니다.
`language`는 BCP-47 태그 또는 `auto`를 허용합니다.

### Microsoft speech 비활성화

```json5
{
  messages: {
    tts: {
      providers: {
        microsoft: {
          enabled: false,
        },
      },
    },
  },
}
```

### 사용자 지정 제한 + prefs 경로

```json5
{
  messages: {
    tts: {
      auto: "always",
      maxTextLength: 4000,
      timeoutMs: 30000,
      prefsPath: "~/.openclaw/settings/tts.json",
    },
  },
}
```

### 인바운드 음성 메시지 이후에만 오디오로 응답

```json5
{
  messages: {
    tts: {
      auto: "inbound",
    },
  },
}
```

### 긴 응답에 대한 자동 요약 비활성화

```json5
{
  messages: {
    tts: {
      auto: "always",
    },
  },
}
```

그런 다음 다음을 실행하세요:

```
/tts summary off
```

### 필드 참고 사항

- `auto`: 자동 TTS 모드(`off`, `always`, `inbound`, `tagged`)
  - `inbound`는 인바운드 음성 메시지 이후에만 오디오를 보냅니다.
  - `tagged`는 응답에 `[[tts:key=value]]` directive 또는 `[[tts:text]]...[[/tts:text]]` 블록이 있을 때만 오디오를 보냅니다.
- `enabled`: 레거시 토글(`doctor`가 이를 `auto`로 마이그레이션함)
- `mode`: `"final"`(기본값) 또는 `"all"`(도구/블록 응답 포함)
- `provider`: `"elevenlabs"`, `"google"`, `"microsoft"`, `"minimax"`, `"openai"` 같은 speech provider id(폴백은 자동)
- `provider`가 **설정되지 않으면**, OpenClaw는 registry 자동 선택 순서에서 첫 번째 구성된 speech provider를 사용합니다.
- 레거시 `provider: "edge"`도 계속 동작하며 `microsoft`로 정규화됩니다.
- `summaryModel`: 자동 요약용 선택적 저비용 모델, 기본값은 `agents.defaults.model.primary`
  - `provider/model` 또는 구성된 모델 별칭을 허용합니다.
- `modelOverrides`: 모델이 TTS directive를 출력하도록 허용(기본적으로 켜짐)
  - `allowProvider` 기본값은 `false`입니다(provider 전환은 opt-in).
- `providers.<id>`: speech provider id를 키로 하는 provider 소유 설정
- 레거시 직접 provider 블록(`messages.tts.openai`, `messages.tts.elevenlabs`, `messages.tts.microsoft`, `messages.tts.edge`)은 로드 시 자동으로 `messages.tts.providers.<id>`로 마이그레이션됩니다.
- `maxTextLength`: TTS 입력의 하드 제한(chars). 초과 시 `/tts audio`는 실패합니다.
- `timeoutMs`: 요청 타임아웃(ms)
- `prefsPath`: 로컬 prefs JSON 경로(provider/limit/summary) 재정의
- `apiKey` 값은 env var(`ELEVENLABS_API_KEY`/`XI_API_KEY`, `GEMINI_API_KEY`/`GOOGLE_API_KEY`, `MINIMAX_API_KEY`, `OPENAI_API_KEY`)로 폴백합니다.
- `providers.elevenlabs.baseUrl`: ElevenLabs API base URL 재정의
- `providers.openai.baseUrl`: OpenAI TTS 엔드포인트 재정의
  - 해석 순서: `messages.tts.providers.openai.baseUrl` -> `OPENAI_TTS_BASE_URL` -> `https://api.openai.com/v1`
  - 기본값이 아닌 값은 OpenAI 호환 TTS 엔드포인트로 취급되므로 사용자 지정 모델과 음성 이름을 허용합니다.
- `providers.elevenlabs.voiceSettings`:
  - `stability`, `similarityBoost`, `style`: `0..1`
  - `useSpeakerBoost`: `true|false`
  - `speed`: `0.5..2.0` (1.0 = 보통 속도)
- `providers.elevenlabs.applyTextNormalization`: `auto|on|off`
- `providers.elevenlabs.languageCode`: 2자리 ISO 639-1 (예: `en`, `de`)
- `providers.elevenlabs.seed`: 정수 `0..4294967295` (best-effort 결정성)
- `providers.minimax.baseUrl`: MiniMax API base URL 재정의(기본값 `https://api.minimax.io`, env: `MINIMAX_API_HOST`)
- `providers.minimax.model`: TTS 모델(기본값 `speech-2.8-hd`, env: `MINIMAX_TTS_MODEL`)
- `providers.minimax.voiceId`: 음성 식별자(기본값 `English_expressive_narrator`, env: `MINIMAX_TTS_VOICE_ID`)
- `providers.minimax.speed`: 재생 속도 `0.5..2.0` (기본값 1.0)
- `providers.minimax.vol`: 볼륨 `(0, 10]` (기본값 1.0, 0보다 커야 함)
- `providers.minimax.pitch`: 피치 이동 `-12..12` (기본값 0)
- `providers.google.model`: Gemini TTS 모델(기본값 `gemini-3.1-flash-tts-preview`)
- `providers.google.voiceName`: Gemini 사전 제공 음성 이름(기본값 `Kore`, `voice`도 허용)
- `providers.google.baseUrl`: Gemini API base URL 재정의. `https://generativelanguage.googleapis.com`만 허용됩니다.
  - `messages.tts.providers.google.apiKey`가 생략되면 TTS는 env 폴백 전에 `models.providers.google.apiKey`를 재사용할 수 있습니다.
- `providers.xai.apiKey`: xAI TTS API 키(env: `XAI_API_KEY`)
- `providers.xai.baseUrl`: xAI TTS base URL 재정의(기본값 `https://api.x.ai/v1`, env: `XAI_BASE_URL`)
- `providers.xai.voiceId`: xAI 음성 id(기본값 `eve`, 현재 라이브 음성: `ara`, `eve`, `leo`, `rex`, `sal`, `una`)
- `providers.xai.language`: BCP-47 언어 코드 또는 `auto`(기본값 `en`)
- `providers.xai.responseFormat`: `mp3`, `wav`, `pcm`, `mulaw`, `alaw`(기본값 `mp3`)
- `providers.xai.speed`: provider 네이티브 속도 재정의
- `providers.microsoft.enabled`: Microsoft speech 사용 허용(기본값 `true`, API 키 없음)
- `providers.microsoft.voice`: Microsoft neural 음성 이름(예: `en-US-MichelleNeural`)
- `providers.microsoft.lang`: 언어 코드(예: `en-US`)
- `providers.microsoft.outputFormat`: Microsoft 출력 형식(예: `audio-24khz-48kbitrate-mono-mp3`)
  - 유효한 값은 Microsoft Speech 출력 형식을 참조하세요. 번들 Edge 기반 transport가 모든 형식을 지원하는 것은 아닙니다.
- `providers.microsoft.rate` / `providers.microsoft.pitch` / `providers.microsoft.volume`: 퍼센트 문자열(예: `+10%`, `-5%`)
- `providers.microsoft.saveSubtitles`: 오디오 파일과 함께 JSON 자막 저장
- `providers.microsoft.proxy`: Microsoft speech 요청용 proxy URL
- `providers.microsoft.timeoutMs`: 요청 타임아웃 재정의(ms)
- `edge.*`: 동일한 Microsoft 설정에 대한 레거시 별칭

## 모델 기반 재정의(기본적으로 켜짐)

기본적으로 모델은 단일 응답에 대해 TTS directive를 출력할 **수 있습니다**.
`messages.tts.auto`가 `tagged`일 때는 이 directive가 오디오를 트리거하는 데 필요합니다.

활성화되면 모델은 단일 응답에 대해 음성을 재정의하는 `[[tts:...]]` directive와,
오디오에만 나타나야 하는 표현 태그(웃음, 노래 지시 등)를 제공하는
선택적 `[[tts:text]]...[[/tts:text]]` 블록을 출력할 수 있습니다.

`provider=...` directive는 `modelOverrides.allowProvider: true`가 아니면 무시됩니다.

예시 응답 페이로드:

```
Here you go.

[[tts:voiceId=pMsXgVXv3BLzUgSXRplE model=eleven_v3 speed=1.1]]
[[tts:text]](laughs) Read the song once more.[[/tts:text]]
```

사용 가능한 directive 키(활성화된 경우):

- `provider` (등록된 speech provider id, 예: `openai`, `elevenlabs`, `google`, `minimax`, `microsoft`; `allowProvider: true` 필요)
- `voice` (OpenAI voice), `voiceName` / `voice_name` / `google_voice` (Google voice), 또는 `voiceId` (ElevenLabs / MiniMax / xAI)
- `model` (OpenAI TTS 모델, ElevenLabs model id, 또는 MiniMax model) 또는 `google_model` (Google TTS 모델)
- `stability`, `similarityBoost`, `style`, `speed`, `useSpeakerBoost`
- `vol` / `volume` (MiniMax 볼륨, 0-10)
- `pitch` (MiniMax 피치, -12 ~ 12)
- `applyTextNormalization` (`auto|on|off`)
- `languageCode` (ISO 639-1)
- `seed`

모든 모델 재정의 비활성화:

```json5
{
  messages: {
    tts: {
      modelOverrides: {
        enabled: false,
      },
    },
  },
}
```

선택적 allowlist(provider 전환은 허용하면서 다른 설정 항목은 계속 조정 가능):

```json5
{
  messages: {
    tts: {
      modelOverrides: {
        enabled: true,
        allowProvider: true,
        allowSeed: false,
      },
    },
  },
}
```

## 사용자별 기본 설정

슬래시 명령은 `prefsPath`에 로컬 재정의를 기록합니다(기본값:
`~/.openclaw/settings/tts.json`, `OPENCLAW_TTS_PREFS` 또는
`messages.tts.prefsPath`로 재정의 가능).

저장되는 필드:

- `enabled`
- `provider`
- `maxLength` (요약 임계값, 기본값 1500자)
- `summarize` (기본값 `true`)

이 값들은 해당 호스트에서 `messages.tts.*`를 재정의합니다.

## 출력 형식(고정)

- **Feishu / Matrix / Telegram / WhatsApp**: Opus 음성 메시지(ElevenLabs는 `opus_48000_64`, OpenAI는 `opus`)
  - 48kHz / 64kbps는 음성 메시지에 적절한 절충안입니다.
- **기타 채널**: MP3(ElevenLabs는 `mp3_44100_128`, OpenAI는 `mp3`)
  - 44.1kHz / 128kbps는 음성 명료도를 위한 기본 균형입니다.
- **MiniMax**: MP3(`speech-2.8-hd` 모델, 32kHz 샘플링 레이트). 음성 노트 형식을 기본적으로 지원하지 않으므로, 보장된 Opus 음성 메시지가 필요하면 OpenAI 또는 ElevenLabs를 사용하세요.
- **Google Gemini**: Gemini API TTS는 원시 24kHz PCM을 반환합니다. OpenClaw는 오디오 첨부 파일용으로 이를 WAV로 감싸고, Talk/telephony에는 PCM을 직접 반환합니다. 네이티브 Opus 음성 노트 형식은 이 경로에서 지원되지 않습니다.
- **xAI**: 기본적으로 MP3이며, `responseFormat`은 `mp3`, `wav`, `pcm`, `mulaw`, `alaw` 중 하나일 수 있습니다. OpenClaw는 xAI의 배치 REST TTS 엔드포인트를 사용하고 완전한 오디오 첨부 파일을 반환합니다. xAI의 스트리밍 TTS WebSocket은 이 provider 경로에서 사용되지 않습니다. 네이티브 Opus 음성 노트 형식은 이 경로에서 지원되지 않습니다.
- **Microsoft**: `microsoft.outputFormat`을 사용합니다(기본값 `audio-24khz-48kbitrate-mono-mp3`)
  - 번들 transport는 `outputFormat`을 허용하지만, 서비스에서 모든 형식을 사용할 수 있는 것은 아닙니다.
  - 출력 형식 값은 Microsoft Speech 출력 형식을 따릅니다(Ogg/WebM Opus 포함).
  - Telegram `sendVoice`는 OGG/MP3/M4A를 허용합니다. 보장된 Opus 음성 메시지가 필요하면 OpenAI/ElevenLabs를 사용하세요.
  - 구성된 Microsoft 출력 형식이 실패하면 OpenClaw는 MP3로 재시도합니다.

OpenAI/ElevenLabs 출력 형식은 채널별로 고정됩니다(위 참조).

## 자동 TTS 동작

활성화되면 OpenClaw는 다음과 같이 동작합니다.

- 응답에 이미 미디어 또는 `MEDIA:` directive가 있으면 TTS를 건너뜁니다.
- 매우 짧은 응답(< 10자)은 건너뜁니다.
- 긴 응답은 활성화된 경우 `agents.defaults.model.primary`(또는 `summaryModel`)를 사용해 요약합니다.
- 생성된 오디오를 응답에 첨부합니다.

응답이 `maxLength`를 초과하고 요약이 꺼져 있거나(또는
요약 모델용 API 키가 없으면), 오디오는
건너뛰고 일반 텍스트 응답을 보냅니다.

## 흐름도

```
응답 -> TTS 활성화됨?
  아니요 -> 텍스트 전송
  예    -> 미디어 / MEDIA: / 짧은 응답인가?
            예    -> 텍스트 전송
            아니요 -> 길이가 제한 초과?
                     아니요 -> TTS -> 오디오 첨부
                     예    -> 요약 활성화됨?
                              아니요 -> 텍스트 전송
                              예    -> 요약(summaryModel 또는 agents.defaults.model.primary)
                                        -> TTS -> 오디오 첨부
```

## 슬래시 명령 사용법

단일 명령인 `/tts`가 있습니다.
활성화 세부 사항은 [슬래시 명령](/ko/tools/slash-commands)을 참조하세요.

Discord 참고: `/tts`는 Discord 내장 명령이므로 OpenClaw는
여기서 네이티브 명령으로 `/voice`를 등록합니다. 텍스트 `/tts ...`도 여전히 동작합니다.

```
/tts off
/tts on
/tts status
/tts provider openai
/tts limit 2000
/tts summary off
/tts audio Hello from OpenClaw
```

참고:

- 명령은 인증된 발신자가 필요합니다(allowlist/owner 규칙은 계속 적용됨).
- `commands.text` 또는 네이티브 명령 등록이 활성화되어 있어야 합니다.
- config `messages.tts.auto`는 `off|always|inbound|tagged`를 허용합니다.
- `/tts on`은 로컬 TTS 기본 설정을 `always`로 기록하고, `/tts off`는 `off`로 기록합니다.
- `inbound` 또는 `tagged` 기본값을 원하면 config를 사용하세요.
- `limit`과 `summary`는 메인 config가 아니라 로컬 prefs에 저장됩니다.
- `/tts audio`는 일회성 오디오 응답을 생성합니다(TTS를 켜는 것은 아님).
- `/tts status`는 최신 시도에 대한 폴백 가시성을 포함합니다.
  - 성공 폴백: `Fallback: <primary> -> <used>`와 `Attempts: ...`
  - 실패: `Error: ...`와 `Attempts: ...`
  - 자세한 진단: `Attempt details: provider:outcome(reasonCode) latency`
- OpenAI 및 ElevenLabs API 실패에는 이제 파싱된 provider 오류 세부 사항과 요청 id(제공자가 반환한 경우)가 포함되며, 이는 TTS 오류/로그에 표시됩니다.

## 에이전트 도구

`tts` 도구는 텍스트를 음성으로 변환하고
응답 전달을 위한 오디오 첨부 파일을 반환합니다. 채널이 Feishu, Matrix, Telegram, WhatsApp인 경우,
오디오는 파일 첨부가 아니라 음성 메시지로 전달됩니다.
선택적 `channel` 및 `timeoutMs` 필드를 허용하며, `timeoutMs`는
호출별 provider 요청 타임아웃(밀리초)입니다.

## Gateway RPC

Gateway 메서드:

- `tts.status`
- `tts.enable`
- `tts.disable`
- `tts.convert`
- `tts.setProvider`
- `tts.providers`

## 관련 항목

- [미디어 개요](/ko/tools/media-overview)
- [음악 생성](/ko/tools/music-generation)
- [비디오 생성](/ko/tools/video-generation)
