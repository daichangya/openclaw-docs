---
read_when: You want a dedicated explanation of sandboxing or need to tune agents.defaults.sandbox.
status: active
summary: 'Wie Sandboxing in OpenClaw funktioniert: Modi, Scopes, Workspace-Zugriff und Images'
title: Sandboxing
x-i18n:
    generated_at: "2026-04-24T06:39:44Z"
    model: gpt-5.4
    provider: openai
    source_hash: 07be63b71a458a17020f33a24d60e6d8d7007d4eaea686a21acabf4815c3f653
    source_path: gateway/sandboxing.md
    workflow: 15
---

- Vor `exec` synchronisiert OpenClaw den lokalen Workspace in die OpenShell-Sandbox.
- Nach `exec` synchronisiert OpenClaw den Remote-Workspace zurück in den lokalen Workspace.
- Datei-Tools arbeiten weiterhin über die Sandbox-Bridge, aber der lokale Workspace bleibt zwischen den Turns die Quelle der Wahrheit.

Verwenden Sie dies, wenn:

- Sie Dateien lokal außerhalb von OpenClaw bearbeiten und möchten, dass diese Änderungen automatisch in der Sandbox erscheinen
- Sie möchten, dass sich die OpenShell-Sandbox möglichst ähnlich wie das Docker-Backend verhält
- Sie möchten, dass der Host-Workspace Sandbox-Schreibvorgänge nach jedem `exec`-Turn widerspiegelt

Nachteil:

- zusätzlicher Synchronisierungsaufwand vor und nach `exec`

##### `remote`

Verwenden Sie `plugins.entries.openshell.config.mode: "remote"`, wenn der **OpenShell-Workspace kanonisch** werden soll.

Verhalten:

- Wenn die Sandbox erstellt wird, schreibt OpenClaw den lokalen Workspace einmal in die OpenShell-Sandbox.
- Danach laufen `exec` und Datei-Tools direkt gegen den Remote-Workspace.
- Spätere Änderungen werden nicht automatisch zurück in den lokalen Workspace synchronisiert.

Verwenden Sie dies, wenn:

- der Remote-Sandbox-Workspace der echte Arbeitszustand sein soll
- Sie einen langfristigen Remote-Arbeitsbereich möchten
- Sie die zusätzlichen Synchronisierungsschritte von `mirror` vermeiden möchten

Wichtige Folge:

- Lokale Änderungen, die nach dem initialen Seed außerhalb von OpenClaw vorgenommen werden, erscheinen nicht im Remote-Workspace, bis Sie die Sandbox neu erstellen.

## Workspace-Zugriff

`agents.defaults.sandbox.workspaceAccess` steuert, **wie der Workspace im Sandbox-Backend sichtbar ist**:

- `"ro"`: Workspace schreibgeschützt
- `"rw"`: Workspace lesbar/schreibbar
- `"none"`: kein Workspace-Zugriff

Dies gilt für Tool-Ausführung im Sandbox-Backend. Wenn der Workspace-Zugriff nicht `"rw"` ist, verwendet OpenClaw einen Sandbox-Workspace unter `~/.openclaw/sandboxes` statt des Host-Workspace.

## Sandbox-Workspace-Verhalten

Wenn Sandboxing aktiviert ist, verwendet OpenClaw je nach Backend und Modus einen separaten Workspace-Pfad.

Bei Docker:

- Bei `workspaceAccess: "rw"` wird der Host-Workspace in den Container bind-gemountet.
- Bei `workspaceAccess` ungleich `"rw"` wird ein separater Sandbox-Workspace unter `~/.openclaw/sandboxes` verwendet.
- Seed-Dateien werden aus dem Host-Workspace in diesen Sandbox-Workspace kopiert.
- Nur reguläre Dateien innerhalb des Workspace werden akzeptiert; Symlink-/Hardlink-Aliasse, die sich außerhalb des Quell-Workspace auflösen, werden ignoriert.

Bei SSH/OpenShell-`remote`:

- Der Remote-Workspace wird beim ersten Gebrauch einmal aus dem lokalen Workspace befüllt.
- Danach ist der Remote-Workspace der kanonische Sandbox-Zustand.

## Docker-Image

Für das Docker-Backend steuert `agents.defaults.sandbox.docker.image`, **welches Image** verwendet wird.

Beispiel:

```json5
{
  agents: {
    defaults: {
      sandbox: {
        mode: "all",
        backend: "docker",
        docker: {
          image: "openclaw-sandbox:bookworm-slim",
        },
      },
    },
  },
}
```

Typische Felder unter `sandbox.docker`:

- `image`
- `workdir`
- `readOnlyRoot`
- `tmpfs`
- `network`
- `user`
- `binds`

Wenn Sie das Standard-Image noch nicht gebaut haben, führen Sie das Setup-Skript aus, das in der Dokumentation oder im Repository angegeben ist.

## Browser-Sandbox

Die Browser-Sandbox ist optional und getrennt von der normalen Tool-Sandbox.

Konfiguriert unter:

- `agents.defaults.sandbox.browser`
- `agents.list[].sandbox.browser`

Wichtige Punkte:

- Nur im Docker-Backend unterstützt.
- Kann automatisch starten, damit CDP erreichbar ist.
- Verwendet standardmäßig ein dediziertes Docker-Netzwerk.
- Kann Host-Browser-Steuerung erlauben oder einschränken.
- Kann benutzerdefinierte Steuerziele über Allowlists begrenzen.

## Erhöhte Ausführung und Escape-Hatches

Einige Tools können absichtlich außerhalb der Sandbox laufen.

Wichtigster Fall:

- **Erhöhtes Exec umgeht das Sandboxing** und verwendet den konfigurierten Escape-Pfad (`gateway` standardmäßig oder `node`, wenn das Exec-Ziel `node` ist).

Das ist absichtlich. Sandboxing reduziert die Reichweite normaler Tool-Ausführung, aber erhöhte Ausführung ist ein expliziter Escape-Hatch.

Wenn Sandboxing deaktiviert ist:

- `tools.elevated` ändert nichts am Ausführungsort, weil die Ausführung bereits auf dem Host erfolgt.

Siehe [Elevated Mode](/de/tools/elevated).

## Praktische Auswahl

Wenn Sie nur eine einfache Faustregel möchten:

- **Lokale Entwicklung + starke Isolation** → `backend: "docker"`
- **Auf separaten SSH-Host auslagern** → `backend: "ssh"`
- **Verwaltete Remote-Sandboxes mit optionaler bidirektionaler Synchronisierung** → `backend: "openshell"`

Und dann:

- **Nur Nicht-Hauptsitzungen sandboxen** → `mode: "non-main"`
- **Alles sandboxen** → `mode: "all"`
- **Eine Sandbox pro Sitzung** → `scope: "session"`
- **Eine Sandbox pro Agent** → `scope: "agent"`

## Beispiel: häufig empfohlene Standardkonfiguration

```json5
{
  agents: {
    defaults: {
      sandbox: {
        mode: "non-main",
        backend: "docker",
        scope: "session",
        workspaceAccess: "rw",
        docker: {
          image: "openclaw-sandbox:bookworm-slim",
          workdir: "/workspace",
          readOnlyRoot: true,
          tmpfs: ["/tmp", "/var/tmp", "/run"],
          network: "none",
          user: "1000:1000",
        },
      },
    },
  },
}
```

Dies bedeutet:

- Hauptsitzung läuft auf dem Host
- Nicht-Hauptsitzungen laufen in Docker-Sandboxes
- jede Sitzung erhält ihre eigene Sandbox
- der Workspace ist in der Sandbox schreibbar verfügbar

## Wichtige Einschränkungen

- Dies ist keine perfekte Sicherheitsgrenze.
- Browser-Sandboxing wird nur im Docker-Backend unterstützt.
- SSH und OpenShell `remote` machen den Remote-Workspace nach dem Seed kanonisch.
- Änderungen, die lokal außerhalb von OpenClaw vorgenommen werden, synchronisieren sich nicht automatisch in kanonische Remote-Workspaces.
- Docker-spezifische Optionen unter `sandbox.docker.*` gelten nur für das Docker-Backend.

