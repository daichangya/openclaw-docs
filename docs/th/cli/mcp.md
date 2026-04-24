---
read_when:
    - การเชื่อมต่อ Codex, Claude Code หรือไคลเอนต์ MCP อื่นเข้ากับช่องทางที่ขับเคลื่อนโดย OpenClaw
    - การรัน `openclaw mcp serve`
    - การจัดการนิยามเซิร์ฟเวอร์ MCP ที่ OpenClaw บันทึกไว้
summary: เปิดเผยบทสนทนาในช่องทางของ OpenClaw ผ่าน MCP และจัดการนิยามเซิร์ฟเวอร์ MCP ที่บันทึกไว้
title: MCP
x-i18n:
    generated_at: "2026-04-24T09:03:08Z"
    model: gpt-5.4
    provider: openai
    source_hash: b9df42ebc547f07698f84888d8cd6125340d0f0e02974a965670844589e1fbf8
    source_path: cli/mcp.md
    workflow: 15
---

`openclaw mcp` มี 2 หน้าที่:

- รัน OpenClaw เป็นเซิร์ฟเวอร์ MCP ด้วย `openclaw mcp serve`
- จัดการนิยามเซิร์ฟเวอร์ MCP ขาออกที่ OpenClaw เป็นเจ้าของด้วย `list`, `show`,
  `set` และ `unset`

กล่าวอีกแบบคือ:

- `serve` คือ OpenClaw ทำหน้าที่เป็นเซิร์ฟเวอร์ MCP
- `list` / `show` / `set` / `unset` คือ OpenClaw ทำหน้าที่เป็นรีจิสทรีฝั่งไคลเอนต์ MCP
  สำหรับเซิร์ฟเวอร์ MCP อื่นที่รันไทม์ของมันอาจนำไปใช้ภายหลัง

ใช้ [`openclaw acp`](/th/cli/acp) เมื่อ OpenClaw ควรโฮสต์เซสชัน coding harness
ด้วยตัวเองและกำหนดเส้นทางรันไทม์นั้นผ่าน ACP

## OpenClaw ในฐานะเซิร์ฟเวอร์ MCP

นี่คือเส้นทาง `openclaw mcp serve`

## เมื่อใดควรใช้ `serve`

ใช้ `openclaw mcp serve` เมื่อ:

- Codex, Claude Code หรือไคลเอนต์ MCP อื่นควรคุยโดยตรงกับ
  บทสนทนาในช่องทางที่ขับเคลื่อนโดย OpenClaw
- คุณมี OpenClaw Gateway แบบโลคัลหรือระยะไกลที่มี routed sessions อยู่แล้ว
- คุณต้องการ MCP server ตัวเดียวที่ทำงานข้าม backends ของช่องทาง OpenClaw
  แทนการรัน bridges แยกตามช่องทาง

ให้ใช้ [`openclaw acp`](/th/cli/acp) แทนเมื่อ OpenClaw ควรโฮสต์ coding
runtime ด้วยตัวเองและเก็บ agent session ไว้ภายใน OpenClaw

## วิธีการทำงาน

`openclaw mcp serve` จะเริ่ม stdio MCP server ไคลเอนต์ MCP เป็นเจ้าของ
process นั้น ขณะที่ไคลเอนต์ยังคงเปิด stdio session อยู่ bridge จะเชื่อมต่อไปยัง
OpenClaw Gateway แบบโลคัลหรือระยะไกลผ่าน WebSocket และเปิดเผยบทสนทนาในช่องทางที่กำหนดเส้นทางแล้ว
ผ่าน MCP

วงจรชีวิต:

1. ไคลเอนต์ MCP สร้าง process `openclaw mcp serve`
2. bridge เชื่อมต่อไปยัง Gateway
3. routed sessions กลายเป็นบทสนทนา MCP และเครื่องมือ transcript/history
4. live events จะถูกเข้าคิวในหน่วยความจำขณะที่ bridge เชื่อมต่ออยู่
5. หากเปิดใช้โหมด Claude channel เซสชันเดียวกันนี้จะสามารถรับ
   Claude-specific push notifications ได้ด้วย

