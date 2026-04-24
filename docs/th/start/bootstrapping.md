---
read_when:
    - 'การทำความเข้าใจว่าเกิดอะไรขึ้นในการรันเอเจนต์ครั้งแรก【อ่านข้อความเต็มanalysis to=final  content: translate only. Need produce Thai.'
    - การอธิบายว่าไฟล์สำหรับ bootstrap อยู่ที่ใด
    - การแก้ปัญหาการตั้งค่าตัวตนระหว่าง onboarding
sidebarTitle: Bootstrapping
summary: พิธี bootstrap ของเอเจนต์ที่วางไฟล์เริ่มต้นสำหรับ workspace และตัวตน
title: การ bootstrap ของเอเจนต์
x-i18n:
    generated_at: "2026-04-24T09:33:32Z"
    model: gpt-5.4
    provider: openai
    source_hash: 0c23a204a7afbf2ca0c0d19a227286cf0ae396181073403055db41dafa764d2a
    source_path: start/bootstrapping.md
    workflow: 15
---

การ bootstrap คือพิธี **การรันครั้งแรก** ที่ใช้เตรียม workspace ของเอเจนต์และ
รวบรวมรายละเอียดด้านตัวตน มันจะเกิดขึ้นหลัง onboarding เมื่อเอเจนต์เริ่มทำงาน
เป็นครั้งแรก

## สิ่งที่การ bootstrap ทำ

ในการรันเอเจนต์ครั้งแรก OpenClaw จะ bootstrap workspace (ค่าปริยายคือ
`~/.openclaw/workspace`):

- วางไฟล์เริ่มต้น `AGENTS.md`, `BOOTSTRAP.md`, `IDENTITY.md`, `USER.md`
- รันพิธีถาม-ตอบสั้น ๆ (ถามทีละคำถาม)
- เขียนข้อมูลตัวตน + ความชอบลงใน `IDENTITY.md`, `USER.md`, `SOUL.md`
- ลบ `BOOTSTRAP.md` เมื่อเสร็จสิ้น เพื่อให้รันเพียงครั้งเดียว

## มันทำงานที่ไหน

การ bootstrap จะทำงานบน **โฮสต์ของ gateway** เสมอ หากแอป macOS เชื่อมต่อไปยัง
Gateway แบบ remote workspace และไฟล์ bootstrap จะอยู่บน
เครื่องระยะไกลนั้น

<Note>
เมื่อ Gateway รันอยู่บนอีกเครื่องหนึ่ง ให้แก้ไขไฟล์ใน workspace บนโฮสต์ของ gateway
(เช่น `user@gateway-host:~/.openclaw/workspace`)
</Note>

## เอกสารที่เกี่ยวข้อง

- onboarding ของแอป macOS: [Onboarding](/th/start/onboarding)
- โครงสร้าง workspace: [workspace ของเอเจนต์](/th/concepts/agent-workspace)
