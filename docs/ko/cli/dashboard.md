---
read_when:
    - 현재 토큰으로 Control UI를 열려고 합니다
    - 브라우저를 실행하지 않고 URL을 출력하려고 합니다
summary: Control UI를 여는 `openclaw dashboard`용 CLI 참조
title: 대시보드
x-i18n:
    generated_at: "2026-04-25T12:23:35Z"
    model: gpt-5.4
    provider: openai
    source_hash: ce485388465fb93551be8ccf0aa01ea52e4feb949ef0d48c96b4f8ea65a6551c
    source_path: cli/dashboard.md
    workflow: 15
---

# `openclaw dashboard`

현재 인증을 사용해 Control UI를 엽니다.

```bash
openclaw dashboard
openclaw dashboard --no-open
```

참고:

- `dashboard`는 가능하면 구성된 `gateway.auth.token` SecretRef를 확인합니다.
- `dashboard`는 `gateway.tls.enabled`를 따릅니다. TLS가 활성화된 Gateway는 `https://` Control UI URL을 출력하거나 열고, `wss://`를 통해 연결합니다.
- SecretRef로 관리되는 토큰의 경우(확인되었거나 확인되지 않았거나), `dashboard`는 외부 비밀이 터미널 출력, 클립보드 기록 또는 브라우저 실행 인수에 노출되지 않도록 토큰이 없는 URL을 출력/복사/엽니다.
- `gateway.auth.token`이 SecretRef로 관리되지만 이 명령 경로에서 확인되지 않으면, 명령은 잘못된 토큰 플레이스홀더를 포함하는 대신 토큰이 없는 URL과 명시적인 해결 안내를 출력합니다.

## 관련 항목

- [CLI reference](/ko/cli)
- [대시보드](/ko/web/dashboard)
