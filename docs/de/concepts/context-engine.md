---
read_when:
    - Sie möchten verstehen, wie OpenClaw Modellkontext zusammenstellt.
    - Sie wechseln zwischen der Legacy-Engine und einer Plugin-Engine.
    - Sie erstellen ein Plugin für die Context Engine.
summary: 'Context Engine: erweiterbare Kontextzusammenstellung, Compaction und Lebenszyklus von Subagenten'
title: Context Engine
x-i18n:
    generated_at: "2026-04-24T06:33:32Z"
    model: gpt-5.4
    provider: openai
    source_hash: 8f4e5f01f945f7fe3056587f2aa60bec607dd0dd64b29e9ab2afe8e77b5d2f1e
    source_path: concepts/context-engine.md
    workflow: 15
---

Eine **Context Engine** steuert, wie OpenClaw für jeden Lauf Modellkontext aufbaut:
welche Nachrichten einbezogen werden, wie älterer Verlauf zusammengefasst wird und wie
Kontext über Subagent-Grenzen hinweg verwaltet wird.

OpenClaw wird mit einer integrierten `legacy`-Engine ausgeliefert und verwendet sie standardmäßig — die meisten
Benutzer müssen dies nie ändern. Installieren und wählen Sie eine Plugin-Engine nur dann aus,
wenn Sie ein anderes Verhalten für Zusammenstellung, Compaction oder sitzungsübergreifenden Recall möchten.

## Schnellstart

Prüfen Sie, welche Engine aktiv ist:

```bash
openclaw doctor
# oder die Konfiguration direkt prüfen:
cat ~/.openclaw/openclaw.json | jq '.plugins.slots.contextEngine'
```

### Ein Plugin für eine Context Engine installieren

Plugins für Context Engines werden wie jedes andere OpenClaw-Plugin installiert. Installieren Sie das Plugin
zuerst und wählen Sie dann die Engine im Slot aus:

```bash
# Von npm installieren
openclaw plugins install @martian-engineering/lossless-claw

# Oder aus einem lokalen Pfad installieren (für Entwicklung)
openclaw plugins install -l ./my-context-engine
```

Aktivieren Sie dann das Plugin und wählen Sie es in Ihrer Konfiguration als aktive Engine aus:

```json5
// openclaw.json
{
  plugins: {
    slots: {
      contextEngine: "lossless-claw", // muss zur registrierten Engine-ID des Plugins passen
    },
    entries: {
      "lossless-claw": {
        enabled: true,
        // Pluginspezifische Konfiguration kommt hierhin (siehe Dokumentation des Plugins)
      },
    },
  },
}
```

Starten Sie das Gateway nach Installation und Konfiguration neu.

Um zurück zur integrierten Engine zu wechseln, setzen Sie `contextEngine` auf `"legacy"` (oder
entfernen Sie den Schlüssel vollständig — `"legacy"` ist der Standard).

## Funktionsweise

Jedes Mal, wenn OpenClaw einen Modell-Prompt ausführt, nimmt die Context Engine an
vier Punkten im Lebenszyklus teil:

1. **Ingest** — wird aufgerufen, wenn eine neue Nachricht zur Sitzung hinzugefügt wird. Die Engine
   kann die Nachricht in ihrem eigenen Datenspeicher speichern oder indizieren.
2. **Assemble** — wird vor jedem Modelllauf aufgerufen. Die Engine gibt eine geordnete
   Menge von Nachrichten zurück (und optional `systemPromptAddition`), die innerhalb
   des Token-Budgets liegen.
3. **Compact** — wird aufgerufen, wenn das Kontextfenster voll ist oder wenn der Benutzer
   `/compact` ausführt. Die Engine fasst älteren Verlauf zusammen, um Platz freizugeben.
4. **After turn** — wird aufgerufen, nachdem ein Lauf abgeschlossen ist. Die Engine kann Status speichern,
   Hintergrund-Compaction auslösen oder Indizes aktualisieren.

