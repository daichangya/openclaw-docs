---
read_when:
    - Sie möchten ein containerisiertes Gateway statt lokaler Installationen
    - Sie validieren den Docker-Ablauf
summary: Optionale Docker-basierte Einrichtung und Onboarding für OpenClaw
title: Docker
x-i18n:
    generated_at: "2026-04-05T12:46:19Z"
    model: gpt-5.4
    provider: openai
    source_hash: 4628362d52597f85e72c214efe96b2923c7a59a8592b3044dc8c230318c515b8
    source_path: install/docker.md
    workflow: 15
---

# Docker (optional)

Docker ist **optional**. Verwenden Sie es nur, wenn Sie ein containerisiertes Gateway möchten oder den Docker-Ablauf validieren wollen.

## Ist Docker das Richtige für mich?

- **Ja**: Sie möchten eine isolierte, wegwerfbare Gateway-Umgebung oder OpenClaw auf einem Host ohne lokale Installationen ausführen.
- **Nein**: Sie arbeiten auf Ihrer eigenen Maschine und möchten einfach den schnellsten Dev-Loop. Verwenden Sie stattdessen den normalen Installationsablauf.
- **Hinweis zu Sandboxing**: Agent-Sandboxing verwendet ebenfalls Docker, aber dafür muss **nicht** das gesamte Gateway in Docker laufen. Siehe [Sandboxing](/gateway/sandboxing).

## Voraussetzungen

- Docker Desktop (oder Docker Engine) + Docker Compose v2
- Mindestens 2 GB RAM für den Image-Build (`pnpm install` kann auf Hosts mit 1 GB mit Exit 137 durch OOM beendet werden)
- Genügend Speicherplatz für Images und Logs
- Wenn Sie auf einem VPS/öffentlichen Host arbeiten, lesen Sie
  [Security-Härtung für Netzwerkexponierung](/gateway/security),
  insbesondere die Docker-Firewall-Richtlinie `DOCKER-USER`.

## Containerisiertes Gateway

