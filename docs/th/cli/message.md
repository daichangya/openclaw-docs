---
read_when:
    - การเพิ่มหรือแก้ไขการดำเนินการ CLI ของข้อความ
    - การเปลี่ยนพฤติกรรมของแชนแนลขาออก
summary: ข้อมูลอ้างอิง CLI สำหรับ `openclaw message` (ส่ง + การดำเนินการของแชนแนล)
title: ข้อความ
x-i18n:
    generated_at: "2026-04-23T06:18:30Z"
    model: gpt-5.4
    provider: openai
    source_hash: 37b6f40b435326aee186dad1e6e060c24f2ef6d44b07fd85d4ce5cfd7f350b91
    source_path: cli/message.md
    workflow: 15
---

# `openclaw message`

คำสั่งขาออกแบบรวมสำหรับการส่งข้อความและการดำเนินการของแชนแนล
(Discord/Google Chat/iMessage/Matrix/Mattermost (Plugin)/Microsoft Teams/Signal/Slack/Telegram/WhatsApp)

## การใช้งาน

```
openclaw message <subcommand> [flags]
```

การเลือกแชนแนล:

- ต้องระบุ `--channel` หากมีการกำหนดค่ามากกว่าหนึ่งแชนแนล
- หากมีการกำหนดค่าไว้เพียงแชนแนลเดียว แชนแนลนั้นจะกลายเป็นค่าเริ่มต้น
- ค่า: `discord|googlechat|imessage|matrix|mattermost|msteams|signal|slack|telegram|whatsapp` (Mattermost ต้องใช้ Plugin)

รูปแบบเป้าหมาย (`--target`):

- WhatsApp: E.164 หรือ group JID
- Telegram: chat id หรือ `@username`
- Discord: `channel:<id>` หรือ `user:<id>` (หรือ mention แบบ `<@id>`; id ตัวเลขล้วนจะถูกตีความเป็นแชนแนล)
- Google Chat: `spaces/<spaceId>` หรือ `users/<userId>`
- Slack: `channel:<id>` หรือ `user:<id>` (ยอมรับ channel id แบบดิบ)
- Mattermost (Plugin): `channel:<id>`, `user:<id>`, หรือ `@username` (id แบบล้วนจะถูกตีความเป็นแชนแนล)
- Signal: `+E.164`, `group:<id>`, `signal:+E.164`, `signal:group:<id>`, หรือ `username:<name>`/`u:<name>`
- iMessage: handle, `chat_id:<id>`, `chat_guid:<guid>`, หรือ `chat_identifier:<id>`
- Matrix: `@user:server`, `!room:server`, หรือ `#alias:server`
- Microsoft Teams: conversation id (`19:...@thread.tacv2`) หรือ `conversation:<id>` หรือ `user:<aad-object-id>`

การค้นหาชื่อ:

- สำหรับผู้ให้บริการที่รองรับ (Discord/Slack/อื่นๆ) ชื่อแชนแนล เช่น `Help` หรือ `#help` จะถูก resolve ผ่านแคชไดเรกทอรี
- หากไม่พบในแคช OpenClaw จะพยายามค้นหาไดเรกทอรีแบบสดเมื่อผู้ให้บริการรองรับ

## แฟล็กร่วม

- `--channel <name>`
- `--account <id>`
- `--target <dest>` (แชนแนลหรือผู้ใช้เป้าหมายสำหรับ send/poll/read/อื่นๆ)
- `--targets <name>` (ระบุซ้ำได้; ใช้กับ broadcast เท่านั้น)
- `--json`
- `--dry-run`
- `--verbose`

## พฤติกรรมของ SecretRef

- `openclaw message` จะ resolve SecretRefs ของแชนแนลที่รองรับก่อนรันการดำเนินการที่เลือก
- การ resolve จะถูกจำกัดขอบเขตตามเป้าหมายของการดำเนินการที่ใช้งานอยู่เมื่อทำได้:
  - ระดับแชนแนลเมื่อมีการตั้ง `--channel` (หรืออนุมานได้จาก target ที่มีคำนำหน้า เช่น `discord:...`)
  - ระดับบัญชีเมื่อมีการตั้ง `--account` (global ของแชนแนล + พื้นผิวของบัญชีที่เลือก)
  - เมื่อไม่ระบุ `--account` OpenClaw จะไม่บังคับขอบเขต SecretRef ของบัญชี `default`
