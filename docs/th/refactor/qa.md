---
x-i18n:
    generated_at: "2026-04-23T05:54:02Z"
    model: gpt-5.4
    provider: openai
    source_hash: dbb2c70c82da7f6f12d90e25666635ff4147c52e8a94135e902d1de4f5cbccca
    source_path: refactor/qa.md
    workflow: 15
---

# การปรับโครงสร้าง QA

สถานะ: วางรากฐานของการย้ายระบบเสร็จแล้ว

## เป้าหมาย

ย้าย QA ของ OpenClaw จากโมเดลที่แยกนิยามออกจากกัน ไปสู่แหล่งข้อมูลจริงเพียงหนึ่งเดียว:

- metadata ของสถานการณ์
- พรอมป์ที่ส่งไปยังโมเดล
- การตั้งค่าและการเก็บกวาด
- ตรรกะของ harness
- assertions และเกณฑ์ความสำเร็จ
- artifacts และคำใบ้ของรายงาน

สถานะปลายทางที่ต้องการคือ QA harness แบบทั่วไปที่โหลดไฟล์นิยามสถานการณ์ที่ทรงพลัง แทนการ hardcode พฤติกรรมส่วนใหญ่ไว้ใน TypeScript

## สถานะปัจจุบัน

แหล่งข้อมูลจริงหลักตอนนี้อยู่ใน `qa/scenarios/index.md` พร้อมไฟล์หนึ่งไฟล์ต่อ
หนึ่งสถานการณ์ใต้ `qa/scenarios/<theme>/*.md`

สิ่งที่ทำเสร็จแล้ว:

- `qa/scenarios/index.md`
  - metadata แบบ canonical ของ QA pack
  - อัตลักษณ์ของ operator
  - ภารกิจ kickoff
- `qa/scenarios/<theme>/*.md`
  - หนึ่งไฟล์ Markdown ต่อหนึ่งสถานการณ์
  - metadata ของสถานการณ์
  - การผูกกับ handler
  - config การทำงานเฉพาะสถานการณ์
- `extensions/qa-lab/src/scenario-catalog.ts`
  - ตัว parse markdown pack + การตรวจสอบด้วย zod
- `extensions/qa-lab/src/qa-agent-bootstrap.ts`
  - การเรนเดอร์แผนจาก markdown pack
- `extensions/qa-lab/src/qa-agent-workspace.ts`
  - สร้างไฟล์ compatibility แบบ seed พร้อม `QA_SCENARIOS.md`
- `extensions/qa-lab/src/suite.ts`
  - เลือกสถานการณ์ที่รันได้ผ่านการผูกกับ handler ที่นิยามใน markdown
- โปรโตคอล QA bus + UI
  - inline attachment แบบทั่วไปสำหรับการเรนเดอร์ภาพ/วิดีโอ/เสียง/ไฟล์

พื้นผิวที่ยังแยกกันอยู่:

- `extensions/qa-lab/src/suite.ts`
  - ยังเป็นเจ้าของตรรกะ custom handler ที่รันได้เกือบทั้งหมด
- `extensions/qa-lab/src/report.ts`
  - ยังสร้างโครงสร้างรายงานจากเอาต์พุตของรันไทม์

ดังนั้นปัญหาการแยกแหล่งข้อมูลจริงได้รับการแก้แล้ว แต่การทำงานจริงยังคงอิงกับ handler เป็นส่วนใหญ่ มากกว่าจะเป็นแบบ declarative ทั้งหมด

## พื้นผิวสถานการณ์จริงมีหน้าตาอย่างไร

เมื่ออ่าน suite ปัจจุบัน จะเห็นคลาสของสถานการณ์ที่แตกต่างกันอยู่ไม่กี่แบบ

### การโต้ตอบแบบง่าย

- channel baseline
- DM baseline
- threaded follow-up
- model switch
- approval followthrough
- reaction/edit/delete

### การเปลี่ยนแปลง config และรันไทม์

