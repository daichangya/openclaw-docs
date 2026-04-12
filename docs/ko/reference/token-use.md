---
read_when:
    - 토큰 사용량, 비용 또는 컨텍스트 윈도우 설명하기
    - 컨텍스트 증가 또는 압축 동작 디버깅하기
summary: OpenClaw가 프롬프트 컨텍스트를 구성하고 토큰 사용량 + 비용을 보고하는 방법
title: 토큰 사용량 및 비용
x-i18n:
    generated_at: "2026-04-12T05:58:48Z"
    model: gpt-5.4
    provider: openai
    source_hash: f8c856549cd28b8364a640e6fa9ec26aa736895c7a993e96cbe85838e7df2dfb
    source_path: reference/token-use.md
    workflow: 15
---

# 토큰 사용량 및 비용

OpenClaw는 문자 수가 아니라 **토큰**을 추적합니다. 토큰은 모델마다 다르지만, 대부분의 OpenAI 스타일 모델은 영어 텍스트에서 토큰당 평균 약 4자를 사용합니다.

## 시스템 프롬프트가 구성되는 방식

OpenClaw는 실행할 때마다 자체 시스템 프롬프트를 조합합니다. 여기에는 다음이 포함됩니다.

- 도구 목록 + 짧은 설명
- Skills 목록(메타데이터만 포함, 지침은 필요할 때 `read`로 로드)
- 자체 업데이트 지침
- 워크스페이스 + 부트스트랩 파일(`AGENTS.md`, `SOUL.md`, `TOOLS.md`, `IDENTITY.md`, `USER.md`, `HEARTBEAT.md`, 새로울 때의 `BOOTSTRAP.md`, 그리고 존재할 경우 `MEMORY.md` 또는 소문자 대체 파일인 `memory.md`). 큰 파일은 `agents.defaults.bootstrapMaxChars`(기본값: 20000)로 잘리며, 전체 부트스트랩 주입은 `agents.defaults.bootstrapTotalMaxChars`(기본값: 150000)로 제한됩니다. `memory/*.md` 일일 파일은 일반 부트스트랩 프롬프트에는 포함되지 않으며, 일반 턴에서는 메모리 도구를 통해 필요 시 로드됩니다. 다만 순수한 `/new` 및 `/reset`은 첫 번째 턴에 한해 최근 일일 메모리를 포함한 일회성 시작 컨텍스트 블록을 앞에 붙일 수 있습니다. 이 시작 프렐류드는 `agents.defaults.startupContext`로 제어됩니다.
- 시간(UTC + 사용자 시간대)
- 응답 태그 + heartbeat 동작
- 런타임 메타데이터(호스트/OS/모델/thinking)

전체 세부 내역은 [시스템 프롬프트](/ko/concepts/system-prompt)에서 확인하세요.

## 컨텍스트 윈도우에 포함되는 항목

모델이 받는 모든 항목은 컨텍스트 한도에 포함됩니다.

- 시스템 프롬프트(위에 나열된 모든 섹션)
- 대화 기록(사용자 + 어시스턴트 메시지)
- 도구 호출 및 도구 결과
- 첨부 파일/전사본(이미지, 오디오, 파일)
- 압축 요약 및 가지치기 아티팩트
- 제공자 래퍼 또는 안전 헤더(보이지 않더라도 여전히 계산됨)

이미지의 경우 OpenClaw는 제공자 호출 전에 전사/도구 이미지 페이로드를 축소합니다.
이를 조정하려면 `agents.defaults.imageMaxDimensionPx`(기본값: `1200`)를 사용하세요.

- 값을 낮추면 일반적으로 비전 토큰 사용량과 페이로드 크기가 줄어듭니다.
- 값을 높이면 OCR/UI 중심 스크린샷에서 더 많은 시각적 디테일이 보존됩니다.

주입된 파일별, 도구, Skills, 시스템 프롬프트 크기를 포함한 실용적인 세부 내역은 `/context list` 또는 `/context detail`을 사용하세요. [컨텍스트](/ko/concepts/context)도 참고하세요.