## Verwandt

- [Elevated Mode](/de/tools/elevated)
- [OpenShell](/de/gateway/openshell)
- [Konfiguration](/de/gateway/configuration)
- [Agent-Workspace](/de/concepts/agent-workspace)

- Wenn die Sandbox erstmals erstellt wird, befüllt OpenClaw den Remote-Workspace einmal aus dem lokalen Workspace.
- Danach arbeiten `exec`, `read`, `write`, `edit` und `apply_patch` direkt gegen den Remote-OpenShell-Workspace.
- OpenClaw synchronisiert Änderungen aus dem Remote-Workspace nach `exec` **nicht** zurück in den lokalen Workspace.
- Medienzugriffe zur Prompt-Zeit funktionieren weiterhin, weil Datei- und Medientools über die Sandbox-Bridge lesen, statt einen lokalen Host-Pfad vorauszusetzen.
- Der Transport erfolgt per SSH in die OpenShell-Sandbox, die von `openshell sandbox ssh-config` zurückgegeben wird.

Wichtige Folgen:

- Wenn Sie nach dem Seed-Schritt Dateien auf dem Host außerhalb von OpenClaw bearbeiten, sieht die Remote-Sandbox diese Änderungen **nicht** automatisch.
- Wenn die Sandbox neu erstellt wird, wird der Remote-Workspace erneut aus dem lokalen Workspace befüllt.
- Bei `scope: "agent"` oder `scope: "shared"` wird dieser Remote-Workspace in genau diesem Scope gemeinsam genutzt.

Verwenden Sie dies, wenn:

- die Sandbox primär auf der Remote-OpenShell-Seite leben soll
- Sie geringeren Synchronisierungs-Overhead pro Turn möchten
- Sie nicht möchten, dass hostlokale Änderungen den Status der Remote-Sandbox stillschweigend überschreiben

Wählen Sie `mirror`, wenn Sie die Sandbox als temporäre Ausführungsumgebung betrachten.
Wählen Sie `remote`, wenn Sie die Sandbox als den echten Workspace betrachten.

#### OpenShell-Lebenszyklus

OpenShell-Sandboxes werden weiterhin über den normalen Sandbox-Lebenszyklus verwaltet:

- `openclaw sandbox list` zeigt OpenShell-Laufzeiten ebenso wie Docker-Laufzeiten
- `openclaw sandbox recreate` löscht die aktuelle Laufzeit und lässt OpenClaw sie bei der nächsten Verwendung neu erstellen
- die Bereinigungslogik ist ebenfalls backendbewusst

Für den Modus `remote` ist `recreate` besonders wichtig:

- `recreate` löscht den kanonischen Remote-Workspace für diesen Scope
- die nächste Verwendung befüllt einen frischen Remote-Workspace aus dem lokalen Workspace

Für den Modus `mirror` setzt `recreate` hauptsächlich die Remote-Ausführungsumgebung zurück,
weil der lokale Workspace ohnehin kanonisch bleibt.

## Workspace-Zugriff

`agents.defaults.sandbox.workspaceAccess` steuert, **was die Sandbox sehen kann**:

- `"none"` (Standard): Tools sehen einen Sandbox-Workspace unter `~/.openclaw/sandboxes`.
- `"ro"`: mountet den Agent-Workspace schreibgeschützt unter `/agent` (deaktiviert `write`/`edit`/`apply_patch`).
- `"rw"`: mountet den Agent-Workspace lesend/schreibend unter `/workspace`.

Mit dem OpenShell-Backend:

- der Modus `mirror` verwendet zwischen `exec`-Turns weiterhin den lokalen Workspace als kanonische Quelle
- der Modus `remote` verwendet nach dem initialen Seed den Remote-OpenShell-Workspace als kanonische Quelle
- `workspaceAccess: "ro"` und `"none"` beschränken das Schreibverhalten weiterhin auf dieselbe Weise

