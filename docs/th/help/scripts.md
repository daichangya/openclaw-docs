---
read_when:
    - การรันสคริปต์จากรีโป
    - การเพิ่มหรือแก้ไขสคริปต์ภายใต้ `./scripts`
summary: 'สคริปต์ของรีโป: จุดประสงค์ ขอบเขต และข้อควรระวังด้านความปลอดภัย'
title: สคริปต์
x-i18n:
    generated_at: "2026-04-23T05:37:47Z"
    model: gpt-5.4
    provider: openai
    source_hash: 3ecf1e9327929948fb75f80e306963af49b353c0aa8d3b6fa532ca964ff8b975
    source_path: help/scripts.md
    workflow: 15
---

# สคริปต์

ไดเรกทอรี `scripts/` มีสคริปต์ตัวช่วยสำหรับเวิร์กโฟลว์ภายในเครื่องและงาน ops
ให้ใช้เมื่อเห็นชัดว่างานนั้นผูกกับสคริปต์โดยตรง; หากไม่ใช่ ให้เลือกใช้ CLI ก่อน

## ข้อตกลง

- สคริปต์เป็น **ตัวเลือกเสริม** เว้นแต่จะมีการอ้างถึงในเอกสารหรือเช็กลิสต์ของรีลีส
- ให้เลือกใช้พื้นผิวของ CLI เมื่อมีอยู่แล้ว (ตัวอย่าง: การตรวจสอบการยืนยันตัวตนใช้ `openclaw models status --check`)
- ให้ถือว่าสคริปต์อาจผูกกับโฮสต์เฉพาะ; อ่านสคริปต์ก่อนรันบนเครื่องใหม่เสมอ

## สคริปต์ตรวจสอบการยืนยันตัวตน

การตรวจสอบการยืนยันตัวตนครอบคลุมอยู่ใน [Authentication](/th/gateway/authentication) แล้ว สคริปต์ภายใต้ `scripts/` เป็นเพียงส่วนเสริมแบบไม่บังคับสำหรับเวิร์กโฟลว์ systemd/Termux บนโทรศัพท์

## ตัวช่วยอ่าน GitHub

ใช้ `scripts/gh-read` เมื่อต้องการให้ `gh` ใช้ GitHub App installation token สำหรับการเรียกอ่านแบบมีขอบเขตระดับรีโป ขณะเดียวกันก็ยังคงให้ `gh` ปกติใช้ล็อกอินส่วนตัวของคุณสำหรับการกระทำแบบเขียน

env ที่จำเป็น:

- `OPENCLAW_GH_READ_APP_ID`
- `OPENCLAW_GH_READ_PRIVATE_KEY_FILE`

env แบบไม่บังคับ:

- `OPENCLAW_GH_READ_INSTALLATION_ID` เมื่อต้องการข้ามการค้นหา installation แบบอิงรีโป
- `OPENCLAW_GH_READ_PERMISSIONS` เป็น override แบบคั่นด้วยจุลภาคสำหรับชุด permission การอ่านที่จะร้องขอ

ลำดับการ resolve รีโป:

- `gh ... -R owner/repo`
- `GH_REPO`
- `git remote origin`

ตัวอย่าง:

- `scripts/gh-read pr view 123`
- `scripts/gh-read run list -R openclaw/openclaw`
- `scripts/gh-read api repos/openclaw/openclaw/pulls/123`

## เมื่อต้องเพิ่มสคริปต์

- ทำให้สคริปต์มีขอบเขตชัดเจนและมีเอกสารกำกับ
- เพิ่มรายการสั้น ๆ ในเอกสารที่เกี่ยวข้อง (หรือสร้างขึ้นหากยังไม่มี)
