---
read_when:
    - คุณต้องการเปิด Control UI ด้วย token ปัจจุบันของคุณ
    - คุณต้องการพิมพ์ URL โดยไม่เปิดเบราว์เซอร์
summary: เอกสารอ้างอิง CLI สำหรับ `openclaw dashboard` (เปิด Control UI)
title: Dashboard
x-i18n:
    generated_at: "2026-04-24T09:02:24Z"
    model: gpt-5.4
    provider: openai
    source_hash: 0864d9c426832ffb9e2acd9d7cb7fc677d859a5b7588132e993a36a5c5307802
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

- `dashboard` จะ resolve SecretRefs ของ `gateway.auth.token` ที่กำหนดค่าไว้เมื่อเป็นไปได้
- สำหรับ token ที่จัดการด้วย SecretRef (ทั้งที่ resolve ได้หรือยังไม่ได้) `dashboard` จะพิมพ์/คัดลอก/เปิด URL ที่ไม่มี token เพื่อหลีกเลี่ยงการเปิดเผยข้อมูลลับภายนอกในเอาต์พุตเทอร์มินัล ประวัติคลิปบอร์ด หรืออาร์กิวเมนต์ที่ใช้เปิดเบราว์เซอร์
- หาก `gateway.auth.token` ถูกจัดการด้วย SecretRef แต่ยัง resolve ไม่ได้ในเส้นทางคำสั่งนี้ คำสั่งจะพิมพ์ URL ที่ไม่มี token และคำแนะนำการแก้ไขที่ชัดเจน แทนการฝัง placeholder token ที่ไม่ถูกต้อง

## ที่เกี่ยวข้อง

- [CLI reference](/th/cli)
- [Dashboard](/th/web/dashboard)
