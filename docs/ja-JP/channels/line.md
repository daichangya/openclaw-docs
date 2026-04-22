---
read_when:
    - OpenClawをLINEに接続したい場合
    - LINEのWebhookと認証情報の設定が必要です
    - LINE固有のメッセージオプションを使いたい場合
summary: LINE Messaging API Pluginのセットアップ、設定、および使用方法
title: LINE
x-i18n:
    generated_at: "2026-04-22T04:19:51Z"
    model: gpt-5.4
    provider: openai
    source_hash: c6a64c18e47d22d0629ec4956f88746620923e72faae6c01f7ab353eede7345d
    source_path: channels/line.md
    workflow: 15
---

# LINE

LINEはLINE Messaging APIを介してOpenClawに接続します。このPluginはGateway上でWebhook受信者として動作し、認証にはチャンネルアクセストークンとチャンネルシークレットを使用します。

ステータス: バンドル済みPlugin。ダイレクトメッセージ、グループチャット、メディア、位置情報、Flexメッセージ、テンプレートメッセージ、クイックリプライをサポートしています。リアクションとスレッドはサポートされていません。

## バンドル済みPlugin

LINEは現在のOpenClawリリースにバンドル済みPluginとして含まれているため、通常のパッケージ版ビルドでは個別のインストールは不要です。

古いビルドを使用している場合や、LINEが除外されたカスタムインストールを使用している場合は、手動でインストールしてください。

```bash
openclaw plugins install @openclaw/line
```

ローカルチェックアウト（gitリポジトリから実行している場合）:

```bash
openclaw plugins install ./path/to/local/line-plugin
```

## セットアップ

