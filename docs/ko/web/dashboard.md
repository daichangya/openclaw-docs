---
read_when:
    - 대시보드 인증 또는 노출 모드 변경하기
summary: Gateway 대시보드(Control UI) 액세스 및 인증
title: 대시보드
x-i18n:
    generated_at: "2026-04-24T06:49:40Z"
    model: gpt-5.4
    provider: openai
    source_hash: 8753e0edf0a04e4c36b76aa6973dcd9d903a98c0b85e498bfcb05e728bb6272b
    source_path: web/dashboard.md
    workflow: 15
---

Gateway 대시보드는 기본적으로 `/`에서 제공되는 브라우저 Control UI입니다
(`gateway.controlUi.basePath`로 재정의 가능).

빠르게 열기(로컬 Gateway):

- [http://127.0.0.1:18789/](http://127.0.0.1:18789/) (또는 [http://localhost:18789/](http://localhost:18789/))

주요 참조:

- 사용법 및 UI 기능은 [Control UI](/ko/web/control-ui)
- Serve/Funnel 자동화는 [Tailscale](/ko/gateway/tailscale)
- bind 모드 및 보안 참고는 [웹 표면](/ko/web)

인증은 구성된 gateway
auth 경로를 통해 WebSocket 핸드셰이크 시 강제됩니다:

- `connect.params.auth.token`
- `connect.params.auth.password`
- `gateway.auth.allowTailscale: true`일 때 Tailscale Serve identity 헤더
- `gateway.auth.mode: "trusted-proxy"`일 때 trusted-proxy identity 헤더

`gateway.auth`는 [Gateway 구성](/ko/gateway/configuration)을 참조하세요.

보안 참고: Control UI는 **관리자 표면**입니다(채팅, 구성, exec 승인).
공개적으로 노출하지 마세요. UI는 현재 브라우저 탭 세션과 선택된 gateway URL에 대한 대시보드 URL 토큰을 sessionStorage에 보관하고, 로드 후 URL에서 제거합니다.
localhost, Tailscale Serve 또는 SSH 터널을 권장합니다.

## 빠른 경로(권장)

- 온보딩 후 CLI는 대시보드를 자동으로 열고 깔끔한(토큰 없는) 링크를 출력합니다.
- 언제든 다시 열기: `openclaw dashboard` (링크 복사, 가능하면 브라우저 열기, 헤드리스면 SSH 힌트 표시)
- UI가 shared-secret 인증을 요구하면 구성된 토큰 또는
  비밀번호를 Control UI 설정에 붙여 넣으세요.

## 인증 기본 사항(로컬 vs 원격)

- **Localhost**: `http://127.0.0.1:18789/`를 여세요.
- **Shared-secret 토큰 소스**: `gateway.auth.token` (또는
  `OPENCLAW_GATEWAY_TOKEN`); `openclaw dashboard`는 이를 일회성 부트스트랩용 URL fragment로 전달할 수 있으며, Control UI는 이를 localStorage 대신
  현재 브라우저 탭 세션과 선택된 gateway URL에 대해 sessionStorage에 보관합니다.
- `gateway.auth.token`이 SecretRef로 관리되면 `openclaw dashboard`는
  설계상 토큰 없는 URL을 출력/복사/열기 합니다. 이는 외부에서 관리되는 토큰이 셸 로그, 클립보드 기록 또는 브라우저 실행 인수에 노출되는 것을 방지합니다.
- `gateway.auth.token`이 SecretRef로 구성되어 있고 현재
  셸에서 해석되지 않은 경우에도 `openclaw dashboard`는 토큰 없는 URL과
  실행 가능한 인증 설정 안내를 함께 출력합니다.
- **Shared-secret 비밀번호**: 구성된 `gateway.auth.password`(또는
  `OPENCLAW_GATEWAY_PASSWORD`)를 사용하세요. 대시보드는 비밀번호를 reload 사이에 유지하지 않습니다.
- **identity-bearing 모드**: `gateway.auth.allowTailscale: true`이면 Tailscale Serve가 identity 헤더를 통해 Control UI/WebSocket
  인증을 충족할 수 있고, non-loopback identity-aware reverse proxy는
  `gateway.auth.mode: "trusted-proxy"`를 충족할 수 있습니다. 이러한 모드에서는 대시보드가 WebSocket용 pasted shared secret을
  필요로 하지 않습니다.
- **localhost가 아님**: Tailscale Serve, non-loopback shared-secret bind, `gateway.auth.mode: "trusted-proxy"`가 적용된
  non-loopback identity-aware reverse proxy, 또는 SSH 터널을 사용하세요. HTTP API는 의도적으로 private-ingress
  `gateway.auth.mode: "none"` 또는 trusted-proxy HTTP auth를 사용하지 않는 한 여전히
  shared-secret auth를 사용합니다. [웹 표면](/ko/web)을 참조하세요.

<a id="if-you-see-unauthorized-1008"></a>

## "unauthorized" / 1008이 보이면

- gateway에 도달 가능한지 확인하세요(로컬: `openclaw status`; 원격: SSH 터널 `ssh -N -L 18789:127.0.0.1:18789 user@host` 후 `http://127.0.0.1:18789/` 열기).
- `AUTH_TOKEN_MISMATCH`의 경우 gateway가 retry 힌트를 반환하면 클라이언트는 캐시된 device token으로 한 번의 신뢰된 재시도를 수행할 수 있습니다. 해당 캐시된 토큰 재시도는 토큰의 캐시된 승인 scope를 재사용합니다. 명시적 `deviceToken` / 명시적 `scopes` 호출자는 요청한 scope 집합을 유지합니다. 그 재시도 후에도 auth가 실패하면 토큰 드리프트를 수동으로 해결하세요.
- 해당 재시도 경로 밖에서는 connect auth 우선순위가 명시적 shared token/password 우선, 그다음 명시적 `deviceToken`, 그다음 저장된 device token, 그다음 bootstrap token입니다.
- 비동기 Tailscale Serve Control UI 경로에서는 동일한
  `{scope, ip}`에 대한 실패한 시도가 failed-auth limiter에 기록되기 전에 직렬화되므로,
  두 번째 동시 잘못된 재시도는 이미 `retry later`를 표시할 수 있습니다.
- 토큰 드리프트 복구 단계는 [토큰 드리프트 복구 체크리스트](/ko/cli/devices#token-drift-recovery-checklist)를 따르세요.
- gateway 호스트에서 shared secret을 가져오거나 제공하세요:
  - 토큰: `openclaw config get gateway.auth.token`
  - 비밀번호: 구성된 `gateway.auth.password` 또는
    `OPENCLAW_GATEWAY_PASSWORD` 해석
  - SecretRef로 관리되는 토큰: 외부 secret provider를 해석하거나 이 셸에서
    `OPENCLAW_GATEWAY_TOKEN`을 export한 다음 `openclaw dashboard`를 다시 실행
  - 구성된 shared secret이 없음: `openclaw doctor --generate-gateway-token`
- 대시보드 설정에서 인증 필드에 토큰 또는 비밀번호를 붙여 넣은 뒤,
  연결하세요.
- UI 언어 선택기는 **Overview -> Gateway Access -> Language**에 있습니다.
  Appearance 섹션이 아니라 access 카드의 일부입니다.

## 관련

- [Control UI](/ko/web/control-ui)
- [WebChat](/ko/web/webchat)
