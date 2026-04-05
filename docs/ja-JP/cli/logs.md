---
read_when:
    - Gatewayログをリモートで追跡したいとき（SSHなしで）
    - ツール用にJSONログ行が必要なとき
summary: '`openclaw logs`のCLIリファレンス（RPC経由でGatewayログを追跡）'
title: logs
x-i18n:
    generated_at: "2026-04-05T12:38:47Z"
    model: gpt-5.4
    provider: openai
    source_hash: 238a52e31a9a332cab513ced049e92d032b03c50376895ce57dffa2ee7d1e4b4
    source_path: cli/logs.md
    workflow: 15
---

# `openclaw logs`

RPC経由でGatewayファイルログを追跡します（リモートモードで動作します）。

関連:

- ロギング概要: [Logging](/logging)
- Gateway CLI: [gateway](/cli/gateway)

## オプション

- `--limit <n>`: 返すログ行の最大数（デフォルト`200`）
- `--max-bytes <n>`: ログファイルから読み取る最大バイト数（デフォルト`250000`）
- `--follow`: ログストリームを追跡する
- `--interval <ms>`: 追跡中のポーリング間隔（デフォルト`1000`）
- `--json`: 行区切りJSONイベントを出力する
- `--plain`: スタイル付き書式なしのプレーンテキスト出力
- `--no-color`: ANSIカラーを無効にする
- `--local-time`: タイムスタンプをローカルタイムゾーンで表示する

## 共有Gateway RPCオプション

`openclaw logs`は標準のGatewayクライアントフラグも受け付けます。

- `--url <url>`: Gateway WebSocket URL
- `--token <token>`: Gatewayトークン
- `--timeout <ms>`: タイムアウト（ミリ秒、デフォルト`30000`）
- `--expect-final`: Gateway呼び出しがagent-backedの場合、最終応答を待機する

`--url`を渡す場合、CLIは設定や環境認証情報を自動適用しません。対象Gatewayで認証が必要な場合は、`--token`を明示的に含めてください。

## 例

```bash
openclaw logs
openclaw logs --follow
openclaw logs --follow --interval 2000
openclaw logs --limit 500 --max-bytes 500000
openclaw logs --json
openclaw logs --plain
openclaw logs --no-color
openclaw logs --limit 500
openclaw logs --local-time
openclaw logs --follow --local-time
openclaw logs --url ws://127.0.0.1:18789 --token "$OPENCLAW_GATEWAY_TOKEN"
```

## 注記

- タイムスタンプをローカルタイムゾーンで表示するには`--local-time`を使用してください。
- local loopback Gatewayがペアリングを要求した場合、`openclaw logs`は自動的に設定済みのローカルログファイルへフォールバックします。明示的な`--url`ターゲットでは、このフォールバックは使用されません。
