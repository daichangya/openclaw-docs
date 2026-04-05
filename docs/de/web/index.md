---
read_when:
    - Sie möchten über Tailscale auf das Gateway zugreifen
    - Sie möchten die browserbasierte Control UI und Konfigurationsbearbeitung verwenden
summary: 'Web-Oberflächen des Gateways: Control UI, Bind-Modi und Sicherheit'
title: Web
x-i18n:
    generated_at: "2026-04-05T12:59:25Z"
    model: gpt-5.4
    provider: openai
    source_hash: 15f5643283f7d37235d3d8104897f38db27ac5a9fdef6165156fb542d0e7048c
    source_path: web/index.md
    workflow: 15
---

# Web (Gateway)

Das Gateway stellt auf demselben Port wie das Gateway-WebSocket eine kleine **browserbasierte Control UI** (Vite + Lit) bereit:

- Standard: `http://<host>:18789/`
- optionales Präfix: setzen Sie `gateway.controlUi.basePath` (z. B. `/openclaw`)

Die Funktionen sind unter [Control UI](/web/control-ui) beschrieben.
Diese Seite konzentriert sich auf Bind-Modi, Sicherheit und webseitige Oberflächen.

## Webhooks

Wenn `hooks.enabled=true`, stellt das Gateway auf demselben HTTP-Server außerdem einen kleinen Webhook-Endpunkt bereit.
Siehe [Gateway-Konfiguration](/de/gateway/configuration) → `hooks` für Authentifizierung + Payloads.

## Konfiguration (standardmäßig aktiviert)

Die Control UI ist **standardmäßig aktiviert**, wenn Assets vorhanden sind (`dist/control-ui`).
Sie können sie per Konfiguration steuern:

```json5
{
  gateway: {
    controlUi: { enabled: true, basePath: "/openclaw" }, // basePath optional
  },
}
```

## Tailscale-Zugriff

### Integriertes Serve (empfohlen)

Belassen Sie das Gateway auf loopback und lassen Sie Tailscale Serve es proxien:

```json5
{
  gateway: {
    bind: "loopback",
    tailscale: { mode: "serve" },
  },
}
```

Starten Sie dann das Gateway:

```bash
openclaw gateway
```

Öffnen Sie:

- `https://<magicdns>/` (oder Ihren konfigurierten `gateway.controlUi.basePath`)

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

Starten Sie dann das Gateway (dieses Nicht-Loopback-Beispiel verwendet Authentifizierung
mit gemeinsamem Secret per Token):

```bash
openclaw gateway
```

Öffnen Sie:

- `http://<tailscale-ip>:18789/` (oder Ihren konfigurierten `gateway.controlUi.basePath`)

### Öffentliches Internet (Funnel)

```json5
{
  gateway: {
    bind: "loopback",
    tailscale: { mode: "funnel" },
    auth: { mode: "password" }, // or OPENCLAW_GATEWAY_PASSWORD
  },
}
```

## Sicherheitshinweise

- Gateway-Authentifizierung ist standardmäßig erforderlich (Token, Passwort, `trusted-proxy` oder Tailscale-Serve-Identity-Header, wenn aktiviert).
- Nicht-Loopback-Binds **erfordern weiterhin** Gateway-Authentifizierung. In der Praxis bedeutet das Token-/Passwort-Authentifizierung oder einen identitätsbewussten Reverse-Proxy mit `gateway.auth.mode: "trusted-proxy"`.
- Der Assistent erstellt standardmäßig Authentifizierung mit gemeinsamem Secret und generiert normalerweise ein
  Gateway-Token (auch auf loopback).
- Im Modus mit gemeinsamem Secret sendet die UI `connect.params.auth.token` oder
  `connect.params.auth.password`.
- In identitätstragenden Modi wie Tailscale Serve oder `trusted-proxy` wird die
  WebSocket-Authentifizierungsprüfung stattdessen über Request-Header erfüllt.
- Für Nicht-Loopback-Bereitstellungen der Control UI setzen Sie `gateway.controlUi.allowedOrigins`
  explizit (vollständige Origins). Ohne dies wird der Gateway-Start standardmäßig verweigert.
- `gateway.controlUi.dangerouslyAllowHostHeaderOriginFallback=true` aktiviert
  den Host-Header-Origin-Fallback-Modus, ist jedoch eine gefährliche Sicherheitsabschwächung.
- Mit Serve können Tailscale-Identity-Header die Authentifizierung für Control UI/WebSocket erfüllen,
  wenn `gateway.auth.allowTailscale` auf `true` gesetzt ist (kein Token/Passwort erforderlich).
  HTTP-API-Endpunkte verwenden diese Tailscale-Identity-Header nicht; sie folgen
  stattdessen dem normalen HTTP-Authentifizierungsmodus des Gateways. Setzen Sie
  `gateway.auth.allowTailscale: false`, um explizite Anmeldedaten zu verlangen. Siehe
  [Tailscale](/de/gateway/tailscale) und [Sicherheit](/de/gateway/security). Dieser
  tokenlose Ablauf setzt voraus, dass dem Gateway-Host vertraut wird.
- `gateway.tailscale.mode: "funnel"` erfordert `gateway.auth.mode: "password"` (gemeinsam genutztes Passwort).

## Die UI bauen

Das Gateway stellt statische Dateien aus `dist/control-ui` bereit. Bauen Sie sie mit:

```bash
pnpm ui:build # auto-installs UI deps on first run
```
