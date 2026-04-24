---
read_when:
    - คุณต้องการเข้าใจว่า OpenClaw ประกอบบริบทของโมเดลอย่างไร
    - คุณกำลังสลับระหว่างเอนจินแบบเดิมกับเอนจินแบบ Plugin
    - คุณกำลังสร้าง Plugin เอนจินบริบท
summary: 'เอนจินบริบท: การประกอบบริบทแบบเสียบปลั๊กได้ Compaction และวงจรชีวิตของ subagent'
title: เอนจินบริบท
x-i18n:
    generated_at: "2026-04-24T09:05:16Z"
    model: gpt-5.4
    provider: openai
    source_hash: 8f4e5f01f945f7fe3056587f2aa60bec607dd0dd64b29e9ab2afe8e77b5d2f1e
    source_path: concepts/context-engine.md
    workflow: 15
---

**เอนจินบริบท** ควบคุมวิธีที่ OpenClaw สร้างบริบทของโมเดลสำหรับแต่ละการรัน:
จะรวมข้อความใดบ้าง จะสรุปประวัติเก่าอย่างไร และจะจัดการ
บริบทข้ามขอบเขตของ subagent อย่างไร

OpenClaw มาพร้อมเอนจินในตัวชื่อ `legacy` และใช้เป็นค่าเริ่มต้น — ผู้ใช้ส่วนใหญ่
ไม่จำเป็นต้องเปลี่ยนสิ่งนี้เลย ติดตั้งและเลือกเอนจินแบบ Plugin เฉพาะเมื่อ
คุณต้องการพฤติกรรมการประกอบ การ Compaction หรือการเรียกคืนข้ามเซสชันที่แตกต่างออกไป

## เริ่มต้นอย่างรวดเร็ว

ตรวจสอบว่าเอนจินใดกำลังใช้งานอยู่:

```bash
openclaw doctor
# หรือดู config โดยตรง:
cat ~/.openclaw/openclaw.json | jq '.plugins.slots.contextEngine'
```

### การติดตั้ง Plugin เอนจินบริบท

Plugins เอนจินบริบทติดตั้งได้เหมือน Plugin อื่น ๆ ของ OpenClaw ติดตั้ง
ก่อน แล้วจึงเลือกเอนจินใน slot:

```bash
# ติดตั้งจาก npm
openclaw plugins install @martian-engineering/lossless-claw

# หรือติดตั้งจากพาธภายในเครื่อง (สำหรับการพัฒนา)
openclaw plugins install -l ./my-context-engine
```

จากนั้นเปิดใช้งาน Plugin และเลือกให้เป็นเอนจินที่ใช้งานอยู่ใน config ของคุณ:

```json5
// openclaw.json
{
  plugins: {
    slots: {
      contextEngine: "lossless-claw", // ต้องตรงกับ engine id ที่ Plugin ลงทะเบียนไว้
    },
    entries: {
      "lossless-claw": {
        enabled: true,
        // config เฉพาะของ Plugin ใส่ตรงนี้ (ดูจากเอกสารของ Plugin)
      },
    },
  },
}
```

รีสตาร์ต gateway หลังติดตั้งและกำหนดค่าเสร็จ

หากต้องการสลับกลับไปใช้เอนจินในตัว ให้ตั้งค่า `contextEngine` เป็น `"legacy"` (หรือ
ลบคีย์นี้ออกทั้งหมด — `"legacy"` คือค่าเริ่มต้น)

## การทำงานของมัน

ทุกครั้งที่ OpenClaw รัน prompt ของโมเดล เอนจินบริบทจะเข้ามามีส่วนร่วมที่
สี่จุดในวงจรชีวิต:

1. **Ingest** — ถูกเรียกเมื่อมีการเพิ่มข้อความใหม่ลงในเซสชัน เอนจิน
   สามารถเก็บหรือทำดัชนีข้อความนั้นใน data store ของตัวเองได้
2. **Assemble** — ถูกเรียกก่อนการรันโมเดลแต่ละครั้ง เอนจินจะส่งคืน
   ชุดข้อความที่เรียงลำดับแล้ว (และ `systemPromptAddition` แบบไม่บังคับ) ที่อยู่ภายใน
   token budget
