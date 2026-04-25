---
read_when:
    - OpenClawをQQに接続したい場合
    - QQ Botの認証情報設定が必要です
    - QQ Botでグループチャットまたはプライベートチャットを使いたい場合
summary: QQ Botのセットアップ、設定、使用方法
title: QQ bot
x-i18n:
    generated_at: "2026-04-25T13:42:01Z"
    model: gpt-5.4
    provider: openai
    source_hash: 1219f8d6ca3996272b293cc042364300f0fdfea6c7f19585e4ee514ac2182d46
    source_path: channels/qqbot.md
    workflow: 15
---

QQ Botは公式QQ Bot API（WebSocket Gateway）経由でOpenClawに接続します。
このpluginは、C2Cプライベートチャット、グループ@メッセージ、ギルドチャネルメッセージに対応しており、
リッチメディア（画像、音声、動画、ファイル）も扱えます。

ステータス: バンドル済みplugin。ダイレクトメッセージ、グループチャット、ギルドチャネル、
メディアに対応しています。リアクションとスレッドには対応していません。

## バンドル済みplugin

現在のOpenClawリリースにはQQ Botがバンドルされているため、通常のパッケージ版ビルドでは
別途`openclaw plugins install`を実行する必要はありません。

## セットアップ

1. [QQ Open Platform](https://q.qq.com/)にアクセスし、スマートフォンのQQでQRコードをスキャンして
   登録 / ログインします。
2. **Create Bot**をクリックして、新しいQQ botを作成します。
3. botの設定ページで**AppID**と**AppSecret**を見つけてコピーします。

> AppSecretは平文では保存されません。保存せずにページを離れると、
> 新しいものを再生成する必要があります。

4. チャネルを追加します:

```bash
openclaw channels add --channel qqbot --token "AppID:AppSecret"
```

5. Gatewayを再起動します。

対話型セットアップ手順:

```bash
openclaw channels add
openclaw configure --section channels
```

## 設定

最小構成:

```json5
{
  channels: {
    qqbot: {
      enabled: true,
      appId: "YOUR_APP_ID",
      clientSecret: "YOUR_APP_SECRET",
    },
  },
}
```

デフォルトアカウント用の環境変数:

- `QQBOT_APP_ID`
- `QQBOT_CLIENT_SECRET`

ファイルベースのAppSecret:

```json5
{
  channels: {
    qqbot: {
      enabled: true,
      appId: "YOUR_APP_ID",
      clientSecretFile: "/path/to/qqbot-secret.txt",
    },
  },
}
```

注意:

- 環境変数のフォールバックは、デフォルトのQQ Botアカウントにのみ適用されます。
- `openclaw channels add --channel qqbot --token-file ...`で指定されるのは
  AppSecretのみです。AppIDは、事前に設定または`QQBOT_APP_ID`で指定されている必要があります。
- `clientSecret`は、平文文字列だけでなくSecretRef入力も受け付けます。

### マルチアカウント設定

1つのOpenClawインスタンスで複数のQQ botを実行できます:

```json5
{
  channels: {
    qqbot: {
      enabled: true,
      appId: "111111111",
      clientSecret: "secret-of-bot-1",
      accounts: {
        bot2: {
          enabled: true,
          appId: "222222222",
          clientSecret: "secret-of-bot-2",
        },
      },
    },
  },
}
```

各アカウントは独自のWebSocket接続を起動し、独立した
トークンキャッシュ（`appId`ごとに分離）を維持します。

CLIで2つ目のbotを追加するには:

```bash
openclaw channels add --channel qqbot --account bot2 --token "222222222:secret-of-bot-2"
```

### 音声（STT / TTS）

STTとTTSは、優先フォールバック付きの2段階設定に対応しています:

| 設定 | plugin固有      | フレームワークのフォールバック            |
| ------- | -------------------- | ----------------------------- |
| STT     | `channels.qqbot.stt` | `tools.media.audio.models[0]` |
| TTS     | `channels.qqbot.tts` | `messages.tts`                |

```json5
{
  channels: {
    qqbot: {
      stt: {
        provider: "your-provider",
        model: "your-stt-model",
      },
      tts: {
        provider: "your-provider",
        model: "your-tts-model",
        voice: "your-voice",
      },
    },
  },
}
```

無効にするには、どちらかに`enabled: false`を設定します。

受信したQQの音声添付ファイルは、未加工の音声ファイルを汎用の`MediaPaths`に含めず、
音声メディアメタデータとしてエージェントに公開されます。TTSが設定されている場合、
`[[audio_as_voice]]`プレーンテキスト返信はTTSを合成し、ネイティブなQQ音声メッセージとして送信されます。

送信音声のアップロード/トランスコード動作は、
`channels.qqbot.audioFormatPolicy`で調整することもできます:

- `sttDirectFormats`
- `uploadDirectFormats`
- `transcodeEnabled`

## 対象形式

| 形式                     | 説明        |
| -------------------------- | ------------------ |
| `qqbot:c2c:OPENID`         | プライベートチャット（C2C） |
| `qqbot:group:GROUP_OPENID` | グループチャット         |
| `qqbot:channel:CHANNEL_ID` | ギルドチャネル      |

> 各botはそれぞれ独自のユーザーOpenIDセットを持ちます。Bot Aで受け取ったOpenIDは、Bot B経由でメッセージ送信に**使用できません**。

## スラッシュコマンド

AIキューの前にインターセプトされる組み込みコマンド:

| コマンド        | 説明                                                                                              |
| -------------- | -------------------------------------------------------------------------------------------------------- |
| `/bot-ping`    | レイテンシテスト                                                                                             |
| `/bot-version` | OpenClawフレームワークのバージョンを表示                                                                      |
| `/bot-help`    | すべてのコマンドを一覧表示                                                                                        |
| `/bot-upgrade` | QQBotアップグレードガイドへのリンクを表示                                                                        |
| `/bot-logs`    | 最近のGatewayログをファイルとしてエクスポート                                                                     |
| `/bot-approve` | 保留中のQQ Botアクション（たとえば、C2Cまたはグループアップロードの確認）をネイティブフローで承認します。 |

任意のコマンドに`?`を付けると使い方ヘルプを表示します（例: `/bot-upgrade ?`）。

## エンジンアーキテクチャ

QQ Botはplugin内の自己完結型エンジンとして提供されます:

- 各アカウントは、`appId`をキーとした分離済みリソーススタック（WebSocket接続、APIクライアント、トークンキャッシュ、メディア保存ルート）を所有します。アカウント間で受信/送信状態が共有されることはありません。
- マルチアカウントロガーは、実行中のアカウントでログ行にタグを付けるため、複数のbotを1つのgatewayで動かしても診断を分離できます。
- 受信、送信、Gatewayブリッジの各経路は、`~/.openclaw/media`配下の単一メディアペイロードルートを共有するため、アップロード、ダウンロード、トランスコードキャッシュは、サブシステムごとのツリーではなく1つの保護されたディレクトリに保存されます。
- 認証情報は、標準のOpenClaw認証情報スナップショットの一部としてバックアップおよび復元できます。エンジンは復元時に、各アカウントのリソーススタックを再接続し、新たなQRコードペアリングを必要としません。

## QRコードによるオンボーディング

`AppID:AppSecret`を手動で貼り付ける代わりに、エンジンはQQ BotをOpenClawにリンクするためのQRコードによるオンボーディングフローにも対応しています:

1. QQ Botセットアップ手順を実行し（例: `openclaw channels add --channel qqbot`）、プロンプトが表示されたらQRコードフローを選択します。
2. 対象のQQ Botに紐づくスマートフォンアプリで、生成されたQRコードをスキャンします。
3. スマートフォンでペアリングを承認します。OpenClawは、返された認証情報を適切なアカウントスコープの`credentials/`に永続化します。

bot自身が生成する承認プロンプト（たとえば、QQ Bot APIが公開する「この操作を許可しますか？」フロー）は、ネイティブなOpenClawプロンプトとして表示され、未加工のQQクライアント経由で返信する代わりに`/bot-approve`で受け付けできます。

## トラブルシューティング

- **botの返信が「gone to Mars」になる:** 認証情報が設定されていないか、Gatewayが起動していません。
- **受信メッセージが来ない:** `appId`と`clientSecret`が正しいこと、および
  QQ Open Platformでbotが有効化されていることを確認してください。
- **`--token-file`で設定しても未設定のまま表示される:** `--token-file`で設定されるのは
  AppSecretのみです。AppIDは設定または`QQBOT_APP_ID`で指定する必要があります。
- **能動的に送ったメッセージが届かない:** ユーザーが最近やり取りしていない場合、
  QQがbot発のメッセージを遮断することがあります。
- **音声が文字起こしされない:** STTが設定されており、プロバイダーに到達可能であることを確認してください。

## 関連

- [Pairing](/ja-JP/channels/pairing)
- [Groups](/ja-JP/channels/groups)
- [Channel troubleshooting](/ja-JP/channels/troubleshooting)
