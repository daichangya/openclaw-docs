---
read_when:
    - チャットコマンドの使用または設定
    - コマンドルーティングまたは権限のデバッグ
summary: 'スラッシュコマンド: テキスト方式とネイティブ方式、設定、対応コマンド'
title: スラッシュコマンド
x-i18n:
    generated_at: "2026-04-22T04:28:39Z"
    model: gpt-5.4
    provider: openai
    source_hash: 43cc050149de60ca39083009fd6ce566af3bfa79d455e2e0f44e2d878bf4d2d9
    source_path: tools/slash-commands.md
    workflow: 15
---

# スラッシュコマンド

コマンドはGatewayによって処理されます。ほとんどのコマンドは、`/`で始まる**単独**メッセージとして送信する必要があります。
ホスト専用のbashチャットコマンドは`! <cmd>`を使用します（`/bash <cmd>`はそのエイリアスです）。

関連する2つのシステムがあります。

- **Commands**: 単独の`/...`メッセージ。
- **Directives**: `/think`, `/fast`, `/verbose`, `/trace`, `/reasoning`, `/elevated`, `/exec`, `/model`, `/queue`。
  - Directivesは、モデルがメッセージを見る前に取り除かれます。
  - 通常のチャットメッセージ内（directiveのみではない場合）では、「インラインヒント」として扱われ、セッション設定を永続化しません。
  - directiveのみのメッセージ（メッセージがdirectiveだけを含む場合）では、セッションに永続化され、確認応答が返されます。
  - Directivesは**認可された送信者**に対してのみ適用されます。`commands.allowFrom`が設定されている場合、それが使用される唯一のallowlistです。
    そうでなければ、認可はチャネルallowlist/ペアリングと`commands.useAccessGroups`から来ます。
    認可されていない送信者では、directiveは通常のテキストとして扱われます。

また、いくつかの**インラインショートカット**もあります（allowlist/認可済み送信者のみ）: `/help`, `/commands`, `/status`, `/whoami`（`/id`）。
これらは即座に実行され、モデルがメッセージを見る前に取り除かれ、残りのテキストは通常フローを継続します。

## 設定

```json5
{
  commands: {
    native: "auto",
    nativeSkills: "auto",
    text: true,
    bash: false,
    bashForegroundMs: 2000,
    config: false,
    mcp: false,
    plugins: false,
    debug: false,
    restart: true,
    ownerAllowFrom: ["discord:123456789012345678"],
    ownerDisplay: "raw",
    ownerDisplaySecret: "${OWNER_ID_HASH_SECRET}",
    allowFrom: {
      "*": ["user1"],
      discord: ["user:123"],
    },
    useAccessGroups: true,
  },
}
```

- `commands.text`（デフォルト`true`）は、チャットメッセージ内の`/...`解析を有効にします。
  - ネイティブコマンドのないサーフェス（WhatsApp/WebChat/Signal/iMessage/Google Chat/Microsoft Teams）では、これを`false`に設定してもテキストコマンドは引き続き動作します。
- `commands.native`（デフォルト`"auto"`）は、ネイティブコマンドを登録します。
  - Auto: Discord/Telegramではon、Slackではoff（スラッシュコマンドを追加するまで）。ネイティブサポートのないproviderでは無視されます。
  - providerごとに上書きするには、`channels.discord.commands.native`、`channels.telegram.commands.native`、または`channels.slack.commands.native`を設定します（boolまたは`"auto"`）。
  - `false`にすると、起動時にDiscord/Telegramで以前登録したコマンドをクリアします。SlackコマンドはSlackアプリで管理され、自動では削除されません。
- `commands.nativeSkills`（デフォルト`"auto"`）は、サポートされている場合に**skill**コマンドをネイティブ登録します。
  - Auto: Discord/Telegramではon、Slackではoff（Slackではskillごとにスラッシュコマンド作成が必要）。
  - providerごとに上書きするには、`channels.discord.commands.nativeSkills`、`channels.telegram.commands.nativeSkills`、または`channels.slack.commands.nativeSkills`を設定します（boolまたは`"auto"`）。
