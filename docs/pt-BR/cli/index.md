---
read_when:
    - Adicionando ou modificando comandos ou opções da CLI
    - Documentando novas superfícies de comando
summary: Referência de CLI do OpenClaw para comandos, subcomandos e opções de `openclaw`
title: Referência de CLI
x-i18n:
    generated_at: "2026-04-05T12:40:43Z"
    model: gpt-5.4
    provider: openai
    source_hash: 7c25e5ebfe256412b44130dba39cf39b0a7d1d22e3abb417345e95c95ca139bf
    source_path: cli/index.md
    workflow: 15
---

# Referência de CLI

Esta página descreve o comportamento atual da CLI. Se os comandos mudarem, atualize este documento.

## Páginas de comando

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
- [`plugins`](/cli/plugins) (comandos de plugin)
- [`channels`](/cli/channels)
- [`security`](/cli/security)
- [`secrets`](/cli/secrets)
- [`skills`](/cli/skills)
- [`daemon`](/cli/daemon) (alias legado para comandos de serviço do gateway)
- [`clawbot`](/cli/clawbot) (namespace de alias legado)
- [`voicecall`](/cli/voicecall) (plugin; se instalado)

## Flags globais

- `--dev`: isola o estado em `~/.openclaw-dev` e altera as portas padrão.
- `--profile <name>`: isola o estado em `~/.openclaw-<name>`.
- `--container <name>`: direciona a execução para um contêiner nomeado.
- `--no-color`: desabilita cores ANSI.
- `--update`: atalho para `openclaw update` (somente instalações de origem).
- `-V`, `--version`, `-v`: imprime a versão e sai.

## Estilo de saída

- Cores ANSI e indicadores de progresso só são renderizados em sessões TTY.
- Hiperlinks OSC-8 são renderizados como links clicáveis em terminais compatíveis; caso contrário, usamos fallback para URLs simples.
- `--json` (e `--plain`, quando compatível) desabilita o estilo para uma saída limpa.
- `--no-color` desabilita o estilo ANSI; `NO_COLOR=1` também é respeitado.
- Comandos de longa duração mostram um indicador de progresso (OSC 9;4 quando compatível).

## Paleta de cores

O OpenClaw usa uma paleta lobster para a saída da CLI.

