---
read_when:
    - การตั้งค่า Matrix ใน OpenClaw
    - การกำหนดค่า E2EE และการยืนยันตัวตนของ Matrix
summary: สถานะการรองรับ Matrix การตั้งค่า และตัวอย่างการกำหนดค่า
title: Matrix
x-i18n:
    generated_at: "2026-04-24T08:58:52Z"
    model: gpt-5.4
    provider: openai
    source_hash: bf25a6f64ed310f33b72517ccd1526876e27caae240e9fa837a86ca2c392ab25
    source_path: channels/matrix.md
    workflow: 15
---

Matrix เป็น Plugin ช่องทางที่มาพร้อมกับ OpenClaw
โดยใช้ `matrix-js-sdk` อย่างเป็นทางการ และรองรับ DM, ห้อง, เธรด, สื่อ, reactions, polls, ตำแหน่งที่ตั้ง และ E2EE

## Plugin ที่มาพร้อมกัน

Matrix มาพร้อมเป็น Plugin ที่รวมอยู่แล้วใน OpenClaw รุ่นปัจจุบัน ดังนั้นบิลด์แบบแพ็กเกจปกติจึงไม่ต้องติดตั้งแยก

หากคุณใช้บิลด์ที่เก่ากว่าหรือการติดตั้งแบบกำหนดเองที่ไม่ได้รวม Matrix ไว้ ให้ติดตั้งด้วยตนเอง:

ติดตั้งจาก npm:

```bash
openclaw plugins install @openclaw/matrix
```

ติดตั้งจาก checkout ในเครื่อง:

```bash
openclaw plugins install ./path/to/local/matrix-plugin
```

ดู [Plugins](/th/tools/plugin) สำหรับพฤติกรรมของ Plugin และกฎการติดตั้ง

## การตั้งค่า

1. ตรวจสอบให้แน่ใจว่า Plugin Matrix พร้อมใช้งาน
   - OpenClaw รุ่นแพ็กเกจปัจจุบันได้รวมมาให้อยู่แล้ว
   - การติดตั้งแบบเก่า/กำหนดเองสามารถเพิ่มได้ด้วยคำสั่งด้านบน
2. สร้างบัญชี Matrix บน homeserver ของคุณ
3. กำหนดค่า `channels.matrix` ด้วยอย่างใดอย่างหนึ่งต่อไปนี้:
   - `homeserver` + `accessToken` หรือ
   - `homeserver` + `userId` + `password`
4. รีสตาร์ต Gateway
5. เริ่ม DM กับบอตหรือเชิญบอตเข้าห้อง
   - คำเชิญ Matrix ใหม่จะใช้งานได้ก็ต่อเมื่อ `channels.matrix.autoJoin` อนุญาต

เส้นทางการตั้งค่าแบบโต้ตอบ:

```bash
openclaw channels add
openclaw configure --section channels
```

ตัวช่วยตั้งค่า Matrix จะถามข้อมูลต่อไปนี้:

- URL ของ homeserver
- วิธีการยืนยันตัวตน: access token หรือ password
- user ID (เฉพาะการยืนยันตัวตนด้วย password)
- ชื่ออุปกรณ์เพิ่มเติม (ไม่บังคับ)
- จะเปิดใช้ E2EE หรือไม่
- จะกำหนดค่าสิทธิ์การเข้าถึงห้องและการเข้าร่วมคำเชิญอัตโนมัติหรือไม่

พฤติกรรมสำคัญของตัวช่วยตั้งค่า:

- หากมีตัวแปรสภาพแวดล้อมสำหรับการยืนยันตัวตน Matrix อยู่แล้ว และบัญชีนั้นยังไม่มีข้อมูลยืนยันตัวตนที่บันทึกไว้ใน config ตัวช่วยตั้งค่าจะเสนอทางลัดแบบ env เพื่อให้เก็บข้อมูลยืนยันตัวตนไว้ในตัวแปรสภาพแวดล้อมต่อไป
- ชื่อบัญชีจะถูกทำให้เป็นมาตรฐานเป็น account ID ตัวอย่างเช่น `Ops Bot` จะกลายเป็น `ops-bot`
- รายการ allowlist ของ DM รับค่า `@user:server` ได้โดยตรง ชื่อที่แสดงจะใช้ได้เฉพาะเมื่อการค้นหาไดเรกทอรีแบบสดพบผลตรงกันเพียงหนึ่งรายการเท่านั้น
- รายการ allowlist ของห้องรับ room ID และ alias ได้โดยตรง ควรใช้ `!room:server` หรือ `#alias:server`; ชื่อที่ไม่สามารถ resolve ได้จะถูกเพิกเฉยขณะรันไทม์โดยการ resolve allowlist
- ในโหมด allowlist ของการเข้าร่วมคำเชิญอัตโนมัติ ให้ใช้เฉพาะเป้าหมายคำเชิญที่เสถียร: `!roomId:server`, `#alias:server` หรือ `*` เท่านั้น ชื่อห้องแบบธรรมดาจะถูกปฏิเสธ
- หากต้องการ resolve ชื่อห้องก่อนบันทึก ให้ใช้ `openclaw channels resolve --channel matrix "Project Room"`

<Warning>
`channels.matrix.autoJoin` มีค่าเริ่มต้นเป็น `off`

หากคุณปล่อยไว้โดยไม่ตั้งค่า บอตจะไม่เข้าร่วมห้องที่ถูกเชิญหรือคำเชิญแบบ DM ใหม่ ดังนั้นบอตจะไม่ปรากฏในกลุ่มใหม่หรือ DM ที่เชิญเข้ามา เว้นแต่คุณจะเข้าร่วมด้วยตนเองก่อน

ตั้งค่า `autoJoin: "allowlist"` ร่วมกับ `autoJoinAllowlist` เพื่อจำกัดว่าบอตจะรับคำเชิญใด หรือกำหนด `autoJoin: "always"` หากคุณต้องการให้บอตเข้าร่วมทุกคำเชิญ

ในโหมด `allowlist`, `autoJoinAllowlist` รับได้เฉพาะ `!roomId:server`, `#alias:server` หรือ `*` เท่านั้น
</Warning>

ตัวอย่าง allowlist:

```json5
{
  channels: {
    matrix: {
      autoJoin: "allowlist",
      autoJoinAllowlist: ["!ops:example.org", "#support:example.org"],
      groups: {
        "!ops:example.org": {
          requireMention: true,
        },
      },
    },
  },
}
```

เข้าร่วมทุกคำเชิญ:

```json5
{
  channels: {
    matrix: {
      autoJoin: "always",
    },
  },
}
```

การตั้งค่าแบบต่ำสุดโดยใช้โทเค็น:

```json5
{
  channels: {
    matrix: {
      enabled: true,
      homeserver: "https://matrix.example.org",
      accessToken: "syt_xxx",
      dm: { policy: "pairing" },
    },
  },
}
```

การตั้งค่าโดยใช้ password (ระบบจะ cache token หลังจากเข้าสู่ระบบ):

```json5
{
  channels: {
    matrix: {
      enabled: true,
      homeserver: "https://matrix.example.org",
      userId: "@bot:example.org",
      password: "replace-me", // pragma: allowlist secret
      deviceName: "OpenClaw Gateway",
    },
  },
}
```

Matrix จะเก็บข้อมูลรับรองที่ cache ไว้ใน `~/.openclaw/credentials/matrix/`
บัญชีเริ่มต้นใช้ `credentials.json`; บัญชีที่มีชื่อใช้ `credentials-<account>.json`
เมื่อมีข้อมูลรับรองที่ cache อยู่ในนั้น OpenClaw จะถือว่า Matrix ได้รับการกำหนดค่าแล้วสำหรับการตั้งค่า การตรวจสอบ doctor และการค้นหาสถานะช่องทาง แม้ว่าการยืนยันตัวตนปัจจุบันจะไม่ได้ตั้งไว้ใน config โดยตรงก็ตาม

ตัวแปรสภาพแวดล้อมที่เทียบเท่า (ใช้เมื่อไม่ได้ตั้งค่า config key):

- `MATRIX_HOMESERVER`
- `MATRIX_ACCESS_TOKEN`
- `MATRIX_USER_ID`
- `MATRIX_PASSWORD`
- `MATRIX_DEVICE_ID`
- `MATRIX_DEVICE_NAME`

สำหรับบัญชีที่ไม่ใช่ค่าเริ่มต้น ให้ใช้ตัวแปรสภาพแวดล้อมแบบระบุขอบเขตบัญชี:

- `MATRIX_<ACCOUNT_ID>_HOMESERVER`
- `MATRIX_<ACCOUNT_ID>_ACCESS_TOKEN`
- `MATRIX_<ACCOUNT_ID>_USER_ID`
- `MATRIX_<ACCOUNT_ID>_PASSWORD`
- `MATRIX_<ACCOUNT_ID>_DEVICE_ID`
- `MATRIX_<ACCOUNT_ID>_DEVICE_NAME`

ตัวอย่างสำหรับบัญชี `ops`:

- `MATRIX_OPS_HOMESERVER`
- `MATRIX_OPS_ACCESS_TOKEN`

สำหรับ account ID ที่ถูกทำให้เป็นมาตรฐาน `ops-bot` ให้ใช้:

- `MATRIX_OPS_X2D_BOT_HOMESERVER`
- `MATRIX_OPS_X2D_BOT_ACCESS_TOKEN`

Matrix จะ escape เครื่องหมายวรรคตอนใน account ID เพื่อให้ตัวแปรสภาพแวดล้อมแบบมีขอบเขตไม่ชนกัน
ตัวอย่างเช่น `-` จะกลายเป็น `_X2D_` ดังนั้น `ops-prod` จะจับคู่เป็น `MATRIX_OPS_X2D_PROD_*`

ตัวช่วยตั้งค่าแบบโต้ตอบจะเสนอทางลัด env-var ก็ต่อเมื่อตัวแปรสภาพแวดล้อมสำหรับการยืนยันตัวตนเหล่านั้นมีอยู่แล้ว และบัญชีที่เลือกยังไม่มีข้อมูลยืนยันตัวตน Matrix ที่บันทึกไว้ใน config

ไม่สามารถตั้งค่า `MATRIX_HOMESERVER` จาก `.env` ของ workspace ได้; ดู [ไฟล์ `.env` ของ Workspace](/th/gateway/security)

## ตัวอย่างการกำหนดค่า

นี่คือตัวอย่าง config พื้นฐานที่ใช้งานได้จริง พร้อม DM pairing, allowlist ของห้อง และเปิดใช้ E2EE:

```json5
{
  channels: {
    matrix: {
      enabled: true,
      homeserver: "https://matrix.example.org",
      accessToken: "syt_xxx",
      encryption: true,

      dm: {
        policy: "pairing",
        sessionScope: "per-room",
        threadReplies: "off",
      },

      groupPolicy: "allowlist",
      groupAllowFrom: ["@admin:example.org"],
      groups: {
        "!roomid:example.org": {
          requireMention: true,
        },
      },

      autoJoin: "allowlist",
      autoJoinAllowlist: ["!roomid:example.org"],
      threadReplies: "inbound",
      replyToMode: "off",
      streaming: "partial",
    },
  },
}
```

`autoJoin` ใช้กับคำเชิญ Matrix ทั้งหมด รวมถึงคำเชิญแบบ DM OpenClaw ไม่สามารถ
จำแนกได้อย่างน่าเชื่อถือว่าห้องที่ถูกเชิญเป็น DM หรือกลุ่มในเวลาที่ได้รับคำเชิญ ดังนั้นคำเชิญทั้งหมดจึงต้องผ่าน `autoJoin`
ก่อนเสมอ ส่วน `dm.policy` จะมีผลหลังจากบอตเข้าร่วมห้องแล้วและห้องนั้นถูกจัดประเภทเป็น DM

## ตัวอย่างการสตรีม

การสตรีมคำตอบของ Matrix เป็นแบบต้องเลือกใช้เอง

ตั้งค่า `channels.matrix.streaming` เป็น `"partial"` เมื่อคุณต้องการให้ OpenClaw ส่งคำตอบพรีวิวสดเพียงหนึ่งรายการ
แก้ไขพรีวิวนั้นในที่เดิมขณะที่โมเดลกำลังสร้างข้อความ แล้วปิดท้ายเมื่อ
คำตอบเสร็จสมบูรณ์:

```json5
{
  channels: {
    matrix: {
      streaming: "partial",
    },
  },
}
```

- `streaming: "off"` เป็นค่าเริ่มต้น OpenClaw จะรอคำตอบสุดท้ายแล้วส่งเพียงครั้งเดียว
- `streaming: "partial"` จะสร้างข้อความพรีวิวที่แก้ไขได้หนึ่งข้อความสำหรับบล็อก assistant ปัจจุบันโดยใช้ข้อความ Matrix ปกติ ซึ่งยังคงพฤติกรรมการแจ้งเตือนแบบพรีวิวก่อนของ Matrix รุ่นเดิมไว้ ดังนั้นไคลเอนต์มาตรฐานอาจแจ้งเตือนจากข้อความพรีวิวที่สตรีมครั้งแรกแทนบล็อกที่เสร็จสมบูรณ์
- `streaming: "quiet"` จะสร้างข้อความ notice แบบเงียบที่แก้ไขได้หนึ่งข้อความสำหรับบล็อก assistant ปัจจุบัน ใช้ตัวเลือกนี้เฉพาะเมื่อคุณกำหนดค่า push rules ของผู้รับสำหรับการแก้ไขพรีวิวที่ปิดท้ายแล้วด้วย
- `blockStreaming: true` เปิดใช้ข้อความความคืบหน้า Matrix แยกต่างหาก เมื่อเปิดใช้การสตรีมพรีวิว Matrix จะเก็บฉบับร่างสดสำหรับบล็อกปัจจุบัน และเก็บบล็อกที่เสร็จแล้วเป็นข้อความแยก
- เมื่อเปิดการสตรีมพรีวิวและ `blockStreaming` ปิดอยู่ Matrix จะแก้ไขฉบับร่างสดในที่เดิม และปิดท้าย event เดิมนั้นเมื่อบล็อกหรือเทิร์นสิ้นสุด
- หากพรีวิวไม่สามารถอยู่ใน Matrix event เดียวได้อีกต่อไป OpenClaw จะหยุดการสตรีมพรีวิวและกลับไปใช้การส่งแบบสุดท้ายตามปกติ
- คำตอบที่เป็นสื่อจะยังส่งไฟล์แนบตามปกติ หากพรีวิวเก่าไม่สามารถนำกลับมาใช้ซ้ำได้อย่างปลอดภัย OpenClaw จะ redacts พรีวิวนั้นก่อนส่งคำตอบสื่อขั้นสุดท้าย
- การแก้ไขพรีวิวมีค่าใช้จ่ายเป็นการเรียก Matrix API เพิ่มเติม หากคุณต้องการพฤติกรรมการจำกัดอัตราแบบอนุรักษ์นิยมที่สุด ให้ปิดการสตรีมไว้

`blockStreaming` เพียงอย่างเดียวจะไม่เปิดใช้พรีวิวดราฟต์
ให้ใช้ `streaming: "partial"` หรือ `streaming: "quiet"` สำหรับการแก้ไขพรีวิว จากนั้นค่อยเพิ่ม `blockStreaming: true` เฉพาะเมื่อคุณต้องการให้บล็อก assistant ที่เสร็จแล้วคงแสดงเป็นข้อความความคืบหน้าแยกต่างหากด้วย

หากคุณต้องการการแจ้งเตือน Matrix มาตรฐานโดยไม่ต้องใช้ push rules แบบกำหนดเอง ให้ใช้ `streaming: "partial"` สำหรับพฤติกรรมแบบพรีวิวก่อน หรือปล่อย `streaming` เป็นปิดสำหรับการส่งเฉพาะผลลัพธ์สุดท้าย เมื่อ `streaming: "off"`:

- `blockStreaming: true` จะส่งแต่ละบล็อกที่เสร็จแล้วเป็นข้อความ Matrix ปกติที่มีการแจ้งเตือน
- `blockStreaming: false` จะส่งเฉพาะคำตอบสุดท้ายที่เสร็จสมบูรณ์เป็นข้อความ Matrix ปกติที่มีการแจ้งเตือน

### Push rules แบบ self-hosted สำหรับพรีวิวแบบเงียบที่ปิดท้ายแล้ว

การสตรีมแบบเงียบ (`streaming: "quiet"`) จะแจ้งเตือนผู้รับก็ต่อเมื่อบล็อกหรือเทิร์นถูกปิดท้ายแล้วเท่านั้น — ต้องมี push rule ระดับผู้ใช้ที่ตรงกับตัวทำเครื่องหมายของพรีวิวที่ปิดท้ายแล้ว ดู [Matrix push rules for quiet previews](/th/channels/matrix-push-rules) สำหรับการตั้งค่าแบบเต็ม (recipient token, การตรวจสอบ pusher, การติดตั้งกฎ, หมายเหตุราย homeserver)

## ห้องบอตคุยกับบอต

โดยค่าเริ่มต้น ข้อความ Matrix จากบัญชี Matrix ของ OpenClaw อื่นที่กำหนดค่าไว้จะถูกเพิกเฉย

