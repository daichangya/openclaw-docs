---
read_when:
    - คุณต้องการเข้าใจ Compaction อัตโนมัติและ /compact
    - คุณกำลังดีบักเซสชันยาวที่ชนขีดจำกัด context
summary: วิธีที่ OpenClaw สรุปบทสนทนายาวเพื่อให้อยู่ภายในขีดจำกัดของโมเดล
title: Compaction
x-i18n:
    generated_at: "2026-04-24T09:05:04Z"
    model: gpt-5.4
    provider: openai
    source_hash: b88a757b19a7c040599a0a7901d8596001ffff148f7f6e861a3cc783100393f7
    source_path: concepts/compaction.md
    workflow: 15
---

ทุกโมเดลมี context window ซึ่งเป็นจำนวนโทเค็นสูงสุดที่สามารถประมวลผลได้
เมื่อบทสนทนาเข้าใกล้ขีดจำกัดนั้น OpenClaw จะทำ **Compaction** กับข้อความเก่า
ให้กลายเป็นสรุป เพื่อให้แชตดำเนินต่อได้

## วิธีการทำงาน

1. เทิร์นของบทสนทนาเก่าจะถูกสรุปเป็นรายการแบบกระชับ
2. สรุปนั้นจะถูกบันทึกไว้ใน session transcript
3. ข้อความล่าสุดจะยังคงถูกเก็บไว้ครบถ้วน

เมื่อ OpenClaw แบ่งประวัติออกเป็นชิ้นสำหรับ Compaction ระบบจะจับคู่ tool
calls ของ assistant ไว้กับรายการ `toolResult` ที่ตรงกันเสมอ หากจุดแบ่งตกอยู่
กลางบล็อกเครื่องมือ OpenClaw จะเลื่อนขอบเขตเพื่อให้คู่นั้นยังอยู่ด้วยกันและ
รักษาส่วนท้ายปัจจุบันที่ยังไม่ถูกสรุปไว้

ประวัติบทสนทนาทั้งหมดยังคงอยู่บนดิสก์ Compaction เปลี่ยนเฉพาะสิ่งที่โมเดล
เห็นในเทิร์นถัดไปเท่านั้น

## Compaction อัตโนมัติ

Compaction อัตโนมัติเปิดใช้งานตามค่าเริ่มต้น ระบบจะทำงานเมื่อ session เข้าใกล้ขีดจำกัด
context หรือเมื่อโมเดลส่งข้อผิดพลาด context-overflow กลับมา (ในกรณีนั้น
OpenClaw จะทำ Compaction แล้วลองใหม่) ลายเซ็น overflow ที่พบบ่อยได้แก่
`request_too_large`, `context length exceeded`, `input exceeds the maximum
number of tokens`, `input token count exceeds the maximum number of input
tokens`, `input is too long for the model` และ `ollama error: context length
exceeded`

<Info>
ก่อนทำ Compaction OpenClaw จะเตือนเอเจนต์โดยอัตโนมัติให้บันทึกโน้ตสำคัญลงในไฟล์
[memory](/th/concepts/memory) ซึ่งช่วยป้องกันการสูญเสีย context
</Info>

ใช้การตั้งค่า `agents.defaults.compaction` ใน `openclaw.json` ของคุณเพื่อกำหนดค่าลักษณะการทำงานของ Compaction (mode, target tokens เป็นต้น)
การสรุปของ Compaction จะเก็บตัวระบุแบบ opaque ไว้ตามค่าเริ่มต้น (`identifierPolicy: "strict"`) คุณสามารถ override ได้ด้วย `identifierPolicy: "off"` หรือให้ข้อความกำหนดเองด้วย `identifierPolicy: "custom"` และ `identifierInstructions`

คุณสามารถระบุโมเดลที่ต่างออกไปสำหรับการสรุป Compaction ได้ผ่าน `agents.defaults.compaction.model` ซึ่งมีประโยชน์เมื่อโมเดลหลักของคุณเป็นโมเดลโลคัลหรือโมเดลขนาดเล็ก และคุณต้องการให้การสรุป Compaction ถูกสร้างโดยโมเดลที่มีความสามารถสูงกว่า การ override นี้รองรับสตริง `provider/model-id` ใดก็ได้:

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

สิ่งนี้ใช้ได้กับโมเดลโลคัลเช่นกัน ตัวอย่างเช่น โมเดล Ollama ตัวที่สองที่ใช้เฉพาะสำหรับการสรุป หรือผู้เชี่ยวชาญด้าน Compaction ที่ผ่านการ fine-tune:

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

เมื่อไม่ได้ตั้งค่า Compaction จะใช้โมเดลหลักของเอเจนต์

## ผู้ให้บริการ Compaction แบบถอดเปลี่ยนได้

Plugins สามารถลงทะเบียนผู้ให้บริการ Compaction แบบกำหนดเองผ่าน `registerCompactionProvider()` บน Plugin API ได้ เมื่อมีการลงทะเบียนและกำหนดค่าผู้ให้บริการแล้ว OpenClaw จะมอบหมายการสรุปให้ผู้ให้บริการนั้นแทน pipeline LLM ในตัว

