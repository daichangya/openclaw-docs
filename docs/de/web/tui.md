---
read_when:
    - Sie möchten eine einsteigerfreundliche Einführung in die TUI
    - Sie benötigen die vollständige Liste der TUI-Funktionen, Befehle und Tastenkürzel
summary: 'Terminal UI (TUI): vom beliebigen Rechner aus eine Verbindung zum Gateway herstellen'
title: TUI
x-i18n:
    generated_at: "2026-04-05T12:59:40Z"
    model: gpt-5.4
    provider: openai
    source_hash: a73f70d65ecc7bff663e8df28c07d70d2920d4732fbb8288c137d65b8653ac52
    source_path: web/tui.md
    workflow: 15
---

# TUI (Terminal UI)

## Schnellstart

1. Starten Sie das Gateway.

```bash
openclaw gateway
```

2. Öffnen Sie die TUI.

```bash
openclaw tui
```

3. Geben Sie eine Nachricht ein und drücken Sie Enter.

Remote-Gateway:

```bash
openclaw tui --url ws://<host>:<port> --token <gateway-token>
```

Verwenden Sie `--password`, wenn Ihr Gateway Passwort-Authentifizierung verwendet.

## Was Sie sehen

- Header: Verbindungs-URL, aktueller Agent, aktuelle Sitzung.
- Chat-Protokoll: Benutzernachrichten, Assistentenantworten, Systemhinweise, Tool-Karten.
- Statuszeile: Verbindungs-/Laufstatus (verbinden, läuft, Streaming, untätig, Fehler).
- Footer: Verbindungsstatus + Agent + Sitzung + Modell + think/fast/verbose/reasoning + Token-Anzahlen + deliver.
- Eingabe: Texteditor mit Autovervollständigung.

## Mentales Modell: Agenten + Sitzungen

- Agenten sind eindeutige Slugs (z. B. `main`, `research`). Das Gateway stellt die Liste bereit.
- Sitzungen gehören zum aktuellen Agenten.
- Sitzungsschlüssel werden als `agent:<agentId>:<sessionKey>` gespeichert.
  - Wenn Sie `/session main` eingeben, erweitert die TUI dies zu `agent:<currentAgent>:main`.
  - Wenn Sie `/session agent:other:main` eingeben, wechseln Sie explizit zu dieser Agentensitzung.
- Sitzungsbereich:
  - `per-sender` (Standard): Jeder Agent hat viele Sitzungen.
  - `global`: Die TUI verwendet immer die Sitzung `global` (der Picker kann leer sein).
- Der aktuelle Agent + die aktuelle Sitzung sind immer im Footer sichtbar.

## Senden + Zustellung

- Nachrichten werden an das Gateway gesendet; die Zustellung an Provider ist standardmäßig deaktiviert.
- Zustellung aktivieren:
  - `/deliver on`
  - oder das Settings-Panel
  - oder mit `openclaw tui --deliver` starten

## Picker + Overlays

- Modell-Picker: verfügbare Modelle auflisten und den Sitzungs-Override setzen.
- Agent-Picker: einen anderen Agenten auswählen.
- Sitzungs-Picker: zeigt nur Sitzungen für den aktuellen Agenten an.
- Einstellungen: deliver, Erweiterung der Tool-Ausgabe und Sichtbarkeit von Thinking umschalten.

## Tastenkürzel

- Enter: Nachricht senden
- Esc: aktiven Lauf abbrechen
- Ctrl+C: Eingabe leeren (zweimal drücken zum Beenden)
- Ctrl+D: beenden
- Ctrl+L: Modell-Picker
- Ctrl+G: Agent-Picker
- Ctrl+P: Sitzungs-Picker
- Ctrl+O: Erweiterung der Tool-Ausgabe umschalten
- Ctrl+T: Sichtbarkeit von Thinking umschalten (lädt den Verlauf neu)

## Slash-Befehle

Kern:

- `/help`
- `/status`
- `/agent <id>` (oder `/agents`)
- `/session <key>` (oder `/sessions`)
- `/model <provider/model>` (oder `/models`)

Sitzungssteuerungen:

- `/think <off|minimal|low|medium|high>`
- `/fast <status|on|off>`
- `/verbose <on|full|off>`
- `/reasoning <on|off|stream>`
- `/usage <off|tokens|full>`
- `/elevated <on|off|ask|full>` (Alias: `/elev`)
- `/activation <mention|always>`
- `/deliver <on|off>`

Sitzungslebenszyklus:

- `/new` oder `/reset` (die Sitzung zurücksetzen)
- `/abort` (den aktiven Lauf abbrechen)
- `/settings`
- `/exit`

