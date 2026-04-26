---
read_when:
    - ログ出力や形式の変更
    - CLIまたはgateway出力のデバッグ
summary: ログ出力先、ファイルログ、WSログスタイル、コンソール書式設定
title: Gatewayログ記録
x-i18n:
    generated_at: "2026-04-26T11:29:55Z"
    model: gpt-5.4
    provider: openai
    source_hash: c005cfc4cfe456b3734d3928a16c9cd131a2b465d46f2aba9c9c61db22dcc399
    source_path: gateway/logging.md
    workflow: 15
---

# ログ記録

ユーザー向けの概要（CLI + Control UI + config）については、[/logging](/ja-JP/logging) を参照してください。

OpenClaw には2つのログ「サーフェス」があります。

- **コンソール出力**（ターミナル / Debug UI で表示されるもの）。
- gateway logger によって書き込まれる **ファイルログ**（JSON lines）。

## ファイルベースロガー

- デフォルトのローテーションログファイルは `/tmp/openclaw/` 配下です（1日1ファイル）: `openclaw-YYYY-MM-DD.log`
  - 日付は gateway ホストのローカルタイムゾーンを使用します。
- アクティブなログファイルは `logging.maxFileBytes`（デフォルト: 100 MB）でローテーションし、
  最大5つの番号付きアーカイブを保持して、新しいアクティブファイルへの書き込みを続けます。
- ログファイルのパスとレベルは `~/.openclaw/openclaw.json` で設定できます。
  - `logging.file`
  - `logging.level`

ファイル形式は、1行につき1つのJSONオブジェクトです。

Control UI の Logs タブは gateway 経由でこのファイルをtailします（`logs.tail`）。
CLIでも同じことができます。

```bash
openclaw logs --follow
```

**Verbose とログレベルの違い**

- **ファイルログ** は `logging.level` だけで制御されます。
- `--verbose` が影響するのは **コンソールの詳細度**（およびWSログスタイル）だけであり、
  ファイルログレベルは上がりません。
- verbose専用の詳細もファイルログに記録したい場合は、`logging.level` を `debug` または
  `trace` に設定してください。

## コンソールキャプチャ

CLIは `console.log/info/warn/error/debug/trace` をキャプチャしてファイルログに書き込みつつ、
stdout/stderr にも引き続き出力します。

コンソールの詳細度は、次で独立して調整できます。

- `logging.consoleLevel`（デフォルト `info`）
- `logging.consoleStyle`（`pretty` | `compact` | `json`）

## ツール要約の秘匿化

詳細なツール要約（例: `🛠️ Exec: ...`）は、コンソールストリームに出る前に機密トークンをマスクできます。これは **ツールのみ** が対象で、ファイルログは変更しません。

- `logging.redactSensitive`: `off` | `tools`（デフォルト: `tools`）
- `logging.redactPatterns`: regex文字列の配列（デフォルトを上書き）
  - 生のregex文字列（自動で `gi`）を使うか、カスタムflags が必要な場合は `/pattern/flags` を使ってください。
  - 一致部分は、先頭6文字 + 末尾4文字を残してマスクされます（長さが18以上の場合）。それ以外は `***` になります。
  - デフォルトでは、一般的なキー代入、CLI flags、JSON fields、bearer headers、PEM blocks、よく使われるトークンprefix を対象にします。

## Gateway WebSocket ログ

gateway は、2つのモードでWebSocketプロトコルログを出力します。

- **通常モード（`--verbose` なし）**: 「重要な」RPC結果だけを出力します。
  - エラー（`ok=false`）
  - 遅い呼び出し（デフォルト閾値: `>= 50ms`）
  - パースエラー
- **verboseモード（`--verbose`）**: すべてのWSリクエスト/レスポンストラフィックを出力します。

### WSログスタイル

`openclaw gateway` は、gatewayごとのスタイル切り替えをサポートします。

- `--ws-log auto`（デフォルト）: 通常モードでは最適化され、verboseモードでは compact 出力を使います
- `--ws-log compact`: verbose時に compact 出力（対応する request/response）
- `--ws-log full`: verbose時にフレームごとの完全出力
- `--compact`: `--ws-log compact` のエイリアス

例:

```bash
# 最適化（エラー/低速のみ）
openclaw gateway

# すべてのWSトラフィックを表示（対応表示）
openclaw gateway --verbose --ws-log compact

# すべてのWSトラフィックを表示（完全なメタ情報）
openclaw gateway --verbose --ws-log full
```

## コンソール書式設定（サブシステムログ記録）

コンソールフォーマッターは **TTY対応** で、一貫したプレフィックス付き行を出力します。
サブシステムロガーにより、出力はまとまりがあり確認しやすくなります。

動作:

- 各行に **サブシステムプレフィックス**（例: `[gateway]`, `[canvas]`, `[tailscale]`）
- **サブシステムごとの色**（サブシステムごとに安定）に加えてレベル色分け
- **出力先がTTYであるか、環境がリッチターミナルらしい場合に色付け**（`TERM`/`COLORTERM`/`TERM_PROGRAM`）、`NO_COLOR` を尊重
- **短縮されたサブシステムプレフィックス**: 先頭の `gateway/` + `channels/` を落とし、末尾2セグメントを保持（例: `whatsapp/outbound`）
- **サブシステムごとのサブロガー**（自動プレフィックス + 構造化フィールド `{ subsystem }`）
- QR/UX出力用の **`logRaw()`**（プレフィックスなし、書式設定なし）
- **コンソールスタイル**（例: `pretty | compact | json`）
- **コンソールログレベル** はファイルログレベルと別です（`logging.level` が `debug`/`trace` の場合、ファイルは完全な詳細を保持）
- **WhatsApp メッセージ本文** は `debug` で記録されます（確認するには `--verbose` を使ってください）

これにより、既存のファイルログを安定させたまま、対話的な出力を確認しやすくします。

## 関連

- [Logging](/ja-JP/logging)
- [OpenTelemetry export](/ja-JP/gateway/opentelemetry)
- [Diagnostics export](/ja-JP/gateway/diagnostics)
