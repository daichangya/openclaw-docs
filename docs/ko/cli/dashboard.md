---
read_when:
    - 현재 토큰으로 Control UI를 열고 싶으신 것입니다
    - 브라우저를 실행하지 않고 URL을 출력하고 싶으신 것입니다
summary: '`openclaw dashboard`에 대한 CLI 참조(Control UI 열기)'
title: 대시보드
x-i18n:
    generated_at: "2026-04-24T06:07:20Z"
    model: gpt-5.4
    provider: openai
    source_hash: 0864d9c426832ffb9e2acd9d7cb7fc677d859a5b7588132e993a36a5c5307802
    source_path: cli/dashboard.md
    workflow: 15
---

# `openclaw dashboard`

현재 인증을 사용하여 Control UI를 엽니다.

```bash
openclaw dashboard
openclaw dashboard --no-open
```

참고:

- `dashboard`는 가능하면 구성된 `gateway.auth.token` SecretRef를 확인합니다.
- SecretRef로 관리되는 토큰(확인되었거나 확인되지 않았거나)의 경우 `dashboard`는 터미널 출력, 클립보드 기록 또는 브라우저 실행 인수에 외부 secret이 노출되지 않도록 토큰이 포함되지 않은 URL을 출력/복사/엽니다.
- `gateway.auth.token`이 SecretRef로 관리되지만 이 명령 경로에서 확인되지 않은 경우, 이 명령은 잘못된 토큰 플레이스홀더를 포함하는 대신 토큰이 포함되지 않은 URL과 명시적인 해결 안내를 출력합니다.

## 관련

- [CLI 참조](/ko/cli)
- [Dashboard](/ko/web/dashboard)
