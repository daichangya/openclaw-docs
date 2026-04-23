---
read_when:
    - 미디어 이해 설계 또는 리팩터링
    - 수신 오디오/비디오/이미지 전처리 조정
summary: 수신 이미지/오디오/비디오 이해(선택 사항), provider 및 CLI 대체 수단 포함
title: 미디어 이해
x-i18n:
    generated_at: "2026-04-23T06:04:07Z"
    model: gpt-5.4
    provider: openai
    source_hash: 5bb2d0eab59d857c2849f329435f8fad3eeff427f7984d011bd5b7d9fd7bf51c
    source_path: nodes/media-understanding.md
    workflow: 15
---

# 미디어 이해 - 수신(2026-01-17)

OpenClaw는 회신 파이프라인이 실행되기 전에 **수신 미디어**(이미지/오디오/비디오)를 **요약**할 수 있습니다. 로컬 도구나 provider 키를 사용할 수 있으면 자동으로 감지하며, 비활성화하거나 사용자 지정할 수도 있습니다. 이해 기능이 꺼져 있어도 모델은 평소처럼 원본 파일/URL을 그대로 받습니다.

벤더별 미디어 동작은 벤더 plugin이 등록하며, OpenClaw
코어는 공유 `tools.media` 구성, 대체 순서, 회신 파이프라인
통합을 담당합니다.

## 목표

- 선택 사항: 더 빠른 라우팅 + 더 나은 명령 파싱을 위해 수신 미디어를 짧은 텍스트로 사전 요약합니다.
- 원본 미디어 전달을 모델에 보존합니다(항상).
- **provider API**와 **CLI 대체 수단**을 지원합니다.
- 순서가 있는 대체 모델 여러 개를 허용합니다(오류/크기/타임아웃).

## 상위 수준 동작

1. 수신 첨부파일을 수집합니다(`MediaPaths`, `MediaUrls`, `MediaTypes`).
2. 활성화된 각 capability(이미지/오디오/비디오)에 대해 정책에 따라 첨부파일을 선택합니다(기본값: **first**).
3. 첫 번째 적격 모델 항목을 선택합니다(크기 + capability + 인증).
4. 모델이 실패하거나 미디어가 너무 크면 **다음 항목으로 대체**합니다.
5. 성공 시:
   - `Body`는 `[Image]`, `[Audio]`, 또는 `[Video]` 블록이 됩니다.
   - 오디오는 `{{Transcript}}`를 설정하며, 명령 파싱은 캡션 텍스트가 있으면 이를 사용하고,
     그렇지 않으면 전사문을 사용합니다.
   - 캡션은 블록 내부의 `User text:`로 보존됩니다.

이해가 실패하거나 비활성화된 경우에도 **회신 흐름은 계속 진행**되며, 원래 body + 첨부파일이 유지됩니다.

## 구성 개요

`tools.media`는 **공유 모델**과 capability별 재정의를 지원합니다:

- `tools.media.models`: 공유 모델 목록(`capabilities`로 게이트 적용).
- `tools.media.image` / `tools.media.audio` / `tools.media.video`:
  - 기본값(`prompt`, `maxChars`, `maxBytes`, `timeoutSeconds`, `language`)
  - provider 재정의(`baseUrl`, `headers`, `providerOptions`)
  - `tools.media.audio.providerOptions.deepgram`을 통한 Deepgram 오디오 옵션
  - 오디오 전사문 에코 제어(`echoTranscript`, 기본값 `false`; `echoFormat`)
  - 선택적 capability별 **`models` 목록**(공유 모델보다 우선)
  - `attachments` 정책(`mode`, `maxAttachments`, `prefer`)
  - `scope`(선택 사항, 채널/chatType/세션 키별 게이팅)
- `tools.media.concurrency`: 동시에 실행할 수 있는 capability 수의 최대값(기본값 **2**).

```json5
{
  tools: {
    media: {
      models: [
        /* shared list */
      ],
      image: {
        /* optional overrides */
      },
      audio: {
        /* optional overrides */
        echoTranscript: true,
        echoFormat: '📝 "{transcript}"',
      },
      video: {
        /* optional overrides */
      },
    },
  },
}
```

### 모델 항목

각 `models[]` 항목은 **provider** 또는 **CLI**일 수 있습니다:

```json5
{
  type: "provider", // default if omitted
  provider: "openai",
  model: "gpt-5.4-mini",
  prompt: "Describe the image in <= 500 chars.",
  maxChars: 500,
  maxBytes: 10485760,
  timeoutSeconds: 60,
  capabilities: ["image"], // optional, used for multi‑modal entries
  profile: "vision-profile",
  preferredProfile: "vision-fallback",
}
```

