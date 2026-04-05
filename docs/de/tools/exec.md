---
read_when:
    - Verwenden oder Ändern des Exec-Tools
    - Debuggen von stdin- oder TTY-Verhalten
summary: Verwendung des Exec-Tools, stdin-Modi und TTY-Unterstützung
title: Exec-Tool
x-i18n:
    generated_at: "2026-04-05T12:57:47Z"
    model: gpt-5.4
    provider: openai
    source_hash: b73e9900c109910fc4e178c888b7ad7f3a4eeaa34eb44bc816abba9af5d664d7
    source_path: tools/exec.md
    workflow: 15
---

# Exec-Tool

Shell-Befehle im Workspace ausführen. Unterstützt Vordergrund- und Hintergrundausführung über `process`.
Wenn `process` nicht erlaubt ist, wird `exec` synchron ausgeführt und ignoriert `yieldMs`/`background`.
Hintergrundsitzungen sind pro Agent abgegrenzt; `process` sieht nur Sitzungen desselben Agenten.

## Parameter

- `command` (erforderlich)
- `workdir` (Standard ist cwd)
- `env` (Key/Value-Überschreibungen)
- `yieldMs` (Standard 10000): automatische Hintergrundausführung nach Verzögerung
- `background` (bool): sofort im Hintergrund ausführen
- `timeout` (Sekunden, Standard 1800): bei Ablauf beenden
- `pty` (bool): in einem Pseudo-Terminal ausführen, wenn verfügbar (CLI-Tools nur mit TTY, Coding-Agents, Terminal-UIs)
- `host` (`auto | sandbox | gateway | node`): wo ausgeführt werden soll
- `security` (`deny | allowlist | full`): Durchsetzungsmodus für `gateway`/`node`
- `ask` (`off | on-miss | always`): Genehmigungsaufforderungen für `gateway`/`node`
- `node` (string): Node-ID/-Name für `host=node`
- `elevated` (bool): erhöhten Modus anfordern (aus der Sandbox auf den konfigurierten Host-Pfad ausbrechen); `security=full` wird nur erzwungen, wenn `elevated` zu `full` aufgelöst wird

Hinweise:

- `host` verwendet standardmäßig `auto`: Sandbox, wenn für die Sitzung eine Sandbox-Runtime aktiv ist, andernfalls Gateway.
- `auto` ist die Standard-Routing-Strategie, kein Platzhalter. Pro Aufruf ist `host=node` von `auto` aus erlaubt; pro Aufruf ist `host=gateway` nur erlaubt, wenn keine Sandbox-Runtime aktiv ist.
- Ohne zusätzliche Konfiguration funktioniert `host=auto` weiterhin einfach: keine Sandbox bedeutet Auflösung zu `gateway`; eine aktive Sandbox bedeutet, dass es in der Sandbox bleibt.
- `elevated` bricht aus der Sandbox auf den konfigurierten Host-Pfad aus: standardmäßig `gateway` oder `node`, wenn `tools.exec.host=node` gesetzt ist (oder wenn der Sitzungsstandard `host=node` ist). Es ist nur verfügbar, wenn erhöhter Zugriff für die aktuelle Sitzung/den aktuellen Provider aktiviert ist.
- Genehmigungen für `gateway`/`node` werden durch `~/.openclaw/exec-approvals.json` gesteuert.
- `node` erfordert eine gekoppelte Node (Begleit-App oder headless Node Host).
- Wenn mehrere Nodes verfügbar sind, setzen Sie `exec.node` oder `tools.exec.node`, um eine auszuwählen.
- `exec host=node` ist der einzige Pfad zur Shell-Ausführung für Nodes; der alte Wrapper `nodes.run` wurde entfernt.
- Auf Nicht-Windows-Hosts verwendet exec `SHELL`, wenn gesetzt; wenn `SHELL` `fish` ist, wird `bash` (oder `sh`)
  aus `PATH` bevorzugt, um mit `fish` inkompatible Skripte zu vermeiden; falls keines von beiden vorhanden ist, wird auf `SHELL` zurückgegriffen.
- Auf Windows-Hosts bevorzugt exec die Erkennung von PowerShell 7 (`pwsh`) (Program Files, ProgramW6432, dann PATH),
  und fällt dann auf Windows PowerShell 5.1 zurück.
- Host-Ausführung (`gateway`/`node`) lehnt `env.PATH` und Loader-Überschreibungen (`LD_*`/`DYLD_*`) ab, um
  Binary-Hijacking oder eingeschleusten Code zu verhindern.
