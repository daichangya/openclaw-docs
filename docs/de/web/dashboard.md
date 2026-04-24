---
read_when:
    - Authentifizierung oder Expositionsmodi des Dashboards ändern
summary: 'Gateway-Dashboard (Control UI): Zugriff und Authentifizierung'
title: Dashboard
x-i18n:
    generated_at: "2026-04-24T07:06:30Z"
    model: gpt-5.4
    provider: openai
    source_hash: 8753e0edf0a04e4c36b76aa6973dcd9d903a98c0b85e498bfcb05e728bb6272b
    source_path: web/dashboard.md
    workflow: 15
---

Das Gateway-Dashboard ist die browserbasierte Control UI, die standardmäßig unter `/` bereitgestellt wird
(überschreibbar mit `gateway.controlUi.basePath`).

Schnell öffnen (lokales Gateway):

- [http://127.0.0.1:18789/](http://127.0.0.1:18789/) (oder [http://localhost:18789/](http://localhost:18789/))

Wichtige Referenzen:

- [Control UI](/de/web/control-ui) für Nutzung und UI-Funktionen.
- [Tailscale](/de/gateway/tailscale) für Serve-/Funnel-Automatisierung.
- [Web-Oberflächen](/de/web) für Bind-Modi und Sicherheitshinweise.

Die Authentifizierung wird beim WebSocket-Handshake über den konfigurierten Gateway-
Auth-Pfad erzwungen:

- `connect.params.auth.token`
- `connect.params.auth.password`
- Tailscale-Serve-Identity-Header, wenn `gateway.auth.allowTailscale: true`
- Trusted-Proxy-Identity-Header, wenn `gateway.auth.mode: "trusted-proxy"`

Siehe `gateway.auth` in [Gateway-Konfiguration](/de/gateway/configuration).

Sicherheitshinweis: Die Control UI ist eine **Admin-Oberfläche** (Chat, Konfiguration, Exec-Genehmigungen).
Setzen Sie sie nicht öffentlich aus. Die UI speichert URL-Token des Dashboards in `sessionStorage`
für die aktuelle Browser-Tab-Sitzung und die ausgewählte Gateway-URL und entfernt sie nach dem Laden aus der URL.
Bevorzugen Sie localhost, Tailscale Serve oder einen SSH-Tunnel.

## Schnellpfad (empfohlen)

- Nach dem Onboarding öffnet die CLI das Dashboard automatisch und gibt einen sauberen (nicht tokenisierten) Link aus.
- Jederzeit erneut öffnen: `openclaw dashboard` (kopiert den Link, öffnet wenn möglich den Browser, zeigt einen SSH-Hinweis bei Headless-Betrieb).
- Wenn die UI nach Shared-Secret-Auth fragt, fügen Sie den konfigurierten Token oder das
  Passwort in die Einstellungen der Control UI ein.

## Grundlagen der Authentifizierung (lokal vs. remote)

- **Localhost**: `http://127.0.0.1:18789/` öffnen.
- **Shared-Secret-Token-Quelle**: `gateway.auth.token` (oder
  `OPENCLAW_GATEWAY_TOKEN`); `openclaw dashboard` kann es für ein einmaliges Bootstrap
  per URL-Fragment übergeben, und die Control UI speichert es für die
  aktuelle Browser-Tab-Sitzung und die ausgewählte Gateway-URL in `sessionStorage` statt in `localStorage`.
- Wenn `gateway.auth.token` per SecretRef verwaltet wird, gibt `openclaw dashboard`
  absichtlich eine nicht tokenisierte URL aus/kopiert/öffnet sie. Das verhindert, dass
  extern verwaltete Tokens in Shell-Logs, der Zwischenablage-Historie oder Browser-Startargumenten offengelegt werden.
- Wenn `gateway.auth.token` als SecretRef konfiguriert ist und in Ihrer
  aktuellen Shell nicht aufgelöst werden kann, gibt `openclaw dashboard` trotzdem eine nicht tokenisierte URL plus
  umsetzbare Hinweise zum Auth-Setup aus.
- **Shared-Secret-Passwort**: Verwenden Sie das konfigurierte `gateway.auth.password` (oder
  `OPENCLAW_GATEWAY_PASSWORD`). Das Dashboard speichert Passwörter nicht über
  Reloads hinweg.
- **Identity-tragende Modi**: Tailscale Serve kann die Authentifizierung von Control UI/WebSocket
  über Identity-Header erfüllen, wenn `gateway.auth.allowTailscale: true`, und ein
  Identity-fähiger Reverse-Proxy ohne Loopback kann
  `gateway.auth.mode: "trusted-proxy"` erfüllen. In diesen Modi benötigt das Dashboard
  für den WebSocket kein eingefügtes Shared Secret.
- **Nicht localhost**: Verwenden Sie Tailscale Serve, ein Shared-Secret-Binding ohne Loopback, einen
  Identity-fähigen Reverse-Proxy ohne Loopback mit
  `gateway.auth.mode: "trusted-proxy"` oder einen SSH-Tunnel. HTTP-APIs verwenden weiterhin
  Shared-Secret-Auth, sofern Sie nicht absichtlich privaten Ingress mit
  `gateway.auth.mode: "none"` oder Trusted-Proxy-HTTP-Auth betreiben. Siehe
  [Web-Oberflächen](/de/web).

<a id="if-you-see-unauthorized-1008"></a>

## Wenn Sie „unauthorized“ / 1008 sehen

- Stellen Sie sicher, dass das Gateway erreichbar ist (lokal: `openclaw status`; remote: SSH-Tunnel `ssh -N -L 18789:127.0.0.1:18789 user@host` und dann `http://127.0.0.1:18789/` öffnen).
- Bei `AUTH_TOKEN_MISMATCH` können Clients einen vertrauenswürdigen Wiederholungsversuch mit einem gecachten Device-Token durchführen, wenn das Gateway Retry-Hinweise zurückgibt. Dieser Retry mit gecachtem Token verwendet die gecachten genehmigten Scopes des Tokens erneut; Aufrufer mit explizitem `deviceToken` / expliziten `scopes` behalten ihre angeforderte Scope-Menge. Wenn die Authentifizierung nach diesem Retry weiterhin fehlschlägt, beheben Sie die Token-Drift manuell.
- Außerhalb dieses Retry-Pfads ist die Priorität für Connect-Auth explizit: zuerst Shared Token/Passwort, dann explizites `deviceToken`, dann gespeichertes Device-Token, dann Bootstrap-Token.
- Auf dem asynchronen Tailscale-Serve-Control-UI-Pfad werden fehlgeschlagene Versuche für dasselbe
  `{scope, ip}` serialisiert, bevor der Limiter für fehlgeschlagene Authentifizierung sie erfasst, sodass
  bereits der zweite gleichzeitige fehlerhafte Retry `retry later` anzeigen kann.
- Für Schritte zur Reparatur von Token-Drift folgen Sie der [Checkliste zur Wiederherstellung bei Token-Drift](/de/cli/devices#token-drift-recovery-checklist).
- Rufen Sie das Shared Secret vom Gateway-Host ab oder stellen Sie es bereit:
  - Token: `openclaw config get gateway.auth.token`
  - Passwort: das konfigurierte `gateway.auth.password` oder
    `OPENCLAW_GATEWAY_PASSWORD` auflösen
  - Per SecretRef verwaltetes Token: den externen Secret-Provider auflösen oder
    `OPENCLAW_GATEWAY_TOKEN` in dieser Shell exportieren und dann `openclaw dashboard`
    erneut ausführen
  - Kein Shared Secret konfiguriert: `openclaw doctor --generate-gateway-token`
- Fügen Sie in den Dashboard-Einstellungen den Token oder das Passwort in das Auth-Feld ein,
  und verbinden Sie sich dann.
- Die Sprachauswahl der UI befindet sich unter **Overview -> Gateway Access -> Language**.
  Sie ist Teil der Zugriffskarte, nicht des Abschnitts „Appearance“.

## Verwandt

- [Control UI](/de/web/control-ui)
- [WebChat](/de/web/webchat)
