---
read_when:
    - Sie möchten einen günstigen, dauerhaft laufenden Linux-Host für das Gateway.
    - Sie möchten Remote-Zugriff auf die Control UI, ohne einen eigenen VPS zu betreiben.
summary: OpenClaw Gateway auf exe.dev ausführen (VM + HTTPS-Proxy) für Remote-Zugriff
title: exe.dev
x-i18n:
    generated_at: "2026-04-24T06:43:53Z"
    model: gpt-5.4
    provider: openai
    source_hash: 0ec992a734dc55c190d5ef3bdd020aa12e9613958a87d8998727264f6f3d3c1f
    source_path: install/exe-dev.md
    workflow: 15
---

Ziel: OpenClaw Gateway auf einer exe.dev-VM ausführen, von Ihrem Laptop erreichbar unter: `https://<vm-name>.exe.xyz`

Diese Seite geht vom Standard-Image **exeuntu** von exe.dev aus. Wenn Sie eine andere Distribution gewählt haben, ordnen Sie die Pakete entsprechend zu.

## Schneller Weg für Einsteiger

1. [https://exe.new/openclaw](https://exe.new/openclaw)
2. Geben Sie Ihren Auth-Schlüssel bzw. Ihr Token nach Bedarf ein
3. Klicken Sie neben Ihrer VM auf „Agent“ und warten Sie, bis Shelley die Bereitstellung abgeschlossen hat
4. Öffnen Sie `https://<vm-name>.exe.xyz/` und authentifizieren Sie sich mit dem konfigurierten Shared Secret (diese Anleitung verwendet standardmäßig Token-Authentifizierung, aber Passwort-Authentifizierung funktioniert auch, wenn Sie `gateway.auth.mode` umstellen)
5. Genehmigen Sie ausstehende Device-Pairing-Anfragen mit `openclaw devices approve <requestId>`

## Was Sie benötigen

- exe.dev-Konto
- `ssh exe.dev`-Zugriff auf virtuelle Maschinen von [exe.dev](https://exe.dev) (optional)

## Automatisierte Installation mit Shelley

Shelley, der Agent von [exe.dev](https://exe.dev), kann OpenClaw sofort mit unserem
Prompt installieren. Der verwendete Prompt lautet wie folgt:

```text
Set up OpenClaw (https://docs.openclaw.ai/install) on this VM. Use the non-interactive and accept-risk flags for openclaw onboarding. Add the supplied auth or token as needed. Configure nginx to forward from the default port 18789 to the root location on the default enabled site config, making sure to enable Websocket support. Pairing is done by "openclaw devices list" and "openclaw devices approve <request id>". Make sure the dashboard shows that OpenClaw's health is OK. exe.dev handles forwarding from port 8000 to port 80/443 and HTTPS for us, so the final "reachable" should be <vm-name>.exe.xyz, without port specification.
```

## Manuelle Installation

## 1) Die VM erstellen

Von Ihrem Gerät aus:

```bash
ssh exe.dev new
```

Dann verbinden:

```bash
ssh <vm-name>.exe.xyz
```

Tipp: Halten Sie diese VM **zustandsbehaftet**. OpenClaw speichert `openclaw.json`, `auth-profiles.json` pro Agent,
Sitzungen und Channel-/Provider-Status unter
`~/.openclaw/` sowie den Workspace unter `~/.openclaw/workspace/`.

## 2) Voraussetzungen installieren (auf der VM)

```bash
sudo apt-get update
sudo apt-get install -y git curl jq ca-certificates openssl
```

## 3) OpenClaw installieren

Führen Sie das OpenClaw-Installationsskript aus:

```bash
curl -fsSL https://openclaw.ai/install.sh | bash
```

## 4) nginx so einrichten, dass OpenClaw auf Port 8000 proxyt

Bearbeiten Sie `/etc/nginx/sites-enabled/default` mit

```text
server {
    listen 80 default_server;
    listen [::]:80 default_server;
    listen 8000;
    listen [::]:8000;

    server_name _;

    location / {
        proxy_pass http://127.0.0.1:18789;
        proxy_http_version 1.1;

        # WebSocket support
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";

        # Standard proxy headers
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $remote_addr;
        proxy_set_header X-Forwarded-Proto $scheme;

        # Timeout settings for long-lived connections
        proxy_read_timeout 86400s;
        proxy_send_timeout 86400s;
    }
}
```

Überschreiben Sie Forwarding-Header, statt vom Client gelieferte Ketten beizubehalten.
OpenClaw vertraut weitergeleiteten IP-Metadaten nur von explizit konfigurierten Proxys,
und `X-Forwarded-For`-Ketten im Append-Stil werden als Härtungsrisiko behandelt.

## 5) Auf OpenClaw zugreifen und Berechtigungen erteilen

Greifen Sie auf `https://<vm-name>.exe.xyz/` zu (siehe die Ausgabe der Control UI aus dem Onboarding). Wenn zur Authentifizierung aufgefordert wird, fügen Sie das
konfigurierte Shared Secret von der VM ein. Diese Anleitung verwendet Token-Authentifizierung, holen Sie also `gateway.auth.token`
mit `openclaw config get gateway.auth.token` ab (oder erzeugen Sie eines mit `openclaw doctor --generate-gateway-token`).
Wenn Sie das Gateway auf Passwort-Authentifizierung umgestellt haben, verwenden Sie stattdessen `gateway.auth.password` / `OPENCLAW_GATEWAY_PASSWORD`.
Genehmigen Sie Geräte mit `openclaw devices list` und `openclaw devices approve <requestId>`. Wenn Sie unsicher sind, verwenden Sie Shelley aus Ihrem Browser!

## Remote-Zugriff

Der Remote-Zugriff wird durch die Authentifizierung von [exe.dev](https://exe.dev) gehandhabt. Standardmäßig wird
HTTP-Verkehr von Port 8000 an `https://<vm-name>.exe.xyz`
mit E-Mail-Authentifizierung weitergeleitet.

## Aktualisieren

```bash
npm i -g openclaw@latest
openclaw doctor
openclaw gateway restart
openclaw health
```

Anleitung: [Updating](/de/install/updating)

## Verwandt

- [Remote gateway](/de/gateway/remote)
- [Install overview](/de/install)
