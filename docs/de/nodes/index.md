---
read_when:
    - iOS-/Android-Nodes mit einem Gateway pairen
    - Node-Canvas/Kamera für Agent-Kontext verwenden
    - Neue Node-Befehle oder CLI-Helfer hinzufügen
summary: 'Nodes: Pairing, Fähigkeiten, Berechtigungen und CLI-Helfer für canvas/camera/screen/device/notifications/system'
title: Nodes
x-i18n:
    generated_at: "2026-04-05T12:48:57Z"
    model: gpt-5.4
    provider: openai
    source_hash: 201be0e13cb6d39608f0bbd40fd02333f68bd44f588538d1016fe864db7e038e
    source_path: nodes/index.md
    workflow: 15
---

# Nodes

Ein **Node** ist ein Begleitgerät (macOS/iOS/Android/headless), das sich mit dem Gateway-**WebSocket** (derselbe Port wie für Operatoren) mit `role: "node"` verbindet und eine Befehlsoberfläche (z. B. `canvas.*`, `camera.*`, `device.*`, `notifications.*`, `system.*`) über `node.invoke` bereitstellt. Protokolldetails: [Gateway protocol](/gateway/protocol).

Veralteter Transport: [Bridge protocol](/gateway/bridge-protocol) (TCP JSONL;
nur historisch für aktuelle Nodes).

macOS kann auch im **Node-Modus** laufen: Die Menüleisten-App verbindet sich mit dem WS-Server des Gateways und stellt ihre lokalen Canvas-/Kamera-Befehle als Node bereit (sodass `openclaw nodes …` gegen diesen Mac funktioniert).

Hinweise:

- Nodes sind **Peripheriegeräte**, keine Gateways. Sie führen den Gateway-Dienst nicht aus.
- Telegram-/WhatsApp-/usw.-Nachrichten landen auf dem **Gateway**, nicht auf Nodes.
- Runbook zur Fehlerbehebung: [/nodes/troubleshooting](/nodes/troubleshooting)

## Pairing + Status

**WS-Nodes verwenden Device Pairing.** Nodes präsentieren während `connect` eine Geräteidentität; das Gateway
erstellt eine Geräte-Pairing-Anfrage für `role: node`. Genehmigen Sie sie über die devices CLI (oder UI).

Schnelle CLI:

```bash
openclaw devices list
openclaw devices approve <requestId>
openclaw devices reject <requestId>
openclaw nodes status
openclaw nodes describe --node <idOrNameOrIp>
```

Wenn ein Node es mit geänderten Auth-Details erneut versucht (Rolle/Scopes/Public Key), wird die vorherige
ausstehende Anfrage ersetzt und eine neue `requestId` erstellt. Führen Sie
`openclaw devices list` erneut aus, bevor Sie genehmigen.

Hinweise:

- `nodes status` markiert einen Node als **paired**, wenn seine Geräte-Pairing-Rolle `node` enthält.
- Der Geräte-Pairing-Eintrag ist der dauerhafte Vertrag über genehmigte Rollen. Token-
  Rotation bleibt innerhalb dieses Vertrags; sie kann einen gekoppelten Node nicht zu einer
  anderen Rolle hochstufen, die durch die Pairing-Genehmigung nie gewährt wurde.
- `node.pair.*` (CLI: `openclaw nodes pending/approve/reject/rename`) ist ein separater, gateway-eigener
  Node-Pairing-Speicher; er steuert **nicht** den WS-`connect`-Handshake.
- Der Genehmigungsumfang folgt den deklarierten Befehlen der ausstehenden Anfrage:
  - Anfrage ohne Befehl: `operator.pairing`
  - Node-Befehle ohne exec: `operator.pairing` + `operator.write`
  - `system.run` / `system.run.prepare` / `system.which`: `operator.pairing` + `operator.admin`

## Remote-Node-Host (system.run)

