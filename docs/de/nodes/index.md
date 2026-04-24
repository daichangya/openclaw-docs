---
read_when:
    - iOS-/Android-Nodes mit einem Gateway pairen
    - Node-canvas/Kamera für Agent-Kontext verwenden
    - Neue Node-Befehle oder CLI-Helfer hinzufügen
summary: 'Nodes: Pairing, Fähigkeiten, Berechtigungen und CLI-Helfer für canvas/camera/screen/device/notifications/system'
title: Nodes
x-i18n:
    generated_at: "2026-04-24T06:46:15Z"
    model: gpt-5.4
    provider: openai
    source_hash: 1a210a5b90d78870dd6d17c0f0a81181a8897dc41149618c4359d7c03ef342fd
    source_path: nodes/index.md
    workflow: 15
---

Ein **Node** ist ein Begleitgerät (macOS/iOS/Android/headless), das sich mit dem **WebSocket** des Gateway verbindet (derselbe Port wie für Operatoren) mit `role: "node"` und eine Befehlsoberfläche bereitstellt (z. B. `canvas.*`, `camera.*`, `device.*`, `notifications.*`, `system.*`) über `node.invoke`. Protokolldetails: [Gateway-Protokoll](/de/gateway/protocol).

Veralteter Transport: [Bridge-Protokoll](/de/gateway/bridge-protocol) (TCP JSONL;
historisch nur für aktuelle Nodes).

macOS kann auch im **Node-Modus** laufen: Die Menüleisten-App verbindet sich mit dem WS-Server des Gateway und stellt ihre lokalen canvas-/camera-Befehle als Node bereit (sodass `openclaw nodes …` gegen diesen Mac funktioniert).

Hinweise:

- Nodes sind **Peripheriegeräte**, keine Gateways. Sie betreiben den Gateway-Dienst nicht.
- Telegram-/WhatsApp-/usw.-Nachrichten landen auf dem **Gateway**, nicht auf Nodes.
- Runbook für Fehlerbehebung: [/nodes/troubleshooting](/de/nodes/troubleshooting)

## Pairing + Status

**WS-Nodes verwenden Device-Pairing.** Nodes präsentieren bei `connect` eine Geräteidentität; das Gateway
erstellt eine Device-Pairing-Anfrage für `role: node`. Freigabe über die Geräte-CLI (oder UI).

Schnelle CLI:

```bash
openclaw devices list
openclaw devices approve <requestId>
openclaw devices reject <requestId>
openclaw nodes status
openclaw nodes describe --node <idOrNameOrIp>
```

Wenn ein Node mit geänderten Auth-Details (role/scopes/public key) erneut versucht,
wird die vorherige ausstehende Anfrage ersetzt und eine neue `requestId` erstellt. Führen Sie
`openclaw devices list` vor der Freigabe erneut aus.

Hinweise:

- `nodes status` markiert einen Node als **paired**, wenn seine Device-Pairing-Rolle `node` enthält.
- Der Device-Pairing-Eintrag ist der dauerhafte Vertrag über genehmigte Rollen. Token-
  Rotation bleibt innerhalb dieses Vertrags; sie kann einen gepaarten Node nicht zu einer
  anderen Rolle hochstufen, die durch die Pairing-Freigabe nie gewährt wurde.
- `node.pair.*` (CLI: `openclaw nodes pending/approve/reject/rename`) ist ein separater, gatewayeigener
  Pairing-Store für Nodes; er begrenzt den WS-`connect`-Handshake **nicht**.
- Der Freigabeumfang folgt den deklarierten Befehlen der ausstehenden Anfrage:
  - Anfrage ohne Befehle: `operator.pairing`
  - Node-Befehle ohne Exec: `operator.pairing` + `operator.write`
  - `system.run` / `system.run.prepare` / `system.which`: `operator.pairing` + `operator.admin`

## Remote-Node-Host (`system.run`)

Verwenden Sie einen **Node-Host**, wenn Ihr Gateway auf einem Rechner läuft und Sie möchten, dass Befehle
auf einem anderen ausgeführt werden. Das Modell spricht weiterhin mit dem **Gateway**; das Gateway
leitet `exec`-Aufrufe an den **Node-Host** weiter, wenn `host=node` ausgewählt ist.

### Was läuft wo

- **Gateway-Host**: empfängt Nachrichten, führt das Modell aus, leitet Tool-Aufrufe weiter.
- **Node-Host**: führt `system.run`/`system.which` auf dem Node-Rechner aus.
- **Freigaben**: werden auf dem Node-Host über `~/.openclaw/exec-approvals.json` durchgesetzt.

