---
read_when:
    - การติดตั้งใช้งานหรืออัปเดตไคลเอนต์ WS ของ Gateway
    - การดีบักความไม่ตรงกันของโปรโตคอลหรือความล้มเหลวในการเชื่อมต่อ
    - การสร้าง schema/models ของโปรโตคอลใหม่
summary: 'โปรโตคอล WebSocket ของ Gateway: handshake, เฟรม และการทำเวอร์ชัน'
title: โปรโตคอล Gateway
x-i18n:
    generated_at: "2026-04-23T05:35:18Z"
    model: gpt-5.4
    provider: openai
    source_hash: 9d4ea65fbe31962ed8ece04a645cfe5aaff9fee8b5f89bc896b461cd45567634
    source_path: gateway/protocol.md
    workflow: 15
---

# โปรโตคอล Gateway (WebSocket)

โปรโตคอล Gateway WS คือ **control plane + ระบบขนส่งของ Node แบบเดียว** สำหรับ
OpenClaw ไคลเอนต์ทั้งหมด (CLI, web UI, แอป macOS, Node บน iOS/Android, Node แบบ headless)
จะเชื่อมต่อผ่าน WebSocket และประกาศ **role** + **scope** ของตน
ขณะ handshake

## ระบบขนส่ง

- WebSocket, text frame พร้อม payload แบบ JSON
- frame แรก **ต้อง**เป็นคำขอ `connect`
- frame ก่อน connect ถูกจำกัดไว้ที่ 64 KiB หลัง handshake สำเร็จ ไคลเอนต์
  ควรปฏิบัติตามข้อจำกัด `hello-ok.policy.maxPayload` และ
  `hello-ok.policy.maxBufferedBytes` เมื่อเปิดใช้ diagnostics
  frame ขาเข้าที่ใหญ่เกินไปและบัฟเฟอร์ขาออกที่ช้าจะส่ง event `payload.large`
  ก่อนที่ Gateway จะปิดหรือทิ้ง frame ที่ได้รับผลกระทบ event เหล่านี้จะเก็บ
  ขนาด ข้อจำกัด พื้นผิวการใช้งาน และรหัสเหตุผลที่ปลอดภัย แต่จะไม่เก็บเนื้อหาข้อความ
  เนื้อหาของไฟล์แนบ เนื้อหา frame ดิบ token cookie หรือค่าลับ

## Handshake (connect)

Gateway → ไคลเอนต์ (challenge ก่อน connect):

```json
{
  "type": "event",
  "event": "connect.challenge",
  "payload": { "nonce": "…", "ts": 1737264000000 }
}
```

ไคลเอนต์ → Gateway:

```json
{
  "type": "req",
  "id": "…",
  "method": "connect",
  "params": {
    "minProtocol": 3,
    "maxProtocol": 3,
    "client": {
      "id": "cli",
      "version": "1.2.3",
      "platform": "macos",
      "mode": "operator"
    },
    "role": "operator",
    "scopes": ["operator.read", "operator.write"],
    "caps": [],
    "commands": [],
    "permissions": {},
    "auth": { "token": "…" },
    "locale": "en-US",
    "userAgent": "openclaw-cli/1.2.3",
    "device": {
      "id": "device_fingerprint",
      "publicKey": "…",
      "signature": "…",
      "signedAt": 1737264000000,
      "nonce": "…"
    }
  }
}
```

Gateway → ไคลเอนต์:

```json
{
  "type": "res",
  "id": "…",
  "ok": true,
  "payload": {
    "type": "hello-ok",
    "protocol": 3,
    "server": { "version": "…", "connId": "…" },
    "features": { "methods": ["…"], "events": ["…"] },
    "snapshot": { "…": "…" },
    "policy": {
      "maxPayload": 26214400,
      "maxBufferedBytes": 52428800,
      "tickIntervalMs": 15000
    }
  }
}
```

`server`, `features`, `snapshot` และ `policy` เป็นฟิลด์บังคับทั้งหมดตาม schema
(`src/gateway/protocol/schema/frames.ts`) `canvasHostUrl` เป็นแบบไม่บังคับ `auth`
จะรายงาน role/scope ที่เจรจาตกลงกันได้เมื่อมี และจะมี `deviceToken`
รวมอยู่ด้วยเมื่อ Gateway ออกให้

เมื่อไม่มีการออก device token `hello-ok.auth` ก็ยังสามารถรายงาน
สิทธิ์ที่เจรจาได้:

```json
{
  "auth": {
    "role": "operator",
    "scopes": ["operator.read", "operator.write"]
  }
}
```

เมื่อมีการออก device token `hello-ok` จะมีข้อมูลต่อไปนี้ด้วย:

```json
{
  "auth": {
    "deviceToken": "…",
    "role": "operator",
    "scopes": ["operator.read", "operator.write"]
  }
}
```

ระหว่าง trusted bootstrap handoff `hello-ok.auth` อาจมีรายการ role เพิ่มเติมแบบถูกจำกัดอยู่ใน `deviceTokens` ด้วย:

```json
{
  "auth": {
    "deviceToken": "…",
    "role": "node",
    "scopes": [],
    "deviceTokens": [
      {
        "deviceToken": "…",
        "role": "operator",
        "scopes": ["operator.approvals", "operator.read", "operator.talk.secrets", "operator.write"]
      }
    ]
  }
}
```

สำหรับโฟลว์ bootstrap ของ node/operator ที่มีมาในตัว token หลักของ node
จะคงอยู่ที่ `scopes: []` และ token ของ operator ที่ส่งต่อใด ๆ จะยังคงถูกจำกัดไว้ใน allowlist ของ bootstrap operator (`operator.approvals`, `operator.read`,
`operator.talk.secrets`, `operator.write`) การตรวจสอบ scope ของ bootstrap
ยังคงใช้คำนำหน้า role: รายการของ operator จะตอบสนองได้เฉพาะคำขอของ operator และ role ที่ไม่ใช่ operator
ยังคงต้องใช้ scope ภายใต้คำนำหน้า role ของตนเอง

### ตัวอย่าง Node

