---
read_when:
    - OpenClaw에서 발신 음성 통화를 걸고 싶습니다.
    - 음성 통화 Plugin을 구성하거나 개발하고 있습니다.
summary: 'Voice Call Plugin: Twilio/Telnyx/Plivo를 통한 발신 + 수신 통화 (Plugin 설치 + 구성 + CLI)'
title: 음성 통화 Plugin
x-i18n:
    generated_at: "2026-04-24T09:51:53Z"
    model: gpt-5.4
    provider: openai
    source_hash: 6aed4e33ce090c86f43c71280f033e446f335c53d42456fdc93c9938250e9af6
    source_path: plugins/voice-call.md
    workflow: 15
---

# Voice Call (Plugin)

Plugin을 통해 OpenClaw에서 음성 통화를 사용할 수 있습니다. 발신 알림과
수신 정책이 적용된 다중 턴 대화를 지원합니다.

현재 지원하는 제공업체:

- `twilio` (Programmable Voice + Media Streams)
- `telnyx` (Call Control v2)
- `plivo` (Voice API + XML transfer + GetInput speech)
- `mock` (개발용/네트워크 없음)

빠른 개념 요약:

- Plugin 설치
- Gateway 재시작
- `plugins.entries.voice-call.config` 아래에서 구성
- `openclaw voicecall ...` 또는 `voice_call` 도구 사용

## 실행 위치(로컬 vs 원격)

Voice Call Plugin은 **Gateway 프로세스 내부에서** 실행됩니다.

원격 Gateway를 사용하는 경우, **Gateway가 실행 중인 머신에** Plugin을 설치/구성한 다음, Plugin이 로드되도록 Gateway를 재시작하세요.

## 설치

### 옵션 A: npm에서 설치(권장)

```bash
openclaw plugins install @openclaw/voice-call
```

그런 다음 Gateway를 재시작하세요.

### 옵션 B: 로컬 폴더에서 설치(개발용, 복사 없음)

```bash
PLUGIN_SRC=./path/to/local/voice-call-plugin
openclaw plugins install "$PLUGIN_SRC"
cd "$PLUGIN_SRC" && pnpm install
```

그런 다음 Gateway를 재시작하세요.

## 구성

`plugins.entries.voice-call.config` 아래에 구성을 설정하세요:

```json5
{
  plugins: {
    entries: {
      "voice-call": {
        enabled: true,
        config: {
          provider: "twilio", // 또는 "telnyx" | "plivo" | "mock"
          fromNumber: "+15550001234", // 또는 Twilio의 경우 TWILIO_FROM_NUMBER
          toNumber: "+15550005678",

          twilio: {
            accountSid: "ACxxxxxxxx",
            authToken: "...",
          },

          telnyx: {
            apiKey: "...",
            connectionId: "...",
            // Telnyx Mission Control Portal의 Telnyx Webhook 공개 키
            // (Base64 문자열이며, TELNYX_PUBLIC_KEY로도 설정 가능).
            publicKey: "...",
          },

          plivo: {
            authId: "MAxxxxxxxxxxxxxxxxxxxx",
            authToken: "...",
          },

          // Webhook 서버
          serve: {
            port: 3334,
            path: "/voice/webhook",
          },

          // Webhook 보안(터널/프록시에 권장)
          webhookSecurity: {
            allowedHosts: ["voice.example.com"],
            trustedProxyIPs: ["100.64.0.1"],
          },

          // 공개 노출(하나 선택)
          // publicUrl: "https://example.ngrok.app/voice/webhook",
          // tunnel: { provider: "ngrok" },
          // tailscale: { mode: "funnel", path: "/voice/webhook" }

          outbound: {
            defaultMode: "notify", // notify | conversation
          },

          streaming: {
            enabled: true,
            provider: "openai", // 선택 사항; 설정하지 않으면 처음 등록된 realtime transcription provider 사용
            streamPath: "/voice/stream",
            providers: {
              openai: {
                apiKey: "sk-...", // OPENAI_API_KEY가 설정되어 있으면 선택 사항
                model: "gpt-4o-transcribe",
                silenceDurationMs: 800,
                vadThreshold: 0.5,
              },
            },
            preStartTimeoutMs: 5000,
            maxPendingConnections: 32,
            maxPendingConnectionsPerIp: 4,
            maxConnections: 128,
          },

          realtime: {
            enabled: false,
            provider: "google", // 선택 사항; 설정하지 않으면 처음 등록된 realtime voice provider 사용
            providers: {
              google: {
                model: "gemini-2.5-flash-native-audio-preview-12-2025",
                voice: "Kore",
              },
            },
          },
        },
      },
    },
  },
}
```

