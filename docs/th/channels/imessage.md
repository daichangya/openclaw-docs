---
read_when:
    - การตั้งค่าการรองรับ iMessage
    - การดีบักการส่ง/รับของ iMessage
summary: รองรับ iMessage แบบ legacy ผ่าน imsg (JSON-RPC ผ่าน stdio) การตั้งค่าใหม่ควรใช้ BlueBubbles
title: iMessage
x-i18n:
    generated_at: "2026-04-23T05:25:51Z"
    model: gpt-5.4
    provider: openai
    source_hash: fb9cc5a0bd4fbc7ff6f792e737bc4302a67f9ab6aa8231ff6f751fe6d732ca5d
    source_path: channels/imessage.md
    workflow: 15
---

# iMessage (legacy: imsg)

<Warning>
สำหรับการติดตั้งใช้งาน iMessage ใหม่ ให้ใช้ <a href="/th/channels/bluebubbles">BlueBubbles</a>

การผสานรวม `imsg` เป็นระบบ legacy และอาจถูกนำออกในรุ่นถัดไปในอนาคต
</Warning>

สถานะ: การผสานรวมกับ CLI ภายนอกแบบ legacy Gateway จะสปิน `imsg rpc` และสื่อสารผ่าน JSON-RPC บน stdio (ไม่มี daemon/port แยกต่างหาก)

<CardGroup cols={3}>
  <Card title="BlueBubbles (recommended)" icon="message-circle" href="/th/channels/bluebubbles">
    แนวทาง iMessage ที่แนะนำสำหรับการตั้งค่าใหม่
  </Card>
  <Card title="Pairing" icon="link" href="/th/channels/pairing">
    DM ของ iMessage ใช้โหมด pairing เป็นค่าเริ่มต้น
  </Card>
  <Card title="Configuration reference" icon="settings" href="/th/gateway/configuration-reference#imessage">
    เอกสารอ้างอิงฟิลด์ iMessage แบบครบถ้วน
  </Card>
</CardGroup>

## การตั้งค่าอย่างรวดเร็ว

<Tabs>
  <Tab title="Local Mac (fast path)">
    <Steps>
      <Step title="ติดตั้งและตรวจสอบ imsg">

```bash
brew install steipete/tap/imsg
imsg rpc --help
```

      </Step>

      <Step title="กำหนดค่า OpenClaw">

```json5
{
  channels: {
    imessage: {
      enabled: true,
      cliPath: "/usr/local/bin/imsg",
      dbPath: "/Users/user/Library/Messages/chat.db",
    },
  },
}
```

      </Step>

      <Step title="เริ่ม Gateway">

```bash
openclaw gateway
```

      </Step>

      <Step title="อนุมัติ DM pairing ครั้งแรก (ค่าเริ่มต้นของ dmPolicy)">

```bash
openclaw pairing list imessage
openclaw pairing approve imessage <CODE>
```

        คำขอ Pairing จะหมดอายุหลัง 1 ชั่วโมง
      </Step>
    </Steps>

  </Tab>

  <Tab title="Remote Mac over SSH">
    OpenClaw ต้องการเพียง `cliPath` ที่เข้ากันได้กับ stdio เท่านั้น ดังนั้นคุณจึงสามารถชี้ `cliPath` ไปยังสคริปต์ wrapper ที่ SSH ไปยัง Mac ระยะไกลแล้วรัน `imsg` ได้

```bash
#!/usr/bin/env bash
exec ssh -T gateway-host imsg "$@"
```

    คอนฟิกที่แนะนำเมื่อเปิดใช้งานไฟล์แนบ:

```json5
{
  channels: {
    imessage: {
      enabled: true,
      cliPath: "~/.openclaw/scripts/imsg-ssh",
      remoteHost: "user@gateway-host", // ใช้สำหรับการดึงไฟล์แนบผ่าน SCP
      includeAttachments: true,
      // ไม่บังคับ: override รากพาธไฟล์แนบที่อนุญาต
      // ค่าเริ่มต้นรวม /Users/*/Library/Messages/Attachments
      attachmentRoots: ["/Users/*/Library/Messages/Attachments"],
      remoteAttachmentRoots: ["/Users/*/Library/Messages/Attachments"],
    },
  },
}
```

    หากไม่ได้ตั้งค่า `remoteHost` ไว้ OpenClaw จะพยายามตรวจหาอัตโนมัติโดยการแยกวิเคราะห์สคริปต์ SSH wrapper
    `remoteHost` ต้องเป็น `host` หรือ `user@host` (ไม่มีช่องว่างหรือออปชัน SSH)
    OpenClaw ใช้การตรวจสอบ host key แบบเข้มงวดสำหรับ SCP ดังนั้น host key ของรีเลย์จะต้องมีอยู่แล้วใน `~/.ssh/known_hosts`
    พาธไฟล์แนบจะถูกตรวจสอบกับรากพาธที่อนุญาต (`attachmentRoots` / `remoteAttachmentRoots`)

  </Tab>
</Tabs>

## ข้อกำหนดและสิทธิ์การเข้าถึง (macOS)

- ต้องลงชื่อเข้าใช้ Messages บน Mac ที่รัน `imsg`
- ต้องมีสิทธิ์ Full Disk Access สำหรับบริบทของโปรเซสที่รัน OpenClaw/`imsg` (การเข้าถึงฐานข้อมูล Messages)
- ต้องมีสิทธิ์ Automation เพื่อส่งข้อความผ่าน Messages.app

<Tip>
สิทธิ์จะถูกให้แยกตามบริบทของโปรเซส หาก gateway ทำงานแบบ headless (LaunchAgent/SSH) ให้รันคำสั่งแบบโต้ตอบหนึ่งครั้งในบริบทเดียวกันนั้นเพื่อให้มีการแสดง prompt ขอสิทธิ์:

```bash
imsg chats --limit 1
# หรือ
imsg send <handle> "test"
```

</Tip>

## การควบคุมการเข้าถึงและการกำหนดเส้นทาง

<Tabs>
  <Tab title="DM policy">
    `channels.imessage.dmPolicy` ควบคุมข้อความโดยตรง:

    - `pairing` (ค่าเริ่มต้น)
    - `allowlist`
    - `open` (ต้องให้ `allowFrom` รวม `"*"`)
    - `disabled`

    ฟิลด์ allowlist: `channels.imessage.allowFrom`

    รายการใน Allowlist สามารถเป็น handle หรือเป้าหมายแชต (`chat_id:*`, `chat_guid:*`, `chat_identifier:*`) ได้

  </Tab>

  <Tab title="Group policy + mentions">
    `channels.imessage.groupPolicy` ควบคุมการจัดการกลุ่ม:

    - `allowlist` (ค่าเริ่มต้นเมื่อมีการกำหนดค่า)
    - `open`
    - `disabled`

    allowlist ของผู้ส่งในกลุ่ม: `channels.imessage.groupAllowFrom`

    fallback ของรันไทม์: หากไม่ได้ตั้งค่า `groupAllowFrom` ไว้ การตรวจสอบผู้ส่งในกลุ่มของ iMessage จะ fallback ไปใช้ `allowFrom` เมื่อมีให้ใช้
    หมายเหตุของรันไทม์: หากไม่มี `channels.imessage` ทั้งหมด รันไทม์จะ fallback ไปใช้ `groupPolicy="allowlist"` และบันทึกคำเตือน (แม้ว่าจะมีการตั้งค่า `channels.defaults.groupPolicy` ก็ตาม)

    การควบคุมด้วยการกล่าวถึงสำหรับกลุ่ม:

    - iMessage ไม่มี metadata การกล่าวถึงแบบเนทีฟ
    - การตรวจจับการกล่าวถึงใช้แพตเทิร์น regex (`agents.list[].groupChat.mentionPatterns`, fallback `messages.groupChat.mentionPatterns`)
    - หากไม่มีการกำหนดแพตเทิร์นไว้ จะไม่สามารถบังคับใช้การควบคุมด้วยการกล่าวถึงได้

    คำสั่งควบคุมจากผู้ส่งที่ได้รับอนุญาตสามารถข้ามการควบคุมด้วยการกล่าวถึงในกลุ่มได้

  </Tab>

  <Tab title="Sessions and deterministic replies">
    - DM ใช้การกำหนดเส้นทางแบบ direct; กลุ่มใช้การกำหนดเส้นทางแบบ group
    - ด้วยค่าเริ่มต้น `session.dmScope=main`, DM ของ iMessage จะถูกรวมเข้าเซสชันหลักของเอเจนต์
    - เซสชันของกลุ่มจะแยกออกจากกัน (`agent:<agentId>:imessage:group:<chat_id>`)
    - การตอบกลับจะถูกส่งกลับไปยัง iMessage โดยใช้ metadata ของช่อง/เป้าหมายต้นทาง

    พฤติกรรมเธรดแบบกึ่งกลุ่ม:

    เธรด iMessage แบบหลายผู้เข้าร่วมบางรายการอาจเข้ามาโดยมี `is_group=false`
    หากมีการกำหนด `chat_id` นั้นไว้อย่างชัดเจนภายใต้ `channels.imessage.groups` OpenClaw จะถือว่าเป็นทราฟฟิกแบบกลุ่ม (การควบคุมแบบกลุ่ม + การแยกเซสชันกลุ่ม)

  </Tab>
