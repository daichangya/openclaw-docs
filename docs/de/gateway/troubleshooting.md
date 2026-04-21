---
read_when:
    - Das Hub für die Fehlerbehebung hat Sie für eine tiefergehende Diagnose hierher verwiesen
    - Sie benötigen stabile, symptombasierte Runbook-Abschnitte mit exakten Befehlen
summary: Detailliertes Runbook zur Fehlerbehebung für Gateway, Kanäle, Automatisierung, Nodes und Browser
title: Fehlerbehebung
x-i18n:
    generated_at: "2026-04-21T06:25:46Z"
    model: gpt-5.4
    provider: openai
    source_hash: 2afb105376bb467e5a344e6d73726908cb718fa13116b751fddb494a0b641c42
    source_path: gateway/troubleshooting.md
    workflow: 15
---

# Fehlerbehebung beim Gateway

Diese Seite ist das ausführliche Runbook.
Beginnen Sie bei [/help/troubleshooting](/de/help/troubleshooting), wenn Sie zuerst den schnellen Triage-Ablauf möchten.

## Befehlsleiter

Führen Sie diese zuerst aus, in dieser Reihenfolge:

```bash
openclaw status
openclaw gateway status
openclaw logs --follow
openclaw doctor
openclaw channels status --probe
```

Erwartete Signale für einen gesunden Zustand:

- `openclaw gateway status` zeigt `Runtime: running`, `Connectivity probe: ok` und eine Zeile `Capability: ...`.
- `openclaw doctor` meldet keine blockierenden Konfigurations-/Serviceprobleme.
- `openclaw channels status --probe` zeigt Live-Transportstatus pro Konto und,
  wo unterstützt, Probe-/Audit-Ergebnisse wie `works` oder `audit ok`.

## Anthropic 429: zusätzliche Nutzung für langen Kontext erforderlich

Verwenden Sie dies, wenn Logs/Fehler Folgendes enthalten:
`HTTP 429: rate_limit_error: Extra usage is required for long context requests`.

```bash
openclaw logs --follow
openclaw models status
openclaw config get agents.defaults.models
```

Achten Sie auf:

- Das ausgewählte Anthropic-Opus-/Sonnet-Modell hat `params.context1m: true`.
- Die aktuelle Anthropic-Anmeldedaten sind nicht für die Nutzung mit langem Kontext geeignet.
- Anfragen schlagen nur bei langen Sitzungen/Modelläufen fehl, die den 1M-Beta-Pfad benötigen.

Optionen zur Behebung:

1. Deaktivieren Sie `context1m` für dieses Modell, um auf das normale Kontextfenster zurückzufallen.
2. Verwenden Sie Anthropic-Anmeldedaten, die für Anfragen mit langem Kontext geeignet sind, oder wechseln Sie zu einem Anthropic-API-Schlüssel.
3. Konfigurieren Sie Fallback-Modelle, damit Läufe fortgesetzt werden, wenn Anthropic-Anfragen mit langem Kontext abgelehnt werden.

Verwandt:

