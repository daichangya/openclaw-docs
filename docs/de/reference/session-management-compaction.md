---
read_when:
    - Sie müssen Session-IDs, JSONL-Transkripte oder Felder in sessions.json debuggen
    - Sie ändern das Verhalten der Auto-Kompaktierung oder fügen Housekeeping vor der Kompaktierung hinzu
    - Sie möchten Memory-Flushing oder stille System-Turns implementieren
summary: 'Detaillierte Betrachtung: Session-Store + Transkripte, Lebenszyklus und Interna der (Auto-)Kompaktierung'
title: Detaillierte Betrachtung des Session-Managements
x-i18n:
    generated_at: "2026-04-07T06:19:31Z"
    model: gpt-5.4
    provider: openai
    source_hash: e379d624dd7808d3af25ed011079268ce6a9da64bb3f301598884ad4c46ab091
    source_path: reference/session-management-compaction.md
    workflow: 15
---

# Session-Management und Kompaktierung (detaillierte Betrachtung)

Dieses Dokument erklärt, wie OpenClaw Sessions end-to-end verwaltet:

- **Session-Routing** (wie eingehende Nachrichten einem `sessionKey` zugeordnet werden)
- **Session-Store** (`sessions.json`) und was er nachverfolgt
- **Persistenz von Transkripten** (`*.jsonl`) und ihre Struktur
- **Transkript-Hygiene** (provider-spezifische Korrekturen vor Ausführungen)
- **Kontextgrenzen** (Kontextfenster vs. nachverfolgte Tokens)
- **Kompaktierung** (manuelle + Auto-Kompaktierung) und wo Arbeiten vor der Kompaktierung eingehängt werden
- **Stilles Housekeeping** (z. B. Memory-Schreibvorgänge, die keine für Benutzer sichtbare Ausgabe erzeugen sollen)

Wenn Sie zunächst eine allgemeinere Übersicht möchten, beginnen Sie mit:

- [/concepts/session](/de/concepts/session)
- [/concepts/compaction](/de/concepts/compaction)
- [/concepts/memory](/de/concepts/memory)
- [/concepts/memory-search](/de/concepts/memory-search)
- [/concepts/session-pruning](/de/concepts/session-pruning)
- [/reference/transcript-hygiene](/de/reference/transcript-hygiene)

---

## Quelle der Wahrheit: das Gateway

OpenClaw ist auf einen einzelnen **Gateway-Prozess** ausgelegt, der den Session-Status besitzt.

- UIs (macOS-App, web Control UI, TUI) sollten das Gateway nach Session-Listen und Token-Anzahlen abfragen.
- Im Remote-Modus liegen Session-Dateien auf dem Remote-Host; „Ihre lokalen Mac-Dateien prüfen“ spiegelt nicht wider, was das Gateway verwendet.

---

## Zwei Persistenzebenen

OpenClaw speichert Sessions in zwei Ebenen:

1. **Session-Store (`sessions.json`)**
   - Key/Value-Map: `sessionKey -> SessionEntry`
   - Klein, veränderbar, sicher zu bearbeiten (oder Einträge zu löschen)
   - Verfolgt Session-Metadaten nach (aktuelle Session-ID, letzte Aktivität, Umschalter, Token-Zähler usw.)

2. **Transkript (`<sessionId>.jsonl`)**
   - Append-only-Transkript mit Baumstruktur (Einträge haben `id` + `parentId`)
   - Speichert die eigentliche Unterhaltung + Tool-Aufrufe + Kompaktierungszusammenfassungen
   - Wird verwendet, um den Modellkontext für zukünftige Turns neu aufzubauen

---

## Speicherorte auf Datenträger

Pro Agent auf dem Gateway-Host:

- Store: `~/.openclaw/agents/<agentId>/sessions/sessions.json`
- Transkripte: `~/.openclaw/agents/<agentId>/sessions/<sessionId>.jsonl`
  - Telegram-Topic-Sessions: `.../<sessionId>-topic-<threadId>.jsonl`

