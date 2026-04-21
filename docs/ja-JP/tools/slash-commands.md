---
read_when:
    - チャットコマンドの使用または設定
    - コマンドのルーティングまたは権限のデバッグ
summary: 'スラッシュコマンド: テキストとネイティブ、設定、サポートされているコマンド'
title: スラッシュコマンド
x-i18n:
    generated_at: "2026-04-21T17:45:41Z"
    model: gpt-5.4
    provider: openai
    source_hash: 26923608329ba2aeece2d4bc8edfa40ae86e03719a9f590f26ff79f57d97521d
    source_path: tools/slash-commands.md
    workflow: 15
---

# スラッシュコマンド

コマンドはGatewayによって処理されます。ほとんどのコマンドは、`/` で始まる**単独の**メッセージとして送信する必要があります。  
ホスト限定の bash チャットコマンドは `! <cmd>` を使います（`/bash <cmd>` はエイリアスです）。

関連するシステムは2つあります。

- **コマンド**: 単独の `/...` メッセージ。
- **ディレクティブ**: `/think`, `/fast`, `/verbose`, `/trace`, `/reasoning`, `/elevated`, `/exec`, `/model`, `/queue`。
  - ディレクティブは、モデルがメッセージを見る前にメッセージから取り除かれます。
  - 通常のチャットメッセージ内では（ディレクティブだけのメッセージではない場合）、これらは「インラインヒント」として扱われ、セッション設定は**永続化されません**。
  - ディレクティブだけのメッセージ内では（メッセージがディレクティブのみを含む場合）、これらはセッションに永続化され、確認応答が返されます。
  - ディレクティブは**認可された送信者**に対してのみ適用されます。`commands.allowFrom` が設定されている場合、それが使用される唯一の許可リストです。そうでない場合、認可はチャンネルの許可リスト/ペアリングと `commands.useAccessGroups` から決まります。認可されていない送信者では、ディレクティブは通常のテキストとして扱われます。

さらに、いくつかの**インラインショートカット**もあります（許可リストに登録された/認可された送信者のみ）: `/help`, `/commands`, `/status`, `/whoami` (`/id`)。  
これらは即座に実行され、モデルがメッセージを見る前に取り除かれ、残りのテキストは通常フローで処理され続けます。

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

- `commands.text`（デフォルト: `true`）は、チャットメッセージ内での `/...` の解析を有効にします。
  - ネイティブコマンドのない画面では（WhatsApp/WebChat/Signal/iMessage/Google Chat/Microsoft Teams）、これを `false` に設定していてもテキストコマンドは引き続き動作します。
- `commands.native`（デフォルト: `"auto"`）は、ネイティブコマンドを登録します。
  - Auto: Discord/Telegram ではオン、Slack ではオフです（スラッシュコマンドを追加するまで）。ネイティブサポートのないプロバイダーでは無視されます。
  - プロバイダーごとに上書きするには、`channels.discord.commands.native`、`channels.telegram.commands.native`、または `channels.slack.commands.native` を設定します（bool または `"auto"`）。
  - `false` は、起動時に Discord/Telegram で以前登録されたコマンドを削除します。Slack コマンドは Slack アプリで管理されるため、自動では削除されません。
- `commands.nativeSkills`（デフォルト: `"auto"`）は、サポートされている場合に**skill**コマンドをネイティブに登録します。
  - Auto: Discord/Telegram ではオン、Slack ではオフです（Slack では skill ごとにスラッシュコマンドを作成する必要があります）。
  - プロバイダーごとに上書きするには、`channels.discord.commands.nativeSkills`、`channels.telegram.commands.nativeSkills`、または `channels.slack.commands.nativeSkills` を設定します（bool または `"auto"`）。
