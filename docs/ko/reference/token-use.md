---
read_when:
    - 토큰 사용량, 비용, 또는 컨텍스트 윈도 설명하기
    - 컨텍스트 증가 또는 Compaction 동작 디버깅하기
summary: OpenClaw가 프롬프트 컨텍스트를 구성하고 토큰 사용량 및 비용을 보고하는 방식
title: 토큰 사용량 및 비용
x-i18n:
    generated_at: "2026-04-21T06:08:48Z"
    model: gpt-5.4
    provider: openai
    source_hash: d26db37353941e247eb26f84bfa105896318b3239b2975d6e033c6e9ceda6b0d
    source_path: reference/token-use.md
    workflow: 15
---

# 토큰 사용량 및 비용

OpenClaw는 문자 수가 아니라 **토큰**을 추적합니다. 토큰은 모델별로 다르지만,
대부분의 OpenAI 스타일 모델은 영어 텍스트에서 평균적으로 토큰당 약 4자를 사용합니다.

## 시스템 프롬프트가 구성되는 방식

OpenClaw는 실행할 때마다 자체 시스템 프롬프트를 조합합니다. 여기에는 다음이 포함됩니다:

- 도구 목록 + 짧은 설명
- Skills 목록(메타데이터만 포함되며, 지침은 필요 시 `read`로 로드됨)
  이 압축된 Skills 블록은 `skills.limits.maxSkillsPromptChars`로 제한되며,
  에이전트별 override는
  `agents.list[].skillsLimits.maxSkillsPromptChars`에 둘 수 있습니다.
- 자체 업데이트 지침
- 워크스페이스 + bootstrap 파일(`AGENTS.md`, `SOUL.md`, `TOOLS.md`, `IDENTITY.md`, `USER.md`, `HEARTBEAT.md`, 새 경우 `BOOTSTRAP.md`, 그리고 존재하면 `MEMORY.md` 또는 소문자 fallback인 `memory.md`). 큰 파일은 `agents.defaults.bootstrapMaxChars`(기본값: 12000)로 잘리며, 전체 bootstrap 주입은 `agents.defaults.bootstrapTotalMaxChars`(기본값: 60000)로 제한됩니다. `memory/*.md` 일일 파일은 일반 bootstrap 프롬프트의 일부가 아닙니다. 일반 턴에서는 메모리 도구를 통해 필요 시 불러오지만, 빈 `/new`와 `/reset`은 첫 턴에 대해 최근 일일 메모리를 포함한 일회성 startup-context 블록을 앞에 붙일 수 있습니다. 이 startup prelude는 `agents.defaults.startupContext`로 제어됩니다.
- 시간(UTC + 사용자 시간대)
- 응답 태그 + Heartbeat 동작
- 런타임 메타데이터(호스트/OS/모델/thinking)

전체 분석은 [System Prompt](/ko/concepts/system-prompt)를 참고하세요.

## 컨텍스트 윈도에 포함되는 항목

모델이 받는 모든 것은 컨텍스트 한도에 포함됩니다:

- 시스템 프롬프트(위에 나열된 모든 섹션)
- 대화 기록(사용자 + assistant 메시지)
- 도구 호출 및 도구 결과
- 첨부파일/transcript(이미지, 오디오, 파일)
- Compaction 요약 및 pruning 아티팩트
- provider 래퍼 또는 안전 헤더(보이지 않지만 여전히 계산됨)

일부 런타임 중심 surface에는 별도의 명시적 한도가 있습니다:

- `agents.defaults.contextLimits.memoryGetMaxChars`
- `agents.defaults.contextLimits.memoryGetDefaultLines`
- `agents.defaults.contextLimits.toolResultMaxChars`
- `agents.defaults.contextLimits.postCompactionMaxChars`

에이전트별 override는 `agents.list[].contextLimits` 아래에 있습니다. 이 설정값들은
제한된 런타임 발췌와 런타임이 소유한 주입 블록용입니다. 이들은
bootstrap 한도, startup-context 한도, Skills 프롬프트
한도와는 별개입니다.