참고:

- Twilio/Telnyx는 **공개적으로 접근 가능한** Webhook URL이 필요합니다.
- Plivo는 **공개적으로 접근 가능한** Webhook URL이 필요합니다.
- `mock`는 로컬 개발용 provider입니다(네트워크 호출 없음).
- 이전 구성에서 여전히 `provider: "log"`, `twilio.from`, 또는 레거시 `streaming.*` OpenAI 키를 사용 중이라면, `openclaw doctor --fix`를 실행해 다시 작성하세요.
- Telnyx는 `skipSignatureVerification`이 true가 아닌 한 `telnyx.publicKey`(또는 `TELNYX_PUBLIC_KEY`)가 필요합니다.
- `skipSignatureVerification`은 로컬 테스트 전용입니다.
- ngrok 무료 티어를 사용하는 경우, `publicUrl`을 정확한 ngrok URL로 설정하세요. 서명 검증은 항상 강제됩니다.
- `tunnel.allowNgrokFreeTierLoopbackBypass: true`는 `tunnel.provider="ngrok"`이고 `serve.bind`가 loopback(ngrok 로컬 에이전트)일 때만 유효하지 않은 서명을 가진 Twilio Webhook을 허용합니다. 로컬 개발에만 사용하세요.
- Ngrok 무료 티어 URL은 변경되거나 중간 페이지 동작이 추가될 수 있습니다. `publicUrl`이 달라지면 Twilio 서명 검증이 실패합니다. 프로덕션에서는 안정적인 도메인이나 Tailscale funnel을 권장합니다.
- `realtime.enabled`는 완전한 음성-대-음성 대화를 시작합니다. `streaming.enabled`와 함께 활성화하지 마세요.
- 스트리밍 보안 기본값:
  - `streaming.preStartTimeoutMs`는 유효한 `start` 프레임을 보내지 않는 소켓을 종료합니다.
- `streaming.maxPendingConnections`는 인증 전 시작 상태의 전체 소켓 수를 제한합니다.
- `streaming.maxPendingConnectionsPerIp`는 소스 IP당 인증 전 시작 상태의 소켓 수를 제한합니다.
- `streaming.maxConnections`는 열린 전체 미디어 스트림 소켓 수(대기 중 + 활성)를 제한합니다.
- 런타임 대체 경로는 현재도 이전 voice-call 키를 허용하지만, 다시 작성하는 경로는 `openclaw doctor --fix`이며 호환성 shim은 임시입니다.

## Realtime 음성 대화

`realtime`은 실시간 통화 오디오를 위한 전이중 realtime voice provider를 선택합니다.
이는 오디오를 realtime transcription provider로만 전달하는 `streaming`과는 별개입니다.

현재 런타임 동작:

- `realtime.enabled`는 Twilio Media Streams에서 지원됩니다.
- `realtime.enabled`는 `streaming.enabled`와 함께 사용할 수 없습니다.
- `realtime.provider`는 선택 사항입니다. 설정하지 않으면 Voice Call은
  처음 등록된 realtime voice provider를 사용합니다.
- 번들된 realtime voice provider에는 해당 provider Plugin이 등록하는 Google Gemini Live (`google`)와
  OpenAI (`openai`)가 포함됩니다.
- provider 소유의 원시 구성은 `realtime.providers.<providerId>` 아래에 있습니다.
- `realtime.provider`가 등록되지 않은 provider를 가리키거나, 등록된 realtime
  voice provider가 전혀 없는 경우, Voice Call은 전체 Plugin을 실패시키지 않고
  경고를 기록한 뒤 realtime 미디어를 건너뜁니다.

Google Gemini Live realtime 기본값:

- API 키: `realtime.providers.google.apiKey`, `GEMINI_API_KEY`, 또는
  `GOOGLE_GENERATIVE_AI_API_KEY`
- model: `gemini-2.5-flash-native-audio-preview-12-2025`
- voice: `Kore`

예시:

```json5
{
  plugins: {
    entries: {
      "voice-call": {
        config: {
          provider: "twilio",
          inboundPolicy: "allowlist",
          allowFrom: ["+15550005678"],
          realtime: {
            enabled: true,
            provider: "google",
            instructions: "Speak briefly and ask before using tools.",
            providers: {
              google: {
                apiKey: "${GEMINI_API_KEY}",
                model: "gemini-2.5-flash-native-audio-preview-12-2025",
                voice: "Kore",
              },
            },
          },
        },
      },
    },
  },
}
```