- `commands.bash`（デフォルト: `false`）は、`! <cmd>` によるホストシェルコマンドの実行を有効にします（`/bash <cmd>` はエイリアスです。`tools.elevated` の許可リストが必要です）。
- `commands.bashForegroundMs`（デフォルト: `2000`）は、bash がバックグラウンドモードに切り替わるまで待機する時間を制御します（`0` は即座にバックグラウンド化します）。
- `commands.config`（デフォルト: `false`）は `/config` を有効にします（`openclaw.json` の読み書き）。
- `commands.mcp`（デフォルト: `false`）は `/mcp` を有効にします（`mcp.servers` 配下の OpenClaw 管理 MCP 設定の読み書き）。
- `commands.plugins`（デフォルト: `false`）は `/plugins` を有効にします（plugin の検出/ステータス、およびインストール + 有効化/無効化の制御）。
- `commands.debug`（デフォルト: `false`）は `/debug` を有効にします（ランタイム限定の上書き）。
- `commands.restart`（デフォルト: `true`）は `/restart` と Gateway 再起動ツールアクションを有効にします。
- `commands.ownerAllowFrom`（任意）は、owner 専用コマンド/ツール画面用の明示的な owner 許可リストを設定します。これは `commands.allowFrom` とは別です。
- `commands.ownerDisplay` は、システムプロンプト内で owner id をどのように表示するかを制御します: `raw` または `hash`。
- `commands.ownerDisplaySecret` は、`commands.ownerDisplay="hash"` の場合に使用する HMAC シークレットを任意で設定します。
- `commands.allowFrom`（任意）は、コマンド認可用のプロバイダー別許可リストを設定します。設定されている場合、これがコマンドとディレクティブに対する唯一の認可ソースになります（チャンネルの許可リスト/ペアリングと `commands.useAccessGroups` は無視されます）。グローバルデフォルトには `"*"` を使います。プロバイダー固有のキーはそれを上書きします。
- `commands.useAccessGroups`（デフォルト: `true`）は、`commands.allowFrom` が設定されていない場合に、コマンドに対して許可リスト/ポリシーを適用します。

## コマンド一覧

現在の信頼できる情報源:

- コア組み込みコマンドは `src/auto-reply/commands-registry.shared.ts` から取得されます
- 生成された dock コマンドは `src/auto-reply/commands-registry.data.ts` から取得されます
- plugin コマンドは plugin の `registerCommand()` 呼び出しから取得されます
- 実際にあなたの gateway で利用できるかどうかは、引き続き設定フラグ、チャンネル画面、インストール済み/有効化済み plugin に依存します

### コア組み込みコマンド

現在利用できる組み込みコマンド:

- `/new [model]` は新しいセッションを開始します。`/reset` はリセットのエイリアスです。
- `/reset soft [message]` は現在の transcript を保持し、再利用される CLI バックエンドのセッション id を破棄し、起動/システムプロンプトの読み込みをその場で再実行します。
- `/compact [instructions]` はセッションコンテキストを Compaction します。[/concepts/compaction](/ja-JP/concepts/compaction) を参照してください。
- `/stop` は現在の実行を中止します。
- `/session idle <duration|off>` と `/session max-age <duration|off>` は、スレッドバインディングの有効期限を管理します。
- `/think <level>` は思考レベルを設定します。選択肢はアクティブモデルのプロバイダープロファイルから取得されます。一般的なレベルは `off`、`minimal`、`low`、`medium`、`high` で、`xhigh`、`adaptive`、`max`、または二値の `on` のようなカスタムレベルはサポートされている場合にのみ利用できます。エイリアス: `/thinking`, `/t`。
- `/verbose on|off|full` は詳細出力を切り替えます。エイリアス: `/v`。
- `/trace on|off` は現在のセッションの plugin トレース出力を切り替えます。
- `/fast [status|on|off]` は高速モードの表示または設定を行います。
- `/reasoning [on|off|stream]` は reasoning の表示を切り替えます。エイリアス: `/reason`。
- `/elevated [on|off|ask|full]` は elevated モードを切り替えます。エイリアス: `/elev`。
- `/exec host=<auto|sandbox|gateway|node> security=<deny|allowlist|full> ask=<off|on-miss|always> node=<id>` は exec のデフォルトを表示または設定します。
- `/model [name|#|status]` はモデルの表示または設定を行います。
- `/models [provider] [page] [limit=<n>|size=<n>|all]` は、プロバイダーまたはプロバイダーのモデルを一覧表示します。
- `/queue <mode>` はキュー動作を管理します（`steer`, `interrupt`, `followup`, `collect`, `steer-backlog`）。`debounce:2s cap:25 drop:summarize` のようなオプションも使えます。
- `/help` は短いヘルプ概要を表示します。
- `/commands` は生成されたコマンドカタログを表示します。
- `/tools [compact|verbose]` は、現在のエージェントが今使えるものを表示します。
- `/status` は、利用可能な場合はプロバイダーの使用量/クォータを含むランタイムステータスを表示します。
- `/tasks` は、現在のセッションのアクティブ/最近のバックグラウンドタスクを一覧表示します。
- `/context [list|detail|json]` は、コンテキストがどのように組み立てられるかを説明します。
- `/export-session [path]` は、現在のセッションを HTML にエクスポートします。エイリアス: `/export`。
- `/whoami` はあなたの送信者 id を表示します。エイリアス: `/id`。
- `/skill <name> [input]` は名前で skill を実行します。
- `/allowlist [list|add|remove] ...` は、許可リストのエントリーを管理します。テキスト専用です。
- `/approve <id> <decision>` は、exec 承認プロンプトを解決します。
- `/btw <question>` は、今後のセッションコンテキストを変更せずに脇道の質問をします。[/tools/btw](/ja-JP/tools/btw) を参照してください。
- `/subagents list|kill|log|info|send|steer|spawn` は、現在のセッションのサブエージェント実行を管理します。
- `/acp spawn|cancel|steer|close|sessions|status|set-mode|set|cwd|permissions|timeout|model|reset-options|doctor|install|help` は、ACP セッションとランタイムオプションを管理します。
- `/focus <target>` は、現在の Discord スレッドまたは Telegram トピック/会話をセッションターゲットにバインドします。
- `/unfocus` は、現在のバインディングを解除します。
- `/agents` は、現在のセッションのスレッドにバインドされたエージェントを一覧表示します。
- `/kill <id|#|all>` は、実行中のサブエージェントを1つまたはすべて中止します。
- `/steer <id|#> <message>` は、実行中のサブエージェントにステアリングを送信します。エイリアス: `/tell`。
- `/config show|get|set|unset` は、`openclaw.json` を読み書きします。owner 専用です。`commands.config: true` が必要です。
- `/mcp show|get|set|unset` は、`mcp.servers` 配下の OpenClaw 管理 MCP サーバー設定を読み書きします。owner 専用です。`commands.mcp: true` が必要です。
- `/plugins list|inspect|show|get|install|enable|disable` は、plugin の状態を調査または変更します。`/plugin` はエイリアスです。書き込みは owner 専用です。`commands.plugins: true` が必要です。
- `/debug show|set|unset|reset` は、ランタイム限定の設定上書きを管理します。owner 専用です。`commands.debug: true` が必要です。
- `/usage off|tokens|full|cost` は、レスポンスごとの使用量フッターを制御するか、ローカルのコスト概要を表示します。
- `/tts on|off|status|provider|limit|summary|audio|help` は、TTS を制御します。[/tools/tts](/ja-JP/tools/tts) を参照してください。
- `/restart` は、有効な場合に OpenClaw を再起動します。デフォルト: 有効。無効にするには `commands.restart: false` を設定してください。
- `/activation mention|always` は、グループアクティベーションモードを設定します。
- `/send on|off|inherit` は、送信ポリシーを設定します。owner 専用です。
- `/bash <command>` は、ホストシェルコマンドを実行します。テキスト専用です。エイリアス: `! <command>`。`commands.bash: true` に加えて `tools.elevated` の許可リストが必要です。
- `!poll [sessionId]` は、バックグラウンド bash ジョブを確認します。
- `!stop [sessionId]` は、バックグラウンド bash ジョブを停止します。

