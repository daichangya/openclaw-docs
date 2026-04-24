---
read_when:
    - การตั้งค่า Slack หรือการดีบักโหมด socket/HTTP ของ Slack
summary: การตั้งค่าและลักษณะการทำงานขณะรันไทม์ของ Slack (Socket Mode + HTTP Request URLs)
title: Slack
x-i18n:
    generated_at: "2026-04-24T08:59:41Z"
    model: gpt-5.4
    provider: openai
    source_hash: 906a4fcf00a51f4a9b8410f982abe1f068687b5aa9847a4894f489e57fa9e4dd
    source_path: channels/slack.md
    workflow: 15
---

พร้อมใช้งานจริงสำหรับ DMs และช่องต่าง ๆ ผ่านการเชื่อมต่อแอป Slack โหมดเริ่มต้นคือ Socket Mode และยังรองรับ HTTP Request URLs ด้วย

<CardGroup cols={3}>
  <Card title="การจับคู่" icon="link" href="/th/channels/pairing">
    DM ของ Slack ใช้โหมดการจับคู่เป็นค่าเริ่มต้น
  </Card>
  <Card title="Slash commands" icon="terminal" href="/th/tools/slash-commands">
    ลักษณะการทำงานของคำสั่งแบบเนทีฟและแค็ตตาล็อกคำสั่ง
  </Card>
  <Card title="การแก้ไขปัญหาช่องทาง" icon="wrench" href="/th/channels/troubleshooting">
    แนวทางวินิจฉัยและคู่มือซ่อมแซมข้ามช่องทาง
  </Card>
</CardGroup>

## การตั้งค่าแบบรวดเร็ว

