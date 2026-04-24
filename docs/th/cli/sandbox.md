---
read_when: You are managing sandbox runtimes or debugging sandbox/tool-policy behavior.
status: active
summary: จัดการ sandbox runtimes และตรวจสอบนโยบาย sandbox ที่มีผลจริง
title: CLI ของ Sandbox
x-i18n:
    generated_at: "2026-04-24T09:04:06Z"
    model: gpt-5.4
    provider: openai
    source_hash: 4f2b5835968faac0a8243fd6eadfcecb51b211fe7b346454e215312b1b6d5e65
    source_path: cli/sandbox.md
    workflow: 15
---

จัดการ sandbox runtimes สำหรับการรันเอเจนต์แบบแยกส่วน

## ภาพรวม

OpenClaw สามารถรันเอเจนต์ใน sandbox runtimes แบบแยกส่วนเพื่อความปลอดภัย คำสั่ง `sandbox` ช่วยให้คุณตรวจสอบและสร้าง runtimes เหล่านั้นใหม่หลังการอัปเดตหรือการเปลี่ยนแปลงคอนฟิก

ปัจจุบันโดยทั่วไปหมายถึง:

- คอนเทนเนอร์ Docker sandbox
- SSH sandbox runtimes เมื่อ `agents.defaults.sandbox.backend = "ssh"`
- OpenShell sandbox runtimes เมื่อ `agents.defaults.sandbox.backend = "openshell"`

สำหรับ `ssh` และ OpenShell `remote` การสร้างใหม่สำคัญกว่ากรณี Docker:

- workspace ระยะไกลเป็นข้อมูลหลักหลังจากการ seed ครั้งแรก
- `openclaw sandbox recreate` จะลบ workspace ระยะไกลหลักนั้นสำหรับขอบเขตที่เลือก
- การใช้งานครั้งถัดไปจะ seed ใหม่อีกครั้งจาก workspace ในเครื่องปัจจุบัน

## คำสั่ง

### `openclaw sandbox explain`

ตรวจสอบโหมด/scope/การเข้าถึง workspace ของ sandbox ที่**มีผลจริง** นโยบายเครื่องมือของ sandbox และ elevated gates (พร้อมเส้นทางคีย์คอนฟิกสำหรับการแก้ไข)

```bash
openclaw sandbox explain
openclaw sandbox explain --session agent:main:main
openclaw sandbox explain --agent work
openclaw sandbox explain --json
```

### `openclaw sandbox list`

แสดง sandbox runtimes ทั้งหมดพร้อมสถานะและคอนฟิก

```bash
openclaw sandbox list
openclaw sandbox list --browser  # แสดงเฉพาะคอนเทนเนอร์เบราว์เซอร์
openclaw sandbox list --json     # เอาต์พุต JSON
```

**เอาต์พุตประกอบด้วย:**

- ชื่อและสถานะของ runtime
- backend (`docker`, `openshell` เป็นต้น)
- ป้ายกำกับคอนฟิกและว่าตรงกับคอนฟิกปัจจุบันหรือไม่
- อายุ (เวลาตั้งแต่สร้าง)
- เวลาว่าง (เวลาตั้งแต่ใช้งานครั้งล่าสุด)
- เซสชัน/เอเจนต์ที่เกี่ยวข้อง

### `openclaw sandbox recreate`

ลบ sandbox runtimes เพื่อบังคับให้สร้างใหม่ด้วยคอนฟิกที่อัปเดตแล้ว

```bash
openclaw sandbox recreate --all                # สร้างคอนเทนเนอร์ทั้งหมดใหม่
openclaw sandbox recreate --session main       # เซสชันที่ระบุ
openclaw sandbox recreate --agent mybot        # เอเจนต์ที่ระบุ
openclaw sandbox recreate --browser            # เฉพาะคอนเทนเนอร์เบราว์เซอร์
openclaw sandbox recreate --all --force        # ข้ามการยืนยัน
```

**ตัวเลือก:**

- `--all`: สร้างคอนเทนเนอร์ sandbox ทั้งหมดใหม่
- `--session <key>`: สร้างคอนเทนเนอร์สำหรับเซสชันที่ระบุใหม่
- `--agent <id>`: สร้างคอนเทนเนอร์สำหรับเอเจนต์ที่ระบุใหม่
- `--browser`: สร้างเฉพาะคอนเทนเนอร์เบราว์เซอร์ใหม่
- `--force`: ข้ามข้อความยืนยัน

**สำคัญ:** Runtime จะถูกสร้างใหม่โดยอัตโนมัติเมื่อมีการใช้งานเอเจนต์ในครั้งถัดไป

## กรณีการใช้งาน

### หลังอัปเดต Docker image

