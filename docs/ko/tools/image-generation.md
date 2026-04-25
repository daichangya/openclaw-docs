---
read_when:
    - 에이전트를 통한 이미지 생성
    - 이미지 생성 provider 및 모델 구성
    - '`image_generate` 도구 파라미터 이해'
summary: 구성된 provider(OpenAI, OpenAI Codex OAuth, Google Gemini, OpenRouter, fal, MiniMax, ComfyUI, Vydra, xAI)를 사용해 이미지 생성 및 편집
title: 이미지 생성
x-i18n:
    generated_at: "2026-04-25T12:29:22Z"
    model: gpt-5.4
    provider: openai
    source_hash: 02369928fecac147729ca586cd39e1a88791219ffe26d8e94429d0ea4b1af411
    source_path: tools/image-generation.md
    workflow: 15
---

`image_generate` 도구를 사용하면 에이전트가 구성된 provider를 사용해 이미지를 생성하고 편집할 수 있습니다. 생성된 이미지는 에이전트 응답에 미디어 첨부 파일로 자동 전달됩니다.

<Note>
이 도구는 하나 이상의 이미지 생성 provider를 사용할 수 있을 때만 표시됩니다. 에이전트 도구에 `image_generate`가 보이지 않으면 `agents.defaults.imageGenerationModel`을 구성하고, provider API 키를 설정하거나, OpenAI Codex OAuth로 로그인하세요.
</Note>

## 빠른 시작

1. 최소 하나의 provider에 대한 API 키를 설정하세요(예: `OPENAI_API_KEY`, `GEMINI_API_KEY`, 또는 `OPENROUTER_API_KEY`) 또는 OpenAI Codex OAuth로 로그인하세요.
2. 선택적으로 원하는 모델을 설정하세요.

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

Codex OAuth는 동일한 `openai/gpt-image-2` 모델 ref를 사용합니다. `openai-codex` OAuth 프로필이 구성되어 있으면 OpenClaw는 먼저 `OPENAI_API_KEY`를 시도하지 않고 동일한 OAuth 프로필을 통해 이미지 요청을 라우팅합니다.
API 키 또는 사용자 지정/Azure base URL 같은 명시적 사용자 지정 `models.providers.openai` 이미지 config를 설정하면 직접 OpenAI Images API 경로로 다시 전환됩니다.
LocalAI 같은 OpenAI 호환 LAN 엔드포인트의 경우 사용자 지정 `models.providers.openai.baseUrl`을 유지하고 `browser.ssrfPolicy.dangerouslyAllowPrivateNetwork: true`로 명시적으로 opt-in하세요. private/internal 이미지 엔드포인트는 기본적으로 계속 차단됩니다.

3. 에이전트에게 요청하세요: _"친근한 로봇 마스코트 이미지를 생성해 줘."_

에이전트가 `image_generate`를 자동으로 호출합니다. provider를 사용할 수 있으면 기본적으로 활성화되므로 도구 허용 목록 설정은 필요하지 않습니다.

## 일반 경로

| 목표                                                 | 모델 ref                                          | 인증                                 |
| ---------------------------------------------------- | -------------------------------------------------- | ------------------------------------ |
| API 과금 기반 OpenAI 이미지 생성                     | `openai/gpt-image-2`                               | `OPENAI_API_KEY`                     |
| Codex 구독 인증 기반 OpenAI 이미지 생성              | `openai/gpt-image-2`                               | OpenAI Codex OAuth                   |
| OpenRouter 이미지 생성                               | `openrouter/google/gemini-3.1-flash-image-preview` | `OPENROUTER_API_KEY`                 |
| Google Gemini 이미지 생성                            | `google/gemini-3.1-flash-image-preview`            | `GEMINI_API_KEY` 또는 `GOOGLE_API_KEY` |

동일한 `image_generate` 도구가 텍스트-이미지 생성과 참조 이미지 편집을 모두 처리합니다. 참조 이미지가 하나면 `image`, 여러 개면 `images`를 사용하세요.
`quality`, `outputFormat`, OpenAI 전용 `background` 같은 provider 지원 출력 힌트는 사용 가능한 경우 전달되며, provider가 지원하지 않을 때는 무시된 것으로 보고됩니다.

## 지원되는 provider

