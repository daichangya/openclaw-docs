---
read_when:
    - エージェントを通じてバックグラウンド/並列作業を行いたい場合
    - '`sessions_spawn` またはサブエージェントツールのポリシーを変更している場合'
    - スレッドに紐づいたサブエージェントセッションを実装またはトラブルシューティングしている場合
summary: 'サブエージェント: 結果を依頼元チャットに通知する分離されたエージェント実行を起動すること'
title: サブエージェント
x-i18n:
    generated_at: "2026-04-21T19:20:44Z"
    model: gpt-5.4
    provider: openai
    source_hash: 218913f0db88d40e1b5fdb0201b8d23e7af23df572c86ff4be2637cb62498281
    source_path: tools/subagents.md
    workflow: 15
---

# サブエージェント

サブエージェントは、既存のエージェント実行から起動されるバックグラウンドのエージェント実行です。各サブエージェントは自身のセッション (`agent:<agentId>:subagent:<uuid>`) で動作し、完了するとその結果を依頼元のチャットチャネルに**通知**します。各サブエージェント実行は、[バックグラウンドタスク](/ja-JP/automation/tasks)として追跡されます。

## スラッシュコマンド

現在のセッションのサブエージェント実行を確認または制御するには、`/subagents` を使用します。

- `/subagents list`
- `/subagents kill <id|#|all>`
- `/subagents log <id|#> [limit] [tools]`
- `/subagents info <id|#>`
- `/subagents send <id|#> <message>`
- `/subagents steer <id|#> <message>`
- `/subagents spawn <agentId> <task> [--model <model>] [--thinking <level>]`

スレッドバインディング制御:

これらのコマンドは、永続的なスレッドバインディングをサポートするチャネルで動作します。詳細は以下の**スレッドをサポートするチャネル**を参照してください。

- `/focus <subagent-label|session-key|session-id|session-label>`
- `/unfocus`
- `/agents`
- `/session idle <duration|off>`
- `/session max-age <duration|off>`

`/subagents info` は、実行メタデータ（ステータス、タイムスタンプ、セッション id、transcript パス、cleanup）を表示します。  
制限付きで安全フィルタ済みのリコール表示には `sessions_history` を使用し、生の完全な transcript が必要な場合はディスク上の transcript パスを確認してください。

### 起動動作

`/subagents spawn` は、内部リレーではなくユーザーコマンドとしてバックグラウンドのサブエージェントを開始し、実行が完了すると依頼元チャットへ最終的な完了更新を 1 件送信します。

- spawn コマンドは非ブロッキングで、実行 id を即座に返します。
- 完了時、サブエージェントは要約/結果メッセージを依頼元チャットチャネルに通知します。
- 完了通知はプッシュベースです。起動後、完了待ちのためだけに `/subagents list`、`sessions_list`、`sessions_history` をループでポーリングしないでください。ステータス確認は、デバッグまたは介入が必要なときにオンデマンドでのみ行ってください。
- 完了時、OpenClaw はベストエフォートで、そのサブエージェントセッションが開いた追跡対象のブラウザタブ/プロセスを閉じてから通知 cleanup フローを続行します。
- 手動起動時、配信には耐障害性があります:
  - OpenClaw はまず、安定した冪等性キーを使って直接 `agent` 配信を試みます。
  - 直接配信に失敗した場合、キュールーティングにフォールバックします。
  - キュールーティングも利用できない場合、最終的に諦める前に、短い指数バックオフで通知を再試行します。
- 完了配信では、解決済みの依頼元ルートが維持されます:
  - 利用可能な場合、スレッドバインド済みまたは会話バインド済みの完了ルートが優先されます
  - 完了元がチャネルしか提供しない場合でも、OpenClaw は依頼元セッションの解決済みルート（`lastChannel` / `lastTo` / `lastAccountId`）から不足している target/account を補い、直接配信が引き続き機能するようにします
