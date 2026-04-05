---
read_when:
    - Zaloの機能やwebhookに取り組んでいるとき
summary: Zaloボットのサポート状況、機能、設定
title: Zalo
x-i18n:
    generated_at: "2026-04-05T12:38:06Z"
    model: gpt-5.4
    provider: openai
    source_hash: ab94642ba28e79605b67586af8f71c18bc10e0af60343a7df508e6823b6f4119
    source_path: channels/zalo.md
    workflow: 15
---

# Zalo (Bot API)

ステータス: 実験的。DMはサポートされています。以下の[機能](#capabilities)セクションには、現在のMarketplaceボットの挙動が反映されています。

## バンドル済みプラグイン

Zaloは現在のOpenClawリリースにバンドル済みプラグインとして含まれているため、通常のパッケージ済み
ビルドでは別途インストールは不要です。

古いビルドまたはZaloを含まないカスタムインストールを使用している場合は、
手動でインストールしてください。

- CLIでインストール: `openclaw plugins install @openclaw/zalo`
- またはソースチェックアウトから: `openclaw plugins install ./path/to/local/zalo-plugin`
- 詳細: [Plugins](/tools/plugin)

## クイックセットアップ（初級者向け）

1. Zaloプラグインが利用可能であることを確認します。
   - 現在のパッケージ版OpenClawリリースには、すでにバンドルされています。
   - 古い/カスタムインストールでは、上記のコマンドで手動追加できます。
2. トークンを設定します。
   - 環境変数: `ZALO_BOT_TOKEN=...`
   - または設定: `channels.zalo.accounts.default.botToken: "..."`。
3. Gatewayを再起動します（またはセットアップを完了します）。
4. DMアクセスはデフォルトでペアリングです。初回接触時にペアリングコードを承認してください。

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

## これは何か

Zaloはベトナムで広く使われているメッセージングアプリです。そのBot APIにより、Gatewayは1対1の会話用ボットを実行できます。
Zaloへの決定論的な返信ルーティングが必要なサポートや通知に適しています。

このページは、**Zalo Bot Creator / Marketplace bots**に対する現在のOpenClawの挙動を反映しています。
**Zalo Official Account (OA) bots**は別のZalo製品サーフェスであり、挙動が異なる場合があります。

- Gatewayが所有するZalo Bot APIチャンネル。
- 決定論的ルーティング: 返信はZaloに戻り、モデルがチャンネルを選ぶことはありません。
- DMはエージェントのメインセッションを共有します。
- 以下の[機能](#capabilities)セクションに、現在のMarketplaceボットのサポート状況を示しています。

## セットアップ（短縮手順）

### 1) ボットトークンを作成する（Zalo Bot Platform）

1. [https://bot.zaloplatforms.com](https://bot.zaloplatforms.com)にアクセスしてサインインします。
2. 新しいボットを作成し、その設定を行います。
3. 完全なボットトークン（通常は`numeric_id:secret`）をコピーします。Marketplaceボットでは、利用可能なランタイムトークンが作成後のボット歓迎メッセージ内に表示されることがあります。

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

後でグループが利用可能なZaloボットサーフェスへ移行する場合は、`groupPolicy`や`groupAllowFrom`のようなグループ固有設定を明示的に追加できます。現在のMarketplaceボットの挙動については、[機能](#capabilities)を参照してください。

環境変数オプション: `ZALO_BOT_TOKEN=...`（デフォルトアカウントでのみ動作）。

複数アカウント対応: `channels.zalo.accounts`を使用し、アカウントごとのトークンと任意の`name`を設定します。

3. Gatewayを再起動します。Zaloはトークンが解決されると起動します（環境変数または設定）。
4. DMアクセスはデフォルトでペアリングです。ボットに初めて接触したときにコードを承認してください。

## 仕組み（動作）

- 受信メッセージは、メディアプレースホルダー付きの共有チャンネルエンベロープに正規化されます。
- 返信は常に同じZaloチャットにルーティングされます。
- デフォルトはlong-pollingで、`channels.zalo.webhookUrl`を使うとwebhookモードも利用できます。

## 制限

- 送信テキストは2000文字単位に分割されます（Zalo API制限）。
- メディアのダウンロード/アップロードは`channels.zalo.mediaMaxMb`で制限されます（デフォルト5）。
- 2000文字制限によりストリーミングの有用性が低いため、デフォルトでストリーミングはブロックされます。

## アクセス制御（DM）

### DMアクセス

- デフォルト: `channels.zalo.dmPolicy = "pairing"`。不明な送信者にはペアリングコードが返され、承認されるまでメッセージは無視されます（コードは1時間で期限切れ）。
- 承認方法:
  - `openclaw pairing list zalo`
  - `openclaw pairing approve zalo <CODE>`
- ペアリングがデフォルトのトークン交換です。詳細: [Pairing](/channels/pairing)
- `channels.zalo.allowFrom`は数値のユーザーIDを受け付けます（ユーザー名参照は利用不可）。

## アクセス制御（グループ）

**Zalo Bot Creator / Marketplace bots**では、実際にはボットをグループに追加できなかったため、グループサポートは利用できませんでした。

つまり、以下のグループ関連設定キーはスキーマには存在しますが、Marketplaceボットでは使用できませんでした。

- `channels.zalo.groupPolicy`は、グループ受信処理を制御します: `open | allowlist | disabled`。
- `channels.zalo.groupAllowFrom`は、グループ内でどの送信者IDがボットをトリガーできるかを制限します。
- `groupAllowFrom`が未設定の場合、Zaloは送信者チェックに`allowFrom`へフォールバックします。
- ランタイム注記: `channels.zalo`自体が完全に欠落している場合でも、安全のためランタイムは引き続き`groupPolicy="allowlist"`へフォールバックします。

グループポリシーの値（利用しているボットサーフェスでグループアクセスが可能な場合）は次のとおりです。

- `groupPolicy: "disabled"` — すべてのグループメッセージをブロックします。
- `groupPolicy: "open"` — 任意のグループメンバーを許可します（メンション制御あり）。
- `groupPolicy: "allowlist"` — fail-closedのデフォルトで、許可された送信者のみ受け付けます。

異なるZaloボット製品サーフェスを使用しており、グループ挙動が動作することを確認している場合は、Marketplaceボットのフローと同じだと仮定せず、別途文書化してください。

## Long-polling と webhook

- デフォルト: long-polling（公開URL不要）。
- webhookモード: `channels.zalo.webhookUrl`と`channels.zalo.webhookSecret`を設定します。
  - webhookシークレットは8～256文字である必要があります。
  - webhook URLはHTTPSを使用する必要があります。
  - Zaloは検証用に`X-Bot-Api-Secret-Token`ヘッダー付きでイベントを送信します。
  - Gateway HTTPは`channels.zalo.webhookPath`でwebhookリクエストを処理します（デフォルトはwebhook URLのパス）。
  - リクエストは`Content-Type: application/json`（または`+json`メディアタイプ）を使用する必要があります。
  - 重複イベント（`event_name + message_id`）は短いリプレイウィンドウの間、無視されます。
  - バーストトラフィックはパス/送信元ごとにレート制限され、HTTP 429が返る場合があります。

**注:** Zalo APIドキュメントによると、getUpdates（polling）とwebhookは相互排他的です。

## サポートされるメッセージタイプ

簡単なサポート状況は[機能](#capabilities)を参照してください。以下の注記では、追加の文脈が必要な挙動を補足しています。

- **テキストメッセージ**: 2000文字分割付きで完全サポート。
- **テキスト内のプレーンURL**: 通常のテキスト入力と同様に動作します。
- **リンクプレビュー / リッチリンクカード**: [機能](#capabilities)のMarketplaceボット状況を参照してください。安定して返信をトリガーしませんでした。
- **画像メッセージ**: [機能](#capabilities)のMarketplaceボット状況を参照してください。受信画像処理は不安定でした（入力中表示は出るが最終返信なし）。
- **ステッカー**: [機能](#capabilities)のMarketplaceボット状況を参照してください。
- **ボイスノート / 音声ファイル / 動画 / 汎用ファイル添付**: [機能](#capabilities)のMarketplaceボット状況を参照してください。
- **未対応タイプ**: ログ出力されます（例: 保護されたユーザーからのメッセージ）。

## 機能

この表は、OpenClawにおける現在の**Zalo Bot Creator / Marketplace bot**の挙動をまとめたものです。

| 機能 | ステータス |
| --------------------------- | --------------------------------------- |
| ダイレクトメッセージ | ✅ サポート |
| グループ | ❌ Marketplaceボットでは利用不可 |
| メディア（受信画像） | ⚠️ 限定的 / 環境で要確認 |
| メディア（送信画像） | ⚠️ Marketplaceボットでは未再検証 |
| テキスト内のプレーンURL | ✅ サポート |
| リンクプレビュー | ⚠️ Marketplaceボットでは不安定 |
| リアクション | ❌ 未サポート |
| ステッカー | ⚠️ Marketplaceボットではエージェント返信なし |
| ボイスノート / 音声 / 動画 | ⚠️ Marketplaceボットではエージェント返信なし |
| ファイル添付 | ⚠️ Marketplaceボットではエージェント返信なし |
| スレッド | ❌ 未サポート |
| Polls | ❌ 未サポート |
| ネイティブコマンド | ❌ 未サポート |
| ストリーミング | ⚠️ ブロック済み（2000文字制限） |

## 配信先ターゲット（CLI/cron）

- ターゲットにはchat idを使用します。
- 例: `openclaw message send --channel zalo --target 123456789 --message "hi"`。

## トラブルシューティング

**ボットが応答しない:**

- トークンが有効か確認する: `openclaw channels status --probe`
- 送信者が承認済みであることを確認する（ペアリングまたはallowFrom）
- Gatewayログを確認する: `openclaw logs --follow`

**webhookでイベントを受信しない:**

- webhook URLがHTTPSを使用していることを確認する
- シークレットトークンが8～256文字であることを確認する
- 設定されたパスでGateway HTTPエンドポイントに到達できることを確認する
- getUpdates pollingが実行中でないことを確認する（相互排他的です）

## 設定リファレンス（Zalo）

完全な設定: [Configuration](/gateway/configuration)

フラットなトップレベルキー（`channels.zalo.botToken`、`channels.zalo.dmPolicy`など）は、レガシーな単一アカウント用ショートハンドです。新しい設定では`channels.zalo.accounts.<id>.*`を推奨します。両方の形式はスキーマ内に存在するため、ここでも引き続き文書化しています。

プロバイダーオプション:

- `channels.zalo.enabled`: チャンネル起動を有効化/無効化します。
- `channels.zalo.botToken`: Zalo Bot Platformのボットトークン。
- `channels.zalo.tokenFile`: 通常のファイルパスからトークンを読み取ります。symlinkは拒否されます。
- `channels.zalo.dmPolicy`: `pairing | allowlist | open | disabled`（デフォルト: pairing）。
- `channels.zalo.allowFrom`: DM許可リスト（ユーザーID）。`open`には`"*"`が必要です。ウィザードでは数値IDを尋ねます。
- `channels.zalo.groupPolicy`: `open | allowlist | disabled`（デフォルト: allowlist）。設定には存在します。現在のMarketplaceボットの挙動については、[機能](#capabilities)および[アクセス制御（グループ）](#access-control-groups)を参照してください。
- `channels.zalo.groupAllowFrom`: グループ送信者許可リスト（ユーザーID）。未設定時は`allowFrom`へフォールバックします。
- `channels.zalo.mediaMaxMb`: 受信/送信メディア上限（MB、デフォルト5）。
- `channels.zalo.webhookUrl`: webhookモードを有効化します（HTTPS必須）。
- `channels.zalo.webhookSecret`: webhookシークレット（8～256文字）。
- `channels.zalo.webhookPath`: Gateway HTTPサーバー上のwebhookパス。
- `channels.zalo.proxy`: APIリクエスト用プロキシURL。

複数アカウントオプション:

- `channels.zalo.accounts.<id>.botToken`: アカウントごとのトークン。
- `channels.zalo.accounts.<id>.tokenFile`: アカウントごとの通常のトークンファイル。symlinkは拒否されます。
- `channels.zalo.accounts.<id>.name`: 表示名。
- `channels.zalo.accounts.<id>.enabled`: アカウントを有効化/無効化します。
- `channels.zalo.accounts.<id>.dmPolicy`: アカウントごとのDMポリシー。
- `channels.zalo.accounts.<id>.allowFrom`: アカウントごとの許可リスト。
- `channels.zalo.accounts.<id>.groupPolicy`: アカウントごとのグループポリシー。設定には存在します。現在のMarketplaceボットの挙動については、[機能](#capabilities)および[アクセス制御（グループ）](#access-control-groups)を参照してください。
- `channels.zalo.accounts.<id>.groupAllowFrom`: アカウントごとのグループ送信者許可リスト。
- `channels.zalo.accounts.<id>.webhookUrl`: アカウントごとのwebhook URL。
- `channels.zalo.accounts.<id>.webhookSecret`: アカウントごとのwebhookシークレット。
- `channels.zalo.accounts.<id>.webhookPath`: アカウントごとのwebhookパス。
- `channels.zalo.accounts.<id>.proxy`: アカウントごとのプロキシURL。

## 関連

- [Channels Overview](/channels) — サポートされるすべてのチャンネル
- [Pairing](/channels/pairing) — DM認証とペアリングフロー
- [Groups](/channels/groups) — グループチャットの挙動とメンション制御
- [Channel Routing](/channels/channel-routing) — メッセージのセッションルーティング
- [Security](/gateway/security) — アクセスモデルとハードニング
