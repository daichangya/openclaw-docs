---
read_when:
    - การเพิ่ม core capability ใหม่และพื้นผิวสำหรับการลงทะเบียน Plugin
    - การตัดสินใจว่าโค้ดควรอยู่ใน core, vendor Plugin หรือ feature Plugin】【。】【”】【analysis to=final code omitted because translate only.
    - การเชื่อม runtime helper ใหม่สำหรับ channels หรือเครื่องมือ
sidebarTitle: Adding Capabilities
summary: คู่มือสำหรับผู้ร่วมพัฒนาในการเพิ่มความสามารถแบบใช้ร่วมกันใหม่เข้าสู่ระบบ Plugin ของ OpenClaw
title: การเพิ่ม Capabilities (คู่มือสำหรับผู้ร่วมพัฒนา)
x-i18n:
    generated_at: "2026-04-23T05:59:24Z"
    model: gpt-5.4
    provider: openai
    source_hash: 29604d88e6df5205b835d71f3078b6223c58b6294135c3e201756c1bcac33ea3
    source_path: tools/capability-cookbook.md
    workflow: 15
---

# การเพิ่ม Capabilities

<Info>
  นี่คือ **คู่มือสำหรับผู้ร่วมพัฒนา** สำหรับนักพัฒนา core ของ OpenClaw หากคุณ
  กำลังสร้าง Plugin ภายนอก โปรดดู [Building Plugins](/th/plugins/building-plugins)
  แทน
</Info>

ใช้เอกสารนี้เมื่อ OpenClaw ต้องการโดเมนใหม่ เช่นการสร้างภาพ การสร้างวิดีโอ
หรือพื้นที่ฟีเจอร์ในอนาคตที่มี vendor รองรับอยู่เบื้องหลัง

กฎคือ:

- plugin = ขอบเขตความเป็นเจ้าของ
- capability = สัญญา core แบบใช้ร่วมกัน

นั่นหมายความว่าคุณไม่ควรเริ่มจากการ wire vendor เข้าไปใน channel หรือ
tool โดยตรง ให้เริ่มจากการนิยาม capability ก่อน

## ควรสร้าง capability เมื่อใด

ให้สร้าง capability ใหม่เมื่อทุกข้อเหล่านี้เป็นจริง:

1. มี vendor มากกว่าหนึ่งรายที่น่าจะ implement ได้
2. channels, tools หรือ feature plugins ควรใช้มันได้โดยไม่ต้องสนใจว่า
   vendor คือใคร
3. core ต้องเป็นเจ้าของพฤติกรรม fallback, policy, config หรือ delivery

หากงานนั้นยังเป็น vendor-only และยังไม่มีสัญญาแบบใช้ร่วมกัน ให้หยุดก่อนแล้วนิยามสัญญานั้นขึ้นมาก่อน

## ลำดับมาตรฐาน

1. นิยาม typed core contract
2. เพิ่ม plugin registration สำหรับ contract นั้น
3. เพิ่ม shared runtime helper
4. wire vendor plugin จริงหนึ่งตัวเพื่อเป็นหลักฐาน
5. ย้ายผู้ใช้แบบ feature/channel มาใช้ runtime helper
6. เพิ่ม contract tests
7. เขียนเอกสาร config ที่ operator ใช้ และโมเดลความเป็นเจ้าของ

## อะไรควรอยู่ที่ไหน

Core:

- request/response types
- provider registry + การ resolve
- พฤติกรรม fallback
- config schema พร้อม `title` / `description` docs metadata ที่ถูก propagate ไปยัง nested object, wildcard, array-item และ composition nodes
- พื้นผิวของ runtime helper

Vendor Plugin:

- การเรียก vendor API
- การจัดการ auth ของ vendor
- การ normalize คำขอแบบเฉพาะ vendor
- การลงทะเบียน implementation ของ capability

Feature/channel Plugin:

- เรียก `api.runtime.*` หรือ helper ที่ตรงกันใน `plugin-sdk/*-runtime`
- ห้ามเรียก vendor implementation โดยตรง

## เช็กลิสต์ของไฟล์

สำหรับ capability ใหม่ ให้คาดว่าจะต้องแตะพื้นที่เหล่านี้:

- `src/<capability>/types.ts`
- `src/<capability>/...registry/runtime.ts`
- `src/plugins/types.ts`
- `src/plugins/registry.ts`
- `src/plugins/captured-registration.ts`
- `src/plugins/contracts/registry.ts`
- `src/plugins/runtime/types-core.ts`
- `src/plugins/runtime/index.ts`
- `src/plugin-sdk/<capability>.ts`
- `src/plugin-sdk/<capability>-runtime.ts`
- bundled plugin packages อย่างน้อยหนึ่งแพ็กเกจขึ้นไป
- config/docs/tests

## ตัวอย่าง: การสร้างภาพ

การสร้างภาพใช้โครงสร้างมาตรฐานดังนี้:

1. core นิยาม `ImageGenerationProvider`
2. core เปิดเผย `registerImageGenerationProvider(...)`
3. core เปิดเผย `runtime.imageGeneration.generate(...)`
4. plugins `openai`, `google`, `fal` และ `minimax` ลงทะเบียน implementations ที่รองรับโดย vendor
5. vendors ในอนาคตสามารถลงทะเบียนสัญญาเดียวกันนี้ได้โดยไม่ต้องเปลี่ยน channels/tools

คีย์ config จะแยกจากการกำหนดเส้นทาง vision-analysis:

- `agents.defaults.imageModel` = วิเคราะห์ภาพ
- `agents.defaults.imageGenerationModel` = สร้างภาพ

ให้แยกสองอย่างนี้ออกจากกัน เพื่อให้ fallback และ policy ยังคงชัดเจน

## เช็กลิสต์สำหรับการ review

ก่อนปล่อย capability ใหม่ ให้ตรวจสอบว่า:

- ไม่มี channel/tool ใด import vendor code โดยตรง
- runtime helper คือเส้นทางร่วม
- มี contract test อย่างน้อยหนึ่งตัวที่ยืนยันความเป็นเจ้าของแบบ bundled
- เอกสาร config ระบุชื่อ model/config key ใหม่
- เอกสารของ Plugin อธิบายขอบเขตความเป็นเจ้าของ

หาก PR ข้ามชั้น capability และ hardcode พฤติกรรมของ vendor เข้าไปใน
channel/tool ให้ส่งกลับและนิยาม contract ก่อน
