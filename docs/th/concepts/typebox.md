---
read_when:
    - กำลังอัปเดตสคีมาของโปรโตคอลหรือ codegen
summary: TypeBox schemas เป็นแหล่งข้อมูลจริงเพียงหนึ่งเดียวสำหรับโปรโตคอล Gateway
title: TypeBox
x-i18n:
    generated_at: "2026-04-23T05:32:12Z"
    model: gpt-5.4
    provider: openai
    source_hash: 6f508523998f94d12fbd6ce98d8a7d49fa641913196a4ab7b01f91f83c01c7eb
    source_path: concepts/typebox.md
    workflow: 15
---

# TypeBox เป็นแหล่งข้อมูลจริงของโปรโตคอล

อัปเดตล่าสุด: 2026-01-10

TypeBox เป็นไลบรารีสคีมาแบบ TypeScript-first เราใช้มันเพื่อกำหนด **โปรโตคอล WebSocket ของ Gateway** (handshake, request/response, server events) สคีมาเหล่านี้ขับเคลื่อนทั้ง **runtime validation**, **การส่งออก JSON Schema** และ **Swift codegen** สำหรับแอป macOS มีแหล่งข้อมูลจริงเพียงหนึ่งเดียว; ส่วนอื่นทั้งหมดถูกสร้างขึ้นจากมัน

หากคุณต้องการบริบทของโปรโตคอลในระดับที่สูงกว่า ให้เริ่มจาก
[สถาปัตยกรรม Gateway](/th/concepts/architecture)

## โมเดลความเข้าใจ (30 วินาที)

ทุกข้อความ WS ของ Gateway จะเป็นหนึ่งในสามเฟรมต่อไปนี้:

- **Request**: `{ type: "req", id, method, params }`
- **Response**: `{ type: "res", id, ok, payload | error }`
- **Event**: `{ type: "event", event, payload, seq?, stateVersion? }`

เฟรมแรก **ต้อง** เป็น request แบบ `connect` หลังจากนั้น client จึงจะสามารถเรียก
methods (เช่น `health`, `send`, `chat.send`) และ subscribe กับ events (เช่น
`presence`, `tick`, `agent`) ได้

ลำดับการเชื่อมต่อ (แบบขั้นต่ำ):

```
Client                    Gateway
  |---- req:connect -------->|
  |<---- res:hello-ok --------|
  |<---- event:tick ----------|
  |---- req:health ---------->|
  |<---- res:health ----------|
```

methods + events ที่พบบ่อย:

| หมวดหมู่   | ตัวอย่าง                                                   | หมายเหตุ                              |
| ---------- | ---------------------------------------------------------- | ---------------------------------- |
| Core       | `connect`, `health`, `status`                              | `connect` ต้องมาก่อนเป็นอันดับแรก            |
| Messaging  | `send`, `agent`, `agent.wait`, `system-event`, `logs.tail` | side-effects ต้องใช้ `idempotencyKey` |
| Chat       | `chat.history`, `chat.send`, `chat.abort`                  | WebChat ใช้สิ่งเหล่านี้                 |
| Sessions   | `sessions.list`, `sessions.patch`, `sessions.delete`       | การดูแลจัดการ session                      |
| Automation | `wake`, `cron.list`, `cron.run`, `cron.runs`               | การควบคุม wake + Cron                |
| Nodes      | `node.list`, `node.invoke`, `node.pair.*`                  | Gateway WS + การดำเนินการของ node          |
| Events     | `tick`, `presence`, `agent`, `chat`, `health`, `shutdown`  | server push                        |

inventory ของ **discovery** ที่ประกาศอย่างเป็นทางการอยู่ใน
`src/gateway/server-methods-list.ts` (`listGatewayMethods`, `GATEWAY_EVENTS`)

## ตำแหน่งของสคีมา

- แหล่งข้อมูล: `src/gateway/protocol/schema.ts`
- Runtime validators (AJV): `src/gateway/protocol/index.ts`
- รีจิสทรีฟีเจอร์/การค้นพบที่ประกาศ: `src/gateway/server-methods-list.ts`
- Server handshake + method dispatch: `src/gateway/server.impl.ts`
- Node client: `src/gateway/client.ts`
- JSON Schema ที่สร้างแล้ว: `dist/protocol.schema.json`
- Swift models ที่สร้างแล้ว: `apps/macos/Sources/OpenClawProtocol/GatewayModels.swift`

## ไปป์ไลน์ปัจจุบัน

- `pnpm protocol:gen`
  - เขียน JSON Schema (draft‑07) ไปยัง `dist/protocol.schema.json`
- `pnpm protocol:gen:swift`
  - สร้าง Swift gateway models
- `pnpm protocol:check`
  - รัน generator ทั้งสองตัวและตรวจสอบว่าเอาต์พุตถูก commit แล้ว

## สคีมาถูกใช้อย่างไรขณะรัน

- **ฝั่ง Server**: ทุกเฟรมขาเข้าจะถูกตรวจสอบด้วย AJV handshake จะยอมรับเฉพาะ
  request แบบ `connect` ที่มี params ตรงกับ `ConnectParams`
- **ฝั่ง Client**: JS client จะตรวจสอบ event และ response frames ก่อนนำไปใช้
- **Feature discovery**: Gateway จะส่งรายการ `features.methods`
  และ `features.events` แบบ conservative ใน `hello-ok` จาก `listGatewayMethods()` และ
  `GATEWAY_EVENTS`
