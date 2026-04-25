---
read_when:
    - 에이전트를 통해 비디오 생성하기
    - 비디오 생성 provider 및 모델 구성하기
    - '`video_generate` 도구 매개변수 이해하기'
summary: 14개 provider 백엔드를 사용해 텍스트, 이미지 또는 기존 비디오에서 비디오를 생성합니다
title: 비디오 생성
x-i18n:
    generated_at: "2026-04-25T12:30:04Z"
    model: gpt-5.4
    provider: openai
    source_hash: 0a16c56939967a6268e62a267598fe03d2eb3195384ad805652498004fdaf886
    source_path: tools/video-generation.md
    workflow: 15
---

OpenClaw 에이전트는 텍스트 프롬프트, 참조 이미지 또는 기존 비디오에서 비디오를 생성할 수 있습니다. 14개의 provider 백엔드가 지원되며, 각각 다른 모델 옵션, 입력 모드, 기능 집합을 가집니다. 에이전트는 구성과 사용 가능한 API 키를 기준으로 적절한 provider를 자동으로 선택합니다.

<Note>
`video_generate` 도구는 하나 이상의 비디오 생성 provider를 사용할 수 있을 때만 표시됩니다. 에이전트 도구에 보이지 않는다면 provider API 키를 설정하거나 `agents.defaults.videoGenerationModel`을 구성하세요.
</Note>

OpenClaw는 비디오 생성을 세 가지 런타임 모드로 취급합니다.

- 참조 미디어가 없는 텍스트-투-비디오 요청에는 `generate`
- 요청에 하나 이상의 참조 이미지가 포함되면 `imageToVideo`
- 요청에 하나 이상의 참조 비디오가 포함되면 `videoToVideo`

provider는 이들 모드의 일부만 지원할 수 있습니다. 도구는 제출 전에 활성 모드를 검증하고 `action=list`에서 지원되는 모드를 보고합니다.

## 빠른 시작

1. 지원되는 provider의 API 키를 설정합니다.

```bash
export GEMINI_API_KEY="your-key"
```

2. 선택적으로 기본 모델을 고정합니다.

```bash
openclaw config set agents.defaults.videoGenerationModel.primary "google/veo-3.1-fast-generate-preview"
```

3. 에이전트에게 요청합니다.

> 해질녘에 서핑하는 친근한 바닷가재의 5초짜리 영화 같은 비디오를 생성해줘.

에이전트는 자동으로 `video_generate`를 호출합니다. 도구 허용 목록 설정은 필요하지 않습니다.

## 비디오를 생성하면 어떤 일이 일어나는가

비디오 생성은 비동기식입니다. 에이전트가 세션에서 `video_generate`를 호출하면:

1. OpenClaw가 provider에 요청을 제출하고 즉시 작업 ID를 반환합니다.
2. provider가 백그라운드에서 작업을 처리합니다(일반적으로 provider와 해상도에 따라 30초에서 5분).
3. 비디오가 준비되면 OpenClaw가 내부 완료 이벤트로 같은 세션을 깨웁니다.
4. 에이전트가 완성된 비디오를 원래 대화에 다시 게시합니다.

작업이 진행 중일 때 같은 세션에서 중복된 `video_generate` 호출을 하면 새 생성을 시작하는 대신 현재 작업 상태를 반환합니다. CLI에서 진행 상황을 확인하려면 `openclaw tasks list` 또는 `openclaw tasks show <taskId>`를 사용하세요.

세션 기반 에이전트 실행 외부(예: 직접 도구 호출)에서는 도구가 인라인 생성으로 대체되며 같은 턴에서 최종 미디어 경로를 반환합니다.

생성된 비디오 파일은 provider가 바이트를 반환할 때 OpenClaw가 관리하는 미디어 저장소 아래에 저장됩니다. 기본 생성 비디오 저장 한도는 비디오 미디어 제한을 따르며, `agents.defaults.mediaMaxMb`는 더 큰 렌더를 위해 이를 늘립니다.
provider가 호스팅된 출력 URL도 반환하는 경우, 로컬 저장에서 너무 큰 파일이 거부되더라도 OpenClaw는 작업을 실패시키는 대신 해당 URL을 전달할 수 있습니다.

### 작업 수명 주기

각 `video_generate` 요청은 네 가지 상태를 거칩니다.

