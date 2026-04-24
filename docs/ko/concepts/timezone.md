---
read_when:
    - 모델에 대해 타임스탬프가 어떻게 정규화되는지 이해해야 합니다.
    - 시스템 프롬프트용 사용자 시간대를 구성하는 중입니다.
summary: 에이전트, 엔벌로프, 프롬프트에 대한 시간대 처리
title: 시간대
x-i18n:
    generated_at: "2026-04-24T06:12:29Z"
    model: gpt-5.4
    provider: openai
    source_hash: 8318acb0269f446fb3d3198f47811d40490a9ee9593fed82f31353aef2bacb81
    source_path: concepts/timezone.md
    workflow: 15
---

OpenClaw는 모델이 **하나의 기준 시간**을 보도록 타임스탬프를 표준화합니다.

## 메시지 엔벌로프(기본값: 로컬)

인바운드 메시지는 다음과 같은 엔벌로프로 래핑됩니다.

```
[Provider ... 2026-01-05 16:26 PST] message text
```

엔벌로프의 타임스탬프는 기본적으로 **호스트 로컬 시간대**이며, 분 단위 정밀도를 가집니다.

다음으로 이를 재정의할 수 있습니다.

```json5
{
  agents: {
    defaults: {
      envelopeTimezone: "local", // "utc" | "local" | "user" | IANA timezone
      envelopeTimestamp: "on", // "on" | "off"
      envelopeElapsed: "on", // "on" | "off"
    },
  },
}
```

- `envelopeTimezone: "utc"`는 UTC를 사용합니다.
- `envelopeTimezone: "user"`는 `agents.defaults.userTimezone`을 사용합니다(없으면 호스트 시간대로 대체).
- 고정 오프셋에는 명시적 IANA 시간대(예: `"Europe/Vienna"`)를 사용하세요.
- `envelopeTimestamp: "off"`는 엔벌로프 헤더에서 절대 타임스탬프를 제거합니다.
- `envelopeElapsed: "off"`는 경과 시간 접미사(`+2m` 형식)를 제거합니다.

### 예시

**로컬(기본값):**

```
[Signal Alice +1555 2026-01-18 00:19 PST] hello
```

**고정 시간대:**

```
[Signal Alice +1555 2026-01-18 06:19 GMT+1] hello
```

**경과 시간:**

```
[Signal Alice +1555 +2m 2026-01-18T05:19Z] follow-up
```

## 도구 페이로드(원시 제공자 데이터 + 정규화된 필드)

도구 호출(`channels.discord.readMessages`, `channels.slack.readMessages` 등)은 **원시 제공자 타임스탬프**를 반환합니다.
일관성을 위해 정규화된 필드도 함께 첨부됩니다.

- `timestampMs` (UTC epoch 밀리초)
- `timestampUtc` (ISO 8601 UTC 문자열)

원시 제공자 필드는 보존됩니다.

## 시스템 프롬프트용 사용자 시간대

모델에 사용자의 로컬 시간대를 알려주려면 `agents.defaults.userTimezone`을 설정하세요. 설정하지 않으면 OpenClaw는 **런타임에 호스트 시간대**를 확인합니다(config 쓰기 없음).

```json5
{
  agents: { defaults: { userTimezone: "America/Chicago" } },
}
```

시스템 프롬프트에는 다음이 포함됩니다.

- 로컬 시간과 시간대가 포함된 `Current Date & Time` 섹션
- `Time format: 12-hour` 또는 `24-hour`

프롬프트 형식은 `agents.defaults.timeFormat` (`auto` | `12` | `24`)으로 제어할 수 있습니다.

전체 동작과 예시는 [날짜 및 시간](/ko/date-time)을 참조하세요.

## 관련 항목

- [Heartbeat](/ko/gateway/heartbeat) — 활성 시간은 일정 계산에 시간대를 사용
- [Cron 작업](/ko/automation/cron-jobs) — Cron 표현식은 일정 계산에 시간대를 사용
- [날짜 및 시간](/ko/date-time) — 전체 날짜/시간 동작 및 예시
