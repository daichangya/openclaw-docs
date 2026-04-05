---
read_when:
    - Sie müssen Sitzungs-IDs, JSONL-Transkripte oder Felder in sessions.json debuggen
    - Sie ändern das Verhalten der automatischen Kompaktierung oder fügen Housekeeping vor der Kompaktierung hinzu
    - Sie möchten Memory-Flushing oder stille System-Turns implementieren
summary: 'Detaillierte Betrachtung: Sitzungsspeicher + Transkripte, Lebenszyklus und Interna der (automatischen) Kompaktierung'
title: Detaillierte Betrachtung der Sitzungsverwaltung
x-i18n:
    generated_at: "2026-04-05T12:55:22Z"
    model: gpt-5.4
    provider: openai
    source_hash: e379d624dd7808d3af25ed011079268ce6a9da64bb3f301598884ad4c46ab091
    source_path: reference/session-management-compaction.md
    workflow: 15
---

# Sitzungsverwaltung und Kompaktierung (detaillierte Betrachtung)

Dieses Dokument erklärt, wie OpenClaw Sitzungen durchgängig verwaltet:

- **Sitzungsrouting** (wie eingehende Nachrichten einem `sessionKey` zugeordnet werden)
- **Sitzungsspeicher** (`sessions.json`) und was er nachverfolgt
- **Persistenz von Transkripten** (`*.jsonl`) und ihre Struktur
- **Transkript-Hygiene** (providerspezifische Korrekturen vor Ausführungen)
- **Kontextgrenzen** (Kontextfenster vs. nachverfolgte Tokens)
- **Kompaktierung** (manuell + automatische Kompaktierung) und wo Arbeiten vor der Kompaktierung eingebunden werden können
- **Stilles Housekeeping** (z. B. Memory-Schreibvorgänge, die keine benutzersichtbare Ausgabe erzeugen sollen)

Wenn Sie zuerst einen Überblick auf höherer Ebene möchten, beginnen Sie mit:

- [/concepts/session](/de/concepts/session)
- [/concepts/compaction](/de/concepts/compaction)
- [/concepts/memory](/de/concepts/memory)
- [/concepts/memory-search](/de/concepts/memory-search)
- [/concepts/session-pruning](/de/concepts/session-pruning)
- [/reference/transcript-hygiene](/reference/transcript-hygiene)

---

## Quelle der Wahrheit: das Gateway

OpenClaw ist um einen einzelnen **Gateway-Prozess** herum aufgebaut, der den Sitzungsstatus verwaltet.

- UIs (macOS-App, web Control UI, TUI) sollten das Gateway nach Sitzungslisten und Token-Anzahlen abfragen.
- Im Remote-Modus liegen Sitzungsdateien auf dem Remote-Host; ein „Prüfen Ihrer lokalen Mac-Dateien“ spiegelt nicht wider, was das Gateway verwendet.

---

## Zwei Persistenzebenen

OpenClaw speichert Sitzungen in zwei Ebenen:

1. **Sitzungsspeicher (`sessions.json`)**
   - Key/Value-Zuordnung: `sessionKey -> SessionEntry`
   - Klein, veränderlich, sicher zu bearbeiten (oder Einträge zu löschen)
   - Verfolgt Sitzungsmetadaten nach (aktuelle Sitzungs-ID, letzte Aktivität, Umschalter, Token-Zähler usw.)

2. **Transkript (`<sessionId>.jsonl`)**
   - Append-only-Transkript mit Baumstruktur (Einträge haben `id` + `parentId`)
   - Speichert die eigentliche Unterhaltung + Tool-Aufrufe + Kompaktierungszusammenfassungen
   - Wird verwendet, um den Modellkontext für zukünftige Turns wieder aufzubauen

---

## Speicherorte auf dem Datenträger

Pro Agent auf dem Gateway-Host:

- Speicher: `~/.openclaw/agents/<agentId>/sessions/sessions.json`
- Transkripte: `~/.openclaw/agents/<agentId>/sessions/<sessionId>.jsonl`
  - Telegram-Topic-Sitzungen: `.../<sessionId>-topic-<threadId>.jsonl`