```json
{
  "type": "req",
  "id": "…",
  "method": "connect",
  "params": {
    "minProtocol": 3,
    "maxProtocol": 3,
    "client": {
      "id": "ios-node",
      "version": "1.2.3",
      "platform": "ios",
      "mode": "node"
    },
    "role": "node",
    "scopes": [],
    "caps": ["camera", "canvas", "screen", "location", "voice"],
    "commands": ["camera.snap", "canvas.navigate", "screen.record", "location.get"],
    "permissions": { "camera.capture": true, "screen.record": false },
    "auth": { "token": "…" },
    "locale": "en-US",
    "userAgent": "openclaw-ios/1.2.3",
    "device": {
      "id": "device_fingerprint",
      "publicKey": "…",
      "signature": "…",
      "signedAt": 1737264000000,
      "nonce": "…"
    }
  }
}
```

## รูปแบบเฟรม

- **Request**: `{type:"req", id, method, params}`
- **Response**: `{type:"res", id, ok, payload|error}`
- **Event**: `{type:"event", event, payload, seq?, stateVersion?}`

เมธอดที่มีผลข้างเคียงต้องใช้ **idempotency key** (ดู schema)

## Roles + scopes

### Roles

- `operator` = ไคลเอนต์ของ control plane (CLI/UI/automation)
- `node` = โฮสต์ของ capability (camera/screen/canvas/system.run)

### Scopes (operator)

scope ที่พบบ่อย:

- `operator.read`
- `operator.write`
- `operator.admin`
- `operator.approvals`
- `operator.pairing`
- `operator.talk.secrets`

`talk.config` ที่ใช้ `includeSecrets: true` ต้องมี `operator.talk.secrets`
(หรือ `operator.admin`)

เมธอด Gateway RPC ที่ลงทะเบียนโดย Plugin อาจร้องขอ operator scope ของตัวเองได้ แต่
คำนำหน้า core admin ที่สงวนไว้ (`config.*`, `exec.approvals.*`, `wizard.*`,
`update.*`) จะถูก resolve เป็น `operator.admin` เสมอ

scope ของเมธอดเป็นเพียงด่านแรกเท่านั้น slash command บางรายการที่เข้าถึงผ่าน
`chat.send` จะมีการตรวจสอบระดับคำสั่งที่เข้มกว่าเพิ่มเติม ตัวอย่างเช่น
การเขียนแบบคงทนของ `/config set` และ `/config unset` ต้องใช้ `operator.admin`

`node.pair.approve` ยังมีการตรวจสอบ scope เพิ่มเติมตอนอนุมัติ ซ้อนอยู่บน
scope พื้นฐานของเมธอดด้วย:

- คำขอที่ไม่มี command: `operator.pairing`
- คำขอที่มีคำสั่งของ Node ที่ไม่ใช่ exec: `operator.pairing` + `operator.write`
- คำขอที่มี `system.run`, `system.run.prepare` หรือ `system.which`:
  `operator.pairing` + `operator.admin`

### Caps/commands/permissions (node)

Node จะประกาศ claim ของ capability ตอน connect:

- `caps`: หมวด capability ระดับสูง
- `commands`: allowlist ของคำสั่งสำหรับ invoke
- `permissions`: สวิตช์แบบละเอียด (เช่น `screen.record`, `camera.capture`)

Gateway ถือว่าสิ่งเหล่านี้เป็น **claim** และบังคับใช้ allowlist ฝั่งเซิร์ฟเวอร์

## Presence

- `system-presence` ส่งคืนรายการที่จัดเก็บตามตัวตนอุปกรณ์
- รายการ presence จะมี `deviceId`, `roles` และ `scopes` เพื่อให้ UI แสดงแถวเดียวต่ออุปกรณ์
  ได้ แม้อุปกรณ์นั้นจะเชื่อมต่อทั้งในฐานะ **operator** และ **node**

## การกำหนดขอบเขตของ broadcast event

event broadcast ผ่าน WebSocket ที่เซิร์ฟเวอร์ push ออกมาจะถูกควบคุมด้วย scope เพื่อไม่ให้เซสชันที่มีเพียง scope สำหรับ pairing หรือเฉพาะ node ได้รับเนื้อหาของเซสชันแบบพาสซีฟ

- **เฟรมแชต เอเจนต์ และผลลัพธ์ของ tool** (รวมถึง event `agent` แบบสตรีม และผลลัพธ์ของ tool call) ต้องมีอย่างน้อย `operator.read` เซสชันที่ไม่มี `operator.read` จะข้ามเฟรมเหล่านี้ทั้งหมด
- **broadcast แบบ `plugin.*` ที่นิยามโดย Plugin** จะถูกควบคุมให้ใช้ `operator.write` หรือ `operator.admin` ตามวิธีที่ Plugin ลงทะเบียนไว้
- **event สถานะและระบบขนส่ง** (`heartbeat`, `presence`, `tick`, วงจรชีวิตการ connect/disconnect ฯลฯ) ยังคงไม่ถูกจำกัด เพื่อให้สุขภาพของระบบขนส่งยังสังเกตได้สำหรับทุกเซสชันที่ยืนยันตัวตนแล้ว
- **ตระกูล broadcast event ที่ไม่รู้จัก** จะถูกควบคุมด้วย scope โดยค่าเริ่มต้น (fail-closed) เว้นแต่ handler ที่ลงทะเบียนไว้จะผ่อนคลายเงื่อนไขนี้อย่างชัดเจน

การเชื่อมต่อของไคลเอนต์แต่ละตัวจะมีหมายเลขลำดับแบบต่อไคลเอนต์ของตัวเอง เพื่อให้ broadcast คงลำดับแบบ monotonic บน socket นั้น แม้ไคลเอนต์ต่างตัวจะเห็น subset ของสตรีม event ที่ถูกกรองด้วย scope ต่างกันก็ตาม

## ตระกูลเมธอด RPC ทั่วไป

หน้านี้ไม่ใช่ dump แบบเต็มที่สร้างอัตโนมัติ แต่พื้นผิว WS สาธารณะนั้นกว้าง
มากกว่าตัวอย่าง handshake/auth ด้านบน เมธอดเหล่านี้คือกลุ่มหลักที่
Gateway เปิดให้ใช้งานอยู่ในปัจจุบัน

`hello-ok.features.methods` คือรายการค้นพบแบบ conservative ที่สร้างจาก
`src/gateway/server-methods-list.ts` ร่วมกับ method export จาก plugin/channel ที่โหลดแล้ว
ให้ถือว่านี่เป็นการค้นพบฟีเจอร์ ไม่ใช่ dump ที่สร้างอัตโนมัติของ helper ที่เรียกใช้ได้ทุกตัว
ซึ่งมีอยู่ใน `src/gateway/server-methods/*.ts`

