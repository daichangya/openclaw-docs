---
read_when:
    - 初心者向けのロギング概要が必要な場合
    - ログレベルやフォーマットを設定したい場合
    - トラブルシューティングのためにログをすばやく見つけたい場合
summary: 'ロギングの概要: ファイルログ、コンソール出力、CLI tail、Control UI'
title: Logging Overview
x-i18n:
    generated_at: "2026-04-05T12:49:54Z"
    model: gpt-5.4
    provider: openai
    source_hash: 3a5e3800b7c5128602d05d5a35df4f88c373cfbe9397cca7e7154fff56a7f7ef
    source_path: logging.md
    workflow: 15
---

# Logging

OpenClaw には、主に 2 つのログ出力面があります:

- Gateway によって書き込まれる **ファイルログ**（JSON lines）
- ターミナルおよび Gateway Debug UI に表示される **コンソール出力**

Control UI の **Logs** タブは gateway のファイルログを tail します。このページでは、
ログの保存場所、読み方、ログレベルやフォーマットの設定方法を説明します。

## ログの保存場所

デフォルトでは、Gateway は次の場所にローテーションされるログファイルを書き込みます:

`/tmp/openclaw/openclaw-YYYY-MM-DD.log`

日付は gateway ホストのローカルタイムゾーンを使用します。

これは `~/.openclaw/openclaw.json` で上書きできます:

```json
{
  "logging": {
    "file": "/path/to/openclaw.log"
  }
}
```

## ログの読み方

### CLI: ライブ tail（推奨）

CLI を使って RPC 経由で gateway ログファイルを tail します:

```bash
openclaw logs --follow
```

現在便利なオプション:

- `--local-time`: タイムスタンプをローカルタイムゾーンで表示する
- `--url <url>` / `--token <token>` / `--timeout <ms>`: 標準の Gateway RPC フラグ
- `--expect-final`: agent ベースの RPC 最終レスポンス待機フラグ（共有クライアントレイヤー経由でここでも受け付けられます）

出力モード:

- **TTY セッション**: 整形済み、色付き、構造化されたログ行
- **非 TTY セッション**: プレーンテキスト
- `--json`: 行区切り JSON（1 行につき 1 ログイベント）
- `--plain`: TTY セッションでもプレーンテキストを強制
- `--no-color`: ANSI カラーを無効化

明示的な `--url` を渡した場合、CLI は config や
環境認証情報を自動適用しません。対象の Gateway に auth が必要なら、
自分で `--token` も指定してください。

JSON モードでは、CLI は `type` タグ付きオブジェクトを出力します:

- `meta`: ストリームメタデータ（file、cursor、size）
- `log`: パース済みログエントリー
- `notice`: 切り詰め / ローテーションのヒント
- `raw`: 未解析のログ行

local loopback Gateway が pairing を要求した場合、`openclaw logs` は
設定済みのローカルログファイルへ自動的にフォールバックします。明示的な `--url` ターゲットでは
このフォールバックは使われません。

Gateway に到達できない場合、CLI は次を実行する短いヒントを表示します:

```bash
openclaw doctor
```

### Control UI（web）

Control UI の **Logs** タブは、`logs.tail` を使って同じファイルを tail します。
開き方については [/web/control-ui](/web/control-ui) を参照してください。

### チャネル専用ログ

チャネルのアクティビティ（WhatsApp / Telegram など）だけを絞り込むには、次を使います:

```bash
openclaw channels logs --channel whatsapp
```

## ログ形式

### ファイルログ（JSONL）

ログファイルの各行は JSON オブジェクトです。CLI と Control UI は
これらのエントリーを解析して、構造化された出力（時刻、レベル、subsystem、メッセージ）を表示します。

### コンソール出力

コンソールログは **TTY 認識型** で、読みやすさのために整形されます:

- subsystem プレフィックス（例: `gateway/channels/whatsapp`）
- レベルの色分け（info / warn / error）
- 任意の compact または JSON モード

