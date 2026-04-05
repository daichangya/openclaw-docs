---
read_when:
    - Sie möchten Agent-Hooks verwalten
    - Sie möchten die Hook-Verfügbarkeit prüfen oder Workspace-Hooks aktivieren
summary: CLI-Referenz für `openclaw hooks` (Agent-Hooks)
title: hooks
x-i18n:
    generated_at: "2026-04-05T12:38:29Z"
    model: gpt-5.4
    provider: openai
    source_hash: 8dc9144e9844e9c3cdef2514098eb170543746fcc55ca5a1cc746c12d80209e7
    source_path: cli/hooks.md
    workflow: 15
---

# `openclaw hooks`

Verwalten Sie Agent-Hooks (ereignisgesteuerte Automatisierungen für Befehle wie `/new`, `/reset` und den Gateway-Start).

Wenn Sie `openclaw hooks` ohne Unterbefehl ausführen, entspricht das `openclaw hooks list`.

Verwandt:

- Hooks: [Hooks](/automation/hooks)
- Plugin-Hooks: [Plugin hooks](/plugins/architecture#provider-runtime-hooks)

## Alle Hooks auflisten

```bash
openclaw hooks list
```

Listet alle erkannten Hooks aus Workspace-, verwalteten, zusätzlichen und gebündelten Verzeichnissen auf.

**Optionen:**

- `--eligible`: Nur geeignete Hooks anzeigen (Anforderungen erfüllt)
- `--json`: Als JSON ausgeben
- `-v, --verbose`: Detaillierte Informationen einschließlich fehlender Anforderungen anzeigen

**Beispielausgabe:**

```
Hooks (4/4 bereit)

Bereit:
  🚀 boot-md ✓ - BOOT.md beim Gateway-Start ausführen
  📎 bootstrap-extra-files ✓ - Zusätzliche Workspace-Bootstrap-Dateien während des Agent-Bootstrap einfügen
  📝 command-logger ✓ - Alle Befehlsereignisse in einer zentralen Audit-Datei protokollieren
  💾 session-memory ✓ - Sitzungskontext in memory speichern, wenn der Befehl /new oder /reset ausgegeben wird
```

**Beispiel (verbose):**

```bash
openclaw hooks list --verbose
```

Zeigt fehlende Anforderungen für ungeeignete Hooks an.

**Beispiel (JSON):**

```bash
openclaw hooks list --json
```

Gibt strukturiertes JSON zur programmgesteuerten Verwendung zurück.

## Hook-Informationen abrufen

```bash
openclaw hooks info <name>
```

Zeigt detaillierte Informationen zu einem bestimmten Hook an.

**Argumente:**

- `<name>`: Hook-Name oder Hook-Schlüssel (z. B. `session-memory`)

**Optionen:**

- `--json`: Als JSON ausgeben

**Beispiel:**

```bash
openclaw hooks info session-memory
```

**Ausgabe:**

```
💾 session-memory ✓ Bereit

Sitzungskontext in memory speichern, wenn der Befehl /new oder /reset ausgegeben wird

Details:
  Quelle: openclaw-bundled
  Pfad: /path/to/openclaw/hooks/bundled/session-memory/HOOK.md
  Handler: /path/to/openclaw/hooks/bundled/session-memory/handler.ts
  Homepage: https://docs.openclaw.ai/automation/hooks#session-memory
  Ereignisse: command:new, command:reset

Anforderungen:
  Konfiguration: ✓ workspace.dir
```

## Hook-Eignung prüfen

```bash
openclaw hooks check
```

Zeigt eine Zusammenfassung des Hook-Eignungsstatus an (wie viele bereit vs. nicht bereit sind).

**Optionen:**

- `--json`: Als JSON ausgeben

**Beispielausgabe:**

```
Hook-Status

Hooks insgesamt: 4
Bereit: 4
Nicht bereit: 0
```

## Einen Hook aktivieren

```bash
openclaw hooks enable <name>
```

Aktiviert einen bestimmten Hook, indem er zu Ihrer Konfiguration hinzugefügt wird (standardmäßig `~/.openclaw/openclaw.json`).

**Hinweis:** Workspace-Hooks sind standardmäßig deaktiviert, bis sie hier oder in der Konfiguration aktiviert werden. Von Plugins verwaltete Hooks zeigen `plugin:<id>` in `openclaw hooks list` an und können hier nicht aktiviert/deaktiviert werden. Aktivieren/deaktivieren Sie stattdessen das Plugin.

**Argumente:**

- `<name>`: Hook-Name (z. B. `session-memory`)

**Beispiel:**

```bash
openclaw hooks enable session-memory
```

**Ausgabe:**

```
✓ Hook aktiviert: 💾 session-memory
```

**Was passiert dabei:**

- Prüft, ob der Hook existiert und geeignet ist
- Aktualisiert `hooks.internal.entries.<name>.enabled = true` in Ihrer Konfiguration
- Speichert die Konfiguration auf dem Datenträger

Wenn der Hook aus `<workspace>/hooks/` stammt, ist dieser Opt-in-Schritt erforderlich, bevor
das Gateway ihn lädt.

**Nach dem Aktivieren:**

- Starten Sie das Gateway neu, damit Hooks neu geladen werden (Neustart der Menüleisten-App unter macOS oder Neustart Ihres Gateway-Prozesses in der Entwicklung).

## Einen Hook deaktivieren

```bash
openclaw hooks disable <name>
```

Deaktiviert einen bestimmten Hook durch Aktualisieren Ihrer Konfiguration.

**Argumente:**

- `<name>`: Hook-Name (z. B. `command-logger`)

**Beispiel:**

```bash
openclaw hooks disable command-logger
```

**Ausgabe:**

```
⏸ Hook deaktiviert: 📝 command-logger
```

**Nach dem Deaktivieren:**

- Starten Sie das Gateway neu, damit Hooks neu geladen werden

## Hinweise

- `openclaw hooks list --json`, `info --json` und `check --json` schreiben strukturiertes JSON direkt nach stdout.
- Von Plugins verwaltete Hooks können hier nicht aktiviert oder deaktiviert werden; aktivieren oder deaktivieren Sie stattdessen das zugehörige Plugin.

## Hook-Pakete installieren

```bash
openclaw plugins install <package>        # zuerst ClawHub, dann npm
openclaw plugins install <package> --pin  # Version anheften
openclaw plugins install <path>           # lokaler Pfad
```

Installieren Sie Hook-Pakete über das einheitliche Plugin-Installationsprogramm.

`openclaw hooks install` funktioniert weiterhin als Kompatibilitätsalias, gibt aber eine
Veraltungwarnung aus und leitet an `openclaw plugins install` weiter.

Npm-Spezifikationen sind **nur für die Registry** zulässig (Paketname + optionale **exakte Version** oder
**Dist-Tag**). Git-/URL-/Datei-Spezifikationen und Semver-Bereiche werden abgelehnt. Abhängigkeits-
Installationen werden aus Sicherheitsgründen mit `--ignore-scripts` ausgeführt.

Einfache Spezifikationen und `@latest` bleiben auf dem stabilen Track. Wenn npm eines von
beiden in eine Vorabversion auflöst, stoppt OpenClaw und fordert Sie auf, sich explizit mit einem
Vorabversions-Tag wie `@beta`/`@rc` oder einer exakten Vorabversionsnummer dafür zu entscheiden.

**Was passiert dabei:**

- Kopiert das Hook-Paket nach `~/.openclaw/hooks/<id>`
- Aktiviert die installierten Hooks in `hooks.internal.entries.*`
- Erfasst die Installation unter `hooks.internal.installs`

**Optionen:**

- `-l, --link`: Ein lokales Verzeichnis verlinken statt kopieren (fügt es zu `hooks.internal.load.extraDirs` hinzu)
- `--pin`: npm-Installationen als exaktes aufgelöstes `name@version` in `hooks.internal.installs` erfassen

**Unterstützte Archive:** `.zip`, `.tgz`, `.tar.gz`, `.tar`

**Beispiele:**

```bash
# Lokales Verzeichnis
openclaw plugins install ./my-hook-pack

# Lokales Archiv
openclaw plugins install ./my-hook-pack.zip

# NPM-Paket
openclaw plugins install @openclaw/my-hook-pack

# Ein lokales Verzeichnis verlinken, ohne es zu kopieren
openclaw plugins install -l ./my-hook-pack
```

Verlinkte Hook-Pakete werden als verwaltete Hooks aus einem vom Betreiber konfigurierten
Verzeichnis behandelt, nicht als Workspace-Hooks.

## Hook-Pakete aktualisieren

```bash
openclaw plugins update <id>
openclaw plugins update --all
```

Aktualisieren Sie nachverfolgte npm-basierte Hook-Pakete über den einheitlichen Plugin-Updater.

`openclaw hooks update` funktioniert weiterhin als Kompatibilitätsalias, gibt aber eine
Veraltungwarnung aus und leitet an `openclaw plugins update` weiter.

**Optionen:**

- `--all`: Alle nachverfolgten Hook-Pakete aktualisieren
- `--dry-run`: Anzeigen, was sich ändern würde, ohne zu schreiben

Wenn ein gespeicherter Integritäts-Hash existiert und sich der Hash des abgerufenen Artefakts ändert,
gibt OpenClaw eine Warnung aus und bittet vor dem Fortfahren um Bestätigung. Verwenden Sie global `--yes`,
um Eingabeaufforderungen in CI-/nicht interaktiven Ausführungen zu umgehen.

## Gebündelte Hooks

### session-memory

Speichert Sitzungskontext in memory, wenn Sie `/new` oder `/reset` ausführen.

**Aktivieren:**

```bash
openclaw hooks enable session-memory
```

**Ausgabe:** `~/.openclaw/workspace/memory/YYYY-MM-DD-slug.md`

**Siehe:** [session-memory-Dokumentation](/automation/hooks#session-memory)

### bootstrap-extra-files

Fügt zusätzliche Bootstrap-Dateien (zum Beispiel monorepo-lokale `AGENTS.md` / `TOOLS.md`) während `agent:bootstrap` ein.

**Aktivieren:**

```bash
openclaw hooks enable bootstrap-extra-files
```

**Siehe:** [bootstrap-extra-files-Dokumentation](/automation/hooks#bootstrap-extra-files)

### command-logger

Protokolliert alle Befehlsereignisse in einer zentralen Audit-Datei.

**Aktivieren:**

```bash
openclaw hooks enable command-logger
```

**Ausgabe:** `~/.openclaw/logs/commands.log`

**Protokolle anzeigen:**

```bash
# Aktuelle Befehle
tail -n 20 ~/.openclaw/logs/commands.log

# Schön formatieren
cat ~/.openclaw/logs/commands.log | jq .

# Nach Aktion filtern
grep '"action":"new"' ~/.openclaw/logs/commands.log | jq .
```

**Siehe:** [command-logger-Dokumentation](/automation/hooks#command-logger)

### boot-md

Führt `BOOT.md` aus, wenn das Gateway startet (nachdem die Kanäle gestartet wurden).

**Ereignisse**: `gateway:startup`

**Aktivieren**:

```bash
openclaw hooks enable boot-md
```

**Siehe:** [boot-md-Dokumentation](/automation/hooks#boot-md)
