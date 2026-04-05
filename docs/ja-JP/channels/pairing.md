---
read_when:
    - DM アクセス制御を設定するとき
    - 新しい iOS/Android ノードをペアリングするとき
    - OpenClaw のセキュリティ体制を確認するとき
summary: 'ペアリングの概要: 誰があなたに DM できるかと、どのノードが参加できるかを承認'
title: ペアリング
x-i18n:
    generated_at: "2026-04-05T12:36:14Z"
    model: gpt-5.4
    provider: openai
    source_hash: 2bd99240b3530def23c05a26915d07cf8b730565c2822c6338437f8fb3f285c9
    source_path: channels/pairing.md
    workflow: 15
---

# ペアリング

「ペアリング」は、OpenClaw における明示的な**オーナー承認**ステップです。
これは次の 2 つの場面で使われます。

1. **DM ペアリング**（誰が bot と会話できるか）
2. **ノードペアリング**（どのデバイス/ノードが Gateway ネットワークに参加できるか）

セキュリティの背景: [Security](/gateway/security)

## 1) DM ペアリング（受信チャットアクセス）

チャネルで DM ポリシー `pairing` が設定されている場合、未知の送信者には短いコードが送られ、そのメッセージはあなたが承認するまで**処理されません**。

デフォルトの DM ポリシーは次に記載されています: [Security](/gateway/security)

ペアリングコード:

- 8 文字、大文字、紛らわしい文字なし（`0O1I`）。
- **1 時間で期限切れ**になります。bot は、新しいリクエストが作成されたときにのみペアリングメッセージを送信します（送信者ごとにチャネルあたりおよそ 1 時間に 1 回）。
- 保留中の DM ペアリングリクエストは、デフォルトで**チャネルごとに 3 件**までです。1 件が期限切れになるか承認されるまで、それ以上のリクエストは無視されます。

### 送信者を承認する

```bash
openclaw pairing list telegram
openclaw pairing approve telegram <CODE>
```

サポートされるチャネル: `bluebubbles`, `discord`, `feishu`, `googlechat`, `imessage`, `irc`, `line`, `matrix`, `mattermost`, `msteams`, `nextcloud-talk`, `nostr`, `openclaw-weixin`, `signal`, `slack`, `synology-chat`, `telegram`, `twitch`, `whatsapp`, `zalo`, `zalouser`.

### 状態の保存場所

`~/.openclaw/credentials/` の下に保存されます。

- 保留中リクエスト: `<channel>-pairing.json`
- 承認済み allowlist ストア:
  - デフォルトアカウント: `<channel>-allowFrom.json`
  - 非デフォルトアカウント: `<channel>-<accountId>-allowFrom.json`

アカウントスコープの動作:

- 非デフォルトアカウントは、そのスコープ付き allowlist ファイルのみを読み書きします。
- デフォルトアカウントは、チャネルスコープのスコープなし allowlist ファイルを使います。

これらは機密情報として扱ってください（アシスタントへのアクセスを制御します）。

重要: このストアは DM アクセス用です。グループ認可は別です。
DM ペアリングコードを承認しても、その送信者がグループコマンドを実行したり、グループ内で bot を操作したりできるようになるわけではありません。グループアクセスについては、そのチャネルの明示的なグループ allowlist（たとえば `groupAllowFrom`、`groups`、またはチャネルに応じたグループごと/トピックごとの上書き）を設定してください。

## 2) ノードデバイスのペアリング（iOS/Android/macOS/ヘッドレスノード）

ノードは `role: node` を持つ**デバイス**として Gateway に接続します。Gateway は、承認が必要なデバイスペアリングリクエストを作成します。

### Telegram 経由でペアリングする（iOS 推奨）

`device-pair` plugin を使っている場合、初回のデバイスペアリングは Telegram だけで完結できます。

1. Telegram で bot にメッセージを送信します: `/pair`
2. bot は 2 つのメッセージで返信します。1 つは説明メッセージ、もう 1 つは別送の**セットアップコード**メッセージです（Telegram で簡単にコピー&ペーストできます）。
3. 電話で OpenClaw iOS アプリを開き、Settings → Gateway に進みます。
4. セットアップコードを貼り付けて接続します。
5. Telegram に戻って `/pair pending` を実行し、リクエスト ID、role、scope を確認してから承認します。

セットアップコードは base64 エンコードされた JSON ペイロードで、次を含みます。

- `url`: Gateway の WebSocket URL（`ws://...` または `wss://...`）
- `bootstrapToken`: 初期ペアリングハンドシェイクで使う、単一デバイス向けの短命な bootstrap トークン

その bootstrap トークンには、組み込みのペアリング bootstrap プロファイルが含まれます。

- 引き渡される主要な `node` トークンは `scopes: []` のままです
- 引き渡される `operator` トークンは、bootstrap allowlist に制限されたままです:
  `operator.approvals`, `operator.read`, `operator.talk.secrets`, `operator.write`
- bootstrap の scope チェックは、1 つのフラットな scope プールではなく role 接頭辞付きです:
  operator の scope エントリは operator リクエストに対してのみ有効であり、operator 以外の role は引き続き自分自身の role 接頭辞の下で scope を要求する必要があります

セットアップコードが有効な間は、パスワードのように扱ってください。

### ノードデバイスを承認する

```bash
openclaw devices list
openclaw devices approve <requestId>
openclaw devices reject <requestId>
```

同じデバイスが異なる認証詳細（たとえば異なる role/scope/public key）で再試行した場合、以前の保留中リクエストは置き換えられ、新しい `requestId` が作成されます。

### ノードペアリング状態の保存場所

`~/.openclaw/devices/` の下に保存されます。

- `pending.json`（短命。保留中リクエストは期限切れになります）
- `paired.json`（ペアリング済みデバイス + トークン）

### 注記

- レガシーな `node.pair.*` API（CLI: `openclaw nodes pending|approve|reject|rename`）は、別個の Gateway 所有ペアリングストアです。WS ノードでは引き続きデバイスペアリングが必要です。
- ペアリングレコードは、承認済み role の耐久的な正規ソースです。アクティブなデバイストークンは、その承認済み role セットに制限されたままです。承認済み role の外側にある余分なトークンエントリが、新しいアクセスを生み出すことはありません。

## 関連ドキュメント

- セキュリティモデル + プロンプトインジェクション: [Security](/gateway/security)
- 安全な更新（doctor を実行）: [Updating](/install/updating)
- チャネル設定:
  - Telegram: [Telegram](/channels/telegram)
  - WhatsApp: [WhatsApp](/channels/whatsapp)
  - Signal: [Signal](/channels/signal)
  - BlueBubbles（iMessage）: [BlueBubbles](/channels/bluebubbles)
  - iMessage（レガシー）: [iMessage](/channels/imessage)
  - Discord: [Discord](/channels/discord)
  - Slack: [Slack](/channels/slack)
