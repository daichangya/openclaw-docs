---
read_when:
    - การอธิบายว่าข้อความขาเข้ากลายเป็นคำตอบได้อย่างไร
    - การอธิบายให้ชัดเจนเกี่ยวกับ sessions, โหมดการเข้าคิว หรือลักษณะการสตรีม
    - การจัดทำเอกสารเกี่ยวกับการมองเห็น reasoning และผลกระทบด้านการใช้งาน
summary: ลำดับการไหลของข้อความ, sessions, การเข้าคิว และการมองเห็น reasoning
title: ข้อความ
x-i18n:
    generated_at: "2026-04-24T09:06:36Z"
    model: gpt-5.4
    provider: openai
    source_hash: 22a154246f47b5841dc9d4b9f8e3c5698e5e56bc0b2dbafe19fec45799dbbba9
    source_path: concepts/messages.md
    workflow: 15
---

หน้านี้เชื่อมโยงภาพรวมการทำงานของ OpenClaw ในส่วนการจัดการข้อความขาเข้า, sessions, การเข้าคิว,
การสตรีม และการมองเห็น reasoning

## ลำดับการไหลของข้อความ (ระดับสูง)

```text
Inbound message
  -> routing/bindings -> session key
  -> queue (if a run is active)
  -> agent run (streaming + tools)
  -> outbound replies (channel limits + chunking)
```

ตัวควบคุมหลักอยู่ใน configuration:

- `messages.*` สำหรับ prefixes, การเข้าคิว และลักษณะการทำงานของกลุ่ม
- `agents.defaults.*` สำหรับค่าเริ่มต้นของ block streaming และ chunking
- channel overrides (`channels.whatsapp.*`, `channels.telegram.*` เป็นต้น) สำหรับขีดจำกัดและตัวสลับการสตรีม

ดู [การกำหนดค่า](/th/gateway/configuration) สำหรับ schema แบบเต็ม

## การตัดข้อความขาเข้าที่ซ้ำกัน

ช่องทางต่าง ๆ อาจส่งข้อความเดิมซ้ำอีกครั้งหลังจาก reconnect OpenClaw เก็บ
แคชระยะสั้นที่อิงกับ channel/account/peer/session/message id เพื่อไม่ให้
การส่งซ้ำทริกเกอร์การรันของเอเจนต์อีกครั้ง

## การหน่วงรวมข้อความขาเข้า

ข้อความที่เข้ามาต่อเนื่องอย่างรวดเร็วจาก **ผู้ส่งคนเดียวกัน** สามารถถูกรวมเป็นเทิร์นเดียวของ
เอเจนต์ได้ผ่าน `messages.inbound` การหน่วงรวมนี้มีขอบเขตต่อ channel + conversation
และจะใช้ข้อความล่าสุดสำหรับ reply threading/IDs

Config (ค่าเริ่มต้นแบบ global + overrides รายช่องทาง):

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

