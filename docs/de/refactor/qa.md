---
read_when:
    - Refactoring von QA-Szenariodefinitionen oder qa-lab-Harness-Code
    - Verschieben von QA-Verhalten zwischen Markdown-Szenarien und TypeScript-Harness-Logik
summary: QA-Refactor-Plan für Szenariokatalog und Konsolidierung des Harness
title: QA-Refactor {"path":"/tmp/ignore","content":"ignore"}
x-i18n:
    generated_at: "2026-04-24T06:57:06Z"
    model: gpt-5.4
    provider: openai
    source_hash: 0d774d7b5e0fffd5c2504d9a4d6063198d77b866263ea8448474dce6246012d4
    source_path: refactor/qa.md
    workflow: 15
---

Status: grundlegende Migration ist gelandet.

## Ziel

OpenClaw-QA von einem Modell mit geteilten Definitionen zu einer einzigen Source of Truth verschieben für:

- Szenariometadaten
- an das Modell gesendete Prompts
- Setup und Teardown
- Harness-Logik
- Assertions und Erfolgskriterien
- Artefakte und Report-Hinweise

Der gewünschte Endzustand ist ein generisches QA-Harness, das leistungsfähige Szenariodefinitionsdateien lädt, statt den Großteil des Verhaltens in TypeScript fest zu codieren.

## Aktueller Zustand

Die primäre Source of Truth lebt jetzt in `qa/scenarios/index.md` plus einer Datei pro
Szenario unter `qa/scenarios/<theme>/*.md`.

Implementiert:

- `qa/scenarios/index.md`
  - kanonische QA-Pack-Metadaten
  - Operator-Identität
  - Startmission
- `qa/scenarios/<theme>/*.md`
  - eine Markdown-Datei pro Szenario
  - Szenariometadaten
  - Handler-Bindings
  - szenariospezifische Ausführungskonfiguration
- `extensions/qa-lab/src/scenario-catalog.ts`
  - Markdown-Pack-Parser + zod-Validierung
- `extensions/qa-lab/src/qa-agent-bootstrap.ts`
  - Plan-Rendering aus dem Markdown-Pack
- `extensions/qa-lab/src/qa-agent-workspace.ts`
  - legt generierte Kompatibilitätsdateien plus `QA_SCENARIOS.md` ab
- `extensions/qa-lab/src/suite.ts`
  - wählt ausführbare Szenarien über in Markdown definierte Handler-Bindings aus
- QA-Bus-Protokoll + UI
  - generische Inline-Anhänge für Bild-/Video-/Audio-/Datei-Rendering

Verbleibende geteilte Oberflächen:

- `extensions/qa-lab/src/suite.ts`
  - besitzt weiterhin den Großteil der ausführbaren benutzerdefinierten Handler-Logik
- `extensions/qa-lab/src/report.ts`
  - leitet weiterhin die Report-Struktur aus Runtime-Ausgaben ab

Die Aufteilung der Source of Truth ist also behoben, aber die Ausführung ist weiterhin größtenteils handlergestützt statt vollständig deklarativ.

## Wie die echte Szenariooberfläche aussieht

Das Lesen der aktuellen Suite zeigt einige unterschiedliche Szenarioklassen.

### Einfache Interaktion

- Kanal-Basislinie
- DM-Basislinie
- Threaded Follow-up
- Modellwechsel
- Genehmigungs-Follow-through
- Reaktion/Bearbeiten/Löschen

### Konfigurations- und Runtime-Mutation

- Skill-Deaktivierung per Config-Patch
- config.apply-Neustart-Wakeup
- Capability-Flip per Config-Neustart
- Drift-Prüfung für Runtime-Inventar

### Assertions für Dateisystem und Repository

- Discovery-Report für Source/Dokumentation
- Lobster Invaders bauen
- Lookup generierter Bildartefakte

### Memory-Orchestrierung

- Memory-Recall
- Memory-Tools im Kanalkontext
- Memory-Fallback bei Fehlern
- Ranking von Session-Memory
- Thread-Memory-Isolation
- Memory-Dreaming-Sweep

### Tool- und Plugin-Integration

- MCP-plugin-tools-Aufruf
- Skill-Sichtbarkeit
- Skill-Hot-Install
- native Bilderzeugung
- Bild-Roundtrip
- Bildverständnis aus Anhang

