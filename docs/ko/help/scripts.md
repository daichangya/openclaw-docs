---
read_when:
    - 저장소에서 스크립트 실행하기
    - '`./scripts` 아래의 스크립트 추가 또는 변경하기'
summary: '저장소 스크립트: 목적, 범위 및 안전 참고 사항'
title: 스크립트
x-i18n:
    generated_at: "2026-04-24T06:18:34Z"
    model: gpt-5.4
    provider: openai
    source_hash: 8d76777402670abe355b9ad2a0337f96211af1323e36f2ab1ced9f04f87083f5
    source_path: help/scripts.md
    workflow: 15
---

`scripts/` 디렉터리에는 로컬 워크플로와 운영 작업을 위한 헬퍼 스크립트가 들어 있습니다.
작업이 스크립트와 명확히 연결되어 있을 때는 이를 사용하고, 그렇지 않으면 CLI를 우선하세요.

## 규칙

- 스크립트는 문서나 릴리스 체크리스트에서 참조되지 않는 한 **선택 사항**입니다.
- CLI 표면이 있으면 이를 우선하세요(예: 인증 모니터링은 `openclaw models status --check` 사용).
- 스크립트는 호스트별일 수 있다고 가정하고, 새 머신에서 실행하기 전에 읽어보세요.

## 인증 모니터링 스크립트

인증 모니터링은 [인증](/ko/gateway/authentication)에서 다룹니다. `scripts/` 아래의 스크립트는 systemd/Termux 휴대폰 워크플로를 위한 선택적 추가 기능입니다.

## GitHub 읽기 헬퍼

일반적인 `gh`는 개인 로그인으로 쓰기 작업에 그대로 두면서, 저장소 범위 읽기 호출에는 GitHub App 설치 token을 사용하게 하려면 `scripts/gh-read`를 사용하세요.

필수 env:

- `OPENCLAW_GH_READ_APP_ID`
- `OPENCLAW_GH_READ_PRIVATE_KEY_FILE`

선택적 env:

- 저장소 기반 설치 확인을 건너뛰고 싶을 때 `OPENCLAW_GH_READ_INSTALLATION_ID`
- 요청할 읽기 권한 하위 집합을 쉼표로 구분해 재정의할 때 `OPENCLAW_GH_READ_PERMISSIONS`

저장소 확인 순서:

- `gh ... -R owner/repo`
- `GH_REPO`
- `git remote origin`

예시:

- `scripts/gh-read pr view 123`
- `scripts/gh-read run list -R openclaw/openclaw`
- `scripts/gh-read api repos/openclaw/openclaw/pulls/123`

## 스크립트 추가 시

- 스크립트는 집중된 목적을 유지하고 문서화하세요.
- 관련 문서에 짧은 항목을 추가하세요(없으면 새로 만드세요).

## 관련

- [테스팅](/ko/help/testing)
- [라이브 테스팅](/ko/help/testing-live)