대신 OpenAI 사용:

```json5
{
  plugins: {
    entries: {
      "voice-call": {
        config: {
          realtime: {
            enabled: true,
            provider: "openai",
            providers: {
              openai: {
                apiKey: "${OPENAI_API_KEY}",
              },
            },
          },
        },
      },
    },
  },
}
```

provider별 realtime voice 옵션은
[Google provider](/ko/providers/google) 및 [OpenAI provider](/ko/providers/openai)를 참고하세요.

## 스트리밍 전사

`streaming`은 실시간 통화 오디오를 위한 realtime transcription provider를 선택합니다.

현재 런타임 동작:

- `streaming.provider`는 선택 사항입니다. 설정하지 않으면 Voice Call은 처음
  등록된 realtime transcription provider를 사용합니다.
- 번들된 realtime transcription provider에는 해당 provider Plugin이 등록하는 Deepgram (`deepgram`),
  ElevenLabs (`elevenlabs`), Mistral (`mistral`), OpenAI (`openai`), xAI
  (`xai`)가 포함됩니다.
- provider 소유의 원시 구성은 `streaming.providers.<providerId>` 아래에 있습니다.
- `streaming.provider`가 등록되지 않은 provider를 가리키거나, 등록된 realtime
  transcription provider가 전혀 없는 경우, Voice Call은 경고를 기록하고
  전체 Plugin을 실패시키지 않고 미디어 스트리밍을 건너뜁니다.

OpenAI 스트리밍 전사 기본값:

- API 키: `streaming.providers.openai.apiKey` 또는 `OPENAI_API_KEY`
- model: `gpt-4o-transcribe`
- `silenceDurationMs`: `800`
- `vadThreshold`: `0.5`

xAI 스트리밍 전사 기본값:

- API 키: `streaming.providers.xai.apiKey` 또는 `XAI_API_KEY`
- endpoint: `wss://api.x.ai/v1/stt`
- `encoding`: `mulaw`
- `sampleRate`: `8000`
- `endpointingMs`: `800`
- `interimResults`: `true`

예시:

```json5
{
  plugins: {
    entries: {
      "voice-call": {
        config: {
          streaming: {
            enabled: true,
            provider: "openai",
            streamPath: "/voice/stream",
            providers: {
              openai: {
                apiKey: "sk-...", // OPENAI_API_KEY가 설정되어 있으면 선택 사항
                model: "gpt-4o-transcribe",
                silenceDurationMs: 800,
                vadThreshold: 0.5,
              },
            },
          },
        },
      },
    },
  },
}
```

대신 xAI 사용:

```json5
{
  plugins: {
    entries: {
      "voice-call": {
        config: {
          streaming: {
            enabled: true,
            provider: "xai",
            streamPath: "/voice/stream",
            providers: {
              xai: {
                apiKey: "${XAI_API_KEY}", // XAI_API_KEY가 설정되어 있으면 선택 사항
                endpointingMs: 800,
                language: "en",
              },
            },
          },
        },
      },
    },
  },
}
```

레거시 키는 여전히 `openclaw doctor --fix`로 자동 마이그레이션됩니다:

- `streaming.sttProvider` → `streaming.provider`
- `streaming.openaiApiKey` → `streaming.providers.openai.apiKey`
- `streaming.sttModel` → `streaming.providers.openai.model`
- `streaming.silenceDurationMs` → `streaming.providers.openai.silenceDurationMs`
- `streaming.vadThreshold` → `streaming.providers.openai.vadThreshold`

## 오래된 통화 정리기

터미널 Webhook을 받지 못하는 통화
(예: 완료되지 않는 notify 모드 통화)를 종료하려면 `staleCallReaperSeconds`를 사용하세요.
기본값은 `0`(비활성화)입니다.

권장 범위:

- **프로덕션:** notify 스타일 흐름에는 `120`–`300`초.
- 정상 통화가 끝날 수 있도록 이 값은 **`maxDurationSeconds`보다 크게** 유지하세요.
  좋은 시작점은 `maxDurationSeconds + 30–60`초입니다.

예시:

```json5
{
  plugins: {
    entries: {
      "voice-call": {
        config: {
          maxDurationSeconds: 300,
          staleCallReaperSeconds: 360,
        },
      },
    },
  },
}
```

## Webhook 보안

프록시 또는 터널이 Gateway 앞에 있는 경우, Plugin은 서명 검증을 위해
공개 URL을 다시 구성합니다. 이 옵션은 어떤 전달 헤더를
신뢰할지 제어합니다.

