---
read_when:
    - การทำความเข้าใจว่าเกิดอะไรขึ้นในการรันเอเจนต์ครั้งแรก
    - การอธิบายว่าไฟล์สำหรับการบูตสแตรปอยู่ที่ใด
    - การแก้ไขปัญหาการตั้งค่าตัวตนระหว่าง onboarding
sidebarTitle: Bootstrapping
summary: พิธีบูตสแตรปของเอเจนต์ที่วางเมล็ดไฟล์ workspace และตัวตน
title: การบูตสแตรปของเอเจนต์
x-i18n:
    generated_at: "2026-04-23T05:56:56Z"
    model: gpt-5.4
    provider: openai
    source_hash: 4a08b5102f25c6c4bcdbbdd44384252a9e537b245a7b070c4961a72b4c6c6601
    source_path: start/bootstrapping.md
    workflow: 15
---

# การบูตสแตรปของเอเจนต์

การบูตสแตรปคือพิธีกรรมแบบ **รันครั้งแรก** ที่เตรียม workspace ของเอเจนต์และ
รวบรวมรายละเอียดตัวตน มันจะเกิดขึ้นหลัง onboarding เมื่อเอเจนต์เริ่มทำงาน
เป็นครั้งแรก

## การบูตสแตรปทำอะไรบ้าง

ในการรันเอเจนต์ครั้งแรก OpenClaw จะบูตสแตรป workspace (ค่าเริ่มต้น
`~/.openclaw/workspace`):

- วาง `AGENTS.md`, `BOOTSTRAP.md`, `IDENTITY.md`, `USER.md`
- รันพิธีถาม-ตอบแบบสั้น (ถามครั้งละหนึ่งคำถาม)
- เขียนตัวตน + ค่ากำหนดไว้ใน `IDENTITY.md`, `USER.md`, `SOUL.md`
- ลบ `BOOTSTRAP.md` เมื่อเสร็จ เพื่อให้รันเพียงครั้งเดียว

## มันรันที่ไหน

การบูตสแตรปจะรันบน **โฮสต์ gateway** เสมอ หากแอป macOS เชื่อมต่อกับ
Gateway ระยะไกล workspace และไฟล์สำหรับการบูตสแตรปจะอยู่บนเครื่อง
ระยะไกลนั้น

<Note>
เมื่อ Gateway รันอยู่บนอีกเครื่องหนึ่ง ให้แก้ไขไฟล์ workspace บนโฮสต์ gateway
(เช่น `user@gateway-host:~/.openclaw/workspace`)
</Note>

## เอกสารที่เกี่ยวข้อง

- การเริ่มต้นใช้งานบนแอป macOS: [Onboarding](/th/start/onboarding)
- โครงสร้าง workspace: [Agent workspace](/th/concepts/agent-workspace)
