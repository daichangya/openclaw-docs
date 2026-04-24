---
read_when:
    - 토큰 사용량, 비용 또는 컨텍스트 윈도 설명하기
    - 컨텍스트 증가 또는 Compaction 동작 디버깅하기
summary: OpenClaw가 프롬프트 컨텍스트를 구성하고 토큰 사용량과 비용을 보고하는 방식
title: 토큰 사용 및 비용
x-i18n:
    generated_at: "2026-04-24T06:35:56Z"
    model: gpt-5.4
    provider: openai
    source_hash: 4a95e7592a06bd750c0bfc9303d8cec2a538756e95f35c3001dc960cfebcadbf
    source_path: reference/token-use.md
    workflow: 15
---

# 토큰 사용 및 비용

OpenClaw는 문자 수가 아니라 **토큰**을 추적합니다. 토큰은 모델마다 다르지만,
대부분의 OpenAI 스타일 모델은 영어 텍스트에서 평균적으로 토큰당 약 4문자입니다.

## 시스템 프롬프트가 구성되는 방식

OpenClaw는 매 실행마다 자체 시스템 프롬프트를 구성합니다. 여기에는 다음이 포함됩니다:

- 도구 목록 + 짧은 설명
- Skills 목록(메타데이터만; 지시는 필요할 때 `read`로 로드됨).
  압축된 skills 블록은 `skills.limits.maxSkillsPromptChars`로 제한되며,
  에이전트별 재정의는
  `agents.list[].skillsLimits.maxSkillsPromptChars`에 둘 수 있습니다.
- 자기 업데이트 지시
- 워크스페이스 + bootstrap 파일 (`AGENTS.md`, `SOUL.md`, `TOOLS.md`, `IDENTITY.md`, `USER.md`, `HEARTBEAT.md`, 새로 생성된 경우 `BOOTSTRAP.md`, 그리고 존재할 경우 `MEMORY.md`). 소문자 루트 `memory.md`는 주입되지 않으며, `MEMORY.md`와 함께 있을 때 `openclaw doctor --fix`를 위한 레거시 복구 입력입니다. 큰 파일은 `agents.defaults.bootstrapMaxChars`(기본값: 12000)로 잘리고, 전체 bootstrap 주입은 `agents.defaults.bootstrapTotalMaxChars`(기본값: 60000)로 제한됩니다. `memory/*.md` 일일 파일은 일반 bootstrap 프롬프트의 일부가 아니며, 일반 턴에서는 메모리 도구를 통한 on-demand 방식으로 유지됩니다. 다만 순수 `/new`와 `/reset`은 첫 턴에만 최근 일일 메모리가 포함된 일회성 시작 컨텍스트 블록을 앞에 붙일 수 있습니다. 이 시작 프렐류드는 `agents.defaults.startupContext`로 제어됩니다.
- 시간 (UTC + 사용자 시간대)
- 응답 태그 + Heartbeat 동작
- 런타임 메타데이터 (호스트/OS/모델/thinking)

전체 세부 구성은 [시스템 프롬프트](/ko/concepts/system-prompt)를 참고하세요.

## 컨텍스트 윈도에 포함되는 것

모델이 받는 모든 것은 컨텍스트 한도에 포함됩니다:

- 시스템 프롬프트(위에 나열된 모든 섹션)
- 대화 기록(사용자 + 어시스턴트 메시지)
- 도구 호출 및 도구 결과
- 첨부 파일/전사(이미지, 오디오, 파일)
- Compaction 요약 및 가지치기 아티팩트
- Provider 래퍼 또는 안전성 헤더(보이지 않더라도 여전히 계산됨)

일부 런타임 중심 표면은 자체적인 명시적 제한을 가집니다:

- `agents.defaults.contextLimits.memoryGetMaxChars`
- `agents.defaults.contextLimits.memoryGetDefaultLines`
- `agents.defaults.contextLimits.toolResultMaxChars`
- `agents.defaults.contextLimits.postCompactionMaxChars`

에이전트별 재정의는 `agents.list[].contextLimits` 아래에 있습니다. 이 설정은 제한된 런타임 발췌와 런타임 소유 주입 블록을 위한 것입니다. bootstrap 제한, startup-context 제한, skills 프롬프트 제한과는 별개입니다.

이미지의 경우 OpenClaw는 Provider 호출 전에 전사/도구 이미지 페이로드를 축소합니다.
이를 조정하려면 `agents.defaults.imageMaxDimensionPx`(기본값: `1200`)를 사용하세요:

- 값을 낮추면 일반적으로 vision 토큰 사용량과 페이로드 크기가 줄어듭니다.
- 값을 높이면 OCR/UI 중심 스크린샷에서 더 많은 시각적 세부 정보가 유지됩니다.

실용적인 세부 내역(파일별 주입, 도구, Skills, 시스템 프롬프트 크기)은 `/context list` 또는 `/context detail`을 사용하세요. [컨텍스트](/ko/concepts/context)를 참고하세요.

## 현재 토큰 사용량을 확인하는 방법

채팅에서 다음을 사용하세요:

- `/status` → 세션 모델, 컨텍스트 사용량,
  마지막 응답 입력/출력 토큰, **예상 비용**(API 키 전용)을 보여주는 **이모지 풍부한 상태 카드**
- `/usage off|tokens|full` → 모든 응답에 **응답별 사용량 푸터**를 추가합니다.
  - 세션별로 유지됩니다(`responseUsage`로 저장).
  - OAuth 인증은 **비용을 숨깁니다**(토큰만 표시).
- `/usage cost` → OpenClaw 세션 로그의 로컬 비용 요약을 보여줍니다.

기타 표면:

- **TUI/Web TUI:** `/status` + `/usage` 지원.
- **CLI:** `openclaw status --usage`와 `openclaw channels list`는
  정규화된 Provider 할당량 구간(`X% left`, 응답별 비용은 아님)을 보여줍니다.
  현재 사용량 구간 Provider: Anthropic, GitHub Copilot, Gemini CLI,
  OpenAI Codex, MiniMax, Xiaomi, z.ai.

사용량 표면은 표시 전에 일반적인 Provider 네이티브 필드 별칭을 정규화합니다.
OpenAI 계열 Responses 트래픽의 경우 여기에는 `input_tokens` /
`output_tokens`와 `prompt_tokens` / `completion_tokens`가 모두 포함되므로, 전송별
필드 이름 차이가 `/status`, `/usage`, 세션 요약을 바꾸지 않습니다.
Gemini CLI JSON 사용량도 정규화됩니다: 응답 텍스트는 `response`에서 오고,
`stats.cached`는 `cacheRead`로 매핑되며, CLI가 명시적인 `stats.input` 필드를 생략하면
`stats.input_tokens - stats.cached`를 사용합니다.
네이티브 OpenAI 계열 Responses 트래픽의 경우 WebSocket/SSE 사용량 별칭도 같은 방식으로 정규화되며,
`total_tokens`가 없거나 `0`일 때 총계는 정규화된 입력 + 출력으로 폴백합니다.
현재 세션 스냅샷이 부족할 경우 `/status`와 `session_status`는
가장 최근 전사 사용량 로그에서 토큰/캐시 카운터와 활성 런타임 모델 레이블도 복구할 수 있습니다.
기존의 0이 아닌 라이브 값은 여전히 전사 폴백 값보다 우선하며, 저장된 총계가 없거나 더 작으면
더 큰 프롬프트 지향 전사 총계가 우선할 수 있습니다.
Provider 할당량 구간용 사용량 인증은 가능한 경우 Provider 전용 훅에서 오고, 그렇지 않으면 OpenClaw는 auth profile, env, 구성의 일치하는 OAuth/API 키 자격 증명으로 폴백합니다.
어시스턴트 전사 항목은 활성 모델에 가격이 구성되어 있고 Provider가 사용량 메타데이터를 반환할 경우
`usage.cost`를 포함한 동일한 정규화된 사용량 형태를 영속 저장합니다. 이렇게 하면 라이브 런타임 상태가 사라진 뒤에도
`/usage cost`와 전사 기반 세션 상태가 안정적인 소스를 갖게 됩니다.

## 비용 추정(표시되는 경우)

비용은 모델 가격 구성에서 추정됩니다:

```
models.providers.<provider>.models[].cost
```

이 값들은 `input`, `output`, `cacheRead`, `cacheWrite`에 대한 **백만 토큰당 USD**입니다. 가격 정보가 없으면 OpenClaw는 토큰만 표시합니다. OAuth 토큰은 달러 비용을 절대 표시하지 않습니다.

## 캐시 TTL 및 가지치기 영향

Provider 프롬프트 캐싱은 캐시 TTL 윈도 안에서만 적용됩니다. OpenClaw는
선택적으로 **cache-ttl pruning**을 실행할 수 있습니다: 캐시 TTL이 만료되면 세션을 가지치기하고,
그 다음 캐시 윈도를 리셋하여 이후 요청이 전체 기록을 다시 캐싱하는 대신
새로 캐싱된 컨텍스트를 재사용하게 합니다. 이렇게 하면 세션이 TTL 이후 유휴 상태가 되었을 때 캐시 쓰기 비용을 낮출 수 있습니다.

