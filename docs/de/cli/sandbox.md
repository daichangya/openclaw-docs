---
read_when: You are managing sandbox runtimes or debugging sandbox/tool-policy behavior.
status: active
summary: Sandbox-Laufzeitumgebungen verwalten und die effektive Sandbox-Richtlinie prüfen
title: Sandbox CLI
x-i18n:
    generated_at: "2026-04-05T12:39:03Z"
    model: gpt-5.4
    provider: openai
    source_hash: fa2783037da2901316108d35e04bb319d5d57963c2764b9146786b3c6474b48a
    source_path: cli/sandbox.md
    workflow: 15
---

# Sandbox CLI

Sandbox-Laufzeitumgebungen für isolierte Agentenausführung verwalten.

## Überblick

OpenClaw kann Agenten aus Sicherheitsgründen in isolierten Sandbox-Laufzeitumgebungen ausführen. Die Befehle `sandbox` helfen Ihnen, diese Laufzeitumgebungen nach Updates oder Konfigurationsänderungen zu prüfen und neu zu erstellen.

Heute bedeutet das in der Regel:

- Docker-Sandbox-Container
- SSH-Sandbox-Laufzeitumgebungen, wenn `agents.defaults.sandbox.backend = "ssh"`
- OpenShell-Sandbox-Laufzeitumgebungen, wenn `agents.defaults.sandbox.backend = "openshell"`

Bei `ssh` und OpenShell `remote` ist Neuerstellung wichtiger als bei Docker:

- der entfernte Workspace ist nach dem ersten Seed der kanonische Workspace
- `openclaw sandbox recreate` löscht diesen kanonischen entfernten Workspace für den ausgewählten Geltungsbereich
- bei der nächsten Verwendung wird er erneut aus dem aktuellen lokalen Workspace initialisiert

## Befehle

### `openclaw sandbox explain`

Die **effektive** Sandbox-Modus-/Geltungsbereich-/Workspace-Zugriffskonfiguration, die Sandbox-Tool-Richtlinie und Elevated-Gates prüfen (mit Config-Key-Pfaden zur Behebung).

```bash
openclaw sandbox explain
openclaw sandbox explain --session agent:main:main
openclaw sandbox explain --agent work
openclaw sandbox explain --json
```

### `openclaw sandbox list`

Alle Sandbox-Laufzeitumgebungen mit ihrem Status und ihrer Konfiguration auflisten.

```bash
openclaw sandbox list
openclaw sandbox list --browser  # Nur Browser-Container auflisten
openclaw sandbox list --json     # JSON-Ausgabe
```

**Die Ausgabe enthält:**

- Name und Status der Laufzeitumgebung
- Backend (`docker`, `openshell` usw.)
- Konfigurationslabel und ob es mit der aktuellen Konfiguration übereinstimmt
- Alter (Zeit seit der Erstellung)
- Leerlaufzeit (Zeit seit der letzten Verwendung)
- Zugehörige Sitzung/zugehöriger Agent

### `openclaw sandbox recreate`

Sandbox-Laufzeitumgebungen entfernen, um eine Neuerstellung mit aktualisierter Konfiguration zu erzwingen.

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
- `--force`: Bestätigungsaufforderung überspringen

**Wichtig:** Laufzeitumgebungen werden automatisch neu erstellt, wenn der Agent das nächste Mal verwendet wird.

## Anwendungsfälle

### Nach dem Aktualisieren eines Docker-Images

```bash
# Neues Image herunterladen
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

### Nach dem Ändern des SSH-Ziels oder des SSH-Authentifizierungsmaterials

```bash
# Konfiguration bearbeiten:
# - agents.defaults.sandbox.backend
# - agents.defaults.sandbox.ssh.target
# - agents.defaults.sandbox.ssh.workspaceRoot
# - agents.defaults.sandbox.ssh.identityFile / certificateFile / knownHostsFile
# - agents.defaults.sandbox.ssh.identityData / certificateData / knownHostsData

openclaw sandbox recreate --all
```

Beim Core-Backend `ssh` löscht die Neuerstellung das entfernte Workspace-Root pro Geltungsbereich
auf dem SSH-Ziel. Beim nächsten Lauf wird es erneut aus dem lokalen Workspace initialisiert.

### Nach dem Ändern von OpenShell-Quelle, -Richtlinie oder -Modus

```bash
# Konfiguration bearbeiten:
# - agents.defaults.sandbox.backend
# - plugins.entries.openshell.config.from
# - plugins.entries.openshell.config.mode
# - plugins.entries.openshell.config.policy

openclaw sandbox recreate --all
```

Im OpenShell-Modus `remote` löscht die Neuerstellung den kanonischen entfernten Workspace
für diesen Geltungsbereich. Beim nächsten Lauf wird er erneut aus dem lokalen Workspace initialisiert.

### Nach dem Ändern von `setupCommand`

```bash
openclaw sandbox recreate --all
# oder nur einen Agenten:
openclaw sandbox recreate --agent family
```

### Nur für einen bestimmten Agenten

```bash
# Nur die Container eines Agenten aktualisieren
openclaw sandbox recreate --agent alfred
```

## Warum ist das nötig?

**Problem:** Wenn Sie die Sandbox-Konfiguration aktualisieren:

- laufen bestehende Laufzeitumgebungen mit den alten Einstellungen weiter
- werden Laufzeitumgebungen erst nach 24 Stunden Inaktivität bereinigt
- halten regelmäßig verwendete Agenten alte Laufzeitumgebungen unbegrenzt am Leben

**Lösung:** Verwenden Sie `openclaw sandbox recreate`, um das Entfernen alter Laufzeitumgebungen zu erzwingen. Sie werden bei Bedarf automatisch mit den aktuellen Einstellungen neu erstellt.

Tipp: Bevorzugen Sie `openclaw sandbox recreate` gegenüber manueller backend-spezifischer Bereinigung.
Es verwendet die Laufzeitregistrierung des Gateway und vermeidet Inkonsistenzen, wenn sich Geltungsbereichs-/Sitzungsschlüssel ändern.

## Konfiguration

Sandbox-Einstellungen befinden sich in `~/.openclaw/openclaw.json` unter `agents.defaults.sandbox` (Überschreibungen pro Agent kommen unter `agents.list[].sandbox`):

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
          "idleHours": 24, // Automatische Bereinigung nach 24 h Leerlauf
          "maxAgeDays": 7, // Automatische Bereinigung nach 7 Tagen
        },
      },
    },
  },
}
```

## Siehe auch

- [Sandbox Documentation](/gateway/sandboxing)
- [Agent Configuration](/concepts/agent-workspace)
- [Doctor Command](/gateway/doctor) - Sandbox-Einrichtung prüfen
