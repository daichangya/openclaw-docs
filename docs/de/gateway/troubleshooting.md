---
read_when:
    - Der Hub zur Fehlerbehebung hat Sie zur tieferen Diagnose hierher weitergeleitet
    - Sie benötigen stabile symptomorientierte Runbook-Abschnitte mit exakten Befehlen
summary: Tiefgehendes Runbook zur Fehlerbehebung für Gateway, Kanäle, Automatisierung, Nodes und Browser
title: Fehlerbehebung
x-i18n:
    generated_at: "2026-04-07T06:15:32Z"
    model: gpt-5.4
    provider: openai
    source_hash: e0202e8858310a0bfc1c994cd37b01c3b2d6c73c8a74740094e92dc3c4c36729
    source_path: gateway/troubleshooting.md
    workflow: 15
---

# Fehlerbehebung für das Gateway

Diese Seite ist das detaillierte Runbook.
Beginnen Sie bei [/help/troubleshooting](/de/help/troubleshooting), wenn Sie zuerst den schnellen Triage-Ablauf möchten.

## Befehlsleiter

Führen Sie diese Befehle zuerst in dieser Reihenfolge aus:

```bash
openclaw status
openclaw gateway status
openclaw logs --follow
openclaw doctor
openclaw channels status --probe
```

Erwartete Signale bei gesundem Zustand:

- `openclaw gateway status` zeigt `Runtime: running` und `RPC probe: ok`.
- `openclaw doctor` meldet keine blockierenden Konfigurations-/Serviceprobleme.
- `openclaw channels status --probe` zeigt den Live-Transportstatus pro Konto und,
  wo unterstützt, Probe-/Audit-Ergebnisse wie `works` oder `audit ok`.

## Anthropic 429 extra usage required for long context

Verwenden Sie dies, wenn Logs/Fehler Folgendes enthalten:
`HTTP 429: rate_limit_error: Extra usage is required for long context requests`.

```bash
openclaw logs --follow
openclaw models status
openclaw config get agents.defaults.models
```

Achten Sie auf Folgendes:

- Das ausgewählte Anthropic-Opus-/Sonnet-Modell hat `params.context1m: true`.
- Die aktuellen Anthropic-Anmeldedaten sind nicht für die Nutzung mit langem Kontext berechtigt.
- Anforderungen schlagen nur bei langen Sitzungen/Modelläufen fehl, die den 1M-Beta-Pfad benötigen.

Mögliche Lösungen:

1. Deaktivieren Sie `context1m` für dieses Modell, um auf das normale Kontextfenster zurückzufallen.
2. Verwenden Sie Anthropic-Anmeldedaten, die für Anfragen mit langem Kontext berechtigt sind, oder wechseln Sie zu einem Anthropic-API-Schlüssel.
3. Konfigurieren Sie Fallback-Modelle, damit Läufe fortgesetzt werden, wenn Anthropic-Anfragen mit langem Kontext abgelehnt werden.

Verwandt:

- [/providers/anthropic](/de/providers/anthropic)
- [/reference/token-use](/de/reference/token-use)
- [/help/faq#why-am-i-seeing-http-429-ratelimiterror-from-anthropic](/de/help/faq#why-am-i-seeing-http-429-ratelimiterror-from-anthropic)

## Keine Antworten

Wenn Kanäle aktiv sind, aber nichts antwortet, prüfen Sie Routing und Richtlinien, bevor Sie irgendetwas neu verbinden.

```bash
openclaw status
openclaw channels status --probe
openclaw pairing list --channel <channel> [--account <id>]
openclaw config get channels
openclaw logs --follow
```

Achten Sie auf Folgendes:

- Ausstehendes Pairing für DM-Absender.
- Erwähnungs-Gating in Gruppen (`requireMention`, `mentionPatterns`).
- Nicht übereinstimmende Zulassungslisten für Kanal/Gruppen.

Häufige Signaturen:

- `drop guild message (mention required` → Gruppennachricht wird ignoriert, bis eine Erwähnung erfolgt.
- `pairing request` → Absender benötigt eine Freigabe.
- `blocked` / `allowlist` → Absender/Kanal wurde durch Richtlinien gefiltert.

Verwandt:

- [/channels/troubleshooting](/de/channels/troubleshooting)
- [/channels/pairing](/de/channels/pairing)
- [/channels/groups](/de/channels/groups)

## Dashboard-Control-UI-Konnektivität

Wenn die Dashboard/Control UI keine Verbindung herstellt, validieren Sie URL, Authentifizierungsmodus und Annahmen zu sicherem Kontext.

```bash
openclaw gateway status
openclaw status
openclaw logs --follow
openclaw doctor
openclaw gateway status --json
```

Achten Sie auf Folgendes:

- Korrekte Probe-URL und Dashboard-URL.
- Nichtübereinstimmung von Authentifizierungsmodus/Token zwischen Client und Gateway.
- HTTP-Nutzung, wo Geräteidentität erforderlich ist.

Häufige Signaturen:

- `device identity required` → unsicherer Kontext oder fehlende Geräteauthentifizierung.
- `origin not allowed` → Browser-`Origin` ist nicht in `gateway.controlUi.allowedOrigins`
  (oder Sie verbinden sich von einer Nicht-Loopback-Browser-Origin ohne explizite
  Zulassungsliste).
- `device nonce required` / `device nonce mismatch` → Client schließt den
  challengebasierten Geräteauthentifizierungsablauf nicht ab (`connect.challenge` + `device.nonce`).
- `device signature invalid` / `device signature expired` → Client hat die falsche
  Nutzlast (oder einen veralteten Zeitstempel) für den aktuellen Handshake signiert.
- `AUTH_TOKEN_MISMATCH` mit `canRetryWithDeviceToken=true` → Client kann einen vertrauenswürdigen Wiederholungsversuch mit zwischengespeichertem Gerätetoken durchführen.
- Dieser Wiederholungsversuch mit zwischengespeichertem Token verwendet erneut die mit dem
  gepaarten Gerätetoken gespeicherte Scope-Menge. Aufrufer mit explizitem `deviceToken` / expliziten `scopes` behalten stattdessen ihre angeforderte Scope-Menge bei.
- Außerhalb dieses Wiederholungswegs hat die Connect-Authentifizierung folgende Reihenfolge:
  zuerst explizites Shared Token/Passwort, dann explizites `deviceToken`, dann gespeichertes Gerätetoken,
  dann Bootstrap-Token.
- Auf dem asynchronen Tailscale-Serve-Control-UI-Pfad werden fehlgeschlagene Versuche für dasselbe
  `{scope, ip}` serialisiert, bevor der Limiter den Fehler erfasst. Zwei fehlerhafte gleichzeitige
  Wiederholungen desselben Clients können daher beim zweiten Versuch `retry later`
  statt zweier normaler Nichtübereinstimmungen ausgeben.
- `too many failed authentication attempts (retry later)` von einem Browser-Origin-
  Loopback-Client → wiederholte Fehlschläge derselben normalisierten `Origin` werden
  vorübergehend gesperrt; eine andere localhost-Origin verwendet einen separaten Bucket.
- wiederholtes `unauthorized` nach diesem Wiederholungsversuch → Drift zwischen Shared Token und Gerätetoken; aktualisieren Sie die Token-Konfiguration und genehmigen/rotieren Sie bei Bedarf das Gerätetoken erneut.
- `gateway connect failed:` → falscher Host/Port/falsches URL-Ziel.

### Kurzübersicht zu Authentifizierungs-Detailcodes

Verwenden Sie `error.details.code` aus der fehlgeschlagenen `connect`-Antwort, um die nächste Aktion auszuwählen:

| Detailcode                   | Bedeutung                                                | Empfohlene Aktion                                                                                                                                                                                                                                                                          |
| ---------------------------- | -------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `AUTH_TOKEN_MISSING`         | Der Client hat kein erforderliches Shared Token gesendet. | Fügen/setzen Sie das Token im Client und versuchen Sie es erneut. Für Dashboard-Pfade: `openclaw config get gateway.auth.token` und dann in die Einstellungen der Control UI einfügen.                                                                                                   |
| `AUTH_TOKEN_MISMATCH`        | Das Shared Token stimmte nicht mit dem Gateway-Auth-Token überein. | Wenn `canRetryWithDeviceToken=true`, erlauben Sie einen vertrauenswürdigen Wiederholungsversuch. Wiederholungsversuche mit zwischengespeichertem Token verwenden erneut die gespeicherten genehmigten Scopes; Aufrufer mit explizitem `deviceToken` / `scopes` behalten angeforderte Scopes bei. Wenn es weiterhin fehlschlägt, führen Sie die [token drift recovery checklist](/cli/devices#token-drift-recovery-checklist) aus. |
| `AUTH_DEVICE_TOKEN_MISMATCH` | Zwischengespeichertes gerätespezifisches Token ist veraltet oder widerrufen. | Rotieren/genehmigen Sie das Gerätetoken erneut mit der [devices CLI](/cli/devices), und verbinden Sie sich dann erneut.                                                                                                                                                                  |
| `PAIRING_REQUIRED`           | Die Geräteidentität ist bekannt, aber für diese Rolle nicht genehmigt. | Genehmigen Sie die ausstehende Anfrage: `openclaw devices list` und dann `openclaw devices approve <requestId>`.                                                                                                                                                                         |

Prüfung der Migration zu Geräteauthentifizierung v2:

```bash
openclaw --version
openclaw doctor
openclaw gateway status
```

Wenn Logs Nonce-/Signaturfehler zeigen, aktualisieren Sie den verbindenden Client und prüfen Sie, dass er:

1. auf `connect.challenge` wartet
2. die an die Challenge gebundene Nutzlast signiert
3. `connect.params.device.nonce` mit derselben Challenge-Nonce sendet

Wenn `openclaw devices rotate` / `revoke` / `remove` unerwartet verweigert wird:

- Sitzungen mit gepaartem Gerätetoken können nur **ihr eigenes** Gerät verwalten, es sei denn, der
  Aufrufer hat zusätzlich `operator.admin`
- `openclaw devices rotate --scope ...` kann nur Operator-Scopes anfordern, die
  die Aufrufersitzung bereits besitzt

Verwandt:

- [/web/control-ui](/web/control-ui)
- [/gateway/configuration](/de/gateway/configuration) (Gateway-Authentifizierungsmodi)
- [/gateway/trusted-proxy-auth](/de/gateway/trusted-proxy-auth)
- [/gateway/remote](/de/gateway/remote)
- [/cli/devices](/cli/devices)

## Gateway-Service läuft nicht

Verwenden Sie dies, wenn der Service installiert ist, der Prozess aber nicht aktiv bleibt.

```bash
openclaw gateway status
openclaw status
openclaw logs --follow
openclaw doctor
openclaw gateway status --deep   # scannt auch Services auf Systemebene
```

Achten Sie auf Folgendes:

- `Runtime: stopped` mit Hinweisen zum Beenden.
- Nichtübereinstimmung der Service-Konfiguration (`Config (cli)` vs `Config (service)`).
- Port-/Listener-Konflikte.
- Zusätzliche Installationen via launchd/systemd/schtasks bei Verwendung von `--deep`.
- Hinweise zur Bereinigung von `Other gateway-like services detected (best effort)`.

Häufige Signaturen:

- `Gateway start blocked: set gateway.mode=local` oder `existing config is missing gateway.mode` → lokaler Gateway-Modus ist nicht aktiviert, oder die Konfigurationsdatei wurde überschrieben und hat `gateway.mode` verloren. Lösung: Setzen Sie `gateway.mode="local"` in Ihrer Konfiguration oder führen Sie `openclaw onboard --mode local` / `openclaw setup` erneut aus, um die erwartete Konfiguration für den lokalen Modus wiederherzustellen. Wenn Sie OpenClaw über Podman ausführen, ist der Standardpfad der Konfiguration `~/.openclaw/openclaw.json`.
- `refusing to bind gateway ... without auth` → Nicht-Loopback-Bind ohne gültigen Gateway-Authentifizierungspfad (Token/Passwort oder, falls konfiguriert, trusted-proxy).
- `another gateway instance is already listening` / `EADDRINUSE` → Portkonflikt.
- `Other gateway-like services detected (best effort)` → veraltete oder parallele launchd-/systemd-/schtasks-Units existieren. Die meisten Setups sollten ein Gateway pro Maschine verwenden; wenn Sie tatsächlich mehr als eines benötigen, isolieren Sie Ports + Konfiguration/Status/Workspace. Siehe [/gateway#multiple-gateways-same-host](/de/gateway#multiple-gateways-same-host).

Verwandt:

- [/gateway/background-process](/de/gateway/background-process)
- [/gateway/configuration](/de/gateway/configuration)
- [/gateway/doctor](/de/gateway/doctor)

## Gateway-Probe-Warnungen

Verwenden Sie dies, wenn `openclaw gateway probe` etwas erreicht, aber trotzdem einen Warnblock ausgibt.

```bash
openclaw gateway probe
openclaw gateway probe --json
openclaw gateway probe --ssh user@gateway-host
```

Achten Sie auf Folgendes:

- `warnings[].code` und `primaryTargetId` in der JSON-Ausgabe.
- Ob sich die Warnung auf SSH-Fallback, mehrere Gateways, fehlende Scopes oder nicht auflösbare Auth-Refs bezieht.

Häufige Signaturen:

- `SSH tunnel failed to start; falling back to direct probes.` → SSH-Setup ist fehlgeschlagen, aber der Befehl hat dennoch direkte konfigurierte/Loopback-Ziele versucht.
- `multiple reachable gateways detected` → mehr als ein Ziel hat geantwortet. Das bedeutet normalerweise ein beabsichtigtes Multi-Gateway-Setup oder veraltete/duplizierte Listener.
- `Probe diagnostics are limited by gateway scopes (missing operator.read)` → Verbindung hat funktioniert, aber die Detail-RPC ist durch Scopes eingeschränkt; koppeln Sie Geräteidentität oder verwenden Sie Anmeldedaten mit `operator.read`.
- nicht aufgelöster Warntext zu `gateway.auth.*` / `gateway.remote.*` SecretRef → Authentifizierungsmaterial war in diesem Befehlspfad für das fehlgeschlagene Ziel nicht verfügbar.

Verwandt:

- [/cli/gateway](/cli/gateway)
- [/gateway#multiple-gateways-same-host](/de/gateway#multiple-gateways-same-host)
- [/gateway/remote](/de/gateway/remote)

## Kanal verbunden, aber Nachrichten fließen nicht

Wenn der Kanalstatus verbunden ist, aber kein Nachrichtenfluss stattfindet, konzentrieren Sie sich auf Richtlinien, Berechtigungen und kanalspezifische Zustellungsregeln.

```bash
openclaw channels status --probe
openclaw pairing list --channel <channel> [--account <id>]
openclaw status --deep
openclaw logs --follow
openclaw config get channels
```

Achten Sie auf Folgendes:

- DM-Richtlinie (`pairing`, `allowlist`, `open`, `disabled`).
- Zulassungsliste für Gruppen und Anforderungen an Erwähnungen.
- Fehlende Kanal-API-Berechtigungen/-Scopes.

Häufige Signaturen:

- `mention required` → Nachricht wird durch die Gruppen-Erwähnungsrichtlinie ignoriert.
- `pairing` / Spuren ausstehender Freigaben → Absender ist nicht genehmigt.
- `missing_scope`, `not_in_channel`, `Forbidden`, `401/403` → Problem mit Kanal-Authentifizierung/-Berechtigungen.

Verwandt:

- [/channels/troubleshooting](/de/channels/troubleshooting)
- [/channels/whatsapp](/de/channels/whatsapp)
- [/channels/telegram](/de/channels/telegram)
- [/channels/discord](/de/channels/discord)

## Cron- und Heartbeat-Zustellung

Wenn Cron oder Heartbeat nicht ausgeführt wurde oder nicht zugestellt wurde, prüfen Sie zuerst den Scheduler-Status und dann das Zustellungsziel.

```bash
openclaw cron status
openclaw cron list
openclaw cron runs --id <jobId> --limit 20
openclaw system heartbeat last
openclaw logs --follow
```

Achten Sie auf Folgendes:

- Cron ist aktiviert und der nächste Weckzeitpunkt ist vorhanden.
- Status der Job-Ausführungshistorie (`ok`, `skipped`, `error`).
- Gründe für übersprungene Heartbeats (`quiet-hours`, `requests-in-flight`, `alerts-disabled`, `empty-heartbeat-file`, `no-tasks-due`).

Häufige Signaturen:

- `cron: scheduler disabled; jobs will not run automatically` → Cron ist deaktiviert.
- `cron: timer tick failed` → Scheduler-Tick ist fehlgeschlagen; prüfen Sie Datei-/Log-/Laufzeitfehler.
- `heartbeat skipped` mit `reason=quiet-hours` → außerhalb des aktiven Zeitfensters.
- `heartbeat skipped` mit `reason=empty-heartbeat-file` → `HEARTBEAT.md` existiert, enthält aber nur leere Zeilen / Markdown-Überschriften, daher überspringt OpenClaw den Modellaufruf.
- `heartbeat skipped` mit `reason=no-tasks-due` → `HEARTBEAT.md` enthält einen `tasks:`-Block, aber für diesen Tick ist keine Aufgabe fällig.
- `heartbeat: unknown accountId` → ungültige Konto-ID für das Heartbeat-Zustellungsziel.
- `heartbeat skipped` mit `reason=dm-blocked` → Heartbeat-Ziel wurde zu einem DM-ähnlichen Ziel aufgelöst, während `agents.defaults.heartbeat.directPolicy` (oder eine Überschreibung pro Agent) auf `block` gesetzt ist.

Verwandt:

- [/automation/cron-jobs#troubleshooting](/de/automation/cron-jobs#troubleshooting)
- [/automation/cron-jobs](/de/automation/cron-jobs)
- [/gateway/heartbeat](/de/gateway/heartbeat)

## Gepaartes Node-Tool schlägt fehl

Wenn ein Node gepaart ist, Tools aber fehlschlagen, isolieren Sie Vordergrund-, Berechtigungs- und Genehmigungsstatus.

```bash
openclaw nodes status
openclaw nodes describe --node <idOrNameOrIp>
openclaw approvals get --node <idOrNameOrIp>
openclaw logs --follow
openclaw status
```

Achten Sie auf Folgendes:

- Node ist online und verfügt über die erwarteten Fähigkeiten.
- OS-Berechtigungen für Kamera/Mikrofon/Standort/Bildschirm.
- Exec-Genehmigungen und Status der Zulassungsliste.

Häufige Signaturen:

- `NODE_BACKGROUND_UNAVAILABLE` → Node-App muss im Vordergrund sein.
- `*_PERMISSION_REQUIRED` / `LOCATION_PERMISSION_REQUIRED` → fehlende OS-Berechtigung.
- `SYSTEM_RUN_DENIED: approval required` → Exec-Genehmigung steht aus.
- `SYSTEM_RUN_DENIED: allowlist miss` → Befehl wurde durch die Zulassungsliste blockiert.

Verwandt:

- [/nodes/troubleshooting](/de/nodes/troubleshooting)
- [/nodes/index](/de/nodes/index)
- [/tools/exec-approvals](/de/tools/exec-approvals)

## Browser-Tool schlägt fehl

Verwenden Sie dies, wenn Aktionen des Browser-Tools fehlschlagen, obwohl das Gateway selbst gesund ist.

```bash
openclaw browser status
openclaw browser start --browser-profile openclaw
openclaw browser profiles
openclaw logs --follow
openclaw doctor
```

Achten Sie auf Folgendes:

- Ob `plugins.allow` gesetzt ist und `browser` enthält.
- Gültiger Pfad zur Browser-Executable.
- Erreichbarkeit des CDP-Profils.
- Verfügbarkeit von lokalem Chrome für `existing-session`- / `user`-Profile.

Häufige Signaturen:

- `unknown command "browser"` oder `unknown command 'browser'` → das gebündelte Browser-Plugin wird durch `plugins.allow` ausgeschlossen.
- Browser-Tool fehlt / ist nicht verfügbar, obwohl `browser.enabled=true` → `plugins.allow` schließt `browser` aus, daher wurde das Plugin nie geladen.
- `Failed to start Chrome CDP on port` → Browser-Prozess konnte nicht gestartet werden.
- `browser.executablePath not found` → der konfigurierte Pfad ist ungültig.
- `browser.cdpUrl must be http(s) or ws(s)` → die konfigurierte CDP-URL verwendet ein nicht unterstütztes Schema wie `file:` oder `ftp:`.
- `browser.cdpUrl has invalid port` → die konfigurierte CDP-URL hat einen fehlerhaften oder ungültigen Port.
- `No Chrome tabs found for profile="user"` → das Chrome-MCP-Attach-Profil hat keine offenen lokalen Chrome-Tabs.
- `Remote CDP for profile "<name>" is not reachable` → der konfigurierte Remote-CDP-Endpunkt ist vom Gateway-Host aus nicht erreichbar.
- `Browser attachOnly is enabled ... not reachable` oder `Browser attachOnly is enabled and CDP websocket ... is not reachable` → das Attach-only-Profil hat kein erreichbares Ziel, oder der HTTP-Endpunkt hat geantwortet, aber das CDP-WebSocket konnte weiterhin nicht geöffnet werden.
- `Playwright is not available in this gateway build; '<feature>' is unsupported.` → in der aktuellen Gateway-Installation fehlt das vollständige Playwright-Paket; ARIA-Snapshots und einfache Seitenscreenshots können weiterhin funktionieren, aber Navigation, AI-Snapshots, Element-Screenshots über CSS-Selektoren und PDF-Export bleiben nicht verfügbar.
- `fullPage is not supported for element screenshots` → die Screenshot-Anforderung mischte `--full-page` mit `--ref` oder `--element`.
- `element screenshots are not supported for existing-session profiles; use ref from snapshot.` → Screenshot-Aufrufe für Chrome MCP / `existing-session` müssen Seitenerfassung oder eine Snapshot-`--ref` verwenden, nicht CSS-`--element`.
- `existing-session file uploads do not support element selectors; use ref/inputRef.` → Upload-Hooks von Chrome MCP benötigen Snapshot-Refs, keine CSS-Selektoren.
- `existing-session file uploads currently support one file at a time.` → senden Sie bei Chrome-MCP-Profilen einen Upload pro Aufruf.
- `existing-session dialog handling does not support timeoutMs.` → Dialog-Hooks bei Chrome-MCP-Profilen unterstützen keine Timeout-Überschreibungen.
- `response body is not supported for existing-session profiles yet.` → `responsebody` erfordert weiterhin einen verwalteten Browser oder ein Raw-CDP-Profil.
- veraltete Overrides für Viewport / Dunkelmodus / Gebietsschema / Offline-Modus auf Attach-only- oder Remote-CDP-Profilen → führen Sie `openclaw browser stop --browser-profile <name>` aus, um die aktive Kontrollsitzung zu schließen und den Emulationsstatus von Playwright/CDP freizugeben, ohne das gesamte Gateway neu zu starten.

Verwandt:

- [/tools/browser-linux-troubleshooting](/de/tools/browser-linux-troubleshooting)
- [/tools/browser](/de/tools/browser)

## Wenn Sie ein Upgrade durchgeführt haben und plötzlich etwas nicht mehr funktioniert

Die meisten Probleme nach Upgrades sind Konfigurationsdrift oder inzwischen strenger durchgesetzte Standardwerte.

### 1) Verhalten von Authentifizierung und URL-Überschreibung hat sich geändert

```bash
openclaw gateway status
openclaw config get gateway.mode
openclaw config get gateway.remote.url
openclaw config get gateway.auth.mode
```

Was zu prüfen ist:

- Wenn `gateway.mode=remote`, können CLI-Aufrufe auf ein Remote-Ziel gehen, während Ihr lokaler Service in Ordnung ist.
- Explizite `--url`-Aufrufe fallen nicht auf gespeicherte Anmeldedaten zurück.

Häufige Signaturen:

- `gateway connect failed:` → falsches URL-Ziel.
- `unauthorized` → Endpunkt ist erreichbar, aber die Authentifizierung ist falsch.

### 2) Guardrails für Bind und Authentifizierung sind strenger

```bash
openclaw config get gateway.bind
openclaw config get gateway.auth.mode
openclaw config get gateway.auth.token
openclaw gateway status
openclaw logs --follow
```

Was zu prüfen ist:

- Nicht-Loopback-Binds (`lan`, `tailnet`, `custom`) benötigen einen gültigen Gateway-Authentifizierungspfad: Authentifizierung per Shared Token/Passwort oder eine korrekt konfigurierte Nicht-Loopback-`trusted-proxy`-Bereitstellung.
- Alte Schlüssel wie `gateway.token` ersetzen `gateway.auth.token` nicht.

Häufige Signaturen:

- `refusing to bind gateway ... without auth` → Nicht-Loopback-Bind ohne gültigen Gateway-Authentifizierungspfad.
- `RPC probe: failed` während die Runtime läuft → Gateway lebt, ist aber mit der aktuellen Authentifizierung/URL nicht erreichbar.

### 3) Pairing- und Geräteidentitätsstatus haben sich geändert

```bash
openclaw devices list
openclaw pairing list --channel <channel> [--account <id>]
openclaw logs --follow
openclaw doctor
```

Was zu prüfen ist:

- Ausstehende Gerätefreigaben für Dashboard/Nodes.
- Ausstehende DM-Pairing-Freigaben nach Richtlinien- oder Identitätsänderungen.

Häufige Signaturen:

- `device identity required` → Geräteauthentifizierung ist nicht erfüllt.
- `pairing required` → Absender/Gerät muss genehmigt werden.

Wenn Service-Konfiguration und Runtime nach den Prüfungen weiterhin nicht übereinstimmen, installieren Sie die Service-Metadaten aus demselben Profil-/Statusverzeichnis neu:

```bash
openclaw gateway install --force
openclaw gateway restart
```

Verwandt:

- [/gateway/pairing](/de/gateway/pairing)
- [/gateway/authentication](/de/gateway/authentication)
- [/gateway/background-process](/de/gateway/background-process)
