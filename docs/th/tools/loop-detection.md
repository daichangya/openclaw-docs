---
read_when:
    - ผู้ใช้รายงานว่าเอเจนต์ติดอยู่ในลูปเรียกใช้เครื่องมือซ้ำ ๆ
    - คุณต้องการปรับการป้องกันการเรียกซ้ำ ๆ
    - คุณกำลังแก้ไขนโยบายของเครื่องมือ/รันไทม์ของเอเจนต์
summary: วิธีเปิดใช้และปรับแต่ง guardrail ที่ตรวจจับลูปการเรียกใช้เครื่องมือแบบซ้ำ ๆ
title: การตรวจจับลูปของเครื่องมือ
x-i18n:
    generated_at: "2026-04-24T09:37:48Z"
    model: gpt-5.4
    provider: openai
    source_hash: 0f5824d511ec33eb1f46c77250cb779b5e3bd5b3e5f16fab9e6c0b67297f87df
    source_path: tools/loop-detection.md
    workflow: 15
---

OpenClaw สามารถป้องกันไม่ให้เอเจนต์ติดอยู่ในรูปแบบการเรียกใช้เครื่องมือซ้ำ ๆ ได้
โดย guard นี้จะ **ปิดไว้เป็นค่าปริยาย**

ควรเปิดใช้เฉพาะในจุดที่จำเป็น เพราะหากตั้งค่าเข้มงวดเกินไป อาจบล็อกการเรียกซ้ำที่ถูกต้องตามปกติได้

## เหตุผลที่มีสิ่งนี้

- ตรวจจับลำดับการเรียกซ้ำ ๆ ที่ไม่มีความคืบหน้า
- ตรวจจับลูปความถี่สูงที่ไม่มีผลลัพธ์ (เครื่องมือเดิม อินพุตเดิม ข้อผิดพลาดเดิมซ้ำ ๆ)
- ตรวจจับรูปแบบการเรียกซ้ำเฉพาะสำหรับเครื่องมือแบบ polling ที่รู้จักกัน

## บล็อกการกำหนดค่า

ค่าเริ่มต้นส่วนกลาง:

```json5
{
  tools: {
    loopDetection: {
      enabled: false,
      historySize: 30,
      warningThreshold: 10,
      criticalThreshold: 20,
      globalCircuitBreakerThreshold: 30,
      detectors: {
        genericRepeat: true,
        knownPollNoProgress: true,
        pingPong: true,
      },
    },
  },
}
```

override รายเอเจนต์ (ไม่บังคับ):

```json5
{
  agents: {
    list: [
      {
        id: "safe-runner",
        tools: {
          loopDetection: {
            enabled: true,
            warningThreshold: 8,
            criticalThreshold: 16,
          },
        },
      },
    ],
  },
}
```

### พฤติกรรมของฟิลด์

- `enabled`: สวิตช์หลัก `false` หมายถึงจะไม่มีการตรวจจับลูป
- `historySize`: จำนวนการเรียกใช้เครื่องมือล่าสุดที่จะเก็บไว้เพื่อการวิเคราะห์
- `warningThreshold`: ค่า threshold ก่อนจะจัดรูปแบบนั้นเป็นระดับเตือนเท่านั้น
- `criticalThreshold`: ค่า threshold สำหรับการบล็อกรูปแบบลูปซ้ำ ๆ
- `globalCircuitBreakerThreshold`: ค่า breaker ส่วนกลางสำหรับกรณีไม่มีความคืบหน้า
- `detectors.genericRepeat`: ตรวจจับรูปแบบเครื่องมือเดิม + พารามิเตอร์เดิมที่ถูกเรียกซ้ำ
- `detectors.knownPollNoProgress`: ตรวจจับรูปแบบคล้าย polling ที่รู้จักกันซึ่งไม่มีการเปลี่ยนแปลงของสถานะ
- `detectors.pingPong`: ตรวจจับรูปแบบสลับไปมาคล้าย ping-pong

## การตั้งค่าที่แนะนำ

- เริ่มด้วย `enabled: true` โดยคงค่าเริ่มต้นอื่นไว้
- ควรรักษาลำดับ threshold เป็น `warningThreshold < criticalThreshold < globalCircuitBreakerThreshold`
- หากเกิด false positive:
  - เพิ่ม `warningThreshold` และ/หรือ `criticalThreshold`
  - (ไม่บังคับ) เพิ่ม `globalCircuitBreakerThreshold`
  - ปิดเฉพาะ detector ที่เป็นต้นเหตุของปัญหา
  - ลด `historySize` เพื่อลดความเข้มงวดของบริบทเชิงประวัติ

## Log และพฤติกรรมที่คาดหวัง

เมื่อตรวจพบลูป OpenClaw จะรายงาน loop event และบล็อกหรือลดความเข้มข้นของ tool-cycle ถัดไปตามระดับความรุนแรง
สิ่งนี้ช่วยปกป้องผู้ใช้จากการใช้โทเค็นแบบ runaway และการค้างของระบบ ขณะเดียวกันยังคงการเข้าถึงเครื่องมือแบบปกติไว้

- ควรเริ่มจากการเตือนและการระงับชั่วคราวก่อน
- ค่อย ๆ ยกระดับเมื่อมีหลักฐานการทำซ้ำสะสมมากขึ้นเท่านั้น

## หมายเหตุ

- `tools.loopDetection` จะถูก merge กับ override ระดับเอเจนต์
- คอนฟิกรายเอเจนต์สามารถ override หรือขยายค่าระดับ global ได้ทั้งหมด
- หากไม่มีคอนฟิกใด ๆ guardrail จะยังคงปิดอยู่

## ที่เกี่ยวข้อง

- [Exec approvals](/th/tools/exec-approvals)
- [ระดับการคิด](/th/tools/thinking)
- [ซับเอเจนต์](/th/tools/subagents)
