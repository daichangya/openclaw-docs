---
read_when:
    - Sie möchten ein containerisiertes Gateway mit Podman statt Docker.
summary: OpenClaw in einem Rootless-Podman-Container ausführen
title: Podman
x-i18n:
    generated_at: "2026-04-23T14:03:28Z"
    model: gpt-5.4
    provider: openai
    source_hash: df478ad4ac63b363c86a53bc943494b32602abfaad8576c5e899e77f7699a533
    source_path: install/podman.md
    workflow: 15
---

# Podman

Führen Sie das OpenClaw Gateway in einem Rootless-Podman-Container aus, verwaltet von Ihrem aktuellen Benutzer ohne Root-Rechte.

Das vorgesehene Modell ist:

- Podman führt den Gateway-Container aus.
- Ihre Host-`openclaw`-CLI ist die Control Plane.
- Persistenter Zustand liegt standardmäßig auf dem Host unter `~/.openclaw`.
- Die tägliche Verwaltung erfolgt mit `openclaw --container <name> ...` statt mit `sudo -u openclaw`, `podman exec` oder einem separaten Service-Benutzer.

## Voraussetzungen

- **Podman** im Rootless-Modus
- **OpenClaw CLI** auf dem Host installiert
- **Optional:** `systemd --user`, wenn Sie einen von Quadlet verwalteten Autostart möchten
- **Optional:** `sudo`, nur wenn Sie `loginctl enable-linger "$(whoami)"` für Persistenz beim Booten auf einem headless-Host möchten

## Schnellstart

<Steps>
  <Step title="Einmalige Einrichtung">
    Führen Sie im Repo-Root `./scripts/podman/setup.sh` aus.
  </Step>

  <Step title="Gateway-Container starten">
    Starten Sie den Container mit `./scripts/run-openclaw-podman.sh launch`.
  </Step>

  <Step title="Onboarding im Container ausführen">
    Führen Sie `./scripts/run-openclaw-podman.sh launch setup` aus und öffnen Sie dann `http://127.0.0.1:18789/`.
  </Step>

  <Step title="Den laufenden Container über die Host-CLI verwalten">
    Setzen Sie `OPENCLAW_CONTAINER=openclaw` und verwenden Sie dann normale `openclaw`-Befehle vom Host.
  </Step>
</Steps>

Details zur Einrichtung:

- `./scripts/podman/setup.sh` baut standardmäßig `openclaw:local` in Ihrem Rootless-Podman-Store oder verwendet `OPENCLAW_IMAGE` / `OPENCLAW_PODMAN_IMAGE`, wenn eines gesetzt ist.
- Es erstellt `~/.openclaw/openclaw.json` mit `gateway.mode: "local"`, falls die Datei fehlt.
- Es erstellt `~/.openclaw/.env` mit `OPENCLAW_GATEWAY_TOKEN`, falls die Datei fehlt.
- Für manuelle Starts liest das Hilfsskript nur eine kleine Allowlist von Podman-bezogenen Schlüsseln aus `~/.openclaw/.env` und übergibt explizite Laufzeit-Umgebungsvariablen an den Container; es übergibt nicht die vollständige Env-Datei an Podman.

Von Quadlet verwaltete Einrichtung:

```bash
./scripts/podman/setup.sh --quadlet
```

Quadlet ist eine Linux-only-Option, da sie von systemd-Benutzerdiensten abhängt.

Sie können auch `OPENCLAW_PODMAN_QUADLET=1` setzen.

Optionale Build-/Setup-Umgebungsvariablen:

- `OPENCLAW_IMAGE` oder `OPENCLAW_PODMAN_IMAGE` -- ein vorhandenes/gepulltes Image verwenden, statt `openclaw:local` zu bauen
- `OPENCLAW_DOCKER_APT_PACKAGES` -- zusätzliche apt-Pakete während des Image-Builds installieren
- `OPENCLAW_EXTENSIONS` -- Plugin-Abhängigkeiten zur Build-Zeit vorinstallieren

Containerstart:

```bash
./scripts/run-openclaw-podman.sh launch
```