- 依頼元セッションへの完了引き渡しは、ランタイム生成の内部コンテキスト（ユーザーが作成したテキストではない）であり、次を含みます:
  - `Result`（最新の表示可能な `assistant` 返信テキスト。ない場合は、サニタイズ済みの最新 `tool`/`toolResult` テキスト。失敗して終了した実行では、取得済み返信テキストを再利用しません）
  - `Status`（`completed successfully` / `failed` / `timed out` / `unknown`）
  - コンパクトなランタイム/トークン統計
  - 依頼元エージェントに対し、生の内部メタデータを転送せず、通常の assistant の声で書き直すよう指示する配信命令
- `--model` と `--thinking` は、その特定の実行のデフォルトを上書きします。
- 完了後の詳細と出力の確認には `info`/`log` を使用します。
- `/subagents spawn` はワンショットモード（`mode: "run"`）です。永続的なスレッドバインド済みセッションには、`thread: true` と `mode: "session"` を指定した `sessions_spawn` を使用してください。
- ACP ハーネスセッション（Codex、Claude Code、Gemini CLI）には、`runtime: "acp"` を指定した `sessions_spawn` を使用し、[ACP Agents](/ja-JP/tools/acp-agents) を参照してください。

主な目的:

- メイン実行をブロックせずに、「調査 / 長時間タスク / 遅いツール」の作業を並列化する。
- デフォルトでサブエージェントを分離状態に保つ（セッション分離 + 任意のサンドボックス化）。
- ツールの操作を誤用しにくく保つ。サブエージェントには、デフォルトでセッションツールは付与されません。
- オーケストレーターパターン向けに、設定可能なネスト深度をサポートする。

コストに関する注意: 各サブエージェントは、それぞれ**独自の**コンテキストとトークン使用量を持ちます。重いタスクや反復的なタスクでは、サブエージェントにより安価なモデルを設定し、メインエージェントはより高品質なモデルのままにしてください。これは `agents.defaults.subagents.model` またはエージェントごとのオーバーライドで設定できます。

## ツール

`sessions_spawn` を使用します:

- サブエージェント実行を開始します（`deliver: false`、グローバルレーン: `subagent`）
- 次に通知ステップを実行し、その通知返信を依頼元チャットチャネルに投稿します
- デフォルトモデル: `agents.defaults.subagents.model`（またはエージェントごとの `agents.list[].subagents.model`）を設定していない場合は呼び出し元を継承します。明示的な `sessions_spawn.model` がある場合は常にそれが優先されます。
- デフォルト thinking: `agents.defaults.subagents.thinking`（またはエージェントごとの `agents.list[].subagents.thinking`）を設定していない場合は呼び出し元を継承します。明示的な `sessions_spawn.thinking` がある場合は常にそれが優先されます。
- デフォルトの実行タイムアウト: `sessions_spawn.runTimeoutSeconds` が省略された場合、OpenClaw は設定されていれば `agents.defaults.subagents.runTimeoutSeconds` を使用し、そうでなければ `0`（タイムアウトなし）にフォールバックします。

ツールパラメータ:

- `task`（必須）
- `label?`（任意）
- `agentId?`（任意。許可されていれば別の agent id で起動）
- `model?`（任意。サブエージェントのモデルを上書き。無効な値はスキップされ、サブエージェントはデフォルトモデルで実行され、警告がツール結果に表示されます）
- `thinking?`（任意。サブエージェント実行の thinking レベルを上書き）
- `runTimeoutSeconds?`（設定されていれば `agents.defaults.subagents.runTimeoutSeconds` がデフォルト、そうでなければ `0`。設定すると、サブエージェント実行は N 秒後に中止されます）
- `thread?`（デフォルト `false`。`true` の場合、このサブエージェントセッションに対してチャネルスレッドバインディングを要求します）
- `mode?`（`run|session`）
  - デフォルトは `run`
  - `thread: true` で `mode` が省略された場合、デフォルトは `session` になります
  - `mode: "session"` には `thread: true` が必要です
