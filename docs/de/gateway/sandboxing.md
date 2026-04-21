---
read_when: You want a dedicated explanation of sandboxing or need to tune agents.defaults.sandbox.
status: active
summary: 'Wie Sandboxing in OpenClaw funktioniert: Modi, Scopes, Workspace-Zugriff und Images'
title: Sandboxing
x-i18n:
    generated_at: "2026-04-21T06:25:36Z"
    model: gpt-5.4
    provider: openai
    source_hash: 35405c103f37f7f7247462ed5bc54a4b0d2a19ca2a373cf10f7f231a62c2c7c4
    source_path: gateway/sandboxing.md
    workflow: 15
---

# Sandboxing

OpenClaw kann **Tools in Sandbox-Backends ausführen**, um den Blast Radius zu verringern.
Dies ist **optional** und wird über die Konfiguration gesteuert (`agents.defaults.sandbox` oder
`agents.list[].sandbox`). Wenn Sandboxing deaktiviert ist, laufen Tools auf dem Host.
Das Gateway bleibt auf dem Host; die Tool-Ausführung läuft in einer isolierten Sandbox,
wenn dies aktiviert ist.

Das ist keine perfekte Sicherheitsgrenze, begrenzt aber den Zugriff auf Dateisystem
und Prozesse erheblich, wenn das Modell etwas Dummes tut.

## Was in eine Sandbox kommt

- Tool-Ausführung (`exec`, `read`, `write`, `edit`, `apply_patch`, `process` usw.).
- Optionaler sandboxierter Browser (`agents.defaults.sandbox.browser`).
  - Standardmäßig startet der Sandbox-Browser automatisch (stellt sicher, dass CDP erreichbar ist), wenn das Browser-Tool ihn benötigt.
    Konfiguration über `agents.defaults.sandbox.browser.autoStart` und `agents.defaults.sandbox.browser.autoStartTimeoutMs`.
  - Standardmäßig verwenden Sandbox-Browser-Container ein dediziertes Docker-Netzwerk (`openclaw-sandbox-browser`) statt des globalen `bridge`-Netzwerks.
    Konfiguration über `agents.defaults.sandbox.browser.network`.
  - Optionales `agents.defaults.sandbox.browser.cdpSourceRange` beschränkt eingehenden CDP-Zugriff am Container-Rand mit einer CIDR-Allowlist (zum Beispiel `172.21.0.1/32`).
  - noVNC-Beobachterzugriff ist standardmäßig passwortgeschützt; OpenClaw erzeugt eine kurzlebige Token-URL, die eine lokale Bootstrap-Seite bereitstellt und noVNC mit Passwort im URL-Fragment öffnet (nicht in Query-/Header-Logs).
  - `agents.defaults.sandbox.browser.allowHostControl` erlaubt es sandboxierten Sitzungen, ausdrücklich den Host-Browser anzusprechen.
  - Optionale Allowlists begrenzen `target: "custom"`: `allowedControlUrls`, `allowedControlHosts`, `allowedControlPorts`.

Nicht sandboxiert:

- Der Gateway-Prozess selbst.
- Jedes Tool, das ausdrücklich für die Ausführung außerhalb der Sandbox erlaubt ist (z. B. `tools.elevated`).
  - **Erhöhtes `exec` umgeht Sandboxing und verwendet den konfigurierten Escape-Pfad (`gateway` standardmäßig oder `node`, wenn das Exec-Ziel `node` ist).**
  - Wenn Sandboxing deaktiviert ist, ändert `tools.elevated` die Ausführung nicht (läuft bereits auf dem Host). Siehe [Elevated Mode](/de/tools/elevated).

## Modi

`agents.defaults.sandbox.mode` steuert, **wann** Sandboxing verwendet wird:

- `"off"`: kein Sandboxing.
- `"non-main"`: nur **Nicht-Main**-Sitzungen werden sandboxiert (Standard, wenn normale Chats auf dem Host laufen sollen).
- `"all"`: jede Sitzung läuft in einer Sandbox.
  Hinweis: `"non-main"` basiert auf `session.mainKey` (Standard `"main"`), nicht auf der Agent-ID.
  Gruppen-/Channel-Sitzungen verwenden ihre eigenen Schlüssel, zählen also als non-main und werden sandboxiert.

