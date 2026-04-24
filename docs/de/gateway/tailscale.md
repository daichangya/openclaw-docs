---
read_when:
    - Die Gateway-Control-UI außerhalb von localhost bereitstellen.
    - Tailnet- oder öffentlichen Dashboard-Zugriff automatisieren
summary: Integriertes Tailscale Serve/Funnel für das Gateway-Dashboard
title: Tailscale
x-i18n:
    generated_at: "2026-04-24T06:40:12Z"
    model: gpt-5.4
    provider: openai
    source_hash: 30bfe5fa2c9295dcf7164a1a89876d2e097f54d42bd261dfde973fddbd9185ce
    source_path: gateway/tailscale.md
    workflow: 15
---

# Tailscale (Gateway-Dashboard)

OpenClaw kann Tailscale **Serve** (Tailnet) oder **Funnel** (öffentlich) automatisch für das
Gateway-Dashboard und den WebSocket-Port konfigurieren. Dadurch bleibt das Gateway an Loopback gebunden, während
Tailscale HTTPS, Routing und (bei Serve) Identitäts-Header bereitstellt.

## Modi

- `serve`: Nur Tailnet-Serve über `tailscale serve`. Das Gateway bleibt auf `127.0.0.1`.
- `funnel`: Öffentliches HTTPS über `tailscale funnel`. OpenClaw erfordert ein gemeinsames Passwort.
- `off`: Standard (keine Tailscale-Automatisierung).

## Authentifizierung

Setzen Sie `gateway.auth.mode`, um den Handshake zu steuern:

- `none` (nur privater Ingress)
- `token` (Standard, wenn `OPENCLAW_GATEWAY_TOKEN` gesetzt ist)
- `password` (Shared Secret über `OPENCLAW_GATEWAY_PASSWORD` oder Konfiguration)
- `trusted-proxy` (identity-aware Reverse Proxy; siehe [Trusted Proxy Auth](/de/gateway/trusted-proxy-auth))

Wenn `tailscale.mode = "serve"` und `gateway.auth.allowTailscale` auf `true` gesetzt ist,
kann die Authentifizierung für Control UI/WebSocket Tailscale-Identitäts-Header
(`tailscale-user-login`) verwenden, ohne ein Token/Passwort anzugeben. OpenClaw verifiziert
die Identität, indem die Adresse `x-forwarded-for` über den lokalen Tailscale-
Daemon (`tailscale whois`) aufgelöst und vor der Annahme mit dem Header abgeglichen wird.
OpenClaw behandelt einen Request nur dann als Serve, wenn er über Loopback mit
den Tailscale-Headern `x-forwarded-for`, `x-forwarded-proto` und `x-forwarded-host`
ankommt.
HTTP-API-Endpunkte (zum Beispiel `/v1/*`, `/tools/invoke` und `/api/channels/*`)
verwenden **keine** Authentifizierung per Tailscale-Identitäts-Header. Sie folgen weiterhin dem
normalen HTTP-Auth-Modus des Gateways: standardmäßig Shared-Secret-Authentifizierung oder ein absichtlich
konfiguriertes Trusted-Proxy-/privates Ingress-Setup mit `none`.
Dieser tokenlose Ablauf setzt voraus, dass dem Gateway-Host vertraut wird. Wenn nicht vertrauenswürdiger lokaler Code
auf demselben Host laufen könnte, deaktivieren Sie `gateway.auth.allowTailscale` und verlangen Sie stattdessen
Token-/Passwort-Authentifizierung.
Um explizite Shared-Secret-Zugangsdaten zu erzwingen, setzen Sie `gateway.auth.allowTailscale: false`
und verwenden Sie `gateway.auth.mode: "token"` oder `"password"`.

## Konfigurationsbeispiele

### Nur Tailnet (Serve)

```json5
{
  gateway: {
    bind: "loopback",
    tailscale: { mode: "serve" },
  },
}
```

Öffnen: `https://<magicdns>/` (oder Ihren konfigurierten `gateway.controlUi.basePath`)

### Nur Tailnet (an Tailnet-IP binden)

