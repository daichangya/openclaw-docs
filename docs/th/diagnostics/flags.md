---
read_when:
    - คุณต้องการ log ดีบักแบบเจาะจงโดยไม่เพิ่มระดับ logging แบบโกลบอล
    - คุณต้องการเก็บ log เฉพาะระบบย่อยสำหรับการซัพพอร์ต
summary: แฟล็ก diagnostics สำหรับ log ดีบักแบบเจาะจง
title: แฟล็ก diagnostics
x-i18n:
    generated_at: "2026-04-24T09:08:32Z"
    model: gpt-5.4
    provider: openai
    source_hash: b7e5ec9c5e28ef51f1e617baf62412897df8096f227a74d86a0824e269aafd9d
    source_path: diagnostics/flags.md
    workflow: 15
---

แฟล็ก diagnostics ช่วยให้คุณเปิด log ดีบักแบบเจาะจงได้โดยไม่ต้องเปิด verbose logging ทุกที่ แฟล็กเหล่านี้เป็นแบบเลือกใช้เองและจะไม่มีผลเว้นแต่ระบบย่อยจะตรวจสอบมัน

## วิธีการทำงาน

- แฟล็กเป็นสตริง (ไม่สนตัวพิมพ์เล็กใหญ่)
- คุณสามารถเปิดใช้แฟล็กได้ในการกำหนดค่าหรือผ่าน env override
- รองรับ wildcard:
  - `telegram.*` ตรงกับ `telegram.http`
  - `*` เปิดใช้ทุกแฟล็ก

## เปิดใช้ผ่าน config

```json
{
  "diagnostics": {
    "flags": ["telegram.http"]
  }
}
```

หลายแฟล็ก:

```json
{
  "diagnostics": {
    "flags": ["telegram.http", "gateway.*"]
  }
}
```

รีสตาร์ท gateway หลังจากเปลี่ยนแฟล็ก

## Env override (ใช้ครั้งเดียว)

```bash
OPENCLAW_DIAGNOSTICS=telegram.http,telegram.payload
```

ปิดทุกแฟล็ก:

```bash
OPENCLAW_DIAGNOSTICS=0
```

## log จะไปที่ใด

แฟล็กจะส่ง log ไปยังไฟล์ diagnostics log มาตรฐาน โดยค่าเริ่มต้น:

```
/tmp/openclaw/openclaw-YYYY-MM-DD.log
```

หากคุณตั้งค่า `logging.file` ให้ใช้พาธนั้นแทน log เป็น JSONL (หนึ่งออบเจ็กต์ JSON ต่อหนึ่งบรรทัด) การปกปิดข้อมูลยังคงใช้ตาม `logging.redactSensitive`

## ดึง log

เลือกไฟล์ log ล่าสุด:

```bash
ls -t /tmp/openclaw/openclaw-*.log | head -n 1
```

กรองหา diagnostics ของ Telegram HTTP:

```bash
rg "telegram http error" /tmp/openclaw/openclaw-*.log
```

หรือ tail ระหว่างทำซ้ำปัญหา:

```bash
tail -f /tmp/openclaw/openclaw-$(date +%F).log | rg "telegram http error"
```

สำหรับ gateway ระยะไกล คุณยังสามารถใช้ `openclaw logs --follow` ได้ (ดู [/cli/logs](/th/cli/logs))

## หมายเหตุ

- หากตั้งค่า `logging.level` สูงกว่า `warn` log เหล่านี้อาจถูกระงับ ค่าเริ่มต้น `info` ใช้งานได้
- แฟล็กสามารถเปิดทิ้งไว้ได้อย่างปลอดภัย; มันมีผลเฉพาะกับปริมาณ log ของระบบย่อยที่ระบุ
- ใช้ [/logging](/th/logging) เพื่อเปลี่ยนปลายทาง log ระดับ และการปกปิดข้อมูล

## ที่เกี่ยวข้อง

- [Gateway diagnostics](/th/gateway/diagnostics)
- [การแก้ไขปัญหา Gateway](/th/gateway/troubleshooting)
