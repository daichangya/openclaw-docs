---
read_when:
    - การเปลี่ยนการกำหนดเส้นทางของช่องทางหรือพฤติกรรมของกล่องข้อความ
summary: กฎการกำหนดเส้นทางแยกตามแต่ละช่องทาง (WhatsApp, Telegram, Discord, Slack) และบริบทร่วมกัน
title: การกำหนดเส้นทางของช่องทาง
x-i18n:
    generated_at: "2026-04-23T05:25:16Z"
    model: gpt-5.4
    provider: openai
    source_hash: e7d437d85d5edd3a0157fd683c6ec63d5d7e905e3e6bdce9a3ba11ddab97d3c2
    source_path: channels/channel-routing.md
    workflow: 15
---

# ช่องทางและการกำหนดเส้นทาง

OpenClaw กำหนดเส้นทางการตอบกลับ **กลับไปยังช่องทางที่ข้อความนั้นส่งเข้ามา** โมเดลจะไม่เป็นผู้เลือกช่องทาง การกำหนดเส้นทางเป็นแบบกำหนดแน่นอนและควบคุมโดยการตั้งค่าของโฮสต์

## คำสำคัญ

- **Channel**: `telegram`, `whatsapp`, `discord`, `irc`, `googlechat`, `slack`, `signal`, `imessage`, `line` รวมถึงช่องทางจาก extension โดย `webchat` เป็นช่องทาง UI WebChat ภายใน และไม่ใช่ช่องทางขาออกที่ตั้งค่าได้
- **AccountId**: อินสแตนซ์บัญชีแยกตามช่องทาง (เมื่อรองรับ)
- บัญชีเริ่มต้นของช่องทางแบบไม่บังคับ: `channels.<channel>.defaultAccount` ใช้เลือกว่าควรใช้บัญชีใดเมื่อเส้นทางขาออกไม่ได้ระบุ `accountId`
  - ในการตั้งค่าแบบหลายบัญชี ให้กำหนดค่าเริ่มต้นอย่างชัดเจน (`defaultAccount` หรือ `accounts.default`) เมื่อมีการตั้งค่าบัญชีตั้งแต่สองบัญชีขึ้นไป หากไม่กำหนด การกำหนดเส้นทาง fallback อาจเลือก account ID ตัวแรกหลังการ normalize
- **AgentId**: workspace + ที่เก็บ session แบบแยกอิสระ (“สมอง”)
- **SessionKey**: คีย์บัคเก็ตที่ใช้เก็บบริบทและควบคุมการทำงานพร้อมกัน

## รูปแบบของ session key (ตัวอย่าง)

ข้อความส่วนตัวจะถูกรวมเข้ากับ session **main** ของเอเจนต์ตามค่าเริ่มต้น:

- `agent:<agentId>:<mainKey>` (ค่าเริ่มต้น: `agent:main:main`)

แม้ในกรณีที่ประวัติการสนทนาในข้อความส่วนตัวถูกแชร์ร่วมกับ main แต่ sandbox และนโยบายเครื่องมือจะใช้คีย์รันไทม์ของ direct chat แยกตามบัญชีที่อนุมานขึ้นมาสำหรับ DM ภายนอก เพื่อไม่ให้ข้อความที่มาจากช่องทางถูกปฏิบัติเหมือนการรันจากเซสชัน main ในเครื่อง

กลุ่มและช่องทางยังคงถูกแยกตามแต่ละช่องทาง:

- กลุ่ม: `agent:<agentId>:<channel>:group:<id>`
- Channels/rooms: `agent:<agentId>:<channel>:channel:<id>`

เธรด:

- เธรดของ Slack/Discord จะต่อท้าย `:thread:<threadId>` เข้ากับคีย์ฐาน
- Telegram forum topics จะฝัง `:topic:<topicId>` ไว้ในคีย์กลุ่ม

ตัวอย่าง:

- `agent:main:telegram:group:-1001234567890:topic:42`
- `agent:main:discord:channel:123456:thread:987654`

## การปักหมุดเส้นทาง main DM

เมื่อ `session.dmScope` เป็น `main` ข้อความส่วนตัวอาจใช้ session main เดียวกันร่วมกัน เพื่อป้องกันไม่ให้ `lastRoute` ของเซสชันถูกเขียนทับโดย DM จากผู้ที่ไม่ใช่เจ้าของ OpenClaw จะอนุมานเจ้าของที่ถูกปักหมุดจาก `allowFrom` เมื่อเงื่อนไขทั้งหมดต่อไปนี้เป็นจริง:

- `allowFrom` มีรายการที่ไม่ใช่ wildcard อยู่เพียงหนึ่งรายการ
- รายการนั้นสามารถ normalize ให้เป็น sender ID แบบชัดเจนสำหรับช่องทางนั้นได้
- ผู้ส่ง DM ขาเข้าไม่ตรงกับเจ้าของที่ถูกปักหมุดนั้น