OpenClaw löst diese über `src/config/sessions.ts` auf.

---

## Store-Wartung und Datenträgersteuerung

Die Session-Persistenz hat automatische Wartungssteuerungen (`session.maintenance`) für `sessions.json` und Transkriptartefakte:

- `mode`: `warn` (Standard) oder `enforce`
- `pruneAfter`: Altersgrenze für veraltete Einträge (Standard `30d`)
- `maxEntries`: maximale Anzahl an Einträgen in `sessions.json` (Standard `500`)
- `rotateBytes`: rotiert `sessions.json`, wenn es zu groß wird (Standard `10mb`)
- `resetArchiveRetention`: Aufbewahrung für `*.reset.<timestamp>`-Transkriptarchive (Standard: wie `pruneAfter`; `false` deaktiviert die Bereinigung)
- `maxDiskBytes`: optionales Budget für das Sessions-Verzeichnis
- `highWaterBytes`: optionales Ziel nach der Bereinigung (Standard `80%` von `maxDiskBytes`)

Reihenfolge der Durchsetzung bei Bereinigung des Datenträgerbudgets (`mode: "enforce"`):

1. Entfernen Sie zuerst die ältesten archivierten oder verwaisten Transkriptartefakte.
2. Falls das Ziel weiterhin überschritten wird, entfernen Sie die ältesten Session-Einträge und deren Transkriptdateien.
3. Fahren Sie fort, bis die Nutzung auf oder unter `highWaterBytes` liegt.

Im Modus `mode: "warn"` meldet OpenClaw potenzielle Entfernungen, verändert den Store bzw. die Dateien aber nicht.

Wartung bei Bedarf ausführen:

```bash
openclaw sessions cleanup --dry-run
openclaw sessions cleanup --enforce
```

---

## Cron-Sessions und Run-Logs

Isolierte Cron-Ausführungen erstellen ebenfalls Session-Einträge/Transkripte, und dafür gibt es dedizierte Aufbewahrungssteuerungen:

- `cron.sessionRetention` (Standard `24h`) entfernt alte isolierte Cron-Run-Sessions aus dem Session-Store (`false` deaktiviert dies).
- `cron.runLog.maxBytes` + `cron.runLog.keepLines` kürzen Dateien unter `~/.openclaw/cron/runs/<jobId>.jsonl` (Standardwerte: `2_000_000` Bytes und `2000` Zeilen).

---

## Session-Schlüssel (`sessionKey`)

Ein `sessionKey` identifiziert, _in welchem Gesprächscontainer_ Sie sich befinden (Routing + Isolierung).

Häufige Muster:

- Haupt-/Direktchat (pro Agent): `agent:<agentId>:<mainKey>` (Standard `main`)
- Gruppe: `agent:<agentId>:<channel>:group:<id>`
- Raum/Kanal (Discord/Slack): `agent:<agentId>:<channel>:channel:<id>` oder `...:room:<id>`
- Cron: `cron:<job.id>`
- Webhook: `hook:<uuid>` (außer bei Überschreibung)

Die kanonischen Regeln sind unter [/concepts/session](/de/concepts/session) dokumentiert.

---

## Session-IDs (`sessionId`)

Jeder `sessionKey` verweist auf eine aktuelle `sessionId` (die Transkriptdatei, die die Unterhaltung fortsetzt).

Faustregeln:

- **Zurücksetzen** (`/new`, `/reset`) erstellt eine neue `sessionId` für diesen `sessionKey`.
- **Tägliches Zurücksetzen** (standardmäßig 4:00 Uhr Ortszeit auf dem Gateway-Host) erstellt bei der nächsten Nachricht nach der Reset-Grenze eine neue `sessionId`.
- **Leerlaufablauf** (`session.reset.idleMinutes` oder Legacy-`session.idleMinutes`) erstellt eine neue `sessionId`, wenn eine Nachricht nach Ablauf des Leerlauffensters eintrifft. Wenn täglich + Leerlauf beide konfiguriert sind, gewinnt die zuerst ablaufende Grenze.
- **Thread-Parent-Fork-Schutz** (`session.parentForkMaxTokens`, Standard `100000`) überspringt das Forken des Parent-Transkripts, wenn die Parent-Session bereits zu groß ist; der neue Thread startet frisch. Setzen Sie `0`, um dies zu deaktivieren.

