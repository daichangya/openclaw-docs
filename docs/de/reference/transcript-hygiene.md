---
read_when:
    - Sie debuggen Provider-Ablehnungen von Anfragen, die mit der Form des Transkripts zusammenhängen
    - Sie ändern die Bereinigung von Transkripten oder die Reparaturlogik für Tool-Aufrufe
    - Sie untersuchen Nichtübereinstimmungen von Tool-Call-IDs zwischen Providern
summary: 'Referenz: providerspezifische Regeln zur Bereinigung und Reparatur von Transkripten'
title: Transkript-Hygiene
x-i18n:
    generated_at: "2026-04-05T12:55:38Z"
    model: gpt-5.4
    provider: openai
    source_hash: 217afafb693cf89651e8fa361252f7b5c197feb98d20be4697a83e6dedc0ec3f
    source_path: reference/transcript-hygiene.md
    workflow: 15
---

# Transkript-Hygiene (Provider-Fixups)

Dieses Dokument beschreibt **providerspezifische Korrekturen**, die vor einem Lauf auf Transkripte angewendet werden
(beim Aufbau des Modellkontexts). Diese Anpassungen erfolgen **im Speicher** und dienen dazu, strenge
Anforderungen von Providern zu erfüllen. Diese Hygieneschritte schreiben das gespeicherte JSONL-Transkript
auf der Festplatte **nicht** um; ein separater Reparaturlauf für Sitzungsdateien kann jedoch fehlerhafte JSONL-Dateien
umschreiben, indem ungültige Zeilen vor dem Laden der Sitzung entfernt werden. Wenn eine Reparatur erfolgt, wird die Originaldatei
neben der Sitzungsdatei gesichert.

Zum Umfang gehören:

- Bereinigung von Tool-Call-IDs
- Validierung von Tool-Call-Eingaben
- Reparatur der Zuordnung von Tool-Ergebnissen
- Zugvalidierung / Reihenfolge
- Bereinigung von Thought-Signaturen
- Bereinigung von Bild-Payloads
- Provenienz-Markierung von Benutzereingaben (für sitzungsübergreifend weitergeleitete Prompts)

Wenn Sie Details zur Speicherung von Transkripten benötigen, siehe:

- [/reference/session-management-compaction](/reference/session-management-compaction)

---

## Wo dies ausgeführt wird

Die gesamte Transkript-Hygiene ist im eingebetteten Runner zentralisiert:

- Auswahl der Richtlinie: `src/agents/transcript-policy.ts`
- Anwenden von Bereinigung/Reparatur: `sanitizeSessionHistory` in `src/agents/pi-embedded-runner/google.ts`

Die Richtlinie verwendet `provider`, `modelApi` und `modelId`, um zu entscheiden, was angewendet wird.

Getrennt von der Transkript-Hygiene werden Sitzungsdateien bei Bedarf vor dem Laden repariert:

- `repairSessionFileIfNeeded` in `src/agents/session-file-repair.ts`
- Aufgerufen aus `run/attempt.ts` und `compact.ts` (embedded runner)

---

## Globale Regel: Bildbereinigung

Bild-Payloads werden immer bereinigt, um eine providerseitige Ablehnung aufgrund von Größenbeschränkungen
zu verhindern (Verkleinern/Neu-Komprimieren übergroßer Base64-Bilder).

Dies hilft auch dabei, den durch Bilder verursachten Token-Druck für Vision-fähige Modelle zu kontrollieren.
Niedrigere Maximalabmessungen reduzieren in der Regel die Token-Nutzung; höhere Abmessungen erhalten mehr Details.

Implementierung:

- `sanitizeSessionMessagesImages` in `src/agents/pi-embedded-helpers/images.ts`
- `sanitizeContentBlocksImages` in `src/agents/tool-images.ts`
- Die maximale Bildseitenlänge ist über `agents.defaults.imageMaxDimensionPx` konfigurierbar (Standard: `1200`).

---

## Globale Regel: fehlerhafte Tool-Aufrufe

Assistant-Tool-Call-Blöcke, bei denen sowohl `input` als auch `arguments` fehlen, werden entfernt,
bevor der Modellkontext aufgebaut wird. Dies verhindert Provider-Ablehnungen durch teilweise
persistierte Tool-Aufrufe (zum Beispiel nach einem Rate-Limit-Fehler).

Implementierung:

- `sanitizeToolCallInputs` in `src/agents/session-transcript-repair.ts`
- Angewendet in `sanitizeSessionHistory` in `src/agents/pi-embedded-runner/google.ts`

---

## Globale Regel: Provenienz sitzungsübergreifender Eingaben

Wenn ein Agent über `sessions_send` einen Prompt in eine andere Sitzung sendet (einschließlich
Agent-zu-Agent-Antwort-/Ankündigungsschritten), persistiert OpenClaw den erstellten Benutzerzug mit:

- `message.provenance.kind = "inter_session"`

Diese Metadaten werden beim Anhängen an das Transkript geschrieben und ändern die Rolle nicht
(`role: "user"` bleibt aus Kompatibilitätsgründen für Provider erhalten). Leser von Transkripten können dies verwenden,
um intern weitergeleitete Prompts nicht als Anweisungen zu behandeln, die vom Endbenutzer verfasst wurden.

Beim Neuaufbau des Kontexts stellt OpenClaw diesen Benutzerzügen im Speicher außerdem einen kurzen Marker
`[Inter-session message]` voran, damit das Modell sie von externen Anweisungen eines Endbenutzers unterscheiden kann.

---

## Provider-Matrix (aktuelles Verhalten)

**OpenAI / OpenAI Codex**

- Nur Bildbereinigung.
- Verwaiste Reasoning-Signaturen entfernen (eigenständige Reasoning-Elemente ohne nachfolgenden Inhaltsblock) für OpenAI-Responses-/Codex-Transkripte.
- Keine Bereinigung von Tool-Call-IDs.
- Keine Reparatur der Zuordnung von Tool-Ergebnissen.
- Keine Zugvalidierung oder Neuordnung.
- Keine synthetischen Tool-Ergebnisse.
- Kein Entfernen von Thought-Signaturen.

**Google (Generative AI / Gemini CLI / Antigravity)**

- Bereinigung von Tool-Call-IDs: strikt alphanumerisch.
- Reparatur der Zuordnung von Tool-Ergebnissen und synthetische Tool-Ergebnisse.
- Zugvalidierung (Alternierung von Zügen im Gemini-Stil).
- Korrektur der Google-Zugreihenfolge (ein winziges User-Bootstrap voranstellen, wenn der Verlauf mit assistant beginnt).
- Antigravity Claude: Thinking-Signaturen normalisieren; unsignierte Thinking-Blöcke entfernen.

**Anthropic / Minimax (Anthropic-kompatibel)**

- Reparatur der Zuordnung von Tool-Ergebnissen und synthetische Tool-Ergebnisse.
- Zugvalidierung (aufeinanderfolgende Benutzerzüge zusammenführen, um die strikte Alternierung einzuhalten).

**Mistral (einschließlich modell-ID-basierter Erkennung)**

- Bereinigung von Tool-Call-IDs: strict9 (alphanumerische Länge 9).

**OpenRouter Gemini**

- Bereinigung von Thought-Signaturen: nicht-Base64-`thought_signature`-Werte entfernen (Base64 beibehalten).

**Alles andere**

- Nur Bildbereinigung.

---

## Historisches Verhalten (vor 2026.1.22)

Vor dem Release 2026.1.22 wendete OpenClaw mehrere Ebenen der Transkript-Hygiene an:

- Eine **transcript-sanitize-Erweiterung** lief bei jedem Kontextaufbau und konnte:
  - die Zuordnung von Tool-Nutzung/Ergebnis reparieren.
  - Tool-Call-IDs bereinigen (einschließlich eines nicht-strikten Modus, der `_`/`-` beibehielt).
- Der Runner führte außerdem providerspezifische Bereinigung durch, was Arbeit doppelte.
- Zusätzliche Mutationen traten außerhalb der Provider-Richtlinie auf, darunter:
  - Entfernen von `<final>`-Tags aus Assistant-Text vor der Persistierung.
  - Entfernen leerer Assistant-Fehlerzüge.
  - Beschneiden von Assistant-Inhalten nach Tool-Aufrufen.

Diese Komplexität verursachte providerübergreifende Regressionen (insbesondere bei der Zuordnung von `call_id|fc_id`
in `openai-responses`). Die Bereinigung in 2026.1.22 entfernte die Erweiterung, zentralisierte
die Logik im Runner und machte OpenAI **no-touch** außer bei der Bildbereinigung.