Eingehende Medien werden in den aktiven Sandbox-Workspace kopiert (`media/inbound/*`).
Hinweis zu Skills: Das Tool `read` ist auf die Sandbox-Wurzel beschränkt. Mit `workspaceAccess: "none"`
spiegelt OpenClaw geeignete Skills in den Sandbox-Workspace (`.../skills`), damit
sie gelesen werden können. Mit `"rw"` sind Workspace-Skills unter
`/workspace/skills` lesbar.

## Benutzerdefinierte Bind-Mounts

`agents.defaults.sandbox.docker.binds` mountet zusätzliche Host-Verzeichnisse in den Container.
Format: `host:container:mode` (z. B. `"/home/user/source:/source:rw"`).

Globale und agentenspezifische Binds werden **zusammengeführt** (nicht ersetzt). Unter `scope: "shared"` werden agentenspezifische Binds ignoriert.

`agents.defaults.sandbox.browser.binds` mountet zusätzliche Host-Verzeichnisse nur in den **Sandbox-Browser**-Container.

- Wenn gesetzt (einschließlich `[]`), ersetzt es `agents.defaults.sandbox.docker.binds` für den Browser-Container.
- Wenn weggelassen, fällt der Browser-Container auf `agents.defaults.sandbox.docker.binds` zurück (rückwärtskompatibel).

Beispiel (schreibgeschützte Quelle + ein zusätzliches Datenverzeichnis):

```json5
{
  agents: {
    defaults: {
      sandbox: {
        docker: {
          binds: ["/home/user/source:/source:ro", "/var/data/myapp:/data:ro"],
        },
      },
    },
    list: [
      {
        id: "build",
        sandbox: {
          docker: {
            binds: ["/mnt/cache:/cache:rw"],
          },
        },
      },
    ],
  },
}
```

Sicherheitshinweise:

- Binds umgehen das Sandbox-Dateisystem: Sie legen Host-Pfade mit dem jeweils gesetzten Modus offen (`:ro` oder `:rw`).
- OpenClaw blockiert gefährliche Bind-Quellen (zum Beispiel: `docker.sock`, `/etc`, `/proc`, `/sys`, `/dev` und übergeordnete Mounts, die diese freilegen würden).
- OpenClaw blockiert außerdem gängige Root-Verzeichnisse mit Anmeldedaten im Home-Verzeichnis wie `~/.aws`, `~/.cargo`, `~/.config`, `~/.docker`, `~/.gnupg`, `~/.netrc`, `~/.npm` und `~/.ssh`.
- Die Bind-Validierung ist nicht nur String-Matching. OpenClaw normalisiert den Quellpfad und löst ihn dann erneut über den tiefsten vorhandenen Vorfahren auf, bevor blockierte Pfade und zulässige Wurzeln erneut geprüft werden.
- Das bedeutet, dass Escapes über übergeordnete Symlinks weiterhin geschlossen fehlschlagen, selbst wenn das finale Blatt noch nicht existiert. Beispiel: `/workspace/run-link/new-file` wird weiterhin als `/var/run/...` aufgelöst, wenn `run-link` dorthin zeigt.
- Zulässige Quellwurzeln werden auf dieselbe Weise kanonisiert, sodass ein Pfad, der nur vor der Symlink-Auflösung innerhalb der Allowlist zu liegen scheint, weiterhin als `outside allowed roots` abgelehnt wird.
- Sensible Mounts (Secrets, SSH-Schlüssel, Service-Anmeldedaten) sollten `:ro` sein, sofern nicht unbedingt erforderlich.
- Kombinieren Sie dies mit `workspaceAccess: "ro"`, wenn Sie nur Lesezugriff auf den Workspace benötigen; Bind-Modi bleiben unabhängig.
- Siehe [Sandbox vs Tool Policy vs Elevated](/de/gateway/sandbox-vs-tool-policy-vs-elevated), um zu verstehen, wie Binds mit Tool-Richtlinie und erhöhtem Exec interagieren.

## Images + Einrichtung

Standard-Docker-Image: `openclaw-sandbox:bookworm-slim`

