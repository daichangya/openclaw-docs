---
read_when:
    - Feishu/Larkボットを接続したい場合
    - Feishuチャンネルを設定しています
summary: Feishuボットの概要、機能、および設定
title: Feishu
x-i18n:
    generated_at: "2026-04-25T13:40:57Z"
    model: gpt-5.4
    provider: openai
    source_hash: 2b9cebcedf05a517b03a15ae306cece1a3c07f772c48c54b7ece05ef892d05d2
    source_path: channels/feishu.md
    workflow: 15
---

# Feishu / Lark

Feishu/Larkは、チームがチャットし、ドキュメントを共有し、カレンダーを管理し、共同で作業を進めるためのオールインワンのコラボレーションプラットフォームです。

**ステータス:** ボットのDMとグループチャット向けに本番利用可能です。WebSocketがデフォルトモードで、Webhookモードは任意です。

---

## クイックスタート

> **OpenClaw 2026.4.25以降が必要です。** 確認するには `openclaw --version` を実行してください。アップグレードするには `openclaw update` を使用します。

<Steps>
  <Step title="チャンネル設定ウィザードを実行する">
  ```bash
  openclaw channels login --channel feishu
  ```
  Feishu/LarkモバイルアプリでQRコードをスキャンすると、Feishu/Larkボットが自動的に作成されます。
  </Step>
  
  <Step title="設定完了後、変更を適用するためにGatewayを再起動する">
  ```bash
  openclaw gateway restart
  ```
  </Step>
</Steps>

---

## アクセス制御

### ダイレクトメッセージ

ボットにDMを送れるユーザーを制御するには、`dmPolicy` を設定します。

- `"pairing"` — 不明なユーザーにはペアリングコードが送信されます。CLIで承認してください
- `"allowlist"` — `allowFrom` に記載されたユーザーのみがチャットできます（デフォルト: ボット所有者のみ）
- `"open"` — すべてのユーザーを許可します
- `"disabled"` — すべてのDMを無効にします

**ペアリングリクエストを承認する:**

```bash
openclaw pairing list feishu
openclaw pairing approve feishu <CODE>
```

### グループチャット

**グループポリシー** (`channels.feishu.groupPolicy`):

| 値            | 動作                                         |
| ------------- | -------------------------------------------- |
| `"open"`      | グループ内のすべてのメッセージに応答します   |
| `"allowlist"` | `groupAllowFrom` 内のグループにのみ応答します |
| `"disabled"`  | すべてのグループメッセージを無効にします     |

デフォルト: `allowlist`

**メンション必須** (`channels.feishu.requireMention`):

- `true` — @メンションを必須にします（デフォルト）
- `false` — @メンションなしで応答します
- グループごとの上書き: `channels.feishu.groups.<chat_id>.requireMention`

---

## グループ設定の例

### すべてのグループを許可し、@メンションは不要

```json5
{
  channels: {
    feishu: {
      groupPolicy: "open",
    },
  },
}
```

### すべてのグループを許可し、@メンションは引き続き必須

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

### 特定のグループのみを許可

```json5
{
  channels: {
    feishu: {
      groupPolicy: "allowlist",
      // グループIDは次のような形式です: oc_xxx
      groupAllowFrom: ["oc_xxx", "oc_yyy"],
    },
  },
}
```

### グループ内の送信者を制限