OpenClaw löst diese über `src/config/sessions.ts` auf.

---

## Speicherpflege und Festplattenkontrollen

Die Sitzungs-Persistenz hat automatische Wartungssteuerungen (`session.maintenance`) für `sessions.json` und Transkriptartefakte:

- `mode`: `warn` (Standard) oder `enforce`
- `pruneAfter`: Altersgrenze für veraltete Einträge (Standard `30d`)
- `maxEntries`: Begrenzung der Einträge in `sessions.json` (Standard `500`)
- `rotateBytes`: rotiert `sessions.json`, wenn es zu groß wird (Standard `10mb`)
- `resetArchiveRetention`: Aufbewahrung für `*.reset.<timestamp>`-Transkriptarchive (Standard: identisch mit `pruneAfter`; `false` deaktiviert die Bereinigung)
- `maxDiskBytes`: optionales Budget für das Sitzungsverzeichnis
- `highWaterBytes`: optionales Ziel nach der Bereinigung (Standard `80%` von `maxDiskBytes`)

Reihenfolge der Durchsetzung bei der Bereinigung des Festplattenbudgets (`mode: "enforce"`):

1. Zuerst die ältesten archivierten oder verwaisten Transkriptartefakte entfernen.
2. Wenn das Ziel weiterhin überschritten ist, die ältesten Sitzungseinträge und ihre Transkriptdateien auswerfen.
3. So lange fortfahren, bis die Nutzung bei oder unter `highWaterBytes` liegt.

Im `mode: "warn"` meldet OpenClaw potenzielle Auswerfungen, verändert aber den Speicher/die Dateien nicht.

Wartung bei Bedarf ausführen:

```bash
openclaw sessions cleanup --dry-run
openclaw sessions cleanup --enforce
```

---

## Cron-Sitzungen und Ausführungsprotokolle

Isolierte Cron-Ausführungen erstellen ebenfalls Sitzungseinträge/Transkripte und haben eigene Aufbewahrungssteuerungen:

- `cron.sessionRetention` (Standard `24h`) entfernt alte isolierte Cron-Ausführungssitzungen aus dem Sitzungsspeicher (`false` deaktiviert dies).
- `cron.runLog.maxBytes` + `cron.runLog.keepLines` beschneiden Dateien unter `~/.openclaw/cron/runs/<jobId>.jsonl` (Standard: `2_000_000` Bytes und `2000` Zeilen).

---

## Sitzungsschlüssel (`sessionKey`)

Ein `sessionKey` identifiziert, _in welchem Konversations-Bucket_ Sie sich befinden (Routing + Isolation).

Häufige Muster:

- Haupt-/Direktchat (pro Agent): `agent:<agentId>:<mainKey>` (Standard `main`)
- Gruppe: `agent:<agentId>:<channel>:group:<id>`
- Raum/Kanal (Discord/Slack): `agent:<agentId>:<channel>:channel:<id>` oder `...:room:<id>`
- Cron: `cron:<job.id>`
- Webhook: `hook:<uuid>` (sofern nicht überschrieben)

Die kanonischen Regeln sind unter [/concepts/session](/de/concepts/session) dokumentiert.

---

## Sitzungs-IDs (`sessionId`)

Jeder `sessionKey` verweist auf eine aktuelle `sessionId` (die Transkriptdatei, die die Unterhaltung fortsetzt).

Faustregeln:

- **Reset** (`/new`, `/reset`) erstellt eine neue `sessionId` für diesen `sessionKey`.
- **Täglicher Reset** (standardmäßig 4:00 Uhr Ortszeit auf dem Gateway-Host) erstellt beim nächsten Nachrichteneingang nach der Reset-Grenze eine neue `sessionId`.
- **Leerlaufablauf** (`session.reset.idleMinutes` oder alt `session.idleMinutes`) erstellt eine neue `sessionId`, wenn nach dem Leerlauffenster eine Nachricht eingeht. Wenn täglich + Leerlauf beide konfiguriert sind, gewinnt das zuerst ablaufende.
- **Fork-Schutz für übergeordnete Threads** (`session.parentForkMaxTokens`, Standard `100000`) überspringt das Forken des übergeordneten Transkripts, wenn die übergeordnete Sitzung bereits zu groß ist; der neue Thread beginnt frisch. Setzen Sie `0`, um dies zu deaktivieren.

