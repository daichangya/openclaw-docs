---
read_when:
    - Feishu/Larkボットを接続したいとき
    - Feishuチャンネルを設定しているとき
summary: Feishuボットの概要、機能、設定
title: Feishu
x-i18n:
    generated_at: "2026-04-05T12:35:53Z"
    model: gpt-5.4
    provider: openai
    source_hash: 4e39b6dfe3a3aa4ebbdb992975e570e4f1b5e79f3b400a555fc373a0d1889952
    source_path: channels/feishu.md
    workflow: 15
---

# Feishuボット

Feishu（Lark）は、企業でメッセージングやコラボレーションに使われるチームチャットプラットフォームです。このプラグインは、プラットフォームのWebSocketイベントサブスクリプションを使用してOpenClawをFeishu/Larkボットに接続し、公開Webhook URLを公開せずにメッセージを受信できるようにします。

---

## バンドル済みプラグイン

Feishuは現在のOpenClawリリースにバンドルされているため、別途プラグインをインストールする必要はありません。

バンドル済みFeishuを含まない古いビルドまたはカスタムインストールを使用している場合は、手動でインストールしてください。

```bash
openclaw plugins install @openclaw/feishu
```

---

## クイックスタート

Feishuチャンネルを追加する方法は2つあります。

### 方法1: オンボーディング（推奨）

OpenClawをインストールしたばかりなら、オンボーディングを実行します。

```bash
openclaw onboard
```

ウィザードでは次の手順を案内します。

1. Feishuアプリを作成し、認証情報を収集する
2. OpenClawでアプリ認証情報を設定する
3. Gatewayを起動する

✅ **設定後**、Gatewayステータスを確認します。

- `openclaw gateway status`
- `openclaw logs --follow`

### 方法2: CLIセットアップ

初回インストールをすでに完了している場合は、CLI経由でチャンネルを追加します。

```bash
openclaw channels add
```

**Feishu**を選択し、App IDとApp Secretを入力します。

✅ **設定後**、Gatewayを管理します。

- `openclaw gateway status`
- `openclaw gateway restart`
- `openclaw logs --follow`

---

## ステップ1: Feishuアプリを作成する

### 1. Feishu Open Platformを開く

