---
read_when:
    - Sie debuggen Provider-Ablehnungen von Requests, die mit der Form des Transcripts zusammenhängen.
    - Sie ändern die Bereinigung von Transcripts oder die Reparaturlogik für Tool-Aufrufe.
    - Sie untersuchen Mismatches von Tool-Call-IDs über Provider hinweg.
summary: 'Referenz: providerspezifische Regeln zur Bereinigung und Reparatur von Transcripts'
title: Transcript-Hygiene
x-i18n:
    generated_at: "2026-04-24T06:59:24Z"
    model: gpt-5.4
    provider: openai
    source_hash: c206186f2c4816775db0f2c4663f07f5a55831a8920d1d0261ff9998bd82efc0
    source_path: reference/transcript-hygiene.md
    workflow: 15
---

# Transcript-Hygiene (Provider-Fixups)

Dieses Dokument beschreibt **providerspezifische Korrekturen**, die vor einem Lauf
(Erstellung des Modellkontexts) auf Transcripts angewendet werden. Diese Hygiene-Schritte sind **im Arbeitsspeicher**
vorgenommene Anpassungen, um strenge Anforderungen von Providern zu erfüllen. Diese Hygiene-Schritte
schreiben das auf der Festplatte gespeicherte JSONL-Transcript **nicht** um; ein separater Reparaturdurchlauf für Sitzungsdateien kann jedoch fehlerhafte JSONL-Dateien umschreiben,
indem ungültige Zeilen verworfen werden, bevor die Sitzung geladen wird. Wenn eine Reparatur erfolgt,
wird die Originaldatei neben der Sitzungsdatei gesichert.

Der Umfang umfasst:

- Bereinigung von Tool-Call-IDs
- Validierung von Tool-Call-Eingaben
- Reparatur der Zuordnung von Tool-Ergebnissen
- Turn-Validierung / Reihenfolge
- Bereinigung von Thought-Signaturen
- Bereinigung von Bildnutzlasten
- Provenienz-Tagging von Benutzereingaben (für inter-sitzungsgeroutete Prompts)

Wenn Sie Details zur Speicherung von Transcripts benötigen, siehe:

- [/reference/session-management-compaction](/de/reference/session-management-compaction)

---

## Wo dies ausgeführt wird

Die gesamte Transcript-Hygiene ist im eingebetteten Runner zentralisiert:

- Richtlininauswahl: `src/agents/transcript-policy.ts`
- Anwendung von Bereinigung/Reparatur: `sanitizeSessionHistory` in `src/agents/pi-embedded-runner/replay-history.ts`

Die Richtlinie verwendet `provider`, `modelApi` und `modelId`, um zu entscheiden, was angewendet wird.

Getrennt von der Transcript-Hygiene werden Sitzungsdateien vor dem Laden (falls nötig) repariert:

- `repairSessionFileIfNeeded` in `src/agents/session-file-repair.ts`
- Aufgerufen von `run/attempt.ts` und `compact.ts` (eingebetteter Runner)

---

## Globale Regel: Bildbereinigung

Bildnutzlasten werden immer bereinigt, um Ablehnungen auf Provider-Seite aufgrund von Größenlimits
zu verhindern (zu große Base64-Bilder werden herunterskaliert/neu komprimiert).

Dies hilft auch, den durch Bilder verursachten Token-Druck für visionfähige Modelle zu kontrollieren.
Kleinere Maximalabmessungen reduzieren im Allgemeinen die Token-Nutzung; größere Abmessungen erhalten mehr Details.

Implementierung:

- `sanitizeSessionMessagesImages` in `src/agents/pi-embedded-helpers/images.ts`
- `sanitizeContentBlocksImages` in `src/agents/tool-images.ts`
- Die maximale Bildkante ist über `agents.defaults.imageMaxDimensionPx` konfigurierbar (Standard: `1200`).

---

## Globale Regel: fehlerhafte Tool-Calls

Assistant-Tool-Call-Blöcke, bei denen sowohl `input` als auch `arguments` fehlen, werden verworfen,
bevor der Modellkontext erstellt wird. Dadurch werden Ablehnungen durch Provider aufgrund teilweise
persistierter Tool-Calls verhindert (zum Beispiel nach einem Rate-Limit-Fehler).

Implementierung:

- `sanitizeToolCallInputs` in `src/agents/session-transcript-repair.ts`
- Angewendet in `sanitizeSessionHistory` in `src/agents/pi-embedded-runner/replay-history.ts`

