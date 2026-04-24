---
read_when:
    - Provider 재시도 동작 또는 기본값 업데이트하기
    - Provider 전송 오류 또는 속도 제한 디버깅
summary: 아웃바운드 Provider 호출을 위한 재시도 정책
title: 재시도 정책
x-i18n:
    generated_at: "2026-04-24T06:11:49Z"
    model: gpt-5.4
    provider: openai
    source_hash: 38811a6dabb0b60b71167ee4fcc09fb042f941b4bbb1cf8b0f5a91c3c93b2e75
    source_path: concepts/retry.md
    workflow: 15
---

## 목표

- 다단계 흐름별이 아니라 HTTP 요청별로 재시도합니다.
- 현재 단계만 재시도하여 순서를 보존합니다.
- 멱등하지 않은 작업의 중복 실행을 피합니다.

## 기본값

- 시도 횟수: 3
- 최대 지연 상한: 30000 ms
- 지터: 0.1 (10퍼센트)
- Provider 기본값:
  - Telegram 최소 지연: 400 ms
  - Discord 최소 지연: 500 ms

## 동작

### 모델 Provider

- OpenClaw는 Provider SDK가 일반적인 짧은 재시도를 처리하도록 둡니다.
- Anthropic 및 OpenAI 같은 Stainless 기반 SDK의 경우, 재시도 가능한 응답(`408`, `409`, `429`, `5xx`)에는 `retry-after-ms` 또는 `retry-after`가 포함될 수 있습니다. 이 대기 시간이 60초보다 길면 OpenClaw는 `x-should-retry: false`를 주입하여 SDK가 즉시 오류를 노출하게 하고, 모델 failover가 다른 auth profile 또는 폴백 모델로 전환할 수 있게 합니다.
- 상한은 `OPENCLAW_SDK_RETRY_MAX_WAIT_SECONDS=<seconds>`로 재정의할 수 있습니다.
  이를 `0`, `false`, `off`, `none`, `disabled`로 설정하면 SDK가 긴 `Retry-After` 대기를 내부적으로 따르도록 허용합니다.

### Discord

- 속도 제한 오류(HTTP 429)에서만 재시도합니다.
- 가능한 경우 Discord `retry_after`를 사용하고, 그렇지 않으면 지수 백오프를 사용합니다.

### Telegram

- 일시적 오류(429, timeout, connect/reset/closed, temporarily unavailable)에서 재시도합니다.
- 가능한 경우 `retry_after`를 사용하고, 그렇지 않으면 지수 백오프를 사용합니다.
- Markdown 파싱 오류는 재시도하지 않으며, 일반 텍스트로 폴백합니다.

## 구성

`~/.openclaw/openclaw.json`에서 Provider별 재시도 정책을 설정합니다.

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

- 재시도는 요청별로 적용됩니다(메시지 전송, 미디어 업로드, 반응, 폴, 스티커).
- 복합 흐름은 이미 완료된 단계를 재시도하지 않습니다.

## 관련 문서

- [모델 failover](/ko/concepts/model-failover)
- [명령 큐](/ko/concepts/queue)
