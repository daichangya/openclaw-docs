---
read_when:
    - การตั้งค่าการรองรับ iMessage
    - การดีบักการส่ง/รับ iMessage
summary: รองรับ iMessage แบบเดิมผ่าน imsg (JSON-RPC ผ่าน stdio) การตั้งค่าใหม่ควรใช้ BlueBubbles.
title: iMessage
x-i18n:
    generated_at: "2026-04-24T08:58:17Z"
    model: gpt-5.4
    provider: openai
    source_hash: ff2773ebcfced8834bc5d28378d9a6e3c20826cc0e08d6ea5480f8a5975fd8e3
    source_path: channels/imessage.md
    workflow: 15
---

# iMessage (เดิม: imsg)

<Warning>
สำหรับการติดตั้ง iMessage ใหม่ ให้ใช้ <a href="/th/channels/bluebubbles">BlueBubbles</a>

การเชื่อมต่อ `imsg` เป็นระบบเดิมและอาจถูกนำออกในรุ่นอนาคต
</Warning>

สถานะ: การเชื่อมต่อ CLI ภายนอกแบบเดิม Gateway จะสปอว์น `imsg rpc` และสื่อสารผ่าน JSON-RPC บน stdio (ไม่มี daemon/พอร์ตแยกต่างหาก)

<CardGroup cols={3}>
  <Card title="BlueBubbles (แนะนำ)" icon="message-circle" href="/th/channels/bluebubbles">
    เส้นทาง iMessage ที่แนะนำสำหรับการตั้งค่าใหม่
  </Card>
  <Card title="การจับคู่" icon="link" href="/th/channels/pairing">
    DM ของ iMessage ใช้โหมดการจับคู่เป็นค่าเริ่มต้น
  </Card>
  <Card title="ข้อมูลอ้างอิงการกำหนดค่า" icon="settings" href="/th/gateway/config-channels#imessage">
    ข้อมูลอ้างอิงฟิลด์ iMessage แบบเต็ม
  </Card>
</CardGroup>

## การตั้งค่าแบบรวดเร็ว

<Tabs>
  <Tab title="Mac ในเครื่อง (เส้นทางเร็ว)">
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

      <Step title="เริ่ม gateway">

```bash
openclaw gateway
```

      </Step>

      <Step title="อนุมัติการจับคู่ DM ครั้งแรก (`dmPolicy` เริ่มต้น)">

```bash
openclaw pairing list imessage
openclaw pairing approve imessage <CODE>
```

        คำขอจับคู่จะหมดอายุหลัง 1 ชั่วโมง
      </Step>
    </Steps>

  </Tab>

  <Tab title="Mac ระยะไกลผ่าน SSH">
    OpenClaw ต้องการเพียง `cliPath` ที่เข้ากันได้กับ stdio เท่านั้น ดังนั้นคุณจึงสามารถชี้ `cliPath` ไปยัง wrapper script ที่ SSH ไปยัง Mac ระยะไกลและรัน `imsg` ได้

```bash
#!/usr/bin/env bash
exec ssh -T gateway-host imsg "$@"
```

    การกำหนดค่าที่แนะนำเมื่อเปิดใช้ไฟล์แนบ:

```json5
{
  channels: {
    imessage: {
      enabled: true,
      cliPath: "~/.openclaw/scripts/imsg-ssh",
      remoteHost: "user@gateway-host", // used for SCP attachment fetches
      includeAttachments: true,
      // Optional: override allowed attachment roots.
      // Defaults include /Users/*/Library/Messages/Attachments
      attachmentRoots: ["/Users/*/Library/Messages/Attachments"],
      remoteAttachmentRoots: ["/Users/*/Library/Messages/Attachments"],
    },
  },
}
```

    หากไม่ได้ตั้งค่า `remoteHost` OpenClaw จะพยายามตรวจจับโดยอัตโนมัติด้วยการแยกวิเคราะห์ SSH wrapper script
    `remoteHost` ต้องเป็น `host` หรือ `user@host` (ไม่มีช่องว่างหรือตัวเลือก SSH)
    OpenClaw ใช้การตรวจสอบ host-key แบบเข้มงวดสำหรับ SCP ดังนั้น relay host key จะต้องมีอยู่ใน `~/.ssh/known_hosts` อยู่แล้ว
    พาธไฟล์แนบจะถูกตรวจสอบเทียบกับรากที่อนุญาต (`attachmentRoots` / `remoteAttachmentRoots`)

  </Tab>
