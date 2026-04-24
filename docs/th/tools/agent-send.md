---
read_when:
    - คุณต้องการทริกเกอร์การรันเอเจนต์จากสคริปต์หรือบรรทัดคำสั่ง
    - คุณต้องการส่งคำตอบของเอเจนต์ไปยังช่องแชตแบบเป็นโปรแกรมបាន
summary: รัน agent turn จาก CLI และเลือกส่งคำตอบกลับไปยังช่องทางต่าง ๆ ได้ตามต้องการ
title: การส่งของเอเจนต์
x-i18n:
    generated_at: "2026-04-24T09:34:37Z"
    model: gpt-5.4
    provider: openai
    source_hash: 8f29ab906ed8179b265138ee27312c8f4b318d09b73ad61843fca6809c32bd31
    source_path: tools/agent-send.md
    workflow: 15
---

`openclaw agent` รัน agent turn เดียวจากบรรทัดคำสั่งโดยไม่ต้องมี
ข้อความแชตขาเข้า ใช้สำหรับเวิร์กโฟลว์แบบสคริปต์ การทดสอบ และ
การส่งแบบเป็นโปรแกรม

## เริ่มต้นอย่างรวดเร็ว

<Steps>
  <Step title="รัน agent turn แบบง่าย">
    ```bash
    openclaw agent --message "What is the weather today?"
    ```

    คำสั่งนี้จะส่งข้อความผ่าน Gateway และพิมพ์คำตอบ

  </Step>

  <Step title="ระบุ agent หรือ session เฉพาะ">
    ```bash
    # ระบุ agent เฉพาะ
    openclaw agent --agent ops --message "Summarize logs"

    # ระบุหมายเลขโทรศัพท์ (อนุมานคีย์เซสชัน)
    openclaw agent --to +15555550123 --message "Status update"

    # ใช้ session ที่มีอยู่แล้วต่อ
    openclaw agent --session-id abc123 --message "Continue the task"
    ```

  </Step>

  <Step title="ส่งคำตอบไปยังช่องทาง">
    ```bash
    # ส่งไปยัง WhatsApp (ช่องทางปริยาย)
    openclaw agent --to +15555550123 --message "Report ready" --deliver

    # ส่งไปยัง Slack
    openclaw agent --agent ops --message "Generate report" \
      --deliver --reply-channel slack --reply-to "#reports"
    ```

  </Step>
</Steps>

## แฟล็ก

| Flag                          | คำอธิบาย                                                    |
| ----------------------------- | ----------------------------------------------------------- |
| `--message \<text\>`          | ข้อความที่จะส่ง (จำเป็น)                                    |
| `--to \<dest\>`               | อนุมานคีย์เซสชันจากเป้าหมาย (โทรศัพท์, chat id)            |
| `--agent \<id\>`              | ระบุ agent ที่ตั้งค่าไว้ (ใช้ session `main` ของมัน)         |
| `--session-id \<id\>`         | ใช้ session ที่มีอยู่แล้วต่อโดยอิงตาม id                    |
| `--local`                     | บังคับใช้ runtime แบบฝังในเครื่อง (ข้าม Gateway)           |
| `--deliver`                   | ส่งคำตอบไปยังช่องแชต                                        |
| `--channel \<name\>`          | ช่องทางสำหรับการส่ง (whatsapp, telegram, discord, slack ฯลฯ) |
| `--reply-to \<target\>`       | แทนที่เป้าหมายการส่ง                                        |
| `--reply-channel \<name\>`    | แทนที่ช่องทางการส่ง                                         |
| `--reply-account \<id\>`      | แทนที่ id บัญชีสำหรับการส่ง                                 |
| `--thinking \<level\>`        | ตั้งค่าระดับการคิดสำหรับโปรไฟล์โมเดลที่เลือก                 |
| `--verbose \<on\|full\|off\>` | ตั้งค่าระดับ verbose                                        |
| `--timeout \<seconds\>`       | แทนที่ค่า timeout ของเอเจนต์                                |
| `--json`                      | แสดงผลเป็น JSON แบบมีโครงสร้าง                             |

## พฤติกรรม

- โดยค่าเริ่มต้น CLI จะทำงาน **ผ่าน Gateway** เพิ่ม `--local` เพื่อบังคับใช้
  runtime แบบฝังในเครื่องปัจจุบัน
- หากไม่สามารถเข้าถึง Gateway ได้ CLI จะ **fallback** ไปใช้การรันแบบฝังในเครื่อง
- การเลือกเซสชัน: `--to` จะอนุมานคีย์เซสชัน (เป้าหมายแบบกลุ่ม/ช่องทาง
  จะคงการแยกไว้; แชตโดยตรงจะถูกรวมเป็น `main`)
- แฟล็ก thinking และ verbose จะถูกเก็บไว้ในที่เก็บเซสชัน
- เอาต์พุต: เป็นข้อความธรรมดาโดยค่าเริ่มต้น หรือใช้ `--json` สำหรับ payload + metadata แบบมีโครงสร้าง

## ตัวอย่าง

```bash
# turn แบบง่ายพร้อมเอาต์พุต JSON
openclaw agent --to +15555550123 --message "Trace logs" --verbose on --json

# turn พร้อมระดับการคิด
openclaw agent --session-id 1234 --message "Summarize inbox" --thinking medium

# ส่งไปยังคนละช่องทางกับ session
openclaw agent --agent ops --message "Alert" --deliver --reply-channel telegram --reply-to "@admin"
```

## ที่เกี่ยวข้อง

- [ข้อมูลอ้างอิง CLI ของ Agent](/th/cli/agent)
- [Sub-agents](/th/tools/subagents) — การสร้าง Sub-agent เบื้องหลัง
- [เซสชัน](/th/concepts/session) — วิธีการทำงานของคีย์เซสชัน
