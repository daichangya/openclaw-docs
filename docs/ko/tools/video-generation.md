---
read_when:
    - 에이전트를 통해 비디오를 생성하고 있습니다
    - 비디오 생성 provider와 모델을 구성하고 있습니다
    - '`video_generate` 도구 매개변수를 이해하고 있습니다'
summary: 12개 provider 백엔드를 사용해 텍스트, 이미지 또는 기존 비디오에서 비디오 생성
title: 비디오 생성
x-i18n:
    generated_at: "2026-04-07T06:02:55Z"
    model: gpt-5.4
    provider: openai
    source_hash: bf1224c59a5f1217f56cf2001870aca710a09268677dcd12aad2efbe476e47b7
    source_path: tools/video-generation.md
    workflow: 15
---

# 비디오 생성

OpenClaw 에이전트는 텍스트 프롬프트, 참조 이미지 또는 기존 비디오에서 비디오를 생성할 수 있습니다. 12개의 provider 백엔드가 지원되며, 각각 서로 다른 모델 옵션, 입력 모드, 기능 집합을 제공합니다. 에이전트는 구성과 사용 가능한 API 키를 바탕으로 적절한 provider를 자동으로 선택합니다.

<Note>
`video_generate` 도구는 하나 이상의 비디오 생성 provider를 사용할 수 있을 때만 표시됩니다. 에이전트 도구에서 이 항목이 보이지 않으면 provider API 키를 설정하거나 `agents.defaults.videoGenerationModel`을 구성하세요.
</Note>

OpenClaw는 비디오 생성을 세 가지 런타임 모드로 처리합니다.

- 참조 미디어가 없는 텍스트-비디오 요청용 `generate`
- 요청에 하나 이상의 참조 이미지가 포함될 때의 `imageToVideo`
- 요청에 하나 이상의 참조 비디오가 포함될 때의 `videoToVideo`

provider는 이 모드들 중 일부만 지원할 수 있습니다. 도구는 제출 전에 활성
모드를 검증하고, `action=list`에서 지원되는 모드를 보고합니다.

## 빠른 시작

1. 지원되는 provider 중 하나의 API 키를 설정합니다.

```bash
export GEMINI_API_KEY="your-key"
```

2. 선택적으로 기본 모델을 고정합니다.

```bash
openclaw config set agents.defaults.videoGenerationModel.primary "google/veo-3.1-fast-generate-preview"
```

3. 에이전트에게 요청합니다.

> 석양 속에서 친근한 바닷가재가 서핑하는 5초짜리 영화 같은 비디오를 생성해줘.

에이전트는 자동으로 `video_generate`를 호출합니다. 도구 allowlist는 필요하지 않습니다.

## 비디오를 생성할 때 일어나는 일

비디오 생성은 비동기 방식입니다. 세션에서 에이전트가 `video_generate`를 호출하면:

1. OpenClaw는 요청을 provider에 제출하고 즉시 작업 ID를 반환합니다.
2. provider는 백그라운드에서 작업을 처리합니다(일반적으로 provider와 해상도에 따라 30초에서 5분).
3. 비디오가 준비되면 OpenClaw는 내부 완료 이벤트로 같은 세션을 다시 깨웁니다.
4. 에이전트는 완성된 비디오를 원래 대화에 다시 게시합니다.

작업이 진행 중인 동안에는 같은 세션에서 중복 `video_generate` 호출을 하면 새 생성을 시작하는 대신 현재 작업 상태를 반환합니다. CLI에서 진행 상황을 확인하려면 `openclaw tasks list` 또는 `openclaw tasks show <taskId>`를 사용하세요.

세션 기반 에이전트 실행이 아닌 경우(예: 직접 도구 호출)에는 이 도구가 인라인 생성으로 대체되어 같은 턴에서 최종 미디어 경로를 반환합니다.

### 작업 수명 주기

각 `video_generate` 요청은 네 가지 상태를 거칩니다.