Das Skript startet den Container mit Ihrer aktuellen uid/gid über `--userns=keep-id` und bind-mountet Ihren OpenClaw-Zustand in den Container.

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
openclaw gateway status --deep   # enthält zusätzliche Service-Prüfung
openclaw doctor
openclaw channels login
```

Unter macOS kann Podman machine dazu führen, dass der Browser für das Gateway nicht als lokal erscheint.
Wenn die Control UI nach dem Start Fehler bei der Geräteauthentifizierung meldet, verwenden Sie die Tailscale-Hinweise unter
[Podman + Tailscale](#podman--tailscale).

<a id="podman--tailscale"></a>

## Podman + Tailscale

Für HTTPS oder entfernten Browserzugriff folgen Sie der Hauptdokumentation zu Tailscale.

Podman-spezifischer Hinweis:

- Behalten Sie den Publish-Host von Podman auf `127.0.0.1`.
- Bevorzugen Sie hostverwaltetes `tailscale serve` gegenüber `openclaw gateway --tailscale serve`.
- Wenn unter macOS der Geräteauthentifizierungskontext des lokalen Browsers unzuverlässig ist, verwenden Sie Tailscale-Zugriff statt ad-hoc lokaler Tunnel-Workarounds.

Siehe:

- [Tailscale](/de/gateway/tailscale)
- [Control UI](/de/web/control-ui)

## Systemd (Quadlet, optional)

Wenn Sie `./scripts/podman/setup.sh --quadlet` ausgeführt haben, installiert das Setup eine Quadlet-Datei unter:

```bash
~/.config/containers/systemd/openclaw.container
```

Nützliche Befehle:

- **Start:** `systemctl --user start openclaw.service`
- **Stopp:** `systemctl --user stop openclaw.service`
- **Status:** `systemctl --user status openclaw.service`
- **Logs:** `journalctl --user -u openclaw.service -f`

Nach dem Bearbeiten der Quadlet-Datei:

```bash
systemctl --user daemon-reload
systemctl --user restart openclaw.service
```

Für Persistenz beim Booten auf SSH-/headless-Hosts aktivieren Sie Linger für Ihren aktuellen Benutzer:

```bash
sudo loginctl enable-linger "$(whoami)"
```

## Konfiguration, env und Speicher

- **Konfigurationsverzeichnis:** `~/.openclaw`
- **Workspace-Verzeichnis:** `~/.openclaw/workspace`
- **Token-Datei:** `~/.openclaw/.env`
- **Start-Helfer:** `./scripts/run-openclaw-podman.sh`

Das Startskript und Quadlet binden den Host-Zustand in den Container ein:

- `OPENCLAW_CONFIG_DIR` -> `/home/node/.openclaw`
- `OPENCLAW_WORKSPACE_DIR` -> `/home/node/.openclaw/workspace`

Standardmäßig sind dies Host-Verzeichnisse, kein anonymer Containerzustand, sodass
`openclaw.json`, `auth-profiles.json` pro Agent, Kanal-/Provider-Zustand,
Sitzungen und der Workspace das Ersetzen des Containers überleben.
Das Podman-Setup setzt außerdem `gateway.controlUi.allowedOrigins` für `127.0.0.1` und `localhost` auf dem veröffentlichten Gateway-Port, damit das lokale Dashboard mit der nicht-loopback-Bindung des Containers funktioniert.

Nützliche Umgebungsvariablen für den manuellen Launcher:

- `OPENCLAW_PODMAN_CONTAINER` -- Containername (standardmäßig `openclaw`)
- `OPENCLAW_PODMAN_IMAGE` / `OPENCLAW_IMAGE` -- auszuführendes Image
- `OPENCLAW_PODMAN_GATEWAY_HOST_PORT` -- Host-Port, der auf den Container-Port `18789` gemappt wird
- `OPENCLAW_PODMAN_BRIDGE_HOST_PORT` -- Host-Port, der auf den Container-Port `18790` gemappt wird
- `OPENCLAW_PODMAN_PUBLISH_HOST` -- Host-Schnittstelle für veröffentlichte Ports; Standard ist `127.0.0.1`
- `OPENCLAW_GATEWAY_BIND` -- Gateway-Bind-Modus im Container; Standard ist `lan`
- `OPENCLAW_PODMAN_USERNS` -- `keep-id` (Standard), `auto` oder `host`

Der manuelle Launcher liest `~/.openclaw/.env`, bevor Standardwerte für Container/Image finalisiert werden, sodass Sie diese dort persistent speichern können.

Wenn Sie nicht standardmäßige Werte für `OPENCLAW_CONFIG_DIR` oder `OPENCLAW_WORKSPACE_DIR` verwenden, setzen Sie dieselben Variablen sowohl für `./scripts/podman/setup.sh` als auch für spätere Befehle `./scripts/run-openclaw-podman.sh launch`. Der repo-lokale Launcher speichert benutzerdefinierte Pfadüberschreibungen nicht über Shells hinweg.

Hinweis zu Quadlet:

- Der generierte Quadlet-Service behält absichtlich eine feste, gehärtete Standardform: veröffentlichte Ports auf `127.0.0.1`, `--bind lan` im Container und den User-Namespace `keep-id`.
- Er fixiert `OPENCLAW_NO_RESPAWN=1`, `Restart=on-failure` und `TimeoutStartSec=300`.
- Er veröffentlicht sowohl `127.0.0.1:18789:18789` (Gateway) als auch `127.0.0.1:18790:18790` (Bridge).
- Er liest `~/.openclaw/.env` als Laufzeit-`EnvironmentFile` für Werte wie `OPENCLAW_GATEWAY_TOKEN`, nutzt aber nicht die Podman-spezifische Override-Allowlist des manuellen Launchers.
- Wenn Sie benutzerdefinierte Publish-Ports, einen benutzerdefinierten Publish-Host oder andere Container-Run-Flags benötigen, verwenden Sie den manuellen Launcher oder bearbeiten Sie `~/.config/containers/systemd/openclaw.container` direkt und laden Sie dann den Service neu und starten ihn neu.

## Nützliche Befehle

- **Container-Logs:** `podman logs -f openclaw`
- **Container stoppen:** `podman stop openclaw`
- **Container entfernen:** `podman rm -f openclaw`
- **Dashboard-URL über die Host-CLI öffnen:** `openclaw dashboard --no-open`
- **Health/Status über die Host-CLI:** `openclaw gateway status --deep` (RPC-Probe + zusätzliche Service-Prüfung)

## Fehlerbehebung

- **Permission denied (EACCES) bei Konfiguration oder Workspace:** Der Container läuft standardmäßig mit `--userns=keep-id` und `--user <your uid>:<your gid>`. Stellen Sie sicher, dass die Pfade für Konfiguration/Workspace auf dem Host Ihrem aktuellen Benutzer gehören.
- **Gateway-Start blockiert (fehlendes `gateway.mode=local`):** Stellen Sie sicher, dass `~/.openclaw/openclaw.json` existiert und `gateway.mode="local"` setzt. `scripts/podman/setup.sh` erstellt dies, falls es fehlt.
- **CLI-Befehle im Container treffen das falsche Ziel:** Verwenden Sie explizit `openclaw --container <name> ...` oder exportieren Sie `OPENCLAW_CONTAINER=<name>` in Ihrer Shell.
- **`openclaw update` schlägt mit `--container` fehl:** Erwartet. Bauen/pullen Sie das Image neu und starten Sie dann den Container oder den Quadlet-Service neu.
- **Quadlet-Service startet nicht:** Führen Sie `systemctl --user daemon-reload` aus, dann `systemctl --user start openclaw.service`. Auf headless-Systemen benötigen Sie möglicherweise zusätzlich `sudo loginctl enable-linger "$(whoami)"`.
- **SELinux blockiert Bind-Mounts:** Belassen Sie das Standard-Mount-Verhalten; der Launcher fügt unter Linux automatisch `:Z` hinzu, wenn SELinux auf enforcing oder permissive steht.

## Verwandt

- [Docker](/de/install/docker)
- [Gateway-Hintergrundprozess](/de/gateway/background-process)
- [Gateway-Fehlerbehebung](/de/gateway/troubleshooting)
