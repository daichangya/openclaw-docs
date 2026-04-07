---
read_when:
    - 토큰 사용량, 비용 또는 컨텍스트 창을 설명하고 있습니다
    - 컨텍스트 증가 또는 압축 동작을 디버깅하고 있습니다
summary: OpenClaw가 프롬프트 컨텍스트를 구성하고 토큰 사용량 및 비용을 보고하는 방법
title: 토큰 사용량 및 비용
x-i18n:
    generated_at: "2026-04-07T06:01:29Z"
    model: gpt-5.4
    provider: openai
    source_hash: 0683693d6c6fcde7d5fba236064ba97dd4b317ae6bea3069db969fcd178119d9
    source_path: reference/token-use.md
    workflow: 15
---

# 토큰 사용량 및 비용

OpenClaw는 문자 수가 아니라 **토큰**을 추적합니다. 토큰은 모델마다 다르지만, 대부분의
OpenAI 스타일 모델은 영어 텍스트 기준으로 토큰당 평균 약 4자입니다.

## 시스템 프롬프트가 구성되는 방법

OpenClaw는 실행할 때마다 자체 시스템 프롬프트를 조합합니다. 여기에 포함되는 항목은 다음과 같습니다.

- 도구 목록 + 짧은 설명
- Skills 목록(메타데이터만 포함되며, 지침은 필요할 때 `read`로 로드됨)
- 자체 업데이트 지침
- 워크스페이스 + bootstrap 파일(`AGENTS.md`, `SOUL.md`, `TOOLS.md`, `IDENTITY.md`, `USER.md`, `HEARTBEAT.md`, 새로 생긴 경우 `BOOTSTRAP.md`, 그리고 존재할 경우 `MEMORY.md` 또는 소문자 대체 파일인 `memory.md`). 큰 파일은 `agents.defaults.bootstrapMaxChars`(기본값: 20000)로 잘리며, bootstrap 전체 주입량은 `agents.defaults.bootstrapTotalMaxChars`(기본값: 150000)로 제한됩니다. `memory/*.md` 파일은 메모리 도구를 통해 필요 시 로드되며 자동 주입되지 않습니다.
- 시간(UTC + 사용자 시간대)
- 응답 태그 + heartbeat 동작
- 런타임 메타데이터(호스트/OS/모델/thinking)

전체 구성은 [시스템 프롬프트](/ko/concepts/system-prompt)에서 확인하세요.

## 컨텍스트 창에 포함되는 항목

모델이 받는 모든 내용은 컨텍스트 제한에 포함됩니다.

- 시스템 프롬프트(위에 나열된 모든 섹션)
- 대화 기록(사용자 + 어시스턴트 메시지)
- 도구 호출 및 도구 결과
- 첨부 파일/transcript(이미지, 오디오, 파일)
- 압축 요약 및 정리 산출물
- provider 래퍼 또는 안전성 헤더(보이지 않더라도 여전히 계산됨)

이미지의 경우, OpenClaw는 provider 호출 전에 transcript/도구 이미지 페이로드를 축소합니다.
이를 조정하려면 `agents.defaults.imageMaxDimensionPx`(기본값: `1200`)를 사용하세요.

- 낮은 값은 일반적으로 비전 토큰 사용량과 페이로드 크기를 줄입니다.
- 높은 값은 OCR/UI 중심 스크린샷에서 더 많은 시각적 디테일을 유지합니다.

실제 구성 내역(주입된 파일별, 도구, Skills, 시스템 프롬프트 크기별)을 확인하려면 `/context list` 또는 `/context detail`을 사용하세요. [컨텍스트](/ko/concepts/context)를 참조하세요.

## 현재 토큰 사용량을 확인하는 방법

채팅에서는 다음을 사용하세요.

- `/status` → 세션 모델, 컨텍스트 사용량,
  마지막 응답 입력/출력 토큰, **예상 비용**(API 키 전용)을 보여주는 **이모지 중심 상태 카드**입니다.
- `/usage off|tokens|full` → 모든 응답에 **응답별 사용량 바닥글**을 추가합니다.
  - 세션별로 유지됩니다(`responseUsage`로 저장됨).
  - OAuth 인증은 **비용을 숨깁니다**(토큰만 표시).
- `/usage cost` → OpenClaw 세션 로그를 기반으로 로컬 비용 요약을 표시합니다.

기타 표시 위치:

- **TUI/Web TUI:** `/status` + `/usage`가 지원됩니다.
- **CLI:** `openclaw status --usage`와 `openclaw channels list`는
  정규화된 provider 할당량 창(`X% 남음`, 응답별 비용 아님)을 표시합니다.
  현재 사용량 창 provider: Anthropic, GitHub Copilot, Gemini CLI,
  OpenAI Codex, MiniMax, Xiaomi, z.ai.

