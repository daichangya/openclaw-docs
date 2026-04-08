---
read_when:
    - API 제공자가 실패할 때 신뢰할 수 있는 대체 수단을 원할 때
    - Codex CLI 또는 다른 로컬 AI CLI를 실행 중이며 이를 재사용하고 싶을 때
    - CLI 백엔드 도구 접근을 위한 MCP 루프백 브리지를 이해하고 싶을 때
summary: 선택적 MCP 도구 브리지와 함께 사용하는 로컬 AI CLI 대체용 CLI 백엔드
title: CLI 백엔드
x-i18n:
    generated_at: "2026-04-08T02:14:36Z"
    model: gpt-5.4
    provider: openai
    source_hash: b0e8c41f5f5a8e34466f6b765e5c08585ef1788fa9e9d953257324bcc6cbc414
    source_path: gateway/cli-backends.md
    workflow: 15
---

# CLI 백엔드 (대체 런타임)

OpenClaw는 API 제공자가 중단되거나,
속도 제한에 걸리거나, 일시적으로 오작동할 때 **텍스트 전용 대체 수단**으로 **로컬 AI CLI**를 실행할 수 있습니다. 이는 의도적으로 보수적으로 설계되었습니다:

- `bundleMcp: true`가 설정된 백엔드는 루프백 MCP 브리지를 통해 gateway 도구를 받을 수 있지만, **OpenClaw 도구가 직접 주입되지는 않습니다**.
- 이를 지원하는 CLI에 대해 **JSONL 스트리밍**을 지원합니다.
- **세션이 지원되므로** 후속 턴도 일관성을 유지합니다.
- CLI가 이미지 경로를 받는다면 **이미지를 전달할 수 있습니다**.

이 기능은 기본 경로라기보다 **안전망**으로 설계되었습니다. 외부 API에 의존하지 않고
“항상 동작하는” 텍스트 응답이 필요할 때 사용하세요.

ACP 세션 제어, 백그라운드 작업,
스레드/대화 바인딩, 영구적인 외부 코딩 세션을 갖춘 전체 하네스 런타임이 필요하다면
대신 [ACP Agents](/ko/tools/acp-agents)를 사용하세요. CLI 백엔드는 ACP가 아닙니다.

## 초보자용 빠른 시작

Codex CLI는 **아무 설정 없이도** 사용할 수 있습니다(번들된 OpenAI plugin이
기본 백엔드를 등록합니다):

```bash
openclaw agent --message "hi" --model codex-cli/gpt-5.4
```

gateway가 launchd/systemd 아래에서 실행되고 PATH가 최소화되어 있다면,
명령 경로만 추가하세요:

```json5
{
  agents: {
    defaults: {
      cliBackends: {
        "codex-cli": {
          command: "/opt/homebrew/bin/codex",
        },
      },
    },
  },
}
```

이것으로 끝입니다. CLI 자체 외에 별도의 키나 추가 인증 설정은 필요하지 않습니다.

gateway 호스트에서 번들된 CLI 백엔드를 **기본 메시지 제공자**로 사용하는 경우,
이제 OpenClaw는 설정이 모델 ref 또는
`agents.defaults.cliBackends` 아래에서 해당 백엔드를 명시적으로 참조하면 소유 번들 plugin을 자동으로 로드합니다.

## 대체 수단으로 사용하기

CLI 백엔드를 대체 목록에 추가하면 기본 모델이 실패할 때만 실행됩니다:

```json5
{
  agents: {
    defaults: {
      model: {
        primary: "anthropic/claude-opus-4-6",
        fallbacks: ["codex-cli/gpt-5.4"],
      },
      models: {
        "anthropic/claude-opus-4-6": { alias: "Opus" },
        "codex-cli/gpt-5.4": {},
      },
    },
  },
}
```

참고:

- `agents.defaults.models`(허용 목록)을 사용하는 경우 CLI 백엔드 모델도 여기에 포함해야 합니다.
- 기본 제공자가 실패하면(인증, 속도 제한, 타임아웃), OpenClaw가
  다음으로 CLI 백엔드를 시도합니다.

## 설정 개요

모든 CLI 백엔드는 다음 아래에 있습니다:

```
agents.defaults.cliBackends
```

각 항목은 **provider id**(예: `codex-cli`, `my-cli`)로 키 지정됩니다.
provider id는 모델 ref의 왼쪽 부분이 됩니다:

```
<provider>/<model>
```

### 설정 예시

