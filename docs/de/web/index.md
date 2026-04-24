---
read_when:
    - Sie möchten über Tailscale auf das Gateway zugreifen
    - Sie möchten die browserbasierte Control UI und die Konfigurationsbearbeitung
summary: 'Gateway-Web-Oberflächen: Control UI, Bind-Modi und Sicherheit'
title: Web
x-i18n:
    generated_at: "2026-04-24T07:06:55Z"
    model: gpt-5.4
    provider: openai
    source_hash: 0336a6597cebf4a8a83d348abd3d59ff4b9bd7349a32c8a0a0093da0f656e97d
    source_path: web/index.md
    workflow: 15
---

Das Gateway stellt eine kleine **browserbasierte Control UI** (Vite + Lit) über denselben Port wie den Gateway-WebSocket bereit:

- Standard: `http://<host>:18789/`
- optionales Präfix: `gateway.controlUi.basePath` setzen (z. B. `/openclaw`)

Die Funktionen sind unter [Control UI](/de/web/control-ui) beschrieben.
Diese Seite konzentriert sich auf Bind-Modi, Sicherheit und webseitige Oberflächen.

## Webhooks

Wenn `hooks.enabled=true`, stellt das Gateway auf demselben HTTP-Server auch einen kleinen Webhook-Endpoint bereit.
Siehe [Gateway-Konfiguration](/de/gateway/configuration) → `hooks` für Auth + Payloads.

## Konfiguration (standardmäßig aktiviert)

Die Control UI ist **standardmäßig aktiviert**, wenn Assets vorhanden sind (`dist/control-ui`).
Sie können sie über die Konfiguration steuern:

```json5
{
  gateway: {
    controlUi: { enabled: true, basePath: "/openclaw" }, // basePath optional
  },
}
```

## Tailscale-Zugriff

### Integriertes Serve (empfohlen)

Das Gateway auf Loopback belassen und es von Tailscale Serve per Proxy bereitstellen lassen:

```json5
{
  gateway: {
    bind: "loopback",
    tailscale: { mode: "serve" },
  },
}
```

Dann das Gateway starten:

```bash
openclaw gateway
```

Öffnen:

- `https://<magicdns>/` (oder Ihr konfiguriertes `gateway.controlUi.basePath`)

### Tailnet-Bind + Token

```json5
{
  gateway: {
    bind: "tailnet",
    controlUi: { enabled: true },
    auth: { mode: "token", token: "your-token" },
  },
}
```

Dann das Gateway starten (dieses Beispiel ohne Loopback verwendet Shared-Secret-Token-
Auth):

```bash
openclaw gateway
```

Öffnen:

- `http://<tailscale-ip>:18789/` (oder Ihr konfiguriertes `gateway.controlUi.basePath`)

### Öffentliches Internet (Funnel)

```json5
{
  gateway: {
    bind: "loopback",
    tailscale: { mode: "funnel" },
    auth: { mode: "password" }, // oder OPENCLAW_GATEWAY_PASSWORD
  },
}
```

## Sicherheitshinweise

- Gateway-Auth ist standardmäßig erforderlich (Token, Passwort, trusted-proxy oder Tailscale-Serve-Identity-Header, wenn aktiviert).
- Bindings ohne Loopback **erfordern weiterhin** Gateway-Auth. In der Praxis bedeutet das Token-/Passwort-Auth oder einen Identity-fähigen Reverse-Proxy mit `gateway.auth.mode: "trusted-proxy"`.
- Der Wizard erstellt standardmäßig Shared-Secret-Auth und generiert normalerweise ein
  Gateway-Token (auch auf Loopback).
- Im Shared-Secret-Modus sendet die UI `connect.params.auth.token` oder
  `connect.params.auth.password`.
- In Identity-tragenden Modi wie Tailscale Serve oder `trusted-proxy` wird die
  WebSocket-Auth-Prüfung stattdessen durch Request-Header erfüllt.
- Für Deployments der Control UI ohne Loopback `gateway.controlUi.allowedOrigins`
  explizit setzen (vollständige Origins). Ohne dies wird der Gateway-Start standardmäßig verweigert.
- `gateway.controlUi.dangerouslyAllowHostHeaderOriginFallback=true` aktiviert
  den Host-Header-Origin-Fallback-Modus, ist aber eine gefährliche Sicherheitsabschwächung.
- Mit Serve können Tailscale-Identity-Header die Authentifizierung von Control UI/WebSocket
  erfüllen, wenn `gateway.auth.allowTailscale` auf `true` gesetzt ist (kein Token/Passwort erforderlich).
  HTTP-API-Endpoints verwenden diese Tailscale-Identity-Header nicht; sie folgen
  stattdessen dem normalen HTTP-Auth-Modus des Gateway. Setzen Sie
  `gateway.auth.allowTailscale: false`, um explizite Credentials zu verlangen. Siehe
  [Tailscale](/de/gateway/tailscale) und [Sicherheit](/de/gateway/security). Dieser
  tokenlose Flow setzt voraus, dass dem Gateway-Host vertraut wird.
- `gateway.tailscale.mode: "funnel"` erfordert `gateway.auth.mode: "password"` (gemeinsames Passwort).

## Die UI bauen

Das Gateway stellt statische Dateien aus `dist/control-ui` bereit. Bauen Sie sie mit:

```bash
pnpm ui:build
```
