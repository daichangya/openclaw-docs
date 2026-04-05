---
read_when:
    - プロトコルスキーマまたはコード生成を更新している場合
summary: Gatewayプロトコルの単一の信頼できる情報源としてのTypeBoxスキーマ
title: TypeBox
x-i18n:
    generated_at: "2026-04-05T12:42:57Z"
    model: gpt-5.4
    provider: openai
    source_hash: 6f508523998f94d12fbd6ce98d8a7d49fa641913196a4ab7b01f91f83c01c7eb
    source_path: concepts/typebox.md
    workflow: 15
---

# プロトコルの単一の信頼できる情報源としてのTypeBox

最終更新: 2026-01-10

TypeBoxはTypeScriptファーストのスキーマライブラリです。私たちはこれを使って、**Gateway
WebSocketプロトコル**（ハンドシェイク、リクエスト/レスポンス、サーバーイベント）を定義しています。これらのスキーマは、
**ランタイム検証**、**JSON Schemaエクスポート**、およびmacOS app向けの**Swiftコード生成**を駆動します。
単一の信頼できる情報源があり、その他はすべて生成されます。

より高レベルなプロトコルの文脈を知りたい場合は、まず
[Gateway architecture](/concepts/architecture) から始めてください。

## メンタルモデル（30秒）

すべてのGateway WSメッセージは、次の3種類のフレームのいずれかです。

- **Request**: `{ type: "req", id, method, params }`
- **Response**: `{ type: "res", id, ok, payload | error }`
- **Event**: `{ type: "event", event, payload, seq?, stateVersion? }`

最初のフレームは**必ず** `connect` リクエストでなければなりません。その後、クライアントは
メソッド（例: `health`, `send`, `chat.send`）を呼び出し、イベント（例:
`presence`, `tick`, `agent`）を購読できます。

接続フロー（最小）:

```
Client                    Gateway
  |---- req:connect -------->|
  |<---- res:hello-ok --------|
  |<---- event:tick ----------|
  |---- req:health ---------->|
  |<---- res:health ----------|
```

一般的なメソッド + イベント:

| Category   | Examples                                                   | Notes                              |
| ---------- | ---------------------------------------------------------- | ---------------------------------- |
| Core       | `connect`, `health`, `status`                              | `connect` must be first            |
| Messaging  | `send`, `agent`, `agent.wait`, `system-event`, `logs.tail` | side-effects need `idempotencyKey` |
| Chat       | `chat.history`, `chat.send`, `chat.abort`                  | WebChat uses these                 |
| Sessions   | `sessions.list`, `sessions.patch`, `sessions.delete`       | session admin                      |
| Automation | `wake`, `cron.list`, `cron.run`, `cron.runs`               | wake + cron control                |
| Nodes      | `node.list`, `node.invoke`, `node.pair.*`                  | Gateway WS + node actions          |
| Events     | `tick`, `presence`, `agent`, `chat`, `health`, `shutdown`  | server push                        |

権威ある公開用の**discovery**インベントリは、
`src/gateway/server-methods-list.ts`（`listGatewayMethods`, `GATEWAY_EVENTS`）にあります。

## スキーマの配置場所

- ソース: `src/gateway/protocol/schema.ts`
- ランタイムバリデーター（AJV）: `src/gateway/protocol/index.ts`
- 公開される機能/discoveryレジストリ: `src/gateway/server-methods-list.ts`
- サーバーハンドシェイク + メソッドディスパッチ: `src/gateway/server.impl.ts`
- ノードクライアント: `src/gateway/client.ts`
- 生成されるJSON Schema: `dist/protocol.schema.json`
- 生成されるSwiftモデル: `apps/macos/Sources/OpenClawProtocol/GatewayModels.swift`

## 現在のパイプライン

- `pnpm protocol:gen`
  - JSON Schema（draft‑07）を `dist/protocol.schema.json` に書き出します
- `pnpm protocol:gen:swift`
  - SwiftのGatewayモデルを生成します
- `pnpm protocol:check`
  - 両方のジェネレーターを実行し、出力がコミット済みであることを検証します

## スキーマがランタイムでどう使われるか

- **サーバー側**: すべての受信フレームはAJVで検証されます。ハンドシェイクは
  paramsが `ConnectParams` に一致する `connect` リクエストだけを受け付けます。
- **クライアント側**: JSクライアントは、イベントフレームとレスポンスフレームを
  使用前に検証します。
- **機能discovery**: Gatewayは、保守的な `features.methods`
  と `features.events` の一覧を `hello-ok` 内で `listGatewayMethods()` と
  `GATEWAY_EVENTS` から送信します。
- このdiscovery一覧は、
  `coreGatewayHandlers` 内の呼び出し可能なすべてのヘルパーを生成したダンプではありません。一部のヘルパーRPCは
  `src/gateway/server-methods/*.ts` に実装されていますが、公開される
  feature一覧には列挙されていません。

## フレーム例

Connect（最初のメッセージ）:

```json
{
  "type": "req",
  "id": "c1",
  "method": "connect",
  "params": {
    "minProtocol": 3,
    "maxProtocol": 3,
    "client": {
      "id": "openclaw-macos",
      "displayName": "macos",
      "version": "1.0.0",
      "platform": "macos 15.1",
      "mode": "ui",
      "instanceId": "A1B2"
    }
  }
}
```

Hello-okレスポンス:

```json
{
  "type": "res",
  "id": "c1",
  "ok": true,
  "payload": {
    "type": "hello-ok",
    "protocol": 3,
    "server": { "version": "dev", "connId": "ws-1" },
    "features": { "methods": ["health"], "events": ["tick"] },
    "snapshot": {
      "presence": [],
      "health": {},
      "stateVersion": { "presence": 0, "health": 0 },
      "uptimeMs": 0
    },
    "policy": { "maxPayload": 1048576, "maxBufferedBytes": 1048576, "tickIntervalMs": 30000 }
  }
}
```