Hinweis zu Freigaben:

- Freigabegestützte Node-Läufe binden exakten Anfragekontext.
- Für direkte Shell-/Laufzeit-Dateiausführungen bindet OpenClaw zusätzlich nach bestem Bemühen eine konkrete lokale
  Dateioperand und verweigert den Lauf, wenn sich diese Datei vor der Ausführung ändert.
- Wenn OpenClaw für einen Interpreter-/Laufzeitbefehl nicht genau eine konkrete lokale Datei identifizieren kann,
  wird freigabegestützte Ausführung verweigert, anstatt vollständige Laufzeitabdeckung vorzutäuschen. Verwenden Sie Sandboxing,
  separate Hosts oder einen expliziten vertrauenswürdigen Allowlist-/Full-Workflow für breitere Interpreter-Semantik.

### Einen Node-Host starten (Vordergrund)

Auf dem Node-Rechner:

```bash
openclaw node run --host <gateway-host> --port 18789 --display-name "Build Node"
```

### Remote-Gateway über SSH-Tunnel (Loopback-Bind)

Wenn das Gateway an Loopback bindet (`gateway.bind=loopback`, Standard im lokalen Modus),
können sich Remote-Node-Hosts nicht direkt verbinden. Erstellen Sie einen SSH-Tunnel und richten Sie den
Node-Host auf das lokale Ende des Tunnels.

Beispiel (Node-Host -> Gateway-Host):

```bash
# Terminal A (weiterlaufen lassen): lokalen 18790 -> Gateway 127.0.0.1:18789 weiterleiten
ssh -N -L 18790:127.0.0.1:18789 user@gateway-host

# Terminal B: Gateway-Token exportieren und durch den Tunnel verbinden
export OPENCLAW_GATEWAY_TOKEN="<gateway-token>"
openclaw node run --host 127.0.0.1 --port 18790 --display-name "Build Node"
```

Hinweise:

- `openclaw node run` unterstützt Token- oder Passwortauthentifizierung.
- Umgebungsvariablen werden bevorzugt: `OPENCLAW_GATEWAY_TOKEN` / `OPENCLAW_GATEWAY_PASSWORD`.
- Konfigurations-Fallback ist `gateway.auth.token` / `gateway.auth.password`.
- Im lokalen Modus ignoriert der Node-Host absichtlich `gateway.remote.token` / `gateway.remote.password`.
- Im Remote-Modus kommen `gateway.remote.token` / `gateway.remote.password` gemäß den Vorrangregeln für Remote in Frage.
- Wenn aktive lokale `gateway.auth.*`-SecretRefs konfiguriert, aber nicht aufgelöst sind, schlägt Node-Host-Auth geschlossen fehl.
- Die Auflösung von Node-Host-Auth berücksichtigt nur Env-Variablen `OPENCLAW_GATEWAY_*`.

### Einen Node-Host starten (Dienst)

```bash
openclaw node install --host <gateway-host> --port 18789 --display-name "Build Node"
openclaw node restart
```

### Pairing + Name

Auf dem Gateway-Host:

```bash
openclaw devices list
openclaw devices approve <requestId>
openclaw nodes status
```

Wenn der Node mit geänderten Auth-Details erneut versucht, führen Sie `openclaw devices list`
erneut aus und genehmigen Sie die aktuelle `requestId`.

Namensoptionen:

- `--display-name` bei `openclaw node run` / `openclaw node install` (wird in `~/.openclaw/node.json` auf dem Node gespeichert).
- `openclaw nodes rename --node <id|name|ip> --name "Build Node"` (Gateway-Überschreibung).

### Die Befehle allowlisten

Exec-Freigaben gelten **pro Node-Host**. Fügen Sie Allowlist-Einträge vom Gateway aus hinzu:

```bash
openclaw approvals allowlist add --node <id|name|ip> "/usr/bin/uname"
openclaw approvals allowlist add --node <id|name|ip> "/usr/bin/sw_vers"
```

Freigaben liegen auf dem Node-Host unter `~/.openclaw/exec-approvals.json`.

### Exec auf den Node richten

Standardwerte konfigurieren (Gateway-Konfiguration):

```bash
openclaw config set tools.exec.host node
openclaw config set tools.exec.security allowlist
openclaw config set tools.exec.node "<id-or-name>"
```

Oder pro Sitzung:

```
/exec host=node security=allowlist node=<id-or-name>
```

Sobald dies gesetzt ist, läuft jeder `exec`-Aufruf mit `host=node` auf dem Node-Host (vorbehaltlich der
Node-Allowlist/Freigaben).

`host=auto` wählt den Node nicht implizit von selbst aus, aber eine explizite Anfrage `host=node` pro Aufruf ist von `auto` aus erlaubt. Wenn Node-Exec der Standard für die Sitzung sein soll, setzen Sie `tools.exec.host=node` oder `/exec host=node ...` explizit.

Verwandt:

- [Node-Host-CLI](/de/cli/node)
- [Exec-Tool](/de/tools/exec)
- [Exec-Freigaben](/de/tools/exec-approvals)

## Befehle aufrufen

Low-Level (rohes RPC):

```bash
openclaw nodes invoke --node <idOrNameOrIp> --command canvas.eval --params '{"javaScript":"location.href"}'
```

Für die häufigen Workflows „dem Agenten einen MEDIA-Anhang geben“ gibt es High-Level-Helfer.

## Screenshots (Canvas-Snapshots)

Wenn der Node Canvas (WebView) anzeigt, gibt `canvas.snapshot` `{ format, base64 }` zurück.

CLI-Helfer (schreibt in eine temporäre Datei und gibt `MEDIA:<path>` aus):

```bash
openclaw nodes canvas snapshot --node <idOrNameOrIp> --format png
openclaw nodes canvas snapshot --node <idOrNameOrIp> --format jpg --max-width 1200 --quality 0.9
```

### Canvas-Steuerung

```bash
openclaw nodes canvas present --node <idOrNameOrIp> --target https://example.com
openclaw nodes canvas hide --node <idOrNameOrIp>
openclaw nodes canvas navigate https://example.com --node <idOrNameOrIp>
openclaw nodes canvas eval --node <idOrNameOrIp> --js "document.title"
```

Hinweise:

- `canvas present` akzeptiert URLs oder lokale Dateipfade (`--target`) sowie optional `--x/--y/--width/--height` für die Positionierung.
- `canvas eval` akzeptiert Inline-JS (`--js`) oder ein Positionsargument.

### A2UI (Canvas)

```bash
openclaw nodes canvas a2ui push --node <idOrNameOrIp> --text "Hello"
openclaw nodes canvas a2ui push --node <idOrNameOrIp> --jsonl ./payload.jsonl
openclaw nodes canvas a2ui reset --node <idOrNameOrIp>
```

Hinweise:

- Nur A2UI-v0.8-JSONL wird unterstützt (v0.9/createSurface wird abgelehnt).

## Fotos + Videos (Node-Kamera)

Fotos (`jpg`):

```bash
openclaw nodes camera list --node <idOrNameOrIp>
openclaw nodes camera snap --node <idOrNameOrIp>            # Standard: beide Blickrichtungen (2 MEDIA-Zeilen)
openclaw nodes camera snap --node <idOrNameOrIp> --facing front
```

Videoclips (`mp4`):

```bash
openclaw nodes camera clip --node <idOrNameOrIp> --duration 10s
openclaw nodes camera clip --node <idOrNameOrIp> --duration 3000 --no-audio
```

Hinweise:

- Der Node muss für `canvas.*` und `camera.*` **im Vordergrund** sein (Aufrufe im Hintergrund geben `NODE_BACKGROUND_UNAVAILABLE` zurück).
- Die Clip-Dauer wird begrenzt (derzeit `<= 60s`), um zu große Base64-Payloads zu vermeiden.
- Android fordert nach Möglichkeit Berechtigungen für `CAMERA`/`RECORD_AUDIO` an; verweigerte Berechtigungen schlagen mit `*_PERMISSION_REQUIRED` fehl.

## Bildschirmaufzeichnungen (Nodes)

Unterstützte Nodes stellen `screen.record` (`mp4`) bereit. Beispiel:

```bash
openclaw nodes screen record --node <idOrNameOrIp> --duration 10s --fps 10
openclaw nodes screen record --node <idOrNameOrIp> --duration 10s --fps 10 --no-audio
```

Hinweise:

- Die Verfügbarkeit von `screen.record` hängt von der Node-Plattform ab.
- Bildschirmaufzeichnungen werden auf `<= 60s` begrenzt.
- `--no-audio` deaktiviert Mikrofonaufnahme auf unterstützten Plattformen.
- Verwenden Sie `--screen <index>`, um bei mehreren Bildschirmen ein Display auszuwählen.

