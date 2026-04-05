---
read_when:
    - OpenClawでSynology Chatをセットアップしているとき
    - Synology Chat webhookルーティングをデバッグしているとき
summary: Synology Chat webhookのセットアップとOpenClaw設定
title: Synology Chat
x-i18n:
    generated_at: "2026-04-05T12:36:42Z"
    model: gpt-5.4
    provider: openai
    source_hash: ddb25fc6b53f896f15f43b4936d69ea071a29a91838a5b662819377271e89d81
    source_path: channels/synology-chat.md
    workflow: 15
---

# Synology Chat

ステータス: Synology Chat webhookを使用するバンドル済みプラグインのダイレクトメッセージチャンネルです。
このプラグインは、Synology Chatの送信webhookから受信メッセージを受け取り、
Synology Chatの受信webhookを通じて返信を送信します。

## バンドル済みプラグイン

Synology Chatは現在のOpenClawリリースにバンドル済みプラグインとして含まれているため、通常の
パッケージ済みビルドでは別途インストールは不要です。

古いビルドまたはSynology Chatを含まないカスタムインストールを使用している場合は、
手動でインストールしてください。

ローカルチェックアウトからインストールするには:

```bash
openclaw plugins install ./path/to/local/synology-chat-plugin
```

詳細: [Plugins](/tools/plugin)

## クイックセットアップ

1. Synology Chatプラグインが利用可能であることを確認します。
   - 現在のパッケージ版OpenClawリリースには、すでにバンドルされています。
   - 古い/カスタムインストールでは、上記コマンドでソースチェックアウトから手動追加できます。
   - `openclaw onboard`では、`openclaw channels add`と同じチャンネルセットアップ一覧にSynology Chatが表示されるようになりました。
   - 非対話型セットアップ: `openclaw channels add --channel synology-chat --token <token> --url <incoming-webhook-url>`
2. Synology Chatの統合設定で以下を行います。
   - 受信webhookを作成し、そのURLをコピーします。
   - 送信webhookを作成し、そのシークレットトークンを設定します。
3. 送信webhookのURLをOpenClaw Gatewayに向けます。
   - デフォルトでは`https://gateway-host/webhook/synology`
   - またはカスタムの`channels.synology-chat.webhookPath`
4. OpenClawでセットアップを完了します。
   - ガイド付き: `openclaw onboard`
   - 直接指定: `openclaw channels add --channel synology-chat --token <token> --url <incoming-webhook-url>`
5. Gatewayを再起動し、Synology ChatボットにDMを送信します。

Webhook認証の詳細:

- OpenClawは、まず`body.token`、次に
  `?token=...`、最後にヘッダーから送信webhookトークンを受け付けます。
- 受け付けるヘッダー形式:
  - `x-synology-token`
  - `x-webhook-token`
  - `x-openclaw-token`
  - `Authorization: Bearer <token>`
- 空または欠落したトークンはfail-closedになります。

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

デフォルトアカウントでは、以下の環境変数を使用できます。

- `SYNOLOGY_CHAT_TOKEN`
- `SYNOLOGY_CHAT_INCOMING_URL`
- `SYNOLOGY_NAS_HOST`
- `SYNOLOGY_ALLOWED_USER_IDS`（カンマ区切り）
- `SYNOLOGY_RATE_LIMIT`
- `OPENCLAW_BOT_NAME`

設定値は環境変数より優先されます。

## DMポリシーとアクセス制御

- `dmPolicy: "allowlist"`が推奨されるデフォルトです。
- `allowedUserIds`は、SynologyユーザーIDのリスト（またはカンマ区切り文字列）を受け付けます。
- `allowlist`モードでは、`allowedUserIds`リストが空だと設定ミスとして扱われ、webhookルートは起動しません（全員許可にするには`dmPolicy: "open"`を使用してください）。
- `dmPolicy: "open"`は任意の送信者を許可します。
- `dmPolicy: "disabled"`はDMをブロックします。
- 返信先バインディングは、デフォルトで安定した数値の`user_id`に基づきます。`channels.synology-chat.dangerouslyAllowNameMatching: true`は、返信配信で可変なusername/nickname参照を再有効化する非常用の互換モードです。
- ペアリング承認は次で行えます。
  - `openclaw pairing list synology-chat`
  - `openclaw pairing approve synology-chat <CODE>`