### ระบบและตัวตน

- `health` ส่งคืนสแนปชอตสุขภาพของ Gateway ที่แคชไว้หรือเพิ่ง probe ใหม่
- `diagnostics.stability` ส่งคืนตัวบันทึกเสถียรภาพเชิงวินิจฉัยล่าสุดแบบมีขอบเขต
  โดยเก็บเมทาดาทาด้านปฏิบัติการ เช่น ชื่อ event จำนวน ขนาดไบต์
  ค่าหน่วยความจำ สถานะคิว/เซสชัน ชื่อช่องทาง/Plugin และ session id
  แต่จะไม่เก็บข้อความแชต เนื้อหา Webhook ผลลัพธ์ของ tool เนื้อหา request หรือ
  response แบบดิบ token cookie หรือค่าลับ ต้องใช้ scope แบบ operator read
- `status` ส่งคืนสรุปของ Gateway แบบ `/status`; ฟิลด์ที่ละเอียดอ่อนจะ
  รวมอยู่ด้วยเฉพาะสำหรับไคลเอนต์ operator ที่มี scope ระดับ admin
- `gateway.identity.get` ส่งคืนตัวตนอุปกรณ์ของ Gateway ที่ใช้โดยโฟลว์ relay และการจับคู่
- `system-presence` ส่งคืนสแนปชอต presence ปัจจุบันสำหรับอุปกรณ์ operator/node ที่เชื่อมต่ออยู่
- `system-event` เพิ่ม system event และสามารถอัปเดต/กระจายบริบท presence ได้
- `last-heartbeat` ส่งคืน event Heartbeat ล่าสุดที่เก็บถาวรไว้
- `set-heartbeats` เปิด/ปิดการประมวลผล Heartbeat บน Gateway

### โมเดลและการใช้งาน

- `models.list` ส่งคืนแค็ตตาล็อกโมเดลที่ runtime อนุญาต
- `usage.status` ส่งคืนหน้าต่างการใช้งานของผู้ให้บริการ/สรุปโควตาที่เหลือ
- `usage.cost` ส่งคืนสรุปค่าใช้จ่ายรวมสำหรับช่วงวันที่กำหนด
- `doctor.memory.status` ส่งคืนสถานะความพร้อมของ vector-memory / embedding สำหรับ
  workspace ของเอเจนต์ค่าเริ่มต้นที่ active อยู่
- `sessions.usage` ส่งคืนสรุปการใช้งานแยกตามเซสชัน
- `sessions.usage.timeseries` ส่งคืน timeseries การใช้งานสำหรับหนึ่งเซสชัน
- `sessions.usage.logs` ส่งคืนรายการ log การใช้งานสำหรับหนึ่งเซสชัน

### ช่องทางและตัวช่วยล็อกอิน

- `channels.status` ส่งคืนสรุปสถานะของช่องทาง/Plugin ทั้งที่มีมาในตัวและ bundled
- `channels.logout` ออกจากระบบของช่องทาง/บัญชีที่ระบุ หากช่องทางนั้นรองรับ logout
- `web.login.start` เริ่มโฟลว์ล็อกอินผ่าน QR/เว็บสำหรับผู้ให้บริการ web channel ปัจจุบันที่รองรับ QR
- `web.login.wait` รอให้โฟลว์ล็อกอินผ่าน QR/เว็บนั้นเสร็จสิ้น และเริ่มช่องทางเมื่อสำเร็จ
- `push.test` ส่ง APNs push ทดสอบไปยัง Node บน iOS ที่ลงทะเบียนไว้
- `voicewake.get` ส่งคืน trigger ของ wake word ที่เก็บไว้
- `voicewake.set` อัปเดต trigger ของ wake word และ broadcast การเปลี่ยนแปลง

### ข้อความและ log

- `send` คือ RPC สำหรับการส่งขาออกโดยตรง ไปยังเป้าหมายแบบช่องทาง/บัญชี/เธรด
  นอกตัวรันแชต
- `logs.tail` ส่งคืนส่วนท้ายของ file log ของ Gateway ที่ตั้งค่าไว้ พร้อมตัวควบคุม cursor/limit และ
  max-byte

### Talk และ TTS

- `talk.config` ส่งคืน payload ของคอนฟิก Talk ที่มีผลจริง; `includeSecrets`
  ต้องใช้ `operator.talk.secrets` (หรือ `operator.admin`)
- `talk.mode` ตั้งค่า/กระจายสถานะ Talk mode ปัจจุบันสำหรับไคลเอนต์ WebChat/Control UI
- `talk.speak` สังเคราะห์เสียงผ่านผู้ให้บริการเสียงของ Talk ที่ active อยู่
- `tts.status` ส่งคืนสถานะการเปิดใช้ TTS, ผู้ให้บริการที่ active, ผู้ให้บริการสำรอง
  และสถานะคอนฟิกของผู้ให้บริการ
- `tts.providers` ส่งคืน inventory ของผู้ให้บริการ TTS ที่มองเห็นได้
- `tts.enable` และ `tts.disable` เปิด/ปิดสถานะการตั้งค่า TTS
- `tts.setProvider` อัปเดตผู้ให้บริการ TTS ที่ต้องการ
- `tts.convert` รันการแปลงข้อความเป็นเสียงแบบครั้งเดียว

### Secrets, config, update และ wizard

- `secrets.reload` จะ resolve SecretRef ที่ active อยู่ใหม่ และสลับสถานะ secret ของรันไทม์
  เฉพาะเมื่อสำเร็จทั้งหมดเท่านั้น
- `secrets.resolve` จะ resolve การกำหนด secret เป้าหมายของคำสั่งสำหรับ
  ชุดคำสั่ง/เป้าหมายที่ระบุ
- `config.get` ส่งคืนสแนปชอตคอนฟิกปัจจุบันและ hash
- `config.set` เขียน payload คอนฟิกที่ผ่านการตรวจสอบแล้ว
- `config.patch` merge การอัปเดตคอนฟิกบางส่วน
- `config.apply` ตรวจสอบความถูกต้อง + แทนที่ payload คอนฟิกทั้งหมด
- `config.schema` ส่งคืน payload schema ของคอนฟิกแบบสดที่ใช้โดย Control UI และ
  เครื่องมือ CLI: schema, `uiHints`, เวอร์ชัน และเมทาดาทาการสร้าง รวมถึง
  เมทาดาทา schema ของ Plugin + ช่องทางเมื่อรันไทม์สามารถโหลดได้ schema นี้
  มีเมทาดาทา `title` / `description` ของฟิลด์ ซึ่งอนุมานมาจากป้ายชื่อและ
  ข้อความช่วยเหลือชุดเดียวกับที่ UI ใช้ รวมถึงสาขาของ object แบบซ้อน, wildcard, array-item
  และองค์ประกอบ `anyOf` / `oneOf` / `allOf` เมื่อมีเอกสารของฟิลด์ที่ตรงกันอยู่
