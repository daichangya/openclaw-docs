---
read_when:
    - OpenClaw에서 Google Gemini 모델을 사용하려고 합니다
    - API 키 또는 OAuth 인증 흐름이 필요합니다
summary: Google Gemini 설정(API 키 + OAuth, 이미지 생성, 미디어 이해, TTS, 웹 검색)
title: Google (Gemini)
x-i18n:
    generated_at: "2026-04-19T01:11:27Z"
    model: gpt-5.4
    provider: openai
    source_hash: e5e055b02cc51899e11836a882f1f981fedfa5c4dbe42261ac2f2eba5e4d707c
    source_path: providers/google.md
    workflow: 15
---

# Google (Gemini)

Google Plugin은 Google AI Studio를 통해 Gemini 모델에 대한 액세스를 제공하며, 여기에
이미지 생성, 미디어 이해(이미지/오디오/비디오), 텍스트 음성 변환, 그리고
Gemini Grounding을 통한 웹 검색도 포함됩니다.

- 제공자: `google`
- 인증: `GEMINI_API_KEY` 또는 `GOOGLE_API_KEY`
- API: Google Gemini API
- 대체 제공자: `google-gemini-cli` (OAuth)

## 시작하기

선호하는 인증 방법을 선택하고 설정 단계를 따르세요.

<Tabs>
  <Tab title="API key">
    **가장 적합한 경우:** Google AI Studio를 통한 일반적인 Gemini API 액세스.

    <Steps>
      <Step title="온보딩 실행">
        ```bash
        openclaw onboard --auth-choice gemini-api-key
        ```

        또는 키를 직접 전달합니다:

        ```bash
        openclaw onboard --non-interactive \
          --mode local \
          --auth-choice gemini-api-key \
          --gemini-api-key "$GEMINI_API_KEY"
        ```
      </Step>
      <Step title="기본 모델 설정">
        ```json5
        {
          agents: {
            defaults: {
              model: { primary: "google/gemini-3.1-pro-preview" },
            },
          },
        }
        ```
      </Step>
      <Step title="모델을 사용할 수 있는지 확인">
        ```bash
        openclaw models list --provider google
        ```
      </Step>
    </Steps>

    <Tip>
    환경 변수 `GEMINI_API_KEY`와 `GOOGLE_API_KEY`는 둘 다 허용됩니다. 이미 구성해 둔 값을 사용하세요.
    </Tip>

  </Tab>

  <Tab title="Gemini CLI (OAuth)">
    **가장 적합한 경우:** 별도의 API 키 대신 기존 Gemini CLI 로그인을 PKCE OAuth로 재사용하는 경우.

    <Warning>
    `google-gemini-cli` 제공자는 비공식 통합입니다. 일부 사용자는
    이 방식의 OAuth 사용 시 계정 제한이 발생한다고 보고합니다. 사용에 따른 책임은 본인에게 있습니다.
    </Warning>

    <Steps>
      <Step title="Gemini CLI 설치">
        로컬 `gemini` 명령이 `PATH`에서 사용 가능해야 합니다.

        ```bash
        # Homebrew
        brew install gemini-cli

        # 또는 npm
        npm install -g @google/gemini-cli
        ```

        OpenClaw은 Homebrew 설치와 전역 npm 설치를 모두 지원하며,
        일반적인 Windows/npm 레이아웃도 포함합니다.
      </Step>
      <Step title="OAuth로 로그인">
        ```bash
        openclaw models auth login --provider google-gemini-cli --set-default
        ```
      </Step>
      <Step title="모델을 사용할 수 있는지 확인">
        ```bash
        openclaw models list --provider google-gemini-cli
        ```
      </Step>
    </Steps>

    - 기본 모델: `google-gemini-cli/gemini-3-flash-preview`
    - 별칭: `gemini-cli`

    **환경 변수:**

    - `OPENCLAW_GEMINI_OAUTH_CLIENT_ID`
    - `OPENCLAW_GEMINI_OAUTH_CLIENT_SECRET`

    (`GEMINI_CLI_*` 변형도 가능)

    <Note>
    로그인 후 Gemini CLI OAuth 요청이 실패하면, Gateway 호스트에서 `GOOGLE_CLOUD_PROJECT` 또는
    `GOOGLE_CLOUD_PROJECT_ID`를 설정한 뒤 다시 시도하세요.
    </Note>

    <Note>
    브라우저 흐름이 시작되기 전에 로그인이 실패하면, 로컬 `gemini`
    명령이 설치되어 있고 `PATH`에 있는지 확인하세요.
    </Note>

    OAuth 전용 `google-gemini-cli` 제공자는 별도의 텍스트 추론
    인터페이스입니다. 이미지 생성, 미디어 이해, Gemini Grounding은 계속
    `google` 제공자 ID에 남아 있습니다.

  </Tab>
