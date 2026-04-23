---
read_when:
    - คุณต้องการทำความเข้าใจว่า OpenClaw ประกอบ context ของโมเดลอย่างไร
    - คุณกำลังสลับระหว่างเอนจินเดิมกับเอนจินแบบ plugin
    - คุณกำลังสร้าง plugin เอนจิน context
summary: 'เอนจิน context: การประกอบ context แบบ Plugin, Compaction และวงจรชีวิตของ subagent'
title: เอนจิน context
x-i18n:
    generated_at: "2026-04-23T05:29:48Z"
    model: gpt-5.4
    provider: openai
    source_hash: e8290ac73272eee275bce8e481ac7959b65386752caa68044d0c6f3e450acfb1
    source_path: concepts/context-engine.md
    workflow: 15
---

# เอนจิน context

**เอนจิน context** ควบคุมวิธีที่ OpenClaw สร้าง context ของโมเดลสำหรับแต่ละการรัน
มันเป็นตัวตัดสินใจว่าจะรวมข้อความใดบ้าง จะสรุปประวัติเก่าอย่างไร และจะ
จัดการ context ข้ามขอบเขตของ subagent อย่างไร

OpenClaw มาพร้อมเอนจิน `legacy` ที่มีอยู่ภายใน Plugins สามารถลงทะเบียน
เอนจินทางเลือกที่เข้ามาแทนวงจรชีวิตของเอนจิน context ที่ใช้งานอยู่ได้

## เริ่มต้นอย่างรวดเร็ว

ตรวจสอบว่าเอนจินใดกำลังทำงานอยู่:

```bash
openclaw doctor
# หรือดู config โดยตรง:
cat ~/.openclaw/openclaw.json | jq '.plugins.slots.contextEngine'
```

### การติดตั้ง plugin เอนจิน context

plugin เอนจิน context ติดตั้งแบบเดียวกับ plugin อื่น ๆ ของ OpenClaw ให้ติดตั้ง
ก่อน แล้วจึงเลือกเอนจินใน slot:

```bash
# ติดตั้งจาก npm
openclaw plugins install @martian-engineering/lossless-claw

# หรือติดตั้งจากพาธในเครื่อง (สำหรับการพัฒนา)
openclaw plugins install -l ./my-context-engine
```

จากนั้นเปิดใช้งาน plugin และเลือกมันเป็นเอนจินที่ใช้งานอยู่ใน config ของคุณ:

```json5
// openclaw.json
{
  plugins: {
    slots: {
      contextEngine: "lossless-claw", // ต้องตรงกับ engine id ที่ plugin ลงทะเบียนไว้
    },
    entries: {
      "lossless-claw": {
        enabled: true,
        // config เฉพาะของ Plugin ให้วางไว้ที่นี่ (ดูจากเอกสารของ plugin)
      },
    },
  },
}
```

รีสตาร์ต Gateway หลังจากติดตั้งและกำหนดค่าแล้ว

หากต้องการสลับกลับไปใช้เอนจินภายใน ให้ตั้งค่า `contextEngine` เป็น `"legacy"` (หรือ
ลบคีย์นี้ออกไปทั้งหมด — `"legacy"` คือค่าเริ่มต้น)

## วิธีการทำงาน

ทุกครั้งที่ OpenClaw รันพรอมป์ของโมเดล เอนจิน context จะเข้ามามีส่วนร่วมที่
จุดวงจรชีวิต 4 จุด:

1. **Ingest** — ถูกเรียกเมื่อมีการเพิ่มข้อความใหม่ลงในเซสชัน เอนจิน
   สามารถจัดเก็บหรือทำดัชนีข้อความใน data store ของตัวเองได้
2. **Assemble** — ถูกเรียกก่อนการรันโมเดลแต่ละครั้ง เอนจินจะส่งคืน
   ชุดข้อความที่เรียงลำดับแล้ว (และ `systemPromptAddition` แบบทางเลือก) ที่อยู่ภายใน
   งบประมาณโทเค็น
3. **Compact** — ถูกเรียกเมื่อหน้าต่าง context เต็ม หรือเมื่อผู้ใช้รัน
   `/compact` เอนจินจะสรุปประวัติเก่าเพื่อคืนพื้นที่
4. **After turn** — ถูกเรียกหลังจากการรันเสร็จสมบูรณ์ เอนจินสามารถบันทึกสถานะ,
   ทริกเกอร์ Compaction แบบแบ็กกราวด์ หรืออัปเดตดัชนีได้

