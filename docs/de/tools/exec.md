---
read_when:
    - Das Exec-Tool verwenden oder ändern
    - stdin- oder TTY-Verhalten debuggen
summary: Verwendung des Exec-Tools, stdin-Modi und TTY-Unterstützung
title: Exec-Tool
x-i18n:
    generated_at: "2026-04-24T07:03:06Z"
    model: gpt-5.4
    provider: openai
    source_hash: 4cad17fecfaf7d6a523282ef4f0090e4ffaab89ab53945b5cd831e426f3fc3ac
    source_path: tools/exec.md
    workflow: 15
---

Shell-Befehle im Workspace ausführen. Unterstützt Vordergrund- und Hintergrundausführung über `process`.
Wenn `process` nicht erlaubt ist, läuft `exec` synchron und ignoriert `yieldMs`/`background`.
Hintergrundsitzungen sind pro Agent begrenzt; `process` sieht nur Sitzungen desselben Agenten.

## Parameter

<ParamField path="command" type="string" required>
Auszuführender Shell-Befehl.
</ParamField>

<ParamField path="workdir" type="string" default="cwd">
Arbeitsverzeichnis für den Befehl.
</ParamField>

<ParamField path="env" type="object">
Schlüssel/Wert-Überschreibungen für Umgebungsvariablen, die über die geerbte Umgebung gelegt werden.
</ParamField>

<ParamField path="yieldMs" type="number" default="10000">
Befehl nach dieser Verzögerung (ms) automatisch in den Hintergrund verschieben.
</ParamField>

<ParamField path="background" type="boolean" default="false">
Befehl sofort in den Hintergrund verschieben, statt auf `yieldMs` zu warten.
</ParamField>

<ParamField path="timeout" type="number" default="1800">
Befehl nach so vielen Sekunden beenden.
</ParamField>

<ParamField path="pty" type="boolean" default="false">
In einem Pseudo-Terminal ausführen, wenn verfügbar. Für CLIs, Coding-Agenten und Terminal-UIs, die ein TTY benötigen.
</ParamField>

<ParamField path="host" type="'auto' | 'sandbox' | 'gateway' | 'node'" default="auto">
Wo ausgeführt werden soll. `auto` wird zu `sandbox`, wenn eine Sandbox-Laufzeit aktiv ist, andernfalls zu `gateway`.
</ParamField>

<ParamField path="security" type="'deny' | 'allowlist' | 'full'">
Durchsetzungsmodus für Ausführung auf `gateway` / `node`.
</ParamField>

<ParamField path="ask" type="'off' | 'on-miss' | 'always'">
Verhalten des Genehmigungs-Prompts für Ausführung auf `gateway` / `node`.
</ParamField>

<ParamField path="node" type="string">
Node-ID/-Name, wenn `host=node`.
</ParamField>

<ParamField path="elevated" type="boolean" default="false">
Erhöhten Modus anfordern — aus der Sandbox auf den konfigurierten Host-Pfad ausbrechen. `security=full` wird nur dann erzwungen, wenn `elevated` zu `full` aufgelöst wird.
</ParamField>

Hinweise:

