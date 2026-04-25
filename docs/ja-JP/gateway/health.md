---
read_when:
    - チャネル接続性またはGatewayヘルスの診断
    - ヘルスチェックCLIコマンドとオプションの理解
summary: ヘルスチェックコマンドとGatewayヘルス監視
title: ヘルスチェック
x-i18n:
    generated_at: "2026-04-25T13:47:45Z"
    model: gpt-5.4
    provider: openai
    source_hash: 8d00e842dc0d67d71ac6e6547ebb7e3cd2b476562a7cde0f81624c6e20d67683
    source_path: gateway/health.md
    workflow: 15
---

推測せずにチャネル接続性を確認するための短いガイドです。

## クイックチェック

- `openclaw status` — ローカル要約: Gateway到達性/モード、更新ヒント、リンク済みチャネル認証経過時間、セッション + 最近のアクティビティ。
- `openclaw status --all` — 完全なローカル診断（読み取り専用、カラー出力、デバッグ用にそのまま貼り付け可能）。
- `openclaw status --deep` — 実行中のGatewayにライブヘルスプローブ（`health` with `probe:true`）を問い合わせます。サポートされている場合はアカウントごとのチャネルプローブも含みます。
- `openclaw health` — 実行中のGatewayにヘルススナップショットを問い合わせます（WS専用。CLIから直接チャネルソケットへは接続しません）。
- `openclaw health --verbose` — ライブヘルスプローブを強制し、Gateway接続詳細を表示します。
- `openclaw health --json` — 機械可読なヘルススナップショット出力。
- WhatsApp/WebChatでスタンドアロンメッセージとして `/status` を送信すると、エージェントを起動せずにステータス返信を得られます。
- ログ: `/tmp/openclaw/openclaw-*.log` をtailし、`web-heartbeat`、`web-reconnect`、`web-auto-reply`、`web-inbound` で絞り込みます。

## 詳細診断

- ディスク上の認証情報: `ls -l ~/.openclaw/credentials/whatsapp/<accountId>/creds.json`（`mtime` は新しいはずです）。
- セッションストア: `ls -l ~/.openclaw/agents/<agentId>/sessions/sessions.json`（パスは設定で上書き可能）。件数と最近の受信者は `status` に表示されます。
- 再リンク手順: ログにステータスコード409–515または `loggedOut` が出る場合は `openclaw channels logout && openclaw channels login --verbose`。 （注: QRログインフローは、ペアリング後のステータス515に対して1回だけ自動再起動します。）
- 診断はデフォルトで有効です。`diagnostics.enabled: false` が設定されていない限り、Gatewayは運用上の事実を記録します。メモリイベントはRSS/heapのバイト数、しきい値圧力、増加圧力を記録します。サイズ超過ペイロードイベントは、利用可能な場合に、何が拒否・切り詰め・分割されたか、およびサイズと制限を記録します。メッセージ本文、添付内容、Webhook本文、生のリクエストまたはレスポンス本文、トークン、cookie、秘密値は記録しません。同じHeartbeatは境界付き安定性レコーダーも開始し、これは `openclaw gateway stability` または `diagnostics.stability` Gateway RPC から利用できます。致命的なGateway終了、シャットダウンタイムアウト、再起動時の起動失敗は、イベントが存在する場合、最新のレコーダースナップショットを `~/.openclaw/logs/stability/` に保存します。最新の保存済みbundleは `openclaw gateway stability --bundle latest` で確認してください。
- バグ報告には、`openclaw gateway diagnostics export` を実行し、生成されたzipを添付してください。エクスポートには、Markdown要約、最新の安定性bundle、サニタイズ済みログメタデータ、サニタイズ済みGateway status/healthスナップショット、および設定形状が含まれます。共有を前提としており、チャットテキスト、Webhook本文、ツール出力、認証情報、cookie、アカウント/メッセージ識別子、秘密値は除外またはマスクされます。[Diagnostics Export](/ja-JP/gateway/diagnostics) を参照してください。

## ヘルスモニター設定

- `gateway.channelHealthCheckMinutes`: Gatewayがチャネルヘルスを確認する頻度。デフォルト: `5`。ヘルスモニターによる再起動をグローバルに無効化するには `0` を設定します。
- `gateway.channelStaleEventThresholdMinutes`: 接続済みチャネルがアイドルのままでいられる時間。この時間を超えるとヘルスモニターはstaleと見なして再起動します。デフォルト: `30`。これは `gateway.channelHealthCheckMinutes` 以上にしてください。
- `gateway.channelMaxRestartsPerHour`: チャネル/アカウントごとの、ヘルスモニター再起動の1時間ローリング上限。デフォルト: `10`。
- `channels.<provider>.healthMonitor.enabled`: グローバル監視を有効にしたまま、特定チャネルのヘルスモニター再起動を無効化します。
- `channels.<provider>.accounts.<accountId>.healthMonitor.enabled`: チャネルレベル設定より優先されるマルチアカウント上書き。
- これらのチャネルごとの上書きは、現在それらを公開している組み込みチャネルモニターに適用されます: Discord、Google Chat、iMessage、Microsoft Teams、Signal、Slack、Telegram、WhatsApp。

## 何かが失敗したとき

- `logged out` またはステータス409–515 → `openclaw channels logout` の後に `openclaw channels login` で再リンクします。
- Gatewayに到達できない → 起動します: `openclaw gateway --port 18789`（ポート使用中なら `--force` を使います）。
- 受信メッセージがない → リンク済みの電話がオンラインであること、および送信者が許可されていること（`channels.whatsapp.allowFrom`）を確認してください。グループチャットでは、許可リスト + メンションルールが一致していることも確認してください（`channels.whatsapp.groups`, `agents.list[].groupChat.mentionPatterns`）。

## 専用の「health」コマンド

`openclaw health` は、実行中のGatewayにヘルススナップショットを問い合わせます（CLIから
直接チャネルソケットへは接続しません）。デフォルトでは、新しいキャッシュ済みGatewayスナップショットを
返すことがあり、その後Gatewayがそのキャッシュをバックグラウンドで更新します。代わりに
`openclaw health --verbose` はライブプローブを強制します。このコマンドは、利用可能な場合は
リンク済み認証情報/認証経過時間、チャネルごとのプローブ要約、セッションストア要約、
およびプローブ所要時間を報告します。Gatewayに到達できない場合や、プローブが失敗/タイムアウトした場合は
非ゼロで終了します。

オプション:

- `--json`: 機械可読JSON出力
- `--timeout <ms>`: デフォルト10秒のプローブタイムアウトを上書き
- `--verbose`: ライブプローブを強制し、Gateway接続詳細を表示
- `--debug`: `--verbose` のエイリアス

ヘルススナップショットには次が含まれます: `ok`（boolean）、`ts`（timestamp）、`durationMs`（プローブ時間）、チャネルごとのステータス、エージェント可用性、セッションストア要約。

## 関連

- [Gateway runbook](/ja-JP/gateway)
- [Diagnostics export](/ja-JP/gateway/diagnostics)
- [Gateway troubleshooting](/ja-JP/gateway/troubleshooting)