ใช้ `allowBots` เมื่อคุณตั้งใจให้มีทราฟฟิก Matrix ระหว่างเอเจนต์:

```json5
{
  channels: {
    matrix: {
      allowBots: "mentions", // true | "mentions"
      groups: {
        "!roomid:example.org": {
          requireMention: true,
        },
      },
    },
  },
}
```

- `allowBots: true` ยอมรับข้อความจากบัญชีบอต Matrix อื่นที่กำหนดค่าไว้ในห้องและ DM ที่ได้รับอนุญาต
- `allowBots: "mentions"` ยอมรับข้อความเหล่านั้นเฉพาะเมื่อมีการ mention บอตนี้อย่างชัดเจนในห้อง ส่วน DM ยังคงอนุญาตอยู่
- `groups.<room>.allowBots` ใช้แทนค่าระดับบัญชีสำหรับห้องหนึ่งห้อง
- OpenClaw ยังคงเพิกเฉยต่อข้อความจาก Matrix user ID เดียวกันเพื่อหลีกเลี่ยงลูปตอบกลับตัวเอง
- Matrix ไม่มีแฟล็กบอตแบบเนทีฟสำหรับกรณีนี้ OpenClaw จึงถือว่า "เขียนโดยบอต" หมายถึง "ส่งมาจากบัญชี Matrix อื่นที่กำหนดค่าไว้บน OpenClaw Gateway นี้"

ใช้ allowlist ของห้องที่เข้มงวดและข้อกำหนด mention เมื่อเปิดใช้ทราฟฟิกบอตคุยกับบอตในห้องที่ใช้งานร่วมกัน

## การเข้ารหัสและการยืนยันตัวตน

ในห้องที่เข้ารหัส (E2EE) event รูปภาพขาออกจะใช้ `thumbnail_file` ดังนั้นภาพพรีวิวจึงถูกเข้ารหัสพร้อมกับไฟล์แนบเต็ม ส่วนห้องที่ไม่เข้ารหัสจะยังใช้ `thumbnail_url` แบบปกติ ไม่ต้องมีการกำหนดค่าเพิ่มเติม — Plugin จะตรวจจับสถานะ E2EE โดยอัตโนมัติ

เปิดใช้การเข้ารหัส:

```json5
{
  channels: {
    matrix: {
      enabled: true,
      homeserver: "https://matrix.example.org",
      accessToken: "syt_xxx",
      encryption: true,
      dm: { policy: "pairing" },
    },
  },
}
```

คำสั่งการยืนยันตัวตน (ทั้งหมดรองรับ `--verbose` สำหรับการวินิจฉัย และ `--json` สำหรับผลลัพธ์ที่เครื่องอ่านได้):

| Command                                                        | วัตถุประสงค์                                                                        |
| -------------------------------------------------------------- | ----------------------------------------------------------------------------------- |
| `openclaw matrix verify status`                                | ตรวจสอบสถานะ cross-signing และการยืนยันตัวตนของอุปกรณ์                            |
| `openclaw matrix verify status --include-recovery-key --json`  | รวม recovery key ที่จัดเก็บไว้                                                     |
| `openclaw matrix verify bootstrap`                             | เริ่มต้น cross-signing และการยืนยันตัวตน (ดูด้านล่าง)                              |
| `openclaw matrix verify bootstrap --force-reset-cross-signing` | ทิ้งตัวตน cross-signing ปัจจุบันและสร้างตัวใหม่                                     |
| `openclaw matrix verify device "<recovery-key>"`               | ยืนยันตัวตนอุปกรณ์นี้ด้วย recovery key                                             |
| `openclaw matrix verify backup status`                         | ตรวจสอบสถานะความสมบูรณ์ของ room-key backup                                         |
| `openclaw matrix verify backup restore`                        | กู้คืน room keys จาก backup บนเซิร์ฟเวอร์                                          |
| `openclaw matrix verify backup reset --yes`                    | ลบ backup ปัจจุบันและสร้างค่าเริ่มต้นใหม่ (อาจสร้าง secret storage ใหม่อีกครั้ง)  |

ในการตั้งค่าแบบหลายบัญชี คำสั่ง Matrix CLI จะใช้บัญชี Matrix เริ่มต้นโดยปริยาย เว้นแต่คุณจะส่ง `--account <id>`
หากคุณกำหนดค่าหลายบัญชีแบบมีชื่อ ให้ตั้งค่า `channels.matrix.defaultAccount` ก่อน มิฉะนั้นการดำเนินการ CLI แบบปริยายเหล่านั้นจะหยุดและขอให้คุณเลือกบัญชีอย่างชัดเจน
ใช้ `--account` ทุกครั้งที่คุณต้องการให้การยืนยันตัวตนหรือการดำเนินการกับอุปกรณ์เจาะจงไปยังบัญชีที่มีชื่อ:

```bash
openclaw matrix verify status --account assistant
openclaw matrix verify backup restore --account assistant
openclaw matrix devices list --account assistant
```

เมื่อการเข้ารหัสถูกปิดใช้งานหรือไม่พร้อมใช้งานสำหรับบัญชีที่มีชื่อ คำเตือนของ Matrix และข้อผิดพลาดในการยืนยันตัวตนจะชี้ไปยัง config key ของบัญชีนั้น เช่น `channels.matrix.accounts.assistant.encryption`

<AccordionGroup>
  <Accordion title="ความหมายของการยืนยันตัวตนแล้ว">
    OpenClaw จะถือว่าอุปกรณ์ได้รับการยืนยันตัวตนแล้วก็ต่อเมื่อตัวตน cross-signing ของคุณเองลงนามให้อุปกรณ์นั้น `verify status --verbose` จะแสดงสัญญาณความเชื่อถือ 3 รายการ:

    - `Locally trusted`: เชื่อถือโดยไคลเอนต์นี้เท่านั้น
    - `Cross-signing verified`: SDK รายงานว่าผ่านการยืนยันตัวตนด้วย cross-signing
    - `Signed by owner`: ถูกลงนามโดย self-signing key ของคุณเอง

    `Verified by owner` จะเป็น `yes` ก็ต่อเมื่อมี cross-signing หรือ owner-signing เท่านั้น การเชื่อถือแบบ local เพียงอย่างเดียวไม่เพียงพอ

  </Accordion>

  <Accordion title="bootstrap ทำอะไร">
    `verify bootstrap` คือคำสั่งสำหรับซ่อมแซมและตั้งค่าบัญชีที่เข้ารหัส โดยจะทำงานตามลำดับดังนี้:

    - เริ่มต้น secret storage โดยใช้ recovery key เดิมซ้ำหากเป็นไปได้
    - เริ่มต้น cross-signing และอัปโหลด public cross-signing keys ที่ขาดหายไป
    - ทำเครื่องหมายและ cross-sign อุปกรณ์ปัจจุบัน
    - สร้าง room-key backup ฝั่งเซิร์ฟเวอร์หากยังไม่มี

    หาก homeserver ต้องใช้ UIA เพื่ออัปโหลด cross-signing keys OpenClaw จะลองแบบ no-auth ก่อน จากนั้น `m.login.dummy` แล้วค่อย `m.login.password` (ต้องมี `channels.matrix.password`) ใช้ `--force-reset-cross-signing` เฉพาะเมื่อคุณตั้งใจทิ้งตัวตนปัจจุบันเท่านั้น

  </Accordion>

  <Accordion title="ค่าเริ่มต้นใหม่ของ backup">
    หากคุณต้องการให้ข้อความเข้ารหัสในอนาคตยังทำงานได้ และยอมรับการสูญเสียประวัติเก่าที่กู้คืนไม่ได้:

```bash
openclaw matrix verify backup reset --yes
openclaw matrix verify backup status --verbose
openclaw matrix verify status
```

    เพิ่ม `--account <id>` เพื่อกำหนดเป้าหมายไปยังบัญชีที่มีชื่อ การดำเนินการนี้อาจสร้าง secret storage ใหม่ด้วย หากไม่สามารถโหลด backup secret ปัจจุบันได้อย่างปลอดภัย

  </Accordion>

  <Accordion title="พฤติกรรมเมื่อเริ่มต้นระบบ">
    เมื่อใช้ `encryption: true`, `startupVerification` จะมีค่าเริ่มต้นเป็น `"if-unverified"` เมื่อเริ่มต้น ระบบจะให้อุปกรณ์ที่ยังไม่ได้รับการยืนยันตัวตนร้องขอการยืนยันตัวตนกับตัวเองใน Matrix client อีกตัวหนึ่ง โดยข้ามคำขอซ้ำและใช้ช่วงคูลดาวน์ ปรับแต่งได้ด้วย `startupVerificationCooldownHours` หรือปิดด้วย `startupVerification: "off"`

    ตอนเริ่มต้นยังมีการรันขั้นตอน crypto bootstrap แบบอนุรักษ์นิยม ซึ่งจะใช้ secret storage และตัวตน cross-signing ปัจจุบันซ้ำ หากสถานะ bootstrap เสียหาย OpenClaw จะพยายามซ่อมแซมแบบมีการป้องกันแม้ไม่มี `channels.matrix.password`; หาก homeserver ต้องใช้ password UIA ระหว่างเริ่มต้น ระบบจะบันทึกคำเตือนและไม่ถือเป็นข้อผิดพลาดร้ายแรง อุปกรณ์ที่ถูก owner-sign แล้วจะถูกเก็บรักษาไว้

    ดู [การย้าย Matrix](/th/install/migrating-matrix) สำหรับขั้นตอนการอัปเกรดแบบเต็ม

  </Accordion>

  <Accordion title="ข้อความแจ้งเตือนการยืนยันตัวตน">
    Matrix จะโพสต์ข้อความแจ้งเตือนวงจรชีวิตการยืนยันตัวตนลงในห้อง DM สำหรับการยืนยันตัวตนแบบเข้มงวดในรูปแบบข้อความ `m.notice`: คำขอ, พร้อมแล้ว (พร้อมคำแนะนำ "Verify by emoji"), เริ่มต้น/เสร็จสิ้น, และรายละเอียด SAS (emoji/ตัวเลข) เมื่อมี

    คำขอที่เข้ามาจาก Matrix client อื่นจะถูกติดตามและยอมรับโดยอัตโนมัติ สำหรับการยืนยันตัวตนกับตัวเอง OpenClaw จะเริ่มโฟลว์ SAS โดยอัตโนมัติและยืนยันฝั่งของตัวเองเมื่อพร้อมสำหรับการยืนยันด้วย emoji — คุณยังคงต้องเปรียบเทียบและยืนยัน "They match" ใน Matrix client ของคุณ

    ข้อความระบบสำหรับการยืนยันตัวตนจะไม่ถูกส่งต่อไปยังไปป์ไลน์แชตของเอเจนต์

  </Accordion>

  <Accordion title="สุขอนามัยของอุปกรณ์">
    อุปกรณ์เก่าที่ OpenClaw จัดการอาจสะสมเพิ่มขึ้นได้ แสดงรายการและล้างรายการที่ค้างเก่า:

```bash
openclaw matrix devices list
openclaw matrix devices prune-stale
```

  </Accordion>

  <Accordion title="Crypto store">
    Matrix E2EE ใช้เส้นทาง Rust crypto ของ `matrix-js-sdk` อย่างเป็นทางการร่วมกับ `fake-indexeddb` เป็น IndexedDB shim สถานะ crypto จะถูกเก็บถาวรไว้ใน `crypto-idb-snapshot.json` (สิทธิ์ไฟล์แบบจำกัด)

    สถานะรันไทม์ที่เข้ารหัสจะอยู่ภายใต้ `~/.openclaw/matrix/accounts/<account>/<homeserver>__<user>/<token-hash>/` และประกอบด้วย sync store, crypto store, recovery key, IDB snapshot, thread bindings และสถานะ startup verification เมื่อ token เปลี่ยนแต่ตัวตนของบัญชียังคงเดิม OpenClaw จะใช้ root เดิมที่ดีที่สุดซ้ำ เพื่อให้สถานะก่อนหน้ายังคงมองเห็นได้

  </Accordion>
</AccordionGroup>

## การจัดการโปรไฟล์

อัปเดต self-profile ของ Matrix สำหรับบัญชีที่เลือกด้วย:

```bash
openclaw matrix profile set --name "OpenClaw Assistant"
openclaw matrix profile set --avatar-url https://cdn.example.org/avatar.png
```

เพิ่ม `--account <id>` เมื่อคุณต้องการระบุบัญชี Matrix ที่มีชื่ออย่างชัดเจน

Matrix รับ URL avatar แบบ `mxc://` ได้โดยตรง เมื่อคุณส่ง URL avatar แบบ `http://` หรือ `https://` OpenClaw จะอัปโหลดไปยัง Matrix ก่อน แล้วจัดเก็บ URL `mxc://` ที่ resolve แล้วกลับลงใน `channels.matrix.avatarUrl` (หรือค่ากำหนดแทนของบัญชีที่เลือก)

## เธรด

Matrix รองรับเธรด Matrix แบบเนทีฟสำหรับทั้งการตอบกลับอัตโนมัติและการส่งผ่าน message-tool

- `dm.sessionScope: "per-user"` (ค่าเริ่มต้น) จะคงการกำหนดเส้นทาง DM ของ Matrix แบบอิงผู้ส่งไว้ ดังนั้นหลายห้อง DM จึงใช้เซสชันเดียวกันได้เมื่อ resolve ไปยัง peer เดียวกัน
- `dm.sessionScope: "per-room"` จะแยกแต่ละห้อง DM ของ Matrix ออกเป็น session key ของตัวเอง ขณะที่ยังคงใช้การยืนยันตัวตน DM และการตรวจสอบ allowlist ตามปกติ
- Matrix conversation bindings แบบชัดเจนยังคงมีลำดับความสำคัญเหนือ `dm.sessionScope` ดังนั้นห้องและเธรดที่ bind ไว้จะยังคงใช้เซสชันเป้าหมายที่เลือกไว้
- `threadReplies: "off"` จะให้การตอบกลับอยู่ระดับบนสุด และทำให้ข้อความเธรดขาเข้ายังคงอยู่ในเซสชันของข้อความหลัก
- `threadReplies: "inbound"` จะตอบกลับภายในเธรดก็ต่อเมื่อข้อความขาเข้าอยู่ในเธรดนั้นอยู่แล้ว
- `threadReplies: "always"` จะคงการตอบกลับในห้องให้อยู่ในเธรดที่ยึดกับข้อความที่กระตุ้น และกำหนดเส้นทางบทสนทนานั้นผ่านเซสชันแบบอิงเธรดที่ตรงกันตั้งแต่ข้อความกระตุ้นแรก
- `dm.threadReplies` ใช้แทนค่าระดับบนสุดสำหรับ DM เท่านั้น ตัวอย่างเช่น คุณสามารถแยกเธรดในห้องออกจากกันได้ ขณะเดียวกันคง DM ให้เป็นแบบแบน
- ข้อความเธรดขาเข้าจะรวมข้อความรากของเธรดเป็นบริบทเพิ่มเติมให้กับเอเจนต์
- การส่งผ่าน message-tool จะรับช่วงเธรด Matrix ปัจจุบันโดยอัตโนมัติเมื่อเป้าหมายเป็นห้องเดียวกัน หรือเป็นเป้าหมายผู้ใช้ DM เดียวกัน เว้นแต่จะมีการระบุ `threadId` อย่างชัดเจน
- การใช้เป้าหมายผู้ใช้ DM ซ้ำในเซสชันเดียวกันจะเกิดขึ้นเฉพาะเมื่อ metadata ของเซสชันปัจจุบันพิสูจน์ได้ว่าเป็น DM peer เดียวกันบนบัญชี Matrix เดียวกัน มิฉะนั้น OpenClaw จะกลับไปใช้การกำหนดเส้นทางแบบอิงผู้ใช้ตามปกติ
- เมื่อ OpenClaw เห็นว่าห้อง DM ของ Matrix ชนกับห้อง DM อื่นใน Matrix DM session ที่ใช้ร่วมกันเดียวกัน ระบบจะโพสต์ `m.notice` แบบครั้งเดียวในห้องนั้นพร้อมทางออก `/focus` เมื่อเปิดใช้ thread bindings และมีคำแนะนำ `dm.sessionScope`
- รองรับ runtime thread bindings สำหรับ Matrix แล้ว `/focus`, `/unfocus`, `/agents`, `/session idle`, `/session max-age` และ `/acp spawn` แบบผูกกับเธรด ใช้งานได้ในห้องและ DM ของ Matrix
- คำสั่ง `/focus` ระดับบนสุดของห้อง/DM ใน Matrix จะสร้าง Matrix thread ใหม่และ bind ไปยังเซสชันเป้าหมายเมื่อ `threadBindings.spawnSubagentSessions=true`
- การเรียก `/focus` หรือ `/acp spawn --thread here` ภายใน Matrix thread ที่มีอยู่แล้ว จะ bind Matrix thread ปัจจุบันนั้นแทน

## ACP conversation bindings

ห้อง, DM และ Matrix thread ที่มีอยู่แล้วสามารถเปลี่ยนให้เป็น ACP workspace แบบคงทนได้โดยไม่ต้องเปลี่ยนพื้นผิวการแชต

