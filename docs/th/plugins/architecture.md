---
read_when:
    - การสร้างหรือดีบัก plugin เนทีฟของ OpenClaw
    - การทำความเข้าใจโมเดลความสามารถของ plugin หรือขอบเขตความเป็นเจ้าของ
    - การทำงานกับไปป์ไลน์การโหลดหรือรีจิสทรีของ plugin
    - การใช้งานฮุกของรันไทม์ผู้ให้บริการหรือ plugin ของช่องทาง
sidebarTitle: Internals
summary: 'ภายในของ Plugin: โมเดลความสามารถ ความเป็นเจ้าของ สัญญาไปป์ไลน์การโหลด และตัวช่วยรันไทม์'
title: ภายในของ Plugin
x-i18n:
    generated_at: "2026-04-24T09:22:46Z"
    model: gpt-5.4
    provider: openai
    source_hash: d05891966669e599b1aa0165f20f913bfa82c22436356177436fba5d1be31e7b
    source_path: plugins/architecture.md
    workflow: 15
---

นี่คือ**เอกสารอ้างอิงสถาปัตยกรรมเชิงลึก**สำหรับระบบ plugin ของ OpenClaw สำหรับ
คู่มือเชิงปฏิบัติ ให้เริ่มจากหนึ่งในหน้าที่เจาะจงด้านล่างนี้

<CardGroup cols={2}>
  <Card title="ติดตั้งและใช้งาน plugin" icon="plug" href="/th/tools/plugin">
    คู่มือสำหรับผู้ใช้ปลายทางในการเพิ่ม เปิดใช้งาน และแก้ไขปัญหา plugin
  </Card>
  <Card title="การสร้าง plugin" icon="rocket" href="/th/plugins/building-plugins">
    บทแนะนำ plugin แรกพร้อม manifest ที่ใช้งานได้ขนาดเล็กที่สุด
  </Card>
  <Card title="plugin ของช่องทาง" icon="comments" href="/th/plugins/sdk-channel-plugins">
    สร้าง plugin ช่องทางการส่งข้อความ
  </Card>
  <Card title="plugin ของผู้ให้บริการ" icon="microchip" href="/th/plugins/sdk-provider-plugins">
    สร้าง plugin ผู้ให้บริการโมเดล
  </Card>
  <Card title="ภาพรวม SDK" icon="book" href="/th/plugins/sdk-overview">
    แผนที่การนำเข้าและเอกสารอ้างอิง API การลงทะเบียน
  </Card>
</CardGroup>

## โมเดลความสามารถสาธารณะ

ความสามารถคือโมเดล **native plugin** แบบสาธารณะภายใน OpenClaw ทุก
native OpenClaw plugin จะลงทะเบียนกับประเภทความสามารถอย่างน้อยหนึ่งประเภท:

| ความสามารถ           | วิธีการลงทะเบียน                                 | ตัวอย่าง plugin                     |
| -------------------- | ------------------------------------------------- | ----------------------------------- |
| การอนุมานข้อความ     | `api.registerProvider(...)`                       | `openai`, `anthropic`               |
| แบ็กเอนด์การอนุมาน CLI | `api.registerCliBackend(...)`                     | `openai`, `anthropic`               |
| เสียงพูด             | `api.registerSpeechProvider(...)`                 | `elevenlabs`, `microsoft`           |
| การถอดเสียงแบบเรียลไทม์ | `api.registerRealtimeTranscriptionProvider(...)` | `openai`                            |
| เสียงแบบเรียลไทม์    | `api.registerRealtimeVoiceProvider(...)`          | `openai`                            |
| การทำความเข้าใจสื่อ   | `api.registerMediaUnderstandingProvider(...)`     | `openai`, `google`                  |
| การสร้างภาพ          | `api.registerImageGenerationProvider(...)`        | `openai`, `google`, `fal`, `minimax` |
| การสร้างเพลง         | `api.registerMusicGenerationProvider(...)`        | `google`, `minimax`                 |
| การสร้างวิดีโอ       | `api.registerVideoGenerationProvider(...)`        | `qwen`                              |
| การดึงข้อมูลเว็บ     | `api.registerWebFetchProvider(...)`               | `firecrawl`                         |
| การค้นหาเว็บ         | `api.registerWebSearchProvider(...)`              | `google`                            |
| ช่องทาง / การส่งข้อความ | `api.registerChannel(...)`                      | `msteams`, `matrix`                 |
| การค้นพบ Gateway     | `api.registerGatewayDiscoveryService(...)`        | `bonjour`                           |

plugin ที่ลงทะเบียนความสามารถเป็นศูนย์ แต่มี hooks, tools, บริการการค้นพบ
หรือบริการเบื้องหลัง จะถือเป็น plugin แบบ **legacy hook-only** รูปแบบนั้น
ยังคงรองรับอย่างสมบูรณ์