[Feishu Open Platform](https://open.feishu.cn/app)にアクセスしてサインインします。

Lark（グローバル）テナントは[https://open.larksuite.com/app](https://open.larksuite.com/app)を使用し、Feishu設定で`domain: "lark"`を設定してください。

### 2. アプリを作成する

1. **Create enterprise app**をクリックします
2. アプリ名と説明を入力します
3. アプリアイコンを選択します

![Create enterprise app](/images/feishu-step2-create-app.png)

### 3. 認証情報をコピーする

**Credentials & Basic Info**から、次をコピーします。

- **App ID**（形式: `cli_xxx`）
- **App Secret**

❗ **重要:** App Secretは非公開にしてください。

![Get credentials](/images/feishu-step3-credentials.png)

### 4. 権限を設定する

**Permissions**で**Batch import**をクリックし、以下を貼り付けます。

```json
{
  "scopes": {
    "tenant": [
      "aily:file:read",
      "aily:file:write",
      "application:application.app_message_stats.overview:readonly",
      "application:application:self_manage",
      "application:bot.menu:write",
      "cardkit:card:read",
      "cardkit:card:write",
      "contact:user.employee_id:readonly",
      "corehr:file:download",
      "event:ip_list",
      "im:chat.access_event.bot_p2p_chat:read",
      "im:chat.members:bot_access",
      "im:message",
      "im:message.group_at_msg:readonly",
      "im:message.p2p_msg:readonly",
      "im:message:readonly",
      "im:message:send_as_bot",
      "im:resource"
    ],
    "user": ["aily:file:read", "aily:file:write", "im:chat.access_event.bot_p2p_chat:read"]
  }
}
```

![Configure permissions](/images/feishu-step4-permissions.png)

### 5. ボット機能を有効にする

**App Capability** > **Bot**で次を行います。

1. ボット機能を有効にする
2. ボット名を設定する

![Enable bot capability](/images/feishu-step5-bot-capability.png)

### 6. イベントサブスクリプションを設定する

⚠️ **重要:** イベントサブスクリプションを設定する前に、以下を確認してください。

1. Feishuに対してすでに`openclaw channels add`を実行している
2. Gatewayが実行中である（`openclaw gateway status`）

**Event Subscription**で次を行います。

1. **Use long connection to receive events**（WebSocket）を選択する
2. イベント`im.message.receive_v1`を追加する
3. （任意）Driveコメントワークフロー用に、`drive.notice.comment_add_v1`も追加する

⚠️ Gatewayが実行されていない場合、長期接続の設定は保存に失敗する可能性があります。

![Configure event subscription](/images/feishu-step6-event-subscription.png)

### 7. アプリを公開する

1. **Version Management & Release**でバージョンを作成する
2. 審査に提出して公開する
3. 管理者の承認を待つ（通常、企業アプリは自動承認されます）

---

## ステップ2: OpenClawを設定する

### ウィザードで設定する（推奨）

```bash
openclaw channels add
```

**Feishu**を選択し、App IDとApp Secretを貼り付けます。

### 設定ファイルで設定する

`~/.openclaw/openclaw.json`を編集します。

```json5
{
  channels: {
    feishu: {
      enabled: true,
      dmPolicy: "pairing",
      accounts: {
        main: {
          appId: "cli_xxx",
          appSecret: "xxx",
          name: "My AI assistant",
        },
      },
    },
  },
}
```

`connectionMode: "webhook"`を使用する場合は、`verificationToken`と`encryptKey`の両方を設定してください。Feishu webhookサーバーはデフォルトで`127.0.0.1`にバインドされます。別のバインドアドレスが意図的に必要な場合にのみ`webhookHost`を設定してください。

#### Verification TokenとEncrypt Key（webhookモード）

webhookモードを使用する場合は、設定で`channels.feishu.verificationToken`と`channels.feishu.encryptKey`の両方を設定してください。値を取得するには、次の手順を実行します。

1. Feishu Open Platformでアプリを開く
2. **Development** → **Events & Callbacks**（开发配置 → 事件与回调）に移動する
3. **Encryption**タブ（加密策略）を開く
4. **Verification Token**と**Encrypt Key**をコピーする

以下のスクリーンショットは、**Verification Token**の場所を示しています。**Encrypt Key**は同じ**Encryption**セクションに表示されます。

![Verification Token location](/images/feishu-verification-token.png)

### 環境変数で設定する

```bash
export FEISHU_APP_ID="cli_xxx"
export FEISHU_APP_SECRET="xxx"
```

### Lark（グローバル）ドメイン

テナントがLark（国際版）上にある場合は、ドメインを`lark`（または完全なドメイン文字列）に設定してください。`channels.feishu.domain`またはアカウントごと（`channels.feishu.accounts.<id>.domain`）に設定できます。

```json5
{
  channels: {
    feishu: {
      domain: "lark",
      accounts: {
        main: {
          appId: "cli_xxx",
          appSecret: "xxx",
        },
      },
    },
  },
}
```

### クォータ最適化フラグ

2つの任意フラグでFeishu APIの使用量を減らせます。

- `typingIndicator`（デフォルト`true`）: `false`の場合、入力中リアクションの呼び出しをスキップします。
- `resolveSenderNames`（デフォルト`true`）: `false`の場合、送信者プロファイル参照の呼び出しをスキップします。

トップレベルまたはアカウントごとに設定します。

```json5
{
  channels: {
    feishu: {
      typingIndicator: false,
      resolveSenderNames: false,
      accounts: {
        main: {
          appId: "cli_xxx",
          appSecret: "xxx",
          typingIndicator: true,
          resolveSenderNames: false,
        },
      },
    },
  },
}
```

---

## ステップ3: 起動してテストする

### 1. Gatewayを起動する

```bash
openclaw gateway
```

### 2. テストメッセージを送信する

Feishuでボットを見つけてメッセージを送信します。

### 3. ペアリングを承認する

デフォルトでは、ボットはペアリングコードを返信します。次のように承認してください。

```bash
openclaw pairing approve feishu <CODE>
```

承認後は通常どおりチャットできます。

---

## 概要

- **Feishuボットチャンネル**: Gatewayによって管理されるFeishuボット
- **決定論的ルーティング**: 返信は常にFeishuに戻る
- **セッション分離**: DMはメインセッションを共有し、グループは分離される
- **WebSocket接続**: Feishu SDKによる長期接続で、公開URLは不要

---

## アクセス制御

### ダイレクトメッセージ

- **デフォルト**: `dmPolicy: "pairing"`（不明なユーザーにはペアリングコードを返す）
- **ペアリングを承認する**:

  ```bash
  openclaw pairing list feishu
  openclaw pairing approve feishu <CODE>
  ```

- **許可リストモード**: 許可されたOpen IDで`channels.feishu.allowFrom`を設定する

### グループチャット

**1. グループポリシー**（`channels.feishu.groupPolicy`）:

- `"open"` = グループ内の全員を許可
- `"allowlist"` = `groupAllowFrom`のみ許可
- `"disabled"` = グループメッセージを無効化

デフォルト: `allowlist`

**2. メンション要件**（`channels.feishu.requireMention`、`channels.feishu.groups.<chat_id>.requireMention`で上書き可能）:

- 明示的に`true` = @mentionが必要
- 明示的に`false` = メンションなしで応答
- 未設定かつ`groupPolicy: "open"`の場合 = デフォルトで`false`
- 未設定かつ`groupPolicy`が`"open"`でない場合 = デフォルトで`true`

---

## グループ設定例

### すべてのグループを許可し、@mention不要にする（openグループのデフォルト）

```json5
{
  channels: {
    feishu: {
      groupPolicy: "open",
    },
  },
}
```

### すべてのグループを許可するが、引き続き@mentionを必須にする

```json5
{
  channels: {
    feishu: {
      groupPolicy: "open",
      requireMention: true,
    },
  },
}
```

### 特定のグループのみ許可する

```json5
{
  channels: {
    feishu: {
      groupPolicy: "allowlist",
      // FeishuのグループID（chat_id）は oc_xxx のようになります
      groupAllowFrom: ["oc_xxx", "oc_yyy"],
    },
  },
}
```

### グループ内でメッセージを送れる送信者を制限する（送信者許可リスト）

グループ自体を許可することに加えて、そのグループ内の**すべてのメッセージ**は送信者のopen_idによって制御されます。`groups.<chat_id>.allowFrom`に列挙されたユーザーだけがメッセージを処理され、他のメンバーからのメッセージは無視されます（これは`/reset`や`/new`のような制御コマンドだけでなく、送信者レベル全体の制御です）。

```json5
{
  channels: {
    feishu: {
      groupPolicy: "allowlist",
      groupAllowFrom: ["oc_xxx"],
      groups: {
        oc_xxx: {
          // FeishuのユーザーID（open_id）は ou_xxx のようになります
          allowFrom: ["ou_user1", "ou_user2"],
        },
      },
    },
  },
}
```

---

<a id="get-groupuser-ids"></a>

## グループ/ユーザーIDを取得する

### グループID（chat_id）

グループIDは`oc_xxx`のようになります。

**方法1（推奨）**

1. Gatewayを起動し、グループ内でボットに@mentionする
2. `openclaw logs --follow`を実行し、`chat_id`を探す

**方法2**

Feishu APIデバッガーを使ってグループチャットを一覧表示します。

### ユーザーID（open_id）

ユーザーIDは`ou_xxx`のようになります。

**方法1（推奨）**

1. Gatewayを起動し、ボットにDMする
2. `openclaw logs --follow`を実行し、`open_id`を探す

**方法2**

ペアリング要求でユーザーOpen IDを確認します。

```bash
openclaw pairing list feishu
```

---

## よく使うコマンド

| コマンド | 説明 |
| --------- | ----------------- |
| `/status` | ボットのステータスを表示 |
| `/reset`  | セッションをリセット |
| `/model`  | モデルを表示/切り替え |

> 注: Feishuはまだネイティブのコマンドメニューをサポートしていないため、コマンドはテキストとして送信する必要があります。

## Gateway管理コマンド

| コマンド | 説明 |
| -------------------------- | ----------------------------- |
| `openclaw gateway status`  | Gatewayステータスを表示 |
| `openclaw gateway install` | Gatewayサービスをインストール/起動 |
| `openclaw gateway stop`    | Gatewayサービスを停止 |
| `openclaw gateway restart` | Gatewayサービスを再起動 |
| `openclaw logs --follow`   | Gatewayログを追跡 |

---

## トラブルシューティング

### グループチャットでボットが応答しない

1. ボットがグループに追加されていることを確認する
2. ボットに@mentionしていることを確認する（デフォルト動作）
3. `groupPolicy`が`"disabled"`に設定されていないことを確認する
4. ログを確認する: `openclaw logs --follow`

### ボットがメッセージを受信しない

1. アプリが公開され、承認されていることを確認する
2. イベントサブスクリプションに`im.message.receive_v1`が含まれていることを確認する
3. **long connection**が有効になっていることを確認する
4. アプリ権限が完全であることを確認する
5. Gatewayが実行中であることを確認する: `openclaw gateway status`
6. ログを確認する: `openclaw logs --follow`

### App Secretの漏えい

1. Feishu Open PlatformでApp Secretをリセットする
2. 設定内のApp Secretを更新する
3. Gatewayを再起動する

### メッセージ送信失敗

1. アプリに`im:message:send_as_bot`権限があることを確認する
2. アプリが公開されていることを確認する
3. 詳細なエラーについてログを確認する

---

## 高度な設定

### 複数アカウント

```json5
{
  channels: {
    feishu: {
      defaultAccount: "main",
      accounts: {
        main: {
          appId: "cli_xxx",
          appSecret: "xxx",
          name: "Primary bot",
        },
        backup: {
          appId: "cli_yyy",
          appSecret: "yyy",
          name: "Backup bot",
          enabled: false,
        },
      },
    },
  },
}
```

`defaultAccount`は、送信APIが`accountId`を明示的に指定しない場合に、どのFeishuアカウントを使うかを制御します。

### メッセージ制限

- `textChunkLimit`: 送信テキストのチャンクサイズ（デフォルト: 2000文字）
- `mediaMaxMb`: メディアのアップロード/ダウンロード制限（デフォルト: 30MB）

### ストリーミング

Feishuは、インタラクティブカードによるストリーミング返信をサポートしています。有効にすると、ボットはテキスト生成中にカードを更新します。

```json5
{
  channels: {
    feishu: {
      streaming: true, // ストリーミングカード出力を有効化（デフォルト true）
      blockStreaming: true, // ブロックレベルストリーミングを有効化（デフォルト true）
    },
  },
}
```

`streaming: false`に設定すると、全文の返信が完成するまで待ってから送信します。

### ACPセッション

Feishuは以下に対してACPをサポートしています。

- DM
- グループのトピック会話

Feishu ACPはテキストコマンド駆動です。ネイティブのスラッシュコマンドメニューはないため、会話内で直接`/acp ...`メッセージを使用してください。

#### 永続的なACPバインディング

トップレベルの型付きACPバインディングを使って、FeishuのDMまたはトピック会話を永続的なACPセッションに固定します。

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
    ],
  },
  bindings: [
    {
      type: "acp",
      agentId: "codex",
      match: {
        channel: "feishu",
        accountId: "default",
        peer: { kind: "direct", id: "ou_1234567890" },
      },
    },
    {
      type: "acp",
      agentId: "codex",
      match: {
        channel: "feishu",
        accountId: "default",
        peer: { kind: "group", id: "oc_group_chat:topic:om_topic_root" },
      },
      acp: { label: "codex-feishu-topic" },
    },
  ],
}
```

#### チャットからスレッドに紐づくACPを起動する

FeishuのDMまたはトピック会話では、その場でACPセッションを起動してバインドできます。

```text
/acp spawn codex --thread here
```

注:

- `--thread here`はDMとFeishuトピックで動作します。
- バインドされたDM/トピック内の後続メッセージは、そのACPセッションへ直接ルーティングされます。
- v1では、一般的な非トピックのグループチャットは対象にしていません。

### マルチエージェントルーティング

`bindings`を使用して、FeishuのDMまたはグループを別々のエージェントへルーティングします。

```json5
{
  agents: {
    list: [
      { id: "main" },
      {
        id: "clawd-fan",
        workspace: "/home/user/clawd-fan",
        agentDir: "/home/user/.openclaw/agents/clawd-fan/agent",
      },
      {
        id: "clawd-xi",
        workspace: "/home/user/clawd-xi",
        agentDir: "/home/user/.openclaw/agents/clawd-xi/agent",
      },
    ],
  },
  bindings: [
    {
      agentId: "main",
      match: {
        channel: "feishu",
        peer: { kind: "direct", id: "ou_xxx" },
      },
    },
    {
      agentId: "clawd-fan",
      match: {
        channel: "feishu",
        peer: { kind: "direct", id: "ou_yyy" },
      },
    },
    {
      agentId: "clawd-xi",
      match: {
        channel: "feishu",
        peer: { kind: "group", id: "oc_zzz" },
      },
    },
  ],
}
```

ルーティングフィールド:

- `match.channel`: `"feishu"`
- `match.peer.kind`: `"direct"`または`"group"`
- `match.peer.id`: ユーザーOpen ID（`ou_xxx`）またはグループID（`oc_xxx`）

参照方法については、[グループ/ユーザーIDを取得する](#get-groupuser-ids)を参照してください。

---

## 設定リファレンス

完全な設定: [Gateway configuration](/gateway/configuration)

主なオプション:

| 設定 | 説明 | デフォルト |
| ------------------------------------------------- | --------------------------------------- | ---------------- |
| `channels.feishu.enabled`                         | チャンネルを有効化/無効化 | `true` |
| `channels.feishu.domain`                          | APIドメイン（`feishu`または`lark`） | `feishu` |
| `channels.feishu.connectionMode`                  | イベント転送モード | `websocket` |
| `channels.feishu.defaultAccount`                  | 送信ルーティング用のデフォルトアカウントID | `default` |
| `channels.feishu.verificationToken`               | webhookモードで必須 | - |
| `channels.feishu.encryptKey`                      | webhookモードで必須 | - |
| `channels.feishu.webhookPath`                     | Webhookルートパス | `/feishu/events` |
| `channels.feishu.webhookHost`                     | Webhookバインドホスト | `127.0.0.1` |
| `channels.feishu.webhookPort`                     | Webhookバインドポート | `3000` |
| `channels.feishu.accounts.<id>.appId`             | App ID | - |
| `channels.feishu.accounts.<id>.appSecret`         | App Secret | - |
| `channels.feishu.accounts.<id>.domain`            | アカウントごとのAPIドメイン上書き | `feishu` |
| `channels.feishu.dmPolicy`                        | DMポリシー | `pairing` |
| `channels.feishu.allowFrom`                       | DM許可リスト（open_id一覧） | - |
| `channels.feishu.groupPolicy`                     | グループポリシー | `allowlist` |
| `channels.feishu.groupAllowFrom`                  | グループ許可リスト | - |
| `channels.feishu.requireMention`                  | デフォルトで@mention必須 | conditional |
| `channels.feishu.groups.<chat_id>.requireMention` | グループごとの@mention必須上書き | inherited |
| `channels.feishu.groups.<chat_id>.enabled`        | グループを有効化 | `true` |
| `channels.feishu.textChunkLimit`                  | メッセージチャンクサイズ | `2000` |
| `channels.feishu.mediaMaxMb`                      | メディアサイズ上限 | `30` |
| `channels.feishu.streaming`                       | ストリーミングカード出力を有効化 | `true` |
| `channels.feishu.blockStreaming`                  | ブロックストリーミングを有効化 | `true` |

---

## dmPolicyリファレンス

| 値 | 動作 |
| ------------- | --------------------------------------------------------------- |
| `"pairing"`   | **デフォルト。** 不明なユーザーにペアリングコードを返し、承認が必要 |
| `"allowlist"` | `allowFrom`内のユーザーのみチャット可能 |
| `"open"`      | すべてのユーザーを許可（`allowFrom`に`"*"`が必要） |
| `"disabled"`  | DMを無効化 |

---

## サポートされるメッセージタイプ

### 受信

- ✅ テキスト
- ✅ リッチテキスト（post）
- ✅ 画像
- ✅ ファイル
- ✅ 音声
- ✅ 動画/メディア
- ✅ ステッカー

### 送信

- ✅ テキスト
- ✅ 画像
- ✅ ファイル
- ✅ 音声
- ✅ 動画/メディア
- ✅ インタラクティブカード
- ⚠️ リッチテキスト（post形式の書式設定とカード。任意のFeishuオーサリング機能ではありません）

### スレッドと返信

- ✅ インライン返信
- ✅ Feishuが`reply_in_thread`を公開するトピックスレッド返信
- ✅ メディア返信は、スレッド/トピックメッセージへの返信時にもスレッド認識を維持

## Driveコメント

Feishuでは、誰かがFeishu Driveドキュメント（Docs、Sheetsなど）にコメントを追加したときに、エージェントを起動できます。エージェントはコメントテキスト、ドキュメントコンテキスト、コメントスレッドを受け取り、スレッド内で応答したりドキュメントを編集したりできます。

要件:

- Feishuアプリのイベントサブスクリプション設定で`drive.notice.comment_add_v1`を購読する
  （既存の`im.message.receive_v1`とあわせて）
- Driveツールはデフォルトで有効です。`channels.feishu.tools.drive: false`で無効化できます

`feishu_drive`ツールは次のコメントアクションを公開します。

| アクション | 説明 |
| ---------------------- | ----------------------------------- |
| `list_comments`        | ドキュメント上のコメントを一覧表示 |
| `list_comment_replies` | コメントスレッド内の返信を一覧表示 |
| `add_comment`          | 新しいトップレベルコメントを追加 |
| `reply_comment`        | 既存のコメントスレッドに返信 |

エージェントがDriveコメントイベントを処理するとき、次を受け取ります。

- コメントテキストと送信者
- ドキュメントメタデータ（タイトル、種類、URL）
- スレッド内返信のためのコメントスレッドコンテキスト

ドキュメント編集後、エージェントにはコメント投稿者へ通知するために`feishu_drive.reply_comment`を使い、その後で重複送信を避けるために正確なサイレントトークン`NO_REPLY` / `no_reply`を出力するよう案内されます。

## ランタイムアクションサーフェス

Feishuは現在、次のランタイムアクションを公開しています。

- `send`
- `read`
- `edit`
- `thread-reply`
- `pin`
- `list-pins`
- `unpin`
- `member-info`
- `channel-info`
- `channel-list`
- リアクションが設定で有効な場合の`react`と`reactions`
- `feishu_drive`コメントアクション: `list_comments`、`list_comment_replies`、`add_comment`、`reply_comment`

## 関連

- [Channels Overview](/channels) — サポートされるすべてのチャンネル
- [Pairing](/channels/pairing) — DM認証とペアリングフロー
- [Groups](/channels/groups) — グループチャットの挙動とメンション制御
- [Channel Routing](/channels/channel-routing) — メッセージのセッションルーティング
- [Security](/gateway/security) — アクセスモデルとハードニング
