---
read_when:
    - 오디오 전사 또는 미디어 처리를 변경하는 것
summary: 인바운드 오디오/음성 노트가 다운로드되고, 전사되며, 답장에 주입되는 방식
title: 오디오 및 음성 노트
x-i18n:
    generated_at: "2026-04-25T12:27:11Z"
    model: gpt-5.4
    provider: openai
    source_hash: cc48787be480fbd19d26f18ac42a15108be89104e6aa56e60a94bd62b1b0cba0
    source_path: nodes/audio.md
    workflow: 15
---

# 오디오 / 음성 노트 (2026-01-17)

## 작동하는 항목

- **미디어 이해(오디오)**: 오디오 이해가 활성화되어 있거나 자동 감지되면 OpenClaw는 다음을 수행합니다.
  1. 첫 번째 오디오 첨부파일(로컬 경로 또는 URL)을 찾고, 필요하면 다운로드합니다.
  2. 각 모델 항목에 전송하기 전에 `maxBytes`를 적용합니다.
  3. 순서대로 첫 번째 적격 모델 항목(provider 또는 CLI)을 실행합니다.
  4. 실패하거나 건너뛰면(크기/시간 초과) 다음 항목을 시도합니다.
  5. 성공하면 `Body`를 `[Audio]` 블록으로 대체하고 `{{Transcript}}`를 설정합니다.
- **명령 파싱**: 전사에 성공하면 `CommandBody`/`RawBody`가 전사문으로 설정되므로 슬래시 명령이 계속 동작합니다.
- **상세 로깅**: `--verbose`에서는 전사가 실행되는 시점과 본문을 대체하는 시점을 기록합니다.

## 자동 감지(기본값)

**모델을 구성하지 않았고** `tools.media.audio.enabled`가 `false`로 설정되지 않은 경우,
OpenClaw는 다음 순서로 자동 감지하고 첫 번째로 동작하는 옵션에서 멈춥니다.

1. provider가 오디오 이해를 지원하는 경우 **활성 응답 모델**
2. **로컬 CLI**(설치된 경우)
   - `sherpa-onnx-offline` (`SHERPA_ONNX_MODEL_DIR` 필요, encoder/decoder/joiner/tokens 포함)
   - `whisper-cli` (`whisper-cpp`에서 제공, `WHISPER_CPP_MODEL` 또는 번들 tiny 모델 사용)
   - `whisper` (Python CLI, 모델 자동 다운로드)
3. `read_many_files`를 사용하는 **Gemini CLI** (`gemini`)
4. **Provider 인증**
   - 오디오를 지원하는 구성된 `models.providers.*` 항목을 먼저 시도합니다
   - 번들 대체 순서: OpenAI → Groq → xAI → Deepgram → Google → SenseAudio → ElevenLabs → Mistral

자동 감지를 비활성화하려면 `tools.media.audio.enabled: false`를 설정하세요.
사용자 정의하려면 `tools.media.audio.models`를 설정하세요.
참고: 바이너리 감지는 macOS/Linux/Windows 전반에서 최선의 노력으로 수행됩니다. CLI가 `PATH`에 있어야 하며(`~`는 확장됨), 또는 전체 명령 경로를 포함한 명시적 CLI 모델을 설정하세요.

## config 예시

### Provider + CLI 대체 경로(OpenAI + Whisper CLI)

```json5
{
  tools: {
    media: {
      audio: {
        enabled: true,
        maxBytes: 20971520,
        models: [
          { provider: "openai", model: "gpt-4o-mini-transcribe" },
          {
            type: "cli",
            command: "whisper",
            args: ["--model", "base", "{{MediaPath}}"],
            timeoutSeconds: 45,
          },
        ],
      },
    },
  },
}
```

### 범위 제한이 있는 Provider 전용

```json5
{
  tools: {
    media: {
      audio: {
        enabled: true,
        scope: {
          default: "allow",
          rules: [{ action: "deny", match: { chatType: "group" } }],
        },
        models: [{ provider: "openai", model: "gpt-4o-mini-transcribe" }],
      },
    },
  },
}
```

### Provider 전용(Deepgram)

```json5
{
  tools: {
    media: {
      audio: {
        enabled: true,
        models: [{ provider: "deepgram", model: "nova-3" }],
      },
    },
  },
}
```

### Provider 전용(Mistral Voxtral)

```json5
{
  tools: {
    media: {
      audio: {
        enabled: true,
        models: [{ provider: "mistral", model: "voxtral-mini-latest" }],
      },
    },
  },
}
```

### Provider 전용(SenseAudio)

```json5
{
  tools: {
    media: {
      audio: {
        enabled: true,
        models: [{ provider: "senseaudio", model: "senseaudio-asr-pro-1.5-260319" }],
      },
    },
  },
}
```

### 채팅에 전사문 에코(옵트인)

```json5
{
  tools: {
    media: {
      audio: {
        enabled: true,
        echoTranscript: true, // 기본값은 false
        echoFormat: '📝 "{transcript}"', // 선택 사항, {transcript} 지원
        models: [{ provider: "openai", model: "gpt-4o-mini-transcribe" }],
      },
    },
  },
}
```

## 참고 및 제한 사항