## Scope

`agents.defaults.sandbox.scope` steuert, **wie viele Container** erstellt werden:

- `"agent"` (Standard): ein Container pro Agent.
- `"session"`: ein Container pro Sitzung.
- `"shared"`: ein Container, der von allen sandboxierten Sitzungen gemeinsam genutzt wird.

## Backend

`agents.defaults.sandbox.backend` steuert, **welche Runtime** die Sandbox bereitstellt:

- `"docker"` (Standard, wenn Sandboxing aktiviert ist): lokale Docker-basierte Sandbox-Runtime.
- `"ssh"`: generische Remote-Sandbox-Runtime über SSH.
- `"openshell"`: OpenShell-basierte Sandbox-Runtime.

SSH-spezifische Konfiguration liegt unter `agents.defaults.sandbox.ssh`.
OpenShell-spezifische Konfiguration liegt unter `plugins.entries.openshell.config`.

### Backend auswählen

|                     | Docker                           | SSH                            | OpenShell                                                  |
| ------------------- | -------------------------------- | ------------------------------ | ---------------------------------------------------------- |
| **Wo es läuft**     | Lokaler Container                | Beliebiger per SSH erreichbarer Host | Von OpenShell verwaltete Sandbox                       |
| **Einrichtung**     | `scripts/sandbox-setup.sh`       | SSH-Schlüssel + Zielhost       | OpenShell-Plugin aktiviert                                 |
| **Workspace-Modell** | Bind-Mount oder Kopie           | Remote-kanonisch (einmalig seeden) | `mirror` oder `remote`                                  |
| **Netzwerkkontrolle** | `docker.network` (Standard: none) | Hängt vom Remote-Host ab      | Hängt von OpenShell ab                                     |
| **Browser-Sandbox** | Unterstützt                      | Nicht unterstützt              | Noch nicht unterstützt                                     |
| **Bind-Mounts**     | `docker.binds`                   | N/V                            | N/V                                                        |
| **Am besten für**   | Lokale Entwicklung, volle Isolation | Auslagerung auf eine Remote-Maschine | Verwaltete Remote-Sandboxes mit optionaler Zwei-Wege-Synchronisierung |

### Docker-Backend

Sandboxing ist standardmäßig deaktiviert. Wenn Sie Sandboxing aktivieren und kein
Backend wählen, verwendet OpenClaw das Docker-Backend. Es führt Tools und Sandbox-Browser
lokal über den Docker-Daemon-Socket (`/var/run/docker.sock`) aus. Die Isolation des Sandbox-Containers
wird durch Docker-Namespaces bestimmt.

**Docker-out-of-Docker-(DooD)-Einschränkungen**:
Wenn Sie das OpenClaw Gateway selbst als Docker-Container bereitstellen, orchestriert es Geschwister-Sandbox-Container über den Docker-Socket des Hosts (DooD). Das bringt eine spezielle Pfadzuordnungs-Einschränkung mit sich:

- **Konfiguration erfordert Host-Pfade**: Die `workspace`-Konfiguration in `openclaw.json` MUSS den **absoluten Pfad des Hosts** enthalten (z. B. `/home/user/.openclaw/workspaces`), nicht den internen Pfad des Gateway-Containers. Wenn OpenClaw den Docker-Daemon auffordert, eine Sandbox zu starten, wertet der Daemon Pfade relativ zum Namespace des Host-OS aus, nicht zum Gateway-Namespace.
- **FS-Bridge-Parität (identisches Volume-Mapping)**: Der native OpenClaw-Gateway-Prozess schreibt außerdem Heartbeat- und Bridge-Dateien in das Verzeichnis `workspace`. Da das Gateway exakt denselben String (den Host-Pfad) innerhalb seiner eigenen containerisierten Umgebung auswertet, MUSS die Gateway-Bereitstellung ein identisches Volume-Mapping enthalten, das den Host-Namespace nativ verknüpft (`-v /home/user/.openclaw:/home/user/.openclaw`).

