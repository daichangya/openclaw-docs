---
read_when:
    - Sie möchten `openclaw.ai/install.sh` verstehen
    - Sie möchten Installationen automatisieren (CI / headless)
    - Sie möchten aus einem GitHub-Checkout installieren
summary: Wie die Installer-Skripte funktionieren (`install.sh`, `install-cli.sh`, `install.ps1`), Flags und Automatisierung
title: Installer-Interna
x-i18n:
    generated_at: "2026-04-05T12:47:28Z"
    model: gpt-5.4
    provider: openai
    source_hash: eced891572b8825b1f8a26ccc9d105ae8a38bd8ad89baef2f1927e27d4619e04
    source_path: install/installer.md
    workflow: 15
---

# Installer-Interna

OpenClaw liefert drei Installer-Skripte aus, die über `openclaw.ai` bereitgestellt werden.

| Skript                             | Plattform            | Was es macht                                                                                                      |
| ---------------------------------- | -------------------- | ----------------------------------------------------------------------------------------------------------------- |
| [`install.sh`](#installsh)         | macOS / Linux / WSL  | Installiert bei Bedarf Node, installiert OpenClaw über npm (Standard) oder git und kann das Onboarding ausführen. |
| [`install-cli.sh`](#install-clish) | macOS / Linux / WSL  | Installiert Node + OpenClaw in ein lokales Präfix (`~/.openclaw`) mit npm- oder Git-Checkout-Modus. Kein Root erforderlich. |
| [`install.ps1`](#installps1)       | Windows (PowerShell) | Installiert bei Bedarf Node, installiert OpenClaw über npm (Standard) oder git und kann das Onboarding ausführen. |

## Schnelle Befehle

<Tabs>
  <Tab title="install.sh">
    ```bash
    curl -fsSL --proto '=https' --tlsv1.2 https://openclaw.ai/install.sh | bash
    ```

    ```bash
    curl -fsSL --proto '=https' --tlsv1.2 https://openclaw.ai/install.sh | bash -s -- --help
    ```

  </Tab>
  <Tab title="install-cli.sh">
    ```bash
    curl -fsSL --proto '=https' --tlsv1.2 https://openclaw.ai/install-cli.sh | bash
    ```

    ```bash
    curl -fsSL --proto '=https' --tlsv1.2 https://openclaw.ai/install-cli.sh | bash -s -- --help
    ```

  </Tab>
  <Tab title="install.ps1">
    ```powershell
    iwr -useb https://openclaw.ai/install.ps1 | iex
    ```

    ```powershell
    & ([scriptblock]::Create((iwr -useb https://openclaw.ai/install.ps1))) -Tag beta -NoOnboard -DryRun
    ```

  </Tab>
</Tabs>

<Note>
Wenn die Installation erfolgreich war, aber `openclaw` in einem neuen Terminal nicht gefunden wird, siehe [Node.js-Fehlerbehebung](/install/node#troubleshooting).
</Note>

---

<a id="installsh"></a>

## install.sh

<Tip>
Empfohlen für die meisten interaktiven Installationen auf macOS/Linux/WSL.
</Tip>

### Ablauf (install.sh)

<Steps>
  <Step title="Betriebssystem erkennen">
    Unterstützt macOS und Linux (einschließlich WSL). Wenn macOS erkannt wird, wird Homebrew installiert, falls es fehlt.
  </Step>
  <Step title="Standardmäßig Node.js 24 sicherstellen">
    Prüft die Node-Version und installiert bei Bedarf Node 24 (Homebrew auf macOS, NodeSource-Setup-Skripte auf Linux apt/dnf/yum). OpenClaw unterstützt aus Kompatibilitätsgründen weiterhin Node 22 LTS, derzeit `22.14+`.
  </Step>
  <Step title="Git sicherstellen">
    Installiert Git, falls es fehlt.
  </Step>
  <Step title="OpenClaw installieren">
    - `npm`-Methode (Standard): globale npm-Installation
    - `git`-Methode: Repo klonen/aktualisieren, Abhängigkeiten mit pnpm installieren, bauen und dann den Wrapper nach `~/.local/bin/openclaw` installieren
  </Step>
  <Step title="Aufgaben nach der Installation">
    - Aktualisiert einen geladenen Gateway-Dienst nach Best Effort (`openclaw gateway install --force`, dann Neustart)
    - Führt `openclaw doctor --non-interactive` bei Upgrades und Git-Installationen aus (nach Best Effort)
    - Versucht bei Bedarf das Onboarding (TTY verfügbar, Onboarding nicht deaktiviert und Bootstrap-/Konfigurationsprüfungen bestanden)
    - Verwendet standardmäßig `SHARP_IGNORE_GLOBAL_LIBVIPS=1`
  </Step>
</Steps>

### Erkennung eines Quellcode-Checkouts

Wenn das Skript innerhalb eines OpenClaw-Checkouts ausgeführt wird (`package.json` + `pnpm-workspace.yaml`), bietet es an:

- Checkout verwenden (`git`), oder
- globale Installation verwenden (`npm`)

Wenn kein TTY verfügbar ist und keine Installationsmethode gesetzt ist, wird standardmäßig `npm` verwendet und eine Warnung ausgegeben.

Das Skript beendet sich mit Code `2` bei ungültiger Methodenauswahl oder ungültigen `--install-method`-Werten.

### Beispiele (install.sh)

<Tabs>
  <Tab title="Standard">
    ```bash
    curl -fsSL --proto '=https' --tlsv1.2 https://openclaw.ai/install.sh | bash
    ```
  </Tab>
  <Tab title="Onboarding überspringen">
    ```bash
    curl -fsSL --proto '=https' --tlsv1.2 https://openclaw.ai/install.sh | bash -s -- --no-onboard
    ```
  </Tab>
  <Tab title="Git-Installation">
    ```bash
    curl -fsSL --proto '=https' --tlsv1.2 https://openclaw.ai/install.sh | bash -s -- --install-method git
    ```
  </Tab>
  <Tab title="GitHub main über npm">
    ```bash
    curl -fsSL --proto '=https' --tlsv1.2 https://openclaw.ai/install.sh | bash -s -- --version main
    ```
  </Tab>
  <Tab title="Dry Run">
    ```bash
    curl -fsSL --proto '=https' --tlsv1.2 https://openclaw.ai/install.sh | bash -s -- --dry-run
    ```
  </Tab>
</Tabs>

<AccordionGroup>
  <Accordion title="Flag-Referenz">

| Flag                                  | Beschreibung                                                 |
| ------------------------------------- | ------------------------------------------------------------ |
| `--install-method npm\|git`           | Installationsmethode wählen (Standard: `npm`). Alias: `--method` |
| `--npm`                               | Kurzform für die npm-Methode                                 |
| `--git`                               | Kurzform für die Git-Methode. Alias: `--github`              |
| `--version <version\|dist-tag\|spec>` | npm-Version, dist-tag oder Paketspezifikation (Standard: `latest`) |
| `--beta`                              | Beta-dist-tag verwenden, falls verfügbar, sonst Fallback auf `latest` |
| `--git-dir <path>`                    | Checkout-Verzeichnis (Standard: `~/openclaw`). Alias: `--dir` |
| `--no-git-update`                     | `git pull` für vorhandenen Checkout überspringen             |
| `--no-prompt`                         | Eingabeaufforderungen deaktivieren                           |
| `--no-onboard`                        | Onboarding überspringen                                      |
| `--onboard`                           | Onboarding aktivieren                                        |
| `--dry-run`                           | Aktionen ausgeben, ohne Änderungen anzuwenden                |
| `--verbose`                           | Debug-Ausgabe aktivieren (`set -x`, npm-Logs auf notice-Level) |
| `--help`                              | Usage anzeigen (`-h`)                                        |

  </Accordion>

  <Accordion title="Referenz für Umgebungsvariablen">

| Variable                                                | Beschreibung                                 |
| ------------------------------------------------------- | -------------------------------------------- |
| `OPENCLAW_INSTALL_METHOD=git\|npm`                      | Installationsmethode                         |
| `OPENCLAW_VERSION=latest\|next\|main\|<semver>\|<spec>` | npm-Version, dist-tag oder Paketspezifikation |
| `OPENCLAW_BETA=0\|1`                                    | Beta verwenden, falls verfügbar              |
| `OPENCLAW_GIT_DIR=<path>`                               | Checkout-Verzeichnis                         |
| `OPENCLAW_GIT_UPDATE=0\|1`                              | Git-Updates umschalten                       |
| `OPENCLAW_NO_PROMPT=1`                                  | Eingabeaufforderungen deaktivieren           |
| `OPENCLAW_NO_ONBOARD=1`                                 | Onboarding überspringen                      |
| `OPENCLAW_DRY_RUN=1`                                    | Dry-Run-Modus                                |
| `OPENCLAW_VERBOSE=1`                                    | Debug-Modus                                  |
| `OPENCLAW_NPM_LOGLEVEL=error\|warn\|notice`             | npm-Log-Level                                |
| `SHARP_IGNORE_GLOBAL_LIBVIPS=0\|1`                      | Verhalten von sharp/libvips steuern (Standard: `1`) |

  </Accordion>
</AccordionGroup>

---

<a id="install-clish"></a>

## install-cli.sh

<Info>
Entwickelt für Umgebungen, in denen Sie alles unter einem lokalen Präfix
(Standard `~/.openclaw`) und ohne systemweite Node-Abhängigkeit möchten. Unterstützt standardmäßig npm-Installationen
sowie Git-Checkout-Installationen innerhalb desselben Präfix-Ablaufs.
</Info>

### Ablauf (install-cli.sh)

<Steps>
  <Step title="Lokale Node-Laufzeit installieren">
    Lädt ein angeheftetes unterstütztes Node-LTS-Tarball herunter (die Version ist im Skript eingebettet und wird unabhängig aktualisiert) nach `<prefix>/tools/node-v<version>` und prüft SHA-256.
  </Step>
  <Step title="Git sicherstellen">
    Wenn Git fehlt, wird versucht, es unter Linux über apt/dnf/yum oder auf macOS über Homebrew zu installieren.
  </Step>
  <Step title="OpenClaw unter dem Präfix installieren">
    - `npm`-Methode (Standard): installiert mit npm unter dem Präfix und schreibt dann den Wrapper nach `<prefix>/bin/openclaw`
    - `git`-Methode: klont/aktualisiert einen Checkout (Standard `~/openclaw`) und schreibt den Wrapper weiterhin nach `<prefix>/bin/openclaw`
  </Step>
  <Step title="Geladenen Gateway-Dienst aktualisieren">
    Wenn bereits ein Gateway-Dienst aus demselben Präfix geladen ist, führt das Skript
    `openclaw gateway install --force`, dann `openclaw gateway restart` aus und
    prüft den Gateway-Status nach Best Effort.
  </Step>
</Steps>

### Beispiele (install-cli.sh)

<Tabs>
  <Tab title="Standard">
    ```bash
    curl -fsSL --proto '=https' --tlsv1.2 https://openclaw.ai/install-cli.sh | bash
    ```
  </Tab>
  <Tab title="Benutzerdefiniertes Präfix + Version">
    ```bash
    curl -fsSL --proto '=https' --tlsv1.2 https://openclaw.ai/install-cli.sh | bash -s -- --prefix /opt/openclaw --version latest
    ```
  </Tab>
  <Tab title="Git-Installation">
    ```bash
    curl -fsSL --proto '=https' --tlsv1.2 https://openclaw.ai/install-cli.sh | bash -s -- --install-method git --git-dir ~/openclaw
    ```
  </Tab>
  <Tab title="JSON-Ausgabe für Automatisierung">
    ```bash
    curl -fsSL --proto '=https' --tlsv1.2 https://openclaw.ai/install-cli.sh | bash -s -- --json --prefix /opt/openclaw
    ```
  </Tab>
  <Tab title="Onboarding ausführen">
    ```bash
    curl -fsSL --proto '=https' --tlsv1.2 https://openclaw.ai/install-cli.sh | bash -s -- --onboard
    ```
  </Tab>
</Tabs>

<AccordionGroup>
  <Accordion title="Flag-Referenz">

| Flag                        | Beschreibung                                                                    |
| --------------------------- | ------------------------------------------------------------------------------- |
| `--prefix <path>`           | Installationspräfix (Standard: `~/.openclaw`)                                   |
| `--install-method npm\|git` | Installationsmethode wählen (Standard: `npm`). Alias: `--method`                |
| `--npm`                     | Kurzform für die npm-Methode                                                     |
| `--git`, `--github`         | Kurzform für die Git-Methode                                                     |
| `--git-dir <path>`          | Git-Checkout-Verzeichnis (Standard: `~/openclaw`). Alias: `--dir`               |
| `--version <ver>`           | OpenClaw-Version oder dist-tag (Standard: `latest`)                             |
| `--node-version <ver>`      | Node-Version (Standard: `22.22.0`)                                               |
| `--json`                    | NDJSON-Ereignisse ausgeben                                                       |
| `--onboard`                 | Nach der Installation `openclaw onboard` ausführen                              |
| `--no-onboard`              | Onboarding überspringen (Standard)                                               |
| `--set-npm-prefix`          | Unter Linux npm-Präfix auf `~/.npm-global` erzwingen, wenn das aktuelle Präfix nicht beschreibbar ist |
| `--help`                    | Usage anzeigen (`-h`)                                                            |

  </Accordion>

  <Accordion title="Referenz für Umgebungsvariablen">

| Variable                                    | Beschreibung                                   |
| ------------------------------------------- | ---------------------------------------------- |
| `OPENCLAW_PREFIX=<path>`                    | Installationspräfix                            |
| `OPENCLAW_INSTALL_METHOD=git\|npm`          | Installationsmethode                           |
| `OPENCLAW_VERSION=<ver>`                    | OpenClaw-Version oder dist-tag                 |
| `OPENCLAW_NODE_VERSION=<ver>`               | Node-Version                                   |
| `OPENCLAW_GIT_DIR=<path>`                   | Git-Checkout-Verzeichnis für Git-Installationen |
| `OPENCLAW_GIT_UPDATE=0\|1`                  | Git-Updates für vorhandene Checkouts umschalten |
| `OPENCLAW_NO_ONBOARD=1`                     | Onboarding überspringen                        |
| `OPENCLAW_NPM_LOGLEVEL=error\|warn\|notice` | npm-Log-Level                                  |
| `SHARP_IGNORE_GLOBAL_LIBVIPS=0\|1`          | Verhalten von sharp/libvips steuern (Standard: `1`) |

  </Accordion>
</AccordionGroup>

---

<a id="installps1"></a>

## install.ps1

### Ablauf (install.ps1)

<Steps>
  <Step title="PowerShell + Windows-Umgebung sicherstellen">
    Erfordert PowerShell 5+.
  </Step>
  <Step title="Standardmäßig Node.js 24 sicherstellen">
    Falls Node fehlt, wird versucht, es über winget, dann Chocolatey, dann Scoop zu installieren. Node 22 LTS, derzeit `22.14+`, bleibt aus Kompatibilitätsgründen unterstützt.
  </Step>
  <Step title="OpenClaw installieren">
    - `npm`-Methode (Standard): globale npm-Installation mit dem ausgewählten `-Tag`
    - `git`-Methode: Repo klonen/aktualisieren, mit pnpm installieren/bauen und den Wrapper nach `%USERPROFILE%\.local\bin\openclaw.cmd` installieren
  </Step>
  <Step title="Aufgaben nach der Installation">
    - Fügt bei Möglichkeit das benötigte Bin-Verzeichnis zum Benutzer-PATH hinzu
    - Aktualisiert einen geladenen Gateway-Dienst nach Best Effort (`openclaw gateway install --force`, dann Neustart)
    - Führt `openclaw doctor --non-interactive` bei Upgrades und Git-Installationen aus (nach Best Effort)
  </Step>
</Steps>

### Beispiele (install.ps1)

<Tabs>
  <Tab title="Standard">
    ```powershell
    iwr -useb https://openclaw.ai/install.ps1 | iex
    ```
  </Tab>
  <Tab title="Git-Installation">
    ```powershell
    & ([scriptblock]::Create((iwr -useb https://openclaw.ai/install.ps1))) -InstallMethod git
    ```
  </Tab>
  <Tab title="GitHub main über npm">
    ```powershell
    & ([scriptblock]::Create((iwr -useb https://openclaw.ai/install.ps1))) -Tag main
    ```
  </Tab>
  <Tab title="Benutzerdefiniertes Git-Verzeichnis">
    ```powershell
    & ([scriptblock]::Create((iwr -useb https://openclaw.ai/install.ps1))) -InstallMethod git -GitDir "C:\openclaw"
    ```
  </Tab>
  <Tab title="Dry Run">
    ```powershell
    & ([scriptblock]::Create((iwr -useb https://openclaw.ai/install.ps1))) -DryRun
    ```
  </Tab>
  <Tab title="Debug-Trace">
    ```powershell
    # install.ps1 hat derzeit noch kein eigenes -Verbose-Flag.
    Set-PSDebug -Trace 1
    & ([scriptblock]::Create((iwr -useb https://openclaw.ai/install.ps1))) -NoOnboard
    Set-PSDebug -Trace 0
    ```
  </Tab>
</Tabs>

<AccordionGroup>
  <Accordion title="Flag-Referenz">

| Flag                        | Beschreibung                                                 |
| --------------------------- | ------------------------------------------------------------ |
| `-InstallMethod npm\|git`   | Installationsmethode (Standard: `npm`)                       |
| `-Tag <tag\|version\|spec>` | npm-dist-tag, Version oder Paketspezifikation (Standard: `latest`) |
| `-GitDir <path>`            | Checkout-Verzeichnis (Standard: `%USERPROFILE%\openclaw`)    |
| `-NoOnboard`                | Onboarding überspringen                                      |
| `-NoGitUpdate`              | `git pull` überspringen                                      |
| `-DryRun`                   | Nur Aktionen ausgeben                                        |

  </Accordion>

  <Accordion title="Referenz für Umgebungsvariablen">

| Variable                           | Beschreibung         |
| ---------------------------------- | -------------------- |
| `OPENCLAW_INSTALL_METHOD=git\|npm` | Installationsmethode |
| `OPENCLAW_GIT_DIR=<path>`          | Checkout-Verzeichnis |
| `OPENCLAW_NO_ONBOARD=1`            | Onboarding überspringen |
| `OPENCLAW_GIT_UPDATE=0`            | `git pull` deaktivieren |
| `OPENCLAW_DRY_RUN=1`               | Dry-Run-Modus        |

  </Accordion>
</AccordionGroup>

<Note>
Wenn `-InstallMethod git` verwendet wird und Git fehlt, beendet sich das Skript und gibt den Link zu Git for Windows aus.
</Note>

---

## CI und Automatisierung

Verwenden Sie nicht interaktive Flags/Umgebungsvariablen für vorhersehbare Abläufe.

<Tabs>
  <Tab title="install.sh (nicht interaktiv, npm)">
    ```bash
    curl -fsSL --proto '=https' --tlsv1.2 https://openclaw.ai/install.sh | bash -s -- --no-prompt --no-onboard
    ```
  </Tab>
  <Tab title="install.sh (nicht interaktiv, git)">
    ```bash
    OPENCLAW_INSTALL_METHOD=git OPENCLAW_NO_PROMPT=1 \
      curl -fsSL --proto '=https' --tlsv1.2 https://openclaw.ai/install.sh | bash
    ```
  </Tab>
  <Tab title="install-cli.sh (JSON)">
    ```bash
    curl -fsSL --proto '=https' --tlsv1.2 https://openclaw.ai/install-cli.sh | bash -s -- --json --prefix /opt/openclaw
    ```
  </Tab>
  <Tab title="install.ps1 (Onboarding überspringen)">
    ```powershell
    & ([scriptblock]::Create((iwr -useb https://openclaw.ai/install.ps1))) -NoOnboard
    ```
  </Tab>
</Tabs>

---

## Fehlerbehebung

<AccordionGroup>
  <Accordion title="Warum ist Git erforderlich?">
    Git ist für die Installationsmethode `git` erforderlich. Bei `npm`-Installationen wird Git dennoch geprüft/installiert, um Fehler vom Typ `spawn git ENOENT` zu vermeiden, wenn Abhängigkeiten Git-URLs verwenden.
  </Accordion>

  <Accordion title="Warum tritt unter Linux bei npm EACCES auf?">
    Einige Linux-Setups verweisen das globale npm-Präfix auf root-eigene Pfade. `install.sh` kann das Präfix auf `~/.npm-global` umstellen und PATH-Exporte an Shell-RC-Dateien anhängen (wenn diese Dateien existieren).
  </Accordion>

  <Accordion title="sharp/libvips-Probleme">
    Die Skripte setzen standardmäßig `SHARP_IGNORE_GLOBAL_LIBVIPS=1`, damit sharp nicht gegen systemweites libvips gebaut wird. Zum Überschreiben:

    ```bash
    SHARP_IGNORE_GLOBAL_LIBVIPS=0 curl -fsSL --proto '=https' --tlsv1.2 https://openclaw.ai/install.sh | bash
    ```

  </Accordion>

  <Accordion title='Windows: "npm error spawn git / ENOENT"'>
    Installieren Sie Git for Windows, öffnen Sie PowerShell erneut und führen Sie den Installer noch einmal aus.
  </Accordion>

  <Accordion title='Windows: "openclaw is not recognized"'>
    Führen Sie `npm config get prefix` aus und fügen Sie dieses Verzeichnis Ihrem Benutzer-PATH hinzu (unter Windows ohne Suffix `\bin`), dann öffnen Sie PowerShell erneut.
  </Accordion>

  <Accordion title="Windows: wie man ausführliche Installer-Ausgabe erhält">
    `install.ps1` bietet derzeit keinen `-Verbose`-Schalter.
    Verwenden Sie PowerShell-Trace für Diagnosen auf Skriptebene:

    ```powershell
    Set-PSDebug -Trace 1
    & ([scriptblock]::Create((iwr -useb https://openclaw.ai/install.ps1))) -NoOnboard
    Set-PSDebug -Trace 0
    ```

  </Accordion>

  <Accordion title="openclaw nach der Installation nicht gefunden">
    Meist ein PATH-Problem. Siehe [Node.js-Fehlerbehebung](/install/node#troubleshooting).
  </Accordion>
</AccordionGroup>
