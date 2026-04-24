---
read_when: You are managing sandbox runtimes or debugging sandbox/tool-policy behavior.
status: active
summary: Sandbox-Laufzeiten verwalten und die effektive Sandbox-Richtlinie prüfen
title: Sandbox-CLI
x-i18n:
    generated_at: "2026-04-24T06:32:34Z"
    model: gpt-5.4
    provider: openai
    source_hash: 4f2b5835968faac0a8243fd6eadfcecb51b211fe7b346454e215312b1b6d5e65
    source_path: cli/sandbox.md
    workflow: 15
---

Sandbox-Laufzeiten für isolierte Agentenausführung verwalten.

## Überblick

OpenClaw kann Agenten aus Sicherheitsgründen in isolierten Sandbox-Laufzeiten ausführen. Die Befehle von `sandbox` helfen Ihnen dabei, diese Laufzeiten nach Updates oder Konfigurationsänderungen zu prüfen und neu zu erstellen.

Heute bedeutet das in der Regel:

- Docker-Sandbox-Container
- SSH-Sandbox-Laufzeiten, wenn `agents.defaults.sandbox.backend = "ssh"`
- OpenShell-Sandbox-Laufzeiten, wenn `agents.defaults.sandbox.backend = "openshell"`

Für `ssh` und OpenShell `remote` ist Neuerstellung wichtiger als bei Docker:

- der Remote-Workspace ist nach dem ersten Seeding kanonisch
- `openclaw sandbox recreate` löscht diesen kanonischen Remote-Workspace für den ausgewählten Scope
- bei der nächsten Verwendung wird er erneut aus dem aktuellen lokalen Workspace gesät

## Befehle

### `openclaw sandbox explain`

Den **effektiven** Sandbox-Modus/-Scope/-Workspace-Zugriff, die Sandbox-Tool-Richtlinie und Elevated-Gates prüfen (mit Korrekturpfaden für Konfigurationsschlüssel).

```bash
openclaw sandbox explain
openclaw sandbox explain --session agent:main:main
openclaw sandbox explain --agent work
openclaw sandbox explain --json
```

### `openclaw sandbox list`

Alle Sandbox-Laufzeiten mit ihrem Status und ihrer Konfiguration auflisten.

```bash
openclaw sandbox list
openclaw sandbox list --browser  # Nur Browser-Container auflisten
openclaw sandbox list --json     # JSON-Ausgabe
```

**Die Ausgabe enthält:**

- Name und Status der Laufzeit
- Backend (`docker`, `openshell` usw.)
- Konfigurationsbezeichnung und ob sie mit der aktuellen Konfiguration übereinstimmt
- Alter (Zeit seit Erstellung)
- Leerlaufzeit (Zeit seit letzter Verwendung)
- Zugehörige Sitzung/zugehöriger Agent

### `openclaw sandbox recreate`

Sandbox-Laufzeiten entfernen, um eine Neuerstellung mit aktualisierter Konfiguration zu erzwingen.

```bash
openclaw sandbox recreate --all                # Alle Container neu erstellen
openclaw sandbox recreate --session main       # Bestimmte Sitzung
openclaw sandbox recreate --agent mybot        # Bestimmter Agent
openclaw sandbox recreate --browser            # Nur Browser-Container
openclaw sandbox recreate --all --force        # Bestätigung überspringen
```

**Optionen:**

- `--all`: Alle Sandbox-Container neu erstellen
- `--session <key>`: Container für eine bestimmte Sitzung neu erstellen
- `--agent <id>`: Container für einen bestimmten Agenten neu erstellen
- `--browser`: Nur Browser-Container neu erstellen
- `--force`: Bestätigungsabfrage überspringen

**Wichtig:** Laufzeiten werden automatisch neu erstellt, wenn der Agent das nächste Mal verwendet wird.

## Anwendungsfälle

### Nach dem Aktualisieren eines Docker-Images

```bash
# Neues Image ziehen
docker pull openclaw-sandbox:latest
docker tag openclaw-sandbox:latest openclaw-sandbox:bookworm-slim

# Konfiguration aktualisieren, um das neue Image zu verwenden
# Konfiguration bearbeiten: agents.defaults.sandbox.docker.image (oder agents.list[].sandbox.docker.image)

# Container neu erstellen
openclaw sandbox recreate --all
```

