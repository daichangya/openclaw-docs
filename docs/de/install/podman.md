---
read_when:
    - Sie ein containerisiertes Gateway mit Podman statt mit Docker verwenden möchten
summary: Das OpenClaw-Gateway in einem rootlosen Podman-Container ausführen
title: Podman
x-i18n:
    generated_at: "2026-04-05T12:47:57Z"
    model: gpt-5.4
    provider: openai
    source_hash: 6cb06e2d85b4b0c8a8c6e69c81f629c83b447cbcbb32e34b7876a1819c488020
    source_path: install/podman.md
    workflow: 15
---

# Podman

Führen Sie das OpenClaw-Gateway in einem rootlosen Podman-Container aus, der von Ihrem aktuellen Nicht-Root-Benutzer verwaltet wird.

Das vorgesehene Modell ist:

- Podman führt den Gateway-Container aus.
- Ihre `openclaw`-CLI auf dem Host ist die Kontrollebene.
- Persistenter Status liegt standardmäßig auf dem Host unter `~/.openclaw`.
- Die tägliche Verwaltung verwendet `openclaw --container <name> ...` statt `sudo -u openclaw`, `podman exec` oder eines separaten Service-Benutzers.

## Voraussetzungen

- **Podman** im rootlosen Modus
- **OpenClaw CLI** auf dem Host installiert
- **Optional:** `systemd --user`, wenn Sie einen automatisch startenden Dienst mit Quadlet möchten
- **Optional:** `sudo`, nur wenn Sie `loginctl enable-linger "$(whoami)"` für Persistenz beim Booten auf einem Headless-Host möchten

## Schnellstart

<Steps>
  <Step title="Einmalige Einrichtung">
    Führen Sie im Repository-Stamm `./scripts/podman/setup.sh` aus.
  </Step>

  <Step title="Den Gateway-Container starten">
    Starten Sie den Container mit `./scripts/run-openclaw-podman.sh launch`.
  </Step>

  <Step title="Onboarding im Container ausführen">
    Führen Sie `./scripts/run-openclaw-podman.sh launch setup` aus und öffnen Sie dann `http://127.0.0.1:18789/`.
  </Step>

  <Step title="Den laufenden Container über die Host-CLI verwalten">
    Setzen Sie `OPENCLAW_CONTAINER=openclaw` und verwenden Sie dann normale `openclaw`-Befehle vom Host aus.
  </Step>
</Steps>

Einrichtungsdetails:

- `./scripts/podman/setup.sh` baut standardmäßig `openclaw:local` in Ihrem rootlosen Podman-Store oder verwendet `OPENCLAW_IMAGE` / `OPENCLAW_PODMAN_IMAGE`, wenn Sie eines gesetzt haben.
- Es erstellt `~/.openclaw/openclaw.json` mit `gateway.mode: "local"`, falls diese Datei fehlt.
- Es erstellt `~/.openclaw/.env` mit `OPENCLAW_GATEWAY_TOKEN`, falls diese Datei fehlt.
- Für manuelle Starts liest der Helfer nur eine kleine Allowlist von Podman-bezogenen Schlüsseln aus `~/.openclaw/.env` und übergibt explizite Laufzeit-Umgebungsvariablen an den Container; die vollständige Env-Datei wird nicht an Podman weitergereicht.

Mit Quadlet verwaltete Einrichtung:

```bash
./scripts/podman/setup.sh --quadlet
```

Quadlet ist nur unter Linux verfügbar, da es von systemd-User-Diensten abhängt.

Sie können auch `OPENCLAW_PODMAN_QUADLET=1` setzen.

Optionale Build-/Einrichtungs-Umgebungsvariablen:

- `OPENCLAW_IMAGE` oder `OPENCLAW_PODMAN_IMAGE` -- ein vorhandenes/gepulltes Image verwenden, statt `openclaw:local` zu bauen
- `OPENCLAW_DOCKER_APT_PACKAGES` -- zusätzliche apt-Pakete während des Image-Builds installieren
- `OPENCLAW_EXTENSIONS` -- Abhängigkeiten für Erweiterungen zur Build-Zeit vorinstallieren