- `commands.bash`（デフォルト`false`）は、ホストshellコマンドを実行する`! <cmd>`を有効にします（`/bash <cmd>`はエイリアス。`tools.elevated` allowlistが必要）。
- `commands.bashForegroundMs`（デフォルト`2000`）は、bashがバックグラウンドモードへ切り替わるまで待機する時間を制御します（`0`で即座にバックグラウンド化）。
- `commands.config`（デフォルト`false`）は`/config`を有効にします（`openclaw.json`の読み書き）。
- `commands.mcp`（デフォルト`false`）は`/mcp`を有効にします（`mcp.servers`配下のOpenClaw管理MCP設定の読み書き）。
- `commands.plugins`（デフォルト`false`）は`/plugins`を有効にします（Plugin検出/ステータス、およびinstall + enable/disable制御）。
- `commands.debug`（デフォルト`false`）は`/debug`を有効にします（ランタイム専用上書き）。
- `commands.restart`（デフォルト`true`）は`/restart`とgateway restart tool actionを有効にします。
- `commands.ownerAllowFrom`（任意）は、owner専用コマンド/toolサーフェス向けの明示的なowner allowlistを設定します。これは`commands.allowFrom`とは別です。
- チャネルごとの`channels.<channel>.commands.enforceOwnerForCommands`（任意、デフォルト`false`）は、そのサーフェスでowner専用コマンドの実行に**owner ID**を要求します。`true`の場合、送信者は解決済みowner candidate（たとえば`commands.ownerAllowFrom`のエントリやproviderネイティブのownerメタデータ）に一致するか、内部メッセージチャネル上で内部`operator.admin`スコープを持っている必要があります。チャネル`allowFrom`内のワイルドカードエントリ、または空/未解決のowner-candidate一覧では**不十分**です。そのチャネルではowner専用コマンドはfail closedします。owner専用コマンドを`ownerAllowFrom`と標準コマンドallowlistだけで制御したい場合は、これをoffのままにしてください。
- `commands.ownerDisplay`は、system prompt内でowner idをどのように表示するかを制御します: `raw`または`hash`。
- `commands.ownerDisplaySecret`は、`commands.ownerDisplay="hash"`時に使用するHMAC secretを任意で設定します。
- `commands.allowFrom`（任意）は、コマンド認可向けのproviderごとのallowlistを設定します。設定されている場合、これはコマンドとdirectiveの唯一の認可元となり、チャネルallowlist/ペアリングおよび`commands.useAccessGroups`は無視されます。グローバルデフォルトには`"*"`を使い、provider固有キーがそれを上書きします。
- `commands.useAccessGroups`（デフォルト`true`）は、`commands.allowFrom`が未設定のとき、コマンドに対してallowlist/ポリシーを強制します。

## コマンド一覧

現在のsource-of-truth:

- core組み込みは`src/auto-reply/commands-registry.shared.ts`から来ます
- 生成されたdockコマンドは`src/auto-reply/commands-registry.data.ts`から来ます
- PluginコマンドはPluginの`registerCommand()`呼び出しから来ます
- 実際にあなたのgatewayで利用可能かどうかは、引き続き設定フラグ、チャネルサーフェス、インストール済み/有効化済みPluginに依存します

### core組み込みコマンド

現在利用可能な組み込みコマンド:

- `/new [model]`は新しいセッションを開始します。`/reset`はresetのエイリアスです。
- `/reset soft [message]`は現在のtranscriptを保持し、再利用されたCLI backend session idを破棄し、その場でstartup/system-prompt読み込みを再実行します。
- `/compact [instructions]`はセッションコンテキストをCompactionします。[/concepts/compaction](/ja-JP/concepts/compaction)を参照してください。
- `/stop`は現在の実行を中止します。
- `/session idle <duration|off>`および`/session max-age <duration|off>`は、thread-binding expiryを管理します。
- `/think <level>`はthinkingレベルを設定します。選択肢はアクティブモデルのprovider profileから来ます。一般的なレベルは`off`、`minimal`、`low`、`medium`、`high`で、`xhigh`、`adaptive`、`max`、または二値の`on`のようなカスタムレベルはサポートされる場合にのみ利用できます。エイリアス: `/thinking`, `/t`。
- `/verbose on|off|full`は詳細出力を切り替えます。エイリアス: `/v`。
- `/trace on|off`は現在のセッションのPlugin trace出力を切り替えます。
- `/fast [status|on|off]`は高速モードを表示または設定します。
- `/reasoning [on|off|stream]`はreasoning表示を切り替えます。エイリアス: `/reason`。
- `/elevated [on|off|ask|full]`はelevatedモードを切り替えます。エイリアス: `/elev`。
- `/exec host=<auto|sandbox|gateway|node> security=<deny|allowlist|full> ask=<off|on-miss|always> node=<id>`はexecデフォルトを表示または設定します。
- `/model [name|#|status]`はモデルを表示または設定します。
- `/models [provider] [page] [limit=<n>|size=<n>|all]`はprovider、またはproviderのモデルを一覧表示します。
- `/queue <mode>`はキュー動作（`steer`, `interrupt`, `followup`, `collect`, `steer-backlog`）と、`debounce:2s cap:25 drop:summarize`のようなオプションを管理します。
- `/help`は短いヘルプ概要を表示します。
- `/commands`は生成されたコマンドカタログを表示します。
- `/tools [compact|verbose]`は、現在のエージェントが今使えるものを表示します。
- `/status`は、利用可能な場合はprovider usage/quotaを含むランタイムステータスを表示します。
- `/tasks`は、現在のセッションのアクティブな/最近のバックグラウンドタスクを一覧表示します。
- `/context [list|detail|json]`は、コンテキストがどのように組み立てられるかを説明します。
- `/export-session [path]`は、現在のセッションをHTMLへエクスポートします。エイリアス: `/export`。
- `/whoami`は送信者idを表示します。エイリアス: `/id`。
- `/skill <name> [input]`は、名前でskillを実行します。
- `/allowlist [list|add|remove] ...`はallowlistエントリを管理します。テキスト専用。
- `/approve <id> <decision>`はexec approval promptを解決します。
- `/btw <question>`は、今後のセッションコンテキストを変更せずに補足の質問をします。[/tools/btw](/ja-JP/tools/btw)を参照してください。
- `/subagents list|kill|log|info|send|steer|spawn`は、現在のセッションのsub-agent実行を管理します。
- `/acp spawn|cancel|steer|close|sessions|status|set-mode|set|cwd|permissions|timeout|model|reset-options|doctor|install|help`は、ACPセッションとランタイムオプションを管理します。
- `/focus <target>`は、現在のDiscord threadまたはTelegram topic/conversationをセッションターゲットへバインドします。
- `/unfocus`は現在のバインディングを削除します。
- `/agents`は現在のセッションにバインドされたthread-boundエージェントを一覧表示します。
- `/kill <id|#|all>`は、1つまたはすべての実行中sub-agentを中止します。
- `/steer <id|#> <message>`は、実行中sub-agentへsteeringを送信します。エイリアス: `/tell`。
- `/config show|get|set|unset`は`openclaw.json`を読み書きします。owner専用。`commands.config: true`が必要。
- `/mcp show|get|set|unset`は`mcp.servers`配下のOpenClaw管理MCP server設定を読み書きします。owner専用。`commands.mcp: true`が必要。
- `/plugins list|inspect|show|get|install|enable|disable`はPlugin状態を検査または変更します。`/plugin`はエイリアスです。書き込みはowner専用。`commands.plugins: true`が必要。
- `/debug show|set|unset|reset`は、ランタイム専用設定上書きを管理します。owner専用。`commands.debug: true`が必要。
- `/usage off|tokens|full|cost`は、応答ごとのusageフッターを制御するか、ローカルのコスト概要を表示します。
- `/tts on|off|status|provider|limit|summary|audio|help`はTTSを制御します。[/tools/tts](/ja-JP/tools/tts)を参照してください。
- `/restart`は、有効な場合にOpenClawを再起動します。デフォルト: 有効。無効にするには`commands.restart: false`を設定してください。
- `/activation mention|always`は、グループ有効化モードを設定します。
- `/send on|off|inherit`はsendポリシーを設定します。owner専用。
- `/bash <command>`はホストshellコマンドを実行します。テキスト専用。エイリアス: `! <command>`。`commands.bash: true`に加え、`tools.elevated` allowlistが必要です。
- `!poll [sessionId]`はバックグラウンドbashジョブを確認します。
- `!stop [sessionId]`はバックグラウンドbashジョブを停止します。