コンソールフォーマットは `logging.consoleStyle` で制御されます。

### Gateway WebSocket ログ

`openclaw gateway` には、RPC トラフィック向けの WebSocket プロトコルロギングもあります:

- 通常モード: 興味深い結果のみ（エラー、パースエラー、遅い呼び出し）
- `--verbose`: すべての request / response トラフィック
- `--ws-log auto|compact|full`: 詳細表示スタイルを選択
- `--compact`: `--ws-log compact` のエイリアス

例:

```bash
openclaw gateway
openclaw gateway --verbose --ws-log compact
openclaw gateway --verbose --ws-log full
```

## ロギングを設定する

すべてのロギング設定は、`~/.openclaw/openclaw.json` の `logging` 配下にあります。

```json
{
  "logging": {
    "level": "info",
    "file": "/tmp/openclaw/openclaw-YYYY-MM-DD.log",
    "consoleLevel": "info",
    "consoleStyle": "pretty",
    "redactSensitive": "tools",
    "redactPatterns": ["sk-.*"]
  }
}
```

### ログレベル

- `logging.level`: **ファイルログ**（JSONL）のレベル
- `logging.consoleLevel`: **コンソール** の詳細度レベル

どちらも **`OPENCLAW_LOG_LEVEL`** 環境変数で上書きできます（例: `OPENCLAW_LOG_LEVEL=debug`）。この env var は config ファイルより優先されるため、`openclaw.json` を編集せずに単一実行だけ詳細度を上げられます。グローバル CLI オプション **`--log-level <level>`**（例: `openclaw --log-level debug gateway run`）を渡すこともでき、このコマンドでは環境変数より優先されます。

`--verbose` はコンソール出力と WS ログの詳細度にのみ影響し、
ファイルログレベルは変更しません。

### コンソールスタイル

`logging.consoleStyle`:

- `pretty`: 人間に読みやすく、色付きで、タイムスタンプあり
- `compact`: より詰まった出力（長時間セッション向き）
- `json`: 1 行ごとに JSON（ログプロセッサー向け）

### リダクション

ツールサマリーは、コンソールに出る前に機密 token をリダクトできます:

- `logging.redactSensitive`: `off` | `tools`（デフォルト: `tools`）
- `logging.redactPatterns`: デフォルトセットを上書きする regex 文字列のリスト

リダクションは **コンソール出力のみに影響** し、ファイルログは変更しません。

## Diagnostics + OpenTelemetry

Diagnostics は、モデル実行 **および**
メッセージフローテレメトリー（webhook、キューイング、セッション状態）のための、
構造化された機械可読イベントです。これはログの置き換えではありません。メトリクス、
トレース、そのほかの exporter へ渡すために存在します。

Diagnostics イベントはプロセス内で発行されますが、exporter が接続されるのは
diagnostics とその exporter plugin の両方が有効な場合のみです。

### OpenTelemetry と OTLP の違い

- **OpenTelemetry（OTel）**: トレース、メトリクス、ログのためのデータモデル + SDK
- **OTLP**: OTel データを collector / backend に送るための wire protocol
- OpenClaw は現在 **OTLP/HTTP（protobuf）** で export します

### export されるシグナル

- **Metrics**: counter + histogram（token 使用量、メッセージフロー、キューイング）
- **Traces**: モデル使用量 + webhook / メッセージ処理の span
- **Logs**: `diagnostics.otel.logs` が有効なときに OTLP 経由で export されます。ログ量が多くなることがあるため、`logging.level` と exporter filter を考慮してください。

### Diagnostic イベントカタログ

モデル使用量:

- `model.usage`: token、cost、duration、context、provider / model / channel、session id。

メッセージフロー:

- `webhook.received`: チャネルごとの webhook 受信。
- `webhook.processed`: webhook 処理完了 + duration。
- `webhook.error`: webhook handler エラー。
- `message.queued`: 処理用にメッセージをキューに追加。
- `message.processed`: 結果 + duration + 任意の error。

