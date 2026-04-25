---
read_when:
    - DMアクセス制御の設定
    - 新しいiOS/Android Nodeをペアリングする
    - OpenClawのセキュリティ体制を確認する
summary: 'ペアリングの概要: 誰があなたにDMできるか、およびどのNodeが参加できるかを承認する'
title: ペアリング
x-i18n:
    generated_at: "2026-04-25T13:41:49Z"
    model: gpt-5.4
    provider: openai
    source_hash: 8f11c992f7cbde12f8c6963279dbaea420941e2fc088179d3fd259e4aa007e34
    source_path: channels/pairing.md
    workflow: 15
---

「ペアリング」は、OpenClawにおける明示的な**所有者承認**のステップです。  
これは次の2か所で使われます。

1. **DMペアリング**（誰がボットと会話できるか）
2. **Nodeペアリング**（どのデバイス/NodeがGatewayネットワークに参加できるか）

セキュリティの文脈: [Security](/ja-JP/gateway/security)

## 1) DMペアリング（受信チャットアクセス）

チャンネルのDMポリシーが `pairing` に設定されている場合、不明な送信者には短いコードが送られ、そのメッセージは承認するまで**処理されません**。

デフォルトのDMポリシーは次に記載されています: [Security](/ja-JP/gateway/security)

ペアリングコード:

- 8文字、大文字、紛らわしい文字なし（`0O1I`）。
- **1時間後に失効**します。ボットは新しいリクエストが作成されたときにのみペアリングメッセージを送信します（送信者ごとにおおむね1時間に1回）。
- 保留中のDMペアリングリクエストは、デフォルトで**チャンネルごとに3件**までです。1件が失効または承認されるまでは、それ以上のリクエストは無視されます。

### 送信者を承認する

```bash
openclaw pairing list telegram
openclaw pairing approve telegram <CODE>
```

対応チャンネル: `bluebubbles`, `discord`, `feishu`, `googlechat`, `imessage`, `irc`, `line`, `matrix`, `mattermost`, `msteams`, `nextcloud-talk`, `nostr`, `openclaw-weixin`, `signal`, `slack`, `synology-chat`, `telegram`, `twitch`, `whatsapp`, `zalo`, `zalouser`.

### 状態の保存場所

`~/.openclaw/credentials/` 配下に保存されます。

- 保留中リクエスト: `<channel>-pairing.json`
- 承認済み許可リストストア:
  - デフォルトアカウント: `<channel>-allowFrom.json`
  - 非デフォルトアカウント: `<channel>-<accountId>-allowFrom.json`

アカウント単位のスコープ動作:

- 非デフォルトアカウントは、スコープ付きの許可リストファイルのみを読み書きします。
- デフォルトアカウントは、チャンネル単位のスコープなし許可リストファイルを使用します。

これらは機密情報として扱ってください（アシスタントへのアクセスを制御するためです）。

重要: このストアはDMアクセス用です。グループの認可は別です。  
DMペアリングコードを承認しても、その送信者が自動的にグループコマンドを実行できるようになったり、グループ内でボットを制御できるようになったりはしません。グループアクセスについては、チャンネルの明示的なグループ許可リスト（たとえば `groupAllowFrom`、`groups`、またはチャンネルに応じたグループ/トピック単位の上書き）を設定してください。

## 2) Nodeデバイスペアリング（iOS/Android/macOS/ヘッドレスNode）

Nodeは、`role: node` を持つ**デバイス**としてGatewayに接続します。Gatewayは承認が必要なデバイスペアリングリクエストを作成します。

### Telegram経由でペアリングする（iOSに推奨）

`device-pair` Pluginを使用している場合、初回のデバイスペアリングはTelegramだけで完了できます。

1. Telegramでボットに `/pair` と送信します
2. ボットは2つのメッセージで返信します。1つは説明メッセージ、もう1つは別送の**セットアップコード**メッセージです（Telegramで簡単にコピー&ペーストできます）。
3. スマートフォンでOpenClaw iOSアプリを開き、Settings → Gateway に進みます。
4. セットアップコードを貼り付けて接続します。
5. Telegramに戻って `/pair pending` を実行し、リクエストID、ロール、スコープを確認してから承認します。

