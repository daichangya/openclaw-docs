---
read_when:
    - Sie möchten deterministische mehrstufige Workflows mit expliziten Genehmigungen
    - Sie müssen einen Workflow fortsetzen, ohne frühere Schritte erneut auszuführen
summary: Typisierte Workflow-Runtime für OpenClaw mit fortsetzbaren Genehmigungsstufen.
title: Lobster
x-i18n:
    generated_at: "2026-04-05T12:58:17Z"
    model: gpt-5.4
    provider: openai
    source_hash: 82718c15d571406ad6f1507de22a528fdab873edfc6aafae10742e500f6a5eda
    source_path: tools/lobster.md
    workflow: 15
---

# Lobster

Lobster ist eine Workflow-Shell, mit der OpenClaw mehrstufige Tool-Sequenzen als einen einzigen, deterministischen Vorgang mit expliziten Genehmigungs-Checkpoints ausführen kann.

Lobster ist eine Authoring-Schicht oberhalb entkoppelter Hintergrundarbeit. Für Flow-Orchestrierung oberhalb einzelner Aufgaben siehe [Task Flow](/de/automation/taskflow) (`openclaw tasks flow`). Für das Aktivitätsjournal von Aufgaben siehe [`openclaw tasks`](/de/automation/tasks).

## Hook

Ihr Assistent kann die Tools bauen, mit denen er sich selbst verwaltet. Fragen Sie nach einem Workflow, und 30 Minuten später haben Sie eine CLI plus Pipelines, die als ein Aufruf laufen. Lobster ist das fehlende Stück: deterministische Pipelines, explizite Genehmigungen und fortsetzbarer Status.

## Warum

Heute erfordern komplexe Workflows viele Tool-Aufrufe hin und her. Jeder Aufruf kostet Tokens, und das LLM muss jeden Schritt orchestrieren. Lobster verlagert diese Orchestrierung in eine typisierte Runtime:

- **Ein Aufruf statt vieler**: OpenClaw führt einen einzigen Lobster-Tool-Aufruf aus und erhält ein strukturiertes Ergebnis.
- **Genehmigungen eingebaut**: Seiteneffekte (E-Mail senden, Kommentar posten) halten den Workflow an, bis sie explizit genehmigt werden.
- **Fortsetzbar**: Angehaltene Workflows geben ein Token zurück; nach der Genehmigung können sie fortgesetzt werden, ohne alles erneut auszuführen.

## Warum eine DSL statt normaler Programme?

Lobster ist absichtlich klein. Das Ziel ist nicht „eine neue Sprache“, sondern eine vorhersehbare, KI-freundliche Pipeline-Spezifikation mit erstklassigen Genehmigungen und Resume-Tokens.

- **Approve/Resume ist eingebaut**: Ein normales Programm kann einen Menschen um Bestätigung bitten, aber es kann nicht mit einem dauerhaften Token _anhalten und fortsetzen_, ohne dass Sie diese Runtime selbst erfinden.
- **Determinismus + Auditierbarkeit**: Pipelines sind Daten und daher leicht zu protokollieren, zu diffen, wiederzugeben und zu prüfen.
- **Begrenzte Oberfläche für KI**: Eine kleine Grammatik + JSON-Piping reduziert „kreative“ Codepfade und macht Validierung realistisch.
- **Sicherheitsrichtlinie eingebrannt**: Timeouts, Output-Obergrenzen, Sandbox-Prüfungen und Allowlists werden von der Runtime erzwungen, nicht von jedem Skript.
- **Trotzdem programmierbar**: Jeder Schritt kann jede CLI oder jedes Skript aufrufen. Wenn Sie JS/TS möchten, generieren Sie `.lobster`-Dateien aus Code.

## Funktionsweise

OpenClaw startet die lokale `lobster`-CLI im **Tool-Modus** und parst eine JSON-Hülle aus stdout.
Wenn die Pipeline für eine Genehmigung pausiert, gibt das Tool ein `resumeToken` zurück, damit Sie später weitermachen können.

## Muster: kleine CLI + JSON-Pipes + Genehmigungen

Bauen Sie kleine Befehle, die JSON sprechen, und verketten Sie sie dann zu einem einzigen Lobster-Aufruf. (Die folgenden Befehlsnamen sind Beispiele — ersetzen Sie sie durch Ihre eigenen.)

```bash
inbox list --json
inbox categorize --json
inbox apply --json
```

```json
{
  "action": "run",
  "pipeline": "exec --json --shell 'inbox list --json' | exec --stdin json --shell 'inbox categorize --json' | exec --stdin json --shell 'inbox apply --json' | approve --preview-from-stdin --limit 5 --prompt 'Apply changes?'",
  "timeoutMs": 30000
}
```

Wenn die Pipeline eine Genehmigung anfordert, setzen Sie sie mit dem Token fort:

```json
{
  "action": "resume",
  "token": "<resumeToken>",
  "approve": true
}
```

Die KI löst den Workflow aus; Lobster führt die Schritte aus. Genehmigungsstufen halten Seiteneffekte explizit und auditierbar.