- `cleanup?`（`delete|keep`、デフォルト `keep`）
- `sandbox?`（`inherit|require`、デフォルト `inherit`。`require` は、対象の子ランタイムがサンドボックス化されていない場合、起動を拒否します）
- `sessions_spawn` はチャネル配信パラメータ（`target`, `channel`, `to`, `threadId`, `replyTo`, `transport`）を受け付けません。配信には、起動された実行から `message`/`sessions_send` を使用してください。

## スレッドバインド済みセッション

チャネルでスレッドバインディングが有効な場合、サブエージェントはスレッドにバインドされたままにでき、そのスレッド内での後続ユーザーメッセージは同じサブエージェントセッションへルーティングされ続けます。

### スレッドをサポートするチャネル

- Discord（現在サポートされている唯一のチャネル）: 永続的なスレッドバインド済みサブエージェントセッション（`thread: true` を指定した `sessions_spawn`）、手動スレッド制御（`/focus`、`/unfocus`、`/agents`、`/session idle`、`/session max-age`）、およびアダプターキー `channels.discord.threadBindings.enabled`, `channels.discord.threadBindings.idleHours`, `channels.discord.threadBindings.maxAgeHours`, `channels.discord.threadBindings.spawnSubagentSessions` をサポートします。

クイックフロー:

1. `thread: true`（必要に応じて `mode: "session"`）を指定して `sessions_spawn` で起動します。
2. OpenClaw は、アクティブなチャネル内でそのセッション対象にスレッドを作成またはバインドします。
3. そのスレッド内での返信や後続メッセージは、バインドされたセッションへルーティングされます。
4. 非アクティブ時の自動 unfocus の確認/更新には `/session idle` を使用し、ハード上限の制御には `/session max-age` を使用します。
5. 手動で切り離すには `/unfocus` を使用します。

手動制御:

- `/focus <target>` は、現在のスレッドをサブエージェント/セッション対象にバインドします（または新規に作成します）。
- `/unfocus` は、現在バインドされているスレッドのバインディングを解除します。
- `/agents` は、アクティブな実行とバインディング状態（`thread:<id>` または `unbound`）を一覧表示します。
- `/session idle` と `/session max-age` は、フォーカスされたバインド済みスレッドでのみ動作します。

設定スイッチ:

- グローバルデフォルト: `session.threadBindings.enabled`, `session.threadBindings.idleHours`, `session.threadBindings.maxAgeHours`
- チャネル上書きおよび起動時の自動バインドキーはアダプター固有です。詳細は上記の**スレッドをサポートするチャネル**を参照してください。

現在のアダプター詳細は [Configuration Reference](/ja-JP/gateway/configuration-reference) と [Slash commands](/ja-JP/tools/slash-commands) を参照してください。

許可リスト:

- `agents.list[].subagents.allowAgents`: `agentId` 経由で対象指定できる agent id のリスト（任意を許可する場合は `["*"]`）。デフォルトでは、依頼元エージェントのみです。
- `agents.defaults.subagents.allowAgents`: 依頼元エージェントが独自の `subagents.allowAgents` を設定していない場合に使用される、デフォルトの対象エージェント許可リストです。
- サンドボックス継承ガード: 依頼元セッションがサンドボックス化されている場合、`sessions_spawn` はサンドボックスなしで実行される対象を拒否します。
- `agents.defaults.subagents.requireAgentId` / `agents.list[].subagents.requireAgentId`: true の場合、`agentId` を省略した `sessions_spawn` 呼び出しをブロックします（明示的なプロファイル選択を強制）。デフォルトは false です。

検出:

- `sessions_spawn` で現在許可されている agent id を確認するには `agents_list` を使用します。

自動アーカイブ:

- サブエージェントセッションは、`agents.defaults.subagents.archiveAfterMinutes`（デフォルト: 60）経過後に自動的にアーカイブされます。
- アーカイブでは `sessions.delete` を使用し、transcript を `*.deleted.<timestamp>` にリネームします（同じフォルダー内）。
- `cleanup: "delete"` は通知後すぐにアーカイブします（ただし transcript はリネームにより保持されます）。
- 自動アーカイブはベストエフォートであり、gateway が再起動すると保留中のタイマーは失われます。
- `runTimeoutSeconds` は自動アーカイブを行いません。実行を停止するだけです。セッションは自動アーカイブまで残ります。
- 自動アーカイブは、深さ 1 と深さ 2 のセッションに等しく適用されます。
- ブラウザ cleanup はアーカイブ cleanup とは別です。transcript/セッションレコードを保持する場合でも、実行完了時に追跡対象のブラウザタブ/プロセスはベストエフォートで閉じられます。

## ネストされたサブエージェント

デフォルトでは、サブエージェントは自身のサブエージェントを起動できません（`maxSpawnDepth: 1`）。`maxSpawnDepth: 2` を設定すると、1 レベルのネストを有効化でき、**オーケストレーターパターン**が可能になります: main → オーケストレーターサブエージェント → ワーカーサブサブエージェント。

### 有効化する方法

```json5
{
  agents: {
    defaults: {
      subagents: {
        maxSpawnDepth: 2, // サブエージェントによる子の起動を許可（デフォルト: 1）
        maxChildrenPerAgent: 5, // エージェントセッションあたりのアクティブな子の最大数（デフォルト: 5）
        maxConcurrent: 8, // グローバル同時実行レーン上限（デフォルト: 8）
        runTimeoutSeconds: 900, // 省略時の sessions_spawn のデフォルトタイムアウト（0 = タイムアウトなし）
      },
    },
  },
}
```

### 深度レベル

| 深度 | セッションキーの形式                         | 役割                                           | 起動可能か                    |
| ----- | -------------------------------------------- | ---------------------------------------------- | ----------------------------- |
| 0     | `agent:<id>:main`                            | メインエージェント                             | 常に可能                      |
| 1     | `agent:<id>:subagent:<uuid>`                 | サブエージェント（深度 2 が許可された場合はオーケストレーター） | `maxSpawnDepth >= 2` の場合のみ |
| 2     | `agent:<id>:subagent:<uuid>:subagent:<uuid>` | サブサブエージェント（リーフワーカー）         | 不可                          |

### 通知チェーン

結果はチェーンをさかのぼって流れます:

1. 深度 2 のワーカーが完了 → 親（深度 1 のオーケストレーター）に通知
2. 深度 1 のオーケストレーターが通知を受信し、結果を統合して完了 → main に通知
3. メインエージェントが通知を受信し、ユーザーへ配信

各レベルが受け取るのは、その直接の子からの通知だけです。

運用ガイダンス:

- 子の作業は一度開始し、`sessions_list`、`sessions_history`、`/subagents list`、`exec` の sleep コマンドを使ったポーリングループを組むのではなく、完了イベントを待ってください。
- 最終回答をすでに送信した後に子の完了イベントが到着した場合、正しい後続応答は、完全に無音のトークン `NO_REPLY` / `no_reply` です。

### 深度ごとのツールポリシー

- ロールと制御スコープは起動時にセッションメタデータへ書き込まれます。これにより、フラット化された、または復元されたセッションキーが、誤ってオーケストレーター権限を取り戻すことを防ぎます。
- **深度 1（オーケストレーター、`maxSpawnDepth >= 2` の場合）**: `sessions_spawn`、`subagents`、`sessions_list`、`sessions_history` を取得し、自身の子を管理できます。その他の session/system ツールは引き続き拒否されます。
- **深度 1（リーフ、`maxSpawnDepth == 1` の場合）**: session ツールなし（現在のデフォルト動作）。
- **深度 2（リーフワーカー）**: session ツールなし — 深度 2 では `sessions_spawn` は常に拒否されます。これ以上子を起動することはできません。

