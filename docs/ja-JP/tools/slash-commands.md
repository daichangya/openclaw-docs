---
read_when:
    - チャットコマンドを使う、または設定するとき
    - コマンドのルーティングや権限をデバッグするとき
summary: 'スラッシュコマンド: テキストとネイティブ、config、対応コマンド'
title: スラッシュコマンド
x-i18n:
    generated_at: "2026-04-05T13:01:48Z"
    model: gpt-5.4
    provider: openai
    source_hash: 8c91437140732d9accca1094f07b9e05f861a75ac344531aa24cc2ffe000630f
    source_path: tools/slash-commands.md
    workflow: 15
---

# スラッシュコマンド

コマンドは Gateway によって処理されます。ほとんどのコマンドは、`/` で始まる**単独の**メッセージとして送信する必要があります。
ホスト専用の bash チャットコマンドは `! <cmd>` を使います（`/bash <cmd>` はそのエイリアスです）。

関連する仕組みは 2 つあります。

- **コマンド**: 単独の `/...` メッセージ。
- **ディレクティブ**: `/think`, `/fast`, `/verbose`, `/reasoning`, `/elevated`, `/exec`, `/model`, `/queue`。
  - ディレクティブは、モデルがメッセージを見る前に取り除かれます。
  - 通常のチャットメッセージ内では（ディレクティブだけのメッセージではない場合）、これらは「インラインヒント」として扱われ、セッション設定は保持されません。
  - ディレクティブだけのメッセージでは（メッセージがディレクティブだけを含む場合）、セッションに保持され、確認応答が返されます。
  - ディレクティブは**認可された送信者**に対してのみ適用されます。`commands.allowFrom` が設定されている場合、それが使われる唯一の許可リストです。それ以外の場合、認可はチャンネルの許可リスト/ペアリングと `commands.useAccessGroups` によって決まります。認可されていない送信者には、ディレクティブは平文として扱われます。

