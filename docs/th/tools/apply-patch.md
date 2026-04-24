---
read_when:
    - คุณต้องการแก้ไขไฟล์หลายไฟล์แบบมีโครงสร้าง
    - คุณต้องการจัดทำเอกสารหรือแก้ปัญหาการแก้ไขแบบอิงแพตช์
summary: ใช้เครื่องมือ apply_patch เพื่อแก้ไขแพตช์หลายไฟล์
title: เครื่องมือ apply_patch
x-i18n:
    generated_at: "2026-04-24T09:34:50Z"
    model: gpt-5.4
    provider: openai
    source_hash: 9ed6d8282166de3cacf5be7f253498a230bceb2ad6c82a08846aed5bc613da53
    source_path: tools/apply-patch.md
    workflow: 15
---

ใช้การเปลี่ยนแปลงไฟล์ผ่านรูปแบบแพตช์แบบมีโครงสร้าง เหมาะอย่างยิ่งสำหรับ
การแก้ไขหลายไฟล์หรือหลาย hunk ที่การเรียก `edit` ครั้งเดียวอาจเปราะบางเกินไป

เครื่องมือนี้ยอมรับสตริง `input` เพียงค่าเดียวที่ห่อหนึ่งหรือหลายการดำเนินการกับไฟล์:

```
*** Begin Patch
*** Add File: path/to/file.txt
+line 1
+line 2
*** Update File: src/app.ts
@@
-old line
+new line
*** Delete File: obsolete.txt
*** End Patch
```

## พารามิเตอร์

- `input` (จำเป็น): เนื้อหาแพตช์ทั้งหมด รวม `*** Begin Patch` และ `*** End Patch`

## หมายเหตุ

- พาธในแพตช์รองรับทั้งพาธแบบ relative (อิงจากไดเรกทอรี workspace) และพาธแบบ absolute
- `tools.exec.applyPatch.workspaceOnly` มีค่าปริยายเป็น `true` (จำกัดอยู่ภายใน workspace) ตั้งเป็น `false` เฉพาะเมื่อคุณตั้งใจให้ `apply_patch` เขียน/ลบภายนอกไดเรกทอรี workspace จริง ๆ
- ใช้ `*** Move to:` ภายใน hunk ของ `*** Update File:` เพื่อเปลี่ยนชื่อไฟล์
- `*** End of File` ใช้ทำเครื่องหมายการแทรกเฉพาะที่ EOF เมื่อจำเป็น
- พร้อมใช้งานเป็นค่าปริยายสำหรับโมเดล OpenAI และ OpenAI Codex ตั้ง
  `tools.exec.applyPatch.enabled: false` เพื่อปิดใช้งาน
- สามารถกำหนดเกตตามโมเดลแบบไม่บังคับผ่าน
  `tools.exec.applyPatch.allowModels`
- คอนฟิกอยู่ภายใต้ `tools.exec` เท่านั้น

## ตัวอย่าง

```json
{
  "tool": "apply_patch",
  "input": "*** Begin Patch\n*** Update File: src/index.ts\n@@\n-const foo = 1\n+const foo = 2\n*** End Patch"
}
```

## ที่เกี่ยวข้อง

- [Diffs](/th/tools/diffs)
- [เครื่องมือ Exec](/th/tools/exec)
- [การรันโค้ด](/th/tools/code-execution)