セットアップコードは、次を含むbase64エンコード済みJSONペイロードです。

- `url`: Gateway WebSocket URL（`ws://...` または `wss://...`）
- `bootstrapToken`: 初回ペアリングハンドシェイクに使う、短命な単一デバイス用ブートストラップトークン

このブートストラップトークンには、組み込みのペアリング用ブートストラッププロファイルが含まれます。

- 引き渡される主要な `node` トークンは `scopes: []` のままです
- 引き渡される `operator` トークンは、ブートストラップ許可リストに制限されたままです:
  `operator.approvals`, `operator.read`, `operator.talk.secrets`, `operator.write`
- ブートストラップのスコープチェックは、1つのフラットなスコーププールではなく、ロール接頭辞付きです:
  operatorのスコープエントリはoperatorリクエストにのみ適用され、operator以外のロールは引き続き自身のロール接頭辞配下でスコープを要求する必要があります

有効期間中、このセットアップコードはパスワード同様に扱ってください。

### Nodeデバイスを承認する

```bash
openclaw devices list
openclaw devices approve <requestId>
openclaw devices reject <requestId>
```

同じデバイスが異なる認証詳細（たとえば異なるロール/スコープ/公開鍵）で再試行した場合、以前の保留中リクエストは置き換えられ、新しい `requestId` が作成されます。

重要: すでにペアリング済みのデバイスが、黙ってより広いアクセスを得ることはありません。  
より多くのスコープやより広いロールを要求して再接続した場合、OpenClawは既存の承認をそのまま維持し、新しい保留中のアップグレードリクエストを作成します。承認前に、`openclaw devices list` を使って現在承認済みのアクセスと新たに要求されたアクセスを比較してください。

### オプションの信頼済みCIDRによるNode自動承認

デバイスペアリングはデフォルトでは手動のままです。厳密に管理されたNodeネットワーク向けに、明示的なCIDRまたは完全一致IPによる初回Node自動承認を有効にできます。

```json5
{
  gateway: {
    nodes: {
      pairing: {
        autoApproveCidrs: ["192.168.1.0/24"],
      },
    },
  },
}
```

これは、要求スコープのない新規 `role: node` ペアリングリクエストにのみ適用されます。Operator、ブラウザ、Control UI、WebChatクライアントは引き続き手動承認が必要です。ロール、スコープ、メタデータ、公開鍵の変更も引き続き手動承認が必要です。

### Nodeペアリング状態の保存場所

`~/.openclaw/devices/` 配下に保存されます。

- `pending.json`（短命。保留中リクエストは失効します）
- `paired.json`（ペアリング済みデバイス + トークン）

### 注記

- 旧来の `node.pair.*` API（CLI: `openclaw nodes pending|approve|reject|rename`）は、別のGateway所有ペアリングストアです。WS Nodeでも引き続きデバイスペアリングが必要です。
- ペアリングレコードは、承認済みロールの永続的な信頼できる情報源です。アクティブなデバイストークンは、その承認済みロール集合に制限されたままです。承認済みロールの外にある逸脱したトークンエントリが、新たなアクセスを生み出すことはありません。

## 関連ドキュメント

- セキュリティモデル + プロンプトインジェクション: [Security](/ja-JP/gateway/security)
- 安全な更新方法（doctorを実行）: [Updating](/ja-JP/install/updating)
- チャンネル設定:
  - Telegram: [Telegram](/ja-JP/channels/telegram)
  - WhatsApp: [WhatsApp](/ja-JP/channels/whatsapp)
  - Signal: [Signal](/ja-JP/channels/signal)
  - BlueBubbles (iMessage): [BlueBubbles](/ja-JP/channels/bluebubbles)
  - iMessage（レガシー）: [iMessage](/ja-JP/channels/imessage)
  - Discord: [Discord](/ja-JP/channels/discord)
  - Slack: [Slack](/ja-JP/channels/slack)
