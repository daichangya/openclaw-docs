---
read_when:
    - การปรับค่าเริ่มต้นของโหมดยกระดับสิทธิ์ allowlists หรือพฤติกรรมของคำสั่ง slash
    - การทำความเข้าใจว่าเอเจนต์ที่อยู่ใน sandbox สามารถเข้าถึงโฮสต์ได้อย่างไร
summary: 'โหมดยกระดับสิทธิ์ของ exec: รันคำสั่งนอก sandbox จากเอเจนต์ที่อยู่ใน sandbox'
title: โหมดยกระดับสิทธิ์
x-i18n:
    generated_at: "2026-04-24T09:35:58Z"
    model: gpt-5.4
    provider: openai
    source_hash: 5b91b4af36f9485695f2afebe9bf8d7274d7aad6d0d88e762e581b0d091e04f7
    source_path: tools/elevated.md
    workflow: 15
---

เมื่อเอเจนต์ทำงานอยู่ภายใน sandbox คำสั่ง `exec` ของมันจะถูกจำกัดให้อยู่ภายใน
สภาพแวดล้อมของ sandbox **โหมดยกระดับสิทธิ์** ช่วยให้เอเจนต์หลุดออกมาและรันคำสั่ง
นอก sandbox แทนได้ พร้อมด่านอนุมัติที่กำหนดค่าได้

<Info>
  โหมดยกระดับสิทธิ์จะเปลี่ยนพฤติกรรมเฉพาะเมื่อเอเจนต์อยู่ในสถานะ **sandboxed** เท่านั้น สำหรับ
  เอเจนต์ที่ไม่อยู่ใน sandbox นั้น exec จะทำงานบนโฮสต์อยู่แล้ว
</Info>

## คำสั่งกำกับ

ควบคุมโหมดยกระดับสิทธิ์ต่อเซสชันด้วยคำสั่ง slash:

| คำสั่งกำกับ | สิ่งที่ทำ |
| ---------------- | ---------------------------------------------------------------------- |
| `/elevated on` | รันนอก sandbox บนพาธโฮสต์ที่กำหนดค่าไว้ โดยยังคงการอนุมัติ |
| `/elevated ask` | เหมือนกับ `on` (ชื่อแฝง) |
| `/elevated full` | รันนอก sandbox บนพาธโฮสต์ที่กำหนดค่าไว้และข้ามการอนุมัติ |
| `/elevated off` | กลับไปใช้การรันแบบจำกัดอยู่ใน sandbox |

สามารถใช้เป็น `/elev on|off|ask|full` ได้เช่นกัน

ส่ง `/elevated` โดยไม่มีอาร์กิวเมนต์เพื่อดูระดับปัจจุบัน

## วิธีการทำงาน

<Steps>
  <Step title="ตรวจสอบความพร้อมใช้งาน">
    ต้องเปิดใช้ Elevated ใน config และผู้ส่งต้องอยู่ใน allowlist:

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
    ส่งข้อความที่มีเฉพาะคำสั่งกำกับเพื่อกำหนดค่าเริ่มต้นของเซสชัน:

    ```
    /elevated full
    ```

    หรือใช้แบบ inline (มีผลกับข้อความนั้นเท่านั้น):

    ```
    /elevated on run the deployment script
    ```

  </Step>

  <Step title="คำสั่งทำงานนอก sandbox">
    เมื่อเปิดใช้ elevated แล้ว การเรียก `exec` จะออกจาก sandbox โฮสต์ที่มีผลจริง
    จะเป็น `gateway` โดยค่าเริ่มต้น หรือ `node` เมื่อ exec target ที่กำหนดค่าไว้/ของเซสชันเป็น
    `node` ในโหมด `full` การอนุมัติ exec จะถูกข้าม ส่วนในโหมด `on`/`ask`
    กฎการอนุมัติที่กำหนดค่าไว้จะยังคงมีผล
  </Step>
</Steps>

## ลำดับการ resolve

1. **คำสั่งกำกับแบบ inline** ในข้อความ (มีผลเฉพาะข้อความนั้น)
2. **override ระดับเซสชัน** (ตั้งค่าโดยการส่งข้อความที่มีเฉพาะคำสั่งกำกับ)
3. **ค่าเริ่มต้นระดับ global** (`agents.defaults.elevatedDefault` ใน config)

## ความพร้อมใช้งานและ allowlists

- **ด่าน global**: `tools.elevated.enabled` (ต้องเป็น `true`)
- **allowlist ของผู้ส่ง**: `tools.elevated.allowFrom` พร้อมรายการแยกตามช่องทางส่งข้อความ
- **ด่านต่อเอเจนต์**: `agents.list[].tools.elevated.enabled` (ใช้จำกัดเพิ่มเติมได้เท่านั้น)
- **allowlist ต่อเอเจนต์**: `agents.list[].tools.elevated.allowFrom` (ผู้ส่งต้องตรงทั้ง global + ต่อเอเจนต์)
- **fallback ของ Discord**: หากไม่ได้ระบุ `tools.elevated.allowFrom.discord` จะใช้ `channels.discord.allowFrom` เป็น fallback
- **ทุกด่านต้องผ่านทั้งหมด**; มิฉะนั้น elevated จะถือว่าไม่พร้อมใช้งาน

รูปแบบรายการใน allowlist:

| Prefix | จับคู่กับ |
| ----------------------- | ------------------------------- |
| (ไม่มี) | Sender ID, E.164 หรือฟิลด์ From |
| `name:` | ชื่อที่ใช้แสดงผลของผู้ส่ง |
| `username:` | ชื่อผู้ใช้ของผู้ส่ง |
| `tag:` | tag ของผู้ส่ง |
| `id:`, `from:`, `e164:` | การระบุเป้าหมายตัวตนแบบ explicit |

## สิ่งที่ elevated ไม่ได้ควบคุม

- **นโยบายเครื่องมือ**: หาก `exec` ถูกปฏิเสธโดยนโยบายเครื่องมือ elevated จะ override ไม่ได้
- **นโยบายการเลือกโฮสต์**: elevated ไม่ได้เปลี่ยน `auto` ให้กลายเป็นการ override ข้ามโฮสต์แบบอิสระ มันจะใช้กฎ exec target ของการตั้งค่า/ของเซสชัน โดยเลือก `node` เฉพาะเมื่อ target เป็น `node` อยู่แล้ว
- **แยกจาก `/exec`**: คำสั่งกำกับ `/exec` ใช้ปรับค่าเริ่มต้นของ exec ต่อเซสชันสำหรับผู้ส่งที่ได้รับอนุญาต และไม่ต้องใช้โหมดยกระดับสิทธิ์

## ที่เกี่ยวข้อง

- [Exec tool](/th/tools/exec) — การรันคำสั่ง shell
- [Exec approvals](/th/tools/exec-approvals) — ระบบการอนุมัติและ allowlist
- [Sandboxing](/th/gateway/sandboxing) — การกำหนดค่า sandbox
- [Sandbox เทียบกับ Tool Policy เทียบกับ Elevated](/th/gateway/sandbox-vs-tool-policy-vs-elevated)
