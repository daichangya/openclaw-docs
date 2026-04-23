---
read_when:
    - คุณต้องการเชื่อมต่อบอต Feishu/Lark
    - คุณกำลังกำหนดค่าแชนเนล Feishu
summary: ภาพรวม คุณสมบัติ และการกำหนดค่าของบอต Feishu
title: Feishu
x-i18n:
    generated_at: "2026-04-23T05:25:18Z"
    model: gpt-5.4
    provider: openai
    source_hash: 77fcf95a3fab534ed898bc157d76bf8bdfa8bf8a918d6af84c0db19890916c1a
    source_path: channels/feishu.md
    workflow: 15
---

# Feishu / Lark

Feishu/Lark เป็นแพลตฟอร์มการทำงานร่วมกันแบบครบวงจรที่ทีมสามารถแชต แชร์เอกสาร จัดการปฏิทิน และทำงานร่วมกันให้เสร็จสิ้นได้

**สถานะ:** พร้อมใช้งานจริงสำหรับบอตใน DM และแชตกลุ่ม โหมด WebSocket เป็นโหมดเริ่มต้น; โหมด Webhook เป็นตัวเลือกเสริม

---

## เริ่มต้นอย่างรวดเร็ว

> **ต้องใช้ OpenClaw 2026.4.10 หรือใหม่กว่า** รัน `openclaw --version` เพื่อตรวจสอบ อัปเกรดด้วย `openclaw update`

<Steps>
  <Step title="รันวิซาร์ดตั้งค่าแชนเนล">
  ```bash
  openclaw channels login --channel feishu
  ```
  สแกน QR code ด้วยแอปมือถือ Feishu/Lark ของคุณเพื่อสร้างบอต Feishu/Lark โดยอัตโนมัติ
  </Step>
  
  <Step title="หลังจากการตั้งค่าเสร็จสิ้น ให้รีสตาร์ต Gateway เพื่อใช้การเปลี่ยนแปลง">
  ```bash
  openclaw gateway restart
  ```
  </Step>
</Steps>

---

## การควบคุมการเข้าถึง

### ข้อความส่วนตัว

กำหนดค่า `dmPolicy` เพื่อควบคุมว่าใครสามารถส่ง DM ถึงบอตได้:

- `"pairing"` — ผู้ใช้ที่ไม่รู้จักจะได้รับรหัส pairing; อนุมัติผ่าน CLI
- `"allowlist"` — เฉพาะผู้ใช้ที่อยู่ใน `allowFrom` เท่านั้นที่แชตได้ (ค่าเริ่มต้น: เฉพาะเจ้าของบอต)
- `"open"` — อนุญาตผู้ใช้ทั้งหมด
- `"disabled"` — ปิดใช้งาน DM ทั้งหมด

**อนุมัติคำขอ pairing:**

```bash
openclaw pairing list feishu
openclaw pairing approve feishu <CODE>
```

### แชตกลุ่ม

**นโยบายกลุ่ม** (`channels.feishu.groupPolicy`):

| ค่า            | พฤติกรรม                                   |
| -------------- | ------------------------------------------ |
| `"open"`       | ตอบกลับทุกข้อความในกลุ่ม                   |
| `"allowlist"`  | ตอบกลับเฉพาะกลุ่มใน `groupAllowFrom`      |
| `"disabled"`   | ปิดใช้งานข้อความกลุ่มทั้งหมด              |

ค่าเริ่มต้น: `allowlist`

**ข้อกำหนดการ mention** (`channels.feishu.requireMention`):

- `true` — ต้องมีการ @mention (ค่าเริ่มต้น)
- `false` — ตอบกลับได้โดยไม่ต้อง @mention
- การแทนที่รายกลุ่ม: `channels.feishu.groups.<chat_id>.requireMention`

---

## ตัวอย่างการกำหนดค่ากลุ่ม

### อนุญาตทุกกลุ่ม โดยไม่ต้องมี @mention

```json5
{
  channels: {
    feishu: {
      groupPolicy: "open",
    },
  },
}
```

### อนุญาตทุกกลุ่ม แต่ยังคงต้องมี @mention

```json5
{
  channels: {
    feishu: {
      groupPolicy: "open",
      requireMention: true,
    },
  },
}
```

### อนุญาตเฉพาะบางกลุ่ม

```json5
{
  channels: {
    feishu: {
      groupPolicy: "allowlist",
      // Group IDs มีลักษณะเช่น: oc_xxx
      groupAllowFrom: ["oc_xxx", "oc_yyy"],
    },
  },
}
```