หากต้องการใช้ผู้ให้บริการที่ลงทะเบียนไว้ ให้ตั้งค่า provider id ใน config ของคุณ:

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

การตั้งค่า `provider` จะบังคับให้ `mode: "safeguard"` โดยอัตโนมัติ ผู้ให้บริการจะได้รับคำสั่ง Compaction และนโยบายการเก็บรักษาตัวระบุแบบเดียวกับเส้นทางในตัว และ OpenClaw จะยังคงเก็บ context ส่วนท้ายของเทิร์นล่าสุดและเทิร์นที่ถูกแบ่งหลังจากผลลัพธ์ของผู้ให้บริการออกมา หากผู้ให้บริการล้มเหลวหรือคืนค่าผลลัพธ์ว่าง OpenClaw จะย้อนกลับไปใช้การสรุปด้วย LLM ในตัว

## Compaction อัตโนมัติ (เปิดตามค่าเริ่มต้น)

เมื่อ session เข้าใกล้หรือเกิน context window ของโมเดล OpenClaw จะทริกเกอร์ Compaction อัตโนมัติ และอาจลองคำขอเดิมอีกครั้งโดยใช้ context ที่ผ่าน Compaction แล้ว

คุณจะเห็น:

- `🧹 Auto-compaction complete` ในโหมด verbose
- `/status` แสดง `🧹 Compactions: <count>`

ก่อนทำ Compaction OpenClaw อาจรันเทิร์น **silent memory flush** เพื่อเก็บ
โน้ตแบบคงทนลงดิสก์ ดู [Memory](/th/concepts/memory) สำหรับรายละเอียดและ config

## Compaction แบบแมนนวล

พิมพ์ `/compact` ในแชตใดก็ได้เพื่อบังคับทำ Compaction เพิ่มคำสั่งเพื่อชี้นำ
การสรุปได้:

```text
/compact Focus on the API design decisions
```

## การใช้โมเดลอื่น

ตามค่าเริ่มต้น Compaction จะใช้โมเดลหลักของเอเจนต์ คุณสามารถใช้โมเดลที่มี
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

ตามค่าเริ่มต้น Compaction จะทำงานแบบเงียบ หากต้องการแสดงการแจ้งเตือนสั้น ๆ
เมื่อเริ่มและเมื่อเสร็จสิ้น ให้เปิดใช้ `notifyUser`:

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

เมื่อเปิดใช้งาน ผู้ใช้จะเห็นข้อความสถานะสั้น ๆ รอบการทำ Compaction แต่ละครั้ง
(เช่น "Compacting context..." และ "Compaction complete")

## Compaction เทียบกับ pruning

| | Compaction | pruning |
| ---------------- | ----------------------------- | -------------------------------- |
| **สิ่งที่ทำ** | สรุปบทสนทนาเก่า | ตัดผลลัพธ์เครื่องมือเก่าออก |
| **บันทึกไว้หรือไม่?** | ใช่ (ใน session transcript) | ไม่ (อยู่ในหน่วยความจำเท่านั้น ต่อคำขอ) |
| **ขอบเขต** | บทสนทนาทั้งหมด | เฉพาะผลลัพธ์ของเครื่องมือ |

[Session pruning](/th/concepts/session-pruning) เป็นส่วนเสริมที่เบากว่าซึ่ง
ตัดผลลัพธ์ของเครื่องมือออกโดยไม่ทำการสรุป

## การแก้ไขปัญหา

**ทำ Compaction บ่อยเกินไป?** context window ของโมเดลอาจเล็ก หรือผลลัพธ์
ของเครื่องมืออาจมีขนาดใหญ่ ลองเปิดใช้
[session pruning](/th/concepts/session-pruning)

**รู้สึกว่า context เก่าหลังจากทำ Compaction?** ใช้ `/compact Focus on <topic>` เพื่อ
ชี้นำการสรุป หรือเปิดใช้ [memory flush](/th/concepts/memory) เพื่อให้โน้ต
ยังคงอยู่

**ต้องการเริ่มใหม่แบบสะอาด?** `/new` จะเริ่ม session ใหม่โดยไม่ทำ Compaction

สำหรับการกำหนดค่าขั้นสูง (reserve tokens, การเก็บรักษาตัวระบุ, custom
context engines, OpenAI server-side compaction) โปรดดู
[เจาะลึกการจัดการ Session](/th/reference/session-management-compaction)

## ที่เกี่ยวข้อง

- [Session](/th/concepts/session) — การจัดการและวงจรชีวิตของ session
- [Session Pruning](/th/concepts/session-pruning) — การตัดผลลัพธ์ของเครื่องมือ
- [Context](/th/concepts/context) — วิธีสร้าง context สำหรับเทิร์นของเอเจนต์
- [Hooks](/th/automation/hooks) — hooks วงจรชีวิตของ Compaction (before_compaction, after_compaction)
