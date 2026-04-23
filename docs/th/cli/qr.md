---
read_when:
    - คุณต้องการจับคู่แอป Node บนมือถือกับ Gateway อย่างรวดเร็ว
    - คุณต้องการเอาต์พุต setup-code สำหรับการแชร์จากระยะไกล/ด้วยตนเอง
summary: ข้อมูลอ้างอิง CLI สำหรับ `openclaw qr` (สร้าง QR สำหรับการจับคู่บนมือถือ + รหัสตั้งค่า)
title: QR
x-i18n:
    generated_at: "2026-04-23T06:19:19Z"
    model: gpt-5.4
    provider: openai
    source_hash: ee6469334ad09037318f938c7ac609b7d5e3385c0988562501bb02a1bfa411ff
    source_path: cli/qr.md
    workflow: 15
---

# `openclaw qr`

สร้าง QR สำหรับการจับคู่บนมือถือและ setup code จากการกำหนดค่า Gateway ปัจจุบันของคุณ

## การใช้งาน

```bash
openclaw qr
openclaw qr --setup-code-only
openclaw qr --json
openclaw qr --remote
openclaw qr --url wss://gateway.example/ws
```

## ตัวเลือก

- `--remote`: ให้ใช้ `gateway.remote.url` ก่อน; หากยังไม่ได้ตั้งค่า `gateway.tailscale.mode=serve|funnel` ก็ยังสามารถให้ URL สาธารณะระยะไกลได้
- `--url <url>`: แทนที่ URL ของ gateway ที่ใช้ใน payload
- `--public-url <url>`: แทนที่ URL สาธารณะที่ใช้ใน payload
- `--token <token>`: แทนที่ว่าจะใช้โทเค็น gateway ใดในการยืนยันตัวตนของโฟลว์ bootstrap
- `--password <password>`: แทนที่ว่าจะใช้รหัสผ่าน gateway ใดในการยืนยันตัวตนของโฟลว์ bootstrap
- `--setup-code-only`: พิมพ์เฉพาะ setup code
- `--no-ascii`: ข้ามการเรนเดอร์ QR แบบ ASCII
- `--json`: ส่งออก JSON (`setupCode`, `gatewayUrl`, `auth`, `urlSource`)

## หมายเหตุ

- `--token` และ `--password` ใช้ร่วมกันไม่ได้
- ตอนนี้ setup code เองจะมี `bootstrapToken` แบบทึบที่มีอายุสั้น ไม่ใช่โทเค็น/รหัสผ่าน gateway ที่ใช้ร่วมกัน
- ในโฟลว์ bootstrap แบบ node/operator ที่มีมาในตัว โทเค็น node หลักยังคงถูกสร้างด้วย `scopes: []`
- หากการส่งต่อ bootstrap ออกโทเค็น operator ด้วย โทเค็นนั้นจะยังคงถูกจำกัดอยู่ใน allowlist ของ bootstrap: `operator.approvals`, `operator.read`, `operator.talk.secrets`, `operator.write`
- การตรวจสอบขอบเขตของ bootstrap ใช้คำนำหน้าตาม role allowlist ของ operator ดังกล่าวจะตอบสนองได้เฉพาะคำขอของ operator; role ที่ไม่ใช่ operator ยังต้องมี scopes ภายใต้คำนำหน้าของ role ของตนเอง
- การจับคู่บนมือถือจะ fail closed สำหรับ URL gateway แบบ `ws://` ที่เป็น Tailscale/สาธารณะ ส่วน `ws://` บน private LAN ยังรองรับอยู่ แต่เส้นทางมือถือผ่าน Tailscale/สาธารณะควรใช้ Tailscale Serve/Funnel หรือ URL gateway แบบ `wss://`
- เมื่อใช้ `--remote`, OpenClaw ต้องการอย่างใดอย่างหนึ่งระหว่าง `gateway.remote.url` หรือ
  `gateway.tailscale.mode=serve|funnel`
- เมื่อใช้ `--remote` หากข้อมูลรับรอง remote ที่มีผลใช้งานจริงถูกกำหนดเป็น SecretRefs และคุณไม่ได้ส่ง `--token` หรือ `--password` คำสั่งจะ resolve ข้อมูลเหล่านั้นจาก snapshot ของ gateway ที่กำลังใช้งานอยู่ หาก gateway ไม่พร้อมใช้งาน คำสั่งจะล้มเหลวทันที
- หากไม่ใช้ `--remote`, SecretRefs สำหรับการยืนยันตัวตนของ local gateway จะถูก resolve เมื่อไม่มีการแทนที่ auth ผ่าน CLI:
  - `gateway.auth.token` จะถูก resolve เมื่อการยืนยันตัวตนด้วยโทเค็นสามารถชนะได้ (ตั้ง `gateway.auth.mode="token"` อย่างชัดเจน หรือเป็นโหมดที่อนุมานได้เมื่อไม่มีแหล่งรหัสผ่านใดชนะ)
  - `gateway.auth.password` จะถูก resolve เมื่อการยืนยันตัวตนด้วยรหัสผ่านสามารถชนะได้ (ตั้ง `gateway.auth.mode="password"` อย่างชัดเจน หรือเป็นโหมดที่อนุมานได้โดยไม่มีโทเค็นที่ชนะจาก auth/env)
- หากมีการกำหนดทั้ง `gateway.auth.token` และ `gateway.auth.password` (รวมถึง SecretRefs) และไม่ได้ตั้ง `gateway.auth.mode` ไว้ การ resolve setup code จะล้มเหลวจนกว่าจะตั้งโหมดอย่างชัดเจน
- หมายเหตุเรื่องเวอร์ชัน Gateway ไม่ตรงกัน: เส้นทางคำสั่งนี้ต้องใช้ gateway ที่รองรับ `secrets.resolve`; gateway รุ่นเก่าจะส่งข้อผิดพลาด unknown-method กลับมา
- หลังจากสแกนแล้ว ให้อนุมัติการจับคู่อุปกรณ์ด้วย:
  - `openclaw devices list`
  - `openclaw devices approve <requestId>`
