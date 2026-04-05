---
read_when:
    - Sie möchten verstehen, wie OpenClaw Modellkontext zusammenstellt
    - Sie wechseln zwischen der Legacy-Engine und einer Plugin-Engine
    - Sie erstellen ein Context-Engine-Plugin
summary: 'Context Engine: steckbare Kontextzusammenstellung, Kompaktierung und Subagent-Lebenszyklus'
title: Context Engine
x-i18n:
    generated_at: "2026-04-05T12:39:54Z"
    model: gpt-5.4
    provider: openai
    source_hash: 19fd8cbb0e953f58fd84637fc4ceefc65984312cf2896d338318bc8cf860e6d9
    source_path: concepts/context-engine.md
    workflow: 15
---

# Context Engine

Eine **Context Engine** steuert, wie OpenClaw für jede Ausführung Modellkontext aufbaut.
Sie entscheidet, welche Nachrichten einbezogen werden, wie älterer Verlauf
zusammengefasst wird und wie Kontext über Subagent-Grenzen hinweg verwaltet wird.

OpenClaw wird mit einer integrierten `legacy`-Engine ausgeliefert. Plugins können
alternative Engines registrieren, die den aktiven Lebenszyklus der Context Engine ersetzen.

## Schnellstart

Prüfen, welche Engine aktiv ist:

```bash
openclaw doctor
# oder Konfiguration direkt prüfen:
cat ~/.openclaw/openclaw.json | jq '.plugins.slots.contextEngine'
```

### Installation eines Context-Engine-Plugins

