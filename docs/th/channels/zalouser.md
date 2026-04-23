---
read_when:
    - การตั้งค่า Zalo ส่วนตัวสำหรับ OpenClaw
    - การดีบักการเข้าสู่ระบบหรือโฟลว์ข้อความของ Zalo ส่วนตัว
summary: การรองรับบัญชีส่วนตัว Zalo ผ่าน zca-js แบบเนทีฟ (เข้าสู่ระบบด้วย QR) ความสามารถ และการกำหนดค่า
title: Zalo ส่วนตัว
x-i18n:
    generated_at: "2026-04-23T05:28:43Z"
    model: gpt-5.4
    provider: openai
    source_hash: 08f50edb2f4c6fe24972efe5e321f5fd0572c7d29af5c1db808151c7c943dc66
    source_path: channels/zalouser.md
    workflow: 15
---

# Zalo ส่วนตัว (ไม่เป็นทางการ)

สถานะ: ระยะทดลอง การผสานรวมนี้ทำงานอัตโนมัติกับ **บัญชี Zalo ส่วนตัว** ผ่าน `zca-js` แบบเนทีฟภายใน OpenClaw

> **คำเตือน:** นี่เป็นการผสานรวมที่ไม่เป็นทางการ และอาจทำให้บัญชีถูกระงับ/แบน ใช้งานโดยยอมรับความเสี่ยงเอง

## Plugin ที่มาพร้อมกัน

Zalo ส่วนตัวมาพร้อมเป็น Plugin ที่รวมมาในรีลีส OpenClaw ปัจจุบัน ดังนั้น
บิลด์แพ็กเกจปกติจึงไม่ต้องติดตั้งแยกต่างหาก

หากคุณใช้บิลด์เก่าหรือการติดตั้งแบบกำหนดเองที่ไม่รวม Zalo ส่วนตัว
ให้ติดตั้งด้วยตนเอง:

- ติดตั้งผ่าน CLI: `openclaw plugins install @openclaw/zalouser`
- หรือจาก source checkout: `openclaw plugins install ./path/to/local/zalouser-plugin`
- รายละเอียด: [Plugins](/th/tools/plugin)

ไม่ต้องใช้ไบนารี CLI ภายนอก `zca`/`openzca`

## การตั้งค่าแบบรวดเร็ว (สำหรับผู้เริ่มต้น)

1. ตรวจสอบให้แน่ใจว่า Plugin Zalo ส่วนตัวพร้อมใช้งาน
   - รีลีส OpenClaw แบบแพ็กเกจในปัจจุบันรวมมาให้แล้ว
   - การติดตั้งแบบเก่า/กำหนดเองสามารถเพิ่มได้ด้วยตนเองด้วยคำสั่งด้านบน
2. เข้าสู่ระบบ (QR, บนเครื่อง Gateway):
   - `openclaw channels login --channel zalouser`
   - สแกน QR code ด้วยแอป Zalo บนมือถือ
3. เปิดใช้ช่องทาง:

```json5
{
  channels: {
    zalouser: {
      enabled: true,
      dmPolicy: "pairing",
    },
  },
}
```

4. รีสตาร์ต Gateway (หรือทำการตั้งค่าต่อให้เสร็จ)
5. การเข้าถึง DM ใช้การจับคู่เป็นค่าเริ่มต้น; อนุมัติโค้ดการจับคู่เมื่อติดต่อครั้งแรก

## สิ่งนี้คืออะไร

- ทำงานทั้งหมดภายในโปรเซสผ่าน `zca-js`
- ใช้ event listener แบบเนทีฟเพื่อรับข้อความขาเข้า
- ส่งคำตอบกลับโดยตรงผ่าน JS API (ข้อความ/สื่อ/ลิงก์)
- ออกแบบมาสำหรับกรณีใช้งานแบบ “บัญชีส่วนตัว” ที่ไม่มี Zalo Bot API ให้ใช้

## การตั้งชื่อ

ID ของช่องทางคือ `zalouser` เพื่อให้ชัดเจนว่านี่เป็นการทำงานอัตโนมัติกับ **บัญชีผู้ใช้ Zalo ส่วนตัว** (ไม่เป็นทางการ) เราสงวน `zalo` ไว้สำหรับการผสานรวม Zalo API แบบทางการที่อาจมีในอนาคต