### Mehrere Turns und mehrere Akteure

- Sub-Agent-Handoff
- Synthese über Sub-Agent-Fanout
- Flows zur Wiederherstellung nach Neustart

Diese Kategorien sind wichtig, weil sie die Anforderungen an die DSL bestimmen. Eine flache Liste aus Prompt + erwartetem Text reicht nicht aus.

## Richtung

### Eine einzige Source of Truth

Verwenden Sie `qa/scenarios/index.md` plus `qa/scenarios/<theme>/*.md` als die
verfasste Source of Truth.

Das Pack sollte bleiben:

- für Reviews menschenlesbar
- maschinenparsbar
- reichhaltig genug, um Folgendes zu steuern:
  - Suite-Ausführung
  - Bootstrap des QA-Workspace
  - QA-Lab-UI-Metadaten
  - Docs-/Discovery-Prompts
  - Report-Generierung

### Bevorzugtes Authoring-Format

Verwenden Sie Markdown als Format auf oberster Ebene, mit strukturiertem YAML darin.

Empfohlene Form:

- YAML-Frontmatter
  - id
  - title
  - surface
  - tags
  - docs refs
  - code refs
  - Modell-/Provider-Overrides
  - Voraussetzungen
- Prosa-Abschnitte
  - objective
  - notes
  - debugging hints
- YAML-Blöcke in Fences
  - setup
  - steps
  - assertions
  - cleanup

Das bietet:

- bessere PR-Lesbarkeit als riesiges JSON
- reichhaltigeren Kontext als reines YAML
- striktes Parsing und zod-Validierung

Rohes JSON ist nur als intermediäre generierte Form akzeptabel.

## Vorgeschlagene Form der Szenariodatei

Beispiel:

````md
---
id: image-generation-roundtrip
title: Image generation roundtrip
surface: image
tags: [media, image, roundtrip]
models:
  primary: openai/gpt-5.4
requires:
  tools: [image_generate]
  plugins: [openai, qa-channel]
docsRefs:
  - docs/help/testing.md
  - docs/concepts/model-providers.md
codeRefs:
  - extensions/qa-lab/src/suite.ts
  - src/gateway/chat-attachments.ts
---

# Objective

Verify generated media is reattached on the follow-up turn.

# Setup

```yaml scenario.setup
- action: config.patch
  patch:
    agents:
      defaults:
        imageGenerationModel:
          primary: openai/gpt-image-1
- action: session.create
  key: agent:qa:image-roundtrip
```

# Steps

```yaml scenario.steps
- action: agent.send
  session: agent:qa:image-roundtrip
  message: |
    Image generation check: generate a QA lighthouse image and summarize it in one short sentence.
- action: artifact.capture
  kind: generated-image
  promptSnippet: Image generation check
  saveAs: lighthouseImage
- action: agent.send
  session: agent:qa:image-roundtrip
  message: |
    Roundtrip image inspection check: describe the generated lighthouse attachment in one short sentence.
  attachments:
    - fromArtifact: lighthouseImage
```

# Expect

```yaml scenario.expect
- assert: outbound.textIncludes
  value: lighthouse
- assert: requestLog.matches
  where:
    promptIncludes: Roundtrip image inspection check
  imageInputCountGte: 1
- assert: artifact.exists
  ref: lighthouseImage
```
````

## Runner-Fähigkeiten, die die DSL abdecken muss

Auf Basis der aktuellen Suite braucht der generische Runner mehr als Prompt-Ausführung.

### Umgebungs- und Setup-Aktionen

- `bus.reset`
- `gateway.waitHealthy`
- `channel.waitReady`
- `session.create`
- `thread.create`
- `workspace.writeSkill`

### Aktionen für Agent-Turns

- `agent.send`
- `agent.wait`
- `bus.injectInbound`
- `bus.injectOutbound`

### Konfigurations- und Runtime-Aktionen

- `config.get`
- `config.patch`
- `config.apply`
- `gateway.restart`
- `tools.effective`
- `skills.status`

### Datei- und Artefaktaktionen

- `file.write`
- `file.read`
- `file.delete`
- `file.touchTime`
- `artifact.captureGeneratedImage`
- `artifact.capturePath`

### Memory- und Cron-Aktionen