### วงจรชีวิตของ subagent (ไม่บังคับ)

ปัจจุบัน OpenClaw เรียก hook ของวงจรชีวิต subagent อยู่หนึ่งตัว:

- **onSubagentEnded** — ล้างข้อมูลเมื่อเซสชัน subagent เสร็จสิ้นหรือถูกเก็บกวาด

hook `prepareSubagentSpawn` เป็นส่วนหนึ่งของ interface สำหรับการใช้งานในอนาคต แต่
runtime ยังไม่ได้เรียกใช้ในตอนนี้

### ส่วนเพิ่มเติมของ system prompt

เมธอด `assemble` สามารถส่งคืนสตริง `systemPromptAddition` ได้ OpenClaw
จะเติมค่านี้ไว้หน้าสุดของ system prompt สำหรับการรันนั้น ซึ่งช่วยให้เอนจินแทรก
แนวทางการเรียกคืนแบบไดนามิก คำสั่งสำหรับ retrieval หรือคำใบ้ที่รับรู้ context
โดยไม่ต้องพึ่งไฟล์ workspace แบบคงที่

## เอนจิน legacy

เอนจิน `legacy` ที่มีอยู่ภายในจะคงพฤติกรรมดั้งเดิมของ OpenClaw ไว้:

- **Ingest**: ไม่ทำอะไร (ตัวจัดการเซสชันจัดการการบันทึกข้อความโดยตรงอยู่แล้ว)
- **Assemble**: ส่งผ่านตรง (pipeline เดิม sanitize → validate → limit
  ใน runtime จะจัดการการประกอบ context)
- **Compact**: ส่งต่อไปยัง Compaction แบบสรุปผลที่มีอยู่ภายใน ซึ่งจะสร้าง
  สรุปเดียวของข้อความเก่าและคงข้อความล่าสุดไว้
- **After turn**: ไม่ทำอะไร

เอนจิน legacy จะไม่ลงทะเบียน tool และไม่มี `systemPromptAddition`

เมื่อไม่ได้ตั้งค่า `plugins.slots.contextEngine` (หรือถูกตั้งเป็น `"legacy"`) เอนจินนี้
จะถูกใช้งานโดยอัตโนมัติ

## เอนจินแบบ plugin

plugin สามารถลงทะเบียนเอนจิน context โดยใช้ API ของ plugin:

```ts
import { buildMemorySystemPromptAddition } from "openclaw/plugin-sdk/core";

export default function register(api) {
  api.registerContextEngine("my-engine", () => ({
    info: {
      id: "my-engine",
      name: "My Context Engine",
      ownsCompaction: true,
    },

    async ingest({ sessionId, message, isHeartbeat }) {
      // จัดเก็บข้อความไว้ใน data store ของคุณ
      return { ingested: true };
    },

    async assemble({ sessionId, messages, tokenBudget, availableTools, citationsMode }) {
      // ส่งคืนข้อความที่อยู่ภายในงบประมาณ
      return {
        messages: buildContext(messages, tokenBudget),
        estimatedTokens: countTokens(messages),
        systemPromptAddition: buildMemorySystemPromptAddition({
          availableTools: availableTools ?? new Set(),
          citationsMode,
        }),
      };
    },

    async compact({ sessionId, force }) {
      // สรุป context ที่เก่ากว่า
      return { ok: true, compacted: true };
    },
  }));
}
```

จากนั้นเปิดใช้งานใน config:

```json5
{
  plugins: {
    slots: {
      contextEngine: "my-engine",
    },
    entries: {
      "my-engine": {
        enabled: true,
      },
    },
  },
}
```

### interface ของ ContextEngine

สมาชิกที่จำเป็น:

| สมาชิก             | ชนิด     | วัตถุประสงค์                                                |
| ------------------ | -------- | ----------------------------------------------------------- |
| `info`             | Property | engine id, ชื่อ, เวอร์ชัน และระบุว่าเป็นเจ้าของ Compaction หรือไม่ |
| `ingest(params)`   | Method   | จัดเก็บข้อความเดี่ยวหนึ่งรายการ                            |
| `assemble(params)` | Method   | สร้าง context สำหรับการรันโมเดล (ส่งคืน `AssembleResult`)   |
| `compact(params)`  | Method   | สรุป/ลด context                                             |

