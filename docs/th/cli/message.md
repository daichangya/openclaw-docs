---
read_when:
    - การเพิ่มหรือแก้ไข actions ของ CLI ข้อความ
    - การเปลี่ยนพฤติกรรมขาออกของช่องทาง
summary: เอกสารอ้างอิง CLI สำหรับ `openclaw message` (การส่ง + การดำเนินการของช่องทาง)
title: ข้อความ
x-i18n:
    generated_at: "2026-04-24T09:03:26Z"
    model: gpt-5.4
    provider: openai
    source_hash: 39932fb54caee37bdf58681da22b30e1b4cc7cc11b654010bf0335b1da3b2b4d
    source_path: cli/message.md
    workflow: 15
---

# `openclaw message`

คำสั่งขาออกแบบเดี่ยวสำหรับการส่งข้อความและการดำเนินการของช่องทาง
(Discord/Google Chat/iMessage/Matrix/Mattermost (Plugin)/Microsoft Teams/Signal/Slack/Telegram/WhatsApp)

## การใช้งาน

```
openclaw message <subcommand> [flags]
```

การเลือกช่องทาง:

- ต้องใช้ `--channel` หากมีการกำหนดค่ามากกว่าหนึ่งช่องทาง
- หากมีการกำหนดค่าไว้เพียงหนึ่งช่องทาง ช่องทางนั้นจะกลายเป็นค่าเริ่มต้น
- ค่า: `discord|googlechat|imessage|matrix|mattermost|msteams|signal|slack|telegram|whatsapp` (Mattermost ต้องใช้ Plugin)

รูปแบบเป้าหมาย (`--target`):

- WhatsApp: E.164 หรือ group JID
- Telegram: chat id หรือ `@username`
- Discord: `channel:<id>` หรือ `user:<id>` (หรือ mention แบบ `<@id>`; numeric ids แบบดิบจะถูกตีความเป็น channels)
- Google Chat: `spaces/<spaceId>` หรือ `users/<userId>`
- Slack: `channel:<id>` หรือ `user:<id>` (ยอมรับ channel id แบบดิบได้)
- Mattermost (Plugin): `channel:<id>`, `user:<id>` หรือ `@username` (ids แบบดิบจะถูกตีความเป็น channels)
- Signal: `+E.164`, `group:<id>`, `signal:+E.164`, `signal:group:<id>` หรือ `username:<name>`/`u:<name>`
- iMessage: handle, `chat_id:<id>`, `chat_guid:<guid>` หรือ `chat_identifier:<id>`
- Matrix: `@user:server`, `!room:server` หรือ `#alias:server`
- Microsoft Teams: conversation id (`19:...@thread.tacv2`) หรือ `conversation:<id>` หรือ `user:<aad-object-id>`

การค้นหาชื่อ:

- สำหรับผู้ให้บริการที่รองรับ (Discord/Slack/อื่น ๆ) ชื่อช่องอย่าง `Help` หรือ `#help` จะถูก resolve ผ่าน directory cache
- หาก cache ไม่พบ OpenClaw จะพยายามค้นหา directory แบบสดเมื่อผู้ให้บริการรองรับ

## แฟล็กทั่วไป

- `--channel <name>`
- `--account <id>`
- `--target <dest>` (ช่องทางหรือผู้ใช้เป้าหมายสำหรับ send/poll/read/อื่น ๆ)
- `--targets <name>` (ใช้ซ้ำได้; สำหรับ broadcast เท่านั้น)
- `--json`
- `--dry-run`
- `--verbose`

## พฤติกรรมของ SecretRef