- `memory.indexForce`
- `memory.searchCli`
- `doctor.memory.status`
- `cron.list`
- `cron.run`
- `cron.waitCompletion`
- `sessionTranscript.write`

### MCP-Aktionen

- `mcp.callTool`

### Assertions

- `outbound.textIncludes`
- `outbound.inThread`
- `outbound.notInRoot`
- `tool.called`
- `tool.notPresent`
- `skill.visible`
- `skill.disabled`
- `file.contains`
- `memory.contains`
- `requestLog.matches`
- `sessionStore.matches`
- `cron.managedPresent`
- `artifact.exists`

## Variablen und Artefakt-Referenzen

Die DSL muss gespeicherte Ausgaben und spätere Referenzen unterstützen.

Beispiele aus der aktuellen Suite:

- einen Thread erstellen und dann `threadId` wiederverwenden
- eine Sitzung erstellen und dann `sessionKey` wiederverwenden
- ein Bild generieren und die Datei im nächsten Turn wieder anhängen
- einen Wake-Marker-String generieren und später prüfen, dass er erscheint

Benötigte Fähigkeiten:

- `saveAs`
- `${vars.name}`
- `${artifacts.name}`
- typisierte Referenzen für Pfade, Sitzungsschlüssel, Thread-IDs, Marker, Tool-Ausgaben

Ohne Variablenunterstützung wird das Harness weiter Szenariologik nach TypeScript zurücklecken.

## Was als Escape Hatches bleiben sollte

Ein vollständig rein deklarativer Runner ist in Phase 1 nicht realistisch.

Einige Szenarien sind von Natur aus stark orchestration-lastig:

- Memory-Dreaming-Sweep
- config.apply-Neustart-Wakeup
- Capability-Flip per Config-Neustart
- Auflösung generierter Bildartefakte anhand von Zeitstempel/Pfad
- Auswertung von Discovery-Reports

Diese sollten vorerst explizite benutzerdefinierte Handler verwenden.

Empfohlene Regel:

- 85–90 % deklarativ
- explizite `customHandler`-Schritte für den schwierigen Rest
- nur benannte und dokumentierte benutzerdefinierte Handler
- kein anonymer Inline-Code in der Szenariodatei

Das hält die generische Engine sauber und ermöglicht dennoch Fortschritt.

## Architekturänderung

### Aktuell

Szenario-Markdown ist bereits die Source of Truth für:

- Suite-Ausführung
- Bootstrap-Dateien des Workspace
- QA-Lab-UI-Szenariokatalog
- Report-Metadaten
- Discovery-Prompts

Generierte Kompatibilität:

- der abgelegte Workspace enthält weiterhin `QA_KICKOFF_TASK.md`
- der abgelegte Workspace enthält weiterhin `QA_SCENARIO_PLAN.md`
- der abgelegte Workspace enthält jetzt zusätzlich `QA_SCENARIOS.md`

## Refactor-Plan

### Phase 1: Loader und Schema

Fertig.

- `qa/scenarios/index.md` hinzugefügt
- Szenarien in `qa/scenarios/<theme>/*.md` aufgeteilt
- Parser für benannte Markdown-YAML-Pack-Inhalte hinzugefügt
- mit zod validiert
- Verbraucher auf das geparste Pack umgestellt
- `qa/seed-scenarios.json` und `qa/QA_KICKOFF_TASK.md` auf Repo-Ebene entfernt

### Phase 2: generische Engine

- `extensions/qa-lab/src/suite.ts` aufteilen in:
  - loader
  - engine
  - action registry
  - assertion registry
  - custom handlers
- bestehende Helper-Funktionen als Engine-Operationen beibehalten

Deliverable:

- Engine führt einfache deklarative Szenarien aus

Beginnen Sie mit Szenarien, die größtenteils aus Prompt + wait + assert bestehen:

- threaded follow-up
- image understanding from attachment
- skill visibility and invocation
- channel baseline

Deliverable:

- erste echte markdowndefinierte Szenarien, die über die generische Engine ausgeliefert werden

### Phase 4: mittlere Szenarien migrieren

- image generation roundtrip
- memory tools in channel context
- session memory ranking
- subagent handoff
- subagent fanout synthesis

Deliverable:

- Variablen, Artefakte, Tool-Assertions, Request-Log-Assertions praktisch bewiesen

