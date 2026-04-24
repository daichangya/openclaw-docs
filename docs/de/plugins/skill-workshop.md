---
read_when:
    - Sie möchten, dass Agenten Korrekturen oder wiederverwendbare Verfahren in Workspace-Skills umwandeln
    - Sie konfigurieren prozedurales Skill-Memory
    - Sie debuggen das Verhalten des Tools skill_workshop
    - Sie entscheiden, ob die automatische Skill-Erstellung aktiviert werden soll
summary: Experimentelle Erfassung wiederverwendbarer Verfahren als Workspace-Skills mit Review, Genehmigung, Quarantäne und Hot-Skill-Aktualisierung
title: Skill-Workshop-Plugin
x-i18n:
    generated_at: "2026-04-24T06:52:16Z"
    model: gpt-5.4
    provider: openai
    source_hash: e6063843bf15e639d7f5943db1bab52fbffce6ec30af350221d8b3cd711e227b
    source_path: plugins/skill-workshop.md
    workflow: 15
---

Skill Workshop ist **experimentell**. Es ist standardmäßig deaktiviert, seine Erfassungs-
Heuristiken und Reviewer-Prompts können sich zwischen Releases ändern, und automatische
Schreibvorgänge sollten nur in vertrauenswürdigen Workspaces verwendet werden, nachdem zuerst die Ausgabe im Pending-Modus geprüft wurde.

Skill Workshop ist prozedurales Memory für Workspace-Skills. Es ermöglicht einem Agenten,
wiederverwendbare Workflows, Benutzerkorrekturen, hart erarbeitete Fixes und wiederkehrende Stolperfallen in `SKILL.md`-Dateien unter folgendem Pfad umzuwandeln:

```text
<workspace>/skills/<skill-name>/SKILL.md
```

Das unterscheidet sich von Langzeit-Memory:

- **Memory** speichert Fakten, Präferenzen, Entitäten und vergangenen Kontext.
- **Skills** speichern wiederverwendbare Verfahren, denen der Agent bei zukünftigen Aufgaben folgen soll.
- **Skill Workshop** ist die Brücke von einem nützlichen Turn zu einem dauerhaften Workspace-
  Skill, mit Sicherheitsprüfungen und optionaler Genehmigung.

Skill Workshop ist nützlich, wenn der Agent ein Verfahren lernt, etwa:

- wie extern bezogene animierte GIF-Assets validiert werden
- wie Screenshot-Assets ersetzt und Abmessungen verifiziert werden
- wie ein repositoryspezifisches QA-Szenario ausgeführt wird
- wie ein wiederkehrender Provider-Fehler debuggt wird
- wie eine veraltete lokale Workflow-Notiz repariert wird

Es ist nicht gedacht für:

- Fakten wie „der Benutzer mag Blau“
- breites autobiografisches Memory
- Archivierung roher Transkripte
- Secrets, Credentials oder verborgenen Prompt-Text
- einmalige Anweisungen, die sich nicht wiederholen

## Standardzustand

Das gebündelte Plugin ist **experimentell** und **standardmäßig deaktiviert**, es sei denn, es wird
explizit in `plugins.entries.skill-workshop` aktiviert.

Das Plugin-Manifest setzt nicht `enabledByDefault: true`. Der Standardwert `enabled: true`
innerhalb des Plugin-Konfigurationsschemas gilt nur, nachdem der Plugin-Eintrag bereits ausgewählt und geladen wurde.

Experimentell bedeutet:

- Das Plugin wird ausreichend unterstützt für Opt-in-Tests und Dogfooding
- Vorschlagsspeicherung, Reviewer-Schwellenwerte und Erfassungsheuristiken können sich weiterentwickeln
- Ausstehende Genehmigung ist der empfohlene Startmodus
- automatisches Anwenden ist für vertrauenswürdige persönliche/Workspace-Setups gedacht, nicht für gemeinsam genutzte oder feindselige Umgebungen mit vielen Eingaben

## Aktivieren

Minimale sichere Konfiguration:

```json5
{
  plugins: {
    entries: {
      "skill-workshop": {
        enabled: true,
        config: {
          autoCapture: true,
          approvalPolicy: "pending",
          reviewMode: "hybrid",
        },
      },
    },
  },
}
```

Mit dieser Konfiguration:

- das Tool `skill_workshop` ist verfügbar
- explizite wiederverwendbare Korrekturen werden als ausstehende Vorschläge in die Warteschlange gestellt
- schwellenwertbasierte Reviewer-Durchläufe können Skill-Updates vorschlagen
- keine Skill-Datei wird geschrieben, bis ein ausstehender Vorschlag angewendet wird

Verwenden Sie automatische Schreibvorgänge nur in vertrauenswürdigen Workspaces:

```json5
{
  plugins: {
    entries: {
      "skill-workshop": {
        enabled: true,
        config: {
          autoCapture: true,
          approvalPolicy: "auto",
          reviewMode: "hybrid",
        },
      },
    },
  },
}
```

`approvalPolicy: "auto"` verwendet weiterhin denselben Scanner- und Quarantänepfad. Es
wendet Vorschläge mit kritischen Befunden nicht an.

## Konfiguration

| Key                  | Default     | Bereich / Werte                            | Bedeutung                                                            |
| -------------------- | ----------- | ------------------------------------------ | -------------------------------------------------------------------- |
| `enabled`            | `true`      | boolean                                    | Aktiviert das Plugin, nachdem der Plugin-Eintrag geladen wurde.      |
| `autoCapture`        | `true`      | boolean                                    | Aktiviert Erfassung/Review nach einem erfolgreichen Agent-Turn.       |
| `approvalPolicy`     | `"pending"` | `"pending"`, `"auto"`                      | Vorschläge in die Warteschlange stellen oder sichere Vorschläge automatisch schreiben. |
| `reviewMode`         | `"hybrid"`  | `"off"`, `"heuristic"`, `"llm"`, `"hybrid"` | Wählt explizite Korrekturerfassung, LLM-Reviewer, beides oder keines. |
| `reviewInterval`     | `15`        | `1..200`                                   | Reviewer nach so vielen erfolgreichen Turns ausführen.               |
| `reviewMinToolCalls` | `8`         | `1..500`                                   | Reviewer nach so vielen beobachteten Tool-Aufrufen ausführen.        |
| `reviewTimeoutMs`    | `45000`     | `5000..180000`                             | Timeout für den eingebetteten Reviewer-Lauf.                         |
| `maxPending`         | `50`        | `1..200`                                   | Maximale Anzahl ausstehender/quarantänierter Vorschläge pro Workspace. |
| `maxSkillBytes`      | `40000`     | `1024..200000`                             | Maximale Größe generierter Skill-/Support-Dateien.                   |

Empfohlene Profile:

```json5
// Konservativ: nur explizite Tool-Nutzung, keine automatische Erfassung.
{
  autoCapture: false,
  approvalPolicy: "pending",
  reviewMode: "off",
}
```

```json5
// Review zuerst: automatisch erfassen, aber Genehmigung verlangen.
{
  autoCapture: true,
  approvalPolicy: "pending",
  reviewMode: "hybrid",
}
```

```json5
// Vertrauenswürdige Automatisierung: sichere Vorschläge sofort schreiben.
{
  autoCapture: true,
  approvalPolicy: "auto",
  reviewMode: "hybrid",
}
```

```json5
// Kostengünstig: kein Reviewer-LLM-Aufruf, nur explizite Korrekturformulierungen.
{
  autoCapture: true,
  approvalPolicy: "pending",
  reviewMode: "heuristic",
}
```

## Erfassungspfade

Skill Workshop hat drei Erfassungspfade.

### Tool-Vorschläge

Das Modell kann `skill_workshop` direkt aufrufen, wenn es ein wiederverwendbares Verfahren erkennt
oder wenn der Benutzer es auffordert, einen Skill zu speichern/zu aktualisieren.

Dies ist der expliziteste Pfad und funktioniert auch mit `autoCapture: false`.

### Heuristische Erfassung

Wenn `autoCapture` aktiviert ist und `reviewMode` `heuristic` oder `hybrid` ist, scannt das
Plugin erfolgreiche Turns auf explizite Formulierungen von Benutzerkorrekturen:

- `next time`
- `from now on`
- `remember to`
- `make sure to`
- `always ... use/check/verify/record/save/prefer`
- `prefer ... when/for/instead/use`
- `when asked`

Die Heuristik erstellt aus der letzten passenden Benutzeranweisung einen Vorschlag. Sie
verwendet Themenhinweise, um Skill-Namen für häufige Workflows auszuwählen:

- Aufgaben zu animierten GIFs -> `animated-gif-workflow`
- Aufgaben zu Screenshots oder Assets -> `screenshot-asset-workflow`
- QA- oder Szenarioaufgaben -> `qa-scenario-workflow`
- GitHub-PR-Aufgaben -> `github-pr-workflow`
- Fallback -> `learned-workflows`

Die heuristische Erfassung ist absichtlich eng gefasst. Sie ist für klare Korrekturen und
wiederholbare Prozessnotizen gedacht, nicht für allgemeine Zusammenfassung von Transkripten.

### LLM-Reviewer

Wenn `autoCapture` aktiviert ist und `reviewMode` `llm` oder `hybrid` ist, führt das Plugin
einen kompakten eingebetteten Reviewer aus, sobald Schwellenwerte erreicht werden.

Der Reviewer erhält:

- den jüngsten Transkripttext, begrenzt auf die letzten 12.000 Zeichen
- bis zu 12 bestehende Workspace-Skills
- bis zu 2.000 Zeichen aus jedem bestehenden Skill
- reine JSON-Anweisungen

Der Reviewer hat keine Tools:

- `disableTools: true`
- `toolsAllow: []`
- `disableMessageTool: true`

Der Reviewer gibt entweder `{ "action": "none" }` oder einen Vorschlag zurück. Das Feld `action` ist `create`, `append` oder `replace` — bevorzugen Sie `append`/`replace`, wenn bereits ein relevanter Skill existiert; verwenden Sie `create` nur dann, wenn kein bestehender Skill passt.

Beispiel für `create`:

```json
{
  "action": "create",
  "skillName": "media-asset-qa",
  "title": "Media Asset QA",
  "reason": "Reusable animated media acceptance workflow",
  "description": "Validate externally sourced animated media before product use.",
  "body": "## Workflow\n\n- Verify true animation.\n- Record attribution.\n- Store a local approved copy.\n- Verify in product UI before final reply."
}
```

`append` fügt `section` + `body` hinzu. `replace` tauscht `oldText` gegen `newText` im benannten Skill aus.

## Lebenszyklus von Vorschlägen

Jedes generierte Update wird zu einem Vorschlag mit:

- `id`
- `createdAt`
- `updatedAt`
- `workspaceDir`
- optional `agentId`
- optional `sessionId`
- `skillName`
- `title`
- `reason`
- `source`: `tool`, `agent_end` oder `reviewer`
- `status`
- `change`
- optional `scanFindings`
- optional `quarantineReason`

Status von Vorschlägen:

- `pending` - wartet auf Genehmigung
- `applied` - geschrieben nach `<workspace>/skills`
- `rejected` - vom Operator/Modell abgelehnt
- `quarantined` - durch kritische Scanner-Befunde blockiert

Der Zustand wird pro Workspace unter dem Gateway-State-Verzeichnis gespeichert:

```text
<stateDir>/skill-workshop/<workspace-hash>.json
```

Ausstehende und quarantänisierte Vorschläge werden nach Skill-Name und Change-
Payload dedupliziert. Der Store behält die neuesten ausstehenden/quarantänisierten Vorschläge bis
`maxPending`.

## Tool-Referenz

Das Plugin registriert ein Agent-Tool:

```text
skill_workshop
```

### `status`

Zählt Vorschläge nach Status für den aktiven Workspace.

```json
{ "action": "status" }
```

Ergebnisform:

```json
{
  "workspaceDir": "/path/to/workspace",
  "pending": 1,
  "quarantined": 0,
  "applied": 3,
  "rejected": 0
}
```

### `list_pending`

Listet ausstehende Vorschläge auf.

```json
{ "action": "list_pending" }
```

Um einen anderen Status aufzulisten:

```json
{ "action": "list_pending", "status": "applied" }
```

Gültige Werte für `status`:

- `pending`
- `applied`
- `rejected`
- `quarantined`

### `list_quarantine`

Listet quarantänisierte Vorschläge auf.

```json
{ "action": "list_quarantine" }
```

Verwenden Sie dies, wenn die automatische Erfassung scheinbar nichts tut und die Logs
`skill-workshop: quarantined <skill>` erwähnen.

### `inspect`

Ruft einen Vorschlag anhand seiner ID ab.

```json
{
  "action": "inspect",
  "id": "proposal-id"
}
```

### `suggest`

Erstellt einen Vorschlag. Mit `approvalPolicy: "pending"` (Standard) wird dieser in die Warteschlange gestellt statt geschrieben.

