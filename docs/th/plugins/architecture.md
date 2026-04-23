---
read_when:
    - การสร้างหรือดีบัก plugin ของ OpenClaw แบบเนทีฟ
    - การทำความเข้าใจโมเดลความสามารถหรือขอบเขตความเป็นเจ้าของของ plugin
    - การทำงานกับไปป์ไลน์การโหลดหรือ registry ของ plugin
    - การ implement hook ของ provider runtime หรือ channel plugin
sidebarTitle: Internals
summary: 'ภายในของ Plugin: โมเดลความสามารถ ความเป็นเจ้าของ สัญญา ไปป์ไลน์การโหลด และตัวช่วยขณะรัน'
title: ภายในของ Plugin
x-i18n:
    generated_at: "2026-04-23T05:45:56Z"
    model: gpt-5.4
    provider: openai
    source_hash: 69080a1d0e496b321a6fd5a3e925108c3a03c41710073f8f23af13933a091e28
    source_path: plugins/architecture.md
    workflow: 15
---

# ภายในของ Plugin

<Info>
  นี่คือ **เอกสารอ้างอิงสถาปัตยกรรมเชิงลึก** สำหรับคู่มือเชิงปฏิบัติ ดู:
  - [ติดตั้งและใช้งาน plugin](/th/tools/plugin) — คู่มือสำหรับผู้ใช้
  - [Getting Started](/th/plugins/building-plugins) — บทเรียน plugin ตัวแรก
  - [Channel Plugins](/th/plugins/sdk-channel-plugins) — สร้างแชนเนลสำหรับส่งข้อความ
  - [Provider Plugins](/th/plugins/sdk-provider-plugins) — สร้างผู้ให้บริการโมเดล
  - [SDK Overview](/th/plugins/sdk-overview) — import map และ API สำหรับการลงทะเบียน
</Info>

หน้านี้ครอบคลุมสถาปัตยกรรมภายในของระบบ plugin ของ OpenClaw

## โมเดล capability สาธารณะ

Capabilities คือโมเดล **native plugin** แบบสาธารณะภายใน OpenClaw ทุก
native OpenClaw plugin จะลงทะเบียนกับ capability type อย่างน้อยหนึ่งรายการ:

| Capability             | เมธอดการลงทะเบียน                            | ตัวอย่าง plugin                     |
| ---------------------- | --------------------------------------------- | ----------------------------------- |
| Text inference         | `api.registerProvider(...)`                   | `openai`, `anthropic`               |
| CLI inference backend  | `api.registerCliBackend(...)`                 | `openai`, `anthropic`               |
| Speech                 | `api.registerSpeechProvider(...)`             | `elevenlabs`, `microsoft`           |
| Realtime transcription | `api.registerRealtimeTranscriptionProvider(...)` | `openai`                        |
| Realtime voice         | `api.registerRealtimeVoiceProvider(...)`      | `openai`                            |
| Media understanding    | `api.registerMediaUnderstandingProvider(...)` | `openai`, `google`                  |
| Image generation       | `api.registerImageGenerationProvider(...)`    | `openai`, `google`, `fal`, `minimax` |
| Music generation       | `api.registerMusicGenerationProvider(...)`    | `google`, `minimax`                 |
| Video generation       | `api.registerVideoGenerationProvider(...)`    | `qwen`                              |
| Web fetch              | `api.registerWebFetchProvider(...)`           | `firecrawl`                         |
| Web search             | `api.registerWebSearchProvider(...)`          | `google`                            |
| Channel / messaging    | `api.registerChannel(...)`                    | `msteams`, `matrix`                 |

plugin ที่ลงทะเบียน capability เป็นศูนย์ แต่ให้ hooks, tools หรือ
services จะถือเป็น **plugin แบบ legacy hook-only** ซึ่งรูปแบบนี้ยังรองรับเต็มรูปแบบ

### จุดยืนด้านความเข้ากันได้ภายนอก

โมเดล capability ถูกลงไว้ใน core แล้ว และถูกใช้โดย bundled/native plugin
ในปัจจุบัน แต่ความเข้ากันได้ของ plugin ภายนอกยังต้องมีเกณฑ์ที่รัดกุมกว่าแค่
“มี export แล้ว แปลว่าถูกตรึงไว้”

แนวทางปัจจุบัน:

- **plugin ภายนอกที่มีอยู่แล้ว:** ต้องคง integration แบบ hook-based ให้ใช้งานได้; ให้ถือ
  ว่านี่คือ baseline ด้านความเข้ากันได้
- **bundled/native plugin ใหม่:** ควรใช้การลงทะเบียน capability แบบ explicit แทนการเจาะถึง vendor แบบเฉพาะเจาะจง หรือการออกแบบแบบ hook-only ใหม่
- **plugin ภายนอกที่เริ่มใช้ capability registration:** อนุญาตได้ แต่ให้ถือว่า helper surface เฉพาะ capability ยังพัฒนาอยู่ เว้นแต่เอกสารจะระบุสัญญานั้นว่าเสถียรอย่างชัดเจน

กฎเชิงปฏิบัติ:

- API สำหรับ capability registration คือทิศทางที่ตั้งใจไว้
- legacy hook ยังคงเป็นเส้นทางที่ปลอดภัยที่สุดในการไม่ให้ plugin ภายนอกพังระหว่างช่วงเปลี่ยนผ่าน
- exported helper subpath ไม่ได้เท่ากันทั้งหมด; ควรใช้สัญญาแบบแคบที่มีเอกสารรองรับ ไม่ใช่ helper export ที่หลุดออกมาโดยบังเอิญ

### รูปแบบของ plugin

OpenClaw จัดประเภท plugin ที่โหลดทุกตัวเป็นรูปแบบหนึ่งตามพฤติกรรมการลงทะเบียนจริงของมัน
(ไม่ใช่เพียง metadata แบบสแตติก):

- **plain-capability** -- ลงทะเบียน capability type เพียงประเภทเดียว (เช่น
  plugin ที่เป็น provider อย่างเดียว เช่น `mistral`)
- **hybrid-capability** -- ลงทะเบียนหลาย capability type (เช่น
  `openai` เป็นเจ้าของ text inference, speech, media understanding และ image
  generation)
- **hook-only** -- ลงทะเบียนเฉพาะ hook (แบบ typed หรือ custom) ไม่มี
  capabilities, tools, commands หรือ services
- **non-capability** -- ลงทะเบียน tools, commands, services หรือ routes แต่ไม่มี
  capabilities