Verwenden Sie einen **node host**, wenn Ihr Gateway auf einer Maschine läuft und Sie Befehle
auf einer anderen ausführen möchten. Das Modell spricht weiterhin mit dem **gateway**; das Gateway
leitet `exec`-Aufrufe an den **node host** weiter, wenn `host=node` ausgewählt ist.

### Was läuft wo

- **Gateway-Host**: empfängt Nachrichten, führt das Modell aus, routet Tool-Aufrufe.
- **Node-Host**: führt `system.run`/`system.which` auf der Node-Maschine aus.
- **Genehmigungen**: werden auf dem Node-Host über `~/.openclaw/exec-approvals.json` erzwungen.

Hinweis zu Genehmigungen:

- Genehmigungsgestützte Node-Läufe binden den exakten Anfragekontext.
- Für direkte Shell-/Laufzeit-Dateiausführungen bindet OpenClaw außerdem best effort genau
  einen konkreten lokalen Dateioperanden und verweigert die Ausführung, wenn sich diese Datei vor der Ausführung ändert.
- Wenn OpenClaw nicht genau eine konkrete lokale Datei für einen Interpreter-/Laufzeitbefehl identifizieren kann,
  wird die genehmigungsgestützte Ausführung verweigert, statt eine vollständige Laufzeitabdeckung vorzutäuschen. Verwenden Sie Sandboxing,
  separate Hosts oder einen expliziten vertrauenswürdigen Allowlist-/Full-Workflow für weiter gefasste Interpreter-Semantik.

### Einen Node-Host starten (Vordergrund)

Auf der Node-Maschine:

```bash
openclaw node run --host <gateway-host> --port 18789 --display-name "Build Node"
```

### Remote-Gateway über SSH-Tunnel (Loopback-Bindung)

Wenn das Gateway an Loopback bindet (`gateway.bind=loopback`, Standard im lokalen Modus),
können sich Remote-Node-Hosts nicht direkt verbinden. Erstellen Sie einen SSH-Tunnel und verweisen Sie den
Node-Host auf das lokale Ende des Tunnels.

Beispiel (Node-Host -> Gateway-Host):

```bash
# Terminal A (keep running): forward local 18790 -> gateway 127.0.0.1:18789
ssh -N -L 18790:127.0.0.1:18789 user@gateway-host

# Terminal B: export the gateway token and connect through the tunnel
export OPENCLAW_GATEWAY_TOKEN="<gateway-token>"
openclaw node run --host 127.0.0.1 --port 18790 --display-name "Build Node"
```

Hinweise:

- `openclaw node run` unterstützt Token- oder Passwort-Auth.
- Env-Variablen werden bevorzugt: `OPENCLAW_GATEWAY_TOKEN` / `OPENCLAW_GATEWAY_PASSWORD`.
- Konfigurations-Fallback ist `gateway.auth.token` / `gateway.auth.password`.
- Im lokalen Modus ignoriert node host absichtlich `gateway.remote.token` / `gateway.remote.password`.
- Im Remote-Modus sind `gateway.remote.token` / `gateway.remote.password` gemäß den Vorrangregeln für remote zulässig.
- Wenn aktive lokale `gateway.auth.*`-SecretRefs konfiguriert, aber nicht aufgelöst sind, schlägt die Node-Host-Auth fail-closed fehl.
- Die Auth-Auflösung des Node-Hosts berücksichtigt nur `OPENCLAW_GATEWAY_*`-Env-Variablen.

### Einen Node-Host starten (Dienst)

```bash
openclaw node install --host <gateway-host> --port 18789 --display-name "Build Node"
openclaw node restart
```

### Pairen + benennen

Auf dem Gateway-Host:

```bash
openclaw devices list
openclaw devices approve <requestId>
openclaw nodes status
```

Wenn der Node es mit geänderten Auth-Details erneut versucht, führen Sie `openclaw devices list`
erneut aus und genehmigen Sie die aktuelle `requestId`.

Optionen für die Benennung:

- `--display-name` bei `openclaw node run` / `openclaw node install` (wird in `~/.openclaw/node.json` auf dem Node gespeichert).
- `openclaw nodes rename --node <id|name|ip> --name "Build Node"` (Gateway-Override).

### Die Befehle auf die Allowlist setzen

Exec-Genehmigungen gelten **pro Node-Host**. Fügen Sie Allowlist-Einträge vom Gateway aus hinzu:

```bash
openclaw approvals allowlist add --node <id|name|ip> "/usr/bin/uname"
openclaw approvals allowlist add --node <id|name|ip> "/usr/bin/sw_vers"
```

Genehmigungen liegen auf dem Node-Host unter `~/.openclaw/exec-approvals.json`.

### Exec auf den Node richten

Standardeinstellungen konfigurieren (Gateway-Konfiguration):

```bash
openclaw config set tools.exec.host node
openclaw config set tools.exec.security allowlist
openclaw config set tools.exec.node "<id-or-name>"
```

Oder pro Sitzung:

```
/exec host=node security=allowlist node=<id-or-name>
```

Sobald dies gesetzt ist, läuft jeder `exec`-Aufruf mit `host=node` auf dem Node-Host (vorbehaltlich
der Allowlist/Genehmigungen des Nodes).

`host=auto` wählt den Node nicht implizit selbstständig aus, aber eine explizite Anfrage pro Aufruf mit `host=node` ist von `auto` aus zulässig. Wenn Node-Exec standardmäßig für die Sitzung verwendet werden soll, setzen Sie `tools.exec.host=node` oder `/exec host=node ...` explizit.

Verwandt:

- [Node host CLI](/cli/node)
- [Exec tool](/tools/exec)
- [Exec approvals](/tools/exec-approvals)

## Befehle aufrufen

Low-Level (rohes RPC):

```bash
openclaw nodes invoke --node <idOrNameOrIp> --command canvas.eval --params '{"javaScript":"location.href"}'
```

Für die gängigen Workflows „dem Agenten einen MEDIA-Anhang geben“ gibt es Helfer auf höherer Ebene.

## Screenshots (Canvas-Snapshots)

Wenn der Node das Canvas anzeigt (WebView), gibt `canvas.snapshot` `{ format, base64 }` zurück.

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

- Es wird nur A2UI-v0.8-JSONL unterstützt (v0.9/createSurface wird abgelehnt).

## Fotos + Videos (Node-Kamera)

Fotos (`jpg`):

```bash
openclaw nodes camera list --node <idOrNameOrIp>
openclaw nodes camera snap --node <idOrNameOrIp>            # default: both facings (2 MEDIA lines)
openclaw nodes camera snap --node <idOrNameOrIp> --facing front
```

Videoclips (`mp4`):

```bash
openclaw nodes camera clip --node <idOrNameOrIp> --duration 10s
openclaw nodes camera clip --node <idOrNameOrIp> --duration 3000 --no-audio
```

Hinweise:

- Der Node muss für `canvas.*` und `camera.*` **im Vordergrund** sein (Hintergrundaufrufe geben `NODE_BACKGROUND_UNAVAILABLE` zurück).
- Die Clip-Dauer ist begrenzt (derzeit `<= 60s`), um übergroße base64-Payloads zu vermeiden.
- Android fordert nach Möglichkeit Berechtigungen für `CAMERA`/`RECORD_AUDIO` an; verweigerte Berechtigungen schlagen mit `*_PERMISSION_REQUIRED` fehl.

## Bildschirmaufzeichnungen (Nodes)

Unterstützte Nodes stellen `screen.record` bereit (`mp4`). Beispiel:

```bash
openclaw nodes screen record --node <idOrNameOrIp> --duration 10s --fps 10
openclaw nodes screen record --node <idOrNameOrIp> --duration 10s --fps 10 --no-audio
```

Hinweise:

- Die Verfügbarkeit von `screen.record` hängt von der Plattform des Nodes ab.
- Bildschirmaufzeichnungen sind auf `<= 60s` begrenzt.
- `--no-audio` deaktiviert die Mikrofonaufnahme auf unterstützten Plattformen.
- Verwenden Sie `--screen <index>`, um bei mehreren Bildschirmen ein Display auszuwählen.

## Standort (Nodes)

Nodes stellen `location.get` bereit, wenn Location in den Einstellungen aktiviert ist.

CLI-Helfer:

```bash
openclaw nodes location get --node <idOrNameOrIp>
openclaw nodes location get --node <idOrNameOrIp> --accuracy precise --max-age 15000 --location-timeout 10000
```

Hinweise:

- Standort ist **standardmäßig deaktiviert**.
- „Always“ erfordert eine Systemberechtigung; Hintergrundabrufe sind best effort.
- Die Antwort enthält Breite/Länge, Genauigkeit (Meter) und Zeitstempel.

## SMS (Android-Nodes)

Android-Nodes können `sms.send` bereitstellen, wenn der Benutzer die **SMS**-Berechtigung gewährt und das Gerät Telefonie unterstützt.

Low-Level-Aufruf:

```bash
openclaw nodes invoke --node <idOrNameOrIp> --command sms.send --params '{"to":"+15555550123","message":"Hello from OpenClaw"}'
```

Hinweise:

- Die Berechtigungsabfrage muss auf dem Android-Gerät akzeptiert werden, bevor die Fähigkeit angekündigt wird.
- Geräte nur mit WLAN ohne Telefonie kündigen `sms.send` nicht an.

## Android-Geräte- und persönliche Datenbefehle

Android-Nodes können zusätzliche Befehlsfamilien ankündigen, wenn die entsprechenden Fähigkeiten aktiviert sind.

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

- Motion-Befehle werden durch verfügbare Sensoren capability-gated.

## Systembefehle (Node-Host / Mac-Node)

Der macOS-Node stellt `system.run`, `system.notify` und `system.execApprovals.get/set` bereit.
Der Headless-Node-Host stellt `system.run`, `system.which` und `system.execApprovals.get/set` bereit.

Beispiele:

```bash
openclaw nodes notify --node <idOrNameOrIp> --title "Ping" --body "Gateway ready"
openclaw nodes invoke --node <idOrNameOrIp> --command system.which --params '{"name":"git"}'
```

Hinweise:

- `system.run` gibt stdout/stderr/Exit-Code in der Payload zurück.
- Shell-Ausführung läuft jetzt über das `exec`-Tool mit `host=node`; `nodes` bleibt die direkte RPC-Oberfläche für explizite Node-Befehle.
- `nodes invoke` stellt `system.run` oder `system.run.prepare` nicht bereit; diese bleiben ausschließlich auf dem Exec-Pfad.
- Der Exec-Pfad bereitet vor der Genehmigung einen kanonischen `systemRunPlan` vor. Sobald eine
  Genehmigung erteilt ist, leitet das Gateway diesen gespeicherten Plan weiter, nicht später vom
  Aufrufer bearbeitete Felder für command/cwd/session.
