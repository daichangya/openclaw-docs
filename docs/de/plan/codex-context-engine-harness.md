---
read_when:
    - Sie binden das Lebenszyklusverhalten der Kontext-Engine in das Codex-Harness ein
    - Sie benötigen, dass lossless-claw oder ein anderes Kontext-Engine-Plugin mit eingebetteten Harness-Sitzungen von codex/* funktioniert
    - Sie vergleichen eingebettetes PI- und Codex-App-Server-Kontextverhalten
summary: Spezifikation dafür, dass das gebündelte Harness des Codex-App-Servers Plugins der OpenClaw-Kontext-Engine berücksichtigt
title: Portierung der Codex-Harness-Kontext-Engine
x-i18n:
    generated_at: "2026-04-24T06:47:03Z"
    model: gpt-5.4
    provider: openai
    source_hash: 9d6b106915f2888337cb08c831c1722770ad8ec6612c575efe88fe2fc263dec5
    source_path: plan/codex-context-engine-harness.md
    workflow: 15
---

# Portierung der Codex-Harness-Kontext-Engine

## Status

Entwurf einer Implementierungsspezifikation.

## Ziel

Das gebündelte Harness des Codex-App-Servers soll denselben Lebenszyklusvertrag der OpenClaw-Kontext-Engine berücksichtigen, den eingebettete PI-Turns bereits berücksichtigen.

Eine Sitzung mit `agents.defaults.embeddedHarness.runtime: "codex"` oder einem
`codex/*`-Modell soll weiterhin dem ausgewählten Plugin der Kontext-Engine, etwa
`lossless-claw`, erlauben, Kontextzusammenstellung, Ingest nach dem Turn, Wartung und
Compaction-Richtlinie auf OpenClaw-Ebene zu steuern, soweit die Grenze des Codex-App-Servers dies zulässt.

## Nicht-Ziele

- Codex-App-Server-Interna nicht neu implementieren.
- Dafür sorgen, dass die native Thread-Compaction von Codex eine lossless-claw-Zusammenfassung erzeugt.
- Nicht-Codex-Modelle nicht dazu zwingen, das Codex-Harness zu verwenden.
- Verhalten von ACP-/acpx-Sitzungen nicht ändern. Diese Spezifikation gilt nur für den
  eingebetteten Agenten-Harness-Pfad ohne ACP.
- Drittanbieter-Plugins nicht dazu bringen, Extension-Factories für den Codex-App-Server zu registrieren;
  die bestehende Vertrauensgrenze für gebündelte Plugins bleibt unverändert.

## Aktuelle Architektur

Die eingebettete Ausführungsschleife löst die konfigurierte Kontext-Engine einmal pro Lauf auf, bevor
ein konkretes Low-Level-Harness ausgewählt wird:

- `src/agents/pi-embedded-runner/run.ts`
  - initialisiert Plugins der Kontext-Engine
  - ruft `resolveContextEngine(params.config)` auf
  - übergibt `contextEngine` und `contextTokenBudget` an
    `runEmbeddedAttemptWithBackend(...)`

`runEmbeddedAttemptWithBackend(...)` delegiert an das ausgewählte Agenten-Harness:

- `src/agents/pi-embedded-runner/run/backend.ts`
- `src/agents/harness/selection.ts`

Das Codex-App-Server-Harness wird durch das gebündelte Codex-Plugin registriert:

- `extensions/codex/index.ts`
- `extensions/codex/harness.ts`

Die Implementierung des Codex-Harness erhält dieselben `EmbeddedRunAttemptParams`
wie PI-gestützte Attempts:

- `extensions/codex/src/app-server/run-attempt.ts`

Das bedeutet, dass sich der erforderliche Hook-Punkt in von OpenClaw kontrolliertem Code befindet. Die externe
Grenze ist das Protokoll des Codex-App-Servers selbst: OpenClaw kann steuern, was es an
`thread/start`, `thread/resume` und `turn/start` sendet, und kann Benachrichtigungen beobachten, aber es kann
den internen Thread-Store oder den nativen Compactor von Codex nicht ändern.

## Aktuelle Lücke

Eingebettete PI-Attempts rufen den Lebenszyklus der Kontext-Engine direkt auf:

- Bootstrap/Wartung vor dem Attempt
- Assemble vor dem Modellaufruf
- `afterTurn` oder Ingest nach dem Attempt
- Wartung nach einem erfolgreichen Turn
- Compaction der Kontext-Engine für Engines, die Compaction besitzen

Relevanter PI-Code:

- `src/agents/pi-embedded-runner/run/attempt.ts`
- `src/agents/pi-embedded-runner/run/attempt.context-engine-helpers.ts`
- `src/agents/pi-embedded-runner/context-engine-maintenance.ts`

Codex-App-Server-Attempts führen derzeit generische Agenten-Harness-Hooks aus und spiegeln
das Transkript, rufen aber nicht `params.contextEngine.bootstrap`,
`params.contextEngine.assemble`, `params.contextEngine.afterTurn`,
`params.contextEngine.ingestBatch`, `params.contextEngine.ingest` oder
`params.contextEngine.maintain` auf.

Relevanter Codex-Code:

- `extensions/codex/src/app-server/run-attempt.ts`
- `extensions/codex/src/app-server/thread-lifecycle.ts`
- `extensions/codex/src/app-server/event-projector.ts`
- `extensions/codex/src/app-server/compact.ts`

## Gewünschtes Verhalten

Für Codex-Harness-Turns soll OpenClaw diesen Lebenszyklus beibehalten:

1. Das gespiegelte OpenClaw-Sitzungstranskript lesen.
2. Die aktive Kontext-Engine bootstrappen, wenn eine vorherige Sitzungsdatei existiert.
3. Bootstrap-Wartung ausführen, wenn verfügbar.
4. Kontext mit der aktiven Kontext-Engine zusammenstellen.
5. Den zusammengestellten Kontext in Codex-kompatible Eingaben umwandeln.
6. Den Codex-Thread mit Entwickleranweisungen starten oder fortsetzen, die eine
   eventuelle `systemPromptAddition` der Kontext-Engine enthalten.
7. Den Codex-Turn mit dem zusammengestellten benutzerseitigen Prompt starten.
8. Das Codex-Ergebnis zurück in das OpenClaw-Transkript spiegeln.
9. `afterTurn` aufrufen, falls implementiert, andernfalls `ingestBatch`/`ingest`, unter Verwendung des
   gespiegelten Transkript-Snapshots.
10. Turn-Wartung nach erfolgreichen, nicht abgebrochenen Turns ausführen.
11. Native Compaction-Signale von Codex und Compaction-Hooks von OpenClaw erhalten.

## Design-Einschränkungen

### Der Codex-App-Server bleibt kanonisch für nativen Thread-Status

Codex besitzt seinen nativen Thread und jede interne erweiterte Historie. OpenClaw soll
nicht versuchen, die interne Historie des App-Servers zu verändern, außer über unterstützte
Protokollaufrufe.

Das Transkript-Spiegeln von OpenClaw bleibt die Quelle für OpenClaw-Funktionen:

- Chat-Verlauf
- Suche
- Buchführung für `/new` und `/reset`
- zukünftiges Umschalten von Modell oder Harness
- Plugin-Status der Kontext-Engine

### Das Zusammenstellen durch die Kontext-Engine muss in Codex-Eingaben projiziert werden

Die Schnittstelle der Kontext-Engine gibt `AgentMessage[]` von OpenClaw zurück, keinen Codex-
Thread-Patch. `turn/start` des Codex-App-Servers akzeptiert eine aktuelle Benutzereingabe, während
`thread/start` und `thread/resume` Entwickleranweisungen akzeptieren.

Daher benötigt die Implementierung eine Projektionsschicht. Die sichere erste Version
soll vermeiden vorzugeben, dass sie die interne Historie von Codex ersetzen kann. Sie soll zusammengestellten
Kontext als deterministisches Prompt-/Entwickleranweisungsmaterial rund um
den aktuellen Turn injizieren.

### Stabilität des Prompt-Caches ist wichtig

Für Engines wie lossless-claw soll der zusammengestellte Kontext bei unveränderten Eingaben deterministisch sein. Fügen Sie generiertem Kontexttext keine Zeitstempel, zufälligen IDs oder nicht deterministische Reihenfolge hinzu.

### Semantik des PI-Fallbacks ändert sich nicht

Die Auswahl des Harness bleibt wie bisher:

- `runtime: "pi"` erzwingt PI
- `runtime: "codex"` wählt das registrierte Codex-Harness
- `runtime: "auto"` erlaubt Plugin-Harnesses, unterstützte Provider zu beanspruchen
- `fallback: "none"` deaktiviert den PI-Fallback, wenn kein Plugin-Harness passt

Diese Arbeit ändert, was passiert, nachdem das Codex-Harness ausgewählt wurde.

## Implementierungsplan

### 1. Wiederverwendbare Attempt-Helfer der Kontext-Engine exportieren oder verschieben

Heute liegen die wiederverwendbaren Lebenszyklus-Helfer im PI-Runner:

- `src/agents/pi-embedded-runner/run/attempt.context-engine-helpers.ts`
- `src/agents/pi-embedded-runner/run/attempt.prompt-helpers.ts`
- `src/agents/pi-embedded-runner/context-engine-maintenance.ts`

Codex sollte, wenn möglich, nicht aus einem Implementierungspfad importieren, dessen Name PI impliziert.

Erstellen Sie ein harness-neutrales Modul, zum Beispiel:

- `src/agents/harness/context-engine-lifecycle.ts`

Verschieben oder re-exportieren Sie:

- `runAttemptContextEngineBootstrap`
- `assembleAttemptContextEngine`
- `finalizeAttemptContextEngineTurn`
- `buildAfterTurnRuntimeContext`
- `buildAfterTurnRuntimeContextFromUsage`
- einen kleinen Wrapper um `runContextEngineMaintenance`

Halten Sie PI-Importe funktionsfähig, entweder durch Re-Export aus den alten Dateien oder durch Aktualisierung der PI-Callsites im selben PR.

Die neutralen Hilfsnamen sollten PI nicht erwähnen.

Vorgeschlagene Namen:

- `bootstrapHarnessContextEngine`
- `assembleHarnessContextEngine`
- `finalizeHarnessContextEngineTurn`
- `buildHarnessContextEngineRuntimeContext`
- `runHarnessContextEngineMaintenance`

### 2. Einen Codex-Kontextions-Projektionshelfer hinzufügen

Fügen Sie ein neues Modul hinzu:

- `extensions/codex/src/app-server/context-engine-projection.ts`

Verantwortlichkeiten:

- Das zusammengestellte `AgentMessage[]`, die ursprüngliche gespiegelte Historie und den aktuellen
  Prompt akzeptieren.
- Bestimmen, welcher Kontext in Entwickleranweisungen und welcher in die aktuelle
  Benutzereingabe gehört.
- Den aktuellen Benutzer-Prompt als die letzte ausführbare Anfrage beibehalten.
- Vorherige Nachrichten in einem stabilen, expliziten Format rendern.
- Flüchtige Metadaten vermeiden.

Vorgeschlagene API:

```ts
export type CodexContextProjection = {
  developerInstructionAddition?: string;
  promptText: string;
  assembledMessages: AgentMessage[];
  prePromptMessageCount: number;
};

export function projectContextEngineAssemblyForCodex(params: {
  assembledMessages: AgentMessage[];
  originalHistoryMessages: AgentMessage[];
  prompt: string;
  systemPromptAddition?: string;
}): CodexContextProjection;
```

Empfohlene erste Projektion:

- `systemPromptAddition` in Entwickleranweisungen aufnehmen.
- Den zusammengestellten Transkript-Kontext vor den aktuellen Prompt in `promptText` setzen.
- Ihn klar als von OpenClaw zusammengestellten Kontext kennzeichnen.
- Den aktuellen Prompt zuletzt beibehalten.
- Den doppelten aktuellen Benutzer-Prompt ausschließen, wenn er bereits am Ende erscheint.

Beispiel für die Prompt-Struktur:

```text
OpenClaw assembled context for this turn:

<conversation_context>
[user]
...

[assistant]
...
</conversation_context>

Current user request:
...
```

Das ist weniger elegant als native Eingriffe in die Codex-Historie, aber es ist innerhalb von OpenClaw implementierbar und bewahrt die Semantik der Kontext-Engine.

Zukünftige Verbesserung: Wenn der Codex-App-Server ein Protokoll zum Ersetzen oder
Ergänzen der Thread-Historie bereitstellt, tauschen Sie diese Projektionsschicht aus, um diese API zu verwenden.

### 3. Bootstrap vor dem Start des Codex-Threads verdrahten

In `extensions/codex/src/app-server/run-attempt.ts`:

- Die gespiegelte Sitzungshistorie wie heute lesen.
- Bestimmen, ob die Sitzungsdatei vor diesem Lauf existiert hat. Bevorzugen Sie einen Helfer,
  der `fs.stat(params.sessionFile)` vor dem Schreiben durch das Spiegeln prüft.
- Einen `SessionManager` öffnen oder einen schmalen Session-Manager-Adapter verwenden, wenn der Helfer
  dies erfordert.
- Den neutralen Bootstrap-Helfer aufrufen, wenn `params.contextEngine` existiert.

Pseudo-Ablauf:

```ts
const hadSessionFile = await fileExists(params.sessionFile);
const sessionManager = SessionManager.open(params.sessionFile);
const historyMessages = sessionManager.buildSessionContext().messages;

await bootstrapHarnessContextEngine({
  hadSessionFile,
  contextEngine: params.contextEngine,
  sessionId: params.sessionId,
  sessionKey: sandboxSessionKey,
  sessionFile: params.sessionFile,
  sessionManager,
  runtimeContext: buildHarnessContextEngineRuntimeContext(...),
  runMaintenance: runHarnessContextEngineMaintenance,
  warn,
});
```

Verwenden Sie dieselbe `sessionKey`-Konvention wie die Codex-Tool-Bridge und das Transkript-
Spiegeln. Heute berechnet Codex `sandboxSessionKey` aus `params.sessionKey` oder
`params.sessionId`; verwenden Sie das konsistent, sofern es keinen Grund gibt, den rohen `params.sessionKey` beizubehalten.

### 4. Assemble vor `thread/start` / `thread/resume` und `turn/start` verdrahten

In `runCodexAppServerAttempt`:

1. Zuerst dynamische Tools aufbauen, damit die Kontext-Engine die tatsächlich verfügbaren
   Tool-Namen sieht.
2. Die gespiegelte Sitzungshistorie lesen.
3. `assemble(...)` der Kontext-Engine ausführen, wenn `params.contextEngine` existiert.
4. Das zusammengestellte Ergebnis projizieren in:
   - Ergänzung der Entwickleranweisungen
   - Prompt-Text für `turn/start`

Der bestehende Hook-Aufruf:

```ts
resolveAgentHarnessBeforePromptBuildResult({
  prompt: params.prompt,
  developerInstructions: buildDeveloperInstructions(params),
  messages: historyMessages,
  ctx: hookContext,
});
```

soll kontextbewusst werden:

1. Basis-Entwickleranweisungen mit `buildDeveloperInstructions(params)` berechnen
2. Kontext-Engine-Assembly/Projektion anwenden
3. `before_prompt_build` mit dem projizierten Prompt/den projizierten Entwickleranweisungen ausführen

Diese Reihenfolge lässt generische Prompt-Hooks denselben Prompt sehen, den Codex erhalten wird. Wenn
wir strikte PI-Parität benötigen, führen Sie die Assembly der Kontext-Engine vor der Hook-Komposition aus,
weil PI `systemPromptAddition` der Kontext-Engine nach seiner Prompt-Pipeline auf den finalen System-
Prompt anwendet. Die wichtige Invariante ist, dass sowohl Kontext-Engine als auch Hooks eine
deterministische, dokumentierte Reihenfolge erhalten.

Empfohlene Reihenfolge für die erste Implementierung:

1. `buildDeveloperInstructions(params)`
2. Kontext-Engine `assemble()`
3. `systemPromptAddition` an Entwickleranweisungen anhängen/voranstellen
4. Zusammengestellte Nachrichten in Prompt-Text projizieren
5. `resolveAgentHarnessBeforePromptBuildResult(...)`
6. Finale Entwickleranweisungen an `startOrResumeThread(...)` übergeben
7. Finalen Prompt-Text an `buildTurnStartParams(...)` übergeben

Die Spezifikation sollte in Tests kodiert werden, damit zukünftige Änderungen die Reihenfolge nicht versehentlich ändern.

### 5. Stabiles Format für den Prompt-Cache erhalten

Der Projektionshelfer muss bei identischen Eingaben byte-stabile Ausgabe erzeugen:

- stabile Nachrichtenreihenfolge
- stabile Rollenbezeichnungen
- keine generierten Zeitstempel
- kein Durchsickern von Objekt-Schlüsselreihenfolgen
- keine zufälligen Trennzeichen
- keine IDs pro Lauf

Verwenden Sie feste Trennzeichen und explizite Abschnitte.

### 6. Nach dem Spiegeln des Transkripts Post-Turn verdrahten

Der `CodexAppServerEventProjector` von Codex erstellt einen lokalen `messagesSnapshot` für den
aktuellen Turn. `mirrorTranscriptBestEffort(...)` schreibt diesen Snapshot in den
gespiegelten OpenClaw-Transkriptstatus.

Nachdem das Spiegeln erfolgreich war oder fehlgeschlagen ist, rufen Sie den Finalizer der Kontext-Engine mit dem
best verfügbaren Nachrichtensnapshot auf:

- Bevorzugen Sie den vollständigen gespiegelten Sitzungskontext nach dem Schreiben, weil `afterTurn`
  den Sitzungs-Snapshot erwartet, nicht nur den aktuellen Turn.
- Greifen Sie auf `historyMessages + result.messagesSnapshot` zurück, wenn die Sitzungsdatei
  nicht erneut geöffnet werden kann.

Pseudo-Ablauf:

```ts
const prePromptMessageCount = historyMessages.length;
await mirrorTranscriptBestEffort(...);
const finalMessages = readMirroredSessionHistoryMessages(params.sessionFile)
  ?? [...historyMessages, ...result.messagesSnapshot];

await finalizeHarnessContextEngineTurn({
  contextEngine: params.contextEngine,
  promptError: Boolean(finalPromptError),
  aborted: finalAborted,
  yieldAborted,
  sessionIdUsed: params.sessionId,
  sessionKey: sandboxSessionKey,
  sessionFile: params.sessionFile,
  messagesSnapshot: finalMessages,
  prePromptMessageCount,
  tokenBudget: params.contextTokenBudget,
  runtimeContext: buildHarnessContextEngineRuntimeContextFromUsage({
    attempt: params,
    workspaceDir: effectiveWorkspace,
    agentDir,
    tokenBudget: params.contextTokenBudget,
    lastCallUsage: result.attemptUsage,
    promptCache: result.promptCache,
  }),
  runMaintenance: runHarnessContextEngineMaintenance,
  sessionManager,
  warn,
});
```

Wenn das Spiegeln fehlschlägt, rufen Sie `afterTurn` trotzdem mit dem Fallback-Snapshot auf, protokollieren Sie jedoch,
dass die Kontext-Engine aus Fallback-Turn-Daten ingestiert.

### 7. Usage und Prompt-Cache-Laufzeitkontext normalisieren

Codex-Ergebnisse enthalten normalisierte Usage aus Token-Benachrichtigungen des App-Servers, wenn
verfügbar. Übergeben Sie diese Usage in den Laufzeitkontext der Kontext-Engine.

Wenn der Codex-App-Server irgendwann Cache-Lese-/Schreibdetails bereitstellt, mappen Sie diese in
`ContextEnginePromptCacheInfo`. Bis dahin lassen Sie `promptCache` weg, statt Nullen zu erfinden.

### 8. Compaction-Richtlinie

Es gibt zwei Compaction-Systeme:

1. `compact()` der OpenClaw-Kontext-Engine
2. native `thread/compact/start` des Codex-App-Servers

Vermischen Sie diese nicht stillschweigend.

#### `/compact` und explizite OpenClaw-Compaction

Wenn die ausgewählte Kontext-Engine `info.ownsCompaction === true` hat, soll explizite
OpenClaw-Compaction das Ergebnis von `compact()` der Kontext-Engine für den
gespiegelten OpenClaw-Transkriptstatus und den Plugin-Status bevorzugen.

Wenn das ausgewählte Codex-Harness eine native Thread-Bindung hat, können wir zusätzlich
native Codex-Compaction anfordern, um den Thread des App-Servers gesund zu halten, aber dies
muss in den Details als separate Backend-Aktion gemeldet werden.

Empfohlenes Verhalten:

- Wenn `contextEngine.info.ownsCompaction === true`:
  - zuerst `compact()` der Kontext-Engine aufrufen
  - dann nach bestem Bemühen native Codex-Compaction aufrufen, wenn eine Thread-Bindung existiert
  - das Ergebnis der Kontext-Engine als primäres Ergebnis zurückgeben
  - den Status der nativen Codex-Compaction in `details.codexNativeCompaction` aufnehmen
- Wenn die aktive Kontext-Engine keine Compaction besitzt:
  - aktuelles Verhalten der nativen Codex-Compaction beibehalten

Dies erfordert wahrscheinlich eine Änderung an `extensions/codex/src/app-server/compact.ts` oder
dessen Umhüllung vom generischen Compaction-Pfad aus, je nachdem, wo
`maybeCompactAgentHarnessSession(...)` aufgerufen wird.

#### In-Turn-`contextCompaction`-Ereignisse von Codex

Codex kann während eines Turns `contextCompaction`-Item-Ereignisse ausgeben. Behalten Sie die aktuelle
Ausgabe von Hooks vor/nach der Compaction in `event-projector.ts` bei, behandeln Sie dies aber nicht
als abgeschlossene Compaction der Kontext-Engine.

Für Engines, die Compaction besitzen, geben Sie eine explizite Diagnose aus, wenn Codex trotzdem
native Compaction ausführt:

- Stream-/Ereignisname: bestehender `compaction`-Stream ist akzeptabel
- Details: `{ backend: "codex-app-server", ownsCompaction: true }`

Dadurch wird die Trennung auditierbar.

### 9. Verhalten bei Sitzungsreset und Bindung

Das bestehende `reset(...)` des Codex-Harness löscht die Bindung des Codex-App-Servers aus
der OpenClaw-Sitzungsdatei. Behalten Sie dieses Verhalten bei.

Stellen Sie außerdem sicher, dass die Bereinigung des Status der Kontext-Engine weiterhin über bestehende
OpenClaw-Sitzungslebenszykluspfade erfolgt. Fügen Sie keine Codex-spezifische Bereinigung hinzu, sofern
dem Lebenszyklus der Kontext-Engine derzeit nicht Reset-/Delete-Ereignisse für alle Harnesses fehlen.

### 10. Fehlerbehandlung

Folgen Sie der PI-Semantik:

- Bootstrap-Fehler warnen und fahren fort
- Assemble-Fehler warnen und fallen auf unassembled Pipeline-Nachrichten/Prompt zurück
- `afterTurn`-/Ingest-Fehler warnen und markieren die Finalisierung nach dem Turn als erfolglos
- Wartung läuft nur nach erfolgreichen, nicht abgebrochenen, nicht yield-abgebrochenen Turns
- Compaction-Fehler sollen nicht als frische Prompts erneut versucht werden

Codex-spezifische Ergänzungen:

- Wenn die Kontextprojektion fehlschlägt, warnen und auf den ursprünglichen Prompt zurückfallen.
- Wenn das Spiegeln des Transkripts fehlschlägt, die Finalisierung der Kontext-Engine trotzdem mit
  Fallback-Nachrichten versuchen.
- Wenn native Codex-Compaction fehlschlägt, nachdem die Compaction der Kontext-Engine erfolgreich war,
  soll die gesamte OpenClaw-Compaction nicht fehlschlagen, wenn die Kontext-Engine primär ist.

## Testplan

### Unit-Tests

Fügen Sie Tests unter `extensions/codex/src/app-server` hinzu:

1. `run-attempt.context-engine.test.ts`
   - Codex ruft `bootstrap` auf, wenn eine Sitzungsdatei existiert.
   - Codex ruft `assemble` mit gespiegelten Nachrichten, Token-Budget, Tool-Namen,
     Zitierungsmodus, Modell-ID und Prompt auf.
   - `systemPromptAddition` wird in Entwickleranweisungen aufgenommen.
   - Zusammengestellte Nachrichten werden vor der aktuellen Anfrage in den Prompt projiziert.
   - Codex ruft `afterTurn` nach dem Spiegeln des Transkripts auf.
   - Ohne `afterTurn` ruft Codex `ingestBatch` oder `ingest` pro Nachricht auf.
   - Turn-Wartung läuft nach erfolgreichen Turns.
   - Turn-Wartung läuft nicht bei Prompt-Fehler, Abort oder Yield-Abort.

2. `context-engine-projection.test.ts`
   - stabile Ausgabe bei identischen Eingaben
   - kein doppelter aktueller Prompt, wenn die zusammengestellte Historie ihn enthält
   - behandelt leere Historie
   - erhält Rollenreihenfolge
   - nimmt System-Prompt-Ergänzung nur in Entwickleranweisungen auf

3. `compact.context-engine.test.ts`
   - primäres Ergebnis einer owning Kontext-Engine gewinnt
   - Status der nativen Codex-Compaction erscheint in den Details, wenn ebenfalls versucht
   - nativer Codex-Fehler lässt die Compaction der owning Kontext-Engine nicht fehlschlagen
   - nicht owning Kontext-Engine bewahrt aktuelles natives Compaction-Verhalten

### Bestehende Tests zum Aktualisieren

- `extensions/codex/src/app-server/run-attempt.test.ts`, falls vorhanden, andernfalls
  nächstgelegene Tests für Codex-App-Server-Runs.
- `extensions/codex/src/app-server/event-projector.test.ts` nur, wenn sich Details von Compaction-
  Ereignissen ändern.
- `src/agents/harness/selection.test.ts` sollte keine Änderungen benötigen, sofern sich das Konfigurations-
  Verhalten nicht ändert; es sollte stabil bleiben.
- PI-Tests zur Kontext-Engine sollen unverändert weiter bestehen.

### Integrations-/Live-Tests

Fügen Sie Smoke-Tests für das Live-Codex-Harness hinzu oder erweitern Sie sie:

- `plugins.slots.contextEngine` auf eine Test-Engine konfigurieren
- `agents.defaults.model` auf ein `codex/*`-Modell konfigurieren
- `agents.defaults.embeddedHarness.runtime = "codex"` konfigurieren
- verifizieren, dass die Test-Engine beobachtet hat:
  - Bootstrap
  - Assemble
  - `afterTurn` oder Ingest
  - Wartung

Vermeiden Sie, dass `lossless-claw` in OpenClaw-Core-Tests erforderlich ist. Verwenden Sie ein kleines
Fake-Plugin für die Kontext-Engine im Repository.

## Beobachtbarkeit

Fügen Sie Debug-Logs um die Lebenszyklusaufrufe der Codex-Kontext-Engine hinzu:

- `codex context engine bootstrap started/completed/failed`
- `codex context engine assemble applied`
- `codex context engine finalize completed/failed`
- `codex context engine maintenance skipped` mit Grund
- `codex native compaction completed alongside context-engine compaction`

Vermeiden Sie das Protokollieren vollständiger Prompts oder Transkriptinhalte.

Fügen Sie, wo nützlich, strukturierte Felder hinzu:

- `sessionId`
- `sessionKey` redigiert oder weggelassen entsprechend bestehender Logging-Praxis
- `engineId`
- `threadId`
- `turnId`
- `assembledMessageCount`
- `estimatedTokens`
- `hasSystemPromptAddition`

## Migration / Kompatibilität

Dies sollte rückwärtskompatibel sein:

- Wenn keine Kontext-Engine konfiguriert ist, soll das Legacy-Verhalten der Kontext-Engine
  dem heutigen Verhalten des Codex-Harness entsprechen.
- Wenn `assemble` der Kontext-Engine fehlschlägt, soll Codex mit dem ursprünglichen
  Prompt-Pfad fortfahren.
- Bestehende Codex-Thread-Bindungen sollen gültig bleiben.
- Dynamic-Tool-Fingerprinting soll keine Ausgabe der Kontext-Engine enthalten; andernfalls
  könnte jede Kontextänderung einen neuen Codex-Thread erzwingen. Nur der Tool-Katalog
  soll den dynamischen Tool-Fingerprint beeinflussen.

## Offene Fragen

1. Soll der zusammengestellte Kontext vollständig in den Benutzer-Prompt, vollständig
   in die Entwickleranweisungen oder aufgeteilt injiziert werden?

   Empfehlung: aufteilen. `systemPromptAddition` in Entwickleranweisungen;
   zusammengestellten Transkript-Kontext in den Wrapper des Benutzer-Prompts. Das passt am besten
   zum aktuellen Codex-Protokoll, ohne die native Thread-Historie zu verändern.

2. Soll native Codex-Compaction deaktiviert werden, wenn eine Kontext-Engine
   Compaction besitzt?

   Empfehlung: nein, zumindest anfänglich nicht. Native Codex-Compaction kann weiterhin
   erforderlich sein, um den Thread des App-Servers am Leben zu halten. Sie muss aber als
   native Codex-Compaction gemeldet werden, nicht als Compaction der Kontext-Engine.

3. Soll `before_prompt_build` vor oder nach der Assembly der Kontext-Engine laufen?

   Empfehlung: nach der Projektion der Kontext-Engine für Codex, damit generische Harness-
   Hooks den tatsächlichen Prompt/die tatsächlichen Entwickleranweisungen sehen, die Codex erhalten wird. Wenn PI-
   Parität das Gegenteil erfordert, kodieren Sie die gewählte Reihenfolge in Tests und dokumentieren Sie sie
   hier.

4. Kann der Codex-App-Server künftig eine strukturierte Überschreibung von Kontext/Historie akzeptieren?

   Unbekannt. Wenn ja, ersetzen Sie die Text-Projektionsschicht durch dieses Protokoll und
   lassen Sie die Lebenszyklusaufrufe unverändert.

## Akzeptanzkriterien

- Ein eingebetteter Harness-Turn mit `codex/*` ruft den Assemble-Lebenszyklus der ausgewählten Kontext-Engine auf.
- Eine `systemPromptAddition` der Kontext-Engine beeinflusst die Entwickleranweisungen von Codex.
- Zusammengestellter Kontext beeinflusst die Eingabe des Codex-Turns deterministisch.
- Erfolgreiche Codex-Turns rufen `afterTurn` oder Ingest-Fallback auf.
- Erfolgreiche Codex-Turns führen die Turn-Wartung der Kontext-Engine aus.
- Fehlgeschlagene/abgebrochene/yield-abgebrochene Turns führen keine Turn-Wartung aus.
- Compaction einer Kontext-Engine, die Compaction besitzt, bleibt primär für Status von OpenClaw/Plugin.
- Native Codex-Compaction bleibt als natives Codex-Verhalten auditierbar.
- Bestehendes Verhalten der PI-Kontext-Engine bleibt unverändert.
- Bestehendes Verhalten des Codex-Harness bleibt unverändert, wenn keine Kontext-Engine ohne Legacy
  ausgewählt ist oder wenn Assembly fehlschlägt.