</Tabs>

## ข้อกำหนดและสิทธิ์อนุญาต (macOS)

- ต้องลงชื่อเข้าใช้ Messages บน Mac ที่รัน `imsg`
- ต้องมี Full Disk Access สำหรับบริบทของโปรเซสที่รัน OpenClaw/`imsg` (เพื่อเข้าถึงฐานข้อมูล Messages)
- ต้องมีสิทธิ์ Automation เพื่อส่งข้อความผ่าน Messages.app

<Tip>
สิทธิ์อนุญาตจะถูกให้ตามบริบทของโปรเซส หาก gateway ทำงานแบบ headless (LaunchAgent/SSH) ให้รันคำสั่งแบบโต้ตอบครั้งเดียวในบริบทเดียวกันนั้นเพื่อเรียกให้มีพรอมป์ต์สิทธิ์:

```bash
imsg chats --limit 1
# or
imsg send <handle> "test"
```

</Tip>

## การควบคุมการเข้าถึงและการกำหนดเส้นทาง

<Tabs>
  <Tab title="นโยบาย DM">
    `channels.imessage.dmPolicy` ควบคุมข้อความส่วนตัว:

    - `pairing` (ค่าเริ่มต้น)
    - `allowlist`
    - `open` (ต้องให้ `allowFrom` มี `"*"`)
    - `disabled`

    ฟิลด์ allowlist: `channels.imessage.allowFrom`

    รายการ allowlist สามารถเป็น handle หรือเป้าหมายแชต (`chat_id:*`, `chat_guid:*`, `chat_identifier:*`)

  </Tab>

  <Tab title="นโยบายกลุ่ม + การกล่าวถึง">
    `channels.imessage.groupPolicy` ควบคุมการจัดการกลุ่ม:

    - `allowlist` (ค่าเริ่มต้นเมื่อมีการกำหนดค่า)
    - `open`
    - `disabled`

    allowlist ของผู้ส่งในกลุ่ม: `channels.imessage.groupAllowFrom`

    การ fallback ตอนรันไทม์: หากไม่ได้ตั้งค่า `groupAllowFrom` การตรวจสอบผู้ส่งในกลุ่มของ iMessage จะ fallback ไปใช้ `allowFrom` เมื่อมี
    หมายเหตุเกี่ยวกับรันไทม์: หากไม่มี `channels.imessage` ทั้งหมด รันไทม์จะ fallback ไปใช้ `groupPolicy="allowlist"` และบันทึกคำเตือน (แม้ว่าจะตั้งค่า `channels.defaults.groupPolicy` ไว้ก็ตาม)

    การกั้นด้วยการกล่าวถึงสำหรับกลุ่ม:

    - iMessage ไม่มีเมทาดาทาการกล่าวถึงแบบเนทีฟ
    - การตรวจจับการกล่าวถึงใช้รูปแบบ regex (`agents.list[].groupChat.mentionPatterns`, fallback เป็น `messages.groupChat.mentionPatterns`)
    - หากไม่มีการกำหนดค่ารูปแบบไว้ จะไม่สามารถบังคับใช้การกั้นด้วยการกล่าวถึงได้

    คำสั่งควบคุมจากผู้ส่งที่ได้รับอนุญาตสามารถข้ามการกั้นด้วยการกล่าวถึงในกลุ่มได้

  </Tab>

  <Tab title="เซสชันและการตอบกลับแบบกำหนดตายตัว">
    - DM ใช้การกำหนดเส้นทางแบบข้อความส่วนตัว กลุ่มใช้การกำหนดเส้นทางแบบกลุ่ม
    - เมื่อใช้ค่าเริ่มต้น `session.dmScope=main` DM ของ iMessage จะถูกรวมเข้าในเซสชันหลักของเอเจนต์
    - เซสชันกลุ่มจะถูกแยกออก (`agent:<agentId>:imessage:group:<chat_id>`)
    - การตอบกลับจะถูกส่งกลับไปยัง iMessage โดยใช้เมทาดาทาของช่องทาง/เป้าหมายต้นทาง

    พฤติกรรมเธรดแบบคล้ายกลุ่ม:

    เธรด iMessage แบบหลายผู้เข้าร่วมบางรายการอาจเข้ามาพร้อม `is_group=false`
    หาก `chat_id` นั้นถูกกำหนดไว้อย่างชัดเจนภายใต้ `channels.imessage.groups` OpenClaw จะถือว่าเป็นทราฟฟิกกลุ่ม (การกั้นแบบกลุ่ม + การแยกเซสชันกลุ่ม)

  </Tab>