Verwenden Sie dies, wenn das Gateway direkt auf der Tailnet-IP lauschen soll (ohne Serve/Funnel).

```json5
{
  gateway: {
    bind: "tailnet",
    auth: { mode: "token", token: "your-token" },
  },
}
```

Verbindung von einem anderen Tailnet-Gerät:

- Control UI: `http://<tailscale-ip>:18789/`
- WebSocket: `ws://<tailscale-ip>:18789`

Hinweis: Loopback (`http://127.0.0.1:18789`) funktioniert in diesem Modus **nicht**.

### Öffentliches Internet (Funnel + Shared Password)

```json5
{
  gateway: {
    bind: "loopback",
    tailscale: { mode: "funnel" },
    auth: { mode: "password", password: "replace-me" },
  },
}
```

Bevorzugen Sie `OPENCLAW_GATEWAY_PASSWORD`, statt ein Passwort auf die Festplatte zu schreiben.

## CLI-Beispiele

```bash
openclaw gateway --tailscale serve
openclaw gateway --tailscale funnel --auth password
```

## Hinweise

- Tailscale Serve/Funnel erfordert, dass die `tailscale`-CLI installiert und angemeldet ist.
- `tailscale.mode: "funnel"` verweigert den Start, sofern der Auth-Modus nicht `password` ist, um öffentliche Exposition zu vermeiden.
- Setzen Sie `gateway.tailscale.resetOnExit`, wenn OpenClaw die Konfiguration von `tailscale serve`
  oder `tailscale funnel` beim Herunterfahren rückgängig machen soll.
- `gateway.bind: "tailnet"` ist ein direktes Tailnet-Binding (kein HTTPS, kein Serve/Funnel).
- `gateway.bind: "auto"` bevorzugt Loopback; verwenden Sie `tailnet`, wenn Sie nur Tailnet möchten.
- Serve/Funnel legen nur die **Gateway-Control-UI + WS** offen. Nodes verbinden sich über
  denselben Gateway-WS-Endpunkt, daher kann Serve auch für Node-Zugriff funktionieren.

## Browser-Steuerung (Remote-Gateway + lokaler Browser)

Wenn Sie das Gateway auf einer Maschine ausführen, aber einen Browser auf einer anderen Maschine steuern möchten,
führen Sie einen **Node-Host** auf der Browser-Maschine aus und halten Sie beide im selben Tailnet.
Das Gateway proxyt Browser-Aktionen an den Node; es ist kein separater Control-Server oder Serve-URL erforderlich.

Verwenden Sie Funnel nicht für Browser-Steuerung; behandeln Sie Node-Pairing wie Operator-Zugriff.

## Voraussetzungen + Einschränkungen von Tailscale

- Serve erfordert aktiviertes HTTPS für Ihr Tailnet; die CLI fordert Sie auf, wenn es fehlt.
- Serve injiziert Tailscale-Identitäts-Header; Funnel nicht.
- Funnel erfordert Tailscale v1.38.3+, MagicDNS, aktiviertes HTTPS und ein Funnel-Node-Attribut.
- Funnel unterstützt über TLS nur die Ports `443`, `8443` und `10000`.
- Funnel auf macOS erfordert die Open-Source-App-Variante von Tailscale.

## Mehr erfahren

- Überblick zu Tailscale Serve: [https://tailscale.com/kb/1312/serve](https://tailscale.com/kb/1312/serve)
- Befehl `tailscale serve`: [https://tailscale.com/kb/1242/tailscale-serve](https://tailscale.com/kb/1242/tailscale-serve)
- Überblick zu Tailscale Funnel: [https://tailscale.com/kb/1223/tailscale-funnel](https://tailscale.com/kb/1223/tailscale-funnel)
- Befehl `tailscale funnel`: [https://tailscale.com/kb/1311/tailscale-funnel](https://tailscale.com/kb/1311/tailscale-funnel)

## Verwandt

- [Remote access](/de/gateway/remote)
- [Discovery](/de/gateway/discovery)
- [Authentication](/de/gateway/authentication)
