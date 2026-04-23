---
read_when:
    - การเปลี่ยนกฎของข้อความกลุ่มหรือการกล่าวถึง
summary: พฤติกรรมและการตั้งค่าสำหรับการจัดการข้อความกลุ่มของ WhatsApp (`mentionPatterns` ใช้ร่วมกันในทุกพื้นผิว)
title: ข้อความกลุ่ม
x-i18n:
    generated_at: "2026-04-23T05:25:44Z"
    model: gpt-5.4
    provider: openai
    source_hash: 5d9484dd1de74d42f8dce4c3ac80d60c24864df30a7802e64893ef55506230fe
    source_path: channels/group-messages.md
    workflow: 15
---

# ข้อความกลุ่ม (ช่องทาง WhatsApp web)

เป้าหมาย: ให้ Clawd อยู่ในกลุ่ม WhatsApp, ตื่นขึ้นมาเมื่อถูกเรียกเท่านั้น และแยกเธรดนั้นออกจากเซสชัน DM ส่วนตัว

หมายเหตุ: ตอนนี้ `agents.list[].groupChat.mentionPatterns` ถูกใช้กับ Telegram/Discord/Slack/iMessage ด้วยเช่นกัน เอกสารนี้เน้นพฤติกรรมเฉพาะของ WhatsApp สำหรับการตั้งค่าแบบหลายเอเจนต์ ให้ตั้ง `agents.list[].groupChat.mentionPatterns` แยกตามแต่ละเอเจนต์ (หรือใช้ `messages.groupChat.mentionPatterns` เป็น fallback ระดับโกลบอล)

## การทำงานปัจจุบัน (2025-12-03)

- โหมดการเปิดใช้งาน: `mention` (ค่าเริ่มต้น) หรือ `always` โดย `mention` ต้องมีการเรียกหา (การ @-mention จริงของ WhatsApp ผ่าน `mentionedJids`, safe regex patterns หรือ E.164 ของบอตที่อยู่ตรงไหนก็ได้ในข้อความ) ส่วน `always` จะปลุกเอเจนต์ทุกข้อความ แต่ควรตอบกลับเฉพาะเมื่อสามารถเพิ่มคุณค่าที่มีความหมายได้เท่านั้น มิฉะนั้นจะคืน silent token แบบตรงตัว `NO_REPLY` / `no_reply` สามารถตั้งค่าเริ่มต้นได้ใน config (`channels.whatsapp.groups`) และ override รายกลุ่มได้ผ่าน `/activation` เมื่อกำหนด `channels.whatsapp.groups` แล้ว ค่านี้จะทำหน้าที่เป็น allowlist ของกลุ่มด้วย (ใส่ `"*"` เพื่ออนุญาตทุกกลุ่ม)
- นโยบายกลุ่ม: `channels.whatsapp.groupPolicy` ควบคุมว่าจะยอมรับข้อความกลุ่มหรือไม่ (`open|disabled|allowlist`) โดย `allowlist` ใช้ `channels.whatsapp.groupAllowFrom` (fallback: `channels.whatsapp.allowFrom` ที่ระบุชัดเจน) ค่าเริ่มต้นคือ `allowlist` (บล็อกไว้จนกว่าคุณจะเพิ่มผู้ส่ง)
- เซสชันแยกรายกลุ่ม: session keys จะมีรูปแบบ `agent:<agentId>:whatsapp:group:<jid>` ดังนั้นคำสั่งอย่าง `/verbose on`, `/trace on` หรือ `/think high` (ที่ส่งเป็นข้อความเดี่ยว) จะมีผลเฉพาะกับกลุ่มนั้น โดยไม่แตะต้องสถานะ DM ส่วนตัว Heartbeat จะถูกข้ามสำหรับเธรดของกลุ่ม
- การแทรกบริบท: ข้อความกลุ่มแบบ **pending-only** (ค่าเริ่มต้น 50 ข้อความ) ที่ _ไม่ได้_ กระตุ้นให้เกิดการรัน จะถูกเติมนำหน้าใต้ `[Chat messages since your last reply - for context]` และบรรทัดที่เป็นตัวกระตุ้นจะอยู่ใต้ `[Current message - respond to this]` ข้อความที่อยู่ในเซสชันแล้วจะไม่ถูกแทรกซ้ำ
- การแสดงผู้ส่ง: ทุกชุดข้อความกลุ่มจะลงท้ายด้วย `[from: Sender Name (+E164)]` เพื่อให้ Pi รู้ว่าใครกำลังพูด
- ข้อความชั่วคราว/view-once: เราจะแกะห่อข้อความเหล่านั้นก่อนดึงข้อความ/mentions ดังนั้นการเรียกหาภายในข้อความประเภทนี้ยังคงกระตุ้นได้
- system prompt ของกลุ่ม: ในเทิร์นแรกของเซสชันกลุ่ม (และทุกครั้งที่ `/activation` เปลี่ยนโหมด) เราจะแทรกข้อความสั้นๆ เข้าไปใน system prompt เช่น `You are replying inside the WhatsApp group "<subject>". Group members: Alice (+44...), Bob (+43...), … Activation: trigger-only … Address the specific sender noted in the message context.` หากไม่มี metadata เราก็ยังบอกเอเจนต์ว่าเป็นแชตกลุ่ม

