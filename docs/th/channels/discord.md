---
read_when:
    - การทำงานกับฟีเจอร์ของช่องทาง Discord
summary: สถานะการรองรับ ความสามารถ และการกำหนดค่าของบอต Discord
title: Discord
x-i18n:
    generated_at: "2026-04-23T05:25:14Z"
    model: gpt-5.4
    provider: openai
    source_hash: 1a500da6a2aa080f1c38efd3510bef000abc61059fdc0ff3cb14a62ad292cf9a
    source_path: channels/discord.md
    workflow: 15
---

# Discord (Bot API)

สถานะ: พร้อมใช้งานสำหรับ DM และช่องทาง guild ผ่าน gateway อย่างเป็นทางการของ Discord

<CardGroup cols={3}>
  <Card title="การจับคู่" icon="link" href="/th/channels/pairing">
    Discord DM ใช้โหมดการจับคู่เป็นค่าเริ่มต้น
  </Card>
  <Card title="คำสั่ง Slash" icon="terminal" href="/th/tools/slash-commands">
    พฤติกรรมคำสั่งแบบเนทีฟและแค็ตตาล็อกคำสั่ง
  </Card>
  <Card title="การแก้ไขปัญหาช่องทาง" icon="wrench" href="/th/channels/troubleshooting">
    การวินิจฉัยและขั้นตอนการซ่อมแซมข้ามช่องทาง
  </Card>
</CardGroup>

## การตั้งค่าแบบรวดเร็ว