Implementierungsdetail: Die Entscheidung erfolgt in `initSessionState()` in `src/auto-reply/reply/session.ts`.

---

## Schema des Sitzungsspeichers (`sessions.json`)

Der Werttyp des Speichers ist `SessionEntry` in `src/config/sessions.ts`.

Wichtige Felder (nicht vollständig):

- `sessionId`: aktuelle Transkript-ID (der Dateiname wird daraus abgeleitet, sofern `sessionFile` nicht gesetzt ist)
- `updatedAt`: Zeitstempel der letzten Aktivität
- `sessionFile`: optionale explizite Überschreibung des Transkriptpfads
- `chatType`: `direct | group | room` (hilft UIs und der Sendepolitik)
- `provider`, `subject`, `room`, `space`, `displayName`: Metadaten für die Kennzeichnung von Gruppen/Kanälen
- Umschalter:
  - `thinkingLevel`, `verboseLevel`, `reasoningLevel`, `elevatedLevel`
  - `sendPolicy` (Überschreibung pro Sitzung)
- Modellauswahl:
  - `providerOverride`, `modelOverride`, `authProfileOverride`
- Token-Zähler (nach bestem Wissen / providerabhängig):
  - `inputTokens`, `outputTokens`, `totalTokens`, `contextTokens`
- `compactionCount`: wie oft die automatische Kompaktierung für diesen Sitzungsschlüssel abgeschlossen wurde
- `memoryFlushAt`: Zeitstempel des letzten Memory-Flushs vor der Kompaktierung
- `memoryFlushCompactionCount`: Kompaktierungsanzahl, bei der der letzte Flush ausgeführt wurde

Der Speicher kann sicher bearbeitet werden, aber das Gateway ist maßgeblich: Es kann Einträge beim Ausführen von Sitzungen neu schreiben oder wiederherstellen.

---

## Transkriptstruktur (`*.jsonl`)

Transkripte werden vom `SessionManager` aus `@mariozechner/pi-coding-agent` verwaltet.

Die Datei ist JSONL:

- Erste Zeile: Sitzungs-Header (`type: "session"`, enthält `id`, `cwd`, `timestamp`, optional `parentSession`)
- Danach: Sitzungseinträge mit `id` + `parentId` (Baum)

Bemerkenswerte Eintragstypen:

- `message`: Benutzer-/Assistent-/ToolResult-Nachrichten
- `custom_message`: von Erweiterungen injizierte Nachrichten, die _in_ den Modellkontext eingehen (können in der UI verborgen sein)
- `custom`: Erweiterungsstatus, der _nicht_ in den Modellkontext eingeht
- `compaction`: persistierte Kompaktierungszusammenfassung mit `firstKeptEntryId` und `tokensBefore`
- `branch_summary`: persistierte Zusammenfassung beim Navigieren in einem Baumzweig

OpenClaw „korrigiert“ Transkripte bewusst **nicht**; das Gateway verwendet `SessionManager`, um sie zu lesen/zu schreiben.

---

## Kontextfenster vs. nachverfolgte Tokens

Zwei verschiedene Konzepte sind wichtig:

1. **Modellkontextfenster**: harte Obergrenze pro Modell (Tokens, die für das Modell sichtbar sind)
2. **Zähler im Sitzungsspeicher**: rollierende Statistiken, die in `sessions.json` geschrieben werden (verwendet für /status und Dashboards)

Wenn Sie Grenzen abstimmen:

- Das Kontextfenster stammt aus dem Modellkatalog (und kann über die Konfiguration überschrieben werden).
- `contextTokens` im Speicher ist ein Laufzeit-Schätzwert/-Berichtswert; behandeln Sie ihn nicht als strikte Garantie.

Weitere Informationen finden Sie unter [/token-use](/reference/token-use).

---

## Kompaktierung: was sie ist

