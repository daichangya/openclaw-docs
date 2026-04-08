---
read_when:
    - 리포지토리에서 스크립트를 실행할 때
    - '`./scripts` 아래의 스크립트를 추가하거나 변경할 때'
summary: '리포지토리 스크립트: 용도, 범위, 안전 관련 참고 사항'
title: 스크립트
x-i18n:
    generated_at: "2026-04-08T02:15:45Z"
    model: gpt-5.4
    provider: openai
    source_hash: 3ecf1e9327929948fb75f80e306963af49b353c0aa8d3b6fa532ca964ff8b975
    source_path: help/scripts.md
    workflow: 15
---

# 스크립트

`scripts/` 디렉터리에는 로컬 워크플로와 운영 작업을 위한 도우미 스크립트가 들어 있습니다.
작업이 스크립트와 명확하게 연결되어 있을 때 사용하고, 그렇지 않으면 CLI를 우선하세요.

## 규칙

- 스크립트는 문서나 릴리스 체크리스트에서 참조되지 않는 한 **선택 사항**입니다.
- 가능한 경우 CLI 표면을 우선하세요(예: 인증 모니터링은 `openclaw models status --check` 사용).
- 스크립트는 호스트별일 수 있다고 가정하고, 새 머신에서 실행하기 전에 내용을 읽어보세요.

## 인증 모니터링 스크립트

인증 모니터링은 [Authentication](/ko/gateway/authentication)에서 다룹니다. `scripts/` 아래 스크립트는 systemd/Termux 휴대폰 워크플로를 위한 선택적 추가 도구입니다.

## GitHub 읽기 도우미

일반 `gh`는 쓰기 작업에 개인 로그인 상태로 유지하면서, 리포지토리 범위 읽기 호출에 GitHub App 설치 토큰을 사용하려면 `scripts/gh-read`를 사용하세요.

필수 env:

- `OPENCLAW_GH_READ_APP_ID`
- `OPENCLAW_GH_READ_PRIVATE_KEY_FILE`

선택적 env:

- 리포지토리 기반 설치 조회를 건너뛰려면 `OPENCLAW_GH_READ_INSTALLATION_ID`
- 요청할 읽기 권한 하위 집합을 쉼표로 구분해 override하려면 `OPENCLAW_GH_READ_PERMISSIONS`

리포지토리 확인 순서:

- `gh ... -R owner/repo`
- `GH_REPO`
- `git remote origin`

예시:

- `scripts/gh-read pr view 123`
- `scripts/gh-read run list -R openclaw/openclaw`
- `scripts/gh-read api repos/openclaw/openclaw/pulls/123`

## 스크립트를 추가할 때

- 스크립트는 집중된 목적을 가지게 하고 문서화하세요.
- 관련 문서에 짧은 항목을 추가하세요(없다면 새로 만드세요).