- Provider 인증은 표준 모델 인증 순서(auth profile, env vars, `models.providers.*.apiKey`)를 따릅니다.
- Groq 설정 세부 정보: [Groq](/ko/providers/groq)
- `provider: "deepgram"`을 사용하면 Deepgram은 `DEEPGRAM_API_KEY`를 자동으로 사용합니다.
- Deepgram 설정 세부 정보: [Deepgram (audio transcription)](/ko/providers/deepgram)
- Mistral 설정 세부 정보: [Mistral](/ko/providers/mistral)
- `provider: "senseaudio"`를 사용하면 SenseAudio는 `SENSEAUDIO_API_KEY`를 자동으로 사용합니다.
- SenseAudio 설정 세부 정보: [SenseAudio](/ko/providers/senseaudio)
- 오디오 provider는 `tools.media.audio`를 통해 `baseUrl`, `headers`, `providerOptions`를 override할 수 있습니다.
- 기본 크기 제한은 20MB(`tools.media.audio.maxBytes`)입니다. 너무 큰 오디오는 해당 모델에서 건너뛰고 다음 항목을 시도합니다.
- 1024바이트 미만의 아주 작거나 비어 있는 오디오 파일은 provider/CLI 전사 전에 건너뜁니다.
- 오디오의 기본 `maxChars`는 **설정되지 않음**(전체 전사문)입니다. 출력을 잘라내려면 `tools.media.audio.maxChars` 또는 항목별 `maxChars`를 설정하세요.
- OpenAI 자동 기본값은 `gpt-4o-mini-transcribe`이며, 더 높은 정확도를 원하면 `model: "gpt-4o-transcribe"`를 설정하세요.
- 여러 음성 노트를 처리하려면 `tools.media.audio.attachments`를 사용하세요(`mode: "all"` + `maxAttachments`).
- 전사문은 템플릿에서 `{{Transcript}}`로 사용할 수 있습니다.
- `tools.media.audio.echoTranscript`는 기본적으로 꺼져 있습니다. 원래 채팅에 전사 확인을 에이전트 처리 전에 다시 보내려면 활성화하세요.
- `tools.media.audio.echoFormat`은 에코 텍스트를 사용자 정의합니다(플레이스홀더: `{transcript}`).
- CLI stdout은 5MB로 제한되므로, CLI 출력은 간결하게 유지하세요.

### 프록시 환경 지원

Provider 기반 오디오 전사는 표준 아웃바운드 프록시 env var를 준수합니다.

- `HTTPS_PROXY`
- `HTTP_PROXY`
- `https_proxy`
- `http_proxy`

프록시 env var가 설정되지 않으면 직접 이그레스를 사용합니다. 프록시 구성이 잘못되면 OpenClaw는 경고를 기록하고 직접 가져오기로 대체합니다.

## 그룹에서의 멘션 감지

그룹 채팅에 `requireMention: true`가 설정된 경우, OpenClaw는 이제 멘션을 확인하기 **전에** 오디오를 전사합니다. 이를 통해 음성 노트에 멘션이 포함된 경우에도 처리할 수 있습니다.

**작동 방식:**

1. 음성 메시지에 텍스트 본문이 없고 그룹에 멘션 요구 사항이 있는 경우, OpenClaw는 “사전 검사(preflight)” 전사를 수행합니다.
2. 전사문에서 멘션 패턴(예: `@BotName`, 이모지 트리거)을 확인합니다.
3. 멘션이 발견되면 메시지는 전체 응답 파이프라인을 통해 진행됩니다.
4. 음성 노트가 멘션 게이트를 통과할 수 있도록 멘션 감지에 전사문이 사용됩니다.

**대체 동작:**

- 사전 검사 중 전사가 실패하면(시간 초과, API 오류 등), 메시지는 텍스트 전용 멘션 감지를 기준으로 처리됩니다.
- 이렇게 하면 혼합 메시지(텍스트 + 오디오)가 잘못 삭제되지 않도록 보장합니다.

**Telegram 그룹/토픽별 옵트아웃:**

- 해당 그룹의 사전 전사 멘션 검사를 건너뛰려면 `channels.telegram.groups.<chatId>.disableAudioPreflight: true`를 설정하세요.
- 토픽별 override에는 `channels.telegram.groups.<chatId>.topics.<threadId>.disableAudioPreflight`를 설정하세요(`true`면 건너뜀, `false`면 강제 활성화).
- 기본값은 `false`입니다(멘션 게이트 조건이 맞을 때 사전 검사 활성화).

**예시:** 사용자가 `requireMention: true`가 설정된 Telegram 그룹에서 "Hey @Claude, what's the weather?"라고 말하는 음성 노트를 보냅니다. 음성 노트가 전사되고, 멘션이 감지되며, 에이전트가 답장합니다.

## 주의할 점

- 범위 규칙은 먼저 일치한 항목이 우선합니다. `chatType`은 `direct`, `group`, `room`으로 정규화됩니다.
- CLI가 0으로 종료되고 일반 텍스트를 출력하는지 확인하세요. JSON은 `jq -r .text`를 통해 가공해야 합니다.
- `parakeet-mlx`의 경우 `--output-dir`을 전달하면, `--output-format`이 `txt`이거나 생략된 경우 OpenClaw는 `<output-dir>/<media-basename>.txt`를 읽습니다. `txt`가 아닌 출력 형식은 stdout 파싱으로 대체됩니다.
- 응답 큐를 막지 않도록 시간 초과(`timeoutSeconds`, 기본값 60초)는 합리적으로 유지하세요.
- 사전 전사는 멘션 감지를 위해 **첫 번째** 오디오 첨부파일만 처리합니다. 추가 오디오는 주요 미디어 이해 단계에서 처리됩니다.

## 관련 항목

- [Media understanding](/ko/nodes/media-understanding)
- [Talk mode](/ko/nodes/talk)
- [Voice wake](/ko/nodes/voicewake)
