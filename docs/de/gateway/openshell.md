---
read_when:
    - Sie möchten cloudverwaltete Sandboxes statt lokalem Docker
    - Sie richten das OpenShell-Plugin ein
    - Sie müssen zwischen Mirror- und Remote-Workspace-Modi wählen
summary: OpenShell als verwaltetes Sandbox-Backend für OpenClaw-Agenten verwenden
title: OpenShell
x-i18n:
    generated_at: "2026-04-05T12:43:11Z"
    model: gpt-5.4
    provider: openai
    source_hash: aaf9027d0632a70fb86455f8bc46dc908ff766db0eb0cdf2f7df39c715241ead
    source_path: gateway/openshell.md
    workflow: 15
---

# OpenShell

OpenShell ist ein verwaltetes Sandbox-Backend für OpenClaw. Anstatt Docker-
Container lokal auszuführen, delegiert OpenClaw den Sandbox-Lifecycle an die `openshell`-CLI,
die Remote-Umgebungen mit SSH-basierter Befehlsausführung bereitstellt.

Das OpenShell-Plugin verwendet denselben Core-SSH-Transport und dieselbe Bridge für das Remote-Dateisystem
wie das generische [SSH backend](/gateway/sandboxing#ssh-backend). Es fügt
OpenShell-spezifischen Lifecycle hinzu (`sandbox create/get/delete`, `sandbox ssh-config`)
sowie einen optionalen `mirror`-Workspace-Modus.

## Voraussetzungen

- Die `openshell`-CLI muss installiert und in `PATH` verfügbar sein (oder setzen Sie einen benutzerdefinierten Pfad über
  `plugins.entries.openshell.config.command`)
- Ein OpenShell-Konto mit Zugriff auf Sandboxes
- OpenClaw Gateway läuft auf dem Host

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

2. Starten Sie das Gateway neu. Beim nächsten Agent-Zug erstellt OpenClaw eine OpenShell-
   Sandbox und leitet die Tool-Ausführung durch sie.

3. Verifizieren Sie dies:

```bash
openclaw sandbox list
openclaw sandbox explain
```

## Workspace-Modi

Dies ist die wichtigste Entscheidung bei der Verwendung von OpenShell.

### `mirror`

Verwenden Sie `plugins.entries.openshell.config.mode: "mirror"`, wenn Sie möchten, dass der **lokale
Workspace kanonisch bleibt**.

Verhalten:

- Vor `exec` synchronisiert OpenClaw den lokalen Workspace in die OpenShell-Sandbox.
- Nach `exec` synchronisiert OpenClaw den Remote-Workspace zurück in den lokalen Workspace.
- Datei-Tools arbeiten weiterhin über die Sandbox-Bridge, aber der lokale Workspace
  bleibt zwischen den Zügen die Quelle der Wahrheit.

Am besten geeignet für:

- Sie bearbeiten Dateien lokal außerhalb von OpenClaw und möchten, dass diese Änderungen in der
  Sandbox automatisch sichtbar werden.
- Sie möchten, dass sich die OpenShell-Sandbox so ähnlich wie das Docker-Backend wie
  möglich verhält.
- Sie möchten, dass der Host-Workspace Sandbox-Schreibvorgänge nach jedem `exec`-Zug widerspiegelt.

Abwägung: zusätzlicher Synchronisationsaufwand vor und nach jedem `exec`.

### `remote`

Verwenden Sie `plugins.entries.openshell.config.mode: "remote"`, wenn Sie möchten, dass der
**OpenShell-Workspace kanonisch wird**.

Verhalten:

- Wenn die Sandbox zum ersten Mal erstellt wird, initialisiert OpenClaw den Remote-Workspace einmalig
  aus dem lokalen Workspace.
- Danach arbeiten `exec`, `read`, `write`, `edit` und `apply_patch`
  direkt gegen den Remote-OpenShell-Workspace.
- OpenClaw synchronisiert **nicht** Remote-Änderungen zurück in den lokalen Workspace.
- Medienlesevorgänge zur Prompt-Zeit funktionieren weiterhin, weil Datei- und Medien-Tools über
  die Sandbox-Bridge lesen.

Am besten geeignet für:

- Die Sandbox soll hauptsächlich auf der Remote-Seite leben.
- Sie möchten geringeren Synchronisations-Overhead pro Zug.
- Sie möchten nicht, dass host-lokale Änderungen den Zustand der Remote-Sandbox stillschweigend überschreiben.

Wichtig: Wenn Sie nach dem anfänglichen Seed Dateien auf dem Host außerhalb von OpenClaw bearbeiten,
sieht die Remote-Sandbox diese Änderungen **nicht**. Verwenden Sie
`openclaw sandbox recreate`, um erneut zu initialisieren.

### Einen Modus wählen

|                          | `mirror`                   | `remote`                  |
| ------------------------ | -------------------------- | ------------------------- |
| **Kanonischer Workspace** | Lokaler Host              | Remote OpenShell          |
| **Synchronisationsrichtung** | Bidirektional (jedes `exec`) | Einmaliger Seed      |
| **Overhead pro Zug**     | Höher (Upload + Download)  | Geringer (direkte Remote-Operationen) |
| **Lokale Änderungen sichtbar?** | Ja, beim nächsten `exec` | Nein, bis `recreate` |
| **Am besten für**        | Entwicklungs-Workflows     | Langlebige Agenten, CI    |

## Konfigurationsreferenz

Die gesamte OpenShell-Konfiguration befindet sich unter `plugins.entries.openshell.config`:

| Schlüssel                 | Typ                      | Standard      | Beschreibung                                         |
| ------------------------- | ------------------------ | ------------- | ---------------------------------------------------- |
| `mode`                    | `"mirror"` oder `"remote"` | `"mirror"`  | Workspace-Synchronisationsmodus                      |
| `command`                 | `string`                 | `"openshell"` | Pfad oder Name der `openshell`-CLI                   |
| `from`                    | `string`                 | `"openclaw"`  | Sandbox-Quelle für die erstmalige Erstellung         |
| `gateway`                 | `string`                 | —             | OpenShell-Gateway-Name (`--gateway`)                 |
| `gatewayEndpoint`         | `string`                 | —             | OpenShell-Gateway-Endpunkt-URL (`--gateway-endpoint`) |
| `policy`                  | `string`                 | —             | OpenShell-Policy-ID für die Sandbox-Erstellung       |
| `providers`               | `string[]`               | `[]`          | Provider-Namen, die bei der Erstellung der Sandbox angehängt werden |
| `gpu`                     | `boolean`                | `false`       | GPU-Ressourcen anfordern                             |
| `autoProviders`           | `boolean`                | `true`        | `--auto-providers` während `sandbox create` übergeben |
| `remoteWorkspaceDir`      | `string`                 | `"/sandbox"`  | Primärer beschreibbarer Workspace innerhalb der Sandbox |
| `remoteAgentWorkspaceDir` | `string`                 | `"/agent"`    | Mount-Pfad des Agent-Workspaces (für schreibgeschützten Zugriff) |
| `timeoutSeconds`          | `number`                 | `120`         | Timeout für `openshell`-CLI-Operationen              |

Sandbox-Einstellungen auf Ebene der Sandbox (`mode`, `scope`, `workspaceAccess`) werden unter
`agents.defaults.sandbox` konfiguriert wie bei jedem Backend. Siehe
[Sandboxing](/gateway/sandboxing) für die vollständige Matrix.

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

## Lifecycle-Verwaltung

OpenShell-Sandboxes werden über die normale Sandbox-CLI verwaltet:

```bash
# Alle Sandbox-Runtimes auflisten (Docker + OpenShell)
openclaw sandbox list

# Effektive Richtlinie prüfen
openclaw sandbox explain

# Neu erstellen (löscht den Remote-Workspace, initialisiert beim nächsten Gebrauch neu)
openclaw sandbox recreate --all
```

Für den Modus `remote` ist **recreate besonders wichtig**: Er löscht den kanonischen
Remote-Workspace für diesen Bereich. Beim nächsten Gebrauch wird ein frischer Remote-Workspace aus
dem lokalen Workspace initialisiert.

Für den Modus `mirror` setzt `recreate` hauptsächlich die Remote-Ausführungsumgebung zurück, weil
der lokale Workspace kanonisch bleibt.

### Wann neu erstellen

Erstellen Sie neu, nachdem Sie einen dieser Werte geändert haben:

- `agents.defaults.sandbox.backend`
- `plugins.entries.openshell.config.from`
- `plugins.entries.openshell.config.mode`
- `plugins.entries.openshell.config.policy`

```bash
openclaw sandbox recreate --all
```

## Aktuelle Einschränkungen

- Sandbox-Browser wird auf dem OpenShell-Backend nicht unterstützt.
- `sandbox.docker.binds` gilt nicht für OpenShell.
- Docker-spezifische Runtime-Knobs unter `sandbox.docker.*` gelten nur für das Docker-
  Backend.

## So funktioniert es

1. OpenClaw ruft `openshell sandbox create` auf (mit den Flags `--from`, `--gateway`,
   `--policy`, `--providers`, `--gpu` gemäß Konfiguration).
2. OpenClaw ruft `openshell sandbox ssh-config <name>` auf, um SSH-Verbindungs-
   details für die Sandbox zu erhalten.
3. Der Core schreibt die SSH-Konfiguration in eine temporäre Datei und öffnet eine SSH-Sitzung unter Verwendung derselben
   Bridge für das Remote-Dateisystem wie das generische SSH-Backend.
4. Im Modus `mirror`: lokal nach Remote vor `exec` synchronisieren, ausführen, nach `exec` zurück synchronisieren.
5. Im Modus `remote`: einmal beim Erstellen initialisieren und dann direkt auf dem Remote-
   Workspace arbeiten.

## Siehe auch

- [Sandboxing](/gateway/sandboxing) -- Modi, Bereiche und Backend-Vergleich
- [Sandbox vs Tool Policy vs Elevated](/gateway/sandbox-vs-tool-policy-vs-elevated) -- blockierte Tools debuggen
- [Multi-Agent Sandbox and Tools](/tools/multi-agent-sandbox-tools) -- Überschreibungen pro Agent
- [Sandbox CLI](/cli/sandbox) -- `openclaw sandbox`-Befehle
