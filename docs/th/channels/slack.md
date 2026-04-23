---
read_when:
    - การตั้งค่า Slack หรือการแก้ไขปัญหาโหมด socket/HTTP ของ Slack
summary: การตั้งค่าและพฤติกรรมขณะรันไทม์ของ Slack (Socket Mode + URL คำขอ HTTP)
title: Slack
x-i18n:
    generated_at: "2026-04-23T05:27:17Z"
    model: gpt-5.4
    provider: openai
    source_hash: a1609ab5570daac455005cb00cee578c8954e05b25c25bf5759ae032d2a12c2c
    source_path: channels/slack.md
    workflow: 15
---

# Slack

สถานะ: พร้อมใช้งานจริงสำหรับ DM + ช่องทางผ่านการเชื่อมต่อแอป Slack โหมดค่าเริ่มต้นคือ Socket Mode; รองรับ URL คำขอ HTTP ด้วย

<CardGroup cols={3}>
  <Card title="การจับคู่" icon="link" href="/th/channels/pairing">
    DM ของ Slack ใช้โหมด pairing เป็นค่าเริ่มต้น
  </Card>
  <Card title="คำสั่ง slash" icon="terminal" href="/th/tools/slash-commands">
    พฤติกรรมคำสั่งแบบ native และแค็ตตาล็อกคำสั่ง
  </Card>
  <Card title="การแก้ไขปัญหาช่องทาง" icon="wrench" href="/th/channels/troubleshooting">
    การวินิจฉัยข้ามช่องทางและคู่มือการซ่อมแซม
  </Card>
</CardGroup>

## การตั้งค่าอย่างรวดเร็ว