- `host` hat standardmäßig den Wert `auto`: Sandbox, wenn für die Sitzung eine Sandbox-Laufzeit aktiv ist, sonst Gateway.
- `auto` ist die Standard-Routing-Strategie, kein Wildcard. `host=node` pro Aufruf ist von `auto` aus erlaubt; `host=gateway` pro Aufruf ist nur erlaubt, wenn keine Sandbox-Laufzeit aktiv ist.
- Ohne zusätzliche Konfiguration funktioniert `host=auto` weiterhin „einfach so“: keine Sandbox bedeutet Auflösung zu `gateway`; eine aktive Sandbox bedeutet, dass es in der Sandbox bleibt.
- `elevated` bricht aus der Sandbox auf den konfigurierten Host-Pfad aus: standardmäßig `gateway` oder `node`, wenn `tools.exec.host=node` (oder der Sitzungsstandard `host=node` ist). Es ist nur verfügbar, wenn erhöhter Zugriff für die aktuelle Sitzung/den aktuellen Provider aktiviert ist.
- Genehmigungen für `gateway`/`node` werden über `~/.openclaw/exec-approvals.json` gesteuert.
- `node` erfordert eine gepairte Node (Begleit-App oder headless Node-Host).
- Wenn mehrere Nodes verfügbar sind, setzen Sie `exec.node` oder `tools.exec.node`, um eine auszuwählen.
- `exec host=node` ist der einzige Shell-Ausführungspfad für Nodes; der Legacy-Wrapper `nodes.run` wurde entfernt.
- Auf Nicht-Windows-Hosts verwendet exec `SHELL`, wenn es gesetzt ist; wenn `SHELL` `fish` ist, bevorzugt es `bash` (oder `sh`)
  aus `PATH`, um mit fish inkompatible Skripte zu vermeiden, und fällt dann auf `SHELL` zurück, wenn keines von beiden existiert.
- Auf Windows-Hosts bevorzugt exec die Erkennung von PowerShell 7 (`pwsh`) (Program Files, ProgramW6432, dann PATH)
  und fällt dann auf Windows PowerShell 5.1 zurück.
- Host-Ausführung (`gateway`/`node`) lehnt `env.PATH` und Loader-Überschreibungen (`LD_*`/`DYLD_*`) ab, um
  Binary-Hijacking oder injizierten Code zu verhindern.
- OpenClaw setzt `OPENCLAW_SHELL=exec` in der Umgebung des gestarteten Befehls (einschließlich PTY- und Sandbox-Ausführung), damit Shell-/Profilregeln den Kontext des Exec-Tools erkennen können.
- Wichtig: Sandboxing ist standardmäßig **deaktiviert**. Wenn Sandboxing deaktiviert ist, wird implizites `host=auto`
  zu `gateway` aufgelöst. Explizites `host=sandbox` schlägt weiterhin geschlossen fehl, statt stillschweigend
  auf dem Gateway-Host zu laufen. Aktivieren Sie Sandboxing oder verwenden Sie `host=gateway` mit Genehmigungen.
- Vorabprüfungen von Skripten (für typische Shell-Syntaxfehler in Python/Node) prüfen nur Dateien innerhalb
  der effektiven `workdir`-Grenze. Wenn ein Skriptpfad außerhalb von `workdir` aufgelöst wird, wird die Vorabprüfung für
  diese Datei übersprungen.
- Für lang laufende Arbeit, die jetzt startet, starten Sie sie einmal und verlassen Sie sich auf das automatische
  Completion-Wake, wenn es aktiviert ist und der Befehl Ausgabe erzeugt oder fehlschlägt.
  Verwenden Sie `process` für Logs, Status, Eingaben oder Eingriffe; simulieren Sie
  keine Planung mit Sleep-Schleifen, Timeout-Schleifen oder wiederholtem Polling.
- Für Arbeit, die später oder nach Zeitplan ausgeführt werden soll, verwenden Sie Cron statt
  Sleep-/Delay-Muster mit `exec`.

## Konfiguration

