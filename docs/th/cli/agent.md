---
read_when:
    - คุณต้องการรันหนึ่ง agent turn จากสคริปต์ (และอาจส่งคำตอบกลับด้วย)
summary: เอกสารอ้างอิง CLI สำหรับ `openclaw agent` (ส่งหนึ่ง agent turn ผ่าน Gateway)
title: เอเจนต์
x-i18n:
    generated_at: "2026-04-24T09:01:34Z"
    model: gpt-5.4
    provider: openai
    source_hash: c4d57b8e368891a0010b053a7504d6313ad2233b5f5f43b34be1f9aa92caa86c
    source_path: cli/agent.md
    workflow: 15
---

# `openclaw agent`

รันหนึ่ง agent turn ผ่าน Gateway (ใช้ `--local` สำหรับแบบ embedded)
ใช้ `--agent <id>` เพื่อระบุเอเจนต์ที่กำหนดค่าไว้โดยตรง

ระบุตัวเลือกเซสชันอย่างน้อยหนึ่งรายการ:

- `--to <dest>`
- `--session-id <id>`
- `--agent <id>`

ที่เกี่ยวข้อง:

- เครื่องมือส่งเอเจนต์: [Agent send](/th/tools/agent-send)

## ตัวเลือก

- `-m, --message <text>`: เนื้อหาข้อความที่จำเป็น
- `-t, --to <dest>`: ผู้รับที่ใช้ในการอนุมาน session key
- `--session-id <id>`: session id แบบระบุชัดเจน
- `--agent <id>`: agent id; override การผูกการกำหนดเส้นทาง
- `--thinking <level>`: ระดับการคิดของเอเจนต์ (`off`, `minimal`, `low`, `medium`, `high` รวมถึงระดับกำหนดเองที่ผู้ให้บริการรองรับ เช่น `xhigh`, `adaptive` หรือ `max`)
- `--verbose <on|off>`: บันทึกระดับ verbose สำหรับเซสชัน
- `--channel <channel>`: ช่องทางการส่งมอบ; หากไม่ระบุจะใช้ช่องทางของเซสชันหลัก
- `--reply-to <target>`: override เป้าหมายการส่งมอบ
- `--reply-channel <channel>`: override ช่องทางการส่งมอบ
- `--reply-account <id>`: override บัญชีการส่งมอบ
- `--local`: รัน embedded agent โดยตรง (หลัง preload รีจิสทรี Plugin)
- `--deliver`: ส่งคำตอบกลับไปยังช่องทาง/เป้าหมายที่เลือก
- `--timeout <seconds>`: override timeout ของเอเจนต์ (ค่าเริ่มต้น 600 หรือค่าจากคอนฟิก)
- `--json`: แสดงผลเป็น JSON

## ตัวอย่าง

```bash
openclaw agent --to +15555550123 --message "status update" --deliver
openclaw agent --agent ops --message "Summarize logs"
openclaw agent --session-id 1234 --message "Summarize inbox" --thinking medium
openclaw agent --to +15555550123 --message "Trace logs" --verbose on --json
openclaw agent --agent ops --message "Generate report" --deliver --reply-channel slack --reply-to "#reports"
openclaw agent --agent ops --message "Run locally" --local
```

## หมายเหตุ

- โหมด Gateway จะ fallback ไปใช้ embedded agent เมื่อคำขอ Gateway ล้มเหลว ใช้ `--local` เพื่อบังคับให้รันแบบ embedded ตั้งแต่ต้น
- `--local` จะยัง preload รีจิสทรี Plugin ก่อน ดังนั้น providers, tools และ channels ที่มาจาก Plugin จะยังคงพร้อมใช้งานระหว่างการรันแบบ embedded
- `--channel`, `--reply-channel` และ `--reply-account` มีผลต่อการส่งมอบคำตอบ ไม่ใช่การกำหนดเส้นทางเซสชัน
- เมื่อคำสั่งนี้ทริกเกอร์การสร้าง `models.json` ใหม่ credentials ของ provider ที่จัดการด้วย SecretRef จะถูกบันทึกเป็นตัวบ่งชี้ที่ไม่ใช่ความลับ (เช่น ชื่อตัวแปร env, `secretref-env:ENV_VAR_NAME` หรือ `secretref-managed`) ไม่ใช่ plaintext ของความลับที่ถูก resolve แล้ว
- การเขียนตัวบ่งชี้เป็นไปตามแหล่งข้อมูลต้นทาง: OpenClaw จะบันทึกตัวบ่งชี้จาก snapshot คอนฟิกของแหล่งข้อมูลที่กำลังใช้งาน ไม่ใช่จากค่าความลับ runtime ที่ถูก resolve แล้ว

## ที่เกี่ยวข้อง

- [เอกสารอ้างอิง CLI](/th/cli)
- [Agent runtime](/th/concepts/agent)
