---
read_when:
    - Hinzufügen oder Ändern des Hintergrundverhaltens von Exec
    - Fehleranalyse bei lang laufenden Exec-Aufgaben
summary: Exec-Ausführung im Hintergrund und Prozessverwaltung
title: Exec im Hintergrund und Prozess-Tool
x-i18n:
    generated_at: "2026-04-24T06:36:32Z"
    model: gpt-5.4
    provider: openai
    source_hash: c6dbf6fd0ee39a053fda0a910e95827e9d0e31dcdfbbf542b6ba5d1d63aa48dc
    source_path: gateway/background-process.md
    workflow: 15
---

# Exec im Hintergrund + Process-Tool

OpenClaw führt Shell-Befehle über das Tool `exec` aus und hält lang laufende Aufgaben im Speicher. Das Tool `process` verwaltet diese Hintergrundsitzungen.

## exec-Tool

Wichtige Parameter:

- `command` (erforderlich)
- `yieldMs` (Standard 10000): nach dieser Verzögerung automatisch in den Hintergrund verschieben
- `background` (bool): sofort im Hintergrund ausführen
- `timeout` (Sekunden, Standard 1800): den Prozess nach diesem Zeitlimit beenden
- `elevated` (bool): außerhalb der Sandbox ausführen, wenn der Elevated-Modus aktiviert/erlaubt ist (`gateway` standardmäßig oder `node`, wenn das Exec-Ziel `node` ist)
- Benötigen Sie ein echtes TTY? Setzen Sie `pty: true`.
- `workdir`, `env`

Verhalten:

- Ausführungen im Vordergrund geben die Ausgabe direkt zurück.
- Wenn in den Hintergrund verschoben (explizit oder durch Zeitüberschreitung), gibt das Tool `status: "running"` + `sessionId` und einen kurzen Tail zurück.
- Die Ausgabe wird im Speicher behalten, bis die Sitzung abgefragt oder gelöscht wird.
- Wenn das Tool `process` nicht erlaubt ist, wird `exec` synchron ausgeführt und ignoriert `yieldMs`/`background`.
- Von Exec gestartete Befehle erhalten `OPENCLAW_SHELL=exec` für kontextbewusste Shell-/Profilregeln.
- Für lang laufende Arbeit, die jetzt startet, starten Sie sie einmal und verlassen Sie sich auf das automatische
  Completion-Wake, wenn es aktiviert ist und der Befehl Ausgabe erzeugt oder fehlschlägt.
- Wenn das automatische Completion-Wake nicht verfügbar ist oder Sie eine Bestätigung bei leisem Erfolg
  für einen Befehl benötigen, der sauber ohne Ausgabe beendet wurde, verwenden Sie `process`,
  um den Abschluss zu bestätigen.
- Emulieren Sie Erinnerungen oder verzögerte Nachverfolgungen nicht mit `sleep`-Schleifen oder wiederholtem
  Polling; verwenden Sie Cron für zukünftige Arbeit.

## Bridging von Child-Prozessen

Wenn Sie lang laufende Child-Prozesse außerhalb der Tools exec/process starten (zum Beispiel CLI-Respawns oder Gateway-Helper), binden Sie den Bridge-Helper für Child-Prozesse an, damit Beendigungssignale weitergeleitet werden und Listener bei Exit/Fehler getrennt werden. Das vermeidet verwaiste Prozesse unter systemd und hält das Shutdown-Verhalten plattformübergreifend konsistent.

Umgebungsüberschreibungen:

- `PI_BASH_YIELD_MS`: Standard-Yield (ms)
- `PI_BASH_MAX_OUTPUT_CHARS`: Ausgabeobergrenze im Speicher (Zeichen)
- `OPENCLAW_BASH_PENDING_MAX_OUTPUT_CHARS`: ausstehende stdout-/stderr-Obergrenze pro Stream (Zeichen)
- `PI_BASH_JOB_TTL_MS`: TTL für abgeschlossene Sitzungen (ms, begrenzt auf 1 Min.–3 Std.)

Konfiguration (bevorzugt):

- `tools.exec.backgroundMs` (Standard 10000)
- `tools.exec.timeoutSec` (Standard 1800)
- `tools.exec.cleanupMs` (Standard 1800000)
- `tools.exec.notifyOnExit` (Standard true): reiht ein Systemereignis ein + fordert Heartbeat an, wenn ein im Hintergrund ausgeführter Exec endet.
- `tools.exec.notifyOnExitEmptySuccess` (Standard false): wenn true, werden auch Completion-Ereignisse für erfolgreiche im Hintergrund ausgeführte Runs ohne Ausgabe eingereiht.

## process-Tool

Aktionen:

- `list`: laufende + abgeschlossene Sitzungen
- `poll`: neue Ausgabe für eine Sitzung auslesen (meldet auch den Exit-Status)
- `log`: die aggregierte Ausgabe lesen (unterstützt `offset` + `limit`)
- `write`: stdin senden (`data`, optional `eof`)
- `send-keys`: explizite Schlüsseltokens oder Bytes an eine PTY-gestützte Sitzung senden
- `submit`: Enter / Wagenrücklauf an eine PTY-gestützte Sitzung senden
- `paste`: Literaltext senden, optional in den Bracketed-Paste-Modus eingeschlossen
- `kill`: eine Hintergrundsitzung beenden
- `clear`: eine abgeschlossene Sitzung aus dem Speicher entfernen
- `remove`: beenden, wenn laufend, andernfalls löschen, wenn abgeschlossen

Hinweise:

- Nur in den Hintergrund verschobene Sitzungen werden im Speicher aufgelistet/persistiert.
- Sitzungen gehen bei einem Prozessneustart verloren (keine Persistenz auf Datenträger).
- Sitzungslogs werden nur dann im Chat-Verlauf gespeichert, wenn Sie `process poll/log` ausführen und das Tool-Ergebnis aufgezeichnet wird.
- `process` ist pro Agent begrenzt; es sieht nur Sitzungen, die von diesem Agenten gestartet wurden.
- Verwenden Sie `poll` / `log` für Status, Logs, Bestätigung bei leisem Erfolg oder
  Abschlussbestätigung, wenn das automatische Completion-Wake nicht verfügbar ist.
- Verwenden Sie `write` / `send-keys` / `submit` / `paste` / `kill`, wenn Sie Eingaben
  oder Eingriffe benötigen.
- `process list` enthält einen abgeleiteten `name` (Befehlsverb + Ziel) für schnelle Übersichten.
- `process log` verwendet zeilenbasiertes `offset`/`limit`.
- Wenn sowohl `offset` als auch `limit` fehlen, gibt es die letzten 200 Zeilen zurück und enthält einen Paging-Hinweis.
- Wenn `offset` angegeben wird und `limit` fehlt, gibt es von `offset` bis zum Ende zurück (nicht auf 200 begrenzt).
- Polling dient dem bedarfsgesteuerten Status, nicht der Planung von Warteschleifen. Wenn die Arbeit
  später stattfinden soll, verwenden Sie stattdessen Cron.

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

Stdin senden:

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

## Verwandt

- [Exec-Tool](/de/tools/exec)
- [Exec approvals](/de/tools/exec-approvals)
