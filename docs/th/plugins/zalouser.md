---
read_when:
    - คุณต้องการการรองรับ Zalo Personal (ไม่เป็นทางการ) ใน OpenClaw
    - คุณกำลังกำหนดค่าหรือพัฒนา Plugin `zalouser`
summary: 'Plugin Zalo Personal: การเข้าสู่ระบบด้วย QR + การรับส่งข้อความผ่าน zca-js แบบเนทีฟ (การติดตั้ง Plugin + การตั้งค่า channel + เครื่องมือ)'
title: Plugin Zalo Personal
x-i18n:
    generated_at: "2026-04-24T09:26:40Z"
    model: gpt-5.4
    provider: openai
    source_hash: d678bd55fd405a9c689d1202870cc03bfb825a9314c433a0ab729d376e3b67a3
    source_path: plugins/zalouser.md
    workflow: 15
---

# Zalo Personal (Plugin)

การรองรับ Zalo Personal สำหรับ OpenClaw ผ่าน Plugin โดยใช้ `zca-js` แบบเนทีฟเพื่อทำงานอัตโนมัติกับบัญชีผู้ใช้ Zalo ปกติ

> **คำเตือน:** การทำงานอัตโนมัติแบบไม่เป็นทางการอาจทำให้บัญชีถูกระงับ/แบน ใช้งานด้วยความเสี่ยงของคุณเอง

## การตั้งชื่อ

id ของ Channel คือ `zalouser` เพื่อให้ชัดเจนว่านี่คือการทำงานอัตโนมัติกับ **บัญชีผู้ใช้ Zalo ส่วนตัว** (ไม่เป็นทางการ) เราสงวน `zalo` ไว้สำหรับความเป็นไปได้ของการผสานรวมกับ API ทางการของ Zalo ในอนาคต

## ทำงานที่ไหน

Plugin นี้ทำงาน **ภายในโปรเซส Gateway**

หากคุณใช้ Gateway ระยะไกล ให้ติดตั้ง/กำหนดค่าบน **เครื่องที่รัน Gateway** แล้วจึงรีสตาร์ต Gateway

ไม่จำเป็นต้องใช้ไบนารี CLI ภายนอก `zca`/`openzca`

## ติดตั้ง

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

คอนฟิก Channel อยู่ใต้ `channels.zalouser` (ไม่ใช่ `plugins.entries.*`):

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

## เครื่องมือเอเจนต์

ชื่อเครื่องมือ: `zalouser`

แอ็กชัน: `send`, `image`, `link`, `friends`, `groups`, `me`, `status`

แอ็กชันข้อความของ Channel ยังรองรับ `react` สำหรับ reaction ของข้อความด้วย

## ที่เกี่ยวข้อง

- [Building plugins](/th/plugins/building-plugins)
- [Community plugins](/th/plugins/community)
