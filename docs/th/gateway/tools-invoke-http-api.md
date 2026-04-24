---
read_when:
    - การเรียกใช้เครื่องมือโดยไม่รัน agent turn แบบเต็ม
    - การสร้างระบบอัตโนมัติที่ต้องบังคับใช้นโยบายเครื่องมือ
summary: เรียกใช้เครื่องมือเดียวโดยตรงผ่าน Gateway HTTP endpoint
title: API เรียกใช้เครื่องมือ
x-i18n:
    generated_at: "2026-04-24T09:13:06Z"
    model: gpt-5.4
    provider: openai
    source_hash: edae245ca8b3eb2f4bd62fb9001ddfcb3086bec40ab976b5389b291023f6205e
    source_path: gateway/tools-invoke-http-api.md
    workflow: 15
---

# Tools Invoke (HTTP)

Gateway ของ OpenClaw เปิดเผย HTTP endpoint แบบง่ายสำหรับการเรียกใช้เครื่องมือเดียวโดยตรง โดยจะเปิดใช้งานเสมอ และใช้การยืนยันตัวตนของ Gateway ร่วมกับนโยบายเครื่องมือ เช่นเดียวกับพื้นผิว `/v1/*` ที่เข้ากันได้กับ OpenAI การยืนยันตัวตนแบบ bearer ที่ใช้ shared secret จะถือว่าเป็นการเข้าถึงแบบผู้ปฏิบัติการที่เชื่อถือได้สำหรับทั้ง Gateway

- `POST /tools/invoke`
- พอร์ตเดียวกับ Gateway (WS + HTTP multiplex): `http://<gateway-host>:<port>/tools/invoke`

ขนาด payload สูงสุดเริ่มต้นคือ 2 MB

## การยืนยันตัวตน

ใช้การกำหนดค่า auth ของ Gateway

เส้นทาง auth ของ HTTP ที่พบบ่อย:

- shared-secret auth (`gateway.auth.mode="token"` หรือ `"password"`):
  `Authorization: Bearer <token-or-password>`
- trusted identity-bearing HTTP auth (`gateway.auth.mode="trusted-proxy"`):
  กำหนดเส้นทางผ่าน proxy ที่รับรู้ตัวตนซึ่งกำหนดค่าไว้ และให้มันฉีด
  header ตัวตนที่จำเป็น
- private-ingress open auth (`gateway.auth.mode="none"`):
  ไม่ต้องใช้ auth header

หมายเหตุ:

- เมื่อ `gateway.auth.mode="token"` ให้ใช้ `gateway.auth.token` (หรือ `OPENCLAW_GATEWAY_TOKEN`)
- เมื่อ `gateway.auth.mode="password"` ให้ใช้ `gateway.auth.password` (หรือ `OPENCLAW_GATEWAY_PASSWORD`)
- เมื่อ `gateway.auth.mode="trusted-proxy"` คำขอ HTTP ต้องมาจาก
  แหล่ง trusted proxy แบบ non-loopback ที่กำหนดค่าไว้; proxy แบบ loopback
  บนโฮสต์เดียวกันไม่ผ่านโหมดนี้
- หากมีการกำหนด `gateway.auth.rateLimit` และเกิดความล้มเหลวของ auth มากเกินไป endpoint จะคืนค่า `429` พร้อม `Retry-After`

## ขอบเขตด้านความปลอดภัย (สำคัญ)

ให้ถือว่า endpoint นี้เป็นพื้นผิว **การเข้าถึงระดับผู้ปฏิบัติการเต็มรูปแบบ** สำหรับอินสแตนซ์ Gateway

