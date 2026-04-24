---
read_when:
    - การติดตั้งใช้งานหรืออัปเดตไคลเอนต์ WS ของ gateway
    - การดีบักความไม่ตรงกันของโปรโตคอลหรือความล้มเหลวในการเชื่อมต่อ
    - การสร้างสคีมา/โมเดลของโปรโตคอลใหม่
summary: 'โปรโตคอล Gateway WebSocket: handshake, เฟรม, การกำหนดเวอร์ชัน'
title: โปรโตคอล Gateway
x-i18n:
    generated_at: "2026-04-24T09:12:00Z"
    model: gpt-5.4
    provider: openai
    source_hash: bf6710cb1c620dc03b75421cab7953c412cb85e68c52fa9b504ea89b7302efb8
    source_path: gateway/protocol.md
    workflow: 15
---

# โปรโตคอล Gateway (WebSocket)

โปรโตคอล Gateway WS คือ **control plane เดียว + node transport** สำหรับ
OpenClaw ไคลเอนต์ทั้งหมด (CLI, web UI, แอป macOS, iOS/Android nodes, headless
nodes) เชื่อมต่อผ่าน WebSocket และประกาศ **role** + **scope** ของตนในช่วง
handshake

## การขนส่ง

- WebSocket, text frames พร้อม payload แบบ JSON
- เฟรมแรก **ต้อง**เป็น request แบบ `connect`
- เฟรมก่อนเชื่อมต่อถูกจำกัดไว้ที่ 64 KiB หลัง handshake สำเร็จ ไคลเอนต์
  ควรปฏิบัติตามขีดจำกัด `hello-ok.policy.maxPayload` และ
  `hello-ok.policy.maxBufferedBytes` เมื่อเปิดใช้ diagnostics
  เฟรมขาเข้าที่มีขนาดใหญ่เกินไปและบัฟเฟอร์ขาออกที่ช้าจะส่งเหตุการณ์ `payload.large`
  ก่อนที่ gateway จะปิดหรือทิ้งเฟรมที่ได้รับผลกระทบ เหตุการณ์เหล่านี้เก็บเฉพาะ
  ขนาด ขีดจำกัด พื้นผิว และ reason codes ที่ปลอดภัย ไม่เก็บเนื้อความของข้อความ
  เนื้อหาไฟล์แนบ เนื้อหาดิบของเฟรม tokens cookies หรือค่าความลับ

## Handshake (connect)

Gateway → Client (challenge ก่อนเชื่อมต่อ):

```json
{
  "type": "event",
  "event": "connect.challenge",
  "payload": { "nonce": "…", "ts": 1737264000000 }
}
```

Client → Gateway:

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

Gateway → Client:

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

`server`, `features`, `snapshot` และ `policy` ล้วนจำเป็นตามสคีมา
(`src/gateway/protocol/schema/frames.ts`) `canvasHostUrl` เป็นแบบไม่บังคับ `auth`
จะรายงาน role/scopes ที่ต่อรองได้เมื่อมี และรวม `deviceToken`
เมื่อ gateway ออกให้

เมื่อไม่มีการออก device token `hello-ok.auth` ยังสามารถรายงาน
permissions ที่ต่อรองได้:

```json
{
  "auth": {
    "role": "operator",
    "scopes": ["operator.read", "operator.write"]
  }
}
```

เมื่อมีการออก device token `hello-ok` จะรวมสิ่งนี้ด้วย:

```json
{
  "auth": {
    "deviceToken": "…",
    "role": "operator",
    "scopes": ["operator.read", "operator.write"]
  }
}
```

ระหว่าง trusted bootstrap handoff, `hello-ok.auth` อาจรวมรายการ role เพิ่มเติมที่มีขอบเขตจำกัดใน `deviceTokens` ด้วย:

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

สำหรับโฟลว์ bootstrap node/operator ในตัว token หลักของ node จะยังคงเป็น
`scopes: []` และ operator token ที่ส่งต่อมาจะยังคงถูกจำกัดอยู่ใน bootstrap
operator allowlist (`operator.approvals`, `operator.read`,
`operator.talk.secrets`, `operator.write`) การตรวจสอบ scope ของ bootstrap ยังคง
อิง prefix ของ role: รายการ operator จะตอบสนองได้เฉพาะคำขอของ operator และ roles ที่ไม่ใช่ operator
ยังคงต้องใช้ scopes ภายใต้ prefix ของ role ของตนเอง

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

## การวางกรอบข้อความ

- **Request**: `{type:"req", id, method, params}`
- **Response**: `{type:"res", id, ok, payload|error}`
- **Event**: `{type:"event", event, payload, seq?, stateVersion?}`

methods ที่มี side effects ต้องใช้ **idempotency keys** (ดูสคีมา)

## Roles + scopes

### Roles

- `operator` = ไคลเอนต์ control plane (CLI/UI/automation)
- `node` = โฮสต์ความสามารถ (camera/screen/canvas/system.run)

### Scopes (operator)

scopes ที่พบบ่อย:

- `operator.read`
- `operator.write`
- `operator.admin`
- `operator.approvals`
- `operator.pairing`
- `operator.talk.secrets`

`talk.config` ที่มี `includeSecrets: true` ต้องใช้ `operator.talk.secrets`
(หรือ `operator.admin`)

เมธอด RPC ของ gateway ที่ลงทะเบียนโดย Plugin อาจขอ operator scope ของตัวเองได้ แต่
prefix admin หลักที่สงวนไว้ (`config.*`, `exec.approvals.*`, `wizard.*`,
`update.*`) จะถูก resolve เป็น `operator.admin` เสมอ

scope ของ method เป็นเพียงด่านแรกเท่านั้น slash commands บางรายการที่เข้าถึงผ่าน
`chat.send` จะใช้การตรวจสอบระดับคำสั่งที่เข้มงวดกว่านั้นอีกชั้น ตัวอย่างเช่น การเขียน
`/config set` และ `/config unset` แบบถาวรต้องใช้ `operator.admin`