- `accent` (#FF5A2D): títulos, rótulos, destaques primários.
- `accentBright` (#FF7A3D): nomes de comandos, ênfase.
- `accentDim` (#D14A22): texto de destaque secundário.
- `info` (#FF8A5B): valores informativos.
- `success` (#2FBF71): estados de sucesso.
- `warn` (#FFB020): avisos, fallbacks, atenção.
- `error` (#E23D2D): erros, falhas.
- `muted` (#8B7F77): redução de ênfase, metadados.

Fonte de verdade da paleta: `src/terminal/palette.ts` (a “paleta lobster”).

## Árvore de comandos

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

Observação: plugins podem adicionar comandos adicionais de nível superior (por exemplo `openclaw voicecall`).

## Segurança

- `openclaw security audit` — audita a configuração + estado local em busca de erros comuns de segurança.
- `openclaw security audit --deep` — probe ativo do gateway em modo best-effort.
- `openclaw security audit --fix` — reforça padrões seguros e permissões de estado/configuração.

## Segredos

### `secrets`

Gerencie SecretRefs e a higiene relacionada de tempo de execução/configuração.

Subcomandos:

- `secrets reload`
- `secrets audit`
- `secrets configure`
- `secrets apply --from <path>`

Opções de `secrets reload`:

- `--url`, `--token`, `--timeout`, `--expect-final`, `--json`

Opções de `secrets audit`:

- `--check`
- `--allow-exec`
- `--json`

Opções de `secrets configure`:

- `--apply`
- `--yes`
- `--providers-only`
- `--skip-provider-setup`
- `--agent <id>`
- `--allow-exec`
- `--plan-out <path>`
- `--json`

Opções de `secrets apply --from <path>`:

- `--dry-run`
- `--allow-exec`
- `--json`

Observações:

- `reload` é um RPC do gateway e mantém o snapshot de tempo de execução último-conhecido-bom quando a resolução falha.
- `audit --check` retorna não zero em caso de achados; refs não resolvidas usam um código de saída não zero de prioridade mais alta.
- Verificações de exec em dry-run são ignoradas por padrão; use `--allow-exec` para habilitá-las.

## Plugins

Gerencie extensões e suas configurações:

- `openclaw plugins list` — descobre plugins (use `--json` para saída legível por máquina).
- `openclaw plugins inspect <id>` — mostra detalhes de um plugin (`info` é um alias).
- `openclaw plugins install <path|.tgz|npm-spec|plugin@marketplace>` — instala um plugin (ou adiciona um caminho de plugin a `plugins.load.paths`; use `--force` para sobrescrever um destino de instalação existente).
- `openclaw plugins marketplace list <marketplace>` — lista entradas do marketplace antes da instalação.
- `openclaw plugins enable <id>` / `disable <id>` — alterna `plugins.entries.<id>.enabled`.
- `openclaw plugins doctor` — relata erros de carregamento de plugin.

A maioria das mudanças de plugin exige reinicialização do gateway. Consulte [/plugin](/tools/plugin).

## Memory

Pesquisa vetorial sobre `MEMORY.md` + `memory/*.md`:

- `openclaw memory status` — mostra estatísticas do índice; use `--deep` para verificações de prontidão de vetores + embeddings ou `--fix` para reparar artefatos obsoletos de recall/promotion.
- `openclaw memory index` — reindexa arquivos de memória.
- `openclaw memory search "<query>"` (ou `--query "<query>"`) — pesquisa semântica sobre a memória.
- `openclaw memory promote` — classifica recalls de curto prazo e, opcionalmente, acrescenta as principais entradas em `MEMORY.md`.

## Sandbox

Gerencie runtimes de sandbox para execução isolada de agentes. Consulte [/cli/sandbox](/cli/sandbox).

Subcomandos:

- `sandbox list [--browser] [--json]`
- `sandbox recreate [--all] [--session <key>] [--agent <id>] [--browser] [--force]`
- `sandbox explain [--session <key>] [--agent <id>] [--json]`

Observações:

- `sandbox recreate` remove runtimes existentes para que o próximo uso os inicialize novamente com a configuração atual.
- Para backends `ssh` e OpenShell `remote`, recreate exclui o workspace remoto canônico para o escopo selecionado.

## Comandos Slash do chat

Mensagens de chat oferecem suporte a comandos `/...` (texto e nativos). Consulte [/tools/slash-commands](/tools/slash-commands).

Destaques:

- `/status` para diagnósticos rápidos.
- `/config` para alterações persistidas de configuração.
- `/debug` para substituições de configuração apenas em tempo de execução (memória, não disco; exige `commands.debug: true`).

## Configuração inicial + onboarding

### `completion`

Gere scripts de autocompletar do shell e, opcionalmente, instale-os no perfil do seu shell.

Opções:

- `-s, --shell <zsh|bash|powershell|fish>`
- `-i, --install`
- `--write-state`
- `-y, --yes`

Observações:

- Sem `--install` ou `--write-state`, `completion` imprime o script em stdout.
- `--install` grava um bloco `OpenClaw Completion` no perfil do seu shell e o aponta para o script em cache no diretório de estado do OpenClaw.

### `setup`

Inicializa configuração + workspace.

Opções:

- `--workspace <dir>`: caminho do workspace do agente (padrão `~/.openclaw/workspace`).
- `--wizard`: executa o onboarding.
- `--non-interactive`: executa o onboarding sem prompts.
- `--mode <local|remote>`: modo de onboarding.
- `--remote-url <url>`: URL remota do gateway.
- `--remote-token <token>`: token remoto do gateway.

O onboarding é executado automaticamente quando qualquer flag de onboarding está presente (`--non-interactive`, `--mode`, `--remote-url`, `--remote-token`).

### `onboard`

Onboarding interativo para gateway, workspace e Skills.

Opções:

- `--workspace <dir>`
- `--reset` (redefine configuração + credenciais + sessões antes do onboarding)
- `--reset-scope <config|config+creds+sessions|full>` (padrão `config+creds+sessions`; use `full` para também remover o workspace)
- `--non-interactive`
- `--mode <local|remote>`
- `--flow <quickstart|advanced|manual>` (manual é um alias para advanced)
- `--auth-choice <choice>` em que `<choice>` é um de:
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
- Observação sobre Qwen: `qwen-*` é a família canônica de auth-choice. IDs
  `modelstudio-*` continuam aceitos apenas como aliases legados de compatibilidade.
- `--secret-input-mode <plaintext|ref>` (padrão `plaintext`; use `ref` para armazenar refs de env padrão do provedor em vez de chaves em texto simples)
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
- `--custom-base-url <url>` (não interativo; usado com `--auth-choice custom-api-key`)
- `--custom-model-id <id>` (não interativo; usado com `--auth-choice custom-api-key`)
- `--custom-api-key <key>` (não interativo; opcional; usado com `--auth-choice custom-api-key`; usa fallback para `CUSTOM_API_KEY` quando omitido)
- `--custom-provider-id <id>` (não interativo; id de provedor personalizado opcional)
- `--custom-compatibility <openai|anthropic>` (não interativo; opcional; padrão `openai`)
- `--gateway-port <port>`
- `--gateway-bind <loopback|lan|tailnet|auto|custom>`
- `--gateway-auth <token|password>`
- `--gateway-token <token>`
- `--gateway-token-ref-env <name>` (não interativo; armazena `gateway.auth.token` como um env SecretRef; exige que essa variável de ambiente esteja definida; não pode ser combinada com `--gateway-token`)
- `--gateway-password <password>`
- `--remote-url <url>`
- `--remote-token <token>`
- `--tailscale <off|serve|funnel>`
- `--tailscale-reset-on-exit`
- `--install-daemon`
- `--no-install-daemon` (alias: `--skip-daemon`)
- `--daemon-runtime <node|bun>`
- `--skip-channels`
- `--skip-skills`
- `--skip-search`
- `--skip-health`
- `--skip-ui`
- `--cloudflare-ai-gateway-account-id <id>`
- `--cloudflare-ai-gateway-gateway-id <id>`
- `--node-manager <npm|pnpm|bun>` (gerenciador de Node para configuração/onboarding de Skills; pnpm recomendado, bun também compatível)
- `--json`

### `configure`

Assistente interativo de configuração (modelos, canais, Skills, gateway).

Opções:

- `--section <section>` (repetível; limita o assistente a seções específicas)

### `config`

Ajudantes não interativos de configuração (get/set/unset/file/schema/validate). Executar `openclaw config` sem
subcomando inicia o assistente.

Subcomandos:

- `config get <path>`: imprime um valor da configuração (caminho dot/bracket).
- `config set`: oferece suporte a quatro modos de atribuição:
  - modo valor: `config set <path> <value>` (análise como JSON5 ou string)
  - modo construtor de SecretRef: `config set <path> --ref-provider <provider> --ref-source <source> --ref-id <id>`
  - modo construtor de provedor: `config set secrets.providers.<alias> --provider-source <env|file|exec> ...`
  - modo lote: `config set --batch-json '<json>'` ou `config set --batch-file <path>`
- `config set --dry-run`: valida atribuições sem gravar `openclaw.json` (verificações de exec SecretRef são ignoradas por padrão).
- `config set --allow-exec --dry-run`: ativa verificações de dry-run para exec SecretRef (pode executar comandos do provedor).
- `config set --dry-run --json`: emite saída de dry-run legível por máquina (verificações + sinal de completude, operações, refs verificadas/ignoradas, erros).
- `config set --strict-json`: exige análise JSON5 para entrada de caminho/valor. `--json` continua sendo um alias legado para análise estrita fora do modo de saída de dry-run.
- `config unset <path>`: remove um valor.
- `config file`: imprime o caminho do arquivo de configuração ativo.
- `config schema`: imprime o esquema JSON gerado para `openclaw.json`, incluindo metadados propagados de docs `title` / `description` entre ramificações aninhadas de objeto, curingas, itens de array e composição, além de metadados em modo best-effort de plugins/canais ativos.
- `config validate`: valida a configuração atual em relação ao esquema sem iniciar o gateway.
- `config validate --json`: emite saída JSON legível por máquina.

### `doctor`

Verificações de integridade + correções rápidas (configuração + gateway + serviços legados).

Opções:

- `--no-workspace-suggestions`: desabilita dicas de memória de workspace.
- `--yes`: aceita os padrões sem prompt (headless).
- `--non-interactive`: ignora prompts; aplica apenas migrações seguras.
- `--deep`: varre serviços do sistema em busca de instalações extras do gateway.
- `--repair` (alias: `--fix`): tenta reparos automáticos para problemas detectados.
- `--force`: força reparos mesmo quando não são estritamente necessários.
- `--generate-gateway-token`: gera um novo token de autenticação do gateway.

### `dashboard`

Abre a UI de controle com seu token atual.

Opções:

- `--no-open`: imprime a URL, mas não inicia um navegador

Observações:

- Para tokens de gateway gerenciados por SecretRef, `dashboard` imprime ou abre uma URL sem token em vez de expor o segredo na saída do terminal ou nos argumentos de inicialização do navegador.

### `update`

Atualiza a CLI instalada.

Opções raiz:

- `--json`
- `--no-restart`
- `--dry-run`
- `--channel <stable|beta|dev>`
- `--tag <dist-tag|version|spec>`
- `--timeout <seconds>`
- `--yes`

Subcomandos:

- `update status`
- `update wizard`

Opções de `update status`:

- `--json`
- `--timeout <seconds>`

Opções de `update wizard`:

- `--timeout <seconds>`

Observações:

- `openclaw --update` é reescrito para `openclaw update`.

### `backup`

Cria e verifica arquivos locais de backup para o estado do OpenClaw.

Subcomandos:

- `backup create`
- `backup verify <archive>`

Opções de `backup create`:

- `--output <path>`
- `--json`
- `--dry-run`
- `--verify`
- `--only-config`
- `--no-include-workspace`

Opções de `backup verify <archive>`:

- `--json`

## Ajudantes de canal

### `channels`

Gerencie contas de canais de chat (WhatsApp/Telegram/Discord/Google Chat/Slack/Mattermost (plugin)/Signal/iMessage/Microsoft Teams).

Subcomandos:

- `channels list`: mostra canais configurados e perfis de autenticação.
- `channels status`: verifica alcance do gateway e integridade dos canais (`--probe` executa verificações ativas de probe/auditoria por conta quando o gateway está acessível; caso contrário, usa fallback para resumos de canal apenas da configuração. Use `openclaw health` ou `openclaw status --deep` para probes mais amplos de integridade do gateway).
- Dica: `channels status` imprime avisos com correções sugeridas quando consegue detectar configurações incorretas comuns (e então aponta você para `openclaw doctor`).
- `channels logs`: mostra logs recentes de canais a partir do arquivo de log do gateway.
- `channels add`: configuração em estilo de assistente quando nenhuma flag é passada; flags mudam para o modo não interativo.
  - Ao adicionar uma conta não padrão a um canal que ainda usa configuração de nível superior de conta única, o OpenClaw promove valores com escopo de conta para o mapa de contas do canal antes de gravar a nova conta. A maioria dos canais usa `accounts.default`; Matrix pode preservar um destino nomeado/padrão correspondente existente.
  - `channels add` não interativo não cria/atualiza bindings automaticamente; bindings somente de canal continuam correspondendo à conta padrão.
- `channels remove`: desabilita por padrão; passe `--delete` para remover entradas de configuração sem prompts.
- `channels login`: login interativo de canal (somente WhatsApp Web).
- `channels logout`: faz logout de uma sessão de canal (quando compatível).

Opções comuns:

- `--channel <name>`: `whatsapp|telegram|discord|googlechat|slack|mattermost|signal|imessage|msteams`
- `--account <id>`: id da conta do canal (padrão `default`)
- `--name <label>`: nome de exibição da conta

Opções de `channels login`:

- `--channel <channel>` (padrão `whatsapp`; compatível com `whatsapp`/`web`)
- `--account <id>`
- `--verbose`

Opções de `channels logout`:

- `--channel <channel>` (padrão `whatsapp`)
- `--account <id>`

Opções de `channels list`:

- `--no-usage`: ignora snapshots de uso/cota do provedor de modelos (somente com OAuth/API).
- `--json`: saída JSON (inclui uso, a menos que `--no-usage` esteja definido).

Opções de `channels status`:

- `--probe`
- `--timeout <ms>`
- `--json`

Opções de `channels capabilities`:

- `--channel <name>`
- `--account <id>` (somente com `--channel`)
- `--target <dest>`
- `--timeout <ms>`
- `--json`

Opções de `channels resolve`:

- `<entries...>`
- `--channel <name>`
- `--account <id>`
- `--kind <auto|user|group>`
- `--json`

Opções de `channels logs`:

- `--channel <name|all>` (padrão `all`)
- `--lines <n>` (padrão `200`)
- `--json`

Observações:

- `channels login` oferece suporte a `--verbose`.
- `channels capabilities --account` só se aplica quando `--channel` está definido.
- `channels status --probe` pode mostrar estado de transporte além de resultados de probe/auditoria, como `works`, `probe failed`, `audit ok` ou `audit failed`, dependendo do suporte do canal.

Mais detalhes: [/concepts/oauth](/concepts/oauth)

Exemplos:

```bash
openclaw channels add --channel telegram --account alerts --name "Alerts Bot" --token $TELEGRAM_BOT_TOKEN
openclaw channels add --channel discord --account work --name "Work Bot" --token $DISCORD_BOT_TOKEN
openclaw channels remove --channel discord --account work --delete
openclaw channels status --probe
openclaw status --deep
```

### `directory`

Pesquise IDs próprios, de pares e de grupos para canais que expõem uma superfície de diretório. Consulte [`openclaw directory`](/cli/directory).

Opções comuns:

- `--channel <name>`
- `--account <id>`
- `--json`

Subcomandos:

- `directory self`
- `directory peers list [--query <text>] [--limit <n>]`
- `directory groups list [--query <text>] [--limit <n>]`
- `directory groups members --group-id <id> [--limit <n>]`

### `skills`

Liste e inspecione Skills disponíveis, além de informações de prontidão.

Subcomandos:

- `skills search [query...]`: pesquisa Skills do ClawHub.
- `skills search --limit <n> --json`: limita resultados da pesquisa ou emite saída legível por máquina.
- `skills install <slug>`: instala uma Skill do ClawHub no workspace ativo.
- `skills install <slug> --version <version>`: instala uma versão específica do ClawHub.
- `skills install <slug> --force`: sobrescreve uma pasta de Skill existente no workspace.
- `skills update <slug|--all>`: atualiza Skills rastreadas do ClawHub.
- `skills list`: lista Skills (padrão quando não há subcomando).
- `skills list --json`: emite inventário de Skills legível por máquina em stdout.
- `skills list --verbose`: inclui requisitos ausentes na tabela.
- `skills info <name>`: mostra detalhes de uma Skill.
- `skills info <name> --json`: emite detalhes legíveis por máquina em stdout.
- `skills check`: resumo de requisitos prontos vs ausentes.
- `skills check --json`: emite saída de prontidão legível por máquina em stdout.

Opções:

- `--eligible`: mostra apenas Skills prontas.
- `--json`: saída JSON (sem estilo).
- `-v`, `--verbose`: inclui detalhes de requisitos ausentes.

Dica: use `openclaw skills search`, `openclaw skills install` e `openclaw skills update` para Skills com suporte do ClawHub.

### `pairing`

Aprove solicitações de pairing de DM em vários canais.

Subcomandos:

- `pairing list [channel] [--channel <channel>] [--account <id>] [--json]`
- `pairing approve <channel> <code> [--account <id>] [--notify]`
- `pairing approve --channel <channel> [--account <id>] <code> [--notify]`

Observações:

- Se exatamente um canal com suporte a pairing estiver configurado, `pairing approve <code>` também é permitido.
- `list` e `approve` oferecem suporte a `--account <id>` para canais com várias contas.

### `devices`

Gerencie entradas de pairing de dispositivos do gateway e tokens de dispositivo por função.

Subcomandos:

- `devices list [--json]`
- `devices approve [requestId] [--latest]`
- `devices reject <requestId>`
- `devices remove <deviceId>`
- `devices clear --yes [--pending]`
- `devices rotate --device <id> --role <role> [--scope <scope...>]`
- `devices revoke --device <id> --role <role>`

Observações:

- `devices list` e `devices approve` podem usar fallback para arquivos locais de pairing em local loopback quando o escopo de pairing direto não está disponível.
- `devices approve` seleciona automaticamente a solicitação pendente mais recente quando nenhum `requestId` é passado ou `--latest` está definido.
- Reconexões com token armazenado reutilizam os escopos aprovados em cache do token; `devices rotate --scope ...` explícito atualiza esse conjunto de escopos armazenado para futuras reconexões com token em cache.
- `devices rotate` e `devices revoke` retornam payloads JSON.

### `qr`

Gere um QR de pairing móvel e um código de configuração a partir da configuração atual do Gateway. Consulte [`openclaw qr`](/cli/qr).

Opções:

- `--remote`
- `--url <url>`
- `--public-url <url>`
- `--token <token>`
- `--password <password>`
- `--setup-code-only`
- `--no-ascii`
- `--json`

Observações:

- `--token` e `--password` são mutuamente exclusivos.
- O código de configuração carrega um token bootstrap de curta duração, não o token/senha compartilhado do gateway.
- O handoff bootstrap embutido mantém o token primário do nó em `scopes: []`.
- Qualquer token bootstrap de operador transferido permanece limitado a `operator.approvals`, `operator.read`, `operator.talk.secrets` e `operator.write`.
- Verificações de escopo de bootstrap usam prefixo de função, então essa lista de permissões de operador só satisfaz solicitações de operador; funções não operadoras ainda precisam de escopos sob o próprio prefixo de função.
- `--remote` pode usar `gateway.remote.url` ou a URL ativa do Tailscale Serve/Funnel.
- Após escanear, aprove a solicitação com `openclaw devices list` / `openclaw devices approve <requestId>`.

### `clawbot`

Namespace de alias legado. Atualmente oferece suporte a `openclaw clawbot qr`, que mapeia para [`openclaw qr`](/cli/qr).

### `hooks`

Gerencie hooks internos de agentes.

Subcomandos:

- `hooks list`
- `hooks info <name>`
- `hooks check`
- `hooks enable <name>`
- `hooks disable <name>`
- `hooks install <path-or-spec>` (alias obsoleto para `openclaw plugins install`)
- `hooks update [id]` (alias obsoleto para `openclaw plugins update`)

Opções comuns:

- `--json`
- `--eligible`
- `-v`, `--verbose`

Observações:

- Hooks gerenciados por plugin não podem ser habilitados ou desabilitados por `openclaw hooks`; habilite ou desabilite o plugin proprietário.
- `hooks install` e `hooks update` ainda funcionam como aliases de compatibilidade, mas imprimem avisos de obsolescência e encaminham para os comandos de plugin.

### `webhooks`

Ajudantes de webhook. A superfície embutida atual é a configuração + executor do Gmail Pub/Sub:

- `webhooks gmail setup`
- `webhooks gmail run`

### `webhooks gmail`

Configuração + executor do hook Gmail Pub/Sub. Consulte [Gmail Pub/Sub](/automation/cron-jobs#gmail-pubsub-integration).

Subcomandos:

- `webhooks gmail setup` (exige `--account <email>`; oferece suporte a `--project`, `--topic`, `--subscription`, `--label`, `--hook-url`, `--hook-token`, `--push-token`, `--bind`, `--port`, `--path`, `--include-body`, `--max-bytes`, `--renew-minutes`, `--tailscale`, `--tailscale-path`, `--tailscale-target`, `--push-endpoint`, `--json`)
- `webhooks gmail run` (substituições de tempo de execução para as mesmas flags)

Observações:

- `setup` configura o watch do Gmail mais o caminho de push voltado para o OpenClaw.
- `run` inicia o watcher/loop de renovação local do Gmail com substituições opcionais de tempo de execução.

### `dns`

Ajudantes de DNS para descoberta em área ampla (CoreDNS + Tailscale). Superfície embutida atual:

- `dns setup [--domain <domain>] [--apply]`

### `dns setup`

Ajudante de DNS para descoberta em área ampla (CoreDNS + Tailscale). Consulte [/gateway/discovery](/gateway/discovery).

Opções:

- `--domain <domain>`
- `--apply`: instala/atualiza a configuração do CoreDNS (exige sudo; somente macOS).

Observações:

- Sem `--apply`, este é um ajudante de planejamento que imprime a configuração recomendada de DNS do OpenClaw + Tailscale.
- `--apply` atualmente oferece suporte apenas a macOS com CoreDNS do Homebrew.

## Mensageria + agente

### `message`

Mensageria de saída unificada + ações de canal.

Consulte: [/cli/message](/cli/message)

Subcomandos:

- `message send|poll|react|reactions|read|edit|delete|pin|unpin|pins|permissions|search|timeout|kick|ban`
- `message thread <create|list|reply>`
- `message emoji <list|upload>`
- `message sticker <send|upload>`
- `message role <info|add|remove>`
- `message channel <info|list>`
- `message member info`
- `message voice status`
- `message event <list|create>`

Exemplos:

- `openclaw message send --target +15555550123 --message "Hi"`
- `openclaw message poll --channel discord --target channel:123 --poll-question "Snack?" --poll-option Pizza --poll-option Sushi`

### `agent`

Executa um turno de agente pelo gateway (ou embutido com `--local`).

Passe pelo menos um seletor de sessão: `--to`, `--session-id` ou `--agent`.

Obrigatório:

- `-m, --message <text>`

Opções:

- `-t, --to <dest>` (para chave de sessão e entrega opcional)
- `--session-id <id>`
- `--agent <id>` (id do agente; substitui bindings de roteamento)
- `--thinking <off|minimal|low|medium|high|xhigh>` (o suporte varia por provedor; não há restrição por modelo no nível da CLI)
- `--verbose <on|off>`
- `--channel <channel>` (canal de entrega; omita para usar o canal da sessão principal)
- `--reply-to <target>` (substituição do destino de entrega, separada do roteamento da sessão)
- `--reply-channel <channel>` (substituição do canal de entrega)
- `--reply-account <id>` (substituição do id da conta de entrega)
- `--local` (execução embutida; o registro de plugin ainda é pré-carregado primeiro)
- `--deliver`
- `--json`
- `--timeout <seconds>`

Observações:

- O modo gateway usa fallback para o agente embutido quando a solicitação ao gateway falha.
- `--local` ainda pré-carrega o registro de plugin, então provedores, ferramentas e canais fornecidos por plugin continuam disponíveis durante execuções embutidas.
- `--channel`, `--reply-channel` e `--reply-account` afetam a entrega da resposta, não o roteamento.

### `agents`

Gerencie agentes isolados (workspaces + autenticação + roteamento).

Executar `openclaw agents` sem subcomando equivale a `openclaw agents list`.

#### `agents list`

Lista agentes configurados.

Opções:

- `--json`
- `--bindings`

#### `agents add [name]`

Adiciona um novo agente isolado. Executa o assistente guiado, a menos que flags (ou `--non-interactive`) sejam passadas; `--workspace` é obrigatório no modo não interativo.

Opções:

- `--workspace <dir>`
- `--model <id>`
- `--agent-dir <dir>`
- `--bind <channel[:accountId]>` (repetível)
- `--non-interactive`
- `--json`

Especificações de binding usam `channel[:accountId]`. Quando `accountId` é omitido, o OpenClaw pode resolver o escopo da conta por padrões do canal/hooks do plugin; caso contrário, é um binding de canal sem escopo explícito de conta.
Passar qualquer flag explícita de add muda o comando para o caminho não interativo. `main` é reservado e não pode ser usado como novo id de agente.

#### `agents bindings`

Lista bindings de roteamento.

Opções:

- `--agent <id>`
- `--json`

#### `agents bind`

Adiciona bindings de roteamento para um agente.

Opções:

- `--agent <id>` (usa o agente padrão atual por padrão)
- `--bind <channel[:accountId]>` (repetível)
- `--json`

#### `agents unbind`

Remove bindings de roteamento de um agente.

Opções:

- `--agent <id>` (usa o agente padrão atual por padrão)
- `--bind <channel[:accountId]>` (repetível)
- `--all`
- `--json`

Use `--all` ou `--bind`, não ambos.

#### `agents delete <id>`

Exclui um agente e poda seu workspace + estado.

Opções:

- `--force`
- `--json`

Observações:

- `main` não pode ser excluído.
- Sem `--force`, confirmação interativa é obrigatória.

#### `agents set-identity`

Atualiza a identidade de um agente (nome/tema/emoji/avatar).

Opções:

- `--agent <id>`
- `--workspace <dir>`
- `--identity-file <path>`
- `--from-identity`
- `--name <name>`
- `--theme <theme>`
- `--emoji <emoji>`
- `--avatar <value>`
- `--json`

Observações:

- `--agent` ou `--workspace` pode ser usado para selecionar o agente de destino.
- Quando nenhum campo explícito de identidade é fornecido, o comando lê `IDENTITY.md`.

### `acp`

Executa a ponte ACP que conecta IDEs ao gateway.

Opções raiz:

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

Cliente ACP interativo para depuração da ponte.

Opções:

- `--cwd <dir>`
- `--server <command>`
- `--server-args <args...>`
- `--server-verbose`
- `--verbose`

Consulte [`acp`](/cli/acp) para comportamento completo, observações de segurança e exemplos.

### `mcp`

Gerencie definições salvas de servidor MCP e exponha canais do OpenClaw por MCP stdio.

#### `mcp serve`

Expõe conversas de canais do OpenClaw roteadas por MCP stdio.

Opções:

- `--url <url>`
- `--token <token>`
- `--token-file <path>`
- `--password <password>`
- `--password-file <path>`
- `--claude-channel-mode <auto|on|off>`
- `--verbose`

#### `mcp list`

Lista definições salvas de servidor MCP.

Opções:

- `--json`

#### `mcp show [name]`

Mostra uma definição salva de servidor MCP ou o objeto completo salvo do servidor MCP.

Opções:

- `--json`

#### `mcp set <name> <value>`

Salva uma definição de servidor MCP a partir de um objeto JSON.

#### `mcp unset <name>`

Remove uma definição salva de servidor MCP.

### `approvals`

Gerencie aprovações de exec. Alias: `exec-approvals`.

#### `approvals get`

Busca o snapshot de aprovações de exec e a política efetiva.

Opções:

- `--node <node>`
- `--gateway`
- `--json`
- opções de RPC de nó de `openclaw nodes`

#### `approvals set`

Substitui aprovações de exec por JSON de um arquivo ou stdin.

Opções:

- `--node <node>`
- `--gateway`
- `--file <path>`
- `--stdin`
- `--json`
- opções de RPC de nó de `openclaw nodes`

#### `approvals allowlist add|remove`

Edita a lista de permissões de exec por agente.

Opções:

- `--node <node>`
- `--gateway`
- `--agent <id>` (padrão `*`)
- `--json`
- opções de RPC de nó de `openclaw nodes`

### `status`

Mostra integridade da sessão vinculada e destinatários recentes.

Opções:

- `--json`
- `--all` (diagnóstico completo; somente leitura, pronto para colar)
- `--deep` (pede ao gateway um probe ativo de integridade, incluindo probes de canal quando compatível)
- `--usage` (mostra uso/cota do provedor de modelos)
- `--timeout <ms>`
- `--verbose`
- `--debug` (alias para `--verbose`)

Observações:

- A visão geral inclui status do gateway + serviço de host do nó quando disponível.
- `--usage` imprime janelas normalizadas de uso do provedor como `X% left`.

### Rastreamento de uso

O OpenClaw pode exibir uso/cota de provedores quando credenciais OAuth/API estão disponíveis.

Superfícies:

- `/status` (adiciona uma linha curta de uso do provedor quando disponível)
- `openclaw status --usage` (imprime o detalhamento completo por provedor)
- barra de menu do macOS (seção Usage em Context)

Observações:

- Os dados vêm diretamente dos endpoints de uso do provedor (sem estimativas).
- A saída legível por humanos é normalizada para `X% left` entre provedores.
- Provedores com janelas atuais de uso: Anthropic, GitHub Copilot, Gemini CLI, OpenAI Codex, MiniMax, Xiaomi e z.ai.
- Observação sobre MiniMax: `usage_percent` / `usagePercent` bruto significa cota restante, então o OpenClaw o inverte antes da exibição; campos baseados em contagem ainda têm prioridade quando presentes. Respostas `model_remains` priorizam a entrada do modelo de chat, derivam o rótulo da janela a partir de timestamps quando necessário e incluem o nome do modelo no rótulo do plano.
- A autenticação de uso vem de hooks específicos do provedor quando disponíveis; caso contrário, o OpenClaw usa fallback para credenciais OAuth/API-key correspondentes de perfis de autenticação, env ou configuração. Se nenhuma for resolvida, o uso fica oculto.
- Detalhes: consulte [Usage tracking](/concepts/usage-tracking).

### `health`

Busca integridade no gateway em execução.

Opções:

- `--json`
- `--timeout <ms>`
- `--verbose` (força um probe ativo e imprime detalhes de conexão do gateway)
- `--debug` (alias para `--verbose`)

Observações:

- O `health` padrão pode retornar um snapshot recente em cache do gateway.
- `health --verbose` força um probe ativo e expande a saída legível por humanos em todas as contas e agentes configurados.

### `sessions`

Lista sessões de conversa armazenadas.

Opções:

- `--json`
- `--verbose`
- `--store <path>`
- `--active <minutes>`
- `--agent <id>` (filtra sessões por agente)
- `--all-agents` (mostra sessões em todos os agentes)

Subcomandos:

- `sessions cleanup` — remove sessões expiradas ou órfãs

Observações:

- `sessions cleanup` também oferece suporte a `--fix-missing` para podar entradas cujos arquivos de transcrição não existem mais.

## Reset / Uninstall

### `reset`

Redefine configuração/estado local (mantém a CLI instalada).

Opções:

- `--scope <config|config+creds+sessions|full>`
- `--yes`
- `--non-interactive`
- `--dry-run`

Observações:

- `--non-interactive` exige `--scope` e `--yes`.

### `uninstall`

Desinstala o serviço do gateway + dados locais (a CLI permanece).

Opções:

- `--service`
- `--state`
- `--workspace`
- `--app`
- `--all`
- `--yes`
- `--non-interactive`
- `--dry-run`

Observações:

- `--non-interactive` exige `--yes` e escopos explícitos (ou `--all`).
- `--all` remove serviço, estado, workspace e aplicativo juntos.

### `tasks`

Liste e gerencie execuções de [tarefas em segundo plano](/automation/tasks) entre agentes.

- `tasks list` — mostra execuções de tarefas ativas e recentes
- `tasks show <id>` — mostra detalhes de uma execução específica de tarefa
- `tasks notify <id>` — altera a política de notificação de uma execução de tarefa
- `tasks cancel <id>` — cancela uma tarefa em execução
- `tasks audit` — expõe problemas operacionais (obsoletas, perdidas, falhas de entrega)
- `tasks maintenance [--apply] [--json]` — visualiza ou aplica limpeza/reconciliação de tarefas e TaskFlow (sessões-filhas de ACP/subagente, jobs de cron ativos, execuções ativas de CLI)
- `tasks flow list` — lista fluxos ativos e recentes de Task Flow
- `tasks flow show <lookup>` — inspeciona um fluxo por id ou chave de lookup
- `tasks flow cancel <lookup>` — cancela um fluxo em execução e suas tarefas ativas

### `flows`

Atalho legado de documentação. Comandos de fluxo ficam em `openclaw tasks flow`:

- `tasks flow list [--json]`
- `tasks flow show <lookup>`
- `tasks flow cancel <lookup>`

## Gateway

### `gateway`

Executa o gateway WebSocket.

Opções:

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
- `--reset` (redefine configuração dev + credenciais + sessões + workspace)
- `--force` (mata listener existente na porta)
- `--verbose`
- `--cli-backend-logs`
- `--claude-cli-logs` (alias obsoleto)
- `--ws-log <auto|full|compact>`
- `--compact` (alias para `--ws-log compact`)
- `--raw-stream`
- `--raw-stream-path <path>`

### `gateway service`

Gerencie o serviço do gateway (launchd/systemd/schtasks).

Subcomandos:

- `gateway status` (faz probe do RPC do gateway por padrão)
- `gateway install` (instalação do serviço)
- `gateway uninstall`
- `gateway start`
- `gateway stop`
- `gateway restart`

Observações:

- `gateway status` faz probe do RPC do gateway por padrão usando a porta/configuração resolvida do serviço (substitua com `--url/--token/--password`).
- `gateway status` oferece suporte a `--no-probe`, `--deep`, `--require-rpc` e `--json` para scripts.
- `gateway status` também expõe serviços legados ou extras do gateway quando consegue detectá-los (`--deep` adiciona varreduras em nível de sistema). Serviços nomeados por perfil do OpenClaw são tratados como de primeira classe e não são marcados como "extra".
- `gateway status` continua disponível para diagnósticos mesmo quando a configuração local da CLI está ausente ou inválida.
- `gateway status` imprime o caminho resolvido do arquivo de log, o snapshot de caminhos/validade da configuração CLI-vs-serviço e a URL de destino resolvida para probe.
- Se SecretRefs de autenticação do gateway estiverem não resolvidos no caminho atual do comando, `gateway status --json` relata `rpc.authWarning` somente quando conectividade/autenticação do probe falha (avisos são suprimidos quando o probe tem sucesso).
- Em instalações Linux systemd, verificações de desvio de token em status incluem fontes `Environment=` e `EnvironmentFile=` da unit.
- `gateway install|uninstall|start|stop|restart` oferecem suporte a `--json` para scripts (a saída padrão continua amigável para humanos).
- `gateway install` usa runtime Node por padrão; bun **não é recomendado** (bugs de WhatsApp/Telegram).
- Opções de `gateway install`: `--port`, `--runtime`, `--token`, `--force`, `--json`.

### `daemon`

Alias legado para os comandos de gerenciamento de serviço do gateway. Consulte [/cli/daemon](/cli/daemon).

Subcomandos:

- `daemon status`
- `daemon install`
- `daemon uninstall`
- `daemon start`
- `daemon stop`
- `daemon restart`

Opções comuns:

- `status`: `--url`, `--token`, `--password`, `--timeout`, `--no-probe`, `--require-rpc`, `--deep`, `--json`
- `install`: `--port`, `--runtime <node|bun>`, `--token`, `--force`, `--json`
- `uninstall|start|stop|restart`: `--json`

### `logs`

Acompanha logs de arquivo do gateway via RPC.

Opções:

- `--limit <n>`: número máximo de linhas de log a retornar
- `--max-bytes <n>`: máximo de bytes a ler do arquivo de log
- `--follow`: acompanha o arquivo de log (estilo tail -f)
- `--interval <ms>`: intervalo de polling em ms ao acompanhar
- `--local-time`: exibe timestamps no horário local
- `--json`: emite JSON delimitado por linha
- `--plain`: desabilita formatação estruturada
- `--no-color`: desabilita cores ANSI
- `--url <url>`: URL WebSocket explícita do gateway
- `--token <token>`: token do gateway
- `--timeout <ms>`: timeout do RPC do gateway
- `--expect-final`: aguarda uma resposta final quando necessário

Exemplos:

```bash
openclaw logs --follow
openclaw logs --limit 200
openclaw logs --plain
openclaw logs --json
openclaw logs --no-color
```

Observações:

- Se você passar `--url`, a CLI não aplica automaticamente credenciais da configuração ou do ambiente.
- Falhas de pairing em local loopback usam fallback para o arquivo de log local configurado; destinos explícitos `--url` não usam.

### `gateway <subcommand>`

Ajudantes de CLI do gateway (use `--url`, `--token`, `--password`, `--timeout`, `--expect-final` para subcomandos RPC).
Quando você passa `--url`, a CLI não aplica automaticamente credenciais da configuração ou do ambiente.
Inclua `--token` ou `--password` explicitamente. Credenciais explícitas ausentes são um erro.

Subcomandos:

- `gateway call <method> [--params <json>] [--url <url>] [--token <token>] [--password <password>] [--timeout <ms>] [--expect-final] [--json]`
- `gateway health`
- `gateway status`
- `gateway probe`
- `gateway discover`
- `gateway install|uninstall|start|stop|restart`
- `gateway run`

Observações:

- `gateway status --deep` adiciona uma varredura de serviço em nível de sistema. Use `gateway probe`,
  `health --verbose` ou `status --deep` de nível superior para detalhes mais profundos de probe em tempo de execução.

RPCs comuns:

- `config.schema.lookup` (inspeciona uma subárvore de configuração com um nó de esquema superficial, metadados de dica correspondentes e resumos imediatos dos filhos)
- `config.get` (lê snapshot atual da configuração + hash)
- `config.set` (valida + grava configuração completa; use `baseHash` para concorrência otimista)
- `config.apply` (valida + grava configuração + reinicia + desperta)
- `config.patch` (mescla atualização parcial + reinicia + desperta)
- `update.run` (executa atualização + reinicia + desperta)

Dica: ao chamar `config.set`/`config.apply`/`config.patch` diretamente, passe `baseHash` de
`config.get` se já existir uma configuração.
Dica: para edições parciais, primeiro inspecione com `config.schema.lookup` e prefira `config.patch`.
Dica: esses RPCs de gravação de configuração fazem pré-verificação da resolução ativa de SecretRef para refs no payload de configuração enviado e rejeitam gravações quando uma ref enviada efetivamente ativa está não resolvida.
Dica: a ferramenta de runtime `gateway` restrita ao owner ainda se recusa a regravar `tools.exec.ask` ou `tools.exec.security`; aliases legados `tools.bash.*` são normalizados para os mesmos caminhos protegidos de exec.

## Models

Consulte [/concepts/models](/concepts/models) para comportamento de fallback e estratégia de varredura.

Observação de cobrança: Acreditamos que o fallback do Claude Code CLI provavelmente seja permitido para automação local gerenciada pelo usuário, com base na documentação pública da CLI da Anthropic. Ainda assim,
a política da Anthropic para harnesses de terceiros cria ambiguidade suficiente em torno do uso com assinatura em produtos externos, e por isso não o recomendamos para produção. A Anthropic também notificou usuários do OpenClaw em **4 de abril de 2026 às
12:00 PM PT / 8:00 PM BST** que o caminho de login Claude do **OpenClaw** conta como
uso de harness de terceiros e exige **Extra Usage** cobrado separadamente da assinatura. Para produção, prefira uma chave de API da Anthropic ou outro provedor compatível no estilo assinatura, como OpenAI Codex, Alibaba Cloud Model Studio
Coding Plan, MiniMax Coding Plan ou Z.AI / GLM Coding Plan.

Migração da Anthropic Claude CLI:

```bash
openclaw models auth login --provider anthropic --method cli --set-default
```

Atalho de onboarding: `openclaw onboard --auth-choice anthropic-cli`

Anthropic setup-token também está disponível novamente como caminho legado/manual de autenticação.
Use-o apenas com a expectativa de que a Anthropic informou aos usuários do OpenClaw que esse
caminho de login Claude do OpenClaw exige **Extra Usage**.

Observação sobre alias legado: `claude-cli` é o alias obsoleto de auth-choice no onboarding.
Use `anthropic-cli` no onboarding ou use `models auth login` diretamente.

### `models` (raiz)

`openclaw models` é um alias para `models status`.

Opções raiz:

- `--status-json` (alias para `models status --json`)
- `--status-plain` (alias para `models status --plain`)

### `models list`

Opções:

- `--all`
- `--local`
- `--provider <name>`
- `--json`
- `--plain`

### `models status`

Opções:

- `--json`
- `--plain`
- `--check` (saída 1=expirada/ausente, 2=expirando)
- `--probe` (probe ativo de perfis de autenticação configurados)
- `--probe-provider <name>`
- `--probe-profile <id>` (repetível ou separado por vírgulas)
- `--probe-timeout <ms>`
- `--probe-concurrency <n>`
- `--probe-max-tokens <n>`
- `--agent <id>`

Sempre inclui a visão geral de autenticação e o status de expiração OAuth para perfis na auth store.
`--probe` executa solicitações ativas (pode consumir tokens e acionar limites de taxa).
Linhas de probe podem vir de perfis de autenticação, credenciais de env ou `models.json`.
Espere status de probe como `ok`, `auth`, `rate_limit`, `billing`, `timeout`,
`format`, `unknown` e `no_model`.
Quando um `auth.order.<provider>` explícito omite um perfil armazenado, o probe relata
`excluded_by_auth_order` em vez de tentar silenciosamente esse perfil.

### `models set <model>`

Define `agents.defaults.model.primary`.

### `models set-image <model>`

Define `agents.defaults.imageModel.primary`.

### `models aliases list|add|remove`

Opções:

- `list`: `--json`, `--plain`
- `add <alias> <model>`
- `remove <alias>`

### `models fallbacks list|add|remove|clear`

Opções:

- `list`: `--json`, `--plain`
- `add <model>`
- `remove <model>`
- `clear`

### `models image-fallbacks list|add|remove|clear`

Opções:

- `list`: `--json`, `--plain`
- `add <model>`
- `remove <model>`
- `clear`

### `models scan`

Opções:

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

Opções:

- `add`: ajudante interativo de autenticação (fluxo de autenticação do provedor ou colagem de token)
- `login`: `--provider <name>`, `--method <method>`, `--set-default`
- `login-github-copilot`: fluxo de login OAuth do GitHub Copilot (`--yes`)
- `setup-token`: `--provider <name>`, `--yes`
- `paste-token`: `--provider <name>`, `--profile-id <id>`, `--expires-in <duration>`

Observações:

- `setup-token` e `paste-token` são comandos genéricos de token para provedores que expõem métodos de autenticação por token.
- `setup-token` exige um TTY interativo e executa o método de autenticação por token do provedor.
- `paste-token` solicita o valor do token e usa por padrão o id do perfil de autenticação `<provider>:manual` quando `--profile-id` é omitido.
- Anthropic `setup-token` / `paste-token` estão disponíveis novamente como caminho legado/manual do OpenClaw. A Anthropic informou aos usuários do OpenClaw que esse caminho exige **Extra Usage** na conta Claude.

### `models auth order get|set|clear`

Opções:

- `get`: `--provider <name>`, `--agent <id>`, `--json`
- `set`: `--provider <name>`, `--agent <id>`, `<profileIds...>`
- `clear`: `--provider <name>`, `--agent <id>`

## System

### `system event`

Enfileira um evento do sistema e, opcionalmente, aciona um heartbeat (RPC do gateway).

Obrigatório:

- `--text <text>`

Opções:

- `--mode <now|next-heartbeat>`
- `--json`
- `--url`, `--token`, `--timeout`, `--expect-final`

### `system heartbeat last|enable|disable`

Controles de heartbeat (RPC do gateway).

Opções:

- `--json`
- `--url`, `--token`, `--timeout`, `--expect-final`

### `system presence`

Lista entradas de presença do sistema (RPC do gateway).

Opções:

- `--json`
- `--url`, `--token`, `--timeout`, `--expect-final`

## Cron

Gerencie jobs agendados (RPC do gateway). Consulte [/automation/cron-jobs](/automation/cron-jobs).

Subcomandos:

- `cron status [--json]`
- `cron list [--all] [--json]` (saída em tabela por padrão; use `--json` para bruto)
- `cron add` (alias: `create`; exige `--name` e exatamente um de `--at` | `--every` | `--cron`, e exatamente um payload de `--system-event` | `--message`)
- `cron edit <id>` (corrige campos)
- `cron rm <id>` (aliases: `remove`, `delete`)
- `cron enable <id>`
- `cron disable <id>`
- `cron runs --id <id> [--limit <n>]`
- `cron run <id> [--due]`

Todos os comandos `cron` aceitam `--url`, `--token`, `--timeout`, `--expect-final`.

`cron add|edit --model ...` usa esse modelo permitido selecionado para o job. Se
o modelo não for permitido, o cron avisa e usa fallback para a seleção normal
de modelo do agente/padrão do job. Cadeias de fallback configuradas continuam se aplicando, mas uma simples
substituição de modelo sem lista explícita de fallback por job não acrescenta mais o modelo principal
do agente como destino extra oculto de retry.

## Host de nó

### `node`

`node` executa um **host de nó sem interface** ou o gerencia como um serviço em segundo plano. Consulte
[`openclaw node`](/cli/node).

Subcomandos:

- `node run --host <gateway-host> --port 18789`
- `node status`
- `node install [--host <gateway-host>] [--port <port>] [--tls] [--tls-fingerprint <sha256>] [--node-id <id>] [--display-name <name>] [--runtime <node|bun>] [--force]`
- `node uninstall`
- `node stop`
- `node restart`

Observações sobre autenticação:

- `node` resolve a autenticação do gateway a partir de env/configuração (sem flags `--token`/`--password`): `OPENCLAW_GATEWAY_TOKEN` / `OPENCLAW_GATEWAY_PASSWORD`, depois `gateway.auth.*`. No modo local, o host do nó ignora intencionalmente `gateway.remote.*`; em `gateway.mode=remote`, `gateway.remote.*` participa conforme as regras de precedência remota.
- A resolução de autenticação do host de nó só respeita variáveis de ambiente `OPENCLAW_GATEWAY_*`.

## Nodes

`nodes` fala com o gateway e segmenta nós emparelhados. Consulte [/nodes](/nodes).

Opções comuns:

- `--url`, `--token`, `--timeout`, `--json`

Subcomandos:

- `nodes status [--connected] [--last-connected <duration>]`
- `nodes describe --node <id|name|ip>`
- `nodes list [--connected] [--last-connected <duration>]`
- `nodes pending`
- `nodes approve <requestId>`
- `nodes reject <requestId>`
- `nodes rename --node <id|name|ip> --name <displayName>`
- `nodes invoke --node <id|name|ip> --command <command> [--params <json>] [--invoke-timeout <ms>] [--idempotency-key <key>]`
- `nodes notify --node <id|name|ip> [--title <text>] [--body <text>] [--sound <name>] [--priority <passive|active|timeSensitive>] [--delivery <system|overlay|auto>] [--invoke-timeout <ms>]` (somente Mac)

Câmera:

- `nodes camera list --node <id|name|ip>`
- `nodes camera snap --node <id|name|ip> [--facing front|back|both] [--device-id <id>] [--max-width <px>] [--quality <0-1>] [--delay-ms <ms>] [--invoke-timeout <ms>]`
- `nodes camera clip --node <id|name|ip> [--facing front|back] [--device-id <id>] [--duration <ms|10s|1m>] [--no-audio] [--invoke-timeout <ms>]`

Canvas + tela:

- `nodes canvas snapshot --node <id|name|ip> [--format png|jpg|jpeg] [--max-width <px>] [--quality <0-1>] [--invoke-timeout <ms>]`
- `nodes canvas present --node <id|name|ip> [--target <urlOrPath>] [--x <px>] [--y <px>] [--width <px>] [--height <px>] [--invoke-timeout <ms>]`
- `nodes canvas hide --node <id|name|ip> [--invoke-timeout <ms>]`
- `nodes canvas navigate <url> --node <id|name|ip> [--invoke-timeout <ms>]`
- `nodes canvas eval [<js>] --node <id|name|ip> [--js <code>] [--invoke-timeout <ms>]`
- `nodes canvas a2ui push --node <id|name|ip> (--jsonl <path> | --text <text>) [--invoke-timeout <ms>]`
- `nodes canvas a2ui reset --node <id|name|ip> [--invoke-timeout <ms>]`
- `nodes screen record --node <id|name|ip> [--screen <index>] [--duration <ms|10s>] [--fps <n>] [--no-audio] [--out <path>] [--invoke-timeout <ms>]`

Localização:

- `nodes location get --node <id|name|ip> [--max-age <ms>] [--accuracy <coarse|balanced|precise>] [--location-timeout <ms>] [--invoke-timeout <ms>]`

## Browser

CLI de controle de navegador (Chrome/Brave/Edge/Chromium dedicado). Consulte [`openclaw browser`](/cli/browser) e a [ferramenta Browser](/tools/browser).

Opções comuns:

- `--url`, `--token`, `--timeout`, `--expect-final`, `--json`
- `--browser-profile <name>`

Gerenciar:

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

Inspecionar:

- `browser screenshot [targetId] [--full-page] [--ref <ref>] [--element <selector>] [--type png|jpeg]`
- `browser snapshot [--format aria|ai] [--target-id <id>] [--limit <n>] [--interactive] [--compact] [--depth <n>] [--selector <sel>] [--out <path>]`

Ações:

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

## Voice call

### `voicecall`

Utilitários de chamada de voz fornecidos por plugin. Só aparece quando o plugin de voice-call está instalado e habilitado. Consulte [`openclaw voicecall`](/cli/voicecall).

Comandos comuns:

- `voicecall call --to <phone> --message <text> [--mode notify|conversation]`
- `voicecall start --to <phone> [--message <text>] [--mode notify|conversation]`
- `voicecall continue --call-id <id> --message <text>`
- `voicecall speak --call-id <id> --message <text>`
- `voicecall end --call-id <id>`
- `voicecall status --call-id <id>`
- `voicecall tail [--file <path>] [--since <n>] [--poll <ms>]`
- `voicecall latency [--file <path>] [--last <n>]`
- `voicecall expose [--mode off|serve|funnel] [--path <path>] [--port <port>] [--serve-path <path>]`

## Pesquisa de documentos

### `docs`

Pesquise no índice ativo da documentação do OpenClaw.

### `docs [query...]`

Pesquise no índice ativo da documentação.

## TUI

### `tui`

Abre a UI de terminal conectada ao gateway.

Opções:

- `--url <url>`
- `--token <token>`
- `--password <password>`
- `--session <key>`
- `--deliver`
- `--thinking <level>`
- `--message <text>`
- `--timeout-ms <ms>` (usa por padrão `agents.defaults.timeoutSeconds`)
- `--history-limit <n>`