<Tabs>
  <Tab title="Socket Mode (ค่าเริ่มต้น)">
    <Steps>
      <Step title="สร้างแอป Slack ใหม่">
        ในการตั้งค่าแอป Slack ให้กดปุ่ม **[Create New App](https://api.slack.com/apps/new)**:

        - เลือก **from a manifest** และเลือก workspace สำหรับแอปของคุณ
        - วาง [manifest ตัวอย่าง](#manifest-and-scope-checklist) จากด้านล่างแล้วดำเนินการสร้างต่อ
        - สร้าง **App-Level Token** (`xapp-...`) ที่มี `connections:write`
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

        ค่า fallback ของ env (เฉพาะบัญชีค่าเริ่มต้น):

```bash
SLACK_APP_TOKEN=xapp-...
SLACK_BOT_TOKEN=xoxb-...
```

      </Step>

      <Step title="เริ่ม Gateway">

```bash
openclaw gateway
```

      </Step>
    </Steps>

  </Tab>

  <Tab title="URL คำขอ HTTP">
    <Steps>
      <Step title="สร้างแอป Slack ใหม่">
        ในการตั้งค่าแอป Slack ให้กดปุ่ม **[Create New App](https://api.slack.com/apps/new)**:

        - เลือก **from a manifest** และเลือก workspace สำหรับแอปของคุณ
        - วาง [manifest ตัวอย่าง](#manifest-and-scope-checklist) และอัปเดต URL ก่อนสร้าง
        - บันทึก **Signing Secret** ไว้เพื่อใช้ตรวจสอบคำขอ
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
        ใช้พาธ Webhook ที่ไม่ซ้ำกันสำหรับ HTTP แบบหลายบัญชี

        กำหนด `webhookPath` ที่ต่างกันให้แต่ละบัญชี (ค่าเริ่มต้น `/slack/events`) เพื่อไม่ให้การลงทะเบียนชนกัน
        </Note>

      </Step>

      <Step title="เริ่ม Gateway">

```bash
openclaw gateway
```

      </Step>
    </Steps>

  </Tab>
</Tabs>

## รายการตรวจสอบ manifest และ scope

<Tabs>
  <Tab title="Socket Mode (ค่าเริ่มต้น)">

```json
{
  "display_information": {
    "name": "OpenClaw",
    "description": "ตัวเชื่อมต่อ Slack สำหรับ OpenClaw"
  },
  "features": {
    "bot_user": {
      "display_name": "OpenClaw",
      "always_online": true
    },
    "app_home": {
      "messages_tab_enabled": true,
      "messages_tab_read_only_enabled": false
    },
    "slash_commands": [
      {
        "command": "/openclaw",
        "description": "ส่งข้อความถึง OpenClaw",
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

  </Tab>

  <Tab title="URL คำขอ HTTP">

```json
{
  "display_information": {
    "name": "OpenClaw",
    "description": "ตัวเชื่อมต่อ Slack สำหรับ OpenClaw"
  },
  "features": {
    "bot_user": {
      "display_name": "OpenClaw",
      "always_online": true
    },
    "app_home": {
      "messages_tab_enabled": true,
      "messages_tab_read_only_enabled": false
    },
    "slash_commands": [
      {
        "command": "/openclaw",
        "description": "ส่งข้อความถึง OpenClaw",
        "should_escape": false,
        "url": "https://gateway-host.example.com/slack/events"
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
    "event_subscriptions": {
      "request_url": "https://gateway-host.example.com/slack/events",
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
    },
    "interactivity": {
      "is_enabled": true,
      "request_url": "https://gateway-host.example.com/slack/events",
      "message_menu_options_url": "https://gateway-host.example.com/slack/events"
    }
  }
}
```

  </Tab>
</Tabs>

### การตั้งค่า manifest เพิ่มเติม

แสดงความสามารถต่าง ๆ ที่ขยายจากค่าเริ่มต้นด้านบน

<AccordionGroup>
  <Accordion title="คำสั่ง slash แบบ native ที่เป็นตัวเลือก">

    สามารถใช้ [คำสั่ง slash แบบ native](#commands-and-slash-behavior) ได้หลายคำสั่งแทนคำสั่งที่กำหนดค่าไว้เพียงคำสั่งเดียว โดยมีรายละเอียดดังนี้:

    - ใช้ `/agentstatus` แทน `/status` เพราะคำสั่ง `/status` ถูกสงวนไว้
    - สามารถเปิดใช้คำสั่ง slash ได้พร้อมกันไม่เกิน 25 คำสั่ง

    แทนที่ส่วน `features.slash_commands` ที่มีอยู่ด้วยชุดย่อยจาก [คำสั่งที่ใช้ได้](/th/tools/slash-commands#command-list):

    <Tabs>
      <Tab title="Socket Mode (ค่าเริ่มต้น)">

```json
    "slash_commands": [
      {
        "command": "/new",
        "description": "เริ่มเซสชันใหม่",
        "usage_hint": "[model]"
      },
      {
        "command": "/reset",
        "description": "รีเซ็ตเซสชันปัจจุบัน"
      },
      {
        "command": "/compact",
        "description": "ทำ Compaction บริบทของเซสชัน",
        "usage_hint": "[instructions]"
      },
      {
        "command": "/stop",
        "description": "หยุดการรันปัจจุบัน"
      },
      {
        "command": "/session",
        "description": "จัดการการหมดอายุของ thread-binding",
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
        "description": "สลับโหมดยกระดับ",
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
        "description": "แสดงรายการ provider/โมเดล หรือเพิ่มโมเดล",
        "usage_hint": "[provider] [page] [limit=<n>|size=<n>|all] | add <provider> <modelId>"
      },
      {
        "command": "/help",
        "description": "แสดงสรุปความช่วยเหลือแบบสั้น"
      },
      {
        "command": "/commands",
        "description": "แสดงแค็ตตาล็อกคำสั่งที่สร้างขึ้น"
      },
      {
        "command": "/tools",
        "description": "แสดงสิ่งที่เอเจนต์ปัจจุบันใช้ได้ในขณะนี้",
        "usage_hint": "[compact|verbose]"
      },
      {
        "command": "/agentstatus",
        "description": "แสดงสถานะรันไทม์ รวมถึงการใช้งาน/โควต้าของ provider เมื่อมี"
      },
      {
        "command": "/tasks",
        "description": "แสดงรายการงานเบื้องหลังที่กำลังทำงาน/ล่าสุดสำหรับเซสชันปัจจุบัน"
      },
      {
        "command": "/context",
        "description": "อธิบายวิธีประกอบบริบท",
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
        "description": "ถามคำถามแทรกโดยไม่เปลี่ยนบริบทของเซสชัน",
        "usage_hint": "<question>"
      },
      {
        "command": "/usage",
        "description": "ควบคุมส่วนท้ายการใช้งานหรือแสดงสรุปค่าใช้จ่าย",
        "usage_hint": "off|tokens|full|cost"
      }
    ]
```

      </Tab>
      <Tab title="URL คำขอ HTTP">

```json
    "slash_commands": [
      {
        "command": "/new",
        "description": "เริ่มเซสชันใหม่",
        "usage_hint": "[model]",
        "url": "https://gateway-host.example.com/slack/events"
      },
      {
        "command": "/reset",
        "description": "รีเซ็ตเซสชันปัจจุบัน",
        "url": "https://gateway-host.example.com/slack/events"
      },
      {
        "command": "/compact",
        "description": "ทำ Compaction บริบทของเซสชัน",
        "usage_hint": "[instructions]",
        "url": "https://gateway-host.example.com/slack/events"
      },
      {
        "command": "/stop",
        "description": "หยุดการรันปัจจุบัน",
        "url": "https://gateway-host.example.com/slack/events"
      },
      {
        "command": "/session",
        "description": "จัดการการหมดอายุของ thread-binding",
        "usage_hint": "idle <duration|off> or max-age <duration|off>",
        "url": "https://gateway-host.example.com/slack/events"
      },
      {
        "command": "/think",
        "description": "ตั้งค่าระดับการคิด",
        "usage_hint": "<level>",
        "url": "https://gateway-host.example.com/slack/events"
      },
      {
        "command": "/verbose",
        "description": "สลับการแสดงผลแบบละเอียด",
        "usage_hint": "on|off|full",
        "url": "https://gateway-host.example.com/slack/events"
      },
      {
        "command": "/fast",
        "description": "แสดงหรือตั้งค่าโหมดเร็ว",
        "usage_hint": "[status|on|off]",
        "url": "https://gateway-host.example.com/slack/events"
      },
      {
        "command": "/reasoning",
        "description": "สลับการมองเห็น reasoning",
        "usage_hint": "[on|off|stream]",
        "url": "https://gateway-host.example.com/slack/events"
      },
      {
        "command": "/elevated",
        "description": "สลับโหมดยกระดับ",
        "usage_hint": "[on|off|ask|full]",
        "url": "https://gateway-host.example.com/slack/events"
      },
      {
        "command": "/exec",
        "description": "แสดงหรือตั้งค่าเริ่มต้นของ exec",
        "usage_hint": "host=<auto|sandbox|gateway|node> security=<deny|allowlist|full> ask=<off|on-miss|always> node=<id>",
        "url": "https://gateway-host.example.com/slack/events"
      },
      {
        "command": "/model",
        "description": "แสดงหรือตั้งค่าโมเดล",
        "usage_hint": "[name|#|status]",
        "url": "https://gateway-host.example.com/slack/events"
      },
      {
        "command": "/models",
        "description": "แสดงรายการ provider หรือโมเดลของ provider",
        "usage_hint": "[provider] [page] [limit=<n>|size=<n>|all]",
        "url": "https://gateway-host.example.com/slack/events"
      },
      {
        "command": "/help",
        "description": "แสดงสรุปความช่วยเหลือแบบสั้น",
        "url": "https://gateway-host.example.com/slack/events"
      },
      {
        "command": "/commands",
        "description": "แสดงแค็ตตาล็อกคำสั่งที่สร้างขึ้น",
        "url": "https://gateway-host.example.com/slack/events"
      },
      {
        "command": "/tools",
        "description": "แสดงสิ่งที่เอเจนต์ปัจจุบันใช้ได้ในขณะนี้",
        "usage_hint": "[compact|verbose]",
        "url": "https://gateway-host.example.com/slack/events"
      },
      {
        "command": "/agentstatus",
        "description": "แสดงสถานะรันไทม์ รวมถึงการใช้งาน/โควต้าของ provider เมื่อมี",
        "url": "https://gateway-host.example.com/slack/events"
      },
      {
        "command": "/tasks",
        "description": "แสดงรายการงานเบื้องหลังที่กำลังทำงาน/ล่าสุดสำหรับเซสชันปัจจุบัน",
        "url": "https://gateway-host.example.com/slack/events"
      },
      {
        "command": "/context",
        "description": "อธิบายวิธีประกอบบริบท",
        "usage_hint": "[list|detail|json]",
        "url": "https://gateway-host.example.com/slack/events"
      },
      {
        "command": "/whoami",
        "description": "แสดงตัวตนผู้ส่งของคุณ",
        "url": "https://gateway-host.example.com/slack/events"
      },
      {
        "command": "/skill",
        "description": "รัน skill ตามชื่อ",
        "usage_hint": "<name> [input]",
        "url": "https://gateway-host.example.com/slack/events"
      },
      {
        "command": "/btw",
        "description": "ถามคำถามแทรกโดยไม่เปลี่ยนบริบทของเซสชัน",
        "usage_hint": "<question>",
        "url": "https://gateway-host.example.com/slack/events"
      },
      {
        "command": "/usage",
        "description": "ควบคุมส่วนท้ายการใช้งานหรือแสดงสรุปค่าใช้จ่าย",
        "usage_hint": "off|tokens|full|cost",
        "url": "https://gateway-host.example.com/slack/events"
      }
    ]
```

      </Tab>
    </Tabs>

  </Accordion>
  <Accordion title="scope ของผู้เขียนแบบเลือกได้ (การเขียน)">
    เพิ่ม bot scope `chat:write.customize` หากคุณต้องการให้ข้อความขาออกใช้ตัวตนของเอเจนต์ที่กำลังใช้งานอยู่ (ชื่อผู้ใช้และไอคอนแบบกำหนดเอง) แทนตัวตนเริ่มต้นของแอป Slack

    หากคุณใช้งานไอคอนอีโมจิ Slack คาดหวังรูปแบบ `:emoji_name:`

  </Accordion>
  <Accordion title="scope ของ user token แบบเลือกได้ (การอ่าน)">
    หากคุณกำหนดค่า `channels.slack.userToken` scope การอ่านทั่วไปคือ:

    - `channels:history`, `groups:history`, `im:history`, `mpim:history`
    - `channels:read`, `groups:read`, `im:read`, `mpim:read`
    - `users:read`
    - `reactions:read`
    - `pins:read`
    - `emoji:read`
    - `search:read` (หากคุณพึ่งพาการอ่านจากการค้นหาของ Slack)

  </Accordion>
</AccordionGroup>

## โมเดลโทเค็น

- ต้องใช้ `botToken` + `appToken` สำหรับ Socket Mode
- โหมด HTTP ต้องใช้ `botToken` + `signingSecret`
- `botToken`, `appToken`, `signingSecret` และ `userToken` รองรับทั้งสตริง
  แบบ plaintext หรืออ็อบเจ็กต์ SecretRef
- โทเค็นที่กำหนดค่าไว้จะ override ค่า fallback จาก env
- ค่า fallback จาก env ของ `SLACK_BOT_TOKEN` / `SLACK_APP_TOKEN` ใช้ได้เฉพาะบัญชีค่าเริ่มต้นเท่านั้น
- `userToken` (`xoxp-...`) กำหนดค่าได้ผ่าน config เท่านั้น (ไม่มี env fallback) และค่าเริ่มต้นคือพฤติกรรมแบบอ่านอย่างเดียว (`userTokenReadOnly: true`)

พฤติกรรมของสถานะ snapshot:

- การตรวจสอบบัญชี Slack จะติดตามฟิลด์ `*Source` และ `*Status`
  แยกตามข้อมูลรับรอง (`botToken`, `appToken`, `signingSecret`, `userToken`)
- สถานะมีค่าเป็น `available`, `configured_unavailable` หรือ `missing`
- `configured_unavailable` หมายความว่าบัญชีถูกกำหนดค่าผ่าน SecretRef
  หรือแหล่งความลับแบบ non-inline อื่น แต่พาธคำสั่ง/รันไทม์ปัจจุบัน
  ไม่สามารถแก้ไขการอ้างอิงค่าจริงได้
- ในโหมด HTTP จะรวม `signingSecretStatus`; ใน Socket Mode คู่ที่ต้องใช้
  คือ `botTokenStatus` + `appTokenStatus`

<Tip>
สำหรับ actions/การอ่าน directory อาจเลือกใช้ user token ก่อนเมื่อมีการกำหนดค่าไว้ สำหรับการเขียน bot token ยังคงเป็นตัวเลือกแรก; การเขียนด้วย user token จะอนุญาตเฉพาะเมื่อ `userTokenReadOnly: false` และ bot token ไม่พร้อมใช้งาน
</Tip>

## การดำเนินการและเกต

การดำเนินการของ Slack ถูกควบคุมด้วย `channels.slack.actions.*`

กลุ่มการดำเนินการที่มีในเครื่องมือ Slack ปัจจุบัน:

| กลุ่ม      | ค่าเริ่มต้น |
| ---------- | ----------- |
| messages   | เปิดใช้งาน |
| reactions  | เปิดใช้งาน |
| pins       | เปิดใช้งาน |
| memberInfo | เปิดใช้งาน |
| emojiList  | เปิดใช้งาน |

การดำเนินการข้อความของ Slack ในปัจจุบันประกอบด้วย `send`, `upload-file`, `download-file`, `read`, `edit`, `delete`, `pin`, `unpin`, `list-pins`, `member-info` และ `emoji-list`

## การควบคุมการเข้าถึงและการกำหนดเส้นทาง

<Tabs>
  <Tab title="นโยบาย DM">
    `channels.slack.dmPolicy` ควบคุมการเข้าถึง DM (แบบเดิม: `channels.slack.dm.policy`):

    - `pairing` (ค่าเริ่มต้น)
    - `allowlist`
    - `open` (ต้องให้ `channels.slack.allowFrom` มี `"*"`; แบบเดิม: `channels.slack.dm.allowFrom`)
    - `disabled`

    แฟล็กของ DM:

    - `dm.enabled` (ค่าเริ่มต้น true)
    - `channels.slack.allowFrom` (แนะนำ)
    - `dm.allowFrom` (แบบเดิม)
    - `dm.groupEnabled` (ค่าเริ่มต้นของ group DM คือ false)
    - `dm.groupChannels` (allowlist ของ MPIM แบบเลือกได้)

    ลำดับความสำคัญของหลายบัญชี:

    - `channels.slack.accounts.default.allowFrom` ใช้กับบัญชี `default` เท่านั้น
    - บัญชีที่มีชื่อจะสืบทอด `channels.slack.allowFrom` เมื่อ `allowFrom` ของตนเองไม่ได้ตั้งค่าไว้
    - บัญชีที่มีชื่อจะไม่สืบทอด `channels.slack.accounts.default.allowFrom`

    การจับคู่ใน DM ใช้ `openclaw pairing approve slack <code>`

  </Tab>

  <Tab title="นโยบายช่องทาง">
    `channels.slack.groupPolicy` ควบคุมการจัดการช่องทาง:

    - `open`
    - `allowlist`
    - `disabled`

    allowlist ของช่องทางอยู่ภายใต้ `channels.slack.channels` และควรใช้รหัสช่องทางที่เสถียร

    หมายเหตุด้านรันไทม์: หากไม่มี `channels.slack` เลย (ตั้งค่าผ่าน env อย่างเดียว) รันไทม์จะ fallback เป็น `groupPolicy="allowlist"` และบันทึกคำเตือน (แม้จะมีการตั้งค่า `channels.defaults.groupPolicy`)

    การแก้ไขชื่อ/รหัส:

    - รายการใน allowlist ของช่องทางและ allowlist ของ DM จะถูกแก้ไขการอ้างอิงตอนเริ่มต้นเมื่อการเข้าถึงโทเค็นเอื้ออำนวย
    - รายการชื่อช่องทางที่แก้ไขการอ้างอิงไม่ได้จะยังคงเก็บไว้ตามที่กำหนดค่า แต่โดยค่าเริ่มต้นจะถูกละเลยในการกำหนดเส้นทาง
    - การอนุญาตขาเข้าและการกำหนดเส้นทางช่องทางจะใช้รหัสเป็นหลักโดยค่าเริ่มต้น; การจับคู่ชื่อผู้ใช้/slug โดยตรงต้องใช้ `channels.slack.dangerouslyAllowNameMatching: true`

  </Tab>

  <Tab title="การกล่าวถึงและผู้ใช้ในช่องทาง">
    ข้อความในช่องทางจะถูกเกตด้วยการกล่าวถึงโดยค่าเริ่มต้น

    แหล่งที่มาของการกล่าวถึง:

    - การกล่าวถึงแอปแบบชัดเจน (`<@botId>`)
    - รูปแบบ regex สำหรับการกล่าวถึง (`agents.list[].groupChat.mentionPatterns`, fallback ไปที่ `messages.groupChat.mentionPatterns`)
    - พฤติกรรม implicit reply-to-bot ในเธรด (ปิดใช้งานเมื่อ `thread.requireExplicitMention` เป็น `true`)

    ตัวควบคุมรายช่องทาง (`channels.slack.channels.<id>`; ใช้ชื่อได้ผ่านการแก้ไขการอ้างอิงตอนเริ่มต้นหรือ `dangerouslyAllowNameMatching` เท่านั้น):

    - `requireMention`
    - `users` (allowlist)
    - `allowBots`
    - `skills`
    - `systemPrompt`
    - `tools`, `toolsBySender`
    - รูปแบบคีย์ `toolsBySender`: `id:`, `e164:`, `username:`, `name:` หรือ wildcard `"*"`
      (คีย์แบบเดิมที่ไม่มีคำนำหน้ายังคงแมปไปยัง `id:` เท่านั้น)

  </Tab>
</Tabs>

## การทำเธรด เซสชัน และแท็กการตอบกลับ

- DM กำหนดเส้นทางเป็น `direct`; ช่องทางเป็น `channel`; MPIM เป็น `group`
- ด้วยค่าเริ่มต้น `session.dmScope=main`, DM ของ Slack จะถูกรวมเข้ากับเซสชันหลักของเอเจนต์
- เซสชันของช่องทาง: `agent:<agentId>:slack:channel:<channelId>`
- การตอบกลับในเธรดสามารถสร้าง suffix เซสชันเธรด (`:thread:<threadTs>`) ได้เมื่อเกี่ยวข้อง
- ค่าเริ่มต้นของ `channels.slack.thread.historyScope` คือ `thread`; ค่าเริ่มต้นของ `thread.inheritParent` คือ `false`
- `channels.slack.thread.initialHistoryLimit` ควบคุมจำนวนข้อความเดิมในเธรดที่จะถูกดึงมาเมื่อเริ่มเซสชันเธรดใหม่ (ค่าเริ่มต้น `20`; ตั้งเป็น `0` เพื่อปิดใช้งาน)
- `channels.slack.thread.requireExplicitMention` (ค่าเริ่มต้น `false`): เมื่อเป็น `true` จะปิดการกล่าวถึงเธรดแบบ implicit เพื่อให้บอตตอบกลับเฉพาะการกล่าวถึง `@bot` แบบชัดเจนภายในเธรดเท่านั้น แม้ว่าบอตจะเคยเข้าร่วมในเธรดนั้นแล้วก็ตาม หากไม่เปิดค่านี้ การตอบกลับในเธรดที่บอตเข้าร่วมอยู่จะข้ามเกต `requireMention`

ตัวควบคุมการตอบกลับแบบเธรด:

- `channels.slack.replyToMode`: `off|first|all|batched` (ค่าเริ่มต้น `off`)
- `channels.slack.replyToModeByChatType`: แยกตาม `direct|group|channel`
- fallback แบบเดิมสำหรับแชต direct: `channels.slack.dm.replyToMode`

รองรับแท็กการตอบกลับแบบกำหนดเอง:

- `[[reply_to_current]]`
- `[[reply_to:<id>]]`

หมายเหตุ: `replyToMode="off"` จะปิด **การตอบกลับแบบเธรดทั้งหมด** ใน Slack รวมถึงแท็ก `[[reply_to_*]]` แบบชัดเจนด้วย ซึ่งต่างจาก Telegram ที่แท็กแบบชัดเจนยังคงได้รับการรองรับในโหมด `"off"` ความแตกต่างนี้สะท้อนโมเดลการทำเธรดของแต่ละแพลตฟอร์ม: เธรดของ Slack จะซ่อนข้อความออกจากช่องทาง ส่วนการตอบกลับของ Telegram ยังคงมองเห็นได้ในโฟลว์แชตหลัก

## รีแอ็กชันตอบรับ

`ackReaction` จะส่งอีโมจิตอบรับในขณะที่ OpenClaw กำลังประมวลผลข้อความขาเข้า

ลำดับการแก้ไขการอ้างอิง:

- `channels.slack.accounts.<accountId>.ackReaction`
- `channels.slack.ackReaction`
- `messages.ackReaction`
- fallback เป็นอีโมจิตัวตนของเอเจนต์ (`agents.list[].identity.emoji`, หากไม่มีจะใช้ "👀")

หมายเหตุ:

- Slack คาดหวัง shortcodes (เช่น `"eyes"`)
- ใช้ `""` เพื่อปิดใช้งานรีแอ็กชันสำหรับบัญชี Slack หรือทั้งระบบ

## การสตรีมข้อความ

`channels.slack.streaming` ควบคุมพฤติกรรมการแสดงตัวอย่างแบบสด:

- `off`: ปิดใช้งานการสตรีมแสดงตัวอย่างแบบสด
- `partial` (ค่าเริ่มต้น): แทนที่ข้อความแสดงตัวอย่างด้วยเอาต์พุตบางส่วนล่าสุด
- `block`: ต่อท้ายการอัปเดตแสดงตัวอย่างแบบแบ่งเป็นช่วง
- `progress`: แสดงข้อความสถานะความคืบหน้าระหว่างกำลังสร้าง แล้วจึงส่งข้อความสุดท้าย
- `streaming.preview.toolProgress`: เมื่อเปิดใช้งาน draft preview ให้กำหนดเส้นทางการอัปเดต tool/progress ไปยังข้อความแสดงตัวอย่างที่ถูกแก้ไขเดียวกัน (ค่าเริ่มต้น: `true`) ตั้งค่าเป็น `false` เพื่อคงข้อความ tool/progress แยกต่างหาก

`channels.slack.streaming.nativeTransport` ควบคุมการสตรีมข้อความแบบ native ของ Slack เมื่อ `channels.slack.streaming.mode` เป็น `partial` (ค่าเริ่มต้น: `true`)

- ต้องมีเธรดการตอบกลับจึงจะใช้การสตรีมข้อความแบบ native และให้สถานะเธรดผู้ช่วยของ Slack ปรากฏได้ การเลือกเธรดยังคงเป็นไปตาม `replyToMode`
- รากของแชตช่องทางและแชตกลุ่มยังสามารถใช้ draft preview ปกติได้เมื่อไม่มีการสตรีมแบบ native
- DM ของ Slack ระดับบนสุดจะยังคงอยู่นอกเธรดโดยค่าเริ่มต้น จึงไม่แสดงตัวอย่างแบบเธรด; ใช้การตอบกลับในเธรดหรือ `typingReaction` หากต้องการให้เห็นความคืบหน้าในกรณีนั้น
- สื่อและ payload ที่ไม่ใช่ข้อความจะ fallback ไปใช้การส่งแบบปกติ
- final ประเภทสื่อ/ข้อผิดพลาดจะยกเลิกการแก้ไขตัวอย่างที่ค้างอยู่โดยไม่ flush draft ชั่วคราว; final แบบข้อความ/บล็อกที่เข้าเกณฑ์จะ flush เฉพาะเมื่อสามารถแก้ไขตัวอย่างเดิมในตำแหน่งเดิมได้
- หากการสตรีมล้มเหลวระหว่างตอบกลับ OpenClaw จะ fallback ไปใช้การส่งแบบปกติสำหรับ payload ที่เหลือ

ใช้ draft preview แทนการสตรีมข้อความแบบ native ของ Slack:

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

- `channels.slack.streamMode` (`replace | status_final | append`) จะถูกย้ายไปยัง `channels.slack.streaming.mode` อัตโนมัติ
- ค่า boolean `channels.slack.streaming` จะถูกย้ายไปยัง `channels.slack.streaming.mode` และ `channels.slack.streaming.nativeTransport` อัตโนมัติ
- `channels.slack.nativeStreaming` แบบเดิมจะถูกย้ายไปยัง `channels.slack.streaming.nativeTransport` อัตโนมัติ

## fallback ของรีแอ็กชันการพิมพ์

`typingReaction` จะเพิ่มรีแอ็กชันชั่วคราวให้กับข้อความ Slack ขาเข้าในขณะที่ OpenClaw กำลังประมวลผลคำตอบ แล้วลบออกเมื่อการรันเสร็จสิ้น ซึ่งมีประโยชน์มากที่สุดนอกการตอบกลับในเธรด เพราะเธรดจะใช้ตัวบ่งชี้สถานะ "is typing..." เป็นค่าเริ่มต้น

ลำดับการแก้ไขการอ้างอิง:

- `channels.slack.accounts.<accountId>.typingReaction`
- `channels.slack.typingReaction`

หมายเหตุ:

- Slack คาดหวัง shortcodes (เช่น `"hourglass_flowing_sand"`)
- รีแอ็กชันนี้เป็นแบบ best-effort และระบบจะพยายามล้างออกโดยอัตโนมัติหลังการตอบกลับหรือเมื่อเส้นทางข้อผิดพลาดเสร็จสิ้น

## สื่อ การแบ่งช่วง และการส่ง

<AccordionGroup>
  <Accordion title="ไฟล์แนบขาเข้า">
    ไฟล์แนบจาก Slack จะถูกดาวน์โหลดจาก URL แบบ private ที่โฮสต์โดย Slack (โฟลว์คำขอที่ยืนยันตัวตนด้วยโทเค็น) และเขียนลงใน media store เมื่อดึงสำเร็จและอยู่ภายในขีดจำกัดขนาด

    เพดานขนาดขาเข้าขณะรันไทม์มีค่าเริ่มต้นเป็น `20MB` เว้นแต่จะ override ด้วย `channels.slack.mediaMaxMb`

  </Accordion>

  <Accordion title="ข้อความและไฟล์ขาออก">
    - ข้อความจะแบ่งเป็นช่วงตาม `channels.slack.textChunkLimit` (ค่าเริ่มต้น 4000)
    - `channels.slack.chunkMode="newline"` จะเปิดใช้การแบ่งตามย่อหน้าก่อน
    - การส่งไฟล์จะใช้ Slack upload API และสามารถรวมการตอบกลับในเธรด (`thread_ts`) ได้
    - เพดานสื่อขาออกจะเป็นไปตาม `channels.slack.mediaMaxMb` เมื่อมีการกำหนดค่าไว้; หากไม่มี การส่งผ่านช่องทางจะใช้ค่าเริ่มต้นตามชนิด MIME จาก media pipeline
  </Accordion>

  <Accordion title="เป้าหมายการส่ง">
    เป้าหมายแบบชัดเจนที่ควรใช้:

    - `user:<id>` สำหรับ DM
    - `channel:<id>` สำหรับช่องทาง

    DM ของ Slack จะถูกเปิดผ่าน Slack conversation API เมื่อส่งไปยังเป้าหมายผู้ใช้

  </Accordion>
</AccordionGroup>

## คำสั่งและพฤติกรรมของ slash

คำสั่ง slash จะแสดงใน Slack ได้ทั้งเป็นคำสั่งเดียวที่กำหนดค่าไว้หรือเป็นคำสั่ง native หลายคำสั่ง กำหนดค่า `channels.slack.slashCommand` เพื่อเปลี่ยนค่าเริ่มต้นของคำสั่ง:

- `enabled: false`
- `name: "openclaw"`
- `sessionPrefix: "slack:slash"`
- `ephemeral: true`

```txt
/openclaw /help
```

คำสั่ง native ต้องใช้ [การตั้งค่า manifest เพิ่มเติม](#additional-manifest-settings) ในแอป Slack ของคุณ และเปิดใช้ด้วย `channels.slack.commands.native: true` หรือ `commands.native: true` ในการกำหนดค่าส่วนกลางแทน

- โหมดอัตโนมัติของคำสั่ง native เป็น **ปิด** สำหรับ Slack ดังนั้น `commands.native: "auto"` จะไม่เปิดใช้คำสั่ง native ของ Slack

```txt
/help
```

เมนูอาร์กิวเมนต์ native ใช้กลยุทธ์การเรนเดอร์แบบปรับตัวที่แสดง modal ยืนยันก่อนส่งค่าตัวเลือกที่เลือก:

- สูงสุด 5 ตัวเลือก: บล็อกปุ่ม
- 6-100 ตัวเลือก: เมนูเลือกแบบคงที่
- มากกว่า 100 ตัวเลือก: external select พร้อมการกรองตัวเลือกแบบ async เมื่อมีตัวจัดการตัวเลือก interactivity
- เกินขีดจำกัดของ Slack: ค่าตัวเลือกที่เข้ารหัสจะ fallback ไปเป็นปุ่ม

```txt
/think
```

เซสชัน slash ใช้คีย์แบบแยก เช่น `agent:<agentId>:slack:slash:<userId>` และยังคงกำหนดเส้นทางการเรียกใช้คำสั่งไปยังเซสชันบทสนทนาเป้าหมายโดยใช้ `CommandTargetSessionKey`

## การตอบกลับแบบโต้ตอบ

Slack สามารถเรนเดอร์ตัวควบคุมการตอบกลับแบบโต้ตอบที่เอเจนต์สร้างขึ้นได้ แต่ความสามารถนี้ปิดใช้งานไว้โดยค่าเริ่มต้น

เปิดใช้ทั้งระบบ:

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

หรือเปิดใช้เฉพาะหนึ่งบัญชี Slack:

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

เมื่อเปิดใช้ เอเจนต์สามารถส่ง directive การตอบกลับเฉพาะของ Slack ได้:

- `[[slack_buttons: Approve:approve, Reject:reject]]`
- `[[slack_select: Choose a target | Canary:canary, Production:production]]`

directive เหล่านี้จะถูกคอมไพล์เป็น Slack Block Kit และกำหนดเส้นทางการคลิกหรือการเลือกกลับผ่านพาธเหตุการณ์ interaction ของ Slack ที่มีอยู่

หมายเหตุ:

- นี่คือ UI เฉพาะของ Slack ช่องทางอื่นจะไม่แปล directive ของ Slack Block Kit ไปเป็นระบบปุ่มของตนเอง
- ค่า callback แบบโต้ตอบเป็น opaque token ที่ OpenClaw สร้างขึ้น ไม่ใช่ค่าดิบที่เอเจนต์เขียนเอง
- หากบล็อกโต้ตอบที่สร้างขึ้นเกินขีดจำกัดของ Slack Block Kit, OpenClaw จะ fallback กลับไปใช้ข้อความตอบกลับเดิมแทนการส่ง payload blocks ที่ไม่ถูกต้อง

## การอนุมัติ exec ใน Slack

Slack สามารถทำหน้าที่เป็นไคลเอนต์การอนุมัติแบบ native ได้ด้วยปุ่มโต้ตอบและ interaction แทนการ fallback ไปยัง Web UI หรือเทอร์มินัล

- การอนุมัติ exec ใช้ `channels.slack.execApprovals.*` สำหรับการกำหนดเส้นทาง DM/ช่องทางแบบ native
- การอนุมัติ Plugin ยังสามารถแก้ไขการอ้างอิงผ่านพื้นผิวปุ่มแบบ native ของ Slack เดียวกันได้เมื่อคำขอมาถึงใน Slack อยู่แล้วและชนิด approval id เป็น `plugin:`
- ยังคงบังคับใช้การอนุญาตของผู้อนุมัติ: เฉพาะผู้ใช้ที่ระบุว่าเป็นผู้อนุมัติเท่านั้นที่สามารถอนุมัติหรือปฏิเสธคำขอผ่าน Slack ได้

สิ่งนี้ใช้พื้นผิวปุ่มอนุมัติที่ใช้ร่วมกันแบบเดียวกับช่องทางอื่น เมื่อเปิดใช้ `interactivity` ในการตั้งค่าแอป Slack ของคุณ พรอมป์การอนุมัติจะแสดงเป็นปุ่ม Block Kit โดยตรงในบทสนทนา
เมื่อมีปุ่มเหล่านั้นอยู่ ปุ่มจะเป็น UX การอนุมัติหลัก; OpenClaw
ควรรวมคำสั่ง `/approve` แบบแมนนวลเฉพาะเมื่อผลลัพธ์ของเครื่องมือระบุว่า
การอนุมัติผ่านแชตไม่พร้อมใช้งาน หรือการอนุมัติแบบแมนนวลเป็นทางเลือกเดียว

พาธการกำหนดค่า:

- `channels.slack.execApprovals.enabled`
- `channels.slack.execApprovals.approvers` (ไม่บังคับ; fallback ไปที่ `commands.ownerAllowFrom` เมื่อเป็นไปได้)
- `channels.slack.execApprovals.target` (`dm` | `channel` | `both`, ค่าเริ่มต้น: `dm`)
- `agentFilter`, `sessionFilter`

Slack จะเปิดใช้การอนุมัติ exec แบบ native อัตโนมัติเมื่อไม่ได้ตั้งค่า `enabled` หรือเป็น `"auto"` และสามารถแก้ไขการอ้างอิงผู้อนุมัติได้อย่างน้อยหนึ่งราย ตั้งค่า `enabled: false` เพื่อปิดการใช้ Slack เป็นไคลเอนต์การอนุมัติแบบ native อย่างชัดเจน
ตั้งค่า `enabled: true` เพื่อบังคับเปิดการอนุมัติแบบ native เมื่อแก้ไขการอ้างอิงผู้อนุมัติได้

พฤติกรรมเริ่มต้นเมื่อไม่มีการกำหนดค่าการอนุมัติ exec ของ Slack แบบชัดเจน:

```json5
{
  commands: {
    ownerAllowFrom: ["slack:U12345678"],
  },
}
```

จำเป็นต้องใช้การกำหนดค่า native ของ Slack แบบชัดเจนเมื่อคุณต้องการ override ผู้อนุมัติ เพิ่มตัวกรอง หรือ
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

การส่งต่อ `approvals.exec` แบบใช้ร่วมกันเป็นอีกส่วนหนึ่ง ใช้เฉพาะเมื่อพรอมป์การอนุมัติ exec ต้องกำหนดเส้นทาง
ไปยังแชตอื่นหรือเป้าหมายนอกแบนด์แบบชัดเจนด้วย การส่งต่อ `approvals.plugin` แบบใช้ร่วมกันก็แยกต่างหาก
ปุ่มแบบ native ของ Slack ยังสามารถแก้ไขการอ้างอิงการอนุมัติ Plugin ได้เมื่อคำขอเหล่านั้นมาถึง
ใน Slack อยู่แล้ว

`/approve` ในแชตเดียวกันยังใช้ได้ในช่องทางและ DM ของ Slack ที่รองรับคำสั่งอยู่แล้ว ดู [Exec approvals](/th/tools/exec-approvals) สำหรับโมเดลการส่งต่อการอนุมัติทั้งหมด

## เหตุการณ์และพฤติกรรมการปฏิบัติการ

- การแก้ไข/ลบข้อความ/การกระจายข้อความเธรดจะถูกแมปเป็นเหตุการณ์ระบบ
- เหตุการณ์เพิ่ม/ลบรีแอ็กชันจะถูกแมปเป็นเหตุการณ์ระบบ
- เหตุการณ์สมาชิกเข้า/ออก การสร้าง/เปลี่ยนชื่อช่องทาง และการเพิ่ม/ลบ pin จะถูกแมปเป็นเหตุการณ์ระบบ
- `channel_id_changed` สามารถย้ายคีย์การกำหนดค่าช่องทางได้เมื่อเปิดใช้ `configWrites`
- metadata ของหัวข้อ/วัตถุประสงค์ของช่องทางถือเป็นบริบทที่ไม่น่าเชื่อถือและอาจถูกแทรกเข้าสู่บริบทการกำหนดเส้นทาง
- ข้อความเริ่มต้นเธรดและการเติมบริบทจากประวัติเธรดเริ่มต้นจะถูกกรองตาม allowlist ของผู้ส่งที่กำหนดไว้เมื่อเกี่ยวข้อง
- block action และ modal interaction จะส่งเหตุการณ์ระบบแบบมีโครงสร้าง `Slack interaction: ...` พร้อมฟิลด์ payload ที่สมบูรณ์:
  - block action: ค่าที่เลือก ป้ายชื่อ ค่าจาก picker และ metadata แบบ `workflow_*`
  - เหตุการณ์ modal `view_submission` และ `view_closed` พร้อม metadata ช่องทางที่กำหนดเส้นทางแล้วและอินพุตฟอร์ม

## ตัวชี้เอกสารอ้างอิงการกำหนดค่า

เอกสารอ้างอิงหลัก:

- [Configuration reference - Slack](/th/gateway/configuration-reference#slack)

  ฟิลด์ Slack ที่มีสัญญาณสูง:
  - mode/auth: `mode`, `botToken`, `appToken`, `signingSecret`, `webhookPath`, `accounts.*`
  - การเข้าถึง DM: `dm.enabled`, `dmPolicy`, `allowFrom` (แบบเดิม: `dm.policy`, `dm.allowFrom`), `dm.groupEnabled`, `dm.groupChannels`
  - สวิตช์ความเข้ากันได้: `dangerouslyAllowNameMatching` (ใช้ในกรณีฉุกเฉิน; ควรปิดไว้หากไม่จำเป็น)
  - การเข้าถึงช่องทาง: `groupPolicy`, `channels.*`, `channels.*.users`, `channels.*.requireMention`
  - การทำเธรด/ประวัติ: `replyToMode`, `replyToModeByChatType`, `thread.*`, `historyLimit`, `dmHistoryLimit`, `dms.*.historyLimit`
  - การส่ง: `textChunkLimit`, `chunkMode`, `mediaMaxMb`, `streaming`, `streaming.nativeTransport`, `streaming.preview.toolProgress`
  - การปฏิบัติการ/ความสามารถ: `configWrites`, `commands.native`, `slashCommand.*`, `actions.*`, `userToken`, `userTokenReadOnly`

## การแก้ไขปัญหา

<AccordionGroup>
  <Accordion title="ไม่มีการตอบกลับในช่องทาง">
    ตรวจสอบตามลำดับ:

    - `groupPolicy`
    - allowlist ของช่องทาง (`channels.slack.channels`)
    - `requireMention`
    - allowlist `users` รายช่องทาง

    คำสั่งที่มีประโยชน์:

```bash
openclaw channels status --probe
openclaw logs --follow
openclaw doctor
```

  </Accordion>

  <Accordion title="ข้อความ DM ถูกละเลย">
    ตรวจสอบ:

    - `channels.slack.dm.enabled`
    - `channels.slack.dmPolicy` (หรือแบบเดิม `channels.slack.dm.policy`)
    - การอนุมัติการจับคู่ / รายการใน allowlist

```bash
openclaw pairing list slack
```

  </Accordion>

  <Accordion title="Socket mode ไม่เชื่อมต่อ">
    ตรวจสอบ bot token + app token และการเปิดใช้ Socket Mode ในการตั้งค่าแอป Slack

    หาก `openclaw channels status --probe --json` แสดง `botTokenStatus` หรือ
    `appTokenStatus: "configured_unavailable"` แสดงว่าบัญชี Slack
    ถูกกำหนดค่าไว้แล้ว แต่รันไทม์ปัจจุบันไม่สามารถแก้ไขการอ้างอิงค่าที่รองรับด้วย SecretRef ได้

  </Accordion>

  <Accordion title="โหมด HTTP ไม่ได้รับเหตุการณ์">
    ตรวจสอบ:

    - signing secret
    - webhook path
    - URL คำขอของ Slack (Events + Interactivity + Slash Commands)
    - `webhookPath` ที่ไม่ซ้ำกันสำหรับแต่ละบัญชี HTTP

    หาก `signingSecretStatus: "configured_unavailable"` ปรากฏใน snapshot
    ของบัญชี แสดงว่าบัญชี HTTP ถูกกำหนดค่าไว้แล้ว แต่รันไทม์ปัจจุบันไม่สามารถ
    แก้ไขการอ้างอิง signing secret ที่รองรับด้วย SecretRef ได้

  </Accordion>

  <Accordion title="คำสั่ง native/slash ไม่ทำงาน">
    ตรวจสอบว่าคุณตั้งใจใช้:

    - โหมดคำสั่ง native (`channels.slack.commands.native: true`) พร้อมคำสั่ง slash ที่ลงทะเบียนไว้ใน Slack ให้ตรงกัน
    - หรือโหมดคำสั่ง slash เดี่ยว (`channels.slack.slashCommand.enabled: true`)

    ตรวจสอบ `commands.useAccessGroups` และ allowlist ของช่องทาง/ผู้ใช้ด้วย

  </Accordion>
</AccordionGroup>

## ที่เกี่ยวข้อง

- [Pairing](/th/channels/pairing)
- [Groups](/th/channels/groups)
- [Security](/th/gateway/security)
- [Channel routing](/th/channels/channel-routing)
- [Troubleshooting](/th/channels/troubleshooting)
- [Configuration](/th/gateway/configuration)
- [Slash commands](/th/tools/slash-commands)