```json
{
  "action": "suggest",
  "skillName": "animated-gif-workflow",
  "title": "Animated GIF Workflow",
  "reason": "User established reusable GIF validation rules.",
  "description": "Validate animated GIF assets before using them.",
  "body": "## Workflow\n\n- Verify the URL resolves to image/gif.\n- Confirm it has multiple frames.\n- Record attribution and license.\n- Avoid hotlinking when a local asset is needed."
}
```

<AccordionGroup>
  <Accordion title="Sicheres Schreiben erzwingen (apply: true)">

```json
{
  "action": "suggest",
  "apply": true,
  "skillName": "animated-gif-workflow",
  "description": "Validate animated GIF assets before using them.",
  "body": "## Workflow\n\n- Verify true animation.\n- Record attribution."
}
```

  </Accordion>

  <Accordion title="Unter Auto-Richtlinie Pending erzwingen (apply: false)">

```json
{
  "action": "suggest",
  "apply": false,
  "skillName": "screenshot-asset-workflow",
  "description": "Screenshot replacement workflow.",
  "body": "## Workflow\n\n- Verify dimensions.\n- Optimize the PNG.\n- Run the relevant gate."
}
```

  </Accordion>

  <Accordion title="An einen benannten Abschnitt anhängen">

```json
{
  "action": "suggest",
  "skillName": "qa-scenario-workflow",
  "section": "Workflow",
  "description": "QA scenario workflow.",
  "body": "- For media QA, verify generated assets render and pass final assertions."
}
```

  </Accordion>

  <Accordion title="Exakten Text ersetzen">

```json
{
  "action": "suggest",
  "skillName": "github-pr-workflow",
  "oldText": "- Check the PR.",
  "newText": "- Check unresolved review threads, CI status, linked issues, and changed files before deciding."
}
```

  </Accordion>
</AccordionGroup>

### `apply`

Wendet einen ausstehenden Vorschlag an.

```json
{
  "action": "apply",
  "id": "proposal-id"
}
```

`apply` verweigert quarantänisierte Vorschläge:

```text
quarantined proposal cannot be applied
```

### `reject`

Markiert einen Vorschlag als abgelehnt.

```json
{
  "action": "reject",
  "id": "proposal-id"
}
```

### `write_support_file`

Schreibt eine unterstützende Datei innerhalb eines bestehenden oder vorgeschlagenen Skill-Verzeichnisses.

Erlaubte Support-Verzeichnisse auf oberster Ebene:

- `references/`
- `templates/`
- `scripts/`
- `assets/`

Beispiel:

```json
{
  "action": "write_support_file",
  "skillName": "release-workflow",
  "relativePath": "references/checklist.md",
  "body": "# Release Checklist\n\n- Run release docs.\n- Verify changelog.\n"
}
```

Support-Dateien sind auf den Workspace begrenzt, pfadgeprüft, durch
`maxSkillBytes` bytebegrenzt, werden gescannt und atomar geschrieben.

## Skill-Schreibvorgänge

Skill Workshop schreibt nur unter:

```text
<workspace>/skills/<normalized-skill-name>/
```

Skill-Namen werden normalisiert:

- in Kleinbuchstaben
- Folgen von nicht `[a-z0-9_-]` werden zu `-`
- führende/nachgestellte nicht alphanumerische Zeichen werden entfernt
- maximale Länge ist 80 Zeichen
- der endgültige Name muss `[a-z0-9][a-z0-9_-]{1,79}` entsprechen

Für `create`:

- wenn der Skill nicht existiert, schreibt Skill Workshop eine neue `SKILL.md`
- wenn er bereits existiert, hängt Skill Workshop den Body an `## Workflow` an

Für `append`:

- wenn der Skill existiert, hängt Skill Workshop an den angeforderten Abschnitt an
- wenn er nicht existiert, erstellt Skill Workshop einen minimalen Skill und hängt dann an

Für `replace`:

- der Skill muss bereits existieren
- `oldText` muss exakt vorhanden sein
- nur die erste exakte Übereinstimmung wird ersetzt

Alle Schreibvorgänge sind atomar und aktualisieren den In-Memory-Snapshot der Skills sofort, sodass
der neue oder aktualisierte Skill ohne Gateway-Neustart sichtbar werden kann.

## Sicherheitsmodell

Skill Workshop hat einen Sicherheitsscanner für generierte `SKILL.md`-Inhalte und Support-
Dateien.

