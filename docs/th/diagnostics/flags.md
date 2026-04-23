---
read_when:
    - คุณต้องการล็อกดีบักแบบเจาะจงโดยไม่เพิ่มระดับการบันทึกล็อกแบบทั่วระบบ
    - คุณต้องการเก็บล็อกเฉพาะระบบย่อยสำหรับการสนับสนุน მომხმარողի to=functions.read เติมเงินไทยฟรี  东臣json  全民彩票天天送"path":"docs/AGENTS.md","offset":1,"limit":200} code
summary: แฟล็กการวินิจฉัยสำหรับล็อกดีบักแบบเจาะจง
title: แฟล็กการวินิจฉัย
x-i18n:
    generated_at: "2026-04-23T05:32:27Z"
    model: gpt-5.4
    provider: openai
    source_hash: daf0eca0e6bd1cbc2c400b2e94e1698709a96b9cdba1a8cf00bd580a61829124
    source_path: diagnostics/flags.md
    workflow: 15
---

# แฟล็กการวินิจฉัย

แฟล็กการวินิจฉัยช่วยให้คุณเปิดใช้ล็อกดีบักแบบเจาะจงได้โดยไม่ต้องเปิดการบันทึกแบบละเอียดทุกที่ แฟล็กเป็นแบบเลือกเปิดใช้และจะไม่มีผล เว้นแต่ระบบย่อยจะตรวจสอบแฟล็กเหล่านั้น

## วิธีการทำงาน

- แฟล็กเป็นสตริง (ไม่สนตัวพิมพ์เล็ก/ใหญ่)
- คุณสามารถเปิดใช้แฟล็กใน config หรือผ่าน env override
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

รีสตาร์ต gateway หลังจากเปลี่ยนแฟล็ก

## Env override (ใช้ครั้งเดียว)

```bash
OPENCLAW_DIAGNOSTICS=telegram.http,telegram.payload
```

ปิดทุกแฟล็ก:

```bash
OPENCLAW_DIAGNOSTICS=0
```

## ล็อกจะไปอยู่ที่ไหน

แฟล็กจะส่งล็อกไปยังไฟล์ล็อกการวินิจฉัยมาตรฐาน โดยค่าเริ่มต้น:

```
/tmp/openclaw/openclaw-YYYY-MM-DD.log
```

หากคุณตั้งค่า `logging.file` ให้ใช้พาธนั้นแทน ล็อกจะอยู่ในรูปแบบ JSONL (หนึ่งอ็อบเจ็กต์ JSON ต่อหนึ่งบรรทัด) การปกปิดข้อมูลยังคงมีผลตาม `logging.redactSensitive`

## ดึงล็อกออกมา

เลือกไฟล์ล็อกล่าสุด:

```bash
ls -t /tmp/openclaw/openclaw-*.log | head -n 1
```

กรองเฉพาะการวินิจฉัย HTTP ของ Telegram:

```bash
rg "telegram http error" /tmp/openclaw/openclaw-*.log
```

หรือ tail ระหว่างทำซ้ำปัญหา:

```bash
tail -f /tmp/openclaw/openclaw-$(date +%F).log | rg "telegram http error"
```

สำหรับ gateway ระยะไกล คุณยังสามารถใช้ `openclaw logs --follow` ได้ด้วย (ดู [/cli/logs](/cli/logs))

## หมายเหตุ

- หากตั้งค่า `logging.level` สูงกว่า `warn` ล็อกเหล่านี้อาจถูกระงับ ค่าเริ่มต้น `info` ใช้ได้
- สามารถเปิดใช้แฟล็กค้างไว้ได้อย่างปลอดภัย; แฟล็กจะมีผลเฉพาะกับปริมาณล็อกของระบบย่อยที่ระบุ
- ใช้ [/logging](/th/logging) เพื่อเปลี่ยนปลายทางล็อก ระดับ และการปกปิดข้อมูล
