---
read_when:
    - คุณต้องการลดการขยายของ context จากผลลัพธ์ของเครื่องมือ
    - คุณต้องการเข้าใจการปรับแต่ง prompt cache ของ Anthropic ให้เหมาะสม
summary: การตัดผลลัพธ์เครื่องมือเก่าเพื่อให้ context กระชับและการแคชมีประสิทธิภาพ
title: Session pruning
x-i18n:
    generated_at: "2026-04-24T09:07:38Z"
    model: gpt-5.4
    provider: openai
    source_hash: af47997b83cd478dac0e2ebb6d277a948713f28651751bec6cff4ef4b70a16c6
    source_path: concepts/session-pruning.md
    workflow: 15
---

Session pruning จะตัด **ผลลัพธ์เครื่องมือเก่า** ออกจาก context ก่อนการเรียก LLM
แต่ละครั้ง ซึ่งช่วยลด context bloat จากผลลัพธ์ของเครื่องมือที่สะสมอยู่ (ผลลัพธ์ exec, การอ่านไฟล์,
ผลลัพธ์การค้นหา) โดยไม่เขียนทับข้อความบทสนทนาปกติ

<Info>
Pruning ทำในหน่วยความจำเท่านั้น -- จะไม่แก้ไข session transcript บนดิสก์
ประวัติทั้งหมดของคุณยังคงถูกเก็บไว้ครบเสมอ
</Info>

## ทำไมจึงสำคัญ

เซสชันยาว ๆ จะสะสมผลลัพธ์ของเครื่องมือซึ่งทำให้ context window พองขึ้น สิ่งนี้
เพิ่มต้นทุนและอาจบังคับให้ต้องทำ [Compaction](/th/concepts/compaction) เร็วกว่าที่จำเป็น

Pruning มีคุณค่าอย่างยิ่งสำหรับ **Anthropic prompt caching** เมื่อ cache
TTL หมดอายุ คำขอถัดไปจะเขียนแคชใหม่ทั้งพรอมป์ต์ Pruning ช่วยลดขนาดการเขียนแคช
ซึ่งลดต้นทุนได้โดยตรง

## วิธีการทำงาน

1. รอให้ cache TTL หมดอายุ (ค่าเริ่มต้น 5 นาที)
2. ค้นหาผลลัพธ์เครื่องมือเก่าสำหรับการ pruning ปกติ (ข้อความบทสนทนายังคงอยู่)
3. **Soft-trim** ผลลัพธ์ที่ใหญ่เกินไป -- เก็บส่วนหัวและส่วนท้าย แล้วแทรก `...`
4. **Hard-clear** ส่วนที่เหลือ -- แทนที่ด้วย placeholder
5. รีเซ็ต TTL เพื่อให้คำขอต่อเนื่องใช้แคชใหม่ร่วมกันได้

## การล้างภาพแบบ legacy

OpenClaw ยังรันการล้างแบบแยกต่างหากที่ idempotent สำหรับเซสชัน legacy เก่าที่
เคยเก็บ raw image blocks ไว้ในประวัติ

- ระบบจะเก็บ **3 เทิร์นที่เสร็จสมบูรณ์ล่าสุด** ไว้แบบ byte-for-byte เพื่อให้
  prefix ของ prompt cache สำหรับ follow-ups ล่าสุดคงที่
- image blocks เก่าที่ผ่านการประมวลผลแล้วในประวัติ `user` หรือ `toolResult`
  สามารถถูกแทนที่ด้วย `[image data removed - already processed by model]`
- สิ่งนี้แยกจาก pruning แบบ cache-TTL ปกติ มีไว้เพื่อหยุดไม่ให้ payload ของภาพที่ซ้ำ
  ทำให้ prompt caches เสียในเทิร์นถัดไป

## ค่าเริ่มต้นอัจฉริยะ

OpenClaw เปิดใช้ pruning อัตโนมัติสำหรับโปรไฟล์ Anthropic:

| ประเภทโปรไฟล์ | เปิดใช้ pruning | Heartbeat |
| ------------------------------------------------------- | --------------- | --------- |
| การยืนยันตัวตนด้วย Anthropic OAuth/token (รวมถึงการใช้ Claude CLI ซ้ำ) | ใช่ | 1 ชั่วโมง |
| API key | ใช่ | 30 นาที |

หากคุณตั้งค่าชัดเจนไว้ OpenClaw จะไม่ override ค่าเหล่านั้น

## เปิดหรือปิดการใช้งาน

Pruning ปิดอยู่ตามค่าเริ่มต้นสำหรับ providers ที่ไม่ใช่ Anthropic หากต้องการเปิดใช้:

```json5
{
  agents: {
    defaults: {
      contextPruning: { mode: "cache-ttl", ttl: "5m" },
    },
  },
}
```

หากต้องการปิด: ตั้ง `mode: "off"`

## Pruning เทียบกับ Compaction

| | Pruning | Compaction |
| ---------- | ------------------ | ----------------------- |
| **สิ่งที่ทำ** | ตัดผลลัพธ์ของเครื่องมือ | สรุปบทสนทนา |
| **บันทึกไว้หรือไม่?** | ไม่ (ต่อคำขอ) | ใช่ (ใน transcript) |
| **ขอบเขต** | เฉพาะผลลัพธ์ของเครื่องมือ | บทสนทนาทั้งหมด |

ทั้งสองอย่างทำงานเสริมกัน -- pruning ช่วยให้ผลลัพธ์เครื่องมือกระชับระหว่าง
รอบของ Compaction

## อ่านเพิ่มเติม

- [Compaction](/th/concepts/compaction) -- การลด context แบบอิงการสรุป
- [การกำหนดค่า Gateway](/th/gateway/configuration) -- ตัวควบคุม config สำหรับ pruning ทั้งหมด
  (`contextPruning.*`)

## ที่เกี่ยวข้อง

- [การจัดการ Session](/th/concepts/session)
- [Session tools](/th/concepts/session-tool)
- [Context engine](/th/concepts/context-engine)