Implementierungsdetail: Die Entscheidung erfolgt in `initSessionState()` in `src/auto-reply/reply/session.ts`.

---

## Session-Store-Schema (`sessions.json`)

Der Werttyp des Stores ist `SessionEntry` in `src/config/sessions.ts`.

Wichtige Felder (nicht vollständig):

- `sessionId`: aktuelle Transkript-ID (Dateiname wird daraus abgeleitet, sofern `sessionFile` nicht gesetzt ist)
- `updatedAt`: Zeitstempel der letzten Aktivität
- `sessionFile`: optionale explizite Überschreibung des Transkriptpfads
- `chatType`: `direct | group | room` (hilft UIs und Sende-Richtlinien)
- `provider`, `subject`, `room`, `space`, `displayName`: Metadaten für Gruppen-/Kanalbeschriftung
- Umschalter:
  - `thinkingLevel`, `verboseLevel`, `reasoningLevel`, `elevatedLevel`
  - `sendPolicy` (Session-spezifische Überschreibung)
- Modellauswahl:
  - `providerOverride`, `modelOverride`, `authProfileOverride`
- Token-Zähler (Best Effort / provider-abhängig):
  - `inputTokens`, `outputTokens`, `totalTokens`, `contextTokens`
- `compactionCount`: wie oft die Auto-Kompaktierung für diesen Session-Key abgeschlossen wurde
- `memoryFlushAt`: Zeitstempel des letzten Memory-Flushs vor der Kompaktierung
- `memoryFlushCompactionCount`: Anzahl der Kompaktierungen, als der letzte Flush lief

Der Store kann sicher bearbeitet werden, aber das Gateway ist die Autorität: Es kann Einträge beim Ausführen von Sessions neu schreiben oder rehydrieren.

---

## Transkriptstruktur (`*.jsonl`)

Transkripte werden vom `SessionManager` von `@mariozechner/pi-coding-agent` verwaltet.

Die Datei ist JSONL:

- Erste Zeile: Session-Header (`type: "session"`, enthält `id`, `cwd`, `timestamp`, optional `parentSession`)
- Danach: Session-Einträge mit `id` + `parentId` (Baum)

Bemerkenswerte Eintragstypen:

- `message`: Nachrichten von Benutzer/Assistant/ToolResult
- `custom_message`: von Erweiterungen injizierte Nachrichten, die _in den Modellkontext eingehen_ (können in der UI verborgen werden)
- `custom`: Erweiterungsstatus, der _nicht_ in den Modellkontext eingeht
- `compaction`: persistierte Kompaktierungszusammenfassung mit `firstKeptEntryId` und `tokensBefore`
- `branch_summary`: persistierte Zusammenfassung beim Navigieren eines Baumzweigs

OpenClaw „korrigiert“ Transkripte absichtlich **nicht**; das Gateway verwendet `SessionManager`, um sie zu lesen/zu schreiben.

---

## Kontextfenster vs. nachverfolgte Tokens

Zwei unterschiedliche Konzepte sind wichtig:

1. **Kontextfenster des Modells**: harte Obergrenze pro Modell (Tokens, die für das Modell sichtbar sind)
2. **Zähler im Session-Store**: rollierende Statistiken, die in `sessions.json` geschrieben werden (verwendet für `/status` und Dashboards)

Wenn Sie Grenzen abstimmen:

- Das Kontextfenster kommt aus dem Modellkatalog (und kann per Konfiguration überschrieben werden).
- `contextTokens` im Store ist ein Laufzeitschätzwert/-berichtswert; behandeln Sie ihn nicht als strikte Garantie.

Mehr dazu unter [/token-use](/de/reference/token-use).

