---
read_when:
    - OpenClaw에서 아웃바운드 음성 통화를 걸고 싶습니다
    - voice-call Plugin을 구성하거나 개발하고 있습니다
summary: 'Voice Call Plugin: Twilio/Telnyx/Plivo를 통한 아웃바운드 + 인바운드 통화(Plugin 설치 + config + CLI)'
title: 음성 통화 Plugin
x-i18n:
    generated_at: "2026-04-24T06:28:52Z"
    model: gpt-5.4
    provider: openai
    source_hash: 4cd57118133506c22604ab9592a823546a91795ab425de4b7a81edbbb8374e6d
    source_path: plugins/voice-call.md
    workflow: 15
---

# 음성 통화(Plugin)

Plugin을 통한 OpenClaw 음성 통화입니다. 인바운드 정책을 포함한 아웃바운드 알림 및 다중 턴 대화를 지원합니다.

현재 provider:

- `twilio` (Programmable Voice + Media Streams)
- `telnyx` (Call Control v2)
- `plivo` (Voice API + XML transfer + GetInput speech)
- `mock` (개발용/네트워크 없음)

빠른 개념 정리:

- Plugin 설치
- Gateway 재시작
- `plugins.entries.voice-call.config` 아래에 구성
- `openclaw voicecall ...` 또는 `voice_call` 도구 사용

## 실행 위치(로컬 vs 원격)

Voice Call Plugin은 **Gateway 프로세스 내부에서** 실행됩니다.

원격 Gateway를 사용한다면, **Gateway가 실행 중인 머신**에 Plugin을 설치/구성한 다음 Gateway를 재시작해 로드하세요.

## 설치

### 옵션 A: npm에서 설치(권장)

```bash
openclaw plugins install @openclaw/voice-call
```

그 후 Gateway를 재시작하세요.

### 옵션 B: 로컬 폴더에서 설치(개발용, 복사 없음)

```bash
PLUGIN_SRC=./path/to/local/voice-call-plugin
openclaw plugins install "$PLUGIN_SRC"
cd "$PLUGIN_SRC" && pnpm install
```

그 후 Gateway를 재시작하세요.

## 구성

`plugins.entries.voice-call.config` 아래에 config를 설정하세요.

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
            // Telnyx Mission Control Portal의 Telnyx webhook 공개 키
            // (Base64 문자열; TELNYX_PUBLIC_KEY로도 설정 가능)
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
            provider: "openai", // 선택 사항; 미설정 시 첫 번째 등록된 실시간 전사 provider
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
        },
      },
    },
  },
}
```

참고:

- Twilio/Telnyx는 **공개적으로 접근 가능한** webhook URL이 필요합니다.
- Plivo는 **공개적으로 접근 가능한** webhook URL이 필요합니다.
- `mock`은 로컬 개발용 provider입니다(네트워크 호출 없음).
- 예전 config가 여전히 `provider: "log"`, `twilio.from`, 또는 레거시 `streaming.*` OpenAI 키를 사용한다면 `openclaw doctor --fix`를 실행해 다시 작성하세요.
- Telnyx는 `skipSignatureVerification`이 true가 아닌 한 `telnyx.publicKey`(또는 `TELNYX_PUBLIC_KEY`)가 필요합니다.
- `skipSignatureVerification`은 로컬 테스트 전용입니다.
- ngrok 무료 플랜을 사용한다면 `publicUrl`을 정확한 ngrok URL로 설정하세요. 서명 검증은 항상 강제됩니다.
- `tunnel.allowNgrokFreeTierLoopbackBypass: true`는 `tunnel.provider="ngrok"`이고 `serve.bind`가 loopback일 때(ngrok 로컬 에이전트)만 유효하지 않은 서명을 가진 Twilio webhook을 허용합니다. 로컬 개발에만 사용하세요.
- ngrok 무료 플랜 URL은 바뀌거나 중간 페이지 동작이 추가될 수 있습니다. `publicUrl`이 달라지면 Twilio 서명이 실패합니다. 프로덕션에서는 안정적인 도메인이나 Tailscale funnel을 권장합니다.
- 스트리밍 보안 기본값:
  - `streaming.preStartTimeoutMs`는 유효한 `start` 프레임을 전혀 보내지 않는 소켓을 닫습니다.
- `streaming.maxPendingConnections`는 전체 인증 전 pre-start 소켓 수를 제한합니다.
- `streaming.maxPendingConnectionsPerIp`는 소스 IP별 인증 전 pre-start 소켓 수를 제한합니다.
- `streaming.maxConnections`는 열려 있는 전체 미디어 스트림 소켓 수(대기 + 활성)를 제한합니다.
- 런타임 폴백은 현재도 تلك旧 voice-call 키를 허용하지만, 재작성 경로는 `openclaw doctor --fix`이며 호환성 shim은 임시입니다.

## 스트리밍 전사

`streaming`은 실시간 통화 오디오용 실시간 전사 provider를 선택합니다.

현재 런타임 동작:

- `streaming.provider`는 선택 사항입니다. 미설정 시 Voice Call은 첫 번째 등록된 실시간 전사 provider를 사용합니다.
- 번들 실시간 전사 provider에는 Deepgram(`deepgram`), ElevenLabs(`elevenlabs`), Mistral(`mistral`), OpenAI(`openai`), xAI(`xai`)가 포함되며, 이들은 provider Plugin이 등록합니다.
- provider 소유 원시 config는 `streaming.providers.<providerId>` 아래에 있습니다.
- `streaming.provider`가 등록되지 않은 provider를 가리키거나 실시간 전사 provider가 전혀 등록되어 있지 않으면, Voice Call은 전체 Plugin을 실패시키는 대신 경고를 기록하고 미디어 스트리밍을 건너뜁니다.

OpenAI 스트리밍 전사 기본값:

- API 키: `streaming.providers.openai.apiKey` 또는 `OPENAI_API_KEY`
- 모델: `gpt-4o-transcribe`
- `silenceDurationMs`: `800`
- `vadThreshold`: `0.5`

xAI 스트리밍 전사 기본값:

- API 키: `streaming.providers.xai.apiKey` 또는 `XAI_API_KEY`
- 엔드포인트: `wss://api.x.ai/v1/stt`
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