```bash
# ดึง image ใหม่
docker pull openclaw-sandbox:latest
docker tag openclaw-sandbox:latest openclaw-sandbox:bookworm-slim

# อัปเดตคอนฟิกให้ใช้ image ใหม่
# แก้ไขคอนฟิก: agents.defaults.sandbox.docker.image (หรือ agents.list[].sandbox.docker.image)

# สร้างคอนเทนเนอร์ใหม่
openclaw sandbox recreate --all
```

### หลังเปลี่ยนคอนฟิก sandbox

```bash
# แก้ไขคอนฟิก: agents.defaults.sandbox.* (หรือ agents.list[].sandbox.*)

# สร้างใหม่เพื่อใช้คอนฟิกใหม่
openclaw sandbox recreate --all
```

### หลังเปลี่ยนเป้าหมาย SSH หรือข้อมูลรับรองความถูกต้อง SSH

```bash
# แก้ไขคอนฟิก:
# - agents.defaults.sandbox.backend
# - agents.defaults.sandbox.ssh.target
# - agents.defaults.sandbox.ssh.workspaceRoot
# - agents.defaults.sandbox.ssh.identityFile / certificateFile / knownHostsFile
# - agents.defaults.sandbox.ssh.identityData / certificateData / knownHostsData

openclaw sandbox recreate --all
```

สำหรับ backend `ssh` หลัก การสร้างใหม่จะลบ remote workspace root ตามขอบเขต
บนเป้าหมาย SSH การรันครั้งถัดไปจะ seed ใหม่อีกครั้งจาก workspace ในเครื่อง

### หลังเปลี่ยน source, policy หรือ mode ของ OpenShell

```bash
# แก้ไขคอนฟิก:
# - agents.defaults.sandbox.backend
# - plugins.entries.openshell.config.from
# - plugins.entries.openshell.config.mode
# - plugins.entries.openshell.config.policy

openclaw sandbox recreate --all
```

สำหรับโหมด OpenShell `remote` การสร้างใหม่จะลบ remote workspace หลัก
สำหรับขอบเขตนั้น การรันครั้งถัดไปจะ seed ใหม่อีกครั้งจาก workspace ในเครื่อง

### หลังเปลี่ยน setupCommand

```bash
openclaw sandbox recreate --all
# หรือเฉพาะเอเจนต์เดียว:
openclaw sandbox recreate --agent family
```

### สำหรับเอเจนต์ที่ระบุเท่านั้น

```bash
# อัปเดตเฉพาะคอนเทนเนอร์ของเอเจนต์เดียว
openclaw sandbox recreate --agent alfred
```

## ทำไมจึงจำเป็น?

**ปัญหา:** เมื่อคุณอัปเดตคอนฟิก sandbox:

- runtimes ที่มีอยู่จะยังคงทำงานด้วยการตั้งค่าเก่า
- runtimes จะถูกล้างทิ้งหลังไม่มีการใช้งาน 24 ชั่วโมงเท่านั้น
- เอเจนต์ที่ใช้งานเป็นประจำจะทำให้ runtimes เก่ายังคงอยู่ได้ไม่มีกำหนด

**วิธีแก้:** ใช้ `openclaw sandbox recreate` เพื่อบังคับลบ runtimes เก่า จากนั้นระบบจะสร้างใหม่โดยอัตโนมัติด้วยการตั้งค่าปัจจุบันเมื่อจำเป็นครั้งถัดไป

เคล็ดลับ: ควรใช้ `openclaw sandbox recreate` แทนการล้างแบบ manual ตาม backend
โดยตรง เพราะคำสั่งนี้ใช้ runtime registry ของ Gateway และหลีกเลี่ยงความไม่ตรงกันเมื่อ scope/session keys เปลี่ยนแปลง

## การกำหนดค่า

การตั้งค่า sandbox อยู่ใน `~/.openclaw/openclaw.json` ภายใต้ `agents.defaults.sandbox` (override รายเอเจนต์อยู่ใน `agents.list[].sandbox`):

```jsonc
{
  "agents": {
    "defaults": {
      "sandbox": {
        "mode": "all", // off, non-main, all
        "backend": "docker", // docker, ssh, openshell
        "scope": "agent", // session, agent, shared
        "docker": {
          "image": "openclaw-sandbox:bookworm-slim",
          "containerPrefix": "openclaw-sbx-",
          // ... ตัวเลือก Docker เพิ่มเติม
        },
        "prune": {
          "idleHours": 24, // ล้างทิ้งอัตโนมัติหลังว่าง 24 ชม.
          "maxAgeDays": 7, // ล้างทิ้งอัตโนมัติหลัง 7 วัน
        },
      },
    },
  },
}
```

## ที่เกี่ยวข้อง

- [เอกสารอ้างอิง CLI](/th/cli)
- [Sandboxing](/th/gateway/sandboxing)
- [พื้นที่ทำงานของเอเจนต์](/th/concepts/agent-workspace)
- [Doctor](/th/gateway/doctor) — ตรวจสอบการตั้งค่า sandbox