Container-Start:

```bash
./scripts/run-openclaw-podman.sh launch
```

Das Skript startet den Container mit Ihrer aktuellen uid/gid als `--userns=keep-id` und bind-mountet Ihren OpenClaw-Status in den Container.

Onboarding:

```bash
./scripts/run-openclaw-podman.sh launch setup
```

Öffnen Sie dann `http://127.0.0.1:18789/` und verwenden Sie das Token aus `~/.openclaw/.env`.

Standard für die Host-CLI:

```bash
export OPENCLAW_CONTAINER=openclaw
```

Dann werden Befehle wie diese automatisch in diesem Container ausgeführt:

```bash
openclaw dashboard --no-open
openclaw gateway status --deep   # includes extra service scan
openclaw doctor
openclaw channels login
```

Unter macOS kann Podman machine dazu führen, dass der Browser für das Gateway nicht lokal erscheint.
Wenn die Control UI nach dem Start Fehler bei der Geräteauthentifizierung meldet, verwenden Sie die Tailscale-Hinweise unter
[Podman + Tailscale](#podman--tailscale).

<a id="podman--tailscale"></a>

## Podman + Tailscale

Für HTTPS oder Remote-Browserzugriff folgen Sie der allgemeinen Tailscale-Dokumentation.

Podman-spezifischer Hinweis:

- Behalten Sie den Publish-Host von Podman auf `127.0.0.1`.
- Bevorzugen Sie hostverwaltetes `tailscale serve` gegenüber `openclaw gateway --tailscale serve`.
- Wenn unter macOS der lokale Browserkontext für Geräteauthentifizierung unzuverlässig ist, verwenden Sie Tailscale-Zugriff statt ad hoc lokaler Tunnel-Workarounds.

Siehe:

- [Tailscale](/gateway/tailscale)
- [Control UI](/web/control-ui)

## Systemd (Quadlet, optional)

Wenn Sie `./scripts/podman/setup.sh --quadlet` ausgeführt haben, installiert die Einrichtung eine Quadlet-Datei unter:

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
- **Start-Helfer:** `./scripts/run-openclaw-podman.sh`

Das Startskript und Quadlet binden den Host-Status in den Container ein:

- `OPENCLAW_CONFIG_DIR` -> `/home/node/.openclaw`
- `OPENCLAW_WORKSPACE_DIR` -> `/home/node/.openclaw/workspace`

Standardmäßig sind dies Host-Verzeichnisse und kein anonymer Container-Status, daher
überstehen `openclaw.json`, `auth-profiles.json` pro Agent, Kanal-/Provider-Status,
Sitzungen und Workspace den Austausch von Containern.
Die Podman-Einrichtung setzt außerdem `gateway.controlUi.allowedOrigins` für `127.0.0.1` und `localhost` auf dem veröffentlichten Gateway-Port, damit das lokale Dashboard mit der Nicht-Loopback-Bindung des Containers funktioniert.

Nützliche Umgebungsvariablen für den manuellen Starter:

- `OPENCLAW_PODMAN_CONTAINER` -- Container-Name (standardmäßig `openclaw`)
- `OPENCLAW_PODMAN_IMAGE` / `OPENCLAW_IMAGE` -- auszuführendes Image
- `OPENCLAW_PODMAN_GATEWAY_HOST_PORT` -- Host-Port, der auf `18789` im Container abgebildet wird
- `OPENCLAW_PODMAN_BRIDGE_HOST_PORT` -- Host-Port, der auf `18790` im Container abgebildet wird
- `OPENCLAW_PODMAN_PUBLISH_HOST` -- Host-Schnittstelle für veröffentlichte Ports; Standard ist `127.0.0.1`
- `OPENCLAW_GATEWAY_BIND` -- Gateway-Bind-Modus im Container; Standard ist `lan`
- `OPENCLAW_PODMAN_USERNS` -- `keep-id` (Standard), `auto` oder `host`

Der manuelle Starter liest `~/.openclaw/.env`, bevor Container-/Image-Standardwerte festgelegt werden. Sie können diese Werte also dort dauerhaft speichern.

Wenn Sie ein nicht standardmäßiges `OPENCLAW_CONFIG_DIR` oder `OPENCLAW_WORKSPACE_DIR` verwenden, setzen Sie dieselben Variablen sowohl für `./scripts/podman/setup.sh` als auch für spätere Befehle `./scripts/run-openclaw-podman.sh launch`. Der repo-lokale Starter speichert benutzerdefinierte Pfadüberschreibungen nicht über Shells hinweg.

Hinweis zu Quadlet:

- Der generierte Quadlet-Dienst behält absichtlich eine feste, gehärtete Standardform bei: veröffentlichte Ports auf `127.0.0.1`, `--bind lan` im Container und den User-Namespace `keep-id`.
- Er fixiert `OPENCLAW_NO_RESPAWN=1`, `Restart=on-failure` und `TimeoutStartSec=300`.
- Er veröffentlicht sowohl `127.0.0.1:18789:18789` (Gateway) als auch `127.0.0.1:18790:18790` (Bridge).
- Er liest `~/.openclaw/.env` als Laufzeit-`EnvironmentFile` für Werte wie `OPENCLAW_GATEWAY_TOKEN`, verwendet aber nicht die Podman-spezifische Override-Allowlist des manuellen Starters.
- Wenn Sie benutzerdefinierte Publish-Ports, einen anderen Publish-Host oder andere Container-Run-Flags benötigen, verwenden Sie den manuellen Starter oder bearbeiten Sie `~/.config/containers/systemd/openclaw.container` direkt und laden/starten Sie den Dienst dann neu.

## Nützliche Befehle

- **Container-Logs:** `podman logs -f openclaw`
- **Container stoppen:** `podman stop openclaw`
- **Container entfernen:** `podman rm -f openclaw`
- **Dashboard-URL über die Host-CLI öffnen:** `openclaw dashboard --no-open`
- **Integrität/Status über die Host-CLI:** `openclaw gateway status --deep` (RPC-Probe + zusätzlicher
  Dienst-Scan)

## Fehlerbehebung

- **Permission denied (EACCES) bei Konfiguration oder Workspace:** Der Container läuft standardmäßig mit `--userns=keep-id` und `--user <your uid>:<your gid>`. Stellen Sie sicher, dass die Host-Pfade für Konfiguration/Workspace Ihrem aktuellen Benutzer gehören.
- **Gateway-Start blockiert (fehlendes `gateway.mode=local`):** Stellen Sie sicher, dass `~/.openclaw/openclaw.json` existiert und `gateway.mode="local"` setzt. `scripts/podman/setup.sh` erstellt dies, falls es fehlt.
- **CLI-Befehle im Container treffen das falsche Ziel:** Verwenden Sie explizit `openclaw --container <name> ...` oder exportieren Sie `OPENCLAW_CONTAINER=<name>` in Ihrer Shell.
- **`openclaw update` schlägt mit `--container` fehl:** Erwartet. Bauen/pullen Sie das Image neu und starten Sie dann den Container oder den Quadlet-Dienst neu.
- **Quadlet-Dienst startet nicht:** Führen Sie `systemctl --user daemon-reload` und dann `systemctl --user start openclaw.service` aus. Auf Headless-Systemen benötigen Sie möglicherweise auch `sudo loginctl enable-linger "$(whoami)"`.
- **SELinux blockiert Bind-Mounts:** Belassen Sie das Standardverhalten der Mounts; der Starter fügt unter Linux automatisch `:Z` hinzu, wenn SELinux im enforcing- oder permissive-Modus ist.

## Verwandt

- [Docker](/install/docker)
- [Gateway-Hintergrundprozess](/gateway/background-process)
- [Gateway-Fehlerbehebung](/gateway/troubleshooting)
