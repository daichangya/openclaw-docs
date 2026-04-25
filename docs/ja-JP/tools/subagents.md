---
read_when:
    - agent経由でバックグラウンド/並列作業を行いたい場合
    - sessions_spawnまたはsub-agent toolポリシーを変更している場合
    - threadにバインドされたsubagent sessionを実装またはトラブルシューティングしている場合
summary: 'Sub-agents: 結果をリクエスターのチャットへ通知して返す、分離されたエージェント実行のspawn'
title: Sub-agents
x-i18n:
    generated_at: "2026-04-25T14:01:55Z"
    model: gpt-5.4
    provider: openai
    source_hash: b262edf46b9c823dcf0ad6514e560d2d1a718e9081015ea8bb5c081206b88fce
    source_path: tools/subagents.md
    workflow: 15
---

Sub-agentは、既存のagent runからspawnされるバックグラウンドagent runです。これらは独自のsession（`agent:<agentId>:subagent:<uuid>`）で実行され、完了すると、結果をリクエスターのチャットチャネルへ**通知**して返します。各sub-agent runは[background task](/ja-JP/automation/tasks)として追跡されます。

## スラッシュコマンド

**現在のsession**のsub-agent runを確認または制御するには`/subagents`を使います。

- `/subagents list`
- `/subagents kill <id|#|all>`
- `/subagents log <id|#> [limit] [tools]`
- `/subagents info <id|#>`
- `/subagents send <id|#> <message>`
- `/subagents steer <id|#> <message>`
- `/subagents spawn <agentId> <task> [--model <model>] [--thinking <level>]`

thread binding制御:

これらのコマンドは、永続的なthread bindingをサポートするチャネルで動作します。詳細は以下の**スレッド対応チャネル**を参照してください。

- `/focus <subagent-label|session-key|session-id|session-label>`
- `/unfocus`
- `/agents`
- `/session idle <duration|off>`
- `/session max-age <duration|off>`

`/subagents info`は、run metadata（status、timestamp、session id、transcript path、cleanup）を表示します。
制限付きで安全フィルタ済みの再確認ビューには`sessions_history`を使ってください。rawな完全transcriptが必要な場合は、ディスク上のtranscript pathを確認してください。

### spawnの挙動

`/subagents spawn`は、内部relayではなくユーザーコマンドとしてバックグラウンドsub-agentを開始し、run完了時に1つの最終完了更新をリクエスターのチャットへ送り返します。

- spawnコマンドは非ブロッキングです。即座にrun idを返します。
- 完了時、sub-agentは要約/結果メッセージをリクエスターのチャットチャネルへ通知します。
- 完了はpushベースです。spawn後は、完了待ちのためだけに
  `/subagents list`、
  `sessions_list`、または`sessions_history`をループでポーリングしないでください。
  status確認はデバッグや介入が必要なときだけにしてください。
- 完了時、OpenClawはベストエフォートで、そのsub-agent sessionが開いた追跡対象ブラウザタブ/プロセスを閉じてからannounce cleanupフローを続けます。
- 手動spawnでは、配信は耐障害性があります:
  - まず安定したidempotency keyで直接`agent`配信を試みます。
  - 直接配信が失敗した場合、queue routingへフォールバックします。
  - queue routingも利用できない場合、最終的に諦める前に、短い指数バックオフでannounceを再試行します。
- 完了配信では、解決済みrequester routeを保持します:
  - 利用可能であれば、thread-boundまたはconversation-bound完了routeが優先されます
  - 完了元がchannelしか提供しない場合、OpenClawはrequester sessionの解決済みroute（`lastChannel` / `lastTo` / `lastAccountId`）から不足しているtarget/accountを補完するため、直接配信は引き続き機能します
- requester sessionへの完了handoffは、ランタイム生成の内部コンテキスト（ユーザー作成テキストではない）で、次を含みます:
  - `Result`（最新の可視`assistant`返信テキスト。なければsanitize済みの最新tool/toolResultテキスト。失敗で終了したrunでは取得済み返信テキストを再利用しません）
  - `Status`（`completed successfully` / `failed` / `timed out` / `unknown`）
  - 簡潔なruntime/token統計
  - requester agentに、raw内部metadataをそのまま転送せず、通常のassistant voiceで書き換えるよう伝える配信指示