Request + Response:

```json
{ "type": "req", "id": "r1", "method": "health" }
```

```json
{ "type": "res", "id": "r1", "ok": true, "payload": { "ok": true } }
```

Event:

```json
{ "type": "event", "event": "tick", "payload": { "ts": 1730000000 }, "seq": 12 }
```

## 最小クライアント（Node.js）

最小限で有用なフローは、connect + healthです。

```ts
import { WebSocket } from "ws";

const ws = new WebSocket("ws://127.0.0.1:18789");

ws.on("open", () => {
  ws.send(
    JSON.stringify({
      type: "req",
      id: "c1",
      method: "connect",
      params: {
        minProtocol: 3,
        maxProtocol: 3,
        client: {
          id: "cli",
          displayName: "example",
          version: "dev",
          platform: "node",
          mode: "cli",
        },
      },
    }),
  );
});

ws.on("message", (data) => {
  const msg = JSON.parse(String(data));
  if (msg.type === "res" && msg.id === "c1" && msg.ok) {
    ws.send(JSON.stringify({ type: "req", id: "h1", method: "health" }));
  }
  if (msg.type === "res" && msg.id === "h1") {
    console.log("health:", msg.payload);
    ws.close();
  }
});
```

## 実例: メソッドをエンドツーエンドで追加する

例: `{ ok: true, text }` を返す新しい `system.echo` リクエストを追加します。

1. **スキーマ（単一の信頼できる情報源）**

`src/gateway/protocol/schema.ts` に追加します:

```ts
export const SystemEchoParamsSchema = Type.Object(
  { text: NonEmptyString },
  { additionalProperties: false },
);

export const SystemEchoResultSchema = Type.Object(
  { ok: Type.Boolean(), text: NonEmptyString },
  { additionalProperties: false },
);
```

これら両方を `ProtocolSchemas` に追加し、型をエクスポートします:

```ts
  SystemEchoParams: SystemEchoParamsSchema,
  SystemEchoResult: SystemEchoResultSchema,
```

```ts
export type SystemEchoParams = Static<typeof SystemEchoParamsSchema>;
export type SystemEchoResult = Static<typeof SystemEchoResultSchema>;
```

2. **検証**

`src/gateway/protocol/index.ts` で、AJVバリデーターをエクスポートします:

```ts
export const validateSystemEchoParams = ajv.compile<SystemEchoParams>(SystemEchoParamsSchema);
```

3. **サーバー動作**

`src/gateway/server-methods/system.ts` にハンドラーを追加します:

```ts
export const systemHandlers: GatewayRequestHandlers = {
  "system.echo": ({ params, respond }) => {
    const text = String(params.text ?? "");
    respond(true, { ok: true, text });
  },
};
```

これを `src/gateway/server-methods.ts` に登録し（ここではすでに `systemHandlers` がマージされています）、
その後 `"system.echo"` を
`src/gateway/server-methods-list.ts` の `listGatewayMethods` 入力に追加します。

このメソッドがoperatorまたはnodeクライアントから呼び出し可能である場合は、
スコープ強制と `hello-ok` のfeature公開が一致したままになるように、
`src/gateway/method-scopes.ts` でも分類してください。

4. **再生成**

```bash
pnpm protocol:check
```

5. **テスト + ドキュメント**

`src/gateway/server.*.test.ts` にサーバーテストを追加し、ドキュメントにそのメソッドを記載します。

## Swiftコード生成の動作

Swiftジェネレーターは次を出力します。

- `req`, `res`, `event`, `unknown` ケースを持つ `GatewayFrame` enum
- 強く型付けされたpayload struct/enum
- `ErrorCode` 値と `GATEWAY_PROTOCOL_VERSION`

未知のフレーム型は、前方互換性のために生のpayloadとして保持されます。

## バージョニング + 互換性

- `PROTOCOL_VERSION` は `src/gateway/protocol/schema.ts` にあります。
- クライアントは `minProtocol` + `maxProtocol` を送信し、サーバーは不一致を拒否します。
- Swiftモデルは、古いクライアントを壊さないように未知のフレーム型を保持します。

## スキーマパターンと規約

- ほとんどのオブジェクトでは、厳密なpayloadにするため `additionalProperties: false` を使います。
- `NonEmptyString` は、IDおよびメソッド/イベント名のデフォルトです。
- トップレベルの `GatewayFrame` は、`type` 上の**discriminator**を使用します。
- 副作用を持つメソッドでは、通常params内に `idempotencyKey` が必要です
  （例: `send`, `poll`, `agent`, `chat.send`）。
- `agent` は、ランタイム生成のオーケストレーションコンテキスト向けに
  任意の `internalEvents` を受け付けます
  （例: subagent/cronタスク完了の引き継ぎ）。これは内部APIサーフェスとして扱ってください。

## ライブスキーマJSON

生成されたJSON Schemaは、repo内の `dist/protocol.schema.json` にあります。
公開される生ファイルは通常、次の場所で利用できます:

- [https://raw.githubusercontent.com/openclaw/openclaw/main/dist/protocol.schema.json](https://raw.githubusercontent.com/openclaw/openclaw/main/dist/protocol.schema.json)

## スキーマを変更するとき

1. TypeBoxスキーマを更新します。
2. メソッド/イベントを `src/gateway/server-methods-list.ts` に登録します。
3. 新しいRPCにoperatorまたは
   nodeスコープ分類が必要な場合は `src/gateway/method-scopes.ts` を更新します。
4. `pnpm protocol:check` を実行します。
5. 再生成されたschema + Swiftモデルをコミットします。