- `config.schema.lookup` ส่งคืน payload สำหรับ lookup แบบกำหนดขอบเขตตาม path ของพาธคอนฟิกหนึ่งรายการ:
  พาธที่ normalize แล้ว, schema node แบบตื้น, hint ที่จับคู่ได้พร้อม `hintPath`, และ
  สรุปของ child โดยตรงสำหรับการเจาะลึกใน UI/CLI
  - schema node ของ lookup จะคงเอกสารสำหรับผู้ใช้และฟิลด์ตรวจสอบทั่วไปไว้:
    `title`, `description`, `type`, `enum`, `const`, `format`, `pattern`,
    ขอบเขตของตัวเลข/สตริง/อาร์เรย์/อ็อบเจ็กต์ และแฟล็กแบบบูลีน เช่น
    `additionalProperties`, `deprecated`, `readOnly`, `writeOnly`
  - สรุปของ child จะแสดง `key`, `path` ที่ normalize แล้ว, `type`, `required`,
    `hasChildren` รวมถึง `hint` / `hintPath` ที่จับคู่ได้
- `update.run` รันโฟลว์อัปเดต Gateway และจัดตารางการรีสตาร์ตเฉพาะเมื่อ
  การอัปเดตสำเร็จจริงเท่านั้น
- `wizard.start`, `wizard.next`, `wizard.status` และ `wizard.cancel` เปิดใช้
  onboarding wizard ผ่าน WS RPC

### กลุ่มหลักที่มีอยู่แล้ว

#### ตัวช่วยสำหรับเอเจนต์และ workspace

- `agents.list` ส่งคืนรายการเอเจนต์ที่ตั้งค่าไว้
- `agents.create`, `agents.update` และ `agents.delete` จัดการระเบียนของเอเจนต์และ
  การเชื่อมโยง workspace
- `agents.files.list`, `agents.files.get` และ `agents.files.set` จัดการ
  ไฟล์ bootstrap workspace ที่เปิดให้ใช้สำหรับเอเจนต์
- `agent.identity.get` ส่งคืนตัวตนผู้ช่วยที่มีผลจริงสำหรับเอเจนต์หรือเซสชัน
- `agent.wait` รอให้การรันเสร็จสิ้น และส่งคืนสแนปชอตสถานะ terminal เมื่อมี

#### การควบคุมเซสชัน

- `sessions.list` ส่งคืนดัชนีของเซสชันปัจจุบัน
- `sessions.subscribe` และ `sessions.unsubscribe` เปิด/ปิดการสมัครรับ event การเปลี่ยนแปลงของเซสชันสำหรับไคลเอนต์ WS ปัจจุบัน
- `sessions.messages.subscribe` และ `sessions.messages.unsubscribe` เปิด/ปิด
  การสมัครรับ event ของ transcript/ข้อความสำหรับหนึ่งเซสชัน
- `sessions.preview` ส่งคืน preview ของ transcript แบบมีขอบเขตสำหรับ session key ที่ระบุ
- `sessions.resolve` resolve หรือทำให้เป้าหมายของเซสชันเป็น canonical
- `sessions.create` สร้างรายการเซสชันใหม่
- `sessions.send` ส่งข้อความเข้าไปในเซสชันที่มีอยู่แล้ว
- `sessions.steer` เป็นรูปแบบ interrupt-and-steer สำหรับเซสชันที่ active อยู่
- `sessions.abort` ยุติงานที่ active สำหรับเซสชัน
- `sessions.patch` อัปเดตเมทาดาทา/override ของเซสชัน
- `sessions.reset`, `sessions.delete` และ `sessions.compact` ใช้ทำ
  การบำรุงรักษาเซสชัน
- `sessions.get` ส่งคืนแถวเซสชันที่จัดเก็บไว้ทั้งหมด
- การทำงานของแชตยังคงใช้ `chat.history`, `chat.send`, `chat.abort` และ
  `chat.inject`
- `chat.history` จะถูก normalize สำหรับการแสดงผลกับไคลเอนต์ UI: แท็ก directive แบบ inline จะถูกตัดออกจากข้อความที่มองเห็น, payload XML ของ tool-call แบบข้อความล้วน (รวมถึง
  `<tool_call>...</tool_call>`, `<function_call>...</function_call>`,
  `<tool_calls>...</tool_calls>`, `<function_calls>...</function_calls>` และ
  บล็อก tool-call ที่ถูกตัดค้าง) รวมถึงโทเคนควบคุมโมเดลแบบ ASCII/full-width ที่รั่วออกมาจะถูกตัดออก, แถวของ assistant ที่เป็นโทเคนเงียบล้วน เช่น `NO_REPLY` /
  `no_reply` แบบตรงตัวจะถูกละไว้ และแถวที่ใหญ่เกินไปอาจถูกแทนที่ด้วย placeholder

#### การจับคู่อุปกรณ์และ device token

- `device.pair.list` ส่งคืนอุปกรณ์ที่จับคู่แล้วทั้งที่รอดำเนินการและที่อนุมัติแล้ว
- `device.pair.approve`, `device.pair.reject` และ `device.pair.remove` จัดการ
  ระเบียนการจับคู่อุปกรณ์
- `device.token.rotate` หมุนเวียน token ของอุปกรณ์ที่จับคู่แล้วภายในขอบเขต role
  และ scope ที่ได้รับอนุมัติ
- `device.token.revoke` เพิกถอน token ของอุปกรณ์ที่จับคู่แล้ว

#### การจับคู่ Node, invoke และงานที่รอดำเนินการ

- `node.pair.request`, `node.pair.list`, `node.pair.approve`,
  `node.pair.reject` และ `node.pair.verify` ครอบคลุมการจับคู่ Node และการตรวจสอบ bootstrap
