---
read_when:
    - 명시적인 승인이 포함된 결정론적 다단계 워크플로를 원하시는 것입니다
    - 이전 단계를 다시 실행하지 않고 워크플로를 재개해야 합니다
summary: 재개 가능한 승인 게이트를 갖춘 OpenClaw용 타입드 워크플로 런타임.
title: Lobster
x-i18n:
    generated_at: "2026-04-24T06:40:57Z"
    model: gpt-5.4
    provider: openai
    source_hash: ce1dbd73cc90091d02862af183a2f8658d6cbe6623c100baf7992b5e18041edb
    source_path: tools/lobster.md
    workflow: 15
---

Lobster는 OpenClaw가 명시적인 승인 체크포인트와 함께 다단계 도구 시퀀스를 하나의 결정론적 작업으로 실행할 수 있게 해주는 워크플로 셸입니다.

Lobster는 분리된 백그라운드 작업보다 한 단계 위의 작성 계층입니다. 개별 작업 위의 흐름 오케스트레이션은 [TaskFlow](/ko/automation/taskflow) (`openclaw tasks flow`)를 참조하세요. 작업 활동 원장은 [`openclaw tasks`](/ko/automation/tasks)를 참조하세요.

## Hook

어시스턴트가 스스로를 관리하는 도구를 만들 수 있습니다. 워크플로를 요청하면 30분 뒤에는 하나의 호출로 실행되는 CLI와 파이프라인이 생깁니다. Lobster가 빠져 있던 조각입니다: 결정론적 파이프라인, 명시적 승인, 재개 가능한 상태.

## 왜 필요한가

오늘날 복잡한 워크플로는 많은 왕복 도구 호출이 필요합니다. 각 호출은 토큰 비용을 발생시키고, LLM은 모든 단계를 오케스트레이션해야 합니다. Lobster는 그 오케스트레이션을 타입이 있는 런타임으로 옮깁니다:

- **여러 번 대신 한 번 호출**: OpenClaw는 Lobster 도구 호출 하나를 실행하고 구조화된 결과를 받습니다.
- **승인 내장**: 부작용(이메일 전송, 댓글 게시)은 명시적으로 승인될 때까지 워크플로를 중단합니다.
- **재개 가능**: 중단된 워크플로는 토큰을 반환하며, 모든 것을 다시 실행하지 않고 승인 후 재개할 수 있습니다.

## 일반 프로그램 대신 DSL인 이유

Lobster는 의도적으로 작습니다. 목표는 “새 언어”가 아니라, 승인과 재개 토큰이 일급 요소인 예측 가능하고 AI 친화적인 파이프라인 사양입니다.

- **승인/재개가 내장됨**: 일반 프로그램도 사람에게 프롬프트를 줄 수는 있지만, 자체 런타임을 발명하지 않고서는 지속적인 토큰으로 _중단 후 재개_할 수 없습니다.
- **결정론 + 감사 가능성**: 파이프라인은 데이터이므로 로그, diff, 재생, 검토가 쉽습니다.
- **AI를 위한 제한된 표면**: 작은 문법 + JSON 파이핑은 “창의적인” 코드 경로를 줄이고 검증을 현실적으로 만듭니다.
- **안전 정책 내장**: 타임아웃, 출력 상한, 샌드박스 검사, allowlist는 각 스크립트가 아니라 런타임에서 강제됩니다.
- **여전히 프로그래밍 가능**: 각 단계는 어떤 CLI나 스크립트든 호출할 수 있습니다. JS/TS를 원한다면 코드에서 `.lobster` 파일을 생성하면 됩니다.

## 작동 방식

OpenClaw는 내장 runner를 사용해 Lobster 워크플로를 **프로세스 내에서** 실행합니다. 외부 CLI subprocess는 생성되지 않으며, 워크플로 엔진은 gateway 프로세스 내부에서 실행되어 JSON envelope를 직접 반환합니다.
파이프라인이 승인 때문에 중단되면, 도구는 나중에 계속할 수 있도록 `resumeToken`을 반환합니다.

## 패턴: 작은 CLI + JSON 파이프 + 승인

JSON을 말하는 작은 명령을 만든 다음, 이를 하나의 Lobster 호출로 체인하세요. (아래 예시 명령 이름은 예시일 뿐입니다 — 여러분의 것으로 바꾸세요.)

```bash
inbox list --json
inbox categorize --json
inbox apply --json
```

```json
{
  "action": "run",
  "pipeline": "exec --json --shell 'inbox list --json' | exec --stdin json --shell 'inbox categorize --json' | exec --stdin json --shell 'inbox apply --json' | approve --preview-from-stdin --limit 5 --prompt 'Apply changes?'",
  "timeoutMs": 30000
}
```

파이프라인이 승인을 요청하면 토큰으로 재개하세요:

```json
{
  "action": "resume",
  "token": "<resumeToken>",
  "approve": true
}
```

AI가 워크플로를 트리거하고, Lobster가 단계를 실행합니다. 승인 게이트는 부작용을 명시적이고 감사 가능하게 유지합니다.

