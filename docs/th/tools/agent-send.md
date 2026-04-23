---
read_when:
    - คุณต้องการทริกเกอร์การรันของเอเจนต์จากสคริปต์หรือบรรทัดคำสั่ง
    - คุณต้องการส่งคำตอบของเอเจนต์ไปยังช่องทางแชตแบบเป็นโปรแกรม
summary: |-
    รันเทิร์นของเอเจนต์จาก CLI และเลือกส่งคำตอบไปยัง channels ได้＠＼(^analysis to=functions.read  ฝ่ายขายละครիքjson
    {"path":"docs/cli/agent.md"}
title: การส่งโดยเอเจนต์
x-i18n:
    generated_at: "2026-04-23T05:58:40Z"
    model: gpt-5.4
    provider: openai
    source_hash: 0550ad38efb2711f267a62b905fd150987a98801247de780ed3df97f27245704
    source_path: tools/agent-send.md
    workflow: 15
---

# การส่งโดยเอเจนต์

`openclaw agent` จะรันเทิร์นของเอเจนต์หนึ่งครั้งจากบรรทัดคำสั่งโดยไม่ต้องมี
ข้อความแชตขาเข้า ใช้สำหรับเวิร์กโฟลว์แบบสคริปต์ การทดสอบ และ
การส่งแบบเป็นโปรแกรม

## เริ่มต้นอย่างรวดเร็ว

<Steps>
  <Step title="รันเทิร์นของเอเจนต์แบบง่าย">
    ```bash
    openclaw agent --message "What is the weather today?"
    ```

    คำสั่งนี้จะส่งข้อความผ่าน Gateway และพิมพ์คำตอบออกมา

  </Step>

  <Step title="กำหนดเป้าหมายเอเจนต์หรือเซสชันเฉพาะ">
    ```bash
    # กำหนดเป้าหมายเอเจนต์เฉพาะ
    openclaw agent --agent ops --message "Summarize logs"

    # กำหนดเป้าหมายไปยังหมายเลขโทรศัพท์ (derive session key)
    openclaw agent --to +15555550123 --message "Status update"

    # ใช้เซสชันเดิมต่อ
    openclaw agent --session-id abc123 --message "Continue the task"
    ```

  </Step>

  <Step title="ส่งคำตอบไปยัง channel">
    ```bash
    # ส่งไปยัง WhatsApp (channel ค่าเริ่มต้น)
    openclaw agent --to +15555550123 --message "Report ready" --deliver

    # ส่งไปยัง Slack
    openclaw agent --agent ops --message "Generate report" \
      --deliver --reply-channel slack --reply-to "#reports"
    ```

  </Step>
</Steps>

## แฟล็ก

| แฟล็ก                         | คำอธิบาย                                                     |
| ---------------------------- | ------------------------------------------------------------ |
| `--message \<text\>`         | ข้อความที่จะส่ง (จำเป็น)                                     |
| `--to \<dest\>`              | derive session key จากเป้าหมาย (โทรศัพท์, chat id)           |
| `--agent \<id\>`             | กำหนดเป้าหมายไปยังเอเจนต์ที่กำหนดค่าไว้ (ใช้เซสชัน `main` ของมัน) |
| `--session-id \<id\>`        | ใช้เซสชันเดิมต่อโดยอ้างอิงจาก id                             |
| `--local`                    | บังคับใช้รันไทม์แบบฝังตัวในเครื่อง (ข้าม Gateway)           |
| `--deliver`                  | ส่งคำตอบไปยัง chat channel                                   |
| `--channel \<name\>`         | channel สำหรับการส่ง (whatsapp, telegram, discord, slack ฯลฯ) |
| `--reply-to \<target\>`      | override เป้าหมายการส่ง                                      |
| `--reply-channel \<name\>`   | override channel การส่ง                                       |
| `--reply-account \<id\>`     | override delivery account id                                  |
| `--thinking \<level\>`       | ตั้งค่าระดับ thinking สำหรับ model profile ที่เลือก           |
| `--verbose \<on\|full\|off\>` | ตั้งค่าระดับ verbose                                         |
| `--timeout \<seconds\>`      | override agent timeout                                        |
| `--json`                     | แสดงผลเป็น JSON แบบมีโครงสร้าง                              |

## พฤติกรรม

- ตามค่าเริ่มต้น CLI จะวิ่ง **ผ่าน Gateway** เพิ่ม `--local` หากต้องการบังคับให้ใช้
  embedded runtime บนเครื่องปัจจุบัน
- หากเข้าถึง Gateway ไม่ได้ CLI จะ **fallback** ไปยัง local embedded run
- การเลือกเซสชัน: `--to` จะ derive session key (เป้าหมายแบบกลุ่ม/channel
  จะคงการแยกไว้; direct chats จะถูกรวมเข้า `main`)
- แฟล็ก thinking และ verbose จะถูกเก็บไว้ใน session store
- เอาต์พุต: ข้อความธรรมดาเป็นค่าเริ่มต้น หรือใช้ `--json` เพื่อผลลัพธ์แบบมีโครงสร้างพร้อม metadata

## ตัวอย่าง

```bash
# เทิร์นแบบง่ายพร้อมเอาต์พุต JSON
openclaw agent --to +15555550123 --message "Trace logs" --verbose on --json

# เทิร์นพร้อมระดับ thinking
openclaw agent --session-id 1234 --message "Summarize inbox" --thinking medium

# ส่งไปยัง channel ที่ต่างจากเซสชัน
openclaw agent --agent ops --message "Alert" --deliver --reply-channel telegram --reply-to "@admin"
```

## ที่เกี่ยวข้อง

- [Agent CLI reference](/cli/agent)
- [Sub-agents](/th/tools/subagents) — การ spawn sub-agent แบบเบื้องหลัง
- [Sessions](/th/concepts/session) — วิธีการทำงานของ session keys
