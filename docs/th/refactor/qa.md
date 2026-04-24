---
read_when:
    - การรีแฟกเตอร์คำจำกัดความสถานการณ์ QA หรือโค้ด harness ของ qa-lab
    - การย้ายพฤติกรรม QA ระหว่างสถานการณ์แบบ Markdown และตรรกะ harness ของ TypeScript
summary: แผนรีแฟกเตอร์ QA สำหรับแค็ตตาล็อกสถานการณ์และการรวมศูนย์ harness
title: รีแฟกเตอร์ QA
x-i18n:
    generated_at: "2026-04-24T09:30:51Z"
    model: gpt-5.4
    provider: openai
    source_hash: 0d774d7b5e0fffd5c2504d9a4d6063198d77b866263ea8448474dce6246012d4
    source_path: refactor/qa.md
    workflow: 15
---

สถานะ: การย้ายโครงสร้างพื้นฐานเสร็จสิ้นแล้ว

## เป้าหมาย

ย้าย QA ของ OpenClaw จากโมเดลที่มีการแยกคำจำกัดความออกเป็นหลายส่วน ไปสู่แหล่งความจริงเดียว:

- metadata ของสถานการณ์
- prompt ที่ส่งไปยังโมเดล
- setup และ teardown
- ตรรกะ harness
- assertion และเกณฑ์ความสำเร็จ
- artifact และ hint ของรายงาน

สภาพปลายทางที่ต้องการคือ QA harness แบบทั่วไป ที่โหลดไฟล์คำจำกัดความสถานการณ์ที่ทรงพลัง แทนการฮาร์ดโค้ดพฤติกรรมส่วนใหญ่ไว้ใน TypeScript

## สถานะปัจจุบัน

แหล่งความจริงหลักตอนนี้อยู่ใน `qa/scenarios/index.md` พร้อมไฟล์ละหนึ่งสถานการณ์ภายใต้
`qa/scenarios/<theme>/*.md`

สิ่งที่ทำแล้ว:

- `qa/scenarios/index.md`
  - metadata ของ QA pack แบบ canonical
  - อัตลักษณ์ของ operator
  - ภารกิจเริ่มต้น
- `qa/scenarios/<theme>/*.md`
  - หนึ่งไฟล์ Markdown ต่อหนึ่งสถานการณ์
  - metadata ของสถานการณ์
  - การผูกกับ handler
  - คอนฟิกการรันเฉพาะสถานการณ์
- `extensions/qa-lab/src/scenario-catalog.ts`
  - ตัวแยกวิเคราะห์ Markdown pack + การตรวจสอบด้วย zod
- `extensions/qa-lab/src/qa-agent-bootstrap.ts`
  - การเรนเดอร์ plan จาก Markdown pack
- `extensions/qa-lab/src/qa-agent-workspace.ts`
  - สร้างไฟล์ความเข้ากันได้พร้อม seed รวมถึง `QA_SCENARIOS.md`
- `extensions/qa-lab/src/suite.ts`
  - เลือกสถานการณ์ที่รันได้ผ่านการผูก handler ที่กำหนดใน Markdown
- โปรโตคอล QA bus + UI
  - attachment แบบ inline ทั่วไปสำหรับการเรนเดอร์ image/video/audio/file

พื้นผิวที่ยังแยกกันอยู่:

- `extensions/qa-lab/src/suite.ts`
  - ยังคงเป็นเจ้าของตรรกะ custom handler ที่รันได้ส่วนใหญ่
- `extensions/qa-lab/src/report.ts`
  - ยังคงอนุมานโครงสร้างรายงานจากเอาต์พุตของรันไทม์

ดังนั้นปัญหาการแยกแหล่งความจริงได้รับการแก้แล้ว แต่การรันยังคงพึ่ง handler เป็นหลักมากกว่าจะเป็น declarative เต็มรูปแบบ

## พื้นผิวสถานการณ์จริงมีลักษณะอย่างไร

