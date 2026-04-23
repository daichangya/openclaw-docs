---
read_when:
    - ผู้ใช้รายงานว่าเอเจนต์ติดค้างอยู่กับการเรียกใช้เครื่องมือซ้ำๆ
    - คุณต้องการปรับแต่งการป้องกันการเรียกใช้ซ้ำๆ
    - คุณกำลังแก้ไขนโยบายเครื่องมือ/รันไทม์ของเอเจนต์
summary: วิธีเปิดใช้และปรับแต่ง guardrails ที่ตรวจจับลูปการเรียกใช้เครื่องมือซ้ำๆ
title: การตรวจจับลูปของเครื่องมือ
x-i18n:
    generated_at: "2026-04-23T06:01:52Z"
    model: gpt-5.4
    provider: openai
    source_hash: dc3c92579b24cfbedd02a286b735d99a259b720f6d9719a9b93902c9fc66137d
    source_path: tools/loop-detection.md
    workflow: 15
---

# การตรวจจับลูปของเครื่องมือ

OpenClaw สามารถป้องกันไม่ให้เอเจนต์ติดค้างอยู่กับรูปแบบการเรียกใช้เครื่องมือซ้ำๆ ได้
ตัว guard นี้ **ปิดอยู่ตามค่าเริ่มต้น**

ควรเปิดใช้เฉพาะจุดที่จำเป็น เพราะหากตั้งค่าเข้มเกินไป มันอาจบล็อกการเรียกซ้ำที่เป็นการทำงานปกติได้

## เหตุใดจึงมีสิ่งนี้

- ตรวจจับลำดับการทำงานซ้ำๆ ที่ไม่ก่อให้เกิดความคืบหน้า
- ตรวจจับลูปแบบความถี่สูงที่ไม่ให้ผลลัพธ์ (เครื่องมือเดิม, อินพุตเดิม, ข้อผิดพลาดเดิมซ้ำๆ)
- ตรวจจับรูปแบบการเรียกซ้ำแบบเฉพาะสำหรับเครื่องมือ polling ที่รู้จัก

## บล็อกการกำหนดค่า

ค่าเริ่มต้นระดับ global:

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

override ระดับต่อเอเจนต์ (ไม่บังคับ):

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

- `enabled`: สวิตช์หลัก ค่า `false` หมายถึงจะไม่ทำการตรวจจับลูป
- `historySize`: จำนวนการเรียกใช้เครื่องมือล่าสุดที่เก็บไว้เพื่อการวิเคราะห์
- `warningThreshold`: เกณฑ์ก่อนจัดประเภทลักษณะดังกล่าวเป็นระดับ warning-only
- `criticalThreshold`: เกณฑ์สำหรับบล็อกรูปแบบลูปซ้ำๆ
- `globalCircuitBreakerThreshold`: เกณฑ์ตัวตัดวงจรแบบ no-progress ระดับ global
- `detectors.genericRepeat`: ตรวจจับรูปแบบ same-tool + same-params ที่ซ้ำกัน
- `detectors.knownPollNoProgress`: ตรวจจับรูปแบบคล้าย polling ที่รู้จักและไม่มีการเปลี่ยนสถานะ
- `detectors.pingPong`: ตรวจจับรูปแบบสลับไปมาคล้าย ping-pong

## การตั้งค่าที่แนะนำ

- เริ่มด้วย `enabled: true` โดยคงค่าเริ่มต้นอื่นไว้ก่อน
- ควรคงลำดับเกณฑ์เป็น `warningThreshold < criticalThreshold < globalCircuitBreakerThreshold`
- หากเกิด false positives:
  - เพิ่ม `warningThreshold` และ/หรือ `criticalThreshold`
  - (ไม่บังคับ) เพิ่ม `globalCircuitBreakerThreshold`
  - ปิดเฉพาะ detector ที่ก่อปัญหา
  - ลด `historySize` เพื่อลดความเข้มของบริบทเชิงประวัติ

## Logs และพฤติกรรมที่คาดหวัง

เมื่อตรวจพบลูป OpenClaw จะรายงาน loop event และบล็อกหรือทำให้ tool-cycle ถัดไปทำงานเบาลงตามระดับความรุนแรง
วิธีนี้ช่วยปกป้องผู้ใช้จากการใช้โทเค็นแบบ runaway และอาการค้าง ขณะเดียวกันยังรักษาการเข้าถึงเครื่องมือตามปกติไว้

- ควรใช้ warning และการกดชั่วคราวก่อน
- ค่อยยกระดับเมื่อมีหลักฐานการเกิดซ้ำสะสมเท่านั้น

## หมายเหตุ

- `tools.loopDetection` จะถูก merge กับ overrides ระดับเอเจนต์
- config ระดับต่อเอเจนต์จะ override หรือขยายค่าระดับ global โดยสมบูรณ์
- หากไม่มี config ใดๆ guardrails จะยังคงปิดอยู่