- `openclaw message` จะ resolve SecretRefs ของช่องทางที่รองรับก่อนรัน action ที่เลือก
- การ resolve จะถูกจำกัดขอบเขตไปยังเป้าหมาย action ที่กำลังใช้งานเมื่อเป็นไปได้:
  - จำกัดขอบเขตตามช่องทางเมื่อมีการตั้งค่า `--channel` (หรืออนุมานจากเป้าหมายที่มี prefix เช่น `discord:...`)
  - จำกัดขอบเขตตามบัญชีเมื่อมีการตั้งค่า `--account` (พื้นผิว global ของช่องทาง + พื้นผิวของบัญชีที่เลือก)
  - เมื่อไม่ระบุ `--account` OpenClaw จะไม่บังคับขอบเขต SecretRef ของบัญชี `default`
- SecretRefs ที่ยัง resolve ไม่ได้บนช่องทางที่ไม่เกี่ยวข้องจะไม่บล็อก targeted message action
- หาก SecretRef ของช่องทาง/บัญชีที่เลือกยัง resolve ไม่ได้ คำสั่งจะ fail closed สำหรับ action นั้น

## Actions

### แกนหลัก

- `send`
  - ช่องทาง: WhatsApp/Telegram/Discord/Google Chat/Slack/Mattermost (Plugin)/Signal/iMessage/Matrix/Microsoft Teams
  - ต้องระบุ: `--target` พร้อมกับ `--message`, `--media` หรือ `--presentation`
  - ไม่บังคับ: `--media`, `--presentation`, `--delivery`, `--pin`, `--reply-to`, `--thread-id`, `--gif-playback`, `--force-document`, `--silent`
  - payload การนำเสนอที่ใช้ร่วมกัน: `--presentation` ส่ง semantic blocks (`text`, `context`, `divider`, `buttons`, `select`) ที่แกนหลักจะเรนเดอร์ผ่านความสามารถที่ประกาศไว้ของช่องทางที่เลือก ดู [Message Presentation](/th/plugins/message-presentation)
  - ค่ากำหนดการส่งมอบทั่วไป: `--delivery` รับ delivery hints เช่น `{ "pin": true }`; `--pin` เป็นรูปแบบย่อสำหรับการส่งแบบปักหมุดเมื่อช่องทางรองรับ
  - Telegram เท่านั้น: `--force-document` (ส่งรูปภาพและ GIF เป็นเอกสารเพื่อหลีกเลี่ยงการบีบอัดของ Telegram)
  - Telegram เท่านั้น: `--thread-id` (forum topic id)
  - Slack เท่านั้น: `--thread-id` (thread timestamp; `--reply-to` ใช้ฟิลด์เดียวกัน)
  - Telegram + Discord: `--silent`
  - WhatsApp เท่านั้น: `--gif-playback`

- `poll`
  - ช่องทาง: WhatsApp/Telegram/Discord/Matrix/Microsoft Teams
  - ต้องระบุ: `--target`, `--poll-question`, `--poll-option` (ใช้ซ้ำได้)
  - ไม่บังคับ: `--poll-multi`
  - Discord เท่านั้น: `--poll-duration-hours`, `--silent`, `--message`
  - Telegram เท่านั้น: `--poll-duration-seconds` (5-600), `--silent`, `--poll-anonymous` / `--poll-public`, `--thread-id`

- `react`
  - ช่องทาง: Discord/Google Chat/Slack/Telegram/WhatsApp/Signal/Matrix
  - ต้องระบุ: `--message-id`, `--target`
  - ไม่บังคับ: `--emoji`, `--remove`, `--participant`, `--from-me`, `--target-author`, `--target-author-uuid`
  - หมายเหตุ: `--remove` ต้องใช้ร่วมกับ `--emoji` (หากละ `--emoji` จะล้าง reactions ของตนเองเมื่อช่องทางรองรับ; ดู /tools/reactions)
  - WhatsApp เท่านั้น: `--participant`, `--from-me`
  - reactions ของกลุ่ม Signal: ต้องระบุ `--target-author` หรือ `--target-author-uuid`

- `reactions`
  - ช่องทาง: Discord/Google Chat/Slack/Matrix
  - ต้องระบุ: `--message-id`, `--target`
  - ไม่บังคับ: `--limit`

