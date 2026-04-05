---
read_when:
    - エージェント経由でバックグラウンド/並列作業を行いたい
    - '`sessions_spawn` や sub-agent tool policy を変更している'
    - スレッドに束縛された subagent session を実装またはトラブルシュートしている
summary: 結果を依頼元チャットへ通知する、分離されたエージェント実行を起動するサブエージェント
title: サブエージェント
x-i18n:
    generated_at: "2026-04-05T13:01:41Z"
    model: gpt-5.4
    provider: openai
    source_hash: 9df7cc35a3069ce4eb9c92a95df3ce5365a00a3fae92ff73def75461b58fec3f
    source_path: tools/subagents.md
    workflow: 15
---

# サブエージェント

サブエージェントは、既存のエージェント実行から起動されるバックグラウンドのエージェント実行です。各サブエージェントは独自のセッション（`agent:<agentId>:subagent:<uuid>`）で実行され、終了すると、その結果を依頼元のチャットチャンネルへ**通知**します。各サブエージェント実行は [background task](/ja-JP/automation/tasks) として追跡されます。

## スラッシュコマンド

**現在のセッション**に対するサブエージェント実行の確認や制御には `/subagents` を使用します:

- `/subagents list`
- `/subagents kill <id|#|all>`
- `/subagents log <id|#> [limit] [tools]`
- `/subagents info <id|#>`
- `/subagents send <id|#> <message>`
- `/subagents steer <id|#> <message>`
- `/subagents spawn <agentId> <task> [--model <model>] [--thinking <level>]`

スレッド束縛の制御:

これらのコマンドは、永続的なスレッド束縛をサポートするチャンネルで動作します。以下の**スレッド対応チャンネル**を参照してください。

- `/focus <subagent-label|session-key|session-id|session-label>`
- `/unfocus`
- `/agents`
- `/session idle <duration|off>`
- `/session max-age <duration|off>`

`/subagents info` は実行メタデータ（ステータス、タイムスタンプ、session id、transcript path、cleanup）を表示します。
`sessions_history` は制限付きで安全性フィルター済みの再確認ビューに使用し、
生の完全な transcript が必要な場合はディスク上の transcript path を確認してください。

### 起動時の動作

`/subagents spawn` は、内部リレーではなくユーザーコマンドとしてバックグラウンドのサブエージェントを起動し、実行終了時に依頼元チャットへ最終的な完了通知を 1 回送信します。

- spawn コマンドは非ブロッキングです。run id を即座に返します。
- 完了時に、サブエージェントはサマリー/結果メッセージを依頼元チャットチャンネルへ通知します。
- 完了通知は push ベースです。起動後は、完了を待つためだけに `/subagents list`、
  `sessions_list`、`sessions_history` をループでポーリングしないでください。
  ステータス確認はデバッグや介入が必要なときだけ行ってください。
- 完了時、OpenClaw は、そのサブエージェントセッションが開いた追跡対象の browser tabs/processes を、通知後の cleanup フローに進む前にベストエフォートで閉じます。
- 手動起動では、配信は耐障害性があります:
  - OpenClaw はまず、安定した idempotency key を使って直接 `agent` 配信を試みます。
  - 直接配信が失敗した場合は、queue routing にフォールバックします。
  - queue routing も利用できない場合は、最終的に諦める前に、短い指数バックオフで通知を再試行します。
- 完了時の配信では、解決済みの依頼元ルートを維持します:
  - 利用可能な場合は、thread-bound または conversation-bound の完了ルートが優先されます
  - 完了元が channel しか提供しない場合、OpenClaw は依頼元セッションの解決済みルート（`lastChannel` / `lastTo` / `lastAccountId`）から不足している target/account を補い、直接配信が引き続き機能するようにします
- 依頼元セッションへの完了ハンドオフは、実行時に生成される内部コンテキスト（ユーザー作成テキストではない）であり、以下を含みます:
  - `Result`（最新の表示可能な `assistant` 返信テキスト、なければサニタイズ済みの最新 `tool`/`toolResult` テキスト）
  - `Status`（`completed successfully` / `failed` / `timed out` / `unknown`）
  - コンパクトな runtime/token 統計
  - 依頼元エージェントに対し、生の内部メタデータを転送するのではなく、通常の assistant の声で書き直すよう指示する配信命令
