---
read_when:
    - การทำงานกับความสามารถของแชแนล Discord
summary: สถานะการรองรับ ความสามารถ และการกำหนดค่าของบอต Discord
title: Discord
x-i18n:
    generated_at: "2026-04-24T08:57:48Z"
    model: gpt-5.4
    provider: openai
    source_hash: ce73e0e6995702f3b2453b2e5ab4e55b02190e64fdf5805f53b4002be63140a2
    source_path: channels/discord.md
    workflow: 15
---

พร้อมใช้งานสำหรับ DM และแชนแนลกิลด์ผ่าน Discord gateway อย่างเป็นทางการ

<CardGroup cols={3}>
  <Card title="การจับคู่" icon="link" href="/th/channels/pairing">
    Discord DM ใช้โหมดการจับคู่เป็นค่าเริ่มต้น
  </Card>
  <Card title="คำสั่ง slash" icon="terminal" href="/th/tools/slash-commands">
    พฤติกรรมคำสั่งแบบเนทีฟและแค็ตตาล็อกคำสั่ง
  </Card>
  <Card title="การแก้ไขปัญหาแชนแนล" icon="wrench" href="/th/channels/troubleshooting">
    การวินิจฉัยและขั้นตอนการซ่อมแซมข้ามแชนแนล
  </Card>
</CardGroup>

## การตั้งค่าอย่างรวดเร็ว

