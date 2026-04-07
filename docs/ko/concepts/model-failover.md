---
read_when:
    - 인증 프로필 순환, 쿨다운 또는 모델 폴백 동작을 진단할 때
    - 인증 프로필 또는 모델에 대한 폴백 규칙을 업데이트할 때
    - 세션 모델 오버라이드가 폴백 재시도와 어떻게 상호작용하는지 이해할 때
summary: OpenClaw가 인증 프로필을 순환하고 모델 간에 폴백하는 방식
title: 모델 폴백
x-i18n:
    generated_at: "2026-04-07T05:55:49Z"
    model: gpt-5.4
    provider: openai
    source_hash: d88821e229610f236bdab3f798d5e8c173f61a77c01017cc87431126bf465e32
    source_path: concepts/model-failover.md
    workflow: 15
---

# 모델 폴백

OpenClaw는 실패를 두 단계로 처리합니다.

1. 현재 제공자 내에서의 **인증 프로필 순환**
2. `agents.defaults.model.fallbacks`의 다음 모델로의 **모델 폴백**

이 문서는 런타임 규칙과 이를 뒷받침하는 데이터를 설명합니다.

## 런타임 흐름

일반적인 텍스트 실행에서 OpenClaw는 다음 순서로 후보를 평가합니다.

1. 현재 선택된 세션 모델
2. 순서대로 구성된 `agents.defaults.model.fallbacks`
3. 실행이 오버라이드에서 시작된 경우 마지막에 구성된 기본 모델

각 후보 내부에서 OpenClaw는 다음 모델 후보로 넘어가기 전에 인증 프로필 폴백을 시도합니다.

상위 수준 순서:

1. 활성 세션 모델과 인증 프로필 기본 설정을 확인합니다.
2. 모델 후보 체인을 구성합니다.
3. 인증 프로필 순환/쿨다운 규칙으로 현재 제공자를 시도합니다.
4. 해당 제공자가 폴백할 가치가 있는 오류로 모두 소진되면 다음 모델 후보로 이동합니다.
5. 재시도가 시작되기 전에 선택된 폴백 오버라이드를 유지하여 다른 세션 리더가 러너가 곧 사용할 동일한 제공자/모델을 보도록 합니다.
6. 폴백 후보가 실패하면 여전히 해당 실패한 후보와 일치하는 경우에만 폴백이 소유한 세션 오버라이드 필드를 롤백합니다.
7. 모든 후보가 실패하면 각 시도별 세부 정보와, 알 수 있는 경우 가장 이른 쿨다운 만료 시점을 포함한 `FallbackSummaryError`를 발생시킵니다.

이 방식은 의도적으로 "전체 세션을 저장하고 복원"하는 것보다 범위가 좁습니다. 응답 러너는 폴백을 위해 자신이 소유한 모델 선택 필드만 유지합니다.

- `providerOverride`
- `modelOverride`
- `authProfileOverride`
- `authProfileOverrideSource`
- `authProfileOverrideCompactionCount`

이렇게 하면 실패한 폴백 재시도로 인해 시도 실행 중 발생한 수동 `/model` 변경이나 세션 순환 업데이트 같은 더 새로운 관련 없는 세션 변경이 덮어써지는 것을 방지할 수 있습니다.

## 인증 저장소(키 + OAuth)

OpenClaw는 API 키와 OAuth 토큰 모두에 **인증 프로필**을 사용합니다.

- 시크릿은 `~/.openclaw/agents/<agentId>/agent/auth-profiles.json`에 저장됩니다(레거시: `~/.openclaw/agent/auth-profiles.json`).
- 런타임 인증 라우팅 상태는 `~/.openclaw/agents/<agentId>/agent/auth-state.json`에 저장됩니다.
- 구성 `auth.profiles` / `auth.order`는 **메타데이터 + 라우팅 전용**입니다(시크릿 없음).
- 레거시 가져오기 전용 OAuth 파일: `~/.openclaw/credentials/oauth.json`(첫 사용 시 `auth-profiles.json`으로 가져옴)

자세한 내용: [/concepts/oauth](/ko/concepts/oauth)

자격 증명 유형:

- `type: "api_key"` → `{ provider, key }`
- `type: "oauth"` → `{ provider, access, refresh, expires, email? }` (+ 일부 제공자의 경우 `projectId`/`enterpriseUrl`)

## 프로필 ID

OAuth 로그인은 여러 계정이 공존할 수 있도록 고유한 프로필을 생성합니다.

- 기본값: 이메일을 사용할 수 없을 때 `provider:default`
- 이메일이 있는 OAuth: `provider:<email>`(예: `google-antigravity:user@gmail.com`)

프로필은 `~/.openclaw/agents/<agentId>/agent/auth-profiles.json`의 `profiles` 아래에 저장됩니다.

## 순환 순서

제공자에 여러 프로필이 있는 경우 OpenClaw는 다음과 같은 순서로 선택합니다.

1. **명시적 구성**: `auth.order[provider]`(설정된 경우)
2. **구성된 프로필**: 제공자로 필터링된 `auth.profiles`
3. **저장된 프로필**: 해당 제공자의 `auth-profiles.json` 항목

명시적 순서가 구성되지 않은 경우, OpenClaw는 라운드 로빈 순서를 사용합니다.

- **기본 키:** 프로필 유형(**API 키보다 OAuth 우선**)
- **보조 키:** `usageStats.lastUsed`(각 유형 내에서 가장 오래된 것부터)
- **쿨다운/비활성화된 프로필**은 가장 빠른 만료 순으로 끝으로 이동됩니다.

### 세션 고정성(캐시 친화적)

OpenClaw는 제공자 캐시를 따뜻하게 유지하기 위해 **세션별로 선택된 인증 프로필을 고정**합니다.
모든 요청마다 순환하지는 않습니다. 고정된 프로필은 다음 중 하나가 발생할 때까지 재사용됩니다.

- 세션이 재설정됨(`/new` / `/reset`)
- 컴팩션이 완료됨(컴팩션 카운트 증가)
- 프로필이 쿨다운/비활성화 상태임

`/model …@<profileId>`를 통한 수동 선택은 해당 세션에 대한 **사용자 오버라이드**를 설정하며, 새 세션이 시작될 때까지 자동 순환되지 않습니다.

자동으로 고정된 프로필(세션 라우터가 선택한 프로필)은 **기본 설정**으로 취급됩니다.
즉, 먼저 시도되지만, 속도 제한/타임아웃 시 OpenClaw가 다른 프로필로 순환할 수 있습니다.
사용자가 고정한 프로필은 해당 프로필에 계속 잠겨 있으며, 이 프로필이 실패하고 모델 폴백이 구성되어 있으면 OpenClaw는 프로필을 전환하는 대신 다음 모델로 이동합니다.

### OAuth가 "사라진 것처럼" 보일 수 있는 이유

동일한 제공자에 대해 OAuth 프로필과 API 키 프로필이 모두 있는 경우, 고정되지 않았다면 라운드 로빈으로 인해 메시지 간에 이 둘 사이를 전환할 수 있습니다. 단일 프로필을 강제로 사용하려면 다음과 같이 하세요.

- `auth.order[provider] = ["provider:profileId"]`로 고정하거나
- 세션별 오버라이드가 있는 `/model …`을 사용합니다(사용 중인 UI/채팅 표면에서 지원되는 경우).

## 쿨다운