---

## Kompaktierung: was sie ist

Die Kompaktierung fasst ältere Unterhaltung in einem persistierten `compaction`-Eintrag im Transkript zusammen und lässt aktuelle Nachrichten intakt.

Nach der Kompaktierung sehen zukünftige Turns:

- Die Kompaktierungszusammenfassung
- Nachrichten nach `firstKeptEntryId`

Kompaktierung ist **persistent** (anders als Session-Pruning). Siehe [/concepts/session-pruning](/de/concepts/session-pruning).

## Chunk-Grenzen bei der Kompaktierung und Tool-Paarung

Wenn OpenClaw ein langes Transkript in Kompaktierungs-Chunks aufteilt, hält es
Assistant-Tool-Aufrufe mit ihren passenden `toolResult`-Einträgen zusammen.

- Wenn die tokenbasierte Aufteilung zwischen einem Tool-Aufruf und dessen Ergebnis landet, verschiebt OpenClaw
  die Grenze zur Assistant-Nachricht mit dem Tool-Aufruf, statt das Paar zu trennen.
- Wenn ein nachlaufender Tool-Result-Block den Chunk sonst über das Ziel hinausschieben würde,
  bewahrt OpenClaw diesen ausstehenden Tool-Block und lässt den nicht zusammengefassten Tail
  intakt.
- Abgebrochene/fehlerhafte Tool-Call-Blöcke halten eine ausstehende Aufteilung nicht offen.

---

## Wann Auto-Kompaktierung stattfindet (Pi-Runtime)

Im eingebetteten Pi-Agent wird die Auto-Kompaktierung in zwei Fällen ausgelöst:

1. **Overflow-Wiederherstellung**: Das Modell gibt einen Kontext-Overflow-Fehler zurück
   (`request_too_large`, `context length exceeded`, `input exceeds the maximum
number of tokens`, `input token count exceeds the maximum number of input
tokens`, `input is too long for the model`, `ollama error: context length
exceeded` und ähnliche provider-spezifische Varianten) → komprimieren → erneut versuchen.
2. **Threshold-Wartung**: nach einem erfolgreichen Turn, wenn:

`contextTokens > contextWindow - reserveTokens`

Dabei gilt:

- `contextWindow` ist das Kontextfenster des Modells
- `reserveTokens` ist der reservierte Puffer für Prompts + die nächste Modell-Ausgabe

Dies ist Semantik der Pi-Runtime (OpenClaw konsumiert die Ereignisse, aber Pi entscheidet, wann kompaktisiert wird).

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

OpenClaw erzwingt auch eine Sicherheitsuntergrenze für eingebettete Ausführungen:

- Wenn `compaction.reserveTokens < reserveTokensFloor`, erhöht OpenClaw diesen Wert.
- Die Standard-Untergrenze ist `20000` Tokens.
- Setzen Sie `agents.defaults.compaction.reserveTokensFloor: 0`, um die Untergrenze zu deaktivieren.
- Wenn der Wert bereits höher ist, lässt OpenClaw ihn unverändert.

Warum: Genügend Puffer für mehrturniges „Housekeeping“ lassen (wie Memory-Schreibvorgänge), bevor Kompaktierung unvermeidlich wird.

Implementierung: `ensurePiCompactionReserveTokens()` in `src/agents/pi-settings.ts`
(aufgerufen von `src/agents/pi-embedded-runner.ts`).

---

## Für Benutzer sichtbare Oberflächen

Sie können Kompaktierung und Session-Status beobachten über:

- `/status` (in jeder Chat-Session)
- `openclaw status` (CLI)
- `openclaw sessions` / `sessions --json`
- Verbose-Modus: `🧹 Auto-compaction complete` + Anzahl der Kompaktierungen

---

## Stilles Housekeeping (`NO_REPLY`)

OpenClaw unterstützt „stille“ Turns für Hintergrundaufgaben, bei denen Benutzer keine Zwischenausgabe sehen sollen.

Konvention:

- Der Assistant beginnt seine Ausgabe mit dem exakten stillen Token `NO_REPLY` /
  `no_reply`, um „keine Antwort an den Benutzer zustellen“ anzuzeigen.
- OpenClaw entfernt/unterdrückt dies in der Zustellungsschicht.
- Die Unterdrückung des exakten stillen Tokens ist unabhängig von Groß-/Kleinschreibung, daher zählen `NO_REPLY` und
  `no_reply` beide, wenn die gesamte Payload nur aus dem stillen Token besteht.
- Dies ist nur für echte Hintergrund-/Nicht-Zustellungs-Turns gedacht; es ist keine Abkürzung für
  normale umsetzbare Benutzeranfragen.

Seit `2026.1.10` unterdrückt OpenClaw außerdem **Entwurfs-/Tippen-Streaming**, wenn ein
partieller Chunk mit `NO_REPLY` beginnt, damit stille Vorgänge nicht mitten im Turn teilweise Ausgabe preisgeben.

---

## „Memory Flush“ vor der Kompaktierung (implementiert)

Ziel: Bevor Auto-Kompaktierung stattfindet, einen stillen agentischen Turn ausführen, der dauerhaften
Status auf Datenträger schreibt (z. B. `memory/YYYY-MM-DD.md` im Agent-Workspace), damit die Kompaktierung keinen
kritischen Kontext löschen kann.

OpenClaw verwendet den Ansatz **Flush vor der Schwelle**:

1. Überwachen der Nutzung des Session-Kontexts.
2. Wenn diese eine „weiche Schwelle“ überschreitet (unterhalb von Pis Kompaktierungsschwelle), einen stillen
   „jetzt Memory schreiben“-Direktiv-Turn für den Agent ausführen.
3. Das exakte stille Token `NO_REPLY` / `no_reply` verwenden, damit der Benutzer
   nichts sieht.

Konfiguration (`agents.defaults.compaction.memoryFlush`):

- `enabled` (Standard: `true`)
- `softThresholdTokens` (Standard: `4000`)
- `prompt` (Benutzernachricht für den Flush-Turn)
- `systemPrompt` (zusätzlicher System-Prompt, der für den Flush-Turn angehängt wird)

Hinweise:

- Der Standard-Prompt/System-Prompt enthält einen `NO_REPLY`-Hinweis, um die
  Zustellung zu unterdrücken.
- Der Flush läuft einmal pro Kompaktierungszyklus (nachverfolgt in `sessions.json`).
- Der Flush läuft nur für eingebettete Pi-Sessions (CLI-Backends überspringen ihn).
- Der Flush wird übersprungen, wenn der Session-Workspace schreibgeschützt ist (`workspaceAccess: "ro"` oder `"none"`).
- Siehe [Memory](/de/concepts/memory) für das Workspace-Dateilayout und Schreibmuster.

Pi stellt in der Erweiterungs-API auch einen Hook `session_before_compact` bereit, aber die
Flush-Logik von OpenClaw lebt heute auf Gateway-Seite.

---

## Checkliste zur Fehlerbehebung

- Session-Key falsch? Beginnen Sie mit [/concepts/session](/de/concepts/session) und prüfen Sie den `sessionKey` in `/status`.
- Store- vs.-Transkript-Abweichung? Bestätigen Sie den Gateway-Host und den Store-Pfad aus `openclaw status`.
- Kompaktierungs-Spam? Prüfen Sie:
  - Kontextfenster des Modells (zu klein)
  - Kompaktierungseinstellungen (`reserveTokens` zu hoch für das Modellfenster kann frühere Kompaktierung verursachen)
  - Übermäßige Tool-Result-Größe: Session-Pruning aktivieren/abstimmen
- Stille Turns leaken? Bestätigen Sie, dass die Antwort mit `NO_REPLY` beginnt (unabhängig von Groß-/Kleinschreibung als exaktes Token) und dass Sie eine Build-Version mit dem Fix zur Streaming-Unterdrückung verwenden.
