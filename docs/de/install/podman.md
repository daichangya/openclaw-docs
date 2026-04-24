---
read_when:
    - Sie möchten ein containerisiertes Gateway mit Podman statt Docker.
summary: OpenClaw in einem rootless Podman-Container ausführen
title: Podman
x-i18n:
    generated_at: "2026-04-24T06:45:25Z"
    model: gpt-5.4
    provider: openai
    source_hash: 559ac707e0a3ef173d0300ee2f8c6f4ed664ff5afbf1e3f1848312a9d441e9e4
    source_path: install/podman.md
    workflow: 15
---

OpenClaw Gateway in einem rootless Podman-Container ausführen, verwaltet durch Ihren aktuellen Nicht-Root-Benutzer.

Das vorgesehene Modell ist:

- Podman führt den Gateway-Container aus.
- Ihre Host-`openclaw`-CLI ist die Steuerungsebene.
- Persistenter Status liegt standardmäßig auf dem Host unter `~/.openclaw`.
- Das tägliche Management erfolgt mit `openclaw --container <name> ...` statt mit `sudo -u openclaw`, `podman exec` oder einem separaten Dienstbenutzer.

## Voraussetzungen

- **Podman** im rootless-Modus
- **OpenClaw CLI** auf dem Host installiert
- **Optional:** `systemd --user`, wenn Sie einen durch Quadlet verwalteten automatischen Start möchten
- **Optional:** `sudo` nur, wenn Sie `loginctl enable-linger "$(whoami)"` für Persistenz beim Booten auf einem Headless-Host möchten

## Schnellstart

<Steps>
  <Step title="Einmaliges Setup">
    Führen Sie im Repo-Root `./scripts/podman/setup.sh` aus.
  </Step>

  <Step title="Den Gateway-Container starten">
    Starten Sie den Container mit `./scripts/run-openclaw-podman.sh launch`.
  </Step>

  <Step title="Onboarding im Container ausführen">
    Führen Sie `./scripts/run-openclaw-podman.sh launch setup` aus und öffnen Sie dann `http://127.0.0.1:18789/`.
  </Step>

  <Step title="Den laufenden Container von der Host-CLI aus verwalten">
    Setzen Sie `OPENCLAW_CONTAINER=openclaw` und verwenden Sie dann normale `openclaw`-Befehle vom Host aus.
  </Step>
</Steps>

Details zum Setup:

- `./scripts/podman/setup.sh` baut standardmäßig `openclaw:local` in Ihrem rootless Podman-Store oder verwendet `OPENCLAW_IMAGE` / `OPENCLAW_PODMAN_IMAGE`, wenn Sie eines setzen.
- Es erstellt `~/.openclaw/openclaw.json` mit `gateway.mode: "local"`, falls dies fehlt.
- Es erstellt `~/.openclaw/.env` mit `OPENCLAW_GATEWAY_TOKEN`, falls dies fehlt.
- Für manuelle Starts liest der Helper nur eine kleine Allowlist von Podman-bezogenen Schlüsseln aus `~/.openclaw/.env` und übergibt explizite Runtime-Umgebungsvariablen an den Container; er übergibt Podman nicht die vollständige Env-Datei.

Quadlet-verwaltes Setup:

```bash
./scripts/podman/setup.sh --quadlet
```

Quadlet ist nur unter Linux möglich, da es von systemd-User-Diensten abhängt.

Sie können auch `OPENCLAW_PODMAN_QUADLET=1` setzen.

Optionale Build-/Setup-Umgebungsvariablen:

- `OPENCLAW_IMAGE` oder `OPENCLAW_PODMAN_IMAGE` -- ein vorhandenes/gezogenes Image verwenden, statt `openclaw:local` zu bauen
- `OPENCLAW_DOCKER_APT_PACKAGES` -- zusätzliche apt-Pakete während des Image-Builds installieren
- `OPENCLAW_EXTENSIONS` -- Plugin-Abhängigkeiten zur Build-Zeit vorinstallieren

Container-Start:

```bash
./scripts/run-openclaw-podman.sh launch
```

Das Skript startet den Container mit Ihrer aktuellen uid/gid mit `--userns=keep-id` und bind-mounted Ihren OpenClaw-Status in den Container.

Onboarding:

```bash
./scripts/run-openclaw-podman.sh launch setup
```

Öffnen Sie dann `http://127.0.0.1:18789/` und verwenden Sie das Token aus `~/.openclaw/.env`.

Standard für die Host-CLI:

```bash
export OPENCLAW_CONTAINER=openclaw
```

Dann werden Befehle wie diese automatisch innerhalb dieses Containers ausgeführt:

```bash
openclaw dashboard --no-open
openclaw gateway status --deep   # enthält zusätzlichen Service-Scan
openclaw doctor
openclaw channels login
```

Unter macOS kann Podman machine dazu führen, dass der Browser für das Gateway nicht lokal erscheint.
Wenn die Control UI nach dem Start Gerätea uthentifizierungsfehler meldet, verwenden Sie die Tailscale-Hinweise in
[Podman + Tailscale](#podman--tailscale).

<a id="podman--tailscale"></a>

## Podman + Tailscale

Für HTTPS oder Remote-Browser-Zugriff folgen Sie der Hauptdokumentation zu Tailscale.

Podman-spezifischer Hinweis:

- Behalten Sie den Publish-Host von Podman auf `127.0.0.1`.
- Bevorzugen Sie hostverwaltetes `tailscale serve` statt `openclaw gateway --tailscale serve`.
- Wenn unter macOS der Kontext für Browser-Geräteauthentifizierung lokal unzuverlässig ist, verwenden Sie Tailscale-Zugriff anstelle ad hoc lokaler Tunnel-Workarounds.

Siehe:

- [Tailscale](/de/gateway/tailscale)
- [Control UI](/de/web/control-ui)

## Systemd (Quadlet, optional)

Wenn Sie `./scripts/podman/setup.sh --quadlet` ausgeführt haben, installiert das Setup eine Quadlet-Datei unter:

```bash
~/.config/containers/systemd/openclaw.container
```

Nützliche Befehle:

- **Starten:** `systemctl --user start openclaw.service`
- **Stoppen:** `systemctl --user stop openclaw.service`
- **Status:** `systemctl --user status openclaw.service`
- **Logs:** `journalctl --user -u openclaw.service -f`

Nach dem Bearbeiten der Quadlet-Datei:

```bash
systemctl --user daemon-reload
systemctl --user restart openclaw.service
```

Für Persistenz beim Booten auf SSH-/Headless-Hosts aktivieren Sie Linger für Ihren aktuellen Benutzer:

```bash
sudo loginctl enable-linger "$(whoami)"
```

## Konfiguration, Umgebung und Speicher

- **Konfigurationsverzeichnis:** `~/.openclaw`
- **Workspace-Verzeichnis:** `~/.openclaw/workspace`
- **Token-Datei:** `~/.openclaw/.env`
- **Launch-Helper:** `./scripts/run-openclaw-podman.sh`

Das Startskript und Quadlet binden den Host-Status in den Container ein:

- `OPENCLAW_CONFIG_DIR` -> `/home/node/.openclaw`
- `OPENCLAW_WORKSPACE_DIR` -> `/home/node/.openclaw/workspace`

Standardmäßig sind dies Host-Verzeichnisse und kein anonymer Container-Status, sodass
`openclaw.json`, `auth-profiles.json` pro Agent, Kanal-/Provider-Status,
Sitzungen und Workspace den Austausch des Containers überleben.
Das Podman-Setup setzt außerdem `gateway.controlUi.allowedOrigins` für `127.0.0.1` und `localhost` auf dem veröffentlichten Gateway-Port, damit das lokale Dashboard mit dem Nicht-loopback-Bind des Containers funktioniert.

Nützliche Umgebungsvariablen für den manuellen Launcher:

- `OPENCLAW_PODMAN_CONTAINER` -- Containername (standardmäßig `openclaw`)
- `OPENCLAW_PODMAN_IMAGE` / `OPENCLAW_IMAGE` -- auszuführendes Image
- `OPENCLAW_PODMAN_GATEWAY_HOST_PORT` -- Host-Port, der auf Container `18789` gemappt wird
- `OPENCLAW_PODMAN_BRIDGE_HOST_PORT` -- Host-Port, der auf Container `18790` gemappt wird
- `OPENCLAW_PODMAN_PUBLISH_HOST` -- Host-Interface für veröffentlichte Ports; Standard ist `127.0.0.1`
- `OPENCLAW_GATEWAY_BIND` -- Gateway-Bind-Modus im Container; Standard ist `lan`
- `OPENCLAW_PODMAN_USERNS` -- `keep-id` (Standard), `auto` oder `host`

Der manuelle Launcher liest `~/.openclaw/.env`, bevor er Container-/Image-Standards finalisiert, sodass Sie diese dort persistent hinterlegen können.

Wenn Sie ein nicht standardmäßiges `OPENCLAW_CONFIG_DIR` oder `OPENCLAW_WORKSPACE_DIR` verwenden, setzen Sie dieselben Variablen sowohl für `./scripts/podman/setup.sh` als auch für spätere Befehle `./scripts/run-openclaw-podman.sh launch`. Der repo-lokale Launcher speichert benutzerdefinierte Pfadüberschreibungen nicht über Shells hinweg.

Hinweis zu Quadlet:

- Der generierte Quadlet-Dienst behält absichtlich eine feste, gehärtete Standardform bei: veröffentlichte Ports auf `127.0.0.1`, `--bind lan` innerhalb des Containers und User-Namespace `keep-id`.
- Er setzt `OPENCLAW_NO_RESPAWN=1`, `Restart=on-failure` und `TimeoutStartSec=300` fest.
- Er veröffentlicht sowohl `127.0.0.1:18789:18789` (Gateway) als auch `127.0.0.1:18790:18790` (Bridge).
- Er liest `~/.openclaw/.env` als Runtime-`EnvironmentFile` für Werte wie `OPENCLAW_GATEWAY_TOKEN`, verwendet aber nicht die Podman-spezifische Override-Allowlist des manuellen Launchers.
- Wenn Sie benutzerdefinierte Publish-Ports, Publish-Host oder andere Flags für Container-Läufe benötigen, verwenden Sie den manuellen Launcher oder bearbeiten Sie `~/.config/containers/systemd/openclaw.container` direkt und laden/starten Sie dann den Dienst neu.

## Nützliche Befehle

- **Container-Logs:** `podman logs -f openclaw`
- **Container stoppen:** `podman stop openclaw`
- **Container entfernen:** `podman rm -f openclaw`
- **Dashboard-URL von der Host-CLI aus öffnen:** `openclaw dashboard --no-open`
- **Health/Status über Host-CLI:** `openclaw gateway status --deep` (RPC-Probe + zusätzlicher
  Service-Scan)

## Fehlerbehebung

- **Permission denied (EACCES) bei Konfiguration oder Workspace:** Der Container läuft standardmäßig mit `--userns=keep-id` und `--user <your uid>:<your gid>`. Stellen Sie sicher, dass die Host-Pfade für Konfiguration/Workspace Ihrem aktuellen Benutzer gehören.
- **Gateway-Start blockiert (fehlendes `gateway.mode=local`):** Stellen Sie sicher, dass `~/.openclaw/openclaw.json` existiert und `gateway.mode="local"` setzt. `scripts/podman/setup.sh` erstellt dies, falls es fehlt.
- **CLI-Befehle im Container treffen das falsche Ziel:** Verwenden Sie explizit `openclaw --container <name> ...` oder exportieren Sie `OPENCLAW_CONTAINER=<name>` in Ihrer Shell.
- **`openclaw update` schlägt mit `--container` fehl:** Erwartet. Bauen/ziehen Sie das Image neu und starten Sie dann den Container oder den Quadlet-Dienst neu.
- **Quadlet-Dienst startet nicht:** Führen Sie `systemctl --user daemon-reload` und dann `systemctl --user start openclaw.service` aus. Auf Headless-Systemen benötigen Sie eventuell zusätzlich `sudo loginctl enable-linger "$(whoami)"`.
- **SELinux blockiert Bind-Mounts:** Lassen Sie das Standardverhalten für Mounts unverändert; der Launcher fügt unter Linux automatisch `:Z` hinzu, wenn SELinux enforcing oder permissive ist.

## Verwandt

- [Docker](/de/install/docker)
- [Gateway-Hintergrundprozess](/de/gateway/background-process)
- [Gateway-Fehlerbehebung](/de/gateway/troubleshooting)