### Nach dem Ändern der Sandbox-Konfiguration

```bash
# Konfiguration bearbeiten: agents.defaults.sandbox.* (oder agents.list[].sandbox.*)

# Neu erstellen, um die neue Konfiguration anzuwenden
openclaw sandbox recreate --all
```

### Nach dem Ändern von SSH-Ziel oder SSH-Authentifizierungsmaterial

```bash
# Konfiguration bearbeiten:
# - agents.defaults.sandbox.backend
# - agents.defaults.sandbox.ssh.target
# - agents.defaults.sandbox.ssh.workspaceRoot
# - agents.defaults.sandbox.ssh.identityFile / certificateFile / knownHostsFile
# - agents.defaults.sandbox.ssh.identityData / certificateData / knownHostsData

openclaw sandbox recreate --all
```

Für das Core-Backend `ssh` löscht Neuerstellung das pro Scope vorhandene Root des Remote-Workspace
auf dem SSH-Ziel. Beim nächsten Lauf wird es erneut aus dem lokalen Workspace gesät.

### Nach dem Ändern von OpenShell-Quelle, -Richtlinie oder -Modus

```bash
# Konfiguration bearbeiten:
# - agents.defaults.sandbox.backend
# - plugins.entries.openshell.config.from
# - plugins.entries.openshell.config.mode
# - plugins.entries.openshell.config.policy

openclaw sandbox recreate --all
```

Für den OpenShell-Modus `remote` löscht Neuerstellung den kanonischen Remote-Workspace
für diesen Scope. Beim nächsten Lauf wird er erneut aus dem lokalen Workspace gesät.

### Nach dem Ändern von setupCommand

```bash
openclaw sandbox recreate --all
# oder nur ein Agent:
openclaw sandbox recreate --agent family
```

### Nur für einen bestimmten Agenten

```bash
# Nur die Container eines Agenten aktualisieren
openclaw sandbox recreate --agent alfred
```

## Warum ist das nötig?

**Problem:** Wenn Sie die Sandbox-Konfiguration aktualisieren:

- Bestehende Laufzeiten laufen mit alten Einstellungen weiter
- Laufzeiten werden erst nach 24 Stunden Inaktivität bereinigt
- Regelmäßig verwendete Agenten halten alte Laufzeiten unbegrenzt am Leben

**Lösung:** Verwenden Sie `openclaw sandbox recreate`, um die Entfernung alter Laufzeiten zu erzwingen. Sie werden beim nächsten Bedarf automatisch mit den aktuellen Einstellungen neu erstellt.

Tipp: Bevorzugen Sie `openclaw sandbox recreate` gegenüber manueller backend-spezifischer Bereinigung.
Es verwendet die Laufzeit-Registry des Gateway und vermeidet Abweichungen, wenn sich Scope-/SessionKeys ändern.

## Konfiguration

Sandbox-Einstellungen befinden sich in `~/.openclaw/openclaw.json` unter `agents.defaults.sandbox` (Überschreibungen pro Agent gehören in `agents.list[].sandbox`):

```jsonc
{
  "agents": {
    "defaults": {
      "sandbox": {
        "mode": "all", // off, non-main, all
        "backend": "docker", // docker, ssh, openshell
        "scope": "agent", // session, agent, shared
        "docker": {
          "image": "openclaw-sandbox:bookworm-slim",
          "containerPrefix": "openclaw-sbx-",
          // ... weitere Docker-Optionen
        },
        "prune": {
          "idleHours": 24, // Automatisch nach 24 h Leerlauf bereinigen
          "maxAgeDays": 7, // Automatisch nach 7 Tagen bereinigen
        },
      },
    },
  },
}
```

## Verwandt

- [CLI-Referenz](/de/cli)
- [Sandboxing](/de/gateway/sandboxing)
- [Agent-Workspace](/de/concepts/agent-workspace)
- [Doctor](/de/gateway/doctor) — prüft die Sandbox-Einrichtung