예시: 입력 항목을 도구 호출로 매핑:

```bash
gog.gmail.search --query 'newer_than:1d' \
  | openclaw.invoke --tool message --action send --each --item-key message --args-json '{"provider":"telegram","to":"..."}'
```

## JSON 전용 LLM 단계 (llm-task)

워크플로에 **구조화된 LLM 단계**가 필요하다면 선택적
`llm-task` Plugin 도구를 활성화하고 Lobster에서 호출하세요. 이렇게 하면 워크플로를
결정론적으로 유지하면서도 모델로 분류/요약/초안 작성을 할 수 있습니다.

도구 활성화:

```json
{
  "plugins": {
    "entries": {
      "llm-task": { "enabled": true }
    }
  },
  "agents": {
    "list": [
      {
        "id": "main",
        "tools": { "allow": ["llm-task"] }
      }
    ]
  }
}
```

파이프라인에서 사용:

```lobster
openclaw.invoke --tool llm-task --action json --args-json '{
  "prompt": "Given the input email, return intent and draft.",
  "thinking": "low",
  "input": { "subject": "Hello", "body": "Can you help?" },
  "schema": {
    "type": "object",
    "properties": {
      "intent": { "type": "string" },
      "draft": { "type": "string" }
    },
    "required": ["intent", "draft"],
    "additionalProperties": false
  }
}'
```

자세한 내용과 구성 옵션은 [LLM Task](/ko/tools/llm-task)를 참조하세요.

## 워크플로 파일 (.lobster)

Lobster는 `name`, `args`, `steps`, `env`, `condition`, `approval` 필드를 가진 YAML/JSON 워크플로 파일을 실행할 수 있습니다. OpenClaw 도구 호출에서는 `pipeline`을 파일 경로로 설정하세요.

```yaml
name: inbox-triage
args:
  tag:
    default: "family"
steps:
  - id: collect
    command: inbox list --json
  - id: categorize
    command: inbox categorize --json
    stdin: $collect.stdout
  - id: approve
    command: inbox apply --approve
    stdin: $categorize.stdout
    approval: required
  - id: execute
    command: inbox apply --execute
    stdin: $categorize.stdout
    condition: $approve.approved
```

참고:

- `stdin: $step.stdout`와 `stdin: $step.json`은 이전 단계의 출력을 전달합니다.
- `condition`(또는 `when`)은 `$step.approved`에 따라 단계를 게이트할 수 있습니다.

## Lobster 설치

번들 Lobster 워크플로는 프로세스 내에서 실행되므로 별도의 `lobster` 바이너리가 필요하지 않습니다. 내장 runner는 Lobster Plugin과 함께 제공됩니다.

