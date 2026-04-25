---
read_when:
    - 명령 없이 openclaw를 실행했을 때 Crestodian이 무엇인지 이해하고 싶습니다.
    - OpenClaw를 검사하거나 복구할 수 있는 구성 없는 안전한 방법이 필요합니다.
    - 메시지 채널 구조 모드를 설계하거나 활성화하고 있습니다.
summary: Crestodian용 CLI 참조 및 보안 모델, 구성 없는 안전한 설정 및 복구 도우미
title: Crestodian
x-i18n:
    generated_at: "2026-04-25T12:23:23Z"
    model: gpt-5.4
    provider: openai
    source_hash: ebcd6a72f78134fa572a85acc6c2f0381747a27fd6be84269c273390300bb533
    source_path: cli/crestodian.md
    workflow: 15
---

# `openclaw crestodian`

Crestodian은 OpenClaw의 로컬 설정, 복구 및 구성 도우미입니다. 정상적인 에이전트 경로가 손상되었을 때도 접근 가능하도록 설계되었습니다.

명령 없이 `openclaw`를 실행하면 대화형 터미널에서 Crestodian이 시작됩니다.
`openclaw crestodian`을 실행하면 동일한 도우미가 명시적으로 시작됩니다.

## Crestodian이 표시하는 내용

시작 시 대화형 Crestodian은 `openclaw tui`에서 사용하는 것과 동일한 TUI 셸을 Crestodian 채팅 백엔드와 함께 엽니다. 채팅 로그는 짧은 인사말로 시작됩니다.

- Crestodian을 언제 시작해야 하는지
- Crestodian이 실제로 사용 중인 모델 또는 결정적 플래너 경로
- config 유효성 및 기본 에이전트
- 첫 시작 프로브에서 확인한 Gateway 도달 가능성
- Crestodian이 다음에 수행할 수 있는 디버그 작업

시작만을 위해 비밀 정보를 덤프하거나 Plugin CLI 명령을 로드하지는 않습니다. TUI는 여전히 일반적인 헤더, 채팅 로그, 상태 줄, 푸터, 자동 완성 및 편집기 컨트롤을 제공합니다.

config 경로, docs/source 경로, 로컬 CLI 프로브, API 키 존재 여부, 에이전트, 모델 및 Gateway 세부 정보를 포함한 자세한 인벤토리는 `status`를 사용하세요.

