---
read_when:
    - macOS UIなしでNodeペアリング承認を実装すること
    - remote Nodeを承認するためのCLIフローを追加すること
    - Node管理によってGateway protocolを拡張すること
summary: iOSおよびその他のremote Node向けのGateway管理Nodeペアリング（Option B）
title: Gateway管理ペアリング
x-i18n:
    generated_at: "2026-04-26T11:30:38Z"
    model: gpt-5.4
    provider: openai
    source_hash: 436391f7576b7285733eb4a8283b73d7b4c52f22b227dd915c09313cfec776bd
    source_path: gateway/pairing.md
    workflow: 15
---

Gateway管理ペアリングでは、どのNodeの参加を許可するかのソースオブトゥルースは**Gateway**です。UI（macOS app、将来のclient）は、保留中のrequestを承認または拒否するフロントエンドにすぎません。

**重要:** WS Nodeは、`connect` 中に**device pairing**（role `node`）を使用します。`node.pair.*` は別のpairing storeであり、WS handshakeを制御しません。このフローを使うのは、明示的に `node.pair.*` を呼び出すclientだけです。

## 概念

- **Pending request**: 参加を要求したNode。承認が必要です。
- **Paired node**: 承認され、auth tokenが発行されたNode。
- **Transport**: Gateway WS endpointはrequestを転送しますが、membershipは決定しません。（旧TCP bridgeサポートは削除されました。）

## ペアリングの仕組み

1. NodeがGateway WSに接続し、pairingを要求します。
2. Gatewayは **pending request** を保存し、`node.pair.requested` を発行します。
3. requestを承認または拒否します（CLIまたはUI）。
4. 承認時に、Gatewayは**新しいtoken**を発行します（再pair時にはtokenがローテーションされます）。
5. Nodeはそのtokenを使って再接続し、「paired」状態になります。

pending requestは**5分**後に自動で期限切れになります。

## CLIワークフロー（ヘッドレス対応）

```bash
openclaw nodes pending
openclaw nodes approve <requestId>
openclaw nodes reject <requestId>
openclaw nodes status
openclaw nodes rename --node <id|name|ip> --name "Living Room iPad"
```

`nodes status` はpaired / connected Nodeと、そのcapabilityを表示します。

## API surface（Gateway protocol）

イベント:

- `node.pair.requested` — 新しいpending requestが作成されたときに発行されます。
- `node.pair.resolved` — requestが承認 / 拒否 / 期限切れになったときに発行されます。

メソッド:

- `node.pair.request` — pending requestを作成または再利用します。
- `node.pair.list` — pending + paired Nodeを一覧表示します（`operator.pairing`）。
- `node.pair.approve` — pending requestを承認します（tokenを発行）。
- `node.pair.reject` — pending requestを拒否します。
- `node.pair.verify` — `{ nodeId, token }` を検証します。

注記:

- `node.pair.request` はNodeごとにidempotentです。繰り返し呼び出しても同じpending requestが返ります。
- 同じpending Nodeへの繰り返しrequestでは、operator可視化のために、保存済みNode metadataと最新のallowlist済み宣言command snapshotも更新されます。
- 承認では**常に**新しいtokenが生成されます。`node.pair.request` からtokenが返されることはありません。
- requestには、自動承認フロー向けのhintとして `silent: true` を含めることができます。
- `node.pair.approve` は、追加の承認scopeを強制するためにpending requestの宣言commandを使います。
  - commandなしrequest: `operator.pairing`
  - 非exec command request: `operator.pairing` + `operator.write`
  - `system.run` / `system.run.prepare` / `system.which` request:
    `operator.pairing` + `operator.admin`

重要:

- Node pairingは、trust / identityフローとtoken発行です。
- これは、Nodeごとのlive command surfaceをpinするものでは**ありません**。
- live Node commandは、Nodeが接続時に宣言したものから取得され、その後、GatewayのグローバルNode command policy（`gateway.nodes.allowCommands` / `denyCommands`）が適用されます。
- Nodeごとの `system.run` allow / ask policyは、pairing recordではなく、Node上の `exec.approvals.node.*` にあります。

## Node command gating（2026.3.31+）

<Warning>
**破壊的変更:** `2026.3.31` 以降、Node commandはNode pairingが承認されるまで無効です。device pairingだけでは、宣言されたNode commandを公開するのに十分ではなくなりました。
</Warning>

Nodeが初めて接続すると、pairingは自動的に要求されます。pairing requestが承認されるまで、そのNodeからの保留中Node commandはすべてfilterされ、実行されません。pairing承認によってtrustが確立されると、そのNodeが宣言したcommandは通常のcommand policyに従って利用可能になります。

