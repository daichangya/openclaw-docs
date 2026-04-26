---
read_when:
    - OpenClawのロギングについて、初心者向けのわかりやすい概要が必要です
    - ログレベル、形式、または秘匿化を設定したい場合
    - トラブルシューティング中で、ログをすばやく見つける必要があります
summary: ファイルログ、コンソール出力、CLIでの追跡、Control UIのLogsタブ
title: ロギング
x-i18n:
    generated_at: "2026-04-26T11:34:23Z"
    model: gpt-5.4
    provider: openai
    source_hash: 6fa55caa65a2a06a757e37ad64c5fd030f958cf6827596db5c183c6c6db2ed9b
    source_path: logging.md
    workflow: 15
---

OpenClawには、主に2つのログ出力面があります。

- **ファイルログ**（JSON lines）— Gatewayが書き込みます。
- **コンソール出力** — ターミナルとGateway Debug UIに表示されます。

Control UIの **Logs** タブは、gatewayのファイルログを追跡表示します。このページでは、
ログの保存場所、読み方、ログレベルと形式の設定方法を説明します。

## ログの保存場所

デフォルトでは、Gatewayは次の場所にローテーションするログファイルを書き込みます。

`/tmp/openclaw/openclaw-YYYY-MM-DD.log`

日付はgatewayホストのローカルタイムゾーンを使用します。

各ファイルは `logging.maxFileBytes`（デフォルト: 100 MB）に達するとローテーションします。
OpenClawは、アクティブファイルの横に `openclaw-YYYY-MM-DD.1.log` のような番号付きアーカイブを最大5つ保持し、
診断を抑止せず、新しいアクティブログへ書き込み続けます。

これは `~/.openclaw/openclaw.json` で上書きできます。

```json
{
  "logging": {
    "file": "/path/to/openclaw.log"
  }
}
```

## ログの読み方

### CLI: ライブ追跡（推奨）

CLIを使って、RPC経由でgatewayログファイルを追跡できます。

```bash
openclaw logs --follow
```

現在利用できる便利なオプション:

- `--local-time`: タイムスタンプをローカルタイムゾーンで表示
- `--url <url>` / `--token <token>` / `--timeout <ms>`: 標準のGateway RPCフラグ
- `--expect-final`: agentベースRPCの最終レスポンス待機フラグ（共有クライアント層経由でここでも受け付けます）

出力モード:

- **TTYセッション**: 見やすく、色付きで、構造化されたログ行。
- **非TTYセッション**: プレーンテキスト。
- `--json`: 行区切りJSON（1行につき1つのログイベント）。
- `--plain`: TTYセッションでも強制的にプレーンテキストにする。
- `--no-color`: ANSIカラーを無効化。

明示的な `--url` を渡すと、CLIは設定や
環境変数の認証情報を自動適用しません。対象Gateway
が認証を要求する場合は、自分で `--token` を含めてください。

JSONモードでは、CLIは `type` 付きオブジェクトを出力します。

- `meta`: ストリームメタデータ（file, cursor, size）
- `log`: 解析済みログエントリ
- `notice`: 切り捨て / ローテーションのヒント
- `raw`: 未解析のログ行

ローカルloopback Gatewayがペアリングを要求した場合、`openclaw logs` は
自動的に設定済みローカルログファイルへフォールバックします。明示的な `--url` ターゲットでは、
このフォールバックは使われません。

Gatewayに到達できない場合、CLIは次を実行する短いヒントを表示します。

```bash
openclaw doctor
```

### Control UI（web）

Control UIの **Logs** タブは、`logs.tail` を使用して同じファイルを追跡します。
開き方は [/web/control-ui](/ja-JP/web/control-ui) を参照してください。

### チャンネル専用ログ

チャンネル活動（WhatsApp/Telegramなど）だけを絞り込むには、次を使用します。

```bash
openclaw channels logs --channel whatsapp
```

## ログ形式

### ファイルログ（JSONL）

ログファイルの各行はJSONオブジェクトです。CLIとControl UIは、これらの
エントリを解析して構造化された出力（時刻、レベル、サブシステム、メッセージ）を表示します。

### コンソール出力

コンソールログは **TTY対応** で、読みやすさ重視の形式です。

- サブシステム接頭辞（例: `gateway/channels/whatsapp`）
- レベルごとの色付け（info/warn/error）
- 任意のcompactモードまたはJSONモード

コンソール形式は `logging.consoleStyle` で制御されます。

### Gateway WebSocketログ

`openclaw gateway` には、RPCトラフィック用のWebSocketプロトコルログもあります。