```json5
{
  type: "cli",
  command: "gemini",
  args: [
    "-m",
    "gemini-3-flash",
    "--allowed-tools",
    "read_file",
    "Read the media at {{MediaPath}} and describe it in <= {{MaxChars}} characters.",
  ],
  maxChars: 500,
  maxBytes: 52428800,
  timeoutSeconds: 120,
  capabilities: ["video", "image"],
}
```

CLI 템플릿은 다음도 사용할 수 있습니다:

- `{{MediaDir}}`(미디어 파일이 들어 있는 디렉터리)
- `{{OutputDir}}`(이 실행을 위해 생성된 스크래치 디렉터리)
- `{{OutputBase}}`(확장자 없는 스크래치 파일 기본 경로)

## 기본값 및 제한

권장 기본값:

- `maxChars`: 이미지/비디오의 경우 **500**(짧고 명령 친화적)
- `maxChars`: 오디오의 경우 **미설정**(제한을 설정하지 않으면 전체 전사문)
- `maxBytes`:
  - 이미지: **10MB**
  - 오디오: **20MB**
  - 비디오: **50MB**

규칙:

- 미디어가 `maxBytes`를 초과하면 해당 모델은 건너뛰고 **다음 모델을 시도**합니다.
- **1024바이트**보다 작은 오디오 파일은 비어 있거나 손상된 것으로 간주되어 provider/CLI 전사 이전에 건너뜁니다.
- 모델이 `maxChars`보다 많은 내용을 반환하면 출력은 잘립니다.
- `prompt` 기본값은 단순한 “Describe the {media}.”에 `maxChars` 안내를 추가한 형태입니다(이미지/비디오만).
- 활성 기본 이미지 모델이 이미 기본적으로 vision을 지원하면 OpenClaw는
  `[Image]` 요약 블록을 건너뛰고 대신 원본 이미지를
  모델에 전달합니다.
- 명시적인 `openclaw infer image describe --model <provider/model>` 요청은 다릅니다. 이는 Ollama 참조(`ollama/qwen2.5vl:7b`)를 포함해 해당 이미지 지원 provider/model을 직접 실행합니다.
- `<capability>.enabled: true`인데 구성된 모델이 없으면 OpenClaw는
  해당 provider가 capability를 지원할 때 **활성 회신 모델**을 시도합니다.

### 미디어 이해 자동 감지(기본값)

`tools.media.<capability>.enabled`가 **`false`로 설정되지 않았고**
구성된 모델이 없으면, OpenClaw는 다음 순서로 자동 감지하고 **처음으로
작동하는 옵션에서 중지**합니다:

1. 해당 provider가 capability를 지원할 때 **활성 회신 모델**.
2. `agents.defaults.imageModel`의 기본/대체 ref(이미지만).
3. **로컬 CLI**(오디오만; 설치된 경우)
   - `sherpa-onnx-offline`(`SHERPA_ONNX_MODEL_DIR`에 encoder/decoder/joiner/tokens 필요)
   - `whisper-cli`(`whisper-cpp`; `WHISPER_CPP_MODEL` 또는 번들 tiny 모델 사용)
   - `whisper`(Python CLI; 모델 자동 다운로드)
4. `read_many_files`를 사용하는 **Gemini CLI**(`gemini`)
5. **provider 인증**
   - capability를 지원하는 구성된 `models.providers.*` 항목은
     번들 대체 순서보다 먼저 시도됩니다.
   - 이미지 지원 모델이 있는 이미지 전용 구성 provider는
     번들 벤더 plugin이 아니어도 미디어 이해용으로 자동 등록됩니다.
   - Ollama 이미지 이해는 예를 들어
     `agents.defaults.imageModel` 또는
     `openclaw infer image describe --model ollama/<vision-model>`을 통해 명시적으로 선택했을 때 사용할 수 있습니다.
   - 번들 대체 순서:
     - 오디오: OpenAI → Groq → xAI → Deepgram → Google → Mistral
     - 이미지: OpenAI → Anthropic → Google → MiniMax → MiniMax Portal → Z.AI
     - 비디오: Google → Qwen → Moonshot

자동 감지를 비활성화하려면 다음과 같이 설정하세요:

```json5
{
  tools: {
    media: {
      audio: {
        enabled: false,
      },
    },
  },
}
```

참고: 바이너리 감지는 macOS/Linux/Windows 전반에서 best-effort 방식입니다. CLI가 `PATH`에 있도록 하세요(`~`는 확장됨). 또는 전체 명령 경로가 포함된 명시적 CLI 모델을 설정하세요.

