---
read_when:
    - OpenClaw와 함께 Google Gemini 모델을 사용하려고 합니다
    - API 키 또는 OAuth 인증 흐름이 필요합니다
summary: Google Gemini 설정(API 키 + OAuth, 이미지 생성, 미디어 이해, TTS, 웹 검색)
title: Google (Gemini)
x-i18n:
    generated_at: "2026-04-24T06:30:50Z"
    model: gpt-5.4
    provider: openai
    source_hash: b43d7171f56ecdfb49a25256783433e64f99a02760b3bc6f0e1055195f556f5d
    source_path: providers/google.md
    workflow: 15
---

Google Plugin은 Google AI Studio를 통한 Gemini 모델 접근과 함께
이미지 생성, 미디어 이해(이미지/오디오/비디오), 텍스트 음성 변환, Gemini Grounding 기반 웹 검색을 제공합니다.

- Provider: `google`
- 인증: `GEMINI_API_KEY` 또는 `GOOGLE_API_KEY`
- API: Google Gemini API
- 대체 Provider: `google-gemini-cli` (OAuth)

## 시작하기

선호하는 인증 방법을 선택하고 설정 단계를 따르세요.

<Tabs>
  <Tab title="API 키">
    **적합한 경우:** Google AI Studio를 통한 표준 Gemini API 접근.

    <Steps>
      <Step title="온보딩 실행">
        ```bash
        openclaw onboard --auth-choice gemini-api-key
        ```

        또는 키를 직접 전달:

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
      <Step title="모델 사용 가능 여부 확인">
        ```bash
        openclaw models list --provider google
        ```
      </Step>
    </Steps>

    <Tip>
    환경 변수 `GEMINI_API_KEY`와 `GOOGLE_API_KEY`는 모두 허용됩니다. 이미 구성한 것을 사용하세요.
    </Tip>

  </Tab>

  <Tab title="Gemini CLI (OAuth)">
    **적합한 경우:** 별도의 API 키 대신 기존 Gemini CLI 로그인을 PKCE OAuth로 재사용하는 경우.

    <Warning>
    `google-gemini-cli` Provider는 비공식 통합입니다. 일부 사용자는 이 방식의 OAuth 사용 시 계정 제한을 보고했습니다. 본인 책임하에 사용하세요.
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

        OpenClaw는 Homebrew 설치와 전역 npm 설치를 모두 지원하며,
        일반적인 Windows/npm 레이아웃도 포함합니다.
      </Step>
      <Step title="OAuth로 로그인">
        ```bash
        openclaw models auth login --provider google-gemini-cli --set-default
        ```
      </Step>
      <Step title="모델 사용 가능 여부 확인">
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

    (또는 `GEMINI_CLI_*` 변형)

    <Note>
    로그인 후 Gemini CLI OAuth 요청이 실패하면 Gateway 호스트에 `GOOGLE_CLOUD_PROJECT` 또는 `GOOGLE_CLOUD_PROJECT_ID`를 설정하고 다시 시도하세요.
    </Note>

    <Note>
    브라우저 흐름이 시작되기 전에 로그인이 실패하면 로컬 `gemini` 명령이 설치되어 있고 `PATH`에 있는지 확인하세요.
    </Note>

    OAuth 전용 `google-gemini-cli` Provider는 별도의 텍스트 Inference 표면입니다. 이미지 생성, 미디어 이해, Gemini Grounding은 계속 `google` Provider id에 남아 있습니다.

  </Tab>
</Tabs>

## 기능

| 기능 | 지원 여부 |
| ---------------------- | ----------------------------- |
| 채팅 completions | 예 |
| 이미지 생성 | 예 |
| 음악 생성 | 예 |
| 텍스트 음성 변환 | 예 |
| 이미지 이해 | 예 |
| 오디오 전사 | 예 |
| 비디오 이해 | 예 |
| 웹 검색 (Grounding) | 예 |
| Thinking/추론 | 예 (Gemini 2.5+ / Gemini 3+) |
| Gemma 4 모델 | 예 |

<Tip>
Gemini 3 모델은 `thinkingBudget`가 아니라 `thinkingLevel`을 사용합니다. OpenClaw는 Gemini 3, Gemini 3.1, `gemini-*-latest` 별칭의 추론 제어를 `thinkingLevel`로 매핑하므로 기본/저지연 실행에서 비활성화된 `thinkingBudget` 값을 보내지 않습니다.

Gemma 4 모델(예: `gemma-4-26b-a4b-it`)은 thinking 모드를 지원합니다. OpenClaw는 Gemma 4에 대해 `thinkingBudget`을 지원되는 Google `thinkingLevel`로 다시 씁니다. thinking을 `off`로 설정하면 `MINIMAL`로 매핑하지 않고 thinking 비활성화 상태를 유지합니다.
</Tip>

## 이미지 생성

번들 `google` 이미지 생성 Provider의 기본값은
`google/gemini-3.1-flash-image-preview`입니다.

- `google/gemini-3-pro-image-preview`도 지원
- 생성: 요청당 최대 4개 이미지
- 편집 모드: 활성화됨, 입력 이미지 최대 5개
- 기하 제어: `size`, `aspectRatio`, `resolution`

Google을 기본 이미지 Provider로 사용하려면:

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
공유 도구 파라미터, Provider 선택, failover 동작은 [이미지 생성](/ko/tools/image-generation)을 참고하세요.
</Note>

