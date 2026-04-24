---
read_when:
    - 에이전트를 통해 비디오 생성하기
    - 비디오 생성 provider 및 모델 구성하기
    - video_generate 도구 파라미터 이해하기
summary: 14개의 provider 백엔드를 사용해 텍스트, 이미지, 또는 기존 비디오에서 비디오 생성하기
title: 비디오 생성
x-i18n:
    generated_at: "2026-04-24T06:43:09Z"
    model: gpt-5.4
    provider: openai
    source_hash: c5ddefd4fcde2b22be6631c160ed6e128a97b0800d32c65fb5fe36227ce4f368
    source_path: tools/video-generation.md
    workflow: 15
---

OpenClaw 에이전트는 텍스트 프롬프트, 참조 이미지, 또는 기존 비디오에서 비디오를 생성할 수 있습니다. 14개의 provider 백엔드가 지원되며, 각각 서로 다른 모델 옵션, 입력 모드, 기능 세트를 가집니다. 에이전트는 구성과 사용 가능한 API 키를 바탕으로 적절한 provider를 자동으로 선택합니다.

<Note>
`video_generate` 도구는 최소 하나의 비디오 생성 provider를 사용할 수 있을 때만 나타납니다. 에이전트 도구에 이 항목이 보이지 않는다면 provider API 키를 설정하거나 `agents.defaults.videoGenerationModel`을 구성하세요.
</Note>

OpenClaw는 비디오 생성을 세 가지 런타임 모드로 취급합니다.

- 참조 미디어가 없는 텍스트-비디오 요청의 `generate`
- 요청에 하나 이상의 참조 이미지가 포함될 때의 `imageToVideo`
- 요청에 하나 이상의 참조 비디오가 포함될 때의 `videoToVideo`

provider는 이 모드 중 일부만 지원할 수 있습니다. 도구는 제출 전에 활성
모드를 검증하고, 지원되는 모드는 `action=list`에서 보고합니다.

## 빠른 시작

1. 지원되는 아무 provider의 API 키나 설정하세요:

```bash
export GEMINI_API_KEY="your-key"
```

2. 선택적으로 기본 모델을 고정하세요:

```bash
openclaw config set agents.defaults.videoGenerationModel.primary "google/veo-3.1-fast-generate-preview"
```

3. 에이전트에게 요청하세요:

> Generate a 5-second cinematic video of a friendly lobster surfing at sunset.

에이전트가 `video_generate`를 자동으로 호출합니다. 도구 허용 목록 설정은 필요 없습니다.

## 비디오를 생성하면 무슨 일이 일어나나

비디오 생성은 비동기입니다. 세션에서 에이전트가 `video_generate`를 호출하면:

1. OpenClaw가 요청을 provider에 제출하고 즉시 작업 ID를 반환합니다.
2. provider가 백그라운드에서 작업을 처리합니다(보통 provider와 해상도에 따라 30초에서 5분).
3. 비디오가 준비되면 OpenClaw는 내부 완료 이벤트로 같은 세션을 깨웁니다.
4. 에이전트가 완성된 비디오를 원래 대화에 다시 게시합니다.

작업이 진행 중인 동안 같은 세션의 중복 `video_generate` 호출은 다른 생성을 시작하는 대신 현재 작업 상태를 반환합니다. CLI에서 진행 상태를 확인하려면 `openclaw tasks list` 또는 `openclaw tasks show <taskId>`를 사용하세요.

세션 기반 에이전트 실행이 아닌 경우(예: 직접 도구 호출)에는 도구가 inline 생성으로 폴백하고 같은 턴에서 최종 미디어 경로를 반환합니다.

### 작업 수명 주기

각 `video_generate` 요청은 네 가지 상태를 거칩니다.

1. **queued** -- 작업이 생성되었고 provider가 수락하기를 기다리는 중
2. **running** -- provider가 처리 중(보통 provider와 해상도에 따라 30초에서 5분)
3. **succeeded** -- 비디오 준비 완료, 에이전트가 깨어나 대화에 게시
4. **failed** -- provider 오류 또는 타임아웃, 에이전트가 오류 세부 정보와 함께 깨어남

CLI에서 상태 확인:

```bash
openclaw tasks list
openclaw tasks show <taskId>
openclaw tasks cancel <taskId>
```

중복 방지: 현재 세션에 대해 비디오 작업이 이미 `queued` 또는 `running` 상태면 `video_generate`는 새 생성을 시작하는 대신 기존 작업 상태를 반환합니다. 새 생성을 트리거하지 않고 명시적으로 확인하려면 `action: "status"`를 사용하세요.