Wenn Sie Pfade intern ohne absolute Host-Parität mappen, löst OpenClaw nativ einen `EACCES`-Berechtigungsfehler aus, wenn es versucht, seinen Heartbeat innerhalb der Container-Umgebung zu schreiben, weil der vollqualifizierte Pfad-String nativ nicht existiert.

### SSH-Backend

Verwenden Sie `backend: "ssh"`, wenn OpenClaw `exec`, Datei-Tools und Media-Reads auf
einer beliebigen per SSH erreichbaren Maschine sandboxieren soll.

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

So funktioniert es:

- OpenClaw erstellt unter `sandbox.ssh.workspaceRoot` ein Remote-Root pro Scope.
- Bei der ersten Verwendung nach Erstellung oder Neuerstellung seedet OpenClaw diesen Remote-Workspace einmalig aus dem lokalen Workspace.
- Danach laufen `exec`, `read`, `write`, `edit`, `apply_patch`, Media-Reads im Prompt und Inbound-Media-Staging direkt gegen den Remote-Workspace über SSH.
- OpenClaw synchronisiert Remote-Änderungen nicht automatisch zurück in den lokalen Workspace.

Authentifizierungsmaterial:

- `identityFile`, `certificateFile`, `knownHostsFile`: vorhandene lokale Dateien verwenden und über die OpenSSH-Konfiguration durchreichen.
- `identityData`, `certificateData`, `knownHostsData`: Inline-Strings oder SecretRefs verwenden. OpenClaw löst sie über den normalen Runtime-Snapshot für Secrets auf, schreibt sie mit `0600` in temporäre Dateien und löscht sie, wenn die SSH-Sitzung endet.
- Wenn für dasselbe Element sowohl `*File` als auch `*Data` gesetzt sind, gewinnt für diese SSH-Sitzung `*Data`.

Dies ist ein **remote-kanonisches** Modell. Der Remote-SSH-Workspace wird nach dem initialen Seed zum echten Sandbox-Zustand.

Wichtige Folgen:

- Host-lokale Bearbeitungen, die außerhalb von OpenClaw nach dem Seed-Schritt erfolgen, sind remote nicht sichtbar, bis Sie die Sandbox neu erstellen.
- `openclaw sandbox recreate` löscht das Remote-Root pro Scope und seedet es bei der nächsten Verwendung erneut aus lokal.
- Browser-Sandboxing wird im SSH-Backend nicht unterstützt.
- Einstellungen unter `sandbox.docker.*` gelten nicht für das SSH-Backend.

### OpenShell-Backend

Verwenden Sie `backend: "openshell"`, wenn OpenClaw Tools in einer
von OpenShell verwalteten Remote-Umgebung sandboxieren soll. Die vollständige Einrichtungsanleitung, die Konfigurationsreferenz
und den Vergleich der Workspace-Modi finden Sie auf der dedizierten
[OpenShell-Seite](/de/gateway/openshell).

OpenShell verwendet denselben zentralen SSH-Transport und dieselbe Remote-Dateisystem-Bridge wie das
generische SSH-Backend wieder und ergänzt OpenShell-spezifische Lebenszyklusbefehle
(`sandbox create/get/delete`, `sandbox ssh-config`) sowie den optionalen Workspace-Modus `mirror`.

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

- `mirror` (Standard): Der lokale Workspace bleibt kanonisch. OpenClaw synchronisiert lokale Dateien vor `exec` in OpenShell und synchronisiert den Remote-Workspace nach `exec` zurück.
- `remote`: Der OpenShell-Workspace ist nach Erstellung der Sandbox kanonisch. OpenClaw seedet den Remote-Workspace einmalig aus dem lokalen Workspace, danach laufen Datei-Tools und `exec` direkt gegen die Remote-Sandbox, ohne Änderungen zurückzusynchronisieren.