- `--model` と `--thinking` は、その特定の実行の既定値を上書きします。
- 完了後の詳細や出力確認には `info`/`log` を使用します。
- `/subagents spawn` はワンショットモード（`mode: "run"`）です。永続的なスレッド束縛セッションには、`thread: true` と `mode: "session"` を指定した `sessions_spawn` を使用してください。
- ACP harness session（Codex、Claude Code、Gemini CLI）には、`runtime: "acp"` を指定した `sessions_spawn` を使用し、[ACP Agents](/tools/acp-agents) を参照してください。

主な目的:

- メイン実行をブロックせずに、「調査 / 長時間タスク / 遅い tool」作業を並列化する。
- サブエージェントを既定で分離した状態に保つ（セッション分離 + 任意の sandboxing）。
- tool surface を誤用しにくく保つ。サブエージェントは既定では session tools を受け取りません。
- オーケストレーターパターン向けに、設定可能なネスト深度をサポートする。

コストに関する注意: 各サブエージェントは**独自の**コンテキストとトークン使用量を持ちます。重いタスクや繰り返しタスクでは、サブエージェントには安価なモデルを設定し、メインエージェントには高品質なモデルを維持してください。
これは `agents.defaults.subagents.model` またはエージェントごとの上書きで設定できます。

## Tool

`sessions_spawn` を使用します:

- サブエージェント実行を開始します（`deliver: false`、global lane: `subagent`）
- その後、通知ステップを実行し、通知返信を依頼元チャットチャンネルへ投稿します
- 既定モデル: `agents.defaults.subagents.model`（またはエージェントごとの `agents.list[].subagents.model`）を設定していない限り、呼び出し元を継承します。明示的な `sessions_spawn.model` がある場合はそれが優先されます。
- 既定の thinking: `agents.defaults.subagents.thinking`（またはエージェントごとの `agents.list[].subagents.thinking`）を設定していない限り、呼び出し元を継承します。明示的な `sessions_spawn.thinking` がある場合はそれが優先されます。
- 既定の実行タイムアウト: `sessions_spawn.runTimeoutSeconds` が省略された場合、OpenClaw は設定されていれば `agents.defaults.subagents.runTimeoutSeconds` を使用し、そうでなければ `0`（タイムアウトなし）にフォールバックします。

Tool パラメーター:

- `task`（必須）
- `label?`（任意）
- `agentId?`（任意。許可されていれば別の agent id の下で起動）
- `model?`（任意。サブエージェントのモデルを上書き。無効な値はスキップされ、tool result に警告付きで既定モデル上でサブエージェントが実行されます）
- `thinking?`（任意。サブエージェント実行の thinking レベルを上書き）
- `runTimeoutSeconds?`（設定されていれば `agents.defaults.subagents.runTimeoutSeconds` が既定値、そうでなければ `0`。設定時は N 秒後にサブエージェント実行が中止されます）
- `thread?`（既定 `false`。`true` の場合、このサブエージェントセッションに対して channel thread binding を要求）
- `mode?`（`run|session`）
  - 既定は `run`
  - `thread: true` で `mode` が省略された場合、既定は `session`
  - `mode: "session"` には `thread: true` が必要
- `cleanup?`（`delete|keep`、既定 `keep`）
- `sandbox?`（`inherit|require`、既定 `inherit`。`require` は、対象子ランタイムが sandboxed でない限り起動を拒否）
- `sessions_spawn` は channel-delivery パラメーター（`target`、`channel`、`to`、`threadId`、`replyTo`、`transport`）を受け付けません。配信には、起動された実行側から `message`/`sessions_send` を使用してください。

## スレッド束縛セッション

チャンネルで thread bindings が有効になっている場合、サブエージェントはスレッドに束縛されたままにできるため、そのスレッド内の後続ユーザーメッセージは同じサブエージェントセッションへルーティングされ続けます。

### スレッド対応チャンネル

- Discord（現在サポートされている唯一のチャンネル）: 永続的な thread-bound subagent sessions（`thread: true` を指定した `sessions_spawn`）、手動のスレッド制御（`/focus`、`/unfocus`、`/agents`、`/session idle`、`/session max-age`）、およびアダプターキー `channels.discord.threadBindings.enabled`、`channels.discord.threadBindings.idleHours`、`channels.discord.threadBindings.maxAgeHours`、`channels.discord.threadBindings.spawnSubagentSessions` をサポートします。

クイックフロー:

1. `thread: true`（必要に応じて `mode: "session"` も）を指定して `sessions_spawn` で起動します。
2. OpenClaw が、そのセッション対象に対してアクティブチャンネル内でスレッドを作成または束縛します。
3. そのスレッド内の返信と後続メッセージは、束縛されたセッションへルーティングされます。
4. `/session idle` を使って、非アクティブ時の自動 unfocus を確認/更新し、`/session max-age` でハード上限を制御します。
5. 手動で切り離すには `/unfocus` を使用します。