### จุดยืนด้านความเข้ากันได้ภายนอก

โมเดลความสามารถได้รวมอยู่ใน core แล้ว และมีการใช้งานโดย bundled/native plugins
ในปัจจุบัน แต่ความเข้ากันได้ของ plugin ภายนอกยังต้องมีเกณฑ์ที่เข้มงวดกว่าการบอกว่า
“มีการ export ดังนั้นจึงถือว่าคงที่”

| สถานการณ์ของ plugin                            | แนวทาง                                                                                           |
| ---------------------------------------------- | ------------------------------------------------------------------------------------------------- |
| plugin ภายนอกที่มีอยู่แล้ว                    | รักษาให้การเชื่อมต่อแบบอิง hook ยังคงทำงานได้ นี่คือฐานของความเข้ากันได้                         |
| bundled/native plugins ใหม่                    | ให้ใช้การลงทะเบียนความสามารถแบบชัดเจน แทนการเข้าถึงเฉพาะผู้ให้บริการหรือการออกแบบ hook-only ใหม่ |
| plugin ภายนอกที่นำการลงทะเบียนความสามารถมาใช้ | ทำได้ แต่ให้ถือว่าพื้นผิวตัวช่วยเฉพาะความสามารถยังอาจเปลี่ยนแปลงได้ เว้นแต่เอกสารจะระบุว่าคงที่     |

การลงทะเบียนความสามารถคือทิศทางที่ตั้งใจไว้ Legacy hooks ยังคงเป็นเส้นทางที่ปลอดภัยที่สุด
เพื่อไม่ให้ plugin ภายนอกเกิดการแตกหักระหว่างช่วงเปลี่ยนผ่าน เส้นทางย่อยของ helper ที่ export
ออกมาไม่ได้มีสถานะเท่ากันทั้งหมด — ให้เลือกใช้สัญญาที่แคบและมีเอกสารรองรับ
แทนการใช้ helper exports ที่เกิดขึ้นโดยบังเอิญ

### รูปแบบของ plugin

OpenClaw จัดประเภท plugin ที่โหลดแต่ละตัวเป็นรูปแบบหนึ่งตามพฤติกรรมการลงทะเบียนจริง
(ไม่ใช่แค่ metadata แบบสถิต):

- **plain-capability**: ลงทะเบียนความสามารถเพียงประเภทเดียว (ตัวอย่างเช่น
  plugin แบบ provider-only เช่น `mistral`)
- **hybrid-capability**: ลงทะเบียนหลายประเภทความสามารถ (ตัวอย่างเช่น
  `openai` ดูแลการอนุมานข้อความ เสียงพูด การทำความเข้าใจสื่อ และการสร้างภาพ)
- **hook-only**: ลงทะเบียนเฉพาะ hooks (แบบมีชนิดหรือแบบกำหนดเอง) ไม่มี
  capabilities, tools, commands หรือ services
- **non-capability**: ลงทะเบียน tools, commands, services หรือ routes แต่ไม่มี
  capabilities

