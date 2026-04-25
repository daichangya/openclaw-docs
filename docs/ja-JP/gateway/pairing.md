---
read_when:
    - macOS UI なしで Node ペアリング承認を実装すること
    - リモート Node を承認するための CLI フローを追加すること
    - Node 管理を使って Gateway プロトコルを拡張すること
summary: iOS およびその他のリモート Node 向けの Gateway 管理 Node ペアリング（Option B）
title: Gateway 管理ペアリング
x-i18n:
    generated_at: "2026-04-25T13:49:13Z"
    model: gpt-5.4
    provider: openai
    source_hash: 3b512fbf97e7557a1f467732f1b68d8c1b8183695e436b3f87b4c4aca1478cb5
    source_path: gateway/pairing.md
    workflow: 15
---

Gateway 管理ペアリングでは、どの Node の参加を許可するかについての信頼できる情報源は **Gateway** です。UI（macOS app、将来のクライアント）は、保留中リクエストを承認または拒否するためのフロントエンドにすぎません。

**重要:** WS Node は `connect` 時に **device pairing**（role `node`）を使用します。`node.pair.*` は別個のペアリングストアであり、WS ハンドシェイクを制御しません。このフローを使うのは、明示的に `node.pair.*` を呼び出すクライアントだけです。

## 概念

- **保留中リクエスト**: Node が参加を要求した状態。承認が必要です。
- **ペア済み Node**: 承認され、認証トークンが発行された Node。
- **トランスポート**: Gateway WS エンドポイントはリクエストを転送しますが、参加可否は決定しません。（旧来の TCP ブリッジサポートは削除されました。）

## ペアリングの仕組み

1. Node が Gateway WS に接続してペアリングを要求します。
2. Gateway は **保留中リクエスト** を保存し、`node.pair.requested` を発行します。
3. リクエストを承認または拒否します（CLI または UI）。
4. 承認時、Gateway は **新しいトークン** を発行します（再ペアリング時にはトークンがローテーションされます）。
5. Node はそのトークンを使って再接続し、「ペア済み」になります。

保留中リクエストは **5 分** で自動的に期限切れになります。

## CLI ワークフロー（ヘッドレス対応）

```bash
openclaw nodes pending
openclaw nodes approve <requestId>
openclaw nodes reject <requestId>
openclaw nodes status
openclaw nodes rename --node <id|name|ip> --name "Living Room iPad"
```

`nodes status` は、ペア済み/接続中の Node とその capabilities を表示します。

## API サーフェス（Gateway プロトコル）

イベント:

- `node.pair.requested` — 新しい保留中リクエストが作成されたときに発行されます。
- `node.pair.resolved` — リクエストが承認/拒否/期限切れになったときに発行されます。

メソッド:

- `node.pair.request` — 保留中リクエストを作成または再利用する。
- `node.pair.list` — 保留中 + ペア済み Node を一覧表示する（`operator.pairing`）。
- `node.pair.approve` — 保留中リクエストを承認する（トークンを発行）。
- `node.pair.reject` — 保留中リクエストを拒否する。
- `node.pair.verify` — `{ nodeId, token }` を検証する。

注記:

- `node.pair.request` は Node ごとに冪等です。繰り返し呼び出すと同じ保留中リクエストが返されます。
- 同じ保留中 Node に対する繰り返しリクエストでは、保存済み Node メタデータと、operator 可視性のための最新の許可済み declared command スナップショットも更新されます。
- 承認では **常に** 新しいトークンが生成されます。`node.pair.request` からトークンが返されることはありません。
- リクエストには、自動承認フローへのヒントとして `silent: true` を含めることができます。
- `node.pair.approve` は、保留中リクエストの declared commands を使って追加の承認スコープを強制します:
  - command なしのリクエスト: `operator.pairing`
  - 非 exec コマンドのリクエスト: `operator.pairing` + `operator.write`
  - `system.run` / `system.run.prepare` / `system.which` のリクエスト:
    `operator.pairing` + `operator.admin`

重要:

- Node ペアリングは、信頼/ID フローに加えてトークン発行を行うものです。
- これは、Node ごとの live command surface を固定するものではありません。
- live node commands は、Node が接続時に宣言した内容から来ます。その後、gateway のグローバルな node command policy（`gateway.nodes.allowCommands` /
  `denyCommands`）が適用されます。
- Node ごとの `system.run` の allow/ask policy は、ペアリングレコードではなく Node 側の
  `exec.approvals.node.*` に存在します。

## Node コマンドゲーティング（2026.3.31+）

<Warning>
**破壊的変更:** `2026.3.31` 以降、Node コマンドは Node ペアリングが承認されるまで無効です。device pairing だけでは、宣言された Node コマンドは公開されなくなります。
</Warning>

Node が初めて接続すると、ペアリングは自動的に要求されます。ペアリングリクエストが承認されるまで、その Node からの保留中 Node コマンドはすべてフィルタリングされ、実行されません。ペアリング承認によって信頼が確立されると、Node が宣言したコマンドは通常のコマンドポリシーに従って利用可能になります。

