---
read_when:
    - กำลังอัปเดต UI การตั้งค่า Skills บน macOS
    - กำลังเปลี่ยน gating ของ Skills หรือพฤติกรรมการติดตั้ง
summary: UI การตั้งค่า Skills บน macOS และสถานะที่ขับเคลื่อนโดย gateway
title: Skills (macOS)
x-i18n:
    generated_at: "2026-04-23T05:45:22Z"
    model: gpt-5.4
    provider: openai
    source_hash: 7ffd6744646d2c8770fa12a5e511f84a40b5ece67181139250ec4cc4301b49b8
    source_path: platforms/mac/skills.md
    workflow: 15
---

# Skills (macOS)

แอป macOS แสดง Skills ของ OpenClaw ผ่าน gateway; มันไม่ได้ parse skill ในเครื่อง

## แหล่งข้อมูล

- `skills.status` (gateway) จะคืน skill ทั้งหมดพร้อม eligibility และข้อกำหนดที่ขาดหาย
  (รวมถึงการถูกบล็อกโดย allowlist สำหรับ skill ที่มากับระบบ)
- ข้อกำหนดถูกอนุมานจาก `metadata.openclaw.requires` ในแต่ละ `SKILL.md`

## การดำเนินการติดตั้ง

- `metadata.openclaw.install` กำหนดตัวเลือกการติดตั้ง (brew/node/go/uv)
- แอปจะเรียก `skills.install` เพื่อรันตัวติดตั้งบนโฮสต์ gateway
- finding ระดับ `critical` จากการสแกนโค้ดอันตรายแบบ built-in จะบล็อก `skills.install` โดยค่าเริ่มต้น; finding แบบ suspicious ยังคงเป็นเพียงคำเตือน การ override แบบอันตรายมีอยู่บนคำขอของ gateway แต่โฟลว์เริ่มต้นของแอปยังคง fail-closed
- หากทุกตัวเลือกการติดตั้งเป็น `download`, gateway จะส่ง
  ตัวเลือกการดาวน์โหลดทั้งหมดกลับมา
- มิฉะนั้น gateway จะเลือกตัวติดตั้งที่เหมาะสมหนึ่งตัวโดยใช้
  ค่ากำหนดการติดตั้งปัจจุบันและไบนารีบนโฮสต์: Homebrew ก่อนเมื่อ
  เปิดใช้ `skills.install.preferBrew` และมี `brew`, จากนั้น `uv`, แล้วจึงเป็น
  node manager ที่กำหนดไว้ใน `skills.install.nodeManager`, แล้วจึงเป็น
  fallback ภายหลังเช่น `go` หรือ `download`
- ป้ายกำกับการติดตั้ง Node จะสะท้อน node manager ที่กำหนดไว้ รวมถึง `yarn`

## Env/API key

- แอปจะเก็บคีย์ไว้ใน `~/.openclaw/openclaw.json` ภายใต้ `skills.entries.<skillKey>`
- `skills.update` จะ patch ค่า `enabled`, `apiKey`, และ `env`

## โหมดรีโมต

- การติดตั้ง + การอัปเดต config จะเกิดขึ้นบนโฮสต์ gateway (ไม่ใช่บน Mac ในเครื่อง)
