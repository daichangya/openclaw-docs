---
read_when:
    - Sie möchten eine einsteigerfreundliche Einführung in die TUI
    - Sie benötigen die vollständige Liste der TUI-Funktionen, Befehle und Tastenkürzel
summary: 'Terminal-UI (TUI): mit dem Gateway verbinden oder lokal im eingebetteten Modus ausführen'
title: TUI
x-i18n:
    generated_at: "2026-04-24T07:07:09Z"
    model: gpt-5.4
    provider: openai
    source_hash: 6168ab6cec8e0069f660ddcfca03275c407b613b6eb756aa6ef7e97f2312effe
    source_path: web/tui.md
    workflow: 15
---

## Schnellstart

### Gateway-Modus

1. Gateway starten.

```bash
openclaw gateway
```

2. Die TUI öffnen.

```bash
openclaw tui
```

3. Eine Nachricht eingeben und Enter drücken.

Remote-Gateway:

```bash
openclaw tui --url ws://<host>:<port> --token <gateway-token>
```

Verwenden Sie `--password`, wenn Ihr Gateway Passwort-Authentifizierung verwendet.

### Lokaler Modus

Die TUI ohne Gateway ausführen:

```bash
openclaw chat
# oder
openclaw tui --local
```

Hinweise:

- `openclaw chat` und `openclaw terminal` sind Aliasse für `openclaw tui --local`.
- `--local` kann nicht mit `--url`, `--token` oder `--password` kombiniert werden.
- Der lokale Modus verwendet die eingebettete Agent-Laufzeit direkt. Die meisten lokalen Tools funktionieren, aber nur über das Gateway verfügbare Funktionen sind nicht vorhanden.

## Was Sie sehen

- Kopfzeile: Verbindungs-URL, aktueller Agent, aktuelle Sitzung.
- Chat-Log: Benutzernachrichten, Assistant-Antworten, Systemhinweise, Tool-Karten.
- Statuszeile: Verbindungs-/Laufzustand (connecting, running, streaming, idle, error).
- Fußzeile: Verbindungsstatus + Agent + Sitzung + Modell + think/fast/verbose/trace/reasoning + Token-Zählungen + deliver.
- Eingabe: Texteditor mit Autovervollständigung.

## Mentales Modell: Agenten + Sitzungen

- Agenten sind eindeutige Slugs (z. B. `main`, `research`). Das Gateway stellt die Liste bereit.
- Sitzungen gehören zum aktuellen Agenten.
- Sitzungsschlüssel werden als `agent:<agentId>:<sessionKey>` gespeichert.
  - Wenn Sie `/session main` eingeben, erweitert die TUI dies zu `agent:<currentAgent>:main`.
  - Wenn Sie `/session agent:other:main` eingeben, wechseln Sie explizit zu dieser Agentensitzung.
- Sitzungs-Scope:
  - `per-sender` (Standard): jeder Agent hat viele Sitzungen.
  - `global`: die TUI verwendet immer die Sitzung `global` (der Picker kann leer sein).
- Der aktuelle Agent + die aktuelle Sitzung sind immer in der Fußzeile sichtbar.

## Senden + Zustellung

- Nachrichten werden an das Gateway gesendet; Zustellung an Provider ist standardmäßig aus.
- Zustellung einschalten:
  - `/deliver on`
  - oder über das Einstellungsfenster
  - oder mit `openclaw tui --deliver` starten

## Picker + Overlays

- Modell-Picker: verfügbare Modelle auflisten und die Sitzungsüberschreibung setzen.
- Agenten-Picker: einen anderen Agenten auswählen.
- Sitzungs-Picker: zeigt nur Sitzungen für den aktuellen Agenten.
- Einstellungen: Deliver, Erweiterung der Tool-Ausgabe und Sichtbarkeit von Thinking umschalten.

## Tastenkürzel

- Enter: Nachricht senden
- Esc: aktiven Lauf abbrechen
- Ctrl+C: Eingabe leeren (zweimal drücken zum Beenden)
- Ctrl+D: beenden
- Ctrl+L: Modell-Picker
- Ctrl+G: Agenten-Picker
- Ctrl+P: Sitzungs-Picker
- Ctrl+O: Erweiterung der Tool-Ausgabe umschalten
- Ctrl+T: Sichtbarkeit von Thinking umschalten (lädt Verlauf neu)

