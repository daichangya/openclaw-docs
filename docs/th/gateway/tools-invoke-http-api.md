---
read_when:
    - การเรียกใช้เครื่องมือโดยไม่ต้องรันเทิร์นเอเจนต์เต็มรูปแบบ
    - การสร้างงานอัตโนมัติที่ต้องการการบังคับใช้นโยบายเครื่องมือ
summary: เรียกใช้เครื่องมือเดี่ยวโดยตรงผ่าน endpoint HTTP ของ Gateway
title: API เรียกใช้เครื่องมือ
x-i18n:
    generated_at: "2026-04-23T05:36:00Z"
    model: gpt-5.4
    provider: openai
    source_hash: e924f257ba50b25dea0ec4c3f9eed4c8cac8a53ddef18215f87ac7de330a37fd
    source_path: gateway/tools-invoke-http-api.md
    workflow: 15
---

# Tools Invoke (HTTP)

Gateway ของ OpenClaw เปิดเผย endpoint HTTP แบบเรียบง่ายสำหรับเรียกใช้เครื่องมือเดี่ยวโดยตรง เปิดใช้งานอยู่เสมอและใช้ Gateway auth ร่วมกับนโยบายเครื่องมือ เช่นเดียวกับพื้นผิว `/v1/*` แบบ OpenAI-compatible การยืนยันตัวตนด้วย bearer แบบ shared-secret จะถูกมองว่าเป็นการเข้าถึงระดับผู้ปฏิบัติการที่เชื่อถือได้สำหรับทั้ง gateway

- `POST /tools/invoke`
- พอร์ตเดียวกับ Gateway (WS + HTTP multiplex): `http://<gateway-host>:<port>/tools/invoke`

ขนาด payload สูงสุดตามค่าเริ่มต้นคือ 2 MB

## การยืนยันตัวตน

ใช้การกำหนดค่า auth ของ Gateway

เส้นทาง auth HTTP ที่พบบ่อย:

- auth แบบ shared-secret (`gateway.auth.mode="token"` หรือ `"password"`):
  `Authorization: Bearer <token-or-password>`
- auth HTTP แบบมีตัวตนที่เชื่อถือได้ (`gateway.auth.mode="trusted-proxy"`):
  route ผ่าน proxy ที่รับรู้ตัวตนซึ่งกำหนดค่าไว้ และให้มัน inject
  identity headers ที่จำเป็น
- auth แบบเปิดบน private-ingress (`gateway.auth.mode="none"`):
  ไม่ต้องใช้ auth header

หมายเหตุ:

- เมื่อ `gateway.auth.mode="token"` ให้ใช้ `gateway.auth.token` (หรือ `OPENCLAW_GATEWAY_TOKEN`)
- เมื่อ `gateway.auth.mode="password"` ให้ใช้ `gateway.auth.password` (หรือ `OPENCLAW_GATEWAY_PASSWORD`)
- เมื่อ `gateway.auth.mode="trusted-proxy"` คำขอ HTTP ต้องมาจาก
  แหล่ง trusted proxy ที่เป็น non-loopback ซึ่งกำหนดค่าไว้; proxy แบบ loopback บนโฮสต์เดียวกัน
  จะไม่ผ่านเงื่อนไขของโหมดนี้
- หากกำหนด `gateway.auth.rateLimit` ไว้และเกิดความล้มเหลวของ auth มากเกินไป endpoint จะคืน `429` พร้อม `Retry-After`

## ขอบเขตความปลอดภัย (สำคัญ)

ให้ถือว่า endpoint นี้เป็นพื้นผิวการเข้าถึงแบบ **ระดับผู้ปฏิบัติการเต็มรูปแบบ** สำหรับอินสแตนซ์ gateway นี้

