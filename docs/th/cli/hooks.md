---
read_when:
    - คุณต้องการจัดการ hook ของเอเจนต์
    - คุณต้องการตรวจสอบความพร้อมใช้งานของ hook หรือเปิดใช้ hook ของ workspace
summary: ข้อมูลอ้างอิง CLI สำหรับ `openclaw hooks` (hook ของเอเจนต์)
title: Hook
x-i18n:
    generated_at: "2026-04-24T09:02:53Z"
    model: gpt-5.4
    provider: openai
    source_hash: 84f209e90a5679b889112fc03e22ea94f486ded9db25b5238c0366283695a5b9
    source_path: cli/hooks.md
    workflow: 15
---

# `openclaw hooks`

จัดการ hook ของเอเจนต์ (ระบบอัตโนมัติแบบขับเคลื่อนด้วยเหตุการณ์สำหรับคำสั่งอย่าง `/new`, `/reset` และการเริ่มต้น gateway)

การรัน `openclaw hooks` โดยไม่ระบุ subcommand จะเทียบเท่ากับ `openclaw hooks list`

ที่เกี่ยวข้อง:

- Hook: [Hooks](/th/automation/hooks)
- Plugin hook: [Plugin hooks](/th/plugins/architecture-internals#provider-runtime-hooks)

## แสดงรายการ Hook ทั้งหมด

```bash
openclaw hooks list
```

แสดง hook ที่ค้นพบทั้งหมดจากไดเรกทอรี workspace, managed, extra และ bundled
การเริ่มต้น gateway จะไม่โหลด internal hook handler จนกว่าจะมีการกำหนดค่า internal hook อย่างน้อยหนึ่งรายการ

**ตัวเลือก:**

- `--eligible`: แสดงเฉพาะ hook ที่เข้าเกณฑ์ (ตรงตามข้อกำหนด)
- `--json`: แสดงผลเป็น JSON
- `-v, --verbose`: แสดงข้อมูลโดยละเอียด รวมถึงข้อกำหนดที่ยังขาดหาย

**ตัวอย่างผลลัพธ์:**

```
Hooks (4/4 ready)

Ready:
  🚀 boot-md ✓ - Run BOOT.md on gateway startup
  📎 bootstrap-extra-files ✓ - Inject extra workspace bootstrap files during agent bootstrap
  📝 command-logger ✓ - Log all command events to a centralized audit file
  💾 session-memory ✓ - Save session context to memory when /new or /reset command is issued
```

**ตัวอย่าง (verbose):**

```bash
openclaw hooks list --verbose
```

แสดงข้อกำหนดที่ยังขาดสำหรับ hook ที่ยังไม่เข้าเกณฑ์

**ตัวอย่าง (JSON):**

```bash
openclaw hooks list --json
```

ส่งคืน JSON แบบมีโครงสร้างสำหรับการใช้งานแบบเป็นโปรแกรม

## ดูข้อมูล Hook

```bash
openclaw hooks info <name>
```

แสดงข้อมูลโดยละเอียดของ hook ที่ระบุ

**อาร์กิวเมนต์:**

- `<name>`: ชื่อ hook หรือ hook key (เช่น `session-memory`)

**ตัวเลือก:**

- `--json`: แสดงผลเป็น JSON

**ตัวอย่าง:**

```bash
openclaw hooks info session-memory
```

**ผลลัพธ์:**

```
💾 session-memory ✓ Ready

Save session context to memory when /new or /reset command is issued

Details:
  Source: openclaw-bundled
  Path: /path/to/openclaw/hooks/bundled/session-memory/HOOK.md
  Handler: /path/to/openclaw/hooks/bundled/session-memory/handler.ts
  Homepage: https://docs.openclaw.ai/automation/hooks#session-memory
  Events: command:new, command:reset

Requirements:
  Config: ✓ workspace.dir
```

## ตรวจสอบคุณสมบัติการใช้งานของ Hook

```bash
openclaw hooks check
```

แสดงสรุปสถานะคุณสมบัติการใช้งานของ hook (มีกี่รายการที่พร้อมใช้เทียบกับยังไม่พร้อม)

**ตัวเลือก:**

- `--json`: แสดงผลเป็น JSON

**ตัวอย่างผลลัพธ์:**

```
Hooks Status

Total hooks: 4
Ready: 4
Not ready: 0
```

## เปิดใช้ Hook

```bash
openclaw hooks enable <name>
```

เปิดใช้ hook ที่ระบุโดยเพิ่มลงในคอนฟิกของคุณ (ค่าปริยายคือ `~/.openclaw/openclaw.json`)

**หมายเหตุ:** hook ของ workspace จะถูกปิดไว้เป็นค่าปริยายจนกว่าจะเปิดใช้ที่นี่หรือในคอนฟิก Hook ที่จัดการโดย Plugin จะแสดงเป็น `plugin:<id>` ใน `openclaw hooks list` และไม่สามารถเปิด/ปิดได้จากที่นี่ ให้เปิด/ปิด Plugin แทน

**อาร์กิวเมนต์:**

- `<name>`: ชื่อ hook (เช่น `session-memory`)

**ตัวอย่าง:**

```bash
openclaw hooks enable session-memory
```

**ผลลัพธ์:**

```
✓ Enabled hook: 💾 session-memory
```

**สิ่งที่จะเกิดขึ้น:**

- ตรวจสอบว่า hook มีอยู่และเข้าเกณฑ์ใช้งาน
- อัปเดต `hooks.internal.entries.<name>.enabled = true` ในคอนฟิกของคุณ
- บันทึกคอนฟิกลงดิสก์

หาก hook มาจาก `<workspace>/hooks/` ขั้นตอน opt-in นี้จำเป็นก่อน
ที่ Gateway จะโหลดมัน

**หลังจากเปิดใช้:**

- รีสตาร์ต gateway เพื่อ reload hook (รีสตาร์ตแอปเมนูบาร์บน macOS หรือรีสตาร์ตโพรเซส gateway ของคุณในโหมด dev)

## ปิดใช้ Hook

```bash
openclaw hooks disable <name>
```

ปิดใช้ hook ที่ระบุโดยอัปเดตคอนฟิกของคุณ

**อาร์กิวเมนต์:**

- `<name>`: ชื่อ hook (เช่น `command-logger`)

**ตัวอย่าง:**

```bash
openclaw hooks disable command-logger
```

**ผลลัพธ์:**

```
⏸ Disabled hook: 📝 command-logger
```

**หลังจากปิดใช้:**

- รีสตาร์ต gateway เพื่อ reload hook

## หมายเหตุ

- `openclaw hooks list --json`, `info --json` และ `check --json` จะเขียน JSON แบบมีโครงสร้างลง stdout โดยตรง
- hook ที่จัดการโดย Plugin ไม่สามารถเปิดหรือปิดได้ที่นี่; ให้เปิดหรือปิด Plugin เจ้าของแทน

## ติดตั้ง Hook Pack

```bash
openclaw plugins install <package>        # ClawHub ก่อน แล้วค่อย npm
openclaw plugins install <package> --pin  # ปักหมุดเวอร์ชัน
openclaw plugins install <path>           # พาธในเครื่อง
```

ติดตั้ง hook pack ผ่านตัวติดตั้ง Plugin แบบรวมศูนย์

`openclaw hooks install` ยังใช้งานได้ในฐานะ alias เพื่อความเข้ากันได้ แต่จะแสดง
คำเตือนว่าเลิกใช้แล้ว และส่งต่อไปยัง `openclaw plugins install`

สเปก npm เป็นแบบ **registry-only** (ชื่อแพ็กเกจ + **เวอร์ชันแบบ exact** หรือ
**dist-tag** แบบไม่บังคับ) ระบบจะปฏิเสธสเปกแบบ Git/URL/file และช่วง semver
การติดตั้ง dependency จะรันด้วย `--ignore-scripts` เพื่อความปลอดภัย

สเปกแบบเปล่าและ `@latest` จะคงอยู่บนเส้นทาง stable หาก npm resolve สองแบบนี้
ไปเป็น prerelease OpenClaw จะหยุดและขอให้คุณ opt in อย่างชัดเจนด้วย
แท็ก prerelease เช่น `@beta`/`@rc` หรือเวอร์ชัน prerelease แบบ exact

**สิ่งที่จะเกิดขึ้น:**

- คัดลอก hook pack ไปที่ `~/.openclaw/hooks/<id>`
- เปิดใช้ hook ที่ติดตั้งแล้วใน `hooks.internal.entries.*`
- บันทึกการติดตั้งไว้ใน `hooks.internal.installs`

**ตัวเลือก:**

- `-l, --link`: ลิงก์ไดเรกทอรีในเครื่องแทนการคัดลอก (เพิ่มลงใน `hooks.internal.load.extraDirs`)
- `--pin`: บันทึกการติดตั้งจาก npm เป็น `name@version` แบบ exact ที่ resolve แล้วใน `hooks.internal.installs`

**ไฟล์เก็บถาวรที่รองรับ:** `.zip`, `.tgz`, `.tar.gz`, `.tar`

**ตัวอย่าง:**

```bash
# ไดเรกทอรีในเครื่อง
openclaw plugins install ./my-hook-pack

# ไฟล์เก็บถาวรในเครื่อง
openclaw plugins install ./my-hook-pack.zip

# แพ็กเกจ NPM
openclaw plugins install @openclaw/my-hook-pack

# ลิงก์ไดเรกทอรีในเครื่องโดยไม่คัดลอก
openclaw plugins install -l ./my-hook-pack
```

hook pack ที่ลิงก์ไว้จะถูกมองว่าเป็น hook แบบ managed จากไดเรกทอรี
ที่ผู้ดูแลกำหนดค่าไว้ ไม่ใช่ hook ของ workspace

## อัปเดต Hook Pack

```bash
openclaw plugins update <id>
openclaw plugins update --all
```

อัปเดต hook pack ที่ติดตามจาก npm ผ่านตัวอัปเดต Plugin แบบรวมศูนย์

`openclaw hooks update` ยังใช้งานได้ในฐานะ alias เพื่อความเข้ากันได้ แต่จะแสดง
คำเตือนว่าเลิกใช้แล้ว และส่งต่อไปยัง `openclaw plugins update`

**ตัวเลือก:**

- `--all`: อัปเดต hook pack ที่ติดตามทั้งหมด
- `--dry-run`: แสดงสิ่งที่จะเปลี่ยนโดยไม่เขียนข้อมูล

เมื่อมี stored integrity hash อยู่แล้ว และ hash ของ artifact ที่ดึงมาเปลี่ยนไป
OpenClaw จะแสดงคำเตือนและขอการยืนยันก่อนดำเนินการต่อ ใช้ `--yes`
แบบ global เพื่อข้ามพรอมป์ในการรัน CI/แบบไม่โต้ตอบ

## Hook ที่มาพร้อมระบบ

### session-memory

บันทึกบริบทของเซสชันลงใน memory เมื่อคุณใช้ `/new` หรือ `/reset`

**เปิดใช้:**

```bash
openclaw hooks enable session-memory
```

**ผลลัพธ์:** `~/.openclaw/workspace/memory/YYYY-MM-DD-slug.md`

**ดูเพิ่มเติม:** [เอกสาร session-memory](/th/automation/hooks#session-memory)

### bootstrap-extra-files

แทรกไฟล์ bootstrap เพิ่มเติม (เช่น `AGENTS.md` / `TOOLS.md` เฉพาะ monorepo) ระหว่าง `agent:bootstrap`

**เปิดใช้:**

```bash
openclaw hooks enable bootstrap-extra-files
```

**ดูเพิ่มเติม:** [เอกสาร bootstrap-extra-files](/th/automation/hooks#bootstrap-extra-files)

### command-logger

บันทึกเหตุการณ์คำสั่งทั้งหมดไปยังไฟล์ audit ส่วนกลาง

**เปิดใช้:**

```bash
openclaw hooks enable command-logger
```

**ผลลัพธ์:** `~/.openclaw/logs/commands.log`

**ดูบันทึก:**

```bash
# คำสั่งล่าสุด
tail -n 20 ~/.openclaw/logs/commands.log

# แสดงผลแบบอ่านง่าย
cat ~/.openclaw/logs/commands.log | jq .

# กรองตาม action
grep '"action":"new"' ~/.openclaw/logs/commands.log | jq .
```

**ดูเพิ่มเติม:** [เอกสาร command-logger](/th/automation/hooks#command-logger)

### boot-md

รัน `BOOT.md` เมื่อ gateway เริ่มทำงาน (หลังจากช่องทางเริ่มแล้ว)

**เหตุการณ์**: `gateway:startup`

**เปิดใช้**:

```bash
openclaw hooks enable boot-md
```

**ดูเพิ่มเติม:** [เอกสาร boot-md](/th/automation/hooks#boot-md)

## ที่เกี่ยวข้อง

- [ข้อมูลอ้างอิง CLI](/th/cli)
- [Automation hooks](/th/automation/hooks)