### エージェントごとの起動上限

各エージェントセッション（任意の深度）は、同時に最大 `maxChildrenPerAgent`（デフォルト: 5）個までのアクティブな子を持てます。これにより、単一のオーケストレーターからの制御不能なファンアウトを防ぎます。

### カスケード停止

深度 1 のオーケストレーターを停止すると、その深度 2 の子もすべて自動的に停止します。

- メインチャットでの `/stop` は、すべての深度 1 エージェントを停止し、その深度 2 の子にもカスケードします。
- `/subagents kill <id>` は、特定のサブエージェントを停止し、その子にもカスケードします。
- `/subagents kill all` は、依頼元のすべてのサブエージェントを停止し、カスケードします。

## 認証

サブエージェントの認証は、セッションタイプではなく **agent id** によって解決されます。

- サブエージェントセッションキーは `agent:<agentId>:subagent:<uuid>` です。
- auth ストアは、そのエージェントの `agentDir` から読み込まれます。
- メインエージェントの auth プロファイルは**フォールバック**としてマージされ、競合時にはエージェント側のプロファイルがメイン側のプロファイルを上書きします。

注: マージは加算的であるため、メイン側のプロファイルは常にフォールバックとして利用可能です。エージェントごとに完全に分離された認証はまだサポートされていません。

## 通知

サブエージェントは、通知ステップを通じて結果を返します。

- 通知ステップは、依頼元セッションではなくサブエージェントセッション内で実行されます。
- サブエージェントが正確に `ANNOUNCE_SKIP` と返信した場合、何も投稿されません。
- 最新の assistant テキストが完全に無音のトークン `NO_REPLY` / `no_reply` の場合、以前に可視の進捗が存在していても、通知出力は抑制されます。
- それ以外の場合、配信は依頼元の深度に依存します:
  - 最上位の依頼元セッションでは、外部配信付きの後続 `agent` 呼び出し（`deliver=true`）を使用します
  - ネストされた依頼元サブエージェントセッションでは、オーケストレーターがセッション内で子の結果を統合できるよう、内部の後続インジェクション（`deliver=false`）を受け取ります
  - ネストされた依頼元サブエージェントセッションがすでに存在しない場合、OpenClaw は可能であればそのセッションの依頼元へフォールバックします
- 最上位の依頼元セッションでは、完了モードの直接配信は、まずバインド済みの会話/スレッドルートとフックオーバーライドを解決し、その後、依頼元セッションの保存済みルートから不足している channel-target フィールドを補完します。これにより、完了元がチャネルしか識別しない場合でも、完了通知を正しいチャット/トピック上に維持できます。
- 子の完了集約は、ネストされた完了結果を構築する際に現在の依頼元実行へスコープされるため、以前の実行の古い子出力が現在の通知に漏れません。
- 通知返信は、チャネルアダプターで利用可能な場合、スレッド/トピックのルーティングを保持します。
- 通知コンテキストは、安定した内部イベントブロックへ正規化されます:
  - source（`subagent` または `cron`）
  - 子セッションキー/id
  - 通知タイプ + タスクラベル
  - ランタイム結果（`success`、`error`、`timeout`、`unknown`）から導出されたステータス行
  - 最新の表示可能な assistant テキストから選択された result 内容。存在しない場合は、サニタイズ済みの最新 `tool`/`toolResult` テキスト。失敗して終了した実行は、取得済み返信テキストを再生せず失敗ステータスを報告します
  - 返信すべきか無音を保つべきかを説明する後続指示
- `Status` はモデル出力から推定されません。ランタイムの結果シグナルに基づきます。
- タイムアウト時、子が tool 呼び出しまでしか進んでいない場合、通知は生の tool 出力を再生する代わりに、その履歴を短い部分進捗サマリーへ要約できます。

通知ペイロードには、最後に統計行が含まれます（ラップされている場合でも）。

