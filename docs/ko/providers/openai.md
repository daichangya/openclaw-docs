---
read_when:
    - OpenClaw에서 OpenAI 모델을 사용하려고 합니다
    - API 키 대신 Codex 구독 인증을 사용하려고 합니다
    - 더 엄격한 GPT-5 에이전트 실행 동작이 필요합니다
summary: API 키 또는 Codex 구독을 통해 OpenAI를 OpenClaw에서 사용하기
title: OpenAI
x-i18n:
    generated_at: "2026-04-21T06:08:12Z"
    model: gpt-5.4
    provider: openai
    source_hash: 172beb28b099e3d71998458408c9a6b32b03790d2b016351f724bc3f0d9d3245
    source_path: providers/openai.md
    workflow: 15
---

# OpenAI

OpenAI는 GPT 모델용 개발자 API를 제공합니다. OpenClaw는 두 가지 인증 경로를 지원합니다.

- **API key** — 사용량 기반 과금이 적용되는 직접 OpenAI Platform 접근 (`openai/*` 모델)
- **Codex subscription** — 구독 접근이 적용되는 ChatGPT/Codex 로그인 (`openai-codex/*` 모델)

OpenAI는 OpenClaw 같은 외부 도구 및 워크플로에서의 구독 OAuth 사용을 명시적으로 지원합니다.

## 시작하기

선호하는 인증 방법을 선택하고 설정 단계를 따르세요.

