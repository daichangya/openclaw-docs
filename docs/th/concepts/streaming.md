---
read_when:
    - การอธิบายว่าการสตรีมหรือการแบ่งชิ้นทำงานอย่างไรบนช่องทางต่าง ๆ
    - การเปลี่ยนลักษณะการทำงานของ block streaming หรือ channel chunking
    - การดีบักการตอบกลับแบบบล็อกที่ซ้ำกัน/เร็วเกินไป หรือการสตรีมตัวอย่างของช่องทาง
summary: ลักษณะการทำงานของการสตรีม + การแบ่งชิ้น (การตอบกลับแบบบล็อก, การสตรีมตัวอย่างในช่องทาง, การแมปโหมด)
title: การสตรีมและการแบ่งชิ้น
x-i18n:
    generated_at: "2026-04-24T09:08:01Z"
    model: gpt-5.4
    provider: openai
    source_hash: 48d0391644e410d08f81cc2fb2d02a4aeb836ab04f37ea34a6c94bec9bc16b07
    source_path: concepts/streaming.md
    workflow: 15
---

# การสตรีม + การแบ่งชิ้น

OpenClaw มีชั้นการสตรีมแยกกัน 2 ชั้น:

- **Block streaming (ช่องทาง):** ส่ง **บล็อก** ที่เสร็จสมบูรณ์แล้วออกไปขณะที่ assistant กำลังเขียน สิ่งเหล่านี้เป็นข้อความช่องทางปกติ (ไม่ใช่ token deltas)
- **Preview streaming (Telegram/Discord/Slack):** อัปเดต **ข้อความตัวอย่าง** ชั่วคราวระหว่างการสร้าง

ปัจจุบันยัง **ไม่มีการสตรีมแบบ token-delta จริง** ไปยังข้อความของช่องทาง Preview streaming เป็นแบบอิงข้อความ (ส่ง + แก้ไข/ต่อท้าย)

## Block streaming (ข้อความของช่องทาง)

Block streaming จะส่งเอาต์พุตของ assistant ออกเป็นชิ้นแบบหยาบเมื่อพร้อมใช้งาน

```text
Model output
  └─ text_delta/events
       ├─ (blockStreamingBreak=text_end)
       │    └─ chunker emits blocks as buffer grows
       └─ (blockStreamingBreak=message_end)
            └─ chunker flushes at message_end
                   └─ channel send (block replies)
```

คำอธิบาย:

- `text_delta/events`: model stream events (อาจมีไม่ถี่สำหรับโมเดลที่ไม่สตรีม)
- `chunker`: `EmbeddedBlockChunker` ที่ใช้ min/max bounds + break preference
- `channel send`: ข้อความขาออกจริง (block replies)

**ตัวควบคุม:**

- `agents.defaults.blockStreamingDefault`: `"on"`/`"off"` (ค่าเริ่มต้นปิด)
- Channel overrides: `*.blockStreaming` (และตัวแปรรายบัญชี) เพื่อบังคับ `"on"`/`"off"` รายช่องทาง
- `agents.defaults.blockStreamingBreak`: `"text_end"` หรือ `"message_end"`
- `agents.defaults.blockStreamingChunk`: `{ minChars, maxChars, breakPreference? }`
- `agents.defaults.blockStreamingCoalesce`: `{ minChars?, maxChars?, idleMs? }` (รวมบล็อกที่สตรีมก่อนส่ง)
- เพดานตายตัวของช่องทาง: `*.textChunkLimit` (เช่น `channels.whatsapp.textChunkLimit`)
- โหมดการแบ่งชิ้นของช่องทาง: `*.chunkMode` (`length` เป็นค่าเริ่มต้น, `newline` จะแบ่งตามบรรทัดว่าง (ขอบเขตย่อหน้า) ก่อนแบ่งตามความยาว)
- เพดานแบบนุ่มของ Discord: `channels.discord.maxLinesPerMessage` (ค่าเริ่มต้น 17) จะแบ่งคำตอบที่ยาวเป็นแนวตั้งเพื่อหลีกเลี่ยงการถูกตัดใน UI