1. **queued** -- 작업이 생성되었고, provider가 수락하기를 기다리는 중입니다.
2. **running** -- provider가 처리 중입니다(일반적으로 provider와 해상도에 따라 30초에서 5분).
3. **succeeded** -- 비디오가 준비되었고, 에이전트가 깨어나 대화에 게시합니다.
4. **failed** -- provider 오류 또는 시간 초과가 발생했으며, 에이전트가 오류 세부 정보와 함께 깨어납니다.

CLI에서 상태 확인:

```bash
openclaw tasks list
openclaw tasks show <taskId>
openclaw tasks cancel <taskId>
```

중복 방지: 현재 세션에 대해 비디오 작업이 이미 `queued` 또는 `running` 상태이면, `video_generate`는 새 작업을 시작하는 대신 기존 작업 상태를 반환합니다. 새 생성을 트리거하지 않고 명시적으로 확인하려면 `action: "status"`를 사용하세요.

## 지원되는 provider

| Provider | 기본 모델 | 텍스트 | 이미지 참조 | 비디오 참조 | API 키 |
| -------- | ------------------------------- | ---- | ----------------- | ---------------- | ---------------------------------------- |
| Alibaba  | `wan2.6-t2v`                    | Yes  | Yes (원격 URL)  | Yes (원격 URL) | `MODELSTUDIO_API_KEY`                    |
| BytePlus | `seedance-1-0-lite-t2v-250428`  | Yes  | 이미지 1개           | No               | `BYTEPLUS_API_KEY`                       |
| ComfyUI  | `workflow`                      | Yes  | 이미지 1개           | No               | `COMFY_API_KEY` 또는 `COMFY_CLOUD_API_KEY` |
| fal      | `fal-ai/minimax/video-01-live`  | Yes  | 이미지 1개           | No               | `FAL_KEY`                                |
| Google   | `veo-3.1-fast-generate-preview` | Yes  | 이미지 1개           | 비디오 1개          | `GEMINI_API_KEY`                         |
| MiniMax  | `MiniMax-Hailuo-2.3`            | Yes  | 이미지 1개           | No               | `MINIMAX_API_KEY`                        |
| OpenAI   | `sora-2`                        | Yes  | 이미지 1개           | 비디오 1개          | `OPENAI_API_KEY`                         |
| Qwen     | `wan2.6-t2v`                    | Yes  | Yes (원격 URL)  | Yes (원격 URL) | `QWEN_API_KEY`                           |
| Runway   | `gen4.5`                        | Yes  | 이미지 1개           | 비디오 1개          | `RUNWAYML_API_SECRET`                    |
| Together | `Wan-AI/Wan2.2-T2V-A14B`        | Yes  | 이미지 1개           | No               | `TOGETHER_API_KEY`                       |
| Vydra    | `veo3`                          | Yes  | 이미지 1개 (`kling`) | No               | `VYDRA_API_KEY`                          |
| xAI      | `grok-imagine-video`            | Yes  | 이미지 1개           | 비디오 1개          | `XAI_API_KEY`                            |