โฟลว์การทำงานแบบรวดเร็วสำหรับผู้ดูแล:

- เรียก `/acp spawn codex --bind here` ภายใน Matrix DM, ห้อง หรือเธรดที่มีอยู่แล้วที่คุณต้องการใช้งานต่อ
- ใน Matrix DM หรือห้องระดับบนสุด DM/ห้องปัจจุบันจะยังคงเป็นพื้นผิวการแชต และข้อความในอนาคตจะถูกกำหนดเส้นทางไปยัง ACP session ที่สร้างขึ้น
- ภายใน Matrix thread ที่มีอยู่แล้ว `--bind here` จะ bind Matrix thread ปัจจุบันนั้นไว้ในที่เดิม
- `/new` และ `/reset` จะรีเซ็ต ACP session ที่ bind เดิมนั้นในที่เดิม
- `/acp close` จะปิด ACP session และลบการ bind

หมายเหตุ:

- `--bind here` จะไม่สร้าง Matrix thread ลูก
- ต้องใช้ `threadBindings.spawnAcpSessions` เฉพาะกับ `/acp spawn --thread auto|here` เท่านั้น ซึ่งเป็นกรณีที่ OpenClaw ต้องสร้างหรือ bind Matrix thread ลูก

### การกำหนดค่า thread binding

Matrix สืบทอดค่าเริ่มต้นส่วนกลางจาก `session.threadBindings` และยังรองรับการกำหนดแทนรายช่องทางด้วย:

- `threadBindings.enabled`
- `threadBindings.idleHours`
- `threadBindings.maxAgeHours`
- `threadBindings.spawnSubagentSessions`
- `threadBindings.spawnAcpSessions`

แฟล็กสำหรับการสร้างแบบผูกกับเธรดของ Matrix เป็นแบบต้องเลือกใช้:

- ตั้งค่า `threadBindings.spawnSubagentSessions: true` เพื่ออนุญาตให้ `/focus` ระดับบนสุดสร้างและ bind Matrix thread ใหม่
- ตั้งค่า `threadBindings.spawnAcpSessions: true` เพื่ออนุญาตให้ `/acp spawn --thread auto|here` bind ACP sessions เข้ากับ Matrix threads

## Reactions

Matrix รองรับ action สำหรับ reaction ขาออก การแจ้งเตือน reaction ขาเข้า และ ack reactions ขาเข้า

- เครื่องมือ reaction ขาออกถูกควบคุมด้วย `channels["matrix"].actions.reactions`
- `react` เพิ่ม reaction ให้กับ Matrix event ที่ระบุ
- `reactions` แสดงสรุป reaction ปัจจุบันสำหรับ Matrix event ที่ระบุ
- `emoji=""` จะลบ reactions ของบัญชีบอตเองใน event นั้น
- `remove: true` จะลบเฉพาะ emoji reaction ที่ระบุจากบัญชีบอต

ขอบเขตของ ack reaction จะ resolve ตามลำดับมาตรฐานของ OpenClaw:

- `channels["matrix"].accounts.<accountId>.ackReaction`
- `channels["matrix"].ackReaction`
- `messages.ackReaction`
- ใช้ emoji สำรองจากตัวตนของเอเจนต์

ขอบเขตของ ack reaction จะ resolve ตามลำดับนี้:

- `channels["matrix"].accounts.<accountId>.ackReactionScope`
- `channels["matrix"].ackReactionScope`
- `messages.ackReactionScope`

โหมดการแจ้งเตือน reaction จะ resolve ตามลำดับนี้:

- `channels["matrix"].accounts.<accountId>.reactionNotifications`
- `channels["matrix"].reactionNotifications`
- ค่าเริ่มต้น: `own`

พฤติกรรม:

- `reactionNotifications: "own"` จะส่งต่อ `m.reaction` events ที่ถูกเพิ่มเข้ามา เมื่อ events เหล่านั้นชี้ไปยังข้อความ Matrix ที่บอตเป็นผู้เขียน
- `reactionNotifications: "off"` จะปิดใช้งาน system events ของ reaction
- การลบ reaction จะไม่ถูกสังเคราะห์เป็น system events เพราะ Matrix แสดงสิ่งเหล่านั้นเป็น redactions ไม่ใช่การลบ `m.reaction` แบบแยกต่างหาก

## บริบทประวัติข้อความ

- `channels.matrix.historyLimit` ควบคุมจำนวนข้อความล่าสุดในห้องที่จะถูกรวมเป็น `InboundHistory` เมื่อข้อความห้อง Matrix เป็นตัวกระตุ้นเอเจนต์ โดยจะย้อนกลับไปใช้ `messages.groupChat.historyLimit`; หากไม่ได้ตั้งค่าทั้งคู่ ค่าเริ่มต้นที่มีผลจริงคือ `0` ตั้งค่าเป็น `0` เพื่อปิดใช้งาน
- ประวัติห้อง Matrix ใช้เฉพาะในห้องเท่านั้น ส่วน DM ยังคงใช้ประวัติเซสชันตามปกติ
- ประวัติห้อง Matrix เป็นแบบ pending-only: OpenClaw จะบัฟเฟอร์ข้อความห้องที่ยังไม่ได้กระตุ้นให้เกิดการตอบกลับ จากนั้นจึง snapshot หน้าต่างนั้นเมื่อมีการ mention หรือทริกเกอร์อื่นเข้ามา
- ข้อความทริกเกอร์ปัจจุบันจะไม่ถูกรวมอยู่ใน `InboundHistory`; ข้อความนั้นยังคงอยู่ในเนื้อหาขาเข้าหลักของเทิร์นนั้น
- การลองใหม่ของ Matrix event เดิมจะใช้ history snapshot เดิมซ้ำ แทนที่จะเลื่อนไปยังข้อความห้องใหม่กว่า

## การมองเห็นบริบท

Matrix รองรับตัวควบคุม `contextVisibility` แบบใช้ร่วมกันสำหรับบริบทห้องเสริม เช่น ข้อความตอบกลับที่ดึงมา รากของเธรด และประวัติที่รอดำเนินการ

- `contextVisibility: "all"` เป็นค่าเริ่มต้น โดยจะเก็บบริบทเสริมไว้ตามที่ได้รับมา
- `contextVisibility: "allowlist"` จะกรองบริบทเสริมให้เหลือเฉพาะผู้ส่งที่ได้รับอนุญาตจากการตรวจสอบ allowlist ของห้อง/ผู้ใช้ที่ใช้งานอยู่
- `contextVisibility: "allowlist_quote"` ทำงานเหมือน `allowlist` แต่ยังคงเก็บการอ้างอิงข้อความตอบกลับแบบชัดเจนไว้หนึ่งรายการ

การตั้งค่านี้มีผลต่อการมองเห็นบริบทเสริม ไม่ใช่ว่าข้อความขาเข้าเองจะสามารถกระตุ้นการตอบกลับได้หรือไม่
การอนุญาตให้เกิดทริกเกอร์ยังคงมาจากการตั้งค่า `groupPolicy`, `groups`, `groupAllowFrom` และนโยบาย DM

## นโยบาย DM และห้อง

```json5
{
  channels: {
    matrix: {
      dm: {
        policy: "allowlist",
        allowFrom: ["@admin:example.org"],
        threadReplies: "off",
      },
      groupPolicy: "allowlist",
      groupAllowFrom: ["@admin:example.org"],
      groups: {
        "!roomid:example.org": {
          requireMention: true,
        },
      },
    },
  },
}
```

ดู [Groups](/th/channels/groups) สำหรับพฤติกรรมการบังคับ mention และ allowlist

ตัวอย่าง pairing สำหรับ Matrix DM:

```bash
openclaw pairing list matrix
openclaw pairing approve matrix <CODE>
```

หากผู้ใช้ Matrix ที่ยังไม่ได้รับการอนุมัติยังคงส่งข้อความหาคุณก่อนการอนุมัติ OpenClaw จะใช้รหัส pairing ที่รอดำเนินการเดิมซ้ำ และอาจส่งข้อความเตือนอีกครั้งหลังช่วงคูลดาวน์สั้น ๆ แทนที่จะสร้างรหัสใหม่

ดู [Pairing](/th/channels/pairing) สำหรับโฟลว์ DM pairing แบบใช้ร่วมกันและโครงสร้างการจัดเก็บ

## การซ่อมห้อง direct

หากสถานะ direct-message ไม่ซิงก์ OpenClaw อาจจบลงด้วยการมีแมป `m.direct` ที่ค้างอยู่และชี้ไปยังห้องเดี่ยวเก่าแทนที่จะเป็น DM ปัจจุบัน ตรวจสอบแมปปัจจุบันสำหรับ peer ด้วย:

```bash
openclaw matrix direct inspect --user-id @alice:example.org
```

ซ่อมแซมด้วย:

```bash
openclaw matrix direct repair --user-id @alice:example.org
```

โฟลว์การซ่อมแซม:

- ให้ความสำคัญกับ DM แบบ 1:1 ที่เข้มงวดซึ่งถูกแมปอยู่แล้วใน `m.direct`
- หากไม่พบ จะย้อนกลับไปใช้ DM แบบ 1:1 ที่เข้าร่วมอยู่ในปัจจุบันกับผู้ใช้นั้น
- หากไม่มี DM ที่สมบูรณ์ จะสร้างห้อง direct ใหม่และเขียน `m.direct` ใหม่

โฟลว์การซ่อมแซมจะไม่ลบห้องเก่าโดยอัตโนมัติ แต่จะเลือก DM ที่สมบูรณ์และอัปเดตแมป เพื่อให้การส่ง Matrix ใหม่ การแจ้งเตือนการยืนยันตัวตน และโฟลว์ direct-message อื่น ๆ ชี้ไปยังห้องที่ถูกต้องอีกครั้ง

## การอนุมัติ exec

Matrix สามารถทำหน้าที่เป็นไคลเอนต์อนุมัติแบบเนทีฟสำหรับบัญชี Matrix ได้ ปุ่มควบคุมการกำหนดเส้นทาง DM/ช่องทางแบบเนทีฟ
ยังคงอยู่ภายใต้ config ของการอนุมัติ exec:

- `channels.matrix.execApprovals.enabled`
- `channels.matrix.execApprovals.approvers` (ไม่บังคับ; ย้อนกลับไปใช้ `channels.matrix.dm.allowFrom`)
- `channels.matrix.execApprovals.target` (`dm` | `channel` | `both`, ค่าเริ่มต้น: `dm`)
- `channels.matrix.execApprovals.agentFilter`
- `channels.matrix.execApprovals.sessionFilter`

ผู้อนุมัติต้องเป็น Matrix user ID เช่น `@owner:example.org` Matrix จะเปิดใช้การอนุมัติแบบเนทีฟโดยอัตโนมัติเมื่อ `enabled` ไม่ได้ตั้งค่าหรือเป็น `"auto"` และสามารถ resolve ผู้อนุมัติได้อย่างน้อยหนึ่งราย การอนุมัติ exec ใช้ `execApprovals.approvers` ก่อน และสามารถย้อนกลับไปใช้ `channels.matrix.dm.allowFrom` ได้ ส่วนการอนุมัติ Plugin จะอนุญาตผ่าน `channels.matrix.dm.allowFrom` ตั้งค่า `enabled: false` เพื่อปิด Matrix ไม่ให้เป็นไคลเอนต์อนุมัติแบบเนทีฟอย่างชัดเจน มิฉะนั้นคำขออนุมัติจะย้อนกลับไปยังเส้นทางการอนุมัติอื่นที่กำหนดค่าไว้หรือใช้นโยบายสำรองสำหรับการอนุมัติ

การกำหนดเส้นทางแบบเนทีฟของ Matrix รองรับการอนุมัติทั้งสองชนิด:

- `channels.matrix.execApprovals.*` ควบคุมโหมด fanout ของ DM/ช่องทางแบบเนทีฟสำหรับข้อความแจ้งการอนุมัติของ Matrix
- การอนุมัติ exec ใช้ชุดผู้อนุมัติ exec จาก `execApprovals.approvers` หรือ `channels.matrix.dm.allowFrom`
- การอนุมัติ Plugin ใช้ Matrix DM allowlist จาก `channels.matrix.dm.allowFrom`
- ทางลัด reaction ของ Matrix และการอัปเดตข้อความ ใช้ได้กับทั้งการอนุมัติ exec และ Plugin

กฎการส่ง:

- `target: "dm"` ส่งข้อความแจ้งการอนุมัติไปยัง DM ของผู้อนุมัติ
- `target: "channel"` ส่งข้อความแจ้งกลับไปยังห้องหรือ DM ต้นทางของ Matrix
- `target: "both"` ส่งทั้งไปยัง DM ของผู้อนุมัติและห้องหรือ DM ต้นทางของ Matrix

ข้อความแจ้งการอนุมัติของ Matrix จะเริ่มต้นทางลัด reaction บนข้อความอนุมัติหลัก:

- `✅` = อนุญาตครั้งเดียว
- `❌` = ปฏิเสธ
- `♾️` = อนุญาตตลอดไป เมื่อการตัดสินใจนั้นได้รับอนุญาตจากนโยบาย exec ที่มีผลอยู่

ผู้อนุมัติสามารถกด reaction บนข้อความนั้น หรือใช้คำสั่ง slash สำรอง: `/approve <id> allow-once`, `/approve <id> allow-always` หรือ `/approve <id> deny`

เฉพาะผู้อนุมัติที่ resolve ได้เท่านั้นที่สามารถอนุมัติหรือปฏิเสธได้ สำหรับการอนุมัติ exec การส่งผ่านช่องทางจะรวมข้อความคำสั่งไว้ด้วย ดังนั้นควรเปิดใช้ `channel` หรือ `both` เฉพาะในห้องที่เชื่อถือได้

การกำหนดแทนรายบัญชี:

- `channels.matrix.accounts.<account>.execApprovals`

เอกสารที่เกี่ยวข้อง: [การอนุมัติ exec](/th/tools/exec-approvals)

## คำสั่ง slash

คำสั่ง slash ของ Matrix (เช่น `/new`, `/reset`, `/model`) ใช้งานได้โดยตรงใน DM ในห้อง OpenClaw ยังรู้จักคำสั่ง slash ที่มี mention ของบอต Matrix เองนำหน้าได้ด้วย ดังนั้น `@bot:server /new` จะกระตุ้นเส้นทางคำสั่งโดยไม่ต้องใช้ regex mention แบบกำหนดเอง วิธีนี้ช่วยให้บอตตอบสนองต่อโพสต์สไตล์ห้องแบบ `@mention /command` ที่ Element และไคลเอนต์คล้ายกันส่งออกมาเมื่อผู้ใช้แท็บเลือกบอตก่อนพิมพ์คำสั่ง

กฎการอนุญาตยังคงมีผล: ผู้ส่งคำสั่งต้องผ่านนโยบาย allowlist/owner ของ DM หรือห้อง เช่นเดียวกับข้อความธรรมดา

## หลายบัญชี

```json5
{
  channels: {
    matrix: {
      enabled: true,
      defaultAccount: "assistant",
      dm: { policy: "pairing" },
      accounts: {
        assistant: {
          homeserver: "https://matrix.example.org",
          accessToken: "syt_assistant_xxx",
          encryption: true,
        },
        alerts: {
          homeserver: "https://matrix.example.org",
          accessToken: "syt_alerts_xxx",
          dm: {
            policy: "allowlist",
            allowFrom: ["@ops:example.org"],
            threadReplies: "off",
          },
        },
      },
    },
  },
}
```

ค่าระดับบนสุดของ `channels.matrix` จะทำหน้าที่เป็นค่าเริ่มต้นสำหรับบัญชีที่มีชื่อ เว้นแต่บัญชีนั้นจะกำหนดแทนเอง
คุณสามารถกำหนดขอบเขต room entries ที่สืบทอดมาให้กับบัญชี Matrix ใดบัญชีหนึ่งได้ด้วย `groups.<room>.account`
entries ที่ไม่มี `account` จะยังคงใช้ร่วมกันในทุกบัญชี Matrix และ entries ที่มี `account: "default"` ก็ยังคงทำงานได้เมื่อมีการกำหนดค่าบัญชีเริ่มต้นไว้โดยตรงที่ `channels.matrix.*` ระดับบนสุด
ค่าเริ่มต้นของการยืนยันตัวตนแบบใช้ร่วมกันเพียงบางส่วนจะไม่สร้างบัญชีเริ่มต้นแบบปริยายแยกต่างหากขึ้นมาเอง OpenClaw จะสังเคราะห์บัญชี `default` ระดับบนสุดก็ต่อเมื่อบัญชีเริ่มต้นนั้นมีข้อมูลยืนยันตัวตนใหม่ (`homeserver` พร้อม `accessToken` หรือ `homeserver` พร้อม `userId` และ `password`) ส่วนบัญชีที่มีชื่อยังคงสามารถค้นพบได้จาก `homeserver` พร้อม `userId` เมื่อต่อมามีข้อมูลรับรองที่ cache ไว้เพียงพอต่อการยืนยันตัวตน
หาก Matrix มีบัญชีที่มีชื่อเพียงบัญชีเดียวอยู่แล้ว หรือ `defaultAccount` ชี้ไปยังคีย์บัญชีที่มีชื่ออยู่แล้ว การซ่อมแซม/ตั้งค่าจากบัญชีเดียวไปหลายบัญชีจะคงบัญชีนั้นไว้แทนการสร้าง entry `accounts.default` ใหม่ เฉพาะคีย์สำหรับการยืนยันตัวตน/ bootstrap ของ Matrix เท่านั้นที่จะถูกย้ายไปยังบัญชีที่เลื่อนระดับนั้น ส่วนคีย์นโยบายการส่งที่ใช้ร่วมกันจะยังคงอยู่ที่ระดับบนสุด
ตั้งค่า `defaultAccount` เมื่อคุณต้องการให้ OpenClaw เลือกใช้บัญชี Matrix ที่มีชื่อบัญชีหนึ่งเป็นค่าเริ่มต้นสำหรับการกำหนดเส้นทางแบบปริยาย การตรวจสอบ และการทำงานของ CLI
หากมีการกำหนดค่าหลายบัญชี Matrix และมี account id หนึ่งเป็น `default` OpenClaw จะใช้บัญชีนั้นโดยปริยายแม้ไม่ได้ตั้งค่า `defaultAccount`
หากคุณกำหนดค่าหลายบัญชีแบบมีชื่อ ให้ตั้งค่า `defaultAccount` หรือส่ง `--account <id>` สำหรับคำสั่ง CLI ที่อาศัยการเลือกบัญชีแบบปริยาย
ส่ง `--account <id>` ไปยัง `openclaw matrix verify ...` และ `openclaw matrix devices ...` เมื่อคุณต้องการแทนที่การเลือกแบบปริยายสำหรับคำสั่งเดียว

