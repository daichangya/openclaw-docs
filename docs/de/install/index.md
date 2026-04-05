---
read_when:
    - Sie benötigen eine Installationsmethode, die nicht der Schnellstart unter Getting Started ist
    - Sie möchten auf einer Cloud-Plattform bereitstellen
    - Sie müssen aktualisieren, migrieren oder deinstallieren
summary: OpenClaw installieren — Installationsskript, npm/pnpm/bun, aus dem Source, Docker und mehr
title: Installieren
x-i18n:
    generated_at: "2026-04-05T12:46:39Z"
    model: gpt-5.4
    provider: openai
    source_hash: eca17c76a2a66166b3d8cda9dc3144ab920d30ad0ed2a220eb9389d7a383ba5d
    source_path: install/index.md
    workflow: 15
---

# Installieren

## Empfohlen: Installationsskript

Der schnellste Weg zur Installation. Es erkennt Ihr Betriebssystem, installiert bei Bedarf Node, installiert OpenClaw und startet das Onboarding.

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

So installieren Sie, ohne das Onboarding auszuführen:

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

Für alle Flags und Optionen für CI/Automatisierung siehe [Installer internals](/install/installer).

## Systemanforderungen

- **Node 24** (empfohlen) oder Node 22.14+ — das Installationsskript übernimmt dies automatisch
- **macOS, Linux oder Windows** — sowohl natives Windows als auch WSL2 werden unterstützt; WSL2 ist stabiler. Siehe [Windows](/platforms/windows).
- `pnpm` wird nur benötigt, wenn Sie aus dem Source bauen

## Alternative Installationsmethoden

### Installer mit lokalem Präfix (`install-cli.sh`)

Verwenden Sie dies, wenn OpenClaw und Node unter einem lokalen Präfix wie
`~/.openclaw` gehalten werden sollen, ohne von einer systemweiten Node-Installation abzuhängen:

```bash
curl -fsSL https://openclaw.ai/install-cli.sh | bash
```

Standardmäßig werden npm-Installationen unterstützt sowie Installationen aus einem Git-Checkout innerhalb desselben
Präfix-Ablaufs. Vollständige Referenz: [Installer internals](/install/installer#install-clish).

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
    pnpm erfordert eine explizite Genehmigung für Pakete mit Build-Skripten. Führen Sie nach der ersten Installation `pnpm approve-builds -g` aus.
    </Note>

  </Tab>
  <Tab title="bun">
    ```bash
    bun add -g openclaw@latest
    openclaw onboard --install-daemon
    ```

    <Note>
    Bun wird für den globalen CLI-Installationspfad unterstützt. Für die Gateway-Laufzeit bleibt Node die empfohlene Daemon-Laufzeit.
    </Note>

  </Tab>
</Tabs>

<Accordion title="Fehlerbehebung: sharp-Build-Fehler (npm)">
  Wenn `sharp` aufgrund eines global installierten libvips fehlschlägt:

```bash
SHARP_IGNORE_GLOBAL_LIBVIPS=1 npm install -g openclaw@latest
```

</Accordion>

### Aus dem Source

Für Mitwirkende oder alle, die aus einem lokalen Checkout ausführen möchten:

```bash
git clone https://github.com/openclaw/openclaw.git
cd openclaw
pnpm install && pnpm ui:build && pnpm build
pnpm link --global
openclaw onboard --install-daemon
```

Oder überspringen Sie das Linken und verwenden Sie `pnpm openclaw ...` innerhalb des Repos. Siehe [Setup](/start/setup) für vollständige Entwicklungs-Workflows.

### Von GitHub `main` installieren

```bash
npm install -g github:openclaw/openclaw#main
```

### Container und Paketmanager

<CardGroup cols={2}>
  <Card title="Docker" href="/install/docker" icon="container">
    Containerisierte oder Headless-Bereitstellungen.
  </Card>
  <Card title="Podman" href="/install/podman" icon="container">
    Rootless-Container-Alternative zu Docker.
  </Card>
  <Card title="Nix" href="/install/nix" icon="snowflake">
    Deklarative Installation über Nix Flake.
  </Card>
  <Card title="Ansible" href="/install/ansible" icon="server">
    Automatisierte Bereitstellung von Flotten.
  </Card>
  <Card title="Bun" href="/install/bun" icon="zap">
    Nur-CLI-Nutzung über die Bun-Laufzeit.
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
- Linux/WSL2: systemd-Benutzerdienst über dieselben Befehle
- Natives Windows: zuerst Scheduled Task, mit einem Login-Eintrag im Startup-Ordner pro Benutzer als Fallback, wenn das Erstellen der Aufgabe verweigert wird

## Hosting und Bereitstellung

Stellen Sie OpenClaw auf einem Cloud-Server oder VPS bereit:

<CardGroup cols={3}>
  <Card title="VPS" href="/vps">Beliebiger Linux-VPS</Card>
  <Card title="Docker VM" href="/install/docker-vm-runtime">Gemeinsame Docker-Schritte</Card>
  <Card title="Kubernetes" href="/install/kubernetes">K8s</Card>
  <Card title="Fly.io" href="/install/fly">Fly.io</Card>
  <Card title="Hetzner" href="/install/hetzner">Hetzner</Card>
  <Card title="GCP" href="/install/gcp">Google Cloud</Card>
  <Card title="Azure" href="/install/azure">Azure</Card>
  <Card title="Railway" href="/install/railway">Railway</Card>
  <Card title="Render" href="/install/render">Render</Card>
  <Card title="Northflank" href="/install/northflank">Northflank</Card>
</CardGroup>

## Aktualisieren, migrieren oder deinstallieren

<CardGroup cols={3}>
  <Card title="Aktualisieren" href="/install/updating" icon="refresh-cw">
    OpenClaw aktuell halten.
  </Card>
  <Card title="Migrieren" href="/install/migrating" icon="arrow-right">
    Auf einen neuen Rechner umziehen.
  </Card>
  <Card title="Deinstallieren" href="/install/uninstall" icon="trash-2">
    OpenClaw vollständig entfernen.
  </Card>
</CardGroup>

## Fehlerbehebung: `openclaw` nicht gefunden

Wenn die Installation erfolgreich war, aber `openclaw` in Ihrem Terminal nicht gefunden wird:

```bash
node -v           # Ist Node installiert?
npm prefix -g     # Wo befinden sich globale Pakete?
echo "$PATH"      # Ist das globale bin-Verzeichnis in PATH?
```

Wenn `$(npm prefix -g)/bin` nicht in Ihrem `$PATH` ist, fügen Sie es Ihrer Shell-Startdatei hinzu (`~/.zshrc` oder `~/.bashrc`):

```bash
export PATH="$(npm prefix -g)/bin:$PATH"
```

Öffnen Sie danach ein neues Terminal. Siehe [Node setup](/install/node) für weitere Details.
