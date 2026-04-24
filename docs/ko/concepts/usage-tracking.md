---
read_when:
    - Provider 사용량/할당량 표면을 연결하는 중입니다
    - 사용량 추적 동작 또는 인증 요구 사항을 설명해야 합니다
summary: 사용량 추적 표면 및 자격 증명 요구 사항
title: 사용량 추적
x-i18n:
    generated_at: "2026-04-24T06:12:29Z"
    model: gpt-5.4
    provider: openai
    source_hash: 21c2ae0c32d9f28b301abed22d6edcb423d46831cb1d78f4c2908df0ecf82854
    source_path: concepts/usage-tracking.md
    workflow: 15
---

## 개요

- Provider 사용량/할당량을 해당 Provider의 사용량 엔드포인트에서 직접 가져옵니다.
- 비용 추정은 하지 않으며, Provider가 보고한 구간만 사용합니다.
- 사람이 읽기 쉬운 상태 출력은 업스트림 API가 사용한 할당량, 남은 할당량 또는 원시 카운트만 보고하더라도 `X% left` 형식으로 정규화됩니다.
- 세션 수준 `/status`와 `session_status`는 라이브 세션 스냅샷이 부족할 때 최신 전사 사용량 항목으로 폴백할 수 있습니다. 이 폴백은 누락된 토큰/캐시 카운터를 채우고, 활성 런타임 모델 레이블을 복구할 수 있으며, 세션 메타데이터가 없거나 더 작을 경우 더 큰 프롬프트 지향 총계를 우선합니다. 기존의 0이 아닌 라이브 값은 여전히 우선합니다.

## 표시 위치

- 채팅의 `/status`: 세션 토큰 + 예상 비용(API 키 전용)을 포함한 이모지 풍부한 상태 카드. Provider 사용량은 사용 가능한 경우 **현재 모델 Provider**에 대해 정규화된 `X% left` 구간으로 표시됩니다.
- 채팅의 `/usage off|tokens|full`: 응답별 사용량 푸터(OAuth는 토큰만 표시).
- 채팅의 `/usage cost`: OpenClaw 세션 로그에서 집계된 로컬 비용 요약.
- CLI: `openclaw status --usage`는 Provider별 전체 세부 내역을 출력합니다.
- CLI: `openclaw channels list`는 동일한 사용량 스냅샷을 Provider 구성과 함께 출력합니다(`--no-usage`로 건너뛸 수 있음).
- macOS 메뉴 막대: Context 아래의 “Usage” 섹션(사용 가능한 경우에만).

## Provider + 자격 증명

- **Anthropic (Claude)**: auth profile의 OAuth 토큰.
- **GitHub Copilot**: auth profile의 OAuth 토큰.
- **Gemini CLI**: auth profile의 OAuth 토큰.
  - JSON 사용량은 `stats`로 폴백하며, `stats.cached`는 `cacheRead`로 정규화됩니다.
- **OpenAI Codex**: auth profile의 OAuth 토큰(있는 경우 accountId 사용).
- **MiniMax**: API 키 또는 MiniMax OAuth auth profile. OpenClaw는 `minimax`, `minimax-cn`, `minimax-portal`을 동일한 MiniMax 할당량 표면으로 취급하고, 저장된 MiniMax OAuth가 있으면 이를 우선 사용하며, 그렇지 않으면 `MINIMAX_CODE_PLAN_KEY`, `MINIMAX_CODING_API_KEY`, `MINIMAX_API_KEY`로 폴백합니다.
  MiniMax의 원시 `usage_percent` / `usagePercent` 필드는 **남은** 할당량을 의미하므로, OpenClaw는 표시 전에 이를 반전합니다. 카운트 기반 필드가 있으면 그것이 우선합니다.
  - Coding Plan 구간 레이블은 사용 가능한 경우 Provider의 hours/minutes 필드에서 가져오고, 없으면 `start_time` / `end_time` 구간으로 폴백합니다.
  - Coding Plan 엔드포인트가 `model_remains`를 반환하면, OpenClaw는 chat-model 항목을 우선하고, 명시적 `window_hours` / `window_minutes` 필드가 없을 때 타임스탬프에서 구간 레이블을 도출하며, plan 레이블에 모델 이름을 포함합니다.
- **Xiaomi MiMo**: env/config/auth 저장소의 API 키(`XIAOMI_API_KEY`).
- **z.ai**: env/config/auth 저장소의 API 키.

사용 가능한 Provider 사용량 인증 정보를 해석할 수 없으면 사용량은 숨겨집니다. Provider는 Plugin 전용 사용량 인증 로직을 제공할 수 있으며, 그렇지 않으면 OpenClaw는 auth profile, 환경 변수 또는 구성의 일치하는 OAuth/API 키 자격 증명으로 폴백합니다.

## 관련 문서

- [토큰 사용 및 비용](/ko/reference/token-use)
- [API 사용량 및 비용](/ko/reference/api-usage-costs)
- [프롬프트 캐싱](/ko/reference/prompt-caching)
