---
read_when:
    - Sie müssen Sitzungs-IDs, JSONL-Transkripte oder Felder in sessions.json debuggen
    - Sie ändern das Verhalten der automatischen Compaction oder fügen „Pre-Compaction“-Housekeeping hinzu
    - Sie möchten Memory-Flushes oder stille System-Turns implementieren
summary: 'Detaillierter Einblick: Sitzungsspeicher + Transkripte, Lebenszyklus und Interna der (automatischen) Compaction'
title: Detaillierter Einblick in die Sitzungsverwaltung
x-i18n:
    generated_at: "2026-04-24T06:58:08Z"
    model: gpt-5.4
    provider: openai
    source_hash: 9e236840ebf9d4980339c801c1ecb70a7f413ea18987400ac47db0818b5cab8c
    source_path: reference/session-management-compaction.md
    workflow: 15
---

# Sitzungsverwaltung & Compaction (Deep Dive)

Dieses Dokument erklärt, wie OpenClaw Sitzungen Ende-zu-Ende verwaltet:

- **Sitzungsrouting** (wie eingehende Nachrichten auf einen `sessionKey` abgebildet werden)
- **Sitzungsspeicher** (`sessions.json`) und was er verfolgt
- **Transkriptpersistenz** (`*.jsonl`) und ihre Struktur
- **Transkripthygiene** (providerspezifische Bereinigungen vor Läufen)
- **Kontextgrenzen** (Kontextfenster vs. verfolgte Tokens)
- **Compaction** (manuelle + automatische Compaction) und wo Housekeeping vor Compaction eingehängt wird
- **Stilles Housekeeping** (z. B. Memory-Schreibvorgänge, die keine benutzersichtbare Ausgabe erzeugen sollen)

Wenn Sie zuerst einen Überblick auf höherer Ebene möchten, beginnen Sie mit:

- [/concepts/session](/de/concepts/session)
- [/concepts/compaction](/de/concepts/compaction)
- [/concepts/memory](/de/concepts/memory)
- [/concepts/memory-search](/de/concepts/memory-search)
- [/concepts/session-pruning](/de/concepts/session-pruning)
- [/reference/transcript-hygiene](/de/reference/transcript-hygiene)

---

## Source of Truth: das Gateway

OpenClaw ist um einen einzelnen **Gateway-Prozess** herum aufgebaut, der den Sitzungszustand verwaltet.

- UIs (macOS-App, Web-Control-UI, TUI) sollten das Gateway nach Sitzungslisten und Token-Zahlen fragen.
- Im Remote-Modus liegen Sitzungsdateien auf dem Remote-Host; „Ihre lokalen Mac-Dateien zu prüfen“ spiegelt nicht wider, was das Gateway tatsächlich verwendet.

---

## Zwei Persistenzschichten

OpenClaw persistiert Sitzungen in zwei Schichten:

1. **Sitzungsspeicher (`sessions.json`)**
   - Key/Value-Map: `sessionKey -> SessionEntry`
   - Klein, veränderbar, sicher zu bearbeiten (oder Einträge zu löschen)
   - Verfolgt Sitzungsmetadaten (aktuelle Sitzungs-ID, letzte Aktivität, Umschalter, Token-Zähler usw.)

2. **Transkript (`<sessionId>.jsonl`)**
   - Append-only-Transkript mit Baumstruktur (Einträge haben `id` + `parentId`)
   - Speichert die eigentliche Konversation + Tool-Aufrufe + Compaction-Zusammenfassungen
   - Wird verwendet, um den Modellkontext für zukünftige Turns wieder aufzubauen

---

## Orte auf dem Datenträger

Pro Agent, auf dem Gateway-Host:

- Store: `~/.openclaw/agents/<agentId>/sessions/sessions.json`
- Transkripte: `~/.openclaw/agents/<agentId>/sessions/<sessionId>.jsonl`
  - Telegram-Topic-Sitzungen: `.../<sessionId>-topic-<threadId>.jsonl`

OpenClaw löst diese über `src/config/sessions.ts` auf.

---

## Store-Wartung und Datenträgerkontrollen

Sitzungspersistenz hat automatische Wartungskontrollen (`session.maintenance`) für `sessions.json` und Transkript-Artefakte:

- `mode`: `warn` (Standard) oder `enforce`
- `pruneAfter`: Altersgrenze für veraltete Einträge (Standard `30d`)
- `maxEntries`: Begrenzung für Einträge in `sessions.json` (Standard `500`)
- `rotateBytes`: `sessions.json` rotieren, wenn es zu groß wird (Standard `10mb`)
- `resetArchiveRetention`: Aufbewahrung für `*.reset.<timestamp>`-Transkriptarchive (Standard: gleich `pruneAfter`; `false` deaktiviert Cleanup)
- `maxDiskBytes`: optionales Budget für das Sitzungsverzeichnis
- `highWaterBytes`: optionales Ziel nach dem Cleanup (Standard `80%` von `maxDiskBytes`)

Reihenfolge der Durchsetzung bei Cleanup des Datenträgerbudgets (`mode: "enforce"`):

1. Zuerst die ältesten archivierten oder verwaisten Transkript-Artefakte entfernen.
2. Wenn weiterhin über dem Ziel, die ältesten Sitzungseinträge und deren Transkriptdateien entfernen.
3. Fortfahren, bis die Nutzung bei oder unter `highWaterBytes` liegt.

Im Modus `warn` meldet OpenClaw mögliche Verdrängungen, verändert aber den Store bzw. die Dateien nicht.

Wartung bei Bedarf ausführen:

```bash
openclaw sessions cleanup --dry-run
openclaw sessions cleanup --enforce
```

---

## Cron-Sitzungen und Run-Logs

Isolierte Cron-Läufe erzeugen ebenfalls Sitzungseinträge/Transkripte und haben dedizierte Aufbewahrungskontrollen:

- `cron.sessionRetention` (Standard `24h`) entfernt alte isolierte Sitzungen von Cron-Runs aus dem Sitzungsspeicher (`false` deaktiviert dies).
- `cron.runLog.maxBytes` + `cron.runLog.keepLines` bereinigen Dateien `~/.openclaw/cron/runs/<jobId>.jsonl` (Standards: `2_000_000` Bytes und `2000` Zeilen).

---

## Sitzungsschlüssel (`sessionKey`)

Ein `sessionKey` identifiziert, *in welchem Konversations-Bucket* Sie sich befinden (Routing + Isolation).

Häufige Muster:

- Haupt-/Direktchat (pro Agent): `agent:<agentId>:<mainKey>` (Standard `main`)
- Gruppe: `agent:<agentId>:<channel>:group:<id>`
- Raum/Kanal (Discord/Slack): `agent:<agentId>:<channel>:channel:<id>` oder `...:room:<id>`
- Cron: `cron:<job.id>`
- Webhook: `hook:<uuid>` (sofern nicht überschrieben)

Die kanonischen Regeln sind unter [/concepts/session](/de/concepts/session) dokumentiert.

---

## Sitzungs-IDs (`sessionId`)

Jeder `sessionKey` zeigt auf eine aktuelle `sessionId` (die Transkriptdatei, die die Konversation fortsetzt).

Faustregeln:

- **Reset** (`/new`, `/reset`) erzeugt eine neue `sessionId` für diesen `sessionKey`.
- **Täglicher Reset** (standardmäßig um 4:00 Uhr lokale Zeit auf dem Gateway-Host) erzeugt bei der nächsten Nachricht nach der Reset-Grenze eine neue `sessionId`.
- **Ablauf bei Inaktivität** (`session.reset.idleMinutes` oder veraltet `session.idleMinutes`) erzeugt eine neue `sessionId`, wenn nach dem Inaktivitätsfenster eine Nachricht eintrifft. Wenn täglicher Reset + Inaktivität beide konfiguriert sind, gewinnt derjenige, der zuerst abläuft.
- **Parent-Fork-Schutz für Threads** (`session.parentForkMaxTokens`, Standard `100000`) überspringt Parent-Transkript-Forking, wenn die Parent-Sitzung bereits zu groß ist; der neue Thread startet frisch. Setzen Sie `0`, um dies zu deaktivieren.

Implementierungsdetail: Die Entscheidung fällt in `initSessionState()` in `src/auto-reply/reply/session.ts`.