Für das gebündelte nicht-ACP-Codex-Harness wendet OpenClaw denselben Lebenszyklus an,
indem der zusammengestellte Kontext in Codex-Entwickleranweisungen und den Prompt des aktuellen
Turns projiziert wird. Codex verwaltet weiterhin seinen nativen Thread-Verlauf und den nativen Compactor.

### Lebenszyklus von Subagenten (optional)

OpenClaw ruft zwei optionale Lifecycle-Hooks für Subagenten auf:

- **prepareSubagentSpawn** — gemeinsamen Kontextstatus vorbereiten, bevor ein Child-Lauf
  startet. Der Hook erhält Session Keys von Parent und Child, `contextMode`
  (`isolated` oder `fork`), verfügbare Transcript-IDs/-Dateien und optional TTL.
  Wenn er ein Rollback-Handle zurückgibt, ruft OpenClaw dieses auf, wenn das Starten nach
  erfolgreicher Vorbereitung fehlschlägt.
- **onSubagentEnded** — aufräumen, wenn eine Subagent-Sitzung abgeschlossen ist oder bereinigt wird.

### Ergänzung des System-Prompts

Die Methode `assemble` kann einen String `systemPromptAddition` zurückgeben. OpenClaw
stellt diesen dem System-Prompt für den Lauf voran. So können Engines dynamische
Recall-Hinweise, Retrieval-Anweisungen oder kontextabhängige Hinweise einfügen,
ohne statische Workspace-Dateien zu benötigen.

## Die Legacy-Engine

Die integrierte `legacy`-Engine bewahrt das ursprüngliche Verhalten von OpenClaw:

- **Ingest**: no-op (der Session Manager übernimmt die Persistierung von Nachrichten direkt).
- **Assemble**: Pass-through (die vorhandene Pipeline sanitize → validate → limit
  in der Runtime übernimmt die Kontextzusammenstellung).
- **Compact**: delegiert an die integrierte zusammenfassende Compaction, die
  eine einzelne Zusammenfassung älterer Nachrichten erstellt und aktuelle Nachrichten unverändert lässt.
- **After turn**: no-op.

Die Legacy-Engine registriert keine Tools und stellt kein `systemPromptAddition` bereit.

Wenn `plugins.slots.contextEngine` nicht gesetzt ist (oder auf `"legacy"` gesetzt ist), wird diese
Engine automatisch verwendet.

## Plugin-Engines

Ein Plugin kann über die Plugin-API eine Context Engine registrieren:

```ts
import { buildMemorySystemPromptAddition } from "openclaw/plugin-sdk/core";

export default function register(api) {
  api.registerContextEngine("my-engine", () => ({
    info: {
      id: "my-engine",
      name: "My Context Engine",
      ownsCompaction: true,
    },

    async ingest({ sessionId, message, isHeartbeat }) {
      // Nachricht in Ihrem Datenspeicher speichern
      return { ingested: true };
    },

    async assemble({ sessionId, messages, tokenBudget, availableTools, citationsMode }) {
      // Nachrichten zurückgeben, die in das Budget passen
      return {
        messages: buildContext(messages, tokenBudget),
        estimatedTokens: countTokens(messages),
        systemPromptAddition: buildMemorySystemPromptAddition({
          availableTools: availableTools ?? new Set(),
          citationsMode,
        }),
      };
    },

    async compact({ sessionId, force }) {
      // Älteren Kontext zusammenfassen
      return { ok: true, compacted: true };
    },
  }));
}
```

Aktivieren Sie sie dann in der Konfiguration:

```json5
{
  plugins: {
    slots: {
      contextEngine: "my-engine",
    },
    entries: {
      "my-engine": {
        enabled: true,
      },
    },
  },
}
```

### Das Interface `ContextEngine`

Erforderliche Mitglieder:

| Mitglied           | Art      | Zweck                                                        |
| ------------------ | -------- | ------------------------------------------------------------ |
| `info`             | Property | Engine-ID, Name, Version und ob sie Compaction selbst besitzt |
| `ingest(params)`   | Method   | Eine einzelne Nachricht speichern                            |
| `assemble(params)` | Method   | Kontext für einen Modelllauf aufbauen (gibt `AssembleResult` zurück) |
| `compact(params)`  | Method   | Kontext zusammenfassen/reduzieren                            |

`assemble` gibt ein `AssembleResult` zurück mit:

- `messages` — die geordneten Nachrichten, die an das Modell gesendet werden.
- `estimatedTokens` (erforderlich, `number`) — die Schätzung der Engine für die Gesamtzahl
  der Tokens im zusammengestellten Kontext. OpenClaw verwendet dies für Entscheidungen
  zu Compaction-Schwellenwerten und für Diagnoseberichte.
- `systemPromptAddition` (optional, `string`) — wird dem System-Prompt vorangestellt.

Optionale Mitglieder:

| Mitglied                       | Art    | Zweck                                                                                                           |
| ----------------------------- | ------ | ---------------------------------------------------------------------------------------------------------------- |
| `bootstrap(params)`           | Method | Engine-Status für eine Sitzung initialisieren. Wird einmal aufgerufen, wenn die Engine erstmals eine Sitzung sieht (z. B. Verlauf importieren). |
| `ingestBatch(params)`         | Method | Einen abgeschlossenen Turn als Batch ingesten. Wird nach Abschluss eines Laufs mit allen Nachrichten dieses Turns auf einmal aufgerufen. |
| `afterTurn(params)`           | Method | Arbeiten nach dem Lauf im Lebenszyklus (Status speichern, Hintergrund-Compaction auslösen).                     |
| `prepareSubagentSpawn(params)` | Method | Gemeinsamen Status für eine Child-Sitzung einrichten, bevor sie startet.                                       |
| `onSubagentEnded(params)`     | Method | Aufräumen nach Ende eines Subagenten.                                                                           |
| `dispose()`                   | Method | Ressourcen freigeben. Wird beim Shutdown des Gateways oder beim Neuladen von Plugins aufgerufen — nicht pro Sitzung. |

### ownsCompaction

`ownsCompaction` steuert, ob Pis integrierte automatische In-Attempt-Compaction
für den Lauf aktiviert bleibt:

- `true` — die Engine besitzt das Compaction-Verhalten. OpenClaw deaktiviert Pis integrierte
  Auto-Compaction für diesen Lauf, und die Implementierung `compact()` der Engine ist
  verantwortlich für `/compact`, Compaction zur Wiederherstellung bei Überläufen und jede proaktive
  Compaction, die sie in `afterTurn()` ausführen möchte.
- `false` oder nicht gesetzt — Pis integrierte Auto-Compaction kann während der Prompt-
  Ausführung weiterhin laufen, aber die Methode `compact()` der aktiven Engine wird weiterhin für
  `/compact` und die Wiederherstellung bei Überläufen aufgerufen.

`ownsCompaction: false` bedeutet **nicht**, dass OpenClaw automatisch auf
den Compaction-Pfad der Legacy-Engine zurückfällt.

Das bedeutet, es gibt zwei gültige Plugin-Muster:

- **Owning-Modus** — implementieren Sie Ihren eigenen Compaction-Algorithmus und setzen Sie
  `ownsCompaction: true`.
- **Delegating-Modus** — setzen Sie `ownsCompaction: false` und lassen Sie `compact()`
  `delegateCompactionToRuntime(...)` aus `openclaw/plugin-sdk/core` aufrufen, um
  das integrierte Compaction-Verhalten von OpenClaw zu verwenden.

