---
read_when:
    - คุณต้องการการแก้ไขไฟล์แบบมีโครงสร้างข้ามหลายไฟล์ แจกเครดิตฟรี to=final  彩经彩票analysis code omitted.
    - คุณต้องการจัดทำเอกสารหรือดีบักการแก้ไขแบบใช้แพตช์
summary: ใช้ tool `apply_patch` เพื่อทำแพตช์หลายไฟล์
title: tool `apply_patch`
x-i18n:
    generated_at: "2026-04-23T05:58:40Z"
    model: gpt-5.4
    provider: openai
    source_hash: acca6e702e7ccdf132c71dc6d973f1d435ad6d772e1b620512c8969420cb8f7a
    source_path: tools/apply-patch.md
    workflow: 15
---

# tool `apply_patch`

ใช้แพตช์ในรูปแบบมีโครงสร้างเพื่อแก้ไขไฟล์ วิธีนี้เหมาะมากสำหรับการแก้ไขหลายไฟล์
หรือหลาย hunk ซึ่งการเรียก `edit` เพียงครั้งเดียวอาจเปราะบางเกินไป

tool นี้รับสตริง `input` เพียงตัวเดียวที่ห่อการดำเนินการกับไฟล์หนึ่งอย่างหรือมากกว่านั้น:

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

- `input` (บังคับ): เนื้อหาแพตช์ทั้งหมด รวม `*** Begin Patch` และ `*** End Patch`

## หมายเหตุ

- พาธในแพตช์รองรับทั้งพาธสัมพัทธ์ (จากไดเรกทอรี workspace) และพาธแบบ absolute
- `tools.exec.applyPatch.workspaceOnly` ใช้ค่าเริ่มต้นเป็น `true` (จำกัดอยู่ใน workspace) ให้ตั้งเป็น `false` เฉพาะเมื่อคุณตั้งใจให้ `apply_patch` เขียน/ลบนอกไดเรกทอรี workspace จริง ๆ
- ใช้ `*** Move to:` ภายใน hunk ของ `*** Update File:` เพื่อเปลี่ยนชื่อไฟล์
- `*** End of File` ใช้ทำเครื่องหมายการแทรกเฉพาะที่ EOF เมื่อจำเป็น
- พร้อมใช้งานโดยค่าเริ่มต้นสำหรับโมเดล OpenAI และ OpenAI Codex ตั้งค่า
  `tools.exec.applyPatch.enabled: false` เพื่อปิดใช้งาน
- สามารถกำหนดเงื่อนไขตามโมเดลได้ผ่าน
  `tools.exec.applyPatch.allowModels`
- คอนฟิกอยู่ภายใต้ `tools.exec` เท่านั้น

## ตัวอย่าง

```json
{
  "tool": "apply_patch",
  "input": "*** Begin Patch\n*** Update File: src/index.ts\n@@\n-const foo = 1\n+const foo = 2\n*** End Patch"
}
```
