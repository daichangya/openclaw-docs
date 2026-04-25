---
read_when:
    - チャットコマンドを使う、または設定する
    - コマンドルーティングまたは権限をデバッグする
summary: 'スラッシュコマンド: テキスト形式とネイティブ形式、config、サポートされるコマンド'
title: スラッシュコマンド
x-i18n:
    generated_at: "2026-04-25T14:01:41Z"
    model: gpt-5.4
    provider: openai
    source_hash: b95f33df9a05bd74855695c29b5c449af7a73714596932be5ce923a1ddab8ee7
    source_path: tools/slash-commands.md
    workflow: 15
---

コマンドは Gateway によって処理されます。ほとんどのコマンドは、`/` で始まる**単独の**メッセージとして送る必要があります。
ホスト専用の bash チャットコマンドは `! <cmd>` を使います（`/bash <cmd>` はそのエイリアスです）。

関連するシステムは 2 つあります。

- **コマンド**: 単独の `/...` メッセージ。
- **ディレクティブ**: `/think`, `/fast`, `/verbose`, `/trace`, `/reasoning`, `/elevated`, `/exec`, `/model`, `/queue`。
  - ディレクティブは、model がメッセージを見る前に取り除かれます。
  - 通常のチャットメッセージ内では（ディレクティブのみではない場合）、それらは「インラインヒント」として扱われ、セッション設定は永続化されません。
  - ディレクティブのみのメッセージでは（メッセージがディレクティブだけを含む場合）、それらはセッションに永続化され、確認応答が返されます。
  - ディレクティブは**認可された送信者**に対してのみ適用されます。`commands.allowFrom` が設定されている場合、それが使われる唯一の
    allowlist です。そうでない場合、認可はチャネル allowlist/pairing と `commands.useAccessGroups` から得られます。
    認可されていない送信者では、ディレクティブはプレーンテキストとして扱われます。

さらに、いくつかの**インラインショートカット**もあります（allowlist 済み/認可済み送信者のみ）: `/help`, `/commands`, `/status`, `/whoami` (`/id`)。
これらは即座に実行され、model がメッセージを見る前に取り除かれ、残りのテキストは通常フローを続行します。

## config

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

- `commands.text`（デフォルト `true`）は、チャットメッセージ内の `/...` 解析を有効にします。
  - ネイティブコマンドのない画面（WhatsApp/WebChat/Signal/iMessage/Google Chat/Microsoft Teams）では、これを `false` に設定してもテキストコマンドは引き続き動作します。
- `commands.native`（デフォルト `"auto"`）は、ネイティブコマンドを登録します。
  - Auto: Discord/Telegram ではオン、Slack ではオフ（スラッシュコマンドを追加するまで）、ネイティブサポートのない provider では無視されます。
  - provider ごとの上書きには `channels.discord.commands.native`、`channels.telegram.commands.native`、`channels.slack.commands.native` を設定してください（bool または `"auto"`）。
  - `false` は、起動時に Discord/Telegram で以前登録されたコマンドをクリアします。Slack コマンドは Slack アプリ側で管理され、自動削除はされません。
- `commands.nativeSkills`（デフォルト `"auto"`）は、サポートされる場合に **Skill** コマンドをネイティブ登録します。
  - Auto: Discord/Telegram ではオン、Slack ではオフ（Slack では Skill ごとにスラッシュコマンド作成が必要）。
  - provider ごとの上書きには `channels.discord.commands.nativeSkills`、`channels.telegram.commands.nativeSkills`、`channels.slack.commands.nativeSkills` を設定してください（bool または `"auto"`）。
