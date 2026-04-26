---
read_when:
    - OpenClaw のモデル使用量、メッセージフロー、またはセッションメトリクスをOpenTelemetry collector に送信したい
    - Grafana、Datadog、Honeycomb、New Relic、Tempo、または他のOTLPバックエンドに、traces、metrics、またはlogs を接続している
    - ダッシュボードやアラートを構築するために、正確なメトリクス名、span名、または属性の形が必要です
summary: diagnostics-otel Plugin（OTLP/HTTP）を使って、OpenClaw の診断情報を任意のOpenTelemetry collector にエクスポートする
title: OpenTelemetry エクスポート
x-i18n:
    generated_at: "2026-04-26T11:30:31Z"
    model: gpt-5.4
    provider: openai
    source_hash: 63fe66de2d046255a0e5b0eee8bbead2c9d278b8911bdc09bfee1e9c59294418
    source_path: gateway/opentelemetry.md
    workflow: 15
---

OpenClaw は、バンドル済みの `diagnostics-otel` Plugin を通じて診断情報をエクスポートします。方式は **OTLP/HTTP (protobuf)** です。OTLP/HTTP を受け付ける collector やバックエンドであれば、コード変更なしで動作します。ローカルのファイルログとその読み方については、[Logging](/ja-JP/logging) を参照してください。

## どのように連携するか

- **診断イベント** は、Gateway とバンドル済みPlugin が、モデル実行、メッセージフロー、セッション、キュー、exec のために出力する、構造化されたインプロセスレコードです。
- **`diagnostics-otel` Plugin** は、それらのイベントを購読し、OpenTelemetry の **metrics**、**traces**、**logs** として OTLP/HTTP 経由でエクスポートします。
- **プロバイダー呼び出し** は、プロバイダーtransport がカスタムheaders を受け付ける場合、OpenClaw の信頼されたモデル呼び出しspanコンテキストから W3C `traceparent` header を受け取ります。Plugin が出力したtraceコンテキストは伝播されません。
- エクスポーターは、診断サーフェスとPlugin の両方が有効な場合にのみ接続されるため、デフォルトでのインプロセスコストはほぼゼロです。

## クイックスタート

```json5
{
  plugins: {
    allow: ["diagnostics-otel"],
    entries: {
      "diagnostics-otel": { enabled: true },
    },
  },
  diagnostics: {
    enabled: true,
    otel: {
      enabled: true,
      endpoint: "http://otel-collector:4318",
      protocol: "http/protobuf",
      serviceName: "openclaw-gateway",
      traces: true,
      metrics: true,
      logs: true,
      sampleRate: 0.2,
      flushIntervalMs: 60000,
    },
  },
}
```

CLI からPlugin を有効にすることもできます。

```bash
openclaw plugins enable diagnostics-otel
```

<Note>
現在 `protocol` がサポートするのは `http/protobuf` のみです。`grpc` は無視されます。
</Note>

## エクスポートされるシグナル

| シグナル | 内容 |
| ----------- | ------------------------------------------------------------------------------------------------------------------------------------------ |
| **Metrics** | トークン使用量、コスト、実行時間、メッセージフロー、キューレーン、セッション状態、exec、メモリプレッシャーの counters と histograms。 |
| **Traces** | モデル使用量、モデル呼び出し、harness ライフサイクル、ツール実行、exec、webhook/メッセージ処理、コンテキスト組み立て、ツールループの spans。 |
| **Logs** | `diagnostics.otel.logs` が有効なときに OTLP 経由でエクスポートされる構造化 `logging.file` レコード。 |

`traces`、`metrics`、`logs` は個別に切り替えられます。`diagnostics.otel.enabled` が true のときは、3つともデフォルトで有効です。

## 設定リファレンス

