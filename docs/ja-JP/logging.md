---
read_when:
    - ログについて初心者向けの概要が必要な場合
    - ログレベルや形式を設定したい場合
    - トラブルシューティング中で、ログをすばやく見つける必要がある場合
summary: 'ログの概要: ファイルログ、コンソール出力、CLIでの追跡、Control UI'
title: ログの概要
x-i18n:
    generated_at: "2026-04-25T13:51:10Z"
    model: gpt-5.4
    provider: openai
    source_hash: e16a8aa487616c338c625c55fdfcc604759ee7b1e235b0b318b36d7a6fb07ab8
    source_path: logging.md
    workflow: 15
---

# ログ

OpenClawには、主に2つのログサーフェスがあります。

- Gatewayが書き込む**ファイルログ**（JSON lines）
- ターミナルとGateway Debug UIに表示される**コンソール出力**

Control UIの**Logs**タブはgatewayファイルログを追跡表示します。このページでは、
ログの保存場所、読み方、ログレベルと形式の設定方法を説明します。

## ログの保存場所

デフォルトでは、Gatewayは次の場所にローテーションされるログファイルを書き込みます。

`/tmp/openclaw/openclaw-YYYY-MM-DD.log`

この日付にはgateway hostのローカルタイムゾーンが使われます。

これは`~/.openclaw/openclaw.json`で上書きできます。

```json
{
  "logging": {
    "file": "/path/to/openclaw.log"
  }
}
```

## ログの読み方

### CLI: ライブtail（推奨）

CLIを使って、RPC経由でgatewayログファイルをtailします。

```bash
openclaw logs --follow
```

現在の便利なオプション:

- `--local-time`: タイムスタンプをローカルタイムゾーンで表示
- `--url <url>` / `--token <token>` / `--timeout <ms>`: 標準のGateway RPCフラグ
- `--expect-final`: エージェントベースRPCの最終レスポンス待機フラグ（共通クライアントレイヤー経由でここでも受け付けます）

出力モード:

- **TTYセッション**: 整形済み、カラー付き、構造化されたログ行
- **非TTYセッション**: プレーンテキスト
- `--json`: 行区切りJSON（1行ごとに1ログイベント）
- `--plain`: TTYセッションでプレーンテキストを強制
- `--no-color`: ANSIカラーを無効化

明示的な`--url`を渡した場合、CLIは設定や
環境変数の認証情報を自動適用しません。対象Gatewayが
認証を必要とする場合は、自分で`--token`を含めてください。

JSONモードでは、CLIは`type`タグ付きオブジェクトを出力します。

- `meta`: ストリームメタデータ（ファイル、カーソル、サイズ）
- `log`: パース済みログエントリ
- `notice`: 切り詰め / ローテーションのヒント
- `raw`: 未パースのログ行

ローカルloopback Gatewayがペアリングを要求した場合、`openclaw logs`は
自動的に設定済みローカルログファイルへフォールバックします。明示的な`--url`ターゲットでは
このフォールバックは使われません。

Gatewayに到達できない場合、CLIは次を実行する短いヒントを表示します。

```bash
openclaw doctor
```

### Control UI（web）

Control UIの**Logs**タブは、`logs.tail`を使って同じファイルをtailします。
開き方については[/web/control-ui](/ja-JP/web/control-ui)を参照してください。

### チャネル専用ログ

チャネルアクティビティ（WhatsApp/Telegramなど）を絞り込むには、次を使います。

```bash
openclaw channels logs --channel whatsapp
```

## ログ形式

### ファイルログ（JSONL）

ログファイルの各行はJSONオブジェクトです。CLIとControl UIはこれらの
エントリをパースし、構造化出力（時刻、レベル、サブシステム、メッセージ）を描画します。

### コンソール出力

コンソールログは**TTY対応**で、読みやすさを重視して整形されています。

- サブシステム接頭辞（例: `gateway/channels/whatsapp`）
- レベルごとの色分け（info/warn/error）
- 任意のcompactまたはJSONモード

コンソール書式は`logging.consoleStyle`で制御されます。

### Gateway WebSocketログ

`openclaw gateway`には、RPCトラフィック用のWebSocketプロトコルログもあります。

