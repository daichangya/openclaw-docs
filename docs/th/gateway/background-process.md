---
read_when:
    - กำลังเพิ่มหรือแก้ไขพฤติกรรม exec แบบเบื้องหลัง
    - กำลังแก้ไขปัญหางาน exec ที่ทำงานนานฤศจassistant to=functions.read মন্তব্যary  天天中彩票官方  彩神争霸json 】!【path":"docs/AGENTS.md","offset":1,"limit":200} code
summary: การทำงาน exec แบบเบื้องหลังและการจัดการโปรเซส
title: Background Exec และเครื่องมือ Process
x-i18n:
    generated_at: "2026-04-23T05:32:48Z"
    model: gpt-5.4
    provider: openai
    source_hash: 4398e2850f6f050944f103ad637cd9f578e9cc7fb478bc5cd5d972c92289b831
    source_path: gateway/background-process.md
    workflow: 15
---

# Background Exec + เครื่องมือ Process

OpenClaw รันคำสั่ง shell ผ่านเครื่องมือ `exec` และเก็บงานที่รันนานไว้ในหน่วยความจำ เครื่องมือ `process` ใช้จัดการเซสชันเบื้องหลังเหล่านั้น

## เครื่องมือ exec

พารามิเตอร์หลัก:

- `command` (จำเป็น)
- `yieldMs` (ค่าเริ่มต้น 10000): ย้ายไปเบื้องหลังอัตโนมัติหลังดีเลย์นี้
- `background` (bool): ย้ายไปเบื้องหลังทันที
- `timeout` (วินาที, ค่าเริ่มต้น 1800): kill โปรเซสหลัง timeout นี้
- `elevated` (bool): รันนอก sandbox หากเปิด/อนุญาตโหมดยกระดับไว้ (`gateway` โดยค่าเริ่มต้น หรือ `node` เมื่อเป้าหมาย exec เป็น `node`)
- ต้องการ TTY จริงหรือไม่? ตั้งค่า `pty: true`
- `workdir`, `env`

พฤติกรรม:

- การรัน foreground จะคืนเอาต์พุตโดยตรง
- เมื่อย้ายไปเบื้องหลัง (แบบชัดเจนหรือเพราะ timeout) เครื่องมือจะคืน `status: "running"` + `sessionId` และ tail แบบสั้น
- เอาต์พุตจะถูกเก็บไว้ในหน่วยความจำจนกว่าเซสชันจะถูก poll หรือล้าง
- หากไม่อนุญาตเครื่องมือ `process`, `exec` จะรันแบบ synchronous และไม่สนใจ `yieldMs`/`background`
- คำสั่ง exec ที่ถูก spawn จะได้รับ `OPENCLAW_SHELL=exec` สำหรับกฎ shell/profile ที่รับรู้บริบท
- สำหรับงานที่ใช้เวลานานและเริ่มตอนนี้ ให้เริ่มเพียงครั้งเดียว แล้วพึ่งพา
  automatic completion wake เมื่อเปิดใช้งานและคำสั่งส่งเอาต์พุตออกมาหรือล้มเหลว
- หากไม่มี automatic completion wake หรือคุณต้องการการยืนยันความสำเร็จแบบเงียบ
  สำหรับคำสั่งที่จบสำเร็จโดยไม่มีเอาต์พุต ให้ใช้ `process`
  เพื่อยืนยันการเสร็จสิ้น
- อย่าจำลองการเตือนหรือการติดตามผลแบบหน่วงเวลาด้วยลูป `sleep` หรือการ polling ซ้ำ ๆ;
  ใช้ Cron สำหรับงานในอนาคต

## การเชื่อมสะพาน child process

เมื่อ spawn child process ที่ทำงานนานนอกเครื่องมือ exec/process (เช่น การ respawn ของ CLI หรือ helper ของ gateway) ให้ต่อ helper สำหรับ bridge ของ child process เพื่อให้สัญญาณยุติถูกส่งต่อ และถอด listener เมื่อ exit/error วิธีนี้ช่วยหลีกเลี่ยงโปรเซสกำพร้าบน systemd และทำให้พฤติกรรมการปิดทำงานสอดคล้องกันข้ามแพลตฟอร์ม

การแทนที่ผ่านสภาพแวดล้อม:

- `PI_BASH_YIELD_MS`: yield เริ่มต้น (ms)
- `PI_BASH_MAX_OUTPUT_CHARS`: เพดานเอาต์พุตในหน่วยความจำ (chars)
- `OPENCLAW_BASH_PENDING_MAX_OUTPUT_CHARS`: เพดาน stdout/stderr ที่รอดำเนินการต่อสตรีม (chars)
- `PI_BASH_JOB_TTL_MS`: TTL สำหรับเซสชันที่เสร็จแล้ว (ms, จำกัดให้อยู่ในช่วง 1m–3h)

การกำหนดค่า (แนะนำ):