さらに、いくつかの**インラインショートカット**もあります（許可リストに載っている/認可された送信者のみ）: `/help`, `/commands`, `/status`, `/whoami` (`/id`)。
これらは即座に実行され、モデルがメッセージを見る前に取り除かれ、残りのテキストは通常のフローを継続します。

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
    restart: false,
    allowFrom: {
      "*": ["user1"],
      discord: ["user:123"],
    },
    useAccessGroups: true,
  },
}
```

- `commands.text`（デフォルト `true`）は、チャットメッセージ内での `/...` 解析を有効にします。
  - ネイティブコマンドのない画面（WhatsApp/WebChat/Signal/iMessage/Google Chat/Microsoft Teams）では、これを `false` に設定してもテキストコマンドは引き続き動作します。
- `commands.native`（デフォルト `"auto"`）は、ネイティブコマンドを登録します。
  - Auto: Discord/Telegram ではオン、Slack ではオフ（スラッシュコマンドを追加するまで）、ネイティブ対応のないプロバイダーでは無視されます。
  - プロバイダーごとに上書きするには `channels.discord.commands.native`、`channels.telegram.commands.native`、または `channels.slack.commands.native` を設定します（bool または `"auto"`）。
  - `false` を設定すると、Discord/Telegram では起動時に以前登録されたコマンドを削除します。Slack のコマンドは Slack app 側で管理され、自動では削除されません。
- `commands.nativeSkills`（デフォルト `"auto"`）は、対応している場合に **skill** コマンドをネイティブ登録します。
  - Auto: Discord/Telegram ではオン、Slack ではオフ（Slack では skill ごとにスラッシュコマンドを作成する必要があります）。
  - プロバイダーごとに上書きするには `channels.discord.commands.nativeSkills`、`channels.telegram.commands.nativeSkills`、または `channels.slack.commands.nativeSkills` を設定します（bool または `"auto"`）。
- `commands.bash`（デフォルト `false`）は、ホストシェルコマンドを実行する `! <cmd>` を有効にします（`/bash <cmd>` はエイリアスです。`tools.elevated` の許可リストが必要です）。
- `commands.bashForegroundMs`（デフォルト `2000`）は、bash がバックグラウンドモードに切り替わるまで待つ時間を制御します（`0` なら即座にバックグラウンド化）。
- `commands.config`（デフォルト `false`）は `/config` を有効にします（`openclaw.json` を読み書き）。
- `commands.mcp`（デフォルト `false`）は `/mcp` を有効にします（`mcp.servers` 配下の OpenClaw 管理 MCP config を読み書き）。
- `commands.plugins`（デフォルト `false`）は `/plugins` を有効にします（plugin の検出/状態確認と install + enable/disable 制御）。
- `commands.debug`（デフォルト `false`）は `/debug` を有効にします（ランタイム専用の上書き）。
- `commands.allowFrom`（任意）は、コマンド認可用のプロバイダー別許可リストを設定します。設定されている場合、これがコマンドとディレクティブの唯一の認可元になります（チャンネルの許可リスト/ペアリングと `commands.useAccessGroups` は無視されます）。グローバルデフォルトには `"*"` を使い、プロバイダー固有キーがそれを上書きします。
- `commands.useAccessGroups`（デフォルト `true`）は、`commands.allowFrom` が設定されていない場合に、コマンドへ許可リスト/ポリシーを適用します。

## コマンド一覧

テキスト + ネイティブ（有効時）:

- `/help`
- `/commands`
- `/tools [compact|verbose]`（現在のエージェントが今この時点で使えるものを表示。`verbose` は説明を追加）
- `/skill <name> [input]`（名前で skill を実行）
- `/status`（現在の状態を表示。利用可能な場合は、現在のモデルプロバイダーの使用量/クォータも含む）
- `/tasks`（現在のセッションのバックグラウンドタスクを一覧表示。エージェントローカルのフォールバック件数付きで、アクティブおよび最近のタスク詳細を表示）
- `/allowlist`（allowlist 項目を一覧表示/追加/削除）
- `/approve <id> <decision>`（exec 承認プロンプトを解決。利用可能な決定は保留中の承認メッセージを使います）
- `/context [list|detail|json]`（「context」を説明。`detail` はファイルごと + tool ごと + skill ごと + system prompt サイズを表示）
- `/btw <question>`（今後のセッション文脈を変えずに、現在のセッションについて一時的な脇道の質問をする。[/tools/btw](/tools/btw) を参照）
- `/export-session [path]`（エイリアス: `/export`）（完全な system prompt を含めて現在のセッションを HTML にエクスポート）
- `/whoami`（送信者 id を表示。エイリアス: `/id`）
- `/session idle <duration|off>`（focused thread bindings の無操作時自動 unfocus を管理）
- `/session max-age <duration|off>`（focused thread bindings の最大経過時間による自動 unfocus を管理）
- `/subagents list|kill|log|info|send|steer|spawn`（現在のセッションの sub-agent 実行を調査、制御、または起動）
- `/acp spawn|cancel|steer|close|status|set-mode|set|cwd|permissions|timeout|model|reset-options|doctor|install|sessions`（ACP ランタイムセッションを調査および制御）
- `/agents`（このセッションの thread-bound agents を一覧表示）
- `/focus <target>`（Discord: この thread、または新しい thread を、session/subagent target にバインド）
- `/unfocus`（Discord: 現在の thread binding を削除）
- `/kill <id|#|all>`（このセッションの実行中 sub-agent を 1 つまたはすべて即座に中断。確認メッセージなし）
- `/steer <id|#> <message>`（実行中 sub-agent を即座に操縦。可能なら実行中に、それ以外では現在の作業を中断して steer メッセージで再開）
- `/tell <id|#> <message>`（`/steer` のエイリアス）
- `/config show|get|set|unset`（config をディスクへ永続化、owner-only。`commands.config: true` が必要）
- `/mcp show|get|set|unset`（OpenClaw MCP server config を管理、owner-only。`commands.mcp: true` が必要）
- `/plugins list|show|get|install|enable|disable`（検出された plugins を調査し、新しいものを install し、有効化を切り替える。書き込みは owner-only。`commands.plugins: true` が必要）
  - `/plugin` は `/plugins` のエイリアスです。
  - `/plugin install <spec>` は、`openclaw plugins install` と同じ plugin spec を受け付けます: ローカルパス/アーカイブ、npm package、または `clawhub:<pkg>`。
  - enable/disable の書き込みには、引き続き再起動のヒントが返されます。監視中のフォアグラウンド Gateway では、OpenClaw が書き込み直後に自動でその再起動を行う場合があります。
- `/debug show|set|unset|reset`（ランタイム上書き、owner-only。`commands.debug: true` が必要）
- `/usage off|tokens|full|cost`（レスポンスごとの usage フッターまたはローカルの cost 要約）
- `/tts off|always|inbound|tagged|status|provider|limit|summary|audio`（TTS を制御。[/tts](/tools/tts) を参照）
  - Discord: ネイティブコマンドは `/voice` です（Discord は `/tts` を予約）。テキストの `/tts` は引き続き動作します。