</Tabs>

## 기능

| 기능 | 지원 여부 |
| ---------------------- | ----------------------------- |
| 채팅 완성 | 예 |
| 이미지 생성 | 예 |
| 음악 생성 | 예 |
| 텍스트 음성 변환 | 예 |
| 이미지 이해 | 예 |
| 오디오 전사 | 예 |
| 비디오 이해 | 예 |
| 웹 검색 (Grounding) | 예 |
| 사고/추론 | 예 (Gemini 2.5+ / Gemini 3+) |
| Gemma 4 모델 | 예 |

<Tip>
Gemini 3 모델은 `thinkingBudget` 대신 `thinkingLevel`을 사용합니다. OpenClaw은
Gemini 3, Gemini 3.1, 그리고 `gemini-*-latest` 별칭의 추론 제어를
`thinkingLevel`에 매핑하므로 기본/저지연 실행 시 비활성화된
`thinkingBudget` 값이 전송되지 않습니다.

Gemma 4 모델(예: `gemma-4-26b-a4b-it`)은 사고 모드를 지원합니다. OpenClaw은
Gemma 4에 대해 `thinkingBudget`을 지원되는 Google `thinkingLevel`로 다시 작성합니다.
사고를 `off`로 설정하면 `MINIMAL`로 매핑하는 대신 사고 비활성화 상태가 유지됩니다.
</Tip>

## 이미지 생성

번들 `google` 이미지 생성 제공자의 기본값은
`google/gemini-3.1-flash-image-preview`입니다.

- `google/gemini-3-pro-image-preview`도 지원
- 생성: 요청당 최대 4개 이미지
- 편집 모드: 활성화됨, 입력 이미지 최대 5개
- 지오메트리 제어: `size`, `aspectRatio`, `resolution`

Google을 기본 이미지 제공자로 사용하려면:

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

<Note>
공통 도구 매개변수, 제공자 선택, 장애 조치 동작은 [Image Generation](/ko/tools/image-generation)을 참고하세요.
</Note>

## 비디오 생성

번들 `google` Plugin은 공유
`video_generate` 도구를 통해 비디오 생성도 등록합니다.

- 기본 비디오 모델: `google/veo-3.1-fast-generate-preview`
- 모드: 텍스트-비디오, 이미지-비디오, 단일 비디오 참조 흐름
- `aspectRatio`, `resolution`, `audio` 지원
- 현재 길이 제한: **4초~8초**

Google을 기본 비디오 제공자로 사용하려면:

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

<Note>
공통 도구 매개변수, 제공자 선택, 장애 조치 동작은 [Video Generation](/ko/tools/video-generation)을 참고하세요.
</Note>

## 음악 생성

번들 `google` Plugin은 공유
`music_generate` 도구를 통해 음악 생성도 등록합니다.

- 기본 음악 모델: `google/lyria-3-clip-preview`
- `google/lyria-3-pro-preview`도 지원
- 프롬프트 제어: `lyrics` 및 `instrumental`
- 출력 형식: 기본적으로 `mp3`, `google/lyria-3-pro-preview`에서는 추가로 `wav`
- 참조 입력: 이미지 최대 10개
- 세션 기반 실행은 `action: "status"`를 포함한 공유 작업/상태 흐름을 통해 분리 실행됨

Google을 기본 음악 제공자로 사용하려면:

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

<Note>
공통 도구 매개변수, 제공자 선택, 장애 조치 동작은 [Music Generation](/ko/tools/music-generation)을 참고하세요.
</Note>

