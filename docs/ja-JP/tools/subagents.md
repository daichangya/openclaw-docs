---
read_when:
    - agent 経由でバックグラウンド/並列作業を行いたい場合
    - '`sessions_spawn` または sub-agent の tool policy を変更している場合'
    - スレッドに bind された subagent session を実装またはトラブルシュートしている場合
summary: 'sub-agent: 分離された agent 実行を起動し、その結果を要求元チャットに通知する機能'
title: Sub-Agents
x-i18n:
    generated_at: "2026-04-22T04:28:57Z"
    model: gpt-5.4
    provider: openai
    source_hash: ef8d8faa296bdc1b56079bd4a24593ba2e1aa02b9929a7a191b0d8498364ce4e
    source_path: tools/subagents.md
    workflow: 15
---

# Sub-Agents

Sub-Agents は、既存の agent 実行から起動されるバックグラウンド agent 実行です。独自の session（`agent:<agentId>:subagent:<uuid>`）で動作し、完了すると、その結果を要求元チャット channel に **通知** します。各 Sub-Agent 実行は [background task](/ja-JP/automation/tasks) として追跡されます。

## スラッシュコマンド

現在の session の Sub-Agent 実行を確認または制御するには `/subagents` を使用します。

- `/subagents list`
- `/subagents kill <id|#|all>`
- `/subagents log <id|#> [limit] [tools]`
- `/subagents info <id|#>`
- `/subagents send <id|#> <message>`
- `/subagents steer <id|#> <message>`
- `/subagents spawn <agentId> <task> [--model <model>] [--thinking <level>]`

スレッド binding 制御:

これらのコマンドは、永続的なスレッド binding をサポートする channel で動作します。下の **スレッド対応 channel** を参照してください。

- `/focus <subagent-label|session-key|session-id|session-label>`
- `/unfocus`
- `/agents`
- `/session idle <duration|off>`
- `/session max-age <duration|off>`

`/subagents info` は実行 metadata（status、timestamp、session id、transcript path、cleanup）を表示します。  
制限付きで安全フィルタされた再確認ビューには `sessions_history` を使用し、生の完全 transcript が必要な場合はディスク上の transcript path を確認してください。

### 起動動作

`/subagents spawn` は、内部 relay ではなくユーザーコマンドとしてバックグラウンド Sub-Agent を開始し、実行完了時に要求元チャットへ 1 回の最終完了更新を送信します。

- spawn コマンドは非ブロッキングで、直ちに run id を返します。
- 完了時、Sub-Agent は要求元チャット channel に要約/結果メッセージを通知します。
- 完了通知は push ベースです。いったん起動したら、完了待ちのためだけに `/subagents list`、`sessions_list`、`sessions_history` をループでポーリングしないでください。status の確認はデバッグや介入が必要なときだけオンデマンドで行ってください。
- 完了時、OpenClaw は、その Sub-Agent session が開いた追跡対象の browser tab/process を、通知 cleanup フローを続行する前にベストエフォートで閉じます。
- 手動 spawn では、配信は耐障害性を持ちます:
  - OpenClaw はまず安定した idempotency key を使って直接 `agent` 配信を試みます。
  - 直接配信が失敗した場合は queue routing にフォールバックします。
  - queue routing も利用できない場合、最終的に諦める前に短い指数バックオフ付きで通知を再試行します。
- 完了配信は、解決済みの要求元ルートを維持します:
  - 利用可能なら、スレッドに bind された、または conversation に bind された完了ルートが優先されます
  - 完了元が channel だけを提供する場合、OpenClaw は要求元 session の解決済みルート（`lastChannel` / `lastTo` / `lastAccountId`）から不足する target/account を補い、直接配信が引き続き動作するようにします
- 要求元 session への完了 handoff は、runtime で生成された内部コンテキスト（ユーザー記述テキストではない）であり、次を含みます:
  - `Result`（最新の表示可能 `assistant` 返信テキスト。なければサニタイズ済みの最新 `tool`/`toolResult` テキスト。失敗で終了した実行では取得済み返信テキストを再利用しません）
  - `Status`（`completed successfully` / `failed` / `timed out` / `unknown`）
  - 簡潔な runtime/token 統計
  - 要求元 agent に、内部 metadata をそのまま転送せず、通常の assistant の口調で書き換えるよう指示する delivery instruction
