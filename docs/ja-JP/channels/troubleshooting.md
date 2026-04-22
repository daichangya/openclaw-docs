---
read_when:
    - チャンネルトランスポートは接続済みと表示されるのに返信に失敗する
    - 詳細なproviderドキュメントを見る前に、チャンネル固有の確認が必要です
summary: チャンネルごとの障害シグネチャと修正方法による迅速なチャンネルレベルトラブルシューティング
title: チャンネルトラブルシューティング
x-i18n:
    generated_at: "2026-04-22T04:20:53Z"
    model: gpt-5.4
    provider: openai
    source_hash: 8c57934b52086ea5f41565c5aae77ef6fa772cf7d56a6427655a844a5c63d1c6
    source_path: channels/troubleshooting.md
    workflow: 15
---

# チャンネルトラブルシューティング

チャンネルは接続しているのに動作がおかしい場合は、このページを使用してください。

## コマンドの手順

まず、次の順番で実行してください。

```bash
openclaw status
openclaw gateway status
openclaw logs --follow
openclaw doctor
openclaw channels status --probe
```

正常なベースライン:

- `Runtime: running`
- `Connectivity probe: ok`
- `Capability: read-only`、`write-capable`、または`admin-capable`
- チャンネルプローブでトランスポートが接続済みと表示され、サポートされている場合は`works`または`audit ok`が表示される

## WhatsApp

### WhatsAppの障害シグネチャ

| 症状 | 最速の確認方法 | 修正 |
| ------------------------------- | --------------------------------------------------- | ------------------------------------------------------- |
| 接続済みだがDMに返信しない | `openclaw pairing list whatsapp` | 送信者を承認するか、DMポリシー/許可リストを変更します。 |
| グループメッセージが無視される | 設定内の`requireMention`とメンションパターンを確認 | botにメンションするか、そのグループのメンションポリシーを緩めます。 |
| ランダムに切断/再ログインを繰り返す | `openclaw channels status --probe` + ログ | 再ログインし、認証情報ディレクトリが正常か確認します。 |