ลักษณะการทำงานสำคัญ:

- สถานะคิวแบบสดเริ่มต้นเมื่อ bridge เชื่อมต่อ
- ประวัติ transcript เก่าจะอ่านด้วย `messages_read`
- Claude push notifications จะมีอยู่เฉพาะขณะที่ MCP session ยังมีชีวิต
- เมื่อไคลเอนต์ตัดการเชื่อมต่อ bridge จะออกและคิวแบบสดจะหายไป
- stdio MCP servers ที่ OpenClaw เริ่มขึ้น (ทั้งที่มาพร้อมระบบหรือผู้ใช้กำหนดเอง) จะถูก
  ปิดลงทั้ง process tree ตอน shutdown ดังนั้น child subprocesses ที่เซิร์ฟเวอร์เริ่มขึ้น
  จะไม่อยู่รอดหลังจากไคลเอนต์ stdio หลักออกไป
- การลบหรือรีเซ็ต session จะ dispose ไคลเอนต์ MCP ของ session นั้นผ่าน
  เส้นทาง cleanup ของรันไทม์ที่ใช้ร่วมกัน ดังนั้นจะไม่มีการเชื่อมต่อ stdio ค้างอยู่
  ที่ผูกกับ session ที่ถูกลบออกแล้ว

## เลือกโหมดไคลเอนต์

ใช้ bridge เดียวกันนี้ได้ 2 วิธี:

- ไคลเอนต์ MCP ทั่วไป: ใช้เฉพาะเครื่องมือ MCP มาตรฐาน ใช้ `conversations_list`,
  `messages_read`, `events_poll`, `events_wait`, `messages_send` และ
  เครื่องมือ approvals
- Claude Code: ใช้เครื่องมือ MCP มาตรฐานร่วมกับ Claude-specific channel adapter
  เปิดใช้ `--claude-channel-mode on` หรือปล่อยค่าเริ่มต้น `auto`

ปัจจุบัน `auto` มีลักษณะการทำงานเหมือน `on` ยังไม่มีการตรวจจับความสามารถของไคลเอนต์
ในตอนนี้

## สิ่งที่ `serve` เปิดเผย

bridge ใช้ข้อมูล route metadata ของ Gateway session ที่มีอยู่แล้วเพื่อเปิดเผย
บทสนทนาที่อิงกับช่องทาง บทสนทนาหนึ่งรายการจะปรากฏเมื่อ OpenClaw มีสถานะ session อยู่แล้ว
พร้อม route ที่รู้จัก เช่น:

- `channel`
- recipient หรือ destination metadata
- `accountId` แบบไม่บังคับ
- `threadId` แบบไม่บังคับ

สิ่งนี้ทำให้ไคลเอนต์ MCP มีจุดเดียวสำหรับ:

- แสดงรายการบทสนทนาที่ถูกกำหนดเส้นทางล่าสุด
- อ่านประวัติ transcript ล่าสุด
- รอ live inbound events ใหม่
- ส่งคำตอบกลับผ่าน route เดิม
- ดูคำขอการอนุมัติที่เข้ามาขณะ bridge เชื่อมต่ออยู่

## การใช้งาน

```bash
# Local Gateway
openclaw mcp serve

# Remote Gateway
openclaw mcp serve --url wss://gateway-host:18789 --token-file ~/.openclaw/gateway.token

# Remote Gateway with password auth
openclaw mcp serve --url wss://gateway-host:18789 --password-file ~/.openclaw/gateway.password

# Enable verbose bridge logs
openclaw mcp serve --verbose

# Disable Claude-specific push notifications
openclaw mcp serve --claude-channel-mode off
```

## เครื่องมือของ bridge

ปัจจุบัน bridge เปิดเผยเครื่องมือ MCP เหล่านี้:

- `conversations_list`
- `conversation_get`
- `messages_read`
- `attachments_fetch`
- `events_poll`
- `events_wait`
- `messages_send`
- `permissions_list_open`
- `permissions_respond`

