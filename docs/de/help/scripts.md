---
read_when:
    - Beim Ausführen von Skripten aus dem Repo
    - Beim Hinzufügen oder Ändern von Skripten unter ./scripts
summary: 'Repository-Skripte: Zweck, Umfang und Sicherheitshinweise'
title: Skripte
x-i18n:
    generated_at: "2026-04-05T12:44:45Z"
    model: gpt-5.4
    provider: openai
    source_hash: de53d64d91c564931bdd4e8b9f4a8e88646332a07cc2a6bf1d517b89debb29cd
    source_path: help/scripts.md
    workflow: 15
---

# Skripte

Das Verzeichnis `scripts/` enthält Hilfsskripte für lokale Workflows und Ops-Aufgaben.
Verwenden Sie diese, wenn eine Aufgabe eindeutig an ein Skript gebunden ist; andernfalls bevorzugen Sie die CLI.

## Konventionen

- Skripte sind **optional**, sofern sie nicht in der Dokumentation oder in Release-Checklisten referenziert werden.
- Bevorzugen Sie CLI-Oberflächen, wenn es sie gibt (Beispiel: Auth-Monitoring verwendet `openclaw models status --check`).
- Gehen Sie davon aus, dass Skripte hostspezifisch sind; lesen Sie sie, bevor Sie sie auf einem neuen Rechner ausführen.

## Skripte für das Auth-Monitoring

Das Auth-Monitoring wird in [Authentifizierung](/gateway/authentication) behandelt. Die Skripte unter `scripts/` sind optionale Extras für systemd-/Termux-Telefon-Workflows.

## Beim Hinzufügen von Skripten

- Halten Sie Skripte fokussiert und dokumentiert.
- Fügen Sie einen kurzen Eintrag in der relevanten Dokumentation hinzu (oder erstellen Sie eine, falls sie fehlt).
