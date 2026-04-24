---
read_when:
    - Funktionen der macOS-App implementieren
    - Gateway-Lebenszyklus oder Node-Bridging auf macOS ändern
summary: OpenClaw-macOS-Begleit-App (Menüleiste + Gateway-Broker)
title: macOS-App
x-i18n:
    generated_at: "2026-04-24T06:48:39Z"
    model: gpt-5.4
    provider: openai
    source_hash: 6c7911d0a2e7be7fa437c5ef01a98c0f7da5e44388152ba182581cd2e381ba8b
    source_path: platforms/macos.md
    workflow: 15
---

Die macOS-App ist die **Menüleisten-Begleit-App** für OpenClaw. Sie verwaltet Berechtigungen,
steuert oder verbindet sich lokal mit dem Gateway (launchd oder manuell) und stellt dem Agenten
macOS-Fähigkeiten als Node bereit.

## Was sie tut

- Zeigt native Benachrichtigungen und Status in der Menüleiste an.
- Verwaltet TCC-Prompts (Benachrichtigungen, Bedienungshilfen, Bildschirmaufnahme, Mikrofon,
  Spracherkennung, Automation/AppleScript).
- Führt das Gateway aus oder verbindet sich damit (lokal oder remote).
- Stellt nur für macOS verfügbare Tools bereit (Canvas, Camera, Screen Recording, `system.run`).
- Startet den lokalen Node-Host-Dienst im **Remote**-Modus (launchd) und stoppt ihn im **Lokalen**-Modus.
- Kann optional **PeekabooBridge** für UI-Automatisierung hosten.
- Installiert auf Anforderung die globale CLI (`openclaw`) über npm, pnpm oder bun (die App bevorzugt npm, dann pnpm, dann bun; Node bleibt die empfohlene Gateway-Laufzeit).

## Lokaler vs. Remote-Modus

- **Lokal** (Standard): Die App verbindet sich mit einem laufenden lokalen Gateway, wenn eines vorhanden ist;
  andernfalls aktiviert sie den launchd-Dienst über `openclaw gateway install`.
- **Remote**: Die App verbindet sich über SSH/Tailscale mit einem Gateway und startet nie
  einen lokalen Prozess.
  Die App startet den lokalen **Node-Host-Dienst**, damit das Remote-Gateway diesen Mac erreichen kann.
  Die App startet das Gateway nicht als Child-Prozess.
  Gateway-Discovery bevorzugt jetzt Tailscale-MagicDNS-Namen gegenüber rohen Tailnet-IP-Adressen,
  sodass sich die Mac-App zuverlässiger erholt, wenn sich Tailnet-IPs ändern.

## Launchd-Steuerung

Die App verwaltet einen LaunchAgent pro Benutzer mit dem Label `ai.openclaw.gateway`
(oder `ai.openclaw.<profile>` bei Verwendung von `--profile`/`OPENCLAW_PROFILE`; Legacy-`com.openclaw.*` wird weiterhin entladen).

```bash
launchctl kickstart -k gui/$UID/ai.openclaw.gateway
launchctl bootout gui/$UID/ai.openclaw.gateway
```

Ersetzen Sie das Label durch `ai.openclaw.<profile>`, wenn Sie ein benanntes Profil verwenden.

Wenn der LaunchAgent nicht installiert ist, aktivieren Sie ihn aus der App oder führen Sie
`openclaw gateway install` aus.

## Node-Fähigkeiten (mac)

Die macOS-App präsentiert sich als Node. Häufige Befehle:

- Canvas: `canvas.present`, `canvas.navigate`, `canvas.eval`, `canvas.snapshot`, `canvas.a2ui.*`
- Kamera: `camera.snap`, `camera.clip`
- Bildschirm: `screen.snapshot`, `screen.record`
- System: `system.run`, `system.notify`

Die Node meldet eine Zuordnung `permissions`, damit Agenten entscheiden können, was erlaubt ist.

Node-Dienst + App-IPC:

- Wenn der headless Node-Host-Dienst läuft (Remote-Modus), verbindet er sich als Node mit dem Gateway-WS.
- `system.run` wird in der macOS-App (UI-/TCC-Kontext) über einen lokalen Unix-Socket ausgeführt; Prompts + Ausgabe bleiben in der App.

Diagramm (SCI):

```
Gateway -> Node Service (WS)
                 |  IPC (UDS + token + HMAC + TTL)
                 v
             Mac App (UI + TCC + system.run)
```

## Exec-Genehmigungen (`system.run`)