## 현재 토큰 사용량 확인 방법

채팅에서 다음 명령을 사용하세요.

- `/status` → 세션 모델, 컨텍스트 사용량, 마지막 응답의 입력/출력 토큰, **예상 비용**(API 키에만 해당)을 보여주는 **이모지 중심 상태 카드**
- `/usage off|tokens|full` → 모든 응답에 **응답별 사용량 바닥글**을 추가합니다.
  - 세션별로 유지됩니다(`responseUsage`로 저장됨).
  - OAuth 인증은 **비용을 숨깁니다**(토큰만 표시).

- `/usage cost` → OpenClaw 세션 로그를 바탕으로 로컬 비용 요약을 표시합니다.

기타 표시 영역:

- **TUI/Web TUI:** `/status` + `/usage` 지원
- **CLI:** `openclaw status --usage` 및 `openclaw channels list`는
  정규화된 제공자 쿼터 윈도우(`X% left`, 응답별 비용 아님)를 표시합니다.
  현재 사용량 윈도우 제공자: Anthropic, GitHub Copilot, Gemini CLI,
  OpenAI Codex, MiniMax, Xiaomi, z.ai

사용량 표시 영역은 표시 전에 일반적인 제공자 네이티브 필드 별칭을 정규화합니다.
OpenAI 계열 Responses 트래픽의 경우 여기에는 `input_tokens` /
`output_tokens`와 `prompt_tokens` / `completion_tokens`가 모두 포함되므로, 전송 방식별
필드 이름 차이가 `/status`, `/usage`, 또는 세션 요약에 영향을 주지 않습니다.
Gemini CLI JSON 사용량도 정규화됩니다. 응답 텍스트는 `response`에서 가져오고,
CLI가 명시적인 `stats.input` 필드를 생략할 경우 `stats.cached`는 `cacheRead`로 매핑되며
`stats.input_tokens - stats.cached`가 사용됩니다.
네이티브 OpenAI 계열 Responses 트래픽의 경우 WebSocket/SSE 사용량 별칭도
같은 방식으로 정규화되며, `total_tokens`가 없거나 `0`일 때는 정규화된 입력 + 출력으로 총합을 대체합니다.
현재 세션 스냅샷이 충분한 정보를 갖고 있지 않으면 `/status`와 `session_status`는
가장 최근 전사 사용량 로그에서 토큰/캐시 카운터와 활성 런타임 모델 레이블을 복구할 수도 있습니다.
기존의 0이 아닌 라이브 값은 여전히 전사 대체 값보다 우선하며, 저장된 총합이 없거나 더 작을 때는
더 큰 프롬프트 지향 전사 총합이 선택될 수 있습니다.
제공자 쿼터 윈도우의 사용량 인증은 가능할 경우 제공자별 훅에서 가져오며,
그렇지 않으면 OpenClaw는 auth 프로필, env 또는 config의 OAuth/API 키 자격 증명 매칭으로 대체합니다.

## 비용 추정(표시되는 경우)

비용은 모델 가격 설정을 기반으로 추정됩니다.

```
models.providers.<provider>.models[].cost
```

이 값은 `input`, `output`, `cacheRead`, `cacheWrite`에 대한 **100만 토큰당 USD**입니다.
가격 정보가 없으면 OpenClaw는 토큰만 표시합니다. OAuth 토큰은 달러 비용을 표시하지 않습니다.

## 캐시 TTL 및 가지치기 영향

제공자 프롬프트 캐싱은 캐시 TTL 윈도우 내에서만 적용됩니다. OpenClaw는 선택적으로 **cache-ttl pruning**을 실행할 수 있습니다. 캐시 TTL이 만료되면 세션을 가지치기하고, 이후 요청이 전체 기록을 다시 캐싱하는 대신 새로 캐시된 컨텍스트를 재사용할 수 있도록 캐시 윈도우를 재설정합니다. 이렇게 하면 세션이 TTL을 넘겨 유휴 상태가 되었을 때 캐시 쓰기 비용을 더 낮게 유지할 수 있습니다.