- `/stop`
- `/restart`
- `/dock-telegram`（エイリアス: `/dock_telegram`）（返信先を Telegram に切り替え）
- `/dock-discord`（エイリアス: `/dock_discord`）（返信先を Discord に切り替え）
- `/dock-slack`（エイリアス: `/dock_slack`）（返信先を Slack に切り替え）
- `/activation mention|always`（グループのみ）
- `/send on|off|inherit`（owner-only）
- `/reset` または `/new [model]`（任意の model ヒント。残りはそのまま渡される）
- `/think <off|minimal|low|medium|high|xhigh>`（model/provider による動的な選択肢。エイリアス: `/thinking`, `/t`）
- `/fast status|on|off`（引数を省略すると、現在有効な fast-mode 状態を表示）
- `/verbose on|full|off`（エイリアス: `/v`）
- `/reasoning on|off|stream`（エイリアス: `/reason`。on の場合、`Reasoning:` で始まる別メッセージを送信。`stream` = Telegram の draft のみ）
- `/elevated on|off|ask|full`（エイリアス: `/elev`。`full` は exec 承認をスキップ）
- `/exec host=<auto|sandbox|gateway|node> security=<deny|allowlist|full> ask=<off|on-miss|always> node=<id>`（現在値を表示するには `/exec` を送る）
- `/model <name>`（エイリアス: `/models`。または `agents.defaults.models.*.alias` の `/<alias>`）
- `/queue <mode>`（`debounce:2s cap:25 drop:summarize` のようなオプションも指定可能。現在の設定を見るには `/queue` を送る）
- `/bash <command>`（ホスト専用。`! <command>` のエイリアス。`commands.bash: true` + `tools.elevated` の許可リストが必要）
- `/dreaming [off|core|rem|deep|status|help]`（dreaming mode を切り替える、または状態を表示。[Dreaming](/ja-JP/concepts/memory-dreaming) を参照）

テキストのみ:

- `/compact [instructions]`（[/concepts/compaction](/ja-JP/concepts/compaction) を参照）
- `! <command>`（ホスト専用。一度に 1 つ。長時間実行ジョブには `!poll` + `!stop` を使う）
- `!poll`（出力 / 状態を確認。任意で `sessionId` を指定可能。`/bash poll` も動作）
- `!stop`（実行中の bash ジョブを停止。任意で `sessionId` を指定可能。`/bash stop` も動作）

注意事項:

- コマンドは、コマンドと引数の間に任意で `:` を受け付けます（例: `/think: high`, `/send: on`, `/help:`）。
- `/new <model>` は model alias、`provider/model`、または provider 名（あいまい一致）を受け付けます。一致しなければ、そのテキストはメッセージ本文として扱われます。
- provider usage の完全な内訳を見るには `openclaw status --usage` を使ってください。
- `/allowlist add|remove` には `commands.config=true` が必要で、チャンネルの `configWrites` を尊重します。
- マルチアカウントチャンネルでは、config 対象の `/allowlist --account <id>` と `/config set channels.<provider>.accounts.<id>...` も、対象アカウントの `configWrites` を尊重します。
- `/usage` はレスポンスごとの usage フッターを制御します。`/usage cost` は OpenClaw セッションログからローカルの cost 要約を表示します。
- `/restart` はデフォルトで有効です。無効化するには `commands.restart: false` を設定してください。
- Discord 専用ネイティブコマンド: `/vc join|leave|status` はボイスチャンネルを制御します（`channels.discord.voice` とネイティブコマンドが必要。テキストでは利用不可）。
- Discord の thread-binding コマンド（`/focus`, `/unfocus`, `/agents`, `/session idle`, `/session max-age`）には、実効的な thread bindings が有効である必要があります（`session.threadBindings.enabled` および/または `channels.discord.threadBindings.enabled`）。
- ACP コマンドのリファレンスとランタイム挙動: [ACP Agents](/tools/acp-agents)。
- `/verbose` はデバッグと追加の可視化向けです。通常使用では **off** のままにしてください。
- `/fast on|off` はセッション上書きを保持します。これをクリアして config のデフォルトへ戻すには、Sessions UI の `inherit` オプションを使ってください。
- `/fast` は provider 固有です: OpenAI/OpenAI Codex はネイティブ Responses endpoint 上でこれを `service_tier=priority` に対応付け、一方、`api.anthropic.com` へ送られる OAuth 認証トラフィックを含む直接の公開 Anthropic リクエストでは、これを `service_tier=auto` または `standard_only` に対応付けます。[OpenAI](/ja-JP/providers/openai) と [Anthropic](/ja-JP/providers/anthropic) を参照してください。
- tool 失敗の要約は、関係がある場合は引き続き表示されますが、詳細な失敗テキストが含まれるのは `/verbose` が `on` または `full` のときだけです。
- `/reasoning`（および `/verbose`）はグループ設定では危険です: 意図せずに内部 reasoning や tool 出力を露出させる可能性があります。特にグループチャットでは、off のままにしておくことを推奨します。
- `/model` は新しいセッション model を即座に保持します。
- エージェントがアイドル状態なら、次の実行で即座に使われます。
- すでに実行が進行中の場合、OpenClaw はライブ切り替えを pending としてマークし、きれいな再試行ポイントでのみ新しい model に再起動します。
- すでに tool 活動または返信出力が始まっている場合、その pending 切り替えは、後の再試行機会または次のユーザーターンまでキューに残ることがあります。
- **ファストパス:** 許可リスト入り送信者からのコマンドのみのメッセージは即時処理されます（queue + model をバイパス）。
- **グループの mention ゲート:** 許可リスト入り送信者からのコマンドのみのメッセージは mention 要件をバイパスします。
- **インラインショートカット（許可リスト入り送信者のみ）:** 一部のコマンドは通常メッセージ内に埋め込まれていても動作し、モデルが残りのテキストを見る前に取り除かれます。
  - 例: `hey /status` は status 返信を発生させ、残りのテキストは通常フローを続行します。
