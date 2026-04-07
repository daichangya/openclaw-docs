---
read_when:
    - OpenClaw에서 OpenAI 모델을 사용하려는 경우
    - API 키 대신 Codex 구독 인증을 사용하려는 경우
summary: OpenClaw에서 API 키 또는 Codex 구독으로 OpenAI 사용
title: OpenAI
x-i18n:
    generated_at: "2026-04-07T06:01:33Z"
    model: gpt-5.4
    provider: openai
    source_hash: 6a2ce1ce5f085fe55ec50b8d20359180b9002c9730820cd5b0e011c3bf807b64
    source_path: providers/openai.md
    workflow: 15
---

# OpenAI

OpenAI는 GPT 모델용 개발자 API를 제공합니다. Codex는 구독 기반 액세스를 위한 **ChatGPT 로그인** 또는 사용량 기반 액세스를 위한 **API 키** 로그인을 지원합니다. Codex cloud에는 ChatGPT 로그인이 필요합니다.
OpenAI는 OpenClaw와 같은 외부 도구/워크플로에서의 구독 OAuth 사용을 명시적으로 지원합니다.

## 기본 상호작용 스타일

OpenClaw는 `openai/*` 및
`openai-codex/*` 실행 모두에 대해 OpenAI 전용 프롬프트 오버레이를 소량 추가할 수 있습니다. 기본적으로 이 오버레이는 기본 OpenClaw 시스템 프롬프트를 대체하지 않으면서,
어시스턴트가 따뜻하고,
협업적이며, 간결하고, 직접적이고, 약간 더 감정 표현이 풍부하도록
유지합니다. 이 친화적 오버레이는 전체
출력을 간결하게 유지하면서, 자연스럽게 어울릴 때 가끔 이모지도 허용합니다.

구성 키:

`plugins.entries.openai.config.personality`

허용 값:

- `"friendly"`: 기본값, OpenAI 전용 오버레이를 활성화합니다.
- `"on"`: `"friendly"`의 별칭입니다.
- `"off"`: 오버레이를 비활성화하고 기본 OpenClaw 프롬프트만 사용합니다.

범위:

- `openai/*` 모델에 적용됩니다.
- `openai-codex/*` 모델에 적용됩니다.
- 다른 provider에는 영향을 주지 않습니다.

이 동작은 기본적으로 활성화되어 있습니다. 향후 로컬 구성 변경이 있더라도
이 설정을 유지하려면 `"friendly"`를 명시적으로 유지하세요.

```json5
{
  plugins: {
    entries: {
      openai: {
        config: {
          personality: "friendly",
        },
      },
    },
  },
}
```

### OpenAI 프롬프트 오버레이 비활성화

수정되지 않은 기본 OpenClaw 프롬프트를 원하면 오버레이를 `"off"`로 설정하세요.

```json5
{
  plugins: {
    entries: {
      openai: {
        config: {
          personality: "off",
        },
      },
    },
  },
}
```

config CLI로 직접 설정할 수도 있습니다.

```bash
openclaw config set plugins.entries.openai.config.personality off
```

OpenClaw는 런타임에 이 설정을 대소문자를 구분하지 않고 정규화하므로,
`"Off"` 같은 값도 친화적 오버레이를 비활성화합니다.

## 옵션 A: OpenAI API 키 (OpenAI Platform)

**가장 적합한 경우:** 직접 API 액세스 및 사용량 기반 과금.
OpenAI 대시보드에서 API 키를 가져오세요.

라우트 요약:

- `openai/gpt-5.4` = 직접 OpenAI Platform API 라우트
- `OPENAI_API_KEY`(또는 동등한 OpenAI provider 구성)가 필요합니다
- OpenClaw에서 ChatGPT/Codex 로그인은 `openai/*`가 아니라 `openai-codex/*`를 통해 라우팅됩니다

### CLI 설정

```bash
openclaw onboard --auth-choice openai-api-key
# 또는 비대화형
openclaw onboard --openai-api-key "$OPENAI_API_KEY"
```

### 구성 스니펫

```json5
{
  env: { OPENAI_API_KEY: "sk-..." },
  agents: { defaults: { model: { primary: "openai/gpt-5.4" } } },
}
```