- 通常モード: 興味深い結果のみ（エラー、パースエラー、遅い呼び出し）
- `--verbose`: すべてのリクエスト/レスポンストラフィック
- `--ws-log auto|compact|full`: verbose表示スタイルを選択
- `--compact`: `--ws-log compact`の別名

例:

```bash
openclaw gateway
openclaw gateway --verbose --ws-log compact
openclaw gateway --verbose --ws-log full
```

## ログの設定

すべてのログ設定は、`~/.openclaw/openclaw.json`の`logging`配下にあります。

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
- `logging.consoleLevel`: **コンソール**の詳細度レベル

どちらも**`OPENCLAW_LOG_LEVEL`**環境変数（例: `OPENCLAW_LOG_LEVEL=debug`）で上書きできます。環境変数は設定ファイルより優先されるため、`openclaw.json`を編集せずに単一実行だけ詳細度を上げられます。グローバルCLIオプション**`--log-level <level>`**（例: `openclaw --log-level debug gateway run`）を渡すこともでき、これはそのコマンドでは環境変数を上書きします。

`--verbose`が影響するのはコンソール出力とWSログ詳細度のみで、
ファイルログレベルは変わりません。

### コンソールスタイル

`logging.consoleStyle`:

- `pretty`: 人間に読みやすく、カラー付き、タイムスタンプあり
- `compact`: より詰まった出力（長時間セッション向き）
- `json`: 1行ごとにJSON（ログプロセッサ向け）

### マスキング

ツール要約は、コンソールへ出る前に機微なトークンをマスキングできます。

- `logging.redactSensitive`: `off` | `tools`（デフォルト: `tools`）
- `logging.redactPatterns`: デフォルト集合を上書きするregex文字列の一覧

マスキングが影響するのは**コンソール出力のみ**で、ファイルログは変更しません。

## Diagnostics + OpenTelemetry

Diagnosticsは、モデル実行**および**
メッセージフローテレメトリ（Webhooks、キューイング、セッション状態）のための、構造化された機械可読イベントです。これらは
ログの代替ではなく、メトリクス、トレース、その他のエクスポーターへ供給するために存在します。

Diagnosticsイベントはプロセス内で発行されますが、
diagnosticsとエクスポータープラグインの両方が有効なときにのみエクスポーターが接続されます。

### OpenTelemetryとOTLPの違い

- **OpenTelemetry (OTel)**: トレース、メトリクス、ログのデータモデル + SDK
- **OTLP**: OTelデータをcollector/backendへエクスポートするためのwire protocol
- OpenClawは現在、**OTLP/HTTP (protobuf)** でエクスポートします

### エクスポートされるシグナル

- **メトリクス**: カウンター + ヒストグラム（トークン使用量、メッセージフロー、キューイング）
- **トレース**: モデル使用とWebhook/メッセージ処理のspan
- **ログ**: `diagnostics.otel.logs`が有効な場合にOTLP経由でエクスポートされます。ログ
  量が多くなる可能性があるため、`logging.level`とエクスポーターフィルターに注意してください。

### Diagnosticイベントカタログ

モデル使用量:

- `model.usage`: トークン、コスト、duration、context、provider/model/channel、session ids

メッセージフロー:

- `webhook.received`: チャネルごとのWebhook受信
- `webhook.processed`: 処理済みWebhook + duration
- `webhook.error`: Webhookハンドラーエラー
- `message.queued`: 処理待ちに入ったメッセージ
- `message.processed`: 結果 + duration + 任意のerror
- `message.delivery.started`: 送信配信試行の開始
- `message.delivery.completed`: 送信配信試行の完了 + duration/result count
- `message.delivery.error`: 送信配信試行の失敗 + duration/bounded error category

キュー + セッション:

- `queue.lane.enqueue`: コマンドキューレーンへのenqueue + depth
- `queue.lane.dequeue`: コマンドキューレーンからのdequeue + wait time
- `session.state`: セッション状態遷移 + reason
- `session.stuck`: セッション停止警告 + age
- `run.attempt`: 実行再試行/試行メタデータ
- `diagnostic.heartbeat`: 集約カウンター（webhooks/queue/session）

Exec:

- `exec.process.completed`: ターミナルexecプロセスの結果、duration、target、mode、
  exit code、failure kind。コマンド本文と作業ディレクトリは
  含まれません。