---

## Schema des Sitzungsspeichers (`sessions.json`)

Der Werttyp des Stores ist `SessionEntry` in `src/config/sessions.ts`.

Wichtige Felder (nicht vollständig):

- `sessionId`: aktuelle Transkript-ID (Dateiname wird daraus abgeleitet, sofern nicht `sessionFile` gesetzt ist)
- `updatedAt`: Zeitstempel der letzten Aktivität
- `sessionFile`: optionale explizite Überschreibung des Transkriptpfads
- `chatType`: `direct | group | room` (hilft UIs und Send-Richtlinien)
- `provider`, `subject`, `room`, `space`, `displayName`: Metadaten für Gruppen-/Kanalbeschriftung
- Umschalter:
  - `thinkingLevel`, `verboseLevel`, `reasoningLevel`, `elevatedLevel`
  - `sendPolicy` (Überschreibung pro Sitzung)
- Modellauswahl:
  - `providerOverride`, `modelOverride`, `authProfileOverride`
- Token-Zähler (Best Effort / providerabhängig):
  - `inputTokens`, `outputTokens`, `totalTokens`, `contextTokens`
- `compactionCount`: wie oft automatische Compaction für diesen Sitzungsschlüssel abgeschlossen wurde
- `memoryFlushAt`: Zeitstempel des letzten Memory-Flush vor Compaction
- `memoryFlushCompactionCount`: Anzahl der Compactions, als der letzte Flush lief

Der Store kann sicher bearbeitet werden, aber das Gateway ist die Autorität: Es kann Einträge neu schreiben oder rehydrieren, wenn Sitzungen laufen.

---

## Struktur des Transkripts (`*.jsonl`)

Transkripte werden vom `SessionManager` von `@mariozechner/pi-coding-agent` verwaltet.

Die Datei ist JSONL:

- Erste Zeile: Sitzungs-Header (`type: "session"`, enthält `id`, `cwd`, `timestamp`, optionale `parentSession`)
- Danach: Sitzungseinträge mit `id` + `parentId` (Baum)

Bemerkenswerte Eintragstypen:

- `message`: Nachrichten von Benutzer/Assistent/ToolResult
- `custom_message`: von Erweiterungen injizierte Nachrichten, die *in* den Modellkontext eingehen (können in der UI verborgen sein)
- `custom`: Erweiterungszustand, der *nicht* in den Modellkontext eingeht
- `compaction`: persistierte Compaction-Zusammenfassung mit `firstKeptEntryId` und `tokensBefore`
- `branch_summary`: persistierte Zusammenfassung beim Navigieren eines Baumzweigs

OpenClaw „bereinigt“ Transkripte absichtlich **nicht**; das Gateway verwendet `SessionManager`, um sie zu lesen/schreiben.

---

## Kontextfenster vs. verfolgte Tokens

Zwei unterschiedliche Konzepte sind wichtig:

1. **Kontextfenster des Modells**: harte Obergrenze pro Modell (Tokens, die dem Modell sichtbar sind)
2. **Zähler im Sitzungsspeicher**: rollierende Statistiken, die in `sessions.json` geschrieben werden (werden für /status und Dashboards verwendet)

Wenn Sie Grenzen abstimmen:

- Das Kontextfenster kommt aus dem Modellkatalog (und kann per Konfiguration überschrieben werden).
- `contextTokens` im Store ist ein Runtime-Schätzwert bzw. Berichtswert; behandeln Sie ihn nicht als strikte Garantie.

Mehr dazu unter [/token-use](/de/reference/token-use).

---

## Compaction: was sie ist

Compaction fasst ältere Konversation in einem persistierten Eintrag `compaction` im Transkript zusammen und behält aktuelle Nachrichten intakt.

Nach der Compaction sehen zukünftige Turns:

- Die Compaction-Zusammenfassung
- Nachrichten nach `firstKeptEntryId`

Compaction ist **persistent** (anders als Session Pruning). Siehe [/concepts/session-pruning](/de/concepts/session-pruning).

## Chunk-Grenzen bei Compaction und Tool-Paarung