### 프록시 환경 지원(provider 모델)

provider 기반 **오디오** 및 **비디오** 미디어 이해가 활성화되면, OpenClaw는
provider HTTP 호출에 대해 표준 아웃바운드 프록시 환경 변수를 따릅니다:

- `HTTPS_PROXY`
- `HTTP_PROXY`
- `https_proxy`
- `http_proxy`

프록시 env var가 설정되지 않으면 미디어 이해는 직접 egress를 사용합니다.
프록시 값 형식이 잘못되면 OpenClaw는 경고를 기록하고 직접
가져오기로 대체합니다.

## capability(선택 사항)

`capabilities`를 설정하면 해당 항목은 그 미디어 유형에 대해서만 실행됩니다. 공유
목록의 경우 OpenClaw는 기본값을 추론할 수 있습니다:

- `openai`, `anthropic`, `minimax`: **image**
- `minimax-portal`: **image**
- `moonshot`: **image + video**
- `openrouter`: **image**
- `google`(Gemini API): **image + audio + video**
- `qwen`: **image + video**
- `mistral`: **audio**
- `zai`: **image**
- `groq`: **audio**
- `xai`: **audio**
- `deepgram`: **audio**
- 이미지 지원 모델이 있는 모든 `models.providers.<id>.models[]` 카탈로그:
  **image**

CLI 항목의 경우 놀라운 매칭을 피하려면 **`capabilities`를 명시적으로 설정**하세요.
`capabilities`를 생략하면 항목은 자신이 나타난 목록에 대해 적격이 됩니다.

## provider 지원 매트릭스(OpenClaw 통합)

| Capability | Provider 통합                                                                         | 참고                                                                                                                                   |
| ---------- | ------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------- |
| Image      | OpenAI, OpenRouter, Anthropic, Google, MiniMax, Moonshot, Qwen, Z.AI, config providers | 벤더 plugin이 이미지 지원을 등록합니다. MiniMax와 MiniMax OAuth는 모두 `MiniMax-VL-01`을 사용하며, 이미지 지원 config provider는 자동 등록됩니다. |
| Audio      | OpenAI, Groq, Deepgram, Google, Mistral                                               | Provider 전사(Whisper/Deepgram/Gemini/Voxtral).                                                                                        |
| Video      | Google, Qwen, Moonshot                                                                | 벤더 plugin을 통한 provider 비디오 이해. Qwen 비디오 이해는 Standard DashScope 엔드포인트를 사용합니다.                                |

MiniMax 참고:

- `minimax`와 `minimax-portal` 이미지 이해는 plugin 소유의
  `MiniMax-VL-01` 미디어 provider에서 제공됩니다.
- 번들 MiniMax 텍스트 카탈로그는 여전히 텍스트 전용으로 시작하며, 명시적인
  `models.providers.minimax` 항목은 이미지 지원 M2.7 chat ref를 구체화합니다.

## 모델 선택 가이드

- 품질과 안전성이 중요할 때는 각 미디어 capability에 대해 사용 가능한 가장 강력한 최신 세대 모델을 우선하세요.
- 신뢰되지 않은 입력을 처리하는 도구 활성화 에이전트의 경우, 오래되거나 약한 미디어 모델은 피하세요.
- 가용성을 위해 capability별로 최소 하나의 대체 수단을 유지하세요(고품질 모델 + 더 빠르거나 저렴한 모델).
- CLI 대체 수단(`whisper-cli`, `whisper`, `gemini`)은 provider API를 사용할 수 없을 때 유용합니다.
- `parakeet-mlx` 참고: `--output-dir`과 함께 사용하면 출력 형식이 `txt`인 경우(또는 미지정된 경우) OpenClaw는 `<output-dir>/<media-basename>.txt`를 읽습니다. `txt`가 아닌 형식은 stdout으로 대체됩니다.

## 첨부파일 정책

capability별 `attachments`는 어떤 첨부파일을 처리할지 제어합니다:

- `mode`: `first`(기본값) 또는 `all`
- `maxAttachments`: 처리할 최대 수(기본값 **1**)
- `prefer`: `first`, `last`, `path`, `url`

`mode: "all"`일 때 출력에는 `[Image 1/2]`, `[Audio 2/2]` 등의 레이블이 붙습니다.

파일 첨부 추출 동작:

- 추출된 파일 텍스트는 미디어 프롬프트에 추가되기 전에 **신뢰되지 않은 외부 콘텐츠**로 래핑됩니다.
- 주입된 블록은
  `<<<EXTERNAL_UNTRUSTED_CONTENT id="...">>>` /
  `<<<END_EXTERNAL_UNTRUSTED_CONTENT id="...">>>` 같은 명시적 경계 마커를 사용하며
  `Source: External` 메타데이터 줄을 포함합니다.
