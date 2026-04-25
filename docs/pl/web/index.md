---
read_when:
    - Chcesz uzyskać dostęp do Gateway przez Tailscale
    - Chcesz używać przeglądarkowego Control UI i edycji konfiguracji
summary: 'Powierzchnie webowe Gateway: Control UI, tryby powiązania i bezpieczeństwo'
title: Web
x-i18n:
    generated_at: "2026-04-25T14:01:45Z"
    model: gpt-5.4
    provider: openai
    source_hash: 424704a35ce3a0f5960486372514751cc93ae90e4b75d0ed114e045664256d2d
    source_path: web/index.md
    workflow: 15
---

Gateway udostępnia niewielkie **przeglądarkowe Control UI** (Vite + Lit) na tym samym porcie co WebSocket Gateway:

- domyślnie: `http://<host>:18789/`
- z `gateway.tls.enabled: true`: `https://<host>:18789/`
- opcjonalny prefiks: ustaw `gateway.controlUi.basePath` (np. `/openclaw`)

Możliwości opisano w [Control UI](/pl/web/control-ui).
Ta strona skupia się na trybach powiązania, bezpieczeństwie i powierzchniach webowych.

## Webhooki

Gdy `hooks.enabled=true`, Gateway udostępnia również niewielki endpoint webhook na tym samym serwerze HTTP.
Zobacz [Konfiguracja Gateway](/pl/gateway/configuration) → `hooks`, aby poznać auth i ładunki.

## Konfiguracja (domyślnie włączone)

Control UI jest **domyślnie włączone**, gdy zasoby są obecne (`dist/control-ui`).
Możesz nim sterować przez konfigurację:

```json5
{
  gateway: {
    controlUi: { enabled: true, basePath: "/openclaw" }, // basePath opcjonalne
  },
}
```

## Dostęp przez Tailscale

### Zintegrowane Serve (zalecane)

Pozostaw Gateway na loopback i pozwól, by Tailscale Serve działał jako proxy:

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

### Powiązanie Tailnet + token

```json5
{
  gateway: {
    bind: "tailnet",
    controlUi: { enabled: true },
    auth: { mode: "token", token: "your-token" },
  },
}
```

Następnie uruchom gateway (ten przykład nie-loopback używa auth
tokenu ze wspólnym sekretem):

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

- Auth Gateway jest domyślnie wymagane (token, hasło, trusted-proxy lub nagłówki tożsamości Tailscale Serve, gdy są włączone).
- Powiązania inne niż loopback nadal **wymagają** auth gateway. W praktyce oznacza to auth tokenem/hasłem albo świadomego tożsamościowo reverse proxy z `gateway.auth.mode: "trusted-proxy"`.
- Kreator domyślnie tworzy auth ze wspólnym sekretem i zwykle generuje
  token gateway (nawet na loopback).
- W trybie wspólnego sekretu UI wysyła `connect.params.auth.token` lub
  `connect.params.auth.password`.
- Gdy `gateway.tls.enabled: true`, lokalne helpery dashboardu i statusu renderują
  URL dashboardu `https://` i URL WebSocket `wss://`.
- W trybach przenoszących tożsamość, takich jak Tailscale Serve lub `trusted-proxy`, sprawdzenie auth WebSocket jest zaspokajane z nagłówków żądania.
- Dla wdrożeń Control UI innych niż loopback ustaw jawnie `gateway.controlUi.allowedOrigins`
  (pełne originy). Bez tego uruchomienie gateway jest domyślnie odrzucane.
- `gateway.controlUi.dangerouslyAllowHostHeaderOriginFallback=true` włącza
  tryb fallback originu oparty na nagłówku Host, ale jest to niebezpieczne obniżenie poziomu bezpieczeństwa.
- Przy Serve nagłówki tożsamości Tailscale mogą spełnić wymagania auth dla Control UI/WebSocket,
  gdy `gateway.auth.allowTailscale` ma wartość `true` (token/hasło nie są wymagane).
  Endpointy HTTP API nie używają tych nagłówków tożsamości Tailscale; zamiast tego stosują
  normalny tryb HTTP auth gateway. Ustaw
  `gateway.auth.allowTailscale: false`, aby wymagać jawnych poświadczeń. Zobacz
  [Tailscale](/pl/gateway/tailscale) i [Bezpieczeństwo](/pl/gateway/security). Ten
  beztokenowy przepływ zakłada, że host gateway jest zaufany.
- `gateway.tailscale.mode: "funnel"` wymaga `gateway.auth.mode: "password"` (wspólne hasło).

## Budowanie UI

Gateway serwuje pliki statyczne z `dist/control-ui`. Zbuduj je poleceniem:

```bash
pnpm ui:build
```
