---
read_when:
    - 오디오 전사 또는 미디어 처리를 변경하는 중입니다.
summary: 인바운드 오디오/음성 노트가 다운로드되고, 전사되며, 답글에 주입되는 방식
title: 오디오 및 음성 노트
x-i18n:
    generated_at: "2026-04-24T06:22:29Z"
    model: gpt-5.4
    provider: openai
    source_hash: 464b569c97715e483c4bfc8074d2775965a0635149e0933c8e5b5d9c29d34269
    source_path: nodes/audio.md
    workflow: 15
---

# 오디오 / 음성 노트 (2026-01-17)

## 동작하는 것

- **미디어 이해(오디오)**: 오디오 이해가 활성화되어 있거나 자동 감지되면 OpenClaw는 다음을 수행합니다.
  1. 첫 번째 오디오 첨부를 찾고(로컬 경로 또는 URL), 필요하면 다운로드합니다.
  2. 각 모델 항목에 보내기 전에 `maxBytes`를 강제합니다.
  3. 순서대로 첫 번째 적격 모델 항목(provider 또는 CLI)을 실행합니다.
  4. 실패하거나 건너뛰면(크기/타임아웃) 다음 항목을 시도합니다.
  5. 성공하면 `Body`를 `[Audio]` 블록으로 교체하고 `{{Transcript}}`를 설정합니다.
- **명령어 파싱**: 전사에 성공하면 `CommandBody`/`RawBody`가 전사문으로 설정되므로 슬래시 명령어가 계속 동작합니다.
- **상세 로깅**: `--verbose`에서는 전사가 실행될 때와 body를 교체할 때를 로그에 기록합니다.

## 자동 감지(기본값)

**모델을 구성하지 않았고** `tools.media.audio.enabled`가 **`false`로 설정되지 않은 경우**,
OpenClaw는 다음 순서로 자동 감지하고 첫 번째로 동작하는 옵션에서 멈춥니다.

1. provider가 오디오 이해를 지원하는 경우 **활성 답글 모델**
2. **로컬 CLI**(설치되어 있는 경우)
   - `sherpa-onnx-offline` (`SHERPA_ONNX_MODEL_DIR`에 encoder/decoder/joiner/tokens 필요)
   - `whisper-cli` (`whisper-cpp`에서 제공, `WHISPER_CPP_MODEL` 또는 번들 tiny 모델 사용)
   - `whisper` (Python CLI, 모델 자동 다운로드)
3. `read_many_files`를 사용하는 **Gemini CLI** (`gemini`)
4. **provider 인증**
   - 오디오를 지원하는 구성된 `models.providers.*` 항목이 먼저 시도됩니다.
   - 번들 대체 순서: OpenAI → Groq → Deepgram → Google → Mistral

자동 감지를 비활성화하려면 `tools.media.audio.enabled: false`를 설정하세요.
커스터마이즈하려면 `tools.media.audio.models`를 설정하세요.
참고: 바이너리 감지는 macOS/Linux/Windows 전반에서 best-effort 방식입니다. CLI가 `PATH`에 있어야 하며(`~`는 확장됨), 또는 전체 명령 경로를 포함한 명시적 CLI 모델을 설정하세요.

## config 예시

### Provider + CLI 대체(OpenAI + Whisper CLI)

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

### 범위 게이팅이 있는 provider 전용

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

### provider 전용(Deepgram)

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

### provider 전용(Mistral Voxtral)

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

### 대화에 전사문 에코(옵트인)

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

- provider 인증은 표준 모델 인증 순서(auth 프로필, env vars, `models.providers.*.apiKey`)를 따릅니다.
- Groq 설정 세부 정보: [Groq](/ko/providers/groq)
- `provider: "deepgram"`을 사용하면 Deepgram은 `DEEPGRAM_API_KEY`를 읽어옵니다.
- Deepgram 설정 세부 정보: [Deepgram (오디오 전사)](/ko/providers/deepgram)
- Mistral 설정 세부 정보: [Mistral](/ko/providers/mistral)
- 오디오 provider는 `tools.media.audio`를 통해 `baseUrl`, `headers`, `providerOptions`를 재정의할 수 있습니다.
- 기본 크기 제한은 20MB(`tools.media.audio.maxBytes`)입니다. 초과 크기 오디오는 해당 모델에서 건너뛰고 다음 항목이 시도됩니다.
- 1024바이트 미만의 아주 작거나 빈 오디오 파일은 provider/CLI 전사 전에 건너뜁니다.
- 오디오용 기본 `maxChars`는 **미설정**(전체 전사문)입니다. 출력을 자르려면 `tools.media.audio.maxChars` 또는 항목별 `maxChars`를 설정하세요.
- OpenAI 자동 기본값은 `gpt-4o-mini-transcribe`입니다. 더 높은 정확도가 필요하면 `model: "gpt-4o-transcribe"`를 설정하세요.
- 여러 음성 노트를 처리하려면 `tools.media.audio.attachments`를 사용하세요(`mode: "all"` + `maxAttachments`).
- 전사문은 템플릿에서 `{{Transcript}}`로 사용할 수 있습니다.
- `tools.media.audio.echoTranscript`는 기본적으로 꺼져 있습니다. 에이전트 처리 전에 원래 채팅으로 전사 확인을 다시 보내려면 활성화하세요.
- `tools.media.audio.echoFormat`은 에코 텍스트를 커스터마이즈합니다(플레이스홀더: `{transcript}`).
- CLI stdout은 5MB로 제한되므로, CLI 출력은 간결하게 유지하세요.

