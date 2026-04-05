---
read_when:
    - Sie möchten sehen, welche Skills verfügbar und einsatzbereit sind
    - Sie möchten Skills aus ClawHub suchen, installieren oder aktualisieren
    - Sie möchten fehlende Binärdateien/Env/Konfiguration für Skills debuggen
summary: CLI-Referenz für `openclaw skills` (search/install/update/list/info/check)
title: skills
x-i18n:
    generated_at: "2026-04-05T12:39:08Z"
    model: gpt-5.4
    provider: openai
    source_hash: 11af59b1b6bff19cc043acd8d67bdd4303201d3f75f23c948b83bf14882c7bb1
    source_path: cli/skills.md
    workflow: 15
---

# `openclaw skills`

Lokale Skills prüfen und Skills aus ClawHub installieren/aktualisieren.

Verwandt:

- Skills-System: [Skills](/tools/skills)
- Skills-Konfiguration: [Skills config](/tools/skills-config)
- ClawHub-Installationen: [ClawHub](/tools/clawhub)

## Befehle

```bash
openclaw skills search "calendar"
openclaw skills search --limit 20 --json
openclaw skills install <slug>
openclaw skills install <slug> --version <version>
openclaw skills install <slug> --force
openclaw skills update <slug>
openclaw skills update --all
openclaw skills list
openclaw skills list --eligible
openclaw skills list --json
openclaw skills list --verbose
openclaw skills info <name>
openclaw skills info <name> --json
openclaw skills check
openclaw skills check --json
```

`search`/`install`/`update` verwenden ClawHub direkt und installieren in das aktive
Workspace-Verzeichnis `skills/`. `list`/`info`/`check` prüfen weiterhin die lokalen
Skills, die für den aktuellen Workspace und die aktuelle Konfiguration sichtbar sind.

Dieser CLI-Befehl `install` lädt Skill-Ordner aus ClawHub herunter. Gateway-gestützte
Installationen von Skill-Abhängigkeiten, die durch Onboarding oder Skills-Einstellungen ausgelöst werden, verwenden stattdessen den
separaten Anfragepfad `skills.install`.

Hinweise:

- `search [query...]` akzeptiert eine optionale Suchanfrage; lassen Sie sie weg, um den standardmäßigen
  ClawHub-Such-Feed zu durchsuchen.
- `search --limit <n>` begrenzt die zurückgegebenen Ergebnisse.
- `install --force` überschreibt einen vorhandenen Workspace-Skill-Ordner für denselben
  Slug.
- `update --all` aktualisiert nur nachverfolgte ClawHub-Installationen im aktiven Workspace.
- `list` ist die Standardaktion, wenn kein Unterbefehl angegeben wird.
- `list`, `info` und `check` schreiben ihre gerenderte Ausgabe nach stdout. Mit
  `--json` bedeutet das, dass die maschinenlesbare Payload für Pipes
  und Skripte auf stdout bleibt.
