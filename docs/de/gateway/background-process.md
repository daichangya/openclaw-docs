---
read_when:
    - Hinzufügen oder Ändern des Verhaltens von Background Exec
    - Debuggen lang laufender Exec-Aufgaben
summary: Hintergrundausführung von exec und Prozessverwaltung
title: Background Exec and Process Tool
x-i18n:
    generated_at: "2026-04-05T12:41:51Z"
    model: gpt-5.4
    provider: openai
    source_hash: 4398e2850f6f050944f103ad637cd9f578e9cc7fb478bc5cd5d972c92289b831
    source_path: gateway/background-process.md
    workflow: 15
---

# Background Exec + Process Tool

OpenClaw führt Shell-Befehle über das Tool `exec` aus und hält lang laufende Aufgaben im Speicher. Das Tool `process` verwaltet diese Hintergrundsitzungen.

## exec-Tool

Wichtige Parameter:

- `command` (erforderlich)
- `yieldMs` (Standard 10000): nach dieser Verzögerung automatisch in den Hintergrund verschieben
- `background` (bool): sofort in den Hintergrund verschieben
- `timeout` (Sekunden, Standard 1800): den Prozess nach diesem Timeout beenden
- `elevated` (bool): außerhalb der Sandbox ausführen, wenn der erhöhte Modus aktiviert/erlaubt ist (standardmäßig `gateway` oder `node`, wenn das exec-Ziel `node` ist)
- Benötigen Sie ein echtes TTY? Setzen Sie `pty: true`.
- `workdir`, `env`

Verhalten:

- Ausführungen im Vordergrund geben die Ausgabe direkt zurück.
- Wenn sie in den Hintergrund verschoben werden (explizit oder per Timeout), gibt das Tool `status: "running"` + `sessionId` und einen kurzen Tail zurück.
- Die Ausgabe bleibt im Speicher, bis die Sitzung abgefragt oder gelöscht wird.
- Wenn das Tool `process` nicht erlaubt ist, läuft `exec` synchron und ignoriert `yieldMs`/`background`.
- Von `exec` gestartete Befehle erhalten `OPENCLAW_SHELL=exec` für kontextabhängige Shell-/Profilregeln.
- Für lang laufende Arbeit, die jetzt beginnt, starten Sie sie einmal und verlassen Sie sich auf das automatische
  Completion-Wake, wenn es aktiviert ist und der Befehl Ausgabe erzeugt oder fehlschlägt.
- Wenn automatisches Completion-Wake nicht verfügbar ist oder Sie eine stille Erfolgs-
  Bestätigung für einen Befehl benötigen, der sauber ohne Ausgabe beendet wurde, verwenden Sie `process`,
  um den Abschluss zu bestätigen.
- Emulieren Sie Erinnerungen oder verzögerte Nachverfolgungen nicht mit `sleep`-Schleifen oder wiederholtem
  Polling; verwenden Sie cron für zukünftige Arbeit.

## Bridging von Kindprozessen

Wenn lang laufende Kindprozesse außerhalb der exec/process-Tools gestartet werden (zum Beispiel CLI-Respawns oder Gateway-Helfer), hängen Sie den Child-Process-Bridge-Helper an, damit Beendigungssignale weitergeleitet werden und Listener bei Exit/Fehler entfernt werden. Das vermeidet verwaiste Prozesse unter systemd und sorgt plattformübergreifend für konsistentes Shutdown-Verhalten.

Überschreibungen per Umgebung:

- `PI_BASH_YIELD_MS`: Standard-Yield (ms)
- `PI_BASH_MAX_OUTPUT_CHARS`: In-Memory-Ausgabeobergrenze (Zeichen)
- `OPENCLAW_BASH_PENDING_MAX_OUTPUT_CHARS`: Obergrenze für ausstehendes stdout/stderr pro Stream (Zeichen)
- `PI_BASH_JOB_TTL_MS`: TTL für beendete Sitzungen (ms, begrenzt auf 1 Min.–3 Std.)

