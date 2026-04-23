---
read_when:
    - คุณต้องการผลลัพธ์ของเครื่องมือ `exec` หรือ `bash` ที่สั้นลงใน OpenClaw
    - คุณต้องการเปิดใช้งาน bundled tokenjuice Plugin
    - คุณต้องเข้าใจว่า tokenjuice เปลี่ยนอะไรบ้าง และอะไรที่ยังคงเป็นแบบดิบอยู่
summary: ย่อผลลัพธ์จากเครื่องมือ exec และ bash ที่มีสัญญาณรบกวนมากด้วย Plugin แบบ bundled ที่เป็นตัวเลือกเสริม
title: Tokenjuice
x-i18n:
    generated_at: "2026-04-23T06:04:08Z"
    model: gpt-5.4
    provider: openai
    source_hash: 9b9a1054c9b1cc62e43ac6d5904c7790f9b27d8e0d0700c9da6e287c00e91783
    source_path: tools/tokenjuice.md
    workflow: 15
---

# Tokenjuice

`tokenjuice` เป็น bundled Plugin แบบไม่บังคับที่ช่วยย่อผลลัพธ์ของเครื่องมือ `exec` และ `bash`
ที่มีสัญญาณรบกวนมาก หลังจากที่คำสั่งถูกรันไปแล้ว

มันเปลี่ยน `tool_result` ที่ส่งกลับ ไม่ได้เปลี่ยนตัวคำสั่งเอง Tokenjuice
จะไม่เขียน shell input ใหม่ ไม่รันคำสั่งซ้ำ และไม่เปลี่ยน exit codes

ปัจจุบันสิ่งนี้ใช้กับการรันแบบฝังตัวของ Pi โดย tokenjuice จะ hook เข้ากับเส้นทาง
`tool_result` แบบ embedded และตัดทอนเอาต์พุตที่จะถูกส่งกลับเข้าไปใน session

## เปิดใช้งาน Plugin

วิธีลัด:

```bash
openclaw config set plugins.entries.tokenjuice.enabled true
```

เทียบเท่ากันกับ:

```bash
openclaw plugins enable tokenjuice
```

OpenClaw มาพร้อม Plugin นี้อยู่แล้ว ไม่มีขั้นตอน `plugins install`
หรือ `tokenjuice install openclaw` แยกต่างหาก

หากคุณต้องการแก้ไข config โดยตรง:

```json5
{
  plugins: {
    entries: {
      tokenjuice: {
        enabled: true,
      },
    },
  },
}
```

## สิ่งที่ tokenjuice เปลี่ยน

- ย่อผลลัพธ์ `exec` และ `bash` ที่มีสัญญาณรบกวนมาก ก่อนถูกป้อนกลับเข้า session
- คงการทำงานของคำสั่งต้นฉบับไว้โดยไม่เปลี่ยนแปลง
- คงการอ่านเนื้อหาไฟล์แบบตรงตัวและคำสั่งอื่นๆ ที่ tokenjuice ควรปล่อยให้เป็นแบบดิบ
- ยังคงเป็นแบบ opt-in: ปิด Plugin หากคุณต้องการเอาต์พุตแบบ verbatim ทุกที่

## ตรวจสอบว่ามันทำงานอยู่

1. เปิดใช้งาน Plugin
2. เริ่ม session ที่สามารถเรียก `exec`
3. รันคำสั่งที่มีสัญญาณรบกวนมาก เช่น `git status`
4. ตรวจสอบว่าผลลัพธ์ของเครื่องมือที่ส่งกลับมาสั้นลงและมีโครงสร้างมากกว่า raw shell output

## ปิดใช้งาน Plugin

```bash
openclaw config set plugins.entries.tokenjuice.enabled false
```

หรือ:

```bash
openclaw plugins disable tokenjuice
```
