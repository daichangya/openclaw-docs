---
read_when:
    - 워크스페이스에 새 사용자 지정 Skill을 만드는 경우
    - '`SKILL.md` 기반 Skills를 위한 빠른 시작 워크플로가 필요한 경우'
summary: '`SKILL.md`로 사용자 지정 워크스페이스 Skills 빌드 및 테스트하기'
title: Skills 만들기
x-i18n:
    generated_at: "2026-04-24T06:39:02Z"
    model: gpt-5.4
    provider: openai
    source_hash: df9249e14936c65143580a6618679cf2d79a2960390e5c7afc5dbea1a9a6e045
    source_path: tools/creating-skills.md
    workflow: 15
---

Skills는 에이전트에게 도구를 어떻게, 언제 사용해야 하는지 가르칩니다. 각 Skill은 YAML frontmatter와 markdown 지침이 들어 있는 `SKILL.md` 파일을 포함한 디렉터리입니다.

Skills가 어떻게 로드되고 우선순위가 정해지는지는 [Skills](/ko/tools/skills)를 참조하세요.

## 첫 Skill 만들기

<Steps>
  <Step title="Skill 디렉터리 만들기">
    Skills는 워크스페이스에 위치합니다. 새 폴더를 만드세요.

    ```bash
    mkdir -p ~/.openclaw/workspace/skills/hello-world
    ```

  </Step>

  <Step title="SKILL.md 작성">
    해당 디렉터리 안에 `SKILL.md`를 만드세요. frontmatter는 메타데이터를 정의하고,
    markdown 본문은 에이전트용 지침을 담습니다.

    ```markdown
    ---
    name: hello_world
    description: A simple skill that says hello.
    ---

    # Hello World Skill

    When the user asks for a greeting, use the `echo` tool to say
    "Hello from your custom skill!".
    ```

  </Step>

  <Step title="도구 추가(선택 사항)">
    frontmatter에 사용자 지정 도구 스키마를 정의하거나, 에이전트가
    기존 시스템 도구(`exec` 또는 `browser` 등)를 사용하도록 지시할 수 있습니다. Skills는 이를 설명하는 도구와 함께 Plugin 내부에 포함될 수도 있습니다.

  </Step>

  <Step title="Skill 로드">
    OpenClaw가 Skill을 인식하도록 새 세션을 시작하세요.

    ```bash
    # From chat
    /new

    # Or restart the gateway
    openclaw gateway restart
    ```

    Skill이 로드되었는지 확인:

    ```bash
    openclaw skills list
    ```

  </Step>

  <Step title="테스트">
    Skill이 트리거되어야 하는 메시지를 보내세요.

    ```bash
    openclaw agent --message "give me a greeting"
    ```

    또는 그냥 에이전트와 채팅하며 인사를 요청하세요.

  </Step>
</Steps>

## Skill 메타데이터 참조

YAML frontmatter는 다음 필드를 지원합니다.

| 필드 | 필수 | 설명 |
| ----------------------------------- | -------- | ------------------------------------------- |
| `name` | 예 | 고유 식별자(`snake_case`) |
| `description` | 예 | 에이전트에게 표시되는 한 줄 설명 |
| `metadata.openclaw.os` | 아니요 | OS 필터(`["darwin"]`, `["linux"]` 등) |
| `metadata.openclaw.requires.bins` | 아니요 | PATH에 있어야 하는 필수 바이너리 |
| `metadata.openclaw.requires.config` | 아니요 | 필요한 설정 키 |

## 모범 사례

- **간결하게 작성하세요** — 모델에게 AI처럼 행동하는 법이 아니라 _무엇을_ 해야 하는지를 지시하세요
- **안전 우선** — Skill이 `exec`를 사용한다면, 신뢰할 수 없는 입력에서 임의 명령 주입이 가능하지 않도록 하세요
- **로컬에서 테스트하세요** — 공유 전에 `openclaw agent --message "..."`로 테스트하세요
- **ClawHub 사용** — [ClawHub](https://clawhub.ai)에서 Skills를 탐색하고 기여하세요

## Skills 위치

| 위치 | 우선순위 | 범위 |
| ------------------------------- | ---------- | --------------------- |
| `\<workspace\>/skills/` | 가장 높음 | 에이전트별 |
| `\<workspace\>/.agents/skills/` | 높음 | 워크스페이스별 에이전트 |
| `~/.agents/skills/` | 중간 | 공유 에이전트 프로필 |
| `~/.openclaw/skills/` | 중간 | 공유(모든 에이전트) |
| 번들(OpenClaw와 함께 제공) | 낮음 | 전역 |
| `skills.load.extraDirs` | 가장 낮음 | 사용자 지정 공유 폴더 |

## 관련 항목

- [Skills reference](/ko/tools/skills) — 로딩, 우선순위, 게이팅 규칙
- [Skills config](/ko/tools/skills-config) — `skills.*` 설정 스키마
- [ClawHub](/ko/tools/clawhub) — 공개 Skill 레지스트리
- [Building Plugins](/ko/plugins/building-plugins) — Plugin도 Skills를 포함할 수 있음
