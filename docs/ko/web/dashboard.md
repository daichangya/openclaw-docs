---
read_when:
    - 대시보드 인증 또는 노출 모드 변경
summary: Gateway 대시보드(Control UI) 액세스 및 인증
title: 대시보드
x-i18n:
    generated_at: "2026-04-25T12:30:11Z"
    model: gpt-5.4
    provider: openai
    source_hash: 5e0e7c8cebe715f96e7f0e967e9fd86c4c6c54f7cc08a4291b02515fc0933a1a
    source_path: web/dashboard.md
    workflow: 15
---

Gateway 대시보드는 기본적으로 `/`에서 제공되는 브라우저 Control UI입니다
(`gateway.controlUi.basePath`로 재정의 가능).

빠른 열기(로컬 Gateway):

- [http://127.0.0.1:18789/](http://127.0.0.1:18789/) (또는 [http://localhost:18789/](http://localhost:18789/))
- `gateway.tls.enabled: true`인 경우 `https://127.0.0.1:18789/` 및
  WebSocket 엔드포인트로 `wss://127.0.0.1:18789`를 사용하세요.

주요 참조:

- 사용법 및 UI 기능은 [Control UI](/ko/web/control-ui)
- Serve/Funnel 자동화는 [Tailscale](/ko/gateway/tailscale)
- bind 모드 및 보안 참고 사항은 [Web surfaces](/ko/web)

인증은 구성된 gateway 인증 경로를 통해 WebSocket 핸드셰이크 시 강제됩니다:

- `connect.params.auth.token`
- `connect.params.auth.password`
- `gateway.auth.allowTailscale: true`일 때 Tailscale Serve identity 헤더
- `gateway.auth.mode: "trusted-proxy"`일 때 trusted-proxy identity 헤더

[Gateway configuration](/ko/gateway/configuration)의 `gateway.auth`를 참조하세요.

보안 참고: Control UI는 **관리 표면**입니다(채팅, config, exec 승인).
공개적으로 노출하지 마세요. UI는 현재 브라우저 탭 세션과 선택된 gateway URL에 대해
대시보드 URL 토큰을 sessionStorage에 유지하고, 로드 후 URL에서 이를 제거합니다.
localhost, Tailscale Serve, 또는 SSH 터널을 권장합니다.

## 빠른 경로(권장)

- 온보딩 후 CLI가 대시보드를 자동으로 열고 깔끔한(토큰 없는) 링크를 출력합니다.
- 언제든 다시 열기: `openclaw dashboard` (링크 복사, 가능하면 브라우저 열기, 헤드리스면 SSH 힌트 표시).
- UI가 shared-secret 인증을 요구하면 구성된 token 또는
  password를 Control UI 설정에 붙여넣으세요.

## 인증 기본 사항(로컬 vs 원격)

- **Localhost**: `http://127.0.0.1:18789/`를 여세요.
- **Gateway TLS**: `gateway.tls.enabled: true`일 때 대시보드/상태 링크는
  `https://`를 사용하고, Control UI WebSocket 링크는 `wss://`를 사용합니다.
- **Shared-secret token 소스**: `gateway.auth.token` (또는
  `OPENCLAW_GATEWAY_TOKEN`); `openclaw dashboard`는 일회성 bootstrap을 위해 URL fragment로 이를 전달할 수 있으며, Control UI는 이를 localStorage 대신 현재 브라우저 탭 세션 및 선택된 gateway URL에 대해 sessionStorage에 보관합니다.
- `gateway.auth.token`이 SecretRef로 관리되는 경우 `openclaw dashboard`는
  의도적으로 토큰 없는 URL을 출력/복사/엽니다. 이렇게 하면 외부에서 관리되는 토큰이 셸 로그, 클립보드 기록, 또는 브라우저 실행 인자에 노출되는 것을 방지할 수 있습니다.
- `gateway.auth.token`이 SecretRef로 구성되어 있고 현재
  셸에서 확인되지 않는 경우에도 `openclaw dashboard`는 여전히 토큰 없는 URL과
  실행 가능한 인증 설정 안내를 출력합니다.
- **Shared-secret password**: 구성된 `gateway.auth.password`(또는
  `OPENCLAW_GATEWAY_PASSWORD`)를 사용하세요. 대시보드는 password를 새로고침 간에 유지하지 않습니다.
- **Identity-bearing 모드**: `gateway.auth.allowTailscale: true`일 때 Tailscale Serve는 identity 헤더를 통해 Control UI/WebSocket
  인증을 충족할 수 있으며, non-loopback identity-aware reverse proxy는
  `gateway.auth.mode: "trusted-proxy"`를 충족할 수 있습니다. 이러한 모드에서는 대시보드가
  WebSocket에 대해 pasted shared secret를 필요로 하지 않습니다.
- **localhost가 아닌 경우**: Tailscale Serve, non-loopback shared-secret bind, `gateway.auth.mode: "trusted-proxy"`가 설정된
  non-loopback identity-aware reverse proxy, 또는 SSH 터널을 사용하세요. HTTP API는 private-ingress
  `gateway.auth.mode: "none"` 또는 trusted-proxy HTTP auth를 의도적으로 실행하지 않는 한 여전히
  shared-secret 인증을 사용합니다. [Web surfaces](/ko/web)를 참조하세요.

<a id="if-you-see-unauthorized-1008"></a>

## "unauthorized" / 1008이 표시되는 경우

- gateway에 도달 가능한지 확인하세요(로컬: `openclaw status`; 원격: SSH 터널 `ssh -N -L 18789:127.0.0.1:18789 user@host` 후 `http://127.0.0.1:18789/` 열기).
- `AUTH_TOKEN_MISMATCH`의 경우, gateway가 재시도 힌트를 반환하면 클라이언트는 캐시된 device token으로 신뢰된 재시도 한 번을 수행할 수 있습니다. 이 cached-token 재시도는 토큰의 캐시된 승인 scope를 재사용합니다. 명시적 `deviceToken` / 명시적 `scopes` 호출자는 요청한 scope 집합을 그대로 유지합니다. 해당 재시도 후에도 인증이 실패하면 token drift를 수동으로 해결하세요.
- 해당 재시도 경로 외부에서는 connect auth 우선순위가 명시적인 shared token/password 우선, 그다음 명시적 `deviceToken`, 그다음 저장된 device token, 그다음 bootstrap token입니다.
- 비동기 Tailscale Serve Control UI 경로에서는 실패한 인증 제한기가 이를 기록하기 전에 동일한
  `{scope, ip}`에 대한 실패 시도가 직렬화되므로, 두 번째 동시 잘못된 재시도는 이미 `retry later`를 표시할 수 있습니다.
- token drift 복구 단계는 [Token drift recovery checklist](/ko/cli/devices#token-drift-recovery-checklist)를 따르세요.
- gateway 호스트에서 shared secret를 가져오거나 제공하세요:
  - Token: `openclaw config get gateway.auth.token`
  - Password: 구성된 `gateway.auth.password` 또는
    `OPENCLAW_GATEWAY_PASSWORD` 확인
  - SecretRef로 관리되는 token: 외부 secret provider를 확인하거나
    이 셸에서 `OPENCLAW_GATEWAY_TOKEN`을 export한 뒤 `openclaw dashboard`를 다시 실행
  - shared secret가 구성되지 않음: `openclaw doctor --generate-gateway-token`
- 대시보드 설정에서 token 또는 password를 인증 필드에 붙여넣은 다음,
  연결하세요.
- UI 언어 선택기는 **Overview -> Gateway Access -> Language**에 있습니다.
  Appearance 섹션이 아니라 액세스 카드의 일부입니다.

## 관련 항목

- [Control UI](/ko/web/control-ui)
- [WebChat](/ko/web/webchat)
