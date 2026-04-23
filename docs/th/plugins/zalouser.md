---
read_when:
    - คุณต้องการการรองรับ Zalo Personal (ไม่เป็นทางการ) ใน OpenClaw
    - คุณกำลังกำหนดค่าหรือพัฒนา Plugin zalouser
summary: 'Plugin Zalo Personal: การล็อกอินด้วย QR + การส่งข้อความผ่าน zca-js แบบเนทีฟ (การติดตั้ง Plugin + การกำหนดค่าช่องทาง + เครื่องมือ)'
title: Plugin Zalo Personal
x-i18n:
    generated_at: "2026-04-23T05:49:42Z"
    model: gpt-5.4
    provider: openai
    source_hash: 3218c3ee34f36466d952aec1b479d451a6235c7c46918beb28698234a7fd0968
    source_path: plugins/zalouser.md
    workflow: 15
---

# Zalo Personal (Plugin)

การรองรับ Zalo Personal สำหรับ OpenClaw ผ่าน Plugin โดยใช้ `zca-js` แบบเนทีฟเพื่อทำงานอัตโนมัติกับบัญชีผู้ใช้ Zalo ปกติ

> **คำเตือน:** ระบบอัตโนมัติที่ไม่เป็นทางการอาจทำให้บัญชีถูกระงับ/แบน ใช้งานด้วยความเสี่ยงของคุณเอง

## การตั้งชื่อ

id ของช่องทางคือ `zalouser` เพื่อให้ชัดเจนว่านี่คือการทำงานอัตโนมัติกับ **บัญชีผู้ใช้ Zalo ส่วนตัว** (ไม่เป็นทางการ) เราเก็บ `zalo` ไว้สำหรับการเชื่อมต่อ Zalo API แบบทางการที่อาจมีในอนาคต

## ตำแหน่งที่มันทำงาน

Plugin นี้รัน **ภายในโปรเซส Gateway**

หากคุณใช้ Gateway แบบ remote ให้ติดตั้ง/กำหนดค่ามันบน **เครื่องที่รัน Gateway** จากนั้นรีสตาร์ต Gateway

ไม่ต้องใช้ไบนารี CLI ภายนอกอย่าง `zca`/`openzca`

## การติดตั้ง

### ตัวเลือก A: ติดตั้งจาก npm

```bash
openclaw plugins install @openclaw/zalouser
```

จากนั้นรีสตาร์ต Gateway

### ตัวเลือก B: ติดตั้งจากโฟลเดอร์ในเครื่อง (dev)

```bash
PLUGIN_SRC=./path/to/local/zalouser-plugin
openclaw plugins install "$PLUGIN_SRC"
cd "$PLUGIN_SRC" && pnpm install
```

จากนั้นรีสตาร์ต Gateway

## คอนฟิก

คอนฟิกของช่องทางอยู่ภายใต้ `channels.zalouser` (ไม่ใช่ `plugins.entries.*`):

```json5
{
  channels: {
    zalouser: {
      enabled: true,
      dmPolicy: "pairing",
    },
  },
}
```

## CLI

```bash
openclaw channels login --channel zalouser
openclaw channels logout --channel zalouser
openclaw channels status --probe
openclaw message send --channel zalouser --target <threadId> --message "Hello from OpenClaw"
openclaw directory peers list --channel zalouser --query "name"
```

## เครื่องมือของเอเจนต์

ชื่อเครื่องมือ: `zalouser`

Actions: `send`, `image`, `link`, `friends`, `groups`, `me`, `status`

การดำเนินการข้อความของช่องทางยังรองรับ `react` สำหรับการแสดงปฏิกิริยาต่อข้อความด้วย
