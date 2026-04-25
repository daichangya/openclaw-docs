---
read_when:
    - Zaloの機能またはWebhooksに取り組んでいる場合
summary: Zalo botのサポート状況、機能、設定
title: Zalo
x-i18n:
    generated_at: "2026-04-25T13:42:33Z"
    model: gpt-5.4
    provider: openai
    source_hash: e7eb9d5b1879fcdf70220c4b1542e843e47e12048ff567eeb0e1cb3367b3d200
    source_path: channels/zalo.md
    workflow: 15
---

ステータス: 実験的。DMに対応しています。以下の[機能](#capabilities)セクションは、現在のMarketplace botの挙動を反映しています。

## バンドル済みplugin

Zaloは現在のOpenClawリリースではバンドル済みpluginとして提供されるため、通常のパッケージ版
ビルドでは別途インストールは不要です。

古いビルドや、Zaloを含まないカスタムインストールを使用している場合は、
手動でインストールしてください。

- CLIでインストール: `openclaw plugins install @openclaw/zalo`
- またはソースチェックアウトから: `openclaw plugins install ./path/to/local/zalo-plugin`
- 詳細: [Plugins](/ja-JP/tools/plugin)

## クイックセットアップ（初心者向け）

1. Zalo pluginが利用可能であることを確認します。
   - 現在のパッケージ版OpenClawリリースにはすでにバンドルされています。
   - 古い/カスタムインストールでは、上記のコマンドで手動追加できます。
2. トークンを設定します。
   - 環境変数: `ZALO_BOT_TOKEN=...`
   - または設定: `channels.zalo.accounts.default.botToken: "..."`。
3. gatewayを再起動します（またはセットアップを完了します）。
4. DMアクセスはデフォルトでペアリングです。初回接触時にペアリングコードを承認します。

最小構成:

```json5
{
  channels: {
    zalo: {
      enabled: true,
      accounts: {
        default: {
          botToken: "12345689:abc-xyz",
          dmPolicy: "pairing",
        },
      },
    },
  },
}
```

## 概要

Zaloはベトナム向けのメッセージングアプリです。そのBot APIにより、Gatewayは1対1会話用のbotを実行できます。
Zaloへ確実に返信を戻したいサポートや通知の用途に適しています。

このページは、**Zalo Bot Creator / Marketplace bots**に対する現在のOpenClawの挙動を反映しています。
**Zalo Official Account (OA) bots**は別のZalo製品面であり、挙動が異なる場合があります。

- Gatewayが所有するZalo Bot APIチャネルです。
- 決定的ルーティング: 返信はZaloに戻ります。モデルがチャネルを選ぶことはありません。
- DMはエージェントのメインセッションを共有します。
- 以下の[機能](#capabilities)セクションに、現在のMarketplace botのサポート状況を示します。

## セットアップ（最短手順）

### 1) botトークンを作成する（Zalo Bot Platform）

1. [https://bot.zaloplatforms.com](https://bot.zaloplatforms.com)にアクセスしてサインインします。
2. 新しいbotを作成し、設定を構成します。
3. 完全なbotトークン（通常は`numeric_id:secret`）をコピーします。Marketplace botでは、作成後のbotのウェルカムメッセージに実行時に使えるトークンが表示されることがあります。

### 2) トークンを設定する（環境変数または設定）

例:

```json5
{
  channels: {
    zalo: {
      enabled: true,
      accounts: {
        default: {
          botToken: "12345689:abc-xyz",
          dmPolicy: "pairing",
        },
      },
    },
  },
}
```

後でグループが利用可能なZalo bot製品面に移行する場合は、`groupPolicy`や`groupAllowFrom`などのグループ固有設定を明示的に追加できます。現在のMarketplace botの挙動については、[機能](#capabilities)を参照してください。

環境変数オプション: `ZALO_BOT_TOKEN=...`（デフォルトアカウントでのみ動作）。

マルチアカウント対応: アカウントごとのトークンと任意の`name`を指定して`channels.zalo.accounts`を使います。

3. gatewayを再起動します。Zaloはトークンが解決されると開始されます（環境変数または設定）。
4. DMアクセスはデフォルトでペアリングです。botに最初に接触したときにコードを承認します。

## 仕組み（挙動）

- 受信メッセージは、メディアプレースホルダー付きの共有チャネルエンベロープへ正規化されます。
- 返信は常に同じZaloチャットに戻ります。
- デフォルトではロングポーリングです。`channels.zalo.webhookUrl`でWebhookモードも利用できます。

## 制限

- 送信テキストは2000文字単位に分割されます（Zalo APIの制限）。
- メディアのダウンロード/アップロードは`channels.zalo.mediaMaxMb`（デフォルト5）で上限が設定されます。
- 2000文字制限によりストリーミングの利点が小さいため、ストリーミングはデフォルトでブロックされます。

## アクセス制御（DM）

### DMアクセス

- デフォルト: `channels.zalo.dmPolicy = "pairing"`。不明な送信者にはペアリングコードが送られ、承認されるまでメッセージは無視されます（コードは1時間で期限切れ）。
- 承認方法:
  - `openclaw pairing list zalo`
  - `openclaw pairing approve zalo <CODE>`
- ペアリングがデフォルトのトークン交換方式です。詳細: [Pairing](/ja-JP/channels/pairing)
- `channels.zalo.allowFrom`は数値のユーザーIDを受け付けます（ユーザー名の検索は利用できません）。

## アクセス制御（グループ）

**Zalo Bot Creator / Marketplace bots**では、bot自体をグループに追加できなかったため、実際にはグループ対応は利用できませんでした。

つまり、以下のグループ関連設定キーはスキーマには存在しますが、Marketplace botでは使用できませんでした。

- `channels.zalo.groupPolicy`はグループ受信処理を制御します: `open | allowlist | disabled`。
- `channels.zalo.groupAllowFrom`は、グループ内でbotをトリガーできる送信者IDを制限します。
- `groupAllowFrom`が未設定の場合、Zaloは送信者チェックに`allowFrom`へフォールバックします。
- ランタイム注記: `channels.zalo`自体が完全に存在しない場合でも、安全のためランタイムは`groupPolicy="allowlist"`へフォールバックします。

グループポリシーの値（使用中のbot製品面でグループアクセスが利用可能な場合）は次のとおりです。

- `groupPolicy: "disabled"` — すべてのグループメッセージをブロックします。
- `groupPolicy: "open"` — 任意のグループメンバーを許可します（メンションゲートあり）。
- `groupPolicy: "allowlist"` — フェイルクローズドのデフォルトです。許可された送信者のみ受け付けます。

異なるZalo bot製品面を使用しており、グループ挙動が機能することを確認済みの場合は、Marketplace botのフローと同じだと仮定せず、別途文書化してください。

## ロングポーリングとWebhook

- デフォルト: ロングポーリング（公開URL不要）。
- Webhookモード: `channels.zalo.webhookUrl`と`channels.zalo.webhookSecret`を設定します。
  - Webhook secretは8〜256文字である必要があります。
  - Webhook URLはHTTPSを使用する必要があります。
  - Zaloは検証用に`X-Bot-Api-Secret-Token`ヘッダー付きでイベントを送信します。
  - Gateway HTTPは`channels.zalo.webhookPath`でWebhookリクエストを処理します（デフォルトはWebhook URLのパス）。
  - リクエストは`Content-Type: application/json`（または`+json`メディアタイプ）を使用する必要があります。
  - 重複イベント（`event_name + message_id`）は短いリプレイウィンドウの間無視されます。
  - バーストトラフィックはパス/送信元ごとにレート制限され、HTTP 429を返す場合があります。

**注:** Zalo APIドキュメントによると、getUpdates（ポーリング）とWebhookは相互排他的です。

## 対応メッセージタイプ

簡単なサポート状況の概要は[機能](#capabilities)を参照してください。以下の注記では、追加の文脈が必要な挙動を補足します。

- **テキストメッセージ**: 2000文字分割付きで完全対応。
- **テキスト内のプレーンURL**: 通常のテキスト入力として扱われます。
- **リンクプレビュー / リッチリンクカード**: [機能](#capabilities)のMarketplace botのステータスを参照してください。安定して返信をトリガーしませんでした。
- **画像メッセージ**: [機能](#capabilities)のMarketplace botのステータスを参照してください。受信画像の処理は不安定でした（入力中インジケーターは出るが最終返信がない）。
- **ステッカー**: [機能](#capabilities)のMarketplace botのステータスを参照してください。
- **ボイスノート / 音声ファイル / 動画 / 汎用ファイル添付**: [機能](#capabilities)のMarketplace botのステータスを参照してください。
- **未対応の種類**: ログに記録されます（例: 保護されたユーザーからのメッセージ）。

## 機能

この表は、OpenClawにおける現在の**Zalo Bot Creator / Marketplace bot**の挙動を要約しています。

| 機能 | ステータス |
| --------------------------- | --------------------------------------- |
| ダイレクトメッセージ             | ✅ 対応済み                            |
| グループ                      | ❌ Marketplace botでは利用不可   |
| メディア（受信画像）      | ⚠️ 制限あり / 環境で要確認 |
| メディア（送信画像）     | ⚠️ Marketplace botでは未再検証   |
| テキスト内のプレーンURL          | ✅ 対応済み                            |
| リンクプレビュー               | ⚠️ Marketplace botでは不安定      |
| リアクション                   | ❌ 非対応                        |
| ステッカー                    | ⚠️ Marketplace botではエージェント返信なし  |
| ボイスノート / 音声 / 動画 | ⚠️ Marketplace botではエージェント返信なし  |
| ファイル添付            | ⚠️ Marketplace botではエージェント返信なし  |
| スレッド                     | ❌ 非対応                        |
| Polls                       | ❌ 非対応                        |
| ネイティブコマンド             | ❌ 非対応                        |
| ストリーミング                   | ⚠️ ブロック済み（2000文字制限）            |

## 配信ターゲット（CLI/Cron）

- ターゲットにはchat idを使用します。
- 例: `openclaw message send --channel zalo --target 123456789 --message "hi"`。

## トラブルシューティング

**botが応答しない場合:**

- トークンが有効か確認します: `openclaw channels status --probe`
- 送信者が承認済みであることを確認します（ペアリングまたはallowFrom）
- gatewayログを確認します: `openclaw logs --follow`

**Webhookがイベントを受信しない場合:**

- Webhook URLがHTTPSを使用していることを確認します
- secret tokenが8〜256文字であることを確認します
- 設定されたパスでGateway HTTPエンドポイントに到達可能であることを確認します
- getUpdatesポーリングが動作していないことを確認します（相互排他的です）

## 設定リファレンス（Zalo）

完全な設定: [Configuration](/ja-JP/gateway/configuration)

フラットなトップレベルキー（`channels.zalo.botToken`、`channels.zalo.dmPolicy`など）は、レガシーな単一アカウント用ショートハンドです。新しい設定では`channels.zalo.accounts.<id>.*`を優先してください。どちらの形式もスキーマに存在するため、ここでは引き続き記載しています。

プロバイダーオプション:

- `channels.zalo.enabled`: チャネル起動の有効/無効。
- `channels.zalo.botToken`: Zalo Bot Platformのbotトークン。
- `channels.zalo.tokenFile`: 通常ファイルパスからトークンを読み取ります。シンボリックリンクは拒否されます。
- `channels.zalo.dmPolicy`: `pairing | allowlist | open | disabled`（デフォルト: pairing）。
- `channels.zalo.allowFrom`: DM許可リスト（ユーザーID）。`open`には`"*"`が必要です。ウィザードでは数値IDの入力を求めます。
- `channels.zalo.groupPolicy`: `open | allowlist | disabled`（デフォルト: allowlist）。設定には存在します。現在のMarketplace botの挙動については[機能](#capabilities)と[アクセス制御（グループ）](#access-control-groups)を参照してください。
- `channels.zalo.groupAllowFrom`: グループ送信者許可リスト（ユーザーID）。未設定の場合は`allowFrom`へフォールバックします。
- `channels.zalo.mediaMaxMb`: 受信/送信メディア上限（MB、デフォルト5）。
- `channels.zalo.webhookUrl`: Webhookモードを有効化します（HTTPS必須）。
- `channels.zalo.webhookSecret`: Webhook secret（8〜256文字）。
- `channels.zalo.webhookPath`: gateway HTTPサーバー上のWebhookパス。
- `channels.zalo.proxy`: APIリクエスト用のプロキシURL。

マルチアカウントオプション:

- `channels.zalo.accounts.<id>.botToken`: アカウントごとのトークン。
- `channels.zalo.accounts.<id>.tokenFile`: アカウントごとの通常トークンファイル。シンボリックリンクは拒否されます。
- `channels.zalo.accounts.<id>.name`: 表示名。
- `channels.zalo.accounts.<id>.enabled`: アカウントの有効/無効。
- `channels.zalo.accounts.<id>.dmPolicy`: アカウントごとのDMポリシー。
- `channels.zalo.accounts.<id>.allowFrom`: アカウントごとの許可リスト。
- `channels.zalo.accounts.<id>.groupPolicy`: アカウントごとのグループポリシー。設定には存在します。現在のMarketplace botの挙動については[機能](#capabilities)と[アクセス制御（グループ）](#access-control-groups)を参照してください。
- `channels.zalo.accounts.<id>.groupAllowFrom`: アカウントごとのグループ送信者許可リスト。
- `channels.zalo.accounts.<id>.webhookUrl`: アカウントごとのWebhook URL。
- `channels.zalo.accounts.<id>.webhookSecret`: アカウントごとのWebhook secret。
- `channels.zalo.accounts.<id>.webhookPath`: アカウントごとのWebhookパス。
- `channels.zalo.accounts.<id>.proxy`: アカウントごとのプロキシURL。

## 関連

- [Channels Overview](/ja-JP/channels) — すべての対応チャネル
- [Pairing](/ja-JP/channels/pairing) — DM認証とペアリングフロー
- [Groups](/ja-JP/channels/groups) — グループチャットの挙動とメンションゲート
- [Channel Routing](/ja-JP/channels/channel-routing) — メッセージのセッションルーティング
- [Security](/ja-JP/gateway/security) — アクセスモデルとハードニング
