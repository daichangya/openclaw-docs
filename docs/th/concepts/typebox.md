---
read_when:
    - การอัปเดตสคีมาโปรโตคอลหรือ codegen
summary: สคีมาของ TypeBox เป็นแหล่งข้อมูลจริงเพียงหนึ่งเดียวสำหรับโปรโตคอล Gateway
title: TypeBox
x-i18n:
    generated_at: "2026-04-24T09:08:07Z"
    model: gpt-5.4
    provider: openai
    source_hash: 0496db919ee5c50a5932aa9e51eb54e1f54791bc0a271f39d6fb9e6fe17a2a28
    source_path: concepts/typebox.md
    workflow: 15
---

# TypeBox เป็นแหล่งข้อมูลจริงของโปรโตคอล

อัปเดตล่าสุด: 2026-01-10

TypeBox คือไลบรารีสคีมาแบบ TypeScript-first เราใช้มันเพื่อกำหนด **โปรโตคอล
Gateway WebSocket** (handshake, request/response, server events) สคีมาเหล่านั้น
ขับเคลื่อน **runtime validation**, **การส่งออก JSON Schema** และ **Swift codegen** สำหรับ
แอป macOS แหล่งข้อมูลจริงหนึ่งเดียว; อย่างอื่นทั้งหมดถูกสร้างขึ้นมา

หากคุณต้องการบริบทโปรโตคอลระดับสูงกว่า ให้เริ่มที่
[สถาปัตยกรรม Gateway](/th/concepts/architecture)

## แบบจำลองความคิด (30 วินาที)

ทุกข้อความ Gateway WS เป็นหนึ่งในสามเฟรม:

- **Request**: `{ type: "req", id, method, params }`
- **Response**: `{ type: "res", id, ok, payload | error }`
- **Event**: `{ type: "event", event, payload, seq?, stateVersion? }`

เฟรมแรก **ต้อง**เป็น request แบบ `connect` หลังจากนั้น clients จึงจะเรียก
methods ได้ (เช่น `health`, `send`, `chat.send`) และ subscribe events ได้ (เช่น
`presence`, `tick`, `agent`)

ลำดับการเชื่อมต่อ (ขั้นต่ำ):

```
Client                    Gateway
  |---- req:connect -------->|
  |<---- res:hello-ok --------|
  |<---- event:tick ----------|
  |---- req:health ---------->|
  |<---- res:health ----------|
```

methods + events ที่พบบ่อย:

| หมวดหมู่      | ตัวอย่าง                                                   | หมายเหตุ                            |
| ------------- | ---------------------------------------------------------- | ----------------------------------- |
| Core          | `connect`, `health`, `status`                              | `connect` ต้องมาก่อนเสมอ            |
| Messaging     | `send`, `agent`, `agent.wait`, `system-event`, `logs.tail` | side-effects ต้องมี `idempotencyKey` |
| Chat          | `chat.history`, `chat.send`, `chat.abort`                  | WebChat ใช้สิ่งเหล่านี้             |
| Sessions      | `sessions.list`, `sessions.patch`, `sessions.delete`       | การดูแลระบบเซสชัน                   |
| Automation    | `wake`, `cron.list`, `cron.run`, `cron.runs`               | การควบคุม wake + Cron               |
| Nodes         | `node.list`, `node.invoke`, `node.pair.*`                  | Gateway WS + การดำเนินการของ node   |
| Events        | `tick`, `presence`, `agent`, `chat`, `health`, `shutdown`  | push จาก server                     |

คลัง **discovery** ที่โฆษณาอย่างเป็นทางการอยู่ใน
`src/gateway/server-methods-list.ts` (`listGatewayMethods`, `GATEWAY_EVENTS`)

## สคีมาอยู่ที่ไหน

- แหล่งข้อมูล: `src/gateway/protocol/schema.ts`
- Runtime validators (AJV): `src/gateway/protocol/index.ts`
- รีจิสทรี feature/discovery ที่โฆษณา: `src/gateway/server-methods-list.ts`
- Handshake ของเซิร์ฟเวอร์ + method dispatch: `src/gateway/server.impl.ts`
- Node client: `src/gateway/client.ts`
- JSON Schema ที่สร้างขึ้น: `dist/protocol.schema.json`
- Swift models ที่สร้างขึ้น: `apps/macos/Sources/OpenClawProtocol/GatewayModels.swift`

## ไปป์ไลน์ปัจจุบัน

- `pnpm protocol:gen`
  - เขียน JSON Schema (draft‑07) ไปยัง `dist/protocol.schema.json`
- `pnpm protocol:gen:swift`
  - สร้างโมเดล Swift ของ gateway
- `pnpm protocol:check`
  - รันตัวสร้างทั้งสองและตรวจสอบว่าเอาต์พุตถูก commit แล้ว

## สคีมาถูกใช้อย่างไรใน runtime

- **ฝั่งเซิร์ฟเวอร์**: ทุกเฟรมขาเข้าจะถูก validate ด้วย AJV handshake จะ
  ยอมรับเฉพาะ request แบบ `connect` ที่มี params ตรงกับ `ConnectParams`