1. LINE Developersアカウントを作成し、Consoleを開きます:
   [https://developers.line.biz/console/](https://developers.line.biz/console/)
2. Providerを作成（または選択）し、**Messaging API**チャンネルを追加します。
3. チャンネル設定から**Channel access token**と**Channel secret**をコピーします。
4. Messaging API設定で**Use webhook**を有効にします。
5. Webhook URLをGatewayエンドポイントに設定します（HTTPS必須）:

```
https://gateway-host/line/webhook
```

Gatewayは、LINEのWebhook検証（GET）と受信イベント（POST）の両方に応答します。
カスタムパスが必要な場合は、`channels.line.webhookPath`または`channels.line.accounts.<id>.webhookPath`を設定し、それに応じてURLを更新してください。

セキュリティに関する注意:

- LINEの署名検証はボディに依存します（生のボディに対するHMAC）そのため、OpenClawは検証前に厳格な事前認証ボディ制限とタイムアウトを適用します。
- OpenClawは、検証済みの生リクエストバイト列からWebhookイベントを処理します。署名の整合性を保つため、上流ミドルウェアによって変換された`req.body`の値は無視されます。

## 設定

最小構成:

```json5
{
  channels: {
    line: {
      enabled: true,
      channelAccessToken: "LINE_CHANNEL_ACCESS_TOKEN",
      channelSecret: "LINE_CHANNEL_SECRET",
      dmPolicy: "pairing",
    },
  },
}
```

環境変数（デフォルトアカウントのみ）:

- `LINE_CHANNEL_ACCESS_TOKEN`
- `LINE_CHANNEL_SECRET`

トークン/シークレットファイル:

```json5
{
  channels: {
    line: {
      tokenFile: "/path/to/line-token.txt",
      secretFile: "/path/to/line-secret.txt",
    },
  },
}
```

`tokenFile`と`secretFile`は通常ファイルを指している必要があります。シンボリックリンクは拒否されます。

複数アカウント:

```json5
{
  channels: {
    line: {
      accounts: {
        marketing: {
          channelAccessToken: "...",
          channelSecret: "...",
          webhookPath: "/line/marketing",
        },
      },
    },
  },
}
```

## アクセス制御

ダイレクトメッセージのデフォルトはペアリングです。未確認の送信者にはペアリングコードが送られ、承認されるまでメッセージは無視されます。

```bash
openclaw pairing list line
openclaw pairing approve line <CODE>
```

許可リストとポリシー:

- `channels.line.dmPolicy`: `pairing | allowlist | open | disabled`
- `channels.line.allowFrom`: DM用に許可リスト登録されたLINEユーザーID
- `channels.line.groupPolicy`: `allowlist | open | disabled`
- `channels.line.groupAllowFrom`: グループ用に許可リスト登録されたLINEユーザーID
- グループごとのオーバーライド: `channels.line.groups.<groupId>.allowFrom`
- ランタイムに関する注意: `channels.line`が完全に欠けている場合、ランタイムはグループチェックに対して`groupPolicy="allowlist"`にフォールバックします（`channels.defaults.groupPolicy`が設定されていても同様です）。

LINE IDは大文字と小文字を区別します。有効なIDの例:

- ユーザー: `U` + 32文字の16進数
- グループ: `C` + 32文字の16進数
- ルーム: `R` + 32文字の16進数

## メッセージ動作

- テキストは5000文字ごとに分割されます。
- Markdown書式は除去されます。コードブロックと表は、可能な場合はFlexカードに変換されます。
- ストリーミング応答はバッファリングされます。エージェントの処理中、LINEには読み込みアニメーション付きで完全なチャンクが送信されます。
- メディアダウンロードは`channels.line.mediaMaxMb`（デフォルト10）で上限が設定されます。

## チャンネルデータ（リッチメッセージ）

クイックリプライ、位置情報、Flexカード、またはテンプレートメッセージを送信するには、`channelData.line`を使用します。

```json5
{
  text: "Here you go",
  channelData: {
    line: {
      quickReplies: ["Status", "Help"],
      location: {
        title: "Office",
        address: "123 Main St",
        latitude: 35.681236,
        longitude: 139.767125,
      },
      flexMessage: {
        altText: "Status card",
        contents: {
          /* Flex payload */
        },
      },
      templateMessage: {
        type: "confirm",
        text: "Proceed?",
        confirmLabel: "Yes",
        confirmData: "yes",
        cancelLabel: "No",
        cancelData: "no",
      },
    },
  },
}
```

LINE Pluginには、Flexメッセージのプリセット用の`/card`コマンドも含まれています。

```
/card info "Welcome" "Thanks for joining!"
```

## ACPサポート

LINEはACP（Agent Communication Protocol）の会話バインディングをサポートしています。

- `/acp spawn <agent> --bind here`は、子スレッドを作成せずに現在のLINEチャットをACPセッションにバインドします。
- 設定済みのACPバインディングと、会話にバインドされたアクティブなACPセッションは、他の会話チャンネルと同様にLINE上で動作します。

詳細は[ACP agents](/ja-JP/tools/acp-agents)を参照してください。

## 送信メディア

LINE Pluginは、エージェントメッセージツールを通じた画像、動画、音声ファイルの送信をサポートしています。メディアは、適切なプレビューおよびトラッキング処理とともに、LINE固有の配信経路を通じて送信されます。

- **画像**: 自動プレビュー生成付きのLINE画像メッセージとして送信されます。
- **動画**: 明示的なプレビューとcontent-type処理付きで送信されます。
- **音声**: LINE音声メッセージとして送信されます。

送信メディアURLは公開HTTPS URLである必要があります。OpenClawはURLをLINEに渡す前に対象ホスト名を検証し、loopback、link-local、プライベートネットワークの宛先を拒否します。

汎用メディア送信では、LINE固有の経路が利用できない場合、既存の画像専用ルートにフォールバックします。

## トラブルシューティング

- **Webhook検証に失敗する:** Webhook URLがHTTPSであること、および`channelSecret`がLINE Consoleの値と一致していることを確認してください。
- **受信イベントがない:** Webhookパスが`channels.line.webhookPath`と一致していること、およびGatewayにLINEから到達できることを確認してください。
- **メディアダウンロードエラー:** メディアがデフォルト上限を超える場合は、`channels.line.mediaMaxMb`を増やしてください。

## 関連

- [チャンネル概要](/ja-JP/channels) — サポートされているすべてのチャンネル
- [ペアリング](/ja-JP/channels/pairing) — DM認証とペアリングフロー
- [グループ](/ja-JP/channels/groups) — グループチャットの動作とメンションゲーティング
- [チャンネルルーティング](/ja-JP/channels/channel-routing) — メッセージのセッションルーティング
- [セキュリティ](/ja-JP/gateway/security) — アクセスモデルとハードニング