이 기능은 [Gateway configuration](/ko/gateway/configuration)에서 설정하고, 동작 세부 사항은 [Session pruning](/ko/concepts/session-pruning)에서 확인하세요.

Heartbeat는 유휴 간격 동안 캐시를 **따뜻하게 유지**할 수 있습니다. 모델 캐시 TTL이 `1h`라면, heartbeat 간격을 그보다 약간 짧게(예: `55m`) 설정해 전체 프롬프트를 다시 캐싱하지 않도록 하여 캐시 쓰기 비용을 줄일 수 있습니다.

멀티 에이전트 설정에서는 하나의 공유 모델 config를 유지하면서
`agents.list[].params.cacheRetention`으로 에이전트별 캐시 동작을 조정할 수 있습니다.

세부 설정별 전체 가이드는 [Prompt Caching](/ko/reference/prompt-caching)을 참고하세요.

Anthropic API 가격의 경우 cache read는 입력 토큰보다 훨씬 저렴한 반면,
cache write는 더 높은 배수로 과금됩니다. 최신 요금과 TTL 배수는 Anthropic의
프롬프트 캐싱 가격 문서를 참고하세요:
[https://docs.anthropic.com/docs/build-with-claude/prompt-caching](https://docs.anthropic.com/docs/build-with-claude/prompt-caching)

### 예시: heartbeat로 1h 캐시를 따뜻하게 유지

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

### 예시: 에이전트별 캐시 전략을 적용한 혼합 트래픽

```yaml
agents:
  defaults:
    model:
      primary: "anthropic/claude-opus-4-6"
    models:
      "anthropic/claude-opus-4-6":
        params:
          cacheRetention: "long" # 대부분의 에이전트를 위한 기본 기준값
  list:
    - id: "research"
      default: true
      heartbeat:
        every: "55m" # 긴 세션을 위해 장기 캐시를 따뜻하게 유지
    - id: "alerts"
      params:
        cacheRetention: "none" # 버스트성 알림에 대해 캐시 쓰기 방지
```

`agents.list[].params`는 선택된 모델의 `params` 위에 병합되므로,
`cacheRetention`만 재정의하고 다른 모델 기본값은 그대로 상속할 수 있습니다.

### 예시: Anthropic 1M 컨텍스트 베타 헤더 활성화

Anthropic의 1M 컨텍스트 윈도우는 현재 베타 게이트가 적용되어 있습니다. OpenClaw는
지원되는 Opus 또는 Sonnet 모델에서 `context1m`을 활성화하면 필요한
`anthropic-beta` 값을 주입할 수 있습니다.

```yaml
agents:
  defaults:
    models:
      "anthropic/claude-opus-4-6":
        params:
          context1m: true
```

이는 Anthropic의 `context-1m-2025-08-07` 베타 헤더로 매핑됩니다.

이는 해당 모델 항목에 `context1m: true`가 설정된 경우에만 적용됩니다.

요구 사항: 자격 증명은 장문 컨텍스트 사용 자격이 있어야 합니다. 그렇지 않으면
Anthropic은 해당 요청에 대해 제공자 측 rate limit 오류를 반환합니다.

Anthropic을 OAuth/구독 토큰(`sk-ant-oat-*`)으로 인증하는 경우, OpenClaw는
현재 Anthropic이 이 조합을 HTTP 401로 거부하므로 `context-1m-*` 베타 헤더를 건너뜁니다.

## 토큰 부담을 줄이기 위한 팁

- 긴 세션을 요약하려면 `/compact`를 사용하세요.
- 워크플로우에서 큰 도구 출력을 잘라내세요.
- 스크린샷이 많은 세션에서는 `agents.defaults.imageMaxDimensionPx`를 낮추세요.
- Skill 설명은 짧게 유지하세요(Skill 목록이 프롬프트에 주입됨).
- 장황하고 탐색적인 작업에는 더 작은 모델을 우선 사용하세요.

정확한 Skill 목록 오버헤드 공식은 [Skills](/ko/tools/skills)에서 확인하세요.
