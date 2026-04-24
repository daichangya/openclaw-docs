---
read_when:
    - OpenClaw에서 OpenAI 모델을 사용하고 싶습니다
    - API 키 대신 Codex 구독 인증을 원합니다
    - 더 엄격한 GPT-5 에이전트 실행 동작이 필요합니다
summary: OpenClaw에서 API 키 또는 Codex 구독으로 OpenAI 사용하기
title: OpenAI
x-i18n:
    generated_at: "2026-04-24T06:31:52Z"
    model: gpt-5.4
    provider: openai
    source_hash: 3d533338fa15d866bb69584706162ce099bb4a1edc9851183fb5442730ebdd9b
    source_path: providers/openai.md
    workflow: 15
---

OpenAI는 GPT 모델용 개발자 API를 제공합니다. OpenClaw는 세 가지 OpenAI 계열 경로를 지원합니다. 모델 접두사가 경로를 선택합니다.

- **API 키** — 사용량 기반 과금이 적용되는 직접 OpenAI Platform 접근(`openai/*` 모델)
- **PI를 통한 Codex 구독** — 구독 접근이 포함된 ChatGPT/Codex 로그인(`openai-codex/*` 모델)
- **Codex app-server 하니스** — 네이티브 Codex app-server 실행(`openai/*` 모델 + `agents.defaults.embeddedHarness.runtime: "codex"`)

OpenAI는 OpenClaw 같은 외부 도구와 워크플로에서의 구독 OAuth 사용을 명시적으로 지원합니다.

<Note>
GPT-5.5는 현재 OpenClaw에서 구독/OAuth 경로를 통해 사용할 수 있습니다:
PI 러너의 `openai-codex/gpt-5.5`, 또는
Codex app-server 하니스의 `openai/gpt-5.5`.
`openai/gpt-5.5`에 대한 직접 API 키 접근은
OpenAI가 공개 API에서 GPT-5.5를 활성화하면 지원됩니다. 그 전까지는
`OPENAI_API_KEY` 설정에는 `openai/gpt-5.4` 같은
API 사용 가능 모델을 사용하세요.
</Note>

<Note>
OpenAI Plugin을 활성화하거나 `openai-codex/*` 모델을 선택해도
번들 Codex app-server Plugin이 활성화되지는 않습니다. OpenClaw는
`embeddedHarness.runtime: "codex"`로 네이티브 Codex 하니스를
명시적으로 선택하거나 레거시 `codex/*` 모델 ref를 사용할 때만
해당 Plugin을 활성화합니다.
</Note>

## OpenClaw 기능 지원 범위

| OpenAI 기능              | OpenClaw 표면                                            | 상태                                                         |
| ------------------------ | -------------------------------------------------------- | ------------------------------------------------------------ |
| Chat / Responses         | `openai/<model>` 모델 provider                           | 예                                                           |
| Codex 구독 모델          | `openai-codex/<model>` + `openai-codex` OAuth            | 예                                                           |
| Codex app-server 하니스  | `openai/<model>` + `embeddedHarness.runtime: codex`      | 예                                                           |
| 서버 측 웹 검색          | 네이티브 OpenAI Responses 도구                           | 예, 웹 검색이 활성화되어 있고 provider가 고정되지 않은 경우 |
| 이미지                   | `image_generate`                                         | 예                                                           |
| 비디오                   | `video_generate`                                         | 예                                                           |
| 텍스트 음성 변환         | `messages.tts.provider: "openai"` / `tts`                | 예                                                           |
| 배치 음성-텍스트 변환    | `tools.media.audio` / 미디어 이해                        | 예                                                           |
| 스트리밍 음성-텍스트 변환 | Voice Call `streaming.provider: "openai"`               | 예                                                           |
| 실시간 음성              | Voice Call `realtime.provider: "openai"` / Control UI Talk | 예                                                        |
| 임베딩                   | 메모리 임베딩 provider                                   | 예                                                           |

