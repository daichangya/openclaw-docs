---
read_when:
    - OpenClaw에서 OpenAI 모델을 사용하고 싶습니다
    - API 키 대신 Codex 구독 인증을 사용하고 싶습니다
    - 더 엄격한 GPT-5 에이전트 실행 동작이 필요합니다
summary: OpenClaw에서 API 키 또는 Codex 구독으로 OpenAI 사용하기
title: OpenAI
x-i18n:
    generated_at: "2026-04-23T06:07:46Z"
    model: gpt-5.4
    provider: openai
    source_hash: 775a937680731ff09181dd58d2be1ca1a751c9193ac299ba6657266490a6a9b7
    source_path: providers/openai.md
    workflow: 15
---

  # OpenAI

  OpenAI는 GPT 모델용 개발자 API를 제공합니다. OpenClaw는 두 가지 인증 경로를 지원합니다:

  - **API 키** — 사용량 기반 과금이 적용되는 직접 OpenAI Platform 액세스(`openai/*` 모델)
  - **Codex 구독** — 구독 액세스를 사용하는 ChatGPT/Codex 로그인(`openai-codex/*` 모델)

  OpenAI는 OpenClaw 같은 외부 도구 및 워크플로에서의 구독 OAuth 사용을 명시적으로 지원합니다.

  ## OpenClaw 기능 지원 범위

  | OpenAI 기능              | OpenClaw 표면                           | 상태                                                     |
  | ------------------------ | --------------------------------------- | -------------------------------------------------------- |
  | Chat / Responses         | `openai/<model>` 모델 provider          | 예                                                       |
  | Codex 구독 모델          | `openai-codex/<model>` 모델 provider    | 예                                                       |
  | 서버 측 웹 검색          | 네이티브 OpenAI Responses 도구          | 예, 웹 검색이 활성화되고 provider가 고정되지 않은 경우   |
  | 이미지                   | `image_generate`                        | 예                                                       |
  | 비디오                   | `video_generate`                        | 예                                                       |
  | 텍스트 음성 변환         | `messages.tts.provider: "openai"` / `tts` | 예                                                     |
  | 배치 음성-텍스트 변환    | `tools.media.audio` / 미디어 이해       | 예                                                       |
  | 스트리밍 음성-텍스트 변환 | Voice Call `streaming.provider: "openai"` | 예                                                     |
  | 실시간 음성              | Voice Call `realtime.provider: "openai"` | 예                                                      |
  | 임베딩                   | 메모리 임베딩 provider                  | 예                                                       |

  ## 시작하기

  원하는 인증 방식을 선택하고 설정 단계를 따르세요.

  <Tabs>
  <Tab title="API 키(OpenAI Platform)">
    **가장 적합한 경우:** 직접 API 액세스 및 사용량 기반 과금.

    <Steps>
      <Step title="API 키 가져오기">
        [OpenAI Platform dashboard](https://platform.openai.com/api-keys)에서 API 키를 생성하거나 복사하세요.
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
    |-----------|------|------|
    | `openai/gpt-5.4` | 직접 OpenAI Platform API | `OPENAI_API_KEY` |
    | `openai/gpt-5.4-pro` | 직접 OpenAI Platform API | `OPENAI_API_KEY` |

    <Note>
    ChatGPT/Codex 로그인은 `openai/*`가 아니라 `openai-codex/*`를 통해 라우팅됩니다.
    </Note>

    ### config 예시

    ```json5
    {
      env: { OPENAI_API_KEY: "sk-..." },
      agents: { defaults: { model: { primary: "openai/gpt-5.4" } } },
    }
    ```

    <Warning>
    OpenClaw는 직접 API 경로에서 `openai/gpt-5.3-codex-spark`를 **노출하지 않습니다**. 실제 OpenAI API 요청은 해당 모델을 거부합니다. Spark는 Codex 전용입니다.
    </Warning>

  </Tab>

  <Tab title="Codex 구독">
    **가장 적합한 경우:** 별도의 API 키 대신 ChatGPT/Codex 구독을 사용하는 경우. Codex 클라우드에는 ChatGPT 로그인이 필요합니다.

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
    |-----------|------|------|
    | `openai-codex/gpt-5.4` | ChatGPT/Codex OAuth | Codex 로그인 |
    | `openai-codex/gpt-5.3-codex-spark` | ChatGPT/Codex OAuth | Codex 로그인(권한에 따라 다름) |

    <Note>
    이 경로는 의도적으로 `openai/gpt-5.4`와 분리되어 있습니다. 직접 Platform 액세스에는 API 키와 함께 `openai/*`를 사용하고, Codex 구독 액세스에는 `openai-codex/*`를 사용하세요.
    </Note>

    ### config 예시

    ```json5
    {
      agents: { defaults: { model: { primary: "openai-codex/gpt-5.4" } } },
    }
    ```

    <Tip>
    온보딩이 기존 Codex CLI 로그인을 재사용하는 경우 해당 자격 증명은 Codex CLI가 계속 관리합니다. 만료 시 OpenClaw는 먼저 외부 Codex 소스를 다시 읽고, 갱신된 자격 증명을 다시 Codex 저장소에 기록합니다.
    </Tip>

    ### 컨텍스트 윈도우 상한

    OpenClaw는 모델 메타데이터와 런타임 컨텍스트 상한을 별도 값으로 취급합니다.

    `openai-codex/gpt-5.4`의 경우:

    - 네이티브 `contextWindow`: `1050000`
    - 기본 런타임 `contextTokens` 상한: `272000`

    더 작은 기본 상한은 실제로 더 나은 지연 시간과 품질 특성을 보입니다. `contextTokens`로 재정의할 수 있습니다:

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
    네이티브 모델 메타데이터를 선언할 때는 `contextWindow`를 사용하세요. 런타임 컨텍스트 예산을 제한할 때는 `contextTokens`를 사용하세요.
    </Note>

  </Tab>
</Tabs>

## 이미지 생성

번들 `openai` Plugin은 `image_generate` 도구를 통해 이미지 생성을 등록합니다.

| 기능                     | 값                                 |
| ------------------------ | ---------------------------------- |
| 기본 모델                | `openai/gpt-image-2`               |
| 요청당 최대 이미지 수    | 4                                  |
| 편집 모드                | 활성화됨(참조 이미지 최대 5개)     |
| 크기 재정의              | 지원됨, 2K/4K 크기 포함            |
| 종횡비 / 해상도          | OpenAI Images API로 전달되지 않음  |

```json5
{
  agents: {
    defaults: {
      imageGenerationModel: { primary: "openai/gpt-image-2" },
    },
  },
}
```

<Note>
공유 도구 매개변수, provider 선택, 폴백 동작은 [Image Generation](/ko/tools/image-generation)을 참조하세요.
</Note>

`gpt-image-2`는 OpenAI 텍스트-이미지 생성과 이미지
편집 모두의 기본값입니다. `gpt-image-1`도 명시적 모델 재정의로 계속 사용할 수 있지만, 새로운
OpenAI 이미지 워크플로에는 `openai/gpt-image-2`를 사용해야 합니다.

생성:

```
/tool image_generate model=openai/gpt-image-2 prompt="A polished launch poster for OpenClaw on macOS" size=3840x2160 count=1
```

편집:

```
/tool image_generate model=openai/gpt-image-2 prompt="Preserve the object shape, change the material to translucent glass" image=/path/to/reference.png size=1024x1536
```

## 비디오 생성

번들 `openai` Plugin은 `video_generate` 도구를 통해 비디오 생성을 등록합니다.

| 기능              | 값                                                                                |
| ----------------- | --------------------------------------------------------------------------------- |
| 기본 모델         | `openai/sora-2`                                                                   |
| 모드              | 텍스트-비디오, 이미지-비디오, 단일 비디오 편집                                    |
| 참조 입력         | 이미지 1개 또는 비디오 1개                                                         |
| 크기 재정의       | 지원됨                                                                            |
| 기타 재정의       | `aspectRatio`, `resolution`, `audio`, `watermark`는 도구 경고와 함께 무시됩니다   |

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
공유 도구 매개변수, provider 선택, 폴백 동작은 [Video Generation](/ko/tools/video-generation)을 참조하세요.
</Note>

## GPT-5 프롬프트 기여

OpenClaw는 provider 전반에서 GPT-5 계열 실행에 대해 공유 GPT-5 프롬프트 기여를 추가합니다. 이는 모델 id 기준으로 적용되므로 `openai/gpt-5.4`, `openai-codex/gpt-5.4`, `openrouter/openai/gpt-5.4`, `opencode/gpt-5.4` 및 기타 호환되는 GPT-5 ref는 동일한 오버레이를 받습니다. 이전 GPT-4.x 모델에는 적용되지 않습니다.

번들 네이티브 Codex 하네스 provider(`codex/*`)는 Codex 앱 서버 개발자 지침을 통해 동일한 GPT-5 동작과 Heartbeat 오버레이를 사용하므로, `codex/gpt-5.x` 세션은 Codex가 나머지 하네스 프롬프트를 소유하더라도 동일한 후속 조치 및 사전 대응적 Heartbeat 지침을 유지합니다.

GPT-5 기여는 페르소나 지속성, 실행 안전성, 도구 규율, 출력 형태, 완료 확인, 검증을 위한 태그 기반 동작 계약을 추가합니다. channel별 응답 및 무음 메시지 동작은 공유 OpenClaw 시스템 프롬프트와 아웃바운드 전달 정책에 그대로 유지됩니다. GPT-5 지침은 일치하는 모델에 대해 항상 활성화됩니다. 친화적인 상호작용 스타일 계층은 별도로 구성 가능합니다.

| 값                     | 효과                                      |
| ---------------------- | ----------------------------------------- |
| `"friendly"` (기본값)  | 친화적인 상호작용 스타일 계층 활성화      |
| `"on"`                 | `"friendly"`의 별칭                       |
| `"off"`                | 친화적인 스타일 계층만 비활성화           |

<Tabs>
  <Tab title="Config">
    ```json5
    {
      agents: {
        defaults: {
          promptOverlays: {
            gpt5: { personality: "friendly" },
          },
        },
      },
    }
    ```
  </Tab>
  <Tab title="CLI">
    ```bash
    openclaw config set agents.defaults.promptOverlays.gpt5.personality off
    ```
  </Tab>
</Tabs>

<Tip>
값은 런타임에서 대소문자를 구분하지 않으므로 `"Off"`와 `"off"`는 모두 친화적인 스타일 계층을 비활성화합니다.
</Tip>

<Note>
레거시 `plugins.entries.openai.config.personality`는 공유 `agents.defaults.promptOverlays.gpt5.personality` 설정이 없을 때 호환성 폴백으로 여전히 읽힙니다.
</Note>

## 음성 및 스피치

<AccordionGroup>
  <Accordion title="음성 합성(TTS)">
    번들 `openai` Plugin은 `messages.tts` 표면에 대해 음성 합성을 등록합니다.

    | 설정 | config 경로 | 기본값 |
    |---------|------------|---------|
    | 모델 | `messages.tts.providers.openai.model` | `gpt-4o-mini-tts` |
    | 음성 | `messages.tts.providers.openai.voice` | `coral` |
    | 속도 | `messages.tts.providers.openai.speed` | (설정 안 됨) |
    | 지침 | `messages.tts.providers.openai.instructions` | (설정 안 됨, `gpt-4o-mini-tts` 전용) |
    | 형식 | `messages.tts.providers.openai.responseFormat` | 음성 노트는 `opus`, 파일은 `mp3` |
    | API 키 | `messages.tts.providers.openai.apiKey` | `OPENAI_API_KEY`로 폴백 |
    | Base URL | `messages.tts.providers.openai.baseUrl` | `https://api.openai.com/v1` |

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
    chat API 엔드포인트에 영향을 주지 않고 TTS base URL을 재정의하려면 `OPENAI_TTS_BASE_URL`을 설정하세요.
    </Note>

  </Accordion>

  <Accordion title="음성-텍스트 변환">
    번들 `openai` Plugin은
    OpenClaw의 미디어 이해 전사 표면을 통해 배치 음성-텍스트 변환을 등록합니다.

    - 기본 모델: `gpt-4o-transcribe`
    - 엔드포인트: OpenAI REST `/v1/audio/transcriptions`
    - 입력 경로: multipart 오디오 파일 업로드
    - 인바운드 오디오 전사가
      `tools.media.audio`를 사용하는 모든 위치에서 OpenClaw가 지원하며, 여기에는 Discord 음성 채널 세그먼트와 channel
      오디오 첨부 파일이 포함됩니다

    인바운드 오디오 전사에 OpenAI를 강제하려면:

    ```json5
    {
      tools: {
        media: {
          audio: {
            models: [
              {
                type: "provider",
                provider: "openai",
                model: "gpt-4o-transcribe",
              },
            ],
          },
        },
      },
    }
    ```

    공유 오디오 미디어 config 또는 호출별 전사 요청에서 언어 및 프롬프트 힌트가 제공되면
    OpenAI로 전달됩니다.

  </Accordion>

  <Accordion title="실시간 전사">
    번들 `openai` Plugin은 Voice Call Plugin용 실시간 전사를 등록합니다.

    | 설정 | Config 경로 | 기본값 |
    |---------|------------|---------|
    | 모델 | `plugins.entries.voice-call.config.streaming.providers.openai.model` | `gpt-4o-transcribe` |
    | 언어 | `...openai.language` | (설정 안 됨) |
    | 프롬프트 | `...openai.prompt` | (설정 안 됨) |
    | 무음 지속 시간 | `...openai.silenceDurationMs` | `800` |
    | VAD 임계값 | `...openai.vadThreshold` | `0.5` |
    | API 키 | `...openai.apiKey` | `OPENAI_API_KEY`로 폴백 |

    <Note>
    `wss://api.openai.com/v1/realtime`에 대한 WebSocket 연결과 G.711 u-law (`g711_ulaw` / `audio/pcmu`) 오디오를 사용합니다. 이 스트리밍 provider는 Voice Call의 실시간 전사 경로용입니다. Discord 음성은 현재 짧은 세그먼트를 녹음하고 대신 배치 `tools.media.audio` 전사 경로를 사용합니다.
    </Note>

  </Accordion>

  <Accordion title="실시간 음성">
    번들 `openai` Plugin은 Voice Call Plugin용 실시간 음성을 등록합니다.

    | 설정 | Config 경로 | 기본값 |
    |---------|------------|---------|
    | 모델 | `plugins.entries.voice-call.config.realtime.providers.openai.model` | `gpt-realtime` |
    | 음성 | `...openai.voice` | `alloy` |
    | 온도 | `...openai.temperature` | `0.8` |
    | VAD 임계값 | `...openai.vadThreshold` | `0.5` |
    | 무음 지속 시간 | `...openai.silenceDurationMs` | `500` |
    | API 키 | `...openai.apiKey` | `OPENAI_API_KEY`로 폴백 |

    <Note>
    `azureEndpoint` 및 `azureDeployment` config 키를 통해 Azure OpenAI를 지원합니다. 양방향 도구 호출을 지원합니다. G.711 u-law 오디오 형식을 사용합니다.
    </Note>

  </Accordion>
</AccordionGroup>

## 고급 구성

<AccordionGroup>
  <Accordion title="전송 계층(WebSocket 대 SSE)">
    OpenClaw는 `openai/*`와 `openai-codex/*` 모두에 대해 WebSocket 우선, SSE 폴백(`"auto"`)을 사용합니다.

    `"auto"` 모드에서 OpenClaw는:
    - 초기 WebSocket 실패를 한 번 재시도한 뒤 SSE로 폴백합니다
    - 실패 후 약 60초 동안 WebSocket을 성능 저하 상태로 표시하고 쿨다운 동안 SSE를 사용합니다
    - 재시도 및 재연결을 위해 안정적인 세션 및 턴 ID 헤더를 연결합니다
    - 전송 계층 변형 전반에서 usage 카운터(`input_tokens` / `prompt_tokens`)를 정규화합니다

    | 값 | 동작 |
    |-------|----------|
    | `"auto"` (기본값) | WebSocket 우선, SSE 폴백 |
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

  <Accordion title="고속 모드">
    OpenClaw는 `openai/*`와 `openai-codex/*` 모두에 대해 공유 고속 모드 토글을 제공합니다:

    - **Chat/UI:** `/fast status|on|off`
    - **Config:** `agents.defaults.models["<provider>/<model>"].params.fastMode`

    활성화하면 OpenClaw는 고속 모드를 OpenAI 우선 처리(`service_tier = "priority"`)에 매핑합니다. 기존 `service_tier` 값은 유지되며, 고속 모드는 `reasoning` 또는 `text.verbosity`를 다시 쓰지 않습니다.

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
    세션 재정의가 config보다 우선합니다. Sessions UI에서 세션 재정의를 지우면 세션은 구성된 기본값으로 돌아갑니다.
    </Note>

  </Accordion>

  <Accordion title="우선 처리(service_tier)">
    OpenAI API는 `service_tier`를 통해 우선 처리를 노출합니다. OpenClaw에서 모델별로 설정하세요:

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
    `serviceTier`는 네이티브 OpenAI 엔드포인트(`api.openai.com`)와 네이티브 Codex 엔드포인트(`chatgpt.com/backend-api`)에만 전달됩니다. 어느 provider든 프록시를 통해 라우팅하면 OpenClaw는 `service_tier`를 건드리지 않습니다.
    </Warning>

  </Accordion>

  <Accordion title="서버 측 Compaction(Responses API)">
    직접 OpenAI Responses 모델(`api.openai.com`의 `openai/*`)의 경우 OpenClaw는 서버 측 Compaction을 자동으로 활성화합니다:

    - `store: true`를 강제합니다(모델 호환성이 `supportsStore: false`로 설정한 경우 제외)
    - `context_management: [{ type: "compaction", compact_threshold: ... }]`를 주입합니다
    - 기본 `compact_threshold`: `contextWindow`의 70%(없으면 `80000`)

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
      <Tab title="사용자 정의 임계값">
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
    `responsesServerCompaction`은 `context_management` 주입만 제어합니다. 직접 OpenAI Responses 모델은 호환성이 `supportsStore: false`로 설정하지 않는 한 여전히 `store: true`를 강제합니다.
    </Note>

  </Accordion>

  <Accordion title="엄격한 에이전트형 GPT 모드">
    `openai/*` 및 `openai-codex/*`의 GPT-5 계열 실행에 대해 OpenClaw는 더 엄격한 내장 실행 계약을 사용할 수 있습니다:

    ```json5
    {
      agents: {
        defaults: {
          embeddedPi: { executionContract: "strict-agentic" },
        },
      },
    }
    ```

    `strict-agentic` 사용 시 OpenClaw는:
    - 도구 작업이 가능할 때 계획 전용 턴을 더 이상 성공적인 진행으로 간주하지 않습니다
    - 즉시 행동하라는 조정과 함께 턴을 재시도합니다
    - 상당한 작업에 대해 `update_plan`을 자동 활성화합니다
    - 모델이 행동하지 않고 계속 계획만 세우면 명시적인 차단 상태를 표시합니다

    <Note>
    OpenAI 및 Codex GPT-5 계열 실행에만 범위가 제한됩니다. 다른 provider와 이전 모델 계열은 기본 동작을 유지합니다.
    </Note>

  </Accordion>

  <Accordion title="네이티브 경로 대 OpenAI 호환 경로">
    OpenClaw는 직접 OpenAI, Codex, Azure OpenAI 엔드포인트를 일반적인 OpenAI 호환 `/v1` 프록시와 다르게 취급합니다:

    **네이티브 경로** (`openai/*`, `openai-codex/*`, Azure OpenAI):
    - OpenAI `none` effort를 지원하는 모델에 대해서만 `reasoning: { effort: "none" }`를 유지합니다
    - `reasoning.effort: "none"`를 거부하는 모델 또는 프록시에서는 비활성화된 추론을 생략합니다
    - 도구 스키마를 기본적으로 strict 모드로 설정합니다
    - 검증된 네이티브 호스트에만 숨겨진 attribution 헤더를 연결합니다
    - OpenAI 전용 요청 shaping(`service_tier`, `store`, reasoning 호환, 프롬프트 캐시 힌트)을 유지합니다

    **프록시/호환 경로:**
    - 더 느슨한 호환 동작을 사용합니다
    - strict 도구 스키마나 네이티브 전용 헤더를 강제하지 않습니다

    Azure OpenAI는 네이티브 전송 계층과 호환 동작을 사용하지만 숨겨진 attribution 헤더는 받지 않습니다.

  </Accordion>
</AccordionGroup>

## 관련 항목

<CardGroup cols={2}>
  <Card title="모델 선택" href="/ko/concepts/model-providers" icon="layers">
    provider, Model ref, 폴백 동작 선택하기.
  </Card>
  <Card title="이미지 생성" href="/ko/tools/image-generation" icon="image">
    공유 이미지 도구 매개변수와 provider 선택.
  </Card>
  <Card title="비디오 생성" href="/ko/tools/video-generation" icon="video">
    공유 비디오 도구 매개변수와 provider 선택.
  </Card>
  <Card title="OAuth 및 인증" href="/ko/gateway/authentication" icon="key">
    인증 세부 정보와 자격 증명 재사용 규칙.
  </Card>
</CardGroup>