- bearer auth บน HTTP ที่นี่ไม่ใช่โมเดลขอบเขตแบบแคบต่อผู้ใช้
- Gateway token/password ที่ใช้ได้กับ endpoint นี้ ควรถูกถือว่าเป็นข้อมูลรับรองระดับเจ้าของ/ผู้ปฏิบัติการ
- สำหรับโหมด auth แบบ shared-secret (`token` และ `password`) endpoint จะคืนค่าค่าเริ่มต้นแบบผู้ปฏิบัติการเต็มรูปแบบตามปกติ แม้ว่าผู้เรียกจะส่ง header `x-openclaw-scopes` ที่แคบกว่ามาก็ตาม
- auth แบบ shared-secret ยังถือว่าการเรียกใช้เครื่องมือโดยตรงบน endpoint นี้เป็นเทิร์นแบบ owner-sender
- โหมด HTTP แบบมีตัวตนที่เชื่อถือได้ (เช่น trusted proxy auth หรือ `gateway.auth.mode="none"` บน private ingress) จะเคารพ `x-openclaw-scopes` เมื่อมี header นี้ และหากไม่มีจะ fallback ไปยังชุดขอบเขตผู้ปฏิบัติการค่าเริ่มต้นตามปกติ
- เก็บ endpoint นี้ไว้เฉพาะบน loopback/tailnet/private ingress เท่านั้น; อย่าเปิดเผยโดยตรงสู่สาธารณะบนอินเทอร์เน็ต

เมทริกซ์ของ auth:

- `gateway.auth.mode="token"` หรือ `"password"` + `Authorization: Bearer ...`
  - พิสูจน์การครอบครอง shared gateway operator secret
  - ไม่สนใจ `x-openclaw-scopes` ที่แคบกว่า
  - คืนค่าชุดขอบเขตผู้ปฏิบัติการเต็มรูปแบบตามค่าเริ่มต้น:
    `operator.admin`, `operator.approvals`, `operator.pairing`,
    `operator.read`, `operator.talk.secrets`, `operator.write`
  - ถือว่าการเรียกใช้เครื่องมือโดยตรงบน endpoint นี้เป็นเทิร์นแบบ owner-sender
- โหมด HTTP แบบมีตัวตนที่เชื่อถือได้ (เช่น trusted proxy auth หรือ `gateway.auth.mode="none"` บน private ingress)
  - ยืนยันตัวตนภายนอกที่เชื่อถือได้ หรือขอบเขตการติดตั้งที่เชื่อถือได้บางอย่าง
  - เคารพ `x-openclaw-scopes` เมื่อมี header นี้
  - fallback ไปยังชุดขอบเขตผู้ปฏิบัติการค่าเริ่มต้นตามปกติเมื่อไม่มี header
  - จะสูญเสีย semantics แบบ owner เฉพาะเมื่อผู้เรียกทำให้ scopes แคบลงอย่างชัดเจนและละ `operator.admin`

## เนื้อหาคำขอ

```json
{
  "tool": "sessions_list",
  "action": "json",
  "args": {},
  "sessionKey": "main",
  "dryRun": false
}
```

ฟิลด์:

- `tool` (string, จำเป็น): ชื่อเครื่องมือที่จะเรียกใช้
- `action` (string, ไม่บังคับ): จะถูกแมปเข้า args หาก schema ของเครื่องมือรองรับ `action` และ payload ของ args ไม่ได้ระบุไว้
- `args` (object, ไม่บังคับ): อาร์กิวเมนต์เฉพาะของเครื่องมือ
- `sessionKey` (string, ไม่บังคับ): session key เป้าหมาย หากละไว้หรือเป็น `"main"` Gateway จะใช้ main session key ที่กำหนดค่าไว้ (เคารพ `session.mainKey` และเอเจนต์ค่าเริ่มต้น หรือใช้ `global` ในขอบเขต global)
- `dryRun` (boolean, ไม่บังคับ): สงวนไว้สำหรับการใช้งานในอนาคต; ปัจจุบันยังถูกละเลย

## พฤติกรรมของนโยบาย + การจัดเส้นทาง

ความพร้อมใช้งานของเครื่องมือจะถูกกรองผ่าน chain ของนโยบายเดียวกันกับที่ Gateway agents ใช้:

- `tools.profile` / `tools.byProvider.profile`
- `tools.allow` / `tools.byProvider.allow`
- `agents.<id>.tools.allow` / `agents.<id>.tools.byProvider.allow`
- นโยบายของกลุ่ม (หาก session key แมปไปยังกลุ่มหรือ channel)
- นโยบายของ subagent (เมื่อเรียกใช้ด้วย session key ของ subagent)

หากเครื่องมือไม่ได้รับอนุญาตตามนโยบาย endpoint จะคืน **404**

