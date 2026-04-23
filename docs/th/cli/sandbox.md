---
read_when: You are managing sandbox runtimes or debugging sandbox/tool-policy behavior.
status: active
summary: จัดการ runtime ของ sandbox และตรวจสอบนโยบาย sandbox ที่มีผลใช้งานจริง
title: CLI ของ Sandbox
x-i18n:
    generated_at: "2026-04-23T06:19:18Z"
    model: gpt-5.4
    provider: openai
    source_hash: fa2783037da2901316108d35e04bb319d5d57963c2764b9146786b3c6474b48a
    source_path: cli/sandbox.md
    workflow: 15
---

# CLI ของ Sandbox

จัดการ runtime ของ sandbox สำหรับการรัน agent แบบแยกส่วน

## ภาพรวม

OpenClaw สามารถรัน agent ใน runtime ของ sandbox แบบแยกส่วนเพื่อความปลอดภัย คำสั่ง `sandbox` ช่วยให้คุณตรวจสอบและสร้าง runtime เหล่านั้นใหม่หลังการอัปเดตหรือการเปลี่ยนแปลงการตั้งค่า

ปัจจุบันโดยทั่วไปหมายถึง:

- คอนเทนเนอร์ Docker sandbox
- runtime ของ SSH sandbox เมื่อ `agents.defaults.sandbox.backend = "ssh"`
- runtime ของ OpenShell sandbox เมื่อ `agents.defaults.sandbox.backend = "openshell"`

สำหรับ `ssh` และ OpenShell `remote` การสร้างใหม่มีความสำคัญมากกว่า Docker:

- เวิร์กสเปซระยะไกลเป็นแหล่งอ้างอิงหลักหลังจากการ seed ครั้งแรก
- `openclaw sandbox recreate` จะลบเวิร์กสเปซระยะไกลหลักนั้นสำหรับขอบเขตที่เลือก
- การใช้งานครั้งถัดไปจะ seed ใหม่อีกครั้งจากเวิร์กสเปซในเครื่องปัจจุบัน

## คำสั่ง

### `openclaw sandbox explain`

ตรวจสอบโหมด/ขอบเขต/การเข้าถึงเวิร์กสเปซของ sandbox ที่ **มีผลใช้งานจริง**, นโยบายเครื่องมือ sandbox และ gate การยกระดับสิทธิ์ (พร้อมพาธคีย์ config สำหรับการแก้ไข)

```bash
openclaw sandbox explain
openclaw sandbox explain --session agent:main:main
openclaw sandbox explain --agent work
openclaw sandbox explain --json
```

### `openclaw sandbox list`

แสดง runtime ของ sandbox ทั้งหมดพร้อมสถานะและการตั้งค่า

```bash
openclaw sandbox list
openclaw sandbox list --browser  # แสดงเฉพาะคอนเทนเนอร์เบราว์เซอร์
openclaw sandbox list --json     # เอาต์พุต JSON
```

**เอาต์พุตประกอบด้วย:**

- ชื่อและสถานะของ runtime
- Backend (`docker`, `openshell` ฯลฯ)
- ป้ายกำกับ config และตรงกับ config ปัจจุบันหรือไม่
- อายุ (เวลาตั้งแต่สร้าง)
- เวลาว่าง (เวลาตั้งแต่ใช้งานครั้งล่าสุด)
- session/agent ที่เกี่ยวข้อง

### `openclaw sandbox recreate`

ลบ runtime ของ sandbox เพื่อบังคับให้สร้างใหม่ด้วย config ที่อัปเดตแล้ว

```bash
openclaw sandbox recreate --all                # สร้างคอนเทนเนอร์ทั้งหมดใหม่
openclaw sandbox recreate --session main       # session ที่ระบุ
openclaw sandbox recreate --agent mybot        # agent ที่ระบุ
openclaw sandbox recreate --browser            # เฉพาะคอนเทนเนอร์เบราว์เซอร์
openclaw sandbox recreate --all --force        # ข้ามการยืนยัน
```

**ตัวเลือก:**

- `--all`: สร้างคอนเทนเนอร์ sandbox ทั้งหมดใหม่
- `--session <key>`: สร้างคอนเทนเนอร์สำหรับ session ที่ระบุใหม่
- `--agent <id>`: สร้างคอนเทนเนอร์สำหรับ agent ที่ระบุใหม่
- `--browser`: สร้างใหม่เฉพาะคอนเทนเนอร์เบราว์เซอร์
- `--force`: ข้ามพรอมต์ยืนยัน

**สำคัญ:** runtime จะถูกสร้างใหม่โดยอัตโนมัติเมื่อมีการใช้งาน agent ครั้งถัดไป