3. **Compact** — ถูกเรียกเมื่อหน้าต่างบริบทเต็ม หรือเมื่อผู้ใช้รัน
   `/compact` เอนจินจะสรุปประวัติเก่าเพื่อคืนพื้นที่
4. **After turn** — ถูกเรียกหลังการรันเสร็จสิ้น เอนจินสามารถคงสถานะไว้
   ทริกเกอร์ Compaction เบื้องหลัง หรืออัปเดตดัชนีได้

สำหรับ Codex harness แบบ non-ACP ที่รวมมาให้ OpenClaw จะใช้วงจรชีวิตเดียวกันนี้
โดยฉายบริบทที่ประกอบแล้วเข้าไปในคำสั่งสำหรับนักพัฒนา Codex และ prompt ของเทิร์น
ปัจจุบัน Codex ยังคงเป็นผู้จัดการประวัติเธรดและ compactor แบบเนทีฟของตัวเอง

### วงจรชีวิตของ subagent (ไม่บังคับ)

OpenClaw เรียกสอง hooks ของวงจรชีวิต subagent แบบไม่บังคับ:

- **prepareSubagentSpawn** — เตรียมสถานะบริบทร่วมก่อนที่ child run
  จะเริ่ม hook นี้จะได้รับ parent/child session keys, `contextMode`
  (`isolated` หรือ `fork`), transcript ids/files ที่มีอยู่ และ TTL แบบไม่บังคับ
  หากมันส่งคืน rollback handle, OpenClaw จะเรียกมันเมื่อการ spawn ล้มเหลวหลังจาก
  การเตรียมสำเร็จแล้ว
- **onSubagentEnded** — เก็บกวาดเมื่อ subagent session เสร็จสิ้นหรือถูกกวาดออก

### System prompt addition

เมธอด `assemble` สามารถส่งคืนสตริง `systemPromptAddition` ได้ OpenClaw
จะนำสตริงนี้ไปไว้หน้าระบบ prompt สำหรับการรันนั้น สิ่งนี้ทำให้เอนจินสามารถแทรก
คำแนะนำการเรียกคืนแบบไดนามิก คำสั่งการดึงข้อมูล หรือคำใบ้ที่รับรู้บริบท
โดยไม่ต้องพึ่งไฟล์ workspace แบบคงที่

## เอนจิน legacy

เอนจิน `legacy` ในตัวจะคงพฤติกรรมดั้งเดิมของ OpenClaw ไว้:

- **Ingest**: no-op (session manager จัดการการคงข้อความโดยตรงอยู่แล้ว)
- **Assemble**: ส่งผ่านตรง (pipeline เดิม sanitize → validate → limit
  ใน runtime จะจัดการการประกอบบริบท)
- **Compact**: มอบหมายให้กับ Compaction แบบสรุปในตัว ซึ่งจะสร้าง
  summary เดียวของข้อความเก่าและคงข้อความล่าสุดไว้
- **After turn**: no-op

เอนจิน legacy จะไม่ลงทะเบียน tools และไม่ให้ `systemPromptAddition`

เมื่อไม่ได้ตั้งค่า `plugins.slots.contextEngine` (หรือตั้งเป็น `"legacy"`) ระบบจะใช้
เอนจินนี้โดยอัตโนมัติ

## เอนจินแบบ Plugin