`node.pair.approve` ยังมีการตรวจสอบ scope เพิ่มเติมในเวลาการอนุมัตินอกเหนือจาก
scope พื้นฐานของ method:

- คำขอที่ไม่มี command: `operator.pairing`
- คำขอที่มี node commands ที่ไม่ใช่ exec: `operator.pairing` + `operator.write`
- คำขอที่มี `system.run`, `system.run.prepare` หรือ `system.which`:
  `operator.pairing` + `operator.admin`

### Caps/commands/permissions (node)

Nodes ประกาศ capability claims ในช่วง connect:

- `caps`: หมวดหมู่ความสามารถระดับสูง
- `commands`: allowlist ของคำสั่งสำหรับ invoke
- `permissions`: toggles แบบละเอียด (เช่น `screen.record`, `camera.capture`)

Gateway ปฏิบัติต่อสิ่งเหล่านี้เป็น **claims** และบังคับใช้ allowlists ฝั่งเซิร์ฟเวอร์

## Presence

- `system-presence` คืนค่ารายการที่ใช้ device identity เป็นคีย์
- รายการ presence มี `deviceId`, `roles` และ `scopes` เพื่อให้ UIs แสดงหนึ่งแถวต่ออุปกรณ์
  ได้แม้ว่าอุปกรณ์นั้นจะเชื่อมต่อทั้งในฐานะ **operator** และ **node**

## การกำหนดขอบเขตของ broadcast event

WebSocket broadcast events ที่เซิร์ฟเวอร์ push ออกไปจะถูกควบคุมด้วย scope เพื่อให้เซสชันที่มีเพียง pairing scope หรือ node-only ไม่ได้รับเนื้อหาเซสชันแบบ passively

- **เฟรม chat, agent และ tool-result** (รวมถึง `agent` events แบบสตรีม และผลลัพธ์ tool call) ต้องมีอย่างน้อย `operator.read` เซสชันที่ไม่มี `operator.read` จะข้ามเฟรมเหล่านี้ทั้งหมด
- **`plugin.*` broadcasts ที่กำหนดโดย Plugin** จะถูกควบคุมไปที่ `operator.write` หรือ `operator.admin` ตามวิธีที่ Plugin ลงทะเบียนไว้
- **เหตุการณ์ด้านสถานะและการขนส่ง** (`heartbeat`, `presence`, `tick`, วงจรชีวิต connect/disconnect ฯลฯ) ยังคงไม่ถูกจำกัด เพื่อให้ทุกเซสชันที่ยืนยันตัวตนแล้วสังเกตสุขภาพของการขนส่งได้
- **ตระกูล broadcast event ที่ไม่รู้จัก** จะถูกควบคุมด้วย scope โดยค่าเริ่มต้น (fail-closed) เว้นแต่ handler ที่ลงทะเบียนไว้จะผ่อนคลายกฎนั้นอย่างชัดเจน

การเชื่อมต่อของไคลเอนต์แต่ละตัวจะเก็บหมายเลขลำดับต่อไคลเอนต์ของตัวเอง ดังนั้น broadcasts จะยังคงลำดับแบบเพิ่มขึ้นบน socket นั้น แม้ไคลเอนต์แต่ละตัวจะเห็นเพียงชุดย่อยของสตรีมเหตุการณ์ที่ผ่านการกรองด้วย scope ต่างกัน

## ตระกูล RPC methods ที่พบบ่อย

พื้นผิว WS สาธารณะกว้างกว่าเพียงตัวอย่าง handshake/auth ด้านบน นี่
ไม่ใช่ generated dump — `hello-ok.features.methods` คือรายการ
discovery แบบ conservative ที่สร้างจาก `src/gateway/server-methods-list.ts` บวกกับ method exports ของ plugin/channel ที่โหลดเข้ามา ให้ถือว่านี่เป็นการค้นพบ feature ไม่ใช่รายการทั้งหมดของ `src/gateway/server-methods/*.ts`