การอ่าน suite ปัจจุบันแสดงให้เห็นคลาสของสถานการณ์ที่แตกต่างกันอยู่ไม่กี่แบบ

### ปฏิสัมพันธ์แบบง่าย

- baseline ของ channel
- baseline ของ DM
- การติดตามต่อในเธรด
- การสลับโมเดล
- การทำตาม approval จนเสร็จ
- reaction/edit/delete

### การเปลี่ยนแปลง config และรันไทม์

- ปิดใช้งาน skill ด้วยการ patch config
- ตื่นขึ้นมาหลัง apply config และรีสตาร์ต
- การพลิกความสามารถหลังรีสตาร์ตจาก config
- การตรวจสอบ runtime inventory drift

### assertion ของระบบไฟล์และรีโพ

- รายงานการค้นหา source/docs
- build Lobster Invaders
- การค้นหา artifact ของภาพที่สร้างขึ้น

### การประสานงานหน่วยความจำ

- การเรียกคืนหน่วยความจำ
- เครื่องมือหน่วยความจำในบริบท channel
- fallback เมื่อหน่วยความจำล้มเหลว
- การจัดอันดับหน่วยความจำของเซสชัน
- การแยกหน่วยความจำตามเธรด
- memory Dreaming sweep

### การเชื่อมต่อเครื่องมือและ Plugin

- การเรียก MCP plugin-tools
- การมองเห็น Skills
- การติดตั้ง Skills แบบ hot
- การสร้างภาพแบบเนทีฟ
- image roundtrip
- การทำความเข้าใจภาพจาก attachment

### หลายเทิร์นและหลายผู้มีส่วนร่วม

- การส่งต่องานให้ subagent
- การสังเคราะห์แบบ fanout ของ subagent
- flow แบบกู้คืนหลังรีสตาร์ต

หมวดหมู่เหล่านี้สำคัญ เพราะเป็นตัวขับเคลื่อนความต้องการของ DSL รายการแบบ prompt + ข้อความที่คาดหวังอย่างเดียวไม่เพียงพอ

## ทิศทาง

### แหล่งความจริงเดียว

ใช้ `qa/scenarios/index.md` ร่วมกับ `qa/scenarios/<theme>/*.md` เป็น
แหล่งความจริงที่ใช้เขียน

pack ควรคงไว้ดังนี้:

- อ่านเข้าใจได้โดยมนุษย์ระหว่างรีวิว
- แยกวิเคราะห์โดยเครื่องได้
- มีความสมบูรณ์พอที่จะขับเคลื่อน:
  - การรัน suite
  - การ bootstrap QA workspace
  - metadata ของ QA Lab UI
  - prompt สำหรับ docs/discovery
  - การสร้างรายงาน

### รูปแบบการเขียนที่แนะนำ

ใช้ Markdown เป็นรูปแบบระดับบนสุด โดยมี YAML แบบมีโครงสร้างอยู่ภายใน

รูปร่างที่แนะนำ:

- YAML frontmatter
  - id
  - title
  - surface
  - tags
  - docs refs
  - code refs
  - model/provider override
  - prerequisite
- prose section
  - objective
  - notes
  - debugging hints
- fenced YAML block
  - setup
  - steps
  - assertions
  - cleanup

สิ่งนี้ให้:

- อ่าน PR ได้ดีกว่า JSON ก้อนใหญ่
- มีบริบทมากกว่า YAML ล้วน
- แยกวิเคราะห์อย่างเข้มงวดและตรวจสอบด้วย zod ได้

Raw JSON ยอมรับได้เฉพาะในฐานะรูปแบบตัวกลางที่สร้างขึ้นเท่านั้น

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

# วัตถุประสงค์

ตรวจสอบว่าสื่อที่สร้างขึ้นถูกแนบกลับมาอีกครั้งในเทิร์นติดตามผล

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
    การตรวจสอบการสร้างภาพ: สร้างภาพประภาคารสำหรับ QA และสรุปเป็นหนึ่งประโยคสั้น ๆ