Einmal bauen:

```bash
scripts/sandbox-setup.sh
```

Hinweis: Das Standard-Image enthält **kein** Node. Wenn eine Skill Node (oder
andere Laufzeiten) benötigt, backen Sie entweder ein benutzerdefiniertes Image oder installieren Sie es über
`sandbox.docker.setupCommand` (erfordert Netzwerk-Egress + beschreibbare Root-Dateisysteme +
Root-Benutzer).

Wenn Sie ein funktionaleres Sandbox-Image mit gängigen Tools (zum Beispiel
`curl`, `jq`, `nodejs`, `python3`, `git`) möchten, bauen Sie:

```bash
scripts/sandbox-common-setup.sh
```

Setzen Sie dann `agents.defaults.sandbox.docker.image` auf
`openclaw-sandbox-common:bookworm-slim`.

Sandbox-Browser-Image:

```bash
scripts/sandbox-browser-setup.sh
```

Standardmäßig laufen Docker-Sandbox-Container **ohne Netzwerk**.
Überschreiben Sie dies mit `agents.defaults.sandbox.docker.network`.

Das gebündelte Sandbox-Browser-Image verwendet außerdem konservative Chromium-Startstandards
für containerisierte Workloads. Zu den aktuellen Container-Standards gehören:

- `--remote-debugging-address=127.0.0.1`
- `--remote-debugging-port=<derived from OPENCLAW_BROWSER_CDP_PORT>`
- `--user-data-dir=${HOME}/.chrome`
- `--no-first-run`
- `--no-default-browser-check`
- `--disable-3d-apis`
- `--disable-gpu`
- `--disable-dev-shm-usage`
- `--disable-background-networking`
- `--disable-extensions`
- `--disable-features=TranslateUI`
- `--disable-breakpad`
- `--disable-crash-reporter`
- `--disable-software-rasterizer`
- `--no-zygote`
- `--metrics-recording-only`
- `--renderer-process-limit=2`
- `--no-sandbox` und `--disable-setuid-sandbox`, wenn `noSandbox` aktiviert ist.
- Die drei Grafik-Hardening-Flags (`--disable-3d-apis`,
  `--disable-software-rasterizer`, `--disable-gpu`) sind optional und nützlich,
  wenn Container keine GPU-Unterstützung haben. Setzen Sie `OPENCLAW_BROWSER_DISABLE_GRAPHICS_FLAGS=0`,
  wenn Ihr Workload WebGL oder andere 3D-/Browser-Funktionen benötigt.
- `--disable-extensions` ist standardmäßig aktiviert und kann mit
  `OPENCLAW_BROWSER_DISABLE_EXTENSIONS=0` für Abläufe deaktiviert werden, die auf Erweiterungen angewiesen sind.
- `--renderer-process-limit=2` wird gesteuert durch
  `OPENCLAW_BROWSER_RENDERER_PROCESS_LIMIT=<N>`, wobei `0` die Chromium-Standardeinstellung beibehält.

Wenn Sie ein anderes Laufzeitprofil benötigen, verwenden Sie ein benutzerdefiniertes Browser-Image und stellen
Sie Ihren eigenen Entrypoint bereit. Für lokale (nicht containerisierte) Chromium-Profile verwenden Sie
`browser.extraArgs`, um zusätzliche Start-Flags anzuhängen.

Sicherheitsstandards:

- `network: "host"` ist blockiert.
- `network: "container:<id>"` ist standardmäßig blockiert (Risiko durch Namespace-Join-Umgehung).
- Break-Glass-Überschreibung: `agents.defaults.sandbox.docker.dangerouslyAllowContainerNamespaceJoin: true`.

Docker-Installationen und das containerisierte Gateway finden Sie hier:
[Docker](/de/install/docker)

