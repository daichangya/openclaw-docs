---
read_when:
    - 미디어 이해 설계 또는 리팩터링
    - 인바운드 audio/video/image 전처리 조정
summary: provider + CLI fallback을 사용하는 인바운드 image/audio/video 이해(선택 사항)
title: 미디어 이해
x-i18n:
    generated_at: "2026-04-25T12:27:16Z"
    model: gpt-5.4
    provider: openai
    source_hash: 573883a2e0bf27fc04da1a5464e53ba41d006ecad5a04704c24467e77c8eda3d
    source_path: nodes/media-understanding.md
    workflow: 15
---

# 미디어 이해 - 인바운드 (2026-01-17)

OpenClaw는 응답 파이프라인이 실행되기 전에 **인바운드 미디어**(image/audio/video)를 요약할 수 있습니다. 로컬 도구나 provider 키를 사용할 수 있으면 이를 자동 감지하며, 비활성화하거나 사용자 지정할 수 있습니다. 이해 기능이 꺼져 있어도 모델은 평소처럼 원본 파일/URL을 계속 받습니다.

벤더별 미디어 동작은 벤더 Plugin이 등록하며, OpenClaw
코어는 공통 `tools.media` config, fallback 순서, 응답 파이프라인
통합을 담당합니다.

## 목표

- 선택 사항: 더 빠른 라우팅과 더 나은 명령 파싱을 위해 인바운드 미디어를 짧은 텍스트로 사전 요약합니다.
- 원본 미디어를 모델에 전달하는 동작을 유지합니다(항상).
- **provider API**와 **CLI fallback**을 지원합니다.
- 순서가 있는 fallback을 갖는 여러 모델을 허용합니다(오류/크기/타임아웃).

## 상위 수준 동작

1. 인바운드 첨부 파일을 수집합니다(`MediaPaths`, `MediaUrls`, `MediaTypes`).
2. 활성화된 각 capability(image/audio/video)에 대해 정책에 따라 첨부 파일을 선택합니다(기본값: **첫 번째**).
3. 첫 번째 적격 모델 항목을 선택합니다(크기 + capability + auth).
4. 모델이 실패하거나 미디어가 너무 크면 **다음 항목으로 fallback**합니다.
5. 성공 시:
   - `Body`는 `[Image]`, `[Audio]`, 또는 `[Video]` 블록이 됩니다.
   - Audio는 `{{Transcript}}`를 설정하며, 명령 파싱은 캡션 텍스트가 있으면 이를 사용하고,
     없으면 transcript를 사용합니다.
   - 캡션은 블록 내부에 `User text:`로 보존됩니다.

이해가 실패하거나 비활성화되어도 **응답 흐름은** 원래 body + 첨부 파일과 함께 계속 진행됩니다.

## config 개요

`tools.media`는 **공통 모델**과 capability별 재정의를 지원합니다.

- `tools.media.models`: 공통 모델 목록(`capabilities`로 제한 가능).
- `tools.media.image` / `tools.media.audio` / `tools.media.video`:
  - 기본값(`prompt`, `maxChars`, `maxBytes`, `timeoutSeconds`, `language`)
  - provider 재정의(`baseUrl`, `headers`, `providerOptions`)
  - `tools.media.audio.providerOptions.deepgram`을 통한 Deepgram audio 옵션
  - audio transcript echo 제어(`echoTranscript`, 기본값 `false`; `echoFormat`)
  - 선택적 **capability별 `models` 목록**(공통 모델보다 우선)
  - `attachments` 정책(`mode`, `maxAttachments`, `prefer`)
  - `scope`(채널/chatType/session 키별 선택적 게이팅)
- `tools.media.concurrency`: capability 실행 최대 동시 수(기본값 **2**).

```json5
{
  tools: {
    media: {
      models: [
        /* 공통 목록 */
      ],
      image: {
        /* 선택적 재정의 */
      },
      audio: {
        /* 선택적 재정의 */
        echoTranscript: true,
        echoFormat: '📝 "{transcript}"',
      },
      video: {
        /* 선택적 재정의 */
      },
    },
  },
}
```

### 모델 항목

각 `models[]` 항목은 **provider** 또는 **CLI**일 수 있습니다.