### 프록시 환경 지원

provider 기반 오디오 전사는 표준 아웃바운드 프록시 env 변수를 따릅니다.

- `HTTPS_PROXY`
- `HTTP_PROXY`
- `https_proxy`
- `http_proxy`

프록시 env 변수가 설정되지 않으면 직접 egress를 사용합니다. 프록시 config 형식이 잘못되면 OpenClaw는 경고를 로그에 남기고 직접 fetch로 대체합니다.

## 그룹에서의 멘션 감지

그룹 채팅에 `requireMention: true`가 설정되어 있으면 OpenClaw는 이제 멘션 확인 **전에** 오디오를 전사합니다. 이렇게 하면 멘션이 포함된 음성 노트도 처리할 수 있습니다.

**작동 방식:**

1. 음성 메시지에 텍스트 본문이 없고 그룹에서 멘션이 필요하면, OpenClaw는 "preflight" 전사를 수행합니다.
2. 전사문에서 멘션 패턴(예: `@BotName`, 이모지 트리거)을 검사합니다.
3. 멘션이 발견되면 메시지는 전체 답글 파이프라인으로 진행합니다.
4. 음성 노트가 멘션 게이트를 통과할 수 있도록 전사문이 멘션 감지에 사용됩니다.

**대체 동작:**

- preflight 중 전사가 실패하면(타임아웃, API 오류 등) 메시지는 텍스트 전용 멘션 감지를 기준으로 처리됩니다.
- 이렇게 하면 혼합 메시지(텍스트 + 오디오)가 잘못 드롭되지 않습니다.

**Telegram 그룹/토픽별 옵트아웃:**

- 해당 그룹의 preflight 전사 멘션 검사를 건너뛰려면 `channels.telegram.groups.<chatId>.disableAudioPreflight: true`를 설정하세요.
- 토픽별 재정의를 위해 `channels.telegram.groups.<chatId>.topics.<threadId>.disableAudioPreflight`를 설정하세요(`true`면 건너뜀, `false`면 강제 활성화).
- 기본값은 `false`입니다(멘션 게이트 조건이 일치하면 preflight 활성화).

**예시:** 사용자가 `requireMention: true`인 Telegram 그룹에서 "Hey @Claude, what's the weather?"라고 말하는 음성 노트를 보냅니다. 음성 노트가 전사되고, 멘션이 감지되며, 에이전트가 답글합니다.

## 주의할 점

- 범위 규칙은 첫 일치 우선입니다. `chatType`은 `direct`, `group`, `room`으로 정규화됩니다.
- CLI가 종료 코드 0으로 끝나고 일반 텍스트를 출력하는지 확인하세요. JSON은 `jq -r .text`로 정리해야 합니다.
- `parakeet-mlx`의 경우 `--output-dir`를 전달하면 `--output-format`이 `txt`이거나 생략되었을 때 OpenClaw는 `<output-dir>/<media-basename>.txt`를 읽습니다. `txt`가 아닌 출력 형식은 stdout 파싱으로 대체됩니다.
- 답글 큐를 막지 않도록 타임아웃(`timeoutSeconds`, 기본값 60초)은 적절하게 유지하세요.
- preflight 전사는 멘션 감지를 위해 **첫 번째** 오디오 첨부만 처리합니다. 추가 오디오는 메인 미디어 이해 단계에서 처리됩니다.

## 관련 항목

- [미디어 이해](/ko/nodes/media-understanding)
- [Talk 모드](/ko/nodes/talk)
- [Voice wake](/ko/nodes/voicewake)