### 生成されたdockコマンド

dockコマンドは、ネイティブコマンドサポートを持つチャネルPluginから生成されます。現在の組み込みセット:

- `/dock-discord`（エイリアス: `/dock_discord`）
- `/dock-mattermost`（エイリアス: `/dock_mattermost`）
- `/dock-slack`（エイリアス: `/dock_slack`）
- `/dock-telegram`（エイリアス: `/dock_telegram`）

### 組み込みPluginコマンド

組み込みPluginは追加のスラッシュコマンドを追加できます。このrepoにある現在の組み込みコマンド:

- `/dreaming [on|off|status|help]`はmemory Dreamingを切り替えます。[Dreaming](/ja-JP/concepts/dreaming)を参照してください。
- `/pair [qr|status|pending|approve|cleanup|notify]`はdevice pairing/setupフローを管理します。[Pairing](/ja-JP/channels/pairing)を参照してください。
- `/phone status|arm <camera|screen|writes|all> [duration]|disarm`は、高リスクなphone Nodeコマンドを一時的に有効化します。
- `/voice status|list [limit]|set <voiceId|name>`はTalk voice設定を管理します。Discordでは、ネイティブコマンド名は`/talkvoice`です。
- `/card ...`はLINEリッチカードプリセットを送信します。[LINE](/ja-JP/channels/line)を参照してください。
- `/codex status|models|threads|resume|compact|review|account|mcp|skills`は、組み込みCodex app-server harnessを検査および制御します。[Codex Harness](/ja-JP/plugins/codex-harness)を参照してください。
- QQBot専用コマンド:
  - `/bot-ping`
  - `/bot-version`
  - `/bot-help`
  - `/bot-upgrade`
  - `/bot-logs`

### 動的skillコマンド

ユーザーが呼び出せるskillも、スラッシュコマンドとして公開されます。

- `/skill <name> [input]`は、常に汎用のエントリポイントとして動作します。
- skill/pluginが登録すれば、`/prose`のような直接コマンドとしてskillが現れることもあります。
- ネイティブskillコマンド登録は`commands.nativeSkills`と`channels.<provider>.commands.nativeSkills`で制御されます。

注記:

- コマンドでは、コマンドと引数の間に任意で`:`を入れられます（例: `/think: high`, `/send: on`, `/help:`）。
- `/new <model>`は、model alias、`provider/model`、またはprovider名（あいまい一致）を受け付けます。一致しない場合、そのテキストはメッセージ本文として扱われます。
- provider usageの完全な内訳には、`openclaw status --usage`を使用してください。
- `/allowlist add|remove`には`commands.config=true`が必要で、チャネルの`configWrites`に従います。
- マルチアカウントチャネルでは、設定対象の`/allowlist --account <id>`および`/config set channels.<provider>.accounts.<id>...`も、対象アカウントの`configWrites`に従います。
- `/usage`は応答ごとのusageフッターを制御します。`/usage cost`はOpenClawセッションログからローカルコスト概要を表示します。
- `/restart`はデフォルトで有効です。無効にするには`commands.restart: false`を設定してください。
- `/plugins install <spec>`は`openclaw plugins install`と同じPlugin specを受け付けます: ローカルpath/archive、npm package、または`clawhub:<pkg>`。
- `/plugins enable|disable`はPlugin設定を更新し、再起動を求める場合があります。
- Discord専用ネイティブコマンド: `/vc join|leave|status`はvoice channelを制御します（`channels.discord.voice`とネイティブコマンドが必要。テキストでは利用不可）。
- Discordのthread-bindingコマンド（`/focus`, `/unfocus`, `/agents`, `/session idle`, `/session max-age`）は、有効なthread bindingsが有効である必要があります（`session.threadBindings.enabled`および/または`channels.discord.threadBindings.enabled`）。
- ACPコマンドリファレンスとランタイム動作: [ACP Agents](/ja-JP/tools/acp-agents)。
- `/verbose`はデバッグと追加可視化のためのものです。通常利用では**off**のままにしてください。
- `/trace`は`/verbose`より狭く、Plugin所有のtrace/debug行だけを表示し、通常のverboseなtool chatterはoffのままに保ちます。
- `/fast on|off`はセッション上書きを永続化します。これをクリアして設定デフォルトへ戻すには、Sessions UIの`inherit`オプションを使ってください。
- `/fast`はprovider固有です: OpenAI/OpenAI CodexではネイティブResponses endpoint上で`service_tier=priority`にマップされます。一方、`api.anthropic.com`へ送られるOAuth認証トラフィックを含む直接の公開Anthropicリクエストでは、`service_tier=auto`または`standard_only`にマップされます。[OpenAI](/ja-JP/providers/openai)および[Anthropic](/ja-JP/providers/anthropic)を参照してください。
- tool失敗サマリーは必要に応じて引き続き表示されますが、詳細な失敗テキストは`/verbose`が`on`または`full`のときのみ含まれます。
- `/reasoning`、`/verbose`、`/trace`はグループ設定では危険です。意図せず内部reasoning、tool出力、またはPlugin diagnosticsを露出させる可能性があります。特にグループチャットではoffのままにしておくことを推奨します。
- `/model`は、新しいセッションmodelを即座に永続化します。
- エージェントがアイドルであれば、次の実行ですぐに使われます。
- すでに実行がアクティブな場合、OpenClawはライブ切り替えをpendingとしてマークし、クリーンなretryポイントでのみ新しいmodelへ再起動します。
- すでにtool activityまたはreply出力が始まっている場合、そのpending切り替えは、後のretry機会または次のユーザーターンまで待機し続けることがあります。
- **Fast path:** allowlist済み送信者からのコマンド専用メッセージは即座に処理されます（queue + modelをバイパス）。
- **Group mention gating:** allowlist済み送信者からのコマンド専用メッセージはメンション要件をバイパスします。
- **インラインショートカット（allowlist済み送信者のみ）:** 一部コマンドは通常メッセージに埋め込まれていても動作し、残りのテキストをモデルが見る前に取り除かれます。
  - 例: `hey /status`はstatus返信を発生させ、残りのテキストは通常フローを継続します。
- 現在対象: `/help`, `/commands`, `/status`, `/whoami`（`/id`）。
- 認可されていないコマンド専用メッセージは黙って無視され、インラインの`/...`トークンは通常のテキストとして扱われます。
- **skillコマンド:** `user-invocable`なskillはスラッシュコマンドとして公開されます。名前は`a-z0-9_`へサニタイズされ（最大32文字）、衝突した場合は数字サフィックスが付きます（例: `_2`）。
  - `/skill <name> [input]`は、名前でskillを実行します（ネイティブコマンド上限によりskillごとのコマンドが作れない場合に有用）。
  - デフォルトでは、skillコマンドは通常のリクエストとしてモデルへ転送されます。
  - skillは任意で`command-dispatch: tool`を宣言でき、その場合コマンドはtoolへ直接ルーティングされます（決定的、モデルなし）。
  - 例: `/prose`（OpenProse Plugin）— [OpenProse](/ja-JP/prose)を参照。