- SecretRefs ที่ resolve ไม่ได้ในแชนแนลที่ไม่เกี่ยวข้องจะไม่บล็อกการดำเนินการข้อความแบบเจาะจงเป้าหมาย
- หาก SecretRef ของแชนแนล/บัญชีที่เลือก resolve ไม่ได้ คำสั่งจะ fail closed สำหรับการดำเนินการนั้น

## การดำเนินการ

### Core

- `send`
  - แชนแนล: WhatsApp/Telegram/Discord/Google Chat/Slack/Mattermost (Plugin)/Signal/iMessage/Matrix/Microsoft Teams
  - ต้องระบุ: `--target` และ `--message`, `--media`, หรือ `--presentation`
  - ไม่บังคับ: `--media`, `--presentation`, `--delivery`, `--pin`, `--reply-to`, `--thread-id`, `--gif-playback`, `--force-document`, `--silent`
  - payload `presentation` ที่ใช้ร่วมกัน: `--presentation` จะส่งบล็อกเชิงความหมาย (`text`, `context`, `divider`, `buttons`, `select`) ที่ core เรนเดอร์ผ่านความสามารถที่ประกาศไว้ของแชนแนลที่เลือก ดู [Message Presentation](/th/plugins/message-presentation)
  - ค่ากำหนดการส่งแบบทั่วไป: `--delivery` รับคำใบ้การส่ง เช่น `{ "pin": true }`; `--pin` เป็นรูปแบบย่อสำหรับการส่งแบบปักหมุดเมื่อแชนแนลรองรับ
  - เฉพาะ Telegram: `--force-document` (ส่งรูปภาพและ GIF เป็นเอกสารเพื่อหลีกเลี่ยงการบีบอัดของ Telegram)
  - เฉพาะ Telegram: `--thread-id` (forum topic id)
  - เฉพาะ Slack: `--thread-id` (thread timestamp; `--reply-to` ใช้ฟิลด์เดียวกัน)
  - Telegram + Discord: `--silent`
  - เฉพาะ WhatsApp: `--gif-playback`

- `poll`
  - แชนแนล: WhatsApp/Telegram/Discord/Matrix/Microsoft Teams
  - ต้องระบุ: `--target`, `--poll-question`, `--poll-option` (ระบุซ้ำได้)
  - ไม่บังคับ: `--poll-multi`
  - เฉพาะ Discord: `--poll-duration-hours`, `--silent`, `--message`
  - เฉพาะ Telegram: `--poll-duration-seconds` (5-600), `--silent`, `--poll-anonymous` / `--poll-public`, `--thread-id`

- `react`
  - แชนแนล: Discord/Google Chat/Slack/Telegram/WhatsApp/Signal/Matrix
  - ต้องระบุ: `--message-id`, `--target`
  - ไม่บังคับ: `--emoji`, `--remove`, `--participant`, `--from-me`, `--target-author`, `--target-author-uuid`
  - หมายเหตุ: `--remove` ต้องใช้ร่วมกับ `--emoji` (หากไม่ระบุ `--emoji` จะเป็นการล้าง reaction ของตัวเองในแชนแนลที่รองรับ; ดู /tools/reactions)
  - เฉพาะ WhatsApp: `--participant`, `--from-me`
  - reaction ในกลุ่ม Signal: ต้องระบุ `--target-author` หรือ `--target-author-uuid`

- `reactions`
  - แชนแนล: Discord/Google Chat/Slack/Matrix
  - ต้องระบุ: `--message-id`, `--target`
  - ไม่บังคับ: `--limit`