- `tools.exec.notifyOnExit` (Standard: true): Wenn true, reihen Hintergrund-Exec-Sitzungen beim Beenden ein Systemereignis ein und fordern einen Heartbeat an.
- `tools.exec.approvalRunningNoticeMs` (Standard: 10000): Gibt eine einzelne „running“-Benachrichtigung aus, wenn ein genehmigungspflichtiger Exec länger als dieser Wert läuft (0 deaktiviert).
- `tools.exec.host` (Standard: `auto`; wird zu `sandbox`, wenn eine Sandbox-Laufzeit aktiv ist, andernfalls zu `gateway`)
- `tools.exec.security` (Standard: `deny` für Sandbox, `full` für Gateway + Node, wenn nicht gesetzt)
- `tools.exec.ask` (Standard: `off`)
- Host-Exec ohne Genehmigung ist der Standard für Gateway + Node. Wenn Sie Genehmigungen/Allowlist-Verhalten möchten, verschärfen Sie sowohl `tools.exec.*` als auch die hostseitige `~/.openclaw/exec-approvals.json`; siehe [Exec approvals](/de/tools/exec-approvals#no-approval-yolo-mode).
- YOLO kommt von den Host-Policy-Standards (`security=full`, `ask=off`), nicht von `host=auto`. Wenn Sie Routing zu Gateway oder Node erzwingen möchten, setzen Sie `tools.exec.host` oder verwenden Sie `/exec host=...`.
- Im Modus `security=full` plus `ask=off` folgt Host-Exec direkt der konfigurierten Richtlinie; es gibt keine zusätzliche heuristische Vorfilterung auf Befehls-Verschleierung oder Ablehnung durch Skript-Preflight.
- `tools.exec.node` (Standard: nicht gesetzt)
- `tools.exec.strictInlineEval` (Standard: false): Wenn true, erfordern Inline-Interpreter-Eval-Formen wie `python -c`, `node -e`, `ruby -e`, `perl -e`, `php -r`, `lua -e` und `osascript -e` immer eine explizite Genehmigung. `allow-always` kann weiterhin harmlose Aufrufe von Interpreter/Skript dauerhaft speichern, aber Inline-Eval-Formen lösen weiterhin jedes Mal einen Prompt aus.
- `tools.exec.pathPrepend`: Liste von Verzeichnissen, die für Exec-Läufe vor `PATH` gestellt werden (nur Gateway + Sandbox).
- `tools.exec.safeBins`: stdin-only sichere Binärdateien, die ohne explizite Allowlist-Einträge ausgeführt werden können. Details zum Verhalten finden Sie unter [Safe bins](/de/tools/exec-approvals-advanced#safe-bins-stdin-only).
- `tools.exec.safeBinTrustedDirs`: zusätzliche explizite Verzeichnisse, denen bei Pfadprüfungen für `safeBins` vertraut wird. `PATH`-Einträge werden nie automatisch als vertrauenswürdig behandelt. Integrierte Standardwerte sind `/bin` und `/usr/bin`.
- `tools.exec.safeBinProfiles`: optionale benutzerdefinierte argv-Richtlinie pro sicherer Binärdatei (`minPositional`, `maxPositional`, `allowedValueFlags`, `deniedFlags`).

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

- `host=gateway`: führt das `PATH` Ihrer Login-Shell in die Exec-Umgebung zusammen. Überschreibungen von
  `env.PATH` werden für Host-Ausführung abgelehnt. Der Daemon selbst läuft weiterhin mit einem minimalen `PATH`:
  - macOS: `/opt/homebrew/bin`, `/usr/local/bin`, `/usr/bin`, `/bin`
  - Linux: `/usr/local/bin`, `/usr/bin`, `/bin`
- `host=sandbox`: führt `sh -lc` (Login-Shell) im Container aus, daher kann `/etc/profile` `PATH` zurücksetzen.
  OpenClaw setzt `env.PATH` nach dem Sourcing des Profils über eine interne Umgebungsvariable voran (keine Shell-Interpolation);
  `tools.exec.pathPrepend` gilt hier ebenfalls.
- `host=node`: Nur nicht blockierte Env-Überschreibungen, die Sie übergeben, werden an die Node gesendet. Überschreibungen von
  `env.PATH` werden für Host-Ausführung abgelehnt und von Node-Hosts ignoriert. Wenn Sie zusätzliche PATH-Einträge auf einer Node benötigen,
  konfigurieren Sie die Dienstumgebung des Node-Hosts (systemd/launchd) oder installieren Sie Tools an Standardorten.

Per-Agent-Bindung an eine Node (verwenden Sie den Index des Agenten in der Konfiguration):

```bash
openclaw config get agents.list
openclaw config set agents.list[0].tools.exec.node "node-id-or-name"
```

Control UI: Der Tab Nodes enthält ein kleines Panel „Exec node binding“ für dieselben Einstellungen.

## Sitzungsüberschreibungen (`/exec`)

Verwenden Sie `/exec`, um **pro Sitzung** Standardwerte für `host`, `security`, `ask` und `node` zu setzen.
Senden Sie `/exec` ohne Argumente, um die aktuellen Werte anzuzeigen.

Beispiel:

```
/exec host=auto security=allowlist ask=on-miss node=mac-1
```

## Autorisierungsmodell

`/exec` wird nur für **autorisierte Absender** berücksichtigt (Kanal-Allowlists/Pairing plus `commands.useAccessGroups`).
Es aktualisiert **nur den Sitzungsstatus** und schreibt keine Konfiguration. Um Exec hart zu deaktivieren, verweigern Sie es über die Tool-
Richtlinie (`tools.deny: ["exec"]` oder pro Agent). Host-Genehmigungen gelten weiterhin, sofern Sie nicht explizit `security=full` und `ask=off` setzen.

## Exec-Genehmigungen (Begleit-App / Node-Host)

Sandboxed Agents können Genehmigungen pro Anfrage verlangen, bevor `exec` auf dem Gateway oder Node-Host ausgeführt wird.
Siehe [Exec approvals](/de/tools/exec-approvals) für Richtlinie, Allowlist und UI-Ablauf.

Wenn Genehmigungen erforderlich sind, gibt das Exec-Tool sofort
`status: "approval-pending"` und eine Genehmigungs-ID zurück. Sobald genehmigt (oder abgelehnt / timeout),
gibt das Gateway Systemereignisse aus (`Exec finished` / `Exec denied`). Wenn der Befehl nach
`tools.exec.approvalRunningNoticeMs` noch läuft, wird eine einzelne `Exec running`-Benachrichtigung ausgegeben.
Auf Kanälen mit nativen Genehmigungskarten/-Buttons soll sich der Agent zuerst auf diese
native UI verlassen und einen manuellen `/approve`-Befehl nur dann einschließen, wenn das Tool-
Ergebnis ausdrücklich sagt, dass Chat-Genehmigungen nicht verfügbar sind oder eine manuelle Genehmigung der
einzige Weg ist.

## Allowlist + Safe Bins

Die Durchsetzung manueller Allowlists gleicht **nur aufgelöste Binärpfade** ab (keine Abgleiche nach Basenamen). Wenn
`security=allowlist`, werden Shell-Befehle nur dann automatisch erlaubt, wenn jedes Pipeline-Segment
auf der Allowlist steht oder eine sichere Binärdatei ist. Verkettung (`;`, `&&`, `||`) und Umleitungen werden im
Allowlist-Modus abgelehnt, es sei denn, jedes Top-Level-Segment erfüllt die Allowlist (einschließlich Safe Bins).
Umleitungen bleiben nicht unterstützt.
Dauerhaftes Vertrauen durch `allow-always` umgeht diese Regel nicht: Ein verketteter Befehl erfordert weiterhin, dass jedes
Top-Level-Segment passt.

`autoAllowSkills` ist ein separater Komfortpfad in Exec-Genehmigungen. Es ist nicht dasselbe wie
manuelle Pfad-Allowlist-Einträge. Für striktes explizites Vertrauen lassen Sie `autoAllowSkills` deaktiviert.

Verwenden Sie die beiden Steuerungen für unterschiedliche Aufgaben:

- `tools.exec.safeBins`: kleine, stdin-only Stream-Filter.
- `tools.exec.safeBinTrustedDirs`: explizite zusätzliche vertrauenswürdige Verzeichnisse für Pfade ausführbarer Safe Bins.
- `tools.exec.safeBinProfiles`: explizite argv-Richtlinie für benutzerdefinierte Safe Bins.
- Allowlist: explizites Vertrauen für ausführbare Pfade.

Behandeln Sie `safeBins` nicht als generische Allowlist und fügen Sie keine Interpreter-/Laufzeit-Binärdateien hinzu (zum Beispiel `python3`, `node`, `ruby`, `bash`). Wenn Sie diese benötigen, verwenden Sie explizite Allowlist-Einträge und lassen Sie Genehmigungs-Prompts aktiviert.
`openclaw security audit` warnt, wenn Interpreter-/Laufzeit-`safeBins`-Einträgen explizite Profile fehlen, und `openclaw doctor --fix` kann fehlende benutzerdefinierte `safeBinProfiles`-Einträge erzeugen.
`openclaw security audit` und `openclaw doctor` warnen außerdem, wenn Sie explizit Binärdateien mit breitem Verhalten wie `jq` wieder zu `safeBins` hinzufügen.
Wenn Sie Interpreter explizit allowlisten, aktivieren Sie `tools.exec.strictInlineEval`, damit Formen mit Inline-Code-Eval weiterhin bei jeder Nutzung eine neue Genehmigung erfordern.

Vollständige Richtliniendetails und Beispiele finden Sie unter [Exec approvals](/de/tools/exec-approvals-advanced#safe-bins-stdin-only) und [Safe bins versus allowlist](/de/tools/exec-approvals-advanced#safe-bins-versus-allowlist).

## Beispiele

Vordergrund:

```json
{ "tool": "exec", "command": "ls -la" }
```

Hintergrund + Poll:

```json
{"tool":"exec","command":"npm run build","yieldMs":1000}
{"tool":"process","action":"poll","sessionId":"<id>"}
```

Polling ist für Status auf Abruf gedacht, nicht für Warteschleifen. Wenn automatisches Completion-Wake
aktiviert ist, kann der Befehl die Sitzung wecken, sobald er Ausgabe erzeugt oder fehlschlägt.

Tasten senden (im Stil von tmux):

```json
{"tool":"process","action":"send-keys","sessionId":"<id>","keys":["Enter"]}
{"tool":"process","action":"send-keys","sessionId":"<id>","keys":["C-c"]}
{"tool":"process","action":"send-keys","sessionId":"<id>","keys":["Up","Up","Enter"]}
```

Absenden (nur CR senden):

```json
{ "tool": "process", "action": "submit", "sessionId": "<id>" }
```

Einfügen (standardmäßig mit Bracketed Paste):

```json
{ "tool": "process", "action": "paste", "sessionId": "<id>", "text": "line1\nline2\n" }
```

## apply_patch

`apply_patch` ist ein Untertool von `exec` für strukturierte Bearbeitungen über mehrere Dateien hinweg.
Es ist standardmäßig für OpenAI- und OpenAI-Codex-Modelle aktiviert. Verwenden Sie Konfiguration nur,
wenn Sie es deaktivieren oder auf bestimmte Modelle beschränken möchten:

```json5
{
  tools: {
    exec: {
      applyPatch: { workspaceOnly: true, allowModels: ["gpt-5.5"] },
    },
  },
}
```

Hinweise:

- Nur für OpenAI-/OpenAI-Codex-Modelle verfügbar.
- Tool-Richtlinien gelten weiterhin; `allow: ["write"]` erlaubt implizit auch `apply_patch`.
- Die Konfiguration befindet sich unter `tools.exec.applyPatch`.
- `tools.exec.applyPatch.enabled` hat standardmäßig den Wert `true`; setzen Sie es auf `false`, um das Tool für OpenAI-Modelle zu deaktivieren.
- `tools.exec.applyPatch.workspaceOnly` hat standardmäßig den Wert `true` (auf den Workspace begrenzt). Setzen Sie es nur dann auf `false`, wenn Sie absichtlich möchten, dass `apply_patch` außerhalb des Workspace-Verzeichnisses schreibt/löscht.

## Verwandt

- [Exec Approvals](/de/tools/exec-approvals) — Genehmigungs-Gates für Shell-Befehle
- [Sandboxing](/de/gateway/sandboxing) — Befehle in Sandbox-Umgebungen ausführen
- [Background Process](/de/gateway/background-process) — lang laufendes Exec und Process-Tool
- [Security](/de/gateway/security) — Tool-Richtlinie und erhöhter Zugriff