- action: artifact.capture
  kind: generated-image
  promptSnippet: การตรวจสอบการสร้างภาพ
  saveAs: lighthouseImage
- action: agent.send
  session: agent:qa:image-roundtrip
  message: |
    การตรวจสอบภาพแบบ roundtrip: อธิบาย attachment ของภาพประภาคารที่สร้างขึ้นเป็นหนึ่งประโยคสั้น ๆ
  attachments:
    - fromArtifact: lighthouseImage
```

# Expect

```yaml scenario.expect
- assert: outbound.textIncludes
  value: lighthouse
- assert: requestLog.matches
  where:
    promptIncludes: การตรวจสอบภาพแบบ roundtrip
  imageInputCountGte: 1
- assert: artifact.exists
  ref: lighthouseImage
```
````

## ความสามารถของ runner ที่ DSL ต้องรองรับ

จาก suite ปัจจุบัน runner แบบทั่วไปต้องรองรับมากกว่าการรัน prompt

### การกระทำด้านสภาพแวดล้อมและ setup

- `bus.reset`
- `gateway.waitHealthy`
- `channel.waitReady`
- `session.create`
- `thread.create`
- `workspace.writeSkill`

### การกระทำของเทิร์นเอเจนต์

- `agent.send`
- `agent.wait`
- `bus.injectInbound`
- `bus.injectOutbound`

### การกระทำด้าน config และรันไทม์

- `config.get`
- `config.patch`
- `config.apply`
- `gateway.restart`
- `tools.effective`
- `skills.status`

### การกระทำด้านไฟล์และ artifact

- `file.write`
- `file.read`
- `file.delete`
- `file.touchTime`
- `artifact.captureGeneratedImage`
- `artifact.capturePath`

### การกระทำด้านหน่วยความจำและ Cron

- `memory.indexForce`
- `memory.searchCli`
- `doctor.memory.status`
- `cron.list`
- `cron.run`
- `cron.waitCompletion`
- `sessionTranscript.write`

### การกระทำของ MCP

- `mcp.callTool`

### assertion

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

## ตัวแปรและการอ้างอิง artifact

DSL ต้องรองรับการบันทึกเอาต์พุตไว้ใช้ และการอ้างอิงกลับภายหลัง

ตัวอย่างจาก suite ปัจจุบัน:

- สร้างเธรด แล้วนำ `threadId` มาใช้ซ้ำ
- สร้างเซสชัน แล้วนำ `sessionKey` มาใช้ซ้ำ
- สร้างภาพ แล้วแนบไฟล์นั้นในเทิร์นถัดไป
- สร้างสตริง wake marker แล้ว assertion ว่ามันปรากฏในภายหลัง

ความสามารถที่ต้องมี:

- `saveAs`
- `${vars.name}`
- `${artifacts.name}`
- การอ้างอิงแบบมีชนิดกำกับสำหรับ path, session key, thread id, marker, tool output

หากไม่มีการรองรับตัวแปร harness จะยังคงทำให้ตรรกะของสถานการณ์รั่วกลับเข้าไปใน TypeScript

## สิ่งที่ควรคงไว้เป็นทางหนี

runner แบบ declarative ล้วนเต็มรูปแบบไม่สมจริงในเฟส 1

บางสถานการณ์มีลักษณะหนักไปทาง orchestration โดยธรรมชาติ:

- memory Dreaming sweep
- ตื่นขึ้นมาหลัง apply config และรีสตาร์ต
- การพลิกความสามารถหลังรีสตาร์ตจาก config
- การ resolve artifact ของภาพที่สร้างขึ้นจาก timestamp/path
- การประเมิน discovery-report

สำหรับตอนนี้ สิ่งเหล่านี้ควรใช้ custom handler แบบชัดเจน

กฎที่แนะนำ:

- 85-90% เป็น declarative
- ใช้ขั้น `customHandler` แบบชัดเจนสำหรับส่วนที่ยากที่เหลือ
- ใช้เฉพาะ custom handler ที่ตั้งชื่อและมีเอกสาร
- ไม่มีโค้ด inline แบบไม่ระบุชื่อในไฟล์สถานการณ์

สิ่งนี้จะทำให้ generic engine สะอาด ขณะเดียวกันก็ยังเดินหน้าต่อได้

## การเปลี่ยนแปลงสถาปัตยกรรม

### ปัจจุบัน

Markdown ของสถานการณ์เป็นแหล่งความจริงอยู่แล้วสำหรับ:

- การรัน suite
- ไฟล์ bootstrap ของ workspace
- แค็ตตาล็อกสถานการณ์ของ QA Lab UI
- metadata ของรายงาน
- prompt สำหรับ discovery

ความเข้ากันได้ที่สร้างขึ้น:

- workspace ที่ seed แล้วยังคงมี `QA_KICKOFF_TASK.md`
- workspace ที่ seed แล้วยังคงมี `QA_SCENARIO_PLAN.md`
- workspace ที่ seed แล้วตอนนี้ยังมี `QA_SCENARIOS.md` ด้วย

## แผนรีแฟกเตอร์

### Phase 1: loader และ schema

เสร็จแล้ว

- เพิ่ม `qa/scenarios/index.md`
- แยกสถานการณ์ไปยัง `qa/scenarios/<theme>/*.md`
- เพิ่ม parser สำหรับเนื้อหา Markdown YAML pack แบบมีชื่อ
- ตรวจสอบด้วย zod
- สลับ consumer ให้ใช้ pack ที่แยกวิเคราะห์แล้ว
- ลบ `qa/seed-scenarios.json` และ `qa/QA_KICKOFF_TASK.md` ระดับรีโพ

### Phase 2: generic engine

- แยก `extensions/qa-lab/src/suite.ts` เป็น:
  - loader
  - engine
  - action registry
  - assertion registry
  - custom handlers
- คง helper function ที่มีอยู่ไว้เป็น operation ของ engine

สิ่งที่ส่งมอบได้:

- engine รันสถานการณ์ declarative แบบง่ายได้

เริ่มจากสถานการณ์ที่ส่วนใหญ่เป็น prompt + wait + assert:

- threaded follow-up
- image understanding from attachment
- skill visibility and invocation
- channel baseline

สิ่งที่ส่งมอบได้:

- สถานการณ์จริงชุดแรกที่นิยามใน Markdown และปล่อยใช้งานผ่าน generic engine

### Phase 4: ย้ายสถานการณ์ระดับกลาง

- image generation roundtrip
- memory tools in channel context
- session memory ranking
- subagent handoff
- subagent fanout synthesis

สิ่งที่ส่งมอบได้:

- พิสูจน์การทำงานของตัวแปร, artifact, tool assertion, request-log assertion

### Phase 5: คงสถานการณ์ยากไว้บน custom handler

- memory Dreaming sweep
- ตื่นขึ้นมาหลัง apply config และรีสตาร์ต
- การพลิกความสามารถหลังรีสตาร์ตจาก config
- runtime inventory drift

สิ่งที่ส่งมอบได้:

- ใช้รูปแบบการเขียนเดียวกัน แต่มีบล็อก custom-step แบบชัดเจนในจุดที่จำเป็น

### Phase 6: ลบ hardcoded scenario map

เมื่อ coverage ของ pack ดีเพียงพอแล้ว:

- ลบ branching แบบ TypeScript ที่เฉพาะกับสถานการณ์ส่วนใหญ่ ออกจาก `extensions/qa-lab/src/suite.ts`

## การรองรับ Fake Slack / Rich Media

QA bus ปัจจุบันเน้นข้อความเป็นหลัก

ไฟล์ที่เกี่ยวข้อง:

- `extensions/qa-channel/src/protocol.ts`
- `extensions/qa-lab/src/bus-state.ts`
- `extensions/qa-lab/src/bus-queries.ts`
- `extensions/qa-lab/src/bus-server.ts`
- `extensions/qa-lab/web/src/ui-render.ts`

ปัจจุบัน QA bus รองรับ:

- ข้อความ
- reaction
- เธรด

แต่ยังไม่สามารถจำลอง inline media attachment ได้

### สัญญา transport ที่ต้องมี

เพิ่มโมเดล attachment ของ QA bus แบบทั่วไป:

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

### เหตุใดจึงต้องทำแบบทั่วไปก่อน

อย่าสร้างโมเดลสื่อที่เป็นของ Slack อย่างเดียว

ให้ใช้:

- โมเดล transport ของ QA แบบทั่วไปหนึ่งชุด
- แล้วมี renderer หลายตัวอยู่ด้านบน
  - แชต QA Lab ปัจจุบัน
  - fake Slack web ในอนาคต
  - มุมมอง transport จำลองอื่น ๆ

สิ่งนี้จะป้องกันตรรกะซ้ำซ้อน และทำให้สถานการณ์สื่อยังคงไม่ผูกกับ transport ใด transport หนึ่ง

### งาน UI ที่ต้องทำ

อัปเดต QA UI ให้เรนเดอร์ได้ดังนี้:

- พรีวิวภาพแบบ inline
- ตัวเล่นเสียงแบบ inline
- ตัวเล่นวิดีโอแบบ inline
- ชิปไฟล์แนบ

UI ปัจจุบันสามารถเรนเดอร์เธรดและ reaction ได้อยู่แล้ว ดังนั้นการเรนเดอร์ attachment ควรวางซ้อนลงบนโมเดลการ์ดข้อความแบบเดียวกัน

### งานด้านสถานการณ์ที่จะเปิดให้ทำได้ด้วย media transport

เมื่อ attachment ไหลผ่าน QA bus ได้แล้ว เราจะเพิ่มสถานการณ์ fake-chat ที่สมบูรณ์ขึ้นได้:

- การตอบกลับด้วยภาพ inline ใน fake Slack
- การทำความเข้าใจ audio attachment
- การทำความเข้าใจ video attachment
- ลำดับ attachment แบบผสม
- การตอบกลับในเธรดโดยคงสื่อไว้

## ข้อแนะนำ

งานชุดถัดไปที่ควรทำคือ:

1. เพิ่ม loader ของสถานการณ์ Markdown + zod schema
2. สร้างแค็ตตาล็อกปัจจุบันจาก Markdown
3. ย้ายสถานการณ์ง่าย ๆ มาก่อนสักสองสามรายการ
4. เพิ่มการรองรับ attachment แบบทั่วไปใน QA bus
5. เรนเดอร์ภาพแบบ inline ใน QA UI
6. จากนั้นจึงขยายไปยัง audio และ video

นี่คือเส้นทางที่เล็กที่สุดซึ่งพิสูจน์ได้ทั้งสองเป้าหมาย:

- QA แบบทั่วไปที่นิยามด้วย Markdown
- พื้นผิวการส่งข้อความจำลองที่สมบูรณ์ยิ่งขึ้น

## คำถามที่ยังเปิดอยู่

- ควรอนุญาตให้ไฟล์สถานการณ์มีเทมเพลต prompt แบบ Markdown ที่ฝังอยู่พร้อมการแทรกตัวแปรหรือไม่
- setup/cleanup ควรเป็น section แบบมีชื่อ หรือเป็นเพียงรายการ action ตามลำดับ
- การอ้างอิง artifact ควรเป็นแบบมีชนิดกำกับอย่างเข้มงวดในสคีมา หรือเป็นแบบสตริง
- custom handler ควรอยู่ในรีจิสทรีเดียว หรือแยกเป็นรีจิสทรีตามพื้นผิว
- ไฟล์ความเข้ากันได้แบบ JSON ที่สร้างขึ้นควรยังคงถูกเช็กอินไว้ระหว่างการย้ายหรือไม่

## ที่เกี่ยวข้อง

- [QA E2E automation](/th/concepts/qa-e2e-automation)
