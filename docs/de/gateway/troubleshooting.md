---
read_when:
    - Der Fehlerbehebungs-Hub hat Sie für eine tiefergehende Diagnose hierher verwiesen
    - Sie benötigen stabile, symptombasierte Runbook-Abschnitte mit exakten Befehlen
summary: Ausführliches Fehlerbehebungs-Runbook für Gateway, Kanäle, Automatisierung, Nodes und Browser
title: Fehlerbehebung
x-i18n:
    generated_at: "2026-04-24T06:40:32Z"
    model: gpt-5.4
    provider: openai
    source_hash: 32c4cbbbe8b1cd5eaca34503f4a363d3fa2650e491f83455958eb5725f9d50c5
    source_path: gateway/troubleshooting.md
    workflow: 15
---

# Gateway-Fehlerbehebung

Diese Seite ist das ausführliche Runbook.
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

Erwartete gesunde Signale:

- `openclaw gateway status` zeigt `Runtime: running`, `Connectivity probe: ok` und eine Zeile `Capability: ...`.
- `openclaw doctor` meldet keine blockierenden Konfigurations-/Dienstprobleme.
- `openclaw channels status --probe` zeigt Live-Transportstatus pro Konto und,
  wo unterstützt, Probe-/Audit-Ergebnisse wie `works` oder `audit ok`.

## Anthropic 429 zusätzliche Nutzung für langen Kontext erforderlich

Verwenden Sie dies, wenn Logs/Fehler Folgendes enthalten:
`HTTP 429: rate_limit_error: Extra usage is required for long context requests`.

```bash
openclaw logs --follow
openclaw models status
openclaw config get agents.defaults.models
```

Achten Sie auf Folgendes:

- Das ausgewählte Anthropic-Opus-/Sonnet-Modell hat `params.context1m: true`.
- Die aktuelle Anthropic-Anmeldedatenquelle ist nicht für Long-Context-Nutzung geeignet.
- Anfragen schlagen nur bei langen Sitzungen/Modelläufen fehl, die den 1M-Beta-Pfad benötigen.

Lösungsoptionen:

1. Deaktivieren Sie `context1m` für dieses Modell, um auf das normale Kontextfenster zurückzufallen.
2. Verwenden Sie eine Anthropic-Anmeldedatenquelle, die für Long-Context-Anfragen geeignet ist, oder wechseln Sie zu einem Anthropic-API-Schlüssel.
3. Konfigurieren Sie Fallback-Modelle, damit Läufe fortgesetzt werden, wenn Anthropic-Long-Context-Anfragen abgelehnt werden.

Verwandt:

- [/providers/anthropic](/de/providers/anthropic)
- [/reference/token-use](/de/reference/token-use)
- [/help/faq-first-run#why-am-i-seeing-http-429-ratelimiterror-from-anthropic](/de/help/faq-first-run#why-am-i-seeing-http-429-ratelimiterror-from-anthropic)

## Lokales OpenAI-kompatibles Backend besteht direkte Probes, aber Agentenläufe schlagen fehl

Verwenden Sie dies, wenn:

- `curl ... /v1/models` funktioniert
- kleine direkte Aufrufe von `/v1/chat/completions` funktionieren
- OpenClaw-Modelläufe nur bei normalen Agenten-Turnussen fehlschlagen

```bash
curl http://127.0.0.1:1234/v1/models
curl http://127.0.0.1:1234/v1/chat/completions \
  -H 'content-type: application/json' \
  -d '{"model":"<id>","messages":[{"role":"user","content":"hi"}],"stream":false}'
openclaw infer model run --model <provider/model> --prompt "hi" --json
openclaw logs --follow
```

Achten Sie auf Folgendes:

- direkte kleine Aufrufe funktionieren, aber OpenClaw-Läufe schlagen nur bei größeren Prompts fehl
- Backend-Fehler darüber, dass `messages[].content` eine Zeichenfolge erwartet
- Backend-Abstürze, die nur bei größeren Prompt-Token-Zahlen oder vollständigen Prompt-
  Formen der Agentenlaufzeit auftreten

Häufige Signaturen:

- `messages[...].content: invalid type: sequence, expected a string` → Backend
  lehnt strukturierte Chat-Completions-Content-Teile ab. Korrektur: setzen Sie
  `models.providers.<provider>.models[].compat.requiresStringContent: true`.
- direkte kleine Requests funktionieren, aber OpenClaw-Agentenläufe schlagen mit Backend-/Modell-
  Abstürzen fehl (zum Beispiel Gemma auf einigen `inferrs`-Builds) → Der OpenClaw-Transport ist
  wahrscheinlich bereits korrekt; das Backend scheitert an der größeren Prompt-Form der Agentenlaufzeit.
- Fehler werden geringer, nachdem Tools deaktiviert wurden, verschwinden aber nicht → Tool-Schemas waren
  Teil des Drucks, aber das verbleibende Problem ist weiterhin Upstream-Kapazität des Modells/Servers oder ein Backend-Bug.

Lösungsoptionen:

1. Setzen Sie `compat.requiresStringContent: true` für Chat-Completions-Backends, die nur Zeichenfolgen unterstützen.
2. Setzen Sie `compat.supportsTools: false` für Modelle/Backends, die die
   Tool-Schema-Oberfläche von OpenClaw nicht zuverlässig verarbeiten können.
3. Reduzieren Sie den Prompt-Druck, wo möglich: kleinerer Workspace-Bootstrap, kürzerer
   Sitzungsverlauf, leichteres lokales Modell oder ein Backend mit stärkerer Long-Context-
   Unterstützung.
4. Wenn direkte kleine Requests weiterhin funktionieren, OpenClaw-Agenten-Turnusse aber im Backend weiterhin abstürzen,
   behandeln Sie dies als Upstream-Einschränkung von Server/Modell und reichen Sie dort
   eine Reproduktion mit der akzeptierten Payload-Form ein.

Verwandt:

- [/gateway/local-models](/de/gateway/local-models)
- [/gateway/configuration](/de/gateway/configuration)
- [/gateway/configuration-reference#openai-compatible-endpoints](/de/gateway/configuration-reference#openai-compatible-endpoints)

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
- Nichtübereinstimmungen in Kanal-/Gruppen-Allowlist.

Häufige Signaturen:

- `drop guild message (mention required` → Gruppennachricht wird ignoriert, bis eine Erwähnung erfolgt.
- `pairing request` → Absender benötigt Genehmigung.
- `blocked` / `allowlist` → Absender/Kanal wurde durch Richtlinie gefiltert.

Verwandt:

- [/channels/troubleshooting](/de/channels/troubleshooting)
- [/channels/pairing](/de/channels/pairing)
- [/channels/groups](/de/channels/groups)

## Dashboard-/Control-UI-Konnektivität

Wenn Dashboard/Control UI keine Verbindung herstellen kann, validieren Sie URL, Auth-Modus und Annahmen zum sicheren Kontext.

```bash
openclaw gateway status
openclaw status
openclaw logs --follow
openclaw doctor
openclaw gateway status --json
```

Achten Sie auf Folgendes:

- Korrekte Probe-URL und Dashboard-URL.
- Nichtübereinstimmung von Auth-Modus/Token zwischen Client und Gateway.
- HTTP-Nutzung, wo Geräteidentität erforderlich ist.

Häufige Signaturen:

- `device identity required` → unsicherer Kontext oder fehlende Geräteauthentifizierung.
- `origin not allowed` → Browser-`Origin` ist nicht in `gateway.controlUi.allowedOrigins`
  enthalten (oder Sie verbinden sich von einem Browser-Origin ohne Loopback ohne explizite
  Allowlist).
- `device nonce required` / `device nonce mismatch` → Client schließt den
  challengebasierten Geräteauthentifizierungsablauf nicht ab (`connect.challenge` + `device.nonce`).
- `device signature invalid` / `device signature expired` → Client hat die falsche
  Payload (oder einen veralteten Zeitstempel) für den aktuellen Handshake signiert.
- `AUTH_TOKEN_MISMATCH` mit `canRetryWithDeviceToken=true` → Client kann einen vertrauenswürdigen Retry mit zwischengespeichertem Device-Token durchführen.
- Dieser Retry mit zwischengespeichertem Token verwendet den mit dem gekoppelten
  Device-Token gespeicherten Scope-Satz erneut. Aufrufer mit explizitem `deviceToken` / expliziten `scopes` behalten stattdessen ihren angeforderten Scope-Satz.
- Außerhalb dieses Retry-Pfads gilt bei Connect-Auth Vorrang für explizites Shared-
  Token/Passwort, dann explizites `deviceToken`, dann gespeichertes Device-Token,
  dann Bootstrap-Token.
- Auf dem asynchronen Tailscale-Serve-Control-UI-Pfad werden fehlgeschlagene Versuche für denselben
  `{scope, ip}` serialisiert, bevor der Limiter den Fehler aufzeichnet. Zwei schlechte gleichzeitige Retries vom selben Client können daher beim zweiten Versuch `retry later`
  statt zwei einfacher Nichtübereinstimmungen ergeben.
- `too many failed authentication attempts (retry later)` von einem Loopback-Client mit Browser-Origin → wiederholte Fehlschläge von derselben normalisierten `Origin` werden vorübergehend gesperrt; ein anderer localhost-Origin verwendet einen separaten Bucket.
- wiederholtes `unauthorized` nach diesem Retry → Drift von Shared Token/Device Token; aktualisieren Sie die Token-Konfiguration und genehmigen/rotieren Sie das Device-Token erneut, falls nötig.
- `gateway connect failed:` → falsches Host-/Port-/URL-Ziel.

### Schnelle Zuordnung von Auth-Detailcodes

Verwenden Sie `error.details.code` aus der fehlgeschlagenen `connect`-Antwort, um die nächste Aktion auszuwählen:

| Detailcode                  | Bedeutung                                                                                                                                                                                      | Empfohlene Aktion                                                                                                                                                                                                                                                                       |
| --------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `AUTH_TOKEN_MISSING`        | Client hat kein erforderliches Shared Token gesendet.                                                                                                                                          | Token im Client einfügen/setzen und erneut versuchen. Für Dashboard-Pfade: `openclaw config get gateway.auth.token`, dann in die Einstellungen der Control UI einfügen.                                                                                                              |
| `AUTH_TOKEN_MISMATCH`       | Shared Token stimmte nicht mit dem Gateway-Auth-Token überein.                                                                                                                                 | Wenn `canRetryWithDeviceToken=true`, einen vertrauenswürdigen Retry erlauben. Retries mit zwischengespeichertem Token verwenden gespeicherte genehmigte Scopes erneut; Aufrufer mit explizitem `deviceToken` / `scopes` behalten angeforderte Scopes. Wenn es weiterhin fehlschlägt, führen Sie die [Checkliste zur Wiederherstellung bei Token-Drift](/de/cli/devices#token-drift-recovery-checklist) aus. |
| `AUTH_DEVICE_TOKEN_MISMATCH` | Zwischengespeichertes Token pro Gerät ist veraltet oder widerrufen.                                                                                                                           | Device-Token mit der [Devices-CLI](/de/cli/devices) rotieren/erneut genehmigen und dann erneut verbinden.                                                                                                                                                                                  |
| `PAIRING_REQUIRED`           | Geräteidentität benötigt Genehmigung. Prüfen Sie `error.details.reason` auf `not-paired`, `scope-upgrade`, `role-upgrade` oder `metadata-upgrade` und verwenden Sie `requestId` / `remediationHint`, wenn vorhanden. | Ausstehende Anfrage genehmigen: `openclaw devices list` und dann `openclaw devices approve <requestId>`. Scope-/Rollen-Upgrades verwenden denselben Ablauf, nachdem Sie den angeforderten Zugriff geprüft haben.                                                                      |

Prüfung der Migration zu Device Auth v2:

```bash
openclaw --version
openclaw doctor
openclaw gateway status
```

Wenn Logs Nonce-/Signaturfehler zeigen, aktualisieren Sie den verbindenden Client und verifizieren Sie, dass er:

1. auf `connect.challenge` wartet
2. die an die Challenge gebundene Payload signiert
3. `connect.params.device.nonce` mit derselben Challenge-Nonce sendet

Wenn `openclaw devices rotate` / `revoke` / `remove` unerwartet verweigert wird:

- Sitzungen mit Token gekoppelter Geräte können nur **ihr eigenes** Gerät verwalten, sofern der
  Aufrufer nicht zusätzlich `operator.admin` hat
- `openclaw devices rotate --scope ...` kann nur Operator-Scopes anfordern,
  die die Sitzung des Aufrufers bereits hält

Verwandt:

- [/web/control-ui](/de/web/control-ui)
- [/gateway/configuration](/de/gateway/configuration) (Gateway-Auth-Modi)
- [/gateway/trusted-proxy-auth](/de/gateway/trusted-proxy-auth)
- [/gateway/remote](/de/gateway/remote)
- [/cli/devices](/de/cli/devices)

## Gateway-Dienst läuft nicht

Verwenden Sie dies, wenn der Dienst installiert ist, der Prozess aber nicht aktiv bleibt.

```bash
openclaw gateway status
openclaw status
openclaw logs --follow
openclaw doctor
openclaw gateway status --deep   # auch systemweite Dienste scannen
```

Achten Sie auf Folgendes:

- `Runtime: stopped` mit Hinweisen zum Exit.
- Nichtübereinstimmung in der Dienstkonfiguration (`Config (cli)` vs `Config (service)`).
- Port-/Listener-Konflikte.
- Zusätzliche Installationen von launchd/systemd/schtasks bei Verwendung von `--deep`.
- Hinweise zur Bereinigung unter `Other gateway-like services detected (best effort)`.

Häufige Signaturen:

- `Gateway start blocked: set gateway.mode=local` oder `existing config is missing gateway.mode` → lokaler Gateway-Modus ist nicht aktiviert, oder die Konfigurationsdatei wurde überschrieben und hat `gateway.mode` verloren. Korrektur: Setzen Sie `gateway.mode="local"` in Ihrer Konfiguration oder führen Sie `openclaw onboard --mode local` / `openclaw setup` erneut aus, um die erwartete Konfiguration für den lokalen Modus wiederherzustellen. Wenn Sie OpenClaw über Podman ausführen, ist der Standardpfad der Konfiguration `~/.openclaw/openclaw.json`.
- `refusing to bind gateway ... without auth` → Nicht-Loopback-Bindung ohne gültigen Gateway-Authentifizierungspfad (Token/Passwort oder, wo konfiguriert, trusted-proxy).
- `another gateway instance is already listening` / `EADDRINUSE` → Portkonflikt.
- `Other gateway-like services detected (best effort)` → veraltete oder parallele launchd/systemd/schtasks-Units existieren. Die meisten Setups sollten ein Gateway pro Rechner beibehalten; wenn Sie mehr als eines benötigen, isolieren Sie Ports + Konfiguration/Zustand/Workspace. Siehe [/gateway#multiple-gateways-same-host](/de/gateway#multiple-gateways-same-host).

Verwandt:

- [/gateway/background-process](/de/gateway/background-process)
- [/gateway/configuration](/de/gateway/configuration)
- [/gateway/doctor](/de/gateway/doctor)

## Gateway hat die zuletzt als gut bekannte Konfiguration wiederhergestellt

Verwenden Sie dies, wenn das Gateway startet, die Logs aber melden, dass `openclaw.json` wiederhergestellt wurde.

```bash
openclaw logs --follow
openclaw config file
openclaw config validate
openclaw doctor
```

Achten Sie auf Folgendes:

- `Config auto-restored from last-known-good`
- `gateway: invalid config was restored from last-known-good backup`
- `config reload restored last-known-good config after invalid-config`
- Eine Datei `openclaw.json.clobbered.*` mit Zeitstempel neben der aktiven Konfiguration
- Ein Systemereignis des Hauptagenten, das mit `Config recovery warning` beginnt

Was passiert ist:

- Die abgelehnte Konfiguration hat bei Start oder Hot Reload die Validierung nicht bestanden.
- OpenClaw hat die abgelehnte Payload als `.clobbered.*` bewahrt.
- Die aktive Konfiguration wurde aus der zuletzt validierten, als gut bekannten Kopie wiederhergestellt.
- Der nächste Turnus des Hauptagenten wird davor gewarnt, die abgelehnte Konfiguration blind neu zu schreiben.

Prüfen und reparieren:

```bash
CONFIG="$(openclaw config file)"
ls -lt "$CONFIG".clobbered.* "$CONFIG".rejected.* 2>/dev/null | head
diff -u "$CONFIG" "$(ls -t "$CONFIG".clobbered.* 2>/dev/null | head -n 1)"
openclaw config validate
openclaw doctor
```

Häufige Signaturen:

- `.clobbered.*` existiert → eine externe direkte Bearbeitung oder ein Start-Lesevorgang wurde wiederhergestellt.
- `.rejected.*` existiert → ein OpenClaw-eigener Schreibvorgang an der Konfiguration ist vor dem Commit an Schema- oder Clobber-Prüfungen gescheitert.
- `Config write rejected:` → der Schreibvorgang wollte erforderliche Struktur entfernen, die Dateigröße stark verkleinern oder ungültige Konfiguration persistieren.
- `missing-meta-vs-last-good`, `gateway-mode-missing-vs-last-good` oder `size-drop-vs-last-good:*` → beim Start wurde die aktuelle Datei als überschrieben behandelt, weil ihr Felder oder Größe im Vergleich zum zuletzt als gut bekannten Backup fehlten.
- `Config last-known-good promotion skipped` → der Kandidat enthielt geschwärzte Secret-Platzhalter wie `***`.

Lösungsoptionen:

1. Behalten Sie die wiederhergestellte aktive Konfiguration bei, wenn sie korrekt ist.
2. Kopieren Sie nur die beabsichtigten Schlüssel aus `.clobbered.*` oder `.rejected.*` und wenden Sie sie dann mit `openclaw config set` oder `config.patch` an.
3. Führen Sie `openclaw config validate` vor dem Neustart aus.
4. Wenn Sie von Hand bearbeiten, behalten Sie die vollständige JSON5-Konfiguration bei, nicht nur das partielle Objekt, das Sie ändern wollten.

Verwandt:

- [/gateway/configuration#strict-validation](/de/gateway/configuration#strict-validation)
- [/gateway/configuration#config-hot-reload](/de/gateway/configuration#config-hot-reload)
- [/cli/config](/de/cli/config)
- [/gateway/doctor](/de/gateway/doctor)

## Warnungen bei Gateway-Probes

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

- `SSH tunnel failed to start; falling back to direct probes.` → SSH-Setup ist fehlgeschlagen, aber der Befehl hat dennoch direkte konfigurierte/Loopback-Ziele versucht.
- `multiple reachable gateways detected` → mehr als ein Ziel hat geantwortet. Das bedeutet meist ein beabsichtigtes Multi-Gateway-Setup oder veraltete/doppelte Listener.
- `Read-probe diagnostics are limited by gateway scopes (missing operator.read)` → Verbindung hat funktioniert, aber Detail-RPC ist durch Scope begrenzt; koppeln Sie Geräteidentität oder verwenden Sie Anmeldedaten mit `operator.read`.
- `Capability: pairing-pending` oder `gateway closed (1008): pairing required` → das Gateway hat geantwortet, aber dieser Client benötigt weiterhin Pairing/Genehmigung vor normalem Operatorzugriff.
- nicht aufgelöster SecretRef-Warntext zu `gateway.auth.*` / `gateway.remote.*` → Auth-Material war in diesem Befehlsweg für das fehlgeschlagene Ziel nicht verfügbar.

Verwandt:

- [/cli/gateway](/de/cli/gateway)
- [/gateway#multiple-gateways-same-host](/de/gateway#multiple-gateways-same-host)
- [/gateway/remote](/de/gateway/remote)

## Kanal verbunden, Nachrichten fließen aber nicht

Wenn der Kanalstatus verbunden ist, der Nachrichtenfluss aber tot ist, konzentrieren Sie sich auf Richtlinie, Berechtigungen und kanalspezifische Zustellregeln.

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

- `mention required` → Nachricht wird durch Gruppen-Erwähnungsrichtlinie ignoriert.
- `pairing` / Traces zu ausstehender Genehmigung → Absender ist nicht genehmigt.
- `missing_scope`, `not_in_channel`, `Forbidden`, `401/403` → Problem mit Kanal-Authentifizierung/Berechtigungen.

Verwandt:

- [/channels/troubleshooting](/de/channels/troubleshooting)
- [/channels/whatsapp](/de/channels/whatsapp)
- [/channels/telegram](/de/channels/telegram)
- [/channels/discord](/de/channels/discord)

## Zustellung von Cron und Heartbeat

Wenn Cron oder Heartbeat nicht ausgeführt wurde oder nicht zugestellt hat, prüfen Sie zuerst den Zustand des Schedulers und dann das Zustellziel.

```bash
openclaw cron status
openclaw cron list
openclaw cron runs --id <jobId> --limit 20
openclaw system heartbeat last
openclaw logs --follow
```

Achten Sie auf Folgendes:

- Cron aktiviert und nächstes Aufwachen vorhanden.
- Status im Verlauf von Job-Läufen (`ok`, `skipped`, `error`).
- Heartbeat-Überspringgründe (`quiet-hours`, `requests-in-flight`, `alerts-disabled`, `empty-heartbeat-file`, `no-tasks-due`).

Häufige Signaturen:

- `cron: scheduler disabled; jobs will not run automatically` → Cron ist deaktiviert.
- `cron: timer tick failed` → Scheduler-Tick fehlgeschlagen; prüfen Sie Datei-/Log-/Laufzeitfehler.
- `heartbeat skipped` mit `reason=quiet-hours` → außerhalb des Fensters aktiver Stunden.
- `heartbeat skipped` mit `reason=empty-heartbeat-file` → `HEARTBEAT.md` existiert, enthält aber nur leere Zeilen / Markdown-Überschriften, daher überspringt OpenClaw den Modellaufruf.
- `heartbeat skipped` mit `reason=no-tasks-due` → `HEARTBEAT.md` enthält einen `tasks:`-Block, aber bei diesem Tick ist keine der Aufgaben fällig.
- `heartbeat: unknown accountId` → ungültige Account-ID für das Heartbeat-Zustellziel.
- `heartbeat skipped` mit `reason=dm-blocked` → Heartbeat-Ziel wurde zu einem Ziel im Stil einer DM aufgelöst, während `agents.defaults.heartbeat.directPolicy` (oder eine Überschreibung pro Agent) auf `block` gesetzt ist.

Verwandt:

- [/automation/cron-jobs#troubleshooting](/de/automation/cron-jobs#troubleshooting)
- [/automation/cron-jobs](/de/automation/cron-jobs)
- [/gateway/heartbeat](/de/gateway/heartbeat)

## Tool auf gekoppelter Node schlägt fehl

Wenn eine Node gekoppelt ist, Tools aber fehlschlagen, isolieren Sie Vordergrund, Berechtigungen und Genehmigungsstatus.

```bash
openclaw nodes status
openclaw nodes describe --node <idOrNameOrIp>
openclaw approvals get --node <idOrNameOrIp>
openclaw logs --follow
openclaw status
```

Achten Sie auf Folgendes:

- Node online mit den erwarteten Fähigkeiten.
- OS-Berechtigungen für Kamera/Mikrofon/Standort/Bildschirm.
- Exec-Genehmigungen und Zustand der Allowlist.

Häufige Signaturen:

- `NODE_BACKGROUND_UNAVAILABLE` → Node-App muss im Vordergrund sein.
- `*_PERMISSION_REQUIRED` / `LOCATION_PERMISSION_REQUIRED` → fehlende OS-Berechtigung.
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

Achten Sie auf Folgendes:

- Ob `plugins.allow` gesetzt ist und `browser` enthält.
- Gültiger Browserpfad für die ausführbare Datei.
- Erreichbarkeit des CDP-Profils.
- Lokale Chrome-Verfügbarkeit für Profile `existing-session` / `user`.

Häufige Signaturen:

- `unknown command "browser"` oder `unknown command 'browser'` → das gebündelte Browser-Plugin wird durch `plugins.allow` ausgeschlossen.
- Browser-Tool fehlt / ist nicht verfügbar, obwohl `browser.enabled=true` → `plugins.allow` schließt `browser` aus, daher wurde das Plugin nie geladen.
- `Failed to start Chrome CDP on port` → Browserprozess konnte nicht gestartet werden.
- `browser.executablePath not found` → konfigurierter Pfad ist ungültig.
- `browser.cdpUrl must be http(s) or ws(s)` → die konfigurierte CDP-URL verwendet ein nicht unterstütztes Schema wie `file:` oder `ftp:`.
- `browser.cdpUrl has invalid port` → die konfigurierte CDP-URL hat einen fehlerhaften oder außerhalb des Bereichs liegenden Port.
- `Could not find DevToolsActivePort for chrome` → Chrome-MCP-Existing-Session konnte sich noch nicht an das ausgewählte Browser-Datenverzeichnis anhängen. Öffnen Sie die Browser-Inspect-Seite, aktivieren Sie Remote Debugging, lassen Sie den Browser geöffnet, genehmigen Sie die erste Attach-Abfrage und versuchen Sie es erneut. Wenn kein eingeloggter Zustand erforderlich ist, bevorzugen Sie das verwaltete Profil `openclaw`.
- `No Chrome tabs found for profile="user"` → das Attach-Profil von Chrome MCP hat keine geöffneten lokalen Chrome-Tabs.
- `Remote CDP for profile "<name>" is not reachable` → der konfigurierte Remote-CDP-Endpunkt ist vom Gateway-Host aus nicht erreichbar.
- `Browser attachOnly is enabled ... not reachable` oder `Browser attachOnly is enabled and CDP websocket ... is not reachable` → das Attach-Only-Profil hat kein erreichbares Ziel, oder der HTTP-Endpunkt hat geantwortet, aber der CDP-WebSocket konnte trotzdem nicht geöffnet werden.
- `Playwright is not available in this gateway build; '<feature>' is unsupported.` → der aktuellen Gateway-Installation fehlt die Laufzeitabhängigkeit `playwright-core` des gebündelten Browser-Plugins; führen Sie `openclaw doctor --fix` aus und starten Sie dann das Gateway neu. ARIA-Snapshots und einfache Seitenscreenshots können weiterhin funktionieren, aber Navigation, KI-Snapshots, Elementscreenshots per CSS-Selektor und PDF-Export bleiben nicht verfügbar.
- `fullPage is not supported for element screenshots` → Screenshot-Anfrage hat `--full-page` mit `--ref` oder `--element` kombiniert.
- `element screenshots are not supported for existing-session profiles; use ref from snapshot.` → Screenshot-Aufrufe von Chrome MCP / `existing-session` müssen Seitenerfassung oder ein Snapshot-`--ref` verwenden, nicht CSS-`--element`.
- `existing-session file uploads do not support element selectors; use ref/inputRef.` → Upload-Hooks in Chrome MCP benötigen Snapshot-Refs, keine CSS-Selektoren.
- `existing-session file uploads currently support one file at a time.` → senden Sie einen Upload pro Aufruf bei Chrome-MCP-Profilen.
- `existing-session dialog handling does not support timeoutMs.` → Dialog-Hooks in Chrome-MCP-Profilen unterstützen keine Timeout-Überschreibungen.
- `response body is not supported for existing-session profiles yet.` → `responsebody` erfordert weiterhin einen verwalteten Browser oder ein rohes CDP-Profil.
- veraltete Überschreibungen für Viewport / Dark Mode / Locale / Offline auf Attach-Only- oder Remote-CDP-Profilen → führen Sie `openclaw browser stop --browser-profile <name>` aus, um die aktive Steuersitzung zu schließen und den Emulationszustand von Playwright/CDP freizugeben, ohne das gesamte Gateway neu zu starten.

Verwandt:

- [/tools/browser-linux-troubleshooting](/de/tools/browser-linux-troubleshooting)
- [/tools/browser](/de/tools/browser)

## Wenn nach einem Upgrade plötzlich etwas kaputtging

Die meisten Probleme nach einem Upgrade sind Konfigurationsdrift oder jetzt durchgesetzte strengere Standardwerte.

### 1) Verhalten von Auth und URL-Überschreibungen hat sich geändert

```bash
openclaw gateway status
openclaw config get gateway.mode
openclaw config get gateway.remote.url
openclaw config get gateway.auth.mode
```

Was zu prüfen ist:

- Wenn `gateway.mode=remote`, können CLI-Aufrufe auf Remote zielen, während Ihr lokaler Dienst in Ordnung ist.
- Explizite `--url`-Aufrufe greifen nicht auf gespeicherte Anmeldedaten zurück.

Häufige Signaturen:

- `gateway connect failed:` → falsches URL-Ziel.
- `unauthorized` → Endpunkt erreichbar, aber falsche Authentifizierung.

### 2) Guardrails für Bind und Auth sind strenger

```bash
openclaw config get gateway.bind
openclaw config get gateway.auth.mode
openclaw config get gateway.auth.token
openclaw gateway status
openclaw logs --follow
```

Was zu prüfen ist:

- Nicht-Loopback-Bindungen (`lan`, `tailnet`, `custom`) benötigen einen gültigen Gateway-Authentifizierungspfad: Shared-Token-/Passwort-Authentifizierung oder eine korrekt konfigurierte `trusted-proxy`-Bereitstellung ohne Loopback.
- Alte Schlüssel wie `gateway.token` ersetzen `gateway.auth.token` nicht.

Häufige Signaturen:

- `refusing to bind gateway ... without auth` → Nicht-Loopback-Bindung ohne gültigen Gateway-Authentifizierungspfad.
- `Connectivity probe: failed` während die Laufzeit läuft → Gateway lebt, ist aber mit der aktuellen Authentifizierung/URL nicht zugänglich.

### 3) Zustand von Pairing und Geräteidentität hat sich geändert

```bash
openclaw devices list
openclaw pairing list --channel <channel> [--account <id>]
openclaw logs --follow
openclaw doctor
```

Was zu prüfen ist:

- Ausstehende Gerätegenehmigungen für Dashboard/Nodes.
- Ausstehende DM-Pairing-Genehmigungen nach Richtlinien- oder Identitätsänderungen.

Häufige Signaturen:

- `device identity required` → Geräteauthentifizierung ist nicht erfüllt.
- `pairing required` → Absender/Gerät muss genehmigt werden.

Wenn Dienstkonfiguration und Laufzeit nach den Prüfungen weiterhin nicht übereinstimmen, installieren Sie die Dienstmetadaten aus demselben Profil-/Zustandsverzeichnis erneut:

```bash
openclaw gateway install --force
openclaw gateway restart
```

Verwandt:

- [/gateway/pairing](/de/gateway/pairing)
- [/gateway/authentication](/de/gateway/authentication)
- [/gateway/background-process](/de/gateway/background-process)

## Verwandt

- [Gateway-Runbook](/de/gateway)
- [Doctor](/de/gateway/doctor)
- [FAQ](/de/help/faq)
