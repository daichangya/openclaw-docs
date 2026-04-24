---
read_when:
    - การเปลี่ยนการทำงานหรือภาวะพร้อมกันของการตอบกลับอัตโนมัติ
summary: การออกแบบคิวคำสั่งที่ทำให้การรันตอบกลับอัตโนมัติขาเข้าถูกทำแบบอนุกรม
title: คิวคำสั่ง
x-i18n:
    generated_at: "2026-04-24T09:07:10Z"
    model: gpt-5.4
    provider: openai
    source_hash: aa442e9aa2f0d6d95770d43e987d19ce8d9343450b302ee448e1fa4ab3feeb15
    source_path: concepts/queue.md
    workflow: 15
---

# คิวคำสั่ง (2026-01-16)

เราทำให้การรันตอบกลับอัตโนมัติขาเข้า (ทุกช่องทาง) เป็นแบบอนุกรมผ่านคิวในโปรเซสขนาดเล็ก เพื่อป้องกันไม่ให้การรันของเอเจนต์หลายรายการชนกัน ขณะเดียวกันก็ยังอนุญาตให้มีภาวะขนานที่ปลอดภัยระหว่าง sessions ได้

## ทำไม

- การรันตอบกลับอัตโนมัติอาจมีค่าใช้จ่ายสูง (LLM calls) และอาจชนกันเมื่อมีข้อความขาเข้าหลายรายการมาถึงใกล้เคียงกัน
- การทำแบบอนุกรมช่วยหลีกเลี่ยงการแย่งทรัพยากรที่ใช้ร่วมกัน (ไฟล์ session, logs, CLI stdin) และลดโอกาสชน rate limits ของระบบต้นทาง

## วิธีการทำงาน

- คิว FIFO ที่รับรู้ lane จะระบายแต่ละ lane ด้วยเพดานภาวะพร้อมกันที่กำหนดค่าได้ (ค่าเริ่มต้นคือ 1 สำหรับ lanes ที่ไม่ได้กำหนดค่า; main มีค่าเริ่มต้นเป็น 4, subagent เป็น 8)
- `runEmbeddedPiAgent` จะ enqueue ตาม **session key** (lane `session:<key>`) เพื่อรับประกันว่าจะมีการรันที่กำลังทำงานอยู่ได้เพียงหนึ่งรายการต่อ session
- จากนั้นการรันของแต่ละ session จะถูกนำไปเข้าคิวใน **global lane** (`main` ตามค่าเริ่มต้น) เพื่อให้ภาวะขนานโดยรวมถูกจำกัดด้วย `agents.defaults.maxConcurrent`
- เมื่อเปิดใช้ verbose logging การรันที่เข้าคิวจะส่งข้อความสั้น ๆ หากต้องรอนานกว่า ~2 วินาทีก่อนเริ่ม
- ตัวบ่งชี้การพิมพ์ยังคงทำงานทันทีเมื่อ enqueue (เมื่อช่องทางรองรับ) ดังนั้นประสบการณ์ผู้ใช้จะไม่เปลี่ยนแม้ต้องรอตามลำดับคิว

## โหมดคิว (รายช่องทาง)

ข้อความขาเข้าสามารถชี้นำการรันปัจจุบัน รอ followup turn หรือทำทั้งสองอย่างได้:

- `steer`: แทรกเข้าไปในการรันปัจจุบันทันที (ยกเลิก pending tool calls หลังจากถึง tool boundary ถัดไป) หากไม่ได้สตรีม จะย้อนกลับไปใช้ followup
- `followup`: เข้าคิวสำหรับ agent turn ถัดไปหลังจากการรันปัจจุบันสิ้นสุด
- `collect`: รวมข้อความที่เข้าคิวทั้งหมดให้เป็น **followup turn เดียว** (ค่าเริ่มต้น) หากข้อความกำหนดเป้าหมายคนละช่องทาง/เธรด จะระบายแยกกันเพื่อคงการกำหนดเส้นทางไว้
- `steer-backlog` (หรือ `steer+backlog`): steer ทันที **และ** เก็บข้อความไว้สำหรับ followup turn
- `interrupt` (แบบเดิม): ยกเลิกการรันที่กำลังทำงานของ session นั้น แล้วรันข้อความล่าสุด
- `queue` (alias แบบเดิม): เหมือนกับ `steer`