- 通常モード: 重要な結果のみ（errors, parse errors, slow calls）
- `--verbose`: すべての request/response トラフィック
- `--ws-log auto|compact|full`: 詳細表示の形式を選択
- `--compact`: `--ws-log compact` のエイリアス

例:

```bash
openclaw gateway
openclaw gateway --verbose --ws-log compact
openclaw gateway --verbose --ws-log full
```

## ロギングの設定

すべてのロギング設定は `~/.openclaw/openclaw.json` の `logging` 配下にあります。

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

- `logging.level`: **ファイルログ**（JSONL）のレベル。
- `logging.consoleLevel`: **コンソール** の詳細レベル。

両方とも **`OPENCLAW_LOG_LEVEL`** 環境変数で上書きできます（例: `OPENCLAW_LOG_LEVEL=debug`）。この環境変数は設定ファイルより優先されるため、`openclaw.json` を編集せずに1回の実行だけ詳細レベルを上げられます。グローバルCLIオプション **`--log-level <level>`**（例: `openclaw --log-level debug gateway run`）を渡すこともでき、この場合、そのコマンドでは環境変数より優先されます。

`--verbose` はコンソール出力とWSログ詳細にのみ影響し、
ファイルログレベルは変更しません。

### コンソールスタイル

`logging.consoleStyle`:

- `pretty`: 人間向け、色付き、タイムスタンプ付き。
- `compact`: より詰めた出力（長時間セッションに最適）。
- `json`: 1行ごとにJSON（ログプロセッサ向け）。

### 秘匿化

ツールサマリーは、コンソールに出力される前に機密トークンを秘匿化できます。

- `logging.redactSensitive`: `off` | `tools`（デフォルト: `tools`）
- `logging.redactPatterns`: デフォルトセットを上書きするregex文字列の一覧

秘匿化は、**コンソール出力**、**stderrへ送られる
コンソール診断**、および **ファイルログ** のロギングシンクで適用されます。ファイルログはJSONLのままですが、
一致したシークレット値は、行がディスクへ書き込まれる前にマスクされます。

## DiagnosticsとOpenTelemetry

Diagnosticsは、モデル実行および
メッセージフローテレメトリ（webhook、queueing、session state）向けの構造化された機械可読イベントです。これは
ログの代替ではなく、メトリクス、トレース、エクスポーターへデータを供給します。イベントは、
エクスポートするかどうかに関係なく、プロセス内で発行されます。

隣接する2つの出力面:

- **OpenTelemetry export** — メトリクス、トレース、ログをOTLP/HTTP経由で、
  OpenTelemetry互換のcollectorまたはbackend（Grafana, Datadog,
  Honeycomb, New Relic, Tempo など）へ送信します。完全な設定、シグナルカタログ、
  metric/span名、環境変数、プライバシーモデルは専用ページにあります:
  [OpenTelemetry export](/ja-JP/gateway/opentelemetry)。
- **Diagnostics flags** — `logging.level` を上げずに、追加ログを
  `logging.file` へ送るためのターゲットdebugログフラグです。フラグは大文字小文字を区別せず、
  ワイルドカード（`telegram.*`, `*`）をサポートします。`diagnostics.flags`
  配下または `OPENCLAW_DIAGNOSTICS=...` 環境変数上書きで設定します。完全ガイド:
  [Diagnostics flags](/ja-JP/diagnostics/flags)。

OTLPエクスポートなしで、Pluginやカスタムシンク向けにdiagnosticsイベントを有効化するには:

```json5
{
  diagnostics: { enabled: true },
}
```

collectorへのOTLPエクスポートについては、[OpenTelemetry export](/ja-JP/gateway/opentelemetry) を参照してください。

## トラブルシューティングのヒント

- **Gatewayに到達できない?** まず `openclaw doctor` を実行してください。
- **ログが空?** Gatewayが実行中で、`logging.file`
  で指定されたパスへ書き込んでいることを確認してください。
- **もっと詳細が必要?** `logging.level` を `debug` または `trace` に設定して再試行してください。

## 関連

- [OpenTelemetry export](/ja-JP/gateway/opentelemetry) — OTLP/HTTPエクスポート、metric/spanカタログ、プライバシーモデル
- [Diagnostics flags](/ja-JP/diagnostics/flags) — ターゲットdebugログフラグ
- [Gateway logging internals](/ja-JP/gateway/logging) — WSログスタイル、サブシステム接頭辞、コンソールキャプチャ
- [Configuration reference](/ja-JP/gateway/configuration-reference#diagnostics) — 完全な `diagnostics.*` フィールドリファレンス
