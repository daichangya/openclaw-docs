---
read_when:
    - การตั้งค่า Zalo Personal สำหรับ OpenClaw
    - การแก้จุดบกพร่องการล็อกอินหรือการไหลของข้อความของ Zalo Personal
summary: การรองรับบัญชีส่วนตัว Zalo ผ่าน native zca-js (ล็อกอินด้วย QR), ความสามารถ และการกำหนดค่า
title: Zalo personal
x-i18n:
    generated_at: "2026-04-24T09:01:02Z"
    model: gpt-5.4
    provider: openai
    source_hash: 18a7edbe3e7a65861628f004ecf6cf2b924b531ba7271d14fa37a6834cdd2545
    source_path: channels/zalouser.md
    workflow: 15
---

# Zalo Personal (ไม่เป็นทางการ)

สถานะ: experimental การเชื่อมต่อนี้ทำงานอัตโนมัติกับ **บัญชี Zalo ส่วนตัว** ผ่าน `zca-js` แบบเนทีฟภายใน OpenClaw

> **คำเตือน:** นี่คือการเชื่อมต่อแบบไม่เป็นทางการ และอาจทำให้บัญชีถูกระงับ/แบนได้ ใช้งานโดยยอมรับความเสี่ยงเอง

## Bundled plugin

Zalo Personal มาพร้อมเป็น bundled plugin ใน OpenClaw รุ่นปัจจุบัน ดังนั้น build แบบแพ็กเกจทั่วไปจึงไม่ต้องติดตั้งแยก

หากคุณใช้ build เก่ากว่าหรือการติดตั้งแบบกำหนดเองที่ไม่ได้รวม Zalo Personal ไว้
ให้ติดตั้งด้วยตนเอง:

- ติดตั้งผ่าน CLI: `openclaw plugins install @openclaw/zalouser`
- หรือจาก source checkout: `openclaw plugins install ./path/to/local/zalouser-plugin`
- รายละเอียด: [Plugins](/th/tools/plugin)

ไม่ต้องใช้ไบนารี CLI ภายนอก `zca`/`openzca`

## การตั้งค่าแบบรวดเร็ว (สำหรับผู้เริ่มต้น)

1. ตรวจสอบให้แน่ใจว่าสามารถใช้งาน plugin Zalo Personal ได้
   - OpenClaw รุ่นแพ็กเกจปัจจุบันจะรวมมาให้อยู่แล้ว
   - การติดตั้งแบบเก่า/กำหนดเองสามารถเพิ่มได้เองด้วยคำสั่งด้านบน
2. ล็อกอิน (QR บนเครื่อง Gateway):
   - `openclaw channels login --channel zalouser`
   - สแกน QR code ด้วยแอป Zalo บนมือถือ
3. เปิดใช้งาน channel:

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

4. รีสตาร์ต Gateway (หรือทำการตั้งค่าให้เสร็จ)
5. การเข้าถึง DM ใช้ pairing เป็นค่าเริ่มต้น; อนุมัติ pairing code เมื่อมีการติดต่อครั้งแรก

## คืออะไร

- ทำงานทั้งหมดภายในโปรเซสผ่าน `zca-js`
- ใช้ native event listeners เพื่อรับข้อความขาเข้า
- ส่งคำตอบโดยตรงผ่าน JS API (ข้อความ/สื่อ/ลิงก์)
- ออกแบบมาสำหรับกรณีใช้งานแบบ “บัญชีส่วนตัว” ที่ไม่มี Zalo Bot API ให้ใช้

## การตั้งชื่อ

รหัส channel คือ `zalouser` เพื่อให้ชัดเจนว่านี่คือการทำงานอัตโนมัติกับ **บัญชีผู้ใช้ Zalo ส่วนตัว** (ไม่เป็นทางการ) เราสงวนชื่อ `zalo` ไว้สำหรับการเชื่อมต่อ Zalo API แบบทางการในอนาคตที่อาจมีขึ้น

## การค้นหา IDs (directory)

ใช้ directory CLI เพื่อค้นหา peers/groups และ IDs ของพวกเขา:

```bash
openclaw directory self --channel zalouser
openclaw directory peers list --channel zalouser --query "name"
openclaw directory groups list --channel zalouser --query "work"
```

## ข้อจำกัด

- ข้อความขาออกจะถูกแบ่งเป็นช่วงละประมาณ 2000 อักขระ (ข้อจำกัดของไคลเอนต์ Zalo)
- การสตรีมถูกบล็อกไว้เป็นค่าเริ่มต้น

## การควบคุมการเข้าถึง (DMs)

`channels.zalouser.dmPolicy` รองรับ: `pairing | allowlist | open | disabled` (ค่าเริ่มต้น: `pairing`)

`channels.zalouser.allowFrom` รับ user IDs หรือชื่อ ระหว่างการตั้งค่า ระบบจะ resolve ชื่อเป็น IDs โดยใช้การค้นหารายชื่อติดต่อภายในโปรเซสของ plugin

อนุมัติผ่าน:

- `openclaw pairing list zalouser`
- `openclaw pairing approve zalouser <code>`

## การเข้าถึงกลุ่ม (ไม่บังคับ)