- `read`
  - ช่องทาง: Discord/Slack/Matrix
  - ต้องระบุ: `--target`
  - ไม่บังคับ: `--limit`, `--before`, `--after`
  - Discord เท่านั้น: `--around`

- `edit`
  - ช่องทาง: Discord/Slack/Matrix
  - ต้องระบุ: `--message-id`, `--message`, `--target`

- `delete`
  - ช่องทาง: Discord/Slack/Telegram/Matrix
  - ต้องระบุ: `--message-id`, `--target`

- `pin` / `unpin`
  - ช่องทาง: Discord/Slack/Matrix
  - ต้องระบุ: `--message-id`, `--target`

- `pins` (แสดงรายการ)
  - ช่องทาง: Discord/Slack/Matrix
  - ต้องระบุ: `--target`

- `permissions`
  - ช่องทาง: Discord/Matrix
  - ต้องระบุ: `--target`
  - Matrix เท่านั้น: ใช้ได้เมื่อเปิดใช้ Matrix encryption และอนุญาต verification actions

- `search`
  - ช่องทาง: Discord
  - ต้องระบุ: `--guild-id`, `--query`
  - ไม่บังคับ: `--channel-id`, `--channel-ids` (ใช้ซ้ำได้), `--author-id`, `--author-ids` (ใช้ซ้ำได้), `--limit`

### เธรด

- `thread create`
  - ช่องทาง: Discord
  - ต้องระบุ: `--thread-name`, `--target` (channel id)
  - ไม่บังคับ: `--message-id`, `--message`, `--auto-archive-min`

- `thread list`
  - ช่องทาง: Discord
  - ต้องระบุ: `--guild-id`
  - ไม่บังคับ: `--channel-id`, `--include-archived`, `--before`, `--limit`

- `thread reply`
  - ช่องทาง: Discord
  - ต้องระบุ: `--target` (thread id), `--message`
  - ไม่บังคับ: `--media`, `--reply-to`

### อีโมจิ

- `emoji list`
  - Discord: `--guild-id`
  - Slack: ไม่มีแฟล็กเพิ่มเติม

- `emoji upload`
  - ช่องทาง: Discord
  - ต้องระบุ: `--guild-id`, `--emoji-name`, `--media`
  - ไม่บังคับ: `--role-ids` (ใช้ซ้ำได้)

### สติกเกอร์

- `sticker send`
  - ช่องทาง: Discord
  - ต้องระบุ: `--target`, `--sticker-id` (ใช้ซ้ำได้)
  - ไม่บังคับ: `--message`

- `sticker upload`
  - ช่องทาง: Discord
  - ต้องระบุ: `--guild-id`, `--sticker-name`, `--sticker-desc`, `--sticker-tags`, `--media`

### บทบาท / ช่อง / สมาชิก / Voice

- `role info` (Discord): `--guild-id`
- `role add` / `role remove` (Discord): `--guild-id`, `--user-id`, `--role-id`
- `channel info` (Discord): `--target`
- `channel list` (Discord): `--guild-id`
- `member info` (Discord/Slack): `--user-id` (+ `--guild-id` สำหรับ Discord)
- `voice status` (Discord): `--guild-id`, `--user-id`

### Events

- `event list` (Discord): `--guild-id`
- `event create` (Discord): `--guild-id`, `--event-name`, `--start-time`
  - ไม่บังคับ: `--end-time`, `--desc`, `--channel-id`, `--location`, `--event-type`

### การดูแลจัดการ (Discord)

- `timeout`: `--guild-id`, `--user-id` (ไม่บังคับ `--duration-min` หรือ `--until`; หากไม่ระบุทั้งสองจะเป็นการล้าง timeout)
- `kick`: `--guild-id`, `--user-id` (+ `--reason`)
- `ban`: `--guild-id`, `--user-id` (+ `--delete-days`, `--reason`)
  - `timeout` รองรับ `--reason` ด้วย

### Broadcast