```json5
{
  agents: {
    defaults: {
      cliBackends: {
        "codex-cli": {
          command: "/opt/homebrew/bin/codex",
        },
        "my-cli": {
          command: "my-cli",
          args: ["--json"],
          output: "json",
          input: "arg",
          modelArg: "--model",
          modelAliases: {
            "claude-opus-4-6": "opus",
            "claude-sonnet-4-6": "sonnet",
          },
          sessionArg: "--session",
          sessionMode: "existing",
          sessionIdFields: ["session_id", "conversation_id"],
          systemPromptArg: "--system",
          systemPromptWhen: "first",
          imageArg: "--image",
          imageMode: "repeat",
          serialize: true,
        },
      },
    },
  },
}
```

## 동작 방식

1. provider 접두사(`codex-cli/...`)를 기준으로 **백엔드를 선택합니다**.
2. 동일한 OpenClaw 프롬프트 + 워크스페이스 컨텍스트를 사용해 **시스템 프롬프트를 구성합니다**.
3. 기록의 일관성을 유지하기 위해 지원되는 경우 세션 id와 함께 **CLI를 실행합니다**.
4. 출력을 **파싱**(JSON 또는 일반 텍스트)하고 최종 텍스트를 반환합니다.
5. 후속 요청이 동일한 CLI 세션을 재사용할 수 있도록 백엔드별 **세션 id를 저장합니다**.

<Note>
번들된 Anthropic `claude-cli` 백엔드가 다시 지원됩니다. Anthropic 직원이
OpenClaw 스타일의 Claude CLI 사용이 다시 허용된다고 알려주었기 때문에, Anthropic이
새 정책을 발표하지 않는 한 OpenClaw는 이 통합에 대해
`claude -p` 사용을 허용된 것으로 간주합니다.
</Note>

## 세션

- CLI가 세션을 지원하면 `sessionArg`(예: `--session-id`) 또는
  세션 ID를 여러 플래그에 삽입해야 할 때 `sessionArgs`(플레이스홀더 `{sessionId}`)를 설정하세요.
- CLI가 다른 플래그를 사용하는 **resume 하위 명령**을 사용한다면,
  `resumeArgs`(`resuming` 시 `args`를 대체)와 필요하다면 `resumeOutput`
  (JSON이 아닌 resume용)을 설정하세요.
- `sessionMode`:
  - `always`: 항상 세션 id를 전송합니다(저장된 값이 없으면 새 UUID 사용).
  - `existing`: 이전에 저장된 세션 id가 있을 때만 전송합니다.
  - `none`: 세션 id를 절대 전송하지 않습니다.

직렬화 관련 참고:

- `serialize: true`는 동일 레인 실행의 순서를 유지합니다.
- 대부분의 CLI는 하나의 provider 레인에서 직렬화됩니다.
- OpenClaw는 재로그인, 토큰 교체, 또는 변경된 인증 프로필 자격 증명을 포함해 백엔드 인증 상태가 바뀌면 저장된 CLI 세션 재사용을 중단합니다.

## 이미지(전달)

CLI가 이미지 경로를 받을 수 있다면 `imageArg`를 설정하세요:

```json5
imageArg: "--image",
imageMode: "repeat"
```

OpenClaw는 base64 이미지를 임시 파일에 씁니다. `imageArg`가 설정되어 있으면 해당
경로가 CLI 인수로 전달됩니다. `imageArg`가 없으면 OpenClaw는
파일 경로를 프롬프트에 추가합니다(경로 주입). 이는 일반 경로에서 로컬 파일을 자동으로
로드하는 CLI에는 충분합니다.

## 입력 / 출력

- `output: "json"`(기본값)은 JSON을 파싱하고 텍스트 + 세션 id를 추출하려고 시도합니다.
- Gemini CLI JSON 출력의 경우, `usage`가 없거나 비어 있으면 OpenClaw는
  `response`에서 응답 텍스트를, `stats`에서 사용량을 읽습니다.
- `output: "jsonl"`은 JSONL 스트림(예: Codex CLI `--json`)을 파싱하고, 존재할 경우 최종 에이전트 메시지와 세션
  식별자를 추출합니다.
- `output: "text"`는 stdout을 최종 응답으로 처리합니다.

입력 모드:

- `input: "arg"`(기본값)는 프롬프트를 마지막 CLI 인수로 전달합니다.
- `input: "stdin"`은 프롬프트를 stdin으로 보냅니다.
- 프롬프트가 매우 길고 `maxPromptArgChars`가 설정되어 있으면 stdin이 사용됩니다.

## 기본값(plugin 소유)

번들된 OpenAI plugin은 `codex-cli`에 대한 기본값도 등록합니다:

- `command: "codex"`
- `args: ["exec","--json","--color","never","--sandbox","workspace-write","--skip-git-repo-check"]`
- `resumeArgs: ["exec","resume","{sessionId}","--color","never","--sandbox","workspace-write","--skip-git-repo-check"]`
- `output: "jsonl"`
- `resumeOutput: "text"`
- `modelArg: "--model"`
- `imageArg: "--image"`
- `sessionMode: "existing"`