- ค่าเริ่มต้น: `channels.zalouser.groupPolicy = "open"` (อนุญาต groups) ใช้ `channels.defaults.groupPolicy` เพื่อ override ค่าเริ่มต้นเมื่อไม่ได้ตั้งค่า
- จำกัดด้วย allowlist โดยใช้:
  - `channels.zalouser.groupPolicy = "allowlist"`
  - `channels.zalouser.groups` (คีย์ควรเป็น group IDs ที่คงที่; ชื่อจะถูก resolve เป็น IDs ตอนเริ่มต้นหากทำได้)
  - `channels.zalouser.groupAllowFrom` (ควบคุมว่าผู้ส่งคนใดในกลุ่มที่อนุญาตสามารถทริกเกอร์บอทได้)
- บล็อกทุกกลุ่ม: `channels.zalouser.groupPolicy = "disabled"`
- ตัวช่วยตั้งค่าสามารถถามเรื่อง group allowlists ได้
- ตอนเริ่มต้น OpenClaw จะ resolve ชื่อกลุ่ม/ผู้ใช้ใน allowlists เป็น IDs และบันทึก mapping ไว้ใน logs
- การจับคู่ group allowlist ใช้เฉพาะ ID เป็นค่าเริ่มต้น ชื่อที่ resolve ไม่ได้จะถูกเพิกเฉยสำหรับ auth เว้นแต่จะเปิด `channels.zalouser.dangerouslyAllowNameMatching: true`
- `channels.zalouser.dangerouslyAllowNameMatching: true` เป็นโหมดความเข้ากันได้แบบ break-glass ที่เปิดการจับคู่ด้วยชื่อกลุ่มที่เปลี่ยนแปลงได้อีกครั้ง
- หากไม่ได้ตั้งค่า `groupAllowFrom` runtime จะ fallback ไปใช้ `allowFrom` สำหรับการตรวจสอบผู้ส่งในกลุ่ม
- การตรวจสอบผู้ส่งใช้กับทั้งข้อความกลุ่มปกติและคำสั่งควบคุม (เช่น `/new`, `/reset`)

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

### การบังคับ mention ในกลุ่ม

- `channels.zalouser.groups.<group>.requireMention` ควบคุมว่าการตอบในกลุ่มต้องมี mention หรือไม่
- ลำดับการ resolve: group id/ชื่อที่ตรงกันพอดี -> slug ของกลุ่มที่ normalize แล้ว -> `*` -> ค่าเริ่มต้น (`true`)
- ใช้กับทั้งกลุ่มแบบ allowlist และโหมด open group
- การ quote ข้อความของบอทถือเป็น implicit mention สำหรับการเปิดใช้งานในกลุ่ม
- คำสั่งควบคุมที่ได้รับอนุญาต (เช่น `/new`) สามารถข้าม mention gating ได้
- เมื่อข้อความกลุ่มถูกข้ามเพราะต้องมี mention OpenClaw จะเก็บไว้เป็นประวัติกลุ่มที่รอดำเนินการ และรวมไว้ในข้อความกลุ่มถัดไปที่ถูกประมวลผล
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

บัญชีจะถูกแมปกับโปรไฟล์ `zalouser` ในสถานะของ OpenClaw ตัวอย่าง:

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

## การพิมพ์, reactions และการยืนยันการส่งถึง

- OpenClaw จะส่งเหตุการณ์กำลังพิมพ์ก่อนส่งคำตอบ (best-effort)
- รองรับ action `react` ของ message สำหรับ `zalouser` ใน channel actions
  - ใช้ `remove: true` เพื่อลบ reaction emoji เฉพาะตัวออกจากข้อความ
  - ความหมายของ reaction: [Reactions](/th/tools/reactions)
- สำหรับข้อความขาเข้าที่มี event metadata ระบบจะส่งการยืนยัน delivered + seen (best-effort)

## การแก้ปัญหา

**การล็อกอินไม่คงอยู่:**

- `openclaw channels status --probe`
- ล็อกอินใหม่: `openclaw channels logout --channel zalouser && openclaw channels login --channel zalouser`

**ชื่อใน allowlist/group ไม่ถูก resolve:**

- ใช้ numeric IDs ใน `allowFrom`/`groupAllowFrom`/`groups` หรือใช้ชื่อเพื่อน/กลุ่มที่ตรงแบบเป๊ะ

**อัปเกรดมาจากการตั้งค่าแบบ CLI เก่า:**

- ลบสมมติฐานเดิมเกี่ยวกับโปรเซส `zca` ภายนอก
- ตอนนี้ channel ทำงานทั้งหมดภายใน OpenClaw โดยไม่มีไบนารี CLI ภายนอก

## ที่เกี่ยวข้อง

- [Channels Overview](/th/channels) — channels ที่รองรับทั้งหมด
- [Pairing](/th/channels/pairing) — การยืนยันตัวตน DM และขั้นตอน pairing
- [Groups](/th/channels/groups) — พฤติกรรมของแชตกลุ่มและการบังคับ mention
- [Channel Routing](/th/channels/channel-routing) — การ route เซสชันสำหรับข้อความ
- [Security](/th/gateway/security) — โมเดลการเข้าถึงและการเสริมความปลอดภัย