手動制御:

- `/focus <target>` は、現在のスレッドをサブエージェント/セッション対象に束縛します（または新しく作成します）。
- `/unfocus` は、現在束縛されているスレッドの束縛を解除します。
- `/agents` は、アクティブな実行と束縛状態（`thread:<id>` または `unbound`）を一覧表示します。
- `/session idle` と `/session max-age` は、focus 済みの束縛スレッドでのみ動作します。

設定スイッチ:

- グローバル既定値: `session.threadBindings.enabled`、`session.threadBindings.idleHours`、`session.threadBindings.maxAgeHours`
- チャンネル上書きと起動時の自動束縛キーはアダプター固有です。上記の**スレッド対応チャンネル**を参照してください。

現在のアダプター詳細については [Configuration Reference](/ja-JP/gateway/configuration-reference) と [Slash commands](/tools/slash-commands) を参照してください。

Allowlist:

- `agents.list[].subagents.allowAgents`: `agentId` 経由で指定可能な agent id の一覧（任意のものを許可するには `["*"]`）。既定値: 依頼元エージェントのみ。
- `agents.defaults.subagents.allowAgents`: 依頼元エージェントが独自の `subagents.allowAgents` を設定していない場合に使用される、既定の対象エージェント allowlist。
- Sandbox 継承ガード: 依頼元セッションが sandboxed の場合、`sessions_spawn` は sandbox なしで実行される対象を拒否します。
- `agents.defaults.subagents.requireAgentId` / `agents.list[].subagents.requireAgentId`: true の場合、`agentId` を省略した `sessions_spawn` 呼び出しをブロックします（明示的なプロファイル選択を強制）。既定値: false。

検出:

- `sessions_spawn` で現在どの agent id が許可されているか確認するには `agents_list` を使用します。

自動アーカイブ:

- サブエージェントセッションは、`agents.defaults.subagents.archiveAfterMinutes`（既定値: 60）後に自動的にアーカイブされます。
- アーカイブでは `sessions.delete` を使用し、transcript を `*.deleted.<timestamp>` にリネームします（同じフォルダー内）。
- `cleanup: "delete"` は通知直後に即時アーカイブします（ただし transcript はリネームによって保持されます）。
- 自動アーカイブはベストエフォートです。gateway が再起動すると保留中タイマーは失われます。
- `runTimeoutSeconds` は自動アーカイブしません。実行を停止するだけです。セッションは自動アーカイブまで残ります。
- 自動アーカイブは深さ 1 と深さ 2 のセッションに同様に適用されます。
- browser cleanup は archive cleanup とは別です。追跡対象の browser tabs/processes は、transcript/session record を保持する場合でも、実行終了時にベストエフォートで閉じられます。

## ネストしたサブエージェント

既定では、サブエージェントは自分自身のサブエージェントを起動できません（`maxSpawnDepth: 1`）。`maxSpawnDepth: 2` を設定すると 1 段階のネストを有効にでき、**オーケストレーターパターン**、つまり main → orchestrator sub-agent → worker sub-sub-agents を実現できます。

### 有効化方法

```json5
{
  agents: {
    defaults: {
      subagents: {
        maxSpawnDepth: 2, // サブエージェントによる子の起動を許可（既定: 1）
        maxChildrenPerAgent: 5, // エージェントセッションごとのアクティブな子の最大数（既定: 5）
        maxConcurrent: 8, // グローバルな同時実行レーン上限（既定: 8）
        runTimeoutSeconds: 900, // 省略時の sessions_spawn の既定タイムアウト（0 = タイムアウトなし）
      },
    },
  },
}
```

### 深さレベル

| Depth | Session key の形状                         | 役割                                         | 起動可能か                   |
| ----- | ------------------------------------------ | -------------------------------------------- | ---------------------------- |
| 0     | `agent:<id>:main`                          | メインエージェント                            | 常に可能                     |
| 1     | `agent:<id>:subagent:<uuid>`               | サブエージェント（深さ 2 が許可された場合は orchestrator） | `maxSpawnDepth >= 2` の場合のみ |
| 2     | `agent:<id>:subagent:<uuid>:subagent:<uuid>` | サブサブエージェント（leaf worker）           | 不可                         |

### 通知チェーン

結果はチェーンをさかのぼって流れます:

1. 深さ 2 の worker が終了 → 親（深さ 1 の orchestrator）へ通知
2. 深さ 1 の orchestrator が通知を受信し、結果を統合して終了 → main へ通知
3. メインエージェントが通知を受信し、ユーザーへ配信

各レベルが受け取るのは、自分の直下の子からの通知だけです。

運用上のガイダンス:

- `sessions_list`、`sessions_history`、`/subagents list`、または
  `exec` の sleep コマンドを中心にしたポーリングループを作るのではなく、
  子の作業は一度開始したら完了イベントを待ってください。
- すでに最終回答を送信した後に子の完了イベントが到着した場合、
  正しいフォローアップは厳密に無音トークン `NO_REPLY` / `no_reply` です。

### 深さごとの tool policy

- 役割と制御スコープは起動時に session metadata に書き込まれます。これにより、平坦化または復元された session key が誤って orchestrator 権限を取り戻すことを防ぎます。
- **深さ 1（orchestrator、`maxSpawnDepth >= 2` の場合）**: 子を管理できるよう、`sessions_spawn`、`subagents`、`sessions_list`、`sessions_history` を取得します。その他の session/system tools は引き続き拒否されます。
- **深さ 1（leaf、`maxSpawnDepth == 1` の場合）**: session tools はありません（現在の既定動作）。
- **深さ 2（leaf worker）**: session tools はありません。深さ 2 では `sessions_spawn` は常に拒否されます。これ以上子を起動できません。

### エージェントごとの起動上限

各エージェントセッション（任意の深さ）は、同時に最大 `maxChildrenPerAgent`（既定: 5）個のアクティブな子しか持てません。これにより、単一 orchestrator からの暴走的なファンアウトを防ぎます。

### カスケード停止

深さ 1 の orchestrator を停止すると、すべての深さ 2 の子も自動的に停止します:

- メインチャットでの `/stop` は、すべての深さ 1 エージェントを停止し、その深さ 2 の子へもカスケードします。
- `/subagents kill <id>` は、特定のサブエージェントを停止し、その子へもカスケードします。
- `/subagents kill all` は、依頼元に対するすべてのサブエージェントを停止し、カスケードします。

## 認証

サブエージェントの認証は、session type ではなく **agent id** によって解決されます:

- サブエージェントセッションキーは `agent:<agentId>:subagent:<uuid>` です。
- auth store は、そのエージェントの `agentDir` から読み込まれます。
- メインエージェントの auth profiles は**フォールバック**としてマージされます。競合時にはエージェントの profiles がメインの profiles を上書きします。

注意: このマージは加算的なので、メインの profiles は常にフォールバックとして利用可能です。エージェントごとに完全に分離された認証は、まだサポートされていません。

## 通知

サブエージェントは通知ステップによって結果を返します:

- 通知ステップは、依頼元セッションではなくサブエージェントセッション内で実行されます。
- サブエージェントが正確に `ANNOUNCE_SKIP` と返信した場合、何も投稿されません。
- 最新の assistant テキストが厳密な無音トークン `NO_REPLY` / `no_reply` の場合、
  以前に可視の進捗が存在していても通知出力は抑制されます。
- それ以外の場合、配信は依頼元の深さに依存します:
  - 最上位の依頼元セッションでは、外部配信付きの後続 `agent` 呼び出し（`deliver=true`）を使用します
  - ネストした依頼元サブエージェントセッションでは、orchestrator がセッション内で子の結果を統合できるよう、内部の後続注入（`deliver=false`）を受け取ります
  - ネストした依頼元サブエージェントセッションが消えている場合、利用可能であれば OpenClaw はそのセッションの依頼元にフォールバックします
- 最上位の依頼元セッションでは、完了モードの直接配信はまず束縛済みの conversation/thread route と hook override を解決し、その後、依頼元セッションの保存済み route から不足している channel-target フィールドを補います。これにより、完了元が channel しか識別しない場合でも、完了通知が正しい chat/topic に届きます。
- ネストした完了通知の構築時には、子完了の集約は現在の依頼元実行のスコープに限定されるため、過去の実行の古い子出力が現在の通知に漏れません。
- 通知返信は、channel adapters で利用可能な場合、thread/topic ルーティングを保持します。
- 通知コンテキストは、安定した内部イベントブロックへ正規化されます:
  - source（`subagent` または `cron`）
  - 子 session key/id
  - 通知タイプ + task label
  - 実行時 outcome（`success`、`error`、`timeout`、または `unknown`）から導出された status line
  - 最新の表示可能 assistant text、またはサニタイズ済みの最新 tool/toolResult text から選ばれた result content
  - 返信するべき場合と黙るべき場合を説明する follow-up instruction
