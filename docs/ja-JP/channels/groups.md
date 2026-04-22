---
read_when:
    - グループチャットの動作またはメンションのゲート条件の変更
summary: 各サーフェスにおけるグループチャットの動作（Discord/iMessage/Matrix/Microsoft Teams/Signal/Slack/Telegram/WhatsApp/Zalo）
title: グループ
x-i18n:
    generated_at: "2026-04-22T04:19:48Z"
    model: gpt-5.4
    provider: openai
    source_hash: a86e202c7e990e040eb092aaef46bc856ee8d39b2e5fe1c733e24f1b35faa824
    source_path: channels/groups.md
    workflow: 15
---

# グループ

OpenClawは、Discord、iMessage、Matrix、Microsoft Teams、Signal、Slack、Telegram、WhatsApp、Zaloといった各サーフェスで、グループチャットを一貫した形で扱います。

## 初心者向けイントロ（2分）

OpenClawは、あなた自身のメッセージングアカウント上で「動作」します。別個のWhatsApp botユーザーは存在しません。
**あなた**がグループに参加していれば、OpenClawはそのグループを認識し、そこで応答できます。

デフォルトの動作:

- グループは制限されています（`groupPolicy: "allowlist"`）。
- 明示的にメンションゲートを無効化しない限り、返信にはメンションが必要です。

つまり、許可リストに登録された送信者は、OpenClawにメンションすることでトリガーできます。

> 要点
>
> - **DMアクセス** は `*.allowFrom` によって制御されます。
> - **グループアクセス** は `*.groupPolicy` + 許可リスト（`*.groups`, `*.groupAllowFrom`）によって制御されます。
> - **返信のトリガー** はメンションゲート（`requireMention`, `/activation`）によって制御されます。

クイックフロー（グループメッセージで何が起こるか）:

```
groupPolicy? disabled -> drop
groupPolicy? allowlist -> group allowed? no -> drop
requireMention? yes -> mentioned? no -> store for context only
otherwise -> reply
```

## コンテキストの可視性と許可リスト

グループの安全性には、2つの異なる制御が関わります。

- **トリガー認可**: 誰がエージェントをトリガーできるか（`groupPolicy`, `groups`, `groupAllowFrom`, チャネル固有の許可リスト）。
- **コンテキストの可視性**: どの補足コンテキストがモデルに注入されるか（返信テキスト、引用、スレッド履歴、転送メタデータ）。

デフォルトでは、OpenClawは通常のチャット動作を優先し、コンテキストはおおむね受信したまま保持します。これは、許可リストが主に「誰がアクションをトリガーできるか」を決めるものであり、引用や履歴スニペットのすべてに対する汎用的な秘匿境界ではないことを意味します。

現在の動作はチャネルごとに異なります。

- 一部のチャネルでは、特定の経路で補足コンテキストに対して送信者ベースのフィルタリングがすでに適用されています（たとえばSlackのスレッド初期化、Matrixの返信/スレッド参照）。
- 他のチャネルでは、引用/返信/転送のコンテキストが受信したまま渡されます。

ハードニングの方向性（予定）:

- `contextVisibility: "all"`（デフォルト）は、現在の受信時そのままの動作を維持します。
- `contextVisibility: "allowlist"` は、補足コンテキストを許可リスト内の送信者に限定します。
- `contextVisibility: "allowlist_quote"` は、`allowlist` に加えて、明示的な1件の引用/返信例外を含みます。

このハードニングモデルがすべてのチャネルで一貫して実装されるまでは、サーフェスごとの差異があると考えてください。

![グループメッセージフロー](/images/groups-flow.svg)

次のようにしたい場合...