<Tabs>
  <Tab title="Socket Mode (ค่าเริ่มต้น)">
    <Steps>
      <Step title="สร้างแอป Slack ใหม่">
        ในการตั้งค่าแอป Slack ให้กดปุ่ม **[Create New App](https://api.slack.com/apps/new)**:

        - เลือก **from a manifest** และเลือก workspace สำหรับแอปของคุณ
        - วาง [manifest ตัวอย่าง](#manifest-and-scope-checklist) จากด้านล่าง แล้วดำเนินการสร้างต่อ
        - สร้าง **App-Level Token** (`xapp-...`) พร้อมสิทธิ์ `connections:write`
        - ติดตั้งแอปและคัดลอก **Bot Token** (`xoxb-...`) ที่แสดง

      </Step>

      <Step title="กำหนดค่า OpenClaw">

```json5
{
  channels: {
    slack: {
      enabled: true,
      mode: "socket",
      appToken: "xapp-...",
      botToken: "xoxb-...",
    },
  },
}
```

        ค่า env สำรอง (เฉพาะบัญชีเริ่มต้น):

```bash
SLACK_APP_TOKEN=xapp-...
SLACK_BOT_TOKEN=xoxb-...
```

      </Step>

      <Step title="เริ่ม gateway">

```bash
openclaw gateway
```

      </Step>
    </Steps>

  </Tab>

  <Tab title="HTTP Request URLs">
    <Steps>
      <Step title="สร้างแอป Slack ใหม่">
        ในการตั้งค่าแอป Slack ให้กดปุ่ม **[Create New App](https://api.slack.com/apps/new)**:

        - เลือก **from a manifest** และเลือก workspace สำหรับแอปของคุณ
        - วาง [manifest ตัวอย่าง](#manifest-and-scope-checklist) และอัปเดต URLs ก่อนสร้าง
        - บันทึก **Signing Secret** สำหรับการตรวจสอบคำขอ
        - ติดตั้งแอปและคัดลอก **Bot Token** (`xoxb-...`) ที่แสดง

      </Step>

      <Step title="กำหนดค่า OpenClaw">

```json5
{
  channels: {
    slack: {
      enabled: true,
      mode: "http",
      botToken: "xoxb-...",
      signingSecret: "your-signing-secret",
      webhookPath: "/slack/events",
    },
  },
}
```

        <Note>
        ใช้เส้นทาง webhook ที่ไม่ซ้ำกันสำหรับ HTTP แบบหลายบัญชี

        ให้แต่ละบัญชีมี `webhookPath` ของตัวเอง (ค่าเริ่มต้นคือ `/slack/events`) เพื่อไม่ให้การลงทะเบียนชนกัน
        </Note>

      </Step>

      <Step title="เริ่ม gateway">

```bash
openclaw gateway
```

      </Step>
    </Steps>

  </Tab>
</Tabs>

## รายการตรวจสอบ manifest และ scope

manifest พื้นฐานของแอป Slack ใช้เหมือนกันทั้ง Socket Mode และ HTTP Request URLs สิ่งที่ต่างกันมีเพียงบล็อก `settings` (และ `url` ของ slash command)

manifest พื้นฐาน (ค่าเริ่มต้นของ Socket Mode):

```json
{
  "display_information": {
    "name": "OpenClaw",
    "description": "ตัวเชื่อมต่อ Slack สำหรับ OpenClaw"
  },
  "features": {
    "bot_user": { "display_name": "OpenClaw", "always_online": true },
    "app_home": {
      "messages_tab_enabled": true,
      "messages_tab_read_only_enabled": false
    },
    "slash_commands": [
      {
        "command": "/openclaw",
        "description": "ส่งข้อความไปยัง OpenClaw",
        "should_escape": false
      }
    ]
  },
  "oauth_config": {
    "scopes": {
      "bot": [
        "app_mentions:read",
        "assistant:write",
        "channels:history",
        "channels:read",
        "chat:write",
        "commands",
        "emoji:read",
        "files:read",
        "files:write",
        "groups:history",
        "groups:read",
        "im:history",
        "im:read",
        "im:write",
        "mpim:history",
        "mpim:read",
        "mpim:write",
        "pins:read",
        "pins:write",
        "reactions:read",
        "reactions:write",
        "users:read"
      ]
    }
  },
  "settings": {
    "socket_mode_enabled": true,
    "event_subscriptions": {
      "bot_events": [
        "app_mention",
        "channel_rename",
        "member_joined_channel",
        "member_left_channel",
        "message.channels",
        "message.groups",
        "message.im",
        "message.mpim",
        "pin_added",
        "pin_removed",
        "reaction_added",
        "reaction_removed"
      ]
    }
  }
}
```

สำหรับโหมด **HTTP Request URLs** ให้แทนที่ `settings` ด้วยรูปแบบ HTTP และเพิ่ม `url` ให้แต่ละ slash command ต้องใช้ URL สาธารณะ:

```json
{
  "features": {
    "slash_commands": [
      {
        "command": "/openclaw",
        "description": "ส่งข้อความไปยัง OpenClaw",
        "should_escape": false,
        "url": "https://gateway-host.example.com/slack/events"
      }
    ]
  },
  "settings": {
    "event_subscriptions": {
      "request_url": "https://gateway-host.example.com/slack/events",
      "bot_events": [
        /* same as Socket Mode */
      ]
    },
    "interactivity": {
      "is_enabled": true,
      "request_url": "https://gateway-host.example.com/slack/events",
      "message_menu_options_url": "https://gateway-host.example.com/slack/events"
    }
  }
}
```

### การตั้งค่า manifest เพิ่มเติม

แสดงฟีเจอร์ต่าง ๆ ที่ขยายจากค่าเริ่มต้นด้านบน

<AccordionGroup>
  <Accordion title="Optional native slash commands">

    สามารถใช้ [native slash commands](#commands-and-slash-behavior) หลายรายการแทนคำสั่งที่กำหนดค่าไว้เพียงคำสั่งเดียวได้ โดยมีรายละเอียดดังนี้:

    - ใช้ `/agentstatus` แทน `/status` เพราะคำสั่ง `/status` ถูกสงวนไว้
    - ไม่สามารถเปิดใช้ slash commands พร้อมกันเกิน 25 รายการได้

    แทนที่ส่วน `features.slash_commands` เดิมของคุณด้วยชุดย่อยจาก[คำสั่งที่ใช้ได้](/th/tools/slash-commands#command-list):

    <Tabs>
      <Tab title="Socket Mode (ค่าเริ่มต้น)">

```json
    "slash_commands": [
      {
        "command": "/new",
        "description": "เริ่ม session ใหม่",
        "usage_hint": "[model]"
      },
      {
        "command": "/reset",
        "description": "รีเซ็ต session ปัจจุบัน"
      },
      {
        "command": "/compact",
        "description": "ทำ Compaction ให้ context ของ session",
        "usage_hint": "[instructions]"
      },
      {
        "command": "/stop",
        "description": "หยุดการรันปัจจุบัน"
      },
      {
        "command": "/session",
        "description": "จัดการเวลาหมดอายุของการผูกกับเธรด",
        "usage_hint": "idle <duration|off> or max-age <duration|off>"
      },
      {
        "command": "/think",
        "description": "ตั้งค่าระดับการคิด",
        "usage_hint": "<level>"
      },
      {
        "command": "/verbose",
        "description": "สลับการแสดงผลแบบละเอียด",
        "usage_hint": "on|off|full"
      },
      {
        "command": "/fast",
        "description": "แสดงหรือตั้งค่าโหมดเร็ว",
        "usage_hint": "[status|on|off]"
      },
      {
        "command": "/reasoning",
        "description": "สลับการมองเห็น reasoning",
        "usage_hint": "[on|off|stream]"
      },
      {
        "command": "/elevated",
        "description": "สลับโหมด elevated",
        "usage_hint": "[on|off|ask|full]"
      },
      {
        "command": "/exec",
        "description": "แสดงหรือตั้งค่าเริ่มต้นของ exec",
        "usage_hint": "host=<auto|sandbox|gateway|node> security=<deny|allowlist|full> ask=<off|on-miss|always> node=<id>"
      },
      {
        "command": "/model",
        "description": "แสดงหรือตั้งค่าโมเดล",
        "usage_hint": "[name|#|status]"
      },
      {
        "command": "/models",
        "description": "แสดงรายการ providers/models หรือเพิ่มโมเดล",
        "usage_hint": "[provider] [page] [limit=<n>|size=<n>|all] | add <provider> <modelId>"
      },
      {
        "command": "/help",
        "description": "แสดงสรุปวิธีใช้แบบสั้น"
      },
      {
        "command": "/commands",
        "description": "แสดงแค็ตตาล็อกคำสั่งที่สร้างขึ้น"
      },
      {
        "command": "/tools",
        "description": "แสดงว่าเอเจนต์ปัจจุบันใช้เครื่องมือใดได้บ้างในตอนนี้",
        "usage_hint": "[compact|verbose]"
      },
      {
        "command": "/agentstatus",
        "description": "แสดงสถานะรันไทม์ รวมถึงการใช้งาน/quota ของ provider เมื่อมีข้อมูล"
      },
      {
        "command": "/tasks",
        "description": "แสดงรายการงานเบื้องหลังที่กำลังทำงาน/ล่าสุดสำหรับ session ปัจจุบัน"
      },
      {
        "command": "/context",
        "description": "อธิบายวิธีประกอบ context",
        "usage_hint": "[list|detail|json]"
      },
      {
        "command": "/whoami",
        "description": "แสดงตัวตนผู้ส่งของคุณ"
      },
      {
        "command": "/skill",
        "description": "รัน skill ตามชื่อ",
        "usage_hint": "<name> [input]"
      },
      {
        "command": "/btw",
        "description": "ถามคำถามแทรกโดยไม่เปลี่ยน context ของ session",
        "usage_hint": "<question>"
      },
      {
        "command": "/usage",
        "description": "ควบคุม usage footer หรือแสดงสรุปค่าใช้จ่าย",
        "usage_hint": "off|tokens|full|cost"
      }
    ]
```

      </Tab>
      <Tab title="HTTP Request URLs">
        ใช้รายการ `slash_commands` เดียวกับ Socket Mode ด้านบน และเพิ่ม `"url": "https://gateway-host.example.com/slack/events"` ให้ทุก entry ตัวอย่าง:

```json
    "slash_commands": [
      {
        "command": "/new",
        "description": "เริ่ม session ใหม่",
        "usage_hint": "[model]",
        "url": "https://gateway-host.example.com/slack/events"
      },
      {
        "command": "/help",
        "description": "แสดงสรุปวิธีใช้แบบสั้น",
        "url": "https://gateway-host.example.com/slack/events"
      }
      // ...repeat for every command with the same `url` value
    ]
```

      </Tab>
    </Tabs>

  </Accordion>
  <Accordion title="Optional authorship scopes (write operations)">
    เพิ่ม bot scope `chat:write.customize` หากคุณต้องการให้ข้อความขาออกใช้ตัวตนของเอเจนต์ที่กำลังใช้งานอยู่ (ชื่อผู้ใช้และไอคอนแบบกำหนดเอง) แทนตัวตนเริ่มต้นของแอป Slack

    หากคุณใช้ไอคอนอีโมจิ Slack จะคาดหวังไวยากรณ์แบบ `:emoji_name:`

  </Accordion>
  <Accordion title="Optional user-token scopes (read operations)">
    หากคุณกำหนดค่า `channels.slack.userToken` scope สำหรับการอ่านที่ใช้โดยทั่วไปคือ:

    - `channels:history`, `groups:history`, `im:history`, `mpim:history`
    - `channels:read`, `groups:read`, `im:read`, `mpim:read`
    - `users:read`
    - `reactions:read`
    - `pins:read`
    - `emoji:read`
    - `search:read` (หากคุณต้องพึ่งพาการอ่านผ่านการค้นหาของ Slack)

  </Accordion>
</AccordionGroup>

## โมเดลของโทเค็น

- ต้องใช้ `botToken` + `appToken` สำหรับ Socket Mode
- โหมด HTTP ต้องใช้ `botToken` + `signingSecret`
- `botToken`, `appToken`, `signingSecret` และ `userToken` รองรับทั้งสตริง
  แบบ plaintext หรือออบเจ็กต์ SecretRef
- โทเค็นใน config มีลำดับความสำคัญสูงกว่าค่า env สำรอง
- ค่า env สำรอง `SLACK_BOT_TOKEN` / `SLACK_APP_TOKEN` ใช้ได้เฉพาะกับบัญชีเริ่มต้นเท่านั้น
- `userToken` (`xoxp-...`) ใช้ได้เฉพาะใน config (ไม่มี env สำรอง) และค่าเริ่มต้นเป็นลักษณะการทำงานแบบอ่านอย่างเดียว (`userTokenReadOnly: true`)

ลักษณะการทำงานของภาพรวมสถานะ:

- การตรวจสอบบัญชี Slack จะติดตามฟิลด์ `*Source` และ `*Status`
  ของแต่ละข้อมูลรับรอง (`botToken`, `appToken`, `signingSecret`, `userToken`)
- สถานะอาจเป็น `available`, `configured_unavailable` หรือ `missing`
- `configured_unavailable` หมายความว่าบัญชีถูกกำหนดค่าไว้ผ่าน SecretRef
  หรือแหล่ง secret ที่ไม่ใช่แบบ inline อื่น ๆ แต่คำสั่ง/เส้นทางรันไทม์ปัจจุบัน
  ไม่สามารถ resolve ค่าจริงได้
- ในโหมด HTTP จะมี `signingSecretStatus`; ใน Socket Mode คู่ที่
  จำเป็นคือ `botTokenStatus` + `appTokenStatus`

<Tip>
สำหรับ actions/การอ่านไดเรกทอรี สามารถให้สิทธิ์ user token เป็นตัวเลือกหลักได้เมื่อมีการกำหนดค่าไว้ สำหรับการเขียน bot token ยังคงเป็นตัวเลือกหลัก; การเขียนด้วย user token จะอนุญาตเฉพาะเมื่อ `userTokenReadOnly: false` และ bot token ไม่พร้อมใช้งาน
</Tip>

## Actions และ gates

actions ของ Slack ถูกควบคุมด้วย `channels.slack.actions.*`

กลุ่ม action ที่ใช้ได้ในเครื่องมือ Slack ปัจจุบัน:

| กลุ่ม | ค่าเริ่มต้น |
| ---------- | ------- |
| messages | เปิดใช้งาน |
| reactions | เปิดใช้งาน |
| pins | เปิดใช้งาน |
| memberInfo | เปิดใช้งาน |
| emojiList | เปิดใช้งาน |

actions ของข้อความใน Slack ที่รองรับในปัจจุบันได้แก่ `send`, `upload-file`, `download-file`, `read`, `edit`, `delete`, `pin`, `unpin`, `list-pins`, `member-info` และ `emoji-list`

## การควบคุมการเข้าถึงและการกำหนดเส้นทาง

<Tabs>
  <Tab title="นโยบาย DM">
    `channels.slack.dmPolicy` ควบคุมการเข้าถึง DM (แบบเดิม: `channels.slack.dm.policy`):

    - `pairing` (ค่าเริ่มต้น)
    - `allowlist`
    - `open` (ต้องให้ `channels.slack.allowFrom` มี `"*"` รวมอยู่ด้วย; แบบเดิม: `channels.slack.dm.allowFrom`)
    - `disabled`

    แฟลกของ DM:

    - `dm.enabled` (ค่าเริ่มต้นเป็น true)
    - `channels.slack.allowFrom` (แนะนำให้ใช้)
    - `dm.allowFrom` (แบบเดิม)
    - `dm.groupEnabled` (ค่าเริ่มต้นของ group DMs เป็น false)
    - `dm.groupChannels` (allowlist ของ MPIM แบบไม่บังคับ)

    ลำดับความสำคัญแบบหลายบัญชี:

    - `channels.slack.accounts.default.allowFrom` ใช้กับบัญชี `default` เท่านั้น
    - บัญชีที่ตั้งชื่อไว้จะสืบทอด `channels.slack.allowFrom` เมื่อไม่ได้ตั้ง `allowFrom` ของตัวเอง
    - บัญชีที่ตั้งชื่อไว้จะไม่สืบทอด `channels.slack.accounts.default.allowFrom`

    การจับคู่ใน DMs ใช้ `openclaw pairing approve slack <code>`

  </Tab>

  <Tab title="นโยบายช่อง">
    `channels.slack.groupPolicy` ควบคุมการจัดการช่อง:

    - `open`
    - `allowlist`
    - `disabled`

    allowlist ของช่องอยู่ใต้ `channels.slack.channels` และควรใช้ channel IDs ที่คงที่

    หมายเหตุขณะรันไทม์: หากไม่มี `channels.slack` เลย (ตั้งค่าผ่าน env อย่างเดียว) รันไทม์จะย้อนกลับไปใช้ `groupPolicy="allowlist"` และบันทึกคำเตือน (แม้ว่าจะตั้ง `channels.defaults.groupPolicy` ไว้ก็ตาม)

    การ resolve ชื่อ/ID:

    - รายการ allowlist ของช่องและรายการ allowlist ของ DM จะถูก resolve ตอนเริ่มต้นเมื่อสิทธิ์เข้าถึง token อนุญาต
    - รายการชื่อช่องที่ resolve ไม่ได้จะถูกเก็บไว้ตามที่กำหนดค่า แต่จะถูกละเว้นสำหรับการกำหนดเส้นทางตามค่าเริ่มต้น
    - การอนุญาตขาเข้าและการกำหนดเส้นทางช่องใช้ ID-first ตามค่าเริ่มต้น; การจับคู่ตรงด้วย username/slug ต้องใช้ `channels.slack.dangerouslyAllowNameMatching: true`

  </Tab>

  <Tab title="Mentions และผู้ใช้ในช่อง">
    ข้อความในช่องจะถูกควบคุมด้วย mention ตามค่าเริ่มต้น

    แหล่งที่มาของ mention:

    - การ mention แอปแบบชัดเจน (`<@botId>`)
    - แพตเทิร์น regex ของ mention (`agents.list[].groupChat.mentionPatterns`, สำรองเป็น `messages.groupChat.mentionPatterns`)
    - ลักษณะการทำงานแบบตอบกลับเธรดถึงบอตโดยนัย (ปิดใช้งานเมื่อ `thread.requireExplicitMention` เป็น `true`)

    ตัวควบคุมรายช่อง (`channels.slack.channels.<id>`; ชื่อใช้ได้เฉพาะผ่านการ resolve ตอนเริ่มต้นหรือ `dangerouslyAllowNameMatching`):

    - `requireMention`
    - `users` (allowlist)
    - `allowBots`
    - `skills`
    - `systemPrompt`
    - `tools`, `toolsBySender`
    - รูปแบบคีย์ของ `toolsBySender`: `id:`, `e164:`, `username:`, `name:` หรือ wildcard `"*"`
      (คีย์แบบเดิมที่ไม่มี prefix จะยังแมปเป็น `id:` เท่านั้น)

  </Tab>
</Tabs>

## เธรด, sessions และ reply tags

- DMs กำหนดเส้นทางเป็น `direct`; ช่องเป็น `channel`; MPIMs เป็น `group`
- เมื่อใช้ค่าเริ่มต้น `session.dmScope=main`, DM ของ Slack จะถูกรวมไปยัง session หลักของเอเจนต์
- session ของช่อง: `agent:<agentId>:slack:channel:<channelId>`
- การตอบกลับในเธรดสามารถสร้าง suffix ของ thread session (`:thread:<threadTs>`) ได้เมื่อใช้ได้
- ค่าเริ่มต้นของ `channels.slack.thread.historyScope` คือ `thread`; ค่าเริ่มต้นของ `thread.inheritParent` คือ `false`
- `channels.slack.thread.initialHistoryLimit` ควบคุมจำนวนข้อความเดิมในเธรดที่จะดึงมาเมื่อเริ่ม thread session ใหม่ (ค่าเริ่มต้น `20`; ตั้งเป็น `0` เพื่อปิดใช้งาน)
- `channels.slack.thread.requireExplicitMention` (ค่าเริ่มต้น `false`): เมื่อเป็น `true` จะระงับ mentions ในเธรดแบบโดยนัย เพื่อให้บอตตอบเฉพาะ `@bot` mention แบบชัดเจนภายในเธรด แม้ว่าบอตจะเคยเข้าร่วมในเธรดนั้นแล้วก็ตาม หากไม่ตั้งค่านี้ การตอบกลับในเธรดที่บอตเข้าร่วมแล้วจะข้ามการควบคุม `requireMention`

ตัวควบคุมการตอบกลับแบบเธรด:

- `channels.slack.replyToMode`: `off|first|all|batched` (ค่าเริ่มต้น `off`)
- `channels.slack.replyToModeByChatType`: แยกตาม `direct|group|channel`
- ค่า fallback แบบเดิมสำหรับแชตโดยตรง: `channels.slack.dm.replyToMode`

รองรับ reply tags แบบกำหนดเอง:

- `[[reply_to_current]]`
- `[[reply_to:<id>]]`

หมายเหตุ: `replyToMode="off"` จะปิดการตอบกลับแบบเธรด **ทั้งหมด** ใน Slack รวมถึงแท็ก `[[reply_to_*]]` แบบชัดเจนด้วย ซึ่งต่างจาก Telegram ที่ยังคงรองรับแท็กแบบชัดเจนในโหมด `"off"` — เธรดของ Slack จะซ่อนข้อความออกจากช่อง ขณะที่การตอบกลับของ Telegram ยังคงมองเห็นแบบ inline

## Ack reactions

`ackReaction` จะส่งอีโมจิยืนยันการรับข้อความขณะ OpenClaw กำลังประมวลผลข้อความขาเข้า

ลำดับการ resolve:

- `channels.slack.accounts.<accountId>.ackReaction`
- `channels.slack.ackReaction`
- `messages.ackReaction`
- emoji สำรองจากตัวตนของเอเจนต์ (`agents.list[].identity.emoji`, ไม่เช่นนั้นใช้ "👀")

หมายเหตุ:

- Slack คาดหวัง shortcodes (เช่น `"eyes"`)
- ใช้ `""` เพื่อปิด reaction สำหรับบัญชี Slack หรือทั้งระบบ

## การสตรีมข้อความ

`channels.slack.streaming` ควบคุมลักษณะการแสดงตัวอย่างแบบสด:

- `off`: ปิดการสตรีมตัวอย่างแบบสด
- `partial` (ค่าเริ่มต้น): แทนที่ข้อความตัวอย่างด้วยผลลัพธ์บางส่วนล่าสุด
- `block`: ต่อท้ายการอัปเดตตัวอย่างแบบแบ่งเป็นชิ้น
- `progress`: แสดงข้อความสถานะความคืบหน้าระหว่างสร้าง แล้วจึงส่งข้อความสุดท้าย
- `streaming.preview.toolProgress`: เมื่อตัวอย่างแบบร่างทำงานอยู่ ให้กำหนดเส้นทางการอัปเดต tool/progress ไปยังข้อความตัวอย่างที่แก้ไขอยู่ข้อความเดียวกัน (ค่าเริ่มต้น: `true`) ตั้งเป็น `false` หากต้องการเก็บข้อความ tool/progress แยกต่างหาก

`channels.slack.streaming.nativeTransport` ควบคุมการสตรีมข้อความแบบเนทีฟของ Slack เมื่อ `channels.slack.streaming.mode` เป็น `partial` (ค่าเริ่มต้น: `true`)

- ต้องมี reply thread เพื่อให้การสตรีมข้อความแบบเนทีฟและสถานะเธรดผู้ช่วยของ Slack แสดงผลได้ การเลือกเธรดยังคงเป็นไปตาม `replyToMode`
- รากของแชตช่องและแชตกลุ่มยังคงใช้ตัวอย่างแบบร่างปกติได้เมื่อไม่สามารถใช้การสตรีมแบบเนทีฟได้
- DM ของ Slack ระดับบนสุดจะอยู่นอกเธรดตามค่าเริ่มต้น จึงไม่แสดงตัวอย่างแบบสไตล์เธรด; ใช้การตอบกลับในเธรดหรือ `typingReaction` หากคุณต้องการให้เห็นความคืบหน้าในกรณีนั้น
- payload สื่อและ payload ที่ไม่ใช่ข้อความจะย้อนกลับไปใช้การส่งปกติ
- finals ประเภทสื่อ/ข้อผิดพลาดจะยกเลิกการแก้ไขตัวอย่างที่ค้างอยู่; finals ประเภทข้อความ/บล็อกที่เข้าเกณฑ์จะ flush เฉพาะเมื่อสามารถแก้ไขตัวอย่างเดิมได้
- หากการสตรีมล้มเหลวระหว่างการตอบ OpenClaw จะย้อนกลับไปใช้การส่งแบบปกติสำหรับ payload ที่เหลือ

ใช้ตัวอย่างแบบร่างแทนการสตรีมข้อความแบบเนทีฟของ Slack:

```json5
{
  channels: {
    slack: {
      streaming: {
        mode: "partial",
        nativeTransport: false,
      },
    },
  },
}
```

คีย์แบบเดิม:

- `channels.slack.streamMode` (`replace | status_final | append`) จะถูกย้ายอัตโนมัติไปยัง `channels.slack.streaming.mode`
- ค่า boolean ของ `channels.slack.streaming` จะถูกย้ายอัตโนมัติไปยัง `channels.slack.streaming.mode` และ `channels.slack.streaming.nativeTransport`
- `channels.slack.nativeStreaming` แบบเดิมจะถูกย้ายอัตโนมัติไปยัง `channels.slack.streaming.nativeTransport`

## Typing reaction fallback

`typingReaction` จะเพิ่ม reaction ชั่วคราวให้กับข้อความ Slack ขาเข้าขณะที่ OpenClaw กำลังประมวลผลการตอบกลับ และจะลบออกเมื่อการรันเสร็จสิ้น สิ่งนี้มีประโยชน์มากที่สุดนอกการตอบกลับในเธรด ซึ่งใช้ตัวบ่งชี้สถานะ "is typing..." ตามค่าเริ่มต้น

ลำดับการ resolve:

- `channels.slack.accounts.<accountId>.typingReaction`
- `channels.slack.typingReaction`

หมายเหตุ:

- Slack คาดหวัง shortcodes (เช่น `"hourglass_flowing_sand"`)
- reaction นี้เป็นแบบ best-effort และระบบจะพยายามล้างอัตโนมัติหลังจากการตอบกลับหรือเส้นทางความล้มเหลวเสร็จสมบูรณ์

## สื่อ, การแบ่งชิ้น และการส่ง

<AccordionGroup>
  <Accordion title="ไฟล์แนบขาเข้า">
    ไฟล์แนบของ Slack จะถูกดาวน์โหลดจาก URL ส่วนตัวที่โฮสต์โดย Slack (โฟลว์คำขอที่ยืนยันตัวตนด้วย token) และเขียนลงใน media store เมื่อดึงข้อมูลสำเร็จและไม่เกินขีดจำกัดขนาด

    ขีดจำกัดขนาดขาเข้าขณะรันไทม์มีค่าเริ่มต้นเป็น `20MB` เว้นแต่จะ override ด้วย `channels.slack.mediaMaxMb`

  </Accordion>

  <Accordion title="ข้อความขาออกและไฟล์">
    - การแบ่งชิ้นของข้อความใช้ `channels.slack.textChunkLimit` (ค่าเริ่มต้น 4000)
    - `channels.slack.chunkMode="newline"` เปิดใช้การแบ่งแบบย่อหน้าก่อน
    - การส่งไฟล์ใช้ APIs สำหรับอัปโหลดของ Slack และสามารถรวมการตอบกลับในเธรด (`thread_ts`) ได้
    - ขีดจำกัดสื่อขาออกจะเป็นไปตาม `channels.slack.mediaMaxMb` เมื่อมีการกำหนดค่า; มิฉะนั้นการส่งในช่องจะใช้ค่าเริ่มต้นตามชนิด MIME จาก media pipeline
  </Accordion>

  <Accordion title="เป้าหมายการส่ง">
    เป้าหมายแบบระบุชัดที่แนะนำ:

    - `user:<id>` สำหรับ DMs
    - `channel:<id>` สำหรับช่อง

    DM ของ Slack จะถูกเปิดผ่าน conversation APIs ของ Slack เมื่อส่งไปยังเป้าหมายผู้ใช้

  </Accordion>
</AccordionGroup>

## คำสั่งและลักษณะการทำงานของ slash

slash commands จะแสดงใน Slack เป็นได้ทั้งคำสั่งที่กำหนดค่าไว้เพียงคำสั่งเดียวหรือหลายคำสั่งแบบเนทีฟ กำหนด `channels.slack.slashCommand` เพื่อเปลี่ยนค่าเริ่มต้นของคำสั่ง:

- `enabled: false`
- `name: "openclaw"`
- `sessionPrefix: "slack:slash"`
- `ephemeral: true`

```txt
/openclaw /help
```

native commands ต้องมี [การตั้งค่า manifest เพิ่มเติม](#additional-manifest-settings) ในแอป Slack ของคุณ และเปิดใช้งานด้วย `channels.slack.commands.native: true` หรือ `commands.native: true` ในการกำหนดค่า global แทน

- โหมดอัตโนมัติของ native commands เป็น **ปิด** สำหรับ Slack ดังนั้น `commands.native: "auto"` จะไม่เปิดใช้ native commands ของ Slack

```txt
/help
```

เมนูอาร์กิวเมนต์ของ native ใช้กลยุทธ์การแสดงผลแบบปรับตามสถานการณ์ โดยจะแสดง modal ยืนยันก่อนส่งค่าตัวเลือกที่เลือก:

- สูงสุด 5 ตัวเลือก: button blocks
- 6-100 ตัวเลือก: static select menu
- มากกว่า 100 ตัวเลือก: external select พร้อมการกรองตัวเลือกแบบ async เมื่อมีตัวจัดการตัวเลือก interactivity
- หากเกินขีดจำกัดของ Slack: ค่าตัวเลือกที่เข้ารหัสจะย้อนกลับไปใช้ buttons

```txt
/think
```

slash sessions ใช้คีย์แยกเฉพาะอย่าง `agent:<agentId>:slack:slash:<userId>` และยังคงกำหนดเส้นทางการรันคำสั่งไปยัง session ของบทสนทนาเป้าหมายผ่าน `CommandTargetSessionKey`

## การตอบกลับแบบโต้ตอบ

Slack สามารถเรนเดอร์ตัวควบคุมการตอบกลับแบบโต้ตอบที่เอเจนต์สร้างขึ้นได้ แต่ฟีเจอร์นี้ปิดอยู่ตามค่าเริ่มต้น

เปิดใช้แบบ global:

```json5
{
  channels: {
    slack: {
      capabilities: {
        interactiveReplies: true,
      },
    },
  },
}
```

หรือเปิดใช้เฉพาะบัญชี Slack บัญชีเดียว:

```json5
{
  channels: {
    slack: {
      accounts: {
        ops: {
          capabilities: {
            interactiveReplies: true,
          },
        },
      },
    },
  },
}
```

เมื่อเปิดใช้งานแล้ว เอเจนต์สามารถส่ง reply directives ที่ใช้ได้เฉพาะกับ Slack:

- `[[slack_buttons: Approve:approve, Reject:reject]]`
- `[[slack_select: Choose a target | Canary:canary, Production:production]]`

directives เหล่านี้จะถูกคอมไพล์เป็น Slack Block Kit และกำหนดเส้นทางการคลิกหรือการเลือกกลับผ่านเส้นทาง event interactions ของ Slack ที่มีอยู่แล้ว

หมายเหตุ:

- นี่คือ UI เฉพาะของ Slack ช่องทางอื่นจะไม่แปล directives ของ Slack Block Kit เป็นระบบปุ่มของตนเอง
- ค่า callback แบบโต้ตอบเป็น opaque tokens ที่สร้างโดย OpenClaw ไม่ใช่ค่าดิบที่เอเจนต์เขียนขึ้นเอง
- หาก blocks แบบโต้ตอบที่สร้างขึ้นเกินขีดจำกัดของ Slack Block Kit, OpenClaw จะย้อนกลับไปใช้ข้อความตอบกลับเดิมแทนการส่ง payload blocks ที่ไม่ถูกต้อง

## การอนุมัติ exec ใน Slack

Slack สามารถทำหน้าที่เป็นไคลเอนต์การอนุมัติแบบเนทีฟด้วยปุ่มและ interactions แบบโต้ตอบ แทนการย้อนกลับไปใช้ Web UI หรือเทอร์มินัล

- การอนุมัติ exec ใช้ `channels.slack.execApprovals.*` สำหรับการกำหนดเส้นทาง DM/ช่องแบบเนทีฟ
- การอนุมัติ Plugin ยังสามารถ resolve ผ่านพื้นผิวปุ่มแบบเนทีฟของ Slack เดียวกันได้ เมื่อคำขอมาถึงใน Slack อยู่แล้วและชนิดของ approval id เป็น `plugin:`
- การอนุญาตผู้อนุมัติยังคงถูกบังคับใช้: เฉพาะผู้ใช้ที่ระบุว่าเป็นผู้อนุมัติเท่านั้นจึงจะอนุมัติหรือปฏิเสธคำขอผ่าน Slack ได้

สิ่งนี้ใช้พื้นผิวปุ่มอนุมัติแบบใช้ร่วมกันเดียวกับช่องทางอื่น เมื่อเปิดใช้ `interactivity` ในการตั้งค่าแอป Slack ของคุณ ข้อความขออนุมัติจะแสดงเป็นปุ่ม Block Kit โดยตรงภายในบทสนทนา
เมื่อมีปุ่มเหล่านี้ ปุ่มดังกล่าวจะเป็น UX หลักสำหรับการอนุมัติ; OpenClaw
ควรใส่คำสั่ง `/approve` แบบแมนนวลเฉพาะเมื่อผลลัพธ์ของเครื่องมือระบุว่า
การอนุมัติผ่านแชตไม่พร้อมใช้งาน หรือการอนุมัติแบบแมนนวลเป็นเส้นทางเดียวเท่านั้น

เส้นทาง config:

- `channels.slack.execApprovals.enabled`
- `channels.slack.execApprovals.approvers` (ไม่บังคับ; หากเป็นไปได้จะย้อนกลับไปใช้ `commands.ownerAllowFrom`)
- `channels.slack.execApprovals.target` (`dm` | `channel` | `both`, ค่าเริ่มต้น: `dm`)
- `agentFilter`, `sessionFilter`

Slack จะเปิดใช้การอนุมัติ exec แบบเนทีฟอัตโนมัติเมื่อไม่ได้ตั้ง `enabled` หรือเป็น `"auto"` และมี
ผู้อนุมัติอย่างน้อยหนึ่งรายที่ resolve ได้ ตั้งค่า `enabled: false` เพื่อปิด Slack ไม่ให้เป็นไคลเอนต์การอนุมัติแบบเนทีฟอย่างชัดเจน
ตั้งค่า `enabled: true` เพื่อบังคับเปิดการอนุมัติแบบเนทีฟเมื่อมีผู้อนุมัติที่ resolve ได้

ลักษณะการทำงานเริ่มต้นเมื่อไม่มี config สำหรับการอนุมัติ exec ของ Slack แบบชัดเจน:

```json5
{
  commands: {
    ownerAllowFrom: ["slack:U12345678"],
  },
}
```

จำเป็นต้องมี config แบบเนทีฟของ Slack แบบชัดเจนเฉพาะเมื่อคุณต้องการ override ผู้อนุมัติ เพิ่ม filters หรือ
เลือกใช้การส่งไปยังแชตต้นทาง:

```json5
{
  channels: {
    slack: {
      execApprovals: {
        enabled: true,
        approvers: ["U12345678"],
        target: "both",
      },
    },
  },
}
```

การส่งต่อ `approvals.exec` แบบใช้ร่วมกันเป็นคนละส่วน ใช้เฉพาะเมื่อข้อความขออนุมัติ exec ต้องถูก
กำหนดเส้นทางไปยังแชตอื่นหรือเป้าหมายนอกแบนด์ที่ระบุชัดเท่านั้น การส่งต่อ `approvals.plugin` แบบใช้ร่วมกันก็
แยกต่างหากเช่นกัน; ปุ่มแบบเนทีฟของ Slack ยังสามารถ resolve การอนุมัติ Plugin ได้เมื่อคำขอเหล่านั้นมาถึง
ใน Slack อยู่แล้ว

`/approve` ในแชตเดียวกันก็ใช้งานได้เช่นกันในช่องและ DM ของ Slack ที่รองรับคำสั่งอยู่แล้ว ดู [การอนุมัติ exec](/th/tools/exec-approvals) สำหรับโมเดลการส่งต่อการอนุมัติแบบเต็ม

## Events และลักษณะการทำงานเชิงปฏิบัติการ

- การแก้ไข/ลบข้อความและการกระจายข้อความในเธรดจะถูกแมปเป็น system events
- events การเพิ่ม/ลบ reaction จะถูกแมปเป็น system events
- events การเข้าร่วม/ออกจากสมาชิก การสร้าง/เปลี่ยนชื่อช่อง และการเพิ่ม/ลบ pin จะถูกแมปเป็น system events
- `channel_id_changed` สามารถย้ายคีย์ config ของช่องได้เมื่อเปิดใช้ `configWrites`
- ข้อมูลเมตา topic/purpose ของช่องจะถูกถือเป็น context ที่ไม่น่าเชื่อถือ และสามารถฉีดเข้าไปใน routing context ได้
- ข้อความเริ่มต้นเธรดและการ seed context จากประวัติเธรดเริ่มต้นจะถูกกรองตาม sender allowlists ที่กำหนดไว้เมื่อใช้ได้
- block actions และ modal interactions จะส่ง system events แบบมีโครงสร้าง `Slack interaction: ...` พร้อมฟิลด์ payload แบบละเอียด:
  - block actions: ค่าที่เลือก ป้ายกำกับ ค่าจาก picker และข้อมูลเมตา `workflow_*`
  - events `view_submission` และ `view_closed` ของ modal พร้อมข้อมูลเมตาช่องที่ถูกกำหนดเส้นทางและอินพุตของฟอร์ม

## ข้อมูลอ้างอิงการกำหนดค่า

ข้อมูลอ้างอิงหลัก: [ข้อมูลอ้างอิงการกำหนดค่า - Slack](/th/gateway/config-channels#slack)

<Accordion title="ฟิลด์ Slack ที่มีสัญญาณสำคัญ">

- mode/auth: `mode`, `botToken`, `appToken`, `signingSecret`, `webhookPath`, `accounts.*`
- การเข้าถึง DM: `dm.enabled`, `dmPolicy`, `allowFrom` (แบบเดิม: `dm.policy`, `dm.allowFrom`), `dm.groupEnabled`, `dm.groupChannels`
- สวิตช์ความเข้ากันได้: `dangerouslyAllowNameMatching` (ใช้ยามฉุกเฉิน; ควรปิดไว้หากไม่จำเป็น)
- การเข้าถึงช่อง: `groupPolicy`, `channels.*`, `channels.*.users`, `channels.*.requireMention`
- เธรด/ประวัติ: `replyToMode`, `replyToModeByChatType`, `thread.*`, `historyLimit`, `dmHistoryLimit`, `dms.*.historyLimit`
- การส่ง: `textChunkLimit`, `chunkMode`, `mediaMaxMb`, `streaming`, `streaming.nativeTransport`, `streaming.preview.toolProgress`
- การปฏิบัติการ/ฟีเจอร์: `configWrites`, `commands.native`, `slashCommand.*`, `actions.*`, `userToken`, `userTokenReadOnly`

</Accordion>

## การแก้ไขปัญหา

<AccordionGroup>
  <Accordion title="ไม่มีการตอบกลับในช่อง">
    ตรวจสอบตามลำดับ:

    - `groupPolicy`
    - channel allowlist (`channels.slack.channels`)
    - `requireMention`
    - `users` allowlist รายช่อง

    คำสั่งที่มีประโยชน์:

```bash
openclaw channels status --probe
openclaw logs --follow
openclaw doctor
```

  </Accordion>

  <Accordion title="ข้อความ DM ถูกเพิกเฉย">
    ตรวจสอบ:

    - `channels.slack.dm.enabled`
    - `channels.slack.dmPolicy` (หรือแบบเดิม `channels.slack.dm.policy`)
    - การอนุมัติการจับคู่ / รายการ allowlist

```bash
openclaw pairing list slack
```

  </Accordion>

  <Accordion title="Socket mode ไม่เชื่อมต่อ">
    ตรวจสอบความถูกต้องของ bot token + app token และการเปิดใช้ Socket Mode ในการตั้งค่าแอป Slack

    หาก `openclaw channels status --probe --json` แสดง `botTokenStatus` หรือ
    `appTokenStatus: "configured_unavailable"` แปลว่าบัญชี Slack
    ถูกกำหนดค่าไว้แล้ว แต่รันไทม์ปัจจุบันไม่สามารถ resolve ค่าที่อยู่หลัง SecretRef ได้

  </Accordion>

  <Accordion title="HTTP mode ไม่ได้รับ events">
    ตรวจสอบความถูกต้องของ:

    - signing secret
    - เส้นทาง webhook
    - Slack Request URLs (Events + Interactivity + Slash Commands)
    - `webhookPath` ที่ไม่ซ้ำกันต่อบัญชี HTTP

    หาก `signingSecretStatus: "configured_unavailable"` ปรากฏในภาพรวมบัญชี
    แปลว่าบัญชี HTTP ถูกกำหนดค่าไว้แล้ว แต่รันไทม์ปัจจุบันไม่สามารถ
    resolve signing secret ที่อยู่หลัง SecretRef ได้

  </Accordion>

  <Accordion title="Native/slash commands ไม่ทำงาน">
    ตรวจสอบว่าคุณตั้งใจใช้แบบใด:

    - โหมด native command (`channels.slack.commands.native: true`) พร้อม slash commands ที่ลงทะเบียนตรงกันใน Slack
    - หรือโหมด single slash command (`channels.slack.slashCommand.enabled: true`)

    ตรวจสอบ `commands.useAccessGroups` และ allowlists ของช่อง/ผู้ใช้ด้วย

  </Accordion>
</AccordionGroup>

## ที่เกี่ยวข้อง

<CardGroup cols={2}>
  <Card title="การจับคู่" icon="link" href="/th/channels/pairing">
    จับคู่ผู้ใช้ Slack เข้ากับ gateway
  </Card>
  <Card title="กลุ่ม" icon="users" href="/th/channels/groups">
    ลักษณะการทำงานของช่องและ group DM
  </Card>
  <Card title="การกำหนดเส้นทางของช่องทาง" icon="route" href="/th/channels/channel-routing">
    กำหนดเส้นทางข้อความขาเข้าไปยังเอเจนต์
  </Card>
  <Card title="ความปลอดภัย" icon="shield" href="/th/gateway/security">
    แบบจำลองภัยคุกคามและการเสริมความแข็งแกร่ง
  </Card>
  <Card title="การกำหนดค่า" icon="sliders" href="/th/gateway/configuration">
    เลย์เอาต์ config และลำดับความสำคัญ
  </Card>
  <Card title="Slash commands" icon="terminal" href="/th/tools/slash-commands">
    แค็ตตาล็อกคำสั่งและลักษณะการทำงาน
  </Card>
</CardGroup>