Details zum Remote-Transport:

- OpenClaw fordert bei OpenShell eine sandboxspezifische SSH-Konfiguration über `openshell sandbox ssh-config <name>` an.
- Der Core schreibt diese SSH-Konfiguration in eine temporäre Datei, öffnet die SSH-Sitzung und verwendet dieselbe Remote-Dateisystem-Bridge wie bei `backend: "ssh"` wieder.
- Nur im Modus `mirror` unterscheidet sich der Lebenszyklus: lokal nach remote vor `exec` synchronisieren, dann zurück synchronisieren.

Aktuelle Einschränkungen von OpenShell:

- Sandbox-Browser wird noch nicht unterstützt
- `sandbox.docker.binds` wird im OpenShell-Backend nicht unterstützt
- Docker-spezifische Runtime-Optionen unter `sandbox.docker.*` gelten weiterhin nur für das Docker-Backend

#### Workspace-Modi

OpenShell hat zwei Workspace-Modelle. Das ist in der Praxis der wichtigste Teil.

##### `mirror`

Verwenden Sie `plugins.entries.openshell.config.mode: "mirror"`, wenn der **lokale Workspace kanonisch bleiben** soll.

Verhalten:

- Vor `exec` synchronisiert OpenClaw den lokalen Workspace in die OpenShell-Sandbox.
- Nach `exec` synchronisiert OpenClaw den Remote-Workspace zurück in den lokalen Workspace.
- Datei-Tools arbeiten weiterhin über die Sandbox-Bridge, aber der lokale Workspace bleibt zwischen den Zügen die Single Source of Truth.

Verwenden Sie dies, wenn:

- Sie Dateien lokal außerhalb von OpenClaw bearbeiten und möchten, dass diese Änderungen automatisch in der Sandbox erscheinen
- die OpenShell-Sandbox sich möglichst ähnlich wie das Docker-Backend verhalten soll
- der Host-Workspace nach jedem `exec`-Zug die Schreibvorgänge der Sandbox widerspiegeln soll

Kompromiss:

- zusätzlicher Synchronisationsaufwand vor und nach `exec`

##### `remote`

Verwenden Sie `plugins.entries.openshell.config.mode: "remote"`, wenn der **OpenShell-Workspace kanonisch werden** soll.

Verhalten:

- Wenn die Sandbox zum ersten Mal erstellt wird, seedet OpenClaw den Remote-Workspace einmalig aus dem lokalen Workspace.
- Danach arbeiten `exec`, `read`, `write`, `edit` und `apply_patch` direkt gegen den Remote-OpenShell-Workspace.
- OpenClaw synchronisiert Remote-Änderungen nach `exec` **nicht** zurück in den lokalen Workspace.
- Media-Reads zur Prompt-Zeit funktionieren weiterhin, weil Datei- und Media-Tools über die Sandbox-Bridge lesen, statt einen lokalen Host-Pfad vorauszusetzen.
- Der Transport erfolgt per SSH in die OpenShell-Sandbox, die von `openshell sandbox ssh-config` zurückgegeben wird.

Wichtige Folgen:

- Wenn Sie Dateien auf dem Host außerhalb von OpenClaw nach dem Seed-Schritt bearbeiten, sieht die Remote-Sandbox diese Änderungen **nicht** automatisch.
- Wenn die Sandbox neu erstellt wird, wird der Remote-Workspace erneut aus dem lokalen Workspace geseedet.
- Bei `scope: "agent"` oder `scope: "shared"` wird dieser Remote-Workspace auf genau diesem Scope gemeinsam genutzt.

Verwenden Sie dies, wenn:

- die Sandbox primär auf der Remote-Seite von OpenShell leben soll
- Sie geringeren Synchronisations-Overhead pro Zug möchten
- host-lokale Bearbeitungen den Remote-Sandbox-Zustand nicht stillschweigend überschreiben sollen

Wählen Sie `mirror`, wenn Sie die Sandbox als temporäre Ausführungsumgebung betrachten.
Wählen Sie `remote`, wenn Sie die Sandbox als den echten Workspace betrachten.

