---
read_when:
    - คุณต้องการระบบอัตโนมัติแบบขับเคลื่อนด้วยเหตุการณ์สำหรับ `/new`, `/reset`, `/stop` และเหตุการณ์ตลอดวงจรชีวิตของเอเจนต์
    - คุณต้องการสร้าง ติดตั้ง หรือแก้จุดบกพร่อง hooks
summary: 'Hooks: ระบบอัตโนมัติแบบขับเคลื่อนด้วยเหตุการณ์สำหรับคำสั่งและเหตุการณ์ตลอดวงจรชีวิต'
title: Hooks
x-i18n:
    generated_at: "2026-04-24T08:57:10Z"
    model: gpt-5.4
    provider: openai
    source_hash: 4e6246f25272208d9a9ff2f186bcd3a463c78ea24b833f0259174d0f7f0cbea6
    source_path: automation/hooks.md
    workflow: 15
---

hooks คือสคริปต์ขนาดเล็กที่ทำงานเมื่อมีบางอย่างเกิดขึ้นภายใน Gateway สามารถค้นพบได้จากไดเรกทอรีต่างๆ และตรวจสอบได้ด้วย `openclaw hooks` Gateway จะโหลด internal hooks ก็ต่อเมื่อคุณเปิดใช้งาน hooks หรือกำหนดค่าอย่างน้อยหนึ่งรายการของ hook entry, hook pack, legacy handler หรือไดเรกทอรี hook เพิ่มเติม

hooks ใน OpenClaw มีอยู่สองประเภท:

- **Internal hooks** (หน้านี้): ทำงานภายใน Gateway เมื่อมีเหตุการณ์ของเอเจนต์เกิดขึ้น เช่น `/new`, `/reset`, `/stop` หรือเหตุการณ์ตลอดวงจรชีวิต
- **Webhooks**: HTTP endpoint ภายนอกที่ให้ระบบอื่นทริกเกอร์งานใน OpenClaw ได้ ดู [Webhooks](/th/automation/cron-jobs#webhooks)

hooks ยังสามารถรวมมาใน plugins ได้ด้วย `openclaw hooks list` จะแสดงทั้ง hooks แบบสแตนด์อโลนและ hooks ที่จัดการโดย plugin

## เริ่มต้นอย่างรวดเร็ว

```bash
# แสดงรายการ hooks ที่พร้อมใช้งาน
openclaw hooks list

# เปิดใช้งาน hook
openclaw hooks enable session-memory

# ตรวจสอบสถานะ hook
openclaw hooks check

# ดูข้อมูลโดยละเอียด
openclaw hooks info session-memory
```

## ประเภทเหตุการณ์

| เหตุการณ์                | เวลาที่ทริกเกอร์                                  |
| ------------------------ | ------------------------------------------------ |
| `command:new`            | มีการออกคำสั่ง `/new`                            |
| `command:reset`          | มีการออกคำสั่ง `/reset`                          |
| `command:stop`           | มีการออกคำสั่ง `/stop`                           |
| `command`                | เหตุการณ์คำสั่งใดๆ (ตัวรับฟังทั่วไป)             |
| `session:compact:before` | ก่อนที่ Compaction จะสรุปประวัติ                  |
| `session:compact:after`  | หลังจาก Compaction เสร็จสิ้น                      |
| `session:patch`          | เมื่อมีการแก้ไขคุณสมบัติของเซสชัน                |
| `agent:bootstrap`        | ก่อนฉีดไฟล์ bootstrap ของ workspace              |
| `gateway:startup`        | หลังจาก channels เริ่มทำงานและโหลด hooks แล้ว    |
| `message:received`       | ข้อความขาเข้าจาก channel ใดก็ได้                |
| `message:transcribed`    | หลังจากถอดเสียงจากเสียงเสร็จสิ้น                 |
| `message:preprocessed`   | หลังจากประมวลผลสื่อและทำความเข้าใจลิงก์ครบถ้วน |
| `message:sent`           | ส่งข้อความขาออกสำเร็จ                            |

## การเขียน hooks

### โครงสร้างของ hook

hook แต่ละตัวเป็นไดเรกทอรีที่มีสองไฟล์:

```
my-hook/
├── HOOK.md          # ข้อมูลเมตา + เอกสารประกอบ
└── handler.ts       # การทำงานของ handler
```

### รูปแบบ HOOK.md

```markdown
---
name: my-hook
description: "คำอธิบายสั้นๆ ว่า hook นี้ทำอะไร"
metadata:
  { "openclaw": { "emoji": "🔗", "events": ["command:new"], "requires": { "bins": ["node"] } } }
---

# My Hook

เอกสารรายละเอียดอยู่ที่นี่
```

**ฟิลด์ข้อมูลเมตา** (`metadata.openclaw`):

| ฟิลด์      | คำอธิบาย                                             |
| ---------- | ---------------------------------------------------- |
| `emoji`    | อีโมจิสำหรับแสดงใน CLI                               |
| `events`   | อาร์เรย์ของเหตุการณ์ที่ต้องการรับฟัง                |
| `export`   | named export ที่จะใช้ (ค่าเริ่มต้นคือ `"default"`)  |
| `os`       | แพลตฟอร์มที่ต้องการ (เช่น `["darwin", "linux"]`)     |
| `requires` | `bins`, `anyBins`, `env` หรือพาธ `config` ที่ต้องมี |
| `always`   | ข้ามการตรวจสอบสิทธิ์การใช้งาน (boolean)             |
| `install`  | วิธีการติดตั้ง                                        |

### การเขียน handler

```typescript
const handler = async (event) => {
  if (event.type !== "command" || event.action !== "new") {
    return;
  }

  console.log(`[my-hook] New command triggered`);
  // ตรรกะของคุณที่นี่

  // ส่งข้อความถึงผู้ใช้เพิ่มเติมได้หากต้องการ
  event.messages.push("Hook executed!");
};

export default handler;
```

แต่ละเหตุการณ์ประกอบด้วย: `type`, `action`, `sessionKey`, `timestamp`, `messages` (push เพื่อส่งถึงผู้ใช้) และ `context` (ข้อมูลเฉพาะเหตุการณ์) บริบท hook ของ plugin สำหรับเอเจนต์และเครื่องมืออาจมี `trace` รวมอยู่ด้วย ซึ่งเป็นบริบท trace สำหรับการวินิจฉัยแบบอ่านอย่างเดียวที่เข้ากันได้กับ W3C และ plugins สามารถส่งต่อไปยัง structured logs เพื่อทำ OTEL correlation ได้

### ไฮไลต์ของบริบทเหตุการณ์

**เหตุการณ์คำสั่ง** (`command:new`, `command:reset`): `context.sessionEntry`, `context.previousSessionEntry`, `context.commandSource`, `context.workspaceDir`, `context.cfg`

**เหตุการณ์ข้อความ** (`message:received`): `context.from`, `context.content`, `context.channelId`, `context.metadata` (ข้อมูลเฉพาะ provider รวมถึง `senderId`, `senderName`, `guildId`)

**เหตุการณ์ข้อความ** (`message:sent`): `context.to`, `context.content`, `context.success`, `context.channelId`

**เหตุการณ์ข้อความ** (`message:transcribed`): `context.transcript`, `context.from`, `context.channelId`, `context.mediaPath`

**เหตุการณ์ข้อความ** (`message:preprocessed`): `context.bodyForAgent` (เนื้อหาสุดท้ายที่เสริมข้อมูลแล้ว), `context.from`, `context.channelId`

**เหตุการณ์ Bootstrap** (`agent:bootstrap`): `context.bootstrapFiles` (อาร์เรย์ที่แก้ไขได้), `context.agentId`

**เหตุการณ์ patch ของเซสชัน** (`session:patch`): `context.sessionEntry`, `context.patch` (เฉพาะฟิลด์ที่เปลี่ยน), `context.cfg` มีเพียงไคลเอนต์ที่มีสิทธิ์เท่านั้นที่สามารถทริกเกอร์เหตุการณ์ patch ได้

**เหตุการณ์ Compaction**: `session:compact:before` มี `messageCount`, `tokenCount` ส่วน `session:compact:after` เพิ่ม `compactedCount`, `summaryLength`, `tokensBefore`, `tokensAfter`

## การค้นพบ hook

ระบบจะค้นพบ hooks จากไดเรกทอรีเหล่านี้ โดยเรียงลำดับจากสิทธิ์การแทนที่ต่ำไปสูง:

1. **Bundled hooks**: มาพร้อมกับ OpenClaw
2. **Plugin hooks**: hooks ที่รวมมาใน plugins ที่ติดตั้งแล้ว
3. **Managed hooks**: `~/.openclaw/hooks/` (ติดตั้งโดยผู้ใช้และแชร์ข้าม workspace) ไดเรกทอรีเพิ่มเติมจาก `hooks.internal.load.extraDirs` จะใช้ลำดับสิทธิ์เดียวกันนี้
4. **Workspace hooks**: `<workspace>/hooks/` (ต่อเอเจนต์หนึ่งตัว ปิดไว้เป็นค่าเริ่มต้นจนกว่าจะเปิดใช้โดยชัดเจน)

Workspace hooks สามารถเพิ่มชื่อ hook ใหม่ได้ แต่ไม่สามารถแทนที่ bundled, managed หรือ hook ที่มาจาก plugin ที่มีชื่อเดียวกันได้

Gateway จะข้ามการค้นหา internal hooks ระหว่างเริ่มต้นระบบจนกว่าจะมีการกำหนดค่า internal hooks เปิดใช้งาน bundled หรือ managed hook ด้วย `openclaw hooks enable <name>`, ติดตั้ง hook pack หรือกำหนด `hooks.internal.enabled=true` เพื่อเปิดใช้ เมื่อคุณเปิดใช้งาน named hook หนึ่งตัว Gateway จะโหลดเฉพาะ handler ของ hook นั้น ส่วน `hooks.internal.enabled=true`, ไดเรกทอรี hook เพิ่มเติม และ legacy handlers จะเปิดใช้การค้นหาแบบกว้าง

### Hook packs

Hook packs คือแพ็กเกจ npm ที่ export hooks ผ่าน `openclaw.hooks` ใน `package.json` ติดตั้งด้วย:

```bash
openclaw plugins install <path-or-spec>
```

npm specs รองรับเฉพาะ registry เท่านั้น (ชื่อแพ็กเกจ + เวอร์ชันที่ระบุแน่นอนหรือ dist-tag แบบไม่บังคับ) ระบบจะปฏิเสธ Git/URL/file specs และช่วงเวอร์ชัน semver

## Bundled hooks

| Hook                  | เหตุการณ์                      | สิ่งที่ทำ                                              |
| --------------------- | ------------------------------ | ----------------------------------------------------- |
| session-memory        | `command:new`, `command:reset` | บันทึกบริบทเซสชันไปยัง `<workspace>/memory/`         |
| bootstrap-extra-files | `agent:bootstrap`              | ฉีดไฟล์ bootstrap เพิ่มเติมจากรูปแบบ glob            |
| command-logger        | `command`                      | บันทึกคำสั่งทั้งหมดลงใน `~/.openclaw/logs/commands.log` |
| boot-md               | `gateway:startup`              | เรียกใช้ `BOOT.md` เมื่อ gateway เริ่มทำงาน          |

เปิดใช้งาน bundled hook ใดก็ได้:

```bash
openclaw hooks enable <hook-name>
```

<a id="session-memory"></a>

### รายละเอียด session-memory

ดึงข้อความล่าสุด 15 รายการของผู้ใช้/assistant, สร้าง descriptive filename slug ผ่าน LLM และบันทึกไปยัง `<workspace>/memory/YYYY-MM-DD-slug.md` ต้องมีการกำหนดค่า `workspace.dir`

<a id="bootstrap-extra-files"></a>

### การกำหนดค่า bootstrap-extra-files

```json
{
  "hooks": {
    "internal": {
      "entries": {
        "bootstrap-extra-files": {
          "enabled": true,
          "paths": ["packages/*/AGENTS.md", "packages/*/TOOLS.md"]
        }
      }
    }
  }
}
```

พาธจะอ้างอิงเทียบกับ workspace ระบบจะโหลดเฉพาะชื่อไฟล์ bootstrap พื้นฐานที่รู้จักเท่านั้น (`AGENTS.md`, `SOUL.md`, `TOOLS.md`, `IDENTITY.md`, `USER.md`, `HEARTBEAT.md`, `BOOTSTRAP.md`, `MEMORY.md`)

<a id="command-logger"></a>

### รายละเอียด command-logger

บันทึกทุก slash command ลงใน `~/.openclaw/logs/commands.log`

<a id="boot-md"></a>

### รายละเอียด boot-md

เรียกใช้ `BOOT.md` จาก workspace ที่ใช้งานอยู่เมื่อ gateway เริ่มทำงาน

## Plugin hooks

Plugins สามารถลงทะเบียน hooks ผ่าน Plugin SDK เพื่อทำ integration ที่ลึกยิ่งขึ้นได้ เช่น ดักจับการเรียกใช้เครื่องมือ, ปรับเปลี่ยนพรอมป์ต์, ควบคุมการไหลของข้อความ และอื่นๆ Plugin SDK เปิดเผย hooks จำนวน 28 รายการ ครอบคลุมการ resolve model, วงจรชีวิตของเอเจนต์, การไหลของข้อความ, การทำงานของเครื่องมือ, การประสานงาน subagent และวงจรชีวิตของ gateway

สำหรับเอกสารอ้างอิง Plugin hook ฉบับสมบูรณ์ ซึ่งรวมถึง `before_tool_call`, `before_agent_reply`, `before_install` และ Plugin hooks อื่นๆ ทั้งหมด โปรดดู [Plugin Architecture](/th/plugins/architecture-internals#provider-runtime-hooks)

## การกำหนดค่า

```json
{
  "hooks": {
    "internal": {
      "enabled": true,
      "entries": {
        "session-memory": { "enabled": true },
        "command-logger": { "enabled": false }
      }
    }
  }
}
```

ตัวแปรสภาพแวดล้อมต่อ hook:

```json
{
  "hooks": {
    "internal": {
      "entries": {
        "my-hook": {
          "enabled": true,
          "env": { "MY_CUSTOM_VAR": "value" }
        }
      }
    }
  }
}
```

ไดเรกทอรี hook เพิ่มเติม:

```json
{
  "hooks": {
    "internal": {
      "load": {
        "extraDirs": ["/path/to/more/hooks"]
      }
    }
  }
}
```

<Note>
รูปแบบการกำหนดค่าอาร์เรย์ `hooks.internal.handlers` แบบเดิมยังคงรองรับเพื่อความเข้ากันได้ย้อนหลัง แต่ hook ใหม่ควรใช้ระบบแบบอิงการค้นพบ
</Note>

## ข้อมูลอ้างอิง CLI

```bash
# แสดง hooks ทั้งหมด (เพิ่ม --eligible, --verbose หรือ --json ได้)
openclaw hooks list

# แสดงข้อมูลโดยละเอียดเกี่ยวกับ hook
openclaw hooks info <hook-name>

# แสดงสรุปสิทธิ์การใช้งาน
openclaw hooks check

# เปิดใช้งาน/ปิดใช้งาน
openclaw hooks enable <hook-name>
openclaw hooks disable <hook-name>
```

## แนวทางปฏิบัติที่ดี

- **ทำให้ handlers ทำงานเร็ว** hooks จะทำงานระหว่างการประมวลผลคำสั่ง งานหนักควรทำแบบ fire-and-forget ด้วย `void processInBackground(event)`
- **จัดการข้อผิดพลาดอย่างเหมาะสม** ครอบการทำงานที่มีความเสี่ยงด้วย try/catch; อย่า throw เพื่อให้ handlers อื่นยังทำงานต่อได้
- **กรองเหตุการณ์ตั้งแต่เนิ่นๆ** return ทันทีหากประเภท/การกระทำของเหตุการณ์ไม่เกี่ยวข้อง
- **ใช้คีย์เหตุการณ์ที่เฉพาะเจาะจง** ควรใช้ `"events": ["command:new"]` แทน `"events": ["command"]` เพื่อลด overhead

## การแก้ปัญหา

### ไม่พบ hook

```bash
# ตรวจสอบโครงสร้างไดเรกทอรี
ls -la ~/.openclaw/hooks/my-hook/
# ควรแสดง: HOOK.md, handler.ts

# แสดง hooks ที่ค้นพบทั้งหมด
openclaw hooks list
```

### hook ไม่มีสิทธิ์ใช้งาน

```bash
openclaw hooks info my-hook
```

ตรวจสอบว่าไม่มี binary (PATH), ตัวแปรสภาพแวดล้อม, ค่า config หรือความเข้ากันได้ของระบบปฏิบัติการที่ขาดหายไป

### hook ไม่ทำงาน

1. ตรวจสอบว่า hook ถูกเปิดใช้งานแล้ว: `openclaw hooks list`
2. รีสตาร์ต process ของ gateway เพื่อให้ hooks โหลดใหม่
3. ตรวจสอบบันทึกของ gateway: `./scripts/clawlog.sh | grep hook`

## ที่เกี่ยวข้อง

- [CLI Reference: hooks](/th/cli/hooks)
- [Webhooks](/th/automation/cron-jobs#webhooks)
- [Plugin Architecture](/th/plugins/architecture-internals#provider-runtime-hooks) — เอกสารอ้างอิง Plugin hook ฉบับสมบูรณ์
- [Configuration](/th/gateway/configuration-reference#hooks)