### `conversations_list`

แสดงรายการบทสนทนาล่าสุดที่อิงกับ session และมี route metadata อยู่แล้วใน
สถานะ session ของ Gateway

ตัวกรองที่มีประโยชน์:

- `limit`
- `search`
- `channel`
- `includeDerivedTitles`
- `includeLastMessage`

### `conversation_get`

คืนค่าบทสนทนาหนึ่งรายการตาม `session_key`

### `messages_read`

อ่านข้อความ transcript ล่าสุดสำหรับบทสนทนาหนึ่งรายการที่อิงกับ session

### `attachments_fetch`

ดึง content blocks ที่ไม่ใช่ข้อความออกจากข้อความ transcript หนึ่งรายการ นี่เป็น
มุมมองแบบ metadata เหนือเนื้อหา transcript ไม่ใช่ attachment blob store แบบคงทน
ที่แยกต่างหาก

### `events_poll`

อ่านข้อความ live events ที่เข้าคิวไว้ตั้งแต่ cursor เชิงตัวเลขตัวหนึ่ง

### `events_wait`

ทำ long-poll จนกว่า queued event รายการถัดไปที่ตรงเงื่อนไขจะมาถึง หรือจนกว่า timeout จะหมด

ใช้สิ่งนี้เมื่อไคลเอนต์ MCP ทั่วไปต้องการการส่งมอบแบบเกือบเรียลไทม์โดยไม่ใช้
Claude-specific push protocol

### `messages_send`

ส่งข้อความกลับผ่าน route เดิมที่บันทึกไว้แล้วบน session

ลักษณะการทำงานปัจจุบัน:

- ต้องมี conversation route ที่มีอยู่แล้ว
- ใช้ channel, recipient, account id และ thread id ของ session
- ส่งได้เฉพาะข้อความ

### `permissions_list_open`

แสดงรายการคำขอการอนุมัติ exec/plugin ที่ยังค้างอยู่ซึ่ง bridge สังเกตพบตั้งแต่
มันเชื่อมต่อกับ Gateway

### `permissions_respond`

resolve คำขอการอนุมัติ exec/plugin ที่ยังค้างอยู่หนึ่งรายการด้วย:

- `allow-once`
- `allow-always`
- `deny`

## โมเดลของ event

bridge จะเก็บ event queue ไว้ในหน่วยความจำขณะที่มันเชื่อมต่ออยู่

ชนิด event ปัจจุบัน:

- `message`
- `exec_approval_requested`
- `exec_approval_resolved`
- `plugin_approval_requested`
- `plugin_approval_resolved`
- `claude_permission_request`

ข้อจำกัดสำคัญ:

- คิวเป็นแบบ live-only; มันเริ่มเมื่อ MCP bridge เริ่มทำงาน
- `events_poll` และ `events_wait` จะไม่ replay ประวัติ Gateway ที่เก่ากว่า
  ด้วยตัวเอง
- backlog แบบคงทนควรอ่านด้วย `messages_read`

## Claude channel notifications

bridge ยังสามารถเปิดเผย Claude-specific channel notifications ได้ด้วย นี่คือ
สิ่งเทียบเท่า channel adapter ของ Claude Code ใน OpenClaw: เครื่องมือ MCP มาตรฐานยังคงใช้ได้
แต่ข้อความขาเข้าแบบสดยังสามารถมาถึงเป็น Claude-specific MCP notifications ได้เช่นกัน

แฟลก:

- `--claude-channel-mode off`: ใช้เฉพาะเครื่องมือ MCP มาตรฐาน
- `--claude-channel-mode on`: เปิดใช้ Claude channel notifications
- `--claude-channel-mode auto`: ค่าเริ่มต้นปัจจุบัน; ลักษณะการทำงานของ bridge เหมือน `on`

เมื่อเปิดใช้ Claude channel mode เซิร์ฟเวอร์จะประกาศ Claude experimental
capabilities และสามารถส่ง:

- `notifications/claude/channel`
- `notifications/claude/channel/permission`

