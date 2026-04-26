---
read_when:
    - OpenClaw を QQ に接続したい場合
    - QQ Bot の認証情報を設定する必要があります
    - QQ Bot のグループチャットまたはプライベートチャット対応が必要な場合
summary: QQ Bot のセットアップ、設定、使用方法
title: QQ bot
x-i18n:
    generated_at: "2026-04-26T11:24:22Z"
    model: gpt-5.4
    provider: openai
    source_hash: bd899d9556ab418bbb3d7dc368e6f6e1eca96828cbcc87b4147ccad362f1918e
    source_path: channels/qqbot.md
    workflow: 15
---

QQ Bot は公式 QQ Bot API（WebSocket Gateway）経由で OpenClaw に接続します。この
Plugin は C2C プライベートチャット、グループ @メッセージ、ギルドチャネルメッセージと、
リッチメディア（画像、音声、動画、ファイル）をサポートします。

ステータス: バンドル済み Plugin。ダイレクトメッセージ、グループチャット、ギルドチャネル、
メディアに対応しています。リアクションとスレッドには対応していません。

## バンドル済み Plugin

現在の OpenClaw リリースには QQ Bot がバンドルされているため、通常のパッケージ版ビルドでは
別途 `openclaw plugins install` を実行する必要はありません。

## セットアップ

