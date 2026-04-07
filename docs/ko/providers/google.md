---
read_when:
    - OpenClaw에서 Google Gemini 모델을 사용하려는 경우
    - API 키 또는 OAuth 인증 흐름이 필요한 경우
summary: Google Gemini 설정(API 키 + OAuth, 이미지 생성, 미디어 이해, 웹 검색)
title: Google (Gemini)
x-i18n:
    generated_at: "2026-04-07T05:59:45Z"
    model: gpt-5.4
    provider: openai
    source_hash: 36cc7c7d8d19f6d4a3fb223af36c8402364fc309d14ffe922bd004203ceb1754
    source_path: providers/google.md
    workflow: 15
---

# Google (Gemini)

Google 플러그인은 Google AI Studio를 통해 Gemini 모델에 대한 액세스를 제공하며,
Gemini Grounding을 통한 이미지 생성, 미디어 이해(이미지/오디오/비디오), 웹 검색도 제공합니다.

- 프로바이더: `google`
- 인증: `GEMINI_API_KEY` 또는 `GOOGLE_API_KEY`
- API: Google Gemini API
- 대체 프로바이더: `google-gemini-cli` (OAuth)

## 빠른 시작

1. API 키를 설정합니다:

```bash
openclaw onboard --auth-choice gemini-api-key
```

2. 기본 모델을 설정합니다:

```json5
{
  agents: {
    defaults: {
      model: { primary: "google/gemini-3.1-pro-preview" },
    },
  },
}
```

## 비대화형 예시

```bash
openclaw onboard --non-interactive \
  --mode local \
  --auth-choice gemini-api-key \
  --gemini-api-key "$GEMINI_API_KEY"
```

## OAuth (Gemini CLI)

대체 프로바이더 `google-gemini-cli`는 API
키 대신 PKCE OAuth를 사용합니다. 이는 비공식 통합이며, 일부 사용자는 계정
제한을 보고했습니다. 사용에 따른 책임은 사용자에게 있습니다.

- 기본 모델: `google-gemini-cli/gemini-3.1-pro-preview`
- 별칭: `gemini-cli`
- 설치 선행 조건: 로컬 Gemini CLI를 `gemini`로 사용할 수 있어야 함
  - Homebrew: `brew install gemini-cli`
  - npm: `npm install -g @google/gemini-cli`
- 로그인:

```bash
openclaw models auth login --provider google-gemini-cli --set-default
```

환경 변수:

- `OPENCLAW_GEMINI_OAUTH_CLIENT_ID`
- `OPENCLAW_GEMINI_OAUTH_CLIENT_SECRET`

(`GEMINI_CLI_*` 변형도 사용할 수 있습니다.)

로그인 후 Gemini CLI OAuth 요청이 실패하면
게이트웨이 호스트에서 `GOOGLE_CLOUD_PROJECT` 또는 `GOOGLE_CLOUD_PROJECT_ID`를 설정한 뒤
다시 시도하세요.

브라우저 흐름이 시작되기 전에 로그인이 실패하면, 로컬 `gemini`
명령이 설치되어 있고 `PATH`에 있는지 확인하세요. OpenClaw는 Homebrew 설치와
전역 npm 설치를 모두 지원하며, 일반적인 Windows/npm 레이아웃도 포함합니다.

Gemini CLI JSON 사용 참고 사항:

- 답글 텍스트는 CLI JSON `response` 필드에서 가져옵니다.
- CLI가 `usage`를 비워 두면 사용량은 `stats`로 대체됩니다.
- `stats.cached`는 OpenClaw `cacheRead`로 정규화됩니다.
- `stats.input`이 없으면 OpenClaw는
  `stats.input_tokens - stats.cached`에서 입력 토큰 수를 도출합니다.

## 기능

| 기능 | 지원 여부 |
| ---------------------- | ----------------- |
| 채팅 completion | 예 |
| 이미지 생성 | 예 |
| 음악 생성 | 예 |
| 이미지 이해 | 예 |
| 오디오 전사 | 예 |
| 비디오 이해 | 예 |
| 웹 검색(Grounding) | 예 |
| Thinking/reasoning | 예 (Gemini 3.1+) |