これは次を意味します。

- 以前は device pairing だけでコマンド公開を行っていた Node も、今後は Node ペアリングを完了しなければなりません。
- ペアリング承認前にキューされたコマンドは延期されず、破棄されます。

## Node イベントの信頼境界（2026.3.31+）

<Warning>
**破壊的変更:** Node 起点の run は、より限定された信頼サーフェスに留まるようになりました。
</Warning>

Node 起点の要約および関連セッションイベントは、意図された信頼サーフェスに制限されます。以前はより広い host または session の tool アクセスに依存していた通知駆動または Node トリガーのフローは、調整が必要になる場合があります。この強化により、Node イベントが、その Node の信頼境界を超えて host レベルの tool アクセスへ昇格することを防ぎます。

## 自動承認（macOS app）

macOS app は、次の場合に任意で **サイレント承認** を試行できます。

- リクエストが `silent` としてマークされており、かつ
- app が同じユーザーで gateway host への SSH 接続を検証できる場合。

サイレント承認に失敗した場合は、通常の「Approve/Reject」プロンプトにフォールバックします。

## Trusted-CIDR device 自動承認

`role: node` 用の WS device pairing は、デフォルトでは引き続き手動です。Gateway がすでにネットワーク経路を信頼しているプライベート
Node ネットワークでは、運用者は明示的な CIDR または完全一致 IP でオプトインできます。

```json5
{
  gateway: {
    nodes: {
      pairing: {
        autoApproveCidrs: ["192.168.1.0/24"],
      },
    },
  },
}
```

セキュリティ境界:

- `gateway.nodes.pairing.autoApproveCidrs` が未設定の場合は無効です。
- 包括的な LAN またはプライベートネットワーク自動承認モードは存在しません。
- 対象となるのは、要求スコープを持たない新規の `role: node` device pairing のみです。
- operator、browser、Control UI、WebChat クライアントは引き続き手動です。
- role、scope、metadata、public-key のアップグレードは引き続き手動です。
- 同一 host の loopback trusted-proxy header 経路は、ローカル呼び出し元が偽装できるため対象外です。

## Metadata-upgrade 自動承認

すでにペア済みの device が、非機微な metadata
変更だけで再接続した場合（たとえば表示名やクライアントプラットフォームのヒント）、OpenClaw はそれを `metadata-upgrade` として扱います。サイレント自動承認は狭い範囲に限定されています。対象は、loopback 経由で共有 token または password の保持をすでに証明した、信頼できるローカル CLI/ヘルパー再接続のみです。browser/Control UI クライアントやリモートクライアントは、引き続き明示的な再承認フローを使用します。スコープのアップグレード（read から
write/admin）および public key の変更は、**metadata-upgrade 自動承認の対象外** です。これらは引き続き明示的な再承認リクエストになります。

## QR ペアリングヘルパー

`/pair qr` はペアリングペイロードを構造化メディアとしてレンダリングするため、モバイルおよび
browser クライアントが直接スキャンできます。

device を削除すると、その device id に対する古い保留中ペアリングリクエストも一掃されるため、`nodes pending` に revoke 後の孤立行は表示されません。

## ローカリティと転送ヘッダー

Gateway ペアリングは、生ソケットと上流 proxy の証拠の両方が一致する場合にのみ、接続を loopback として扱います。リクエストが loopback で到着しても、
`X-Forwarded-For` / `X-Forwarded-Host` / `X-Forwarded-Proto` ヘッダーによって非ローカルの origin が示されている場合、その転送ヘッダー証拠によって
loopback ローカリティの主張は無効になります。その場合、ペアリング経路は明示的承認を必要とし、同一 host 接続としてサイレントに扱われることはありません。同等ルールについては、
operator auth 側の [Trusted Proxy Auth](/ja-JP/gateway/trusted-proxy-auth) を参照してください。

## ストレージ（ローカル、非公開）

ペアリング状態は Gateway state ディレクトリ配下に保存されます（デフォルト `~/.openclaw`）。

- `~/.openclaw/nodes/paired.json`
- `~/.openclaw/nodes/pending.json`

`OPENCLAW_STATE_DIR` を上書きしている場合、`nodes/` フォルダーも一緒に移動します。

セキュリティ上の注意:

- トークンは秘密情報です。`paired.json` は機微情報として扱ってください。
- トークンをローテーションするには再承認（または Node エントリ削除）が必要です。

## トランスポート動作

- トランスポートは **ステートレス** です。参加情報は保存しません。
- Gateway がオフライン、またはペアリングが無効な場合、Node はペアリングできません。
- Gateway がリモートモードでも、ペアリングは引き続きそのリモート Gateway のストアに対して行われます。

## 関連

- [チャンネルペアリング](/ja-JP/channels/pairing)
- [Nodes](/ja-JP/nodes)
- [Devices CLI](/ja-JP/cli/devices)