- `read`
  - แชนแนล: Discord/Slack/Matrix
  - ต้องระบุ: `--target`
  - ไม่บังคับ: `--limit`, `--before`, `--after`
  - เฉพาะ Discord: `--around`

- `edit`
  - แชนแนล: Discord/Slack/Matrix
  - ต้องระบุ: `--message-id`, `--message`, `--target`

- `delete`
  - แชนแนล: Discord/Slack/Telegram/Matrix
  - ต้องระบุ: `--message-id`, `--target`

- `pin` / `unpin`
  - แชนแนล: Discord/Slack/Matrix
  - ต้องระบุ: `--message-id`, `--target`

- `pins` (แสดงรายการ)
  - แชนแนล: Discord/Slack/Matrix
  - ต้องระบุ: `--target`

- `permissions`
  - แชนแนล: Discord/Matrix
  - ต้องระบุ: `--target`
  - เฉพาะ Matrix: ใช้งานได้เมื่อเปิดใช้การเข้ารหัสของ Matrix และอนุญาตการดำเนินการตรวจสอบยืนยัน

- `search`
  - แชนแนล: Discord
  - ต้องระบุ: `--guild-id`, `--query`
  - ไม่บังคับ: `--channel-id`, `--channel-ids` (ระบุซ้ำได้), `--author-id`, `--author-ids` (ระบุซ้ำได้), `--limit`

### เธรด

- `thread create`
  - แชนแนล: Discord
  - ต้องระบุ: `--thread-name`, `--target` (channel id)
  - ไม่บังคับ: `--message-id`, `--message`, `--auto-archive-min`

- `thread list`
  - แชนแนล: Discord
  - ต้องระบุ: `--guild-id`
  - ไม่บังคับ: `--channel-id`, `--include-archived`, `--before`, `--limit`

- `thread reply`
  - แชนแนล: Discord
  - ต้องระบุ: `--target` (thread id), `--message`
  - ไม่บังคับ: `--media`, `--reply-to`

### อีโมจิ

- `emoji list`
  - Discord: `--guild-id`
  - Slack: ไม่มีแฟล็กเพิ่มเติม

- `emoji upload`
  - แชนแนล: Discord
  - ต้องระบุ: `--guild-id`, `--emoji-name`, `--media`
  - ไม่บังคับ: `--role-ids` (ระบุซ้ำได้)

### สติกเกอร์

- `sticker send`
  - แชนแนล: Discord
  - ต้องระบุ: `--target`, `--sticker-id` (ระบุซ้ำได้)
  - ไม่บังคับ: `--message`

- `sticker upload`
  - แชนแนล: Discord
  - ต้องระบุ: `--guild-id`, `--sticker-name`, `--sticker-desc`, `--sticker-tags`, `--media`

### บทบาท / แชนแนล / สมาชิก / เสียง

- `role info` (Discord): `--guild-id`
- `role add` / `role remove` (Discord): `--guild-id`, `--user-id`, `--role-id`
- `channel info` (Discord): `--target`
- `channel list` (Discord): `--guild-id`
- `member info` (Discord/Slack): `--user-id` (+ `--guild-id` สำหรับ Discord)
- `voice status` (Discord): `--guild-id`, `--user-id`

### กิจกรรม

- `event list` (Discord): `--guild-id`
- `event create` (Discord): `--guild-id`, `--event-name`, `--start-time`
  - ไม่บังคับ: `--end-time`, `--desc`, `--channel-id`, `--location`, `--event-type`

### การดูแลจัดการ (Discord)

- `timeout`: `--guild-id`, `--user-id` (ไม่บังคับ `--duration-min` หรือ `--until`; หากไม่ระบุทั้งคู่จะเป็นการล้าง timeout)
- `kick`: `--guild-id`, `--user-id` (+ `--reason`)
- `ban`: `--guild-id`, `--user-id` (+ `--delete-days`, `--reason`)
  - `timeout` รองรับ `--reason` เช่นกัน

### Broadcast