1. [QQ Open Platform](https://q.qq.com/) にアクセスし、スマートフォンの
   QQ で QR コードをスキャンして登録 / ログインします。
2. **Create Bot** をクリックして新しい QQ bot を作成します。
3. bot の設定ページで **AppID** と **AppSecret** を見つけてコピーします。

> AppSecret は平文では保存されません。保存せずにページを離れると、
> 新しいものを再生成する必要があります。

4. チャネルを追加します。

```bash
openclaw channels add --channel qqbot --token "AppID:AppSecret"
```

5. Gateway を再起動します。

対話型セットアップパス:

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

ファイルベースの AppSecret:

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

- 環境変数のフォールバックはデフォルトの QQ Bot アカウントにのみ適用されます。
- `openclaw channels add --channel qqbot --token-file ...` が提供するのは
  AppSecret のみです。AppID は事前に config または `QQBOT_APP_ID` に設定されている必要があります。
- `clientSecret` は平文文字列だけでなく SecretRef 入力も受け付けます。

### マルチアカウント設定

1 つの OpenClaw インスタンスで複数の QQ bot を実行します。

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

各アカウントは独自の WebSocket 接続を起動し、独立した
トークンキャッシュ（`appId` ごとに分離）を保持します。

CLI で 2 つ目の bot を追加するには:

```bash
openclaw channels add --channel qqbot --account bot2 --token "222222222:secret-of-bot-2"
```

### 音声（STT / TTS）

STT と TTS は、優先フォールバック付きの 2 層構成をサポートします。

| 設定 | Plugin 固有                                              | フレームワークのフォールバック |
| ------- | -------------------------------------------------------- | ----------------------------- |
| STT     | `channels.qqbot.stt`                                     | `tools.media.audio.models[0]` |
| TTS     | `channels.qqbot.tts`, `channels.qqbot.accounts.<id>.tts` | `messages.tts`                |

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
      accounts: {
        qq-main: {
          tts: {
            providers: {
              openai: { voice: "shimmer" },
            },
          },
        },
      },
    },
  },
}
```

無効化するには、いずれかに `enabled: false` を設定します。
アカウントレベルの TTS オーバーライドは `messages.tts` と同じ形を使用し、
チャネル/グローバル TTS config に対してディープマージされます。

受信した QQ 音声添付ファイルは、生の音声ファイルを汎用 `MediaPaths` に入れないまま、
音声メディアメタデータとしてエージェントに公開されます。`[[audio_as_voice]]` の
プレーンテキスト返信は TTS を合成し、TTS が設定されている場合はネイティブな QQ 音声メッセージを送信します。

送信時の音声アップロード/トランスコード動作は
`channels.qqbot.audioFormatPolicy` でも調整できます。

- `sttDirectFormats`
- `uploadDirectFormats`
- `transcodeEnabled`

## 対象形式

| 形式                       | 説明                 |
| -------------------------- | -------------------- |
| `qqbot:c2c:OPENID`         | プライベートチャット（C2C） |
| `qqbot:group:GROUP_OPENID` | グループチャット       |
| `qqbot:channel:CHANNEL_ID` | ギルドチャネル         |

> 各 bot は独自のユーザー OpenID セットを持ちます。Bot A で受け取った OpenID は **Bot B 経由でメッセージ送信には使用できません**。

## スラッシュコマンド

AI キューの前にインターセプトされる組み込みコマンド:

| コマンド         | 説明                                                                                                  |
| -------------- | ----------------------------------------------------------------------------------------------------- |
| `/bot-ping`    | レイテンシテスト                                                                                      |
| `/bot-version` | OpenClaw フレームワークのバージョンを表示                                                             |
| `/bot-help`    | すべてのコマンドを一覧表示                                                                            |
| `/bot-upgrade` | QQBot アップグレードガイドのリンクを表示                                                              |
| `/bot-logs`    | 最近の Gateway ログをファイルとしてエクスポート                                                       |
| `/bot-approve` | 保留中の QQ Bot アクション（たとえば C2C またはグループアップロードの確認）をネイティブフロー経由で承認します。 |

使用方法のヘルプを表示するには、任意のコマンドの末尾に `?` を付けます（例: `/bot-upgrade ?`）。

## エンジンアーキテクチャ

QQ Bot は Plugin 内の自己完結型エンジンとして提供されます。

- 各アカウントは、`appId` をキーとする分離されたリソーススタック（WebSocket 接続、API クライアント、トークンキャッシュ、メディア保存ルート）を所有します。アカウント間で受信/送信状態が共有されることはありません。
- マルチアカウントロガーは、複数の bot を 1 つの Gateway で動かしているときでも診断を分離できるよう、所有アカウントでログ行にタグを付けます。
- 受信、送信、Gateway ブリッジの各経路は、`~/.openclaw/media` 配下の単一のメディアペイロードルートを共有するため、アップロード、ダウンロード、トランスコードキャッシュは、サブシステムごとのツリーではなく 1 つの保護されたディレクトリ配下に配置されます。
- 認証情報は標準の OpenClaw 認証情報スナップショットの一部としてバックアップおよび復元できます。エンジンは復元時に各アカウントのリソーススタックを再接続し、新たな QR コードのペアリングを必要としません。

## QR コードによるオンボーディング

`AppID:AppSecret` を手動で貼り付ける代替手段として、エンジンは QQ Bot を OpenClaw にリンクするための QR コードによるオンボーディングフローをサポートしています。

1. QQ Bot セットアップパス（たとえば `openclaw channels add --channel qqbot`）を実行し、プロンプトが表示されたら QR コードフローを選択します。
2. 対象の QQ Bot に紐付いたスマートフォンアプリで、生成された QR コードをスキャンします。
3. スマートフォンでペアリングを承認します。OpenClaw は返された認証情報を正しいアカウントスコープの `credentials/` に永続化します。

bot 自身によって生成された承認プロンプト（たとえば、QQ Bot API が公開する「このアクションを許可しますか？」フロー）は、生の QQ クライアントから返信する代わりに `/bot-approve` で受け入れられるネイティブな OpenClaw プロンプトとして表示されます。

## トラブルシューティング

- **bot が「gone to Mars」と返信する:** 認証情報が設定されていないか、Gateway が起動していません。
- **受信メッセージがない:** `appId` と `clientSecret` が正しいこと、および
  bot が QQ Open Platform で有効になっていることを確認してください。
- **自己返信が繰り返される:** OpenClaw は QQ の送信 ref index を
  bot 作成として記録し、現在の `msgIdx` が同じ
  bot アカウントに一致する受信イベントを無視します。
  これによりプラットフォームのエコーループを防ぎつつ、ユーザーが過去の bot メッセージを引用または返信することは引き続き可能です。
- **`--token-file` でセットアップしても未設定と表示される:** `--token-file` が設定するのは
  AppSecret のみです。config または `QQBOT_APP_ID` に `appId` が必要です。
- **能動的メッセージが届かない:** ユーザーが最近やり取りしていない場合、QQ が bot 起点のメッセージを遮断することがあります。
- **音声が文字起こしされない:** STT が設定されており、provider に到達可能であることを確認してください。

## 関連

- [ペアリング](/ja-JP/channels/pairing)
- [グループ](/ja-JP/channels/groups)
- [チャネルのトラブルシューティング](/ja-JP/channels/troubleshooting)
