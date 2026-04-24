---
read_when:
    - Ausführung oder Parallelität von Auto-Reply ändern
summary: Entwurf der Befehlswarteschlange, die eingehende Auto-Reply-Läufe serialisiert
title: Befehlswarteschlange
x-i18n:
    generated_at: "2026-04-24T06:35:03Z"
    model: gpt-5.4
    provider: openai
    source_hash: aa442e9aa2f0d6d95770d43e987d19ce8d9343450b302ee448e1fa4ab3feeb15
    source_path: concepts/queue.md
    workflow: 15
---

# Befehlswarteschlange (2026-01-16)

Wir serialisieren eingehende Auto-Reply-Läufe (alle Kanäle) über eine kleine In-Process-Warteschlange, um zu verhindern, dass mehrere Agentenläufe kollidieren, und gleichzeitig sichere Parallelität über Sitzungen hinweg zu ermöglichen.

## Warum

- Auto-Reply-Läufe können teuer sein (LLM-Aufrufe) und kollidieren, wenn mehrere eingehende Nachrichten kurz hintereinander eintreffen.
- Die Serialisierung verhindert Konkurrenz um gemeinsam genutzte Ressourcen (Sitzungsdateien, Logs, CLI-stdin) und verringert die Wahrscheinlichkeit von Rate-Limits auf Upstream-Seite.

## Funktionsweise

- Eine Lane-bewusste FIFO-Warteschlange leert jede Lane mit einer konfigurierbaren Parallelitätsgrenze (Standard 1 für nicht konfigurierte Lanes; `main` hat standardmäßig 4, `subagent` 8).
- `runEmbeddedPiAgent` reiht nach **SessionKey** ein (Lane `session:<key>`), um zu garantieren, dass pro Sitzung nur ein aktiver Lauf existiert.
- Jeder Sitzungslauf wird dann in eine **globale Lane** (`main` standardmäßig) eingereiht, sodass die Gesamtparallelität durch `agents.defaults.maxConcurrent` begrenzt wird.
- Wenn ausführliches Logging aktiviert ist, geben eingereihte Läufe einen kurzen Hinweis aus, wenn sie vor dem Start länger als etwa 2 s gewartet haben.
- Typing-Indikatoren werden weiterhin sofort beim Einreihen ausgelöst (wenn vom Kanal unterstützt), sodass die Benutzererfahrung unverändert bleibt, während wir auf unseren Zug warten.

## Warteschlangenmodi (pro Kanal)

Eingehende Nachrichten können den aktuellen Lauf steuern, auf einen Follow-up-Turnus warten oder beides tun:

- `steer`: sofort in den aktuellen Lauf einschleusen (bricht ausstehende Tool-Aufrufe nach der nächsten Tool-Grenze ab). Wenn nicht gestreamt wird, Fallback auf `followup`.
- `followup`: für den nächsten Agenten-Turnus einreihen, nachdem der aktuelle Lauf beendet ist.
- `collect`: alle eingereihten Nachrichten in **einen einzigen** Follow-up-Turnus zusammenfassen (Standard). Wenn Nachrichten auf unterschiedliche Kanäle/Threads zielen, werden sie einzeln geleert, um das Routing zu bewahren.
- `steer-backlog` (auch `steer+backlog`): jetzt steuern **und** die Nachricht für einen Follow-up-Turnus erhalten.
- `interrupt` (veraltet): den aktiven Lauf für diese Sitzung abbrechen und dann die neueste Nachricht ausführen.
- `queue` (veralteter Alias): identisch mit `steer`.

`steer-backlog` bedeutet, dass Sie nach dem gesteuerten Lauf eine Follow-up-Antwort erhalten können, sodass
Streaming-Oberflächen wie Duplikate wirken können. Bevorzugen Sie `collect`/`steer`, wenn Sie
eine Antwort pro eingehender Nachricht möchten.
Senden Sie `/queue collect` als eigenständigen Befehl (pro Sitzung) oder setzen Sie `messages.queue.byChannel.discord: "collect"`.

Standardwerte (wenn in der Konfiguration nicht gesetzt):

- Alle Oberflächen → `collect`

Global oder pro Kanal über `messages.queue` konfigurieren:

```json5
{
  messages: {
    queue: {
      mode: "collect",
      debounceMs: 1000,
      cap: 20,
      drop: "summarize",
      byChannel: { discord: "collect" },
    },
  },
}
```

## Warteschlangenoptionen

Die Optionen gelten für `followup`, `collect` und `steer-backlog` (sowie für `steer`, wenn es auf `followup` zurückfällt):

- `debounceMs`: vor dem Start eines Follow-up-Turnus auf Ruhe warten (verhindert „weiter, weiter“).
- `cap`: maximale Anzahl eingereihter Nachrichten pro Sitzung.
- `drop`: Overflow-Richtlinie (`old`, `new`, `summarize`).

`Summarize` behält eine kurze Liste mit Aufzählungspunkten der verworfenen Nachrichten und fügt sie als synthetischen Follow-up-Prompt ein.
Standardwerte: `debounceMs: 1000`, `cap: 20`, `drop: summarize`.

## Überschreibungen pro Sitzung

- Senden Sie `/queue <mode>` als eigenständigen Befehl, um den Modus für die aktuelle Sitzung zu speichern.
- Optionen können kombiniert werden: `/queue collect debounce:2s cap:25 drop:summarize`
- `/queue default` oder `/queue reset` löscht die Sitzungsüberschreibung.

## Umfang und Garantien

- Gilt für Auto-Reply-Agentenläufe über alle eingehenden Kanäle, die die Gateway-Antwortpipeline verwenden (WhatsApp Web, Telegram, Slack, Discord, Signal, iMessage, webchat usw.).
- Die Standard-Lane (`main`) gilt prozessweit für eingehende Nachrichten + Main-Heartbeats; setzen Sie `agents.defaults.maxConcurrent`, um mehrere Sitzungen parallel zuzulassen.
- Zusätzliche Lanes können existieren (z. B. `cron`, `subagent`), damit Hintergrundjobs parallel laufen können, ohne eingehende Antworten zu blockieren. Diese losgelösten Läufe werden als [Hintergrundaufgaben](/de/automation/tasks) verfolgt.
- Lanes pro Sitzung garantieren, dass immer nur ein Agentenlauf gleichzeitig eine bestimmte Sitzung berührt.
- Keine externen Abhängigkeiten oder Hintergrund-Worker-Threads; reines TypeScript + Promises.

## Fehlerbehebung

- Wenn Befehle festzustecken scheinen, aktivieren Sie ausführliche Logs und suchen Sie nach Zeilen wie „queued for …ms“, um zu bestätigen, dass die Warteschlange abgearbeitet wird.
- Wenn Sie die Warteschlangentiefe benötigen, aktivieren Sie ausführliche Logs und achten Sie auf Zeilen mit Warteschlangenzeiten.

## Verwandt

- [Sitzungsverwaltung](/de/concepts/session)
- [Retry-Richtlinie](/de/concepts/retry)