---

## Globale Regel: Provenienz interner sitzungsübergreifender Eingaben

Wenn ein Agent über `sessions_send` einen Prompt in eine andere Sitzung sendet (einschließlich
Schritten für Antwort/Ankündigung von Agent zu Agent), persistiert OpenClaw den erzeugten User-Turn mit:

- `message.provenance.kind = "inter_session"`

Diese Metadaten werden beim Anhängen an das Transcript geschrieben und ändern nicht die Rolle
(`role: "user"` bleibt aus Kompatibilitätsgründen mit Providern erhalten). Transcript-Reader können dies
verwenden, um geroutete interne Prompts nicht als Anweisungen eines Endbenutzers zu behandeln.

Während des Neuaufbaus des Kontexts stellt OpenClaw diesen User-Turns im Arbeitsspeicher außerdem einen kurzen Marker `[Inter-session message]`
voran, damit das Modell sie von externen Anweisungen des Endbenutzers unterscheiden kann.

---

## Provider-Matrix (aktuelles Verhalten)

**OpenAI / OpenAI Codex**

- Nur Bildbereinigung.
- Verwaiste Reasoning-Signaturen (eigenständige Reasoning-Items ohne nachfolgenden Content-Block) aus OpenAI-Responses-/Codex-Transcripts verwerfen.
- Keine Bereinigung von Tool-Call-IDs.
- Keine Reparatur der Zuordnung von Tool-Ergebnissen.
- Keine Turn-Validierung oder Neuordnung.
- Keine synthetischen Tool-Ergebnisse.
- Kein Entfernen von Thought-Signaturen.

**Google (Generative AI / Gemini CLI / Antigravity)**

- Bereinigung von Tool-Call-IDs: streng alphanumerisch.
- Reparatur der Zuordnung von Tool-Ergebnissen und synthetische Tool-Ergebnisse.
- Turn-Validierung (Turn-Alternation im Stil von Gemini).
- Google-Turn-Reihenfolge-Fixup (stellt ein kleines User-Bootstrap voran, wenn der Verlauf mit Assistant beginnt).
- Antigravity Claude: Thinking-Signaturen normalisieren; unsignierte Thinking-Blöcke verwerfen.

**Anthropic / Minimax (Anthropic-kompatibel)**

- Reparatur der Zuordnung von Tool-Ergebnissen und synthetische Tool-Ergebnisse.
- Turn-Validierung (aufeinanderfolgende User-Turns zusammenführen, um strikte Alternation zu erfüllen).

**Mistral (einschließlich modell-ID-basierter Erkennung)**

- Bereinigung von Tool-Call-IDs: strict9 (alphanumerisch, Länge 9).

**OpenRouter Gemini**

- Bereinigung von Thought-Signaturen: `thought_signature`-Werte entfernen, die nicht Base64 sind (Base64 behalten).

**Alles andere**

- Nur Bildbereinigung.

---

## Historisches Verhalten (vor 2026.1.22)

Vor dem Release 2026.1.22 wandte OpenClaw mehrere Ebenen von Transcript-Hygiene an:

- Eine Erweiterung **transcript-sanitize** lief bei jedem Aufbau des Kontexts und konnte:
  - die Zuordnung von Tool-Nutzung/-Ergebnissen reparieren.
  - Tool-Call-IDs bereinigen (einschließlich eines nicht strengen Modus, der `_`/`-` beibehielt).
- Der Runner führte außerdem providerspezifische Bereinigung aus, was Arbeit duplizierte.
- Zusätzliche Mutationen traten außerhalb der Provider-Richtlinie auf, darunter:
  - Entfernen von `<final>`-Tags aus Assistant-Text vor der Persistierung.
  - Verwerfen leerer Assistant-Error-Turns.
  - Kürzen von Assistant-Inhalten nach Tool-Calls.

Diese Komplexität verursachte providerübergreifende Regressionen (insbesondere bei der Zuordnung von `call_id|fc_id` in `openai-responses`). Die Bereinigung in 2026.1.22 entfernte die Erweiterung, zentralisierte
die Logik im Runner und machte OpenAI **no-touch** über die Bildbereinigung hinaus.

## Verwandt

- [Sitzungsverwaltung](/de/concepts/session)
- [Session Pruning](/de/concepts/session-pruning)