- `node.list` และ `node.describe` ส่งคืนสถานะของ Node ที่รู้จัก/เชื่อมต่ออยู่
- `node.rename` อัปเดตป้ายชื่อของ Node ที่จับคู่แล้ว
- `node.invoke` ส่งต่อคำสั่งไปยัง Node ที่เชื่อมต่ออยู่
- `node.invoke.result` ส่งคืนผลลัพธ์ของคำขอ invoke
- `node.event` ใช้ส่ง event ที่มาจาก Node กลับเข้า Gateway
- `node.canvas.capability.refresh` รีเฟรช token ของ canvas-capability ที่มีขอบเขตจำกัด
- `node.pending.pull` และ `node.pending.ack` คือ API สำหรับคิวของ Node ที่เชื่อมต่ออยู่
- `node.pending.enqueue` และ `node.pending.drain` จัดการ
  งานที่รอดำเนินการแบบคงทนสำหรับ Node ที่ออฟไลน์/ตัดการเชื่อมต่อ

#### กลุ่มการอนุมัติ

- `exec.approval.request`, `exec.approval.get`, `exec.approval.list` และ
  `exec.approval.resolve` ครอบคลุมคำขออนุมัติ exec แบบครั้งเดียว รวมถึงการค้นหา/เล่นซ้ำการอนุมัติที่รอดำเนินการ
- `exec.approval.waitDecision` รอการตัดสินใจสำหรับการอนุมัติ exec ที่รอดำเนินการหนึ่งรายการ และส่งคืนผลการตัดสินใจสุดท้าย (หรือ `null` เมื่อหมดเวลา)
- `exec.approvals.get` และ `exec.approvals.set` จัดการสแนปชอตนโยบายการอนุมัติ exec ของ Gateway
- `exec.approvals.node.get` และ `exec.approvals.node.set` จัดการนโยบายการอนุมัติ exec ภายใน Node
  ผ่านคำสั่ง relay ของ Node
- `plugin.approval.request`, `plugin.approval.list`,
  `plugin.approval.waitDecision` และ `plugin.approval.resolve` ครอบคลุม
  โฟลว์การอนุมัติที่กำหนดโดย Plugin

#### กลุ่มหลักอื่น ๆ

- automation:
  - `wake` จัดตารางการ inject ข้อความปลุกแบบทันทีหรือใน Heartbeat ถัดไป
  - `cron.list`, `cron.status`, `cron.add`, `cron.update`, `cron.remove`,
    `cron.run`, `cron.runs`
- Skills/tools: `commands.list`, `skills.*`, `tools.catalog`, `tools.effective`

### กลุ่ม event ทั่วไป

- `chat`: การอัปเดตแชตของ UI เช่น `chat.inject` และ event ของแชตแบบ transcript-only อื่น ๆ
- `session.message` และ `session.tool`: การอัปเดต transcript/event-stream สำหรับ
  เซสชันที่สมัครรับไว้
- `sessions.changed`: ดัชนีของเซสชันหรือเมทาดาทามีการเปลี่ยนแปลง
- `presence`: การอัปเดตสแนปชอต presence ของระบบ
- `tick`: event keepalive / liveness แบบเป็นระยะ
- `health`: การอัปเดตสแนปชอตสุขภาพของ Gateway
- `heartbeat`: การอัปเดตสตรีม event ของ Heartbeat
- `cron`: event การเปลี่ยนแปลงของการรัน/งาน Cron
- `shutdown`: การแจ้งเตือนการปิดตัวของ Gateway
- `node.pair.requested` / `node.pair.resolved`: วงจรชีวิตของการจับคู่ Node
- `node.invoke.request`: broadcast ของคำขอ invoke จาก Node
- `device.pair.requested` / `device.pair.resolved`: วงจรชีวิตของอุปกรณ์ที่จับคู่แล้ว
- `voicewake.changed`: คอนฟิก trigger ของ wake word เปลี่ยนไป
- `exec.approval.requested` / `exec.approval.resolved`: วงจรชีวิตของ
  การอนุมัติ exec
- `plugin.approval.requested` / `plugin.approval.resolved`: วงจรชีวิตของ
  การอนุมัติ Plugin

### เมธอดตัวช่วยของ Node

- Node สามารถเรียก `skills.bins` เพื่อดึงรายการ executable ของ skill ปัจจุบัน
  สำหรับการตรวจสอบ auto-allow

### เมธอดตัวช่วยของ operator

- operator สามารถเรียก `commands.list` (`operator.read`) เพื่อดึง inventory ของคำสั่งที่ runtime ใช้ได้สำหรับเอเจนต์
  - `agentId` เป็นแบบไม่บังคับ; ไม่ต้องส่งเพื่ออ่าน workspace ของเอเจนต์ค่าเริ่มต้น
  - `scope` ควบคุมว่าค่า `name` หลักจะชี้ไปยังพื้นผิวใด:
    - `text` ส่งคืนโทเคนคำสั่งข้อความหลักโดยไม่มี `/` นำหน้า
    - `native` และเส้นทางค่าเริ่มต้น `both` จะส่งคืนชื่อ native ที่รับรู้ผู้ให้บริการเมื่อมี
  - `textAliases` มีชื่อแฝงแบบ slash ที่ตรงตัว เช่น `/model` และ `/m`
  - `nativeName` มีชื่อคำสั่ง native ที่รับรู้ผู้ให้บริการเมื่อมีอยู่
  - `provider` เป็นแบบไม่บังคับ และมีผลเฉพาะกับการตั้งชื่อแบบ native รวมถึงความพร้อมของคำสั่ง Plugin แบบ native
  - `includeArgs=false` จะละเมทาดาทาของอาร์กิวเมนต์ที่ serialize แล้วออกจากคำตอบ
- operator สามารถเรียก `tools.catalog` (`operator.read`) เพื่อดึงแค็ตตาล็อกเครื่องมือของ runtime สำหรับ
  เอเจนต์ได้ คำตอบมีเครื่องมือที่จัดกลุ่มแล้วและเมทาดาทาแหล่งที่มา:
  - `source`: `core` หรือ `plugin`
  - `pluginId`: เจ้าของ Plugin เมื่อ `source="plugin"`
  - `optional`: เครื่องมือของ Plugin เป็นแบบ optional หรือไม่