- OpenClaw setzt `OPENCLAW_SHELL=exec` in der Umgebung des gestarteten Befehls (einschließlich PTY- und Sandbox-Ausführung), damit Shell-/Profilregeln den Kontext des Exec-Tools erkennen können.
- Wichtig: Sandboxing ist standardmäßig **deaktiviert**. Wenn Sandboxing deaktiviert ist, wird implizites `host=auto`
  zu `gateway` aufgelöst. Explizites `host=sandbox` schlägt weiterhin geschlossen fehl, statt stillschweigend
  auf dem Gateway-Host auszuführen. Aktivieren Sie Sandboxing oder verwenden Sie `host=gateway` mit Genehmigungen.
- Vorabprüfungen für Skripte (für häufige Python-/Node-Shell-Syntaxfehler) untersuchen nur Dateien innerhalb der
  effektiven `workdir`-Grenze. Wenn ein Skriptpfad außerhalb von `workdir` aufgelöst wird, wird die Vorabprüfung für
  diese Datei übersprungen.
- Für lang laufende Arbeit, die jetzt startet, starten Sie sie einmal und verlassen sich auf das automatische
  Aufwecken nach Abschluss, wenn dies aktiviert ist und der Befehl Ausgabe erzeugt oder fehlschlägt.
  Verwenden Sie `process` für Logs, Status, Eingaben oder Eingriffe; emulieren Sie keine
  Terminplanung mit Schlafschleifen, Timeout-Schleifen oder wiederholtem Polling.
- Für Arbeit, die später oder nach Zeitplan stattfinden soll, verwenden Sie Cron statt
  `exec`-Sleep-/Delay-Mustern.

## Konfiguration

