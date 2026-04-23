---
read_when:
    - agent를 통해 이미지 생성하기
    - 이미지 생성 provider와 모델 구성하기
    - '`image_generate` 도구 매개변수 이해하기'
summary: 구성된 provider(OpenAI, Google Gemini, fal, MiniMax, ComfyUI, Vydra, xAI)를 사용해 이미지 생성 및 편집하기
title: 이미지 생성
x-i18n:
    generated_at: "2026-04-23T06:09:07Z"
    model: gpt-5.4
    provider: openai
    source_hash: 228049c74dd3437544cda6418da665aed375c0494ef36a6927d15c28d7783bbd
    source_path: tools/image-generation.md
    workflow: 15
---

# 이미지 생성

`image_generate` 도구를 사용하면 agent가 구성된 provider를 사용해 이미지를 생성하고 편집할 수 있습니다. 생성된 이미지는 agent의 응답에 미디어 첨부파일로 자동 전달됩니다.

<Note>
최소 하나의 이미지 생성 provider를 사용할 수 있을 때만 이 도구가 표시됩니다. agent 도구에 `image_generate`가 보이지 않으면 `agents.defaults.imageGenerationModel`을 구성하거나 provider API 키를 설정하세요.
</Note>

## 빠른 시작

1. 최소 하나의 provider에 대한 API 키를 설정합니다(예: `OPENAI_API_KEY` 또는 `GEMINI_API_KEY`).
2. 필요하다면 선호 모델을 설정합니다.

```json5
{
  agents: {
    defaults: {
      imageGenerationModel: {
        primary: "openai/gpt-image-2",
      },
    },
  },
}
```

3. agent에게 요청합니다: _"친근한 바닷가재 마스코트 이미지를 생성해 줘."_

agent가 `image_generate`를 자동으로 호출합니다. 도구 허용 목록 설정은 필요하지 않습니다. provider를 사용할 수 있으면 기본적으로 활성화됩니다.

## 지원되는 provider

| Provider | 기본 모델                    | 편집 지원                           | API 키                                               |
| -------- | -------------------------------- | ---------------------------------- | ----------------------------------------------------- |
| OpenAI   | `gpt-image-2`                    | 예(최대 5개 이미지)               | `OPENAI_API_KEY`                                      |
| Google   | `gemini-3.1-flash-image-preview` | 예                                | `GEMINI_API_KEY` 또는 `GOOGLE_API_KEY`                  |
| fal      | `fal-ai/flux/dev`                | 예                                | `FAL_KEY`                                             |
| MiniMax  | `image-01`                       | 예(피사체 참조)            | `MINIMAX_API_KEY` 또는 MiniMax OAuth (`minimax-portal`) |
| ComfyUI  | `workflow`                       | 예(이미지 1개, 워크플로 구성 기준) | `COMFY_API_KEY` 또는 클라우드용 `COMFY_CLOUD_API_KEY`    |
| Vydra    | `grok-imagine`                   | 아니요                                 | `VYDRA_API_KEY`                                       |
| xAI      | `grok-imagine-image`             | 예(최대 5개 이미지)               | `XAI_API_KEY`                                         |

런타임에 사용 가능한 provider와 모델을 확인하려면 `action: "list"`를 사용하세요.

```
/tool image_generate action=list
```

## 도구 매개변수

| Parameter     | Type     | 설명 |
| ------------- | -------- | ------------------------------------------------------------------------------------- |
| `prompt`      | string   | 이미지 생성 프롬프트(`action: "generate"`일 때 필수) |
| `action`      | string   | `"generate"`(기본값) 또는 provider를 확인하는 `"list"` |
| `model`       | string   | provider/모델 재정의. 예: `openai/gpt-image-2` |
| `image`       | string   | 편집 모드용 단일 참조 이미지 경로 또는 URL |
| `images`      | string[] | 편집 모드용 다중 참조 이미지(최대 5개) |
| `size`        | string   | 크기 힌트: `1024x1024`, `1536x1024`, `1024x1536`, `2048x2048`, `3840x2160` |
| `aspectRatio` | string   | 화면 비율: `1:1`, `2:3`, `3:2`, `3:4`, `4:3`, `4:5`, `5:4`, `9:16`, `16:9`, `21:9` |
| `resolution`  | string   | 해상도 힌트: `1K`, `2K`, 또는 `4K` |
| `count`       | number   | 생성할 이미지 수(1–4) |
| `filename`    | string   | 출력 파일명 힌트 |