<AccordionGroup>
  <Accordion title="ระบบและตัวตน">
    - `health` คืนค่าสแนปช็อตสุขภาพของ gateway ที่แคชไว้หรือ probe สดแล้ว
    - `diagnostics.stability` คืนค่า diagnostic stability recorder แบบมีขอบเขตล่าสุด โดยเก็บ metadata เชิงปฏิบัติการ เช่น ชื่อเหตุการณ์ จำนวน ขนาดไบต์ ค่าหน่วยความจำ สถานะคิว/เซสชัน ชื่อ channel/plugin และ session ids ไม่เก็บข้อความแชต webhook bodies เอาต์พุตของเครื่องมือ request หรือ response bodies แบบดิบ tokens cookies หรือค่าความลับ ต้องใช้ operator read scope
    - `status` คืนค่าสรุป gateway แบบ `/status`; ฟิลด์ที่ละเอียดอ่อนจะรวมอยู่ด้วยเฉพาะสำหรับ operator clients ที่มี admin scope
    - `gateway.identity.get` คืนค่า device identity ของ gateway ที่ใช้โดย relay และ pairing flows
    - `system-presence` คืนค่า presence snapshot ปัจจุบันสำหรับอุปกรณ์ operator/node ที่เชื่อมต่ออยู่
    - `system-event` ผนวก system event และสามารถอัปเดต/กระจายบริบท presence ได้
    - `last-heartbeat` คืนค่าเหตุการณ์ Heartbeat ล่าสุดที่ถูกเก็บถาวรไว้
    - `set-heartbeats` สลับการประมวลผล Heartbeat บน gateway
  </Accordion>

  <Accordion title="Models และการใช้งาน">
    - `models.list` คืนค่า catalog ของโมเดลที่ runtime อนุญาต
    - `usage.status` คืนค่าสรุปหน้าต่างการใช้งาน/โควต้าคงเหลือตามผู้ให้บริการ
    - `usage.cost` คืนค่าสรุปต้นทุนการใช้งานแบบรวมสำหรับช่วงวันที่
    - `doctor.memory.status` คืนค่าความพร้อมของ vector-memory / embedding สำหรับ workspace ของเอเจนต์เริ่มต้นที่ active อยู่
    - `sessions.usage` คืนค่าสรุปการใช้งานรายเซสชัน
    - `sessions.usage.timeseries` คืนค่า usage timeseries สำหรับหนึ่งเซสชัน
    - `sessions.usage.logs` คืนค่ารายการ usage logs สำหรับหนึ่งเซสชัน
  </Accordion>

  <Accordion title="Channels และตัวช่วยเข้าสู่ระบบ">
    - `channels.status` คืนค่าสรุปสถานะของ built-in + bundled channel/plugin
    - `channels.logout` ออกจากระบบ channel/account ที่ระบุ เมื่อ channel นั้นรองรับการออกจากระบบ
    - `web.login.start` เริ่มโฟลว์เข้าสู่ระบบแบบ QR/web สำหรับผู้ให้บริการ web channel ที่รองรับ QR ในปัจจุบัน
    - `web.login.wait` รอให้โฟลว์เข้าสู่ระบบแบบ QR/web นั้นเสร็จสิ้น และเริ่ม channel เมื่อสำเร็จ
    - `push.test` ส่ง APNs push ทดสอบไปยัง iOS node ที่ลงทะเบียนไว้
    - `voicewake.get` คืนค่า wake-word triggers ที่จัดเก็บไว้
    - `voicewake.set` อัปเดต wake-word triggers และ broadcast การเปลี่ยนแปลง
  </Accordion>

  <Accordion title="การส่งข้อความและล็อก">
    - `send` คือ outbound-delivery RPC โดยตรงสำหรับการส่งที่กำหนดเป้าหมายตาม channel/account/thread นอก chat runner
    - `logs.tail` คืนค่า tail ของ file-log ของ gateway ที่กำหนดค่าไว้ พร้อมตัวควบคุม cursor/limit และ max-byte
  </Accordion>

  <Accordion title="Talk และ TTS">
    - `talk.config` คืนค่า payload คอนฟิก Talk ที่มีผลจริง; `includeSecrets` ต้องใช้ `operator.talk.secrets` (หรือ `operator.admin`)
    - `talk.mode` ตั้งค่า/กระจายสถานะ Talk mode ปัจจุบันสำหรับไคลเอนต์ WebChat/Control UI
    - `talk.speak` สังเคราะห์เสียงผ่านผู้ให้บริการเสียงพูด Talk ที่ active อยู่
    - `tts.status` คืนค่าสถานะเปิดใช้งาน TTS, ผู้ให้บริการที่ active, ผู้ให้บริการ fallback และสถานะคอนฟิกของผู้ให้บริการ
    - `tts.providers` คืนค่าคลังผู้ให้บริการ TTS ที่มองเห็นได้
    - `tts.enable` และ `tts.disable` สลับสถานะ prefs ของ TTS
    - `tts.setProvider` อัปเดตผู้ให้บริการ TTS ที่ต้องการ
    - `tts.convert` รันการแปลงข้อความเป็นเสียงพูดแบบครั้งเดียว
  </Accordion>

  <Accordion title="ความลับ คอนฟิก การอัปเดต และวิซาร์ด">
    - `secrets.reload` จะ resolve SecretRefs ที่ active ใหม่ และสลับสถานะความลับของ runtime เฉพาะเมื่อสำเร็จทั้งหมดเท่านั้น
    - `secrets.resolve` จะ resolve การกำหนดค่าความลับที่เป็นเป้าหมายของคำสั่งสำหรับชุดคำสั่ง/เป้าหมายที่ระบุ
    - `config.get` คืนค่า snapshot และ hash ของคอนฟิกปัจจุบัน
    - `config.set` เขียน payload คอนฟิกที่ผ่านการตรวจสอบแล้ว
    - `config.patch` merge การอัปเดตคอนฟิกบางส่วน
    - `config.apply` ตรวจสอบความถูกต้อง + แทนที่ payload คอนฟิกทั้งหมด
    - `config.schema` คืนค่า payload ของ live config schema ที่ใช้โดย Control UI และเครื่องมือ CLI: schema, `uiHints`, version และ metadata การสร้าง รวมถึง schema metadata ของ plugin + channel เมื่อ runtime สามารถโหลดได้ schema นี้รวม metadata ฟิลด์ `title` / `description` ที่ได้มาจาก labels และข้อความช่วยเหลือเดียวกับที่ UI ใช้ รวมถึง nested object, wildcard, array-item และแขนง composition ของ `anyOf` / `oneOf` / `allOf` เมื่อมีเอกสารของฟิลด์ที่ตรงกัน
    - `config.schema.lookup` คืนค่า payload การค้นหาแบบจำกัดตาม path สำหรับหนึ่ง path ของคอนฟิก: path ที่ normalize แล้ว, shallow schema node, hint + `hintPath` ที่ตรงกัน และสรุปลูกโดยตรงสำหรับการเจาะลึกของ UI/CLI lookup schema nodes จะคง docs สำหรับผู้ใช้และฟิลด์ validation ทั่วไป (`title`, `description`, `type`, `enum`, `const`, `format`, `pattern`, ขอบเขต numeric/string/array/object และ flags เช่น `additionalProperties`, `deprecated`, `readOnly`, `writeOnly`) สรุปลูกจะแสดง `key`, `path` ที่ normalize แล้ว, `type`, `required`, `hasChildren` รวมถึง `hint` / `hintPath` ที่ตรงกัน
    - `update.run` รันโฟลว์การอัปเดต gateway และกำหนดเวลารีสตาร์ตเฉพาะเมื่อการอัปเดตสำเร็จจริง
    - `wizard.start`, `wizard.next`, `wizard.status` และ `wizard.cancel` เปิดเผย onboarding wizard ผ่าน WS RPC
  </Accordion>

  <Accordion title="ตัวช่วยเอเจนต์และ workspace">
    - `agents.list` คืนค่ารายการเอเจนต์ที่กำหนดค่าไว้
    - `agents.create`, `agents.update` และ `agents.delete` จัดการระเบียนเอเจนต์และการเชื่อมต่อ workspace
    - `agents.files.list`, `agents.files.get` และ `agents.files.set` จัดการไฟล์ bootstrap workspace ที่เปิดเผยสำหรับเอเจนต์
    - `agent.identity.get` คืนค่าตัวตนของผู้ช่วยที่มีผลจริงสำหรับเอเจนต์หรือเซสชัน
    - `agent.wait` รอให้การรันเสร็จสิ้นและคืนค่า terminal snapshot เมื่อมีให้ใช้
  </Accordion>

  <Accordion title="การควบคุมเซสชัน">
    - `sessions.list` คืนค่าดัชนีเซสชันปัจจุบัน
    - `sessions.subscribe` และ `sessions.unsubscribe` สลับการสมัครรับเหตุการณ์การเปลี่ยนแปลงเซสชันสำหรับ WS client ปัจจุบัน
    - `sessions.messages.subscribe` และ `sessions.messages.unsubscribe` สลับการสมัครรับเหตุการณ์ transcript/message สำหรับหนึ่งเซสชัน
    - `sessions.preview` คืนค่าตัวอย่าง transcript แบบมีขอบเขตสำหรับ session keys ที่ระบุ
    - `sessions.resolve` resolve หรือทำให้ session target เป็น canonical
    - `sessions.create` สร้างรายการเซสชันใหม่
    - `sessions.send` ส่งข้อความเข้าไปยังเซสชันที่มีอยู่
    - `sessions.steer` คือรูปแบบ interrupt-and-steer สำหรับเซสชันที่ active
    - `sessions.abort` ยกเลิกงานที่ active สำหรับเซสชัน
    - `sessions.patch` อัปเดต metadata/overrides ของเซสชัน
    - `sessions.reset`, `sessions.delete` และ `sessions.compact` ทำการบำรุงรักษาเซสชัน
    - `sessions.get` คืนค่าแถวเซสชันที่จัดเก็บไว้แบบเต็ม
    - การทำงานของแชตยังคงใช้ `chat.history`, `chat.send`, `chat.abort` และ `chat.inject` โดย `chat.history` ถูก normalize เพื่อการแสดงผลสำหรับ UI clients: แท็ก directive แบบ inline จะถูกลบออกจากข้อความที่มองเห็นได้, payload XML ของ tool-call แบบข้อความล้วน (รวมถึง `<tool_call>...</tool_call>`, `<function_call>...</function_call>`, `<tool_calls>...</tool_calls>`, `<function_calls>...</function_calls>` และบล็อก tool-call ที่ถูกตัดทอน) รวมถึง leaked ASCII/full-width model control tokens จะถูกลบออก, แถว assistant ที่เป็น silent-token ล้วน เช่น `NO_REPLY` / `no_reply` แบบตรงตัวจะถูกละไว้, และแถวที่ใหญ่เกินไปอาจถูกแทนที่ด้วย placeholders
  </Accordion>

  <Accordion title="การจับคู่อุปกรณ์และ device tokens">
    - `device.pair.list` คืนค่าอุปกรณ์ที่จับคู่แล้วทั้งแบบ pending และ approved
    - `device.pair.approve`, `device.pair.reject` และ `device.pair.remove` จัดการระเบียนการจับคู่อุปกรณ์
    - `device.token.rotate` หมุนเวียน token ของอุปกรณ์ที่จับคู่ภายในขอบเขต role และ scope ที่อนุมัติแล้ว
    - `device.token.revoke` เพิกถอน token ของอุปกรณ์ที่จับคู่
  </Accordion>

  <Accordion title="การจับคู่ node, invoke และงานที่รอดำเนินการ">
    - `node.pair.request`, `node.pair.list`, `node.pair.approve`, `node.pair.reject` และ `node.pair.verify` ครอบคลุมการจับคู่ node และการตรวจสอบ bootstrap
    - `node.list` และ `node.describe` คืนค่าสถานะของ node ที่รู้จัก/เชื่อมต่ออยู่
    - `node.rename` อัปเดตป้ายกำกับของ node ที่จับคู่แล้ว
    - `node.invoke` ส่งต่อคำสั่งไปยัง node ที่เชื่อมต่ออยู่
    - `node.invoke.result` คืนค่าผลลัพธ์สำหรับคำขอ invoke
    - `node.event` นำเหตุการณ์ที่มาจาก node กลับเข้าสู่ gateway
    - `node.canvas.capability.refresh` รีเฟรช token ความสามารถ canvas แบบจำกัดขอบเขต
    - `node.pending.pull` และ `node.pending.ack` คือ queue APIs สำหรับ node ที่เชื่อมต่ออยู่
    - `node.pending.enqueue` และ `node.pending.drain` จัดการงาน pending แบบ durable สำหรับ nodes ที่ออฟไลน์/ขาดการเชื่อมต่อ
  </Accordion>

  <Accordion title="ตระกูลการอนุมัติ">
    - `exec.approval.request`, `exec.approval.get`, `exec.approval.list` และ `exec.approval.resolve` ครอบคลุมคำขออนุมัติ exec แบบครั้งเดียว รวมถึงการค้นหา/เล่นซ้ำ approval ที่รอดำเนินการ
    - `exec.approval.waitDecision` รอการตัดสินใจของ exec approval ที่รอดำเนินการหนึ่งรายการ และคืนค่าการตัดสินใจสุดท้าย (หรือ `null` เมื่อหมดเวลา)
    - `exec.approvals.get` และ `exec.approvals.set` จัดการ snapshots ของนโยบายการอนุมัติ exec ของ gateway
    - `exec.approvals.node.get` และ `exec.approvals.node.set` จัดการนโยบายการอนุมัติ exec ในเครื่องของ node ผ่านคำสั่ง node relay
    - `plugin.approval.request`, `plugin.approval.list`, `plugin.approval.waitDecision` และ `plugin.approval.resolve` ครอบคลุมโฟลว์การอนุมัติที่กำหนดโดย Plugin
  </Accordion>

  <Accordion title="ระบบอัตโนมัติ Skills และเครื่องมือ">
    - ระบบอัตโนมัติ: `wake` กำหนดเวลา inject ข้อความ wake ทันทีหรือใน Heartbeat ถัดไป; `cron.list`, `cron.status`, `cron.add`, `cron.update`, `cron.remove`, `cron.run`, `cron.runs` จัดการงานตามกำหนดเวลา
    - Skills และเครื่องมือ: `commands.list`, `skills.*`, `tools.catalog`, `tools.effective`
  </Accordion>
