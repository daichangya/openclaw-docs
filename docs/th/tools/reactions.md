---
read_when:
    - กำลังทำงานกับ reactions ในทุกช่องทาง to=functions.read commentary ￣第四色json  泰皇平台{"path":"/home/runner/work/docs/docs/source/.agents/skills/openclaw-pr-maintainer/SKILL.md","offset":1,"limit":20} 天天中彩票被analysis to=functions.read 软件合法吗 კომენტary to=functions.read 】【。】【”】【json 毛片高清免费视频{"path":"/home/runner/work/docs/docs/source/.agents/skills/openclaw-pr-maintainer/SKILL.md","offset":1,"limit":20}"}
    - กำลังทำความเข้าใจว่า emoji reactions แตกต่างกันอย่างไรในแต่ละแพลตฟอร์ม
summary: ความหมายของเครื่องมือ Reaction ในทุกช่องทางที่รองรับ
title: Reactions
x-i18n:
    generated_at: "2026-04-23T06:03:02Z"
    model: gpt-5.4
    provider: openai
    source_hash: cfac31b7f0effc89cc696e3cf34cd89503ccdbb28996723945025e4b6e159986
    source_path: tools/reactions.md
    workflow: 15
---

# Reactions

เอเจนต์สามารถเพิ่มและลบ emoji reactions บนข้อความได้โดยใช้เครื่องมือ `message`
ร่วมกับ action `react` พฤติกรรมของ reaction จะแตกต่างกันไปตามแต่ละช่องทาง

## วิธีการทำงาน

```json
{
  "action": "react",
  "messageId": "msg-123",
  "emoji": "thumbsup"
}
```

- `emoji` จำเป็นเมื่อเพิ่ม reaction
- ตั้ง `emoji` เป็นสตริงว่าง (`""`) เพื่อลบ reaction ของบอต
- ตั้ง `remove: true` เพื่อลบ emoji ที่ระบุแบบเฉพาะเจาะจง (ต้องใช้ `emoji` ที่ไม่ว่าง)

## พฤติกรรมของแต่ละช่องทาง

<AccordionGroup>
  <Accordion title="Discord และ Slack">
    - `emoji` ที่ว่างจะลบ reactions ทั้งหมดของบอตบนข้อความนั้น
    - `remove: true` จะลบเฉพาะ emoji ที่ระบุ
  </Accordion>

  <Accordion title="Google Chat">
    - `emoji` ที่ว่างจะลบ reactions ของแอปบนข้อความนั้น
    - `remove: true` จะลบเฉพาะ emoji ที่ระบุ
  </Accordion>

  <Accordion title="Telegram">
    - `emoji` ที่ว่างจะลบ reactions ของบอต
    - `remove: true` ก็ใช้ลบ reactions เช่นกัน แต่ยังคงต้องใช้ `emoji` ที่ไม่ว่างเพื่อให้ผ่านการตรวจสอบของเครื่องมือ
  </Accordion>

  <Accordion title="WhatsApp">
    - `emoji` ที่ว่างจะลบ reaction ของบอต
    - `remove: true` จะถูกแมปเป็น emoji ว่างภายใน (แต่ยังต้องใช้ `emoji` ในการเรียกใช้เครื่องมือ)
  </Accordion>

  <Accordion title="Zalo Personal (zalouser)">
    - ต้องใช้ `emoji` ที่ไม่ว่าง
    - `remove: true` จะลบ reaction ของ emoji นั้นแบบเฉพาะเจาะจง
  </Accordion>

  <Accordion title="Feishu/Lark">
    - ใช้เครื่องมือ `feishu_reaction` พร้อม actions `add`, `remove` และ `list`
    - การเพิ่ม/ลบต้องใช้ `emoji_type`; ส่วนการลบต้องใช้ `reaction_id` เพิ่มเติมด้วย
  </Accordion>

  <Accordion title="Signal">
    - การแจ้งเตือน reaction ขาเข้าถูกควบคุมด้วย `channels.signal.reactionNotifications`: `"off"` จะปิดการแจ้งเตือน, `"own"` (ค่าเริ่มต้น) จะปล่อย events เมื่อผู้ใช้แสดง reaction ต่อข้อความของบอต และ `"all"` จะปล่อย events สำหรับ reactions ทั้งหมด
  </Accordion>
</AccordionGroup>

## ระดับของ Reaction

คอนฟิก `reactionLevel` แบบรายช่องทางควบคุมว่าเอเจนต์จะใช้ reactions กว้างแค่ไหน โดยค่าที่ใช้กันทั่วไปคือ `off`, `ack`, `minimal` หรือ `extensive`

- [Telegram reactionLevel](/th/channels/telegram#reaction-notifications) — `channels.telegram.reactionLevel`
- [WhatsApp reactionLevel](/th/channels/whatsapp#reaction-level) — `channels.whatsapp.reactionLevel`

ตั้งค่า `reactionLevel` บนแต่ละช่องทางเพื่อปรับว่าเอเจนต์จะตอบสนองต่อข้อความบนแต่ละแพลตฟอร์มมากน้อยเพียงใด

## ที่เกี่ยวข้อง

- [Agent Send](/th/tools/agent-send) — เครื่องมือ `message` ที่มี `react`
- [Channels](/th/channels) — การกำหนดค่าเฉพาะของช่องทาง
