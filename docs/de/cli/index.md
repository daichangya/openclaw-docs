---
read_when:
    - Sie fügen CLI-Befehle oder -Optionen hinzu oder ändern sie
    - Sie dokumentieren neue Befehlsoberflächen
summary: OpenClaw-CLI-Referenz für `openclaw`-Befehle, Unterbefehle und Optionen
title: CLI-Referenz
x-i18n:
    generated_at: "2026-04-05T12:41:46Z"
    model: gpt-5.4
    provider: openai
    source_hash: 7c25e5ebfe256412b44130dba39cf39b0a7d1d22e3abb417345e95c95ca139bf
    source_path: cli/index.md
    workflow: 15
---

# CLI-Referenz

Diese Seite beschreibt das aktuelle CLI-Verhalten. Wenn sich Befehle ändern, aktualisieren Sie diese Dokumentation.

## Befehlsseiten

- [`setup`](/cli/setup)
- [`onboard`](/cli/onboard)
- [`configure`](/cli/configure)
- [`config`](/cli/config)
- [`completion`](/cli/completion)
- [`doctor`](/cli/doctor)
- [`dashboard`](/cli/dashboard)
- [`backup`](/cli/backup)
- [`reset`](/cli/reset)
- [`uninstall`](/cli/uninstall)
- [`update`](/cli/update)
- [`message`](/cli/message)
- [`agent`](/cli/agent)
- [`agents`](/cli/agents)
- [`acp`](/cli/acp)
- [`mcp`](/cli/mcp)
- [`status`](/cli/status)
- [`health`](/cli/health)
- [`sessions`](/cli/sessions)
- [`gateway`](/cli/gateway)
- [`logs`](/cli/logs)
- [`system`](/cli/system)
- [`models`](/cli/models)
- [`memory`](/cli/memory)
- [`directory`](/cli/directory)
- [`nodes`](/cli/nodes)
- [`devices`](/cli/devices)
- [`node`](/cli/node)
- [`approvals`](/cli/approvals)
- [`sandbox`](/cli/sandbox)
- [`tui`](/cli/tui)
- [`browser`](/cli/browser)
- [`cron`](/cli/cron)
- [`tasks`](/cli/index#tasks)
- [`flows`](/cli/flows)
- [`dns`](/cli/dns)
- [`docs`](/cli/docs)
- [`hooks`](/cli/hooks)
- [`webhooks`](/cli/webhooks)
- [`pairing`](/cli/pairing)
- [`qr`](/cli/qr)
- [`plugins`](/cli/plugins) (Plugin-Befehle)
- [`channels`](/cli/channels)
- [`security`](/cli/security)
- [`secrets`](/cli/secrets)
- [`skills`](/cli/skills)
- [`daemon`](/cli/daemon) (Legacy-Alias für Gateway-Service-Befehle)
- [`clawbot`](/cli/clawbot) (Legacy-Alias-Namespace)
- [`voicecall`](/cli/voicecall) (Plugin; falls installiert)

## Globale Flags

- `--dev`: isoliert den Status unter `~/.openclaw-dev` und verschiebt Standardports.
- `--profile <name>`: isoliert den Status unter `~/.openclaw-<name>`.
- `--container <name>`: zielt für die Ausführung auf einen benannten Container.
- `--no-color`: deaktiviert ANSI-Farben.
- `--update`: Kurzform für `openclaw update` (nur Quellinstallationen).
- `-V`, `--version`, `-v`: gibt die Version aus und beendet das Programm.

## Ausgabestil

- ANSI-Farben und Fortschrittsindikatoren werden nur in TTY-Sitzungen dargestellt.
- OSC-8-Hyperlinks werden in unterstützten Terminals als anklickbare Links dargestellt; andernfalls wird auf einfache URLs zurückgegriffen.
- `--json` (und `--plain`, sofern unterstützt) deaktiviert Styling für saubere Ausgabe.
- `--no-color` deaktiviert ANSI-Styling; `NO_COLOR=1` wird ebenfalls berücksichtigt.
- Lang laufende Befehle zeigen einen Fortschrittsindikator an (OSC 9;4, wenn unterstützt).

## Farbpalette

OpenClaw verwendet für die CLI-Ausgabe eine Lobster-Palette.

- `accent` (#FF5A2D): Überschriften, Beschriftungen, primäre Hervorhebungen.
- `accentBright` (#FF7A3D): Befehlsnamen, Hervorhebungen.
- `accentDim` (#D14A22): sekundär hervorgehobener Text.
- `info` (#FF8A5B): Informationswerte.
- `success` (#2FBF71): Erfolgszustände.
- `warn` (#FFB020): Warnungen, Fallbacks, Hinweise.
- `error` (#E23D2D): Fehler, Fehlschläge.
- `muted` (#8B7F77): De-Emphasis, Metadaten.

Quelle der Wahrheit für die Palette: `src/terminal/palette.ts` (die „Lobster-Palette“).

## Befehlsbaum

```
openclaw [--dev] [--profile <name>] <command>
  setup
  onboard
  configure
  config
    get
    set
    unset
    file
    schema
    validate
  completion
  doctor
  dashboard
  backup
    create
    verify
  security
    audit
  secrets
    reload
    audit
    configure
    apply
  reset
  uninstall
  update
    wizard
    status
  channels
    list
    status
    capabilities
    resolve
    logs
    add
    remove
    login
    logout
  directory
    self
    peers list
    groups list|members
  skills
    search
    install
    update
    list
    info
    check
  plugins
    list
    inspect
    install
    uninstall
    update
    enable
    disable
    doctor
    marketplace list
  memory
    status
    index
    search
  message
    send
    broadcast
    poll
    react
    reactions
    read
    edit
    delete
    pin
    unpin
    pins
    permissions
    search
    thread create|list|reply
    emoji list|upload
    sticker send|upload
    role info|add|remove
    channel info|list
    member info
    voice status
    event list|create
    timeout
    kick
    ban
  agent
  agents
    list
    add
    delete
    bindings
    bind
    unbind
    set-identity
  acp
  mcp
    serve
    list
    show
    set
    unset
  status
  health
  sessions
    cleanup
  tasks
    list
    audit
    maintenance
    show
    notify
    cancel
    flow list|show|cancel
  gateway
    call
    usage-cost
    health
    status
    probe
    discover
    install
    uninstall
    start
    stop
    restart
    run
  daemon
    status
    install
    uninstall
    start
    stop
    restart
  logs
  system
    event
    heartbeat last|enable|disable
    presence
  models
    list
    status
    set
    set-image
    aliases list|add|remove
    fallbacks list|add|remove|clear
    image-fallbacks list|add|remove|clear
    scan
    auth add|login|login-github-copilot|setup-token|paste-token
    auth order get|set|clear
  sandbox
    list
    recreate
    explain
  cron
    status
    list
    add
    edit
    rm
    enable
    disable
    runs
    run
  nodes
    status
    describe
    list
    pending
    approve
    reject
    rename
    invoke
    notify
    push
    canvas snapshot|present|hide|navigate|eval
    canvas a2ui push|reset
    camera list|snap|clip
    screen record
    location get
  devices
    list
    remove
    clear
    approve
    reject
    rotate
    revoke
  node
    run
    status
    install
    uninstall
    stop
    restart
  approvals
    get
    set
    allowlist add|remove
  browser
    status
    start
    stop
    reset-profile
    tabs
    open
    focus
    close
    profiles
    create-profile
    delete-profile
    screenshot
    snapshot
    navigate
    resize
    click
    type
    press
    hover
    drag
    select
    upload
    fill
    dialog
    wait
    evaluate
    console
    pdf
  hooks
    list
    info
    check
    enable
    disable
    install
    update
  webhooks
    gmail setup|run
  pairing
    list
    approve
  qr
  clawbot
    qr
  docs
  dns
    setup
  tui
```

Hinweis: Plugins können zusätzliche Befehle auf oberster Ebene hinzufügen (zum Beispiel `openclaw voicecall`).

## Sicherheit

- `openclaw security audit` — prüft Konfiguration + lokalen Status auf häufige sicherheitsrelevante Stolperfallen.
- `openclaw security audit --deep` — Best-Effort-Live-Prüfung des Gateway.
- `openclaw security audit --fix` — verschärft sichere Standardwerte und Berechtigungen für Status/Konfiguration.

## Secrets

### `secrets`

Verwalten Sie SecretRefs und zugehörige Runtime-/Konfigurationshygiene.

Unterbefehle:

- `secrets reload`
- `secrets audit`
- `secrets configure`
- `secrets apply --from <path>`

Optionen für `secrets reload`:

- `--url`, `--token`, `--timeout`, `--expect-final`, `--json`

Optionen für `secrets audit`:

- `--check`
- `--allow-exec`
- `--json`

Optionen für `secrets configure`:

- `--apply`
- `--yes`
- `--providers-only`
- `--skip-provider-setup`
- `--agent <id>`
- `--allow-exec`
- `--plan-out <path>`
- `--json`

Optionen für `secrets apply --from <path>`:

- `--dry-run`
- `--allow-exec`
- `--json`

Hinweise:

- `reload` ist ein Gateway-RPC und behält den letzten bekannten guten Runtime-Snapshot bei, wenn die Auflösung fehlschlägt.
- `audit --check` gibt bei Befunden einen Wert ungleich null zurück; nicht aufgelöste Refs verwenden einen höher priorisierten Exit-Code ungleich null.
- Dry-Run-Prüfungen für exec werden standardmäßig übersprungen; verwenden Sie `--allow-exec`, um sie zu aktivieren.

## Plugins

Verwalten Sie Erweiterungen und ihre Konfiguration:

- `openclaw plugins list` — erkennt Plugins (verwenden Sie `--json` für maschinenlesbare Ausgabe).
- `openclaw plugins inspect <id>` — zeigt Details für ein Plugin an (`info` ist ein Alias).
- `openclaw plugins install <path|.tgz|npm-spec|plugin@marketplace>` — installiert ein Plugin (oder fügt einen Plugin-Pfad zu `plugins.load.paths` hinzu; verwenden Sie `--force`, um ein vorhandenes Installationsziel zu überschreiben).
- `openclaw plugins marketplace list <marketplace>` — listet Marketplace-Einträge vor der Installation auf.
- `openclaw plugins enable <id>` / `disable <id>` — schaltet `plugins.entries.<id>.enabled` um.
- `openclaw plugins doctor` — meldet Plugin-Ladefehler.

Die meisten Plugin-Änderungen erfordern einen Neustart des Gateway. Siehe [/plugin](/tools/plugin).

## Memory

Vektorsuche über `MEMORY.md` + `memory/*.md`:

- `openclaw memory status` — zeigt Indexstatistiken an; verwenden Sie `--deep` für Prüfungen der Vektor- und Embedding-Bereitschaft oder `--fix`, um veraltete Recall-/Promotion-Artefakte zu reparieren.
- `openclaw memory index` — indiziert Memory-Dateien neu.
- `openclaw memory search "<query>"` (oder `--query "<query>"`) — semantische Suche über Memory.
- `openclaw memory promote` — ordnet kurzfristige Recalls und hängt optional die besten Einträge an `MEMORY.md` an.

## Sandbox

Verwalten Sie Sandbox-Runtimes für isolierte Agentenausführung. Siehe [/cli/sandbox](/cli/sandbox).

Unterbefehle:

- `sandbox list [--browser] [--json]`
- `sandbox recreate [--all] [--session <key>] [--agent <id>] [--browser] [--force]`
- `sandbox explain [--session <key>] [--agent <id>] [--json]`

Hinweise:

- `sandbox recreate` entfernt vorhandene Runtimes, sodass sie bei der nächsten Verwendung mit der aktuellen Konfiguration neu erzeugt werden.
- Für `ssh`- und OpenShell-`remote`-Backends löscht `recreate` den kanonischen Remote-Workspace für den ausgewählten Bereich.

## Chat-Slash-Befehle

Chat-Nachrichten unterstützen `/...`-Befehle (Text und nativ). Siehe [/tools/slash-commands](/tools/slash-commands).

Highlights:

- `/status` für schnelle Diagnosen.
- `/config` für persistente Konfigurationsänderungen.
- `/debug` für nur zur Laufzeit gültige Konfigurationsüberschreibungen (im Speicher, nicht auf der Festplatte; erfordert `commands.debug: true`).

## Einrichtung + Onboarding

### `completion`

Erzeugt Shell-Completion-Skripte und installiert sie optional in Ihr Shell-Profil.

Optionen:

- `-s, --shell <zsh|bash|powershell|fish>`
- `-i, --install`
- `--write-state`
- `-y, --yes`

Hinweise:

- Ohne `--install` oder `--write-state` gibt `completion` das Skript auf stdout aus.
- `--install` schreibt einen Block `OpenClaw Completion` in Ihr Shell-Profil und verweist dabei auf das zwischengespeicherte Skript im OpenClaw-Statusverzeichnis.

### `setup`

Initialisiert Konfiguration + Workspace.

Optionen:

- `--workspace <dir>`: Pfad zum Agenten-Workspace (Standard `~/.openclaw/workspace`).
- `--wizard`: führt das Onboarding aus.
- `--non-interactive`: führt das Onboarding ohne Eingabeaufforderungen aus.
- `--mode <local|remote>`: Onboarding-Modus.
- `--remote-url <url>`: URL des Remote-Gateway.
- `--remote-token <token>`: Token des Remote-Gateway.

Onboarding wird automatisch ausgeführt, wenn Onboarding-Flags vorhanden sind (`--non-interactive`, `--mode`, `--remote-url`, `--remote-token`).

### `onboard`

Interaktives Onboarding für Gateway, Workspace und Skills.

Optionen:

- `--workspace <dir>`
- `--reset` (setzt Konfiguration + Anmeldedaten + Sitzungen vor dem Onboarding zurück)
- `--reset-scope <config|config+creds+sessions|full>` (Standard `config+creds+sessions`; verwenden Sie `full`, um auch den Workspace zu entfernen)
- `--non-interactive`
- `--mode <local|remote>`
- `--flow <quickstart|advanced|manual>` (`manual` ist ein Alias für `advanced`)
- `--auth-choice <choice>`, wobei `<choice>` einer der folgenden Werte ist:
  `chutes`, `deepseek-api-key`, `openai-codex`, `openai-api-key`,
  `openrouter-api-key`, `kilocode-api-key`, `litellm-api-key`, `ai-gateway-api-key`,
  `cloudflare-ai-gateway-api-key`, `moonshot-api-key`, `moonshot-api-key-cn`,
  `kimi-code-api-key`, `synthetic-api-key`, `venice-api-key`, `together-api-key`,
  `huggingface-api-key`, `apiKey`, `gemini-api-key`, `google-gemini-cli`, `zai-api-key`,
  `zai-coding-global`, `zai-coding-cn`, `zai-global`, `zai-cn`, `xiaomi-api-key`,
  `minimax-global-oauth`, `minimax-global-api`, `minimax-cn-oauth`, `minimax-cn-api`,
  `opencode-zen`, `opencode-go`, `github-copilot`, `copilot-proxy`, `xai-api-key`,
  `mistral-api-key`, `volcengine-api-key`, `byteplus-api-key`, `qianfan-api-key`,
  `qwen-standard-api-key-cn`, `qwen-standard-api-key`, `qwen-api-key-cn`, `qwen-api-key`,
  `modelstudio-standard-api-key-cn`, `modelstudio-standard-api-key`,
  `modelstudio-api-key-cn`, `modelstudio-api-key`, `custom-api-key`, `skip`
- Hinweis zu Qwen: `qwen-*` ist die kanonische Familie für `auth-choice`. `modelstudio-*`
  IDs werden weiterhin nur als Legacy-Kompatibilitätsaliase akzeptiert.
- `--secret-input-mode <plaintext|ref>` (Standard `plaintext`; verwenden Sie `ref`, um Standard-Env-Refs des Providers statt Klartextschlüsseln zu speichern)
- `--anthropic-api-key <key>`
- `--openai-api-key <key>`
- `--mistral-api-key <key>`
- `--openrouter-api-key <key>`
- `--ai-gateway-api-key <key>`
- `--moonshot-api-key <key>`
- `--kimi-code-api-key <key>`
- `--gemini-api-key <key>`
- `--zai-api-key <key>`
- `--minimax-api-key <key>`
- `--opencode-zen-api-key <key>`
- `--opencode-go-api-key <key>`
- `--custom-base-url <url>` (nicht interaktiv; wird mit `--auth-choice custom-api-key` verwendet)
- `--custom-model-id <id>` (nicht interaktiv; wird mit `--auth-choice custom-api-key` verwendet)
- `--custom-api-key <key>` (nicht interaktiv; optional; wird mit `--auth-choice custom-api-key` verwendet; greift bei Auslassung auf `CUSTOM_API_KEY` zurück)
- `--custom-provider-id <id>` (nicht interaktiv; optionale benutzerdefinierte Provider-ID)
- `--custom-compatibility <openai|anthropic>` (nicht interaktiv; optional; Standard `openai`)
- `--gateway-port <port>`
- `--gateway-bind <loopback|lan|tailnet|auto|custom>`
- `--gateway-auth <token|password>`
- `--gateway-token <token>`
- `--gateway-token-ref-env <name>` (nicht interaktiv; speichert `gateway.auth.token` als env SecretRef; erfordert, dass diese Env-Variable gesetzt ist; kann nicht mit `--gateway-token` kombiniert werden)
- `--gateway-password <password>`
- `--remote-url <url>`
- `--remote-token <token>`
- `--tailscale <off|serve|funnel>`
- `--tailscale-reset-on-exit`
- `--install-daemon`
- `--no-install-daemon` (Alias: `--skip-daemon`)
- `--daemon-runtime <node|bun>`
- `--skip-channels`
- `--skip-skills`
- `--skip-search`
- `--skip-health`
- `--skip-ui`
- `--cloudflare-ai-gateway-account-id <id>`
- `--cloudflare-ai-gateway-gateway-id <id>`
- `--node-manager <npm|pnpm|bun>` (Node-Manager für Setup/Onboarding von Skills; pnpm empfohlen, bun ebenfalls unterstützt)
- `--json`

### `configure`

Interaktiver Konfigurationsassistent (Modelle, Kanäle, Skills, Gateway).

Optionen:

- `--section <section>` (wiederholbar; beschränkt den Assistenten auf bestimmte Abschnitte)

### `config`

Nicht interaktive Konfigurationshelfer (`get`/`set`/`unset`/`file`/`schema`/`validate`). Wenn Sie `openclaw config` ohne
Unterbefehl ausführen, wird der Assistent gestartet.

Unterbefehle:

- `config get <path>`: gibt einen Konfigurationswert aus (Punkt-/Klammerpfad).
- `config set`: unterstützt vier Zuweisungsmodi:
  - Wertmodus: `config set <path> <value>` (JSON5- oder String-Parsing)
  - SecretRef-Builder-Modus: `config set <path> --ref-provider <provider> --ref-source <source> --ref-id <id>`
  - Provider-Builder-Modus: `config set secrets.providers.<alias> --provider-source <env|file|exec> ...`
  - Batch-Modus: `config set --batch-json '<json>'` oder `config set --batch-file <path>`
- `config set --dry-run`: validiert Zuweisungen, ohne `openclaw.json` zu schreiben (Dry-Run-Prüfungen für exec SecretRef werden standardmäßig übersprungen).
- `config set --allow-exec --dry-run`: aktiviert Dry-Run-Prüfungen für exec SecretRef (kann Provider-Befehle ausführen).
- `config set --dry-run --json`: gibt maschinenlesbare Dry-Run-Ausgabe aus (Prüfungen + Vollständigkeitssignal, Operationen, geprüfte/übersprungene Refs, Fehler).
- `config set --strict-json`: erzwingt JSON5-Parsing für Pfad-/Werteingabe. `--json` bleibt außerhalb des Dry-Run-Ausgabemodus ein Legacy-Alias für striktes Parsing.
- `config unset <path>`: entfernt einen Wert.
- `config file`: gibt den Pfad der aktiven Konfigurationsdatei aus.
- `config schema`: gibt das generierte JSON-Schema für `openclaw.json` aus, einschließlich propagierter Docs-Metadaten für `title` / `description` über verschachtelte Objekt-, Wildcard-, Array-Item- und Kompositionszweige hinweg sowie Best-Effort-Live-Schemametadaten für Plugins/Kanäle.
- `config validate`: validiert die aktuelle Konfiguration gegen das Schema, ohne das Gateway zu starten.
- `config validate --json`: gibt maschinenlesbare JSON-Ausgabe aus.

### `doctor`

Zustandsprüfungen + schnelle Reparaturen (Konfiguration + Gateway + Legacy-Dienste).

Optionen:

- `--no-workspace-suggestions`: deaktiviert Hinweise für Workspace-Memory.
- `--yes`: akzeptiert Standardwerte ohne Nachfrage (headless).
- `--non-interactive`: überspringt Eingabeaufforderungen; wendet nur sichere Migrationen an.
- `--deep`: durchsucht Systemdienste nach zusätzlichen Gateway-Installationen.
- `--repair` (Alias: `--fix`): versucht automatische Reparaturen für erkannte Probleme.
- `--force`: erzwingt Reparaturen auch dann, wenn sie nicht unbedingt nötig sind.
- `--generate-gateway-token`: erzeugt ein neues Gateway-Auth-Token.

### `dashboard`

Öffnet die Control UI mit Ihrem aktuellen Token.

Optionen:

- `--no-open`: gibt die URL aus, startet aber keinen Browser

Hinweise:

- Bei SecretRef-verwalteten Gateway-Tokens gibt `dashboard` eine URL ohne Token aus oder öffnet sie, statt das Secret in der Terminalausgabe oder in Browser-Startargumenten offenzulegen.

### `update`

Aktualisiert die installierte CLI.

Root-Optionen:

- `--json`
- `--no-restart`
- `--dry-run`
- `--channel <stable|beta|dev>`
- `--tag <dist-tag|version|spec>`
- `--timeout <seconds>`
- `--yes`

Unterbefehle:

- `update status`
- `update wizard`

Optionen für `update status`:

- `--json`
- `--timeout <seconds>`

Optionen für `update wizard`:

- `--timeout <seconds>`

Hinweise:

- `openclaw --update` wird zu `openclaw update` umgeschrieben.

### `backup`

Erstellt und prüft lokale Backup-Archive für den OpenClaw-Status.

Unterbefehle:

- `backup create`
- `backup verify <archive>`

Optionen für `backup create`:

- `--output <path>`
- `--json`
- `--dry-run`
- `--verify`
- `--only-config`
- `--no-include-workspace`

Optionen für `backup verify <archive>`:

- `--json`

## Kanalhelfer

### `channels`

Verwalten Sie Chat-Kanalkonten (WhatsApp/Telegram/Discord/Google Chat/Slack/Mattermost (Plugin)/Signal/iMessage/Microsoft Teams).

Unterbefehle:

- `channels list`: zeigt konfigurierte Kanäle und Auth-Profile an.
- `channels status`: prüft Gateway-Erreichbarkeit und Kanalzustand (`--probe` führt Live-Prüfungen/Audits pro Konto aus, wenn das Gateway erreichbar ist; andernfalls greift es auf reine Kanalkonfigurationszusammenfassungen zurück. Verwenden Sie `openclaw health` oder `openclaw status --deep` für umfassendere Gateway-Zustandsprüfungen).
- Tipp: `channels status` gibt Warnungen mit vorgeschlagenen Korrekturen aus, wenn häufige Fehlkonfigurationen erkannt werden können (und verweist Sie dann auf `openclaw doctor`).
- `channels logs`: zeigt aktuelle Kanal-Logs aus der Gateway-Logdatei an.
- `channels add`: Assistentenartige Einrichtung, wenn keine Flags übergeben werden; Flags schalten in den nicht interaktiven Modus.
  - Wenn einem Kanal ein Nicht-Standardkonto hinzugefügt wird, der noch Single-Account-Konfiguration auf oberster Ebene verwendet, migriert OpenClaw kontobezogene Werte in die Kontozuordnung des Kanals, bevor das neue Konto geschrieben wird. Die meisten Kanäle verwenden `accounts.default`; Matrix kann stattdessen ein vorhandenes passendes benanntes/Standardziel beibehalten.
  - Nicht interaktives `channels add` erstellt/aktualisiert Bindings nicht automatisch; rein kanalbezogene Bindings stimmen weiterhin mit dem Standardkonto überein.
- `channels remove`: deaktiviert standardmäßig; übergeben Sie `--delete`, um Konfigurationseinträge ohne Eingabeaufforderungen zu entfernen.
- `channels login`: interaktiver Kanal-Login (nur WhatsApp Web).
- `channels logout`: meldet eine Kanalsitzung ab (sofern unterstützt).

Häufige Optionen:

- `--channel <name>`: `whatsapp|telegram|discord|googlechat|slack|mattermost|signal|imessage|msteams`
- `--account <id>`: ID des Kanalkontos (Standard `default`)
- `--name <label>`: Anzeigename für das Konto

Optionen für `channels login`:

- `--channel <channel>` (Standard `whatsapp`; unterstützt `whatsapp`/`web`)
- `--account <id>`
- `--verbose`

Optionen für `channels logout`:

- `--channel <channel>` (Standard `whatsapp`)
- `--account <id>`

Optionen für `channels list`:

- `--no-usage`: überspringt Nutzungs-/Quota-Snapshots von Modellprovidern (nur OAuth-/API-gestützt).
- `--json`: gibt JSON aus (einschließlich Nutzung, sofern `--no-usage` nicht gesetzt ist).

Optionen für `channels status`:

- `--probe`
- `--timeout <ms>`
- `--json`

Optionen für `channels capabilities`:

- `--channel <name>`
- `--account <id>` (nur mit `--channel`)
- `--target <dest>`
- `--timeout <ms>`
- `--json`

Optionen für `channels resolve`:

- `<entries...>`
- `--channel <name>`
- `--account <id>`
- `--kind <auto|user|group>`
- `--json`

Optionen für `channels logs`:

- `--channel <name|all>` (Standard `all`)
- `--lines <n>` (Standard `200`)
- `--json`

Hinweise:

- `channels login` unterstützt `--verbose`.
- `channels capabilities --account` gilt nur, wenn `--channel` gesetzt ist.
- `channels status --probe` kann je nach Kanalunterstützung Transportzustand sowie Prüf-/Audit-Ergebnisse wie `works`, `probe failed`, `audit ok` oder `audit failed` anzeigen.

Mehr Details: [/concepts/oauth](/concepts/oauth)

Beispiele:

```bash
openclaw channels add --channel telegram --account alerts --name "Alerts Bot" --token $TELEGRAM_BOT_TOKEN
openclaw channels add --channel discord --account work --name "Work Bot" --token $DISCORD_BOT_TOKEN
openclaw channels remove --channel discord --account work --delete
openclaw channels status --probe
openclaw status --deep
```

### `directory`

Schlagen Sie Self-, Peer- und Gruppen-IDs für Kanäle nach, die eine Verzeichnisoberfläche bereitstellen. Siehe [`openclaw directory`](/cli/directory).

Häufige Optionen:

- `--channel <name>`
- `--account <id>`
- `--json`

Unterbefehle:

- `directory self`
- `directory peers list [--query <text>] [--limit <n>]`
- `directory groups list [--query <text>] [--limit <n>]`
- `directory groups members --group-id <id> [--limit <n>]`

### `skills`

Listet verfügbare Skills plus Bereitschaftsinformationen auf und prüft sie.

Unterbefehle:

- `skills search [query...]`: durchsucht ClawHub-Skills.
- `skills search --limit <n> --json`: begrenzt Suchergebnisse oder gibt maschinenlesbare Ausgabe aus.
- `skills install <slug>`: installiert einen Skill aus ClawHub in den aktiven Workspace.
- `skills install <slug> --version <version>`: installiert eine bestimmte ClawHub-Version.
- `skills install <slug> --force`: überschreibt einen vorhandenen Workspace-Skill-Ordner.
- `skills update <slug|--all>`: aktualisiert verfolgte ClawHub-Skills.
- `skills list`: listet Skills auf (Standard, wenn kein Unterbefehl angegeben ist).
- `skills list --json`: gibt maschinenlesbares Skill-Inventar auf stdout aus.
- `skills list --verbose`: schließt fehlende Anforderungen in die Tabelle ein.
- `skills info <name>`: zeigt Details zu einem Skill an.
- `skills info <name> --json`: gibt maschinenlesbare Details auf stdout aus.
- `skills check`: Zusammenfassung von bereit vs. fehlenden Anforderungen.
- `skills check --json`: gibt maschinenlesbare Bereitschaftsausgabe auf stdout aus.

Optionen:

- `--eligible`: zeigt nur bereite Skills an.
- `--json`: gibt JSON aus (ohne Styling).
- `-v`, `--verbose`: schließt Details zu fehlenden Anforderungen ein.

Tipp: Verwenden Sie `openclaw skills search`, `openclaw skills install` und `openclaw skills update` für ClawHub-gestützte Skills.

### `pairing`

Genehmigen Sie DM-Pairing-Anfragen kanalübergreifend.

Unterbefehle:

- `pairing list [channel] [--channel <channel>] [--account <id>] [--json]`
- `pairing approve <channel> <code> [--account <id>] [--notify]`
- `pairing approve --channel <channel> [--account <id>] <code> [--notify]`

Hinweise:

- Wenn genau ein Pairing-fähiger Kanal konfiguriert ist, ist auch `pairing approve <code>` zulässig.
- `list` und `approve` unterstützen beide `--account <id>` für Kanäle mit mehreren Konten.

### `devices`

Verwalten Sie Gateway-Geräte-Pairing-Einträge und geräterollenspezifische Tokens.

Unterbefehle:

- `devices list [--json]`
- `devices approve [requestId] [--latest]`
- `devices reject <requestId>`
- `devices remove <deviceId>`
- `devices clear --yes [--pending]`
- `devices rotate --device <id> --role <role> [--scope <scope...>]`
- `devices revoke --device <id> --role <role>`

Hinweise:

- `devices list` und `devices approve` können bei local loopback auf lokale Pairing-Dateien zurückgreifen, wenn kein direkter Pairing-Bereich verfügbar ist.
- `devices approve` wählt automatisch die neueste ausstehende Anfrage aus, wenn keine `requestId` übergeben wird oder `--latest` gesetzt ist.
- Verbindungen mit gespeichertem Token verwenden den zwischengespeicherten genehmigten Bereich des Tokens erneut; explizites
  `devices rotate --scope ...` aktualisiert diesen gespeicherten Bereichssatz für zukünftige
  Wiederverbindungen mit zwischengespeichertem Token.
- `devices rotate` und `devices revoke` geben JSON-Payloads zurück.

### `qr`

Erzeugt einen mobilen Pairing-QR und Einrichtungscode aus der aktuellen Gateway-Konfiguration. Siehe [`openclaw qr`](/cli/qr).

Optionen:

- `--remote`
- `--url <url>`
- `--public-url <url>`
- `--token <token>`
- `--password <password>`
- `--setup-code-only`
- `--no-ascii`
- `--json`

Hinweise:

- `--token` und `--password` schließen sich gegenseitig aus.
- Der Einrichtungscode enthält ein kurzlebiges Bootstrap-Token, nicht das gemeinsame Gateway-Token/-Passwort.
- Integrierte Bootstrap-Übergabe hält das primäre Node-Token bei `scopes: []`.
- Jedes übergebene Operator-Bootstrap-Token bleibt auf `operator.approvals`, `operator.read`, `operator.talk.secrets` und `operator.write` begrenzt.
- Bootstrap-Bereichsprüfungen sind mit Rollenpräfix versehen, sodass diese Operator-Allowlist nur Operator-Anfragen erfüllt; Nicht-Operator-Rollen benötigen weiterhin Bereiche unter ihrem eigenen Rollenpräfix.
- `--remote` kann `gateway.remote.url` oder die aktive Tailscale-Serve-/Funnel-URL verwenden.
- Nach dem Scannen genehmigen Sie die Anfrage mit `openclaw devices list` / `openclaw devices approve <requestId>`.

### `clawbot`

Legacy-Alias-Namespace. Unterstützt derzeit `openclaw clawbot qr`, das auf [`openclaw qr`](/cli/qr) abgebildet wird.

### `hooks`

Verwalten Sie interne Agenten-Hooks.

Unterbefehle:

- `hooks list`
- `hooks info <name>`
- `hooks check`
- `hooks enable <name>`
- `hooks disable <name>`
- `hooks install <path-or-spec>` (veralteter Alias für `openclaw plugins install`)
- `hooks update [id]` (veralteter Alias für `openclaw plugins update`)

Häufige Optionen:

- `--json`
- `--eligible`
- `-v`, `--verbose`

Hinweise:

- Plugin-verwaltete Hooks können nicht über `openclaw hooks` aktiviert oder deaktiviert werden; aktivieren oder deaktivieren Sie stattdessen das besitzende Plugin.
- `hooks install` und `hooks update` funktionieren weiterhin als Kompatibilitätsaliase, geben jedoch Veraltungshinweise aus und leiten auf die Plugin-Befehle weiter.

### `webhooks`

Webhook-Helfer. Die aktuelle integrierte Oberfläche ist die Einrichtung + Ausführung von Gmail Pub/Sub:

- `webhooks gmail setup`
- `webhooks gmail run`

### `webhooks gmail`

Einrichtung + Ausführung von Gmail Pub/Sub-Hooks. Siehe [Gmail Pub/Sub](/automation/cron-jobs#gmail-pubsub-integration).

Unterbefehle:

- `webhooks gmail setup` (erfordert `--account <email>`; unterstützt `--project`, `--topic`, `--subscription`, `--label`, `--hook-url`, `--hook-token`, `--push-token`, `--bind`, `--port`, `--path`, `--include-body`, `--max-bytes`, `--renew-minutes`, `--tailscale`, `--tailscale-path`, `--tailscale-target`, `--push-endpoint`, `--json`)
- `webhooks gmail run` (Runtime-Überschreibungen für dieselben Flags)

Hinweise:

- `setup` konfiguriert den Gmail-Watch sowie den OpenClaw-seitigen Push-Pfad.
- `run` startet den lokalen Gmail-Watcher/Erneuerungs-Loop mit optionalen Runtime-Überschreibungen.

### `dns`

DNS-Helfer für Wide-Area-Discovery (CoreDNS + Tailscale). Aktuelle integrierte Oberfläche:

- `dns setup [--domain <domain>] [--apply]`

### `dns setup`

DNS-Helfer für Wide-Area-Discovery (CoreDNS + Tailscale). Siehe [/gateway/discovery](/gateway/discovery).

Optionen:

- `--domain <domain>`
- `--apply`: installiert/aktualisiert die CoreDNS-Konfiguration (erfordert sudo; nur macOS).

Hinweise:

- Ohne `--apply` ist dies ein Planungshelfer, der die empfohlene OpenClaw- + Tailscale-DNS-Konfiguration ausgibt.
- `--apply` unterstützt derzeit nur macOS mit Homebrew-CoreDNS.

## Messaging + Agent

### `message`

Einheitliches ausgehendes Messaging + Kanalaktionen.

Siehe: [/cli/message](/cli/message)

Unterbefehle:

- `message send|poll|react|reactions|read|edit|delete|pin|unpin|pins|permissions|search|timeout|kick|ban`
- `message thread <create|list|reply>`
- `message emoji <list|upload>`
- `message sticker <send|upload>`
- `message role <info|add|remove>`
- `message channel <info|list>`
- `message member info`
- `message voice status`
- `message event <list|create>`

Beispiele:

- `openclaw message send --target +15555550123 --message "Hi"`
- `openclaw message poll --channel discord --target channel:123 --poll-question "Snack?" --poll-option Pizza --poll-option Sushi`

### `agent`

Führt einen Agenten-Turn über das Gateway aus (oder eingebettet mit `--local`).

Geben Sie mindestens einen Sitzungsselektor an: `--to`, `--session-id` oder `--agent`.

Erforderlich:

- `-m, --message <text>`

Optionen:

- `-t, --to <dest>` (für Sitzungsschlüssel und optionale Zustellung)
- `--session-id <id>`
- `--agent <id>` (Agenten-ID; überschreibt Routing-Bindings)
- `--thinking <off|minimal|low|medium|high|xhigh>` (Provider-Unterstützung variiert; auf CLI-Ebene nicht modellbegrenzt)
- `--verbose <on|off>`
- `--channel <channel>` (Zustellkanal; weglassen, um den Hauptsitzungskanal zu verwenden)
- `--reply-to <target>` (Überschreibung des Zustellziels, getrennt vom Sitzungsrouting)
- `--reply-channel <channel>` (Überschreibung des Zustellkanals)
- `--reply-account <id>` (Überschreibung der Zustellkonto-ID)
- `--local` (eingebettete Ausführung; Plugin-Registry wird dennoch zuerst vorgeladen)
- `--deliver`
- `--json`
- `--timeout <seconds>`

Hinweise:

- Der Gateway-Modus greift auf den eingebetteten Agenten zurück, wenn die Gateway-Anfrage fehlschlägt.
- `--local` lädt weiterhin die Plugin-Registry vor, sodass Plugin-bereitgestellte Provider, Tools und Kanäle auch bei eingebetteten Ausführungen verfügbar bleiben.
- `--channel`, `--reply-channel` und `--reply-account` beeinflussen die Antwortzustellung, nicht das Routing.

### `agents`

Verwalten Sie isolierte Agenten (Workspaces + Auth + Routing).

Die Ausführung von `openclaw agents` ohne Unterbefehl entspricht `openclaw agents list`.

#### `agents list`

Listet konfigurierte Agenten auf.

Optionen:

- `--json`
- `--bindings`

#### `agents add [name]`

Fügt einen neuen isolierten Agenten hinzu. Führt den geführten Assistenten aus, sofern keine Flags (oder `--non-interactive`) übergeben werden; `--workspace` ist im nicht interaktiven Modus erforderlich.

Optionen:

- `--workspace <dir>`
- `--model <id>`
- `--agent-dir <dir>`
- `--bind <channel[:accountId]>` (wiederholbar)
- `--non-interactive`
- `--json`

Binding-Spezifikationen verwenden `channel[:accountId]`. Wenn `accountId` weggelassen wird, kann OpenClaw den Kontobereich über Kanalstandards/Plugin-Hooks auflösen; andernfalls ist es ein Kanal-Binding ohne expliziten Kontobereich.
Die Übergabe expliziter Add-Flags schaltet den Befehl in den nicht interaktiven Pfad. `main` ist reserviert und kann nicht als neue Agenten-ID verwendet werden.

#### `agents bindings`

Listet Routing-Bindings auf.

Optionen:

- `--agent <id>`
- `--json`

#### `agents bind`

Fügt Routing-Bindings für einen Agenten hinzu.

Optionen:

- `--agent <id>` (Standard ist der aktuelle Standardagent)
- `--bind <channel[:accountId]>` (wiederholbar)
- `--json`

#### `agents unbind`

Entfernt Routing-Bindings für einen Agenten.

Optionen:

- `--agent <id>` (Standard ist der aktuelle Standardagent)
- `--bind <channel[:accountId]>` (wiederholbar)
- `--all`
- `--json`

Verwenden Sie entweder `--all` oder `--bind`, nicht beides.

#### `agents delete <id>`

Löscht einen Agenten und bereinigt seinen Workspace + Status.

Optionen:

- `--force`
- `--json`

Hinweise:

- `main` kann nicht gelöscht werden.
- Ohne `--force` ist eine interaktive Bestätigung erforderlich.

#### `agents set-identity`

Aktualisiert eine Agentenidentität (Name/Thema/Emoji/Avatar).

Optionen:

- `--agent <id>`
- `--workspace <dir>`
- `--identity-file <path>`
- `--from-identity`
- `--name <name>`
- `--theme <theme>`
- `--emoji <emoji>`
- `--avatar <value>`
- `--json`

Hinweise:

- `--agent` oder `--workspace` kann verwendet werden, um den Zielagenten auszuwählen.
- Wenn keine expliziten Identitätsfelder angegeben werden, liest der Befehl `IDENTITY.md`.

### `acp`

Führt die ACP-Bridge aus, die IDEs mit dem Gateway verbindet.

Root-Optionen:

- `--url <url>`
- `--token <token>`
- `--token-file <path>`
- `--password <password>`
- `--password-file <path>`
- `--session <key>`
- `--session-label <label>`
- `--require-existing`
- `--reset-session`
- `--no-prefix-cwd`
- `--provenance <off|meta|meta+receipt>`
- `--verbose`

#### `acp client`

Interaktiver ACP-Client zur Bridge-Fehlerbehebung.

Optionen:

- `--cwd <dir>`
- `--server <command>`
- `--server-args <args...>`
- `--server-verbose`
- `--verbose`

Siehe [`acp`](/cli/acp) für vollständiges Verhalten, Sicherheitshinweise und Beispiele.

### `mcp`

Verwalten Sie gespeicherte MCP-Serverdefinitionen und stellen Sie OpenClaw-Kanäle über MCP stdio bereit.

#### `mcp serve`

Stellt geroutete OpenClaw-Kanalgespräche über MCP stdio bereit.

Optionen:

- `--url <url>`
- `--token <token>`
- `--token-file <path>`
- `--password <password>`
- `--password-file <path>`
- `--claude-channel-mode <auto|on|off>`
- `--verbose`

#### `mcp list`

Listet gespeicherte MCP-Serverdefinitionen auf.

Optionen:

- `--json`

#### `mcp show [name]`

Zeigt eine gespeicherte MCP-Serverdefinition oder das vollständige gespeicherte MCP-Serverobjekt an.

Optionen:

- `--json`

#### `mcp set <name> <value>`

Speichert eine MCP-Serverdefinition aus einem JSON-Objekt.

#### `mcp unset <name>`

Entfernt eine gespeicherte MCP-Serverdefinition.

### `approvals`

Verwalten Sie Exec-Genehmigungen. Alias: `exec-approvals`.

#### `approvals get`

Ruft den Snapshot der Exec-Genehmigungen und die effektive Richtlinie ab.

Optionen:

- `--node <node>`
- `--gateway`
- `--json`
- Node-RPC-Optionen aus `openclaw nodes`

#### `approvals set`

Ersetzt Exec-Genehmigungen mit JSON aus einer Datei oder stdin.

Optionen:

- `--node <node>`
- `--gateway`
- `--file <path>`
- `--stdin`
- `--json`
- Node-RPC-Optionen aus `openclaw nodes`

#### `approvals allowlist add|remove`

Bearbeitet die agentenbezogene Exec-Allowlist.

Optionen:

- `--node <node>`
- `--gateway`
- `--agent <id>` (Standard `*`)
- `--json`
- Node-RPC-Optionen aus `openclaw nodes`

### `status`

Zeigt den Zustand verknüpfter Sitzungen und aktuelle Empfänger an.

Optionen:

- `--json`
- `--all` (vollständige Diagnose; schreibgeschützt, einfügbar)
- `--deep` (fragt das Gateway nach einer Live-Zustandsprüfung, einschließlich Kanalprüfungen, sofern unterstützt)
- `--usage` (zeigt Nutzung/Quota des Modellproviders an)
- `--timeout <ms>`
- `--verbose`
- `--debug` (Alias für `--verbose`)

Hinweise:

- Die Übersicht enthält den Status von Gateway + Node-Host-Dienst, sofern verfügbar.
- `--usage` gibt normalisierte Provider-Nutzungsfenster als `X% left` aus.

### Nutzungsverfolgung

OpenClaw kann Provider-Nutzung/Quota anzeigen, wenn OAuth-/API-Anmeldedaten verfügbar sind.

Oberflächen:

- `/status` (fügt bei Verfügbarkeit eine kurze Zeile zur Provider-Nutzung hinzu)
- `openclaw status --usage` (gibt die vollständige Provider-Aufschlüsselung aus)
- macOS-Menüleiste (Bereich „Usage“ unter „Context“)

Hinweise:

- Die Daten kommen direkt von Provider-Nutzungsendpunkten (keine Schätzungen).
- Menschenlesbare Ausgabe wird providerübergreifend auf `X% left` normalisiert.
- Provider mit aktuellen Nutzungsfenstern: Anthropic, GitHub Copilot, Gemini CLI, OpenAI Codex, MiniMax, Xiaomi und z.ai.
- Hinweis zu MiniMax: Rohwerte `usage_percent` / `usagePercent` bedeuten verbleibende Quote, daher invertiert OpenClaw sie vor der Anzeige; zählbasierte Felder haben weiterhin Vorrang, wenn vorhanden. Antworten von `model_remains` bevorzugen den Chat-Modell-Eintrag, leiten bei Bedarf die Fensterbeschriftung aus Zeitstempeln ab und schließen den Modellnamen in die Planbeschriftung ein.
- Die Nutzungs-Authentifizierung stammt nach Möglichkeit aus providerspezifischen Hooks; andernfalls greift OpenClaw auf passende OAuth-/API-Key-Anmeldedaten aus Auth-Profilen, Env oder Konfiguration zurück. Wenn sich nichts auflösen lässt, wird die Nutzung ausgeblendet.
- Details: siehe [Usage tracking](/concepts/usage-tracking).

### `health`

Ruft den Zustand vom laufenden Gateway ab.

Optionen:

- `--json`
- `--timeout <ms>`
- `--verbose` (erzwingt eine Live-Prüfung und gibt Verbindungsdetails des Gateway aus)
- `--debug` (Alias für `--verbose`)

Hinweise:

- Standardmäßiges `health` kann einen frischen zwischengespeicherten Gateway-Snapshot zurückgeben.
- `health --verbose` erzwingt eine Live-Prüfung und erweitert die menschenlesbare Ausgabe über alle konfigurierten Konten und Agenten hinweg.

### `sessions`

Listet gespeicherte Gesprächssitzungen auf.

Optionen:

- `--json`
- `--verbose`
- `--store <path>`
- `--active <minutes>`
- `--agent <id>` (filtert Sitzungen nach Agent)
- `--all-agents` (zeigt Sitzungen über alle Agenten hinweg)

Unterbefehle:

- `sessions cleanup` — entfernt abgelaufene oder verwaiste Sitzungen

Hinweise:

- `sessions cleanup` unterstützt auch `--fix-missing`, um Einträge zu entfernen, deren Transkriptdateien fehlen.

## Reset / Uninstall

### `reset`

Setzt lokale Konfiguration/Status zurück (CLI bleibt installiert).

Optionen:

- `--scope <config|config+creds+sessions|full>`
- `--yes`
- `--non-interactive`
- `--dry-run`

Hinweise:

- `--non-interactive` erfordert `--scope` und `--yes`.

### `uninstall`

Deinstalliert den Gateway-Dienst + lokale Daten (CLI bleibt erhalten).

Optionen:

- `--service`
- `--state`
- `--workspace`
- `--app`
- `--all`
- `--yes`
- `--non-interactive`
- `--dry-run`

Hinweise:

- `--non-interactive` erfordert `--yes` und explizite Bereiche (oder `--all`).
- `--all` entfernt Dienst, Status, Workspace und App zusammen.

### `tasks`

Listet [Hintergrundaufgaben](/automation/tasks)-Ausführungen über Agenten hinweg auf und verwaltet sie.

- `tasks list` — zeigt aktive und aktuelle Aufgabenausführungen
- `tasks show <id>` — zeigt Details zu einer bestimmten Aufgabenausführung
- `tasks notify <id>` — ändert die Benachrichtigungsrichtlinie für eine Aufgabenausführung
- `tasks cancel <id>` — bricht eine laufende Aufgabe ab
- `tasks audit` — macht betriebliche Probleme sichtbar (veraltet, verloren, Zustellfehler)
- `tasks maintenance [--apply] [--json]` — Vorschau oder Anwendung der Bereinigung/Abstimmung von tasks und TaskFlow (ACP-/Subagent-Kindsitzungen, aktive Cron-Jobs, Live-CLI-Ausführungen)
- `tasks flow list` — listet aktive und aktuelle Task-Flow-Flows auf
- `tasks flow show <lookup>` — untersucht einen Flow nach ID oder Lookup-Schlüssel
- `tasks flow cancel <lookup>` — bricht einen laufenden Flow und seine aktiven Aufgaben ab

### `flows`

Legacy-Dokumentationskürzel. Flow-Befehle befinden sich unter `openclaw tasks flow`:

- `tasks flow list [--json]`
- `tasks flow show <lookup>`
- `tasks flow cancel <lookup>`

## Gateway

### `gateway`

Führt das WebSocket-Gateway aus.

Optionen:

- `--port <port>`
- `--bind <loopback|tailnet|lan|auto|custom>`
- `--token <token>`
- `--auth <token|password>`
- `--password <password>`
- `--password-file <path>`
- `--tailscale <off|serve|funnel>`
- `--tailscale-reset-on-exit`
- `--allow-unconfigured`
- `--dev`
- `--reset` (setzt Dev-Konfiguration + Anmeldedaten + Sitzungen + Workspace zurück)
- `--force` (beendet vorhandenen Listener auf dem Port)
- `--verbose`
- `--cli-backend-logs`
- `--claude-cli-logs` (veralteter Alias)
- `--ws-log <auto|full|compact>`
- `--compact` (Alias für `--ws-log compact`)
- `--raw-stream`
- `--raw-stream-path <path>`

### `gateway service`

Verwaltet den Gateway-Dienst (launchd/systemd/schtasks).

Unterbefehle:

- `gateway status` (prüft standardmäßig den Gateway-RPC)
- `gateway install` (Dienstinstallation)
- `gateway uninstall`
- `gateway start`
- `gateway stop`
- `gateway restart`

Hinweise:

- `gateway status` prüft standardmäßig den Gateway-RPC über den aufgelösten Port/die Konfiguration des Dienstes (überschreibbar mit `--url/--token/--password`).
- `gateway status` unterstützt `--no-probe`, `--deep`, `--require-rpc` und `--json` für Skripting.
- `gateway status` zeigt auch Legacy- oder zusätzliche Gateway-Dienste an, wenn sie erkannt werden können (`--deep` fügt Scans auf Systemebene hinzu). OpenClaw-Dienste mit Profilnamen werden als erstklassig behandelt und nicht als „zusätzlich“ markiert.
- `gateway status` bleibt für Diagnosen verfügbar, auch wenn die lokale CLI-Konfiguration fehlt oder ungültig ist.
- `gateway status` gibt den aufgelösten Pfad zur Dateiprotokollierung, den Snapshot der Konfigurationspfade/-gültigkeit von CLI vs. Dienst und die aufgelöste URL des Prüfungsziels aus.
- Wenn Gateway-Auth-SecretRefs im aktuellen Befehlspfad nicht aufgelöst sind, meldet `gateway status --json` `rpc.authWarning` nur dann, wenn Prüfungskonnektivität/-auth fehlschlägt (Warnungen werden unterdrückt, wenn die Prüfung erfolgreich ist).
- Bei Linux-systemd-Installationen umfassen Statusprüfungen auf Token-Drift sowohl `Environment=`- als auch `EnvironmentFile=`-Quellen der Unit.
- `gateway install|uninstall|start|stop|restart` unterstützen `--json` für Skripting (Standardausgabe bleibt menschenfreundlich).
- `gateway install` verwendet standardmäßig die Node-Runtime; bun wird **nicht empfohlen** (WhatsApp-/Telegram-Bugs).
- `gateway install`-Optionen: `--port`, `--runtime`, `--token`, `--force`, `--json`.

### `daemon`

Legacy-Alias für die Befehle zur Gateway-Dienstverwaltung. Siehe [/cli/daemon](/cli/daemon).

Unterbefehle:

- `daemon status`
- `daemon install`
- `daemon uninstall`
- `daemon start`
- `daemon stop`
- `daemon restart`

Häufige Optionen:

- `status`: `--url`, `--token`, `--password`, `--timeout`, `--no-probe`, `--require-rpc`, `--deep`, `--json`
- `install`: `--port`, `--runtime <node|bun>`, `--token`, `--force`, `--json`
- `uninstall|start|stop|restart`: `--json`

### `logs`

Verfolgt Gateway-Dateilogs per RPC.

Optionen:

- `--limit <n>`: maximale Anzahl zurückzugebender Logzeilen
- `--max-bytes <n>`: maximale Anzahl an Bytes, die aus der Logdatei gelesen werden
- `--follow`: folgt der Logdatei (wie `tail -f`)
- `--interval <ms>`: Polling-Intervall in ms beim Folgen
- `--local-time`: zeigt Zeitstempel in lokaler Zeit an
- `--json`: gibt zeilengetrenntes JSON aus
- `--plain`: deaktiviert strukturierte Formatierung
- `--no-color`: deaktiviert ANSI-Farben
- `--url <url>`: explizite Gateway-WebSocket-URL
- `--token <token>`: Gateway-Token
- `--timeout <ms>`: Gateway-RPC-Timeout
- `--expect-final`: wartet bei Bedarf auf eine abschließende Antwort

Beispiele:

```bash
openclaw logs --follow
openclaw logs --limit 200
openclaw logs --plain
openclaw logs --json
openclaw logs --no-color
```

Hinweise:

- Wenn Sie `--url` übergeben, wendet die CLI Konfigurations- oder Env-Anmeldedaten nicht automatisch an.
- Fehler beim local loopback Pairing greifen auf die konfigurierte lokale Logdatei zurück; explizite `--url`-Ziele tun das nicht.

### `gateway <subcommand>`

Gateway-CLI-Helfer (verwenden Sie `--url`, `--token`, `--password`, `--timeout`, `--expect-final` für RPC-Unterbefehle).
Wenn Sie `--url` übergeben, wendet die CLI Konfigurations- oder Env-Anmeldedaten nicht automatisch an.
Geben Sie `--token` oder `--password` explizit an. Fehlende explizite Anmeldedaten sind ein Fehler.

Unterbefehle:

- `gateway call <method> [--params <json>] [--url <url>] [--token <token>] [--password <password>] [--timeout <ms>] [--expect-final] [--json]`
- `gateway health`
- `gateway status`
- `gateway probe`
- `gateway discover`
- `gateway install|uninstall|start|stop|restart`
- `gateway run`

Hinweise:

- `gateway status --deep` fügt einen Dienstscan auf Systemebene hinzu. Verwenden Sie `gateway probe`,
  `health --verbose` oder das Top-Level-`status --deep` für detailliertere Runtime-Prüfungen.

Häufige RPCs:

- `config.schema.lookup` (untersucht einen Konfigurationsunterbaum mit einem flachen Schemaknoten, abgeglichenen Hinweis-Metadaten und Zusammenfassungen unmittelbarer Unterelemente)
- `config.get` (liest aktuellen Konfigurations-Snapshot + Hash)
- `config.set` (validiert + schreibt die vollständige Konfiguration; verwenden Sie `baseHash` für optimistische Nebenläufigkeit)
- `config.apply` (validiert + schreibt Konfiguration + startet neu + weckt auf)
- `config.patch` (führt eine teilweise Aktualisierung zusammen + startet neu + weckt auf)
- `update.run` (führt Update aus + startet neu + weckt auf)

Tipp: Wenn Sie `config.set`/`config.apply`/`config.patch` direkt aufrufen, übergeben Sie `baseHash` aus
`config.get`, falls bereits eine Konfiguration existiert.
Tipp: Für Teilbearbeitungen untersuchen Sie zuerst mit `config.schema.lookup` und bevorzugen `config.patch`.
Tipp: Diese RPCs zum Schreiben von Konfiguration prüfen vorab die Auflösung aktiver SecretRefs in der übermittelten Konfigurations-Payload und lehnen Schreibvorgänge ab, wenn ein effektiv aktiver übermittelter Ref nicht aufgelöst ist.
Tipp: Das nur für Besitzer verfügbare Runtime-Tool `gateway` weigert sich weiterhin, `tools.exec.ask` oder `tools.exec.security` umzuschreiben; Legacy-Aliase `tools.bash.*` werden auf dieselben geschützten Exec-Pfade normalisiert.

## Modelle

Siehe [/concepts/models](/concepts/models) für Fallback-Verhalten und Scan-Strategie.

Hinweis zur Abrechnung: Wir glauben, dass der Claude Code CLI-Fallback für lokale,
benutzerverwaltete Automatisierung wahrscheinlich zulässig ist, basierend auf den öffentlichen CLI-Dokumenten von Anthropic. Dennoch
schafft die Richtlinie von Anthropic zu Drittanbieter-Harnesses genügend Unklarheit bezüglich
abonnementgestützter Nutzung in externen Produkten, sodass wir dies für
Produktion nicht empfehlen. Anthropic informierte OpenClaw-Benutzer außerdem am **4. April 2026 um
12:00 PM PT / 8:00 PM BST**, dass der **OpenClaw**-Claude-Login-Pfad als
Drittanbieter-Harness-Nutzung zählt und **Extra Usage** erfordert, die separat vom
Abonnement abgerechnet wird. Für Produktion bevorzugen Sie einen Anthropic-API-Schlüssel oder einen anderen unterstützten
abonnementähnlichen Provider wie OpenAI Codex, Alibaba Cloud Model Studio
Coding Plan, MiniMax Coding Plan oder Z.AI / GLM Coding Plan.

Migration der Anthropic Claude CLI:

```bash
openclaw models auth login --provider anthropic --method cli --set-default
```

Onboarding-Kürzel: `openclaw onboard --auth-choice anthropic-cli`

Anthropic setup-token ist nun ebenfalls wieder als Legacy-/manueller Auth-Pfad verfügbar.
Verwenden Sie ihn nur in dem Wissen, dass Anthropic OpenClaw-Benutzern mitgeteilt hat, dass dieser
OpenClaw-Claude-Login-Pfad **Extra Usage** erfordert.

Hinweis zu Legacy-Aliasen: `claude-cli` ist der veraltete Alias für `auth-choice` im Onboarding.
Verwenden Sie `anthropic-cli` für das Onboarding oder verwenden Sie direkt `models auth login`.

### `models` (Root)

`openclaw models` ist ein Alias für `models status`.

Root-Optionen:

- `--status-json` (Alias für `models status --json`)
- `--status-plain` (Alias für `models status --plain`)

### `models list`

Optionen:

- `--all`
- `--local`
- `--provider <name>`
- `--json`
- `--plain`

### `models status`

Optionen:

- `--json`
- `--plain`
- `--check` (Exit 1=abgelaufen/fehlend, 2=läuft bald ab)
- `--probe` (Live-Prüfung konfigurierte Auth-Profile)
- `--probe-provider <name>`
- `--probe-profile <id>` (wiederholt oder kommasepariert)
- `--probe-timeout <ms>`
- `--probe-concurrency <n>`
- `--probe-max-tokens <n>`
- `--agent <id>`

Enthält immer die Auth-Übersicht und den OAuth-Ablaufstatus für Profile im Auth-Speicher.
`--probe` führt Live-Anfragen aus (kann Tokens verbrauchen und Rate Limits auslösen).
Prüfzeilen können aus Auth-Profilen, Env-Anmeldedaten oder `models.json` stammen.
Erwarten Sie Prüfstatus wie `ok`, `auth`, `rate_limit`, `billing`, `timeout`,
`format`, `unknown` und `no_model`.
Wenn eine explizite `auth.order.<provider>` ein gespeichertes Profil auslässt, meldet die Prüfung
`excluded_by_auth_order`, statt dieses Profil stillschweigend zu versuchen.

### `models set <model>`

Setzt `agents.defaults.model.primary`.

### `models set-image <model>`

Setzt `agents.defaults.imageModel.primary`.

### `models aliases list|add|remove`

Optionen:

- `list`: `--json`, `--plain`
- `add <alias> <model>`
- `remove <alias>`

### `models fallbacks list|add|remove|clear`

Optionen:

- `list`: `--json`, `--plain`
- `add <model>`
- `remove <model>`
- `clear`

### `models image-fallbacks list|add|remove|clear`

Optionen:

- `list`: `--json`, `--plain`
- `add <model>`
- `remove <model>`
- `clear`

### `models scan`

Optionen:

- `--min-params <b>`
- `--max-age-days <days>`
- `--provider <name>`
- `--max-candidates <n>`
- `--timeout <ms>`
- `--concurrency <n>`
- `--no-probe`
- `--yes`
- `--no-input`
- `--set-default`
- `--set-image`
- `--json`

### `models auth add|login|login-github-copilot|setup-token|paste-token`

Optionen:

- `add`: interaktiver Auth-Helfer (Provider-Auth-Flow oder Token-Einfügen)
- `login`: `--provider <name>`, `--method <method>`, `--set-default`
- `login-github-copilot`: GitHub-Copilot-OAuth-Login-Flow (`--yes`)
- `setup-token`: `--provider <name>`, `--yes`
- `paste-token`: `--provider <name>`, `--profile-id <id>`, `--expires-in <duration>`

Hinweise:

- `setup-token` und `paste-token` sind generische Token-Befehle für Provider, die Token-Auth-Methoden bereitstellen.
- `setup-token` erfordert ein interaktives TTY und führt die Token-Auth-Methode des Providers aus.
- `paste-token` fordert zur Eingabe des Token-Werts auf und verwendet standardmäßig die Auth-Profil-ID `<provider>:manual`, wenn `--profile-id` weggelassen wird.
- Anthropic `setup-token` / `paste-token` sind wieder als Legacy-/manueller OpenClaw-Pfad verfügbar. Anthropic teilte OpenClaw-Benutzern mit, dass dieser Pfad **Extra Usage** auf dem Claude-Konto erfordert.

### `models auth order get|set|clear`

Optionen:

- `get`: `--provider <name>`, `--agent <id>`, `--json`
- `set`: `--provider <name>`, `--agent <id>`, `<profileIds...>`
- `clear`: `--provider <name>`, `--agent <id>`

## System

### `system event`

Stellt ein Systemereignis in die Warteschlange und löst optional einen Heartbeat aus (Gateway-RPC).

Erforderlich:

- `--text <text>`

Optionen:

- `--mode <now|next-heartbeat>`
- `--json`
- `--url`, `--token`, `--timeout`, `--expect-final`

### `system heartbeat last|enable|disable`

Heartbeat-Steuerung (Gateway-RPC).

Optionen:

- `--json`
- `--url`, `--token`, `--timeout`, `--expect-final`

### `system presence`

Listet System-Presence-Einträge auf (Gateway-RPC).

Optionen:

- `--json`
- `--url`, `--token`, `--timeout`, `--expect-final`

## Cron

Verwalten Sie geplante Jobs (Gateway-RPC). Siehe [/automation/cron-jobs](/automation/cron-jobs).

Unterbefehle:

- `cron status [--json]`
- `cron list [--all] [--json]` (standardmäßig Tabellenausgabe; verwenden Sie `--json` für Rohdaten)
- `cron add` (Alias: `create`; erfordert `--name` und genau eines von `--at` | `--every` | `--cron` sowie genau eine Payload von `--system-event` | `--message`)
- `cron edit <id>` (patcht Felder)
- `cron rm <id>` (Aliase: `remove`, `delete`)
- `cron enable <id>`
- `cron disable <id>`
- `cron runs --id <id> [--limit <n>]`
- `cron run <id> [--due]`

Alle `cron`-Befehle akzeptieren `--url`, `--token`, `--timeout`, `--expect-final`.

`cron add|edit --model ...` verwendet dieses ausgewählte zugelassene Modell für den Job. Wenn
das Modell nicht zugelassen ist, warnt Cron und greift stattdessen auf die Modellwahl des
Agenten/Standards für den Job zurück. Konfigurierte Fallback-Ketten gelten weiterhin, aber eine einfache
Modellüberschreibung ohne explizite Fallback-Liste pro Job hängt das primäre Modell des Agenten nicht mehr als verborgenes zusätzliches Wiederholungsziel an.

## Node-Host

### `node`

`node` führt einen **headless Node-Host** aus oder verwaltet ihn als Hintergrunddienst. Siehe
[`openclaw node`](/cli/node).

Unterbefehle:

- `node run --host <gateway-host> --port 18789`
- `node status`
- `node install [--host <gateway-host>] [--port <port>] [--tls] [--tls-fingerprint <sha256>] [--node-id <id>] [--display-name <name>] [--runtime <node|bun>] [--force]`
- `node uninstall`
- `node stop`
- `node restart`

Hinweise zur Authentifizierung:

- `node` löst Gateway-Authentifizierung aus Env/Konfiguration auf (keine Flags `--token`/`--password`): `OPENCLAW_GATEWAY_TOKEN` / `OPENCLAW_GATEWAY_PASSWORD`, dann `gateway.auth.*`. Im lokalen Modus ignoriert der Node-Host absichtlich `gateway.remote.*`; in `gateway.mode=remote` beteiligt sich `gateway.remote.*` gemäß den Vorrangregeln für Remote.
- Die Auflösung der Node-Host-Authentifizierung berücksichtigt nur Env-Variablen `OPENCLAW_GATEWAY_*`.

## Nodes

`nodes` kommuniziert mit dem Gateway und zielt auf gepaarte Nodes. Siehe [/nodes](/nodes).

Häufige Optionen:

- `--url`, `--token`, `--timeout`, `--json`

Unterbefehle:

- `nodes status [--connected] [--last-connected <duration>]`
- `nodes describe --node <id|name|ip>`
- `nodes list [--connected] [--last-connected <duration>]`
- `nodes pending`
- `nodes approve <requestId>`
- `nodes reject <requestId>`
- `nodes rename --node <id|name|ip> --name <displayName>`
- `nodes invoke --node <id|name|ip> --command <command> [--params <json>] [--invoke-timeout <ms>] [--idempotency-key <key>]`
- `nodes notify --node <id|name|ip> [--title <text>] [--body <text>] [--sound <name>] [--priority <passive|active|timeSensitive>] [--delivery <system|overlay|auto>] [--invoke-timeout <ms>]` (nur Mac)

Kamera:

- `nodes camera list --node <id|name|ip>`
- `nodes camera snap --node <id|name|ip> [--facing front|back|both] [--device-id <id>] [--max-width <px>] [--quality <0-1>] [--delay-ms <ms>] [--invoke-timeout <ms>]`
- `nodes camera clip --node <id|name|ip> [--facing front|back] [--device-id <id>] [--duration <ms|10s|1m>] [--no-audio] [--invoke-timeout <ms>]`

Canvas + Bildschirm:

- `nodes canvas snapshot --node <id|name|ip> [--format png|jpg|jpeg] [--max-width <px>] [--quality <0-1>] [--invoke-timeout <ms>]`
- `nodes canvas present --node <id|name|ip> [--target <urlOrPath>] [--x <px>] [--y <px>] [--width <px>] [--height <px>] [--invoke-timeout <ms>]`
- `nodes canvas hide --node <id|name|ip> [--invoke-timeout <ms>]`
- `nodes canvas navigate <url> --node <id|name|ip> [--invoke-timeout <ms>]`
- `nodes canvas eval [<js>] --node <id|name|ip> [--js <code>] [--invoke-timeout <ms>]`
- `nodes canvas a2ui push --node <id|name|ip> (--jsonl <path> | --text <text>) [--invoke-timeout <ms>]`
- `nodes canvas a2ui reset --node <id|name|ip> [--invoke-timeout <ms>]`
- `nodes screen record --node <id|name|ip> [--screen <index>] [--duration <ms|10s>] [--fps <n>] [--no-audio] [--out <path>] [--invoke-timeout <ms>]`

Standort:

- `nodes location get --node <id|name|ip> [--max-age <ms>] [--accuracy <coarse|balanced|precise>] [--location-timeout <ms>] [--invoke-timeout <ms>]`

## Browser

Browser-Steuerungs-CLI (dediziertes Chrome/Brave/Edge/Chromium). Siehe [`openclaw browser`](/cli/browser) und das [Browser-Tool](/tools/browser).

Häufige Optionen:

- `--url`, `--token`, `--timeout`, `--expect-final`, `--json`
- `--browser-profile <name>`

Verwalten:

- `browser status`
- `browser start`
- `browser stop`
- `browser reset-profile`
- `browser tabs`
- `browser open <url>`
- `browser focus <targetId>`
- `browser close [targetId]`
- `browser profiles`
- `browser create-profile --name <name> [--color <hex>] [--cdp-url <url>] [--driver existing-session] [--user-data-dir <path>]`
- `browser delete-profile --name <name>`

Untersuchen:

- `browser screenshot [targetId] [--full-page] [--ref <ref>] [--element <selector>] [--type png|jpeg]`
- `browser snapshot [--format aria|ai] [--target-id <id>] [--limit <n>] [--interactive] [--compact] [--depth <n>] [--selector <sel>] [--out <path>]`

Aktionen:

- `browser navigate <url> [--target-id <id>]`
- `browser resize <width> <height> [--target-id <id>]`
- `browser click <ref> [--double] [--button <left|right|middle>] [--modifiers <csv>] [--target-id <id>]`
- `browser type <ref> <text> [--submit] [--slowly] [--target-id <id>]`
- `browser press <key> [--target-id <id>]`
- `browser hover <ref> [--target-id <id>]`
- `browser drag <startRef> <endRef> [--target-id <id>]`
- `browser select <ref> <values...> [--target-id <id>]`
- `browser upload <paths...> [--ref <ref>] [--input-ref <ref>] [--element <selector>] [--target-id <id>] [--timeout-ms <ms>]`
- `browser fill [--fields <json>] [--fields-file <path>] [--target-id <id>]`
- `browser dialog --accept|--dismiss [--prompt <text>] [--target-id <id>] [--timeout-ms <ms>]`
- `browser wait [--time <ms>] [--text <value>] [--text-gone <value>] [--target-id <id>]`
- `browser evaluate --fn <code> [--ref <ref>] [--target-id <id>]`
- `browser console [--level <error|warn|info>] [--target-id <id>]`
- `browser pdf [--target-id <id>]`

## Voice Call

### `voicecall`

Vom Plugin bereitgestellte Dienstprogramme für Voice Calls. Wird nur angezeigt, wenn das Voice-Call-Plugin installiert und aktiviert ist. Siehe [`openclaw voicecall`](/cli/voicecall).

Häufige Befehle:

- `voicecall call --to <phone> --message <text> [--mode notify|conversation]`
- `voicecall start --to <phone> [--message <text>] [--mode notify|conversation]`
- `voicecall continue --call-id <id> --message <text>`
- `voicecall speak --call-id <id> --message <text>`
- `voicecall end --call-id <id>`
- `voicecall status --call-id <id>`
- `voicecall tail [--file <path>] [--since <n>] [--poll <ms>]`
- `voicecall latency [--file <path>] [--last <n>]`
- `voicecall expose [--mode off|serve|funnel] [--path <path>] [--port <port>] [--serve-path <path>]`

## Dokumentationssuche

### `docs`

Durchsucht den Live-Dokumentationsindex von OpenClaw.

### `docs [query...]`

Durchsucht den Live-Dokumentationsindex.

## TUI

### `tui`

Öffnet die mit dem Gateway verbundene Terminal-UI.

Optionen:

- `--url <url>`
- `--token <token>`
- `--password <password>`
- `--session <key>`
- `--deliver`
- `--thinking <level>`
- `--message <text>`
- `--timeout-ms <ms>` (Standardwert ist `agents.defaults.timeoutSeconds`)
- `--history-limit <n>`
