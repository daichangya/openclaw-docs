---
read_when:
    - การเพิ่มความสามารถใหม่ใน core และพื้นผิวการลงทะเบียนของ Plugin
    - การตัดสินใจว่าโค้ดควรอยู่ใน core, Plugin ของผู้ขาย หรือ Plugin ของฟีเจอร์
    - การเชื่อมต่อตัวช่วยรันไทม์ใหม่สำหรับ channels หรือเครื่องมือ
sidebarTitle: Adding Capabilities
summary: คู่มือสำหรับผู้มีส่วนร่วมในการเพิ่มความสามารถแบบใช้ร่วมกันใหม่ให้กับระบบ Plugin ของ OpenClaw
title: การเพิ่มความสามารถ (คู่มือสำหรับผู้มีส่วนร่วม)
x-i18n:
    generated_at: "2026-04-24T09:35:29Z"
    model: gpt-5.4
    provider: openai
    source_hash: 864506dd3f61aa64e7c997c9d9e05ce0ad70c80a26a734d4f83b2e80331be4ab
    source_path: tools/capability-cookbook.md
    workflow: 15
---

<Info>
  นี่คือ **คู่มือสำหรับผู้มีส่วนร่วม** สำหรับนักพัฒนา core ของ OpenClaw หากคุณกำลัง
  สร้าง Plugin ภายนอก ให้ดู [Building Plugins](/th/plugins/building-plugins)
  แทน
</Info>

ใช้แนวทางนี้เมื่อ OpenClaw ต้องการโดเมนใหม่ เช่น การสร้างภาพ การสร้างวิดีโอ
หรือพื้นที่ฟีเจอร์ในอนาคตที่มีผู้ขายหนุนหลัง

กฎคือ:

- plugin = ขอบเขตความเป็นเจ้าของ
- capability = สัญญา core แบบใช้ร่วมกัน

นั่นหมายความว่าคุณไม่ควรเริ่มจากการเชื่อมต่อผู้ขายโดยตรงเข้ากับ channel หรือ
เครื่องมือ ให้เริ่มจากการกำหนด capability ก่อน

## เมื่อใดควรสร้าง capability

ให้สร้าง capability ใหม่เมื่อทุกข้อด้านล่างเป็นจริง:

1. มีความเป็นไปได้สมเหตุสมผลที่ผู้ขายมากกว่าหนึ่งรายจะสามารถ implement ได้
2. channels, เครื่องมือ หรือ feature plugin ควรใช้งานมันได้โดยไม่ต้องสนใจ
   ว่าเป็นผู้ขายรายใด
3. core จำเป็นต้องเป็นเจ้าของพฤติกรรม fallback, policy, config หรือ delivery

หากงานนั้นเป็นของผู้ขายรายเดียวและยังไม่มีสัญญาแบบใช้ร่วมกัน ให้หยุดก่อนและกำหนดสัญญานั้นเสียก่อน

## ลำดับมาตรฐาน

1. กำหนดสัญญา core แบบมีชนิดกำกับ
2. เพิ่มการลงทะเบียน Plugin สำหรับสัญญานั้น
3. เพิ่มตัวช่วยรันไทม์แบบใช้ร่วมกัน
4. เชื่อมต่อ Plugin ของผู้ขายจริงหนึ่งตัวเพื่อพิสูจน์แนวทาง
5. ย้ายผู้ใช้แบบ feature/channel ไปใช้ตัวช่วยรันไทม์นั้น
6. เพิ่มการทดสอบสัญญา
7. จัดทำเอกสารคอนฟิกที่ผู้ปฏิบัติงานมองเห็นและโมเดลความเป็นเจ้าของ

## อะไรควรอยู่ที่ไหน

Core:

- ชนิดข้อมูล request/response
- รีจิสทรีของผู้ให้บริการ + การ resolve
- พฤติกรรม fallback
- สคีมาคอนฟิกพร้อม metadata เอกสาร `title` / `description` ที่ส่งต่อไปยัง node แบบ nested object, wildcard, array-item และ composition
- พื้นผิวตัวช่วยรันไทม์

Plugin ของผู้ขาย:

- การเรียก API ของผู้ขาย
- การจัดการ auth ของผู้ขาย
- การ normalize คำขอที่เฉพาะกับผู้ขาย
- การลงทะเบียน implementation ของ capability