ดู [เอกสารอ้างอิงการกำหนดค่า](/th/gateway/config-channels#multi-account-all-channels) สำหรับรูปแบบหลายบัญชีแบบใช้ร่วมกัน

## homeserver แบบส่วนตัว/LAN

ตามค่าเริ่มต้น OpenClaw จะบล็อก homeserver Matrix แบบส่วนตัว/ภายในเพื่อป้องกัน SSRF เว้นแต่คุณจะ
เลือกอนุญาตอย่างชัดเจนเป็นรายบัญชี

หาก homeserver ของคุณทำงานบน localhost, IP ของ LAN/Tailscale หรือชื่อโฮสต์ภายใน ให้เปิดใช้
`network.dangerouslyAllowPrivateNetwork` สำหรับบัญชี Matrix นั้น:

```json5
{
  channels: {
    matrix: {
      homeserver: "http://matrix-synapse:8008",
      network: {
        dangerouslyAllowPrivateNetwork: true,
      },
      accessToken: "syt_internal_xxx",
    },
  },
}
```

ตัวอย่างการตั้งค่าผ่าน CLI:

```bash
openclaw matrix account add \
  --account ops \
  --homeserver http://matrix-synapse:8008 \
  --allow-private-network \
  --access-token syt_ops_xxx
```

การเลือกอนุญาตนี้อนุญาตเฉพาะเป้าหมายส่วนตัว/ภายในที่เชื่อถือได้เท่านั้น ส่วน homeserver แบบข้อความชัดเจนสาธารณะ เช่น
`http://matrix.example.org:8008` จะยังคงถูกบล็อก แนะนำให้ใช้ `https://` ทุกครั้งที่เป็นไปได้

## พร็อกซีทราฟฟิก Matrix

หากระบบ Matrix ของคุณต้องใช้พร็อกซี HTTP(S) ขาออกอย่างชัดเจน ให้ตั้งค่า `channels.matrix.proxy`:

```json5
{
  channels: {
    matrix: {
      homeserver: "https://matrix.example.org",
      accessToken: "syt_bot_xxx",
      proxy: "http://127.0.0.1:7890",
    },
  },
}
```

บัญชีที่มีชื่อสามารถกำหนดแทนค่าเริ่มต้นระดับบนสุดได้ด้วย `channels.matrix.accounts.<id>.proxy`
OpenClaw ใช้การตั้งค่าพร็อกซีเดียวกันนี้ทั้งสำหรับทราฟฟิก Matrix ระหว่างรันไทม์และการตรวจสอบสถานะบัญชี

## การ resolve เป้าหมาย

Matrix รองรับรูปแบบเป้าหมายเหล่านี้ในทุกที่ที่ OpenClaw ขอให้คุณระบุเป้าหมายห้องหรือผู้ใช้:

- ผู้ใช้: `@user:server`, `user:@user:server` หรือ `matrix:user:@user:server`
- ห้อง: `!room:server`, `room:!room:server` หรือ `matrix:room:!room:server`
- alias: `#alias:server`, `channel:#alias:server` หรือ `matrix:channel:#alias:server`

การค้นหาไดเรกทอรีแบบสดใช้บัญชี Matrix ที่ล็อกอินอยู่:

- การค้นหาผู้ใช้จะค้นผ่านไดเรกทอรีผู้ใช้ Matrix บน homeserver นั้น
- การค้นหาห้องจะรับ room ID และ alias ที่ระบุชัดเจนได้โดยตรง จากนั้นจึงย้อนกลับไปค้นหาชื่อห้องที่เข้าร่วมอยู่สำหรับบัญชีนั้น
- การค้นหาชื่อห้องที่เข้าร่วมเป็นแบบ best-effort หากไม่สามารถ resolve ชื่อห้องเป็น ID หรือ alias ได้ ระบบจะเพิกเฉยระหว่างการ resolve allowlist ขณะรันไทม์

## เอกสารอ้างอิงการกำหนดค่า

- `enabled`: เปิดหรือปิดใช้งานช่องทาง
- `name`: ป้ายกำกับเพิ่มเติมสำหรับบัญชี
- `defaultAccount`: account ID ที่ต้องการให้ใช้เป็นค่าเริ่มต้นเมื่อมีการกำหนดค่าหลายบัญชี Matrix
- `homeserver`: URL ของ homeserver เช่น `https://matrix.example.org`
- `network.dangerouslyAllowPrivateNetwork`: อนุญาตให้บัญชี Matrix นี้เชื่อมต่อกับ homeserver แบบส่วนตัว/ภายใน เปิดใช้งานเมื่อตัว homeserver resolve ไปที่ `localhost`, IP ของ LAN/Tailscale หรือโฮสต์ภายใน เช่น `matrix-synapse`
- `proxy`: URL ของพร็อกซี HTTP(S) สำหรับทราฟฟิก Matrix (ไม่บังคับ) บัญชีที่มีชื่อสามารถกำหนดแทนค่าเริ่มต้นระดับบนสุดด้วย `proxy` ของตัวเองได้
- `userId`: Matrix user ID แบบเต็ม เช่น `@bot:example.org`
- `accessToken`: access token สำหรับการยืนยันตัวตนแบบใช้โทเค็น รองรับทั้งค่า plaintext และค่า SecretRef สำหรับ `channels.matrix.accessToken` และ `channels.matrix.accounts.<id>.accessToken` ผ่านผู้ให้บริการ env/file/exec ดู [Secrets Management](/th/gateway/secrets)
- `password`: รหัสผ่านสำหรับการเข้าสู่ระบบแบบใช้รหัสผ่าน รองรับทั้งค่า plaintext และค่า SecretRef
- `deviceId`: Matrix device ID ที่ระบุชัดเจน
- `deviceName`: ชื่อที่แสดงของอุปกรณ์สำหรับการเข้าสู่ระบบด้วยรหัสผ่าน
- `avatarUrl`: URL รูปประจำตัวของตัวเองที่จัดเก็บไว้สำหรับการซิงก์โปรไฟล์และการอัปเดต `profile set`
- `initialSyncLimit`: จำนวน event สูงสุดที่ดึงระหว่างการซิงก์ตอนเริ่มต้นระบบ
- `encryption`: เปิดใช้ E2EE
- `allowlistOnly`: เมื่อเป็น `true` จะยกระดับนโยบายห้องแบบ `open` เป็น `allowlist` และบังคับให้นโยบาย DM ที่ใช้งานอยู่ทั้งหมด ยกเว้น `disabled` (รวมถึง `pairing` และ `open`) เป็น `allowlist` ไม่มีผลกับนโยบาย `disabled`
- `allowBots`: อนุญาตข้อความจากบัญชี Matrix ของ OpenClaw อื่นที่กำหนดค่าไว้ (`true` หรือ `"mentions"`)
- `groupPolicy`: `open`, `allowlist` หรือ `disabled`
- `contextVisibility`: โหมดการมองเห็นบริบทห้องเสริม (`all`, `allowlist`, `allowlist_quote`)
- `groupAllowFrom`: allowlist ของ user ID สำหรับทราฟฟิกในห้อง การใช้ Matrix user ID แบบเต็มปลอดภัยที่สุด ชื่อที่ตรงกันแบบพอดีจากไดเรกทอรีจะถูก resolve ตอนเริ่มต้นและเมื่อ allowlist เปลี่ยนขณะมอนิเตอร์กำลังทำงาน ชื่อที่ resolve ไม่ได้จะถูกเพิกเฉย
- `historyLimit`: จำนวนข้อความห้องสูงสุดที่จะรวมเป็นบริบทประวัติแชตกลุ่ม โดยจะย้อนกลับไปใช้ `messages.groupChat.historyLimit`; หากไม่ได้ตั้งค่าทั้งคู่ ค่าเริ่มต้นที่มีผลจริงคือ `0` ตั้งค่าเป็น `0` เพื่อปิดใช้งาน
- `replyToMode`: `off`, `first`, `all` หรือ `batched`
- `markdown`: การกำหนดค่าการเรนเดอร์ Markdown สำหรับข้อความ Matrix ขาออก (ไม่บังคับ)
- `streaming`: `off` (ค่าเริ่มต้น), `"partial"`, `"quiet"`, `true` หรือ `false` `"partial"` และ `true` จะเปิดการอัปเดตดราฟต์แบบพรีวิวก่อนด้วยข้อความ Matrix ปกติ `"quiet"` ใช้ notice พรีวิวแบบไม่แจ้งเตือนสำหรับการตั้งค่า push rule แบบ self-hosted `false` เทียบเท่ากับ `"off"`
- `blockStreaming`: `true` จะเปิดใช้ข้อความความคืบหน้าแยกต่างหากสำหรับบล็อก assistant ที่เสร็จสมบูรณ์ ขณะมีการสตรีมดราฟต์พรีวิว
- `threadReplies`: `off`, `inbound` หรือ `always`
- `threadBindings`: การกำหนดแทนรายช่องทางสำหรับการกำหนดเส้นทางและวงจรชีวิตของเซสชันแบบผูกกับเธรด
- `startupVerification`: โหมดคำขอการยืนยันตัวตนตัวเองอัตโนมัติเมื่อเริ่มต้นระบบ (`if-unverified`, `off`)
- `startupVerificationCooldownHours`: ช่วงคูลดาวน์ก่อนลองส่งคำขอการยืนยันตัวตนอัตโนมัติเมื่อเริ่มต้นระบบอีกครั้ง
- `textChunkLimit`: ขนาดชิ้นข้อความขาออกเป็นจำนวนอักขระ (ใช้เมื่อ `chunkMode` เป็น `length`)
- `chunkMode`: `length` แบ่งข้อความตามจำนวนอักขระ; `newline` แบ่งตามขอบเขตบรรทัด
- `responsePrefix`: สตริงเพิ่มเติมที่นำหน้าคำตอบขาออกทั้งหมดสำหรับช่องทางนี้
- `ackReaction`: การกำหนดแทน ack reaction สำหรับช่องทาง/บัญชีนี้ (ไม่บังคับ)
- `ackReactionScope`: การกำหนดแทนขอบเขตของ ack reaction (`group-mentions`, `group-all`, `direct`, `all`, `none`, `off`)
- `reactionNotifications`: โหมดการแจ้งเตือน reaction ขาเข้า (`own`, `off`)
- `mediaMaxMb`: ขีดจำกัดขนาดสื่อเป็น MB สำหรับการส่งขาออกและการประมวลผลสื่อขาเข้า
- `autoJoin`: นโยบายเข้าร่วมคำเชิญอัตโนมัติ (`always`, `allowlist`, `off`) ค่าเริ่มต้น: `off` ใช้กับคำเชิญ Matrix ทั้งหมด รวมถึงคำเชิญแบบ DM
- `autoJoinAllowlist`: ห้อง/alias ที่อนุญาตเมื่อ `autoJoin` เป็น `allowlist` รายการ alias จะถูก resolve เป็น room ID ระหว่างการจัดการคำเชิญ OpenClaw จะไม่เชื่อถือสถานะ alias ที่ห้องที่ถูกเชิญอ้างมา
- `dm`: บล็อกนโยบาย DM (`enabled`, `policy`, `allowFrom`, `sessionScope`, `threadReplies`)
- `dm.policy`: ควบคุมการเข้าถึง DM หลังจาก OpenClaw เข้าร่วมห้องแล้วและจัดประเภทว่าเป็น DM แล้ว ค่านี้ไม่เปลี่ยนว่าคำเชิญจะถูกเข้าร่วมอัตโนมัติหรือไม่
- `dm.allowFrom`: allowlist ของ user ID สำหรับทราฟฟิก DM การใช้ Matrix user ID แบบเต็มปลอดภัยที่สุด ชื่อที่ตรงกันแบบพอดีจากไดเรกทอรีจะถูก resolve ตอนเริ่มต้นและเมื่อ allowlist เปลี่ยนขณะมอนิเตอร์กำลังทำงาน ชื่อที่ resolve ไม่ได้จะถูกเพิกเฉย
- `dm.sessionScope`: `per-user` (ค่าเริ่มต้น) หรือ `per-room` ใช้ `per-room` เมื่อคุณต้องการให้แต่ละห้อง DM ของ Matrix เก็บบริบทแยกกัน แม้ peer จะเป็นคนเดิม
- `dm.threadReplies`: การกำหนดแทนนโยบายเธรดเฉพาะ DM (`off`, `inbound`, `always`) โดยจะใช้แทนการตั้งค่า `threadReplies` ระดับบนสุดทั้งสำหรับตำแหน่งการตอบกลับและการแยกเซสชันใน DM
- `execApprovals`: การส่งการอนุมัติ exec แบบเนทีฟของ Matrix (`enabled`, `approvers`, `target`, `agentFilter`, `sessionFilter`)
- `execApprovals.approvers`: Matrix user ID ที่ได้รับอนุญาตให้อนุมัติคำขอ exec เป็นตัวเลือกไม่บังคับเมื่อ `dm.allowFrom` ระบุผู้อนุมัติไว้อยู่แล้ว
- `execApprovals.target`: `dm | channel | both` (ค่าเริ่มต้น: `dm`)
- `accounts`: การกำหนดแทนรายบัญชีแบบมีชื่อ ค่าระดับบนสุดของ `channels.matrix` จะทำหน้าที่เป็นค่าเริ่มต้นสำหรับ entries เหล่านี้
- `groups`: แผนที่นโยบายรายห้อง ควรใช้ room ID หรือ alias; ชื่อห้องที่ resolve ไม่ได้จะถูกเพิกเฉยขณะรันไทม์ ตัวตนของเซสชัน/กลุ่มจะใช้ room ID ที่เสถียรหลังการ resolve
- `groups.<room>.account`: จำกัด room entry ที่สืบทอดมาหนึ่งรายการให้ใช้กับบัญชี Matrix ที่ระบุในการตั้งค่าแบบหลายบัญชี
- `groups.<room>.allowBots`: การกำหนดแทนระดับห้องสำหรับผู้ส่งที่เป็นบอตที่กำหนดค่าไว้ (`true` หรือ `"mentions"`)
- `groups.<room>.users`: allowlist ของผู้ส่งรายห้อง
- `groups.<room>.tools`: การกำหนดแทนการอนุญาต/ปฏิเสธ tools รายห้อง
- `groups.<room>.autoReply`: การกำหนดแทนการบังคับ mention ระดับห้อง `true` จะปิดข้อกำหนดเรื่อง mention สำหรับห้องนั้น; `false` จะบังคับให้กลับมาเปิดอีกครั้ง
- `groups.<room>.skills`: ตัวกรอง Skills ระดับห้อง (ไม่บังคับ)
- `groups.<room>.systemPrompt`: ข้อความ system prompt เพิ่มเติมระดับห้อง (ไม่บังคับ)
- `rooms`: alias แบบเดิมของ `groups`
- `actions`: การควบคุมการใช้ tools ราย action (`messages`, `reactions`, `pins`, `profile`, `memberInfo`, `channelInfo`, `verification`)

## ที่เกี่ยวข้อง

- [ภาพรวมช่องทาง](/th/channels) — ช่องทางทั้งหมดที่รองรับ
- [Pairing](/th/channels/pairing) — การยืนยันตัวตน DM และโฟลว์การจับคู่
- [กลุ่ม](/th/channels/groups) — พฤติกรรมของแชตกลุ่มและการบังคับ mention
- [การกำหนดเส้นทางช่องทาง](/th/channels/channel-routing) — การกำหนดเส้นทางเซสชันสำหรับข้อความ
- [ความปลอดภัย](/th/gateway/security) — โมเดลการเข้าถึงและการเสริมความแข็งแกร่ง
