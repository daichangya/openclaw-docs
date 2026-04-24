---
read_when:
    - กำลังอัปเดต UI การตั้งค่า Skills บน macOS
    - กำลังเปลี่ยนการควบคุมการใช้งาน Skills หรือพฤติกรรมการติดตั้ง
summary: UI การตั้งค่า Skills บน macOS และสถานะที่รองรับโดย gateway
title: Skills (macOS)
x-i18n:
    generated_at: "2026-04-24T09:22:13Z"
    model: gpt-5.4
    provider: openai
    source_hash: dcd89d27220644866060d0f9954a116e6093d22f7ebd32d09dc16871c25b988e
    source_path: platforms/mac/skills.md
    workflow: 15
---

แอป macOS แสดง Skills ของ OpenClaw ผ่าน gateway; มันไม่ได้ parse Skills ในเครื่องเอง

## แหล่งข้อมูล

- `skills.status` (gateway) จะส่งคืน Skills ทั้งหมดพร้อม eligibility และ missing requirements
  (รวมถึง allowlist blocks สำหรับ bundled skills)
- Requirements ถูกดึงมาจาก `metadata.openclaw.requires` ใน `SKILL.md` ของแต่ละรายการ

## การติดตั้ง

- `metadata.openclaw.install` กำหนดตัวเลือกการติดตั้ง (brew/node/go/uv)
- แอปจะเรียก `skills.install` เพื่อรัน installers บนโฮสต์ gateway
- `critical` findings ของ dangerous-code ที่มีมาในตัวจะบล็อก `skills.install` เป็นค่าเริ่มต้น; ส่วน suspicious findings ยังคงเป็นเพียงคำเตือนเท่านั้น override สำหรับ dangerous มีอยู่ในคำขอของ gateway แต่ flow เริ่มต้นของแอปยังคง fail-closed
- หากตัวเลือกการติดตั้งทั้งหมดเป็น `download`, gateway จะแสดงตัวเลือกการดาวน์โหลดทั้งหมด
- มิฉะนั้น gateway จะเลือก installer ที่ต้องการหนึ่งตัวโดยอิงจาก install preferences ปัจจุบันและ binaries บนโฮสต์: Homebrew มาก่อนเมื่อเปิดใช้
  `skills.install.preferBrew` และมี `brew` อยู่ จากนั้น `uv` จากนั้น
  node manager ที่กำหนดใน `skills.install.nodeManager` แล้วค่อยเป็น
  fallbacks อื่นๆ เช่น `go` หรือ `download`
- ป้ายกำกับการติดตั้งของ Node จะสะท้อน node manager ที่กำหนดไว้ รวมถึง `yarn`

## Env/API keys

- แอปจะเก็บคีย์ไว้ใน `~/.openclaw/openclaw.json` ภายใต้ `skills.entries.<skillKey>`
- `skills.update` จะ patch ค่า `enabled`, `apiKey` และ `env`

## Remote mode

- การติดตั้ง + การอัปเดต config จะเกิดขึ้นบนโฮสต์ gateway (ไม่ใช่บน Mac ในเครื่อง)

## ที่เกี่ยวข้อง

- [Skills](/th/tools/skills)
- [macOS app](/th/platforms/macos)