```json5
{
  diagnostics: {
    enabled: true,
    otel: {
      enabled: true,
      endpoint: "http://otel-collector:4318",
      tracesEndpoint: "http://otel-collector:4318/v1/traces",
      metricsEndpoint: "http://otel-collector:4318/v1/metrics",
      logsEndpoint: "http://otel-collector:4318/v1/logs",
      protocol: "http/protobuf", // grpc is ignored
      serviceName: "openclaw-gateway",
      headers: { "x-collector-token": "..." },
      traces: true,
      metrics: true,
      logs: true,
      sampleRate: 0.2, // root-span sampler, 0.0..1.0
      flushIntervalMs: 60000, // metric export interval (min 1000ms)
      captureContent: {
        enabled: false,
        inputMessages: false,
        outputMessages: false,
        toolInputs: false,
        toolOutputs: false,
        systemPrompt: false,
      },
    },
  },
}
```

### 環境変数

| 変数 | 用途 |
| ----------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `OTEL_EXPORTER_OTLP_ENDPOINT` | `diagnostics.otel.endpoint` を上書きします。値にすでに `/v1/traces`、`/v1/metrics`、または `/v1/logs` が含まれている場合は、そのまま使用されます。 |
| `OTEL_EXPORTER_OTLP_TRACES_ENDPOINT` / `OTEL_EXPORTER_OTLP_METRICS_ENDPOINT` / `OTEL_EXPORTER_OTLP_LOGS_ENDPOINT` | 対応する `diagnostics.otel.*Endpoint` configキーが未設定のときに使われる、シグナルごとのエンドポイント上書きです。シグナルごとのconfig がシグナルごとのenv より優先され、それが共有endpoint より優先されます。 |
| `OTEL_SERVICE_NAME` | `diagnostics.otel.serviceName` を上書きします。 |
| `OTEL_EXPORTER_OTLP_PROTOCOL` | ワイヤプロトコルを上書きします（現時点で尊重されるのは `http/protobuf` のみです）。 |
| `OTEL_SEMCONV_STABILITY_OPT_IN` | `gen_ai_latest_experimental` に設定すると、従来の `gen_ai.system` ではなく、最新の実験的な GenAI span 属性（`gen_ai.provider.name`）を出力します。GenAI metrics は常に、有界で低カーディナリティなsemantic attributes を使います。 |
| `OPENCLAW_OTEL_PRELOADED` | 別の preload またはホストプロセスがすでにグローバル OpenTelemetry SDK を登録している場合は `1` に設定します。この場合 Plugin は自身の NodeSDK ライフサイクルをスキップしますが、診断リスナーの接続は行い、`traces`/`metrics`/`logs` も尊重します。 |

## プライバシーとコンテンツキャプチャ

生のモデル/ツールコンテンツは、デフォルトでは**エクスポートされません**。spans には、有界な識別子（channel、provider、model、error category、ハッシュのみの request id）が含まれ、プロンプトテキスト、応答テキスト、ツール入力、ツール出力、session keys は一切含まれません。

送信されるモデルリクエストには、W3C `traceparent` header が含まれることがあります。このheader は、アクティブなモデル呼び出しに対する OpenClaw 所有の診断traceコンテキストからのみ生成されます。既存の呼び出し元提供 `traceparent` headers は置き換えられるため、Plugin やカスタムプロバイダーオプションでサービス間traceの祖先関係を偽装することはできません。

`diagnostics.otel.captureContent.*` は、collector と保持ポリシーがプロンプト、応答、ツール、システムプロンプトのテキストに対して承認されている場合にのみ `true` にしてください。各サブキーは個別にオプトインします。

- `inputMessages` — ユーザープロンプト内容。
- `outputMessages` — モデル応答内容。
- `toolInputs` — ツール引数ペイロード。
- `toolOutputs` — ツール結果ペイロード。
- `systemPrompt` — 組み立て済みの system/developer prompt。

いずれかのサブキーが有効な場合、そのクラスに対してのみ、モデルとツールの spans に有界で秘匿化された `openclaw.content.*` 属性が付きます。