이는 [Gateway 구성](/ko/gateway/configuration)에서 설정하고,
동작 세부 정보는 [세션 가지치기](/ko/concepts/session-pruning)를 참고하세요.

Heartbeat는 유휴 간격 동안 캐시를 **따뜻하게** 유지할 수 있습니다. 모델 캐시 TTL이
`1h`라면 Heartbeat 간격을 그보다 약간 짧게(예: `55m`) 설정하면
전체 프롬프트를 다시 캐싱하지 않아도 되어 캐시 쓰기 비용을 줄일 수 있습니다.

다중 에이전트 설정에서는 하나의 공유 모델 구성을 유지하면서
`agents.list[].params.cacheRetention`으로 에이전트별 캐시 동작을 조정할 수 있습니다.

설정별 전체 가이드는 [프롬프트 캐싱](/ko/reference/prompt-caching)을 참고하세요.

Anthropic API 가격에서는 캐시 읽기가 입력 토큰보다 훨씬 저렴한 반면,
캐시 쓰기는 더 높은 배수로 과금됩니다. 최신 요금과 TTL 배수는 Anthropic의
프롬프트 캐싱 가격 문서를 참고하세요:
[https://docs.anthropic.com/docs/build-with-claude/prompt-caching](https://docs.anthropic.com/docs/build-with-claude/prompt-caching)

### 예시: Heartbeat로 1시간 캐시 유지하기

```yaml
agents:
  defaults:
    model:
      primary: "anthropic/claude-opus-4-6"
    models:
      "anthropic/claude-opus-4-6":
        params:
          cacheRetention: "long"
    heartbeat:
      every: "55m"
```

### 예시: 에이전트별 캐시 전략이 다른 혼합 트래픽

```yaml
agents:
  defaults:
    model:
      primary: "anthropic/claude-opus-4-6"
    models:
      "anthropic/claude-opus-4-6":
        params:
          cacheRetention: "long" # 대부분 에이전트의 기본 기준
  list:
    - id: "research"
      default: true
      heartbeat:
        every: "55m" # 깊은 세션을 위해 긴 캐시 유지
    - id: "alerts"
      params:
        cacheRetention: "none" # bursty 알림에 대한 캐시 쓰기 방지
```

`agents.list[].params`는 선택된 모델의 `params` 위에 병합되므로,
`cacheRetention`만 재정의하고 다른 모델 기본값은 그대로 상속할 수 있습니다.

### 예시: Anthropic 1M 컨텍스트 베타 헤더 활성화

Anthropic의 1M 컨텍스트 윈도는 현재 베타 게이트로 제한됩니다. OpenClaw는 지원되는 Opus
또는 Sonnet 모델에서 `context1m`을 활성화하면 필요한 `anthropic-beta` 값을 주입할 수 있습니다.

```yaml
agents:
  defaults:
    models:
      "anthropic/claude-opus-4-6":
        params:
          context1m: true
```

이것은 Anthropic의 `context-1m-2025-08-07` 베타 헤더에 매핑됩니다.

이는 해당 모델 항목에 `context1m: true`가 설정된 경우에만 적용됩니다.

요구 사항: 자격 증명이 장문맥 사용 대상이어야 합니다. 그렇지 않으면 Anthropic은 해당 요청에 대해 Provider 측 속도 제한 오류를 반환합니다.

Anthropic을 OAuth/구독 토큰(`sk-ant-oat-*`)으로 인증하는 경우, Anthropic이 현재
그 조합을 HTTP 401로 거부하므로 OpenClaw는 `context-1m-*` 베타 헤더를 건너뜁니다.

## 토큰 압박을 줄이기 위한 팁

- 긴 세션은 `/compact`를 사용해 요약하세요.
- 워크플로에서 큰 도구 출력은 잘라내세요.
- 스크린샷 중심 세션은 `agents.defaults.imageMaxDimensionPx`를 낮추세요.
- Skill 설명은 짧게 유지하세요(Skill 목록은 프롬프트에 주입됨).
- 장황하고 탐색적인 작업에는 더 작은 모델을 선호하세요.

정확한 Skill 목록 오버헤드 공식은 [Skills](/ko/tools/skills)를 참고하세요.

## 관련 문서

- [API 사용량 및 비용](/ko/reference/api-usage-costs)
- [프롬프트 캐싱](/ko/reference/prompt-caching)
- [사용량 추적](/ko/concepts/usage-tracking)