## 직접 Gemini 캐시 재사용

직접 Gemini API 실행(`api: "google-generative-ai"`)의 경우, OpenClaw는 이제
구성된 `cachedContent` 핸들을 Gemini 요청으로 전달합니다.

- 모델별 또는 전역 `params`에
  `cachedContent` 또는 레거시 `cached_content`를 사용해 구성하세요
- 둘 다 있으면 `cachedContent`가 우선합니다
- 예시 값: `cachedContents/prebuilt-context`
- Gemini 캐시 적중 사용량은 업스트림 `cachedContentTokenCount`에서
  OpenClaw `cacheRead`로 정규화됩니다

예시:

```json5
{
  agents: {
    defaults: {
      models: {
        "google/gemini-2.5-pro": {
          params: {
            cachedContent: "cachedContents/prebuilt-context",
          },
        },
      },
    },
  },
}
```

## 이미지 생성

번들된 `google` 이미지 생성 프로바이더의 기본값은
`google/gemini-3.1-flash-image-preview`입니다.

- `google/gemini-3-pro-image-preview`도 지원합니다
- 생성: 요청당 최대 4개 이미지
- 편집 모드: 활성화됨, 입력 이미지 최대 5개
- 지오메트리 제어: `size`, `aspectRatio`, `resolution`

OAuth 전용 `google-gemini-cli` 프로바이더는 별도의 텍스트 추론
표면입니다. 이미지 생성, 미디어 이해, Gemini Grounding은 계속
`google` 프로바이더 ID에 남아 있습니다.

Google을 기본 이미지 프로바이더로 사용하려면:

```json5
{
  agents: {
    defaults: {
      imageGenerationModel: {
        primary: "google/gemini-3.1-flash-image-preview",
      },
    },
  },
}
```

공유 도구
파라미터, 프로바이더 선택, 장애 조치 동작은 [이미지 생성](/ko/tools/image-generation)을 참조하세요.

## 비디오 생성

번들된 `google` 플러그인은 공유
`video_generate` 도구를 통해 비디오 생성도 등록합니다.

- 기본 비디오 모델: `google/veo-3.1-fast-generate-preview`
- 모드: text-to-video, image-to-video, 단일 비디오 참조 흐름
- `aspectRatio`, `resolution`, `audio` 지원
- 현재 길이 제한: **4~8초**

Google을 기본 비디오 프로바이더로 사용하려면:

```json5
{
  agents: {
    defaults: {
      videoGenerationModel: {
        primary: "google/veo-3.1-fast-generate-preview",
      },
    },
  },
}
```

공유 도구
파라미터, 프로바이더 선택, 장애 조치 동작은 [비디오 생성](/ko/tools/video-generation)을 참조하세요.

## 음악 생성

번들된 `google` 플러그인은 공유
`music_generate` 도구를 통해 음악 생성도 등록합니다.

- 기본 음악 모델: `google/lyria-3-clip-preview`
- `google/lyria-3-pro-preview`도 지원합니다
- 프롬프트 제어: `lyrics`, `instrumental`
- 출력 형식: 기본적으로 `mp3`, `google/lyria-3-pro-preview`에서는 `wav`도 지원
- 참조 입력: 이미지 최대 10개
- 세션 기반 실행은 `action: "status"`를 포함한 공유 task/status 흐름을 통해 분리 실행됩니다

Google을 기본 음악 프로바이더로 사용하려면:

```json5
{
  agents: {
    defaults: {
      musicGenerationModel: {
        primary: "google/lyria-3-clip-preview",
      },
    },
  },
}
```

공유 도구
파라미터, 프로바이더 선택, 장애 조치 동작은 [음악 생성](/ko/tools/music-generation)을 참조하세요.

## 환경 참고

Gateway가 데몬(launchd/systemd)으로 실행되는 경우, `GEMINI_API_KEY`가
해당 프로세스에서 사용할 수 있어야 합니다(예: `~/.openclaw/.env` 또는
`env.shellEnv`를 통해).