- **ネイティブコマンド引数:** Discordは動的オプションにautocompleteを使用します（必須引数を省略した場合はボタンメニューも使用）。TelegramとSlackでは、コマンドが選択肢をサポートしていて引数を省略すると、ボタンメニューが表示されます。

## `/tools`

`/tools`が答えるのは設定の質問ではなく、ランタイムの質問です。つまり、**この会話でこのエージェントが今使えるものは何か**です。

- デフォルトの`/tools`は簡潔で、すばやく確認できるよう最適化されています。
- `/tools verbose`は短い説明を追加します。
- 引数をサポートするネイティブコマンドサーフェスでは、同じ`compact|verbose`モード切り替えが公開されます。
- 結果はセッションスコープなので、エージェント、チャネル、thread、送信者認可、またはmodelが変わると、出力も変わることがあります。
- `/tools`には、core tool、接続されたPlugin tool、チャネル所有toolを含め、ランタイムで実際に到達可能なtoolが含まれます。

プロファイルや上書きの編集には、`/tools`を静的カタログとして扱うのではなく、Control UIのToolsパネルまたは設定/カタログサーフェスを使用してください。

## usageサーフェス（どこに何が表示されるか）

- **Provider usage/quota**（例: 「Claude 80% left」）は、usage追跡が有効な場合、現在のmodel providerについて`/status`に表示されます。OpenClawはprovider windowを`% left`へ正規化します。MiniMaxでは、remaining-only percentフィールドは表示前に反転され、`model_remains`レスポンスではchat-modelエントリが優先され、modelタグ付きplan labelが付与されます。
- `/status`内の**token/cache行**は、ライブセッションスナップショットが乏しい場合、最新のtranscript usageエントリへフォールバックできます。既存の非ゼロのライブ値は引き続き優先され、transcriptフォールバックは、保存済みtotalが存在しないか小さすぎる場合に、アクティブなランタイムmodel labelと、より大きいprompt指向のtotalも復元できます。
- **応答ごとのtoken/cost**は`/usage off|tokens|full`で制御されます（通常返信に追記されます）。
- `/model status`は**models/auth/endpoints**に関するものであり、usageではありません。

## モデル選択（`/model`）

`/model`はdirectiveとして実装されています。

例:

```
/model
/model list
/model 3
/model openai/gpt-5.4
/model opus@anthropic:default
/model status
```

注記:

- `/model`および`/model list`は、簡潔な番号付きpicker（model family + 利用可能provider）を表示します。
- Discordでは、`/model`と`/models`はproviderおよびmodelのdropdownとSubmitステップを持つインタラクティブpickerを開きます。
- `/model <#>`はそのpickerから選択します（可能な場合は現在のproviderを優先）。
- `/model status`は、設定済みprovider endpoint（`baseUrl`）とAPI mode（`api`）を含む詳細ビューを表示します。

## デバッグ上書き

`/debug`では**ランタイム専用**の設定上書き（ディスクではなくメモリ）を設定できます。owner専用。デフォルトでは無効で、`commands.debug: true`で有効化します。

例:

```
/debug show
/debug set messages.responsePrefix="[openclaw]"
/debug set channels.whatsapp.allowFrom=["+1555","+4477"]
/debug unset messages.responsePrefix
/debug reset
```

注記:

- 上書きは新しい設定読み取りに即座に適用されますが、`openclaw.json`には書き込みません。
- すべての上書きをクリアしてディスク上設定へ戻すには`/debug reset`を使用します。

## Plugin trace出力

`/trace`では、完全なverboseモードを有効にせずに、**セッションスコープのPlugin trace/debug行**を切り替えられます。

例:

```text
/trace
/trace on
/trace off
```

注記:

- 引数なしの`/trace`は現在のセッションtrace状態を表示します。
- `/trace on`は現在のセッションでPlugin trace行を有効にします。
- `/trace off`はそれを再び無効にします。
- Plugin trace行は`/status`内や、通常のassistant返信後のフォローアップdiagnosticメッセージとして表示される場合があります。
- `/trace`は`/debug`の代替ではありません。`/debug`は引き続きランタイム専用設定上書きを管理します。
- `/trace`は`/verbose`の代替でもありません。通常のverboseなtool/status出力は引き続き`/verbose`の領域です。

## 設定更新

`/config`はディスク上の設定（`openclaw.json`）へ書き込みます。owner専用。デフォルトでは無効で、`commands.config: true`で有効化します。

例:

```
/config show
/config show messages.responsePrefix
/config get messages.responsePrefix
/config set messages.responsePrefix="[openclaw]"
/config unset messages.responsePrefix
```

注記:

- 設定は書き込み前に検証され、無効な変更は拒否されます。
- `/config`の更新は再起動後も保持されます。

## MCP更新

`/mcp`は、`mcp.servers`配下のOpenClaw管理MCP server定義を書き込みます。owner専用。デフォルトでは無効で、`commands.mcp: true`で有効化します。

例:

```text
/mcp show
/mcp show context7
/mcp set context7={"command":"uvx","args":["context7-mcp"]}
/mcp unset context7
```

注記:

- `/mcp`は、Pi所有のproject設定ではなく、OpenClaw設定に保存します。
- どのtransportが実際に実行可能かはruntime adapterが決定します。

## Plugin更新

`/plugins`では、operatorが検出済みPluginを調べ、設定内で有効/無効を切り替えられます。読み取り専用フローではエイリアスとして`/plugin`を使用できます。デフォルトでは無効で、`commands.plugins: true`で有効化します。

例:

```text
/plugins
/plugins list
/plugin show context7
/plugins enable context7
/plugins disable context7
```

注記:

- `/plugins list`と`/plugins show`は、現在のworkspaceとディスク上設定に対する実際のPlugin検出を使用します。
- `/plugins enable|disable`はPlugin設定のみを更新し、Pluginのinstallやuninstallは行いません。
- enable/disable変更の適用には、gatewayを再起動してください。

## サーフェス注記

- **テキストコマンド**は通常のチャットセッションで実行されます（DMは`main`を共有し、グループは独自セッションを持ちます）。
- **ネイティブコマンド**は分離セッションを使用します:
  - Discord: `agent:<agentId>:discord:slash:<userId>`
  - Slack: `agent:<agentId>:slack:slash:<userId>`（prefixは`channels.slack.slashCommand.sessionPrefix`で設定可能）
  - Telegram: `telegram:slash:<userId>`（`CommandTargetSessionKey`経由でチャットセッションをターゲットにする）
- **`/stop`**は、現在の実行を中止できるよう、アクティブなチャットセッションを対象にします。
- **Slack:** `channels.slack.slashCommand`は、単一の`/openclaw`形式コマンド向けに引き続きサポートされています。`commands.native`を有効にする場合は、組み込みコマンドごとに1つのSlackスラッシュコマンドを作成する必要があります（名前は`/help`と同じ）。Slack向けコマンド引数メニューは、ephemeralなBlock Kitボタンとして配信されます。
  - Slackネイティブ例外: Slackは`/status`を予約しているため、`/agentstatus`を登録してください（`/status`ではありません）。テキストの`/status`はSlackメッセージ内でも引き続き動作します。

## BTW補足質問

`/btw`は、現在のセッションに関する素早い**補足質問**です。

通常チャットと異なり、次の特徴があります。

- 現在のセッションを背景コンテキストとして使う
- 別個の**toolなし**ワンショット呼び出しとして実行される
- 将来のセッションコンテキストを変更しない
- transcript履歴には書き込まれない
- 通常のassistantメッセージではなく、ライブの補足結果として配信される

そのため、メイン
タスクを進めたまま一時的な確認をしたいときに`/btw`は便利です。

例:

```text
/btw what are we doing right now?
```

完全な動作とclient UXの
詳細については[BTW Side Questions](/ja-JP/tools/btw)を参照してください。