프로필이 인증/속도 제한 오류(또는 속도 제한처럼 보이는 타임아웃)로 실패하면 OpenClaw는 해당 프로필을 쿨다운 상태로 표시하고 다음 프로필로 이동합니다.
이 속도 제한 버킷은 단순한 `429`보다 더 광범위합니다. `Too many concurrent requests`, `ThrottlingException`,
`concurrency limit reached`, `workers_ai ... quota limit exceeded`,
`throttled`, `resource exhausted`, `weekly/monthly limit reached` 같은
제공자 메시지도 포함합니다.
형식/잘못된 요청 오류(예: Cloud Code Assist 도구 호출 ID
유효성 검사 실패)는 폴백할 가치가 있는 것으로 처리되며 동일한 쿨다운을 사용합니다.
`Unhandled stop reason: error`,
`stop reason: error`, `reason: error` 같은 OpenAI 호환 stop-reason 오류는 타임아웃/폴백
신호로 분류됩니다.
제공자 범위의 일반 서버 텍스트도 소스가 알려진 일시적 패턴과 일치하면 해당 타임아웃 버킷에 들어갈 수 있습니다. 예를 들어 Anthropic의 단순한
`An unknown error occurred` 및 `internal server error`, `unknown error, 520`, `upstream error`,
`backend error` 같은 일시적 서버 텍스트를 포함한 JSON `api_error` 페이로드는 폴백할 가치가 있는 타임아웃으로 처리됩니다. OpenRouter 전용의
일반 업스트림 텍스트인 단순한 `Provider returned error`도 제공자 컨텍스트가 실제로 OpenRouter인 경우에만 타임아웃으로 처리됩니다. `LLM request failed with an unknown error.` 같은 일반 내부 폴백 텍스트는
보수적으로 유지되며 그 자체만으로는 폴백을 트리거하지 않습니다.

속도 제한 쿨다운은 모델 범위일 수도 있습니다.

- OpenClaw는 실패한 모델 ID를 알 수 있을 때 속도 제한 실패에 대해 `cooldownModel`을 기록합니다.
- 동일한 제공자에 있는 형제 모델은 쿨다운 범위가 다른 모델에 지정된 경우에도 여전히 시도할 수 있습니다.
- 과금/비활성화 기간은 모델 전반에서 전체 프로필을 계속 차단합니다.

쿨다운은 지수 백오프를 사용합니다.

- 1분
- 5분
- 25분
- 1시간(상한)

상태는 `auth-state.json`의 `usageStats` 아래에 저장됩니다.

```json
{
  "usageStats": {
    "provider:profile": {
      "lastUsed": 1736160000000,
      "cooldownUntil": 1736160600000,
      "errorCount": 2
    }
  }
}
```

## 과금 비활성화

과금/크레딧 실패(예: "insufficient credits" / "credit balance too low")는 폴백할 가치가 있는 것으로 처리되지만, 일반적으로 일시적이지는 않습니다. 짧은 쿨다운 대신 OpenClaw는 프로필을 **비활성화됨**으로 표시하고(더 긴 백오프와 함께) 다음 프로필/제공자로 순환합니다.

모든 과금 관련 응답이 `402`인 것은 아니며, 모든 HTTP `402`가
여기에 해당하는 것도 아닙니다. OpenClaw는 제공자가 대신 `401` 또는 `403`을 반환하더라도
명시적인 과금 텍스트를 과금 경로에 유지하지만, 제공자별 매처는 해당 매처를 소유한 제공자 범위로 제한됩니다(예: OpenRouter `403 Key limit
exceeded`). 한편, 일시적인 `402` 사용량 기간 및
조직/워크스페이스 지출 한도 오류는 메시지가 재시도 가능해 보일 경우 `rate_limit`으로 분류됩니다(예: `weekly usage limit exhausted`, `daily
limit reached, resets tomorrow`, `organization spending limit exceeded`).
이러한 경우는 긴 과금 비활성화 경로 대신 짧은 쿨다운/폴백 경로에 남습니다.

상태는 `auth-state.json`에 저장됩니다.

```json
{
  "usageStats": {
    "provider:profile": {
      "disabledUntil": 1736178000000,
      "disabledReason": "billing"
    }
  }
}
```

기본값:

- 과금 백오프는 **5시간**에서 시작하여 과금 실패마다 두 배가 되고 **24시간**에서 상한에 도달합니다.
- 프로필이 **24시간** 동안 실패하지 않으면 백오프 카운터가 재설정됩니다(구성 가능).
- 과부하 재시도는 모델 폴백 전에 **동일 제공자 프로필 순환 1회**를 허용합니다.
- 과부하 재시도는 기본적으로 **0ms 백오프**를 사용합니다.

## 모델 폴백

제공자의 모든 프로필이 실패하면 OpenClaw는
`agents.defaults.model.fallbacks`의 다음 모델로 이동합니다. 이는 인증 실패, 속도 제한, 그리고
프로필 순환이 모두 소진된 타임아웃에 적용됩니다(다른 오류는 폴백을 진행시키지 않음).

