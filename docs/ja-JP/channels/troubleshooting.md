---
read_when:
    - チャンネル転送は接続済みと表示されるが返信が失敗するとき
    - 詳細なプロバイダードキュメントに進む前にチャンネル固有の確認が必要なとき
summary: チャンネルごとの障害シグネチャと修正方法による高速なチャンネルレベルのトラブルシューティング
title: チャンネルのトラブルシューティング
x-i18n:
    generated_at: "2026-04-05T12:37:10Z"
    model: gpt-5.4
    provider: openai
    source_hash: d45d8220505ea420d970b20bc66e65216c2d7024b5736db1936421ffc0676e1f
    source_path: channels/troubleshooting.md
    workflow: 15
---

# チャンネルのトラブルシューティング

チャンネルは接続できているが動作がおかしい場合は、このページを使用してください。

## コマンドの段階的確認

まず次の順に実行してください。

```bash
openclaw status
openclaw gateway status
openclaw logs --follow
openclaw doctor
openclaw channels status --probe
```

正常なベースライン:

- `Runtime: running`
- `RPC probe: ok`
- チャンネルプローブで転送が接続済みと表示され、サポートされる場合は`works`または`audit ok`も表示される

## WhatsApp

### WhatsAppの障害シグネチャ

| 症状 | 最速の確認方法 | 修正 |
| ------------------------------- | --------------------------------------------------- | ------------------------------------------------------- |
| 接続済みだがDMに返信しない | `openclaw pairing list whatsapp` | 送信者を承認するか、DMポリシー/許可リストを変更する。 |
| グループメッセージが無視される | 設定内の`requireMention`とメンションパターンを確認 | ボットにメンションするか、そのグループのメンションポリシーを緩和する。 |
| ランダムな切断/再ログインループ | `openclaw channels status --probe`とログ | 再ログインし、認証情報ディレクトリが正常か確認する。 |

