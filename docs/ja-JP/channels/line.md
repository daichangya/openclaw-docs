---
read_when:
    - OpenClaw を LINE に接続したいとき
    - LINE webhook と認証情報のセットアップが必要なとき
    - LINE 固有のメッセージオプションを使いたいとき
summary: LINE Messaging API プラグインのセットアップ、設定、および使用方法
title: LINE
x-i18n:
    generated_at: "2026-04-05T12:35:39Z"
    model: gpt-5.4
    provider: openai
    source_hash: b4782b2aa3e8654505d7f1fd6fc112adf125b5010fc84d655d033688ded37414
    source_path: channels/line.md
    workflow: 15
---

# LINE

LINE は LINE Messaging API を介して OpenClaw に接続します。このプラグインは gateway 上で webhook
レシーバーとして動作し、認証には Channel access token と Channel secret を使用します。

ステータス: バンドル済みプラグイン。ダイレクトメッセージ、グループチャット、メディア、位置情報、Flex
メッセージ、template message、quick reply をサポートしています。reaction と thread
はサポートされていません。

## バンドル済みプラグイン

LINE は現在の OpenClaw リリースではバンドル済みプラグインとして提供されているため、通常の
パッケージ版ビルドでは個別のインストールは不要です。

古いビルド、または LINE を含まないカスタムインストールを使っている場合は、手動で
インストールしてください。

```bash
openclaw plugins install @openclaw/line
```

ローカルチェックアウト（git リポジトリから実行している場合）:

```bash
openclaw plugins install ./path/to/local/line-plugin
```

## セットアップ

1. LINE Developers アカウントを作成し、Console を開きます:
   [https://developers.line.biz/console/](https://developers.line.biz/console/)
2. Provider を作成（または選択）し、**Messaging API** チャネルを追加します。
3. チャネル設定から **Channel access token** と **Channel secret** をコピーします。
4. Messaging API 設定で **Use webhook** を有効にします。
5. webhook URL を gateway エンドポイントに設定します（HTTPS 必須）:

```
https://gateway-host/line/webhook
```

gateway は LINE の webhook 検証（GET）および受信イベント（POST）に応答します。
カスタムパスが必要な場合は、`channels.line.webhookPath` または
`channels.line.accounts.<id>.webhookPath` を設定し、それに合わせて URL を更新してください。

セキュリティに関する注意:

- LINE の署名検証は body に依存します（生の body に対する HMAC）ので、OpenClaw は検証前に厳格な事前認証 body 制限とタイムアウトを適用します。
- OpenClaw は、検証済みの生リクエストバイト列から webhook イベントを処理します。署名整合性の安全性のため、上流 middleware により変換された `req.body` の値は無視されます。

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

token/secret ファイル:

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

`tokenFile` と `secretFile` は通常ファイルを指している必要があります。symlink は拒否されます。

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

ダイレクトメッセージはデフォルトで pairing です。未知の送信者には pairing code が送られ、
承認されるまでそのメッセージは無視されます。

```bash
openclaw pairing list line
openclaw pairing approve line <CODE>
```

allowlist とポリシー:

- `channels.line.dmPolicy`: `pairing | allowlist | open | disabled`
- `channels.line.allowFrom`: DM 用に allowlist された LINE user ID
- `channels.line.groupPolicy`: `allowlist | open | disabled`
- `channels.line.groupAllowFrom`: グループ用に allowlist された LINE user ID
- グループごとの上書き: `channels.line.groups.<groupId>.allowFrom`
- ランタイムに関する注意: `channels.line` が完全に存在しない場合、グループチェックではランタイムが `groupPolicy="allowlist"` にフォールバックします（`channels.defaults.groupPolicy` が設定されていても同様）。

LINE ID は大文字小文字を区別します。有効な ID の形式は次のとおりです。

- ユーザー: `U` + 32 桁の 16 進文字
- グループ: `C` + 32 桁の 16 進文字
- ルーム: `R` + 32 桁の 16 進文字

## メッセージ動作

- テキストは 5000 文字ごとに分割されます。
- Markdown の書式は除去されます。code block と table は可能な場合 Flex
  card に変換されます。
- ストリーミング応答はバッファされます。エージェントの処理中、LINE には loading
  animation とともに完全なチャンクが送信されます。
- メディアのダウンロードは `channels.line.mediaMaxMb`（デフォルト 10）で上限が設定されます。

## チャネルデータ（リッチメッセージ）

`channelData.line` を使うと、quick reply、位置情報、Flex card、template
message を送信できます。

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

LINE プラグインには、Flex message プリセット用の `/card` コマンドも含まれています。

```
/card info "Welcome" "Thanks for joining!"
```

## ACP サポート

LINE は ACP（Agent Communication Protocol）の会話バインディングをサポートします。

- `/acp spawn <agent> --bind here` は、子 thread を作成せずに現在の LINE チャットを ACP セッションにバインドします。
- 設定済みの ACP バインディングと、会話にバインドされたアクティブな ACP セッションは、他の会話チャネルと同様に LINE 上で動作します。

詳細は [ACP agents](/tools/acp-agents) を参照してください。

## 送信メディア

LINE プラグインは、agent message tool を通じた画像、動画、音声ファイルの送信をサポートしています。メディアは、適切なプレビューおよびトラッキング処理を伴う LINE 固有の配信経路を通じて送信されます。

- **画像**: 自動プレビュー生成付きの LINE 画像メッセージとして送信されます。
- **動画**: 明示的なプレビューおよび content-type 処理付きで送信されます。
- **音声**: LINE 音声メッセージとして送信されます。

汎用メディア送信では、LINE 固有の経路が利用できない場合、既存の画像専用経路にフォールバックします。

## トラブルシューティング

- **webhook 検証に失敗する:** webhook URL が HTTPS であり、
  `channelSecret` が LINE Console の値と一致していることを確認してください。
- **受信イベントが来ない:** webhook path が `channels.line.webhookPath`
  と一致しており、gateway に LINE から到達可能であることを確認してください。
- **メディアダウンロードエラー:** メディアがデフォルト制限を超える場合は
  `channels.line.mediaMaxMb` を引き上げてください。

## 関連

- [Channels Overview](/channels) — サポートされているすべてのチャネル
- [Pairing](/channels/pairing) — DM 認証と pairing フロー
- [Groups](/channels/groups) — グループチャットの動作と mention ゲート
- [Channel Routing](/channels/channel-routing) — メッセージのセッションルーティング
- [Security](/gateway/security) — アクセスモデルとハードニング