Die Kompaktierung fasst ältere Unterhaltung in einen persistierten `compaction`-Eintrag im Transkript zusammen und lässt aktuelle Nachrichten intakt.

Nach der Kompaktierung sehen zukünftige Turns:

- Die Kompaktierungszusammenfassung
- Nachrichten nach `firstKeptEntryId`

Kompaktierung ist **persistent** (anders als Session Pruning). Siehe [/concepts/session-pruning](/de/concepts/session-pruning).

## Chunk-Grenzen bei der Kompaktierung und Tool-Paarung

Wenn OpenClaw ein langes Transkript in Kompaktierungs-Chunks aufteilt, hält es
Tool-Aufrufe des Assistenten mit ihren passenden `toolResult`-Einträgen zusammen.

- Wenn die tokenanteilige Aufteilung zwischen einem Tool-Aufruf und seinem Ergebnis landet, verschiebt OpenClaw
  die Grenze auf die Assistentennachricht mit dem Tool-Aufruf, statt das Paar zu trennen.
- Wenn ein nachlaufender Tool-Result-Block das Chunk andernfalls über das Ziel hinausschieben würde,
  bewahrt OpenClaw diesen ausstehenden Tool-Block und lässt das nicht zusammengefasste Ende
  intakt.
- Abgebrochene/fehlerhafte Tool-Aufruf-Blöcke halten eine ausstehende Aufteilung nicht offen.

---

## Wann automatische Kompaktierung erfolgt (Pi-Runtime)

Im eingebetteten Pi-Agenten wird die automatische Kompaktierung in zwei Fällen ausgelöst:

1. **Wiederherstellung bei Überlauf**: Das Modell gibt einen Kontextüberlauffehler zurück
   (`request_too_large`, `context length exceeded`, `input exceeds the maximum
number of tokens`, `input token count exceeds the maximum number of input
tokens`, `input is too long for the model`, `ollama error: context length
exceeded` und ähnliche providerspezifische Varianten) → komprimieren → erneut versuchen.
2. **Schwellenwert-Wartung**: nach einem erfolgreichen Turn, wenn:

`contextTokens > contextWindow - reserveTokens`

Dabei gilt:

- `contextWindow` ist das Kontextfenster des Modells
- `reserveTokens` ist der reservierte Puffer für Prompts + die nächste Modellausgabe

Dies sind Pi-Runtime-Semantiken (OpenClaw verarbeitet die Ereignisse, aber Pi entscheidet, wann kompaktieren wird).

---

## Einstellungen für die Kompaktierung (`reserveTokens`, `keepRecentTokens`)

Die Kompaktierungseinstellungen von Pi befinden sich in den Pi-Einstellungen:

```json5
{
  compaction: {
    enabled: true,
    reserveTokens: 16384,
    keepRecentTokens: 20000,
  },
}
```

OpenClaw erzwingt außerdem eine Sicherheitsuntergrenze für eingebettete Ausführungen:

- Wenn `compaction.reserveTokens < reserveTokensFloor`, erhöht OpenClaw diesen Wert.
- Die Standarduntergrenze beträgt `20000` Tokens.
- Setzen Sie `agents.defaults.compaction.reserveTokensFloor: 0`, um die Untergrenze zu deaktivieren.
- Wenn der Wert bereits höher ist, lässt OpenClaw ihn unverändert.

Warum: Es soll genügend Puffer für mehrstufiges „Housekeeping“ (wie Memory-Schreibvorgänge) bleiben, bevor Kompaktierung unvermeidlich wird.

Implementierung: `ensurePiCompactionReserveTokens()` in `src/agents/pi-settings.ts`
(aufgerufen von `src/agents/pi-embedded-runner.ts`).

---

## Benutzersichtbare Oberflächen

Sie können Kompaktierung und Sitzungsstatus beobachten über:

- `/status` (in jeder Chatsitzung)
- `openclaw status` (CLI)
- `openclaw sessions` / `sessions --json`
- Verbose-Modus: `🧹 Auto-compaction complete` + Kompaktierungsanzahl

---

## Stilles Housekeeping (`NO_REPLY`)

OpenClaw unterstützt „stille“ Turns für Hintergrundaufgaben, bei denen der Benutzer keine Zwischenausgabe sehen soll.

