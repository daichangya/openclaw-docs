---
read_when:
    - คุณต้องการการทำงานอัตโนมัติแบบขับเคลื่อนด้วยเหตุการณ์สำหรับ /new, /reset, /stop และเหตุการณ์ในวงจรชีวิตของเอเจนต์
    - คุณต้องการสร้าง ติดตั้ง หรือดีบักฮุก
summary: 'Hooks: การทำงานอัตโนมัติแบบขับเคลื่อนด้วยเหตุการณ์สำหรับคำสั่งและเหตุการณ์ในวงจรชีวิต'
title: ฮุก
x-i18n:
    generated_at: "2026-04-23T05:24:35Z"
    model: gpt-5.4
    provider: openai
    source_hash: 5269c3ca3a45d23d79232e041c0980ecaab93fd6f0f1e39e0b2a76cb4c8b5c8b
    source_path: automation/hooks.md
    workflow: 15
---

# ฮุก

ฮุกคือสคริปต์ขนาดเล็กที่ทำงานเมื่อมีบางอย่างเกิดขึ้นภายใน Gateway สามารถค้นพบได้จากไดเรกทอรีต่างๆ และตรวจสอบได้ด้วย `openclaw hooks` Gateway จะโหลด internal hooks ก็ต่อเมื่อคุณเปิดใช้งาน hooks หรือกำหนดค่าอย่างน้อยหนึ่งรายการของ hook entry, hook pack, legacy handler หรือ extra hook directory เท่านั้น

ใน OpenClaw มีฮุกอยู่สองประเภท:

- **Internal hooks** (หน้านี้): ทำงานภายใน Gateway เมื่อเกิดเหตุการณ์ของเอเจนต์ เช่น `/new`, `/reset`, `/stop` หรือเหตุการณ์ในวงจรชีวิต
- **Webhooks**: ปลายทาง HTTP ภายนอกที่เปิดให้ระบบอื่นทริกเกอร์งานใน OpenClaw ได้ ดู [Webhooks](/th/automation/cron-jobs#webhooks)

ฮุกยังสามารถรวมมากับ Plugin ได้ด้วย `openclaw hooks list` จะแสดงทั้งฮุกแบบสแตนด์อโลนและฮุกที่จัดการโดย Plugin

## เริ่มต้นอย่างรวดเร็ว

```bash
# แสดงรายการฮุกที่มีอยู่
openclaw hooks list

# เปิดใช้งานฮุก
openclaw hooks enable session-memory

# ตรวจสอบสถานะฮุก
openclaw hooks check

# ดูข้อมูลแบบละเอียด
openclaw hooks info session-memory
```

## ประเภทเหตุการณ์

| เหตุการณ์                | เวลาที่ถูกเรียกใช้                              |
| ------------------------ | ----------------------------------------------- |
| `command:new`            | มีการใช้คำสั่ง `/new`                           |
| `command:reset`          | มีการใช้คำสั่ง `/reset`                         |
| `command:stop`           | มีการใช้คำสั่ง `/stop`                          |
| `command`                | เหตุการณ์คำสั่งใดๆ (ตัวรับฟังทั่วไป)           |
| `session:compact:before` | ก่อนที่ Compaction จะสรุปประวัติ                |
| `session:compact:after`  | หลังจาก Compaction เสร็จสมบูรณ์                 |
| `session:patch`          | เมื่อมีการแก้ไขพร็อพเพอร์ตีของเซสชัน          |
| `agent:bootstrap`        | ก่อนจะ inject ไฟล์ bootstrap ของ workspace      |
| `gateway:startup`        | หลังจากเริ่ม channels และโหลดฮุกแล้ว           |
| `message:received`       | ข้อความขาเข้าจาก channel ใดก็ได้               |
| `message:transcribed`    | หลังจากการถอดเสียงจากเสียงเสร็จสมบูรณ์        |
| `message:preprocessed`   | หลังจากการทำความเข้าใจสื่อและลิงก์เสร็จทั้งหมด |
| `message:sent`           | ส่งข้อความขาออกสำเร็จแล้ว                      |

## การเขียนฮุก

### โครงสร้างฮุก

แต่ละฮุกเป็นไดเรกทอรีที่มีสองไฟล์:

```
my-hook/
├── HOOK.md          # ข้อมูลเมตา + เอกสารประกอบ
└── handler.ts       # การทำงานของ handler
```

### รูปแบบ HOOK.md

```markdown
---
name: my-hook
description: "Short description of what this hook does"
metadata:
  { "openclaw": { "emoji": "🔗", "events": ["command:new"], "requires": { "bins": ["node"] } } }
---

# My Hook

Detailed documentation goes here.
```

**ฟิลด์ข้อมูลเมตา** (`metadata.openclaw`):

| ฟิลด์      | คำอธิบาย                                             |
| ---------- | ---------------------------------------------------- |
| `emoji`    | อีโมจิที่ใช้แสดงใน CLI                              |
| `events`   | อาร์เรย์ของเหตุการณ์ที่ต้องการรับฟัง                |
| `export`   | named export ที่จะใช้ (ค่าเริ่มต้นคือ `"default"`)  |
| `os`       | แพลตฟอร์มที่ต้องใช้ (เช่น `["darwin", "linux"]`)    |
| `requires` | `bins`, `anyBins`, `env` หรือพาธ `config` ที่จำเป็น |
| `always`   | ข้ามการตรวจสอบสิทธิ์การใช้งาน (boolean)            |
| `install`  | วิธีการติดตั้ง                                        |

### การทำงานของ handler

```typescript
const handler = async (event) => {
  if (event.type !== "command" || event.action !== "new") {
    return;
  }

  console.log(`[my-hook] New command triggered`);
  // Your logic here

  // Optionally send message to user
  event.messages.push("Hook executed!");
};

export default handler;
```

แต่ละเหตุการณ์ประกอบด้วย: `type`, `action`, `sessionKey`, `timestamp`, `messages` (push เพื่อส่งให้ผู้ใช้), และ `context` (ข้อมูลเฉพาะของเหตุการณ์)

### จุดสำคัญของ context ในเหตุการณ์

**เหตุการณ์คำสั่ง** (`command:new`, `command:reset`): `context.sessionEntry`, `context.previousSessionEntry`, `context.commandSource`, `context.workspaceDir`, `context.cfg`

**เหตุการณ์ข้อความ** (`message:received`): `context.from`, `context.content`, `context.channelId`, `context.metadata` (ข้อมูลเฉพาะของผู้ให้บริการ รวมถึง `senderId`, `senderName`, `guildId`)

**เหตุการณ์ข้อความ** (`message:sent`): `context.to`, `context.content`, `context.success`, `context.channelId`

**เหตุการณ์ข้อความ** (`message:transcribed`): `context.transcript`, `context.from`, `context.channelId`, `context.mediaPath`

**เหตุการณ์ข้อความ** (`message:preprocessed`): `context.bodyForAgent` (เนื้อหาสุดท้ายที่เสริมข้อมูลแล้ว), `context.from`, `context.channelId`

**เหตุการณ์ Bootstrap** (`agent:bootstrap`): `context.bootstrapFiles` (อาร์เรย์ที่แก้ไขได้), `context.agentId`

**เหตุการณ์ patch ของเซสชัน** (`session:patch`): `context.sessionEntry`, `context.patch` (เฉพาะฟิลด์ที่เปลี่ยน), `context.cfg` มีเพียงไคลเอนต์ที่มีสิทธิพิเศษเท่านั้นที่ทริกเกอร์เหตุการณ์ patch ได้

**เหตุการณ์ Compaction**: `session:compact:before` มี `messageCount`, `tokenCount` ส่วน `session:compact:after` จะเพิ่ม `compactedCount`, `summaryLength`, `tokensBefore`, `tokensAfter`

## การค้นพบฮุก

ระบบจะค้นพบฮุกจากไดเรกทอรีเหล่านี้ โดยเรียงตามลำดับสิทธิ์การ override จากน้อยไปมาก:

1. **Bundled hooks**: มาพร้อมกับ OpenClaw
2. **Plugin hooks**: ฮุกที่รวมมากับ Plugin ที่ติดตั้งไว้
3. **Managed hooks**: `~/.openclaw/hooks/` (ติดตั้งโดยผู้ใช้ ใช้ร่วมกันข้าม workspaces) ไดเรกทอรีเพิ่มเติมจาก `hooks.internal.load.extraDirs` ใช้ลำดับสิทธิ์เดียวกันนี้
4. **Workspace hooks**: `<workspace>/hooks/` (ต่อเอเจนต์หนึ่งตัว ปิดไว้ตามค่าเริ่มต้นจนกว่าจะเปิดใช้งานอย่างชัดเจน)

Workspace hooks สามารถเพิ่มชื่อฮุกใหม่ได้ แต่ไม่สามารถ override bundled, managed หรือฮุกจาก Plugin ที่ใช้ชื่อเดียวกันได้

Gateway จะข้ามการค้นหา internal hook ระหว่างเริ่มระบบจนกว่าจะมีการกำหนดค่า internal hooks เปิดใช้ bundled หรือ managed hook ด้วย `openclaw hooks enable <name>`, ติดตั้ง hook pack หรือกำหนด `hooks.internal.enabled=true` เพื่อเลือกใช้งาน เมื่อคุณเปิดใช้งาน named hook หนึ่งตัว Gateway จะโหลดเฉพาะ handler ของฮุกนั้นเท่านั้น ส่วน `hooks.internal.enabled=true`, extra hook directories และ legacy handlers จะเป็นการเลือกใช้การค้นหาแบบกว้าง

### Hook packs

Hook pack คือแพ็กเกจ npm ที่ export ฮุกผ่าน `openclaw.hooks` ใน `package.json` ติดตั้งได้ด้วย:

```bash
openclaw plugins install <path-or-spec>
```

npm spec รองรับเฉพาะ registry เท่านั้น (ชื่อแพ็กเกจ + เวอร์ชันแบบ exact หรือ dist-tag ที่เป็นทางเลือก) ระบบจะปฏิเสธ Git/URL/file spec และ semver range

## Bundled hooks

| ฮุก                   | เหตุการณ์                       | สิ่งที่ทำ                                                |
| --------------------- | ------------------------------ | ------------------------------------------------------- |
| session-memory        | `command:new`, `command:reset` | บันทึกบริบทของเซสชันไปที่ `<workspace>/memory/`         |
| bootstrap-extra-files | `agent:bootstrap`              | inject ไฟล์ bootstrap เพิ่มเติมจากรูปแบบ glob          |
| command-logger        | `command`                      | บันทึกทุกคำสั่งไปที่ `~/.openclaw/logs/commands.log`    |
| boot-md               | `gateway:startup`              | เรียกใช้ `BOOT.md` เมื่อ Gateway เริ่มต้น                |

เปิดใช้งาน bundled hook ใดก็ได้:

```bash
openclaw hooks enable <hook-name>
```

<a id="session-memory"></a>

### รายละเอียด session-memory

ดึงข้อความล่าสุด 15 ข้อความของผู้ใช้/ผู้ช่วย สร้าง slug ชื่อไฟล์เชิงบรรยายผ่าน LLM แล้วบันทึกไปที่ `<workspace>/memory/YYYY-MM-DD-slug.md` ต้องกำหนดค่า `workspace.dir` ไว้

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

พาธจะอ้างอิงสัมพันธ์กับ workspace ระบบจะโหลดเฉพาะชื่อไฟล์ bootstrap พื้นฐานที่รู้จักเท่านั้น (`AGENTS.md`, `SOUL.md`, `TOOLS.md`, `IDENTITY.md`, `USER.md`, `HEARTBEAT.md`, `BOOTSTRAP.md`, `MEMORY.md`)

<a id="command-logger"></a>

### รายละเอียด command-logger

บันทึกทุก slash command ไปที่ `~/.openclaw/logs/commands.log`

<a id="boot-md"></a>

### รายละเอียด boot-md

เรียกใช้ `BOOT.md` จาก workspace ที่กำลังใช้งานอยู่เมื่อ Gateway เริ่มต้น

## Plugin hooks

Plugin สามารถลงทะเบียนฮุกผ่าน Plugin SDK เพื่อการผสานรวมที่ลึกขึ้นได้ เช่น ดักจับการเรียกใช้เครื่องมือ ปรับเปลี่ยนพรอมป์ต์ ควบคุมการไหลของข้อความ และอื่นๆ Plugin SDK เปิดให้ใช้ฮุก 28 รายการ ครอบคลุมการกำหนดโมเดล วงจรชีวิตของเอเจนต์ การไหลของข้อความ การทำงานของเครื่องมือ การประสานงาน subagent และวงจรชีวิตของ Gateway

สำหรับเอกสารอ้างอิงฮุกของ Plugin แบบครบถ้วน รวมถึง `before_tool_call`, `before_agent_reply`, `before_install` และฮุกอื่นๆ ทั้งหมดของ Plugin ดูได้ที่ [Plugin Architecture](/th/plugins/architecture#provider-runtime-hooks)

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

ตัวแปรสภาพแวดล้อมต่อฮุก:

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

ไดเรกทอรีฮุกเพิ่มเติม:

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
ยังรองรับรูปแบบ config แบบอาร์เรย์ `hooks.internal.handlers` รุ่นเดิมเพื่อความเข้ากันได้ย้อนหลัง แต่ฮุกใหม่ควรใช้ระบบที่อิงการค้นพบ
</Note>

## เอกสารอ้างอิง CLI

```bash
# แสดงรายการฮุกทั้งหมด (เพิ่ม --eligible, --verbose หรือ --json ได้)
openclaw hooks list

# แสดงข้อมูลแบบละเอียดของฮุก
openclaw hooks info <hook-name>

# แสดงสรุปสิทธิ์การใช้งาน
openclaw hooks check

# เปิด/ปิดใช้งาน
openclaw hooks enable <hook-name>
openclaw hooks disable <hook-name>
```

## แนวทางปฏิบัติที่แนะนำ

- **ให้ handler ทำงานเร็ว** ฮุกจะทำงานระหว่างการประมวลผลคำสั่ง หากเป็นงานหนักให้เรียกแบบ fire-and-forget ด้วย `void processInBackground(event)`
- **จัดการข้อผิดพลาดอย่างเหมาะสม** ครอบการทำงานที่เสี่ยงด้วย try/catch; อย่า throw เพื่อให้ handler อื่นยังทำงานต่อได้
- **กรองเหตุการณ์ตั้งแต่ต้น** ให้ return ทันทีถ้าประเภท/การกระทำของเหตุการณ์ไม่เกี่ยวข้อง
- **ใช้คีย์เหตุการณ์แบบเจาะจง** ควรใช้ `"events": ["command:new"]` แทน `"events": ["command"]` เพื่อลด overhead

## การแก้ปัญหา

### ไม่พบฮุก

```bash
# ตรวจสอบโครงสร้างไดเรกทอรี
ls -la ~/.openclaw/hooks/my-hook/
# ควรแสดง: HOOK.md, handler.ts

# แสดงรายการฮุกที่ค้นพบทั้งหมด
openclaw hooks list
```

### ฮุกไม่มีสิทธิ์ใช้งาน

```bash
openclaw hooks info my-hook
```

ตรวจสอบว่าไม่มีไบนารีหายไป (PATH), ตัวแปรสภาพแวดล้อม, ค่า config หรือความเข้ากันได้ของระบบปฏิบัติการ

### ฮุกไม่ทำงาน

1. ตรวจสอบว่าฮุกถูกเปิดใช้งานอยู่: `openclaw hooks list`
2. เริ่มกระบวนการ Gateway ใหม่เพื่อให้ฮุกถูกโหลดใหม่
3. ตรวจสอบบันทึกของ Gateway: `./scripts/clawlog.sh | grep hook`

## ที่เกี่ยวข้อง

- [CLI Reference: hooks](/cli/hooks)
- [Webhooks](/th/automation/cron-jobs#webhooks)
- [Plugin Architecture](/th/plugins/architecture#provider-runtime-hooks) — เอกสารอ้างอิงฮุกของ Plugin แบบครบถ้วน
- [Configuration](/th/gateway/configuration-reference#hooks)
