---
read_when:
    - การสร้างหรือดีบักไคลเอนต์ Node (โหมด node บน iOS/Android/macOS)
    - การสืบสวนความล้มเหลวของการจับคู่หรือการยืนยันตัวตนของบริดจ์
    - การตรวจสอบพื้นผิว Node ที่ gateway เปิดเผยไว้
summary: 'โปรโตคอลบริดจ์แบบ historical (legacy nodes): TCP JSONL, การจับคู่ และ RPC แบบมีขอบเขต'
title: โปรโตคอลบริดจ์
x-i18n:
    generated_at: "2026-04-23T05:32:48Z"
    model: gpt-5.4
    provider: openai
    source_hash: 2bc25c388f3d65944167d05ca78f987c84ca480f0213e3485b118ebf4858c50f
    source_path: gateway/bridge-protocol.md
    workflow: 15
---

# โปรโตคอลบริดจ์ (legacy node transport)

<Warning>
TCP bridge ถูก **นำออกแล้ว** บิลด์ OpenClaw ปัจจุบันไม่ได้มาพร้อม bridge listener และคีย์ config `bridge.*` ก็ไม่มีอยู่ใน schema อีกต่อไป หน้านี้เก็บไว้เพื่อใช้อ้างอิงทางประวัติศาสตร์เท่านั้น ใช้ [Gateway Protocol](/th/gateway/protocol) สำหรับไคลเอนต์ node/operator ทั้งหมด
</Warning>

## เหตุผลที่มันเคยมีอยู่

- **ขอบเขตความปลอดภัย**: บริดจ์เปิดเผยเฉพาะ allowlist ขนาดเล็ก แทนที่จะเป็น
  พื้นผิว API ของ gateway ทั้งหมด
- **การจับคู่ + อัตลักษณ์ของ node**: การรับ node เข้าระบบเป็นหน้าที่ของ gateway และผูก
  กับ token ต่อ node
- **UX ด้านการค้นหา**: nodes สามารถค้นหา gateway ผ่าน Bonjour บน LAN หรือเชื่อมต่อ
  โดยตรงผ่าน tailnet
- **Loopback WS**: control plane แบบ WS เต็มรูปแบบยังคงอยู่ในเครื่อง เว้นแต่จะ tunnel ผ่าน SSH

## Transport

- TCP, หนึ่ง JSON object ต่อหนึ่งบรรทัด (JSONL)
- TLS แบบไม่บังคับ (เมื่อ `bridge.tls.enabled` เป็น true)
- listener port เริ่มต้นในอดีตคือ `18790` (บิลด์ปัจจุบันไม่เริ่ม
  TCP bridge)

เมื่อเปิดใช้ TLS, discovery TXT record จะมี `bridgeTls=1` พร้อม
`bridgeTlsSha256` เป็นคำใบ้ที่ไม่ใช่ความลับ โปรดทราบว่า Bonjour/mDNS TXT record ไม่ได้ผ่านการยืนยันตัวตน; ไคลเอนต์ต้องไม่ถือว่า fingerprint ที่ประกาศไว้นั้นเป็น pin ที่เชื่อถือได้โดยเด็ดขาด เว้นแต่ผู้ใช้ตั้งใจอย่างชัดเจนหรือมีการตรวจสอบนอกช่องทางอื่นเพิ่มเติม

## Handshake + การจับคู่

1. ไคลเอนต์ส่ง `hello` พร้อม metadata ของ node + token (หากจับคู่แล้ว)
2. หากยังไม่ได้จับคู่ gateway จะตอบกลับ `error` (`NOT_PAIRED`/`UNAUTHORIZED`)
3. ไคลเอนต์ส่ง `pair-request`
4. Gateway รอการอนุมัติ จากนั้นส่ง `pair-ok` และ `hello-ok`

ในอดีต `hello-ok` จะส่งคืน `serverName` และอาจมี
`canvasHostUrl` รวมอยู่ด้วย

## เฟรม

ไคลเอนต์ → Gateway:

- `req` / `res`: gateway RPC แบบมีขอบเขต (chat, sessions, config, health, voicewake, skills.bins)
- `event`: สัญญาณจาก node (voice transcript, agent request, chat subscribe, exec lifecycle)

Gateway → ไคลเอนต์:

- `invoke` / `invoke-res`: คำสั่ง node (`canvas.*`, `camera.*`, `screen.record`,
  `location.get`, `sms.send`)
- `event`: การอัปเดตแชตสำหรับเซสชันที่ subscribe ไว้
- `ping` / `pong`: keepalive

ในอดีตการบังคับใช้ allowlist อยู่ใน `src/gateway/server-bridge.ts` (ถูกนำออกแล้ว)

## เหตุการณ์วงจรชีวิตของ Exec

Node สามารถส่งเหตุการณ์ `exec.finished` หรือ `exec.denied` เพื่อแสดงกิจกรรมของ system.run ได้
เหตุการณ์เหล่านี้จะถูกแมปเป็น system event ใน gateway (legacy node อาจยังคงส่ง `exec.started` ได้)

ฟิลด์ของ payload (ทั้งหมดเป็นแบบไม่บังคับ เว้นแต่ระบุไว้):

- `sessionKey` (จำเป็น): เซสชันเอเจนต์ที่จะรับ system event
- `runId`: exec id ที่ไม่ซ้ำกันสำหรับการจัดกลุ่ม
- `command`: สตริงคำสั่งแบบดิบหรือแบบจัดรูปแบบ
- `exitCode`, `timedOut`, `success`, `output`: รายละเอียดการเสร็จสิ้น (เฉพาะ finished)
- `reason`: เหตุผลในการปฏิเสธ (เฉพาะ denied)

## การใช้งาน tailnet ในอดีต

- bind บริดจ์กับ tailnet IP: `bridge.bind: "tailnet"` ใน
  `~/.openclaw/openclaw.json` (ใช้ในอดีตเท่านั้น; `bridge.*` ใช้ไม่ได้อีกต่อไป)
- ไคลเอนต์เชื่อมต่อผ่านชื่อ MagicDNS หรือ tailnet IP
- Bonjour **ไม่** ข้ามเครือข่าย; ใช้ host/port แบบกำหนดเองหรือ DNS‑SD แบบ wide-area
  เมื่อจำเป็น

## การกำหนดเวอร์ชัน

บริดจ์เคยเป็น **implicit v1** (ไม่มีการเจรจา min/max) ส่วนนี้เป็น
ข้อมูลอ้างอิงทางประวัติศาสตร์เท่านั้น; ปัจจุบันไคลเอนต์ node/operator ใช้ WebSocket
[Gateway Protocol](/th/gateway/protocol)
