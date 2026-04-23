---
read_when:
    - การตั้งค่าช่องทาง BlueBubbles
    - การแก้ไขปัญหาการจับคู่ Webhook
    - การกำหนดค่า iMessage บน macOS
summary: iMessage ผ่านเซิร์ฟเวอร์ BlueBubbles บน macOS (REST ส่ง/รับ, การพิมพ์, รีแอ็กชัน, การจับคู่, การดำเนินการขั้นสูง)
title: BlueBubbles
x-i18n:
    generated_at: "2026-04-23T05:25:01Z"
    model: gpt-5.4
    provider: openai
    source_hash: db2e193db3fbcea22748187c21d0493037f59d4f1af163725530d5572b06e8b4
    source_path: channels/bluebubbles.md
    workflow: 15
---

# BlueBubbles (macOS REST)

สถานะ: Plugin ที่มากับระบบซึ่งสื่อสารกับเซิร์ฟเวอร์ BlueBubbles บน macOS ผ่าน HTTP **แนะนำสำหรับการเชื่อมต่อ iMessage** เนื่องจากมี API ที่สมบูรณ์กว่าและตั้งค่าได้ง่ายกว่าเมื่อเทียบกับช่องทาง imsg แบบเดิม

## Plugin ที่มากับระบบ

OpenClaw รุ่นปัจจุบันมี BlueBubbles รวมมาให้แล้ว ดังนั้นบิลด์แพ็กเกจปกติจึง
ไม่ต้องมีขั้นตอน `openclaw plugins install` แยกต่างหาก

## ภาพรวม

