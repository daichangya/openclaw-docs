---
read_when:
    - Nextcloud Talkチャンネル機能に取り組む
summary: Nextcloud Talkのサポート状況、機能、および設定
title: Nextcloud Talk
x-i18n:
    generated_at: "2026-04-24T08:57:05Z"
    model: gpt-5.4
    provider: openai
    source_hash: 9a3af391ffa445ef1ebc7877a1158c3c6aa7ecc71ceadcb0e783a80b040fe062
    source_path: channels/nextcloud-talk.md
    workflow: 15
---

ステータス: バンドル済みPlugin（Webhookボット）。ダイレクトメッセージ、ルーム、リアクション、Markdownメッセージをサポートしています。

## バンドル済みPlugin

Nextcloud Talkは現在のOpenClawリリースではバンドル済みPluginとして提供されているため、
通常のパッケージ版ビルドでは別途インストールは不要です。

古いビルドまたはNextcloud Talkを含まないカスタムインストールを使用している場合は、
手動でインストールしてください。

CLI経由でインストール（npmレジストリ）:

```bash
openclaw plugins install @openclaw/nextcloud-talk
```

ローカルチェックアウト（gitリポジトリから実行している場合）:

```bash
openclaw plugins install ./path/to/local/nextcloud-talk-plugin
```

詳細: [Plugins](/ja-JP/tools/plugin)

## クイックセットアップ（初級者向け）

1. Nextcloud Talk Pluginが利用可能であることを確認します。
   - 現在のパッケージ版OpenClawリリースにはすでにバンドルされています。
   - 古い/カスタムインストールでは、上記のコマンドで手動追加できます。
2. Nextcloudサーバー上でボットを作成します:

   ```bash
   ./occ talk:bot:install "OpenClaw" "<shared-secret>" "<webhook-url>" --feature reaction
   ```

3. 対象ルームの設定でボットを有効にします。
4. OpenClawを設定します:
   - 設定: `channels.nextcloud-talk.baseUrl` + `channels.nextcloud-talk.botSecret`
   - または環境変数: `NEXTCLOUD_TALK_BOT_SECRET`（デフォルトアカウントのみ）

   CLIセットアップ:

   ```bash
   openclaw channels add --channel nextcloud-talk \
     --url https://cloud.example.com \
     --token "<shared-secret>"
   ```

   同等の明示的フィールド:

   ```bash
   openclaw channels add --channel nextcloud-talk \
     --base-url https://cloud.example.com \
     --secret "<shared-secret>"
   ```

   ファイルベースのシークレット:

   ```bash
   openclaw channels add --channel nextcloud-talk \
     --base-url https://cloud.example.com \
     --secret-file /path/to/nextcloud-talk-secret
   ```

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

## 注意事項

- ボットはDMを開始できません。ユーザー側が先にボットへメッセージを送る必要があります。
- Webhook URLはGatewayから到達可能である必要があります。プロキシの背後にある場合は`webhookPublicUrl`を設定してください。
- ボットAPIはメディアアップロードをサポートしていないため、メディアはURLとして送信されます。
- WebhookペイロードではDMとルームを区別できません。ルーム種別の照会を有効にするには`apiUser` + `apiPassword`を設定してください（設定しない場合、DMはルームとして扱われます）。

## アクセス制御（DM）

- デフォルト: `channels.nextcloud-talk.dmPolicy = "pairing"`。未確認の送信者にはペアリングコードが送られます。
- 承認方法:
  - `openclaw pairing list nextcloud-talk`
  - `openclaw pairing approve nextcloud-talk <CODE>`
- 公開DM: `channels.nextcloud-talk.dmPolicy="open"` に加えて `channels.nextcloud-talk.allowFrom=["*"]`。
- `allowFrom`はNextcloudのユーザーIDのみに一致します。表示名は無視されます。

## ルーム（グループ）

- デフォルト: `channels.nextcloud-talk.groupPolicy = "allowlist"`（メンションゲートあり）。
- `channels.nextcloud-talk.rooms`でルームを許可リストに追加します:

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

- ルームを一切許可しない場合は、許可リストを空のままにするか、`channels.nextcloud-talk.groupPolicy="disabled"`を設定してください。

## 機能

| 機能 | ステータス |
| --------------- | ------------- |
| ダイレクトメッセージ | サポート済み |
| ルーム | サポート済み |
| スレッド | 非サポート |
| メディア | URLのみ |
| リアクション | サポート済み |
| ネイティブコマンド | 非サポート |

## 設定リファレンス（Nextcloud Talk）

完全な設定: [Configuration](/ja-JP/gateway/configuration)

プロバイダーオプション:

- `channels.nextcloud-talk.enabled`: チャンネル起動の有効/無効。
- `channels.nextcloud-talk.baseUrl`: NextcloudインスタンスURL。
- `channels.nextcloud-talk.botSecret`: ボット共有シークレット。
- `channels.nextcloud-talk.botSecretFile`: 通常ファイルのシークレットパス。シンボリックリンクは拒否されます。
- `channels.nextcloud-talk.apiUser`: ルーム照会用APIユーザー（DM検出）。
- `channels.nextcloud-talk.apiPassword`: ルーム照会用API/アプリパスワード。
- `channels.nextcloud-talk.apiPasswordFile`: APIパスワードファイルのパス。
- `channels.nextcloud-talk.webhookPort`: Webhookリスナーポート（デフォルト: 8788）。
- `channels.nextcloud-talk.webhookHost`: Webhookホスト（デフォルト: 0.0.0.0）。
- `channels.nextcloud-talk.webhookPath`: Webhookパス（デフォルト: /nextcloud-talk-webhook）。
- `channels.nextcloud-talk.webhookPublicUrl`: 外部から到達可能なWebhook URL。
- `channels.nextcloud-talk.dmPolicy`: `pairing | allowlist | open | disabled`。
- `channels.nextcloud-talk.allowFrom`: DM許可リスト（ユーザーID）。`open`には`"*"`が必要です。
- `channels.nextcloud-talk.groupPolicy`: `allowlist | open | disabled`。
- `channels.nextcloud-talk.groupAllowFrom`: グループ許可リスト（ユーザーID）。
- `channels.nextcloud-talk.rooms`: ルームごとの設定と許可リスト。
- `channels.nextcloud-talk.historyLimit`: グループ履歴上限（0で無効）。
- `channels.nextcloud-talk.dmHistoryLimit`: DM履歴上限（0で無効）。
- `channels.nextcloud-talk.dms`: DMごとの上書き設定（historyLimit）。
- `channels.nextcloud-talk.textChunkLimit`: 送信テキストのチャンクサイズ（文字数）。
- `channels.nextcloud-talk.chunkMode`: `length`（デフォルト）または`newline`。長さベースの分割前に空行（段落区切り）で分割します。
- `channels.nextcloud-talk.blockStreaming`: このチャンネルのブロックストリーミングを無効化します。
- `channels.nextcloud-talk.blockStreamingCoalesce`: ブロックストリーミングのcoalesce調整。
- `channels.nextcloud-talk.mediaMaxMb`: 受信メディア上限（MB）。

## 関連

- [Channels Overview](/ja-JP/channels) — サポートされているすべてのチャンネル
- [Pairing](/ja-JP/channels/pairing) — DM認証とペアリングフロー
- [Groups](/ja-JP/channels/groups) — グループチャットの動作とメンションゲート
- [Channel Routing](/ja-JP/channels/channel-routing) — メッセージのセッションルーティング
- [Security](/ja-JP/gateway/security) — アクセスモデルとハードニング