คุณจะต้องสร้างแอปพลิเคชันใหม่พร้อมบอต เพิ่มบอตไปยังเซิร์ฟเวอร์ของคุณ และจับคู่บอตนั้นกับ OpenClaw เราแนะนำให้เพิ่มบอตของคุณไปยังเซิร์ฟเวอร์ส่วนตัวของคุณเอง หากคุณยังไม่มี [ให้สร้างก่อน](https://support.discord.com/hc/en-us/articles/204849977-How-do-I-create-a-server) (เลือก **Create My Own > For me and my friends**)

<Steps>
  <Step title="สร้างแอปพลิเคชัน Discord และบอต">
    ไปที่ [Discord Developer Portal](https://discord.com/developers/applications) แล้วคลิก **New Application** ตั้งชื่อประมาณว่า "OpenClaw"

    คลิก **Bot** ที่แถบด้านข้าง ตั้งค่า **Username** เป็นชื่อที่คุณใช้เรียกเอเจนต์ OpenClaw ของคุณ

  </Step>

  <Step title="เปิดใช้ privileged intents">
    ขณะที่ยังอยู่ในหน้า **Bot** ให้เลื่อนลงไปที่ **Privileged Gateway Intents** แล้วเปิดใช้:

    - **Message Content Intent** (จำเป็น)
    - **Server Members Intent** (แนะนำ; จำเป็นสำหรับ allowlist ของบทบาทและการจับคู่ชื่อเป็น ID)
    - **Presence Intent** (ไม่บังคับ; ต้องใช้เฉพาะสำหรับการอัปเดตสถานะเท่านั้น)

  </Step>

  <Step title="คัดลอก bot token ของคุณ">
    เลื่อนกลับขึ้นไปด้านบนในหน้า **Bot** แล้วคลิก **Reset Token**

    <Note>
    แม้ชื่อจะเป็นเช่นนั้น แต่นี่คือการสร้าง token แรกของคุณ — ไม่มีสิ่งใดถูก "รีเซ็ต"
    </Note>

    คัดลอก token แล้วเก็บไว้ที่ใดที่หนึ่ง นี่คือ **Bot Token** ของคุณ และคุณจะต้องใช้มันในอีกไม่กี่ขั้นตอนข้างหน้า

  </Step>

  <Step title="สร้าง URL เชิญและเพิ่มบอตไปยังเซิร์ฟเวอร์ของคุณ">
    คลิก **OAuth2** ที่แถบด้านข้าง คุณจะสร้าง URL เชิญพร้อมสิทธิ์ที่ถูกต้องเพื่อเพิ่มบอตไปยังเซิร์ฟเวอร์ของคุณ

    เลื่อนลงไปที่ **OAuth2 URL Generator** แล้วเปิดใช้:

    - `bot`
    - `applications.commands`

    ส่วน **Bot Permissions** จะปรากฏด้านล่าง เปิดใช้อย่างน้อย:

    **General Permissions**
      - View Channels
    **Text Permissions**
      - Send Messages
      - Read Message History
      - Embed Links
      - Attach Files
      - Add Reactions (ไม่บังคับ)

    นี่คือชุดสิทธิ์พื้นฐานสำหรับช่องข้อความปกติ หากคุณวางแผนจะโพสต์ในเธรด Discord รวมถึงเวิร์กโฟลว์ของช่อง forum หรือ media ที่สร้างหรือดำเนินเธรดต่อ ให้เปิดใช้ **Send Messages in Threads** เพิ่มเติมด้วย
    คัดลอก URL ที่สร้างขึ้นด้านล่างสุด วางลงในเบราว์เซอร์ เลือกเซิร์ฟเวอร์ของคุณ แล้วคลิก **Continue** เพื่อเชื่อมต่อ ตอนนี้คุณควรเห็นบอตของคุณในเซิร์ฟเวอร์ Discord แล้ว

  </Step>

  <Step title="เปิดใช้ Developer Mode และรวบรวม ID ของคุณ">
    กลับมาที่แอป Discord คุณต้องเปิดใช้ Developer Mode เพื่อให้สามารถคัดลอก ID ภายในได้

    1. คลิก **User Settings** (ไอคอนเฟืองถัดจากอวาตาร์ของคุณ) → **Advanced** → เปิด **Developer Mode**
    2. คลิกขวาที่ **ไอคอนเซิร์ฟเวอร์** ของคุณในแถบด้านข้าง → **Copy Server ID**
    3. คลิกขวาที่ **อวาตาร์ของคุณเอง** → **Copy User ID**

    บันทึก **Server ID** และ **User ID** ของคุณไว้คู่กับ Bot Token — คุณจะส่งทั้งสามค่านี้ให้ OpenClaw ในขั้นตอนถัดไป

  </Step>

  <Step title="อนุญาต DM จากสมาชิกเซิร์ฟเวอร์">
    เพื่อให้การจับคู่ทำงานได้ Discord ต้องอนุญาตให้บอตของคุณส่ง DM ถึงคุณ คลิกขวาที่ **ไอคอนเซิร์ฟเวอร์** ของคุณ → **Privacy Settings** → เปิด **Direct Messages**

    การทำเช่นนี้จะอนุญาตให้สมาชิกเซิร์ฟเวอร์ (รวมถึงบอต) ส่ง DM ถึงคุณ เก็บการตั้งค่านี้ไว้หากคุณต้องการใช้ Discord DM กับ OpenClaw หากคุณวางแผนจะใช้เฉพาะช่อง guild คุณสามารถปิด DM ได้หลังการจับคู่

  </Step>

  <Step title="ตั้งค่า bot token ของคุณอย่างปลอดภัย (อย่าส่งในแชต)">
    Discord bot token ของคุณเป็นความลับ (เหมือนรหัสผ่าน) ตั้งค่ามันบนเครื่องที่รัน OpenClaw ก่อนส่งข้อความหาเอเจนต์ของคุณ

```bash
export DISCORD_BOT_TOKEN="YOUR_BOT_TOKEN"
openclaw config set channels.discord.token --ref-provider default --ref-source env --ref-id DISCORD_BOT_TOKEN --dry-run
openclaw config set channels.discord.token --ref-provider default --ref-source env --ref-id DISCORD_BOT_TOKEN
openclaw config set channels.discord.enabled true --strict-json
openclaw gateway
```

    หาก OpenClaw กำลังรันเป็นบริการเบื้องหลังอยู่แล้ว ให้รีสตาร์ตผ่านแอป OpenClaw Mac หรือโดยการหยุดและเริ่มกระบวนการ `openclaw gateway run` ใหม่

  </Step>

  <Step title="กำหนดค่า OpenClaw และจับคู่">

    <Tabs>
      <Tab title="ถามเอเจนต์ของคุณ">
        แชตกับเอเจนต์ OpenClaw ของคุณบนช่องทางอื่นที่มีอยู่แล้ว (เช่น Telegram) แล้วบอกมัน หาก Discord เป็นช่องทางแรกของคุณ ให้ใช้แท็บ CLI / config แทน

        > "ฉันได้ตั้งค่า Discord bot token ใน config แล้ว โปรดตั้งค่า Discord ให้เสร็จโดยใช้ User ID `<user_id>` และ Server ID `<server_id>`"
      </Tab>
      <Tab title="CLI / config">
        หากคุณต้องการใช้ config แบบไฟล์ ให้ตั้งค่า:

```json5
{
  channels: {
    discord: {
      enabled: true,
      token: {
        source: "env",
        provider: "default",
        id: "DISCORD_BOT_TOKEN",
      },
    },
  },
}
```

        ค่า env fallback สำหรับบัญชีเริ่มต้น:

```bash
DISCORD_BOT_TOKEN=...
```

        รองรับค่า `token` แบบ plaintext ด้วย และรองรับค่า SecretRef สำหรับ `channels.discord.token` ในผู้ให้บริการแบบ env/file/exec ดู [Secrets Management](/th/gateway/secrets)

      </Tab>
    </Tabs>

  </Step>

  <Step title="อนุมัติการจับคู่ DM ครั้งแรก">
    รอจน gateway กำลังทำงาน จากนั้นส่ง DM ถึงบอตของคุณใน Discord มันจะตอบกลับด้วยโค้ดการจับคู่

    <Tabs>
      <Tab title="ถามเอเจนต์ของคุณ">
        ส่งโค้ดการจับคู่ให้เอเจนต์ของคุณบนช่องทางที่คุณใช้อยู่แล้ว:

        > "อนุมัติโค้ดการจับคู่ Discord นี้: `<CODE>`"
      </Tab>
      <Tab title="CLI">

```bash
openclaw pairing list discord
openclaw pairing approve discord <CODE>
```

      </Tab>
    </Tabs>

    โค้ดการจับคู่จะหมดอายุภายใน 1 ชั่วโมง

    ตอนนี้คุณควรสามารถแชตกับเอเจนต์ของคุณใน Discord ผ่าน DM ได้แล้ว

  </Step>
</Steps>

<Note>
การ resolve token รับรู้ตามบัญชี ค่า token ใน config มีลำดับความสำคัญสูงกว่าค่า env fallback `DISCORD_BOT_TOKEN` จะถูกใช้เฉพาะกับบัญชีเริ่มต้นเท่านั้น
สำหรับการเรียกขาออกขั้นสูง (message tool/channel actions) จะใช้ `token` แบบระบุชัดเจนต่อการเรียกสำหรับการเรียกนั้น หลักการนี้ใช้กับการส่งและการกระทำแบบอ่าน/ตรวจสอบ เช่น read/search/fetch/thread/pins/permissions การตั้งค่านโยบายบัญชี/การลองใหม่ยังคงมาจากบัญชีที่เลือกใน snapshot รันไทม์ที่ใช้งานอยู่
</Note>

## คำแนะนำ: ตั้งค่า workspace ของ guild

เมื่อ DM ใช้งานได้แล้ว คุณสามารถตั้งค่าเซิร์ฟเวอร์ Discord ของคุณให้เป็น workspace เต็มรูปแบบ ซึ่งแต่ละช่องจะมีเซสชันเอเจนต์ของตัวเองพร้อมบริบทของตัวเอง วิธีนี้แนะนำสำหรับเซิร์ฟเวอร์ส่วนตัวที่มีเพียงคุณกับบอตของคุณ

<Steps>
  <Step title="เพิ่มเซิร์ฟเวอร์ของคุณลงใน guild allowlist">
    การทำเช่นนี้จะเปิดให้เอเจนต์ของคุณตอบกลับได้ในทุกช่องบนเซิร์ฟเวอร์ของคุณ ไม่ใช่แค่ DM เท่านั้น

    <Tabs>
      <Tab title="ถามเอเจนต์ของคุณ">
        > "เพิ่ม Discord Server ID `<server_id>` ของฉันลงใน guild allowlist"
      </Tab>
      <Tab title="Config">

```json5
{
  channels: {
    discord: {
      groupPolicy: "allowlist",
      guilds: {
        YOUR_SERVER_ID: {
          requireMention: true,
          users: ["YOUR_USER_ID"],
        },
      },
    },
  },
}
```

      </Tab>
    </Tabs>

  </Step>

  <Step title="อนุญาตให้ตอบกลับได้โดยไม่ต้อง @mention">
    โดยค่าเริ่มต้น เอเจนต์ของคุณจะตอบกลับในช่อง guild เมื่อถูก @mention เท่านั้น สำหรับเซิร์ฟเวอร์ส่วนตัว คุณน่าจะต้องการให้มันตอบทุกข้อความ

    <Tabs>
      <Tab title="ถามเอเจนต์ของคุณ">
        > "อนุญาตให้เอเจนต์ของฉันตอบกลับบนเซิร์ฟเวอร์นี้ได้โดยไม่ต้องถูก @mentioned"
      </Tab>
      <Tab title="Config">
        ตั้งค่า `requireMention: false` ใน config ของ guild:

```json5
{
  channels: {
    discord: {
      guilds: {
        YOUR_SERVER_ID: {
          requireMention: false,
        },
      },
    },
  },
}
```

      </Tab>
    </Tabs>

  </Step>

  <Step title="วางแผนเรื่องหน่วยความจำในช่อง guild">
    โดยค่าเริ่มต้น หน่วยความจำระยะยาว (`MEMORY.md`) จะถูกโหลดเฉพาะในเซสชัน DM เท่านั้น ช่อง guild จะไม่โหลด MEMORY.md โดยอัตโนมัติ

    <Tabs>
      <Tab title="ถามเอเจนต์ของคุณ">
        > "เมื่อฉันถามคำถามในช่อง Discord ให้ใช้ memory_search หรือ memory_get หากคุณต้องการบริบทระยะยาวจาก MEMORY.md"
      </Tab>
      <Tab title="ด้วยตนเอง">
        หากคุณต้องการบริบทร่วมในทุกช่อง ให้ใส่คำสั่งที่คงที่ไว้ใน `AGENTS.md` หรือ `USER.md` (ทั้งสองไฟล์จะถูกฉีดในทุกเซสชัน) เก็บบันทึกระยะยาวไว้ใน `MEMORY.md` และเข้าถึงเมื่อจำเป็นด้วยเครื่องมือหน่วยความจำ
      </Tab>
    </Tabs>

  </Step>
</Steps>

ตอนนี้ให้สร้างบางช่องบนเซิร์ฟเวอร์ Discord ของคุณแล้วเริ่มแชต เอเจนต์ของคุณสามารถเห็นชื่อช่องได้ และแต่ละช่องจะมีเซสชันแยกจากกันของตัวเอง — ดังนั้นคุณสามารถตั้งค่า `#coding`, `#home`, `#research` หรืออะไรก็ได้ที่เหมาะกับเวิร์กโฟลว์ของคุณ

## โมเดลรันไทม์

- Gateway เป็นเจ้าของการเชื่อมต่อ Discord
- การกำหนดเส้นทางการตอบกลับเป็นแบบกำหนดแน่นอน: ข้อความขาเข้าจาก Discord จะตอบกลับไปยัง Discord
- โดยค่าเริ่มต้น (`session.dmScope=main`) การแชตโดยตรงจะแชร์เซสชันหลักของเอเจนต์ (`agent:main:main`)
- ช่อง guild เป็นคีย์เซสชันแบบแยก (`agent:<agentId>:discord:channel:<channelId>`)
- Group DM จะถูกละเว้นโดยค่าเริ่มต้น (`channels.discord.dm.groupEnabled=false`)
- คำสั่ง slash แบบเนทีฟรันในเซสชันคำสั่งแบบแยก (`agent:<agentId>:discord:slash:<userId>`) ขณะที่ยังคงพก `CommandTargetSessionKey` ไปยังเซสชันการสนทนาที่ถูกกำหนดเส้นทาง

## ช่อง forum

ช่อง forum และ media ของ Discord ยอมรับเฉพาะโพสต์แบบเธรด OpenClaw รองรับสองวิธีในการสร้างโพสต์เหล่านี้:

- ส่งข้อความไปยัง forum parent (`channel:<forumId>`) เพื่อสร้างเธรดอัตโนมัติ ชื่อเธรดจะใช้บรรทัดแรกที่ไม่ว่างของข้อความของคุณ
- ใช้ `openclaw message thread create` เพื่อสร้างเธรดโดยตรง อย่าส่ง `--message-id` สำหรับช่อง forum

ตัวอย่าง: ส่งไปยัง forum parent เพื่อสร้างเธรด

```bash
openclaw message send --channel discord --target channel:<forumId> \
  --message "Topic title\nBody of the post"
```

ตัวอย่าง: สร้างเธรด forum โดยตรงอย่างชัดเจน

```bash
openclaw message thread create --channel discord --target channel:<forumId> \
  --thread-name "Topic title" --message "Body of the post"
```

forum parent ไม่รองรับคอมโพเนนต์ของ Discord หากคุณต้องการคอมโพเนนต์ ให้ส่งไปยังเธรดเอง (`channel:<threadId>`)

## คอมโพเนนต์แบบโต้ตอบ

OpenClaw รองรับ Discord components v2 containers สำหรับข้อความของเอเจนต์ ใช้ message tool พร้อม payload แบบ `components` ผลลัพธ์ของการโต้ตอบจะถูกกำหนดเส้นทางกลับไปยังเอเจนต์ในรูปแบบข้อความขาเข้าปกติ และเป็นไปตามการตั้งค่า Discord `replyToMode` ที่มีอยู่

บล็อกที่รองรับ:

- `text`, `section`, `separator`, `actions`, `media-gallery`, `file`
- action row อนุญาตได้สูงสุด 5 ปุ่ม หรือ select menu เดี่ยว
- ประเภท select: `string`, `user`, `role`, `mentionable`, `channel`

โดยค่าเริ่มต้น คอมโพเนนต์จะใช้ได้ครั้งเดียว ตั้งค่า `components.reusable=true` เพื่ออนุญาตให้ปุ่ม select และฟอร์มถูกใช้งานได้หลายครั้งจนกว่าจะหมดอายุ

หากต้องการจำกัดว่าใครสามารถคลิกปุ่มได้ ให้ตั้งค่า `allowedUsers` บนปุ่มนั้น (Discord user ID, tag หรือ `*`) เมื่อกำหนดค่าไว้ ผู้ใช้ที่ไม่ตรงเงื่อนไขจะได้รับการปฏิเสธแบบ ephemeral

คำสั่ง slash `/model` และ `/models` จะเปิดตัวเลือกโมเดลแบบโต้ตอบพร้อมดรอปดาวน์สำหรับผู้ให้บริการและโมเดล รวมถึงขั้นตอน Submit เว้นแต่ `commands.modelsWrite=false` คำสั่ง `/models add` ยังรองรับการเพิ่มรายการผู้ให้บริการ/โมเดลใหม่จากแชต และโมเดลที่เพิ่งเพิ่มจะปรากฏขึ้นโดยไม่ต้องรีสตาร์ต gateway การตอบกลับของตัวเลือกจะเป็นแบบ ephemeral และมีเพียงผู้ใช้ที่เรียกคำสั่งเท่านั้นที่ใช้งานได้

ไฟล์แนบ:

- บล็อก `file` ต้องชี้ไปยังการอ้างอิงไฟล์แนบ (`attachment://<filename>`)
- ระบุไฟล์แนบผ่าน `media`/`path`/`filePath` (ไฟล์เดียว); ใช้ `media-gallery` สำหรับหลายไฟล์
- ใช้ `filename` เพื่อแทนที่ชื่ออัปโหลดเมื่อควรตรงกับการอ้างอิงไฟล์แนบ

ฟอร์ม modal:

- เพิ่ม `components.modal` ได้สูงสุด 5 ฟิลด์
- ประเภทฟิลด์: `text`, `checkbox`, `radio`, `select`, `role-select`, `user-select`
- OpenClaw จะเพิ่มปุ่มทริกเกอร์ให้อัตโนมัติ

ตัวอย่าง:

```json5
{
  channel: "discord",
  action: "send",
  to: "channel:123456789012345678",
  message: "ข้อความสำรองแบบไม่บังคับ",
  components: {
    reusable: true,
    text: "เลือกเส้นทาง",
    blocks: [
      {
        type: "actions",
        buttons: [
          {
            label: "อนุมัติ",
            style: "success",
            allowedUsers: ["123456789012345678"],
          },
          { label: "ปฏิเสธ", style: "danger" },
        ],
      },
      {
        type: "actions",
        select: {
          type: "string",
          placeholder: "เลือกตัวเลือก",
          options: [
            { label: "ตัวเลือก A", value: "a" },
            { label: "ตัวเลือก B", value: "b" },
          ],
        },
      },
    ],
    modal: {
      title: "รายละเอียด",
      triggerLabel: "เปิดฟอร์ม",
      fields: [
        { type: "text", label: "ผู้ร้องขอ" },
        {
          type: "select",
          label: "ลำดับความสำคัญ",
          options: [
            { label: "ต่ำ", value: "low" },
            { label: "สูง", value: "high" },
          ],
        },
      ],
    },
  },
}
```

## การควบคุมการเข้าถึงและการกำหนดเส้นทาง

<Tabs>
  <Tab title="นโยบาย DM">
    `channels.discord.dmPolicy` ควบคุมการเข้าถึง DM (แบบเดิม: `channels.discord.dm.policy`):

    - `pairing` (ค่าเริ่มต้น)
    - `allowlist`
    - `open` (ต้องให้ `channels.discord.allowFrom` มี `"*"`; แบบเดิม: `channels.discord.dm.allowFrom`)
    - `disabled`

    หากนโยบาย DM ไม่ได้เป็น open ผู้ใช้ที่ไม่รู้จักจะถูกบล็อก (หรือถูกพรอมป์ให้จับคู่ในโหมด `pairing`)

    ลำดับความสำคัญแบบหลายบัญชี:

    - `channels.discord.accounts.default.allowFrom` ใช้เฉพาะกับบัญชี `default`
    - บัญชีที่ตั้งชื่อไว้จะสืบทอด `channels.discord.allowFrom` เมื่อ `allowFrom` ของตัวเองไม่ได้ถูกตั้งค่า
    - บัญชีที่ตั้งชื่อไว้จะไม่สืบทอด `channels.discord.accounts.default.allowFrom`

    รูปแบบเป้าหมาย DM สำหรับการส่ง:

    - `user:<id>`
    - การ mention แบบ `<@id>`

    ID ตัวเลขล้วนมีความกำกวมและจะถูกปฏิเสธ เว้นแต่จะระบุชนิดเป้าหมายผู้ใช้/ช่องอย่างชัดเจน

  </Tab>

  <Tab title="นโยบาย Guild">
    การจัดการ guild ถูกควบคุมโดย `channels.discord.groupPolicy`:

    - `open`
    - `allowlist`
    - `disabled`

    ค่า baseline ที่ปลอดภัยเมื่อมี `channels.discord` อยู่คือ `allowlist`

    พฤติกรรมของ `allowlist`:

    - guild ต้องตรงกับ `channels.discord.guilds` (แนะนำให้ใช้ `id` รับ `slug` ได้)
    - allowlist ของผู้ส่งแบบไม่บังคับ: `users` (แนะนำให้ใช้ ID ที่คงที่) และ `roles` (เฉพาะ role ID); หากมีการกำหนดอย่างใดอย่างหนึ่งไว้ ผู้ส่งจะได้รับอนุญาตเมื่อมีค่าตรงกับ `users` หรือ `roles`
    - การจับคู่ชื่อ/tag โดยตรงถูกปิดไว้เป็นค่าเริ่มต้น; เปิด `channels.discord.dangerouslyAllowNameMatching: true` เฉพาะเมื่อจำเป็นจริงในโหมดความเข้ากันได้ฉุกเฉิน
    - รองรับชื่อ/tag สำหรับ `users` แต่ ID ปลอดภัยกว่า; `openclaw security audit` จะเตือนเมื่อมีการใช้รายการชื่อ/tag
    - หาก guild มีการกำหนด `channels` ไว้ ช่องที่ไม่อยู่ในรายการจะถูกปฏิเสธ
    - หาก guild ไม่มีบล็อก `channels` ทุกช่องใน guild ที่อยู่ใน allowlist จะได้รับอนุญาต

    ตัวอย่าง:

```json5
{
  channels: {
    discord: {
      groupPolicy: "allowlist",
      guilds: {
        "123456789012345678": {
          requireMention: true,
          ignoreOtherMentions: true,
          users: ["987654321098765432"],
          roles: ["123456789012345678"],
          channels: {
            general: { allow: true },
            help: { allow: true, requireMention: true },
          },
        },
      },
    },
  },
}
```

    หากคุณตั้งค่าเพียง `DISCORD_BOT_TOKEN` และไม่ได้สร้างบล็อก `channels.discord` ค่า fallback ของรันไทม์จะเป็น `groupPolicy="allowlist"` (พร้อมคำเตือนในล็อก) แม้ว่า `channels.defaults.groupPolicy` จะเป็น `open` ก็ตาม

  </Tab>

  <Tab title="การ mention และ group DM">
    ข้อความใน guild ถูกกำหนดให้ต้องมีการ mention เป็นค่าเริ่มต้น

    การตรวจจับการ mention รวมถึง:

    - การ mention บอตโดยตรงอย่างชัดเจน
    - รูปแบบการ mention ที่กำหนดไว้ (`agents.list[].groupChat.mentionPatterns`, fallback คือ `messages.groupChat.mentionPatterns`)
    - พฤติกรรมตอบกลับบอตโดยปริยายในกรณีที่รองรับ

    `requireMention` ถูกกำหนดต่อ guild/ช่อง (`channels.discord.guilds...`)
    `ignoreOtherMentions` จะทิ้งข้อความที่ mention ผู้ใช้/บทบาทอื่นแต่ไม่ mention บอตได้ตามตัวเลือก (ยกเว้น @everyone/@here)

    Group DM:

    - ค่าเริ่มต้น: ละเว้น (`dm.groupEnabled=false`)
    - allowlist แบบไม่บังคับผ่าน `dm.groupChannels` (channel ID หรือ slug)

  </Tab>
</Tabs>

### การกำหนดเส้นทางเอเจนต์ตามบทบาท

ใช้ `bindings[].match.roles` เพื่อกำหนดเส้นทางสมาชิก guild ของ Discord ไปยังเอเจนต์ต่างกันตาม role ID binding แบบอิงบทบาทยอมรับเฉพาะ role ID และจะถูกประเมินหลัง binding แบบ peer หรือ parent-peer และก่อน binding แบบ guild-only หาก binding กำหนดฟิลด์จับคู่อื่นด้วย (เช่น `peer` + `guildId` + `roles`) ทุกฟิลด์ที่กำหนดต้องตรงกันทั้งหมด

```json5
{
  bindings: [
    {
      agentId: "opus",
      match: {
        channel: "discord",
        guildId: "123456789012345678",
        roles: ["111111111111111111"],
      },
    },
    {
      agentId: "sonnet",
      match: {
        channel: "discord",
        guildId: "123456789012345678",
      },
    },
  ],
}
```

## การตั้งค่า Developer Portal

<AccordionGroup>
  <Accordion title="สร้างแอปและบอต">

    1. Discord Developer Portal -> **Applications** -> **New Application**
    2. **Bot** -> **Add Bot**
    3. คัดลอก bot token

  </Accordion>

  <Accordion title="Privileged intents">
    ใน **Bot -> Privileged Gateway Intents** ให้เปิดใช้:

    - Message Content Intent
    - Server Members Intent (แนะนำ)

    Presence intent เป็นตัวเลือกและจำเป็นเฉพาะเมื่อคุณต้องการรับการอัปเดตสถานะเท่านั้น การตั้งค่าสถานะบอต (`setPresence`) ไม่จำเป็นต้องเปิดใช้การอัปเดตสถานะของสมาชิก

  </Accordion>

  <Accordion title="OAuth scopes และสิทธิ์พื้นฐาน">
    ตัวสร้าง OAuth URL:

    - scopes: `bot`, `applications.commands`

    สิทธิ์พื้นฐานที่ใช้ทั่วไป:

    **General Permissions**
      - View Channels
    **Text Permissions**
      - Send Messages
      - Read Message History
      - Embed Links
      - Attach Files
      - Add Reactions (ไม่บังคับ)

    นี่คือชุดสิทธิ์พื้นฐานสำหรับช่องข้อความปกติ หากคุณวางแผนจะโพสต์ในเธรด Discord รวมถึงเวิร์กโฟลว์ของช่อง forum หรือ media ที่สร้างหรือดำเนินเธรดต่อ ให้เปิดใช้ **Send Messages in Threads** เพิ่มเติมด้วย
    หลีกเลี่ยง `Administrator` เว้นแต่จำเป็นอย่างชัดเจน

  </Accordion>

  <Accordion title="คัดลอก ID">
    เปิดใช้ Discord Developer Mode แล้วคัดลอก:

    - server ID
    - channel ID
    - user ID

    ควรใช้ ID ตัวเลขใน config ของ OpenClaw เพื่อให้การตรวจสอบและการ probe เชื่อถือได้

  </Accordion>
</AccordionGroup>

## คำสั่งแบบเนทีฟและการยืนยันสิทธิ์คำสั่ง

- `commands.native` มีค่าเริ่มต้นเป็น `"auto"` และเปิดใช้งานสำหรับ Discord
- การ override ต่อช่องทาง: `channels.discord.commands.native`
- `commands.native=false` จะล้างคำสั่งแบบเนทีฟของ Discord ที่ลงทะเบียนไว้ก่อนหน้านี้อย่างชัดเจน
- การยืนยันสิทธิ์คำสั่งแบบเนทีฟใช้ allowlist/นโยบาย Discord เดียวกันกับการจัดการข้อความปกติ
- คำสั่งอาจยังมองเห็นได้ใน UI ของ Discord สำหรับผู้ใช้ที่ไม่ได้รับอนุญาต; แต่การทำงานจริงยังคงบังคับใช้การยืนยันสิทธิ์ของ OpenClaw และจะตอบกลับว่า "ไม่ได้รับอนุญาต"

ดู [คำสั่ง Slash](/th/tools/slash-commands) สำหรับแค็ตตาล็อกคำสั่งและพฤติกรรม

การตั้งค่าคำสั่ง slash เริ่มต้น:

- `ephemeral: true`

## รายละเอียดฟีเจอร์

<AccordionGroup>
  <Accordion title="แท็กตอบกลับและการตอบกลับแบบเนทีฟ">
    Discord รองรับแท็กตอบกลับในเอาต์พุตของเอเจนต์:

    - `[[reply_to_current]]`
    - `[[reply_to:<id>]]`

    ควบคุมโดย `channels.discord.replyToMode`:

    - `off` (ค่าเริ่มต้น)
    - `first`
    - `all`
    - `batched`

    หมายเหตุ: `off` จะปิดการทำเธรดตอบกลับโดยปริยาย แต่แท็ก `[[reply_to_*]]` แบบระบุชัดเจนจะยังคงถูกใช้งาน
    `first` จะผูกการอ้างอิงการตอบกลับแบบเนทีฟโดยปริยายเข้ากับข้อความ Discord ขาออกข้อความแรกของเทิร์นนั้นเสมอ
    `batched` จะผูกการอ้างอิงการตอบกลับแบบเนทีฟโดยปริยายของ Discord เฉพาะเมื่อ
    เทิร์นขาเข้าเป็นชุดข้อความหลายข้อความที่ถูก debounce เท่านั้น วิธีนี้มีประโยชน์
    เมื่อคุณต้องการใช้การตอบกลับแบบเนทีฟเป็นหลักสำหรับแชตที่คลุมเครือและมาเป็นชุด ไม่ใช่ทุก
    เทิร์นที่มีข้อความเดียว

    ID ข้อความจะถูกแสดงในบริบท/ประวัติ เพื่อให้เอเจนต์สามารถกำหนดเป้าหมายข้อความเฉพาะได้

  </Accordion>

  <Accordion title="ตัวอย่างสตรีมแบบสด">
    OpenClaw สามารถสตรีมฉบับร่างของคำตอบได้โดยส่งข้อความชั่วคราวและแก้ไขข้อความนั้นเมื่อมีข้อความเข้ามา

    - `channels.discord.streaming` ควบคุมการสตรีมตัวอย่าง (`off` | `partial` | `block` | `progress`, ค่าเริ่มต้น: `off`)
    - ค่าเริ่มต้นยังคงเป็น `off` เพราะการแก้ไขตัวอย่างใน Discord อาจชน rate limit ได้ง่าย โดยเฉพาะเมื่อมีหลายบอตหรือหลาย gateway ใช้บัญชีเดียวกันหรือมีทราฟฟิกใน guild เดียวกัน
    - `progress` ถูกรับไว้เพื่อความสอดคล้องข้ามช่องทาง และจะถูกแมปเป็น `partial` บน Discord
    - `channels.discord.streamMode` เป็น alias แบบเดิมและจะถูกย้ายให้อัตโนมัติ
    - `partial` จะแก้ไขข้อความตัวอย่างเดียวเมื่อ token ทยอยเข้ามา
    - `block` จะปล่อยเป็นชิ้นขนาดฉบับร่าง (ใช้ `draftChunk` เพื่อปรับขนาดและจุดแบ่ง)
    - ข้อความสื่อ ข้อผิดพลาด และ final แบบ explicit-reply จะยกเลิกการแก้ไขตัวอย่างที่ค้างอยู่โดยไม่ flush ฉบับร่างชั่วคราวก่อนการส่งปกติ
    - `streaming.preview.toolProgress` ควบคุมว่าการอัปเดต tool/progress จะใช้ข้อความตัวอย่างฉบับร่างเดียวกันซ้ำหรือไม่ (ค่าเริ่มต้น: `true`) ตั้งค่าเป็น `false` เพื่อแยกข้อความ tool/progress ออกจากกัน

    ตัวอย่าง:

```json5
{
  channels: {
    discord: {
      streaming: "partial",
    },
  },
}
```

    ค่าเริ่มต้นของการแบ่งชิ้นในโหมด `block` (ถูกบีบให้อยู่ภายใน `channels.discord.textChunkLimit`):

```json5
{
  channels: {
    discord: {
      streaming: "block",
      draftChunk: {
        minChars: 200,
        maxChars: 800,
        breakPreference: "paragraph",
      },
    },
  },
}
```

    การสตรีมตัวอย่างรองรับเฉพาะข้อความ; คำตอบแบบสื่อจะ fallback ไปเป็นการส่งแบบปกติ

    หมายเหตุ: การสตรีมตัวอย่างแยกจาก block streaming เมื่อเปิดใช้ block streaming
    สำหรับ Discord อย่างชัดเจน OpenClaw จะข้าม preview stream เพื่อหลีกเลี่ยงการสตรีมซ้ำซ้อน

  </Accordion>

  <Accordion title="ประวัติ บริบท และพฤติกรรมของเธรด">
    บริบทประวัติใน guild:

    - `channels.discord.historyLimit` ค่าเริ่มต้น `20`
    - fallback: `messages.groupChat.historyLimit`
    - `0` คือปิดใช้งาน

    ตัวควบคุมประวัติ DM:

    - `channels.discord.dmHistoryLimit`
    - `channels.discord.dms["<user_id>"].historyLimit`

    พฤติกรรมของเธรด:

    - เธรด Discord ถูกกำหนดเส้นทางเป็นเซสชันของช่อง
    - สามารถใช้ metadata ของเธรดแม่เพื่อเชื่อมโยงเซสชันแม่ได้
    - config ของเธรดจะสืบทอดจาก config ของช่องแม่ เว้นแต่จะมีรายการเฉพาะเธรดอยู่แล้ว

    หัวข้อของช่องจะถูกฉีดเป็นบริบทแบบ **ไม่น่าเชื่อถือ** (ไม่ใช่ในรูปแบบ system prompt)
    ปัจจุบันบริบทของการตอบกลับและข้อความที่อ้างอิงจะยังคงอยู่ตามที่ได้รับ
    allowlist ของ Discord มีหน้าที่หลักในการกำหนดว่าใครสามารถกระตุ้นเอเจนต์ได้ ไม่ใช่ขอบเขตการลบข้อมูลบริบทเสริมอย่างครบถ้วน

  </Accordion>

  <Accordion title="เซสชันที่ผูกกับเธรดสำหรับ subagent">
    Discord สามารถผูกเธรดเข้ากับเป้าหมายเซสชันได้ เพื่อให้ข้อความติดตามผลในเธรดนั้นยังคงถูกกำหนดเส้นทางไปยังเซสชันเดิม (รวมถึงเซสชัน subagent)

    คำสั่ง:

    - `/focus <target>` ผูกเธรดปัจจุบัน/เธรดใหม่กับเป้าหมาย subagent/เซสชัน
    - `/unfocus` ลบการผูกของเธรดปัจจุบัน
    - `/agents` แสดงการรันที่ใช้งานอยู่และสถานะการผูก
    - `/session idle <duration|off>` ตรวจสอบ/อัปเดตการเลิกโฟกัสอัตโนมัติจากการไม่มีความเคลื่อนไหวสำหรับ binding ที่โฟกัสอยู่
    - `/session max-age <duration|off>` ตรวจสอบ/อัปเดตอายุสูงสุดแบบตายตัวสำหรับ binding ที่โฟกัสอยู่

    Config:

```json5
{
  session: {
    threadBindings: {
      enabled: true,
      idleHours: 24,
      maxAgeHours: 0,
    },
  },
  channels: {
    discord: {
      threadBindings: {
        enabled: true,
        idleHours: 24,
        maxAgeHours: 0,
        spawnSubagentSessions: false, // ต้องเปิดใช้เอง
      },
    },
  },
}
```

    หมายเหตุ:

    - `session.threadBindings.*` ใช้กำหนดค่าเริ่มต้นแบบ global
    - `channels.discord.threadBindings.*` ใช้ override พฤติกรรมของ Discord
    - `spawnSubagentSessions` ต้องเป็น true เพื่อสร้าง/ผูกเธรดอัตโนมัติสำหรับ `sessions_spawn({ thread: true })`
    - `spawnAcpSessions` ต้องเป็น true เพื่อสร้าง/ผูกเธรดอัตโนมัติสำหรับ ACP (`/acp spawn ... --thread ...` หรือ `sessions_spawn({ runtime: "acp", thread: true })`)
    - หากปิดใช้ thread bindings สำหรับบัญชีใด `/focus` และการดำเนินการ thread binding ที่เกี่ยวข้องจะไม่พร้อมใช้งาน

    ดู [Sub-agents](/th/tools/subagents), [ACP Agents](/th/tools/acp-agents) และ [Configuration Reference](/th/gateway/configuration-reference)

  </Accordion>

  <Accordion title="การผูกช่อง ACP แบบถาวร">
    สำหรับ workspace ของ ACP ที่เสถียรและ "พร้อมใช้งานตลอดเวลา" ให้กำหนด ACP bindings แบบมีชนิดที่ระดับบนสุด โดยกำหนดเป้าหมายไปยังการสนทนาใน Discord

    เส้นทาง config:

    - `bindings[]` พร้อม `type: "acp"` และ `match.channel: "discord"`

    ตัวอย่าง:

```json5
{
  agents: {
    list: [
      {
        id: "codex",
        runtime: {
          type: "acp",
          acp: {
            agent: "codex",
            backend: "acpx",
            mode: "persistent",
            cwd: "/workspace/openclaw",
          },
        },
      },
    ],
  },
  bindings: [
    {
      type: "acp",
      agentId: "codex",
      match: {
        channel: "discord",
        accountId: "default",
        peer: { kind: "channel", id: "222222222222222222" },
      },
      acp: { label: "codex-main" },
    },
  ],
  channels: {
    discord: {
      guilds: {
        "111111111111111111": {
          channels: {
            "222222222222222222": {
              requireMention: false,
            },
          },
        },
      },
    },
  },
}
```

    หมายเหตุ:

    - `/acp spawn codex --bind here` จะผูกช่องหรือเธรด Discord ปัจจุบันไว้ ณ ตำแหน่งเดิม และทำให้ข้อความในอนาคตยังคงถูกกำหนดเส้นทางไปยังเซสชัน ACP เดิม
    - นี่ยังอาจหมายถึง "เริ่มเซสชัน Codex ACP ใหม่" แต่จะไม่สร้างเธรด Discord ใหม่ด้วยตัวมันเอง พื้นที่แชตยังคงเป็นช่องเดิม
    - Codex อาจยังคงทำงานใน `cwd` หรือ workspace ของ backend บนดิสก์ของตัวเอง workspace นั้นเป็นสถานะรันไทม์ ไม่ใช่เธรด Discord
    - ข้อความในเธรดสามารถสืบทอด ACP binding ของช่องแม่ได้
    - ในช่องหรือเธรดที่ถูกผูกไว้ `/new` และ `/reset` จะรีเซ็ตเซสชัน ACP เดิม ณ ที่เดิม
    - thread binding แบบชั่วคราวยังคงทำงานได้ และสามารถ override การ resolve เป้าหมายขณะใช้งานอยู่
    - `spawnAcpSessions` จำเป็นเฉพาะเมื่อ OpenClaw ต้องสร้าง/ผูก child thread ผ่าน `--thread auto|here` เท่านั้น ไม่จำเป็นสำหรับ `/acp spawn ... --bind here` ในช่องปัจจุบัน

    ดู [ACP Agents](/th/tools/acp-agents) สำหรับรายละเอียดพฤติกรรมของ binding

  </Accordion>

  <Accordion title="การแจ้งเตือนรีแอ็กชัน">
    โหมดการแจ้งเตือนรีแอ็กชันต่อ guild:

    - `off`
    - `own` (ค่าเริ่มต้น)
    - `all`
    - `allowlist` (ใช้ `guilds.<id>.users`)

    เหตุการณ์รีแอ็กชันจะถูกแปลงเป็น system event และแนบไปยังเซสชัน Discord ที่ถูกกำหนดเส้นทาง

  </Accordion>

  <Accordion title="รีแอ็กชันตอบรับ">
    `ackReaction` จะส่งอีโมจิรับทราบขณะที่ OpenClaw กำลังประมวลผลข้อความขาเข้า

    ลำดับการ resolve:

    - `channels.discord.accounts.<accountId>.ackReaction`
    - `channels.discord.ackReaction`
    - `messages.ackReaction`
    - fallback เป็นอีโมจิ identity ของเอเจนต์ (`agents.list[].identity.emoji`, ถ้าไม่มีใช้ "👀")

    หมายเหตุ:

    - Discord ยอมรับอีโมจิ unicode หรือชื่อ custom emoji
    - ใช้ `""` เพื่อปิดรีแอ็กชันสำหรับช่องหรือบัญชี

  </Accordion>

  <Accordion title="การเขียน config">
    การเขียน config ที่เริ่มจากช่องทางถูกเปิดใช้เป็นค่าเริ่มต้น

    สิ่งนี้มีผลกับ flow ของ `/config set|unset` (เมื่อเปิดใช้ฟีเจอร์คำสั่ง)

    ปิดใช้งาน:

```json5
{
  channels: {
    discord: {
      configWrites: false,
    },
  },
}
```

  </Accordion>

  <Accordion title="พร็อกซี Gateway">
    กำหนดเส้นทางทราฟฟิก WebSocket ของ Discord gateway และ REST lookups ตอนเริ่มต้น (application ID + allowlist resolution) ผ่าน HTTP(S) proxy ด้วย `channels.discord.proxy`

```json5
{
  channels: {
    discord: {
      proxy: "http://proxy.example:8080",
    },
  },
}
```

    override ต่อบัญชี:

```json5
{
  channels: {
    discord: {
      accounts: {
        primary: {
          proxy: "http://proxy.example:8080",
        },
      },
    },
  },
}
```

  </Accordion>

  <Accordion title="การรองรับ PluralKit">
    เปิดใช้การ resolve ของ PluralKit เพื่อแมปข้อความที่ถูก proxy ไปยังอัตลักษณ์ของ system member:

```json5
{
  channels: {
    discord: {
      pluralkit: {
        enabled: true,
        token: "pk_live_...", // ไม่บังคับ; จำเป็นสำหรับระบบส่วนตัว
      },
    },
  },
}
```

    หมายเหตุ:

    - allowlist สามารถใช้ `pk:<memberId>` ได้
    - ชื่อแสดงของสมาชิกจะถูกจับคู่ด้วย name/slug เท่านั้นเมื่อ `channels.discord.dangerouslyAllowNameMatching: true`
    - การ lookup ใช้ ID ข้อความต้นฉบับและถูกจำกัดด้วยหน้าต่างเวลา
    - หาก lookup ล้มเหลว ข้อความที่ถูก proxy จะถูกมองเป็นข้อความจากบอตและจะถูกทิ้ง เว้นแต่ `allowBots=true`

  </Accordion>

  <Accordion title="การกำหนดค่า Presence">
    การอัปเดต Presence จะถูกนำไปใช้เมื่อคุณตั้งค่าฟิลด์สถานะหรือกิจกรรม หรือเมื่อคุณเปิดใช้ auto presence

    ตัวอย่างเฉพาะสถานะ:

```json5
{
  channels: {
    discord: {
      status: "idle",
    },
  },
}
```

    ตัวอย่างกิจกรรม (custom status คือประเภทกิจกรรมเริ่มต้น):

```json5
{
  channels: {
    discord: {
      activity: "เวลามีสมาธิ",
      activityType: 4,
    },
  },
}
```

    ตัวอย่างการสตรีม:

```json5
{
  channels: {
    discord: {
      activity: "Live coding",
      activityType: 1,
      activityUrl: "https://twitch.tv/openclaw",
    },
  },
}
```

    แผนที่ประเภทกิจกรรม:

    - 0: กำลังเล่น
    - 1: กำลังสตรีม (ต้องใช้ `activityUrl`)
    - 2: กำลังฟัง
    - 3: กำลังดู
    - 4: Custom (ใช้ข้อความกิจกรรมเป็นสถานะสถานะ; อีโมจิเป็นตัวเลือก)
    - 5: กำลังแข่งขัน

    ตัวอย่าง auto presence (สัญญาณสุขภาพรันไทม์):

```json5
{
  channels: {
    discord: {
      autoPresence: {
        enabled: true,
        intervalMs: 30000,
        minUpdateIntervalMs: 15000,
        exhaustedText: "token exhausted",
      },
    },
  },
}
```

    auto presence จะจับคู่ความพร้อมใช้งานของรันไทม์กับสถานะของ Discord ดังนี้: healthy => online, degraded หรือ unknown => idle, exhausted หรือ unavailable => dnd ข้อความ override แบบไม่บังคับ:

    - `autoPresence.healthyText`
    - `autoPresence.degradedText`
    - `autoPresence.exhaustedText` (รองรับ placeholder `{reason}`)

  </Accordion>

  <Accordion title="การอนุมัติใน Discord">
    Discord รองรับการจัดการการอนุมัติด้วยปุ่มใน DM และสามารถเลือกโพสต์พรอมป์การอนุมัติในช่องต้นทางได้

    เส้นทาง config:

    - `channels.discord.execApprovals.enabled`
    - `channels.discord.execApprovals.approvers` (ไม่บังคับ; fallback ไปที่ `commands.ownerAllowFrom` เมื่อทำได้)
    - `channels.discord.execApprovals.target` (`dm` | `channel` | `both`, ค่าเริ่มต้น: `dm`)
    - `agentFilter`, `sessionFilter`, `cleanupAfterResolve`

    Discord จะเปิดใช้ native exec approvals โดยอัตโนมัติเมื่อ `enabled` ไม่ได้ถูกตั้งค่า หรือเป็น `"auto"` และสามารถ resolve approver ได้อย่างน้อยหนึ่งคน ไม่ว่าจะจาก `execApprovals.approvers` หรือจาก `commands.ownerAllowFrom` Discord จะไม่อนุมาน exec approver จาก `allowFrom` ของช่อง, `dm.allowFrom` แบบเดิม หรือ `defaultTo` ของ direct-message ตั้งค่า `enabled: false` เพื่อปิด Discord ในฐานะ native approval client อย่างชัดเจน

    เมื่อ `target` เป็น `channel` หรือ `both` พรอมป์การอนุมัติจะมองเห็นได้ในช่อง มีเพียง approver ที่ resolve ได้เท่านั้นที่ใช้ปุ่มได้; ผู้ใช้อื่นจะได้รับการปฏิเสธแบบ ephemeral พรอมป์การอนุมัติจะรวมข้อความคำสั่งไว้ด้วย ดังนั้นให้เปิดใช้การส่งในช่องเฉพาะช่องที่เชื่อถือได้เท่านั้น หากไม่สามารถหา channel ID จาก session key ได้ OpenClaw จะ fallback ไปส่งทาง DM

    Discord ยังเรนเดอร์ปุ่มอนุมัติแบบใช้ร่วมกันที่ช่องแชตอื่นใช้ด้วย ตัว adapter แบบเนทีฟของ Discord ส่วนใหญ่เพิ่มการกำหนดเส้นทาง DM สำหรับ approver และการกระจายไปยังช่อง
    เมื่อมีปุ่มเหล่านั้นอยู่ ปุ่มเหล่านี้คือ UX หลักสำหรับการอนุมัติ OpenClaw
    ควรใส่คำสั่ง `/approve` แบบ manual เฉพาะเมื่อผลลัพธ์ของ tool ระบุว่า
    การอนุมัติผ่านแชตไม่พร้อมใช้งาน หรือการอนุมัติแบบ manual เป็นหนทางเดียว

    Gateway auth สำหรับตัวจัดการนี้ใช้สัญญา credential resolution แบบใช้ร่วมกันเดียวกับ Gateway client อื่น:

    - การยืนยันตัวตนแบบ local ที่ใช้ env ก่อน (`OPENCLAW_GATEWAY_TOKEN` / `OPENCLAW_GATEWAY_PASSWORD` แล้วตามด้วย `gateway.auth.*`)
    - ในโหมด local, `gateway.remote.*` สามารถใช้เป็น fallback ได้เฉพาะเมื่อ `gateway.auth.*` ไม่ได้ถูกตั้งค่า; local SecretRef ที่ถูกตั้งค่าแต่ resolve ไม่ได้จะ fail closed
    - รองรับโหมด remote ผ่าน `gateway.remote.*` เมื่อเกี่ยวข้อง
    - URL override ปลอดภัยต่อการ override: การ override ผ่าน CLI จะไม่ใช้ credential โดยปริยายซ้ำ และการ override ผ่าน env จะใช้เฉพาะ credential จาก env เท่านั้น

    พฤติกรรมการ resolve การอนุมัติ:

    - ID ที่ขึ้นต้นด้วย `plugin:` จะ resolve ผ่าน `plugin.approval.resolve`
    - ID อื่นจะ resolve ผ่าน `exec.approval.resolve`
    - Discord จะไม่ทำ fallback เพิ่มเติมจาก exec ไป plugin ในจุดนี้; คำนำหน้า
      ของ id จะเป็นตัวตัดสินว่าจะเรียกเมธอด gateway ใด

    Exec approvals จะหมดอายุภายใน 30 นาทีโดยค่าเริ่มต้น หากการอนุมัติล้มเหลวพร้อม
    approval ID ที่ไม่รู้จัก ให้ตรวจสอบการ resolve approver การเปิดใช้ฟีเจอร์ และ
    ชนิดของ approval id ที่ส่งมอบว่าตรงกับคำขอที่รอดำเนินการหรือไม่

    เอกสารที่เกี่ยวข้อง: [Exec approvals](/th/tools/exec-approvals)

  </Accordion>
</AccordionGroup>

## Tools และ action gates

การกระทำกับข้อความ Discord ครอบคลุมการส่งข้อความ การดูแลช่อง การกลั่นกรอง presence และการกระทำเกี่ยวกับ metadata

ตัวอย่างหลัก:

- การส่งข้อความ: `sendMessage`, `readMessages`, `editMessage`, `deleteMessage`, `threadReply`
- รีแอ็กชัน: `react`, `reactions`, `emojiList`
- การกลั่นกรอง: `timeout`, `kick`, `ban`
- presence: `setPresence`

การกระทำ `event-create` ยอมรับพารามิเตอร์ `image` แบบไม่บังคับ (URL หรือพาธไฟล์ในเครื่อง) เพื่อใช้ตั้งค่ารูปภาพปกของ scheduled event

action gate อยู่ภายใต้ `channels.discord.actions.*`

พฤติกรรม gate เริ่มต้น:

| กลุ่มการกระทำ                                                                                                                                                            | ค่าเริ่มต้น |
| ------------------------------------------------------------------------------------------------------------------------------------------------------------------------ | ----------- |
| reactions, messages, threads, pins, polls, search, memberInfo, roleInfo, channelInfo, channels, voiceStatus, events, stickers, emojiUploads, stickerUploads, permissions | เปิดใช้     |
| roles                                                                                                                                                                    | ปิดใช้      |
| moderation                                                                                                                                                               | ปิดใช้      |
| presence                                                                                                                                                                 | ปิดใช้      |

## UI ของ Components v2

OpenClaw ใช้ Discord components v2 สำหรับ exec approvals และเครื่องหมายข้ามบริบท การกระทำกับข้อความ Discord ยังสามารถรับ `components` สำหรับ UI แบบกำหนดเองได้ (ขั้นสูง; ต้องสร้าง payload ของ component ผ่าน discord tool) ขณะที่ `embeds` แบบเดิมยังคงใช้งานได้แต่ไม่แนะนำ

- `channels.discord.ui.components.accentColor` ใช้กำหนดสี accent ที่ใช้โดย container ของ Discord component (hex)
- ตั้งค่าต่อบัญชีได้ด้วย `channels.discord.accounts.<id>.ui.components.accentColor`
- `embeds` จะถูกละเว้นเมื่อมี components v2 อยู่

ตัวอย่าง:

```json5
{
  channels: {
    discord: {
      ui: {
        components: {
          accentColor: "#5865F2",
        },
      },
    },
  },
}
```

## ช่องเสียง

OpenClaw สามารถเข้าร่วมช่องเสียง Discord สำหรับการสนทนาแบบต่อเนื่องแบบเรียลไทม์ได้ ซึ่งแยกจากไฟล์แนบข้อความเสียง

ข้อกำหนด:

- เปิดใช้คำสั่งแบบเนทีฟ (`commands.native` หรือ `channels.discord.commands.native`)
- กำหนดค่า `channels.discord.voice`
- บอตต้องมีสิทธิ์ Connect + Speak ในช่องเสียงเป้าหมาย

ใช้คำสั่งแบบเนทีฟเฉพาะ Discord `/vc join|leave|status` เพื่อควบคุมเซสชัน คำสั่งนี้ใช้เอเจนต์เริ่มต้นของบัญชี และเป็นไปตามกฎ allowlist และ group policy เดียวกับคำสั่ง Discord อื่น

ตัวอย่างการเข้าร่วมอัตโนมัติ:

```json5
{
  channels: {
    discord: {
      voice: {
        enabled: true,
        autoJoin: [
          {
            guildId: "123456789012345678",
            channelId: "234567890123456789",
          },
        ],
        daveEncryption: true,
        decryptionFailureTolerance: 24,
        tts: {
          provider: "openai",
          openai: { voice: "alloy" },
        },
      },
    },
  },
}
```

หมายเหตุ:

- `voice.tts` จะ override `messages.tts` สำหรับการเล่นเสียงเท่านั้น
- เทิร์นถอดเสียงจากช่องเสียงจะอนุมานสถานะเจ้าของจาก Discord `allowFrom` (หรือ `dm.allowFrom`); ผู้พูดที่ไม่ใช่เจ้าของจะไม่สามารถเข้าถึง tool ที่จำกัดเฉพาะเจ้าของได้ (เช่น `gateway` และ `cron`)
- ช่องเสียงเปิดใช้งานเป็นค่าเริ่มต้น; ตั้งค่า `channels.discord.voice.enabled=false` เพื่อปิดใช้งาน
- `voice.daveEncryption` และ `voice.decryptionFailureTolerance` จะส่งผ่านไปยังตัวเลือก join ของ `@discordjs/voice`
- ค่าเริ่มต้นของ `@discordjs/voice` คือ `daveEncryption=true` และ `decryptionFailureTolerance=24` หากไม่ได้ตั้งค่า
- OpenClaw ยังเฝ้าดูความล้มเหลวในการถอดรหัสฝั่งรับ และกู้คืนอัตโนมัติโดยออกจากช่องเสียงแล้วเข้าร่วมใหม่หลังเกิดความล้มเหลวซ้ำหลายครั้งในช่วงเวลาสั้น ๆ
- หากล็อกรับแสดง `DecryptionFailed(UnencryptedWhenPassthroughDisabled)` ซ้ำ ๆ ปัญหานี้อาจเป็นบั๊กการรับของ `@discordjs/voice` ฝั่ง upstream ที่ติดตามไว้ใน [discord.js #11419](https://github.com/discordjs/discord.js/issues/11419)

## ข้อความเสียง

ข้อความเสียงของ Discord จะแสดงตัวอย่างคลื่นเสียงและต้องใช้เสียง OGG/Opus พร้อม metadata OpenClaw จะสร้าง waveform ให้อัตโนมัติ แต่ต้องมี `ffmpeg` และ `ffprobe` พร้อมใช้งานบนโฮสต์ที่รัน gateway เพื่อใช้ตรวจสอบและแปลงไฟล์เสียง

ข้อกำหนดและข้อจำกัด:

- ต้องระบุเป็น **พาธไฟล์ในเครื่อง** (URL จะถูกปฏิเสธ)
- ห้ามใส่เนื้อหาข้อความ (Discord ไม่อนุญาตให้ส่งข้อความและข้อความเสียงใน payload เดียวกัน)
- รองรับไฟล์เสียงได้ทุกฟอร์แมต; OpenClaw จะแปลงเป็น OGG/Opus เมื่อจำเป็น

ตัวอย่าง:

```bash
message(action="send", channel="discord", target="channel:123", path="/path/to/audio.mp3", asVoice=true)
```

## การแก้ไขปัญหา

<AccordionGroup>
  <Accordion title="ใช้ intents ที่ไม่อนุญาต หรือบอตไม่เห็นข้อความ guild">

    - เปิดใช้ Message Content Intent
    - เปิดใช้ Server Members Intent เมื่อคุณพึ่งพาการ resolve ผู้ใช้/สมาชิก
    - รีสตาร์ต gateway หลังเปลี่ยน intents

  </Accordion>

  <Accordion title="ข้อความ guild ถูกบล็อกโดยไม่คาดคิด">

    - ตรวจสอบ `groupPolicy`
    - ตรวจสอบ guild allowlist ภายใต้ `channels.discord.guilds`
    - หากมีแผนที่ `channels` ของ guild อยู่ จะอนุญาตเฉพาะช่องที่อยู่ในรายการเท่านั้น
    - ตรวจสอบพฤติกรรม `requireMention` และรูปแบบการ mention

    คำสั่งตรวจสอบที่มีประโยชน์:

```bash
openclaw doctor
openclaw channels status --probe
openclaw logs --follow
```

  </Accordion>

  <Accordion title="ตั้ง requireMention เป็น false แล้วแต่ยังถูกบล็อก">
    สาเหตุที่พบบ่อย:

    - `groupPolicy="allowlist"` โดยไม่มี guild/channel allowlist ที่ตรงกัน
    - กำหนดค่า `requireMention` ไว้ผิดตำแหน่ง (ต้องอยู่ใต้ `channels.discord.guilds` หรือรายการช่อง)
    - ผู้ส่งถูกบล็อกโดย guild/channel `users` allowlist

  </Accordion>

  <Accordion title="ตัวจัดการที่ทำงานนานหมดเวลา หรือมีการตอบซ้ำ">

    ล็อกที่พบได้ทั่วไป:

    - `Listener DiscordMessageListener timed out after 30000ms for event MESSAGE_CREATE`
    - `Slow listener detected ...`
    - `discord inbound worker timed out after ...`

    ตัวปรับงบเวลาของ listener:

    - บัญชีเดียว: `channels.discord.eventQueue.listenerTimeout`
    - หลายบัญชี: `channels.discord.accounts.<accountId>.eventQueue.listenerTimeout`

    ตัวปรับเวลาหมดอายุของ worker run:

    - บัญชีเดียว: `channels.discord.inboundWorker.runTimeoutMs`
    - หลายบัญชี: `channels.discord.accounts.<accountId>.inboundWorker.runTimeoutMs`
    - ค่าเริ่มต้น: `1800000` (30 นาที); ตั้งค่า `0` เพื่อปิดใช้งาน

    baseline ที่แนะนำ:

```json5
{
  channels: {
    discord: {
      accounts: {
        default: {
          eventQueue: {
            listenerTimeout: 120000,
          },
          inboundWorker: {
            runTimeoutMs: 1800000,
          },
        },
      },
    },
  },
}
```

    ใช้ `eventQueue.listenerTimeout` สำหรับการตั้งค่า listener ที่ช้า และใช้ `inboundWorker.runTimeoutMs`
    เฉพาะเมื่อคุณต้องการวาล์วนิรภัยแยกต่างหากสำหรับเทิร์นของเอเจนต์ที่อยู่ในคิว

  </Accordion>

  <Accordion title="การตรวจสอบสิทธิ์ไม่ตรงกันในการ audit">
    การตรวจสอบสิทธิ์ของ `channels status --probe` ใช้งานได้เฉพาะกับ channel ID แบบตัวเลขเท่านั้น

    หากคุณใช้คีย์แบบ slug การจับคู่ในรันไทม์ยังอาจทำงานได้ แต่ probe จะไม่สามารถตรวจสอบสิทธิ์ได้ครบถ้วน

  </Accordion>

  <Accordion title="ปัญหา DM และการจับคู่">

    - ปิดใช้งาน DM: `channels.discord.dm.enabled=false`
    - ปิดใช้นโยบาย DM: `channels.discord.dmPolicy="disabled"` (แบบเดิม: `channels.discord.dm.policy`)
    - กำลังรอการอนุมัติการจับคู่ในโหมด `pairing`

  </Accordion>

  <Accordion title="ลูประหว่างบอต">
    โดยค่าเริ่มต้น ข้อความที่ส่งโดยบอตจะถูกละเว้น

    หากคุณตั้งค่า `channels.discord.allowBots=true` ให้ใช้กฎ mention และ allowlist ที่เข้มงวดเพื่อหลีกเลี่ยงพฤติกรรมลูป
    ควรใช้ `channels.discord.allowBots="mentions"` เพื่อยอมรับเฉพาะข้อความจากบอตที่ mention บอตเท่านั้น

  </Accordion>

  <Accordion title="Voice STT หลุดพร้อม DecryptionFailed(...)">

    - อัปเดต OpenClaw ให้เป็นปัจจุบัน (`openclaw update`) เพื่อให้มี logic การกู้คืนการรับเสียงของ Discord
    - ยืนยันว่า `channels.discord.voice.daveEncryption=true` (ค่าเริ่มต้น)
    - เริ่มจาก `channels.discord.voice.decryptionFailureTolerance=24` (ค่าเริ่มต้นของ upstream) และปรับเฉพาะเมื่อจำเป็น
    - ดูล็อกสำหรับ:
      - `discord voice: DAVE decrypt failures detected`
      - `discord voice: repeated decrypt failures; attempting rejoin`
    - หากยังล้มเหลวหลังจากเข้าร่วมใหม่อัตโนมัติ ให้เก็บล็อกและเปรียบเทียบกับ [discord.js #11419](https://github.com/discordjs/discord.js/issues/11419)

  </Accordion>
</AccordionGroup>

## ตัวชี้ไปยังเอกสารอ้างอิงการกำหนดค่า

เอกสารอ้างอิงหลัก:

- [เอกสารอ้างอิงการกำหนดค่า - Discord](/th/gateway/configuration-reference#discord)

ฟิลด์ Discord ที่มีสัญญาณสำคัญสูง:

- การเริ่มต้น/การยืนยันตัวตน: `enabled`, `token`, `accounts.*`, `allowBots`
- นโยบาย: `groupPolicy`, `dm.*`, `guilds.*`, `guilds.*.channels.*`
- คำสั่ง: `commands.native`, `commands.useAccessGroups`, `configWrites`, `slashCommand.*`
- event queue: `eventQueue.listenerTimeout` (งบเวลาของ listener), `eventQueue.maxQueueSize`, `eventQueue.maxConcurrency`
- inbound worker: `inboundWorker.runTimeoutMs`
- การตอบกลับ/ประวัติ: `replyToMode`, `historyLimit`, `dmHistoryLimit`, `dms.*.historyLimit`
- การส่งมอบ: `textChunkLimit`, `chunkMode`, `maxLinesPerMessage`
- การสตรีม: `streaming` (alias แบบเดิม: `streamMode`), `streaming.preview.toolProgress`, `draftChunk`, `blockStreaming`, `blockStreamingCoalesce`
- สื่อ/การลองใหม่: `mediaMaxMb`, `retry`
  - `mediaMaxMb` จำกัดการอัปโหลด Discord ขาออก (ค่าเริ่มต้น: `100MB`)
- การกระทำ: `actions.*`
- presence: `activity`, `status`, `activityType`, `activityUrl`
- UI: `ui.components.accentColor`
- ฟีเจอร์: `threadBindings`, `bindings[]` ระดับบนสุด (`type: "acp"`), `pluralkit`, `execApprovals`, `intents`, `agentComponents`, `heartbeat`, `responsePrefix`

## ความปลอดภัยและการดำเนินงาน

- ให้ถือว่า bot token เป็นความลับ (ควรใช้ `DISCORD_BOT_TOKEN` ในสภาพแวดล้อมที่มีการดูแล)
- มอบสิทธิ์ Discord เท่าที่จำเป็นขั้นต่ำ
- หากการ deploy/state ของคำสั่งล้าสมัย ให้รีสตาร์ต gateway และตรวจสอบอีกครั้งด้วย `openclaw channels status --probe`

## ที่เกี่ยวข้อง

- [การจับคู่](/th/channels/pairing)
- [กลุ่ม](/th/channels/groups)
- [การกำหนดเส้นทางช่องทาง](/th/channels/channel-routing)
- [ความปลอดภัย](/th/gateway/security)
- [การกำหนดเส้นทางหลายเอเจนต์](/th/concepts/multi-agent)
- [การแก้ไขปัญหา](/th/channels/troubleshooting)
- [คำสั่ง Slash](/th/tools/slash-commands)