Context-Engine-Plugins werden wie jedes andere OpenClaw-Plugin installiert. Installieren Sie
es zuerst und wählen Sie dann die Engine im Slot aus:

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
      contextEngine: "lossless-claw", // muss mit der registrierten Engine-ID des Plugins übereinstimmen
    },
    entries: {
      "lossless-claw": {
        enabled: true,
        // Pluginspezifische Konfiguration kommt hierhin (siehe Plugin-Dokumentation)
      },
    },
  },
}
```

Starten Sie das Gateway nach der Installation und Konfiguration neu.

Um wieder zur integrierten Engine zurückzuwechseln, setzen Sie `contextEngine` auf `"legacy"` (oder
entfernen Sie den Schlüssel ganz — `"legacy"` ist der Standard).

## So funktioniert es

Jedes Mal, wenn OpenClaw einen Modell-Prompt ausführt, ist die Context Engine an
vier Lebenszyklus-Punkten beteiligt:

1. **Ingest** — wird aufgerufen, wenn eine neue Nachricht zur Sitzung hinzugefügt wird. Die Engine
   kann die Nachricht in ihrem eigenen Datenspeicher speichern oder indizieren.
2. **Assemble** — wird vor jeder Modellausführung aufgerufen. Die Engine gibt eine geordnete
   Menge von Nachrichten zurück (und optional ein `systemPromptAddition`), die innerhalb
   des Token-Budgets liegen.
3. **Compact** — wird aufgerufen, wenn das Kontextfenster voll ist oder wenn der Benutzer
   `/compact` ausführt. Die Engine fasst älteren Verlauf zusammen, um Speicherplatz freizugeben.
4. **After turn** — wird aufgerufen, nachdem eine Ausführung abgeschlossen ist. Die Engine kann Status speichern,
   Hintergrundkompaktierung auslösen oder Indizes aktualisieren.

### Subagent-Lebenszyklus (optional)

OpenClaw ruft derzeit einen Hook für den Subagent-Lebenszyklus auf:

- **onSubagentEnded** — Aufräumen, wenn eine Subagent-Sitzung abgeschlossen wird oder bereinigt wird.

Der Hook `prepareSubagentSpawn` ist Teil der Schnittstelle für zukünftige Nutzung, aber
die Laufzeit ruft ihn noch nicht auf.

### Ergänzung des System-Prompts

Die Methode `assemble` kann einen String `systemPromptAddition` zurückgeben. OpenClaw
stellt diesen dem System-Prompt für die Ausführung voran. So können Engines dynamische
Hinweise zum Abruf, Retrieval-Anweisungen oder kontextabhängige Hinweise einfügen,
ohne statische Workspace-Dateien zu erfordern.

## Die Legacy-Engine

Die integrierte `legacy`-Engine bewahrt das ursprüngliche Verhalten von OpenClaw:

- **Ingest**: no-op (der Sitzungsmanager übernimmt direkt die Persistierung der Nachrichten).
- **Assemble**: Durchleitung (die vorhandene Pipeline sanitize → validate → limit
  in der Laufzeit übernimmt die Kontextzusammenstellung).
- **Compact**: delegiert an die integrierte Zusammenfassungs-Kompaktierung, die
  eine einzelne Zusammenfassung älterer Nachrichten erstellt und aktuelle Nachrichten intakt hält.
- **After turn**: no-op.

Die Legacy-Engine registriert keine Tools und stellt kein `systemPromptAddition` bereit.

Wenn `plugins.slots.contextEngine` nicht gesetzt ist (oder auf `"legacy"` gesetzt ist), wird diese
Engine automatisch verwendet.

## Plugin-Engines

Ein Plugin kann über die Plugin-API eine Context Engine registrieren:

```ts
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

    async assemble({ sessionId, messages, tokenBudget }) {
      // Nachrichten zurückgeben, die in das Budget passen
      return {
        messages: buildContext(messages, tokenBudget),
        estimatedTokens: countTokens(messages),
        systemPromptAddition: "Use lcm_grep to search history...",
      };
    },

    async compact({ sessionId, force }) {
      // Älteren Kontext zusammenfassen
      return { ok: true, compacted: true };
    },
  }));
}
```

Dann in der Konfiguration aktivieren:

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

### Die Schnittstelle ContextEngine

Erforderliche Member:

| Member             | Art      | Zweck                                                    |
| ------------------ | -------- | -------------------------------------------------------- |
| `info`             | Property | Engine-ID, Name, Version und ob sie Kompaktierung besitzt |
| `ingest(params)`   | Method   | Eine einzelne Nachricht speichern                        |
| `assemble(params)` | Method   | Kontext für eine Modellausführung erstellen (gibt `AssembleResult` zurück) |
| `compact(params)`  | Method   | Kontext zusammenfassen/reduzieren                        |

`assemble` gibt ein `AssembleResult` zurück mit:

- `messages` — die geordneten Nachrichten, die an das Modell gesendet werden.
- `estimatedTokens` (erforderlich, `number`) — die Schätzung der Engine für die Gesamtzahl
  der Tokens im zusammengestellten Kontext. OpenClaw verwendet dies für Entscheidungen
  über Kompaktierungsschwellen und für Diagnoseberichte.
- `systemPromptAddition` (optional, `string`) — wird dem System-Prompt vorangestellt.

Optionale Member:

| Member                         | Art    | Zweck                                                                                                           |
| ------------------------------ | ------ | --------------------------------------------------------------------------------------------------------------- |
| `bootstrap(params)`            | Method | Engine-Status für eine Sitzung initialisieren. Wird einmal aufgerufen, wenn die Engine eine Sitzung zum ersten Mal sieht (z. B. Verlauf importieren). |
| `ingestBatch(params)`          | Method | Eine abgeschlossene Ausführung als Batch aufnehmen. Wird nach Abschluss einer Ausführung aufgerufen, mit allen Nachrichten dieser Ausführung auf einmal. |
| `afterTurn(params)`            | Method | Arbeit nach der Ausführung (Status speichern, Hintergrundkompaktierung auslösen).                              |
| `prepareSubagentSpawn(params)` | Method | Gemeinsamen Status für eine untergeordnete Sitzung vorbereiten.                                                 |
| `onSubagentEnded(params)`      | Method | Aufräumen, nachdem ein Subagent beendet wurde.                                                                  |
| `dispose()`                    | Method | Ressourcen freigeben. Wird beim Herunterfahren des Gateway oder beim Neuladen von Plugins aufgerufen — nicht pro Sitzung. |

### ownsCompaction

`ownsCompaction` steuert, ob die integrierte In-Attempt-Autokompaktierung von Pi
für die Ausführung aktiviert bleibt:

- `true` — die Engine besitzt das Kompaktierungsverhalten. OpenClaw deaktiviert die integrierte
  Autokompaktierung von Pi für diese Ausführung, und die Implementierung `compact()`
  der Engine ist verantwortlich für `/compact`, Overflow-Recovery-Kompaktierung und jede proaktive
  Kompaktierung, die sie in `afterTurn()` ausführen möchte.
- `false` oder nicht gesetzt — die integrierte Autokompaktierung von Pi kann während der Prompt-
  Ausführung weiterhin laufen, aber die Methode `compact()` der aktiven Engine wird weiterhin für
  `/compact` und Overflow-Recovery aufgerufen.

`ownsCompaction: false` bedeutet **nicht**, dass OpenClaw automatisch auf
den Kompaktierungspfad der Legacy-Engine zurückfällt.

Das bedeutet, dass es zwei gültige Plugin-Muster gibt:

- **Besitzender Modus** — implementieren Sie Ihren eigenen Kompaktierungsalgorithmus und setzen Sie
  `ownsCompaction: true`.
- **Delegierender Modus** — setzen Sie `ownsCompaction: false` und lassen Sie `compact()`
  `delegateCompactionToRuntime(...)` aus `openclaw/plugin-sdk/core` aufrufen, um
  das integrierte Kompaktierungsverhalten von OpenClaw zu verwenden.

Ein no-op-`compact()` ist für eine aktive, nicht besitzende Engine unsicher, da es
den normalen Pfad für `/compact` und Overflow-Recovery-Kompaktierung für diesen
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
für eine bestimmte Ausführung oder Kompaktierungsoperation aufgelöst. Andere aktivierte
Plugins mit `kind: "context-engine"` können weiterhin geladen werden und ihren Registrierungscode
ausführen; `plugins.slots.contextEngine` wählt nur aus, welche registrierte Engine-ID
OpenClaw auflöst, wenn eine Context Engine benötigt wird.

## Beziehung zu Kompaktierung und Speicher

- **Kompaktierung** ist eine Aufgabe der Context Engine. Die Legacy-Engine
  delegiert an die integrierte Zusammenfassung von OpenClaw. Plugin-Engines können
  beliebige Kompaktierungsstrategien implementieren (DAG-Zusammenfassungen, Vektor-Retrieval usw.).
- **Memory-Plugins** (`plugins.slots.memory`) sind von Context Engines getrennt.
  Memory-Plugins stellen Suche/Retrieval bereit; Context Engines steuern, was das
  Modell sieht. Sie können zusammenarbeiten — eine Context Engine könnte Daten aus
  einem Memory-Plugin während der Zusammenstellung verwenden.
- **Sitzungsbereinigung** (Trimmen alter Tool-Ergebnisse im Speicher) läuft weiterhin,
  unabhängig davon, welche Context Engine aktiv ist.

## Tipps

- Verwenden Sie `openclaw doctor`, um zu prüfen, ob Ihre Engine korrekt geladen wird.
- Wenn Sie Engines wechseln, laufen vorhandene Sitzungen mit ihrem aktuellen Verlauf weiter.
  Die neue Engine übernimmt zukünftige Ausführungen.
- Engine-Fehler werden protokolliert und in der Diagnose angezeigt. Wenn eine Plugin-Engine
  sich nicht registrieren lässt oder die ausgewählte Engine-ID nicht aufgelöst werden kann, fällt OpenClaw
  nicht automatisch zurück; Ausführungen schlagen fehl, bis Sie das Plugin reparieren oder
  `plugins.slots.contextEngine` wieder auf `"legacy"` setzen.
- Für die Entwicklung verwenden Sie `openclaw plugins install -l ./my-engine`, um ein
  lokales Plugin-Verzeichnis zu verknüpfen, ohne es zu kopieren.

Siehe auch: [Compaction](/concepts/compaction), [Context](/concepts/context),
[Plugins](/tools/plugin), [Plugin manifest](/plugins/manifest).

## Verwandt

- [Context](/concepts/context) — wie Kontext für Agent-Turns aufgebaut wird
- [Plugin Architecture](/plugins/architecture) — Registrierung von Context-Engine-Plugins
- [Compaction](/concepts/compaction) — Zusammenfassen langer Unterhaltungen