ลักษณะการทำงานของ bridge ปัจจุบัน:

- ข้อความ transcript ขาเข้าแบบ `user` จะถูกส่งต่อเป็น
  `notifications/claude/channel`
- คำขอ Claude permission ที่ได้รับผ่าน MCP จะถูกติดตามในหน่วยความจำ
- หากบทสนทนาที่ลิงก์ไว้ส่ง `yes abcde` หรือ `no abcde` ในภายหลัง bridge
  จะเปลี่ยนสิ่งนั้นเป็น `notifications/claude/channel/permission`
- notifications เหล่านี้เป็นแบบ live-session only; หากไคลเอนต์ MCP ตัดการเชื่อมต่อ
  จะไม่มี push target

สิ่งนี้ตั้งใจให้เป็นแบบเฉพาะไคลเอนต์ ไคลเอนต์ MCP ทั่วไปควรพึ่งพา
เครื่องมือ polling มาตรฐาน

## การกำหนดค่าไคลเอนต์ MCP

ตัวอย่างการกำหนดค่าไคลเอนต์แบบ stdio:

```json
{
  "mcpServers": {
    "openclaw": {
      "command": "openclaw",
      "args": [
        "mcp",
        "serve",
        "--url",
        "wss://gateway-host:18789",
        "--token-file",
        "/path/to/gateway.token"
      ]
    }
  }
}
```

สำหรับไคลเอนต์ MCP ทั่วไปส่วนใหญ่ ให้เริ่มด้วยชุดเครื่องมือมาตรฐานและไม่ต้องสนใจ
Claude mode เปิด Claude mode เฉพาะสำหรับไคลเอนต์ที่เข้าใจ
เมธอดการแจ้งเตือนแบบ Claude-specific จริง ๆ เท่านั้น

## ตัวเลือก

`openclaw mcp serve` รองรับ:

- `--url <url>`: URL WebSocket ของ Gateway
- `--token <token>`: token ของ Gateway
- `--token-file <path>`: อ่าน token จากไฟล์
- `--password <password>`: รหัสผ่านของ Gateway
- `--password-file <path>`: อ่านรหัสผ่านจากไฟล์
- `--claude-channel-mode <auto|on|off>`: โหมดการแจ้งเตือนของ Claude
- `-v`, `--verbose`: logs แบบละเอียดบน stderr

ควรใช้ `--token-file` หรือ `--password-file` แทน secrets แบบ inline เมื่อเป็นไปได้

## ความปลอดภัยและขอบเขตความเชื่อถือ

bridge ไม่ได้สร้างการกำหนดเส้นทางขึ้นมาเอง มันเพียงเปิดเผยบทสนทนาที่ Gateway
รู้อยู่แล้วว่าจะกำหนดเส้นทางอย่างไร

ซึ่งหมายความว่า:

- allowlists ของผู้ส่ง, การจับคู่ และความเชื่อถือระดับช่องทาง ยังคงเป็นหน้าที่ของ
  การกำหนดค่าช่องทาง OpenClaw ที่อยู่เบื้องหลัง
- `messages_send` สามารถตอบกลับได้เฉพาะผ่าน route ที่ถูกเก็บไว้แล้วเท่านั้น
- สถานะ approvals เป็นแบบสด/ในหน่วยความจำเท่านั้นสำหรับ session ของ bridge ปัจจุบัน
- การยืนยันตัวตนของ bridge ควรใช้ token หรือการควบคุมด้วยรหัสผ่านของ Gateway แบบเดียวกับที่คุณจะ
  ไว้ใจสำหรับไคลเอนต์ Gateway ระยะไกลตัวอื่น

หากบทสนทนาหายไปจาก `conversations_list` สาเหตุตามปกติมักไม่ใช่
การกำหนดค่า MCP แต่เป็น route metadata ที่ขาดหายหรือไม่สมบูรณ์ใน
Gateway session ที่อยู่เบื้องหลัง

## การทดสอบ