OpenAI의 현재 API 모델 문서는 직접
OpenAI API 사용을 위해 `gpt-5.4` 및 `gpt-5.4-pro`를 나열합니다. OpenClaw는 둘 다 `openai/*` Responses 경로를 통해 전달합니다.
OpenClaw는 오래된 `openai/gpt-5.3-codex-spark` 항목을 의도적으로 숨깁니다.
직접 OpenAI API 호출이 실제 트래픽에서 이를 거부하기 때문입니다.

OpenClaw는 직접 OpenAI
API 경로에서 `openai/gpt-5.3-codex-spark`를 노출하지 않습니다. `pi-ai`는 여전히 해당 모델에 대한 기본 제공 항목을 포함하지만, 실제 OpenAI API
요청은 현재 이를 거부합니다. OpenClaw에서는 Spark를 Codex 전용으로 취급합니다.

## 이미지 생성

번들된 `openai` plugin은 공유
`image_generate` 도구를 통해 이미지 생성도 등록합니다.

- 기본 이미지 모델: `openai/gpt-image-1`
- 생성: 요청당 최대 4개 이미지
- 편집 모드: 활성화됨, 최대 5개의 참조 이미지
- `size` 지원
- 현재 OpenAI 전용 주의사항: OpenClaw는 현재 `aspectRatio` 또는
  `resolution` 재정의를 OpenAI Images API로 전달하지 않습니다

OpenAI를 기본 이미지 provider로 사용하려면:

```json5
{
  agents: {
    defaults: {
      imageGenerationModel: {
        primary: "openai/gpt-image-1",
      },
    },
  },
}
```

공유 도구
매개변수, provider 선택, 장애 조치 동작은 [이미지 생성](/ko/tools/image-generation)을 참고하세요.

## 비디오 생성

번들된 `openai` plugin은 공유
`video_generate` 도구를 통해 비디오 생성도 등록합니다.

- 기본 비디오 모델: `openai/sora-2`
- 모드: 텍스트-투-비디오, 이미지-투-비디오, 단일 비디오 참조/편집 흐름
- 현재 제한: 이미지 1개 또는 비디오 참조 입력 1개
- 현재 OpenAI 전용 주의사항: OpenClaw는 현재 네이티브 OpenAI 비디오 생성을 위해 `size`
  재정의만 전달합니다. `aspectRatio`, `resolution`, `audio`, `watermark`와 같은 지원되지 않는 선택적 재정의는 무시되며
  도구 경고로 다시 보고됩니다.

OpenAI를 기본 비디오 provider로 사용하려면:

```json5
{
  agents: {
    defaults: {
      videoGenerationModel: {
        primary: "openai/sora-2",
      },
    },
  },
}
```

공유 도구
매개변수, provider 선택, 장애 조치 동작은 [비디오 생성](/ko/tools/video-generation)을 참고하세요.

## 옵션 B: OpenAI Code (Codex) 구독

**가장 적합한 경우:** API 키 대신 ChatGPT/Codex 구독 액세스를 사용하는 경우.
Codex cloud에는 ChatGPT 로그인이 필요하며, Codex CLI는 ChatGPT 또는 API 키 로그인을 지원합니다.

라우트 요약:

- `openai-codex/gpt-5.4` = ChatGPT/Codex OAuth 라우트
- 직접 OpenAI Platform API 키가 아니라 ChatGPT/Codex 로그인을 사용합니다
- `openai-codex/*`의 provider 측 제한은 ChatGPT 웹/앱 경험과 다를 수 있습니다

### CLI 설정 (Codex OAuth)

```bash
# 마법사에서 Codex OAuth 실행
openclaw onboard --auth-choice openai-codex

# 또는 OAuth를 직접 실행
openclaw models auth login --provider openai-codex
```

### 구성 스니펫 (Codex 구독)

```json5
{
  agents: { defaults: { model: { primary: "openai-codex/gpt-5.4" } } },
}
```

OpenAI의 현재 Codex 문서는 현재 Codex 모델로 `gpt-5.4`를 나열합니다. OpenClaw는
ChatGPT/Codex OAuth 사용을 위해 이를 `openai-codex/gpt-5.4`에 매핑합니다.

이 경로는 `openai/gpt-5.4`와 의도적으로 분리되어 있습니다. 직접
OpenAI Platform API 경로를 원하면 API 키와 함께 `openai/*`를 사용하세요. ChatGPT/Codex 로그인
을 원하면 `openai-codex/*`를 사용하세요.

