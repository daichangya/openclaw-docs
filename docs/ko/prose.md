---
read_when:
    - '`.prose` 워크플로를 실행하거나 작성하려고 합니다.'
    - OpenProse Plugin을 활성화하려고 합니다.
    - 상태 저장 방식을 이해해야 합니다.
summary: 'OpenProse: OpenClaw의 `.prose` 워크플로, 슬래시 명령어 및 상태'
title: OpenProse
x-i18n:
    generated_at: "2026-04-24T06:29:34Z"
    model: gpt-5.4
    provider: openai
    source_hash: e1d6f3aa64c403daedaeaa2d7934b8474c0756fe09eed09efd1efeef62413e9e
    source_path: prose.md
    workflow: 15
---

OpenProse는 AI 세션을 오케스트레이션하기 위한 이식 가능한 markdown 우선 워크플로 형식입니다. OpenClaw에서는 OpenProse skill pack과 `/prose` 슬래시 명령어를 설치하는 Plugin으로 제공됩니다. 프로그램은 `.prose` 파일에 저장되며, 명시적인 제어 흐름으로 여러 하위 에이전트를 spawn할 수 있습니다.

공식 사이트: [https://www.prose.md](https://www.prose.md)

## 할 수 있는 일

- 명시적 병렬성을 가진 멀티 에이전트 연구 + 종합
- 반복 가능한 승인 안전 워크플로(코드 리뷰, 사고 분류, 콘텐츠 파이프라인)
- 지원되는 에이전트 런타임 전반에서 실행할 수 있는 재사용 가능한 `.prose` 프로그램

## 설치 + 활성화

번들 Plugins는 기본적으로 비활성화되어 있습니다. OpenProse를 활성화하세요.

```bash
openclaw plugins enable open-prose
```

Plugin을 활성화한 후 Gateway를 다시 시작하세요.

개발/로컬 체크아웃: `openclaw plugins install ./path/to/local/open-prose-plugin`

관련 문서: [Plugins](/ko/tools/plugin), [Plugin manifest](/ko/plugins/manifest), [Skills](/ko/tools/skills)

## 슬래시 명령어

OpenProse는 사용자 호출 가능한 skill 명령어로 `/prose`를 등록합니다. 이 명령은 OpenProse VM 지침으로 라우팅되며 내부적으로 OpenClaw 도구를 사용합니다.

일반적인 명령:

```
/prose help
/prose run <file.prose>
/prose run <handle/slug>
/prose run <https://example.com/file.prose>
/prose compile <file.prose>
/prose examples
/prose update
```

## 예시: 간단한 `.prose` 파일

```prose
# Research + synthesis with two agents running in parallel.

input topic: "What should we research?"

agent researcher:
  model: sonnet
  prompt: "You research thoroughly and cite sources."

agent writer:
  model: opus
  prompt: "You write a concise summary."

parallel:
  findings = session: researcher
    prompt: "Research {topic}."
  draft = session: writer
    prompt: "Summarize {topic}."

session "Merge the findings + draft into a final answer."
context: { findings, draft }
```

## 파일 위치

OpenProse는 workspace의 `.prose/` 아래에 상태를 저장합니다.

```
.prose/
├── .env
├── runs/
│   └── {YYYYMMDD}-{HHMMSS}-{random}/
│       ├── program.prose
│       ├── state.md
│       ├── bindings/
│       └── agents/
└── agents/
```

사용자 수준 영구 에이전트는 다음 위치에 있습니다.

```
~/.prose/agents/
```

## 상태 모드

OpenProse는 여러 상태 백엔드를 지원합니다.

- **filesystem** (기본값): `.prose/runs/...`
- **in-context**: 작은 프로그램용 일시적 모드
- **sqlite** (실험적): `sqlite3` 바이너리 필요
- **postgres** (실험적): `psql`과 연결 문자열 필요

참고:

- sqlite/postgres는 옵트인 방식이며 실험적입니다.
- postgres 자격 증명은 하위 에이전트 로그로 흘러들어갑니다. 전용 최소 권한 DB를 사용하세요.

## 원격 프로그램

`/prose run <handle/slug>`는 `https://p.prose.md/<handle>/<slug>`로 확인됩니다.
직접 URL은 있는 그대로 fetch됩니다. 이는 `web_fetch` 도구(또는 POST용 `exec`)를 사용합니다.

## OpenClaw 런타임 매핑

OpenProse 프로그램은 OpenClaw 기본 요소에 매핑됩니다.

| OpenProse 개념            | OpenClaw 도구    |
| ------------------------- | ---------------- |
| 세션 생성 / Task 도구     | `sessions_spawn` |
| 파일 읽기/쓰기            | `read` / `write` |
| 웹 fetch                  | `web_fetch`      |

도구 allowlist가 이 도구들을 차단하면 OpenProse 프로그램은 실패합니다. [Skills config](/ko/tools/skills-config)를 참조하세요.

## 보안 + 승인

`.prose` 파일은 코드처럼 취급하세요. 실행 전에 검토하세요. 부작용을 제어하려면 OpenClaw 도구 allowlist와 승인 게이트를 사용하세요.

결정론적이고 승인 게이트가 적용된 워크플로가 필요하다면 [Lobster](/ko/tools/lobster)와 비교해 보세요.

## 관련 항목

- [텍스트 음성 변환](/ko/tools/tts)
- [Markdown 서식](/ko/concepts/markdown-formatting)
