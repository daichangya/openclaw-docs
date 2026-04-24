---
read_when:
    - การรันสคริปต์จาก repository
    - การเพิ่มหรือแก้ไขสคริปต์ภายใต้ ./scripts
summary: 'สคริปต์ของ repository: วัตถุประสงค์ ขอบเขต และข้อควรระวังด้านความปลอดภัย'
title: สคริปต์
x-i18n:
    generated_at: "2026-04-24T09:15:02Z"
    model: gpt-5.4
    provider: openai
    source_hash: 8d76777402670abe355b9ad2a0337f96211af1323e36f2ab1ced9f04f87083f5
    source_path: help/scripts.md
    workflow: 15
---

ไดเรกทอรี `scripts/` มีสคริปต์ตัวช่วยสำหรับเวิร์กโฟลว์ภายในเครื่องและงานปฏิบัติการ
ให้ใช้สิ่งเหล่านี้เมื่องานนั้นผูกกับสคริปต์อย่างชัดเจน; นอกเหนือจากนั้นให้เลือกใช้ CLI

## ข้อตกลง

- สคริปต์เป็น **ทางเลือก** เว้นแต่จะมีการอ้างอิงในเอกสารหรือเช็กลิสต์ของรีลีส
- ให้เลือกใช้พื้นผิวของ CLI ก่อนเมื่อมีอยู่แล้ว (ตัวอย่าง: การติดตาม auth ใช้ `openclaw models status --check`)
- ให้ถือว่าสคริปต์ขึ้นกับโฮสต์; อ่านก่อนรันบนเครื่องใหม่

## สคริปต์ติดตาม auth

การติดตาม auth มีครอบคลุมอยู่ใน [Authentication](/th/gateway/authentication) แล้ว สคริปต์ภายใต้ `scripts/` เป็นส่วนเสริมแบบไม่บังคับสำหรับเวิร์กโฟลว์ systemd/Termux บนโทรศัพท์

## ตัวช่วยอ่าน GitHub

ใช้ `scripts/gh-read` เมื่อคุณต้องการให้ `gh` ใช้ GitHub App installation token สำหรับการเรียกอ่านแบบมีขอบเขตระดับ repo ขณะเดียวกันก็ให้ `gh` ปกติยังใช้การล็อกอินส่วนตัวของคุณสำหรับการกระทำแบบเขียน

env ที่จำเป็น:

- `OPENCLAW_GH_READ_APP_ID`
- `OPENCLAW_GH_READ_PRIVATE_KEY_FILE`

env แบบไม่บังคับ:

- `OPENCLAW_GH_READ_INSTALLATION_ID` หากคุณต้องการข้ามการค้นหา installation ตาม repo
- `OPENCLAW_GH_READ_PERMISSIONS` เป็นค่าแทนที่แบบคั่นด้วยจุลภาคสำหรับชุดสิทธิ์การอ่านย่อยที่จะร้องขอ

ลำดับการ resolve repo:

- `gh ... -R owner/repo`
- `GH_REPO`
- `git remote origin`

ตัวอย่าง:

- `scripts/gh-read pr view 123`
- `scripts/gh-read run list -R openclaw/openclaw`
- `scripts/gh-read api repos/openclaw/openclaw/pulls/123`

## เมื่อต้องเพิ่มสคริปต์

- ทำให้สคริปต์มีหน้าที่ชัดเจนและมีเอกสารกำกับ
- เพิ่มรายการสั้น ๆ ในเอกสารที่เกี่ยวข้อง (หรือสร้างเอกสารหากยังไม่มี)

## ที่เกี่ยวข้อง

- [Testing](/th/help/testing)
- [Testing live](/th/help/testing-live)
