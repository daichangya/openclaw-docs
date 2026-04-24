---
read_when:
    - Sie benötigen eine Installationsmethode jenseits der Schnellstart-Anleitung in „Getting Started“.
    - Sie möchten auf einer Cloud-Plattform bereitstellen.
    - Sie müssen aktualisieren, migrieren oder deinstallieren.
summary: OpenClaw installieren — Installerskript, npm/pnpm/bun, aus dem Source, Docker und mehr
title: Installieren
x-i18n:
    generated_at: "2026-04-24T06:44:52Z"
    model: gpt-5.4
    provider: openai
    source_hash: 48cb531ff09cd9ba076e5a995753c6acd5273f58d9d0f1e51010bf77a18bf85e
    source_path: install/index.md
    workflow: 15
---

## Systemanforderungen

- **Node 24** (empfohlen) oder Node 22.14+ — das Installerskript übernimmt dies automatisch
- **macOS, Linux oder Windows** — sowohl natives Windows als auch WSL2 werden unterstützt; WSL2 ist stabiler. Siehe [Windows](/de/platforms/windows).
- `pnpm` wird nur benötigt, wenn Sie aus dem Source bauen

## Empfohlen: Installerskript

Der schnellste Weg zur Installation. Es erkennt Ihr OS, installiert bei Bedarf Node, installiert OpenClaw und startet das Onboarding.

<Tabs>
  <Tab title="macOS / Linux / WSL2">
    ```bash
    curl -fsSL https://openclaw.ai/install.sh | bash
    ```
  </Tab>
  <Tab title="Windows (PowerShell)">
    ```powershell
    iwr -useb https://openclaw.ai/install.ps1 | iex
    ```
  </Tab>
</Tabs>

So installieren Sie ohne das Onboarding auszuführen:

<Tabs>
  <Tab title="macOS / Linux / WSL2">
    ```bash
    curl -fsSL https://openclaw.ai/install.sh | bash -s -- --no-onboard
    ```
  </Tab>
  <Tab title="Windows (PowerShell)">
    ```powershell
    & ([scriptblock]::Create((iwr -useb https://openclaw.ai/install.ps1))) -NoOnboard
    ```
  </Tab>
</Tabs>

Alle Flags und Optionen für CI/Automatisierung finden Sie unter [Installer internals](/de/install/installer).

## Alternative Installationsmethoden

### Local-Prefix-Installer (`install-cli.sh`)

Verwenden Sie dies, wenn OpenClaw und Node unter einem lokalen Prefix wie
`~/.openclaw` gehalten werden sollen, ohne von einer systemweiten Node-Installation abzuhängen:

```bash
curl -fsSL https://openclaw.ai/install-cli.sh | bash
```