## 텍스트 음성 변환

번들 `google` 음성 제공자는
`gemini-3.1-flash-tts-preview`와 함께 Gemini API TTS 경로를 사용합니다.

- 기본 음성: `Kore`
- 인증: `messages.tts.providers.google.apiKey`, `models.providers.google.apiKey`, `GEMINI_API_KEY`, 또는 `GOOGLE_API_KEY`
- 출력: 일반 TTS 첨부 파일용 WAV, Talk/전화 통신용 PCM
- 네이티브 음성 메모 출력: API가 Opus가 아닌 PCM을 반환하므로 이 Gemini API 경로에서는 지원되지 않음

Google을 기본 TTS 제공자로 사용하려면:

```json5
{
  messages: {
    tts: {
      auto: "always",
      provider: "google",
      providers: {
        google: {
          model: "gemini-3.1-flash-tts-preview",
          voiceName: "Kore",
        },
      },
    },
  },
}
```

Gemini API TTS는 텍스트 안에서
`[whispers]` 또는 `[laughs]` 같은 표현형 대괄호 오디오 태그를 허용합니다. 태그를 보이는 채팅 답변에서는 숨기고
TTS에는 전달하려면, `[[tts:text]]...[[/tts:text]]` 블록 안에 넣으세요:

```text
여기에 깔끔한 답변 텍스트가 있습니다.

[[tts:text]][whispers] 여기에 음성으로 말할 버전이 있습니다.[[/tts:text]]
```

<Note>
Gemini API로 제한된 Google Cloud Console API 키는 이
제공자에 대해 유효합니다. 이는 별도의 Cloud Text-to-Speech API 경로가 아닙니다.
</Note>

## 고급 구성

<AccordionGroup>
  <Accordion title="직접 Gemini 캐시 재사용">
    직접 Gemini API 실행(`api: "google-generative-ai"`)의 경우, OpenClaw은
    구성된 `cachedContent` 핸들을 Gemini 요청으로 그대로 전달합니다.

    - 모델별 또는 전역 매개변수를 `cachedContent` 또는 레거시 `cached_content` 중 하나로 구성
    - 둘 다 있으면 `cachedContent`가 우선
    - 예시 값: `cachedContents/prebuilt-context`
    - Gemini 캐시 적중 사용량은 업스트림 `cachedContentTokenCount`에서
      OpenClaw `cacheRead`로 정규화됨

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

  </Accordion>

  <Accordion title="Gemini CLI JSON 사용 참고 사항">
    `google-gemini-cli` OAuth 제공자를 사용할 때, OpenClaw은
    CLI JSON 출력을 다음과 같이 정규화합니다:

    - 답변 텍스트는 CLI JSON `response` 필드에서 가져옵니다.
    - CLI가 `usage`를 비워둘 때 사용량은 `stats`로 대체됩니다.
    - `stats.cached`는 OpenClaw `cacheRead`로 정규화됩니다.
    - `stats.input`이 없으면 OpenClaw은
      `stats.input_tokens - stats.cached`에서 입력 토큰을 계산합니다.

  </Accordion>

  <Accordion title="환경 및 데몬 설정">
    Gateway가 데몬(launchd/systemd)으로 실행되는 경우, `GEMINI_API_KEY`가
    해당 프로세스에서 사용 가능하도록 하세요(예: `~/.openclaw/.env` 또는
    `env.shellEnv`를 통해).
  </Accordion>
</AccordionGroup>

## 관련 항목

<CardGroup cols={2}>
  <Card title="모델 선택" href="/ko/concepts/model-providers" icon="layers">
    제공자, 모델 참조, 장애 조치 동작 선택.
  </Card>
  <Card title="이미지 생성" href="/ko/tools/image-generation" icon="image">
    공통 이미지 도구 매개변수와 제공자 선택.
  </Card>
  <Card title="비디오 생성" href="/ko/tools/video-generation" icon="video">
    공통 비디오 도구 매개변수와 제공자 선택.
  </Card>
  <Card title="음악 생성" href="/ko/tools/music-generation" icon="music">
    공통 음악 도구 매개변수와 제공자 선택.
  </Card>
</CardGroup>
