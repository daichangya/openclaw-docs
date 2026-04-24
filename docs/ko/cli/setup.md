---
read_when:
    - 전체 CLI 온보딩 없이 첫 실행 설정을 진행하고 있습니다
    - 기본 워크스페이스 경로를 설정하려고 합니다
summary: '`openclaw setup`용 CLI 참조(구성 + 워크스페이스 초기화)'
title: 설정
x-i18n:
    generated_at: "2026-04-24T06:08:57Z"
    model: gpt-5.4
    provider: openai
    source_hash: 650b0faf99ef1bc24ec6514661093a9a2ba7edead2e2622b863d51553c44f267
    source_path: cli/setup.md
    workflow: 15
---

# `openclaw setup`

`~/.openclaw/openclaw.json`과 에이전트 워크스페이스를 초기화합니다.

관련 문서:

- 시작하기: [시작하기](/ko/start/getting-started)
- CLI 온보딩: [온보딩 (CLI)](/ko/start/wizard)

## 예시

```bash
openclaw setup
openclaw setup --workspace ~/.openclaw/workspace
openclaw setup --wizard
openclaw setup --non-interactive --mode remote --remote-url wss://gateway-host:18789 --remote-token <token>
```

## 옵션

- `--workspace <dir>`: 에이전트 워크스페이스 디렉터리(`agents.defaults.workspace`로 저장됨)
- `--wizard`: 온보딩 실행
- `--non-interactive`: 프롬프트 없이 온보딩 실행
- `--mode <local|remote>`: 온보딩 모드
- `--remote-url <url>`: 원격 Gateway WebSocket URL
- `--remote-token <token>`: 원격 Gateway 토큰

setup을 통해 온보딩 실행:

```bash
openclaw setup --wizard
```

참고:

- 일반 `openclaw setup`은 전체 온보딩 흐름 없이 구성 + 워크스페이스를 초기화합니다.
- 온보딩 플래그가 하나라도 있으면(`--wizard`, `--non-interactive`, `--mode`, `--remote-url`, `--remote-token`) 온보딩이 자동 실행됩니다.

## 관련 문서

- [CLI 참조](/ko/cli)
- [설치 개요](/ko/install)
