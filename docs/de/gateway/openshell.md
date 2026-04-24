---
read_when:
    - Sie möchten cloudverwaltete Sandboxes statt lokalem Docker verwenden
    - Sie richten das OpenShell-Plugin ein
    - Sie müssen zwischen den Workspace-Modi mirror und remote wählen
summary: OpenShell als verwaltetes Sandbox-Backend für OpenClaw-Agenten verwenden
title: OpenShell
x-i18n:
    generated_at: "2026-04-24T06:39:08Z"
    model: gpt-5.4
    provider: openai
    source_hash: 47954cd27b4c7ef9d4268597c2846960b39b99fd03ece5dddb5055e9282366a0
    source_path: gateway/openshell.md
    workflow: 15
---

OpenShell ist ein verwaltetes Sandbox-Backend für OpenClaw. Statt Docker-
Container lokal auszuführen, delegiert OpenClaw den Sandbox-Lebenszyklus an die `openshell` CLI,
die Remote-Umgebungen mit SSH-basierter Befehlsausführung bereitstellt.

Das OpenShell-Plugin verwendet denselben SSH-Kerntransport und dieselbe Bridge für entfernte Dateisysteme
wie das generische [SSH-Backend](/de/gateway/sandboxing#ssh-backend). Es fügt
OpenShell-spezifischen Lebenszyklus hinzu (`sandbox create/get/delete`, `sandbox ssh-config`)
sowie einen optionalen Workspace-Modus `mirror`.

## Voraussetzungen

- Die `openshell` CLI ist installiert und auf `PATH` verfügbar (oder setzen Sie einen benutzerdefinierten Pfad über
  `plugins.entries.openshell.config.command`)
- Ein OpenShell-Konto mit Sandbox-Zugriff
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

2. Starten Sie das Gateway neu. Beim nächsten Agenten-Turn erstellt OpenClaw eine OpenShell-
   Sandbox und routet die Tool-Ausführung darüber.

3. Prüfen Sie:

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
- Nach `exec` synchronisiert OpenClaw den entfernten Workspace zurück in den lokalen Workspace.
- Datei-Tools arbeiten weiterhin über die Sandbox-Bridge, aber der lokale Workspace
  bleibt zwischen den Turns die Source of Truth.

Am besten geeignet für:

- Sie bearbeiten Dateien lokal außerhalb von OpenClaw und möchten, dass diese Änderungen im
  Sandbox automatisch sichtbar werden.
- Sie möchten, dass sich die OpenShell-Sandbox so ähnlich wie das Docker-Backend wie
  möglich verhält.
- Sie möchten, dass der Host-Workspace nach jedem `exec`-Turn die Schreibvorgänge der Sandbox widerspiegelt.

Nachteil: zusätzliche Synchronisierungskosten vor und nach jedem `exec`.

### `remote`

Verwenden Sie `plugins.entries.openshell.config.mode: "remote"`, wenn Sie möchten, dass der
**OpenShell-Workspace kanonisch wird**.

Verhalten:

- Wenn die Sandbox zum ersten Mal erstellt wird, initialisiert OpenClaw den Remote-Workspace einmalig aus
  dem lokalen Workspace.
- Danach arbeiten `exec`, `read`, `write`, `edit` und `apply_patch`
  direkt gegen den entfernten OpenShell-Workspace.
- OpenClaw synchronisiert **keine** entfernten Änderungen zurück in den lokalen Workspace.
- Lesen von Medien zur Prompt-Zeit funktioniert weiterhin, weil Datei- und Media-Tools über
  die Sandbox-Bridge lesen.

Am besten geeignet für:

- Der Sandbox soll primär auf der Remote-Seite leben.
- Sie möchten geringeren Synchronisierungs-Overhead pro Turn.
- Sie möchten nicht, dass hostlokale Bearbeitungen stillschweigend den Zustand der Remote-Sandbox überschreiben.

Wichtig: Wenn Sie nach der anfänglichen Initialisierung Dateien auf dem Host außerhalb von OpenClaw bearbeiten,
sieht die Remote-Sandbox diese Änderungen **nicht**. Verwenden Sie
`openclaw sandbox recreate`, um erneut zu initialisieren.

### Einen Modus wählen

|                          | `mirror`                        | `remote`                   |
| ------------------------ | ------------------------------- | -------------------------- |
| **Kanonischer Workspace**| Lokaler Host                    | Remote-OpenShell           |
| **Synchronisierungsrichtung** | Bidirektional (bei jedem `exec`) | Einmalige Initialisierung |
| **Overhead pro Turn**    | Höher (Upload + Download)       | Niedriger (direkte Remote-Operationen) |
| **Lokale Bearbeitungen sichtbar?** | Ja, beim nächsten `exec`     | Nein, bis `recreate`       |
| **Am besten geeignet für** | Entwicklungs-Workflows         | Lang laufende Agenten, CI  |

## Konfigurationsreferenz

Alle OpenShell-Konfigurationen liegen unter `plugins.entries.openshell.config`:

| Schlüssel                 | Typ                      | Standard      | Beschreibung                                          |
| ------------------------- | ------------------------ | ------------- | ---------------------------------------------------- |
| `mode`                    | `"mirror"` oder `"remote"` | `"mirror"`  | Workspace-Synchronisierungsmodus                     |
| `command`                 | `string`                 | `"openshell"` | Pfad oder Name der `openshell` CLI                   |
| `from`                    | `string`                 | `"openclaw"`  | Sandbox-Quelle für erstmalige Erstellung             |
| `gateway`                 | `string`                 | —             | Name des OpenShell-Gateway (`--gateway`)             |
| `gatewayEndpoint`         | `string`                 | —             | Endpunkt-URL des OpenShell-Gateway (`--gateway-endpoint`) |
| `policy`                  | `string`                 | —             | OpenShell-Policy-ID für die Erstellung der Sandbox   |
| `providers`               | `string[]`               | `[]`          | Namen von Anbietern, die beim Erstellen der Sandbox angehängt werden |
| `gpu`                     | `boolean`                | `false`       | GPU-Ressourcen anfordern                             |
| `autoProviders`           | `boolean`                | `true`        | `--auto-providers` bei `sandbox create` übergeben    |
| `remoteWorkspaceDir`      | `string`                 | `"/sandbox"`  | Primärer beschreibbarer Workspace innerhalb der Sandbox |
| `remoteAgentWorkspaceDir` | `string`                 | `"/agent"`    | Mount-Pfad des Agenten-Workspace (für schreibgeschützten Zugriff) |
| `timeoutSeconds`          | `number`                 | `120`         | Timeout für `openshell`-CLI-Operationen              |

Einstellungen auf Sandbox-Ebene (`mode`, `scope`, `workspaceAccess`) werden wie bei jedem Backend unter
`agents.defaults.sandbox` konfiguriert. Siehe
[Sandboxing](/de/gateway/sandboxing) für die vollständige Matrix.

## Beispiele

### Minimale Remote-Einrichtung

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
# Alle Sandbox-Runtimes auflisten (Docker + OpenShell)
openclaw sandbox list

# Effektive Richtlinie prüfen
openclaw sandbox explain

# Neu erstellen (entfernten Workspace löschen, bei nächster Nutzung erneut initialisieren)
openclaw sandbox recreate --all
```

Für den Modus `remote` ist **recreate besonders wichtig**: Es löscht den kanonischen
entfernten Workspace für diesen Geltungsbereich. Bei der nächsten Nutzung wird ein frischer Remote-Workspace aus
dem lokalen Workspace initialisiert.

Für den Modus `mirror` setzt recreate hauptsächlich die Remote-Ausführungsumgebung zurück, weil
der lokale Workspace kanonisch bleibt.

### Wann `recreate` ausgeführt werden sollte

Führen Sie `recreate` aus, nachdem Sie eines der folgenden Elemente geändert haben:

- `agents.defaults.sandbox.backend`
- `plugins.entries.openshell.config.from`
- `plugins.entries.openshell.config.mode`
- `plugins.entries.openshell.config.policy`

```bash
openclaw sandbox recreate --all
```

## Sicherheitshärtung

OpenShell pinnt den Workspace-Root-fd und prüft die Sandbox-Identität vor jedem
Lesevorgang erneut, sodass Symlink-Austausch oder ein neu gemounteter Workspace Lesevorgänge nicht aus
dem beabsichtigten Remote-Workspace umleiten können.

## Aktuelle Einschränkungen

- Sandbox-Browser wird im OpenShell-Backend nicht unterstützt.
- `sandbox.docker.binds` gilt nicht für OpenShell.
- Docker-spezifische Laufzeitparameter unter `sandbox.docker.*` gelten nur für das Docker-
  Backend.

## Funktionsweise

1. OpenClaw ruft `openshell sandbox create` auf (mit `--from`, `--gateway`,
   `--policy`, `--providers`, `--gpu`-Flags wie konfiguriert).
2. OpenClaw ruft `openshell sandbox ssh-config <name>` auf, um SSH-Verbindungs-
   details für die Sandbox abzurufen.
3. Der Core schreibt die SSH-Konfiguration in eine temporäre Datei und öffnet eine SSH-Sitzung unter Verwendung derselben
   Remote-Dateisystem-Bridge wie das generische SSH-Backend.
4. Im Modus `mirror`: lokalen Workspace vor `exec` nach remote synchronisieren, ausführen, danach zurücksynchronisieren.
5. Im Modus `remote`: einmal bei der Erstellung initialisieren, danach direkt auf dem Remote-
   Workspace arbeiten.

## Verwandt

- [Sandboxing](/de/gateway/sandboxing) -- Modi, Geltungsbereiche und Backend-Vergleich
- [Sandbox vs Tool Policy vs Elevated](/de/gateway/sandbox-vs-tool-policy-vs-elevated) -- Fehlerbehebung bei blockierten Tools
- [Multi-Agent Sandbox and Tools](/de/tools/multi-agent-sandbox-tools) -- Überschreibungen pro Agent
- [Sandbox CLI](/de/cli/sandbox) -- Befehle für `openclaw sandbox`