Für Docker-Gateway-Bereitstellungen kann `scripts/docker/setup.sh` die Sandbox-Konfiguration bootstrappen.
Setzen Sie `OPENCLAW_SANDBOX=1` (oder `true`/`yes`/`on`), um diesen Pfad zu aktivieren. Sie können
den Socket-Speicherort mit `OPENCLAW_DOCKER_SOCKET` überschreiben. Vollständige Einrichtung und env-
Referenz: [Docker](/de/install/docker#agent-sandbox).

## setupCommand (einmalige Container-Einrichtung)

`setupCommand` läuft **einmal** nach dem Erstellen des Sandbox-Containers (nicht bei jedem Lauf).
Es wird innerhalb des Containers über `sh -lc` ausgeführt.

Pfade:

- Global: `agents.defaults.sandbox.docker.setupCommand`
- Pro Agent: `agents.list[].sandbox.docker.setupCommand`

Häufige Fallstricke:

- Standardmäßig ist `docker.network` auf `"none"` gesetzt (kein Egress), daher schlagen Paketinstallationen fehl.
- `docker.network: "container:<id>"` erfordert `dangerouslyAllowContainerNamespaceJoin: true` und ist nur als Break-Glass gedacht.
- `readOnlyRoot: true` verhindert Schreibvorgänge; setzen Sie `readOnlyRoot: false` oder backen Sie ein benutzerdefiniertes Image.
- `user` muss für Paketinstallationen Root sein (lassen Sie `user` weg oder setzen Sie `user: "0:0"`).
- Sandbox-Exec erbt **nicht** das Host-`process.env`. Verwenden Sie
  `agents.defaults.sandbox.docker.env` (oder ein benutzerdefiniertes Image) für API-Schlüssel von Skills.

## Tool-Richtlinie + Escape-Hatches

Tool-Allow-/Deny-Richtlinien gelten weiterhin vor Sandbox-Regeln. Wenn ein Tool global
oder pro Agent verweigert ist, bringt Sandboxing es nicht zurück.

`tools.elevated` ist ein expliziter Escape-Hatch, der `exec` außerhalb der Sandbox ausführt (`gateway` standardmäßig oder `node`, wenn das Exec-Ziel `node` ist).
Direktiven `/exec` gelten nur für autorisierte Absender und bleiben pro Sitzung bestehen; um
`exec` hart zu deaktivieren, verwenden Sie Deny in der Tool-Richtlinie (siehe [Sandbox vs Tool Policy vs Elevated](/de/gateway/sandbox-vs-tool-policy-vs-elevated)).

Debugging:

- Verwenden Sie `openclaw sandbox explain`, um den effektiven Sandbox-Modus, die Tool-Richtlinie und zugehörige Konfigurationsschlüssel zur Behebung zu prüfen.
- Siehe [Sandbox vs Tool Policy vs Elevated](/de/gateway/sandbox-vs-tool-policy-vs-elevated) für das Denkmodell „Warum ist das blockiert?“.
  Halten Sie es streng abgesichert.

## Überschreibungen für mehrere Agenten

Jeder Agent kann Sandbox + Tools überschreiben:
`agents.list[].sandbox` und `agents.list[].tools` (plus `agents.list[].tools.sandbox.tools` für die Sandbox-Tool-Richtlinie).
Siehe [Multi-Agent Sandbox & Tools](/de/tools/multi-agent-sandbox-tools) für Priorität.

## Minimales Aktivierungsbeispiel

```json5
{
  agents: {
    defaults: {
      sandbox: {
        mode: "non-main",
        scope: "session",
        workspaceAccess: "none",
      },
    },
  },
}
```

## Verwandte Dokumentation

- [OpenShell](/de/gateway/openshell) -- Einrichtung des verwalteten Sandbox-Backends, Workspace-Modi und Konfigurationsreferenz
- [Sandbox-Konfiguration](/de/gateway/config-agents#agentsdefaultssandbox)
- [Sandbox vs Tool Policy vs Elevated](/de/gateway/sandbox-vs-tool-policy-vs-elevated) -- Debugging von „Warum ist das blockiert?“
- [Multi-Agent Sandbox & Tools](/de/tools/multi-agent-sandbox-tools) -- Überschreibungen pro Agent und Priorität
- [Sicherheit](/de/gateway/security)
