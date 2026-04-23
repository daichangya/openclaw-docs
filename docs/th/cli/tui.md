---
read_when:
    - คุณต้องการ UI บนเทอร์มินัลสำหรับ Gateway (เหมาะกับการใช้งานระยะไกล)
    - คุณต้องการส่ง url/token/session จากสคริปต์
    - คุณต้องการรัน TUI ในโหมดฝังในเครื่องโดยไม่ใช้ Gateway
    - คุณต้องการใช้ `openclaw chat` หรือ `openclaw tui --local`
summary: เอกสารอ้างอิง CLI สำหรับ `openclaw tui` (TUI แบบฝังในเครื่องหรือแบบอิง Gateway)
title: TUI
x-i18n:
    generated_at: "2026-04-23T06:20:05Z"
    model: gpt-5.4
    provider: openai
    source_hash: 5f4b7cf2468779e0711f38a2cc304d783bb115fd5c5e573c9d1bc982da6e2905
    source_path: cli/tui.md
    workflow: 15
---

# `openclaw tui`

เปิด UI บนเทอร์มินัลที่เชื่อมต่อกับ Gateway หรือรันใน
โหมดฝังในเครื่อง

ที่เกี่ยวข้อง:

- คู่มือ TUI: [TUI](/th/web/tui)

หมายเหตุ:

- `chat` และ `terminal` เป็นนามแฝงของ `openclaw tui --local`
- `--local` ไม่สามารถใช้ร่วมกับ `--url`, `--token` หรือ `--password`
- `tui` จะ resolve auth SecretRefs ของ gateway ที่กำหนดค่าไว้สำหรับ token/password auth เมื่อทำได้ (`env`/`file`/`exec` providers)
- เมื่อเปิดจากภายในไดเรกทอรี workspace ของ agent ที่กำหนดค่าไว้ TUI จะเลือก agent นั้นโดยอัตโนมัติสำหรับค่าเริ่มต้นของ session key (เว้นแต่ `--session` จะเป็น `agent:<id>:...` อย่างชัดเจน)
- โหมดในเครื่องใช้รันไทม์ agent แบบฝังโดยตรง เครื่องมือในเครื่องส่วนใหญ่ใช้งานได้ แต่ฟีเจอร์ที่มีเฉพาะ Gateway จะไม่พร้อมใช้งาน
- โหมดในเครื่องเพิ่ม `/auth [provider]` ภายในพื้นผิวคำสั่งของ TUI

## ตัวอย่าง

```bash
openclaw chat
openclaw tui --local
openclaw tui
openclaw tui --url ws://127.0.0.1:18789 --token <token>
openclaw tui --session main --deliver
openclaw chat --message "Compare my config to the docs and tell me what to fix"
# when run inside an agent workspace, infers that agent automatically
openclaw tui --session bugfix
```

## ลูปการซ่อมแซม config

ใช้โหมดในเครื่องเมื่อ config ปัจจุบันผ่านการตรวจสอบอยู่แล้ว และคุณต้องการให้
agent แบบฝังตรวจสอบ config นั้น เปรียบเทียบกับเอกสาร และช่วยซ่อมแซมให้
จากเทอร์มินัลเดียวกัน:

หาก `openclaw config validate` ล้มเหลวอยู่แล้ว ให้ใช้ `openclaw configure` หรือ
`openclaw doctor --fix` ก่อน `openclaw chat` จะไม่ข้ามตัวป้องกัน
config ไม่ถูกต้อง

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

ใช้ `openclaw config set` หรือ `openclaw configure` เพื่อปรับแก้แบบเจาะจง จากนั้น
รัน `openclaw config validate` อีกครั้ง ดู [TUI](/th/web/tui) และ [Config](/th/cli/config)