- `commands.bash`（デフォルト `false`）は、`! <cmd>` によるホスト shell コマンド実行を有効にします（`/bash <cmd>` はエイリアス。`tools.elevated` allowlist が必要）。
- `commands.bashForegroundMs`（デフォルト `2000`）は、bash がバックグラウンドモードに切り替わるまで待つ時間を制御します（`0` なら即座にバックグラウンド化）。
- `commands.config`（デフォルト `false`）は `/config` を有効にします（`openclaw.json` の読み書き）。
- `commands.mcp`（デフォルト `false`）は `/mcp` を有効にします（`mcp.servers` 配下の OpenClaw 管理 MCP config の読み書き）。
- `commands.plugins`（デフォルト `false`）は `/plugins` を有効にします（Plugin 検出/状態に加え、install + enable/disable 操作）。
- `commands.debug`（デフォルト `false`）は `/debug` を有効にします（ランタイム専用上書き）。
- `commands.restart`（デフォルト `true`）は `/restart` と gateway 再起動ツールアクションを有効にします。
- `commands.ownerAllowFrom`（任意）は、owner 専用コマンド/ツール画面に対する明示的 owner allowlist を設定します。これは `commands.allowFrom` とは別です。
- チャネルごとの `channels.<channel>.commands.enforceOwnerForCommands`（任意、デフォルト `false`）は、その画面上で owner 専用コマンドが実行される際に**owner identity** を要求します。`true` の場合、送信者は解決済み owner 候補（たとえば `commands.ownerAllowFrom` のエントリや provider ネイティブ owner metadata）に一致するか、内部メッセージチャネル上で内部 `operator.admin` scope を持つ必要があります。チャネル `allowFrom` のワイルドカードエントリ、または空/未解決の owner 候補一覧では**不十分**です。owner 専用コマンドはそのチャネルで fail closed します。owner 専用コマンドを `ownerAllowFrom` と標準コマンド allowlist のみで制御したい場合は、これをオフのままにしてください。
- `commands.ownerDisplay` は、system prompt 内での owner id の表示方法を制御します: `raw` または `hash`。
- `commands.ownerDisplaySecret` は、`commands.ownerDisplay="hash"` のときに使う HMAC secret を任意で設定します。
- `commands.allowFrom`（任意）は、コマンド認可のための provider ごとの allowlist を設定します。これが設定されている場合、
  コマンドとディレクティブの認可元として使われるのはこれだけです（チャネル allowlist/pairing と `commands.useAccessGroups`
  は無視されます）。グローバルデフォルトには `"*"` を使ってください。provider 固有キーがそれを上書きします。
- `commands.useAccessGroups`（デフォルト `true`）は、`commands.allowFrom` が未設定の場合にコマンドの allowlist/policy を強制します。

## コマンド一覧

現在の source-of-truth:

- core 組み込みは `src/auto-reply/commands-registry.shared.ts` 由来
- 生成される dock コマンドは `src/auto-reply/commands-registry.data.ts` 由来
- Plugin コマンドは Plugin の `registerCommand()` 呼び出し由来
- gateway 上での実際の利用可否は、引き続き config フラグ、チャネル画面、インストール済み/有効化済み Plugin に依存します

### core 組み込みコマンド

現在利用可能な組み込みコマンド:

- `/new [model]` は新しいセッションを開始します。`/reset` は reset のエイリアスです。
- `/reset soft [message]` は現在の transcript を保持し、再利用されている CLI backend session id を破棄し、その場で startup/system-prompt 読み込みを再実行します。
- `/compact [instructions]` はセッションコンテキストを Compaction します。[/concepts/compaction](/ja-JP/concepts/compaction) を参照してください。
- `/stop` は現在の実行を abort します。
- `/session idle <duration|off>` と `/session max-age <duration|off>` は thread-binding の期限切れを管理します。
- `/think <level>` は thinking レベルを設定します。選択肢はアクティブ model の provider profile に依存します。一般的なレベルは `off`、`minimal`、`low`、`medium`、`high` で、`xhigh`、`adaptive`、`max`、またはバイナリ `on` のようなカスタムレベルはサポートされる場合のみ利用できます。エイリアス: `/thinking`, `/t`。
- `/verbose on|off|full` は verbose 出力を切り替えます。エイリアス: `/v`。
- `/trace on|off` は現在のセッションの Plugin trace 出力を切り替えます。
- `/fast [status|on|off]` は fast mode を表示または設定します。
- `/reasoning [on|off|stream]` は reasoning 可視性を切り替えます。エイリアス: `/reason`。
- `/elevated [on|off|ask|full]` は elevated mode を切り替えます。エイリアス: `/elev`。
- `/exec host=<auto|sandbox|gateway|node> security=<deny|allowlist|full> ask=<off|on-miss|always> node=<id>` は exec デフォルトを表示または設定します。
- `/model [name|#|status]` は model を表示または設定します。
- `/models [provider] [page] [limit=<n>|size=<n>|all]` は provider または特定 provider の model を一覧表示します。
- `/queue <mode>` は queue 動作（`steer`、`interrupt`、`followup`、`collect`、`steer-backlog`）と、`debounce:2s cap:25 drop:summarize` のようなオプションを管理します。
- `/help` は短い help 要約を表示します。
- `/commands` は生成されたコマンドカタログを表示します。
- `/tools [compact|verbose]` は、現在の agent が今すぐ使えるものを表示します。
- `/status` は実行/ランタイム状態を表示します。利用可能な場合は `Execution`/`Runtime` ラベルと provider の使用量/クォータも含まれます。
- `/crestodian <request>` は owner DM から Crestodian のセットアップおよび修復ヘルパーを実行します。
- `/tasks` は現在のセッションのアクティブ/最近のバックグラウンドタスクを一覧表示します。
- `/context [list|detail|json]` はコンテキストがどのように組み立てられるかを説明します。
- `/export-session [path]` は現在のセッションを HTML にエクスポートします。エイリアス: `/export`。
- `/export-trajectory [path]` は現在のセッション用の JSONL [trajectory bundle](/ja-JP/tools/trajectory) をエクスポートします。エイリアス: `/trajectory`。
- `/whoami` はあなたの sender id を表示します。エイリアス: `/id`。
- `/skill <name> [input]` は Skill を名前で実行します。
- `/allowlist [list|add|remove] ...` は allowlist エントリを管理します。テキスト専用。
- `/approve <id> <decision>` は exec 承認プロンプトを解決します。
- `/btw <question>` は将来のセッションコンテキストを変更せずに横道の質問をします。[/tools/btw](/ja-JP/tools/btw) を参照してください。
- `/subagents list|kill|log|info|send|steer|spawn` は現在のセッションの sub-agent 実行を管理します。
- `/acp spawn|cancel|steer|close|sessions|status|set-mode|set|cwd|permissions|timeout|model|reset-options|doctor|install|help` は ACP セッションとランタイムオプションを管理します。
- `/focus <target>` は、現在の Discord thread または Telegram topic/conversation をセッションターゲットに bind します。
- `/unfocus` は現在の binding を解除します。
- `/agents` は現在のセッションに thread-bind された agent を一覧表示します。
- `/kill <id|#|all>` は実行中の sub-agent を 1 つまたはすべて abort します。
- `/steer <id|#> <message>` は実行中の sub-agent に steering を送ります。エイリアス: `/tell`。
- `/config show|get|set|unset` は `openclaw.json` を読み書きします。owner 専用。`commands.config: true` が必要です。
- `/mcp show|get|set|unset` は `mcp.servers` 配下の OpenClaw 管理 MCP server config を読み書きします。owner 専用。`commands.mcp: true` が必要です。
- `/plugins list|inspect|show|get|install|enable|disable` は Plugin 状態を調査または変更します。`/plugin` はエイリアスです。書き込みは owner 専用。`commands.plugins: true` が必要です。
- `/debug show|set|unset|reset` はランタイム専用 config 上書きを管理します。owner 専用。`commands.debug: true` が必要です。
- `/usage off|tokens|full|cost` はレスポンスごとの usage footer を制御するか、ローカル cost 要約を表示します。
- `/tts on|off|status|provider|limit|summary|audio|help` は TTS を制御します。[/tools/tts](/ja-JP/tools/tts) を参照してください。
- `/restart` は有効時に OpenClaw を再起動します。デフォルト: 有効。無効にするには `commands.restart: false` を設定してください。
- `/activation mention|always` は group activation mode を設定します。
- `/send on|off|inherit` は send policy を設定します。owner 専用。
- `/bash <command>` はホスト shell コマンドを実行します。テキスト専用。エイリアス: `! <command>`。`commands.bash: true` と `tools.elevated` allowlist が必要です。
- `!poll [sessionId]` はバックグラウンド bash job を確認します。
- `!stop [sessionId]` はバックグラウンド bash job を停止します。