- config patch skill disable
- config apply restart wake-up
- config restart capability flip
- runtime inventory drift check

### Assertions ของระบบไฟล์และ repo

- source/docs discovery report
- build Lobster Invaders
- generated image artifact lookup

### การ orchestration ของ memory

- memory recall
- memory tools in channel context
- memory failure fallback
- session memory ranking
- thread memory isolation
- memory Dreaming sweep

### การผสานรวมกับ tool และ Plugin

- MCP plugin-tools call
- skill visibility
- skill hot install
- native image generation
- image roundtrip
- image understanding from attachment

### หลายเทิร์นและหลายผู้มีบทบาท

- subagent handoff
- subagent fanout synthesis
- restart recovery style flows

หมวดหมู่เหล่านี้สำคัญ เพราะมันเป็นตัวผลักดันข้อกำหนดของ DSL รายการแบบแบนที่มีเพียง prompt + expected text นั้นไม่เพียงพอ

## ทิศทาง

### แหล่งข้อมูลจริงเพียงหนึ่งเดียว

ใช้ `qa/scenarios/index.md` ร่วมกับ `qa/scenarios/<theme>/*.md` เป็น
แหล่งข้อมูลจริงที่ใช้เขียน

pack ควรคงคุณสมบัติดังนี้:

- มนุษย์อ่านเข้าใจได้ในการรีวิว
- เครื่อง parse ได้
- มีความสมบูรณ์พอที่จะขับเคลื่อน:
  - การทำงานของ suite
  - การ bootstrap workspace ของ QA
  - metadata ของ QA Lab UI
  - prompt สำหรับ docs/discovery
  - การสร้างรายงาน

### รูปแบบการเขียนที่แนะนำ

ใช้ markdown เป็นรูปแบบระดับบนสุด โดยมี YAML แบบมีโครงสร้างอยู่ภายใน

โครงสร้างที่แนะนำ:

- YAML frontmatter
  - id
  - title
  - surface
  - tags
  - docs refs
  - code refs
  - model/provider overrides
  - prerequisites
- ส่วน prose
  - objective
  - notes
  - debugging hints
- fenced YAML blocks
  - setup
  - steps
  - assertions
  - cleanup

สิ่งนี้ให้:

- ความอ่านง่ายใน PR ดีกว่า JSON ขนาดใหญ่
- บริบทที่เข้มข้นกว่า YAML ล้วน
- การ parse ที่เข้มงวดและการตรวจสอบด้วย zod

Raw JSON ยอมรับได้เฉพาะในฐานะรูปแบบกลางที่ถูกสร้างขึ้นเท่านั้น

## รูปร่างไฟล์สถานการณ์ที่เสนอ

ตัวอย่าง:

````md
---
id: image-generation-roundtrip
title: Image generation roundtrip
surface: image
tags: [media, image, roundtrip]
models:
  primary: openai/gpt-5.4
requires:
  tools: [image_generate]
  plugins: [openai, qa-channel]
docsRefs:
  - docs/help/testing.md
  - docs/concepts/model-providers.md
codeRefs:
  - extensions/qa-lab/src/suite.ts
  - src/gateway/chat-attachments.ts
---

# Objective

Verify generated media is reattached on the follow-up turn.

# Setup

```yaml scenario.setup
- action: config.patch
  patch:
    agents:
      defaults:
        imageGenerationModel:
          primary: openai/gpt-image-1
- action: session.create
  key: agent:qa:image-roundtrip
```

# Steps

```yaml scenario.steps
- action: agent.send
  session: agent:qa:image-roundtrip
  message: |
    Image generation check: generate a QA lighthouse image and summarize it in one short sentence.
- action: artifact.capture
  kind: generated-image
  promptSnippet: Image generation check
  saveAs: lighthouseImage
- action: agent.send
  session: agent:qa:image-roundtrip
  message: |
    Roundtrip image inspection check: describe the generated lighthouse attachment in one short sentence.
  attachments:
    - fromArtifact: lighthouseImage
```