Kritische Befunde setzen Vorschläge unter Quarantäne:

| Regel-ID                               | Blockiert Inhalte, die...                                              |
| -------------------------------------- | ---------------------------------------------------------------------- |
| `prompt-injection-ignore-instructions` | dem Agenten sagen, frühere/höhere Anweisungen zu ignorieren            |
| `prompt-injection-system`              | auf System-Prompts, Entwicklernachrichten oder versteckte Anweisungen verweisen |
| `prompt-injection-tool`                | dazu ermutigen, Tool-Berechtigung/Genehmigung zu umgehen               |
| `shell-pipe-to-shell`                  | `curl`/`wget` enthalten, die in `sh`, `bash` oder `zsh` gepiped werden |
| `secret-exfiltration`                  | scheinbar Env-/Prozess-Env-Daten über das Netzwerk senden              |

Warn-Befunde bleiben erhalten, blockieren aber für sich genommen nicht:

| Regel-ID             | Warnt bei...                        |
| -------------------- | ----------------------------------- |
| `destructive-delete` | breiten Befehlen im Stil von `rm -rf` |
| `unsafe-permissions` | Berechtigungsnutzung im Stil von `chmod 777` |

Quarantänisierte Vorschläge:

- behalten `scanFindings`
- behalten `quarantineReason`
- erscheinen in `list_quarantine`
- können nicht über `apply` angewendet werden

Um sich von einem quarantänisierten Vorschlag zu erholen, erstellen Sie einen neuen sicheren Vorschlag mit entferntem
unsicheren Inhalt. Bearbeiten Sie das Store-JSON nicht von Hand.

## Prompt-Leitlinien

Wenn aktiviert, injiziert Skill Workshop einen kurzen Prompt-Abschnitt, der dem Agenten sagt,
`skill_workshop` für dauerhaftes prozedurales Memory zu verwenden.

Die Leitlinien betonen:

- Verfahren, nicht Fakten/Präferenzen
- Benutzerkorrekturen
- nicht offensichtliche erfolgreiche Verfahren
- wiederkehrende Stolperfallen
- Reparatur veralteter/dünner/falscher Skills durch append/replace
- Speichern wiederverwendbarer Verfahren nach langen Tool-Schleifen oder schwierigen Fixes
- kurzen imperativen Skill-Text
- keine Transkript-Dumps

Der Text des Schreibmodus ändert sich mit `approvalPolicy`:

- Pending-Modus: Vorschläge in die Warteschlange stellen; nur nach expliziter Genehmigung anwenden
- Auto-Modus: sichere Updates von Workspace-Skills anwenden, wenn sie eindeutig wiederverwendbar sind

## Kosten und Runtime-Verhalten

Die heuristische Erfassung ruft kein Modell auf.

LLM-Review verwendet einen eingebetteten Lauf auf dem aktiven/Standard-Agentenmodell. Es ist
schwellenwertbasiert und läuft daher standardmäßig nicht bei jedem Turn.

Der Reviewer:

- verwendet den gleich konfigurierten Provider-/Modellkontext, wenn verfügbar
- fällt auf Runtime-Agenten-Standards zurück
- hat `reviewTimeoutMs`
- verwendet einen leichtgewichtigen Bootstrap-Kontext
- hat keine Tools
- schreibt nichts direkt
- kann nur einen Vorschlag ausgeben, der den normalen Scanner und
  den Genehmigungs-/Quarantänepfad durchläuft

Wenn der Reviewer fehlschlägt, ein Timeout hat oder ungültiges JSON zurückgibt, protokolliert das Plugin eine
Warn-/Debug-Meldung und überspringt diesen Review-Durchlauf.

## Betriebsmuster

Verwenden Sie Skill Workshop, wenn der Benutzer sagt:

- „next time, do X“
- „from now on, prefer Y“
- „make sure to verify Z“
- „save this as a workflow“
- „this took a while; remember the process“
- „update the local skill for this“

Guter Skill-Text:

```markdown
## Workflow

- Verify the GIF URL resolves to `image/gif`.
- Confirm the file has multiple frames.
- Record source URL, license, and attribution.
- Store a local copy when the asset will ship with the product.
- Verify the local asset renders in the target UI before final reply.
```

Schlechter Skill-Text:

```markdown
The user asked about a GIF and I searched two websites. Then one was blocked by
Cloudflare. The final answer said to check attribution.
```

Gründe, warum die schlechte Version nicht gespeichert werden sollte:

- transkriptförmig
- nicht imperativ
- enthält verrauschte einmalige Details
- sagt dem nächsten Agenten nicht, was zu tun ist

## Fehleranalyse

Prüfen Sie, ob das Plugin geladen ist:

```bash
openclaw plugins list --enabled
```

Prüfen Sie Vorschlagszähler aus einem Agent-/Tool-Kontext:

```json
{ "action": "status" }
```

Prüfen Sie ausstehende Vorschläge:

```json
{ "action": "list_pending" }
```

Prüfen Sie quarantänisierte Vorschläge:

```json
{ "action": "list_quarantine" }
```

Häufige Symptome:

| Symptom                              | Wahrscheinliche Ursache                                                            | Prüfen                                                              |
| ------------------------------------ | ----------------------------------------------------------------------------------- | ------------------------------------------------------------------- |
| Tool ist nicht verfügbar             | Plugin-Eintrag ist nicht aktiviert                                                  | `plugins.entries.skill-workshop.enabled` und `openclaw plugins list` |
| Kein automatischer Vorschlag erscheint | `autoCapture: false`, `reviewMode: "off"` oder Schwellenwerte nicht erreicht      | Konfiguration, Vorschlagsstatus, Gateway-Logs                       |
| Heuristik hat nichts erfasst         | Wortlaut des Benutzers passte nicht zu Korrekturmustern                             | Explizit `skill_workshop.suggest` verwenden oder LLM-Reviewer aktivieren |
| Reviewer hat keinen Vorschlag erstellt | Reviewer gab `none`, ungültiges JSON zurück oder hatte Timeout                     | Gateway-Logs, `reviewTimeoutMs`, Schwellenwerte                     |
| Vorschlag wird nicht angewendet      | `approvalPolicy: "pending"`                                                         | `list_pending`, dann `apply`                                        |
| Vorschlag verschwand aus Pending     | Duplikat-Vorschlag wurde wiederverwendet, Max-Pending-Bereinigung oder wurde angewendet/abgelehnt/quarantänisiert | `status`, `list_pending` mit Statusfiltern, `list_quarantine` |
| Skill-Datei existiert, aber das Modell übersieht sie | Skill-Snapshot wurde nicht aktualisiert oder Skill-Gating schließt ihn aus | `openclaw skills`-Status und Workspace-Skill-Berechtigung           |

Relevante Logs:

- `skill-workshop: queued <skill>`
- `skill-workshop: applied <skill>`
- `skill-workshop: quarantined <skill>`
- `skill-workshop: heuristic capture skipped: ...`
- `skill-workshop: reviewer skipped: ...`
- `skill-workshop: reviewer found no update`

## QA-Szenarien

Repositorygestützte QA-Szenarien:

- `qa/scenarios/plugins/skill-workshop-animated-gif-autocreate.md`
- `qa/scenarios/plugins/skill-workshop-pending-approval.md`
- `qa/scenarios/plugins/skill-workshop-reviewer-autonomous.md`

Deterministische Abdeckung ausführen:

```bash
pnpm openclaw qa suite \
  --scenario skill-workshop-animated-gif-autocreate \
  --scenario skill-workshop-pending-approval \
  --concurrency 1
```

Reviewer-Abdeckung ausführen:

```bash
pnpm openclaw qa suite \
  --scenario skill-workshop-reviewer-autonomous \
  --concurrency 1
```

Das Reviewer-Szenario ist absichtlich getrennt, weil es
`reviewMode: "llm"` aktiviert und den eingebetteten Reviewer-Durchlauf testet.

## Wann Auto-Apply nicht aktiviert werden sollte

Vermeiden Sie `approvalPolicy: "auto"`, wenn:

- der Workspace sensible Verfahren enthält
- der Agent mit nicht vertrauenswürdiger Eingabe arbeitet
- Skills über ein breites Team hinweg geteilt werden
- Sie Prompts oder Scanner-Regeln noch abstimmen
- das Modell häufig mit feindseligem Web-/E-Mail-Inhalt arbeitet

Verwenden Sie zuerst den Pending-Modus. Wechseln Sie erst dann in den Auto-Modus, wenn Sie die Art von
Skills geprüft haben, die der Agent in diesem Workspace vorschlägt.

## Verwandte Dokumente

- [Skills](/de/tools/skills)
- [Plugins](/de/tools/plugin)
- [Testing](/de/reference/test)