`assemble` จะส่งคืน `AssembleResult` ที่มี:

- `messages` — ข้อความที่เรียงลำดับแล้วเพื่อส่งให้โมเดล
- `estimatedTokens` (จำเป็น, `number`) — ค่าประมาณของเอนจินสำหรับจำนวน
  โทเค็นรวมใน context ที่ประกอบแล้ว OpenClaw ใช้ค่านี้สำหรับการตัดสินใจเรื่อง
  เกณฑ์ของ Compaction และการรายงานการวินิจฉัย
- `systemPromptAddition` (ไม่บังคับ, `string`) — ข้อความที่จะเติมไว้ก่อน system prompt

สมาชิกที่ไม่บังคับ:

| สมาชิก                         | ชนิด   | วัตถุประสงค์                                                                                                     |
| ------------------------------ | ------ | ---------------------------------------------------------------------------------------------------------------- |
| `bootstrap(params)`            | Method | เริ่มต้นสถานะของเอนจินสำหรับเซสชัน ถูกเรียกหนึ่งครั้งเมื่อเอนจินเห็นเซสชันครั้งแรก (เช่น นำเข้าประวัติ)         |
| `ingestBatch(params)`          | Method | Ingest turn ที่เสร็จสมบูรณ์เป็นชุด ถูกเรียกหลังจากการรันเสร็จสิ้น โดยส่งข้อความทั้งหมดจาก turn นั้นมาพร้อมกัน |
| `afterTurn(params)`            | Method | งานวงจรชีวิตหลังการรัน (บันทึกสถานะ, ทริกเกอร์ Compaction แบบแบ็กกราวด์)                                      |
| `prepareSubagentSpawn(params)` | Method | ตั้งค่าสถานะที่ใช้ร่วมกันสำหรับเซสชันลูก                                                                         |
| `onSubagentEnded(params)`      | Method | ล้างข้อมูลหลังจาก subagent สิ้นสุด                                                                                |
| `dispose()`                    | Method | ปล่อยทรัพยากร ถูกเรียกระหว่างการปิด Gateway หรือการ reload plugin — ไม่ใช่ต่อเซสชัน                           |

### ownsCompaction

`ownsCompaction` ควบคุมว่า auto-compaction ภายในระหว่างความพยายามของ Pi จะยังคง
เปิดใช้งานสำหรับการรันนั้นหรือไม่:

- `true` — เอนจินเป็นเจ้าของพฤติกรรมของ Compaction OpenClaw จะปิด
  auto-compaction ภายในของ Pi สำหรับการรันนั้น และ implementation ของ `compact()`
  ของเอนจินจะเป็นผู้รับผิดชอบ `/compact`, overflow recovery compaction และ
  Compaction เชิงรุกใด ๆ ที่มันต้องการทำใน `afterTurn()`
- `false` หรือไม่ได้ตั้งค่า — auto-compaction ภายในของ Pi อาจยังทำงานระหว่าง
  การรันพรอมป์ แต่เมธอด `compact()` ของเอนจินที่ใช้งานอยู่ก็ยังจะถูกเรียกสำหรับ
  `/compact` และ overflow recovery

`ownsCompaction: false` **ไม่ได้** หมายความว่า OpenClaw จะ fallback กลับไปใช้
เส้นทาง Compaction ของเอนจิน legacy โดยอัตโนมัติ

นั่นหมายความว่ามีรูปแบบ plugin ที่ถูกต้องอยู่สองแบบ:

- **โหมดเจ้าของเอง** — implement อัลกอริทึม Compaction ของคุณเองและตั้งค่า
  `ownsCompaction: true`
- **โหมดมอบหมาย** — ตั้งค่า `ownsCompaction: false` และให้ `compact()` เรียก
  `delegateCompactionToRuntime(...)` จาก `openclaw/plugin-sdk/core` เพื่อใช้
  พฤติกรรม Compaction ภายในของ OpenClaw

`compact()` ที่ไม่ทำอะไรเลยนั้นไม่ปลอดภัยสำหรับเอนจินที่ใช้งานอยู่แบบไม่เป็นเจ้าของ
เพราะมันจะปิดเส้นทางปกติของ `/compact` และ overflow-recovery compaction สำหรับ
slot ของเอนจินนั้น

## เอกสารอ้างอิงการกำหนดค่า

