---
read_when:
    - ACP経由でコーディングハーネスを実行する場合
    - メッセージングチャネル上で会話にバインドされたACPセッションを設定する場合
    - メッセージチャネルの会話を永続的なACPセッションにバインドする場合
    - ACPバックエンドとplugin配線をトラブルシューティングする場合
    - ACP完了配信やagent-to-agentループをデバッグする場合
    - チャットから`/acp`コマンドを操作する場合
summary: Claude Code、Cursor、Gemini CLI、明示的なCodex ACPフォールバック、OpenClaw ACP、その他のハーネスエージェント向けにACPランタイムセッションを使用する
title: ACPエージェント
x-i18n:
    generated_at: "2026-04-25T13:59:56Z"
    model: gpt-5.4
    provider: openai
    source_hash: 54f23bbfbd915147771b642e899ef2a660cacff2f8ae54facd6ba4cee946b2a1
    source_path: tools/acp-agents.md
    workflow: 15
---

[Agent Client Protocol (ACP)](https://agentclientprotocol.com/)セッションを使うと、OpenClawはACPバックエンドpluginを通じて、外部のコーディングハーネス（たとえばPi、Claude Code、Cursor、Copilot、OpenClaw ACP、OpenCode、Gemini CLI、その他の対応ACPXハーネス）を実行できます。

現在の会話でCodexをバインドまたは制御したいと、平文でOpenClawに依頼した場合、OpenClawはネイティブのCodex app-server plugin（`/codex bind`、`/codex threads`、`/codex resume`）を使うべきです。`/acp`、ACP、acpx、またはCodexのバックグラウンド子セッションを要求した場合は、OpenClawは引き続きCodexをACP経由でルーティングできます。各ACPセッションspawnは[background task](/ja-JP/automation/tasks)として追跡されます。

「スレッドでClaude Codeを開始して」や、別の外部ハーネスを使うよう平文でOpenClawに依頼した場合、OpenClawはそのリクエストをネイティブsub-agent runtimeではなく、ACP runtimeへルーティングすべきです。

CodexまたはClaude Codeを、既存のOpenClawチャネル会話へ外部MCP clientとして直接接続したい場合は、ACPではなく[`openclaw mcp serve`](/ja-JP/cli/mcp)を使用してください。

## どのページを見ればいいですか？

近い場所にあり混同しやすいサーフェスが3つあります。

| したいこと                                                                                  | 使うもの                              | 注記                                                                                                                                                      |
| ----------------------------------------------------------------------------------------------- | ------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 現在の会話でCodexをバインドまたは制御する                                               | `/codex bind`, `/codex threads`       | ネイティブCodex app-server経路。バインドされたチャット返信、画像転送、model/fast/permissions、stop、steer制御を含みます。ACPは明示的フォールバックです |
| Claude Code、Gemini CLI、明示的Codex ACP、または別の外部ハーネスをOpenClaw _経由で_ 実行する | このページ: ACP agents                 | チャットバインドセッション、`/acp spawn`、`sessions_spawn({ runtime: "acp" })`、background task、runtime制御                                                |
| エディターやclient向けに、OpenClaw GatewayセッションをACPサーバー _として_ 公開する                   | [`openclaw acp`](/ja-JP/cli/acp)            | ブリッジモード。IDE/clientがstdio/WebSocket経由でOpenClawへACPで接続します                                                                                         |
| ローカルAI CLIをテキスト専用のフォールバックモデルとして再利用する                                              | [CLI Backends](/ja-JP/gateway/cli-backends) | ACPではありません。OpenClaw toolsなし、ACP制御なし、ハーネスruntimeなし                                                                                            |

## これはすぐに使えますか？

通常ははい。新規インストールでは、バンドル済みの`acpx` runtime pluginがデフォルトで有効になっており、pluginローカルでピン留めされた`acpx`バイナリをOpenClawが起動時にprobeし、自動修復します。準備確認には`/acp doctor`を実行してください。

初回実行時の注意点:

- 対象ハーネスadapter（Codex、Claudeなど）は、初回利用時に`npx`でオンデマンド取得されることがあります。
- そのハーネス向けvendor authは、引き続きホスト上に存在している必要があります。
- ホストにnpmまたはネットワークアクセスがない場合、キャッシュが事前に温められるか、adapterが別手段でインストールされるまで、初回adapter取得は失敗します。

## operator runbook

チャットからの簡単な`/acp`フロー:

1. **Spawn** — `/acp spawn claude --bind here`、`/acp spawn gemini --mode persistent --thread auto`、または明示的な`/acp spawn codex --bind here`
2. バインドされた会話またはスレッドで**作業**する（または明示的にsession keyを指定する）。
3. **状態確認** — `/acp status`
4. **調整** — `/acp model <provider/model>`、`/acp permissions <profile>`、`/acp timeout <seconds>`
5. コンテキストを置き換えずに**steer**する — `/acp steer tighten logging and continue`
6. **停止** — `/acp cancel`（現在のターン）または`/acp close`（セッション + bindings）

ネイティブCodex pluginへルーティングされるべき自然言語トリガー:

- 「このDiscordチャネルをCodexにバインドして」
- 「このチャットをCodexスレッド`<id>`に接続して」
- 「Codexスレッドを表示して、それからこれをバインドして」

ネイティブCodex会話バインディングが、デフォルトのチャット制御経路です。OpenClaw
dynamic toolは引き続きOpenClaw経由で実行され、shell/apply-patchのようなCodexネイティブtoolはCodex内で実行されます。Codexネイティブtoolイベントについては、OpenClawはターンごとのネイティブhook relayを注入するため、plugin hookは
`before_tool_call`をブロックし、`after_tool_call`を観測し、Codexの
`PermissionRequest`イベントをOpenClaw approval経由でルーティングできます。v1 relayは
意図的に保守的で、Codexネイティブtool引数の変更、
Codex thread recordの書き換え、最終回答/Stop hookの制御は行いません。ACP runtime/session modelが欲しい場合にのみ明示的ACPを使ってください。埋め込みCodexサポート境界は
[Codex harness v1 support contract](/ja-JP/plugins/codex-harness#v1-support-contract)に記載されています。

ACP runtimeへルーティングされるべき自然言語トリガー:

- 「これをワンショットのClaude Code ACPセッションで実行して、結果を要約して」
- 「このタスクにGemini CLIをスレッド内で使って、その後のフォローアップも同じスレッドで続けて」
- 「CodexをACP経由でバックグラウンドスレッドで実行して」

OpenClawは`runtime: "acp"`を選び、ハーネス`agentId`を解決し、対応している場合は現在の会話またはスレッドにバインドし、そのセッションへclose/expiryまでフォローアップをルーティングします。Codexがこの経路に従うのは、ACPが明示的な場合、または要求されたバックグラウンドruntimeが引き続きACPを必要とする場合だけです。

## ACPとsub-agentの違い

外部ハーネスruntimeが必要ならACPを使ってください。Codexの会話バインディング/制御にはネイティブCodex app-serverを使ってください。OpenClawネイティブの委譲実行が必要ならsub-agentを使ってください。

| 項目          | ACP session                           | Sub-agent run                      |
| ------------- | ------------------------------------- | ---------------------------------- |
| Runtime       | ACP backend plugin（例: acpx） | OpenClawネイティブsub-agent runtime  |
| Session key   | `agent:<agentId>:acp:<uuid>`          | `agent:<agentId>:subagent:<uuid>`  |
| Main commands | `/acp ...`                            | `/subagents ...`                   |
| Spawn tool    | `sessions_spawn` with `runtime:"acp"` | `sessions_spawn`（デフォルトruntime） |

[Sub-agents](/ja-JP/tools/subagents)も参照してください。

## ACPがClaude Codeをどう実行するか

ACP経由のClaude Codeでは、スタックは次のとおりです。

1. OpenClaw ACP session control plane
2. バンドル済み`acpx` runtime plugin
3. Claude ACP adapter
4. Claude側のruntime/session machinery

重要な違い:

- ACP Claudeは、ACP制御、session resume、background-task追跡、任意の会話/スレッドバインディングを持つハーネスセッションです。
- CLI backendは別のテキスト専用ローカルフォールバックruntimeです。[CLI Backends](/ja-JP/gateway/cli-backends)を参照してください。

operator向けの実用ルール:

- `/acp spawn`、バインド可能session、runtime制御、または永続的ハーネス作業が欲しい: ACPを使う
- raw CLI経由のシンプルなローカルテキストフォールバックが欲しい: CLI backendを使う

## バインド済みセッション

### 現在の会話へのバインド

`/acp spawn <harness> --bind here`は、現在の会話をspawnしたACP sessionへ固定します — 子スレッドは作られず、同じチャットサーフェスです。OpenClawは引き続きtransport、auth、安全性、配信を所有し、その会話内のフォローアップメッセージは同じsessionへルーティングされ、`/new`と`/reset`はsessionをその場でリセットし、`/acp close`はbindingを削除します。

考え方:

- **chat surface** — 人が会話を続ける場所（Discordチャネル、Telegram topic、iMessage chat）。
- **ACP session** — OpenClawがルーティング先にする、耐久性のあるCodex/Claude/Gemini runtime state。
- **子スレッド/topic** — `--thread ...`によってのみ作られる任意の追加メッセージングサーフェス。
- **runtime workspace** — ハーネスが実行されるfilesystem上の場所（`cwd`、repo checkout、backend workspace）。chat surfaceとは独立しています。

例:

- `/codex bind` — このチャットを維持し、ネイティブCodex app-serverをspawnまたは接続し、今後のメッセージをここへルーティングする。
- `/codex model gpt-5.4`、`/codex fast on`、`/codex permissions yolo` — チャットからバインド済みネイティブCodexスレッドを調整する。
- `/codex stop`または`/codex steer focus on the failing tests first` — アクティブなネイティブCodexターンを制御する。
- `/acp spawn codex --bind here` — Codex向けの明示的ACPフォールバック。
- `/acp spawn codex --thread auto` — OpenClawが子スレッド/topicを作成してそこへバインドする場合がある。
- `/acp spawn codex --bind here --cwd /workspace/repo` — 同じチャットにバインドしつつ、Codexは`/workspace/repo`で実行される。

注:

- `--bind here`と`--thread ...`は相互排他的です。
- `--bind here`は、現在の会話バインディングを通知するチャネルでのみ動作します。そうでない場合、OpenClawは明確な未対応メッセージを返します。bindingはgateway再起動をまたいで保持されます。
- Discordでは、`spawnAcpSessions`が必要なのは、OpenClawが`--thread auto|here`のために子スレッドを作成する必要がある場合だけであり、`--bind here`には不要です。
- 別のACP agentへ`--cwd`なしでspawnした場合、OpenClawはデフォルトで**対象agentの**workspaceを継承します。継承されたパスが存在しない場合（`ENOENT`/`ENOTDIR`）はbackend defaultへフォールバックし、その他のアクセスエラー（例: `EACCES`）はspawnエラーとして表面化します。

### スレッドにバインドされたセッション

チャネルadapterでthread bindingが有効な場合、ACP sessionはスレッドへバインドできます。

- OpenClawがスレッドを対象ACP sessionへバインドします。
- そのスレッド内のフォローアップメッセージは、バインド済みACP sessionへルーティングされます。
- ACP出力は同じスレッドへ返されます。
- unfocus/close/archive/idle-timeoutまたはmax-age expiryでbindingは削除されます。

thread binding対応はadapter固有です。アクティブなチャネルadapterがthread bindingをサポートしていない場合、OpenClawは明確な未対応/利用不可メッセージを返します。

thread-bound ACPに必要なfeature flag:

- `acp.enabled=true`
- `acp.dispatch.enabled`はデフォルトでオンです（ACP dispatchを一時停止するには`false`を設定）
- チャネルadapterのACP thread-spawn flagが有効（adapter固有）
  - Discord: `channels.discord.threadBindings.spawnAcpSessions=true`
  - Telegram: `channels.telegram.threadBindings.spawnAcpSessions=true`

### スレッド対応チャネル

- session/thread binding capabilityを公開する任意のチャネルadapter。
- 現在の組み込み対応:
  - Discord threads/channels
  - Telegram topics（group/supergroup内のforum topicおよびDM topic）
- Plugin channelも、同じbinding interfaceを通じて対応を追加できます。

## チャネル固有設定

非ephemeralワークフローでは、トップレベル`bindings[]` entryで永続的ACP bindingを設定します。

### bindingモデル

- `bindings[].type="acp"`は永続的ACP会話bindingを示します。
- `bindings[].match`は対象会話を識別します:
  - Discord channelまたはthread: `match.channel="discord"` + `match.peer.id="<channelOrThreadId>"`
  - Telegram forum topic: `match.channel="telegram"` + `match.peer.id="<chatId>:topic:<topicId>"`
  - BlueBubbles DM/group chat: `match.channel="bluebubbles"` + `match.peer.id="<handle|chat_id:*|chat_guid:*|chat_identifier:*>"`
    安定したgroup bindingには`chat_id:*`または`chat_identifier:*`を推奨します。
  - iMessage DM/group chat: `match.channel="imessage"` + `match.peer.id="<handle|chat_id:*|chat_guid:*|chat_identifier:*>"`
    安定したgroup bindingには`chat_id:*`を推奨します。
- `bindings[].agentId`は所有するOpenClaw agent idです。
- 任意のACP上書きは`bindings[].acp`配下に置きます:
  - `mode`（`persistent`または`oneshot`）
  - `label`
  - `cwd`
  - `backend`

### agentごとのruntime default

agentごとにACP defaultを一度だけ定義するには`agents.list[].runtime`を使います。

- `agents.list[].runtime.type="acp"`
- `agents.list[].runtime.acp.agent`（ハーネスid。例: `codex`または`claude`）
- `agents.list[].runtime.acp.backend`
- `agents.list[].runtime.acp.mode`
- `agents.list[].runtime.acp.cwd`

ACPバインド済みセッションの上書き優先順位:

1. `bindings[].acp.*`
2. `agents.list[].runtime.acp.*`
3. グローバルACP default（例: `acp.backend`）

例:

```json5
{
  agents: {
    list: [
      {
        id: "codex",
        runtime: {
          type: "acp",
          acp: {
            agent: "codex",
            backend: "acpx",
            mode: "persistent",
            cwd: "/workspace/openclaw",
          },
        },
      },
      {
        id: "claude",
        runtime: {
          type: "acp",
          acp: { agent: "claude", backend: "acpx", mode: "persistent" },
        },
      },
    ],
  },
  bindings: [
    {
      type: "acp",
      agentId: "codex",
      match: {
        channel: "discord",
        accountId: "default",
        peer: { kind: "channel", id: "222222222222222222" },
      },
      acp: { label: "codex-main" },
    },
    {
      type: "acp",
      agentId: "claude",
      match: {
        channel: "telegram",
        accountId: "default",
        peer: { kind: "group", id: "-1001234567890:topic:42" },
      },
      acp: { cwd: "/workspace/repo-b" },
    },
    {
      type: "route",
      agentId: "main",
      match: { channel: "discord", accountId: "default" },
    },
    {
      type: "route",
      agentId: "main",
      match: { channel: "telegram", accountId: "default" },
    },
  ],
  channels: {
    discord: {
      guilds: {
        "111111111111111111": {
          channels: {
            "222222222222222222": { requireMention: false },
          },
        },
      },
    },
    telegram: {
      groups: {
        "-1001234567890": {
          topics: { "42": { requireMention: false } },
        },
      },
    },
  },
}
```

挙動:

- OpenClawは、設定されたACP sessionが使用前に存在することを保証します。
- そのchannelまたはtopic内のメッセージは、設定されたACP sessionへルーティングされます。
- バインド済み会話では、`/new`と`/reset`は同じACP session keyをその場でリセットします。
- 一時的なruntime binding（たとえばthread-focusフローで作成されるもの）は、存在する場合は引き続き適用されます。
- 明示的な`cwd`なしのクロスagent ACP spawnでは、OpenClawはagent設定から対象agent workspaceを継承します。
- 継承されたworkspace pathが存在しない場合はbackend default cwdへフォールバックし、存在しない以外のアクセス失敗はspawnエラーとして表面化します。

## ACP sessionを開始する（インターフェース）

### `sessions_spawn`から

agent turnまたはtool callからACP sessionを開始するには`runtime: "acp"`を使います。

```json
{
  "task": "Open the repo and summarize failing tests",
  "runtime": "acp",
  "agentId": "codex",
  "thread": true,
  "mode": "session"
}
```

注:

- `runtime`のデフォルトは`subagent`なので、ACP sessionには明示的に`runtime: "acp"`を設定してください。
- `agentId`が省略された場合、設定されていればOpenClawは`acp.defaultAgent`を使います。
- `mode: "session"`は、永続的なバインド済み会話を維持するために`thread: true`を必要とします。

インターフェース詳細:

- `task`（必須）: ACP sessionへ送られる初期プロンプト。
- `runtime`（ACPでは必須）: `"acp"`でなければなりません。
- `agentId`（任意）: ACP対象ハーネスid。設定されていれば`acp.defaultAgent`へフォールバックします。
- `thread`（任意、デフォルト`false`）: 対応時にthread bindingフローを要求します。
- `mode`（任意）: `run`（ワンショット）または`session`（永続的）。
  - デフォルトは`run`
  - `thread: true`でmodeが省略されている場合、runtime pathごとにOpenClawが永続動作をデフォルトにすることがあります
  - `mode: "session"`には`thread: true`が必要です
- `cwd`（任意）: 要求されるruntime working directory（backend/runtime policyで検証されます）。省略された場合、ACP spawnは設定されていれば対象agent workspaceを継承します。継承されたpathが存在しない場合はbackend defaultへフォールバックし、実際のアクセスエラーは返されます。
- `label`（任意）: session/bannerテキストで使われるoperator向けラベル。
- `resumeSessionId`（任意）: 新しいsessionを作成する代わりに既存ACP sessionを再開します。agentは`session/load`経由で会話履歴を再生します。`runtime: "acp"`が必要です。
- `streamTo`（任意）: `"parent"`は、初期ACP run進捗要約をsystem eventとしてrequester sessionへストリームします。
  - 利用可能な場合、受理レスポンスにはsessionスコープJSONLログ（`<sessionId>.acp-stream.jsonl`）を指す`streamLogPath`が含まれ、完全なrelay履歴をtailできます。
- `model`（任意）: ACP child session用の明示的model上書き。`runtime: "acp"`では反映されるため、childは対象agent defaultへ黙ってフォールバックせず、要求されたmodelを使います。

## 配信モデル

ACP sessionは、対話的workspaceにも、親所有のbackground workにもなりえます。配信経路はその形に依存します。

### 対話的ACP session

対話的sessionは、可視のチャットサーフェスで会話を続けるためのものです。

- `/acp spawn ... --bind here`は、現在の会話をACP sessionへバインドします。
- `/acp spawn ... --thread ...`は、channel thread/topicをACP sessionへバインドします。
- 永続設定の`bindings[].type="acp"`は、一致する会話を同じACP sessionへルーティングします。

バインド済み会話内のフォローアップメッセージはACP sessionへ直接ルーティングされ、ACP出力は同じchannel/thread/topicへ返されます。

### 親所有のワンショットACP session

別agent runによってspawnされたワンショットACP sessionは、sub-agentに似たbackground childです。

- 親が`sessions_spawn({ runtime: "acp", mode: "run" })`で作業を依頼します。
- childは独自のACP harness session内で実行されます。
- 完了は内部task-completion announce pathを通じて報告されます。
- ユーザー向け返信が有用な場合、親がchild結果を通常のassistant voiceで書き換えます。

この経路を親子間のpeer-to-peerチャットとして扱わないでください。childはすでに親への完了チャネルを持っています。

### `sessions_send`とA2A配信

`sessions_send`はspawn後に別sessionを対象にできます。通常のpeer sessionでは、OpenClawはメッセージ注入後にagent-to-agent（A2A）フォローアップ経路を使います。

- 対象sessionの返信を待つ
- 任意で、requesterとtargetに境界付き回数のフォローアップターン交換をさせる
- 対象にannounce messageを生成させる
- そのannounceを可視channelまたはthreadへ配信する

このA2A経路は、送信側が可視フォローアップを必要とするpeer sendに対するフォールバックです。たとえば広い`tools.sessions.visibility`設定下で、無関係なsessionがACP targetを見てメッセージを送れる場合でも有効のままです。

OpenClawは、requesterが自分自身の親所有ワンショットACP childの親である場合にのみ、A2Aフォローアップをスキップします。その場合、task completionの上にA2Aを実行すると、childの結果で親が起こされ、親の返信がchildへ戻され、親子echo loopが発生しえます。`sessions_send`結果は、そのowned-childケースで`delivery.status="skipped"`を報告します。結果はすでにcompletion pathが担当しているためです。

### 既存sessionを再開する

新しく始める代わりに以前のACP sessionを続けるには`resumeSessionId`を使います。agentは`session/load`経由で会話履歴を再生するため、前回までの完全なコンテキストを持って続きから始めます。

```json
{
  "task": "Continue where we left off — fix the remaining test failures",
  "runtime": "acp",
  "agentId": "codex",
  "resumeSessionId": "<previous-session-id>"
}
```

よくある用途:

- ノートPCからスマートフォンへCodex sessionを引き継ぐ — agentに前回の続きから始めるよう伝える
- CLIで対話的に始めたコーディングsessionを、今度はagent経由のheadlessで続ける
- gateway再起動やidle timeoutで中断された作業を引き継ぐ

注:

- `resumeSessionId`には`runtime: "acp"`が必要です — sub-agent runtimeで使うとエラーになります。
- `resumeSessionId`はupstream ACP会話履歴を復元します。`thread`と`mode`は、今作成している新しいOpenClaw sessionに対しては引き続き通常どおり適用されるため、`mode: "session"`には引き続き`thread: true`が必要です。
- 対象agentは`session/load`をサポートしている必要があります（CodexとClaude Codeは対応しています）。
- session IDが見つからない場合、spawnは明確なエラーで失敗し、新しいsessionへ黙ってフォールバックすることはありません。

<Accordion title="デプロイ後スモークテスト">

gatewayデプロイ後は、ユニットテストを信頼するのではなく、ライブのend-to-end確認を実行してください。

1. 対象host上で、デプロイ済みgatewayのバージョンとcommitを確認する。
2. ライブagentへの一時的なACPX bridge sessionを開く。
3. そのagentに、`runtime: "acp"`、`agentId: "codex"`、`mode: "run"`、task `Reply with exactly LIVE-ACP-SPAWN-OK`で`sessions_spawn`を呼ぶよう依頼する。
4. `accepted=yes`、実在する`childSessionKey`、validator errorなしを確認する。
5. 一時bridge sessionをクリーンアップする。

ゲートは`mode: "run"`のままにし、`streamTo: "parent"`はスキップしてください — thread-bound `mode: "session"`とstream-relay経路は別のより豊かな統合パスです。

</Accordion>

## サンドボックス互換性

現在、ACP sessionはOpenClaw sandbox内ではなく、host runtime上で実行されます。

現在の制限:

- requester sessionがsandbox化されている場合、ACP spawnは`sessions_spawn({ runtime: "acp" })`と`/acp spawn`の両方でブロックされます。
  - エラー: `Sandboxed sessions cannot spawn ACP sessions because runtime="acp" runs on the host. Use runtime="subagent" from sandboxed sessions.`
- `runtime: "acp"`を使う`sessions_spawn`は`sandbox: "require"`をサポートしません。
  - エラー: `sessions_spawn sandbox="require" is unsupported for runtime="acp" because ACP sessions run outside the sandbox. Use runtime="subagent" or sandbox="inherit".`

sandbox強制実行が必要な場合は`runtime: "subagent"`を使ってください。

### `/acp`コマンドから

チャットから明示的にoperator制御したい場合は`/acp spawn`を使います。

```text
/acp spawn codex --mode persistent --thread auto
/acp spawn codex --mode oneshot --thread off
/acp spawn codex --bind here
/acp spawn codex --thread here
```

主なフラグ:

- `--mode persistent|oneshot`
- `--bind here|off`
- `--thread auto|here|off`
- `--cwd <absolute-path>`
- `--label <name>`

[Slash Commands](/ja-JP/tools/slash-commands)を参照してください。

## session target解決

ほとんどの`/acp`アクションは、任意のsession target（`session-key`、`session-id`、または`session-label`）を受け付けます。

解決順:

1. 明示的target引数（または`/acp steer`用の`--session`）
   - まずkeyを試す
   - 次にUUID形式のsession id
   - 最後にlabel
2. 現在のthread binding（この会話/threadがACP sessionへバインドされている場合）
3. 現在のrequester sessionへのフォールバック

現在の会話bindingとthread bindingの両方が手順2に参加します。

targetが何も解決されない場合、OpenClawは明確なエラーを返します（`Unable to resolve session target: ...`）。

## spawn bindモード

`/acp spawn`は`--bind here|off`をサポートします。

| モード   | 挙動                                                               |
| ------ | ---------------------------------------------------------------------- |
| `here` | 現在アクティブな会話をその場でバインドします。アクティブな会話がない場合は失敗します。 |
| `off`  | 現在の会話bindingを作成しません。                          |

注:

- `--bind here`は、「このchannelまたはチャットをCodexバックendにする」ための最も簡単なoperator経路です。
- `--bind here`は子threadを作成しません。
- `--bind here`は、現在の会話binding対応を公開するチャネルでのみ利用可能です。
- `--bind`と`--thread`は同じ`/acp spawn`呼び出しで併用できません。

## spawn threadモード

`/acp spawn`は`--thread auto|here|off`をサポートします。

| モード   | 挙動                                                                                            |
| ------ | --------------------------------------------------------------------------------------------------- |
| `auto` | アクティブthread内ではそのthreadをバインドします。thread外では、対応していれば子threadを作成してバインドします。 |
| `here` | 現在のアクティブthreadを必須にします。thread内でなければ失敗します。                                                  |
| `off`  | bindingなし。sessionは未バインドで開始されます。                                                                 |

注:

- 非thread bindingサーフェスでは、デフォルト挙動は実質的に`off`です。
- thread-bound spawnにはチャネルポリシー対応が必要です:
  - Discord: `channels.discord.threadBindings.spawnAcpSessions=true`
  - Telegram: `channels.telegram.threadBindings.spawnAcpSessions=true`
- 子threadを作らずに現在の会話を固定したい場合は`--bind here`を使ってください。

## ACP制御

| コマンド              | 役割                                              | 例                                                       |
| -------------------- | --------------------------------------------------------- | ------------------------------------------------------------- |
| `/acp spawn`         | ACP sessionを作成。任意で現在のbindingまたはthread bindingを行う。 | `/acp spawn codex --bind here --cwd /repo`                    |
| `/acp cancel`        | 対象sessionの進行中ターンをキャンセルする。                 | `/acp cancel agent:codex:acp:<uuid>`                          |
| `/acp steer`         | 実行中sessionへsteer指示を送る。                | `/acp steer --session support inbox prioritize failing tests` |
| `/acp close`         | sessionを閉じ、thread targetのbindingを解除する。                  | `/acp close`                                                  |
| `/acp status`        | backend、mode、state、runtime option、capabilityを表示する。 | `/acp status`                                                 |
| `/acp set-mode`      | 対象sessionのruntime modeを設定する。                      | `/acp set-mode plan`                                          |
| `/acp set`           | 汎用runtime config optionを書き込む。                      | `/acp set model openai/gpt-5.4`                               |
| `/acp cwd`           | runtime working directory overrideを設定する。                   | `/acp cwd /Users/user/Projects/repo`                          |
| `/acp permissions`   | approval policy profileを設定する。                              | `/acp permissions strict`                                     |
| `/acp timeout`       | runtime timeout（秒）を設定する。                            | `/acp timeout 120`                                            |
| `/acp model`         | runtime model overrideを設定する。                               | `/acp model anthropic/claude-opus-4-6`                        |
| `/acp reset-options` | session runtime option overrideを削除する。                  | `/acp reset-options`                                          |
| `/acp sessions`      | storeから最近のACP sessionを一覧表示する。                      | `/acp sessions`                                               |
| `/acp doctor`        | backend health、capability、対処可能な修正を表示する。           | `/acp doctor`                                                 |
| `/acp install`       | 決定論的なinstallおよび有効化手順を表示する。             | `/acp install`                                                |

`/acp status`は、有効なruntime optionに加えて、runtimeレベルおよびbackendレベルのsession identifierを表示します。backendにcapabilityがない場合、未対応制御エラーは明確に表示されます。`/acp sessions`は、現在バインドされているsessionまたはrequester sessionのstoreを読み取ります。target token（`session-key`、`session-id`、`session-label`）は、agentごとのカスタム`session.store` rootを含むgateway session discoveryを通じて解決されます。

## runtime option対応表

`/acp`には便利コマンドと汎用setterがあります。

等価な操作:

- `/acp model <id>`はruntime config key `model`に対応します。
- `/acp permissions <profile>`はruntime config key `approval_policy`に対応します。
- `/acp timeout <seconds>`はruntime config key `timeout`に対応します。
- `/acp cwd <path>`はruntime cwd overrideを直接更新します。
- `/acp set <key> <value>`は汎用経路です。
  - 特別扱い: `key=cwd`はcwd override経路を使います。
- `/acp reset-options`は、対象sessionのすべてのruntime overrideをクリアします。

## acpxハーネス、plugin setup、permissions

acpxハーネス設定（Claude Code / Codex / Gemini CLI alias）、
plugin-toolsおよびOpenClaw-tools MCP bridge、ACP permission modeについては、
[ACP agents — setup](/ja-JP/tools/acp-agents-setup)を参照してください。

## トラブルシューティング

| 症状                                                                     | 起こりやすい原因                                                                    | 修正                                                                                                                                                                      |
| --------------------------------------------------------------------------- | ------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `ACP runtime backend is not configured`                                     | backend pluginが存在しないか無効。                                             | backend pluginをインストールして有効化し、その後`/acp doctor`を実行してください。                                                                                                               |
| `ACP is disabled by policy (acp.enabled=false)`                             | ACPが全体で無効。                                                          | `acp.enabled=true`を設定してください。                                                                                                                                                  |
| `ACP dispatch is disabled by policy (acp.dispatch.enabled=false)`           | 通常thread messageからのdispatchが無効。                                  | `acp.dispatch.enabled=true`を設定してください。                                                                                                                                         |
| `ACP agent "<id>" is not allowed by policy`                                 | agentがallowlistにない。                                                         | 許可された`agentId`を使うか、`acp.allowedAgents`を更新してください。                                                                                                                     |
| `Unable to resolve session target: ...`                                     | key/id/label tokenが不正。                                                         | `/acp sessions`を実行して正確なkey/labelをコピーし、再試行してください。                                                                                                                        |
| `--bind here requires running /acp spawn inside an active ... conversation` | `--bind here`がアクティブなバインド可能会話なしで使われた。                     | 対象チャット/チャネルへ移動して再試行するか、unbound spawnを使ってください。                                                                                                         |
| `Conversation bindings are unavailable for <channel>.`                      | adapterに現在の会話ACP binding capabilityがない。                      | 対応している場合は`/acp spawn ... --thread ...`を使うか、トップレベル`bindings[]`を設定するか、対応チャネルへ移動してください。                                                     |
| `--thread here requires running /acp spawn inside an active ... thread`     | `--thread here`がthread context外で使われた。                                  | 対象threadへ移動するか、`--thread auto`/`off`を使ってください。                                                                                                                      |
| `Only <user-id> can rebind this channel/conversation/thread.`               | 別ユーザーがアクティブbinding targetを所有している。                                    | 所有者として再バインドするか、別の会話またはthreadを使ってください。                                                                                                               |
| `Thread bindings are unavailable for <channel>.`                            | adapterにthread binding capabilityがない。                                        | `--thread off`を使うか、対応adapter/channelへ移動してください。                                                                                                                 |
| `Sandboxed sessions cannot spawn ACP sessions ...`                          | ACP runtimeはhost側であり、requester sessionがsandbox化されている。                       | sandbox化sessionからは`runtime="subagent"`を使うか、sandbox化されていないsessionからACP spawnを実行してください。                                                                         |
| `sessions_spawn sandbox="require" is unsupported for runtime="acp" ...`     | ACP runtimeに対して`sandbox="require"`が要求された。                                  | sandboxを必須にするには`runtime="subagent"`を使うか、sandbox化されていないsessionから`runtime="acp"`と`sandbox="inherit"`を使ってください。                                                      |
| bound sessionにACP metadataがない                                      | ACP session metadataが古い/削除済み。                                             | `/acp spawn`で再作成し、その後threadを再バインド/フォーカスしてください。                                                                                                                    |
| `AcpRuntimeError: Permission prompt unavailable in non-interactive mode`    | `permissionMode`が非対話ACP sessionでwrite/execをブロックしている。             | `plugins.entries.acpx.config.permissionMode`を`approve-all`に設定し、gatewayを再起動してください。[Permission configuration](/ja-JP/tools/acp-agents-setup#permission-configuration)を参照してください。 |
| ACP sessionがほとんど出力なく早期に失敗する                                  | permission promptが`permissionMode`/`nonInteractivePermissions`によってブロックされている。 | `AcpRuntimeError`についてgatewayログを確認してください。完全権限には`permissionMode=approve-all`を、穏当な劣化動作には`nonInteractivePermissions=deny`を設定してください。        |
| 作業完了後もACP sessionが無期限に停止する                       | harness processは終了したが、ACP sessionが完了を報告しなかった。             | `ps aux \| grep acpx`で監視し、古いprocessを手動でkillしてください。                                                                                                       |

## 関連

- [Sub-agents](/ja-JP/tools/subagents)
- [Multi-agent sandbox tools](/ja-JP/tools/multi-agent-sandbox-tools)
- [Agent send](/ja-JP/tools/agent-send)