`system.run` wird durch **Exec-Genehmigungen** in der macOS-App gesteuert (Einstellungen → Exec approvals).
`security` + `ask` + `allowlist` werden lokal auf dem Mac gespeichert in:

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
- Roher Shell-Befehlstext, der Shell-Steuer- oder Expansionssyntax enthält (`&&`, `||`, `;`, `|`, `` ` ``, `$`, `<`, `>`, `(`, `)`), wird als Allowlist-Fehlschlag behandelt und erfordert explizite Genehmigung (oder das Allowlisten der Shell-Binärdatei).
- Die Auswahl „Always Allow“ im Prompt fügt diesen Befehl zur Allowlist hinzu.
- Umgebungsüberschreibungen für `system.run` werden gefiltert (`PATH`, `DYLD_*`, `LD_*`, `NODE_OPTIONS`, `PYTHON*`, `PERL*`, `RUBYOPT`, `SHELLOPTS`, `PS4` werden entfernt) und dann mit der Umgebung der App zusammengeführt.
- Für Shell-Wrapper (`bash|sh|zsh ... -c/-lc`) werden anfragebezogene Umgebungsüberschreibungen auf eine kleine explizite Allowlist reduziert (`TERM`, `LANG`, `LC_*`, `COLORTERM`, `NO_COLOR`, `FORCE_COLOR`).
- Bei Entscheidungen vom Typ „always allow“ im Allowlist-Modus bleiben für bekannte Dispatch-Wrapper (`env`, `nice`, `nohup`, `stdbuf`, `timeout`) innere ausführbare Pfade statt Wrapper-Pfade erhalten. Wenn das Entpacken nicht sicher ist, wird automatisch kein Allowlist-Eintrag gespeichert.

## Deep Links

Die App registriert das URL-Schema `openclaw://` für lokale Aktionen.

### `openclaw://agent`

Löst eine `agent`-Anfrage an das Gateway aus.
__OC_I18N_900004__
Query-Parameter:

- `message` (erforderlich)
- `sessionKey` (optional)
- `thinking` (optional)
- `deliver` / `to` / `channel` (optional)
- `timeoutSeconds` (optional)
- `key` (optional, Schlüssel für unattended mode)

Sicherheit:

- Ohne `key` fordert die App eine Bestätigung an.
- Ohne `key` erzwingt die App eine kurze Nachrichtenbegrenzung für den Bestätigungs-Prompt und ignoriert `deliver` / `to` / `channel`.
- Mit gültigem `key` läuft der Vorgang unbeaufsichtigt (gedacht für persönliche Automatisierungen).

## Typischer Onboarding-Ablauf

1. **OpenClaw.app** installieren und starten.
2. Die Berechtigungs-Checkliste abschließen (TCC-Prompts).
3. Sicherstellen, dass der **Lokale** Modus aktiv ist und das Gateway läuft.
4. Die CLI installieren, wenn Sie Zugriff über das Terminal möchten.

## Platzierung des Statusverzeichnisses (macOS)

Legen Sie das Statusverzeichnis von OpenClaw nicht in iCloud oder andere cloud-synchronisierte Ordner.
Synchronisierte Pfade können Latenz hinzufügen und gelegentlich Datei-Sperr-/Synchronisierungsrennen bei
Sitzungen und Anmeldedaten verursachen.

Bevorzugen Sie einen lokalen, nicht synchronisierten Statuspfad wie:
__OC_I18N_900005__
Wenn `openclaw doctor` Status unter folgenden Pfaden erkennt:

- `~/Library/Mobile Documents/com~apple~CloudDocs/...`
- `~/Library/CloudStorage/...`

gibt es eine Warnung aus und empfiehlt, wieder zu einem lokalen Pfad zurückzukehren.

## Build- und Dev-Workflow (nativ)

- `cd apps/macos && swift build`
- `swift run OpenClaw` (oder Xcode)
- App paketieren: `scripts/package-mac-app.sh`

## Gateway-Konnektivität debuggen (macOS CLI)

Verwenden Sie die Debug-CLI, um dieselbe Gateway-WebSocket-Handshake- und Discovery-
Logik auszuführen, die auch die macOS-App verwendet, ohne die App zu starten.
__OC_I18N_900006__
Optionen für Connect:

- `--url <ws://host:port>`: Konfiguration überschreiben
- `--mode <local|remote>`: aus der Konfiguration auflösen (Standard: Konfiguration oder local)
- `--probe`: eine frische Health-Probe erzwingen
- `--timeout <ms>`: Request-Timeout (Standard: `15000`)
- `--json`: strukturierte Ausgabe zum Vergleichen

Optionen für Discovery:

- `--include-local`: Gateways einbeziehen, die als „lokal“ herausgefiltert würden
- `--timeout <ms>`: gesamtes Discovery-Fenster (Standard: `2000`)
- `--json`: strukturierte Ausgabe zum Vergleichen

Tipp: Vergleichen Sie mit `openclaw gateway discover --json`, um zu sehen, ob sich die
Discovery-Pipeline der macOS-App (`local.` plus die konfigurierte Wide-Area-Domain, mit
Fallbacks für Wide-Area und Tailscale Serve) von der
`dns-sd`-basierten Discovery der Node-CLI unterscheidet.

## Plumbing für Remote-Verbindungen (SSH-Tunnel)

Wenn die macOS-App im **Remote**-Modus läuft, öffnet sie einen SSH-Tunnel, damit lokale UI-
Komponenten mit einem Remote-Gateway sprechen können, als wäre es auf localhost.

### Control-Tunnel (Gateway-WebSocket-Port)

- **Zweck:** Health-Checks, Status, Web Chat, Konfiguration und andere Aufrufe der Control Plane.
- **Lokaler Port:** der Gateway-Port (Standard `18789`), immer stabil.
- **Remote-Port:** derselbe Gateway-Port auf dem Remote-Host.
- **Verhalten:** kein zufälliger lokaler Port; die App verwendet einen bestehenden gesunden Tunnel wieder
  oder startet ihn bei Bedarf neu.
- **SSH-Form:** `ssh -N -L <local>:127.0.0.1:<remote>` mit BatchMode +
  ExitOnForwardFailure + Keepalive-Optionen.
- **IP-Berichterstattung:** Der SSH-Tunnel verwendet Loopback, daher sieht das Gateway die Node-
  IP als `127.0.0.1`. Verwenden Sie **Direct (ws/wss)** als Transport, wenn die echte Client-
  IP erscheinen soll (siehe [macOS remote access](/de/platforms/mac/remote)).

Einrichtungsschritte finden Sie unter [macOS remote access](/de/platforms/mac/remote). Details zum Protokoll
finden Sie unter [Gateway protocol](/de/gateway/protocol).

## Verwandte Dokumentation

- [Gateway runbook](/de/gateway)
- [Gateway (macOS)](/de/platforms/mac/bundled-gateway)
- [macOS permissions](/de/platforms/mac/permissions)
- [Canvas](/de/platforms/mac/canvas)
