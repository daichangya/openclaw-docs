---
read_when:
    - ACP 経由で coding harness を実行する
    - メッセージングチャンネルで会話にバインドされた ACP session をセットアップする
    - メッセージチャンネルの会話を永続的な ACP session にバインドする
    - ACP バックエンドと plugin 配線のトラブルシューティング
    - ACP の完了配信または agent 間ループのデバッグ
    - チャットから `/acp` コマンドを操作する
summary: Codex、Claude Code、Cursor、Gemini CLI、OpenClaw ACP、およびその他の harness agent で ACP runtime session を使用する
title: ACP Agents
x-i18n:
    generated_at: "2026-04-23T04:51:25Z"
    model: gpt-5.4
    provider: openai
    source_hash: df4c4c38e7a93c240f6bf30a4cc093e8717ef6459425d56a9287245adc625e51
    source_path: tools/acp-agents.md
    workflow: 15
---

# ACP agents

[Agent Client Protocol (ACP)](https://agentclientprotocol.com/) session を使うと、OpenClaw は ACP バックエンド plugin を通して外部 coding harness（たとえば Pi、Claude Code、Codex、Cursor、Copilot、OpenClaw ACP、OpenCode、Gemini CLI、およびその他の対応 ACPX harness）を実行できます。

OpenClaw に平文で「これを Codex で実行して」や「スレッドで Claude Code を開始して」と頼んだ場合、OpenClaw はその要求を ACP runtime にルーティングすべきです（ネイティブ sub-agent runtime ではありません）。各 ACP session の spawn は [background task](/ja-JP/automation/tasks) として追跡されます。

Codex や Claude Code を、既存の OpenClaw channel conversation に対する外部 MCP client として直接接続したい場合は、
ACP の代わりに [`openclaw mcp serve`](/cli/mcp) を使用してください。

## どのページを見ればよいですか？

近くに 3 つの surface があり、混同しやすいです。

| やりたいこと | 使うもの | 注記 |
| ---------------------------------------------------------------------------------- | ------------------------------------- | ----------------------------------------------------------------------------------------------------------- |
| Codex、Claude Code、Gemini CLI、または別の外部 harness を OpenClaw _経由で_ 実行する | このページ: ACP Agents | チャットにバインドされた session、`/acp spawn`、`sessions_spawn({ runtime: "acp" })`、background task、runtime 制御 |
| OpenClaw Gateway session を、エディタや client 向けの ACP server _として_ 公開する | [`openclaw acp`](/cli/acp) | ブリッジモード。IDE/client は stdio/WebSocket 経由で OpenClaw に ACP で接続 |
| ローカル AI CLI をテキスト専用のフォールバックモデルとして再利用する | [CLI Backends](/ja-JP/gateway/cli-backends) | ACP ではありません。OpenClaw tools も ACP 制御も harness runtime もありません |

## そのままで動きますか？

通常は、はい。

- 新規インストールでは、バンドル済みの `acpx` runtime plugin がデフォルトで有効になっています。
- バンドル済みの `acpx` plugin は、plugin ローカルに固定された `acpx` バイナリを優先します。
- 起動時に OpenClaw はそのバイナリを probe し、必要なら自己修復します。
- 準備状態を素早く確認したいなら、まず `/acp doctor` から始めてください。

初回使用時にまだ起こりうること:

- 対象 harness adapter が、その harness を初めて使うときに `npx` でオンデマンド取得されることがあります。
- その harness 用の vendor auth は、引き続きホスト上に存在している必要があります。
- ホストに npm/ネットワークアクセスがない場合、キャッシュが温まるか別の方法で adapter がインストールされるまで、初回の adapter 取得に失敗することがあります。

例:

- `/acp spawn codex`: OpenClaw は `acpx` のブートストラップ準備ができているはずですが、Codex ACP adapter にはまだ初回取得が必要な場合があります。
- `/acp spawn claude`: Claude ACP adapter でも同様で、加えてそのホスト上の Claude 側 auth も必要です。

## オペレーター向け高速フロー

実用的な `/acp` ランブックがほしいときはこれを使ってください。

1. session を spawn する:
   - `/acp spawn codex --bind here`
   - `/acp spawn codex --mode persistent --thread auto`
2. バインドされた conversation または thread で作業する（またはその session key を明示的に対象指定する）。
3. runtime 状態を確認する:
   - `/acp status`
4. 必要に応じて runtime オプションを調整する:
   - `/acp model <provider/model>`
   - `/acp permissions <profile>`
   - `/acp timeout <seconds>`
5. コンテキストを置き換えずにアクティブな session を微調整する:
   - `/acp steer logging を引き締めて続行`
6. 作業を止める:
   - `/acp cancel`（現在の turn を停止）、または
   - `/acp close`（session を閉じて binding を削除）

## 人向けクイックスタート

自然言語リクエストの例:

- 「この Discord チャンネルを Codex にバインドして。」
- 「ここでスレッドに永続的な Codex session を開始して、集中を維持して。」
- 「これを one-shot の Claude Code ACP session として実行して、結果を要約して。」
- 「この iMessage チャットを Codex にバインドして、続きも同じ workspace で維持して。」
- 「このタスクには Gemini CLI をスレッドで使って、その後の follow-up も同じスレッドで維持して。」

OpenClaw が行うべきこと:

1. `runtime: "acp"` を選ぶ。
2. 要求された harness ターゲット（`agentId`、たとえば `codex`）を解決する。
3. 現在の conversation への binding が要求され、かつアクティブ channel がそれをサポートしている場合は、その conversation に ACP session をバインドする。
4. それ以外で thread binding が要求され、かつ現在の channel がそれをサポートしている場合は、その thread に ACP session をバインドする。
5. unfocused/closed/expired になるまで、follow-up のバインド済みメッセージを同じ ACP session にルーティングする。

## ACP と sub-agent の違い

外部 harness runtime がほしい場合は ACP を使います。OpenClaw ネイティブの委譲実行がほしい場合は sub-agent を使います。

| 項目 | ACP session | Sub-agent run |
| ------------- | ------------------------------------- | ---------------------------------- |
| Runtime | ACP バックエンド plugin（例: acpx） | OpenClaw ネイティブ sub-agent runtime |
| Session key | `agent:<agentId>:acp:<uuid>` | `agent:<agentId>:subagent:<uuid>` |
| 主なコマンド | `/acp ...` | `/subagents ...` |
| Spawn tool | `sessions_spawn` with `runtime:"acp"` | `sessions_spawn`（デフォルト runtime） |

あわせて [Sub-agents](/ja-JP/tools/subagents) も参照してください。

## ACP が Claude Code をどのように実行するか

ACP 経由の Claude Code では、スタックは次のようになります。

1. OpenClaw ACP session control plane
2. バンドル済み `acpx` runtime plugin
3. Claude ACP adapter
4. Claude 側の runtime/session machinery

重要な違い:

- ACP Claude は、ACP 制御、session resume、background-task 追跡、およびオプションの conversation/thread binding を備えた harness session です。
- CLI backends は、別のテキスト専用ローカルフォールバック runtime です。[CLI Backends](/ja-JP/gateway/cli-backends) を参照してください。

オペレーターにとっての実用ルールは次のとおりです。

- `/acp spawn`、バインド可能な session、runtime 制御、または永続的な harness 作業がほしい: ACP を使う
- 生の CLI を通した単純なローカルテキストフォールバックがほしい: CLI backends を使う

## バインドされた session

### 現在の conversation への binding

現在の conversation を child thread を作らずに永続的な ACP workspace にしたい場合は、`/acp spawn <harness> --bind here` を使います。

動作:

- OpenClaw は引き続き channel transport、auth、安全性、配信を所有します。
- 現在の conversation は、spawn された ACP session key に固定されます。
- その conversation の follow-up メッセージは、同じ ACP session にルーティングされます。
- `/new` と `/reset` は、同じバインド済み ACP session をその場でリセットします。
- `/acp close` は session を閉じ、現在の conversation binding を削除します。

実際にこれが意味すること:

- `--bind here` は同じチャット surface を維持します。Discord では、現在の channel はそのまま現在の channel です。
- `--bind here` は、新規作業を spawn している場合、なお新しい ACP session を作成することがあります。binding はその session を現在の conversation に接続します。
- `--bind here` 自体は child Discord thread や Telegram topic を作成しません。
- ACP runtime は引き続き独自の working directory（`cwd`）やバックエンド管理のディスク上 workspace を持つことができます。その runtime workspace はチャット surface とは別であり、新しいメッセージングスレッドを意味するものではありません。
- 別の ACP agent に spawn し、`--cwd` を渡さなかった場合、OpenClaw はデフォルトでリクエスターではなく**対象 agent の** workspace を継承します。
- その継承された workspace パスが見つからない場合（`ENOENT`/`ENOTDIR`）、OpenClaw は誤った tree を黙って再利用するのではなく、バックエンドのデフォルト cwd にフォールバックします。
- 継承された workspace が存在してもアクセスできない場合（たとえば `EACCES`）、spawn は `cwd` を捨てずに実際のアクセスエラーを返します。

メンタルモデル:

- chat surface: 人が会話を続ける場所（`Discord channel`、`Telegram topic`、`iMessage chat`）
- ACP session: OpenClaw がルーティングする永続的な Codex/Claude/Gemini runtime 状態
- child thread/topic: `--thread ...` によってのみ作成される任意の追加メッセージング surface
- runtime workspace: harness が動作する filesystem の場所（`cwd`、repo checkout、backend workspace）

例:

- `/acp spawn codex --bind here`: このチャットを維持し、Codex ACP session を spawn または接続し、ここからの今後のメッセージをそれへルーティングする
- `/acp spawn codex --thread auto`: OpenClaw は child thread/topic を作成し、そこに ACP session をバインドする場合があります
- `/acp spawn codex --bind here --cwd /workspace/repo`: 上と同じチャット binding だが、Codex は `/workspace/repo` で動作する

現在の conversation binding のサポート:

- 現在の conversation binding サポートを公開する chat/message channel では、共有 conversation-binding パスを通して `--bind here` を使用できます。
- 独自の thread/topic セマンティクスを持つ channel でも、同じ共有インターフェースの背後で channel 固有の canonicalization を提供できます。
- `--bind here` は常に「現在の conversation をその場でバインドする」ことを意味します。
- 汎用の現在 conversation binding では共有 OpenClaw binding store を使い、通常の gateway 再起動後も維持されます。

注記:

- `/acp spawn` では `--bind here` と `--thread ...` は相互排他的です。
- Discord では、`--bind here` は現在の channel または thread をその場でバインドします。`spawnAcpSessions` が必要なのは、OpenClaw が `--thread auto|here` のために child thread を作成する必要がある場合だけです。
- アクティブ channel が現在の conversation ACP binding を公開していない場合、OpenClaw は明確な未対応メッセージを返します。
- `resume` と「new session」の質問は、channel の質問ではなく ACP session の質問です。現在のチャット surface を変えずに runtime 状態を再利用または置き換えることができます。

### Thread にバインドされた session

channel adapter で thread binding が有効な場合、ACP session を thread にバインドできます。

- OpenClaw は thread を対象 ACP session にバインドします。
- その thread の follow-up メッセージは、バインドされた ACP session にルーティングされます。
- ACP 出力は同じ thread に返送されます。
- unfocus/close/archive/idle-timeout または max-age 満了で binding は削除されます。

thread binding のサポートは adapter ごとです。アクティブ channel adapter が thread binding をサポートしていない場合、OpenClaw は明確な unsupported/unavailable メッセージを返します。

thread-bound ACP に必要な feature flag:

- `acp.enabled=true`
- `acp.dispatch.enabled` はデフォルトで on（ACP dispatch を一時停止するには `false` を設定）
- channel-adapter の ACP thread-spawn flag を有効化（adapter 固有）
  - Discord: `channels.discord.threadBindings.spawnAcpSessions=true`
  - Telegram: `channels.telegram.threadBindings.spawnAcpSessions=true`

### Thread をサポートする channel

- session/thread binding capability を公開する任意の channel adapter。
- 現在の組み込みサポート:
  - Discord threads/channels
  - Telegram topics（groups/supergroups の forum topics と DM topics）
- Plugin channel も同じ binding インターフェースを通してサポートを追加できます。

## Channel 固有の設定

非エフェメラルなワークフローでは、トップレベルの `bindings[]` エントリに永続的な ACP binding を設定します。

### Binding モデル

- `bindings[].type="acp"` は永続的な ACP conversation binding を示します。
- `bindings[].match` は対象 conversation を識別します:
  - Discord channel または thread: `match.channel="discord"` + `match.peer.id="<channelOrThreadId>"`
  - Telegram forum topic: `match.channel="telegram"` + `match.peer.id="<chatId>:topic:<topicId>"`
  - BlueBubbles DM/group chat: `match.channel="bluebubbles"` + `match.peer.id="<handle|chat_id:*|chat_guid:*|chat_identifier:*>"`
    安定した group binding には `chat_id:*` または `chat_identifier:*` を推奨します。
  - iMessage DM/group chat: `match.channel="imessage"` + `match.peer.id="<handle|chat_id:*|chat_guid:*|chat_identifier:*>"`
    安定した group binding には `chat_id:*` を推奨します。
- `bindings[].agentId` は所有する OpenClaw agent id です。
- 任意の ACP 上書きは `bindings[].acp` 配下に置きます:
  - `mode`（`persistent` または `oneshot`）
  - `label`
  - `cwd`
  - `backend`

### agent ごとの runtime デフォルト

agent ごとに ACP デフォルトを一度だけ定義するには `agents.list[].runtime` を使います。

- `agents.list[].runtime.type="acp"`
- `agents.list[].runtime.acp.agent`（harness id、たとえば `codex` または `claude`）
- `agents.list[].runtime.acp.backend`
- `agents.list[].runtime.acp.mode`
- `agents.list[].runtime.acp.cwd`

ACP バインド済み session の上書き優先順位:

1. `bindings[].acp.*`
2. `agents.list[].runtime.acp.*`
3. グローバル ACP デフォルト（たとえば `acp.backend`）

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

- OpenClaw は、設定された ACP session が使用前に存在することを保証します。
- その channel または topic 内のメッセージは、設定された ACP session にルーティングされます。
- バインドされた conversation では、`/new` と `/reset` は同じ ACP session key をその場でリセットします。
- 一時的な runtime binding（たとえば thread-focus フローで作成されたもの）も、存在する場合は引き続き適用されます。
- 明示的な `cwd` なしの cross-agent ACP spawn では、OpenClaw は agent config から対象 agent の workspace を継承します。
- 継承された workspace パスが存在しない場合はバックエンドのデフォルト cwd にフォールバックし、存在するアクセス失敗は spawn error として表面化します。

## ACP session を開始する（インターフェース）

### `sessions_spawn` から

agent turn または tool call から ACP session を開始するには `runtime: "acp"` を使います。

```json
{
  "task": "リポジトリを開いて失敗しているテストを要約する",
  "runtime": "acp",
  "agentId": "codex",
  "thread": true,
  "mode": "session"
}
```

注記:

- `runtime` のデフォルトは `subagent` なので、ACP session では明示的に `runtime: "acp"` を設定してください。
- `agentId` が省略された場合、設定されていれば OpenClaw は `acp.defaultAgent` を使います。
- `mode: "session"` は、永続的なバインド conversation を維持するために `thread: true` を必要とします。

インターフェース詳細:

- `task`（必須）: ACP session に送られる初期プロンプト。
- `runtime`（ACP では必須）: `"acp"` でなければなりません。
- `agentId`（任意）: ACP 対象 harness id。設定されていれば `acp.defaultAgent` にフォールバックします。
- `thread`（任意、デフォルト `false`）: サポートされる場合に thread binding フローを要求します。
- `mode`（任意）: `run`（one-shot）または `session`（永続）。
  - デフォルトは `run`
  - `thread: true` で mode が省略されると、runtime path ごとに永続動作がデフォルトになることがあります
  - `mode: "session"` は `thread: true` を必要とします
- `cwd`（任意）: 要求する runtime working directory（バックエンド/runtime policy により検証されます）。省略された場合、設定されていれば ACP spawn は対象 agent workspace を継承します。継承されたパスが存在しない場合はバックエンドデフォルトにフォールバックし、実際のアクセスエラーはそのまま返されます。
- `label`（任意）: session/banner テキストで使われるオペレーター向けラベル。
- `resumeSessionId`（任意）: 新しい session を作る代わりに既存の ACP session を resume します。agent は `session/load` 経由で conversation history を再生します。`runtime: "acp"` が必要です。
- `streamTo`（任意）: `"parent"` は、初期 ACP run の進行サマリーを requester session に system event としてストリームします。
  - 利用可能な場合、受理されたレスポンスには、フル relay history を tail できる session スコープ JSONL ログ（`<sessionId>.acp-stream.jsonl`）を指す `streamLogPath` が含まれることがあります。

## 配信モデル

ACP session は、対話型 workspace にも parent 所有の background work にもなりえます。配信経路はその形によって決まります。

### 対話型 ACP session

対話型 session は、見えるチャット surface で会話を続けることを目的とします。

- `/acp spawn ... --bind here` は現在の conversation を ACP session にバインドします。
- `/acp spawn ... --thread ...` は channel の thread/topic を ACP session にバインドします。
- 永続設定の `bindings[].type="acp"` は、一致する conversation を同じ ACP session にルーティングします。

バインドされた conversation の follow-up メッセージは直接 ACP session にルーティングされ、ACP 出力は同じ channel/thread/topic に返送されます。

### parent 所有の one-shot ACP session

別の agent run によって spawn された one-shot ACP session は、sub-agent と同様の background child です。

- parent は `sessions_spawn({ runtime: "acp", mode: "run" })` で作業を要求します。
- child は独自の ACP harness session で動作します。
- 完了は内部 task-completion announce path を通して返されます。
- ユーザー向け返信が有用な場合、parent は child 結果を通常の assistant voice で書き換えます。

この経路を parent と child の peer-to-peer chat とみなさないでください。child はすでに parent へ戻る完了チャネルを持っています。

### `sessions_send` と A2A 配信

`sessions_send` は spawn 後に別の session を対象にできます。通常の peer session では、OpenClaw はメッセージ注入後に agent-to-agent（A2A）follow-up path を使います。

- 対象 session の返信を待つ
- 任意で requester と target に境界付きの follow-up turn を何回かやり取りさせる
- announce メッセージの生成を target に求める
- その announce を見える channel または thread に配信する

この A2A path は、送信者が見える follow-up を必要とする peer send のフォールバックです。たとえば広い `tools.sessions.visibility` 設定の下で、無関係な session が ACP target を見てメッセージできる場合などでは、これが有効のままです。

OpenClaw が A2A follow-up をスキップするのは、requester が parent 所有の one-shot ACP child に対するその parent 自身である場合だけです。その場合、task completion に加えて A2A を実行すると、child の結果で parent を起こし、parent の返信を再び child に転送して、parent/child の echo loop を作る可能性があります。この owned-child のケースでは、`sessions_send` の結果は `delivery.status="skipped"` を報告します。結果はすでに completion path が責任を持つためです。

### 既存 session を resume する

新規開始ではなく以前の ACP session を続行するには `resumeSessionId` を使います。agent は `session/load` 経由で conversation history を再生するため、前回までの完全なコンテキストを持ったまま再開できます。

```json
{
  "task": "前回の続きから再開して — 残っているテスト失敗を修正する",
  "runtime": "acp",
  "agentId": "codex",
  "resumeSessionId": "<previous-session-id>"
}
```

一般的な利用例:

- Codex session をノート PC からスマートフォンへ引き継ぐ — agent に前回の続きから再開するよう伝える
- CLI で対話的に始めた coding session を、今度は agent 経由でヘッドレスに続行する
- gateway の再起動や idle timeout で中断された作業を再開する

注記:

- `resumeSessionId` には `runtime: "acp"` が必要です。sub-agent runtime で使うとエラーになります。
- `resumeSessionId` は上流 ACP の conversation history を復元します。`thread` と `mode` は引き続き新しく作成する OpenClaw session に通常どおり適用されるため、`mode: "session"` にはやはり `thread: true` が必要です。
- 対象 agent は `session/load` をサポートしている必要があります（Codex と Claude Code は対応）。
- session ID が見つからない場合、spawn は明確なエラーで失敗します。新しい session への黙ったフォールバックはありません。

### オペレータースモークテスト

gateway の deploy 後に、unit テストに通るだけでなく ACP spawn
が本当に end-to-end で動いていることを素早く live 確認したいときに使ってください。

推奨ゲート:

1. 対象ホスト上の deploy 済み gateway version/commit を確認する。
2. deploy 済み source に、
   `src/gateway/sessions-patch.ts` の ACP lineage acceptance
   （`subagent:* or acp:* sessions`）が含まれていることを確認する。
3. live agent（たとえば
   `jpclawhq` 上の `razor(main)`）への一時的な ACPX bridge session を開く。
4. その agent に `sessions_spawn` を次の指定で呼ぶよう依頼する:
   - `runtime: "acp"`
   - `agentId: "codex"`
   - `mode: "run"`
   - task: `Reply with exactly LIVE-ACP-SPAWN-OK`
5. agent が次を報告することを確認する:
   - `accepted=yes`
   - 実際の `childSessionKey`
   - validator error がない
6. 一時的な ACPX bridge session をクリーンアップする。

live agent へのプロンプト例:

```text
Use the sessions_spawn tool now with runtime: "acp", agentId: "codex", and mode: "run".
Set the task to: "Reply with exactly LIVE-ACP-SPAWN-OK".
Then report only: accepted=<yes/no>; childSessionKey=<value or none>; error=<exact text or none>.
```

注記:

- このスモークテストは、意図的に
  thread-bound の永続 ACP session をテストしているのでない限り、`mode: "run"` のままにしてください。
- 基本ゲートでは `streamTo: "parent"` を必須にしないでください。その経路は
  requester/session capability に依存するため、別の integration チェックです。
- thread-bound の `mode: "session"` テストは、実際の Discord thread や Telegram topic から行う、
  2 段目のより豊かな integration パスとして扱ってください。

## Sandbox 互換性

ACP session は現在、OpenClaw sandbox 内ではなくホスト runtime 上で動作します。

現在の制限:

- requester session が sandboxed の場合、`sessions_spawn({ runtime: "acp" })` と `/acp spawn` の両方で ACP spawn はブロックされます。
  - エラー: `Sandboxed sessions cannot spawn ACP sessions because runtime="acp" runs on the host. Use runtime="subagent" from sandboxed sessions.`
- `runtime: "acp"` を使う `sessions_spawn` は `sandbox: "require"` をサポートしません。
  - エラー: `sessions_spawn sandbox="require" is unsupported for runtime="acp" because ACP sessions run outside the sandbox. Use runtime="subagent" or sandbox="inherit".`

sandbox 強制実行が必要な場合は `runtime: "subagent"` を使ってください。

### `/acp` コマンドから

チャットから明示的なオペレーター制御が必要な場合は `/acp spawn` を使います。

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

[Slash Commands](/ja-JP/tools/slash-commands) を参照してください。

## Session target の解決

ほとんどの `/acp` アクションは、任意の session target（`session-key`、`session-id`、または `session-label`）を受け付けます。

解決順序:

1. 明示的な target 引数（または `/acp steer` の `--session`）
   - まず key を試す
   - 次に UUID 形式の session id
   - 次に label
2. 現在の thread binding（この conversation/thread が ACP session にバインドされている場合）
3. 現在の requester session へのフォールバック

現在の conversation binding と thread binding の両方が、ステップ 2 に参加します。

どの target も解決できない場合、OpenClaw は明確なエラー（`Unable to resolve session target: ...`）を返します。

## Spawn bind モード

`/acp spawn` は `--bind here|off` をサポートします。

| Mode | 動作 |
| ------ | ---------------------------------------------------------------------- |
| `here` | 現在アクティブな conversation をその場でバインドします。アクティブなものがなければ失敗します。 |
| `off` | 現在の conversation binding を作成しません。 |

注記:

- `--bind here` は「この channel または chat を Codex バックにする」ための最も簡単なオペレーターパスです。
- `--bind here` は child thread を作成しません。
- `--bind here` は、現在の conversation binding サポートを公開する channel でのみ利用できます。
- 同じ `/acp spawn` 呼び出しで `--bind` と `--thread` は併用できません。

## Spawn thread モード

`/acp spawn` は `--thread auto|here|off` をサポートします。

| Mode | 動作 |
| ------ | --------------------------------------------------------------------------------------------------- |
| `auto` | アクティブなスレッド内ではそのスレッドをバインドします。スレッド外では、サポートされていれば child thread を作成してバインドします。 |
| `here` | 現在アクティブなスレッドを必須にします。スレッド内でなければ失敗します。 |
| `off` | バインドしません。session はバインドなしで開始されます。 |

注記:

- thread binding でない surface では、デフォルト動作は実質的に `off` です。
- thread-bound spawn には channel policy のサポートが必要です:
  - Discord: `channels.discord.threadBindings.spawnAcpSessions=true`
  - Telegram: `channels.telegram.threadBindings.spawnAcpSessions=true`
- child thread を作らず現在の conversation を固定したい場合は `--bind here` を使ってください。

## ACP 制御

利用可能なコマンドファミリー:

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

`/acp status` は有効な runtime オプションを表示し、利用可能な場合は runtime レベルと backend レベルの両方の session identifier も表示します。

一部の制御は backend capability に依存します。backend がある制御をサポートしていない場合、OpenClaw は明確な unsupported-control error を返します。

## ACP コマンドクックブック

| Command | 何をするか | 例 |
| -------------------- | --------------------------------------------------------- | ------------------------------------------------------------- |
| `/acp spawn` | ACP session を作成する。現在の binding または thread binding は任意。 | `/acp spawn codex --bind here --cwd /repo` |
| `/acp cancel` | 対象 session の進行中 turn をキャンセルする。 | `/acp cancel agent:codex:acp:<uuid>` |
| `/acp steer` | 実行中 session に steer 指示を送る。 | `/acp steer --session support inbox prioritize failing tests` |
| `/acp close` | session を閉じて thread target の binding を解除する。 | `/acp close` |
| `/acp status` | backend、mode、state、runtime オプション、capability を表示する。 | `/acp status` |
| `/acp set-mode` | 対象 session の runtime mode を設定する。 | `/acp set-mode plan` |
| `/acp set` | 汎用 runtime config オプションを書き込む。 | `/acp set model openai/gpt-5.4` |
| `/acp cwd` | runtime working directory の override を設定する。 | `/acp cwd /Users/user/Projects/repo` |
| `/acp permissions` | 承認ポリシープロファイルを設定する。 | `/acp permissions strict` |
| `/acp timeout` | runtime timeout（秒）を設定する。 | `/acp timeout 120` |
| `/acp model` | runtime model override を設定する。 | `/acp model anthropic/claude-opus-4-6` |
| `/acp reset-options` | session の runtime option override を削除する。 | `/acp reset-options` |
| `/acp sessions` | store から最近の ACP session を一覧表示する。 | `/acp sessions` |
| `/acp doctor` | backend の健全性、capability、実行可能な修正を表示する。 | `/acp doctor` |
| `/acp install` | 決定的な install と enable 手順を表示する。 | `/acp install` |

`/acp sessions` は、現在バインドされている session または requester session の store を読み取ります。`session-key`、`session-id`、または `session-label` トークンを受け付けるコマンドは、gateway session discovery を通して target を解決します。これには agent ごとのカスタム `session.store` ルートも含まれます。

## Runtime オプションの対応関係

`/acp` には、便利コマンドと汎用 setter があります。

等価な操作:

- `/acp model <id>` は runtime config key `model` に対応します。
- `/acp permissions <profile>` は runtime config key `approval_policy` に対応します。
- `/acp timeout <seconds>` は runtime config key `timeout` に対応します。
- `/acp cwd <path>` は runtime cwd override を直接更新します。
- `/acp set <key> <value>` は汎用経路です。
  - 特別扱い: `key=cwd` は cwd override 経路を使います。
- `/acp reset-options` は対象 session のすべての runtime override をクリアします。

## acpx harness サポート（現状）

現在の acpx 組み込み harness alias:

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

OpenClaw が acpx backend を使う場合、acpx config でカスタム agent alias を定義していない限り、`agentId` にはこれらの値を使ってください。
ローカルの Cursor インストールがまだ ACP を `agent acp` として公開している場合は、組み込みデフォルトを変更するのではなく、acpx config 内の `cursor` agent command を上書きしてください。

直接の acpx CLI 利用では、`--agent <command>` を通して任意の adapter も対象にできますが、この生の escape hatch は acpx CLI の機能です（通常の OpenClaw `agentId` 経路ではありません）。

## 必須設定

コア ACP ベースライン:

```json5
{
  acp: {
    enabled: true,
    // 任意。デフォルトは true。/acp 制御は維持したまま ACP dispatch を一時停止するには false を設定。
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

thread binding の設定は channel-adapter ごとです。Discord の例:

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

thread-bound ACP spawn が動作しない場合は、まず adapter feature flag を確認してください。

- Discord: `channels.discord.threadBindings.spawnAcpSessions=true`

現在の conversation binding では child-thread 作成は不要です。必要なのは、アクティブな conversation context と ACP conversation binding を公開する channel adapter です。

[Configuration Reference](/ja-JP/gateway/configuration-reference) を参照してください。

## acpx backend の plugin セットアップ

新規インストールでは、バンドル済みの `acpx` runtime plugin がデフォルトで有効になっているため、ACP
は通常、手動の plugin install 手順なしで動作します。

まずはこちらから始めてください:

```text
/acp doctor
```

`acpx` を無効にした、`plugins.allow` / `plugins.deny` で拒否した、または
ローカル開発 checkout に切り替えたい場合は、明示的な plugin 経路を使います。

```bash
openclaw plugins install acpx
openclaw config set plugins.entries.acpx.enabled true
```

開発中のローカル workspace install:

```bash
openclaw plugins install ./path/to/local/acpx-plugin
```

その後、backend の健全性を確認します。

```text
/acp doctor
```

### acpx の command と version 設定

デフォルトでは、バンドル済み acpx backend plugin（`acpx`）は plugin ローカルに固定されたバイナリを使います。

1. command のデフォルトは、ACPX plugin package 内の plugin ローカル `node_modules/.bin/acpx`。
2. expected version のデフォルトは extension pin。
3. 起動時に ACP backend は即座に not-ready として登録される。
4. バックグラウンドの ensure job が `acpx --version` を検証する。
5. plugin ローカルバイナリが存在しない、または不一致なら、次を実行して再検証する:
   `npm install --omit=dev --no-save acpx@<pinned>`

plugin config で command/version を上書きできます:

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

注記:

- `command` は絶対パス、相対パス、または command 名（`acpx`）を受け付けます。
- 相対パスは OpenClaw workspace directory から解決されます。
- `expectedVersion: "any"` は厳密な version 一致を無効にします。
- `command` がカスタム binary/path を指す場合、plugin ローカル自動 install は無効になります。
- backend の健全性チェックが走っている間も、OpenClaw の起動は非ブロッキングのままです。

[Plugins](/ja-JP/tools/plugin) を参照してください。

### 自動依存関係インストール

`npm install -g openclaw` で OpenClaw をグローバルインストールすると、acpx
runtime 依存関係（プラットフォーム固有 binary）は postinstall hook によって自動インストールされます。自動インストールに失敗しても gateway は
通常どおり起動し、不足している依存関係は `openclaw acp doctor` を通して報告されます。

### Plugin tools MCP bridge

デフォルトでは、ACPX session は OpenClaw の plugin 登録済み tool を
ACP harness に公開**しません**。

Codex や Claude Code のような ACP agent に、
memory recall/store のようなインストール済み
OpenClaw plugin tool を呼ばせたい場合は、専用 bridge を有効にしてください。

```bash
openclaw config set plugins.entries.acpx.config.pluginToolsMcpBridge true
```

これが行うこと:

- ACPX session
  bootstrap に `openclaw-plugin-tools` という組み込み MCP server を注入する。
- インストール済みかつ有効な OpenClaw
  plugin によってすでに登録された plugin tool を公開する。
- この機能を明示的かつデフォルト off のままにする。

セキュリティと信頼の注記:

- これは ACP harness の tool surface を拡張します。
- ACP agent がアクセスできるのは、gateway ですでにアクティブな plugin tool だけです。
- これは、それらの plugin を OpenClaw 自体で実行させるのと同じ trust boundary として扱ってください。
- 有効にする前にインストール済み plugin を見直してください。

カスタム `mcpServers` は従来どおり動作します。組み込み plugin-tools bridge は
追加のオプトイン利便機能であり、汎用 MCP server config の置き換えではありません。

### OpenClaw tools MCP bridge

デフォルトでは、ACPX session は組み込み OpenClaw tool も
MCP 経由で公開**しません**。`cron` のような選択済み
組み込み tool が ACP agent に必要な場合は、別の core-tools bridge を有効にしてください。

```bash
openclaw config set plugins.entries.acpx.config.openClawToolsMcpBridge true
```

これが行うこと:

- ACPX session
  bootstrap に `openclaw-tools` という組み込み MCP server を注入する。
- 選択された組み込み OpenClaw tool を公開する。初期 server では `cron` を公開します。
- core tool の公開を明示的かつデフォルト off のままにする。

### Runtime timeout 設定

バンドル済みの `acpx` plugin は、デフォルトで組み込み runtime turn に 120 秒の
timeout を設定します。これにより、Gemini CLI のような遅めの harness にも ACP の起動と初期化を完了する十分な時間を与えます。ホストに別の
runtime 上限が必要な場合は上書きしてください。

```bash
openclaw config set plugins.entries.acpx.config.timeoutSeconds 180
```

この値を変更した後は gateway を再起動してください。

### Health probe agent 設定

バンドル済みの `acpx` plugin は、組み込み runtime backend の準備可否を判断する際に 1 つの harness agent を probe します。デフォルトは `codex` です。deployment で別のデフォルト ACP agent を使う場合は、probe agent も同じ id に設定してください。

```bash
openclaw config set plugins.entries.acpx.config.probeAgent claude
```

この値を変更した後は gateway を再起動してください。

## 権限設定

ACP session は非対話型で動作します。ファイル書き込みや shell 実行の権限プロンプトを承認または拒否するための TTY はありません。acpx plugin は、権限の扱い方を制御する 2 つの config key を提供します:

これらの ACPX harness 権限は、OpenClaw の exec 承認とは別であり、Claude CLI の `--permission-mode bypassPermissions` のような CLI-backend の vendor bypass flag とも別です。ACPX の `approve-all` は、ACP session 用の harness レベルの break-glass スイッチです。

### `permissionMode`

harness agent がプロンプトなしで実行できる操作を制御します。

| Value | 動作 |
| --------------- | --------------------------------------------------------- |
| `approve-all` | すべてのファイル書き込みと shell command を自動承認します。 |
| `approve-reads` | 読み取りのみを自動承認します。書き込みと exec にはプロンプトが必要です。 |
| `deny-all` | すべての権限プロンプトを拒否します。 |

### `nonInteractivePermissions`

権限プロンプトが表示されるべきだが対話型 TTY が使えない場合（ACP session では常にそうです）に何が起きるかを制御します。

| Value | 動作 |
| ------ | ----------------------------------------------------------------- |
| `fail` | `AcpRuntimeError` で session を中断します。**（デフォルト）** |
| `deny` | 権限を黙って拒否して続行します（穏やかな劣化）。 |

### 設定

plugin config 経由で設定します:

```bash
openclaw config set plugins.entries.acpx.config.permissionMode approve-all
openclaw config set plugins.entries.acpx.config.nonInteractivePermissions fail
```

これらの値を変更した後は gateway を再起動してください。

> **重要:** OpenClaw は現在、デフォルトで `permissionMode=approve-reads` および `nonInteractivePermissions=fail` を使用します。非対話型 ACP session では、権限プロンプトを発生させる書き込みや exec は `AcpRuntimeError: Permission prompt unavailable in non-interactive mode` で失敗することがあります。
>
> 権限を制限する必要がある場合は、session がクラッシュする代わりに穏やかに劣化するよう、`nonInteractivePermissions` を `deny` に設定してください。

## トラブルシューティング

| 症状 | 可能性の高い原因 | 修正 |
| --------------------------------------------------------------------------- | ------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `ACP runtime backend is not configured` | backend plugin が存在しないか無効。 | backend plugin を install して有効化し、その後 `/acp doctor` を実行します。 |
| `ACP is disabled by policy (acp.enabled=false)` | ACP がグローバルで無効。 | `acp.enabled=true` を設定します。 |
| `ACP dispatch is disabled by policy (acp.dispatch.enabled=false)` | 通常の thread message からの dispatch が無効。 | `acp.dispatch.enabled=true` を設定します。 |
| `ACP agent "<id>" is not allowed by policy` | agent が allowlist にない。 | 許可された `agentId` を使うか、`acp.allowedAgents` を更新します。 |
| `Unable to resolve session target: ...` | key/id/label トークンが不正。 | `/acp sessions` を実行し、正確な key/label をコピーして再試行します。 |
| `--bind here requires running /acp spawn inside an active ... conversation` | アクティブでバインド可能な conversation なしで `--bind here` を使用。 | 対象の chat/channel に移動して再試行するか、バインドなし spawn を使用します。 |
| `Conversation bindings are unavailable for <channel>.` | adapter に現在の conversation ACP binding capability がない。 | サポートされている場合は `/acp spawn ... --thread ...` を使う、トップレベル `bindings[]` を設定する、またはサポートされる channel に移動します。 |
| `--thread here requires running /acp spawn inside an active ... thread` | thread context の外で `--thread here` を使用。 | 対象 thread に移動するか、`--thread auto`/`off` を使います。 |
| `Only <user-id> can rebind this channel/conversation/thread.` | 別のユーザーがアクティブ binding target を所有している。 | 所有者として再バインドするか、別の conversation または thread を使います。 |
| `Thread bindings are unavailable for <channel>.` | adapter に thread binding capability がない。 | `--thread off` を使うか、サポートされる adapter/channel に移動します。 |
| `Sandboxed sessions cannot spawn ACP sessions ...` | ACP runtime はホスト側で動作し、requester session が sandboxed。 | sandboxed session からは `runtime="subagent"` を使うか、sandboxed でない session から ACP spawn を実行します。 |
| `sessions_spawn sandbox="require" is unsupported for runtime="acp" ...` | ACP runtime に対して `sandbox="require"` を要求。 | 必須 sandbox 化には `runtime="subagent"` を使うか、sandboxed でない session から `sandbox="inherit"` で ACP を使います。 |
| bound session の ACP metadata が欠けている | 古い/削除済みの ACP session metadata。 | `/acp spawn` で再作成し、その後 thread を再バインド/フォーカスします。 |
| `AcpRuntimeError: Permission prompt unavailable in non-interactive mode` | `permissionMode` が非対話型 ACP session での書き込み/exec をブロックしている。 | `plugins.entries.acpx.config.permissionMode` を `approve-all` に設定し、gateway を再起動します。[権限設定](#permission-configuration) を参照してください。 |
| ACP session が早期に失敗し、出力がほとんどない | 権限プロンプトが `permissionMode`/`nonInteractivePermissions` によってブロックされている。 | gateway log で `AcpRuntimeError` を確認します。完全な権限が必要なら `permissionMode=approve-all` を設定し、穏やかな劣化が必要なら `nonInteractivePermissions=deny` を設定します。 |
| 作業完了後も ACP session がいつまでも停止しない | harness process は終了したが、ACP session が完了を報告しなかった。 | `ps aux \| grep acpx` で監視し、古い process を手動で kill します。 |
