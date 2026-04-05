---
read_when:
    - CLIコマンドまたはオプションを追加または変更するとき
    - 新しいコマンドサーフェスを文書化するとき
summary: '`openclaw` コマンド、サブコマンド、オプションのためのOpenClaw CLIリファレンス'
title: CLIリファレンス
x-i18n:
    generated_at: "2026-04-05T12:43:12Z"
    model: gpt-5.4
    provider: openai
    source_hash: 7c25e5ebfe256412b44130dba39cf39b0a7d1d22e3abb417345e95c95ca139bf
    source_path: cli/index.md
    workflow: 15
---

# CLIリファレンス

このページでは、現在のCLIの動作について説明します。コマンドが変更された場合は、このドキュメントを更新してください。

## コマンドページ

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
- [`plugins`](/cli/plugins)（プラグインコマンド）
- [`channels`](/cli/channels)
- [`security`](/cli/security)
- [`secrets`](/cli/secrets)
- [`skills`](/cli/skills)
- [`daemon`](/cli/daemon)（Gatewayサービスコマンドのレガシーエイリアス）
- [`clawbot`](/cli/clawbot)（レガシーエイリアス名前空間）
- [`voicecall`](/cli/voicecall)（プラグイン。インストールされている場合）

## グローバルフラグ

- `--dev`: `~/.openclaw-dev` 配下に状態を分離し、デフォルトポートをずらします。
- `--profile <name>`: `~/.openclaw-<name>` 配下に状態を分離します。
- `--container <name>`: 実行対象として名前付きコンテナを指定します。
- `--no-color`: ANSIカラーを無効にします。
- `--update`: `openclaw update` の短縮形です（ソースインストールのみ）。
- `-V`, `--version`, `-v`: バージョンを表示して終了します。

## 出力スタイル

- ANSIカラーと進行状況インジケーターはTTYセッションでのみ描画されます。
- OSC-8ハイパーリンクは対応ターミナルではクリック可能なリンクとして表示され、それ以外ではプレーンURLにフォールバックします。
- `--json`（およびサポートされている場合の `--plain`）は、クリーンな出力のためにスタイルを無効にします。
- `--no-color` はANSIスタイルを無効にします。`NO_COLOR=1` も尊重されます。
- 長時間実行されるコマンドは進行状況インジケーターを表示します（対応している場合はOSC 9;4）。

## カラーパレット

OpenClawはCLI出力にロブスターパレットを使用します。

