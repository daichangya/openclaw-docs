---
read_when:
    - QA-Szenariodefinitionen oder den qa-lab-Harness-Code refaktorieren
    - QA-Verhalten zwischen Markdown-Szenarien und TypeScript-Harness-Logik verschieben
summary: QA-Refaktorierungsplan für Szenariokatalog und Harness-Konsolidierung
title: QA-Refaktorierung
x-i18n:
    generated_at: "2026-04-23T14:07:14Z"
    model: gpt-5.4
    provider: openai
    source_hash: 16867d5be372ab414aa516144193144414c326ea53a52627f3ff91f85b8fdf9d
    source_path: refactor/qa.md
    workflow: 15
---

# QA-Refaktorierung

Status: grundlegende Migration ist abgeschlossen.

## Ziel

OpenClaw QA von einem Modell mit geteilten Definitionen zu einer einzigen Quelle der Wahrheit umstellen:

- Szenario-Metadaten
- an das Modell gesendete Prompts
- Setup und Teardown
- Harness-Logik
- Assertions und Erfolgskriterien
- Artefakte und Hinweise für Berichte

Der angestrebte Endzustand ist ein generischer QA-Harness, der leistungsfähige Szenariodefinitionsdateien lädt, statt den Großteil des Verhaltens in TypeScript fest zu codieren.

## Aktueller Stand

Die primäre Quelle der Wahrheit liegt jetzt in `qa/scenarios/index.md` plus einer Datei pro
Szenario unter `qa/scenarios/<theme>/*.md`.

Implementiert:

- `qa/scenarios/index.md`
  - kanonische Metadaten des QA-Pakets
  - Operator-Identität
  - Startmission
- `qa/scenarios/<theme>/*.md`
  - eine Markdown-Datei pro Szenario
  - Szenario-Metadaten
  - Handler-Bindings
  - szenariospezifische Ausführungskonfiguration
- `extensions/qa-lab/src/scenario-catalog.ts`
  - Markdown-Paket-Parser + zod-Validierung
- `extensions/qa-lab/src/qa-agent-bootstrap.ts`
  - Plan-Rendering aus dem Markdown-Paket
- `extensions/qa-lab/src/qa-agent-workspace.ts`
  - erzeugt generierte Kompatibilitätsdateien plus `QA_SCENARIOS.md`
- `extensions/qa-lab/src/suite.ts`
  - wählt ausführbare Szenarien über in Markdown definierte Handler-Bindings aus
- QA-Bus-Protokoll + UI
  - generische Inline-Anhänge für Bild-/Video-/Audio-/Datei-Rendering

Verbleibende geteilte Oberflächen:

- `extensions/qa-lab/src/suite.ts`
  - besitzt weiterhin den Großteil der ausführbaren benutzerdefinierten Handler-Logik
- `extensions/qa-lab/src/report.ts`
  - leitet die Berichtsstruktur weiterhin aus Laufzeitausgaben ab

Die Aufteilung der Quelle der Wahrheit ist also behoben, aber die Ausführung ist weiterhin überwiegend handlergestützt und noch nicht vollständig deklarativ.

## Wie die echte Szenariooberfläche aussieht

Das Lesen der aktuellen Suite zeigt einige unterschiedliche Szenarioklassen.

### Einfache Interaktion

- Kanal-Baseline
- DM-Baseline
- Threaded Follow-up
- Model-Wechsel
- Approval-Followthrough
- Reaction/Edit/Delete

### Konfigurations- und Laufzeitmutation

- Deaktivierung von Skills per Config-Patch
- config apply restart wake-up
- config restart capability flip
- Laufzeit-Inventardrift-Prüfung

### Dateisystem- und Repo-Assertions

- Bericht zur Source-/Docs-Erkennung
- Lobster Invaders bauen
- generierte Bildartefakte nachschlagen

### Memory-Orchestrierung

- Memory-Recall
- Memory-Tools im Kanalkontext
- Memory-Failure-Fallback
- Ranking von Session-Memory
- Thread-Memory-Isolation
- Memory-Dreaming-Sweep

### Tool- und Plugin-Integration

- MCP plugin-tools call
- Skill-Sichtbarkeit
- Skill-Hot-Install
- native Bildgenerierung
- Bild-Roundtrip
- Bildverständnis aus Anhang

### Mehrere Züge und mehrere Akteure

- Subagent-Handoff
- Subagent-Fanout-Synthese
- Flows im Stil von Restart-Recovery

Diese Kategorien sind wichtig, weil sie die DSL-Anforderungen bestimmen. Eine flache Liste aus Prompt + erwartetem Text reicht nicht aus.

## Richtung

### Eine einzige Quelle der Wahrheit

Verwenden Sie `qa/scenarios/index.md` plus `qa/scenarios/<theme>/*.md` als verfasste
Quelle der Wahrheit.

Das Paket sollte bleiben:

- für Reviews gut lesbar
- maschinenlesbar
- reich genug, um Folgendes zu steuern:
  - Suite-Ausführung
  - Bootstrap des QA-Workspace
  - Metadaten der QA-Lab-UI
  - Docs-/Discovery-Prompts
  - Berichtserzeugung

### Bevorzugtes Authoring-Format

Verwenden Sie Markdown als Top-Level-Format, mit strukturiertem YAML darin.

Empfohlene Form:

- YAML-Frontmatter
  - id
  - title
  - surface
  - tags
  - docs refs
  - code refs
  - model-/provider-overrides
  - prerequisites
- Prosa-Abschnitte
  - objective
  - notes
  - debugging hints
- eingefasste YAML-Blöcke
  - setup
  - steps
  - assertions
  - cleanup

Das liefert:

- bessere Lesbarkeit in PRs als riesiges JSON
- reicheren Kontext als reines YAML
- striktes Parsing und zod-Validierung

Rohes JSON ist nur als Zwischenformat für generierte Daten akzeptabel.

## Vorgeschlagene Form der Szenariodatei

Beispiel:

````md
---
id: image-generation-roundtrip
title: Bildgenerierungs-Roundtrip
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

# Ziel

Prüfen, dass generierte Medien im Folgezug erneut angehängt werden.

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

# Schritte

```yaml scenario.steps
- action: agent.send
  session: agent:qa:image-roundtrip
  message: |
    Prüfung der Bildgenerierung: Erzeuge ein QA-Leuchtturm-Bild und fasse es in einem kurzen Satz zusammen.
- action: artifact.capture
  kind: generated-image
  promptSnippet: Prüfung der Bildgenerierung
  saveAs: lighthouseImage
- action: agent.send
  session: agent:qa:image-roundtrip
  message: |
    Prüfung der Roundtrip-Bildinspektion: Beschreibe den generierten Leuchtturm-Anhang in einem kurzen Satz.
  attachments:
    - fromArtifact: lighthouseImage
```

# Erwartung

```yaml scenario.expect
- assert: outbound.textIncludes
  value: lighthouse
- assert: requestLog.matches
  where:
    promptIncludes: Prüfung der Roundtrip-Bildinspektion
  imageInputCountGte: 1
- assert: artifact.exists
  ref: lighthouseImage
```
````

## Runner-Fähigkeiten, die die DSL abdecken muss

Basierend auf der aktuellen Suite braucht der generische Runner mehr als nur Prompt-Ausführung.

### Umgebungs- und Setup-Aktionen

- `bus.reset`
- `gateway.waitHealthy`
- `channel.waitReady`
- `session.create`
- `thread.create`
- `workspace.writeSkill`

### Agent-Zug-Aktionen

- `agent.send`
- `agent.wait`
- `bus.injectInbound`
- `bus.injectOutbound`

### Konfigurations- und Laufzeitaktionen

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

## Variablen und Artefaktverweise

Die DSL muss gespeicherte Ausgaben und spätere Verweise unterstützen.

Beispiele aus der aktuellen Suite:

- einen Thread erstellen und dann `threadId` wiederverwenden
- eine Sitzung erstellen und dann `sessionKey` wiederverwenden
- ein Bild generieren und die Datei im nächsten Zug anhängen
- eine Wake-Markierungszeichenfolge erzeugen und dann später prüfen, dass sie erscheint

Benötigte Fähigkeiten:

- `saveAs`
- `${vars.name}`
- `${artifacts.name}`
- typisierte Verweise für Pfade, Sitzungsschlüssel, Thread-IDs, Marker, Tool-Ausgaben

Ohne Variablenunterstützung wird der Harness weiterhin Szenariologik zurück in TypeScript lecken lassen.

## Was als Escape Hatches bleiben sollte

Ein vollständig rein deklarativer Runner ist in Phase 1 nicht realistisch.

Einige Szenarien sind von Natur aus stark orchestrierungsintensiv:

- Memory-Dreaming-Sweep
- config apply restart wake-up
- config restart capability flip
- Auflösung generierter Bildartefakte nach Zeitstempel/Pfad
- Auswertung von Discovery-Reports

Diese sollten vorerst explizite benutzerdefinierte Handler verwenden.

Empfohlene Regel:

- 85–90 % deklarativ
- explizite `customHandler`-Schritte für den schwierigen Rest
- nur benannte und dokumentierte benutzerdefinierte Handler
- kein anonymer Inline-Code in der Szenariodatei

So bleibt die generische Engine sauber und Fortschritt ist trotzdem möglich.

## Architekturänderung

### Aktuell

Szenario-Markdown ist bereits die Quelle der Wahrheit für:

- Suite-Ausführung
- Bootstrap-Dateien des Workspace
- QA-Lab-UI-Szenariokatalog
- Berichtsmetadaten
- Discovery-Prompts

Generierte Kompatibilität:

- der erzeugte Workspace enthält weiterhin `QA_KICKOFF_TASK.md`
- der erzeugte Workspace enthält weiterhin `QA_SCENARIO_PLAN.md`
- der erzeugte Workspace enthält jetzt zusätzlich `QA_SCENARIOS.md`

## Refaktorierungsplan

### Phase 1: Loader und Schema

Abgeschlossen.

- `qa/scenarios/index.md` hinzugefügt
- Szenarien in `qa/scenarios/<theme>/*.md` aufgeteilt
- Parser für benannten Markdown-YAML-Paketinhalt hinzugefügt
- mit zod validiert
- Consumer auf das geparste Paket umgestellt
- `qa/seed-scenarios.json` und `qa/QA_KICKOFF_TASK.md` auf Repo-Ebene entfernt

### Phase 2: generische Engine

- `extensions/qa-lab/src/suite.ts` aufteilen in:
  - loader
  - engine
  - action registry
  - assertion registry
  - custom handlers
- bestehende Hilfsfunktionen als Engine-Operationen beibehalten

Ergebnis:

- Engine führt einfache deklarative Szenarien aus

Mit Szenarien beginnen, die überwiegend prompt + wait + assert sind:

- threaded follow-up
- image understanding from attachment
- skill visibility and invocation
- channel baseline

Ergebnis:

- erste echte in Markdown definierte Szenarien, die über die generische Engine ausgeliefert werden

### Phase 4: mittlere Szenarien migrieren

- image generation roundtrip
- memory tools in channel context
- session memory ranking
- subagent handoff
- subagent fanout synthesis

Ergebnis:

- Variablen, Artefakte, Tool-Assertions, Request-Log-Assertions sind nachgewiesen

### Phase 5: schwierige Szenarien auf benutzerdefinierten Handlern belassen

- memory dreaming sweep
- config apply restart wake-up
- config restart capability flip
- runtime inventory drift

Ergebnis:

- gleiches Authoring-Format, aber mit expliziten custom-step-Blöcken, wo nötig

### Phase 6: hart codierte Szenariomap löschen

Sobald die Paketabdeckung gut genug ist:

- den Großteil des szenariospezifischen TypeScript-Branchings aus `extensions/qa-lab/src/suite.ts` entfernen

## Fake-Slack- / Rich-Media-Unterstützung

Der aktuelle QA-Bus ist textorientiert.

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

Inline-Medienanhänge werden noch nicht modelliert.

### Benötigter Transportvertrag

Ein generisches Modell für QA-Bus-Anhänge hinzufügen:

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

Kein nur für Slack gebautes Medienmodell erstellen.

Stattdessen:

- ein generisches QA-Transportmodell
- mehrere Renderer darauf aufbauend
  - aktueller QA-Lab-Chat
  - zukünftiges Fake-Slack-Web
  - alle anderen Fake-Transportansichten

Das verhindert doppelte Logik und sorgt dafür, dass Medienszenarien transportagnostisch bleiben.

### Erforderliche UI-Arbeit

Die QA-UI aktualisieren, um Folgendes zu rendern:

- Inline-Bildvorschau
- Inline-Audioplayer
- Inline-Videoplayer
- Datei-Anhang-Chip

Die aktuelle UI kann bereits Threads und Reaktionen rendern, daher sollte das Rendern von Anhängen auf dasselbe Nachrichtenkartenmodell aufsetzen.

### Durch Medientransport aktivierte Szenarioarbeit

Sobald Anhänge durch den QA-Bus fließen, können wir reichhaltigere Fake-Chat-Szenarien hinzufügen:

- Inline-Bildantwort in Fake Slack
- Verständnis von Audioanhängen
- Verständnis von Videoanhängen
- gemischte Reihenfolge von Anhängen
- Thread-Antwort mit beibehaltenen Medien

## Empfehlung

Der nächste Implementierungsblock sollte sein:

1. Markdown-Szenario-Loader + zod-Schema hinzufügen
2. den aktuellen Katalog aus Markdown generieren
3. zuerst einige einfache Szenarien migrieren
4. generische QA-Bus-Anhangunterstützung hinzufügen
5. Inline-Bild in der QA-UI rendern
6. dann auf Audio und Video erweitern

Das ist der kleinste Weg, der beide Ziele nachweist:

- generische Markdown-definierte QA
- reichhaltigere Fake-Messaging-Oberflächen

## Offene Fragen

- ob Szenariodateien eingebettete Markdown-Prompt-Templates mit Variableninterpolation erlauben sollten
- ob Setup/Cleanup benannte Abschnitte oder nur geordnete Aktionslisten sein sollten
- ob Artefaktverweise im Schema stark typisiert oder stringbasiert sein sollten
- ob benutzerdefinierte Handler in einer Registry oder in Registries pro Oberfläche liegen sollten
- ob die generierte JSON-Kompatibilitätsdatei während der Migration weiterhin eingecheckt bleiben sollte
