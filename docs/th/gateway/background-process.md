---
read_when:
    - การเพิ่มหรือแก้ไขพฤติกรรมของ exec แบบเบื้องหลัง
    - การดีบักงาน exec ที่ทำงานเป็นเวลานาน
summary: การทำงานของ exec แบบเบื้องหลังและการจัดการโปรเซส
title: exec แบบเบื้องหลังและ process tool
x-i18n:
    generated_at: "2026-04-24T09:08:43Z"
    model: gpt-5.4
    provider: openai
    source_hash: c6dbf6fd0ee39a053fda0a910e95827e9d0e31dcdfbbf542b6ba5d1d63aa48dc
    source_path: gateway/background-process.md
    workflow: 15
---

# exec แบบเบื้องหลัง + Process Tool

OpenClaw รันคำสั่ง shell ผ่าน tool `exec` และเก็บงานที่ทำงานระยะยาวไว้ในหน่วยความจำ ส่วน tool `process` ใช้จัดการเซสชันเบื้องหลังเหล่านั้น

## exec tool

พารามิเตอร์สำคัญ:

- `command` (จำเป็น)
- `yieldMs` (ค่าเริ่มต้น 10000): สลับเป็นเบื้องหลังอัตโนมัติหลังหน่วงเวลานี้
- `background` (bool): ให้ทำงานเป็นเบื้องหลังทันที
- `timeout` (วินาที, ค่าเริ่มต้น 1800): kill โปรเซสเมื่อหมดเวลานี้
- `elevated` (bool): รันนอก sandbox หากเปิด/อนุญาต elevated mode แล้ว (`gateway` โดยค่าเริ่มต้น หรือ `node` เมื่อเป้าหมาย exec คือ `node`)
- ต้องการ TTY จริงหรือไม่? ให้ตั้ง `pty: true`
- `workdir`, `env`

พฤติกรรม:

- การรันแบบเบื้องหน้าจะคืนผลลัพธ์โดยตรง
- เมื่อทำงานแบบเบื้องหลัง (แบบชัดเจนหรือจาก timeout) tool จะคืน `status: "running"` + `sessionId` และส่วนท้ายสั้น ๆ
- ผลลัพธ์จะถูกเก็บไว้ในหน่วยความจำจนกว่าเซสชันจะถูก poll หรือล้าง
- หากไม่อนุญาต tool `process`, `exec` จะรันแบบ synchronous และไม่สนใจ `yieldMs`/`background`
- คำสั่ง exec ที่ถูก spawn จะได้รับ `OPENCLAW_SHELL=exec` สำหรับกฎ shell/profile ที่รับรู้บริบท
- สำหรับงานระยะยาวที่เริ่มตอนนี้ ให้เริ่มเพียงครั้งเดียวแล้วอาศัย
  automatic completion wake เมื่อเปิดใช้งานอยู่และคำสั่งมีการส่งผลลัพธ์ออกมาหรือล้มเหลว
- หากไม่มี automatic completion wake หรือคุณต้องการการยืนยัน
  ความสำเร็จแบบเงียบสำหรับคำสั่งที่ออกอย่างสะอาดโดยไม่มีผลลัพธ์ ให้ใช้ `process`
  เพื่อยืนยันการเสร็จสิ้น
- อย่าจำลองการเตือนความจำหรือการติดตามผลแบบหน่วงเวลาด้วยลูป `sleep` หรือการ
  polling ซ้ำ ๆ; หากเป็นงานในอนาคตให้ใช้ cron

## การเชื่อม child process

เมื่อ spawn child processes ที่ทำงานระยะยาวนอกเหนือจาก tools exec/process (เช่น การ respawn ของ CLI หรือ helper ของ gateway) ให้แนบตัวช่วย bridge ของ child-process เพื่อให้สัญญาณยุติถูกส่งต่อและถอด listeners ออกเมื่อ exit/error วิธีนี้ช่วยหลีกเลี่ยง orphaned processes บน systemd และทำให้พฤติกรรมการปิดระบบสอดคล้องกันข้ามแพลตฟอร์ม

การกำหนดแทนผ่าน environment:

- `PI_BASH_YIELD_MS`: ค่า yield เริ่มต้น (ms)
- `PI_BASH_MAX_OUTPUT_CHARS`: เพดานผลลัพธ์ในหน่วยความจำ (chars)
- `OPENCLAW_BASH_PENDING_MAX_OUTPUT_CHARS`: เพดาน stdout/stderr ที่รอดำเนินการต่อสตรีม (chars)
- `PI_BASH_JOB_TTL_MS`: TTL สำหรับเซสชันที่เสร็จแล้ว (ms, ถูกจำกัดไว้ที่ 1m–3h)