# Expect

```yaml scenario.expect
- assert: outbound.textIncludes
  value: lighthouse
- assert: requestLog.matches
  where:
    promptIncludes: Roundtrip image inspection check
  imageInputCountGte: 1
- assert: artifact.exists
  ref: lighthouseImage
```
````

## ความสามารถของ Runner ที่ DSL ต้องครอบคลุม

จาก suite ปัจจุบัน generic runner ต้องทำได้มากกว่าการรันพรอมป์

### การตั้งค่าสภาพแวดล้อมและ action สำหรับ setup

- `bus.reset`
- `gateway.waitHealthy`
- `channel.waitReady`
- `session.create`
- `thread.create`
- `workspace.writeSkill`

### action ของเทิร์นเอเจนต์

- `agent.send`
- `agent.wait`
- `bus.injectInbound`
- `bus.injectOutbound`

### action ด้าน config และรันไทม์

- `config.get`
- `config.patch`
- `config.apply`
- `gateway.restart`
- `tools.effective`
- `skills.status`

### action ด้านไฟล์และ artifact

- `file.write`
- `file.read`
- `file.delete`
- `file.touchTime`
- `artifact.captureGeneratedImage`
- `artifact.capturePath`

### action ด้าน memory และ Cron

- `memory.indexForce`
- `memory.searchCli`
- `doctor.memory.status`
- `cron.list`
- `cron.run`
- `cron.waitCompletion`
- `sessionTranscript.write`

### action ของ MCP

- `mcp.callTool`

### Assertions

- `outbound.textIncludes`
- `outbound.inThread`
- `outbound.notInRoot`
- `tool.called`
- `tool.notPresent`
- `skill.visible`
- `skill.disabled`
- `file.contains`
- `memory.contains`
- `requestLog.matches`
- `sessionStore.matches`
- `cron.managedPresent`
- `artifact.exists`

## ตัวแปรและการอ้างอิง Artifact

DSL ต้องรองรับเอาต์พุตที่บันทึกไว้และการอ้างอิงในภายหลัง

ตัวอย่างจาก suite ปัจจุบัน:

- สร้าง thread แล้วใช้ `threadId` ซ้ำ
- สร้าง session แล้วใช้ `sessionKey` ซ้ำ
- สร้างภาพ แล้วแนบไฟล์ในเทิร์นถัดไป
- สร้างสตริง wake marker แล้ว assert ว่ามันปรากฏภายหลัง

ความสามารถที่จำเป็น:

- `saveAs`
- `${vars.name}`
- `${artifacts.name}`
- การอ้างอิงแบบมีชนิดสำหรับ paths, session keys, thread ids, markers, tool outputs

หากไม่มีการรองรับตัวแปร harness จะยังคงมีตรรกะของสถานการณ์รั่วกลับไปที่ TypeScript ต่อไป

## อะไรควรคงไว้เป็นช่องทางหลีกเลี่ยง

runner แบบ declarative ล้วนทั้งหมดไม่ใช่สิ่งที่สมจริงใน phase 1

บางสถานการณ์โดยธรรมชาติแล้วต้องการ orchestration สูง:

- memory Dreaming sweep
- config apply restart wake-up
- config restart capability flip
- การ resolve generated image artifact ด้วย timestamp/path
- การประเมิน discovery-report

ในตอนนี้ สิ่งเหล่านี้ควรใช้ custom handler แบบ explicit

กฎที่แนะนำ:

- 85-90% เป็น declarative
- ใช้ขั้นตอน `customHandler` แบบ explicit สำหรับส่วนที่ยากที่เหลือ
- อนุญาตเฉพาะ custom handler ที่มีชื่อและมีเอกสารกำกับ
- ไม่มีโค้ด inline แบบไม่ระบุตัวตนในไฟล์สถานการณ์

สิ่งนี้ทำให้ generic engine สะอาด ขณะเดียวกันก็ยังเดินหน้าต่อได้