- `broadcast`
  - แชนแนล: แชนแนลใดก็ได้ที่กำหนดค่าไว้; ใช้ `--channel all` เพื่อกำหนดเป้าหมายผู้ให้บริการทั้งหมด
  - ต้องระบุ: `--targets <target...>`
  - ไม่บังคับ: `--message`, `--media`, `--dry-run`

## ตัวอย่าง

ส่งการตอบกลับใน Discord:

```
openclaw message send --channel discord \
  --target channel:123 --message "hi" --reply-to 456
```

ส่งข้อความพร้อมปุ่มเชิงความหมาย:

```
openclaw message send --channel discord \
  --target channel:123 --message "เลือก:" \
  --presentation '{"blocks":[{"type":"buttons","buttons":[{"label":"อนุมัติ","value":"approve","style":"success"},{"label":"ปฏิเสธ","value":"decline","style":"danger"}]}]}'
```

Core จะเรนเดอร์ payload `presentation` เดียวกันไปเป็นคอมโพเนนต์ของ Discord, blocks ของ Slack, ปุ่ม inline ของ Telegram, props ของ Mattermost หรือการ์ดของ Teams/Feishu ตามความสามารถของแชนแนล ดู [Message Presentation](/th/plugins/message-presentation) สำหรับสัญญาฉบับเต็มและกฎ fallback

ส่ง payload `presentation` ที่สมบูรณ์ยิ่งขึ้น:

```bash
openclaw message send --channel googlechat --target spaces/AAA... \
  --message "เลือก:" \
  --presentation '{"title":"อนุมัติการ deploy","tone":"warning","blocks":[{"type":"text","text":"เลือกเส้นทาง"},{"type":"buttons","buttons":[{"label":"อนุมัติ","value":"approve"},{"label":"ปฏิเสธ","value":"decline"}]}]}'
```

สร้าง poll ใน Discord:

```
openclaw message poll --channel discord \
  --target channel:123 \
  --poll-question "ของว่าง?" \
  --poll-option Pizza --poll-option Sushi \
  --poll-multi --poll-duration-hours 48
```

สร้าง poll ใน Telegram (ปิดอัตโนมัติใน 2 นาที):

```
openclaw message poll --channel telegram \
  --target @mychat \
  --poll-question "มื้อกลางวัน?" \
  --poll-option Pizza --poll-option Sushi \
  --poll-duration-seconds 120 --silent
```

ส่งข้อความแบบ proactive ใน Teams:

```
openclaw message send --channel msteams \
  --target conversation:19:abc@thread.tacv2 --message "hi"
```

สร้าง poll ใน Teams:

```
openclaw message poll --channel msteams \
  --target conversation:19:abc@thread.tacv2 \
  --poll-question "มื้อกลางวัน?" \
  --poll-option Pizza --poll-option Sushi
```

ใส่ reaction ใน Slack:

```
openclaw message react --channel slack \
  --target C123 --message-id 456 --emoji "✅"
```

ใส่ reaction ในกลุ่ม Signal:

```
openclaw message react --channel signal \
  --target signal:group:abc123 --message-id 1737630212345 \
  --emoji "✅" --target-author-uuid 123e4567-e89b-12d3-a456-426614174000
```

ส่งปุ่ม inline ของ Telegram ผ่าน presentation แบบทั่วไป:

```
openclaw message send --channel telegram --target @mychat --message "เลือก:" \
  --presentation '{"blocks":[{"type":"buttons","buttons":[{"label":"ใช่","value":"cmd:yes"},{"label":"ไม่","value":"cmd:no"}]}]}'
```

ส่งการ์ดของ Teams ผ่าน presentation แบบทั่วไป:

```bash
openclaw message send --channel msteams \
  --target conversation:19:abc@thread.tacv2 \
  --presentation '{"title":"อัปเดตสถานะ","blocks":[{"type":"text","text":"การ build เสร็จสมบูรณ์"}]}'
```

ส่งรูปภาพใน Telegram เป็นเอกสารเพื่อหลีกเลี่ยงการบีบอัด:

```bash
openclaw message send --channel telegram --target @mychat \
  --media ./diagram.png --force-document
```