ใช้ `openclaw plugins inspect <id>` เพื่อดูรูปแบบของ plugin และรายละเอียด
capability ของมัน ดู [CLI reference](/cli/plugins#inspect) สำหรับรายละเอียด

### Legacy hooks

hook `before_agent_start` ยังคงรองรับเป็นเส้นทางเพื่อความเข้ากันได้สำหรับ
plugin แบบ hook-only plugin ในโลกจริงแบบเดิมยังคงพึ่งพามัน

ทิศทาง:

- คงให้มันใช้งานได้
- บันทึกไว้ว่าเป็น legacy
- ควรใช้ `before_model_resolve` สำหรับงาน override ด้านโมเดล/ผู้ให้บริการ
- ควรใช้ `before_prompt_build` สำหรับงานปรับแก้ prompt
- นำออกได้ก็ต่อเมื่อการใช้งานจริงลดลง และการครอบคลุมของ fixture พิสูจน์ความปลอดภัยของการย้ายแล้ว

### สัญญาณด้านความเข้ากันได้

เมื่อคุณรัน `openclaw doctor` หรือ `openclaw plugins inspect <id>` คุณอาจเห็น
หนึ่งในป้ายเหล่านี้:

| สัญญาณ                    | ความหมาย                                                        |
| ------------------------- | --------------------------------------------------------------- |
| **config valid**          | config parse ได้ถูกต้องและ resolve plugin ได้                   |
| **compatibility advisory**| plugin ใช้รูปแบบที่รองรับแต่เก่ากว่า (เช่น `hook-only`)        |
| **legacy warning**        | plugin ใช้ `before_agent_start` ซึ่งเลิกใช้แล้ว                |
| **hard error**            | config ไม่ถูกต้อง หรือ plugin โหลดไม่สำเร็จ                    |

ทั้ง `hook-only` และ `before_agent_start` จะยังไม่ทำให้ plugin ของคุณพังในวันนี้ --
`hook-only` เป็นเพียงคำแนะนำ และ `before_agent_start` จะทำให้เกิดแค่คำเตือน
สัญญาณเหล่านี้ยังปรากฏใน `openclaw status --all` และ `openclaw plugins doctor`

## ภาพรวมของสถาปัตยกรรม

ระบบ plugin ของ OpenClaw มี 4 ชั้น:

1. **Manifest + discovery**
   OpenClaw ค้นหา candidate plugin จากพาธที่กำหนดค่าไว้, workspace root,
   global extension root และ bundled extension โดย Discovery จะอ่าน native
   `openclaw.plugin.json` manifest พร้อม manifest ของ bundle ที่รองรับก่อน
2. **Enablement + validation**
   core จะตัดสินว่า plugin ที่ค้นพบแล้วถูกเปิดใช้ ปิดใช้ บล็อกไว้ หรือ
   ถูกเลือกสำหรับ slot แบบ exclusive เช่น memory
3. **Runtime loading**
   native OpenClaw plugin จะถูกโหลดในโปรเซสผ่าน jiti และลงทะเบียน
   capabilities เข้าสู่ registry กลาง ส่วน bundle ที่เข้ากันได้จะถูกทำให้เป็นมาตรฐานเป็น registry record โดยไม่ต้อง import runtime code
4. **Surface consumption**
   ส่วนอื่นของ OpenClaw อ่าน registry เพื่อเปิดเผย tools, channels, provider
   setup, hooks, HTTP routes, CLI commands และ services

สำหรับ plugin CLI โดยเฉพาะ การค้นหา root command ถูกแยกเป็นสองเฟส:

- metadata ตอน parse มาจาก `registerCli(..., { descriptors: [...] })`
- โมดูล CLI จริงของ plugin ยังคง lazy ได้ และจะลงทะเบียนเมื่อถูกเรียกใช้ครั้งแรก

วิธีนี้ทำให้โค้ด CLI ที่ plugin เป็นเจ้าของยังอยู่ใน plugin ขณะเดียวกันก็ทำให้ OpenClaw
สามารถจองชื่อ root command ได้ก่อน parse

ขอบเขตการออกแบบที่สำคัญคือ:

- discovery + config validation ควรทำงานได้จาก **manifest/schema metadata**
  โดยไม่ต้องรันโค้ดของ plugin
- พฤติกรรม runtime แบบเนทีฟมาจากเส้นทาง `register(api)` ของโมดูล plugin

การแยกเช่นนี้ทำให้ OpenClaw สามารถตรวจสอบ config อธิบาย plugin ที่หายไป/ถูกปิดใช้ และ
สร้างคำใบ้สำหรับ UI/schema ก่อนที่ runtime เต็มจะทำงาน

### Channel plugin และ shared message tool

channel plugin ไม่จำเป็นต้องลงทะเบียน send/edit/react tool แยกต่างหากสำหรับ
action แชตปกติ OpenClaw คง `message` tool แบบ shared หนึ่งตัวไว้ใน core และ
channel plugin เป็นเจ้าของการค้นหาและการรันแบบเฉพาะแชนเนลภายใต้มัน

ขอบเขตปัจจุบันคือ:

- core เป็นเจ้าของโฮสต์ของ shared `message` tool, prompt wiring, การเก็บบัญชี
  session/thread และ execution dispatch
- channel plugin เป็นเจ้าของ scoped action discovery, capability discovery และ
  schema fragment แบบเฉพาะแชนเนล
- channel plugin เป็นเจ้าของ grammar ของการสนทนาแบบ session ที่เฉพาะกับ provider เช่น
  วิธีที่ conversation id เข้ารหัส thread id หรือสืบทอดจากบทสนทนาแม่
- channel plugin เป็นผู้รัน action สุดท้ายผ่าน action adapter ของมัน

สำหรับ channel plugin พื้นผิว SDK คือ
`ChannelMessageActionAdapter.describeMessageTool(...)` การค้นหาแบบรวมศูนย์
นี้ทำให้ plugin สามารถส่งคืน action ที่มองเห็นได้, capabilities และ contribution ต่อ schema มาด้วยกัน เพื่อไม่ให้ส่วนเหล่านั้นเบี่ยงเบนจากกัน

เมื่อพารามิเตอร์ของ message-tool แบบเฉพาะแชนเนลมี media source เช่น
พาธในเครื่องหรือ remote media URL plugin ควรส่งคืน
`mediaSourceParams` จาก `describeMessageTool(...)` ด้วย core ใช้รายการแบบ explicit นี้เพื่อใช้การทำ sandbox path normalization และ outbound media-access hint
โดยไม่ฮาร์ดโค้ดชื่อพารามิเตอร์ที่ plugin เป็นเจ้าของ
ควรใช้แผนที่ที่กำหนดขอบเขตตาม action ตรงนั้น ไม่ใช่รายการแบนแบบกว้างทั้งแชนเนล
เพื่อไม่ให้พารามิเตอร์สื่อที่ใช้เฉพาะ profile ถูก normalize บน action ที่ไม่เกี่ยวข้องอย่าง
`send`

core จะส่ง runtime scope เข้าไปในขั้นตอน discovery นี้ ฟิลด์สำคัญได้แก่:

- `accountId`
- `currentChannelId`
- `currentThreadTs`
- `currentMessageId`
- `sessionKey`
- `sessionId`
- `agentId`
- trusted inbound `requesterSenderId`

สิ่งนี้สำคัญสำหรับ plugin ที่ขึ้นกับบริบท แชนเนลหนึ่งสามารถซ่อนหรือเปิดเผย
message action ตามบัญชีที่กำลังใช้งาน ห้อง/thread/message ปัจจุบัน หรือ
ตัวตนของผู้ร้องขอที่เชื่อถือได้ โดยไม่ต้องฮาร์ดโค้ดแขนงเฉพาะแชนเนลไว้ใน `message` tool ของ core

นี่คือเหตุผลว่าทำไมการเปลี่ยนแปลง routing ของ embedded-runner จึงยังเป็นงานของ plugin:
runner มีหน้าที่ส่งต่อข้อมูลตัวตนแชต/เซสชันปัจจุบันเข้าไปยัง boundary ของการค้นหาใน plugin
เพื่อให้ shared `message` tool เปิดเผยพื้นผิวที่แชนเนลเป็นเจ้าของได้ถูกต้องสำหรับ turn ปัจจุบัน

สำหรับ execution helper ที่แชนเนลเป็นเจ้าของ bundled plugin ควรเก็บ execution
runtime ไว้ภายใน extension module ของตนเอง core ไม่ได้เป็นเจ้าของ runtime ของ message-action
ของ Discord, Slack, Telegram หรือ WhatsApp ภายใต้ `src/agents/tools` อีกต่อไป
เราไม่เผยแพร่ subpath `plugin-sdk/*-action-runtime` แยก และ bundled
plugin ควร import runtime code ในเครื่องของตนเองโดยตรงจากโมดูลที่ extension เป็นเจ้าของ

ขอบเขตเดียวกันนี้ใช้กับ SDK seam ที่ตั้งชื่อตาม provider โดยทั่วไปด้วย: core ไม่ควร
import convenience barrel เฉพาะแชนเนลสำหรับ Slack, Discord, Signal,
WhatsApp หรือ extension ลักษณะคล้ายกัน หาก core ต้องการพฤติกรรมใด ให้ใช้
barrel `api.ts` / `runtime-api.ts` ของ bundled plugin เอง หรือยกระดับความต้องการนั้น
เป็น capability แบบทั่วไปที่แคบใน shared SDK

สำหรับ poll โดยเฉพาะ มีเส้นทางการรันสองแบบ:

- `outbound.sendPoll` คือ baseline แบบ shared สำหรับแชนเนลที่เข้ากับโมเดล poll ทั่วไป
- `actions.handleAction("poll")` คือเส้นทางที่ควรใช้สำหรับความหมายของ poll ที่เฉพาะแชนเนล หรือพารามิเตอร์ poll เพิ่มเติม

ตอนนี้ core จะ defer การ parse poll แบบ shared จนกว่าการ dispatch poll ของ plugin จะปฏิเสธ action ก่อน เพื่อให้ตัวจัดการ poll ที่ plugin เป็นเจ้าของสามารถรับฟิลด์ poll แบบเฉพาะแชนเนลได้โดยไม่ถูก generic poll parser บล็อกเสียก่อน

ดู [Load pipeline](#load-pipeline) สำหรับลำดับการเริ่มต้นแบบเต็ม

## โมเดลความเป็นเจ้าของ capability

OpenClaw ปฏิบัติต่อ native plugin ว่าเป็นขอบเขตความเป็นเจ้าของสำหรับ **บริษัทหนึ่งแห่ง** หรือ **ฟีเจอร์หนึ่งชุด** ไม่ใช่กองรวมของ integration ที่ไม่เกี่ยวข้องกัน

นั่นหมายความว่า:

- plugin ของบริษัทหนึ่งควรเป็นเจ้าของพื้นผิวที่หันหน้าออกไปยัง OpenClaw ของบริษัทนั้นทั้งหมดโดยทั่วไป
- plugin ของฟีเจอร์หนึ่งควรเป็นเจ้าของพื้นผิวทั้งหมดของฟีเจอร์นั้นโดยทั่วไป
- แชนเนลควรใช้ shared capability ของ core แทนการ re-implement พฤติกรรมของ provider แบบเฉพาะกิจ

ตัวอย่าง:

- bundled `openai` plugin เป็นเจ้าของพฤติกรรม model-provider ของ OpenAI และ
  พฤติกรรม speech + realtime-voice + media-understanding + image-generation ของ OpenAI
- bundled `elevenlabs` plugin เป็นเจ้าของพฤติกรรม speech ของ ElevenLabs
- bundled `microsoft` plugin เป็นเจ้าของพฤติกรรม speech ของ Microsoft
- bundled `google` plugin เป็นเจ้าของพฤติกรรม model-provider ของ Google รวมถึง
  พฤติกรรม media-understanding + image-generation + web-search ของ Google
- bundled `firecrawl` plugin เป็นเจ้าของพฤติกรรม web-fetch ของ Firecrawl
- bundled `minimax`, `mistral`, `moonshot` และ `zai` plugin เป็นเจ้าของ
  backend ของ media-understanding ของตน
- bundled `qwen` plugin เป็นเจ้าของพฤติกรรม text-provider ของ Qwen รวมถึง
  พฤติกรรม media-understanding และ video-generation
- plugin `voice-call` เป็น feature plugin: มันเป็นเจ้าของ call transport, tools,
  CLI, routes และ Twilio media-stream bridge แต่ใช้ shared speech
  รวมถึง capability ของ realtime-transcription และ realtime-voice แทนการ import
  vendor plugin โดยตรง

สภาพสุดท้ายที่ตั้งใจไว้คือ:

- OpenAI อยู่ใน plugin เดียว แม้ว่าจะครอบคลุม text model, speech, images และ
  video ในอนาคต
- vendor อื่นก็สามารถทำแบบเดียวกันสำหรับพื้นผิวของตนเองได้
- แชนเนลไม่ต้องสนใจว่า vendor plugin ตัวใดเป็นเจ้าของ provider; มันใช้
  shared capability contract ที่ core เปิดเผย

นี่คือความแตกต่างสำคัญ:

- **plugin** = ขอบเขตความเป็นเจ้าของ
- **capability** = สัญญาของ core ที่หลาย plugin สามารถ implement หรือ consume ได้

ดังนั้น หาก OpenClaw เพิ่มโดเมนใหม่ เช่น video คำถามแรกไม่ควรเป็น
“provider ตัวใดควรฮาร์ดโค้ดการจัดการ video?” คำถามแรกควรเป็น “สัญญา
core video capability คืออะไร?” เมื่อมีสัญญานั้นแล้ว vendor plugin
จึงสามารถลงทะเบียนกับมันได้ และ channel/feature plugin ก็สามารถ consume มันได้

หาก capability ยังไม่มี โดยทั่วไปแนวทางที่ถูกต้องคือ:

1. นิยาม capability ที่ขาดอยู่ใน core
2. เปิดเผยผ่าน plugin API/runtime แบบมี type
3. เชื่อม channels/features เข้ากับ capability นั้น
4. ปล่อยให้ vendor plugin ลงทะเบียน implementation

วิธีนี้ทำให้ความเป็นเจ้าของชัดเจน ขณะหลีกเลี่ยงพฤติกรรมใน core ที่ขึ้นกับ
vendor รายเดียว หรือเส้นทางโค้ดแบบ one-off ที่เฉพาะกับ plugin

### การจัดชั้นของ capability

ใช้โมเดลทางความคิดนี้เมื่อกำลังตัดสินใจว่าโค้ดควรอยู่ที่ใด:

- **ชั้น core capability**: orchestration, policy, fallback, กฎการ merge ของ config
  semantics ของการส่ง และสัญญาแบบมี type ที่ใช้ร่วมกัน
- **ชั้น vendor plugin**: API เฉพาะของ vendor, auth, แค็ตตาล็อกโมเดล, speech
  synthesis, image generation, backend วิดีโอในอนาคต, endpoint ด้าน usage
- **ชั้น channel/feature plugin**: integration ของ Slack/Discord/voice-call/etc.
  ที่ใช้ capability ของ core และนำเสนอออกมาบนพื้นผิวของมัน

ตัวอย่างเช่น TTS มีรูปแบบดังนี้:

- core เป็นเจ้าของนโยบาย TTS ตอนตอบกลับ, ลำดับ fallback, prefs และการส่งผ่านแชนเนล
- `openai`, `elevenlabs` และ `microsoft` เป็นเจ้าของ implementation ของ synthesis
- `voice-call` ใช้ telephony TTS runtime helper

รูปแบบเดียวกันนี้ควรถูกใช้เป็นลำดับแรกสำหรับ capability ในอนาคต

### ตัวอย่าง company plugin แบบหลาย capability

company plugin ควรให้ความรู้สึกเป็นหนึ่งเดียวจากภายนอก หาก OpenClaw มี
สัญญาร่วมสำหรับ models, speech, realtime transcription, realtime voice, media
understanding, image generation, video generation, web fetch และ web search,
vendor สามารถเป็นเจ้าของพื้นผิวทั้งหมดของตนในที่เดียวได้:

```ts
import type { OpenClawPluginDefinition } from "openclaw/plugin-sdk/plugin-entry";
import {
  describeImageWithModel,
  transcribeOpenAiCompatibleAudio,
} from "openclaw/plugin-sdk/media-understanding";

const plugin: OpenClawPluginDefinition = {
  id: "exampleai",
  name: "ExampleAI",
  register(api) {
    api.registerProvider({
      id: "exampleai",
      // auth/model catalog/runtime hooks
    });

    api.registerSpeechProvider({
      id: "exampleai",
      // vendor speech config — implement the SpeechProviderPlugin interface directly
    });

    api.registerMediaUnderstandingProvider({
      id: "exampleai",
      capabilities: ["image", "audio", "video"],
      async describeImage(req) {
        return describeImageWithModel({
          provider: "exampleai",
          model: req.model,
          input: req.input,
        });
      },
      async transcribeAudio(req) {
        return transcribeOpenAiCompatibleAudio({
          provider: "exampleai",
          model: req.model,
          input: req.input,
        });
      },
    });

    api.registerWebSearchProvider(
      createPluginBackedWebSearchProvider({
        id: "exampleai-search",
        // credential + fetch logic
      }),
    );
  },
};

export default plugin;
```

สิ่งสำคัญไม่ใช่ชื่อ helper ที่แน่นอน แต่เป็นรูปแบบ:

- plugin เดียวเป็นเจ้าของพื้นผิวของ vendor
- core ยังคงเป็นเจ้าของ capability contract
- channel และ feature plugin ใช้ helper ใน `api.runtime.*` ไม่ใช่โค้ดของ vendor
- contract test สามารถยืนยันได้ว่า plugin ลงทะเบียน capability ที่มันอ้างว่าเป็นเจ้าของจริง

### ตัวอย่าง capability: video understanding

ตอนนี้ OpenClaw ปฏิบัติต่อ image/audio/video understanding เป็น shared
capability เดียวกันอยู่แล้ว โมเดลความเป็นเจ้าของเดียวกันนี้ใช้กับที่นี่เช่นกัน:

1. core นิยามสัญญาของ media-understanding
2. vendor plugin ลงทะเบียน `describeImage`, `transcribeAudio` และ
   `describeVideo` ตามความเหมาะสม
3. channel และ feature plugin ใช้พฤติกรรมร่วมของ core แทนการเชื่อมตรง
   ไปยังโค้ดของ vendor

วิธีนี้หลีกเลี่ยงการฝังสมมติฐานเรื่อง video ของ provider รายเดียวไว้ใน core plugin เป็นเจ้าของ
พื้นผิวของ vendor; core เป็นเจ้าของ capability contract และพฤติกรรม fallback

ตอนนี้ video generation ใช้ลำดับเดียวกันนั้นแล้ว: core เป็นเจ้าของ
typed capability contract และ runtime helper และ vendor plugin ลงทะเบียน
implementation ของ `api.registerVideoGenerationProvider(...)` กับมัน

ต้องการเช็กลิสต์ rollout แบบเป็นรูปธรรมไหม? ดู
[Capability Cookbook](/th/plugins/architecture)

## สัญญาและการบังคับใช้

พื้นผิว API ของ plugin ถูกตั้งใจให้อยู่ในรูปแบบมี type และรวมศูนย์ใน
`OpenClawPluginApi` สัญญานี้นิยามจุดลงทะเบียนที่รองรับ และ
runtime helper ที่ plugin สามารถพึ่งพาได้

เหตุผลที่สิ่งนี้สำคัญ:

- ผู้เขียน plugin ได้มาตรฐานภายในที่เสถียรหนึ่งเดียว
- core สามารถปฏิเสธความเป็นเจ้าของที่ซ้ำกัน เช่น plugin สองตัวลงทะเบียน provider id เดียวกัน
- ช่วงเริ่มต้นสามารถแสดงข้อมูลการวินิจฉัยที่นำไปแก้ไขได้ สำหรับการลงทะเบียนที่ผิดรูปแบบ
- contract test สามารถบังคับความเป็นเจ้าของของ bundled plugin และป้องกันการ drift แบบเงียบ ๆ

มีการบังคับใช้สองชั้น:

1. **การบังคับใช้ตอน runtime registration**
   plugin registry ตรวจสอบการลงทะเบียนขณะที่ plugin ถูกโหลด ตัวอย่างเช่น:
   provider id ซ้ำ, speech provider id ซ้ำ และการลงทะเบียนที่ผิดรูปแบบ
   จะก่อให้เกิด plugin diagnostics แทนพฤติกรรมที่ไม่กำหนดแน่นอน
2. **contract tests**
   bundled plugin จะถูกจับไว้ใน contract registry ระหว่างการรันทดสอบ เพื่อให้
   OpenClaw สามารถยืนยันความเป็นเจ้าของอย่างชัดเจน ทุกวันนี้สิ่งนี้ถูกใช้สำหรับ model
   providers, speech providers, web search providers และความเป็นเจ้าของของ bundled registration

ผลในทางปฏิบัติคือ OpenClaw รู้ล่วงหน้าว่า plugin ใดเป็นเจ้าของพื้นผิวใด
ซึ่งทำให้ core และแชนเนลประกอบเข้าด้วยกันได้อย่างไร้รอยต่อ เพราะความเป็นเจ้าของถูกประกาศ มี type และทดสอบได้ แทนที่จะเป็นนัยโดยปริยาย

### สิ่งที่ควรอยู่ในสัญญา

plugin contract ที่ดีควรเป็น:

- มี type
- เล็ก
- เฉพาะกับ capability
- เป็นเจ้าของโดย core
- ใช้ซ้ำได้โดยหลาย plugin
- ให้ channels/features ใช้ได้โดยไม่ต้องรู้เรื่อง vendor

plugin contract ที่ไม่ดีคือ:

- นโยบายเฉพาะ vendor ที่ซ่อนอยู่ใน core
- one-off plugin escape hatch ที่ข้าม registry
- โค้ดของแชนเนลเจาะตรงเข้า implementation ของ vendor
- ออบเจ็กต์ runtime แบบ ad hoc ที่ไม่ได้เป็นส่วนหนึ่งของ `OpenClawPluginApi` หรือ
  `api.runtime`

หากไม่แน่ใจ ให้ยกระดับ abstraction ก่อน: นิยาม capability ก่อน แล้วจึงให้ plugin เข้ามาเสียบกับมัน

## โมเดลการรัน

native OpenClaw plugin รัน **ในโปรเซสเดียวกัน** กับ Gateway มันไม่ได้ถูก
sandbox ไว้ native plugin ที่ถูกโหลดแล้วมีขอบเขตความเชื่อถือระดับโปรเซสเดียวกับโค้ดของ core

ผลที่ตามมา:

- native plugin สามารถลงทะเบียน tools, network handlers, hooks และ services ได้
- บั๊กใน native plugin สามารถทำให้ gateway ล่มหรือไม่เสถียรได้
- native plugin ที่เป็นอันตรายมีค่าเท่ากับการรันโค้ดโดยพลการภายในโปรเซสของ OpenClaw

bundle ที่เข้ากันได้ปลอดภัยกว่าโดยค่าเริ่มต้น เพราะปัจจุบัน OpenClaw ปฏิบัติต่อมัน
เป็น metadata/content pack ซึ่งใน release ปัจจุบัน ส่วนใหญ่หมายถึง bundled
skills

ควรใช้ allowlist และเส้นทาง install/load แบบ explicit สำหรับ plugin ที่ไม่ bundled ให้ถือว่า
workspace plugin เป็นโค้ดสำหรับช่วงพัฒนา ไม่ใช่ค่าเริ่มต้นของ production

สำหรับชื่อแพ็กเกจ workspace แบบ bundled ให้ยึด plugin id ไว้ในชื่อ npm:
`@openclaw/<id>` เป็นค่าเริ่มต้น หรือใช้ suffix แบบมี type ที่ได้รับอนุมัติ เช่น
`-provider`, `-plugin`, `-speech`, `-sandbox` หรือ `-media-understanding` เมื่อ
แพ็กเกจนั้นตั้งใจจะเปิดเผยบทบาท plugin ที่แคบกว่า

หมายเหตุสำคัญเรื่องความเชื่อถือ:

- `plugins.allow` เชื่อถือ **plugin id** ไม่ใช่ที่มาของซอร์ส
- workspace plugin ที่มี id เดียวกับ bundled plugin จะจงใจบัง bundled copy เมื่อ workspace plugin นั้นถูกเปิดใช้/อยู่ใน allowlist
- นี่เป็นพฤติกรรมปกติและมีประโยชน์สำหรับการพัฒนาในเครื่อง การทดสอบแพตช์ และ hotfixes

## ขอบเขตของ export

OpenClaw export capabilities ไม่ใช่ convenience ของ implementation

คงการลงทะเบียน capability ให้เป็นสาธารณะ แล้วตัด helper export ที่ไม่ใช่สัญญา:

- subpath helper ที่เฉพาะกับ bundled plugin
- subpath ด้าน runtime plumbing ที่ไม่ได้ตั้งใจให้เป็น public API
- convenience helper ที่เฉพาะกับ vendor
- helper สำหรับ setup/onboarding ที่เป็นรายละเอียด implementation

subpath helper ของ bundled plugin บางส่วนยังคงอยู่ใน generated SDK export
map เพื่อความเข้ากันได้และการดูแล bundled plugin ตัวอย่างปัจจุบันได้แก่
`plugin-sdk/feishu`, `plugin-sdk/feishu-setup`, `plugin-sdk/zalo`,
`plugin-sdk/zalo-setup` และ seam หลายตัวของ `plugin-sdk/matrix*` ให้ถือว่าสิ่งเหล่านี้เป็น
export แบบสงวนไว้ซึ่งเป็นรายละเอียด implementation ไม่ใช่รูปแบบ SDK ที่แนะนำสำหรับ
third-party plugin ใหม่

## ไปป์ไลน์การโหลด

ตอนเริ่มต้น OpenClaw ทำประมาณนี้:

1. ค้นหา root ของ candidate plugin
2. อ่าน manifest แบบเนทีฟหรือ compatible bundle พร้อม package metadata
3. ปฏิเสธ candidate ที่ไม่ปลอดภัย
4. ทำ normalize plugin config (`plugins.enabled`, `allow`, `deny`, `entries`,
   `slots`, `load.paths`)
5. ตัดสินสถานะการเปิดใช้สำหรับแต่ละ candidate
6. โหลด native module ที่เปิดใช้ผ่าน jiti
7. เรียก hook `register(api)` ของ native (หรือ `activate(api)` — alias แบบ legacy) และเก็บการลงทะเบียนเข้า plugin registry
8. เปิดเผย registry ให้กับพื้นผิวของ commands/runtime

<Note>
`activate` เป็น alias แบบ legacy ของ `register` — loader จะ resolve จากตัวที่มีอยู่ (`def.register ?? def.activate`) และเรียกมันในจุดเดียวกัน bundled plugin ทั้งหมดใช้ `register`; ควรใช้ `register` สำหรับ plugin ใหม่
</Note>

เกตด้านความปลอดภัยจะทำงาน **ก่อน** การรัน runtime candidate จะถูกบล็อก
เมื่อ entry หลุดออกนอก plugin root, พาธเขียนได้โดยทุกคน หรือความเป็นเจ้าของของพาธ
ดูน่าสงสัยสำหรับ plugin ที่ไม่ bundled

### พฤติกรรมแบบ manifest-first

manifest คือแหล่งความจริงฝั่ง control-plane โดย OpenClaw ใช้มันเพื่อ:

- ระบุ plugin
- ค้นหา channels/skills/config schema หรือ bundle capabilities ที่ประกาศไว้
- ตรวจสอบ `plugins.entries.<id>.config`
- เสริม labels/placeholders ใน Control UI
- แสดง metadata สำหรับ install/catalog
- คง activation และ setup descriptor ที่ราคาถูกไว้โดยไม่ต้องโหลด plugin runtime

สำหรับ native plugin โมดูล runtime คือส่วนของ data-plane มันลงทะเบียน
พฤติกรรมจริง เช่น hooks, tools, commands หรือ provider flow

บล็อก `activation` และ `setup` ใน manifest แบบทางเลือกยังคงอยู่บน control plane
มันเป็น descriptor แบบ metadata-only สำหรับการวางแผน activation และการค้นพบ setup; มันไม่ได้แทนที่ runtime registration, `register(...)` หรือ `setupEntry`
ตอนนี้ consumer ของ live activation ชุดแรกใช้ hint ของ command, channel และ provider จาก manifest
เพื่อลดขอบเขตการโหลด plugin ก่อนการ materialize registry แบบกว้างขึ้น:

- การโหลด CLI จะทำให้แคบลงเหลือเฉพาะ plugin ที่เป็นเจ้าของ primary command ที่ร้องขอ
- การ resolve channel setup/plugin จะทำให้แคบลงเหลือเฉพาะ plugin ที่เป็นเจ้าของ requested
  channel id
- การ resolve setup/runtime ของ provider แบบ explicit จะทำให้แคบลงเหลือเฉพาะ plugin ที่เป็นเจ้าของ requested provider id

ตอนนี้การค้นหา setup จะให้ความสำคัญกับ id ที่ descriptor เป็นเจ้าของ เช่น `setup.providers` และ
`setup.cliBackends` เพื่อจำกัด candidate plugin ให้แคบลง ก่อนที่จะ fallback ไปใช้
`setup-api` สำหรับ plugin ที่ยังต้องใช้ setup-time runtime hook หากมี plugin ที่ค้นพบมากกว่าหนึ่งตัวอ้างสิทธิ์ normalized setup provider หรือ CLI backend id เดียวกัน การค้นหา setup จะปฏิเสธเจ้าของที่กำกวม แทนการพึ่งลำดับการค้นพบ

### สิ่งที่ loader แคชไว้

OpenClaw เก็บแคชในโปรเซสระยะสั้นสำหรับ:

- ผลลัพธ์ของ discovery
- ข้อมูล registry ของ manifest
- registry ของ plugin ที่โหลดแล้ว

แคชเหล่านี้ลดต้นทุนจากการเริ่มต้นแบบเป็นช่วง ๆ และ overhead จากคำสั่งที่ถูกรันซ้ำ
ให้ถือว่ามันเป็นแคชเพื่อประสิทธิภาพที่มีอายุสั้น ไม่ใช่ persistence

หมายเหตุด้านประสิทธิภาพ:

- ตั้ง `OPENCLAW_DISABLE_PLUGIN_DISCOVERY_CACHE=1` หรือ
  `OPENCLAW_DISABLE_PLUGIN_MANIFEST_CACHE=1` เพื่อปิดแคชเหล่านี้
- ปรับหน้าต่างเวลาแคชด้วย `OPENCLAW_PLUGIN_DISCOVERY_CACHE_MS` และ
  `OPENCLAW_PLUGIN_MANIFEST_CACHE_MS`

## โมเดล registry

plugin ที่ถูกโหลดแล้วจะไม่ mutate global ของ core แบบสุ่มโดยตรง แต่มันจะลงทะเบียน
เข้าสู่ plugin registry กลาง

registry ติดตาม:

- record ของ plugin (ตัวตน, แหล่งที่มา, origin, สถานะ, diagnostics)
- tools
- legacy hooks และ typed hooks
- channels
- providers
- gateway RPC handlers
- HTTP routes
- CLI registrars
- background services
- command ที่ plugin เป็นเจ้าของ

จากนั้นฟีเจอร์ของ core จะอ่านจาก registry นี้แทนการคุยกับโมดูล plugin โดยตรง วิธีนี้ทำให้การโหลดเป็นทางเดียว:

- โมดูล plugin -> ลงทะเบียนใน registry
- core runtime -> consume จาก registry

การแยกนี้สำคัญต่อการดูแลรักษา เพราะหมายความว่าพื้นผิวส่วนใหญ่ของ core
ต้องมีจุดเชื่อมต่อเพียงจุดเดียวคือ “อ่าน registry” ไม่ใช่ “เขียนเงื่อนไขพิเศษสำหรับทุกโมดูล plugin”

## callback ของ conversation binding

plugin ที่ bind บทสนทนาไว้สามารถตอบสนองเมื่อการอนุมัติถูก resolve แล้ว

ใช้ `api.onConversationBindingResolved(...)` เพื่อรับ callback หลังจากคำขอ bind
ได้รับการอนุมัติหรือปฏิเสธ:

```ts
export default {
  id: "my-plugin",
  register(api) {
    api.onConversationBindingResolved(async (event) => {
      if (event.status === "approved") {
        // ตอนนี้มี binding สำหรับ plugin + conversation นี้แล้ว
        console.log(event.binding?.conversationId);
        return;
      }

      // คำขอถูกปฏิเสธ; ล้างสถานะ pending ในเครื่องออก
      console.log(event.request.conversation.conversationId);
    });
  },
};
```

ฟิลด์ใน payload ของ callback:

- `status`: `"approved"` หรือ `"denied"`
- `decision`: `"allow-once"`, `"allow-always"` หรือ `"deny"`
- `binding`: binding ที่ resolve แล้วสำหรับคำขอที่ได้รับอนุมัติ
- `request`: สรุปของคำขอเดิม, detach hint, sender id และ
  metadata ของบทสนทนา

callback นี้มีไว้เพื่อการแจ้งเตือนเท่านั้น มันไม่เปลี่ยนว่าใครมีสิทธิ์ bind บทสนทนา และจะทำงานหลังจาก core จัดการการอนุมัติเสร็จแล้ว

## hook ของ provider runtime

ตอนนี้ provider plugin มีสองชั้น:

- metadata ใน manifest: `providerAuthEnvVars` สำหรับ lookup auth ผ่าน env ของ provider แบบต้นทุนต่ำ
  ก่อน runtime load, `providerAuthAliases` สำหรับ variant ของ provider ที่ใช้ auth ร่วมกัน, `channelEnvVars` สำหรับ lookup env/setup ของแชนเนลแบบต้นทุนต่ำก่อน runtime
  load และ `providerAuthChoices` สำหรับ label ของ onboarding/auth-choice แบบต้นทุนต่ำ และ
  metadata ของ CLI flag ก่อน runtime load
- hook ระดับ config-time: `catalog` / `discovery` แบบเดิม พร้อม `applyConfigDefaults`
- hook ระดับ runtime: `normalizeModelId`, `normalizeTransport`,
  `normalizeConfig`,
  `applyNativeStreamingUsageCompat`, `resolveConfigApiKey`,
  `resolveSyntheticAuth`, `resolveExternalAuthProfiles`,
  `shouldDeferSyntheticProfileAuth`,
  `resolveDynamicModel`, `prepareDynamicModel`, `normalizeResolvedModel`,
  `contributeResolvedModelCompat`, `capabilities`,
  `normalizeToolSchemas`, `inspectToolSchemas`,
  `resolveReasoningOutputMode`, `prepareExtraParams`, `createStreamFn`,
  `wrapStreamFn`, `resolveTransportTurnState`,
  `resolveWebSocketSessionPolicy`, `formatApiKey`, `refreshOAuth`,
  `buildAuthDoctorHint`, `matchesContextOverflowError`,
  `classifyFailoverReason`, `isCacheTtlEligible`,
  `buildMissingAuthMessage`, `suppressBuiltInModel`, `augmentModelCatalog`,
  `resolveThinkingProfile`, `isBinaryThinking`, `supportsXHighThinking`,
  `resolveDefaultThinkingLevel`, `isModernModelRef`, `prepareRuntimeAuth`,
  `resolveUsageAuth`, `fetchUsageSnapshot`, `createEmbeddingProvider`,
  `buildReplayPolicy`,
  `sanitizeReplayHistory`, `validateReplayTurns`, `onModelSelected`

OpenClaw ยังคงเป็นเจ้าของ agent loop แบบทั่วไป, failover, transcript handling และ
tool policy hook เหล่านี้คือพื้นผิวสำหรับขยายพฤติกรรมเฉพาะ provider โดยไม่ต้อง
มี inference transport แบบกำหนดเองทั้งก้อน

ใช้ manifest `providerAuthEnvVars` เมื่อ provider มีข้อมูลรับรองแบบอิง env
ที่เส้นทาง auth/status/model-picker แบบทั่วไปควรมองเห็นได้โดยไม่ต้องโหลด plugin
runtime ใช้ manifest `providerAuthAliases` เมื่อ provider id หนึ่งควรใช้ env var,
auth profile, config-backed auth และตัวเลือก onboarding แบบ API-key ร่วมกับ provider id อื่น ใช้ manifest `providerAuthChoices` เมื่อพื้นผิว onboarding/auth-choice
ของ CLI ควรรู้ id ของ choice ของ provider, label ของกลุ่ม และการเดินสาย auth แบบ one-flag อย่างง่ายโดยไม่ต้องโหลด provider runtime เก็บ `envVars` ของ provider runtime ไว้สำหรับคำแนะนำฝั่งผู้ปฏิบัติการ เช่น label ใน onboarding หรือ
ตัวแปร setup สำหรับ OAuth client-id/client-secret

ใช้ manifest `channelEnvVars` เมื่อแชนเนลมี auth หรือ setup ที่ขับเคลื่อนด้วย env
ซึ่ง generic shell-env fallback, config/status check หรือ setup prompt ควรมองเห็นได้
โดยไม่ต้องโหลด channel runtime

### ลำดับของ hook และการใช้งาน

สำหรับ model/provider plugin, OpenClaw จะเรียก hook ตามลำดับคร่าว ๆ นี้
คอลัมน์ "When to use" คือคู่มือสั้น ๆ สำหรับการตัดสินใจ

| #   | Hook                              | สิ่งที่มันทำ                                                                                                    | ใช้เมื่อใด                                                                                                                                  |
| --- | --------------------------------- | --------------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------- |
| 1   | `catalog`                         | เผยแพร่ config ของ provider เข้าไปใน `models.providers` ระหว่างการสร้าง `models.json`                         | provider เป็นเจ้าของแค็ตตาล็อก หรือค่าเริ่มต้นของ base URL                                                                                 |
| 2   | `applyConfigDefaults`             | ใช้ค่าเริ่มต้น global config ที่ provider เป็นเจ้าของระหว่างการ materialize config                              | ค่าเริ่มต้นขึ้นกับโหมด auth, env หรือความหมายของ model family ของ provider                                                                  |
| --  | _(built-in model lookup)_         | OpenClaw ลองเส้นทาง registry/catalog ปกติก่อน                                                                  | _(ไม่ใช่ plugin hook)_                                                                                                                        |
| 3   | `normalizeModelId`                | ทำให้ alias ของ model-id แบบ legacy หรือ preview เป็นมาตรฐานก่อน lookup                                        | provider เป็นเจ้าของการล้าง alias ก่อนการ resolve โมเดล canonical                                                                           |
| 4   | `normalizeTransport`              | ทำให้ `api` / `baseUrl` ของ provider family เป็นมาตรฐานก่อนการประกอบโมเดลแบบทั่วไป                             | provider เป็นเจ้าของการล้าง transport สำหรับ provider id แบบกำหนดเองใน transport family เดียวกัน                                          |
| 5   | `normalizeConfig`                 | ทำให้ `models.providers.<id>` เป็นมาตรฐานก่อน runtime/provider resolution                                      | provider ต้องการการล้าง config ที่ควรอยู่กับ plugin; helper แบบ bundled Google-family ยังเป็นตัวค้ำสำหรับ entry ของ Google config ที่รองรับ |
| 6   | `applyNativeStreamingUsageCompat` | ใช้การเขียนใหม่ด้าน native streaming-usage compatibility กับ config provider                                   | provider ต้องการการแก้ metadata ของ native streaming usage ที่ขับเคลื่อนด้วย endpoint                                                      |
| 7   | `resolveConfigApiKey`             | resolve env-marker auth สำหรับ config provider ก่อนการโหลด runtime auth                                         | provider มีการ resolve API-key แบบ env-marker ที่ plugin เป็นเจ้าของ; `amazon-bedrock` ก็มี built-in AWS env-marker resolver ที่นี่ด้วย     |
| 8   | `resolveSyntheticAuth`            | เปิดเผย auth แบบ local/self-hosted หรือ config-backed โดยไม่เก็บ plaintext แบบถาวร                             | provider สามารถทำงานได้ด้วย synthetic/local credential marker                                                                                |
| 9   | `resolveExternalAuthProfiles`     | overlay profile auth ภายนอกที่ provider เป็นเจ้าของ; ค่าเริ่มต้น `persistence` คือ `runtime-only` สำหรับ creds ที่ CLI/app เป็นเจ้าของ | provider ใช้ข้อมูลรับรอง auth ภายนอกซ้ำโดยไม่เก็บ copied refresh token แบบถาวร                                                            |
| 10  | `shouldDeferSyntheticProfileAuth` | ลดลำดับความสำคัญของ stored synthetic profile placeholder ให้ต่ำกว่า auth ที่มาจาก env/config-backed            | provider เก็บ synthetic placeholder profile ที่ไม่ควรมีลำดับความสำคัญเหนือกว่า                                                              |
| 11  | `resolveDynamicModel`             | fallback แบบ synchronous สำหรับ model id ที่ provider เป็นเจ้าของแต่ยังไม่อยู่ใน local registry                   | provider ยอมรับ upstream model id แบบ arbitrary                                                                                               |
| 12  | `prepareDynamicModel`             | warm-up แบบ async แล้วจึงรัน `resolveDynamicModel` อีกครั้ง                                                     | provider ต้องใช้ network metadata ก่อน resolve unknown id                                                                                    |
| 13  | `normalizeResolvedModel`          | เขียนใหม่รอบสุดท้ายก่อน embedded runner ใช้ resolved model                                                     | provider ต้องการการเขียน transport ใหม่ แต่ยังคงใช้ core transport                                                                          |
| 14  | `contributeResolvedModelCompat`   | contribute compat flag สำหรับ vendor model ที่อยู่หลัง transport ที่เข้ากันได้ตัวอื่น                           | provider รู้จักโมเดลของตัวเองบน proxy transport โดยไม่ต้องเข้ายึด provider นั้น                                                            |
| 15  | `capabilities`                    | metadata ด้าน transcript/tooling ที่ provider เป็นเจ้าของและถูกใช้โดย shared core logic                         | provider ต้องการรองรับความแปลกเฉพาะของ transcript/provider-family                                                                           |
| 16  | `normalizeToolSchemas`            | ทำให้ tool schema เป็นมาตรฐานก่อนที่ embedded runner จะเห็นมัน                                                  | provider ต้องการล้าง schema ในระดับ transport-family                                                                                         |
| 17  | `inspectToolSchemas`              | เปิดเผย schema diagnostics ที่ provider เป็นเจ้าของหลังการ normalize                                            | provider ต้องการคำเตือนด้าน keyword โดยไม่ต้องสอนกฎเฉพาะ provider ให้ core                                                                |
| 18  | `resolveReasoningOutputMode`      | เลือกสัญญา reasoning-output แบบ native หรือแบบ tagged                                                           | provider ต้องการ tagged reasoning/final output แทน field แบบ native                                                                         |
| 19  | `prepareExtraParams`              | ทำ normalization ของ request param ก่อน generic stream option wrapper                                            | provider ต้องการ request param เริ่มต้น หรือการล้าง param ราย provider                                                                     |
| 20  | `createStreamFn`                  | แทนที่เส้นทางสตรีมปกติทั้งหมดด้วย transport แบบกำหนดเอง                                                         | provider ต้องใช้ wire protocol แบบกำหนดเอง ไม่ใช่แค่ wrapper                                                                                 |
| 21  | `wrapStreamFn`                    | stream wrapper หลังจาก generic wrapper ถูกใช้แล้ว                                                               | provider ต้องการ wrapper ด้าน request header/body/model compatibility โดยไม่ต้องมี custom transport                                         |
| 22  | `resolveTransportTurnState`       | แนบ per-turn transport header หรือ metadata แบบ native                                                          | provider ต้องการให้ generic transport ส่งตัวตนของ turn แบบ provider-native                                                                  |
| 23  | `resolveWebSocketSessionPolicy`   | แนบ WebSocket header แบบ native หรือนโยบาย session cool-down                                                   | provider ต้องการให้ generic WS transport ปรับ session header หรือนโยบาย fallback                                                           |
| 24  | `formatApiKey`                    | ตัวจัดรูป auth-profile: profile ที่เก็บไว้จะกลายเป็นสตริง `apiKey` ตอน runtime                                  | provider เก็บ metadata ด้าน auth เพิ่มเติม และต้องการรูปร่างของ runtime token แบบกำหนดเอง                                                  |
| 25  | `refreshOAuth`                    | override การรีเฟรช OAuth สำหรับ endpoint รีเฟรชแบบกำหนดเอง หรือนโยบายเมื่อรีเฟรชล้มเหลว                       | provider ไม่เข้ากับ refresher แบบ shared `pi-ai`                                                                                            |
| 26  | `buildAuthDoctorHint`             | คำแนะนำการซ่อมที่ถูก append เมื่อการรีเฟรช OAuth ล้มเหลว                                                       | provider ต้องการคำแนะนำการซ่อม auth ที่ provider เป็นเจ้าของหลังจากรีเฟรชล้มเหลว                                                           |
| 27  | `matchesContextOverflowError`     | ตัวจับคู่ context-window overflow ที่ provider เป็นเจ้าของ                                                       | provider มี error ดิบแบบ overflow ที่ heuristic ทั่วไปจะมองไม่เห็น                                                                          |
| 28  | `classifyFailoverReason`          | การจัดประเภทเหตุผลของ failover ที่ provider เป็นเจ้าของ                                                         | provider สามารถแมป API/transport error ดิบไปเป็น rate-limit/overload เป็นต้น                                                               |
| 29  | `isCacheTtlEligible`              | นโยบาย prompt-cache สำหรับ provider แบบ proxy/backhaul                                                          | provider ต้องการการ gating ของ cache TTL แบบเฉพาะ proxy                                                                                     |
| 30  | `buildMissingAuthMessage`         | ข้อความทดแทนสำหรับข้อความ recovery กรณีไม่มี auth แบบทั่วไป                                                     | provider ต้องการคำแนะนำ recovery กรณีไม่มี auth แบบเฉพาะ provider                                                                           |
| 31  | `suppressBuiltInModel`            | การซ่อน stale upstream model พร้อมคำแนะนำ error แบบแสดงต่อผู้ใช้                                                | provider ต้องการซ่อน upstream row ที่เก่าค้าง หรือแทนที่ด้วยคำแนะนำของ vendor                                                              |
| 32  | `augmentModelCatalog`             | แถวแค็ตตาล็อกแบบ synthetic/final ที่ถูก append หลัง discovery                                                  | provider ต้องการแถว synthetic forward-compat ใน `models list` และ picker                                                                    |
| 33  | `resolveThinkingProfile`          | ชุดระดับ `/think`, ป้ายแสดงผล และค่าเริ่มต้นเฉพาะโมเดล                                                         | provider เปิดเผย thinking ladder แบบกำหนดเอง หรือป้ายแบบ binary สำหรับโมเดลที่เลือก                                                       |
| 34  | `isBinaryThinking`                | compatibility hook สำหรับการสลับ reasoning แบบเปิด/ปิด                                                          | provider เปิดเผยเฉพาะ thinking แบบ binary on/off                                                                                             |
| 35  | `supportsXHighThinking`           | compatibility hook สำหรับการรองรับ reasoning แบบ `xhigh`                                                        | provider ต้องการให้ `xhigh` ใช้ได้เฉพาะกับบางโมเดล                                                                                          |
| 36  | `resolveDefaultThinkingLevel`     | compatibility hook สำหรับระดับ `/think` เริ่มต้น                                                                | provider เป็นเจ้าของนโยบาย `/think` เริ่มต้นสำหรับ model family                                                                              |
| 37  | `isModernModelRef`                | ตัวจับคู่ modern-model สำหรับ live profile filter และการเลือก smoke                                              | provider เป็นเจ้าของการจับคู่โมเดลที่ควรใช้สำหรับ live/smoke                                                                                  |
| 38  | `prepareRuntimeAuth`              | แลกข้อมูลรับรองที่กำหนดค่าไว้ให้กลายเป็น token/key จริงตอน runtime ก่อน inference                           | provider ต้องการ token exchange หรือข้อมูลรับรองสำหรับคำขอแบบอายุสั้น                                                                     |
| 39  | `resolveUsageAuth`                | resolve ข้อมูลรับรองด้าน usage/billing สำหรับ `/usage` และพื้นผิวสถานะที่เกี่ยวข้อง                          | provider ต้องการการ parse token ด้าน usage/quota แบบกำหนดเอง หรือใช้ข้อมูลรับรองด้าน usage คนละชุด                                        |
| 40  | `fetchUsageSnapshot`              | ดึงและ normalize snapshot ด้าน usage/quota ที่เฉพาะ provider หลังจาก resolve auth แล้ว                        | provider ต้องการ endpoint ด้าน usage แบบเฉพาะ provider หรือ parser สำหรับ payload                                                           |
| 41  | `createEmbeddingProvider`         | สร้าง embedding adapter ที่ provider เป็นเจ้าของสำหรับ memory/search                                           | พฤติกรรมด้าน memory embedding ควรอยู่กับ provider plugin                                                                                    |
| 42  | `buildReplayPolicy`               | ส่งคืน replay policy ที่ควบคุมการจัดการ transcript สำหรับ provider                                           | provider ต้องการนโยบาย transcript แบบกำหนดเอง (เช่น การตัด thinking block ออก)                                                            |
| 43  | `sanitizeReplayHistory`           | เขียน replay history ใหม่หลังจากการล้าง transcript แบบทั่วไป                                                  | provider ต้องการการเขียน replay แบบเฉพาะ provider ที่เกินกว่าตัวช่วย shared compaction                                                    |
| 44  | `validateReplayTurns`             | การตรวจสอบหรือปรับรูปร่าง replay turn ขั้นสุดท้ายก่อน embedded runner                                         | transport ของ provider ต้องการการตรวจสอบ turn ที่เข้มงวดกว่าหลังการ sanitize แบบทั่วไป                                                   |
| 45  | `onModelSelected`                 | รันผลข้างเคียงหลังการเลือกโมเดลที่ provider เป็นเจ้าของ                                                       | provider ต้องการ telemetry หรือสถานะที่ provider เป็นเจ้าของเมื่อโมเดลหนึ่งกลายเป็นโมเดลที่ใช้งานอยู่                                      |

`normalizeModelId`, `normalizeTransport` และ `normalizeConfig` จะตรวจสอบ
provider plugin ที่ตรงกันก่อน จากนั้นจึงไล่ผ่าน provider plugin ตัวอื่นที่รองรับ hook
จนกว่าจะมีตัวหนึ่งเปลี่ยน model id หรือ transport/config จริง ๆ วิธีนี้ทำให้
alias/compat provider shim ยังคงทำงานได้ โดยไม่บังคับให้ผู้เรียกรู้ว่า bundled plugin ตัวใดเป็นเจ้าของการเขียนใหม่ หากไม่มี provider hook ใดเขียน entry ของ supported
Google-family config ใหม่ normalizer ของ bundled Google ก็ยังคงใช้การล้างเพื่อความเข้ากันได้นั้นต่อไป

หาก provider ต้องการ wire protocol แบบกำหนดเองทั้งหมด หรือ request executor แบบกำหนดเอง
นั่นเป็น extension อีกประเภทหนึ่ง hook เหล่านี้มีไว้สำหรับพฤติกรรมของ provider ที่
ยังคงทำงานบน inference loop ปกติของ OpenClaw

### ตัวอย่าง provider

```ts
api.registerProvider({
  id: "example-proxy",
  label: "Example Proxy",
  auth: [],
  catalog: {
    order: "simple",
    run: async (ctx) => {
      const apiKey = ctx.resolveProviderApiKey("example-proxy").apiKey;
      if (!apiKey) {
        return null;
      }
      return {
        provider: {
          baseUrl: "https://proxy.example.com/v1",
          apiKey,
          api: "openai-completions",
          models: [{ id: "auto", name: "Auto" }],
        },
      };
    },
  },
  resolveDynamicModel: (ctx) => ({
    id: ctx.modelId,
    name: ctx.modelId,
    provider: "example-proxy",
    api: "openai-completions",
    baseUrl: "https://proxy.example.com/v1",
    reasoning: false,
    input: ["text"],
    cost: { input: 0, output: 0, cacheRead: 0, cacheWrite: 0 },
    contextWindow: 128000,
    maxTokens: 8192,
  }),
  prepareRuntimeAuth: async (ctx) => {
    const exchanged = await exchangeToken(ctx.apiKey);
    return {
      apiKey: exchanged.token,
      baseUrl: exchanged.baseUrl,
      expiresAt: exchanged.expiresAt,
    };
  },
  resolveUsageAuth: async (ctx) => {
    const auth = await ctx.resolveOAuthToken();
    return auth ? { token: auth.token } : null;
  },
  fetchUsageSnapshot: async (ctx) => {
    return await fetchExampleProxyUsage(ctx.token, ctx.timeoutMs, ctx.fetchFn);
  },
});
```

### ตัวอย่างแบบ built-in

- Anthropic ใช้ `resolveDynamicModel`, `capabilities`, `buildAuthDoctorHint`,
  `resolveUsageAuth`, `fetchUsageSnapshot`, `isCacheTtlEligible`,
  `resolveThinkingProfile`, `applyConfigDefaults`, `isModernModelRef`
  และ `wrapStreamFn` เพราะมันเป็นเจ้าของ Claude 4.6 forward-compat,
  provider-family hint, แนวทางซ่อม auth, integration ของ usage endpoint,
  การตัดสิน prompt-cache eligibility, ค่าเริ่มต้นของ config แบบรู้บริบท auth, นโยบาย thinking เริ่มต้น/ปรับตามเงื่อนไขของ Claude และการจัดรูปสตรีมแบบเฉพาะ Anthropic สำหรับ
  beta header, `/fast` / `serviceTier` และ `context1m`
- helper ด้าน stream ที่เฉพาะกับ Claude ของ Anthropic ยังอยู่ใน
  seam `api.ts` / `contract-api.ts` แบบสาธารณะที่เป็นของ bundled plugin เองในตอนนี้ พื้นผิวของแพ็กเกจนี้
  export `wrapAnthropicProviderStream`, `resolveAnthropicBetas`,
  `resolveAnthropicFastMode`, `resolveAnthropicServiceTier` และตัวสร้าง wrapper ของ Anthropic ระดับล่าง แทนการขยาย generic SDK ไปรอบกฎ beta-header ของ provider ตัวเดียว
- OpenAI ใช้ `resolveDynamicModel`, `normalizeResolvedModel` และ
  `capabilities` รวมถึง `buildMissingAuthMessage`, `suppressBuiltInModel`,
  `augmentModelCatalog`, `resolveThinkingProfile` และ `isModernModelRef`
  เพราะมันเป็นเจ้าของ GPT-5.4 forward-compat, การ normalize จาก
  `openai-completions` -> `openai-responses` โดยตรง, auth hint ที่รู้เรื่อง Codex,
  การซ่อน Spark, synthetic row ในรายการของ OpenAI และนโยบาย GPT-5 thinking /
  live-model; ส่วน family ของ stream `openai-responses-defaults` เป็นเจ้าของ wrapper ของ OpenAI Responses แบบเนทีฟที่ใช้ร่วมกันสำหรับ attribution header,
  `/fast`/`serviceTier`, text verbosity, native Codex web search,
  การจัดรูป payload reasoning-compat และการจัดการ context ของ Responses
- OpenRouter ใช้ `catalog` ร่วมกับ `resolveDynamicModel` และ
  `prepareDynamicModel` เพราะ provider เป็นแบบ pass-through และอาจเปิดเผย
  model id ใหม่ก่อนที่ static catalog ของ OpenClaw จะอัปเดต; มันยังใช้
  `capabilities`, `wrapStreamFn` และ `isCacheTtlEligible` เพื่อเก็บ
  request header, routing metadata, reasoning patch และ
  นโยบาย prompt-cache ที่เฉพาะ provider ไว้นอก core replay policy ของมันมาจาก
  family `passthrough-gemini` ขณะที่ family ของ stream `openrouter-thinking`
  เป็นเจ้าของการ inject reasoning แบบ proxy และการข้าม unsupported-model / `auto`
- GitHub Copilot ใช้ `catalog`, `auth`, `resolveDynamicModel` และ
  `capabilities` รวมถึง `prepareRuntimeAuth` และ `fetchUsageSnapshot` เพราะมัน
  ต้องใช้ device login ที่ provider เป็นเจ้าของ, พฤติกรรม fallback ของโมเดล, ความแปลกของ transcript สำหรับ Claude, การแลก GitHub token -> Copilot token และ usage endpoint ที่ provider เป็นเจ้าของ
- OpenAI Codex ใช้ `catalog`, `resolveDynamicModel`,
  `normalizeResolvedModel`, `refreshOAuth` และ `augmentModelCatalog` รวมถึง
  `prepareExtraParams`, `resolveUsageAuth` และ `fetchUsageSnapshot` เพราะมัน
  ยังคงรันบน transport ของ OpenAI ใน core แต่เป็นเจ้าของการ normalize
  transport/base URL, นโยบาย fallback เมื่อ OAuth refresh ล้มเหลว, การเลือก transport เริ่มต้น,
  synthetic row ในแค็ตตาล็อกของ Codex และ integration กับ usage endpoint ของ ChatGPT; มัน
  ใช้ family ของ stream `openai-responses-defaults` ตัวเดียวกับ OpenAI โดยตรง
- Google AI Studio และ Gemini CLI OAuth ใช้ `resolveDynamicModel`,
  `buildReplayPolicy`, `sanitizeReplayHistory`,
  `resolveReasoningOutputMode`, `wrapStreamFn` และ `isModernModelRef` เพราะ
  family ของ replay `google-gemini` เป็นเจ้าของ Gemini 3.1 forward-compat fallback,
  การตรวจสอบ replay แบบเนทีฟของ Gemini, bootstrap replay sanitation, tagged
  reasoning-output mode และการจับคู่ modern-model ขณะที่
  family ของ stream `google-thinking` เป็นเจ้าของการ normalize Gemini thinking payload;
  Gemini CLI OAuth ยังใช้ `formatApiKey`, `resolveUsageAuth` และ
  `fetchUsageSnapshot` สำหรับการจัดรูป token, การ parse token และการเชื่อมต่อ quota endpoint
- Anthropic Vertex ใช้ `buildReplayPolicy` ผ่าน
  family ของ replay `anthropic-by-model` เพื่อให้การล้าง replay แบบเฉพาะ Claude ยังคงจำกัดอยู่กับ Claude id แทนที่จะครอบคลุมทุก transport แบบ `anthropic-messages`
- Amazon Bedrock ใช้ `buildReplayPolicy`, `matchesContextOverflowError`,
  `classifyFailoverReason` และ `resolveThinkingProfile` เพราะมันเป็นเจ้าของ
  การจัดประเภทข้อผิดพลาด throttle/not-ready/context-overflow แบบเฉพาะ Bedrock
  สำหรับทราฟฟิก Anthropic-on-Bedrock; replay policy ของมันยังคงใช้ guard
  แบบ Claude-only `anthropic-by-model` ร่วมกัน
- OpenRouter, Kilocode, Opencode และ Opencode Go ใช้ `buildReplayPolicy`
  ผ่าน family ของ replay `passthrough-gemini` เพราะพวกมันพร็อกซี Gemini
  model ผ่าน OpenAI-compatible transport และต้องการการ sanitize Gemini
  thought-signature โดยไม่ต้องมี native Gemini replay validation หรือ bootstrap rewrite
- MiniMax ใช้ `buildReplayPolicy` ผ่าน
  family ของ replay `hybrid-anthropic-openai` เพราะ provider เดียวเป็นเจ้าของทั้ง
  semantics แบบ Anthropic-message และ OpenAI-compatible; มันคงการตัด Claude-only
  thinking-block ทางฝั่ง Anthropic ขณะ override reasoning
  output mode กลับไปเป็น native และ family ของ stream `minimax-fast-mode` เป็นเจ้าของ
  fast-mode model rewrite บน shared stream path
- Moonshot ใช้ `catalog`, `resolveThinkingProfile` และ `wrapStreamFn` เพราะยังใช้
  OpenAI transport แบบ shared แต่ต้องการการ normalize thinking payload ที่ provider เป็นเจ้าของ; family ของ stream `moonshot-thinking` จะแมป config พร้อม state ของ `/think` เข้ากับ native binary thinking payload ของมัน
- Kilocode ใช้ `catalog`, `capabilities`, `wrapStreamFn` และ
  `isCacheTtlEligible` เพราะมันต้องการ request header ที่ provider เป็นเจ้าของ,
  การ normalize reasoning payload, Gemini transcript hint และการ gating Anthropic
  cache-TTL; family ของ stream `kilocode-thinking` คงการ inject Kilo thinking
  ไว้บน shared proxy stream path ขณะข้าม `kilo/auto` และ proxy model id อื่น
  ที่ไม่รองรับ reasoning payload แบบ explicit
- Z.AI ใช้ `resolveDynamicModel`, `prepareExtraParams`, `wrapStreamFn`,
  `isCacheTtlEligible`, `resolveThinkingProfile`, `isModernModelRef`,
  `resolveUsageAuth` และ `fetchUsageSnapshot` เพราะมันเป็นเจ้าของ GLM-5 fallback,
  ค่าเริ่มต้นของ `tool_stream`, UX แบบ binary thinking, modern-model matching และทั้ง
  usage auth + quota fetching; family ของ stream `tool-stream-default-on` คง
  wrapper แบบ `tool_stream` ที่เปิดโดยค่าเริ่มต้นไว้นอก glue ที่เขียนมือราย provider
- xAI ใช้ `normalizeResolvedModel`, `normalizeTransport`,
  `contributeResolvedModelCompat`, `prepareExtraParams`, `wrapStreamFn`,
  `resolveSyntheticAuth`, `resolveDynamicModel` และ `isModernModelRef`
  เพราะมันเป็นเจ้าของการ normalize transport ของ native xAI Responses, การ rewrite alias ของ Grok fast-mode, ค่าเริ่มต้นของ `tool_stream`, การล้าง strict-tool / reasoning-payload,
  การใช้ auth แบบ fallback ซ้ำสำหรับ tool ที่ plugin เป็นเจ้าของ, forward-compat สำหรับการ resolve Grok
  model และ compat patch ที่ provider เป็นเจ้าของ เช่น xAI tool-schema
  profile, unsupported schema keyword, native `web_search` และการถอดรหัส HTML-entity ใน argument ของ tool-call
- Mistral, OpenCode Zen และ OpenCode Go ใช้เฉพาะ `capabilities`
  เพื่อเก็บความแปลกของ transcript/tooling ไว้นอก core
- bundled provider ที่มีเพียง catalog เช่น `byteplus`, `cloudflare-ai-gateway`,
  `huggingface`, `kimi-coding`, `nvidia`, `qianfan`,
  `synthetic`, `together`, `venice`, `vercel-ai-gateway` และ `volcengine` ใช้
  เฉพาะ `catalog`
- Qwen ใช้ `catalog` สำหรับ text provider ของมัน รวมถึงการลงทะเบียน shared media-understanding และ
  video-generation สำหรับพื้นผิวหลายรูปแบบข้อมูลของมัน
- MiniMax และ Xiaomi ใช้ `catalog` ร่วมกับ usage hook เพราะพฤติกรรม `/usage`
  ของพวกมันเป็นของ plugin แม้ inference จะยังรันผ่าน shared transport

## ตัวช่วยขณะ runtime

plugin สามารถเข้าถึง core helper บางตัวผ่าน `api.runtime` สำหรับ TTS:

```ts
const clip = await api.runtime.tts.textToSpeech({
  text: "Hello from OpenClaw",
  cfg: api.config,
});

const result = await api.runtime.tts.textToSpeechTelephony({
  text: "Hello from OpenClaw",
  cfg: api.config,
});

const voices = await api.runtime.tts.listVoices({
  provider: "elevenlabs",
  cfg: api.config,
});
```

หมายเหตุ:

- `textToSpeech` ส่งคืน payload ของ core TTS ปกติสำหรับพื้นผิวแบบ file/voice-note
- ใช้การกำหนดค่า `messages.tts` และการเลือก provider ของ core
- ส่งคืน PCM audio buffer + sample rate plugin ต้อง resample/encode สำหรับ provider ต่าง ๆ
- `listVoices` เป็นแบบทางเลือกต่อ provider ใช้มันสำหรับ voice picker หรือ setup flow ที่ vendor เป็นเจ้าของ
- รายการเสียงอาจรวม metadata ที่เข้มข้นขึ้น เช่น locale, gender และ personality tag สำหรับ picker ที่รับรู้ provider
- ตอนนี้ OpenAI และ ElevenLabs รองรับ telephony ส่วน Microsoft ยังไม่รองรับ

plugin ยังสามารถลงทะเบียน speech provider ผ่าน `api.registerSpeechProvider(...)` ได้

```ts
api.registerSpeechProvider({
  id: "acme-speech",
  label: "Acme Speech",
  isConfigured: ({ config }) => Boolean(config.messages?.tts),
  synthesize: async (req) => {
    return {
      audioBuffer: Buffer.from([]),
      outputFormat: "mp3",
      fileExtension: ".mp3",
      voiceCompatible: false,
    };
  },
});
```

หมายเหตุ:

- คงนโยบาย TTS, fallback และการส่งคำตอบไว้ใน core
- ใช้ speech provider สำหรับพฤติกรรมการสังเคราะห์เสียงที่ vendor เป็นเจ้าของ
- อินพุต `edge` แบบเดิมของ Microsoft จะถูก normalize ไปเป็น provider id `microsoft`
- โมเดลความเป็นเจ้าของที่ควรใช้คือแบบยึดตามบริษัท: vendor plugin หนึ่งตัวสามารถเป็นเจ้าของ
  text, speech, image และ media provider ในอนาคตได้ เมื่อ OpenClaw เพิ่ม
  capability contract เหล่านั้น

สำหรับ image/audio/video understanding plugin จะลงทะเบียน typed
media-understanding provider หนึ่งตัว แทนการใช้ key/value bag แบบทั่วไป:

```ts
api.registerMediaUnderstandingProvider({
  id: "google",
  capabilities: ["image", "audio", "video"],
  describeImage: async (req) => ({ text: "..." }),
  transcribeAudio: async (req) => ({ text: "..." }),
  describeVideo: async (req) => ({ text: "..." }),
});
```

หมายเหตุ:

- คง orchestration, fallback, config และ channel wiring ไว้ใน core
- คงพฤติกรรมของ vendor ไว้ใน provider plugin
- การขยายแบบเติมเพิ่มควรคงความเป็น typed: เมธอดแบบ optional ใหม่, ฟิลด์ผลลัพธ์แบบ optional ใหม่, capability แบบ optional ใหม่
- ตอนนี้ video generation ก็ใช้รูปแบบเดียวกันแล้ว:
  - core เป็นเจ้าของ capability contract และ runtime helper
  - vendor plugin ลงทะเบียน `api.registerVideoGenerationProvider(...)`
  - feature/channel plugin ใช้ `api.runtime.videoGeneration.*`

สำหรับ media-understanding runtime helper plugin สามารถเรียกใช้:

```ts
const image = await api.runtime.mediaUnderstanding.describeImageFile({
  filePath: "/tmp/inbound-photo.jpg",
  cfg: api.config,
  agentDir: "/tmp/agent",
});

const video = await api.runtime.mediaUnderstanding.describeVideoFile({
  filePath: "/tmp/inbound-video.mp4",
  cfg: api.config,
});
```

สำหรับการถอดเสียง audio plugin สามารถใช้ได้ทั้ง media-understanding runtime
หรือ alias แบบ STT รุ่นเก่า:

```ts
const { text } = await api.runtime.mediaUnderstanding.transcribeAudioFile({
  filePath: "/tmp/inbound-audio.ogg",
  cfg: api.config,
  // ไม่บังคับ เมื่ออนุมาน MIME ได้ไม่แน่นอน:
  mime: "audio/ogg",
});
```

หมายเหตุ:

- `api.runtime.mediaUnderstanding.*` คือพื้นผิวที่ใช้ร่วมกันซึ่งควรใช้เป็นลำดับแรกสำหรับ
  image/audio/video understanding
- ใช้การกำหนดค่า audio ของ media-understanding ใน core (`tools.media.audio`) และลำดับ fallback ของ provider
- ส่งคืน `{ text: undefined }` เมื่อไม่มีเอาต์พุตการถอดเสียง (เช่น อินพุตถูกข้าม/ไม่รองรับ)
- `api.runtime.stt.transcribeAudioFile(...)` ยังคงมีอยู่เป็น compatibility alias

plugin ยังสามารถเริ่มการรัน subagent แบบแบ็กกราวด์ผ่าน `api.runtime.subagent` ได้:

```ts
const result = await api.runtime.subagent.run({
  sessionKey: "agent:main:subagent:search-helper",
  message: "Expand this query into focused follow-up searches.",
  provider: "openai",
  model: "gpt-4.1-mini",
  deliver: false,
});
```

หมายเหตุ:

- `provider` และ `model` เป็นการแทนที่แบบรายรันที่ไม่บังคับ ไม่ใช่การเปลี่ยนเซสชันแบบถาวร
- OpenClaw จะยอมรับฟิลด์การแทนที่เหล่านั้นเฉพาะสำหรับผู้เรียกที่เชื่อถือได้
- สำหรับ fallback run ที่ plugin เป็นเจ้าของ ผู้ปฏิบัติการต้อง opt in ด้วย `plugins.entries.<id>.subagent.allowModelOverride: true`
- ใช้ `plugins.entries.<id>.subagent.allowedModels` เพื่อจำกัด plugin ที่เชื่อถือได้ให้ใช้ได้เฉพาะ canonical `provider/model` target ที่กำหนด หรือ `"*"` เพื่ออนุญาตทุก target อย่างชัดเจน
- การรัน subagent ของ plugin ที่ไม่เชื่อถือยังทำงานได้ แต่คำขอ override จะถูกปฏิเสธแทนที่จะ fallback แบบเงียบ ๆ

สำหรับ web search plugin สามารถใช้ shared runtime helper แทนการ
เจาะเข้าไปใน wiring ของ agent tool:

```ts
const providers = api.runtime.webSearch.listProviders({
  config: api.config,
});

const result = await api.runtime.webSearch.search({
  config: api.config,
  args: {
    query: "OpenClaw plugin runtime helpers",
    count: 5,
  },
});
```

plugin ยังสามารถลงทะเบียน web-search provider ผ่าน
`api.registerWebSearchProvider(...)` ได้ด้วย

หมายเหตุ:

- คงการเลือก provider, การ resolve ข้อมูลรับรอง และ request semantics แบบ shared ไว้ใน core
- ใช้ web-search provider สำหรับ search transport ที่เฉพาะกับ vendor
- `api.runtime.webSearch.*` คือพื้นผิวที่ใช้ร่วมกันซึ่งควรใช้เป็นลำดับแรกสำหรับ feature/channel plugin ที่ต้องการพฤติกรรมการค้นหาโดยไม่ต้องพึ่ง wrapper ของ agent tool

### `api.runtime.imageGeneration`

```ts
const result = await api.runtime.imageGeneration.generate({
  config: api.config,
  args: { prompt: "A friendly lobster mascot", size: "1024x1024" },
});

const providers = api.runtime.imageGeneration.listProviders({
  config: api.config,
});
```

- `generate(...)`: สร้างภาพโดยใช้สายโซ่ provider สำหรับ image-generation ที่กำหนดค่าไว้
- `listProviders(...)`: แสดงรายการ provider สำหรับ image-generation ที่พร้อมใช้และ capability ของแต่ละตัว

## Gateway HTTP routes

plugin สามารถเปิดเผย HTTP endpoint ผ่าน `api.registerHttpRoute(...)` ได้

```ts
api.registerHttpRoute({
  path: "/acme/webhook",
  auth: "plugin",
  match: "exact",
  handler: async (_req, res) => {
    res.statusCode = 200;
    res.end("ok");
    return true;
  },
});
```

ฟิลด์ของ route:

- `path`: พาธของ route ภายใต้เซิร์ฟเวอร์ HTTP ของ gateway
- `auth`: จำเป็น ใช้ `"gateway"` เพื่อให้ต้องใช้ gateway auth ปกติ หรือ `"plugin"` สำหรับ auth/webhook verification ที่ plugin จัดการเอง
- `match`: ไม่บังคับ `"exact"` (ค่าเริ่มต้น) หรือ `"prefix"`
- `replaceExisting`: ไม่บังคับ อนุญาตให้ plugin เดียวกันแทนที่ route registration เดิมของตัวเองได้
- `handler`: ส่งคืน `true` เมื่อ route เป็นผู้จัดการคำขอนั้น

หมายเหตุ:

- `api.registerHttpHandler(...)` ถูกนำออกแล้ว และจะทำให้เกิด plugin-load error ให้ใช้ `api.registerHttpRoute(...)` แทน
- plugin route ต้องประกาศ `auth` อย่างชัดเจน
- ความขัดแย้งของ `path + match` แบบตรงตัวจะถูกปฏิเสธ เว้นแต่ `replaceExisting: true` และ plugin หนึ่งไม่สามารถแทนที่ route ของอีก plugin หนึ่งได้
- route ที่ทับซ้อนกันแต่มีระดับ `auth` ต่างกันจะถูกปฏิเสธ ให้คง chain ของ fallthrough แบบ `exact`/`prefix` ไว้ในระดับ auth เดียวกันเท่านั้น
- route ที่มี `auth: "plugin"` จะ **ไม่ได้รับ** operator runtime scope โดยอัตโนมัติ มันมีไว้สำหรับ webhook/signature verification ที่ plugin จัดการเอง ไม่ใช่การเรียก Gateway helper ที่มีสิทธิ์สูง
- route ที่มี `auth: "gateway"` จะรันภายใน Gateway request runtime scope แต่ scope นี้จงใจทำให้ระมัดระวัง:
  - shared-secret bearer auth (`gateway.auth.mode = "token"` / `"password"`) จะตรึง plugin-route runtime scope ไว้ที่ `operator.write` แม้ผู้เรียกจะส่ง `x-openclaw-scopes` มาก็ตาม
  - โหมด HTTP แบบมีข้อมูลตัวตนที่เชื่อถือได้ (เช่น `trusted-proxy` หรือ `gateway.auth.mode = "none"` บน ingress ส่วนตัว) จะเคารพ `x-openclaw-scopes` เฉพาะเมื่อมี header นี้อย่างชัดเจน
  - หากไม่มี `x-openclaw-scopes` บนคำขอ plugin-route แบบมีข้อมูลตัวตนเหล่านั้น runtime scope จะ fallback เป็น `operator.write`
- กฎเชิงปฏิบัติ: อย่าถือว่า gateway-auth plugin route เป็นพื้นผิวระดับ admin โดยนัย หาก route ของคุณต้องการพฤติกรรมแบบ admin-only ให้กำหนดให้ต้องใช้โหมด auth แบบมีข้อมูลตัวตน และบันทึกสัญญาของ header `x-openclaw-scopes` แบบ explicit

## พาธ import ของ Plugin SDK

ใช้ SDK subpath แทน import แบบ monolithic `openclaw/plugin-sdk` เมื่อ
เขียน plugin:

- `openclaw/plugin-sdk/plugin-entry` สำหรับ primitive การลงทะเบียน plugin
- `openclaw/plugin-sdk/core` สำหรับสัญญาทั่วไปแบบ shared ที่หันหน้าไปยัง plugin
- `openclaw/plugin-sdk/config-schema` สำหรับการ export Zod schema ของ root `openclaw.json`
  (`OpenClawSchema`)
- primitive ที่เสถียรสำหรับแชนเนล เช่น `openclaw/plugin-sdk/channel-setup`,
  `openclaw/plugin-sdk/setup-runtime`,
  `openclaw/plugin-sdk/setup-adapter-runtime`,
  `openclaw/plugin-sdk/setup-tools`,
  `openclaw/plugin-sdk/channel-pairing`,
  `openclaw/plugin-sdk/channel-contract`,
  `openclaw/plugin-sdk/channel-feedback`,
  `openclaw/plugin-sdk/channel-inbound`,
  `openclaw/plugin-sdk/channel-lifecycle`,
  `openclaw/plugin-sdk/channel-reply-pipeline`,
  `openclaw/plugin-sdk/command-auth`,
  `openclaw/plugin-sdk/secret-input` และ
  `openclaw/plugin-sdk/webhook-ingress` สำหรับ wiring ด้าน setup/auth/reply/webhook
  แบบใช้ร่วมกัน `channel-inbound` คือที่อยู่ร่วมสำหรับ debounce, mention matching,
  helper ของ inbound mention-policy, envelope formatting และ helper ของ inbound envelope context
  `channel-setup` คือ setup seam แบบแคบสำหรับ optional-install
  `setup-runtime` คือพื้นผิว setup ที่ปลอดภัยสำหรับ runtime ซึ่งใช้โดย `setupEntry` /
  deferred startup รวมถึง import-safe setup patch adapter
  `setup-adapter-runtime` คือ seam ของ account-setup adapter ที่รับรู้ env
  `setup-tools` คือ seam ขนาดเล็กสำหรับตัวช่วยด้าน CLI/archive/docs (`formatCliCommand`,
  `detectBinary`, `extractArchive`, `resolveBrewExecutable`, `formatDocsLink`,
  `CONFIG_DIR`)
- subpath ตามโดเมน เช่น `openclaw/plugin-sdk/channel-config-helpers`,
  `openclaw/plugin-sdk/allow-from`,
  `openclaw/plugin-sdk/channel-config-schema`,
  `openclaw/plugin-sdk/telegram-command-config`,
  `openclaw/plugin-sdk/channel-policy`,
  `openclaw/plugin-sdk/approval-gateway-runtime`,
  `openclaw/plugin-sdk/approval-handler-adapter-runtime`,
  `openclaw/plugin-sdk/approval-handler-runtime`,
  `openclaw/plugin-sdk/approval-runtime`,
  `openclaw/plugin-sdk/config-runtime`,
  `openclaw/plugin-sdk/infra-runtime`,
  `openclaw/plugin-sdk/agent-runtime`,
  `openclaw/plugin-sdk/lazy-runtime`,
  `openclaw/plugin-sdk/reply-history`,
  `openclaw/plugin-sdk/routing`,
  `openclaw/plugin-sdk/status-helpers`,
  `openclaw/plugin-sdk/text-runtime`,
  `openclaw/plugin-sdk/runtime-store` และ
  `openclaw/plugin-sdk/directory-runtime` สำหรับ helper ด้าน runtime/config แบบ shared
  `telegram-command-config` คือ public seam แบบแคบสำหรับ normalization/validation ของ custom command ใน Telegram และยังคงมีอยู่แม้พื้นผิว contract ของ Telegram แบบ bundled จะใช้งานไม่ได้ชั่วคราว
  `text-runtime` คือ seam ร่วมสำหรับ text/markdown/logging รวมถึง
  assistant-visible-text stripping, helper สำหรับ render/chunking ของ markdown, helper สำหรับ redaction,
  helper สำหรับ directive-tag และยูทิลิตี safe-text
- seam เฉพาะ approval ของแชนเนลควรใช้ `approvalCapability`
  contract เดียวบน plugin จากนั้น core จะอ่าน approval auth, delivery, render,
  native-routing และ lazy native-handler behavior ผ่าน capability เดียวนั้น แทนการผสมพฤติกรรม approval เข้าไปในฟิลด์อื่นของ plugin ที่ไม่เกี่ยวข้อง
- `openclaw/plugin-sdk/channel-runtime` ถูกเลิกใช้และคงอยู่เพียงเป็น
  compatibility shim สำหรับ plugin รุ่นเก่า โค้ดใหม่ควร import primitive แบบแคบที่เป็น generic แทน และโค้ดใน repo ไม่ควรเพิ่ม import ใหม่ของ shim นี้
- ภายในของ bundled extension ยังคงเป็น private plugin ภายนอกควรใช้เฉพาะ `openclaw/plugin-sdk/*` subpath เท่านั้น โค้ด core/test ของ OpenClaw อาจใช้ public entry point ของ repo ภายใต้ root ของแพ็กเกจ plugin เช่น `index.js`, `api.js`,
  `runtime-api.js`, `setup-entry.js` และไฟล์ที่กำหนดขอบเขตแคบ เช่น
  `login-qr-api.js` ห้าม import `src/*` ของแพ็กเกจ plugin จาก core หรือจาก extension อื่นโดยเด็ดขาด
- การแยก entry point ของ repo:
  `<plugin-package-root>/api.js` คือ barrel สำหรับ helper/types,
  `<plugin-package-root>/runtime-api.js` คือ barrel สำหรับ runtime เท่านั้น,
  `<plugin-package-root>/index.js` คือ entry ของ bundled plugin
  และ `<plugin-package-root>/setup-entry.js` คือ entry ของ setup plugin
- ตัวอย่าง provider แบบ bundled ในปัจจุบัน:
  - Anthropic ใช้ `api.js` / `contract-api.js` สำหรับ helper ด้าน Claude stream เช่น
    `wrapAnthropicProviderStream`, helper ของ beta-header และการ parse `service_tier`
  - OpenAI ใช้ `api.js` สำหรับ provider builder, helper ของ default-model และ
    realtime provider builder
  - OpenRouter ใช้ `api.js` สำหรับ provider builder ของมันรวมถึง onboarding/config
    helper ขณะที่ `register.runtime.js` ยังสามารถ re-export helper แบบ generic ของ
    `plugin-sdk/provider-stream` สำหรับการใช้งานภายใน repo ได้
- public entry point ที่โหลดผ่าน facade จะเลือกใช้ active runtime config snapshot
  เมื่อมีอยู่ แล้วจึง fallback ไปยัง config file ที่ resolve แล้วบนดิสก์เมื่อ
  OpenClaw ยังไม่ได้เสิร์ฟ runtime snapshot
- primitive แบบ generic ที่ใช้ร่วมกันยังคงเป็นสัญญา SDK สาธารณะที่ควรใช้เป็นลำดับแรก ยังมี seam ของ helper ที่ติดแบรนด์แชนเนลของ bundled อยู่เล็กน้อยเพื่อความเข้ากันได้ ให้ถือว่าสิ่งเหล่านั้นเป็น seam สำหรับการบำรุงรักษา bundled/ความเข้ากันได้ ไม่ใช่ target import ใหม่สำหรับ third-party; สัญญาข้ามแชนเนลใหม่ยังควรลงบน generic `plugin-sdk/*` subpath หรือ barrel ของ plugin-local อย่าง `api.js` /
  `runtime-api.js`

หมายเหตุด้านความเข้ากันได้:

- หลีกเลี่ยง root barrel `openclaw/plugin-sdk` สำหรับโค้ดใหม่
- ให้ใช้ primitive แบบแคบและเสถียรก่อนเสมอ subpath ใหม่กว่าอย่าง setup/pairing/reply/
  feedback/contract/inbound/threading/command/secret-input/webhook/infra/
  allowlist/status/message-tool คือสัญญาที่ตั้งใจไว้สำหรับงาน plugin ใหม่ทั้งแบบ bundled และภายนอก
  การ parse/match เป้าหมายควรอยู่บน `openclaw/plugin-sdk/channel-targets`
  ส่วน gate ของ message action และ helper ของ reaction message-id ควรอยู่บน
  `openclaw/plugin-sdk/channel-actions`
- bundled extension-specific helper barrel ไม่เสถียรโดยค่าเริ่มต้น หาก
  helper ตัวใดจำเป็นเฉพาะกับ bundled extension ให้เก็บมันไว้หลัง
  seam `api.js` หรือ `runtime-api.js` ภายใน extension นั้น แทนการยกระดับไปยัง
  `openclaw/plugin-sdk/<extension>`
- shared helper seam ใหม่ควรเป็นแบบ generic ไม่ใช่ติดแบรนด์แชนเนล การ parse target แบบ shared
  ควรอยู่บน `openclaw/plugin-sdk/channel-targets`; ส่วนภายในที่เฉพาะแชนเนลให้คงไว้หลัง seam `api.js` หรือ `runtime-api.js` ภายใน plugin เจ้าของนั้น
- subpath เฉพาะ capability เช่น `image-generation`,
  `media-understanding` และ `speech` มีอยู่เพราะ bundled/native plugin ใช้มัน
  ในปัจจุบัน การมีอยู่ของมันไม่ได้หมายความโดยตัวมันเองว่า helper ทุกตัวที่ export ออกมาเป็นสัญญาภายนอกระยะยาวที่ถูกตรึงไว้

## schema ของ message tool

plugin ควรเป็นเจ้าของ contribution ต่อ schema ของ `describeMessageTool(...)` แบบเฉพาะแชนเนล
สำหรับ primitive ที่ไม่ใช่ข้อความ เช่น reactions, reads และ polls
ส่วนการนำเสนอการส่งแบบ shared ควรใช้สัญญา `MessagePresentation` แบบทั่วไป
แทน field ของปุ่ม, component, block หรือ card แบบเนทีฟของ provider
ดู [Message Presentation](/th/plugins/message-presentation) สำหรับสัญญา,
กฎ fallback, การแมป provider และเช็กลิสต์สำหรับผู้เขียน plugin

plugin ที่สามารถส่งได้จะประกาศสิ่งที่มันเรนเดอร์ได้ผ่าน message capability:

- `presentation` สำหรับ semantic presentation block (`text`, `context`, `divider`, `buttons`, `select`)
- `delivery-pin` สำหรับคำขอการส่งแบบ pinned

core จะตัดสินใจว่าจะเรนเดอร์ presentation แบบเนทีฟหรือ degrade มันให้เป็นข้อความ
อย่าเปิดเผย UI escape hatch แบบเนทีฟของ provider ผ่าน generic message tool
helper แบบ SDK ที่เลิกใช้แล้วสำหรับ native schema แบบเดิมยังคงถูก export เพื่อรองรับ
third-party plugin ที่มีอยู่ แต่ plugin ใหม่ไม่ควรใช้มัน

## การ resolve target ของแชนเนล

channel plugin ควรเป็นเจ้าของ semantics ของ target ที่เฉพาะแชนเนล ให้คง
outbound host แบบ shared เป็น generic และใช้พื้นผิว messaging adapter สำหรับกฎของ provider:

- `messaging.inferTargetChatType({ to })` ตัดสินว่า normalized target
  ควรถูกมองเป็น `direct`, `group` หรือ `channel` ก่อนการ lookup ใน directory
- `messaging.targetResolver.looksLikeId(raw, normalized)` บอก core ว่าอินพุตหนึ่ง
  ควรข้ามตรงไปยังการ resolve แบบ id-like แทนการค้นหาใน directory หรือไม่
- `messaging.targetResolver.resolveTarget(...)` คือ fallback ของ plugin เมื่อ
  core ต้องการ final provider-owned resolution หลังการ normalize หรือหลัง
  directory miss
- `messaging.resolveOutboundSessionRoute(...)` เป็นเจ้าของการสร้าง session route แบบเฉพาะ provider เมื่อ resolve target แล้ว

การแยกหน้าที่ที่แนะนำ:

- ใช้ `inferTargetChatType` สำหรับการตัดสินใจเรื่องหมวดหมู่ที่ควรเกิดก่อน
  การค้นหา peer/group
- ใช้ `looksLikeId` สำหรับการตรวจสอบลักษณะ “ถือว่านี่เป็น explicit/native target id”
- ใช้ `resolveTarget` สำหรับ fallback ด้าน normalization ที่เฉพาะ provider ไม่ใช่สำหรับการค้นหา directory แบบกว้าง
- เก็บ id แบบเนทีฟของ provider เช่น chat id, thread id, JID, handle และ room
  id ไว้ในค่า `target` หรือพารามิเตอร์เฉพาะ provider ไม่ใช่ใน field แบบ generic ของ SDK

## directory ที่ขับเคลื่อนด้วย config

plugin ที่อนุมานรายการ directory จาก config ควรเก็บ logic นั้นไว้ใน
plugin และนำ helper แบบ shared จาก
`openclaw/plugin-sdk/directory-runtime` มาใช้ซ้ำ

ใช้สิ่งนี้เมื่อแชนเนลต้องการ peer/group ที่ขับเคลื่อนจาก config เช่น:

- DM peer ที่ขับเคลื่อนด้วย allowlist
- แผนที่ channel/group ที่กำหนดค่าไว้
- fallback ของ static directory แบบกำหนดขอบเขตตามบัญชี

shared helper ใน `directory-runtime` จัดการเพียงงานทั่วไป:

- การกรอง query
- การใช้ limit
- helper สำหรับการกำจัดความซ้ำ/normalize
- การสร้าง `ChannelDirectoryEntry[]`

การตรวจสอบบัญชีและการ normalize id ที่เฉพาะแชนเนลควรคงอยู่ในการ implement ของ plugin

## แค็ตตาล็อกของ provider

provider plugin สามารถนิยาม model catalog สำหรับ inference ด้วย
`registerProvider({ catalog: { run(...) { ... } } })`

`catalog.run(...)` ส่งคืนรูปแบบเดียวกับที่ OpenClaw เขียนลงใน
`models.providers`:

- `{ provider }` สำหรับหนึ่ง provider entry
- `{ providers }` สำหรับหลาย provider entry

ใช้ `catalog` เมื่อ plugin เป็นเจ้าของ model id, ค่าเริ่มต้นของ base URL หรือ metadata ของโมเดลที่ gated ด้วย auth แบบเฉพาะ provider

`catalog.order` ควบคุมว่าการ merge catalog ของ plugin จะเกิดเมื่อใดเมื่อเทียบกับ provider แบบ implicit ที่มีอยู่ในตัวของ OpenClaw:

- `simple`: provider แบบ plain API-key หรือขับเคลื่อนด้วย env
- `profile`: provider ที่ปรากฏเมื่อมี auth profile
- `paired`: provider ที่สังเคราะห์ provider entry ที่เกี่ยวข้องกันหลายตัว
- `late`: ผ่านสุดท้าย หลัง provider แบบ implicit อื่น

provider ที่มากว่าจะชนะเมื่อ key ชนกัน ดังนั้น plugin จึงสามารถตั้งใจแทนที่ built-in provider entry ที่มี provider id เดียวกันได้

ความเข้ากันได้:

- `discovery` ยังคงทำงานเป็น alias แบบ legacy
- หากลงทะเบียนทั้ง `catalog` และ `discovery` OpenClaw จะใช้ `catalog`

## การตรวจสอบแชนเนลแบบอ่านอย่างเดียว

หาก plugin ของคุณลงทะเบียนแชนเนล ให้พิจารณา implement
`plugin.config.inspectAccount(cfg, accountId)` ควบคู่กับ `resolveAccount(...)`

เหตุผล:

- `resolveAccount(...)` คือเส้นทาง runtime มันสามารถสมมติได้ว่า credential
  ถูก materialize อย่างสมบูรณ์แล้ว และสามารถ fail fast เมื่อ secret ที่ต้องการหายไป
- เส้นทางคำสั่งแบบอ่านอย่างเดียว เช่น `openclaw status`, `openclaw status --all`,
  `openclaw channels status`, `openclaw channels resolve` และโฟลว์ doctor/config
  repair ไม่ควรต้อง materialize runtime credential เพียงเพื่ออธิบายการกำหนดค่า

พฤติกรรม `inspectAccount(...)` ที่แนะนำ:

- ส่งคืนเฉพาะสถานะบัญชีเชิงพรรณนา
- คง `enabled` และ `configured`
- รวมฟิลด์แหล่งที่มา/สถานะของ credential เมื่อเกี่ยวข้อง เช่น:
  - `tokenSource`, `tokenStatus`
  - `botTokenSource`, `botTokenStatus`
  - `appTokenSource`, `appTokenStatus`
  - `signingSecretSource`, `signingSecretStatus`
- คุณไม่จำเป็นต้องส่งคืนค่า token ดิบ เพียงเพื่อรายงานความพร้อมใช้งานแบบอ่านอย่างเดียว การส่งคืน `tokenStatus: "available"` (พร้อม field ของแหล่งที่มาที่ตรงกัน) ก็เพียงพอสำหรับคำสั่งสไตล์ status
- ใช้ `configured_unavailable` เมื่อ credential ถูกกำหนดผ่าน SecretRef แต่ไม่พร้อมใช้งานในเส้นทางคำสั่งปัจจุบัน

วิธีนี้ทำให้คำสั่งแบบอ่านอย่างเดียวรายงานได้ว่า "configured but unavailable in this command path" แทนที่จะล่มหรือรายงานผิดว่าไม่ได้กำหนดค่าบัญชีไว้

## Package pack

ไดเรกทอรีของ plugin อาจมี `package.json` พร้อม `openclaw.extensions`:

```json
{
  "name": "my-pack",
  "openclaw": {
    "extensions": ["./src/safety.ts", "./src/tools.ts"],
    "setupEntry": "./src/setup-entry.ts"
  }
}
```

แต่ละ entry จะกลายเป็น plugin หนึ่งตัว หาก pack ระบุหลาย extension, plugin id
จะกลายเป็น `name/<fileBase>`

หาก plugin ของคุณ import npm dependency ให้ติดตั้ง dependency เหล่านั้นในไดเรกทอรีนั้น
เพื่อให้ `node_modules` พร้อมใช้งาน (`npm install` / `pnpm install`)

รั้วป้องกันด้านความปลอดภัย: ทุก entry ใน `openclaw.extensions` ต้องอยู่ภายในไดเรกทอรี plugin
หลังจาก resolve symlink แล้ว entry ที่หลุดออกนอกไดเรกทอรีแพ็กเกจจะถูก
ปฏิเสธ

หมายเหตุด้านความปลอดภัย: `openclaw plugins install` ติดตั้ง dependency ของ plugin ด้วย
`npm install --omit=dev --ignore-scripts` (ไม่มี lifecycle script และไม่มี dev dependency ใน runtime) ควรรักษาต้นไม้ dependency ของ plugin ให้เป็น
"pure JS/TS" และหลีกเลี่ยงแพ็กเกจที่ต้องใช้ `postinstall` build

แบบไม่บังคับ: `openclaw.setupEntry` สามารถชี้ไปยังโมดูลที่เบาและมีไว้สำหรับ setup เท่านั้น
เมื่อ OpenClaw ต้องการพื้นผิวด้าน setup สำหรับ channel plugin ที่ถูกปิดใช้ หรือ
เมื่อเปิดใช้ channel plugin แล้วแต่ยังไม่ได้กำหนดค่า มันจะโหลด `setupEntry`
แทน full plugin entry วิธีนี้ช่วยให้การเริ่มต้นและการ setup เบาลง
เมื่อ main plugin entry ของคุณยังต้อง wire tools, hooks หรือโค้ด runtime-only อื่น

แบบไม่บังคับ: `openclaw.startup.deferConfiguredChannelFullLoadUntilAfterListen`
สามารถทำให้ channel plugin เลือกใช้เส้นทาง `setupEntry` เดียวกันระหว่างช่วง
pre-listen startup ของ gateway ได้ แม้แชนเนลนั้นจะถูกกำหนดค่าไว้แล้วก็ตาม

ใช้สิ่งนี้เฉพาะเมื่อ `setupEntry` ครอบคลุมพื้นผิวการเริ่มต้นทั้งหมดที่จำเป็นต้องมี
ก่อน gateway จะเริ่ม listen กล่าวในทางปฏิบัติคือ setup entry
ต้องลงทะเบียนทุก capability ที่แชนเนลเป็นเจ้าของซึ่งการเริ่มต้นพึ่งพาอยู่ เช่น:

- การลงทะเบียนแชนเนลเอง
- HTTP route ใด ๆ ที่ต้องพร้อมใช้งานก่อน gateway จะเริ่ม listen
- gateway method, tool หรือ service ใด ๆ ที่ต้องมีอยู่ในช่วงเวลาเดียวกันนั้น

หาก full entry ของคุณยังเป็นเจ้าของ capability ใดที่จำเป็นในช่วงเริ่มต้น อย่าเปิดใช้
แฟล็กนี้ ให้คงพฤติกรรมเริ่มต้นไว้ และให้ OpenClaw โหลด
full entry ระหว่าง startup

bundled channel ยังสามารถเผยแพร่ helper ด้าน contract-surface ที่ใช้เฉพาะ setup ซึ่ง core
สามารถ consult ได้ก่อน full channel runtime จะถูกโหลด พื้นผิว setup
promotion ปัจจุบันคือ:

- `singleAccountKeysToMove`
- `namedAccountPromotionKeys`
- `resolveSingleAccountPromotionTarget(...)`

core ใช้พื้นผิวนี้เมื่อต้องโปรโมต config ของ legacy single-account channel
ให้เป็น `channels.<id>.accounts.*` โดยไม่ต้องโหลด full plugin entry
Matrix คือตัวอย่าง bundled ในปัจจุบัน: มันย้ายเฉพาะคีย์ด้าน auth/bootstrap ไปยัง
บัญชีที่ถูกโปรโมตแบบมีชื่อเมื่อมี named account อยู่แล้ว และสามารถรักษา
คีย์ default-account แบบไม่ canonical ที่กำหนดค่าไว้ แทนที่จะสร้าง
`accounts.default` เสมอ

setup patch adapter เหล่านั้นช่วยให้การค้นหา contract-surface ของ bundled ยังคง lazy
เวลา import ยังคงเบา; พื้นผิว promotion จะถูกโหลดเมื่อใช้ครั้งแรกแทนการกลับเข้าไป
เริ่ม startup ของ bundled channel ใหม่ตอน import โมดูล

เมื่อพื้นผิวตอนเริ่มต้นเหล่านั้นมี gateway RPC method อยู่ด้วย ให้คงมันไว้บน
prefix ที่เฉพาะกับ plugin namespace แอดมินของ core (`config.*`,
`exec.approvals.*`, `wizard.*`, `update.*`) ยังคงสงวนไว้ และ resolve
ไปที่ `operator.admin` เสมอ แม้ plugin จะร้องขอ scope ที่แคบกว่าก็ตาม

ตัวอย่าง:

```json
{
  "name": "@scope/my-channel",
  "openclaw": {
    "extensions": ["./index.ts"],
    "setupEntry": "./setup-entry.ts",
    "startup": {
      "deferConfiguredChannelFullLoadUntilAfterListen": true
    }
  }
}
```

### metadata ของ channel catalog

channel plugin สามารถโฆษณา metadata สำหรับ setup/discovery ผ่าน `openclaw.channel` และ
hint สำหรับการติดตั้งผ่าน `openclaw.install` ได้ วิธีนี้ทำให้ core ไม่ต้องเก็บข้อมูลของ catalog

ตัวอย่าง:

```json
{
  "name": "@openclaw/nextcloud-talk",
  "openclaw": {
    "extensions": ["./index.ts"],
    "channel": {
      "id": "nextcloud-talk",
      "label": "Nextcloud Talk",
      "selectionLabel": "Nextcloud Talk (self-hosted)",
      "docsPath": "/channels/nextcloud-talk",
      "docsLabel": "nextcloud-talk",
      "blurb": "Self-hosted chat via Nextcloud Talk webhook bots.",
      "order": 65,
      "aliases": ["nc-talk", "nc"]
    },
    "install": {
      "npmSpec": "@openclaw/nextcloud-talk",
      "localPath": "<bundled-plugin-local-path>",
      "defaultChoice": "npm"
    }
  }
}
```

ฟิลด์ `openclaw.channel` ที่มีประโยชน์นอกเหนือจากตัวอย่างขั้นต่ำ:

- `detailLabel`: ป้ายกำกับรองสำหรับพื้นผิว catalog/status ที่มีรายละเอียดมากขึ้น
- `docsLabel`: แทนที่ข้อความลิงก์สำหรับลิงก์เอกสาร
- `preferOver`: plugin/channel id ที่มีลำดับความสำคัญต่ำกว่าซึ่ง entry ใน catalog นี้ควรอยู่เหนือกว่า
- `selectionDocsPrefix`, `selectionDocsOmitLabel`, `selectionExtras`: ตัวควบคุมข้อความสำหรับพื้นผิวการเลือก
- `markdownCapable`: ทำเครื่องหมายว่าแชนเนลรองรับ markdown สำหรับการตัดสินใจเรื่องการจัดรูปแบบขาออก
- `exposure.configured`: ซ่อนแชนเนลจากพื้นผิวรายการ configured-channel เมื่อกำหนดเป็น `false`
- `exposure.setup`: ซ่อนแชนเนลจาก picker สำหรับ interactive setup/configure เมื่อกำหนดเป็น `false`
- `exposure.docs`: ทำเครื่องหมายแชนเนลว่าเป็นภายใน/ส่วนตัวสำหรับพื้นผิวนำทางเอกสาร
- `showConfigured` / `showInSetup`: alias แบบเดิมที่ยังยอมรับเพื่อความเข้ากันได้; ควรใช้ `exposure`
- `quickstartAllowFrom`: เลือกให้แชนเนลใช้โฟลว์ quickstart `allowFrom` มาตรฐาน
- `forceAccountBinding`: บังคับให้ bind บัญชีอย่างชัดเจนแม้มีเพียงบัญชีเดียว
- `preferSessionLookupForAnnounceTarget`: ให้ความสำคัญกับ session lookup เมื่อ resolve announce target

OpenClaw ยังสามารถ merge **external channel catalog** ได้ด้วย (เช่น export
จาก MPM registry) ให้วางไฟล์ JSON ไว้ที่หนึ่งในตำแหน่งต่อไปนี้:

- `~/.openclaw/mpm/plugins.json`
- `~/.openclaw/mpm/catalog.json`
- `~/.openclaw/plugins/catalog.json`

หรือชี้ `OPENCLAW_PLUGIN_CATALOG_PATHS` (หรือ `OPENCLAW_MPM_CATALOG_PATHS`) ไปที่
ไฟล์ JSON หนึ่งไฟล์หรือมากกว่า (คั่นด้วย comma/semicolon/`PATH`) แต่ละไฟล์
ควรมีรูปแบบ `{ "entries": [ { "name": "@scope/pkg", "openclaw": { "channel": {...}, "install": {...} } } ] }` parser ยังยอมรับ `"packages"` หรือ `"plugins"` เป็น alias แบบเดิมของคีย์ `"entries"` ด้วย

## Context engine plugin

context engine plugin เป็นเจ้าของ orchestration ของ session context สำหรับ ingest, assembly
และ Compaction ให้ลงทะเบียนจาก plugin ของคุณด้วย
`api.registerContextEngine(id, factory)` แล้วเลือกเอนจินที่ใช้งานอยู่ด้วย
`plugins.slots.contextEngine`

ใช้สิ่งนี้เมื่อ plugin ของคุณต้องการแทนที่หรือขยาย pipeline ของ context
เริ่มต้น แทนที่จะเพียงเพิ่ม memory search หรือ hook

```ts
import { buildMemorySystemPromptAddition } from "openclaw/plugin-sdk/core";

export default function (api) {
  api.registerContextEngine("lossless-claw", () => ({
    info: { id: "lossless-claw", name: "Lossless Claw", ownsCompaction: true },
    async ingest() {
      return { ingested: true };
    },
    async assemble({ messages, availableTools, citationsMode }) {
      return {
        messages,
        estimatedTokens: 0,
        systemPromptAddition: buildMemorySystemPromptAddition({
          availableTools: availableTools ?? new Set(),
          citationsMode,
        }),
      };
    },
    async compact() {
      return { ok: true, compacted: false };
    },
  }));
}
```

หากเอนจินของคุณ **ไม่ได้** เป็นเจ้าของอัลกอริทึมของ Compaction ให้คง `compact()`
ไว้และมอบหมายอย่างชัดเจน:

```ts
import {
  buildMemorySystemPromptAddition,
  delegateCompactionToRuntime,
} from "openclaw/plugin-sdk/core";

export default function (api) {
  api.registerContextEngine("my-memory-engine", () => ({
    info: {
      id: "my-memory-engine",
      name: "My Memory Engine",
      ownsCompaction: false,
    },
    async ingest() {
      return { ingested: true };
    },
    async assemble({ messages, availableTools, citationsMode }) {
      return {
        messages,
        estimatedTokens: 0,
        systemPromptAddition: buildMemorySystemPromptAddition({
          availableTools: availableTools ?? new Set(),
          citationsMode,
        }),
      };
    },
    async compact(params) {
      return await delegateCompactionToRuntime(params);
    },
  }));
}
```

## การเพิ่ม capability ใหม่

เมื่อ plugin ต้องการพฤติกรรมที่ไม่เข้ากับ API ปัจจุบัน อย่าข้าม
ระบบ plugin ด้วยการเจาะเข้าถึงแบบ private ให้เพิ่ม capability ที่ขาดอยู่แทน

ลำดับที่แนะนำ:

1. นิยามสัญญาของ core
   ตัดสินใจว่าพฤติกรรมใดที่ core ควรเป็นเจ้าของร่วมกัน: policy, fallback, config merge,
   lifecycle, semantics ที่หันหน้าไปยังแชนเนล และรูปร่างของ runtime helper
2. เพิ่มพื้นผิวสำหรับ plugin registration/runtime แบบมี type
   ขยาย `OpenClawPluginApi` และ/หรือ `api.runtime` ด้วยพื้นผิว capability แบบมี type
   ที่เล็กที่สุดแต่มีประโยชน์
3. wire ผู้ใช้ใน core + channel/feature
   แชนเนลและ feature plugin ควรใช้ capability ใหม่ผ่าน core
   ไม่ใช่โดยการ import implementation ของ vendor โดยตรง
4. ลงทะเบียน implementation ของ vendor
   จากนั้น vendor plugin จะลงทะเบียน backend ของตนกับ capability นี้
5. เพิ่ม contract coverage
   เพิ่มการทดสอบเพื่อให้ความเป็นเจ้าของและรูปร่างการลงทะเบียนยังชัดเจนเมื่อเวลาผ่านไป

นี่คือวิธีที่ OpenClaw คงความมีจุดยืนโดยไม่ถูกฮาร์ดโค้ดให้ติดกับ
มุมมองของผู้ให้บริการเพียงรายเดียว ดู [Capability Cookbook](/th/plugins/architecture)
สำหรับเช็กลิสต์ไฟล์แบบเป็นรูปธรรมและตัวอย่างที่ทำเสร็จแล้ว

### เช็กลิสต์ของ capability

เมื่อคุณเพิ่ม capability ใหม่ implementation โดยทั่วไปควรแตะพื้นผิวเหล่านี้ร่วมกัน:

- type ของ core contract ใน `src/<capability>/types.ts`
- core runner/runtime helper ใน `src/<capability>/runtime.ts`
- พื้นผิว plugin API registration ใน `src/plugins/types.ts`
- plugin registry wiring ใน `src/plugins/registry.ts`
- การเปิดเผย plugin runtime ใน `src/plugins/runtime/*` เมื่อ feature/channel
  plugin ต้อง consume มัน
- capture/test helper ใน `src/test-utils/plugin-registration.ts`
- assertion ด้าน ownership/contract ใน `src/plugins/contracts/registry.ts`
- เอกสารสำหรับ operator/plugin ใน `docs/`

หากพื้นผิวใดขาดหายไป มักเป็นสัญญาณว่า capability นั้นยังไม่ถูกรวมเข้าอย่างสมบูรณ์

### แม่แบบของ capability

รูปแบบขั้นต่ำ:

```ts
// core contract
export type VideoGenerationProviderPlugin = {
  id: string;
  label: string;
  generateVideo: (req: VideoGenerationRequest) => Promise<VideoGenerationResult>;
};

// plugin API
api.registerVideoGenerationProvider({
  id: "openai",
  label: "OpenAI",
  async generateVideo(req) {
    return await generateOpenAiVideo(req);
  },
});

// shared runtime helper for feature/channel plugins
const clip = await api.runtime.videoGeneration.generate({
  prompt: "Show the robot walking through the lab.",
  cfg,
});
```

รูปแบบของ contract test:

```ts
expect(findVideoGenerationProviderIdsForPlugin("openai")).toEqual(["openai"]);
```

กฎจึงยังคงเรียบง่าย:

- core เป็นเจ้าของ capability contract + orchestration
- vendor plugin เป็นเจ้าของ implementation ของ vendor
- feature/channel plugin ใช้ runtime helper
- contract test ทำให้ความเป็นเจ้าของชัดเจนเสมอ