### 生成される dock コマンド

Dock コマンドは、ネイティブコマンドをサポートする channel Plugin から生成されます。現在のバンドル済みセット:

- `/dock-discord`（エイリアス: `/dock_discord`）
- `/dock-mattermost`（エイリアス: `/dock_mattermost`）
- `/dock-slack`（エイリアス: `/dock_slack`）
- `/dock-telegram`（エイリアス: `/dock_telegram`）

### バンドル済み Plugin コマンド

バンドル済み Plugin は追加のスラッシュコマンドを加えられます。この repo の現在のバンドル済みコマンド:

- `/dreaming [on|off|status|help]` は memory Dreaming を切り替えます。[Dreaming](/ja-JP/concepts/dreaming) を参照してください。
- `/pair [qr|status|pending|approve|cleanup|notify]` はデバイス pairing/setup フローを管理します。[Pairing](/ja-JP/channels/pairing) を参照してください。
- `/phone status|arm <camera|screen|writes|all> [duration]|disarm` は高リスクな phone node コマンドを一時的に arm します。
- `/voice status|list [limit]|set <voiceId|name>` は Talk voice config を管理します。Discord ではネイティブコマンド名は `/talkvoice` です。
- `/card ...` は LINE rich card preset を送信します。[LINE](/ja-JP/channels/line) を参照してください。
- `/codex status|models|threads|resume|compact|review|account|mcp|skills` は、バンドルされた Codex app-server ハーネスを調査・制御します。[Codex Harness](/ja-JP/plugins/codex-harness) を参照してください。
- QQBot 専用コマンド:
  - `/bot-ping`
  - `/bot-version`
  - `/bot-help`
  - `/bot-upgrade`
  - `/bot-logs`

### 動的 Skill コマンド

ユーザーが呼び出せる Skills もスラッシュコマンドとして公開されます。

- `/skill <name> [input]` は常に汎用のエントリポイントとして動作します。
- Skill/Plugin が登録している場合、Skills は `/prose` のような直接コマンドとして表示されることもあります。
- ネイティブ Skill コマンド登録は `commands.nativeSkills` と `channels.<provider>.commands.nativeSkills` で制御されます。

注意:

- コマンドは、コマンドと引数の間に任意で `:` を受け付けます（例: `/think: high`、`/send: on`、`/help:`）。
- `/new <model>` は model alias、`provider/model`、または provider 名（曖昧一致）を受け付けます。どれにも一致しない場合、そのテキストは message body として扱われます。
- 完全な provider 使用量の内訳には `openclaw status --usage` を使ってください。
- `/allowlist add|remove` には `commands.config=true` が必要で、チャネルの `configWrites` を尊重します。
- マルチアカウントチャネルでは、config を対象にした `/allowlist --account <id>` と `/config set channels.<provider>.accounts.<id>...` も対象アカウントの `configWrites` を尊重します。
- `/usage` はレスポンスごとの usage footer を制御します。`/usage cost` は OpenClaw セッションログからローカル cost 要約を表示します。
- `/restart` はデフォルトで有効です。無効にするには `commands.restart: false` を設定してください。
- `/plugins install <spec>` は `openclaw plugins install` と同じ Plugin spec を受け付けます: ローカル path/archive、npm package、または `clawhub:<pkg>`。
- `/plugins enable|disable` は Plugin config を更新し、再起動を求めることがあります。
- Discord 専用ネイティブコマンド: `/vc join|leave|status` は voice channel を制御します（テキストでは利用不可）。`join` には guild と、選択済みの voice/stage channel が必要です。`channels.discord.voice` とネイティブコマンドが必要です。
- Discord の thread-binding コマンド（`/focus`、`/unfocus`、`/agents`、`/session idle`、`/session max-age`）には、有効な thread binding が有効になっている必要があります（`session.threadBindings.enabled` および/または `channels.discord.threadBindings.enabled`）。
- ACP コマンドリファレンスとランタイム動作: [ACP Agents](/ja-JP/tools/acp-agents)。
- `/verbose` はデバッグと追加可視化向けです。通常利用では **off** のままにしてください。
- `/trace` は `/verbose` より狭い機能です。Plugin 所有の trace/debug 行だけを表示し、通常の verbose な tool chatter は表示しません。
- `/fast on|off` はセッション上書きを永続化します。これを解除して config デフォルトに戻すには Sessions UI の `inherit` オプションを使ってください。
- `/fast` は provider 固有です。OpenAI/OpenAI Codex ではネイティブ Responses endpoint 上の `service_tier=priority` にマップされ、直接の公開 Anthropic リクエスト（`api.anthropic.com` に送られる OAuth 認証トラフィックを含む）では `service_tier=auto` または `standard_only` にマップされます。[OpenAI](/ja-JP/providers/openai) と [Anthropic](/ja-JP/providers/anthropic) を参照してください。
- ツール失敗要約は relevant な場合に引き続き表示されますが、詳細な失敗テキストは `/verbose` が `on` または `full` のときにのみ含まれます。
- `/reasoning`、`/verbose`、`/trace` は group 設定では危険です。意図せず内部 reasoning、tool 出力、または Plugin 診断を露出する可能性があります。特に group chat では、オフのままにしておくことを推奨します。
- `/model` は新しいセッション model を即座に永続化します。
- agent が idle なら、次の実行ですぐに使われます。
- すでに実行がアクティブな場合、OpenClaw は live switch を pending としてマークし、クリーンな retry point でのみ新しい model に再起動します。
- tool 活動や reply 出力がすでに始まっている場合、その pending switch は後の retry 機会または次の user turn まで queued のままになることがあります。
- ローカル TUI では、`/crestodian [request]` は通常の agent TUI から
  Crestodian に戻ります。これは message-channel rescue mode とは別であり、
  リモート config 権限を付与するものではありません。
- **Fast path:** allowlist 済み送信者からのコマンドのみのメッセージは即座に処理されます（queue + model をバイパス）。
- **Group mention gating:** allowlist 済み送信者からのコマンドのみのメッセージはメンション要件をバイパスします。
- **インラインショートカット（allowlist 済み送信者のみ）:** 一部コマンドは通常メッセージに埋め込んでも動作し、model が残りのテキストを見る前に取り除かれます。
  - 例: `hey /status` は status 返信を発生させ、残りのテキストは通常フローを続行します。
- 現在: `/help`、`/commands`、`/status`、`/whoami`（`/id`）。
- 未認可のコマンドのみメッセージは黙って無視され、インライン `/...` トークンはプレーンテキストとして扱われます。
- **Skill コマンド:** `user-invocable` な Skills はスラッシュコマンドとして公開されます。名前は `a-z0-9_` にサニタイズされ（最大 32 文字）、衝突時は数値サフィックスが付きます（例: `_2`）。
  - `/skill <name> [input]` は Skill を名前で実行します（ネイティブコマンド制限により Skill ごとのコマンドを作れない場合に便利です）。
  - デフォルトでは、Skill コマンドは通常のリクエストとして model に転送されます。
  - Skills は任意で `command-dispatch: tool` を宣言でき、コマンドを tool に直接ルーティングできます（決定的で、model を使わない）。
  - 例: `/prose`（OpenProse Plugin）— [OpenProse](/ja-JP/prose) を参照してください。
- **ネイティブコマンド引数:** Discord は動的オプションに autocomplete を使います（必要引数を省略した場合は button menu も使います）。Telegram と Slack は、コマンドが選択肢をサポートしていて引数を省略した場合に button menu を表示します。動的選択肢は対象セッション model に対して解決されるため、`/think` レベルのような model 固有オプションは、そのセッションの `/model` 上書きに従います。

