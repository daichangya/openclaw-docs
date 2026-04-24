---
read_when:
    - คุณต้องการจับคู่แอป Node บนมือถือกับ gateway อย่างรวดเร็ว
    - คุณต้องการผลลัพธ์ setup code สำหรับการแชร์แบบรีโมต/ด้วยตนเอง
summary: ข้อมูลอ้างอิง CLI สำหรับ `openclaw qr` (สร้าง QR สำหรับการจับคู่อุปกรณ์มือถือ + setup code)
title: QR
x-i18n:
    generated_at: "2026-04-24T09:04:01Z"
    model: gpt-5.4
    provider: openai
    source_hash: 05e25f5cf4116adcd0630b148b6799e90304058c51c998293ebbed995f0a0533
    source_path: cli/qr.md
    workflow: 15
---

# `openclaw qr`

สร้าง QR สำหรับการจับคู่อุปกรณ์มือถือและ setup code จากคอนฟิก Gateway ปัจจุบันของคุณ

## การใช้งาน

```bash
openclaw qr
openclaw qr --setup-code-only
openclaw qr --json
openclaw qr --remote
openclaw qr --url wss://gateway.example/ws
```

## ตัวเลือก

- `--remote`: ให้ความสำคัญกับ `gateway.remote.url`; หากยังไม่ได้ตั้งค่า `gateway.tailscale.mode=serve|funnel` ก็ยังสามารถให้ URL สาธารณะแบบรีโมตได้
- `--url <url>`: override URL ของ gateway ที่ใช้ใน payload
- `--public-url <url>`: override URL สาธารณะที่ใช้ใน payload
- `--token <token>`: override ว่า bootstrap flow จะยืนยันตัวตนกับ token ของ gateway ใด
- `--password <password>`: override ว่า bootstrap flow จะยืนยันตัวตนกับรหัสผ่านของ gateway ใด
- `--setup-code-only`: พิมพ์เฉพาะ setup code
- `--no-ascii`: ข้ามการแสดงผล QR แบบ ASCII
- `--json`: ส่งออก JSON (`setupCode`, `gatewayUrl`, `auth`, `urlSource`)

## หมายเหตุ

- `--token` และ `--password` ใช้ร่วมกันไม่ได้
- ตอนนี้ setup code เองบรรจุ `bootstrapToken` แบบ opaque อายุสั้น ไม่ใช่ token/รหัสผ่านของ gateway ที่ใช้ร่วมกัน
- ใน bootstrap flow แบบ Node/operator ที่มีมาในตัว โทเค็น Node หลักยังคงถูกส่งมอบพร้อม `scopes: []`
- หากการส่งมอบ bootstrap ออก operator token ด้วย มันจะยังคงถูกจำกัดอยู่ใน bootstrap allowlist: `operator.approvals`, `operator.read`, `operator.talk.secrets`, `operator.write`
- การตรวจสอบ scope ของ bootstrap ใช้คำนำหน้าตาม role allowlist ของ operator นั้นตอบสนองได้เฉพาะคำขอของ operator; role ที่ไม่ใช่ operator ยังคงต้องใช้ scope ภายใต้คำนำหน้าของ role ของตัวเอง
- การจับคู่อุปกรณ์มือถือจะ fail closed สำหรับ URL ของ gateway แบบ `ws://` ที่เป็น Tailscale/สาธารณะ ส่วน `ws://` บน LAN ส่วนตัวยังคงรองรับ แต่เส้นทางมือถือผ่าน Tailscale/สาธารณะควรใช้ Tailscale Serve/Funnel หรือ URL ของ gateway แบบ `wss://`
- เมื่อใช้ `--remote` OpenClaw ต้องการอย่างใดอย่างหนึ่งระหว่าง `gateway.remote.url` หรือ
  `gateway.tailscale.mode=serve|funnel`
- เมื่อใช้ `--remote` หากข้อมูลรับรองรีโมตที่มีผลใช้งานจริงถูกกำหนดค่าเป็น SecretRef และคุณไม่ได้ส่ง `--token` หรือ `--password` คำสั่งจะ resolve ค่านั้นจาก snapshot ของ gateway ที่กำลังทำงานอยู่ หาก gateway ไม่พร้อมใช้งาน คำสั่งจะล้มเหลวทันที
- หากไม่ใช้ `--remote` ระบบจะ resolve SecretRef ของการยืนยันตัวตนสำหรับ gateway ในเครื่องเมื่อไม่มีการส่ง CLI auth override:
  - `gateway.auth.token` จะถูก resolve เมื่อการยืนยันตัวตนด้วย token สามารถชนะได้ (ตั้ง `gateway.auth.mode="token"` อย่างชัดเจน หรือเป็นโหมดที่อนุมานได้ซึ่งไม่มีแหล่งรหัสผ่านใดชนะ)
  - `gateway.auth.password` จะถูก resolve เมื่อการยืนยันตัวตนด้วยรหัสผ่านสามารถชนะได้ (ตั้ง `gateway.auth.mode="password"` อย่างชัดเจน หรือเป็นโหมดที่อนุมานได้โดยไม่มี token ที่ชนะจาก auth/env)
- หากมีการกำหนดค่าทั้ง `gateway.auth.token` และ `gateway.auth.password` (รวมถึง SecretRef) และยังไม่ได้ตั้ง `gateway.auth.mode` การ resolve setup code จะล้มเหลวจนกว่าจะตั้ง mode อย่างชัดเจน
- หมายเหตุเรื่องเวอร์ชัน Gateway ไม่ตรงกัน: เส้นทางคำสั่งนี้ต้องใช้ gateway ที่รองรับ `secrets.resolve`; gateway รุ่นเก่าจะส่งข้อผิดพลาด unknown-method กลับมา
- หลังจากสแกนแล้ว ให้อนุมัติการจับคู่อุปกรณ์ด้วย:
  - `openclaw devices list`
  - `openclaw devices approve <requestId>`

## ที่เกี่ยวข้อง

- [ข้อมูลอ้างอิง CLI](/th/cli)
- [การจับคู่](/th/cli/pairing)