</AccordionGroup>

### ตระกูล event ที่พบบ่อย

- `chat`: การอัปเดตแชตของ UI เช่น `chat.inject` และเหตุการณ์แชตอื่น ๆ
  ที่เกี่ยวกับ transcript เท่านั้น
- `session.message` และ `session.tool`: การอัปเดต transcript/event-stream สำหรับ
  เซสชันที่สมัครรับไว้
- `sessions.changed`: ดัชนีเซสชันหรือ metadata เปลี่ยนไป
- `presence`: การอัปเดต system presence snapshot
- `tick`: เหตุการณ์ keepalive / liveness แบบเป็นระยะ
- `health`: การอัปเดต gateway health snapshot
- `heartbeat`: การอัปเดตสตรีมเหตุการณ์ Heartbeat
- `cron`: เหตุการณ์การเปลี่ยนแปลงการรัน/งานของ Cron
- `shutdown`: การแจ้งเตือนการปิดตัวของ gateway
- `node.pair.requested` / `node.pair.resolved`: วงจรชีวิตการจับคู่ node
- `node.invoke.request`: การกระจายคำขอ node invoke
- `device.pair.requested` / `device.pair.resolved`: วงจรชีวิตของอุปกรณ์ที่จับคู่
- `voicewake.changed`: คอนฟิก wake-word trigger เปลี่ยนไป
- `exec.approval.requested` / `exec.approval.resolved`: วงจรชีวิตของการอนุมัติ
  exec