OpenClaw มาพร้อม Docker smoke แบบกำหนดผลลัพธ์ได้แน่นอนสำหรับ bridge นี้:

```bash
pnpm test:docker:mcp-channels
```

smoke นี้จะ:

- เริ่ม seeded Gateway container
- เริ่ม container ที่สองซึ่งสร้าง process `openclaw mcp serve`
- ตรวจสอบการค้นพบบทสนทนา การอ่านข้อความ transcript การอ่าน attachment metadata
  ลักษณะการทำงานของ live event queue และการกำหนดเส้นทางการส่งขาออก
- ตรวจสอบ Claude-style channel และ permission notifications ผ่าน stdio MCP bridge
  จริง

นี่เป็นวิธีที่เร็วที่สุดในการพิสูจน์ว่า bridge ทำงานได้โดยไม่ต้องเชื่อมบัญชี
Telegram, Discord หรือ iMessage จริงเข้ากับการทดสอบ

สำหรับบริบทการทดสอบที่กว้างขึ้น ดู [การทดสอบ](/th/help/testing)

## การแก้ไขปัญหา

### ไม่มีบทสนทนาถูกส่งกลับ

โดยปกติหมายความว่า Gateway session ยังไม่สามารถกำหนดเส้นทางได้ ยืนยันว่า
session ที่อยู่เบื้องหลังได้จัดเก็บ route metadata ของ channel/provider, recipient และ
account/thread แบบไม่บังคับไว้แล้ว

### `events_poll` หรือ `events_wait` พลาดข้อความเก่า

เป็นไปตามคาด คิวแบบสดเริ่มต้นเมื่อ bridge เชื่อมต่อ อ่านประวัติ transcript ที่เก่ากว่า
ด้วย `messages_read`

### Claude notifications ไม่แสดงขึ้นมา

ตรวจสอบทั้งหมดนี้:

- ไคลเอนต์ยังคงเปิด stdio MCP session ไว้
- `--claude-channel-mode` เป็น `on` หรือ `auto`
- ไคลเอนต์เข้าใจเมธอดการแจ้งเตือนแบบ Claude-specific จริง ๆ
- ข้อความขาเข้าเกิดขึ้นหลังจากที่ bridge เชื่อมต่อแล้ว

### Approvals หายไป

`permissions_list_open` แสดงเฉพาะคำขอการอนุมัติที่สังเกตพบขณะที่ bridge
เชื่อมต่ออยู่เท่านั้น มันไม่ใช่ API ประวัติการอนุมัติแบบคงทน

## OpenClaw ในฐานะรีจิสทรีไคลเอนต์ MCP

นี่คือเส้นทาง `openclaw mcp list`, `show`, `set` และ `unset`

คำสั่งเหล่านี้ไม่ได้เปิดเผย OpenClaw ผ่าน MCP แต่มันจัดการนิยาม MCP
server ที่ OpenClaw เป็นเจ้าของภายใต้ `mcp.servers` ใน config ของ OpenClaw

นิยามที่บันทึกไว้นั้นมีไว้สำหรับรันไทม์ที่ OpenClaw จะเริ่มหรือกำหนดค่า
ในภายหลัง เช่น Pi แบบฝังตัวและ runtime adapters อื่น ๆ OpenClaw จัดเก็บนิยาม
ไว้รวมศูนย์เพื่อให้รันไทม์เหล่านั้นไม่ต้องเก็บรายการ MCP server
ซ้ำของตัวเอง

ลักษณะการทำงานสำคัญ:

- คำสั่งเหล่านี้อ่านหรือเขียนเฉพาะ config ของ OpenClaw
- คำสั่งเหล่านี้ไม่เชื่อมต่อกับ MCP server เป้าหมาย
- คำสั่งเหล่านี้ไม่ตรวจสอบว่าคำสั่ง, URL หรือ remote transport
  เข้าถึงได้จริงในตอนนี้หรือไม่
- runtime adapters เป็นผู้ตัดสินใจว่าตนรองรับรูปแบบ transport ใด
  ขณะรันจริง