## 送信配信

送信先には数値のSynology ChatユーザーIDを使用します。

例:

```bash
openclaw message send --channel synology-chat --target 123456 --text "Hello from OpenClaw"
openclaw message send --channel synology-chat --target synology-chat:123456 --text "Hello again"
```

メディア送信は、URLベースのファイル配信でサポートされています。

## 複数アカウント

複数のSynology Chatアカウントは`channels.synology-chat.accounts`配下でサポートされています。
各アカウントは、token、incoming URL、webhook path、DMポリシー、制限を上書きできます。
ダイレクトメッセージのセッションはアカウントごと・ユーザーごとに分離されるため、異なる2つのSynologyアカウントで同じ数値の`user_id`を使ってもトランスクリプト状態は共有されません。
有効な各アカウントには、異なる`webhookPath`を設定してください。OpenClawは現在、完全一致する重複パスを拒否し、複数アカウント構成で共有されたwebhook pathだけを継承する名前付きアカウントの起動を拒否します。
意図的に名前付きアカウントでレガシー継承が必要な場合は、
そのアカウントまたは`channels.synology-chat`に`dangerouslyAllowInheritedWebhookPath: true`を設定してください。
ただし、完全一致する重複パスは引き続きfail-closedで拒否されます。明示的なアカウントごとのパスを推奨します。

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

- `token`は秘密に保ち、漏えいした場合はローテーションしてください。
- 自己署名のローカルNAS証明書を明示的に信頼している場合を除き、`allowInsecureSsl: false`を維持してください。
- 受信webhookリクエストはトークン検証され、送信者ごとにレート制限されます。
- 無効なトークンチェックでは定数時間のシークレット比較を使用し、fail-closedになります。
- 本番環境では`dmPolicy: "allowlist"`を推奨します。
- レガシーのusernameベース返信配信が明示的に必要な場合を除き、`dangerouslyAllowNameMatching`は無効のままにしてください。
- 複数アカウント構成で共有パスのルーティングリスクを明示的に受け入れる場合を除き、`dangerouslyAllowInheritedWebhookPath`は無効のままにしてください。

## トラブルシューティング

- `Missing required fields (token, user_id, text)`:
  - 送信webhookペイロードに必要フィールドのいずれかが欠けています
  - Synologyがトークンをヘッダーで送信している場合、Gateway/プロキシがそのヘッダーを保持していることを確認してください
- `Invalid token`:
  - 送信webhookのシークレットが`channels.synology-chat.token`と一致していません
  - リクエストが誤ったアカウント/webhook pathに到達しています
  - リバースプロキシが、リクエストがOpenClawに届く前にトークンヘッダーを削除しました
- `Rate limit exceeded`:
  - 同じ送信元からの無効トークン試行が多すぎると、その送信元が一時的にロックアウトされることがあります
  - 認証済み送信者にも、別途ユーザーごとのメッセージレート制限があります
- `Allowlist is empty. Configure allowedUserIds or use dmPolicy=open.`:
  - `dmPolicy="allowlist"`が有効ですが、ユーザーが設定されていません
- `User not authorized`:
  - 送信者の数値`user_id`が`allowedUserIds`に含まれていません

## 関連

- [Channels Overview](/channels) — サポートされているすべてのチャンネル
- [Pairing](/channels/pairing) — DM認証とペアリングフロー
- [Groups](/channels/groups) — グループチャットの挙動とメンション制御
- [Channel Routing](/channels/channel-routing) — メッセージのセッションルーティング
- [Security](/gateway/security) — アクセスモデルとハードニング
