---
read_when:
    - OpenClaw에서 Grok 모델을 사용하려고 합니다.
    - xAI 인증 또는 모델 ID를 구성하는 중입니다.
summary: OpenClaw에서 xAI Grok 모델 사용
title: xAI
x-i18n:
    generated_at: "2026-04-24T06:33:23Z"
    model: gpt-5.4
    provider: openai
    source_hash: bf125767e3123d6fbf000825323dc736712feea65582c1db9f7ffccc2bc20bb4
    source_path: providers/xai.md
    workflow: 15
---

OpenClaw는 Grok 모델용 번들 `xai` provider Plugin을 제공합니다.

## 시작하기

<Steps>
  <Step title="API 키 생성">
    [xAI 콘솔](https://console.x.ai/)에서 API 키를 생성하세요.
  </Step>
  <Step title="API 키 설정">
    `XAI_API_KEY`를 설정하거나 다음을 실행하세요.

    ```bash
    openclaw onboard --auth-choice xai-api-key
    ```

  </Step>
  <Step title="모델 선택">
    ```json5
    {
      agents: { defaults: { model: { primary: "xai/grok-4" } } },
    }
    ```
  </Step>
</Steps>

<Note>
OpenClaw는 번들 xAI 전송으로 xAI Responses API를 사용합니다. 동일한
`XAI_API_KEY`는 Grok 기반 `web_search`, 1급 `x_search`,
원격 `code_execution`에도 사용할 수 있습니다.
xAI 키를 `plugins.entries.xai.config.webSearch.apiKey` 아래에 저장하면,
번들 xAI 모델 provider도 그 키를 fallback으로 재사용합니다.
`code_execution` 튜닝은 `plugins.entries.xai.config.codeExecution` 아래에 있습니다.
</Note>

## 내장 카탈로그

OpenClaw는 기본적으로 다음 xAI 모델 계열을 포함합니다.

| Family         | Model ids                                                                |
| -------------- | ------------------------------------------------------------------------ |
| Grok 3         | `grok-3`, `grok-3-fast`, `grok-3-mini`, `grok-3-mini-fast`               |
| Grok 4         | `grok-4`, `grok-4-0709`                                                  |
| Grok 4 Fast    | `grok-4-fast`, `grok-4-fast-non-reasoning`                               |
| Grok 4.1 Fast  | `grok-4-1-fast`, `grok-4-1-fast-non-reasoning`                           |
| Grok 4.20 Beta | `grok-4.20-beta-latest-reasoning`, `grok-4.20-beta-latest-non-reasoning` |
| Grok Code      | `grok-code-fast-1`                                                       |

이 Plugin은 동일한 API 형태를 따르는 더 새로운 `grok-4*` 및 `grok-code-fast*` ID도 forward-resolve합니다.

<Tip>
`grok-4-fast`, `grok-4-1-fast`, 그리고 `grok-4.20-beta-*` 변형은
현재 번들 카탈로그에서 이미지 입력을 지원하는 Grok ref입니다.
</Tip>

## OpenClaw 기능 지원 범위

번들 Plugin은 xAI의 현재 공개 API 표면을 OpenClaw의 공통
provider 및 도구 계약에 매핑합니다. 공통 계약에 맞지 않는 기능(예: 스트리밍 TTS 및 실시간 음성)은 노출되지 않습니다. 아래 표를 참조하세요.

| xAI capability             | OpenClaw surface                          | Status                                                              |
| -------------------------- | ----------------------------------------- | ------------------------------------------------------------------- |
| Chat / Responses           | `xai/<model>` 모델 provider               | 예                                                                  |
| 서버 측 웹 검색            | `web_search` provider `grok`              | 예                                                                  |
| 서버 측 X 검색             | `x_search` tool                           | 예                                                                  |
| 서버 측 코드 실행          | `code_execution` tool                     | 예                                                                  |
| 이미지                     | `image_generate`                          | 예                                                                  |
| 비디오                     | `video_generate`                          | 예                                                                  |
| 배치 텍스트 음성 변환      | `messages.tts.provider: "xai"` / `tts`    | 예                                                                  |
| 스트리밍 TTS               | —                                         | 노출되지 않음. OpenClaw의 TTS 계약은 완성된 오디오 버퍼를 반환함    |
| 배치 음성-텍스트 변환      | `tools.media.audio` / 미디어 이해         | 예                                                                  |
| 스트리밍 음성-텍스트 변환  | Voice Call `streaming.provider: "xai"`    | 예                                                                  |
| 실시간 음성                | —                                         | 아직 노출되지 않음. 다른 세션/WebSocket 계약 사용                   |
| 파일 / 배치               | 일반 모델 API 호환성만                    | OpenClaw 1급 도구는 아님                                            |

<Note>
OpenClaw는 미디어 생성, 음성, 배치 전사에는 xAI의 REST image/video/TTS/STT API를 사용하고,
실시간 voice-call 전사에는 xAI의 스트리밍 STT WebSocket을,
모델, 검색, 코드 실행 도구에는 Responses API를 사용합니다. 실시간 음성 세션처럼
다른 OpenClaw 계약이 필요한 기능은 숨겨진 Plugin 동작이 아니라 업스트림 capability로 여기 문서화됩니다.
</Note>

### Fast-mode 매핑

`/fast on` 또는 `agents.defaults.models["xai/<model>"].params.fastMode: true`는 네이티브 xAI 요청을 다음과 같이 다시 씁니다.

| Source model  | Fast-mode target   |
| ------------- | ------------------ |
| `grok-3`      | `grok-3-fast`      |
| `grok-3-mini` | `grok-3-mini-fast` |
| `grok-4`      | `grok-4-fast`      |
| `grok-4-0709` | `grok-4-fast`      |

### 레거시 호환성 별칭

레거시 별칭은 여전히 표준 번들 ID로 정규화됩니다.

| Legacy alias              | Canonical id                          |
| ------------------------- | ------------------------------------- |
| `grok-4-fast-reasoning`   | `grok-4-fast`                         |
| `grok-4-1-fast-reasoning` | `grok-4-1-fast`                       |
| `grok-4.20-reasoning`     | `grok-4.20-beta-latest-reasoning`     |
| `grok-4.20-non-reasoning` | `grok-4.20-beta-latest-non-reasoning` |

## 기능

<AccordionGroup>
  <Accordion title="웹 검색">
    번들 `grok` 웹 검색 provider도 `XAI_API_KEY`를 사용합니다.

    ```bash
    openclaw config set tools.web.search.provider grok
    ```

  </Accordion>

  <Accordion title="비디오 생성">
    번들 `xai` Plugin은 공통 `video_generate` 도구를 통해 비디오 생성을 등록합니다.

    - 기본 비디오 모델: `xai/grok-imagine-video`
    - 모드: text-to-video, image-to-video, 원격 비디오 편집, 원격 비디오 확장
    - 종횡비: `1:1`, `16:9`, `9:16`, `4:3`, `3:4`, `3:2`, `2:3`
    - 해상도: `480P`, `720P`
    - 길이: 생성/image-to-video는 1-15초, 확장은 2-10초

    <Warning>
    로컬 비디오 버퍼는 허용되지 않습니다. 비디오 편집/확장 입력에는
    원격 `http(s)` URL을 사용하세요. image-to-video는 OpenClaw가 이를 xAI용 데이터 URL로 인코딩할 수 있으므로 로컬 이미지 버퍼를 허용합니다.
    </Warning>

    xAI를 기본 비디오 provider로 사용하려면:

    ```json5
    {
      agents: {
        defaults: {
          videoGenerationModel: {
            primary: "xai/grok-imagine-video",
          },
        },
      },
    }
    ```

    <Note>
    공통 도구 매개변수, provider 선택, failover 동작은 [비디오 생성](/ko/tools/video-generation)을 참조하세요.
    </Note>

  </Accordion>

  <Accordion title="이미지 생성">
    번들 `xai` Plugin은 공통 `image_generate` 도구를 통해 이미지 생성을 등록합니다.

    - 기본 이미지 모델: `xai/grok-imagine-image`
    - 추가 모델: `xai/grok-imagine-image-pro`
    - 모드: text-to-image 및 참조 이미지 편집
    - 참조 입력: 하나의 `image` 또는 최대 다섯 개의 `images`
    - 종횡비: `1:1`, `16:9`, `9:16`, `4:3`, `3:4`, `2:3`, `3:2`
    - 해상도: `1K`, `2K`
    - 수량: 최대 4개 이미지

    OpenClaw는 생성된 미디어를 일반 채널 첨부 경로로 저장하고 전달할 수 있도록 xAI에 `b64_json` 이미지 응답을 요청합니다. 로컬 참조 이미지는 데이터 URL로 변환되며, 원격 `http(s)` 참조는 그대로 전달됩니다.

    xAI를 기본 이미지 provider로 사용하려면:

    ```json5
    {
      agents: {
        defaults: {
          imageGenerationModel: {
            primary: "xai/grok-imagine-image",
          },
        },
      },
    }
    ```

    <Note>
    xAI는 `quality`, `mask`, `user`, 그리고 `1:2`, `2:1`, `9:20`, `20:9` 같은 추가 네이티브 종횡비도 문서화하고 있습니다. 현재 OpenClaw는 공통 cross-provider 이미지 제어만 전달하며, 지원되지 않는 네이티브 전용 설정은 의도적으로 `image_generate`를 통해 노출하지 않습니다.
    </Note>

  </Accordion>

  <Accordion title="텍스트 음성 변환">
    번들 `xai` Plugin은 공통 `tts` provider 표면을 통해 텍스트 음성 변환을 등록합니다.

    - 음성: `eve`, `ara`, `rex`, `sal`, `leo`, `una`
    - 기본 음성: `eve`
    - 형식: `mp3`, `wav`, `pcm`, `mulaw`, `alaw`
    - 언어: BCP-47 코드 또는 `auto`
    - 속도: provider 네이티브 속도 재정의
    - 네이티브 Opus 음성 노트 형식은 지원되지 않음

    xAI를 기본 TTS provider로 사용하려면:

    ```json5
    {
      messages: {
        tts: {
          provider: "xai",
          providers: {
            xai: {
              voiceId: "eve",
            },
          },
        },
      },
    }
    ```

    <Note>
    OpenClaw는 xAI의 배치 `/v1/tts` 엔드포인트를 사용합니다. xAI는 WebSocket을 통한 스트리밍 TTS도 제공하지만, 현재 OpenClaw 음성 provider 계약은 답글 전송 전에 완성된 오디오 버퍼를 기대합니다.
    </Note>

  </Accordion>

  <Accordion title="음성-텍스트 변환">
    번들 `xai` Plugin은 OpenClaw의 미디어 이해 전사 표면을 통해 배치 음성-텍스트 변환을 등록합니다.

    - 기본 모델: `grok-stt`
    - 엔드포인트: xAI REST `/v1/stt`
    - 입력 경로: multipart 오디오 파일 업로드
    - OpenClaw에서 `tools.media.audio`를 사용하는 모든 인바운드 오디오 전사 경로에서 지원되며, Discord 음성 채널 세그먼트와 채널 오디오 첨부도 포함됨

    인바운드 오디오 전사에 xAI를 강제로 사용하려면:

    ```json5
    {
      tools: {
        media: {
          audio: {
            models: [
              {
                type: "provider",
                provider: "xai",
                model: "grok-stt",
              },
            ],
          },
        },
      },
    }
    ```

    언어는 공통 오디오 미디어 config 또는 호출별 전사 요청을 통해 제공할 수 있습니다. 프롬프트 힌트는 공통 OpenClaw 표면에서 허용되지만, xAI REST STT 통합은 현재 공개 xAI 엔드포인트에 깔끔하게 매핑되는 file, model, language만 전달합니다.

  </Accordion>

  <Accordion title="스트리밍 음성-텍스트 변환">
    번들 `xai` Plugin은 라이브 voice-call 오디오용 실시간 전사 provider도 등록합니다.

    - 엔드포인트: xAI WebSocket `wss://api.x.ai/v1/stt`
    - 기본 인코딩: `mulaw`
    - 기본 샘플 레이트: `8000`
    - 기본 endpointing: `800ms`
    - 중간 전사문: 기본적으로 활성화

    Voice Call의 Twilio 미디어 스트림은 G.711 µ-law 오디오 프레임을 전송하므로, xAI provider는 트랜스코딩 없이 해당 프레임을 직접 전달할 수 있습니다.

    ```json5
    {
      plugins: {
        entries: {
          "voice-call": {
            config: {
              streaming: {
                enabled: true,
                provider: "xai",
                providers: {
                  xai: {
                    apiKey: "${XAI_API_KEY}",
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

    provider 소유 config는
    `plugins.entries.voice-call.config.streaming.providers.xai` 아래에 있습니다. 지원되는 키는 `apiKey`, `baseUrl`, `sampleRate`, `encoding` (`pcm`, `mulaw`, 또는 `alaw`), `interimResults`, `endpointingMs`, `language`입니다.

    <Note>
    이 스트리밍 provider는 Voice Call의 실시간 전사 경로용입니다.
    Discord 음성은 현재 짧은 세그먼트를 녹음한 뒤 배치 `tools.media.audio` 전사 경로를 사용합니다.
    </Note>

  </Accordion>

  <Accordion title="x_search 구성">
    번들 xAI Plugin은 Grok를 통해 X(구 Twitter) 콘텐츠를 검색하는 OpenClaw 도구로 `x_search`를 노출합니다.

    Config 경로: `plugins.entries.xai.config.xSearch`

    | Key                | Type    | Default            | 설명                                  |
    | ------------------ | ------- | ------------------ | ------------------------------------- |
    | `enabled`          | boolean | —                  | x_search 활성화 또는 비활성화         |
    | `model`            | string  | `grok-4-1-fast`    | x_search 요청에 사용하는 모델         |
    | `inlineCitations`  | boolean | —                  | 결과에 인라인 인용 포함               |
    | `maxTurns`         | number  | —                  | 최대 대화 턴 수                       |
    | `timeoutSeconds`   | number  | —                  | 요청 타임아웃(초)                     |
    | `cacheTtlMinutes`  | number  | —                  | 캐시 TTL(분)                          |

    ```json5
    {
      plugins: {
        entries: {
          xai: {
            config: {
              xSearch: {
                enabled: true,
                model: "grok-4-1-fast",
                inlineCitations: true,
              },
            },
          },
        },
      },
    }
    ```

  </Accordion>

  <Accordion title="코드 실행 구성">
    번들 xAI Plugin은 xAI의 샌드박스 환경에서 원격 코드 실행을 위한 OpenClaw 도구로
    `code_execution`을 노출합니다.

    Config 경로: `plugins.entries.xai.config.codeExecution`

    | Key               | Type    | Default                     | 설명                                      |
    | ----------------- | ------- | --------------------------- | ----------------------------------------- |
    | `enabled`         | boolean | `true` (키가 있을 때)       | 코드 실행 활성화 또는 비활성화            |
    | `model`           | string  | `grok-4-1-fast`             | 코드 실행 요청에 사용하는 모델            |
    | `maxTurns`        | number  | —                           | 최대 대화 턴 수                           |
    | `timeoutSeconds`  | number  | —                           | 요청 타임아웃(초)                         |

    <Note>
    이것은 로컬 [`exec`](/ko/tools/exec)가 아니라 원격 xAI 샌드박스 실행입니다.
    </Note>

    ```json5
    {
      plugins: {
        entries: {
          xai: {
            config: {
              codeExecution: {
                enabled: true,
                model: "grok-4-1-fast",
              },
            },
          },
        },
      },
    }
    ```

  </Accordion>

  <Accordion title="알려진 제한 사항">
    - 현재 인증은 API-key 전용입니다. OpenClaw에는 아직 xAI OAuth 또는 device-code 흐름이 없습니다.
    - `grok-4.20-multi-agent-experimental-beta-0304`는 표준 OpenClaw xAI 전송과 다른 업스트림 API 표면이 필요하므로 일반 xAI provider 경로에서는 지원되지 않습니다.
    - xAI Realtime voice는 아직 OpenClaw provider로 등록되지 않았습니다. 배치 STT 또는 스트리밍 전사와는 다른 양방향 음성 세션 계약이 필요합니다.
    - xAI 이미지 `quality`, 이미지 `mask`, 추가 네이티브 전용 종횡비는 공통 `image_generate` 도구에 해당하는 cross-provider 제어가 생기기 전까지 노출되지 않습니다.
  </Accordion>

  <Accordion title="고급 참고">
    - OpenClaw는 공통 runner 경로에서 xAI 전용 도구 스키마 및 도구 호출 호환성 수정을 자동으로 적용합니다.
    - 네이티브 xAI 요청은 기본적으로 `tool_stream: true`를 사용합니다. 이를 비활성화하려면 `agents.defaults.models["xai/<model>"].params.tool_stream`을 `false`로 설정하세요.
    - 번들 xAI wrapper는 네이티브 xAI 요청을 보내기 전에 지원되지 않는 strict tool-schema 플래그와 reasoning payload 키를 제거합니다.
    - `web_search`, `x_search`, `code_execution`은 OpenClaw 도구로 노출됩니다. OpenClaw는 모든 네이티브 도구를 모든 채팅 턴에 붙이는 대신, 각 도구 요청 안에서 필요한 특정 xAI built-in만 활성화합니다.
    - `x_search`와 `code_execution`은 코어 모델 런타임에 하드코딩되지 않고 번들 xAI Plugin이 소유합니다.
    - `code_execution`은 로컬 [`exec`](/ko/tools/exec)가 아니라 원격 xAI 샌드박스 실행입니다.
  </Accordion>
</AccordionGroup>

## 라이브 테스트

xAI 미디어 경로는 유닛 테스트와 옵트인 라이브 스위트로 커버됩니다. 라이브
명령은 `XAI_API_KEY`를 확인하기 전에 `~/.profile`을 포함한 로그인 셸에서 비밀 정보를 로드합니다.

```bash
pnpm test extensions/xai
OPENCLAW_LIVE_TEST=1 OPENCLAW_LIVE_TEST_QUIET=1 pnpm test:live -- extensions/xai/xai.live.test.ts
OPENCLAW_LIVE_TEST=1 OPENCLAW_LIVE_TEST_QUIET=1 OPENCLAW_LIVE_IMAGE_GENERATION_PROVIDERS=xai pnpm test:live -- test/image-generation.runtime.live.test.ts
```

provider 전용 라이브 파일은 일반 TTS, 전화용 PCM TTS를 합성하고,
xAI 배치 STT를 통해 오디오를 전사하며, 같은 PCM을 xAI
realtime STT로 스트리밍하고, text-to-image 출력을 생성하며, 참조 이미지를 편집합니다. 공통 이미지 라이브 파일은 같은 xAI provider를 OpenClaw의 런타임 선택, fallback, 정규화, 미디어 첨부 경로를 통해 검증합니다.

## 관련 항목

<CardGroup cols={2}>
  <Card title="모델 선택" href="/ko/concepts/model-providers" icon="layers">
    provider, 모델 ref, failover 동작 선택.
  </Card>
  <Card title="비디오 생성" href="/ko/tools/video-generation" icon="video">
    공통 비디오 도구 매개변수 및 provider 선택.
  </Card>
  <Card title="모든 provider" href="/ko/providers/index" icon="grid-2">
    더 넓은 provider 개요.
  </Card>
  <Card title="문제 해결" href="/ko/help/troubleshooting" icon="wrench">
    일반적인 문제와 해결 방법.
  </Card>
</CardGroup>