### diagnosticsを有効化（エクスポーターなし）

diagnosticsイベントをPluginまたはカスタムシンクで使いたい場合に使います。

```json
{
  "diagnostics": {
    "enabled": true
  }
}
```

### Diagnosticsフラグ（対象限定ログ）

`logging.level`を上げずに、追加の対象限定デバッグログを有効にするにはフラグを使います。
フラグは大文字小文字を区別せず、ワイルドカード（例: `telegram.*`または`*`）をサポートします。

```json
{
  "diagnostics": {
    "flags": ["telegram.http"]
  }
}
```

環境変数での上書き（単発）:

```
OPENCLAW_DIAGNOSTICS=telegram.http,telegram.payload
```

注:

- フラグログは標準ログファイル（`logging.file`と同じ）へ出力されます。
- 出力は引き続き`logging.redactSensitive`に従ってマスキングされます。
- 完全なガイド: [/diagnostics/flags](/ja-JP/diagnostics/flags)

### OpenTelemetryへエクスポート

Diagnosticsは`diagnostics-otel` plugin（OTLP/HTTP）経由でエクスポートできます。これは
OTLP/HTTPを受け付ける任意のOpenTelemetry collector/backendで動作します。

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
      "flushIntervalMs": 60000,
      "captureContent": {
        "enabled": false,
        "inputMessages": false,
        "outputMessages": false,
        "toolInputs": false,
        "toolOutputs": false,
        "systemPrompt": false
      }
    }
  }
}
```

注:

- `openclaw plugins enable diagnostics-otel`でもpluginを有効化できます。
- `protocol`は現在`http/protobuf`のみサポートします。`grpc`は無視されます。
- メトリクスには、トークン使用量、コスト、コンテキストサイズ、実行時間、
  メッセージフローのカウンター/ヒストグラム（Webhooks、キューイング、セッション状態、キュー深さ/待機時間）が含まれます。
- トレース/メトリクスは`traces` / `metrics`で切り替えられます（デフォルト: on）。トレース
  には、モデル使用spanに加え、有効時にはWebhook/メッセージ処理spanが含まれます。
- rawなモデル/ツール内容はデフォルトではエクスポートされません。
  `diagnostics.otel.captureContent`は、collectorと保持ポリシーが
  プロンプト、レスポンス、ツール、またはシステムプロンプト本文に対して承認されている場合にのみ使用してください。
- collectorが認証を必要とする場合は`headers`を設定してください。
- サポートされる環境変数: `OTEL_EXPORTER_OTLP_ENDPOINT`,
  `OTEL_SERVICE_NAME`, `OTEL_EXPORTER_OTLP_PROTOCOL`
- 別のpreloadまたはhost processがすでにグローバルOpenTelemetry SDKを
  登録済みの場合は、`OPENCLAW_OTEL_PRELOADED=1`を設定してください。そのモードではpluginは
  自身のSDKを開始/終了しませんが、OpenClaw diagnostic listenerの接続は行い、
  `diagnostics.otel.traces`、`metrics`、`logs`を尊重します。

### エクスポートされるメトリクス（名前 + 型）

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
- `openclaw.message.delivery.started`（counter、attrs: `openclaw.channel`,
  `openclaw.delivery.kind`）
- `openclaw.message.delivery.duration_ms`（histogram、attrs:
  `openclaw.channel`, `openclaw.delivery.kind`, `openclaw.outcome`,
  `openclaw.errorCategory`）

キュー + セッション:

- `openclaw.queue.lane.enqueue`（counter、attrs: `openclaw.lane`）
- `openclaw.queue.lane.dequeue`（counter、attrs: `openclaw.lane`）
- `openclaw.queue.depth`（histogram、attrs: `openclaw.lane`または
  `openclaw.channel=heartbeat`）
- `openclaw.queue.wait_ms`（histogram、attrs: `openclaw.lane`）
- `openclaw.session.state`（counter、attrs: `openclaw.state`, `openclaw.reason`）
- `openclaw.session.stuck`（counter、attrs: `openclaw.state`）
- `openclaw.session.stuck_age_ms`（histogram、attrs: `openclaw.state`）
- `openclaw.run.attempt`（counter、attrs: `openclaw.attempt`）

Exec:

- `openclaw.exec.duration_ms`（histogram、attrs: `openclaw.exec.target`,
  `openclaw.exec.mode`, `openclaw.outcome`, `openclaw.failureKind`）

### エクスポートされるspan（名前 + 主要属性）

- `openclaw.model.usage`
  - `openclaw.channel`, `openclaw.provider`, `openclaw.model`
  - `openclaw.tokens.*` (`input`/`output`/`cache_read`/`cache_write`/`total`)
- `openclaw.run`
  - `openclaw.outcome`, `openclaw.channel`, `openclaw.provider`,
    `openclaw.model`, `openclaw.errorCategory`
- `openclaw.model.call`
  - `gen_ai.system`, `gen_ai.request.model`, `gen_ai.operation.name`,
    `openclaw.provider`, `openclaw.model`, `openclaw.api`,
    `openclaw.transport`
- `openclaw.tool.execution`
  - `gen_ai.tool.name`, `openclaw.toolName`, `openclaw.errorCategory`,
    `openclaw.tool.params.*`
- `openclaw.exec`
  - `openclaw.exec.target`, `openclaw.exec.mode`, `openclaw.outcome`,
    `openclaw.failureKind`, `openclaw.exec.command_length`,
    `openclaw.exec.exit_code`, `openclaw.exec.timed_out`
- `openclaw.webhook.processed`
  - `openclaw.channel`, `openclaw.webhook`, `openclaw.chatId`
- `openclaw.webhook.error`
  - `openclaw.channel`, `openclaw.webhook`, `openclaw.chatId`,
    `openclaw.error`
- `openclaw.message.processed`
  - `openclaw.channel`, `openclaw.outcome`, `openclaw.chatId`,
    `openclaw.messageId`, `openclaw.reason`
- `openclaw.message.delivery`
  - `openclaw.channel`, `openclaw.delivery.kind`, `openclaw.outcome`,
    `openclaw.errorCategory`, `openclaw.delivery.result_count`
- `openclaw.session.stuck`
  - `openclaw.state`, `openclaw.ageMs`, `openclaw.queueDepth`

コンテンツキャプチャが明示的に有効な場合、モデル/ツールspanには、オプトインした特定のコンテンツ
クラスに対して、制限付きかつマスキング済みの`openclaw.content.*`属性が含まれることもあります。

### サンプリング + フラッシュ

- トレースサンプリング: `diagnostics.otel.sampleRate`（0.0–1.0、ルートspanのみ）。
- メトリクスのエクスポート間隔: `diagnostics.otel.flushIntervalMs`（最小1000ms）。

### プロトコル注記

- OTLP/HTTPエンドポイントは`diagnostics.otel.endpoint`または
  `OTEL_EXPORTER_OTLP_ENDPOINT`で設定できます。
- エンドポイントにすでに`/v1/traces`または`/v1/metrics`が含まれている場合は、そのまま使用されます。
- エンドポイントにすでに`/v1/logs`が含まれている場合は、ログ用にそのまま使用されます。
- `OPENCLAW_OTEL_PRELOADED=1`は、plugin所有のNodeSDKを起動する代わりに、
  外部で登録済みのOpenTelemetry SDKをトレース/メトリクス用に再利用します。
- `diagnostics.otel.logs`は、メインロガー出力のOTLPログエクスポートを有効にします。

### ログエクスポートの挙動

- OTLPログは、`logging.file`に書き込まれるものと同じ構造化レコードを使います。
- `logging.level`（ファイルログレベル）に従います。コンソールのマスキングは
  OTLPログには適用されません。
- 大量ログ環境では、OTLP collector側のサンプリング/フィルタリングを推奨します。

## トラブルシューティングのヒント

- **Gatewayに到達できない?** まず`openclaw doctor`を実行してください。
- **ログが空?** Gatewayが実行中であり、`logging.file`の
  パスへ書き込んでいることを確認してください。
- **もっと詳しい情報が必要?** `logging.level`を`debug`または`trace`に設定して再試行してください。

## 関連

- [Gateway Logging Internals](/ja-JP/gateway/logging) — WSログスタイル、サブシステム接頭辞、コンソールキャプチャ
- [Diagnostics](/ja-JP/gateway/configuration-reference#diagnostics) — OpenTelemetryエクスポートとキャッシュトレース設定