### 生成された dock コマンド

Dock コマンドは、ネイティブコマンド対応のチャンネル plugin から生成されます。現在バンドルされているセット:

- `/dock-discord`（エイリアス: `/dock_discord`）
- `/dock-mattermost`（エイリアス: `/dock_mattermost`）
- `/dock-slack`（エイリアス: `/dock_slack`）
- `/dock-telegram`（エイリアス: `/dock_telegram`）

### バンドルされた plugin コマンド

バンドルされた plugin は、さらにスラッシュコマンドを追加できます。このリポジトリで現在バンドルされているコマンド:

- `/dreaming [on|off|status|help]` は、メモリ Dreaming を切り替えます。[Dreaming](/ja-JP/concepts/dreaming) を参照してください。
- `/pair [qr|status|pending|approve|cleanup|notify]` は、デバイスのペアリング/セットアップフローを管理します。[Pairing](/ja-JP/channels/pairing) を参照してください。
- `/phone status|arm <camera|screen|writes|all> [duration]|disarm` は、高リスクの phone Node コマンドを一時的に有効化します。
- `/voice status|list [limit]|set <voiceId|name>` は、Talk 音声設定を管理します。Discord では、ネイティブコマンド名は `/talkvoice` です。
- `/card ...` は、LINE リッチカードのプリセットを送信します。[LINE](/ja-JP/channels/line) を参照してください。
- `/codex status|models|threads|resume|compact|review|account|mcp|skills` は、バンドルされた Codex app-server harness を調査および制御します。[Codex Harness](/ja-JP/plugins/codex-harness) を参照してください。
- QQBot 専用コマンド:
  - `/bot-ping`
  - `/bot-version`
  - `/bot-help`
  - `/bot-upgrade`
  - `/bot-logs`

### 動的 skill コマンド

ユーザーが呼び出せる Skills もスラッシュコマンドとして公開されます。

- `/skill <name> [input]` は、汎用エントリーポイントとして常に機能します。
- skill/plugin が登録している場合、Skills は `/prose` のような直接コマンドとして表示されることもあります。
- ネイティブ skill コマンド登録は、`commands.nativeSkills` と `channels.<provider>.commands.nativeSkills` によって制御されます。

注意:

- コマンドは、コマンドと引数の間に任意で `:` を入れられます（例: `/think: high`, `/send: on`, `/help:`）。
- `/new <model>` は、モデルエイリアス、`provider/model`、またはプロバイダー名（あいまい一致）を受け付けます。一致しない場合、そのテキストはメッセージ本文として扱われます。
- プロバイダー使用量の完全な内訳を確認するには、`openclaw status --usage` を使ってください。
- `/allowlist add|remove` には `commands.config=true` が必要で、チャンネルの `configWrites` に従います。
- マルチアカウントチャンネルでは、設定対象の `/allowlist --account <id>` と `/config set channels.<provider>.accounts.<id>...` も対象アカウントの `configWrites` に従います。
- `/usage` はレスポンスごとの使用量フッターを制御します。`/usage cost` は OpenClaw のセッションログからローカルのコスト概要を表示します。
- `/restart` はデフォルトで有効です。無効にするには `commands.restart: false` を設定してください。
- `/plugins install <spec>` は `openclaw plugins install` と同じ plugin spec を受け付けます: ローカルパス/アーカイブ、npm パッケージ、または `clawhub:<pkg>`。
- `/plugins enable|disable` は plugin 設定を更新し、再起動を求めることがあります。
- Discord 専用ネイティブコマンド: `/vc join|leave|status` はボイスチャンネルを制御します（`channels.discord.voice` とネイティブコマンドが必要で、テキストとしては利用できません）。
- Discord のスレッドバインディングコマンド（`/focus`, `/unfocus`, `/agents`, `/session idle`, `/session max-age`）は、有効なスレッドバインディングが有効化されている必要があります（`session.threadBindings.enabled` および/または `channels.discord.threadBindings.enabled`）。
- ACP コマンドリファレンスとランタイム動作: [ACP Agents](/ja-JP/tools/acp-agents)。
- `/verbose` はデバッグと追加の可視化を目的としています。通常の使用では **off** のままにしてください。
- `/trace` は `/verbose` より範囲が狭く、plugin が所有する trace/debug 行だけを表示し、通常の verbose なツールのおしゃべりはオフのままにします。
- `/fast on|off` はセッション上書きを永続化します。これをクリアして設定デフォルトに戻すには、Sessions UI の `inherit` オプションを使ってください。
- `/fast` はプロバイダー依存です: OpenAI/OpenAI Codex ではネイティブ Responses エンドポイントで `service_tier=priority` に対応し、`api.anthropic.com` に送られる OAuth 認証トラフィックを含む直接の公開 Anthropic リクエストでは `service_tier=auto` または `standard_only` に対応します。[OpenAI](/ja-JP/providers/openai) と [Anthropic](/ja-JP/providers/anthropic) を参照してください。
- ツール失敗の概要は関連がある場合に引き続き表示されますが、詳細な失敗テキストが含まれるのは `/verbose` が `on` または `full` のときだけです。
- `/reasoning`、`/verbose`、`/trace` はグループ設定では危険です: 意図せず内部の reasoning、ツール出力、または plugin 診断を公開してしまう可能性があります。特にグループチャットでは、これらをオフのままにしておくことを推奨します。
- `/model` は新しいセッションモデルを即座に永続化します。
- エージェントがアイドル状態なら、次の実行ですぐに使われます。
- すでに実行がアクティブな場合、OpenClaw はライブ切り替えを保留としてマークし、クリーンな再試行ポイントでのみ新しいモデルに再起動します。
- ツール活動または返信出力がすでに始まっている場合、その保留切り替えは後の再試行機会または次のユーザーターンまでキューに残ることがあります。
- **高速パス:** 許可リスト登録済み送信者からのコマンドのみのメッセージは即座に処理されます（キューとモデルをバイパスします）。
- **グループメンションゲーティング:** 許可リスト登録済み送信者からのコマンドのみのメッセージは、メンション要件をバイパスします。
- **インラインショートカット（許可リスト登録済み送信者のみ）:** 一部のコマンドは通常メッセージに埋め込まれていても動作し、残りのテキストをモデルが見る前に取り除かれます。
  - 例: `hey /status` はステータス返信をトリガーし、残りのテキストは通常フローで処理され続けます。
- 現在の対象: `/help`, `/commands`, `/status`, `/whoami` (`/id`)。
- 認可されていないコマンドのみのメッセージは黙って無視され、インラインの `/...` トークンは通常のテキストとして扱われます。
- **skill コマンド:** `user-invocable` な Skills はスラッシュコマンドとして公開されます。名前は `a-z0-9_` に正規化され（最大 32 文字）、衝突した場合は数値サフィックスが付きます（例: `_2`）。
  - `/skill <name> [input]` は名前で skill を実行します（ネイティブコマンドの制限により skill ごとのコマンドを作れない場合に便利です）。
  - デフォルトでは、skill コマンドは通常のリクエストとしてモデルに転送されます。
  - Skills は任意で `command-dispatch: tool` を宣言して、コマンドをツールへ直接ルーティングできます（決定的で、モデルは使いません）。
  - 例: `/prose`（OpenProse plugin）— [OpenProse](/ja-JP/prose) を参照してください。
- **ネイティブコマンド引数:** Discord は動的オプションに autocomplete を使います（必須引数を省略したときはボタンメニューも使います）。Telegram と Slack は、コマンドが選択肢をサポートしていて引数を省略した場合、ボタンメニューを表示します。