## ตัวอย่างการตั้งค่า (WhatsApp)

เพิ่มบล็อก `groupChat` ลงใน `~/.openclaw/openclaw.json` เพื่อให้การเรียกหาด้วยชื่อที่แสดงผลทำงานได้ แม้ WhatsApp จะตัดเครื่องหมาย `@` ที่มองเห็นออกจากเนื้อความ:

```json5
{
  channels: {
    whatsapp: {
      groups: {
        "*": { requireMention: true },
      },
    },
  },
  agents: {
    list: [
      {
        id: "main",
        groupChat: {
          historyLimit: 50,
          mentionPatterns: ["@?openclaw", "\\+?15555550123"],
        },
      },
    ],
  },
}
```

หมายเหตุ:

- regex เหล่านี้ไม่สนตัวพิมพ์เล็ก-ใหญ่ และใช้ safe-regex guardrails เดียวกันกับพื้นผิว regex อื่นๆ ใน config โดยแพตเทิร์นที่ไม่ถูกต้องและ nested repetition ที่ไม่ปลอดภัยจะถูกเพิกเฉย
- WhatsApp ยังคงส่ง mentions แบบ canonical ผ่าน `mentionedJids` เมื่อมีคนแตะที่รายชื่อผู้ติดต่อ ดังนั้น fallback เป็นหมายเลขจึงแทบไม่จำเป็น แต่ก็เป็นตาข่ายนิรภัยที่มีประโยชน์

### คำสั่งเปิดใช้งาน (เจ้าของเท่านั้น)

ใช้คำสั่งแชตกลุ่ม:

- `/activation mention`
- `/activation always`

มีเพียงหมายเลขของเจ้าของเท่านั้น (จาก `channels.whatsapp.allowFrom` หรือ E.164 ของบอตเองเมื่อไม่ได้ตั้งค่า) ที่สามารถเปลี่ยนสิ่งนี้ได้ ส่ง `/status` เป็นข้อความเดี่ยวในกลุ่มเพื่อดูโหมดการเปิดใช้งานปัจจุบัน

## วิธีใช้งาน

1. เพิ่มบัญชี WhatsApp ของคุณ (บัญชีที่รัน OpenClaw) เข้าไปในกลุ่ม
2. พิมพ์ `@openclaw …` (หรือใส่หมายเลข) โดยจะมีเพียงผู้ส่งที่อยู่ใน allowlist เท่านั้นที่กระตุ้นได้ เว้นแต่คุณจะตั้ง `groupPolicy: "open"`
3. พรอมป์ต์ของเอเจนต์จะมีบริบทกลุ่มล่าสุดรวมถึงตัวระบุ `[from: …]` ที่ต่อท้ายมา เพื่อให้ตอบกลับบุคคลที่ถูกต้องได้
4. คำสั่งระดับเซสชัน (`/verbose on`, `/trace on`, `/think high`, `/new` หรือ `/reset`, `/compact`) จะมีผลเฉพาะกับเซสชันของกลุ่มนั้นเท่านั้น ให้ส่งเป็นข้อความเดี่ยวเพื่อให้ระบบลงทะเบียน เซสชัน DM ส่วนตัวของคุณจะยังคงแยกอิสระ

## การทดสอบ / การตรวจสอบ

- การทดสอบแบบ manual smoke:
  - ส่งการเรียกหา `@openclaw` ในกลุ่ม และยืนยันว่ามีการตอบกลับที่อ้างอิงชื่อผู้ส่ง
  - ส่งการเรียกหาครั้งที่สอง และตรวจสอบว่าบล็อกประวัติถูกรวมเข้ามา แล้วถูกล้างในเทิร์นถัดไป
- ตรวจสอบล็อกของ Gateway (รันด้วย `--verbose`) เพื่อดูรายการ `inbound web message` ที่แสดง `from: <groupJid>` และ suffix `[from: …]`

## ข้อควรพิจารณาที่ทราบแล้ว

- Heartbeat ถูกข้ามสำหรับกลุ่มโดยตั้งใจ เพื่อหลีกเลี่ยงการกระจายข้อความที่รบกวน
- การป้องกัน echo ใช้สตริงของชุดข้อความที่รวมกัน หากคุณส่งข้อความเดียวกันสองครั้งโดยไม่มี mentions จะมีเพียงครั้งแรกเท่านั้นที่ได้รับการตอบกลับ
- รายการใน session store จะปรากฏเป็น `agent:<agentId>:whatsapp:group:<jid>` ใน session store (ค่าเริ่มต้นคือ `~/.openclaw/agents/<agentId>/sessions/sessions.json`) โดยหากไม่มีรายการดังกล่าว ก็เพียงหมายความว่ากลุ่มนั้นยังไม่เคยกระตุ้นให้เกิดการรัน
- ตัวบ่งชี้การพิมพ์ในกลุ่มเป็นไปตาม `agents.defaults.typingMode` (ค่าเริ่มต้น: `message` เมื่อไม่ได้ถูก mention)