Wenn OpenClaw ein langes Transkript in Compaction-Chunks aufteilt, hält es
Tool-Aufrufe des Assistenten mit ihren passenden `toolResult`-Einträgen zusammen.

- Wenn die Aufteilung nach Token-Anteil zwischen einem Tool-Aufruf und seinem Resultat landen würde, verschiebt OpenClaw
  die Grenze auf die Assistentennachricht mit dem Tool-Aufruf, statt das Paar zu trennen.
- Wenn ein abschließender `toolResult`-Block den Chunk sonst über das Ziel hinausschieben würde,
  bewahrt OpenClaw diesen ausstehenden Tool-Block und hält den nicht zusammengefassten Tail intakt.
- Abgebrochene/fehlerhafte Tool-Aufruf-Blöcke halten eine ausstehende Aufteilung nicht offen.

---

## Wann automatische Compaction passiert (Pi-Runtime)

Im eingebetteten Pi-Agenten wird automatische Compaction in zwei Fällen ausgelöst:

1. **Wiederherstellung bei Overflow**: Das Modell gibt einen Context-Overflow-Fehler zurück
   (`request_too_large`, `context length exceeded`, `input exceeds the maximum
number of tokens`, `input token count exceeds the maximum number of input
tokens`, `input is too long for the model`, `ollama error: context length
exceeded` und ähnliche providerspezifische Varianten) → compact → retry.
2. **Threshold-Wartung**: nach einem erfolgreichen Turn, wenn:

`contextTokens > contextWindow - reserveTokens`

Wobei:

- `contextWindow` das Kontextfenster des Modells ist
- `reserveTokens` Headroom ist, der für Prompts + die nächste Modellausgabe reserviert wird

Dies sind Semantiken der Pi-Runtime (OpenClaw konsumiert die Ereignisse, aber Pi entscheidet, wann compacted wird).

---

## Compaction-Einstellungen (`reserveTokens`, `keepRecentTokens`)

Pis Compaction-Einstellungen liegen in den Pi-Settings:

```json5
{
  compaction: {
    enabled: true,
    reserveTokens: 16384,
    keepRecentTokens: 20000,
  },
}
```

OpenClaw erzwingt außerdem einen Sicherheitsboden für eingebettete Läufe:

- Wenn `compaction.reserveTokens < reserveTokensFloor`, erhöht OpenClaw ihn.
- Standardboden ist `20000` Tokens.
- Setzen Sie `agents.defaults.compaction.reserveTokensFloor: 0`, um den Boden zu deaktivieren.
- Wenn er bereits höher ist, lässt OpenClaw ihn unverändert.

Warum: genug Headroom für mehrturniges „Housekeeping“ lassen (wie Memory-Schreibvorgänge), bevor Compaction unvermeidbar wird.

Implementierung: `ensurePiCompactionReserveTokens()` in `src/agents/pi-settings.ts`
(aufgerufen von `src/agents/pi-embedded-runner.ts`).

---

## Austauschbare Compaction-Provider

Plugins können einen Compaction-Provider über `registerCompactionProvider()` auf der Plugin-API registrieren. Wenn `agents.defaults.compaction.provider` auf eine registrierte Provider-ID gesetzt ist, delegiert die Safeguard-Erweiterung die Zusammenfassung an diesen Provider statt an die eingebaute Pipeline `summarizeInStages`.

- `provider`: ID eines registrierten Compaction-Provider-Plugins. Für Standard-LLM-Zusammenfassung nicht setzen.
- Das Setzen eines `provider` erzwingt `mode: "safeguard"`.
- Provider erhalten dieselben Compaction-Anweisungen und dieselbe Richtlinie zur Beibehaltung von Identifikatoren wie der eingebaute Pfad.
- Die Safeguard-Erweiterung bewahrt nach der Ausgabe des Providers weiterhin den Suffix-Kontext aktueller Turns und aufgeteilter Turns.
- Wenn der Provider fehlschlägt oder ein leeres Ergebnis zurückgibt, fällt OpenClaw automatisch auf die eingebaute LLM-Zusammenfassung zurück.
- Abort-/Timeout-Signale werden erneut ausgelöst (nicht verschluckt), um die Abbruchanforderung des Aufrufers zu respektieren.

