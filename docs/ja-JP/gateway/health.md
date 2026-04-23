---
read_when:
    - チャネル接続性またはGatewayのヘルスを診断する
    - ヘルスチェックCLIコマンドとオプションを理解する
summary: ヘルスチェックコマンドとGatewayのヘルス監視
title: ヘルスチェック
x-i18n:
    generated_at: "2026-04-23T04:45:10Z"
    model: gpt-5.4
    provider: openai
    source_hash: 5ddcbe6fa913c5ba889f78cb417124c96b562cf8939410b1d6f66042dfb51a9f
    source_path: gateway/health.md
    workflow: 15
---

# ヘルスチェック（CLI）

推測に頼らずチャネル接続性を確認するための短いガイドです。

## クイックチェック

- `openclaw status` — ローカルの要約: Gateway到達性/モード、更新ヒント、リンク済みチャネル認証の経過時間、セッション + 最近のアクティビティ。
- `openclaw status --all` — 完全なローカル診断（読み取り専用、カラー表示、デバッグ用に安全に貼り付け可能）。
- `openclaw status --deep` — 実行中のGatewayにライブヘルスプローブ（`health` with `probe:true`）を要求します。サポートされている場合はアカウントごとのチャネルプローブも含みます。
- `openclaw health` — 実行中のGatewayにヘルススナップショットを要求します（WS専用。CLIからチャネルソケットへ直接接続はしません）。
- `openclaw health --verbose` — ライブヘルスプローブを強制し、Gateway接続の詳細を表示します。
- `openclaw health --json` — 機械可読なヘルススナップショット出力。
- WhatsApp/WebChat で `/status` を単独メッセージとして送信すると、agentを呼び出さずにステータス応答を取得できます。
- ログ: `/tmp/openclaw/openclaw-*.log` を tail し、`web-heartbeat`、`web-reconnect`、`web-auto-reply`、`web-inbound` で絞り込みます。

## 詳細診断

- ディスク上の認証情報: `ls -l ~/.openclaw/credentials/whatsapp/<accountId>/creds.json`（`mtime` は最近であるべきです）。
- セッションストア: `ls -l ~/.openclaw/agents/<agentId>/sessions/sessions.json`（このパスはconfigで上書き可能です）。件数と最近の送信先は `status` に表示されます。
- 再リンク手順: ログにステータスコード 409–515 または `loggedOut` が現れる場合は、`openclaw channels logout && openclaw channels login --verbose` を実行します。（注: QRログインフローでは、ペアリング後のステータス 515 に対して一度だけ自動再起動します。）
- 診断はデフォルトで有効です。`diagnostics.enabled: false` が設定されていない限り、Gateway は運用上の事実を記録します。メモリイベントは RSS/heap のバイト数、しきい値圧力、増加圧力を記録します。過大ペイロードイベントは、利用可能な場合に、何が拒否・切り詰め・分割されたかに加え、サイズと上限を記録します。メッセージ本文、添付ファイル内容、Webhook本文、生のリクエストまたはレスポンス本文、トークン、Cookie、秘密値は記録しません。同じHeartbeatは、制限付きの安定性レコーダーも開始します。これは `openclaw gateway stability` または `diagnostics.stability` Gateway RPC から利用できます。致命的なGateway終了、シャットダウンタイムアウト、再起動時の起動失敗では、イベントが存在する場合に最新のレコーダースナップショットが `~/.openclaw/logs/stability/` に保存されます。保存された最新バンドルは `openclaw gateway stability --bundle latest` で確認してください。
- バグ報告では、`openclaw gateway diagnostics export` を実行し、生成されたzipを添付してください。このエクスポートには、Markdown要約、最新の安定性バンドル、サニタイズ済みログメタデータ、サニタイズ済みGateway status/health スナップショット、およびconfigの形状が含まれます。共有を前提としています。チャット本文、Webhook本文、ツール出力、認証情報、Cookie、アカウント/メッセージ識別子、秘密値は除外またはマスクされます。

## ヘルスモニター設定

- `gateway.channelHealthCheckMinutes`: Gatewayがチャネルヘルスを確認する頻度。デフォルト: `5`。ヘルスモニター再起動をグローバルに無効化するには `0` を設定します。
- `gateway.channelStaleEventThresholdMinutes`: 接続済みチャネルがどれくらいアイドル状態のままでいられるか。これを超えると、ヘルスモニターは stale と見なして再起動します。デフォルト: `30`。これは `gateway.channelHealthCheckMinutes` 以上に保ってください。
- `gateway.channelMaxRestartsPerHour`: チャネル/アカウントごとの、ヘルスモニター再起動のローリング1時間上限。デフォルト: `10`。
- `channels.<provider>.healthMonitor.enabled`: グローバル監視を有効にしたまま、特定チャネルのヘルスモニター再起動を無効化します。
- `channels.<provider>.accounts.<accountId>.healthMonitor.enabled`: チャネルレベル設定より優先される、複数アカウント向け上書き設定。
- これらのチャネルごとの上書きは、現在これを公開している組み込みチャネルモニターに適用されます: Discord、Google Chat、iMessage、Microsoft Teams、Signal、Slack、Telegram、WhatsApp。

## 失敗したとき

- `logged out` またはステータス 409–515 → `openclaw channels logout` の後に `openclaw channels login` で再リンクします。
- Gatewayに到達できない → 起動します: `openclaw gateway --port 18789`（ポートが使用中の場合は `--force` を使用）。
- 受信メッセージがない → リンク済みの電話がオンラインか、および送信者が許可されているか（`channels.whatsapp.allowFrom`）を確認します。グループチャットでは、許可リスト + メンションルールが一致していることを確認してください（`channels.whatsapp.groups`、`agents.list[].groupChat.mentionPatterns`）。

## 専用の「health」コマンド

`openclaw health` は、実行中のGatewayにヘルススナップショットを要求します（CLIからチャネルソケットへ直接接続はしません）。デフォルトでは、新しいキャッシュ済みGatewayスナップショットを返すことができ、その後Gatewayはバックグラウンドでそのキャッシュを更新します。代わりに `openclaw health --verbose` はライブプローブを強制します。このコマンドは、利用可能な場合に、リンク済み creds/auth の経過時間、チャネルごとのプローブ要約、セッションストア要約、およびプローブ所要時間を報告します。Gatewayに到達できない場合、またはプローブが失敗/タイムアウトした場合は、非ゼロで終了します。

オプション:

- `--json`: 機械可読なJSON出力
- `--timeout <ms>`: デフォルトの10秒プローブタイムアウトを上書き
- `--verbose`: ライブプローブを強制し、Gateway接続の詳細を表示
- `--debug`: `--verbose` のエイリアス

ヘルススナップショットには次が含まれます: `ok`（boolean）、`ts`（timestamp）、`durationMs`（プローブ時間）、チャネルごとのステータス、agent の可用性、およびセッションストア要約。