과부하 및 속도 제한 오류는 과금 쿨다운보다 더 적극적으로 처리됩니다. 기본적으로 OpenClaw는 동일 제공자 인증 프로필 재시도 한 번을 허용한 뒤, 기다리지 않고 다음으로 구성된 모델 폴백으로 전환합니다.
`ModelNotReadyException` 같은 제공자 바쁨 신호는 이 과부하 버킷에 들어갑니다. 이를 `auth.cooldowns.overloadedProfileRotations`,
`auth.cooldowns.overloadedBackoffMs`,
`auth.cooldowns.rateLimitedProfileRotations`로 조정할 수 있습니다.

실행이 모델 오버라이드(훅 또는 CLI)에서 시작되더라도, 모든 구성된 폴백을 시도한 후 폴백은 여전히
`agents.defaults.model.primary`에서 끝납니다.

### 후보 체인 규칙

OpenClaw는 현재 요청된 `provider/model`과
구성된 폴백으로부터 후보 목록을 구성합니다.

규칙:

- 요청된 모델은 항상 첫 번째입니다.
- 명시적으로 구성된 폴백은 중복 제거되지만 모델
  허용 목록에 따라 필터링되지는 않습니다. 이는 명시적인 운영자 의도로 취급됩니다.
- 현재 실행이 동일한 제공자
  계열의 구성된 폴백 위에 이미 있는 경우, OpenClaw는 전체 구성 체인을 계속 사용합니다.
- 현재 실행이 구성과 다른 제공자에 있고, 해당 현재
  모델이 구성된 폴백 체인의 일부가 아닌 경우, OpenClaw는
  다른 제공자의 관련 없는 구성된 폴백을 추가하지 않습니다.
- 실행이 오버라이드에서 시작된 경우, 앞선
  후보가 모두 소진되면 체인이 다시 일반 기본값으로 정착할 수 있도록 구성된 기본 모델이 끝에 추가됩니다.

### 어떤 오류가 폴백을 진행시키는가

모델 폴백은 다음에서 계속 진행됩니다.

- 인증 실패
- 속도 제한 및 쿨다운 소진
- 과부하/제공자 바쁨 오류
- 타임아웃 형태의 폴백 오류
- 과금 비활성화
- `LiveSessionModelSwitchError`는 폴백 경로로 정규화되어
  오래된 유지 모델이 외부 재시도 루프를 만들지 않도록 합니다
- 다른 인식되지 않은 오류도 여전히 남은 후보가 있는 경우

모델 폴백은 다음에서는 계속 진행되지 않습니다.

- 타임아웃/폴백 형태가 아닌 명시적 중단
- 컴팩션/재시도 로직 내부에 머물러야 하는 컨텍스트 오버플로 오류
  (예: `request_too_large`, `INVALID_ARGUMENT: input exceeds the maximum
number of tokens`, `input token count exceeds the maximum number of input
tokens`, `The input is too long for the model`, `ollama error: context
length exceeded`)
- 남은 후보가 없을 때의 최종 알 수 없는 오류

### 쿨다운 건너뛰기 vs 프로브 동작

제공자의 모든 인증 프로필이 이미 쿨다운 상태여도 OpenClaw는
해당 제공자를 영원히 자동으로 건너뛰지 않습니다. 후보별 결정을 내립니다.

- 지속적인 인증 실패는 전체 제공자를 즉시 건너뜁니다.
- 과금 비활성화는 일반적으로 건너뛰지만, 기본 후보는
  재시작 없이 복구할 수 있도록 스로틀을 두고 여전히 프로브될 수 있습니다.
- 기본 후보는 쿨다운 만료에 가까워지면 제공자별
  스로틀을 두고 프로브될 수 있습니다.
- 동일 제공자 폴백 형제 모델은 실패가 일시적으로 보일 때(`rate_limit`, `overloaded` 또는 알 수 없음) 쿨다운 상태여도 시도될 수 있습니다. 이는 속도 제한이 모델 범위이고 형제 모델이
  여전히 즉시 복구될 수 있는 경우에 특히 중요합니다.