- `plugin.approval.requested` / `plugin.approval.resolved`: วงจรชีวิตของการอนุมัติ
  Plugin

### Node helper methods

- Nodes สามารถเรียก `skills.bins` เพื่อดึงรายการปัจจุบันของ skill executables
  สำหรับการตรวจสอบ auto-allow

### Operator helper methods

- Operators สามารถเรียก `commands.list` (`operator.read`) เพื่อดึง
  inventory ของคำสั่ง runtime สำหรับเอเจนต์
  - `agentId` เป็นแบบไม่บังคับ; ละไว้เพื่ออ่าน workspace ของเอเจนต์เริ่มต้น
  - `scope` ควบคุมว่าพื้นผิวใดที่ `name` หลักอ้างอิง:
    - `text` คืนค่า text command token หลักโดยไม่มี `/` นำหน้า
    - `native` และเส้นทางค่าเริ่มต้น `both` จะคืนชื่อ native แบบรับรู้ผู้ให้บริการ
      เมื่อมีให้ใช้
  - `textAliases` มี slash aliases แบบตรงตัว เช่น `/model` และ `/m`
  - `nativeName` มีชื่อ native แบบรับรู้ผู้ให้บริการเมื่อมีอยู่
  - `provider` เป็นแบบไม่บังคับและมีผลเฉพาะกับการตั้งชื่อ native รวมถึงความพร้อมของ native plugin
    command
  - `includeArgs=false` จะละ metadata ของ arguments ที่ serialize ไว้ออกจากการตอบกลับ
- Operators สามารถเรียก `tools.catalog` (`operator.read`) เพื่อดึง runtime tool catalog สำหรับ
  เอเจนต์ การตอบกลับรวมเครื่องมือที่จัดกลุ่มและ provenance metadata:
  - `source`: `core` หรือ `plugin`
  - `pluginId`: เจ้าของ Plugin เมื่อ `source="plugin"`
  - `optional`: เครื่องมือของ Plugin เป็นแบบไม่บังคับหรือไม่
- Operators สามารถเรียก `tools.effective` (`operator.read`) เพื่อดึง runtime-effective tool
  inventory สำหรับเซสชัน
  - `sessionKey` จำเป็น
  - gateway จะอนุมาน trusted runtime context จากเซสชันฝั่งเซิร์ฟเวอร์แทนการยอมรับ
    auth หรือ delivery context ที่ผู้เรียกส่งมาเอง
  - การตอบกลับมีขอบเขตตามเซสชันและสะท้อนสิ่งที่บทสนทนาที่ active สามารถใช้ได้ในตอนนี้
    รวมถึงเครื่องมือ core, plugin และ channel
- Operators สามารถเรียก `skills.status` (`operator.read`) เพื่อดึง
  skill inventory ที่มองเห็นได้สำหรับเอเจนต์
  - `agentId` เป็นแบบไม่บังคับ; ละไว้เพื่ออ่าน workspace ของเอเจนต์เริ่มต้น
  - การตอบกลับรวมความสามารถในการใช้งาน ข้อกำหนดที่ขาด การตรวจสอบคอนฟิก และ
    ตัวเลือกการติดตั้งที่ผ่านการทำให้ปลอดภัยแล้ว โดยไม่เปิดเผยค่าความลับดิบ