```json5
{
  type: "provider", // 생략 시 기본값
  provider: "openai",
  model: "gpt-5.5",
  prompt: "이미지를 500자 이하로 설명하세요.",
  maxChars: 500,
  maxBytes: 10485760,
  timeoutSeconds: 60,
  capabilities: ["image"], // 선택 사항, 멀티모달 항목에 사용
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
    "{{MediaPath}}의 미디어를 읽고 {{MaxChars}}자 이하로 설명하세요.",
  ],
  maxChars: 500,
  maxBytes: 52428800,
  timeoutSeconds: 120,
  capabilities: ["video", "image"],
}
```

CLI 템플릿은 다음도 사용할 수 있습니다.

- `{{MediaDir}}` (미디어 파일이 들어 있는 디렉터리)
- `{{OutputDir}}` (이번 실행을 위해 생성된 스크래치 디렉터리)
- `{{OutputBase}}` (확장자 없는 스크래치 파일 기본 경로)

## 기본값 및 제한

권장 기본값:

- `maxChars`: image/video에 대해 **500**(짧고 명령 친화적)
- `maxChars`: audio에 대해 **설정 안 함**(제한을 설정하지 않으면 전체 transcript)
- `maxBytes`:
  - image: **10MB**
  - audio: **20MB**
  - video: **50MB**

규칙:

- 미디어가 `maxBytes`를 초과하면 해당 모델은 건너뛰고 **다음 모델을 시도**합니다.
- **1024바이트**보다 작은 audio 파일은 비어 있거나 손상된 것으로 간주되어 provider/CLI 전사 전에 건너뜁니다.
- 모델이 `maxChars`보다 많은 내용을 반환하면 출력은 잘립니다.
- `prompt` 기본값은 단순한 “Describe the {media}.”에 `maxChars` 안내를 더한 형태입니다(image/video만).
- 활성 기본 이미지 모델이 이미 기본적으로 vision을 지원하면 OpenClaw는
  `[Image]` 요약 블록을 건너뛰고 원본 이미지를 대신 모델에 전달합니다.
- Gateway/WebChat 기본 모델이 텍스트 전용이면 image 첨부 파일은 오프로드된 `media://inbound/*` ref로 보존되므로 image/PDF 도구 또는 구성된 이미지 모델이 첨부 파일을 잃지 않고 계속 검사할 수 있습니다.
- 명시적인 `openclaw infer image describe --model <provider/model>` 요청은 다릅니다. 이 요청은
  Ollama ref(`ollama/qwen2.5vl:7b` 등)를 포함하여 해당 image-capable provider/model을 직접 실행합니다.
- `<capability>.enabled: true`인데 구성된 모델이 없으면 OpenClaw는
  해당 provider가 capability를 지원할 때 **활성 응답 모델**을 시도합니다.

### 미디어 이해 자동 감지(기본값)

`tools.media.<capability>.enabled`가 명시적으로 `false`로 설정되지 않았고
구성된 모델도 없다면, OpenClaw는 다음 순서로 자동 감지하고 **처음으로 작동하는 옵션에서 중지**합니다.

1. 해당 provider가 capability를 지원할 경우 **활성 응답 모델**.
2. **`agents.defaults.imageModel`** 기본/fallback ref(image 전용).
3. **로컬 CLI**(audio 전용, 설치된 경우)
   - `sherpa-onnx-offline` (`SHERPA_ONNX_MODEL_DIR`에 encoder/decoder/joiner/tokens 필요)
   - `whisper-cli` (`whisper-cpp`; `WHISPER_CPP_MODEL` 또는 번들 tiny 모델 사용)
   - `whisper` (Python CLI; 모델 자동 다운로드)
4. **Gemini CLI** (`gemini`) using `read_many_files`
5. **provider auth**
   - capability를 지원하는 구성된 `models.providers.*` 항목은
     번들 fallback 순서보다 먼저 시도됩니다.
   - image-capable 모델을 가진 image 전용 config provider는
     번들 벤더 Plugin이 아니어도 미디어 이해용으로 자동 등록됩니다.
   - Ollama 이미지 이해는 `agents.defaults.imageModel` 또는
     `openclaw infer image describe --model ollama/<vision-model>`처럼
     명시적으로 선택했을 때 사용할 수 있습니다.
   - 번들 fallback 순서:
     - Audio: OpenAI → Groq → xAI → Deepgram → Google → SenseAudio → ElevenLabs → Mistral
     - Image: OpenAI → Anthropic → Google → MiniMax → MiniMax Portal → Z.AI
     - Video: Google → Qwen → Moonshot