- Pi แบบฝังตัวจะเปิดเผยเครื่องมือ MCP ที่กำหนดค่าไว้ในโปรไฟล์เครื่องมือ `coding` และ `messaging`
  ตามปกติ; โปรไฟล์ `minimal` ยังคงซ่อนไว้ และ `tools.deny: ["bundle-mcp"]`
  จะปิดใช้งานอย่างชัดเจน

## นิยามเซิร์ฟเวอร์ MCP ที่บันทึกไว้

OpenClaw ยังจัดเก็บรีจิสทรี MCP server แบบเบาใน config สำหรับพื้นผิว
ที่ต้องการนิยาม MCP ที่จัดการโดย OpenClaw

คำสั่ง:

- `openclaw mcp list`
- `openclaw mcp show [name]`
- `openclaw mcp set <name> <json>`
- `openclaw mcp unset <name>`

หมายเหตุ:

- `list` จะเรียงลำดับชื่อเซิร์ฟเวอร์
- `show` โดยไม่ระบุชื่อจะพิมพ์ออบเจ็กต์ MCP server ที่กำหนดค่าไว้ทั้งหมด
- `set` คาดหวังค่า JSON object หนึ่งค่าในบรรทัดคำสั่ง
- `unset` จะล้มเหลวหากไม่มีเซิร์ฟเวอร์ชื่อตามที่ระบุ

ตัวอย่าง:

```bash
openclaw mcp list
openclaw mcp show context7 --json
openclaw mcp set context7 '{"command":"uvx","args":["context7-mcp"]}'
openclaw mcp set docs '{"url":"https://mcp.example.com"}'
openclaw mcp unset context7
```

ตัวอย่างรูปแบบ config:

```json
{
  "mcp": {
    "servers": {
      "context7": {
        "command": "uvx",
        "args": ["context7-mcp"]
      },
      "docs": {
        "url": "https://mcp.example.com"
      }
    }
  }
}
```

### ทรานสปอร์ต Stdio

เริ่ม child process แบบโลคัลและสื่อสารผ่าน stdin/stdout

| ฟิลด์ | คำอธิบาย |
| -------------------------- | --------------------------------- |
| `command` | executable ที่จะสร้าง process (จำเป็น) |
| `args` | อาร์เรย์ของอาร์กิวเมนต์บรรทัดคำสั่ง |
| `env` | ตัวแปรสภาพแวดล้อมเพิ่มเติม |
| `cwd` / `workingDirectory` | ไดเรกทอรีทำงานของ process |

#### ตัวกรองความปลอดภัยของ stdio env

OpenClaw จะปฏิเสธคีย์ env ที่ใช้ตอนเริ่มต้น interpreter ซึ่งสามารถเปลี่ยนวิธีที่ stdio MCP server เริ่มทำงานก่อน RPC แรกได้ แม้ว่าคีย์เหล่านั้นจะอยู่ในบล็อก `env` ของเซิร์ฟเวอร์ก็ตาม คีย์ที่ถูกบล็อกรวมถึง `NODE_OPTIONS`, `PYTHONSTARTUP`, `PYTHONPATH`, `PERL5OPT`, `RUBYOPT`, `SHELLOPTS`, `PS4` และตัวแปรควบคุมรันไทม์ในลักษณะเดียวกัน ระบบจะปฏิเสธตอนเริ่มต้นด้วยข้อผิดพลาดด้าน configuration เพื่อไม่ให้คีย์เหล่านี้ฉีด prelude โดยนัย สลับ interpreter หรือเปิดดีบักเกอร์กับ stdio process ได้ ตัวแปร env ทั่วไปสำหรับข้อมูลรับรอง พร็อกซี และตัวแปรเฉพาะเซิร์ฟเวอร์ (`GITHUB_TOKEN`, `HTTP_PROXY`, `*_API_KEY` แบบกำหนดเอง เป็นต้น) จะไม่ได้รับผลกระทบ