온보딩이 기존 Codex CLI 로그인을 재사용하는 경우, 해당 자격 증명은 계속
Codex CLI에서 관리됩니다. 만료되면 OpenClaw는 먼저 외부 Codex 소스를 다시 읽고,
provider가 이를 새로 고칠 수 있는 경우 별도의 OpenClaw 전용
복사본에서 소유권을 가져오는 대신 새로 고친 자격 증명을 다시 Codex 저장소에 기록합니다.

Codex Spark에 대한 권한이 있는 Codex 계정이라면 OpenClaw는 다음도 지원합니다.

- `openai-codex/gpt-5.3-codex-spark`

OpenClaw는 Codex Spark를 Codex 전용으로 취급합니다. 직접
`openai/gpt-5.3-codex-spark` API 키 경로는 노출하지 않습니다.

OpenClaw는 `pi-ai`가
`openai-codex/gpt-5.3-codex-spark`를 발견했을 때도 이를 유지합니다. 이를 권한 의존적이고 실험적인 것으로 취급하세요. Codex Spark는
GPT-5.4 `/fast`와 별개이며, 사용 가능 여부는 로그인한 Codex /
ChatGPT 계정에 따라 달라집니다.

### Codex 컨텍스트 창 상한

OpenClaw는 Codex 모델 메타데이터와 런타임 컨텍스트 상한을 별도의
값으로 취급합니다.

`openai-codex/gpt-5.4`의 경우:

- 네이티브 `contextWindow`: `1050000`
- 기본 런타임 `contextTokens` 상한: `272000`

이렇게 하면 모델 메타데이터는 사실대로 유지하면서 실제로 더 나은 지연 시간과 품질 특성을 보이는 더 작은 기본 런타임
창을 유지할 수 있습니다.

다른 유효 상한을 원하면 `models.providers.<provider>.models[].contextTokens`를 설정하세요.

```json5
{
  models: {
    providers: {
      "openai-codex": {
        models: [
          {
            id: "gpt-5.4",
            contextTokens: 160000,
          },
        ],
      },
    },
  },
}
```

네이티브 모델
메타데이터를 선언하거나 재정의할 때만 `contextWindow`를 사용하세요. 런타임 컨텍스트 예산을 제한하려면 `contextTokens`를 사용하세요.

### 기본 전송 방식

OpenClaw는 모델 스트리밍에 `pi-ai`를 사용합니다. `openai/*`와
`openai-codex/*` 모두에서 기본 전송 방식은 `"auto"`입니다(먼저 WebSocket, 이후 SSE
대체).

`"auto"` 모드에서 OpenClaw는 SSE로 대체하기 전에
초기 단계의 재시도 가능한 WebSocket 실패도 한 번 재시도합니다. 강제 `"websocket"` 모드는 여전히 대체 뒤에 숨기지 않고 전송 오류를 직접 표시합니다.

`"auto"` 모드에서 연결 또는 초기 턴 WebSocket 실패가 발생한 후 OpenClaw는
약 60초 동안 해당 세션의 WebSocket 경로를 성능 저하 상태로 표시하고,
전송 방식 사이를 반복 전환하는 대신 냉각 시간 동안 이후 턴을 SSE로 전송합니다.

네이티브 OpenAI 계열 엔드포인트(`openai/*`, `openai-codex/*`, 그리고 Azure
OpenAI Responses)의 경우 OpenClaw는 요청에 안정적인 세션 및 턴 식별 상태도 첨부하여
재시도, 재연결, SSE 대체가 동일한
대화 식별성에 맞춰 유지되도록 합니다. 네이티브 OpenAI 계열 라우트에서는 여기에 안정적인
세션/턴 요청 식별 헤더와 일치하는 전송 메타데이터가 포함됩니다.

OpenClaw는 또한 전송 방식 변형 전반에서 OpenAI 사용량 카운터를
세션/상태 표시 영역에 도달하기 전에 정규화합니다. 네이티브 OpenAI/Codex Responses 트래픽은
사용량을 `input_tokens` / `output_tokens` 또는
`prompt_tokens` / `completion_tokens`로 보고할 수 있습니다. OpenClaw는 이를 `/status`, `/usage`, 세션 로그에 대해 동일한 입력
및 출력 카운터로 취급합니다. 네이티브
WebSocket 트래픽에서 `total_tokens`가 누락되거나(`0`으로 보고되거나) 하면, OpenClaw는
정규화된 입력 + 출력 합계로 대체하여 세션/상태 표시가 계속 채워지도록 합니다.