#### OpenShell-Lebenszyklus

OpenShell-Sandboxes werden weiterhin über den normalen Sandbox-Lebenszyklus verwaltet:

- `openclaw sandbox list` zeigt OpenShell-Runtimes ebenso wie Docker-Runtimes an
- `openclaw sandbox recreate` löscht die aktuelle Runtime und lässt OpenClaw sie bei der nächsten Verwendung neu erstellen
- die Prune-Logik ist ebenfalls backendbewusst

Für den Modus `remote` ist `recreate` besonders wichtig:

- `recreate` löscht den kanonischen Remote-Workspace für diesen Scope
- die nächste Verwendung seedet einen frischen Remote-Workspace aus dem lokalen Workspace

Für den Modus `mirror` setzt `recreate` hauptsächlich die Remote-Ausführungsumgebung zurück,
da der lokale Workspace ohnehin kanonisch bleibt.

## Workspace-Zugriff

`agents.defaults.sandbox.workspaceAccess` steuert, **was die Sandbox sehen kann**:

- `"none"` (Standard): Tools sehen einen Sandbox-Workspace unter `~/.openclaw/sandboxes`.
- `"ro"`: mountet den Agent-Workspace schreibgeschützt unter `/agent` (deaktiviert `write`/`edit`/`apply_patch`).
- `"rw"`: mountet den Agent-Workspace mit Lese-/Schreibzugriff unter `/workspace`.

Mit dem OpenShell-Backend:

- Im Modus `mirror` bleibt der lokale Workspace zwischen den `exec`-Zügen die kanonische Quelle
- Im Modus `remote` wird der Remote-OpenShell-Workspace nach dem initialen Seed zur kanonischen Quelle
- `workspaceAccess: "ro"` und `"none"` beschränken das Schreibverhalten weiterhin auf dieselbe Weise

Eingehende Medien werden in den aktiven Sandbox-Workspace kopiert (`media/inbound/*`).
Hinweis zu Skills: Das Tool `read` ist auf die Sandbox-Root beschränkt. Mit `workspaceAccess: "none"`
spiegelt OpenClaw geeignete Skills in den Sandbox-Workspace (`.../skills`), damit
sie gelesen werden können. Mit `"rw"` sind Workspace-Skills unter
`/workspace/skills` lesbar.

## Benutzerdefinierte Bind-Mounts

`agents.defaults.sandbox.docker.binds` mountet zusätzliche Host-Verzeichnisse in den Container.
Format: `host:container:mode` (z. B. `"/home/user/source:/source:rw"`).

Globale und agent-spezifische Binds werden **zusammengeführt** (nicht ersetzt). Unter `scope: "shared"` werden agent-spezifische Binds ignoriert.

`agents.defaults.sandbox.browser.binds` mountet zusätzliche Host-Verzeichnisse nur in den **Sandbox-Browser**-Container.

- Wenn gesetzt (einschließlich `[]`), ersetzt es `agents.defaults.sandbox.docker.binds` für den Browser-Container.
- Wenn weggelassen, verwendet der Browser-Container als Fallback `agents.defaults.sandbox.docker.binds` (abwärtskompatibel).

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