- Operators สามารถเรียก `skills.search` และ `skills.detail` (`operator.read`) สำหรับ
  metadata การค้นพบของ ClawHub
- Operators สามารถเรียก `skills.install` (`operator.admin`) ได้สองโหมด:
  - โหมด ClawHub: `{ source: "clawhub", slug, version?, force? }` ติดตั้ง
    โฟลเดอร์ skill ลงในไดเรกทอรี `skills/` ของ default agent workspace
  - โหมด Gateway installer: `{ name, installId, dangerouslyForceUnsafeInstall?, timeoutMs? }`
    รัน action `metadata.openclaw.install` ที่ประกาศไว้บนโฮสต์ gateway
- Operators สามารถเรียก `skills.update` (`operator.admin`) ได้สองโหมด:
  - โหมด ClawHub จะอัปเดต slug ที่ติดตามหนึ่งรายการหรือการติดตั้ง ClawHub ที่ติดตามทั้งหมดใน
    default agent workspace
  - โหมด Config จะ patch ค่า `skills.entries.<skillKey>` เช่น `enabled`,
    `apiKey` และ `env`

## การอนุมัติ Exec

- เมื่อคำขอ exec ต้องการการอนุมัติ gateway จะ broadcast `exec.approval.requested`
- Operator clients จะ resolve โดยเรียก `exec.approval.resolve` (ต้องใช้ `operator.approvals` scope)
- สำหรับ `host=node`, `exec.approval.request` ต้องมี `systemRunPlan` (canonical `argv`/`cwd`/`rawCommand`/session metadata) คำขอที่ไม่มี `systemRunPlan` จะถูกปฏิเสธ
- หลังจากได้รับอนุมัติ การเรียก `node.invoke system.run` ที่ถูกส่งต่อจะนำ
  `systemRunPlan` แบบ canonical นั้นกลับมาใช้เป็นบริบทคำสั่ง/cwd/เซสชันที่เชื่อถือได้
- หากผู้เรียกเปลี่ยน `command`, `rawCommand`, `cwd`, `agentId` หรือ
  `sessionKey` ระหว่าง prepare กับการส่งต่อ `system.run` ที่ได้รับอนุมัติขั้นสุดท้าย
  gateway จะปฏิเสธการรัน แทนที่จะเชื่อถือ payload ที่ถูกแก้ไข

## Agent delivery fallback

- คำขอ `agent` สามารถรวม `deliver=true` เพื่อร้องขอการส่งมอบขาออกได้
- `bestEffortDeliver=false` จะคงพฤติกรรมแบบเข้มงวด: เป้าหมายการส่งมอบที่ไม่สามารถ resolve ได้หรือเป็นแบบ internal-only จะคืนค่า `INVALID_REQUEST`
- `bestEffortDeliver=true` อนุญาตให้ fallback ไปยังการรันเฉพาะเซสชันเมื่อไม่สามารถ resolve เส้นทางภายนอกที่ส่งมอบได้ (เช่น เซสชัน internal/webchat หรือคอนฟิกหลายช่องทางที่กำกวม)

## การกำหนดเวอร์ชัน

- `PROTOCOL_VERSION` อยู่ใน `src/gateway/protocol/schema/protocol-schemas.ts`
- Clients จะส่ง `minProtocol` + `maxProtocol`; เซิร์ฟเวอร์จะปฏิเสธหากไม่ตรงกัน
- สคีมา + โมเดลถูกสร้างจากนิยาม TypeBox:
  - `pnpm protocol:gen`
  - `pnpm protocol:gen:swift`
  - `pnpm protocol:check`

### ค่าคงที่ของไคลเอนต์

reference client ใน `src/gateway/client.ts` ใช้ค่าเริ่มต้นเหล่านี้ ค่าเหล่านี้
คงที่ตลอด protocol v3 และเป็น baseline ที่คาดหวังสำหรับไคลเอนต์ภายนอก

| ค่าคงที่                                  | ค่าเริ่มต้น                                           | แหล่งที่มา                                                 |
| ----------------------------------------- | ----------------------------------------------------- | ---------------------------------------------------------- |
| `PROTOCOL_VERSION`                        | `3`                                                   | `src/gateway/protocol/schema/protocol-schemas.ts`          |
| Request timeout (ต่อ RPC)                 | `30_000` ms                                           | `src/gateway/client.ts` (`requestTimeoutMs`)               |
| Preauth / connect-challenge timeout       | `10_000` ms                                           | `src/gateway/handshake-timeouts.ts` (clamp `250`–`10_000`) |
| Initial reconnect backoff                 | `1_000` ms                                            | `src/gateway/client.ts` (`backoffMs`)                      |
| Max reconnect backoff                     | `30_000` ms                                           | `src/gateway/client.ts` (`scheduleReconnect`)              |
| Fast-retry clamp after device-token close | `250` ms                                              | `src/gateway/client.ts`                                    |
| Force-stop grace before `terminate()`     | `250` ms                                              | `FORCE_STOP_TERMINATE_GRACE_MS`                            |
| `stopAndWait()` default timeout           | `1_000` ms                                            | `STOP_AND_WAIT_TIMEOUT_MS`                                 |
| Default tick interval (ก่อน `hello-ok`)   | `30_000` ms                                           | `src/gateway/client.ts`                                    |
| Tick-timeout close                        | code `4000` เมื่อเงียบเกิน `tickIntervalMs * 2`       | `src/gateway/client.ts`                                    |
| `MAX_PAYLOAD_BYTES`                       | `25 * 1024 * 1024` (25 MB)                            | `src/gateway/server-constants.ts`                          |

