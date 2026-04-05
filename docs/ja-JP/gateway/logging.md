---
read_when:
    - ログ出力または形式を変更するとき
    - CLIまたはGateway出力をデバッグするとき
summary: ログサーフェス、ファイルログ、WSログスタイル、コンソール書式設定
title: Gatewayログ
x-i18n:
    generated_at: "2026-04-05T12:44:02Z"
    model: gpt-5.4
    provider: openai
    source_hash: 465fe66ae6a3bc844e75d3898aed15b3371481c4fe89ede40e5a9377e19bb74c
    source_path: gateway/logging.md
    workflow: 15
---

# ログ

ユーザー向けの概要（CLI + Control UI + 設定）については、[/logging](/logging) を参照してください。

OpenClawには2つのログ「サーフェス」があります。

- **コンソール出力**（ターミナル / Debug UIで見えるもの）。
- **ファイルログ**（Gatewayロガーによって書き込まれるJSON lines）。

## ファイルベースのロガー

- デフォルトのローテーションログファイルは `/tmp/openclaw/` 配下にあります（1日1ファイル）: `openclaw-YYYY-MM-DD.log`
  - 日付はGatewayホストのローカルタイムゾーンを使用します。
- ログファイルのパスとレベルは `~/.openclaw/openclaw.json` で設定できます。
  - `logging.file`
  - `logging.level`

ファイル形式は、1行ごとに1つのJSONオブジェクトです。

Control UIのLogsタブは、Gateway経由でこのファイルをtailします（`logs.tail`）。
CLIでも同じことができます。

```bash
openclaw logs --follow
```

**詳細出力とログレベル**

- **ファイルログ** は `logging.level` のみによって制御されます。
- `--verbose` は **コンソールの詳細度**（およびWSログスタイル）にのみ影響し、ファイルログレベルは
  上げません。
- 詳細出力専用の情報をファイルログに記録するには、`logging.level` を `debug` または
  `trace` に設定してください。

## コンソールキャプチャ

CLIは `console.log/info/warn/error/debug/trace` をキャプチャしてファイルログに書き込みつつ、
stdout/stderr への出力も継続します。

コンソールの詳細度は次で個別に調整できます。

- `logging.consoleLevel`（デフォルト `info`）
- `logging.consoleStyle`（`pretty` | `compact` | `json`）

## ツール要約の秘匿化

詳細なツール要約（たとえば `🛠️ Exec: ...`）は、コンソールストリームに到達する前に機密トークンをマスクできます。これは**ツール専用**であり、ファイルログは変更しません。

- `logging.redactSensitive`: `off` | `tools`（デフォルト: `tools`）
- `logging.redactPatterns`: 正規表現文字列の配列（デフォルトを上書き）
  - 生の正規表現文字列（自動で `gi`）を使うか、独自フラグが必要なら `/pattern/flags` を使用してください。
  - 一致箇所は、先頭6文字 + 末尾4文字を残してマスクされます（長さが18以上の場合）。それ以外は `***` になります。
  - デフォルトでは、一般的なキー代入、CLIフラグ、JSONフィールド、bearerヘッダー、PEMブロック、一般的なトークン接頭辞をカバーします。

## Gateway WebSocketログ

GatewayはWebSocketプロトコルログを2つのモードで出力します。

- **通常モード（`--verbose` なし）**: 「重要な」RPC結果のみを出力します。
  - エラー（`ok=false`）
  - 低速呼び出し（デフォルトしきい値: `>= 50ms`）
  - パースエラー
- **詳細モード（`--verbose`）**: すべてのWSリクエスト/レスポンストラフィックを出力します。

### WSログスタイル

`openclaw gateway` はGatewayごとのスタイル切り替えをサポートしています。

- `--ws-log auto`（デフォルト）: 通常モードは最適化され、詳細モードではコンパクト出力を使用します
- `--ws-log compact`: 詳細モード時にコンパクト出力（ペア化されたリクエスト/レスポンス）
- `--ws-log full`: 詳細モード時にフレームごとの完全出力
- `--compact`: `--ws-log compact` のエイリアス

例:

```bash
# 最適化（エラー/低速のみ）
openclaw gateway

# すべてのWSトラフィックを表示（ペア）
openclaw gateway --verbose --ws-log compact

# すべてのWSトラフィックを表示（完全なメタ情報）
openclaw gateway --verbose --ws-log full
```

## コンソール書式設定（サブシステムログ）

コンソールフォーマッターは**TTY認識**で、一貫した接頭辞付き行を出力します。
サブシステムロガーは、出力をグループ化し、見やすく保ちます。

動作:

- すべての行に**サブシステム接頭辞**（例: `[gateway]`, `[canvas]`, `[tailscale]`）
- **サブシステムカラー**（サブシステムごとに安定）とレベルカラー
- **出力先がTTYの場合、または環境がリッチターミナルに見える場合に色を使用**（`TERM`/`COLORTERM`/`TERM_PROGRAM`）。`NO_COLOR` を尊重
- **短縮されたサブシステム接頭辞**: 先頭の `gateway/` と `channels/` を落とし、末尾2セグメントを保持（例: `whatsapp/outbound`）
- **サブシステムごとのサブログロガー**（自動接頭辞 + 構造化フィールド `{ subsystem }`）
- QR/UX出力用の **`logRaw()`**（接頭辞なし、書式設定なし）
- **コンソールスタイル**（例: `pretty | compact | json`）
- **コンソールログレベル** はファイルログレベルとは別です（`logging.level` が `debug`/`trace` に設定されている場合、ファイルは完全な詳細を保持）
- **WhatsAppメッセージ本文** は `debug` で記録されます（表示するには `--verbose` を使用）

これにより、既存のファイルログを安定に保ちながら、対話的出力を見やすくできます。