</Tabs>

## การผูกการสนทนา ACP

แชต iMessage แบบเดิมสามารถผูกเข้ากับเซสชัน ACP ได้เช่นกัน

ขั้นตอนการทำงานแบบรวดเร็วสำหรับผู้ปฏิบัติงาน:

- รัน `/acp spawn codex --bind here` ภายใน DM หรือแชตกลุ่มที่ได้รับอนุญาต
- ข้อความในอนาคตในบทสนทนา iMessage เดียวกันนั้นจะถูกกำหนดเส้นทางไปยังเซสชัน ACP ที่ถูกสปอว์น
- `/new` และ `/reset` จะรีเซ็ตเซสชัน ACP ที่ผูกไว้เดิมในที่เดิม
- `/acp close` จะปิดเซสชัน ACP และลบการผูกออก

รองรับการผูกแบบถาวรที่กำหนดค่าไว้ผ่านรายการ `bindings[]` ระดับบนสุดที่มี `type: "acp"` และ `match.channel: "imessage"`

`match.peer.id` สามารถใช้ได้กับ:

- handle DM ที่ถูกทำให้เป็นมาตรฐานแล้ว เช่น `+15555550123` หรือ `user@example.com`
- `chat_id:<id>` (แนะนำสำหรับการผูกกลุ่มแบบคงที่)
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
  <Accordion title="ผู้ใช้บอต macOS โดยเฉพาะ (ตัวตน iMessage แยกต่างหาก)">
    ใช้ Apple ID และผู้ใช้ macOS โดยเฉพาะเพื่อแยกทราฟฟิกของบอตออกจากโปรไฟล์ Messages ส่วนตัวของคุณ

    ขั้นตอนทั่วไป:

    1. สร้าง/ลงชื่อเข้าใช้ผู้ใช้ macOS โดยเฉพาะ
    2. ลงชื่อเข้าใช้ Messages ด้วย Apple ID ของบอตในผู้ใช้นั้น
    3. ติดตั้ง `imsg` ในผู้ใช้นั้น
    4. สร้าง SSH wrapper เพื่อให้ OpenClaw สามารถรัน `imsg` ในบริบทของผู้ใช้นั้นได้
    5. ชี้ `channels.imessage.accounts.<id>.cliPath` และ `.dbPath` ไปยังโปรไฟล์ผู้ใช้นั้น

    การรันครั้งแรกอาจต้องมีการอนุมัติผ่าน GUI (Automation + Full Disk Access) ในเซสชันผู้ใช้บอตนั้น

  </Accordion>

  <Accordion title="Mac ระยะไกลผ่าน Tailscale (ตัวอย่าง)">
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

    ใช้คีย์ SSH เพื่อให้ทั้ง SSH และ SCP ไม่ต้องโต้ตอบ
    ตรวจสอบให้แน่ใจก่อนว่าเชื่อถือ host key แล้ว (เช่น `ssh bot@mac-mini.tailnet-1234.ts.net`) เพื่อให้ `known_hosts` ถูกเติมข้อมูล

  </Accordion>

  <Accordion title="รูปแบบหลายบัญชี">
    iMessage รองรับการกำหนดค่ารายบัญชีภายใต้ `channels.imessage.accounts`

    แต่ละบัญชีสามารถแทนที่ฟิลด์ต่าง ๆ ได้ เช่น `cliPath`, `dbPath`, `allowFrom`, `groupPolicy`, `mediaMaxMb`, การตั้งค่าประวัติ และ allowlist ของรากไฟล์แนบ

  </Accordion>
</AccordionGroup>

## สื่อ การแบ่งข้อความ และเป้าหมายการจัดส่ง

