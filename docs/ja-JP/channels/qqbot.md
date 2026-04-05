---
read_when:
    - OpenClawをQQに接続したいとき
    - QQ Botの認証情報セットアップが必要なとき
    - QQ Botのグループまたはプライベートチャット対応を使いたいとき
summary: QQ Botのセットアップ、設定、使用方法
title: QQ Bot
x-i18n:
    generated_at: "2026-04-05T12:36:13Z"
    model: gpt-5.4
    provider: openai
    source_hash: 0e58fb7b07c59ecbf80a1276368c4a007b45d84e296ed40cffe9845e0953696c
    source_path: channels/qqbot.md
    workflow: 15
---

# QQ Bot

QQ Botは、公式のQQ Bot API（WebSocket Gateway）を介してOpenClawに接続します。
このプラグインは、C2Cプライベートチャット、グループの@メッセージ、ギルドチャンネルメッセージと、
リッチメディア（画像、音声、動画、ファイル）をサポートします。

ステータス: バンドル済みプラグイン。ダイレクトメッセージ、グループチャット、ギルドチャンネル、
メディアをサポートしています。リアクションとスレッドはサポートしていません。

## バンドル済みプラグイン

現在のOpenClawリリースにはQQ Botがバンドルされているため、通常のパッケージ済みビルドでは
別途`openclaw plugins install`手順は不要です。

## セットアップ

1. [QQ Open Platform](https://q.qq.com/)にアクセスし、
   スマートフォンのQQでQRコードをスキャンして登録またはログインします。
2. **Create Bot**をクリックして、新しいQQボットを作成します。
3. ボットの設定ページで**AppID**と**AppSecret**を見つけてコピーします。

> AppSecretは平文では保存されません。保存せずにページを離れると、
> 新しいものを再生成する必要があります。

4. チャンネルを追加します。

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

デフォルトアカウント用環境変数:

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

注意事項:

- 環境変数のフォールバックは、デフォルトのQQ Botアカウントにのみ適用されます。
- `openclaw channels add --channel qqbot --token-file ...`は
  AppSecretのみを提供します。AppIDは設定または`QQBOT_APP_ID`ですでに設定されている必要があります。
- `clientSecret`は平文文字列だけでなく、SecretRef入力も受け付けます。

### 複数アカウント設定

1つのOpenClawインスタンスで複数のQQボットを実行します。

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

各アカウントは独自のWebSocket接続を起動し、
独立したトークンキャッシュ（`appId`ごとに分離）を維持します。

CLIで2つ目のボットを追加する:

```bash
openclaw channels add --channel qqbot --account bot2 --token "222222222:secret-of-bot-2"
```

### 音声（STT / TTS）

STTとTTSは、優先度付きフォールバックを持つ2段階設定をサポートします。

| 設定 | プラグイン固有 | フレームワークのフォールバック |
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

無効化するには、いずれかに`enabled: false`を設定します。

送信音声のアップロード/トランスコード動作は、
`channels.qqbot.audioFormatPolicy`でも調整できます。

- `sttDirectFormats`
- `uploadDirectFormats`
- `transcodeEnabled`

## 対象フォーマット

| フォーマット | 説明 |
| -------------------------- | ------------------ |
| `qqbot:c2c:OPENID`         | プライベートチャット（C2C） |
| `qqbot:group:GROUP_OPENID` | グループチャット |
| `qqbot:channel:CHANNEL_ID` | ギルドチャンネル |

> 各ボットは独自のユーザーOpenIDセットを持ちます。Bot Aで受信したOpenIDは、Bot B経由でメッセージ送信に**使用できません**。

## スラッシュコマンド

AIキューより前にインターセプトされる組み込みコマンド:

| コマンド | 説明 |
| -------------- | ------------------------------------ |
| `/bot-ping`    | レイテンシーテスト |
| `/bot-version` | OpenClawフレームワークのバージョンを表示 |
| `/bot-help`    | すべてのコマンドを一覧表示 |
| `/bot-upgrade` | QQBotアップグレードガイドのリンクを表示 |
| `/bot-logs`    | 最近のGatewayログをファイルとしてエクスポート |

使用方法のヘルプを見るには、任意のコマンドに`?`を付けます（例: `/bot-upgrade ?`）。

## トラブルシューティング

- **ボットが「gone to Mars」と返信する:** 認証情報が設定されていないか、Gatewayが起動していません。
- **受信メッセージがない:** `appId`と`clientSecret`が正しいこと、および
  QQ Open Platformでボットが有効になっていることを確認してください。
- **`--token-file`でセットアップしても未設定と表示される:** `--token-file`は
  AppSecretのみを設定します。`appId`は設定または`QQBOT_APP_ID`で別途必要です。
- **プロアクティブメッセージが届かない:** ユーザーが最近やり取りしていない場合、
  QQがボット主導メッセージを遮断することがあります。
- **音声が文字起こしされない:** STTが設定されており、プロバイダーに到達可能であることを確認してください。
