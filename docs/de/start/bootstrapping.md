---
read_when:
    - Verstehen, was beim ersten Lauf eines Agenten passiert
    - Erklären, wo Bootstrap-Dateien liegen
    - Fehlersuche beim Onboarding-Identitäts-Setup
sidebarTitle: Bootstrapping
summary: Bootstrap-Ritual für Agenten, das den Workspace und die Identitätsdateien initialisiert
title: Agent-Bootstrapping
x-i18n:
    generated_at: "2026-04-05T12:55:33Z"
    model: gpt-5.4
    provider: openai
    source_hash: 4a08b5102f25c6c4bcdbbdd44384252a9e537b245a7b070c4961a72b4c6c6601
    source_path: start/bootstrapping.md
    workflow: 15
---

# Agent-Bootstrapping

Bootstrapping ist das **first-run**-Ritual, das einen Agent-Workspace vorbereitet und
Identitätsdetails erfasst. Es geschieht nach dem Onboarding, wenn der Agent
zum ersten Mal startet.

## Was Bootstrapping macht

Beim ersten Lauf des Agenten initialisiert OpenClaw den Workspace (Standard
`~/.openclaw/workspace`):

- Initialisiert `AGENTS.md`, `BOOTSTRAP.md`, `IDENTITY.md`, `USER.md`.
- Führt ein kurzes Frage-und-Antwort-Ritual aus (eine Frage nach der anderen).
- Schreibt Identität + Präferenzen in `IDENTITY.md`, `USER.md`, `SOUL.md`.
- Entfernt `BOOTSTRAP.md`, wenn es abgeschlossen ist, sodass es nur einmal ausgeführt wird.

## Wo es ausgeführt wird

Bootstrapping läuft immer auf dem **Gateway-Host**. Wenn sich die macOS-App mit
einem Remote-Gateway verbindet, liegen der Workspace und die Bootstrap-Dateien auf diesem entfernten
Rechner.

<Note>
Wenn das Gateway auf einem anderen Rechner läuft, bearbeite Workspace-Dateien auf dem Gateway-
Host (zum Beispiel `user@gateway-host:~/.openclaw/workspace`).
</Note>

## Zugehörige Docs

- Onboarding der macOS-App: [Onboarding](/start/onboarding)
- Workspace-Layout: [Agent workspace](/de/concepts/agent-workspace)