## การเปลี่ยนแปลงสถาปัตยกรรม

### ปัจจุบัน

ตอนนี้ markdown ของสถานการณ์เป็นแหล่งข้อมูลจริงสำหรับ:

- การทำงานของ suite
- ไฟล์ bootstrap ของ workspace
- แค็ตตาล็อกสถานการณ์ของ QA Lab UI
- metadata ของรายงาน
- discovery prompts

compatibility ที่ถูกสร้างขึ้น:

- workspace ที่ seed แล้วยังคงมี `QA_KICKOFF_TASK.md`
- workspace ที่ seed แล้วยังคงมี `QA_SCENARIO_PLAN.md`
- workspace ที่ seed แล้วตอนนี้มี `QA_SCENARIOS.md` เพิ่มด้วย

## แผนการ Refactor

### เฟส 1: loader และ schema

เสร็จแล้ว

- เพิ่ม `qa/scenarios/index.md`
- แยกสถานการณ์ไปไว้ใน `qa/scenarios/<theme>/*.md`
- เพิ่ม parser สำหรับเนื้อหา markdown YAML pack แบบมีชื่อ
- ตรวจสอบด้วย zod
- เปลี่ยนผู้ใช้ทั้งหมดให้ใช้ pack ที่ parse แล้ว
- ลบ `qa/seed-scenarios.json` และ `qa/QA_KICKOFF_TASK.md` ระดับ repo

### เฟส 2: generic engine

- แยก `extensions/qa-lab/src/suite.ts` ออกเป็น:
  - loader
  - engine
  - action registry
  - assertion registry
  - custom handlers
- คง helper function ที่มีอยู่เดิมไว้ในฐานะ operation ของ engine

สิ่งส่งมอบ:

- engine รันสถานการณ์ declarative แบบง่ายได้

เริ่มจากสถานการณ์ที่ส่วนใหญ่เป็น prompt + wait + assert:

- threaded follow-up
- image understanding from attachment
- skill visibility and invocation
- channel baseline

สิ่งส่งมอบ:

- มีสถานการณ์จริงชุดแรกที่นิยามด้วย markdown และถูกส่งผ่าน generic engine

### เฟส 4: ย้ายสถานการณ์ระดับกลาง

- image generation roundtrip
- memory tools in channel context
- session memory ranking
- subagent handoff
- subagent fanout synthesis

สิ่งส่งมอบ:

- พิสูจน์การทำงานของ variables, artifacts, tool assertions, request-log assertions

### เฟส 5: คงสถานการณ์ยากไว้บน custom handlers

- memory Dreaming sweep
- config apply restart wake-up
- config restart capability flip
- runtime inventory drift

สิ่งส่งมอบ:

- ใช้รูปแบบการเขียนเดียวกัน แต่มีบล็อก custom-step แบบ explicit เมื่อจำเป็น

### เฟส 6: ลบแผนที่สถานการณ์ที่ hardcode ไว้

เมื่อความครอบคลุมของ pack ดีพอแล้ว:

- ลบ branching แบบ TypeScript เฉพาะสถานการณ์ส่วนใหญ่ออกจาก `extensions/qa-lab/src/suite.ts`

## Fake Slack / การรองรับ Rich Media

QA bus ปัจจุบันยังเน้นข้อความเป็นหลัก

ไฟล์ที่เกี่ยวข้อง:

- `extensions/qa-channel/src/protocol.ts`
- `extensions/qa-lab/src/bus-state.ts`
- `extensions/qa-lab/src/bus-queries.ts`
- `extensions/qa-lab/src/bus-server.ts`
- `extensions/qa-lab/web/src/ui-render.ts`

ปัจจุบัน QA bus รองรับ:

- ข้อความ
- reactions
- threads

ยังไม่สามารถจำลอง inline media attachment ได้

### สัญญา transport ที่จำเป็น

เพิ่มโมเดล attachment แบบทั่วไปให้ QA bus:

```ts
type QaBusAttachment = {
  id: string;
  kind: "image" | "video" | "audio" | "file";
  mimeType: string;
  fileName?: string;
  inline?: boolean;
  url?: string;
  contentBase64?: string;
  width?: number;
  height?: number;
  durationMs?: number;
  altText?: string;
  transcript?: string;
};
```

จากนั้นเพิ่ม `attachments?: QaBusAttachment[]` ให้กับ:

- `QaBusMessage`
- `QaBusInboundMessageInput`
- `QaBusOutboundMessageInput`

### ทำไมต้องเริ่มจากแบบทั่วไปก่อน

อย่าสร้างโมเดลสื่อที่ผูกกับ Slack เพียงอย่างเดียว

ให้สร้างเป็น:

- โมเดล transport QA แบบทั่วไปหนึ่งชุด
- แล้วมีหลาย renderer อยู่ด้านบน
  - แชตของ QA Lab ปัจจุบัน
  - fake Slack web ในอนาคต
  - มุมมอง fake transport อื่น ๆ

สิ่งนี้ป้องกันตรรกะซ้ำซ้อนและทำให้สถานการณ์เกี่ยวกับสื่อยังคงเป็นอิสระจาก transport

### งาน UI ที่ต้องทำ

อัปเดต QA UI ให้เรนเดอร์:

- ตัวอย่างภาพแบบ inline
- ตัวเล่นเสียงแบบ inline
- ตัวเล่นวิดีโอแบบ inline
- ชิปไฟล์แนบ

UI ปัจจุบันเรนเดอร์ threads และ reactions ได้อยู่แล้ว ดังนั้นการเรนเดอร์ attachment ควรซ้อนเพิ่มบนโมเดล message card เดียวกันได้

### งานด้านสถานการณ์ที่จะเปิดทางด้วย media transport

เมื่อ attachments ไหลผ่าน QA bus ได้แล้ว เราจะเพิ่มสถานการณ์ fake-chat ที่สมจริงขึ้นได้:

- การตอบกลับด้วยภาพแบบ inline ใน fake Slack
- การเข้าใจไฟล์แนบเสียง
- การเข้าใจไฟล์แนบวิดีโอ
- ลำดับของไฟล์แนบแบบผสม
- การตอบกลับใน thread พร้อมคงสื่อไว้

## ข้อเสนอแนะ

ช่วงงานถัดไปที่ควรทำคือ:

1. เพิ่ม markdown scenario loader + zod schema
2. สร้างแค็ตตาล็อกปัจจุบันจาก markdown
3. ย้ายสถานการณ์ง่าย ๆ ไม่กี่ตัวก่อน
4. เพิ่มการรองรับ QA bus attachment แบบทั่วไป
5. เรนเดอร์ภาพแบบ inline ใน QA UI
6. จากนั้นค่อยขยายไปยังเสียงและวิดีโอ

นี่คือเส้นทางที่เล็กที่สุดซึ่งพิสูจน์ได้ทั้งสองเป้าหมาย:

- QA แบบทั่วไปที่นิยามด้วย markdown
- พื้นผิว fake messaging ที่สมจริงขึ้น

## คำถามที่ยังเปิดอยู่

- ไฟล์สถานการณ์ควรอนุญาตให้มีเทมเพลตพรอมป์แบบ markdown ที่ฝังอยู่พร้อมการแทรกตัวแปรหรือไม่
- setup/cleanup ควรเป็นส่วนที่มีชื่อชัดเจนหรือเป็นเพียงรายการ action ตามลำดับ
- การอ้างอิง artifact ควรมีชนิดที่เข้มงวดใน schema หรือเป็นแบบสตริง
- custom handlers ควรอยู่ในรีจิสทรีเดียวหรือแยกเป็นรีจิสทรีต่อพื้นผิว
- ระหว่างการย้ายระบบ ไฟล์ compatibility แบบ JSON ที่สร้างขึ้นควรถูกเก็บไว้ในระบบควบคุมเวอร์ชันต่อไปหรือไม่