- bearer auth ของ HTTP ที่นี่ไม่ใช่โมเดลขอบเขตแคบแบบต่อผู้ใช้
- token/password ของ Gateway ที่ถูกต้องสำหรับ endpoint นี้ควรถูกมองว่าเป็นข้อมูลรับรองของเจ้าของ/ผู้ปฏิบัติการ
- สำหรับโหมด auth แบบ shared-secret (`token` และ `password`) endpoint จะคืนค่าค่าเริ่มต้นของผู้ปฏิบัติการเต็มรูปแบบตามปกติ แม้ว่าผู้เรียกจะส่ง header `x-openclaw-scopes` ที่แคบกว่ามา
- shared-secret auth ยังถือว่าการเรียกเครื่องมือโดยตรงบน endpoint นี้เป็นเทิร์นของผู้ส่งเจ้าของ
- โหมด HTTP แบบ trusted identity-bearing (เช่น trusted proxy auth หรือ `gateway.auth.mode="none"` บน private ingress) จะเคารพ `x-openclaw-scopes` เมื่อมี และมิฉะนั้นจะ fallback ไปยังชุดขอบเขตเริ่มต้นของผู้ปฏิบัติการตามปกติ
- ควรเก็บ endpoint นี้ไว้บน loopback/tailnet/private ingress เท่านั้น; อย่าเปิดเผยโดยตรงสู่อินเทอร์เน็ตสาธารณะ

เมทริกซ์ auth:

- `gateway.auth.mode="token"` หรือ `"password"` + `Authorization: Bearer ...`
  - พิสูจน์การครอบครอง shared gateway operator secret
  - ไม่สนใจ `x-openclaw-scopes` ที่แคบกว่า
  - คืนค่าชุดขอบเขต operator เริ่มต้นแบบเต็ม:
    `operator.admin`, `operator.approvals`, `operator.pairing`,
    `operator.read`, `operator.talk.secrets`, `operator.write`
  - ถือว่าการเรียกเครื่องมือโดยตรงบน endpoint นี้เป็นเทิร์นของผู้ส่งเจ้าของ
- โหมด HTTP แบบ trusted identity-bearing (เช่น trusted proxy auth หรือ `gateway.auth.mode="none"` บน private ingress)
  - ยืนยันตัวตนจากชั้นตัวตนหรือขอบเขตการติดตั้งที่เชื่อถือได้จากภายนอก
  - เคารพ `x-openclaw-scopes` เมื่อ header มีอยู่
  - fallback ไปยังชุดขอบเขต operator เริ่มต้นตามปกติเมื่อไม่มี header
  - จะสูญเสีย semantics ของเจ้าของก็ต่อเมื่อผู้เรียกจำกัด scope ลงอย่างชัดเจนและละ `operator.admin`

## เนื้อหาของคำขอ

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

- `tool` (สตริง, จำเป็น): ชื่อเครื่องมือที่จะเรียกใช้
- `action` (สตริง, ไม่บังคับ): จะถูกแมปเข้า args หาก schema ของเครื่องมือรองรับ `action` และ payload ของ args ไม่ได้ระบุมา
- `args` (ออบเจ็กต์, ไม่บังคับ): อาร์กิวเมนต์เฉพาะของเครื่องมือ
- `sessionKey` (สตริง, ไม่บังคับ): session key เป้าหมาย หากละไว้หรือเป็น `"main"` Gateway จะใช้ main session key ที่กำหนดค่าไว้ (เคารพ `session.mainKey` และเอเจนต์ค่าเริ่มต้น หรือ `global` ใน global scope)
- `dryRun` (บูลีน, ไม่บังคับ): สงวนไว้ใช้ในอนาคต; ปัจจุบันถูกเพิกเฉย

## พฤติกรรมของนโยบาย + การกำหนดเส้นทาง

ความพร้อมใช้งานของเครื่องมือจะถูกกรองผ่านสายโซ่นโยบายเดียวกับที่ Gateway agent ใช้:

- `tools.profile` / `tools.byProvider.profile`
- `tools.allow` / `tools.byProvider.allow`
- `agents.<id>.tools.allow` / `agents.<id>.tools.byProvider.allow`
- นโยบายกลุ่ม (หาก session key แมปไปยังกลุ่มหรือช่องทาง)
- นโยบาย subagent (เมื่อเรียกใช้ด้วย session key ของ subagent)

หากเครื่องมือไม่ได้รับอนุญาตตามนโยบาย endpoint จะคืนค่า **404**

หมายเหตุสำคัญเรื่องขอบเขต:

- การอนุมัติ exec เป็น guardrail ของผู้ปฏิบัติการ ไม่ใช่ขอบเขตการอนุญาตแยกต่างหากสำหรับ HTTP endpoint นี้ หากเครื่องมือเข้าถึงได้จาก Gateway auth + นโยบายเครื่องมือ, `/tools/invoke` จะไม่เพิ่มพรอมป์อนุมัติแยกในแต่ละครั้ง
- อย่าแชร์ข้อมูลรับรอง bearer ของ Gateway ให้กับผู้เรียกที่ไม่น่าเชื่อถือ หากคุณต้องการการแยกข้ามขอบเขตความเชื่อถือ ให้รัน Gateway แยกกัน (และควรแยก OS user/host ด้วย)

Gateway HTTP ยังใช้ hard deny list โดยค่าเริ่มต้น (แม้นโยบายของเซสชันจะอนุญาตเครื่องมือนั้น):

- `exec` — การรันคำสั่งโดยตรง (พื้นผิว RCE)
- `spawn` — การสร้าง child process ตามอำเภอใจ (พื้นผิว RCE)
- `shell` — การรันคำสั่ง shell (พื้นผิว RCE)
- `fs_write` — การเปลี่ยนแปลงไฟล์บนโฮสต์แบบตามอำเภอใจ
- `fs_delete` — การลบไฟล์บนโฮสต์แบบตามอำเภอใจ
- `fs_move` — การย้าย/เปลี่ยนชื่อไฟล์บนโฮสต์แบบตามอำเภอใจ
- `apply_patch` — การใช้ patch สามารถเขียนทับไฟล์ใดก็ได้
- `sessions_spawn` — control plane การประสานงานเซสชัน; การสร้างเอเจนต์จากระยะไกลคือ RCE
- `sessions_send` — การฉีดข้อความข้ามเซสชัน
- `cron` — control plane ของระบบอัตโนมัติแบบคงอยู่
- `gateway` — control plane ของ Gateway; ป้องกันการกำหนดค่าใหม่ผ่าน HTTP
- `nodes` — การส่งต่อคำสั่งของ Node สามารถเข้าถึง system.run บนโฮสต์ที่จับคู่ไว้
- `whatsapp_login` — การตั้งค่าแบบโต้ตอบที่ต้องสแกน QR ในเทอร์มินัล; จะค้างบน HTTP

คุณสามารถปรับแต่ง deny list นี้ผ่าน `gateway.tools`:

```json5
{
  gateway: {
    tools: {
      // เครื่องมือเพิ่มเติมที่จะบล็อกผ่าน HTTP /tools/invoke
      deny: ["browser"],
      // เอาเครื่องมือออกจาก deny list เริ่มต้น
      allow: ["gateway"],
    },
  },
}
```

เพื่อช่วยให้นโยบายกลุ่ม resolve บริบทได้ คุณสามารถตั้งค่าเพิ่มเติมได้ตามต้องการ:

- `x-openclaw-message-channel: <channel>` (ตัวอย่าง: `slack`, `telegram`)
- `x-openclaw-account-id: <accountId>` (เมื่อมีหลายบัญชี)

## การตอบกลับ

- `200` → `{ ok: true, result }`
- `400` → `{ ok: false, error: { type, message } }` (คำขอไม่ถูกต้องหรือข้อผิดพลาดของอินพุตเครื่องมือ)
- `401` → ไม่ได้รับอนุญาต
- `429` → auth ถูกจำกัดอัตรา (`Retry-After` ถูกตั้งไว้)
- `404` → เครื่องมือไม่พร้อมใช้งาน (ไม่พบหรือไม่อยู่ใน allowlist)
- `405` → ไม่อนุญาตเมธอด
- `500` → `{ ok: false, error: { type, message } }` (ข้อผิดพลาดที่ไม่คาดคิดระหว่างรันเครื่องมือ; ข้อความผ่านการทำให้ปลอดภัยแล้ว)

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

## ที่เกี่ยวข้อง

- [โปรโตคอล Gateway](/th/gateway/protocol)
- [เครื่องมือและ Plugins](/th/tools)