<Steps>
  <Step title="Das Image bauen">
    Führen Sie aus dem Repo-Root das Setup-Skript aus:

    ```bash
    ./scripts/docker/setup.sh
    ```

    Dadurch wird das Gateway-Image lokal gebaut. Wenn Sie stattdessen ein vorgefertigtes Image verwenden möchten:

    ```bash
    export OPENCLAW_IMAGE="ghcr.io/openclaw/openclaw:latest"
    ./scripts/docker/setup.sh
    ```

    Vorgefertigte Images werden in der
    [GitHub Container Registry](https://github.com/openclaw/openclaw/pkgs/container/openclaw) veröffentlicht.
    Gängige Tags: `main`, `latest`, `<version>` (z. B. `2026.2.26`).

  </Step>

  <Step title="Onboarding abschließen">
    Das Setup-Skript führt das Onboarding automatisch aus. Es wird:

    - nach API-Schlüsseln für Provider fragen
    - ein Gateway-Token erzeugen und in `.env` schreiben
    - das Gateway über Docker Compose starten

    Während der Einrichtung laufen Onboarding vor dem Start und Konfigurationsschreibvorgänge direkt über
    `openclaw-gateway`. `openclaw-cli` ist für Befehle gedacht, die Sie ausführen, nachdem
    der Gateway-Container bereits existiert.

  </Step>

  <Step title="Die Control UI öffnen">
    Öffnen Sie `http://127.0.0.1:18789/` in Ihrem Browser und fügen Sie das konfigurierte
    gemeinsame Secret in die Einstellungen ein. Das Setup-Skript schreibt standardmäßig ein Token in `.env`; wenn Sie die Container-Konfiguration auf Passwort-Auth umstellen, verwenden Sie stattdessen dieses
    Passwort.

    Benötigen Sie die URL erneut?

    ```bash
    docker compose run --rm openclaw-cli dashboard --no-open
    ```

  </Step>

  <Step title="Channels konfigurieren (optional)">
    Verwenden Sie den CLI-Container, um Messaging-Channels hinzuzufügen:

    ```bash
    # WhatsApp (QR)
    docker compose run --rm openclaw-cli channels login

    # Telegram
    docker compose run --rm openclaw-cli channels add --channel telegram --token "<token>"

    # Discord
    docker compose run --rm openclaw-cli channels add --channel discord --token "<token>"
    ```

    Dokumentation: [WhatsApp](/channels/whatsapp), [Telegram](/channels/telegram), [Discord](/channels/discord)

  </Step>
</Steps>

### Manueller Ablauf

Wenn Sie lieber jeden Schritt selbst ausführen möchten, statt das Setup-Skript zu verwenden:

```bash
docker build -t openclaw:local -f Dockerfile .
docker compose run --rm --no-deps --entrypoint node openclaw-gateway \
  dist/index.js onboard --mode local --no-install-daemon
docker compose run --rm --no-deps --entrypoint node openclaw-gateway \
  dist/index.js config set gateway.mode local
docker compose run --rm --no-deps --entrypoint node openclaw-gateway \
  dist/index.js config set gateway.bind lan
docker compose run --rm --no-deps --entrypoint node openclaw-gateway \
  dist/index.js config set gateway.controlUi.allowedOrigins \
  '["http://localhost:18789","http://127.0.0.1:18789"]' --strict-json
docker compose up -d openclaw-gateway
```

<Note>
Führen Sie `docker compose` aus dem Repo-Root aus. Wenn Sie `OPENCLAW_EXTRA_MOUNTS`
oder `OPENCLAW_HOME_VOLUME` aktiviert haben, schreibt das Setup-Skript `docker-compose.extra.yml`;
binden Sie es mit `-f docker-compose.yml -f docker-compose.extra.yml` ein.
</Note>

<Note>
Da `openclaw-cli` den Netzwerk-Namespace von `openclaw-gateway` teilt, ist es ein
Tool für nach dem Start. Vor `docker compose up -d openclaw-gateway` führen Sie Onboarding
und Konfigurationsschreibvorgänge zur Setup-Zeit über `openclaw-gateway` mit
`--no-deps --entrypoint node` aus.
</Note>

### Umgebungsvariablen

Das Setup-Skript akzeptiert diese optionalen Umgebungsvariablen:

| Variable                       | Zweck                                                            |
| ------------------------------ | ---------------------------------------------------------------- |
| `OPENCLAW_IMAGE`               | Ein Remote-Image verwenden, statt lokal zu bauen                 |
| `OPENCLAW_DOCKER_APT_PACKAGES` | Zusätzliche apt-Pakete beim Build installieren (durch Leerzeichen getrennt) |
| `OPENCLAW_EXTENSIONS`          | Erweiterungsabhängigkeiten beim Build vorinstallieren (Namen durch Leerzeichen getrennt) |
| `OPENCLAW_EXTRA_MOUNTS`        | Zusätzliche Host-Bind-Mounts (kommagetrennt `source:target[:opts]`) |
| `OPENCLAW_HOME_VOLUME`         | `/home/node` in einem benannten Docker-Volume persistieren       |
| `OPENCLAW_SANDBOX`             | Für Sandbox-Bootstrap opt-in (`1`, `true`, `yes`, `on`)          |
| `OPENCLAW_DOCKER_SOCKET`       | Docker-Socket-Pfad überschreiben                                 |

### Health-Checks

Container-Probe-Endpunkte (keine Auth erforderlich):

```bash
curl -fsS http://127.0.0.1:18789/healthz   # Liveness
curl -fsS http://127.0.0.1:18789/readyz     # Readiness
```

Das Docker-Image enthält einen integrierten `HEALTHCHECK`, der `/healthz` abfragt.
Wenn Prüfungen weiterhin fehlschlagen, markiert Docker den Container als `unhealthy`, und
Orchestrierungssysteme können ihn neu starten oder ersetzen.

Authentifizierter tiefer Health-Snapshot:

```bash
docker compose exec openclaw-gateway node dist/index.js health --token "$OPENCLAW_GATEWAY_TOKEN"
```

### LAN vs. loopback

`scripts/docker/setup.sh` setzt standardmäßig `OPENCLAW_GATEWAY_BIND=lan`, damit Host-Zugriff auf
`http://127.0.0.1:18789` mit Docker-Portfreigabe funktioniert.

- `lan` (Standard): Host-Browser und Host-CLI können den veröffentlichten Gateway-Port erreichen.
- `loopback`: Nur Prozesse innerhalb des Container-Netzwerk-Namespace können
  das Gateway direkt erreichen.

<Note>
Verwenden Sie Bind-Modus-Werte in `gateway.bind` (`lan` / `loopback` / `custom` /
`tailnet` / `auto`), nicht Host-Aliasse wie `0.0.0.0` oder `127.0.0.1`.
</Note>

### Speicherung und Persistenz

Docker Compose bind-mountet `OPENCLAW_CONFIG_DIR` nach `/home/node/.openclaw` und
`OPENCLAW_WORKSPACE_DIR` nach `/home/node/.openclaw/workspace`, sodass diese Pfade
einen Containeraustausch überstehen.

In diesem gemounteten Konfigurationsverzeichnis speichert OpenClaw:

- `openclaw.json` für Verhaltenskonfiguration
- `agents/<agentId>/agent/auth-profiles.json` für gespeicherte Provider-OAuth-/API-Key-Authentifizierung
- `.env` für env-basierte Laufzeit-Secrets wie `OPENCLAW_GATEWAY_TOKEN`

Vollständige Details zur Persistenz bei VM-Bereitstellungen finden Sie unter
[Docker VM Runtime - What persists where](/install/docker-vm-runtime#what-persists-where).

**Hotspots für Speicherwachstum:** Achten Sie auf `media/`, Sitzungs-JSONL-Dateien, `cron/runs/*.jsonl`
und rotierende Dateilogs unter `/tmp/openclaw/`.

### Shell-Helper (optional)

Für einfacheres tägliches Docker-Management installieren Sie `ClawDock`:

```bash
mkdir -p ~/.clawdock && curl -sL https://raw.githubusercontent.com/openclaw/openclaw/main/scripts/clawdock/clawdock-helpers.sh -o ~/.clawdock/clawdock-helpers.sh
echo 'source ~/.clawdock/clawdock-helpers.sh' >> ~/.zshrc && source ~/.zshrc
```

Wenn Sie ClawDock über den älteren Raw-Pfad `scripts/shell-helpers/clawdock-helpers.sh` installiert haben, führen Sie den obigen Installationsbefehl erneut aus, damit Ihre lokale Helper-Datei den neuen Speicherort verfolgt.

Verwenden Sie dann `clawdock-start`, `clawdock-stop`, `clawdock-dashboard` usw. Führen Sie
`clawdock-help` aus, um alle Befehle anzuzeigen.
Siehe [ClawDock](/install/clawdock) für die vollständige Helper-Anleitung.

<AccordionGroup>
  <Accordion title="Agent-Sandbox für Docker-Gateway aktivieren">
    ```bash
    export OPENCLAW_SANDBOX=1
    ./scripts/docker/setup.sh
    ```

    Benutzerdefinierter Socket-Pfad (z. B. rootless Docker):

    ```bash
    export OPENCLAW_SANDBOX=1
    export OPENCLAW_DOCKER_SOCKET=/run/user/1000/docker.sock
    ./scripts/docker/setup.sh
    ```

    Das Skript mountet `docker.sock` erst, nachdem die Sandbox-Voraussetzungen erfüllt sind. Wenn
    das Sandbox-Setup nicht abgeschlossen werden kann, setzt das Skript `agents.defaults.sandbox.mode`
    auf `off` zurück.

  </Accordion>

  <Accordion title="Automatisierung / CI (nicht interaktiv)">
    Deaktivieren Sie die Zuweisung einer Compose-Pseudo-TTY mit `-T`:

    ```bash
    docker compose run -T --rm openclaw-cli gateway probe
    docker compose run -T --rm openclaw-cli devices list --json
    ```

  </Accordion>

  <Accordion title="Sicherheitshinweis zu gemeinsamem Netzwerk">
    `openclaw-cli` verwendet `network_mode: "service:openclaw-gateway"`, sodass CLI-
    Befehle das Gateway über `127.0.0.1` erreichen können. Behandeln Sie dies als gemeinsame
    Vertrauensgrenze. Die Compose-Konfiguration entfernt `NET_RAW`/`NET_ADMIN` und aktiviert
    `no-new-privileges` auf `openclaw-cli`.
  </Accordion>

  <Accordion title="Berechtigungen und EACCES">
    Das Image läuft als `node` (uid 1000). Wenn Sie Berechtigungsfehler auf
    `/home/node/.openclaw` sehen, stellen Sie sicher, dass Ihre Host-Bind-Mounts uid 1000 gehören:

    ```bash
    sudo chown -R 1000:1000 /path/to/openclaw-config /path/to/openclaw-workspace
    ```

  </Accordion>

  <Accordion title="Schnellere Rebuilds">
    Ordnen Sie Ihr Dockerfile so an, dass Abhängigkeits-Layer gecacht werden. Dadurch vermeiden Sie ein erneutes Ausführen von
    `pnpm install`, solange sich Lockfiles nicht ändern:

    ```dockerfile
    FROM node:24-bookworm
    RUN curl -fsSL https://bun.sh/install | bash
    ENV PATH="/root/.bun/bin:${PATH}"
    RUN corepack enable
    WORKDIR /app
    COPY package.json pnpm-lock.yaml pnpm-workspace.yaml .npmrc ./
    COPY ui/package.json ./ui/package.json
    COPY scripts ./scripts
    RUN pnpm install --frozen-lockfile
    COPY . .
    RUN pnpm build
    RUN pnpm ui:install
    RUN pnpm ui:build
    ENV NODE_ENV=production
    CMD ["node","dist/index.js"]
    ```

  </Accordion>

  <Accordion title="Power-User-Container-Optionen">
    Das Standard-Image ist sicherheitsorientiert und läuft als nicht-root `node`. Für einen
    funktionsreicheren Container:

    1. **`/home/node` persistieren**: `export OPENCLAW_HOME_VOLUME="openclaw_home"`
    2. **Systemabhängigkeiten einbacken**: `export OPENCLAW_DOCKER_APT_PACKAGES="git curl jq"`
    3. **Playwright-Browser installieren**:
       ```bash
       docker compose run --rm openclaw-cli \
         node /app/node_modules/playwright-core/cli.js install chromium
       ```
    4. **Browser-Downloads persistieren**: Setzen Sie
       `PLAYWRIGHT_BROWSERS_PATH=/home/node/.cache/ms-playwright` und verwenden Sie
       `OPENCLAW_HOME_VOLUME` oder `OPENCLAW_EXTRA_MOUNTS`.

  </Accordion>

  <Accordion title="OpenAI Codex OAuth (headless Docker)">
    Wenn Sie im Assistenten OpenAI Codex OAuth auswählen, wird eine Browser-URL geöffnet. In
    Docker- oder Headless-Setups kopieren Sie die vollständige Redirect-URL, auf der Sie landen, und fügen Sie
    sie wieder in den Assistenten ein, um die Authentifizierung abzuschließen.
  </Accordion>

  <Accordion title="Metadaten des Basis-Images">
    Das Haupt-Docker-Image verwendet `node:24-bookworm` und veröffentlicht OCI-Basis-Image-
    Annotationen einschließlich `org.opencontainers.image.base.name`,
    `org.opencontainers.image.source` und weiteren. Siehe
    [OCI image annotations](https://github.com/opencontainers/image-spec/blob/main/annotations.md).
  </Accordion>
</AccordionGroup>

### Auf einem VPS ausführen?

Siehe [Hetzner (Docker VPS)](/install/hetzner) und
[Docker VM Runtime](/install/docker-vm-runtime) für gemeinsame Schritte zur VM-Bereitstellung
einschließlich Binary-Baking, Persistenz und Updates.

## Agent-Sandbox

Wenn `agents.defaults.sandbox` aktiviert ist, führt das Gateway die Tool-Ausführung des Agents
(Shell, Lesen/Schreiben von Dateien usw.) in isolierten Docker-Containern aus, während das
Gateway selbst auf dem Host bleibt. Dadurch erhalten Sie eine harte Grenze um nicht vertrauenswürdige oder
Multi-Tenant-Agent-Sitzungen, ohne das gesamte Gateway zu containerisieren.

Der Sandbox-Scope kann pro Agent (Standard), pro Sitzung oder gemeinsam genutzt sein. Jeder Scope
erhält seinen eigenen Workspace, gemountet unter `/workspace`. Sie können außerdem
Tool-Allow-/Deny-Richtlinien, Netzwerkisolierung, Ressourcenlimits und Browser-Container konfigurieren.

Vollständige Konfiguration, Images, Sicherheitshinweise und Multi-Agent-Profile finden Sie unter:

- [Sandboxing](/gateway/sandboxing) -- vollständige Sandbox-Referenz
- [OpenShell](/gateway/openshell) -- interaktiver Shell-Zugriff auf Sandbox-Container
- [Multi-Agent Sandbox and Tools](/tools/multi-agent-sandbox-tools) -- Überschreibungen pro Agent

### Schnell aktivieren

```json5
{
  agents: {
    defaults: {
      sandbox: {
        mode: "non-main", // off | non-main | all
        scope: "agent", // session | agent | shared
      },
    },
  },
}
```

Das Standard-Sandbox-Image bauen:

```bash
scripts/sandbox-setup.sh
```

## Fehlerbehebung

<AccordionGroup>
  <Accordion title="Image fehlt oder Sandbox-Container startet nicht">
    Bauen Sie das Sandbox-Image mit
    [`scripts/sandbox-setup.sh`](https://github.com/openclaw/openclaw/blob/main/scripts/sandbox-setup.sh)
    oder setzen Sie `agents.defaults.sandbox.docker.image` auf Ihr benutzerdefiniertes Image.
    Container werden bei Bedarf pro Sitzung automatisch erstellt.
  </Accordion>

  <Accordion title="Berechtigungsfehler in der Sandbox">
    Setzen Sie `docker.user` auf eine UID:GID, die zum Besitz Ihres gemounteten Workspaces passt,
    oder führen Sie `chown` auf den Workspace-Ordner aus.
  </Accordion>

  <Accordion title="Benutzerdefinierte Tools in der Sandbox nicht gefunden">
    OpenClaw führt Befehle mit `sh -lc` (Login-Shell) aus, die
    `/etc/profile` lädt und PATH zurücksetzen kann. Setzen Sie `docker.env.PATH`, um Ihre
    benutzerdefinierten Tool-Pfade voranzustellen, oder fügen Sie in Ihrem Dockerfile ein Skript unter `/etc/profile.d/` hinzu.
  </Accordion>

  <Accordion title="Beim Image-Build durch OOM beendet (Exit 137)">
    Die VM benötigt mindestens 2 GB RAM. Verwenden Sie eine größere Maschinenklasse und versuchen Sie es erneut.
  </Accordion>

  <Accordion title="Unauthorized oder Pairing in der Control UI erforderlich">
    Holen Sie einen frischen Dashboard-Link und genehmigen Sie das Browser-Gerät:

    ```bash
    docker compose run --rm openclaw-cli dashboard --no-open
    docker compose run --rm openclaw-cli devices list
    docker compose run --rm openclaw-cli devices approve <requestId>
    ```

    Mehr Details: [Dashboard](/web/dashboard), [Devices](/cli/devices).

  </Accordion>

  <Accordion title="Gateway-Ziel zeigt ws://172.x.x.x oder Pairing-Fehler aus Docker-CLI">
    Gateway-Modus und Bind zurücksetzen:

    ```bash
    docker compose run --rm openclaw-cli config set gateway.mode local
    docker compose run --rm openclaw-cli config set gateway.bind lan
    docker compose run --rm openclaw-cli devices list --url ws://127.0.0.1:18789
    ```

  </Accordion>
</AccordionGroup>

## Verwandt

- [Install Overview](/install) — alle Installationsmethoden
- [Podman](/install/podman) — Podman-Alternative zu Docker
- [ClawDock](/install/clawdock) — Community-Setup mit Docker Compose
- [Updating](/install/updating) — OpenClaw aktuell halten
- [Configuration](/gateway/configuration) — Gateway-Konfiguration nach der Installation
