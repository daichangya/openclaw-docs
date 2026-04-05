---
read_when:
    - グループチャット動作またはメンションゲーティングを変更するとき
summary: 各サーフェスでのグループチャット動作（Discord/iMessage/Matrix/Microsoft Teams/Signal/Slack/Telegram/WhatsApp/Zalo）
title: グループ
x-i18n:
    generated_at: "2026-04-05T12:35:46Z"
    model: gpt-5.4
    provider: openai
    source_hash: 39d066e0542b468c6f8b384b463e2316590ea09a00ecb2065053e1e2ce55bd5f
    source_path: channels/groups.md
    workflow: 15
---

# グループ

OpenClaw は、Discord、iMessage、Matrix、Microsoft Teams、Signal、Slack、Telegram、WhatsApp、Zalo の各サーフェスで、一貫した方法でグループチャットを扱います。

## 初心者向けイントロ（2 分）

OpenClaw は、あなた自身のメッセージングアカウント上で「動作」します。別個の WhatsApp bot ユーザーは存在しません。
**あなた**がグループに参加していれば、OpenClaw はそのグループを認識し、そこで返信できます。

デフォルトの動作:

- グループは制限されています（`groupPolicy: "allowlist"`）。
- 明示的にメンションゲーティングを無効にしない限り、返信にはメンションが必要です。

つまり、allowlist に登録された送信者は、OpenClaw にメンションすることで起動できます。

> 要点
>
> - **DM アクセス**は `*.allowFrom` で制御されます。
> - **グループアクセス**は `*.groupPolicy` と allowlist（`*.groups`、`*.groupAllowFrom`）で制御されます。
> - **返信トリガー**はメンションゲーティング（`requireMention`、`/activation`）で制御されます。

クイックフロー（グループメッセージに対して何が起きるか）:

```
groupPolicy? disabled -> drop
groupPolicy? allowlist -> group allowed? no -> drop
requireMention? yes -> mentioned? no -> store for context only
otherwise -> reply
```

## コンテキスト可視性と allowlist

グループの安全性には、異なる 2 つの制御が関わります。

- **トリガー認可**: 誰がエージェントを起動できるか（`groupPolicy`、`groups`、`groupAllowFrom`、チャネル固有の allowlist）。
- **コンテキスト可視性**: モデルに注入される補助コンテキストの内容（返信テキスト、引用、スレッド履歴、転送メタデータ）。

デフォルトでは、OpenClaw は通常のチャット動作を優先し、コンテキストをほぼ受信したまま保持します。つまり、allowlist は主に誰がアクションを起動できるかを決めるものであり、引用や履歴スニペットのすべてに対する普遍的なマスキング境界ではありません。

現在の動作はチャネルごとに異なります。

- 一部のチャネルでは、特定のパスですでに送信者ベースの補助コンテキストフィルタリングが適用されています（たとえば Slack のスレッドシード、Matrix の返信/スレッド参照）。
- 他のチャネルでは、引用/返信/転送コンテキストは受信したまま渡されます。

ハードニングの方向性（計画中）:

- `contextVisibility: "all"`（デフォルト）は、現在の受信どおりの動作を維持します。
- `contextVisibility: "allowlist"` は、補助コンテキストを allowlist に登録された送信者に限定します。
- `contextVisibility: "allowlist_quote"` は `allowlist` に加えて、明示的な 1 つの引用/返信例外を認めます。

このハードニングモデルがすべてのチャネルで一貫して実装されるまでは、サーフェスごとの差異があることを想定してください。

![グループメッセージフロー](/images/groups-flow.svg)

やりたいことが次のいずれかなら...

| 目的 | 設定内容 |
| -------------------------------------------- | ---------------------------------------------------------- |
| すべてのグループを許可しつつ、@メンション時のみ返信 | `groups: { "*": { requireMention: true } }`                |
| すべてのグループ返信を無効化 | `groupPolicy: "disabled"`                                  |
| 特定のグループのみ | `groups: { "<group-id>": { ... } }`（`"*"` キーなし）      |
| グループ内で起動できるのを自分だけにする | `groupPolicy: "allowlist"`, `groupAllowFrom: ["+1555..."]` |

## セッションキー

- グループセッションは `agent:<agentId>:<channel>:group:<id>` セッションキーを使います（room/channel は `agent:<agentId>:<channel>:channel:<id>` を使います）。
- Telegram フォーラムトピックでは、各トピックが独自のセッションを持つように、グループ ID に `:topic:<threadId>` が追加されます。
- ダイレクトチャットはメインセッションを使います（設定されていれば送信者ごとのセッション）。
- グループセッションでは heartbeat はスキップされます。