- [/providers/anthropic](/de/providers/anthropic)
- [/reference/token-use](/de/reference/token-use)
- [/help/faq#why-am-i-seeing-http-429-ratelimiterror-from-anthropic](/de/help/faq#why-am-i-seeing-http-429-ratelimiterror-from-anthropic)

## Lokales OpenAI-kompatibles Backend besteht direkte Probes, aber Agent-Läufe schlagen fehl

Verwenden Sie dies, wenn:

- `curl ... /v1/models` funktioniert
- kleine direkte `/v1/chat/completions`-Aufrufe funktionieren
- OpenClaw-Modelläufe nur bei normalen Agent-Turns fehlschlagen

```bash
curl http://127.0.0.1:1234/v1/models
curl http://127.0.0.1:1234/v1/chat/completions \
  -H 'content-type: application/json' \
  -d '{"model":"<id>","messages":[{"role":"user","content":"hi"}],"stream":false}'
openclaw infer model run --model <provider/model> --prompt "hi" --json
openclaw logs --follow
```

Achten Sie auf:

- direkte kleine Aufrufe sind erfolgreich, aber OpenClaw-Läufe schlagen nur bei größeren Prompts fehl
- Backend-Fehler darüber, dass `messages[].content` einen String erwartet
- Backend-Abstürze, die nur bei höherer Prompt-Token-Zahl oder vollständigen Agent-
  Laufzeit-Prompts auftreten

Häufige Signaturen:

- `messages[...].content: invalid type: sequence, expected a string` → Backend
  lehnt strukturierte Chat-Completions-Content-Teile ab. Behebung: setzen Sie
  `models.providers.<provider>.models[].compat.requiresStringContent: true`.
- direkte kleine Anfragen sind erfolgreich, aber OpenClaw-Agent-Turns schlagen mit Backend-/Modell-
  Abstürzen fehl (zum Beispiel Gemma auf einigen `inferrs`-Builds) → OpenClaw-Transport ist
  wahrscheinlich bereits korrekt; das Backend scheitert an der größeren Form des Agent-
  Laufzeit-Prompts.
- Fehler gehen nach dem Deaktivieren von Tools zurück, verschwinden aber nicht → Tool-Schemas waren
  Teil des Drucks, aber das verbleibende Problem liegt weiterhin in der vorgelagerten Modell-/Server-
  Kapazität oder einem Backend-Fehler.

Optionen zur Behebung:

1. Setzen Sie `compat.requiresStringContent: true` für Chat-Completions-Backends, die nur Strings unterstützen.
2. Setzen Sie `compat.supportsTools: false` für Modelle/Backends, die die
   Tool-Schema-Oberfläche von OpenClaw nicht zuverlässig verarbeiten können.
3. Verringern Sie nach Möglichkeit den Prompt-Druck: kleinerer Workspace-Bootstrap, kürzerer
   Sitzungsverlauf, leichteres lokales Modell oder ein Backend mit stärkerer Unterstützung für langen Kontext.
4. Wenn direkte kleine Anfragen weiterhin erfolgreich sind, während OpenClaw-Agent-Turns im Backend noch immer abstürzen,
   behandeln Sie dies als vorgelagerte Server-/Modellbeschränkung und melden Sie dort
   eine Reproduktion mit der akzeptierten Payload-Form.

Verwandt:

- [/gateway/local-models](/de/gateway/local-models)
- [/gateway/configuration](/de/gateway/configuration)
- [/gateway/configuration-reference#openai-compatible-endpoints](/de/gateway/configuration-reference#openai-compatible-endpoints)

## Keine Antworten

Wenn Kanäle aktiv sind, aber nichts antwortet, prüfen Sie Routing und Richtlinie, bevor Sie irgendetwas neu verbinden.

```bash
openclaw status
openclaw channels status --probe
openclaw pairing list --channel <channel> [--account <id>]
openclaw config get channels
openclaw logs --follow
```

Achten Sie auf:

- Pairing ausstehend für DM-Absender.
- Erwähnungs-Gating in Gruppen (`requireMention`, `mentionPatterns`).
- Nicht passende Kanal-/Gruppen-Allowlist-Konfigurationen.

Häufige Signaturen:

- `drop guild message (mention required` → Gruppennachricht wird ignoriert, bis eine Erwähnung erfolgt.
- `pairing request` → Absender benötigt Genehmigung.
- `blocked` / `allowlist` → Absender/Kanal wurde durch Richtlinie gefiltert.

Verwandt:

- [/channels/troubleshooting](/de/channels/troubleshooting)
- [/channels/pairing](/de/channels/pairing)
- [/channels/groups](/de/channels/groups)

## Dashboard-/Control-UI-Konnektivität

Wenn Dashboard/Control UI keine Verbindung herstellt, validieren Sie URL, Authentifizierungsmodus und Annahmen zum sicheren Kontext.

```bash
openclaw gateway status
openclaw status
openclaw logs --follow
openclaw doctor
openclaw gateway status --json
```

Achten Sie auf:

- korrekte Probe-URL und Dashboard-URL.
- Authentifizierungsmodus-/Token-Fehlanpassung zwischen Client und Gateway.
- HTTP-Nutzung, wenn Geräteidentität erforderlich ist.

Häufige Signaturen:

- `device identity required` → unsicherer Kontext oder fehlende Geräteauthentifizierung.
- `origin not allowed` → Browser-`Origin` ist nicht in `gateway.controlUi.allowedOrigins`
  (oder Sie verbinden sich von einem Nicht-Loopback-Browser-Origin ohne explizite
  Allowlist).
- `device nonce required` / `device nonce mismatch` → Client führt den
  challenge-basierten Geräteauthentifizierungsablauf nicht vollständig aus (`connect.challenge` + `device.nonce`).
- `device signature invalid` / `device signature expired` → Client hat die falsche
  Payload (oder einen veralteten Zeitstempel) für den aktuellen Handshake signiert.
- `AUTH_TOKEN_MISMATCH` mit `canRetryWithDeviceToken=true` → Client kann einen vertrauenswürdigen Wiederholungsversuch mit zwischengespeichertem Gerätetoken durchführen.
- Dieser Wiederholungsversuch mit zwischengespeichertem Token verwendet den zwischengespeicherten Scope-Satz erneut, der mit dem gekoppelten
  Gerätetoken gespeichert wurde. Aufrufer mit explizitem `deviceToken` / expliziten `scopes` behalten stattdessen ihren
  angeforderten Scope-Satz.
- Außerhalb dieses Wiederholungswegs ist die Priorität der Verbindungsauthentifizierung:
  zuerst explizites gemeinsames Token/Passwort, dann explizites
  `deviceToken`, dann gespeichertes Gerätetoken,
  dann Bootstrap-Token.
- Auf dem asynchronen Tailscale-Serve-Control-UI-Pfad werden fehlgeschlagene Versuche für denselben
  `{scope, ip}` serialisiert, bevor der Limiter den Fehler aufzeichnet. Zwei fehlerhafte
  gleichzeitige Wiederholungsversuche vom selben Client können daher beim zweiten Versuch
  `retry later` anzeigen statt zwei einfacher Fehlanpassungen.
- `too many failed authentication attempts (retry later)` von einem Browser-Origin-
  Loopback-Client → wiederholte Fehlschläge von demselben normalisierten `Origin` werden
  vorübergehend gesperrt; ein anderer localhost-Origin verwendet einen separaten Bucket.
- wiederholtes `unauthorized` danach → Drift bei gemeinsamem Token/Gerätetoken; aktualisieren Sie die Token-Konfiguration und genehmigen/rotieren Sie das Gerätetoken bei Bedarf erneut.
- `gateway connect failed:` → falsches Host-/Port-/URL-Ziel.

### Kurzübersicht der Auth-Detailcodes

Verwenden Sie `error.details.code` aus der fehlgeschlagenen `connect`-Antwort, um die nächste Aktion auszuwählen:

| Detailcode                  | Bedeutung                                                                                                                                                                                  | Empfohlene Aktion                                                                                                                                                                                                                                                                         |
| --------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `AUTH_TOKEN_MISSING`        | Client hat kein erforderliches gemeinsames Token gesendet.                                                                                                                                 | Fügen Sie das Token im Client ein/setzen Sie es und versuchen Sie es erneut. Für Dashboard-Pfade: `openclaw config get gateway.auth.token` und dann in die Control-UI-Einstellungen einfügen.                                                                                           |
| `AUTH_TOKEN_MISMATCH`       | Gemeinsames Token stimmte nicht mit dem Gateway-Auth-Token überein.                                                                                                                        | Wenn `canRetryWithDeviceToken=true`, erlauben Sie einen vertrauenswürdigen Wiederholungsversuch. Wiederholungen mit zwischengespeichertem Token verwenden gespeicherte genehmigte Scopes erneut; Aufrufer mit explizitem `deviceToken` / `scopes` behalten angeforderte Scopes. Wenn es weiterhin fehlschlägt, führen Sie die [Checkliste zur Token-Drift-Behebung](/cli/devices#token-drift-recovery-checklist) aus. |
| `AUTH_DEVICE_TOKEN_MISMATCH` | Zwischengespeichertes gerätespezifisches Token ist veraltet oder widerrufen.                                                                                                              | Rotieren/genehmigen Sie das Gerätetoken mit [devices CLI](/cli/devices) erneut und verbinden Sie sich dann erneut.                                                                                                                                                                      |
| `PAIRING_REQUIRED`          | Geräteidentität benötigt Genehmigung. Prüfen Sie `error.details.reason` auf `not-paired`, `scope-upgrade`, `role-upgrade` oder `metadata-upgrade` und verwenden Sie `requestId` / `remediationHint`, falls vorhanden. | Genehmigen Sie die ausstehende Anfrage: `openclaw devices list` und dann `openclaw devices approve <requestId>`. Scope-/Rollen-Upgrades verwenden denselben Ablauf, nachdem Sie den angeforderten Zugriff geprüft haben.                                                                |

Prüfung der Migration zu Geräteauthentifizierung v2:

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

- Sitzungen mit Token gekoppelter Geräte können nur **ihr eigenes**
  Gerät verwalten, es sei denn, der Aufrufer hat auch `operator.admin`
- `openclaw devices rotate --scope ...` kann nur Operator-Scopes anfordern,
  die die Aufrufer-Sitzung bereits besitzt

Verwandt:

- [/web/control-ui](/web/control-ui)
- [/gateway/configuration](/de/gateway/configuration) (Gateway-Authentifizierungsmodi)
- [/gateway/trusted-proxy-auth](/de/gateway/trusted-proxy-auth)
- [/gateway/remote](/de/gateway/remote)
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

Achten Sie auf:

- `Runtime: stopped` mit Hinweisen zum Exit.
- Fehlanpassung der Dienstkonfiguration (`Config (cli)` vs `Config (service)`).
- Port-/Listener-Konflikte.
- Zusätzliche launchd-/systemd-/schtasks-Installationen, wenn `--deep` verwendet wird.
- Hinweise zur Bereinigung von `Other gateway-like services detected (best effort)`.

Häufige Signaturen:

- `Gateway start blocked: set gateway.mode=local` oder `existing config is missing gateway.mode` → der lokale Gateway-Modus ist nicht aktiviert, oder die Konfigurationsdatei wurde beschädigt und hat `gateway.mode` verloren. Behebung: Setzen Sie `gateway.mode="local"` in Ihrer Konfiguration, oder führen Sie `openclaw onboard --mode local` / `openclaw setup` erneut aus, um die erwartete Konfiguration für den lokalen Modus wiederherzustellen. Wenn Sie OpenClaw über Podman ausführen, ist der Standardpfad für die Konfiguration `~/.openclaw/openclaw.json`.
- `refusing to bind gateway ... without auth` → Nicht-Loopback-Bindung ohne gültigen Gateway-Authentifizierungspfad (Token/Passwort oder, falls konfiguriert, Trusted Proxy).
- `another gateway instance is already listening` / `EADDRINUSE` → Portkonflikt.
- `Other gateway-like services detected (best effort)` → veraltete oder parallele launchd-/systemd-/schtasks-Units sind vorhanden. Die meisten Setups sollten ein Gateway pro Maschine verwenden; wenn Sie tatsächlich mehr als eines benötigen, isolieren Sie Ports + Konfiguration/Status/Workspace. Siehe [/gateway#multiple-gateways-same-host](/de/gateway#multiple-gateways-same-host).

Verwandt:

- [/gateway/background-process](/de/gateway/background-process)
- [/gateway/configuration](/de/gateway/configuration)
- [/gateway/doctor](/de/gateway/doctor)

## Gateway hat die zuletzt als gut bekannte Konfiguration wiederhergestellt

Verwenden Sie dies, wenn das Gateway startet, die Logs aber sagen, dass `openclaw.json` wiederhergestellt wurde.

```bash
openclaw logs --follow
openclaw config file
openclaw config validate
openclaw doctor
```

Achten Sie auf:

- `Config auto-restored from last-known-good`
- `gateway: invalid config was restored from last-known-good backup`
- `config reload restored last-known-good config after invalid-config`
- Eine mit Zeitstempel versehene Datei `openclaw.json.clobbered.*` neben der aktiven Konfiguration
- Ein Systemereignis des Haupt-Agent, das mit `Config recovery warning` beginnt

Was passiert ist:

- Die abgelehnte Konfiguration bestand die Validierung beim Start oder beim Hot Reload nicht.
- OpenClaw hat die abgelehnte Payload als `.clobbered.*` bewahrt.
- Die aktive Konfiguration wurde aus der zuletzt validierten, zuletzt als gut bekannten Kopie wiederhergestellt.
- Der nächste Turn des Haupt-Agent wird gewarnt, die abgelehnte Konfiguration nicht blind neu zu schreiben.

Untersuchen und reparieren:

```bash
CONFIG="$(openclaw config file)"
ls -lt "$CONFIG".clobbered.* "$CONFIG".rejected.* 2>/dev/null | head
diff -u "$CONFIG" "$(ls -t "$CONFIG".clobbered.* 2>/dev/null | head -n 1)"
openclaw config validate
openclaw doctor
```

Häufige Signaturen:

- `.clobbered.*` existiert → eine externe direkte Bearbeitung oder ein Startup-Read wurde wiederhergestellt.
- `.rejected.*` existiert → ein von OpenClaw verwalteter Konfigurationsschreibvorgang scheiterte vor dem Commit an Schema- oder Clobber-Prüfungen.
- `Config write rejected:` → der Schreibvorgang versuchte, die erforderliche Struktur zu entfernen, die Datei stark zu verkleinern oder eine ungültige Konfiguration zu speichern.
- `Config last-known-good promotion skipped` → der Kandidat enthielt redigierte Secret-Platzhalter wie `***`.

Optionen zur Behebung:

1. Behalten Sie die wiederhergestellte aktive Konfiguration bei, wenn sie korrekt ist.
2. Kopieren Sie nur die beabsichtigten Schlüssel aus `.clobbered.*` oder `.rejected.*` und wenden Sie sie dann mit `openclaw config set` oder `config.patch` an.
3. Führen Sie `openclaw config validate` vor dem Neustart aus.
4. Wenn Sie von Hand bearbeiten, behalten Sie die vollständige JSON5-Konfiguration bei, nicht nur das partielle Objekt, das Sie ändern wollten.

Verwandt:

- [/gateway/configuration#strict-validation](/de/gateway/configuration#strict-validation)
- [/gateway/configuration#config-hot-reload](/de/gateway/configuration#config-hot-reload)
- [/cli/config](/cli/config)
- [/gateway/doctor](/de/gateway/doctor)

## Gateway-Probe-Warnungen

Verwenden Sie dies, wenn `openclaw gateway probe` etwas erreicht, aber trotzdem einen Warnblock ausgibt.

```bash
openclaw gateway probe
openclaw gateway probe --json
openclaw gateway probe --ssh user@gateway-host
```

Achten Sie auf:

- `warnings[].code` und `primaryTargetId` in der JSON-Ausgabe.
- Ob sich die Warnung auf SSH-Fallback, mehrere Gateways, fehlende Scopes oder nicht aufgelöste Auth-Refs bezieht.

Häufige Signaturen:

- `SSH tunnel failed to start; falling back to direct probes.` → das SSH-Setup ist fehlgeschlagen, aber der Befehl hat trotzdem direkte konfigurierte/Loopback-Ziele versucht.
- `multiple reachable gateways detected` → mehr als ein Ziel hat geantwortet. Das bedeutet normalerweise ein beabsichtigtes Multi-Gateway-Setup oder veraltete/duplizierte Listener.
- `Read-probe diagnostics are limited by gateway scopes (missing operator.read)` → Verbindung funktionierte, aber Detail-RPC ist durch Scopes eingeschränkt; koppeln Sie die Geräteidentität oder verwenden Sie Anmeldedaten mit `operator.read`.
- `Capability: pairing-pending` oder `gateway closed (1008): pairing required` → das Gateway hat geantwortet, aber dieser Client benötigt noch Pairing/Genehmigung vor normalem Operatorzugriff.
- nicht aufgelöster `gateway.auth.*` / `gateway.remote.*`-SecretRef-Warntext → Auth-Material war in diesem Befehlspfad für das fehlgeschlagene Ziel nicht verfügbar.

Verwandt:

- [/cli/gateway](/cli/gateway)
- [/gateway#multiple-gateways-same-host](/de/gateway#multiple-gateways-same-host)
- [/gateway/remote](/de/gateway/remote)

## Kanal verbunden, aber Nachrichten fließen nicht

Wenn der Kanalstatus „verbunden“ ist, der Nachrichtenfluss aber tot ist, konzentrieren Sie sich auf Richtlinien, Berechtigungen und kanalspezifische Zustellregeln.

```bash
openclaw channels status --probe
openclaw pairing list --channel <channel> [--account <id>]
openclaw status --deep
openclaw logs --follow
openclaw config get channels
```

Achten Sie auf:

- DM-Richtlinie (`pairing`, `allowlist`, `open`, `disabled`).
- Gruppen-Allowlist und Erwähnungsanforderungen.
- Fehlende API-Berechtigungen/Scopes des Kanals.

Häufige Signaturen:

- `mention required` → Nachricht wird durch die Gruppen-Erwähnungsrichtlinie ignoriert.
- `pairing` / Spuren ausstehender Genehmigung → Absender ist nicht genehmigt.
- `missing_scope`, `not_in_channel`, `Forbidden`, `401/403` → Problem mit Kanal-Authentifizierung/-Berechtigungen.

Verwandt:

- [/channels/troubleshooting](/de/channels/troubleshooting)
- [/channels/whatsapp](/de/channels/whatsapp)
- [/channels/telegram](/de/channels/telegram)
- [/channels/discord](/de/channels/discord)

## Zustellung von Cron und Heartbeat

Wenn Cron oder Heartbeat nicht ausgeführt wurde oder nicht zugestellt hat, prüfen Sie zuerst den Scheduler-Status und dann das Zustellziel.

```bash
openclaw cron status
openclaw cron list
openclaw cron runs --id <jobId> --limit 20
openclaw system heartbeat last
openclaw logs --follow
```

Achten Sie auf:

- Cron aktiviert und nächstes Aufwachen vorhanden.
- Status der Job-Ausführungshistorie (`ok`, `skipped`, `error`).
- Gründe für das Überspringen des Heartbeat (`quiet-hours`, `requests-in-flight`, `alerts-disabled`, `empty-heartbeat-file`, `no-tasks-due`).

Häufige Signaturen:

- `cron: scheduler disabled; jobs will not run automatically` → Cron deaktiviert.
- `cron: timer tick failed` → Scheduler-Tick fehlgeschlagen; prüfen Sie Datei-/Log-/Laufzeitfehler.
- `heartbeat skipped` mit `reason=quiet-hours` → außerhalb des Fensters aktiver Zeiten.
- `heartbeat skipped` mit `reason=empty-heartbeat-file` → `HEARTBEAT.md` existiert, enthält aber nur Leerzeilen / Markdown-Überschriften, daher überspringt OpenClaw den Modellaufruf.
- `heartbeat skipped` mit `reason=no-tasks-due` → `HEARTBEAT.md` enthält einen `tasks:`-Block, aber bei diesem Tick ist keine der Aufgaben fällig.
- `heartbeat: unknown accountId` → ungültige Konto-ID für das Heartbeat-Zustellziel.
- `heartbeat skipped` mit `reason=dm-blocked` → Heartbeat-Ziel wurde zu einem Ziel im DM-Stil aufgelöst, während `agents.defaults.heartbeat.directPolicy` (oder die Überschreibung pro Agent) auf `block` gesetzt ist.

Verwandt:

- [/automation/cron-jobs#troubleshooting](/de/automation/cron-jobs#troubleshooting)
- [/automation/cron-jobs](/de/automation/cron-jobs)
- [/gateway/heartbeat](/de/gateway/heartbeat)

## Tool auf gekoppeltem Node schlägt fehl

Wenn ein Node gekoppelt ist, aber Tools fehlschlagen, isolieren Sie Vordergrund-, Berechtigungs- und Genehmigungsstatus.

```bash
openclaw nodes status
openclaw nodes describe --node <idOrNameOrIp>
openclaw approvals get --node <idOrNameOrIp>
openclaw logs --follow
openclaw status
```

Achten Sie auf:

- Node online mit den erwarteten Fähigkeiten.
- Vom Betriebssystem gewährte Berechtigungen für Kamera/Mikrofon/Standort/Bildschirm.
- Exec-Genehmigungen und Allowlist-Status.

Häufige Signaturen:

- `NODE_BACKGROUND_UNAVAILABLE` → Node-App muss im Vordergrund sein.
- `*_PERMISSION_REQUIRED` / `LOCATION_PERMISSION_REQUIRED` → fehlende Betriebssystemberechtigung.
- `SYSTEM_RUN_DENIED: approval required` → Exec-Genehmigung ausstehend.
- `SYSTEM_RUN_DENIED: allowlist miss` → Befehl durch Allowlist blockiert.

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

Achten Sie auf:

- Ob `plugins.allow` gesetzt ist und `browser` enthält.
- Gültigen Pfad zur Browser-Executable.
- Erreichbarkeit des CDP-Profils.
- Verfügbarkeit von lokalem Chrome für Profile `existing-session` / `user`.

Häufige Signaturen:

- `unknown command "browser"` oder `unknown command 'browser'` → das gebündelte Browser-Plugin ist durch `plugins.allow` ausgeschlossen.
- Browser-Tool fehlt / ist nicht verfügbar, obwohl `browser.enabled=true` → `plugins.allow` schließt `browser` aus, daher wurde das Plugin nie geladen.
- `Failed to start Chrome CDP on port` → Browser-Prozess konnte nicht gestartet werden.
- `browser.executablePath not found` → konfigurierter Pfad ist ungültig.
- `browser.cdpUrl must be http(s) or ws(s)` → die konfigurierte CDP-URL verwendet ein nicht unterstütztes Schema wie `file:` oder `ftp:`.
- `browser.cdpUrl has invalid port` → die konfigurierte CDP-URL hat einen ungültigen oder außerhalb des Bereichs liegenden Port.
- `No Chrome tabs found for profile="user"` → das Chrome-MCP-Attach-Profil hat keine geöffneten lokalen Chrome-Tabs.
- `Remote CDP for profile "<name>" is not reachable` → der konfigurierte Remote-CDP-Endpunkt ist vom Gateway-Host aus nicht erreichbar.
- `Browser attachOnly is enabled ... not reachable` oder `Browser attachOnly is enabled and CDP websocket ... is not reachable` → das Attach-only-Profil hat kein erreichbares Ziel, oder der HTTP-Endpunkt hat geantwortet, aber das CDP-WebSocket konnte trotzdem nicht geöffnet werden.
- `Playwright is not available in this gateway build; '<feature>' is unsupported.` → der aktuellen Gateway-Installation fehlt das vollständige Playwright-Paket; ARIA-Snapshots und einfache Seitenscreenshots können weiterhin funktionieren, aber Navigation, AI-Snapshots, Element-Screenshots per CSS-Selektor und PDF-Export bleiben nicht verfügbar.
- `fullPage is not supported for element screenshots` → Screenshot-Anfrage hat `--full-page` mit `--ref` oder `--element` kombiniert.
- `element screenshots are not supported for existing-session profiles; use ref from snapshot.` → Screenshot-Aufrufe für Chrome MCP / `existing-session` müssen Seitenerfassung oder ein Snapshot-`--ref` verwenden, nicht CSS-`--element`.
- `existing-session file uploads do not support element selectors; use ref/inputRef.` → Upload-Hooks für Chrome MCP benötigen Snapshot-Refs, keine CSS-Selektoren.
- `existing-session file uploads currently support one file at a time.` → senden Sie pro Aufruf einen Upload auf Chrome-MCP-Profilen.
- `existing-session dialog handling does not support timeoutMs.` → Dialog-Hooks auf Chrome-MCP-Profilen unterstützen keine Timeout-Überschreibungen.
- `response body is not supported for existing-session profiles yet.` → `responsebody` erfordert weiterhin einen verwalteten Browser oder ein Raw-CDP-Profil.
- veraltete Überschreibungen für Viewport / Dark Mode / Locale / Offline auf Attach-only- oder Remote-CDP-Profilen → führen Sie `openclaw browser stop --browser-profile <name>` aus, um die aktive Steuerungssitzung zu schließen und den Playwright-/CDP-Emulationsstatus freizugeben, ohne das gesamte Gateway neu zu starten.

Verwandt:

- [/tools/browser-linux-troubleshooting](/de/tools/browser-linux-troubleshooting)
- [/tools/browser](/de/tools/browser)

## Wenn nach einem Upgrade plötzlich etwas kaputtging

Die meisten Probleme nach Upgrades sind Konfigurationsdrift oder jetzt erzwungene strengere Standardwerte.

### 1) Verhalten von Auth und URL-Überschreibungen hat sich geändert

```bash
openclaw gateway status
openclaw config get gateway.mode
openclaw config get gateway.remote.url
openclaw config get gateway.auth.mode
```

Was Sie prüfen sollten:

- Wenn `gateway.mode=remote`, können CLI-Aufrufe auf remote zielen, während Ihr lokaler Dienst in Ordnung ist.
- Explizite `--url`-Aufrufe greifen nicht auf gespeicherte Anmeldedaten zurück.

Häufige Signaturen:

- `gateway connect failed:` → falsches URL-Ziel.
- `unauthorized` → Endpunkt erreichbar, aber falsche Authentifizierung.

### 2) Bindungs- und Auth-Guardrails sind strenger

```bash
openclaw config get gateway.bind
openclaw config get gateway.auth.mode
openclaw config get gateway.auth.token
openclaw gateway status
openclaw logs --follow
```

Was Sie prüfen sollten:

- Nicht-Loopback-Bindungen (`lan`, `tailnet`, `custom`) benötigen einen gültigen Gateway-Authentifizierungspfad: gemeinsame Token-/Passwort-Authentifizierung oder eine korrekt konfigurierte Nicht-Loopback-`trusted-proxy`-Bereitstellung.
- Alte Schlüssel wie `gateway.token` ersetzen `gateway.auth.token` nicht.

Häufige Signaturen:

- `refusing to bind gateway ... without auth` → Nicht-Loopback-Bindung ohne gültigen Gateway-Authentifizierungspfad.
- `Connectivity probe: failed`, während die Laufzeit läuft → Gateway ist aktiv, aber mit aktueller Authentifizierung/URL nicht erreichbar.

### 3) Pairing- und Geräteidentitätsstatus haben sich geändert

```bash
openclaw devices list
openclaw pairing list --channel <channel> [--account <id>]
openclaw logs --follow
openclaw doctor
```

Was Sie prüfen sollten:

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

- [/gateway/pairing](/de/gateway/pairing)
- [/gateway/authentication](/de/gateway/authentication)
- [/gateway/background-process](/de/gateway/background-process)