| Provider   | 기본 모델                               | 편집 지원                         | 인증                                                  |
| ---------- | --------------------------------------- | ---------------------------------- | ----------------------------------------------------- |
| OpenAI     | `gpt-image-2`                           | 예(최대 4개 이미지)               | `OPENAI_API_KEY` 또는 OpenAI Codex OAuth              |
| OpenRouter | `google/gemini-3.1-flash-image-preview` | 예(최대 5개 입력 이미지)          | `OPENROUTER_API_KEY`                                  |
| Google     | `gemini-3.1-flash-image-preview`        | 예                                | `GEMINI_API_KEY` 또는 `GOOGLE_API_KEY`                |
| fal        | `fal-ai/flux/dev`                       | 예                                | `FAL_KEY`                                             |
| MiniMax    | `image-01`                              | 예(피사체 참조)                   | `MINIMAX_API_KEY` 또는 MiniMax OAuth (`minimax-portal`) |
| ComfyUI    | `workflow`                              | 예(이미지 1개, 워크플로우 구성 기준) | 클라우드의 경우 `COMFY_API_KEY` 또는 `COMFY_CLOUD_API_KEY` |
| Vydra      | `grok-imagine`                          | 아니요                             | `VYDRA_API_KEY`                                       |
| xAI        | `grok-imagine-image`                    | 예(최대 5개 이미지)               | `XAI_API_KEY`                                         |

런타임에 사용 가능한 provider와 모델을 확인하려면 `action: "list"`를 사용하세요.

```text
/tool image_generate action=list
```

## 도구 파라미터

<ParamField path="prompt" type="string" required>
이미지 생성 프롬프트. `action: "generate"`에 필요합니다.
</ParamField>

<ParamField path="action" type="'generate' | 'list'" default="generate">
런타임에 사용 가능한 provider와 모델을 확인하려면 `"list"`를 사용하세요.
</ParamField>

<ParamField path="model" type="string">
provider/model 재정의. 예: `openai/gpt-image-2`.
</ParamField>

<ParamField path="image" type="string">
편집 모드용 단일 참조 이미지 경로 또는 URL.
</ParamField>

<ParamField path="images" type="string[]">
편집 모드용 다중 참조 이미지(최대 5개).
</ParamField>

<ParamField path="size" type="string">
크기 힌트: `1024x1024`, `1536x1024`, `1024x1536`, `2048x2048`, `3840x2160`.
</ParamField>

<ParamField path="aspectRatio" type="string">
종횡비: `1:1`, `2:3`, `3:2`, `3:4`, `4:3`, `4:5`, `5:4`, `9:16`, `16:9`, `21:9`.
</ParamField>

<ParamField path="resolution" type="'1K' | '2K' | '4K'">
해상도 힌트.
</ParamField>

<ParamField path="quality" type="'low' | 'medium' | 'high' | 'auto'">
provider가 지원할 때의 품질 힌트.
</ParamField>

<ParamField path="outputFormat" type="'png' | 'jpeg' | 'webp'">
provider가 지원할 때의 출력 형식 힌트.
</ParamField>

<ParamField path="count" type="number">
생성할 이미지 수(1–4).
</ParamField>

<ParamField path="timeoutMs" type="number">
선택적 provider 요청 타임아웃(밀리초).
</ParamField>

<ParamField path="filename" type="string">
출력 파일 이름 힌트.
</ParamField>

<ParamField path="openai" type="object">
OpenAI 전용 힌트: `background`, `moderation`, `outputCompression`, `user`.
</ParamField>

모든 provider가 모든 파라미터를 지원하는 것은 아닙니다. fallback provider가 정확히 요청된 옵션 대신 유사한 지오메트리 옵션을 지원하는 경우 OpenClaw는 제출 전에 가장 가까운 지원 크기, 종횡비 또는 해상도로 다시 매핑합니다. `quality` 또는 `outputFormat` 같은 지원되지 않는 출력 힌트는 지원을 선언하지 않은 provider에 대해 제거되며 도구 결과에 보고됩니다.

도구 결과는 적용된 설정을 보고합니다. provider fallback 중 OpenClaw가 지오메트리를 다시 매핑하는 경우 반환되는 `size`, `aspectRatio`, `resolution` 값은 실제로 전송된 값을 반영하며, `details.normalization`에는 요청값에서 적용값으로의 변환이 기록됩니다.

## 구성

### 모델 선택

```json5
{
  agents: {
    defaults: {
      imageGenerationModel: {
        primary: "openai/gpt-image-2",
        fallbacks: [
          "openrouter/google/gemini-3.1-flash-image-preview",
          "google/gemini-3.1-flash-image-preview",
          "fal/fal-ai/flux/dev",
        ],
      },
    },
  },
}
```

### provider 선택 순서

이미지를 생성할 때 OpenClaw는 다음 순서로 provider를 시도합니다.

1. 도구 호출의 **`model` 파라미터**(에이전트가 지정한 경우)
2. config의 **`imageGenerationModel.primary`**
3. 순서대로 **`imageGenerationModel.fallbacks`**
4. **자동 감지** — 인증이 뒷받침된 provider 기본값만 사용:
   - 현재 기본 provider 먼저
   - 나머지 등록된 이미지 생성 provider를 provider-id 순서로