## `/tools`

`/tools` が答えるのは設定上の問いではなく、ランタイム上の問いです: **この会話でこのエージェントが今すぐ使えるもの**。

- デフォルトの `/tools` は簡潔で、すばやく見渡せるよう最適化されています。
- `/tools verbose` は短い説明を追加します。
- 引数をサポートするネイティブコマンド画面では、同じモード切り替え `compact|verbose` が公開されます。
- 結果はセッションスコープなので、エージェント、チャンネル、スレッド、送信者認可、またはモデルを変えると出力も変わることがあります。
- `/tools` には、コアツール、接続された plugin ツール、チャンネル所有ツールを含め、ランタイムで実際に到達可能なツールが含まれます。

プロファイルや上書きの編集には、`/tools` を静的カタログとして扱うのではなく、Control UI の Tools パネルまたは設定/カタログ画面を使ってください。

## 使用量の表示箇所（どこに何が表示されるか）

- **プロバイダー使用量/クォータ**（例: 「Claude 80% left」）は、使用量トラッキングが有効なとき、現在のモデルプロバイダーについて `/status` に表示されます。OpenClaw はプロバイダーのウィンドウを `% left` に正規化します。MiniMax では残量のみの percent フィールドは表示前に反転され、`model_remains` レスポンスではチャットモデルのエントリーが優先され、モデルタグ付きプランラベルが使われます。
- `/status` 内の **トークン/キャッシュ行** は、ライブセッションスナップショットの情報が少ない場合、最新の transcript 使用量エントリーにフォールバックできます。既存のゼロ以外のライブ値が引き続き優先され、transcript フォールバックは保存済み合計が欠けているか小さすぎる場合に、アクティブなランタイムモデルラベルや、より大きなプロンプト指向の合計値も復元できます。
- **レスポンスごとのトークン/コスト** は `/usage off|tokens|full` で制御されます（通常の返信に追記されます）。
- `/model status` は **モデル/認証/エンドポイント** に関するものであり、使用量に関するものではありません。

## モデル選択（`/model`）

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

- `/model` と `/model list` は、コンパクトな番号付きピッカー（モデルファミリー + 利用可能なプロバイダー）を表示します。
- Discord では、`/model` と `/models` はプロバイダーとモデルのドロップダウン、および Submit ステップを備えたインタラクティブピッカーを開きます。
- `/model <#>` はそのピッカーから選択し、可能であれば現在のプロバイダーを優先します。
- `/model status` は詳細ビューを表示し、利用可能な場合は設定済みプロバイダーエンドポイント（`baseUrl`）と API モード（`api`）も含まれます。

## デバッグ上書き

`/debug` を使うと、**ランタイム限定**の設定上書き（メモリ上、ディスクではない）を設定できます。owner 専用です。デフォルトでは無効で、`commands.debug: true` で有効にします。

例:

```
/debug show
/debug set messages.responsePrefix="[openclaw]"
/debug set channels.whatsapp.allowFrom=["+1555","+4477"]
/debug unset messages.responsePrefix
/debug reset
```

注意:

- 上書きは新しい設定読み取りにすぐ適用されますが、`openclaw.json` には書き込みません。
- すべての上書きを消去してディスク上の設定に戻るには `/debug reset` を使ってください。

## plugin トレース出力

`/trace` を使うと、完全な verbose モードを有効にせずに**セッションスコープの plugin trace/debug 行**を切り替えられます。

例:

```text
/trace
/trace on
/trace off
```

注意:

- 引数なしの `/trace` は、現在のセッショントレース状態を表示します。
- `/trace on` は、現在のセッションの plugin トレース行を有効にします。
- `/trace off` は、それらを再び無効にします。
- plugin トレース行は `/status` に表示されたり、通常のアシスタント返信の後に続く診断メッセージとして表示されたりすることがあります。
- `/trace` は `/debug` の代わりにはなりません。`/debug` は引き続きランタイム限定の設定上書きを管理します。
- `/trace` は `/verbose` の代わりにもなりません。通常の verbose なツール/ステータス出力は引き続き `/verbose` の役割です。