**ความหมายของขอบเขต:**

- `text_end`: สตรีมบล็อกทันทีที่ chunker สร้างออกมา; flush ทุกครั้งที่ `text_end`
- `message_end`: รอจนข้อความของ assistant จบก่อน แล้วจึง flush เอาต์พุตที่บัฟเฟอร์ไว้

`message_end` ยังคงใช้ chunker หากข้อความในบัฟเฟอร์เกิน `maxChars` ดังนั้นอาจส่งออกหลายชิ้นตอนจบได้

## อัลกอริทึมการแบ่งชิ้น (ขอบล่าง/ขอบบน)

การแบ่งชิ้นของ block ถูกทำโดย `EmbeddedBlockChunker`:

- **ขอบล่าง:** จะยังไม่ส่งออกจนกว่าบัฟเฟอร์จะมีขนาด >= `minChars` (เว้นแต่จะถูกบังคับ)
- **ขอบบน:** พยายามแบ่งก่อนถึง `maxChars`; หากถูกบังคับ จะแบ่งที่ `maxChars`
- **ลำดับความสำคัญของจุดแบ่ง:** `paragraph` → `newline` → `sentence` → `whitespace` → hard break
- **Code fences:** จะไม่แบ่งภายใน fences; หากจำเป็นต้องแบ่งที่ `maxChars`, ระบบจะปิดแล้วเปิด fence ใหม่เพื่อให้ Markdown ยังถูกต้อง

`maxChars` จะถูก clamp ให้ไม่เกิน `textChunkLimit` ของช่องทาง ดังนั้นคุณจะไม่สามารถเกินเพดานรายช่องทางได้

## Coalescing (รวมบล็อกที่สตรีม)

เมื่อเปิดใช้ block streaming, OpenClaw สามารถ **รวม block chunks ที่ต่อเนื่องกัน**
ก่อนส่งออกได้ ซึ่งช่วยลด “สแปมบรรทัดเดียว” ขณะยังคงให้
เอาต์พุตแบบค่อยเป็นค่อยไป

- Coalescing จะรอ **ช่วงว่าง** (`idleMs`) ก่อน flush
- บัฟเฟอร์จะถูกจำกัดด้วย `maxChars` และจะ flush หากเกินค่านั้น
- `minChars` ป้องกันไม่ให้ส่งชิ้นเล็กมากจนกว่าจะมีข้อความสะสมมากพอ
  (final flush จะส่งข้อความที่เหลือเสมอ)
- ตัวเชื่อมจะได้มาจาก `blockStreamingChunk.breakPreference`
  (`paragraph` → `\n\n`, `newline` → `\n`, `sentence` → เว้นวรรค)
- มี channel overrides ผ่าน `*.blockStreamingCoalesce` (รวมถึง config รายบัญชี)
- ค่าเริ่มต้นของ coalesce `minChars` จะถูกเพิ่มเป็น 1500 สำหรับ Signal/Slack/Discord เว้นแต่จะมีการ override

## การเว้นจังหวะแบบมนุษย์ระหว่างบล็อก

เมื่อเปิดใช้ block streaming คุณสามารถเพิ่ม **ช่วงหยุดแบบสุ่ม**
ระหว่าง block replies (หลังบล็อกแรก) ได้ ซึ่งช่วยให้การตอบหลายบับเบิลดู
เป็นธรรมชาติมากขึ้น

- Config: `agents.defaults.humanDelay` (override รายเอเจนต์ได้ผ่าน `agents.list[].humanDelay`)
- โหมด: `off` (ค่าเริ่มต้น), `natural` (800–2500ms), `custom` (`minMs`/`maxMs`)
- ใช้กับ **block replies** เท่านั้น ไม่ใช้กับ final replies หรือ tool summaries