Beispiel: Eingabeelemente in Tool-Aufrufe abbilden:

```bash
gog.gmail.search --query 'newer_than:1d' \
  | openclaw.invoke --tool message --action send --each --item-key message --args-json '{"provider":"telegram","to":"..."}'
```

## Nur-JSON-LLM-Schritte (`llm-task`)

Für Workflows, die einen **strukturierten LLM-Schritt** benötigen, aktivieren Sie das optionale
Plugin-Tool `llm-task` und rufen Sie es aus Lobster auf. Dadurch bleibt der Workflow
deterministisch, während Sie weiterhin mit einem Model klassifizieren/zusammenfassen/entwerfen können.

Tool aktivieren:

```json
{
  "plugins": {
    "entries": {
      "llm-task": { "enabled": true }
    }
  },
  "agents": {
    "list": [
      {
        "id": "main",
        "tools": { "allow": ["llm-task"] }
      }
    ]
  }
}
```

In einer Pipeline verwenden:

```lobster
openclaw.invoke --tool llm-task --action json --args-json '{
  "prompt": "Given the input email, return intent and draft.",
  "thinking": "low",
  "input": { "subject": "Hello", "body": "Can you help?" },
  "schema": {
    "type": "object",
    "properties": {
      "intent": { "type": "string" },
      "draft": { "type": "string" }
    },
    "required": ["intent", "draft"],
    "additionalProperties": false
  }
}'
```

Details und Konfigurationsoptionen finden Sie unter [LLM Task](/tools/llm-task).

## Workflow-Dateien (.lobster)

Lobster kann YAML-/JSON-Workflow-Dateien mit den Feldern `name`, `args`, `steps`, `env`, `condition` und `approval` ausführen. In OpenClaw-Tool-Aufrufen setzen Sie `pipeline` auf den Dateipfad.

```yaml
name: inbox-triage
args:
  tag:
    default: "family"
steps:
  - id: collect
    command: inbox list --json
  - id: categorize
    command: inbox categorize --json
    stdin: $collect.stdout
  - id: approve
    command: inbox apply --approve
    stdin: $categorize.stdout
    approval: required
  - id: execute
    command: inbox apply --execute
    stdin: $categorize.stdout
    condition: $approve.approved
```

Hinweise:

- `stdin: $step.stdout` und `stdin: $step.json` übergeben die Ausgabe eines vorherigen Schritts.
- `condition` (oder `when`) kann Schritte anhand von `$step.approved` steuern.

## Lobster installieren