## 지원되는 provider

| Provider              | 기본 모델                        | 텍스트 | 이미지 참조                                         | 비디오 참조      | API 키                                   |
| --------------------- | -------------------------------- | ------ | --------------------------------------------------- | ---------------- | ---------------------------------------- |
| Alibaba               | `wan2.6-t2v`                     | Yes    | Yes (원격 URL)                                      | Yes (원격 URL)   | `MODELSTUDIO_API_KEY`                    |
| BytePlus (1.0)        | `seedance-1-0-pro-250528`        | Yes    | 최대 2개 이미지 (I2V 모델만, 첫 프레임 + 마지막 프레임) | No               | `BYTEPLUS_API_KEY`                       |
| BytePlus Seedance 1.5 | `seedance-1-5-pro-251215`        | Yes    | 최대 2개 이미지 (role을 통한 첫 프레임 + 마지막 프레임) | No               | `BYTEPLUS_API_KEY`                       |
| BytePlus Seedance 2.0 | `dreamina-seedance-2-0-260128`   | Yes    | 최대 9개 참조 이미지                                | 최대 3개 비디오  | `BYTEPLUS_API_KEY`                       |
| ComfyUI               | `workflow`                       | Yes    | 1개 이미지                                          | No               | `COMFY_API_KEY` 또는 `COMFY_CLOUD_API_KEY` |
| fal                   | `fal-ai/minimax/video-01-live`   | Yes    | 1개 이미지                                          | No               | `FAL_KEY`                                |
| Google                | `veo-3.1-fast-generate-preview`  | Yes    | 1개 이미지                                          | 1개 비디오       | `GEMINI_API_KEY`                         |
| MiniMax               | `MiniMax-Hailuo-2.3`             | Yes    | 1개 이미지                                          | No               | `MINIMAX_API_KEY`                        |
| OpenAI                | `sora-2`                         | Yes    | 1개 이미지                                          | 1개 비디오       | `OPENAI_API_KEY`                         |
| Qwen                  | `wan2.6-t2v`                     | Yes    | Yes (원격 URL)                                      | Yes (원격 URL)   | `QWEN_API_KEY`                           |
| Runway                | `gen4.5`                         | Yes    | 1개 이미지                                          | 1개 비디오       | `RUNWAYML_API_SECRET`                    |
| Together              | `Wan-AI/Wan2.2-T2V-A14B`         | Yes    | 1개 이미지                                          | No               | `TOGETHER_API_KEY`                       |
| Vydra                 | `veo3`                           | Yes    | 1개 이미지 (`kling`)                                | No               | `VYDRA_API_KEY`                          |
| xAI                   | `grok-imagine-video`             | Yes    | 1개 이미지                                          | 1개 비디오       | `XAI_API_KEY`                            |