```json5
{
  channels: {
    feishu: {
      groupPolicy: "allowlist",
      groupAllowFrom: ["oc_xxx"],
      groups: {
        oc_xxx: {
          // ユーザーのopen_idは次のような形式です: ou_xxx
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

### グループID (`chat_id`, 形式: `oc_xxx`)

Feishu/Larkでグループを開き、右上のメニューアイコンをクリックして **Settings** に移動します。設定ページにグループID (`chat_id`) が表示されます。

![Get Group ID](/images/feishu-get-group-id.png)

### ユーザーID (`open_id`, 形式: `ou_xxx`)

Gatewayを起動し、ボットにDMを送信してから、ログを確認します。

```bash
openclaw logs --follow
```

ログ出力内の `open_id` を探してください。保留中のペアリングリクエストを確認することもできます。

```bash
openclaw pairing list feishu
```

---

## よく使うコマンド

| コマンド   | 説明                         |
| ---------- | ---------------------------- |
| `/status`  | ボットのステータスを表示     |
| `/reset`   | 現在のセッションをリセット   |
| `/model`   | AIモデルを表示または切り替え |

> Feishu/Larkはネイティブのスラッシュコマンドメニューをサポートしていないため、これらはプレーンテキストメッセージとして送信してください。

---

## トラブルシューティング

### グループチャットでボットが応答しない

1. ボットがグループに追加されていることを確認します
2. ボットに@メンションしていることを確認します（デフォルトで必須）
3. `groupPolicy` が `"disabled"` ではないことを確認します
4. ログを確認します: `openclaw logs --follow`

### ボットがメッセージを受信しない

1. ボットがFeishu Open Platform / Lark Developerで公開・承認されていることを確認します
2. イベントサブスクリプションに `im.message.receive_v1` が含まれていることを確認します
3. **persistent connection** (WebSocket) が選択されていることを確認します
4. 必要なすべての権限スコープが付与されていることを確認します
5. Gatewayが実行中であることを確認します: `openclaw gateway status`
6. ログを確認します: `openclaw logs --follow`

### App Secretが漏洩した

1. Feishu Open Platform / Lark DeveloperでApp Secretをリセットします
2. 設定内の値を更新します
3. Gatewayを再起動します: `openclaw gateway restart`

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

`defaultAccount` は、送信APIで `accountId` が指定されていない場合に使用されるアカウントを制御します。

### メッセージ制限

- `textChunkLimit` — 送信テキストのチャンクサイズ（デフォルト: `2000` 文字）
- `mediaMaxMb` — メディアのアップロード/ダウンロード上限（デフォルト: `30` MB）

### ストリーミング

Feishu/Larkはインタラクティブカードによるストリーミング返信をサポートしています。有効にすると、ボットはテキスト生成中にカードをリアルタイムで更新します。

```json5
{
  channels: {
    feishu: {
      streaming: true, // ストリーミングカード出力を有効化（デフォルト: true）
      blockStreaming: true, // ブロック単位のストリーミングを有効化（デフォルト: true）
    },
  },
}
```

`streaming: false` に設定すると、完全な返信を1つのメッセージで送信します。

### クォータ最適化

2つの任意フラグを使ってFeishu/Lark API呼び出し回数を削減します。

- `typingIndicator` (デフォルト `true`): `false` に設定すると、入力中リアクションの呼び出しを省略します
- `resolveSenderNames` (デフォルト `true`): `false` に設定すると、送信者プロフィールの取得を省略します

```json5
{
  channels: {
    feishu: {
      typingIndicator: false,
      resolveSenderNames: false,
    },
  },
}
```

### ACPセッション

Feishu/LarkはDMとグループスレッドメッセージでACPをサポートしています。Feishu/Lark ACPはテキストコマンド駆動で、ネイティブのスラッシュコマンドメニューはないため、会話内で `/acp ...` メッセージを直接使用してください。

#### 永続的なACPバインディング

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

#### チャットからACPを起動する

Feishu/LarkのDMまたはスレッド内で:

```text
/acp spawn codex --thread here
```

`--thread here` はDMとFeishu/Larkスレッドメッセージで動作します。その後のメッセージは、バインドされた会話内でそのACPセッションに直接ルーティングされます。

### マルチエージェントルーティング

`bindings` を使って、Feishu/LarkのDMやグループを異なるエージェントにルーティングします。

```json5
{
  agents: {
    list: [
      { id: "main" },
      { id: "agent-a", workspace: "/home/user/agent-a" },
      { id: "agent-b", workspace: "/home/user/agent-b" },
    ],
  },
  bindings: [
    {
      agentId: "agent-a",
      match: {
        channel: "feishu",
        peer: { kind: "direct", id: "ou_xxx" },
      },
    },
    {
      agentId: "agent-b",
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
- `match.peer.kind`: `"direct"` (DM) または `"group"` (グループチャット)
- `match.peer.id`: ユーザーOpen ID (`ou_xxx`) またはグループID (`oc_xxx`)

確認方法のヒントについては、[グループ/ユーザーIDを取得する](#get-groupuser-ids) を参照してください。

---

## 設定リファレンス

完全な設定: [Gateway configuration](/ja-JP/gateway/configuration)

| 設定                                              | 説明                                       | デフォルト       |
| ------------------------------------------------- | ------------------------------------------ | ---------------- |
| `channels.feishu.enabled`                         | チャンネルを有効化/無効化                  | `true`           |
| `channels.feishu.domain`                          | APIドメイン (`feishu` または `lark`)       | `feishu`         |
| `channels.feishu.connectionMode`                  | イベント転送方式 (`websocket` または `webhook`) | `websocket`      |
| `channels.feishu.defaultAccount`                  | 送信ルーティング用のデフォルトアカウント   | `default`        |
| `channels.feishu.verificationToken`               | webhookモードで必須                        | —                |
| `channels.feishu.encryptKey`                      | webhookモードで必須                        | —                |
| `channels.feishu.webhookPath`                     | Webhookルートパス                          | `/feishu/events` |
| `channels.feishu.webhookHost`                     | Webhookバインドホスト                      | `127.0.0.1`      |
| `channels.feishu.webhookPort`                     | Webhookバインドポート                      | `3000`           |
| `channels.feishu.accounts.<id>.appId`             | App ID                                     | —                |
| `channels.feishu.accounts.<id>.appSecret`         | App Secret                                 | —                |
| `channels.feishu.accounts.<id>.domain`            | アカウントごとのドメイン上書き             | `feishu`         |
| `channels.feishu.dmPolicy`                        | DMポリシー                                 | `allowlist`      |
| `channels.feishu.allowFrom`                       | DM許可リスト (`open_id` の一覧)            | [BotOwnerId]     |
| `channels.feishu.groupPolicy`                     | グループポリシー                           | `allowlist`      |
| `channels.feishu.groupAllowFrom`                  | グループ許可リスト                         | —                |
| `channels.feishu.requireMention`                  | グループで@メンションを必須にする          | `true`           |
| `channels.feishu.groups.<chat_id>.requireMention` | グループごとの@メンション上書き            | 継承             |
| `channels.feishu.groups.<chat_id>.enabled`        | 特定のグループを有効化/無効化              | `true`           |
| `channels.feishu.textChunkLimit`                  | メッセージチャンクサイズ                   | `2000`           |
| `channels.feishu.mediaMaxMb`                      | メディアサイズ上限                         | `30`             |
| `channels.feishu.streaming`                       | ストリーミングカード出力                   | `true`           |
| `channels.feishu.blockStreaming`                  | ブロック単位のストリーミング               | `true`           |
| `channels.feishu.typingIndicator`                 | 入力中リアクションを送信                   | `true`           |
| `channels.feishu.resolveSenderNames`              | 送信者の表示名を解決                       | `true`           |

---

## サポートされるメッセージタイプ

### 受信

- ✅ テキスト
- ✅ リッチテキスト (post)
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
- ✅ インタラクティブカード（ストリーミング更新を含む）
- ⚠️ リッチテキスト（post形式のフォーマット。Feishu/Larkの完全な作成機能には対応していません）

ネイティブのFeishu/Lark音声バブルは、Feishuの `audio` メッセージタイプを使用し、Ogg/Opusアップロードメディア（`file_type: "opus"`）が必要です。既存の `.opus` および `.ogg` メディアは、そのままネイティブ音声として送信されます。MP3/WAV/M4Aやその他の一般的な音声形式は、返信で音声配信が要求された場合（`audioAsVoice` / メッセージツール `asVoice`、TTS音声メモ返信を含む）に限り、`ffmpeg` を使って48kHzのOgg/Opusへトランスコードされます。通常のMP3添付は通常のファイルのままです。`ffmpeg` が存在しない場合や変換に失敗した場合、OpenClawはファイル添付にフォールバックし、その理由をログに記録します。

### スレッドと返信

- ✅ インライン返信
- ✅ スレッド返信
- ✅ メディア返信は、スレッドメッセージへの返信時にもスレッド対応を維持します

`groupSessionScope: "group_topic"` および `"group_topic_sender"` では、ネイティブのFeishu/Larkトピックグループは、イベント `thread_id` (`omt_*`) を正規のトピックセッションキーとして使用します。OpenClawがスレッドに変換する通常のグループ返信は、引き続き返信ルートメッセージID (`om_*`) を使用するため、最初のターンとその後のターンが同じセッションに維持されます。

---

## 関連

- [Channels Overview](/ja-JP/channels) — サポートされているすべてのチャンネル
- [Pairing](/ja-JP/channels/pairing) — DM認証とペアリングフロー
- [Groups](/ja-JP/channels/groups) — グループチャットの動作とメンションゲーティング
- [Channel Routing](/ja-JP/channels/channel-routing) — メッセージのセッションルーティング
- [Security](/ja-JP/gateway/security) — アクセスモデルとハードニング