## "Stream chunks or everything"

สิ่งนี้แมปได้ดังนี้:

- **Stream chunks:** `blockStreamingDefault: "on"` + `blockStreamingBreak: "text_end"` (ส่งออกระหว่างทาง) ช่องทางที่ไม่ใช่ Telegram ต้องมี `*.blockStreaming: true` ด้วย
- **Stream everything at end:** `blockStreamingBreak: "message_end"` (flush ครั้งเดียว แต่อาจหลายชิ้นหากยาวมาก)
- **No block streaming:** `blockStreamingDefault: "off"` (มีเฉพาะ final reply)

**หมายเหตุเกี่ยวกับช่องทาง:** Block streaming จะ **ปิดอยู่ เว้นแต่**
จะตั้ง `*.blockStreaming` เป็น `true` อย่างชัดเจน ช่องทางสามารถสตรีม live preview
(`channels.<channel>.streaming`) ได้โดยไม่มี block replies

ย้ำตำแหน่ง config: ค่าเริ่มต้น `blockStreaming*` อยู่ใต้
`agents.defaults` ไม่ใช่ที่ root config

## โหมดของ Preview streaming

คีย์มาตรฐาน: `channels.<channel>.streaming`

โหมด:

- `off`: ปิด preview streaming
- `partial`: ตัวอย่างเดียวที่ถูกแทนที่ด้วยข้อความล่าสุด
- `block`: อัปเดตตัวอย่างแบบแบ่งชิ้น/ต่อท้าย
- `progress`: แสดงตัวอย่างสถานะ/ความคืบหน้าระหว่างสร้าง แล้วส่งคำตอบสุดท้ายเมื่อเสร็จ

### การแมปของช่องทาง

| Channel | `off` | `partial` | `block` | `progress` |
| ---------- | ----- | --------- | ------- | ----------------- |
| Telegram | ✅ | ✅ | ✅ | แมปเป็น `partial` |
| Discord | ✅ | ✅ | ✅ | แมปเป็น `partial` |
| Slack | ✅ | ✅ | ✅ | ✅ |
| Mattermost | ✅ | ✅ | ✅ | ✅ |

เฉพาะ Slack:

- `channels.slack.streaming.nativeTransport` ใช้สลับการเรียกใช้ API สตรีมแบบเนทีฟของ Slack เมื่อ `channels.slack.streaming.mode="partial"` (ค่าเริ่มต้น: `true`)
- การสตรีมแบบเนทีฟของ Slack และสถานะเธรด assistant ของ Slack ต้องมีเป้าหมายเป็น reply thread; DM ระดับบนสุดจะไม่แสดงตัวอย่างแบบเธรด

การย้ายคีย์แบบเดิม:

- Telegram: `streamMode` + boolean `streaming` จะถูกย้ายอัตโนมัติเป็น enum `streaming`
- Discord: `streamMode` + boolean `streaming` จะถูกย้ายอัตโนมัติเป็น enum `streaming`
- Slack: `streamMode` จะถูกย้ายอัตโนมัติไปยัง `streaming.mode`; boolean `streaming` จะถูกย้ายอัตโนมัติไปยัง `streaming.mode` พร้อม `streaming.nativeTransport`; `nativeStreaming` แบบเดิมจะถูกย้ายอัตโนมัติไปยัง `streaming.nativeTransport`

### ลักษณะการทำงานขณะรันไทม์

Telegram:

- ใช้ `sendMessage` + `editMessageText` สำหรับอัปเดต preview ทั้งใน DMs และกลุ่ม/topics
- Preview streaming จะถูกข้ามเมื่อเปิดใช้ Telegram block streaming อย่างชัดเจน (เพื่อหลีกเลี่ยง double-streaming)
- `/reasoning stream` สามารถเขียน reasoning ลงใน preview ได้

Discord:

- ใช้ข้อความ preview แบบส่ง + แก้ไข
- โหมด `block` ใช้ draft chunking (`draftChunk`)
- Preview streaming จะถูกข้ามเมื่อเปิดใช้ Discord block streaming อย่างชัดเจน
- payload สุดท้ายแบบสื่อ, ข้อผิดพลาด และ explicit-reply จะยกเลิก previews ที่ค้างอยู่โดยไม่ flush draft ใหม่ แล้วจึงใช้การส่งแบบปกติ

Slack:

- `partial` สามารถใช้การสตรีมแบบเนทีฟของ Slack (`chat.startStream`/`append`/`stop`) ได้เมื่อพร้อมใช้งาน
- `block` ใช้ draft previews แบบต่อท้าย
- `progress` ใช้ข้อความตัวอย่างสถานะ แล้วจึงส่งคำตอบสุดท้าย
- payload สุดท้ายแบบสื่อ/ข้อผิดพลาด และ progress finals จะไม่สร้าง draft messages ที่ทิ้งไปเปล่า ๆ; เฉพาะ finals แบบข้อความ/บล็อกที่สามารถแก้ไข preview ได้เท่านั้นที่จะ flush ข้อความ draft ที่ค้างอยู่

Mattermost:

- สตรีม thinking, กิจกรรมของเครื่องมือ และข้อความตอบกลับบางส่วนลงใน draft preview post เดียว ซึ่งจะ finalize ในตำแหน่งเดิมเมื่อสามารถส่งคำตอบสุดท้ายได้อย่างปลอดภัย
- จะย้อนกลับไปส่ง final post ใหม่หาก preview post ถูกลบหรือไม่พร้อมใช้งานตอน finalize
- payload สุดท้ายแบบสื่อ/ข้อผิดพลาดจะยกเลิกการอัปเดต preview ที่ค้างอยู่ก่อนส่งแบบปกติ แทนที่จะ flush preview post ชั่วคราว

Matrix:

- Draft previews จะ finalize ในตำแหน่งเดิมเมื่อข้อความสุดท้ายสามารถใช้ event ของ preview ซ้ำได้
- finals แบบสื่ออย่างเดียว, ข้อผิดพลาด และ reply-target-mismatch จะยกเลิกการอัปเดต preview ที่ค้างอยู่ก่อนการส่งแบบปกติ; preview เก่าที่มองเห็นอยู่แล้วจะถูก redacted

### การอัปเดตตัวอย่างแบบ Tool-progress

Preview streaming ยังสามารถรวมการอัปเดต **tool-progress** ได้ด้วย — เป็นบรรทัดสถานะสั้น ๆ เช่น "searching the web", "reading file" หรือ "calling tool" ซึ่งจะแสดงในข้อความ preview เดียวกันขณะเครื่องมือกำลังทำงาน ก่อนถึงคำตอบสุดท้าย สิ่งนี้ช่วยให้เทิร์นเครื่องมือหลายขั้นตอนดูมีชีวิต แทนที่จะเงียบระหว่างตัวอย่างการคิดครั้งแรกกับคำตอบสุดท้าย

พื้นผิวที่รองรับ:

- **Discord**, **Slack** และ **Telegram** จะสตรีม tool-progress ลงในการแก้ไข live preview
- **Mattermost** รวมกิจกรรมของเครื่องมือไว้ใน draft preview post เดียวอยู่แล้ว (ดูด้านบน)
- การแก้ไข tool-progress จะเป็นไปตามโหมด preview streaming ที่ใช้งานอยู่; ระบบจะข้ามเมื่อ preview streaming เป็น `off` หรือเมื่อ block streaming เข้ามาควบคุมข้อความแล้ว

## ที่เกี่ยวข้อง

- [Messages](/th/concepts/messages) — วงจรชีวิตของข้อความและการส่ง
- [Retry](/th/concepts/retry) — ลักษณะการ retry เมื่อการส่งล้มเหลว
- [Channels](/th/channels) — การรองรับการสตรีมรายช่องทาง