Plugin สามารถลงทะเบียนเอนจินบริบทได้ผ่าน Plugin API:

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
      // เก็บข้อความไว้ใน data store ของคุณ
      return { ingested: true };
    },

    async assemble({ sessionId, messages, tokenBudget, availableTools, citationsMode }) {
      // ส่งคืนข้อความที่อยู่ภายใน budget
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
      // สรุปบริบทเก่า
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

### อินเทอร์เฟซ ContextEngine

สมาชิกที่จำเป็น:

| สมาชิก             | ชนิด     | วัตถุประสงค์                                           |
| ------------------ | -------- | ------------------------------------------------------ |
| `info`             | Property | id ชื่อ เวอร์ชันของเอนจิน และเอนจินเป็นเจ้าของ Compaction หรือไม่ |
| `ingest(params)`   | Method   | เก็บข้อความเดี่ยวหนึ่งรายการ                           |
| `assemble(params)` | Method   | สร้างบริบทสำหรับการรันโมเดล (ส่งคืน `AssembleResult`) |
| `compact(params)`  | Method   | สรุป/ลดบริบท                                           |

`assemble` จะส่งคืน `AssembleResult` พร้อม:

- `messages` — ข้อความที่เรียงลำดับแล้วที่จะส่งไปยังโมเดล
- `estimatedTokens` (จำเป็น, `number`) — ค่าประมาณของเอนจินสำหรับจำนวน
  token ทั้งหมดในบริบทที่ประกอบแล้ว OpenClaw ใช้ค่านี้สำหรับการตัดสินใจ threshold ของ Compaction
  และการรายงานวินิจฉัย
- `systemPromptAddition` (ไม่บังคับ, `string`) — เพิ่มไว้หน้าระบบ prompt

สมาชิกแบบไม่บังคับ:

| สมาชิก                         | ชนิด   | วัตถุประสงค์                                                                                                   |
| ------------------------------ | ------ | -------------------------------------------------------------------------------------------------------------- |
| `bootstrap(params)`            | Method | เริ่มต้นสถานะของเอนจินสำหรับเซสชัน ถูกเรียกหนึ่งครั้งเมื่อเอนจินเห็นเซสชันครั้งแรก (เช่น import ประวัติ) |
| `ingestBatch(params)`          | Method | Ingest เทิร์นที่เสร็จสมบูรณ์เป็นชุด ถูกเรียกหลังการรันเสร็จ โดยส่งข้อความทั้งหมดจากเทิร์นนั้นมาพร้อมกัน |
| `afterTurn(params)`            | Method | งานวงจรชีวิตหลังการรัน (คงสถานะไว้ ทริกเกอร์ Compaction เบื้องหลัง)                                        |
| `prepareSubagentSpawn(params)` | Method | ตั้งค่าสถานะร่วมสำหรับ child session ก่อนเริ่ม                                                              |
| `onSubagentEnded(params)`      | Method | เก็บกวาดหลังจาก subagent จบ                                                                                  |
| `dispose()`                    | Method | ปล่อยทรัพยากร ถูกเรียกระหว่างการปิด gateway หรือ reload Plugin — ไม่ใช่ต่อเซสชัน                           |

### ownsCompaction

`ownsCompaction` ควบคุมว่าการ auto-compaction ระหว่างความพยายามแบบในตัวของ Pi จะยังคง
เปิดใช้งานสำหรับการรันนั้นหรือไม่:

- `true` — เอนจินเป็นเจ้าของพฤติกรรม Compaction OpenClaw จะปิดการทำงาน
  auto-compaction ในตัวของ Pi สำหรับการรันนั้น และการ implement `compact()` ของเอนจิน
  จะรับผิดชอบ `/compact`, overflow recovery compaction และ Compaction เชิงรุก
  ใด ๆ ที่มันต้องการทำใน `afterTurn()`
- `false` หรือไม่ได้ตั้งค่า — auto-compaction ในตัวของ Pi อาจยังคงรันระหว่าง
  การประมวลผล prompt แต่เมธอด `compact()` ของเอนจินที่ใช้งานอยู่ก็ยังคงถูกเรียกสำหรับ
  `/compact` และ overflow recovery

`ownsCompaction: false` **ไม่ได้** หมายความว่า OpenClaw จะ fallback กลับไปใช้
เส้นทาง Compaction ของเอนจิน legacy โดยอัตโนมัติ

นั่นหมายความว่ามีรูปแบบ Plugin ที่ถูกต้องอยู่สองแบบ:

- **Owning mode** — implement อัลกอริทึม Compaction ของคุณเองและตั้งค่า
  `ownsCompaction: true`
- **Delegating mode** — ตั้งค่า `ownsCompaction: false` และให้ `compact()` เรียก
  `delegateCompactionToRuntime(...)` จาก `openclaw/plugin-sdk/core` เพื่อใช้
  พฤติกรรม Compaction ในตัวของ OpenClaw

`compact()` แบบ no-op ไม่ปลอดภัยสำหรับเอนจินแบบ non-owning ที่ใช้งานอยู่ เพราะมัน
จะปิดเส้นทาง `/compact` และ overflow-recovery compaction ปกติสำหรับ engine slot นั้น

## เอกสารอ้างอิงการกำหนดค่า

```json5
{
  plugins: {
    slots: {
      // เลือก context engine ที่ใช้งานอยู่ ค่าเริ่มต้น: "legacy"
      // ตั้งค่าเป็น plugin id เพื่อใช้ plugin engine
      contextEngine: "legacy",
    },
  },
}
```

slot นี้เป็นแบบ exclusive ระหว่างรันไทม์ — จะมีเพียงเอนจินบริบทที่ลงทะเบียนไว้หนึ่งตัวเท่านั้น
ที่ถูก resolve สำหรับการรันหรือการทำ Compaction ที่กำหนด Plugins อื่นที่เปิดใช้งานอยู่ซึ่งมี
`kind: "context-engine"` ยังสามารถโหลดและรันโค้ดการลงทะเบียนของพวกมันได้;
`plugins.slots.contextEngine` มีหน้าที่เพียงเลือก registered engine id
ที่ OpenClaw จะ resolve เมื่อต้องใช้เอนจินบริบท

## ความสัมพันธ์กับ Compaction และ memory

- **Compaction** เป็นหนึ่งในความรับผิดชอบของเอนจินบริบท เอนจิน legacy
  มอบหมายไปยังการสรุปในตัวของ OpenClaw ส่วนเอนจินแบบ Plugin สามารถ implement
  กลยุทธ์ Compaction แบบใดก็ได้ (DAG summaries, vector retrieval เป็นต้น)
- **Memory plugins** (`plugins.slots.memory`) แยกจากเอนจินบริบท
  Memory plugins ให้ความสามารถด้าน search/retrieval; ส่วนเอนจินบริบทควบคุมว่าโมเดล
  จะเห็นอะไร ทั้งสองอย่างทำงานร่วมกันได้ — เอนจินบริบทอาจใช้ข้อมูลจาก memory
  plugin ระหว่างการประกอบก็ได้ Plugin engines ที่ต้องการใช้เส้นทาง prompt ของ memory ที่ใช้งานอยู่
  ควรใช้ `buildMemorySystemPromptAddition(...)` จาก
  `openclaw/plugin-sdk/core` ซึ่งจะแปลงส่วนต่าง ๆ ของ prompt ของ active memory
  ให้เป็น `systemPromptAddition` ที่พร้อมนำไปเติมไว้ข้างหน้า หากเอนจินต้องการการควบคุมในระดับต่ำกว่า
  ก็ยังสามารถดึง raw lines จาก
  `openclaw/plugin-sdk/memory-host-core` ผ่าน
  `buildActiveMemoryPromptSection(...)` ได้
- **Session pruning** (การตัดผลลัพธ์ tool เก่าออกจากในหน่วยความจำ) ยังคงทำงาน
  ไม่ว่าจะใช้เอนจินบริบทตัวใดก็ตาม

## เคล็ดลับ

- ใช้ `openclaw doctor` เพื่อตรวจสอบว่าเอนจินของคุณโหลดได้ถูกต้อง
- หากสลับเอนจิน เซสชันเดิมจะยังคงดำเนินต่อไปพร้อมประวัติปัจจุบันของมัน
  เอนจินใหม่จะเข้ามารับหน้าที่สำหรับการรันในอนาคต
- ข้อผิดพลาดของเอนจินจะถูกบันทึกและแสดงในข้อมูลวินิจฉัย หาก Plugin engine
  ลงทะเบียนไม่สำเร็จ หรือไม่สามารถ resolve selected engine id ได้ OpenClaw
  จะไม่ fallback โดยอัตโนมัติ; การรันจะล้มเหลวจนกว่าคุณจะแก้ไข Plugin หรือ
  สลับ `plugins.slots.contextEngine` กลับไปเป็น `"legacy"`
- สำหรับการพัฒนา ใช้ `openclaw plugins install -l ./my-engine` เพื่อ link
  ไดเรกทอรี Plugin ภายในเครื่องโดยไม่ต้องคัดลอก

ดูเพิ่มเติม: [Compaction](/th/concepts/compaction), [Context](/th/concepts/context),
[Plugins](/th/tools/plugin), [Plugin manifest](/th/plugins/manifest)

## ที่เกี่ยวข้อง

- [Context](/th/concepts/context) — วิธีสร้างบริบทสำหรับเทิร์นของเอเจนต์
- [Plugin Architecture](/th/plugins/architecture) — การลงทะเบียน Plugins เอนจินบริบท
- [Compaction](/th/concepts/compaction) — การสรุปบทสนทนายาว ๆ
