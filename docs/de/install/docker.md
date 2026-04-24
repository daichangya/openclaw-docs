---
read_when:
    - Sie möchten ein containerisiertes Gateway statt lokaler Installationen.
    - Sie validieren den Docker-Ablauf.
summary: Optionales Docker-basiertes Setup und Onboarding für OpenClaw
title: Docker
x-i18n:
    generated_at: "2026-04-24T06:43:43Z"
    model: gpt-5.4
    provider: openai
    source_hash: ee6bfd2d4ad8b4629c5077d401b8fec36e71b250da3cccdd9ec3cb9c2abbdfc2
    source_path: install/docker.md
    workflow: 15
---

Docker ist **optional**. Verwenden Sie Docker nur, wenn Sie ein containerisiertes Gateway möchten oder den Docker-Ablauf validieren wollen.

## Ist Docker das Richtige für mich?

- **Ja**: Sie möchten eine isolierte, wegwerfbare Gateway-Umgebung oder OpenClaw auf einem Host ohne lokale Installationen ausführen.
- **Nein**: Sie arbeiten auf Ihrem eigenen Rechner und möchten einfach die schnellste Entwicklungsschleife. Verwenden Sie stattdessen den normalen Installationsablauf.
- **Hinweis zu Sandboxing**: Das Standard-Sandbox-Backend verwendet Docker, wenn Sandboxing aktiviert ist, aber Sandboxing ist standardmäßig deaktiviert und erfordert **nicht**, dass das gesamte Gateway in Docker läuft. SSH- und OpenShell-Sandbox-Backends sind ebenfalls verfügbar. Siehe [Sandboxing](/de/gateway/sandboxing).

## Voraussetzungen

- Docker Desktop (oder Docker Engine) + Docker Compose v2
- Mindestens 2 GB RAM für den Image-Build (`pnpm install` kann auf Hosts mit 1 GB RAM mit Exit 137 wegen OOM beendet werden)
- Ausreichend Speicherplatz für Images und Logs
- Wenn Sie auf einem VPS/öffentlichen Host ausführen, prüfen Sie
  [Sicherheitshärtung für Netzwerk-Exposition](/de/gateway/security),
  insbesondere die Docker-Firewall-Richtlinie `DOCKER-USER`.

## Containerisiertes Gateway

