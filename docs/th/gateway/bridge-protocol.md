---
read_when:
    - การสร้างหรือดีบักไคลเอนต์ Node (โหมด Node บน iOS/Android/macOS)
    - การตรวจสอบความล้มเหลวของการจับคู่หรือการยืนยันตัวตนของ bridge
    - การตรวจสอบพื้นผิว Node ที่ gateway เปิดเผยออกมา
summary: 'โปรโตคอล bridge แบบเดิม (Node แบบ legacy): TCP JSONL, การจับคู่, RPC แบบมีขอบเขต'
title: โปรโตคอล Bridge
x-i18n:
    generated_at: "2026-04-24T09:08:51Z"
    model: gpt-5.4
    provider: openai
    source_hash: 6b2a54f439e586ea7e535cedae4a07c365f95702835b05ba5a779d590dcf967e
    source_path: gateway/bridge-protocol.md
    workflow: 15
---

# โปรโตคอล Bridge (ทรานสปอร์ต Node แบบ legacy)

<Warning>
TCP bridge ถูก **นำออกแล้ว** บิลด์ OpenClaw ปัจจุบันไม่ได้มาพร้อม bridge listener และคีย์ config `bridge.*` ก็ไม่อยู่ใน schema อีกต่อไป หน้านี้ถูกเก็บไว้เพื่อใช้อ้างอิงทางประวัติศาสตร์เท่านั้น ให้ใช้ [Gateway Protocol](/th/gateway/protocol) สำหรับไคลเอนต์ Node/ผู้ปฏิบัติงานทั้งหมด
</Warning>

## ทำไมมันเคยมีอยู่

- **ขอบเขตด้านความปลอดภัย**: bridge เปิดเผย allowlist ขนาดเล็กแทน
  พื้นผิว API ของ gateway ทั้งหมด
- **การจับคู่ + ตัวตนของ Node**: การรับ Node เข้าใช้งานเป็นหน้าที่ของ gateway และผูก
  กับโทเค็นต่อ Node
- **ประสบการณ์การค้นพบ**: Node สามารถค้นหา gateway ผ่าน Bonjour บน LAN หรือเชื่อมต่อ
  โดยตรงผ่าน tailnet
- **Loopback WS**: control plane แบบ WS เต็มรูปแบบจะยังอยู่ในเครื่อง เว้นแต่จะถูก tunnel ผ่าน SSH

## ทรานสปอร์ต

- TCP, หนึ่งออบเจ็กต์ JSON ต่อหนึ่งบรรทัด (JSONL)
- TLS แบบไม่บังคับ (เมื่อ `bridge.tls.enabled` เป็น true)
- ในอดีต พอร์ต listener เริ่มต้นคือ `18790` (บิลด์ปัจจุบันจะไม่เริ่ม
  TCP bridge)

เมื่อเปิดใช้ TLS TXT record ของ discovery จะมี `bridgeTls=1` พร้อม
`bridgeTlsSha256` เป็นคำใบ้ที่ไม่ใช่ความลับ โปรดทราบว่า TXT record ของ Bonjour/mDNS ไม่มีการยืนยันตัวตน; ไคลเอนต์ต้องไม่ถือว่าลายนิ้วมือที่โฆษณาไว้นั้นเป็น pin ที่เชื่อถือได้โดยเด็ดขาดหากไม่มีเจตนาของผู้ใช้อย่างชัดเจนหรือการยืนยันนอกช่องทางแบบอื่น

## แฮนด์เชก + การจับคู่

1. ไคลเอนต์ส่ง `hello` พร้อมเมทาดาทาของ Node + โทเค็น (หากจับคู่แล้ว)
2. หากยังไม่ได้จับคู่ gateway จะตอบกลับ `error` (`NOT_PAIRED`/`UNAUTHORIZED`)
3. ไคลเอนต์ส่ง `pair-request`
4. Gateway รอการอนุมัติ จากนั้นส่ง `pair-ok` และ `hello-ok`

ในอดีต `hello-ok` จะส่งคืน `serverName` และอาจรวม
`canvasHostUrl`

## เฟรม

ไคลเอนต์ → Gateway:

- `req` / `res`: RPC ของ gateway แบบมีขอบเขต (chat, sessions, config, health, voicewake, skills.bins)
- `event`: สัญญาณจาก Node (voice transcript, คำขอของเอเจนต์, การ subscribe แชต, วงจรชีวิต exec)

Gateway → ไคลเอนต์:

- `invoke` / `invoke-res`: คำสั่งของ Node (`canvas.*`, `camera.*`, `screen.record`,
  `location.get`, `sms.send`)
- `event`: การอัปเดตแชตสำหรับเซสชันที่ subscribe ไว้
- `ping` / `pong`: keepalive

การบังคับใช้ allowlist แบบ legacy เคยอยู่ใน `src/gateway/server-bridge.ts` (ถูกนำออกแล้ว)

## อีเวนต์วงจรชีวิต Exec

Node สามารถส่งอีเวนต์ `exec.finished` หรือ `exec.denied` เพื่อแสดงกิจกรรม system.run
สิ่งเหล่านี้จะถูกแมปเป็น system events ใน gateway (Node แบบ legacy อาจยังคงส่ง `exec.started`)

ฟิลด์ของ payload (ทั้งหมดเป็นตัวเลือกเสริม เว้นแต่จะระบุไว้):

- `sessionKey` (จำเป็น): เซสชันของเอเจนต์ที่จะรับ system event
- `runId`: exec id แบบไม่ซ้ำสำหรับการจัดกลุ่ม
- `command`: สตริงคำสั่งแบบดิบหรือแบบจัดรูป
- `exitCode`, `timedOut`, `success`, `output`: รายละเอียดตอนเสร็จสิ้น (เฉพาะ finished)
- `reason`: เหตุผลในการปฏิเสธ (เฉพาะ denied)

## การใช้งาน tailnet ในอดีต

- bind bridge ไปยัง tailnet IP: `bridge.bind: "tailnet"` ใน
  `~/.openclaw/openclaw.json` (มีผลเฉพาะในอดีต; `bridge.*` ใช้ไม่ได้แล้ว)
- ไคลเอนต์เชื่อมต่อผ่านชื่อ MagicDNS หรือ tailnet IP
- Bonjour **ไม่** ข้ามเครือข่าย; ให้ใช้ host/port แบบกำหนดเองหรือ wide-area DNS‑SD
  เมื่อจำเป็น

## การกำหนดเวอร์ชัน

bridge เป็น **v1 โดยปริยาย** (ไม่มีการเจรจา min/max) ส่วนนี้มีไว้เพื่อใช้อ้างอิงทางประวัติศาสตร์เท่านั้น; ปัจจุบันไคลเอนต์ Node/ผู้ปฏิบัติงานใช้ [Gateway Protocol](/th/gateway/protocol) แบบ WebSocket

## ที่เกี่ยวข้อง

- [Gateway protocol](/th/gateway/protocol)
- [Nodes](/th/nodes)