## 비디오 생성

번들 `google` Plugin은 공유
`video_generate` 도구를 통해 비디오 생성도 등록합니다.

- 기본 비디오 모델: `google/veo-3.1-fast-generate-preview`
- 모드: text-to-video, image-to-video, 단일 비디오 참조 흐름
- `aspectRatio`, `resolution`, `audio` 지원
- 현재 길이 제한: **4초~8초**

Google을 기본 비디오 Provider로 사용하려면:

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
공유 도구 파라미터, Provider 선택, failover 동작은 [비디오 생성](/ko/tools/video-generation)을 참고하세요.
</Note>

## 음악 생성

번들 `google` Plugin은 공유
`music_generate` 도구를 통해 음악 생성도 등록합니다.

- 기본 음악 모델: `google/lyria-3-clip-preview`
- `google/lyria-3-pro-preview`도 지원
- 프롬프트 제어: `lyrics` 및 `instrumental`
- 출력 형식: 기본 `mp3`, `google/lyria-3-pro-preview`에서는 `wav`도 지원
- 참조 입력: 최대 10개 이미지
- 세션 기반 실행은 `action: "status"`를 포함한 공유 task/status 흐름을 통해 분리됨

Google을 기본 음악 Provider로 사용하려면:

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
공유 도구 파라미터, Provider 선택, failover 동작은 [음악 생성](/ko/tools/music-generation)을 참고하세요.
</Note>

## 텍스트 음성 변환

번들 `google` 음성 Provider는
`gemini-3.1-flash-tts-preview`를 사용한 Gemini API TTS 경로를 사용합니다.

- 기본 음성: `Kore`
- 인증: `messages.tts.providers.google.apiKey`, `models.providers.google.apiKey`, `GEMINI_API_KEY`, 또는 `GOOGLE_API_KEY`
- 출력: 일반 TTS 첨부 파일에는 WAV, Talk/전화용에는 PCM
- 네이티브 음성 노트 출력: API가 Opus가 아니라 PCM을 반환하므로 이 Gemini API 경로에서는 지원되지 않음

Google을 기본 TTS Provider로 사용하려면:

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

Gemini API TTS는 텍스트 안에 `[whispers]` 또는 `[laughs]` 같은 표현용 대괄호 오디오 태그를 허용합니다. 태그는 보이는 채팅 응답에서는 숨기고 TTS로만 보내려면 `[[tts:text]]...[[/tts:text]]` 블록 안에 넣으세요:

```text
Here is the clean reply text.

[[tts:text]][whispers] Here is the spoken version.[[/tts:text]]
```

<Note>
Gemini API로 제한된 Google Cloud Console API 키는 이 Provider에서 유효합니다. 이는 별도의 Cloud Text-to-Speech API 경로가 아닙니다.
</Note>

## 고급 구성

<AccordionGroup>
  <Accordion title="직접 Gemini 캐시 재사용">
    직접 Gemini API 실행(`api: "google-generative-ai"`)의 경우, OpenClaw는 구성된 `cachedContent` 핸들을 Gemini 요청에 그대로 전달합니다.

    - 모델별 또는 전역 파라미터에 `cachedContent` 또는 레거시 `cached_content`를 사용해 구성할 수 있습니다
    - 둘 다 존재하면 `cachedContent`가 우선합니다
    - 예시 값: `cachedContents/prebuilt-context`
    - Gemini 캐시 적중 사용량은 업스트림 `cachedContentTokenCount`에서 OpenClaw `cacheRead`로 정규화됩니다

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

  <Accordion title="Gemini CLI JSON 사용량 참고">
    `google-gemini-cli` OAuth Provider를 사용할 때 OpenClaw는 CLI JSON 출력을 다음과 같이 정규화합니다:

    - 응답 텍스트는 CLI JSON의 `response` 필드에서 가져옵니다.
    - CLI가 `usage`를 비워둘 경우 사용량은 `stats`로 폴백합니다.
    - `stats.cached`는 OpenClaw `cacheRead`로 정규화됩니다.
    - `stats.input`이 없으면 OpenClaw는 `stats.input_tokens - stats.cached`에서 입력 토큰을 계산합니다.

  </Accordion>

  <Accordion title="환경 및 데몬 설정">
    Gateway가 데몬(launchd/systemd)으로 실행되는 경우 `GEMINI_API_KEY`가 해당 프로세스에서 사용 가능해야 합니다(예: `~/.openclaw/.env` 또는 `env.shellEnv`를 통해).
  </Accordion>
</AccordionGroup>

## 관련 문서

<CardGroup cols={2}>
  <Card title="모델 선택" href="/ko/concepts/model-providers" icon="layers">
    Provider, 모델 ref, failover 동작 선택.
  </Card>
  <Card title="이미지 생성" href="/ko/tools/image-generation" icon="image">
    공유 이미지 도구 파라미터 및 Provider 선택.
  </Card>
  <Card title="비디오 생성" href="/ko/tools/video-generation" icon="video">
    공유 비디오 도구 파라미터 및 Provider 선택.
  </Card>
  <Card title="음악 생성" href="/ko/tools/music-generation" icon="music">
    공유 음악 도구 파라미터 및 Provider 선택.
  </Card>
</CardGroup>