Config (แนะนำ):

- `tools.exec.backgroundMs` (ค่าเริ่มต้น 10000)
- `tools.exec.timeoutSec` (ค่าเริ่มต้น 1800)
- `tools.exec.cleanupMs` (ค่าเริ่มต้น 1800000)
- `tools.exec.notifyOnExit` (ค่าเริ่มต้น true): จัดคิว system event + ขอ Heartbeat เมื่อ exec แบบเบื้องหลังออกจากระบบ
- `tools.exec.notifyOnExitEmptySuccess` (ค่าเริ่มต้น false): เมื่อเป็น true จะจัดคิว completion events สำหรับการรันแบบเบื้องหลังที่สำเร็จแต่ไม่มีผลลัพธ์ด้วย

## process tool

Actions:

- `list`: เซสชันที่กำลังรัน + ที่เสร็จแล้ว
- `poll`: ดึงผลลัพธ์ใหม่ของเซสชันออกมา (พร้อมรายงานสถานะการออกด้วย)
- `log`: อ่านผลลัพธ์ที่ถูกรวมไว้ (รองรับ `offset` + `limit`)
- `write`: ส่ง stdin (`data`, มี `eof` เป็นตัวเลือก)
- `send-keys`: ส่ง key tokens หรือ bytes แบบชัดเจนไปยังเซสชันที่รองรับ PTY
- `submit`: ส่ง Enter / carriage return ไปยังเซสชันที่รองรับ PTY
- `paste`: ส่งข้อความตามตัวอักษร โดยเลือกได้ว่าจะห่อด้วย bracketed paste mode หรือไม่
- `kill`: ยุติเซสชันเบื้องหลัง
- `clear`: ลบเซสชันที่เสร็จแล้วออกจากหน่วยความจำ
- `remove`: kill หากกำลังรันอยู่ มิฉะนั้น clear หากเสร็จแล้ว

หมายเหตุ:

- เฉพาะเซสชันที่ถูกทำงานแบบเบื้องหลังเท่านั้นที่จะถูกแสดง/เก็บไว้ในหน่วยความจำ
- เซสชันจะหายไปเมื่อโปรเซสรีสตาร์ต (ไม่มีการเก็บถาวรลงดิสก์)
- logs ของเซสชันจะถูกบันทึกลงในประวัติแชตก็ต่อเมื่อคุณรัน `process poll/log` และมีการบันทึกผลลัพธ์ของ tool ไว้
- `process` มีขอบเขตต่อ agent; จะมองเห็นเฉพาะเซสชันที่ agent นั้นเป็นผู้เริ่ม
- ใช้ `poll` / `log` สำหรับสถานะ, logs, การยืนยันความสำเร็จแบบเงียบ หรือ
  การยืนยันการเสร็จสิ้นเมื่อไม่มี automatic completion wake
- ใช้ `write` / `send-keys` / `submit` / `paste` / `kill` เมื่อคุณต้องการส่งอินพุต
  หรือแทรกแซง
- `process list` จะมี `name` ที่สังเคราะห์ขึ้น (คำกริยาของคำสั่ง + เป้าหมาย) เพื่อใช้สแกนอย่างรวดเร็ว
- `process log` ใช้ `offset`/`limit` แบบอิงบรรทัด
- เมื่อไม่ได้ระบุทั้ง `offset` และ `limit` จะคืน 200 บรรทัดสุดท้ายและรวมคำแนะนำเรื่องการแบ่งหน้า
- เมื่อระบุ `offset` แต่ไม่ได้ระบุ `limit` จะคืนจาก `offset` จนถึงท้ายสุด (ไม่จำกัดไว้ที่ 200)
- การ polling มีไว้สำหรับตรวจสถานะตามต้องการ ไม่ใช่สำหรับจัดตารางลูปรอ หากงานนั้นควร
  เกิดขึ้นภายหลัง ให้ใช้ cron แทน

## ตัวอย่าง

รันงานระยะยาวแล้วค่อย poll ภายหลัง:

```json
{ "tool": "exec", "command": "sleep 5 && echo done", "yieldMs": 1000 }
```

```json
{ "tool": "process", "action": "poll", "sessionId": "<id>" }
```

เริ่มแบบเบื้องหลังทันที:

```json
{ "tool": "exec", "command": "npm run build", "background": true }
```

ส่ง stdin:

```json
{ "tool": "process", "action": "write", "sessionId": "<id>", "data": "y\n" }
```

ส่ง PTY keys:

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

## ที่เกี่ยวข้อง

- [Exec tool](/th/tools/exec)
- [การอนุมัติ exec](/th/tools/exec-approvals)