일부 provider는 추가 또는 대체 API 키 env var도 허용합니다. 자세한 내용은 개별 [provider 페이지](#related)를 참조하세요.

런타임에서 사용 가능한 provider, 모델, 런타임 모드를 확인하려면
`video_generate action=list`를 실행하세요.

### 선언된 capability 매트릭스

이것은 `video_generate`, 계약 테스트,
공유 라이브 스윕에서 사용하는 명시적 모드 계약입니다.

| Provider | `generate` | `imageToVideo` | `videoToVideo` | 현재 공유 라이브 레인                                                                                                                    |
| -------- | ---------- | -------------- | -------------- | ---------------------------------------------------------------------------------------------------------------------------------------- |
| Alibaba  | Yes        | Yes            | Yes            | `generate`, `imageToVideo`; 이 provider는 원격 `http(s)` 비디오 URL이 필요하므로 `videoToVideo`는 건너뜀                              |
| BytePlus | Yes        | Yes            | No             | `generate`, `imageToVideo`                                                                                                               |
| ComfyUI  | Yes        | Yes            | No             | 공유 스윕에는 없음. 워크플로별 커버리지는 Comfy 테스트에 있음                                                                           |
| fal      | Yes        | Yes            | No             | `generate`, `imageToVideo`                                                                                                               |
| Google   | Yes        | Yes            | Yes            | `generate`, `imageToVideo`; 현재 버퍼 기반 Gemini/Veo 스윕은 그 입력을 받지 않으므로 공유 `videoToVideo`는 건너뜀                     |
| MiniMax  | Yes        | Yes            | No             | `generate`, `imageToVideo`                                                                                                               |
| OpenAI   | Yes        | Yes            | Yes            | `generate`, `imageToVideo`; 현재 이 조직/입력 경로는 provider 측 inpaint/remix 접근이 필요하므로 공유 `videoToVideo`는 건너뜀        |
| Qwen     | Yes        | Yes            | Yes            | `generate`, `imageToVideo`; 이 provider는 원격 `http(s)` 비디오 URL이 필요하므로 `videoToVideo`는 건너뜀                              |
| Runway   | Yes        | Yes            | Yes            | `generate`, `imageToVideo`; `videoToVideo`는 선택된 모델이 `runway/gen4_aleph`일 때만 실행됨                                           |
| Together | Yes        | Yes            | No             | `generate`, `imageToVideo`                                                                                                               |
| Vydra    | Yes        | Yes            | No             | `generate`; 번들 `veo3`는 텍스트 전용이고 번들 `kling`은 원격 이미지 URL이 필요하므로 공유 `imageToVideo`는 건너뜀                  |
| xAI      | Yes        | Yes            | Yes            | `generate`, `imageToVideo`; 이 provider는 현재 원격 MP4 URL이 필요하므로 `videoToVideo`는 건너뜀                                      |

## 도구 파라미터

### 필수

| 파라미터 | 타입   | 설명                                                                      |
| -------- | ------ | ------------------------------------------------------------------------- |
| `prompt` | string | 생성할 비디오의 텍스트 설명 (`action: "generate"`에 필수)                 |

### 콘텐츠 입력

| 파라미터    | 타입     | 설명                                                                                                                            |
| ----------- | -------- | ------------------------------------------------------------------------------------------------------------------------------- |
| `image`     | string   | 단일 참조 이미지 (경로 또는 URL)                                                                                                |
| `images`    | string[] | 다중 참조 이미지 (최대 9개)                                                                                                     |
| `imageRoles`| string[] | 결합된 이미지 목록과 위치가 일치하는 선택적 role 힌트. 정식 값: `first_frame`, `last_frame`, `reference_image`                |
| `video`     | string   | 단일 참조 비디오 (경로 또는 URL)                                                                                                |
| `videos`    | string[] | 다중 참조 비디오 (최대 4개)                                                                                                     |
| `videoRoles`| string[] | 결합된 비디오 목록과 위치가 일치하는 선택적 role 힌트. 정식 값: `reference_video`                                              |
| `audioRef`  | string   | 단일 참조 오디오 (경로 또는 URL). provider가 오디오 입력을 지원할 때 배경 음악 또는 음성 참조 등에 사용                       |
| `audioRefs` | string[] | 다중 참조 오디오 (최대 3개)                                                                                                     |
| `audioRoles`| string[] | 결합된 오디오 목록과 위치가 일치하는 선택적 role 힌트. 정식 값: `reference_audio`                                              |

role 힌트는 provider에 있는 그대로 전달됩니다. 정식 값은
`VideoGenerationAssetRole` union에서 오지만 provider는 추가
role 문자열을 허용할 수 있습니다. `*Roles` 배열은 대응하는
참조 목록보다 더 많은 항목을 가질 수 없으며, 하나씩 어긋난 실수는
명확한 오류와 함께 실패합니다. 슬롯을 비워 두려면 빈 문자열을 사용하세요.

### 스타일 제어

| 파라미터          | 타입    | 설명                                                                                      |
| ----------------- | ------- | ----------------------------------------------------------------------------------------- |
| `aspectRatio`     | string  | `1:1`, `2:3`, `3:2`, `3:4`, `4:3`, `4:5`, `5:4`, `9:16`, `16:9`, `21:9`, 또는 `adaptive` |
| `resolution`      | string  | `480P`, `720P`, `768P`, 또는 `1080P`                                                      |
| `durationSeconds` | number  | 목표 재생 시간(초, provider가 지원하는 가장 가까운 값으로 반올림)                        |
| `size`            | string  | provider가 지원할 때의 크기 힌트                                                         |
| `audio`           | boolean | 지원되는 경우 출력에서 생성된 오디오 활성화. `audioRef*`(입력)와는 별개                 |
| `watermark`       | boolean | 지원되는 경우 provider 워터마크 토글                                                     |

`adaptive`는 provider별 sentinel 값입니다. 이를 capability에 `adaptive`로 선언한
provider에는 그대로 전달됩니다(예: BytePlus
Seedance는 입력 이미지 크기에서 비율을 자동 감지하는 데 이를 사용함). 이를 선언하지 않은 provider는 도구 결과의
`details.ignoredOverrides`를 통해 이 값을 노출하여,
무시되었음을 보이게 합니다.

### 고급

| 파라미터         | 타입   | 설명                                                                                                                                                                                                                                                                                                                                          |
| ---------------- | ------ | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `action`         | string | `"generate"` (기본값), `"status"`, 또는 `"list"`                                                                                                                                                                                                                                                                                             |
| `model`          | string | provider/model 재정의 (예: `runway/gen4.5`)                                                                                                                                                                                                                                                                                                  |
| `filename`       | string | 출력 파일명 힌트                                                                                                                                                                                                                                                                                                                              |
| `timeoutMs`      | number | 선택적 provider 요청 타임아웃(밀리초)                                                                                                                                                                                                                                                                                                         |
| `providerOptions`| object | JSON 객체 형태의 provider별 옵션(예: `{"seed": 42, "draft": true}`). 타입이 선언된 스키마를 가진 provider는 키와 타입을 검증하며, 알 수 없는 키나 불일치는 폴백 중 후보를 건너뜁니다. 선언된 스키마가 없는 provider는 옵션을 그대로 받습니다. 각 provider가 무엇을 받는지 확인하려면 `video_generate action=list`를 실행하세요 |

모든 provider가 모든 파라미터를 지원하는 것은 아닙니다. OpenClaw는 이미 duration을 가장 가까운 provider 지원 값으로 정규화하고, 폴백 provider가 다른 제어 표면을 노출할 때 size-to-aspect-ratio 같은 변환된 geometry 힌트도 다시 매핑합니다. 진짜로 지원되지 않는 재정의는 best-effort 방식으로 무시되며 도구 결과에 경고로 보고됩니다. 너무 많은 참조 입력 같은 하드 capability 제한은 제출 전에 실패합니다.

도구 결과는 적용된 설정을 보고합니다. OpenClaw가 provider 폴백 중 duration이나 geometry를 재매핑하면 반환된 `durationSeconds`, `size`, `aspectRatio`, `resolution` 값은 실제 제출된 내용을 반영하며, `details.normalization`은 요청값에서 적용값으로의 변환을 기록합니다.

참조 입력도 런타임 모드를 선택합니다.

- 참조 미디어 없음: `generate`
- 이미지 참조가 하나라도 있음: `imageToVideo`
- 비디오 참조가 하나라도 있음: `videoToVideo`
- 참조 오디오 입력은 해석된 모드를 바꾸지 않습니다. 이미지/비디오 참조가 선택한 모드 위에 추가로 적용되며, `maxInputAudios`를 선언한 provider에서만 동작합니다

이미지와 비디오 참조를 섞는 것은 안정적인 공유 capability 표면이 아닙니다.
요청당 하나의 참조 유형만 사용하는 것을 권장합니다.

#### 폴백과 타입 지정 옵션

일부 capability 검사는
도구 경계가 아니라 폴백 계층에서 적용되어, 기본 provider의 제한을 초과하는 요청도
capability를 가진 폴백 provider에서 계속 실행될 수 있게 합니다.

- 활성 후보가 `maxInputAudios`를 선언하지 않았거나(또는 이를
  `0`으로 선언했을 경우), 요청에 오디오 참조가 있으면 해당 후보는 건너뛰고
  다음 후보를 시도합니다.
- 활성 후보의 `maxDurationSeconds`가 요청된
  `durationSeconds`보다 작고 후보가
  `supportedDurationSeconds` 목록을 선언하지 않았다면, 그 후보는 건너뜁니다.
- 요청에 `providerOptions`가 있고 활성 후보가
  타입이 지정된 `providerOptions` 스키마를 명시적으로 선언한 경우,
  제공된 키가 스키마에 없거나 값 타입이 일치하지 않으면 후보를
  건너뜁니다. 아직 스키마를 선언하지 않은 provider는 옵션을
  있는 그대로 받습니다(하위 호환 passthrough). provider는 빈 스키마
  (`capabilities.providerOptions: {}`)를 선언함으로써 모든 provider 옵션을 명시적으로 거부할 수 있으며,
  이 경우에도 타입 불일치와 동일하게 건너뜁니다.

요청에서 첫 번째 건너뜀 사유는 `warn`으로 기록되어 운영자가
기본 provider가 왜 건너뛰어졌는지 볼 수 있게 하고, 이후 건너뜀은
긴 폴백 체인을 조용하게 유지하기 위해 `debug`로 기록됩니다. 모든 후보가 건너뛰어지면,
집계된 오류에 각 후보의 건너뜀 사유가 포함됩니다.

## 작업

- **generate** (기본값) -- 주어진 프롬프트와 선택적 참조 입력으로 비디오를 생성합니다.
- **status** -- 다른 생성을 시작하지 않고 현재 세션의 진행 중 비디오 작업 상태를 확인합니다.
- **list** -- 사용 가능한 provider, 모델, capability를 보여줍니다.

## 모델 선택

비디오 생성 시 OpenClaw는 다음 순서로 모델을 해석합니다.

1. **`model` 도구 파라미터** -- 에이전트가 호출 시 지정한 경우
2. **`videoGenerationModel.primary`** -- config에서
3. **`videoGenerationModel.fallbacks`** -- 순서대로 시도
4. **자동 감지** -- 유효한 인증이 있는 provider를 사용하며, 현재 기본 provider부터 시작한 뒤 나머지 provider를 알파벳 순으로 시도

provider가 실패하면 다음 후보가 자동으로 시도됩니다. 모든 후보가 실패하면 오류에 각 시도의 세부 정보가 포함됩니다.

비디오 생성이 명시적인 `model`, `primary`, `fallbacks`
항목만 사용하게 하려면 `agents.defaults.mediaGenerationAutoProviderFallback: false`를 설정하세요.

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
    Provider ID: `byteplus`.

    모델: `seedance-1-0-pro-250528` (기본값), `seedance-1-0-pro-t2v-250528`, `seedance-1-0-pro-fast-251015`, `seedance-1-0-lite-t2v-250428`, `seedance-1-0-lite-i2v-250428`.

    T2V 모델(`*-t2v-*`)은 이미지 입력을 받을 수 없습니다. I2V 모델과 일반 `*-pro-*` 모델은 단일 참조 이미지(첫 프레임)를 지원합니다. 이미지를 위치 기반으로 전달하거나 `role: "first_frame"`을 설정하세요. 이미지가 제공되면 T2V 모델 ID는 대응하는 I2V 변형으로 자동 전환됩니다.

    지원되는 `providerOptions` 키: `seed` (number), `draft` (boolean — 480p 강제), `camera_fixed` (boolean).

  </Accordion>

  <Accordion title="BytePlus Seedance 1.5">
    [`@openclaw/byteplus-modelark`](https://www.npmjs.com/package/@openclaw/byteplus-modelark) Plugin이 필요합니다. Provider ID: `byteplus-seedance15`. 모델: `seedance-1-5-pro-251215`.

    통합 `content[]` API를 사용합니다. 최대 2개의 입력 이미지를 지원합니다(`first_frame` + `last_frame`). 모든 입력은 원격 `https://` URL이어야 합니다. 각 이미지에 `role: "first_frame"` / `"last_frame"`를 설정하거나 이미지를 위치 기반으로 전달하세요.

    `aspectRatio: "adaptive"`는 입력 이미지에서 비율을 자동 감지합니다. `audio: true`는 `generate_audio`로 매핑됩니다. `providerOptions.seed` (number)는 그대로 전달됩니다.

  </Accordion>

  <Accordion title="BytePlus Seedance 2.0">
    [`@openclaw/byteplus-modelark`](https://www.npmjs.com/package/@openclaw/byteplus-modelark) Plugin이 필요합니다. Provider ID: `byteplus-seedance2`. 모델: `dreamina-seedance-2-0-260128`, `dreamina-seedance-2-0-fast-260128`.

    통합 `content[]` API를 사용합니다. 최대 9개의 참조 이미지, 3개의 참조 비디오, 3개의 참조 오디오를 지원합니다. 모든 입력은 원격 `https://` URL이어야 합니다. 각 자산에 `role`을 설정하세요 — 지원되는 값: `"first_frame"`, `"last_frame"`, `"reference_image"`, `"reference_video"`, `"reference_audio"`.

    `aspectRatio: "adaptive"`는 입력 이미지에서 비율을 자동 감지합니다. `audio: true`는 `generate_audio`로 매핑됩니다. `providerOptions.seed` (number)는 그대로 전달됩니다.

  </Accordion>

  <Accordion title="ComfyUI">
    워크플로 기반 로컬 또는 cloud 실행입니다. 구성된 그래프를 통해 텍스트-비디오와 이미지-비디오를 지원합니다.
  </Accordion>

  <Accordion title="fal">
    장시간 실행 작업을 위한 queue 기반 흐름을 사용합니다. 단일 이미지 참조만 지원합니다.
  </Accordion>

  <Accordion title="Google (Gemini / Veo)">
    이미지 1개 또는 비디오 1개 참조를 지원합니다.
  </Accordion>

  <Accordion title="MiniMax">
    단일 이미지 참조만 지원합니다.
  </Accordion>

  <Accordion title="OpenAI">
    `size` 재정의만 전달됩니다. 다른 스타일 재정의(`aspectRatio`, `resolution`, `audio`, `watermark`)는 경고와 함께 무시됩니다.
  </Accordion>

  <Accordion title="Qwen">
    Alibaba와 같은 DashScope 백엔드를 사용합니다. 참조 입력은 원격 `http(s)` URL이어야 하며, 로컬 파일은 초기에 거부됩니다.
  </Accordion>

  <Accordion title="Runway">
    data URI를 통해 로컬 파일을 지원합니다. 비디오-비디오에는 `runway/gen4_aleph`가 필요합니다. 텍스트 전용 실행은 `16:9`와 `9:16` 종횡비를 노출합니다.
  </Accordion>

  <Accordion title="Together">
    단일 이미지 참조만 지원합니다.
  </Accordion>

  <Accordion title="Vydra">
    인증이 빠지는 리디렉션을 피하기 위해 `https://www.vydra.ai/api/v1`를 직접 사용합니다. `veo3`는 텍스트-비디오 전용으로 번들되며, `kling`은 원격 이미지 URL이 필요합니다.
  </Accordion>

  <Accordion title="xAI">
    텍스트-비디오, 이미지-비디오, 원격 비디오 편집/확장 흐름을 지원합니다.
  </Accordion>
</AccordionGroup>

## Provider capability 모드

공유 비디오 생성 계약은 이제 provider가 단순한 집계 제한만이 아니라 모드별
capability를 선언할 수 있게 합니다. 새 provider
구현은 명시적인 모드 블록을 우선 사용하는 것이 좋습니다:

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

`maxInputImages`와 `maxInputVideos` 같은 평면 집계 필드만으로는
변환 모드 지원을 알리기에 충분하지 않습니다. provider는
`generate`, `imageToVideo`, `videoToVideo`를 명시적으로 선언해야 라이브 테스트,
계약 테스트, 공유 `video_generate` 도구가 모드 지원을
결정론적으로 검증할 수 있습니다.

## 라이브 테스트

공유 번들 provider에 대한 옵트인 라이브 커버리지:

```bash
OPENCLAW_LIVE_TEST=1 pnpm test:live -- extensions/video-generation-providers.live.test.ts
```

repo wrapper:

```bash
pnpm test:live:media video
```

이 라이브 파일은 누락된 provider env var를 `~/.profile`에서 로드하고,
기본적으로 저장된 auth profile보다 실제/env API 키를 우선하며,
기본적으로 릴리스에 안전한 스모크 테스트를 실행합니다.

- 스윕에 포함된 모든 non-FAL provider에 대해 `generate`
- 1초짜리 바닷가재 프롬프트
- `OPENCLAW_LIVE_VIDEO_GENERATION_TIMEOUT_MS`에서 가져온 provider별 작업 상한
  (기본값 `180000`)

FAL은 provider 측 큐 지연이 릴리스 시간을 지배할 수 있으므로 옵트인입니다.

```bash
pnpm test:live:media video --video-providers fal
```

공유 스윕이 로컬 미디어로 안전하게 실행할 수 있는 선언된 변환 모드도 실행하려면
`OPENCLAW_LIVE_VIDEO_GENERATION_FULL_MODES=1`을 설정하세요.

- `capabilities.imageToVideo.enabled`인 경우 `imageToVideo`
- `capabilities.videoToVideo.enabled`이고 provider/model이
  공유 스윕에서 버퍼 기반 로컬 비디오 입력을 허용하는 경우 `videoToVideo`

현재 공유 `videoToVideo` 라이브 레인은 다음을 다룹니다.

- `runway`는 `runway/gen4_aleph`를 선택한 경우에만

## 구성

OpenClaw config에서 기본 비디오 생성 모델을 설정하세요.

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

또는 CLI로:

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
- [구성 참조](/ko/gateway/config-agents#agent-defaults)
- [모델](/ko/concepts/models)
