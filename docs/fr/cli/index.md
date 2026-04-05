---
read_when:
    - Ajout ou modification de commandes ou d’options CLI
    - Documentation de nouvelles surfaces de commande
summary: Référence CLI OpenClaw pour les commandes, sous-commandes et options `openclaw`
title: Référence CLI
x-i18n:
    generated_at: "2026-04-05T12:40:58Z"
    model: gpt-5.4
    provider: openai
    source_hash: 7c25e5ebfe256412b44130dba39cf39b0a7d1d22e3abb417345e95c95ca139bf
    source_path: cli/index.md
    workflow: 15
---

# Référence CLI

Cette page décrit le comportement actuel de la CLI. Si les commandes changent, mettez à jour cette documentation.

## Pages de commande

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
- [`plugins`](/cli/plugins) (commandes de plugin)
- [`channels`](/cli/channels)
- [`security`](/cli/security)
- [`secrets`](/cli/secrets)
- [`skills`](/cli/skills)
- [`daemon`](/cli/daemon) (alias historique pour les commandes de service gateway)
- [`clawbot`](/cli/clawbot) (espace de noms d’alias historique)
- [`voicecall`](/cli/voicecall) (plugin ; si installé)

## Indicateurs globaux

- `--dev` : isole l’état sous `~/.openclaw-dev` et décale les ports par défaut.
- `--profile <name>` : isole l’état sous `~/.openclaw-<name>`.
- `--container <name>` : cible un conteneur nommé pour l’exécution.
- `--no-color` : désactive les couleurs ANSI.
- `--update` : raccourci pour `openclaw update` (installations depuis les sources uniquement).
- `-V`, `--version`, `-v` : affiche la version et quitte.

## Style de sortie

- Les couleurs ANSI et les indicateurs de progression ne s’affichent que dans les sessions TTY.
- Les hyperliens OSC-8 s’affichent comme liens cliquables dans les terminaux compatibles ; sinon, nous revenons à des URL en clair.
- `--json` (et `--plain` lorsque pris en charge) désactive le style pour une sortie propre.
- `--no-color` désactive le style ANSI ; `NO_COLOR=1` est également respecté.
- Les commandes longues affichent un indicateur de progression (OSC 9;4 lorsque pris en charge).

## Palette de couleurs

OpenClaw utilise une palette lobster pour la sortie CLI.

