---
read_when:
    - Erweiterung von qa-lab oder qa-channel
    - Hinzufügen Repository-gestützter QA-Szenarien
    - Erstellung realistischerer QA-Automatisierung rund um das Gateway-Dashboard
summary: Form der privaten QA-Automatisierung für qa-lab, qa-channel, Seed-Szenarien und Protokollberichte
title: QA-E2E-Automatisierung
x-i18n:
    generated_at: "2026-04-07T06:14:08Z"
    model: gpt-5.4
    provider: openai
    source_hash: 113e89d8d3ee8ef3058d95b9aea9a1c2335b07794446be2d231c0faeb044b23b
    source_path: concepts/qa-e2e-automation.md
    workflow: 15
---

# QA-E2E-Automatisierung

Der private QA-Stack soll OpenClaw auf eine realistischere,
Channel-artige Weise testen, als es ein einzelner Unit-Test kann.

Aktuelle Bestandteile:

- `extensions/qa-channel`: synthetischer Nachrichten-Channel mit Oberflächen für DM, Channel, Thread,
  Reaktionen, Bearbeitungen und Löschungen.
- `extensions/qa-lab`: Debugger-Benutzeroberfläche und QA-Bus zum Beobachten des Transkripts,
  Einspeisen eingehender Nachrichten und Exportieren eines Markdown-Berichts.
- `qa/`: Repository-gestützte Seed-Assets für die Startaufgabe und grundlegende QA-
  Szenarien.

Der aktuelle QA-Operator-Ablauf ist eine QA-Site mit zwei Bereichen:

- Links: Gateway-Dashboard (Control UI) mit dem Agent.
- Rechts: QA Lab, das das Slack-ähnliche Transkript und den Szenarioplan zeigt.

Führen Sie es aus mit:

```bash
pnpm qa:lab:up
```

Dadurch wird die QA-Site gebaut, der Docker-gestützte Gateway-Pfad gestartet und die
QA-Lab-Seite bereitgestellt, auf der ein Operator oder eine Automatisierungsschleife dem Agent eine QA-
Mission geben, echtes Channel-Verhalten beobachten und festhalten kann, was funktioniert hat, fehlgeschlagen ist oder
blockiert geblieben ist.

## Repository-gestützte Seeds

Seed-Assets liegen in `qa/`:

- `qa/QA_KICKOFF_TASK.md`
- `qa/seed-scenarios.json`

Diese befinden sich bewusst in Git, damit der QA-Plan sowohl für Menschen als auch für den
Agent sichtbar ist. Die Basisliste sollte breit genug bleiben, um Folgendes abzudecken:

- DM- und Channel-Chat
- Thread-Verhalten
- Lebenszyklus von Nachrichtenaktionen
- Cron-Callbacks
- Memory Recall
- Modellwechsel
- Übergabe an Subagenten
- Lesen des Repositorys und Lesen der Dokumentation
- eine kleine Build-Aufgabe wie Lobster Invaders

## Berichterstellung

`qa-lab` exportiert einen Markdown-Protokollbericht aus der beobachteten Bus-Zeitleiste.
Der Bericht sollte Folgendes beantworten:

- Was funktioniert hat
- Was fehlgeschlagen ist
- Was blockiert geblieben ist
- Welche Folge-Szenarien sich hinzuzufügen lohnen

## Zugehörige Dokumentation

- [Testing](/de/help/testing)
- [QA-Channel](/de/channels/qa-channel)
- [Dashboard](/web/dashboard)
