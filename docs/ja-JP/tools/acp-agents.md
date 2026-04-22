---
read_when:
    - ACP経由でコーディングハーネスを実行する
    - メッセージングチャンネルで会話にバインドされたACPセッションを設定する
    - メッセージチャンネルの会話を永続的なACPセッションにバインドする
    - ACPバックエンドとPlugin配線のトラブルシューティング
    - ACP完了配信やエージェント間ループのデバッグ
    - チャットから `/acp` コマンドを操作する
summary: Codex、Claude Code、Cursor、Gemini CLI、OpenClaw ACP、その他のハーネスエージェント向けにACPランタイムセッションを使用する
title: ACP Agents
x-i18n:
    generated_at: "2026-04-22T04:28:29Z"
    model: gpt-5.4
    provider: openai
    source_hash: 71ae74200cb7581a68c4593fd7e510378267daaf7acbcd7667cde56335ebadea
    source_path: tools/acp-agents.md
    workflow: 15
---

# ACP Agents

[Agent Client Protocol (ACP)](https://agentclientprotocol.com/) セッションにより、OpenClawはACPバックエンドPluginを通じて、外部のコーディングハーネス（たとえばPi、Claude Code、Codex、Cursor、Copilot、OpenClaw ACP、OpenCode、Gemini CLI、その他のサポートされたACPXハーネス）を実行できます。

OpenClawに平文で「これをCodexで実行して」や「スレッドでClaude Codeを起動して」と頼んだ場合、OpenClawはそのリクエストをACPランタイムへルーティングすべきです（ネイティブのサブエージェントランタイムではありません）。各ACPセッションspawnは、[バックグラウンドタスク](/ja-JP/automation/tasks) として追跡されます。

CodexやClaude Codeを、既存のOpenClawチャンネル会話へ外部MCPクライアントとして直接接続したい場合は、ACPの代わりに [`openclaw mcp serve`](/cli/mcp) を使ってください。

## どのページを見るべきですか？

近い位置にあって混同しやすいサーフェスが3つあります:

| やりたいこと...                                                                    | 使うもの                              | 注意                                                                                                        |
| ----------------------------------------------------------------------------------- | ------------------------------------- | ----------------------------------------------------------------------------------------------------------- |
| Codex、Claude Code、Gemini CLI、または別の外部ハーネスをOpenClaw _経由で_ 実行する | このページ: ACP Agents                | チャットにバインドされたセッション、`/acp spawn`、`sessions_spawn({ runtime: "acp" })`、バックグラウンドタスク、ランタイム制御 |
| OpenClaw Gatewayセッションを、エディタやクライアント向けのACPサーバー _として_ 公開する | [`openclaw acp`](/cli/acp)            | ブリッジモード。IDE/クライアントがstdio/WebSocket経由でOpenClawにACPで接続                                  |
| ローカルAI CLIをテキスト専用のフォールバックモデルとして再利用する                 | [CLI Backends](/ja-JP/gateway/cli-backends) | ACPではありません。OpenClawツール、ACP制御、ハーネスランタイムはありません                                  |

## これはすぐに使えますか？

通常は使えます。

- 新規インストールでは、バンドル済みの `acpx` ランタイムPluginがデフォルトで有効になっています。
- バンドル済みの `acpx` Pluginは、そのPluginローカルでpinされた `acpx` バイナリを優先します。
- 起動時に、OpenClawはそのバイナリをprobeし、必要なら自己修復します。
- すばやい準備確認をしたいなら、まず `/acp doctor` から始めてください。

初回利用時にまだ起こりうること:

- 対象ハーネスadapterが、そのハーネスを初めて使うときに `npx` でオンデマンド取得されることがあります。
- ベンダー認証は、そのハーネス用にホスト上に存在している必要があります。
- ホストにnpm/ネットワークアクセスがない場合、キャッシュが事前に温められるか、別の方法でadapterがインストールされるまでは、初回adapter取得が失敗することがあります。

例:

- `/acp spawn codex`: OpenClawは `acpx` のブートストラップ準備ができているはずですが、Codex ACP adapterはまだ初回取得が必要な場合があります。
- `/acp spawn claude`: Claude ACP adapterについても同様で、さらにそのホスト上でClaude側認証も必要です。

## 高速なオペレーター向けフロー

実用的な `/acp` ランブックが欲しい場合はこちらを使ってください:

1. セッションをspawnする:
   - `/acp spawn codex --bind here`
   - `/acp spawn codex --mode persistent --thread auto`
2. バインドされた会話またはスレッドで作業します（またはそのセッションキーを明示的に指定します）。
3. ランタイム状態を確認する:
   - `/acp status`
4. 必要に応じてランタイムオプションを調整する:
   - `/acp model <provider/model>`
   - `/acp permissions <profile>`
   - `/acp timeout <seconds>`
5. コンテキストを置き換えずにアクティブセッションを促す:
   - `/acp steer tighten logging and continue`
6. 作業を停止する:
   - `/acp cancel`（現在のターンを停止）、または
   - `/acp close`（セッションを閉じてバインディングも削除）

## 人向けクイックスタート

自然なリクエストの例:

- 「このDiscordチャンネルをCodexにバインドして」
- 「ここでスレッド内に永続的なCodexセッションを起動して、集中させて」
- 「これをワンショットのClaude Code ACPセッションとして実行して、結果を要約して」
- 「このiMessageチャットをCodexにバインドして、追加入力も同じワークスペースで続けて」
- 「このタスクはGemini CLIをスレッドで使って、その後の追加依頼も同じスレッドで続けて」

OpenClawが行うべきこと:

1. `runtime: "acp"` を選ぶ。
2. 要求されたハーネスターゲット（たとえば `agentId` なら `codex`）を解決する。
3. 現在の会話へのバインディングが要求され、アクティブチャンネルがそれをサポートしている場合、その会話にACPセッションをバインドする。
4. そうでなければ、スレッドバインディングが要求され、現在のチャンネルがそれをサポートしている場合、そのスレッドにACPセッションをバインドする。
5. フォーカス解除/クローズ/期限切れになるまで、その後のバインド済みメッセージを同じACPセッションへルーティングする。

## ACPとサブエージェントの違い

外部ハーネスランタイムが欲しい場合はACPを使ってください。OpenClawネイティブの委譲実行が欲しい場合はサブエージェントを使ってください。

| 領域          | ACPセッション                          | サブエージェント実行                |
| ------------- | -------------------------------------- | ----------------------------------- |
| ランタイム    | ACPバックエンドPlugin（例: acpx）      | OpenClawネイティブのサブエージェントランタイム |
| セッションキー | `agent:<agentId>:acp:<uuid>`           | `agent:<agentId>:subagent:<uuid>`   |
| 主なコマンド  | `/acp ...`                             | `/subagents ...`                    |
| Spawnツール   | `runtime:"acp"` を使う `sessions_spawn` | `sessions_spawn`（デフォルトランタイム） |

参照: [Sub-agents](/ja-JP/tools/subagents)

## ACPがClaude Codeをどう実行するか

ACP経由のClaude Codeでは、スタックは次の通りです:

1. OpenClaw ACPセッションcontrol plane
2. バンドル済み `acpx` ランタイムPlugin
3. Claude ACP adapter
4. Claude側のランタイム/セッション機構

重要な違い:

- ACP Claudeは、ACP制御、セッション再開、バックグラウンドタスク追跡、任意の会話/スレッドバインディングを備えたハーネスセッションです。
- CLIバックエンドは別のテキスト専用ローカルフォールバックランタイムです。参照: [CLI Backends](/ja-JP/gateway/cli-backends)

オペレーター向けの実用的なルール:

- `/acp spawn`、バインド可能セッション、ランタイム制御、または永続的ハーネス作業が欲しい: ACPを使う
- 生のCLI経由の簡単なローカルテキストフォールバックが欲しい: CLIバックエンドを使う

## バインド済みセッション

### 現在の会話へのバインド

現在の会話を子スレッドを作らずに永続的なACPワークスペースにしたい場合は、`/acp spawn <harness> --bind here` を使ってください。

動作:

- OpenClawは引き続き、チャンネル転送、auth、安全性、配信を所有します。
- 現在の会話が、spawnされたACPセッションキーに固定されます。
- その会話での追加入力は同じACPセッションへルーティングされます。
- `/new` と `/reset` は、同じバインド済みACPセッションをその場でリセットします。
- `/acp close` はセッションを閉じ、現在の会話バインディングを削除します。

これが実際に意味すること:

- `--bind here` は同じチャットサーフェスを保ちます。Discordでは、現在のチャンネルはそのまま現在のチャンネルです。
- `--bind here` は、新しい作業をspawnするなら新しいACPセッションを作ることがあります。このバインドは、そのセッションを現在の会話へ接続します。
- `--bind here` 自体は、Discordの子スレッドやTelegramトピックを作成しません。
- ACPランタイムは、それ自体の作業ディレクトリ（`cwd`）やバックエンド管理ワークスペースをディスク上に持つことができます。そのランタイムワークスペースはチャットサーフェスとは別であり、新しいメッセージングスレッドを意味するものではありません。
- 別のACPエージェントへspawnし、`--cwd` を渡さない場合、OpenClawはデフォルトでリクエスターではなく**対象エージェントの**ワークスペースを継承します。
- その継承ワークスペースパスが存在しない場合（`ENOENT`/`ENOTDIR`）、OpenClawは誤ったツリーを黙って再利用するのではなく、バックエンドのデフォルトcwdへフォールバックします。
- 継承ワークスペースが存在してもアクセスできない場合（例: `EACCES`）、spawnは `cwd` を落とさずに実際のアクセスエラーを返します。

メンタルモデル:

- チャットサーフェス: 人が会話を続ける場所（`Discord channel`、`Telegram topic`、`iMessage chat`）
- ACPセッション: OpenClawがルーティングする永続的なCodex/Claude/Geminiランタイム状態
- 子スレッド/トピック: `--thread ...` でのみ作成される任意の追加メッセージングサーフェス
- ランタイムワークスペース: ハーネスが動作するファイルシステム上の場所（`cwd`、repo checkout、バックエンドワークスペース）

例:

- `/acp spawn codex --bind here`: このチャットを維持し、Codex ACPセッションをspawnまたは接続し、今後のメッセージをここからそこへルーティングする
- `/acp spawn codex --thread auto`: OpenClawは子スレッド/トピックを作成し、そこへACPセッションをバインドすることがあります
- `/acp spawn codex --bind here --cwd /workspace/repo`: 上と同じチャットバインディングだが、Codexは `/workspace/repo` で動作する

現在の会話バインディング対応:

- 現在の会話へのバインディング対応を公開するチャット/メッセージチャンネルは、共有会話バインディング経路を通じて `--bind here` を使えます。
- カスタムなスレッド/トピック意味論を持つチャンネルも、同じ共有インターフェースの背後でチャンネル固有の正規化を提供できます。
- `--bind here` は常に「現在の会話をその場でバインドする」ことを意味します。
- 汎用の現在会話バインドは共有のOpenClawバインディングストアを使い、通常のGateway再起動をまたいで保持されます。

注意:

- `/acp spawn` では `--bind here` と `--thread ...` は相互排他的です。
- Discordでは、`--bind here` は現在のチャンネルまたはスレッドをその場でバインドします。`spawnAcpSessions` が必要なのは、OpenClawが `--thread auto|here` のために子スレッドを作る必要がある場合だけです。
- アクティブチャンネルが現在の会話へのACPバインディングを公開していない場合、OpenClawは明確な未対応メッセージを返します。
- `resume` と「新しいセッション」かどうかはACPセッションの問題であり、チャンネルの問題ではありません。現在のチャットサーフェスを変えずに、ランタイム状態を再利用または置換できます。

### スレッドにバインドされたセッション

チャンネルadapterでスレッドバインディングが有効な場合、ACPセッションをスレッドにバインドできます:

- OpenClawは、スレッドを対象ACPセッションへバインドします。
- そのスレッドでの追加入力は、バインドされたACPセッションへルーティングされます。
- ACP出力は同じスレッドへ返送されます。
- フォーカス解除/クローズ/アーカイブ/アイドルタイムアウト/最大経過時間の期限切れでバインディングは削除されます。

スレッドバインディング対応はadapter依存です。アクティブチャンネルadapterがスレッドバインディングをサポートしていない場合、OpenClawは明確な未対応/利用不可メッセージを返します。

スレッドバインドACPに必要なfeature flag:

- `acp.enabled=true`
- `acp.dispatch.enabled` はデフォルトでオン（ACP dispatchを一時停止するには `false` を設定）
- チャンネルadapterのACPスレッドspawnフラグを有効化（adapter依存）
  - Discord: `channels.discord.threadBindings.spawnAcpSessions=true`
  - Telegram: `channels.telegram.threadBindings.spawnAcpSessions=true`

### スレッド対応チャンネル

- セッション/スレッドバインディングcapabilityを公開する任意のチャンネルadapter。
- 現在の組み込み対応:
  - Discord threads/channels
  - Telegram topics（グループ/スーパーグループのforum topicおよびDM topic）
- Pluginチャンネルも同じバインディングインターフェースを通じて対応を追加できます。

## チャンネル固有設定

非エフェメラルなワークフローでは、トップレベルの `bindings[]` エントリで永続的なACPバインディングを設定してください。

### バインディングモデル

- `bindings[].type="acp"` は永続的ACP会話バインディングを示します。
- `bindings[].match` は対象会話を識別します:
  - Discordチャンネルまたはスレッド: `match.channel="discord"` + `match.peer.id="<channelOrThreadId>"`
  - Telegram forum topic: `match.channel="telegram"` + `match.peer.id="<chatId>:topic:<topicId>"`
  - BlueBubbles DM/グループチャット: `match.channel="bluebubbles"` + `match.peer.id="<handle|chat_id:*|chat_guid:*|chat_identifier:*>"`
    安定したグループバインディングには `chat_id:*` または `chat_identifier:*` を推奨します。
  - iMessage DM/グループチャット: `match.channel="imessage"` + `match.peer.id="<handle|chat_id:*|chat_guid:*|chat_identifier:*>"`
    安定したグループバインディングには `chat_id:*` を推奨します。
- `bindings[].agentId` は所有するOpenClawエージェントIDです。
- 任意のACP上書きは `bindings[].acp` 配下に置きます:
  - `mode`（`persistent` または `oneshot`）
  - `label`
  - `cwd`
  - `backend`

### エージェントごとのランタイムデフォルト

ACPデフォルトをエージェントごとに一度定義するには `agents.list[].runtime` を使います:

- `agents.list[].runtime.type="acp"`
- `agents.list[].runtime.acp.agent`（ハーネスID、例: `codex` または `claude`）
- `agents.list[].runtime.acp.backend`
- `agents.list[].runtime.acp.mode`
- `agents.list[].runtime.acp.cwd`

ACPバインド済みセッションの上書き優先順位:

1. `bindings[].acp.*`
2. `agents.list[].runtime.acp.*`
3. グローバルACPデフォルト（例: `acp.backend`）

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

動作:

- OpenClawは、設定されたACPセッションが使用前に存在することを保証します。
- そのチャンネルまたはトピック内のメッセージは、設定済みACPセッションへルーティングされます。
- バインド済み会話では、`/new` と `/reset` は同じACPセッションキーをその場でリセットします。
- 一時的なランタイムバインディング（たとえばthread-focusフローで作られたもの）は、存在する場所で引き続き適用されます。
- 明示的な `cwd` なしのクロスエージェントACP spawnでは、OpenClawはエージェント設定から対象エージェントのワークスペースを継承します。
- 継承されたワークスペースパスが存在しない場合はバックエンドのデフォルトcwdへフォールバックし、存在するがアクセス失敗する場合はspawnエラーとして表面化します。

## ACPセッションの開始（インターフェース）

### `sessions_spawn` から

エージェントターンまたはツール呼び出しからACPセッションを開始するには `runtime: "acp"` を使います。

```json
{
  "task": "Open the repo and summarize failing tests",
  "runtime": "acp",
  "agentId": "codex",
  "thread": true,
  "mode": "session"
}
```

注意:

- `runtime` のデフォルトは `subagent` なので、ACPセッションには明示的に `runtime: "acp"` を設定してください。
- `agentId` を省略した場合、設定されていればOpenClawは `acp.defaultAgent` を使います。
- `mode: "session"` では、永続的なバインド済み会話を維持するために `thread: true` が必要です。

インターフェース詳細:

- `task`（必須）: ACPセッションへ送られる初期プロンプト。
- `runtime`（ACPでは必須）: `"acp"` でなければなりません。
- `agentId`（任意）: ACP対象ハーネスID。設定されていれば `acp.defaultAgent` にフォールバックします。
- `thread`（任意、デフォルト `false`）: 対応している場合にスレッドバインディングフローを要求します。
- `mode`（任意）: `run`（ワンショット）または `session`（永続）。
  - デフォルトは `run`
  - `thread: true` で modeを省略した場合、OpenClawはランタイム経路ごとに永続動作をデフォルトにすることがあります
  - `mode: "session"` には `thread: true` が必要
- `cwd`（任意）: 要求するランタイム作業ディレクトリ（バックエンド/ランタイムポリシーで検証されます）。省略時、ACP spawnは、設定されていれば対象エージェントのワークスペースを継承します。継承パスが存在しない場合はバックエンドデフォルトへフォールバックし、実際のアクセスエラーはそのまま返されます。
- `label`（任意）: セッション/バナーテキストで使われるoperator向けラベル。
- `resumeSessionId`（任意）: 新しいACPセッションを作る代わりに既存ACPセッションを再開します。エージェントは `session/load` 経由で会話履歴を再生します。`runtime: "acp"` が必要です。
- `streamTo`（任意）: `"parent"` は初期ACP実行の進捗サマリーをsystem eventとして要求元セッションへストリームします。
  - 利用可能な場合、受理された応答には、セッションスコープのJSONLログ（`<sessionId>.acp-stream.jsonl`）を指す `streamLogPath` が含まれることがあります。完全な中継履歴を見るにはそれをtailしてください。

## 配信モデル

ACPセッションは、対話型ワークスペースにも、親所有のバックグラウンド作業にもなれます。配信経路はその形によって変わります。

### 対話型ACPセッション

対話型セッションは、見えるチャットサーフェス上で会話を続けることを目的とします:

- `/acp spawn ... --bind here` は現在の会話をACPセッションへバインドします。
- `/acp spawn ... --thread ...` はチャンネルスレッド/トピックをACPセッションへバインドします。
- 永続的に設定された `bindings[].type="acp"` は、一致した会話を同じACPセッションへルーティングします。

バインドされた会話での追加入力は、そのACPセッションへ直接ルーティングされ、ACP出力は同じチャンネル/スレッド/トピックへ返送されます。

### 親所有のワンショットACPセッション

別のエージェント実行によってspawnされたワンショットACPセッションは、サブエージェントと同様のバックグラウンド子セッションです:

- 親は `sessions_spawn({ runtime: "acp", mode: "run" })` で作業を依頼します。
- 子は独自のACPハーネスセッション内で実行されます。
- 完了は内部のタスク完了通知経路を通じて報告されます。
- ユーザー向け返信が有用な場合、親は通常のアシスタント口調で子の結果を書き換えます。

この経路を親子間のピアツーピアチャットとして扱わないでください。子にはすでに親へ戻る完了チャネルがあります。

### `sessions_send` とA2A配信

`sessions_send` はspawn後に別のセッションを対象にできます。通常のpeer sessionでは、OpenClawはメッセージ注入後にエージェント間（A2A）のフォローアップ経路を使います:

- 対象セッションの返信を待つ
- 必要に応じて、要求元と対象の間で制限付きのフォローアップターン交換を行う
- 対象にannounceメッセージを生成させる
- そのannounceを見えているチャンネルまたはスレッドへ配信する

このA2A経路は、送信者が見えるフォローアップを必要とするpeer send向けのフォールバックです。たとえば広い `tools.sessions.visibility` 設定の下で、無関係なセッションがACP対象を見てメッセージできる場合など、引き続き有効です。

OpenClawは、要求元が自分自身の親所有ワンショットACP子セッションの親である場合にのみA2Aフォローアップをスキップします。その場合、タスク完了の上にA2Aを重ねると、親が子の結果で起こされ、その親の返信が子へ送り返され、親子のエコーループを作る可能性があります。`sessions_send` の結果は、その所有子ケースでは `delivery.status="skipped"` を報告します。結果はすでに完了経路が担当しているためです。

### 既存セッションを再開する

新規開始ではなく以前のACPセッションを続行するには `resumeSessionId` を使ってください。エージェントは `session/load` 経由で会話履歴を再生するため、それまでの完全な文脈を持って再開できます。

```json
{
  "task": "Continue where we left off — fix the remaining test failures",
  "runtime": "acp",
  "agentId": "codex",
  "resumeSessionId": "<previous-session-id>"
}
```

よくある用途:

- ラップトップから携帯へCodexセッションを引き継ぐ — エージェントに、中断したところから再開するよう伝える
- CLIで対話的に始めたコーディングセッションを、今度はエージェント経由でヘッドレスに続ける
- Gateway再起動やアイドルタイムアウトで中断された作業を再開する

注意:

- `resumeSessionId` には `runtime: "acp"` が必要です。サブエージェントランタイムで使うとエラーになります。
- `resumeSessionId` は上流のACP会話履歴を復元します。`thread` と `mode` は、作成中の新しいOpenClawセッションに対して通常通り適用されるため、`mode: "session"` には引き続き `thread: true` が必要です。
- 対象エージェントは `session/load` をサポートしている必要があります（CodexとClaude Codeはサポートします）。
- セッションIDが見つからない場合、spawnは明確なエラーで失敗します。新規セッションへの黙ったフォールバックはありません。

### オペレータースモークテスト

Gatewayデプロイ後に、ユニットテストが通るだけでなく、ACP spawnが実際にエンドツーエンドで動作しているかを手早くライブ確認したい場合に使ってください。

推奨ゲート:

1. 対象ホスト上で、デプロイされたGatewayのバージョン/コミットを確認する。
2. デプロイされたソースに
   `src/gateway/sessions-patch.ts` のACP lineage acceptance
   （`subagent:* or acp:* sessions`）が含まれていることを確認する。
3. ライブエージェント（たとえば `jpclawhq` 上の
   `razor(main)`）への一時的なACPX bridgeセッションを開く。
4. そのエージェントに、次を指定して `sessions_spawn` を呼ぶよう依頼する:
   - `runtime: "acp"`
   - `agentId: "codex"`
   - `mode: "run"`
   - task: `Reply with exactly LIVE-ACP-SPAWN-OK`
5. エージェントが次を報告することを確認する:
   - `accepted=yes`
   - 実際の `childSessionKey`
   - validatorエラーなし
6. 一時的なACPX bridgeセッションをクリーンアップする。

ライブエージェントへのプロンプト例:

```text
Use the sessions_spawn tool now with runtime: "acp", agentId: "codex", and mode: "run".
Set the task to: "Reply with exactly LIVE-ACP-SPAWN-OK".
Then report only: accepted=<yes/no>; childSessionKey=<value or none>; error=<exact text or none>.
```

注意:

- このスモークテストは、意図的にスレッドバインドの永続ACPセッションをテストしていない限り、`mode: "run"` のままにしてください。
- 基本ゲートでは `streamTo: "parent"` を必須にしないでください。この経路は要求元/セッションcapabilityに依存し、別の統合チェックです。
- スレッドバインドの `mode: "session"` テストは、実際のDiscordスレッドまたはTelegramトピックからの、第2段階のより豊かな統合パスとして扱ってください。

## sandbox互換性

ACPセッションは現在、OpenClaw sandbox内ではなく、ホストランタイム上で実行されます。

現在の制限:

- 要求元セッションがsandbox化されている場合、`sessions_spawn({ runtime: "acp" })` と `/acp spawn` の両方でACP spawnはブロックされます。
  - エラー: `Sandboxed sessions cannot spawn ACP sessions because runtime="acp" runs on the host. Use runtime="subagent" from sandboxed sessions.`
- `runtime: "acp"` を使う `sessions_spawn` は `sandbox: "require"` をサポートしません。
  - エラー: `sessions_spawn sandbox="require" is unsupported for runtime="acp" because ACP sessions run outside the sandbox. Use runtime="subagent" or sandbox="inherit".`

sandbox強制実行が必要な場合は `runtime: "subagent"` を使ってください。

### `/acp` コマンドから

チャットから明示的なoperator制御が必要な場合は `/acp spawn` を使ってください。

```text
/acp spawn codex --mode persistent --thread auto
/acp spawn codex --mode oneshot --thread off
/acp spawn codex --bind here
/acp spawn codex --thread here
```

主要フラグ:

- `--mode persistent|oneshot`
- `--bind here|off`
- `--thread auto|here|off`
- `--cwd <absolute-path>`
- `--label <name>`

参照: [Slash Commands](/ja-JP/tools/slash-commands)

## セッションターゲット解決

ほとんどの `/acp` アクションは、任意のセッションターゲット（`session-key`, `session-id`, `session-label`）を受け付けます。

解決順序:

1. 明示的ターゲット引数（または `/acp steer` 用の `--session`）
   - まずkeyを試す
   - 次にUUID形状のsession IDを試す
   - その後labelを試す
2. 現在のスレッドバインディング（この会話/スレッドがACPセッションにバインドされている場合）
3. 現在の要求元セッションへのフォールバック

現在の会話バインディングとスレッドバインディングの両方が手順2に参加します。

ターゲットが解決できない場合、OpenClawは明確なエラー（`Unable to resolve session target: ...`）を返します。

## spawnバインドモード

`/acp spawn` は `--bind here|off` をサポートします。

| Mode   | 動作                                                                     |
| ------ | ------------------------------------------------------------------------ |
| `here` | 現在アクティブな会話をその場でバインドする。アクティブな会話がなければ失敗する。 |
| `off`  | 現在の会話バインディングを作成しない。                                   |

注意:

- `--bind here` は、「このチャンネルまたはチャットをCodex対応にする」ための最も簡単なoperator経路です。
- `--bind here` は子スレッドを作成しません。
- `--bind here` は、現在の会話バインディング対応を公開するチャンネルでのみ利用できます。
- `--bind` と `--thread` は同じ `/acp spawn` 呼び出しで併用できません。

## spawnスレッドモード

`/acp spawn` は `--thread auto|here|off` をサポートします。

| Mode   | 動作                                                                                              |
| ------ | ------------------------------------------------------------------------------------------------- |
| `auto` | アクティブなスレッド内ならそのスレッドをバインドする。スレッド外なら、対応していれば子スレッドを作成してバインドする。 |
| `here` | 現在アクティブなスレッドを必須にする。スレッド内でなければ失敗する。                                |
| `off`  | バインディングなし。セッションは未バインドで開始する。                                            |

注意:

- スレッドバインディング非対応サーフェスでは、デフォルト動作は実質的に `off` です。
- スレッドバインドspawnにはチャンネルポリシー対応が必要です:
  - Discord: `channels.discord.threadBindings.spawnAcpSessions=true`
  - Telegram: `channels.telegram.threadBindings.spawnAcpSessions=true`
- 子スレッドを作らずに現在の会話を固定したい場合は `--bind here` を使ってください。

## ACP制御

利用可能なコマンド群:

- `/acp spawn`
- `/acp cancel`
- `/acp steer`
- `/acp close`
- `/acp status`
- `/acp set-mode`
- `/acp set`
- `/acp cwd`
- `/acp permissions`
- `/acp timeout`
- `/acp model`
- `/acp reset-options`
- `/acp sessions`
- `/acp doctor`
- `/acp install`

`/acp status` は、有効なランタイムオプションと、利用可能な場合はランタイムレベルとバックエンドレベルの両方のセッションIDを表示します。

一部の制御はバックエンドcapabilityに依存します。バックエンドがある制御をサポートしていない場合、OpenClawは明確なunsupported-controlエラーを返します。

## ACPコマンドクックブック

| Command              | 何をするか                                             | Example                                                       |
| -------------------- | ------------------------------------------------------ | ------------------------------------------------------------- |
| `/acp spawn`         | ACPセッションを作成する。現在の会話バインドまたはスレッドバインドは任意。 | `/acp spawn codex --bind here --cwd /repo`                    |
| `/acp cancel`        | 対象セッションの実行中ターンをキャンセルする。         | `/acp cancel agent:codex:acp:<uuid>`                          |
| `/acp steer`         | 実行中セッションへsteer指示を送る。                    | `/acp steer --session support inbox prioritize failing tests` |
| `/acp close`         | セッションを閉じ、スレッドターゲットのバインドを解除する。 | `/acp close`                                                  |
| `/acp status`        | バックエンド、モード、状態、ランタイムオプション、capabilityを表示する。 | `/acp status`                                                 |
| `/acp set-mode`      | 対象セッションのランタイムモードを設定する。           | `/acp set-mode plan`                                          |
| `/acp set`           | 汎用ランタイム設定オプションを書き込む。               | `/acp set model openai/gpt-5.4`                               |
| `/acp cwd`           | ランタイム作業ディレクトリ上書きを設定する。           | `/acp cwd /Users/user/Projects/repo`                          |
| `/acp permissions`   | 承認ポリシープロファイルを設定する。                   | `/acp permissions strict`                                     |
| `/acp timeout`       | ランタイムタイムアウト（秒）を設定する。               | `/acp timeout 120`                                            |
| `/acp model`         | ランタイムモデル上書きを設定する。                     | `/acp model anthropic/claude-opus-4-6`                        |
| `/acp reset-options` | セッションのランタイムオプション上書きを削除する。     | `/acp reset-options`                                          |
| `/acp sessions`      | ストアから最近のACPセッションを一覧表示する。          | `/acp sessions`                                               |
| `/acp doctor`        | バックエンド健全性、capability、実行可能な修正を表示する。 | `/acp doctor`                                                 |
| `/acp install`       | 決定的なインストールおよび有効化手順を表示する。       | `/acp install`                                                |

`/acp sessions` は、現在バインドされているセッションまたは要求元セッションのストアを読みます。`session-key`, `session-id`, `session-label` トークンを受け付けるコマンドは、カスタムなエージェントごとの `session.store` ルートを含め、Gatewayセッション探索を通じてターゲットを解決します。

## ランタイムオプションのマッピング

`/acp` には便利コマンドと汎用setterがあります。

等価な操作:

- `/acp model <id>` はランタイム設定キー `model` にマップされます。
- `/acp permissions <profile>` はランタイム設定キー `approval_policy` にマップされます。
- `/acp timeout <seconds>` はランタイム設定キー `timeout` にマップされます。
- `/acp cwd <path>` はランタイムcwd上書きを直接更新します。
- `/acp set <key> <value>` は汎用経路です。
  - 特別扱い: `key=cwd` はcwd上書き経路を使います。
- `/acp reset-options` は対象セッションのすべてのランタイム上書きをクリアします。

## acpxハーネス対応（現状）

現在のacpx組み込みハーネスalias:

- `claude`
- `codex`
- `copilot`
- `cursor`（Cursor CLI: `cursor-agent acp`）
- `droid`
- `gemini`
- `iflow`
- `kilocode`
- `kimi`
- `kiro`
- `openclaw`
- `opencode`
- `pi`
- `qwen`

OpenClawがacpxバックエンドを使う場合、acpx設定でカスタムagent aliasを定義していない限り、`agentId` にはこれらの値を優先してください。
ローカルのCursorインストールがまだACPを `agent acp` として公開している場合は、組み込みデフォルトを変えるのではなく、acpx設定で `cursor` agent commandを上書きしてください。

直接のacpx CLI使用では、`--agent <command>` 経由で任意adapterも指定できますが、その生のescape hatchはacpx CLI機能であり、通常のOpenClaw `agentId` 経路ではありません。

## 必須設定

Core ACPベースライン:

```json5
{
  acp: {
    enabled: true,
    // 任意。デフォルトはtrue。/acp制御を維持したままACP dispatchを一時停止するにはfalseに設定します。
    dispatch: { enabled: true },
    backend: "acpx",
    defaultAgent: "codex",
    allowedAgents: [
      "claude",
      "codex",
      "copilot",
      "cursor",
      "droid",
      "gemini",
      "iflow",
      "kilocode",
      "kimi",
      "kiro",
      "openclaw",
      "opencode",
      "pi",
      "qwen",
    ],
    maxConcurrentSessions: 8,
    stream: {
      coalesceIdleMs: 300,
      maxChunkChars: 1200,
    },
    runtime: {
      ttlMinutes: 120,
    },
  },
}
```

スレッドバインディング設定はチャンネルadapter固有です。Discordの例:

```json5
{
  session: {
    threadBindings: {
      enabled: true,
      idleHours: 24,
      maxAgeHours: 0,
    },
  },
  channels: {
    discord: {
      threadBindings: {
        enabled: true,
        spawnAcpSessions: true,
      },
    },
  },
}
```

スレッドバインドACP spawnが動作しない場合は、まずadapter feature flagを確認してください:

- Discord: `channels.discord.threadBindings.spawnAcpSessions=true`

現在の会話バインドには子スレッド作成は必要ありません。必要なのは、アクティブな会話コンテキストと、ACP会話バインディングを公開するチャンネルadapterです。

参照: [Configuration Reference](/ja-JP/gateway/configuration-reference)

## acpxバックエンド向けPlugin設定

新規インストールでは、バンドル済みの `acpx` ランタイムPluginがデフォルトで有効になっているため、通常ACPは手動Pluginインストール手順なしで動作します。

まず次から始めてください:

```text
/acp doctor
```

`acpx` を無効にした、`plugins.allow` / `plugins.deny` で拒否した、またはローカル開発チェックアウトへ切り替えたい場合は、明示的なPlugin経路を使ってください:

```bash
openclaw plugins install acpx
openclaw config set plugins.entries.acpx.enabled true
```

開発中のローカルワークスペースインストール:

```bash
openclaw plugins install ./path/to/local/acpx-plugin
```

その後、バックエンド健全性を確認します:

```text
/acp doctor
```

### acpxコマンドとバージョン設定

デフォルトでは、バンドル済みacpxバックエンドPlugin（`acpx`）はPluginローカルでpinされたバイナリを使います:

1. コマンドは、ACPX Pluginパッケージ内のPluginローカル `node_modules/.bin/acpx` がデフォルトです。
2. 期待バージョンはextension pinがデフォルトです。
3. 起動時、ACPバックエンドは即座にnot-readyとして登録されます。
4. バックグラウンドensureジョブが `acpx --version` を検証します。
5. Pluginローカルバイナリがないか不一致の場合、次を実行します:
   `npm install --omit=dev --no-save acpx@<pinned>` を行い、再検証します。

Plugin設定でコマンド/バージョンを上書きできます:

```json
{
  "plugins": {
    "entries": {
      "acpx": {
        "enabled": true,
        "config": {
          "command": "../acpx/dist/cli.js",
          "expectedVersion": "any"
        }
      }
    }
  }
}
```

注意:

- `command` は絶対パス、相対パス、またはコマンド名（`acpx`）を受け付けます。
- 相対パスはOpenClawワークスペースディレクトリから解決されます。
- `expectedVersion: "any"` は厳密なバージョン一致を無効化します。
- `command` がカスタムバイナリ/パスを指している場合、Pluginローカルの自動インストールは無効になります。
- バックエンド健全性チェック実行中でも、OpenClaw起動は非ブロッキングのままです。

参照: [Plugins](/ja-JP/tools/plugin)

### 依存関係の自動インストール

`npm install -g openclaw` でOpenClawをグローバルインストールすると、acpxランタイム依存関係（プラットフォーム固有バイナリ）はpostinstall hookによって自動インストールされます。自動インストールに失敗しても、Gatewayは通常通り起動し、不足依存関係は `openclaw acp doctor` を通じて報告されます。

### Plugin tools MCPブリッジ

デフォルトでは、ACPXセッションはOpenClawのPlugin登録ツールをACPハーネスへ**公開しません**。

CodexやClaude CodeのようなACPエージェントに、memory recall/storeのようなインストール済みOpenClaw Pluginツールを呼ばせたい場合は、専用ブリッジを有効にしてください:

```bash
openclaw config set plugins.entries.acpx.config.pluginToolsMcpBridge true
```

これが行うこと:

- ACPXセッションブートストラップに、`openclaw-plugin-tools` という名前の組み込みMCPサーバーを注入する。
- インストールされ、有効なOpenClaw Pluginsによってすでに登録されているPluginツールを公開する。
- この機能を明示的かつデフォルトoffのままにする。

セキュリティと信頼に関する注意:

- これはACPハーネスのツールサーフェスを拡張します。
- ACPエージェントがアクセスできるのは、GatewayですでにアクティブなPluginツールだけです。
- これを、それらのPluginsをOpenClaw自身で実行させるのと同じ信頼境界として扱ってください。
- 有効化する前に、インストール済みPluginsを確認してください。

カスタム `mcpServers` はこれまで通り動作します。組み込みのplugin-toolsブリッジは、汎用MCPサーバー設定の代替ではなく、追加のオプトイン利便機能です。

### ランタイムタイムアウト設定

バンドル済みの `acpx` Pluginは、埋め込みランタイムターンに対してデフォルトで120秒のタイムアウトを使います。これによりGemini CLIのような遅いハーネスでも、ACP起動と初期化を完了する十分な時間が得られます。ホストで別のランタイム制限が必要なら上書きしてください:

```bash
openclaw config set plugins.entries.acpx.config.timeoutSeconds 180
```

この値を変更したらGatewayを再起動してください。

### ヘルスプローブagent設定

バンドル済みの `acpx` Pluginは、埋め込みランタイムバックエンドの準備完了判定中に1つのハーネスagentをprobeします。デフォルトは `codex` です。デプロイで別のデフォルトACP agentを使う場合は、probe agentを同じIDに設定してください:

```bash
openclaw config set plugins.entries.acpx.config.probeAgent claude
```

この値を変更したらGatewayを再起動してください。

## 権限設定

ACPセッションは非対話的に実行されます — ファイル書き込みやシェル実行の権限プロンプトを承認/拒否するためのTTYはありません。acpx Pluginは、権限の扱いを制御する2つの設定キーを提供します:

これらのACPXハーネス権限は、OpenClaw exec承認とも、Claude CLIの `--permission-mode bypassPermissions` のようなCLIバックエンドのベンダーバイパスflagとも別物です。ACPXの `approve-all` は、ACPセッション向けのハーネスレベルの非常停止スイッチです。

### `permissionMode`

ハーネスagentがプロンプトなしで実行できる操作を制御します。

| Value           | 動作                                                        |
| --------------- | ----------------------------------------------------------- |
| `approve-all`   | すべてのファイル書き込みとシェルコマンドを自動承認します。 |
| `approve-reads` | 読み取りのみ自動承認します。書き込みとexecはプロンプトが必要です。 |
| `deny-all`      | すべての権限プロンプトを拒否します。                         |

### `nonInteractivePermissions`

権限プロンプトが表示されるはずだが対話的TTYが利用できない場合（ACPセッションでは常にそうです）に、どうするかを制御します。

| Value  | 動作                                                               |
| ------ | ------------------------------------------------------------------ |
| `fail` | `AcpRuntimeError` でセッションを中断します。**（デフォルト）**     |
| `deny` | 権限を黙って拒否し、そのまま継続します（穏やかな段階的劣化）。     |

### 設定

Plugin設定経由で設定します:

```bash
openclaw config set plugins.entries.acpx.config.permissionMode approve-all
openclaw config set plugins.entries.acpx.config.nonInteractivePermissions fail
```

これらの値を変更したらGatewayを再起動してください。

> **重要:** OpenClawは現在、デフォルトで `permissionMode=approve-reads` と `nonInteractivePermissions=fail` を使います。非対話的なACPセッションでは、権限プロンプトを発生させる書き込みまたはexecは、`AcpRuntimeError: Permission prompt unavailable in non-interactive mode` で失敗することがあります。
>
> 権限を制限したい場合は、セッションがクラッシュする代わりに穏やかに段階的劣化するよう、`nonInteractivePermissions` を `deny` に設定してください。

## トラブルシューティング

| Symptom                                                                     | Likely cause                                                                    | Fix                                                                                                                                                               |
| --------------------------------------------------------------------------- | ------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `ACP runtime backend is not configured`                                     | バックエンドPluginが存在しないか無効。                                          | バックエンドPluginをインストールして有効化し、その後 `/acp doctor` を実行してください。                                                                          |
| `ACP is disabled by policy (acp.enabled=false)`                             | ACPがグローバルに無効。                                                         | `acp.enabled=true` を設定してください。                                                                                                                            |
| `ACP dispatch is disabled by policy (acp.dispatch.enabled=false)`           | 通常のスレッドメッセージからのdispatchが無効。                                  | `acp.dispatch.enabled=true` を設定してください。                                                                                                                   |
| `ACP agent "<id>" is not allowed by policy`                                 | agentがallowlistに入っていない。                                                | 許可された `agentId` を使うか、`acp.allowedAgents` を更新してください。                                                                                           |
| `Unable to resolve session target: ...`                                     | key/id/labelトークンが不正。                                                    | `/acp sessions` を実行し、正確なkey/labelをコピーして再試行してください。                                                                                        |
| `--bind here requires running /acp spawn inside an active ... conversation` | `--bind here` がアクティブなバインド可能会話なしで使われた。                    | 対象チャット/チャンネルへ移動して再試行するか、未バインドspawnを使ってください。                                                                                  |
| `Conversation bindings are unavailable for <channel>.`                      | adapterに現在の会話へのACPバインディングcapabilityがない。                      | 対応していれば `/acp spawn ... --thread ...` を使うか、トップレベル `bindings[]` を設定するか、対応チャンネルへ移動してください。                                 |
| `--thread here requires running /acp spawn inside an active ... thread`     | `--thread here` がスレッドコンテキスト外で使われた。                            | 対象スレッドへ移動するか、`--thread auto`/`off` を使ってください。                                                                                                |
| `Only <user-id> can rebind this channel/conversation/thread.`               | 別ユーザーが現在のバインディング対象を所有している。                            | 所有者として再バインドするか、別の会話またはスレッドを使ってください。                                                                                            |
| `Thread bindings are unavailable for <channel>.`                            | adapterにスレッドバインディングcapabilityがない。                               | `--thread off` を使うか、対応adapter/チャンネルへ移動してください。                                                                                               |
| `Sandboxed sessions cannot spawn ACP sessions ...`                          | ACPランタイムはホスト側であり、要求元セッションがsandbox化されている。          | sandbox化セッションからは `runtime="subagent"` を使うか、非sandboxセッションからACP spawnを実行してください。                                                     |
| `sessions_spawn sandbox="require" is unsupported for runtime="acp" ...`     | ACPランタイムに対して `sandbox="require"` が要求された。                        | sandbox必須なら `runtime="subagent"` を使うか、非sandboxセッションから `sandbox="inherit"` 付きでACPを使ってください。                                            |
| Missing ACP metadata for bound session                                      | 古い/削除済みACPセッションメタデータ。                                          | `/acp spawn` で再作成し、その後スレッドを再バインド/再フォーカスしてください。                                                                                     |
| `AcpRuntimeError: Permission prompt unavailable in non-interactive mode`    | `permissionMode` が非対話ACPセッションで書き込み/execをブロックしている。       | `plugins.entries.acpx.config.permissionMode` を `approve-all` に設定してGatewayを再起動してください。参照: [権限設定](#permission-configuration)。                |
| ACP session fails early with little output                                  | 権限プロンプトが `permissionMode`/`nonInteractivePermissions` によってブロックされている。 | `AcpRuntimeError` がないかGatewayログを確認してください。完全権限なら `permissionMode=approve-all`、穏やかな段階的劣化なら `nonInteractivePermissions=deny` を設定してください。 |
| ACP session stalls indefinitely after completing work                       | ハーネスプロセスは終了したが、ACPセッションが完了を報告しなかった。             | `ps aux \| grep acpx` で監視し、古いプロセスを手動でkillしてください。                                                                                             |
