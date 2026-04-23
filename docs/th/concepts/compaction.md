---
read_when:
    - คุณต้องการทำความเข้าใจ auto-compaction และ `/compact`
    - คุณกำลังดีบักเซสชันที่ยาวและชนขีดจำกัดบริบท
summary: วิธีที่ OpenClaw สรุปการสนทนายาว ๆ เพื่อให้อยู่ภายในขีดจำกัดของโมเดล
title: Compaction
x-i18n:
    generated_at: "2026-04-23T05:29:37Z"
    model: gpt-5.4
    provider: openai
    source_hash: 382e4a879e65199bd98d7476bff556571e09344a21e909862a34e6029db6d765
    source_path: concepts/compaction.md
    workflow: 15
---

# Compaction

ทุกโมเดลมีหน้าต่างบริบท ซึ่งเป็นจำนวนโทเคนสูงสุดที่โมเดลประมวลผลได้
เมื่อการสนทนาเข้าใกล้ขีดจำกัดนั้น OpenClaw จะทำ **Compaction** กับข้อความเก่า
ให้เป็นสรุปเพื่อให้แชตดำเนินต่อได้

## วิธีการทำงาน

1. turn ของการสนทนาที่เก่ากว่าจะถูกสรุปเป็นรายการ compact
2. สรุปจะถูกบันทึกไว้ใน transcript ของเซสชัน
3. ข้อความล่าสุดจะยังคงอยู่ครบถ้วน

เมื่อ OpenClaw แบ่งประวัติออกเป็น chunk สำหรับ Compaction ระบบจะเก็บ tool
call ของ assistant ไว้คู่กับรายการ `toolResult` ที่ตรงกัน หากจุดแบ่งตกอยู่
กลางบล็อกของ tool OpenClaw จะเลื่อนขอบเขตเพื่อให้คู่นั้นอยู่ด้วยกัน และ
รักษาส่วนท้ายปัจจุบันที่ยังไม่ถูกสรุปไว้

ประวัติการสนทนาแบบเต็มยังคงอยู่บนดิสก์ Compaction เปลี่ยนเพียงสิ่งที่
โมเดลจะเห็นใน turn ถัดไปเท่านั้น

## auto-compaction

auto-compaction เปิดอยู่โดยค่าเริ่มต้น มันจะทำงานเมื่อเซสชันเข้าใกล้ขีดจำกัด
บริบท หรือเมื่อโมเดลส่งข้อผิดพลาด context-overflow กลับมา (ในกรณีนั้น
OpenClaw จะทำ Compaction แล้วลองใหม่) ลักษณะข้อผิดพลาด overflow ที่พบบ่อย ได้แก่
`request_too_large`, `context length exceeded`, `input exceeds the maximum
number of tokens`, `input token count exceeds the maximum number of input
tokens`, `input is too long for the model` และ `ollama error: context length
exceeded`

<Info>
ก่อนทำ Compaction OpenClaw จะเตือนเอเจนต์โดยอัตโนมัติให้บันทึก
โน้ตสำคัญลงในไฟล์ [memory](/th/concepts/memory) วิธีนี้ช่วยป้องกันการสูญเสียบริบท
</Info>

ใช้การตั้งค่า `agents.defaults.compaction` ใน `openclaw.json` ของคุณเพื่อกำหนดพฤติกรรมของ Compaction (โหมด จำนวนโทเคนเป้าหมาย ฯลฯ)
การสรุป Compaction จะคงตัวระบุแบบ opaque ไว้โดยค่าเริ่มต้น (`identifierPolicy: "strict"`) คุณสามารถ override ได้ด้วย `identifierPolicy: "off"` หรือระบุข้อความกำหนดเองด้วย `identifierPolicy: "custom"` และ `identifierInstructions`

คุณสามารถระบุโมเดลอื่นสำหรับการสรุป Compaction ได้ผ่าน `agents.defaults.compaction.model` ซึ่งมีประโยชน์เมื่อโมเดลหลักของคุณเป็นโมเดลขนาดเล็กหรือโมเดลในเครื่อง และคุณต้องการให้การสรุป Compaction สร้างโดยโมเดลที่มีความสามารถสูงกว่า ค่า override นี้รับสตริงรูปแบบ `provider/model-id` ใดก็ได้:

```json
{
  "agents": {
    "defaults": {
      "compaction": {
        "model": "openrouter/anthropic/claude-sonnet-4-6"
      }
    }
  }
}
```

วิธีนี้ใช้กับโมเดลในเครื่องได้เช่นกัน เช่น โมเดล Ollama ตัวที่สองที่ทุ่มให้กับการสรุป หรือผู้เชี่ยวชาญด้าน Compaction ที่ปรับจูนมาโดยเฉพาะ:

```json
{
  "agents": {
    "defaults": {
      "compaction": {
        "model": "ollama/llama3.1:8b"
      }
    }
  }
}
```

หากไม่ได้ตั้งค่าไว้ Compaction จะใช้โมเดลหลักของเอเจนต์

## ผู้ให้บริการ Compaction แบบเสียบปลั๊กได้

Plugin สามารถลงทะเบียนผู้ให้บริการ Compaction แบบกำหนดเองผ่าน `registerCompactionProvider()` บน Plugin API ได้ เมื่อมีการลงทะเบียนและกำหนดค่าผู้ให้บริการไว้ OpenClaw จะมอบหมายการสรุปให้ผู้ให้บริการนั้นแทน pipeline LLM ที่มีมาในตัว