หมายเหตุสำคัญเกี่ยวกับขอบเขต:

- Exec approvals เป็นราวกันตกสำหรับผู้ปฏิบัติการ ไม่ใช่ขอบเขตการอนุญาตแยกต่างหากสำหรับ endpoint HTTP นี้ หากเครื่องมือเข้าถึงได้ที่นี่ผ่าน Gateway auth + นโยบายเครื่องมือ `/tools/invoke` จะไม่เพิ่มพรอมป์ต์ขออนุมัติแยกในแต่ละครั้ง
- อย่าแชร์ข้อมูลรับรอง bearer ของ Gateway ให้ผู้เรียกที่ไม่เชื่อถือได้ หากคุณต้องการการแยกข้ามขอบเขตความเชื่อถือ ให้รัน gateway แยกกัน (และควรแยก OS users/hosts ด้วย)

Gateway HTTP ยังใช้นโยบายปฏิเสธแบบ hard deny list เป็นค่าเริ่มต้นด้วย (แม้นโยบายของ session จะอนุญาตเครื่องมือนั้น):

- `exec` — การรันคำสั่งโดยตรง (พื้นผิว RCE)
- `spawn` — การสร้าง child process แบบอิสระ (พื้นผิว RCE)
- `shell` — การรันคำสั่ง shell (พื้นผิว RCE)
- `fs_write` — การแก้ไขไฟล์บนโฮสต์แบบอิสระ
- `fs_delete` — การลบไฟล์บนโฮสต์แบบอิสระ
- `fs_move` — การย้าย/เปลี่ยนชื่อไฟล์บนโฮสต์แบบอิสระ
- `apply_patch` — การใช้แพตช์สามารถเขียนทับไฟล์ใดก็ได้
- `sessions_spawn` — ระบบจัดการเซสชัน; การ spawn agents จากระยะไกลเป็น RCE
- `sessions_send` — การ inject ข้อความข้ามเซสชัน
- `cron` — control plane ของระบบอัตโนมัติแบบคงอยู่
- `gateway` — control plane ของ gateway; ป้องกันการกำหนดค่าใหม่ผ่าน HTTP
- `nodes` — node command relay สามารถเข้าถึง system.run บนโฮสต์ที่จับคู่ไว้
- `whatsapp_login` — การตั้งค่าแบบโต้ตอบที่ต้องสแกน QR ใน terminal; จะค้างบน HTTP

คุณสามารถปรับแต่ง deny list นี้ได้ผ่าน `gateway.tools`:

```json5
{
  gateway: {
    tools: {
      // เครื่องมือเพิ่มเติมที่จะบล็อกผ่าน HTTP /tools/invoke
      deny: ["browser"],
      // เอาเครื่องมือออกจาก default deny list
      allow: ["gateway"],
    },
  },
}
```

เพื่อช่วยให้นโยบายของกลุ่มสามารถ resolve บริบทได้ คุณสามารถตั้งค่าเพิ่มได้แบบเลือกได้:

- `x-openclaw-message-channel: <channel>` (ตัวอย่าง: `slack`, `telegram`)
- `x-openclaw-account-id: <accountId>` (เมื่อมีหลายบัญชี)

## การตอบกลับ

- `200` → `{ ok: true, result }`
- `400` → `{ ok: false, error: { type, message } }` (คำขอไม่ถูกต้องหรือข้อผิดพลาดจากอินพุตของเครื่องมือ)
- `401` → ไม่ได้รับอนุญาต
- `429` → auth ถูกจำกัดอัตรา (`Retry-After` ถูกตั้งไว้)
- `404` → เครื่องมือไม่พร้อมใช้งาน (ไม่พบหรือไม่ได้อยู่ใน allowlist)
- `405` → method ไม่ได้รับอนุญาต
- `500` → `{ ok: false, error: { type, message } }` (ข้อผิดพลาดที่ไม่คาดคิดระหว่างการรันเครื่องมือ; ข้อความถูกทำให้ปลอดภัยแล้ว)

## ตัวอย่าง

```bash
curl -sS http://127.0.0.1:18789/tools/invoke \
  -H 'Authorization: Bearer secret' \
  -H 'Content-Type: application/json' \
  -d '{
    "tool": "sessions_list",
    "action": "json",
    "args": {}
  }'
```
