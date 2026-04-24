---
read_when:
    - การใช้งานการอนุมัติการจับคู่ Node โดยไม่มี UI ของ macOS
    - การเพิ่มโฟลว์ CLI สำหรับอนุมัติ remote nodes
    - การขยายโปรโตคอล gateway ด้วยการจัดการ Node
summary: การจับคู่ Node แบบที่ Gateway เป็นเจ้าของ (Option B) สำหรับ iOS และ remote nodes อื่น ๆ
title: การจับคู่แบบที่ Gateway เป็นเจ้าของ
x-i18n:
    generated_at: "2026-04-24T09:11:47Z"
    model: gpt-5.4
    provider: openai
    source_hash: 42e1e927db9dd28c8a37881c5b014809e6286ffc00efe6f1a86dd2d55d360c09
    source_path: gateway/pairing.md
    workflow: 15
---

# การจับคู่แบบที่ Gateway เป็นเจ้าของ (Option B)

ในการจับคู่แบบที่ Gateway เป็นเจ้าของ **Gateway** คือแหล่งข้อมูลจริงหลักว่ามี nodes
ใดบ้างที่ได้รับอนุญาตให้เข้าร่วม UIs (แอป macOS, clients ในอนาคต) เป็นเพียง frontend ที่
ใช้อนุมัติหรือปฏิเสธคำขอที่รอดำเนินการ

**สำคัญ:** WS nodes ใช้ **device pairing** (role `node`) ระหว่าง `connect`
`node.pair.*` เป็น pairing store แยกต่างหากและ **ไม่ได้** ใช้ควบคุม WS handshake
มีเพียง clients ที่เรียก `node.pair.*` อย่างชัดเจนเท่านั้นที่ใช้โฟลว์นี้

## แนวคิด

- **คำขอที่รอดำเนินการ**: node ขอเข้าร่วม; ต้องได้รับการอนุมัติ
- **node ที่จับคู่แล้ว**: node ที่ได้รับอนุมัติและมี auth token ที่ออกให้แล้ว
- **Transport**: Gateway WS endpoint ส่งต่อคำขอ แต่ไม่ใช่ผู้ตัดสิน
  การเป็นสมาชิก (การรองรับ TCP bridge แบบเดิมถูกลบออกแล้ว)

## การทำงานของการจับคู่

1. node เชื่อมต่อกับ Gateway WS และร้องขอการจับคู่
2. Gateway เก็บ **คำขอที่รอดำเนินการ** และส่ง `node.pair.requested`
3. คุณอนุมัติหรือปฏิเสธคำขอนั้น (ผ่าน CLI หรือ UI)
4. เมื่ออนุมัติ Gateway จะออก **token ใหม่** (tokens จะถูกหมุนเวียนเมื่อจับคู่ซ้ำ)
5. node เชื่อมต่อใหม่โดยใช้ token นั้น และตอนนี้จะถือว่า “จับคู่แล้ว”

คำขอที่รอดำเนินการจะหมดอายุอัตโนมัติภายใน **5 นาที**

## โฟลว์ CLI (เหมาะกับโหมด headless)

```bash
openclaw nodes pending
openclaw nodes approve <requestId>
openclaw nodes reject <requestId>
openclaw nodes status
openclaw nodes rename --node <id|name|ip> --name "Living Room iPad"
```

`nodes status` จะแสดง nodes ที่จับคู่แล้ว/เชื่อมต่ออยู่ รวมถึง capabilities ของพวกมัน

## พื้นผิว API (โปรโตคอล gateway)

Events:

- `node.pair.requested` — ส่งเมื่อมีการสร้างคำขอที่รอดำเนินการใหม่
- `node.pair.resolved` — ส่งเมื่อคำขอถูกอนุมัติ/ปฏิเสธ/หมดอายุ

Methods:

- `node.pair.request` — สร้างหรือใช้คำขอที่รอดำเนินการซ้ำ
- `node.pair.list` — แสดงรายการ pending + paired nodes (`operator.pairing`)
- `node.pair.approve` — อนุมัติคำขอที่รอดำเนินการ (ออก token)
- `node.pair.reject` — ปฏิเสธคำขอที่รอดำเนินการ
- `node.pair.verify` — ตรวจสอบ `{ nodeId, token }`

หมายเหตุ:

- `node.pair.request` เป็น idempotent ต่อ node: การเรียกซ้ำจะส่งคืน
  คำขอที่รอดำเนินการเดิม
- คำขอซ้ำสำหรับ pending node เดิมจะรีเฟรช metadata ของ node ที่เก็บไว้ด้วย
  รวมถึง snapshot ล่าสุดของ declared commands ที่อยู่ใน allowlist เพื่อการมองเห็นของ operator
- การอนุมัติจะสร้าง token ใหม่เสมอ; จะไม่มี token ใดถูกส่งกลับจาก
  `node.pair.request`
- คำขออาจมี `silent: true` เป็นคำใบ้สำหรับโฟลว์ auto-approval
- `node.pair.approve` ใช้ declared commands ของคำขอที่รอดำเนินการเพื่อบังคับใช้
  approval scopes เพิ่มเติม:
  - คำขอไม่มีคำสั่ง: `operator.pairing`
  - คำขอคำสั่งที่ไม่ใช่ exec: `operator.pairing` + `operator.write`
  - คำขอ `system.run` / `system.run.prepare` / `system.which`:
    `operator.pairing` + `operator.admin`

สำคัญ:

- การจับคู่ Node เป็นโฟลว์ด้านความเชื่อถือ/ตัวตนรวมถึงการออก token
- มัน **ไม่ได้** ตรึง live node command surface ต่อ node
- live node commands มาจากสิ่งที่ node ประกาศตอน connect หลังจาก
  ใช้นโยบายคำสั่งแบบโกลบอลของ gateway (`gateway.nodes.allowCommands` /
  `denyCommands`) แล้ว
- นโยบาย `system.run` allow/ask ต่อ node อยู่บนตัว node เองใน
  `exec.approvals.node.*` ไม่ได้อยู่ใน pairing record

## การควบคุมคำสั่งของ Node (2026.3.31+)

<Warning>
**Breaking change:** ตั้งแต่ `2026.3.31` เป็นต้นไป คำสั่งของ node จะถูกปิดใช้งานจนกว่าการจับคู่ node จะได้รับการอนุมัติ device pairing เพียงอย่างเดียวไม่เพียงพออีกต่อไปสำหรับการเปิดเผย declared node commands
</Warning>

เมื่อ node เชื่อมต่อครั้งแรก ระบบจะร้องขอการจับคู่โดยอัตโนมัติ จนกว่าคำขอจับคู่นั้นจะได้รับการอนุมัติ pending node commands ทั้งหมดจาก node นั้นจะถูกกรองออกและจะไม่ถูกเรียกใช้ เมื่อมีการสร้าง trust ผ่านการอนุมัติการจับคู่แล้ว declared commands ของ node จะพร้อมใช้งานภายใต้นโยบายคำสั่งปกติ

สิ่งนี้หมายความว่า:

- Nodes ที่ก่อนหน้านี้พึ่งพา device pairing เพียงอย่างเดียวเพื่อเปิดเผย commands จะต้องทำ node pairing ให้เสร็จสิ้นแล้ว
- Commands ที่เข้าคิวไว้ก่อนการอนุมัติ pairing จะถูกทิ้ง ไม่ใช่เลื่อนออกไป

## ขอบเขตความเชื่อถือของ node events (2026.3.31+)

<Warning>
**Breaking change:** การรันที่มีต้นทางจาก node ตอนนี้จะอยู่บน trusted surface ที่ลดรูปลง
</Warning>

สรุปและ session events ที่เกี่ยวข้องซึ่งมีต้นทางจาก node จะถูกจำกัดให้อยู่บน trusted surface ที่ตั้งใจไว้ โฟลว์ที่ขับเคลื่อนด้วยการแจ้งเตือนหรือถูกทริกเกอร์โดย node ซึ่งก่อนหน้านี้อาศัยการเข้าถึง host หรือ session tool ที่กว้างกว่านี้ อาจต้องมีการปรับแก้ การทำให้แข็งแรงขึ้นนี้ช่วยให้แน่ใจว่า node events จะไม่สามารถยกระดับไปสู่การเข้าถึงเครื่องมือระดับโฮสต์เกินกว่าที่ขอบเขตความเชื่อถือของ node อนุญาต

## Auto-approval (แอป macOS)

แอป macOS สามารถพยายามทำ **silent approval** ได้ตามตัวเลือกเมื่อ:

- คำขอถูกทำเครื่องหมายว่า `silent` และ
- แอปสามารถยืนยันการเชื่อมต่อ SSH ไปยังโฮสต์ gateway โดยใช้ผู้ใช้เดียวกันได้

หาก silent approval ล้มเหลว ระบบจะ fallback ไปยัง prompt “Approve/Reject” ปกติ

## Metadata-upgrade auto-approval

เมื่ออุปกรณ์ที่จับคู่แล้วเชื่อมต่อใหม่โดยมีเพียงการเปลี่ยนแปลง metadata
ที่ไม่อ่อนไหว (เช่น ชื่อแสดงผล หรือคำใบ้แพลตฟอร์มของ client) OpenClaw จะถือว่า
นี่คือ `metadata-upgrade` silent auto-approval มีขอบเขตแคบ: ใช้ได้เฉพาะกับ
การเชื่อมต่อใหม่ของ local CLI/helper ที่เชื่อถือได้ซึ่งพิสูจน์การครอบครอง
shared token หรือ password ผ่าน loopback แล้ว Browser/Control UI clients และ
remote clients ยังใช้โฟลว์ re-approval แบบ explicit ตามเดิม การอัปเกรด scope
(read เป็น write/admin) และการเปลี่ยน public key **ไม่มีสิทธิ์** ใช้ metadata-upgrade auto-approval — ยังคงเป็นคำขอ re-approval แบบ explicit

## ตัวช่วยการจับคู่ด้วย QR

`/pair qr` จะเรนเดอร์ payload ของการจับคู่เป็นสื่อแบบมีโครงสร้าง เพื่อให้ mobile และ
browser clients สแกนได้โดยตรง

การลบอุปกรณ์ยังจะกวาด stale pending pairing requests สำหรับ
device id นั้นออกด้วย ดังนั้น `nodes pending` จะไม่แสดงแถว orphaned หลังการ revoke

## ความเป็น local และ forwarded headers

Gateway pairing จะถือว่าการเชื่อมต่อเป็น loopback ก็ต่อเมื่อทั้ง raw socket
และหลักฐานจาก upstream proxy ตรงกันเท่านั้น หากคำขอมาถึงบน loopback แต่มี
headers `X-Forwarded-For` / `X-Forwarded-Host` / `X-Forwarded-Proto`
ที่ชี้ไปยังต้นทางที่ไม่ใช่ local หลักฐานจาก forwarded-header ดังกล่าวจะทำให้
ข้ออ้างเรื่อง locality แบบ loopback ใช้ไม่ได้ เส้นทาง pairing จึงจะต้องใช้
การอนุมัติแบบ explicit แทนการถือว่าเป็นการเชื่อมต่อจากโฮสต์เดียวกันแบบเงียบ ๆ ดู
[Trusted Proxy Auth](/th/gateway/trusted-proxy-auth) สำหรับกฎที่เทียบเท่ากันใน
operator auth

## การจัดเก็บ (ภายในเครื่อง, ส่วนตัว)

สถานะการจับคู่จะถูกเก็บภายใต้ไดเรกทอรีสถานะของ Gateway (ค่าเริ่มต้น `~/.openclaw`):

- `~/.openclaw/nodes/paired.json`
- `~/.openclaw/nodes/pending.json`

หากคุณแทนที่ `OPENCLAW_STATE_DIR`, โฟลเดอร์ `nodes/` จะย้ายตามไปด้วย

หมายเหตุด้านความปลอดภัย:

- Tokens เป็นความลับ; ให้ปฏิบัติต่อ `paired.json` เป็นข้อมูลอ่อนไหว
- การหมุนเวียน token ต้องใช้การอนุมัติใหม่ (หรือลบรายการ node)

## พฤติกรรมของ transport

- transport เป็นแบบ **stateless**; มันไม่เก็บข้อมูลการเป็นสมาชิก
- หาก Gateway ออฟไลน์ หรือปิด pairing อยู่ nodes จะไม่สามารถจับคู่ได้
- หาก Gateway อยู่ในโหมด remote การจับคู่ก็ยังเกิดขึ้นกับ store ของ remote Gateway

## ที่เกี่ยวข้อง

- [Channel pairing](/th/channels/pairing)
- [Nodes](/th/nodes)
- [Devices CLI](/th/cli/devices)