- `broadcast`
  - ช่องทาง: ทุกช่องทางที่กำหนดค่าไว้; ใช้ `--channel all` เพื่อกำหนดเป้าหมายทุกผู้ให้บริการ
  - ต้องระบุ: `--targets <target...>`
  - ไม่บังคับ: `--message`, `--media`, `--dry-run`

## ตัวอย่าง

ส่งคำตอบใน Discord:

```
openclaw message send --channel discord \
  --target channel:123 --message "hi" --reply-to 456
```

ส่งข้อความพร้อมปุ่ม semantic:

```
openclaw message send --channel discord \
  --target channel:123 --message "Choose:" \
  --presentation '{"blocks":[{"type":"buttons","buttons":[{"label":"Approve","value":"approve","style":"success"},{"label":"Decline","value":"decline","style":"danger"}]}]}'
```

แกนหลักจะเรนเดอร์ payload `presentation` เดียวกันเป็น Discord components, Slack blocks, ปุ่ม inline ของ Telegram, props ของ Mattermost หรือการ์ดของ Teams/Feishu ตามความสามารถของช่องทาง ดู [Message Presentation](/th/plugins/message-presentation) สำหรับสัญญาเต็มรูปแบบและกฎ fallback

ส่ง payload การนำเสนอที่สมบูรณ์ยิ่งขึ้น:

```bash
openclaw message send --channel googlechat --target spaces/AAA... \
  --message "Choose:" \
  --presentation '{"title":"Deploy approval","tone":"warning","blocks":[{"type":"text","text":"Choose a path"},{"type":"buttons","buttons":[{"label":"Approve","value":"approve"},{"label":"Decline","value":"decline"}]}]}'
```

สร้างโพลล์ใน Discord:

```
openclaw message poll --channel discord \
  --target channel:123 \
  --poll-question "Snack?" \
  --poll-option Pizza --poll-option Sushi \
  --poll-multi --poll-duration-hours 48
```

สร้างโพลล์ใน Telegram (ปิดอัตโนมัติใน 2 นาที):

```
openclaw message poll --channel telegram \
  --target @mychat \
  --poll-question "Lunch?" \
  --poll-option Pizza --poll-option Sushi \
  --poll-duration-seconds 120 --silent
```

ส่งข้อความเชิงรุกใน Teams:

```
openclaw message send --channel msteams \
  --target conversation:19:abc@thread.tacv2 --message "hi"
```

สร้างโพลล์ใน Teams:

```
openclaw message poll --channel msteams \
  --target conversation:19:abc@thread.tacv2 \
  --poll-question "Lunch?" \
  --poll-option Pizza --poll-option Sushi
```

react ใน Slack:

```
openclaw message react --channel slack \
  --target C123 --message-id 456 --emoji "✅"
```

react ในกลุ่ม Signal:

```
openclaw message react --channel signal \
  --target signal:group:abc123 --message-id 1737630212345 \
  --emoji "✅" --target-author-uuid 123e4567-e89b-12d3-a456-426614174000
```

ส่งปุ่ม inline ของ Telegram ผ่าน generic presentation:

```
openclaw message send --channel telegram --target @mychat --message "Choose:" \
  --presentation '{"blocks":[{"type":"buttons","buttons":[{"label":"Yes","value":"cmd:yes"},{"label":"No","value":"cmd:no"}]}]}'
```

ส่งการ์ด Teams ผ่าน generic presentation:

```bash
openclaw message send --channel msteams \
  --target conversation:19:abc@thread.tacv2 \
  --presentation '{"title":"Status update","blocks":[{"type":"text","text":"Build completed"}]}'
```

ส่งรูปภาพ Telegram เป็นเอกสารเพื่อหลีกเลี่ยงการบีบอัด:

```bash
openclaw message send --channel telegram --target @mychat \
  --media ./diagram.png --force-document
```

## ที่เกี่ยวข้อง

- [เอกสารอ้างอิง CLI](/th/cli)
- [Agent send](/th/tools/agent-send)
