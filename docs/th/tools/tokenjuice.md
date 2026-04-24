---
read_when:
    - คุณต้องการผลลัพธ์ของเครื่องมือ `exec` หรือ `bash` ที่สั้นลงใน OpenClaw
    - คุณต้องการเปิดใช้งาน plugin tokenjuice แบบ bundled
    - คุณต้องการทำความเข้าใจว่า tokenjuice เปลี่ยนแปลงอะไร และปล่อยอะไรไว้เป็นข้อมูลดิบ
summary: ย่อผลลัพธ์ที่มีสัญญาณรบกวนจากเครื่องมือ exec และ bash ด้วย plugin แบบ bundled ที่ไม่บังคับ
title: Tokenjuice
x-i18n:
    generated_at: "2026-04-24T09:38:51Z"
    model: gpt-5.4
    provider: openai
    source_hash: 0ff542095eb730f06eadec213289b93e31f1afa179160b7d4e915329f09ad5f1
    source_path: tools/tokenjuice.md
    workflow: 15
---

`tokenjuice` คือ plugin แบบ bundled ที่ไม่บังคับ ซึ่งใช้ย่อผลลัพธ์ของเครื่องมือ `exec` และ `bash`
ที่มีสัญญาณรบกวน หลังจากที่คำสั่งถูกรันไปแล้ว

มันจะเปลี่ยน `tool_result` ที่ส่งกลับ ไม่ใช่เปลี่ยนตัวคำสั่งเอง Tokenjuice ไม่ได้
เขียนอินพุต shell ใหม่ ไม่ได้รันคำสั่งซ้ำ และไม่ได้เปลี่ยน exit codes

ปัจจุบันสิ่งนี้ใช้กับการรันแบบฝังตัวของ Pi โดย tokenjuice จะ hook เข้ากับเส้นทาง `tool_result`
แบบ embedded และตัดทอนเอาต์พุตที่จะส่งกลับเข้าไปในเซสชัน

## เปิดใช้งาน plugin

เส้นทางแบบเร็ว:

```bash
openclaw config set plugins.entries.tokenjuice.enabled true
```

เทียบเท่ากับ:

```bash
openclaw plugins enable tokenjuice
```

OpenClaw มาพร้อม plugin นี้อยู่แล้ว ไม่มีขั้นตอน `plugins install`
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

- ย่อผลลัพธ์ `exec` และ `bash` ที่มีสัญญาณรบกวนก่อนจะถูกป้อนกลับเข้าไปในเซสชัน
- คงการรันคำสั่งต้นฉบับไว้โดยไม่เปลี่ยนแปลง
- รักษาการอ่านเนื้อหาไฟล์แบบตรงตัวและคำสั่งอื่น ๆ ที่ tokenjuice ควรปล่อยไว้เป็นข้อมูลดิบ
- ยังคงเป็นแบบเลือกใช้: ปิด plugin หากคุณต้องการเอาต์พุตแบบตรงตัวทุกที่

## ตรวจสอบว่ามันทำงานอยู่

1. เปิดใช้งาน plugin
2. เริ่มเซสชันที่สามารถเรียก `exec` ได้
3. รันคำสั่งที่มีสัญญาณรบกวน เช่น `git status`
4. ตรวจสอบว่าผลลัพธ์ของเครื่องมือที่ส่งกลับสั้นกว่าและมีโครงสร้างมากกว่าเอาต์พุต shell แบบดิบ

## ปิดใช้งาน plugin

```bash
openclaw config set plugins.entries.tokenjuice.enabled false
```

หรือ:

```bash
openclaw plugins disable tokenjuice
```

## ที่เกี่ยวข้อง

- [เครื่องมือ Exec](/th/tools/exec)
- [ระดับการคิด](/th/tools/thinking)
- [Context engine](/th/concepts/context-engine)