일부 provider는 추가 또는 대체 API 키 env var를 허용합니다. 자세한 내용은 개별 [provider 페이지](#related)를 참조하세요.

사용 가능한 provider, 모델,
런타임 모드를 런타임에 확인하려면 `video_generate action=list`를 실행하세요.

### 선언된 기능 매트릭스

이 표는 `video_generate`, 계약 테스트,
공유 라이브 스윕에서 사용하는 명시적 모드 계약입니다.

| Provider | `generate` | `imageToVideo` | `videoToVideo` | 현재의 공유 라이브 레인 |
| -------- | ---------- | -------------- | -------------- | ---------------------------------------------------------------------------------------------------------------------------------------- |
| Alibaba  | Yes        | Yes            | Yes            | `generate`, `imageToVideo`; 이 provider는 원격 `http(s)` 비디오 URL이 필요하므로 `videoToVideo`는 건너뜀 |
| BytePlus | Yes        | Yes            | No             | `generate`, `imageToVideo` |
| ComfyUI  | Yes        | Yes            | No             | 공유 스윕에는 포함되지 않음. workflow별 커버리지는 Comfy 테스트에 있음 |
| fal      | Yes        | Yes            | No             | `generate`, `imageToVideo` |
| Google   | Yes        | Yes            | Yes            | `generate`, `imageToVideo`; 현재 버퍼 기반 Gemini/Veo 스윕이 해당 입력을 허용하지 않으므로 공유 `videoToVideo`는 건너뜀 |
| MiniMax  | Yes        | Yes            | No             | `generate`, `imageToVideo` |
| OpenAI   | Yes        | Yes            | Yes            | `generate`, `imageToVideo`; 이 org/입력 경로는 현재 provider 측 inpaint/remix 접근이 필요하므로 공유 `videoToVideo`는 건너뜀 |
| Qwen     | Yes        | Yes            | Yes            | `generate`, `imageToVideo`; 이 provider는 원격 `http(s)` 비디오 URL이 필요하므로 `videoToVideo`는 건너뜀 |
| Runway   | Yes        | Yes            | Yes            | `generate`, `imageToVideo`; `videoToVideo`는 선택된 모델이 `runway/gen4_aleph`일 때만 실행됨 |
| Together | Yes        | Yes            | No             | `generate`, `imageToVideo` |
| Vydra    | Yes        | Yes            | No             | `generate`; 번들된 `veo3`는 텍스트 전용이고 번들된 `kling`은 원격 이미지 URL이 필요하므로 공유 `imageToVideo`는 건너뜀 |
| xAI      | Yes        | Yes            | Yes            | `generate`, `imageToVideo`; 이 provider는 현재 원격 MP4 URL이 필요하므로 `videoToVideo`는 건너뜀 |

## 도구 매개변수

### 필수

| 매개변수 | 유형 | 설명 |
| --------- | ------ | ----------------------------------------------------------------------------- |
| `prompt`  | string | 생성할 비디오의 텍스트 설명(`action: "generate"`에 필수) |

### 콘텐츠 입력

| 매개변수 | 유형 | 설명 |
| --------- | -------- | ------------------------------------ |
| `image`   | string   | 단일 참조 이미지(경로 또는 URL) |
| `images`  | string[] | 여러 참조 이미지(최대 5개) |
| `video`   | string   | 단일 참조 비디오(경로 또는 URL) |
| `videos`  | string[] | 여러 참조 비디오(최대 4개) |

### 스타일 제어

| 매개변수 | 유형 | 설명 |
| ----------------- | ------- | ------------------------------------------------------------------------ |
| `aspectRatio`     | string  | `1:1`, `2:3`, `3:2`, `3:4`, `4:3`, `4:5`, `5:4`, `9:16`, `16:9`, `21:9` |
| `resolution`      | string  | `480P`, `720P`, `768P`, 또는 `1080P` |
| `durationSeconds` | number  | 목표 길이(초, 가장 가까운 provider 지원 값으로 반올림됨) |
| `size`            | string  | provider가 지원할 때 사용하는 크기 힌트 |
| `audio`           | boolean | 지원되는 경우 생성된 오디오 활성화 |
| `watermark`       | boolean | 지원되는 경우 provider 워터마크 토글 |

### 고급

| 매개변수 | 유형 | 설명 |
| ---------- | ------ | ----------------------------------------------- |
| `action`   | string | `"generate"`(기본값), `"status"`, 또는 `"list"` |
| `model`    | string | provider/모델 재정의(예: `runway/gen4.5`) |
| `filename` | string | 출력 파일 이름 힌트 |

모든 provider가 모든 매개변수를 지원하는 것은 아닙니다. OpenClaw는 이미 길이를 가장 가까운 provider 지원 값으로 정규화하며, 대체 provider가 다른 제어 표면을 노출할 때 크기-대-종횡비 같은 번역된 기하 힌트도 다시 매핑합니다. 실제로 지원되지 않는 재정의는 가능한 범위에서 무시되며 도구 결과에서 경고로 보고됩니다. 하드 기능 제한(예: 참조 입력이 너무 많음)은 제출 전에 실패합니다.

도구 결과에는 적용된 설정이 보고됩니다. OpenClaw가 provider 대체 중 길이 또는 기하를 다시 매핑하면, 반환되는 `durationSeconds`, `size`, `aspectRatio`, `resolution` 값은 실제 제출된 값을 반영하며, `details.normalization`은 요청값에서 적용값으로의 변환을 기록합니다.

참조 입력은 런타임 모드도 선택합니다.

- 참조 미디어 없음: `generate`
- 이미지 참조가 하나라도 있으면: `imageToVideo`
- 비디오 참조가 하나라도 있으면: `videoToVideo`

이미지와 비디오 참조를 혼합하는 것은 안정적인 공유 기능 표면이 아닙니다.
요청당 하나의 참조 유형만 사용하는 것을 권장합니다.

## 작업

- **generate** (기본값) -- 지정된 프롬프트와 선택적 참조 입력으로 비디오를 생성합니다.
- **status** -- 새 생성을 시작하지 않고 현재 세션의 진행 중인 비디오 작업 상태를 확인합니다.
- **list** -- 사용 가능한 provider, 모델 및 해당 기능을 표시합니다.

## 모델 선택

비디오를 생성할 때 OpenClaw는 다음 순서로 모델을 결정합니다.

1. **`model` 도구 매개변수** -- 에이전트가 호출에서 지정한 경우
2. **`videoGenerationModel.primary`** -- config에서
3. **`videoGenerationModel.fallbacks`** -- 순서대로 시도
4. **자동 감지** -- 현재 기본 provider부터 시작한 뒤 나머지 provider를 알파벳순으로 시도하며, 유효한 인증이 있는 provider를 사용

provider가 실패하면 다음 후보를 자동으로 시도합니다. 모든 후보가 실패하면 오류에 각 시도의 세부 정보가 포함됩니다.

비디오 생성에서 명시적인 `model`, `primary`, `fallbacks`
항목만 사용하도록 하려면 `agents.defaults.mediaGenerationAutoProviderFallback: false`를 설정하세요.

```json5
{
  agents: {
    defaults: {
      videoGenerationModel: {
        primary: "google/veo-3.1-fast-generate-preview",
        fallbacks: ["runway/gen4.5", "qwen/wan2.6-t2v"],
      },
    },
  },
}
```

## provider 참고

| Provider | 참고 |
| -------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Alibaba  | DashScope/Model Studio 비동기 엔드포인트를 사용합니다. 참조 이미지와 비디오는 원격 `http(s)` URL이어야 합니다. |
| BytePlus | 단일 이미지 참조만 지원합니다. |
| ComfyUI  | workflow 기반 로컬 또는 클라우드 실행입니다. 구성된 그래프를 통해 텍스트-비디오와 이미지-비디오를 지원합니다. |
| fal      | 장시간 실행 작업에 queue 기반 흐름을 사용합니다. 단일 이미지 참조만 지원합니다. |
| Google   | Gemini/Veo를 사용합니다. 이미지 1개 또는 비디오 1개 참조를 지원합니다. |
| MiniMax  | 단일 이미지 참조만 지원합니다. |
| OpenAI   | `size` 재정의만 전달됩니다. 다른 스타일 재정의(`aspectRatio`, `resolution`, `audio`, `watermark`)는 경고와 함께 무시됩니다. |
| Qwen     | Alibaba와 같은 DashScope 백엔드를 사용합니다. 참조 입력은 원격 `http(s)` URL이어야 하며, 로컬 파일은 사전에 거부됩니다. |
| Runway   | 데이터 URI를 통해 로컬 파일을 지원합니다. 비디오-비디오에는 `runway/gen4_aleph`가 필요합니다. 텍스트 전용 실행은 `16:9`와 `9:16` 종횡비를 노출합니다. |
| Together | 단일 이미지 참조만 지원합니다. |
| Vydra    | 인증이 누락되는 리디렉션을 피하기 위해 `https://www.vydra.ai/api/v1`를 직접 사용합니다. `veo3`는 텍스트-비디오 전용으로 번들되며, `kling`은 원격 이미지 URL이 필요합니다. |
| xAI      | 텍스트-비디오, 이미지-비디오, 원격 비디오 편집/확장 흐름을 지원합니다. |

## provider 기능 모드

공유 비디오 생성 계약은 이제 provider가 평면 집계 제한만이 아니라
모드별 기능을 선언할 수 있게 합니다. 새 provider
구현은 명시적인 모드 블록을 사용하는 것이 좋습니다.

```typescript
capabilities: {
  generate: {
    maxVideos: 1,
    maxDurationSeconds: 10,
    supportsResolution: true,
  },
  imageToVideo: {
    enabled: true,
    maxVideos: 1,
    maxInputImages: 1,
    maxDurationSeconds: 5,
  },
  videoToVideo: {
    enabled: true,
    maxVideos: 1,
    maxInputVideos: 1,
    maxDurationSeconds: 5,
  },
}
```

`maxInputImages` 및 `maxInputVideos` 같은 평면 집계 필드만으로는
변환 모드 지원을 충분히 알릴 수 없습니다. provider는 라이브 테스트,
계약 테스트, 공유 `video_generate` 도구가 모드 지원을 결정적으로 검증할 수 있도록
`generate`, `imageToVideo`, `videoToVideo`를 명시적으로 선언해야 합니다.

## 라이브 테스트

공유 번들 provider를 위한 옵트인 라이브 커버리지:

```bash
OPENCLAW_LIVE_TEST=1 pnpm test:live -- extensions/video-generation-providers.live.test.ts
```

리포지토리 래퍼:

```bash
pnpm test:live:media video
```

이 라이브 파일은 누락된 provider env var를 `~/.profile`에서 로드하고,
기본적으로 저장된 auth profile보다 라이브/env API 키를 우선하며,
로컬 미디어로 안전하게 실행할 수 있는 선언된 모드를 실행합니다.

- 스윕의 모든 provider에 대한 `generate`
- `capabilities.imageToVideo.enabled`일 때 `imageToVideo`
- `capabilities.videoToVideo.enabled`이고 provider/모델이
  공유 스윕에서 버퍼 기반 로컬 비디오 입력을 수용할 때 `videoToVideo`

현재 공유 `videoToVideo` 라이브 레인은 다음을 포함합니다.

- `runway/gen4_aleph`를 선택했을 때의 `runway`만

## 구성

OpenClaw config에서 기본 비디오 생성 모델을 설정합니다.

```json5
{
  agents: {
    defaults: {
      videoGenerationModel: {
        primary: "qwen/wan2.6-t2v",
        fallbacks: ["qwen/wan2.6-r2v-flash"],
      },
    },
  },
}
```

또는 CLI를 통해:

```bash
openclaw config set agents.defaults.videoGenerationModel.primary "qwen/wan2.6-t2v"
```

## 관련 항목

- [도구 개요](/ko/tools)
- [백그라운드 작업](/ko/automation/tasks) -- 비동기 비디오 생성을 위한 작업 추적
- [Alibaba Model Studio](/ko/providers/alibaba)
- [BytePlus](/ko/concepts/model-providers#byteplus-international)
- [ComfyUI](/ko/providers/comfy)
- [fal](/ko/providers/fal)
- [Google (Gemini)](/ko/providers/google)
- [MiniMax](/ko/providers/minimax)
- [OpenAI](/ko/providers/openai)
- [Qwen](/ko/providers/qwen)
- [Runway](/ko/providers/runway)
- [Together AI](/ko/providers/together)
- [Vydra](/ko/providers/vydra)
- [xAI](/ko/providers/xai)
- [구성 참조](/ko/gateway/configuration-reference#agent-defaults)
- [모델](/ko/concepts/models)