## 設定更新

`/config` はディスク上の設定（`openclaw.json`）に書き込みます。owner 専用です。デフォルトでは無効で、`commands.config: true` で有効にします。

例:

```
/config show
/config show messages.responsePrefix
/config get messages.responsePrefix
/config set messages.responsePrefix="[openclaw]"
/config unset messages.responsePrefix
```

注意:

- 設定は書き込み前に検証されます。無効な変更は拒否されます。
- `/config` の更新は再起動後も保持されます。

## MCP 更新

`/mcp` は `mcp.servers` 配下の OpenClaw 管理 MCP サーバー定義を書き込みます。owner 専用です。デフォルトでは無効で、`commands.mcp: true` で有効にします。

例:

```text
/mcp show
/mcp show context7
/mcp set context7={"command":"uvx","args":["context7-mcp"]}
/mcp unset context7
```

注意:

- `/mcp` は設定を OpenClaw 設定に保存し、Pi 所有のプロジェクト設定には保存しません。
- どの transport が実際に実行可能かは、ランタイムアダプターが決定します。

## plugin 更新

`/plugins` を使うと、運用者は検出された plugin を調べ、設定内の有効化状態を切り替えられます。読み取り専用フローでは `/plugin` をエイリアスとして使えます。デフォルトでは無効で、`commands.plugins: true` で有効にします。

例:

```text
/plugins
/plugins list
/plugin show context7
/plugins enable context7
/plugins disable context7
```

注意:

- `/plugins list` と `/plugins show` は、現在のワークスペースとディスク上の設定に対して実際の plugin 検出を行います。
- `/plugins enable|disable` は plugin 設定のみを更新し、plugin のインストールやアンインストールは行いません。
- 有効化/無効化の変更後は、適用するために gateway を再起動してください。

## 画面ごとの注意

- **テキストコマンド** は通常のチャットセッションで実行されます（DM は `main` を共有し、グループは独自のセッションを持ちます）。
- **ネイティブコマンド** は分離されたセッションを使います:
  - Discord: `agent:<agentId>:discord:slash:<userId>`
  - Slack: `agent:<agentId>:slack:slash:<userId>`（プレフィックスは `channels.slack.slashCommand.sessionPrefix` で設定可能）
  - Telegram: `telegram:slash:<userId>`（`CommandTargetSessionKey` 経由でチャットセッションを対象にします）
- **`/stop`** はアクティブなチャットセッションを対象にするため、現在の実行を中止できます。
- **Slack:** `channels.slack.slashCommand` は単一の `/openclaw` 形式コマンド用として引き続きサポートされています。`commands.native` を有効にする場合は、組み込みコマンドごとに1つの Slack スラッシュコマンドを作成する必要があります（名前は `/help` と同じです）。Slack のコマンド引数メニューは、一時的な Block Kit ボタンとして配信されます。
  - Slack のネイティブ例外: Slack は `/status` を予約しているため、`/status` ではなく `/agentstatus` を登録してください。テキストの `/status` は Slack メッセージでも引き続き動作します。

## BTW 脇道の質問

`/btw` は現在のセッションについての手軽な**脇道の質問**です。

通常のチャットとは異なり、次の特徴があります。

- 現在のセッションを背景コンテキストとして使う
- 別個の**ツールなし**ワンショット呼び出しとして実行される
- 今後のセッションコンテキストを変更しない
- transcript 履歴に書き込まれない
- 通常のアシスタントメッセージではなく、ライブのサイド結果として配信される

そのため、メインタスクを進めたまま一時的な確認をしたいときに `/btw` は便利です。

例:

```text
/btw what are we doing right now?
```

完全な動作とクライアント UX の詳細については、[BTW Side Questions](/ja-JP/tools/btw) を参照してください。