## Slash-Befehle

Core:

- `/help`
- `/status`
- `/agent <id>` (oder `/agents`)
- `/session <key>` (oder `/sessions`)
- `/model <provider/model>` (oder `/models`)

Sitzungssteuerung:

- `/think <off|minimal|low|medium|high>`
- `/fast <status|on|off>`
- `/verbose <on|full|off>`
- `/trace <on|off>`
- `/reasoning <on|off|stream>`
- `/usage <off|tokens|full>`
- `/elevated <on|off|ask|full>` (Alias: `/elev`)
- `/activation <mention|always>`
- `/deliver <on|off>`

Sitzungslebenszyklus:

- `/new` oder `/reset` (Sitzung zurücksetzen)
- `/abort` (aktiven Lauf abbrechen)
- `/settings`
- `/exit`

Nur lokaler Modus:

- `/auth [provider]` öffnet den Auth-/Login-Ablauf des Providers innerhalb der TUI.

Andere Slash-Befehle des Gateway (zum Beispiel `/context`) werden an das Gateway weitergeleitet und als Systemausgabe angezeigt. Siehe [Slash commands](/de/tools/slash-commands).

## Lokale Shell-Befehle

- Stellen Sie einer Zeile `!` voran, um einen lokalen Shell-Befehl auf dem TUI-Host auszuführen.
- Die TUI fragt einmal pro Sitzung nach, ob lokale Ausführung erlaubt werden soll; wenn Sie ablehnen, bleibt `!` für die Sitzung deaktiviert.
- Befehle laufen in einer frischen, nicht interaktiven Shell im Arbeitsverzeichnis der TUI (kein persistentes `cd`/env).
- Lokale Shell-Befehle erhalten `OPENCLAW_SHELL=tui-local` in ihrer Umgebung.
- Ein einzelnes `!` wird als normale Nachricht gesendet; führende Leerzeichen lösen kein lokales `exec` aus.

## Konfigurationen aus der lokalen TUI reparieren

Verwenden Sie den lokalen Modus, wenn die aktuelle Konfiguration bereits gültig ist und Sie möchten, dass die eingebettete Agent-Laufzeit sie auf demselben Rechner prüft, mit der Dokumentation vergleicht und dabei hilft, Drift zu reparieren, ohne von einem laufenden Gateway abhängig zu sein.

Wenn `openclaw config validate` bereits fehlschlägt, beginnen Sie zuerst mit `openclaw configure` oder `openclaw doctor --fix`. `openclaw chat` umgeht die Schranke bei ungültiger Konfiguration nicht.

Typischer Ablauf:

1. Lokalen Modus starten:

```bash
openclaw chat
```

2. Den Agenten fragen, was geprüft werden soll, zum Beispiel:

```text
Vergleiche meine Gateway-Auth-Konfiguration mit der Doku und schlage die kleinste Korrektur vor.
```

3. Lokale Shell-Befehle für exakte Evidenz und Validierung verwenden:

```text
!openclaw config file
!openclaw docs gateway auth token secretref
!openclaw config validate
!openclaw doctor
```

4. Kleine Änderungen mit `openclaw config set` oder `openclaw configure` anwenden, dann `!openclaw config validate` erneut ausführen.
5. Wenn Doctor eine automatische Migration oder Reparatur empfiehlt, prüfen Sie sie und führen Sie `!openclaw doctor --fix` aus.

Tipps:

- Bevorzugen Sie `openclaw config set` oder `openclaw configure` statt `openclaw.json` von Hand zu bearbeiten.
- `openclaw docs "<query>"` durchsucht den Live-Dokuindex auf demselben Rechner.
- `openclaw config validate --json` ist nützlich, wenn Sie strukturierte Schema- und SecretRef-/Auflösbarkeitsfehler möchten.

## Tool-Ausgabe