- 일시적인 쿨다운 프로브는 폴백 실행당 제공자별로 하나로 제한되므로,
  단일 제공자가 교차 제공자 폴백을 지연시키지 않습니다.

## 세션 오버라이드와 라이브 모델 전환

세션 모델 변경은 공유 상태입니다. 활성 러너, `/model` 명령,
컴팩션/세션 업데이트, 라이브 세션 조정은 모두 동일한 세션 항목의 일부를 읽거나 씁니다.

즉, 폴백 재시도는 라이브 모델 전환과 조정되어야 합니다.

- 명시적인 사용자 주도 모델 변경만 보류 중인 라이브 전환을 표시합니다. 여기에는 `/model`, `session_status(model=...)`, `sessions.patch`가 포함됩니다.
- 폴백 순환, 하트비트 오버라이드,
  컴팩션 같은 시스템 주도 모델 변경은 자체적으로 보류 중인 라이브 전환을 표시하지 않습니다.
- 폴백 재시도가 시작되기 전에 응답 러너는 선택된
  폴백 오버라이드 필드를 세션 항목에 유지합니다.
- 라이브 세션 조정은 오래된
  런타임 모델 필드보다 유지된 세션 오버라이드를 우선합니다.
- 폴백 시도가 실패하면 러너는 자신이 쓴 오버라이드 필드만,
  그리고 여전히 해당 실패한 후보와 일치하는 경우에만 롤백합니다.

이렇게 하면 고전적인 경쟁 상태를 방지할 수 있습니다.

1. 기본 모델이 실패합니다.
2. 메모리에서 폴백 후보가 선택됩니다.
3. 세션 저장소에는 여전히 이전 기본 모델이 기록되어 있습니다.
4. 라이브 세션 조정이 오래된 세션 상태를 읽습니다.
5. 재시도가 폴백 시도가 시작되기 전에 이전 모델로 되돌려집니다.

유지된 폴백 오버라이드는 이 틈을 닫고, 좁은 범위의 롤백은 더 새로운 수동 또는 런타임 세션 변경을 그대로 유지합니다.

## 가시성과 실패 요약

`runWithModelFallback(...)`은 로그와
사용자 대상 쿨다운 메시지에 사용되는 시도별 세부 정보를 기록합니다.

- 시도한 제공자/모델
- 이유(`rate_limit`, `overloaded`, `billing`, `auth`, `model_not_found` 및
  유사한 폴백 이유)
- 선택적 상태/코드
- 사람이 읽을 수 있는 오류 요약

모든 후보가 실패하면 OpenClaw는 `FallbackSummaryError`를 발생시킵니다. 외부
응답 러너는 이를 사용해 "모든 모델이 일시적으로 속도 제한 상태입니다" 같은 더 구체적인 메시지를 만들고, 알 수 있는 경우 가장 이른 쿨다운 만료 시점을 포함할 수 있습니다.

이 쿨다운 요약은 모델 인식형입니다.

- 시도된
  제공자/모델 체인과 무관한 모델 범위 속도 제한은 무시됩니다.
- 남아 있는 차단이 일치하는 모델 범위 속도 제한인 경우, OpenClaw는
  여전히 해당 모델을 차단하는 마지막 일치 만료 시점을 보고합니다.

## 관련 구성

다음 항목은 [게이트웨이 구성](/ko/gateway/configuration)을 참조하세요.

- `auth.profiles` / `auth.order`
- `auth.cooldowns.billingBackoffHours` / `auth.cooldowns.billingBackoffHoursByProvider`
- `auth.cooldowns.billingMaxHours` / `auth.cooldowns.failureWindowHours`
- `auth.cooldowns.overloadedProfileRotations` / `auth.cooldowns.overloadedBackoffMs`
- `auth.cooldowns.rateLimitedProfileRotations`
- `agents.defaults.model.primary` / `agents.defaults.model.fallbacks`
- `agents.defaults.imageModel` 라우팅

더 넓은 모델 선택 및 폴백 개요는 [모델](/ko/concepts/models)을 참조하세요.