- การหน่วงรวมใช้กับข้อความ **text-only**; สื่อ/ไฟล์แนบจะถูก flush ทันที
- คำสั่งควบคุมจะข้ามการหน่วงรวมเพื่อให้ยังคงเป็นข้อความเดี่ยว — **ยกเว้น** เมื่อช่องทางเลือกใช้อย่างชัดเจนให้รวม DM จากผู้ส่งคนเดียวกันได้ (เช่น [BlueBubbles `coalesceSameSenderDms`](/th/channels/bluebubbles#coalescing-split-send-dms-command--url-in-one-composition)) ซึ่งทำให้คำสั่งใน DM รออยู่ในหน้าต่าง debounce เพื่อให้ payload ที่ส่งแยกกันสามารถรวมอยู่ใน agent turn เดียวกันได้

## Sessions และอุปกรณ์

Sessions เป็นของ gateway ไม่ใช่ของไคลเอนต์

- แชตโดยตรงจะถูกรวมเข้ากับ session key หลักของเอเจนต์
- กลุ่ม/ช่องจะมี session keys ของตัวเอง
- session store และ transcripts จะอยู่บนโฮสต์ gateway

หลายอุปกรณ์/ช่องทางสามารถแมปไปยัง session เดียวกันได้ แต่ประวัติจะไม่ได้
ซิงก์กลับอย่างสมบูรณ์ไปยังทุกไคลเอนต์ คำแนะนำคือ: ใช้อุปกรณ์หลักเพียงเครื่องเดียวสำหรับ
บทสนทนายาว ๆ เพื่อหลีกเลี่ยง context ที่แยกกัน Control UI และ TUI จะแสดง
session transcript ที่อิงกับ gateway เสมอ ดังนั้นจึงเป็นแหล่งความจริง

รายละเอียด: [การจัดการ Session](/th/concepts/session)

## เนื้อหาขาเข้าและ context ของประวัติ

OpenClaw แยก **prompt body** ออกจาก **command body**:

- `Body`: ข้อความพรอมป์ต์ที่ส่งไปยังเอเจนต์ ซึ่งอาจรวม channel envelopes และ
  history wrappers แบบไม่บังคับ
- `CommandBody`: ข้อความดิบของผู้ใช้สำหรับการแยก directives/commands
- `RawBody`: alias แบบเดิมของ `CommandBody` (คงไว้เพื่อความเข้ากันได้)

เมื่อช่องทางส่งประวัติมา ระบบจะใช้ wrapper ที่ใช้ร่วมกัน:

- `[Chat messages since your last reply - for context]`
- `[Current message - respond to this]`

สำหรับ **แชตที่ไม่ใช่แชตโดยตรง** (groups/channels/rooms) **เนื้อหาของข้อความปัจจุบัน** จะถูกเติมคำนำหน้าด้วย
ป้ายชื่อผู้ส่ง (สไตล์เดียวกับที่ใช้ในรายการประวัติ) เพื่อให้ข้อความแบบเรียลไทม์และข้อความในคิว/ประวัติ
มีความสอดคล้องกันในพรอมป์ต์ของเอเจนต์

บัฟเฟอร์ประวัติเป็นแบบ **pending-only**: รวมข้อความในกลุ่มที่ _ไม่ได้_
ทริกเกอร์การรัน (เช่น ข้อความที่ถูกควบคุมด้วย mention) และ **ไม่รวม** ข้อความ
ที่อยู่ใน session transcript แล้ว

การตัด directives จะใช้กับส่วน **ข้อความปัจจุบัน** เท่านั้น เพื่อให้ประวัติยังคงครบถ้วน
ช่องทางที่ครอบประวัติไว้ควรตั้ง `CommandBody` (หรือ
`RawBody`) เป็นข้อความเดิมของข้อความ และคง `Body` ไว้เป็นพรอมป์ต์ที่รวมกันแล้ว
บัฟเฟอร์ประวัติกำหนดค่าได้ผ่าน `messages.groupChat.historyLimit` (ค่าเริ่มต้น
แบบ global) และ overrides รายช่องทาง เช่น `channels.slack.historyLimit` หรือ
`channels.telegram.accounts.<id>.historyLimit` (ตั้งเป็น `0` เพื่อปิดใช้งาน)

## การเข้าคิวและ followups

หากมีการรันที่กำลังทำงานอยู่แล้ว ข้อความขาเข้าสามารถถูกเข้าคิว ส่งไปยัง
การรันปัจจุบัน หรือถูกรวบรวมไว้สำหรับเทิร์น followup

- กำหนดค่าผ่าน `messages.queue` (และ `messages.queue.byChannel`)
- โหมด: `interrupt`, `steer`, `followup`, `collect` รวมถึง backlog variants

รายละเอียด: [การเข้าคิว](/th/concepts/queue)

## การสตรีม, การแบ่งชิ้น และการรวมเป็นชุด

block streaming จะส่งคำตอบบางส่วนขณะที่โมเดลสร้าง text blocks ออกมา
chunking จะเคารพขีดจำกัดข้อความของช่องทางและหลีกเลี่ยงการแยก fenced code

การตั้งค่าหลัก:

- `agents.defaults.blockStreamingDefault` (`on|off`, ค่าเริ่มต้นปิด)
- `agents.defaults.blockStreamingBreak` (`text_end|message_end`)
- `agents.defaults.blockStreamingChunk` (`minChars|maxChars|breakPreference`)
- `agents.defaults.blockStreamingCoalesce` (การรวมเป็นชุดตาม idle)
- `agents.defaults.humanDelay` (ช่วงหยุดแบบมนุษย์ระหว่าง block replies)
- channel overrides: `*.blockStreaming` และ `*.blockStreamingCoalesce` (ช่องทางที่ไม่ใช่ Telegram ต้องระบุ `*.blockStreaming: true` อย่างชัดเจน)

รายละเอียด: [Streaming + chunking](/th/concepts/streaming)

## การมองเห็น reasoning และโทเค็น

OpenClaw สามารถแสดงหรือซ่อน reasoning ของโมเดลได้:

- `/reasoning on|off|stream` ใช้ควบคุมการมองเห็น
- เนื้อหา reasoning ยังคงนับรวมการใช้โทเค็นเมื่อโมเดลสร้างขึ้น
- Telegram รองรับการสตรีม reasoning ลงใน draft bubble

รายละเอียด: [Thinking + reasoning directives](/th/tools/thinking) และ [การใช้โทเค็น](/th/reference/token-use)

## Prefixes, threading และ replies

การจัดรูปแบบข้อความขาออกถูกรวมศูนย์ไว้ใน `messages`:

- `messages.responsePrefix`, `channels.<channel>.responsePrefix` และ `channels.<channel>.accounts.<id>.responsePrefix` (ลำดับการตกทอดของ outbound prefix) รวมถึง `channels.whatsapp.messagePrefix` (inbound prefix ของ WhatsApp)
- reply threading ผ่าน `replyToMode` และค่าเริ่มต้นรายช่องทาง

รายละเอียด: [การกำหนดค่า](/th/gateway/config-agents#messages) และเอกสารของแต่ละช่องทาง

## การตอบกลับแบบเงียบ

โทเค็นแบบเงียบที่ตรงตัว `NO_REPLY` / `no_reply` หมายถึง “อย่าส่งคำตอบที่ผู้ใช้มองเห็นได้”
OpenClaw จะ resolve ลักษณะการทำงานนี้ตามประเภทของบทสนทนา:

- บทสนทนาแบบ direct ไม่อนุญาตความเงียบตามค่าเริ่มต้น และจะเขียนทับ silent
  reply แบบล้วนให้เป็นข้อความ fallback แบบสั้นที่มองเห็นได้
- กลุ่ม/ช่อง อนุญาตความเงียบตามค่าเริ่มต้น
- orchestration ภายใน อนุญาตความเงียบตามค่าเริ่มต้น

ค่าเริ่มต้นอยู่ใต้ `agents.defaults.silentReply` และ
`agents.defaults.silentReplyRewrite`; `surfaces.<id>.silentReply` และ
`surfaces.<id>.silentReplyRewrite` สามารถ override ได้ราย surface

เมื่อ session หลักมี spawned subagent runs ที่ยังค้างอยู่อย่างน้อยหนึ่งรายการ
silent replies แบบล้วนจะถูกทิ้งบนทุก surface แทนการถูกเขียนทับ
เพื่อให้ parent เงียบอยู่จนกว่าเหตุการณ์การเสร็จสิ้นของ child จะส่งคำตอบจริงกลับมา

## ที่เกี่ยวข้อง

- [Streaming](/th/concepts/streaming) — การส่งข้อความแบบเรียลไทม์
- [Retry](/th/concepts/retry) — ลักษณะการ retry การส่งข้อความ
- [Queue](/th/concepts/queue) — คิวการประมวลผลข้อความ
- [Channels](/th/channels) — การเชื่อมต่อแพลตฟอร์มรับส่งข้อความ