- `accent` (#FF5A2D) : titres, libellés, mises en évidence principales.
- `accentBright` (#FF7A3D) : noms de commande, emphase.
- `accentDim` (#D14A22) : texte de mise en évidence secondaire.
- `info` (#FF8A5B) : valeurs d’information.
- `success` (#2FBF71) : états de réussite.
- `warn` (#FFB020) : avertissements, solutions de repli, éléments demandant de l’attention.
- `error` (#E23D2D) : erreurs, échecs.
- `muted` (#8B7F77) : atténuation, métadonnées.

Source de vérité de la palette : `src/terminal/palette.ts` (la « palette lobster »).

## Arborescence des commandes

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

Remarque : les plugins peuvent ajouter des commandes de premier niveau supplémentaires (par exemple `openclaw voicecall`).

## Sécurité

- `openclaw security audit` — audite la configuration + l’état local pour détecter les pièges de sécurité courants.
- `openclaw security audit --deep` — sonde gateway en direct au mieux.
- `openclaw security audit --fix` — resserre les valeurs par défaut sûres et les autorisations d’état/configuration.

## Secrets

### `secrets`

Gérez les SecretRefs et l’hygiène d’exécution/configuration associée.

Sous-commandes :

- `secrets reload`
- `secrets audit`
- `secrets configure`
- `secrets apply --from <path>`

Options de `secrets reload` :

- `--url`, `--token`, `--timeout`, `--expect-final`, `--json`

Options de `secrets audit` :

- `--check`
- `--allow-exec`
- `--json`

Options de `secrets configure` :

- `--apply`
- `--yes`
- `--providers-only`
- `--skip-provider-setup`
- `--agent <id>`
- `--allow-exec`
- `--plan-out <path>`
- `--json`

Options de `secrets apply --from <path>` :

- `--dry-run`
- `--allow-exec`
- `--json`

Remarques :

- `reload` est une RPC Gateway et conserve le snapshot d’exécution valide le plus récent lorsque la résolution échoue.
- `audit --check` renvoie une valeur non nulle en cas de résultats ; les références non résolues utilisent un code de sortie non nul de priorité plus élevée.
- Les vérifications exec en dry-run sont ignorées par défaut ; utilisez `--allow-exec` pour y participer explicitement.

## Plugins

Gérez les extensions et leur configuration :

- `openclaw plugins list` — découvre les plugins (utilisez `--json` pour une sortie lisible par machine).
- `openclaw plugins inspect <id>` — affiche les détails d’un plugin (`info` est un alias).
- `openclaw plugins install <path|.tgz|npm-spec|plugin@marketplace>` — installe un plugin (ou ajoute un chemin de plugin à `plugins.load.paths` ; utilisez `--force` pour écraser une cible d’installation existante).
- `openclaw plugins marketplace list <marketplace>` — liste les entrées du marketplace avant installation.
- `openclaw plugins enable <id>` / `disable <id>` — bascule `plugins.entries.<id>.enabled`.
- `openclaw plugins doctor` — signale les erreurs de chargement de plugins.

La plupart des modifications de plugin nécessitent un redémarrage de la gateway. Voir [/plugin](/tools/plugin).

## Memory

Recherche vectorielle sur `MEMORY.md` + `memory/*.md` :

- `openclaw memory status` — affiche les statistiques d’index ; utilisez `--deep` pour les vérifications de disponibilité vectorielle + embeddings ou `--fix` pour réparer les artefacts obsolètes de rappel/promotion.
- `openclaw memory index` — réindexe les fichiers memory.
- `openclaw memory search "<query>"` (ou `--query "<query>"`) — recherche sémantique dans memory.
- `openclaw memory promote` — classe les rappels à court terme et peut éventuellement ajouter les meilleures entrées à `MEMORY.md`.

## Sandbox

Gérez les environnements sandbox pour l’exécution isolée d’agents. Voir [/cli/sandbox](/cli/sandbox).

Sous-commandes :

- `sandbox list [--browser] [--json]`
- `sandbox recreate [--all] [--session <key>] [--agent <id>] [--browser] [--force]`
- `sandbox explain [--session <key>] [--agent <id>] [--json]`

Remarques :

- `sandbox recreate` supprime les environnements existants afin que leur prochaine utilisation les réamorce avec la configuration actuelle.
- Pour les backends `ssh` et OpenShell `remote`, recreate supprime l’espace de travail distant canonique pour l’étendue sélectionnée.

## Commandes slash de chat

Les messages de chat prennent en charge les commandes `/...` (texte et natives). Voir [/tools/slash-commands](/tools/slash-commands).

Points forts :

- `/status` pour des diagnostics rapides.
- `/config` pour des modifications de configuration persistées.
- `/debug` pour des remplacements de configuration à l’exécution uniquement (en mémoire, pas sur disque ; nécessite `commands.debug: true`).

## Configuration initiale + onboarding

### `completion`

Générez des scripts de complétion shell et, éventuellement, installez-les dans votre profil shell.

Options :

- `-s, --shell <zsh|bash|powershell|fish>`
- `-i, --install`
- `--write-state`
- `-y, --yes`

Remarques :

- Sans `--install` ni `--write-state`, `completion` affiche le script sur stdout.
- `--install` écrit un bloc `OpenClaw Completion` dans votre profil shell et le fait pointer vers le script mis en cache dans le répertoire d’état OpenClaw.

### `setup`

Initialise la configuration + l’espace de travail.

Options :

- `--workspace <dir>` : chemin de l’espace de travail de l’agent (par défaut `~/.openclaw/workspace`).
- `--wizard` : lance l’onboarding.
- `--non-interactive` : exécute l’onboarding sans invites.
- `--mode <local|remote>` : mode d’onboarding.
- `--remote-url <url>` : URL Gateway distante.
- `--remote-token <token>` : jeton Gateway distant.

L’onboarding s’exécute automatiquement lorsqu’un indicateur d’onboarding est présent (`--non-interactive`, `--mode`, `--remote-url`, `--remote-token`).

### `onboard`

Onboarding interactif pour gateway, espace de travail et Skills.

Options :

- `--workspace <dir>`
- `--reset` (réinitialise config + identifiants + sessions avant l’onboarding)
- `--reset-scope <config|config+creds+sessions|full>` (par défaut `config+creds+sessions` ; utilisez `full` pour supprimer également l’espace de travail)
- `--non-interactive`
- `--mode <local|remote>`
- `--flow <quickstart|advanced|manual>` (manual est un alias de advanced)
- `--auth-choice <choice>` où `<choice>` est l’un de :
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
- Remarque Qwen : `qwen-*` est la famille canonique pour auth-choice. Les identifiants `modelstudio-*`
  restent acceptés uniquement comme alias historiques de compatibilité.
- `--secret-input-mode <plaintext|ref>` (par défaut `plaintext` ; utilisez `ref` pour stocker des références env provider par défaut au lieu de clés en clair)
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
- `--custom-base-url <url>` (non interactif ; utilisé avec `--auth-choice custom-api-key`)
- `--custom-model-id <id>` (non interactif ; utilisé avec `--auth-choice custom-api-key`)
- `--custom-api-key <key>` (non interactif ; facultatif ; utilisé avec `--auth-choice custom-api-key` ; utilise `CUSTOM_API_KEY` comme repli s’il est omis)
- `--custom-provider-id <id>` (non interactif ; identifiant provider personnalisé facultatif)
- `--custom-compatibility <openai|anthropic>` (non interactif ; facultatif ; `openai` par défaut)
- `--gateway-port <port>`
- `--gateway-bind <loopback|lan|tailnet|auto|custom>`
- `--gateway-auth <token|password>`
- `--gateway-token <token>`
- `--gateway-token-ref-env <name>` (non interactif ; stocke `gateway.auth.token` en tant que SecretRef env ; nécessite que cette variable d’environnement soit définie ; ne peut pas être combiné avec `--gateway-token`)
- `--gateway-password <password>`
- `--remote-url <url>`
- `--remote-token <token>`
- `--tailscale <off|serve|funnel>`
- `--tailscale-reset-on-exit`
- `--install-daemon`
- `--no-install-daemon` (alias : `--skip-daemon`)
- `--daemon-runtime <node|bun>`
- `--skip-channels`
- `--skip-skills`
- `--skip-search`
- `--skip-health`
- `--skip-ui`
- `--cloudflare-ai-gateway-account-id <id>`
- `--cloudflare-ai-gateway-gateway-id <id>`
- `--node-manager <npm|pnpm|bun>` (gestionnaire Node pour setup/onboarding de Skills ; pnpm recommandé, bun également pris en charge)
- `--json`

### `configure`

Assistant de configuration interactif (modèles, canaux, Skills, gateway).

Options :

- `--section <section>` (répétable ; limite l’assistant à des sections spécifiques)

### `config`

Assistants de configuration non interactifs (get/set/unset/file/schema/validate). Exécuter `openclaw config` sans
sous-commande lance l’assistant.

Sous-commandes :

- `config get <path>` : affiche une valeur de configuration (chemin dot/bracket).
- `config set` : prend en charge quatre modes d’affectation :
  - mode valeur : `config set <path> <value>` (analyse JSON5-ou-chaîne)
  - mode constructeur SecretRef : `config set <path> --ref-provider <provider> --ref-source <source> --ref-id <id>`
  - mode constructeur provider : `config set secrets.providers.<alias> --provider-source <env|file|exec> ...`
  - mode lot : `config set --batch-json '<json>'` ou `config set --batch-file <path>`
- `config set --dry-run` : valide les affectations sans écrire `openclaw.json` (les vérifications exec SecretRef sont ignorées par défaut).
- `config set --allow-exec --dry-run` : permet explicitement les vérifications exec SecretRef en dry-run (peut exécuter des commandes provider).
- `config set --dry-run --json` : émet une sortie de dry-run lisible par machine (vérifications + signal d’exhaustivité, opérations, refs vérifiées/ignorées, erreurs).
- `config set --strict-json` : impose l’analyse JSON5 pour l’entrée chemin/valeur. `--json` reste un alias historique de l’analyse stricte hors mode de sortie dry-run.
- `config unset <path>` : supprime une valeur.
- `config file` : affiche le chemin du fichier de configuration actif.
- `config schema` : affiche le schéma JSON généré pour `openclaw.json`, y compris les métadonnées de documentation `title` / `description` propagées à travers les branches imbriquées d’objet, joker, élément de tableau et composition, ainsi que des métadonnées de schéma plugin/canal live au mieux.
- `config validate` : valide la configuration actuelle par rapport au schéma sans démarrer la gateway.
- `config validate --json` : émet une sortie JSON lisible par machine.

### `doctor`

Vérifications de santé + corrections rapides (configuration + gateway + services historiques).

Options :

- `--no-workspace-suggestions` : désactive les conseils de mémoire d’espace de travail.
- `--yes` : accepte les valeurs par défaut sans invite (mode headless).
- `--non-interactive` : ignore les invites ; applique uniquement les migrations sûres.
- `--deep` : analyse les services système à la recherche d’installations gateway supplémentaires.
- `--repair` (alias : `--fix`) : tente des réparations automatiques pour les problèmes détectés.
- `--force` : force les réparations même lorsqu’elles ne sont pas strictement nécessaires.
- `--generate-gateway-token` : génère un nouveau jeton d’authentification gateway.

### `dashboard`

Ouvre l’interface Control UI avec votre jeton actuel.

Options :

- `--no-open` : affiche l’URL sans lancer de navigateur

Remarques :

- Pour les jetons gateway gérés par SecretRef, `dashboard` affiche ou ouvre une URL sans jeton au lieu d’exposer le secret dans la sortie terminal ou les arguments de lancement du navigateur.

### `update`

Met à jour la CLI installée.

Options racine :

- `--json`
- `--no-restart`
- `--dry-run`
- `--channel <stable|beta|dev>`
- `--tag <dist-tag|version|spec>`
- `--timeout <seconds>`
- `--yes`

Sous-commandes :

- `update status`
- `update wizard`

Options de `update status` :

- `--json`
- `--timeout <seconds>`

Options de `update wizard` :

- `--timeout <seconds>`

Remarques :

- `openclaw --update` est réécrit en `openclaw update`.

### `backup`

Crée et vérifie des archives de sauvegarde locales pour l’état OpenClaw.

Sous-commandes :

- `backup create`
- `backup verify <archive>`

Options de `backup create` :

- `--output <path>`
- `--json`
- `--dry-run`
- `--verify`
- `--only-config`
- `--no-include-workspace`

Options de `backup verify <archive>` :

- `--json`

## Assistants de canal

### `channels`

Gérez les comptes de canaux de chat (WhatsApp/Telegram/Discord/Google Chat/Slack/Mattermost (plugin)/Signal/iMessage/Microsoft Teams).

Sous-commandes :

- `channels list` : affiche les canaux configurés et les profils d’authentification.
- `channels status` : vérifie l’accessibilité de la gateway et la santé des canaux (`--probe` exécute des vérifications probe/audit live par compte lorsque la gateway est accessible ; sinon, il se replie sur des résumés de canaux basés uniquement sur la configuration. Utilisez `openclaw health` ou `openclaw status --deep` pour des sondes de santé gateway plus larges).
- Astuce : `channels status` affiche des avertissements avec des correctifs suggérés lorsqu’il peut détecter des erreurs de configuration courantes (puis vous oriente vers `openclaw doctor`).
- `channels logs` : affiche les journaux récents des canaux depuis le fichier journal de la gateway.
- `channels add` : configuration façon assistant lorsqu’aucun indicateur n’est passé ; les indicateurs basculent en mode non interactif.
  - Lors de l’ajout d’un compte non par défaut à un canal utilisant encore une configuration de niveau supérieur à compte unique, OpenClaw promeut les valeurs liées au compte dans la map des comptes du canal avant d’écrire le nouveau compte. La plupart des canaux utilisent `accounts.default` ; Matrix peut préserver une cible nommée/par défaut existante correspondante à la place.
  - `channels add` en mode non interactif ne crée/met pas automatiquement à niveau les bindings ; les bindings uniquement canal continuent de correspondre au compte par défaut.
- `channels remove` : désactive par défaut ; passez `--delete` pour supprimer les entrées de configuration sans invites.
- `channels login` : connexion interactive au canal (WhatsApp Web uniquement).
- `channels logout` : déconnecte une session de canal (si pris en charge).

Options courantes :

- `--channel <name>` : `whatsapp|telegram|discord|googlechat|slack|mattermost|signal|imessage|msteams`
- `--account <id>` : identifiant de compte de canal (par défaut `default`)
- `--name <label>` : nom d’affichage du compte

Options de `channels login` :

- `--channel <channel>` (par défaut `whatsapp` ; prend en charge `whatsapp`/`web`)
- `--account <id>`
- `--verbose`

Options de `channels logout` :

- `--channel <channel>` (par défaut `whatsapp`)
- `--account <id>`

Options de `channels list` :

- `--no-usage` : ignore les snapshots d’utilisation/quota du provider de modèle (OAuth/API uniquement).
- `--json` : affiche du JSON (inclut l’utilisation sauf si `--no-usage` est défini).

Options de `channels status` :

- `--probe`
- `--timeout <ms>`
- `--json`

Options de `channels capabilities` :

- `--channel <name>`
- `--account <id>` (uniquement avec `--channel`)
- `--target <dest>`
- `--timeout <ms>`
- `--json`

Options de `channels resolve` :

- `<entries...>`
- `--channel <name>`
- `--account <id>`
- `--kind <auto|user|group>`
- `--json`

Options de `channels logs` :

- `--channel <name|all>` (par défaut `all`)
- `--lines <n>` (par défaut `200`)
- `--json`

Remarques :

- `channels login` prend en charge `--verbose`.
- `channels capabilities --account` ne s’applique que lorsque `--channel` est défini.
- `channels status --probe` peut afficher l’état du transport ainsi que des résultats probe/audit comme `works`, `probe failed`, `audit ok` ou `audit failed`, selon la prise en charge par le canal.

Plus de détails : [/concepts/oauth](/concepts/oauth)

Exemples :

```bash
openclaw channels add --channel telegram --account alerts --name "Alerts Bot" --token $TELEGRAM_BOT_TOKEN
openclaw channels add --channel discord --account work --name "Work Bot" --token $DISCORD_BOT_TOKEN
openclaw channels remove --channel discord --account work --delete
openclaw channels status --probe
openclaw status --deep
```

### `directory`

Recherchez les identifiants self, peer et group pour les canaux qui exposent une surface d’annuaire. Voir [`openclaw directory`](/cli/directory).

Options courantes :

- `--channel <name>`
- `--account <id>`
- `--json`

Sous-commandes :

- `directory self`
- `directory peers list [--query <text>] [--limit <n>]`
- `directory groups list [--query <text>] [--limit <n>]`
- `directory groups members --group-id <id> [--limit <n>]`

### `skills`

Listez et inspectez les Skills disponibles ainsi que les informations de disponibilité.

Sous-commandes :

- `skills search [query...]` : recherche les Skills ClawHub.
- `skills search --limit <n> --json` : limite les résultats de recherche ou émet une sortie lisible par machine.
- `skills install <slug>` : installe un Skill depuis ClawHub dans l’espace de travail actif.
- `skills install <slug> --version <version>` : installe une version spécifique de ClawHub.
- `skills install <slug> --force` : écrase un dossier Skill existant dans l’espace de travail.
- `skills update <slug|--all>` : met à jour les Skills ClawHub suivis.
- `skills list` : liste les Skills (par défaut lorsqu’aucune sous-commande n’est donnée).
- `skills list --json` : émet un inventaire des Skills lisible par machine sur stdout.
- `skills list --verbose` : inclut les exigences manquantes dans le tableau.
- `skills info <name>` : affiche les détails d’un Skill.
- `skills info <name> --json` : émet des détails lisibles par machine sur stdout.
- `skills check` : résumé des éléments prêts vs manquants.
- `skills check --json` : émet une sortie de disponibilité lisible par machine sur stdout.

Options :

- `--eligible` : n’affiche que les Skills prêts.
- `--json` : sortie JSON (sans style).
- `-v`, `--verbose` : inclut les détails des exigences manquantes.

Astuce : utilisez `openclaw skills search`, `openclaw skills install` et `openclaw skills update` pour les Skills reposant sur ClawHub.

### `pairing`

Approuvez les demandes de pairing DM entre les canaux.

Sous-commandes :

- `pairing list [channel] [--channel <channel>] [--account <id>] [--json]`
- `pairing approve <channel> <code> [--account <id>] [--notify]`
- `pairing approve --channel <channel> [--account <id>] <code> [--notify]`

Remarques :

- Si exactement un canal compatible pairing est configuré, `pairing approve <code>` est également autorisé.
- `list` et `approve` prennent tous deux en charge `--account <id>` pour les canaux multi-comptes.

### `devices`

Gérez les entrées de pairing d’appareil gateway et les jetons d’appareil par rôle.

Sous-commandes :

- `devices list [--json]`
- `devices approve [requestId] [--latest]`
- `devices reject <requestId>`
- `devices remove <deviceId>`
- `devices clear --yes [--pending]`
- `devices rotate --device <id> --role <role> [--scope <scope...>]`
- `devices revoke --device <id> --role <role>`

Remarques :

- `devices list` et `devices approve` peuvent se replier sur les fichiers de pairing locaux sur local loopback lorsque l’étendue de pairing direct n’est pas disponible.
- `devices approve` sélectionne automatiquement la demande en attente la plus récente lorsqu’aucun `requestId` n’est fourni ou lorsque `--latest` est défini.
- Les reconnexions avec jeton stocké réutilisent les étendues approuvées mises en cache de ce jeton ; un `devices rotate --scope ...` explicite met à jour cet ensemble d’étendues stocké pour les futures reconnexions avec jeton mis en cache.
- `devices rotate` et `devices revoke` renvoient des charges utiles JSON.

### `qr`

Générez un QR de pairing mobile et un code de configuration à partir de la configuration Gateway actuelle. Voir [`openclaw qr`](/cli/qr).

Options :

- `--remote`
- `--url <url>`
- `--public-url <url>`
- `--token <token>`
- `--password <password>`
- `--setup-code-only`
- `--no-ascii`
- `--json`

Remarques :

- `--token` et `--password` sont mutuellement exclusifs.
- Le code de configuration transporte un jeton bootstrap de courte durée, et non le jeton/mot de passe gateway partagé.
- Le transfert bootstrap intégré conserve le jeton de nœud principal à `scopes: []`.
- Tout jeton bootstrap opérateur transmis reste limité à `operator.approvals`, `operator.read`, `operator.talk.secrets` et `operator.write`.
- Les vérifications d’étendue bootstrap sont préfixées par rôle, de sorte que cette liste d’autorisation opérateur ne satisfait que les demandes opérateur ; les rôles non opérateur nécessitent toujours des étendues sous leur propre préfixe de rôle.
- `--remote` peut utiliser `gateway.remote.url` ou l’URL active Tailscale Serve/Funnel.
- Après le scan, approuvez la demande avec `openclaw devices list` / `openclaw devices approve <requestId>`.

### `clawbot`

Espace de noms d’alias historique. Prend actuellement en charge `openclaw clawbot qr`, qui correspond à [`openclaw qr`](/cli/qr).

### `hooks`

Gérez les hooks internes de l’agent.

Sous-commandes :

- `hooks list`
- `hooks info <name>`
- `hooks check`
- `hooks enable <name>`
- `hooks disable <name>`
- `hooks install <path-or-spec>` (alias déprécié de `openclaw plugins install`)
- `hooks update [id]` (alias déprécié de `openclaw plugins update`)

Options courantes :

- `--json`
- `--eligible`
- `-v`, `--verbose`

Remarques :

- Les hooks gérés par plugin ne peuvent pas être activés ni désactivés via `openclaw hooks` ; activez ou désactivez plutôt le plugin propriétaire.
- `hooks install` et `hooks update` fonctionnent encore comme alias de compatibilité, mais affichent des avertissements de dépréciation et redirigent vers les commandes de plugin.

### `webhooks`

Assistants webhook. La surface intégrée actuelle est la configuration + l’exécution Gmail Pub/Sub :

- `webhooks gmail setup`
- `webhooks gmail run`

### `webhooks gmail`

Configuration + exécution du hook Gmail Pub/Sub. Voir [Gmail Pub/Sub](/automation/cron-jobs#gmail-pubsub-integration).

Sous-commandes :

- `webhooks gmail setup` (nécessite `--account <email>` ; prend en charge `--project`, `--topic`, `--subscription`, `--label`, `--hook-url`, `--hook-token`, `--push-token`, `--bind`, `--port`, `--path`, `--include-body`, `--max-bytes`, `--renew-minutes`, `--tailscale`, `--tailscale-path`, `--tailscale-target`, `--push-endpoint`, `--json`)
- `webhooks gmail run` (remplacements d’exécution pour les mêmes indicateurs)

Remarques :

- `setup` configure la surveillance Gmail ainsi que le chemin push côté OpenClaw.
- `run` démarre le watcher/la boucle de renouvellement Gmail local(e) avec des remplacements d’exécution facultatifs.

### `dns`

Assistants DNS pour la découverte étendue (CoreDNS + Tailscale). Surface intégrée actuelle :

- `dns setup [--domain <domain>] [--apply]`

### `dns setup`

Assistant DNS de découverte étendue (CoreDNS + Tailscale). Voir [/gateway/discovery](/gateway/discovery).

Options :

- `--domain <domain>`
- `--apply` : installe/met à jour la configuration CoreDNS (nécessite sudo ; macOS uniquement).

Remarques :

- Sans `--apply`, c’est un assistant de planification qui affiche la configuration DNS OpenClaw + Tailscale recommandée.
- `--apply` ne prend actuellement en charge que macOS avec Homebrew CoreDNS.

## Messagerie + agent

### `message`

Messagerie sortante unifiée + actions de canal.

Voir : [/cli/message](/cli/message)

Sous-commandes :

- `message send|poll|react|reactions|read|edit|delete|pin|unpin|pins|permissions|search|timeout|kick|ban`
- `message thread <create|list|reply>`
- `message emoji <list|upload>`
- `message sticker <send|upload>`
- `message role <info|add|remove>`
- `message channel <info|list>`
- `message member info`
- `message voice status`
- `message event <list|create>`

Exemples :

- `openclaw message send --target +15555550123 --message "Hi"`
- `openclaw message poll --channel discord --target channel:123 --poll-question "Snack?" --poll-option Pizza --poll-option Sushi`

### `agent`

Exécute un tour d’agent via la Gateway (ou intégré avec `--local`).

Passez au moins un sélecteur de session : `--to`, `--session-id` ou `--agent`.

Requis :

- `-m, --message <text>`

Options :

- `-t, --to <dest>` (pour la clé de session et la livraison facultative)
- `--session-id <id>`
- `--agent <id>` (identifiant d’agent ; remplace les bindings de routage)
- `--thinking <off|minimal|low|medium|high|xhigh>` (la prise en charge varie selon le provider ; pas de filtrage au niveau du modèle dans la CLI)
- `--verbose <on|off>`
- `--channel <channel>` (canal de livraison ; omettez-le pour utiliser le canal de la session principale)
- `--reply-to <target>` (remplacement de la cible de livraison, distinct du routage de session)
- `--reply-channel <channel>` (remplacement du canal de livraison)
- `--reply-account <id>` (remplacement de l’identifiant de compte de livraison)
- `--local` (exécution intégrée ; le registre de plugins est toujours préchargé en premier)
- `--deliver`
- `--json`
- `--timeout <seconds>`

Remarques :

- Le mode Gateway bascule vers l’agent intégré lorsque la requête Gateway échoue.
- `--local` précharge quand même le registre de plugins, de sorte que les providers, outils et canaux fournis par les plugins restent disponibles pendant les exécutions intégrées.
- `--channel`, `--reply-channel` et `--reply-account` affectent la livraison de la réponse, et non le routage.

### `agents`

Gérez des agents isolés (espaces de travail + authentification + routage).

Exécuter `openclaw agents` sans sous-commande équivaut à `openclaw agents list`.

#### `agents list`

Liste les agents configurés.

Options :

- `--json`
- `--bindings`

#### `agents add [name]`

Ajoute un nouvel agent isolé. Exécute l’assistant guidé sauf si des indicateurs (ou `--non-interactive`) sont passés ; `--workspace` est requis en mode non interactif.

Options :

- `--workspace <dir>`
- `--model <id>`
- `--agent-dir <dir>`
- `--bind <channel[:accountId]>` (répétable)
- `--non-interactive`
- `--json`

Les spécifications de binding utilisent `channel[:accountId]`. Lorsque `accountId` est omis, OpenClaw peut résoudre l’étendue du compte via les valeurs par défaut du canal / hooks de plugin ; sinon, il s’agit d’un binding de canal sans étendue de compte explicite.
Passer un indicateur add explicite fait basculer la commande vers le chemin non interactif. `main` est réservé et ne peut pas être utilisé comme nouvel identifiant d’agent.

#### `agents bindings`

Liste les bindings de routage.

Options :

- `--agent <id>`
- `--json`

#### `agents bind`

Ajoute des bindings de routage pour un agent.

Options :

- `--agent <id>` (par défaut l’agent actuel par défaut)
- `--bind <channel[:accountId]>` (répétable)
- `--json`

#### `agents unbind`

Supprime des bindings de routage pour un agent.

Options :

- `--agent <id>` (par défaut l’agent actuel par défaut)
- `--bind <channel[:accountId]>` (répétable)
- `--all`
- `--json`

Utilisez soit `--all`, soit `--bind`, mais pas les deux.

#### `agents delete <id>`

Supprime un agent et élague son espace de travail + son état.

Options :

- `--force`
- `--json`

Remarques :

- `main` ne peut pas être supprimé.
- Sans `--force`, une confirmation interactive est requise.

#### `agents set-identity`

Met à jour l’identité d’un agent (nom/thème/emoji/avatar).

Options :

- `--agent <id>`
- `--workspace <dir>`
- `--identity-file <path>`
- `--from-identity`
- `--name <name>`
- `--theme <theme>`
- `--emoji <emoji>`
- `--avatar <value>`
- `--json`

Remarques :

- `--agent` ou `--workspace` peuvent être utilisés pour sélectionner l’agent cible.
- Lorsqu’aucun champ d’identité explicite n’est fourni, la commande lit `IDENTITY.md`.

### `acp`

Exécute le pont ACP qui connecte les IDE à la Gateway.

Options racine :

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

Client ACP interactif pour le débogage du pont.

Options :

- `--cwd <dir>`
- `--server <command>`
- `--server-args <args...>`
- `--server-verbose`
- `--verbose`

Voir [`acp`](/cli/acp) pour le comportement complet, les remarques de sécurité et des exemples.

### `mcp`

Gérez les définitions de serveur MCP enregistrées et exposez les canaux OpenClaw via MCP stdio.

#### `mcp serve`

Expose les conversations de canal OpenClaw routées via MCP stdio.

Options :

- `--url <url>`
- `--token <token>`
- `--token-file <path>`
- `--password <password>`
- `--password-file <path>`
- `--claude-channel-mode <auto|on|off>`
- `--verbose`

#### `mcp list`

Liste les définitions de serveur MCP enregistrées.

Options :

- `--json`

#### `mcp show [name]`

Affiche une définition de serveur MCP enregistrée ou l’objet complet de serveur MCP enregistré.

Options :

- `--json`

#### `mcp set <name> <value>`

Enregistre une définition de serveur MCP à partir d’un objet JSON.

#### `mcp unset <name>`

Supprime une définition de serveur MCP enregistrée.

### `approvals`

Gérez les approbations exec. Alias : `exec-approvals`.

#### `approvals get`

Récupère le snapshot des approbations exec et la politique effective.

Options :

- `--node <node>`
- `--gateway`
- `--json`
- options RPC de nœud depuis `openclaw nodes`

#### `approvals set`

Remplace les approbations exec par du JSON provenant d’un fichier ou de stdin.

Options :

- `--node <node>`
- `--gateway`
- `--file <path>`
- `--stdin`
- `--json`
- options RPC de nœud depuis `openclaw nodes`

#### `approvals allowlist add|remove`

Modifie la liste d’autorisation exec par agent.

Options :

- `--node <node>`
- `--gateway`
- `--agent <id>` (par défaut `*`)
- `--json`
- options RPC de nœud depuis `openclaw nodes`

### `status`

Affiche l’état de santé de la session liée et les destinataires récents.

Options :

- `--json`
- `--all` (diagnostic complet ; lecture seule, prêt à coller)
- `--deep` (demande à la gateway une sonde de santé live, y compris des sondes de canal lorsque prises en charge)
- `--usage` (affiche l’utilisation/quota du provider de modèle)
- `--timeout <ms>`
- `--verbose`
- `--debug` (alias de `--verbose`)

Remarques :

- La vue d’ensemble inclut l’état du service Gateway + node host lorsqu’il est disponible.
- `--usage` affiche les fenêtres d’utilisation provider normalisées sous la forme `X% left`.

### Suivi d’utilisation

OpenClaw peut afficher l’utilisation/quota des providers lorsque des identifiants OAuth/API sont disponibles.

Surfaces :

- `/status` (ajoute une courte ligne d’utilisation provider lorsqu’elle est disponible)
- `openclaw status --usage` (affiche la ventilation complète par provider)
- barre de menus macOS (section Usage sous Context)

Remarques :

- Les données proviennent directement des points de terminaison d’utilisation des providers (pas d’estimations).
- La sortie lisible par un humain est normalisée à `X% left` pour tous les providers.
- Providers avec fenêtres d’utilisation actuelles : Anthropic, GitHub Copilot, Gemini CLI, OpenAI Codex, MiniMax, Xiaomi et z.ai.
- Remarque MiniMax : les champs bruts `usage_percent` / `usagePercent` signifient quota restant, donc OpenClaw les inverse avant affichage ; les champs basés sur les décomptes restent prioritaires lorsqu’ils sont présents. Les réponses `model_remains` préfèrent l’entrée de modèle de chat, dérivent l’étiquette de fenêtre à partir des horodatages si nécessaire et incluent le nom du modèle dans l’étiquette du plan.
- L’authentification d’utilisation provient de hooks spécifiques au provider lorsqu’ils sont disponibles ; sinon OpenClaw se replie sur des identifiants OAuth/API-key correspondants issus des profils auth, de l’environnement ou de la configuration. Si rien ne se résout, l’utilisation est masquée.
- Détails : voir [Usage tracking](/concepts/usage-tracking).

### `health`

Récupère l’état de santé depuis la Gateway en cours d’exécution.

Options :

- `--json`
- `--timeout <ms>`
- `--verbose` (force une sonde live et affiche les détails de connexion gateway)
- `--debug` (alias de `--verbose`)

Remarques :

- `health` par défaut peut renvoyer un snapshot gateway récent mis en cache.
- `health --verbose` force une sonde live et étend la sortie lisible par un humain à tous les comptes et agents configurés.

### `sessions`

Liste les sessions de conversation stockées.

Options :

- `--json`
- `--verbose`
- `--store <path>`
- `--active <minutes>`
- `--agent <id>` (filtre les sessions par agent)
- `--all-agents` (affiche les sessions de tous les agents)

Sous-commandes :

- `sessions cleanup` — supprime les sessions expirées ou orphelines

Remarques :

- `sessions cleanup` prend aussi en charge `--fix-missing` pour élaguer les entrées dont les fichiers de transcription ont disparu.

## Reset / Uninstall

### `reset`

Réinitialise la configuration/l’état local (conserve la CLI installée).

Options :

- `--scope <config|config+creds+sessions|full>`
- `--yes`
- `--non-interactive`
- `--dry-run`

Remarques :

- `--non-interactive` nécessite `--scope` et `--yes`.

### `uninstall`

Désinstalle le service gateway + les données locales (la CLI est conservée).

Options :

- `--service`
- `--state`
- `--workspace`
- `--app`
- `--all`
- `--yes`
- `--non-interactive`
- `--dry-run`

Remarques :

- `--non-interactive` nécessite `--yes` et des étendues explicites (ou `--all`).
- `--all` supprime ensemble le service, l’état, l’espace de travail et l’application.

### `tasks`

Liste et gère les exécutions de [background task](/automation/tasks) entre les agents.

- `tasks list` — affiche les exécutions de tâche actives et récentes
- `tasks show <id>` — affiche les détails d’une exécution de tâche spécifique
- `tasks notify <id>` — modifie la politique de notification d’une exécution de tâche
- `tasks cancel <id>` — annule une tâche en cours d’exécution
- `tasks audit` — met en évidence les problèmes opérationnels (obsolètes, perdues, échecs de livraison)
- `tasks maintenance [--apply] [--json]` — prévisualise ou applique le nettoyage/la réconciliation des tâches et de TaskFlow (sessions enfant ACP/subagent, jobs cron actifs, exécutions CLI live)
- `tasks flow list` — liste les flux Task Flow actifs et récents
- `tasks flow show <lookup>` — inspecte un flux par id ou clé de recherche
- `tasks flow cancel <lookup>` — annule un flux en cours d’exécution et ses tâches actives

### `flows`

Raccourci historique dans la documentation. Les commandes flow se trouvent sous `openclaw tasks flow` :

- `tasks flow list [--json]`
- `tasks flow show <lookup>`
- `tasks flow cancel <lookup>`

## Gateway

### `gateway`

Exécute la Gateway WebSocket.

Options :

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
- `--reset` (réinitialise la config dev + identifiants + sessions + espace de travail)
- `--force` (tue l’écouteur existant sur le port)
- `--verbose`
- `--cli-backend-logs`
- `--claude-cli-logs` (alias déprécié)
- `--ws-log <auto|full|compact>`
- `--compact` (alias de `--ws-log compact`)
- `--raw-stream`
- `--raw-stream-path <path>`

### `gateway service`

Gérez le service Gateway (launchd/systemd/schtasks).

Sous-commandes :

- `gateway status` (sonde la RPC Gateway par défaut)
- `gateway install` (installation du service)
- `gateway uninstall`
- `gateway start`
- `gateway stop`
- `gateway restart`

Remarques :

- `gateway status` sonde par défaut la RPC Gateway en utilisant le port/la configuration résolus du service (remplacez avec `--url/--token/--password`).
- `gateway status` prend en charge `--no-probe`, `--deep`, `--require-rpc` et `--json` pour les scripts.
- `gateway status` met également en évidence les services gateway historiques ou supplémentaires lorsqu’il peut les détecter (`--deep` ajoute des analyses au niveau système). Les services OpenClaw nommés par profil sont traités comme de première classe et ne sont pas signalés comme « supplémentaires ».
- `gateway status` reste disponible pour le diagnostic même si la configuration CLI locale est absente ou invalide.
- `gateway status` affiche le chemin résolu du journal fichier, le snapshot des chemins/validités de configuration CLI-vs-service et l’URL cible de sonde résolue.
- Si les SecretRefs d’authentification gateway ne sont pas résolus dans le chemin de commande actuel, `gateway status --json` ne signale `rpc.authWarning` que lorsque la connectivité/authentification de la sonde échoue (les avertissements sont supprimés lorsque la sonde réussit).
- Sur les installations Linux systemd, les vérifications de dérive de jeton dans status incluent les sources d’unité `Environment=` et `EnvironmentFile=`.
- `gateway install|uninstall|start|stop|restart` prend en charge `--json` pour les scripts (la sortie par défaut reste conviviale pour les humains).
- `gateway install` utilise Node par défaut ; bun est **non recommandé** (bogues WhatsApp/Telegram).
- Options de `gateway install` : `--port`, `--runtime`, `--token`, `--force`, `--json`.

### `daemon`

Alias historique des commandes de gestion du service Gateway. Voir [/cli/daemon](/cli/daemon).

Sous-commandes :

- `daemon status`
- `daemon install`
- `daemon uninstall`
- `daemon start`
- `daemon stop`
- `daemon restart`

Options courantes :

- `status` : `--url`, `--token`, `--password`, `--timeout`, `--no-probe`, `--require-rpc`, `--deep`, `--json`
- `install` : `--port`, `--runtime <node|bun>`, `--token`, `--force`, `--json`
- `uninstall|start|stop|restart` : `--json`

### `logs`

Suit les journaux fichier de la Gateway via RPC.

Options :

- `--limit <n>` : nombre maximal de lignes de journal à renvoyer
- `--max-bytes <n>` : nombre maximal d’octets à lire depuis le fichier journal
- `--follow` : suit le fichier journal (style tail -f)
- `--interval <ms>` : intervalle d’interrogation en ms lors du suivi
- `--local-time` : affiche les horodatages en heure locale
- `--json` : émet du JSON délimité par des lignes
- `--plain` : désactive la mise en forme structurée
- `--no-color` : désactive les couleurs ANSI
- `--url <url>` : URL WebSocket Gateway explicite
- `--token <token>` : jeton Gateway
- `--timeout <ms>` : délai d’attente RPC Gateway
- `--expect-final` : attend une réponse finale lorsque nécessaire

Exemples :

```bash
openclaw logs --follow
openclaw logs --limit 200
openclaw logs --plain
openclaw logs --json
openclaw logs --no-color
```

Remarques :

- Si vous passez `--url`, la CLI n’applique pas automatiquement les identifiants de configuration ou d’environnement.
- Les échecs de pairing local loopback se replient sur le fichier journal local configuré ; les cibles `--url` explicites ne le font pas.

### `gateway <subcommand>`

Assistants CLI Gateway (utilisez `--url`, `--token`, `--password`, `--timeout`, `--expect-final` pour les sous-commandes RPC).
Lorsque vous passez `--url`, la CLI n’applique pas automatiquement les identifiants de configuration ou d’environnement.
Incluez explicitement `--token` ou `--password`. L’absence d’identifiants explicites est une erreur.

Sous-commandes :

- `gateway call <method> [--params <json>] [--url <url>] [--token <token>] [--password <password>] [--timeout <ms>] [--expect-final] [--json]`
- `gateway health`
- `gateway status`
- `gateway probe`
- `gateway discover`
- `gateway install|uninstall|start|stop|restart`
- `gateway run`

Remarques :

- `gateway status --deep` ajoute une analyse de service au niveau système. Utilisez `gateway probe`,
  `health --verbose` ou le `status --deep` de premier niveau pour des détails de sonde d’exécution plus approfondis.

RPC courantes :

- `config.schema.lookup` (inspecte un sous-arbre de configuration avec un nœud de schéma superficiel, des métadonnées d’indice correspondantes et des résumés des enfants immédiats)
- `config.get` (lit le snapshot de configuration actuel + hash)
- `config.set` (valide + écrit la configuration complète ; utilisez `baseHash` pour la concurrence optimiste)
- `config.apply` (valide + écrit la configuration + redémarre + réveille)
- `config.patch` (fusionne une mise à jour partielle + redémarre + réveille)
- `update.run` (exécute la mise à jour + redémarre + réveille)

Astuce : lorsque vous appelez directement `config.set`/`config.apply`/`config.patch`, passez `baseHash` depuis
`config.get` si une configuration existe déjà.
Astuce : pour les modifications partielles, inspectez d’abord avec `config.schema.lookup` et préférez `config.patch`.
Astuce : ces RPC d’écriture de configuration effectuent en amont la résolution des SecretRefs actifs dans la charge utile de configuration soumise et rejettent les écritures lorsqu’une ref soumise effectivement active n’est pas résolue.
Astuce : l’outil runtime `gateway` réservé au propriétaire refuse toujours de réécrire `tools.exec.ask` ou `tools.exec.security` ; les anciens alias `tools.bash.*` sont normalisés vers les mêmes chemins exec protégés.

## Models

Voir [/concepts/models](/concepts/models) pour le comportement de fallback et la stratégie de scan.

Remarque de facturation : nous pensons que le fallback Claude Code CLI est probablement autorisé pour une automatisation locale gérée par l’utilisateur, d’après la documentation publique de la CLI Anthropic. Cela dit, la politique Anthropic sur les harness tiers crée suffisamment d’ambiguïté autour de l’utilisation adossée à un abonnement dans des produits externes pour que nous ne le recommandions pas en production. Anthropic a également informé les utilisateurs d’OpenClaw le **4 avril 2026 à 12:00 PM PT / 8:00 PM BST** que le chemin Claude-login **OpenClaw** compte comme usage de harness tiers et nécessite **Extra Usage**, facturé séparément de l’abonnement. En production, préférez une clé API Anthropic ou un autre provider compatible de type abonnement comme OpenAI Codex, Alibaba Cloud Model Studio Coding Plan, MiniMax Coding Plan ou Z.AI / GLM Coding Plan.

Migration Anthropic Claude CLI :

```bash
openclaw models auth login --provider anthropic --method cli --set-default
```

Raccourci onboarding : `openclaw onboard --auth-choice anthropic-cli`

Anthropic setup-token est également de nouveau disponible comme chemin auth historique/manuel.
Utilisez-le uniquement en gardant à l’esprit qu’Anthropic a indiqué aux utilisateurs d’OpenClaw que
le chemin OpenClaw Claude-login nécessite **Extra Usage**.

Remarque sur les alias historiques : `claude-cli` est l’alias auth-choice d’onboarding déprécié.
Utilisez `anthropic-cli` pour l’onboarding, ou utilisez directement `models auth login`.

### `models` (racine)

`openclaw models` est un alias de `models status`.

Options racine :

- `--status-json` (alias de `models status --json`)
- `--status-plain` (alias de `models status --plain`)

### `models list`

Options :

- `--all`
- `--local`
- `--provider <name>`
- `--json`
- `--plain`

### `models status`

Options :

- `--json`
- `--plain`
- `--check` (quitte avec 1=expiré/manquant, 2=expiration proche)
- `--probe` (sonde live des profils auth configurés)
- `--probe-provider <name>`
- `--probe-profile <id>` (répéter ou séparer par des virgules)
- `--probe-timeout <ms>`
- `--probe-concurrency <n>`
- `--probe-max-tokens <n>`
- `--agent <id>`

Inclut toujours la vue d’ensemble auth et le statut d’expiration OAuth pour les profils du magasin auth.
`--probe` exécute des requêtes live (peut consommer des jetons et déclencher des limites de débit).
Les lignes de sonde peuvent provenir de profils auth, d’identifiants d’environnement ou de `models.json`.
Attendez-vous à des statuts de sonde comme `ok`, `auth`, `rate_limit`, `billing`, `timeout`,
`format`, `unknown` et `no_model`.
Lorsqu’un `auth.order.<provider>` explicite omet un profil enregistré, la sonde signale
`excluded_by_auth_order` au lieu d’essayer silencieusement ce profil.

### `models set <model>`

Définit `agents.defaults.model.primary`.

### `models set-image <model>`

Définit `agents.defaults.imageModel.primary`.

### `models aliases list|add|remove`

Options :

- `list` : `--json`, `--plain`
- `add <alias> <model>`
- `remove <alias>`

### `models fallbacks list|add|remove|clear`

Options :

- `list` : `--json`, `--plain`
- `add <model>`
- `remove <model>`
- `clear`

### `models image-fallbacks list|add|remove|clear`

Options :

- `list` : `--json`, `--plain`
- `add <model>`
- `remove <model>`
- `clear`

### `models scan`

Options :

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

Options :

- `add` : assistant auth interactif (flux auth provider ou collage de jeton)
- `login` : `--provider <name>`, `--method <method>`, `--set-default`
- `login-github-copilot` : flux de connexion OAuth GitHub Copilot (`--yes`)
- `setup-token` : `--provider <name>`, `--yes`
- `paste-token` : `--provider <name>`, `--profile-id <id>`, `--expires-in <duration>`

Remarques :

- `setup-token` et `paste-token` sont des commandes de jeton génériques pour les providers qui exposent des méthodes d’authentification par jeton.
- `setup-token` nécessite un TTY interactif et exécute la méthode d’authentification par jeton du provider.
- `paste-token` demande la valeur du jeton et utilise par défaut l’identifiant de profil auth `<provider>:manual` lorsque `--profile-id` est omis.
- Anthropic `setup-token` / `paste-token` sont à nouveau disponibles comme chemin OpenClaw historique/manuel. Anthropic a indiqué aux utilisateurs d’OpenClaw que ce chemin nécessite **Extra Usage** sur le compte Claude.

### `models auth order get|set|clear`

Options :

- `get` : `--provider <name>`, `--agent <id>`, `--json`
- `set` : `--provider <name>`, `--agent <id>`, `<profileIds...>`
- `clear` : `--provider <name>`, `--agent <id>`

## System

### `system event`

Place un événement système en file et peut éventuellement déclencher un heartbeat (RPC Gateway).

Requis :

- `--text <text>`

Options :

- `--mode <now|next-heartbeat>`
- `--json`
- `--url`, `--token`, `--timeout`, `--expect-final`

### `system heartbeat last|enable|disable`

Contrôles de heartbeat (RPC Gateway).

Options :

- `--json`
- `--url`, `--token`, `--timeout`, `--expect-final`

### `system presence`

Liste les entrées de présence système (RPC Gateway).

Options :

- `--json`
- `--url`, `--token`, `--timeout`, `--expect-final`

## Cron

Gérez les jobs planifiés (RPC Gateway). Voir [/automation/cron-jobs](/automation/cron-jobs).

Sous-commandes :

- `cron status [--json]`
- `cron list [--all] [--json]` (sortie tableau par défaut ; utilisez `--json` pour le brut)
- `cron add` (alias : `create` ; nécessite `--name` et exactement un de `--at` | `--every` | `--cron`, et exactement une charge utile parmi `--system-event` | `--message`)
- `cron edit <id>` (corrige des champs)
- `cron rm <id>` (alias : `remove`, `delete`)
- `cron enable <id>`
- `cron disable <id>`
- `cron runs --id <id> [--limit <n>]`
- `cron run <id> [--due]`

Toutes les commandes `cron` acceptent `--url`, `--token`, `--timeout`, `--expect-final`.

`cron add|edit --model ...` utilise ce modèle autorisé sélectionné pour le job. Si
le modèle n’est pas autorisé, cron avertit et revient à la sélection de modèle
par défaut/de l’agent du job à la place. Les chaînes de fallback configurées
continuent de s’appliquer, mais un simple remplacement de modèle sans liste de fallback
explicite par job n’ajoute plus le modèle primaire de l’agent comme cible de nouvelle tentative cachée supplémentaire.

## Hôte de nœud

### `node`

`node` exécute un **hôte de nœud headless** ou le gère comme service en arrière-plan. Voir
[`openclaw node`](/cli/node).

Sous-commandes :

- `node run --host <gateway-host> --port 18789`
- `node status`
- `node install [--host <gateway-host>] [--port <port>] [--tls] [--tls-fingerprint <sha256>] [--node-id <id>] [--display-name <name>] [--runtime <node|bun>] [--force]`
- `node uninstall`
- `node stop`
- `node restart`

Remarques d’authentification :

- `node` résout l’authentification gateway depuis l’environnement/la configuration (pas d’indicateurs `--token`/`--password`) : `OPENCLAW_GATEWAY_TOKEN` / `OPENCLAW_GATEWAY_PASSWORD`, puis `gateway.auth.*`. En mode local, node host ignore volontairement `gateway.remote.*` ; en `gateway.mode=remote`, `gateway.remote.*` participe selon les règles de priorité à distance.
- La résolution d’authentification de node host ne respecte que les variables d’environnement `OPENCLAW_GATEWAY_*`.

## Nodes

`nodes` communique avec la Gateway et cible les nœuds pairés. Voir [/nodes](/nodes).

Options courantes :

- `--url`, `--token`, `--timeout`, `--json`

Sous-commandes :

- `nodes status [--connected] [--last-connected <duration>]`
- `nodes describe --node <id|name|ip>`
- `nodes list [--connected] [--last-connected <duration>]`
- `nodes pending`
- `nodes approve <requestId>`
- `nodes reject <requestId>`
- `nodes rename --node <id|name|ip> --name <displayName>`
- `nodes invoke --node <id|name|ip> --command <command> [--params <json>] [--invoke-timeout <ms>] [--idempotency-key <key>]`
- `nodes notify --node <id|name|ip> [--title <text>] [--body <text>] [--sound <name>] [--priority <passive|active|timeSensitive>] [--delivery <system|overlay|auto>] [--invoke-timeout <ms>]` (mac uniquement)

Caméra :

- `nodes camera list --node <id|name|ip>`
- `nodes camera snap --node <id|name|ip> [--facing front|back|both] [--device-id <id>] [--max-width <px>] [--quality <0-1>] [--delay-ms <ms>] [--invoke-timeout <ms>]`
- `nodes camera clip --node <id|name|ip> [--facing front|back] [--device-id <id>] [--duration <ms|10s|1m>] [--no-audio] [--invoke-timeout <ms>]`

Canvas + écran :

- `nodes canvas snapshot --node <id|name|ip> [--format png|jpg|jpeg] [--max-width <px>] [--quality <0-1>] [--invoke-timeout <ms>]`
- `nodes canvas present --node <id|name|ip> [--target <urlOrPath>] [--x <px>] [--y <px>] [--width <px>] [--height <px>] [--invoke-timeout <ms>]`
- `nodes canvas hide --node <id|name|ip> [--invoke-timeout <ms>]`
- `nodes canvas navigate <url> --node <id|name|ip> [--invoke-timeout <ms>]`
- `nodes canvas eval [<js>] --node <id|name|ip> [--js <code>] [--invoke-timeout <ms>]`
- `nodes canvas a2ui push --node <id|name|ip> (--jsonl <path> | --text <text>) [--invoke-timeout <ms>]`
- `nodes canvas a2ui reset --node <id|name|ip> [--invoke-timeout <ms>]`
- `nodes screen record --node <id|name|ip> [--screen <index>] [--duration <ms|10s>] [--fps <n>] [--no-audio] [--out <path>] [--invoke-timeout <ms>]`

Emplacement :

- `nodes location get --node <id|name|ip> [--max-age <ms>] [--accuracy <coarse|balanced|precise>] [--location-timeout <ms>] [--invoke-timeout <ms>]`

## Browser

CLI de contrôle du navigateur (Chrome/Brave/Edge/Chromium dédiés). Voir [`openclaw browser`](/cli/browser) et le [Browser tool](/tools/browser).

Options courantes :

- `--url`, `--token`, `--timeout`, `--expect-final`, `--json`
- `--browser-profile <name>`

Gestion :

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

Inspection :

- `browser screenshot [targetId] [--full-page] [--ref <ref>] [--element <selector>] [--type png|jpeg]`
- `browser snapshot [--format aria|ai] [--target-id <id>] [--limit <n>] [--interactive] [--compact] [--depth <n>] [--selector <sel>] [--out <path>]`

Actions :

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

## Appel vocal

### `voicecall`

Utilitaires d’appel vocal fournis par plugin. N’apparaît que si le plugin voice-call est installé et activé. Voir [`openclaw voicecall`](/cli/voicecall).

Commandes courantes :

- `voicecall call --to <phone> --message <text> [--mode notify|conversation]`
- `voicecall start --to <phone> [--message <text>] [--mode notify|conversation]`
- `voicecall continue --call-id <id> --message <text>`
- `voicecall speak --call-id <id> --message <text>`
- `voicecall end --call-id <id>`
- `voicecall status --call-id <id>`
- `voicecall tail [--file <path>] [--since <n>] [--poll <ms>]`
- `voicecall latency [--file <path>] [--last <n>]`
- `voicecall expose [--mode off|serve|funnel] [--path <path>] [--port <port>] [--serve-path <path>]`

## Recherche dans la documentation

### `docs`

Recherche dans l’index live de la documentation OpenClaw.

### `docs [query...]`

Recherche dans l’index live de la documentation.

## TUI

### `tui`

Ouvre l’interface terminal connectée à la Gateway.

Options :

- `--url <url>`
- `--token <token>`
- `--password <password>`
- `--session <key>`
- `--deliver`
- `--thinking <level>`
- `--message <text>`
- `--timeout-ms <ms>` (par défaut `agents.defaults.timeoutSeconds`)
- `--history-limit <n>`