- operator สามารถเรียก `tools.effective` (`operator.read`) เพื่อดึง inventory ของเครื่องมือที่มีผลจริงใน runtime
  สำหรับเซสชันได้
  - `sessionKey` เป็นฟิลด์บังคับ
  - Gateway จะอนุมานบริบทรันไทม์ที่เชื่อถือได้จากเซสชันฝั่งเซิร์ฟเวอร์ แทนการรับ
    บริบทการยืนยันตัวตนหรือการส่งมอบที่ผู้เรียกส่งมาเอง
  - คำตอบมีขอบเขตตามเซสชัน และสะท้อนสิ่งที่การสนทนาที่ active อยู่สามารถใช้ได้จริงในตอนนี้
    รวมถึงเครื่องมือจาก core, Plugin และช่องทาง
- operator สามารถเรียก `skills.status` (`operator.read`) เพื่อดึง inventory ของ
  Skills ที่มองเห็นได้สำหรับเอเจนต์
  - `agentId` เป็นแบบไม่บังคับ; ไม่ต้องส่งเพื่ออ่าน workspace ของเอเจนต์ค่าเริ่มต้น
  - คำตอบมีสิทธิ์การใช้งาน ความต้องการที่ขาดอยู่ การตรวจสอบคอนฟิก และ
    ตัวเลือกการติดตั้งที่ผ่านการ sanitize แล้ว โดยไม่เปิดเผยค่าลับดิบ
- operator สามารถเรียก `skills.search` และ `skills.detail` (`operator.read`) เพื่อดูเมทาดาทาการค้นพบของ ClawHub
- operator สามารถเรียก `skills.install` (`operator.admin`) ได้สองโหมด:
  - โหมด ClawHub: `{ source: "clawhub", slug, version?, force? }` จะติดตั้ง
    โฟลเดอร์ Skill ลงในไดเรกทอรี `skills/` ของ workspace เอเจนต์ค่าเริ่มต้น
  - โหมดตัวติดตั้ง Gateway: `{ name, installId, dangerouslyForceUnsafeInstall?, timeoutMs? }`
    จะรันการกระทำ `metadata.openclaw.install` ที่ประกาศไว้บนโฮสต์ของ Gateway
- operator สามารถเรียก `skills.update` (`operator.admin`) ได้สองโหมด:
  - โหมด ClawHub จะอัปเดต slug ที่ติดตามไว้หนึ่งรายการ หรือ ClawHub ทั้งหมดที่ติดตั้งไว้
    ใน workspace ของเอเจนต์ค่าเริ่มต้น
  - โหมดคอนฟิกจะ patch ค่าใน `skills.entries.<skillKey>` เช่น `enabled`,
    `apiKey` และ `env`

## การอนุมัติ exec

- เมื่อคำขอ exec ต้องได้รับการอนุมัติ Gateway จะ broadcast `exec.approval.requested`
- ไคลเอนต์ operator จะแก้ไขได้โดยเรียก `exec.approval.resolve` (ต้องใช้ scope `operator.approvals`)
- สำหรับ `host=node`, `exec.approval.request` ต้องมี `systemRunPlan` (ค่า canonical ของ `argv`/`cwd`/`rawCommand`/เมทาดาทาของเซสชัน) คำขอที่ไม่มี `systemRunPlan` จะถูกปฏิเสธ
- หลังอนุมัติแล้ว การเรียก `node.invoke system.run` ที่ส่งต่อจะใช้
  `systemRunPlan` แบบ canonical นั้นซ้ำเป็นบริบท authoritative สำหรับ command/cwd/session
- หากผู้เรียกแก้ไข `command`, `rawCommand`, `cwd`, `agentId` หรือ
  `sessionKey` ระหว่าง prepare กับการส่งต่อ `system.run` ที่ได้รับอนุมัติขั้นสุดท้าย
  Gateway จะปฏิเสธการรันแทนที่จะเชื่อ payload ที่ถูกแก้ไขนั้น

## Fallback ของการส่งมอบโดยเอเจนต์

- คำขอ `agent` สามารถใส่ `deliver=true` เพื่อขอให้มีการส่งมอบขาออก
- `bestEffortDeliver=false` จะคงพฤติกรรมแบบ strict: เป้าหมายการส่งมอบที่แก้ไม่สำเร็จหรือเป็นภายในเท่านั้นจะส่งกลับ `INVALID_REQUEST`
- `bestEffortDeliver=true` จะอนุญาต fallback ไปเป็นการทำงานเฉพาะในเซสชัน เมื่อไม่สามารถ resolve เส้นทางภายนอกที่ส่งมอบได้ (เช่น เซสชัน internal/webchat หรือคอนฟิกหลายช่องทางที่กำกวม)

## การทำเวอร์ชัน

- `PROTOCOL_VERSION` อยู่ใน `src/gateway/protocol/schema/protocol-schemas.ts`
- ไคลเอนต์จะส่ง `minProtocol` + `maxProtocol`; เซิร์ฟเวอร์จะปฏิเสธหากไม่ตรงกัน
- schema + model สร้างจากนิยาม TypeBox:
  - `pnpm protocol:gen`
  - `pnpm protocol:gen:swift`
  - `pnpm protocol:check`

### ค่าคงที่ของไคลเอนต์

reference client ใน `src/gateway/client.ts` ใช้ค่าเริ่มต้นเหล่านี้ ค่าเหล่านี้
คงที่ตลอดโปรโตคอล v3 และเป็น baseline ที่คาดหวังสำหรับไคลเอนต์ของบุคคลที่สาม

| ค่าคงที่                                  | ค่าเริ่มต้น                                            | แหล่งที่มา                                                  |
| ----------------------------------------- | ------------------------------------------------------ | ----------------------------------------------------------- |
| `PROTOCOL_VERSION`                        | `3`                                                    | `src/gateway/protocol/schema/protocol-schemas.ts`           |
| เวลาหมดอายุของคำขอ (ต่อ RPC)             | `30_000` ms                                            | `src/gateway/client.ts` (`requestTimeoutMs`)                |
| เวลาหมดอายุก่อนยืนยันตัวตน / connect-challenge | `10_000` ms                                       | `src/gateway/handshake-timeouts.ts` (clamp `250`–`10_000`)  |
| backoff เริ่มต้นสำหรับการ reconnect       | `1_000` ms                                             | `src/gateway/client.ts` (`backoffMs`)                       |
| backoff สูงสุดสำหรับการ reconnect         | `30_000` ms                                            | `src/gateway/client.ts` (`scheduleReconnect`)               |
| การ clamp สำหรับ fast-retry หลังปิด device-token | `250` ms                                         | `src/gateway/client.ts`                                     |
| ช่วงผ่อนผันก่อน `terminate()` เมื่อบังคับหยุด | `250` ms                                         | `FORCE_STOP_TERMINATE_GRACE_MS`                             |
| ค่า timeout เริ่มต้นของ `stopAndWait()`   | `1_000` ms                                             | `STOP_AND_WAIT_TIMEOUT_MS`                                  |
| ช่วง tick เริ่มต้น (ก่อน `hello-ok`)      | `30_000` ms                                            | `src/gateway/client.ts`                                     |
| การปิดจาก tick-timeout                    | code `4000` เมื่อเงียบเกิน `tickIntervalMs * 2`        | `src/gateway/client.ts`                                     |
| `MAX_PAYLOAD_BYTES`                       | `25 * 1024 * 1024` (25 MB)                             | `src/gateway/server-constants.ts`                           |