provider가 실패하면(인증 오류, 속도 제한 등) 다음 구성된 후보가 자동으로 시도됩니다. 모두 실패하면 오류에 각 시도의 세부 정보가 포함됩니다.

참고:

- 호출별 `model` 재정의는 정확합니다. OpenClaw는 해당 provider/model만 시도하며 구성된 primary/fallback 또는 자동 감지된 provider로 진행하지 않습니다.
- 자동 감지는 인증 인식 방식입니다. OpenClaw가 실제로 해당 provider를 인증할 수 있을 때만 provider 기본값이 후보 목록에 들어갑니다.
- 자동 감지는 기본적으로 활성화됩니다. 이미지 생성이 명시적인 `model`, `primary`, `fallbacks` 항목만 사용하게 하려면 `agents.defaults.mediaGenerationAutoProviderFallback: false`로 설정하세요.
- 현재 등록된 provider, 기본 모델, 인증 env-var 힌트를 확인하려면 `action: "list"`를 사용하세요.

### 이미지 편집

OpenAI, OpenRouter, Google, fal, MiniMax, ComfyUI, xAI는 참조 이미지 편집을 지원합니다. 참조 이미지 경로 또는 URL을 전달하세요.

```text
"이 사진을 수채화 스타일로 변환해 줘" + image: "/path/to/photo.jpg"
```

OpenAI, OpenRouter, Google, xAI는 `images` 파라미터를 통해 최대 5개의 참조 이미지를 지원합니다. fal, MiniMax, ComfyUI는 1개를 지원합니다.

### OpenRouter 이미지 모델

OpenRouter 이미지 생성은 동일한 `OPENROUTER_API_KEY`를 사용하며 OpenRouter의 chat completions 이미지 API를 통해 라우팅됩니다. OpenRouter 이미지 모델은 `openrouter/` 접두사로 선택하세요.

```json5
{
  agents: {
    defaults: {
      imageGenerationModel: {
        primary: "openrouter/google/gemini-3.1-flash-image-preview",
      },
    },
  },
}
```

OpenClaw는 `prompt`, `count`, 참조 이미지, 그리고 Gemini 호환 `aspectRatio` / `resolution` 힌트를 OpenRouter로 전달합니다. 현재 내장된 OpenRouter 이미지 모델 바로 가기에는 `google/gemini-3.1-flash-image-preview`, `google/gemini-3-pro-image-preview`, `openai/gpt-5.4-image-2`가 포함됩니다. 구성된 Plugin이 노출하는 항목을 보려면 `action: "list"`를 사용하세요.

### OpenAI `gpt-image-2`

OpenAI 이미지 생성의 기본값은 `openai/gpt-image-2`입니다. `openai-codex` OAuth 프로필이 구성되어 있으면 OpenClaw는 Codex 구독 채팅 모델에 사용되는 동일한 OAuth 프로필을 재사용하고 이미지 요청을 Codex Responses 백엔드를 통해 전송합니다. `https://chatgpt.com/backend-api` 같은 레거시 Codex base URL은 이미지 요청 시 `https://chatgpt.com/backend-api/codex`로 표준화됩니다. 이 요청에 대해 `OPENAI_API_KEY`로 자동 fallback하지 않습니다. 직접 OpenAI Images API 라우팅을 강제하려면 API 키, 사용자 지정 base URL 또는 Azure 엔드포인트와 함께 `models.providers.openai`를 명시적으로 구성하세요. 이전 `openai/gpt-image-1` 모델도 여전히 명시적으로 선택할 수 있지만, 새 OpenAI 이미지 생성 및 이미지 편집 요청에는 `gpt-image-2`를 사용해야 합니다.

`gpt-image-2`는 동일한 `image_generate` 도구를 통해 텍스트-이미지 생성과 참조 이미지 편집을 모두 지원합니다. OpenClaw는 `prompt`, `count`, `size`, `quality`, `outputFormat`, 참조 이미지를 OpenAI로 전달합니다. OpenAI는 `aspectRatio` 또는 `resolution`을 직접 받지 않으며, 가능한 경우 OpenClaw가 이를 지원되는 `size`로 매핑하고, 그렇지 않으면 도구가 이를 무시된 재정의로 보고합니다.

OpenAI 전용 옵션은 `openai` 객체 아래에 있습니다.

```json
{
  "quality": "low",
  "outputFormat": "jpeg",
  "openai": {
    "background": "opaque",
    "moderation": "low",
    "outputCompression": 60,
    "user": "end-user-42"
  }
}
```

`openai.background`는 `transparent`, `opaque`, `auto`를 허용합니다. 투명 출력에는 `outputFormat` `png` 또는 `webp`가 필요합니다. `openai.outputCompression`은 JPEG/WebP 출력에 적용됩니다.