번들된 Google plugin도 `google-gemini-cli`에 대한 기본값을 등록합니다:

- `command: "gemini"`
- `args: ["--output-format", "json", "--prompt", "{prompt}"]`
- `resumeArgs: ["--resume", "{sessionId}", "--output-format", "json", "--prompt", "{prompt}"]`
- `imageArg: "@"`
- `imagePathScope: "workspace"`
- `modelArg: "--model"`
- `sessionMode: "existing"`
- `sessionIdFields: ["session_id", "sessionId"]`

전제 조건: 로컬 Gemini CLI가 설치되어 있어야 하며
`PATH`에서 `gemini`로 사용할 수 있어야 합니다(`brew install gemini-cli` 또는
`npm install -g @google/gemini-cli`).

Gemini CLI JSON 관련 참고:

- 응답 텍스트는 JSON `response` 필드에서 읽습니다.
- `usage`가 없거나 비어 있으면 사용량은 `stats`로 대체됩니다.
- `stats.cached`는 OpenClaw `cacheRead`로 정규화됩니다.
- `stats.input`이 없으면 OpenClaw는
  `stats.input_tokens - stats.cached`에서 입력 토큰 수를 계산합니다.

필요한 경우에만 덮어쓰세요(일반적으로 절대 `command` 경로).

## plugin 소유 기본값

이제 CLI 백엔드 기본값은 plugin 표면의 일부입니다:

- plugin은 `api.registerCliBackend(...)`로 이를 등록합니다.
- 백엔드 `id`는 모델 ref의 provider 접두사가 됩니다.
- `agents.defaults.cliBackends.<id>` 아래의 사용자 설정은 여전히 plugin 기본값을 덮어씁니다.
- 백엔드별 설정 정리는 선택적 `normalizeConfig` 훅을 통해 계속 plugin 소유로 유지됩니다.

## Bundle MCP 오버레이

CLI 백엔드는 **OpenClaw 도구 호출을 직접 받지 않지만**, 백엔드는
`bundleMcp: true`로 생성된 MCP 설정 오버레이를 선택적으로 사용할 수 있습니다.

현재 번들 동작:

- `claude-cli`: 생성된 엄격한 MCP 설정 파일
- `codex-cli`: `mcp_servers`용 인라인 설정 오버라이드
- `google-gemini-cli`: 생성된 Gemini 시스템 설정 파일

bundle MCP가 활성화되면 OpenClaw는 다음을 수행합니다:

- CLI 프로세스에 gateway 도구를 노출하는 루프백 HTTP MCP 서버를 시작합니다
- 세션별 토큰(`OPENCLAW_MCP_TOKEN`)으로 브리지를 인증합니다
- 도구 접근 범위를 현재 세션, 계정, 채널 컨텍스트로 제한합니다
- 현재 워크스페이스에 대해 활성화된 bundle-MCP 서버를 로드합니다
- 이를 기존 백엔드 MCP 설정/설정 형태와 병합합니다
- 소유 extension의 백엔드 소유 통합 모드를 사용해 실행 설정을 다시 작성합니다

활성화된 MCP 서버가 없더라도, 백엔드가 bundle MCP를 선택한 경우 OpenClaw는
백그라운드 실행이 격리된 상태를 유지하도록 여전히 엄격한 설정을 주입합니다.

## 제한 사항

- **직접적인 OpenClaw 도구 호출은 없습니다.** OpenClaw는
  CLI 백엔드 프로토콜에 도구 호출을 주입하지 않습니다. 백엔드는
  `bundleMcp: true`를 선택한 경우에만 gateway 도구를 볼 수 있습니다.
- **스트리밍은 백엔드마다 다릅니다.** 일부 백엔드는 JSONL을 스트리밍하고, 다른 백엔드는
  종료 시점까지 버퍼링합니다.
- **구조화된 출력**은 CLI의 JSON 형식에 따라 달라집니다.
- **Codex CLI 세션**은 텍스트 출력으로 resume되며(JSONL 아님),
  이는 초기 `--json` 실행보다 구조화가 덜 되어 있습니다. OpenClaw 세션은 여전히
  정상적으로 동작합니다.

## 문제 해결

- **CLI를 찾을 수 없음**: `command`를 전체 경로로 설정하세요.
- **잘못된 모델 이름**: `modelAliases`를 사용해 `provider/model` → CLI 모델로 매핑하세요.
- **세션 연속성 없음**: `sessionArg`가 설정되어 있고 `sessionMode`가
  `none`이 아닌지 확인하세요(Codex CLI는 현재 JSON 출력으로 resume할 수 없습니다).
- **이미지가 무시됨**: `imageArg`를 설정하고(그리고 CLI가 파일 경로를 지원하는지 확인하세요).