| 目的 | 設定するもの |
| -------------------------------------------- | ---------------------------------------------------------- |
| すべてのグループを許可しつつ、`@mention`時のみ返信する | `groups: { "*": { requireMention: true } }`                |
| すべてのグループ返信を無効化する | `groupPolicy: "disabled"`                                  |
| 特定のグループのみ | `groups: { "<group-id>": { ... } }`（`"*"` キーなし）         |
| グループ内で自分だけがトリガーできるようにする | `groupPolicy: "allowlist"`, `groupAllowFrom: ["+1555..."]` |

## セッションキー

- グループセッションでは `agent:<agentId>:<channel>:group:<id>` のセッションキーを使用します（ルーム/チャネルでは `agent:<agentId>:<channel>:channel:<id>` を使用します）。
- Telegramのフォーラムトピックでは、グループidに `:topic:<threadId>` が追加され、各トピックが独自のセッションを持ちます。
- ダイレクトチャットではメインセッションを使用します（または設定されていれば送信者ごと）。
- グループセッションではHeartbeatはスキップされます。

<a id="pattern-personal-dms-public-groups-single-agent"></a>

## パターン: 個人DM + 公開グループ（単一エージェント）

はい — 「個人」トラフィックが**DM**で、「公開」トラフィックが**グループ**であれば、これはうまく機能します。

理由: 単一エージェントモードでは、DMは通常 **main** セッションキー（`agent:main:main`）に入り、一方でグループは常に **non-main** セッションキー（`agent:main:<channel>:group:<id>`）を使います。`mode: "non-main"` でサンドボックス化を有効にすると、これらのグループセッションは設定されたサンドボックスバックエンド上で実行され、メインのDMセッションはホスト上に留まります。バックエンドを選ばない場合のデフォルトはDockerです。

これにより、1つのエージェント「脳」（共有ワークスペース + メモリ）を保ちながら、2つの実行姿勢を持てます。

- **DM**: フルツール（ホスト）
- **グループ**: サンドボックス + 制限付きツール

> 本当に分離されたワークスペース/ペルソナ（「個人」と「公開」が決して混ざってはいけない）が必要なら、2つ目のエージェント + バインディングを使ってください。[Multi-Agent Routing](/ja-JP/concepts/multi-agent) を参照してください。

例（DMはホスト上、グループはサンドボックス化 + メッセージング専用ツール）:

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

「ホストアクセスなし」ではなく「グループはフォルダーXだけ見える」にしたい場合は、`workspaceAccess: "none"` を維持しつつ、許可リストにあるパスだけをサンドボックスにマウントします。

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

関連項目:

- 設定キーとデフォルト値: [Gateway設定](/ja-JP/gateway/configuration-reference#agentsdefaultssandbox)
- ツールがブロックされる理由のデバッグ: [Sandbox vs Tool Policy vs Elevated](/ja-JP/gateway/sandbox-vs-tool-policy-vs-elevated)
- バインドマウントの詳細: [Sandboxing](/ja-JP/gateway/sandboxing#custom-bind-mounts)

## 表示ラベル

- UIラベルでは、利用可能な場合 `displayName` を使い、`<channel>:<token>` 形式で表示します。
- `#room` はルーム/チャネル用に予約されています。グループチャットでは `g-<slug>` を使います（小文字、スペースは `-` に変換、`#@+._-` は維持）。

## グループポリシー

チャネルごとに、グループ/ルームメッセージの扱い方を制御します。

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
        "!roomId:example.org": { enabled: true },
        "#alias:example.org": { enabled: true },
      },
    },
  },
}
```

| ポリシー | 動作 |
| ------------- | ------------------------------------------------------------ |
| `"open"`      | グループは許可リストをバイパスします。メンションゲートは引き続き適用されます。 |
| `"disabled"`  | すべてのグループメッセージを完全にブロックします。 |
| `"allowlist"` | 設定された許可リストに一致するグループ/ルームのみ許可します。 |

注:

- `groupPolicy` はメンションゲート（@mentionを要求する仕組み）とは別です。
- WhatsApp/Telegram/Signal/iMessage/Microsoft Teams/Zalo: `groupAllowFrom` を使います（フォールバック: 明示的な `allowFrom`）。
- DMペアリング承認（`*-allowFrom` の保存エントリ）はDMアクセスのみに適用されます。グループ送信者の認可は、引き続きグループ許可リストで明示的に行われます。
- Discord: 許可リストは `channels.discord.guilds.<id>.channels` を使います。
- Slack: 許可リストは `channels.slack.channels` を使います。
- Matrix: 許可リストは `channels.matrix.groups` を使います。ルームIDまたはエイリアスを推奨します。参加済みルーム名の参照はベストエフォートで、解決できない名前は実行時に無視されます。送信者を制限するには `channels.matrix.groupAllowFrom` を使います。ルーム単位の `users` 許可リストもサポートされています。
- グループDMは別途制御されます（`channels.discord.dm.*`, `channels.slack.dm.*`）。
- Telegramの許可リストは、ユーザーID（`"123456789"`, `"telegram:123456789"`, `"tg:123456789"`）またはユーザー名（`"@alice"` または `"alice"`）に一致できます。プレフィックスは大文字小文字を区別しません。
- デフォルトは `groupPolicy: "allowlist"` です。グループ許可リストが空の場合、グループメッセージはブロックされます。
- 実行時の安全性: プロバイダーブロック全体が存在しない場合（`channels.<provider>` がない場合）、グループポリシーは `channels.defaults.groupPolicy` を継承するのではなく、フェイルクローズドなモード（通常は `allowlist`）にフォールバックします。

クイックな考え方（グループメッセージの評価順序）:

1. `groupPolicy`（open/disabled/allowlist）
2. グループ許可リスト（`*.groups`, `*.groupAllowFrom`, チャネル固有の許可リスト）
3. メンションゲート（`requireMention`, `/activation`）

## メンションゲート（デフォルト）

グループメッセージは、グループごとに上書きされない限りメンションを必要とします。デフォルト値は各サブシステムの `*.groups."*"` にあります。

チャネルが返信メタデータをサポートしている場合、botメッセージへの返信は暗黙のメンションとして扱われます。
また、引用メタデータを公開しているチャネルでは、botメッセージの引用も暗黙のメンションとして扱われることがあります。現在の組み込み対象には、Telegram、WhatsApp、Slack、Discord、Microsoft Teams、ZaloUserが含まれます。

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

注:

- `mentionPatterns` は大文字小文字を区別しない安全な正規表現パターンです。無効なパターンや、安全でないネストされた繰り返し形式は無視されます。
- 明示的なメンションを提供するサーフェスでは、それらが引き続き優先されます。パターンはフォールバックです。
- エージェント単位の上書き: `agents.list[].groupChat.mentionPatterns`（複数のエージェントが同じグループを共有する場合に便利です）。
- メンション検出が可能な場合にのみ、メンションゲートが強制されます（ネイティブメンションがあるか、`mentionPatterns` が設定されている場合）。
- Discordのデフォルト値は `channels.discord.guilds."*"` にあります（guild/channelごとに上書き可能）。
- グループ履歴コンテキストは、チャネル間で統一的にラップされ、**保留中のもののみ** を対象にします（メンションゲートのためにスキップされたメッセージ）。グローバルデフォルトには `messages.groupChat.historyLimit` を使い、上書きには `channels.<channel>.historyLimit`（または `channels.<channel>.accounts.*.historyLimit`）を使います。無効化するには `0` を設定してください。

## グループ/チャネルのツール制限（任意）

一部のチャネル設定では、**特定のグループ/ルーム/チャネル内** で利用可能なツールを制限できます。

- `tools`: グループ全体に対するツールの許可/拒否。
- `toolsBySender`: グループ内での送信者ごとの上書き。
  明示的なキープレフィックスを使います:
  `id:<senderId>`, `e164:<phone>`, `username:<handle>`, `name:<displayName>`, および `"*"` ワイルドカード。
  従来のプレフィックスなしキーも引き続き受け入れられますが、`id:` のみとして一致します。

解決順序（最も具体的なものが優先）:

1. グループ/チャネルの `toolsBySender` 一致
2. グループ/チャネルの `tools`
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

注:

- グループ/チャネルのツール制限は、グローバル/エージェントのツールポリシーに加えて適用されます（denyが引き続き優先されます）。
- 一部のチャネルでは、ルーム/チャネルに異なるネスト構造を使います（例: Discord `guilds.*.channels.*`、Slack `channels.*`、Microsoft Teams `teams.*.channels.*`）。

## グループ許可リスト

`channels.whatsapp.groups`、`channels.telegram.groups`、または `channels.imessage.groups` が設定されている場合、そのキーはグループ許可リストとして機能します。すべてのグループを許可しつつ、デフォルトのメンション動作も設定したい場合は `"*"` を使ってください。

よくある混乱: DMペアリング承認は、グループ認可とは同じではありません。
DMペアリングをサポートするチャネルでは、ペアリングストアが解除するのはDMのみです。グループコマンドには、引き続き `groupAllowFrom` や、そのチャネルで文書化されている設定フォールバックなどの、設定許可リストからの明示的なグループ送信者認可が必要です。

一般的な意図（コピー&ペースト用）:

1. すべてのグループ返信を無効化する

```json5
{
  channels: { whatsapp: { groupPolicy: "disabled" } },
}
```

2. 特定のグループのみ許可する（WhatsApp）

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

3. すべてのグループを許可するが、メンションを必須にする（明示的）

```json5
{
  channels: {
    whatsapp: {
      groups: { "*": { requireMention: true } },
    },
  },
}
```

4. オーナーだけがグループ内でトリガーできるようにする（WhatsApp）

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

## Activation（オーナー専用）

グループオーナーは、グループごとのアクティベーションを切り替えられます。

- `/activation mention`
- `/activation always`

オーナーは `channels.whatsapp.allowFrom` によって判定されます（未設定時はbot自身のE.164）。コマンドは単独メッセージとして送信してください。現在、他のサーフェスでは `/activation` は無視されます。

## コンテキストフィールド

グループの受信ペイロードでは次が設定されます。

- `ChatType=group`
- `GroupSubject`（既知の場合）
- `GroupMembers`（既知の場合）
- `WasMentioned`（メンションゲートの結果）
- Telegramのフォーラムトピックには、さらに `MessageThreadId` と `IsForum` が含まれます。

チャネル固有の注記:

- BlueBubblesでは、`GroupMembers` を設定する前に、名前のないmacOSグループ参加者をローカルのContactsデータベースから補完することがあります。これはデフォルトではオフで、通常のグループゲートを通過した後にのみ実行されます。

エージェントのシステムプロンプトには、新しいグループセッションの最初のターンでグループ向けのイントロが含まれます。これにより、モデルに対して、人間のように応答すること、Markdownの表を避けること、空行を最小限にすること、通常のチャット間隔に従うこと、そして文字どおりの `\n` シーケンスを入力しないことが促されます。

## iMessage固有事項

- ルーティングや許可リストには `chat_id:<id>` を優先して使ってください。
- チャット一覧: `imsg chats --limit 20`
- グループ返信は常に同じ `chat_id` に返されます。

## WhatsAppシステムプロンプト

グループおよびダイレクトのプロンプト解決、ワイルドカードの動作、アカウント上書きの意味論を含む、正式なWhatsAppシステムプロンプトルールについては [WhatsApp](/ja-JP/channels/whatsapp#system-prompts) を参照してください。

## WhatsApp固有事項

WhatsApp専用の動作（履歴注入、メンション処理の詳細）については [グループメッセージ](/ja-JP/channels/group-messages) を参照してください。