- `accent` (#FF5A2D): 見出し、ラベル、主要なハイライト。
- `accentBright` (#FF7A3D): コマンド名、強調。
- `accentDim` (#D14A22): 二次的なハイライトテキスト。
- `info` (#FF8A5B): 情報値。
- `success` (#2FBF71): 成功状態。
- `warn` (#FFB020): 警告、フォールバック、注意。
- `error` (#E23D2D): エラー、失敗。
- `muted` (#8B7F77): 強調を抑えた表示、メタデータ。

パレットの唯一の正: `src/terminal/palette.ts`（「ロブスターパレット」）。

## コマンドツリー

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

注: プラグインは追加のトップレベルコマンドを追加できます（たとえば `openclaw voicecall`）。

## セキュリティ

- `openclaw security audit` — 一般的なセキュリティ上の落とし穴について設定とローカル状態を監査します。
- `openclaw security audit --deep` — ベストエフォートのライブGatewayプローブです。
- `openclaw security audit --fix` — 安全なデフォルトと状態/設定の権限を強化します。

## Secrets

### `secrets`

SecretRefと関連するランタイム/設定の衛生状態を管理します。

サブコマンド:

- `secrets reload`
- `secrets audit`
- `secrets configure`
- `secrets apply --from <path>`

`secrets reload` のオプション:

- `--url`, `--token`, `--timeout`, `--expect-final`, `--json`

`secrets audit` のオプション:

- `--check`
- `--allow-exec`
- `--json`

`secrets configure` のオプション:

- `--apply`
- `--yes`
- `--providers-only`
- `--skip-provider-setup`
- `--agent <id>`
- `--allow-exec`
- `--plan-out <path>`
- `--json`

`secrets apply --from <path>` のオプション:

- `--dry-run`
- `--allow-exec`
- `--json`

注:

- `reload` はGateway RPCであり、解決に失敗した場合でも最後に既知の正常なランタイムスナップショットを保持します。
- `audit --check` は検出結果がある場合に非ゼロを返します。未解決の参照は、より優先度の高い非ゼロ終了コードを使用します。
- ドライランのexecチェックはデフォルトでスキップされます。有効にするには `--allow-exec` を使用します。

## プラグイン

拡張機能とその設定を管理します:

- `openclaw plugins list` — プラグインを検出します（機械可読出力には `--json` を使用）。
- `openclaw plugins inspect <id>` — プラグインの詳細を表示します（`info` はエイリアス）。
- `openclaw plugins install <path|.tgz|npm-spec|plugin@marketplace>` — プラグインをインストールします（またはプラグインパスを `plugins.load.paths` に追加します。既存のインストール先を上書きするには `--force` を使用）。
- `openclaw plugins marketplace list <marketplace>` — インストール前にマーケットプレイスの項目を一覧表示します。
- `openclaw plugins enable <id>` / `disable <id>` — `plugins.entries.<id>.enabled` を切り替えます。
- `openclaw plugins doctor` — プラグインの読み込みエラーを報告します。

ほとんどのプラグイン変更にはGatewayの再起動が必要です。[/plugin](/tools/plugin) を参照してください。

## メモリ

`MEMORY.md` + `memory/*.md` に対するベクトル検索:

- `openclaw memory status` — インデックス統計を表示します。ベクトルと埋め込みの準備状況チェックには `--deep` を、古くなった再呼び出し/昇格アーティファクトの修復には `--fix` を使用します。
- `openclaw memory index` — メモリファイルを再インデックスします。
- `openclaw memory search "<query>"`（または `--query "<query>"`）— メモリに対するセマンティック検索です。
- `openclaw memory promote` — 短期再呼び出しを順位付けし、必要に応じて上位の項目を `MEMORY.md` に追記します。

## Sandbox

分離されたエージェント実行のためのsandboxランタイムを管理します。[/cli/sandbox](/cli/sandbox) を参照してください。

サブコマンド:

- `sandbox list [--browser] [--json]`
- `sandbox recreate [--all] [--session <key>] [--agent <id>] [--browser] [--force]`
- `sandbox explain [--session <key>] [--agent <id>] [--json]`

注:

- `sandbox recreate` は既存のランタイムを削除し、次回使用時に現在の設定で再度シードされるようにします。
- `ssh` およびOpenShellの `remote` バックエンドでは、recreateは選択されたスコープの正規のリモートワークスペースを削除します。

## チャットスラッシュコマンド

チャットメッセージは `/...` コマンド（テキストおよびネイティブ）をサポートします。[/tools/slash-commands](/tools/slash-commands) を参照してください。

ハイライト:

- `/status` ですばやい診断を行います。
- `/config` で永続化された設定変更を行います。
- `/debug` でランタイム限定の設定オーバーライドを行います（ディスクではなくメモリ。`commands.debug: true` が必要）。

## セットアップとオンボーディング

### `completion`

シェル補完スクリプトを生成し、必要に応じてシェルプロファイルにインストールします。

オプション:

- `-s, --shell <zsh|bash|powershell|fish>`
- `-i, --install`
- `--write-state`
- `-y, --yes`

注:

- `--install` または `--write-state` がない場合、`completion` はスクリプトをstdoutに出力します。
- `--install` はシェルプロファイルに `OpenClaw Completion` ブロックを書き込み、OpenClaw状態ディレクトリ配下のキャッシュ済みスクリプトを指すようにします。

### `setup`

設定とワークスペースを初期化します。

オプション:

- `--workspace <dir>`: エージェントのワークスペースパス（デフォルト `~/.openclaw/workspace`）。
- `--wizard`: オンボーディングを実行します。
- `--non-interactive`: プロンプトなしでオンボーディングを実行します。
- `--mode <local|remote>`: オンボードモード。
- `--remote-url <url>`: リモートGateway URL。
- `--remote-token <token>`: リモートGatewayトークン。

いずれかのオンボーディングフラグ（`--non-interactive`, `--mode`, `--remote-url`, `--remote-token`）が存在する場合、オンボーディングは自動的に実行されます。

### `onboard`

Gateway、ワークスペース、Skillsのための対話型オンボーディング。

オプション:

- `--workspace <dir>`
- `--reset`（オンボーディング前に設定、認証情報、セッションをリセット）
- `--reset-scope <config|config+creds+sessions|full>`（デフォルト `config+creds+sessions`。ワークスペースも削除するには `full` を使用）
- `--non-interactive`
- `--mode <local|remote>`
- `--flow <quickstart|advanced|manual>`（`manual` は `advanced` のエイリアス）
- `--auth-choice <choice>`。`<choice>` は次のいずれか:
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
- Qwen注: `qwen-*` が正規のauth-choiceファミリーです。`modelstudio-*`
  のIDは、レガシー互換エイリアスとしてのみ引き続き受け付けられます。
- `--secret-input-mode <plaintext|ref>`（デフォルト `plaintext`。プレーンテキストキーの代わりにプロバイダーのデフォルトenv参照を保存するには `ref` を使用）
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
- `--custom-base-url <url>`（非対話式。`--auth-choice custom-api-key` とともに使用）
- `--custom-model-id <id>`（非対話式。`--auth-choice custom-api-key` とともに使用）
- `--custom-api-key <key>`（非対話式、任意。`--auth-choice custom-api-key` とともに使用。省略時は `CUSTOM_API_KEY` にフォールバック）
- `--custom-provider-id <id>`（非対話式、任意のカスタムプロバイダーID）
- `--custom-compatibility <openai|anthropic>`（非対話式、任意。デフォルト `openai`）
- `--gateway-port <port>`
- `--gateway-bind <loopback|lan|tailnet|auto|custom>`
- `--gateway-auth <token|password>`
- `--gateway-token <token>`
- `--gateway-token-ref-env <name>`（非対話式。`gateway.auth.token` をenv SecretRefとして保存します。このenv varが設定されている必要があり、`--gateway-token` と併用できません）
- `--gateway-password <password>`
- `--remote-url <url>`
- `--remote-token <token>`
- `--tailscale <off|serve|funnel>`
- `--tailscale-reset-on-exit`
- `--install-daemon`
- `--no-install-daemon`（エイリアス: `--skip-daemon`）
- `--daemon-runtime <node|bun>`
- `--skip-channels`
- `--skip-skills`
- `--skip-search`
- `--skip-health`
- `--skip-ui`
- `--cloudflare-ai-gateway-account-id <id>`
- `--cloudflare-ai-gateway-gateway-id <id>`
- `--node-manager <npm|pnpm|bun>`（Skills用のセットアップ/オンボーディングnode manager。pnpm推奨、bunもサポート）
- `--json`

### `configure`

対話型設定ウィザード（モデル、チャネル、Skills、Gateway）。

オプション:

- `--section <section>`（繰り返し指定可。ウィザードを特定のセクションに限定）

### `config`

非対話型の設定ヘルパー（get/set/unset/file/schema/validate）。サブコマンドなしで `openclaw config` を実行すると
ウィザードが起動します。

サブコマンド:

- `config get <path>`: 設定値を出力します（ドット/ブラケットパス）。
- `config set`: 4つの代入モードをサポートします:
  - 値モード: `config set <path> <value>`（JSON5または文字列として解析）
  - SecretRefビルダーモード: `config set <path> --ref-provider <provider> --ref-source <source> --ref-id <id>`
  - プロバイダービルダーモード: `config set secrets.providers.<alias> --provider-source <env|file|exec> ...`
  - バッチモード: `config set --batch-json '<json>'` または `config set --batch-file <path>`
- `config set --dry-run`: `openclaw.json` に書き込まずに代入を検証します（exec SecretRefチェックはデフォルトでスキップされます）。
- `config set --allow-exec --dry-run`: exec SecretRefのドライランチェックを有効にします（プロバイダーコマンドを実行する場合があります）。
- `config set --dry-run --json`: 機械可読なドライラン出力を返します（チェックと完全性シグナル、操作、チェック済み/スキップ済みの参照、エラー）。
- `config set --strict-json`: パス/値入力にJSON5解析を必須にします。`--json` は、ドライラン出力モード外では厳格解析のレガシーエイリアスのままです。
- `config unset <path>`: 値を削除します。
- `config file`: アクティブな設定ファイルのパスを出力します。
- `config schema`: `openclaw.json` 用に生成されたJSONスキーマを出力します。ネストされたオブジェクト、ワイルドカード、配列項目、合成ブランチ全体にわたって伝播されたフィールド `title` / `description` のドキュメントメタデータと、ベストエフォートのライブプラグイン/チャネルスキーマメタデータを含みます。
- `config validate`: Gatewayを起動せずに、現在の設定をスキーマに対して検証します。
- `config validate --json`: 機械可読なJSON出力を返します。

### `doctor`

ヘルスチェックとクイックフィックス（設定、Gateway、レガシーサービス）。

オプション:

- `--no-workspace-suggestions`: ワークスペースメモリのヒントを無効にします。
- `--yes`: デフォルトを確認なしで受け入れます（ヘッドレス）。
- `--non-interactive`: プロンプトをスキップします。安全な移行のみ適用します。
- `--deep`: 追加のGatewayインストールを求めてシステムサービスをスキャンします。
- `--repair`（エイリアス: `--fix`）: 検出された問題の自動修復を試みます。
- `--force`: 厳密には不要な場合でも修復を強制します。
- `--generate-gateway-token`: 新しいGateway認証トークンを生成します。

### `dashboard`

現在のトークンでControl UIを開きます。

オプション:

- `--no-open`: URLを表示しますが、ブラウザは起動しません

注:

- SecretRefで管理されるGatewayトークンでは、`dashboard` は端末出力やブラウザ起動引数にシークレットを露出させないよう、トークンなしURLを表示または開きます。

### `update`

インストール済みCLIを更新します。

ルートオプション:

- `--json`
- `--no-restart`
- `--dry-run`
- `--channel <stable|beta|dev>`
- `--tag <dist-tag|version|spec>`
- `--timeout <seconds>`
- `--yes`

サブコマンド:

- `update status`
- `update wizard`

`update status` のオプション:

- `--json`
- `--timeout <seconds>`

`update wizard` のオプション:

- `--timeout <seconds>`

注:

- `openclaw --update` は `openclaw update` に書き換えられます。

### `backup`

OpenClaw状態のローカルバックアップアーカイブを作成および検証します。

サブコマンド:

- `backup create`
- `backup verify <archive>`

`backup create` のオプション:

- `--output <path>`
- `--json`
- `--dry-run`
- `--verify`
- `--only-config`
- `--no-include-workspace`

`backup verify <archive>` のオプション:

- `--json`

## チャネルヘルパー

### `channels`

チャットチャネルアカウントを管理します（WhatsApp/Telegram/Discord/Google Chat/Slack/Mattermost（プラグイン）/Signal/iMessage/Microsoft Teams）。

サブコマンド:

- `channels list`: 設定済みチャネルと認証プロファイルを表示します。
- `channels status`: Gateway到達性とチャネルの健全性を確認します（`--probe` はGatewayが到達可能なときにアカウントごとのライブプローブ/監査チェックを実行し、そうでない場合は設定のみのチャネルサマリーにフォールバックします。より広範なGatewayヘルスプローブには `openclaw health` または `openclaw status --deep` を使用してください）。
- ヒント: `channels status` は、一般的な設定ミスを検出できた場合に推奨修正付きの警告を表示します（その後 `openclaw doctor` を案内します）。
- `channels logs`: Gatewayログファイルから最近のチャネルログを表示します。
- `channels add`: フラグが渡されない場合はウィザード形式で設定し、フラグがある場合は非対話モードに切り替わります。
  - 単一アカウントのトップレベル設定をまだ使用しているチャネルにデフォルト以外のアカウントを追加する場合、OpenClawは新しいアカウントを書き込む前に、アカウントスコープの値をチャネルアカウントマップへ昇格します。ほとんどのチャネルは `accounts.default` を使用しますが、Matrixは既存の一致する名前付き/デフォルトターゲットを保持できます。
  - 非対話式の `channels add` はバインディングの自動作成/アップグレードを行いません。チャネルのみのバインディングは引き続きデフォルトアカウントに一致します。
- `channels remove`: デフォルトでは無効化します。確認なしで設定項目を削除するには `--delete` を渡します。
- `channels login`: 対話型チャネルログイン（WhatsApp Webのみ）。
- `channels logout`: チャネルセッションからログアウトします（サポートされている場合）。

共通オプション:

- `--channel <name>`: `whatsapp|telegram|discord|googlechat|slack|mattermost|signal|imessage|msteams`
- `--account <id>`: チャネルアカウントID（デフォルト `default`）
- `--name <label>`: アカウントの表示名

`channels login` のオプション:

- `--channel <channel>`（デフォルト `whatsapp`。`whatsapp`/`web` をサポート）
- `--account <id>`
- `--verbose`

`channels logout` のオプション:

- `--channel <channel>`（デフォルト `whatsapp`）
- `--account <id>`

`channels list` のオプション:

- `--no-usage`: モデルプロバイダーの使用量/クォータスナップショットをスキップします（OAuth/APIベースのみ）。
- `--json`: JSONを出力します（`--no-usage` が設定されていない限り、使用量を含みます）。

`channels status` のオプション:

- `--probe`
- `--timeout <ms>`
- `--json`

`channels capabilities` のオプション:

- `--channel <name>`
- `--account <id>`（`--channel` と併用時のみ）
- `--target <dest>`
- `--timeout <ms>`
- `--json`

`channels resolve` のオプション:

- `<entries...>`
- `--channel <name>`
- `--account <id>`
- `--kind <auto|user|group>`
- `--json`

`channels logs` のオプション:

- `--channel <name|all>`（デフォルト `all`）
- `--lines <n>`（デフォルト `200`）
- `--json`

注:

- `channels login` は `--verbose` をサポートします。
- `channels capabilities --account` は `--channel` が設定されている場合にのみ適用されます。
- `channels status --probe` は、チャネルサポートに応じて、トランスポート状態に加えて `works`、`probe failed`、`audit ok`、`audit failed` のようなプローブ/監査結果を表示できます。

詳細: [/concepts/oauth](/concepts/oauth)

例:

```bash
openclaw channels add --channel telegram --account alerts --name "Alerts Bot" --token $TELEGRAM_BOT_TOKEN
openclaw channels add --channel discord --account work --name "Work Bot" --token $DISCORD_BOT_TOKEN
openclaw channels remove --channel discord --account work --delete
openclaw channels status --probe
openclaw status --deep
```

### `directory`

ディレクトリサーフェスを公開するチャネルのself、peer、group IDを検索します。[`openclaw directory`](/cli/directory) を参照してください。

共通オプション:

- `--channel <name>`
- `--account <id>`
- `--json`

サブコマンド:

- `directory self`
- `directory peers list [--query <text>] [--limit <n>]`
- `directory groups list [--query <text>] [--limit <n>]`
- `directory groups members --group-id <id> [--limit <n>]`

### `skills`

利用可能なSkillsと準備状況情報を一覧表示および調査します。

サブコマンド:

- `skills search [query...]`: ClawHub Skillsを検索します。
- `skills search --limit <n> --json`: 検索結果数を制限するか、機械可読出力を返します。
- `skills install <slug>`: ClawHubからアクティブなワークスペースにSkillをインストールします。
- `skills install <slug> --version <version>`: 特定のClawHubバージョンをインストールします。
- `skills install <slug> --force`: 既存のワークスペースSkillフォルダーを上書きします。
- `skills update <slug|--all>`: 追跡中のClawHub Skillsを更新します。
- `skills list`: Skillsを一覧表示します（サブコマンドなしの場合のデフォルト）。
- `skills list --json`: 機械可読なSkillインベントリをstdoutに出力します。
- `skills list --verbose`: テーブルに不足している要件を含めます。
- `skills info <name>`: 1つのSkillの詳細を表示します。
- `skills info <name> --json`: 機械可読な詳細をstdoutに出力します。
- `skills check`: 準備完了と不足要件の要約です。
- `skills check --json`: 機械可読な準備状況出力をstdoutに出力します。

オプション:

- `--eligible`: 準備完了のSkillsのみ表示します。
- `--json`: JSONを出力します（スタイルなし）。
- `-v`, `--verbose`: 不足要件の詳細を含めます。

ヒント: ClawHubバックエンドのSkillsには `openclaw skills search`、`openclaw skills install`、`openclaw skills update` を使用してください。

### `pairing`

チャネル間のDMペアリング要求を承認します。

サブコマンド:

- `pairing list [channel] [--channel <channel>] [--account <id>] [--json]`
- `pairing approve <channel> <code> [--account <id>] [--notify]`
- `pairing approve --channel <channel> [--account <id>] <code> [--notify]`

注:

- ペアリング可能なチャネルがちょうど1つ設定されている場合、`pairing approve <code>` も使用できます。
- `list` と `approve` はどちらも、マルチアカウントチャネル向けに `--account <id>` をサポートします。

### `devices`

Gatewayデバイスのペアリング項目とロール別デバイストークンを管理します。

サブコマンド:

- `devices list [--json]`
- `devices approve [requestId] [--latest]`
- `devices reject <requestId>`
- `devices remove <deviceId>`
- `devices clear --yes [--pending]`
- `devices rotate --device <id> --role <role> [--scope <scope...>]`
- `devices revoke --device <id> --role <role>`

注:

- `devices list` と `devices approve` は、直接のペアリングスコープが利用できない場合、local loopback上のローカルペアリングファイルにフォールバックできます。
- `devices approve` は、`requestId` が渡されない場合、または `--latest` が設定された場合に、最新の保留中要求を自動選択します。
- 保存済みトークンによる再接続は、そのトークンのキャッシュ済み承認スコープを再利用します。明示的な
  `devices rotate --scope ...` は、将来の
  キャッシュトークン再接続のために、その保存済みスコープセットを更新します。
- `devices rotate` と `devices revoke` はJSONペイロードを返します。

### `qr`

現在のGateway設定からモバイルペアリング用QRとセットアップコードを生成します。[`openclaw qr`](/cli/qr) を参照してください。

オプション:

- `--remote`
- `--url <url>`
- `--public-url <url>`
- `--token <token>`
- `--password <password>`
- `--setup-code-only`
- `--no-ascii`
- `--json`

注:

- `--token` と `--password` は相互排他的です。
- セットアップコードには共有Gatewayトークン/パスワードではなく、短命のブートストラップトークンが含まれます。
- 組み込みのブートストラップ引き渡しでは、プライマリノードトークンを `scopes: []` のままにします。
- 引き渡されたオペレーターブートストラップトークンは、`operator.approvals`、`operator.read`、`operator.talk.secrets`、`operator.write` に限定されたままです。
- ブートストラップスコープチェックはロール接頭辞付きなので、そのオペレーター許可リストはオペレーター要求だけを満たします。オペレーター以外のロールでは、独自のロール接頭辞配下のスコープが引き続き必要です。
- `--remote` は `gateway.remote.url` またはアクティブなTailscale Serve/Funnel URLを使用できます。
- スキャン後、`openclaw devices list` / `openclaw devices approve <requestId>` で要求を承認してください。

### `clawbot`

レガシーエイリアス名前空間。現在は [`openclaw qr`](/cli/qr) にマップされる `openclaw clawbot qr` をサポートしています。

### `hooks`

内部エージェントフックを管理します。

サブコマンド:

- `hooks list`
- `hooks info <name>`
- `hooks check`
- `hooks enable <name>`
- `hooks disable <name>`
- `hooks install <path-or-spec>`（`openclaw plugins install` の非推奨エイリアス）
- `hooks update [id]`（`openclaw plugins update` の非推奨エイリアス）

共通オプション:

- `--json`
- `--eligible`
- `-v`, `--verbose`

注:

- プラグイン管理のフックは `openclaw hooks` から有効化または無効化できません。代わりに所有プラグインを有効化または無効化してください。
- `hooks install` と `hooks update` は互換エイリアスとして引き続き動作しますが、非推奨警告を表示し、プラグインコマンドへ転送します。

### `webhooks`

Webhookヘルパーです。現在の組み込みサーフェスはGmail Pub/Subのセットアップとランナーです:

- `webhooks gmail setup`
- `webhooks gmail run`

### `webhooks gmail`

Gmail Pub/Subフックのセットアップとランナーです。[Gmail Pub/Sub](/ja-JP/automation/cron-jobs#gmail-pubsub-integration) を参照してください。

サブコマンド:

- `webhooks gmail setup`（`--account <email>` が必要。`--project`, `--topic`, `--subscription`, `--label`, `--hook-url`, `--hook-token`, `--push-token`, `--bind`, `--port`, `--path`, `--include-body`, `--max-bytes`, `--renew-minutes`, `--tailscale`, `--tailscale-path`, `--tailscale-target`, `--push-endpoint`, `--json` をサポート）
- `webhooks gmail run`（同じフラグに対するランタイムオーバーライド）

注:

- `setup` はGmail watchと、OpenClaw向けのpushパスを設定します。
- `run` は、必要に応じてランタイムオーバーライド付きでローカルのGmail watcher/renew loopを起動します。

### `dns`

広域検出DNSヘルパー（CoreDNS + Tailscale）。現在の組み込みサーフェス:

- `dns setup [--domain <domain>] [--apply]`

### `dns setup`

広域検出DNSヘルパー（CoreDNS + Tailscale）。[/gateway/discovery](/gateway/discovery) を参照してください。

オプション:

- `--domain <domain>`
- `--apply`: CoreDNS設定をインストール/更新します（sudoが必要。macOSのみ）。

注:

- `--apply` なしでは、これは推奨されるOpenClaw + Tailscale DNS設定を表示する計画ヘルパーです。
- `--apply` は現在、Homebrew CoreDNSを使用するmacOSをサポートしています。

## メッセージングとエージェント

### `message`

統一された送信メッセージングとチャネルアクション。

参照: [/cli/message](/cli/message)

サブコマンド:

- `message send|poll|react|reactions|read|edit|delete|pin|unpin|pins|permissions|search|timeout|kick|ban`
- `message thread <create|list|reply>`
- `message emoji <list|upload>`
- `message sticker <send|upload>`
- `message role <info|add|remove>`
- `message channel <info|list>`
- `message member info`
- `message voice status`
- `message event <list|create>`

例:

- `openclaw message send --target +15555550123 --message "Hi"`
- `openclaw message poll --channel discord --target channel:123 --poll-question "Snack?" --poll-option Pizza --poll-option Sushi`

### `agent`

Gateway経由（または埋め込みの `--local`）でエージェントターンを1回実行します。

少なくとも1つのセッションセレクターを渡してください: `--to`、`--session-id`、または `--agent`。

必須:

- `-m, --message <text>`

オプション:

- `-t, --to <dest>`（セッションキーおよび任意の配信用）
- `--session-id <id>`
- `--agent <id>`（エージェントID。ルーティングバインディングを上書き）
- `--thinking <off|minimal|low|medium|high|xhigh>`（プロバイダーサポートはさまざまです。CLIレベルではモデルで制限されません）
- `--verbose <on|off>`
- `--channel <channel>`（配信チャネル。メインセッションチャネルを使う場合は省略）
- `--reply-to <target>`（セッションルーティングとは別の配信先オーバーライド）
- `--reply-channel <channel>`（配信チャネルオーバーライド）
- `--reply-account <id>`（配信アカウントIDオーバーライド）
- `--local`（埋め込み実行。プラグインレジストリは引き続き先にプリロードされます）
- `--deliver`
- `--json`
- `--timeout <seconds>`

注:

- Gatewayモードでは、Gatewayリクエストが失敗すると埋め込みエージェントにフォールバックします。
- `--local` でもプラグインレジストリはプリロードされるため、プラグイン提供のプロバイダー、ツール、チャネルは埋め込み実行中も利用可能です。
- `--channel`、`--reply-channel`、`--reply-account` はルーティングではなく返信配信に影響します。

### `agents`

分離されたエージェント（ワークスペース、認証、ルーティング）を管理します。

サブコマンドなしで `openclaw agents` を実行すると、`openclaw agents list` と同等です。

#### `agents list`

設定済みエージェントを一覧表示します。

オプション:

- `--json`
- `--bindings`

#### `agents add [name]`

新しい分離エージェントを追加します。フラグ（または `--non-interactive`）が渡されない場合はガイド付きウィザードを実行し、非対話モードでは `--workspace` が必要です。

オプション:

- `--workspace <dir>`
- `--model <id>`
- `--agent-dir <dir>`
- `--bind <channel[:accountId]>`（繰り返し指定可）
- `--non-interactive`
- `--json`

バインディング指定は `channel[:accountId]` を使用します。`accountId` が省略された場合、OpenClawはチャネルのデフォルト/プラグインフック経由でアカウントスコープを解決することがあります。それ以外では、明示的なアカウントスコープを持たないチャネルバインディングになります。
いずれかの明示的なaddフラグを渡すと、コマンドは非対話パスに切り替わります。`main` は予約されており、新しいエージェントIDとしては使用できません。

#### `agents bindings`

ルーティングバインディングを一覧表示します。

オプション:

- `--agent <id>`
- `--json`

#### `agents bind`

エージェントのルーティングバインディングを追加します。

オプション:

- `--agent <id>`（デフォルトは現在のデフォルトエージェント）
- `--bind <channel[:accountId]>`（繰り返し指定可）
- `--json`

#### `agents unbind`

エージェントのルーティングバインディングを削除します。

オプション:

- `--agent <id>`（デフォルトは現在のデフォルトエージェント）
- `--bind <channel[:accountId]>`（繰り返し指定可）
- `--all`
- `--json`

`--all` または `--bind` のいずれかを使用し、両方は使用しないでください。

#### `agents delete <id>`

エージェントを削除し、そのワークスペースと状態を刈り込みます。

オプション:

- `--force`
- `--json`

注:

- `main` は削除できません。
- `--force` がない場合は対話的な確認が必要です。

#### `agents set-identity`

エージェントアイデンティティ（名前/テーマ/絵文字/アバター）を更新します。

オプション:

- `--agent <id>`
- `--workspace <dir>`
- `--identity-file <path>`
- `--from-identity`
- `--name <name>`
- `--theme <theme>`
- `--emoji <emoji>`
- `--avatar <value>`
- `--json`

注:

- `--agent` または `--workspace` を使って対象エージェントを選択できます。
- 明示的なアイデンティティフィールドが指定されていない場合、コマンドは `IDENTITY.md` を読み取ります。

### `acp`

IDEをGatewayに接続するACPブリッジを実行します。

ルートオプション:

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

ブリッジデバッグ用の対話型ACPクライアント。

オプション:

- `--cwd <dir>`
- `--server <command>`
- `--server-args <args...>`
- `--server-verbose`
- `--verbose`

完全な動作、セキュリティ注記、例については [`acp`](/cli/acp) を参照してください。

### `mcp`

保存済みMCPサーバー定義を管理し、OpenClawチャネルをMCP stdio経由で公開します。

#### `mcp serve`

ルーティングされたOpenClawチャネル会話をMCP stdio経由で公開します。

オプション:

- `--url <url>`
- `--token <token>`
- `--token-file <path>`
- `--password <password>`
- `--password-file <path>`
- `--claude-channel-mode <auto|on|off>`
- `--verbose`

#### `mcp list`

保存済みMCPサーバー定義を一覧表示します。

オプション:

- `--json`

#### `mcp show [name]`

1つの保存済みMCPサーバー定義、または保存済みMCPサーバーオブジェクト全体を表示します。

オプション:

- `--json`

#### `mcp set <name> <value>`

JSONオブジェクトから1つのMCPサーバー定義を保存します。

#### `mcp unset <name>`

1つの保存済みMCPサーバー定義を削除します。

### `approvals`

exec承認を管理します。エイリアス: `exec-approvals`。

#### `approvals get`

exec承認スナップショットと有効ポリシーを取得します。

オプション:

- `--node <node>`
- `--gateway`
- `--json`
- `openclaw nodes` のnode RPCオプション

#### `approvals set`

ファイルまたはstdinからのJSONでexec承認を置き換えます。

オプション:

- `--node <node>`
- `--gateway`
- `--file <path>`
- `--stdin`
- `--json`
- `openclaw nodes` のnode RPCオプション

#### `approvals allowlist add|remove`

エージェントごとのexec許可リストを編集します。

オプション:

- `--node <node>`
- `--gateway`
- `--agent <id>`（デフォルト `*`）
- `--json`
- `openclaw nodes` のnode RPCオプション

### `status`

リンクされたセッションのヘルスと最近の宛先を表示します。

オプション:

- `--json`
- `--all`（完全診断。読み取り専用で貼り付け可能）
- `--deep`（Gatewayにライブヘルスプローブを要求し、サポートされている場合はチャネルプローブも含みます）
- `--usage`（モデルプロバイダーの使用量/クォータを表示）
- `--timeout <ms>`
- `--verbose`
- `--debug`（`--verbose` のエイリアス）

注:

- 概要には、利用可能な場合はGatewayとノードホストサービスの状態が含まれます。
- `--usage` は正規化されたプロバイダー使用量ウィンドウを `X% left` として表示します。

### 使用量追跡

OpenClawは、OAuth/API認証情報が利用可能な場合に、プロバイダーの使用量/クォータを表示できます。

サーフェス:

- `/status`（利用可能な場合、短いプロバイダー使用量行を追加）
- `openclaw status --usage`（完全なプロバイダー内訳を表示）
- macOSメニューバー（Context配下のUsageセクション）

注:

- データはプロバイダーの使用量エンドポイントから直接取得されます（推定値ではありません）。
- 人間可読な出力は、プロバイダー間で `X% left` に正規化されます。
- 現在の使用量ウィンドウを持つプロバイダー: Anthropic、GitHub Copilot、Gemini CLI、OpenAI Codex、MiniMax、Xiaomi、z.ai。
- MiniMax注: 生の `usage_percent` / `usagePercent` は残りクォータを意味するため、OpenClawは表示前にこれを反転します。件数ベースのフィールドが存在する場合はそちらが優先されます。`model_remains` 応答ではチャットモデル項目を優先し、必要に応じてタイムスタンプからウィンドウラベルを導出し、プランラベルにモデル名を含めます。
- 使用量認証は、利用可能な場合はプロバイダー固有フックから取得します。そうでない場合、OpenClawは認証プロファイル、env、または設定から一致するOAuth/APIキー認証情報にフォールバックします。いずれも解決できない場合、使用量は非表示になります。
- 詳細: [使用量追跡](/concepts/usage-tracking) を参照してください。

### `health`

実行中のGatewayからヘルス情報を取得します。

オプション:

- `--json`
- `--timeout <ms>`
- `--verbose`（ライブプローブを強制し、Gateway接続の詳細を表示）
- `--debug`（`--verbose` のエイリアス）

注:

- デフォルトの `health` は、新しいキャッシュ済みGatewayスナップショットを返すことがあります。
- `health --verbose` はライブプローブを強制し、すべての設定済みアカウントとエージェントにわたって人間可読出力を展開します。

### `sessions`

保存済み会話セッションを一覧表示します。

オプション:

- `--json`
- `--verbose`
- `--store <path>`
- `--active <minutes>`
- `--agent <id>`（エージェントでセッションを絞り込み）
- `--all-agents`（すべてのエージェントのセッションを表示）

サブコマンド:

- `sessions cleanup` — 期限切れまたは孤立したセッションを削除します

注:

- `sessions cleanup` は `--fix-missing` もサポートし、トランスクリプトファイルが失われた項目を刈り込みます。

## リセット / アンインストール

### `reset`

ローカル設定/状態をリセットします（CLIはインストールされたままです）。

オプション:

- `--scope <config|config+creds+sessions|full>`
- `--yes`
- `--non-interactive`
- `--dry-run`

注:

- `--non-interactive` には `--scope` と `--yes` が必要です。

### `uninstall`

Gatewayサービスとローカルデータをアンインストールします（CLIは残ります）。

オプション:

- `--service`
- `--state`
- `--workspace`
- `--app`
- `--all`
- `--yes`
- `--non-interactive`
- `--dry-run`

注:

- `--non-interactive` には `--yes` と明示的なスコープ（または `--all`）が必要です。
- `--all` はサービス、状態、ワークスペース、アプリをまとめて削除します。

### `tasks`

エージェント間の[バックグラウンドタスク](/ja-JP/automation/tasks)実行を一覧表示して管理します。

- `tasks list` — アクティブおよび最近のタスク実行を表示します
- `tasks show <id>` — 特定のタスク実行の詳細を表示します
- `tasks notify <id>` — タスク実行の通知ポリシーを変更します
- `tasks cancel <id>` — 実行中のタスクをキャンセルします
- `tasks audit` — 運用上の問題（停滞、消失、配信失敗）を表面化します
- `tasks maintenance [--apply] [--json]` — タスクとTaskFlowのクリーンアップ/照合（ACP/サブエージェント子セッション、アクティブなcronジョブ、ライブCLI実行）をプレビューまたは適用します
- `tasks flow list` — アクティブおよび最近のTask Flowフローを一覧表示します
- `tasks flow show <lookup>` — IDまたはlookup keyでフローを調査します
- `tasks flow cancel <lookup>` — 実行中のフローとそのアクティブなタスクをキャンセルします

### `flows`

レガシードキュメントショートカット。フローコマンドは `openclaw tasks flow` 配下にあります:

- `tasks flow list [--json]`
- `tasks flow show <lookup>`
- `tasks flow cancel <lookup>`

## Gateway

### `gateway`

WebSocket Gatewayを実行します。

オプション:

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
- `--reset`（開発用設定、認証情報、セッション、ワークスペースをリセット）
- `--force`（ポート上の既存リスナーを強制終了）
- `--verbose`
- `--cli-backend-logs`
- `--claude-cli-logs`（非推奨エイリアス）
- `--ws-log <auto|full|compact>`
- `--compact`（`--ws-log compact` のエイリアス）
- `--raw-stream`
- `--raw-stream-path <path>`

### `gateway service`

Gatewayサービス（launchd/systemd/schtasks）を管理します。

サブコマンド:

- `gateway status`（デフォルトでGateway RPCをプローブ）
- `gateway install`（サービスインストール）
- `gateway uninstall`
- `gateway start`
- `gateway stop`
- `gateway restart`

注:

- `gateway status` はデフォルトで、サービスの解決済みポート/設定を使ってGateway RPCをプローブします（`--url/--token/--password` で上書き可能）。
- `gateway status` はスクリプト用に `--no-probe`、`--deep`、`--require-rpc`、`--json` をサポートします。
- `gateway status` は、検出できる場合にレガシーまたは追加のGatewayサービスも表示します（`--deep` はシステムレベルのスキャンを追加）。プロファイル名付きOpenClawサービスは第一級として扱われ、「extra」とは見なされません。
- `gateway status` は、ローカルCLI設定が欠落または無効でも診断のために利用できます。
- `gateway status` は、解決済みのファイルログパス、CLIとサービスの設定パス/妥当性スナップショット、および解決済みのプローブターゲットURLを表示します。
- 現在のコマンドパスでGateway認証SecretRefが未解決の場合、`gateway status --json` はプローブ接続/認証が失敗したときにのみ `rpc.authWarning` を報告します（プローブが成功した場合、警告は抑制されます）。
- Linuxのsystemdインストールでは、statusのトークンドリフトチェックに `Environment=` と `EnvironmentFile=` の両方のunitソースが含まれます。
- `gateway install|uninstall|start|stop|restart` はスクリプト用に `--json` をサポートします（デフォルト出力は人間向けのままです）。
- `gateway install` はデフォルトでNodeランタイムを使用します。bunは**推奨されません**（WhatsApp/Telegramのバグ）。
- `gateway install` のオプション: `--port`, `--runtime`, `--token`, `--force`, `--json`。

### `daemon`

Gatewayサービス管理コマンドのレガシーエイリアスです。[/cli/daemon](/cli/daemon) を参照してください。

サブコマンド:

- `daemon status`
- `daemon install`
- `daemon uninstall`
- `daemon start`
- `daemon stop`
- `daemon restart`

共通オプション:

- `status`: `--url`, `--token`, `--password`, `--timeout`, `--no-probe`, `--require-rpc`, `--deep`, `--json`
- `install`: `--port`, `--runtime <node|bun>`, `--token`, `--force`, `--json`
- `uninstall|start|stop|restart`: `--json`

### `logs`

RPC経由でGatewayファイルログをtailします。

オプション:

- `--limit <n>`: 返すログ行数の上限
- `--max-bytes <n>`: ログファイルから読み取る最大バイト数
- `--follow`: ログファイルを追跡します（tail -f形式）
- `--interval <ms>`: 追跡時のポーリング間隔（ms）
- `--local-time`: タイムスタンプをローカル時刻で表示します
- `--json`: 行区切りJSONを出力します
- `--plain`: 構造化フォーマットを無効にします
- `--no-color`: ANSIカラーを無効にします
- `--url <url>`: 明示的なGateway WebSocket URL
- `--token <token>`: Gatewayトークン
- `--timeout <ms>`: Gateway RPCタイムアウト
- `--expect-final`: 必要に応じて最終応答を待機します

例:

```bash
openclaw logs --follow
openclaw logs --limit 200
openclaw logs --plain
openclaw logs --json
openclaw logs --no-color
```

注:

- `--url` を渡した場合、CLIは設定または環境認証情報を自動適用しません。
- local loopbackのペアリング失敗は、設定済みのローカルログファイルにフォールバックします。明示的な `--url` ターゲットではフォールバックしません。

### `gateway <subcommand>`

Gateway CLIヘルパーです（RPCサブコマンドには `--url`、`--token`、`--password`、`--timeout`、`--expect-final` を使用）。
`--url` を渡した場合、CLIは設定または環境認証情報を自動適用しません。
`--token` または `--password` を明示的に含めてください。明示的な認証情報がない場合はエラーです。

サブコマンド:

- `gateway call <method> [--params <json>] [--url <url>] [--token <token>] [--password <password>] [--timeout <ms>] [--expect-final] [--json]`
- `gateway health`
- `gateway status`
- `gateway probe`
- `gateway discover`
- `gateway install|uninstall|start|stop|restart`
- `gateway run`

注:

- `gateway status --deep` はシステムレベルのサービススキャンを追加します。より深いランタイムプローブ詳細には `gateway probe`、
  `health --verbose`、またはトップレベルの `status --deep` を使用してください。

一般的なRPC:

- `config.schema.lookup`（浅いスキーマノード、一致したヒントメタデータ、直下の子サマリーを使って1つの設定サブツリーを調査）
- `config.get`（現在の設定スナップショットとハッシュを読み取り）
- `config.set`（設定全体を検証して書き込み。楽観的並行制御には `baseHash` を使用）
- `config.apply`（設定を検証して書き込み、再起動し、wakeを実行）
- `config.patch`（部分更新をマージし、再起動し、wakeを実行）
- `update.run`（更新、再起動、wakeを実行）

ヒント: `config.set`/`config.apply`/`config.patch` を直接呼び出すとき、すでに設定が存在する場合は
`config.get` の `baseHash` を渡してください。
ヒント: 部分編集では、まず `config.schema.lookup` で調べ、`config.patch` を優先してください。
ヒント: これらの設定書き込みRPCは、送信された設定ペイロード内の参照に対するアクティブなSecretRef解決を事前確認し、実質的に有効な送信済み参照が未解決である場合は書き込みを拒否します。
ヒント: owner専用の `gateway` ランタイムツールは、依然として `tools.exec.ask` または `tools.exec.security` の書き換えを拒否します。レガシーの `tools.bash.*` エイリアスは、同じ保護されたexecパスへ正規化されます。

## モデル

フォールバック動作とスキャン戦略については [/concepts/models](/concepts/models) を参照してください。

課金に関する注: Anthropicの公開CLIドキュメントに基づき、Claude Code CLIフォールバックは
ローカルでユーザー管理の自動化については許可されている可能性が高いと考えています。ただし、
外部製品におけるサブスクリプションベースの利用に関しては、Anthropicのサードパーティハーネスポリシーに
十分な曖昧さがあるため、本番利用は推奨しません。
また、Anthropicは **2026年4月4日 午後12:00 PT / 午後8:00 BST** にOpenClawユーザーへ、
**OpenClaw** のClaudeログインパスはサードパーティハーネス利用として扱われ、
サブスクリプションとは別に請求される **Extra Usage** が必要だと通知しました。
本番環境では、Anthropic APIキー、またはOpenAI Codex、Alibaba Cloud Model Studio
Coding Plan、MiniMax Coding Plan、Z.AI / GLM Coding Planのような、別のサポート対象
サブスクリプション型プロバイダーを推奨します。

Anthropic Claude CLI移行:

```bash
openclaw models auth login --provider anthropic --method cli --set-default
```

オンボーディングショートカット: `openclaw onboard --auth-choice anthropic-cli`

Anthropic setup-tokenも、レガシー/手動認証パスとして再び利用可能です。
使用する場合は、AnthropicがOpenClawユーザーに対して
OpenClaw Claudeログインパスには **Extra Usage** が必要だと通知していることを前提にしてください。

レガシーエイリアス注: `claude-cli` は非推奨のオンボーディングauth-choiceエイリアスです。
オンボーディングには `anthropic-cli` を使用するか、直接 `models auth login` を使用してください。

### `models`（ルート）

`openclaw models` は `models status` のエイリアスです。

ルートオプション:

- `--status-json`（`models status --json` のエイリアス）
- `--status-plain`（`models status --plain` のエイリアス）

### `models list`

オプション:

- `--all`
- `--local`
- `--provider <name>`
- `--json`
- `--plain`

### `models status`

オプション:

- `--json`
- `--plain`
- `--check`（終了コード 1=期限切れ/欠落、2=期限間近）
- `--probe`（設定済み認証プロファイルのライブプローブ）
- `--probe-provider <name>`
- `--probe-profile <id>`（繰り返しまたはカンマ区切り）
- `--probe-timeout <ms>`
- `--probe-concurrency <n>`
- `--probe-max-tokens <n>`
- `--agent <id>`

常に、認証ストア内のプロファイルに対する認証概要とOAuth有効期限状態を含みます。
`--probe` はライブリクエストを実行します（トークンを消費し、レート制限を引き起こす場合があります）。
プローブ行は、認証プロファイル、env認証情報、または `models.json` から取得されることがあります。
期待されるプローブ状態は `ok`、`auth`、`rate_limit`、`billing`、`timeout`、
`format`、`unknown`、`no_model` です。
明示的な `auth.order.<provider>` が保存済みプロファイルを省略している場合、プローブは
そのプロファイルを黙って試す代わりに `excluded_by_auth_order` を報告します。

### `models set <model>`

`agents.defaults.model.primary` を設定します。

### `models set-image <model>`

`agents.defaults.imageModel.primary` を設定します。

### `models aliases list|add|remove`

オプション:

- `list`: `--json`, `--plain`
- `add <alias> <model>`
- `remove <alias>`

### `models fallbacks list|add|remove|clear`

オプション:

- `list`: `--json`, `--plain`
- `add <model>`
- `remove <model>`
- `clear`

### `models image-fallbacks list|add|remove|clear`

オプション:

- `list`: `--json`, `--plain`
- `add <model>`
- `remove <model>`
- `clear`

### `models scan`

オプション:

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

オプション:

- `add`: 対話型認証ヘルパー（プロバイダー認証フローまたはトークン貼り付け）
- `login`: `--provider <name>`, `--method <method>`, `--set-default`
- `login-github-copilot`: GitHub Copilot OAuthログインフロー（`--yes`）
- `setup-token`: `--provider <name>`, `--yes`
- `paste-token`: `--provider <name>`, `--profile-id <id>`, `--expires-in <duration>`

注:

- `setup-token` と `paste-token` は、トークン認証方式を公開するプロバイダー向けの汎用トークンコマンドです。
- `setup-token` には対話型TTYが必要で、プロバイダーのトークン認証方式を実行します。
- `paste-token` はトークン値の入力を促し、`--profile-id` を省略した場合は認証プロファイルIDとして `<provider>:manual` をデフォルト使用します。
- Anthropicの `setup-token` / `paste-token` は、レガシー/手動のOpenClawパスとして再び利用可能です。AnthropicはOpenClawユーザーに、このパスにはClaudeアカウントで **Extra Usage** が必要だと通知しています。

### `models auth order get|set|clear`

オプション:

- `get`: `--provider <name>`, `--agent <id>`, `--json`
- `set`: `--provider <name>`, `--agent <id>`, `<profileIds...>`
- `clear`: `--provider <name>`, `--agent <id>`

## System

### `system event`

システムイベントをキューに入れ、必要に応じてheartbeatをトリガーします（Gateway RPC）。

必須:

- `--text <text>`

オプション:

- `--mode <now|next-heartbeat>`
- `--json`
- `--url`, `--token`, `--timeout`, `--expect-final`

### `system heartbeat last|enable|disable`

heartbeatコントロール（Gateway RPC）。

オプション:

- `--json`
- `--url`, `--token`, `--timeout`, `--expect-final`

### `system presence`

system presence項目を一覧表示します（Gateway RPC）。

オプション:

- `--json`
- `--url`, `--token`, `--timeout`, `--expect-final`

## Cron

スケジュールジョブを管理します（Gateway RPC）。[/automation/cron-jobs](/ja-JP/automation/cron-jobs) を参照してください。

サブコマンド:

- `cron status [--json]`
- `cron list [--all] [--json]`（デフォルトはテーブル出力。生データには `--json` を使用）
- `cron add`（エイリアス: `create`。`--name` と、`--at` | `--every` | `--cron` のいずれか1つ、さらに `--system-event` | `--message` のいずれか1つのペイロードが必要）
- `cron edit <id>`（フィールドをパッチ）
- `cron rm <id>`（エイリアス: `remove`, `delete`）
- `cron enable <id>`
- `cron disable <id>`
- `cron runs --id <id> [--limit <n>]`
- `cron run <id> [--due]`

すべての `cron` コマンドは `--url`, `--token`, `--timeout`, `--expect-final` を受け付けます。

`cron add|edit --model ...` は、そのジョブに対して選択された許可済みモデルを使用します。もし
そのモデルが許可されていない場合、cronは警告を出し、代わりにジョブのエージェント/デフォルト
モデル選択へフォールバックします。設定済みのフォールバックチェーンは引き続き適用されますが、
明示的なジョブ単位フォールバックリストなしの単純なモデルオーバーライドでは、もはや
エージェントのprimaryを隠れた追加再試行ターゲットとして付加しません。

## ノードホスト

### `node`

`node` は**ヘッドレスノードホスト**を実行するか、バックグラウンドサービスとして管理します。参照:
[`openclaw node`](/cli/node)。

サブコマンド:

- `node run --host <gateway-host> --port 18789`
- `node status`
- `node install [--host <gateway-host>] [--port <port>] [--tls] [--tls-fingerprint <sha256>] [--node-id <id>] [--display-name <name>] [--runtime <node|bun>] [--force]`
- `node uninstall`
- `node stop`
- `node restart`

認証に関する注:

- `node` はenv/設定からGateway認証を解決します（`--token`/`--password` フラグはありません）: `OPENCLAW_GATEWAY_TOKEN` / `OPENCLAW_GATEWAY_PASSWORD`、次に `gateway.auth.*`。ローカルモードでは、node hostは意図的に `gateway.remote.*` を無視します。`gateway.mode=remote` では、`gateway.remote.*` がリモート優先ルールに従って関与します。
- ノードホストの認証解決は `OPENCLAW_GATEWAY_*` env vars のみを尊重します。

## Nodes

`nodes` はGatewayと通信し、ペアリング済みノードを対象にします。[/nodes](/nodes) を参照してください。

共通オプション:

- `--url`, `--token`, `--timeout`, `--json`

サブコマンド:

- `nodes status [--connected] [--last-connected <duration>]`
- `nodes describe --node <id|name|ip>`
- `nodes list [--connected] [--last-connected <duration>]`
- `nodes pending`
- `nodes approve <requestId>`
- `nodes reject <requestId>`
- `nodes rename --node <id|name|ip> --name <displayName>`
- `nodes invoke --node <id|name|ip> --command <command> [--params <json>] [--invoke-timeout <ms>] [--idempotency-key <key>]`
- `nodes notify --node <id|name|ip> [--title <text>] [--body <text>] [--sound <name>] [--priority <passive|active|timeSensitive>] [--delivery <system|overlay|auto>] [--invoke-timeout <ms>]`（macのみ）

カメラ:

- `nodes camera list --node <id|name|ip>`
- `nodes camera snap --node <id|name|ip> [--facing front|back|both] [--device-id <id>] [--max-width <px>] [--quality <0-1>] [--delay-ms <ms>] [--invoke-timeout <ms>]`
- `nodes camera clip --node <id|name|ip> [--facing front|back] [--device-id <id>] [--duration <ms|10s|1m>] [--no-audio] [--invoke-timeout <ms>]`

Canvas + 画面:

- `nodes canvas snapshot --node <id|name|ip> [--format png|jpg|jpeg] [--max-width <px>] [--quality <0-1>] [--invoke-timeout <ms>]`
- `nodes canvas present --node <id|name|ip> [--target <urlOrPath>] [--x <px>] [--y <px>] [--width <px>] [--height <px>] [--invoke-timeout <ms>]`
- `nodes canvas hide --node <id|name|ip> [--invoke-timeout <ms>]`
- `nodes canvas navigate <url> --node <id|name|ip> [--invoke-timeout <ms>]`
- `nodes canvas eval [<js>] --node <id|name|ip> [--js <code>] [--invoke-timeout <ms>]`
- `nodes canvas a2ui push --node <id|name|ip> (--jsonl <path> | --text <text>) [--invoke-timeout <ms>]`
- `nodes canvas a2ui reset --node <id|name|ip> [--invoke-timeout <ms>]`
- `nodes screen record --node <id|name|ip> [--screen <index>] [--duration <ms|10s>] [--fps <n>] [--no-audio] [--out <path>] [--invoke-timeout <ms>]`

位置情報:

- `nodes location get --node <id|name|ip> [--max-age <ms>] [--accuracy <coarse|balanced|precise>] [--location-timeout <ms>] [--invoke-timeout <ms>]`

## Browser

ブラウザ制御CLI（専用のChrome/Brave/Edge/Chromium）。[`openclaw browser`](/cli/browser) と [Browser tool](/tools/browser) を参照してください。

共通オプション:

- `--url`, `--token`, `--timeout`, `--expect-final`, `--json`
- `--browser-profile <name>`

管理:

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

調査:

- `browser screenshot [targetId] [--full-page] [--ref <ref>] [--element <selector>] [--type png|jpeg]`
- `browser snapshot [--format aria|ai] [--target-id <id>] [--limit <n>] [--interactive] [--compact] [--depth <n>] [--selector <sel>] [--out <path>]`

操作:

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

プラグイン提供の音声通話ユーティリティ。音声通話プラグインがインストールされ、有効な場合にのみ表示されます。[`openclaw voicecall`](/cli/voicecall) を参照してください。

共通コマンド:

- `voicecall call --to <phone> --message <text> [--mode notify|conversation]`
- `voicecall start --to <phone> [--message <text>] [--mode notify|conversation]`
- `voicecall continue --call-id <id> --message <text>`
- `voicecall speak --call-id <id> --message <text>`
- `voicecall end --call-id <id>`
- `voicecall status --call-id <id>`
- `voicecall tail [--file <path>] [--since <n>] [--poll <ms>]`
- `voicecall latency [--file <path>] [--last <n>]`
- `voicecall expose [--mode off|serve|funnel] [--path <path>] [--port <port>] [--serve-path <path>]`

## ドキュメント検索

### `docs`

ライブのOpenClawドキュメントインデックスを検索します。

### `docs [query...]`

ライブのドキュメントインデックスを検索します。

## TUI

### `tui`

Gatewayに接続されたターミナルUIを開きます。

オプション:

- `--url <url>`
- `--token <token>`
- `--password <password>`
- `--session <key>`
- `--deliver`
- `--thinking <level>`
- `--message <text>`
- `--timeout-ms <ms>`（デフォルトは `agents.defaults.timeoutSeconds`）
- `--history-limit <n>`