레거시 키는 여전히 `openclaw doctor --fix`에 의해 자동 마이그레이션됩니다.

- `streaming.sttProvider` → `streaming.provider`
- `streaming.openaiApiKey` → `streaming.providers.openai.apiKey`
- `streaming.sttModel` → `streaming.providers.openai.model`
- `streaming.silenceDurationMs` → `streaming.providers.openai.silenceDurationMs`
- `streaming.vadThreshold` → `streaming.providers.openai.vadThreshold`

## 오래된 통화 정리기

최종 webhook을 받지 못하는 통화(예: 완료되지 않는 notify 모드 통화)를 종료하려면 `staleCallReaperSeconds`를 사용하세요. 기본값은 `0`(비활성화)입니다.

권장 범위:

- **프로덕션:** notify 스타일 흐름에는 `120`–`300`초
- 정상 통화가 끝날 수 있도록 이 값은 **`maxDurationSeconds`보다 크게** 유지하세요. 좋은 시작점은 `maxDurationSeconds + 30–60`초입니다.

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

프록시나 터널이 Gateway 앞에 있을 때, Plugin은 서명 검증을 위해 공개 URL을 재구성합니다. 이 옵션들은 어떤 전달 헤더를 신뢰할지 제어합니다.

`webhookSecurity.allowedHosts`는 전달 헤더의 호스트를 허용 목록으로 제한합니다.

`webhookSecurity.trustForwardingHeaders`는 허용 목록 없이 전달 헤더를 신뢰합니다.

`webhookSecurity.trustedProxyIPs`는 요청 원격 IP가 목록과 일치할 때만 전달 헤더를 신뢰합니다.

Webhook 재생 공격 방지는 Twilio와 Plivo에 대해 활성화되어 있습니다. 재생된 유효 webhook 요청은 승인되지만 부작용은 건너뜁니다.

Twilio 대화 턴은 `<Gather>` 콜백에 턴별 토큰을 포함하므로, 오래되었거나 재생된 음성 콜백은 더 새로운 대기 전사 턴을 만족시킬 수 없습니다.

인증되지 않은 webhook 요청은 provider에 필요한 서명 헤더가 없으면 본문을 읽기 전에 거부됩니다.

voice-call webhook은 공유 pre-auth 본문 프로필(64 KB / 5초)과 서명 검증 전 per-IP in-flight 상한을 사용합니다.

안정적인 공개 호스트 사용 예시:

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

Voice Call은 통화에서 음성을 스트리밍하기 위해 core `messages.tts` 구성을 사용합니다. Plugin config 아래에서 **같은 형태로** 이를 재정의할 수 있으며, `messages.tts`와 deep-merge됩니다.

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

- Plugin config 내부의 레거시 `tts.<provider>` 키(`openai`, `elevenlabs`, `microsoft`, `edge`)는 로드 시 `tts.providers.<provider>`로 자동 마이그레이션됩니다. 커밋된 config에는 `providers` 형태를 사용하세요.
- **Microsoft speech는 음성 통화에서 무시됩니다**(전화 통화 오디오는 PCM이 필요하지만, 현재 Microsoft 전송은 전화 통화용 PCM 출력을 노출하지 않음).
- Twilio 미디어 스트리밍이 활성화되어 있으면 core TTS가 사용되고, 그렇지 않으면 통화는 provider 네이티브 음성으로 폴백합니다.
- Twilio 미디어 스트림이 이미 활성화되어 있으면 Voice Call은 TwiML `<Say>`로 폴백하지 않습니다. 그 상태에서 전화 통화용 TTS를 사용할 수 없으면 두 재생 경로를 섞는 대신 재생 요청이 실패합니다.
- 전화 통화용 TTS가 보조 provider로 폴백될 때, Voice Call은 디버깅을 위해 provider 체인(`from`, `to`, `attempts`)과 함께 경고를 기록합니다.