คุณจะต้องสร้างแอปพลิเคชันใหม่พร้อมบอต เพิ่มบอตไปยังเซิร์ฟเวอร์ของคุณ และจับคู่กับ OpenClaw เราแนะนำให้เพิ่มบอตของคุณไปยังเซิร์ฟเวอร์ส่วนตัวของคุณเอง หากคุณยังไม่มี [ให้สร้างก่อน](https://support.discord.com/hc/en-us/articles/204849977-How-do-I-create-a-server) (เลือก **Create My Own > For me and my friends**)

<Steps>
  <Step title="สร้างแอปพลิเคชัน Discord และบอต">
    ไปที่ [Discord Developer Portal](https://discord.com/developers/applications) แล้วคลิก **New Application** ตั้งชื่อประมาณว่า "OpenClaw"

    คลิก **Bot** ที่แถบด้านข้าง ตั้งค่า **Username** เป็นชื่อที่คุณใช้เรียกเอเจนต์ OpenClaw ของคุณ

  </Step>

  <Step title="เปิดใช้งาน privileged intents">
    ขณะที่ยังอยู่ในหน้า **Bot** ให้เลื่อนลงไปที่ **Privileged Gateway Intents** แล้วเปิดใช้งาน:

    - **Message Content Intent** (จำเป็น)
    - **Server Members Intent** (แนะนำ; จำเป็นสำหรับ role allowlists และการจับคู่ชื่อกับ ID)
    - **Presence Intent** (ไม่บังคับ; ต้องใช้เฉพาะสำหรับการอัปเดตสถานะการออนไลน์)

  </Step>

  <Step title="คัดลอก bot token ของคุณ">
    เลื่อนกลับขึ้นไปด้านบนของหน้า **Bot** แล้วคลิก **Reset Token**

    <Note>
    แม้ชื่อจะเป็นเช่นนั้น แต่นี่คือการสร้าง token แรกของคุณ — ไม่มีอะไรถูก "รีเซ็ต"
    </Note>

    คัดลอก token แล้วบันทึกไว้ที่ใดที่หนึ่ง นี่คือ **Bot Token** ของคุณ และคุณจะต้องใช้ในอีกไม่ช้า

  </Step>

  <Step title="สร้าง invite URL และเพิ่มบอตไปยังเซิร์ฟเวอร์ของคุณ">
    คลิก **OAuth2** ที่แถบด้านข้าง คุณจะสร้าง invite URL ที่มีสิทธิ์ถูกต้องเพื่อเพิ่มบอตไปยังเซิร์ฟเวอร์ของคุณ

    เลื่อนลงไปที่ **OAuth2 URL Generator** แล้วเปิดใช้งาน:

    - `bot`
    - `applications.commands`

    ส่วน **Bot Permissions** จะปรากฏด้านล่าง เปิดใช้งานอย่างน้อย:

    **General Permissions**
      - View Channels
    **Text Permissions**
      - Send Messages
      - Read Message History
      - Embed Links
      - Attach Files
      - Add Reactions (ไม่บังคับ)

    นี่คือชุดสิทธิ์พื้นฐานสำหรับแชนแนลข้อความทั่วไป หากคุณวางแผนจะโพสต์ใน Discord threads รวมถึงเวิร์กโฟลว์ของ forum หรือ media channel ที่สร้างหรือดำเนินเธรดต่อ ให้เปิดใช้งาน **Send Messages in Threads** เพิ่มเติมด้วย
    คัดลอก URL ที่สร้างขึ้นที่ด้านล่าง วางลงในเบราว์เซอร์ของคุณ เลือกเซิร์ฟเวอร์ของคุณ แล้วคลิก **Continue** เพื่อเชื่อมต่อ ตอนนี้คุณควรเห็นบอตของคุณในเซิร์ฟเวอร์ Discord แล้ว

  </Step>

  <Step title="เปิดใช้งาน Developer Mode และรวบรวม ID ของคุณ">
    กลับไปที่แอป Discord คุณต้องเปิดใช้งาน Developer Mode เพื่อให้สามารถคัดลอก ID ภายในได้

    1. คลิก **User Settings** (ไอคอนรูปเฟืองข้างอวาตาร์ของคุณ) → **Advanced** → เปิด **Developer Mode**
    2. คลิกขวาที่ **ไอคอนเซิร์ฟเวอร์** ของคุณในแถบด้านข้าง → **Copy Server ID**
    3. คลิกขวาที่ **อวาตาร์ของคุณเอง** → **Copy User ID**

    บันทึก **Server ID** และ **User ID** ไว้พร้อมกับ Bot Token ของคุณ — คุณจะส่งทั้งสามค่านี้ให้ OpenClaw ในขั้นตอนถัดไป

  </Step>

  <Step title="อนุญาต DM จากสมาชิกเซิร์ฟเวอร์">
    เพื่อให้การจับคู่ทำงานได้ Discord ต้องอนุญาตให้บอตส่ง DM ถึงคุณ คลิกขวาที่ **ไอคอนเซิร์ฟเวอร์** ของคุณ → **Privacy Settings** → เปิด **Direct Messages**

    การทำเช่นนี้จะอนุญาตให้สมาชิกเซิร์ฟเวอร์ (รวมถึงบอต) ส่ง DM ถึงคุณได้ เปิดค่านี้ไว้หากคุณต้องการใช้ Discord DM กับ OpenClaw หากคุณวางแผนจะใช้เฉพาะแชนแนลกิลด์ คุณสามารถปิด DM ได้หลังจากจับคู่เสร็จแล้ว

  </Step>

  <Step title="ตั้งค่า bot token ของคุณอย่างปลอดภัย (อย่าส่งในแชต)">
    Discord bot token ของคุณเป็นข้อมูลลับ (เหมือนรหัสผ่าน) ตั้งค่าไว้บนเครื่องที่รัน OpenClaw ก่อนส่งข้อความหาเอเจนต์ของคุณ

```bash
export DISCORD_BOT_TOKEN="YOUR_BOT_TOKEN"
openclaw config set channels.discord.token --ref-provider default --ref-source env --ref-id DISCORD_BOT_TOKEN --dry-run
openclaw config set channels.discord.token --ref-provider default --ref-source env --ref-id DISCORD_BOT_TOKEN
openclaw config set channels.discord.enabled true --strict-json
openclaw gateway
```

    หาก OpenClaw กำลังทำงานอยู่แล้วในฐานะบริการเบื้องหลัง ให้รีสตาร์ตผ่านแอป OpenClaw บน Mac หรือโดยหยุดแล้วเริ่มโปรเซส `openclaw gateway run` ใหม่

  </Step>

  <Step title="กำหนดค่า OpenClaw และจับคู่">

    <Tabs>
      <Tab title="ถามเอเจนต์ของคุณ">
        แชตกับเอเจนต์ OpenClaw ของคุณบนแชนแนลอื่นที่มีอยู่แล้ว (เช่น Telegram) แล้วบอกดังนี้ หาก Discord เป็นแชนแนลแรกของคุณ ให้ใช้แท็บ CLI / config แทน

        > "ฉันได้ตั้งค่า Discord bot token ใน config แล้ว โปรดตั้งค่า Discord ให้เสร็จโดยใช้ User ID `<user_id>` และ Server ID `<server_id>`"
      </Tab>
      <Tab title="CLI / config">
        หากคุณต้องการใช้ config แบบไฟล์ ให้ตั้งค่าดังนี้:

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

        env fallback สำหรับบัญชีเริ่มต้น:

```bash
DISCORD_BOT_TOKEN=...
```

        รองรับค่า `token` แบบ plaintext ด้วย รองรับค่า SecretRef สำหรับ `channels.discord.token` เช่นกันในผู้ให้บริการ env/file/exec ดู [Secrets Management](/th/gateway/secrets)

      </Tab>
    </Tabs>

  </Step>

  <Step title="อนุมัติการจับคู่ DM ครั้งแรก">
    รอจน gateway ทำงานอยู่ จากนั้นส่ง DM ถึงบอตของคุณใน Discord บอตจะตอบกลับด้วยรหัสการจับคู่

    <Tabs>
      <Tab title="ถามเอเจนต์ของคุณ">
        ส่งรหัสการจับคู่ไปยังเอเจนต์ของคุณบนแชนแนลที่คุณใช้อยู่แล้ว:

        > "อนุมัติรหัสการจับคู่ Discord นี้: `<CODE>`"
      </Tab>
      <Tab title="CLI">

```bash
openclaw pairing list discord
openclaw pairing approve discord <CODE>
```

      </Tab>
    </Tabs>

    รหัสการจับคู่จะหมดอายุภายใน 1 ชั่วโมง

    ตอนนี้คุณควรสามารถแชตกับเอเจนต์ของคุณใน Discord ผ่าน DM ได้แล้ว

  </Step>
</Steps>

<Note>
การแยกหา token รับรู้ตามบัญชี ค่า token ใน config จะมีลำดับความสำคัญเหนือ env fallback เสมอ `DISCORD_BOT_TOKEN` จะถูกใช้สำหรับบัญชีเริ่มต้นเท่านั้น
สำหรับการเรียกขาออกขั้นสูง (การทำงานของ message tool/channel) จะใช้ `token` แบบระบุต่อการเรียกสำหรับการเรียกครั้งนั้น สิ่งนี้ใช้กับการส่งและการทำงานแบบอ่าน/ตรวจสอบ เช่น read/search/fetch/thread/pins/permissions ส่วนการตั้งค่านโยบายบัญชี/การลองใหม่ยังคงมาจากบัญชีที่เลือกใน snapshot ของ runtime ที่กำลังใช้งาน
</Note>

## คำแนะนำ: ตั้งค่า guild workspace

เมื่อ DM ใช้งานได้แล้ว คุณสามารถตั้งค่าเซิร์ฟเวอร์ Discord ของคุณเป็น workspace แบบเต็ม ที่แต่ละแชนแนลจะมีเซสชันเอเจนต์ของตัวเองพร้อมบริบทของตัวเอง วิธีนี้แนะนำสำหรับเซิร์ฟเวอร์ส่วนตัวที่มีแค่คุณกับบอตของคุณ

<Steps>
  <Step title="เพิ่มเซิร์ฟเวอร์ของคุณลงใน guild allowlist">
    การทำเช่นนี้จะทำให้เอเจนต์ของคุณตอบกลับได้ในทุกแชนแนลบนเซิร์ฟเวอร์ของคุณ ไม่ใช่แค่ DM

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

  <Step title="อนุญาตให้ตอบกลับโดยไม่ต้อง @mention">
    โดยค่าเริ่มต้น เอเจนต์ของคุณจะตอบกลับในแชนแนลกิลด์เมื่อถูก @mention เท่านั้น สำหรับเซิร์ฟเวอร์ส่วนตัว คุณน่าจะต้องการให้ตอบทุกข้อความ

    <Tabs>
      <Tab title="ถามเอเจนต์ของคุณ">
        > "อนุญาตให้เอเจนต์ของฉันตอบกลับบนเซิร์ฟเวอร์นี้โดยไม่ต้องถูก @mention"
      </Tab>
      <Tab title="Config">
        ตั้งค่า `requireMention: false` ใน config ของ guild ของคุณ:

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

  <Step title="วางแผนเรื่องหน่วยความจำในแชนแนลกิลด์">
    โดยค่าเริ่มต้น หน่วยความจำระยะยาว (`MEMORY.md`) จะโหลดเฉพาะในเซสชัน DM เท่านั้น แชนแนลกิลด์จะไม่โหลด `MEMORY.md` อัตโนมัติ

    <Tabs>
      <Tab title="ถามเอเจนต์ของคุณ">
        > "เมื่อฉันถามคำถามในแชนแนล Discord ให้ใช้ memory_search หรือ memory_get หากคุณต้องการบริบทระยะยาวจาก MEMORY.md"
      </Tab>
      <Tab title="ด้วยตนเอง">
        หากคุณต้องการบริบทร่วมในทุกแชนแนล ให้วางคำสั่งที่คงที่ไว้ใน `AGENTS.md` หรือ `USER.md` (ไฟล์เหล่านี้จะถูกแทรกสำหรับทุกเซสชัน) เก็บบันทึกระยะยาวไว้ใน `MEMORY.md` และเข้าถึงเมื่อจำเป็นด้วย memory tools
      </Tab>
    </Tabs>

  </Step>
</Steps>

ตอนนี้ให้สร้างแชนแนลบางส่วนบนเซิร์ฟเวอร์ Discord ของคุณแล้วเริ่มแชตได้เลย เอเจนต์ของคุณสามารถเห็นชื่อแชนแนล และแต่ละแชนแนลจะมีเซสชันแยกอิสระของตัวเอง — ดังนั้นคุณสามารถตั้งค่า `#coding`, `#home`, `#research` หรืออะไรก็ได้ที่เหมาะกับเวิร์กโฟลว์ของคุณ

## โมเดลการทำงานขณะรัน

- Gateway เป็นผู้ดูแลการเชื่อมต่อ Discord
- การกำหนดเส้นทางการตอบกลับเป็นแบบกำหนดแน่นอน: ข้อความขาเข้าจาก Discord จะตอบกลับไปที่ Discord
- โดยค่าเริ่มต้น (`session.dmScope=main`) การแชตโดยตรงจะใช้เซสชันหลักของเอเจนต์ร่วมกัน (`agent:main:main`)
- แชนแนลกิลด์เป็นคีย์เซสชันแบบแยกอิสระ (`agent:<agentId>:discord:channel:<channelId>`)
- Group DM จะถูกละเว้นโดยค่าเริ่มต้น (`channels.discord.dm.groupEnabled=false`)
- คำสั่ง slash แบบเนทีฟจะทำงานในเซสชันคำสั่งแบบแยกอิสระ (`agent:<agentId>:discord:slash:<userId>`) ขณะเดียวกันก็ยังคงส่ง `CommandTargetSessionKey` ไปยังเซสชันการสนทนาที่ถูกกำหนดเส้นทาง

## Forum channels

Discord forum และ media channels ยอมรับเฉพาะโพสต์แบบเธรด OpenClaw รองรับสองวิธีในการสร้างโพสต์เหล่านี้:

- ส่งข้อความไปยัง forum parent (`channel:<forumId>`) เพื่อสร้างเธรดอัตโนมัติ ชื่อเธรดจะใช้บรรทัดแรกที่ไม่ว่างของข้อความของคุณ
- ใช้ `openclaw message thread create` เพื่อสร้างเธรดโดยตรง อย่าส่ง `--message-id` สำหรับ forum channels

ตัวอย่าง: ส่งไปยัง forum parent เพื่อสร้างเธรด

```bash
openclaw message send --channel discord --target channel:<forumId> \
  --message "Topic title\nBody of the post"
```

ตัวอย่าง: สร้าง forum thread แบบระบุชัดเจน

```bash
openclaw message thread create --channel discord --target channel:<forumId> \
  --thread-name "Topic title" --message "Body of the post"
```

forum parents ไม่รองรับ Discord components หากคุณต้องการ components ให้ส่งไปยังเธรดนั้นโดยตรง (`channel:<threadId>`)

## Interactive components

OpenClaw รองรับ Discord components v2 containers สำหรับข้อความของเอเจนต์ ใช้ message tool พร้อม payload `components` ผลลัพธ์จากการโต้ตอบจะถูกส่งกลับไปยังเอเจนต์เป็นข้อความขาเข้าปกติ และเป็นไปตามการตั้งค่า Discord `replyToMode` ที่มีอยู่

บล็อกที่รองรับ:

- `text`, `section`, `separator`, `actions`, `media-gallery`, `file`
- แถวการดำเนินการอนุญาตได้สูงสุด 5 ปุ่ม หรือเมนูเลือกแบบเดี่ยว 1 รายการ
- ประเภทการเลือก: `string`, `user`, `role`, `mentionable`, `channel`

โดยค่าเริ่มต้น components ใช้ได้ครั้งเดียว ตั้งค่า `components.reusable=true` เพื่ออนุญาตให้ใช้ปุ่ม การเลือก และฟอร์มได้หลายครั้งจนกว่าจะหมดอายุ

หากต้องการจำกัดว่าใครบ้างที่สามารถคลิกปุ่ม ให้ตั้งค่า `allowedUsers` บนปุ่มนั้น (Discord user IDs, tags หรือ `*`) เมื่อกำหนดค่าแล้ว ผู้ใช้ที่ไม่ตรงเงื่อนไขจะได้รับข้อความปฏิเสธแบบ ephemeral

คำสั่ง slash `/model` และ `/models` จะเปิดตัวเลือกโมเดลแบบโต้ตอบพร้อมเมนูดรอปดาวน์สำหรับผู้ให้บริการและโมเดล รวมทั้งขั้นตอน Submit เว้นแต่ `commands.modelsWrite=false`, คำสั่ง `/models add` ยังรองรับการเพิ่มรายการผู้ให้บริการ/โมเดลใหม่จากแชต และโมเดลที่เพิ่มใหม่จะปรากฏโดยไม่ต้องรีสตาร์ต gateway การตอบกลับของตัวเลือกจะเป็นแบบ ephemeral และมีเพียงผู้ใช้ที่เรียกคำสั่งเท่านั้นที่ใช้งานได้

ไฟล์แนบ:

- บล็อก `file` ต้องอ้างอิงไปยังไฟล์แนบ (`attachment://<filename>`)
- ระบุไฟล์แนบผ่าน `media`/`path`/`filePath` (ไฟล์เดียว); ใช้ `media-gallery` สำหรับหลายไฟล์
- ใช้ `filename` เพื่อแทนที่ชื่อไฟล์อัปโหลดเมื่อจำเป็นต้องตรงกับการอ้างอิงไฟล์แนบ

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
  message: "Optional fallback text",
  components: {
    reusable: true,
    text: "Choose a path",
    blocks: [
      {
        type: "actions",
        buttons: [
          {
            label: "Approve",
            style: "success",
            allowedUsers: ["123456789012345678"],
          },
          { label: "Decline", style: "danger" },
        ],
      },
      {
        type: "actions",
        select: {
          type: "string",
          placeholder: "Pick an option",
          options: [
            { label: "Option A", value: "a" },
            { label: "Option B", value: "b" },
          ],
        },
      },
    ],
    modal: {
      title: "Details",
      triggerLabel: "Open form",
      fields: [
        { type: "text", label: "Requester" },
        {
          type: "select",
          label: "Priority",
          options: [
            { label: "Low", value: "low" },
            { label: "High", value: "high" },
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
    `channels.discord.dmPolicy` ควบคุมการเข้าถึง DM (เดิมคือ: `channels.discord.dm.policy`):

    - `pairing` (ค่าเริ่มต้น)
    - `allowlist`
    - `open` (ต้องให้ `channels.discord.allowFrom` มี `"*"` รวมอยู่ด้วย; เดิมคือ `channels.discord.dm.allowFrom`)
    - `disabled`

    หากนโยบาย DM ไม่ใช่ open ผู้ใช้ที่ไม่รู้จักจะถูกบล็อก (หรือถูกขอให้จับคู่ในโหมด `pairing`)

    ลำดับความสำคัญแบบหลายบัญชี:

    - `channels.discord.accounts.default.allowFrom` ใช้กับบัญชี `default` เท่านั้น
    - บัญชีที่มีชื่อจะสืบทอด `channels.discord.allowFrom` เมื่อยังไม่ได้ตั้งค่า `allowFrom` ของตนเอง
    - บัญชีที่มีชื่อจะไม่สืบทอด `channels.discord.accounts.default.allowFrom`

    รูปแบบเป้าหมาย DM สำหรับการส่ง:

    - `user:<id>`
    - mention แบบ `<@id>`

    ID ตัวเลขล้วนไม่ระบุชัดเจนและจะถูกปฏิเสธ เว้นแต่จะระบุชนิดเป้าหมายผู้ใช้/แชนแนลอย่างชัดเจน

  </Tab>

  <Tab title="นโยบายกิลด์">
    การจัดการกิลด์ถูกควบคุมโดย `channels.discord.groupPolicy`:

    - `open`
    - `allowlist`
    - `disabled`

    ค่าพื้นฐานที่ปลอดภัยเมื่อมี `channels.discord` คือ `allowlist`

    พฤติกรรมของ `allowlist`:

    - กิลด์ต้องตรงกับ `channels.discord.guilds` (แนะนำให้ใช้ `id`, รองรับ slug)
    - allowlists ของผู้ส่งแบบไม่บังคับ: `users` (แนะนำให้ใช้ ID ที่คงที่) และ `roles` (เฉพาะ role IDs); หากมีการกำหนดอย่างใดอย่างหนึ่ง ผู้ส่งจะได้รับอนุญาตเมื่อค่าตรงกับ `users` หรือ `roles`
    - การจับคู่ชื่อ/แท็กโดยตรงถูกปิดไว้โดยค่าเริ่มต้น; ให้เปิด `channels.discord.dangerouslyAllowNameMatching: true` เฉพาะเมื่อจำเป็นจริงในโหมดความเข้ากันได้แบบฉุกเฉิน
    - รองรับชื่อ/แท็กสำหรับ `users` แต่ ID ปลอดภัยกว่า; `openclaw security audit` จะเตือนเมื่อมีการใช้รายการชื่อ/แท็ก
    - หากกิลด์มีการกำหนด `channels` แชนแนลที่ไม่ได้อยู่ในรายการจะถูกปฏิเสธ
    - หากกิลด์ไม่มีบล็อก `channels` แชนแนลทั้งหมดในกิลด์ที่อยู่ใน allowlist จะได้รับอนุญาต

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

    หากคุณตั้งค่าเพียง `DISCORD_BOT_TOKEN` และไม่ได้สร้างบล็อก `channels.discord` ค่าทดแทนขณะรันจะเป็น `groupPolicy="allowlist"` (พร้อมคำเตือนใน logs) แม้ว่า `channels.defaults.groupPolicy` จะเป็น `open` ก็ตาม

  </Tab>

  <Tab title="Mentions และ Group DM">
    ข้อความในกิลด์จะถูกควบคุมด้วย mention เป็นค่าเริ่มต้น

    การตรวจจับ mention ครอบคลุมถึง:

    - การ mention บอตโดยตรง
    - รูปแบบ mention ที่กำหนดไว้ (`agents.list[].groupChat.mentionPatterns`, fallback เป็น `messages.groupChat.mentionPatterns`)
    - พฤติกรรมตอบกลับบอตโดยนัยในกรณีที่รองรับ

    `requireMention` ถูกกำหนดแยกตามกิลด์/แชนแนล (`channels.discord.guilds...`)
    `ignoreOtherMentions` สามารถตั้งค่าให้ทิ้งข้อความที่ mention ผู้ใช้/role อื่นแต่ไม่ได้ mention บอตได้ (ไม่นับ @everyone/@here)

    Group DM:

    - ค่าเริ่มต้น: ละเว้น (`dm.groupEnabled=false`)
    - allowlist แบบไม่บังคับผ่าน `dm.groupChannels` (channel IDs หรือ slugs)

  </Tab>
</Tabs>

### การกำหนดเส้นทางเอเจนต์ตาม role

ใช้ `bindings[].match.roles` เพื่อกำหนดเส้นทางสมาชิกกิลด์ Discord ไปยังเอเจนต์ต่างกันตาม role ID การ binding ตาม role รองรับเฉพาะ role IDs และจะถูกประเมินหลัง peer หรือ parent-peer bindings และก่อน guild-only bindings หาก binding มีการตั้งค่า match fields อื่นด้วย (เช่น `peer` + `guildId` + `roles`) ฟิลด์ที่กำหนดไว้ทั้งหมดจะต้องตรงกัน

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

## คำสั่งเนทีฟและการยืนยันสิทธิ์คำสั่ง

- `commands.native` มีค่าเริ่มต้นเป็น `"auto"` และเปิดใช้งานสำหรับ Discord
- การแทนที่แยกตามแชนแนล: `channels.discord.commands.native`
- `commands.native=false` จะล้างคำสั่งเนทีฟ Discord ที่ลงทะเบียนไว้ก่อนหน้าอย่างชัดเจน
- การยืนยันสิทธิ์ของคำสั่งเนทีฟใช้ allowlists/นโยบาย Discord เดียวกันกับการจัดการข้อความปกติ
- คำสั่งอาจยังมองเห็นได้ใน UI ของ Discord สำหรับผู้ใช้ที่ไม่ได้รับอนุญาต; แต่ตอนเรียกใช้จะยังคงบังคับใช้สิทธิ์ของ OpenClaw และส่งกลับว่า "not authorized"

ดู [Slash commands](/th/tools/slash-commands) สำหรับแค็ตตาล็อกคำสั่งและพฤติกรรม

การตั้งค่าเริ่มต้นของคำสั่ง slash:

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

    หมายเหตุ: `off` จะปิด implicit reply threading แต่แท็ก `[[reply_to_*]]` แบบระบุชัดยังคงทำงาน
    `first` จะใส่การอ้างอิง native reply โดยนัยให้กับข้อความ Discord ขาออกข้อความแรกของเทิร์นนั้นเสมอ
    `batched` จะใส่การอ้างอิง native reply โดยนัยของ Discord เฉพาะเมื่อ
    เทิร์นขาเข้านั้นเป็นชุดข้อความหลายข้อความที่ถูกรวมแบบ debounced วิธีนี้มีประโยชน์
    เมื่อต้องการใช้ native replies เป็นหลักกับแชตที่มีข้อความถี่และคลุมเครือ ไม่ใช่ทุก
    เทิร์นที่มีข้อความเดียว

    Message IDs จะถูกแสดงใน context/history เพื่อให้เอเจนต์สามารถกำหนดเป้าหมายข้อความเฉพาะได้

  </Accordion>

  <Accordion title="ตัวอย่างสตรีมแบบสด">
    OpenClaw สามารถสตรีมร่างคำตอบโดยส่งข้อความชั่วคราวและแก้ไขข้อความนั้นเมื่อมีข้อความเข้ามา `channels.discord.streaming` รับค่า `off` (ค่าเริ่มต้น) | `partial` | `block` | `progress` โดย `progress` จะถูกแมปเป็น `partial` บน Discord; `streamMode` เป็นชื่อเดิมและจะถูกย้ายค่าให้อัตโนมัติ

    ค่าเริ่มต้นยังคงเป็น `off` เพราะการแก้ไขตัวอย่างบน Discord จะชนข้อจำกัดอัตราได้ง่ายเมื่อมีหลายบอตหรือหลาย gateway ใช้บัญชีเดียวกัน

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

    - `partial` จะแก้ไขข้อความตัวอย่างเดียวเมื่อมีโทเคนเข้ามา
    - `block` จะส่งเป็นก้อนขนาดร่าง (ใช้ `draftChunk` เพื่อปรับขนาดและจุดตัด โดยถูกจำกัดไม่เกิน `textChunkLimit`)
    - ผลลัพธ์สื่อ ข้อผิดพลาด และคำตอบสุดท้ายแบบ explicit-reply จะยกเลิกการแก้ไขตัวอย่างที่ค้างอยู่
    - `streaming.preview.toolProgress` (ค่าเริ่มต้น `true`) ควบคุมว่าการอัปเดต tool/progress จะใช้ข้อความตัวอย่างเดิมซ้ำหรือไม่

    การสตรีมตัวอย่างรองรับเฉพาะข้อความ; คำตอบที่มีสื่อจะย้อนกลับไปใช้การส่งปกติ เมื่อเปิด `block` streaming อย่างชัดเจน OpenClaw จะข้าม preview stream เพื่อหลีกเลี่ยงการสตรีมซ้ำซ้อน

  </Accordion>

  <Accordion title="ประวัติ บริบท และพฤติกรรมของเธรด">
    บริบทประวัติของกิลด์:

    - `channels.discord.historyLimit` ค่าเริ่มต้น `20`
    - fallback: `messages.groupChat.historyLimit`
    - `0` คือปิดใช้งาน

    การควบคุมประวัติ DM:

    - `channels.discord.dmHistoryLimit`
    - `channels.discord.dms["<user_id>"].historyLimit`

    พฤติกรรมของเธรด:

    - Discord threads จะถูกกำหนดเส้นทางเป็นเซสชันของแชนแนล และสืบทอด config ของ parent channel เว้นแต่จะมีการแทนที่
    - `channels.discord.thread.inheritParent` (ค่าเริ่มต้น `false`) ใช้เปิดให้ auto-threads ใหม่เริ่มต้นจาก parent transcript ได้ การแทนที่แยกตามบัญชีอยู่ที่ `channels.discord.accounts.<id>.thread.inheritParent`
    - ปฏิกิริยาของ message-tool สามารถ resolve เป้าหมาย DM แบบ `user:<id>` ได้
    - `guilds.<guild>.channels.<channel>.requireMention: false` จะถูกคงไว้ระหว่าง fallback การเปิดใช้งานในช่วงตอบกลับ

    หัวข้อแชนแนลจะถูกแทรกเป็นบริบทแบบ **ไม่น่าเชื่อถือ** allowlists ใช้ควบคุมว่าใครสามารถทริกเกอร์เอเจนต์ได้ ไม่ใช่ขอบเขตการปกปิด supplemental-context แบบสมบูรณ์

  </Accordion>

  <Accordion title="เซสชันที่ผูกกับเธรดสำหรับ subagent">
    Discord สามารถผูกเธรดเข้ากับเป้าหมายเซสชันได้ เพื่อให้ข้อความติดตามผลในเธรดนั้นยังคงถูกกำหนดเส้นทางไปยังเซสชันเดิม (รวมถึงเซสชันของ subagent)

    คำสั่ง:

    - `/focus <target>` ผูกเธรดปัจจุบัน/เธรดใหม่เข้ากับเป้าหมาย subagent/เซสชัน
    - `/unfocus` เอาการผูกของเธรดปัจจุบันออก
    - `/agents` แสดงการรันที่กำลังใช้งานและสถานะการผูก
    - `/session idle <duration|off>` ตรวจสอบ/อัปเดตการยกเลิกการโฟกัสอัตโนมัติจากการไม่ใช้งานสำหรับ focused bindings
    - `/session max-age <duration|off>` ตรวจสอบ/อัปเดตอายุสูงสุดแบบตายตัวสำหรับ focused bindings

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
        spawnSubagentSessions: false, // ต้องเปิดใช้งานเอง
      },
    },
  },
}
```

    หมายเหตุ:

    - `session.threadBindings.*` ตั้งค่าเริ่มต้นแบบโกลบอล
    - `channels.discord.threadBindings.*` ใช้แทนที่พฤติกรรมของ Discord
    - `spawnSubagentSessions` ต้องเป็น true เพื่อสร้าง/ผูกเธรดอัตโนมัติสำหรับ `sessions_spawn({ thread: true })`
    - `spawnAcpSessions` ต้องเป็น true เพื่อสร้าง/ผูกเธรดอัตโนมัติสำหรับ ACP (`/acp spawn ... --thread ...` หรือ `sessions_spawn({ runtime: "acp", thread: true })`)
    - หาก thread bindings ถูกปิดสำหรับบัญชีใด `/focus` และการทำงานเกี่ยวกับ thread binding ที่เกี่ยวข้องจะใช้งานไม่ได้

    ดู [Sub-agents](/th/tools/subagents), [ACP Agents](/th/tools/acp-agents) และ [Configuration Reference](/th/gateway/configuration-reference)

  </Accordion>

  <Accordion title="ACP bindings ของแชนแนลแบบคงอยู่">
    สำหรับ ACP workspace แบบคงที่ที่ "เปิดตลอดเวลา" ให้กำหนด typed ACP bindings ระดับบนสุดที่ชี้ไปยังบทสนทนา Discord

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

    - `/acp spawn codex --bind here` จะผูกแชนแนลหรือเธรดปัจจุบันไว้กับที่ และทำให้ข้อความในอนาคตยังคงอยู่ใน ACP session เดิม ข้อความในเธรดจะสืบทอดการผูกจากแชนแนลแม่
    - ในแชนแนลหรือเธรดที่ถูกผูกไว้ `/new` และ `/reset` จะรีเซ็ต ACP session เดิมในที่เดิม การผูกเธรดชั่วคราวสามารถใช้แทนการ resolve เป้าหมายได้ขณะยังทำงานอยู่
    - `spawnAcpSessions` จำเป็นเฉพาะเมื่อ OpenClaw ต้องสร้าง/ผูก child thread ผ่าน `--thread auto|here`

    ดู [ACP Agents](/th/tools/acp-agents) สำหรับรายละเอียดพฤติกรรมการผูก

  </Accordion>

  <Accordion title="การแจ้งเตือน reaction">
    โหมดการแจ้งเตือน reaction แยกตามกิลด์:

    - `off`
    - `own` (ค่าเริ่มต้น)
    - `all`
    - `allowlist` (ใช้ `guilds.<id>.users`)

    เหตุการณ์ reaction จะถูกแปลงเป็น system events และแนบเข้ากับ Discord session ที่ถูกกำหนดเส้นทาง

  </Accordion>

  <Accordion title="Ack reactions">
    `ackReaction` จะส่งอีโมจิยืนยันขณะ OpenClaw กำลังประมวลผลข้อความขาเข้า

    ลำดับการ resolve:

    - `channels.discord.accounts.<accountId>.ackReaction`
    - `channels.discord.ackReaction`
    - `messages.ackReaction`
    - fallback เป็นอีโมจิ identity ของเอเจนต์ (`agents.list[].identity.emoji`, มิฉะนั้นเป็น "👀")

    หมายเหตุ:

    - Discord รองรับอีโมจิ unicode หรือชื่อ custom emoji
    - ใช้ `""` เพื่อปิด reaction สำหรับแชนแนลหรือบัญชี

  </Accordion>

  <Accordion title="การเขียน config">
    การเขียน config ที่เริ่มจากแชนแนลถูกเปิดใช้งานเป็นค่าเริ่มต้น

    สิ่งนี้มีผลกับโฟลว์ `/config set|unset` (เมื่อเปิดใช้ความสามารถของคำสั่ง)

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

  <Accordion title="Gateway proxy">
    กำหนดเส้นทางทราฟฟิก WebSocket ของ Discord gateway และการค้นหา REST ตอนเริ่มต้น (application ID + การ resolve allowlist) ผ่าน HTTP(S) proxy ด้วย `channels.discord.proxy`

```json5
{
  channels: {
    discord: {
      proxy: "http://proxy.example:8080",
    },
  },
}
```

    การแทนที่แยกตามบัญชี:

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
    เปิดใช้การ resolve ของ PluralKit เพื่อแมปข้อความ proxied ไปยัง identity ของสมาชิก system:

```json5
{
  channels: {
    discord: {
      pluralkit: {
        enabled: true,
        token: "pk_live_...", // ไม่บังคับ; จำเป็นสำหรับ systems แบบ private
      },
    },
  },
}
```

    หมายเหตุ:

    - allowlists สามารถใช้ `pk:<memberId>` ได้
    - ชื่อแสดงของสมาชิกจะถูกจับคู่ด้วย name/slug เท่านั้นเมื่อ `channels.discord.dangerouslyAllowNameMatching: true`
    - การค้นหาใช้ message ID ต้นฉบับและถูกจำกัดด้วยช่วงเวลา
    - หากการค้นหาล้มเหลว ข้อความ proxied จะถูกปฏิบัติเป็นข้อความจากบอตและถูกทิ้ง เว้นแต่ `allowBots=true`

  </Accordion>

  <Accordion title="การกำหนดค่า presence">
    การอัปเดต presence จะถูกนำไปใช้เมื่อคุณตั้งค่าฟิลด์สถานะหรือกิจกรรม หรือเมื่อคุณเปิดใช้ auto presence

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

    ตัวอย่างกิจกรรม (custom status เป็นประเภทกิจกรรมค่าเริ่มต้น):

```json5
{
  channels: {
    discord: {
      activity: "Focus time",
      activityType: 4,
    },
  },
}
```

    ตัวอย่าง Streaming:

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

    - 0: Playing
    - 1: Streaming (ต้องมี `activityUrl`)
    - 2: Listening
    - 3: Watching
    - 4: Custom (ใช้ข้อความกิจกรรมเป็นสถานะ state; emoji เป็นตัวเลือก)
    - 5: Competing

    ตัวอย่าง auto presence (สัญญาณสุขภาพของ runtime):

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

    auto presence จะจับคู่ความพร้อมใช้งานของ runtime กับสถานะ Discord: healthy => online, degraded หรือ unknown => idle, exhausted หรือ unavailable => dnd ข้อความแทนที่แบบไม่บังคับ:

    - `autoPresence.healthyText`
    - `autoPresence.degradedText`
    - `autoPresence.exhaustedText` (รองรับ placeholder `{reason}`)

  </Accordion>

  <Accordion title="การอนุมัติใน Discord">
    Discord รองรับการจัดการการอนุมัติด้วยปุ่มใน DM และสามารถโพสต์ข้อความขออนุมัติในแชนแนลต้นทางได้ตามตัวเลือก

    เส้นทาง config:

    - `channels.discord.execApprovals.enabled`
    - `channels.discord.execApprovals.approvers` (ไม่บังคับ; fallback ไปยัง `commands.ownerAllowFrom` เมื่อเป็นไปได้)
    - `channels.discord.execApprovals.target` (`dm` | `channel` | `both`, ค่าเริ่มต้น: `dm`)
    - `agentFilter`, `sessionFilter`, `cleanupAfterResolve`

    Discord จะเปิดใช้ native exec approvals อัตโนมัติเมื่อ `enabled` ยังไม่ถูกตั้งค่าหรือเป็น `"auto"` และสามารถ resolve ผู้อนุมัติได้อย่างน้อยหนึ่งราย ไม่ว่าจะจาก `execApprovals.approvers` หรือจาก `commands.ownerAllowFrom` Discord จะไม่อนุมาน exec approvers จาก `allowFrom` ของแชนแนล, `dm.allowFrom` แบบเดิม หรือ `defaultTo` ของ direct-message ตั้งค่า `enabled: false` หากต้องการปิด Discord อย่างชัดเจนในฐานะ native approval client

    เมื่อ `target` เป็น `channel` หรือ `both` ข้อความขออนุมัติจะมองเห็นได้ในแชนแนล มีเพียงผู้อนุมัติที่ resolve ได้เท่านั้นที่ใช้ปุ่มได้ ผู้ใช้อื่นจะได้รับข้อความปฏิเสธแบบ ephemeral ข้อความขออนุมัติจะมีข้อความคำสั่งรวมอยู่ด้วย ดังนั้นควรเปิดใช้การส่งในแชนแนลเฉพาะแชนแนลที่เชื่อถือได้เท่านั้น หากไม่สามารถหา channel ID จาก session key ได้ OpenClaw จะ fallback ไปส่งผ่าน DM

    Discord ยังเรนเดอร์ปุ่มอนุมัติแบบใช้ร่วมกันที่แชตแชนแนลอื่นใช้ด้วย ตัวแปลง Discord แบบเนทีฟเพิ่มหลัก ๆ คือการกำหนดเส้นทาง DM ไปยังผู้อนุมัติและการกระจายไปยังแชนแนล
    เมื่อมีปุ่มเหล่านั้นอยู่ ปุ่มเหล่านั้นจะเป็น UX หลักสำหรับการอนุมัติ; OpenClaw
    ควรใส่คำสั่ง `/approve` แบบแมนนวลเฉพาะเมื่อผลลัพธ์ของ tool ระบุว่า
    การอนุมัติผ่านแชตไม่พร้อมใช้งาน หรือการอนุมัติแบบแมนนวลเป็นทางเดียวเท่านั้น

    Gateway auth และการ resolve การอนุมัติเป็นไปตามสัญญา Gateway client แบบใช้ร่วมกัน (`plugin:` IDs จะ resolve ผ่าน `plugin.approval.resolve`; IDs อื่นผ่าน `exec.approval.resolve`) การอนุมัติจะหมดอายุภายใน 30 นาทีโดยค่าเริ่มต้น

    ดู [Exec approvals](/th/tools/exec-approvals)

  </Accordion>
</AccordionGroup>

## เครื่องมือและเกตของการกระทำ

การกระทำข้อความของ Discord ครอบคลุมการส่งข้อความ การดูแลแชนแนล การม็อดเดอเรชัน presence และการกระทำเกี่ยวกับ metadata

ตัวอย่างหลัก:

- การส่งข้อความ: `sendMessage`, `readMessages`, `editMessage`, `deleteMessage`, `threadReply`
- reactions: `react`, `reactions`, `emojiList`
- การม็อดเดอเรชัน: `timeout`, `kick`, `ban`
- presence: `setPresence`

การกระทำ `event-create` รองรับพารามิเตอร์ `image` แบบไม่บังคับ (URL หรือเส้นทางไฟล์ภายในเครื่อง) เพื่อกำหนดภาพหน้าปกของ scheduled event

เกตของการกระทำอยู่ภายใต้ `channels.discord.actions.*`

พฤติกรรมเกตเริ่มต้น:

| กลุ่มการกระทำ                                                                                                                                                            | ค่าเริ่มต้น |
| ------------------------------------------------------------------------------------------------------------------------------------------------------------------------ | ----------- |
| reactions, messages, threads, pins, polls, search, memberInfo, roleInfo, channelInfo, channels, voiceStatus, events, stickers, emojiUploads, stickerUploads, permissions | เปิดใช้งาน  |
| roles                                                                                                                                                                    | ปิดใช้งาน   |
| moderation                                                                                                                                                               | ปิดใช้งาน   |
| presence                                                                                                                                                                 | ปิดใช้งาน   |

## UI ของ Components v2

OpenClaw ใช้ Discord components v2 สำหรับ exec approvals และตัวบ่งชี้ข้ามบริบท การกระทำข้อความของ Discord ยังรองรับ `components` สำหรับ UI แบบกำหนดเองได้ด้วย (ขั้นสูง; ต้องสร้าง payload ของ component ผ่าน discord tool) ขณะที่ `embeds` แบบเดิมยังคงใช้ได้แต่ไม่แนะนำ

- `channels.discord.ui.components.accentColor` กำหนดสี accent ที่ใช้โดย containers ของ Discord component (hex)
- ตั้งค่าแยกตามบัญชีด้วย `channels.discord.accounts.<id>.ui.components.accentColor`
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

## เสียง

Discord มีพื้นผิวเสียงสองแบบที่แตกต่างกัน: **voice channels** แบบเรียลไทม์ (การสนทนาต่อเนื่อง) และ **voice message attachments** (รูปแบบตัวอย่างคลื่นเสียง) Gateway รองรับทั้งสองแบบ

### Voice channels

ข้อกำหนด:

- เปิดใช้คำสั่งเนทีฟ (`commands.native` หรือ `channels.discord.commands.native`)
- กำหนดค่า `channels.discord.voice`
- บอตต้องมีสิทธิ์ Connect + Speak ใน voice channel เป้าหมาย

ใช้ `/vc join|leave|status` เพื่อควบคุมเซสชัน คำสั่งนี้ใช้เอเจนต์ค่าเริ่มต้นของบัญชี และเป็นไปตาม allowlist และกฎ group policy เดียวกับคำสั่ง Discord อื่น ๆ

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

- `voice.tts` ใช้แทน `messages.tts` สำหรับการเล่นเสียงเท่านั้น
- เทิร์นถอดเสียงจาก voice จะอนุมานสถานะเจ้าของจาก Discord `allowFrom` (หรือ `dm.allowFrom`); ผู้พูดที่ไม่ใช่เจ้าของจะไม่สามารถเข้าถึงเครื่องมือที่จำกัดเฉพาะเจ้าของได้ (เช่น `gateway` และ `cron`)
- Voice เปิดใช้งานโดยค่าเริ่มต้น; ตั้งค่า `channels.discord.voice.enabled=false` เพื่อปิด
- `voice.daveEncryption` และ `voice.decryptionFailureTolerance` จะส่งต่อไปยังตัวเลือก join ของ `@discordjs/voice`
- ค่าปริยายของ `@discordjs/voice` คือ `daveEncryption=true` และ `decryptionFailureTolerance=24` หากไม่ได้ตั้งค่า
- OpenClaw ยังตรวจสอบความล้มเหลวในการถอดรหัสขาเข้าด้วย และกู้คืนอัตโนมัติโดยออกจาก voice channel แล้วเข้าร่วมใหม่หลังจากเกิดความล้มเหลวซ้ำหลายครั้งในช่วงเวลาสั้น ๆ
- หาก receive logs แสดง `DecryptionFailed(UnencryptedWhenPassthroughDisabled)` ซ้ำ ๆ ปัญหานี้อาจเป็นบั๊กการรับของ `@discordjs/voice` ฝั่ง upstream ที่ติดตามไว้ใน [discord.js #11419](https://github.com/discordjs/discord.js/issues/11419)

### Voice messages

Discord voice messages จะแสดงตัวอย่างคลื่นเสียงและต้องใช้ออดิโอ OGG/Opus OpenClaw จะสร้างคลื่นเสียงให้อัตโนมัติ แต่ต้องมี `ffmpeg` และ `ffprobe` บนโฮสต์ gateway เพื่อใช้ตรวจสอบและแปลงไฟล์

- ระบุเป็น **เส้นทางไฟล์ภายในเครื่อง** (ไม่รองรับ URL)
- ละข้อความ text ออก (Discord ปฏิเสธ payload ที่มีทั้ง text + voice message)
- รองรับไฟล์เสียงทุกรูปแบบ; OpenClaw จะแปลงเป็น OGG/Opus ตามต้องการ

```bash
message(action="send", channel="discord", target="channel:123", path="/path/to/audio.mp3", asVoice=true)
```

## การแก้ไขปัญหา

<AccordionGroup>
  <Accordion title="ใช้ intents ที่ไม่ได้รับอนุญาต หรือบอตไม่เห็นข้อความในกิลด์">

    - เปิดใช้งาน Message Content Intent
    - เปิดใช้งาน Server Members Intent เมื่อคุณพึ่งพาการ resolve ผู้ใช้/สมาชิก
    - รีสตาร์ต gateway หลังเปลี่ยน intents

  </Accordion>

  <Accordion title="ข้อความในกิลด์ถูกบล็อกโดยไม่คาดคิด">

    - ตรวจสอบ `groupPolicy`
    - ตรวจสอบ guild allowlist ภายใต้ `channels.discord.guilds`
    - หากมีแผนที่ `channels` ใน guild จะอนุญาตเฉพาะแชนแนลที่อยู่ในรายการเท่านั้น
    - ตรวจสอบพฤติกรรม `requireMention` และรูปแบบ mention

    คำสั่งที่มีประโยชน์:

```bash
openclaw doctor
openclaw channels status --probe
openclaw logs --follow
```

  </Accordion>

  <Accordion title="ตั้ง requireMention เป็น false แต่ยังถูกบล็อกอยู่">
    สาเหตุที่พบบ่อย:

    - `groupPolicy="allowlist"` แต่ไม่มี guild/channel allowlist ที่ตรงกัน
    - กำหนด `requireMention` ไว้ผิดตำแหน่ง (ต้องอยู่ภายใต้ `channels.discord.guilds` หรือในรายการแชนแนล)
    - ผู้ส่งถูกบล็อกโดย guild/channel `users` allowlist

  </Accordion>

  <Accordion title="ตัวจัดการที่รันนานหมดเวลา หรือมีคำตอบซ้ำ">

    logs ที่พบบ่อย:

    - `Listener DiscordMessageListener timed out after 30000ms for event MESSAGE_CREATE`
    - `Slow listener detected ...`
    - `discord inbound worker timed out after ...`

    ตัวปรับงบเวลาของ listener:

    - บัญชีเดียว: `channels.discord.eventQueue.listenerTimeout`
    - หลายบัญชี: `channels.discord.accounts.<accountId>.eventQueue.listenerTimeout`

    ตัวปรับเวลาหมดอายุของ worker run:

    - บัญชีเดียว: `channels.discord.inboundWorker.runTimeoutMs`
    - หลายบัญชี: `channels.discord.accounts.<accountId>.inboundWorker.runTimeoutMs`
    - ค่าเริ่มต้น: `1800000` (30 นาที); ตั้ง `0` เพื่อปิดใช้งาน

    ค่าพื้นฐานที่แนะนำ:

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
    เฉพาะเมื่อคุณต้องการวาล์วนิรภัยแยกต่างหากสำหรับเทิร์นเอเจนต์ที่อยู่ในคิว

  </Accordion>

  <Accordion title="การตรวจสอบสิทธิ์ไม่ตรงกัน">
    การตรวจสอบสิทธิ์ของ `channels status --probe` ใช้งานได้เฉพาะกับ channel IDs แบบตัวเลขเท่านั้น

    หากคุณใช้คีย์แบบ slug การจับคู่ขณะรันยังคงทำงานได้ แต่ probe จะไม่สามารถตรวจสอบสิทธิ์ได้อย่างสมบูรณ์

  </Accordion>

  <Accordion title="ปัญหา DM และการจับคู่">

    - ปิด DM อยู่: `channels.discord.dm.enabled=false`
    - ปิดนโยบาย DM อยู่: `channels.discord.dmPolicy="disabled"` (เดิมคือ: `channels.discord.dm.policy`)
    - กำลังรอการอนุมัติการจับคู่ในโหมด `pairing`

  </Accordion>

  <Accordion title="ลูปบอตคุยกับบอต">
    โดยค่าเริ่มต้น ข้อความที่เขียนโดยบอตจะถูกละเว้น

    หากคุณตั้งค่า `channels.discord.allowBots=true` ให้ใช้กฎ mention และ allowlist ที่เข้มงวดเพื่อหลีกเลี่ยงพฤติกรรมแบบลูป
    แนะนำให้ใช้ `channels.discord.allowBots="mentions"` เพื่อรับเฉพาะข้อความจากบอตที่ mention บอตเท่านั้น

  </Accordion>

  <Accordion title="Voice STT หลุดพร้อม DecryptionFailed(...)">

    - ใช้ OpenClaw เวอร์ชันล่าสุดอยู่เสมอ (`openclaw update`) เพื่อให้มีตรรกะกู้คืนการรับเสียงของ Discord
    - ยืนยันว่า `channels.discord.voice.daveEncryption=true` (ค่าเริ่มต้น)
    - เริ่มจาก `channels.discord.voice.decryptionFailureTolerance=24` (ค่าปริยายฝั่ง upstream) แล้วค่อยปรับเฉพาะเมื่อจำเป็น
    - ติดตาม logs สำหรับ:
      - `discord voice: DAVE decrypt failures detected`
      - `discord voice: repeated decrypt failures; attempting rejoin`
    - หากยังมีความล้มเหลวต่อหลังจากเข้าร่วมใหม่อัตโนมัติ ให้เก็บ logs และเปรียบเทียบกับ [discord.js #11419](https://github.com/discordjs/discord.js/issues/11419)

  </Accordion>
</AccordionGroup>

## เอกสารอ้างอิงการกำหนดค่า

เอกสารอ้างอิงหลัก: [Configuration reference - Discord](/th/gateway/config-channels#discord)

<Accordion title="ฟิลด์ Discord สำคัญที่มีสัญญาณสูง">

- การเริ่มต้นระบบ/การยืนยันตัวตน: `enabled`, `token`, `accounts.*`, `allowBots`
- นโยบาย: `groupPolicy`, `dm.*`, `guilds.*`, `guilds.*.channels.*`
- คำสั่ง: `commands.native`, `commands.useAccessGroups`, `configWrites`, `slashCommand.*`
- event queue: `eventQueue.listenerTimeout` (งบเวลาของ listener), `eventQueue.maxQueueSize`, `eventQueue.maxConcurrency`
- inbound worker: `inboundWorker.runTimeoutMs`
- การตอบกลับ/ประวัติ: `replyToMode`, `historyLimit`, `dmHistoryLimit`, `dms.*.historyLimit`
- การส่ง: `textChunkLimit`, `chunkMode`, `maxLinesPerMessage`
- การสตรีม: `streaming` (ชื่อเดิม: `streamMode`), `streaming.preview.toolProgress`, `draftChunk`, `blockStreaming`, `blockStreamingCoalesce`
- สื่อ/การลองใหม่: `mediaMaxMb` (จำกัดการอัปโหลด Discord ขาออก, ค่าเริ่มต้น `100MB`), `retry`
- การกระทำ: `actions.*`
- presence: `activity`, `status`, `activityType`, `activityUrl`
- UI: `ui.components.accentColor`
- ฟีเจอร์: `threadBindings`, `bindings[]` ระดับบนสุด (`type: "acp"`), `pluralkit`, `execApprovals`, `intents`, `agentComponents`, `heartbeat`, `responsePrefix`

</Accordion>

## ความปลอดภัยและการปฏิบัติการ

- ปฏิบัติต่อ bot tokens เป็นความลับ (แนะนำ `DISCORD_BOT_TOKEN` ในสภาพแวดล้อมที่มีการดูแล)
- ให้สิทธิ์ Discord เท่าที่จำเป็นขั้นต่ำ
- หากสถานะการ deploy/state ของคำสั่งล้าสมัย ให้รีสตาร์ต gateway แล้วตรวจสอบอีกครั้งด้วย `openclaw channels status --probe`

## ที่เกี่ยวข้อง

<CardGroup cols={2}>
  <Card title="การจับคู่" icon="link" href="/th/channels/pairing">
    จับคู่ผู้ใช้ Discord กับ gateway
  </Card>
  <Card title="กลุ่ม" icon="users" href="/th/channels/groups">
    พฤติกรรมของแชตกลุ่มและ allowlist
  </Card>
  <Card title="การกำหนดเส้นทางแชนแนล" icon="route" href="/th/channels/channel-routing">
    กำหนดเส้นทางข้อความขาเข้าไปยังเอเจนต์
  </Card>
  <Card title="ความปลอดภัย" icon="shield" href="/th/gateway/security">
    โมเดลภัยคุกคามและการทำให้ระบบแข็งแรงขึ้น
  </Card>
  <Card title="การกำหนดเส้นทางหลายเอเจนต์" icon="sitemap" href="/th/concepts/multi-agent">
    แมปกิลด์และแชนแนลไปยังเอเจนต์
  </Card>
  <Card title="คำสั่ง slash" icon="terminal" href="/th/tools/slash-commands">
    พฤติกรรมคำสั่งแบบเนทีฟ
  </Card>
</CardGroup>
