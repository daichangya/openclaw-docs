---
read_when:
    - Node クライアント（iOS/Android/macOS の Node モード）を構築またはデバッグする場合
    - ペアリングやブリッジ認証の失敗を調査する場合
    - Gateway が公開する Node サーフェスを監査する場合
summary: '履歴的ブリッジプロトコル（レガシー Node）: TCP JSONL、ペアリング、スコープ付き RPC'
title: ブリッジプロトコル
x-i18n:
    generated_at: "2026-04-25T13:46:24Z"
    model: gpt-5.4
    provider: openai
    source_hash: cb07ec4dab4394dd03b4c0002d6a842a9d77d12a1fc2f141f01d5a306fab1615
    source_path: gateway/bridge-protocol.md
    workflow: 15
---

<Warning>
TCP ブリッジは**削除されました**。現在の OpenClaw ビルドにはブリッジリスナーは含まれておらず、`bridge.*` 設定キーもスキーマから削除されています。このページは履歴的な参照専用として保持されています。すべての Node/オペレータークライアントでは [Gateway Protocol](/ja-JP/gateway/protocol) を使用してください。
</Warning>

## なぜ存在していたのか

- **セキュリティ境界**: ブリッジは Gateway API 全面ではなく、小さな Allowlist を公開していました。
- **ペアリング + Node ID**: Node の受け入れは Gateway が管理し、Node ごとのトークンに結び付けられていました。
- **検出 UX**: Node は LAN 上で Bonjour 経由で Gateway を検出するか、tailnet 上で直接接続できました。
- **loopback WS**: 完全な WS 制御プレーンは、SSH でトンネルしない限りローカルのままでした。

## トランスポート

- TCP、1行ごとに1つの JSON オブジェクト（JSONL）。
- オプションの TLS（`bridge.tls.enabled` が true の場合）。
- 履歴上のデフォルトリスナーポートは `18790` でした（現在のビルドでは TCP ブリッジは起動しません）。

TLS が有効な場合、discovery TXT レコードには `bridgeTls=1` と、
非秘密ヒントとしての `bridgeTlsSha256` が含まれていました。Bonjour/mDNS TXT レコードは
認証されない点に注意してください。クライアントは、明示的なユーザー意図やその他の帯域外検証なしに、
広告された fingerprint を信頼できる pin として扱ってはいけません。

## ハンドシェイク + ペアリング

1. クライアントは、Node メタデータ + トークン（すでにペアリング済みの場合）を付けて `hello` を送信します。
2. ペアリングされていない場合、Gateway は `error`（`NOT_PAIRED`/`UNAUTHORIZED`）を返します。
3. クライアントは `pair-request` を送信します。
4. Gateway は承認を待ち、その後 `pair-ok` と `hello-ok` を送信します。

履歴上、`hello-ok` は `serverName` を返し、`canvasHostUrl` を含むこともありました。

## フレーム

クライアント → Gateway:

- `req` / `res`: スコープ付き Gateway RPC（chat、sessions、config、health、voicewake、skills.bins）
- `event`: Node シグナル（音声 transcript、エージェント要求、チャット購読、exec ライフサイクル）

Gateway → クライアント:

- `invoke` / `invoke-res`: Node コマンド（`canvas.*`、`camera.*`、`screen.record`、
  `location.get`、`sms.send`）
- `event`: 購読済みセッション向けのチャット更新
- `ping` / `pong`: keepalive

レガシー Allowlist の強制は `src/gateway/server-bridge.ts` に存在していました（削除済み）。

## exec ライフサイクルイベント

Node は、`system.run` アクティビティを表面化するために `exec.finished` または `exec.denied` イベントを送出できました。
これらは Gateway 内でシステムイベントにマッピングされます。（レガシー Node は依然として `exec.started` を送出する場合があります。）

ペイロードフィールド（特記がない限りすべてオプション）:

- `sessionKey`（必須）: システムイベントを受け取るエージェントセッション。
- `runId`: グルーピング用の一意な exec ID。
- `command`: 生または整形済みのコマンド文字列。
- `exitCode`、`timedOut`、`success`、`output`: 完了詳細（finished のみ）。
- `reason`: 拒否理由（denied のみ）。

## 履歴上の tailnet 利用

- ブリッジを tailnet IP にバインド: `~/.openclaw/openclaw.json` で `bridge.bind: "tailnet"`（履歴専用。`bridge.*` は現在無効）。
- クライアントは MagicDNS 名または tailnet IP 経由で接続。
- Bonjour はネットワークをまたがらないため、必要に応じて手動の host/port または広域 DNS‑SD を使用します。

## バージョニング

ブリッジは **暗黙の v1** でした（min/max ネゴシエーションなし）。このセクションは
履歴的参照専用です。現在の Node/オペレータークライアントは WebSocket の
[Gateway Protocol](/ja-JP/gateway/protocol) を使用します。

## 関連

- [Gateway protocol](/ja-JP/gateway/protocol)
- [Nodes](/ja-JP/nodes)