## サンプリングとフラッシュ

- **Traces:** `diagnostics.otel.sampleRate`（root-span のみ、`0.0` は全破棄、`1.0` は全保持）。
- **Metrics:** `diagnostics.otel.flushIntervalMs`（最小 `1000`）。
- **Logs:** OTLP logs は `logging.level`（ファイルログレベル）に従います。コンソールの秘匿化は OTLP logs には適用されません。高トラフィック環境では、ローカルサンプリングよりも OTLP collector 側のサンプリング/フィルタリングを推奨します。

## エクスポートされるメトリクス

### モデル使用量

- `openclaw.tokens`（counter、attrs: `openclaw.token`, `openclaw.channel`, `openclaw.provider`, `openclaw.model`, `openclaw.agent`）
- `openclaw.cost.usd`（counter、attrs: `openclaw.channel`, `openclaw.provider`, `openclaw.model`）
- `openclaw.run.duration_ms`（histogram、attrs: `openclaw.channel`, `openclaw.provider`, `openclaw.model`）
- `openclaw.context.tokens`（histogram、attrs: `openclaw.context`, `openclaw.channel`, `openclaw.provider`, `openclaw.model`）
- `gen_ai.client.token.usage`（histogram、GenAI semantic-conventions metric、attrs: `gen_ai.token.type` = `input`/`output`, `gen_ai.provider.name`, `gen_ai.operation.name`, `gen_ai.request.model`）
- `gen_ai.client.operation.duration`（histogram、秒、GenAI semantic-conventions metric、attrs: `gen_ai.provider.name`, `gen_ai.operation.name`, `gen_ai.request.model`, 任意で `error.type`）

### メッセージフロー

- `openclaw.webhook.received`（counter、attrs: `openclaw.channel`, `openclaw.webhook`）
- `openclaw.webhook.error`（counter、attrs: `openclaw.channel`, `openclaw.webhook`）
- `openclaw.webhook.duration_ms`（histogram、attrs: `openclaw.channel`, `openclaw.webhook`）
- `openclaw.message.queued`（counter、attrs: `openclaw.channel`, `openclaw.source`）
- `openclaw.message.processed`（counter、attrs: `openclaw.channel`, `openclaw.outcome`）
- `openclaw.message.duration_ms`（histogram、attrs: `openclaw.channel`, `openclaw.outcome`）
- `openclaw.message.delivery.started`（counter、attrs: `openclaw.channel`, `openclaw.delivery.kind`）
- `openclaw.message.delivery.duration_ms`（histogram、attrs: `openclaw.channel`, `openclaw.delivery.kind`, `openclaw.outcome`, `openclaw.errorCategory`）

### キューとセッション

- `openclaw.queue.lane.enqueue`（counter、attrs: `openclaw.lane`）
- `openclaw.queue.lane.dequeue`（counter、attrs: `openclaw.lane`）
- `openclaw.queue.depth`（histogram、attrs: `openclaw.lane` または `openclaw.channel=heartbeat`）
- `openclaw.queue.wait_ms`（histogram、attrs: `openclaw.lane`）
- `openclaw.session.state`（counter、attrs: `openclaw.state`, `openclaw.reason`）
- `openclaw.session.stuck`（counter、attrs: `openclaw.state`）
- `openclaw.session.stuck_age_ms`（histogram、attrs: `openclaw.state`）
- `openclaw.run.attempt`（counter、attrs: `openclaw.attempt`）

### Harness ライフサイクル

- `openclaw.harness.duration_ms`（histogram、attrs: `openclaw.harness.id`, `openclaw.harness.plugin`, `openclaw.outcome`, エラー時は `openclaw.harness.phase`）

### Exec

- `openclaw.exec.duration_ms`（histogram、attrs: `openclaw.exec.target`, `openclaw.exec.mode`, `openclaw.outcome`, `openclaw.failureKind`）

