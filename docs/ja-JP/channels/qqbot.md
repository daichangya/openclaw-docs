---
read_when:
    - OpenClawをQQに接続したい場合
    - QQ Botの認証情報設定が必要です
    - QQ Botのグループチャットまたはプライベートチャットのサポートを使いたい場合
summary: QQ Botのセットアップ、設定、および使用方法
title: QQ Bot
x-i18n:
    generated_at: "2026-04-22T04:20:22Z"
    model: gpt-5.4
    provider: openai
    source_hash: 49a5ae5615935a435a69748a3c4465ae8c33d3ab84db5e37fd8beec70506ce36
    source_path: channels/qqbot.md
    workflow: 15
---

# QQ Bot

QQ Botは公式のQQ Bot API（WebSocket Gateway）を介してOpenClawに接続します。このPluginは、C2Cプライベートチャット、グループの@メッセージ、ギルドチャンネルメッセージ、およびリッチメディア（画像、音声、動画、ファイル）をサポートします。

ステータス: バンドル済みPlugin。ダイレクトメッセージ、グループチャット、ギルドチャンネル、メディアをサポートしています。リアクションとスレッドはサポートされていません。

## バンドル済みPlugin

現在のOpenClawリリースにはQQ Botがバンドルされているため、通常のパッケージ版ビルドでは別途`openclaw plugins install`を実行する必要はありません。

## セットアップ

1. [QQ Open Platform](https://q.qq.com/)にアクセスし、スマートフォンのQQでQRコードをスキャンして登録またはログインします。
2. **Create Bot**をクリックして、新しいQQ botを作成します。
3. botの設定ページで**AppID**と**AppSecret**を見つけてコピーします。

> AppSecretは平文では保存されません。保存せずにページを離れると、新しいものを再生成する必要があります。

4. チャンネルを追加します:

```bash
openclaw channels add --channel qqbot --token "AppID:AppSecret"
```

5. Gatewayを再起動します。

対話式セットアップパス:

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

デフォルトアカウントの環境変数:

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

- 環境変数によるフォールバックは、デフォルトのQQ Botアカウントにのみ適用されます。
- `openclaw channels add --channel qqbot --token-file ...`が提供するのはAppSecretのみです。AppIDは、設定または`QQBOT_APP_ID`ですでに設定されている必要があります。
- `clientSecret`は、平文文字列だけでなくSecretRef入力も受け付けます。

### マルチアカウント設定

1つのOpenClawインスタンスで複数のQQ botを実行できます。

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

各アカウントは独自のWebSocket接続を起動し、独立したトークンキャッシュ（`appId`ごとに分離）を維持します。

CLIで2つ目のbotを追加するには:

```bash
openclaw channels add --channel qqbot --account bot2 --token "222222222:secret-of-bot-2"
```

### 音声（STT / TTS）

STTおよびTTSは、優先度付きフォールバックを備えた2段階の設定をサポートします。

| 設定 | Plugin固有 | フレームワークのフォールバック |
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

どちらかを無効にするには、`enabled: false`を設定してください。

送信音声のアップロード/トランスコード動作は、`channels.qqbot.audioFormatPolicy`でも調整できます。

- `sttDirectFormats`
- `uploadDirectFormats`
- `transcodeEnabled`

## ターゲット形式

| 形式 | 説明 |
| -------------------------- | ------------------ |
| `qqbot:c2c:OPENID`         | プライベートチャット（C2C） |
| `qqbot:group:GROUP_OPENID` | グループチャット |
| `qqbot:channel:CHANNEL_ID` | ギルドチャンネル |

> 各botは独自のユーザーOpenIDセットを持ちます。Bot Aが受け取ったOpenIDは、Bot B経由でメッセージ送信に**使用できません**。

## スラッシュコマンド

AIキューに入る前にインターセプトされる組み込みコマンド:

| コマンド | 説明 |
| -------------- | -------------------------------------------------------------------------------------------------------- |
| `/bot-ping`    | レイテンシテスト |
| `/bot-version` | OpenClawフレームワークのバージョンを表示 |
| `/bot-help`    | すべてのコマンドを一覧表示 |
| `/bot-upgrade` | QQBotアップグレードガイドのリンクを表示 |
| `/bot-logs`    | 最近のGatewayログをファイルとしてエクスポート |
| `/bot-approve` | 保留中のQQ Botアクション（たとえば、C2Cまたはグループアップロードの確認）をネイティブフローを通じて承認します。 |

使用方法のヘルプを表示するには、任意のコマンドに`?`を追加します（例: `/bot-upgrade ?`）。

## エンジンアーキテクチャ

QQ Botには、Plugin内に自己完結型のエンジンが含まれています。

- 各アカウントは、`appId`をキーとする分離されたリソーススタック（WebSocket接続、APIクライアント、トークンキャッシュ、メディアストレージルート）を所有します。アカウント間で受信/送信状態が共有されることはありません。
- マルチアカウントロガーは、実行中の複数botの診断を分離できるよう、ログ行に所有アカウントのタグを付けます。
- 受信、送信、Gatewayブリッジの各経路は、`~/.openclaw/media`配下の単一のメディアペイロードルートを共有するため、アップロード、ダウンロード、トランスコードキャッシュは、サブシステムごとのツリーではなく1つの保護されたディレクトリ配下に配置されます。
- 認証情報は、標準のOpenClaw認証情報スナップショットの一部としてバックアップおよび復元できます。エンジンは、復元時に各アカウントのリソーススタックを再接続するため、新たにQRコードでペアリングし直す必要はありません。

## QRコードによるオンボーディング

`AppID:AppSecret`を手動で貼り付ける代替手段として、このエンジンはQQ BotをOpenClawにリンクするためのQRコードによるオンボーディングフローをサポートしています。

1. QQ Botセットアップパス（たとえば`openclaw channels add --channel qqbot`）を実行し、プロンプトが表示されたらQRコードフローを選びます。
2. 対象のQQ Botに紐付いたスマートフォンアプリで生成されたQRコードをスキャンします。
3. スマートフォンでペアリングを承認します。OpenClawは、返された認証情報を正しいアカウントスコープで`credentials/`に保存します。

bot自身が生成する承認プロンプト（たとえば、QQ Bot APIが提供する「このアクションを許可しますか？」フロー）は、生のQQクライアントから返信する代わりに、`/bot-approve`で受け付けられるネイティブなOpenClawプロンプトとして表示されます。

## トラブルシューティング

- **Botが「gone to Mars」と返す:** 認証情報が設定されていないか、Gatewayが起動していません。
- **受信メッセージが来ない:** `appId`と`clientSecret`が正しいこと、およびQQ Open Platformでbotが有効になっていることを確認してください。
- **`--token-file`でセットアップしても未設定と表示される:** `--token-file`が設定するのはAppSecretのみです。`appId`は設定または`QQBOT_APP_ID`で別途指定する必要があります。
- **プロアクティブメッセージが届かない:** ユーザーが最近やり取りしていない場合、QQがbot主導のメッセージを遮断することがあります。
- **音声が文字起こしされない:** STTが設定されていて、providerに到達可能であることを確認してください。