- ทำงานบน macOS ผ่านแอปช่วย BlueBubbles ([bluebubbles.app](https://bluebubbles.app))
- แนะนำ/ทดสอบแล้ว: macOS Sequoia (15) ใช้งานได้บน macOS Tahoe (26); ขณะนี้การแก้ไขยังใช้ไม่ได้บน Tahoe และการอัปเดตไอคอนกลุ่มอาจรายงานว่าสำเร็จแต่ไม่ซิงก์
- OpenClaw สื่อสารกับมันผ่าน REST API (`GET /api/v1/ping`, `POST /message/text`, `POST /chat/:id/*`)
- ข้อความขาเข้ามาถึงผ่าน Webhook; การตอบกลับขาออก ตัวบ่งชี้การพิมพ์ ใบตอบรับการอ่าน และ tapback เป็นการเรียก REST
- ไฟล์แนบและสติกเกอร์จะถูกรับเข้าเป็นสื่อขาเข้า (และส่งต่อให้เอเจนต์เมื่อเป็นไปได้)
- การจับคู่/allowlist ทำงานเหมือนกับช่องทางอื่น (`/channels/pairing` เป็นต้น) ด้วย `channels.bluebubbles.allowFrom` + โค้ดการจับคู่
- รีแอ็กชันจะแสดงเป็นเหตุการณ์ระบบเช่นเดียวกับ Slack/Telegram เพื่อให้เอเจนต์สามารถ "กล่าวถึง" สิ่งเหล่านั้นก่อนตอบกลับ
- ความสามารถขั้นสูง: แก้ไข ยกเลิกส่ง การตอบกลับแบบเธรด เอฟเฟกต์ข้อความ การจัดการกลุ่ม

## เริ่มต้นอย่างรวดเร็ว

1. ติดตั้งเซิร์ฟเวอร์ BlueBubbles บน Mac ของคุณ (ทำตามคำแนะนำที่ [bluebubbles.app/install](https://bluebubbles.app/install))
2. ในการกำหนดค่า BlueBubbles ให้เปิดใช้ web API และตั้งรหัสผ่าน
3. รัน `openclaw onboard` แล้วเลือก BlueBubbles หรือกำหนดค่าด้วยตนเอง:

   ```json5
   {
     channels: {
       bluebubbles: {
         enabled: true,
         serverUrl: "http://192.168.1.100:1234",
         password: "example-password",
         webhookPath: "/bluebubbles-webhook",
       },
     },
   }
   ```

4. ชี้ Webhook ของ BlueBubbles ไปยัง Gateway ของคุณ (ตัวอย่าง: `https://your-gateway-host:3000/bluebubbles-webhook?password=<password>`)
5. เริ่ม Gateway; ระบบจะลงทะเบียนตัวจัดการ Webhook และเริ่มการจับคู่

หมายเหตุด้านความปลอดภัย:

- ตั้งรหัสผ่าน Webhook เสมอ
- ต้องมีการยืนยันตัวตนของ Webhook เสมอ OpenClaw จะปฏิเสธคำขอ Webhook ของ BlueBubbles เว้นแต่จะมี password/guid ที่ตรงกับ `channels.bluebubbles.password` (เช่น `?password=<password>` หรือ `x-password`) โดยไม่ขึ้นกับโทโพโลยี loopback/proxy
- การตรวจสอบการยืนยันตัวตนด้วยรหัสผ่านจะทำก่อนอ่าน/แยกวิเคราะห์เนื้อหา Webhook ทั้งหมด

## ทำให้ Messages.app ทำงานอยู่เสมอ (การตั้งค่า VM / headless)

การตั้งค่า macOS VM / always-on บางแบบอาจทำให้ Messages.app เข้าสู่สถานะ “idle” (เหตุการณ์ขาเข้าหยุดจนกว่าจะเปิดแอป/นำแอปขึ้นมาแสดงด้านหน้า) วิธีแก้ชั่วคราวแบบง่ายคือ **กระตุ้น Messages ทุก 5 นาที** ด้วย AppleScript + LaunchAgent

### 1) บันทึก AppleScript

บันทึกไฟล์นี้เป็น:

- `~/Scripts/poke-messages.scpt`

สคริปต์ตัวอย่าง (ไม่โต้ตอบ; ไม่ดึงโฟกัส):

```applescript
try
  tell application "Messages"
    if not running then
      launch
    end if

    -- Touch the scripting interface to keep the process responsive.
    set _chatCount to (count of chats)
  end tell
on error
  -- Ignore transient failures (first-run prompts, locked session, etc).
end try
```

### 2) ติดตั้ง LaunchAgent

บันทึกไฟล์นี้เป็น:

- `~/Library/LaunchAgents/com.user.poke-messages.plist`

```xml
<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE plist PUBLIC "-//Apple//DTD PLIST 1.0//EN" "http://www.apple.com/DTDs/PropertyList-1.0.dtd">
<plist version="1.0">
  <dict>
    <key>Label</key>
    <string>com.user.poke-messages</string>

    <key>ProgramArguments</key>
    <array>
      <string>/bin/bash</string>
      <string>-lc</string>
      <string>/usr/bin/osascript &quot;$HOME/Scripts/poke-messages.scpt&quot;</string>
    </array>

    <key>RunAtLoad</key>
    <true/>

    <key>StartInterval</key>
    <integer>300</integer>

    <key>StandardOutPath</key>
    <string>/tmp/poke-messages.log</string>
    <key>StandardErrorPath</key>
    <string>/tmp/poke-messages.err</string>
  </dict>
</plist>
```

หมายเหตุ:

- คำสั่งนี้จะทำงาน **ทุก 300 วินาที** และ **เมื่อเข้าสู่ระบบ**
- การรันครั้งแรกอาจทำให้เกิดพรอมป์ macOS **Automation** (`osascript` → Messages) อนุมัติพรอมป์เหล่านั้นในเซสชันผู้ใช้เดียวกับที่รัน LaunchAgent

โหลดด้วยคำสั่ง:

```bash
launchctl unload ~/Library/LaunchAgents/com.user.poke-messages.plist 2>/dev/null || true
launchctl load ~/Library/LaunchAgents/com.user.poke-messages.plist
```

## การเริ่มต้นใช้งาน

BlueBubbles พร้อมใช้งานในการเริ่มต้นแบบโต้ตอบ:

```
openclaw onboard
```

วิซาร์ดจะถามข้อมูลต่อไปนี้:

- **Server URL** (จำเป็น): ที่อยู่เซิร์ฟเวอร์ BlueBubbles (เช่น `http://192.168.1.100:1234`)
- **Password** (จำเป็น): รหัสผ่าน API จากการตั้งค่า BlueBubbles Server
- **Webhook path** (ไม่บังคับ): ค่าเริ่มต้นคือ `/bluebubbles-webhook`
- **นโยบาย DM**: pairing, allowlist, open หรือ disabled
- **รายการอนุญาต**: หมายเลขโทรศัพท์ อีเมล หรือเป้าหมายแชต

คุณยังสามารถเพิ่ม BlueBubbles ผ่าน CLI ได้:

```
openclaw channels add bluebubbles --http-url http://192.168.1.100:1234 --password <password>
```

## การควบคุมการเข้าถึง (DM + กลุ่ม)

DM:

- ค่าเริ่มต้น: `channels.bluebubbles.dmPolicy = "pairing"`
- ผู้ส่งที่ไม่รู้จักจะได้รับโค้ดการจับคู่; ข้อความจะถูกเพิกเฉยจนกว่าจะได้รับการอนุมัติ (โค้ดหมดอายุภายใน 1 ชั่วโมง)
- อนุมัติผ่าน:
  - `openclaw pairing list bluebubbles`
  - `openclaw pairing approve bluebubbles <CODE>`
- การจับคู่เป็นการแลกเปลี่ยนโทเค็นค่าเริ่มต้น รายละเอียด: [Pairing](/th/channels/pairing)

กลุ่ม:

- `channels.bluebubbles.groupPolicy = open | allowlist | disabled` (ค่าเริ่มต้น: `allowlist`)
- `channels.bluebubbles.groupAllowFrom` ควบคุมว่าใครสามารถทริกเกอร์ในกลุ่มได้เมื่อมีการตั้งค่า `allowlist`

### การเพิ่มชื่อผู้ติดต่อ (macOS, ไม่บังคับ)

Webhook กลุ่มของ BlueBubbles มักมีเพียงที่อยู่ผู้เข้าร่วมแบบดิบเท่านั้น หากคุณต้องการให้บริบท `GroupMembers` แสดงชื่อผู้ติดต่อในเครื่องแทน คุณสามารถเลือกเปิดใช้การเพิ่มข้อมูลจาก Contacts ภายในเครื่องบน macOS ได้:

- `channels.bluebubbles.enrichGroupParticipantsFromContacts = true` เปิดใช้การค้นหา ค่าเริ่มต้น: `false`
- การค้นหาจะทำงานหลังจากการเข้าถึงกลุ่ม การอนุญาตคำสั่ง และ mention gating อนุญาตให้ข้อความผ่านแล้วเท่านั้น
- จะเพิ่มข้อมูลให้เฉพาะผู้เข้าร่วมที่เป็นหมายเลขโทรศัพท์และยังไม่มีชื่อเท่านั้น
- หมายเลขโทรศัพท์ดิบจะยังคงถูกใช้เป็นค่าทดแทนหากไม่พบข้อมูลที่ตรงกันในเครื่อง

```json5
{
  channels: {
    bluebubbles: {
      enrichGroupParticipantsFromContacts: true,
    },
  },
}
```

### Mention gating (กลุ่ม)

BlueBubbles รองรับ mention gating สำหรับแชตกลุ่ม โดยทำงานสอดคล้องกับ iMessage/WhatsApp:

- ใช้ `agents.list[].groupChat.mentionPatterns` (หรือ `messages.groupChat.mentionPatterns`) เพื่อตรวจจับการกล่าวถึง
- เมื่อเปิดใช้ `requireMention` สำหรับกลุ่ม เอเจนต์จะตอบกลับเฉพาะเมื่อมีการกล่าวถึงเท่านั้น
- คำสั่งควบคุมจากผู้ส่งที่ได้รับอนุญาตจะข้าม mention gating

การกำหนดค่ารายกลุ่ม:

```json5
{
  channels: {
    bluebubbles: {
      groupPolicy: "allowlist",
      groupAllowFrom: ["+15555550123"],
      groups: {
        "*": { requireMention: true }, // ค่าเริ่มต้นสำหรับทุกกลุ่ม
        "iMessage;-;chat123": { requireMention: false }, // แทนที่สำหรับกลุ่มเฉพาะ
      },
    },
  },
}
```

### การควบคุมคำสั่ง

- คำสั่งควบคุม (เช่น `/config`, `/model`) ต้องมีการอนุญาต
- ใช้ `allowFrom` และ `groupAllowFrom` เพื่อกำหนดการอนุญาตคำสั่ง
- ผู้ส่งที่ได้รับอนุญาตสามารถรันคำสั่งควบคุมได้แม้ไม่มีการกล่าวถึงในกลุ่ม

### พรอมป์ระบบรายกลุ่ม

แต่ละรายการภายใต้ `channels.bluebubbles.groups.*` รองรับสตริง `systemPrompt` แบบไม่บังคับ ค่านี้จะถูกแทรกเข้าไปในพรอมป์ระบบของเอเจนต์ทุกครั้งที่จัดการข้อความในกลุ่มนั้น เพื่อให้คุณกำหนดบุคลิกหรือนโยบายพฤติกรรมรายกลุ่มได้โดยไม่ต้องแก้ไขพรอมป์ของเอเจนต์:

```json5
{
  channels: {
    bluebubbles: {
      groups: {
        "iMessage;-;chat123": {
          systemPrompt: "ให้ตอบไม่เกิน 3 ประโยค ใช้น้ำเสียงสบาย ๆ ให้สอดคล้องกับกลุ่ม",
        },
      },
    },
  },
}
```

คีย์นี้ตรงกับค่าที่ BlueBubbles รายงานเป็น `chatGuid` / `chatIdentifier` / `chatId` แบบตัวเลขสำหรับกลุ่มนั้น และรายการ wildcard `"*"` จะให้ค่าเริ่มต้นสำหรับทุกกลุ่มที่ไม่มีการจับคู่แบบตรงตัว (รูปแบบเดียวกับที่ใช้โดย `requireMention` และนโยบายเครื่องมือรายกลุ่ม) การจับคู่แบบตรงตัวจะมีลำดับความสำคัญเหนือ wildcard เสมอ DM จะไม่ใช้ฟิลด์นี้; ให้ใช้การปรับแต่งพรอมป์ในระดับเอเจนต์หรือระดับบัญชีแทน

#### ตัวอย่างการใช้งานจริง: การตอบกลับแบบเธรดและรีแอ็กชัน tapback (Private API)

เมื่อเปิดใช้ BlueBubbles Private API ข้อความขาเข้าจะมาพร้อมรหัสข้อความแบบสั้น (เช่น `[[reply_to:5]]`) และเอเจนต์สามารถเรียก `action=reply` เพื่อตอบแบบเธรดไปยังข้อความที่ระบุ หรือ `action=react` เพื่อใส่ tapback ได้ `systemPrompt` รายกลุ่มเป็นวิธีที่เชื่อถือได้ในการทำให้เอเจนต์เลือกใช้เครื่องมือที่ถูกต้อง:

```json5
{
  channels: {
    bluebubbles: {
      groups: {
        "iMessage;+;chat-family": {
          systemPrompt: [
            "เมื่อจะตอบในกลุ่มนี้ ให้เรียก action=reply พร้อม",
            "messageId แบบ [[reply_to:N]] จากบริบทเสมอ เพื่อให้คำตอบของคุณอยู่ในเธรด",
            "ใต้ข้อความที่เป็นตัวกระตุ้น ห้ามส่งข้อความใหม่ที่ไม่เชื่อมโยง",
            "",
            "สำหรับการตอบรับสั้น ๆ ('ok', 'got it', 'on it') ให้ใช้",
            "action=react พร้อมอีโมจิ tapback ที่เหมาะสม (❤️, 👍, 😂, ‼️, ❓)",
            "แทนการส่งข้อความตอบกลับ",
          ].join(" "),
        },
      },
    },
  },
}
```

ทั้งรีแอ็กชัน tapback และการตอบกลับแบบเธรดต้องใช้ BlueBubbles Private API; ดูกลไกพื้นฐานได้ที่ [Advanced actions](#advanced-actions) และ [Message IDs](#message-ids-short-vs-full)

## ACP conversation bindings

แชต BlueBubbles สามารถเปลี่ยนให้เป็น ACP workspace แบบคงอยู่ได้โดยไม่ต้องเปลี่ยนเลเยอร์การขนส่ง

โฟลว์การทำงานแบบรวดเร็วสำหรับผู้ปฏิบัติงาน:

- รัน `/acp spawn codex --bind here` ภายใน DM หรือแชตกลุ่มที่ได้รับอนุญาต
- ข้อความถัดไปในบทสนทนา BlueBubbles เดียวกันนั้นจะถูกส่งเส้นทางไปยังเซสชัน ACP ที่สร้างขึ้น
- `/new` และ `/reset` จะรีเซ็ตเซสชัน ACP ที่ bind ไว้เดิมในตำแหน่งเดิม
- `/acp close` จะปิดเซสชัน ACP และลบ binding

ยังรองรับ binding แบบคงอยู่ที่กำหนดค่าไว้ผ่านรายการ `bindings[]` ระดับบนสุดที่มี `type: "acp"` และ `match.channel: "bluebubbles"` ด้วย

`match.peer.id` สามารถใช้รูปแบบเป้าหมาย BlueBubbles ที่รองรับแบบใดก็ได้:

- handle DM แบบ normalized เช่น `+15555550123` หรือ `user@example.com`
- `chat_id:<id>`
- `chat_guid:<guid>`
- `chat_identifier:<identifier>`

สำหรับ binding ของกลุ่มที่เสถียร ให้ใช้ `chat_id:*` หรือ `chat_identifier:*`

ตัวอย่าง:

```json5
{
  agents: {
    list: [
      {
        id: "codex",
        runtime: {
          type: "acp",
          acp: { agent: "codex", backend: "acpx", mode: "persistent" },
        },
      },
    ],
  },
  bindings: [
    {
      type: "acp",
      agentId: "codex",
      match: {
        channel: "bluebubbles",
        accountId: "default",
        peer: { kind: "dm", id: "+15555550123" },
      },
      acp: { label: "codex-imessage" },
    },
  ],
}
```

ดู [ACP Agents](/th/tools/acp-agents) สำหรับพฤติกรรมการ bind ACP ที่ใช้ร่วมกัน

## การพิมพ์ + ใบตอบรับการอ่าน

- **ตัวบ่งชี้การพิมพ์**: ส่งโดยอัตโนมัติก่อนและระหว่างการสร้างคำตอบ
- **ใบตอบรับการอ่าน**: ควบคุมโดย `channels.bluebubbles.sendReadReceipts` (ค่าเริ่มต้น: `true`)
- **ตัวบ่งชี้การพิมพ์**: OpenClaw ส่งเหตุการณ์เริ่มพิมพ์; BlueBubbles จะล้างสถานะการพิมพ์อัตโนมัติเมื่อส่งหรือหมดเวลา (การหยุดด้วยตนเองผ่าน DELETE ไม่น่าเชื่อถือ)

```json5
{
  channels: {
    bluebubbles: {
      sendReadReceipts: false, // ปิดใช้งานใบตอบรับการอ่าน
    },
  },
}
```

## การดำเนินการขั้นสูง

BlueBubbles รองรับการดำเนินการข้อความขั้นสูงเมื่อเปิดใช้ในการกำหนดค่า:

```json5
{
  channels: {
    bluebubbles: {
      actions: {
        reactions: true, // tapback (ค่าเริ่มต้น: true)
        edit: true, // แก้ไขข้อความที่ส่งแล้ว (macOS 13+, ใช้งานไม่ได้บน macOS 26 Tahoe)
        unsend: true, // ยกเลิกส่งข้อความ (macOS 13+)
        reply: true, // ตอบกลับแบบเธรดด้วย GUID ของข้อความ
        sendWithEffect: true, // เอฟเฟกต์ข้อความ (slam, loud ฯลฯ)
        renameGroup: true, // เปลี่ยนชื่อแชตกลุ่ม
        setGroupIcon: true, // ตั้งค่าไอคอน/รูปภาพของแชตกลุ่ม (ไม่เสถียรบน macOS 26 Tahoe)
        addParticipant: true, // เพิ่มผู้เข้าร่วมในกลุ่ม
        removeParticipant: true, // นำผู้เข้าร่วมออกจากกลุ่ม
        leaveGroup: true, // ออกจากแชตกลุ่ม
        sendAttachment: true, // ส่งไฟล์แนบ/สื่อ
      },
    },
  },
}
```

การดำเนินการที่ใช้ได้:

- **react**: เพิ่ม/ลบรีแอ็กชัน tapback (`messageId`, `emoji`, `remove`) ชุด tapback ดั้งเดิมของ iMessage คือ `love`, `like`, `dislike`, `laugh`, `emphasize` และ `question` เมื่อเอเจนต์เลือกอีโมจิที่อยู่นอกชุดนี้ (เช่น `👀`) เครื่องมือรีแอ็กชันจะ fallback ไปใช้ `love` เพื่อให้ tapback ยังแสดงผลแทนที่จะทำให้ทั้งคำขอล้มเหลว รีแอ็กชันตอบรับที่กำหนดค่าไว้จะยังคงตรวจสอบอย่างเคร่งครัดและแสดงข้อผิดพลาดเมื่อเป็นค่าที่ไม่รู้จัก
- **edit**: แก้ไขข้อความที่ส่งแล้ว (`messageId`, `text`)
- **unsend**: ยกเลิกส่งข้อความ (`messageId`)
- **reply**: ตอบกลับข้อความที่ระบุ (`messageId`, `text`, `to`)
- **sendWithEffect**: ส่งพร้อมเอฟเฟกต์ iMessage (`text`, `to`, `effectId`)
- **renameGroup**: เปลี่ยนชื่อแชตกลุ่ม (`chatGuid`, `displayName`)
- **setGroupIcon**: ตั้งค่าไอคอน/รูปภาพของแชตกลุ่ม (`chatGuid`, `media`) — ไม่เสถียรบน macOS 26 Tahoe (API อาจรายงานว่าสำเร็จแต่ไอคอนไม่ซิงก์)
- **addParticipant**: เพิ่มบุคคลเข้าในกลุ่ม (`chatGuid`, `address`)
- **removeParticipant**: นำบุคคลออกจากกลุ่ม (`chatGuid`, `address`)
- **leaveGroup**: ออกจากแชตกลุ่ม (`chatGuid`)
- **upload-file**: ส่งสื่อ/ไฟล์ (`to`, `buffer`, `filename`, `asVoice`)
  - บันทึกเสียง: ตั้งค่า `asVoice: true` พร้อมเสียงแบบ **MP3** หรือ **CAF** เพื่อส่งเป็นข้อความเสียงของ iMessage BlueBubbles จะแปลง MP3 → CAF เมื่อส่งบันทึกเสียง
- ชื่อแฝงแบบเดิม: `sendAttachment` ยังใช้ได้ แต่ `upload-file` คือชื่อการดำเนินการแบบมาตรฐาน

### รหัสข้อความ (แบบสั้นเทียบกับแบบเต็ม)

OpenClaw อาจแสดงรหัสข้อความแบบ _สั้น_ (เช่น `1`, `2`) เพื่อประหยัดโทเค็น

- `MessageSid` / `ReplyToId` สามารถเป็นรหัสแบบสั้นได้
- `MessageSidFull` / `ReplyToIdFull` มีรหัสเต็มของ provider
- รหัสแบบสั้นเก็บไว้ในหน่วยความจำ; อาจหมดอายุเมื่อรีสตาร์ตหรือมีการล้างแคช
- การดำเนินการรองรับ `messageId` ทั้งแบบสั้นและแบบเต็ม แต่รหัสแบบสั้นจะเกิดข้อผิดพลาดหากไม่พร้อมใช้งานแล้ว

ใช้รหัสแบบเต็มสำหรับระบบอัตโนมัติและการจัดเก็บแบบถาวร:

- เทมเพลต: `{{MessageSidFull}}`, `{{ReplyToIdFull}}`
- บริบท: `MessageSidFull` / `ReplyToIdFull` ใน payload ขาเข้า

ดู [Configuration](/th/gateway/configuration) สำหรับตัวแปรเทมเพลต

## การรวม DM ที่ถูกแยกตอนส่ง (คำสั่ง + URL ในการพิมพ์ครั้งเดียว)

เมื่อผู้ใช้พิมพ์คำสั่งและ URL พร้อมกันใน iMessage — เช่น `Dump https://example.com/article` — Apple จะแยกการส่งออกเป็น **การส่ง Webhook สองรายการแยกกัน**:

1. ข้อความตัวอักษร (`"Dump"`)
2. บอลลูนพรีวิว URL (`"https://..."`) พร้อมภาพ OG-preview เป็นไฟล์แนบ

Webhook ทั้งสองจะมาถึง OpenClaw ห่างกันประมาณ ~0.8-2.0 วินาทีในระบบส่วนใหญ่ หากไม่มีการรวม เอเจนต์จะได้รับเฉพาะคำสั่งในเทิร์นที่ 1 ตอบกลับ (มักเป็น "ส่ง URL มาให้ฉัน") และจะเห็น URL ในเทิร์นที่ 2 เท่านั้น — ซึ่งตอนนั้นบริบทของคำสั่งหายไปแล้ว

`channels.bluebubbles.coalesceSameSenderDms` ใช้เปิดให้ DM รวม Webhook ต่อเนื่องจากผู้ส่งคนเดียวกันเป็นเทิร์นเดียวของเอเจนต์ แชตกลุ่มจะยังคงใช้คีย์ต่อข้อความเหมือนเดิมเพื่อรักษาโครงสร้างเทิร์นแบบหลายผู้ใช้

### ควรเปิดใช้เมื่อใด

เปิดใช้เมื่อ:

- คุณมี Skills ที่คาดหวัง `command + payload` ในข้อความเดียวกัน (dump, paste, save, queue ฯลฯ)
- ผู้ใช้ของคุณวาง URL รูปภาพ หรือเนื้อหายาวพร้อมกับคำสั่ง
- คุณยอมรับเวลาแฝงที่เพิ่มขึ้นของเทิร์น DM ได้ (ดูด้านล่าง)

ปล่อยปิดไว้เมื่อ:

- คุณต้องการเวลาแฝงต่ำสุดสำหรับทริกเกอร์ DM ที่เป็นคำเดี่ยว
- ทุกโฟลว์ของคุณเป็นคำสั่งแบบครั้งเดียวโดยไม่มี payload ตามมา

### การเปิดใช้

```json5
{
  channels: {
    bluebubbles: {
      coalesceSameSenderDms: true, // เลือกเปิดใช้ (ค่าเริ่มต้น: false)
    },
  },
}
```

เมื่อเปิดแฟล็กนี้และไม่มี `messages.inbound.byChannel.bluebubbles` แบบชัดเจน หน้าต่าง debounce จะขยายเป็น **2500 ms** (ค่าเริ่มต้นสำหรับแบบไม่รวมคือ 500 ms) จำเป็นต้องใช้หน้าต่างที่กว้างขึ้น — จังหวะการส่งแยกของ Apple ที่ 0.8-2.0 วินาทีไม่พอดีกับค่าเริ่มต้นที่แคบกว่า

หากต้องการปรับหน้าต่างเอง:

```json5
{
  messages: {
    inbound: {
      byChannel: {
        // 2500 ms ใช้ได้กับระบบส่วนใหญ่; เพิ่มเป็น 4000 ms หาก Mac ของคุณช้า
        // หรืออยู่ภายใต้แรงกดดันด้านหน่วยความจำ (ช่องว่างที่สังเกตได้อาจยืดเกิน 2 วินาทีได้)
        bluebubbles: 2500,
      },
    },
  },
}
```

### ข้อแลกเปลี่ยน

- **เวลาแฝงที่เพิ่มขึ้นสำหรับคำสั่งควบคุม DM** เมื่อเปิดแฟล็กนี้ ข้อความคำสั่งควบคุม DM (เช่น `Dump`, `Save` ฯลฯ) จะรอจนถึงขนาดหน้าต่าง debounce ก่อนส่งต่อ เผื่อว่าจะมี Webhook payload ตามมา คำสั่งในแชตกลุ่มยังคงส่งต่อทันที
- **ผลลัพธ์ที่รวมกันมีขอบเขตจำกัด** — ข้อความที่รวมกันจำกัดที่ 4000 อักขระ พร้อมเครื่องหมาย `…[truncated]` อย่างชัดเจน; ไฟล์แนบจำกัดที่ 20; รายการต้นทางจำกัดที่ 10 (เก็บรายการแรกบวกกับรายการล่าสุดเมื่อเกินจากนั้น) ทุก `messageId` ต้นทางยังคงถูกส่งไปยัง inbound-dedupe ดังนั้นการ replay ภายหลังจาก MessagePoller ของเหตุการณ์ใดเหตุการณ์หนึ่งจะยังถูกจดจำว่าเป็นรายการซ้ำ
- **เลือกเปิดใช้ได้แบบรายช่องทาง** ช่องทางอื่น (Telegram, WhatsApp, Slack, …) จะไม่ได้รับผลกระทบ

### สถานการณ์และสิ่งที่เอเจนต์เห็น

| สิ่งที่ผู้ใช้พิมพ์                                                   | สิ่งที่ Apple ส่งมา         | ปิดแฟล็ก (ค่าเริ่มต้น)                   | เปิดแฟล็ก + หน้าต่าง 2500 ms                                          |
| -------------------------------------------------------------------- | -------------------------- | ---------------------------------------- | ----------------------------------------------------------------------- |
| `Dump https://example.com` (ส่งครั้งเดียว)                           | 2 Webhook ห่างกัน ~1 วินาที | สองเทิร์นของเอเจนต์: มีแค่ "Dump" แล้วจึงตามด้วย URL | หนึ่งเทิร์น: ข้อความที่รวมกัน `Dump https://example.com`              |
| `Save this 📎image.jpg caption` (ไฟล์แนบ + ข้อความ)                  | 2 Webhook                  | สองเทิร์น                                | หนึ่งเทิร์น: ข้อความ + รูปภาพ                                          |
| `/status` (คำสั่งเดี่ยว)                                             | 1 Webhook                  | ส่งต่อทันที                               | **รอจนถึงขนาดหน้าต่าง แล้วจึงส่งต่อ**                                   |
| วาง URL เพียงอย่างเดียว                                              | 1 Webhook                  | ส่งต่อทันที                               | ส่งต่อทันที (มีเพียงหนึ่งรายการใน bucket)                              |
| ข้อความ + URL ส่งเป็นสองข้อความแยกกันโดยตั้งใจ ห่างกันหลายนาที       | 2 Webhook นอกหน้าต่าง      | สองเทิร์น                                | สองเทิร์น (หน้าต่างหมดอายุระหว่างสองรายการ)                            |
| ส่งถี่มากอย่างรวดเร็ว (>10 DM ขนาดเล็กภายในหน้าต่าง)                | N Webhook                  | N เทิร์น                                  | หนึ่งเทิร์น ผลลัพธ์มีขอบเขตจำกัด (ใช้รายการแรก + ล่าสุด พร้อมใช้เพดานข้อความ/ไฟล์แนบ) |

### การแก้ไขปัญหาการรวม split-send

หากเปิดแฟล็กแล้วแต่ split-send ยังมาเป็นสองเทิร์น ให้ตรวจสอบแต่ละชั้นดังนี้:

1. **โหลดการกำหนดค่าจริงแล้ว**

   ```
   grep coalesceSameSenderDms ~/.openclaw/openclaw.json
   ```

   จากนั้น `openclaw gateway restart` — ระบบจะอ่านแฟล็กนี้ตอนสร้าง debouncer-registry

2. **หน้าต่าง debounce กว้างพอสำหรับระบบของคุณ** ดูล็อกเซิร์ฟเวอร์ BlueBubbles ที่ `~/Library/Logs/bluebubbles-server/main.log`:

   ```
   grep -E "Dispatching event to webhook" main.log | tail -20
   ```

   วัดช่วงห่างระหว่างการส่งข้อความสไตล์ `"Dump"` กับการส่ง `"https://..."; Attachments:` ที่ตามมา เพิ่มค่า `messages.inbound.byChannel.bluebubbles` ให้ครอบคลุมช่วงห่างนั้นอย่างสบาย

3. **เวลาใน JSONL ของเซสชัน ≠ เวลาที่ Webhook มาถึง** timestamp ของเหตุการณ์ในเซสชัน (`~/.openclaw/agents/<id>/sessions/*.jsonl`) สะท้อนเวลาที่ Gateway ส่งข้อความให้เอเจนต์ **ไม่ใช่** เวลาที่ Webhook มาถึง หากข้อความที่สองถูกคิวและติดแท็ก `[Queued messages while agent was busy]` แปลว่าเทิร์นแรกยังทำงานอยู่ตอนที่ Webhook ที่สองมาถึง — bucket การรวมถูก flush ไปแล้ว ปรับหน้าต่างโดยอิงตามล็อกเซิร์ฟเวอร์ BB ไม่ใช่ล็อกเซสชัน

4. **แรงกดดันด้านหน่วยความจำทำให้การส่งคำตอบช้าลง** บนเครื่องขนาดเล็กกว่า (8 GB) เทิร์นของเอเจนต์อาจใช้เวลานานจน bucket การรวมถูก flush ก่อนที่คำตอบจะเสร็จ และ URL ไปลงเป็นเทิร์นที่สองในคิว ตรวจสอบ `memory_pressure` และ `ps -o rss -p $(pgrep openclaw-gateway)`; หาก Gateway ใช้ RSS เกิน ~500 MB และตัวบีบอัดกำลังทำงาน ให้ปิดโปรเซสหนักอื่น ๆ หรือย้ายไปใช้โฮสต์ที่ใหญ่กว่า

5. **การส่งแบบอ้างอิงคำตอบเป็นอีกเส้นทางหนึ่ง** หากผู้ใช้แตะ `Dump` เป็น **การตอบกลับ** ต่อ URL-balloon เดิม (iMessage จะแสดงป้าย "1 Reply" บนบอลลูน Dump) URL จะอยู่ใน `replyToBody` ไม่ได้อยู่ใน Webhook รายการที่สอง การรวมจึงไม่เกี่ยวข้อง — นี่เป็นเรื่องของ skill/prompt ไม่ใช่เรื่องของ debouncer

## Block streaming

ควบคุมว่าคำตอบจะถูกส่งเป็นข้อความเดียวหรือสตรีมเป็นบล็อก:

```json5
{
  channels: {
    bluebubbles: {
      blockStreaming: true, // เปิดใช้ block streaming (ปิดโดยค่าเริ่มต้น)
    },
  },
}
```

## สื่อ + ขีดจำกัด

- ไฟล์แนบขาเข้าจะถูกดาวน์โหลดและจัดเก็บในแคชสื่อ
- จำกัดขนาดสื่อผ่าน `channels.bluebubbles.mediaMaxMb` สำหรับสื่อขาเข้าและขาออก (ค่าเริ่มต้น: 8 MB)
- ข้อความขาออกจะถูกแบ่งเป็นช่วงตาม `channels.bluebubbles.textChunkLimit` (ค่าเริ่มต้น: 4000 อักขระ)

## เอกสารอ้างอิงการกำหนดค่า

การกำหนดค่าแบบเต็ม: [Configuration](/th/gateway/configuration)

ตัวเลือก provider:

- `channels.bluebubbles.enabled`: เปิด/ปิดใช้งานช่องทาง
- `channels.bluebubbles.serverUrl`: URL ฐานของ BlueBubbles REST API
- `channels.bluebubbles.password`: รหัสผ่าน API
- `channels.bluebubbles.webhookPath`: พาธ endpoint ของ Webhook (ค่าเริ่มต้น: `/bluebubbles-webhook`)
- `channels.bluebubbles.dmPolicy`: `pairing | allowlist | open | disabled` (ค่าเริ่มต้น: `pairing`)
- `channels.bluebubbles.allowFrom`: allowlist สำหรับ DM (handle, อีเมล, หมายเลข E.164, `chat_id:*`, `chat_guid:*`)
- `channels.bluebubbles.groupPolicy`: `open | allowlist | disabled` (ค่าเริ่มต้น: `allowlist`)
- `channels.bluebubbles.groupAllowFrom`: allowlist ของผู้ส่งในกลุ่ม
- `channels.bluebubbles.enrichGroupParticipantsFromContacts`: บน macOS สามารถเลือกเพิ่มข้อมูลให้ผู้เข้าร่วมกลุ่มที่ไม่มีชื่อจาก Contacts ภายในเครื่องได้หลังผ่าน gating แล้ว ค่าเริ่มต้น: `false`
- `channels.bluebubbles.groups`: การกำหนดค่ารายกลุ่ม (`requireMention` เป็นต้น)
- `channels.bluebubbles.sendReadReceipts`: ส่งใบตอบรับการอ่าน (ค่าเริ่มต้น: `true`)
- `channels.bluebubbles.blockStreaming`: เปิดใช้ block streaming (ค่าเริ่มต้น: `false`; จำเป็นสำหรับการตอบกลับแบบสตรีม)
- `channels.bluebubbles.textChunkLimit`: ขนาด chunk ขาออกเป็นจำนวนอักขระ (ค่าเริ่มต้น: 4000)
- `channels.bluebubbles.sendTimeoutMs`: timeout ต่อคำขอเป็นมิลลิวินาทีสำหรับการส่งข้อความขาออกผ่าน `/api/v1/message/text` (ค่าเริ่มต้น: 30000) เพิ่มค่านี้บนระบบ macOS 26 ที่การส่ง iMessage ผ่าน Private API อาจค้างอยู่ในเฟรมเวิร์ก iMessage นานกว่า 60 วินาที; ตัวอย่างเช่น `45000` หรือ `60000` ขณะนี้การตรวจสอบ แชตลุคอัป รีแอ็กชัน การแก้ไข และการตรวจสุขภาพยังคงใช้ค่าเริ่มต้นที่สั้นกว่า 10 วินาที; มีแผนขยายให้ครอบคลุมรีแอ็กชันและการแก้ไขในลำดับถัดไป การแทนที่รายบัญชี: `channels.bluebubbles.accounts.<accountId>.sendTimeoutMs`
- `channels.bluebubbles.chunkMode`: `length` (ค่าเริ่มต้น) จะแบ่งเฉพาะเมื่อเกิน `textChunkLimit`; `newline` จะแบ่งตามบรรทัดว่าง (ขอบเขตย่อหน้า) ก่อนแบ่งตามความยาว
- `channels.bluebubbles.mediaMaxMb`: เพดานสื่อขาเข้า/ขาออกเป็น MB (ค่าเริ่มต้น: 8)
- `channels.bluebubbles.mediaLocalRoots`: allowlist แบบชัดเจนของไดเรกทอรีภายในเครื่องแบบ absolute ที่อนุญาตสำหรับพาธสื่อภายในเครื่องขาออก การส่งพาธภายในเครื่องจะถูกปฏิเสธโดยค่าเริ่มต้นเว้นแต่จะกำหนดค่านี้ไว้ การแทนที่รายบัญชี: `channels.bluebubbles.accounts.<accountId>.mediaLocalRoots`
- `channels.bluebubbles.coalesceSameSenderDms`: รวม Webhook DM ต่อเนื่องจากผู้ส่งคนเดียวกันเป็นหนึ่งเทิร์นของเอเจนต์ เพื่อให้การส่งแบบแยกข้อความ+URL ของ Apple มาถึงเป็นข้อความเดียว (ค่าเริ่มต้น: `false`) ดู [การรวม DM ที่ถูกแยกตอนส่ง](#coalescing-split-send-dms-command--url-in-one-composition) สำหรับสถานการณ์ การปรับหน้าต่าง และข้อแลกเปลี่ยน เมื่อเปิดใช้โดยไม่มี `messages.inbound.byChannel.bluebubbles` แบบชัดเจน ระบบจะขยายหน้าต่าง debounce ขาเข้าเริ่มต้นจาก 500 ms เป็น 2500 ms
- `channels.bluebubbles.historyLimit`: จำนวนข้อความกลุ่มสูงสุดสำหรับบริบท (0 คือปิดใช้งาน)
- `channels.bluebubbles.dmHistoryLimit`: ขีดจำกัดประวัติ DM
- `channels.bluebubbles.actions`: เปิด/ปิดการดำเนินการเฉพาะ
- `channels.bluebubbles.accounts`: การกำหนดค่าแบบหลายบัญชี

ตัวเลือกส่วนกลางที่เกี่ยวข้อง:

- `agents.list[].groupChat.mentionPatterns` (หรือ `messages.groupChat.mentionPatterns`)
- `messages.responsePrefix`

## การระบุที่อยู่ / เป้าหมายการส่ง

ควรใช้ `chat_guid` สำหรับการกำหนดเส้นทางที่เสถียร:

- `chat_guid:iMessage;-;+15555550123` (แนะนำสำหรับกลุ่ม)
- `chat_id:123`
- `chat_identifier:...`
- handle โดยตรง: `+15555550123`, `user@example.com`
  - หาก handle โดยตรงยังไม่มีแชต DM อยู่ OpenClaw จะสร้างแชตใหม่ผ่าน `POST /api/v1/chat/new` ซึ่งต้องเปิดใช้ BlueBubbles Private API

### การกำหนดเส้นทาง iMessage เทียบกับ SMS

เมื่อ handle เดียวกันมีทั้งแชต iMessage และแชต SMS อยู่บน Mac (เช่น หมายเลขโทรศัพท์ที่ลงทะเบียนกับ iMessage แต่เคยได้รับข้อความ fallback แบบบับเบิลสีเขียวด้วย) OpenClaw จะเลือกแชต iMessage ก่อนและจะไม่ลดระดับไปเป็น SMS แบบเงียบ ๆ หากต้องการบังคับใช้แชต SMS ให้ใช้คำนำหน้าเป้าหมาย `sms:` แบบชัดเจน (เช่น `sms:+15555550123`) สำหรับ handle ที่ไม่มีแชต iMessage ที่ตรงกัน ระบบจะยังส่งผ่านแชตที่ BlueBubbles รายงานมา

## ความปลอดภัย

- คำขอ Webhook จะได้รับการยืนยันตัวตนโดยเปรียบเทียบ query param หรือ header ของ `guid`/`password` กับ `channels.bluebubbles.password`
- เก็บรหัสผ่าน API และ endpoint ของ Webhook เป็นความลับ (ให้ปฏิบัติต่อสิ่งเหล่านี้เหมือนข้อมูลรับรอง)
- ไม่มีการข้ามการยืนยันตัวตน Webhook ของ BlueBubbles สำหรับ localhost หากคุณทำ proxy ทราฟฟิก Webhook ให้คงรหัสผ่าน BlueBubbles ไว้ในคำขอตลอดเส้นทาง `gateway.trustedProxies` ใช้แทน `channels.bluebubbles.password` ในกรณีนี้ไม่ได้ ดู [Gateway security](/th/gateway/security#reverse-proxy-configuration)
- เปิดใช้ HTTPS + กฎไฟร์วอลล์บนเซิร์ฟเวอร์ BlueBubbles หากมีการเปิดให้เข้าถึงจากนอก LAN ของคุณ

## การแก้ไขปัญหา

- หากเหตุการณ์การพิมพ์/การอ่านหยุดทำงาน ให้ตรวจสอบล็อก Webhook ของ BlueBubbles และยืนยันว่าพาธ Gateway ตรงกับ `channels.bluebubbles.webhookPath`
- โค้ดการจับคู่จะหมดอายุหลังหนึ่งชั่วโมง; ใช้ `openclaw pairing list bluebubbles` และ `openclaw pairing approve bluebubbles <code>`
- รีแอ็กชันต้องใช้ BlueBubbles private API (`POST /api/v1/message/react`); ตรวจสอบให้แน่ใจว่าเวอร์ชันเซิร์ฟเวอร์รองรับ
- การแก้ไข/ยกเลิกส่งต้องใช้ macOS 13+ และ BlueBubbles server เวอร์ชันที่เข้ากันได้ บน macOS 26 (Tahoe) ขณะนี้การแก้ไขใช้งานไม่ได้เนื่องจากการเปลี่ยนแปลงของ private API
- การอัปเดตไอคอนกลุ่มอาจไม่เสถียรบน macOS 26 (Tahoe): API อาจรายงานว่าสำเร็จแต่ไอคอนใหม่ไม่ซิงก์
- OpenClaw จะซ่อนการดำเนินการที่ทราบว่าใช้งานไม่ได้โดยอัตโนมัติตามเวอร์ชัน macOS ของเซิร์ฟเวอร์ BlueBubbles หากยังเห็น edit บน macOS 26 (Tahoe) ให้ปิดเองด้วย `channels.bluebubbles.actions.edit=false`
- เปิดใช้ `coalesceSameSenderDms` แล้วแต่ split-send (เช่น `Dump` + URL) ยังมาถึงเป็นสองเทิร์น: ดูรายการตรวจสอบ [การแก้ไขปัญหาการรวม split-send](#split-send-coalescing-troubleshooting) — สาเหตุทั่วไปคือหน้าต่าง debounce แคบเกินไป อ่าน timestamp ใน session log ผิดว่าเป็นเวลาที่ Webhook มาถึง หรือเป็นการส่งแบบอ้างอิงคำตอบ (ซึ่งใช้ `replyToBody` ไม่ใช่ Webhook รายการที่สอง)
- สำหรับข้อมูลสถานะ/สุขภาพ: `openclaw status --all` หรือ `openclaw status --deep`

สำหรับเอกสารอ้างอิงเวิร์กโฟลว์ช่องทางทั่วไป ดู [Channels](/th/channels) และคู่มือ [Plugins](/th/tools/plugin)

## ที่เกี่ยวข้อง

- [Channels Overview](/th/channels) — ช่องทางที่รองรับทั้งหมด
- [Pairing](/th/channels/pairing) — การยืนยันตัวตน DM และโฟลว์การจับคู่
- [Groups](/th/channels/groups) — พฤติกรรมแชตกลุ่มและ mention gating
- [Channel Routing](/th/channels/channel-routing) — การกำหนดเส้นทางเซสชันสำหรับข้อความ
- [Security](/th/gateway/security) — โมเดลการเข้าถึงและการเสริมความปลอดภัย