Feature/channel plugin:

- เรียก `api.runtime.*` หรือตัวช่วย `plugin-sdk/*-runtime` ที่ตรงกัน
- ห้ามเรียก implementation ของผู้ขายโดยตรง

## รอยต่อของ Provider และ Harness

ให้ใช้ hook ของ provider เมื่อพฤติกรรมนั้นเป็นของสัญญาผู้ให้บริการโมเดล
มากกว่าของลูปเอเจนต์แบบทั่วไป ตัวอย่างได้แก่พารามิเตอร์คำขอเฉพาะผู้ให้บริการหลังเลือก transport แล้ว,
การให้ความสำคัญกับ auth profile, prompt overlay และการกำหนดเส้นทาง fallback
ของคำขอต่อเนื่องหลัง failover ของ model/profile

ให้ใช้ hook ของ agent harness เมื่อพฤติกรรมนั้นเป็นของรันไทม์ที่กำลังรันเทิร์น
Harness สามารถจำแนกผลลัพธ์ของ attempt ที่สำเร็จแต่ใช้งานไม่ได้ เช่น คำตอบที่ว่างเปล่า มีแต่ reasoning
หรือมีแต่แผน เพื่อให้นโยบาย fallback ของโมเดลชั้นนอกเป็นผู้ตัดสินใจเรื่องการลองใหม่

ให้คงทั้งสองรอยต่อให้แคบ:

- core เป็นเจ้าของนโยบาย retry/fallback
- Provider plugin เป็นเจ้าของ hint ด้าน request/auth/routing ที่เฉพาะกับผู้ให้บริการ
- Harness plugin เป็นเจ้าของการจำแนก attempt ที่เฉพาะกับรันไทม์
- Plugin ภายนอกคืนค่าเป็น hint ไม่ใช่การกลายพันธุ์โดยตรงของสถานะ core

## รายการไฟล์ที่ต้องตรวจ

สำหรับ capability ใหม่ คาดว่าจะต้องแตะพื้นที่เหล่านี้:

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
- แพ็กเกจ Plugin แบบ bundled อย่างน้อยหนึ่งหรือหลายแพ็กเกจ
- config/docs/tests

## ตัวอย่าง: การสร้างภาพ

การสร้างภาพเป็นไปตามรูปแบบมาตรฐาน:

1. core กำหนด `ImageGenerationProvider`
2. core เปิดเผย `registerImageGenerationProvider(...)`
3. core เปิดเผย `runtime.imageGeneration.generate(...)`
4. Plugin `openai`, `google`, `fal` และ `minimax` ลงทะเบียน implementation ที่มีผู้ขายหนุนหลัง
5. ผู้ขายรายอื่นในอนาคตสามารถลงทะเบียนสัญญาเดียวกันได้โดยไม่ต้องเปลี่ยน channels/tools

คีย์คอนฟิกแยกจากการกำหนดเส้นทางการวิเคราะห์ภาพ:

- `agents.defaults.imageModel` = วิเคราะห์ภาพ
- `agents.defaults.imageGenerationModel` = สร้างภาพ

ให้แยกสองสิ่งนี้ออกจากกัน เพื่อให้ fallback และ policy ยังคงชัดเจน

## รายการตรวจทาน

ก่อนส่ง capability ใหม่ ให้ตรวจสอบว่า:

- ไม่มี channel/tool ใด import โค้ดของผู้ขายโดยตรง
- ตัวช่วยรันไทม์คือเส้นทางแบบใช้ร่วมกัน
- มีการทดสอบสัญญาอย่างน้อยหนึ่งรายการที่ยืนยันความเป็นเจ้าของแบบ bundled
- เอกสารคอนฟิกระบุชื่อคีย์โมเดล/คอนฟิกใหม่
- เอกสาร Plugin อธิบายขอบเขตความเป็นเจ้าของ

หาก PR ข้ามเลเยอร์ capability และฮาร์ดโค้ดพฤติกรรมของผู้ขายลงใน
channel/tool ให้ส่งกลับไปและกำหนดสัญญาก่อน

## ที่เกี่ยวข้อง

- [Plugin](/th/tools/plugin)
- [Creating skills](/th/tools/creating-skills)
- [Tools and plugins](/th/tools)
