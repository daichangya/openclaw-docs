---
read_when:
    - Der Troubleshooting-Hub Sie für eine tiefere Diagnose hierher geleitet hat
    - Sie stabile symptomorientierte Runbook-Abschnitte mit exakten Befehlen benötigen
summary: Tiefgehendes Troubleshooting-Runbook für Gateway, Kanäle, Automatisierung, Nodes und Browser
title: Fehlerbehebung
x-i18n:
    generated_at: "2026-04-05T12:44:58Z"
    model: gpt-5.4
    provider: openai
    source_hash: 028226726e6adc45ca61d41510a953c4e21a3e85f3082af9e8085745c6ac3ec1
    source_path: gateway/troubleshooting.md
    workflow: 15
---

# Gateway-Fehlerbehebung

Diese Seite ist das tiefgehende Runbook.
Beginnen Sie bei [/help/troubleshooting](/help/troubleshooting), wenn Sie zuerst den schnellen Triage-Ablauf möchten.

## Befehlsleiter

Führen Sie diese zuerst in genau dieser Reihenfolge aus:

```bash
openclaw status
openclaw gateway status
openclaw logs --follow
openclaw doctor
openclaw channels status --probe
```

Erwartete Signale für einen gesunden Zustand:

- `openclaw gateway status` zeigt `Runtime: running` und `RPC probe: ok`.
- `openclaw doctor` meldet keine blockierenden Konfigurations-/Dienstprobleme.
- `openclaw channels status --probe` zeigt den Live-Transportstatus pro Konto und,
  wo unterstützt, Prüf-/Audit-Ergebnisse wie `works` oder `audit ok`.

## Anthropic 429: Extra Usage für langen Kontext erforderlich

Verwenden Sie dies, wenn Logs/Fehler Folgendes enthalten:
`HTTP 429: rate_limit_error: Extra usage is required for long context requests`.

```bash
openclaw logs --follow
openclaw models status
openclaw config get agents.defaults.models
```

Achten Sie auf Folgendes:

- Das ausgewählte Anthropic-Opus-/Sonnet-Modell hat `params.context1m: true`.
- Die aktuellen Anthropic-Anmeldedaten sind nicht für die Nutzung mit langem Kontext geeignet.
- Anfragen schlagen nur bei langen Sitzungen/Modelläufen fehl, die den 1M-Beta-Pfad benötigen.

Optionen zur Behebung:

1. `context1m` für dieses Modell deaktivieren, um auf das normale Kontextfenster zurückzufallen.
2. Einen Anthropic-API-Schlüssel mit Abrechnung verwenden oder Anthropic Extra Usage für das Anthropic-OAuth-/Abonnementkonto aktivieren.
3. Fallback-Modelle konfigurieren, damit Läufe fortgesetzt werden, wenn Anthropic-Anfragen mit langem Kontext abgelehnt werden.

Verwandt:

- [/providers/anthropic](/providers/anthropic)
- [/reference/token-use](/reference/token-use)
- [/help/faq#why-am-i-seeing-http-429-ratelimiterror-from-anthropic](/help/faq#why-am-i-seeing-http-429-ratelimiterror-from-anthropic)

## Keine Antworten

Wenn Kanäle aktiv sind, aber nichts antwortet, prüfen Sie zuerst Routing und Richtlinien, bevor Sie etwas erneut verbinden.

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
- Nicht übereinstimmende Kanal-/Gruppen-Allowlists.

Häufige Signaturen:

- `drop guild message (mention required` → Gruppennachricht wird ignoriert, bis eine Erwähnung erfolgt.
- `pairing request` → der Absender benötigt eine Genehmigung.
- `blocked` / `allowlist` → Absender/Kanal wurde durch die Richtlinie gefiltert.

Verwandt:

- [/channels/troubleshooting](/channels/troubleshooting)
- [/channels/pairing](/channels/pairing)
- [/channels/groups](/channels/groups)

## Konnektivität von Dashboard / Control UI

Wenn sich das Dashboard / die Control UI nicht verbinden kann, prüfen Sie URL, Auth-Modus und Annahmen zum sicheren Kontext.

```bash
openclaw gateway status
openclaw status
openclaw logs --follow
openclaw doctor
openclaw gateway status --json
```

Achten Sie auf Folgendes:

- Korrekte Probe-URL und Dashboard-URL.
- Nicht übereinstimmender Auth-Modus/Token zwischen Client und Gateway.
- HTTP-Nutzung, wo Geräteidentität erforderlich ist.

Häufige Signaturen:

- `device identity required` → unsicherer Kontext oder fehlende Geräteauthentifizierung.
- `origin not allowed` → Browser-`Origin` ist nicht in `gateway.controlUi.allowedOrigins`
  (oder Sie verbinden sich von einem Browser-Origin außerhalb von Loopback ohne explizite
  Allowlist).
- `device nonce required` / `device nonce mismatch` → der Client schließt den
  challenge-basierten Geräteauthentifizierungsablauf (`connect.challenge` + `device.nonce`) nicht ab.
- `device signature invalid` / `device signature expired` → der Client hat die falsche
  Payload (oder einen veralteten Zeitstempel) für den aktuellen Handshake signiert.
- `AUTH_TOKEN_MISMATCH` mit `canRetryWithDeviceToken=true` → der Client kann einen vertrauenswürdigen Wiederholungsversuch mit einem zwischengespeicherten Gerätetoken durchführen.
- Dieser Wiederholungsversuch mit zwischengespeichertem Token verwendet erneut die mit dem gekoppelten
  Gerätetoken gespeicherte Scope-Menge. Aufrufer mit explizitem `deviceToken` / expliziten `scopes` behalten stattdessen ihre
  angeforderte Scope-Menge.
- Außerhalb dieses Wiederholungsversuchs hat Connect-Auth folgende Vorrangreihenfolge: explizites gemeinsames
  Token/Passwort zuerst, dann explizites `deviceToken`, dann gespeichertes Gerätetoken,
  dann Bootstrap-Token.
- Auf dem asynchronen Tailscale-Serve-Control-UI-Pfad werden fehlgeschlagene Versuche für dieselbe
  `{scope, ip}` serialisiert, bevor der Limiter den Fehler erfasst. Zwei schlechte gleichzeitige
  Wiederholungsversuche desselben Clients können daher beim zweiten Versuch `retry later`
  ausgeben statt zwei einfacher Nichtübereinstimmungen.
- `too many failed authentication attempts (retry later)` von einem Loopback-Client mit Browser-Origin
  → wiederholte Fehler aus demselben normalisierten `Origin` werden vorübergehend ausgesperrt;
  ein anderer localhost-Origin verwendet einen separaten Bucket.
- wiederholtes `unauthorized` nach diesem Wiederholungsversuch → Drift zwischen gemeinsamem Token und Gerätetoken; Token-Konfiguration aktualisieren und Gerätetoken bei Bedarf erneut genehmigen/rotieren.
- `gateway connect failed:` → falsches Ziel für Host/Port/URL.

### Schnellzuordnung der Auth-Detailcodes

Verwenden Sie `error.details.code` aus der fehlgeschlagenen `connect`-Antwort, um die nächste Aktion auszuwählen:

| Detailcode                  | Bedeutung                                               | Empfohlene Aktion                                                                                                                                                                                                                                                                        |
| --------------------------- | ------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `AUTH_TOKEN_MISSING`        | Client hat ein erforderliches gemeinsames Token nicht gesendet. | Token im Client einfügen/setzen und erneut versuchen. Für Dashboard-Pfade: `openclaw config get gateway.auth.token` und dann in die Control-UI-Einstellungen einfügen.                                                                                                                    |
| `AUTH_TOKEN_MISMATCH`       | Gemeinsames Token stimmte nicht mit dem Gateway-Auth-Token überein. | Wenn `canRetryWithDeviceToken=true`, einen vertrauenswürdigen Wiederholungsversuch zulassen. Wiederholungsversuche mit Cache-Token verwenden erneut gespeicherte genehmigte Scopes; Aufrufer mit explizitem `deviceToken` / `scopes` behalten angeforderte Scopes. Wenn es weiter fehlschlägt, die [Checkliste zur Wiederherstellung bei Token-Drift](/cli/devices#token-drift-recovery-checklist) ausführen. |
| `AUTH_DEVICE_TOKEN_MISMATCH` | Das zwischengespeicherte Token pro Gerät ist veraltet oder widerrufen. | Gerätetoken über [devices CLI](/cli/devices) rotieren/erneut genehmigen und dann erneut verbinden.                                                                                                                                                                                      |
| `PAIRING_REQUIRED`          | Geräteidentität ist bekannt, aber für diese Rolle nicht genehmigt. | Ausstehende Anfrage genehmigen: `openclaw devices list` und dann `openclaw devices approve <requestId>`.                                                                                                                                                                                |

Prüfung der Migration zu Device Auth v2:

```bash
openclaw --version
openclaw doctor
openclaw gateway status
```

Wenn Logs Nonce-/Signaturfehler zeigen, aktualisieren Sie den verbindenden Client und prüfen Sie, dass er:

1. auf `connect.challenge` wartet
2. die an die Challenge gebundene Payload signiert
3. `connect.params.device.nonce` mit derselben Challenge-Nonce sendet

Wenn `openclaw devices rotate` / `revoke` / `remove` unerwartet verweigert wird:

- Sitzungen mit gekoppeltem Gerätetoken können nur **ihr eigenes** Gerät verwalten, außer der
  Aufrufer hat zusätzlich `operator.admin`
- `openclaw devices rotate --scope ...` kann nur Operator-Scopes anfordern, die
  die Aufrufer-Sitzung bereits besitzt

Verwandt:

- [/web/control-ui](/web/control-ui)
- [/gateway/configuration](/gateway/configuration) (Gateway-Auth-Modi)
- [/gateway/trusted-proxy-auth](/gateway/trusted-proxy-auth)
- [/gateway/remote](/gateway/remote)
- [/cli/devices](/cli/devices)

## Gateway-Dienst läuft nicht

Verwenden Sie dies, wenn der Dienst installiert ist, der Prozess aber nicht aktiv bleibt.

```bash
openclaw gateway status
openclaw status
openclaw logs --follow
openclaw doctor
openclaw gateway status --deep   # scannt auch Dienste auf Systemebene
```

Achten Sie auf Folgendes:

- `Runtime: stopped` mit Hinweisen zum Beenden.
- Nicht übereinstimmende Dienstkonfiguration (`Config (cli)` vs `Config (service)`).
- Port-/Listener-Konflikte.
- Zusätzliche launchd-/systemd-/schtasks-Installationen bei Verwendung von `--deep`.
- Bereinigungshinweise unter `Other gateway-like services detected (best effort)`.

Häufige Signaturen:

- `Gateway start blocked: set gateway.mode=local` oder `existing config is missing gateway.mode` → der lokale Gateway-Modus ist nicht aktiviert, oder die Konfigurationsdatei wurde beschädigt und hat `gateway.mode` verloren. Behebung: `gateway.mode="local"` in Ihrer Konfiguration setzen oder `openclaw onboard --mode local` / `openclaw setup` erneut ausführen, um die erwartete Konfiguration für den lokalen Modus wiederherzustellen. Wenn Sie OpenClaw über Podman ausführen, ist der Standardpfad für die Konfiguration `~/.openclaw/openclaw.json`.
- `refusing to bind gateway ... without auth` → Nicht-Loopback-Binding ohne gültigen Gateway-Auth-Pfad (Token/Passwort oder, wo konfiguriert, trusted-proxy).
- `another gateway instance is already listening` / `EADDRINUSE` → Portkonflikt.
- `Other gateway-like services detected (best effort)` → veraltete oder parallele launchd-/systemd-/schtasks-Units existieren. Die meisten Setups sollten ein Gateway pro Maschine beibehalten; wenn Sie mehr als eines benötigen, isolieren Sie Ports + Konfiguration/Status/Workspace. Siehe [/gateway#multiple-gateways-same-host](/gateway#multiple-gateways-same-host).

Verwandt:

- [/gateway/background-process](/gateway/background-process)
- [/gateway/configuration](/gateway/configuration)
- [/gateway/doctor](/gateway/doctor)

## Gateway-Probe-Warnungen

Verwenden Sie dies, wenn `openclaw gateway probe` etwas erreicht, aber trotzdem einen Warnblock ausgibt.

```bash
openclaw gateway probe
openclaw gateway probe --json
openclaw gateway probe --ssh user@gateway-host
```

Achten Sie auf Folgendes:

- `warnings[].code` und `primaryTargetId` in der JSON-Ausgabe.
- Ob sich die Warnung auf SSH-Fallback, mehrere Gateways, fehlende Scopes oder nicht aufgelöste Auth-Refs bezieht.

Häufige Signaturen:

- `SSH tunnel failed to start; falling back to direct probes.` → das SSH-Setup ist fehlgeschlagen, aber der Befehl hat trotzdem direkte konfigurierte/Loopback-Ziele versucht.
- `multiple reachable gateways detected` → mehr als ein Ziel hat geantwortet. Normalerweise bedeutet das ein absichtliches Multi-Gateway-Setup oder veraltete/doppelte Listener.
- `Probe diagnostics are limited by gateway scopes (missing operator.read)` → Verbindung hat funktioniert, aber Detail-RPC ist durch Scopes eingeschränkt; Geräteidentität pairen oder Anmeldedaten mit `operator.read` verwenden.
- nicht aufgelöster Warntext zu `gateway.auth.*` / `gateway.remote.*` SecretRef → Auth-Material war in diesem Befehlspfad für das fehlgeschlagene Ziel nicht verfügbar.

Verwandt:

- [/cli/gateway](/cli/gateway)
- [/gateway#multiple-gateways-same-host](/gateway#multiple-gateways-same-host)
- [/gateway/remote](/gateway/remote)

## Kanal verbunden, aber Nachrichten fließen nicht

Wenn der Kanalstatus verbunden ist, der Nachrichtenfluss aber tot ist, konzentrieren Sie sich auf Richtlinien, Berechtigungen und kanalspezifische Zustellungsregeln.

```bash
openclaw channels status --probe
openclaw pairing list --channel <channel> [--account <id>]
openclaw status --deep
openclaw logs --follow
openclaw config get channels
```

Achten Sie auf Folgendes:

- DM-Richtlinie (`pairing`, `allowlist`, `open`, `disabled`).
- Gruppen-Allowlist und Erwähnungsanforderungen.
- Fehlende API-Berechtigungen/Scopes des Kanals.

Häufige Signaturen:

- `mention required` → Nachricht wird durch die Erwähnungsrichtlinie für Gruppen ignoriert.
- `pairing` / ausstehende Genehmigungsspuren → Absender ist nicht genehmigt.
- `missing_scope`, `not_in_channel`, `Forbidden`, `401/403` → Problem mit Kanal-Auth/Berechtigungen.

Verwandt:

- [/channels/troubleshooting](/channels/troubleshooting)
- [/channels/whatsapp](/channels/whatsapp)
- [/channels/telegram](/channels/telegram)
- [/channels/discord](/channels/discord)

## Cron- und Heartbeat-Zustellung

Wenn Cron oder Heartbeat nicht gelaufen ist oder nicht zugestellt wurde, prüfen Sie zuerst den Scheduler-Status und dann das Zustellungsziel.

```bash
openclaw cron status
openclaw cron list
openclaw cron runs --id <jobId> --limit 20
openclaw system heartbeat last
openclaw logs --follow
```

Achten Sie auf Folgendes:

- Cron ist aktiviert und der nächste Wake ist vorhanden.
- Status des Job-Ausführungsverlaufs (`ok`, `skipped`, `error`).
- Gründe für das Überspringen des Heartbeats (`quiet-hours`, `requests-in-flight`, `alerts-disabled`, `empty-heartbeat-file`, `no-tasks-due`).

Häufige Signaturen:

- `cron: scheduler disabled; jobs will not run automatically` → Cron deaktiviert.
- `cron: timer tick failed` → Scheduler-Tick fehlgeschlagen; prüfen Sie Datei-/Log-/Laufzeitfehler.
- `heartbeat skipped` mit `reason=quiet-hours` → außerhalb des Fensters aktiver Stunden.
- `heartbeat skipped` mit `reason=empty-heartbeat-file` → `HEARTBEAT.md` existiert, enthält aber nur leere Zeilen / Markdown-Header, daher überspringt OpenClaw den Modellaufruf.
- `heartbeat skipped` mit `reason=no-tasks-due` → `HEARTBEAT.md` enthält einen Block `tasks:`, aber bei diesem Tick ist keine der Aufgaben fällig.
- `heartbeat: unknown accountId` → ungültige accountId für das Zustellungsziel des Heartbeats.
- `heartbeat skipped` mit `reason=dm-blocked` → das Heartbeat-Ziel wurde zu einem Ziel im DM-Stil aufgelöst, während `agents.defaults.heartbeat.directPolicy` (oder eine Überschreibung pro Agent) auf `block` gesetzt ist.

Verwandt:

- [/automation/cron-jobs#troubleshooting](/automation/cron-jobs#troubleshooting)
- [/automation/cron-jobs](/automation/cron-jobs)
- [/gateway/heartbeat](/gateway/heartbeat)

## Tool eines gekoppelten Nodes schlägt fehl

Wenn ein Node gekoppelt ist, Tools aber fehlschlagen, isolieren Sie Vordergrund, Berechtigung und Genehmigungsstatus.

```bash
openclaw nodes status
openclaw nodes describe --node <idOrNameOrIp>
openclaw approvals get --node <idOrNameOrIp>
openclaw logs --follow
openclaw status
```

Achten Sie auf Folgendes:

- Node ist online und hat die erwarteten Fähigkeiten.
- Vom Betriebssystem gewährte Berechtigungen für Kamera/Mikrofon/Standort/Bildschirm.
- Exec-Genehmigungen und Allowlist-Status.

Häufige Signaturen:

- `NODE_BACKGROUND_UNAVAILABLE` → Node-App muss im Vordergrund sein.
- `*_PERMISSION_REQUIRED` / `LOCATION_PERMISSION_REQUIRED` → fehlende Betriebssystemberechtigung.
- `SYSTEM_RUN_DENIED: approval required` → Exec-Genehmigung ausstehend.
- `SYSTEM_RUN_DENIED: allowlist miss` → Befehl durch Allowlist blockiert.

Verwandt:

- [/nodes/troubleshooting](/nodes/troubleshooting)
- [/nodes/index](/nodes/index)
- [/tools/exec-approvals](/tools/exec-approvals)

## Browser-Tool schlägt fehl

Verwenden Sie dies, wenn Browser-Tool-Aktionen fehlschlagen, obwohl das Gateway selbst gesund ist.

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
- Verfügbarkeit von lokalem Chrome für Profile `existing-session` / `user`.

Häufige Signaturen:

- `unknown command "browser"` oder `unknown command 'browser'` → das gebündelte Browser-Plugin wird durch `plugins.allow` ausgeschlossen.
- Browser-Tool fehlt / ist nicht verfügbar, obwohl `browser.enabled=true` gesetzt ist → `plugins.allow` schließt `browser` aus, sodass das Plugin nie geladen wurde.
- `Failed to start Chrome CDP on port` → Browser-Prozess konnte nicht gestartet werden.
- `browser.executablePath not found` → der konfigurierte Pfad ist ungültig.
- `browser.cdpUrl must be http(s) or ws(s)` → die konfigurierte CDP-URL verwendet ein nicht unterstütztes Schema wie `file:` oder `ftp:`.
- `browser.cdpUrl has invalid port` → die konfigurierte CDP-URL hat einen ungültigen oder außerhalb des Bereichs liegenden Port.
- `No Chrome tabs found for profile="user"` → das Chrome-MCP-Attach-Profil hat keine offenen lokalen Chrome-Tabs.
- `Remote CDP for profile "<name>" is not reachable` → der konfigurierte entfernte CDP-Endpunkt ist vom Gateway-Host aus nicht erreichbar.
- `Browser attachOnly is enabled ... not reachable` oder `Browser attachOnly is enabled and CDP websocket ... is not reachable` → das Attach-only-Profil hat kein erreichbares Ziel, oder der HTTP-Endpunkt hat geantwortet, aber das CDP-WebSocket konnte trotzdem nicht geöffnet werden.
- `Playwright is not available in this gateway build; '<feature>' is unsupported.` → die aktuelle Gateway-Installation enthält nicht das vollständige Playwright-Paket; ARIA-Snapshots und einfache Seitenscreenshots können weiterhin funktionieren, aber Navigation, KI-Snapshots, Element-Screenshots über CSS-Selektoren und PDF-Export bleiben nicht verfügbar.
- `fullPage is not supported for element screenshots` → die Screenshot-Anfrage hat `--full-page` mit `--ref` oder `--element` kombiniert.
- `element screenshots are not supported for existing-session profiles; use ref from snapshot.` → Screenshot-Aufrufe von Chrome MCP / `existing-session` müssen Seitenerfassung oder ein Snapshot-`--ref` verwenden, nicht CSS-`--element`.
- `existing-session file uploads do not support element selectors; use ref/inputRef.` → Upload-Hooks von Chrome MCP benötigen Snapshot-Refs, keine CSS-Selektoren.
- `existing-session file uploads currently support one file at a time.` → bei Chrome-MCP-Profilen einen Upload pro Aufruf senden.
- `existing-session dialog handling does not support timeoutMs.` → Dialog-Hooks bei Chrome-MCP-Profilen unterstützen keine Timeout-Überschreibungen.
- `response body is not supported for existing-session profiles yet.` → `responsebody` erfordert weiterhin einen verwalteten Browser oder ein rohes CDP-Profil.
- veraltete Überschreibungen für Viewport / Dark Mode / Locale / Offline in Attach-only- oder entfernten CDP-Profilen → `openclaw browser stop --browser-profile <name>` ausführen, um die aktive Steuersitzung zu schließen und den Emulationszustand von Playwright/CDP freizugeben, ohne das gesamte Gateway neu zu starten.

Verwandt:

- [/tools/browser-linux-troubleshooting](/tools/browser-linux-troubleshooting)
- [/tools/browser](/tools/browser)

## Wenn Sie ein Upgrade durchgeführt haben und plötzlich etwas nicht mehr funktioniert

Die meisten Probleme nach einem Upgrade sind Konfigurationsdrift oder strengere Standardwerte, die jetzt durchgesetzt werden.

### 1) Verhalten von Auth und URL-Überschreibungen hat sich geändert

```bash
openclaw gateway status
openclaw config get gateway.mode
openclaw config get gateway.remote.url
openclaw config get gateway.auth.mode
```

Was zu prüfen ist:

- Wenn `gateway.mode=remote` gesetzt ist, können CLI-Aufrufe remote zielen, während Ihr lokaler Dienst in Ordnung ist.
- Explizite Aufrufe mit `--url` greifen nicht auf gespeicherte Anmeldedaten zurück.

Häufige Signaturen:

- `gateway connect failed:` → falsches URL-Ziel.
- `unauthorized` → Endpunkt erreichbar, aber falsche Auth.

### 2) Guardrails für Bind und Auth sind strenger

```bash
openclaw config get gateway.bind
openclaw config get gateway.auth.mode
openclaw config get gateway.auth.token
openclaw gateway status
openclaw logs --follow
```

Was zu prüfen ist:

- Nicht-Loopback-Bindings (`lan`, `tailnet`, `custom`) benötigen einen gültigen Gateway-Auth-Pfad: Auth mit gemeinsamem Token/Passwort oder eine korrekt konfigurierte Bereitstellung von `trusted-proxy` außerhalb von Loopback.
- Alte Schlüssel wie `gateway.token` ersetzen `gateway.auth.token` nicht.

Häufige Signaturen:

- `refusing to bind gateway ... without auth` → Nicht-Loopback-Binding ohne gültigen Gateway-Auth-Pfad.
- `RPC probe: failed` während die Runtime läuft → Gateway lebt, ist aber mit der aktuellen Auth/URL nicht erreichbar.

### 3) Pairing- und Geräteidentitätsstatus hat sich geändert

```bash
openclaw devices list
openclaw pairing list --channel <channel> [--account <id>]
openclaw logs --follow
openclaw doctor
```

Was zu prüfen ist:

- Ausstehende Gerätegenehmigungen für Dashboard/Nodes.
- Ausstehende DM-Pairing-Genehmigungen nach Änderungen an Richtlinie oder Identität.

Häufige Signaturen:

- `device identity required` → Geräteauthentifizierung nicht erfüllt.
- `pairing required` → Absender/Gerät muss genehmigt werden.

Wenn Dienstkonfiguration und Laufzeit nach den Prüfungen weiterhin nicht übereinstimmen, installieren Sie die Dienstmetadaten aus demselben Profil-/Statusverzeichnis neu:

```bash
openclaw gateway install --force
openclaw gateway restart
```

Verwandt:

- [/gateway/pairing](/gateway/pairing)
- [/gateway/authentication](/gateway/authentication)
- [/gateway/background-process](/gateway/background-process)