<AccordionGroup>
  <Accordion title="ไฟล์แนบและสื่อ">
    - การนำเข้าไฟล์แนบขาเข้าเป็นตัวเลือก: `channels.imessage.includeAttachments`
    - สามารถดึงพาธไฟล์แนบระยะไกลผ่าน SCP ได้เมื่อมีการตั้งค่า `remoteHost`
    - พาธไฟล์แนบต้องตรงกับรากที่อนุญาต:
      - `channels.imessage.attachmentRoots` (ในเครื่อง)
      - `channels.imessage.remoteAttachmentRoots` (โหมด SCP ระยะไกล)
      - รูปแบบรากเริ่มต้น: `/Users/*/Library/Messages/Attachments`
    - SCP ใช้การตรวจสอบ host-key แบบเข้มงวด (`StrictHostKeyChecking=yes`)
    - ขนาดสื่อขาออกใช้ `channels.imessage.mediaMaxMb` (ค่าเริ่มต้น 16 MB)
  </Accordion>

  <Accordion title="การแบ่งข้อความขาออก">
    - ขีดจำกัดการแบ่งข้อความ: `channels.imessage.textChunkLimit` (ค่าเริ่มต้น 4000)
    - โหมดการแบ่ง: `channels.imessage.chunkMode`
      - `length` (ค่าเริ่มต้น)
      - `newline` (แบ่งโดยย่อหน้าก่อน)
  </Accordion>

  <Accordion title="รูปแบบการระบุที่อยู่">
    เป้าหมายแบบระบุชัดเจนที่แนะนำ:

    - `chat_id:123` (แนะนำสำหรับการกำหนดเส้นทางแบบคงที่)
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

## การเขียนการกำหนดค่า

iMessage อนุญาตให้เขียนการกำหนดค่าที่เริ่มจากช่องทางได้เป็นค่าเริ่มต้น (สำหรับ `/config set|unset` เมื่อ `commands.config: true`)

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
    - การอนุมัติการจับคู่ (`openclaw pairing list imessage`)

  </Accordion>

  <Accordion title="ข้อความกลุ่มถูกเพิกเฉย">
    ตรวจสอบ:

    - `channels.imessage.groupPolicy`
    - `channels.imessage.groupAllowFrom`
    - พฤติกรรม allowlist ของ `channels.imessage.groups`
    - การกำหนดค่ารูปแบบการกล่าวถึง (`agents.list[].groupChat.mentionPatterns`)

  </Accordion>

  <Accordion title="ไฟล์แนบระยะไกลล้มเหลว">
    ตรวจสอบ:

    - `channels.imessage.remoteHost`
    - `channels.imessage.remoteAttachmentRoots`
    - การยืนยันตัวตนด้วยคีย์ SSH/SCP จากโฮสต์ gateway
    - มี host key อยู่ใน `~/.ssh/known_hosts` บนโฮสต์ gateway
    - การอ่านพาธระยะไกลได้บน Mac ที่รัน Messages

  </Accordion>

  <Accordion title="พลาดพรอมป์ต์สิทธิ์ของ macOS">
    รันใหม่ในเทอร์มินัล GUI แบบโต้ตอบในบริบทผู้ใช้/เซสชันเดียวกัน แล้วอนุมัติพรอมป์ต์:

```bash
imsg chats --limit 1
imsg send <handle> "test"
```

    ยืนยันว่าได้ให้ Full Disk Access + Automation สำหรับบริบทของโปรเซสที่รัน OpenClaw/`imsg`

  </Accordion>
</AccordionGroup>

## ตัวชี้ข้อมูลอ้างอิงการกำหนดค่า

- [ข้อมูลอ้างอิงการกำหนดค่า - iMessage](/th/gateway/config-channels#imessage)
- [การกำหนดค่า Gateway](/th/gateway/configuration)
- [การจับคู่](/th/channels/pairing)
- [BlueBubbles](/th/channels/bluebubbles)

## ที่เกี่ยวข้อง

- [ภาพรวมช่องทาง](/th/channels) — ช่องทางทั้งหมดที่รองรับ
- [การจับคู่](/th/channels/pairing) — การยืนยันตัวตน DM และโฟลว์การจับคู่
- [กลุ่ม](/th/channels/groups) — พฤติกรรมแชตกลุ่มและการกั้นด้วยการกล่าวถึง
- [การกำหนดเส้นทางช่องทาง](/th/channels/channel-routing) — การกำหนดเส้นทางเซสชันสำหรับข้อความ
- [ความปลอดภัย](/th/gateway/security) — โมเดลการเข้าถึงและการทำให้แข็งแกร่ง
