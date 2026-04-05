---
read_when:
    - nodeクライアント（iOS/Android/macOSのnodeモード）を構築またはデバッグしている
    - pairingまたはbridge認証の失敗を調査している
    - Gatewayが公開するnode向けsurfaceを監査している
summary: '履歴上のbridge protocol（legacy node）: TCP JSONL、pairing、スコープ付きRPC'
title: Bridge Protocol
x-i18n:
    generated_at: "2026-04-05T12:43:02Z"
    model: gpt-5.4
    provider: openai
    source_hash: 2bc25c388f3d65944167d05ca78f987c84ca480f0213e3485b118ebf4858c50f
    source_path: gateway/bridge-protocol.md
    workflow: 15
---

# Bridge protocol（legacy node transport）

<Warning>
TCP bridgeは**削除されました**。現在のOpenClawビルドにはbridge listenerが含まれておらず、`bridge.*` configキーもスキーマから削除されています。このページは歴史的な参考情報としてのみ残されています。すべてのnode/operatorクライアントでは[Gateway Protocol](/gateway/protocol)を使用してください。
</Warning>

## なぜ存在していたのか

- **セキュリティ境界**: bridgeはGateway API surface全体ではなく、小さなallowlistのみを公開します。
- **pairing + node identity**: nodeの受け入れはGatewayが管理し、nodeごとのトークンに結び付けられます。
- **Discovery UX**: nodeはLAN上でBonjour経由でGatewayを発見するか、tailnet経由で直接接続できます。
- **Loopback WS**: 完全なWS control planeは、SSHでトンネルされない限りローカルのままです。

## Transport

- TCP、1行ごとに1つのJSONオブジェクト（JSONL）。
- 任意のTLS（`bridge.tls.enabled` がtrueのとき）。
- 以前のデフォルトlistenerポートは `18790` でした（現在のビルドではTCP bridgeは起動しません）。

TLSが有効な場合、discovery TXTレコードには非秘密のヒントとして `bridgeTls=1` と `bridgeTlsSha256` が含まれます。なお、Bonjour/mDNS TXTレコードには認証がないため、クライアントは明示的なユーザー意思やその他の帯域外検証なしに、広告されたフィンガープリントを信頼できるpinとして扱ってはいけません。

## Handshake + pairing

1. クライアントは、nodeメタデータとトークン（すでにpair済みの場合）を含む `hello` を送信します。
2. pairされていない場合、Gatewayは `error`（`NOT_PAIRED`/`UNAUTHORIZED`）を返します。
3. クライアントは `pair-request` を送信します。
4. Gatewayは承認を待ち、その後 `pair-ok` と `hello-ok` を送信します。

過去には、`hello-ok` は `serverName` を返し、`canvasHostUrl` を含むこともありました。

## Frames

クライアント → Gateway:

- `req` / `res`: スコープ付きGateway RPC（chat、sessions、config、health、voicewake、skills.bins）
- `event`: nodeシグナル（voice transcript、agent request、chat subscribe、exec lifecycle）

Gateway → クライアント:

- `invoke` / `invoke-res`: nodeコマンド（`canvas.*`、`camera.*`、`screen.record`、`location.get`、`sms.send`）
- `event`: subscribeされたsession向けのchat更新
- `ping` / `pong`: keepalive

過去のallowlist強制は `src/gateway/server-bridge.ts` にありました（現在は削除済み）。

## Exec lifecycle events

nodeは `exec.finished` または `exec.denied` eventを送信して、system.runアクティビティを表面化できます。
これらはGateway内でsystem eventにマッピングされます。（legacy nodeは `exec.started` をまだ送信することがあります。）

ペイロードフィールド（特記がない限りすべて任意）:

- `sessionKey`（必須）: system eventを受け取るagent session。
- `runId`: グループ化のための一意なexec id。
- `command`: 生の、または整形済みのコマンド文字列。
- `exitCode`、`timedOut`、`success`、`output`: 完了の詳細（finishedのみ）。
- `reason`: 拒否理由（deniedのみ）。

## 履歴上のtailnet利用

- bridgeをtailnet IPにbindするには: `~/.openclaw/openclaw.json` で `bridge.bind: "tailnet"` を設定します（履歴情報のみ。`bridge.*` はもう有効ではありません）。
- クライアントはMagicDNS名またはtailnet IP経由で接続します。
- Bonjourはネットワークをまたがりません。必要な場合は手動のhost/portまたは広域DNS‑SDを使用してください。

## Versioning

bridgeは**暗黙のv1**でした（min/maxネゴシエーションなし）。このセクションは歴史的参考情報のみです。現在のnode/operatorクライアントはWebSocketの
[Gateway Protocol](/gateway/protocol)を使用します。