ในกรณีที่ไม่ตรงกัน OpenClaw จะยังคงบันทึกข้อมูลเมตาของ session ขาเข้า แต่จะข้ามการอัปเดต `lastRoute` ของ session main

## กฎการกำหนดเส้นทาง (วิธีเลือกเอเจนต์)

การกำหนดเส้นทางจะเลือก **หนึ่งเอเจนต์** สำหรับแต่ละข้อความขาเข้า:

1. **ตรงกับ peer แบบเจาะจง**
   (`bindings` ที่มี `peer.kind` + `peer.id`)
2. **ตรงกับ parent peer**
   (การสืบทอดจากเธรด)
3. **ตรงกับ guild + roles**
   (Discord) ผ่าน `guildId` + `roles`
4. **ตรงกับ guild**
   (Discord) ผ่าน `guildId`
5. **ตรงกับทีม**
   (Slack) ผ่าน `teamId`
6. **ตรงกับบัญชี**
   (`accountId` บนช่องทาง)
7. **ตรงกับช่องทาง**
   (ทุกบัญชีบนช่องทางนั้น, `accountId: "*"` )
8. **เอเจนต์เริ่มต้น**
   (`agents.list[].default`, มิฉะนั้นใช้รายการแรกในลิสต์, และ fallback เป็น `main`)

เมื่อ binding หนึ่งรายการมีหลายฟิลด์ที่ใช้จับคู่ (`peer`, `guildId`, `teamId`, `roles`) **ทุกฟิลด์ที่ระบุมาต้องตรงกันทั้งหมด** จึงจะใช้ binding นั้นได้

เอเจนต์ที่จับคู่ได้จะเป็นตัวกำหนดว่าใช้ workspace และ session store ใด

## Broadcast groups (รันหลายเอเจนต์)

Broadcast groups ช่วยให้คุณรัน **หลายเอเจนต์** สำหรับ peer เดียวกันได้ **ในกรณีที่ OpenClaw ปกติจะตอบกลับอยู่แล้ว** (ตัวอย่างเช่น ในกลุ่ม WhatsApp หลังจากผ่าน mention/activation gating)

การตั้งค่า:

```json5
{
  broadcast: {
    strategy: "parallel",
    "120363403215116621@g.us": ["alfred", "baerbel"],
    "+15555550123": ["support", "logger"],
  },
}
```

ดู: [Broadcast Groups](/th/channels/broadcast-groups)

## ภาพรวมการตั้งค่า

- `agents.list`: นิยามเอเจนต์แบบมีชื่อ (workspace, โมเดล ฯลฯ)
- `bindings`: แมปช่องทาง/บัญชี/peer ขาเข้าไปยังเอเจนต์

ตัวอย่าง:

```json5
{
  agents: {
    list: [{ id: "support", name: "Support", workspace: "~/.openclaw/workspace-support" }],
  },
  bindings: [
    { match: { channel: "slack", teamId: "T123" }, agentId: "support" },
    { match: { channel: "telegram", peer: { kind: "group", id: "-100123" } }, agentId: "support" },
  ],
}
```

## การจัดเก็บ session

Session stores อยู่ภายใต้ไดเรกทอรี state (ค่าเริ่มต้น `~/.openclaw`):

- `~/.openclaw/agents/<agentId>/sessions/sessions.json`
- ทรานสคริปต์แบบ JSONL จะอยู่ข้างๆ store

คุณสามารถ override พาธของ store ได้ผ่าน `session.store` และการใช้เทมเพลต `{agentId}`

การค้นหา session ของ Gateway และ ACP จะสแกน disk-backed agent stores ภายใต้ราก `agents/` เริ่มต้น และภายใต้ราก `session.store` ที่ใช้เทมเพลตด้วย store ที่ถูกค้นพบต้องยังคงอยู่ภายในรากเอเจนต์ที่ resolve แล้วนั้น และใช้ไฟล์ `sessions.json` แบบปกติ โดยจะไม่สนใจ symlink และพาธที่อยู่นอกราก

## พฤติกรรมของ WebChat

WebChat จะเชื่อมกับ **เอเจนต์ที่เลือกไว้** และใช้ session main ของเอเจนต์นั้นเป็นค่าเริ่มต้น ด้วยเหตุนี้ WebChat จึงช่วยให้คุณเห็นบริบทร่วมข้ามช่องทางสำหรับเอเจนต์นั้นได้จากที่เดียว

## บริบทของการตอบกลับ

การตอบกลับขาเข้าจะรวมข้อมูลดังนี้:

- `ReplyToId`, `ReplyToBody` และ `ReplyToSender` เมื่อมีข้อมูล
- บริบทที่ถูกอ้างอิงจะถูกต่อท้ายใน `Body` เป็นบล็อก `[Replying to ...]`

ลักษณะนี้สอดคล้องกันในทุกช่องทาง