## 시작하기

선호하는 인증 방식을 선택하고 설정 단계를 따르세요.

<Tabs>
  <Tab title="API 키 (OpenAI Platform)">
    **적합한 경우:** 직접 API 접근 및 사용량 기반 과금.

    <Steps>
      <Step title="API 키 받기">
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

    | 모델 ref | 경로 | 인증 |
    |-----------|------|------|
    | `openai/gpt-5.4` | 직접 OpenAI Platform API | `OPENAI_API_KEY` |
    | `openai/gpt-5.4-mini` | 직접 OpenAI Platform API | `OPENAI_API_KEY` |
    | `openai/gpt-5.5` | OpenAI가 API에서 GPT-5.5를 활성화하면 미래의 직접 API 경로 | `OPENAI_API_KEY` |

    <Note>
    `openai/*`는 Codex app-server 하니스를 명시적으로 강제하지 않는 한
    직접 OpenAI API 키 경로입니다. GPT-5.5 자체는 현재 구독/OAuth
    전용이므로, 기본 PI 러너를 통한 Codex OAuth에는 `openai-codex/*`를 사용하세요.
    </Note>

    ### config 예시

    ```json5
    {
      env: { OPENAI_API_KEY: "sk-..." },
      agents: { defaults: { model: { primary: "openai/gpt-5.4" } } },
    }
    ```

    <Warning>
    OpenClaw는 `openai/gpt-5.3-codex-spark`를 **노출하지 않습니다**. 실제 OpenAI API 요청은 해당 모델을 거부하며, 현재 Codex 카탈로그도 이를 노출하지 않습니다.
    </Warning>

  </Tab>

  <Tab title="Codex 구독">
    **적합한 경우:** 별도 API 키 대신 ChatGPT/Codex 구독을 사용하려는 경우. Codex cloud는 ChatGPT 로그인이 필요합니다.

    <Steps>
      <Step title="Codex OAuth 실행">
        ```bash
        openclaw onboard --auth-choice openai-codex
        ```

        또는 OAuth를 직접 실행하세요:

        ```bash
        openclaw models auth login --provider openai-codex
        ```

        헤드리스 또는 콜백 호스트에 불리한 설정에서는 `--device-code`를 추가해 localhost 브라우저 콜백 대신 ChatGPT device-code 흐름으로 로그인하세요:

        ```bash
        openclaw models auth login --provider openai-codex --device-code
        ```
      </Step>
      <Step title="기본 모델 설정">
        ```bash
        openclaw config set agents.defaults.model.primary openai-codex/gpt-5.5
        ```
      </Step>
      <Step title="모델 사용 가능 여부 확인">
        ```bash
        openclaw models list --provider openai-codex
        ```
      </Step>
    </Steps>

    ### 경로 요약

    | 모델 ref | 경로 | 인증 |
    |-----------|------|------|
    | `openai-codex/gpt-5.5` | PI를 통한 ChatGPT/Codex OAuth | Codex 로그인 |
    | `openai/gpt-5.5` + `embeddedHarness.runtime: "codex"` | Codex app-server 하니스 | Codex app-server 인증 |

    <Note>
    인증/profile 명령에는 계속 `openai-codex` provider ID를 사용하세요.
    `openai-codex/*` 모델 접두사는 Codex OAuth에 대한 명시적 PI 경로이기도 합니다.
    이것은 번들 Codex app-server 하니스를 선택하거나 자동 활성화하지 않습니다.
    </Note>

    ### config 예시

    ```json5
    {
      agents: { defaults: { model: { primary: "openai-codex/gpt-5.5" } } },
    }
    ```

    <Note>
    온보딩은 더 이상 `~/.codex`에서 OAuth 자료를 가져오지 않습니다. 브라우저 OAuth(기본값) 또는 위의 device-code 흐름으로 로그인하세요. OpenClaw는 생성된 자격 증명을 자체 에이전트 인증 저장소에서 관리합니다.
    </Note>

    ### 상태 표시기

    채팅 `/status`는 현재
    세션에 활성화된 내장 하니스를 보여줍니다. 기본 PI 하니스는 `Runner: pi (embedded)`로 표시되며
    별도 배지를 추가하지 않습니다. 번들 Codex app-server 하니스가
    선택되면 `/status`는 `Fast` 옆에 PI가 아닌 하니스 ID를 추가합니다. 예:
    `Fast · codex`. 기존 세션은 기록된 하니스 ID를 유지하므로, 새로운 PI/Codex 선택을 `/status`에
    반영하고 싶다면 `embeddedHarness`를 변경한 뒤
    `/new` 또는 `/reset`을 사용하세요.

    ### 컨텍스트 윈도우 상한

    OpenClaw는 모델 메타데이터와 런타임 컨텍스트 상한을 별도의 값으로 취급합니다.

    Codex OAuth를 통한 `openai-codex/gpt-5.5`의 경우:

    - 네이티브 `contextWindow`: `1000000`
    - 기본 런타임 `contextTokens` 상한: `272000`

    실제로는 더 작은 기본 상한이 더 나은 지연 시간과 품질 특성을 보입니다. `contextTokens`로 재정의하세요:

    ```json5
    {
      models: {
        providers: {
          "openai-codex": {
            models: [{ id: "gpt-5.5", contextTokens: 160000 }],
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
이는 OpenAI API 키 기반 이미지 생성과 Codex OAuth 이미지
생성을 동일한 `openai/gpt-image-2` 모델 ref를 통해 모두 지원합니다.

| 기능                     | OpenAI API 키                   | Codex OAuth                         |
| ------------------------ | ------------------------------- | ----------------------------------- |
| 모델 ref                 | `openai/gpt-image-2`            | `openai/gpt-image-2`                |
| 인증                     | `OPENAI_API_KEY`                | OpenAI Codex OAuth 로그인           |
| 전송                     | OpenAI Images API               | Codex Responses 백엔드              |
| 요청당 최대 이미지 수    | 4                               | 4                                   |
| 편집 모드                | 활성화됨(참조 이미지 최대 5개)  | 활성화됨(참조 이미지 최대 5개)      |
| 크기 재정의              | 2K/4K 크기 포함 지원            | 2K/4K 크기 포함 지원                |
| 종횡비 / 해상도          | OpenAI Images API로 전달되지 않음 | 안전할 때 지원되는 크기로 매핑됨 |

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
공유 도구 파라미터, provider 선택, 페일오버 동작은 [Image Generation](/ko/tools/image-generation)을 참조하세요.
</Note>

`gpt-image-2`는 OpenAI 텍스트-이미지 생성과 이미지
편집 모두의 기본값입니다. `gpt-image-1`도 명시적 모델 재정의로는 계속 사용할 수 있지만, 새로운
OpenAI 이미지 워크플로는 `openai/gpt-image-2`를 사용해야 합니다.

Codex OAuth 설치에서는 같은 `openai/gpt-image-2` ref를 유지하세요. `openai-codex`
OAuth profile이 구성되어 있으면 OpenClaw는 저장된 OAuth
access token을 해석해 Codex Responses 백엔드를 통해 이미지 요청을 보냅니다.
이 요청에 대해 먼저 `OPENAI_API_KEY`를 시도하거나 API 키로 조용히 폴백하지 않습니다.
직접 OpenAI Images API
경로를 원한다면 `models.providers.openai`를 API 키,
사용자 지정 base URL, 또는 Azure 엔드포인트로 명시적으로 구성하세요.
그 사용자 지정 이미지 엔드포인트가 신뢰할 수 있는 LAN/private 주소에 있다면
`browser.ssrfPolicy.dangerouslyAllowPrivateNetwork: true`도 함께 설정하세요. OpenClaw는
이 옵트인이 없으면 private/internal OpenAI 호환 이미지 엔드포인트를 계속 차단합니다.

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

| 기능             | 값                                                                                |
| ---------------- | --------------------------------------------------------------------------------- |
| 기본 모델        | `openai/sora-2`                                                                   |
| 모드             | 텍스트-비디오, 이미지-비디오, 단일 비디오 편집                                   |
| 참조 입력        | 이미지 1개 또는 비디오 1개                                                        |
| 크기 재정의      | 지원됨                                                                            |
| 기타 재정의      | `aspectRatio`, `resolution`, `audio`, `watermark`는 도구 경고와 함께 무시됨      |

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
공유 도구 파라미터, provider 선택, 페일오버 동작은 [Video Generation](/ko/tools/video-generation)을 참조하세요.
</Note>

## GPT-5 프롬프트 기여

OpenClaw는 provider 전반의 GPT-5 계열 실행에 대해 공유 GPT-5 프롬프트 기여를 추가합니다. 이는 모델 ID 기준으로 적용되므로 `openai-codex/gpt-5.5`, `openai/gpt-5.4`, `openrouter/openai/gpt-5.5`, `opencode/gpt-5.5` 및 기타 호환되는 GPT-5 ref는 동일한 오버레이를 받습니다. 오래된 GPT-4.x 모델에는 적용되지 않습니다.

번들 네이티브 Codex 하니스는 Codex app-server 개발자 지침을 통해 동일한 GPT-5 동작과 Heartbeat 오버레이를 사용하므로, `embeddedHarness.runtime: "codex"`를 통해 강제로 실행되는 `openai/gpt-5.x` 세션도 나머지 하니스 프롬프트를 Codex가 소유하더라도 동일한 follow-through 및 능동적 Heartbeat 지침을 유지합니다.

GPT-5 기여는 페르소나 지속성, 실행 안전성, 도구 규율, 출력 형태, 완료 확인, 검증을 위한 태그형 동작 계약을 추가합니다. 채널별 응답 및 무음 메시지 동작은 공유 OpenClaw 시스템 프롬프트와 아웃바운드 전달 정책에 남아 있습니다. GPT-5 지침은 일치하는 모델에 대해 항상 활성화됩니다. 친근한 상호작용 스타일 계층은 별개이며 구성 가능합니다.

| 값                     | 효과                                      |
| ---------------------- | ----------------------------------------- |
| `"friendly"` (기본값)  | 친근한 상호작용 스타일 계층 활성화        |
| `"on"`                 | `"friendly"`의 별칭                       |
| `"off"`                | 친근한 스타일 계층만 비활성화             |

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
값은 런타임에서 대소문자를 구분하지 않으므로 `"Off"`와 `"off"`는 둘 다 친근한 스타일 계층을 비활성화합니다.
</Tip>

<Note>
레거시 `plugins.entries.openai.config.personality`는 공유 `agents.defaults.promptOverlays.gpt5.personality` 설정이 없을 때 호환성 폴백으로 여전히 읽힙니다.
</Note>

## 음성 및 발화

<AccordionGroup>
  <Accordion title="음성 합성(TTS)">
    번들 `openai` Plugin은 `messages.tts` 표면에 대해 음성 합성을 등록합니다.

    | 설정 | Config 경로 | 기본값 |
    |---------|------------|---------|
    | 모델 | `messages.tts.providers.openai.model` | `gpt-4o-mini-tts` |
    | 음성 | `messages.tts.providers.openai.voice` | `coral` |
    | 속도 | `messages.tts.providers.openai.speed` | (미설정) |
    | 지침 | `messages.tts.providers.openai.instructions` | (미설정, `gpt-4o-mini-tts` 전용) |
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
    채팅 API 엔드포인트에 영향을 주지 않고 TTS base URL만 재정의하려면 `OPENAI_TTS_BASE_URL`을 설정하세요.
    </Note>

  </Accordion>

  <Accordion title="음성-텍스트 변환">
    번들 `openai` Plugin은
    OpenClaw의 미디어 이해 전사 표면을 통해 배치 음성-텍스트 변환을 등록합니다.

    - 기본 모델: `gpt-4o-transcribe`
    - 엔드포인트: OpenAI REST `/v1/audio/transcriptions`
    - 입력 경로: multipart 오디오 파일 업로드
    - OpenClaw에서 인바운드 오디오 전사가
      `tools.media.audio`를 사용하는 모든 곳에서 지원됨. 여기에는 Discord 음성 채널 세그먼트와 채널
      오디오 첨부 파일이 포함됨

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

    언어와 프롬프트 힌트는
    공유 오디오 미디어 config 또는 호출별 전사 요청에서 제공되면 OpenAI로 전달됩니다.

  </Accordion>

  <Accordion title="실시간 전사">
    번들 `openai` Plugin은 Voice Call Plugin용 실시간 전사를 등록합니다.

    | 설정 | Config 경로 | 기본값 |
    |---------|------------|---------|
    | 모델 | `plugins.entries.voice-call.config.streaming.providers.openai.model` | `gpt-4o-transcribe` |
    | 언어 | `...openai.language` | (미설정) |
    | 프롬프트 | `...openai.prompt` | (미설정) |
    | 침묵 지속 시간 | `...openai.silenceDurationMs` | `800` |
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
    | 모델 | `plugins.entries.voice-call.config.realtime.providers.openai.model` | `gpt-realtime-1.5` |
    | 음성 | `...openai.voice` | `alloy` |
    | Temperature | `...openai.temperature` | `0.8` |
    | VAD 임계값 | `...openai.vadThreshold` | `0.5` |
    | 침묵 지속 시간 | `...openai.silenceDurationMs` | `500` |
    | API 키 | `...openai.apiKey` | `OPENAI_API_KEY`로 폴백 |

    <Note>
    `azureEndpoint`와 `azureDeployment` config 키를 통해 Azure OpenAI를 지원합니다. 양방향 도구 호출을 지원합니다. G.711 u-law 오디오 형식을 사용합니다.
    </Note>

  </Accordion>
</AccordionGroup>

## Azure OpenAI 엔드포인트

번들 `openai` provider는 base URL을 재정의하여 이미지
생성을 Azure OpenAI 리소스로 보낼 수 있습니다. 이미지 생성 경로에서 OpenClaw는
`models.providers.openai.baseUrl`의 Azure 호스트 이름을 감지하면
자동으로 Azure 요청 형식으로 전환합니다.

<Note>
실시간 음성은 별도의 구성 경로
(`plugins.entries.voice-call.config.realtime.providers.openai.azureEndpoint`)를 사용하며 `models.providers.openai.baseUrl`의 영향을 받지 않습니다. Azure
설정은 [음성 및 발화](#voice-and-speech)의 **실시간
음성** 아코디언을 참조하세요.
</Note>

다음 경우 Azure OpenAI를 사용하세요.

- 이미 Azure OpenAI 구독, quota, 또는 엔터프라이즈 계약이 있는 경우
- Azure가 제공하는 리전 데이터 상주성 또는 규정 준수 제어가 필요한 경우
- 기존 Azure tenancy 내부에서 트래픽을 유지하고 싶은 경우

### 구성

번들 `openai` provider를 통한 Azure 이미지 생성의 경우,
`models.providers.openai.baseUrl`을 Azure 리소스로 지정하고 `apiKey`에는
OpenAI Platform 키가 아닌 Azure OpenAI 키를 설정하세요.

```json5
{
  models: {
    providers: {
      openai: {
        baseUrl: "https://<your-resource>.openai.azure.com",
        apiKey: "<azure-openai-api-key>",
      },
    },
  },
}
```

OpenClaw는 Azure 이미지 생성
경로에 대해 다음 Azure 호스트 접미사를 인식합니다.

- `*.openai.azure.com`
- `*.services.ai.azure.com`
- `*.cognitiveservices.azure.com`

인식된 Azure 호스트로 향하는 이미지 생성 요청에서 OpenClaw는:

- `Authorization: Bearer` 대신 `api-key` 헤더를 보냄
- deployment 범위 경로(`/openai/deployments/{deployment}/...`)를 사용
- 각 요청에 `?api-version=...`를 붙임

다른 base URL(공개 OpenAI, OpenAI 호환 프록시)은 표준
OpenAI 이미지 요청 형식을 유지합니다.

<Note>
`openai` provider의 이미지 생성 경로에 대한 Azure 라우팅은
OpenClaw 2026.4.22 이상이 필요합니다. 이전 버전은 사용자 지정
`openai.baseUrl`을 모두 공개 OpenAI 엔드포인트처럼 취급하므로 Azure
이미지 deployment에 대해 실패합니다.
</Note>

### API 버전

Azure 이미지 생성 경로에 대해 특정 Azure preview 또는 GA 버전을 고정하려면
`AZURE_OPENAI_API_VERSION`을 설정하세요.

```bash
export AZURE_OPENAI_API_VERSION="2024-12-01-preview"
```

변수가 설정되지 않았을 때 기본값은 `2024-12-01-preview`입니다.

### 모델 이름은 deployment 이름

Azure OpenAI는 모델을 deployment에 바인딩합니다. 번들 `openai` provider를 통해 라우팅되는 Azure 이미지 생성 요청에서 OpenClaw의 `model` 필드는 공개 OpenAI 모델 ID가 아니라 Azure 포털에서 구성한 **Azure deployment 이름**이어야 합니다.

`gpt-image-2`를 제공하는 `gpt-image-2-prod`라는 deployment를 만들었다면:

```
/tool image_generate model=openai/gpt-image-2-prod prompt="A clean poster" size=1024x1024 count=1
```

같은 deployment 이름 규칙이 번들 `openai` provider를 통해 라우팅되는 이미지 생성 호출에도 적용됩니다.

### 리전 가용성

Azure 이미지 생성은 현재 일부 리전에서만 사용할 수 있습니다
(예: `eastus2`, `swedencentral`, `polandcentral`, `westus3`,
`uaenorth`). deployment를 만들기 전에 Microsoft의 최신 리전 목록을 확인하고, 특정 모델이 해당 리전에서 제공되는지도 확인하세요.

### 파라미터 차이점

Azure OpenAI와 공개 OpenAI는 항상 같은 이미지 파라미터를 받는 것은 아닙니다.
Azure는 공개 OpenAI가 허용하는 옵션(예: `gpt-image-2`의 특정
`background` 값)을 거부하거나 특정 모델 버전에서만 노출할 수 있습니다.
이 차이점은 OpenClaw가 아니라 Azure와 기본 모델에서 비롯됩니다.
Azure 요청이 검증 오류로 실패하면 Azure 포털에서
해당 deployment와 API 버전이 지원하는 파라미터 집합을 확인하세요.

<Note>
Azure OpenAI는 네이티브 전송과 호환 동작을 사용하지만
OpenClaw의 숨겨진 attribution 헤더는 받지 않습니다. 자세한 내용은 [고급 구성](#advanced-configuration)의 **네이티브 vs OpenAI 호환
경로** 아코디언을 참조하세요.

이미지 생성 외의 Azure chat 또는 Responses 트래픽에는 온보딩 흐름이나 전용 Azure provider config를 사용하세요. `openai.baseUrl`만으로는 Azure API/인증 형식을 사용하지 않습니다. 별도의
`azure-openai-responses/*` provider가 있습니다. 아래의
서버 측 Compaction 아코디언을 참조하세요.
</Note>

## 고급 구성

<AccordionGroup>
  <Accordion title="전송(WebSocket vs SSE)">
    OpenClaw는 `openai/*`와 `openai-codex/*` 모두에 대해 WebSocket 우선, SSE 폴백(`"auto"`)을 사용합니다.

    `"auto"` 모드에서 OpenClaw는:
    - 초기 WebSocket 실패 1회를 재시도한 뒤 SSE로 폴백합니다
    - 실패 후 약 60초 동안 WebSocket을 degraded로 표시하고 cool-down 동안 SSE를 사용합니다
    - 재시도와 재연결을 위해 안정적인 세션 및 턴 ID 헤더를 첨부합니다
    - 전송 방식별 usage 카운터(`input_tokens` / `prompt_tokens`)를 정규화합니다

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
            "openai/gpt-5.4": {
              params: { transport: "auto" },
            },
            "openai-codex/gpt-5.5": {
              params: { transport: "auto" },
            },
          },
        },
      },
    }
    ```

    관련 OpenAI 문서:
    - [WebSocket을 사용하는 Realtime API](https://platform.openai.com/docs/guides/realtime-websocket)
    - [스트리밍 API 응답(SSE)](https://platform.openai.com/docs/guides/streaming-responses)

  </Accordion>

  <Accordion title="WebSocket 워밍업">
    OpenClaw는 첫 턴 지연 시간을 줄이기 위해 `openai/*`와 `openai-codex/*`에 대해 기본적으로 WebSocket 워밍업을 활성화합니다.

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
    OpenClaw는 `openai/*`와 `openai-codex/*`에 대해 공유 빠른 모드 토글을 노출합니다.

    - **채팅/UI:** `/fast status|on|off`
    - **Config:** `agents.defaults.models["<provider>/<model>"].params.fastMode`

    활성화되면 OpenClaw는 빠른 모드를 OpenAI 우선 처리(`service_tier = "priority"`)로 매핑합니다. 기존 `service_tier` 값은 보존되며, 빠른 모드는 `reasoning`이나 `text.verbosity`를 다시 쓰지 않습니다.

    ```json5
    {
      agents: {
        defaults: {
          models: {
            "openai/gpt-5.4": { params: { fastMode: true } },
          },
        },
      },
    }
    ```

    <Note>
    세션 재정의가 config보다 우선합니다. Sessions UI에서 세션 재정의를 지우면 세션은 다시 구성된 기본값으로 돌아갑니다.
    </Note>

  </Accordion>

  <Accordion title="우선 처리(service_tier)">
    OpenAI API는 `service_tier`를 통해 우선 처리를 제공합니다. OpenClaw에서 모델별로 설정하세요.

    ```json5
    {
      agents: {
        defaults: {
          models: {
            "openai/gpt-5.4": { params: { serviceTier: "priority" } },
          },
        },
      },
    }
    ```

    지원 값: `auto`, `default`, `flex`, `priority`.

    <Warning>
    `serviceTier`는 네이티브 OpenAI 엔드포인트(`api.openai.com`)와 네이티브 Codex 엔드포인트(`chatgpt.com/backend-api`)에만 전달됩니다. 둘 중 하나라도 프록시를 통해 라우팅하면 OpenClaw는 `service_tier`를 건드리지 않습니다.
    </Warning>

  </Accordion>

  <Accordion title="서버 측 Compaction (Responses API)">
    직접 OpenAI Responses 모델(`api.openai.com`의 `openai/*`)의 경우, OpenAI Plugin의 Pi-harness 스트림 wrapper가 서버 측 Compaction을 자동 활성화합니다.

    - `store: true` 강제(model compat가 `supportsStore: false`로 설정하지 않는 한)
    - `context_management: [{ type: "compaction", compact_threshold: ... }]` 주입
    - 기본 `compact_threshold`: `contextWindow`의 70%(사용할 수 없으면 `80000`)

    이는 내장 Pi harness 경로와 내장 실행에 사용되는 OpenAI provider hook에 적용됩니다. 네이티브 Codex app-server 하니스는 Codex를 통해 자체 컨텍스트를 관리하며 `agents.defaults.embeddedHarness.runtime`로 별도 구성됩니다.

    <Tabs>
      <Tab title="명시적으로 활성화">
        Azure OpenAI Responses 같은 호환 엔드포인트에 유용합니다.

        ```json5
        {
          agents: {
            defaults: {
              models: {
                "azure-openai-responses/gpt-5.5": {
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
    `responsesServerCompaction`은 `context_management` 주입만 제어합니다. 직접 OpenAI Responses 모델은 compat가 `supportsStore: false`로 설정하지 않는 한 여전히 `store: true`를 강제합니다.
    </Note>

  </Accordion>

  <Accordion title="엄격한 agentic GPT 모드">
    `openai/*`의 GPT-5 계열 실행에 대해 OpenClaw는 더 엄격한 내장 실행 계약을 사용할 수 있습니다.

    ```json5
    {
      agents: {
        defaults: {
          embeddedPi: { executionContract: "strict-agentic" },
        },
      },
    }
    ```

    `strict-agentic`에서는 OpenClaw가:
    - 도구 작업을 사용할 수 있을 때 더 이상 계획만 하는 턴을 성공적인 진행으로 취급하지 않음
    - act-now steer로 턴을 재시도함
    - 상당한 작업에 대해 `update_plan`을 자동 활성화함
    - 모델이 행동 없이 계속 계획만 세우면 명시적인 blocked 상태를 노출함

    <Note>
    OpenAI와 Codex의 GPT-5 계열 실행에만 범위가 한정됩니다. 다른 provider와 오래된 모델 계열은 기본 동작을 유지합니다.
    </Note>

  </Accordion>

  <Accordion title="네이티브 vs OpenAI 호환 경로">
    OpenClaw는 직접 OpenAI, Codex, Azure OpenAI 엔드포인트를 일반적인 OpenAI 호환 `/v1` 프록시와 다르게 취급합니다.

    **네이티브 경로** (`openai/*`, Azure OpenAI):
    - OpenAI `none` effort를 지원하는 모델에만 `reasoning: { effort: "none" }` 유지
    - `reasoning.effort: "none"`를 거부하는 모델이나 프록시에는 비활성 reasoning을 생략
    - 도구 스키마를 기본적으로 strict 모드로 설정
    - 검증된 네이티브 호스트에만 숨겨진 attribution 헤더 첨부
    - OpenAI 전용 요청 형식 조정 유지(`service_tier`, `store`, reasoning 호환성, prompt-cache 힌트)

    **프록시/호환 경로:**
    - 더 느슨한 compat 동작 사용
    - strict 도구 스키마나 네이티브 전용 헤더를 강제하지 않음

    Azure OpenAI는 네이티브 전송 및 compat 동작을 사용하지만 숨겨진 attribution 헤더는 받지 않습니다.

  </Accordion>
</AccordionGroup>

## 관련 항목

<CardGroup cols={2}>
  <Card title="모델 선택" href="/ko/concepts/model-providers" icon="layers">
    provider, 모델 ref, 페일오버 동작 선택하기
  </Card>
  <Card title="이미지 생성" href="/ko/tools/image-generation" icon="image">
    공유 이미지 도구 파라미터 및 provider 선택
  </Card>
  <Card title="비디오 생성" href="/ko/tools/video-generation" icon="video">
    공유 비디오 도구 파라미터 및 provider 선택
  </Card>
  <Card title="OAuth 및 인증" href="/ko/gateway/authentication" icon="key">
    인증 세부 사항 및 자격 증명 재사용 규칙
  </Card>
</CardGroup>