### จำกัดผู้ส่งภายในกลุ่ม

```json5
{
  channels: {
    feishu: {
      groupPolicy: "allowlist",
      groupAllowFrom: ["oc_xxx"],
      groups: {
        oc_xxx: {
          // open_id ของผู้ใช้มีลักษณะเช่น: ou_xxx
          allowFrom: ["ou_user1", "ou_user2"],
        },
      },
    },
  },
}
```

---

## ดู ID กลุ่ม/ผู้ใช้

### ID กลุ่ม (`chat_id`, รูปแบบ: `oc_xxx`)

เปิดกลุ่มใน Feishu/Lark คลิกไอคอนเมนูที่มุมขวาบน แล้วไปที่ **Settings** โดย ID กลุ่ม (`chat_id`) จะแสดงอยู่ในหน้าการตั้งค่า

![Get Group ID](/images/feishu-get-group-id.png)

### ID ผู้ใช้ (`open_id`, รูปแบบ: `ou_xxx`)

เริ่ม Gateway ส่ง DM ไปยังบอต จากนั้นตรวจสอบ log:

```bash
openclaw logs --follow
```

มองหา `open_id` ในเอาต์พุต log คุณยังสามารถตรวจสอบคำขอ pairing ที่รอดำเนินการได้:

```bash
openclaw pairing list feishu
```

---

## คำสั่งที่ใช้บ่อย

| คำสั่ง    | คำอธิบาย                      |
| --------- | ----------------------------- |
| `/status` | แสดงสถานะบอต                  |
| `/reset`  | รีเซ็ตเซสชันปัจจุบัน          |
| `/model`  | แสดงหรือสลับโมเดล AI         |

> Feishu/Lark ไม่รองรับเมนู slash command แบบเนทีฟ ดังนั้นให้ส่งคำสั่งเหล่านี้เป็นข้อความธรรมดา

---

## การแก้ไขปัญหา

### บอตไม่ตอบกลับในแชตกลุ่ม

1. ตรวจสอบให้แน่ใจว่าได้เพิ่มบอตเข้ากลุ่มแล้ว
2. ตรวจสอบให้แน่ใจว่าคุณได้ @mention บอตแล้ว (เป็นค่าเริ่มต้นที่ต้องมี)
3. ตรวจสอบว่า `groupPolicy` ไม่ใช่ `"disabled"`
4. ตรวจสอบ log: `openclaw logs --follow`

### บอตไม่ได้รับข้อความ

1. ตรวจสอบให้แน่ใจว่าบอตได้รับการเผยแพร่และอนุมัติแล้วใน Feishu Open Platform / Lark Developer
2. ตรวจสอบให้แน่ใจว่าการสมัครรับเหตุการณ์มี `im.message.receive_v1`
3. ตรวจสอบให้แน่ใจว่าได้เลือก **persistent connection** (WebSocket)
4. ตรวจสอบให้แน่ใจว่าได้ให้สิทธิ์ permission scope ที่จำเป็นทั้งหมดแล้ว
5. ตรวจสอบให้แน่ใจว่า Gateway กำลังทำงานอยู่: `openclaw gateway status`
6. ตรวจสอบ log: `openclaw logs --follow`

### App Secret รั่วไหล

1. รีเซ็ต App Secret ใน Feishu Open Platform / Lark Developer
2. อัปเดตค่าใน config ของคุณ
3. รีสตาร์ต Gateway: `openclaw gateway restart`

---

## การกำหนดค่าขั้นสูง

### หลายบัญชี

```json5
{
  channels: {
    feishu: {
      defaultAccount: "main",
      accounts: {
        main: {
          appId: "cli_xxx",
          appSecret: "xxx",
          name: "บอตหลัก",
        },
        backup: {
          appId: "cli_yyy",
          appSecret: "yyy",
          name: "บอตสำรอง",
          enabled: false,
        },
      },
    },
  },
}
```

`defaultAccount` ควบคุมว่าจะใช้บัญชีใดเมื่อ API ขาออกไม่ได้ระบุ `accountId`

### ขีดจำกัดของข้อความ

- `textChunkLimit` — ขนาดชังก์ข้อความขาออก (ค่าเริ่มต้น: `2000` อักขระ)
- `mediaMaxMb` — ขีดจำกัดการอัปโหลด/ดาวน์โหลดสื่อ (ค่าเริ่มต้น: `30` MB)

### การสตรีม