### Phase 5: schwierige Szenarien auf benutzerdefinierten Handlern belassen

- memory dreaming sweep
- config apply restart wake-up
- config restart capability flip
- runtime inventory drift

Deliverable:

- dasselbe Authoring-Format, aber mit expliziten Custom-Step-Blöcken, wo nötig

### Phase 6: hart codierte Szenariomap löschen

Sobald die Pack-Abdeckung gut genug ist:

- den Großteil des szenariospezifischen TypeScript-Branching aus `extensions/qa-lab/src/suite.ts` entfernen

## Fake Slack / Rich-Media-Unterstützung

Der aktuelle QA-Bus ist textzentriert.

Relevante Dateien:

- `extensions/qa-channel/src/protocol.ts`
- `extensions/qa-lab/src/bus-state.ts`
- `extensions/qa-lab/src/bus-queries.ts`
- `extensions/qa-lab/src/bus-server.ts`
- `extensions/qa-lab/web/src/ui-render.ts`

Heute unterstützt der QA-Bus:

- Text
- Reaktionen
- Threads

Er modelliert noch keine Inline-Medienanhänge.

### Benötigter Transportvertrag

Ein generisches QA-Bus-Anhangsmodell hinzufügen:

```ts
type QaBusAttachment = {
  id: string;
  kind: "image" | "video" | "audio" | "file";
  mimeType: string;
  fileName?: string;
  inline?: boolean;
  url?: string;
  contentBase64?: string;
  width?: number;
  height?: number;
  durationMs?: number;
  altText?: string;
  transcript?: string;
};
```

Dann `attachments?: QaBusAttachment[]` hinzufügen zu:

- `QaBusMessage`
- `QaBusInboundMessageInput`
- `QaBusOutboundMessageInput`

### Warum zuerst generisch

Kein nur für Slack bestimmtes Medienmodell bauen.

Stattdessen:

- ein generisches QA-Transportmodell
- mehrere Renderer darauf
  - aktueller QA-Lab-Chat
  - zukünftiges Fake-Slack-Web
  - alle anderen zukünftigen Fake-Transport-Ansichten

Das verhindert doppelte Logik und sorgt dafür, dass Medienszenarien transportagnostisch bleiben.

### Benötigte UI-Arbeit

Die QA-UI aktualisieren, damit Folgendes gerendert wird:

- Inline-Bildvorschau
- Inline-Audio-Player
- Inline-Video-Player
- Dateianhang-Chip

Die aktuelle UI kann bereits Threads und Reaktionen rendern, daher sollte sich das Anhangs-Rendering auf dasselbe Message-Card-Modell aufsetzen lassen.

### Szenarioarbeit, die durch Medientransport ermöglicht wird

Sobald Anhänge durch den QA-Bus fließen, können wir reichhaltigere Fake-Chat-Szenarien hinzufügen:

- Inline-Bildantwort in Fake Slack
- Verständnis von Audioanhängen
- Verständnis von Videoanhängen
- gemischte Anhangsreihenfolge
- Thread-Antwort mit beibehaltenen Medien

## Empfehlung

Der nächste Implementierungsblock sollte sein:

1. Markdown-Szenario-Loader + zod-Schema hinzufügen
2. den aktuellen Katalog aus Markdown generieren
3. zuerst einige einfache Szenarien migrieren
4. generische QA-Bus-Anhangsunterstützung hinzufügen
5. Inline-Bild in der QA-UI rendern
6. dann auf Audio und Video erweitern

Das ist der kleinste Pfad, der beide Ziele beweist:

- generisches markdowndefiniertes QA
- reichhaltigere Fake-Messaging-Oberflächen

## Offene Fragen

- ob Szenariodateien eingebettete Markdown-Prompt-Templates mit Variableninterpolation zulassen sollten
- ob Setup/Cleanup benannte Abschnitte sein sollten oder einfach geordnete Aktionslisten
- ob Artefakt-Referenzen im Schema stark typisiert oder stringbasiert sein sollten
- ob benutzerdefinierte Handler in einer Registry oder in oberflächenbezogenen Registries leben sollten
- ob die generierte JSON-Kompatibilitätsdatei während der Migration weiter eingecheckt bleiben sollte

## Verwandt

- [QA-E2E-Automatisierung](/de/concepts/qa-e2e-automation)
