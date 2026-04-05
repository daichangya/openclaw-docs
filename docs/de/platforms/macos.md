---
read_when:
    - Implementieren von Funktionen für die macOS-App
    - Ändern des Gateway-Lebenszyklus oder des Node-Bridging unter macOS
summary: OpenClaw macOS-Begleit-App (Menüleiste + Gateway-Broker)
title: macOS-App
x-i18n:
    generated_at: "2026-04-05T12:50:21Z"
    model: gpt-5.4
    provider: openai
    source_hash: bfac937e352ede495f60af47edf3b8e5caa5b692ba0ea01d9fb0de9a44bbc135
    source_path: platforms/macos.md
    workflow: 15
---

# OpenClaw macOS-Begleiter (Menüleiste + Gateway-Broker)

Die macOS-App ist der **Menüleisten-Begleiter** für OpenClaw. Sie verwaltet Berechtigungen,
verwaltet/stellt lokal eine Verbindung zum Gateway her (launchd oder manuell) und stellt macOS-
Funktionen dem Agenten als Node zur Verfügung.

## Was sie macht

- Zeigt native Benachrichtigungen und Status in der Menüleiste an.
- Verwaltet TCC-Aufforderungen (Benachrichtigungen, Bedienungshilfen, Bildschirmaufnahme, Mikrofon,
  Speech Recognition, Automation/AppleScript).
- Führt das Gateway aus oder verbindet sich damit (lokal oder remote).
- Stellt nur unter macOS verfügbare Tools bereit (Canvas, Kamera, Bildschirmaufnahme, `system.run`).
- Startet den lokalen Node-Host-Service im **Remote**-Modus (launchd) und stoppt ihn im **Local**-Modus.
- Hostet optional **PeekabooBridge** für UI-Automatisierung.
- Installiert auf Anfrage die globale CLI (`openclaw`) über npm, pnpm oder bun (die App bevorzugt npm, dann pnpm, dann bun; Node bleibt die empfohlene Gateway-Laufzeitumgebung).

## Local- vs. Remote-Modus

- **Local** (Standard): Die App stellt eine Verbindung zu einem laufenden lokalen Gateway her, falls vorhanden;
  andernfalls aktiviert sie den launchd-Service über `openclaw gateway install`.
- **Remote**: Die App verbindet sich über SSH/Tailscale mit einem Gateway und startet niemals
  einen lokalen Prozess.
  Die App startet den lokalen **Node-Host-Service**, damit das Remote-Gateway diesen Mac erreichen kann.
  Die App startet das Gateway nicht als Child-Prozess.
  Bei der Gateway-Erkennung werden jetzt Tailscale MagicDNS-Namen gegenüber rohen Tailnet-IP-Adressen bevorzugt,
  sodass sich die Mac-App zuverlässiger erholt, wenn sich Tailnet-IP-Adressen ändern.

## Launchd-Steuerung

Die App verwaltet einen LaunchAgent pro Benutzer mit der Bezeichnung `ai.openclaw.gateway`
(oder `ai.openclaw.<profile>` bei Verwendung von `--profile`/`OPENCLAW_PROFILE`; das alte `com.openclaw.*` wird weiterhin entladen).

```bash
launchctl kickstart -k gui/$UID/ai.openclaw.gateway
launchctl bootout gui/$UID/ai.openclaw.gateway
```

Ersetzen Sie die Bezeichnung durch `ai.openclaw.<profile>`, wenn Sie ein benanntes Profil ausführen.

Wenn der LaunchAgent nicht installiert ist, aktivieren Sie ihn in der App oder führen Sie
`openclaw gateway install` aus.

## Node-Funktionen (mac)

Die macOS-App stellt sich selbst als Node dar. Häufige Befehle:

- Canvas: `canvas.present`, `canvas.navigate`, `canvas.eval`, `canvas.snapshot`, `canvas.a2ui.*`
- Kamera: `camera.snap`, `camera.clip`
- Bildschirm: `screen.record`
- System: `system.run`, `system.notify`

Die Node meldet eine `permissions`-Zuordnung, damit Agenten entscheiden können, was erlaubt ist.

Node-Service + App-IPC:

- Wenn der Headless-Node-Host-Service läuft (Remote-Modus), verbindet er sich über Gateway-WS als Node.
- `system.run` wird in der macOS-App (UI-/TCC-Kontext) über einen lokalen Unix-Socket ausgeführt; Aufforderungen und Ausgabe bleiben in der App.

Diagramm (SCI):

```
Gateway -> Node Service (WS)
                 |  IPC (UDS + token + HMAC + TTL)
                 v
             Mac App (UI + TCC + system.run)
```

## Exec approvals (`system.run`)

`system.run` wird in der macOS-App durch **Exec approvals** gesteuert (Einstellungen → Exec approvals).
Sicherheit + Nachfrage + Allowlist werden lokal auf dem Mac gespeichert in:

```
~/.openclaw/exec-approvals.json
```

Beispiel:

```json
{
  "version": 1,
  "defaults": {
    "security": "deny",
    "ask": "on-miss"
  },
  "agents": {
    "main": {
      "security": "allowlist",
      "ask": "on-miss",
      "allowlist": [{ "pattern": "/opt/homebrew/bin/rg" }]
    }
  }
}
```

Hinweise:

- `allowlist`-Einträge sind Glob-Muster für aufgelöste Binärpfade.
- Roher Shell-Befehlstext, der Shell-Steuer- oder Erweiterungssyntax enthält (`&&`, `||`, `;`, `|`, `` ` ``, `$`, `<`, `>`, `(`, `)`), wird als Nichttreffer in der Allowlist behandelt und erfordert eine ausdrückliche Genehmigung (oder die Aufnahme der Shell-Binärdatei in die Allowlist).
- Die Auswahl von „Always Allow“ in der Aufforderung fügt diesen Befehl der Allowlist hinzu.
- Umgebungsüberschreibungen für `system.run` werden gefiltert (`PATH`, `DYLD_*`, `LD_*`, `NODE_OPTIONS`, `PYTHON*`, `PERL*`, `RUBYOPT`, `SHELLOPTS`, `PS4` werden entfernt) und dann mit der Umgebung der App zusammengeführt.
- Für Shell-Wrapper (`bash|sh|zsh ... -c/-lc`) werden anfragebezogene Umgebungsüberschreibungen auf eine kleine explizite Allowlist reduziert (`TERM`, `LANG`, `LC_*`, `COLORTERM`, `NO_COLOR`, `FORCE_COLOR`).
- Bei Immer-erlauben-Entscheidungen im Allowlist-Modus speichern bekannte Dispatch-Wrapper (`env`, `nice`, `nohup`, `stdbuf`, `timeout`) innere ausführbare Pfade statt Wrapper-Pfade. Wenn das Entpacken nicht sicher ist, wird kein Allowlist-Eintrag automatisch gespeichert.

## Deep Links

Die App registriert das URL-Schema `openclaw://` für lokale Aktionen.

### `openclaw://agent`

Löst eine Gateway-`agent`-Anfrage aus.
__OC_I18N_900004__
Abfrageparameter:

- `message` (erforderlich)
- `sessionKey` (optional)
- `thinking` (optional)
- `deliver` / `to` / `channel` (optional)
- `timeoutSeconds` (optional)
- `key` (optional unbeaufsichtigter Modus-Schlüssel)

Sicherheit:

- Ohne `key` fordert die App eine Bestätigung an.
- Ohne `key` erzwingt die App ein kurzes Nachrichtenlimit für die Bestätigungsaufforderung und ignoriert `deliver` / `to` / `channel`.
- Mit einem gültigen `key` läuft die Ausführung unbeaufsichtigt (gedacht für persönliche Automatisierungen).

## Onboarding-Ablauf (typisch)

1. Installieren und starten Sie **OpenClaw.app**.
2. Schließen Sie die Berechtigungs-Checkliste ab (TCC-Aufforderungen).
3. Stellen Sie sicher, dass der **Local**-Modus aktiv ist und das Gateway läuft.
4. Installieren Sie die CLI, wenn Sie Terminalzugriff möchten.

## Platzierung des Statusverzeichnisses (macOS)

Vermeiden Sie es, Ihr OpenClaw-Statusverzeichnis in iCloud oder anderen cloud-synchronisierten Ordnern abzulegen.
Synchronisierte Pfade können Latenz hinzufügen und gelegentlich Dateisperr-/Synchronisierungs-Rennen für
Sitzungen und Anmeldedaten verursachen.

Bevorzugen Sie einen lokalen, nicht synchronisierten Statuspfad wie:
__OC_I18N_900005__
Wenn `openclaw doctor` einen Statuspfad unter folgenden Verzeichnissen erkennt:

- `~/Library/Mobile Documents/com~apple~CloudDocs/...`
- `~/Library/CloudStorage/...`

wird eine Warnung angezeigt und empfohlen, wieder zu einem lokalen Pfad zurückzukehren.

## Build- und Entwicklungsablauf (nativ)

- `cd apps/macos && swift build`
- `swift run OpenClaw` (oder Xcode)
- App paketieren: `scripts/package-mac-app.sh`

## Gateway-Konnektivität debuggen (macOS-CLI)

Verwenden Sie die Debug-CLI, um denselben Gateway-WebSocket-Handshake und dieselbe Erkennungslogik zu testen,
die auch die macOS-App verwendet, ohne die App zu starten.
__OC_I18N_900006__
Verbindungsoptionen:

- `--url <ws://host:port>`: Konfiguration überschreiben
- `--mode <local|remote>`: aus der Konfiguration auflösen (Standard: Konfiguration oder local)
- `--probe`: einen neuen Health-Check erzwingen
- `--timeout <ms>`: Anfrage-Timeout (Standard: `15000`)
- `--json`: strukturierte Ausgabe zum Vergleichen

Erkennungsoptionen:

- `--include-local`: Gateways einschließen, die als „lokal“ herausgefiltert würden
- `--timeout <ms>`: Gesamtzeitfenster für die Erkennung (Standard: `2000`)
- `--json`: strukturierte Ausgabe zum Vergleichen

Tipp: Vergleichen Sie mit `openclaw gateway discover --json`, um festzustellen, ob sich die
Erkennungspipeline der macOS-App (`local.` plus die konfigurierte Wide-Area-Domain, mit
Wide-Area- und Tailscale-Serve-Fallbacks) von
der `dns-sd`-basierten Erkennung der Node-CLI unterscheidet.

## Remote-Verbindungsverkabelung (SSH-Tunnel)

Wenn die macOS-App im **Remote**-Modus läuft, öffnet sie einen SSH-Tunnel, damit lokale UI-
Komponenten mit einem Remote-Gateway kommunizieren können, als wäre es auf localhost.

### Kontrolltunnel (Gateway-WebSocket-Port)

- **Zweck:** Health-Checks, Status, Web Chat, Konfiguration und andere Control-Plane-Aufrufe.
- **Lokaler Port:** der Gateway-Port (Standard `18789`), immer stabil.
- **Remote-Port:** derselbe Gateway-Port auf dem Remote-Host.
- **Verhalten:** kein zufälliger lokaler Port; die App verwendet einen vorhandenen gesunden Tunnel wieder
  oder startet ihn bei Bedarf neu.
- **SSH-Form:** `ssh -N -L <local>:127.0.0.1:<remote>` mit BatchMode +
  ExitOnForwardFailure + Keepalive-Optionen.
- **IP-Berichterstattung:** Der SSH-Tunnel verwendet Loopback, daher sieht das Gateway die Node-
  IP als `127.0.0.1`. Verwenden Sie den Transport **Direct (ws/wss)**, wenn die echte Client-
  IP angezeigt werden soll (siehe [macOS-Remotezugriff](/platforms/mac/remote)).

Einrichtungsschritte finden Sie unter [macOS-Remotezugriff](/platforms/mac/remote). Protokoll-
details finden Sie unter [Gateway-Protokoll](/de/gateway/protocol).

## Zugehörige Dokumentation

- [Gateway-Runbook](/de/gateway)
- [Gateway (macOS)](/de/platforms/mac/bundled-gateway)
- [macOS-Berechtigungen](/platforms/mac/permissions)
- [Canvas](/de/platforms/mac/canvas)