## `/tools`

`/tools` は config に関する質問ではなく、ランタイムの質問に答えます: **この会話で、この agent が今すぐ使えるものは何か**。

- デフォルトの `/tools` は簡潔で、素早く見渡せるよう最適化されています。
- `/tools verbose` は短い説明を追加します。
- 引数をサポートするネイティブコマンド画面では、同じ mode 切り替え `compact|verbose` が公開されます。
- 結果はセッション単位なので、agent、channel、thread、sender の認可、または model を変えると出力も変わることがあります。
- `/tools` には、runtime で実際に到達可能なツールが含まれます。core ツール、接続された Plugin ツール、チャネル所有ツールを含みます。

profile や上書きの編集には、`/tools` を静的 catalog とみなすのではなく、Control UI Tools パネルや config/catalog 画面を使ってください。

## Usage 画面（どこに何が表示されるか）

- **provider 使用量/クォータ**（例: 「Claude 80% left」）は、usage tracking が有効な場合、現在の model provider に対して `/status` に表示されます。OpenClaw は provider window を `% left` に正規化します。MiniMax では remaining-only の percent フィールドは表示前に反転され、`model_remains` レスポンスは model-tagged plan label を伴う chat-model エントリを優先します。
- `/status` 内の **token/cache 行** は、ライブセッションスナップショットが疎な場合、最新の transcript usage エントリにフォールバックできます。既存の非ゼロ live 値が依然として優先され、保存済み合計が欠落しているか小さい場合には、transcript フォールバックによってアクティブ runtime model label とより大きな prompt 指向 total も回復できます。
- **Execution と runtime:** `/status` は、有効な sandbox 経路に対して `Execution` を、実際にセッションを実行している主体に対して `Runtime` を報告します: `OpenClaw Pi Default`、`OpenAI Codex`、CLI backend、または ACP backend。
- **レスポンスごとの token/cost** は `/usage off|tokens|full` で制御されます（通常返信に追加されます）。
- `/model status` は usage ではなく **models/auth/endpoints** に関するものです。

## model 選択（`/model`）

`/model` はディレクティブとして実装されています。

例:

```
/model
/model list
/model 3
/model openai/gpt-5.4
/model opus@anthropic:default
/model status
```

注意:

- `/model` と `/model list` は、コンパクトな番号付き picker（model family + 利用可能 provider）を表示します。
- Discord では、`/model` と `/models` は provider と model の dropdown に Submit ステップを加えたインタラクティブ picker を開きます。
- `/model <#>` はその picker から選択します（可能なら現在の provider を優先）。
- `/model status` は詳細表示を示し、利用可能なら設定済み provider endpoint（`baseUrl`）と API mode（`api`）も含みます。

## Debug 上書き

`/debug` を使うと、**ランタイム専用** config 上書き（ディスクではなくメモリ）を設定できます。owner 専用。デフォルトでは無効で、有効にするには `commands.debug: true` を設定してください。

例:

```
/debug show
/debug set messages.responsePrefix="[openclaw]"
/debug set channels.whatsapp.allowFrom=["+1555","+4477"]
/debug unset messages.responsePrefix
/debug reset
```

注意:

- 上書きは新しい config 読み取りに即座に適用されますが、`openclaw.json` には書き込みません。
- すべての上書きをクリアしてディスク上の config に戻るには `/debug reset` を使ってください。

## Plugin trace 出力

`/trace` を使うと、完全な verbose mode を有効にせずに、**セッション単位の Plugin trace/debug 行** を切り替えられます。

例:

```text
/trace
/trace on
/trace off
```

注意:

- 引数なしの `/trace` は、現在のセッション trace 状態を表示します。
- `/trace on` は、現在のセッションで Plugin trace 行を有効にします。
- `/trace off` は、それを再び無効にします。
- Plugin trace 行は `/status` として現れたり、通常の assistant reply の後の follow-up 診断メッセージとして現れたりすることがあります。
- `/trace` は `/debug` の代替ではありません。ランタイム専用 config 上書きの管理は引き続き `/debug` が担います。
- `/trace` は `/verbose` の代替でもありません。通常の verbose な tool/status 出力は引き続き `/verbose` に属します。