`webhookSecurity.allowedHosts`는 전달 헤더의 호스트를 허용 목록으로 제한합니다.

`webhookSecurity.trustForwardingHeaders`는 허용 목록 없이 전달 헤더를 신뢰합니다.

`webhookSecurity.trustedProxyIPs`는 요청의 원격 IP가 목록과 일치할 때만
전달 헤더를 신뢰합니다.

Webhook 재생 공격 방지는 Twilio와 Plivo에서 활성화됩니다. 재생된 유효한 Webhook
요청은 확인 응답되지만 부작용은 건너뜁니다.

Twilio 대화 턴에는 `<Gather>` 콜백에 턴별 토큰이 포함되므로,
오래되었거나 재생된 음성 콜백은 더 새로운 대기 중 전사 턴을 충족할 수 없습니다.

인증되지 않은 Webhook 요청은 provider에 필요한 서명 헤더가 없으면
본문을 읽기 전에 거부됩니다.

voice-call Webhook은 서명 검증 전에
공유 pre-auth 본문 프로필(64 KB / 5초)과 IP별 진행 중 요청 제한을 사용합니다.

안정적인 공개 호스트를 사용하는 예시:

```json5
{
  plugins: {
    entries: {
      "voice-call": {
        config: {
          publicUrl: "https://voice.example.com/voice/webhook",
          webhookSecurity: {
            allowedHosts: ["voice.example.com"],
          },
        },
      },
    },
  },
}
```

## 통화용 TTS

Voice Call은 통화 중 음성 스트리밍에 코어 `messages.tts` 구성을 사용합니다. Plugin 구성 아래에서 **동일한 구조**로 재정의할 수 있으며, `messages.tts`와 deep merge됩니다.

```json5
{
  tts: {
    provider: "elevenlabs",
    providers: {
      elevenlabs: {
        voiceId: "pMsXgVXv3BLzUgSXRplE",
        modelId: "eleven_multilingual_v2",
      },
    },
  },
}
```

참고:

- Plugin 구성 내부의 레거시 `tts.<provider>` 키(`openai`, `elevenlabs`, `microsoft`, `edge`)는 로드 시 `tts.providers.<provider>`로 자동 마이그레이션됩니다. 커밋된 구성에서는 `providers` 구조를 사용하는 것이 좋습니다.
- **Microsoft speech는 음성 통화에서 무시됩니다**(전화 오디오는 PCM이 필요하지만, 현재 Microsoft 전송은 전화용 PCM 출력을 노출하지 않습니다).
- Twilio 미디어 스트리밍이 활성화된 경우 코어 TTS가 사용되며, 그렇지 않으면 통화는 provider 기본 음성으로 대체됩니다.
- Twilio 미디어 스트림이 이미 활성 상태이면 Voice Call은 TwiML `<Say>`로 대체하지 않습니다. 이 상태에서 전화 TTS를 사용할 수 없으면 두 재생 경로를 혼합하는 대신 재생 요청이 실패합니다.
- 전화 TTS가 보조 provider로 대체되면, Voice Call은 디버깅을 위해 provider 체인(`from`, `to`, `attempts`)이 포함된 경고를 기록합니다.

### 추가 예시

코어 TTS만 사용(재정의 없음):

```json5
{
  messages: {
    tts: {
      provider: "openai",
      providers: {
        openai: { voice: "alloy" },
      },
    },
  },
}
```

통화에만 ElevenLabs로 재정의(다른 곳에서는 코어 기본값 유지):

```json5
{
  plugins: {
    entries: {
      "voice-call": {
        config: {
          tts: {
            provider: "elevenlabs",
            providers: {
              elevenlabs: {
                apiKey: "elevenlabs_key",
                voiceId: "pMsXgVXv3BLzUgSXRplE",
                modelId: "eleven_multilingual_v2",
              },
            },
          },
        },
      },
    },
  },
}
```

통화에 대해서만 OpenAI model 재정의(deep merge 예시):

```json5
{
  plugins: {
    entries: {
      "voice-call": {
        config: {
          tts: {
            providers: {
              openai: {
                model: "gpt-4o-mini-tts",
                voice: "marin",
              },
            },
          },
        },
      },
    },
  },
}
```

## 수신 통화

수신 정책의 기본값은 `disabled`입니다. 수신 통화를 활성화하려면 다음을 설정하세요:

```json5
{
  inboundPolicy: "allowlist",
  allowFrom: ["+15550001234"],
  inboundGreeting: "Hello! How can I help?",
}
```

`inboundPolicy: "allowlist"`는 낮은 보증 수준의 발신자 ID 필터링입니다. Plugin은 provider가 제공한 `From` 값을 정규화한 뒤 `allowFrom`과 비교합니다. Webhook 검증은 provider 전달과 페이로드 무결성을 인증하지만, PSTN/VoIP 발신 번호의 소유권을 증명하지는 않습니다. `allowFrom`은 강력한 발신자 신원 확인이 아니라 발신자 ID 필터링으로 취급하세요.

자동 응답은 에이전트 시스템을 사용합니다. 다음으로 조정할 수 있습니다:

- `responseModel`
- `responseSystemPrompt`
- `responseTimeoutMs`

### 음성 출력 계약

자동 응답의 경우 Voice Call은 시스템 프롬프트에 엄격한 음성 출력 계약을 추가합니다:

- `{"spoken":"..."}`

그런 다음 Voice Call은 방어적으로 음성 텍스트를 추출합니다:

- reasoning/error 콘텐츠로 표시된 페이로드는 무시합니다.
- 직접 JSON, fenced JSON, 또는 인라인 `"spoken"` 키를 파싱합니다.
- 일반 텍스트로 대체하고 계획/메타 성격의 도입 문단으로 보이는 부분은 제거합니다.

이를 통해 음성 재생이 발신자에게 들려줄 텍스트에 집중되며, 계획 텍스트가 오디오로 노출되는 것을 방지합니다.

### 대화 시작 동작

발신 `conversation` 통화의 경우 첫 메시지 처리는 실시간 재생 상태와 연결됩니다:

- 끼어들기(barge-in) 큐 비우기와 자동 응답은 초기 인사말이 실제로 재생 중일 때만 억제됩니다.
- 초기 재생에 실패하면 통화는 `listening`으로 돌아가고 초기 메시지는 재시도를 위해 큐에 남아 있습니다.
- Twilio 스트리밍의 초기 재생은 추가 지연 없이 스트림 연결 시 시작됩니다.

### Twilio 스트림 연결 해제 유예 시간

Twilio 미디어 스트림 연결이 끊어지면, Voice Call은 통화를 자동 종료하기 전에 `2000ms` 대기합니다:

- 그 시간 안에 스트림이 다시 연결되면 자동 종료가 취소됩니다.
- 유예 시간이 지난 뒤에도 스트림이 다시 등록되지 않으면, 활성 통화가 멈춘 상태로 남지 않도록 통화를 종료합니다.

## CLI

```bash
openclaw voicecall call --to "+15555550123" --message "Hello from OpenClaw"
openclaw voicecall start --to "+15555550123"   # call의 별칭
openclaw voicecall continue --call-id <id> --message "Any questions?"
openclaw voicecall speak --call-id <id> --message "One moment"
openclaw voicecall dtmf --call-id <id> --digits "ww123456#"
openclaw voicecall end --call-id <id>
openclaw voicecall status --call-id <id>
openclaw voicecall tail
openclaw voicecall latency                     # 로그에서 턴 지연 시간 요약
openclaw voicecall expose --mode funnel
```

`latency`는 기본 voice-call 저장 경로의 `calls.jsonl`을 읽습니다. 다른 로그를 가리키려면 `--file <path>`를 사용하고, 마지막 N개 레코드만 분석하려면 `--last <n>`을 사용하세요(기본값 200). 출력에는 턴 지연 시간과 청취 대기 시간의 p50/p90/p99가 포함됩니다.

## 에이전트 도구

도구 이름: `voice_call`

작업:

- `initiate_call` (message, to?, mode?)
- `continue_call` (callId, message)
- `speak_to_user` (callId, message)
- `send_dtmf` (callId, digits)
- `end_call` (callId)
- `get_status` (callId)

이 저장소에는 일치하는 Skills 문서가 `skills/voice-call/SKILL.md`에 포함되어 있습니다.

## Gateway RPC

- `voicecall.initiate` (`to?`, `message`, `mode?`)
- `voicecall.continue` (`callId`, `message`)
- `voicecall.speak` (`callId`, `message`)
- `voicecall.dtmf` (`callId`, `digits`)
- `voicecall.end` (`callId`)
- `voicecall.status` (`callId`)

## 관련 항목

- [텍스트 음성 변환](/ko/tools/tts)
- [대화 모드](/ko/nodes/talk)
- [음성 깨우기](/ko/nodes/voicewake)