- `--model`と`--thinking`は、その特定runのdefaultを上書きします。
- 完了後の詳細や出力確認には`info`/`log`を使ってください。
- `/subagents spawn`はワンショットモード（`mode: "run"`）です。永続的なthread-bound sessionには、`thread: true`と`mode: "session"`を指定した`sessions_spawn`を使ってください。
- ACPハーネスsession（Codex、Claude Code、Gemini CLI）には、`runtime: "acp"`付きの`sessions_spawn`を使い、完了やagent-to-agentループをデバッグする際は特に[ACP Agents](/ja-JP/tools/acp-agents)の[ACP delivery model](/ja-JP/tools/acp-agents#delivery-model)を参照してください。

主な目的:

- メインrunをブロックせずに、「調査 / 長時間タスク / 遅いtool」作業を並列化する。
- デフォルトでsub-agentを分離したままにする（session分離 + 任意のsandbox化）。
- toolサーフェスを誤用しにくく保つ: sub-agentはデフォルトではsession toolを**受け取りません**。
- orchestratorパターン向けに、設定可能なネスト深度をサポートする。

コスト注記: 各sub-agentは、デフォルトで**独自の**contextとtoken usageを持ちます。重いまたは
繰り返しの多いタスクでは、sub-agentにはより安価なmodelを設定し、メインagentは
高品質なmodelのままにしてください。これは`agents.defaults.subagents.model`またはagentごとの
上書きで設定できます。childが本当にrequesterの現在transcriptを必要とする場合、agentは
そのspawnに限り`context: "fork"`を要求できます。

## コンテキストモード

ネイティブsub-agentは、呼び出し元が明示的に現在の
transcriptをforkするよう要求しない限り、分離されて開始されます。

| モード       | 使用する場面                                                                                                                         | 挙動                                                                          |
| ---------- | -------------------------------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------- |
| `isolated` | 新しい調査、独立した実装、遅いtool作業、またはタスク本文で簡潔に説明できるもの                           | 新しいchild transcriptを作成します。これがデフォルトで、token使用量も低く抑えられます。  |
| `fork`     | 現在の会話、過去のtool結果、またはrequester transcript内にすでに存在する微妙な指示に依存する作業 | requester transcriptをchild sessionへ分岐してからchildを開始します。 |

`fork`は控えめに使ってください。これはコンテキスト依存の委譲用であり、
明確なタスクプロンプトを書くことの代わりではありません。

## ツール

`sessions_spawn`を使います:

- sub-agent runを開始します（`deliver: false`、グローバルレーン: `subagent`）
- その後announceステップを実行し、announce返信をrequester chat channelへ投稿します
- デフォルトmodel: `agents.defaults.subagents.model`（またはagentごとの`agents.list[].subagents.model`）を設定しない限り呼び出し元を継承します。明示的な`sessions_spawn.model`は引き続き最優先です。
- デフォルトthinking: `agents.defaults.subagents.thinking`（またはagentごとの`agents.list[].subagents.thinking`）を設定しない限り呼び出し元を継承します。明示的な`sessions_spawn.thinking`は引き続き最優先です。
- デフォルトrun timeout: `sessions_spawn.runTimeoutSeconds`が省略された場合、OpenClawは設定されていれば`agents.defaults.subagents.runTimeoutSeconds`を使い、そうでなければ`0`（timeoutなし）へフォールバックします。

tool param:

- `task`（必須）
- `label?`（任意）
- `agentId?`（任意; 許可されていれば別agent id配下でspawn）
- `model?`（任意; sub-agent modelを上書きします。無効な値はスキップされ、sub-agentはtool結果内の警告付きでdefault modelで実行されます）
- `thinking?`（任意; sub-agent runのthinking levelを上書き）
- `runTimeoutSeconds?`（設定されていれば`agents.defaults.subagents.runTimeoutSeconds`、そうでなければ`0`がデフォルト。設定した場合、sub-agent runはN秒後に中断されます）
- `thread?`（デフォルト`false`; `true`の場合、このsub-agent sessionに対してchannel thread bindingを要求します）
- `mode?`（`run|session`）
  - デフォルトは`run`
  - `thread: true`で`mode`が省略された場合、デフォルトは`session`になります
  - `mode: "session"`には`thread: true`が必要です
- `cleanup?`（`delete|keep`, デフォルト`keep`）
- `sandbox?`（`inherit|require`, デフォルト`inherit`; `require`は対象child runtimeがsandbox化されていなければspawnを拒否します）
- `context?`（`isolated|fork`, デフォルト`isolated`; ネイティブsub-agentのみ）
  - `isolated`は新しいchild transcriptを作成し、これがデフォルトです。
  - `fork`はrequesterの現在transcriptをchild sessionへ分岐させるため、childは同じ会話コンテキストで開始します。
  - childが現在transcriptを必要とする場合にのみ`fork`を使ってください。範囲が限定された作業では`context`を省略してください。
- `sessions_spawn`はchannel-delivery param（`target`、`channel`、`to`、`threadId`、`replyTo`、`transport`）を受け付けません。配信には、spawnされたrun側から`message`/`sessions_send`を使ってください。

## threadにバインドされたセッション

チャネルでthread bindingが有効になっている場合、sub-agentはthreadへバインドされたままにできるため、そのthread内のフォローアップユーザーメッセージは同じsub-agent sessionへルーティングされ続けます。

### スレッド対応チャネル

- Discord（現在サポートされている唯一のチャネル）: 永続的なthread-bound subagent session（`thread: true`付きの`sessions_spawn`）、手動thread制御（`/focus`、`/unfocus`、`/agents`、`/session idle`、`/session max-age`）、およびadapter key `channels.discord.threadBindings.enabled`, `channels.discord.threadBindings.idleHours`, `channels.discord.threadBindings.maxAgeHours`, `channels.discord.threadBindings.spawnSubagentSessions`をサポートします。

簡単な流れ:

1. `thread: true`（必要なら`mode: "session"`も）を指定して`sessions_spawn`でspawnする。
2. OpenClawがアクティブchannel内のthreadをそのsession targetへ作成またはバインドする。
3. そのthread内の返信およびフォローアップメッセージは、バインド済みsessionへルーティングされる。
4. `/session idle`で非アクティブによる自動unfocusを確認/更新し、`/session max-age`でハード上限を制御する。
5. 手動で解除するには`/unfocus`を使う。

手動制御:

- `/focus <target>`は、現在のthreadをsub-agent/session targetへバインドします（または作成します）。
- `/unfocus`は、現在バインドされているthreadのbindingを削除します。
- `/agents`は、アクティブrunとbinding状態（`thread:<id>`または`unbound`）を一覧表示します。
- `/session idle`と`/session max-age`は、フォーカスされたバインド済みthreadに対してのみ動作します。

設定スイッチ:

- グローバルデフォルト: `session.threadBindings.enabled`, `session.threadBindings.idleHours`, `session.threadBindings.maxAgeHours`
- channel overrideとspawn auto-bind keyはadapter固有です。詳細は上記の**スレッド対応チャネル**を参照してください。

現在のadapter詳細については[Configuration Reference](/ja-JP/gateway/configuration-reference)と[Slash commands](/ja-JP/tools/slash-commands)を参照してください。

allowlist:

- `agents.list[].subagents.allowAgents`: `agentId`経由で対象にできるagent id一覧（任意を許可するには`["*"]`）。デフォルト: requester agentのみ。
- `agents.defaults.subagents.allowAgents`: requester agentが自分の`subagents.allowAgents`を設定していない場合に使われる、デフォルトの対象agent allowlist。
- sandbox継承ガード: requester sessionがsandbox化されている場合、`sessions_spawn`はsandbox化されずに実行されるtargetを拒否します。
- `agents.defaults.subagents.requireAgentId` / `agents.list[].subagents.requireAgentId`: trueの場合、`agentId`を省略した`sessions_spawn`呼び出しをブロックします（明示的なprofile選択を強制）。デフォルト: false。

discovery:

- `sessions_spawn`で現在どのagent idが許可されているかを見るには`agents_list`を使ってください。

自動アーカイブ:

- Sub-agent sessionは`agents.defaults.subagents.archiveAfterMinutes`後に自動アーカイブされます（デフォルト: 60）。
- アーカイブには`sessions.delete`が使われ、transcriptは`*.deleted.<timestamp>`へリネームされます（同じフォルダー）。
- `cleanup: "delete"`はannounce直後に即時アーカイブします（それでもrenameによりtranscriptは保持されます）。
- 自動アーカイブはベストエフォートです。保留中timerはgateway再起動で失われます。
- `runTimeoutSeconds`は自動アーカイブしません。停止するだけです。session自体は自動アーカイブまで残ります。
- 自動アーカイブはdepth-1とdepth-2のsessionに等しく適用されます。
- ブラウザcleanupはアーカイブcleanupとは別です: transcript/session recordを保持する場合でも、追跡対象ブラウザタブ/プロセスはrun完了時にベストエフォートで閉じられます。

## ネストされたsub-agent

デフォルトでは、sub-agentは自分自身のsub-agentをspawnできません（`maxSpawnDepth: 1`）。`maxSpawnDepth: 2`を設定すると1段のネストを有効にでき、**orchestratorパターン**を実現できます: main → orchestrator sub-agent → worker sub-sub-agent。

### 有効にする方法

```json5
{
  agents: {
    defaults: {
      subagents: {
        maxSpawnDepth: 2, // sub-agentがchildをspawn可能にする（デフォルト: 1）
        maxChildrenPerAgent: 5, // agent sessionごとのアクティブchild最大数（デフォルト: 5）
        maxConcurrent: 8, // グローバル同時実行レーン上限（デフォルト: 8）
        runTimeoutSeconds: 900, // 省略時のsessions_spawn用デフォルトtimeout（0 = timeoutなし）
      },
    },
  },
}
```

### 深度レベル

| 深度 | Session keyの形                            | 役割                                          | Spawn可能か                   |
| ----- | -------------------------------------------- | --------------------------------------------- | ---------------------------- |
| 0     | `agent:<id>:main`                            | メインagent                                    | 常に可能                       |
| 1     | `agent:<id>:subagent:<uuid>`                 | Sub-agent（depth 2許可時はorchestrator） | `maxSpawnDepth >= 2`の場合のみ |
| 2     | `agent:<id>:subagent:<uuid>:subagent:<uuid>` | Sub-sub-agent（leaf worker）                   | 不可                        |

### announceチェーン

結果はチェーンを上に流れます。

1. depth-2 workerが完了 → 親（depth-1 orchestrator）へ通知
2. depth-1 orchestratorが通知を受け取り、結果を統合して完了 → mainへ通知
3. Main agentが通知を受け取り、ユーザーへ配信

各レベルが見るのは、自分の直下のchildからの通知だけです。

運用ガイダンス:

- `sessions_list`、`sessions_history`、`/subagents list`、または
  `exec`のsleepコマンドを使ってポーリングループを組むのではなく、一度child作業を開始したら完了イベントを待ってください。
- `sessions_list`と`/subagents list`は、child-session関係を
  現在進行中の作業に集中させます: 生きているchildは関連付けを維持し、終了済みchildは
  短い最近期間のあいだ可視のまま残り、古いstore-only child linkは
  その鮮度ウィンドウを過ぎると無視されます。これにより、古い`spawnedBy` / `parentSessionKey` metadataが
  再起動後に幽霊childを蘇らせるのを防ぎます。
- すでに最終回答を送った後にchild完了イベントが到着した場合、
  正しいフォローアップは、厳密にサイレントトークン`NO_REPLY` / `no_reply`です。

### 深度ごとのtoolポリシー

- roleとcontrol scopeはspawn時にsession metadataへ書き込まれます。これにより、平坦化または復元されたsession keyが誤ってorchestrator権限を取り戻すことを防ぎます。
- **Depth 1（orchestrator、`maxSpawnDepth >= 2`の場合）**: child管理のために`sessions_spawn`、`subagents`、`sessions_list`、`sessions_history`を取得します。その他のsession/system toolは引き続き拒否されます。
- **Depth 1（leaf、`maxSpawnDepth == 1`の場合）**: session toolなし（現在のデフォルト挙動）。
- **Depth 2（leaf worker）**: session toolなし — depth 2では`sessions_spawn`は常に拒否されます。これ以上のchildはspawnできません。

### agentごとのspawn上限

各agent session（任意の深度）は、一度に最大`maxChildrenPerAgent`（デフォルト: 5）個までのアクティブchildを持てます。これにより、単一orchestratorからの暴走fan-outを防ぎます。

### cascade stop

depth-1 orchestratorを停止すると、そのdepth-2 childも自動停止します。

- メインチャットで`/stop`を送ると、すべてのdepth-1 agentが停止し、そのdepth-2 childにもcascadeします。
- `/subagents kill <id>`は、特定sub-agentを停止し、そのchildにもcascadeします。
- `/subagents kill all`は、requesterのすべてのsub-agentを停止し、cascadeします。

## 認証

Sub-agent authは、session typeではなく**agent id**で解決されます。

- sub-agent session keyは`agent:<agentId>:subagent:<uuid>`です。
- auth storeは、そのagentの`agentDir`から読み込まれます。
- メインagentのauth profileは**フォールバック**としてマージされます。競合時はagent profileがmain profileを上書きします。

注: マージは加法的なので、main profileは常にフォールバックとして利用可能です。agentごとの完全分離authはまだサポートされていません。

## 通知

Sub-agentはannounceステップを通じて結果を返します。

- announceステップはsub-agent session内で実行されます（requester sessionではありません）。
- sub-agentが厳密に`ANNOUNCE_SKIP`で返した場合、何も投稿されません。
- 最新assistant textが厳密にサイレントトークン`NO_REPLY` / `no_reply`の場合、
  たとえそれ以前に可視の進捗があってもannounce出力は抑制されます。
- それ以外の場合、配信はrequester深度に依存します:
  - トップレベルrequester sessionは、外部配信付きのフォローアップ`agent` callを使います（`deliver=true`）
  - ネストされたrequester subagent sessionは、内部フォローアップ注入を受け取ります（`deliver=false`）。これによりorchestratorがsession内でchild結果を統合できます
  - ネストされたrequester subagent sessionが消えている場合、OpenClawは可能ならそのsessionのrequesterへフォールバックします
- トップレベルrequester sessionでは、completion-mode direct deliveryはまず任意のバインド済みconversation/thread routeとhook overrideを解決し、その後requester sessionの保存済みrouteから不足するchannel-target fieldを補完します。これにより、完了元がchannelだけを識別している場合でも、completionは正しいchat/topic上に保たれます。
- ネストされた完了情報の集約は、現在のrequester runに限定されており、古い過去runのchild出力が現在のannounceへ漏れないようになっています。
- announce返信は、channel adapter上で利用可能な場合、thread/topic routingを保持します。
- announce contextは、安定した内部イベントブロックへ正規化されます:
  - source（`subagent`または`cron`）
  - child session key/id
  - announce type + task label
  - runtime outcomeから導出されたstatus line（`success`, `error`, `timeout`, または`unknown`）
  - 最新の可視assistant textから選ばれたresult内容。なければsanitize済みの最新tool/toolResult text。失敗で終了したrunは、取得済み返信テキストを再生せずにfailure statusを報告します
  - 返信すべきか沈黙すべきかを記述したフォローアップ指示
- `Status`はmodel出力から推測されません。runtime outcome signalから来ます。
- timeout時、childがtool callまでしか進んでいない場合、announceはraw tool出力を再生せず、短い部分進捗要約へ折りたたむことがあります。

announce payloadには、末尾にstats行が含まれます（ラップされていても）。

- Runtime（例: `runtime 5m12s`）
- Token usage（input/output/total）
- model pricingが設定されている場合の推定コスト（`models.providers.*.models[].cost`）
- `sessionKey`、`sessionId`、transcript path（main agentが`sessions_history`経由で履歴取得したり、ディスク上のファイルを確認したりできるように）
- 内部metadataはオーケストレーション専用です。ユーザー向け返信は通常のassistant voiceで書き換えるべきです。

`sessions_history`は、より安全なオーケストレーション経路です。

- assistant recallはまず正規化されます:
  - thinking tagは除去される
  - `<relevant-memories>` / `<relevant_memories>` scaffold blockは除去される
  - `<tool_call>...</tool_call>`,
    `<function_call>...</function_call>`, `<tool_calls>...</tool_calls>`, および
    `<function_calls>...</function_calls>`のようなplain-text tool-call XML payload blockは、
    正しく閉じない切り詰めpayloadを含めて除去される
  - 劣化したtool-call/result scaffoldとhistorical-context markerは除去される
  - `<|assistant|>`、その他のASCII
    `<|...|>` token、および全角の`<｜...｜>` variantのような漏れたmodel control tokenは除去される
  - 不正なMiniMax tool-call XMLは除去される
- credential/token風のテキストはマスキングされる
- 長いblockは切り詰められることがある
- 非常に大きな履歴では古い行が落とされたり、巨大すぎる行が
  `[sessions_history omitted: message too large]`に置き換えられたりする
- 完全にバイト単位で一致するtranscriptが必要な場合は、ディスク上のraw transcript確認がフォールバックです

## toolポリシー（sub-agent tool）

デフォルトでは、sub-agentは**session tool**とsystem toolを除く**すべてのtool**を取得します。

- `sessions_list`
- `sessions_history`
- `sessions_send`
- `sessions_spawn`

ここでも`sessions_history`は境界付き・sanitize済みの再確認ビューであり、
raw transcript dumpではありません。

`maxSpawnDepth >= 2`の場合、depth-1 orchestrator sub-agentはさらに`sessions_spawn`, `subagents`, `sessions_list`, `sessions_history`を受け取り、childを管理できるようになります。

configで上書きできます。

```json5
{
  agents: {
    defaults: {
      subagents: {
        maxConcurrent: 1,
      },
    },
  },
  tools: {
    subagents: {
      tools: {
        // denyが優先
        deny: ["gateway", "cron"],
        // allowを設定するとallow-onlyになる（denyは引き続き優先）
        // allow: ["read", "exec", "process"]
      },
    },
  },
}
```

## 同時実行

Sub-agentは専用のプロセス内queue laneを使います。

- Lane名: `subagent`
- 同時実行数: `agents.defaults.subagents.maxConcurrent`（デフォルト`8`）

## livenessと復旧

OpenClawは、`endedAt`が存在しないことを、そのsub-agentがまだ
生きていることの恒久的証拠とは扱いません。古い未終了runは
stale-run windowを超えると、`/subagents list`、status summary、descendant completion
gating、セッションごとの同時実行チェックでactive/pendingとして数えられなくなります。

gateway再起動後、古い未終了の復元runは、その
child sessionに`abortedLastRun: true`が付いていない限り剪定されます。それらの再起動中断child
sessionは、sub-agent orphan recoveryフローを通じて引き続き復旧可能であり、
中断マーカーを消す前に合成resumeメッセージを送信します。

## 停止

- requester chatで`/stop`を送ると、requester sessionが中断され、そこからspawnされたアクティブsub-agent runも停止し、ネストされたchildへcascadeします。
- `/subagents kill <id>`は、特定sub-agentを停止し、そのchildにもcascadeします。

## 制限

- Sub-agent announceは**ベストエフォート**です。gatewayが再起動すると、保留中の「通知返し」作業は失われます。
- Sub-agentは引き続き同じgateway process資源を共有するため、`maxConcurrent`は安全弁として扱ってください。
- `sessions_spawn`は常に非ブロッキングです: すぐに`{ status: "accepted", runId, childSessionKey }`を返します。
- Sub-agent contextでは`AGENTS.md` + `TOOLS.md`のみが注入されます（`SOUL.md`、`IDENTITY.md`, `USER.md`, `HEARTBEAT.md`, `BOOTSTRAP.md`は含まれません）。
- 最大ネスト深度は5です（`maxSpawnDepth`範囲: 1–5）。ほとんどの用途ではdepth 2を推奨します。
- `maxChildrenPerAgent`は、sessionごとのアクティブchild数を制限します（デフォルト: 5、範囲: 1–20）。

## 関連

- [ACP agents](/ja-JP/tools/acp-agents)
- [Multi-agent sandbox tools](/ja-JP/tools/multi-agent-sandbox-tools)
- [Agent send](/ja-JP/tools/agent-send)