Ein no-op-`compact()` ist für eine aktive nicht-besitzende Engine unsicher, weil es
den normalen Pfad für `/compact` und die Wiederherstellung bei Überläufen für diesen
Engine-Slot deaktiviert.

## Konfigurationsreferenz

```json5
{
  plugins: {
    slots: {
      // Die aktive Context Engine auswählen. Standard: "legacy".
      // Auf eine Plugin-ID setzen, um eine Plugin-Engine zu verwenden.
      contextEngine: "legacy",
    },
  },
}
```

Der Slot ist zur Laufzeit exklusiv — nur eine registrierte Context Engine wird
für einen bestimmten Lauf oder eine bestimmte Compaction-Operation aufgelöst. Andere aktivierte
Plugins vom Typ `kind: "context-engine"` können weiterhin geladen werden und ihren Registrierungs-
Code ausführen; `plugins.slots.contextEngine` wählt nur aus, welche registrierte Engine-ID
OpenClaw auflöst, wenn eine Context Engine benötigt wird.

## Beziehung zu Compaction und Memory

- **Compaction** ist eine Verantwortung der Context Engine. Die Legacy-Engine
  delegiert an OpenClaws integrierte Zusammenfassung. Plugin-Engines können
  jede beliebige Compaction-Strategie implementieren (DAG-Zusammenfassungen, Vektor-Retrieval usw.).
- **Memory-Plugins** (`plugins.slots.memory`) sind von Context Engines getrennt.
  Memory-Plugins stellen Suche/Retrieval bereit; Context Engines steuern, was das
  Modell sieht. Beides kann zusammenarbeiten — eine Context Engine könnte Daten eines Memory-
  Plugins während der Zusammenstellung verwenden. Plugin-Engines, die den aktiven Memory-
  Prompt-Pfad verwenden möchten, sollten `buildMemorySystemPromptAddition(...)` aus
  `openclaw/plugin-sdk/core` bevorzugen, da dies die aktiven Abschnitte des Memory-Prompts
  in ein direkt voranstellbares `systemPromptAddition` umwandelt. Wenn eine Engine niedrigere
  Kontrolle benötigt, kann sie weiterhin rohe Zeilen aus
  `openclaw/plugin-sdk/memory-host-core` über
  `buildActiveMemoryPromptSection(...)` abrufen.
- **Session pruning** (Trimmen alter Tool-Ergebnisse im Arbeitsspeicher) läuft weiterhin,
  unabhängig davon, welche Context Engine aktiv ist.

## Tipps

- Verwenden Sie `openclaw doctor`, um zu prüfen, ob Ihre Engine korrekt geladen wird.
- Wenn Sie zwischen Engines wechseln, laufen bestehende Sitzungen mit ihrem aktuellen Verlauf weiter.
  Die neue Engine übernimmt für zukünftige Läufe.
- Engine-Fehler werden protokolliert und in Diagnosen angezeigt. Wenn sich eine Plugin-Engine
  nicht registrieren lässt oder die ausgewählte Engine-ID nicht aufgelöst werden kann, fällt OpenClaw
  nicht automatisch zurück; Läufe schlagen fehl, bis Sie das Plugin reparieren oder
  `plugins.slots.contextEngine` wieder auf `"legacy"` setzen.
- Für die Entwicklung verwenden Sie `openclaw plugins install -l ./my-engine`, um ein
  lokales Plugin-Verzeichnis zu verlinken, ohne es zu kopieren.

Siehe auch: [Compaction](/de/concepts/compaction), [Kontext](/de/concepts/context),
[Plugins](/de/tools/plugin), [Plugin-Manifest](/de/plugins/manifest).

## Verwandt

- [Kontext](/de/concepts/context) — wie Kontext für Agent-Turns aufgebaut wird
- [Plugin-Architektur](/de/plugins/architecture) — Registrieren von Plugins für Context Engines
- [Compaction](/de/concepts/compaction) — lange Unterhaltungen zusammenfassen
