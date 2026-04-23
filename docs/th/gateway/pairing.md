---
read_when:
    - การทำระบบอนุมัติการจับคู่ node โดยไม่มี UI ของ macOS
    - การเพิ่มโฟลว์ CLI สำหรับการอนุมัติ node ระยะไกล
    - การขยายโปรโตคอล Gateway ด้วยการจัดการ node
summary: การจับคู่ node แบบที่ Gateway เป็นเจ้าของ (ตัวเลือก B) สำหรับ iOS และ node ระยะไกลอื่นๆ
title: การจับคู่แบบที่ Gateway เป็นเจ้าของ
x-i18n:
    generated_at: "2026-04-23T05:34:56Z"
    model: gpt-5.4
    provider: openai
    source_hash: 8f90818c84daeb190f27df7413e23362372806f2c4250e4954295fbf6df70233
    source_path: gateway/pairing.md
    workflow: 15
---

# การจับคู่แบบที่ Gateway เป็นเจ้าของ (ตัวเลือก B)

ในการจับคู่แบบที่ Gateway เป็นเจ้าของ **Gateway** คือแหล่งความจริงสำหรับการตัดสินว่า node ใด
ได้รับอนุญาตให้เข้าร่วมได้ UIs (แอป macOS, ไคลเอนต์ในอนาคต) เป็นเพียง frontend ที่ใช้
อนุมัติหรือปฏิเสธคำขอที่ค้างอยู่

**สำคัญ:** WS nodes ใช้ **device pairing** (บทบาท `node`) ระหว่าง `connect`
ส่วน `node.pair.*` เป็นที่เก็บข้อมูลการจับคู่แยกต่างหากและ **ไม่ได้** ใช้ควบคุม WS handshake
มีเพียงไคลเอนต์ที่เรียก `node.pair.*` อย่างชัดเจนเท่านั้นที่ใช้โฟลว์นี้

## แนวคิด

- **Pending request**: node ขอเข้าร่วม; ต้องได้รับการอนุมัติ
- **Paired node**: node ที่ได้รับการอนุมัติแล้วพร้อม auth token ที่ออกให้
- **Transport**: endpoint WS ของ Gateway ส่งต่อคำขอ แต่ไม่ได้ตัดสิน
  เรื่องสมาชิกภาพ (ได้ถอดการรองรับ legacy TCP bridge ออกแล้ว)

## วิธีการทำงานของการจับคู่

1. node เชื่อมต่อกับ Gateway WS และขอการจับคู่
2. Gateway จัดเก็บ **pending request** และส่ง `node.pair.requested`
3. คุณอนุมัติหรือปฏิเสธคำขอ (ผ่าน CLI หรือ UI)
4. เมื่ออนุมัติ Gateway จะออก **token ใหม่** (token จะถูกหมุนเมื่อมีการ pair ใหม่)
5. node เชื่อมต่อใหม่โดยใช้ token และตอนนี้ถือว่า “paired” แล้ว

pending requests จะหมดอายุอัตโนมัติหลังจาก **5 นาที**

## เวิร์กโฟลว์ CLI (เหมาะกับแบบ headless)

```bash
openclaw nodes pending
openclaw nodes approve <requestId>
openclaw nodes reject <requestId>
openclaw nodes status
openclaw nodes rename --node <id|name|ip> --name "Living Room iPad"
```

`nodes status` จะแสดง paired/connected nodes และความสามารถของพวกมัน

## พื้นผิว API (โปรโตคอล gateway)

Events:

- `node.pair.requested` — ส่งออกเมื่อมีการสร้าง pending request ใหม่
- `node.pair.resolved` — ส่งออกเมื่อคำขอถูกอนุมัติ/ปฏิเสธ/หมดอายุ

Methods:

- `node.pair.request` — สร้างหรือใช้ pending request เดิม
- `node.pair.list` — แสดงรายการ pending + paired nodes (`operator.pairing`)
- `node.pair.approve` — อนุมัติ pending request (ออก token)
- `node.pair.reject` — ปฏิเสธ pending request
- `node.pair.verify` — ตรวจสอบ `{ nodeId, token }`

หมายเหตุ:

- `node.pair.request` เป็น idempotent ต่อ node: การเรียกซ้ำจะคืน
  pending request เดิม
- คำขอซ้ำสำหรับ pending node เดียวกันจะรีเฟรชข้อมูลเมตาของ node ที่เก็บไว้
  และสแนปช็อตคำสั่งที่ประกาศล่าสุดซึ่งอยู่ใน allowlist เพื่อให้ผู้ปฏิบัติการมองเห็นได้
- การอนุมัติจะ **สร้าง token ใหม่เสมอ**; จะไม่มีการคืน token จาก
  `node.pair.request`
- คำขออาจใส่ `silent: true` มาเป็นคำใบ้สำหรับโฟลว์ auto-approval
- `node.pair.approve` ใช้คำสั่งที่ประกาศใน pending request เพื่อบังคับใช้ขอบเขตการอนุมัติเพิ่มเติม:
  - คำขอที่ไม่มีคำสั่ง: `operator.pairing`
  - คำขอคำสั่งที่ไม่ใช่ exec: `operator.pairing` + `operator.write`
  - คำขอ `system.run` / `system.run.prepare` / `system.which`:
    `operator.pairing` + `operator.admin`

สำคัญ:

- การจับคู่ node เป็นโฟลว์ด้านความเชื่อถือ/ตัวตน พร้อมการออก token
- มัน **ไม่ได้** pin พื้นผิวคำสั่งของ live node แบบราย node
- คำสั่ง live node มาจากสิ่งที่ node ประกาศตอนเชื่อมต่อ หลังจาก
  นโยบายคำสั่ง node แบบ global ของ gateway (`gateway.nodes.allowCommands` /
  `denyCommands`) ถูกนำไปใช้แล้ว
- นโยบาย allow/ask ของ `system.run` แบบราย node อยู่ที่ตัว node ภายใต้
  `exec.approvals.node.*` ไม่ได้อยู่ในบันทึกการจับคู่

## การควบคุมคำสั่งของ node (2026.3.31+)

<Warning>
**การเปลี่ยนแปลงที่ไม่เข้ากันย้อนหลัง:** เริ่มตั้งแต่ `2026.3.31` เป็นต้นไป คำสั่งของ node จะถูกปิดใช้งานจนกว่าการจับคู่ node จะได้รับการอนุมัติ การจับคู่ device เพียงอย่างเดียวไม่เพียงพออีกต่อไปสำหรับการเปิดเผยคำสั่ง node ที่ประกาศไว้
</Warning>

เมื่อ node เชื่อมต่อเป็นครั้งแรก ระบบจะขอการจับคู่โดยอัตโนมัติ จนกว่าคำขอจับคู่นั้นจะได้รับการอนุมัติ คำสั่ง node ที่รอดำเนินการทั้งหมดจาก node นั้นจะถูกกรองออกและจะไม่ถูกรัน เมื่อมีการสร้างความเชื่อถือผ่านการอนุมัติการจับคู่แล้ว คำสั่งที่ node ประกาศไว้จึงจะพร้อมใช้งานโดยขึ้นอยู่กับนโยบายคำสั่งปกติ

สิ่งนี้หมายความว่า:

- Nodes ที่เคยอาศัย device pairing อย่างเดียวเพื่อเปิดเผยคำสั่ง จะต้องทำ node pairing ให้เสร็จสมบูรณ์แล้ว
- คำสั่งที่เข้าคิวไว้ก่อนการอนุมัติการจับคู่จะถูกทิ้ง ไม่ได้ถูกเลื่อนไปรันภายหลัง

## ขอบเขตความเชื่อถือของ node event (2026.3.31+)

<Warning>
**การเปลี่ยนแปลงที่ไม่เข้ากันย้อนหลัง:** การรันที่มีต้นทางจาก node จะคงอยู่บนพื้นผิวที่เชื่อถือได้แบบลดรูปแล้ว
</Warning>

สรุปผลและ session events ที่เกี่ยวข้องซึ่งมีต้นทางจาก node จะถูกจำกัดให้อยู่ในพื้นผิวที่เชื่อถือได้ตามเป้าหมาย โฟลว์ที่ขับเคลื่อนด้วยการแจ้งเตือนหรือถูกทริกเกอร์โดย node ซึ่งก่อนหน้านี้อาจพึ่งพาการเข้าถึงเครื่องมือระดับโฮสต์หรือระดับเซสชันที่กว้างกว่า อาจต้องมีการปรับเปลี่ยน การเสริมความปลอดภัยนี้ทำให้มั่นใจได้ว่า node events จะไม่สามารถยกระดับไปเป็นการเข้าถึงเครื่องมือระดับโฮสต์เกินกว่าที่ขอบเขตความเชื่อถือของ node อนุญาต

## การอนุมัติอัตโนมัติ (แอป macOS)

แอป macOS สามารถพยายามทำ **silent approval** ได้แบบเลือกใช้ เมื่อ:

- คำขอถูกทำเครื่องหมายว่า `silent` และ
- แอปสามารถยืนยันการเชื่อมต่อ SSH ไปยังโฮสต์ gateway โดยใช้ผู้ใช้เดียวกันได้

หาก silent approval ล้มเหลว ระบบจะ fallback กลับไปยังพรอมป์ต์ “Approve/Reject” ปกติ

## ที่เก็บข้อมูล (ภายในเครื่อง, ส่วนตัว)

สถานะการจับคู่จะถูกเก็บไว้ภายใต้ไดเรกทอรีสถานะของ Gateway (ค่าเริ่มต้น `~/.openclaw`):

- `~/.openclaw/nodes/paired.json`
- `~/.openclaw/nodes/pending.json`

หากคุณ override `OPENCLAW_STATE_DIR`, โฟลเดอร์ `nodes/` จะย้ายตามไปด้วย

หมายเหตุด้านความปลอดภัย:

- Tokens เป็นความลับ; ให้ถือว่า `paired.json` เป็นข้อมูลละเอียดอ่อน
- การหมุน token ต้องได้รับการอนุมัติใหม่ (หรือลบ entry ของ node)

## พฤติกรรมของ transport

- transport เป็นแบบ **stateless**; มันไม่ได้จัดเก็บสถานะสมาชิกภาพ
- หาก Gateway ออฟไลน์หรือปิดการจับคู่ไว้ nodes จะจับคู่ไม่ได้
- หาก Gateway อยู่ในโหมด remote การจับคู่ก็ยังคงเกิดขึ้นกับที่เก็บข้อมูลของ Gateway ระยะไกลนั้น