1. **queued** -- 작업이 생성되었고 provider가 수락하기를 기다리는 중
2. **running** -- provider가 처리 중(일반적으로 provider와 해상도에 따라 30초에서 5분)
3. **succeeded** -- 비디오 준비 완료, 에이전트가 깨어나 대화에 게시
4. **failed** -- provider 오류 또는 시간 초과, 에이전트가 오류 세부 정보와 함께 깨어남

CLI에서 상태 확인:

```bash
openclaw tasks list
openclaw tasks show <taskId>
openclaw tasks cancel <taskId>
```

중복 방지: 현재 세션에 대한 비디오 작업이 이미 `queued` 또는 `running` 상태라면 `video_generate`는 새 작업을 시작하는 대신 기존 작업 상태를 반환합니다. 새 생성을 트리거하지 않고 명시적으로 확인하려면 `action: "status"`를 사용하세요.

## 지원되는 provider

| Provider              | Default model                   | Text | Image ref                                            | Video ref        | API key                                  |
| --------------------- | ------------------------------- | ---- | ---------------------------------------------------- | ---------------- | ---------------------------------------- |
| Alibaba               | `wan2.6-t2v`                    | Yes  | Yes (remote URL)                                     | Yes (remote URL) | `MODELSTUDIO_API_KEY`                    |
| BytePlus (1.0)        | `seedance-1-0-pro-250528`       | Yes  | Up to 2 images (I2V models only; first + last frame) | No               | `BYTEPLUS_API_KEY`                       |
| BytePlus Seedance 1.5 | `seedance-1-5-pro-251215`       | Yes  | Up to 2 images (first + last frame via role)         | No               | `BYTEPLUS_API_KEY`                       |
| BytePlus Seedance 2.0 | `dreamina-seedance-2-0-260128`  | Yes  | Up to 9 reference images                             | Up to 3 videos   | `BYTEPLUS_API_KEY`                       |
| ComfyUI               | `workflow`                      | Yes  | 1 image                                              | No               | `COMFY_API_KEY` or `COMFY_CLOUD_API_KEY` |
| fal                   | `fal-ai/minimax/video-01-live`  | Yes  | 1 image                                              | No               | `FAL_KEY`                                |
| Google                | `veo-3.1-fast-generate-preview` | Yes  | 1 image                                              | 1 video          | `GEMINI_API_KEY`                         |
| MiniMax               | `MiniMax-Hailuo-2.3`            | Yes  | 1 image                                              | No               | `MINIMAX_API_KEY`                        |
| OpenAI                | `sora-2`                        | Yes  | 1 image                                              | 1 video          | `OPENAI_API_KEY`                         |
| Qwen                  | `wan2.6-t2v`                    | Yes  | Yes (remote URL)                                     | Yes (remote URL) | `QWEN_API_KEY`                           |
| Runway                | `gen4.5`                        | Yes  | 1 image                                              | 1 video          | `RUNWAYML_API_SECRET`                    |
| Together              | `Wan-AI/Wan2.2-T2V-A14B`        | Yes  | 1 image                                              | No               | `TOGETHER_API_KEY`                       |
| Vydra                 | `veo3`                          | Yes  | 1 image (`kling`)                                    | No               | `VYDRA_API_KEY`                          |
| xAI                   | `grok-imagine-video`            | Yes  | 1 image                                              | 1 video          | `XAI_API_KEY`                            |