Andere Gateway-Slash-Befehle (zum Beispiel `/context`) werden an das Gateway weitergeleitet und als Systemausgabe angezeigt. Siehe [Slash-Befehle](/tools/slash-commands).

## Lokale Shell-Befehle

- Stellen Sie einer Zeile `!` voran, um einen lokalen Shell-Befehl auf dem TUI-Host auszuführen.
- Die TUI fragt pro Sitzung einmal nach, ob lokale Ausführung erlaubt werden soll; bei Ablehnung bleibt `!` für die Sitzung deaktiviert.
- Befehle werden in einer frischen, nicht interaktiven Shell im TUI-Arbeitsverzeichnis ausgeführt (kein persistentes `cd`/env).
- Lokale Shell-Befehle erhalten `OPENCLAW_SHELL=tui-local` in ihrer Umgebung.
- Ein einzelnes `!` wird als normale Nachricht gesendet; führende Leerzeichen lösen keine lokale Exec aus.

## Tool-Ausgabe

- Tool-Aufrufe werden als Karten mit Argumenten + Ergebnissen angezeigt.
- Ctrl+O schaltet zwischen eingeklappter/erweiterter Ansicht um.
- Während Tools laufen, werden partielle Aktualisierungen in dieselbe Karte gestreamt.

## Terminalfarben

- Die TUI belässt den Fließtext des Assistenten in der Standard-Vordergrundfarbe Ihres Terminals, damit sowohl dunkle als auch helle Terminals gut lesbar bleiben.
- Wenn Ihr Terminal einen hellen Hintergrund verwendet und die automatische Erkennung falsch ist, setzen Sie `OPENCLAW_THEME=light`, bevor Sie `openclaw tui` starten.
- Um stattdessen die ursprüngliche dunkle Palette zu erzwingen, setzen Sie `OPENCLAW_THEME=dark`.

## Verlauf + Streaming

- Beim Verbinden lädt die TUI den neuesten Verlauf (standardmäßig 200 Nachrichten).
- Streaming-Antworten werden bis zum Abschluss an Ort und Stelle aktualisiert.
- Die TUI lauscht außerdem auf Tool-Ereignisse des Agenten für umfangreichere Tool-Karten.

## Verbindungsdetails

- Die TUI registriert sich beim Gateway als `mode: "tui"`.
- Wiederverbindungen zeigen eine Systemnachricht an; Ereignislücken werden im Protokoll sichtbar gemacht.

## Optionen

- `--url <url>`: Gateway-WebSocket-URL (Standard ist die Konfiguration oder `ws://127.0.0.1:<port>`)
- `--token <token>`: Gateway-Token (falls erforderlich)
- `--password <password>`: Gateway-Passwort (falls erforderlich)
- `--session <key>`: Sitzungsschlüssel (Standard: `main`, oder `global`, wenn der Bereich global ist)
- `--deliver`: Antworten des Assistenten an den Provider zustellen (standardmäßig aus)
- `--thinking <level>`: Thinking-Level für das Senden überschreiben
- `--message <text>`: nach dem Verbinden eine Anfangsnachricht senden
- `--timeout-ms <ms>`: Agent-Timeout in ms (Standard ist `agents.defaults.timeoutSeconds`)
- `--history-limit <n>`: zu ladende Verlaufseinträge (Standard `200`)

Hinweis: Wenn Sie `--url` setzen, greift die TUI nicht auf Konfiguration oder Umgebungs-Anmeldedaten zurück.
Übergeben Sie `--token` oder `--password` explizit. Fehlende explizite Anmeldedaten sind ein Fehler.

## Fehlerbehebung

Keine Ausgabe nach dem Senden einer Nachricht:

- Führen Sie `/status` in der TUI aus, um zu bestätigen, dass das Gateway verbunden und untätig/beschäftigt ist.
- Prüfen Sie die Gateway-Logs: `openclaw logs --follow`.
- Bestätigen Sie, dass der Agent laufen kann: `openclaw status` und `openclaw models status`.
- Wenn Sie Nachrichten in einem Chat-Kanal erwarten, aktivieren Sie die Zustellung (`/deliver on` oder `--deliver`).

## Fehlerbehebung bei Verbindungen

- `disconnected`: Stellen Sie sicher, dass das Gateway läuft und Ihre Angaben für `--url/--token/--password` korrekt sind.
- Keine Agenten im Picker: prüfen Sie `openclaw agents list` und Ihre Routing-Konfiguration.
- Leerer Sitzungs-Picker: Sie befinden sich möglicherweise im globalen Bereich oder haben noch keine Sitzungen.

## Verwandt

- [Control UI](/web/control-ui) — webbasierte Steueroberfläche
- [CLI-Referenz](/cli) — vollständige Referenz der CLI-Befehle