- Binds umgehen das Sandbox-Dateisystem: Sie legen Host-Pfade mit dem von Ihnen gesetzten Modus offen (`:ro` oder `:rw`).
- OpenClaw blockiert gefährliche Bind-Quellen (zum Beispiel: `docker.sock`, `/etc`, `/proc`, `/sys`, `/dev` und übergeordnete Mounts, die diese freilegen würden).
- OpenClaw blockiert außerdem gängige Root-Verzeichnisse für Credentials im Home-Verzeichnis wie `~/.aws`, `~/.cargo`, `~/.config`, `~/.docker`, `~/.gnupg`, `~/.netrc`, `~/.npm` und `~/.ssh`.
- Die Bind-Validierung ist nicht nur String-Matching. OpenClaw normalisiert den Quellpfad und löst ihn dann erneut über den tiefsten vorhandenen Vorgänger auf, bevor blockierte Pfade und erlaubte Roots erneut geprüft werden.
- Das bedeutet, dass auch Escapes über Symlink-Eltern fail-closed bleiben, selbst wenn das endgültige Leaf noch nicht existiert. Beispiel: `/workspace/run-link/new-file` wird weiterhin als `/var/run/...` aufgelöst, wenn `run-link` dorthin zeigt.
- Erlaubte Quell-Roots werden auf dieselbe Weise kanonisiert, sodass ein Pfad, der nur vor der Symlink-Auflösung so aussieht, als läge er in der Allowlist, dennoch als `outside allowed roots` abgelehnt wird.
- Sensitive Mounts (Secrets, SSH-Schlüssel, Service-Credentials) sollten `:ro` sein, sofern es nicht absolut erforderlich ist.
- Kombinieren Sie dies mit `workspaceAccess: "ro"`, wenn Sie nur Lesezugriff auf den Workspace benötigen; die Bind-Modi bleiben unabhängig.
- Siehe [Sandbox vs Tool Policy vs Elevated](/de/gateway/sandbox-vs-tool-policy-vs-elevated), wie Binds mit Tool-Richtlinien und erhöhtem `exec` interagieren.

## Images + Einrichtung

Standard-Docker-Image: `openclaw-sandbox:bookworm-slim`

Einmal bauen:

```bash
scripts/sandbox-setup.sh
```

Hinweis: Das Standard-Image enthält **kein** Node. Wenn ein Skill Node (oder
andere Runtimes) benötigt, erstellen Sie entweder ein benutzerdefiniertes Image oder installieren Sie es über
`sandbox.docker.setupCommand` (erfordert Network Egress + beschreibbare Root +
Root-Benutzer).

Wenn Sie ein funktionaleres Sandbox-Image mit gängigen Tools möchten (zum Beispiel
`curl`, `jq`, `nodejs`, `python3`, `git`), bauen Sie:

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

Das gebündelte Sandbox-Browser-Image wendet außerdem konservative Standardwerte für den Chromium-Start
bei containerisierten Workloads an. Aktuelle Container-Standards umfassen:

- `--remote-debugging-address=127.0.0.1`
- `--remote-debugging-port=<abgeleitet von OPENCLAW_BROWSER_CDP_PORT>`
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
- Die drei Flags zur Härtung der Grafik (`--disable-3d-apis`,
  `--disable-software-rasterizer`, `--disable-gpu`) sind optional und nützlich,
  wenn Container keine GPU-Unterstützung haben. Setzen Sie `OPENCLAW_BROWSER_DISABLE_GRAPHICS_FLAGS=0`,
  wenn Ihr Workload WebGL oder andere 3D-/Browser-Funktionen benötigt.
- `--disable-extensions` ist standardmäßig aktiviert und kann mit
  `OPENCLAW_BROWSER_DISABLE_EXTENSIONS=0` für von Extensions abhängige Abläufe deaktiviert werden.
- `--renderer-process-limit=2` wird über
  `OPENCLAW_BROWSER_RENDERER_PROCESS_LIMIT=<N>` gesteuert, wobei `0` den Standard von Chromium beibehält.

Wenn Sie ein anderes Runtime-Profil benötigen, verwenden Sie ein benutzerdefiniertes Browser-Image und stellen
Ihren eigenen Entrypoint bereit. Für lokale Chromium-Profile (nicht containerisiert) verwenden Sie
`browser.extraArgs`, um zusätzliche Start-Flags anzuhängen.

Sicherheitsstandards:

- `network: "host"` ist blockiert.
- `network: "container:<id>"` ist standardmäßig blockiert (Risiko durch Umgehung via Namespace-Join).
- Break-glass-Override: `agents.defaults.sandbox.docker.dangerouslyAllowContainerNamespaceJoin: true`.

Docker-Installationen und das containerisierte Gateway finden Sie hier:
[Docker](/de/install/docker)