<a id="pattern-personal-dms-public-groups-single-agent"></a>

## パターン: 個人 DM + 公開グループ（単一エージェント）

はい。あなたの「個人」トラフィックが **DM** で、「公開」トラフィックが **グループ** なら、これはうまく機能します。

理由: 単一エージェントモードでは、DM は通常 **main** セッションキー（`agent:main:main`）に入り、グループは常に **非 main** セッションキー（`agent:main:<channel>:group:<id>`）を使います。`mode: "non-main"` でサンドボックスを有効にすると、それらのグループセッションは Docker 内で実行され、メインの DM セッションはホスト上に残ります。

これにより、1 つのエージェント「頭脳」（共有ワークスペース + メモリ）で、2 つの実行態勢を持てます。

- **DM**: フルツール（ホスト）
- **グループ**: サンドボックス + 制限付きツール（Docker）

> ワークスペースやペルソナを本当に分離する必要がある場合（「個人」と「公開」が決して混ざってはならない場合）は、2 つ目のエージェント + バインディングを使ってください。[Multi-Agent Routing](/concepts/multi-agent)を参照してください。

例（DM はホスト、グループはサンドボックス + メッセージング専用ツール）:

```json5
{
  agents: {
    defaults: {
      sandbox: {
        mode: "non-main", // groups/channels are non-main -> sandboxed
        scope: "session", // strongest isolation (one container per group/channel)
        workspaceAccess: "none",
      },
    },
  },
  tools: {
    sandbox: {
      tools: {
        // If allow is non-empty, everything else is blocked (deny still wins).
        allow: ["group:messaging", "group:sessions"],
        deny: ["group:runtime", "group:fs", "group:ui", "nodes", "cron", "gateway"],
      },
    },
  },
}
```

「ホストアクセスなし」ではなく「グループがフォルダー X だけ見られるように」したい場合は、`workspaceAccess: "none"` のままにして、allowlist に登録したパスだけをサンドボックスにマウントします。

```json5
{
  agents: {
    defaults: {
      sandbox: {
        mode: "non-main",
        scope: "session",
        workspaceAccess: "none",
        docker: {
          binds: [
            // hostPath:containerPath:mode
            "/home/user/FriendsShared:/data:ro",
          ],
        },
      },
    },
  },
}
```

関連:

- 設定キーとデフォルト: [Gateway configuration](/gateway/configuration-reference#agentsdefaultssandbox)
- ツールがブロックされる理由のデバッグ: [Sandbox vs Tool Policy vs Elevated](/gateway/sandbox-vs-tool-policy-vs-elevated)
- バインドマウントの詳細: [Sandboxing](/gateway/sandboxing#custom-bind-mounts)

## 表示ラベル

- UI ラベルは、利用可能な場合は `displayName` を使い、`<channel>:<token>` の形式で表示されます。
- `#room` は room/channel 用に予約されています。グループチャットは `g-<slug>` を使います（小文字、スペースは `-` に変換し、`#@+._-` は維持）。

## グループポリシー

チャネルごとに、グループ/room メッセージの扱いを制御します。

```json5
{
  channels: {
    whatsapp: {
      groupPolicy: "disabled", // "open" | "disabled" | "allowlist"
      groupAllowFrom: ["+15551234567"],
    },
    telegram: {
      groupPolicy: "disabled",
      groupAllowFrom: ["123456789"], // numeric Telegram user id (wizard can resolve @username)
    },
    signal: {
      groupPolicy: "disabled",
      groupAllowFrom: ["+15551234567"],
    },
    imessage: {
      groupPolicy: "disabled",
      groupAllowFrom: ["chat_id:123"],
    },
    msteams: {
      groupPolicy: "disabled",
      groupAllowFrom: ["user@org.com"],
    },
    discord: {
      groupPolicy: "allowlist",
      guilds: {
        GUILD_ID: { channels: { help: { allow: true } } },
      },
    },
    slack: {
      groupPolicy: "allowlist",
      channels: { "#general": { allow: true } },
    },
    matrix: {
      groupPolicy: "allowlist",
      groupAllowFrom: ["@owner:example.org"],
      groups: {
        "!roomId:example.org": { allow: true },
        "#alias:example.org": { allow: true },
      },
    },
  },
}
```

| ポリシー | 動作 |
| ------------- | ------------------------------------------------------------ |
| `"open"`      | グループは allowlist をバイパスします。メンションゲーティングは引き続き適用されます。 |
| `"disabled"`  | すべてのグループメッセージを完全にブロックします。 |
| `"allowlist"` | 設定済みの allowlist に一致するグループ/room のみ許可します。 |

注記:

- `groupPolicy` は、@メンションを必須にするメンションゲーティングとは別物です。
- WhatsApp/Telegram/Signal/iMessage/Microsoft Teams/Zalo: `groupAllowFrom` を使います（フォールバック: 明示的な `allowFrom`）。
- DM ペアリング承認（`*-allowFrom` ストアエントリ）は DM アクセスにのみ適用されます。グループ送信者認可は、グループ allowlist で引き続き明示的に行います。
- Discord: allowlist は `channels.discord.guilds.<id>.channels` を使います。
- Slack: allowlist は `channels.slack.channels` を使います。
- Matrix: allowlist は `channels.matrix.groups` を使います。room ID または alias を優先してください。参加済み room 名の参照はベストエフォートで、解決できない名前は実行時に無視されます。送信者を制限するには `channels.matrix.groupAllowFrom` を使います。room ごとの `users` allowlist もサポートされています。
- グループ DM は別個に制御されます（`channels.discord.dm.*`、`channels.slack.dm.*`）。
- Telegram allowlist は、ユーザー ID（`"123456789"`、`"telegram:123456789"`、`"tg:123456789"`）またはユーザー名（`"@alice"` または `"alice"`）に一致できます。プレフィックスは大文字小文字を区別しません。
- デフォルトは `groupPolicy: "allowlist"` です。グループ allowlist が空の場合、グループメッセージはブロックされます。
- ランタイム安全性: プロバイダーブロック全体が欠けている場合（`channels.<provider>` が存在しない場合）、グループポリシーは `channels.defaults.groupPolicy` を継承せず、フェイルクローズドモード（通常は `allowlist`）にフォールバックします。

クイックな考え方（グループメッセージの評価順）:

1. `groupPolicy`（open/disabled/allowlist）
2. グループ allowlist（`*.groups`、`*.groupAllowFrom`、チャネル固有の allowlist）
3. メンションゲーティング（`requireMention`、`/activation`）

## メンションゲーティング（デフォルト）

グループメッセージでは、グループごとに上書きしない限り、メンションが必要です。デフォルトは各サブシステムの `*.groups."*"` にあります。

bot メッセージへの返信は、暗黙のメンションとして扱われます（チャネルが返信メタデータをサポートしている場合）。これは Telegram、WhatsApp、Slack、Discord、Microsoft Teams に適用されます。

```json5
{
  channels: {
    whatsapp: {
      groups: {
        "*": { requireMention: true },
        "123@g.us": { requireMention: false },
      },
    },
    telegram: {
      groups: {
        "*": { requireMention: true },
        "123456789": { requireMention: false },
      },
    },
    imessage: {
      groups: {
        "*": { requireMention: true },
        "123": { requireMention: false },
      },
    },
  },
  agents: {
    list: [
      {
        id: "main",
        groupChat: {
          mentionPatterns: ["@openclaw", "openclaw", "\\+15555550123"],
          historyLimit: 50,
        },
      },
    ],
  },
}
```

注記:

- `mentionPatterns` は大文字小文字を区別しない安全な regex パターンです。無効なパターンや危険なネスト反復形式は無視されます。
- 明示的なメンションを提供するサーフェスでは、それが引き続き通ります。パターンはフォールバックです。
- エージェントごとの上書き: `agents.list[].groupChat.mentionPatterns`（複数のエージェントが同じグループを共有する場合に便利です）。
- メンションゲーティングは、メンション検出が可能な場合にのみ適用されます（ネイティブメンションがあるか、`mentionPatterns` が設定されている場合）。
- Discord のデフォルトは `channels.discord.guilds."*"` にあります（guild/channel ごとに上書き可能）。
- グループ履歴コンテキストはチャネルをまたいで統一的にラップされ、**pending-only** です（メンションゲーティングのためにスキップされたメッセージのみ）。グローバルデフォルトには `messages.groupChat.historyLimit` を使い、上書きには `channels.<channel>.historyLimit`（または `channels.<channel>.accounts.*.historyLimit`）を使います。無効化するには `0` を設定してください。

## グループ/channel ツール制限（任意）

一部のチャネル設定では、**特定のグループ/room/channel 内**で利用可能なツールを制限できます。

- `tools`: グループ全体に対するツールの allow/deny。
- `toolsBySender`: グループ内の送信者ごとの上書き。
  明示的なキープレフィックスを使ってください:
  `id:<senderId>`、`e164:<phone>`、`username:<handle>`、`name:<displayName>`、および `"*"` ワイルドカード。
  旧来のプレフィックスなしキーも引き続き受け付けられ、`id:` のみとして一致します。

解決順（最も具体的なものが優先）:

1. グループ/channel の `toolsBySender` 一致
2. グループ/channel の `tools`
3. デフォルト（`"*"`）の `toolsBySender` 一致
4. デフォルト（`"*"`）の `tools`

例（Telegram）:

```json5
{
  channels: {
    telegram: {
      groups: {
        "*": { tools: { deny: ["exec"] } },
        "-1001234567890": {
          tools: { deny: ["exec", "read", "write"] },
          toolsBySender: {
            "id:123456789": { alsoAllow: ["exec"] },
          },
        },
      },
    },
  },
}
```

注記:

- グループ/channel のツール制限は、グローバル/エージェントのツールポリシーに加えて適用されます（deny が引き続き優先されます）。
- 一部のチャネルでは、room/channel に対して異なるネスト構造を使います（例: Discord の `guilds.*.channels.*`、Slack の `channels.*`、Microsoft Teams の `teams.*.channels.*`）。

## グループ allowlist

`channels.whatsapp.groups`、`channels.telegram.groups`、または `channels.imessage.groups` が設定されている場合、そのキーはグループ allowlist として機能します。すべてのグループを許可しつつデフォルトのメンション動作を設定したい場合は、`"*"` を使います。

よくある混乱: DM ペアリング承認はグループ認可とは同じではありません。
DM ペアリングをサポートするチャネルでは、ペアリングストアは DM のみを解放します。グループコマンドには、`groupAllowFrom` やそのチャネルでドキュメント化された設定フォールバックなど、設定 allowlist からの明示的なグループ送信者認可が引き続き必要です。

よくある意図（コピー&ペースト用）:

1. すべてのグループ返信を無効化

```json5
{
  channels: { whatsapp: { groupPolicy: "disabled" } },
}
```

2. 特定のグループのみ許可（WhatsApp）

```json5
{
  channels: {
    whatsapp: {
      groups: {
        "123@g.us": { requireMention: true },
        "456@g.us": { requireMention: false },
      },
    },
  },
}
```

3. すべてのグループを許可するがメンション必須（明示的）

```json5
{
  channels: {
    whatsapp: {
      groups: { "*": { requireMention: true } },
    },
  },
}
```

4. グループ内で起動できるのをオーナーだけにする（WhatsApp）

```json5
{
  channels: {
    whatsapp: {
      groupPolicy: "allowlist",
      groupAllowFrom: ["+15551234567"],
      groups: { "*": { requireMention: true } },
    },
  },
}
```

## Activation（owner-only）

グループオーナーは、グループごとの activation を切り替えられます。

- `/activation mention`
- `/activation always`

owner は `channels.whatsapp.allowFrom`（未設定の場合は bot 自身の self E.164）で決まります。このコマンドは単独のメッセージとして送信してください。現在、他のサーフェスでは `/activation` は無視されます。

## コンテキストフィールド

グループの受信ペイロードでは次が設定されます。

- `ChatType=group`
- `GroupSubject`（判明している場合）
- `GroupMembers`（判明している場合）
- `WasMentioned`（メンションゲーティングの結果）
- Telegram フォーラムトピックでは、さらに `MessageThreadId` と `IsForum` も含まれます。

チャネル固有の注記:

- BlueBubbles は、名前のない macOS グループ参加者について、`GroupMembers` を設定する前にローカル Contacts データベースから任意で情報を補完できます。これはデフォルトでオフであり、通常のグループゲーティングに通過した後にのみ実行されます。

エージェントのシステムプロンプトには、新しいグループセッションの最初のターンでグループ向けイントロが含まれます。これは、モデルに人間のように応答すること、Markdown テーブルを避けること、リテラルな `\n` シーケンスを入力しないことを促します。

## iMessage の詳細

- ルーティングまたは allowlist には `chat_id:<id>` を優先してください。
- チャット一覧: `imsg chats --limit 20`
- グループ返信は常に同じ `chat_id` に戻ります。

## WhatsApp の詳細

WhatsApp 固有の動作（履歴注入、メンション処理の詳細）については、[Group messages](/channels/group-messages)を参照してください。