- `system.notify` berücksichtigt den Zustand der Benachrichtigungsberechtigung in der macOS-App.
- Nicht erkannte Node-Metadaten `platform` / `deviceFamily` verwenden eine konservative Standard-Allowlist, die `system.run` und `system.which` ausschließt. Wenn Sie diese Befehle absichtlich für eine unbekannte Plattform benötigen, fügen Sie sie explizit über `gateway.nodes.allowCommands` hinzu.
- `system.run` unterstützt `--cwd`, `--env KEY=VAL`, `--command-timeout` und `--needs-screen-recording`.
- Für Shell-Wrapper (`bash|sh|zsh ... -c/-lc`) werden anfragebezogene `--env`-Werte auf eine explizite Allowlist reduziert (`TERM`, `LANG`, `LC_*`, `COLORTERM`, `NO_COLOR`, `FORCE_COLOR`).
- Für Entscheidungen „immer erlauben“ im Allowlist-Modus speichern bekannte Dispatch-Wrapper (`env`, `nice`, `nohup`, `stdbuf`, `timeout`) innere ausführbare Pfade statt Wrapper-Pfade. Wenn sich ein sicheres Unwrapping nicht durchführen lässt, wird automatisch kein Allowlist-Eintrag gespeichert.
- Auf Windows-Node-Hosts im Allowlist-Modus erfordern Shell-Wrapper-Aufrufe über `cmd.exe /c` eine Genehmigung (ein Allowlist-Eintrag allein erlaubt die Wrapper-Form nicht automatisch).
- `system.notify` unterstützt `--priority <passive|active|timeSensitive>` und `--delivery <system|overlay|auto>`.
- Node-Hosts ignorieren `PATH`-Überschreibungen und entfernen gefährliche Start-/Shell-Schlüssel (`DYLD_*`, `LD_*`, `NODE_OPTIONS`, `PYTHON*`, `PERL*`, `RUBYOPT`, `SHELLOPTS`, `PS4`). Wenn Sie zusätzliche PATH-Einträge benötigen, konfigurieren Sie stattdessen die Dienstumgebung des Node-Hosts (oder installieren Sie Tools an Standardorten), statt `PATH` über `--env` zu übergeben.
- Im macOS-Node-Modus wird `system.run` durch Exec-Genehmigungen in der macOS-App gesteuert (Einstellungen → Exec approvals).
  Ask/allowlist/full verhalten sich wie beim Headless-Node-Host; verweigerte Prompts geben `SYSTEM_RUN_DENIED` zurück.
- Auf dem Headless-Node-Host wird `system.run` durch Exec-Genehmigungen gesteuert (`~/.openclaw/exec-approvals.json`).

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

Nicht setzen, um jeden Node zuzulassen:

```bash
openclaw config unset tools.exec.node
openclaw config unset agents.list[0].tools.exec.node
```

## Berechtigungszuordnung

Nodes können eine Zuordnung `permissions` in `node.list` / `node.describe` enthalten, mit dem Berechtigungsnamen als Schlüssel (z. B. `screenRecording`, `accessibility`) und booleschen Werten (`true` = gewährt).

## Headless-Node-Host (plattformübergreifend)

OpenClaw kann einen **Headless-Node-Host** (ohne UI) ausführen, der sich mit dem Gateway
WebSocket verbindet und `system.run` / `system.which` bereitstellt. Das ist nützlich unter Linux/Windows
oder um einen minimalen Node neben einem Server auszuführen.

Starten:

```bash
openclaw node run --host <gateway-host> --port 18789
```

Hinweise:

- Pairing ist weiterhin erforderlich (das Gateway zeigt eine Geräte-Pairing-Aufforderung an).
- Der Node-Host speichert seine Node-ID, sein Token, seinen Anzeigenamen und die Gateway-Verbindungsinformationen in `~/.openclaw/node.json`.
- Exec-Genehmigungen werden lokal über `~/.openclaw/exec-approvals.json`
  erzwungen (siehe [Exec approvals](/tools/exec-approvals)).
- Unter macOS führt der Headless-Node-Host `system.run` standardmäßig lokal aus. Setzen Sie
  `OPENCLAW_NODE_EXEC_HOST=app`, um `system.run` über den Exec-Host der Companion-App zu routen; fügen Sie
  `OPENCLAW_NODE_EXEC_FALLBACK=0` hinzu, um den App-Host zu erzwingen und fail-closed zu sein, wenn er nicht verfügbar ist.
- Fügen Sie `--tls` / `--tls-fingerprint` hinzu, wenn das Gateway WS TLS verwendet.

## Mac-Node-Modus

- Die macOS-Menüleisten-App verbindet sich als Node mit dem Gateway-WS-Server (sodass `openclaw nodes …` gegen diesen Mac funktioniert).
- Im Remote-Modus öffnet die App einen SSH-Tunnel für den Gateway-Port und verbindet sich mit `localhost`.