- `Status` はモデル出力から推測されません。実行時 outcome シグナルから取得されます。
- タイムアウト時、子が tool calls までしか進んでいない場合、通知では生の tool output を再生する代わりに、その履歴を短い部分進捗サマリーへ圧縮できることがあります。

通知ペイロードの末尾には stats 行が含まれます（折り返された場合でも）:

- Runtime（例: `runtime 5m12s`）
- トークン使用量（input/output/total）
- モデル価格設定が構成されている場合の推定コスト（`models.providers.*.models[].cost`）
- `sessionKey`、`sessionId`、transcript path（これにより、メインエージェントは `sessions_history` 経由で履歴を取得したり、ディスク上のファイルを確認したりできます）
- 内部メタデータはオーケストレーション専用です。ユーザー向け返信は通常の assistant の声で書き直すべきです。

`sessions_history` は、より安全なオーケストレーション経路です:

- assistant の再確認内容は最初に正規化されます:
  - thinking タグを除去
  - `<relevant-memories>` / `<relevant_memories>` の scaffolding blocks を除去
  - `<tool_call>...</tool_call>`、
    `<function_call>...</function_call>`、`<tool_calls>...</tool_calls>`、および
    `<function_calls>...</function_calls>` のようなプレーンテキストの tool-call XML payload blocks を除去。きれいに閉じないまま切り詰められた payloads も含みます
  - 格下げされた tool-call/result scaffolding と historical-context markers を除去
  - `<|assistant|>` のような漏れたモデル制御トークン、その他の ASCII
    `<|...|>` トークン、および全角の `<｜...｜>` バリアントを除去
  - 壊れた MiniMax tool-call XML を除去
- credential/token に似たテキストはマスクされます
- 長いブロックは切り詰められることがあります
- 非常に大きな履歴では、古い行が削除されたり、過大な行が
  `[sessions_history omitted: message too large]` に置き換えられたりすることがあります
- 完全にバイト単位で同一の transcript が必要な場合は、ディスク上の生 transcript の確認がフォールバックです

## Tool Policy（サブエージェントの tools）

既定では、サブエージェントは session tools と system tools を除く**すべての tools**を取得します:

- `sessions_list`
- `sessions_history`
- `sessions_send`
- `sessions_spawn`

ここでも `sessions_history` は制限付きでサニタイズ済みの再確認ビューであり、
生の transcript ダンプではありません。

`maxSpawnDepth >= 2` の場合、深さ 1 の orchestrator サブエージェントは、子を管理できるよう追加で `sessions_spawn`、`subagents`、`sessions_list`、`sessions_history` を取得します。

設定による上書き:

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
        // deny が優先
        deny: ["gateway", "cron"],
        // allow が設定されている場合、それは allow-only になる（deny は引き続き優先）
        // allow: ["read", "exec", "process"]
      },
    },
  },
}
```

## 同時実行

サブエージェントは専用のインプロセスキューレーンを使用します:

- レーン名: `subagent`
- 同時実行数: `agents.defaults.subagents.maxConcurrent`（既定値 `8`）

## 停止

- 依頼元チャットで `/stop` を送信すると、依頼元セッションが中止され、そこから起動されたアクティブなサブエージェント実行も停止され、ネストした子にもカスケードします。
- `/subagents kill <id>` は、特定のサブエージェントを停止し、その子にもカスケードします。

## 制限事項

- サブエージェントの通知は**ベストエフォート**です。gateway が再起動すると、保留中の「通知して戻る」作業は失われます。
- サブエージェントは依然として同じ gateway process リソースを共有するため、`maxConcurrent` は安全弁として扱ってください。
- `sessions_spawn` は常に非ブロッキングです。即座に `{ status: "accepted", runId, childSessionKey }` を返します。
- サブエージェントコンテキストには `AGENTS.md` + `TOOLS.md` のみが注入されます（`SOUL.md`、`IDENTITY.md`、`USER.md`、`HEARTBEAT.md`、`BOOTSTRAP.md` は含まれません）。
- 最大ネスト深度は 5（`maxSpawnDepth` の範囲: 1–5）です。多くの用途では深さ 2 を推奨します。
- `maxChildrenPerAgent` は、セッションごとのアクティブな子の数を制限します（既定値: 5、範囲: 1–20）。