- Tool-Aufrufe werden als Karten mit Argumenten + Ergebnissen angezeigt.
- Ctrl+O schaltet zwischen eingeklappter/erweiterter Ansicht um.
- Während Tools laufen, werden partielle Aktualisierungen in dieselbe Karte gestreamt.

## Terminalfarben

- Die TUI belässt den Textkörper des Assistant in der Standard-Vordergrundfarbe Ihres Terminals, sodass dunkle und helle Terminals beide lesbar bleiben.
- Wenn Ihr Terminal einen hellen Hintergrund hat und die automatische Erkennung falsch liegt, setzen Sie vor dem Start von `openclaw tui` `OPENCLAW_THEME=light`.
- Um stattdessen die ursprüngliche dunkle Palette zu erzwingen, setzen Sie `OPENCLAW_THEME=dark`.

## Verlauf + Streaming

- Beim Verbinden lädt die TUI den letzten Verlauf (standardmäßig 200 Nachrichten).
- Streaming-Antworten aktualisieren sich an Ort und Stelle, bis sie finalisiert sind.
- Die TUI lauscht auch auf Agent-Tool-Ereignisse für reichhaltigere Tool-Karten.

## Verbindungsdetails

- Die TUI registriert sich beim Gateway als `mode: "tui"`.
- Wiederverbindungen zeigen eine Systemnachricht; Ereignislücken werden im Log angezeigt.

## Optionen

- `--local`: Gegen die lokale eingebettete Agent-Laufzeit ausführen
- `--url <url>`: Gateway-WebSocket-URL (Standard aus Konfiguration oder `ws://127.0.0.1:<port>`)
- `--token <token>`: Gateway-Token (falls erforderlich)
- `--password <password>`: Gateway-Passwort (falls erforderlich)
- `--session <key>`: Sitzungsschlüssel (Standard: `main`, oder `global`, wenn der Scope global ist)
- `--deliver`: Assistant-Antworten an den Provider zustellen (standardmäßig aus)
- `--thinking <level>`: Thinking-Stufe für Sendungen überschreiben
- `--message <text>`: Nach dem Verbinden eine initiale Nachricht senden
- `--timeout-ms <ms>`: Agent-Timeout in ms (Standard aus `agents.defaults.timeoutSeconds`)
- `--history-limit <n>`: Anzahl der zu ladenden Verlaufseinträge (Standard `200`)

Hinweis: Wenn Sie `--url` setzen, greift die TUI nicht auf Anmeldedaten aus Konfiguration oder Umgebung zurück.
Übergeben Sie `--token` oder `--password` explizit. Fehlende explizite Anmeldedaten sind ein Fehler.
Im lokalen Modus dürfen Sie `--url`, `--token` oder `--password` nicht übergeben.

## Fehlerbehebung

Keine Ausgabe nach dem Senden einer Nachricht:

- Führen Sie `/status` in der TUI aus, um zu bestätigen, dass das Gateway verbunden und im Zustand idle/busy ist.
- Prüfen Sie die Gateway-Logs: `openclaw logs --follow`.
- Bestätigen Sie, dass der Agent laufen kann: `openclaw status` und `openclaw models status`.
- Wenn Sie Nachrichten in einem Chat-Kanal erwarten, aktivieren Sie Deliver (`/deliver on` oder `--deliver`).

## Fehlerbehebung bei Verbindungen

- `disconnected`: Stellen Sie sicher, dass das Gateway läuft und Ihre Angaben zu `--url/--token/--password` korrekt sind.
- Keine Agenten im Picker: prüfen Sie `openclaw agents list` und Ihre Routing-Konfiguration.
- Leerer Sitzungs-Picker: Sie befinden sich möglicherweise im globalen Scope oder haben noch keine Sitzungen.

## Verwandt

- [Control UI](/de/web/control-ui) — webbasierte Steueroberfläche
- [Config](/de/cli/config) — `openclaw.json` prüfen, validieren und bearbeiten
- [Doctor](/de/cli/doctor) — geführte Reparatur- und Migrationsprüfungen
- [CLI Reference](/de/cli) — vollständige CLI-Befehlsreferenz