キュー + セッション:

- `queue.lane.enqueue`: コマンドキュー lane への enqueue + depth。
- `queue.lane.dequeue`: コマンドキュー lane からの dequeue + wait time。
- `session.state`: セッション状態遷移 + reason。
- `session.stuck`: セッション停滞警告 + age。
- `run.attempt`: 実行リトライ / 試行メタデータ。
- `diagnostic.heartbeat`: 集計カウンター（webhooks / queue / session）。

### diagnostics を有効にする（exporter なし）

diagnostics イベントを plugin やカスタム sink で利用したい場合に使います:

```json
{
  "diagnostics": {
    "enabled": true
  }
}
```

### Diagnostics フラグ（対象を絞ったログ）

`logging.level` を上げずに、追加の対象限定デバッグログを有効にするにはフラグを使います。
フラグは大文字小文字を区別せず、ワイルドカードもサポートします（例: `telegram.*` や `*`）。

```json
{
  "diagnostics": {
    "flags": ["telegram.http"]
  }
}
```

env による上書き（単発）:

```
OPENCLAW_DIAGNOSTICS=telegram.http,telegram.payload
```

注意:

- フラグログは標準ログファイル（`logging.file` と同じ）に出力されます。
- 出力は引き続き `logging.redactSensitive` に従ってリダクトされます。
- 完全なガイド: [/diagnostics/flags](/diagnostics/flags)。

### OpenTelemetry に export する

diagnostics は `diagnostics-otel` plugin 経由で export できます（OTLP/HTTP）。これは OTLP/HTTP を受け付ける任意の OpenTelemetry collector / backend で動作します。

```json
{
  "plugins": {
    "allow": ["diagnostics-otel"],
    "entries": {
      "diagnostics-otel": {
        "enabled": true
      }
    }
  },
  "diagnostics": {
    "enabled": true,
    "otel": {
      "enabled": true,
      "endpoint": "http://otel-collector:4318",
      "protocol": "http/protobuf",
      "serviceName": "openclaw-gateway",
      "traces": true,
      "metrics": true,
      "logs": true,
      "sampleRate": 0.2,
      "flushIntervalMs": 60000
    }
  }
}
```

注意:

- `openclaw plugins enable diagnostics-otel` でも plugin を有効にできます。
- `protocol` は現在 `http/protobuf` のみをサポートします。`grpc` は無視されます。
- Metrics には、token 使用量、cost、context size、run duration、および
  メッセージフローの counter / histogram（webhooks、queueing、session state、queue depth / wait）が含まれます。
- traces / metrics は `traces` / `metrics` で切り替えられます（デフォルト: on）。
  traces には、モデル使用 span に加え、有効時には webhook / メッセージ処理 span も含まれます。
- collector に auth が必要な場合は `headers` を設定してください。
- サポートされる環境変数: `OTEL_EXPORTER_OTLP_ENDPOINT`,
  `OTEL_SERVICE_NAME`, `OTEL_EXPORTER_OTLP_PROTOCOL`。

### export される metrics（名前 + 型）

モデル使用量:

- `openclaw.tokens`（counter、attrs: `openclaw.token`, `openclaw.channel`,
  `openclaw.provider`, `openclaw.model`）
- `openclaw.cost.usd`（counter、attrs: `openclaw.channel`, `openclaw.provider`,
  `openclaw.model`）
- `openclaw.run.duration_ms`（histogram、attrs: `openclaw.channel`,
  `openclaw.provider`, `openclaw.model`）
- `openclaw.context.tokens`（histogram、attrs: `openclaw.context`,
  `openclaw.channel`, `openclaw.provider`, `openclaw.model`）

メッセージフロー:

- `openclaw.webhook.received`（counter、attrs: `openclaw.channel`,
  `openclaw.webhook`）
- `openclaw.webhook.error`（counter、attrs: `openclaw.channel`,
  `openclaw.webhook`）