가로형 4K 이미지 1장 생성:

```text
/tool image_generate action=generate model=openai/gpt-image-2 prompt="OpenClaw image generation을 위한 깔끔한 에디토리얼 포스터" size=3840x2160 count=1
```

정사각형 이미지 2장 생성:

```text
/tool image_generate action=generate model=openai/gpt-image-2 prompt="차분한 생산성 앱 아이콘을 위한 두 가지 시각 방향" size=1024x1024 count=2
```

로컬 참조 이미지 1장 편집:

```text
/tool image_generate action=generate model=openai/gpt-image-2 prompt="피사체는 유지하고 배경만 밝은 스튜디오 환경으로 교체" image=/path/to/reference.png size=1024x1536
```

여러 참조 이미지로 편집:

```text
/tool image_generate action=generate model=openai/gpt-image-2 prompt="첫 번째 이미지의 캐릭터 정체성과 두 번째 이미지의 색상 팔레트를 결합" images='["/path/to/character.png","/path/to/palette.jpg"]' size=1536x1024
```

OpenAI 이미지 생성을 `api.openai.com` 대신 Azure OpenAI 배포를 통해 라우팅하려면 OpenAI provider 문서의 [Azure OpenAI endpoints](/ko/providers/openai#azure-openai-endpoints)를 참조하세요.

MiniMax 이미지 생성은 두 가지 번들 MiniMax 인증 경로 모두에서 사용할 수 있습니다.

- API 키 설정용 `minimax/image-01`
- OAuth 설정용 `minimax-portal/image-01`

## provider 기능

| 기능                  | OpenAI               | Google               | fal                 | MiniMax                    | ComfyUI                            | Vydra   | xAI                  |
| --------------------- | -------------------- | -------------------- | ------------------- | -------------------------- | ---------------------------------- | ------- | -------------------- |
| 생성                  | 예(최대 4개)         | 예(최대 4개)         | 예(최대 4개)        | 예(최대 9개)               | 예(워크플로우 정의 출력)           | 예(1개) | 예(최대 4개)         |
| 편집/참조             | 예(최대 5개 이미지)  | 예(최대 5개 이미지)  | 예(이미지 1개)      | 예(이미지 1개, 피사체 참조) | 예(이미지 1개, 워크플로우 구성 기준) | 아니요  | 예(최대 5개 이미지) |
| 크기 제어             | 예(최대 4K)          | 예                   | 예                  | 아니요                     | 아니요                              | 아니요  | 아니요               |
| 종횡비                | 아니요               | 예                   | 예(생성만)          | 예                         | 아니요                              | 아니요  | 예                   |
| 해상도 (1K/2K/4K)     | 아니요               | 예                   | 예                  | 아니요                     | 아니요                              | 아니요  | 예(1K/2K)            |

### xAI `grok-imagine-image`

번들 xAI provider는 프롬프트만 있는 요청에는 `/v1/images/generations`를 사용하고,
`image` 또는 `images`가 있는 경우에는 `/v1/images/edits`를 사용합니다.

- 모델: `xai/grok-imagine-image`, `xai/grok-imagine-image-pro`
- 개수: 최대 4개
- 참조: `image` 1개 또는 `images` 최대 5개
- 종횡비: `1:1`, `16:9`, `9:16`, `4:3`, `3:4`, `2:3`, `3:2`
- 해상도: `1K`, `2K`
- 출력: OpenClaw 관리 이미지 첨부 파일로 반환됨

OpenClaw는 이러한 제어가 공통 교차 provider `image_generate` contract에 존재하기 전까지 xAI 고유의 `quality`, `mask`, `user` 또는 추가 기본 전용 종횡비를 의도적으로 노출하지 않습니다.

## 관련 항목

- [도구 개요](/ko/tools) — 사용 가능한 모든 에이전트 도구
- [fal](/ko/providers/fal) — fal 이미지 및 비디오 provider 설정
- [ComfyUI](/ko/providers/comfy) — 로컬 ComfyUI 및 Comfy Cloud 워크플로우 설정
- [Google (Gemini)](/ko/providers/google) — Gemini 이미지 provider 설정
- [MiniMax](/ko/providers/minimax) — MiniMax 이미지 provider 설정
- [OpenAI](/ko/providers/openai) — OpenAI Images provider 설정
- [Vydra](/ko/providers/vydra) — Vydra 이미지, 비디오, 음성 설정
- [xAI](/ko/providers/xai) — Grok 이미지, 비디오, 검색, 코드 실행 및 TTS 설정
- [구성 참조](/ko/gateway/config-agents#agent-defaults) — `imageGenerationModel` config
- [모델](/ko/concepts/models) — 모델 구성 및 failover