자동 감지를 비활성화하려면 다음과 같이 설정하세요.

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

참고: 바이너리 감지는 macOS/Linux/Windows 전반에서 최선의 방식으로 수행됩니다. CLI가 `PATH`에 있도록 하거나(`~`는 확장됨), 전체 명령 경로와 함께 명시적인 CLI 모델을 설정하세요.

### 프록시 환경 지원(provider 모델)

provider 기반 **audio** 및 **video** 미디어 이해가 활성화되면, OpenClaw는
provider HTTP 호출에 대해 표준 아웃바운드 프록시 환경 변수를 따릅니다.

- `HTTPS_PROXY`
- `HTTP_PROXY`
- `https_proxy`
- `http_proxy`

프록시 env vars가 설정되지 않으면 미디어 이해는 직접 egress를 사용합니다.
프록시 값 형식이 잘못되면 OpenClaw는 경고를 로그에 남기고 직접
fetch로 fallback합니다.

## capability(선택 사항)

`capabilities`를 설정하면 해당 항목은 해당 미디어 유형에 대해서만 실행됩니다. 공통
목록에서는 OpenClaw가 기본값을 추론할 수 있습니다.

- `openai`, `anthropic`, `minimax`: **image**
- `minimax-portal`: **image**
- `moonshot`: **image + video**
- `openrouter`: **image**
- `google` (Gemini API): **image + audio + video**
- `qwen`: **image + video**
- `mistral`: **audio**
- `zai`: **image**
- `groq`: **audio**
- `xai`: **audio**
- `deepgram`: **audio**
- image-capable 모델을 가진 모든 `models.providers.<id>.models[]` 카탈로그:
  **image**

CLI 항목의 경우 예상치 못한 매칭을 피하려면 **`capabilities`를 명시적으로 설정**하세요.
`capabilities`를 생략하면 해당 항목은 자신이 나타난 목록에 대해 적격이 됩니다.

## provider 지원 매트릭스(OpenClaw 통합)

| Capability | Provider 통합                                                                                                             | 참고                                                                                                                                                                                                                                    |
| ---------- | ------------------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Image      | OpenAI, OpenAI Codex OAuth, Codex app-server, OpenRouter, Anthropic, Google, MiniMax, Moonshot, Qwen, Z.AI, config provider | 벤더 Plugin이 이미지 지원을 등록합니다. `openai-codex/*`는 OAuth provider 플러밍을 사용하고, `codex/*`는 제한된 Codex app-server 턴을 사용합니다. MiniMax 및 MiniMax OAuth는 모두 `MiniMax-VL-01`을 사용하며, image-capable config provider는 자동 등록됩니다. |
| Audio      | OpenAI, Groq, xAI, Deepgram, Google, SenseAudio, ElevenLabs, Mistral                                                      | provider 전사(Whisper/Groq/xAI/Deepgram/Gemini/SenseAudio/Scribe/Voxtral).                                                                                                                                                             |
| Video      | Google, Qwen, Moonshot                                                                                                    | 벤더 Plugin을 통한 provider 비디오 이해. Qwen 비디오 이해는 표준 DashScope 엔드포인트를 사용합니다.                                                                                                                                    |

MiniMax 참고:

- `minimax` 및 `minimax-portal` 이미지 이해는 Plugin 소유
  `MiniMax-VL-01` 미디어 provider에서 제공합니다.
- 번들된 MiniMax 텍스트 카탈로그는 여전히 텍스트 전용으로 시작하며,
  명시적인 `models.providers.minimax` 항목은 image-capable M2.7 chat ref를 구체화합니다.

## 모델 선택 가이드