- ランタイム（例: `runtime 5m12s`）
- トークン使用量（input/output/total）
- モデル価格が設定されている場合の推定コスト（`models.providers.*.models[].cost`）
- `sessionKey`、`sessionId`、および transcript パス（メインエージェントが `sessions_history` で履歴を取得したり、ディスク上のファイルを確認したりできるようにするため）
- 内部メタデータはオーケストレーション専用です。ユーザー向けの返信は、通常の assistant の声で書き直してください。

`sessions_history` は、より安全なオーケストレーション経路です。

- assistant のリコールはまず正規化されます:
  - thinking タグは削除されます
  - `<relevant-memories>` / `<relevant_memories>` の足場ブロックは削除されます
  - `<tool_call>...</tool_call>`、`<function_call>...</function_call>`、`<tool_calls>...</tool_calls>`、`<function_calls>...</function_calls>` のようなプレーンテキストの tool-call XML ペイロードブロックは削除され、正常に閉じられていない切り詰められたペイロードも含めて除去されます
  - 格下げされた tool-call/result の足場と historical-context マーカーは削除されます
  - `<|assistant|>`、その他の ASCII の `<|...|>` トークン、および全角の `<｜...｜>` バリアントのような漏れたモデル制御トークンは削除されます
  - 不正な MiniMax tool-call XML は削除されます
- 資格情報/トークンらしいテキストはマスクされます
- 長いブロックは切り詰められることがあります
- 非常に大きな履歴では、古い行が削除されたり、大きすぎる行が `[sessions_history omitted: message too large]` に置き換えられたりすることがあります
- バイト単位で完全な transcript が必要な場合は、ディスク上の生 transcript の確認がフォールバックです

## ツールポリシー（サブエージェントツール）

デフォルトでは、サブエージェントは session ツールと system ツールを除く**すべてのツール**を取得します。

- `sessions_list`
- `sessions_history`
- `sessions_send`
- `sessions_spawn`

ここでも `sessions_history` は制限付きでサニタイズ済みのリコール表示であり、生の transcript ダンプではありません。

`maxSpawnDepth >= 2` の場合、深度 1 のオーケストレーターサブエージェントは、自身の子を管理できるように、追加で `sessions_spawn`、`subagents`、`sessions_list`、`sessions_history` を取得します。

設定で上書きできます:

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
        // deny が優先されます
        deny: ["gateway", "cron"],
        // allow が設定されている場合、許可リスト専用になります（deny は引き続き優先）
        // allow: ["read", "exec", "process"]
      },
    },
  },
}
```

## 同時実行性

サブエージェントは、専用のインプロセスキューレーンを使用します。

- レーン名: `subagent`
- 同時実行数: `agents.defaults.subagents.maxConcurrent`（デフォルト `8`）

## 停止

- 依頼元チャットで `/stop` を送信すると、依頼元セッションが中止され、そこから起動されたアクティブなサブエージェント実行も停止し、ネストされた子へもカスケードします。
- `/subagents kill <id>` は特定のサブエージェントを停止し、その子へもカスケードします。

## 制限事項

- サブエージェントの通知は**ベストエフォート**です。gateway が再起動すると、保留中の「通知返却」作業は失われます。
- サブエージェントは引き続き同じ gateway プロセスのリソースを共有するため、`maxConcurrent` は安全弁として扱ってください。
- `sessions_spawn` は常に非ブロッキングです。即座に `{ status: "accepted", runId, childSessionKey }` を返します。
- サブエージェントコンテキストに注入されるのは `AGENTS.md` と `TOOLS.md` のみです（`SOUL.md`、`IDENTITY.md`、`USER.md`、`HEARTBEAT.md`、`BOOTSTRAP.md` は含まれません）。
- 最大ネスト深度は 5 です（`maxSpawnDepth` の範囲: 1–5）。ほとんどの用途では深度 2 を推奨します。
- `maxChildrenPerAgent` は、セッションごとのアクティブな子の数を制限します（デフォルト: 5、範囲: 1–20）。