ใช้ `openclaw plugins inspect <id>` เพื่อดูรูปแบบและรายละเอียดความสามารถของ plugin
ดูรายละเอียดได้ที่ [เอกสารอ้างอิง CLI](/th/cli/plugins#inspect)

### Legacy hooks

hook `before_agent_start` ยังคงรองรับในฐานะเส้นทางความเข้ากันได้สำหรับ
plugin แบบ hook-only plugin จริงในปัจจุบันยังคงพึ่งพาสิ่งนี้

ทิศทาง:

- รักษาให้ยังทำงานได้
- ระบุในเอกสารว่าเป็น legacy
- สำหรับงาน override โมเดล/ผู้ให้บริการ ให้ใช้ `before_model_resolve`
- สำหรับงานเปลี่ยนแปลง prompt ให้ใช้ `before_prompt_build`
- ค่อยนำออกเมื่อการใช้งานจริงลดลง และความครอบคลุมของ fixture พิสูจน์ความปลอดภัยของการย้ายได้แล้วเท่านั้น

### สัญญาณด้านความเข้ากันได้

เมื่อคุณรัน `openclaw doctor` หรือ `openclaw plugins inspect <id>` คุณอาจเห็น
หนึ่งในป้ายกำกับเหล่านี้:

| สัญญาณ                    | ความหมาย                                                     |
| ------------------------- | ------------------------------------------------------------ |
| **config valid**          | Config แยกวิเคราะห์ได้ถูกต้องและ plugins ถูก resolve ได้     |
| **compatibility advisory** | Plugin ใช้รูปแบบที่ยังรองรับแต่เก่ากว่า (เช่น `hook-only`) |
| **legacy warning**        | Plugin ใช้ `before_agent_start` ซึ่งเลิกใช้แล้ว              |
| **hard error**            | Config ไม่ถูกต้อง หรือ plugin โหลดไม่สำเร็จ                  |

ทั้ง `hook-only` และ `before_agent_start` จะไม่ทำให้ plugin ของคุณใช้งานไม่ได้ในวันนี้:
`hook-only` เป็นเพียงคำแนะนำ และ `before_agent_start` จะก่อให้เกิดเพียงคำเตือนเท่านั้น
สัญญาณเหล่านี้จะแสดงใน `openclaw status --all` และ `openclaw plugins doctor` ด้วย

## ภาพรวมสถาปัตยกรรม

ระบบ plugin ของ OpenClaw มีสี่ชั้น:

1. **Manifest + การค้นพบ**
   OpenClaw ค้นหา plugin ผู้สมัครจากเส้นทางที่กำหนด รากของ workspace
   ราก plugin ส่วนกลาง และ bundled plugins การค้นพบจะอ่าน
   manifests ของ `openclaw.plugin.json` แบบ native รวมถึง bundle manifests
   ที่รองรับก่อน
2. **การเปิดใช้งาน + การตรวจสอบความถูกต้อง**
   Core ตัดสินว่า plugin ที่ค้นพบแล้วตัวใดเปิดใช้งาน ปิดใช้งาน ถูกบล็อก หรือ
   ถูกเลือกสำหรับสล็อตแบบเอกสิทธิ์ เช่น memory
3. **การโหลดรันไทม์**
   native OpenClaw plugins จะถูกโหลดในโปรเซสผ่าน jiti และลงทะเบียน
   capabilities เข้าสู่รีจิสทรีส่วนกลาง bundles ที่เข้ากันได้จะถูกทำให้เป็นมาตรฐานเป็น
   ระเบียนในรีจิสทรีโดยไม่ต้องนำเข้าโค้ดรันไทม์
4. **การใช้งานพื้นผิว**
   ส่วนอื่นของ OpenClaw จะอ่านรีจิสทรีเพื่อแสดง tools, channels, การตั้งค่า provider,
   hooks, HTTP routes, CLI commands และ services

สำหรับ plugin CLI โดยเฉพาะ การค้นพบคำสั่งรากถูกแยกเป็นสองระยะ:

- metadata ระยะ parse มาจาก `registerCli(..., { descriptors: [...] })`
- โมดูล CLI ของ plugin จริงสามารถคงความ lazy และลงทะเบียนเมื่อมีการเรียกใช้ครั้งแรกได้

สิ่งนี้ทำให้โค้ด CLI ที่เป็นของ plugin ยังคงอยู่ภายใน plugin ขณะเดียวกันก็ยังให้ OpenClaw
สามารถจองชื่อคำสั่งรากไว้ก่อนการ parse

ขอบเขตการออกแบบที่สำคัญ:

- การค้นพบ + การตรวจสอบ config ควรทำงานได้จาก **manifest/schema metadata**
  โดยไม่ต้องรันโค้ดของ plugin
- พฤติกรรม runtime แบบ native มาจากเส้นทาง `register(api)` ของโมดูล plugin

การแยกนี้ทำให้ OpenClaw สามารถตรวจสอบ config อธิบาย plugin ที่หายไป/ถูกปิดใช้งาน และ
สร้างคำใบ้สำหรับ UI/schema ได้ก่อนที่ runtime เต็มรูปแบบจะเริ่มทำงาน

### การวางแผนการเปิดใช้งาน

การวางแผนการเปิดใช้งานเป็นส่วนหนึ่งของ control plane ผู้เรียกสามารถถามได้ว่า plugin ใด
เกี่ยวข้องกับคำสั่ง ผู้ให้บริการ ช่องทาง route ชุดทดสอบ agent หรือความสามารถ
ที่เจาะจง ก่อนที่จะโหลดรีจิสทรีรันไทม์ในวงกว้าง

ตัววางแผนยังคงรักษาพฤติกรรม manifest ปัจจุบันให้เข้ากันได้:

- ฟิลด์ `activation.*` คือคำใบ้ของตัววางแผนแบบชัดเจน
- `providers`, `channels`, `commandAliases`, `setup.providers`,
  `contracts.tools` และ hooks ยังคงเป็นทาง fallback ของ ownership ใน manifest
- planner API แบบ ids-only ยังคงมีให้สำหรับผู้เรียกเดิม
- plan API รายงานป้ายกำกับเหตุผล เพื่อให้การวินิจฉัยแยกความแตกต่างระหว่าง
  คำใบ้แบบชัดเจนกับ ownership fallback ได้

อย่าถือว่า `activation` เป็น lifecycle hook หรือเป็นตัวแทนของ
`register(...)` มันคือ metadata ที่ใช้เพื่อลดขอบเขตการโหลด ให้เลือกใช้ฟิลด์ ownership
เมื่อฟิลด์เหล่านั้นอธิบายความสัมพันธ์ได้อยู่แล้ว และใช้ `activation`
เฉพาะเมื่อจำเป็นต้องมีคำใบ้เพิ่มเติมสำหรับตัววางแผนเท่านั้น

### plugin ของช่องทางและเครื่องมือข้อความแบบใช้ร่วมกัน

plugin ของช่องทางไม่จำเป็นต้องลงทะเบียนเครื่องมือส่ง/แก้ไข/ตอบสนองแยกต่างหาก
สำหรับการดำเนินการแชตทั่วไป OpenClaw คงไว้ซึ่งเครื่องมือ `message`
แบบใช้ร่วมกันหนึ่งตัวใน core และ plugin ของช่องทางจะดูแลการค้นพบและการทำงาน
เฉพาะช่องทางที่อยู่เบื้องหลังมัน

ขอบเขตปัจจุบันคือ:

- core เป็นเจ้าของโฮสต์ของเครื่องมือ `message` แบบใช้ร่วมกัน การเชื่อมต่อ prompt
  การเก็บสถานะ session/thread และการส่งต่อการทำงาน
- plugin ของช่องทางเป็นเจ้าของการค้นพบการกระทำแบบมีขอบเขต การค้นพบความสามารถ
  และส่วน schema เพิ่มเติมที่เฉพาะช่องทาง
- plugin ของช่องทางเป็นเจ้าของไวยากรณ์การสนทนา session ที่ตั้งชื่อตามผู้ให้บริการ เช่น
  วิธีที่ conversation ids เข้ารหัส thread ids หรือสืบทอดจากการสนทนาหลัก
- plugin ของช่องทางดำเนินการขั้นสุดท้ายผ่าน action adapter ของตน

สำหรับ plugin ของช่องทาง พื้นผิว SDK คือ
`ChannelMessageActionAdapter.describeMessageTool(...)` การเรียกค้นพบแบบรวมนี้
ทำให้ plugin สามารถส่งคืน actions, capabilities และส่วนเพิ่มเติมของ schema
ที่มองเห็นได้พร้อมกัน เพื่อไม่ให้ส่วนเหล่านี้คลาดเคลื่อนกัน

เมื่อพารามิเตอร์ของ message-tool ที่เฉพาะช่องทางมีแหล่งสื่อ เช่น
พาธในเครื่องหรือ URL สื่อระยะไกล plugin ควรส่งคืน
`mediaSourceParams` จาก `describeMessageTool(...)` ด้วย Core ใช้
รายการแบบชัดเจนนี้เพื่อใช้การทำให้พาธ sandbox เป็นมาตรฐานและคำใบ้การเข้าถึงสื่อขาออก
โดยไม่ต้องฮาร์ดโค้ดชื่อพารามิเตอร์ที่เป็นของ plugin
ควรใช้แผนที่แบบมีขอบเขตตาม action ที่นั่น ไม่ใช่รายการแบนเดียวทั้งช่องทาง เพื่อไม่ให้
พารามิเตอร์สื่อที่ใช้เฉพาะโปรไฟล์ถูกทำให้เป็นมาตรฐานกับ actions อื่นที่ไม่เกี่ยวข้อง เช่น
`send`

Core ส่งขอบเขตรันไทม์เข้าไปในขั้นตอนการค้นพบนั้น ฟิลด์สำคัญประกอบด้วย:

- `accountId`
- `currentChannelId`
- `currentThreadTs`
- `currentMessageId`
- `sessionKey`
- `sessionId`
- `agentId`
- `requesterSenderId` ขาเข้าที่เชื่อถือได้

สิ่งนี้สำคัญสำหรับ plugin ที่ไวต่อบริบท ช่องทางหนึ่งสามารถซ่อนหรือแสดง
message actions ตามบัญชีที่ใช้งาน ห้อง/เธรด/ข้อความปัจจุบัน หรือ
ตัวตนของผู้ร้องขอที่เชื่อถือได้ โดยไม่ต้องฮาร์ดโค้ดเงื่อนไขเฉพาะช่องทางลงในเครื่องมือ `message`
ของ core

นี่คือเหตุผลที่การเปลี่ยนแปลงการกำหนดเส้นทางของ embedded-runner ยังคงเป็นงานของ plugin:
runner มีหน้าที่ส่งต่อข้อมูลระบุตัวตนของแชต/session ปัจจุบันเข้าไปยังขอบเขตการค้นพบของ plugin
เพื่อให้เครื่องมือ `message` แบบใช้ร่วมกันแสดงพื้นผิวที่เป็นของช่องทางได้อย่างถูกต้อง
สำหรับเทิร์นปัจจุบัน

สำหรับ execution helpers ที่เป็นของช่องทาง bundled plugins ควรเก็บ runtime การทำงาน
ไว้ภายในโมดูลส่วนขยายของตนเอง Core ไม่ได้เป็นเจ้าของ runtime การทำงานของ message-action
สำหรับ Discord, Slack, Telegram หรือ WhatsApp ภายใต้ `src/agents/tools` อีกต่อไป
เราไม่ได้เผยแพร่เส้นทางย่อย `plugin-sdk/*-action-runtime` แยกต่างหาก และ bundled
plugins ควรนำเข้าโค้ด runtime ภายในของตนโดยตรงจากโมดูลที่เป็นของส่วนขยายเอง

ขอบเขตเดียวกันนี้ใช้กับ SDK seams ที่ตั้งชื่อตามผู้ให้บริการโดยทั่วไป: core ไม่ควรนำเข้า
convenience barrels ที่เฉพาะช่องทางสำหรับ Slack, Discord, Signal,
WhatsApp หรือส่วนขยายลักษณะเดียวกัน หาก core ต้องการพฤติกรรมใด ให้ใช้
barrel `api.ts` / `runtime-api.ts` ของ bundled plugin นั้นเอง หรือยกระดับความต้องการนั้น
ให้เป็นความสามารถทั่วไปที่แคบภายใน SDK ที่ใช้ร่วมกัน

สำหรับโพลโดยเฉพาะ มีเส้นทางการทำงานอยู่สองแบบ:

- `outbound.sendPoll` คือพื้นฐานแบบใช้ร่วมกันสำหรับช่องทางที่สอดคล้องกับ
  โมเดลโพลทั่วไป
- `actions.handleAction("poll")` คือเส้นทางที่แนะนำสำหรับความหมายของโพลที่เฉพาะช่องทาง
  หรือพารามิเตอร์โพลเพิ่มเติม

ขณะนี้ Core จะเลื่อนการแยกวิเคราะห์โพลแบบใช้ร่วมกันออกไปจนกว่าการส่งต่อโพลของ plugin
จะปฏิเสธการดำเนินการนั้น เพื่อให้ตัวจัดการโพลที่เป็นของ plugin สามารถรับฟิลด์โพลที่เฉพาะช่องทางได้
โดยไม่ถูกบล็อกด้วยตัวแยกวิเคราะห์โพลทั่วไปก่อน

ดู [รายละเอียดภายในสถาปัตยกรรม Plugin](/th/plugins/architecture-internals) สำหรับลำดับการเริ่มต้นทำงานทั้งหมด

## โมเดลความเป็นเจ้าของของความสามารถ

OpenClaw ถือว่า native plugin เป็นขอบเขตความเป็นเจ้าของสำหรับ **บริษัท** หรือ
**ฟีเจอร์** ไม่ใช่เป็นถุงรวมการเชื่อมต่อที่ไม่เกี่ยวข้องกัน

ซึ่งหมายความว่า:

- plugin ของบริษัทโดยทั่วไปควรเป็นเจ้าของพื้นผิวทั้งหมดของบริษัทนั้นที่ติดต่อกับ OpenClaw
- plugin ของฟีเจอร์โดยทั่วไปควรเป็นเจ้าของพื้นผิวทั้งหมดของฟีเจอร์ที่มันนำเข้ามา
- channels ควรใช้ความสามารถร่วมจาก core แทนการนำพฤติกรรมของ provider
  มาเขียนใหม่เฉพาะกิจ

<Accordion title="ตัวอย่างรูปแบบความเป็นเจ้าของใน bundled plugins">
  - **ผู้ให้บริการหลายความสามารถ**: `openai` เป็นเจ้าของการอนุมานข้อความ เสียงพูด realtime
    voice การทำความเข้าใจสื่อ และการสร้างภาพ `google` เป็นเจ้าของการอนุมานข้อความ
    รวมถึงการทำความเข้าใจสื่อ การสร้างภาพ และการค้นหาเว็บ
    `qwen` เป็นเจ้าของการอนุมานข้อความ รวมถึงการทำความเข้าใจสื่อและการสร้างวิดีโอ
  - **ผู้ให้บริการความสามารถเดียว**: `elevenlabs` และ `microsoft` เป็นเจ้าของเสียงพูด
    `firecrawl` เป็นเจ้าของ web-fetch `minimax` / `mistral` / `moonshot` / `zai` เป็นเจ้าของ
    แบ็กเอนด์ media-understanding
  - **plugin ฟีเจอร์**: `voice-call` เป็นเจ้าของการขนส่งการโทร tools, CLI, routes,
    และการเชื่อมต่อ Twilio media-stream แต่ใช้ความสามารถร่วมด้าน speech, realtime
    transcription และ realtime voice แทนการนำเข้า plugin ของผู้ให้บริการโดยตรง
</Accordion>

สภาพปลายทางที่ตั้งใจไว้คือ:

- OpenAI อยู่ใน plugin เดียว แม้ว่าจะครอบคลุมโมเดลข้อความ เสียงพูด ภาพ และ
  วิดีโอในอนาคต
- ผู้ให้บริการอีกรายก็สามารถทำแบบเดียวกันกับพื้นผิวของตนเองได้
- channels ไม่สนใจว่า plugin ผู้ให้บริการตัวใดเป็นเจ้าของ provider นั้น แต่จะใช้
  capability contract แบบใช้ร่วมกันที่ core เปิดเผย

นี่คือความแตกต่างสำคัญ:

- **plugin** = ขอบเขตความเป็นเจ้าของ
- **capability** = สัญญาใน core ที่หลาย plugin สามารถนำไปใช้งานหรือใช้งานร่วมได้

ดังนั้นหาก OpenClaw เพิ่มโดเมนใหม่ เช่น วิดีโอ คำถามแรกไม่ควรเป็น
“provider ใดควรฮาร์ดโค้ดการจัดการวิดีโอ?” คำถามแรกควรเป็น “capability contract
หลักสำหรับวิดีโอคืออะไร?” เมื่อมีสัญญานั้นแล้ว vendor plugins ก็สามารถลงทะเบียนกับมันได้
และ channel/feature plugins ก็สามารถใช้งานมันได้

หากยังไม่มี capability นั้น การดำเนินการที่ถูกต้องโดยทั่วไปคือ:

1. กำหนด capability ที่ขาดหายไว้ใน core
2. เปิดเผย capability นั้นผ่าน plugin API/runtime แบบมีชนิด
3. เชื่อม channels/features ให้ทำงานกับ capability นั้น
4. ให้ vendor plugins ลงทะเบียน implementation

วิธีนี้ทำให้ความเป็นเจ้าของชัดเจน พร้อมหลีกเลี่ยงพฤติกรรมใน core ที่พึ่งพา
ผู้ให้บริการเพียงรายเดียวหรือเส้นทางโค้ดเฉพาะ plugin แบบครั้งเดียว

### การจัดชั้นของความสามารถ

ใช้แบบจำลองทางความคิดนี้เมื่อตัดสินใจว่าโค้ดควรอยู่ที่ใด:

- **ชั้น capability ของ core**: การ orchestration ร่วมกัน นโยบาย fallback กฎการรวม config
  semantics ของการส่งมอบ และสัญญาแบบมีชนิด
- **ชั้น vendor plugin**: API เฉพาะผู้ให้บริการ การยืนยันตัวตน แค็ตตาล็อกโมเดล speech
  synthesis การสร้างภาพ แบ็กเอนด์วิดีโอในอนาคต และ endpoints การใช้งาน
- **ชั้น channel/feature plugin**: การเชื่อมต่อ Slack/Discord/voice-call/ฯลฯ
  ที่ใช้ความสามารถของ core และนำไปแสดงบนพื้นผิว

ตัวอย่างเช่น TTS ใช้รูปแบบนี้:

- core เป็นเจ้าของนโยบาย TTS ตอนตอบกลับ ลำดับ fallback ค่ากำหนด และการส่งมอบใน channel
- `openai`, `elevenlabs` และ `microsoft` เป็นเจ้าของ implementation การสังเคราะห์เสียง
- `voice-call` ใช้ตัวช่วยรันไทม์ TTS สำหรับโทรศัพท์

ควรเลือกใช้รูปแบบเดียวกันนี้กับความสามารถในอนาคต

### ตัวอย่าง plugin ของบริษัทแบบหลายความสามารถ

plugin ของบริษัทควรให้ความรู้สึกเป็นเนื้อเดียวกันเมื่อมองจากภายนอก หาก OpenClaw มี
สัญญาแบบใช้ร่วมกันสำหรับ models, speech, realtime transcription, realtime voice, media
understanding, image generation, video generation, web fetch และ web search
ผู้ให้บริการรายหนึ่งสามารถเป็นเจ้าของพื้นผิวทั้งหมดของตนในที่เดียวได้:

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

สิ่งสำคัญไม่ใช่ชื่อตัวช่วยที่แน่นอน แต่เป็นรูปแบบ:

- plugin เดียวเป็นเจ้าของพื้นผิวของผู้ให้บริการ
- core ยังคงเป็นเจ้าของ capability contracts
- channel และ feature plugins ใช้ตัวช่วย `api.runtime.*` ไม่ใช่โค้ดของผู้ให้บริการ
- contract tests สามารถยืนยันได้ว่า plugin ได้ลงทะเบียนความสามารถที่มัน
  อ้างว่าเป็นเจ้าของจริง

### ตัวอย่างความสามารถ: การทำความเข้าใจวิดีโอ

OpenClaw ปฏิบัติต่อการทำความเข้าใจภาพ/เสียง/วิดีโอเป็น
ความสามารถร่วมเดียวอยู่แล้ว โมเดลความเป็นเจ้าของเดียวกันนี้ใช้ได้เช่นกัน:

1. core กำหนดสัญญา media-understanding
2. vendor plugins ลงทะเบียน `describeImage`, `transcribeAudio` และ
   `describeVideo` ตามความเหมาะสม
3. channel และ feature plugins ใช้พฤติกรรมร่วมของ core แทนการเชื่อมต่อกับโค้ดของผู้ให้บริการโดยตรง

วิธีนี้หลีกเลี่ยงการฝังสมมติฐานวิดีโอของผู้ให้บริการรายใดรายหนึ่งไว้ใน core plugin เป็นเจ้าของ
พื้นผิวของผู้ให้บริการ ส่วน core เป็นเจ้าของ capability contract และพฤติกรรม fallback

การสร้างวิดีโอใช้ลำดับเดียวกันนี้อยู่แล้ว: core เป็นเจ้าของ
capability contract แบบมีชนิดและตัวช่วยรันไทม์ และ vendor plugins จะลงทะเบียน
implementation ของ `api.registerVideoGenerationProvider(...)` กับ capability นั้น

ต้องการเช็กลิสต์การเปิดใช้งานที่เป็นรูปธรรมหรือไม่ ดู
[คู่มือ Capability](/th/plugins/architecture)

## สัญญาและการบังคับใช้

พื้นผิว API ของ plugin ถูกกำหนดชนิดอย่างตั้งใจและรวมศูนย์ไว้ใน
`OpenClawPluginApi` สัญญานั้นกำหนดจุดลงทะเบียนที่รองรับและ
ตัวช่วยรันไทม์ที่ plugin สามารถพึ่งพาได้

เหตุผลที่สำคัญ:

- ผู้เขียน plugin ได้มาตรฐานภายในที่เสถียรเพียงหนึ่งเดียว
- core สามารถปฏิเสธความเป็นเจ้าของที่ซ้ำกัน เช่น สอง plugin ลงทะเบียน
  provider id เดียวกัน
- ระหว่างเริ่มต้นระบบสามารถแสดงการวินิจฉัยที่นำไปแก้ไขได้สำหรับการลงทะเบียนที่ผิดรูปแบบ
- contract tests สามารถบังคับใช้ความเป็นเจ้าของของ bundled-plugin และป้องกันการเบี่ยงเบนแบบเงียบ

มีการบังคับใช้อยู่สองชั้น:

1. **การบังคับใช้การลงทะเบียนขณะรันไทม์**
   รีจิสทรี plugin จะตรวจสอบการลงทะเบียนระหว่างที่ plugins ถูกโหลด ตัวอย่าง:
   provider ids ซ้ำกัน speech provider ids ซ้ำกัน และการลงทะเบียนที่ผิดรูปแบบ
   จะสร้างการวินิจฉัยของ plugin แทนที่จะก่อให้เกิดพฤติกรรมที่ไม่กำหนด
2. **contract tests**
   bundled plugins จะถูกจับไว้ใน contract registries ระหว่างการรันทดสอบ เพื่อให้
   OpenClaw สามารถยืนยันความเป็นเจ้าของได้อย่างชัดเจน ปัจจุบันใช้กับ model
   providers, speech providers, web search providers และ bundled registration
   ownership

ผลในทางปฏิบัติคือ OpenClaw รู้ล่วงหน้าว่า plugin ใดเป็นเจ้าของพื้นผิวใด
สิ่งนี้ทำให้ core และ channels ประกอบเข้าด้วยกันได้อย่างราบรื่น เพราะความเป็นเจ้าของถูกประกาศ
มีชนิด และตรวจสอบได้ แทนที่จะเป็นนัยโดยปริยาย

### สิ่งที่ควรอยู่ในสัญญา

สัญญา plugin ที่ดีควรมีลักษณะดังนี้:

- มีชนิด
- ขนาดเล็ก
- เฉพาะความสามารถ
- เป็นเจ้าของโดย core
- ใช้ซ้ำได้โดยหลาย plugin
- channels/features ใช้งานได้โดยไม่ต้องรู้รายละเอียดของผู้ให้บริการ

สัญญา plugin ที่ไม่ดีมีลักษณะดังนี้:

- นโยบายเฉพาะผู้ให้บริการที่ซ่อนอยู่ใน core
- ช่องทางหลบเลี่ยงเฉพาะ plugin แบบครั้งเดียวที่ข้ามรีจิสทรี
- โค้ด channel เข้าถึง implementation ของผู้ให้บริการโดยตรง
- อ็อบเจ็กต์รันไทม์เฉพาะกิจที่ไม่ได้เป็นส่วนหนึ่งของ `OpenClawPluginApi` หรือ
  `api.runtime`

หากไม่แน่ใจ ให้ยกระดับนามธรรมขึ้นก่อน: กำหนด capability ก่อน แล้วค่อยให้ plugins
เชื่อมต่อเข้ากับมัน

## โมเดลการทำงาน

native OpenClaw plugins ทำงาน **ในโปรเซสเดียวกัน** กับ Gateway พวกมันไม่ได้ถูก
sandboxed native plugin ที่ถูกโหลดแล้วมีขอบเขตความเชื่อถือระดับโปรเซสเดียวกับโค้ด core

ผลที่ตามมา:

- native plugin สามารถลงทะเบียน tools, network handlers, hooks และ services ได้
- ข้อบกพร่องใน native plugin อาจทำให้ gateway ล่มหรือไม่เสถียร
- native plugin ที่เป็นอันตรายเทียบเท่ากับการรันโค้ดโดยพลการภายในโปรเซสของ OpenClaw

โดยค่าเริ่มต้น compatible bundles ปลอดภัยกว่า เพราะปัจจุบัน OpenClaw ปฏิบัติต่อสิ่งเหล่านี้
เป็น metadata/content packs ในรีลีสปัจจุบัน โดยมากหมายถึง bundled
skills

สำหรับ plugins ที่ไม่ได้ bundled ให้ใช้ allowlists และเส้นทางติดตั้ง/โหลดแบบชัดเจน
ให้ถือว่า workspace plugins เป็นโค้ดสำหรับช่วงพัฒนา ไม่ใช่ค่าเริ่มต้นสำหรับ production

สำหรับชื่อแพ็กเกจ workspace แบบ bundled ให้ยึด plugin id กับชื่อ npm:
`@openclaw/<id>` เป็นค่าเริ่มต้น หรือใช้ส่วนต่อท้ายแบบมีชนิดที่ได้รับอนุมัติ เช่น
`-provider`, `-plugin`, `-speech`, `-sandbox` หรือ `-media-understanding` เมื่อ
แพ็กเกจนั้นตั้งใจเปิดเผยบทบาท plugin ที่แคบกว่า

หมายเหตุสำคัญด้านความเชื่อถือ:

- `plugins.allow` ไว้วางใจ **plugin ids** ไม่ใช่แหล่งที่มาของซอร์ส
- workspace plugin ที่มี id เดียวกับ bundled plugin จะบัง bundled copy
  โดยตั้งใจ เมื่อ workspace plugin นั้นถูกเปิดใช้งาน/อยู่ใน allowlist
- สิ่งนี้เป็นเรื่องปกติและมีประโยชน์สำหรับการพัฒนาในเครื่อง การทดสอบแพตช์ และ hotfixes
- ความเชื่อถือของ bundled-plugin จะถูกตัดสินจาก snapshot ของซอร์ส — manifest และ
  โค้ดบนดิสก์ ณ เวลาโหลด — ไม่ใช่จาก metadata ตอนติดตั้ง ระเบียนการติดตั้งที่เสียหาย
  หรือถูกแทนที่ ไม่สามารถขยายพื้นผิวความเชื่อถือของ bundled plugin แบบเงียบ ๆ
  ให้เกินกว่าสิ่งที่ซอร์สจริงอ้างไว้ได้

## ขอบเขตการ export

OpenClaw export ความสามารถ ไม่ใช่ความสะดวกของ implementation

ให้คงการลงทะเบียนความสามารถเป็นแบบสาธารณะ และตัด helper exports ที่ไม่ใช่สัญญาออก:

- เส้นทางย่อยของ helper ที่เฉพาะ bundled-plugin
- เส้นทางย่อยของ plumbing รันไทม์ที่ไม่ได้ตั้งใจให้เป็น API สาธารณะ
- convenience helpers ที่เฉพาะผู้ให้บริการ
- helpers สำหรับ setup/onboarding ที่เป็นรายละเอียดของ implementation

เส้นทางย่อยของ helper บางรายการของ bundled-plugin ยังคงอยู่ใน generated SDK export
map เพื่อความเข้ากันได้และการดูแล bundled-plugin ตัวอย่างปัจจุบัน ได้แก่
`plugin-sdk/feishu`, `plugin-sdk/feishu-setup`, `plugin-sdk/zalo`,
`plugin-sdk/zalo-setup` และ seams แบบ `plugin-sdk/matrix*` อีกหลายรายการ ให้ถือว่าสิ่งเหล่านี้
เป็น exports รายละเอียด implementation ที่สงวนไว้ ไม่ใช่รูปแบบ SDK ที่แนะนำสำหรับ
third-party plugins ใหม่

## รายละเอียดภายในและข้อมูลอ้างอิง

สำหรับไปป์ไลน์การโหลด โมเดลรีจิสทรี provider runtime hooks, Gateway HTTP
routes, schemas ของ message tool, การ resolve เป้าหมายของ channel, provider catalogs,
plugins ของ context engine และคู่มือการเพิ่ม capability ใหม่ โปรดดู
[รายละเอียดภายในสถาปัตยกรรม Plugin](/th/plugins/architecture-internals)

## ที่เกี่ยวข้อง

- [การสร้าง plugin](/th/plugins/building-plugins)
- [การตั้งค่า Plugin SDK](/th/plugins/sdk-setup)
- [Plugin manifest](/th/plugins/manifest)