## การค้นหา ID (directory)

ใช้ CLI ของ directory เพื่อค้นหา peer/group และ ID ของพวกมัน:

```bash
openclaw directory self --channel zalouser
openclaw directory peers list --channel zalouser --query "name"
openclaw directory groups list --channel zalouser --query "work"
```

## ข้อจำกัด

- ข้อความขาออกจะถูกแบ่งเป็นชิ้นประมาณ ~2000 อักขระ (ข้อจำกัดของไคลเอนต์ Zalo)
- การสตรีมถูกบล็อกไว้เป็นค่าเริ่มต้น

## การควบคุมการเข้าถึง (DM)

`channels.zalouser.dmPolicy` รองรับ: `pairing | allowlist | open | disabled` (ค่าเริ่มต้น: `pairing`)

`channels.zalouser.allowFrom` รับ user ID หรือชื่อ ระหว่างการตั้งค่า ชื่อจะถูก resolve เป็น ID โดยใช้การค้นหารายชื่อผู้ติดต่อภายในโปรเซสของ Plugin

อนุมัติผ่าน:

- `openclaw pairing list zalouser`
- `openclaw pairing approve zalouser <code>`

## การเข้าถึงกลุ่ม (ไม่บังคับ)

- ค่าเริ่มต้น: `channels.zalouser.groupPolicy = "open"` (อนุญาตกลุ่ม) ใช้ `channels.defaults.groupPolicy` เพื่อ override ค่าเริ่มต้นเมื่อไม่ได้ตั้งค่า
- จำกัดด้วย allowlist ได้โดยใช้:
  - `channels.zalouser.groupPolicy = "allowlist"`
  - `channels.zalouser.groups` (คีย์ควรเป็น group ID ที่คงที่; ชื่อจะถูก resolve เป็น ID ตอนเริ่มต้นเมื่อทำได้)
  - `channels.zalouser.groupAllowFrom` (ควบคุมว่าผู้ส่งคนใดในกลุ่มที่ได้รับอนุญาตสามารถกระตุ้นบอตได้)
- บล็อกทุกกลุ่ม: `channels.zalouser.groupPolicy = "disabled"`
- วิซาร์ดการกำหนดค่าสามารถพรอมป์สำหรับ group allowlist ได้
- ตอนเริ่มต้น OpenClaw จะ resolve ชื่อกลุ่ม/ผู้ใช้ใน allowlist เป็น ID และบันทึกการแมปลงในล็อก
- การจับคู่ group allowlist ใช้ ID เท่านั้นเป็นค่าเริ่มต้น ชื่อที่ resolve ไม่ได้จะถูกละเว้นสำหรับการยืนยันสิทธิ์ เว้นแต่จะเปิด `channels.zalouser.dangerouslyAllowNameMatching: true`
- `channels.zalouser.dangerouslyAllowNameMatching: true` เป็นโหมดความเข้ากันได้ฉุกเฉินที่เปิดให้จับคู่ด้วยชื่อกลุ่มที่เปลี่ยนแปลงได้อีกครั้ง
- หากไม่ได้ตั้งค่า `groupAllowFrom` รันไทม์จะ fallback ไปใช้ `allowFrom` สำหรับการตรวจสอบผู้ส่งในกลุ่ม
- การตรวจสอบผู้ส่งมีผลทั้งกับข้อความกลุ่มปกติและคำสั่งควบคุม (เช่น `/new`, `/reset`)

ตัวอย่าง:

```json5
{
  channels: {
    zalouser: {
      groupPolicy: "allowlist",
      groupAllowFrom: ["1471383327500481391"],
      groups: {
        "123456789": { allow: true },
        "Work Chat": { allow: true },
      },
    },
  },
}
```

### การกำหนดให้ต้องมีการ mention ในกลุ่ม

