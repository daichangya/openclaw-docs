---
read_when:
    - 外部CLI integrationを追加または変更するとき
    - RPC adapter（signal-cli、imsg）をデバッグするとき
summary: 外部CLI（signal-cli、legacy imsg）向けのRPC adapterとGatewayパターン
title: RPC Adapters
x-i18n:
    generated_at: "2026-04-05T12:55:07Z"
    model: gpt-5.4
    provider: openai
    source_hash: 06dc6b97184cc704ba4ec4a9af90502f4316bcf717c3f4925676806d8b184c57
    source_path: reference/rpc.md
    workflow: 15
---

# RPC adapters

OpenClawはJSON-RPC経由で外部CLIを統合します。現在は2つのパターンが使われています。

## パターンA: HTTP daemon（signal-cli）

- `signal-cli` はHTTP経由のJSON-RPCを持つdaemonとして動作します。
- Event streamはSSE（`/api/v1/events`）です。
- Health probe: `/api/v1/check`。
- `channels.signal.autoStart=true` の場合、OpenClawがlifecycleを管理します。

セットアップとendpointについては [Signal](/ja-JP/channels/signal) を参照してください。

## パターンB: stdio child process（legacy: imsg）

> **注:** 新しいiMessageセットアップでは、代わりに [BlueBubbles](/ja-JP/channels/bluebubbles) を使ってください。

- OpenClawは `imsg rpc` をchild processとしてspawnします（レガシーiMessage integration）。
- JSON-RPCはstdin/stdout上で行区切りです（1行に1つのJSON object）。
- TCP portはなく、daemonも不要です。

使用される主なmethod:

- `watch.subscribe` → 通知（`method: "message"`）
- `watch.unsubscribe`
- `send`
- `chats.list`（probe/diagnostics）

レガシーセットアップとアドレッシング（`chat_id` 推奨）については [iMessage](/ja-JP/channels/imessage) を参照してください。

## Adapterガイドライン

- Gatewayがprocessを管理します（start/stopはprovider lifecycleに結び付く）。
- RPC clientは回復力を持たせてください: timeout、終了時のrestart。
- 表示文字列より安定ID（例: `chat_id`）を優先してください。
