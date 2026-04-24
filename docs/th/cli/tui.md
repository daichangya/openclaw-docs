---
read_when:
    - คุณต้องการ TUI สำหรับ Gateway (ใช้งานระยะไกลได้สะดวก)
    - คุณต้องการส่งผ่าน url/token/session จากสคริปต์
    - คุณต้องการรัน TUI ในโหมด embedded ภายในเครื่องโดยไม่ใช้ Gateway
    - คุณต้องการใช้ openclaw chat หรือ openclaw tui --local
summary: เอกสารอ้างอิง CLI สำหรับ `openclaw tui` (TUI แบบ embedded ในเครื่องหรือที่ขับเคลื่อนด้วย Gateway)
title: TUI
x-i18n:
    generated_at: "2026-04-24T09:04:45Z"
    model: gpt-5.4
    provider: openai
    source_hash: c3b3d337c55411fbcbae3bda85d9ca8d0f1b2a4224b5d4c9bbc5f96c41c5363c
    source_path: cli/tui.md
    workflow: 15
---

# `openclaw tui`

เปิด TUI ที่เชื่อมต่อกับ Gateway หรือรันในโหมด embedded ภายในเครื่อง

ที่เกี่ยวข้อง:

- คู่มือ TUI: [TUI](/th/web/tui)

หมายเหตุ:

- `chat` และ `terminal` เป็น alias ของ `openclaw tui --local`
- `--local` ไม่สามารถใช้ร่วมกับ `--url`, `--token` หรือ `--password` ได้
- `tui` จะ resolve gateway auth SecretRefs ที่กำหนดค่าไว้สำหรับการยืนยันตัวตนด้วย token/password เมื่อเป็นไปได้ (`env`/`file`/`exec` providers)
- เมื่อเปิดจากภายในไดเรกทอรี workspace ของเอเจนต์ที่กำหนดค่าไว้ TUI จะเลือกเอเจนต์นั้นโดยอัตโนมัติสำหรับค่าเริ่มต้นของ session key (เว้นแต่ `--session` จะระบุเป็น `agent:<id>:...` อย่างชัดเจน)
- โหมด local ใช้ runtime ของ embedded agent โดยตรง เครื่องมือ local ส่วนใหญ่ใช้งานได้ แต่ฟีเจอร์ที่มีเฉพาะ Gateway จะไม่พร้อมใช้งาน
- โหมด local เพิ่ม `/auth [provider]` ภายในพื้นผิวคำสั่งของ TUI
- กฎการอนุมัติ Plugin ยังคงมีผลในโหมด local เครื่องมือที่ต้องการการอนุมัติจะถามเพื่อขอการตัดสินใจในเทอร์มินัล จะไม่มีอะไรได้รับการอนุมัติโดยอัตโนมัติแบบเงียบ ๆ เพราะ Gateway ไม่ได้มีส่วนเกี่ยวข้อง

## ตัวอย่าง

```bash
openclaw chat
openclaw tui --local
openclaw tui
openclaw tui --url ws://127.0.0.1:18789 --token <token>
openclaw tui --session main --deliver
openclaw chat --message "Compare my config to the docs and tell me what to fix"
# เมื่อรันภายใน workspace ของเอเจนต์ จะอนุมานเอเจนต์นั้นให้อัตโนมัติ
openclaw tui --session bugfix
```

## วงจรการซ่อมคอนฟิก

ใช้โหมด local เมื่อคอนฟิกปัจจุบันยัง validate ผ่านอยู่แล้ว และคุณต้องการให้
embedded agent ตรวจสอบ เปรียบเทียบกับเอกสาร และช่วยซ่อมแซมคอนฟิก
จากเทอร์มินัลเดียวกัน

หาก `openclaw config validate` ล้มเหลวอยู่แล้ว ให้ใช้ `openclaw configure` หรือ
`openclaw doctor --fix` ก่อน `openclaw chat` จะไม่ข้ามตัวป้องกันคอนฟิก
ไม่ถูกต้อง

```bash
openclaw chat
```

จากนั้นภายใน TUI:

```text
!openclaw config file
!openclaw docs gateway auth token secretref
!openclaw config validate
!openclaw doctor
```

ใช้ `openclaw config set` หรือ `openclaw configure` เพื่อแก้ไขแบบเจาะจง จากนั้น
รัน `openclaw config validate` อีกครั้ง ดู [TUI](/th/web/tui) และ [Config](/th/cli/config)

## ที่เกี่ยวข้อง

- [เอกสารอ้างอิง CLI](/th/cli)
- [TUI](/th/web/tui)
