---
read_when:
    - Sie möchten verstehen, wie Task Flow mit Hintergrundaufgaben zusammenhängt.
    - Sie stoßen in Release Notes oder der Dokumentation auf Task Flow oder openclaw tasks flow.
    - Sie möchten den dauerhaften Flow-Status prüfen oder verwalten.
summary: TaskFlow-Orchestrierungsschicht oberhalb von Hintergrundaufgaben
title: Aufgabenfluss
x-i18n:
    generated_at: "2026-04-24T06:26:43Z"
    model: gpt-5.4
    provider: openai
    source_hash: 90286fb783db5417ab5e781377a85be76cd3f9e9b32da57558c2d8f02b813dba
    source_path: automation/taskflow.md
    workflow: 15
---

TaskFlow ist die Flow-Orchestrierungsschicht, die oberhalb von [Hintergrundaufgaben](/de/automation/tasks) sitzt. Sie verwaltet dauerhafte mehrstufige Flows mit eigenem Status, Revisionsverfolgung und Synchronisationssemantik, während einzelne Aufgaben die Einheit entkoppelter Arbeit bleiben.

## Wann Sie TaskFlow verwenden sollten

Verwenden Sie TaskFlow, wenn sich Arbeit über mehrere aufeinanderfolgende oder verzweigte Schritte erstreckt und Sie eine dauerhafte Fortschrittsverfolgung über Gateway-Neustarts hinweg benötigen. Für einzelne Hintergrundvorgänge reicht eine einfache [Aufgabe](/de/automation/tasks) aus.

| Szenario                             | Verwenden Sie         |
| ------------------------------------ | --------------------- |
| Einzelner Hintergrundjob             | Einfache Aufgabe      |
| Mehrstufige Pipeline (A dann B dann C) | TaskFlow (verwaltet)  |
| Extern erstellte Aufgaben beobachten | TaskFlow (gespiegelt) |
| Einmalige Erinnerung                 | Cron-Job              |

## Synchronisationsmodi

### Verwalteter Modus

TaskFlow besitzt den Lebenszyklus vollständig von Anfang bis Ende. Es erstellt Aufgaben als Flow-Schritte, führt sie bis zum Abschluss und setzt den Flow-Status automatisch fort.

Beispiel: ein wöchentlicher Berichts-Flow, der (1) Daten sammelt, (2) den Bericht erstellt und (3) ihn zustellt. TaskFlow erstellt jeden Schritt als Hintergrundaufgabe, wartet auf den Abschluss und wechselt dann zum nächsten Schritt.

```text
Flow: weekly-report
  Schritt 1: gather-data     → Aufgabe erstellt → erfolgreich
  Schritt 2: generate-report → Aufgabe erstellt → erfolgreich
  Schritt 3: deliver         → Aufgabe erstellt → wird ausgeführt
```

### Gespiegelter Modus

TaskFlow beobachtet extern erstellte Aufgaben und hält den Flow-Status synchron, ohne die Erstellung der Aufgaben zu übernehmen. Dies ist nützlich, wenn Aufgaben aus Cron-Jobs, CLI-Befehlen oder anderen Quellen stammen und Sie eine einheitliche Sicht auf ihren Fortschritt als Flow möchten.

Beispiel: drei unabhängige Cron-Jobs, die zusammen eine „Morning Ops“-Routine bilden. Ein gespiegelter Flow verfolgt ihren gemeinsamen Fortschritt, ohne zu steuern, wann oder wie sie ausgeführt werden.

## Dauerhafter Status und Revisionsverfolgung

Jeder Flow speichert seinen eigenen Status dauerhaft und verfolgt Revisionen, sodass der Fortschritt Gateway-Neustarts übersteht. Die Revisionsverfolgung ermöglicht die Erkennung von Konflikten, wenn mehrere Quellen versuchen, denselben Flow gleichzeitig fortzusetzen.

## Verhalten bei Abbruch

`openclaw tasks flow cancel` setzt eine dauerhafte Abbruchabsicht auf dem Flow. Aktive Aufgaben innerhalb des Flows werden abgebrochen, und es werden keine neuen Schritte gestartet. Die Abbruchabsicht bleibt über Neustarts hinweg bestehen, sodass ein abgebrochener Flow abgebrochen bleibt, selbst wenn das Gateway neu startet, bevor alle untergeordneten Aufgaben beendet wurden.

## CLI-Befehle

```bash
# Aktive und kürzliche Flows auflisten
openclaw tasks flow list

# Details für einen bestimmten Flow anzeigen
openclaw tasks flow show <lookup>

# Einen laufenden Flow und seine aktiven Aufgaben abbrechen
openclaw tasks flow cancel <lookup>
```

| Befehl                            | Beschreibung                                      |
| --------------------------------- | ------------------------------------------------- |
| `openclaw tasks flow list`        | Zeigt verfolgte Flows mit Status und Synchronisationsmodus |
| `openclaw tasks flow show <id>`   | Einen Flow nach Flow-ID oder Lookup-Schlüssel prüfen |
| `openclaw tasks flow cancel <id>` | Einen laufenden Flow und seine aktiven Aufgaben abbrechen |

## Wie Flows mit Aufgaben zusammenhängen

Flows koordinieren Aufgaben, ersetzen sie aber nicht. Ein einzelner Flow kann im Laufe seiner Lebensdauer mehrere Hintergrundaufgaben steuern. Verwenden Sie `openclaw tasks`, um einzelne Aufgaben-Einträge zu prüfen, und `openclaw tasks flow`, um den orchestrierenden Flow zu prüfen.

## Verwandt

- [Hintergrundaufgaben](/de/automation/tasks) — das Verzeichnis entkoppelter Arbeit, das von Flows koordiniert wird
- [CLI: tasks](/de/cli/tasks) — CLI-Befehlsreferenz für `openclaw tasks flow`
- [Automatisierungsübersicht](/de/automation) — alle Automatisierungsmechanismen auf einen Blick
- [Cron-Jobs](/de/automation/cron-jobs) — geplante Jobs, die in Flows einfließen können