`agents.defaults.models.<provider/model>.params.transport`를 설정할 수 있습니다.

- `"sse"`: SSE 강제 사용
- `"websocket"`: WebSocket 강제 사용
- `"auto"`: WebSocket을 시도한 뒤 SSE로 대체

`openai/*`(Responses API)의 경우 WebSocket 전송이 사용되면 OpenClaw는
기본적으로 WebSocket 워밍업도 활성화합니다(`openaiWsWarmup: true`).

관련 OpenAI 문서:

- [WebSocket을 사용한 Realtime API](https://platform.openai.com/docs/guides/realtime-websocket)
- [스트리밍 API 응답(SSE)](https://platform.openai.com/docs/guides/streaming-responses)

```json5
{
  agents: {
    defaults: {
      model: { primary: "openai-codex/gpt-5.4" },
      models: {
        "openai-codex/gpt-5.4": {
          params: {
            transport: "auto",
          },
        },
      },
    },
  },
}
```

### OpenAI WebSocket 워밍업

OpenAI 문서는 워밍업을 선택 사항으로 설명합니다. OpenClaw는
WebSocket 전송 사용 시 첫 턴 지연 시간을 줄이기 위해 `openai/*`에 대해 기본적으로 이를 활성화합니다.

### 워밍업 비활성화

```json5
{
  agents: {
    defaults: {
      models: {
        "openai/gpt-5.4": {
          params: {
            openaiWsWarmup: false,
          },
        },
      },
    },
  },
}
```

### 워밍업 명시적 활성화

```json5
{
  agents: {
    defaults: {
      models: {
        "openai/gpt-5.4": {
          params: {
            openaiWsWarmup: true,
          },
        },
      },
    },
  },
}
```

### OpenAI 및 Codex 우선 처리

OpenAI의 API는 `service_tier=priority`를 통해 우선 처리를 노출합니다. OpenClaw에서는
네이티브 OpenAI/Codex Responses 엔드포인트에서 이 필드를 전달하려면 `agents.defaults.models["<provider>/<model>"].params.serviceTier`
를 설정하세요.

```json5
{
  agents: {
    defaults: {
      models: {
        "openai/gpt-5.4": {
          params: {
            serviceTier: "priority",
          },
        },
        "openai-codex/gpt-5.4": {
          params: {
            serviceTier: "priority",
          },
        },
      },
    },
  },
}
```

지원되는 값은 `auto`, `default`, `flex`, `priority`입니다.

OpenClaw는 `params.serviceTier`를 직접 `openai/*` Responses
요청과 `openai-codex/*` Codex Responses 요청 모두에 전달합니다. 해당 모델이
네이티브 OpenAI/Codex 엔드포인트를 가리킬 때 적용됩니다.

중요한 동작:

- 직접 `openai/*`는 `api.openai.com`을 대상으로 해야 합니다
- `openai-codex/*`는 `chatgpt.com/backend-api`를 대상으로 해야 합니다
- 다른 기본 URL 또는 프록시를 통해 두 provider 중 하나를 라우팅하면, OpenClaw는 `service_tier`를 그대로 둡니다

### OpenAI fast 모드

OpenClaw는 `openai/*`와
`openai-codex/*` 세션 모두에 대해 공유 fast-mode 토글을 노출합니다.

- Chat/UI: `/fast status|on|off`
- 구성: `agents.defaults.models["<provider>/<model>"].params.fastMode`

fast 모드가 활성화되면 OpenClaw는 이를 OpenAI 우선 처리로 매핑합니다.

- `api.openai.com`으로 가는 직접 `openai/*` Responses 호출은 `service_tier = "priority"`를 전송합니다
- `chatgpt.com/backend-api`로 가는 `openai-codex/*` Responses 호출도 `service_tier = "priority"`를 전송합니다
- 기존 페이로드 `service_tier` 값은 유지됩니다
- fast 모드는 `reasoning` 또는 `text.verbosity`를 재작성하지 않습니다

특히 GPT 5.4의 경우 가장 일반적인 설정은 다음과 같습니다.

- `openai/gpt-5.4` 또는 `openai-codex/gpt-5.4`를 사용하는 세션에서 `/fast on` 전송
- 또는 `agents.defaults.models["openai/gpt-5.4"].params.fastMode = true` 설정
- Codex OAuth도 사용하는 경우 `agents.defaults.models["openai-codex/gpt-5.4"].params.fastMode = true`도 함께 설정

예시:

```json5
{
  agents: {
    defaults: {
      models: {
        "openai/gpt-5.4": {
          params: {
            fastMode: true,
          },
        },
        "openai-codex/gpt-5.4": {
          params: {
            fastMode: true,
          },
        },
      },
    },
  },
}
```

세션 재정의가 구성보다 우선합니다. Sessions UI에서 세션 재정의를 지우면
세션은 구성된 기본값으로 돌아갑니다.

### 네이티브 OpenAI와 OpenAI 호환 라우트 비교

OpenClaw는 직접 OpenAI, Codex, Azure OpenAI 엔드포인트를
일반적인 OpenAI 호환 `/v1` 프록시와 다르게 취급합니다.

- 네이티브 `openai/*`, `openai-codex/*`, Azure OpenAI 라우트는
  사용자가 명시적으로 reasoning을 비활성화할 때 `reasoning: { effort: "none" }`를 그대로 유지합니다
- 네이티브 OpenAI 계열 라우트는 도구 스키마를 기본적으로 strict 모드로 설정합니다
- 숨겨진 OpenClaw attribution 헤더(`originator`, `version`, `User-Agent`)는 검증된 네이티브 OpenAI 호스트
  (`api.openai.com`) 및 네이티브 Codex 호스트(`chatgpt.com/backend-api`)에만 첨부됩니다
- 네이티브 OpenAI/Codex 라우트는
  `service_tier`, Responses `store`, OpenAI reasoning 호환 페이로드,
  프롬프트 캐시 힌트와 같은 OpenAI 전용 요청 형성을 유지합니다
- 프록시 스타일 OpenAI 호환 라우트는 더 느슨한 호환 동작을 유지하며
  strict 도구 스키마, 네이티브 전용 요청 형성, 숨겨진
  OpenAI/Codex attribution 헤더를 강제하지 않습니다

Azure OpenAI는 전송 및 호환
동작 측면에서는 네이티브 라우팅 범주에 남아 있지만, 숨겨진 OpenAI/Codex attribution 헤더는 받지 않습니다.

이렇게 하면 현재 네이티브 OpenAI Responses 동작을 유지하면서도,
오래된 OpenAI 호환 shim을 서드파티 `/v1` 백엔드에 강제하지 않습니다.

### OpenAI Responses 서버 측 압축

직접 OpenAI Responses 모델(`api.openai.com`의 `api: "openai-responses"`를 사용하는 `openai/*`)의 경우 OpenClaw는 이제 OpenAI 서버 측
압축 페이로드 힌트를 자동 활성화합니다.

- `store: true`를 강제합니다(`model compat`가 `supportsStore: false`를 설정하지 않는 한)
- `context_management: [{ type: "compaction", compact_threshold: ... }]`를 주입합니다

기본적으로 `compact_threshold`는 모델 `contextWindow`의 `70%`입니다(없을 경우 `80000`).

### 서버 측 압축 명시적 활성화

호환되는
Responses 모델(예: Azure OpenAI Responses)에 `context_management` 주입을 강제하려는 경우 사용하세요.

```json5
{
  agents: {
    defaults: {
      models: {
        "azure-openai-responses/gpt-5.4": {
          params: {
            responsesServerCompaction: true,
          },
        },
      },
    },
  },
}
```

### 사용자 지정 임계값으로 활성화

```json5
{
  agents: {
    defaults: {
      models: {
        "openai/gpt-5.4": {
          params: {
            responsesServerCompaction: true,
            responsesCompactThreshold: 120000,
          },
        },
      },
    },
  },
}
```

### 서버 측 압축 비활성화

```json5
{
  agents: {
    defaults: {
      models: {
        "openai/gpt-5.4": {
          params: {
            responsesServerCompaction: false,
          },
        },
      },
    },
  },
}
```

`responsesServerCompaction`은 `context_management` 주입만 제어합니다.
직접 OpenAI Responses 모델은 `compat`가
`supportsStore: false`를 설정하지 않는 한 여전히 `store: true`를 강제합니다.

## 참고

- 모델 ref는 항상 `provider/model`을 사용합니다([/concepts/models](/ko/concepts/models) 참고).
- 인증 세부 정보 및 재사용 규칙은 [/concepts/oauth](/ko/concepts/oauth)에 있습니다.
