---
read_when:
    - คุณต้องการจัดการ hooks ของเอเจนต์
    - คุณต้องการตรวจสอบความพร้อมใช้งานของ hook หรือเปิดใช้งาน workspace hooks
summary: ข้อมูลอ้างอิง CLI สำหรับ `openclaw hooks` (hooks ของเอเจนต์)
title: Hooks
x-i18n:
    generated_at: "2026-04-23T06:18:09Z"
    model: gpt-5.4
    provider: openai
    source_hash: a09978267783734aaf9bd8bf36aa365ca680a3652afb904db2e5b55dfa64dcd1
    source_path: cli/hooks.md
    workflow: 15
---

# `openclaw hooks`

จัดการ hooks ของเอเจนต์ (ระบบอัตโนมัติแบบขับเคลื่อนด้วยเหตุการณ์สำหรับคำสั่งอย่าง `/new`, `/reset` และการเริ่มต้น Gateway)

การรัน `openclaw hooks` โดยไม่ระบุคำสั่งย่อยจะเทียบเท่ากับ `openclaw hooks list`

ที่เกี่ยวข้อง:

- Hooks: [Hooks](/th/automation/hooks)
- Plugin hooks: [Plugin hooks](/th/plugins/architecture#provider-runtime-hooks)

## แสดง Hooks ทั้งหมด

```bash
openclaw hooks list
```

แสดง hooks ที่ค้นพบทั้งหมดจากไดเรกทอรี workspace, managed, extra และ bundled
การเริ่มต้น Gateway จะไม่โหลดตัวจัดการ hook ภายในจนกว่าจะมีการกำหนดค่า internal hook อย่างน้อยหนึ่งรายการ

**ตัวเลือก:**

- `--eligible`: แสดงเฉพาะ hooks ที่พร้อมใช้งาน (ตรงตามข้อกำหนด)
- `--json`: แสดงผลเป็น JSON
- `-v, --verbose`: แสดงข้อมูลโดยละเอียดรวมถึงข้อกำหนดที่ขาดหายไป

**ตัวอย่างเอาต์พุต:**

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

แสดงข้อกำหนดที่ขาดหายไปสำหรับ hooks ที่ยังไม่พร้อมใช้งาน

**ตัวอย่าง (JSON):**

```bash
openclaw hooks list --json
```

ส่งคืน JSON แบบมีโครงสร้างสำหรับการใช้งานเชิงโปรแกรม

## ดูข้อมูล Hook

```bash
openclaw hooks info <name>
```

แสดงข้อมูลโดยละเอียดของ hook ที่ระบุ

**อาร์กิวเมนต์:**

- `<name>`: ชื่อ hook หรือคีย์ของ hook (เช่น `session-memory`)

**ตัวเลือก:**

- `--json`: แสดงผลเป็น JSON

**ตัวอย่าง:**

```bash
openclaw hooks info session-memory
```

**เอาต์พุต:**

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

## ตรวจสอบความพร้อมของ Hooks

```bash
openclaw hooks check
```

แสดงสรุปสถานะความพร้อมของ hook (พร้อมใช้งานกี่รายการ เทียบกับยังไม่พร้อมกี่รายการ)

**ตัวเลือก:**

- `--json`: แสดงผลเป็น JSON

**ตัวอย่างเอาต์พุต:**

```
Hooks Status

Total hooks: 4
Ready: 4
Not ready: 0
```

## เปิดใช้งาน Hook

```bash
openclaw hooks enable <name>
```

เปิดใช้งาน hook ที่ระบุโดยเพิ่มเข้าไปใน config ของคุณ (ค่าเริ่มต้นคือ `~/.openclaw/openclaw.json`)

**หมายเหตุ:** workspace hooks จะถูกปิดใช้งานเป็นค่าเริ่มต้นจนกว่าจะเปิดใช้งานที่นี่หรือใน config hooks ที่จัดการโดย Plugin จะแสดง `plugin:<id>` ใน `openclaw hooks list` และไม่สามารถเปิด/ปิดใช้งานได้จากที่นี่ ให้เปิด/ปิดใช้งาน Plugin นั้นแทน

**อาร์กิวเมนต์:**

- `<name>`: ชื่อ hook (เช่น `session-memory`)

**ตัวอย่าง:**

```bash
openclaw hooks enable session-memory
```

**เอาต์พุต:**

```
✓ Enabled hook: 💾 session-memory
```

**สิ่งที่ทำ:**

- ตรวจสอบว่า hook มีอยู่และพร้อมใช้งาน
- อัปเดต `hooks.internal.entries.<name>.enabled = true` ใน config ของคุณ
- บันทึก config ลงดิสก์

หาก hook มาจาก `<workspace>/hooks/` ต้องมีขั้นตอน opt-in นี้ก่อน
Gateway จึงจะโหลดมันได้

**หลังจากเปิดใช้งาน:**

- รีสตาร์ท gateway เพื่อให้ hooks โหลดใหม่ (รีสตาร์ทแอปเมนูบาร์บน macOS หรือรีสตาร์ทโปรเซส gateway ของคุณในโหมด dev)

## ปิดใช้งาน Hook

```bash
openclaw hooks disable <name>
```

ปิดใช้งาน hook ที่ระบุโดยอัปเดต config ของคุณ

**อาร์กิวเมนต์:**

- `<name>`: ชื่อ hook (เช่น `command-logger`)

**ตัวอย่าง:**

```bash
openclaw hooks disable command-logger
```

**เอาต์พุต:**

```
⏸ Disabled hook: 📝 command-logger
```

**หลังจากปิดใช้งาน:**

- รีสตาร์ท gateway เพื่อให้ hooks โหลดใหม่

## หมายเหตุ

- `openclaw hooks list --json`, `info --json` และ `check --json` จะเขียน JSON แบบมีโครงสร้างลง stdout โดยตรง
- hooks ที่จัดการโดย Plugin ไม่สามารถเปิดหรือปิดใช้งานได้จากที่นี่; ให้เปิดหรือปิดใช้งาน Plugin เจ้าของแทน

## ติดตั้ง Hook Packs

```bash
openclaw plugins install <package>        # ClawHub ก่อน แล้วจึง npm
openclaw plugins install <package> --pin  # ตรึงเวอร์ชัน
openclaw plugins install <path>           # พาธในเครื่อง
```

ติดตั้ง hook packs ผ่านตัวติดตั้ง plugins แบบรวมศูนย์

`openclaw hooks install` ยังใช้ได้ในฐานะนามแฝงเพื่อความเข้ากันได้ แต่จะพิมพ์
คำเตือนการเลิกใช้งานและส่งต่อไปยัง `openclaw plugins install`

สเปก npm เป็นแบบ **registry-only** (ชื่อแพ็กเกจ + **เวอร์ชันแบบตรงตัว** หรือ
**dist-tag** แบบไม่บังคับ) ระบบจะปฏิเสธสเปกแบบ Git/URL/file และช่วง semver
การติดตั้ง dependency จะรันพร้อม `--ignore-scripts` เพื่อความปลอดภัย

สเปกเปล่าและ `@latest` จะอยู่ในสายเสถียร หาก npm resolve อย่างใดอย่างหนึ่ง
เหล่านั้นไปเป็นรุ่น prerelease, OpenClaw จะหยุดและขอให้คุณ opt in อย่างชัดเจนด้วย
แท็ก prerelease เช่น `@beta`/`@rc` หรือเวอร์ชัน prerelease แบบตรงตัว

**สิ่งที่ทำ:**

- คัดลอก hook pack ไปยัง `~/.openclaw/hooks/<id>`
- เปิดใช้งาน hooks ที่ติดตั้งใน `hooks.internal.entries.*`
- บันทึกการติดตั้งไว้ภายใต้ `hooks.internal.installs`

**ตัวเลือก:**

- `-l, --link`: ลิงก์ไดเรกทอรีในเครื่องแทนการคัดลอก (เพิ่มเข้าไปใน `hooks.internal.load.extraDirs`)
- `--pin`: บันทึกการติดตั้ง npm เป็น `name@version` ที่ resolve แล้วแบบตรงตัวใน `hooks.internal.installs`

**ไฟล์บีบอัดที่รองรับ:** `.zip`, `.tgz`, `.tar.gz`, `.tar`

**ตัวอย่าง:**

```bash
# ไดเรกทอรีในเครื่อง
openclaw plugins install ./my-hook-pack

# ไฟล์บีบอัดในเครื่อง
openclaw plugins install ./my-hook-pack.zip

# แพ็กเกจ NPM
openclaw plugins install @openclaw/my-hook-pack

# ลิงก์ไดเรกทอรีในเครื่องโดยไม่คัดลอก
openclaw plugins install -l ./my-hook-pack
```

hook packs ที่ลิงก์ไว้จะถือเป็น managed hooks จากไดเรกทอรี
ที่ผู้ดูแลระบบกำหนดค่าไว้ ไม่ใช่ workspace hooks

## อัปเดต Hook Packs

```bash
openclaw plugins update <id>
openclaw plugins update --all
```

อัปเดต hook packs แบบ npm ที่ติดตามไว้ผ่านตัวอัปเดต plugins แบบรวมศูนย์

`openclaw hooks update` ยังใช้ได้ในฐานะนามแฝงเพื่อความเข้ากันได้ แต่จะพิมพ์
คำเตือนการเลิกใช้งานและส่งต่อไปยัง `openclaw plugins update`

**ตัวเลือก:**

- `--all`: อัปเดต hook packs ที่ติดตามไว้ทั้งหมด
- `--dry-run`: แสดงสิ่งที่จะเปลี่ยนโดยไม่เขียนข้อมูล

เมื่อมีแฮชความถูกต้องที่บันทึกไว้และแฮชของอาร์ติแฟกต์ที่ดึงมาเปลี่ยนไป
OpenClaw จะพิมพ์คำเตือนและขอการยืนยันก่อนดำเนินการต่อ ใช้
`--yes` แบบ global เพื่อข้ามพร้อมท์ใน CI/การรันแบบไม่โต้ตอบ

## Bundled Hooks

### session-memory

บันทึกบริบทของเซสชันลงหน่วยความจำเมื่อคุณใช้ `/new` หรือ `/reset`

**เปิดใช้งาน:**

```bash
openclaw hooks enable session-memory
```

**เอาต์พุต:** `~/.openclaw/workspace/memory/YYYY-MM-DD-slug.md`

**ดูเพิ่มเติม:** [เอกสาร session-memory](/th/automation/hooks#session-memory)

### bootstrap-extra-files

แทรกไฟล์ bootstrap เพิ่มเติม (เช่น `AGENTS.md` / `TOOLS.md` ภายใน monorepo) ระหว่าง `agent:bootstrap`

**เปิดใช้งาน:**

```bash
openclaw hooks enable bootstrap-extra-files
```

**ดูเพิ่มเติม:** [เอกสาร bootstrap-extra-files](/th/automation/hooks#bootstrap-extra-files)

### command-logger

บันทึกเหตุการณ์คำสั่งทั้งหมดลงในไฟล์ audit ส่วนกลาง

**เปิดใช้งาน:**

```bash
openclaw hooks enable command-logger
```

**เอาต์พุต:** `~/.openclaw/logs/commands.log`

**ดูบันทึก:**

```bash
# คำสั่งล่าสุด
tail -n 20 ~/.openclaw/logs/commands.log

# แสดงผลให้อ่านง่าย
cat ~/.openclaw/logs/commands.log | jq .

# กรองตาม action
grep '"action":"new"' ~/.openclaw/logs/commands.log | jq .
```

**ดูเพิ่มเติม:** [เอกสาร command-logger](/th/automation/hooks#command-logger)

### boot-md

รัน `BOOT.md` เมื่อ gateway เริ่มต้น (หลังจาก channels เริ่มทำงานแล้ว)

**เหตุการณ์**: `gateway:startup`

**เปิดใช้งาน**:

```bash
openclaw hooks enable boot-md
```

**ดูเพิ่มเติม:** [เอกสาร boot-md](/th/automation/hooks#boot-md)