사용량 표시 표면은 출력 전에 일반적인 provider 고유 필드 별칭을 정규화합니다.
OpenAI 계열 Responses 트래픽의 경우, 여기에는 `input_tokens` /
`output_tokens`와 `prompt_tokens` / `completion_tokens`가 모두 포함되므로, 전송 방식별
필드 이름이 `/status`, `/usage`, 또는 세션 요약을 바꾸지 않습니다.
Gemini CLI JSON 사용량도 정규화됩니다. 응답 텍스트는 `response`에서 가져오고,
`stats.cached`는 `cacheRead`로 매핑되며, CLI가 명시적인 `stats.input` 필드를 생략한 경우
`stats.input_tokens - stats.cached`가 사용됩니다.
기본 OpenAI 계열 Responses 트래픽의 경우, WebSocket/SSE 사용량 별칭도
같은 방식으로 정규화되며, `total_tokens`가 없거나 `0`일 때는 정규화된 입력 + 출력으로 총계를 대체합니다.
현재 세션 스냅샷 정보가 부족한 경우, `/status`와 `session_status`는
가장 최근 transcript 사용량 로그에서 토큰/캐시 카운터와 활성 런타임 모델 라벨도 복구할 수 있습니다.
기존의 0이 아닌 라이브 값은 여전히 transcript 대체 값보다 우선하며, 저장된 총계가 없거나 더 작은 경우
더 큰 프롬프트 지향 transcript 총계가 우선될 수 있습니다.
provider 할당량 창의 사용량 인증은 가능할 때 provider별 훅에서 가져오며,
그렇지 않으면 OpenClaw는 auth profile, env 또는 config에서 일치하는 OAuth/API 키 자격 증명으로 대체합니다.

## 비용 추정(표시되는 경우)

비용은 다음 모델 가격 config를 기준으로 추정됩니다.

```
models.providers.<provider>.models[].cost
```

이 값들은 `input`, `output`, `cacheRead`, `cacheWrite`에 대한 **백만 토큰당 USD**입니다.
가격 정보가 없으면 OpenClaw는 토큰만 표시합니다. OAuth 토큰은
달러 비용을 절대 표시하지 않습니다.

## 캐시 TTL 및 정리 영향

provider 프롬프트 캐싱은 캐시 TTL 창 내에서만 적용됩니다. OpenClaw는
선택적으로 **cache-ttl pruning**을 실행할 수 있습니다. 즉, 캐시 TTL이
만료되면 세션을 정리한 다음 캐시 창을 재설정하여, 이후 요청이 전체 기록을 다시 캐시하는 대신
새로 캐시된 컨텍스트를 재사용할 수 있게 합니다. 이렇게 하면 세션이 TTL을 넘겨 유휴 상태가 되었을 때
캐시 쓰기 비용을 더 낮게 유지할 수 있습니다.

이 기능은 [Gateway configuration](/ko/gateway/configuration)에서 설정하고,
동작 세부 사항은 [세션 정리](/ko/concepts/session-pruning)에서 확인하세요.

Heartbeat는 유휴 구간 동안 캐시를 **따뜻하게 유지**할 수 있습니다. 모델 캐시 TTL이
`1h`인 경우, heartbeat 간격을 그보다 약간 짧게(예: `55m`) 설정하면 전체 프롬프트를 다시 캐시하지 않아도 되어
캐시 쓰기 비용을 줄일 수 있습니다.

멀티 에이전트 환경에서는 하나의 공유 모델 config를 유지하면서
`agents.list[].params.cacheRetention`으로 에이전트별 캐시 동작을 조정할 수 있습니다.

각 설정 항목별 전체 가이드는 [프롬프트 캐싱](/ko/reference/prompt-caching)을 참조하세요.

Anthropic API 가격의 경우, 캐시 읽기는 입력
토큰보다 훨씬 저렴한 반면 캐시 쓰기는 더 높은 배수로 과금됩니다. 최신 요금과 TTL 배수는 Anthropic의
프롬프트 캐싱 가격 문서를 참조하세요:
[https://docs.anthropic.com/docs/build-with-claude/prompt-caching](https://docs.anthropic.com/docs/build-with-claude/prompt-caching)

### 예시: heartbeat로 1시간 캐시를 따뜻하게 유지

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
        cacheRetention: "none" # 버스트성 알림에서는 캐시 쓰기 방지
```

`agents.list[].params`는 선택된 모델의 `params` 위에 병합되므로,
`cacheRetention`만 재정의하고 다른 모델 기본값은 그대로 상속할 수 있습니다.

### 예시: Anthropic 1M 컨텍스트 베타 헤더 활성화

Anthropic의 1M 컨텍스트 창은 현재 베타 게이트가 적용되어 있습니다. OpenClaw는
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

이 값은 Anthropic의 `context-1m-2025-08-07` 베타 헤더에 매핑됩니다.

이 설정은 해당 모델 항목에서 `context1m: true`가 설정된 경우에만 적용됩니다.

요구 사항: 자격 증명은 긴 컨텍스트 사용 자격이 있어야 합니다. 그렇지 않으면
Anthropic은 해당 요청에 대해 provider 측 속도 제한 오류를 반환합니다.

Anthropic을 OAuth/구독 토큰(`sk-ant-oat-*`)으로 인증하는 경우,
Anthropic이 현재 그 조합을 HTTP 401로 거부하므로 OpenClaw는 `context-1m-*`
베타 헤더를 건너뜁니다.

## 토큰 부담을 줄이기 위한 팁

- 긴 세션은 `/compact`를 사용해 요약하세요.
- 워크플로우에서 큰 도구 출력을 잘라내세요.
- 스크린샷이 많은 세션에서는 `agents.defaults.imageMaxDimensionPx`를 낮추세요.
- Skill 설명은 짧게 유지하세요(Skills 목록은 프롬프트에 주입됨).
- 장황하고 탐색적인 작업에는 더 작은 모델을 선호하세요.

정확한 Skills 목록 오버헤드 계산식은 [Skills](/ko/tools/skills)를 참조하세요.