- **ฝั่งไคลเอนต์**: JS client จะ validate เฟรม event และ response ก่อน
  ใช้งาน
- **การค้นพบความสามารถ**: Gateway จะส่งรายการ `features.methods`
  และ `features.events` แบบ conservative ใน `hello-ok` จาก `listGatewayMethods()` และ
  `GATEWAY_EVENTS`
- รายการ discovery นี้ไม่ใช่การ dump แบบสร้างอัตโนมัติของ helper ที่เรียกได้ทุกตัวใน
  `coreGatewayHandlers`; helper RPC บางตัวถูกติดตั้งไว้ใน
  `src/gateway/server-methods/*.ts` โดยไม่ได้ถูกลำดับไว้ในรายการ feature ที่โฆษณา

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

## ไคลเอนต์ขั้นต่ำ (Node.js)

โฟลว์ที่เล็กที่สุดแต่ใช้งานได้จริง: connect + health

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

## ตัวอย่างแบบครบขั้นตอน: เพิ่ม method ตั้งแต่ต้นจนจบ

ตัวอย่าง: เพิ่ม request ใหม่ `system.echo` ที่คืนค่า `{ ok: true, text }`

1. **Schema (แหล่งข้อมูลจริง)**

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

เพิ่มทั้งคู่เข้าไปใน `ProtocolSchemas` และ export types:

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

3. **พฤติกรรมของเซิร์ฟเวอร์**

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
จากนั้นเพิ่ม `"system.echo"` ลงในอินพุต `listGatewayMethods` ใน
`src/gateway/server-methods-list.ts`

หาก method นี้เรียกได้โดย operator หรือ node clients ให้จัดประเภทมันด้วยใน
`src/gateway/method-scopes.ts` เพื่อให้การบังคับใช้ scope และการโฆษณา feature ใน `hello-ok`
สอดคล้องกัน

4. **สร้างใหม่**

```bash
pnpm protocol:check
```

5. **ทดสอบ + เอกสาร**

เพิ่ม server test ใน `src/gateway/server.*.test.ts` และบันทึก method นี้ในเอกสาร

## พฤติกรรมของ Swift codegen

ตัวสร้าง Swift จะสร้าง:

- enum `GatewayFrame` พร้อมเคส `req`, `res`, `event` และ `unknown`
- payload structs/enums แบบ strongly typed
- ค่า `ErrorCode` และ `GATEWAY_PROTOCOL_VERSION`

ประเภทเฟรมที่ไม่รู้จักจะถูกเก็บไว้เป็น raw payload เพื่อรองรับการใช้งานร่วมกันในอนาคต

## Versioning + ความเข้ากันได้

- `PROTOCOL_VERSION` อยู่ใน `src/gateway/protocol/schema.ts`
- Clients จะส่ง `minProtocol` + `maxProtocol`; เซิร์ฟเวอร์จะปฏิเสธหากไม่ตรงกัน
- โมเดล Swift จะเก็บประเภทเฟรมที่ไม่รู้จักไว้เพื่อหลีกเลี่ยงการทำให้ไคลเอนต์รุ่นเก่าใช้งานไม่ได้

## รูปแบบและข้อตกลงของสคีมา

- object ส่วนใหญ่ใช้ `additionalProperties: false` เพื่อให้ payload เข้มงวด
- `NonEmptyString` เป็นค่าเริ่มต้นสำหรับ IDs และชื่อ method/event
- `GatewayFrame` ระดับบนสุดใช้ **discriminator** บน `type`
- methods ที่มี side effects มักต้องมี `idempotencyKey` ใน params
  (ตัวอย่าง: `send`, `poll`, `agent`, `chat.send`)
- `agent` ยอมรับ `internalEvents` แบบไม่บังคับสำหรับบริบท orchestration ที่สร้างโดย runtime
  (เช่น การส่งต่อการเสร็จสิ้นของงาน subagent/Cron); ให้ถือว่านี่เป็นพื้นผิว API ภายใน

## JSON สคีมาสด

JSON Schema ที่สร้างขึ้นอยู่ใน repo ที่ `dist/protocol.schema.json` ไฟล์ดิบที่เผยแพร่แล้ว
โดยทั่วไปจะอยู่ที่:

- [https://raw.githubusercontent.com/openclaw/openclaw/main/dist/protocol.schema.json](https://raw.githubusercontent.com/openclaw/openclaw/main/dist/protocol.schema.json)

## เมื่อคุณเปลี่ยนสคีมา

1. อัปเดตสคีมาของ TypeBox
2. ลงทะเบียน method/event ใน `src/gateway/server-methods-list.ts`
3. อัปเดต `src/gateway/method-scopes.ts` เมื่อ RPC ใหม่ต้องการการจัดประเภท scope ของ operator หรือ
   node
4. รัน `pnpm protocol:check`
5. commit สคีมาที่สร้างใหม่ + Swift models

## ที่เกี่ยวข้อง

- [โปรโตคอลเอาต์พุตแบบสมบูรณ์](/th/reference/rich-output-protocol)
- [RPC adapters](/th/reference/rpc)