모든 provider가 모든 매개변수를 지원하는 것은 아닙니다. 대체 provider가 요청한 정확한 기하 옵션 대신 근접한 옵션을 지원하는 경우, OpenClaw는 제출 전에 가장 가까운 지원 크기, 화면 비율 또는 해상도로 다시 매핑합니다. 실제로 지원되지 않는 재정의는 여전히 도구 결과에 보고됩니다.

도구 결과는 적용된 설정을 보고합니다. provider 대체 중 OpenClaw가 기하 설정을 다시 매핑하면, 반환되는 `size`, `aspectRatio`, `resolution` 값은 실제로 전송된 값을 반영하고, `details.normalization`은 요청값에서 적용값으로의 변환을 기록합니다.

## 구성

### 모델 선택

```json5
{
  agents: {
    defaults: {
      imageGenerationModel: {
        primary: "openai/gpt-image-2",
        fallbacks: ["google/gemini-3.1-flash-image-preview", "fal/fal-ai/flux/dev"],
      },
    },
  },
}
```

### provider 선택 순서

이미지를 생성할 때 OpenClaw는 다음 순서로 provider를 시도합니다.

1. 도구 호출의 **`model` 매개변수**(agent가 명시한 경우)
2. 구성의 **`imageGenerationModel.primary`**
3. 순서대로 **`imageGenerationModel.fallbacks`**
4. **자동 감지** — 인증 가능한 provider 기본값만 사용:
   - 현재 기본 provider 우선
   - 나머지 등록된 이미지 생성 provider를 provider-id 순서로 사용

provider가 실패하면(인증 오류, 속도 제한 등) 다음 후보를 자동으로 시도합니다. 모두 실패하면 오류에 각 시도의 세부 정보가 포함됩니다.

참고:

- 자동 감지는 인증 인식 방식입니다. OpenClaw가 실제로 해당 provider에 인증할 수 있을 때만 provider 기본값이 후보 목록에 들어갑니다.
- 자동 감지는 기본적으로 활성화됩니다. 이미지 생성이 명시적 `model`, `primary`, `fallbacks` 항목만 사용하도록 하려면
  `agents.defaults.mediaGenerationAutoProviderFallback: false`를 설정하세요.
- 현재 등록된 provider, 해당 기본 모델, 인증 env var 힌트를 확인하려면 `action: "list"`를 사용하세요.

### 이미지 편집

OpenAI, Google, fal, MiniMax, ComfyUI, xAI는 참조 이미지 편집을 지원합니다. 참조 이미지 경로나 URL을 전달하세요.

```
"이 사진을 수채화 버전으로 생성해 줘" + image: "/path/to/photo.jpg"
```

OpenAI, Google, xAI는 `images` 매개변수를 통해 최대 5개의 참조 이미지를 지원합니다. fal, MiniMax, ComfyUI는 1개를 지원합니다.

### OpenAI `gpt-image-2`

OpenAI 이미지 생성의 기본값은 `openai/gpt-image-2`입니다. 이전
`openai/gpt-image-1` 모델도 명시적으로 선택할 수는 있지만, 새로운 OpenAI
이미지 생성 및 이미지 편집 요청에는 `gpt-image-2`를 사용해야 합니다.

`gpt-image-2`는 동일한 `image_generate` 도구를 통해 텍스트-이미지 생성과 참조 이미지
편집을 모두 지원합니다. OpenClaw는 `prompt`,
`count`, `size`, 참조 이미지를 OpenAI에 전달합니다. OpenAI는
`aspectRatio`나 `resolution`을 직접 받지 않습니다. 가능하면 OpenClaw가 이를 지원되는 `size`로 매핑하고,
그렇지 않으면 도구가 이를 무시된 재정의로 보고합니다.

4K 가로형 이미지 1장 생성:

```
/tool image_generate action=generate model=openai/gpt-image-2 prompt="OpenClaw 이미지 생성을 위한 깔끔한 에디토리얼 포스터" size=3840x2160 count=1
```

정사각형 이미지 2장 생성:

```
/tool image_generate action=generate model=openai/gpt-image-2 prompt="차분한 생산성 앱 아이콘을 위한 두 가지 비주얼 방향" size=1024x1024 count=2
```

로컬 참조 이미지 1장 편집:

```
/tool image_generate action=generate model=openai/gpt-image-2 prompt="피사체는 유지하고 배경은 밝은 스튜디오 세팅으로 바꿔 줘" image=/path/to/reference.png size=1024x1536
```

여러 참조 이미지로 편집:

```
/tool image_generate action=generate model=openai/gpt-image-2 prompt="첫 번째 이미지의 캐릭터 정체성과 두 번째 이미지의 색상 팔레트를 결합해 줘" images='["/path/to/character.png","/path/to/palette.jpg"]' size=1536x1024
```

MiniMax 이미지 생성은 다음 두 가지 번들 MiniMax 인증 경로 모두에서 사용할 수 있습니다.

- API 키 설정용 `minimax/image-01`
- OAuth 설정용 `minimax-portal/image-01`

## provider 기능

| Capability            | OpenAI               | Google               | fal                 | MiniMax                    | ComfyUI                            | Vydra   | xAI                  |
| --------------------- | -------------------- | -------------------- | ------------------- | -------------------------- | ---------------------------------- | ------- | -------------------- |
| 생성              | 예(최대 4개)        | 예(최대 4개)        | 예(최대 4개)       | 예(최대 9개)              | 예(워크플로 정의 출력)     | 예(1개) | 예(최대 4개)        |
| 편집/참조        | 예(최대 5개 이미지) | 예(최대 5개 이미지) | 예(이미지 1개)       | 예(이미지 1개, 피사체 참조) | 예(이미지 1개, 워크플로 구성 기준) | 아니요      | 예(최대 5개 이미지) |
| 크기 제어          | 예(최대 4K)       | 예                  | 예                 | 아니요                         | 아니요                                 | 아니요      | 아니요                   |
| 화면 비율          | 아니요                   | 예                  | 예(생성만) | 예                        | 아니요                                 | 아니요      | 예                  |
| 해상도 (1K/2K/4K) | 아니요                   | 예                  | 예                 | 아니요                         | 아니요                                 | 아니요      | 예(1K/2K)          |

### xAI `grok-imagine-image`

번들 xAI provider는 프롬프트 전용 요청에는 `/v1/images/generations`를 사용하고,
`image` 또는 `images`가 있으면 `/v1/images/edits`를 사용합니다.

- 모델: `xai/grok-imagine-image`, `xai/grok-imagine-image-pro`
- 개수: 최대 4개
- 참조: 하나의 `image` 또는 최대 다섯 개의 `images`
- 화면 비율: `1:1`, `16:9`, `9:16`, `4:3`, `3:4`, `2:3`, `3:2`
- 해상도: `1K`, `2K`
- 출력: OpenClaw가 관리하는 이미지 첨부파일로 반환

OpenClaw는 xAI 네이티브 `quality`, `mask`, `user`, 또는
추가 네이티브 전용 화면 비율을 의도적으로 노출하지 않습니다. 이러한 제어가 공통
cross-provider `image_generate` 계약에 생길 때까지는 지원하지 않습니다.

## 관련 항목

- [Tools Overview](/ko/tools) — 사용 가능한 모든 agent 도구
- [fal](/ko/providers/fal) — fal 이미지 및 비디오 provider 설정
- [ComfyUI](/ko/providers/comfy) — 로컬 ComfyUI 및 Comfy Cloud 워크플로 설정
- [Google (Gemini)](/ko/providers/google) — Gemini 이미지 provider 설정
- [MiniMax](/ko/providers/minimax) — MiniMax 이미지 provider 설정
- [OpenAI](/ko/providers/openai) — OpenAI Images provider 설정
- [Vydra](/ko/providers/vydra) — Vydra 이미지, 비디오, 음성 설정
- [xAI](/ko/providers/xai) — Grok 이미지, 비디오, 검색, 코드 실행, TTS 설정
- [Configuration Reference](/ko/gateway/configuration-reference#agent-defaults) — `imageGenerationModel` 구성
- [Models](/ko/concepts/models) — 모델 구성 및 대체