일부 provider는 추가 또는 대체 API 키 env var를 허용합니다. 자세한 내용은 개별 [provider pages](#related)를 참조하세요.

런타임에서 사용 가능한 provider, 모델, 런타임 모드를 확인하려면 `video_generate action=list`를 실행하세요.

### 선언된 기능 매트릭스

이것은 `video_generate`, 계약 테스트, 공유 라이브 스윕에서 사용하는 명시적 모드 계약입니다.

| Provider | `generate` | `imageToVideo` | `videoToVideo` | Shared live lanes today                                                                                                                  |
| -------- | ---------- | -------------- | -------------- | ---------------------------------------------------------------------------------------------------------------------------------------- |
| Alibaba  | Yes        | Yes            | Yes            | `generate`, `imageToVideo`; `videoToVideo` skipped because this provider needs remote `http(s)` video URLs                               |
| BytePlus | Yes        | Yes            | No             | `generate`, `imageToVideo`                                                                                                               |
| ComfyUI  | Yes        | Yes            | No             | Not in the shared sweep; workflow-specific coverage lives with Comfy tests                                                               |
| fal      | Yes        | Yes            | No             | `generate`, `imageToVideo`                                                                                                               |
| Google   | Yes        | Yes            | Yes            | `generate`, `imageToVideo`; shared `videoToVideo` skipped because the current buffer-backed Gemini/Veo sweep does not accept that input  |
| MiniMax  | Yes        | Yes            | No             | `generate`, `imageToVideo`                                                                                                               |
| OpenAI   | Yes        | Yes            | Yes            | `generate`, `imageToVideo`; shared `videoToVideo` skipped because this org/input path currently needs provider-side inpaint/remix access |
| Qwen     | Yes        | Yes            | Yes            | `generate`, `imageToVideo`; `videoToVideo` skipped because this provider needs remote `http(s)` video URLs                               |
| Runway   | Yes        | Yes            | Yes            | `generate`, `imageToVideo`; `videoToVideo` runs only when the selected model is `runway/gen4_aleph`                                      |
| Together | Yes        | Yes            | No             | `generate`, `imageToVideo`                                                                                                               |
| Vydra    | Yes        | Yes            | No             | `generate`; shared `imageToVideo` skipped because bundled `veo3` is text-only and bundled `kling` requires a remote image URL            |
| xAI      | Yes        | Yes            | Yes            | `generate`, `imageToVideo`; `videoToVideo` skipped because this provider currently needs a remote MP4 URL                                |

## 도구 매개변수

### 필수

| Parameter | Type   | Description                                                                        |
| --------- | ------ | ---------------------------------------------------------------------------------- |
| `prompt`  | string | 생성할 비디오의 텍스트 설명(`action: "generate"`일 때 필수)                        |

### 콘텐츠 입력

| Parameter    | Type     | Description                                                                                                                            |
| ------------ | -------- | -------------------------------------------------------------------------------------------------------------------------------------- |
| `image`      | string   | 단일 참조 이미지(경로 또는 URL)                                                                                                        |
| `images`     | string[] | 여러 참조 이미지(최대 9개)                                                                                                             |
| `imageRoles` | string[] | 결합된 이미지 목록과 위치별로 대응하는 선택적 역할 힌트. 표준 값: `first_frame`, `last_frame`, `reference_image`                      |
| `video`      | string   | 단일 참조 비디오(경로 또는 URL)                                                                                                        |
| `videos`     | string[] | 여러 참조 비디오(최대 4개)                                                                                                             |
| `videoRoles` | string[] | 결합된 비디오 목록과 위치별로 대응하는 선택적 역할 힌트. 표준 값: `reference_video`                                                   |
| `audioRef`   | string   | 단일 참조 오디오(경로 또는 URL). provider가 오디오 입력을 지원할 때 배경 음악 또는 음성 참조 등에 사용                                |
| `audioRefs`  | string[] | 여러 참조 오디오(최대 3개)                                                                                                             |
| `audioRoles` | string[] | 결합된 오디오 목록과 위치별로 대응하는 선택적 역할 힌트. 표준 값: `reference_audio`                                                   |

역할 힌트는 provider에 있는 그대로 전달됩니다. 표준 값은
`VideoGenerationAssetRole` 유니언에서 오지만 provider는 추가
역할 문자열을 허용할 수 있습니다. `*Roles` 배열에는 대응하는 참조 목록보다
더 많은 항목이 있어서는 안 됩니다. 하나 차이 나는 실수도 명확한 오류와 함께 실패합니다.
슬롯을 설정하지 않으려면 빈 문자열을 사용하세요.

### 스타일 제어

| Parameter         | Type    | Description                                                                                  |
| ----------------- | ------- | -------------------------------------------------------------------------------------------- |
| `aspectRatio`     | string  | `1:1`, `2:3`, `3:2`, `3:4`, `4:3`, `4:5`, `5:4`, `9:16`, `16:9`, `21:9` 또는 `adaptive`     |
| `resolution`      | string  | `480P`, `720P`, `768P` 또는 `1080P`                                                           |
| `durationSeconds` | number  | 목표 길이(초). 가장 가까운 provider 지원 값으로 반올림됨                                     |
| `size`            | string  | provider가 지원할 때 사용하는 크기 힌트                                                     |
| `audio`           | boolean | 지원되는 경우 출력에 생성된 오디오 포함. `audioRef*`(입력)와는 별개                         |
| `watermark`       | boolean | 지원되는 경우 provider 워터마킹 전환                                                         |

`adaptive`는 provider별 센티널 값입니다. 기능에 `adaptive`를 선언한
provider(예: BytePlus Seedance는 입력 이미지
크기에서 비율을 자동 감지하는 데 사용)에는 있는 그대로 전달됩니다. 이를 선언하지 않은
provider는 도구 결과의 `details.ignoredOverrides`를 통해 이 값을 노출하므로
무시된 사실이 드러납니다.

### 고급

| Parameter         | Type   | Description                                                                                                                                                                                                                                                                                                                                                      |
| ----------------- | ------ | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `action`          | string | `"generate"`(기본값), `"status"` 또는 `"list"`                                                                                                                                                                                                                                                                                                                   |
| `model`           | string | provider/model override(예: `runway/gen4.5`)                                                                                                                                                                                                                                                                                                                     |
| `filename`        | string | 출력 파일명 힌트                                                                                                                                                                                                                                                                                                                                                 |
| `timeoutMs`       | number | 선택적 provider 요청 시간 초과(ms)                                                                                                                                                                                                                                                                                                                               |
| `providerOptions` | object | JSON 객체 형태의 provider별 옵션(예: `{"seed": 42, "draft": true}`). 타입이 지정된 스키마를 선언한 provider는 키와 타입을 검증합니다. 알 수 없는 키나 불일치가 있으면 대체 경로에서 해당 후보를 건너뜁니다. 선언된 스키마가 없는 provider는 옵션을 있는 그대로 받습니다. 각 provider가 무엇을 허용하는지 보려면 `video_generate action=list`를 실행하세요 |

모든 provider가 모든 매개변수를 지원하는 것은 아닙니다. OpenClaw는 이미 길이를 가장 가까운 provider 지원 값으로 정규화하며, 대체 provider가 다른 제어 표면을 노출할 경우 크기-대-가로세로비 같은 번역된 지오메트리 힌트도 다시 매핑합니다. 실제로 지원되지 않는 override는 최선의 노력 기준으로 무시되고 도구 결과에 경고로 보고됩니다. 참조 입력이 너무 많음 같은 강한 기능 제한은 제출 전에 실패합니다.

도구 결과는 적용된 설정을 보고합니다. OpenClaw가 provider 대체 중 길이 또는 지오메트리를 다시 매핑하면 반환되는 `durationSeconds`, `size`, `aspectRatio`, `resolution` 값은 실제 제출된 내용을 반영하고, `details.normalization`은 요청값에서 적용값으로의 변환을 캡처합니다.

참조 입력은 런타임 모드도 선택합니다.

- 참조 미디어 없음: `generate`
- 이미지 참조가 하나라도 있음: `imageToVideo`
- 비디오 참조가 하나라도 있음: `videoToVideo`
- 참조 오디오 입력은 결정된 모드를 바꾸지 않습니다. 이미지/비디오 참조가 선택한 모드 위에 적용되며, `maxInputAudios`를 선언한 provider에서만 동작합니다

이미지와 비디오 참조를 섞는 것은 안정적인 공유 기능 표면이 아닙니다.
요청당 하나의 참조 유형을 사용하는 것이 좋습니다.

#### 대체 경로 및 타입 지정 옵션

일부 기능 검사는 도구 경계가 아니라 대체 경로 레이어에서 적용되므로
기본 provider의 제한을 초과하는 요청도
기능이 있는 대체 provider에서 계속 실행될 수 있습니다.

- 활성 후보가 `maxInputAudios`를 선언하지 않거나(또는
  `0`으로 선언한 경우), 요청에 오디오 참조가 포함되면 해당 후보는 건너뛰고
  다음 후보를 시도합니다.
- 활성 후보의 `maxDurationSeconds`가 요청된
  `durationSeconds`보다 작고, 후보가
  `supportedDurationSeconds` 목록을 선언하지 않았다면 해당 후보는 건너뜁니다.
- 요청에 `providerOptions`가 있고 활성 후보가
  타입이 지정된 `providerOptions` 스키마를 명시적으로 선언했다면,
  제공된 키가 스키마에 없거나 값 타입이 일치하지 않을 때 해당 후보는
  건너뜁니다. 아직 스키마를 선언하지 않은 provider는
  옵션을 있는 그대로 받습니다(하위 호환 pass-through). provider는
  빈 스키마를 선언함으로써 모든 provider 옵션을 명시적으로 거부할 수 있으며
  (`capabilities.providerOptions: {}`), 이 경우 타입 불일치와 같은 방식으로
  건너뜁니다.

요청에서 첫 번째 건너뜀 이유는 연산자가
기본 provider가 왜 건너뛰어졌는지 볼 수 있도록 `warn` 수준으로 기록되고, 이후 건너뜀은
긴 대체 체인을 조용하게 유지하기 위해 `debug` 수준으로 기록됩니다. 모든 후보가 건너뛰어지면,
집계된 오류에는 각 후보의 건너뜀 이유가 포함됩니다.

## Actions

- **generate**(기본값) -- 주어진 프롬프트와 선택적 참조 입력으로 비디오를 생성합니다.
- **status** -- 새 생성을 시작하지 않고 현재 세션의 진행 중 비디오 작업 상태를 확인합니다.
- **list** -- 사용 가능한 provider, 모델 및 기능을 표시합니다.

## 모델 선택

비디오를 생성할 때 OpenClaw는 다음 순서로 모델을 확인합니다.

1. **`model` 도구 매개변수** -- 에이전트가 호출에서 지정한 경우
2. config의 **`videoGenerationModel.primary`**
3. 순서대로 시도되는 **`videoGenerationModel.fallbacks`**
4. **자동 감지** -- 유효한 인증이 있는 provider를 사용하며, 현재 기본 provider부터 시작한 뒤 남은 provider를 알파벳순으로 시도

provider가 실패하면 다음 후보가 자동으로 시도됩니다. 모든 후보가 실패하면 오류에는 각 시도의 세부 정보가 포함됩니다.

비디오 생성이 명시적 `model`, `primary`, `fallbacks`
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

## Provider 참고

<AccordionGroup>
  <Accordion title="Alibaba">
    DashScope / Model Studio 비동기 엔드포인트를 사용합니다. 참조 이미지와 비디오는 원격 `http(s)` URL이어야 합니다.
  </Accordion>

  <Accordion title="BytePlus (1.0)">
    Provider id: `byteplus`.

    모델: `seedance-1-0-pro-250528`(기본값), `seedance-1-0-pro-t2v-250528`, `seedance-1-0-pro-fast-251015`, `seedance-1-0-lite-t2v-250428`, `seedance-1-0-lite-i2v-250428`.

    T2V 모델(`*-t2v-*`)은 이미지 입력을 받지 않습니다. I2V 모델과 일반 `*-pro-*` 모델은 단일 참조 이미지(첫 프레임)를 지원합니다. 이미지를 위치 인수로 전달하거나 `role: "first_frame"`을 설정하세요. 이미지가 제공되면 T2V 모델 ID는 해당하는 I2V 변형으로 자동 전환됩니다.

    지원되는 `providerOptions` 키: `seed`(number), `draft`(boolean — 480p 강제), `camera_fixed`(boolean).

  </Accordion>

  <Accordion title="BytePlus Seedance 1.5">
    [`@openclaw/byteplus-modelark`](https://www.npmjs.com/package/@openclaw/byteplus-modelark) plugin이 필요합니다. Provider id: `byteplus-seedance15`. 모델: `seedance-1-5-pro-251215`.

    통합 `content[]` API를 사용합니다. 최대 2개의 입력 이미지(`first_frame` + `last_frame`)를 지원합니다. 모든 입력은 원격 `https://` URL이어야 합니다. 각 이미지에 `role: "first_frame"` / `"last_frame"`를 설정하거나 이미지를 위치 인수로 전달하세요.

    `aspectRatio: "adaptive"`는 입력 이미지에서 비율을 자동 감지합니다. `audio: true`는 `generate_audio`로 매핑됩니다. `providerOptions.seed`(number)는 그대로 전달됩니다.

  </Accordion>

  <Accordion title="BytePlus Seedance 2.0">
    [`@openclaw/byteplus-modelark`](https://www.npmjs.com/package/@openclaw/byteplus-modelark) plugin이 필요합니다. Provider id: `byteplus-seedance2`. 모델: `dreamina-seedance-2-0-260128`, `dreamina-seedance-2-0-fast-260128`.

    통합 `content[]` API를 사용합니다. 최대 9개의 참조 이미지, 3개의 참조 비디오, 3개의 참조 오디오를 지원합니다. 모든 입력은 원격 `https://` URL이어야 합니다. 각 asset에 `role`을 설정하세요 — 지원 값: `"first_frame"`, `"last_frame"`, `"reference_image"`, `"reference_video"`, `"reference_audio"`.

    `aspectRatio: "adaptive"`는 입력 이미지에서 비율을 자동 감지합니다. `audio: true`는 `generate_audio`로 매핑됩니다. `providerOptions.seed`(number)는 그대로 전달됩니다.

  </Accordion>

  <Accordion title="ComfyUI">
    워크플로 기반 로컬 또는 클라우드 실행입니다. 구성된 그래프를 통해 텍스트-투-비디오와 이미지-투-비디오를 지원합니다.
  </Accordion>

  <Accordion title="fal">
    장시간 실행 작업에 큐 기반 흐름을 사용합니다. 단일 이미지 참조만 지원합니다.
  </Accordion>

  <Accordion title="Google (Gemini / Veo)">
    이미지 참조 1개 또는 비디오 참조 1개를 지원합니다.
  </Accordion>

  <Accordion title="MiniMax">
    단일 이미지 참조만 지원합니다.
  </Accordion>

  <Accordion title="OpenAI">
    `size` override만 전달됩니다. 다른 스타일 override(`aspectRatio`, `resolution`, `audio`, `watermark`)는 경고와 함께 무시됩니다.
  </Accordion>

  <Accordion title="Qwen">
    Alibaba와 동일한 DashScope 백엔드를 사용합니다. 참조 입력은 원격 `http(s)` URL이어야 하며 로컬 파일은 초기에 거부됩니다.
  </Accordion>

  <Accordion title="Runway">
    data URI를 통해 로컬 파일을 지원합니다. video-to-video에는 `runway/gen4_aleph`가 필요합니다. 텍스트 전용 실행은 `16:9`와 `9:16` 가로세로비를 노출합니다.
  </Accordion>

  <Accordion title="Together">
    단일 이미지 참조만 지원합니다.
  </Accordion>

  <Accordion title="Vydra">
    인증이 누락되는 리디렉션을 피하기 위해 `https://www.vydra.ai/api/v1`을 직접 사용합니다. `veo3`는 텍스트-투-비디오 전용으로 번들되며 `kling`은 원격 이미지 URL이 필요합니다.
  </Accordion>

  <Accordion title="xAI">
    텍스트-투-비디오, 이미지-투-비디오 및 원격 비디오 편집/확장 흐름을 지원합니다.
  </Accordion>
</AccordionGroup>

## Provider 기능 모드

공유 비디오 생성 계약은 이제 provider가 단순한 평면 집계 제한만이 아니라
모드별 기능을 선언할 수 있게 합니다. 새로운 provider
구현은 명시적인 모드 블록을 우선 사용해야 합니다.

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
변환 모드 지원을 광고하기에 충분하지 않습니다. provider는 라이브 테스트,
계약 테스트, 공유 `video_generate` 도구가 모드 지원을
결정적으로 검증할 수 있도록 `generate`, `imageToVideo`, `videoToVideo`를 명시적으로 선언해야 합니다.

## 라이브 테스트

공유 번들 provider용 옵트인 라이브 커버리지:

```bash
OPENCLAW_LIVE_TEST=1 pnpm test:live -- extensions/video-generation-providers.live.test.ts
```

repo 래퍼:

```bash
pnpm test:live:media video
```

이 라이브 파일은 `~/.profile`에서 누락된 provider env var를 로드하고,
기본적으로 저장된 auth profile보다 라이브/env API 키를 우선하며,
기본적으로 릴리스 안전 스모크를 실행합니다.

- 스윕의 모든 비FAL provider에 대해 `generate`
- 1초 길이 바닷가재 프롬프트
- `OPENCLAW_LIVE_VIDEO_GENERATION_TIMEOUT_MS`의 provider별 작업 한도
  (기본값 `180000`)

FAL은 provider 측 큐 지연이 릴리스 시간을 지배할 수 있으므로 옵트인입니다.

```bash
pnpm test:live:media video --video-providers fal
```

공유 스윕이 로컬 미디어로 안전하게 실행할 수 있는 선언된 변환
모드도 실행하려면 `OPENCLAW_LIVE_VIDEO_GENERATION_FULL_MODES=1`을 설정하세요.

- `capabilities.imageToVideo.enabled`일 때 `imageToVideo`
- `capabilities.videoToVideo.enabled`이고 provider/model이
  공유 스윕에서 버퍼 기반 로컬 비디오 입력을 허용할 때 `videoToVideo`

현재 공유 `videoToVideo` 라이브 lane은 다음을 다룹니다.

- `runway/gen4_aleph`를 선택한 경우의 `runway`만 해당

## config

기본 비디오 생성 모델을 OpenClaw config에 설정하세요.

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
- [백그라운드 작업](/ko/automation/tasks) -- 비동기 비디오 생성용 작업 추적
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
- [구성 참조](/ko/gateway/config-agents#agent-defaults)
- [모델](/ko/concepts/models)