- รายการ discovery นี้ไม่ใช่ dump ที่สร้างขึ้นอัตโนมัติจาก helper ที่เรียกได้ทุกตัวใน
  `coreGatewayHandlers`; helper RPC บางตัวถูก implement ไว้ใน
  `src/gateway/server-methods/*.ts` โดยไม่ได้ถูกแจกแจงไว้ในรายการฟีเจอร์ที่ประกาศ

## ตัวอย่างเฟรม

Connect (ข้อความแรก):

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

การตอบกลับ Hello-ok:

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

Request + response:

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

## client แบบขั้นต่ำ (Node.js)

ลำดับที่เล็กที่สุดแต่ใช้งานได้จริง: connect + health

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

## ตัวอย่างแบบครบลำดับ: เพิ่ม method แบบ end-to-end

ตัวอย่าง: เพิ่ม request ใหม่ `system.echo` ที่คืนค่า `{ ok: true, text }`

1. **สคีมา (แหล่งข้อมูลจริง)**

เพิ่มใน `src/gateway/protocol/schema.ts`:

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

เพิ่มทั้งสองตัวลงใน `ProtocolSchemas` และ export types:

```ts
  SystemEchoParams: SystemEchoParamsSchema,
  SystemEchoResult: SystemEchoResultSchema,
```

```ts
export type SystemEchoParams = Static<typeof SystemEchoParamsSchema>;
export type SystemEchoResult = Static<typeof SystemEchoResultSchema>;
```

2. **Validation**

ใน `src/gateway/protocol/index.ts` ให้ export AJV validator:

```ts
export const validateSystemEchoParams = ajv.compile<SystemEchoParams>(SystemEchoParamsSchema);
```

3. **พฤติกรรมฝั่ง Server**

เพิ่ม handler ใน `src/gateway/server-methods/system.ts`:

```ts
export const systemHandlers: GatewayRequestHandlers = {
  "system.echo": ({ params, respond }) => {
    const text = String(params.text ?? "");
    respond(true, { ok: true, text });
  },
};
```

ลงทะเบียนมันใน `src/gateway/server-methods.ts` (ซึ่ง merge `systemHandlers` อยู่แล้ว)
จากนั้นเพิ่ม `"system.echo"` ลงในอินพุตของ `listGatewayMethods` ใน
`src/gateway/server-methods-list.ts`

หาก method นี้เรียกได้โดย operator หรือ node clients ให้จัดหมวดมันด้วยใน
`src/gateway/method-scopes.ts` ด้วย เพื่อให้ scope enforcement และการประกาศฟีเจอร์ใน `hello-ok` ยังสอดคล้องกัน

4. **สร้างใหม่**

```bash
pnpm protocol:check
```

5. **Tests + เอกสาร**

เพิ่ม server test ใน `src/gateway/server.*.test.ts` และระบุ method นี้ในเอกสาร

## พฤติกรรมของ Swift codegen

Swift generator จะสร้าง:

- enum `GatewayFrame` ที่มีเคส `req`, `res`, `event` และ `unknown`
- payload structs/enums ที่มีชนิดชัดเจน
- ค่า `ErrorCode` และ `GATEWAY_PROTOCOL_VERSION`

ประเภทเฟรมที่ไม่รู้จักจะถูกเก็บไว้เป็น raw payload เพื่อรองรับ forward compatibility

## การทำเวอร์ชัน + ความเข้ากันได้

- `PROTOCOL_VERSION` อยู่ใน `src/gateway/protocol/schema.ts`
- client จะส่ง `minProtocol` + `maxProtocol`; server จะปฏิเสธหากไม่ตรงกัน
- Swift models จะเก็บประเภทเฟรมที่ไม่รู้จักไว้เพื่อหลีกเลี่ยงการทำให้ client รุ่นเก่าใช้งานไม่ได้

## รูปแบบและธรรมเนียมของสคีมา

- ออบเจ็กต์ส่วนใหญ่ใช้ `additionalProperties: false` เพื่อให้ payload เข้มงวด
- `NonEmptyString` เป็นค่าเริ่มต้นสำหรับ IDs และชื่อ method/event
- `GatewayFrame` ระดับบนสุดใช้ **discriminator** บน `type`
- methods ที่มี side effects มักต้องใช้ `idempotencyKey` ใน params
  (ตัวอย่าง: `send`, `poll`, `agent`, `chat.send`)
- `agent` ยอมรับ `internalEvents` แบบไม่บังคับสำหรับบริบท orchestration ที่สร้างขึ้นตอน runtime
  (เช่น การส่งต่องานเมื่อ subagent/Cron task เสร็จสิ้น); ให้ถือว่านี่เป็นพื้นผิว API ภายใน

## JSON ของสคีมาแบบสด

JSON Schema ที่สร้างแล้วอยู่ใน repo ที่ `dist/protocol.schema.json` โดยปกติไฟล์ raw
ที่เผยแพร่จะอยู่ที่:

- [https://raw.githubusercontent.com/openclaw/openclaw/main/dist/protocol.schema.json](https://raw.githubusercontent.com/openclaw/openclaw/main/dist/protocol.schema.json)

## เมื่อคุณเปลี่ยนสคีมา

1. อัปเดตสคีมา TypeBox
2. ลงทะเบียน method/event ใน `src/gateway/server-methods-list.ts`
3. อัปเดต `src/gateway/method-scopes.ts` เมื่อ RPC ใหม่ต้องมีการจัดหมวด scope สำหรับ operator หรือ node
4. รัน `pnpm protocol:check`
5. commit สคีมาที่สร้างใหม่ + Swift models