## config 更新

`/config` はディスク上の config（`openclaw.json`）に書き込みます。owner 専用。デフォルトでは無効で、有効にするには `commands.config: true` を設定してください。

例:

```
/config show
/config show messages.responsePrefix
/config get messages.responsePrefix
/config set messages.responsePrefix="[openclaw]"
/config unset messages.responsePrefix
```

注意:

- config は書き込み前に検証されます。無効な変更は拒否されます。
- `/config` の更新は再起動後も永続化されます。

## MCP 更新

`/mcp` は、`mcp.servers` 配下の OpenClaw 管理 MCP server 定義に書き込みます。owner 専用。デフォルトでは無効で、有効にするには `commands.mcp: true` を設定してください。

例:

```text
/mcp show
/mcp show context7
/mcp set context7={"command":"uvx","args":["context7-mcp"]}
/mcp unset context7
```

注意:

- `/mcp` は Pi 所有の project 設定ではなく、OpenClaw config に保存します。
- 実際にどの transport が実行可能かは runtime adapter が決定します。

## Plugin 更新

`/plugins` を使うと、operator は検出された Plugin を調査し、config 内で有効化を切り替えられます。読み取り専用フローでは `/plugin` をエイリアスとして使えます。デフォルトでは無効で、有効にするには `commands.plugins: true` を設定してください。

例:

```text
/plugins
/plugins list
/plugin show context7
/plugins enable context7
/plugins disable context7
```

注意:

- `/plugins list` と `/plugins show` は、現在の workspace とディスク上 config に対して実際の Plugin 検出を使います。
- `/plugins enable|disable` は Plugin config だけを更新します。Plugin の install や uninstall はしません。
- enable/disable の変更後は、反映のために gateway を再起動してください。

## 画面に関する注意

- **テキストコマンド** は通常のチャットセッションで実行されます（DM は `main` を共有し、group は独自のセッションを持ちます）。
- **ネイティブコマンド** は分離されたセッションを使います:
  - Discord: `agent:<agentId>:discord:slash:<userId>`
  - Slack: `agent:<agentId>:slack:slash:<userId>`（接頭辞は `channels.slack.slashCommand.sessionPrefix` で設定可能）
  - Telegram: `telegram:slash:<userId>`（`CommandTargetSessionKey` を通じて chat セッションを対象にします）
- **`/stop`** はアクティブな chat セッションを対象にするため、現在の実行を abort できます。
- **Slack:** `channels.slack.slashCommand` は、単一の `/openclaw` 形式コマンド向けに引き続きサポートされています。`commands.native` を有効にする場合、組み込みコマンドごとに 1 つずつ Slack スラッシュコマンドを作成する必要があります（名前は `/help` などと同じ）。Slack のコマンド引数メニューは ephemeral Block Kit button として配信されます。
  - Slack ネイティブ例外: Slack は `/status` を予約しているため、`/status` ではなく `/agentstatus` を登録してください。テキストの `/status` は Slack メッセージ内で引き続き動作します。

## BTW 横道質問

`/btw` は、現在のセッションに対する素早い **横道質問** です。

通常チャットと異なり:

- 現在のセッションを背景コンテキストとして使います
- 独立した **tool-less** な one-shot 呼び出しとして実行されます
- 将来のセッションコンテキストは変更しません
- transcript 履歴には書き込まれません
- 通常の assistant メッセージではなく、ライブな side result として配信されます

これにより `/btw` は、メインタスクを継続したまま一時的な確認をしたいときに便利です。

例:

```text
/btw what are we doing right now?
```

完全な動作と client UX
詳細については [BTW Side Questions](/ja-JP/tools/btw) を参照してください。

## 関連

- [Skills](/ja-JP/tools/skills)
- [Skills config](/ja-JP/tools/skills-config)
- [Creating skills](/ja-JP/tools/creating-skills)