Installieren Sie die Lobster-CLI auf demselben Host, auf dem das OpenClaw-Gateway läuft (siehe das [Lobster-Repo](https://github.com/openclaw/lobster)), und stellen Sie sicher, dass `lobster` auf `PATH` liegt.

## Tool aktivieren

Lobster ist ein **optionales** Plugin-Tool (standardmäßig nicht aktiviert).

Empfohlen (additiv, sicher):

```json
{
  "tools": {
    "alsoAllow": ["lobster"]
  }
}
```

Oder pro Agent:

```json
{
  "agents": {
    "list": [
      {
        "id": "main",
        "tools": {
          "alsoAllow": ["lobster"]
        }
      }
    ]
  }
}
```

Vermeiden Sie `tools.allow: ["lobster"]`, es sei denn, Sie möchten im restriktiven Allowlist-Modus laufen.

Hinweis: Allowlists sind für optionale Plugins Opt-in. Wenn Ihre Allowlist nur
Plugin-Tools benennt (wie `lobster`), lässt OpenClaw Core-Tools aktiviert. Um Core-
Tools einzuschränken, nehmen Sie die gewünschten Core-Tools oder -Gruppen ebenfalls in die Allowlist auf.

## Beispiel: E-Mail-Triage

Ohne Lobster:

```
User: "Check my email and draft replies"
→ openclaw calls gmail.list
→ LLM summarizes
→ User: "draft replies to #2 and #5"
→ LLM drafts
→ User: "send #2"
→ openclaw calls gmail.send
(repeat daily, no memory of what was triaged)
```

Mit Lobster:

```json
{
  "action": "run",
  "pipeline": "email.triage --limit 20",
  "timeoutMs": 30000
}
```

Gibt eine JSON-Hülle zurück (gekürzt):

```json
{
  "ok": true,
  "status": "needs_approval",
  "output": [{ "summary": "5 need replies, 2 need action" }],
  "requiresApproval": {
    "type": "approval_request",
    "prompt": "Send 2 draft replies?",
    "items": [],
    "resumeToken": "..."
  }
}
```

Benutzer genehmigt → fortsetzen:

```json
{
  "action": "resume",
  "token": "<resumeToken>",
  "approve": true
}
```

Ein Workflow. Deterministisch. Sicher.

## Tool-Parameter

### `run`

Eine Pipeline im Tool-Modus ausführen.

```json
{
  "action": "run",
  "pipeline": "gog.gmail.search --query 'newer_than:1d' | email.triage",
  "cwd": "workspace",
  "timeoutMs": 30000,
  "maxStdoutBytes": 512000
}
```

Eine Workflow-Datei mit Argumenten ausführen:

```json
{
  "action": "run",
  "pipeline": "/path/to/inbox-triage.lobster",
  "argsJson": "{\"tag\":\"family\"}"
}
```

### `resume`

Einen angehaltenen Workflow nach einer Genehmigung fortsetzen.

```json
{
  "action": "resume",
  "token": "<resumeToken>",
  "approve": true
}
```

### Optionale Eingaben

- `cwd`: Relatives Arbeitsverzeichnis für die Pipeline (muss innerhalb des aktuellen Arbeitsverzeichnisses des Prozesses bleiben).
- `timeoutMs`: Unterprozess beenden, wenn diese Dauer überschritten wird (Standard: 20000).
- `maxStdoutBytes`: Unterprozess beenden, wenn stdout diese Größe überschreitet (Standard: 512000).
- `argsJson`: JSON-String, der an `lobster run --args-json` übergeben wird (nur für Workflow-Dateien).

## Ausgabehülle

Lobster gibt eine JSON-Hülle mit einem von drei Statuswerten zurück:

- `ok` → erfolgreich abgeschlossen
- `needs_approval` → pausiert; `requiresApproval.resumeToken` ist zum Fortsetzen erforderlich
- `cancelled` → explizit abgelehnt oder abgebrochen

Das Tool gibt die Hülle sowohl in `content` (hübsch formatiertes JSON) als auch in `details` (rohes Objekt) aus.

## Genehmigungen

Wenn `requiresApproval` vorhanden ist, prüfen Sie den Prompt und entscheiden Sie:

- `approve: true` → fortsetzen und mit Seiteneffekten weitermachen
- `approve: false` → abbrechen und den Workflow abschließen

Verwenden Sie `approve --preview-from-stdin --limit N`, um Genehmigungsanfragen eine JSON-Vorschau anzuhängen, ohne benutzerdefinierten `jq`-/Heredoc-Kleber. Resume-Tokens sind jetzt kompakt: Lobster speichert den Fortsetzungsstatus des Workflows in seinem Zustandsverzeichnis und gibt einen kleinen Token-Schlüssel zurück.

## OpenProse

OpenProse funktioniert gut mit Lobster: Verwenden Sie `/prose`, um mehragentige Vorbereitung zu orchestrieren, und führen Sie dann eine Lobster-Pipeline für deterministische Genehmigungen aus. Wenn ein Prose-Programm Lobster benötigt, erlauben Sie das Tool `lobster` für Subagenten über `tools.subagents.tools`. Siehe [OpenProse](/prose).

## Sicherheit

- **Nur lokaler Unterprozess** — keine Netzwerkaufrufe vom Plugin selbst.
- **Keine Geheimnisse** — Lobster verwaltet kein OAuth; es ruft OpenClaw-Tools auf, die dies tun.
- **Sandbox-bewusst** — deaktiviert, wenn der Tool-Kontext sandboxed ist.
- **Gehärtet** — fester Name der ausführbaren Datei (`lobster`) auf `PATH`; Timeouts und Output-Obergrenzen werden erzwungen.

## Fehlerbehebung

- **`lobster subprocess timed out`** → `timeoutMs` erhöhen oder eine lange Pipeline aufteilen.
- **`lobster output exceeded maxStdoutBytes`** → `maxStdoutBytes` erhöhen oder die Ausgabemenge reduzieren.
- **`lobster returned invalid JSON`** → sicherstellen, dass die Pipeline im Tool-Modus läuft und nur JSON ausgibt.
- **`lobster failed (code …)`** → dieselbe Pipeline in einem Terminal ausführen, um stderr zu prüfen.

## Mehr erfahren

- [Plugins](/tools/plugin)
- [Plugin-Tool-Authoring](/plugins/building-plugins#registering-agent-tools)

## Fallstudie: Community-Workflows

Ein öffentliches Beispiel: eine „Second Brain“-CLI plus Lobster-Pipelines, die drei Markdown-Tresore verwalten (persönlich, Partner, gemeinsam). Die CLI gibt JSON für Statistiken, Inbox-Listen und Stale-Scans aus; Lobster verkettet diese Befehle zu Workflows wie `weekly-review`, `inbox-triage`, `memory-consolidation` und `shared-task-sync`, jeweils mit Genehmigungsstufen. KI übernimmt Beurteilungen (Kategorisierung), wenn verfügbar, und fällt andernfalls auf deterministische Regeln zurück.

- Thread: [https://x.com/plattenschieber/status/2014508656335770033](https://x.com/plattenschieber/status/2014508656335770033)
- Repo: [https://github.com/bloomedai/brain-cli](https://github.com/bloomedai/brain-cli)

## Verwandt

- [Automation & Tasks](/de/automation) — Lobster-Workflows planen
- [Automation Overview](/de/automation) — alle Automatisierungsmechanismen
- [Tools Overview](/tools) — alle verfügbaren Agent-Tools