เซิร์ฟเวอร์จะประกาศค่า `policy.tickIntervalMs`, `policy.maxPayload`
และ `policy.maxBufferedBytes` ที่มีผลจริงใน `hello-ok`; ไคลเอนต์ควรยึดค่าพวกนี้
แทนค่าเริ่มต้นก่อน handshake

## การยืนยันตัวตน

- การยืนยันตัวตนของ Gateway แบบ shared-secret ใช้ `connect.params.auth.token` หรือ
  `connect.params.auth.password` ตามโหมดการยืนยันตัวตนที่ตั้งค่าไว้
- โหมดที่มีการส่งตัวตนมาด้วย เช่น Tailscale Serve
  (`gateway.auth.allowTailscale: true`) หรือ
  `gateway.auth.mode: "trusted-proxy"` แบบ non-loopback จะผ่านการตรวจสอบการยืนยันตัวตนของ connect จาก
  request header แทน `connect.params.auth.*`
- `gateway.auth.mode: "none"` บน private-ingress จะข้ามการยืนยันตัวตนแบบ shared-secret ของ connect
  ไปทั้งหมด; อย่าเปิดใช้โหมดนี้บน ingress สาธารณะ/ที่ไม่เชื่อถือได้
- หลังจากจับคู่แล้ว Gateway จะออก **device token** ที่มีขอบเขตตาม role + scope
  ของการเชื่อมต่อนั้น มันจะถูกส่งกลับใน `hello-ok.auth.deviceToken` และไคลเอนต์
  ควรเก็บถาวรไว้เพื่อใช้ในการ connect ครั้งถัดไป
- ไคลเอนต์ควรเก็บ `hello-ok.auth.deviceToken` หลักไว้หลังจาก connect สำเร็จทุกครั้ง
- การ reconnect ด้วย **device token ที่เก็บไว้** นั้นควรนำชุด scope ที่ได้รับอนุมัติซึ่งเก็บไว้สำหรับ token นั้นกลับมาใช้ซ้ำด้วย วิธีนี้จะคงสิทธิ์ read/probe/status ที่ได้รับอนุญาตไว้แล้ว และหลีกเลี่ยงไม่ให้การ reconnect หดกลับเงียบ ๆ ไปเป็น implicit admin-only scope ที่แคบกว่า
- การประกอบ auth สำหรับ connect ฝั่งไคลเอนต์ (`selectConnectAuth` ใน
  `src/gateway/client.ts`):
  - `auth.password` แยกเป็นอิสระ และจะถูกส่งต่อเสมอเมื่อมีการตั้งค่า
  - `auth.token` จะถูกเติมตามลำดับความสำคัญ: shared token แบบ explicit ก่อน,
    จากนั้น `deviceToken` แบบ explicit, จากนั้นจึงเป็น token ต่ออุปกรณ์ที่เก็บไว้ (อิงตาม
    `deviceId` + `role`)
  - `auth.bootstrapToken` จะถูกส่งเฉพาะเมื่อไม่มีกรณีข้างต้นใด resolve เป็น
    `auth.token` ได้ shared token หรือ device token ที่ resolve ได้ใด ๆ จะกดไม่ให้ส่งมัน
  - การเลื่อนระดับอัตโนมัติของ device token ที่เก็บไว้ในการ retry แบบ one-shot
    สำหรับ `AUTH_TOKEN_MISMATCH` จะถูกจำกัดให้ใช้ได้เฉพาะกับ **endpoint ที่เชื่อถือได้เท่านั้น** —
    loopback หรือ `wss://` ที่มี `tlsFingerprint` แบบ pin ไว้
    `wss://` สาธารณะที่ไม่มี pinning จะไม่เข้าเกณฑ์
- รายการเพิ่มเติมใน `hello-ok.auth.deviceTokens` คือ token จาก bootstrap handoff
  ให้เก็บถาวรเฉพาะเมื่อการ connect ใช้ bootstrap auth บนระบบขนส่งที่เชื่อถือได้
  เช่น `wss://` หรือ loopback/local pairing
- หากไคลเอนต์ส่ง `deviceToken` แบบ **explicit** หรือ `scopes` แบบ explicit มา
  ชุด scope ที่ผู้เรียกร้องขอเองนั้นจะยังคงเป็น authoritative; scope ที่แคชไว้จะถูกนำกลับมาใช้
  เฉพาะเมื่อไคลเอนต์กำลังใช้ token ต่ออุปกรณ์ที่เก็บไว้ซ้ำ
- device token สามารถหมุนเวียน/เพิกถอนได้ผ่าน `device.token.rotate` และ
  `device.token.revoke` (ต้องใช้ scope `operator.pairing`)
- การออก/หมุนเวียน token จะยังคงถูกจำกัดอยู่ในชุด role ที่ได้รับอนุมัติซึ่งบันทึกไว้ใน
  รายการการจับคู่ของอุปกรณ์นั้น; การหมุน token ไม่สามารถขยายอุปกรณ์ไปสู่
  role ที่การอนุมัติการจับคู่ไม่เคยให้ไว้ได้
- สำหรับเซสชัน token ของอุปกรณ์ที่จับคู่แล้ว การจัดการอุปกรณ์จะมีขอบเขตจำกัดอยู่กับตัวเอง เว้นแต่ผู้เรียกจะมี `operator.admin` ด้วย: ผู้เรียกที่ไม่ใช่ admin สามารถลบ/เพิกถอน/หมุนเวียนได้เฉพาะรายการอุปกรณ์ **ของตนเอง** เท่านั้น
- `device.token.rotate` ยังตรวจสอบชุด scope ของ operator ที่ร้องขอเทียบกับ
  scope ปัจจุบันของเซสชันของผู้เรียก ผู้เรียกที่ไม่ใช่ admin ไม่สามารถหมุน token ไปเป็นชุด scope ของ operator ที่กว้างกว่าที่ตนถืออยู่แล้วได้