Konfiguration (bevorzugt):

- `tools.exec.backgroundMs` (Standard 10000)
- `tools.exec.timeoutSec` (Standard 1800)
- `tools.exec.cleanupMs` (Standard 1800000)
- `tools.exec.notifyOnExit` (Standard true): ein Systemereignis in die Warteschlange stellen + Heartbeat anfordern, wenn ein im Hintergrund ausgeführter exec beendet wird.
- `tools.exec.notifyOnExitEmptySuccess` (Standard false): wenn true, auch Completion-Ereignisse für erfolgreiche Hintergrundläufe ohne Ausgabe in die Warteschlange stellen.

## process-Tool

Aktionen:

- `list`: laufende + beendete Sitzungen
- `poll`: neue Ausgabe für eine Sitzung abrufen (meldet auch den Exit-Status)
- `log`: die aggregierte Ausgabe lesen (unterstützt `offset` + `limit`)
- `write`: stdin senden (`data`, optional `eof`)
- `send-keys`: explizite Schlüsseltoken oder Bytes an eine PTY-gestützte Sitzung senden
- `submit`: Enter / Wagenrücklauf an eine PTY-gestützte Sitzung senden
- `paste`: Literaltext senden, optional mit bracketed paste mode
- `kill`: eine Hintergrundsitzung beenden
- `clear`: eine beendete Sitzung aus dem Speicher entfernen
- `remove`: falls laufend beenden, andernfalls falls beendet löschen

Hinweise:

- Nur Hintergrundsitzungen werden im Speicher aufgelistet/gespeichert.
- Sitzungen gehen bei einem Prozessneustart verloren (keine Persistenz auf Festplatte).
- Sitzungslogs werden nur im Chatverlauf gespeichert, wenn Sie `process poll/log` ausführen und das Tool-Ergebnis aufgezeichnet wird.
- `process` ist pro Agent begrenzt; es sieht nur Sitzungen, die von diesem Agenten gestartet wurden.
- Verwenden Sie `poll` / `log` für Status, Logs, stille Erfolgsbestätigung oder
  Abschlussbestätigung, wenn automatisches Completion-Wake nicht verfügbar ist.
- Verwenden Sie `write` / `send-keys` / `submit` / `paste` / `kill`, wenn Sie Eingaben
  oder Eingriffe benötigen.
- `process list` enthält einen abgeleiteten `name` (Befehlsverb + Ziel) für schnelle Übersichten.
- `process log` verwendet zeilenbasiertes `offset`/`limit`.
- Wenn sowohl `offset` als auch `limit` fehlen, werden die letzten 200 Zeilen zurückgegeben und ein Paging-Hinweis eingeschlossen.
- Wenn `offset` angegeben ist und `limit` fehlt, wird von `offset` bis zum Ende zurückgegeben (nicht auf 200 begrenzt).
- Polling ist für Status bei Bedarf gedacht, nicht für Scheduling mit Warteschleifen. Wenn die Arbeit
  später stattfinden soll, verwenden Sie stattdessen cron.

## Beispiele

Eine lang laufende Aufgabe ausführen und später abfragen:

```json
{ "tool": "exec", "command": "sleep 5 && echo done", "yieldMs": 1000 }
```

```json
{ "tool": "process", "action": "poll", "sessionId": "<id>" }
```

Sofort im Hintergrund starten:

```json
{ "tool": "exec", "command": "npm run build", "background": true }
```

stdin senden:

```json
{ "tool": "process", "action": "write", "sessionId": "<id>", "data": "y\n" }
```

PTY-Tasten senden:

```json
{ "tool": "process", "action": "send-keys", "sessionId": "<id>", "keys": ["C-c"] }
```

Aktuelle Zeile absenden:

```json
{ "tool": "process", "action": "submit", "sessionId": "<id>" }
```

Literaltext einfügen:

```json
{ "tool": "process", "action": "paste", "sessionId": "<id>", "text": "line1\nline2\n" }
```
