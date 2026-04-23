---
read_when:
    - คุณใช้ Plugin voice-call และต้องการจุดเริ่มต้นของ CLI
    - คุณต้องการตัวอย่างแบบรวดเร็วสำหรับ `voicecall call|continue|status|tail|expose`
summary: ข้อมูลอ้างอิง CLI สำหรับ `openclaw voicecall` (พื้นผิวคำสั่งของ Plugin สำหรับการโทรด้วยเสียง)
title: voicecall
x-i18n:
    generated_at: "2026-04-23T06:20:08Z"
    model: gpt-5.4
    provider: openai
    source_hash: 2c99e7a3d256e1c74a0f07faba9675cc5a88b1eb2fc6e22993caf3874d4f340a
    source_path: cli/voicecall.md
    workflow: 15
---

# `openclaw voicecall`

`voicecall` เป็นคำสั่งที่ Plugin เป็นผู้จัดเตรียมไว้ คำสั่งนี้จะแสดงขึ้นก็ต่อเมื่อติดตั้งและเปิดใช้งาน Plugin voice-call แล้วเท่านั้น

เอกสารหลัก:

- Plugin voice-call: [Voice Call](/th/plugins/voice-call)

## คำสั่งทั่วไป

```bash
openclaw voicecall status --call-id <id>
openclaw voicecall call --to "+15555550123" --message "Hello" --mode notify
openclaw voicecall continue --call-id <id> --message "Any questions?"
openclaw voicecall end --call-id <id>
```

## การเปิดเผย webhooks (Tailscale)

```bash
openclaw voicecall expose --mode serve
openclaw voicecall expose --mode funnel
openclaw voicecall expose --mode off
```

หมายเหตุด้านความปลอดภัย: เปิดเผย endpoint ของ Webhook เฉพาะกับเครือข่ายที่คุณเชื่อถือเท่านั้น หากเป็นไปได้ ให้ใช้ Tailscale Serve แทน Funnel