</Tabs>

## การผูกบทสนทนา ACP

แชต iMessage แบบ legacy ยังสามารถผูกกับเซสชัน ACP ได้เช่นกัน

ขั้นตอนสำหรับโอเปอเรเตอร์แบบรวดเร็ว:

- รัน `/acp spawn codex --bind here` ภายใน DM หรือแชตกลุ่มที่ได้รับอนุญาต
- ข้อความในอนาคตในบทสนทนา iMessage เดียวกันนั้นจะถูกกำหนดเส้นทางไปยังเซสชัน ACP ที่สร้างขึ้น
- `/new` และ `/reset` จะรีเซ็ตเซสชัน ACP ที่ผูกไว้เดิมในที่เดิม
- `/acp close` จะปิดเซสชัน ACP และลบการผูกออก

รองรับการผูกแบบถาวรที่กำหนดค่าไว้ผ่านรายการ `bindings[]` ระดับบนสุดที่มี `type: "acp"` และ `match.channel: "imessage"`

`match.peer.id` สามารถใช้ได้ดังนี้:

- handle ของ DM ที่ทำ normalization แล้ว เช่น `+15555550123` หรือ `user@example.com`
- `chat_id:<id>` (แนะนำสำหรับการผูกกลุ่มที่เสถียร)
- `chat_guid:<guid>`
- `chat_identifier:<identifier>`

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
        channel: "imessage",
        accountId: "default",
        peer: { kind: "group", id: "chat_id:123" },
      },
      acp: { label: "codex-group" },
    },
  ],
}
```

ดู [ACP Agents](/th/tools/acp-agents) สำหรับพฤติกรรมการผูก ACP ที่ใช้ร่วมกัน

## รูปแบบการติดตั้งใช้งาน

<AccordionGroup>
  <Accordion title="ผู้ใช้ macOS สำหรับบอตโดยเฉพาะ (ตัวตน iMessage แยกต่างหาก)">
    ใช้ Apple ID และผู้ใช้ macOS สำหรับบอตโดยเฉพาะ เพื่อให้ทราฟฟิกของบอตแยกจากโปรไฟล์ Messages ส่วนตัวของคุณ

    ขั้นตอนทั่วไป:

    1. สร้าง/ลงชื่อเข้าใช้ผู้ใช้ macOS สำหรับบอตโดยเฉพาะ
    2. ลงชื่อเข้าใช้ Messages ด้วย Apple ID ของบอตในผู้ใช้นั้น
    3. ติดตั้ง `imsg` ในผู้ใช้นั้น
    4. สร้าง SSH wrapper เพื่อให้ OpenClaw สามารถรัน `imsg` ในบริบทของผู้ใช้นั้นได้
    5. ชี้ `channels.imessage.accounts.<id>.cliPath` และ `.dbPath` ไปยังโปรไฟล์ของผู้ใช้นั้น

    การรันครั้งแรกอาจต้องมีการอนุมัติผ่าน GUI (Automation + Full Disk Access) ในเซสชันผู้ใช้ของบอตนั้น

  </Accordion>

  <Accordion title="Remote Mac ผ่าน Tailscale (ตัวอย่าง)">
    โทโพโลยีที่พบบ่อย:

    - gateway รันบน Linux/VM
    - iMessage + `imsg` รันบน Mac ใน tailnet ของคุณ
    - wrapper ของ `cliPath` ใช้ SSH เพื่อรัน `imsg`
    - `remoteHost` เปิดใช้การดึงไฟล์แนบผ่าน SCP

    ตัวอย่าง:

```json5
{
  channels: {
    imessage: {
      enabled: true,
      cliPath: "~/.openclaw/scripts/imsg-ssh",
      remoteHost: "bot@mac-mini.tailnet-1234.ts.net",
      includeAttachments: true,
      dbPath: "/Users/bot/Library/Messages/chat.db",
    },
  },
}
```

```bash
#!/usr/bin/env bash
exec ssh -T bot@mac-mini.tailnet-1234.ts.net imsg "$@"
```

    ใช้ SSH key เพื่อให้ทั้ง SSH และ SCP ทำงานได้โดยไม่ต้องโต้ตอบ
    ตรวจสอบให้แน่ใจก่อนว่าเชื่อถือ host key แล้ว (เช่น `ssh bot@mac-mini.tailnet-1234.ts.net`) เพื่อให้ `known_hosts` ถูกเติมข้อมูล

  </Accordion>

  <Accordion title="รูปแบบหลายบัญชี">
    iMessage รองรับคอนฟิกต่อบัญชีภายใต้ `channels.imessage.accounts`

    แต่ละบัญชีสามารถ override ฟิลด์ต่าง ๆ เช่น `cliPath`, `dbPath`, `allowFrom`, `groupPolicy`, `mediaMaxMb`, การตั้งค่าประวัติ และ allowlist ของรากพาธไฟล์แนบ

  </Accordion>
</AccordionGroup>

## สื่อ การแบ่งข้อความ และเป้าหมายการส่งมอบ

<AccordionGroup>
  <Accordion title="ไฟล์แนบและสื่อ">
    - การนำเข้าไฟล์แนบขาเข้าเป็นตัวเลือก: `channels.imessage.includeAttachments`
    - พาธไฟล์แนบระยะไกลสามารถดึงผ่าน SCP ได้เมื่อมีการตั้งค่า `remoteHost`
    - พาธไฟล์แนบต้องตรงกับรากพาธที่อนุญาต:
      - `channels.imessage.attachmentRoots` (ภายในเครื่อง)
      - `channels.imessage.remoteAttachmentRoots` (โหมด SCP ระยะไกล)
      - แพตเทิร์นรากพาธเริ่มต้น: `/Users/*/Library/Messages/Attachments`
    - SCP ใช้การตรวจสอบ host key แบบเข้มงวด (`StrictHostKeyChecking=yes`)
    - ขนาดสื่อขาออกใช้ `channels.imessage.mediaMaxMb` (ค่าเริ่มต้น 16 MB)
  </Accordion>

  <Accordion title="การแบ่งข้อความขาออก">
    - ขีดจำกัดการแบ่งข้อความ: `channels.imessage.textChunkLimit` (ค่าเริ่มต้น 4000)
    - โหมดการแบ่งข้อความ: `channels.imessage.chunkMode`
      - `length` (ค่าเริ่มต้น)
      - `newline` (แบ่งโดยย่อหน้าก่อน)
  </Accordion>

  <Accordion title="รูปแบบการอ้างที่อยู่">
    เป้าหมายแบบชัดเจนที่แนะนำ:

    - `chat_id:123` (แนะนำสำหรับการกำหนดเส้นทางที่เสถียร)
    - `chat_guid:...`
    - `chat_identifier:...`

    รองรับเป้าหมายแบบ handle ด้วย:

    - `imessage:+1555...`
    - `sms:+1555...`
    - `user@example.com`

```bash
imsg chats --limit 20
```

  </Accordion>
</AccordionGroup>

## การเขียนคอนฟิก

iMessage อนุญาตให้มีการเขียนคอนฟิกที่เริ่มจากช่องได้ตามค่าเริ่มต้น (สำหรับ `/config set|unset` เมื่อ `commands.config: true`)

ปิดใช้งาน:

```json5
{
  channels: {
    imessage: {
      configWrites: false,
    },
  },
}
```

## การแก้ไขปัญหา

<AccordionGroup>
  <Accordion title="ไม่พบ imsg หรือไม่รองรับ RPC">
    ตรวจสอบไบนารีและการรองรับ RPC:

```bash
imsg rpc --help
openclaw channels status --probe
```

    หาก probe รายงานว่าไม่รองรับ RPC ให้อัปเดต `imsg`

  </Accordion>

  <Accordion title="DM ถูกเพิกเฉย">
    ตรวจสอบ:

    - `channels.imessage.dmPolicy`
    - `channels.imessage.allowFrom`
    - การอนุมัติ pairing (`openclaw pairing list imessage`)

  </Accordion>

  <Accordion title="ข้อความกลุ่มถูกเพิกเฉย">
    ตรวจสอบ:

    - `channels.imessage.groupPolicy`
    - `channels.imessage.groupAllowFrom`
    - พฤติกรรม allowlist ของ `channels.imessage.groups`
    - การกำหนดค่าแพตเทิร์นการกล่าวถึง (`agents.list[].groupChat.mentionPatterns`)

  </Accordion>

  <Accordion title="ไฟล์แนบระยะไกลล้มเหลว">
    ตรวจสอบ:

    - `channels.imessage.remoteHost`
    - `channels.imessage.remoteAttachmentRoots`
    - การยืนยันตัวตนด้วยคีย์ SSH/SCP จากโฮสต์ gateway
    - มี host key อยู่ใน `~/.ssh/known_hosts` บนโฮสต์ gateway
    - พาธระยะไกลสามารถอ่านได้บน Mac ที่รัน Messages

  </Accordion>

  <Accordion title="พลาด prompt ขอสิทธิ์ของ macOS">
    รันใหม่ในเทอร์มินัล GUI แบบโต้ตอบในบริบทผู้ใช้/เซสชันเดียวกัน แล้วอนุมัติ prompt:

```bash
imsg chats --limit 1
imsg send <handle> "test"
```

    ยืนยันว่าได้ให้ Full Disk Access + Automation แก่บริบทของโปรเซสที่รัน OpenClaw/`imsg`

  </Accordion>
</AccordionGroup>

## ตัวชี้เอกสารอ้างอิงการกำหนดค่า

- [เอกสารอ้างอิงการกำหนดค่า - iMessage](/th/gateway/configuration-reference#imessage)
- [การกำหนดค่า Gateway](/th/gateway/configuration)
- [Pairing](/th/channels/pairing)
- [BlueBubbles](/th/channels/bluebubbles)

## ที่เกี่ยวข้อง

- [ภาพรวมช่องทาง](/th/channels) — ช่องทางทั้งหมดที่รองรับ
- [Pairing](/th/channels/pairing) — การยืนยันตัวตน DM และโฟลว์ Pairing
- [Groups](/th/channels/groups) — พฤติกรรมของแชตกลุ่มและการควบคุมด้วยการกล่าวถึง
- [Channel Routing](/th/channels/channel-routing) — การกำหนดเส้นทางเซสชันสำหรับข้อความ
- [ความปลอดภัย](/th/gateway/security) — โมเดลการเข้าถึงและการทำให้ระบบแข็งแกร่งขึ้น