### 診断内部（メモリとツールループ）

- `openclaw.memory.heap_used_bytes`（histogram、attrs: `openclaw.memory.kind`）
- `openclaw.memory.rss_bytes`（histogram）
- `openclaw.memory.pressure`（counter、attrs: `openclaw.memory.level`）
- `openclaw.tool.loop.iterations`（counter、attrs: `openclaw.toolName`, `openclaw.outcome`）
- `openclaw.tool.loop.duration_ms`（histogram、attrs: `openclaw.toolName`, `openclaw.outcome`）

## エクスポートされる spans

- `openclaw.model.usage`
  - `openclaw.channel`, `openclaw.provider`, `openclaw.model`
  - `openclaw.tokens.*`（input/output/cache_read/cache_write/total）
  - デフォルトでは `gen_ai.system`、最新の GenAI semantic conventions を有効化した場合は `gen_ai.provider.name`
  - `gen_ai.request.model`, `gen_ai.operation.name`, `gen_ai.usage.*`
- `openclaw.run`
  - `openclaw.outcome`, `openclaw.channel`, `openclaw.provider`, `openclaw.model`, `openclaw.errorCategory`
- `openclaw.model.call`
  - デフォルトでは `gen_ai.system`、最新の GenAI semantic conventions を有効化した場合は `gen_ai.provider.name`
  - `gen_ai.request.model`, `gen_ai.operation.name`, `openclaw.provider`, `openclaw.model`, `openclaw.api`, `openclaw.transport`
  - `openclaw.provider.request_id_hash`（上流プロバイダー request id の有界な SHAベースハッシュ。生の id はエクスポートされません）
- `openclaw.harness.run`
  - `openclaw.harness.id`, `openclaw.harness.plugin`, `openclaw.outcome`, `openclaw.provider`, `openclaw.model`, `openclaw.channel`
  - 完了時: `openclaw.harness.result_classification`, `openclaw.harness.yield_detected`, `openclaw.harness.items.started`, `openclaw.harness.items.completed`, `openclaw.harness.items.active`
  - エラー時: `openclaw.harness.phase`, `openclaw.errorCategory`, 任意で `openclaw.harness.cleanup_failed`
- `openclaw.tool.execution`
  - `gen_ai.tool.name`, `openclaw.toolName`, `openclaw.errorCategory`, `openclaw.tool.params.*`
- `openclaw.exec`
  - `openclaw.exec.target`, `openclaw.exec.mode`, `openclaw.outcome`, `openclaw.failureKind`, `openclaw.exec.command_length`, `openclaw.exec.exit_code`, `openclaw.exec.timed_out`
- `openclaw.webhook.processed`
  - `openclaw.channel`, `openclaw.webhook`, `openclaw.chatId`
- `openclaw.webhook.error`
  - `openclaw.channel`, `openclaw.webhook`, `openclaw.chatId`, `openclaw.error`
- `openclaw.message.processed`
  - `openclaw.channel`, `openclaw.outcome`, `openclaw.chatId`, `openclaw.messageId`, `openclaw.reason`
- `openclaw.message.delivery`
  - `openclaw.channel`, `openclaw.delivery.kind`, `openclaw.outcome`, `openclaw.errorCategory`, `openclaw.delivery.result_count`
- `openclaw.session.stuck`
  - `openclaw.state`, `openclaw.ageMs`, `openclaw.queueDepth`
- `openclaw.context.assembled`
  - `openclaw.prompt.size`, `openclaw.history.size`, `openclaw.context.tokens`, `openclaw.errorCategory`（プロンプト、履歴、応答、session-key の内容は含みません）
- `openclaw.tool.loop`
  - `openclaw.toolName`, `openclaw.outcome`, `openclaw.iterations`, `openclaw.errorCategory`（ループメッセージ、params、ツール出力は含みません）