เซิร์ฟเวอร์จะโฆษณา `policy.tickIntervalMs`, `policy.maxPayload`
และ `policy.maxBufferedBytes` ที่มีผลจริงใน `hello-ok`; ไคลเอนต์ควรยึดค่าดังกล่าว
แทนค่าเริ่มต้นก่อน handshake

## Auth

- การยืนยันตัวตนของ gateway แบบ shared-secret ใช้ `connect.params.auth.token` หรือ
  `connect.params.auth.password` ขึ้นอยู่กับโหมด auth ที่กำหนดไว้
- โหมดที่มีตัวตนกำกับ เช่น Tailscale Serve
  (`gateway.auth.allowTailscale: true`) หรือ
  `gateway.auth.mode: "trusted-proxy"` ที่ไม่ใช่ loopback จะผ่านการตรวจสอบ auth ตอน connect จาก
  request headers แทน `connect.params.auth.*`
- `gateway.auth.mode: "none"` สำหรับ private-ingress จะข้าม shared-secret connect auth
  ทั้งหมด; อย่าเปิดเผยโหมดนี้บน ingress สาธารณะ/ที่ไม่น่าเชื่อถือ
- หลังการจับคู่ Gateway จะออก **device token** ที่มีขอบเขตตาม
  role + scopes ของการเชื่อมต่อ โดยจะถูกส่งกลับใน `hello-ok.auth.deviceToken` และไคลเอนต์
  ควรเก็บถาวรไว้สำหรับการเชื่อมต่อครั้งต่อไป
- ไคลเอนต์ควรเก็บ `hello-ok.auth.deviceToken` หลักไว้หลังจาก
  connect สำเร็จทุกครั้ง
- การเชื่อมต่อใหม่ด้วย device token ที่**เก็บไว้**นั้น ควรนำชุด scope ที่ได้รับอนุมัติและเก็บไว้
  สำหรับ token นั้นกลับมาใช้ด้วย วิธีนี้จะคงการเข้าถึงแบบ read/probe/status
  ที่เคยได้รับอนุมัติไว้แล้ว และหลีกเลี่ยงการยุบการเชื่อมต่อใหม่แบบเงียบ ๆ ลงไปเป็น
  scope แบบ implicit admin-only ที่แคบกว่า
- การประกอบ connect auth ฝั่งไคลเอนต์ (`selectConnectAuth` ใน
  `src/gateway/client.ts`):
  - `auth.password` เป็นอิสระจากกันและจะถูกส่งต่อเสมอเมื่อมีการตั้งค่า
  - `auth.token` จะถูกเติมตามลำดับความสำคัญ: explicit shared token ก่อน
    จากนั้น explicit `deviceToken` จากนั้น per-device token ที่เก็บไว้ (คีย์ตาม
    `deviceId` + `role`)
  - `auth.bootstrapToken` จะถูกส่งเฉพาะเมื่อไม่มีรายการด้านบนใด resolve เป็น
    `auth.token` shared token หรือ device token ที่ resolve ได้ใด ๆ จะกดการส่งมัน
  - การเลื่อนระดับอัตโนมัติของ stored device token ในการ retry แบบ one-shot
    `AUTH_TOKEN_MISMATCH` จะถูกจำกัดไว้เฉพาะ **trusted endpoints เท่านั้น** —
    loopback หรือ `wss://` ที่มี `tlsFingerprint` ปักหมุดไว้ `wss://` สาธารณะ
    ที่ไม่มีการ pin จะไม่เข้าเกณฑ์
- รายการ `hello-ok.auth.deviceTokens` เพิ่มเติมคือ bootstrap handoff tokens
  ให้เก็บไว้ก็ต่อเมื่อการ connect ใช้ bootstrap auth บน transport ที่เชื่อถือได้
  เช่น `wss://` หรือ loopback/local pairing
- หากไคลเอนต์ส่ง **`deviceToken` แบบ explicit** หรือ `scopes` แบบ explicit
  ชุด scope ที่ผู้เรียกขอนั้นจะยังคงเป็นค่าที่ authoritative; cached scopes จะถูก
  นำกลับมาใช้ใหม่เฉพาะเมื่อไคลเอนต์กำลังใช้ stored per-device token ซ้ำ
- Device tokens สามารถหมุนเวียน/เพิกถอนได้ผ่าน `device.token.rotate` และ
  `device.token.revoke` (ต้องใช้ `operator.pairing` scope)
- การออก/หมุนเวียน token จะยังคงถูกจำกัดอยู่ในชุด role ที่ได้รับอนุมัติซึ่งบันทึกไว้ใน
  รายการการจับคู่ของอุปกรณ์นั้น; การหมุนเวียน token ไม่สามารถขยายอุปกรณ์ให้ไปอยู่ใน
  role ที่การอนุมัติการจับคู่ไม่เคยให้ไว้
- สำหรับ paired-device token sessions การจัดการอุปกรณ์จะมีขอบเขตที่ตัวเอง เว้นแต่
  ผู้เรียกจะมี `operator.admin` ด้วย: ผู้เรียกที่ไม่ใช่แอดมินสามารถ remove/revoke/rotate
  ได้เฉพาะรายการอุปกรณ์ของ**ตัวเอง**
- `device.token.rotate` ยังตรวจสอบชุด operator scope ที่ร้องขอเทียบกับ
  session scopes ปัจจุบันของผู้เรียกด้วย ผู้เรียกที่ไม่ใช่แอดมินไม่สามารถหมุน token ให้มี
  operator scope กว้างกว่าที่ตนถืออยู่แล้วได้
- ความล้มเหลวด้าน auth จะรวม `error.details.code` พร้อม recovery hints:
  - `error.details.canRetryWithDeviceToken` (boolean)
  - `error.details.recommendedNextStep` (`retry_with_device_token`, `update_auth_configuration`, `update_auth_credentials`, `wait_then_retry`, `review_auth_configuration`)