完全なトラブルシューティング: [WhatsApp troubleshooting](/ja-JP/channels/whatsapp#troubleshooting)

## Telegram

### Telegramの障害シグネチャ

| 症状 | 最速の確認方法 | 修正 |
| ----------------------------------- | ------------------------------------------------ | -------------------------------------------------------------------------------------------------------------------------- |
| `/start`は動くが実際に使える返信フローがない | `openclaw pairing list telegram` | ペアリングを承認するか、DMポリシーを変更します。 |
| botはオンラインだがグループでは無反応 | メンション必須設定とbotのプライバシーモードを確認 | グループで見えるようにプライバシーモードを無効にするか、botにメンションします。 |
| ネットワークエラーで送信に失敗する | Telegram API呼び出し失敗のログを確認 | `api.telegram.org`へのDNS/IPv6/プロキシ経路を修正します。 |
| ポーリングが停止する、または再接続が遅い | `openclaw logs --follow`でポーリング診断を確認 | アップグレードしてください。再起動が誤検知なら`pollingStallThresholdMs`を調整します。継続的な停止は依然としてプロキシ/DNS/IPv6が原因です。 |
| 起動時に`setMyCommands`が拒否される | `BOT_COMMANDS_TOO_MUCH`のログを確認 | Plugin/Skills/カスタムTelegramコマンドを減らすか、ネイティブメニューを無効にします。 |
| アップグレード後に許可リストでブロックされる | `openclaw security audit`と設定の許可リストを確認 | `openclaw doctor --fix`を実行するか、`@username`を数値の送信者IDに置き換えます。 |

完全なトラブルシューティング: [Telegram troubleshooting](/ja-JP/channels/telegram#troubleshooting)

## Discord

### Discordの障害シグネチャ

| 症状 | 最速の確認方法 | 修正 |
| ------------------------------- | ----------------------------------- | --------------------------------------------------------- |
| botはオンラインだがguildで返信しない | `openclaw channels status --probe` | guild/channelを許可し、message content intentを確認します。 |
| グループメッセージが無視される | メンションゲーティングによるドロップのログを確認 | botにメンションするか、guild/channelで`requireMention: false`を設定します。 |
| DM返信がない | `openclaw pairing list discord` | DMペアリングを承認するか、DMポリシーを調整します。 |

完全なトラブルシューティング: [Discord troubleshooting](/ja-JP/channels/discord#troubleshooting)

## Slack

### Slackの障害シグネチャ

| 症状 | 最速の確認方法 | 修正 |
| -------------------------------------- | ----------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------- |
| Socket modeは接続済みだが応答しない | `openclaw channels status --probe` | app tokenとbot token、および必要なスコープを確認します。SecretRefベースの設定では`botTokenStatus` / `appTokenStatus = configured_unavailable`も確認してください。 |
| DMがブロックされる | `openclaw pairing list slack` | ペアリングを承認するか、DMポリシーを緩めます。 |
| チャンネルメッセージが無視される | `groupPolicy`とチャンネル許可リストを確認 | チャンネルを許可するか、ポリシーを`open`に変更します。 |

完全なトラブルシューティング: [Slack troubleshooting](/ja-JP/channels/slack#troubleshooting)

## iMessageとBlueBubbles

### iMessageとBlueBubblesの障害シグネチャ

| 症状 | 最速の確認方法 | 修正 |
| -------------------------------- | ----------------------------------------------------------------------- | ----------------------------------------------------- |
| 受信イベントがない | Webhook/サーバー到達性とアプリ権限を確認 | Webhook URLまたはBlueBubblesサーバーの状態を修正します。 |
| 送信できるがmacOSで受信できない | Messages automationに対するmacOSプライバシー権限を確認 | TCC権限を再付与してチャンネルプロセスを再起動します。 |
| DM送信者がブロックされる | `openclaw pairing list imessage`または`openclaw pairing list bluebubbles` | ペアリングを承認するか、許可リストを更新します。 |

完全なトラブルシューティング:

- [iMessage troubleshooting](/ja-JP/channels/imessage#troubleshooting)
- [BlueBubbles troubleshooting](/ja-JP/channels/bluebubbles#troubleshooting)

## Signal

### Signalの障害シグネチャ

| 症状 | 最速の確認方法 | 修正 |
| ------------------------------- | ------------------------------------------ | -------------------------------------------------------- |
| デーモンには到達できるがbotが無反応 | `openclaw channels status --probe` | `signal-cli`デーモンURL/アカウントと受信モードを確認します。 |
| DMがブロックされる | `openclaw pairing list signal` | 送信者を承認するか、DMポリシーを調整します。 |
| グループ返信がトリガーされない | グループ許可リストとメンションパターンを確認 | 送信者/グループを追加するか、ゲーティングを緩めます。 |

完全なトラブルシューティング: [Signal troubleshooting](/ja-JP/channels/signal#troubleshooting)

## QQ Bot

### QQ Botの障害シグネチャ

| 症状 | 最速の確認方法 | 修正 |
| ------------------------------- | ------------------------------------------- | --------------------------------------------------------------- |
| Botが「gone to Mars」と返す | 設定内の`appId`と`clientSecret`を確認 | 認証情報を設定するか、Gatewayを再起動します。 |
| 受信メッセージがない | `openclaw channels status --probe` | QQ Open Platform上の認証情報を確認します。 |
| 音声が文字起こしされない | STT provider設定を確認 | `channels.qqbot.stt`または`tools.media.audio`を設定します。 |
| プロアクティブメッセージが届かない | QQプラットフォームのインタラクション要件を確認 | 最近のやり取りがないと、QQがbot主導メッセージをブロックすることがあります。 |

完全なトラブルシューティング: [QQ Bot troubleshooting](/ja-JP/channels/qqbot#troubleshooting)

## Matrix

### Matrixの障害シグネチャ

| 症状 | 最速の確認方法 | 修正 |
| ----------------------------------- | -------------------------------------- | ------------------------------------------------------------------------- |
| ログイン済みだがルームメッセージを無視する | `openclaw channels status --probe` | `groupPolicy`、ルーム許可リスト、メンションゲーティングを確認します。 |
| DMが処理されない | `openclaw pairing list matrix` | 送信者を承認するか、DMポリシーを調整します。 |
| 暗号化ルームで失敗する | `openclaw matrix verify status` | デバイスを再検証し、その後`openclaw matrix verify backup status`を確認します。 |
| バックアップ復元が保留中/壊れている | `openclaw matrix verify backup status` | `openclaw matrix verify backup restore`を実行するか、リカバリキーで再実行します。 |
| クロス署名/ブートストラップの状態がおかしい | `openclaw matrix verify bootstrap` | シークレットストレージ、クロス署名、バックアップ状態を一括で修復します。 |

完全なセットアップと設定: [Matrix](/ja-JP/channels/matrix)