- 이 첨부 추출 경로는 미디어 프롬프트가 과도하게 커지는 것을 막기 위해
  긴 `SECURITY NOTICE:` 배너를 의도적으로 생략합니다. 대신 경계
  마커와 메타데이터는 그대로 유지됩니다.
- 파일에서 추출 가능한 텍스트가 없으면 OpenClaw는 `[No extractable text]`를 주입합니다.
- PDF가 이 경로에서 렌더링된 페이지 이미지로 대체되는 경우, 미디어 프롬프트는
  `[PDF content rendered to images; images not forwarded to model]`
  플레이스홀더를 유지합니다. 이는 이 첨부 추출 단계가 렌더링된 PDF 이미지를 전달하는 것이 아니라
  텍스트 블록을 전달하기 때문입니다.

## 구성 예시

### 1) 공유 모델 목록 + 재정의

```json5
{
  tools: {
    media: {
      models: [
        { provider: "openai", model: "gpt-5.4-mini", capabilities: ["image"] },
        {
          provider: "google",
          model: "gemini-3-flash-preview",
          capabilities: ["image", "audio", "video"],
        },
        {
          type: "cli",
          command: "gemini",
          args: [
            "-m",
            "gemini-3-flash",
            "--allowed-tools",
            "read_file",
            "Read the media at {{MediaPath}} and describe it in <= {{MaxChars}} characters.",
          ],
          capabilities: ["image", "video"],
        },
      ],
      audio: {
        attachments: { mode: "all", maxAttachments: 2 },
      },
      video: {
        maxChars: 500,
      },
    },
  },
}
```

### 2) 오디오 + 비디오만(이미지 끔)

```json5
{
  tools: {
    media: {
      audio: {
        enabled: true,
        models: [
          { provider: "openai", model: "gpt-4o-mini-transcribe" },
          {
            type: "cli",
            command: "whisper",
            args: ["--model", "base", "{{MediaPath}}"],
          },
        ],
      },
      video: {
        enabled: true,
        maxChars: 500,
        models: [
          { provider: "google", model: "gemini-3-flash-preview" },
          {
            type: "cli",
            command: "gemini",
            args: [
              "-m",
              "gemini-3-flash",
              "--allowed-tools",
              "read_file",
              "Read the media at {{MediaPath}} and describe it in <= {{MaxChars}} characters.",
            ],
          },
        ],
      },
    },
  },
}
```

### 3) 선택적 이미지 이해

```json5
{
  tools: {
    media: {
      image: {
        enabled: true,
        maxBytes: 10485760,
        maxChars: 500,
        models: [
          { provider: "openai", model: "gpt-5.4-mini" },
          { provider: "anthropic", model: "claude-opus-4-6" },
          {
            type: "cli",
            command: "gemini",
            args: [
              "-m",
              "gemini-3-flash",
              "--allowed-tools",
              "read_file",
              "Read the media at {{MediaPath}} and describe it in <= {{MaxChars}} characters.",
            ],
          },
        ],
      },
    },
  },
}
```

### 4) 멀티모달 단일 항목(명시적 capability)

```json5
{
  tools: {
    media: {
      image: {
        models: [
          {
            provider: "google",
            model: "gemini-3.1-pro-preview",
            capabilities: ["image", "video", "audio"],
          },
        ],
      },
      audio: {
        models: [
          {
            provider: "google",
            model: "gemini-3.1-pro-preview",
            capabilities: ["image", "video", "audio"],
          },
        ],
      },
      video: {
        models: [
          {
            provider: "google",
            model: "gemini-3.1-pro-preview",
            capabilities: ["image", "video", "audio"],
          },
        ],
      },
    },
  },
}
```

## 상태 출력

미디어 이해가 실행되면 `/status`에 짧은 요약 줄이 포함됩니다:

```
📎 Media: image ok (openai/gpt-5.4-mini) · audio skipped (maxBytes)
```

이는 capability별 결과와 해당하는 경우 선택된 provider/model을 보여줍니다.

## 참고

- 이해는 **best-effort** 방식입니다. 오류가 발생해도 회신은 차단되지 않습니다.
- 이해가 비활성화되어 있어도 첨부파일은 여전히 모델에 전달됩니다.
- `scope`를 사용해 이해가 실행될 위치를 제한하세요(예: DM에서만).

## 관련 문서

- [구성](/ko/gateway/configuration)
- [이미지 및 미디어 지원](/ko/nodes/images)
