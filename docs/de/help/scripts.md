---
read_when:
    - Skripte aus dem Repository ausführen
    - Skripte unter ./scripts hinzufügen oder ändern
summary: 'Repository-Skripte: Zweck, Geltungsbereich und Sicherheitshinweise'
title: Skripte
x-i18n:
    generated_at: "2026-04-24T06:41:59Z"
    model: gpt-5.4
    provider: openai
    source_hash: 8d76777402670abe355b9ad2a0337f96211af1323e36f2ab1ced9f04f87083f5
    source_path: help/scripts.md
    workflow: 15
---

Das Verzeichnis `scripts/` enthält Hilfsskripte für lokale Workflows und Betriebsaufgaben.
Verwenden Sie diese, wenn eine Aufgabe klar an ein Skript gebunden ist; andernfalls bevorzugen Sie die CLI.

## Konventionen

- Skripte sind **optional**, sofern sie nicht in der Dokumentation oder in Release-Checklisten erwähnt werden.
- Bevorzugen Sie CLI-Oberflächen, wenn sie existieren (Beispiel: Auth-Monitoring verwendet `openclaw models status --check`).
- Gehen Sie davon aus, dass Skripte hostspezifisch sind; lesen Sie sie, bevor Sie sie auf einem neuen Rechner ausführen.

## Skripte zur Auth-Überwachung

Die Auth-Überwachung wird unter [Authentication](/de/gateway/authentication) behandelt. Die Skripte unter `scripts/` sind optionale Extras für systemd-/Termux-Telefon-Workflows.

## GitHub-Lesehelfer

Verwenden Sie `scripts/gh-read`, wenn `gh` für repositorybezogene Leseaufrufe ein GitHub-App-Installationstoken verwenden soll, während normales `gh` für Schreibaktionen bei Ihrem persönlichen Login bleibt.

Erforderliche Umgebungsvariablen:

- `OPENCLAW_GH_READ_APP_ID`
- `OPENCLAW_GH_READ_PRIVATE_KEY_FILE`

Optionale Umgebungsvariablen:

- `OPENCLAW_GH_READ_INSTALLATION_ID`, wenn Sie die installationsbezogene Suche anhand des Repository überspringen möchten
- `OPENCLAW_GH_READ_PERMISSIONS` als kommaseparierte Überschreibung für die anzufordernde Teilmenge von Leseberechtigungen

Auflösungsreihenfolge für Repositorys:

- `gh ... -R owner/repo`
- `GH_REPO`
- `git remote origin`

Beispiele:

- `scripts/gh-read pr view 123`
- `scripts/gh-read run list -R openclaw/openclaw`
- `scripts/gh-read api repos/openclaw/openclaw/pulls/123`

## Beim Hinzufügen von Skripten

- Halten Sie Skripte fokussiert und dokumentiert.
- Fügen Sie einen kurzen Eintrag in die relevante Dokumentation ein (oder erstellen Sie einen, wenn er fehlt).

## Verwandt

- [Testing](/de/help/testing)
- [Testing live](/de/help/testing-live)