이미지의 경우 OpenClaw는 provider 호출 전에 transcript/도구 이미지 payload를 다운스케일합니다.
이를 조정하려면 `agents.defaults.imageMaxDimensionPx`(기본값: `1200`)를 사용하세요:

- 값이 낮을수록 보통 비전 토큰 사용량과 payload 크기가 줄어듭니다.
- 값이 높을수록 OCR/UI 중심 스크린샷에서 더 많은 시각적 세부 정보를 보존합니다.

실제 분석(파일별 주입, 도구, Skills, 시스템 프롬프트 크기)은 `/context list` 또는 `/context detail`을 사용하세요. [Context](/ko/concepts/context)를 참고하세요.

## 현재 토큰 사용량 확인 방법

채팅에서 다음을 사용하세요:

- `/status` → 세션 모델, 컨텍스트 사용량,
  마지막 응답의 입력/출력 토큰, 그리고 **추정 비용**(API 키 전용)을 보여주는 **이모지 중심 상태 카드**
- `/usage off|tokens|full` → 모든 응답에 **응답별 사용량 footer**를 추가
  - 세션별로 유지됨(`responseUsage`로 저장)
  - OAuth 인증은 **비용을 숨김**(토큰만 표시)
- `/usage cost` → OpenClaw 세션 로그를 기반으로 로컬 비용 요약 표시

다른 surface:

- **TUI/Web TUI:** `/status`와 `/usage` 지원
- **CLI:** `openclaw status --usage`와 `openclaw channels list`는
  정규화된 provider quota window를 표시합니다(`X% left`, 응답별 비용은 아님).
  현재 usage-window provider: Anthropic, GitHub Copilot, Gemini CLI,
  OpenAI Codex, MiniMax, Xiaomi, z.ai

사용량 surface는 표시 전에 일반적인 provider 네이티브 필드 별칭을 정규화합니다.
OpenAI 계열 Responses 트래픽의 경우 여기에는 `input_tokens` /
`output_tokens`와 `prompt_tokens` / `completion_tokens`가 모두 포함되므로,
전송 방식별 필드 이름 차이가 `/status`, `/usage`, 또는 세션 요약에 영향을 주지 않습니다.
Gemini CLI JSON 사용량도 정규화됩니다. 응답 텍스트는 `response`에서 오고,
`stats.cached`는 `cacheRead`로 매핑되며, CLI가 명시적 `stats.input` 필드를 생략하면
`stats.input_tokens - stats.cached`가 사용됩니다.
네이티브 OpenAI 계열 Responses 트래픽의 경우, WebSocket/SSE 사용량 별칭도
같은 방식으로 정규화되며, `total_tokens`가 없거나 `0`이면 총합은 정규화된 입력 + 출력으로 대체됩니다.
현재 세션 스냅샷이 희소한 경우 `/status`와 `session_status`는
가장 최근 transcript 사용량 로그에서 토큰/캐시 카운터와 활성 런타임 모델 레이블을 복구할 수도 있습니다.
기존의 0이 아닌 라이브 값은 여전히 transcript fallback 값보다 우선하며, 저장된 총합이 없거나 더 작으면
더 큰 프롬프트 지향 transcript 총합이 우선할 수 있습니다.
provider quota window용 usage 인증은 사용 가능한 경우 provider별 hook에서 오며,
그렇지 않으면 OpenClaw는 auth profile, env, 또는 config의 OAuth/API 키 자격 증명을 매칭하는 방식으로 fallback합니다.
assistant transcript 항목은 동일한 정규화된 사용량 형태를 유지 저장하며,
활성 모델에 가격이 구성되어 있고 provider가 사용량 메타데이터를 반환할 경우 `usage.cost`도 포함합니다.
이렇게 하면 라이브 런타임 상태가 사라진 뒤에도 `/usage cost`와 transcript 기반 세션
상태에 안정적인 데이터 소스를 제공합니다.

## 비용 추정(표시되는 경우)

비용은 모델 가격 구성에서 추정됩니다:

```
models.providers.<provider>.models[].cost
```

이는 `input`, `output`, `cacheRead`, `cacheWrite`에 대한 **백만 토큰당 USD**입니다.
가격 정보가 없으면 OpenClaw는 토큰만 표시합니다. OAuth 토큰은
달러 비용을 절대 표시하지 않습니다.

