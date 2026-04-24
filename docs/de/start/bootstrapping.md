---
read_when:
    - Verstehen, was beim ersten Agent-Lauf passiert
    - Erklären, wo Bootstrapping-Dateien liegen
    - Debugging des Onboarding-Identity-Setups
sidebarTitle: Bootstrapping
summary: Agent-Bootstrapping-Ritual, das den Workspace und Identitätsdateien initial befüllt
title: Agent-Bootstrapping
x-i18n:
    generated_at: "2026-04-24T06:59:48Z"
    model: gpt-5.4
    provider: openai
    source_hash: 0c23a204a7afbf2ca0c0d19a227286cf0ae396181073403055db41dafa764d2a
    source_path: start/bootstrapping.md
    workflow: 15
---

Bootstrapping ist das **First-Run**-Ritual, das einen Agent-Workspace vorbereitet und
Identitätsdetails erfasst. Es passiert nach dem Onboarding, wenn der Agent zum
ersten Mal startet.

## Was Bootstrapping macht

Beim ersten Agent-Lauf bootstrapped OpenClaw den Workspace (Standard
`~/.openclaw/workspace`):

- Legt `AGENTS.md`, `BOOTSTRAP.md`, `IDENTITY.md`, `USER.md` an.
- Führt ein kurzes Frage-und-Antwort-Ritual aus (jeweils eine Frage).
- Schreibt Identität + Präferenzen in `IDENTITY.md`, `USER.md`, `SOUL.md`.
- Entfernt `BOOTSTRAP.md`, wenn es abgeschlossen ist, damit es nur einmal läuft.

## Wo es läuft

Bootstrapping läuft immer auf dem **Gateway-Host**. Wenn sich die macOS-App mit
einem Remote-Gateway verbindet, liegen der Workspace und die Bootstrapping-Dateien auf diesem Remote-
Rechner.

<Note>
Wenn das Gateway auf einem anderen Rechner läuft, bearbeiten Sie Workspace-Dateien auf dem Gateway-
Host (zum Beispiel `user@gateway-host:~/.openclaw/workspace`).
</Note>

## Verwandte Dokumentation

- Onboarding der macOS-App: [Onboarding](/de/start/onboarding)
- Workspace-Layout: [Agent-Workspace](/de/concepts/agent-workspace)
