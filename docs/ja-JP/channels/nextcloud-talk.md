---
read_when:
    - Nextcloud Talkチャンネル機能に取り組むとき
summary: Nextcloud Talkサポートのステータス、機能、設定
title: Nextcloud Talk
x-i18n:
    generated_at: "2026-04-05T12:35:56Z"
    model: gpt-5.4
    provider: openai
    source_hash: 900402afe67cf3ce96103d55158eb28cffb29c9845b77248e70d7653b12ae810
    source_path: channels/nextcloud-talk.md
    workflow: 15
---

# Nextcloud Talk

ステータス: バンドル済みplugin（Webhook bot）。ダイレクトメッセージ、ルーム、リアクション、Markdownメッセージがサポートされています。

## バンドル済みplugin

Nextcloud Talkは現在のOpenClawリリースではバンドル済みpluginとして提供されるため、通常のパッケージ済みビルドでは別途インストールは不要です。

古いビルドまたはNextcloud Talkを除外したカスタムインストールを使用している場合は、手動でインストールしてください。

CLI経由でインストール（npmレジストリ）:

```bash
openclaw plugins install @openclaw/nextcloud-talk
```

ローカルチェックアウト（gitリポジトリから実行している場合）:

```bash
openclaw plugins install ./path/to/local/nextcloud-talk-plugin
```

詳細: [Plugins](/tools/plugin)

## クイックセットアップ（初級者向け）

1. Nextcloud Talk pluginが利用可能であることを確認します。
   - 現在のパッケージ済みOpenClawリリースには、すでにバンドルされています。
   - 古いインストールやカスタムインストールでは、上記コマンドで手動追加できます。
2. Nextcloudサーバーでbotを作成します。

   ```bash
   ./occ talk:bot:install "OpenClaw" "<shared-secret>" "<webhook-url>" --feature reaction
   ```

3. 対象ルームの設定でbotを有効にします。
4. OpenClawを設定します。
   - Config: `channels.nextcloud-talk.baseUrl` + `channels.nextcloud-talk.botSecret`
   - またはenv: `NEXTCLOUD_TALK_BOT_SECRET`（デフォルトアカウントのみ）
5. Gatewayを再起動します（またはセットアップを完了します）。

最小構成:

```json5
{
  channels: {
    "nextcloud-talk": {
      enabled: true,
      baseUrl: "https://cloud.example.com",
      botSecret: "shared-secret",
      dmPolicy: "pairing",
    },
  },
}
```

## 注意点

- botはDMを開始できません。ユーザー側から先にbotへメッセージを送る必要があります。
- Webhook URLはGatewayから到達可能である必要があります。プロキシの背後にある場合は`webhookPublicUrl`を設定してください。
- bot APIではメディアアップロードはサポートされていません。メディアはURLとして送信されます。
- WebhookペイロードではDMとルームを区別できません。ルーム種別のルックアップを有効にするには`apiUser` + `apiPassword`を設定してください（設定しない場合、DMはルームとして扱われます）。

## アクセス制御（DM）

- デフォルト: `channels.nextcloud-talk.dmPolicy = "pairing"`。未知の送信者にはpairingコードが送られます。
- 承認方法:
  - `openclaw pairing list nextcloud-talk`
  - `openclaw pairing approve nextcloud-talk <CODE>`
- 公開DM: `channels.nextcloud-talk.dmPolicy="open"`に加えて`channels.nextcloud-talk.allowFrom=["*"]`。
- `allowFrom`はNextcloudユーザーIDのみに一致します。表示名は無視されます。

## ルーム（グループ）

- デフォルト: `channels.nextcloud-talk.groupPolicy = "allowlist"`（mentionゲートあり）。
- `channels.nextcloud-talk.rooms`でルームをallowlistに追加します。

```json5
{
  channels: {
    "nextcloud-talk": {
      rooms: {
        "room-token": { requireMention: true },
      },
    },
  },
}
```

- ルームを一切許可しない場合は、allowlistを空のままにするか、`channels.nextcloud-talk.groupPolicy="disabled"`を設定してください。

## 機能

| 機能               | ステータス      |
| ------------------ | --------------- |
| ダイレクトメッセージ | サポート済み    |
| ルーム             | サポート済み    |
| スレッド           | 未サポート      |
| メディア           | URLのみ         |
| リアクション       | サポート済み    |
| ネイティブコマンド | 未サポート      |

## 設定リファレンス（Nextcloud Talk）

完全な設定: [Configuration](/gateway/configuration)

プロバイダーオプション:

- `channels.nextcloud-talk.enabled`: チャンネル起動の有効化/無効化。
- `channels.nextcloud-talk.baseUrl`: NextcloudインスタンスURL。
- `channels.nextcloud-talk.botSecret`: bot共有シークレット。
- `channels.nextcloud-talk.botSecretFile`: 通常ファイルのシークレットパス。シンボリックリンクは拒否されます。
- `channels.nextcloud-talk.apiUser`: ルームルックアップ用APIユーザー（DM検出）。
- `channels.nextcloud-talk.apiPassword`: ルームルックアップ用API/アプリパスワード。
- `channels.nextcloud-talk.apiPasswordFile`: APIパスワードファイルのパス。
- `channels.nextcloud-talk.webhookPort`: Webhookリスナーポート（デフォルト: 8788）。
- `channels.nextcloud-talk.webhookHost`: Webhookホスト（デフォルト: 0.0.0.0）。
- `channels.nextcloud-talk.webhookPath`: Webhookパス（デフォルト: /nextcloud-talk-webhook）。
- `channels.nextcloud-talk.webhookPublicUrl`: 外部から到達可能なWebhook URL。
- `channels.nextcloud-talk.dmPolicy`: `pairing | allowlist | open | disabled`。
- `channels.nextcloud-talk.allowFrom`: DM allowlist（ユーザーID）。`open`には`"*"`が必要です。
- `channels.nextcloud-talk.groupPolicy`: `allowlist | open | disabled`。
- `channels.nextcloud-talk.groupAllowFrom`: グループallowlist（ユーザーID）。
- `channels.nextcloud-talk.rooms`: ルームごとの設定とallowlist。
- `channels.nextcloud-talk.historyLimit`: グループ履歴の上限（0で無効）。
- `channels.nextcloud-talk.dmHistoryLimit`: DM履歴の上限（0で無効。
- `channels.nextcloud-talk.dms`: DMごとのオーバーライド（`historyLimit`）。
- `channels.nextcloud-talk.textChunkLimit`: 送信テキストのチャンクサイズ（文字数）。
- `channels.nextcloud-talk.chunkMode`: `length`（デフォルト）または`newline`。長さで分割する前に空行（段落境界）で分割します。
- `channels.nextcloud-talk.blockStreaming`: このチャンネルのブロックストリーミングを無効化。
- `channels.nextcloud-talk.blockStreamingCoalesce`: ブロックストリーミングのcoalesce調整。
- `channels.nextcloud-talk.mediaMaxMb`: 受信メディア上限（MB）。

## 関連

- [Channels Overview](/channels) — サポートされているすべてのチャンネル
- [Pairing](/channels/pairing) — DM認証とpairingフロー
- [Groups](/channels/groups) — グループチャットの動作とmentionゲート
- [Channel Routing](/channels/channel-routing) — メッセージのセッションルーティング
- [Security](/gateway/security) — アクセスモデルとハードニング
