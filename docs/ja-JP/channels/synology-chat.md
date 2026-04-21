---
read_when:
    - OpenClawでSynology Chatをセットアップする
    - Synology ChatのWebhookルーティングをデバッグする
summary: Synology ChatのWebhookセットアップとOpenClawの設定
title: Synology Chat
x-i18n:
    generated_at: "2026-04-21T19:20:39Z"
    model: gpt-5.4
    provider: openai
    source_hash: 7288e2aa873ee1a1f57861d839cfb44ff324e3d40a7f36da07c6ba43cbe1e6e6
    source_path: channels/synology-chat.md
    workflow: 15
---

# Synology Chat

ステータス: Synology ChatのWebhookを使う、ダイレクトメッセージ用のバンドルPluginチャンネルです。
このPluginは、Synology Chatの送信Webhookからの受信メッセージを受け付け、Synology Chatの受信Webhookを通じて返信を送信します。

## バンドルPlugin

Synology Chatは現在のOpenClawリリースではバンドルPluginとして提供されるため、通常の
パッケージ版ビルドでは別途インストールは不要です。

古いビルドを使っている場合や、Synology Chatを含まないカスタムインストールの場合は、
手動でインストールしてください。

ローカルのチェックアウトからインストール:

```bash
openclaw plugins install ./path/to/local/synology-chat-plugin
```

詳細: [Plugins](/ja-JP/tools/plugin)

## クイックセットアップ

1. Synology Chat Pluginが利用可能であることを確認します。
   - 現在のパッケージ版OpenClawリリースには、すでにバンドルされています。
   - 古いインストールやカスタムインストールでは、上記のコマンドでソースのチェックアウトから手動追加できます。
   - `openclaw onboard` では、`openclaw channels add` と同じチャンネル設定一覧にSynology Chatが表示されます。
   - 非対話型セットアップ: `openclaw channels add --channel synology-chat --token <token> --url <incoming-webhook-url>`
2. Synology Chatの連携設定で:
   - 受信Webhookを作成し、そのURLをコピーします。
   - シークレットトークン付きの送信Webhookを作成します。
3. 送信WebhookのURLをOpenClaw Gatewayに向けます:
   - デフォルトでは `https://gateway-host/webhook/synology`
   - またはカスタムの `channels.synology-chat.webhookPath`
4. OpenClawでセットアップを完了します。
   - ガイド付き: `openclaw onboard`
   - 直接指定: `openclaw channels add --channel synology-chat --token <token> --url <incoming-webhook-url>`
5. Gatewayを再起動し、Synology ChatボットにDMを送信します。

Webhook認証の詳細:

- OpenClawは、まず `body.token`、次に
  `?token=...`、その後にヘッダーから送信Webhookトークンを受け付けます。
- 受け付けるヘッダー形式:
  - `x-synology-token`
  - `x-webhook-token`
  - `x-openclaw-token`
  - `Authorization: Bearer <token>`
- トークンが空または欠落している場合はフェイルクローズします。

最小構成:

```json5
{
  channels: {
    "synology-chat": {
      enabled: true,
      token: "synology-outgoing-token",
      incomingUrl: "https://nas.example.com/webapi/entry.cgi?api=SYNO.Chat.External&method=incoming&version=2&token=...",
      webhookPath: "/webhook/synology",
      dmPolicy: "allowlist",
      allowedUserIds: ["123456"],
      rateLimitPerMinute: 30,
      allowInsecureSsl: false,
    },
  },
}
```

## 環境変数

デフォルトアカウントでは、env varを使用できます:

- `SYNOLOGY_CHAT_TOKEN`
- `SYNOLOGY_CHAT_INCOMING_URL`
- `SYNOLOGY_NAS_HOST`
- `SYNOLOGY_ALLOWED_USER_IDS`（カンマ区切り）
- `SYNOLOGY_RATE_LIMIT`
- `OPENCLAW_BOT_NAME`

設定値はenv varより優先されます。

## DMポリシーとアクセス制御

- `dmPolicy: "allowlist"` が推奨されるデフォルトです。
- `allowedUserIds` は、SynologyユーザーIDのリスト（またはカンマ区切り文字列）を受け付けます。
- `allowlist` モードでは、`allowedUserIds` リストが空だと設定ミスとして扱われ、Webhookルートは起動しません（全許可にするには `dmPolicy: "open"` を使用してください）。
- `dmPolicy: "open"` は任意の送信者を許可します。
- `dmPolicy: "disabled"` はDMをブロックします。
- 返信先の紐付けは、デフォルトでは安定した数値の `user_id` に固定されます。`channels.synology-chat.dangerouslyAllowNameMatching: true` は、変更可能なユーザー名/ニックネーム検索による返信配送を再有効化する非常用の互換モードです。
- ペアリング承認は以下で動作します:
  - `openclaw pairing list synology-chat`
  - `openclaw pairing approve synology-chat <CODE>`

