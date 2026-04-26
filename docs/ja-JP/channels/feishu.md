---
read_when:
    - Feishu/Larkボットを接続します。
    - Feishuチャンネルを設定しています。
summary: Feishuボットの概要、機能、設定
title: Feishu
x-i18n:
    generated_at: "2026-04-26T11:22:58Z"
    model: gpt-5.4
    provider: openai
    source_hash: 95a50a7cd7b290afe0a0db3a1b39c7305f6a0e7d0702597fb9a50b5a45afa855
    source_path: channels/feishu.md
    workflow: 15
---

# Feishu / Lark

Feishu/Larkは、チームがチャット、ドキュメント共有、カレンダー管理を行い、共同で作業を進められるオールインワンのコラボレーションプラットフォームです。

**ステータス:** ボットとのDMおよびグループチャット向けに本番運用対応済み。デフォルトモードはWebSocketで、Webhookモードは任意です。

---

## クイックスタート

> **OpenClaw 2026.4.25以降が必要です。** 確認するには `openclaw --version` を実行してください。アップグレードするには `openclaw update` を実行します。

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

ボットにDMできるユーザーを制御するには、`dmPolicy` を設定します。

- `"pairing"` — 不明なユーザーにはペアリングコードが送られ、CLIで承認します
- `"allowlist"` — `allowFrom` に記載されたユーザーのみチャットできます（デフォルト: ボット所有者のみ）
- `"open"` — すべてのユーザーを許可します
- `"disabled"` — すべてのDMを無効にします

**ペアリングリクエストを承認する:**

```bash
openclaw pairing list feishu
openclaw pairing approve feishu <CODE>
```

### グループチャット

**グループポリシー** (`channels.feishu.groupPolicy`):

| Value         | 動作                                  |
| ------------- | ------------------------------------- |
| `"open"`      | グループ内のすべてのメッセージに応答 |
| `"allowlist"` | `groupAllowFrom` 内のグループにのみ応答 |
| `"disabled"`  | すべてのグループメッセージを無効化   |

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

### 特定のグループのみ許可

