---
read_when:
    - Sie möchten deterministische mehrstufige Workflows mit expliziten Genehmigungen
    - Sie müssen einen Workflow fortsetzen, ohne frühere Schritte erneut auszuführen
summary: Typisierte Workflow-Runtime für OpenClaw mit fortsetzbaren Genehmigungs-Gates.
title: Hummer
x-i18n:
    generated_at: "2026-04-24T07:03:55Z"
    model: gpt-5.4
    provider: openai
    source_hash: ce1dbd73cc90091d02862af183a2f8658d6cbe6623c100baf7992b5e18041edb
    source_path: tools/lobster.md
    workflow: 15
---

Lobster ist eine Workflow-Shell, mit der OpenClaw mehrstufige Tool-Sequenzen als eine einzelne, deterministische Operation mit expliziten Genehmigungs-Checkpoints ausführen kann.

Lobster ist eine Authoring-Schicht über losgelöster Hintergrundarbeit. Für Flow-Orchestrierung oberhalb einzelner Aufgaben siehe [TaskFlow](/de/automation/taskflow) (`openclaw tasks flow`). Für das Aktivitätsledger von Aufgaben siehe [`openclaw tasks`](/de/automation/tasks).

## Hook

Ihr Assistent kann die Tools bauen, die ihn selbst verwalten. Fragen Sie nach einem Workflow, und 30 Minuten später haben Sie eine CLI plus Pipelines, die als ein Aufruf laufen. Lobster ist das fehlende Stück: deterministische Pipelines, explizite Genehmigungen und fortsetzbarer Zustand.

## Warum

Heute erfordern komplexe Workflows viele Tool-Aufrufe mit Hin und Her. Jeder Aufruf kostet Tokens, und das LLM muss jeden Schritt orchestrieren. Lobster verlagert diese Orchestrierung in eine typisierte Runtime:

- **Ein Aufruf statt vieler**: OpenClaw führt einen Lobster-Tool-Aufruf aus und erhält ein strukturiertes Ergebnis.
- **Genehmigungen eingebaut**: Seiteneffekte (E-Mail senden, Kommentar posten) halten den Workflow an, bis sie explizit genehmigt werden.
- **Fortsetzbar**: Angehaltene Workflows geben ein Token zurück; genehmigen und fortsetzen, ohne alles erneut auszuführen.

## Warum eine DSL statt normaler Programme?

Lobster ist absichtlich klein gehalten. Das Ziel ist nicht „eine neue Sprache“, sondern eine vorhersagbare, AI-freundliche Pipeline-Spezifikation mit Genehmigungen erster Klasse und Resume-Tokens.

- **Approve/Resume ist eingebaut**: Ein normales Programm kann einen Menschen auffordern, aber es kann nicht _mit einem dauerhaften Token pausieren und fortsetzen_, ohne dass Sie diese Runtime selbst erfinden.
- **Determinismus + Auditierbarkeit**: Pipelines sind Daten, deshalb lassen sie sich leicht loggen, diffen, wiederholen und prüfen.
- **Begrenzte Oberfläche für AI**: Eine winzige Grammatik + JSON-Piping reduziert „kreative“ Codepfade und macht Validierung realistisch.
- **Sicherheitsrichtlinie eingebrannt**: Timeouts, Ausgabegrenzen, Sandbox-Prüfungen und Allowlists werden von der Runtime erzwungen, nicht von jedem Skript.
- **Trotzdem programmierbar**: Jeder Schritt kann jede CLI oder jedes Skript aufrufen. Wenn Sie JS/TS wollen, generieren Sie `.lobster`-Dateien aus Code.

## Wie es funktioniert

OpenClaw führt Lobster-Workflows **in-process** mit einem eingebetteten Runner aus. Es wird kein externer CLI-Subprozess gestartet; die Workflow-Engine läuft innerhalb des Gateway-Prozesses und gibt direkt ein JSON-Envelop zurück.
Wenn die Pipeline für eine Genehmigung pausiert, gibt das Tool ein `resumeToken` zurück, damit Sie später fortfahren können.

## Muster: kleine CLI + JSON-Pipes + Genehmigungen

Bauen Sie kleine Befehle, die JSON sprechen, und verketten Sie sie dann in einem einzelnen Lobster-Aufruf. (Die folgenden Befehlsnamen sind nur Beispiele — ersetzen Sie sie durch Ihre eigenen.)

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

AI löst den Workflow aus; Lobster führt die Schritte aus. Approval-Gates halten Seiteneffekte explizit und auditierbar.

Beispiel: Eingabeelemente in Tool-Aufrufe abbilden:

```bash
gog.gmail.search --query 'newer_than:1d' \
  | openclaw.invoke --tool message --action send --each --item-key message --args-json '{"provider":"telegram","to":"..."}'
```

## Nur-JSON-LLM-Schritte (`llm-task`)

Für Workflows, die einen **strukturierten LLM-Schritt** benötigen, aktivieren Sie das optionale
Plugin-Tool `llm-task` und rufen es aus Lobster heraus auf. So bleibt der Workflow
deterministisch und erlaubt trotzdem Klassifizierung/Zusammenfassung/Entwürfe mit einem Modell.

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

Siehe [LLM Task](/de/tools/llm-task) für Details und Konfigurationsoptionen.

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

- `stdin: $step.stdout` und `stdin: $step.json` übergeben die Ausgabe eines früheren Schritts.
- `condition` (oder `when`) kann Schritte anhand von `$step.approved` gate’n.

