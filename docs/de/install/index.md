---
read_when:
    - Du benötigst eine Installationsmethode, die nicht der Schnellstart aus „Getting Started“ ist.
    - Du möchtest auf einer Cloud-Plattform bereitstellen.
    - Du musst aktualisieren, migrieren oder deinstallieren.
summary: OpenClaw installieren — Installationsskript, npm/pnpm/bun, aus dem Quellcode, Docker und mehr
title: Installieren
x-i18n:
    generated_at: "2026-04-20T06:29:45Z"
    model: gpt-5.4
    provider: openai
    source_hash: ad0a5fdbbf13dcaf2fed6840f35aa22b2e9e458509509f98303c8d87c2556a6f
    source_path: install/index.md
    workflow: 15
---

# Installieren

## Empfohlen: Installationsskript

Der schnellste Weg zur Installation. Es erkennt dein Betriebssystem, installiert bei Bedarf Node, installiert OpenClaw und startet das Onboarding.

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

So installierst du, ohne das Onboarding auszuführen:

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

Alle Flags sowie Optionen für CI/Automatisierung findest du unter [Installer internals](/de/install/installer).

## Systemanforderungen

- **Node 24** (empfohlen) oder Node 22.14+ — das Installationsskript übernimmt dies automatisch
- **macOS, Linux oder Windows** — sowohl natives Windows als auch WSL2 werden unterstützt; WSL2 ist stabiler. Siehe [Windows](/de/platforms/windows).
- `pnpm` wird nur benötigt, wenn du aus dem Quellcode baust

## Alternative Installationsmethoden

### Lokaler Präfix-Installer (`install-cli.sh`)

Verwende dies, wenn du OpenClaw und Node unter einem lokalen Präfix wie
`~/.openclaw` behalten möchtest, ohne von einer systemweiten Node-Installation abhängig zu sein:

```bash
curl -fsSL https://openclaw.ai/install-cli.sh | bash
```

Standardmäßig unterstützt es npm-Installationen sowie Installationen aus einem Git-Checkout innerhalb desselben
Präfix-Ablaufs. Vollständige Referenz: [Installer internals](/de/install/installer#install-clish).

### npm, pnpm oder bun

Wenn du Node bereits selbst verwaltest:

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
    pnpm erfordert eine ausdrückliche Genehmigung für Pakete mit Build-Skripten. Führe nach der ersten Installation `pnpm approve-builds -g` aus.
    </Note>

  </Tab>
  <Tab title="bun">
    ```bash
    bun add -g openclaw@latest
    openclaw onboard --install-daemon
    ```

    <Note>
    Bun wird für den globalen CLI-Installationspfad unterstützt. Für die Gateway-Laufzeit bleibt Node die empfohlene Laufzeit für den Daemon.
    </Note>

  </Tab>
</Tabs>

<Accordion title="Fehlerbehebung: sharp-Build-Fehler (npm)">
  Wenn `sharp` aufgrund eines global installierten libvips fehlschlägt:

```bash
SHARP_IGNORE_GLOBAL_LIBVIPS=1 npm install -g openclaw@latest
```

</Accordion>

### Aus dem Quellcode

Für Mitwirkende oder alle, die aus einem lokalen Checkout ausführen möchten:

```bash
git clone https://github.com/openclaw/openclaw.git
cd openclaw
pnpm install && pnpm build && pnpm ui:build
pnpm link --global
openclaw onboard --install-daemon
```

Oder überspringe das Linken und verwende `pnpm openclaw ...` innerhalb des Repositorys. Vollständige Entwicklungsabläufe findest du unter [Setup](/de/start/setup).

### Von GitHub main installieren

```bash
npm install -g github:openclaw/openclaw#main
```

### Container und Paketmanager

<CardGroup cols={2}>
  <Card title="Docker" href="/de/install/docker" icon="container">
    Containerisierte oder Headless-Bereitstellungen.
  </Card>
  <Card title="Podman" href="/de/install/podman" icon="container">
    Rootless-Container-Alternative zu Docker.
  </Card>
  <Card title="Nix" href="/de/install/nix" icon="snowflake">
    Deklarative Installation über Nix Flake.
  </Card>
  <Card title="Ansible" href="/de/install/ansible" icon="server">
    Automatisierte Bereitstellung für ganze Flotten.
  </Card>
  <Card title="Bun" href="/de/install/bun" icon="zap">
    Reine CLI-Nutzung über die Bun-Laufzeit.
  </Card>
</CardGroup>

## Installation überprüfen

```bash
openclaw --version      # bestätigen, dass die CLI verfügbar ist
openclaw doctor         # auf Konfigurationsprobleme prüfen
openclaw gateway status # überprüfen, ob das Gateway läuft
```

Wenn du nach der Installation einen verwalteten Start möchtest:

- macOS: LaunchAgent über `openclaw onboard --install-daemon` oder `openclaw gateway install`
- Linux/WSL2: systemd-Benutzerdienst über dieselben Befehle
- Natives Windows: zuerst Scheduled Task, mit einem Anmeldeobjekt im benutzerspezifischen Startup-Ordner als Ausweichlösung, falls die Erstellung der Aufgabe verweigert wird

## Hosting und Bereitstellung

Stelle OpenClaw auf einem Cloud-Server oder VPS bereit:

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
  <Card title="Aktualisieren" href="/de/install/updating" icon="refresh-cw">
    OpenClaw auf dem neuesten Stand halten.
  </Card>
  <Card title="Migrieren" href="/de/install/migrating" icon="arrow-right">
    Auf einen neuen Rechner umziehen.
  </Card>
  <Card title="Deinstallieren" href="/de/install/uninstall" icon="trash-2">
    OpenClaw vollständig entfernen.
  </Card>
</CardGroup>

## Fehlerbehebung: `openclaw` nicht gefunden

Wenn die Installation erfolgreich war, `openclaw` aber in deinem Terminal nicht gefunden wird:

```bash
node -v           # Node installiert?
npm prefix -g     # Wo liegen globale Pakete?
echo "$PATH"      # Ist das globale bin-Verzeichnis in PATH?
```

Wenn `$(npm prefix -g)/bin` nicht in deinem `$PATH` ist, füge es deiner Shell-Startdatei hinzu (`~/.zshrc` oder `~/.bashrc`):

```bash
export PATH="$(npm prefix -g)/bin:$PATH"
```

Öffne dann ein neues Terminal. Weitere Details findest du unter [Node setup](/de/install/node).
