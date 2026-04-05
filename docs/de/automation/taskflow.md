---
read_when:
    - Sie verstehen möchten, wie sich Task Flow auf Hintergrundaufgaben bezieht
    - Sie in Release Notes oder in der Dokumentation auf Task Flow oder openclaw tasks flow stoßen
    - Sie den dauerhaften Flow-Status prüfen oder verwalten möchten
summary: Flow-Orchestrierungsschicht von Task Flow über Hintergrundaufgaben
title: Task Flow
x-i18n:
    generated_at: "2026-04-05T12:34:12Z"
    model: gpt-5.4
    provider: openai
    source_hash: 172871206b839845db807d9c627015890f7733b862e276853d5dbfbe29e03883
    source_path: automation/taskflow.md
    workflow: 15
---

# Task Flow

Task Flow ist das Flow-Orchestrierungs-Substrat, das über [Hintergrundaufgaben](/automation/tasks) liegt. Es verwaltet dauerhafte mehrstufige Flows mit eigenem Status, Revisionsverfolgung und Synchronisierungssemantik, während einzelne Aufgaben die Einheit für entkoppelte Arbeit bleiben.

## Wann Task Flow verwendet werden sollte

Verwenden Sie Task Flow, wenn Arbeit sich über mehrere aufeinanderfolgende oder verzweigende Schritte erstreckt und Sie eine dauerhafte Fortschrittsverfolgung über Gateway-Neustarts hinweg benötigen. Für einzelne Hintergrundoperationen reicht eine einfache [Aufgabe](/automation/tasks) aus.

| Szenario                            | Verwendung            |
| ----------------------------------- | --------------------- |
| Einzelner Hintergrundjob            | Einfache Aufgabe      |
| Mehrstufige Pipeline (A dann B dann C) | Task Flow (verwaltet) |
| Extern erstellte Aufgaben beobachten | Task Flow (gespiegelt) |
| Einmalige Erinnerung                | Cron-Job              |

## Synchronisierungsmodi

### Verwalteter Modus

Task Flow besitzt den Lebenszyklus von Anfang bis Ende. Es erstellt Aufgaben als Flow-Schritte, führt sie bis zum Abschluss und schreitet automatisch im Flow-Status fort.

Beispiel: ein wöchentlicher Berichts-Flow, der (1) Daten sammelt, (2) den Bericht erzeugt und (3) ihn zustellt. Task Flow erstellt jeden Schritt als Hintergrundaufgabe, wartet auf den Abschluss und wechselt dann zum nächsten Schritt.

```
Flow: weekly-report
  Step 1: gather-data     → task created → succeeded
  Step 2: generate-report → task created → succeeded
  Step 3: deliver         → task created → running
```

### Gespiegelter Modus

Task Flow beobachtet extern erstellte Aufgaben und hält den Flow-Status synchron, ohne die Verantwortung für die Aufgabenerstellung zu übernehmen. Das ist nützlich, wenn Aufgaben aus Cron-Jobs, CLI-Befehlen oder anderen Quellen stammen und Sie eine einheitliche Sicht auf ihren Fortschritt als Flow wünschen.

Beispiel: drei unabhängige Cron-Jobs, die zusammen eine „Morning Ops“-Routine bilden. Ein gespiegelter Flow verfolgt ihren gemeinsamen Fortschritt, ohne zu steuern, wann oder wie sie ausgeführt werden.

## Dauerhafter Status und Revisionsverfolgung

Jeder Flow speichert seinen eigenen Status dauerhaft und verfolgt Revisionen, sodass der Fortschritt Gateway-Neustarts übersteht. Die Revisionsverfolgung ermöglicht Konflikterkennung, wenn mehrere Quellen gleichzeitig versuchen, denselben Flow voranzubringen.

## Verhalten beim Abbrechen

`openclaw tasks flow cancel` setzt eine persistente Abbruchabsicht für den Flow. Aktive Aufgaben innerhalb des Flows werden abgebrochen, und es werden keine neuen Schritte gestartet. Die Abbruchabsicht bleibt über Neustarts hinweg bestehen, sodass ein abgebrochener Flow abgebrochen bleibt, selbst wenn das Gateway neu startet, bevor alle untergeordneten Aufgaben beendet wurden.

## CLI-Befehle

```bash
# List active and recent flows
openclaw tasks flow list

# Show details for a specific flow
openclaw tasks flow show <lookup>

# Cancel a running flow and its active tasks
openclaw tasks flow cancel <lookup>
```

| Befehl                            | Beschreibung                                      |
| --------------------------------- | ------------------------------------------------- |
| `openclaw tasks flow list`        | Zeigt verfolgte Flows mit Status und Synchronisierungsmodus |
| `openclaw tasks flow show <id>`   | Prüft einen Flow anhand der Flow-ID oder des Lookup-Schlüssels |
| `openclaw tasks flow cancel <id>` | Bricht einen laufenden Flow und seine aktiven Aufgaben ab |

## Wie sich Flows auf Aufgaben beziehen

Flows koordinieren Aufgaben, ersetzen sie aber nicht. Ein einzelner Flow kann im Laufe seiner Lebensdauer mehrere Hintergrundaufgaben steuern. Verwenden Sie `openclaw tasks`, um einzelne Aufgaben-Datensätze zu prüfen, und `openclaw tasks flow`, um den orchestrierenden Flow zu prüfen.

## Verwandt

- [Hintergrundaufgaben](/automation/tasks) — das Journal für entkoppelte Arbeit, das von Flows koordiniert wird
- [CLI: tasks](/cli/index#tasks) — CLI-Befehlsreferenz für `openclaw tasks flow`
- [Automatisierungsübersicht](/automation) — alle Automatisierungsmechanismen auf einen Blick
- [Cron-Jobs](/automation/cron-jobs) — geplante Jobs, die in Flows einfließen können