<Steps>
  <Step title="Das Image bauen">
    Führen Sie im Repo-Root das Setup-Skript aus:

    ```bash
    ./scripts/docker/setup.sh
    ```

    Dadurch wird das Gateway-Image lokal gebaut. Um stattdessen ein vorgefertigtes Image zu verwenden:

    ```bash
    export OPENCLAW_IMAGE="ghcr.io/openclaw/openclaw:latest"
    ./scripts/docker/setup.sh
    ```

    Vorgefertigte Images werden im
    [GitHub Container Registry](https://github.com/openclaw/openclaw/pkgs/container/openclaw) veröffentlicht.
    Häufige Tags: `main`, `latest`, `<version>` (z. B. `2026.2.26`).

  </Step>

  <Step title="Onboarding abschließen">
    Das Setup-Skript führt Onboarding automatisch aus. Es wird:

    - nach Provider-API-Keys fragen
    - ein Gateway-Token erzeugen und in `.env` schreiben
    - das Gateway über Docker Compose starten

    Während des Setups laufen Onboarding vor dem Start und Konfigurationsschreibvorgänge
    direkt über `openclaw-gateway`. `openclaw-cli` ist für Befehle gedacht, die Sie ausführen, nachdem
    der Gateway-Container bereits existiert.

  </Step>

  <Step title="Die Control UI öffnen">
    Öffnen Sie `http://127.0.0.1:18789/` in Ihrem Browser und fügen Sie das konfigurierte
    Shared Secret in die Einstellungen ein. Das Setup-Skript schreibt standardmäßig ein Token nach `.env`;
    wenn Sie die Container-Konfiguration auf Passwortauthentifizierung umstellen, verwenden Sie stattdessen dieses
    Passwort.

    Benötigen Sie die URL erneut?

    ```bash
    docker compose run --rm openclaw-cli dashboard --no-open
    ```

  </Step>

  <Step title="Kanäle konfigurieren (optional)">
    Verwenden Sie den CLI-Container, um Messaging-Kanäle hinzuzufügen:

    ```bash
    # WhatsApp (QR)
    docker compose run --rm openclaw-cli channels login

    # Telegram
    docker compose run --rm openclaw-cli channels add --channel telegram --token "<token>"

    # Discord
    docker compose run --rm openclaw-cli channels add --channel discord --token "<token>"
    ```

    Dokumentation: [WhatsApp](/de/channels/whatsapp), [Telegram](/de/channels/telegram), [Discord](/de/channels/discord)

  </Step>
</Steps>

### Manueller Ablauf

Wenn Sie lieber jeden Schritt selbst ausführen möchten, statt das Setup-Skript zu verwenden:

```bash
docker build -t openclaw:local -f Dockerfile .
docker compose run --rm --no-deps --entrypoint node openclaw-gateway \
  dist/index.js onboard --mode local --no-install-daemon
docker compose run --rm --no-deps --entrypoint node openclaw-gateway \
  dist/index.js config set --batch-json '[{"path":"gateway.mode","value":"local"},{"path":"gateway.bind","value":"lan"},{"path":"gateway.controlUi.allowedOrigins","value":["http://localhost:18789","http://127.0.0.1:18789"]}]'
docker compose up -d openclaw-gateway
```

<Note>
Führen Sie `docker compose` aus dem Repo-Root aus. Wenn Sie `OPENCLAW_EXTRA_MOUNTS`
oder `OPENCLAW_HOME_VOLUME` aktiviert haben, schreibt das Setup-Skript `docker-compose.extra.yml`;
binden Sie es mit `-f docker-compose.yml -f docker-compose.extra.yml` ein.
</Note>

<Note>
Da `openclaw-cli` den Netzwerk-Namespace von `openclaw-gateway` teilt, ist es ein
Post-Start-Tool. Vor `docker compose up -d openclaw-gateway` führen Sie Onboarding
und Konfigurationsschreibvorgänge zur Setup-Zeit über `openclaw-gateway` mit
`--no-deps --entrypoint node` aus.
</Note>

### Umgebungsvariablen

Das Setup-Skript akzeptiert diese optionalen Umgebungsvariablen:

| Variable                       | Zweck                                                           |
| ------------------------------ | --------------------------------------------------------------- |
| `OPENCLAW_IMAGE`               | Ein Remote-Image statt eines lokalen Builds verwenden           |
| `OPENCLAW_DOCKER_APT_PACKAGES` | Zusätzliche apt-Pakete während des Builds installieren (durch Leerzeichen getrennt) |
| `OPENCLAW_EXTENSIONS`          | Plugin-Abhängigkeiten zur Build-Zeit vorinstallieren (durch Leerzeichen getrennte Namen) |
| `OPENCLAW_EXTRA_MOUNTS`        | Zusätzliche Host-Bind-Mounts (kommagetrennt `source:target[:opts]`) |
| `OPENCLAW_HOME_VOLUME`         | `/home/node` in einem benannten Docker-Volume persistent machen |
| `OPENCLAW_SANDBOX`             | Opt-in für Sandbox-Bootstrap (`1`, `true`, `yes`, `on`)        |
| `OPENCLAW_DOCKER_SOCKET`       | Pfad zum Docker-Socket überschreiben                            |

### Health Checks

Container-Probe-Endpunkte (keine Authentifizierung erforderlich):

```bash
curl -fsS http://127.0.0.1:18789/healthz   # Liveness
curl -fsS http://127.0.0.1:18789/readyz     # Readiness
```

Das Docker-Image enthält einen eingebauten `HEALTHCHECK`, der `/healthz` abfragt.
Wenn Checks dauerhaft fehlschlagen, markiert Docker den Container als `unhealthy`, und
Orchestrierungssysteme können ihn neu starten oder ersetzen.

Authentifizierter Deep-Health-Snapshot:

```bash
docker compose exec openclaw-gateway node dist/index.js health --token "$OPENCLAW_GATEWAY_TOKEN"
```

### LAN vs. Loopback

`scripts/docker/setup.sh` verwendet standardmäßig `OPENCLAW_GATEWAY_BIND=lan`, damit Host-Zugriff auf
`http://127.0.0.1:18789` mit Docker-Portfreigabe funktioniert.

- `lan` (Standard): Browser und CLI auf dem Host können den veröffentlichten Gateway-Port erreichen.
- `loopback`: nur Prozesse innerhalb des Netzwerk-Namespace des Containers können
  das Gateway direkt erreichen.

<Note>
Verwenden Sie Bind-Modus-Werte in `gateway.bind` (`lan` / `loopback` / `custom` /
`tailnet` / `auto`), nicht Host-Aliasse wie `0.0.0.0` oder `127.0.0.1`.
</Note>

### Speicherung und Persistenz

Docker Compose bind-mounted `OPENCLAW_CONFIG_DIR` nach `/home/node/.openclaw` und
`OPENCLAW_WORKSPACE_DIR` nach `/home/node/.openclaw/workspace`, sodass diese Pfade
den Austausch des Containers überleben.

In diesem gemounteten Konfigurationsverzeichnis speichert OpenClaw:

- `openclaw.json` für Verhaltenskonfiguration
- `agents/<agentId>/agent/auth-profiles.json` für gespeicherte Provider-OAuth-/API-Key-Authentifizierung
- `.env` für env-gestützte Runtime-Secrets wie `OPENCLAW_GATEWAY_TOKEN`

Für vollständige Details zur Persistenz bei VM-Bereitstellungen siehe
[Docker VM Runtime - What persists where](/de/install/docker-vm-runtime#what-persists-where).

**Hotspots für Speicherzuwachs:** Beobachten Sie `media/`, Session-JSONL-Dateien, `cron/runs/*.jsonl`
und rotierende Dateilogs unter `/tmp/openclaw/`.

### Shell-Helper (optional)

Für einfacheres tägliches Docker-Management installieren Sie `ClawDock`:

```bash
mkdir -p ~/.clawdock && curl -sL https://raw.githubusercontent.com/openclaw/openclaw/main/scripts/clawdock/clawdock-helpers.sh -o ~/.clawdock/clawdock-helpers.sh
echo 'source ~/.clawdock/clawdock-helpers.sh' >> ~/.zshrc && source ~/.zshrc
```

Wenn Sie ClawDock vom älteren Raw-Pfad `scripts/shell-helpers/clawdock-helpers.sh` installiert haben, führen Sie den obigen Installationsbefehl erneut aus, damit Ihre lokale Helper-Datei den neuen Speicherort verwendet.

Verwenden Sie dann `clawdock-start`, `clawdock-stop`, `clawdock-dashboard` usw. Führen Sie
`clawdock-help` aus, um alle Befehle zu sehen.
Siehe [ClawDock](/de/install/clawdock) für die vollständige Anleitung zu den Helpern.

<AccordionGroup>
  <Accordion title="Agenten-Sandbox für Docker-Gateway aktivieren">
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

    Das Skript mountet `docker.sock` nur, nachdem die Voraussetzungen für die Sandbox erfüllt sind. Wenn
    das Sandbox-Setup nicht abgeschlossen werden kann, setzt das Skript `agents.defaults.sandbox.mode`
    auf `off` zurück.

  </Accordion>

  <Accordion title="Automatisierung / CI (nicht interaktiv)">
    Deaktivieren Sie die Pseudo-TTY-Zuweisung von Compose mit `-T`:

    ```bash
    docker compose run -T --rm openclaw-cli gateway probe
    docker compose run -T --rm openclaw-cli devices list --json
    ```

  </Accordion>

  <Accordion title="Sicherheitshinweis zu gemeinsam genutzten Netzwerken">
    `openclaw-cli` verwendet `network_mode: "service:openclaw-gateway"`, damit CLI-
    Befehle das Gateway über `127.0.0.1` erreichen können. Behandeln Sie dies als gemeinsam genutzte
    Vertrauensgrenze. Die Compose-Konfiguration entfernt `NET_RAW`/`NET_ADMIN` und aktiviert
    `no-new-privileges` auf `openclaw-cli`.
  </Accordion>

  <Accordion title="Berechtigungen und EACCES">
    Das Image läuft als `node` (uid 1000). Wenn Sie Berechtigungsfehler bei
    `/home/node/.openclaw` sehen, stellen Sie sicher, dass Ihre Bind-Mounts auf dem Host uid 1000 gehören:

    ```bash
    sudo chown -R 1000:1000 /path/to/openclaw-config /path/to/openclaw-workspace
    ```

  </Accordion>

  <Accordion title="Schnellere Rebuilds">
    Ordnen Sie Ihr Dockerfile so an, dass Abhängigkeits-Layer gecacht werden. So vermeiden Sie ein erneutes
    Ausführen von `pnpm install`, solange sich Lockfiles nicht ändern:

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

  <Accordion title="Power-User-Containeroptionen">
    Das Standard-Image setzt auf Sicherheit und läuft als nicht-root `node`. Für einen
    funktionsreicheren Container:

    1. **`/home/node` persistent machen**: `export OPENCLAW_HOME_VOLUME="openclaw_home"`
    2. **Systemabhängigkeiten einbacken**: `export OPENCLAW_DOCKER_APT_PACKAGES="git curl jq"`
    3. **Playwright-Browser installieren**:
       ```bash
       docker compose run --rm openclaw-cli \
         node /app/node_modules/playwright-core/cli.js install chromium
       ```
    4. **Browser-Downloads persistent machen**: setzen Sie
       `PLAYWRIGHT_BROWSERS_PATH=/home/node/.cache/ms-playwright` und verwenden Sie
       `OPENCLAW_HOME_VOLUME` oder `OPENCLAW_EXTRA_MOUNTS`.

  </Accordion>

  <Accordion title="OpenAI Codex OAuth (headless Docker)">
    Wenn Sie im Assistenten OpenAI Codex OAuth auswählen, öffnet er eine Browser-URL. In
    Docker- oder headless-Setups kopieren Sie die vollständige Redirect-URL, auf der Sie landen, und fügen
    sie zurück in den Assistenten ein, um die Authentifizierung abzuschließen.
  </Accordion>

  <Accordion title="Metadaten des Basis-Images">
    Das Haupt-Docker-Image verwendet `node:24-bookworm` und veröffentlicht OCI-Basis-Image-
    Annotationen, darunter `org.opencontainers.image.base.name`,
    `org.opencontainers.image.source` und weitere. Siehe
    [OCI image annotations](https://github.com/opencontainers/image-spec/blob/main/annotations.md).
  </Accordion>
</AccordionGroup>

### Ausführung auf einem VPS?

Siehe [Hetzner (Docker VPS)](/de/install/hetzner) und
[Docker VM Runtime](/de/install/docker-vm-runtime) für gemeinsame Schritte zur VM-Bereitstellung,
einschließlich Binary Baking, Persistenz und Updates.

## Agenten-Sandbox

Wenn `agents.defaults.sandbox` mit dem Docker-Backend aktiviert ist, führt das Gateway
die Tool-Ausführung des Agenten (Shell, Datei lesen/schreiben usw.) in isolierten Docker-
Containern aus, während das Gateway selbst auf dem Host verbleibt. Dadurch erhalten Sie eine harte Grenze
um nicht vertrauenswürdige oder mandantenfähige Agent-Sitzungen, ohne das gesamte
Gateway zu containerisieren.

Der Sandbox-Scope kann pro Agent (Standard), pro Sitzung oder gemeinsam genutzt sein. Jeder Scope
erhält seinen eigenen Workspace, der unter `/workspace` gemountet wird. Sie können außerdem
Allow-/Deny-Richtlinien für Tools, Netzwerkisolation, Ressourcenlimits und Browser-
Container konfigurieren.

Für vollständige Konfiguration, Images, Sicherheitshinweise und Multi-Agent-Profile siehe:

- [Sandboxing](/de/gateway/sandboxing) -- vollständige Sandbox-Referenz
- [OpenShell](/de/gateway/openshell) -- interaktiver Shell-Zugriff auf Sandbox-Container
- [Multi-Agent Sandbox and Tools](/de/tools/multi-agent-sandbox-tools) -- Überschreibungen pro Agent

### Schnelles Aktivieren

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

Bauen Sie das Standard-Sandbox-Image:

```bash
scripts/sandbox-setup.sh
```

## Fehlerbehebung

<AccordionGroup>
  <Accordion title="Image fehlt oder Sandbox-Container startet nicht">
    Bauen Sie das Sandbox-Image mit
    [`scripts/sandbox-setup.sh`](https://github.com/openclaw/openclaw/blob/main/scripts/sandbox-setup.sh)
    oder setzen Sie `agents.defaults.sandbox.docker.image` auf Ihr benutzerdefiniertes Image.
    Container werden bei Bedarf automatisch pro Sitzung erstellt.
  </Accordion>

  <Accordion title="Berechtigungsfehler in der Sandbox">
    Setzen Sie `docker.user` auf eine UID:GID, die zur Eigentümerschaft Ihres gemounteten Workspace passt,
    oder führen Sie `chown` auf den Workspace-Ordner aus.
  </Accordion>

  <Accordion title="Benutzerdefinierte Tools in der Sandbox nicht gefunden">
    OpenClaw führt Befehle mit `sh -lc` (Login-Shell) aus, wodurch
    `/etc/profile` geladen wird und PATH möglicherweise zurückgesetzt wird. Setzen Sie `docker.env.PATH`, um Ihre
    benutzerdefinierten Tool-Pfade voranzustellen, oder fügen Sie in Ihrem Dockerfile ein Skript unter `/etc/profile.d/` hinzu.
  </Accordion>

  <Accordion title="Während des Image-Builds wegen OOM beendet (exit 137)">
    Die VM benötigt mindestens 2 GB RAM. Verwenden Sie eine größere Maschinenklasse und versuchen Sie es erneut.
  </Accordion>

  <Accordion title="Unauthorized oder Pairing erforderlich in der Control UI">
    Holen Sie einen neuen Dashboard-Link und genehmigen Sie das Browser-Gerät:

    ```bash
    docker compose run --rm openclaw-cli dashboard --no-open
    docker compose run --rm openclaw-cli devices list
    docker compose run --rm openclaw-cli devices approve <requestId>
    ```

    Mehr Details: [Dashboard](/de/web/dashboard), [Devices](/de/cli/devices).

  </Accordion>

  <Accordion title="Gateway-Ziel zeigt ws://172.x.x.x oder Pairing-Fehler aus Docker-CLI">
    Setzen Sie Gateway-Modus und Bind zurück:

    ```bash
    docker compose run --rm openclaw-cli config set --batch-json '[{"path":"gateway.mode","value":"local"},{"path":"gateway.bind","value":"lan"}]'
    docker compose run --rm openclaw-cli devices list --url ws://127.0.0.1:18789
    ```

  </Accordion>
</AccordionGroup>

## Verwandt

- [Installationsübersicht](/de/install) — alle Installationsmethoden
- [Podman](/de/install/podman) — Podman als Alternative zu Docker
- [ClawDock](/de/install/clawdock) — Docker-Compose-Community-Setup
- [Aktualisieren](/de/install/updating) — OpenClaw aktuell halten
- [Konfiguration](/de/gateway/configuration) — Gateway-Konfiguration nach der Installation