## Standort (Nodes)

Nodes stellen `location.get` bereit, wenn Standort in den Einstellungen aktiviert ist.

CLI-Helfer:

```bash
openclaw nodes location get --node <idOrNameOrIp>
openclaw nodes location get --node <idOrNameOrIp> --accuracy precise --max-age 15000 --location-timeout 10000
```

Hinweise:

- Standort ist standardmäßig **deaktiviert**.
- „Always“ erfordert Systemberechtigung; Abruf im Hintergrund erfolgt nach bestem Bemühen.
- Die Antwort enthält Lat/Lon, Genauigkeit (Meter) und Zeitstempel.

## SMS (Android-Nodes)

Android-Nodes können `sms.send` bereitstellen, wenn der Benutzer die Berechtigung **SMS** erteilt und das Gerät Telefonie unterstützt.

Low-Level-Aufruf:

```bash
openclaw nodes invoke --node <idOrNameOrIp> --command sms.send --params '{"to":"+15555550123","message":"Hello from OpenClaw"}'
```

Hinweise:

- Die Berechtigungsabfrage muss auf dem Android-Gerät akzeptiert werden, bevor die Fähigkeit beworben wird.
- Geräte nur mit WLAN ohne Telefonie bewerben `sms.send` nicht.

## Android-Geräte- und persönliche Datenbefehle

Android-Nodes können zusätzliche Befehlsfamilien bewerben, wenn die entsprechenden Fähigkeiten aktiviert sind.

Verfügbare Familien:

- `device.status`, `device.info`, `device.permissions`, `device.health`
- `notifications.list`, `notifications.actions`
- `photos.latest`
- `contacts.search`, `contacts.add`
- `calendar.events`, `calendar.add`
- `callLog.search`
- `sms.search`
- `motion.activity`, `motion.pedometer`

Beispielaufrufe:

```bash
openclaw nodes invoke --node <idOrNameOrIp> --command device.status --params '{}'
openclaw nodes invoke --node <idOrNameOrIp> --command notifications.list --params '{}'
openclaw nodes invoke --node <idOrNameOrIp> --command photos.latest --params '{"limit":1}'
```

Hinweise:

- Motion-Befehle sind über Fähigkeiten verfügbar, abhängig von den vorhandenen Sensoren.

## Systembefehle (Node-Host / Mac-Node)

Der macOS-Node stellt `system.run`, `system.notify` und `system.execApprovals.get/set` bereit.
Der headless Node-Host stellt `system.run`, `system.which` und `system.execApprovals.get/set` bereit.

Beispiele:

```bash
openclaw nodes notify --node <idOrNameOrIp> --title "Ping" --body "Gateway ready"
openclaw nodes invoke --node <idOrNameOrIp> --command system.which --params '{"name":"git"}'
```

Hinweise:

- `system.run` gibt stdout/stderr/Exit-Code in der Payload zurück.
- Shell-Ausführung läuft jetzt über das Tool `exec` mit `host=node`; `nodes` bleibt die direkte RPC-Oberfläche für explizite Node-Befehle.
- `nodes invoke` stellt `system.run` oder `system.run.prepare` nicht bereit; diese bleiben ausschließlich auf dem Exec-Pfad.
- Der Exec-Pfad bereitet vor der Freigabe einen kanonischen `systemRunPlan` vor. Sobald eine Freigabe erteilt wurde, leitet das Gateway diesen gespeicherten Plan weiter, nicht später vom Aufrufer geänderte Felder für command/cwd/session.
- `system.notify` berücksichtigt den Berechtigungsstatus für Benachrichtigungen in der macOS-App.
- Nicht erkannte `platform`-/`deviceFamily`-Metadaten von Nodes verwenden eine konservative Standard-Allowlist, die `system.run` und `system.which` ausschließt. Wenn Sie diese Befehle absichtlich für eine unbekannte Plattform benötigen, fügen Sie sie explizit über `gateway.nodes.allowCommands` hinzu.
- `system.run` unterstützt `--cwd`, `--env KEY=VAL`, `--command-timeout` und `--needs-screen-recording`.
- Für Shell-Wrapper (`bash|sh|zsh ... -c/-lc`) werden anfragebezogene `--env`-Werte auf eine explizite Allowlist reduziert (`TERM`, `LANG`, `LC_*`, `COLORTERM`, `NO_COLOR`, `FORCE_COLOR`).
- Für Entscheidungen „always allow“ im Allowlist-Modus speichern bekannte Dispatch-Wrapper (`env`, `nice`, `nohup`, `stdbuf`, `timeout`) innere Pfade ausführbarer Dateien statt Wrapper-Pfade. Wenn das Entpacken nicht sicher ist, wird kein Allowlist-Eintrag automatisch gespeichert.
- Auf Windows-Node-Hosts im Allowlist-Modus erfordern Shell-Wrapper-Läufe über `cmd.exe /c` eine Freigabe (ein Allowlist-Eintrag allein erlaubt die Wrapper-Form nicht automatisch).
- `system.notify` unterstützt `--priority <passive|active|timeSensitive>` und `--delivery <system|overlay|auto>`.
- Node-Hosts ignorieren `PATH`-Überschreibungen und entfernen gefährliche Start-/Shell-Schlüssel (`DYLD_*`, `LD_*`, `NODE_OPTIONS`, `PYTHON*`, `PERL*`, `RUBYOPT`, `SHELLOPTS`, `PS4`). Wenn Sie zusätzliche PATH-Einträge benötigen, konfigurieren Sie stattdessen die Service-Umgebung des Node-Host (oder installieren Sie Tools an Standardorten), anstatt `PATH` über `--env` zu übergeben.
- Im macOS-Node-Modus wird `system.run` durch Exec-Freigaben in der macOS-App begrenzt (Einstellungen → Exec-Freigaben).
  Ask/allowlist/full verhalten sich genauso wie beim headless Node-Host; verweigerte Prompts geben `SYSTEM_RUN_DENIED` zurück.
