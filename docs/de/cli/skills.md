---
read_when:
    - Sie möchten sehen, welche Skills verfügbar und einsatzbereit sind.
    - Sie möchten Skills aus ClawHub suchen, installieren oder aktualisieren.
    - Sie möchten fehlende Binärdateien/Umgebungsvariablen/Konfigurationen für Skills debuggen.
summary: CLI-Referenz für `openclaw skills` (suchen/installieren/aktualisieren/auflisten/info/prüfen)
title: Skills
x-i18n:
    generated_at: "2026-04-24T06:32:49Z"
    model: gpt-5.4
    provider: openai
    source_hash: 31cd7647a15cd5df6cf5a2311e63bb11cc3aabfe8beefda7be57dc76adc509ea
    source_path: cli/skills.md
    workflow: 15
---

# `openclaw skills`

Lokale Skills prüfen und Skills aus ClawHub installieren/aktualisieren.

Verwandt:

- Skills-System: [Skills](/de/tools/skills)
- Skills-Konfiguration: [Skills-Konfiguration](/de/tools/skills-config)
- ClawHub-Installationen: [ClawHub](/de/tools/clawhub)

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

Dieser CLI-Befehl `install` lädt Skill-Ordner von ClawHub herunter. Gateway-gestützte
Installationen von Skill-Abhängigkeiten, die beim Onboarding oder in den Skills-Einstellungen ausgelöst werden, verwenden stattdessen den separaten
Anfragepfad `skills.install`.

Hinweise:

- `search [query...]` akzeptiert eine optionale Suchanfrage; lassen Sie sie weg, um den Standard-
  Such-Feed von ClawHub zu durchsuchen.
- `search --limit <n>` begrenzt die zurückgegebenen Ergebnisse.
- `install --force` überschreibt einen vorhandenen Workspace-Skill-Ordner für denselben
  Slug.
- `update --all` aktualisiert nur verfolgte ClawHub-Installationen im aktiven Workspace.
- `list` ist die Standardaktion, wenn kein Unterbefehl angegeben wird.
- `list`, `info` und `check` schreiben ihre gerenderte Ausgabe nach stdout. Mit
  `--json` bedeutet das, dass die maschinenlesbare Nutzlast für Pipes
  und Skripte auf stdout bleibt.

## Verwandt

- [CLI-Referenz](/de/cli)
- [Skills](/de/tools/skills)
