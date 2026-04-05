---
read_when:
    - ACP経由でコーディングハーネスを実行するとき
    - メッセージチャネルで会話に紐づくACPセッションを設定するとき
    - メッセージチャネルの会話を永続的なACPセッションにバインドするとき
    - ACPバックエンドとplugin配線のトラブルシューティングを行うとき
    - チャットから `/acp` コマンドを操作するとき
summary: Codex、Claude Code、Cursor、Gemini CLI、OpenClaw ACP、その他のハーネスエージェントでACPランタイムセッションを使用する
title: ACPエージェント
x-i18n:
    generated_at: "2026-04-05T12:59:32Z"
    model: gpt-5.4
    provider: openai
    source_hash: 47063abc8170129cd22808d9a4b23160d0f340f6dc789907589d349f68c12e3e
    source_path: tools/acp-agents.md
    workflow: 15
---

# ACPエージェント

[Agent Client Protocol (ACP)](https://agentclientprotocol.com/) セッションにより、OpenClawはACPバックエンドpluginを通じて外部のコーディングハーネス（たとえば Pi、Claude Code、Codex、Cursor、Copilot、OpenClaw ACP、OpenCode、Gemini CLI、およびその他の対応ACPXハーネス）を実行できます。

平文で「これをCodexで実行して」や「このスレッドでClaude Codeを起動して」とOpenClawに頼んだ場合、OpenClawはそのリクエストをACPランタイム（ネイティブのsub-agentランタイムではなく）へルーティングするべきです。各ACPセッション起動は [background task](/ja-JP/automation/tasks) として追跡されます。

CodexやClaude Codeを、既存のOpenClawチャネル会話に直接接続する外部MCPクライアントとして使いたい場合は、
ACPではなく [`openclaw mcp serve`](/cli/mcp) を使用してください。

## どのページを見ればよいですか？

近くにある次の3つの機能は混同しやすいです。

| したいこと | 使用するもの | 補足 |
| ---------- | ------------ | ---- |
| Codex、Claude Code、Gemini CLI、または別の外部ハーネスをOpenClaw _経由で_ 実行する | このページ: ACPエージェント | チャットに紐づくセッション、`/acp spawn`、`sessions_spawn({ runtime: "acp" })`、background task、ランタイム制御 |
| OpenClaw Gatewayセッションを、エディターやクライアント向けのACPサーバー _として_ 公開する | [`openclaw acp`](/cli/acp) | ブリッジモード。IDE/クライアントがstdio/WebSocket経由でOpenClawとACPで通信します |
| ローカルAI CLIをテキスト専用のフォールバックモデルとして再利用する | [CLI Backends](/ja-JP/gateway/cli-backends) | ACPではありません。OpenClawツールなし、ACP制御なし、ハーネスランタイムなし |

## これはそのまま使えますか？

通常は使えます。

- 新規インストールでは、同梱の `acpx` ランタイムpluginがデフォルトで有効になっています。
- 同梱の `acpx` pluginは、pluginローカルに固定された `acpx` バイナリを優先します。
- 起動時に、OpenClawはそのバイナリをprobeし、必要に応じて自己修復します。
- 準備状況をすばやく確認したいなら、まず `/acp doctor` から始めてください。

初回利用時にまだ起こりうること:

- 対象ハーネス用アダプターが、そのハーネスの初回利用時に `npx` でオンデマンド取得されることがあります。
- ベンダー認証は、そのハーネスのためにホスト上に存在している必要があります。
- ホストにnpm/ネットワークアクセスがない場合、初回のアダプター取得は、キャッシュを事前に温めるか別の方法でアダプターをインストールするまで失敗することがあります。

例:

- `/acp spawn codex`: OpenClawは `acpx` をブートストラップできる状態のはずですが、Codex ACPアダプターは初回取得が必要な場合があります。
- `/acp spawn claude`: Claude ACPアダプターについても同様で、さらにそのホスト上でClaude側認証も必要です。

## 実運用向けの簡易フロー

実用的な `/acp` の運用手順が欲しい場合はこれを使ってください。

1. セッションを起動します:
   - `/acp spawn codex --bind here`
   - `/acp spawn codex --mode persistent --thread auto`
2. バインドされた会話またはスレッドで作業します（またはそのセッションキーを明示的に指定します）。
3. ランタイム状態を確認します:
   - `/acp status`
4. 必要に応じてランタイムオプションを調整します:
   - `/acp model <provider/model>`
   - `/acp permissions <profile>`
   - `/acp timeout <seconds>`
5. コンテキストを置き換えずに、アクティブなセッションに指示を追加します:
   - `/acp steer logging をもっと絞って続けて`
6. 作業を停止します:
   - `/acp cancel`（現在のターンを停止）、または
   - `/acp close`（セッションを閉じてバインドを削除）

## 人向けクイックスタート

自然言語での依頼例:

- 「このDiscordチャネルをCodexにバインドして。」
- 「ここでスレッド内に永続的なCodexセッションを開始して、集中させて。」
- 「これを単発のClaude Code ACPセッションとして実行して、結果を要約して。」
- 「このiMessageチャットをCodexにバインドして、以後のやり取りも同じworkspaceで続けて。」
- 「このタスクにはGemini CLIをスレッドで使って、その後のやり取りも同じスレッドで続けて。」

OpenClawが行うべきこと:

1. `runtime: "acp"` を選択する。
2. 要求されたハーネスターゲット（`agentId`、たとえば `codex`）を解決する。
3. 現在の会話へのバインドが要求され、かつアクティブチャネルがそれをサポートしているなら、ACPセッションをその会話にバインドする。
4. そうでなければ、スレッドバインドが要求され、かつ現在のチャネルがそれをサポートしているなら、ACPセッションをそのスレッドにバインドする。
5. その後のバインド済みメッセージを、フォーカス解除・クローズ・期限切れになるまで同じACPセッションへルーティングする。

## ACPとsub-agentの違い

外部ハーネスランタイムが必要ならACPを使います。OpenClawネイティブの委譲実行が必要ならsub-agentを使います。

| 領域 | ACPセッション | sub-agent実行 |
| ---- | ------------- | ------------- |
| ランタイム | ACPバックエンドplugin（たとえば acpx） | OpenClawネイティブのsub-agentランタイム |
| セッションキー | `agent:<agentId>:acp:<uuid>` | `agent:<agentId>:subagent:<uuid>` |
| 主なコマンド | `/acp ...` | `/subagents ...` |
| 起動ツール | `sessions_spawn` with `runtime:"acp"` | `sessions_spawn`（デフォルトランタイム） |

関連項目: [Sub-agents](/tools/subagents)

## ACPがClaude Codeを実行する仕組み

ACP経由のClaude Codeでは、スタックは次のとおりです。

1. OpenClaw ACPセッション制御プレーン
2. 同梱の `acpx` ランタイムplugin
3. Claude ACPアダプター
4. Claude側のランタイム/セッション機構

重要な違い:

- ACP Claudeは、直接の `claude-cli/...` フォールバックランタイムとは別物です。
- ACP Claudeは、ACP制御、セッション再開、background task追跡、および任意の会話/スレッドバインドを備えたハーネスセッションです。
- `claude-cli/...` はテキスト専用のローカルCLIバックエンドです。[CLI Backends](/ja-JP/gateway/cli-backends) を参照してください。

運用者向けの実用ルールは次のとおりです。

- `/acp spawn`、バインド可能なセッション、ランタイム制御、または永続的なハーネス作業が欲しい: ACPを使う
- 生のCLI経由で単純なローカルテキストフォールバックが欲しい: CLIバックエンドを使う

## バインド済みセッション

### 現在の会話へのバインド

現在の会話を子スレッドを作らずに永続的なACP workspaceにしたい場合は、`/acp spawn <harness> --bind here` を使います。

挙動:

- OpenClawはチャネルトランスポート、認証、安全性、配信を引き続き管理します。
- 現在の会話は、起動されたACPセッションキーに固定されます。
- その会話での以後のメッセージは、同じACPセッションへルーティングされます。
- `/new` と `/reset` は、同じバインド済みACPセッションをその場でリセットします。
- `/acp close` はセッションを閉じ、現在の会話バインドを削除します。

実際に意味すること:

- `--bind here` は同じチャット画面を維持します。Discordでは、現在のチャネルはそのまま現在のチャネルです。
- `--bind here` は、新しい作業を起動する場合には新しいACPセッションを作成することがあります。バインドはそのセッションを現在の会話に接続します。
- `--bind here` 自体はDiscordの子スレッドやTelegramトピックを作成しません。
- ACPランタイムは、独自の作業ディレクトリ（`cwd`）やバックエンド管理workspaceをディスク上に持つことができます。そのランタイムworkspaceはチャット画面とは別であり、新しいメッセージスレッドを意味するものではありません。
- 別のACPエージェントに起動し、`--cwd` を渡さない場合、OpenClawはデフォルトで要求元ではなく **対象エージェントの** workspaceを継承します。
- 継承されたworkspaceパスが存在しない場合（`ENOENT`/`ENOTDIR`）、OpenClawは誤ったツリーを黙って再利用するのではなく、バックエンドのデフォルトcwdにフォールバックします。
- 継承されたworkspaceが存在していてもアクセスできない場合（たとえば `EACCES`）、起動は `cwd` を捨てずに実際のアクセスエラーを返します。

考え方:

- チャット画面: 人が会話を続ける場所（`Discord channel`、`Telegram topic`、`iMessage chat`）
- ACPセッション: OpenClawがルーティング先とする、永続的なCodex/Claude/Geminiランタイム状態
- 子スレッド/トピック: `--thread ...` によってのみ作成される任意の追加メッセージ画面
- ランタイムworkspace: ハーネスが実行されるファイルシステム上の場所（`cwd`、リポジトリcheckout、バックエンドworkspace）

例:

- `/acp spawn codex --bind here`: このチャットを維持し、Codex ACPセッションを起動または接続し、以後のメッセージをここからそこへルーティングする
- `/acp spawn codex --thread auto`: OpenClawが子スレッド/トピックを作成し、そこにACPセッションをバインドすることがあります
- `/acp spawn codex --bind here --cwd /workspace/repo`: 上と同じチャットバインドですが、Codexは `/workspace/repo` で実行されます

現在の会話バインドのサポート:

- 現在の会話バインド対応を公開しているチャット/メッセージチャネルでは、共有の会話バインド経路を通じて `--bind here` を使用できます。
- 独自のスレッド/トピック意味論を持つチャネルでも、同じ共有インターフェースの背後でチャネル固有の正規化を提供できます。
- `--bind here` は常に「現在の会話をその場でバインドする」を意味します。
- 汎用の現在会話バインドは、共有のOpenClawバインドストアを使用し、通常のGateway再起動でも維持されます。

注意:

- `/acp spawn` では `--bind here` と `--thread ...` は相互排他的です。
- Discordでは、`--bind here` は現在のチャネルまたはスレッドをその場でバインドします。`spawnAcpSessions` が必要なのは、`--thread auto|here` 用にOpenClawが子スレッドを作成する必要がある場合だけです。
- アクティブチャネルが現在会話のACPバインドを公開していない場合、OpenClawは明確な未対応メッセージを返します。
- `resume` と「新しいセッション」についての問いはACPセッションの問いであり、チャネルの問いではありません。現在のチャット画面を変えずにランタイム状態を再利用または置き換えることができます。

### スレッドにバインドされたセッション

チャネルアダプターでスレッドバインドが有効になっている場合、ACPセッションはスレッドにバインドできます。

- OpenClawはスレッドを対象ACPセッションにバインドします。
- そのスレッドでの以後のメッセージは、バインド済みACPセッションへルーティングされます。
- ACPの出力は同じスレッドに返されます。
- フォーカス解除/クローズ/アーカイブ/アイドルタイムアウトまたは最大有効期間の期限切れでバインドは削除されます。

スレッドバインド対応はアダプター依存です。アクティブなチャネルアダプターがスレッドバインドをサポートしていない場合、OpenClawは明確な未対応/利用不可メッセージを返します。

スレッドバインドACPに必要なfeature flag:

- `acp.enabled=true`
- `acp.dispatch.enabled` はデフォルトでオンです（ACP dispatchを一時停止するには `false` に設定）
- チャネルアダプターのACPスレッド起動フラグが有効（アダプター固有）
  - Discord: `channels.discord.threadBindings.spawnAcpSessions=true`
  - Telegram: `channels.telegram.threadBindings.spawnAcpSessions=true`

### スレッド対応チャネル

- セッション/スレッドバインド機能を公開する任意のチャネルアダプター。
- 現在の組み込みサポート:
  - Discordスレッド/チャネル
  - Telegramトピック（group/supergroupのforum topicとDM topic）
- pluginチャネルも同じバインドインターフェースを通じてサポートを追加できます。

## チャネル固有設定

非エフェメラルなワークフローでは、トップレベルの `bindings[]` エントリで永続的なACPバインドを設定します。

### バインディングモデル

- `bindings[].type="acp"` は永続的なACP会話バインドを示します。
- `bindings[].match` は対象会話を識別します:
  - Discordチャネルまたはスレッド: `match.channel="discord"` + `match.peer.id="<channelOrThreadId>"`
  - Telegram forum topic: `match.channel="telegram"` + `match.peer.id="<chatId>:topic:<topicId>"`
  - BlueBubbles DM/group chat: `match.channel="bluebubbles"` + `match.peer.id="<handle|chat_id:*|chat_guid:*|chat_identifier:*>"`
    安定したgroupバインドには `chat_id:*` または `chat_identifier:*` を優先してください。
  - iMessage DM/group chat: `match.channel="imessage"` + `match.peer.id="<handle|chat_id:*|chat_guid:*|chat_identifier:*>"`
    安定したgroupバインドには `chat_id:*` を優先してください。
- `bindings[].agentId` は所有するOpenClawエージェントIDです。
- 任意のACP上書きは `bindings[].acp` の下に置きます:
  - `mode`（`persistent` または `oneshot`）
  - `label`
  - `cwd`
  - `backend`

### エージェントごとのランタイムデフォルト

エージェントごとに一度だけACPデフォルトを定義するには `agents.list[].runtime` を使います。

- `agents.list[].runtime.type="acp"`
- `agents.list[].runtime.acp.agent`（ハーネスID、たとえば `codex` または `claude`）
- `agents.list[].runtime.acp.backend`
- `agents.list[].runtime.acp.mode`
- `agents.list[].runtime.acp.cwd`

ACPバインド済みセッションの上書き優先順位:

1. `bindings[].acp.*`
2. `agents.list[].runtime.acp.*`
3. グローバルACPデフォルト（たとえば `acp.backend`）

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

- OpenClawは、設定されたACPセッションが使用前に存在することを保証します。
- そのチャネルまたはトピック内のメッセージは、設定されたACPセッションへルーティングされます。
- バインド済み会話では、`/new` と `/reset` は同じACPセッションキーをその場でリセットします。
- 一時的なランタイムバインド（たとえばスレッドfocusフローで作成されたもの）も、存在する場合は引き続き適用されます。
- 明示的な `cwd` なしでエージェント間ACP起動を行うと、OpenClawはエージェント設定から対象エージェントworkspaceを継承します。
- 継承workspaceパスが存在しない場合はバックエンドデフォルトcwdにフォールバックし、実際のアクセス失敗は起動エラーとして表面化します。

## ACPセッションを開始する（インターフェース）

### `sessions_spawn` から

エージェントターンまたはツール呼び出しからACPセッションを開始するには `runtime: "acp"` を使います。

```json
{
  "task": "リポジトリを開いて失敗しているテストを要約して",
  "runtime": "acp",
  "agentId": "codex",
  "thread": true,
  "mode": "session"
}
```

注意:

- `runtime` のデフォルトは `subagent` なので、ACPセッションでは明示的に `runtime: "acp"` を設定してください。
- `agentId` が省略された場合、設定されていればOpenClawは `acp.defaultAgent` を使います。
- `mode: "session"` は、永続的なバインド会話を維持するために `thread: true` を必要とします。

インターフェース詳細:

- `task`（必須）: ACPセッションへ送信される初期プロンプト。
- `runtime`（ACPでは必須）: `"acp"` でなければなりません。
- `agentId`（任意）: ACP対象ハーネスID。設定されていれば `acp.defaultAgent` にフォールバックします。
- `thread`（任意、デフォルト `false`）: サポートされる場合にスレッドバインドフローを要求します。
- `mode`（任意）: `run`（単発）または `session`（永続）。
  - デフォルトは `run`
  - `thread: true` でmode省略時は、ランタイム経路ごとにOpenClawが永続挙動をデフォルトにすることがあります
  - `mode: "session"` は `thread: true` を必要とします
- `cwd`（任意）: 要求するランタイム作業ディレクトリ（バックエンド/ランタイムポリシーで検証されます）。省略時、設定されていればACP起動は対象エージェントworkspaceを継承します。継承パスが存在しない場合はバックエンドデフォルトにフォールバックし、実際のアクセスエラーは返されます。
- `label`（任意）: セッション/バナー文言で使われる運用者向けラベル。
- `resumeSessionId`（任意）: 新規作成ではなく既存のACPセッションを再開します。エージェントは `session/load` 経由で会話履歴を再生します。`runtime: "acp"` が必要です。
- `streamTo`（任意）: `"parent"` は、初期ACP実行の進捗サマリーをシステムイベントとして要求元セッションへストリームします。
  - 利用可能な場合、受理されたレスポンスには `streamLogPath` が含まれ、セッション単位JSONLログ（`<sessionId>.acp-stream.jsonl`）を指します。完全な中継履歴を追跡できます。

### 既存セッションを再開する

新しく開始する代わりに以前のACPセッションを続けるには `resumeSessionId` を使います。エージェントは `session/load` 経由で会話履歴を再生するため、それまでの完全な文脈を持って再開できます。

```json
{
  "task": "前回の続きから始めて — 残っているテスト失敗を修正して",
  "runtime": "acp",
  "agentId": "codex",
  "resumeSessionId": "<previous-session-id>"
}
```

一般的なユースケース:

- Codexセッションをラップトップからスマートフォンへ引き継ぐ — エージェントに中断地点から再開するよう伝える
- CLIで対話的に始めたコーディングセッションを、今度はエージェント経由でヘッドレスに継続する
- Gateway再起動やアイドルタイムアウトで中断した作業を再開する

注意:

- `resumeSessionId` には `runtime: "acp"` が必要です。sub-agentランタイムで使うとエラーを返します。
- `resumeSessionId` は上流ACP会話履歴を復元します。`thread` と `mode` は新しく作成するOpenClawセッションに通常どおり適用されるため、`mode: "session"` には引き続き `thread: true` が必要です。
- 対象エージェントは `session/load` をサポートしている必要があります（CodexとClaude Codeはサポートします）。
- セッションIDが見つからない場合、起動は明確なエラーで失敗します。新規セッションへの黙示的フォールバックは行われません。

### 運用者向けスモークテスト

Gatewayデプロイ後、単にunit testが通るだけでなく、ACP起動が本当にエンドツーエンドで動作していることをすばやく確認したいときに使います。

推奨ゲート:

1. 対象ホスト上でデプロイ済みGatewayのバージョン/コミットを確認する。
2. デプロイ済みソースに
   `src/gateway/sessions-patch.ts` のACP系統受け入れ
   （`subagent:* or acp:* sessions`）が含まれていることを確認する。
3. 実際のエージェント（たとえば
   `jpclawhq` 上の `razor(main)`）へ一時的なACPXブリッジセッションを開く。
4. そのエージェントに、次の内容で `sessions_spawn` を呼ぶよう依頼する:
   - `runtime: "acp"`
   - `agentId: "codex"`
   - `mode: "run"`
   - task: `Reply with exactly LIVE-ACP-SPAWN-OK`
5. エージェントが次を報告することを確認する:
   - `accepted=yes`
   - 実在する `childSessionKey`
   - バリデーターエラーなし
6. 一時的なACPXブリッジセッションをクリーンアップする。

実エージェントへのプロンプト例:

```text
Use the sessions_spawn tool now with runtime: "acp", agentId: "codex", and mode: "run".
Set the task to: "Reply with exactly LIVE-ACP-SPAWN-OK".
Then report only: accepted=<yes/no>; childSessionKey=<value or none>; error=<exact text or none>.
```

注意:

- このスモークテストは、意図的にスレッドにバインドされた永続ACPセッションを試しているのでない限り、`mode: "run"` のままにしてください。
- 基本ゲートでは `streamTo: "parent"` を必須にしないでください。その経路は要求元/セッション機能に依存するため、別の統合チェックです。
- スレッドにバインドされた `mode: "session"` テストは、実際のDiscordスレッドやTelegramトピックからの第2段階の、より充実した統合パスとして扱ってください。

## サンドボックス互換性

ACPセッションは現在、OpenClawサンドボックス内ではなくホストランタイム上で実行されます。

現在の制限:

- 要求元セッションがサンドボックス化されている場合、`sessions_spawn({ runtime: "acp" })` と `/acp spawn` の両方でACP起動はブロックされます。
  - エラー: `Sandboxed sessions cannot spawn ACP sessions because runtime="acp" runs on the host. Use runtime="subagent" from sandboxed sessions.`
- `runtime: "acp"` を使う `sessions_spawn` は `sandbox: "require"` をサポートしません。
  - エラー: `sessions_spawn sandbox="require" is unsupported for runtime="acp" because ACP sessions run outside the sandbox. Use runtime="subagent" or sandbox="inherit".`

サンドボックス強制実行が必要な場合は `runtime: "subagent"` を使用してください。

### `/acp` コマンドから

必要に応じてチャットから明示的に運用制御するには `/acp spawn` を使います。

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

[Slash Commands](/tools/slash-commands) を参照してください。

## セッション対象の解決

ほとんどの `/acp` アクションは、任意のセッション対象（`session-key`、`session-id`、または `session-label`）を受け付けます。

解決順序:

1. 明示的な対象引数（または `/acp steer` 用の `--session`）
   - まずkeyを試す
   - 次にUUID形のsession idを試す
   - 次にlabelを試す
2. 現在のスレッドバインド（この会話/スレッドがACPセッションにバインドされている場合）
3. 現在の要求元セッションへのフォールバック

現在の会話バインドとスレッドバインドの両方が、手順2に参加します。

対象が解決できない場合、OpenClawは明確なエラーを返します（`Unable to resolve session target: ...`）。

## 起動バインドモード

`/acp spawn` は `--bind here|off` をサポートします。

| モード | 挙動 |
| ------ | ---- |
| `here` | 現在アクティブな会話をその場でバインドします。アクティブな会話がない場合は失敗します。 |
| `off`  | 現在の会話バインドを作成しません。 |

注意:

- `--bind here` は「このチャネルまたはチャットをCodex対応にする」ための最も簡単な運用経路です。
- `--bind here` は子スレッドを作成しません。
- `--bind here` は、現在の会話バインド対応を公開しているチャネルでのみ利用可能です。
- `--bind` と `--thread` は同じ `/acp spawn` 呼び出しでは併用できません。

## 起動スレッドモード

`/acp spawn` は `--thread auto|here|off` をサポートします。

| モード | 挙動 |
| ------ | ---- |
| `auto` | アクティブなスレッド内ではそのスレッドをバインドします。スレッド外では、サポートされている場合に子スレッドを作成/バインドします。 |
| `here` | 現在アクティブなスレッドを必須とします。スレッド内でない場合は失敗します。 |
| `off`  | バインドしません。セッションは未バインドで開始されます。 |

注意:

- スレッドバインドのない画面では、デフォルト挙動は実質的に `off` です。
- スレッドにバインドされた起動にはチャネルポリシーサポートが必要です:
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

`/acp status` は有効なランタイムオプションを表示し、利用可能な場合はランタイムレベルとバックエンドレベルの両方のセッション識別子を表示します。

一部の制御はバックエンド機能に依存します。バックエンドがその制御をサポートしない場合、OpenClawは明確な未対応制御エラーを返します。

## ACPコマンド早見表

| コマンド | 役割 | 例 |
| -------- | ---- | -- |
| `/acp spawn` | ACPセッションを作成します。任意で現在バインドまたはスレッドバインド。 | `/acp spawn codex --bind here --cwd /repo` |
| `/acp cancel` | 対象セッションの進行中ターンをキャンセルします。 | `/acp cancel agent:codex:acp:<uuid>` |
| `/acp steer` | 実行中セッションに指示を送ります。 | `/acp steer --session support inbox failing tests を優先` |
| `/acp close` | セッションを閉じ、スレッド対象とのバインドを解除します。 | `/acp close` |
| `/acp status` | バックエンド、モード、状態、ランタイムオプション、機能を表示します。 | `/acp status` |
| `/acp set-mode` | 対象セッションのランタイムモードを設定します。 | `/acp set-mode plan` |
| `/acp set` | 汎用ランタイム設定オプションを書き込みます。 | `/acp set model openai/gpt-5.4` |
| `/acp cwd` | ランタイム作業ディレクトリ上書きを設定します。 | `/acp cwd /Users/user/Projects/repo` |
| `/acp permissions` | 承認ポリシープロファイルを設定します。 | `/acp permissions strict` |
| `/acp timeout` | ランタイムタイムアウト（秒）を設定します。 | `/acp timeout 120` |
| `/acp model` | ランタイムモデル上書きを設定します。 | `/acp model anthropic/claude-opus-4-6` |
| `/acp reset-options` | セッションのランタイムオプション上書きを削除します。 | `/acp reset-options` |
| `/acp sessions` | ストアから最近のACPセッションを一覧表示します。 | `/acp sessions` |
| `/acp doctor` | バックエンドの健全性、機能、実行可能な修正を表示します。 | `/acp doctor` |
| `/acp install` | 決定的なインストール手順と有効化手順を表示します。 | `/acp install` |

`/acp sessions` は、現在バインドされたセッションまたは要求元セッションのストアを読み取ります。`session-key`、`session-id`、または `session-label` トークンを受け付けるコマンドは、エージェントごとのカスタム `session.store` ルートを含め、Gatewayセッション検出を通じて対象を解決します。

## ランタイムオプション対応

`/acp` には便利コマンドと汎用setterがあります。

等価な操作:

- `/acp model <id>` はランタイム設定キー `model` に対応します。
- `/acp permissions <profile>` はランタイム設定キー `approval_policy` に対応します。
- `/acp timeout <seconds>` はランタイム設定キー `timeout` に対応します。
- `/acp cwd <path>` はランタイムcwd上書きを直接更新します。
- `/acp set <key> <value>` は汎用経路です。
  - 特別扱い: `key=cwd` はcwd上書き経路を使います。
- `/acp reset-options` は対象セッションのすべてのランタイム上書きを消去します。

## acpxハーネスサポート（現在）

現在のacpx組み込みハーネス別名:

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

OpenClawがacpxバックエンドを使用する場合、acpx設定でカスタムエージェント別名を定義していない限り、`agentId` にはこれらの値を優先してください。
ローカルのCursorインストールでACPがまだ `agent acp` として公開されている場合は、組み込みデフォルトを変更するのではなく、acpx設定で `cursor` エージェントコマンドを上書きしてください。

直接のacpx CLI利用では `--agent <command>` を介して任意のアダプターを対象にすることもできますが、その生のescape hatchはacpx CLI機能であり、通常のOpenClaw `agentId` 経路ではありません。

## 必須設定

コアACPベースライン:

```json5
{
  acp: {
    enabled: true,
    // 任意。デフォルトはtrueです。/acp制御を維持したままACP dispatchを一時停止するにはfalseに設定します。
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

スレッドバインド設定はチャネルアダプターごとに異なります。Discordの例:

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

スレッドにバインドされたACP起動が機能しない場合は、まずアダプターのfeature flagを確認してください。

- Discord: `channels.discord.threadBindings.spawnAcpSessions=true`

現在の会話バインドは子スレッド作成を必要としません。必要なのはアクティブな会話コンテキストと、ACP会話バインドを公開するチャネルアダプターです。

[Configuration Reference](/ja-JP/gateway/configuration-reference) を参照してください。

## acpxバックエンドのplugin設定

新規インストールでは同梱の `acpx` ランタイムpluginがデフォルトで有効なため、ACPは通常、手動pluginインストールなしで動作します。

まず次を実行してください:

```text
/acp doctor
```

`acpx` を無効化した、`plugins.allow` / `plugins.deny` で拒否した、またはローカル開発checkoutへ切り替えたい場合は、明示的なplugin経路を使用します。

```bash
openclaw plugins install acpx
openclaw config set plugins.entries.acpx.enabled true
```

開発中のローカルworkspaceインストール:

```bash
openclaw plugins install ./path/to/local/acpx-plugin
```

その後、バックエンドの健全性を確認します:

```text
/acp doctor
```

### acpxコマンドとバージョン設定

デフォルトでは、同梱のacpxバックエンドplugin（`acpx`）はpluginローカルに固定されたバイナリを使用します。

1. コマンドは、ACPX pluginパッケージ内のpluginローカル `node_modules/.bin/acpx` をデフォルトにします。
2. 期待バージョンはextensionの固定値をデフォルトにします。
3. 起動時にACPバックエンドを即座に準備未完了として登録します。
4. バックグラウンドensureジョブが `acpx --version` を検証します。
5. pluginローカルバイナリが存在しないか不一致の場合、次を実行します:
   `npm install --omit=dev --no-save acpx@<pinned>` を実行して再検証します。

plugin設定でコマンド/バージョンを上書きできます。

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
- 相対パスはOpenClaw workspaceディレクトリから解決されます。
- `expectedVersion: "any"` は厳密なバージョン一致を無効化します。
- `command` がカスタムバイナリ/パスを指す場合、pluginローカル自動インストールは無効になります。
- バックエンド健全性チェックの実行中も、OpenClaw起動は非ブロッキングのままです。

[Plugins](/tools/plugin) を参照してください。

### 依存関係の自動インストール

`npm install -g openclaw` でOpenClawをグローバルインストールすると、acpx
ランタイム依存関係（プラットフォーム固有バイナリ）はpostinstallフック経由で自動的にインストールされます。自動インストールに失敗しても、gatewayは通常どおり起動し、不足依存関係は `openclaw acp doctor` を通じて報告されます。

### pluginツールMCPブリッジ

デフォルトでは、ACPXセッションはOpenClawのplugin登録ツールをACPハーネスへ公開しません。

CodexやClaude CodeなどのACPエージェントから、memory recall/storeのようなインストール済み
OpenClaw pluginツールを呼び出せるようにしたい場合は、専用ブリッジを有効にしてください。

```bash
openclaw config set plugins.entries.acpx.config.pluginToolsMcpBridge true
```

これにより行われること:

- `openclaw-plugin-tools` という名前の組み込みMCPサーバーをACPXセッション
  ブートストラップに注入します。
- インストール済みかつ有効なOpenClaw
  pluginsによってすでに登録されているpluginツールを公開します。
- この機能を明示的なデフォルトオフのままに保ちます。

セキュリティと信頼に関する注意:

- これによりACPハーネスのツール対象範囲が広がります。
- ACPエージェントがアクセスできるのは、gateway内ですでに有効なpluginツールだけです。
- これは、それらのpluginsをOpenClaw自身で実行させるのと同じ信頼境界として扱ってください。
- 有効化前にインストール済みpluginsを確認してください。

カスタム `mcpServers` は従来どおり動作します。組み込みplugin-toolsブリッジは
追加のオプトイン利便機能であり、汎用MCPサーバー設定の置き換えではありません。

## 権限設定

ACPセッションは非対話型で実行されます。ファイル書き込みやshell実行の権限プロンプトを承認または拒否するためのTTYはありません。acpx pluginは、権限処理を制御する2つの設定キーを提供します。

これらのACPXハーネス権限は、OpenClawのexec承認や、Claude CLI `--permission-mode bypassPermissions` のようなCLIバックエンドのベンダー回避フラグとは別物です。ACPXの `approve-all` はACPセッション用のハーネスレベル緊急解除スイッチです。

### `permissionMode`

ハーネスエージェントがプロンプトなしで実行できる操作を制御します。

| 値 | 挙動 |
| --- | ---- |
| `approve-all` | すべてのファイル書き込みとshellコマンドを自動承認します。 |
| `approve-reads` | 読み取りのみ自動承認します。書き込みとexecはプロンプトが必要です。 |
| `deny-all` | すべての権限プロンプトを拒否します。 |

### `nonInteractivePermissions`

権限プロンプトが表示されるはずだが、対話型TTYが利用できない場合（ACPセッションでは常にこれに該当）に何が起こるかを制御します。

| 値 | 挙動 |
| --- | ---- |
| `fail` | `AcpRuntimeError` でセッションを中止します。**（デフォルト）** |
| `deny` | 権限を黙って拒否して継続します（穏当な劣化）。 |

### 設定

plugin設定経由で設定します。

```bash
openclaw config set plugins.entries.acpx.config.permissionMode approve-all
openclaw config set plugins.entries.acpx.config.nonInteractivePermissions fail
```

これらの値を変更した後はgatewayを再起動してください。

> **重要:** OpenClawの現在のデフォルトは `permissionMode=approve-reads` と `nonInteractivePermissions=fail` です。非対話型ACPセッションでは、権限プロンプトを発生させる書き込みやexecは `AcpRuntimeError: Permission prompt unavailable in non-interactive mode` で失敗する可能性があります。
>
> 権限を制限したい場合は、セッションがクラッシュする代わりに穏当に劣化するよう `nonInteractivePermissions` を `deny` に設定してください。

## トラブルシューティング

| 症状 | 考えられる原因 | 修正 |
| ---- | -------------- | ---- |
| `ACP runtime backend is not configured` | バックエンドpluginが不足しているか無効です。 | バックエンドpluginをインストールして有効化し、その後 `/acp doctor` を実行してください。 |
| `ACP is disabled by policy (acp.enabled=false)` | ACPがグローバルに無効です。 | `acp.enabled=true` を設定してください。 |
| `ACP dispatch is disabled by policy (acp.dispatch.enabled=false)` | 通常スレッドメッセージからのdispatchが無効です。 | `acp.dispatch.enabled=true` を設定してください。 |
| `ACP agent "<id>" is not allowed by policy` | エージェントがallowlistにありません。 | 許可済み `agentId` を使うか、`acp.allowedAgents` を更新してください。 |
| `Unable to resolve session target: ...` | key/id/labelトークンが不正です。 | `/acp sessions` を実行して正確なkey/labelをコピーし、再試行してください。 |
| `--bind here requires running /acp spawn inside an active ... conversation` | `--bind here` がアクティブなバインド可能会話なしで使われました。 | 対象チャット/チャネルへ移動して再試行するか、未バインド起動を使ってください。 |
| `Conversation bindings are unavailable for <channel>.` | アダプターに現在会話のACPバインド機能がありません。 | サポートされている場合は `/acp spawn ... --thread ...` を使うか、トップレベル `bindings[]` を設定するか、対応チャネルへ移動してください。 |
| `--thread here requires running /acp spawn inside an active ... thread` | `--thread here` がスレッドコンテキスト外で使われました。 | 対象スレッドへ移動するか、`--thread auto`/`off` を使ってください。 |
| `Only <user-id> can rebind this channel/conversation/thread.` | 別ユーザーがアクティブなバインド対象を所有しています。 | 所有者として再バインドするか、別の会話またはスレッドを使ってください。 |
| `Thread bindings are unavailable for <channel>.` | アダプターにスレッドバインド機能がありません。 | `--thread off` を使うか、対応アダプター/チャネルへ移動してください。 |
| `Sandboxed sessions cannot spawn ACP sessions ...` | ACPランタイムはホスト側であり、要求元セッションがサンドボックス化されています。 | サンドボックス化セッションからは `runtime="subagent"` を使うか、非サンドボックス化セッションからACP起動を実行してください。 |
| `sessions_spawn sandbox="require" is unsupported for runtime="acp" ...` | ACPランタイムに対して `sandbox="require"` が要求されました。 | 必須サンドボックスには `runtime="subagent"` を使うか、非サンドボックス化セッションから `sandbox="inherit"` でACPを使ってください。 |
| バインド済みセッションのACPメタデータが見つからない | ACPセッションメタデータが古いか削除されています。 | `/acp spawn` で再作成し、その後スレッドを再バインド/再focusしてください。 |
| `AcpRuntimeError: Permission prompt unavailable in non-interactive mode` | `permissionMode` が非対話型ACPセッションで書き込み/execをブロックしています。 | `plugins.entries.acpx.config.permissionMode` を `approve-all` に設定し、gatewayを再起動してください。[権限設定](#permission-configuration) を参照してください。 |
| ACPセッションが初期段階でほとんど出力なく失敗する | 権限プロンプトが `permissionMode`/`nonInteractivePermissions` によってブロックされています。 | `AcpRuntimeError` がないかgatewayログを確認してください。完全権限には `permissionMode=approve-all`、穏当な劣化には `nonInteractivePermissions=deny` を設定してください。 |
| 作業完了後もACPセッションが無期限に停止したままになる | ハーネスプロセスは終了したが、ACPセッションが完了を報告しませんでした。 | `ps aux \| grep acpx` で監視し、古いプロセスを手動でkillしてください。 |
