---
read_when:
    - คุณต้องการรันหนึ่งเทิร์นของเอเจนต์จากสคริปต์ (เลือกได้ว่าจะส่งคำตอบกลับหรือไม่)
summary: ข้อมูลอ้างอิง CLI สำหรับ `openclaw agent` (ส่งหนึ่งเทิร์นของเอเจนต์ผ่าน Gateway)
title: เอเจนต์
x-i18n:
    generated_at: "2026-04-23T06:17:02Z"
    model: gpt-5.4
    provider: openai
    source_hash: 4ba3181d74e9a8d6d607ee62b18e1e6fd693e64e7789e6b29b7f7b1ccb7b69d0
    source_path: cli/agent.md
    workflow: 15
---

# `openclaw agent`

รันหนึ่งเทิร์นของเอเจนต์ผ่าน Gateway (ใช้ `--local` สำหรับแบบฝังในตัว)
ใช้ `--agent <id>` เพื่อระบุเอเจนต์ที่ตั้งค่าไว้โดยตรง

ส่งตัวเลือกระบุเซสชันอย่างน้อยหนึ่งรายการ:

- `--to <dest>`
- `--session-id <id>`
- `--agent <id>`

ที่เกี่ยวข้อง:

- เครื่องมือส่งเอเจนต์: [Agent send](/th/tools/agent-send)

## ตัวเลือก

- `-m, --message <text>`: เนื้อหาข้อความที่ต้องระบุ
- `-t, --to <dest>`: ผู้รับที่ใช้ในการสร้างคีย์เซสชัน
- `--session-id <id>`: รหัสเซสชันที่ระบุโดยตรง
- `--agent <id>`: รหัสเอเจนต์; ใช้แทนการผูกเส้นทาง
- `--thinking <level>`: ระดับการคิดของเอเจนต์ (`off`, `minimal`, `low`, `medium`, `high` รวมถึงระดับกำหนดเองที่ผู้ให้บริการรองรับ เช่น `xhigh`, `adaptive` หรือ `max`)
- `--verbose <on|off>`: คงค่าระดับ verbose ไว้สำหรับเซสชัน
- `--channel <channel>`: ช่องทางการส่ง; เว้นไว้เพื่อใช้ช่องทางหลักของเซสชัน
- `--reply-to <target>`: ระบุเป้าหมายการส่งกลับแทนค่าเดิม
- `--reply-channel <channel>`: ระบุช่องทางการส่งกลับแทนค่าเดิม
- `--reply-account <id>`: ระบุบัญชีการส่งกลับแทนค่าเดิม
- `--local`: รันเอเจนต์แบบฝังในตัวโดยตรง (หลังจากพรีโหลดรีจิสทรี Plugin)
- `--deliver`: ส่งคำตอบกลับไปยังช่องทาง/เป้าหมายที่เลือก
- `--timeout <seconds>`: กำหนดเวลา timeout ของเอเจนต์ใหม่ (ค่าเริ่มต้น 600 หรือค่าจาก config)
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

- โหมด Gateway จะ fallback ไปใช้เอเจนต์แบบฝังในตัวเมื่อคำขอไปยัง Gateway ล้มเหลว ใช้ `--local` เพื่อบังคับให้รันแบบฝังในตัวตั้งแต่ต้น
- `--local` จะยังพรีโหลดรีจิสทรี Plugin ก่อน ดังนั้น provider, tools และ channels ที่มาจาก Plugin จะยังใช้งานได้ระหว่างการรันแบบฝังในตัว
- `--channel`, `--reply-channel` และ `--reply-account` มีผลต่อการส่งคำตอบกลับ ไม่ใช่การกำหนดเส้นทางของเซสชัน
- เมื่อคำสั่งนี้ทริกเกอร์การสร้าง `models.json` ใหม่ ข้อมูลรับรอง provider ที่จัดการด้วย SecretRef จะถูกบันทึกเป็นตัวบ่งชี้แบบไม่เป็นความลับ (เช่น ชื่อ env var, `secretref-env:ENV_VAR_NAME` หรือ `secretref-managed`) ไม่ใช่ข้อความลับจริงที่ถูก resolve แล้ว
- การเขียนตัวบ่งชี้ใช้ต้นทางเป็นข้อมูลอ้างอิงหลัก: OpenClaw จะบันทึกตัวบ่งชี้จาก snapshot config ของต้นทางที่กำลังใช้งาน ไม่ใช่จากค่าความลับขณะรันที่ถูก resolve แล้ว