- 現在の対象: `/help`, `/commands`, `/status`, `/whoami` (`/id`)。
- 認可されていないコマンドのみのメッセージは黙って無視され、インラインの `/...` トークンは平文として扱われます。
- **skill コマンド:** `user-invocable` な skills はスラッシュコマンドとして公開されます。名前は `a-z0-9_` にサニタイズされ（最大 32 文字）、衝突した場合は数値サフィックスが付きます（例: `_2`）。
  - `/skill <name> [input]` は名前で skill を実行します（ネイティブコマンドの上限のために skill ごとのコマンドが作れない場合に便利です）。
  - デフォルトでは、skill コマンドは通常のリクエストとしてモデルへ転送されます。
  - Skills は任意で `command-dispatch: tool` を宣言でき、コマンドを tool へ直接ルーティングできます（決定的で、モデル不要）。
  - 例: `/prose`（OpenProse plugin）— [OpenProse](/ja-JP/prose) を参照。
- **ネイティブコマンド引数:** Discord は動的オプションに autocomplete を使います（必須引数を省略した場合はボタンメニューも表示）。Telegram と Slack では、コマンドが選択肢に対応していて引数を省略した場合、ボタンメニューが表示されます。

## `/tools`

`/tools` は config に関する質問ではなく、ランタイム上の質問に答えます: **この会話でこのエージェントが今使えるものは何か**。

- デフォルトの `/tools` は compact で、すばやく確認しやすいよう最適化されています。
- `/tools verbose` は短い説明を追加します。
- 引数に対応したネイティブコマンド画面では、同じ `compact|verbose` のモード切り替えが公開されます。
- 結果はセッションスコープなので、agent、channel、thread、送信者認可、または model が変わると出力も変わる可能性があります。
- `/tools` には、実際にランタイムで到達可能な tools が含まれます。core tools、接続された plugin tools、channel 所有の tools も含みます。

profile や上書きを編集するには、`/tools` を静的カタログとして扱うのではなく、Control UI の Tools パネルや config/catalog 画面を使ってください。

## 使用量の表示面（どこに何が出るか）

- **provider usage/quota**（例: 「Claude 80% left」）は、usage tracking が有効な場合、現在の model provider について `/status` に表示されます。OpenClaw は provider のウィンドウを `% left` に正規化します。MiniMax では、残量のみの percent フィールドは表示前に反転され、`model_remains` 応答では model タグ付きの plan label とともに chat-model エントリーが優先されます。
- `/status` の **token/cache 行** は、ライブ session snapshot がまばらな場合に、最新の transcript usage エントリーへフォールバックできます。既存のゼロでないライブ値が依然として優先され、transcript フォールバックは、保存済み total が欠けているか小さすぎる場合に、アクティブ runtime model label や、より大きな prompt 指向 total の復元にも使えます。
- **レスポンスごとの tokens/cost** は `/usage off|tokens|full` によって制御されます（通常返信に追記されます）。
- `/model status` は **models/auth/endpoints** に関するものであり、usage についてではありません。

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

注意事項:

- `/model` と `/model list` は、compact で番号付きの picker（model family + 利用可能な providers）を表示します。
- Discord では、`/model` と `/models` は provider と model のドロップダウン、および Submit ステップを持つ対話型 picker を開きます。
- `/model <#>` はその picker から選択します（可能なら現在の provider を優先）。
- `/model status` は詳細表示を示し、利用可能な場合は設定済みの provider endpoint（`baseUrl`）と API mode（`api`）も含みます。

## debug の上書き

`/debug` を使うと、**ランタイム専用**の config 上書き（メモリー上、ディスクではない）を設定できます。owner-only。デフォルトでは無効で、`commands.debug: true` で有効にします。

例:

```
/debug show
/debug set messages.responsePrefix="[openclaw]"
/debug set channels.whatsapp.allowFrom=["+1555","+4477"]
/debug unset messages.responsePrefix
/debug reset
```

注意事項:

- 上書きは新しい config 読み取りへ即座に反映されますが、`openclaw.json` には書き込みません。
- すべての上書きをクリアしてディスク上の config に戻るには `/debug reset` を使ってください。

## config の更新

`/config` はディスク上の config（`openclaw.json`）へ書き込みます。owner-only。デフォルトでは無効で、`commands.config: true` で有効にします。

例:

```
/config show
/config show messages.responsePrefix
/config get messages.responsePrefix
/config set messages.responsePrefix="[openclaw]"
/config unset messages.responsePrefix
```

注意事項:

- config は書き込み前に検証され、無効な変更は拒否されます。
- `/config` の更新は再起動後も保持されます。

## MCP の更新

`/mcp` は、`mcp.servers` 配下の OpenClaw 管理 MCP server 定義を書き込みます。owner-only。デフォルトでは無効で、`commands.mcp: true` で有効にします。

例:

```text
/mcp show
/mcp show context7
/mcp set context7={"command":"uvx","args":["context7-mcp"]}
/mcp unset context7
```

注意事項:

- `/mcp` は、Pi 所有の project settings ではなく、OpenClaw config に保存します。
- 実際に実行可能な transport は runtime adapters が判断します。

## plugin の更新

`/plugins` を使うと、運用者は検出された plugins を調査し、config 上で有効化を切り替えられます。読み取り専用フローでは `/plugin` をエイリアスとして使えます。デフォルトでは無効で、`commands.plugins: true` で有効にします。

例:

```text
/plugins
/plugins list
/plugin show context7
/plugins enable context7
/plugins disable context7
```

注意事項:

- `/plugins list` と `/plugins show` は、現在のワークスペースとディスク上の config に対する実際の plugin 検出を使います。
- `/plugins enable|disable` は plugin config だけを更新し、plugins の install や uninstall は行いません。
- enable/disable の変更後は、適用のために Gateway を再起動してください。

## 画面ごとの注意

- **テキストコマンド** は通常のチャットセッション内で実行されます（DM は `main` を共有し、グループは独自のセッションを持ちます）。
- **ネイティブコマンド** は分離されたセッションを使います:
  - Discord: `agent:<agentId>:discord:slash:<userId>`
  - Slack: `agent:<agentId>:slack:slash:<userId>`（プレフィックスは `channels.slack.slashCommand.sessionPrefix` で設定可能）
  - Telegram: `telegram:slash:<userId>`（`CommandTargetSessionKey` 経由でチャットセッションを対象にする）
- **`/stop`** はアクティブなチャットセッションを対象にするため、現在の実行を中断できます。
- **Slack:** `channels.slack.slashCommand` は、単一の `/openclaw` 形式コマンド向けに引き続きサポートされています。`commands.native` を有効にする場合、組み込みコマンドごとに 1 つの Slack スラッシュコマンドを作成する必要があります（名前は `/help` と同じ）。Slack のコマンド引数メニューは、一時的な Block Kit ボタンとして配信されます。
  - Slack のネイティブ例外: Slack は `/status` を予約しているため、`/status` ではなく `/agentstatus` を登録してください。テキストの `/status` は Slack メッセージ内で引き続き動作します。

## BTW の脇道質問

`/btw` は、現在のセッションについてのすばやい**脇道の質問**です。

通常のチャットと異なり、これは:

- 現在のセッションを背景文脈として使い、
- 別個の **tool-less** な one-shot 呼び出しとして実行され、
- 今後のセッション文脈を変えず、
- transcript history には書き込まれず、
- 通常の assistant メッセージではなく、ライブの脇道結果として配信されます。

そのため `/btw` は、メインの
タスクを進めたまま一時的な確認をしたいときに便利です。

例:

```text
/btw what are we doing right now?
```

完全な挙動とクライアント UX の
詳細は [BTW Side Questions](/tools/btw) を参照してください。
