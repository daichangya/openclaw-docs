---
read_when:
    - กำลังปรับค่าเริ่มต้น allowlists หรือพฤติกรรมของ slash command ใน Elevated Mode
    - ทำความเข้าใจว่าเอเจนต์ที่อยู่ใน sandbox สามารถเข้าถึงโฮสต์ได้อย่างไร
summary: 'โหมด elevated exec: รันคำสั่งนอก sandbox จากเอเจนต์ที่อยู่ใน sandbox'
title: Elevated Mode
x-i18n:
    generated_at: "2026-04-23T06:00:14Z"
    model: gpt-5.4
    provider: openai
    source_hash: f6f0ca0a7c03c94554a70fee775aa92085f15015850c3abaa2c1c46ced9d3c2e
    source_path: tools/elevated.md
    workflow: 15
---

# Elevated Mode

เมื่อเอเจนต์ทำงานอยู่ภายใน sandbox คำสั่ง `exec` ของมันจะถูกจำกัดให้อยู่ใน
สภาพแวดล้อมของ sandbox **Elevated mode** ช่วยให้เอเจนต์หลุดออกมาและรันคำสั่ง
นอก sandbox ได้แทน พร้อมด่านอนุมัติที่กำหนดค่าได้

<Info>
  Elevated mode จะเปลี่ยนพฤติกรรมเฉพาะเมื่อเอเจนต์ถูก **sandboxed** เท่านั้น สำหรับ
  เอเจนต์ที่ไม่ได้อยู่ใน sandbox, exec จะรันบนโฮสต์อยู่แล้ว
</Info>

## Directives

ควบคุม elevated mode รายเซสชันด้วย slash commands:

| Directive        | สิ่งที่ทำ                                                           |
| ---------------- | ---------------------------------------------------------------------- |
| `/elevated on`   | รันนอก sandbox บน host path ที่กำหนดค่าไว้ โดยยังคงใช้ approvals    |
| `/elevated ask`  | เหมือน `on` (alias)                                                   |
| `/elevated full` | รันนอก sandbox บน host path ที่กำหนดค่าไว้และข้าม approvals |
| `/elevated off`  | กลับไปรันแบบถูกจำกัดอยู่ใน sandbox                                   |

มีให้ใช้ในรูปแบบ `/elev on|off|ask|full` เช่นกัน

ส่ง `/elevated` โดยไม่มีอาร์กิวเมนต์เพื่อดูระดับปัจจุบัน

## วิธีการทำงาน

<Steps>
  <Step title="ตรวจสอบความพร้อมใช้งาน">
    ต้องเปิดใช้งาน Elevated ในคอนฟิก และผู้ส่งต้องอยู่ใน allowlist:

    ```json5
    {
      tools: {
        elevated: {
          enabled: true,
          allowFrom: {
            discord: ["user-id-123"],
            whatsapp: ["+15555550123"],
          },
        },
      },
    }
    ```

  </Step>

  <Step title="ตั้งค่าระดับ">
    ส่งข้อความที่มีแต่ directive เพื่อกำหนดค่าเริ่มต้นของเซสชัน:

    ```
    /elevated full
    ```

    หรือใช้แบบ inline (มีผลเฉพาะกับข้อความนั้น):

    ```
    /elevated on run the deployment script
    ```

  </Step>

  <Step title="คำสั่งจะรันนอก sandbox">
    เมื่อ elevated ทำงาน `exec` calls จะออกจาก sandbox โฮสต์ที่มีผลจริงคือ
    `gateway` โดยค่าเริ่มต้น หรือ `node` เมื่อ exec target ที่กำหนดค่า/กำหนดในเซสชันเป็น
    `node` ในโหมด `full` ระบบจะข้าม exec approvals ในโหมด `on`/`ask`
    กฎการอนุมัติที่กำหนดค่าไว้จะยังคงมีผล
  </Step>
</Steps>

## ลำดับการ resolve

1. **Inline directive** บนข้อความ (มีผลเฉพาะข้อความนั้น)
2. **Session override** (ตั้งค่าโดยการส่งข้อความที่มีแต่ directive)
3. **Global default** (`agents.defaults.elevatedDefault` ในคอนฟิก)

## ความพร้อมใช้งานและ allowlists

- **Global gate**: `tools.elevated.enabled` (ต้องเป็น `true`)
- **Sender allowlist**: `tools.elevated.allowFrom` พร้อมรายการแยกตามช่องทาง
- **Per-agent gate**: `agents.list[].tools.elevated.enabled` (จำกัดได้มากขึ้นเท่านั้น)
- **Per-agent allowlist**: `agents.list[].tools.elevated.allowFrom` (ผู้ส่งต้องตรงทั้ง global + per-agent)
- **Discord fallback**: หากละ `tools.elevated.allowFrom.discord` ไว้ ระบบจะใช้ `channels.discord.allowFrom` เป็น fallback
- **ทุก gate ต้องผ่านทั้งหมด**; มิฉะนั้นจะถือว่า elevated ใช้งานไม่ได้

รูปแบบรายการ allowlist:

| Prefix                  | ตรงกับ                         |
| ----------------------- | ------------------------------- |
| (ไม่มี)                  | Sender ID, E.164 หรือช่อง From |
| `name:`                 | ชื่อที่แสดงของผู้ส่ง             |
| `username:`             | username ของผู้ส่ง                 |
| `tag:`                  | tag ของผู้ส่ง                      |
| `id:`, `from:`, `e164:` | การระบุตัวตนแบบ explicit     |

## สิ่งที่ elevated ไม่ได้ควบคุม

- **Tool policy**: หาก `exec` ถูกปฏิเสธโดย tool policy, elevated จะ override ไม่ได้
- **Host selection policy**: elevated ไม่ได้เปลี่ยน `auto` ให้กลายเป็นการ override ข้ามโฮสต์แบบอิสระ มันใช้กฎ exec target ตามที่กำหนดค่า/กำหนดในเซสชัน โดยจะเลือก `node` เฉพาะเมื่อ target เป็น `node` อยู่แล้ว
- **แยกจาก `/exec`**: directive `/exec` จะปรับค่าเริ่มต้นของ exec แบบรายเซสชันสำหรับผู้ส่งที่ได้รับอนุญาต และไม่ต้องใช้ elevated mode

## ที่เกี่ยวข้อง

- [Exec tool](/th/tools/exec) — การรัน shell command
- [Exec approvals](/th/tools/exec-approvals) — ระบบการอนุมัติและ allowlist
- [Sandboxing](/th/gateway/sandboxing) — การกำหนดค่า sandbox
- [Sandbox เทียบกับ Tool Policy เทียบกับ Elevated](/th/gateway/sandbox-vs-tool-policy-vs-elevated)
