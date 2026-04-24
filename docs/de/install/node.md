---
read_when:
    - Sie müssen Node.js installieren, bevor Sie OpenClaw installieren
    - Sie haben OpenClaw installiert, aber `openclaw` ist als Befehl nicht gefunden verfügbar
    - '`npm install -g` schlägt wegen Berechtigungen oder PATH-Problemen fehl'
summary: Node.js für OpenClaw installieren und konfigurieren — Versionsanforderungen, Installationsoptionen und Fehlerbehebung bei PATH
title: Node.js
x-i18n:
    generated_at: "2026-04-24T06:45:14Z"
    model: gpt-5.4
    provider: openai
    source_hash: 99c72b917fa8beba136ee6010799c0183cff8b2420b5a1bd256d9155e50f065a
    source_path: install/node.md
    workflow: 15
---

OpenClaw erfordert **Node 22.14 oder neuer**. **Node 24 ist die standardmäßige und empfohlene Laufzeitumgebung** für Installationen, CI und Release-Workflows. Node 22 bleibt über den aktiven LTS-Zweig unterstützt. Das [Installationsskript](/de/install#alternative-install-methods) erkennt Node automatisch und installiert es bei Bedarf — diese Seite ist für den Fall gedacht, dass Sie Node selbst einrichten und sicherstellen möchten, dass alles korrekt verdrahtet ist (Versionen, PATH, globale Installationen).

## Version prüfen

```bash
node -v
```

Wenn dies `v24.x.x` oder höher ausgibt, verwenden Sie den empfohlenen Standard. Wenn `v22.14.x` oder höher ausgegeben wird, befinden Sie sich auf dem unterstützten Node-22-LTS-Pfad, wir empfehlen aber weiterhin ein Upgrade auf Node 24, sobald es für Sie passt. Wenn Node nicht installiert ist oder die Version zu alt ist, wählen Sie unten eine Installationsmethode.

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
  Mit Versionsmanagern können Sie einfach zwischen Node-Versionen wechseln. Beliebte Optionen:

- [**fnm**](https://github.com/Schniz/fnm) — schnell, plattformübergreifend
- [**nvm**](https://github.com/nvm-sh/nvm) — weit verbreitet auf macOS/Linux
- [**mise**](https://mise.jdx.dev/) — polyglott (Node, Python, Ruby usw.)

Beispiel mit fnm:

```bash
fnm install 24
fnm use 24
```

  <Warning>
  Stellen Sie sicher, dass Ihr Versionsmanager in Ihrer Shell-Startdatei (`~/.zshrc` oder `~/.bashrc`) initialisiert wird. Wenn das nicht der Fall ist, wird `openclaw` in neuen Terminal-Sitzungen möglicherweise nicht gefunden, weil PATH das Binärverzeichnis von Node nicht enthält.
  </Warning>
</Accordion>

## Fehlerbehebung

### `openclaw: command not found`

Das bedeutet fast immer, dass sich das globale Binärverzeichnis von npm nicht in Ihrem PATH befindet.

<Steps>
  <Step title="Globales npm-Präfix ermitteln">
    ```bash
    npm prefix -g
    ```
  </Step>
  <Step title="Prüfen, ob es in Ihrem PATH enthalten ist">
    ```bash
    echo "$PATH"
    ```

    Suchen Sie in der Ausgabe nach `<npm-prefix>/bin` (macOS/Linux) oder `<npm-prefix>` (Windows).

  </Step>
  <Step title="Zu Ihrer Shell-Startdatei hinzufügen">
    <Tabs>
      <Tab title="macOS / Linux">
        Zu `~/.zshrc` oder `~/.bashrc` hinzufügen:

        ```bash
        export PATH="$(npm prefix -g)/bin:$PATH"
        ```

        Öffnen Sie dann ein neues Terminal (oder führen Sie `rehash` in zsh / `hash -r` in bash aus).
      </Tab>
      <Tab title="Windows">
        Fügen Sie die Ausgabe von `npm prefix -g` über Einstellungen → System → Umgebungsvariablen zu Ihrem System-PATH hinzu.
      </Tab>
    </Tabs>

  </Step>
</Steps>

### Berechtigungsfehler bei `npm install -g` (Linux)

Wenn Sie `EACCES`-Fehler sehen, wechseln Sie das globale npm-Präfix auf ein vom Benutzer beschreibbares Verzeichnis:

```bash
mkdir -p "$HOME/.npm-global"
npm config set prefix "$HOME/.npm-global"
export PATH="$HOME/.npm-global/bin:$PATH"
```

Fügen Sie die Zeile `export PATH=...` zu Ihrer `~/.bashrc` oder `~/.zshrc` hinzu, damit dies dauerhaft bleibt.

## Verwandt

- [Installationsübersicht](/de/install) — alle Installationsmethoden
- [Aktualisieren](/de/install/updating) — OpenClaw aktuell halten
- [Erste Schritte](/de/start/getting-started) — erste Schritte nach der Installation