これは次を意味します。

- 以前、device pairingだけに依存してcommandを公開していたNodeは、今後はNode pairingを完了する必要があります。
- pairing承認前にキューされたcommandは保留されず、破棄されます。

## Node event trust boundary（2026.3.31+）

<Warning>
**破壊的変更:** Node起点のrunは、より制限されたtrusted surface内に留まるようになりました。
</Warning>

Node起点のsummaryおよび関連session eventは、意図されたtrusted surfaceに制限されます。以前はより広いhostまたはsession tool accessに依存していた通知駆動またはNodeトリガーのフローでは、調整が必要になる場合があります。このhardeningにより、Node eventが、Nodeのtrust boundaryを超えてhostレベルtool accessへ昇格できないようになります。

## 自動承認（macOS app）

macOS appは、次の条件を満たす場合に、任意で**silent approval**を試行できます。

- requestに `silent` が付いている
- appが同じユーザーでGateway hostへのSSH接続を検証できる

silent approvalに失敗した場合は、通常の「Approve / Reject」promptにフォールバックします。

## Trusted-CIDR device自動承認

`role: node` に対するWS device pairingは、引き続きデフォルトでは手動です。Gatewayがすでにnetwork pathを信頼しているprivate Node networkでは、operatorは明示的なCIDRまたは正確なIPでopt-inできます。

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
- LAN全体またはprivate network全体を対象にした包括的な自動承認モードは存在しません。
- 対象になるのは、要求scopeのない新規の `role: node` device pairingだけです。
- operator、browser、Control UI、WebChat clientは引き続き手動です。
- role、scope、metadata、public keyのupgradeは引き続き手動です。
- 同一host loopback trusted-proxy header経路は対象外です。この経路はローカルcallerにより偽装できるためです。

## Metadata-upgrade自動承認

すでにpaired済みのdeviceが、非機密metadataのみの変更（たとえばdisplay nameやclient platform hint）で再接続した場合、OpenClawはそれを `metadata-upgrade` として扱います。silent auto-approvalは限定的で、localまたはshared credentialの所持をすでに証明している、信頼された非browserローカル再接続にのみ適用されます。これには、OS version metadata変更後の同一host native app再接続も含まれます。browser / Control UI clientおよびremote clientは、引き続き明示的な再承認フローを使用します。scope upgrade（readからwrite / admin）およびpublic key変更は **metadata-upgrade自動承認の対象外** であり、引き続き明示的な再承認requestになります。

## QRペアリングヘルパー

`/pair qr` はpairing payloadを構造化mediaとして描画するため、mobile clientやbrowser clientが直接それをscanできます。

deviceを削除すると、そのdevice idに対する古いpending pairing requestも一掃されるため、revoke後に `nodes pending` に孤立した行が表示されません。

## ローカリティとforwarded header

Gateway pairingは、生socketとupstream proxyの証拠の両方が一致した場合にのみ、接続をloopbackとみなします。requestがloopback上に到着しても、`X-Forwarded-For` / `X-Forwarded-Host` / `X-Forwarded-Proto` headerが非ローカルoriginを指している場合、そのforwarded-headerの証拠によってloopbackローカリティ主張は無効になります。その場合、pairing経路では同一host接続として暗黙的に扱わず、明示的承認が必要になります。operator authにおける同等ルールについては、[Trusted Proxy Auth](/ja-JP/gateway/trusted-proxy-auth)を参照してください。

## ストレージ（ローカル、private）

pairing stateはGateway state directory配下に保存されます（デフォルトは `~/.openclaw`）。

- `~/.openclaw/nodes/paired.json`
- `~/.openclaw/nodes/pending.json`

`OPENCLAW_STATE_DIR` を上書きした場合、`nodes/` folderも一緒に移動します。

セキュリティ注記:

- tokenは秘密情報です。`paired.json` は機密ファイルとして扱ってください。
- tokenをローテーションするには再承認が必要です（またはNode entryの削除）。

## Transport動作

- transportは**stateless**です。membershipは保存しません。
- Gatewayがoffline、またはpairingが無効な場合、Nodeはpairできません。
- Gatewayがremote modeでも、pairingは引き続きremote Gatewayのstoreに対して行われます。

## 関連

- [Channel pairing](/ja-JP/channels/pairing)
- [Nodes](/ja-JP/nodes)
- [Devices CLI](/ja-JP/cli/devices)