Konvention:

- Der Assistent beginnt seine Ausgabe mit dem exakten Still-Token `NO_REPLY` /
  `no_reply`, um „keine Antwort an den Benutzer senden“ anzuzeigen.
- OpenClaw entfernt/unterdrückt dies in der Zustellungsebene.
- Die Unterdrückung exakter Still-Tokens ist nicht case-sensitiv, daher zählen `NO_REPLY` und
  `no_reply` beide, wenn die gesamte Nutzlast nur aus diesem Still-Token besteht.
- Dies ist nur für echte Hintergrund-/Nicht-Zustellungs-Turns gedacht; es ist keine Abkürzung für
  gewöhnliche umsetzbare Benutzeranfragen.

Seit `2026.1.10` unterdrückt OpenClaw außerdem **Draft-/Typing-Streaming**, wenn ein
partieller Chunk mit `NO_REPLY` beginnt, damit stille Vorgänge keine partielle Ausgabe
mitten im Turn offenlegen.

---

## „Memory-Flush“ vor der Kompaktierung (implementiert)

Ziel: Bevor automatische Kompaktierung erfolgt, einen stillen agentischen Turn ausführen, der dauerhaften
Status auf den Datenträger schreibt (z. B. `memory/YYYY-MM-DD.md` im Agent-Workspace), damit die Kompaktierung
keinen kritischen Kontext löschen kann.

OpenClaw verwendet den Ansatz **Flush vor dem Schwellenwert**:

1. Die Nutzung des Sitzungskontexts überwachen.
2. Wenn sie einen „weichen Schwellenwert“ überschreitet (unterhalb des Kompaktierungsschwellenwerts von Pi), einen stillen
   „jetzt Memory schreiben“-Befehl an den Agenten ausführen.
3. Das exakte Still-Token `NO_REPLY` / `no_reply` verwenden, damit der Benutzer
   nichts sieht.

Konfiguration (`agents.defaults.compaction.memoryFlush`):

- `enabled` (Standard: `true`)
- `softThresholdTokens` (Standard: `4000`)
- `prompt` (Benutzernachricht für den Flush-Turn)
- `systemPrompt` (zusätzlicher System-Prompt, der für den Flush-Turn angehängt wird)

Hinweise:

- Der Standard-Prompt/System-Prompt enthält einen `NO_REPLY`-Hinweis zur Unterdrückung
  der Zustellung.
- Der Flush wird einmal pro Kompaktierungszyklus ausgeführt (nachverfolgt in `sessions.json`).
- Der Flush wird nur für eingebettete Pi-Sitzungen ausgeführt (CLI-Backends überspringen ihn).
- Der Flush wird übersprungen, wenn der Sitzungs-Workspace schreibgeschützt ist (`workspaceAccess: "ro"` oder `"none"`).
- Informationen zum Layout des Workspace-Dateisystems und zu Schreibmustern finden Sie unter [Memory](/de/concepts/memory).

Pi stellt in der Erweiterungs-API auch einen Hook `session_before_compact` bereit, aber die Flush-Logik von OpenClaw lebt heute auf der Gateway-Seite.

---

## Checkliste zur Fehlerbehebung

- Falscher Sitzungsschlüssel? Beginnen Sie mit [/concepts/session](/de/concepts/session) und bestätigen Sie den `sessionKey` in `/status`.
- Abweichung zwischen Speicher und Transkript? Bestätigen Sie den Gateway-Host und den Speicherpfad aus `openclaw status`.
- Kompaktierungs-Spam? Prüfen Sie:
  - Kontextfenster des Modells (zu klein)
  - Kompaktierungseinstellungen (`reserveTokens` zu hoch für das Modellfenster kann frühere Kompaktierung verursachen)
  - Aufblähung durch Tool-Ergebnisse: Session Pruning aktivieren/abstimmen
- Lecken stille Turns? Bestätigen Sie, dass die Antwort mit `NO_REPLY` beginnt (nicht case-sensitives exaktes Token) und dass Sie auf einem Build mit dem Fix zur Streaming-Unterdrückung sind.