## Lobster installieren

Gebündelte Lobster-Workflows laufen in-process; keine separate `lobster`-Binärdatei ist erforderlich. Der eingebettete Runner wird mit dem Lobster-Plugin ausgeliefert.

Wenn Sie die eigenständige Lobster-CLI für Entwicklung oder externe Pipelines benötigen, installieren Sie sie aus dem [Lobster-Repo](https://github.com/openclaw/lobster) und stellen Sie sicher, dass `lobster` auf `PATH` liegt.

## Das Tool aktivieren

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

Hinweis: Allowlists sind Opt-in für optionale Plugins. Wenn Ihre Allowlist nur
Plugin-Tools nennt (wie `lobster`), lässt OpenClaw Core-Tools aktiviert. Um Core-
Tools einzuschränken, nehmen Sie auch die gewünschten Core-Tools oder -Gruppen in die Allowlist auf.

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

Gibt ein JSON-Envelop zurück (gekürzt):

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

- `cwd`: Relatives Arbeitsverzeichnis für die Pipeline (muss innerhalb des Gateway-Arbeitsverzeichnisses bleiben).
- `timeoutMs`: Workflow abbrechen, wenn er diese Dauer überschreitet (Standard: 20000).
- `maxStdoutBytes`: Workflow abbrechen, wenn die Ausgabe diese Größe überschreitet (Standard: 512000).
- `argsJson`: JSON-String, der an `lobster run --args-json` übergeben wird (nur Workflow-Dateien).

## Ausgabe-Envelop

Lobster gibt ein JSON-Envelop mit einem von drei Statuswerten zurück:

- `ok` → erfolgreich abgeschlossen
- `needs_approval` → pausiert; `requiresApproval.resumeToken` wird zum Fortsetzen benötigt
- `cancelled` → explizit abgelehnt oder abgebrochen

Das Tool stellt das Envelop sowohl in `content` (schön formatiertes JSON) als auch in `details` (rohes Objekt) bereit.

## Genehmigungen

Wenn `requiresApproval` vorhanden ist, prüfen Sie den Prompt und entscheiden Sie:

- `approve: true` → fortsetzen und mit Seiteneffekten weitermachen
- `approve: false` → den Workflow abbrechen und abschließen

Verwenden Sie `approve --preview-from-stdin --limit N`, um Genehmigungsanfragen eine JSON-Vorschau anzuhängen, ohne benutzerdefinierten jq-/heredoc-Kleber. Resume-Tokens sind jetzt kompakt: Lobster speichert den Resume-Zustand des Workflows in seinem Zustandsverzeichnis und gibt einen kleinen Token-Schlüssel zurück.

## OpenProse

OpenProse passt gut zu Lobster: Verwenden Sie `/prose`, um die Vorbereitung mit mehreren Agenten zu orchestrieren, und führen Sie dann eine Lobster-Pipeline für deterministische Genehmigungen aus. Wenn ein Prose-Programm Lobster benötigt, erlauben Sie das Tool `lobster` für Sub-Agenten über `tools.subagents.tools`. Siehe [OpenProse](/de/prose).

## Sicherheit

- **Nur lokal in-process** — Workflows werden innerhalb des Gateway-Prozesses ausgeführt; das Plugin selbst macht keine Netzwerkaufrufe.
- **Keine Secrets** — Lobster verwaltet kein OAuth; es ruft OpenClaw-Tools auf, die das tun.
- **Sandbox-aware** — deaktiviert, wenn der Tool-Kontext sandboxed ist.
- **Gehärtet** — Timeouts und Ausgabegrenzen werden vom eingebetteten Runner erzwungen.

## Fehlerbehebung

- **`lobster timed out`** → `timeoutMs` erhöhen oder eine lange Pipeline aufteilen.
- **`lobster output exceeded maxStdoutBytes`** → `maxStdoutBytes` erhöhen oder die Ausgabegröße reduzieren.
- **`lobster returned invalid JSON`** → sicherstellen, dass die Pipeline im Tool-Modus läuft und nur JSON ausgibt.
- **`lobster failed`** → Gateway-Logs auf Fehlerdetails des eingebetteten Runners prüfen.

## Mehr erfahren

- [Plugins](/de/tools/plugin)
- [Plugin-Tool-Authoring](/de/plugins/building-plugins#registering-agent-tools)

## Fallstudie: Community-Workflows

Ein öffentliches Beispiel: eine „Second-Brain“-CLI + Lobster-Pipelines, die drei Markdown-Vaults verwalten (persönlich, Partner, gemeinsam). Die CLI gibt JSON für Statistiken, Inbox-Listen und Scans nach veralteten Inhalten aus; Lobster verkettet diese Befehle zu Workflows wie `weekly-review`, `inbox-triage`, `memory-consolidation` und `shared-task-sync`, jeweils mit Approval-Gates. AI übernimmt Urteilsaufgaben (Kategorisierung), wenn verfügbar, und fällt andernfalls auf deterministische Regeln zurück.

- Thread: [https://x.com/plattenschieber/status/2014508656335770033](https://x.com/plattenschieber/status/2014508656335770033)
- Repo: [https://github.com/bloomedai/brain-cli](https://github.com/bloomedai/brain-cli)

## Verwandt

- [Automatisierung & Aufgaben](/de/automation) — Lobster-Workflows planen
- [Automatisierungsüberblick](/de/automation) — alle Automatisierungsmechanismen
- [Tools-Überblick](/de/tools) — alle verfügbaren Agent-Tools