หาก MCP server ของคุณจำเป็นต้องใช้ตัวแปรที่ถูกบล็อกจริง ๆ ให้ตั้งค่าบน process ของโฮสต์ gateway แทนการใส่ไว้ใต้ `env` ของ stdio server

### ทรานสปอร์ต SSE / HTTP

เชื่อมต่อกับ MCP server ระยะไกลผ่าน HTTP Server-Sent Events

| ฟิลด์ | คำอธิบาย |
| --------------------- | ---------------------------------------------------------------- |
| `url` | URL แบบ HTTP หรือ HTTPS ของเซิร์ฟเวอร์ระยะไกล (จำเป็น) |
| `headers` | แมป key-value แบบไม่บังคับของ HTTP headers (เช่น auth tokens) |
| `connectionTimeoutMs` | connection timeout ต่อเซิร์ฟเวอร์เป็นมิลลิวินาที (ไม่บังคับ) |

ตัวอย่าง:

```json
{
  "mcp": {
    "servers": {
      "remote-tools": {
        "url": "https://mcp.example.com",
        "headers": {
          "Authorization": "Bearer <token>"
        }
      }
    }
  }
}
```

ค่าที่ละเอียดอ่อนใน `url` (userinfo) และ `headers` จะถูกปกปิดใน logs และ
เอาต์พุตสถานะ

### ทรานสปอร์ต Streamable HTTP

`streamable-http` เป็นตัวเลือกทรานสปอร์ตเพิ่มเติมนอกเหนือจาก `sse` และ `stdio` โดยใช้ HTTP streaming สำหรับการสื่อสารแบบสองทิศทางกับ MCP servers ระยะไกล

| ฟิลด์ | คำอธิบาย |
| --------------------- | -------------------------------------------------------------------------------------- |
| `url` | URL แบบ HTTP หรือ HTTPS ของเซิร์ฟเวอร์ระยะไกล (จำเป็น) |
| `transport` | ตั้งเป็น `"streamable-http"` เพื่อเลือกทรานสปอร์ตนี้; หากไม่ระบุ OpenClaw จะใช้ `sse` |
| `headers` | แมป key-value แบบไม่บังคับของ HTTP headers (เช่น auth tokens) |
| `connectionTimeoutMs` | connection timeout ต่อเซิร์ฟเวอร์เป็นมิลลิวินาที (ไม่บังคับ) |

ตัวอย่าง:

```json
{
  "mcp": {
    "servers": {
      "streaming-tools": {
        "url": "https://mcp.example.com/stream",
        "transport": "streamable-http",
        "connectionTimeoutMs": 10000,
        "headers": {
          "Authorization": "Bearer <token>"
        }
      }
    }
  }
}
```

คำสั่งเหล่านี้จัดการเฉพาะ config ที่บันทึกไว้เท่านั้น คำสั่งเหล่านี้ไม่ได้เริ่ม channel bridge,
ไม่ได้เปิด live MCP client session และไม่ได้พิสูจน์ว่าเซิร์ฟเวอร์เป้าหมายเข้าถึงได้

## ข้อจำกัดปัจจุบัน

หน้านี้อธิบาย bridge ตามที่จัดส่งอยู่ในปัจจุบัน

ข้อจำกัดปัจจุบัน:

- การค้นพบบทสนทนาขึ้นอยู่กับ route metadata ของ Gateway session ที่มีอยู่แล้ว
- ยังไม่มี push protocol แบบทั่วไปนอกเหนือจากตัว adapter แบบ Claude-specific
- ยังไม่มีเครื่องมือแก้ไขข้อความหรือ reaction
- ทรานสปอร์ต HTTP/SSE/streamable-http เชื่อมต่อกับเซิร์ฟเวอร์ระยะไกลได้เพียงตัวเดียว; ยังไม่มี multiplexed upstream
- `permissions_list_open` รวมเฉพาะ approvals ที่สังเกตพบขณะที่ bridge
  เชื่อมต่ออยู่เท่านั้น

## ที่เกี่ยวข้อง

- [ข้อมูลอ้างอิง CLI](/th/cli)
- [Plugins](/th/cli/plugins)