<Tabs>
  <Tab title="API key (OpenAI Platform)">
    **권장 대상:** 직접 API에 접근하고 사용량 기반 과금을 사용하는 경우.

    <Steps>
      <Step title="API 키 가져오기">
        [OpenAI Platform 대시보드](https://platform.openai.com/api-keys)에서 API 키를 생성하거나 복사하세요.
      </Step>
      <Step title="온보딩 실행">
        ```bash
        openclaw onboard --auth-choice openai-api-key
        ```

        또는 키를 직접 전달하세요:

        ```bash
        openclaw onboard --openai-api-key "$OPENAI_API_KEY"
        ```
      </Step>
      <Step title="모델 사용 가능 여부 확인">
        ```bash
        openclaw models list --provider openai
        ```
      </Step>
    </Steps>

    ### 경로 요약

    | Model ref | 경로 | 인증 |
    |-----------|-------|------|
    | `openai/gpt-5.4` | 직접 OpenAI Platform API | `OPENAI_API_KEY` |
    | `openai/gpt-5.4-pro` | 직접 OpenAI Platform API | `OPENAI_API_KEY` |

    <Note>
    ChatGPT/Codex 로그인은 `openai/*`가 아니라 `openai-codex/*`를 통해 라우팅됩니다.
    </Note>

    ### 구성 예시

    ```json5
    {
      env: { OPENAI_API_KEY: "sk-..." },
      agents: { defaults: { model: { primary: "openai/gpt-5.4" } } },
    }
    ```

    <Warning>
    OpenClaw는 직접 API 경로에서 `openai/gpt-5.3-codex-spark`를 노출하지 않습니다. 실제 OpenAI API 요청은 해당 모델을 거부합니다. Spark는 Codex 전용입니다.
    </Warning>

  </Tab>

  <Tab title="Codex subscription">
    **권장 대상:** 별도의 API 키 대신 ChatGPT/Codex 구독을 사용하는 경우. Codex 클라우드는 ChatGPT 로그인이 필요합니다.

    <Steps>
      <Step title="Codex OAuth 실행">
        ```bash
        openclaw onboard --auth-choice openai-codex
        ```

        또는 OAuth를 직접 실행하세요:

        ```bash
        openclaw models auth login --provider openai-codex
        ```
      </Step>
      <Step title="기본 모델 설정">
        ```bash
        openclaw config set agents.defaults.model.primary openai-codex/gpt-5.4
        ```
      </Step>
      <Step title="모델 사용 가능 여부 확인">
        ```bash
        openclaw models list --provider openai-codex
        ```
      </Step>
    </Steps>

    ### 경로 요약

    | Model ref | 경로 | 인증 |
    |-----------|-------|------|
    | `openai-codex/gpt-5.4` | ChatGPT/Codex OAuth | Codex 로그인 |
    | `openai-codex/gpt-5.3-codex-spark` | ChatGPT/Codex OAuth | Codex 로그인 (권한에 따라 다름) |

    <Note>
    이 경로는 `openai/gpt-5.4`와 의도적으로 분리되어 있습니다. 직접 Platform 접근에는 API 키와 함께 `openai/*`를 사용하고, Codex 구독 접근에는 `openai-codex/*`를 사용하세요.
    </Note>

    ### 구성 예시

    ```json5
    {
      agents: { defaults: { model: { primary: "openai-codex/gpt-5.4" } } },
    }
    ```

    <Tip>
    온보딩이 기존 Codex CLI 로그인을 재사용하면 해당 자격 증명은 Codex CLI가 계속 관리합니다. 만료 시 OpenClaw는 먼저 외부 Codex 소스를 다시 읽고, 새로 고쳐진 자격 증명을 Codex 저장소에 다시 기록합니다.
    </Tip>

    ### 컨텍스트 윈도우 상한

    OpenClaw는 모델 메타데이터와 런타임 컨텍스트 상한을 별도의 값으로 취급합니다.

    `openai-codex/gpt-5.4`의 경우:

    - 기본 `contextWindow`: `1050000`
    - 기본 런타임 `contextTokens` 상한: `272000`

    실제로는 더 작은 기본 상한이 지연 시간과 품질 측면에서 더 나은 특성을 보입니다. `contextTokens`로 override할 수 있습니다.

    ```json5
    {
      models: {
        providers: {
          "openai-codex": {
            models: [{ id: "gpt-5.4", contextTokens: 160000 }],
          },
        },
      },
    }
    ```

    <Note>
    기본 모델 메타데이터를 선언할 때는 `contextWindow`를 사용하세요. 런타임 컨텍스트 예산을 제한할 때는 `contextTokens`를 사용하세요.
    </Note>

  </Tab>
</Tabs>

## 이미지 생성

번들된 `openai` Plugin은 `image_generate` 도구를 통해 이미지 생성을 등록합니다.

| 기능                      | 값                                 |
| ------------------------- | ---------------------------------- |
| 기본 모델                 | `openai/gpt-image-1`               |
| 요청당 최대 이미지 수     | 4                                  |
| 편집 모드                 | 활성화됨(참조 이미지 최대 5개)     |
| 크기 override             | 지원됨                             |
| 종횡비 / 해상도           | OpenAI Images API로 전달되지 않음  |

```json5
{
  agents: {
    defaults: {
      imageGenerationModel: { primary: "openai/gpt-image-1" },
    },
  },
}
```

<Note>
공통 도구 매개변수, provider 선택, failover 동작은 [이미지 생성](/ko/tools/image-generation)을 참고하세요.
</Note>

## 비디오 생성

번들된 `openai` Plugin은 `video_generate` 도구를 통해 비디오 생성을 등록합니다.

| 기능             | 값                                                                                |
| ---------------- | --------------------------------------------------------------------------------- |
| 기본 모델        | `openai/sora-2`                                                                   |
| 모드             | 텍스트-비디오, 이미지-비디오, 단일 비디오 편집                                   |
| 참조 입력        | 이미지 1개 또는 비디오 1개                                                        |
| 크기 override    | 지원됨                                                                            |
| 기타 override    | `aspectRatio`, `resolution`, `audio`, `watermark`는 도구 경고와 함께 무시됨      |

```json5
{
  agents: {
    defaults: {
      videoGenerationModel: { primary: "openai/sora-2" },
    },
  },
}
```

<Note>
공통 도구 매개변수, provider 선택, failover 동작은 [비디오 생성](/ko/tools/video-generation)을 참고하세요.
</Note>

## GPT-5 프롬프트 기여

OpenClaw는 `openai/*` 및 `openai-codex/*` GPT-5 계열 실행에 대해 OpenAI 전용 GPT-5 프롬프트 기여를 추가합니다. 이 기여는 번들된 OpenAI Plugin에 포함되어 있으며, `gpt-5`, `gpt-5.2`, `gpt-5.4`, `gpt-5.4-mini` 같은 모델 ID에 적용되고, 이전 GPT-4.x 모델에는 적용되지 않습니다.

GPT-5 기여는 페르소나 지속성, 실행 안전성, 도구 규율, 출력 형식, 완료 검사, 검증에 대한 태그 기반 동작 계약을 추가합니다. 채널별 응답 및 silent-message 동작은 공용 OpenClaw 시스템 프롬프트와 아웃바운드 전달 정책에 그대로 남아 있습니다. GPT-5 가이드는 일치하는 모델에 대해 항상 활성화됩니다. 친화적인 상호작용 스타일 계층은 별개이며 구성 가능합니다.

| 값                     | 효과                                          |
| ---------------------- | --------------------------------------------- |
| `"friendly"` (기본값)  | 친화적인 상호작용 스타일 계층 활성화          |
| `"on"`                 | `"friendly"`의 별칭                           |
| `"off"`                | 친화적인 스타일 계층만 비활성화               |

<Tabs>
  <Tab title="Config">
    ```json5
    {
      plugins: {
        entries: {
          openai: { config: { personality: "friendly" } },
        },
      },
    }
    ```
  </Tab>
  <Tab title="CLI">
    ```bash
    openclaw config set plugins.entries.openai.config.personality off
    ```
  </Tab>
</Tabs>

<Tip>
값은 런타임에서 대소문자를 구분하지 않으므로 `"Off"`와 `"off"`는 모두 친화적인 스타일 계층을 비활성화합니다.
</Tip>

## 음성 및 speech

<AccordionGroup>
  <Accordion title="음성 합성 (TTS)">
    번들된 `openai` Plugin은 `messages.tts` 표면에 대해 음성 합성을 등록합니다.

    | 설정 | Config 경로 | 기본값 |
    |---------|------------|---------|
    | 모델 | `messages.tts.providers.openai.model` | `gpt-4o-mini-tts` |
    | 음성 | `messages.tts.providers.openai.voice` | `coral` |
    | 속도 | `messages.tts.providers.openai.speed` | (설정되지 않음) |
    | 지침 | `messages.tts.providers.openai.instructions` | (설정되지 않음, `gpt-4o-mini-tts` 전용) |
    | 형식 | `messages.tts.providers.openai.responseFormat` | 음성 노트는 `opus`, 파일은 `mp3` |
    | API 키 | `messages.tts.providers.openai.apiKey` | `OPENAI_API_KEY`로 fallback |
    | 기본 URL | `messages.tts.providers.openai.baseUrl` | `https://api.openai.com/v1` |

    사용 가능한 모델: `gpt-4o-mini-tts`, `tts-1`, `tts-1-hd`. 사용 가능한 음성: `alloy`, `ash`, `ballad`, `cedar`, `coral`, `echo`, `fable`, `juniper`, `marin`, `onyx`, `nova`, `sage`, `shimmer`, `verse`.

    ```json5
    {
      messages: {
        tts: {
          providers: {
            openai: { model: "gpt-4o-mini-tts", voice: "coral" },
          },
        },
      },
    }
    ```

    <Note>
    채팅 API 엔드포인트에 영향을 주지 않고 TTS 기본 URL을 override하려면 `OPENAI_TTS_BASE_URL`을 설정하세요.
    </Note>

  </Accordion>

  <Accordion title="실시간 전사">
    번들된 `openai` Plugin은 Voice Call Plugin에 대해 실시간 전사를 등록합니다.

    | 설정 | Config 경로 | 기본값 |
    |---------|------------|---------|
    | 모델 | `plugins.entries.voice-call.config.streaming.providers.openai.model` | `gpt-4o-transcribe` |
    | 무음 지속 시간 | `...openai.silenceDurationMs` | `800` |
    | VAD 임계값 | `...openai.vadThreshold` | `0.5` |
    | API 키 | `...openai.apiKey` | `OPENAI_API_KEY`로 fallback |

    <Note>
    `wss://api.openai.com/v1/realtime`에 대한 WebSocket 연결과 G.711 u-law 오디오를 사용합니다.
    </Note>

  </Accordion>

  <Accordion title="실시간 음성">
    번들된 `openai` Plugin은 Voice Call Plugin에 대해 실시간 음성을 등록합니다.

    | 설정 | Config 경로 | 기본값 |
    |---------|------------|---------|
    | 모델 | `plugins.entries.voice-call.config.realtime.providers.openai.model` | `gpt-realtime` |
    | 음성 | `...openai.voice` | `alloy` |
    | Temperature | `...openai.temperature` | `0.8` |
    | VAD 임계값 | `...openai.vadThreshold` | `0.5` |
    | 무음 지속 시간 | `...openai.silenceDurationMs` | `500` |
    | API 키 | `...openai.apiKey` | `OPENAI_API_KEY`로 fallback |

    <Note>
    `azureEndpoint` 및 `azureDeployment` config 키를 통해 Azure OpenAI를 지원합니다. 양방향 도구 호출을 지원합니다. G.711 u-law 오디오 형식을 사용합니다.
    </Note>

  </Accordion>
</AccordionGroup>

## 고급 구성

<AccordionGroup>
  <Accordion title="전송 (WebSocket 대 SSE)">
    OpenClaw는 `openai/*`와 `openai-codex/*` 모두에 대해 WebSocket 우선, SSE fallback(`"auto"`)을 사용합니다.

    `"auto"` 모드에서 OpenClaw는 다음과 같이 동작합니다.
    - 초기에 발생한 WebSocket 실패 1회를 재시도한 후 SSE로 fallback
    - 실패 후 약 60초 동안 WebSocket을 성능 저하 상태로 표시하고 cool-down 동안 SSE 사용
    - 재시도와 재연결을 위해 안정적인 세션 및 턴 ID 헤더를 첨부
    - 전송 방식 차이 전반에서 사용량 카운터(`input_tokens` / `prompt_tokens`)를 정규화

    | 값 | 동작 |
    |-------|----------|
    | `"auto"` (기본값) | WebSocket 우선, SSE fallback |
    | `"sse"` | SSE만 강제 |
    | `"websocket"` | WebSocket만 강제 |

    ```json5
    {
      agents: {
        defaults: {
          models: {
            "openai-codex/gpt-5.4": {
              params: { transport: "auto" },
            },
          },
        },
      },
    }
    ```

    관련 OpenAI 문서:
    - [Realtime API with WebSocket](https://platform.openai.com/docs/guides/realtime-websocket)
    - [Streaming API responses (SSE)](https://platform.openai.com/docs/guides/streaming-responses)

  </Accordion>

  <Accordion title="WebSocket 워밍업">
    OpenClaw는 첫 턴 지연 시간을 줄이기 위해 `openai/*`에 대해 기본적으로 WebSocket 워밍업을 활성화합니다.

    ```json5
    // 워밍업 비활성화
    {
      agents: {
        defaults: {
          models: {
            "openai/gpt-5.4": {
              params: { openaiWsWarmup: false },
            },
          },
        },
      },
    }
    ```

  </Accordion>

  <Accordion title="빠른 모드">
    OpenClaw는 `openai/*`와 `openai-codex/*` 모두에 대해 공통 빠른 모드 토글을 제공합니다.

    - **채팅/UI:** `/fast status|on|off`
    - **Config:** `agents.defaults.models["<provider>/<model>"].params.fastMode`

    활성화되면 OpenClaw는 빠른 모드를 OpenAI 우선 처리(`service_tier = "priority"`)에 매핑합니다. 기존 `service_tier` 값은 유지되며, 빠른 모드는 `reasoning`이나 `text.verbosity`를 다시 쓰지 않습니다.

    ```json5
    {
      agents: {
        defaults: {
          models: {
            "openai/gpt-5.4": { params: { fastMode: true } },
            "openai-codex/gpt-5.4": { params: { fastMode: true } },
          },
        },
      },
    }
    ```

    <Note>
    세션 override가 config보다 우선합니다. Sessions UI에서 세션 override를 지우면 세션은 구성된 기본값으로 돌아갑니다.
    </Note>

  </Accordion>

  <Accordion title="우선 처리 (service_tier)">
    OpenAI API는 `service_tier`를 통해 우선 처리를 제공합니다. OpenClaw에서는 모델별로 이를 설정할 수 있습니다.

    ```json5
    {
      agents: {
        defaults: {
          models: {
            "openai/gpt-5.4": { params: { serviceTier: "priority" } },
            "openai-codex/gpt-5.4": { params: { serviceTier: "priority" } },
          },
        },
      },
    }
    ```

    지원되는 값: `auto`, `default`, `flex`, `priority`.

    <Warning>
    `serviceTier`는 네이티브 OpenAI 엔드포인트(`api.openai.com`)와 네이티브 Codex 엔드포인트(`chatgpt.com/backend-api`)에만 전달됩니다. 두 provider 중 하나라도 프록시를 통해 라우팅하면 OpenClaw는 `service_tier`를 수정하지 않습니다.
    </Warning>

  </Accordion>

  <Accordion title="서버 측 Compaction (Responses API)">
    직접 OpenAI Responses 모델(`api.openai.com`의 `openai/*`)의 경우, OpenClaw는 서버 측 Compaction을 자동으로 활성화합니다.

    - `store: true`를 강제함(모델 compat가 `supportsStore: false`를 설정한 경우 제외)
    - `context_management: [{ type: "compaction", compact_threshold: ... }]`를 주입
    - 기본 `compact_threshold`: `contextWindow`의 70%(없을 경우 `80000`)

    <Tabs>
      <Tab title="명시적으로 활성화">
        Azure OpenAI Responses 같은 호환 엔드포인트에 유용합니다:

        ```json5
        {
          agents: {
            defaults: {
              models: {
                "azure-openai-responses/gpt-5.4": {
                  params: { responsesServerCompaction: true },
                },
              },
            },
          },
        }
        ```
      </Tab>
      <Tab title="사용자 지정 임계값">
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
      </Tab>
      <Tab title="비활성화">
        ```json5
        {
          agents: {
            defaults: {
              models: {
                "openai/gpt-5.4": {
                  params: { responsesServerCompaction: false },
                },
              },
            },
          },
        }
        ```
      </Tab>
    </Tabs>

    <Note>
    `responsesServerCompaction`은 `context_management` 주입만 제어합니다. 직접 OpenAI Responses 모델은 compat가 `supportsStore: false`를 설정하지 않는 한 여전히 `store: true`를 강제합니다.
    </Note>

  </Accordion>

  <Accordion title="엄격한 agentic GPT 모드">
    `openai/*` 및 `openai-codex/*`의 GPT-5 계열 실행에 대해 OpenClaw는 더 엄격한 내장 실행 계약을 사용할 수 있습니다.

    ```json5
    {
      agents: {
        defaults: {
          embeddedPi: { executionContract: "strict-agentic" },
        },
      },
    }
    ```

    `strict-agentic`를 사용하면 OpenClaw는 다음과 같이 동작합니다.
    - 도구 작업이 가능한 경우 계획만 있는 턴을 더 이상 성공적인 진행으로 취급하지 않음
    - 즉시 행동하도록 유도하는 steer로 해당 턴을 재시도
    - 상당한 작업에 대해 `update_plan`을 자동 활성화
    - 모델이 행동 없이 계속 계획만 세우면 명시적인 차단 상태를 표시

    <Note>
    OpenAI 및 Codex GPT-5 계열 실행에만 적용됩니다. 다른 provider와 이전 모델 계열은 기본 동작을 유지합니다.
    </Note>

  </Accordion>

  <Accordion title="네이티브 경로 대 OpenAI 호환 경로">
    OpenClaw는 직접 OpenAI, Codex, Azure OpenAI 엔드포인트를 일반 OpenAI 호환 `/v1` 프록시와 다르게 취급합니다.

    **네이티브 경로** (`openai/*`, `openai-codex/*`, Azure OpenAI):
    - OpenAI `none` effort를 지원하는 모델에 대해서만 `reasoning: { effort: "none" }` 유지
    - `reasoning.effort: "none"`를 거부하는 모델이나 프록시에서는 비활성화된 reasoning을 생략
    - 기본적으로 도구 스키마를 엄격 모드로 설정
    - 검증된 네이티브 호스트에만 숨겨진 attribution 헤더 첨부
    - OpenAI 전용 요청 형식화(`service_tier`, `store`, reasoning-compat, 프롬프트 캐시 힌트) 유지

    **프록시/호환 경로:**
    - 더 느슨한 compat 동작 사용
    - 엄격한 도구 스키마나 네이티브 전용 헤더를 강제하지 않음

    Azure OpenAI는 네이티브 전송 및 compat 동작을 사용하지만 숨겨진 attribution 헤더는 받지 않습니다.

  </Accordion>
</AccordionGroup>

## 관련 항목

<CardGroup cols={2}>
  <Card title="모델 선택" href="/ko/concepts/model-providers" icon="layers">
    provider, model ref, failover 동작 선택.
  </Card>
  <Card title="이미지 생성" href="/ko/tools/image-generation" icon="image">
    공통 이미지 도구 매개변수와 provider 선택.
  </Card>
  <Card title="비디오 생성" href="/ko/tools/video-generation" icon="video">
    공통 비디오 도구 매개변수와 provider 선택.
  </Card>
  <Card title="OAuth 및 인증" href="/ko/gateway/authentication" icon="key">
    인증 세부 사항과 자격 증명 재사용 규칙.
  </Card>
</CardGroup>