- `openclaw.webhook.duration_ms`（histogram、attrs: `openclaw.channel`,
  `openclaw.webhook`）
- `openclaw.message.queued`（counter、attrs: `openclaw.channel`,
  `openclaw.source`）
- `openclaw.message.processed`（counter、attrs: `openclaw.channel`,
  `openclaw.outcome`）
- `openclaw.message.duration_ms`（histogram、attrs: `openclaw.channel`,
  `openclaw.outcome`）

キュー + セッション:

- `openclaw.queue.lane.enqueue`（counter、attrs: `openclaw.lane`）
- `openclaw.queue.lane.dequeue`（counter、attrs: `openclaw.lane`）
- `openclaw.queue.depth`（histogram、attrs: `openclaw.lane` または
  `openclaw.channel=heartbeat`）
- `openclaw.queue.wait_ms`（histogram、attrs: `openclaw.lane`）
- `openclaw.session.state`（counter、attrs: `openclaw.state`, `openclaw.reason`）
- `openclaw.session.stuck`（counter、attrs: `openclaw.state`）
- `openclaw.session.stuck_age_ms`（histogram、attrs: `openclaw.state`）
- `openclaw.run.attempt`（counter、attrs: `openclaw.attempt`）

### export される span（名前 + 主要属性）

- `openclaw.model.usage`
  - `openclaw.channel`, `openclaw.provider`, `openclaw.model`
  - `openclaw.sessionKey`, `openclaw.sessionId`
  - `openclaw.tokens.*`（input / output / cache_read / cache_write / total）
- `openclaw.webhook.processed`
  - `openclaw.channel`, `openclaw.webhook`, `openclaw.chatId`
- `openclaw.webhook.error`
  - `openclaw.channel`, `openclaw.webhook`, `openclaw.chatId`,
    `openclaw.error`
- `openclaw.message.processed`
  - `openclaw.channel`, `openclaw.outcome`, `openclaw.chatId`,
    `openclaw.messageId`, `openclaw.sessionKey`, `openclaw.sessionId`,
    `openclaw.reason`
- `openclaw.session.stuck`
  - `openclaw.state`, `openclaw.ageMs`, `openclaw.queueDepth`,
    `openclaw.sessionKey`, `openclaw.sessionId`

### サンプリング + フラッシュ

- Trace サンプリング: `diagnostics.otel.sampleRate`（0.0–1.0、root span のみ）
- Metric export 間隔: `diagnostics.otel.flushIntervalMs`（最小 1000ms）

### プロトコルに関する注意

- OTLP/HTTP endpoint は `diagnostics.otel.endpoint` または
  `OTEL_EXPORTER_OTLP_ENDPOINT` で設定できます。
- endpoint にすでに `/v1/traces` または `/v1/metrics` が含まれている場合、
  そのまま使われます。
- endpoint にすでに `/v1/logs` が含まれている場合、ログ用にもそのまま使われます。
- `diagnostics.otel.logs` は、メイン logger 出力の OTLP ログ export を有効にします。

### ログ export の動作

- OTLP ログは、`logging.file` に書き込まれるのと同じ構造化レコードを使用します。
- `logging.level`（ファイルログレベル）に従います。コンソールのリダクションは OTLP ログには適用されません。
- 大量ログ環境では、OTLP collector 側のサンプリング / フィルタリングを優先してください。

## トラブルシューティングのヒント

- **Gateway に到達できない?** まず `openclaw doctor` を実行してください。
- **ログが空?** Gateway が実行中であり、`logging.file` のパスに書き込んでいることを確認してください。
- **もっと詳細が必要?** `logging.level` を `debug` または `trace` にして再試行してください。

## 関連

- [Gateway Logging Internals](/gateway/logging) — WS ログスタイル、subsystem プレフィックス、コンソールキャプチャ
- [Diagnostics](/gateway/configuration-reference#diagnostics) — OpenTelemetry export とキャッシュ trace config