- `tools.exec.notifyOnExit` (Standard: true): Wenn true, reihen im Hintergrund ausgeführte Exec-Sitzungen beim Beenden ein Systemereignis ein und fordern einen Heartbeat an.
- `tools.exec.approvalRunningNoticeMs` (Standard: 10000): gibt genau einen „läuft“-Hinweis aus, wenn ein genehmigungsgesteuertes Exec länger als diesen Wert läuft (0 deaktiviert dies).
- `tools.exec.host` (Standard: `auto`; wird zu `sandbox` aufgelöst, wenn eine Sandbox-Runtime aktiv ist, andernfalls `gateway`)
- `tools.exec.security` (Standard: `deny` für Sandbox, `full` für Gateway + Node, wenn nicht gesetzt)
- `tools.exec.ask` (Standard: `off`)
- Host-Exec ohne Genehmigung ist der Standard für Gateway + Node. Wenn Sie Genehmigungen/Allowlist-Verhalten möchten, verschärfen Sie sowohl `tools.exec.*` als auch die Host-`~/.openclaw/exec-approvals.json`; siehe [Exec approvals](/tools/exec-approvals#no-approval-yolo-mode).
- YOLO kommt von den Standardwerten der Host-Richtlinie (`security=full`, `ask=off`), nicht von `host=auto`. Wenn Sie Gateway- oder Node-Routing erzwingen möchten, setzen Sie `tools.exec.host` oder verwenden Sie `/exec host=...`.
- `tools.exec.node` (Standard: nicht gesetzt)
- `tools.exec.strictInlineEval` (Standard: false): Wenn true, erfordern Inline-Eval-Formen von Interpretern wie `python -c`, `node -e`, `ruby -e`, `perl -e`, `php -r`, `lua -e` und `osascript -e` immer eine ausdrückliche Genehmigung. `allow-always` kann weiterhin harmlose Interpreter-/Skriptaufrufe dauerhaft speichern, aber Inline-Eval-Formen fragen dennoch jedes Mal nach.
- `tools.exec.pathPrepend`: Liste von Verzeichnissen, die für Exec-Läufe vor `PATH` gesetzt werden sollen (nur Gateway + Sandbox).
- `tools.exec.safeBins`: stdin-only sichere Binärdateien, die ohne explizite Allowlist-Einträge ausgeführt werden können. Details zum Verhalten finden Sie unter [Safe bins](/tools/exec-approvals#safe-bins-stdin-only).
- `tools.exec.safeBinTrustedDirs`: zusätzliche explizite Verzeichnisse, denen bei Pfadprüfungen für `safeBins` vertraut wird. `PATH`-Einträgen wird nie automatisch vertraut. Eingebaute Standardwerte sind `/bin` und `/usr/bin`.
- `tools.exec.safeBinProfiles`: optionale benutzerdefinierte argv-Richtlinie pro safe bin (`minPositional`, `maxPositional`, `allowedValueFlags`, `deniedFlags`).

Beispiel:

```json5
{
  tools: {
    exec: {
      pathPrepend: ["~/bin", "/opt/oss/bin"],
    },
  },
}
```

### Umgang mit PATH

- `host=gateway`: führt Ihren Login-Shell-`PATH` mit der Exec-Umgebung zusammen. Überschreibungen von `env.PATH` werden
  für die Host-Ausführung abgelehnt. Der Daemon selbst läuft weiterhin mit einem minimalen `PATH`:
  - macOS: `/opt/homebrew/bin`, `/usr/local/bin`, `/usr/bin`, `/bin`
  - Linux: `/usr/local/bin`, `/usr/bin`, `/bin`
- `host=sandbox`: führt `sh -lc` (Login-Shell) im Container aus, daher kann `/etc/profile` `PATH` zurücksetzen.
  OpenClaw setzt `env.PATH` nach dem Laden des Profils über eine interne Umgebungsvariable davor (keine Shell-Interpolation);
  `tools.exec.pathPrepend` gilt auch hier.
- `host=node`: Nur nicht blockierte Env-Überschreibungen, die Sie übergeben, werden an die Node gesendet. Überschreibungen von `env.PATH` werden
  für die Host-Ausführung abgelehnt und von Node Hosts ignoriert. Wenn Sie zusätzliche PATH-Einträge auf einer Node benötigen,
  konfigurieren Sie die Umgebung des Node-Host-Dienstes (systemd/launchd) oder installieren Sie Tools an Standardorten.

Node-Bindung pro Agent (verwenden Sie den Listenindex des Agenten in der Konfiguration):

```bash
openclaw config get agents.list
openclaw config set agents.list[0].tools.exec.node "node-id-or-name"
```

Control UI: Die Registerkarte Nodes enthält ein kleines Panel „Exec node binding“ für dieselben Einstellungen.

## Sitzungsüberschreibungen (`/exec`)

Verwenden Sie `/exec`, um **pro Sitzung** Standardwerte für `host`, `security`, `ask` und `node` festzulegen.
Senden Sie `/exec` ohne Argumente, um die aktuellen Werte anzuzeigen.

Beispiel:

```
/exec host=auto security=allowlist ask=on-miss node=mac-1
```

## Autorisierungsmodell

`/exec` wird nur für **autorisierte Absender** berücksichtigt (Kanal-Allowlists/Pairing plus `commands.useAccessGroups`).
Es aktualisiert **nur den Sitzungsstatus** und schreibt keine Konfiguration. Um exec hart zu deaktivieren, verbieten Sie es über die Tool-
Richtlinie (`tools.deny: ["exec"]` oder pro Agent). Host-Genehmigungen gelten weiterhin, sofern Sie nicht explizit
`security=full` und `ask=off` setzen.

## Exec approvals (Begleit-App / Node Host)

Agenten in einer Sandbox können eine Genehmigung pro Anfrage erfordern, bevor `exec` auf dem Gateway oder Node Host ausgeführt wird.
Siehe [Exec approvals](/tools/exec-approvals) für Richtlinie, Allowlist und UI-Ablauf.

Wenn Genehmigungen erforderlich sind, gibt das Exec-Tool sofort mit
`status: "approval-pending"` und einer Genehmigungs-ID zurück. Sobald genehmigt (oder abgelehnt / mit Timeout versehen),
sendet das Gateway Systemereignisse (`Exec finished` / `Exec denied`). Wenn der Befehl danach immer noch
länger als `tools.exec.approvalRunningNoticeMs` läuft, wird genau ein Hinweis `Exec running` ausgegeben.
Auf Kanälen mit nativen Genehmigungskarten/-Buttons sollte sich der Agent zuerst auf diese
native UI verlassen und nur dann einen manuellen Befehl `/approve` aufnehmen, wenn das
Tool-Ergebnis ausdrücklich sagt, dass Chat-Genehmigungen nicht verfügbar sind oder eine manuelle Genehmigung der
einzige Pfad ist.

## Allowlist + safe bins

Die manuelle Durchsetzung der Allowlist vergleicht **nur aufgelöste Binärpfade** (keine Vergleiche auf Basis von Basenamen). Wenn
`security=allowlist`, sind Shell-Befehle nur dann automatisch erlaubt, wenn jedes Pipeline-Segment in der
Allowlist ist oder ein safe bin. Verkettung (`;`, `&&`, `||`) und Umleitungen werden im
Allowlist-Modus abgelehnt, sofern nicht jedes Segment auf oberster Ebene die Allowlist erfüllt (einschließlich safe bins).
Umleitungen bleiben nicht unterstützt.
Dauerhaftes Vertrauen über `allow-always` umgeht diese Regel nicht: Ein verketteter Befehl erfordert weiterhin, dass jedes
Segment auf oberster Ebene übereinstimmt.

`autoAllowSkills` ist in Exec approvals ein separater Komfortpfad. Es ist nicht dasselbe wie
manuelle Allowlist-Einträge für Pfade. Für strenges explizites Vertrauen lassen Sie `autoAllowSkills` deaktiviert.

Verwenden Sie die beiden Steuerungen für unterschiedliche Aufgaben:

- `tools.exec.safeBins`: kleine, stdin-only Stream-Filter.
- `tools.exec.safeBinTrustedDirs`: explizite zusätzliche vertrauenswürdige Verzeichnisse für Pfade ausführbarer safe bins.
- `tools.exec.safeBinProfiles`: explizite argv-Richtlinie für benutzerdefinierte safe bins.
- Allowlist: explizites Vertrauen für Pfade ausführbarer Dateien.

Behandeln Sie `safeBins` nicht als generische Allowlist und fügen Sie keine Interpreter-/Runtime-Binärdateien hinzu (zum Beispiel `python3`, `node`, `ruby`, `bash`). Wenn Sie diese benötigen, verwenden Sie explizite Allowlist-Einträge und lassen Sie Genehmigungsaufforderungen aktiviert.
`openclaw security audit` warnt, wenn bei Interpreter-/Runtime-`safeBins`-Einträgen explizite Profile fehlen, und `openclaw doctor --fix` kann fehlende benutzerdefinierte `safeBinProfiles`-Einträge erstellen.
`openclaw security audit` und `openclaw doctor` warnen auch, wenn Sie Binärdateien mit breitem Verhalten wie `jq` explizit wieder zu `safeBins` hinzufügen.
Wenn Sie Interpreter explizit in die Allowlist aufnehmen, aktivieren Sie `tools.exec.strictInlineEval`, damit Inline-Code-Eval-Formen weiterhin eine neue Genehmigung erfordern.

Vollständige Richtliniendetails und Beispiele finden Sie unter [Exec approvals](/tools/exec-approvals#safe-bins-stdin-only) und [Safe bins versus allowlist](/tools/exec-approvals#safe-bins-versus-allowlist).

## Beispiele

Vordergrund:

```json
{ "tool": "exec", "command": "ls -la" }
```

Hintergrund + Polling:

```json
{"tool":"exec","command":"npm run build","yieldMs":1000}
{"tool":"process","action":"poll","sessionId":"<id>"}
```

Polling dient dem bedarfsgesteuerten Statusabruf, nicht Warteschleifen. Wenn das automatische Aufwecken nach Abschluss
aktiviert ist, kann der Befehl die Sitzung aufwecken, wenn er Ausgabe erzeugt oder fehlschlägt.

Tasten senden (tmux-Stil):

```json
{"tool":"process","action":"send-keys","sessionId":"<id>","keys":["Enter"]}
{"tool":"process","action":"send-keys","sessionId":"<id>","keys":["C-c"]}
{"tool":"process","action":"send-keys","sessionId":"<id>","keys":["Up","Up","Enter"]}
```

Senden (nur CR senden):

```json
{ "tool": "process", "action": "submit", "sessionId": "<id>" }
```

Einfügen (standardmäßig in Klammern):

```json
{ "tool": "process", "action": "paste", "sessionId": "<id>", "text": "line1\nline2\n" }
```

## apply_patch

`apply_patch` ist ein Subtool von `exec` für strukturierte Bearbeitungen mehrerer Dateien.
Es ist standardmäßig für OpenAI- und OpenAI-Codex-Modelle aktiviert. Verwenden Sie Konfiguration nur dann,
wenn Sie es deaktivieren oder auf bestimmte Modelle beschränken möchten:

```json5
{
  tools: {
    exec: {
      applyPatch: { workspaceOnly: true, allowModels: ["gpt-5.4"] },
    },
  },
}
```

Hinweise:

- Nur für OpenAI-/OpenAI-Codex-Modelle verfügbar.
- Die Tool-Richtlinie gilt weiterhin; `allow: ["write"]` erlaubt implizit `apply_patch`.
- Die Konfiguration befindet sich unter `tools.exec.applyPatch`.
- `tools.exec.applyPatch.enabled` ist standardmäßig `true`; setzen Sie es auf `false`, um das Tool für OpenAI-Modelle zu deaktivieren.
- `tools.exec.applyPatch.workspaceOnly` ist standardmäßig `true` (auf den Workspace begrenzt). Setzen Sie es nur dann auf `false`, wenn Sie absichtlich möchten, dass `apply_patch` außerhalb des Workspace-Verzeichnisses schreibt/löscht.

## Verwandt

- [Exec approvals](/tools/exec-approvals) — Genehmigungsschranken für Shell-Befehle
- [Sandboxing](/de/gateway/sandboxing) — Befehle in Sandbox-Umgebungen ausführen
- [Background Process](/de/gateway/background-process) — lang laufendes Exec und `process`-Tool
- [Sicherheit](/de/gateway/security) — Tool-Richtlinie und erhöhter Zugriff