- `--model` と `--thinking` は、その実行に対してのみデフォルトを上書きします。
- 完了後の詳細と出力の確認には `info` / `log` を使用してください。
- `/subagents spawn` は one-shot mode（`mode: "run"`）です。永続的なスレッド bind session には、`thread: true` と `mode: "session"` を指定した `sessions_spawn` を使用してください。
- ACP harness session（Codex、Claude Code、Gemini CLI）では、`runtime: "acp"` を指定した `sessions_spawn` を使用し、特に完了通知や agent 間ループをデバッグするときは [ACP Agents](/ja-JP/tools/acp-agents) の [ACP delivery model](/ja-JP/tools/acp-agents#delivery-model) を参照してください。

主な目標:

- main run をブロックせずに「調査 / 長時間タスク / 遅い tool」作業を並列化する
- デフォルトで Sub-Agent を分離する（session 分離 + オプションの sandbox 化）
- tool 面を誤用しにくく保つ: Sub-Agents はデフォルトで session tool を持ちません
- オーケストレーターパターン向けに、設定可能なネスト深度をサポートする

コスト注意: 各 Sub-Agent は**独自の**コンテキストと token 使用量を持ちます。重い、または繰り返しのタスクでは、Sub-Agent 用にはより安価な model を設定し、main agent には高品質 model を維持してください。これは `agents.defaults.subagents.model` または agent ごとの上書きで設定できます。

## tool

`sessions_spawn` を使用します。

- Sub-Agent 実行を開始します（`deliver: false`、グローバル lane: `subagent`）
- その後、通知ステップを実行し、通知返信を要求元チャット channel に投稿します
- デフォルト model: `agents.defaults.subagents.model`（または agent ごとの `agents.list[].subagents.model`）を設定しない限り、呼び出し元を継承します。明示的な `sessions_spawn.model` がある場合はそれが優先されます。
- デフォルト thinking: `agents.defaults.subagents.thinking`（または agent ごとの `agents.list[].subagents.thinking`）を設定しない限り、呼び出し元を継承します。明示的な `sessions_spawn.thinking` がある場合はそれが優先されます。
- デフォルト実行タイムアウト: `sessions_spawn.runTimeoutSeconds` を省略した場合、OpenClaw は設定されていれば `agents.defaults.subagents.runTimeoutSeconds` を使用し、そうでなければ `0`（タイムアウトなし）にフォールバックします。

tool パラメータ:

- `task`（必須）
- `label?`（オプション）
- `agentId?`（オプション。許可されていれば別の agent id 配下で起動）
- `model?`（オプション。Sub-Agent model を上書き。無効な値はスキップされ、Sub-Agent はデフォルト model で実行され、tool result に warning が出ます）
- `thinking?`（オプション。Sub-Agent 実行の thinking level を上書き）
- `runTimeoutSeconds?`（設定されていれば `agents.defaults.subagents.runTimeoutSeconds`、そうでなければ `0` がデフォルト。設定時は N 秒後に Sub-Agent 実行を中断）
- `thread?`（デフォルト `false`。`true` の場合、この Sub-Agent session に対する channel スレッド binding を要求）
- `mode?`（`run|session`）
  - デフォルトは `run`
  - `thread: true` で `mode` を省略した場合、デフォルトは `session` になります
  - `mode: "session"` には `thread: true` が必要です
- `cleanup?`（`delete|keep`、デフォルト `keep`）
- `sandbox?`（`inherit|require`、デフォルト `inherit`。`require` は対象の子 runtime が sandbox 化されていない限り spawn を拒否）
- `sessions_spawn` は channel 配信パラメータ（`target`、`channel`、`to`、`threadId`、`replyTo`、`transport`）を受け付けません。配信には、起動された実行から `message` / `sessions_send` を使用してください。

## スレッドに bind された session

channel で thread binding が有効な場合、Sub-Agent はスレッドに bind されたままにできるため、そのスレッド内の後続ユーザーメッセージは同じ Sub-Agent session にルーティングされ続けます。

### スレッド対応 channel

- Discord（現在サポートされている唯一の channel）: 永続的なスレッド bind Sub-Agent session（`thread: true` を指定した `sessions_spawn`）、手動スレッド制御（`/focus`、`/unfocus`、`/agents`、`/session idle`、`/session max-age`）、および adapter key `channels.discord.threadBindings.enabled`、`channels.discord.threadBindings.idleHours`、`channels.discord.threadBindings.maxAgeHours`、`channels.discord.threadBindings.spawnSubagentSessions` をサポートします。

簡単なフロー:

1. `thread: true`（必要なら `mode: "session"` も）を付けて `sessions_spawn` で起動する。
2. OpenClaw はアクティブ channel 内で、その session 対象にスレッドを作成または bind する。
3. そのスレッド内の返信や後続メッセージは、その bind 済み session にルーティングされる。
4. 非アクティブ時の自動 unfocus の確認/更新には `/session idle` を、強制的な上限の制御には `/session max-age` を使う。
5. 手動で切り離すには `/unfocus` を使う。

手動制御:

- `/focus <target>` は、現在のスレッド（または新しく作成したスレッド）を Sub-Agent/session 対象に bind します。
- `/unfocus` は、現在 bind されているスレッドの binding を削除します。
- `/agents` は、アクティブな実行と binding 状態（`thread:<id>` または `unbound`）を一覧表示します。
- `/session idle` と `/session max-age` は、focus 済みで bind されたスレッドに対してのみ動作します。

config スイッチ:

- グローバルデフォルト: `session.threadBindings.enabled`、`session.threadBindings.idleHours`、`session.threadBindings.maxAgeHours`
- channel 上書きと spawn 自動 bind key は adapter 固有です。上の **スレッド対応 channel** を参照してください。

現在の adapter 詳細は [Configuration Reference](/ja-JP/gateway/configuration-reference) と [Slash commands](/ja-JP/tools/slash-commands) を参照してください。

allowlist:

- `agents.list[].subagents.allowAgents`: `agentId` 経由で対象にできる agent id の一覧（任意を許可するには `["*"]`）。デフォルト: 要求元 agent のみ。
- `agents.defaults.subagents.allowAgents`: 要求元 agent が独自の `subagents.allowAgents` を設定していない場合に使われるデフォルトの対象 agent allowlist。
- sandbox 継承ガード: 要求元 session が sandbox 化されている場合、`sessions_spawn` は sandbox 化されずに実行される対象を拒否します。
- `agents.defaults.subagents.requireAgentId` / `agents.list[].subagents.requireAgentId`: true の場合、`agentId` を省略した `sessions_spawn` 呼び出しをブロックします（明示的な profile 選択を強制）。デフォルト: false。

Discovery:

- 現在 `sessions_spawn` で許可されている agent id を確認するには `agents_list` を使用してください。

自動アーカイブ:

- Sub-Agent session は `agents.defaults.subagents.archiveAfterMinutes`（デフォルト: 60）後に自動的にアーカイブされます。
- アーカイブは `sessions.delete` を使用し、transcript を `*.deleted.<timestamp>` にリネームします（同じ folder 内）。
- `cleanup: "delete"` は通知直後に即時アーカイブします（ただし transcript はリネームにより保持されます）。
- 自動アーカイブはベストエフォートです。Gateway を再起動すると保留中 timer は失われます。
- `runTimeoutSeconds` は自動アーカイブしません。実行を停止するだけです。session は自動アーカイブまで残ります。
- 自動アーカイブは depth-1 と depth-2 の両方の session に同様に適用されます。
- browser cleanup は archive cleanup とは別です。追跡対象 browser tab/process は、transcript/session record を保持する場合でも、実行完了時にベストエフォートで閉じられます。

## ネストした Sub-Agents

デフォルトでは、Sub-Agent は自身の Sub-Agent を起動できません（`maxSpawnDepth: 1`）。`maxSpawnDepth: 2` を設定すると 1 段階のネストを有効にでき、**オーケストレーターパターン**（main → orchestrator Sub-Agent → worker sub-sub-agent）を実現できます。

### 有効にする方法

```json5
{
  agents: {
    defaults: {
      subagents: {
        maxSpawnDepth: 2, // allow sub-agents to spawn children (default: 1)
        maxChildrenPerAgent: 5, // max active children per agent session (default: 5)
        maxConcurrent: 8, // global concurrency lane cap (default: 8)
        runTimeoutSeconds: 900, // default timeout for sessions_spawn when omitted (0 = no timeout)
      },
    },
  },
}
```

### 深度レベル

| 深度 | session key の形状                         | 役割                                          | spawn 可能か                   |
| ---- | ------------------------------------------ | --------------------------------------------- | ------------------------------ |
| 0    | `agent:<id>:main`                          | main agent                                    | 常に可                         |
| 1    | `agent:<id>:subagent:<uuid>`               | Sub-Agent（depth 2 許可時は orchestrator）    | `maxSpawnDepth >= 2` の場合のみ |
| 2    | `agent:<id>:subagent:<uuid>:subagent:<uuid>` | sub-sub-agent（leaf worker）                  | 不可                           |

### 通知チェーン

結果はチェーンを遡って流れます。

1. depth-2 の worker が完了 → 親（depth-1 の orchestrator）へ通知
2. depth-1 の orchestrator が通知を受け取り、結果を合成して完了 → main へ通知
3. main agent が通知を受け取り、ユーザーへ配信

各レベルは、自分の直下の子からの通知だけを見ます。

運用ガイダンス:

- 子の作業は 1 回だけ開始し、`sessions_list`、`sessions_history`、`/subagents list`、または `exec` の sleep command を使ったポーリングループを作るのではなく、完了 event を待ってください。
- 子の完了 event が、すでに最終回答を送った後に到着した場合、正しい後続応答は厳密なサイレント token `NO_REPLY` / `no_reply` です。

### 深度ごとの tool policy

- 役割と制御スコープは spawn 時に session metadata に書き込まれます。これにより、平坦化された、または復元された session key が誤って orchestrator 権限を取り戻すことを防ぎます。
- **深度 1（orchestrator、`maxSpawnDepth >= 2` の場合）**: 子を管理できるように `sessions_spawn`、`subagents`、`sessions_list`、`sessions_history` を持ちます。その他の session/system tool は引き続き deny されます。
- **深度 1（leaf、`maxSpawnDepth == 1` の場合）**: session tool はありません（現在のデフォルト動作）。
- **深度 2（leaf worker）**: session tool はありません — 深度 2 では `sessions_spawn` は常に deny されます。これ以上の子は起動できません。

### agent ごとの spawn 上限

各 agent session（どの深度でも）は、同時に最大 `maxChildrenPerAgent`（デフォルト: 5）件のアクティブな子しか持てません。これにより、単一 orchestrator からの暴走的な fan-out を防ぎます。

### カスケード停止

深度 1 の orchestrator を停止すると、その深度 2 の子もすべて自動的に停止します。

- main chat での `/stop` は、すべての深度 1 agent を停止し、その深度 2 の子にもカスケードします。
- `/subagents kill <id>` は、特定の Sub-Agent を停止し、その子にもカスケードします。
- `/subagents kill all` は、要求元のすべての Sub-Agent を停止し、カスケードします。

## 認証

Sub-Agent の auth は、session type ではなく **agent id** によって解決されます。

- Sub-Agent の session key は `agent:<agentId>:subagent:<uuid>` です。
- auth store はその agent の `agentDir` から読み込まれます。
- main agent の auth profile は **フォールバック** としてマージされます。競合時は agent profile が main profile を上書きします。

注意: このマージは加算的なので、main profile は常にフォールバックとして利用可能です。agent ごとに完全に分離された auth は、まだサポートされていません。

## 通知

Sub-Agent は通知ステップで結果を返します。

- 通知ステップは、要求元 session ではなく Sub-Agent session の内部で実行されます。
- Sub-Agent がちょうど `ANNOUNCE_SKIP` と返信した場合、何も投稿されません。
- 最新の assistant テキストが厳密なサイレント token `NO_REPLY` / `no_reply` である場合、以前に表示可能な進捗が存在していても通知出力は抑制されます。
- それ以外では、配信は要求元の深度に依存します:
  - トップレベルの要求元 session は、外部配信付きの follow-up `agent` 呼び出し（`deliver=true`）を使用します
  - ネストされた要求元 Sub-Agent session は、orchestrator が session 内で子の結果を合成できるように、内部 follow-up injection（`deliver=false`）を受け取ります
  - ネストされた要求元 Sub-Agent session が存在しない場合、OpenClaw は可能ならその session の要求元にフォールバックします
- トップレベルの要求元 session では、completion-mode の直接配信は、まず bind 済みの conversation/thread route と hook override を解決し、その後、不足している channel-target フィールドを要求元 session に保存された route から補います。これにより、完了元が channel しか特定していない場合でも、完了通知を正しい chat/topic に維持できます。
- nested completion finding を構築する際の子完了の集約は、現在の要求元 run にスコープされており、古い前回 run の子出力が現在の通知に漏れるのを防ぎます。
- 通知返信は、channel adapter 上で利用可能なら thread/topic ルーティングを保持します。
- 通知コンテキストは、安定した内部 event block に正規化されます:
  - source（`subagent` または `cron`）
  - 子の session key/id
  - 通知 type + task label
  - runtime outcome（`success`、`error`、`timeout`、`unknown`）から導出された status line
  - 最新の表示可能 assistant テキストから選ばれた結果コンテンツ。なければサニタイズ済みの最新 `tool`/`toolResult` テキスト。失敗で終了した実行は、取得済み返信テキストを再生せず失敗 status を報告します
  - 返信すべきか沈黙すべきかを説明する follow-up instruction
- `Status` は model 出力から推測されるのではなく、runtime outcome signal から取得されます。
- timeout 時、子が tool 呼び出しまでしか進んでいなければ、通知は生の tool 出力を再生する代わりに、その履歴を短い部分進捗要約にまとめることがあります。

通知 payload の末尾には、たとえラップされていても stats line が含まれます。

- runtime（例: `runtime 5m12s`）
- token 使用量（input/output/total）
- model pricing が設定されている場合の推定コスト（`models.providers.*.models[].cost`）
- `sessionKey`、`sessionId`、transcript path（main agent が `sessions_history` 経由で履歴を取得したり、ディスク上の file を確認したりできるように）
- 内部 metadata はオーケストレーション専用であり、ユーザー向け返信では通常の assistant の口調に書き換える必要があります。

`sessions_history` は、より安全なオーケストレーション経路です。

- assistant の再確認は、まず次のように正規化されます:
  - thinking tag は除去される
  - `<relevant-memories>` / `<relevant_memories>` の scaffolding block は除去される
  - `<tool_call>...</tool_call>`、`<function_call>...</function_call>`、`<tool_calls>...</tool_calls>`、`<function_calls>...</function_calls>` のような平文の tool-call XML payload block は、正常に閉じない途中切れ payload を含めて除去される
  - 格下げされた tool-call/result scaffolding と historical-context marker は除去される
  - `<|assistant|>`、他の ASCII の `<|...|>` token、および全角の `<｜...｜>` 変種のような漏れた model 制御 token は除去される
  - 壊れた MiniMax の tool-call XML は除去される
- 認証情報/token らしいテキストは redact される
- 長い block は切り詰められることがある
- 非常に大きい履歴では、古い行が落とされたり、大きすぎる行が `[sessions_history omitted: message too large]` に置き換えられたりする
- バイト単位で完全な transcript が必要な場合は、生のディスク上 transcript の確認がフォールバックです

## tool policy（Sub-Agent tool）

デフォルトでは、Sub-Agent は session tool と system tool を除く **すべての tool** を持ちます。

- `sessions_list`
- `sessions_history`
- `sessions_send`
- `sessions_spawn`

ここでも `sessions_history` は制限付きでサニタイズされた再確認ビューであり、生の transcript dump ではありません。

`maxSpawnDepth >= 2` の場合、深度 1 の orchestrator Sub-Agent はさらに `sessions_spawn`、`subagents`、`sessions_list`、`sessions_history` を受け取り、子を管理できるようになります。

config で上書きする:

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
        // deny wins
        deny: ["gateway", "cron"],
        // if allow is set, it becomes allow-only (deny still wins)
        // allow: ["read", "exec", "process"]
      },
    },
  },
}
```

## 並行性

Sub-Agent は専用の in-process queue lane を使用します。

- lane 名: `subagent`
- 並行数: `agents.defaults.subagents.maxConcurrent`（デフォルト `8`）

## 停止

- 要求元 chat で `/stop` を送ると、要求元 session が中断され、そこから起動されたアクティブな Sub-Agent 実行も停止し、ネストした子にもカスケードします。
- `/subagents kill <id>` は特定の Sub-Agent を停止し、その子にもカスケードします。

## 制限事項

- Sub-Agent の通知は **ベストエフォート** です。Gateway が再起動すると、保留中の「通知戻し」作業は失われます。
- Sub-Agent も同じ Gateway process のリソースを共有するため、`maxConcurrent` は安全弁として扱ってください。
- `sessions_spawn` は常に非ブロッキングです。すぐに `{ status: "accepted", runId, childSessionKey }` を返します。
- Sub-Agent コンテキストには `AGENTS.md` + `TOOLS.md` だけが注入されます（`SOUL.md`、`IDENTITY.md`、`USER.md`、`HEARTBEAT.md`、`BOOTSTRAP.md` は含まれません）。
- 最大ネスト深度は 5（`maxSpawnDepth` の範囲: 1–5）です。ほとんどの用途では深度 2 を推奨します。
- `maxChildrenPerAgent` は session ごとのアクティブな子数を制限します（デフォルト: 5、範囲: 1–20）。