- 품질과 안전성이 중요할 때는 각 미디어 capability에 대해 사용할 수 있는 가장 강력한 최신 세대 모델을 우선 사용하세요.
- 신뢰할 수 없는 입력을 처리하는 도구 활성화 에이전트의 경우 오래되거나 약한 미디어 모델은 피하세요.
- 가용성을 위해 capability별로 최소 하나의 fallback을 유지하세요(고품질 모델 + 더 빠르거나 저렴한 모델).
- CLI fallback(`whisper-cli`, `whisper`, `gemini`)은 provider API를 사용할 수 없을 때 유용합니다.
- `parakeet-mlx` 참고: `--output-dir`과 함께 사용할 때 OpenClaw는 출력 형식이 `txt`이거나 지정되지 않은 경우 `<output-dir>/<media-basename>.txt`를 읽습니다. `txt`가 아닌 형식은 stdout으로 fallback합니다.

## 첨부 파일 정책

capability별 `attachments`는 어떤 첨부 파일을 처리할지 제어합니다.

- `mode`: `first`(기본값) 또는 `all`
- `maxAttachments`: 처리할 최대 개수(기본값 **1**)
- `prefer`: `first`, `last`, `path`, `url`

`mode: "all"`일 때 출력에는 `[Image 1/2]`, `[Audio 2/2]` 등이 표시됩니다.

파일 첨부 추출 동작:

- 추출된 파일 텍스트는 미디어 프롬프트에 추가되기 전에 **신뢰할 수 없는 외부 콘텐츠**로 래핑됩니다.
- 삽입된 블록은
  `<<<EXTERNAL_UNTRUSTED_CONTENT id="...">>>` /
  `<<<END_EXTERNAL_UNTRUSTED_CONTENT id="...">>>` 같은 명시적 경계 마커를 사용하며,
  `Source: External` 메타데이터 줄을 포함합니다.
- 이 첨부 추출 경로는 미디어 프롬프트가 과도하게 커지는 것을 피하기 위해 의도적으로 긴
  `SECURITY NOTICE:` 배너를 생략합니다. 경계
  마커와 메타데이터는 그대로 유지됩니다.
- 파일에서 추출 가능한 텍스트가 없으면 OpenClaw는 `[No extractable text]`를 삽입합니다.
- PDF가 이 경로에서 렌더링된 페이지 이미지로 fallback하면 미디어 프롬프트는
  `[PDF content rendered to images; images not forwarded to model]`
  플레이스홀더를 유지합니다. 이 첨부 추출 단계는 렌더링된 PDF 이미지가 아니라 텍스트 블록을 전달하기 때문입니다.

## config 예시

### 1) 공통 모델 목록 + 재정의

```json5
{
  tools: {
    media: {
      models: [
        { provider: "openai", model: "gpt-5.5", capabilities: ["image"] },
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
            "{{MediaPath}}의 미디어를 읽고 {{MaxChars}}자 이하로 설명하세요.",
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

### 2) Audio + Video만 사용(image 비활성화)

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
              "{{MediaPath}}의 미디어를 읽고 {{MaxChars}}자 이하로 설명하세요.",
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
          { provider: "openai", model: "gpt-5.5" },
          { provider: "anthropic", model: "claude-opus-4-6" },
          {
            type: "cli",
            command: "gemini",
            args: [
              "-m",
              "gemini-3-flash",
              "--allowed-tools",
              "read_file",
              "{{MediaPath}}의 미디어를 읽고 {{MaxChars}}자 이하로 설명하세요.",
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

미디어 이해가 실행되면 `/status`에 짧은 요약 줄이 포함됩니다.

```text
📎 Media: image ok (openai/gpt-5.4) · audio skipped (maxBytes)
```

여기에는 capability별 결과와 해당하는 경우 선택된 provider/model이 표시됩니다.

## 참고

- 이해 기능은 **best-effort**입니다. 오류가 발생해도 응답은 차단되지 않습니다.
- 이해 기능이 비활성화되어 있어도 첨부 파일은 계속 모델에 전달됩니다.
- `scope`를 사용해 이해 기능이 실행되는 위치를 제한하세요(예: DM만).

## 관련 문서

- [구성](/ko/gateway/configuration)
- [이미지 및 미디어 지원](/ko/nodes/images)