- Auf dem headless Node-Host wird `system.run` durch Exec-Freigaben begrenzt (`~/.openclaw/exec-approvals.json`).

## Exec-Node-Bindung

Wenn mehrere Nodes verfügbar sind, können Sie Exec an einen bestimmten Node binden.
Dadurch wird der Standard-Node für `exec host=node` gesetzt (und kann pro Agent überschrieben werden).

Globaler Standard:

```bash
openclaw config set tools.exec.node "node-id-or-name"
```

Überschreibung pro Agent:

```bash
openclaw config get agents.list
openclaw config set agents.list[0].tools.exec.node "node-id-or-name"
```

Entfernen, um jeden Node zuzulassen:

```bash
openclaw config unset tools.exec.node
openclaw config unset agents.list[0].tools.exec.node
```

## Berechtigungszuordnung

Nodes können in `node.list` / `node.describe` eine `permissions`-Map enthalten, indiziert nach Berechtigungsname (z. B. `screenRecording`, `accessibility`) mit booleschen Werten (`true` = gewährt).

## Headless Node-Host (plattformübergreifend)

OpenClaw kann einen **headless Node-Host** (ohne UI) ausführen, der sich mit dem WebSocket des Gateway
verbindet und `system.run` / `system.which` bereitstellt. Das ist nützlich unter Linux/Windows
oder für den Betrieb eines minimalen Node neben einem Server.

Starten:

```bash
openclaw node run --host <gateway-host> --port 18789
```

Hinweise:

- Pairing ist weiterhin erforderlich (das Gateway zeigt einen Device-Pairing-Prompt).
- Der Node-Host speichert seine Node-ID, sein Token, seinen Anzeigenamen und die Verbindungsinformationen zum Gateway in `~/.openclaw/node.json`.
- Exec-Freigaben werden lokal über `~/.openclaw/exec-approvals.json` durchgesetzt
  (siehe [Exec-Freigaben](/de/tools/exec-approvals)).
- Unter macOS führt der headless Node-Host `system.run` standardmäßig lokal aus. Setzen Sie
  `OPENCLAW_NODE_EXEC_HOST=app`, um `system.run` über den Exec-Host der Begleit-App zu leiten; fügen Sie
  `OPENCLAW_NODE_EXEC_FALLBACK=0` hinzu, um den App-Host zu verlangen und geschlossen fehlzuschlagen, wenn er nicht verfügbar ist.
- Fügen Sie `--tls` / `--tls-fingerprint` hinzu, wenn der Gateway-WS TLS verwendet.

## Mac-Node-Modus

- Die macOS-Menüleisten-App verbindet sich als Node mit dem Gateway-WS-Server (sodass `openclaw nodes …` gegen diesen Mac funktioniert).
- Im Remote-Modus öffnet die App einen SSH-Tunnel für den Gateway-Port und verbindet sich mit `localhost`.