```json5
{
  plugins: {
    slots: {
      // เลือกเอนจิน context ที่ใช้งานอยู่ ค่าเริ่มต้น: "legacy"
      // ตั้งเป็น plugin id เพื่อใช้เอนจินแบบ plugin
      contextEngine: "legacy",
    },
  },
}
```

slot นี้เป็นแบบ exclusive ในขณะรัน — จะมีการ resolve เอนจิน context
ที่ลงทะเบียนไว้เพียงตัวเดียวสำหรับการรันหรือการทำ Compaction แต่ละครั้ง plugin
`kind: "context-engine"` ตัวอื่นที่เปิดใช้งานอยู่ยังคงโหลดและรันโค้ดการลงทะเบียนของตนได้
โดย `plugins.slots.contextEngine` มีหน้าที่เพียงเลือก registered engine id
ที่ OpenClaw จะ resolve เมื่อต้องการเอนจิน context

## ความสัมพันธ์กับ Compaction และ memory

- **Compaction** เป็นหนึ่งในหน้าที่รับผิดชอบของเอนจิน context เอนจิน legacy
  จะมอบหมายไปยังการสรุปผลภายในของ OpenClaw เอนจินแบบ plugin สามารถ implement
  กลยุทธ์ Compaction แบบใดก็ได้ (เช่น DAG summaries, vector retrieval เป็นต้น)
- **plugin memory** (`plugins.slots.memory`) แยกจากเอนจิน context
  plugin memory ให้ความสามารถด้าน search/retrieval; เอนจิน context ควบคุมสิ่งที่
  โมเดลจะเห็น ทั้งสองอย่างสามารถทำงานร่วมกันได้ — เอนจิน context อาจใช้ข้อมูลจาก
  plugin memory ระหว่างการประกอบ เอนจินแบบ plugin ที่ต้องการใช้เส้นทาง prompt ของ
  Active Memory ควรใช้ `buildMemorySystemPromptAddition(...)` จาก
  `openclaw/plugin-sdk/core` ซึ่งจะแปลงส่วน prompt ของ Active Memory
  ที่กำลังใช้งานอยู่ให้เป็น `systemPromptAddition` ที่พร้อมเติมไว้ด้านหน้า หากเอนจิน
  ต้องการการควบคุมระดับล่างกว่านี้ ก็ยังสามารถดึงบรรทัดดิบจาก
  `openclaw/plugin-sdk/memory-host-core` ผ่าน
  `buildActiveMemoryPromptSection(...)` ได้
- **การ pruning เซสชัน** (ตัดผลลัพธ์ tool เก่าออกจากในหน่วยความจำ) ยังคงทำงานอยู่
  ไม่ว่าจะมีเอนจิน context ใดกำลังใช้งานอยู่

## เคล็ดลับ

- ใช้ `openclaw doctor` เพื่อตรวจสอบว่าเอนจินของคุณโหลดอย่างถูกต้อง
- หากสลับเอนจิน เซสชันที่มีอยู่จะยังคงใช้ประวัติปัจจุบันต่อไป
  เอนจินใหม่จะเข้ามารับผิดชอบสำหรับการรันในอนาคต
- ข้อผิดพลาดของเอนจินจะถูกบันทึกและแสดงในข้อมูลการวินิจฉัย หากเอนจินแบบ plugin
  ลงทะเบียนไม่สำเร็จ หรือไม่สามารถ resolve engine id ที่เลือกไว้ได้ OpenClaw
  จะไม่ fallback โดยอัตโนมัติ; การรันจะล้มเหลวจนกว่าคุณจะแก้ไข plugin หรือ
  สลับ `plugins.slots.contextEngine` กลับไปเป็น `"legacy"`
- สำหรับการพัฒนา ใช้ `openclaw plugins install -l ./my-engine` เพื่อเชื่อมโยง
  ไดเรกทอรี plugin ในเครื่องโดยไม่ต้องคัดลอก

ดูเพิ่มเติม: [Compaction](/th/concepts/compaction), [Context](/th/concepts/context),
[Plugins](/th/tools/plugin), [Plugin manifest](/th/plugins/manifest)

## ที่เกี่ยวข้อง

- [Context](/th/concepts/context) — วิธีที่ context ถูกสร้างสำหรับ turn ของเอเจนต์
- [สถาปัตยกรรม Plugin](/th/plugins/architecture) — การลงทะเบียน plugin เอนจิน context
- [Compaction](/th/concepts/compaction) — การสรุปบทสนทนายาว ๆ
