---
read_when:
    - Sie möchten das Gateway auf einem Linux-Server oder Cloud-VPS ausführen.
    - Sie benötigen eine schnelle Übersicht der Hosting-Anleitungen.
    - Sie möchten allgemeines Linux-Server-Tuning für OpenClaw.
sidebarTitle: Linux Server
summary: OpenClaw auf einem Linux-Server oder Cloud-VPS ausführen — Provider-Auswahl, Architektur und Tuning
title: Linux-Server
x-i18n:
    generated_at: "2026-04-24T07:06:27Z"
    model: gpt-5.4
    provider: openai
    source_hash: ec71c7dcceedc20ecbeb3bdbbb7ea0047c1d1164e8049781171d3bdcac37cf95
    source_path: vps.md
    workflow: 15
---

Führen Sie das OpenClaw Gateway auf einem beliebigen Linux-Server oder Cloud-VPS aus. Diese Seite hilft Ihnen bei der Auswahl eines Providers, erklärt, wie Cloud-Deployments funktionieren, und behandelt allgemeines Linux-Tuning, das überall gilt.

## Einen Provider auswählen

<CardGroup cols={2}>
  <Card title="Railway" href="/de/install/railway">One-Click-Setup im Browser</Card>
  <Card title="Northflank" href="/de/install/northflank">One-Click-Setup im Browser</Card>
  <Card title="DigitalOcean" href="/de/install/digitalocean">Einfacher kostenpflichtiger VPS</Card>
  <Card title="Oracle Cloud" href="/de/install/oracle">Always Free ARM-Tier</Card>
  <Card title="Fly.io" href="/de/install/fly">Fly Machines</Card>
  <Card title="Hetzner" href="/de/install/hetzner">Docker auf Hetzner-VPS</Card>
  <Card title="Hostinger" href="/de/install/hostinger">VPS mit One-Click-Setup</Card>
  <Card title="GCP" href="/de/install/gcp">Compute Engine</Card>
  <Card title="Azure" href="/de/install/azure">Linux-VM</Card>
  <Card title="exe.dev" href="/de/install/exe-dev">VM mit HTTPS-Proxy</Card>
  <Card title="Raspberry Pi" href="/de/install/raspberry-pi">ARM selbst gehostet</Card>
</CardGroup>

**AWS (EC2 / Lightsail / Free Tier)** funktioniert ebenfalls gut.
Eine Video-Anleitung aus der Community ist verfügbar unter
[x.com/techfrenAJ/status/2014934471095812547](https://x.com/techfrenAJ/status/2014934471095812547)
(Community-Ressource -- kann später nicht mehr verfügbar sein).

## So funktionieren Cloud-Setups

- Das **Gateway läuft auf dem VPS** und verwaltet Status + Workspace.
- Sie verbinden sich von Ihrem Laptop oder Smartphone über die **Control UI** oder **Tailscale/SSH**.
- Behandeln Sie den VPS als Quelle der Wahrheit und **sichern** Sie Status + Workspace regelmäßig.
- Sichere Standardeinstellung: Halten Sie das Gateway auf loopback und greifen Sie per SSH-Tunnel oder Tailscale Serve darauf zu.
  Wenn Sie an `lan` oder `tailnet` binden, verlangen Sie `gateway.auth.token` oder `gateway.auth.password`.

Verwandte Seiten: [Gateway remote access](/de/gateway/remote), [Platforms hub](/de/platforms).

## Gemeinsamer Unternehmens-Agent auf einem VPS

Einen einzelnen Agenten für ein Team auszuführen, ist ein gültiges Setup, wenn sich alle Benutzer in derselben Vertrauensgrenze befinden und der Agent nur geschäftlich genutzt wird.

- Halten Sie ihn auf einer dedizierten Runtime (VPS/VM/Container + dedizierter OS-Benutzer/Accounts).
- Melden Sie diese Runtime nicht bei persönlichen Apple-/Google-Konten oder persönlichen Browser-/Passwortmanager-Profilen an.
- Wenn Benutzer sich gegenseitig nicht vertrauen, trennen Sie nach Gateway/Host/OS-Benutzer.

Details zum Sicherheitsmodell: [Security](/de/gateway/security).

## Nodes mit einem VPS verwenden

Sie können das Gateway in der Cloud behalten und **Nodes** auf Ihren lokalen Geräten
(Mac/iOS/Android/headless) koppeln. Nodes stellen lokale Bildschirm-/Kamera-/Canvas- und `system.run`-
Funktionen bereit, während das Gateway in der Cloud bleibt.

Dokumentation: [Nodes](/de/nodes), [Nodes CLI](/de/cli/nodes).

## Startup-Tuning für kleine VMs und ARM-Hosts

Wenn sich CLI-Befehle auf leistungsschwachen VMs (oder ARM-Hosts) langsam anfühlen, aktivieren Sie den Modul-Kompilierungs-Cache von Node:

```bash
grep -q 'NODE_COMPILE_CACHE=/var/tmp/openclaw-compile-cache' ~/.bashrc || cat >> ~/.bashrc <<'EOF'
export NODE_COMPILE_CACHE=/var/tmp/openclaw-compile-cache
mkdir -p /var/tmp/openclaw-compile-cache
export OPENCLAW_NO_RESPAWN=1
EOF
source ~/.bashrc
```

- `NODE_COMPILE_CACHE` verbessert die Startzeiten wiederholter Befehle.
- `OPENCLAW_NO_RESPAWN=1` vermeidet zusätzlichen Startup-Overhead durch einen Self-Respawn-Pfad.
- Der erste Befehlslauf wärmt den Cache auf; nachfolgende Läufe sind schneller.
- Für Raspberry-Pi-spezifische Hinweise siehe [Raspberry Pi](/de/install/raspberry-pi).

### systemd-Tuning-Checkliste (optional)

Für VM-Hosts mit `systemd` sollten Sie Folgendes erwägen:

- Service-Umgebungsvariablen für einen stabilen Startup-Pfad hinzufügen:
  - `OPENCLAW_NO_RESPAWN=1`
  - `NODE_COMPILE_CACHE=/var/tmp/openclaw-compile-cache`
- Restart-Verhalten explizit halten:
  - `Restart=always`
  - `RestartSec=2`
  - `TimeoutStartSec=90`
- Bevorzugen Sie SSD-gestützte Datenträger für Status-/Cache-Pfade, um Cold-Start-Nachteile bei zufälligem I/O zu verringern.

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

Wenn Sie absichtlich stattdessen eine System-Unit installiert haben, bearbeiten Sie
`openclaw-gateway.service` über `sudo systemctl edit openclaw-gateway.service`.

Wie `Restart=`-Richtlinien die automatische Wiederherstellung unterstützen:
[systemd kann die Wiederherstellung von Diensten automatisieren](https://www.redhat.com/en/blog/systemd-automate-recovery).

Zum Linux-OOM-Verhalten, zur Opferauswahl für Child-Prozesse und zur Diagnose von
`exit 137` siehe [Linux memory pressure and OOM kills](/de/platforms/linux#memory-pressure-and-oom-kills).

## Verwandt

- [Installationsübersicht](/de/install)
- [DigitalOcean](/de/install/digitalocean)
- [Fly.io](/de/install/fly)
- [Hetzner](/de/install/hetzner)