- `channels.zalouser.groups.<group>.requireMention` ควบคุมว่าการตอบกลับในกลุ่มต้องมีการ mention หรือไม่
- ลำดับการ resolve: group id/name แบบตรงกันพอดี -> group slug ที่ normalized -> `*` -> ค่าเริ่มต้น (`true`)
- สิ่งนี้มีผลทั้งกับกลุ่มใน allowlist และโหมดกลุ่มแบบ open
- การอ้างอิงข้อความของบอตนับเป็นการ mention โดยปริยายสำหรับการเปิดใช้งานในกลุ่ม
- คำสั่งควบคุมที่ได้รับอนุญาต (เช่น `/new`) สามารถข้ามข้อกำหนดการ mention ได้
- เมื่อข้อความกลุ่มถูกข้ามเพราะต้องมีการ mention OpenClaw จะเก็บข้อความนั้นไว้เป็นประวัติกลุ่มที่รอดำเนินการ และรวมมันไว้กับข้อความกลุ่มถัดไปที่ถูกประมวลผล
- ขีดจำกัดประวัติกลุ่มมีค่าเริ่มต้นเป็น `messages.groupChat.historyLimit` (fallback `50`) คุณสามารถ override ต่อบัญชีได้ด้วย `channels.zalouser.historyLimit`

ตัวอย่าง:

```json5
{
  channels: {
    zalouser: {
      groupPolicy: "allowlist",
      groups: {
        "*": { allow: true, requireMention: true },
        "Work Chat": { allow: true, requireMention: false },
      },
    },
  },
}
```

## หลายบัญชี

บัญชีจะถูกแมปไปยังโปรไฟล์ `zalouser` ในสถานะของ OpenClaw ตัวอย่าง:

```json5
{
  channels: {
    zalouser: {
      enabled: true,
      defaultAccount: "default",
      accounts: {
        work: { enabled: true, profile: "work" },
      },
    },
  },
}
```

## การพิมพ์ รีแอ็กชัน และการยืนยันการส่งมอบ

- OpenClaw จะส่งเหตุการณ์การพิมพ์ก่อนส่งคำตอบกลับ (พยายามอย่างดีที่สุด)
- รองรับ action รีแอ็กชันข้อความ `react` สำหรับ `zalouser` ใน channel actions
  - ใช้ `remove: true` เพื่อลบอีโมจิรีแอ็กชันที่ระบุออกจากข้อความ
  - ความหมายของรีแอ็กชัน: [Reactions](/th/tools/reactions)
- สำหรับข้อความขาเข้าที่มี event metadata OpenClaw จะส่งการยืนยันแบบ delivered + seen (พยายามอย่างดีที่สุด)

## การแก้ไขปัญหา

**การเข้าสู่ระบบไม่ค้างอยู่:**

- `openclaw channels status --probe`
- เข้าสู่ระบบใหม่: `openclaw channels logout --channel zalouser && openclaw channels login --channel zalouser`

**allowlist/ชื่อกลุ่ม resolve ไม่ได้:**

- ใช้ ID ตัวเลขใน `allowFrom`/`groupAllowFrom`/`groups` หรือใช้ชื่อเพื่อน/ชื่อกลุ่มแบบตรงกันพอดี

**อัปเกรดมาจากการตั้งค่าแบบเก่าที่ใช้ CLI:**

- ลบสมมติฐานเดิมที่ว่าต้องมีโปรเซส `zca` ภายนอก
- ตอนนี้ช่องทางนี้ทำงานทั้งหมดภายใน OpenClaw โดยไม่ต้องใช้ไบนารี CLI ภายนอก

## ที่เกี่ยวข้อง

- [ภาพรวมของช่องทาง](/th/channels) — ช่องทางที่รองรับทั้งหมด
- [การจับคู่](/th/channels/pairing) — การยืนยันตัวตน DM และขั้นตอนการจับคู่
- [กลุ่ม](/th/channels/groups) — พฤติกรรมของแชตกลุ่มและการกำหนดให้ต้องมีการ mention
- [การกำหนดเส้นทางช่องทาง](/th/channels/channel-routing) — การกำหนดเส้นทางเซสชันสำหรับข้อความ
- [ความปลอดภัย](/th/gateway/security) — โมเดลการเข้าถึงและการเสริมความแข็งแรง