## กรณีการใช้งาน

### หลังจากอัปเดตอิมเมจ Docker

```bash
# ดึงอิมเมจใหม่
docker pull openclaw-sandbox:latest
docker tag openclaw-sandbox:latest openclaw-sandbox:bookworm-slim

# อัปเดต config เพื่อใช้อิมเมจใหม่
# แก้ไข config: agents.defaults.sandbox.docker.image (หรือ agents.list[].sandbox.docker.image)

# สร้างคอนเทนเนอร์ใหม่
openclaw sandbox recreate --all
```

### หลังจากเปลี่ยนการตั้งค่า sandbox

```bash
# แก้ไข config: agents.defaults.sandbox.* (หรือ agents.list[].sandbox.*)

# สร้างใหม่เพื่อใช้ config ใหม่
openclaw sandbox recreate --all
```

### หลังจากเปลี่ยนเป้าหมาย SSH หรือข้อมูล auth ของ SSH

```bash
# แก้ไข config:
# - agents.defaults.sandbox.backend
# - agents.defaults.sandbox.ssh.target
# - agents.defaults.sandbox.ssh.workspaceRoot
# - agents.defaults.sandbox.ssh.identityFile / certificateFile / knownHostsFile
# - agents.defaults.sandbox.ssh.identityData / certificateData / knownHostsData

openclaw sandbox recreate --all
```

สำหรับ backend `ssh` หลัก การสร้างใหม่จะลบรูทเวิร์กสเปซระยะไกลต่อขอบเขต
บนเป้าหมาย SSH การรันครั้งถัดไปจะ seed ใหม่อีกครั้งจากเวิร์กสเปซในเครื่อง

### หลังจากเปลี่ยนแหล่งที่มา นโยบาย หรือโหมดของ OpenShell

```bash
# แก้ไข config:
# - agents.defaults.sandbox.backend
# - plugins.entries.openshell.config.from
# - plugins.entries.openshell.config.mode
# - plugins.entries.openshell.config.policy

openclaw sandbox recreate --all
```

สำหรับโหมด OpenShell `remote` การสร้างใหม่จะลบเวิร์กสเปซระยะไกลหลัก
สำหรับขอบเขตนั้น การรันครั้งถัดไปจะ seed ใหม่อีกครั้งจากเวิร์กสเปซในเครื่อง

### หลังจากเปลี่ยน setupCommand

```bash
openclaw sandbox recreate --all
# หรือเฉพาะ agent เดียว:
openclaw sandbox recreate --agent family
```

### สำหรับ agent ที่ระบุเท่านั้น

```bash
# อัปเดตเฉพาะคอนเทนเนอร์ของ agent เดียว
openclaw sandbox recreate --agent alfred
```

## ทำไมจึงจำเป็น?

**ปัญหา:** เมื่อคุณอัปเดตการตั้งค่า sandbox:

- runtime ที่มีอยู่จะยังคงทำงานด้วยการตั้งค่าเดิม
- runtime จะถูกล้างทิ้งก็ต่อเมื่อไม่มีการใช้งานเป็นเวลา 24 ชม.
- agent ที่ใช้งานเป็นประจำจะทำให้ runtime เดิมคงอยู่ต่อไปอย่างไม่มีกำหนด

**วิธีแก้:** ใช้ `openclaw sandbox recreate` เพื่อบังคับลบ runtime เดิม runtime เหล่านั้นจะถูกสร้างใหม่โดยอัตโนมัติด้วยการตั้งค่าปัจจุบันเมื่อจำเป็นในครั้งถัดไป

เคล็ดลับ: ควรใช้ `openclaw sandbox recreate` แทนการล้างข้อมูลด้วยตนเองแบบเจาะจง backend
คำสั่งนี้ใช้รีจิสทรี runtime ของ Gateway และช่วยหลีกเลี่ยงความไม่ตรงกันเมื่อคีย์ขอบเขต/session เปลี่ยนไป

## การตั้งค่า

การตั้งค่า sandbox อยู่ใน `~/.openclaw/openclaw.json` ภายใต้ `agents.defaults.sandbox` (การ override ราย agent อยู่ใน `agents.list[].sandbox`):

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
          // ... more Docker options
        },
        "prune": {
          "idleHours": 24, // Auto-prune after 24h idle
          "maxAgeDays": 7, // Auto-prune after 7 days
        },
      },
    },
  },
}
```

## ดูเพิ่มเติม

- [เอกสาร Sandbox](/th/gateway/sandboxing)
- [การตั้งค่า Agent](/th/concepts/agent-workspace)
- [คำสั่ง Doctor](/th/gateway/doctor) - ตรวจสอบการตั้งค่า sandbox