```json5
{
  channels: {
    feishu: {
      groupPolicy: "allowlist",
      // Group IDs look like: oc_xxx
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
          // User open_ids look like: ou_xxx
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

Feishu/Larkでグループを開き、右上のメニューアイコンをクリックして **Settings** に移動します。グループID (`chat_id`) は設定ページに表示されます。

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

| Command   | 説明                         |
| --------- | ---------------------------- |
| `/status` | ボットの状態を表示           |
| `/reset`  | 現在のセッションをリセット   |
| `/model`  | AIモデルを表示または切り替え |

> Feishu/Larkはネイティブのスラッシュコマンドメニューをサポートしていないため、これらはプレーンテキストメッセージとして送信してください。

---

## トラブルシューティング

### グループチャットでボットが応答しない

1. ボットがグループに追加されていることを確認します
2. ボットに@メンションしていることを確認します（デフォルトで必須）
3. `groupPolicy` が `"disabled"` ではないことを確認します
4. ログを確認します: `openclaw logs --follow`

### ボットがメッセージを受信しない

1. ボットがFeishu Open Platform / Lark Developerで公開され、承認されていることを確認します
2. イベント購読に `im.message.receive_v1` が含まれていることを確認します
3. **persistent connection** (WebSocket) が選択されていることを確認します
4. 必要な権限スコープがすべて付与されていることを確認します
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
          tts: {
            providers: {
              openai: { voice: "shimmer" },
            },
          },
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
`accounts.<id>.tts` は `messages.tts` と同じ形状を使用し、グローバルなTTS設定の上にディープマージされます。そのため、複数ボットのFeishu構成では、共有のプロバイダー認証情報をグローバルに保持しつつ、音声、モデル、ペルソナ、自動モードだけをアカウントごとに上書きできます。

### メッセージ制限

- `textChunkLimit` — 送信テキストのチャンクサイズ（デフォルト: `2000` 文字）
- `mediaMaxMb` — メディアのアップロード/ダウンロード上限（デフォルト: `30` MB）

### ストリーミング

Feishu/Larkはインタラクティブカードによるストリーミング返信をサポートしています。有効にすると、ボットはテキスト生成中にリアルタイムでカードを更新します。

```json5
{
  channels: {
    feishu: {
      streaming: true, // ストリーミングカード出力を有効化（デフォルト: true）
      blockStreaming: true, // ブロック単位ストリーミングを有効化（デフォルト: true）
    },
  },
}
```

完全な返信を1つのメッセージで送信するには、`streaming: false` を設定します。

### クォータ最適化

2つの任意フラグでFeishu/Lark API呼び出しの回数を減らせます。

- `typingIndicator` (デフォルト `true`): 入力中リアクションの呼び出しをスキップするには `false` に設定します
- `resolveSenderNames` (デフォルト `true`): 送信者プロフィールの参照をスキップするには `false` に設定します

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

Feishu/LarkはDMとグループスレッドメッセージでACPをサポートしています。Feishu/LarkのACPはテキストコマンド駆動で、ネイティブのスラッシュコマンドメニューはないため、会話内で `/acp ...` メッセージを直接使用してください。

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

Feishu/LarkのDMまたはスレッドで:

```text
/acp spawn codex --thread here
```

`--thread here` はDMとFeishu/Larkのスレッドメッセージで機能します。バインドされた会話内の後続メッセージは、そのACPセッションに直接ルーティングされます。

### マルチエージェントルーティング

`bindings` を使用して、Feishu/LarkのDMまたはグループを異なるエージェントにルーティングします。

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

参照方法のヒントについては、[グループ/ユーザーIDを取得する](#get-groupuser-ids) を参照してください。

---

## 設定リファレンス

完全な設定: [Gateway configuration](/ja-JP/gateway/configuration)

| Setting                                           | 説明                               | Default          |
| ------------------------------------------------- | ---------------------------------- | ---------------- |
| `channels.feishu.enabled`                         | チャンネルを有効化/無効化          | `true`           |
| `channels.feishu.domain`                          | APIドメイン (`feishu` または `lark`) | `feishu`         |
| `channels.feishu.connectionMode`                  | イベント転送 (`websocket` または `webhook`) | `websocket`      |
| `channels.feishu.defaultAccount`                  | 送信ルーティング用のデフォルトアカウント | `default`        |
| `channels.feishu.verificationToken`               | webhookモードで必須                | —                |
| `channels.feishu.encryptKey`                      | webhookモードで必須                | —                |
| `channels.feishu.webhookPath`                     | Webhookルートパス                  | `/feishu/events` |
| `channels.feishu.webhookHost`                     | Webhookバインドホスト              | `127.0.0.1`      |
| `channels.feishu.webhookPort`                     | Webhookバインドポート              | `3000`           |
| `channels.feishu.accounts.<id>.appId`             | App ID                             | —                |
| `channels.feishu.accounts.<id>.appSecret`         | App Secret                         | —                |
| `channels.feishu.accounts.<id>.domain`            | アカウントごとのドメイン上書き     | `feishu`         |
| `channels.feishu.accounts.<id>.tts`               | アカウントごとのTTS上書き          | `messages.tts`   |
| `channels.feishu.dmPolicy`                        | DMポリシー                         | `allowlist`      |
| `channels.feishu.allowFrom`                       | DM許可リスト (`open_id` の一覧)    | [BotOwnerId]     |
| `channels.feishu.groupPolicy`                     | グループポリシー                   | `allowlist`      |
| `channels.feishu.groupAllowFrom`                  | グループ許可リスト                 | —                |
| `channels.feishu.requireMention`                  | グループで@メンションを必須化      | `true`           |
| `channels.feishu.groups.<chat_id>.requireMention` | グループごとの@メンション上書き    | inherited        |
| `channels.feishu.groups.<chat_id>.enabled`        | 特定グループを有効化/無効化        | `true`           |
| `channels.feishu.textChunkLimit`                  | メッセージチャンクサイズ           | `2000`           |
| `channels.feishu.mediaMaxMb`                      | メディアサイズ上限                 | `30`             |
| `channels.feishu.streaming`                       | ストリーミングカード出力           | `true`           |
| `channels.feishu.blockStreaming`                  | ブロック単位ストリーミング         | `true`           |
| `channels.feishu.typingIndicator`                 | 入力中リアクションを送信           | `true`           |
| `channels.feishu.resolveSenderNames`              | 送信者表示名を解決                 | `true`           |

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

受信したFeishu/Lark音声メッセージは、生の `file_key` JSONではなく、メディアプレースホルダーとして正規化されます。`tools.media.audio` が設定されている場合、OpenClawはボイスノートのリソースをダウンロードし、エージェントターンの前に共有音声文字起こしを実行するため、エージェントは音声の文字起こし結果を受け取ります。Feishuが音声ペイロード内に文字起こしテキストを直接含めている場合は、追加のASR呼び出しなしでそのテキストが使用されます。音声文字起こしプロバイダーがない場合でも、エージェントは保存された添付ファイルとともに `<media:audio>` プレースホルダーを受け取り、生のFeishuリソースペイロードは受け取りません。

### 送信

- ✅ テキスト
- ✅ 画像
- ✅ ファイル
- ✅ 音声
- ✅ 動画/メディア
- ✅ インタラクティブカード（ストリーミング更新を含む）
- ⚠️ リッチテキスト（post形式の書式設定。Feishu/Larkの完全な作成機能には対応していません）

ネイティブのFeishu/Lark音声バブルはFeishuの `audio` メッセージタイプを使用し、Ogg/Opusのアップロードメディア（`file_type: "opus"`）が必要です。既存の `.opus` および `.ogg` メディアは、そのままネイティブ音声として送信されます。MP3/WAV/M4Aやその他の一般的な音声形式は、返信が音声配信を要求した場合（`audioAsVoice` / message tool `asVoice`、TTSのボイスノート返信を含む）にのみ、`ffmpeg` で48kHzのOgg/Opusへトランスコードされます。通常のMP3添付ファイルは通常のファイルのままです。`ffmpeg` がない場合、または変換に失敗した場合、OpenClawはファイル添付にフォールバックし、その理由をログに記録します。

### スレッドと返信

- ✅ インライン返信
- ✅ スレッド返信
- ✅ スレッドメッセージへの返信時、メディア返信もスレッド対応を維持

`groupSessionScope: "group_topic"` および `"group_topic_sender"` の場合、ネイティブのFeishu/Larkトピックグループはイベントの `thread_id` (`omt_*`) を正規のトピックセッションキーとして使用します。OpenClawがスレッド化する通常のグループ返信は、引き続き返信ルートメッセージID (`om_*`) を使用するため、最初のターンと後続ターンは同じセッションに保持されます。

---

## 関連

- [Channels Overview](/ja-JP/channels) — サポートされているすべてのチャンネル
- [Pairing](/ja-JP/channels/pairing) — DM認証とペアリングフロー
- [Groups](/ja-JP/channels/groups) — グループチャットの動作とメンション必須条件
- [Channel Routing](/ja-JP/channels/channel-routing) — メッセージのセッションルーティング
- [Security](/ja-JP/gateway/security) — アクセスモデルとハードニング
