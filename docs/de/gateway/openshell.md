---
read_when:
    - Sie möchten cloudverwaltete Sandboxes statt lokalem Docker
    - Sie richten das OpenShell-Plugin ein
    - Sie müssen zwischen den Workspace-Modi mirror und remote wählen
summary: OpenShell als verwaltetes Sandbox-Backend für OpenClaw-Agents verwenden
title: OpenShell
x-i18n:
    generated_at: "2026-04-23T14:02:02Z"
    model: gpt-5.4
    provider: openai
    source_hash: 2534127b293364659a14df3e36583a9b7120f5d55cdbd8b4b611efe44adc7ff8
    source_path: gateway/openshell.md
    workflow: 15
---

# OpenShell

OpenShell ist ein verwaltetes Sandbox-Backend für OpenClaw. Anstatt Docker-
Container lokal auszuführen, delegiert OpenClaw den Sandbox-Lebenszyklus an die `openshell`-CLI,
die Remote-Umgebungen mit SSH-basierter Befehlsausführung bereitstellt.

Das OpenShell-Plugin verwendet denselben zentralen SSH-Transport und dieselbe Bridge für Remote-Dateisysteme
wie das generische [SSH-Backend](/de/gateway/sandboxing#ssh-backend). Es ergänzt
OpenShell-spezifischen Lebenszyklus (`sandbox create/get/delete`, `sandbox ssh-config`)
und einen optionalen Workspace-Modus `mirror`.

## Voraussetzungen

- Die `openshell`-CLI muss installiert und im `PATH` verfügbar sein (oder ein benutzerdefinierter Pfad über
  `plugins.entries.openshell.config.command` gesetzt werden)
- Ein OpenShell-Konto mit Sandbox-Zugriff
- Ein laufendes OpenClaw Gateway auf dem Host

## Schnellstart

1. Aktivieren Sie das Plugin und setzen Sie das Sandbox-Backend:

```json5
{
  agents: {
    defaults: {
      sandbox: {
        mode: "all",
        backend: "openshell",
        scope: "session",
        workspaceAccess: "rw",
      },
    },
  },
  plugins: {
    entries: {
      openshell: {
        enabled: true,
        config: {
          from: "openclaw",
          mode: "remote",
        },
      },
    },
  },
}
```

2. Starten Sie das Gateway neu. Beim nächsten Agent-Turn erstellt OpenClaw eine OpenShell-
   Sandbox und leitet die Tool-Ausführung darüber.

3. Verifizieren Sie dies:

```bash
openclaw sandbox list
openclaw sandbox explain
```

## Workspace-Modi

Dies ist die wichtigste Entscheidung bei der Verwendung von OpenShell.

### `mirror`

Verwenden Sie `plugins.entries.openshell.config.mode: "mirror"`, wenn der **lokale
Workspace kanonisch** bleiben soll.

Verhalten:

- Vor `exec` synchronisiert OpenClaw den lokalen Workspace in die OpenShell-Sandbox.
- Nach `exec` synchronisiert OpenClaw den Remote-Workspace zurück in den lokalen Workspace.
- Datei-Tools arbeiten weiterhin über die Sandbox-Bridge, aber der lokale Workspace
  bleibt zwischen den Turns die Source of Truth.

Am besten geeignet für:

- Sie bearbeiten Dateien lokal außerhalb von OpenClaw, und diese Änderungen sollen in der
  Sandbox automatisch sichtbar sein.
- Die OpenShell-Sandbox soll sich möglichst ähnlich wie das Docker-Backend
  verhalten.
- Der Host-Workspace soll die Sandbox-Schreibvorgänge nach jedem Exec-Turn widerspiegeln.

Nachteil: zusätzliche Synchronisierungskosten vor und nach jedem Exec.

### `remote`

Verwenden Sie `plugins.entries.openshell.config.mode: "remote"`, wenn der
**OpenShell-Workspace kanonisch** werden soll.

Verhalten:

- Wenn die Sandbox zum ersten Mal erstellt wird, initialisiert OpenClaw den Remote-Workspace
  einmalig aus dem lokalen Workspace.
- Danach arbeiten `exec`, `read`, `write`, `edit` und `apply_patch`
  direkt mit dem Remote-OpenShell-Workspace.
- OpenClaw synchronisiert **keine** Remote-Änderungen zurück in den lokalen Workspace.
- Medienlesevorgänge zur Prompt-Zeit funktionieren weiterhin, weil Datei- und Medien-Tools über
  die Sandbox-Bridge lesen.

Am besten geeignet für:

- Die Sandbox soll primär auf der Remote-Seite leben.
- Sie möchten geringeren Synchronisierungs-Overhead pro Turn.
- Host-lokale Änderungen sollen den Remote-Sandbox-Status nicht stillschweigend überschreiben.

Wichtig: Wenn Sie nach der anfänglichen Initialisierung Dateien auf dem Host außerhalb von OpenClaw bearbeiten,
sieht die Remote-Sandbox diese Änderungen **nicht**. Verwenden Sie
`openclaw sandbox recreate`, um erneut zu initialisieren.

### Einen Modus wählen

|                          | `mirror`                   | `remote`                  |
| ------------------------ | -------------------------- | ------------------------- |
| **Kanonischer Workspace**| Lokaler Host               | Remote-OpenShell          |
| **Sync-Richtung**        | Bidirektional (bei jedem Exec) | Einmalige Initialisierung |
| **Overhead pro Turn**    | Höher (Upload + Download)  | Geringer (direkte Remote-Operationen) |
| **Lokale Änderungen sichtbar?** | Ja, beim nächsten Exec | Nein, bis `recreate`      |
| **Am besten geeignet für** | Entwicklungs-Workflows   | Langlaufende Agents, CI   |

## Konfigurationsreferenz

Die gesamte OpenShell-Konfiguration befindet sich unter `plugins.entries.openshell.config`:

| Schlüssel                  | Typ                      | Standard      | Beschreibung                                         |
| ------------------------- | ------------------------ | ------------- | ---------------------------------------------------- |
| `mode`                    | `"mirror"` oder `"remote"` | `"mirror"`  | Workspace-Synchronisierungsmodus                     |
| `command`                 | `string`                 | `"openshell"` | Pfad oder Name der `openshell`-CLI                  |
| `from`                    | `string`                 | `"openclaw"`  | Sandbox-Quelle für die erstmalige Erstellung         |
| `gateway`                 | `string`                 | —             | OpenShell-Gateway-Name (`--gateway`)                 |
| `gatewayEndpoint`         | `string`                 | —             | OpenShell-Gateway-Endpoint-URL (`--gateway-endpoint`) |
| `policy`                  | `string`                 | —             | OpenShell-Policy-ID für die Sandbox-Erstellung       |
| `providers`               | `string[]`               | `[]`          | Providernamen, die beim Erstellen der Sandbox angehängt werden |
| `gpu`                     | `boolean`                | `false`       | GPU-Ressourcen anfordern                             |
| `autoProviders`           | `boolean`                | `true`        | `--auto-providers` bei `sandbox create` übergeben    |
| `remoteWorkspaceDir`      | `string`                 | `"/sandbox"`  | Primärer beschreibbarer Workspace innerhalb der Sandbox |
| `remoteAgentWorkspaceDir` | `string`                 | `"/agent"`    | Mount-Pfad des Agent-Workspace (für schreibgeschützten Zugriff) |
| `timeoutSeconds`          | `number`                 | `120`         | Timeout für `openshell`-CLI-Operationen              |

Einstellungen auf Sandbox-Ebene (`mode`, `scope`, `workspaceAccess`) werden wie bei jedem Backend unter
`agents.defaults.sandbox` konfiguriert. Siehe
[Sandboxing](/de/gateway/sandboxing) für die vollständige Matrix.

## Beispiele

### Minimales Remote-Setup

```json5
{
  agents: {
    defaults: {
      sandbox: {
        mode: "all",
        backend: "openshell",
      },
    },
  },
  plugins: {
    entries: {
      openshell: {
        enabled: true,
        config: {
          from: "openclaw",
          mode: "remote",
        },
      },
    },
  },
}
```

### Mirror-Modus mit GPU

```json5
{
  agents: {
    defaults: {
      sandbox: {
        mode: "all",
        backend: "openshell",
        scope: "agent",
        workspaceAccess: "rw",
      },
    },
  },
  plugins: {
    entries: {
      openshell: {
        enabled: true,
        config: {
          from: "openclaw",
          mode: "mirror",
          gpu: true,
          providers: ["openai"],
          timeoutSeconds: 180,
        },
      },
    },
  },
}
```

### OpenShell pro Agent mit benutzerdefiniertem Gateway

```json5
{
  agents: {
    defaults: {
      sandbox: { mode: "off" },
    },
    list: [
      {
        id: "researcher",
        sandbox: {
          mode: "all",
          backend: "openshell",
          scope: "agent",
          workspaceAccess: "rw",
        },
      },
    ],
  },
  plugins: {
    entries: {
      openshell: {
        enabled: true,
        config: {
          from: "openclaw",
          mode: "remote",
          gateway: "lab",
          gatewayEndpoint: "https://lab.example",
          policy: "strict",
        },
      },
    },
  },
}
```

## Lebenszyklusverwaltung

OpenShell-Sandboxes werden über die normale Sandbox-CLI verwaltet:

```bash
# Alle Sandbox-Laufzeiten auflisten (Docker + OpenShell)
openclaw sandbox list

# Effektive Policy prüfen
openclaw sandbox explain

# Neu erstellen (löscht den Remote-Workspace, initialisiert bei der nächsten Nutzung neu)
openclaw sandbox recreate --all
```

Für den Modus `remote` ist **recreate besonders wichtig**: Er löscht den kanonischen
Remote-Workspace für diesen Scope. Bei der nächsten Nutzung wird ein frischer Remote-Workspace aus
dem lokalen Workspace initialisiert.

Für den Modus `mirror` setzt `recreate` hauptsächlich die Remote-Ausführungsumgebung zurück, da
der lokale Workspace kanonisch bleibt.

### Wann `recreate` verwendet werden sollte

Verwenden Sie `recreate`, nachdem Sie einen der folgenden Werte geändert haben:

- `agents.defaults.sandbox.backend`
- `plugins.entries.openshell.config.from`
- `plugins.entries.openshell.config.mode`
- `plugins.entries.openshell.config.policy`

```bash
openclaw sandbox recreate --all
```

## Security-Härtung

OpenShell pinnt den fd des Workspace-Root und prüft die Sandbox-Identität vor jedem
Lesevorgang erneut, sodass Symlink-Tausch oder ein neu gemounteter Workspace Lesevorgänge nicht aus
dem vorgesehenen Remote-Workspace umleiten können.

## Aktuelle Einschränkungen

- Der Sandbox-Browser wird vom OpenShell-Backend nicht unterstützt.
- `sandbox.docker.binds` gilt nicht für OpenShell.
- Docker-spezifische Laufzeitregler unter `sandbox.docker.*` gelten nur für das Docker-
  Backend.

## Funktionsweise

1. OpenClaw ruft `openshell sandbox create` auf (mit `--from`, `--gateway`,
   `--policy`, `--providers`, `--gpu`-Flags gemäß Konfiguration).
2. OpenClaw ruft `openshell sandbox ssh-config <name>` auf, um SSH-Verbindungs-
   details für die Sandbox abzurufen.
3. Der Kern schreibt die SSH-Konfiguration in eine temporäre Datei und öffnet eine SSH-Sitzung mit derselben
   Bridge für Remote-Dateisysteme wie beim generischen SSH-Backend.
4. Im Modus `mirror`: lokalen Workspace vor `exec` auf Remote synchronisieren, ausführen, nach `exec` zurück synchronisieren.
5. Im Modus `remote`: einmalig bei der Erstellung initialisieren und dann direkt auf dem Remote-
   Workspace arbeiten.

## Siehe auch

- [Sandboxing](/de/gateway/sandboxing) -- Modi, Scopes und Backend-Vergleich
- [Sandbox vs Tool Policy vs Elevated](/de/gateway/sandbox-vs-tool-policy-vs-elevated) -- Debugging blockierter Tools
- [Multi-Agent Sandbox and Tools](/de/tools/multi-agent-sandbox-tools) -- Überschreibungen pro Agent
- [Sandbox CLI](/de/cli/sandbox) -- Befehle für `openclaw sandbox`