Crestodian은 일반 에이전트와 동일한 OpenClaw 참조 검색을 사용합니다. Git 체크아웃에서는 로컬 `docs/` 및 로컬 소스 트리를 가리킵니다. npm 패키지 설치에서는 번들된 패키지 docs를 사용하고
[https://github.com/openclaw/openclaw](https://github.com/openclaw/openclaw)에 연결하며, docs만으로 충분하지 않을 때는 소스를 검토하라는 명시적 안내를 제공합니다.

## 예시

```bash
openclaw
openclaw crestodian
openclaw crestodian --json
openclaw crestodian --message "models"
openclaw crestodian --message "validate config"
openclaw crestodian --message "setup workspace ~/Projects/work model openai/gpt-5.5" --yes
openclaw crestodian --message "set default model openai/gpt-5.5" --yes
openclaw onboard --modern
```

Crestodian TUI 내부:

```text
status
health
doctor
doctor fix
validate config
setup
setup workspace ~/Projects/work model openai/gpt-5.5
config set gateway.port 19001
config set-ref gateway.auth.token env OPENCLAW_GATEWAY_TOKEN
gateway status
restart gateway
agents
create agent work workspace ~/Projects/work
models
set default model openai/gpt-5.5
talk to work agent
talk to agent for ~/Projects/work
audit
quit
```

## 안전한 시작

Crestodian의 시작 경로는 의도적으로 작게 유지됩니다. 다음 경우에도 실행할 수 있습니다.

- `openclaw.json`이 없는 경우
- `openclaw.json`이 유효하지 않은 경우
- Gateway가 중단된 경우
- Plugin 명령 등록을 사용할 수 없는 경우
- 아직 어떤 에이전트도 구성되지 않은 경우

`openclaw --help` 및 `openclaw --version`은 여전히 일반적인 빠른 경로를 사용합니다.
비대화형 `openclaw`는 루트 도움말을 출력하는 대신 짧은 메시지와 함께 종료됩니다. 명령 없는 제품 동작이 Crestodian이기 때문입니다.

## 작업 및 승인

Crestodian은 config를 임시로 편집하는 대신 타입이 지정된 작업을 사용합니다.

읽기 전용 작업은 즉시 실행할 수 있습니다.

- 개요 표시
- 에이전트 나열
- 모델/백엔드 상태 표시
- status 또는 health 검사 실행
- Gateway 도달 가능성 확인
- 대화형 수정 없이 doctor 실행
- config 검증
- audit 로그 경로 표시

영구 작업은 직접 명령에 `--yes`를 전달하지 않는 한 대화형 모드에서 대화형 승인이 필요합니다.

- config 쓰기
- `config set` 실행
- `config set-ref`를 통해 지원되는 SecretRef 값 설정
- 설정/온보딩 부트스트랩 실행
- 기본 모델 변경
- Gateway 시작, 중지 또는 재시작
- 에이전트 생성
- config 또는 상태를 다시 쓰는 doctor 복구 실행

적용된 쓰기 작업은 다음에 기록됩니다.

```text
~/.openclaw/audit/crestodian.jsonl
```

검색 작업은 감사되지 않습니다. 적용된 작업 및 쓰기만 로그에 기록됩니다.

`openclaw onboard --modern`은 최신 온보딩 미리 보기로 Crestodian을 시작합니다.
일반 `openclaw onboard`는 여전히 기존 온보딩을 실행합니다.

## 설정 부트스트랩

`setup`은 채팅 우선 온보딩 부트스트랩입니다. 타입이 지정된 config 작업을 통해서만 기록하며 먼저 승인을 요청합니다.

```text
setup
setup workspace ~/Projects/work
setup workspace ~/Projects/work model openai/gpt-5.5
```

모델이 구성되지 않은 경우 setup은 다음 순서대로 첫 번째로 사용 가능한 백엔드를 선택하고 무엇을 선택했는지 알려줍니다.

- 이미 구성된 경우 기존 명시적 모델
- `OPENAI_API_KEY` -> `openai/gpt-5.5`
- `ANTHROPIC_API_KEY` -> `anthropic/claude-opus-4-7`
- Claude Code CLI -> `claude-cli/claude-opus-4-7`
- Codex CLI -> `codex-cli/gpt-5.5`

사용 가능한 항목이 없더라도 setup은 기본 워크스페이스를 계속 기록하고 모델은 설정하지 않은 상태로 둡니다. Codex/Claude Code를 설치하거나 로그인하거나 `OPENAI_API_KEY`/`ANTHROPIC_API_KEY`를 노출한 다음 setup을 다시 실행하세요.

## 모델 지원 플래너

Crestodian은 항상 결정적 모드로 시작됩니다. 결정적 파서가 이해하지 못하는 모호한 명령의 경우, 로컬 Crestodian은 OpenClaw의 일반 런타임 경로를 통해 제한된 플래너 턴을 한 번 수행할 수 있습니다. 먼저 구성된 OpenClaw 모델을 사용합니다. 아직 사용 가능한 구성된 모델이 없다면 머신에 이미 있는 로컬 런타임으로 대체할 수 있습니다.

- Claude Code CLI: `claude-cli/claude-opus-4-7`
- Codex app-server harness: `openai/gpt-5.5` with `embeddedHarness.runtime: "codex"`
- Codex CLI: `codex-cli/gpt-5.5`

모델 지원 플래너는 config를 직접 변경할 수 없습니다. 요청을 Crestodian의 타입이 지정된 명령 중 하나로 변환해야 하며, 그다음 일반 승인 및 감사 규칙이 적용됩니다. Crestodian은 무엇이든 실행하기 전에 사용한 모델과 해석된 명령을 출력합니다. 구성 없는 대체 플래너 턴은 임시적이며, 런타임이 지원하는 경우 도구가 비활성화되고, 임시 워크스페이스/세션을 사용합니다.

메시지 채널 구조 모드는 모델 지원 플래너를 사용하지 않습니다. 원격 구조는 결정적으로 유지되므로 손상되었거나 침해된 정상 에이전트 경로가 config 편집기로 사용될 수 없습니다.

## 에이전트로 전환

자연어 선택기를 사용하여 Crestodian을 떠나 일반 TUI를 여세요.

```text
talk to agent
talk to work agent
switch to main agent
```

`openclaw tui`, `openclaw chat`, `openclaw terminal`은 여전히 일반 에이전트 TUI를 직접 엽니다. Crestodian을 시작하지 않습니다.

일반 TUI로 전환한 후 `/crestodian`을 사용해 Crestodian으로 돌아가세요.
후속 요청을 포함할 수 있습니다.

```text
/crestodian
/crestodian restart gateway
```

TUI 내부의 에이전트 전환은 `/crestodian`을 사용할 수 있다는 표시를 남깁니다.

## 메시지 구조 모드

메시지 구조 모드는 Crestodian용 메시지 채널 진입점입니다. 정상 에이전트는 죽었지만 WhatsApp 같은 신뢰할 수 있는 채널은 여전히 명령을 수신하는 경우를 위한 기능입니다.

지원되는 텍스트 명령:

- `/crestodian <request>`

운영자 흐름:

```text
You, in a trusted owner DM: /crestodian status
OpenClaw: Crestodian rescue mode. Gateway reachable: no. Config valid: no.
You: /crestodian restart gateway
OpenClaw: Plan: restart the Gateway. Reply /crestodian yes to apply.
You: /crestodian yes
OpenClaw: Applied. Audit entry written.
```

에이전트 생성은 로컬 프롬프트 또는 구조 모드에서도 대기열에 넣을 수 있습니다.

```text
create agent work workspace ~/Projects/work model openai/gpt-5.5
/crestodian create agent work workspace ~/Projects/work
```

원격 구조 모드는 관리자 표면입니다. 일반 채팅처럼 다루지 말고 원격 config 복구처럼 취급해야 합니다.

원격 구조를 위한 보안 계약:

- sandboxing이 활성 상태이면 비활성화됩니다. 에이전트/세션이 샌드박스 처리된 경우 Crestodian은 원격 구조를 거부하고 로컬 CLI 복구가 필요하다고 설명해야 합니다.
- 기본 유효 상태는 `auto`입니다. 런타임에 이미 샌드박스 없는 로컬 권한이 있는 신뢰된 YOLO 작업에서만 원격 구조를 허용합니다.
- 명시적인 소유자 신원이 필요합니다. 구조는 와일드카드 발신자 규칙, 열린 그룹 정책, 인증되지 않은 Webhook 또는 익명 채널을 허용해서는 안 됩니다.
- 기본적으로 소유자 DM만 허용합니다. 그룹/채널 구조는 명시적 옵트인이 필요하며 승인 프롬프트도 여전히 소유자 DM으로 라우팅해야 합니다.
- 원격 구조는 로컬 TUI를 열거나 대화형 에이전트 세션으로 전환할 수 없습니다. 에이전트 핸드오프에는 로컬 `openclaw`를 사용하세요.
- 영구 쓰기에는 구조 모드에서도 여전히 승인이 필요합니다.
- 채널, 계정, 발신자, 세션 키, 작업, 이전 config 해시, 이후 config 해시를 포함해 적용된 모든 구조 작업을 감사하세요.
- 비밀 정보를 절대 그대로 출력하지 마세요. SecretRef 검사는 값이 아니라 사용 가능 여부를 보고해야 합니다.
- Gateway가 살아 있으면 Gateway 타입이 지정된 작업을 우선 사용하세요. Gateway가 죽어 있으면 정상 에이전트 루프에 의존하지 않는 최소한의 로컬 복구 표면만 사용하세요.

config 형태:

```jsonc
{
  "crestodian": {
    "rescue": {
      "enabled": "auto",
      "ownerDmOnly": true,
    },
  },
}
```

`enabled`는 다음을 허용해야 합니다.

- `"auto"`: 기본값. 유효 런타임이 YOLO이고 sandboxing이 꺼져 있을 때만 허용합니다.
- `false`: 메시지 채널 구조를 절대 허용하지 않습니다.
- `true`: 소유자/채널 검사를 통과하면 구조를 명시적으로 허용합니다. 그래도 sandboxing 거부를 우회해서는 안 됩니다.

기본 `"auto"` YOLO 자세는 다음과 같습니다.

- sandbox mode가 `off`로 해석됨
- `tools.exec.security`가 `full`로 해석됨
- `tools.exec.ask`가 `off`로 해석됨

원격 구조는 다음 Docker lane에서 다룹니다.

```bash
pnpm test:docker:crestodian-rescue
```

구성 없는 로컬 플래너 대체는 다음에서 다룹니다.

```bash
pnpm test:docker:crestodian-planner
```

옵트인 라이브 채널 명령 표면 스모크 테스트는 `/crestodian status`와 구조 핸들러를 통한 영구 승인 왕복을 함께 확인합니다.

```bash
pnpm test:live:crestodian-rescue-channel
```

Crestodian을 통한 새 구성 없는 설정은 다음에서 다룹니다.

```bash
pnpm test:docker:crestodian-first-run
```

이 lane은 빈 상태 디렉터리에서 시작하여, 기본 `openclaw`를 Crestodian으로 라우팅하고, 기본 모델을 설정하고, 추가 에이전트를 생성하고, Plugin 활성화 및 토큰 SecretRef를 통해 Discord를 구성하고, config를 검증하고, audit 로그를 확인합니다. QA Lab에도 동일한 Ring 0 흐름을 위한 repo 기반 시나리오가 있습니다.

```bash
pnpm openclaw qa suite --scenario crestodian-ring-zero-setup
```

## 관련 항목

- [CLI 참조](/ko/cli)
- [Doctor](/ko/cli/doctor)
- [TUI](/ko/cli/tui)
- [Sandbox](/ko/cli/sandbox)
- [보안](/ko/cli/security)