- พฤติกรรมของไคลเอนต์สำหรับ `AUTH_TOKEN_MISMATCH`:
  - ไคลเอนต์ที่เชื่อถือได้อาจลอง retry แบบมีขอบเขตหนึ่งครั้งด้วย cached per-device token
  - หาก retry นั้นล้มเหลว ไคลเอนต์ควรหยุด automatic reconnect loops และแสดงคำแนะนำให้ผู้ปฏิบัติงานดำเนินการ

## ตัวตนอุปกรณ์ + การจับคู่

- Nodes ควรรวมตัวตนอุปกรณ์ที่คงที่ (`device.id`) ซึ่งได้มาจาก
  fingerprint ของ keypair
- Gateways ออก tokens แยกตามอุปกรณ์ + role
- ต้องมีการอนุมัติการจับคู่สำหรับ device IDs ใหม่ เว้นแต่จะเปิด local auto-approval
- การอนุมัติการจับคู่อัตโนมัติเน้นที่การเชื่อมต่อ loopback ภายในเครื่องโดยตรง
- OpenClaw ยังมีเส้นทาง self-connect แบบแคบสำหรับ backend/container-local สำหรับ
  trusted shared-secret helper flows
- การเชื่อมต่อ tailnet หรือ LAN บนโฮสต์เดียวกันยังคงถือว่าเป็นแบบระยะไกลสำหรับ pairing และ
  ต้องได้รับการอนุมัติ
- WS clients ทั้งหมดต้องรวมตัวตน `device` ระหว่าง `connect` (ทั้ง operator + node)
  Control UI สามารถละเว้นได้เฉพาะในโหมดเหล่านี้:
  - `gateway.controlUi.allowInsecureAuth=true` สำหรับความเข้ากันได้กับ insecure HTTP แบบ localhost-only
  - การยืนยันตัวตน operator Control UI สำเร็จด้วย `gateway.auth.mode: "trusted-proxy"`
  - `gateway.controlUi.dangerouslyDisableDeviceAuth=true` (break-glass, ลดระดับความปลอดภัยอย่างรุนแรง)
- ทุกการเชื่อมต่อต้องเซ็น nonce ของ `connect.challenge` ที่เซิร์ฟเวอร์ให้มา

### การวินิจฉัยการย้ายระบบของ device auth

สำหรับไคลเอนต์แบบ legacy ที่ยังคงใช้พฤติกรรมการเซ็นก่อน challenge ตอนนี้ `connect` จะคืน
รหัสรายละเอียด `DEVICE_AUTH_*` ภายใต้ `error.details.code` พร้อม `error.details.reason` ที่คงที่

ความล้มเหลวในการย้ายระบบที่พบบ่อย:

| ข้อความ                     | details.code                     | details.reason           | ความหมาย                                           |
| --------------------------- | -------------------------------- | ------------------------ | -------------------------------------------------- |
| `device nonce required`     | `DEVICE_AUTH_NONCE_REQUIRED`     | `device-nonce-missing`   | ไคลเอนต์ละ `device.nonce` (หรือส่งค่าว่าง)        |
| `device nonce mismatch`     | `DEVICE_AUTH_NONCE_MISMATCH`     | `device-nonce-mismatch`  | ไคลเอนต์เซ็นด้วย nonce เก่า/ผิด                   |
| `device signature invalid`  | `DEVICE_AUTH_SIGNATURE_INVALID`  | `device-signature`       | payload ของลายเซ็นไม่ตรงกับ payload แบบ v2        |
| `device signature expired`  | `DEVICE_AUTH_SIGNATURE_EXPIRED`  | `device-signature-stale` | timestamp ที่เซ็นอยู่นอก allowed skew             |
| `device identity mismatch`  | `DEVICE_AUTH_DEVICE_ID_MISMATCH` | `device-id-mismatch`     | `device.id` ไม่ตรงกับ fingerprint ของ public key   |
| `device public key invalid` | `DEVICE_AUTH_PUBLIC_KEY_INVALID` | `device-public-key`      | รูปแบบ/การทำ canonicalization ของ public key ล้มเหลว |

เป้าหมายของการย้ายระบบ:

- รอ `connect.challenge` เสมอ
- เซ็น payload แบบ v2 ที่รวม server nonce
- ส่ง nonce เดียวกันใน `connect.params.device.nonce`
- payload สำหรับลายเซ็นที่แนะนำคือ `v3` ซึ่ง bind `platform` และ `deviceFamily`
  เพิ่มเติมจากฟิลด์ device/client/role/scopes/token/nonce
- ลายเซ็น `v2` แบบ legacy ยังยอมรับได้เพื่อความเข้ากันได้ แต่การ pin paired-device
  metadata ยังคงควบคุมนโยบายคำสั่งตอน reconnect

## TLS + การปักหมุด

- รองรับ TLS สำหรับการเชื่อมต่อ WS
- ไคลเอนต์สามารถเลือกปักหมุด fingerprint ของใบรับรอง gateway ได้ (ดูคอนฟิก `gateway.tls`
  บวกกับ `gateway.remote.tlsFingerprint` หรือ CLI `--tls-fingerprint`)

## ขอบเขต

โปรโตคอลนี้เปิดเผย **API ของ gateway แบบเต็ม** (status, channels, models, chat,
agent, sessions, nodes, approvals ฯลฯ) พื้นผิวที่แน่นอนถูกกำหนดโดยสคีมาของ TypeBox ใน `src/gateway/protocol/schema.ts`

## ที่เกี่ยวข้อง

- [Bridge protocol](/th/gateway/bridge-protocol)
- [คู่มือปฏิบัติการ Gateway](/th/gateway)
