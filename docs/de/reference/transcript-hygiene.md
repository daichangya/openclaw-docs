---
read_when:
    - Sie debuggen providerseitige Ablehnungen von Anfragen, die mit der Form des Transkripts zusammenhängen
    - Sie ändern die Transkript-Sanitisierung oder die Reparaturlogik für Tool-Aufrufe
    - Sie untersuchen Tool-Call-ID-Mismatches über Provider hinweg
summary: 'Referenz: providerspezifische Regeln zur Transkript-Sanitisierung und -Reparatur'
title: Transkript-Hygiene
x-i18n:
    generated_at: "2026-04-23T14:07:09Z"
    model: gpt-5.4
    provider: openai
    source_hash: 0b528099b547155e5cf25be19e64a017d338b6f7b9c7ef51dc3ce2c2963193b8
    source_path: reference/transcript-hygiene.md
    workflow: 15
---

# Transkript-Hygiene (Provider-Fixups)

Dieses Dokument beschreibt **providerspezifische Fixes**, die vor einem Lauf auf Transkripte angewendet werden
(Aufbau des Modellkontexts). Diese sind **In-Memory**-Anpassungen, die verwendet werden, um strenge
Provider-Anforderungen zu erfüllen. Diese Hygieneschritte schreiben das gespeicherte JSONL-Transkript
auf dem Datenträger **nicht** um; allerdings kann ein separater Reparaturdurchlauf für Sitzungsdateien
fehlerhafte JSONL-Dateien umschreiben, indem ungültige Zeilen entfernt werden, bevor die Sitzung geladen wird. Wenn eine Reparatur erfolgt, wird die Originaldatei neben der Sitzungsdatei gesichert.

Zum Geltungsbereich gehören:

- Sanitisierung von Tool-Call-IDs
- Validierung von Tool-Call-Eingaben
- Reparatur der Paarung von Tool-Ergebnissen
- Turn-Validierung / Reihenfolge
- Bereinigung von Thought-Signaturen
- Sanitisierung von Bild-Payloads
- Provenienz-Tagging von Benutzereingaben (für inter-session weitergeleitete Prompts)

Wenn Sie Details zur Transkriptspeicherung benötigen, siehe:

- [/reference/session-management-compaction](/de/reference/session-management-compaction)

---

## Wo dies ausgeführt wird

Die gesamte Transkript-Hygiene ist im eingebetteten Runner zentralisiert:

- Richtlinienauswahl: `src/agents/transcript-policy.ts`
- Anwendung von Sanitisierung/Reparatur: `sanitizeSessionHistory` in `src/agents/pi-embedded-runner/replay-history.ts`

Die Richtlinie verwendet `provider`, `modelApi` und `modelId`, um zu entscheiden, was angewendet wird.

Getrennt von der Transkript-Hygiene werden Sitzungsdateien (falls nötig) vor dem Laden repariert:

- `repairSessionFileIfNeeded` in `src/agents/session-file-repair.ts`
- Aufgerufen aus `run/attempt.ts` und `compact.ts` (eingebetteter Runner)

---

## Globale Regel: Bild-Sanitisierung

Bild-Payloads werden immer sanitisiert, um providerseitige Ablehnungen aufgrund von Größenlimits
zu verhindern (Herunterskalieren/Rekomprimieren übergroßer Base64-Bilder).

Das hilft auch, tokengetriebenen Druck durch Bilder bei visionfähigen Modellen zu kontrollieren.
Kleinere Maximalabmessungen reduzieren im Allgemeinen den Tokenverbrauch; größere Abmessungen erhalten mehr Details.

Implementierung:

- `sanitizeSessionMessagesImages` in `src/agents/pi-embedded-helpers/images.ts`
- `sanitizeContentBlocksImages` in `src/agents/tool-images.ts`
- Die maximale Bildkante ist über `agents.defaults.imageMaxDimensionPx` konfigurierbar (Standard: `1200`).

---

## Globale Regel: fehlerhafte Tool-Calls

Assistant-Tool-Call-Blöcke, bei denen sowohl `input` als auch `arguments` fehlen, werden verworfen,
bevor der Modellkontext aufgebaut wird. Das verhindert providerseitige Ablehnungen durch teilweise
persistierte Tool-Calls (zum Beispiel nach einem Rate-Limit-Fehler).

Implementierung:

- `sanitizeToolCallInputs` in `src/agents/session-transcript-repair.ts`
- Angewendet in `sanitizeSessionHistory` in `src/agents/pi-embedded-runner/replay-history.ts`

---

## Globale Regel: Provenienz interner Sitzungsübergaben

Wenn ein Agent über `sessions_send` einen Prompt in eine andere Sitzung sendet (einschließlich
Agent-zu-Agent-Antwort-/Ankündigungsschritten), speichert OpenClaw den erzeugten Benutzer-Turn mit:

- `message.provenance.kind = "inter_session"`

Diese Metadaten werden beim Anhängen an das Transkript geschrieben und ändern die Rolle nicht
(`role: "user"` bleibt aus Kompatibilitätsgründen mit Providern erhalten). Transkriptleser können
dies verwenden, um intern weitergeleitete Prompts nicht als von Endbenutzern verfasste Anweisungen zu behandeln.

Beim Neuaufbau des Kontexts stellt OpenClaw diesen Benutzer-Turns In-Memory außerdem einen kurzen Marker
`[Inter-session message]` voran, damit das Modell sie von externen Endbenutzeranweisungen unterscheiden kann.

---

## Provider-Matrix (aktuelles Verhalten)

**OpenAI / OpenAI Codex**

- Nur Bild-Sanitisierung.
- Verwaiste Reasoning-Signaturen entfernen (eigenständige Reasoning-Elemente ohne folgenden Inhaltsblock) für OpenAI-Responses-/Codex-Transkripte.
- Keine Sanitisierung von Tool-Call-IDs.
- Keine Reparatur der Paarung von Tool-Ergebnissen.
- Keine Turn-Validierung oder Neuordnung.
- Keine synthetischen Tool-Ergebnisse.
- Kein Entfernen von Thought-Signaturen.

**Google (Generative AI / Gemini CLI / Antigravity)**

- Sanitisierung von Tool-Call-IDs: strikt alphanumerisch.
- Reparatur der Paarung von Tool-Ergebnissen und synthetische Tool-Ergebnisse.
- Turn-Validierung (Turn-Alternation im Gemini-Stil).
- Google-Fixup für Turn-Reihenfolge (kleiner Bootstrap-Benutzerturn voranstellen, wenn der Verlauf mit Assistant beginnt).
- Antigravity Claude: Thinking-Signaturen normalisieren; unsignierte Thinking-Blöcke verwerfen.

**Anthropic / Minimax (Anthropic-kompatibel)**

- Reparatur der Paarung von Tool-Ergebnissen und synthetische Tool-Ergebnisse.
- Turn-Validierung (aufeinanderfolgende Benutzer-Turns zusammenführen, um strikte Alternation zu erfüllen).

**Mistral (einschließlich modell-ID-basierter Erkennung)**

- Sanitisierung von Tool-Call-IDs: strict9 (alphanumerische Länge 9).

**OpenRouter Gemini**

- Bereinigung von Thought-Signaturen: Nicht-Base64-Werte in `thought_signature` entfernen (Base64 behalten).

**Alles andere**

- Nur Bild-Sanitisierung.

---

## Historisches Verhalten (vor 2026.1.22)

Vor dem Release 2026.1.22 wendete OpenClaw mehrere Ebenen von Transkript-Hygiene an:

- Eine Erweiterung **transcript-sanitize** lief bei jedem Aufbau des Kontexts und konnte:
  - Tool-Use-/Result-Paarungen reparieren.
  - Tool-Call-IDs sanitieren (einschließlich eines nicht strikten Modus, der `_`/`-` beibehielt).
- Der Runner führte außerdem providerspezifische Sanitisierung durch, was Arbeit duplizierte.
- Zusätzliche Mutationen fanden außerhalb der Provider-Richtlinie statt, darunter:
  - Entfernen von `<final>`-Tags aus Assistant-Text vor dem Persistieren.
  - Verwerfen leerer Assistant-Error-Turns.
  - Kürzen von Assistant-Inhalten nach Tool-Calls.

Diese Komplexität verursachte providerübergreifende Regressionen (insbesondere beim Pairing von `call_id|fc_id` in `openai-responses`). Die Bereinigung in 2026.1.22 entfernte die Erweiterung, zentralisierte
die Logik im Runner und machte OpenAI über Bild-Sanitisierung hinaus zu **no-touch**.
