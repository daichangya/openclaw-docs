---
read_when: You want a dedicated explanation of sandboxing or need to tune agents.defaults.sandbox.
status: active
summary: 'Wie Sandboxing in OpenClaw funktioniert: Modi, Geltungsbereiche, Workspace-Zugriff und Images'
title: Sandboxing
x-i18n:
    generated_at: "2026-04-05T12:44:23Z"
    model: gpt-5.4
    provider: openai
    source_hash: 756ebd5b9806c23ba720a311df7e3b4ffef6ce41ba4315ee4b36b5ea87b26e60
    source_path: gateway/sandboxing.md
    workflow: 15
---

# Sandboxing

OpenClaw kann **Tools innerhalb von Sandbox-Backends** ausführen, um den Wirkungsradius zu reduzieren.
Dies ist **optional** und wird über die Konfiguration gesteuert (`agents.defaults.sandbox` oder
`agents.list[].sandbox`). Wenn Sandboxing deaktiviert ist, laufen Tools auf dem Host.
Das Gateway bleibt auf dem Host; die Tool-Ausführung läuft in einer isolierten Sandbox,
wenn sie aktiviert ist.

Dies ist keine perfekte Sicherheitsgrenze, begrenzt aber den Zugriff auf Dateisystem
und Prozesse spürbar, wenn das Modell etwas Dummes tut.

## Was in die Sandbox kommt

- Tool-Ausführung (`exec`, `read`, `write`, `edit`, `apply_patch`, `process` usw.).
- Optionaler Browser in der Sandbox (`agents.defaults.sandbox.browser`).
  - Standardmäßig startet der Sandbox-Browser automatisch (stellt sicher, dass CDP erreichbar ist), wenn das Browser-Tool ihn benötigt.
    Konfiguration über `agents.defaults.sandbox.browser.autoStart` und `agents.defaults.sandbox.browser.autoStartTimeoutMs`.
  - Standardmäßig verwenden Sandbox-Browser-Container ein dediziertes Docker-Netzwerk (`openclaw-sandbox-browser`) statt des globalen `bridge`-Netzwerks.
    Konfiguration mit `agents.defaults.sandbox.browser.network`.
  - Optional begrenzt `agents.defaults.sandbox.browser.cdpSourceRange` eingehenden CDP-Verkehr am Containerrand mit einer CIDR-Allowlist (zum Beispiel `172.21.0.1/32`).
  - noVNC-Beobachterzugriff ist standardmäßig passwortgeschützt; OpenClaw gibt eine kurzlebige Token-URL aus, die eine lokale Bootstrap-Seite bereitstellt und noVNC mit Passwort im URL-Fragment öffnet (nicht in Query-/Header-Logs).
  - `agents.defaults.sandbox.browser.allowHostControl` erlaubt es Sitzungen in der Sandbox, explizit den Host-Browser anzusprechen.
  - Optionale Allowlists begrenzen `target: "custom"`: `allowedControlUrls`, `allowedControlHosts`, `allowedControlPorts`.

Nicht in der Sandbox:

- Der Gateway-Prozess selbst.
- Jedes Tool, das explizit außerhalb der Sandbox laufen darf (z. B. `tools.elevated`).
  - **Erhöhtes exec umgeht das Sandboxing und verwendet den konfigurierten Escape-Pfad (`gateway` standardmäßig oder `node`, wenn das exec-Ziel `node` ist).**
  - Wenn Sandboxing deaktiviert ist, ändert `tools.elevated` die Ausführung nicht (läuft bereits auf dem Host). Siehe [Elevated Mode](/tools/elevated).

## Modi

`agents.defaults.sandbox.mode` steuert, **wann** Sandboxing verwendet wird:

- `"off"`: kein Sandboxing.
- `"non-main"`: Sandbox nur für **Nicht-Haupt**-Sitzungen (Standard, wenn normale Chats auf dem Host laufen sollen).
- `"all"`: jede Sitzung läuft in einer Sandbox.
  Hinweis: `"non-main"` basiert auf `session.mainKey` (Standard `"main"`), nicht auf der Agent-ID.
  Gruppen-/Kanalsitzungen verwenden ihre eigenen Schlüssel, zählen also als Nicht-Haupt und werden in einer Sandbox ausgeführt.

## Geltungsbereich

`agents.defaults.sandbox.scope` steuert, **wie viele Container** erstellt werden:

- `"agent"` (Standard): ein Container pro Agent.
- `"session"`: ein Container pro Sitzung.
- `"shared"`: ein Container, den sich alle Sitzungen in der Sandbox teilen.

## Backend

`agents.defaults.sandbox.backend` steuert, **welche Laufzeit** die Sandbox bereitstellt:

- `"docker"` (Standard): lokale, Docker-gestützte Sandbox-Laufzeit.
- `"ssh"`: generische, SSH-gestützte entfernte Sandbox-Laufzeit.
- `"openshell"`: OpenShell-gestützte Sandbox-Laufzeit.

SSH-spezifische Konfiguration liegt unter `agents.defaults.sandbox.ssh`.
OpenShell-spezifische Konfiguration liegt unter `plugins.entries.openshell.config`.

### Auswahl eines Backends

|                     | Docker                           | SSH                             | OpenShell                                              |
| ------------------- | -------------------------------- | ------------------------------- | ------------------------------------------------------ |
| **Wo es läuft**     | Lokaler Container                | Jeder per SSH erreichbare Host  | Von OpenShell verwaltete Sandbox                       |
| **Einrichtung**     | `scripts/sandbox-setup.sh`       | SSH-Schlüssel + Zielhost        | OpenShell-Plugin aktiviert                             |
| **Workspace-Modell**| Bind-Mount oder Kopie            | Remote-kanonisch (einmal seeden) | `mirror` oder `remote`                                 |
| **Netzwerkkontrolle** | `docker.network` (Standard: none) | Hängt vom entfernten Host ab   | Hängt von OpenShell ab                                 |
| **Browser-Sandbox** | Unterstützt                      | Nicht unterstützt               | Noch nicht unterstützt                                 |
| **Bind-Mounts**     | `docker.binds`                   | N/V                             | N/V                                                    |
| **Am besten für**   | Lokale Entwicklung, volle Isolierung | Auslagerung auf einen Remote-Rechner | Verwaltete Remote-Sandboxes mit optionaler Zwei-Wege-Synchronisierung |

### SSH-Backend

Verwenden Sie `backend: "ssh"`, wenn OpenClaw `exec`, Datei-Tools und Medien-Lesevorgänge
auf einem beliebigen per SSH erreichbaren Rechner in einer Sandbox ausführen soll.

```json5
{
  agents: {
    defaults: {
      sandbox: {
        mode: "all",
        backend: "ssh",
        scope: "session",
        workspaceAccess: "rw",
        ssh: {
          target: "user@gateway-host:22",
          workspaceRoot: "/tmp/openclaw-sandboxes",
          strictHostKeyChecking: true,
          updateHostKeys: true,
          identityFile: "~/.ssh/id_ed25519",
          certificateFile: "~/.ssh/id_ed25519-cert.pub",
          knownHostsFile: "~/.ssh/known_hosts",
          // Oder SecretRefs / Inline-Inhalte statt lokaler Dateien verwenden:
          // identityData: { source: "env", provider: "default", id: "SSH_IDENTITY" },
          // certificateData: { source: "env", provider: "default", id: "SSH_CERTIFICATE" },
          // knownHostsData: { source: "env", provider: "default", id: "SSH_KNOWN_HOSTS" },
        },
      },
    },
  },
}
```

Funktionsweise:

- OpenClaw erstellt pro Geltungsbereich ein entferntes Stammverzeichnis unter `sandbox.ssh.workspaceRoot`.
- Bei der ersten Verwendung nach Erstellung oder Neuerstellung seedet OpenClaw diesen entfernten Workspace einmal aus dem lokalen Workspace.
- Danach laufen `exec`, `read`, `write`, `edit`, `apply_patch`, Prompt-Medien-Lesevorgänge und das Vorbereiten eingehender Medien direkt gegen den entfernten Workspace über SSH.
- OpenClaw synchronisiert entfernte Änderungen nicht automatisch zurück in den lokalen Workspace.

Authentifizierungsmaterial:

- `identityFile`, `certificateFile`, `knownHostsFile`: vorhandene lokale Dateien verwenden und über die OpenSSH-Konfiguration durchreichen.
- `identityData`, `certificateData`, `knownHostsData`: Inline-Strings oder SecretRefs verwenden. OpenClaw löst sie über den normalen Secrets-Laufzeit-Snapshot auf, schreibt sie mit `0600` in temporäre Dateien und löscht sie, wenn die SSH-Sitzung endet.
- Wenn für dasselbe Element sowohl `*File` als auch `*Data` gesetzt sind, hat `*Data` für diese SSH-Sitzung Vorrang.

Dies ist ein **remote-kanonisches** Modell. Der entfernte SSH-Workspace wird nach dem anfänglichen Seeden zum echten Zustand der Sandbox.

Wichtige Folgen:

- Host-lokale Änderungen, die außerhalb von OpenClaw nach dem Seeden vorgenommen werden, sind remote nicht sichtbar, bis Sie die Sandbox neu erstellen.
- `openclaw sandbox recreate` löscht das entfernte Stammverzeichnis pro Geltungsbereich und seedet es bei der nächsten Verwendung erneut aus dem Lokalen.
- Browser-Sandboxing wird im SSH-Backend nicht unterstützt.
- Einstellungen unter `sandbox.docker.*` gelten nicht für das SSH-Backend.

### OpenShell-Backend

Verwenden Sie `backend: "openshell"`, wenn OpenClaw Tools in einer
von OpenShell verwalteten Remote-Umgebung in einer Sandbox ausführen soll. Die vollständige Einrichtungsanleitung, die Konfigurations-
referenz und den Vergleich der Workspace-Modi finden Sie auf der dedizierten
[OpenShell-Seite](/gateway/openshell).

