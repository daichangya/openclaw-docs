---
read_when:
    - Ändern der Dashboard-Authentifizierung oder der Expositionsmodi
summary: Zugriff auf das Gateway-Dashboard (Control UI) und Authentifizierung
title: Dashboard
x-i18n:
    generated_at: "2026-04-05T12:59:31Z"
    model: gpt-5.4
    provider: openai
    source_hash: 316e082ae4759f710b457487351e30c53b34c7c2b4bf84ad7b091a50538af5cc
    source_path: web/dashboard.md
    workflow: 15
---

# Dashboard (Control UI)

Das Gateway-Dashboard ist die browserbasierte Control UI, die standardmäßig unter `/` bereitgestellt wird
(Override mit `gateway.controlUi.basePath`).

Schnelles Öffnen (lokales Gateway):

- [http://127.0.0.1:18789/](http://127.0.0.1:18789/) (oder [http://localhost:18789/](http://localhost:18789/))

Wichtige Referenzen:

- [Control UI](/web/control-ui) für Nutzung und UI-Fähigkeiten.
- [Tailscale](/de/gateway/tailscale) für Serve-/Funnel-Automatisierung.
- [Web-Oberflächen](/web) für Bind-Modi und Sicherheitshinweise.

Die Authentifizierung wird beim WebSocket-Handshake über den konfigurierten Gateway-
Authentifizierungspfad erzwungen:

- `connect.params.auth.token`
- `connect.params.auth.password`
- Tailscale-Serve-Identitäts-Header, wenn `gateway.auth.allowTailscale: true`
- Trusted-Proxy-Identitäts-Header, wenn `gateway.auth.mode: "trusted-proxy"`

Siehe `gateway.auth` in der [Gateway-Konfiguration](/de/gateway/configuration).

Sicherheitshinweis: Die Control UI ist eine **Admin-Oberfläche** (Chat, Konfiguration, Exec-Genehmigungen).
Stellen Sie sie nicht öffentlich bereit. Die UI speichert Dashboard-URL-Tokens in `sessionStorage`
für die aktuelle Browser-Tab-Sitzung und die ausgewählte Gateway-URL und entfernt sie nach dem Laden aus der URL.
Bevorzugen Sie localhost, Tailscale Serve oder einen SSH-Tunnel.

## Schneller Weg (empfohlen)

- Nach dem Onboarding öffnet die CLI das Dashboard automatisch und gibt einen sauberen (nicht tokenisierten) Link aus.
- Jederzeit erneut öffnen: `openclaw dashboard` (kopiert den Link, öffnet den Browser wenn möglich, zeigt bei Headless einen SSH-Hinweis).
- Wenn die UI zur Authentifizierung mit Shared Secret auffordert, fügen Sie das konfigurierte Token oder
  Passwort in die Einstellungen der Control UI ein.

## Grundlagen der Authentifizierung (lokal vs. remote)

- **Localhost**: `http://127.0.0.1:18789/` öffnen.
- **Quelle des Shared-Secret-Tokens**: `gateway.auth.token` (oder
  `OPENCLAW_GATEWAY_TOKEN`); `openclaw dashboard` kann es über ein URL-Fragment
  für einmaliges Bootstrap übergeben, und die Control UI speichert es in `sessionStorage` für die
  aktuelle Browser-Tab-Sitzung und die ausgewählte Gateway-URL statt in `localStorage`.
- Wenn `gateway.auth.token` durch SecretRef verwaltet wird, gibt `openclaw dashboard`
  absichtlich eine nicht tokenisierte URL aus/kopiert/öffnet sie. Dadurch wird vermieden,
  extern verwaltete Tokens in Shell-Logs, Zwischenablage-Verlauf oder Browser-Start-
  Argumenten offenzulegen.
- Wenn `gateway.auth.token` als SecretRef konfiguriert ist und in Ihrer
  aktuellen Shell nicht aufgelöst werden kann, gibt `openclaw dashboard` dennoch eine nicht tokenisierte URL plus
  umsetzbare Hinweise zur Einrichtung der Authentifizierung aus.
- **Shared-Secret-Passwort**: Verwenden Sie das konfigurierte `gateway.auth.password` (oder
  `OPENCLAW_GATEWAY_PASSWORD`). Das Dashboard speichert Passwörter nicht über
  Reloads hinweg.
- **Modi mit Identität**: Tailscale Serve kann die Authentifizierung von Control UI/WebSocket
  über Identitäts-Header erfüllen, wenn `gateway.auth.allowTailscale: true`, und ein
  identitätsbewusster Reverse-Proxy außerhalb von Loopback kann
  `gateway.auth.mode: "trusted-proxy"` erfüllen. In diesen Modi benötigt das Dashboard
  kein eingefügtes Shared Secret für den WebSocket.
- **Nicht localhost**: Verwenden Sie Tailscale Serve, einen Bind außerhalb von Loopback mit Shared Secret, einen
  identitätsbewussten Reverse-Proxy außerhalb von Loopback mit
  `gateway.auth.mode: "trusted-proxy"` oder einen SSH-Tunnel. HTTP-APIs verwenden weiterhin
  Shared-Secret-Authentifizierung, außer Sie betreiben absichtlich `gateway.auth.mode: "none"` für privaten Ingress
  oder Trusted-Proxy-HTTP-Authentifizierung. Siehe
  [Web-Oberflächen](/web).

<a id="if-you-see-unauthorized-1008"></a>

## Wenn Sie „unauthorized“ / 1008 sehen

- Stellen Sie sicher, dass das Gateway erreichbar ist (lokal: `openclaw status`; remote: SSH-Tunnel `ssh -N -L 18789:127.0.0.1:18789 user@host`, dann `http://127.0.0.1:18789/` öffnen).
- Bei `AUTH_TOKEN_MISMATCH` können Clients einen vertrauenswürdigen Wiederholungsversuch mit einem zwischengespeicherten Gerätetoken durchführen, wenn das Gateway Wiederholungshinweise zurückgibt. Dieser Wiederholungsversuch mit zwischengespeichertem Token verwendet die zwischengespeicherten genehmigten Scopes des Tokens erneut; Aufrufer mit explizitem `deviceToken` / expliziten `scopes` behalten ihre angeforderte Scope-Menge bei. Wenn die Authentifizierung nach diesem Wiederholungsversuch weiterhin fehlschlägt, beheben Sie die Token-Abweichung manuell.
- Außerhalb dieses Wiederholungspfads gilt für die Verbindungsauthentifizierung diese explizite Priorität: zuerst explizites Shared Token/Passwort, dann explizites `deviceToken`, dann gespeichertes Gerätetoken, dann Bootstrap-Token.
- Auf dem asynchronen Tailscale-Serve-Control-UI-Pfad werden fehlgeschlagene Versuche für dieselbe
  `{scope, ip}` serialisiert, bevor der Limiter für fehlgeschlagene Authentifizierungen sie erfasst, sodass bereits der zweite gleichzeitige fehlerhafte Wiederholungsversuch `retry later` anzeigen kann.
- Folgen Sie für Schritte zur Behebung von Token-Abweichungen der [Checkliste zur Wiederherstellung bei Token-Abweichungen](/cli/devices#token-drift-recovery-checklist).
- Abrufen oder bereitstellen des Shared Secret vom Gateway-Host:
  - Token: `openclaw config get gateway.auth.token`
  - Passwort: das konfigurierte `gateway.auth.password` oder
    `OPENCLAW_GATEWAY_PASSWORD` auflösen
  - Durch SecretRef verwaltetes Token: externen Secret-Provider auflösen oder
    `OPENCLAW_GATEWAY_TOKEN` in dieser Shell exportieren und dann `openclaw dashboard`
    erneut ausführen
  - Kein Shared Secret konfiguriert: `openclaw doctor --generate-gateway-token`
- Fügen Sie in den Dashboard-Einstellungen das Token oder Passwort in das Authentifizierungsfeld ein
  und verbinden Sie sich dann.
