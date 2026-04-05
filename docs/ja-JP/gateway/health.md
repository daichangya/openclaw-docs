---
read_when:
    - チャネル接続性またはGatewayのヘルスを診断する場合
    - ヘルスチェックCLIコマンドとオプションを理解したい場合
summary: ヘルスチェックコマンドとGatewayヘルス監視
title: ヘルスチェック
x-i18n:
    generated_at: "2026-04-05T12:43:36Z"
    model: gpt-5.4
    provider: openai
    source_hash: b8824bca34c4d1139f043481c75f0a65d83e54008898c34cf69c6f98fd04e819
    source_path: gateway/health.md
    workflow: 15
---

# ヘルスチェック（CLI）

推測に頼らずにチャネル接続性を確認するための短いガイドです。

## クイックチェック

- `openclaw status` — ローカル要約: Gateway到達性/モード、更新ヒント、リンク済みチャネルの認証経過時間、セッション + 最近のアクティビティ。
- `openclaw status --all` — 完全なローカル診断（読み取り専用、カラー表示、デバッグ用にそのまま貼り付けても安全）。
- `openclaw status --deep` — 実行中のGatewayにライブヘルスプローブ（`probe:true` を付けた `health`）を要求します。サポートされている場合はアカウントごとのチャネルプローブも含まれます。
- `openclaw health` — 実行中のGatewayにヘルススナップショットを要求します（WSのみ。CLIから直接チャネルソケットには接続しません）。
- `openclaw health --verbose` — ライブヘルスプローブを強制し、Gateway接続の詳細を表示します。
- `openclaw health --json` — 機械可読なヘルススナップショット出力。
- WhatsApp/WebChatで `/status` を単独メッセージとして送信すると、エージェントを呼び出さずにステータス応答を取得できます。
- ログ: `/tmp/openclaw/openclaw-*.log` をtailし、`web-heartbeat`、`web-reconnect`、`web-auto-reply`、`web-inbound` で絞り込みます。

## 詳細診断

- ディスク上の認証情報: `ls -l ~/.openclaw/credentials/whatsapp/<accountId>/creds.json` （`mtime` は新しいはずです）。
- セッションストア: `ls -l ~/.openclaw/agents/<agentId>/sessions/sessions.json` （パスは設定で上書きできます）。件数と最近の送信先は `status` に表示されます。
- 再リンクフロー: ログにステータスコード 409–515 または `loggedOut` が出る場合は `openclaw channels logout && openclaw channels login --verbose` を実行します。（注: QRログインフローは、ペアリング後にステータス 515 の場合のみ一度だけ自動再起動します。）

## ヘルスモニター設定

- `gateway.channelHealthCheckMinutes`: Gatewayがチャネルヘルスを確認する頻度。デフォルト: `5`。グローバルにヘルスモニター再起動を無効化するには `0` に設定します。
- `gateway.channelStaleEventThresholdMinutes`: 接続済みチャネルがどれだけアイドル状態を続けると、ヘルスモニターがそれをstaleと見なし再起動するか。デフォルト: `30`。これは `gateway.channelHealthCheckMinutes` 以上に保ってください。
- `gateway.channelMaxRestartsPerHour`: チャネル/アカウントごとの、ヘルスモニター再起動の1時間あたりローリング上限。デフォルト: `10`。
- `channels.<provider>.healthMonitor.enabled`: グローバル監視を有効にしたまま、特定チャネルのヘルスモニター再起動を無効化します。
- `channels.<provider>.accounts.<accountId>.healthMonitor.enabled`: チャネルレベル設定より優先されるマルチアカウント上書き。
- これらのチャネル単位の上書きは、現在それを公開している組み込みチャネルモニターに適用されます: Discord、Google Chat、iMessage、Microsoft Teams、Signal、Slack、Telegram、WhatsApp。

## 問題が発生した場合

- `logged out` またはステータス 409–515 → `openclaw channels logout` の後に `openclaw channels login` で再リンクします。
- Gatewayに到達できない → 起動します: `openclaw gateway --port 18789` （ポートが使用中なら `--force` を使います）。
- 受信メッセージがない → リンク済みの電話がオンラインか、送信者が許可されているか（`channels.whatsapp.allowFrom`）を確認します。グループチャットでは、allowlist とメンションルールが一致していることを確認してください（`channels.whatsapp.groups`、`agents.list[].groupChat.mentionPatterns`）。

## 専用の「health」コマンド

`openclaw health` は、実行中のGatewayにヘルススナップショットを要求します（CLIから直接チャネル
ソケットには接続しません）。デフォルトでは、新しいキャッシュ済みGatewayスナップショットを返すことができ、
その後Gatewayはバックグラウンドでそのキャッシュを更新します。`openclaw health --verbose` は
代わりにライブプローブを強制します。このコマンドは、利用可能な場合はリンク済み認証情報/認証経過時間、
チャネルごとのプローブ要約、セッションストア要約、およびプローブ時間を報告します。Gatewayに
到達できない場合や、プローブが失敗/タイムアウトした場合は、非ゼロで終了します。

オプション:

- `--json`: 機械可読なJSON出力
- `--timeout <ms>`: デフォルトの10秒プローブタイムアウトを上書き
- `--verbose`: ライブプローブを強制し、Gateway接続の詳細を表示
- `--debug`: `--verbose` のエイリアス

ヘルススナップショットには次が含まれます: `ok`（boolean）、`ts`（timestamp）、`durationMs`（プローブ時間）、チャネルごとのステータス、エージェント可用性、およびセッションストア要約。