Feishu/Lark รองรับการสตรีมคำตอบผ่านการ์ดแบบโต้ตอบ เมื่อเปิดใช้งาน บอตจะอัปเดตการ์ดแบบเรียลไทม์ขณะสร้างข้อความ

```json5
{
  channels: {
    feishu: {
      streaming: true, // เปิดใช้เอาต์พุตการ์ดแบบสตรีม (ค่าเริ่มต้น: true)
      blockStreaming: true, // เปิดใช้การสตรีมระดับบล็อก (ค่าเริ่มต้น: true)
    },
  },
}
```

ตั้งค่า `streaming: false` เพื่อส่งคำตอบทั้งหมดในข้อความเดียว

### การเพิ่มประสิทธิภาพโควตา

ลดจำนวนการเรียก API ของ Feishu/Lark ด้วยแฟล็กเสริมสองตัว:

- `typingIndicator` (ค่าเริ่มต้น `true`): ตั้งเป็น `false` เพื่อข้ามการเรียกปฏิกิริยาการพิมพ์
- `resolveSenderNames` (ค่าเริ่มต้น `true`): ตั้งเป็น `false` เพื่อข้ามการค้นหาโปรไฟล์ผู้ส่ง

```json5
{
  channels: {
    feishu: {
      typingIndicator: false,
      resolveSenderNames: false,
    },
  },
}
```

### เซสชัน ACP

Feishu/Lark รองรับ ACP สำหรับ DM และข้อความเธรดของกลุ่ม ACP ของ Feishu/Lark ขับเคลื่อนด้วยคำสั่งข้อความ — ไม่มีเมนู slash command แบบเนทีฟ ดังนั้นให้ใช้ข้อความ `/acp ...` โดยตรงภายในบทสนทนา

