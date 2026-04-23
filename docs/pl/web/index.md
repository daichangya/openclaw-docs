---
read_when:
    - Chcesz uzyskać dostęp do Gateway przez Tailscale
    - Chcesz używać przeglądarkowego Control UI i edycji konfiguracji
summary: 'Powierzchnie web Gateway: Control UI, tryby powiązania i bezpieczeństwo'
title: Web
x-i18n:
    generated_at: "2026-04-23T10:11:30Z"
    model: gpt-5.4
    provider: openai
    source_hash: cf1a173143782557ecd2e79b28694308709dc945700a509148856255d5cef773
    source_path: web/index.md
    workflow: 15
---

# Web (Gateway)

Gateway udostępnia niewielkie **przeglądarkowe Control UI** (Vite + Lit) z tego samego portu co Gateway WebSocket:

- domyślnie: `http://<host>:18789/`
- opcjonalny prefiks: ustaw `gateway.controlUi.basePath` (na przykład `/openclaw`)

Możliwości znajdują się w [Control UI](/pl/web/control-ui).
Ta strona koncentruje się na trybach powiązania, bezpieczeństwie i powierzchniach skierowanych do web.

## Webhooks

Gdy `hooks.enabled=true`, Gateway udostępnia także niewielki endpoint Webhook na tym samym serwerze HTTP.
Zobacz [Konfiguracja Gateway](/pl/gateway/configuration) → `hooks`, aby poznać uwierzytelnianie i payloady.

## Konfiguracja (domyślnie włączone)

Control UI jest **włączone domyślnie**, gdy zasoby są obecne (`dist/control-ui`).
Możesz sterować nim przez konfigurację:

```json5
{
  gateway: {
    controlUi: { enabled: true, basePath: "/openclaw" }, // basePath opcjonalne
  },
}
```

## Dostęp przez Tailscale

### Zintegrowane Serve (zalecane)

Trzymaj Gateway na loopback i pozwól Tailscale Serve działać jako proxy:

```json5
{
  gateway: {
    bind: "loopback",
    tailscale: { mode: "serve" },
  },
}
```

Następnie uruchom gateway:

```bash
openclaw gateway
```

Otwórz:

- `https://<magicdns>/` (lub skonfigurowane `gateway.controlUi.basePath`)

### Powiązanie tailnet + token

```json5
{
  gateway: {
    bind: "tailnet",
    controlUi: { enabled: true },
    auth: { mode: "token", token: "your-token" },
  },
}
```

Następnie uruchom gateway (ten przykład bez loopback używa uwierzytelniania
współdzielonym sekretem opartym na tokenie):

```bash
openclaw gateway
```

Otwórz:

- `http://<tailscale-ip>:18789/` (lub skonfigurowane `gateway.controlUi.basePath`)

### Publiczny internet (Funnel)

```json5
{
  gateway: {
    bind: "loopback",
    tailscale: { mode: "funnel" },
    auth: { mode: "password" }, // lub OPENCLAW_GATEWAY_PASSWORD
  },
}
```

## Uwagi dotyczące bezpieczeństwa

- Uwierzytelnianie Gateway jest wymagane domyślnie (token, hasło, trusted-proxy lub nagłówki tożsamości Tailscale Serve, gdy są włączone).
- Powiązania inne niż loopback nadal **wymagają** uwierzytelniania gateway. W praktyce oznacza to uwierzytelnianie tokenem/hasłem albo świadome tożsamości reverse proxy z `gateway.auth.mode: "trusted-proxy"`.
- Kreator domyślnie tworzy uwierzytelnianie współdzielonym sekretem i zwykle generuje
  token gateway (nawet na loopback).
- W trybie współdzielonego sekretu UI wysyła `connect.params.auth.token` lub
  `connect.params.auth.password`.
- W trybach niosących tożsamość, takich jak Tailscale Serve lub `trusted-proxy`,
  kontrola uwierzytelniania WebSocket jest zamiast tego spełniana na podstawie nagłówków żądania.
- Dla wdrożeń Control UI innych niż loopback ustaw jawnie `gateway.controlUi.allowedOrigins`
  (pełne originy). Bez tego uruchomienie gateway jest domyślnie odrzucane.
- `gateway.controlUi.dangerouslyAllowHostHeaderOriginFallback=true` włącza
  tryb fallbacku origin oparty na nagłówku Host, ale jest to niebezpieczne obniżenie poziomu bezpieczeństwa.
- Przy Serve nagłówki tożsamości Tailscale mogą spełniać uwierzytelnianie Control UI/WebSocket,
  gdy `gateway.auth.allowTailscale` ma wartość `true` (token/hasło nie są wymagane).
  Endpointy HTTP API nie używają tych nagłówków tożsamości Tailscale; stosują
  zwykły tryb uwierzytelniania HTTP gateway. Ustaw
  `gateway.auth.allowTailscale: false`, aby wymagać jawnych poświadczeń. Zobacz
  [Tailscale](/pl/gateway/tailscale) i [Security](/pl/gateway/security). Ten
  przepływ bez tokena zakłada, że host gateway jest zaufany.
- `gateway.tailscale.mode: "funnel"` wymaga `gateway.auth.mode: "password"` (współdzielone hasło).

## Budowanie UI

Gateway udostępnia pliki statyczne z `dist/control-ui`. Zbudujesz je za pomocą:

```bash
pnpm ui:build
```