- ความล้มเหลวในการยืนยันตัวตนจะมี `error.details.code` พร้อม hint สำหรับการกู้คืน:
  - `error.details.canRetryWithDeviceToken` (บูลีน)
  - `error.details.recommendedNextStep` (`retry_with_device_token`, `update_auth_configuration`, `update_auth_credentials`, `wait_then_retry`, `review_auth_configuration`)
- พฤติกรรมของไคลเอนต์สำหรับ `AUTH_TOKEN_MISMATCH`:
  - ไคลเอนต์ที่เชื่อถือได้อาจลอง retry แบบมีขอบเขตหนึ่งครั้งด้วย token ต่ออุปกรณ์ที่แคชไว้
  - หาก retry นั้นยังล้มเหลว ไคลเอนต์ควรหยุดลูป reconnect อัตโนมัติ และแสดงแนวทางให้ผู้ปฏิบัติงานดำเนินการ

## ตัวตนอุปกรณ์ + การจับคู่

- Node ควรใส่ตัวตนอุปกรณ์ที่คงที่ (`device.id`) ซึ่งอนุมานมาจาก fingerprint
  ของ keypair
- Gateway จะออก token แยกตามอุปกรณ์ + role
- อุปกรณ์ที่มี `device.id` ใหม่ต้องได้รับการอนุมัติการจับคู่ เว้นแต่เปิด
  local auto-approval ไว้
- การอนุมัติการจับคู่อัตโนมัติเน้นที่การเชื่อมต่อแบบ local loopback โดยตรง
- OpenClaw ยังมีเส้นทาง self-connect แบบแคบสำหรับ backend/container-local
  สำหรับโฟลว์ helper แบบ shared-secret ที่เชื่อถือได้
- การเชื่อมต่อผ่าน tailnet หรือ LAN บนโฮสต์เดียวกันยังคงถือว่าเป็นแบบระยะไกลสำหรับการจับคู่ และ
  ต้องได้รับการอนุมัติ
- ไคลเอนต์ WS ทุกตัวต้องใส่ตัวตน `device` ระหว่าง `connect` (ทั้ง operator + node)
  Control UI สามารถละไว้ได้เฉพาะในโหมดเหล่านี้:
  - `gateway.controlUi.allowInsecureAuth=true` สำหรับความเข้ากันได้กับ HTTP แบบไม่ปลอดภัยที่ใช้ localhost เท่านั้น
  - การยืนยันตัวตน operator ของ Control UI แบบ `gateway.auth.mode: "trusted-proxy"` ที่สำเร็จ
  - `gateway.controlUi.dangerouslyDisableDeviceAuth=true` (break-glass, ลดระดับความปลอดภัยอย่างรุนแรง)
- ทุกการเชื่อมต่อต้องลงนาม nonce ของ `connect.challenge` ที่เซิร์ฟเวอร์ส่งมา

### การวินิจฉัยระหว่างย้ายระบบ device auth

สำหรับไคลเอนต์แบบเก่าที่ใช้พฤติกรรมการลงนามก่อน challenge อยู่ `connect` ตอนนี้จะส่งกลับ
รหัสรายละเอียด `DEVICE_AUTH_*` ภายใต้ `error.details.code` พร้อม `error.details.reason` ที่คงที่

ความล้มเหลวที่พบบ่อยระหว่างการย้ายระบบ:

| ข้อความ                     | details.code                     | details.reason           | ความหมาย                                           |
| --------------------------- | -------------------------------- | ------------------------ | -------------------------------------------------- |
| `device nonce required`     | `DEVICE_AUTH_NONCE_REQUIRED`     | `device-nonce-missing`   | ไคลเอนต์ไม่ได้ส่ง `device.nonce` (หรือส่งค่าว่าง) |
| `device nonce mismatch`     | `DEVICE_AUTH_NONCE_MISMATCH`     | `device-nonce-mismatch`  | ไคลเอนต์ลงนามด้วย nonce ที่เก่าหรือผิด            |
| `device signature invalid`  | `DEVICE_AUTH_SIGNATURE_INVALID`  | `device-signature`       | payload ของลายเซ็นไม่ตรงกับ payload v2            |
| `device signature expired`  | `DEVICE_AUTH_SIGNATURE_EXPIRED`  | `device-signature-stale` | timestamp ที่ลงนามอยู่นอกช่วง skew ที่ยอมรับได้   |
| `device identity mismatch`  | `DEVICE_AUTH_DEVICE_ID_MISMATCH` | `device-id-mismatch`     | `device.id` ไม่ตรงกับ fingerprint ของ public key   |
| `device public key invalid` | `DEVICE_AUTH_PUBLIC_KEY_INVALID` | `device-public-key`      | รูปแบบ/canonicalization ของ public key ล้มเหลว     |

เป้าหมายของการย้ายระบบ:

- รอ `connect.challenge` ก่อนเสมอ
- ลงนาม payload v2 ที่รวม nonce จากเซิร์ฟเวอร์ด้วย
- ส่ง nonce เดียวกันใน `connect.params.device.nonce`
- payload สำหรับลายเซ็นที่แนะนำคือ `v3` ซึ่งผูก `platform` และ `deviceFamily`
  เพิ่มจากฟิลด์ device/client/role/scopes/token/nonce
- ลายเซ็น `v2` แบบเก่ายังคงยอมรับได้เพื่อความเข้ากันได้ แต่การ pin เมทาดาทาของอุปกรณ์ที่จับคู่แล้ว
  ยังคงควบคุมนโยบายคำสั่งตอน reconnect

## TLS + pinning

- รองรับ TLS สำหรับการเชื่อมต่อ WS
- ไคลเอนต์สามารถ pin fingerprint ของใบรับรอง Gateway ได้แบบไม่บังคับ (ดูคอนฟิก `gateway.tls`
  รวมถึง `gateway.remote.tlsFingerprint` หรือ CLI `--tls-fingerprint`)

## ขอบเขต

โปรโตคอลนี้เปิดเผย **API ของ Gateway แบบเต็มรูปแบบ** (status, channels, models, chat,
agent, sessions, nodes, approvals ฯลฯ) พื้นผิวที่แน่นอนถูกกำหนดโดย
schema TypeBox ใน `src/gateway/protocol/schema.ts`