- `openclaw.memory.pressure`
  - `openclaw.memory.level`, `openclaw.memory.heap_used_bytes`, `openclaw.memory.rss_bytes`

コンテンツキャプチャを明示的に有効にした場合、モデルとツールの spans には、オプトインした特定のコンテンツクラスについて、有界で秘匿化された `openclaw.content.*` 属性が含まれることもあります。

## 診断イベントカタログ

以下のイベントが、上記のメトリクスと spans の元になります。Plugin は OTLP エクスポートなしでも、これらを直接購読できます。

**モデル使用量**

- `model.usage` — トークン、コスト、時間、コンテキスト、provider/model/channel、
  session ids。`usage` はコストとテレメトリのための provider/turn 会計であり、
  `context.used` は現在の prompt/context スナップショットです。キャッシュ入力や
  ツールループ呼び出しが含まれる場合、provider の `usage.total` より小さくなることがあります。

**メッセージフロー**

- `webhook.received` / `webhook.processed` / `webhook.error`
- `message.queued` / `message.processed`
- `message.delivery.started` / `message.delivery.completed` / `message.delivery.error`

**キューとセッション**

- `queue.lane.enqueue` / `queue.lane.dequeue`
- `session.state` / `session.stuck`
- `run.attempt`
- `diagnostic.heartbeat`（集計counters: webhooks/queue/session）

**Harness ライフサイクル**

- `harness.run.started` / `harness.run.completed` / `harness.run.error` —
  エージェントharness の実行ごとのライフサイクル。`harnessId`、任意の
  `pluginId`、provider/model/channel、run id を含みます。完了時には
  `durationMs`, `outcome`, 任意の `resultClassification`, `yieldDetected`,
  および `itemLifecycle` counts が追加されます。エラー時には `phase`
  （`prepare`/`start`/`send`/`resolve`/`cleanup`）、`errorCategory`、
  任意の `cleanupFailed` が追加されます。

**Exec**

- `exec.process.completed` — 最終結果、時間、target、mode、exit
  code、failure kind。コマンドテキストと作業ディレクトリは
  含まれません。

## エクスポーターなしで使う

`diagnostics-otel` を実行しなくても、診断イベントを Plugin やカスタムsink で利用可能にしておけます。

```json5
{
  diagnostics: { enabled: true },
}
```

`logging.level` を上げずに、対象を絞ったデバッグ出力を行うには diagnostics
flags を使います。flags は大文字小文字を区別せず、ワイルドカードもサポートします（例: `telegram.*` または
`*`）。

```json5
{
  diagnostics: { flags: ["telegram.http"] },
}
```

または、一時的なenv上書きとして:

```bash
OPENCLAW_DIAGNOSTICS=telegram.http,telegram.payload openclaw gateway
```

flag 出力は標準ログファイル（`logging.file`）に出力され、引き続き `logging.redactSensitive` によって秘匿化されます。完全ガイド:
[Diagnostics flags](/ja-JP/diagnostics/flags)。

## 無効化

```json5
{
  diagnostics: { otel: { enabled: false } },
}
```

`plugins.allow` から `diagnostics-otel` を外すこともできますし、
`openclaw plugins disable diagnostics-otel` を実行しても構いません。

## 関連

- [Logging](/ja-JP/logging) — ファイルログ、コンソール出力、CLI tail、Control UI Logs タブ
- [Gateway logging internals](/ja-JP/gateway/logging) — WSログスタイル、サブシステムプレフィックス、コンソールキャプチャ
- [Diagnostics flags](/ja-JP/diagnostics/flags) — 対象を絞ったデバッグログflags
- [Diagnostics export](/ja-JP/gateway/diagnostics) — オペレーター向けサポートバンドルツール（OTEL エクスポートとは別）
- [Configuration reference](/ja-JP/gateway/configuration-reference#diagnostics) — 完全な `diagnostics.*` フィールドリファレンス
