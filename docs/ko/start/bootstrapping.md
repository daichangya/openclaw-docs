---
read_when:
    - 첫 번째 에이전트 실행 시 무엇이 일어나는지 이해하기
    - 부트스트랩 파일이 어디에 있는지 설명하기
    - 온보딩 정체성 설정 디버깅하기
sidebarTitle: Bootstrapping
summary: 워크스페이스와 정체성 파일을 시드하는 에이전트 부트스트랩 의식
title: 에이전트 부트스트랩
x-i18n:
    generated_at: "2026-04-24T06:36:13Z"
    model: gpt-5.4
    provider: openai
    source_hash: 0c23a204a7afbf2ca0c0d19a227286cf0ae396181073403055db41dafa764d2a
    source_path: start/bootstrapping.md
    workflow: 15
---

부트스트랩은 에이전트 워크스페이스를 준비하고
정체성 세부 사항을 수집하는 **첫 실행** 의식입니다. 온보딩 이후,
에이전트가 처음 시작될 때 실행됩니다.

## 부트스트랩이 하는 일

첫 번째 에이전트 실행 시 OpenClaw는 워크스페이스(기본값
`~/.openclaw/workspace`)를 부트스트랩합니다.

- `AGENTS.md`, `BOOTSTRAP.md`, `IDENTITY.md`, `USER.md`를 시드합니다.
- 짧은 Q&A 의식을 실행합니다(한 번에 한 질문씩).
- 정체성과 선호도를 `IDENTITY.md`, `USER.md`, `SOUL.md`에 기록합니다.
- `BOOTSTRAP.md`는 완료되면 제거하여 한 번만 실행되도록 합니다.

## 실행 위치

부트스트랩은 항상 **gateway 호스트**에서 실행됩니다. macOS 앱이
원격 Gateway에 연결하는 경우 워크스페이스와 부트스트랩 파일은 해당 원격
머신에 존재합니다.

<Note>
Gateway가 다른 머신에서 실행 중이라면 워크스페이스 파일은 gateway
호스트에서 편집하세요(예: `user@gateway-host:~/.openclaw/workspace`).
</Note>

## 관련 문서

- macOS 앱 온보딩: [Onboarding](/ko/start/onboarding)
- 워크스페이스 레이아웃: [Agent workspace](/ko/concepts/agent-workspace)
