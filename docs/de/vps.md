---
read_when:
    - Sie möchten das Gateway auf einem Linux-Server oder Cloud-VPS ausführen
    - Sie benötigen einen schnellen Überblick über Hosting-Anleitungen
    - Sie möchten allgemeines Linux-Server-Tuning für OpenClaw
sidebarTitle: Linux Server
summary: OpenClaw auf einem Linux-Server oder Cloud-VPS ausführen — Provider-Auswahl, Architektur und Tuning
title: Linux-Server
x-i18n:
    generated_at: "2026-04-05T12:59:11Z"
    model: gpt-5.4
    provider: openai
    source_hash: 7f2f26bbc116841a29055850ed5f491231554b90539bcbf91a6b519875d494fb
    source_path: vps.md
    workflow: 15
---

# Linux-Server

Führen Sie das OpenClaw-Gateway auf einem beliebigen Linux-Server oder Cloud-VPS aus. Diese Seite hilft Ihnen
bei der Auswahl eines Providers, erklärt, wie Cloud-Bereitstellungen funktionieren, und behandelt allgemeines Linux-
Tuning, das überall gilt.

## Einen Provider auswählen

<CardGroup cols={2}>
  <Card title="Railway" href="/de/install/railway">Ein-Klick-Einrichtung im Browser</Card>
  <Card title="Northflank" href="/de/install/northflank">Ein-Klick-Einrichtung im Browser</Card>
  <Card title="DigitalOcean" href="/de/install/digitalocean">Einfacher kostenpflichtiger VPS</Card>
  <Card title="Oracle Cloud" href="/de/install/oracle">Always Free ARM tier</Card>
  <Card title="Fly.io" href="/de/install/fly">Fly Machines</Card>
  <Card title="Hetzner" href="/de/install/hetzner">Docker auf einem Hetzner-VPS</Card>
  <Card title="GCP" href="/de/install/gcp">Compute Engine</Card>
  <Card title="Azure" href="/de/install/azure">Linux-VM</Card>
  <Card title="exe.dev" href="/de/install/exe-dev">VM mit HTTPS-Proxy</Card>
  <Card title="Raspberry Pi" href="/de/install/raspberry-pi">ARM selbst gehostet</Card>
</CardGroup>

**AWS (EC2 / Lightsail / kostenlose Stufe)** funktioniert ebenfalls gut.
Eine Community-Videoanleitung ist verfügbar unter
[x.com/techfrenAJ/status/2014934471095812547](https://x.com/techfrenAJ/status/2014934471095812547)
(Community-Ressource -- möglicherweise später nicht mehr verfügbar).

## So funktionieren Cloud-Setups

- Das **Gateway läuft auf dem VPS** und verwaltet Status + Workspace.
- Sie verbinden sich von Ihrem Laptop oder Telefon über die **Control UI** oder **Tailscale/SSH**.
- Behandeln Sie den VPS als Quelle der Wahrheit und **sichern Sie** Status + Workspace regelmäßig.
- Sichere Standardeinstellung: Lassen Sie das Gateway auf loopback laufen und greifen Sie über einen SSH-Tunnel oder Tailscale Serve darauf zu.
  Wenn Sie an `lan` oder `tailnet` binden, verlangen Sie `gateway.auth.token` oder `gateway.auth.password`.

Verwandte Seiten: [Remote-Zugriff auf das Gateway](/de/gateway/remote), [Plattformen-Hub](/de/platforms).

## Gemeinsamer Unternehmens-Agent auf einem VPS

Einen einzelnen Agenten für ein Team auszuführen ist ein gültiges Setup, wenn sich alle Benutzer innerhalb derselben Vertrauensgrenze befinden und der Agent ausschließlich geschäftlich verwendet wird.

- Betreiben Sie ihn auf einer dedizierten Runtime (VPS/VM/Container + dedizierter OS-Benutzer/Accounts).
- Melden Sie diese Runtime nicht bei persönlichen Apple-/Google-Konten oder persönlichen Browser-/Passwort-Manager-Profilen an.
- Wenn Benutzer einander gegenüber adversarial sind, trennen Sie nach Gateway/Host/OS-Benutzer.

Details zum Sicherheitsmodell: [Sicherheit](/de/gateway/security).

## Nodes mit einem VPS verwenden

Sie können das Gateway in der Cloud belassen und **nodes** auf Ihren lokalen Geräten koppeln
(Mac/iOS/Android/headless). Nodes bieten lokale Bildschirm-/Kamera-/Canvas- und `system.run`-
Funktionen, während das Gateway in der Cloud bleibt.

Docs: [Nodes](/de/nodes), [Nodes CLI](/cli/nodes).

## Start-Tuning für kleine VMs und ARM-Hosts

Wenn sich CLI-Befehle auf leistungsschwachen VMs (oder ARM-Hosts) langsam anfühlen, aktivieren Sie den Module Compile Cache von Node:

```bash
grep -q 'NODE_COMPILE_CACHE=/var/tmp/openclaw-compile-cache' ~/.bashrc || cat >> ~/.bashrc <<'EOF'
export NODE_COMPILE_CACHE=/var/tmp/openclaw-compile-cache
mkdir -p /var/tmp/openclaw-compile-cache
export OPENCLAW_NO_RESPAWN=1
EOF
source ~/.bashrc
```

- `NODE_COMPILE_CACHE` verbessert die Startzeiten bei wiederholten Befehlen.
- `OPENCLAW_NO_RESPAWN=1` vermeidet zusätzlichen Start-Overhead durch einen Self-Respawn-Pfad.
- Der erste Befehlslauf wärmt den Cache auf; nachfolgende Läufe sind schneller.
- Für Raspberry-Pi-spezifische Hinweise siehe [Raspberry Pi](/de/install/raspberry-pi).

### systemd-Tuning-Checkliste (optional)

Für VM-Hosts mit `systemd` sollten Sie Folgendes erwägen:

- Service-Umgebungsvariablen für einen stabilen Startpfad hinzufügen:
  - `OPENCLAW_NO_RESPAWN=1`
  - `NODE_COMPILE_CACHE=/var/tmp/openclaw-compile-cache`
- Neustartverhalten explizit festlegen:
  - `Restart=always`
  - `RestartSec=2`
  - `TimeoutStartSec=90`
- Bevorzugen Sie SSD-gestützte Datenträger für Status-/Cache-Pfade, um Zufalls-I/O-Strafen bei Kaltstarts zu reduzieren.

Für den Standardpfad `openclaw onboard --install-daemon` bearbeiten Sie die User-Unit:

```bash
systemctl --user edit openclaw-gateway.service
```

```ini
[Service]
Environment=OPENCLAW_NO_RESPAWN=1
Environment=NODE_COMPILE_CACHE=/var/tmp/openclaw-compile-cache
Restart=always
RestartSec=2
TimeoutStartSec=90
```

Wenn Sie stattdessen absichtlich eine System-Unit installiert haben, bearbeiten Sie
`openclaw-gateway.service` über `sudo systemctl edit openclaw-gateway.service`.

So helfen `Restart=`-Richtlinien bei der automatisierten Wiederherstellung:
[systemd kann die Dienstwiederherstellung automatisieren](https://www.redhat.com/en/blog/systemd-automate-recovery).