#### การผูก ACP แบบคงอยู่ถาวร

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
        channel: "feishu",
        accountId: "default",
        peer: { kind: "direct", id: "ou_1234567890" },
      },
    },
    {
      type: "acp",
      agentId: "codex",
      match: {
        channel: "feishu",
        accountId: "default",
        peer: { kind: "group", id: "oc_group_chat:topic:om_topic_root" },
      },
      acp: { label: "codex-feishu-topic" },
    },
  ],
}
```

#### สร้าง ACP จากแชต

ใน DM หรือเธรดของ Feishu/Lark:

```text
/acp spawn codex --thread here
```

`--thread here` ใช้ได้ทั้งกับ DM และข้อความเธรดของ Feishu/Lark ข้อความติดตามผลในบทสนทนาที่ผูกไว้จะถูกส่งตรงไปยังเซสชัน ACP นั้น

### การกำหนดเส้นทางหลายเอเจนต์

ใช้ `bindings` เพื่อกำหนดเส้นทาง DM หรือกลุ่มของ Feishu/Lark ไปยังเอเจนต์ต่างกัน

```json5
{
  agents: {
    list: [
      { id: "main" },
      { id: "agent-a", workspace: "/home/user/agent-a" },
      { id: "agent-b", workspace: "/home/user/agent-b" },
    ],
  },
  bindings: [
    {
      agentId: "agent-a",
      match: {
        channel: "feishu",
        peer: { kind: "direct", id: "ou_xxx" },
      },
    },
    {
      agentId: "agent-b",
      match: {
        channel: "feishu",
        peer: { kind: "group", id: "oc_zzz" },
      },
    },
  ],
}
```

ฟิลด์การกำหนดเส้นทาง:

- `match.channel`: `"feishu"`
- `match.peer.kind`: `"direct"` (DM) หรือ `"group"` (แชตกลุ่ม)
- `match.peer.id`: Open ID ของผู้ใช้ (`ou_xxx`) หรือ ID กลุ่ม (`oc_xxx`)

ดู [ดู ID กลุ่ม/ผู้ใช้](#ดู-id-กลุ่มผู้ใช้) สำหรับเคล็ดลับในการค้นหา

---

## เอกสารอ้างอิงการกำหนดค่า

การกำหนดค่าแบบเต็ม: [การกำหนดค่า Gateway](/th/gateway/configuration)

| การตั้งค่า                                         | คำอธิบาย                                 | ค่าเริ่มต้น      |
| -------------------------------------------------- | ---------------------------------------- | ---------------- |
| `channels.feishu.enabled`                          | เปิด/ปิดใช้งานแชนเนล                    | `true`           |
| `channels.feishu.domain`                           | โดเมน API (`feishu` หรือ `lark`)        | `feishu`         |
| `channels.feishu.connectionMode`                   | การขนส่งเหตุการณ์ (`websocket` หรือ `webhook`) | `websocket`      |
| `channels.feishu.defaultAccount`                   | บัญชีเริ่มต้นสำหรับการกำหนดเส้นทางขาออก | `default`        |
| `channels.feishu.verificationToken`                | จำเป็นสำหรับโหมด webhook                | —                |
| `channels.feishu.encryptKey`                       | จำเป็นสำหรับโหมด webhook                | —                |
| `channels.feishu.webhookPath`                      | พาธเส้นทาง Webhook                      | `/feishu/events` |
| `channels.feishu.webhookHost`                      | โฮสต์สำหรับ bind Webhook                | `127.0.0.1`      |
| `channels.feishu.webhookPort`                      | พอร์ตสำหรับ bind Webhook                | `3000`           |
| `channels.feishu.accounts.<id>.appId`              | App ID                                   | —                |
| `channels.feishu.accounts.<id>.appSecret`          | App Secret                               | —                |
| `channels.feishu.accounts.<id>.domain`             | การแทนที่โดเมนรายบัญชี                  | `feishu`         |
| `channels.feishu.dmPolicy`                         | นโยบาย DM                               | `allowlist`      |
| `channels.feishu.allowFrom`                        | allowlist สำหรับ DM (รายการ open_id)    | [BotOwnerId]     |
| `channels.feishu.groupPolicy`                      | นโยบายกลุ่ม                             | `allowlist`      |
| `channels.feishu.groupAllowFrom`                   | allowlist ของกลุ่ม                      | —                |
| `channels.feishu.requireMention`                   | ต้องมี @mention ในกลุ่ม                 | `true`           |
| `channels.feishu.groups.<chat_id>.requireMention`  | การแทนที่ @mention รายกลุ่ม             | inherited        |
| `channels.feishu.groups.<chat_id>.enabled`         | เปิด/ปิดใช้งานกลุ่มที่ระบุ              | `true`           |
| `channels.feishu.textChunkLimit`                   | ขนาดชังก์ของข้อความ                     | `2000`           |
| `channels.feishu.mediaMaxMb`                       | ขีดจำกัดขนาดสื่อ                        | `30`             |
| `channels.feishu.streaming`                        | เอาต์พุตการ์ดแบบสตรีม                   | `true`           |
| `channels.feishu.blockStreaming`                   | การสตรีมระดับบล็อก                      | `true`           |
| `channels.feishu.typingIndicator`                  | ส่งปฏิกิริยาการพิมพ์                    | `true`           |
| `channels.feishu.resolveSenderNames`               | แปลงชื่อที่แสดงของผู้ส่ง                | `true`           |

---

## ประเภทข้อความที่รองรับ

### รับ

- ✅ ข้อความ
- ✅ Rich text (post)
- ✅ รูปภาพ
- ✅ ไฟล์
- ✅ เสียง
- ✅ วิดีโอ/สื่อ
- ✅ สติกเกอร์

### ส่ง

- ✅ ข้อความ
- ✅ รูปภาพ
- ✅ ไฟล์
- ✅ เสียง
- ✅ วิดีโอ/สื่อ
- ✅ การ์ดแบบโต้ตอบ (รวมถึงการอัปเดตแบบสตรีม)
- ⚠️ Rich text (การจัดรูปแบบแบบ post; ไม่รองรับความสามารถในการเขียนแบบเต็มของ Feishu/Lark)

### เธรดและการตอบกลับ

- ✅ การตอบกลับแบบอินไลน์
- ✅ การตอบกลับในเธรด
- ✅ การตอบกลับสื่อยังคงรับรู้เธรดเมื่อกำลังตอบกลับข้อความในเธรด

---

## ที่เกี่ยวข้อง

- [ภาพรวมแชนเนล](/th/channels) — แชนเนลที่รองรับทั้งหมด
- [Pairing](/th/channels/pairing) — การยืนยันตัวตนผ่าน DM และโฟลว์ pairing
- [กลุ่ม](/th/channels/groups) — พฤติกรรมของแชตกลุ่มและการควบคุมด้วยการ mention
- [การกำหนดเส้นทางแชนเนล](/th/channels/channel-routing) — การกำหนดเส้นทางเซสชันสำหรับข้อความ
- [ความปลอดภัย](/th/gateway/security) — โมเดลการเข้าถึงและการเสริมความแข็งแกร่งด้านความปลอดภัย
