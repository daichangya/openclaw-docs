---
read_when:
    - Pi 통합 코드 또는 테스트 작업하기
    - Pi 전용 lint, 타입 검사, 라이브 테스트 흐름 실행하기
summary: 'Pi 통합을 위한 개발자 워크플로: 빌드, 테스트, 라이브 검증'
title: Pi 개발 워크플로
x-i18n:
    generated_at: "2026-04-24T06:23:31Z"
    model: gpt-5.4
    provider: openai
    source_hash: fb626bf21bc731b8ca7bb2a48692e17c8b93f2b6ffa471ed9e70d9c91cd57149
    source_path: pi-dev.md
    workflow: 15
---

이 가이드는 OpenClaw에서 Pi 통합 작업을 위한 합리적인 워크플로를 요약합니다.

## 타입 검사 및 lint

- 기본 로컬 게이트: `pnpm check`
- 변경이 빌드 출력, 패키징, 또는 지연 로딩/모듈 경계에 영향을 줄 수 있으면 빌드 게이트: `pnpm build`
- Pi 비중이 큰 변경의 전체 랜딩 게이트: `pnpm check && pnpm test`

## Pi 테스트 실행

Vitest로 Pi 중심 테스트 세트를 직접 실행하세요.

```bash
pnpm test \
  "src/agents/pi-*.test.ts" \
  "src/agents/pi-embedded-*.test.ts" \
  "src/agents/pi-tools*.test.ts" \
  "src/agents/pi-settings.test.ts" \
  "src/agents/pi-tool-definition-adapter*.test.ts" \
  "src/agents/pi-hooks/**/*.test.ts"
```

라이브 provider 실행을 포함하려면:

```bash
OPENCLAW_LIVE_TEST=1 pnpm test src/agents/pi-embedded-runner-extraparams.live.test.ts
```

이 명령은 주요 Pi 단위 테스트 스위트를 포함합니다.

- `src/agents/pi-*.test.ts`
- `src/agents/pi-embedded-*.test.ts`
- `src/agents/pi-tools*.test.ts`
- `src/agents/pi-settings.test.ts`
- `src/agents/pi-tool-definition-adapter.test.ts`
- `src/agents/pi-hooks/*.test.ts`

## 수동 테스트

권장 흐름:

- 개발 모드로 gateway 실행:
  - `pnpm gateway:dev`
- 에이전트를 직접 트리거:
  - `pnpm openclaw agent --message "Hello" --thinking low`
- 대화형 디버깅에는 TUI 사용:
  - `pnpm tui`

도구 호출 동작을 보려면 `read` 또는 `exec` 작업을 프롬프트로 요청해 도구 스트리밍과 payload 처리를 확인하세요.

## 깨끗한 초기 상태로 리셋

상태는 OpenClaw 상태 디렉터리 아래에 존재합니다. 기본값은 `~/.openclaw`입니다. `OPENCLAW_STATE_DIR`가 설정되어 있으면 대신 그 디렉터리를 사용하세요.

모든 것을 초기화하려면 다음을 정리하세요.

- 설정용 `openclaw.json`
- 모델 인증 프로필(API 키 + OAuth)용 `agents/<agentId>/agent/auth-profiles.json`
- 여전히 인증 프로필 저장소 밖에 존재하는 provider/채널 상태용 `credentials/`
- 에이전트 세션 기록용 `agents/<agentId>/sessions/`
- 세션 인덱스용 `agents/<agentId>/sessions/sessions.json`
- 레거시 경로가 존재하는 경우 `sessions/`
- 빈 워크스페이스를 원할 경우 `workspace/`

세션만 초기화하고 싶다면 해당 에이전트의 `agents/<agentId>/sessions/`만 삭제하세요. 인증을 유지하고 싶다면 `agents/<agentId>/agent/auth-profiles.json`과 `credentials/` 아래의 provider 상태는 그대로 두세요.

## 참조

- [Testing](/ko/help/testing)
- [Getting Started](/ko/start/getting-started)

## 관련 항목

- [Pi integration architecture](/ko/pi)
