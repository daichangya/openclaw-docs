---
read_when:
    - คุณต้องการเปิด Control UI ด้วยโทเค็นปัจจุบันของคุณ
    - คุณต้องการพิมพ์ URL โดยไม่เปิดเบราว์เซอร์
summary: ข้อมูลอ้างอิง CLI สำหรับ `openclaw dashboard` (เปิด Control UI)
title: แดชบอร์ด
x-i18n:
    generated_at: "2026-04-23T06:17:34Z"
    model: gpt-5.4
    provider: openai
    source_hash: a34cd109a3803e2910fcb4d32f2588aa205a4933819829ef5598f0780f586c94
    source_path: cli/dashboard.md
    workflow: 15
---

# `openclaw dashboard`

เปิด Control UI โดยใช้การยืนยันตัวตนปัจจุบันของคุณ

```bash
openclaw dashboard
openclaw dashboard --no-open
```

หมายเหตุ:

- `dashboard` จะ resolve SecretRef ของ `gateway.auth.token` ที่ตั้งค่าไว้เมื่อทำได้
- สำหรับโทเค็นที่จัดการด้วย SecretRef (ทั้งที่ resolve ได้หรือยังไม่ได้) `dashboard` จะพิมพ์/คัดลอก/เปิด URL ที่ไม่มีโทเค็นเพื่อหลีกเลี่ยงการเปิดเผยความลับภายนอกในเอาต์พุตเทอร์มินัล ประวัติคลิปบอร์ด หรืออาร์กิวเมนต์ที่ใช้เปิดเบราว์เซอร์
- หาก `gateway.auth.token` ถูกจัดการด้วย SecretRef แต่ยัง resolve ไม่ได้ในเส้นทางคำสั่งนี้ คำสั่งจะพิมพ์ URL ที่ไม่มีโทเค็นและคำแนะนำการแก้ไขที่ชัดเจน แทนการฝังค่า placeholder ของโทเค็นที่ไม่ถูกต้อง