## 캐시 TTL 및 pruning 영향

provider 프롬프트 캐싱은 캐시 TTL 기간 안에서만 적용됩니다. OpenClaw는
선택적으로 **cache-ttl pruning**을 실행할 수 있습니다. 캐시 TTL이 만료되면 세션을 정리하고,
이후 요청이 전체 기록을 다시 캐싱하는 대신 새로 캐시된 컨텍스트를
재사용할 수 있도록 캐시 창을 재설정합니다. 이렇게 하면 세션이 TTL을 넘겨 유휴 상태가 되었을 때
캐시 쓰기 비용을 낮출 수 있습니다.

이는 [Gateway configuration](/ko/gateway/configuration)에서 구성할 수 있으며,
동작 세부 정보는 [Session pruning](/ko/concepts/session-pruning)을 참고하세요.

Heartbeat는 유휴 간격 동안 캐시를 **따뜻한 상태로 유지**할 수 있습니다. 모델 캐시 TTL이
`1h`라면, Heartbeat 간격을 그보다 약간 짧게(예: `55m`) 설정하면
전체 프롬프트를 다시 캐싱하지 않아도 되어 캐시 쓰기 비용을 줄일 수 있습니다.

다중 에이전트 설정에서는 하나의 공유 모델 구성을 유지하면서
`agents.list[].params.cacheRetention`으로 에이전트별 캐시 동작을 조정할 수 있습니다.

설정값별 전체 안내는 [Prompt Caching](/ko/reference/prompt-caching)을 참고하세요.

Anthropic API 가격에서는 캐시 읽기가 입력
토큰보다 훨씬 저렴한 반면, 캐시 쓰기는 더 높은 배수로 청구됩니다. 최신 요금 및 TTL 배수는 Anthropic의
프롬프트 캐싱 가격 문서를 참고하세요:
[https://docs.anthropic.com/docs/build-with-claude/prompt-caching](https://docs.anthropic.com/docs/build-with-claude/prompt-caching)

### 예시: Heartbeat로 1시간 캐시를 따뜻하게 유지

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
          cacheRetention: "long" # 대부분의 에이전트를 위한 기본 기준선
  list:
    - id: "research"
      default: true
      heartbeat:
        every: "55m" # 심층 세션을 위해 긴 캐시를 따뜻하게 유지
    - id: "alerts"
      params:
        cacheRetention: "none" # 순간적인 알림에 대해 캐시 쓰기 방지
```

`agents.list[].params`는 선택된 모델의 `params` 위에 병합되므로,
`cacheRetention`만 override하고 다른 모델 기본값은 그대로 상속할 수 있습니다.

### 예시: Anthropic 1M 컨텍스트 베타 헤더 활성화

Anthropic의 1M 컨텍스트 윈도는 현재 베타 게이트가 걸려 있습니다. OpenClaw는
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

이 값은 Anthropic의 `context-1m-2025-08-07` 베타 헤더로 매핑됩니다.

이는 해당 모델 항목에 `context1m: true`가 설정된 경우에만 적용됩니다.

요구 사항: 자격 증명이 긴 컨텍스트 사용 대상이어야 합니다. 그렇지 않으면
Anthropic은 해당 요청에 대해 provider 측 rate limit 오류를 반환합니다.

Anthropic을 OAuth/구독 토큰(`sk-ant-oat-*`)으로 인증하는 경우 OpenClaw는
현재 Anthropic이 이 조합을 HTTP 401로 거부하므로 `context-1m-*` 베타 헤더를 건너뜁니다.

## 토큰 압력을 줄이기 위한 팁

- 긴 세션은 `/compact`를 사용해 요약하세요.
- 워크플로에서 큰 도구 출력을 줄이세요.
- 스크린샷 중심 세션에서는 `agents.defaults.imageMaxDimensionPx`를 낮추세요.
- Skill 설명은 짧게 유지하세요(Skills 목록은 프롬프트에 주입됨).
- 장황하고 탐색적인 작업에는 더 작은 모델을 선호하세요.

정확한 Skills 목록 오버헤드 계산식은 [Skills](/ko/tools/skills)를 참고하세요.