完全なトラブルシューティング: [/channels/whatsapp#troubleshooting](/channels/whatsapp#troubleshooting)

## Telegram

### Telegramの障害シグネチャ

| 症状 | 最速の確認方法 | 修正 |
| ----------------------------------- | ----------------------------------------------- | --------------------------------------------------------------------------- |
| `/start`はあるが使える返信フローがない | `openclaw pairing list telegram` | ペアリングを承認するか、DMポリシーを変更する。 |
| ボットはオンラインだがグループで無反応 | メンション要件とボットのprivacy modeを確認 | グループで見えるようにprivacy modeを無効にするか、ボットにメンションする。 |
| ネットワークエラーで送信に失敗する | Telegram API呼び出し失敗のログを確認 | `api.telegram.org`へのDNS/IPv6/プロキシルーティングを修正する。 |
| 起動時に`setMyCommands`が拒否される | `BOT_COMMANDS_TOO_MUCH`のログを確認 | プラグイン/Skill/カスタムTelegramコマンドを減らすか、ネイティブメニューを無効にする。 |
| アップグレード後に許可リストでブロックされる | `openclaw security audit`と設定の許可リスト | `openclaw doctor --fix`を実行するか、`@username`を数値の送信者IDに置き換える。 |

完全なトラブルシューティング: [/channels/telegram#troubleshooting](/channels/telegram#troubleshooting)

## Discord

### Discordの障害シグネチャ

| 症状 | 最速の確認方法 | 修正 |
| ------------------------------- | ----------------------------------- | --------------------------------------------------------- |
| ボットはオンラインだがguildで返信しない | `openclaw channels status --probe` | guild/channelを許可し、message content intentを確認する。 |
| グループメッセージが無視される | メンション制御による破棄のログを確認 | ボットにメンションするか、guild/channelの`requireMention: false`を設定する。 |
| DM返信がない | `openclaw pairing list discord` | DMペアリングを承認するか、DMポリシーを調整する。 |

完全なトラブルシューティング: [/channels/discord#troubleshooting](/channels/discord#troubleshooting)

## Slack

### Slackの障害シグネチャ

| 症状 | 最速の確認方法 | 修正 |
| -------------------------------------- | ----------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------- |
| Socket modeは接続済みだが応答しない | `openclaw channels status --probe` | アプリトークン、ボットトークン、必要なスコープを確認する。SecretRefベースのセットアップでは`botTokenStatus` / `appTokenStatus = configured_unavailable`に注意する。 |
| DMがブロックされる | `openclaw pairing list slack` | ペアリングを承認するか、DMポリシーを緩和する。 |
| チャンネルメッセージが無視される | `groupPolicy`とチャンネル許可リストを確認 | チャンネルを許可するか、ポリシーを`open`に切り替える。 |

完全なトラブルシューティング: [/channels/slack#troubleshooting](/channels/slack#troubleshooting)

## iMessageとBlueBubbles

### iMessageとBlueBubblesの障害シグネチャ

| 症状 | 最速の確認方法 | 修正 |
| -------------------------------- | ----------------------------------------------------------------------- | ----------------------------------------------------- |
| 受信イベントがない | webhook/サーバー到達性とアプリ権限を確認 | webhook URLまたはBlueBubblesサーバー状態を修正する。 |
| 送信はできるがmacOSで受信できない | Messages automationのmacOSプライバシー権限を確認 | TCC権限を再付与し、チャンネルプロセスを再起動する。 |
| DM送信者がブロックされる | `openclaw pairing list imessage`または`openclaw pairing list bluebubbles` | ペアリングを承認するか、許可リストを更新する。 |

完全なトラブルシューティング:

- [/channels/imessage#troubleshooting](/channels/imessage#troubleshooting)
- [/channels/bluebubbles#troubleshooting](/channels/bluebubbles#troubleshooting)

## Signal

### Signalの障害シグネチャ

| 症状 | 最速の確認方法 | 修正 |
| ------------------------------- | ------------------------------------------ | -------------------------------------------------------- |
| デーモンには到達できるがボットが無反応 | `openclaw channels status --probe` | `signal-cli`デーモンのURL/アカウントと受信モードを確認する。 |
| DMがブロックされる | `openclaw pairing list signal` | 送信者を承認するか、DMポリシーを調整する。 |
| グループ返信がトリガーされない | グループ許可リストとメンションパターンを確認 | 送信者/グループを追加するか、制御を緩和する。 |

完全なトラブルシューティング: [/channels/signal#troubleshooting](/channels/signal#troubleshooting)

## QQ Bot

### QQ Botの障害シグネチャ

| 症状 | 最速の確認方法 | 修正 |
| ------------------------------- | ------------------------------------------- | --------------------------------------------------------------- |
| ボットが「gone to Mars」と返信する | 設定内の`appId`と`clientSecret`を確認 | 認証情報を設定するか、Gatewayを再起動する。 |
| 受信メッセージがない | `openclaw channels status --probe` | QQ Open Platformで認証情報を確認する。 |
| 音声が文字起こしされない | STTプロバイダー設定を確認 | `channels.qqbot.stt`または`tools.media.audio`を設定する。 |
| プロアクティブメッセージが届かない | QQプラットフォームのインタラクション要件を確認 | 最近のやり取りがないと、QQがボット主導メッセージをブロックすることがある。 |

完全なトラブルシューティング: [/channels/qqbot#troubleshooting](/channels/qqbot#troubleshooting)

## Matrix

### Matrixの障害シグネチャ

| 症状 | 最速の確認方法 | 修正 |
| ----------------------------------- | -------------------------------------- | ------------------------------------------------------------------------- |
| ログイン済みだがルームメッセージを無視する | `openclaw channels status --probe` | `groupPolicy`、ルーム許可リスト、メンション制御を確認する。 |
| DMが処理されない | `openclaw pairing list matrix` | 送信者を承認するか、DMポリシーを調整する。 |
| 暗号化ルームが失敗する | `openclaw matrix verify status` | デバイスを再検証し、その後`openclaw matrix verify backup status`を確認する。 |
| バックアップ復元が保留中/壊れている | `openclaw matrix verify backup status` | `openclaw matrix verify backup restore`を実行するか、リカバリーキーを使って再実行する。 |
| cross-signing/bootstrapが不正に見える | `openclaw matrix verify bootstrap` | シークレットストレージ、cross-signing、バックアップ状態を一括で修復する。 |

完全なセットアップと設定: [Matrix](/channels/matrix)
