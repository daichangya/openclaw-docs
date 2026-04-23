---
read_when:
    - provider 재시도 동작 또는 기본값 업데이트하기
    - provider 전송 오류 또는 속도 제한 디버깅하기
summary: 발신 provider 호출에 대한 재시도 정책
title: 재시도 정책
x-i18n:
    generated_at: "2026-04-23T06:02:10Z"
    model: gpt-5.4
    provider: openai
    source_hash: aa16219d197492be15925dfd49359cfbed20e53ecdaa5309bbe122d4fe611e75
    source_path: concepts/retry.md
    workflow: 15
---

# 재시도 정책

## 목표

- 여러 단계 흐름 단위가 아니라 각 HTTP 요청 단위로 재시도합니다.
- 현재 단계만 재시도하여 순서를 보존합니다.
- 멱등성이 없는 작업의 중복 수행을 방지합니다.

## 기본값

- 시도 횟수: 3
- 최대 지연 상한: 30000 ms
- 지터: 0.1(10%)
- provider 기본값:
  - Telegram 최소 지연: 400 ms
  - Discord 최소 지연: 500 ms

## 동작

### 모델 provider

- OpenClaw는 일반적인 짧은 재시도는 provider SDK가 처리하도록 둡니다.
- Anthropic 및 OpenAI 같은 Stainless 기반 SDK의 경우, 재시도 가능한 응답(`408`, `409`, `429`, `5xx`)에는 `retry-after-ms` 또는 `retry-after`가 포함될 수 있습니다. 이 대기 시간이 60초보다 길면 OpenClaw는 `x-should-retry: false`를 주입하여 SDK가 오류를 즉시 표면화하도록 하고, 모델 장애 조치가 다른 인증 프로필이나 대체 모델로 전환할 수 있게 합니다.
- 상한은 `OPENCLAW_SDK_RETRY_MAX_WAIT_SECONDS=<seconds>`로 재정의할 수 있습니다.
  `0`, `false`, `off`, `none`, `disabled`로 설정하면 SDK가 긴 `Retry-After` 대기를 내부적으로 따르도록 합니다.

### Discord

- 속도 제한 오류(HTTP 429)에서만 재시도합니다.
- 가능하면 Discord `retry_after`를 사용하고, 그렇지 않으면 지수 백오프를 사용합니다.

### Telegram

- 일시적 오류(429, timeout, connect/reset/closed, temporarily unavailable)에서 재시도합니다.
- 가능하면 `retry_after`를 사용하고, 그렇지 않으면 지수 백오프를 사용합니다.
- Markdown 파싱 오류는 재시도하지 않으며, 일반 텍스트로 대체됩니다.

## 구성

`~/.openclaw/openclaw.json`에서 provider별 재시도 정책을 설정합니다.

```json5
{
  channels: {
    telegram: {
      retry: {
        attempts: 3,
        minDelayMs: 400,
        maxDelayMs: 30000,
        jitter: 0.1,
      },
    },
    discord: {
      retry: {
        attempts: 3,
        minDelayMs: 500,
        maxDelayMs: 30000,
        jitter: 0.1,
      },
    },
  },
}
```

## 참고

- 재시도는 각 요청 단위로 적용됩니다(메시지 전송, 미디어 업로드, 반응, 투표, 스티커).
- 복합 흐름은 이미 완료된 단계를 재시도하지 않습니다.
