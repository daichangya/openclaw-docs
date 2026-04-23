---
read_when:
    - อธิบายว่าข้อความขาเข้ากลายเป็นคำตอบกลับได้อย่างไร
    - อธิบายให้ชัดเจนเกี่ยวกับเซสชัน โหมดการเข้าคิว หรือพฤติกรรมการสตรีม
    - การจัดทำเอกสารเกี่ยวกับการมองเห็นกระบวนการให้เหตุผลและผลกระทบต่อการใช้งาน
summary: โฟลว์ข้อความ เซสชัน การเข้าคิว และการมองเห็นกระบวนการให้เหตุผล
title: ข้อความ
x-i18n:
    generated_at: "2026-04-23T05:30:48Z"
    model: gpt-5.4
    provider: openai
    source_hash: d4490d87835f44f703b45b29ad69878fec552caf81f4bd07d29614f71ee15cfb
    source_path: concepts/messages.md
    workflow: 15
---

# ข้อความ

หน้านี้อธิบายภาพรวมว่า OpenClaw จัดการข้อความขาเข้า เซสชัน การเข้าคิว
การสตรีม และการมองเห็นกระบวนการให้เหตุผลอย่างไร

## โฟลว์ข้อความ (ระดับสูง)

```
Inbound message
  -> routing/bindings -> session key
  -> queue (if a run is active)
  -> agent run (streaming + tools)
  -> outbound replies (channel limits + chunking)
```

ตัวปรับสำคัญอยู่ในคอนฟิก:

- `messages.*` สำหรับ prefix, การเข้าคิว และพฤติกรรมของกลุ่ม
- `agents.defaults.*` สำหรับค่าเริ่มต้นของ block streaming และ chunking
- การ override ระดับช่องทาง (`channels.whatsapp.*`, `channels.telegram.*` ฯลฯ) สำหรับเพดานและตัวเลือกการสตรีม

ดู schema แบบเต็มได้ที่ [Configuration](/th/gateway/configuration)

## การกำจัดข้อความขาเข้าที่ซ้ำกัน

ช่องทางต่าง ๆ อาจส่งข้อความเดิมซ้ำหลัง reconnect OpenClaw จะเก็บแคชอายุสั้น
โดยอิงจาก channel/account/peer/session/message id เพื่อไม่ให้การส่งซ้ำ
ไปทริกเกอร์การรันของเอเจนต์อีกรอบ

## การหน่วงรวมข้อความขาเข้า

ข้อความที่ส่งมาติดกันอย่างรวดเร็วจาก**ผู้ส่งคนเดียวกัน**สามารถถูกรวมเป็น
turn เดียวของเอเจนต์ผ่าน `messages.inbound` ได้ การหน่วงรวมนี้มีขอบเขตตาม channel + conversation
และจะใช้ข้อความล่าสุดสำหรับการผูกเธรด/ID ของคำตอบ

คอนฟิก (ค่าเริ่มต้น global + การ override แยกตามช่องทาง):

```json5
{
  messages: {
    inbound: {
      debounceMs: 2000,
      byChannel: {
        whatsapp: 5000,
        slack: 1500,
        discord: 1500,
      },
    },
  },
}
```

หมายเหตุ:

- การหน่วงรวมมีผลกับข้อความ**ที่เป็นข้อความล้วนเท่านั้น**; สื่อ/ไฟล์แนบจะ flush ทันที
- คำสั่งควบคุมจะข้ามการหน่วงรวมเพื่อให้ยังคงแยกเป็นข้อความเดี่ยว — **ยกเว้น** เมื่อช่องทางเลือกใช้งานการรวม DM จากผู้ส่งเดียวกันอย่างชัดเจน (เช่น [BlueBubbles `coalesceSameSenderDms`](/th/channels/bluebubbles#coalescing-split-send-dms-command--url-in-one-composition)) ซึ่งในกรณีนั้นคำสั่ง DM จะรออยู่ในหน้าต่าง debounce เพื่อให้ payload ที่ส่งแยกกันสามารถรวมอยู่ใน turn เดียวของเอเจนต์ได้

## เซสชันและอุปกรณ์

เซสชันเป็นของ Gateway ไม่ใช่ของไคลเอนต์

- แชตโดยตรงจะถูกรวมเข้าที่คีย์เซสชันหลักของเอเจนต์
- กลุ่ม/ช่องจะได้คีย์เซสชันของตัวเอง
- session store และ transcript จะอยู่บนโฮสต์ของ Gateway

หลายอุปกรณ์/ช่องทางสามารถแมปไปยังเซสชันเดียวกันได้ แต่ประวัติจะไม่ถูก
ซิงก์กลับอย่างสมบูรณ์ไปยังทุกไคลเอนต์ คำแนะนำคือ: ใช้อุปกรณ์หลักเพียงเครื่องเดียว
สำหรับการสนทนายาว ๆ เพื่อหลีกเลี่ยงบริบทที่แยกกัน Control UI และ TUI จะแสดง
transcript ของเซสชันที่ Gateway รองรับอยู่เสมอ ดังนั้นจึงเป็นแหล่งข้อมูลจริง

รายละเอียด: [การจัดการเซสชัน](/th/concepts/session)

## เนื้อหาขาเข้าและบริบทของประวัติ

OpenClaw แยก **prompt body** ออกจาก **command body**:

- `Body`: ข้อความ prompt ที่ส่งให้เอเจนต์ ซึ่งอาจรวม envelope ของช่องทางและ
  wrapper ของประวัติแบบไม่บังคับ
- `CommandBody`: ข้อความดิบของผู้ใช้สำหรับการแยก directive/command
- `RawBody`: ชื่อเรียกแบบเก่าของ `CommandBody` (คงไว้เพื่อความเข้ากันได้)

เมื่อช่องทางส่งประวัติมา ระบบจะใช้ wrapper ที่ใช้ร่วมกันดังนี้:

- `[Chat messages since your last reply - for context]`
- `[Current message - respond to this]`

สำหรับ **แชตที่ไม่ใช่แชตโดยตรง** (กลุ่ม/ช่อง/ห้อง) **เนื้อหาของข้อความปัจจุบัน** จะมี prefix
เป็นป้ายชื่อผู้ส่ง (รูปแบบเดียวกับที่ใช้ในรายการประวัติ) เพื่อให้ข้อความแบบเรียลไทม์และแบบอยู่ในคิว/ประวัติ
สอดคล้องกันใน prompt ของเอเจนต์

บัฟเฟอร์ประวัติเป็นแบบ **pending-only**: จะรวมข้อความกลุ่มที่ _ไม่ได้_
ทริกเกอร์การรัน (เช่น ข้อความที่ถูกกั้นด้วย mention gating) และ **ไม่รวม** ข้อความ
ที่อยู่ใน transcript ของเซสชันแล้ว

การตัด directive จะใช้เฉพาะกับส่วน **ข้อความปัจจุบัน** เท่านั้น เพื่อให้ประวัติ
ยังคงครบถ้วน ช่องทางที่ห่อประวัติควรตั้ง `CommandBody` (หรือ
`RawBody`) เป็นข้อความต้นฉบับของข้อความ และคง `Body` เป็น prompt รวม
บัฟเฟอร์ประวัติสามารถตั้งค่าได้ผ่าน `messages.groupChat.historyLimit` (ค่าเริ่มต้น global)
และการ override แยกตามช่องทาง เช่น `channels.slack.historyLimit` หรือ
`channels.telegram.accounts.<id>.historyLimit` (ตั้ง `0` เพื่อปิดใช้งาน)

## การเข้าคิวและข้อความติดตามผล

หากมีการรันที่ active อยู่แล้ว ข้อความขาเข้าสามารถถูกเข้าคิว ชี้ทางเข้าไปในการรัน
ปัจจุบัน หรือเก็บไว้สำหรับ turn ติดตามผลได้

- ตั้งค่าผ่าน `messages.queue` (และ `messages.queue.byChannel`)
- โหมด: `interrupt`, `steer`, `followup`, `collect` รวมถึงรูปแบบที่รองรับ backlog

รายละเอียด: [Queueing](/th/concepts/queue)

## การสตรีม การแบ่งข้อความ และการจัดเป็นชุด

block streaming จะส่งคำตอบบางส่วนออกไปเมื่อโมเดลสร้างบล็อกข้อความ
chunking จะเคารพเพดานข้อความของช่องทางและหลีกเลี่ยงการแยก fenced code

การตั้งค่าหลัก:

- `agents.defaults.blockStreamingDefault` (`on|off`, ค่าเริ่มต้นปิด)
- `agents.defaults.blockStreamingBreak` (`text_end|message_end`)
- `agents.defaults.blockStreamingChunk` (`minChars|maxChars|breakPreference`)
- `agents.defaults.blockStreamingCoalesce` (การจัดเป็นชุดตามช่วง idle)
- `agents.defaults.humanDelay` (การหน่วงแบบมนุษย์ระหว่างการตอบเป็นบล็อก)
- การ override ระดับช่องทาง: `*.blockStreaming` และ `*.blockStreamingCoalesce` (ช่องทางที่ไม่ใช่ Telegram ต้องเปิด `*.blockStreaming: true` อย่างชัดเจน)

รายละเอียด: [Streaming + chunking](/th/concepts/streaming)

## การมองเห็นกระบวนการให้เหตุผลและโทเคน

OpenClaw สามารถแสดงหรือซ่อนกระบวนการให้เหตุผลของโมเดลได้:

- `/reasoning on|off|stream` ควบคุมการมองเห็น
- เนื้อหาการให้เหตุผลยังคงนับรวมในการใช้โทเคนเมื่อโมเดลสร้างขึ้น
- Telegram รองรับการสตรีม reasoning เข้าไปใน draft bubble

รายละเอียด: [Thinking + reasoning directives](/th/tools/thinking) และ [การใช้โทเคน](/th/reference/token-use)

## Prefix เธรด และการตอบกลับ

การจัดรูปแบบข้อความขาออกถูกรวมศูนย์ไว้ใน `messages`:

- `messages.responsePrefix`, `channels.<channel>.responsePrefix` และ `channels.<channel>.accounts.<id>.responsePrefix` (ลำดับการไล่ค่า prefix ของขาออก) รวมถึง `channels.whatsapp.messagePrefix` (prefix ขาเข้าของ WhatsApp)
- การผูกเธรดคำตอบผ่าน `replyToMode` และค่าเริ่มต้นแยกตามช่องทาง

รายละเอียด: [Configuration](/th/gateway/configuration-reference#messages) และเอกสารของแต่ละช่องทาง

## การไม่ตอบกลับ

โทเคนเงียบที่ตรงตัว `NO_REPLY` / `no_reply` หมายถึง “ไม่ต้องส่งคำตอบที่ผู้ใช้มองเห็นได้”
OpenClaw จะตีความพฤติกรรมนี้ตามประเภทของการสนทนา:

- การสนทนาโดยตรงไม่อนุญาตให้เงียบโดยค่าเริ่มต้น และจะเขียนคำตอบเงียบล้วนใหม่
  ให้เป็นข้อความ fallback สั้น ๆ ที่มองเห็นได้
- กลุ่ม/ช่องอนุญาตให้เงียบโดยค่าเริ่มต้น
- orchestration ภายในอนุญาตให้เงียบโดยค่าเริ่มต้น

ค่าเริ่มต้นอยู่ภายใต้ `agents.defaults.silentReply` และ
`agents.defaults.silentReplyRewrite`; โดย `surfaces.<id>.silentReply` และ
`surfaces.<id>.silentReplyRewrite` สามารถ override แยกตามแต่ละพื้นผิวการใช้งานได้

เมื่อเซสชันแม่มีการรัน subagent แบบ spawn อยู่หนึ่งรายการหรือมากกว่าที่กำลังรอดำเนินการ
คำตอบเงียบล้วนจะถูกทิ้งในทุกพื้นผิวการใช้งานแทนที่จะถูกเขียนใหม่ เพื่อให้เซสชันแม่
ยังคงเงียบจนกว่าอีเวนต์การเสร็จสิ้นของ child จะส่งคำตอบจริงมา

## ที่เกี่ยวข้อง

- [Streaming](/th/concepts/streaming) — การส่งข้อความแบบเรียลไทม์
- [Retry](/th/concepts/retry) — พฤติกรรมการลองส่งข้อความใหม่
- [Queue](/th/concepts/queue) — คิวประมวลผลข้อความ
- [Channels](/th/channels) — การเชื่อมต่อกับแพลตฟอร์มส่งข้อความ