Quelle: `src/plugins/compaction-provider.ts`, `src/agents/pi-hooks/compaction-safeguard.ts`.

---

## Für Benutzer sichtbare Oberflächen

Sie können Compaction und Sitzungszustand beobachten über:

- `/status` (in jeder Chat-Sitzung)
- `openclaw status` (CLI)
- `openclaw sessions` / `sessions --json`
- Verbose-Modus: `🧹 Auto-compaction complete` + Compaction-Zähler

---

## Stilles Housekeeping (`NO_REPLY`)

OpenClaw unterstützt „stille“ Turns für Hintergrundaufgaben, bei denen der Benutzer keine Zwischenausgabe sehen soll.

Konvention:

- Der Assistent beginnt seine Ausgabe mit dem exakten stillen Token `NO_REPLY` /
  `no_reply`, um „keine Antwort an den Benutzer ausliefern“ anzuzeigen.
- OpenClaw entfernt/unterdrückt dies in der Zustellungsschicht.
- Die Unterdrückung des exakten stillen Tokens ist nicht case-sensitiv, daher zählen `NO_REPLY` und
  `no_reply` beide, wenn die gesamte Nutzlast nur aus dem stillen Token besteht.
- Dies ist nur für echte Hintergrund-/Nicht-Zustellungs-Turns gedacht; es ist keine Abkürzung für
  normale umsetzbare Benutzeranfragen.

Seit `2026.1.10` unterdrückt OpenClaw außerdem **Draft-/Typing-Streaming**, wenn ein
partieller Chunk mit `NO_REPLY` beginnt, sodass stille Operationen keine partielle
Ausgabe mitten im Turn durchsickern lassen.

---

## Memory-Flush vor Compaction (implementiert)

Ziel: Bevor automatische Compaction passiert, einen stillen agentischen Turn ausführen, der dauerhaften
Zustand auf den Datenträger schreibt (z. B. `memory/YYYY-MM-DD.md` im Agent-Workspace), damit Compaction keinen
kritischen Kontext löschen kann.

OpenClaw verwendet den Ansatz **Flush vor dem Threshold**:

1. Die Nutzung des Sitzungskontexts überwachen.
2. Wenn sie einen „weichen Threshold“ überschreitet (unterhalb von Pis Compaction-Threshold), einen stillen
   „Memory jetzt schreiben“-Befehl an den Agenten ausführen.
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
- Der Flush läuft einmal pro Compaction-Zyklus (verfolgt in `sessions.json`).
- Der Flush läuft nur für eingebettete Pi-Sitzungen (CLI-Backends überspringen ihn).
- Der Flush wird übersprungen, wenn der Sitzungs-Workspace schreibgeschützt ist (`workspaceAccess: "ro"` oder `"none"`).
- Siehe [Memory](/de/concepts/memory) für das Dateilayout des Workspace und Schreibmuster.

Pi stellt außerdem einen Hook `session_before_compact` in der Erweiterungs-API bereit, aber OpenClaws
Flush-Logik lebt heute auf der Gateway-Seite.

---

## Checkliste zur Fehlerbehebung

- Falscher Sitzungsschlüssel? Beginnen Sie mit [/concepts/session](/de/concepts/session) und prüfen Sie den `sessionKey` in `/status`.
- Store und Transkript stimmen nicht überein? Bestätigen Sie den Gateway-Host und den Store-Pfad aus `openclaw status`.
- Compaction-Spam? Prüfen Sie:
  - Kontextfenster des Modells (zu klein)
  - Compaction-Einstellungen (`reserveTokens` zu hoch für das Modellfenster kann frühere Compaction verursachen)
  - `toolResult`-Aufblähung: Session Pruning aktivieren/abstimmen
- Stille Turns leaken? Prüfen Sie, ob die Antwort mit `NO_REPLY` beginnt (case-insensitives exaktes Token) und ob Sie einen Build mit dem Fix zur Streaming-Unterdrückung verwenden.

## Verwandt

- [Sitzungsverwaltung](/de/concepts/session)
- [Session Pruning](/de/concepts/session-pruning)
- [Context Engine](/de/concepts/context-engine)