- `tools.exec.backgroundMs` (ค่าเริ่มต้น 10000)
- `tools.exec.timeoutSec` (ค่าเริ่มต้น 1800)
- `tools.exec.cleanupMs` (ค่าเริ่มต้น 1800000)
- `tools.exec.notifyOnExit` (ค่าเริ่มต้น true): เข้าคิว system event + ขอ Heartbeat เมื่อ exec ที่ย้ายไปเบื้องหลังจบการทำงาน
- `tools.exec.notifyOnExitEmptySuccess` (ค่าเริ่มต้น false): เมื่อเป็น true จะเข้าคิวเหตุการณ์การเสร็จสิ้นด้วยสำหรับการรันเบื้องหลังที่สำเร็จแต่ไม่มีเอาต์พุต

## เครื่องมือ process

การดำเนินการ:

- `list`: เซสชันที่กำลังรัน + ที่เสร็จแล้ว
- `poll`: ดึงเอาต์พุตใหม่สำหรับเซสชัน (รายงานสถานะการ exit ด้วย)
- `log`: อ่านเอาต์พุตที่รวมกันแล้ว (รองรับ `offset` + `limit`)
- `write`: ส่ง stdin (`data`, มี `eof` แบบไม่บังคับ)
- `send-keys`: ส่งโทเค็นคีย์หรือไบต์แบบชัดเจนไปยังเซสชันที่รองรับ PTY
- `submit`: ส่ง Enter / carriage return ไปยังเซสชันที่รองรับ PTY
- `paste`: ส่งข้อความตามตัวอักษร โดยสามารถครอบด้วย bracketed paste mode ได้
- `kill`: ยุติเซสชันเบื้องหลัง
- `clear`: ลบเซสชันที่เสร็จแล้วออกจากหน่วยความจำ
- `remove`: kill หากกำลังรัน มิฉะนั้น clear หากเสร็จแล้ว

หมายเหตุ:

- มีเพียงเซสชันที่ย้ายไปเบื้องหลังเท่านั้นที่ถูกแสดง/คงไว้ในหน่วยความจำ
- เซสชันจะหายไปเมื่อโปรเซสรีสตาร์ต (ไม่มีการคงไว้บนดิสก์)
- log ของเซสชันจะถูกบันทึกลงในประวัติแชตก็ต่อเมื่อคุณรัน `process poll/log` และผลลัพธ์ของเครื่องมือถูกบันทึกไว้
- `process` มีขอบเขตต่อเอเจนต์; มันจะเห็นเฉพาะเซสชันที่เอเจนต์นั้นเริ่มไว้
- ใช้ `poll` / `log` สำหรับสถานะ ล็อก การยืนยันความสำเร็จแบบเงียบ หรือ
  การยืนยันการเสร็จสิ้นเมื่อไม่มี automatic completion wake
- ใช้ `write` / `send-keys` / `submit` / `paste` / `kill` เมื่อคุณต้องการอินพุต
  หรือการแทรกแซง
- `process list` มี `name` ที่อนุมานได้ (กริยาของคำสั่ง + เป้าหมาย) สำหรับการสแกนอย่างรวดเร็ว
- `process log` ใช้ `offset`/`limit` แบบอิงบรรทัด
- เมื่อไม่ระบุทั้ง `offset` และ `limit` จะคืน 200 บรรทัดล่าสุดและใส่คำใบ้เรื่องการแบ่งหน้า
- เมื่อระบุ `offset` แต่ไม่ระบุ `limit` จะคืนจาก `offset` จนถึงท้ายสุด (ไม่จำกัดไว้ที่ 200)
- การ polling มีไว้สำหรับสถานะแบบตามต้องการ ไม่ใช่สำหรับจัดตารางรอแบบวนลูป หากงานนั้นควร
  เกิดขึ้นภายหลัง ให้ใช้ Cron แทน

## ตัวอย่าง

รันงานที่ใช้เวลานานแล้วค่อย poll ทีหลัง:

```json
{ "tool": "exec", "command": "sleep 5 && echo done", "yieldMs": 1000 }
```

```json
{ "tool": "process", "action": "poll", "sessionId": "<id>" }
```

เริ่มในเบื้องหลังทันที:

```json
{ "tool": "exec", "command": "npm run build", "background": true }
```

ส่ง stdin:

```json
{ "tool": "process", "action": "write", "sessionId": "<id>", "data": "y\n" }
```

ส่งคีย์ PTY:

```json
{ "tool": "process", "action": "send-keys", "sessionId": "<id>", "keys": ["C-c"] }
```

ส่งบรรทัดปัจจุบัน:

```json
{ "tool": "process", "action": "submit", "sessionId": "<id>" }
```

วางข้อความตามตัวอักษร:

```json
{ "tool": "process", "action": "paste", "sessionId": "<id>", "text": "line1\nline2\n" }
```
