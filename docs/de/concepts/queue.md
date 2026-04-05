---
read_when:
    - Ausführung oder Nebenläufigkeit von Auto-Reply ändern
summary: Entwurf der Befehlswarteschlange, die eingehende Auto-Reply-Läufe serialisiert
title: Befehlswarteschlange
x-i18n:
    generated_at: "2026-04-05T12:40:38Z"
    model: gpt-5.4
    provider: openai
    source_hash: 36e1d004e9a2c21ad1470517a249285216114dd4cf876681cc860e992c73914f
    source_path: concepts/queue.md
    workflow: 15
---

# Befehlswarteschlange (2026-01-16)

Wir serialisieren eingehende Auto-Reply-Läufe (alle Channels) über eine kleine prozessinterne Warteschlange, um zu verhindern, dass mehrere Agent-Läufe miteinander kollidieren, und erlauben gleichzeitig sichere Parallelität über Sitzungen hinweg.

## Warum

- Auto-Reply-Läufe können teuer sein (LLM-Aufrufe) und kollidieren, wenn mehrere eingehende Nachrichten in kurzem Abstand eintreffen.
- Die Serialisierung vermeidet Konkurrenz um gemeinsam genutzte Ressourcen (Sitzungsdateien, Logs, CLI-stdin) und reduziert die Wahrscheinlichkeit von Upstream-Rate-Limits.

## So funktioniert es

- Eine lane-bewusste FIFO-Warteschlange leert jede Lane mit einer konfigurierbaren Nebenläufigkeitsgrenze (Standard 1 für nicht konfigurierte Lanes; `main` standardmäßig 4, `subagent` 8).
- `runEmbeddedPiAgent` reiht nach **Sitzungsschlüssel** ein (Lane `session:<key>`), um zu garantieren, dass pro Sitzung nur ein aktiver Lauf existiert.
- Jeder Sitzungslauf wird dann in eine **globale Lane** eingereiht (`main` standardmäßig), sodass die Gesamtparallelität durch `agents.defaults.maxConcurrent` begrenzt wird.
- Wenn ausführliches Logging aktiviert ist, geben eingereihte Läufe einen kurzen Hinweis aus, wenn sie vor dem Start mehr als etwa 2 s gewartet haben.
- Tippindikatoren werden beim Einreihen weiterhin sofort ausgelöst (wenn vom Channel unterstützt), sodass die Benutzererfahrung unverändert bleibt, während wir warten.

## Queue-Modi (pro Channel)

Eingehende Nachrichten können den aktuellen Lauf steuern, auf einen Folge-Turn warten oder beides:

- `steer`: sofort in den aktuellen Lauf einspeisen (bricht ausstehende Tool-Aufrufe nach der nächsten Tool-Grenze ab). Wenn kein Streaming aktiv ist, Fallback auf Follow-up.
- `followup`: für den nächsten Agent-Turn einreihen, nachdem der aktuelle Lauf endet.
- `collect`: alle eingereihten Nachrichten in **einen einzigen** Folge-Turn zusammenfassen (Standard). Wenn Nachrichten auf unterschiedliche Channels/Threads zielen, werden sie einzeln geleert, um das Routing zu erhalten.
- `steer-backlog` (alias `steer+backlog`): jetzt steuern **und** die Nachricht für einen Folge-Turn erhalten.
- `interrupt` (Legacy): den aktiven Lauf für diese Sitzung abbrechen und dann die neueste Nachricht ausführen.
- `queue` (Legacy-Alias): identisch mit `steer`.

`Steer-backlog` bedeutet, dass Sie nach dem gelenkten Lauf eine Folgeantwort erhalten können, sodass Streaming-Oberflächen wie Duplikate aussehen können. Bevorzugen Sie `collect`/`steer`, wenn Sie eine Antwort pro eingehender Nachricht möchten.
Senden Sie `/queue collect` als eigenständigen Befehl (pro Sitzung) oder setzen Sie `messages.queue.byChannel.discord: "collect"`.

Standards (wenn in der Konfiguration nicht gesetzt):

- Alle Oberflächen → `collect`

Global oder pro Channel über `messages.queue` konfigurieren:

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

## Queue-Optionen

Optionen gelten für `followup`, `collect` und `steer-backlog` (sowie für `steer`, wenn es auf Follow-up zurückfällt):

- `debounceMs`: auf Ruhe warten, bevor ein Folge-Turn gestartet wird (verhindert „continue, continue“).
- `cap`: maximale Anzahl eingereihter Nachrichten pro Sitzung.
- `drop`: Überlaufrichtlinie (`old`, `new`, `summarize`).

`Summarize` behält eine kurze Liste der verworfenen Nachrichten und speist sie als synthetischen Follow-up-Prompt ein.
Standards: `debounceMs: 1000`, `cap: 20`, `drop: summarize`.

## Überschreibungen pro Sitzung

- Senden Sie `/queue <mode>` als eigenständigen Befehl, um den Modus für die aktuelle Sitzung zu speichern.
- Optionen können kombiniert werden: `/queue collect debounce:2s cap:25 drop:summarize`
- `/queue default` oder `/queue reset` löscht die Sitzungsüberschreibung.

## Umfang und Garantien

- Gilt für Auto-Reply-Agent-Läufe über alle eingehenden Channels, die die Gateway-Antwort-Pipeline verwenden (WhatsApp web, Telegram, Slack, Discord, Signal, iMessage, WebChat usw.).
- Die Standard-Lane (`main`) gilt prozessweit für eingehend + Haupt-Heartbeats; setzen Sie `agents.defaults.maxConcurrent`, um mehrere Sitzungen parallel zuzulassen.
- Zusätzliche Lanes können existieren (z. B. `cron`, `subagent`), sodass Hintergrundjobs parallel laufen können, ohne eingehende Antworten zu blockieren. Diese losgelösten Läufe werden als [Hintergrundaufgaben](/automation/tasks) verfolgt.
- Lanes pro Sitzung garantieren, dass immer nur ein Agent-Lauf gleichzeitig eine bestimmte Sitzung berührt.
- Keine externen Abhängigkeiten oder Hintergrund-Worker-Threads; reines TypeScript + Promises.

## Fehlerbehebung

- Wenn Befehle festzustecken scheinen, aktivieren Sie ausführliche Logs und suchen Sie nach Zeilen wie „queued for …ms“, um zu bestätigen, dass die Warteschlange abgearbeitet wird.
- Wenn Sie die Warteschlangentiefe benötigen, aktivieren Sie ausführliche Logs und achten Sie auf Zeilen mit Queue-Timings.