## 送信配信

送信先には数値のSynology ChatユーザーIDを使用します。

例:

```bash
openclaw message send --channel synology-chat --target 123456 --text "Hello from OpenClaw"
openclaw message send --channel synology-chat --target synology-chat:123456 --text "Hello again"
```

メディア送信はURLベースのファイル配信でサポートされます。
送信ファイルURLは `http` または `https` を使う必要があり、プライベートまたはその他のブロック対象ネットワークへの宛先は、OpenClawがそのURLをNASのWebhookへ転送する前に拒否されます。

## マルチアカウント

複数のSynology Chatアカウントは `channels.synology-chat.accounts` の下でサポートされます。
各アカウントは、トークン、受信URL、Webhookパス、DMポリシー、制限を上書きできます。
ダイレクトメッセージのセッションはアカウントごと・ユーザーごとに分離されるため、異なる2つのSynologyアカウント上で同じ数値の `user_id`
であってもトランスクリプト状態は共有されません。
有効な各アカウントには、異なる `webhookPath` を指定してください。OpenClawは現在、完全に同一のパスの重複を拒否し、
マルチアカウント構成で共有Webhookパスを継承するだけの名前付きアカウントは起動を拒否します。
意図的に名前付きアカウントで従来の継承が必要な場合は、
そのアカウント、または `channels.synology-chat` に `dangerouslyAllowInheritedWebhookPath: true` を設定してください。
ただし、完全に同一のパスの重複は引き続きフェイルクローズで拒否されます。明示的なアカウントごとのパス指定を推奨します。

```json5
{
  channels: {
    "synology-chat": {
      enabled: true,
      accounts: {
        default: {
          token: "token-a",
          incomingUrl: "https://nas-a.example.com/...token=...",
        },
        alerts: {
          token: "token-b",
          incomingUrl: "https://nas-b.example.com/...token=...",
          webhookPath: "/webhook/synology-alerts",
          dmPolicy: "allowlist",
          allowedUserIds: ["987654"],
        },
      },
    },
  },
}
```

## セキュリティに関する注意

- `token` は秘密に保ち、漏えいした場合はローテーションしてください。
- 自己署名のローカルNAS証明書を明示的に信頼する場合を除き、`allowInsecureSsl: false` を維持してください。
- 受信Webhookリクエストは、トークン検証と送信者ごとのレート制限が行われます。
- 無効なトークンのチェックには定数時間の秘密比較が使われ、フェイルクローズします。
- 本番環境では `dmPolicy: "allowlist"` を推奨します。
- 従来のユーザー名ベース返信配信が明示的に必要な場合を除き、`dangerouslyAllowNameMatching` は無効のままにしてください。
- マルチアカウント構成での共有パスルーティングのリスクを明示的に許容する場合を除き、`dangerouslyAllowInheritedWebhookPath` は無効のままにしてください。

## トラブルシューティング

- `Missing required fields (token, user_id, text)`:
  - 送信Webhookのペイロードに必須フィールドのいずれかが欠けています
  - Synologyがトークンをヘッダーで送る場合は、Gateway/プロキシがそのヘッダーを保持していることを確認してください
- `Invalid token`:
  - 送信Webhookシークレットが `channels.synology-chat.token` と一致していません
  - リクエストが間違ったアカウント/Webhookパスに到達しています
  - リバースプロキシが、リクエストがOpenClawに到達する前にトークンヘッダーを削除しました
- `Rate limit exceeded`:
  - 同じ送信元からの無効トークン試行が多すぎると、その送信元は一時的にロックアウトされることがあります
  - 認証済み送信者にも、ユーザーごとの別個のメッセージレート制限があります
- `Allowlist is empty. Configure allowedUserIds or use dmPolicy=open.`:
  - `dmPolicy="allowlist"` は有効ですが、ユーザーが設定されていません
- `User not authorized`:
  - 送信者の数値 `user_id` が `allowedUserIds` に含まれていません

## 関連

- [Channels Overview](/ja-JP/channels) — サポートされるすべてのチャンネル
- [Pairing](/ja-JP/channels/pairing) — DM認証とペアリングフロー
- [Groups](/ja-JP/channels/groups) — グループチャットの動作とメンション制御
- [Channel Routing](/ja-JP/channels/channel-routing) — メッセージのセッションルーティング
- [Security](/ja-JP/gateway/security) — アクセスモデルとハードニング
