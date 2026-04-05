---
read_when:
    - Die Gateway-Control-UI außerhalb von localhost bereitstellen
    - Tailnet- oder öffentlichen Dashboard-Zugriff automatisieren
summary: Integriertes Tailscale Serve/Funnel für das Gateway-Dashboard
title: Tailscale
x-i18n:
    generated_at: "2026-04-05T12:44:02Z"
    model: gpt-5.4
    provider: openai
    source_hash: 4ca5316e804e089c31a78ae882b3082444e082fb2b36b73679ffede20590cb2e
    source_path: gateway/tailscale.md
    workflow: 15
---

# Tailscale (Gateway-Dashboard)

OpenClaw kann Tailscale **Serve** (Tailnet) oder **Funnel** (öffentlich) automatisch für das
Gateway-Dashboard und den WebSocket-Port konfigurieren. Dadurch bleibt das Gateway an loopback gebunden, während
Tailscale HTTPS, Routing und (bei Serve) Identitäts-Header bereitstellt.

## Modi

- `serve`: Nur-Tailnet-Serve über `tailscale serve`. Das Gateway bleibt auf `127.0.0.1`.
- `funnel`: Öffentliches HTTPS über `tailscale funnel`. OpenClaw erfordert ein gemeinsames Passwort.
- `off`: Standard (keine Tailscale-Automatisierung).

## Auth

Setzen Sie `gateway.auth.mode`, um den Handshake zu steuern:

- `none` (nur privater Ingress)
- `token` (Standard, wenn `OPENCLAW_GATEWAY_TOKEN` gesetzt ist)
- `password` (gemeinsames Secret über `OPENCLAW_GATEWAY_PASSWORD` oder Konfiguration)
- `trusted-proxy` (identitätsbewusster Reverse Proxy; siehe [Trusted Proxy Auth](/gateway/trusted-proxy-auth))

Wenn `tailscale.mode = "serve"` und `gateway.auth.allowTailscale` auf `true` gesetzt ist,
kann die Authentifizierung für Control UI/WebSocket Tailscale-Identitäts-Header
(`tailscale-user-login`) verwenden, ohne ein Token/Passwort anzugeben. OpenClaw verifiziert
die Identität, indem es die Adresse aus `x-forwarded-for` über den lokalen Tailscale-
Daemon (`tailscale whois`) auflöst und vor der Akzeptanz mit dem Header abgleicht.
OpenClaw behandelt eine Anfrage nur dann als Serve, wenn sie von loopback mit
Tailscales Headern `x-forwarded-for`, `x-forwarded-proto` und `x-forwarded-host`
ankommt.
HTTP-API-Endpunkte (zum Beispiel `/v1/*`, `/tools/invoke` und `/api/channels/*`)
verwenden **keine** Tailscale-Authentifizierung über Identitäts-Header. Sie folgen weiterhin dem
normalen HTTP-Auth-Modus des Gateways: standardmäßig Authentifizierung mit gemeinsamem Secret oder ein bewusst
konfiguriertes `trusted-proxy`-/privates `none`-Ingress-Setup.
Dieser tokenlose Ablauf setzt voraus, dass dem Gateway-Host vertraut wird. Wenn nicht vertrauenswürdiger lokaler Code
auf demselben Host laufen kann, deaktivieren Sie `gateway.auth.allowTailscale` und verlangen Sie stattdessen
Token-/Passwort-Authentifizierung.
Um explizite Anmeldedaten mit gemeinsamem Secret zu verlangen, setzen Sie `gateway.auth.allowTailscale: false`
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

Öffnen: `https://<magicdns>/` (oder Ihr konfigurierter `gateway.controlUi.basePath`)

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

Von einem anderen Tailnet-Gerät verbinden:

- Control UI: `http://<tailscale-ip>:18789/`
- WebSocket: `ws://<tailscale-ip>:18789`

Hinweis: loopback (`http://127.0.0.1:18789`) funktioniert in diesem Modus **nicht**.

### Öffentliches Internet (Funnel + gemeinsames Passwort)

```json5
{
  gateway: {
    bind: "loopback",
    tailscale: { mode: "funnel" },
    auth: { mode: "password", password: "replace-me" },
  },
}
```

Bevorzugen Sie `OPENCLAW_GATEWAY_PASSWORD`, statt ein Passwort auf dem Datenträger festzuschreiben.

## CLI-Beispiele

```bash
openclaw gateway --tailscale serve
openclaw gateway --tailscale funnel --auth password
```

## Hinweise

- Tailscale Serve/Funnel erfordert, dass die `tailscale`-CLI installiert und angemeldet ist.
- `tailscale.mode: "funnel"` verweigert den Start, solange der Auth-Modus nicht `password` ist, um eine öffentliche Exponierung zu vermeiden.
- Setzen Sie `gateway.tailscale.resetOnExit`, wenn OpenClaw die Konfiguration von `tailscale serve`
  oder `tailscale funnel` beim Beenden zurücksetzen soll.
- `gateway.bind: "tailnet"` ist eine direkte Tailnet-Bindung (kein HTTPS, kein Serve/Funnel).
- `gateway.bind: "auto"` bevorzugt loopback; verwenden Sie `tailnet`, wenn Sie nur Tailnet möchten.
- Serve/Funnel exponieren nur die **Gateway-Control-UI + WS**. Nodes verbinden sich über
  denselben Gateway-WS-Endpunkt, daher kann Serve auch für Node-Zugriff funktionieren.

## Browser-Steuerung (Remote-Gateway + lokaler Browser)

Wenn Sie das Gateway auf einer Maschine ausführen, aber einen Browser auf einer anderen Maschine steuern möchten,
führen Sie einen **Node-Host** auf der Browser-Maschine aus und halten Sie beide im selben Tailnet.
Das Gateway leitet Browser-Aktionen an die Node weiter; ein separater Control-Server oder eine Serve-URL ist nicht erforderlich.

Vermeiden Sie Funnel für Browser-Steuerung; behandeln Sie Node-Pairing wie Operator-Zugriff.

## Tailscale-Voraussetzungen + Einschränkungen

- Serve erfordert aktiviertes HTTPS für Ihr Tailnet; die CLI fordert dazu auf, wenn es fehlt.
- Serve injiziert Tailscale-Identitäts-Header; Funnel tut das nicht.
- Funnel erfordert Tailscale v1.38.3+, MagicDNS, aktiviertes HTTPS und ein Funnel-Node-Attribut.
- Funnel unterstützt nur die Ports `443`, `8443` und `10000` über TLS.
- Funnel auf macOS erfordert die Open-Source-Variante der Tailscale-App.

## Mehr erfahren

- Übersicht zu Tailscale Serve: [https://tailscale.com/kb/1312/serve](https://tailscale.com/kb/1312/serve)
- Befehl `tailscale serve`: [https://tailscale.com/kb/1242/tailscale-serve](https://tailscale.com/kb/1242/tailscale-serve)
- Übersicht zu Tailscale Funnel: [https://tailscale.com/kb/1223/tailscale-funnel](https://tailscale.com/kb/1223/tailscale-funnel)
- Befehl `tailscale funnel`: [https://tailscale.com/kb/1311/tailscale-funnel](https://tailscale.com/kb/1311/tailscale-funnel)