### 추가 예시

재정의 없이 core TTS만 사용:

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

통화에만 ElevenLabs로 재정의(core 기본값은 다른 곳에서 유지):

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

통화용 OpenAI 모델만 재정의(deep-merge 예시):

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

## 인바운드 통화

인바운드 정책 기본값은 `disabled`입니다. 인바운드 통화를 활성화하려면 다음을 설정하세요.

```json5
{
  inboundPolicy: "allowlist",
  allowFrom: ["+15550001234"],
  inboundGreeting: "안녕하세요! 무엇을 도와드릴까요?",
}
```

`inboundPolicy: "allowlist"`는 낮은 보증 수준의 발신자 ID 필터입니다. Plugin은
provider가 제공한 `From` 값을 정규화한 뒤 `allowFrom`과 비교합니다.
Webhook 검증은 provider 전달과 페이로드 무결성을 인증하지만,
PSTN/VoIP 발신 번호의 실제 소유권을 증명하지는 않습니다. `allowFrom`은
강한 발신자 ID가 아니라 발신자 ID 필터링으로 취급하세요.

자동 응답은 에이전트 시스템을 사용합니다. 다음으로 조정하세요.

- `responseModel`
- `responseSystemPrompt`
- `responseTimeoutMs`

### 음성 출력 계약

자동 응답의 경우 Voice Call은 시스템 프롬프트에 엄격한 음성 출력 계약을 추가합니다.

- `{"spoken":"..."}`

그런 다음 Voice Call은 방어적으로 음성 텍스트를 추출합니다.

- reasoning/error 콘텐츠로 표시된 페이로드는 무시합니다.
- 직접 JSON, fenced JSON, 또는 인라인 `"spoken"` 키를 파싱합니다.
- 일반 텍스트로 폴백하고, 계획/메타처럼 보이는 도입 문단은 제거합니다.

이렇게 하면 음성 재생이 발신자에게 들려줄 텍스트에 집중되고, 계획 텍스트가 오디오로 유출되는 것을 방지할 수 있습니다.

### 대화 시작 동작

아웃바운드 `conversation` 통화에서는 첫 메시지 처리가 실제 재생 상태와 연결됩니다.

- barge-in 큐 비우기와 자동 응답은 초기 인사말이 실제로 재생 중일 때만 억제됩니다.
- 초기 재생이 실패하면 통화는 `listening`으로 돌아가고 초기 메시지는 재시도를 위해 큐에 남습니다.
- Twilio 스트리밍의 초기 재생은 스트림 연결 시 추가 지연 없이 시작됩니다.

### Twilio 스트림 연결 해제 유예

Twilio 미디어 스트림이 연결 해제되면 Voice Call은 자동 종료 전에 `2000ms`를 기다립니다.

- 그 창 안에 스트림이 다시 연결되면 자동 종료는 취소됩니다.
- 유예 기간 후에도 스트림이 다시 등록되지 않으면 멈춘 활성 통화를 방지하기 위해 통화를 종료합니다.

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

`latency`는 기본 voice-call 저장 경로의 `calls.jsonl`을 읽습니다.
다른 로그를 가리키려면 `--file <path>`를 사용하고, 분석을 마지막 N개 레코드로 제한하려면 `--last <n>`을 사용하세요(기본값 200). 출력에는 턴 지연 시간과 listen-wait 시간의 p50/p90/p99가 포함됩니다.

## 에이전트 도구

도구 이름: `voice_call`

작업:

- `initiate_call` (`message`, `to?`, `mode?`)
- `continue_call` (`callId`, `message`)
- `speak_to_user` (`callId`, `message`)
- `send_dtmf` (`callId`, `digits`)
- `end_call` (`callId`)
- `get_status` (`callId`)

이 repo에는 일치하는 skill 문서가 `skills/voice-call/SKILL.md`에 포함되어 있습니다.

## Gateway RPC

- `voicecall.initiate` (`to?`, `message`, `mode?`)
- `voicecall.continue` (`callId`, `message`)
- `voicecall.speak` (`callId`, `message`)
- `voicecall.dtmf` (`callId`, `digits`)
- `voicecall.end` (`callId`)
- `voicecall.status` (`callId`)

## 관련 항목

- [텍스트 음성 변환](/ko/tools/tts)
- [Talk 모드](/ko/nodes/talk)
- [음성 웨이크](/ko/nodes/voicewake)