Steer-backlog หมายความว่าคุณอาจได้รับคำตอบ followup หลังจากการรันแบบ steered ดังนั้น
บนพื้นผิวที่สตรีมได้อาจดูเหมือนมีข้อความซ้ำ เลือกใช้ `collect`/`steer` หากคุณต้องการ
หนึ่งคำตอบต่อหนึ่งข้อความขาเข้า
ส่ง `/queue collect` เป็นคำสั่งเดี่ยว (ต่อ session) หรือตั้ง `messages.queue.byChannel.discord: "collect"`

ค่าเริ่มต้น (เมื่อไม่ได้ตั้งใน config):

- ทุกพื้นผิว → `collect`

กำหนดค่าแบบ global หรือรายช่องทางผ่าน `messages.queue`:

```json5
{
  messages: {
    queue: {
      mode: "collect",
      debounceMs: 1000,
      cap: 20,
      drop: "summarize",
      byChannel: { discord: "collect" },
    },
  },
}
```

## ตัวเลือกของคิว

ตัวเลือกมีผลกับ `followup`, `collect` และ `steer-backlog` (รวมถึง `steer` เมื่อย้อนกลับไปใช้ followup):

- `debounceMs`: รอให้ข้อความเงียบก่อนเริ่ม followup turn (ป้องกัน “continue, continue”)
- `cap`: จำนวนข้อความสูงสุดที่เข้าคิวได้ต่อ session
- `drop`: นโยบายเมื่อเกินขีดจำกัด (`old`, `new`, `summarize`)

`Summarize` จะเก็บรายการหัวข้อสั้น ๆ ของข้อความที่ถูกทิ้งไว้ และฉีดเข้าไปเป็น synthetic followup prompt
ค่าเริ่มต้น: `debounceMs: 1000`, `cap: 20`, `drop: summarize`

## การ override ราย session

- ส่ง `/queue <mode>` เป็นคำสั่งเดี่ยวเพื่อบันทึกโหมดสำหรับ session ปัจจุบัน
- สามารถรวมตัวเลือกได้: `/queue collect debounce:2s cap:25 drop:summarize`
- `/queue default` หรือ `/queue reset` จะล้าง override ของ session

## ขอบเขตและการรับประกัน

- ใช้กับการรันเอเจนต์แบบตอบกลับอัตโนมัติบนทุกช่องทางขาเข้าที่ใช้ reply pipeline ของ gateway (WhatsApp web, Telegram, Slack, Discord, Signal, iMessage, webchat เป็นต้น)
- lane เริ่มต้น (`main`) ใช้ทั้งโปรเซสสำหรับ inbound + main Heartbeats; ตั้ง `agents.defaults.maxConcurrent` เพื่ออนุญาตให้หลาย sessions ทำงานขนานกันได้
- อาจมี lanes เพิ่มเติม (เช่น `cron`, `subagent`) เพื่อให้งานเบื้องหลังทำงานขนานกันได้โดยไม่บล็อกการตอบกลับขาเข้า การรันแบบ detached เหล่านี้จะถูกติดตามเป็น [งานเบื้องหลัง](/th/automation/tasks)
- lanes ราย session รับประกันว่าจะมีการรันเอเจนต์เพียงหนึ่งรายการเท่านั้นที่แตะ session ใด session หนึ่งในเวลาเดียวกัน
- ไม่มี external dependencies หรือ background worker threads; ใช้ TypeScript + promises ล้วน ๆ

## การแก้ไขปัญหา

- หากคำสั่งดูเหมือนค้าง ให้เปิด verbose logs และมองหาบรรทัด “queued for …ms” เพื่อยืนยันว่าคิวกำลังระบายอยู่
- หากคุณต้องการดูความลึกของคิว ให้เปิด verbose logs และดูบรรทัดเวลาของคิว

## ที่เกี่ยวข้อง

- [การจัดการ Session](/th/concepts/session)
- [นโยบาย Retry](/th/concepts/retry)