OpenShell verwendet denselben zentralen SSH-Transport und dieselbe Bridge für das entfernte Dateisystem wie das
generische SSH-Backend und ergänzt dies um OpenShell-spezifischen Lebenszyklus
(`sandbox create/get/delete`, `sandbox ssh-config`) sowie den optionalen `mirror`-
Workspace-Modus.

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
          mode: "remote", // mirror | remote
          remoteWorkspaceDir: "/sandbox",
          remoteAgentWorkspaceDir: "/agent",
        },
      },
    },
  },
}
```

OpenShell-Modi:

- `mirror` (Standard): Der lokale Workspace bleibt kanonisch. OpenClaw synchronisiert lokale Dateien vor `exec` in OpenShell und synchronisiert den entfernten Workspace nach `exec` zurück.
- `remote`: Der OpenShell-Workspace ist kanonisch, nachdem die Sandbox erstellt wurde. OpenClaw seedet den entfernten Workspace einmal aus dem lokalen Workspace, danach laufen Datei-Tools und `exec` direkt gegen die entfernte Sandbox, ohne Änderungen zurückzusynchronisieren.

Details zum Remote-Transport:

- OpenClaw fragt OpenShell nach Sandbox-spezifischer SSH-Konfiguration über `openshell sandbox ssh-config <name>`.
- Der Core schreibt diese SSH-Konfiguration in eine temporäre Datei, öffnet die SSH-Sitzung und verwendet dieselbe Bridge für das entfernte Dateisystem wieder, die auch von `backend: "ssh"` verwendet wird.
- Nur im Modus `mirror` unterscheidet sich der Lebenszyklus: vor `exec` lokal zu remote synchronisieren und danach zurück.

Aktuelle Einschränkungen von OpenShell:

- Sandbox-Browser wird noch nicht unterstützt
- `sandbox.docker.binds` wird im OpenShell-Backend nicht unterstützt
- Docker-spezifische Laufzeitoptionen unter `sandbox.docker.*` gelten weiterhin nur für das Docker-Backend

#### Workspace-Modi

OpenShell hat zwei Workspace-Modelle. Das ist der Teil, der in der Praxis am wichtigsten ist.

##### `mirror`

Verwenden Sie `plugins.entries.openshell.config.mode: "mirror"`, wenn der **lokale Workspace kanonisch bleiben** soll.

Verhalten:

- Vor `exec` synchronisiert OpenClaw den lokalen Workspace in die OpenShell-Sandbox.
- Nach `exec` synchronisiert OpenClaw den entfernten Workspace zurück in den lokalen Workspace.
- Datei-Tools arbeiten weiterhin über die Sandbox-Bridge, aber der lokale Workspace bleibt zwischen den Durchläufen die Quelle der Wahrheit.

Verwenden Sie dies, wenn:

- Sie Dateien lokal außerhalb von OpenClaw bearbeiten und möchten, dass diese Änderungen automatisch in der Sandbox erscheinen
- die OpenShell-Sandbox sich möglichst ähnlich wie das Docker-Backend verhalten soll
- der Host-Workspace Schreibvorgänge in der Sandbox nach jedem `exec`-Durchlauf widerspiegeln soll

Nachteil:

- zusätzlicher Synchronisierungsaufwand vor und nach `exec`

##### `remote`

Verwenden Sie `plugins.entries.openshell.config.mode: "remote"`, wenn der **OpenShell-Workspace kanonisch werden** soll.

Verhalten:

- Wenn die Sandbox zum ersten Mal erstellt wird, seedet OpenClaw den entfernten Workspace einmal aus dem lokalen Workspace.
- Danach arbeiten `exec`, `read`, `write`, `edit` und `apply_patch` direkt gegen den entfernten OpenShell-Workspace.
- OpenClaw synchronisiert entfernte Änderungen nach `exec` **nicht** zurück in den lokalen Workspace.
- Medien-Lesevorgänge zur Prompt-Zeit funktionieren weiterhin, weil Datei- und Medien-Tools über die Sandbox-Bridge lesen, statt von einem lokalen Host-Pfad auszugehen.
- Der Transport erfolgt per SSH in die OpenShell-Sandbox, die von `openshell sandbox ssh-config` zurückgegeben wird.

Wichtige Folgen:

- Wenn Sie Dateien nach dem Seeden auf dem Host außerhalb von OpenClaw bearbeiten, sieht die entfernte Sandbox diese Änderungen **nicht** automatisch.
- Wenn die Sandbox neu erstellt wird, wird der entfernte Workspace erneut aus dem lokalen Workspace geseedet.
- Mit `scope: "agent"` oder `scope: "shared"` wird dieser entfernte Workspace auf derselben Ebene geteilt.

Verwenden Sie dies, wenn:

- die Sandbox primär auf der entfernten OpenShell-Seite leben soll
- Sie geringeren Synchronisierungsaufwand pro Durchlauf möchten
- host-lokale Änderungen den Zustand der entfernten Sandbox nicht stillschweigend überschreiben sollen

Wählen Sie `mirror`, wenn Sie die Sandbox als temporäre Ausführungsumgebung betrachten.
Wählen Sie `remote`, wenn Sie die Sandbox als den echten Workspace betrachten.

#### OpenShell-Lebenszyklus

OpenShell-Sandboxes werden weiterhin über den normalen Sandbox-Lebenszyklus verwaltet:

- `openclaw sandbox list` zeigt OpenShell-Laufzeiten ebenso wie Docker-Laufzeiten an
- `openclaw sandbox recreate` löscht die aktuelle Laufzeit und lässt OpenClaw sie bei der nächsten Verwendung neu erstellen
- auch die Prune-Logik ist backendbewusst

Für den Modus `remote` ist `recreate` besonders wichtig:

- `recreate` löscht den kanonischen Remote-Workspace für diesen Geltungsbereich
- bei der nächsten Verwendung wird ein frischer Remote-Workspace aus dem lokalen Workspace geseedet

Für den Modus `mirror` setzt `recreate` hauptsächlich die entfernte Ausführungsumgebung zurück,
weil der lokale Workspace ohnehin kanonisch bleibt.

## Workspace-Zugriff

`agents.defaults.sandbox.workspaceAccess` steuert, **was die Sandbox sehen kann**:

- `"none"` (Standard): Tools sehen einen Sandbox-Workspace unter `~/.openclaw/sandboxes`.
- `"ro"`: bindet den Agent-Workspace read-only unter `/agent` ein (deaktiviert `write`/`edit`/`apply_patch`).
- `"rw"`: bindet den Agent-Workspace read/write unter `/workspace` ein.

Mit dem OpenShell-Backend:

- im Modus `mirror` bleibt der lokale Workspace zwischen `exec`-Durchläufen die kanonische Quelle
- im Modus `remote` ist der entfernte OpenShell-Workspace nach dem anfänglichen Seeden die kanonische Quelle
- `workspaceAccess: "ro"` und `"none"` beschränken das Schreibverhalten weiterhin auf dieselbe Weise

Eingehende Medien werden in den aktiven Sandbox-Workspace kopiert (`media/inbound/*`).
Hinweis zu Skills: Das Tool `read` ist auf die Sandbox-Wurzel bezogen. Mit `workspaceAccess: "none"`
spiegelt OpenClaw zulässige Skills in den Sandbox-Workspace (`.../skills`), sodass
sie gelesen werden können. Mit `"rw"` sind Workspace-Skills unter
`/workspace/skills` lesbar.

## Benutzerdefinierte Bind-Mounts

`agents.defaults.sandbox.docker.binds` bindet zusätzliche Host-Verzeichnisse in den Container ein.
Format: `host:container:mode` (z. B. `"/home/user/source:/source:rw"`).

Globale und agent-spezifische Bind-Mounts werden **zusammengeführt** (nicht ersetzt). Unter `scope: "shared"` werden agent-spezifische Bind-Mounts ignoriert.

`agents.defaults.sandbox.browser.binds` bindet zusätzliche Host-Verzeichnisse nur in den **Sandbox-Browser**-Container ein.

- Wenn gesetzt (einschließlich `[]`), ersetzt es `agents.defaults.sandbox.docker.binds` für den Browser-Container.
- Wenn weggelassen, verwendet der Browser-Container als Fallback `agents.defaults.sandbox.docker.binds` (rückwärtskompatibel).

Beispiel (Read-only-Quellverzeichnis + zusätzliches Datenverzeichnis):

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

- Bind-Mounts umgehen das Sandbox-Dateisystem: Sie legen Host-Pfade mit dem von Ihnen gesetzten Modus offen (`:ro` oder `:rw`).
- OpenClaw blockiert gefährliche Bind-Quellen (zum Beispiel: `docker.sock`, `/etc`, `/proc`, `/sys`, `/dev` und übergeordnete Mounts, die diese freilegen würden).
- OpenClaw blockiert auch gängige Wurzeln für Anmeldedaten im Home-Verzeichnis wie `~/.aws`, `~/.cargo`, `~/.config`, `~/.docker`, `~/.gnupg`, `~/.netrc`, `~/.npm` und `~/.ssh`.
- Die Validierung von Bind-Mounts ist nicht nur String-Matching. OpenClaw normalisiert den Quellpfad und löst ihn dann über den tiefsten vorhandenen Vorfahren erneut auf, bevor blockierte Pfade und erlaubte Wurzeln erneut geprüft werden.
- Das bedeutet, dass auch Escapes über symbolische Links mit übergeordnetem Verzeichnis fail-closed fehlschlagen, selbst wenn das endgültige Blatt noch nicht existiert. Beispiel: `/workspace/run-link/new-file` wird weiterhin als `/var/run/...` aufgelöst, wenn `run-link` dorthin zeigt.
- Erlaubte Quellwurzeln werden auf dieselbe Weise kanonisiert, sodass ein Pfad, der vor der Auflösung symbolischer Links nur scheinbar innerhalb der Allowlist liegt, dennoch als `outside allowed roots` abgelehnt wird.
- Sensitive Mounts (Secrets, SSH-Schlüssel, Service-Anmeldedaten) sollten `:ro` sein, sofern nicht absolut erforderlich.
- Kombinieren Sie dies mit `workspaceAccess: "ro"`, wenn Sie nur Lesezugriff auf den Workspace benötigen; Bind-Modi bleiben unabhängig.
- Siehe [Sandbox vs Tool Policy vs Elevated](/gateway/sandbox-vs-tool-policy-vs-elevated), um zu sehen, wie Bind-Mounts mit Tool-Richtlinien und erhöhtem exec interagieren.

## Images + Einrichtung

Standard-Docker-Image: `openclaw-sandbox:bookworm-slim`

Einmalig bauen:

```bash
scripts/sandbox-setup.sh
```

Hinweis: Das Standard-Image enthält **kein** Node. Wenn ein Skill Node (oder
andere Laufzeiten) benötigt, erstellen Sie entweder ein benutzerdefiniertes Image oder installieren es über
`sandbox.docker.setupCommand` (erfordert ausgehenden Netzwerkzugang + beschreibbare Root +
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
für containerisierte Workloads. Aktuelle Container-Standardwerte umfassen:

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
- Die drei Grafik-Härtungs-Flags (`--disable-3d-apis`,
  `--disable-software-rasterizer`, `--disable-gpu`) sind optional und nützlich,
  wenn Containern GPU-Unterstützung fehlt. Setzen Sie `OPENCLAW_BROWSER_DISABLE_GRAPHICS_FLAGS=0`,
  wenn Ihr Workload WebGL oder andere 3D-/Browser-Funktionen benötigt.
- `--disable-extensions` ist standardmäßig aktiviert und kann mit
  `OPENCLAW_BROWSER_DISABLE_EXTENSIONS=0` für ablaufspezifische Nutzung mit Erweiterungen deaktiviert werden.
- `--renderer-process-limit=2` wird über
  `OPENCLAW_BROWSER_RENDERER_PROCESS_LIMIT=<N>` gesteuert, wobei `0` den Chromium-Standard beibehält.

Wenn Sie ein anderes Laufzeitprofil benötigen, verwenden Sie ein benutzerdefiniertes Browser-Image und stellen
Ihren eigenen Entrypoint bereit. Für lokale (nicht containerisierte) Chromium-Profile verwenden Sie
`browser.extraArgs`, um zusätzliche Start-Flags anzuhängen.

Sicherheitsstandards:

- `network: "host"` wird blockiert.
- `network: "container:<id>"` wird standardmäßig blockiert (Umgehungsrisiko durch Namespace-Join).
- Break-glass-Überschreibung: `agents.defaults.sandbox.docker.dangerouslyAllowContainerNamespaceJoin: true`.

Docker-Installationen und das containerisierte Gateway finden Sie hier:
[Docker](/install/docker)

Für Docker-Gateway-Bereitstellungen kann `scripts/docker/setup.sh` die Sandbox-Konfiguration bootstrappen.
Setzen Sie `OPENCLAW_SANDBOX=1` (oder `true`/`yes`/`on`), um diesen Pfad zu aktivieren. Sie können
den Socket-Speicherort mit `OPENCLAW_DOCKER_SOCKET` überschreiben. Vollständige Einrichtung und env-
Referenz: [Docker](/install/docker#agent-sandbox).

## setupCommand (einmalige Container-Einrichtung)

`setupCommand` wird **einmal** ausgeführt, nachdem der Sandbox-Container erstellt wurde (nicht bei jedem Lauf).
Es wird im Container über `sh -lc` ausgeführt.

Pfade:

- Global: `agents.defaults.sandbox.docker.setupCommand`
- Pro Agent: `agents.list[].sandbox.docker.setupCommand`

Häufige Stolperfallen:

- Standard für `docker.network` ist `"none"` (kein ausgehender Verkehr), daher schlagen Paketinstallationen fehl.
- `docker.network: "container:<id>"` erfordert `dangerouslyAllowContainerNamespaceJoin: true` und ist nur für Break-glass gedacht.
- `readOnlyRoot: true` verhindert Schreibvorgänge; setzen Sie `readOnlyRoot: false` oder erstellen Sie ein benutzerdefiniertes Image.
- `user` muss Root für Paketinstallationen sein (lassen Sie `user` weg oder setzen Sie `user: "0:0"`).
- Sandbox-`exec` erbt **nicht** das Host-`process.env`. Verwenden Sie
  `agents.defaults.sandbox.docker.env` (oder ein benutzerdefiniertes Image) für API-Schlüssel von Skills.

## Tool-Richtlinie + Escape Hatches

Allow-/Deny-Richtlinien für Tools werden weiterhin vor Sandbox-Regeln angewendet. Wenn ein Tool
global oder pro Agent verweigert wird, bringt Sandboxing es nicht zurück.

`tools.elevated` ist ein expliziter Escape Hatch, der `exec` außerhalb der Sandbox ausführt (`gateway` standardmäßig oder `node`, wenn das exec-Ziel `node` ist).
`/exec`-Directives gelten nur für autorisierte Absender und bleiben pro Sitzung bestehen; um `exec` hart zu deaktivieren,
verwenden Sie eine deny-Regel in der Tool-Richtlinie (siehe [Sandbox vs Tool Policy vs Elevated](/gateway/sandbox-vs-tool-policy-vs-elevated)).

Debugging:

- Verwenden Sie `openclaw sandbox explain`, um den effektiven Sandbox-Modus, die Tool-Richtlinie und Konfigurationsschlüssel für die Fehlerbehebung zu prüfen.
- Siehe [Sandbox vs Tool Policy vs Elevated](/gateway/sandbox-vs-tool-policy-vs-elevated) für das mentale Modell „Warum ist das blockiert?“.
  Halten Sie es abgesichert.

## Überschreibungen für Multi-Agent

Jeder Agent kann Sandbox + Tools überschreiben:
`agents.list[].sandbox` und `agents.list[].tools` (plus `agents.list[].tools.sandbox.tools` für die Tool-Richtlinie der Sandbox).
Siehe [Multi-Agent Sandbox & Tools](/tools/multi-agent-sandbox-tools) für die Vorrangregeln.

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

- [OpenShell](/gateway/openshell) -- Einrichtung des verwalteten Sandbox-Backends, Workspace-Modi und Konfigurationsreferenz
- [Sandbox Configuration](/gateway/configuration-reference#agentsdefaultssandbox)
- [Sandbox vs Tool Policy vs Elevated](/gateway/sandbox-vs-tool-policy-vs-elevated) -- Debugging von „Warum ist das blockiert?“
- [Multi-Agent Sandbox & Tools](/tools/multi-agent-sandbox-tools) -- Überschreibungen pro Agent und Vorrang
- [Security](/gateway/security)
