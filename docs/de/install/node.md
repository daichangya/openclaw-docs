---
read_when:
    - Sie müssen Node.js installieren, bevor Sie OpenClaw installieren
    - Sie haben OpenClaw installiert, aber `openclaw` ergibt command not found
    - '`npm install -g` schlägt wegen Berechtigungen oder PATH-Problemen fehl'
summary: Node.js für OpenClaw installieren und konfigurieren — Versionsanforderungen, Installationsoptionen und PATH-Fehlerbehebung
title: Node.js
x-i18n:
    generated_at: "2026-04-05T12:47:22Z"
    model: gpt-5.4
    provider: openai
    source_hash: 5e880f6132359dba8720638669df2d71cf857d516cbf5df2589ffeed269b5120
    source_path: install/node.md
    workflow: 15
---

# Node.js

OpenClaw erfordert **Node 22.14 oder neuer**. **Node 24 ist die Standard- und empfohlene Laufzeit** für Installationen, CI- und Release-Workflows. Node 22 bleibt über die aktive LTS-Linie unterstützt. Das [Installationsskript](/install#alternative-install-methods) erkennt Node automatisch und installiert es bei Bedarf — diese Seite ist für den Fall gedacht, dass Sie Node selbst einrichten und sicherstellen möchten, dass alles korrekt verdrahtet ist (Versionen, PATH, globale Installationen).

## Version prüfen

```bash
node -v
```

Wenn dies `v24.x.x` oder höher ausgibt, verwenden Sie die empfohlene Standardversion. Wenn `v22.14.x` oder höher ausgegeben wird, verwenden Sie den unterstützten Node-22-LTS-Pfad, wir empfehlen aber dennoch ein Upgrade auf Node 24, sobald es für Sie passt. Wenn Node nicht installiert ist oder die Version zu alt ist, wählen Sie unten eine Installationsmethode.

## Node installieren

<Tabs>
  <Tab title="macOS">
    **Homebrew** (empfohlen):

    ```bash
    brew install node
    ```

    Oder laden Sie das macOS-Installationsprogramm von [nodejs.org](https://nodejs.org/) herunter.

  </Tab>
  <Tab title="Linux">
    **Ubuntu / Debian:**

    ```bash
    curl -fsSL https://deb.nodesource.com/setup_24.x | sudo -E bash -
    sudo apt-get install -y nodejs
    ```

    **Fedora / RHEL:**

    ```bash
    sudo dnf install nodejs
    ```

    Oder verwenden Sie einen Versionsmanager (siehe unten).

  </Tab>
  <Tab title="Windows">
    **winget** (empfohlen):

    ```powershell
    winget install OpenJS.NodeJS.LTS
    ```

    **Chocolatey:**

    ```powershell
    choco install nodejs-lts
    ```

    Oder laden Sie das Windows-Installationsprogramm von [nodejs.org](https://nodejs.org/) herunter.

  </Tab>
</Tabs>

<Accordion title="Einen Versionsmanager verwenden (nvm, fnm, mise, asdf)">
  Versionsmanager erleichtern das Umschalten zwischen Node-Versionen. Beliebte Optionen:

- [**fnm**](https://github.com/Schniz/fnm) — schnell, plattformübergreifend
- [**nvm**](https://github.com/nvm-sh/nvm) — weit verbreitet unter macOS/Linux
- [**mise**](https://mise.jdx.dev/) — polyglott (Node, Python, Ruby usw.)

Beispiel mit fnm:

```bash
fnm install 24
fnm use 24
```

  <Warning>
  Stellen Sie sicher, dass Ihr Versionsmanager in Ihrer Shell-Startdatei (`~/.zshrc` oder `~/.bashrc`) initialisiert wird. Wenn das nicht der Fall ist, wird `openclaw` in neuen Terminal-Sitzungen möglicherweise nicht gefunden, weil der PATH nicht das Binärverzeichnis von Node enthält.
  </Warning>
</Accordion>

## Fehlerbehebung

### `openclaw: command not found`

Das bedeutet fast immer, dass das globale Binärverzeichnis von npm nicht im PATH enthalten ist.

<Steps>
  <Step title="Globales npm-Präfix finden">
    ```bash
    npm prefix -g
    ```
  </Step>
  <Step title="Prüfen, ob es im PATH enthalten ist">
    ```bash
    echo "$PATH"
    ```

    Suchen Sie in der Ausgabe nach `<npm-prefix>/bin` (macOS/Linux) oder `<npm-prefix>` (Windows).

  </Step>
  <Step title="Es zur Shell-Startdatei hinzufügen">
    <Tabs>
      <Tab title="macOS / Linux">
        Zu `~/.zshrc` oder `~/.bashrc` hinzufügen:

        ```bash
        export PATH="$(npm prefix -g)/bin:$PATH"
        ```

        Öffnen Sie dann ein neues Terminal (oder führen Sie `rehash` in zsh / `hash -r` in bash aus).
      </Tab>
      <Tab title="Windows">
        Fügen Sie die Ausgabe von `npm prefix -g` über Settings → System → Environment Variables zu Ihrem System-PATH hinzu.
      </Tab>
    </Tabs>

  </Step>
</Steps>

### Berechtigungsfehler bei `npm install -g` (Linux)

Wenn Sie `EACCES`-Fehler sehen, stellen Sie das globale npm-Präfix auf ein vom Benutzer beschreibbares Verzeichnis um:

```bash
mkdir -p "$HOME/.npm-global"
npm config set prefix "$HOME/.npm-global"
export PATH="$HOME/.npm-global/bin:$PATH"
```

Fügen Sie die Zeile `export PATH=...` zu Ihrer `~/.bashrc` oder `~/.zshrc` hinzu, um sie dauerhaft zu machen.

## Verwandt

- [Install Overview](/install) — alle Installationsmethoden
- [Updating](/install/updating) — OpenClaw aktuell halten
- [Getting Started](/de/start/getting-started) — erste Schritte nach der Installation