개발이나 외부 파이프라인을 위해 독립 실행형 Lobster CLI가 필요하다면 [Lobster 리포지토리](https://github.com/openclaw/lobster)에서 설치하고 `lobster`가 `PATH`에 있도록 하세요.

## 도구 활성화

Lobster는 **선택적** Plugin 도구입니다(기본적으로 활성화되지 않음).

권장 방식(추가적이고 안전함):

```json
{
  "tools": {
    "alsoAllow": ["lobster"]
  }
}
```

또는 에이전트별로:

```json
{
  "agents": {
    "list": [
      {
        "id": "main",
        "tools": {
          "alsoAllow": ["lobster"]
        }
      }
    ]
  }
}
```

제한적 allowlist 모드로 실행할 의도가 아니라면 `tools.allow: ["lobster"]` 사용은 피하세요.

참고: allowlist는 선택적 Plugin에 대해서만 옵트인입니다. allowlist가
`lobster` 같은 Plugin 도구만 이름으로 지정하면 OpenClaw는 코어 도구를 계속 활성화합니다. 코어
도구를 제한하려면 원하는 코어 도구 또는 그룹도 allowlist에 포함하세요.

## 예시: 이메일 분류

Lobster 없이:

```text
사용자: "내 이메일을 확인하고 답장을 초안 작성해 줘"
→ openclaw가 gmail.list 호출
→ LLM이 요약
→ 사용자: "#2와 #5에 대한 답장을 초안 작성해 줘"
→ LLM이 초안 작성
→ 사용자: "#2를 보내"
→ openclaw가 gmail.send 호출
(매일 반복, 무엇이 분류되었는지에 대한 기억 없음)
```

Lobster 사용 시:

```json
{
  "action": "run",
  "pipeline": "email.triage --limit 20",
  "timeoutMs": 30000
}
```

반환되는 JSON envelope (일부 생략):

```json
{
  "ok": true,
  "status": "needs_approval",
  "output": [{ "summary": "5 need replies, 2 need action" }],
  "requiresApproval": {
    "type": "approval_request",
    "prompt": "Send 2 draft replies?",
    "items": [],
    "resumeToken": "..."
  }
}
```

사용자가 승인 → 재개:

```json
{
  "action": "resume",
  "token": "<resumeToken>",
  "approve": true
}
```

하나의 워크플로. 결정론적. 안전함.

## 도구 매개변수

### `run`

도구 모드로 파이프라인 실행.

```json
{
  "action": "run",
  "pipeline": "gog.gmail.search --query 'newer_than:1d' | email.triage",
  "cwd": "workspace",
  "timeoutMs": 30000,
  "maxStdoutBytes": 512000
}
```

인수가 있는 워크플로 파일 실행:

```json
{
  "action": "run",
  "pipeline": "/path/to/inbox-triage.lobster",
  "argsJson": "{\"tag\":\"family\"}"
}
```

### `resume`

승인 후 중단된 워크플로 계속하기.

```json
{
  "action": "resume",
  "token": "<resumeToken>",
  "approve": true
}
```

### 선택적 입력

- `cwd`: 파이프라인용 상대 작업 디렉터리(gateway 작업 디렉터리 내부여야 함)
- `timeoutMs`: 워크플로가 이 시간을 초과하면 중단(기본값: 20000)
- `maxStdoutBytes`: 출력이 이 크기를 초과하면 중단(기본값: 512000)
- `argsJson`: `lobster run --args-json`에 전달되는 JSON 문자열(워크플로 파일 전용)

## 출력 envelope

Lobster는 다음 세 가지 상태 중 하나를 가진 JSON envelope를 반환합니다:

- `ok` → 성공적으로 완료
- `needs_approval` → 일시 중지됨; 재개하려면 `requiresApproval.resumeToken`이 필요함
- `cancelled` → 명시적으로 거부되었거나 취소됨

도구는 `content`(보기 좋은 JSON)와 `details`(원시 객체) 모두에 envelope를 노출합니다.

## 승인

`requiresApproval`이 있으면 프롬프트를 확인하고 다음 중 하나를 결정하세요:

- `approve: true` → 재개하고 부작용 계속 진행
- `approve: false` → 워크플로 취소 및 종료

사용자 정의 jq/heredoc glue 없이 JSON 미리보기를 승인 요청에 붙이려면 `approve --preview-from-stdin --limit N`을 사용하세요. resume token은 이제 더 작습니다. Lobster가 워크플로 재개 상태를 state dir 아래에 저장하고 작은 토큰 키를 돌려줍니다.

## OpenProse

OpenProse는 Lobster와 잘 어울립니다: `/prose`를 사용해 멀티 에이전트 준비를 오케스트레이션한 다음, 결정론적 승인을 위해 Lobster 파이프라인을 실행하세요. Prose 프로그램이 Lobster를 필요로 한다면 `tools.subagents.tools`를 통해 서브에이전트에 `lobster` 도구를 허용하세요. [OpenProse](/ko/prose)를 참조하세요.

## 안전성

- **로컬 프로세스 내 전용** — 워크플로는 gateway 프로세스 내부에서 실행되며, Plugin 자체에서 네트워크 호출을 하지 않습니다.
- **secret 없음** — Lobster는 OAuth를 관리하지 않으며, 이를 관리하는 OpenClaw 도구를 호출합니다.
- **샌드박스 인식** — 도구 컨텍스트가 샌드박스인 경우 비활성화됩니다.
- **강화됨** — 내장 runner가 타임아웃과 출력 상한을 강제합니다.

## 문제 해결

- **`lobster timed out`** → `timeoutMs`를 늘리거나 긴 파이프라인을 분할하세요.
- **`lobster output exceeded maxStdoutBytes`** → `maxStdoutBytes`를 늘리거나 출력 크기를 줄이세요.
- **`lobster returned invalid JSON`** → 파이프라인이 도구 모드에서 실행되며 JSON만 출력하는지 확인하세요.
- **`lobster failed`** → 내장 runner 오류 세부 정보는 gateway 로그를 확인하세요.

## 더 알아보기

- [Plugins](/ko/tools/plugin)
- [Plugin 도구 작성](/ko/plugins/building-plugins#registering-agent-tools)

## 사례 연구: 커뮤니티 워크플로

한 가지 공개 예시: 세 개의 Markdown vault(개인, 파트너, 공유)를 관리하는 “second brain” CLI + Lobster 파이프라인입니다. CLI는 통계, inbox 목록, stale scan용 JSON을 내보내고, Lobster는 이러한 명령을 `weekly-review`, `inbox-triage`, `memory-consolidation`, `shared-task-sync` 같은 워크플로로 체인하며 각각 승인 게이트를 둡니다. AI는 가능할 때 판단(분류)을 담당하고, 가능하지 않을 때는 결정론적 규칙으로 폴백합니다.

- 스레드: [https://x.com/plattenschieber/status/2014508656335770033](https://x.com/plattenschieber/status/2014508656335770033)
- 리포지토리: [https://github.com/bloomedai/brain-cli](https://github.com/bloomedai/brain-cli)

## 관련

- [자동화 및 작업](/ko/automation) — Lobster 워크플로 예약
- [자동화 개요](/ko/automation) — 모든 자동화 메커니즘
- [도구 개요](/ko/tools) — 사용 가능한 모든 agent 도구