หากต้องการใช้ผู้ให้บริการที่ลงทะเบียนไว้ ให้ตั้งค่า provider id ในคอนฟิกของคุณ:

```json
{
  "agents": {
    "defaults": {
      "compaction": {
        "provider": "my-provider"
      }
    }
  }
}
```

การตั้งค่า `provider` จะบังคับให้ `mode: "safeguard"` โดยอัตโนมัติ ผู้ให้บริการจะได้รับคำสั่ง Compaction และนโยบายการคงตัวระบุเดียวกันกับเส้นทางที่มีมาในตัว และ OpenClaw ยังคงรักษาบริบทส่วน suffix ของ turn ล่าสุดและ turn ที่ถูกแยกไว้หลังจากผลลัพธ์ของผู้ให้บริการ หากผู้ให้บริการล้มเหลวหรือคืนผลลัพธ์ว่าง OpenClaw จะ fallback ไปใช้การสรุปด้วย LLM ที่มีมาในตัว

## auto-compaction (เปิดโดยค่าเริ่มต้น)

เมื่อเซสชันเข้าใกล้หรือเกินหน้าต่างบริบทของโมเดล OpenClaw จะทริกเกอร์ auto-compaction และอาจลองคำขอเดิมใหม่โดยใช้บริบทแบบ compact แล้ว

คุณจะเห็น:

- `🧹 Auto-compaction complete` ในโหมด verbose
- `/status` แสดง `🧹 Compactions: <count>`

ก่อนทำ Compaction OpenClaw สามารถรัน turn แบบ **silent memory flush** เพื่อเก็บ
โน้ตที่คงทนลงดิสก์ ดูรายละเอียดและคอนฟิกได้ที่ [Memory](/th/concepts/memory)

## Compaction ด้วยตนเอง

พิมพ์ `/compact` ในแชตใดก็ได้เพื่อบังคับให้ทำ Compaction และเพิ่มคำสั่งเพื่อชี้นำ
การสรุปได้:

```
/compact Focus on the API design decisions
```

## การใช้โมเดลอื่น

โดยค่าเริ่มต้น Compaction จะใช้โมเดลหลักของเอเจนต์ คุณสามารถใช้โมเดลที่มี
ความสามารถสูงกว่าเพื่อให้ได้สรุปที่ดีกว่า:

```json5
{
  agents: {
    defaults: {
      compaction: {
        model: "openrouter/anthropic/claude-sonnet-4-6",
      },
    },
  },
}
```

## การแจ้งเตือน Compaction

โดยค่าเริ่มต้น Compaction จะทำงานแบบเงียบ หากต้องการแสดงการแจ้งเตือนสั้น ๆ เมื่อเริ่ม
และเมื่อเสร็จสิ้น ให้เปิด `notifyUser`:

```json5
{
  agents: {
    defaults: {
      compaction: {
        notifyUser: true,
      },
    },
  },
}
```

เมื่อเปิดใช้งาน ผู้ใช้จะเห็นข้อความสถานะสั้น ๆ รอบการทำงานของ Compaction แต่ละครั้ง
(เช่น "กำลังทำ Compaction บริบท..." และ "Compaction เสร็จสิ้น")

## Compaction เทียบกับการตัดทอน

|                  | Compaction                    | การตัดทอน                         |
| ---------------- | ----------------------------- | --------------------------------- |
| **สิ่งที่ทำ**    | สรุปการสนทนาเก่า              | ตัดผลลัพธ์ tool เก่าออก          |
| **บันทึกไว้ไหม?** | ใช่ (ใน transcript ของเซสชัน) | ไม่ (อยู่ใน memory เท่านั้น ต่อคำขอ) |
| **ขอบเขต**       | ทั้งการสนทนา                  | เฉพาะผลลัพธ์ของ tool             |

[การตัดทอนเซสชัน](/th/concepts/session-pruning) เป็นส่วนเสริมที่เบากว่า ซึ่ง
ตัดผลลัพธ์ของ tool ออกโดยไม่ต้องสรุป

## การแก้ไขปัญหา

**ทำ Compaction บ่อยเกินไปหรือไม่?** หน้าต่างบริบทของโมเดลอาจเล็ก หรือ
ผลลัพธ์ของ tool อาจมีขนาดใหญ่ ลองเปิดใช้
[การตัดทอนเซสชัน](/th/concepts/session-pruning)

**หลังทำ Compaction แล้วบริบทรู้สึกล้าสมัยหรือไม่?** ใช้ `/compact Focus on <topic>` เพื่อ
ชี้นำการสรุป หรือเปิดใช้ [memory flush](/th/concepts/memory) เพื่อให้โน้ต
อยู่รอด

**ต้องการเริ่มใหม่แบบสะอาดหรือไม่?** `/new` จะเริ่มเซสชันใหม่โดยไม่ทำ Compaction

สำหรับการตั้งค่าขั้นสูง (reserve token, การคงตัวระบุ, custom
context engine, OpenAI server-side compaction) ดูที่
[เจาะลึกการจัดการเซสชัน](/th/reference/session-management-compaction)

## ที่เกี่ยวข้อง

- [Session](/th/concepts/session) — การจัดการและวงจรชีวิตของเซสชัน
- [Session Pruning](/th/concepts/session-pruning) — การตัดผลลัพธ์ของ tool
- [Context](/th/concepts/context) — วิธีสร้างบริบทสำหรับ turn ของเอเจนต์
- [Hooks](/th/automation/hooks) — hook วงจรชีวิตของ Compaction (before_compaction, after_compaction)
