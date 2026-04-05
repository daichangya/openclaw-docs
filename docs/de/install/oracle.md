---
read_when:
    - OpenClaw auf Oracle Cloud einrichten
    - Nach kostenlosem VPS-Hosting für OpenClaw suchen
    - OpenClaw rund um die Uhr auf einem kleinen Server betreiben
summary: OpenClaw auf der Always-Free-ARM-Stufe von Oracle Cloud hosten
title: Oracle Cloud
x-i18n:
    generated_at: "2026-04-05T12:47:41Z"
    model: gpt-5.4
    provider: openai
    source_hash: 6915f8c428cfcbc215ba6547273df6e7b93212af6590827a3853f15617ba245e
    source_path: install/oracle.md
    workflow: 15
---

# Oracle Cloud

Führen Sie ein persistentes OpenClaw-Gateway auf der **Always Free**-ARM-Stufe von Oracle Cloud aus (bis zu 4 OCPU, 24 GB RAM, 200 GB Speicher) — kostenlos.

## Voraussetzungen

- Oracle-Cloud-Konto ([signup](https://www.oracle.com/cloud/free/)) -- siehe [Community-Anmeldeleitfaden](https://gist.github.com/rssnyder/51e3cfedd730e7dd5f4a816143b25dbd), wenn Probleme auftreten
- Tailscale-Konto (kostenlos auf [tailscale.com](https://tailscale.com))
- Ein SSH-Schlüsselpaar
- Etwa 30 Minuten

## Einrichtung

<Steps>
  <Step title="Eine OCI-Instanz erstellen">
    1. Melden Sie sich bei der [Oracle Cloud Console](https://cloud.oracle.com/) an.
    2. Navigieren Sie zu **Compute > Instances > Create Instance**.
    3. Konfigurieren Sie:
       - **Name:** `openclaw`
       - **Image:** Ubuntu 24.04 (aarch64)
       - **Shape:** `VM.Standard.A1.Flex` (Ampere ARM)
       - **OCPUs:** 2 (oder bis zu 4)
       - **Memory:** 12 GB (oder bis zu 24 GB)
       - **Boot volume:** 50 GB (bis zu 200 GB kostenlos)
       - **SSH key:** Ihren öffentlichen Schlüssel hinzufügen
    4. Klicken Sie auf **Create** und notieren Sie sich die öffentliche IP-Adresse.

    <Tip>
    Wenn das Erstellen der Instanz mit „Out of capacity“ fehlschlägt, versuchen Sie es mit einer anderen Availability Domain oder später erneut. Die Kapazität der Free Tier ist begrenzt.
    </Tip>

  </Step>

  <Step title="Verbinden und das System aktualisieren">
    ```bash
    ssh ubuntu@YOUR_PUBLIC_IP

    sudo apt update && sudo apt upgrade -y
    sudo apt install -y build-essential
    ```

    `build-essential` ist für die ARM-Kompilierung einiger Abhängigkeiten erforderlich.

  </Step>

  <Step title="Benutzer und Hostname konfigurieren">
    ```bash
    sudo hostnamectl set-hostname openclaw
    sudo passwd ubuntu
    sudo loginctl enable-linger ubuntu
    ```

    Das Aktivieren von Linger sorgt dafür, dass Benutzer-Services auch nach dem Abmelden weiterlaufen.

  </Step>

  <Step title="Tailscale installieren">
    ```bash
    curl -fsSL https://tailscale.com/install.sh | sh
    sudo tailscale up --ssh --hostname=openclaw
    ```

    Ab jetzt verbinden Sie sich über Tailscale: `ssh ubuntu@openclaw`.

  </Step>

  <Step title="OpenClaw installieren">
    ```bash
    curl -fsSL https://openclaw.ai/install.sh | bash
    source ~/.bashrc
    ```

    Wenn die Aufforderung „How do you want to hatch your bot?“ erscheint, wählen Sie **Do this later**.

  </Step>

  <Step title="Das Gateway konfigurieren">
    Verwenden Sie Token-Auth mit Tailscale Serve für sicheren Fernzugriff.

    ```bash
    openclaw config set gateway.bind loopback
    openclaw config set gateway.auth.mode token
    openclaw doctor --generate-gateway-token
    openclaw config set gateway.tailscale.mode serve
    openclaw config set gateway.trustedProxies '["127.0.0.1"]'

    systemctl --user restart openclaw-gateway.service
    ```

    `gateway.trustedProxies=["127.0.0.1"]` ist hier nur für die Behandlung von weitergeleiteten IPs/lokalen Clients des lokalen Tailscale-Serve-Proxys. Es ist **nicht** `gateway.auth.mode: "trusted-proxy"`. Diff-Viewer-Routen behalten in diesem Setup ein Fail-Closed-Verhalten: rohe Viewer-Anfragen von `127.0.0.1` ohne weitergeleitete Proxy-Header können `Diff not found` zurückgeben. Verwenden Sie `mode=file` / `mode=both` für Anhänge, oder aktivieren Sie bewusst Remote-Viewer und setzen Sie `plugins.entries.diffs.config.viewerBaseUrl` (oder übergeben Sie eine Proxy-`baseUrl`), wenn Sie teilbare Viewer-Links benötigen.

  </Step>

  <Step title="VCN-Sicherheit absichern">
    Blockieren Sie allen Datenverkehr außer Tailscale am Netzwerkrand:

    1. Gehen Sie in der OCI Console zu **Networking > Virtual Cloud Networks**.
    2. Klicken Sie auf Ihr VCN und dann auf **Security Lists > Default Security List**.
    3. **Entfernen** Sie alle Ingress-Regeln außer `0.0.0.0/0 UDP 41641` (Tailscale).
    4. Behalten Sie die Standard-Egress-Regeln bei (alle ausgehenden Verbindungen erlauben).

    Dadurch werden SSH auf Port 22, HTTP, HTTPS und alles andere am Netzwerkrand blockiert. Ab diesem Punkt können Sie sich nur noch über Tailscale verbinden.

  </Step>

  <Step title="Prüfen">
    ```bash
    openclaw --version
    systemctl --user status openclaw-gateway.service
    tailscale serve status
    curl http://localhost:18789
    ```

    Greifen Sie von jedem Gerät in Ihrem Tailnet auf die Control UI zu:

    ```
    https://openclaw.<tailnet-name>.ts.net/
    ```

    Ersetzen Sie `<tailnet-name>` durch Ihren Tailnet-Namen (sichtbar in `tailscale status`).

  </Step>
</Steps>

## Fallback: SSH-Tunnel

Wenn Tailscale Serve nicht funktioniert, verwenden Sie einen SSH-Tunnel von Ihrem lokalen Rechner aus:

```bash
ssh -L 18789:127.0.0.1:18789 ubuntu@openclaw
```

Öffnen Sie dann `http://localhost:18789`.

## Fehlerbehebung

**Das Erstellen der Instanz schlägt fehl („Out of capacity“)** -- Free-Tier-ARM-Instanzen sind beliebt. Versuchen Sie es mit einer anderen Availability Domain oder erneut außerhalb der Spitzenzeiten.

**Tailscale verbindet sich nicht** -- Führen Sie `sudo tailscale up --ssh --hostname=openclaw --reset` aus, um die Authentifizierung erneut durchzuführen.

**Das Gateway startet nicht** -- Führen Sie `openclaw doctor --non-interactive` aus und prüfen Sie die Logs mit `journalctl --user -u openclaw-gateway.service -n 50`.

**Probleme mit ARM-Binärdateien** -- Die meisten npm-Pakete funktionieren auf ARM64. Suchen Sie bei nativen Binärdateien nach Releases für `linux-arm64` oder `aarch64`. Prüfen Sie die Architektur mit `uname -m`.

## Nächste Schritte

- [Channels](/channels) -- Telegram, WhatsApp, Discord und mehr verbinden
- [Gateway configuration](/gateway/configuration) -- alle Konfigurationsoptionen
- [Updating](/install/updating) -- OpenClaw aktuell halten