Für Gateway-Bereitstellungen mit Docker kann `scripts/docker/setup.sh` die Sandbox-Konfiguration bootstrappen.
Setzen Sie `OPENCLAW_SANDBOX=1` (oder `true`/`yes`/`on`), um diesen Pfad zu aktivieren. Sie können
den Socket-Speicherort mit `OPENCLAW_DOCKER_SOCKET` überschreiben. Vollständige Einrichtung und Env-
Referenz: [Docker](/de/install/docker#agent-sandbox).

## setupCommand (einmalige Container-Einrichtung)

`setupCommand` läuft **einmal** nach der Erstellung des Sandbox-Containers (nicht bei jedem Lauf).
Es wird innerhalb des Containers über `sh -lc` ausgeführt.

Pfade:

- Global: `agents.defaults.sandbox.docker.setupCommand`
- Pro Agent: `agents.list[].sandbox.docker.setupCommand`

Häufige Fallstricke:

- Standard `docker.network` ist `"none"` (kein Egress), daher schlagen Paketinstallationen fehl.
- `docker.network: "container:<id>"` erfordert `dangerouslyAllowContainerNamespaceJoin: true` und ist nur als Break-glass gedacht.
- `readOnlyRoot: true` verhindert Schreibvorgänge; setzen Sie `readOnlyRoot: false` oder erstellen Sie ein benutzerdefiniertes Image.
- `user` muss für Paketinstallationen root sein (lassen Sie `user` weg oder setzen Sie `user: "0:0"`).
- Sandbox-`exec` erbt **nicht** das Host-`process.env`. Verwenden Sie
  `agents.defaults.sandbox.docker.env` (oder ein benutzerdefiniertes Image) für API-Schlüssel von Skills.

## Tool-Richtlinien + Escape-Hatches

Allow-/Deny-Richtlinien für Tools gelten weiterhin vor den Sandbox-Regeln. Wenn ein Tool
global oder pro Agent verweigert wird, bringt Sandboxing es nicht zurück.

`tools.elevated` ist ein ausdrücklicher Escape Hatch, der `exec` außerhalb der Sandbox ausführt (`gateway` standardmäßig oder `node`, wenn das Exec-Ziel `node` ist).
Direktiven für `/exec` gelten nur für autorisierte Absender und bleiben pro Sitzung erhalten; um `exec` hart zu deaktivieren,
verwenden Sie eine Deny-Regel in der Tool-Richtlinie (siehe [Sandbox vs Tool Policy vs Elevated](/de/gateway/sandbox-vs-tool-policy-vs-elevated)).

Debugging:

- Verwenden Sie `openclaw sandbox explain`, um den effektiven Sandbox-Modus, die Tool-Richtlinie und Konfigurationsschlüssel zur Behebung zu prüfen.
- Siehe [Sandbox vs Tool Policy vs Elevated](/de/gateway/sandbox-vs-tool-policy-vs-elevated) für das mentale Modell zu „warum ist das blockiert?“.
  Halten Sie es restriktiv.

## Multi-Agent-Overrides

Jeder Agent kann Sandbox + Tools überschreiben:
`agents.list[].sandbox` und `agents.list[].tools` (plus `agents.list[].tools.sandbox.tools` für die Tool-Richtlinie in der Sandbox).
Siehe [Multi-Agent Sandbox & Tools](/de/tools/multi-agent-sandbox-tools) für die Priorität.

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

## Verwandte Dokumente

- [OpenShell](/de/gateway/openshell) -- Einrichtung des verwalteten Sandbox-Backends, Workspace-Modi und Konfigurationsreferenz
- [Sandbox Configuration](/de/gateway/configuration-reference#agentsdefaultssandbox)
- [Sandbox vs Tool Policy vs Elevated](/de/gateway/sandbox-vs-tool-policy-vs-elevated) -- Debugging von „warum ist das blockiert?“
- [Multi-Agent Sandbox & Tools](/de/tools/multi-agent-sandbox-tools) -- Overrides pro Agent und Priorität
- [Security](/de/gateway/security)
