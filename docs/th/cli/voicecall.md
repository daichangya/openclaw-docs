---
read_when:
    - คุณใช้ Plugin voice-call และต้องการจุดเริ่มต้นของ CLI
    - คุณต้องการตัวอย่างแบบรวดเร็วสำหรับ `voicecall call|continue|dtmf|status|tail|expose`
summary: เอกสารอ้างอิง CLI สำหรับ `openclaw voicecall` (พื้นผิวคำสั่งของ Plugin การโทรด้วยเสียง)
title: Voicecall
x-i18n:
    generated_at: "2026-04-24T09:04:52Z"
    model: gpt-5.4
    provider: openai
    source_hash: 03773f46d1c9ab407a9734cb2bbe13d2a36bf0da8e6c9c68c18c05e285912c88
    source_path: cli/voicecall.md
    workflow: 15
---

# `openclaw voicecall`

`voicecall` เป็นคำสั่งที่ Plugin จัดเตรียมให้ มันจะแสดงก็ต่อเมื่อติดตั้งและเปิดใช้งาน Plugin voice-call แล้วเท่านั้น

เอกสารหลัก:

- Plugin voice-call: [Voice Call](/th/plugins/voice-call)

## คำสั่งที่พบบ่อย

```bash
openclaw voicecall status --call-id <id>
openclaw voicecall call --to "+15555550123" --message "Hello" --mode notify
openclaw voicecall continue --call-id <id> --message "Any questions?"
openclaw voicecall dtmf --call-id <id> --digits "ww123456#"
openclaw voicecall end --call-id <id>
```

## การเปิดเผย Webhook (Tailscale)

```bash
openclaw voicecall expose --mode serve
openclaw voicecall expose --mode funnel
openclaw voicecall expose --mode off
```

หมายเหตุด้านความปลอดภัย: เปิดเผย endpoint ของ Webhook เฉพาะกับเครือข่ายที่คุณเชื่อถือเท่านั้น ควรใช้ Tailscale Serve แทน Funnel เมื่อเป็นไปได้

## ที่เกี่ยวข้อง

- [เอกสารอ้างอิง CLI](/th/cli)
- [Plugin การโทรด้วยเสียง](/th/plugins/voice-call)