Er unterstützt standardmäßig npm-Installationen sowie Installationen aus einem Git-Checkout im selben
Prefix-Ablauf. Vollständige Referenz: [Installer internals](/de/install/installer#install-clish).

### npm, pnpm oder bun

Wenn Sie Node bereits selbst verwalten:

<Tabs>
  <Tab title="npm">
    ```bash
    npm install -g openclaw@latest
    openclaw onboard --install-daemon
    ```
  </Tab>
  <Tab title="pnpm">
    ```bash
    pnpm add -g openclaw@latest
    pnpm approve-builds -g
    openclaw onboard --install-daemon
    ```

    <Note>
    pnpm erfordert explizite Freigabe für Pakete mit Build-Skripten. Führen Sie nach der ersten Installation `pnpm approve-builds -g` aus.
    </Note>

  </Tab>
  <Tab title="bun">
    ```bash
    bun add -g openclaw@latest
    openclaw onboard --install-daemon
    ```

    <Note>
    Bun wird für den globalen CLI-Installationspfad unterstützt. Für die Gateway-Runtime bleibt Node die empfohlene Daemon-Runtime.
    </Note>

  </Tab>
</Tabs>

<Accordion title="Fehlerbehebung: sharp-Build-Fehler (npm)">
  Wenn `sharp` aufgrund einer global installierten libvips fehlschlägt:

```bash
SHARP_IGNORE_GLOBAL_LIBVIPS=1 npm install -g openclaw@latest
```

</Accordion>

### Aus dem Source

Für Mitwirkende oder alle, die aus einem lokalen Checkout ausführen möchten:

```bash
git clone https://github.com/openclaw/openclaw.git
cd openclaw
pnpm install && pnpm build && pnpm ui:build
pnpm link --global
openclaw onboard --install-daemon
```

Oder überspringen Sie das Linken und verwenden Sie `pnpm openclaw ...` innerhalb des Repos. Siehe [Setup](/de/start/setup) für vollständige Entwicklungsabläufe.

### Von GitHub main installieren

```bash
npm install -g github:openclaw/openclaw#main
```

### Container und Paketmanager

<CardGroup cols={2}>
  <Card title="Docker" href="/de/install/docker" icon="container">
    Containerisierte oder headless-Bereitstellungen.
  </Card>
  <Card title="Podman" href="/de/install/podman" icon="container">
    Rootless-Container-Alternative zu Docker.
  </Card>
  <Card title="Nix" href="/de/install/nix" icon="snowflake">
    Deklarative Installation per Nix-Flake.
  </Card>
  <Card title="Ansible" href="/de/install/ansible" icon="server">
    Automatisierte Bereitstellung von Flotten.
  </Card>
  <Card title="Bun" href="/de/install/bun" icon="zap">
    Nur-CLI-Nutzung über die Bun-Runtime.
  </Card>
</CardGroup>

## Installation verifizieren

```bash
openclaw --version      # bestätigen, dass die CLI verfügbar ist
openclaw doctor         # auf Konfigurationsprobleme prüfen
openclaw gateway status # verifizieren, dass das Gateway läuft
```

Wenn Sie nach der Installation einen verwalteten Start möchten:

- macOS: LaunchAgent über `openclaw onboard --install-daemon` oder `openclaw gateway install`
- Linux/WSL2: systemd-User-Service über dieselben Befehle
- Natives Windows: zuerst Scheduled Task, mit einem Login-Element im Startup-Ordner pro Benutzer als Fallback, falls das Erstellen der Aufgabe abgelehnt wird

## Hosting und Bereitstellung

OpenClaw auf einem Cloud-Server oder VPS bereitstellen:

<CardGroup cols={3}>
  <Card title="VPS" href="/de/vps">Beliebiger Linux-VPS</Card>
  <Card title="Docker VM" href="/de/install/docker-vm-runtime">Gemeinsame Docker-Schritte</Card>
  <Card title="Kubernetes" href="/de/install/kubernetes">K8s</Card>
  <Card title="Fly.io" href="/de/install/fly">Fly.io</Card>
  <Card title="Hetzner" href="/de/install/hetzner">Hetzner</Card>
  <Card title="GCP" href="/de/install/gcp">Google Cloud</Card>
  <Card title="Azure" href="/de/install/azure">Azure</Card>
  <Card title="Railway" href="/de/install/railway">Railway</Card>
  <Card title="Render" href="/de/install/render">Render</Card>
  <Card title="Northflank" href="/de/install/northflank">Northflank</Card>
</CardGroup>

## Aktualisieren, migrieren oder deinstallieren

<CardGroup cols={3}>
  <Card title="Updating" href="/de/install/updating" icon="refresh-cw">
    OpenClaw aktuell halten.
  </Card>
  <Card title="Migrating" href="/de/install/migrating" icon="arrow-right">
    Auf einen neuen Rechner umziehen.
  </Card>
  <Card title="Uninstall" href="/de/install/uninstall" icon="trash-2">
    OpenClaw vollständig entfernen.
  </Card>
</CardGroup>

## Fehlerbehebung: `openclaw` nicht gefunden

Wenn die Installation erfolgreich war, `openclaw` aber im Terminal nicht gefunden wird:

```bash
node -v           # Node installiert?
npm prefix -g     # Wo liegen globale Pakete?
echo "$PATH"      # Ist das globale bin-Verzeichnis in PATH?
```

Wenn `$(npm prefix -g)/bin` nicht in Ihrem `$PATH` ist, fügen Sie es zu Ihrer Shell-Startdatei hinzu (`~/.zshrc` oder `~/.bashrc`):

```bash
export PATH="$(npm prefix -g)/bin:$PATH"
```

Öffnen Sie dann ein neues Terminal. Siehe [Node setup](/de/install/node) für weitere Details.
