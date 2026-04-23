---
read_when:
    - การตั้งค่า Matrix ใน OpenClaw
    - การกำหนดค่า Matrix E2EE และการยืนยันตัวตน
summary: สถานะการรองรับ Matrix การตั้งค่า และตัวอย่างการกำหนดค่า
title: Matrix
x-i18n:
    generated_at: "2026-04-23T14:56:01Z"
    model: gpt-5.4
    provider: openai
    source_hash: 2e9d4d656b47aca2dacb00e591378cb26631afc5b634074bc26e21741b418b47
    source_path: channels/matrix.md
    workflow: 15
---

# Matrix

Matrix เป็น channel Plugin ที่มาพร้อมกับ OpenClaw
โดยใช้ `matrix-js-sdk` อย่างเป็นทางการ และรองรับ DM, rooms, threads, media, reactions, polls, location และ E2EE

## Plugin ที่มาพร้อมกัน

Matrix มาพร้อมเป็น Plugin ที่รวมอยู่ในรีลีส OpenClaw ปัจจุบัน ดังนั้น
บิลด์แบบแพ็กเกจตามปกติจึงไม่ต้องติดตั้งแยกต่างหาก

หากคุณใช้บิลด์เก่าหรือการติดตั้งแบบกำหนดเองที่ไม่ได้รวม Matrix ไว้ ให้ติดตั้ง
ด้วยตนเอง:

ติดตั้งจาก npm:

```bash
openclaw plugins install @openclaw/matrix
```

ติดตั้งจาก local checkout:

```bash
openclaw plugins install ./path/to/local/matrix-plugin
```

ดู [Plugins](/th/tools/plugin) สำหรับพฤติกรรมของ Plugin และกฎการติดตั้ง

## การตั้งค่า

1. ตรวจสอบให้แน่ใจว่า Plugin Matrix พร้อมใช้งาน
   - รีลีส OpenClaw แบบแพ็กเกจปัจจุบันรวมมาให้แล้ว
   - การติดตั้งแบบเก่า/กำหนดเองสามารถเพิ่มได้ด้วยตนเองโดยใช้คำสั่งด้านบน
2. สร้างบัญชี Matrix บน homeserver ของคุณ
3. กำหนดค่า `channels.matrix` ด้วยอย่างใดอย่างหนึ่งต่อไปนี้:
   - `homeserver` + `accessToken`, หรือ
   - `homeserver` + `userId` + `password`
4. รีสตาร์ต Gateway
5. เริ่ม DM กับบอตหรือเชิญบอตเข้าห้อง
   - คำเชิญ Matrix ใหม่จะใช้งานได้ก็ต่อเมื่อ `channels.matrix.autoJoin` อนุญาต

เส้นทางการตั้งค่าแบบโต้ตอบ:

```bash
openclaw channels add
openclaw configure --section channels
```

ตัวช่วยตั้งค่า Matrix จะถามข้อมูลดังนี้:

- URL ของ homeserver
- วิธีการยืนยันตัวตน: access token หรือ password
- user ID (เฉพาะการยืนยันตัวตนด้วย password)
- ชื่ออุปกรณ์ที่ไม่บังคับ
- จะเปิดใช้ E2EE หรือไม่
- จะกำหนดค่าการเข้าถึงห้องและการเข้าร่วมอัตโนมัติเมื่อถูกเชิญหรือไม่

พฤติกรรมสำคัญของตัวช่วยตั้งค่า:

- หากมี auth env vars ของ Matrix อยู่แล้ว และบัญชีนั้นยังไม่มีการบันทึก auth ใน config ตัวช่วยตั้งค่าจะเสนอตัวเลือก env เพื่อเก็บ auth ไว้ใน env vars
- ชื่อบัญชีจะถูกทำให้เป็นรูปแบบมาตรฐานตาม account ID ตัวอย่างเช่น `Ops Bot` จะกลายเป็น `ops-bot`
- รายการ allowlist ของ DM รับค่า `@user:server` ได้โดยตรง ส่วน display name จะใช้ได้ก็ต่อเมื่อการค้นหาไดเรกทอรีแบบสดพบผลลัพธ์ที่ตรงกันเพียงรายการเดียว
- รายการ allowlist ของห้องรับ room IDs และ aliases ได้โดยตรง ควรใช้ `!room:server` หรือ `#alias:server`; ชื่อที่ไม่สามารถ resolve ได้จะถูกเพิกเฉยขณะรันไทม์โดยการ resolve allowlist
- ในโหมด allowlist ของ invite auto-join ให้ใช้เฉพาะเป้าหมายคำเชิญที่เสถียร: `!roomId:server`, `#alias:server` หรือ `*` เท่านั้น Plain room names จะถูกปฏิเสธ
- หากต้องการ resolve ชื่อห้องก่อนบันทึก ให้ใช้ `openclaw channels resolve --channel matrix "Project Room"`

<Warning>
`channels.matrix.autoJoin` มีค่าเริ่มต้นเป็น `off`

หากคุณปล่อยให้ไม่ได้ตั้งค่า บอตจะไม่เข้าร่วมห้องที่ถูกเชิญหรือคำเชิญแบบ DM ใหม่ ดังนั้นจะไม่ปรากฏในกลุ่มใหม่หรือ DM ที่ได้รับเชิญ เว้นแต่คุณจะเข้าร่วมด้วยตนเองก่อน

ตั้งค่า `autoJoin: "allowlist"` ร่วมกับ `autoJoinAllowlist` เพื่อจำกัดว่าคำเชิญใดที่ยอมรับได้ หรือกำหนด `autoJoin: "always"` หากคุณต้องการให้เข้าร่วมทุกคำเชิญ

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

การตั้งค่าขั้นต่ำแบบใช้ token:

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

การตั้งค่าแบบใช้ password (token จะถูกแคชหลังจากเข้าสู่ระบบ):

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

Matrix จัดเก็บข้อมูลรับรองที่แคชไว้ใน `~/.openclaw/credentials/matrix/`
บัญชีค่าเริ่มต้นใช้ `credentials.json`; บัญชีที่ตั้งชื่อไว้จะใช้ `credentials-<account>.json`
เมื่อมีข้อมูลรับรองที่แคชไว้ในตำแหน่งนี้ OpenClaw จะถือว่า Matrix ได้รับการกำหนดค่าสำหรับการตั้งค่า, doctor และการค้นหาสถานะ channel แม้ว่า auth ปัจจุบันจะไม่ได้ถูกตั้งค่าไว้โดยตรงใน config ก็ตาม

ตัวแปรสภาพแวดล้อมที่เทียบเท่ากัน (ใช้เมื่อไม่ได้ตั้งค่า config key):

- `MATRIX_HOMESERVER`
- `MATRIX_ACCESS_TOKEN`
- `MATRIX_USER_ID`
- `MATRIX_PASSWORD`
- `MATRIX_DEVICE_ID`
- `MATRIX_DEVICE_NAME`

สำหรับบัญชีที่ไม่ใช่ค่าเริ่มต้น ให้ใช้ env vars แบบระบุขอบเขตบัญชี:

- `MATRIX_<ACCOUNT_ID>_HOMESERVER`
- `MATRIX_<ACCOUNT_ID>_ACCESS_TOKEN`
- `MATRIX_<ACCOUNT_ID>_USER_ID`
- `MATRIX_<ACCOUNT_ID>_PASSWORD`
- `MATRIX_<ACCOUNT_ID>_DEVICE_ID`
- `MATRIX_<ACCOUNT_ID>_DEVICE_NAME`

ตัวอย่างสำหรับบัญชี `ops`:

- `MATRIX_OPS_HOMESERVER`
- `MATRIX_OPS_ACCESS_TOKEN`

สำหรับ normalized account ID `ops-bot` ให้ใช้:

- `MATRIX_OPS_X2D_BOT_HOMESERVER`
- `MATRIX_OPS_X2D_BOT_ACCESS_TOKEN`

Matrix จะ escape เครื่องหมายวรรคตอนใน account IDs เพื่อป้องกันการชนกันของ env vars แบบมีขอบเขต
ตัวอย่างเช่น `-` จะกลายเป็น `_X2D_` ดังนั้น `ops-prod` จะถูกแมปเป็น `MATRIX_OPS_X2D_PROD_*`

ตัวช่วยตั้งค่าแบบโต้ตอบจะเสนอตัวเลือก env-var ก็ต่อเมื่อมี auth env vars เหล่านั้นอยู่แล้ว และบัญชีที่เลือกยังไม่มีการบันทึก Matrix auth ไว้ใน config

ไม่สามารถตั้งค่า `MATRIX_HOMESERVER` จาก workspace `.env` ได้; ดู [ไฟล์ `.env` ของ workspace](/th/gateway/security)

## ตัวอย่างการกำหนดค่า

นี่คือตัวอย่าง config พื้นฐานที่ใช้งานได้จริง พร้อม DM pairing, room allowlist และเปิดใช้ E2EE:

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

`autoJoin` ใช้กับคำเชิญ Matrix ทุกประเภท รวมถึงคำเชิญแบบ DM ด้วย OpenClaw ไม่สามารถ
จำแนกห้องที่ถูกเชิญได้อย่างน่าเชื่อถือว่าเป็น DM หรือกลุ่มในขณะเชิญ ดังนั้นคำเชิญทั้งหมดจะผ่าน `autoJoin`
ก่อน ส่วน `dm.policy` จะมีผลหลังจากบอตเข้าร่วมห้องแล้วและห้องนั้นถูกจัดประเภทว่าเป็น DM

## ตัวอย่างสตรีมมิง

การสตรีมคำตอบของ Matrix เป็นแบบ opt-in

ตั้งค่า `channels.matrix.streaming` เป็น `"partial"` เมื่อคุณต้องการให้ OpenClaw ส่งคำตอบตัวอย่างสดหนึ่งรายการ
แก้ไขตัวอย่างนั้นในตำแหน่งเดิมขณะที่โมเดลกำลังสร้างข้อความ และปิดท้ายเมื่อ
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
- `streaming: "partial"` จะสร้างข้อความตัวอย่างที่แก้ไขได้หนึ่งรายการสำหรับ assistant block ปัจจุบัน โดยใช้ข้อความ Matrix ปกติ ซึ่งยังคงพฤติกรรมการแจ้งเตือนแบบแสดงตัวอย่างก่อนตามรูปแบบเดิมของ Matrix ดังนั้น client มาตรฐานอาจแจ้งเตือนจากข้อความตัวอย่างที่สตรีมครั้งแรกแทนที่จะเป็นบล็อกที่เสร็จสมบูรณ์
- `streaming: "quiet"` จะสร้างข้อความตัวอย่างแบบเงียบที่แก้ไขได้หนึ่งรายการสำหรับ assistant block ปัจจุบัน ใช้เฉพาะเมื่อคุณกำหนดค่ากฎ push ของผู้รับสำหรับการแก้ไขตัวอย่างที่สรุปผลแล้วด้วย
- `blockStreaming: true` เปิดใช้ข้อความความคืบหน้า Matrix แยกต่างหาก เมื่อเปิดใช้การสตรีมตัวอย่าง Matrix จะคง draft สดไว้สำหรับบล็อกปัจจุบัน และเก็บบล็อกที่เสร็จแล้วเป็นข้อความแยกต่างหาก
- เมื่อเปิดใช้การสตรีมตัวอย่างและ `blockStreaming` ปิดอยู่ Matrix จะแก้ไข draft สดในตำแหน่งเดิมและสรุปผล event เดิมนั้นเมื่อบล็อกหรือเทิร์นสิ้นสุด
- หากตัวอย่างไม่สามารถอยู่ใน Matrix event เดียวได้อีกต่อไป OpenClaw จะหยุดการสตรีมตัวอย่างและกลับไปใช้การส่งแบบสุดท้ายตามปกติ
- คำตอบที่เป็นสื่อยังคงส่งไฟล์แนบตามปกติ หากตัวอย่างเก่าไม่สามารถนำกลับมาใช้ใหม่ได้อย่างปลอดภัย OpenClaw จะ redact ตัวอย่างนั้นก่อนส่งคำตอบสื่อสุดท้าย
- การแก้ไขตัวอย่างมีค่าใช้จ่ายเป็น Matrix API calls เพิ่มเติม ปล่อยให้ปิดสตรีมมิงไว้หากคุณต้องการพฤติกรรม rate limit ที่ระมัดระวังที่สุด

`blockStreaming` จะไม่เปิดใช้ draft previews ด้วยตัวเอง
ให้ใช้ `streaming: "partial"` หรือ `streaming: "quiet"` สำหรับการแก้ไขตัวอย่างก่อน จากนั้นจึงเพิ่ม `blockStreaming: true` เฉพาะเมื่อคุณต้องการให้ assistant blocks ที่เสร็จแล้วคงแสดงอยู่เป็นข้อความความคืบหน้าแยกต่างหากด้วย

หากคุณต้องการการแจ้งเตือน Matrix มาตรฐานโดยไม่ใช้กฎ push แบบกำหนดเอง ให้ใช้ `streaming: "partial"` สำหรับพฤติกรรมแสดงตัวอย่างก่อน หรือปล่อย `streaming` เป็นปิดสำหรับการส่งเฉพาะผลลัพธ์สุดท้าย เมื่อใช้ `streaming: "off"`:

- `blockStreaming: true` จะส่งแต่ละบล็อกที่เสร็จแล้วเป็นข้อความ Matrix ปกติที่มีการแจ้งเตือน
- `blockStreaming: false` จะส่งเฉพาะคำตอบสุดท้ายที่เสร็จสมบูรณ์เป็นข้อความ Matrix ปกติที่มีการแจ้งเตือน

### กฎ push แบบ self-hosted สำหรับตัวอย่างที่สรุปผลแล้วแบบเงียบ

การสตรีมแบบเงียบ (`streaming: "quiet"`) จะแจ้งเตือนผู้รับก็ต่อเมื่อบล็อกหรือเทิร์นถูกสรุปผลแล้ว — กฎ push ต่อผู้ใช้ต้องตรงกับเครื่องหมายระบุตัวอย่างที่สรุปผลแล้ว ดู [กฎ push ของ Matrix สำหรับตัวอย่างแบบเงียบ](/th/channels/matrix-push-rules) สำหรับการตั้งค่าแบบครบถ้วน (recipient token, การตรวจสอบ pusher, การติดตั้งกฎ และหมายเหตุราย homeserver)

## ห้องบอตต่อบอต

ตามค่าเริ่มต้น ข้อความ Matrix จากบัญชี Matrix ของ OpenClaw อื่นที่กำหนดค่าไว้จะถูกเพิกเฉย

ใช้ `allowBots` เมื่อคุณต้องการให้มีทราฟฟิก Matrix ระหว่างเอเจนต์โดยตั้งใจ:

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
- `allowBots: "mentions"` ยอมรับข้อความเหล่านั้นเฉพาะเมื่อมีการกล่าวถึงบอตนี้อย่างชัดเจนในห้อง ส่วน DM ยังคงได้รับอนุญาต
- `groups.<room>.allowBots` จะแทนที่การตั้งค่าระดับบัญชีสำหรับห้องเดียว
- OpenClaw ยังคงเพิกเฉยต่อข้อความจาก Matrix user ID เดียวกัน เพื่อหลีกเลี่ยงลูปตอบตัวเอง
- Matrix ไม่เปิดเผยแฟล็กบอตแบบ native ในบริบทนี้; OpenClaw ตีความว่า "bot-authored" คือ "ส่งโดยบัญชี Matrix อื่นที่กำหนดค่าไว้บน OpenClaw Gateway นี้"

ใช้ room allowlists ที่เข้มงวดและข้อกำหนดการกล่าวถึงเมื่อเปิดใช้ทราฟฟิกแบบบอตต่อบอตในห้องที่ใช้ร่วมกัน

## การเข้ารหัสและการยืนยันตัวตน

ในห้องที่เข้ารหัส (E2EE) อีเวนต์รูปภาพขาออกจะใช้ `thumbnail_file` เพื่อให้ภาพตัวอย่างถูกเข้ารหัสไปพร้อมกับไฟล์แนบฉบับเต็ม ส่วนห้องที่ไม่เข้ารหัสยังคงใช้ `thumbnail_url` แบบปกติ ไม่ต้องกำหนดค่าเพิ่มเติม — Plugin จะตรวจจับสถานะ E2EE โดยอัตโนมัติ

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

คำสั่งการยืนยันตัวตน (ทั้งหมดรองรับ `--verbose` สำหรับการวินิจฉัยและ `--json` สำหรับเอาต์พุตที่เครื่องอ่านได้):

| คำสั่ง                                                        | วัตถุประสงค์                                                                        |
| -------------------------------------------------------------- | ----------------------------------------------------------------------------------- |
| `openclaw matrix verify status`                                | ตรวจสอบสถานะ cross-signing และการยืนยันตัวตนอุปกรณ์                                |
| `openclaw matrix verify status --include-recovery-key --json`  | รวม recovery key ที่จัดเก็บไว้                                                     |
| `openclaw matrix verify bootstrap`                             | Bootstrap cross-signing และการยืนยันตัวตน (ดูด้านล่าง)                            |
| `openclaw matrix verify bootstrap --force-reset-cross-signing` | ทิ้ง cross-signing identity ปัจจุบันและสร้างใหม่                                  |
| `openclaw matrix verify device "<recovery-key>"`               | ยืนยันตัวตนอุปกรณ์นี้ด้วย recovery key                                             |
| `openclaw matrix verify backup status`                         | ตรวจสอบสถานะความสมบูรณ์ของ room-key backup                                        |
| `openclaw matrix verify backup restore`                        | กู้คืน room keys จาก backup บนเซิร์ฟเวอร์                                          |
| `openclaw matrix verify backup reset --yes`                    | ลบ backup ปัจจุบันและสร้าง baseline ใหม่ (อาจสร้าง secret storage ใหม่ด้วย)        |

ในการตั้งค่าแบบหลายบัญชี คำสั่ง Matrix CLI จะใช้บัญชี Matrix ค่าเริ่มต้นโดยปริยาย เว้นแต่คุณจะส่ง `--account <id>`
หากคุณกำหนดค่าหลายบัญชีที่ตั้งชื่อไว้ ให้ตั้งค่า `channels.matrix.defaultAccount` ก่อน มิฉะนั้นการดำเนินการ CLI แบบปริยายเหล่านั้นจะหยุดและขอให้คุณเลือกบัญชีอย่างชัดเจน
ใช้ `--account` ทุกครั้งเมื่อคุณต้องการให้การยืนยันตัวตนหรือการดำเนินการกับอุปกรณ์เจาะจงไปยังบัญชีที่ตั้งชื่อไว้โดยชัดเจน:

```bash
openclaw matrix verify status --account assistant
openclaw matrix verify backup restore --account assistant
openclaw matrix devices list --account assistant
```

เมื่อการเข้ารหัสถูกปิดใช้งานหรือไม่พร้อมใช้งานสำหรับบัญชีที่ตั้งชื่อไว้ คำเตือนของ Matrix และข้อผิดพลาดการยืนยันตัวตนจะชี้ไปยัง config key ของบัญชีนั้น เช่น `channels.matrix.accounts.assistant.encryption`

<AccordionGroup>
  <Accordion title="ความหมายของการยืนยันตัวตนแล้ว">
    OpenClaw จะถือว่าอุปกรณ์ได้รับการยืนยันตัวตนแล้วก็ต่อเมื่อ cross-signing identity ของคุณเองเป็นผู้ลงนามให้อุปกรณ์นั้น `verify status --verbose` จะแสดงสัญญาณความเชื่อถือสามรายการ:

    - `Locally trusted`: เชื่อถือโดย client นี้เท่านั้น
    - `Cross-signing verified`: SDK รายงานว่าได้รับการยืนยันตัวตนผ่าน cross-signing
    - `Signed by owner`: ลงนามโดย self-signing key ของคุณเอง

    `Verified by owner` จะเป็น `yes` ก็ต่อเมื่อมี cross-signing หรือ owner-signing เท่านั้น การเชื่อถือเฉพาะในเครื่องเพียงอย่างเดียวยังไม่เพียงพอ

  </Accordion>

  <Accordion title="bootstrap ทำอะไร">
    `verify bootstrap` คือคำสั่งสำหรับซ่อมแซมและตั้งค่าบัญชีที่เข้ารหัส โดยจะทำงานตามลำดับดังนี้:

    - bootstrap secret storage โดยใช้ recovery key เดิมซ้ำเมื่อเป็นไปได้
    - bootstrap cross-signing และอัปโหลด public cross-signing keys ที่ขาดหายไป
    - ทำเครื่องหมายและ cross-sign อุปกรณ์ปัจจุบัน
    - สร้าง room-key backup ฝั่งเซิร์ฟเวอร์หากยังไม่มีอยู่

    หาก homeserver ต้องใช้ UIA เพื่ออัปโหลด cross-signing keys, OpenClaw จะลองแบบ no-auth ก่อน จากนั้น `m.login.dummy` แล้วค่อย `m.login.password` (ต้องใช้ `channels.matrix.password`) ใช้ `--force-reset-cross-signing` เฉพาะเมื่อคุณตั้งใจจะทิ้ง identity ปัจจุบันเท่านั้น

  </Accordion>

  <Accordion title="baseline backup ใหม่">
    หากคุณต้องการให้ข้อความที่เข้ารหัสในอนาคตยังทำงานได้ต่อไป และยอมรับการสูญเสียประวัติเก่าที่กู้คืนไม่ได้:

```bash
openclaw matrix verify backup reset --yes
openclaw matrix verify backup status --verbose
openclaw matrix verify status
```

    เพิ่ม `--account <id>` เพื่อเจาะจงบัญชีที่ตั้งชื่อไว้ การดำเนินการนี้อาจสร้าง secret storage ใหม่ด้วย หากไม่สามารถโหลด backup secret ปัจจุบันได้อย่างปลอดภัย

  </Accordion>

  <Accordion title="พฤติกรรมขณะเริ่มต้น">
    เมื่อใช้ `encryption: true`, `startupVerification` จะมีค่าเริ่มต้นเป็น `"if-unverified"` ระหว่างเริ่มต้น อุปกรณ์ที่ยังไม่ผ่านการยืนยันตัวตนจะขอการยืนยันตัวตนจากตัวเองใน Matrix client อื่น โดยข้ามรายการซ้ำและใช้ช่วงพักคูลดาวน์ ปรับแต่งได้ด้วย `startupVerificationCooldownHours` หรือปิดด้วย `startupVerification: "off"`

    ระหว่างเริ่มต้น ระบบจะรันกระบวนการ crypto bootstrap แบบระมัดระวังด้วย ซึ่งจะใช้ secret storage และ cross-signing identity ปัจจุบันซ้ำ หากสถานะ bootstrap เสียหาย OpenClaw จะพยายามซ่อมแซมแบบมีการป้องกันแม้ไม่มี `channels.matrix.password`; หาก homeserver ต้องใช้ password UIA ระหว่างเริ่มต้น ระบบจะบันทึกคำเตือนและไม่ถือเป็นความล้มเหลวร้ายแรง อุปกรณ์ที่ถูก owner-sign ไว้แล้วจะยังคงถูกรักษาไว้

    ดู [การย้าย Matrix](/th/install/migrating-matrix) สำหรับขั้นตอนอัปเกรดแบบเต็ม

  </Accordion>

  <Accordion title="ข้อความแจ้งเตือนการยืนยันตัวตน">
    Matrix จะโพสต์ข้อความแจ้งเตือนวงจรการยืนยันตัวตนลงในห้อง DM สำหรับการยืนยันตัวตนแบบเข้มงวดในรูปแบบข้อความ `m.notice`: คำขอ, ready (พร้อมคำแนะนำ "Verify by emoji"), การเริ่มต้น/เสร็จสิ้น และรายละเอียด SAS (emoji/ตัวเลข) เมื่อมี

    คำขอขาเข้าจาก Matrix client อื่นจะถูกติดตามและยอมรับโดยอัตโนมัติ สำหรับการยืนยันตัวตนด้วยตนเอง OpenClaw จะเริ่มขั้นตอน SAS โดยอัตโนมัติและยืนยันฝั่งของตนเองเมื่อการยืนยันด้วย emoji พร้อมใช้งาน — แต่คุณยังต้องเปรียบเทียบและยืนยัน "They match" ใน Matrix client ของคุณเอง

    ข้อความแจ้งเตือนของระบบการยืนยันตัวตนจะไม่ถูกส่งต่อไปยังไปป์ไลน์แชตของเอเจนต์

  </Accordion>

  <Accordion title="สุขอนามัยของอุปกรณ์">
    อุปกรณ์เก่าที่ OpenClaw จัดการอาจสะสมเพิ่มขึ้นได้ แสดงรายการและลบรายการเก่า:

```bash
openclaw matrix devices list
openclaw matrix devices prune-stale
```

  </Accordion>

  <Accordion title="Crypto store">
    Matrix E2EE ใช้เส้นทาง Rust crypto ของ `matrix-js-sdk` อย่างเป็นทางการร่วมกับ `fake-indexeddb` เป็น IndexedDB shim สถานะ crypto จะถูกเก็บถาวรไว้ใน `crypto-idb-snapshot.json` (สิทธิ์ไฟล์แบบจำกัด)

    สถานะรันไทม์ที่เข้ารหัสจะอยู่ภายใต้ `~/.openclaw/matrix/accounts/<account>/<homeserver>__<user>/<token-hash>/` และรวมถึง sync store, crypto store, recovery key, IDB snapshot, thread bindings และสถานะ startup verification เมื่อ token เปลี่ยนแต่ identity ของบัญชียังคงเดิม OpenClaw จะใช้ root เดิมที่ดีที่สุดซ้ำเพื่อให้สถานะก่อนหน้ายังคงมองเห็นได้

  </Accordion>
</AccordionGroup>

## การจัดการโปรไฟล์

อัปเดต self-profile ของ Matrix สำหรับบัญชีที่เลือกด้วย:

```bash
openclaw matrix profile set --name "OpenClaw Assistant"
openclaw matrix profile set --avatar-url https://cdn.example.org/avatar.png
```

เพิ่ม `--account <id>` เมื่อคุณต้องการเจาะจงบัญชี Matrix ที่ตั้งชื่อไว้โดยชัดเจน

Matrix ยอมรับ avatar URLs แบบ `mxc://` ได้โดยตรง เมื่อคุณส่ง avatar URL แบบ `http://` หรือ `https://` OpenClaw จะอัปโหลดไปยัง Matrix ก่อน แล้วจัดเก็บ URL `mxc://` ที่ resolve แล้วกลับเข้าไปใน `channels.matrix.avatarUrl` (หรือ override ของบัญชีที่เลือก)

## Threads

Matrix รองรับ Matrix threads แบบ native ทั้งสำหรับคำตอบอัตโนมัติและการส่งของเครื่องมือข้อความ

- `dm.sessionScope: "per-user"` (ค่าเริ่มต้น) จะคงการกำหนดเส้นทาง DM ของ Matrix ให้ยึดตามผู้ส่ง ดังนั้นหลายห้อง DM จึงสามารถใช้ session เดียวกันได้เมื่อ resolve ไปยัง peer เดียวกัน
- `dm.sessionScope: "per-room"` จะแยกแต่ละห้อง Matrix DM ออกเป็น session key ของตนเอง ขณะเดียวกันก็ยังใช้การยืนยันตัวตน DM และการตรวจสอบ allowlist ตามปกติ
- explicit Matrix conversation bindings ยังคงมีลำดับความสำคัญเหนือ `dm.sessionScope` ดังนั้นห้องและ threads ที่ bind ไว้จะยังคงใช้ session เป้าหมายที่เลือกไว้
- `threadReplies: "off"` จะให้คำตอบอยู่ระดับบนสุด และเก็บข้อความ threaded ขาเข้าไว้บน parent session
- `threadReplies: "inbound"` จะตอบภายใน thread เฉพาะเมื่อข้อความขาเข้าอยู่ใน thread นั้นอยู่แล้ว
- `threadReplies: "always"` จะเก็บคำตอบของห้องไว้ใน thread ที่มีรากจากข้อความกระตุ้น และกำหนดเส้นทางบทสนทนานั้นผ่าน session แบบมีขอบเขตตาม thread ที่ตรงกันจากข้อความกระตุ้นแรก
- `dm.threadReplies` จะแทนที่การตั้งค่าระดับบนสุดสำหรับ DM เท่านั้น ตัวอย่างเช่น คุณสามารถแยก threads ของห้องไว้ แต่คง DM ให้แบนราบได้
- ข้อความ threaded ขาเข้าจะรวมข้อความรากของ thread เป็นบริบทเพิ่มเติมสำหรับเอเจนต์
- การส่งของเครื่องมือข้อความจะสืบทอด Matrix thread ปัจจุบันโดยอัตโนมัติเมื่อเป้าหมายเป็นห้องเดียวกัน หรือเป็นเป้าหมายผู้ใช้ DM เดียวกัน เว้นแต่จะมีการระบุ `threadId` อย่างชัดเจน
- การใช้เป้าหมายผู้ใช้ DM ซ้ำใน session เดียวกันจะเกิดขึ้นก็ต่อเมื่อ metadata ของ session ปัจจุบันยืนยันได้ว่าเป็น peer DM เดียวกันบนบัญชี Matrix เดียวกัน มิฉะนั้น OpenClaw จะกลับไปใช้การกำหนดเส้นทางตามขอบเขตผู้ใช้ตามปกติ
- เมื่อ OpenClaw พบว่าห้อง Matrix DM ชนกับห้อง DM อื่นบน Matrix DM session ที่แชร์เดียวกัน ระบบจะโพสต์ `m.notice` แบบครั้งเดียวในห้องนั้นพร้อม escape hatch `/focus` เมื่อเปิดใช้ thread bindings และมีคำใบ้ `dm.sessionScope`
- รองรับ runtime thread bindings สำหรับ Matrix แล้ว `/focus`, `/unfocus`, `/agents`, `/session idle`, `/session max-age` และ `/acp spawn` แบบผูกกับ thread ใช้งานได้ในห้อง Matrix และ DM
- `/focus` ระดับบนสุดของห้อง/DM ใน Matrix จะสร้าง Matrix thread ใหม่และ bind เข้ากับ session เป้าหมายเมื่อ `threadBindings.spawnSubagentSessions=true`
- การรัน `/focus` หรือ `/acp spawn --thread here` ภายใน Matrix thread ที่มีอยู่แล้วจะ bind thread ปัจจุบันนั้นแทน

## ACP conversation bindings

ห้อง Matrix, DM และ Matrix threads ที่มีอยู่แล้วสามารถเปลี่ยนให้เป็น ACP workspaces แบบคงอยู่ได้โดยไม่ต้องเปลี่ยนพื้นผิวแชต

ขั้นตอนการทำงานแบบรวดเร็วสำหรับผู้ปฏิบัติงาน:

- รัน `/acp spawn codex --bind here` ภายใน Matrix DM, ห้อง หรือ thread ที่มีอยู่แล้วที่คุณต้องการใช้งานต่อ
- ใน Matrix DM หรือห้องระดับบนสุด DM/ห้องปัจจุบันจะยังคงเป็นพื้นผิวแชต และข้อความในอนาคตจะถูกกำหนดเส้นทางไปยัง ACP session ที่สร้างขึ้น
- ภายใน Matrix thread ที่มีอยู่แล้ว `--bind here` จะ bind thread ปัจจุบันนั้นไว้ในตำแหน่งเดิม
- `/new` และ `/reset` จะรีเซ็ต ACP session ที่ bind ไว้เดิมในตำแหน่งเดิม
- `/acp close` จะปิด ACP session และลบ binding

หมายเหตุ:

- `--bind here` จะไม่สร้าง child Matrix thread
- ต้องใช้ `threadBindings.spawnAcpSessions` เฉพาะสำหรับ `/acp spawn --thread auto|here` ซึ่ง OpenClaw จำเป็นต้องสร้างหรือ bind child Matrix thread

### การกำหนดค่า thread binding

Matrix รับค่าพื้นฐานส่วนกลางจาก `session.threadBindings` และยังรองรับ overrides ราย channel ด้วย:

- `threadBindings.enabled`
- `threadBindings.idleHours`
- `threadBindings.maxAgeHours`
- `threadBindings.spawnSubagentSessions`
- `threadBindings.spawnAcpSessions`

แฟล็กการ spawn แบบผูกกับ Matrix thread เป็นแบบ opt-in:

- ตั้งค่า `threadBindings.spawnSubagentSessions: true` เพื่ออนุญาตให้ `/focus` ระดับบนสุดสร้างและ bind Matrix threads ใหม่
- ตั้งค่า `threadBindings.spawnAcpSessions: true` เพื่ออนุญาตให้ `/acp spawn --thread auto|here` bind ACP sessions เข้ากับ Matrix threads

## Reactions

Matrix รองรับการทำงานของ reaction ขาออก การแจ้งเตือน reaction ขาเข้า และ ack reactions ขาเข้า

- เครื่องมือ reaction ขาออกถูกควบคุมโดย `channels["matrix"].actions.reactions`
- `react` จะเพิ่ม reaction ให้กับ Matrix event ที่ระบุ
- `reactions` จะแสดงสรุป reaction ปัจจุบันสำหรับ Matrix event ที่ระบุ
- `emoji=""` จะลบ reactions ของบัญชีบอตเองบน event นั้น
- `remove: true` จะลบเฉพาะ reaction emoji ที่ระบุจากบัญชีบอต

ขอบเขตของ ack reactions จะ resolve ตามลำดับมาตรฐานของ OpenClaw ดังนี้:

- `channels["matrix"].accounts.<accountId>.ackReaction`
- `channels["matrix"].ackReaction`
- `messages.ackReaction`
- fallback เป็น emoji ของ identity ของเอเจนต์

ขอบเขตของ ack reaction จะ resolve ตามลำดับนี้:

- `channels["matrix"].accounts.<accountId>.ackReactionScope`
- `channels["matrix"].ackReactionScope`
- `messages.ackReactionScope`

โหมดการแจ้งเตือน reaction จะ resolve ตามลำดับนี้:

- `channels["matrix"].accounts.<accountId>.reactionNotifications`
- `channels["matrix"].reactionNotifications`
- ค่าเริ่มต้น: `own`

พฤติกรรม:

- `reactionNotifications: "own"` จะส่งต่ออีเวนต์ `m.reaction` ที่ถูกเพิ่ม เมื่ออีเวนต์เหล่านั้นกำหนดเป้าหมายไปยังข้อความ Matrix ที่เขียนโดยบอต
- `reactionNotifications: "off"` จะปิดอีเวนต์ระบบของ reaction
- การลบ reaction จะไม่ถูกสังเคราะห์เป็นอีเวนต์ระบบ เพราะ Matrix แสดงสิ่งเหล่านั้นเป็น redactions ไม่ใช่การลบ `m.reaction` แบบแยกเดี่ยว

## บริบทของประวัติข้อความ

- `channels.matrix.historyLimit` ควบคุมจำนวนข้อความล่าสุดของห้องที่จะรวมเป็น `InboundHistory` เมื่อข้อความในห้อง Matrix เป็นตัวกระตุ้นเอเจนต์ โดยจะ fallback ไปใช้ `messages.groupChat.historyLimit`; หากไม่ได้ตั้งค่าทั้งคู่ ค่าเริ่มต้นที่มีผลจริงคือ `0` ตั้งค่าเป็น `0` เพื่อปิดใช้งาน
- ประวัติห้อง Matrix เป็นแบบเฉพาะห้องเท่านั้น ส่วน DM ยังคงใช้ประวัติ session ตามปกติ
- ประวัติห้อง Matrix เป็นแบบ pending-only: OpenClaw จะบัฟเฟอร์ข้อความในห้องที่ยังไม่เคยกระตุ้นการตอบกลับ จากนั้นจะ snapshot ช่วงหน้าต่างนั้นเมื่อมีการ mention หรือมี trigger อื่นเข้ามา
- ข้อความ trigger ปัจจุบันจะไม่รวมอยู่ใน `InboundHistory`; ข้อความนั้นจะยังคงอยู่ใน main inbound body สำหรับเทิร์นนั้น
- การลองใหม่ของ Matrix event เดิมจะใช้ history snapshot เดิมซ้ำ แทนที่จะเลื่อนไปใช้ข้อความห้องที่ใหม่กว่า

## การมองเห็นบริบท

Matrix รองรับตัวควบคุม `contextVisibility` ที่ใช้ร่วมกันสำหรับบริบทห้องเสริม เช่น ข้อความตอบกลับที่ดึงมา, thread roots และ pending history

- `contextVisibility: "all"` เป็นค่าเริ่มต้น โดยจะคงบริบทเสริมไว้ตามที่ได้รับ
- `contextVisibility: "allowlist"` จะกรองบริบทเสริมให้เหลือเฉพาะผู้ส่งที่ได้รับอนุญาตจากการตรวจสอบ allowlist ของห้อง/ผู้ใช้ที่ใช้งานอยู่
- `contextVisibility: "allowlist_quote"` ทำงานเหมือน `allowlist` แต่ยังคงเก็บ quoted reply แบบ explicit ไว้หนึ่งรายการ

การตั้งค่านี้มีผลต่อการมองเห็นของบริบทเสริม ไม่ใช่การกำหนดว่าข้อความขาเข้าเองสามารถกระตุ้นการตอบกลับได้หรือไม่
การอนุญาต trigger ยังคงมาจากการตั้งค่า `groupPolicy`, `groups`, `groupAllowFrom` และนโยบาย DM

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

ดู [Groups](/th/channels/groups) สำหรับพฤติกรรม mention-gating และ allowlist

ตัวอย่าง pairing สำหรับ Matrix DMs:

```bash
openclaw pairing list matrix
openclaw pairing approve matrix <CODE>
```

หากผู้ใช้ Matrix ที่ยังไม่ได้รับอนุมัติส่งข้อความหาคุณซ้ำก่อนอนุมัติ OpenClaw จะใช้ pending pairing code เดิมซ้ำ และอาจส่งข้อความเตือนอีกครั้งหลังคูลดาวน์สั้น ๆ แทนการสร้างโค้ดใหม่

ดู [Pairing](/th/channels/pairing) สำหรับโฟลว์ DM pairing และโครงสร้างการจัดเก็บที่ใช้ร่วมกัน

## การซ่อมแซมห้อง direct

หากสถานะ direct-message ไม่ตรงกัน OpenClaw อาจลงเอยด้วยการมีแมป `m.direct` ที่ค้างอยู่และชี้ไปยังห้องเดี่ยวเก่าแทน DM ที่ใช้งานจริง ตรวจสอบแมปปัจจุบันสำหรับ peer ได้ด้วย:

```bash
openclaw matrix direct inspect --user-id @alice:example.org
```

ซ่อมแซมด้วย:

```bash
openclaw matrix direct repair --user-id @alice:example.org
```

โฟลว์การซ่อมแซม:

- ให้ความสำคัญกับ DM แบบ 1:1 ที่เข้มงวดซึ่งถูกแมปอยู่แล้วใน `m.direct`
- fallback ไปยัง DM แบบ 1:1 ที่เข้าร่วมอยู่ในปัจจุบันกับผู้ใช้นั้น
- สร้างห้อง direct ใหม่และเขียน `m.direct` ใหม่หากไม่มี DM ที่ใช้งานได้ปกติ

โฟลว์การซ่อมแซมจะไม่ลบห้องเก่าโดยอัตโนมัติ โดยจะเพียงเลือก DM ที่ใช้งานได้ปกติและอัปเดตแมป เพื่อให้การส่ง Matrix ใหม่ ข้อความแจ้งเตือนการยืนยันตัวตน และโฟลว์ direct-message อื่น ๆ กลับไปกำหนดเป้าหมายที่ห้องที่ถูกต้องอีกครั้ง

## การอนุมัติ exec

Matrix สามารถทำหน้าที่เป็น native approval client สำหรับบัญชี Matrix ได้ โดยปุ่มควบคุมการกำหนดเส้นทาง DM/channel แบบ native ยังคงอยู่ภายใต้ config การอนุมัติ exec:

- `channels.matrix.execApprovals.enabled`
- `channels.matrix.execApprovals.approvers` (ไม่บังคับ; fallback ไปใช้ `channels.matrix.dm.allowFrom`)
- `channels.matrix.execApprovals.target` (`dm` | `channel` | `both`, ค่าเริ่มต้น: `dm`)
- `channels.matrix.execApprovals.agentFilter`
- `channels.matrix.execApprovals.sessionFilter`

ผู้อนุมัติต้องเป็น Matrix user IDs เช่น `@owner:example.org` Matrix จะเปิดใช้ native approvals อัตโนมัติเมื่อ `enabled` ไม่ได้ตั้งค่า หรือเป็น `"auto"` และสามารถ resolve ผู้อนุมัติได้อย่างน้อยหนึ่งราย Exec approvals จะใช้ `execApprovals.approvers` ก่อน และสามารถ fallback ไปใช้ `channels.matrix.dm.allowFrom` ได้ ส่วน Plugin approvals จะอนุญาตผ่าน `channels.matrix.dm.allowFrom` ตั้งค่า `enabled: false` เพื่อปิด Matrix ในฐานะ native approval client อย่างชัดเจน มิฉะนั้นคำขออนุมัติจะ fallback ไปยังเส้นทางการอนุมัติอื่นที่กำหนดค่าไว้ หรือนโยบาย approval fallback

การกำหนดเส้นทางแบบ native ของ Matrix รองรับการอนุมัติทั้งสองประเภท:

- `channels.matrix.execApprovals.*` ควบคุมโหมด fanout แบบ native ผ่าน DM/channel สำหรับข้อความอนุมัติของ Matrix
- Exec approvals ใช้ชุดผู้อนุมัติ exec จาก `execApprovals.approvers` หรือ `channels.matrix.dm.allowFrom`
- Plugin approvals ใช้ Matrix DM allowlist จาก `channels.matrix.dm.allowFrom`
- ทางลัด reaction ของ Matrix และการอัปเดตข้อความมีผลกับทั้ง exec approvals และ plugin approvals

กฎการส่ง:

- `target: "dm"` จะส่งข้อความอนุมัติไปยัง DM ของผู้อนุมัติ
- `target: "channel"` จะส่งข้อความแจ้งกลับไปยังห้อง Matrix หรือ DM ต้นทาง
- `target: "both"` จะส่งไปยังทั้ง DM ของผู้อนุมัติและห้อง Matrix หรือ DM ต้นทาง

ข้อความอนุมัติของ Matrix จะเริ่มต้นทางลัด reaction บนข้อความอนุมัติหลัก:

- `✅` = อนุญาตครั้งเดียว
- `❌` = ปฏิเสธ
- `♾️` = อนุญาตเสมอ เมื่อการตัดสินใจนั้นได้รับอนุญาตโดยนโยบาย exec ที่มีผลจริง

ผู้อนุมัติสามารถตอบสนองบนข้อความนั้น หรือใช้ fallback slash commands: `/approve <id> allow-once`, `/approve <id> allow-always` หรือ `/approve <id> deny`

เฉพาะผู้อนุมัติที่ resolve ได้แล้วเท่านั้นที่สามารถอนุมัติหรือปฏิเสธได้ สำหรับ exec approvals การส่งผ่าน channel จะรวมข้อความคำสั่งไว้ด้วย ดังนั้นให้เปิดใช้ `channel` หรือ `both` เฉพาะในห้องที่เชื่อถือได้

override รายบัญชี:

- `channels.matrix.accounts.<account>.execApprovals`

เอกสารที่เกี่ยวข้อง: [Exec approvals](/th/tools/exec-approvals)

## Slash commands

Matrix slash commands (เช่น `/new`, `/reset`, `/model`) ใช้งานได้โดยตรงใน DM ส่วนในห้อง OpenClaw ยังรองรับ slash commands ที่มี Matrix mention ของบอตเองนำหน้า ดังนั้น `@bot:server /new` จะเข้าสู่เส้นทางคำสั่งได้โดยไม่ต้องใช้ mention regex แบบกำหนดเอง วิธีนี้ช่วยให้บอตยังตอบสนองต่อโพสต์สไตล์ห้องแบบ `@mention /command` ที่ Element และ client ลักษณะคล้ายกันส่งออกมาเมื่อผู้ใช้กดเติมชื่อบอตก่อนพิมพ์คำสั่ง

กฎการอนุญาตยังคงมีผล: ผู้ส่งคำสั่งต้องผ่านนโยบาย allowlist/owner ของ DM หรือห้องเช่นเดียวกับข้อความปกติ

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

ค่าระดับบนสุดของ `channels.matrix` จะทำหน้าที่เป็นค่าเริ่มต้นสำหรับบัญชีที่ตั้งชื่อไว้ เว้นแต่บัญชีนั้นจะ override เอง
คุณสามารถกำหนดขอบเขต room entries ที่สืบทอดมาให้ใช้กับบัญชี Matrix เดียวได้ด้วย `groups.<room>.account`
entries ที่ไม่มี `account` จะยังคงถูกใช้ร่วมกันในทุกบัญชี Matrix และ entries ที่มี `account: "default"` ก็ยังใช้งานได้เมื่อกำหนดค่าบัญชีค่าเริ่มต้นไว้โดยตรงที่ `channels.matrix.*` ระดับบนสุด
ค่า auth เริ่มต้นแบบ shared ที่ไม่ครบถ้วนจะไม่สร้าง implicit default account แยกต่างหากด้วยตัวเอง OpenClaw จะสังเคราะห์บัญชี `default` ระดับบนสุดก็ต่อเมื่อ default นั้นมี auth ใหม่ครบ (`homeserver` พร้อม `accessToken` หรือ `homeserver` พร้อม `userId` และ `password`); ส่วนบัญชีที่ตั้งชื่อไว้ยังคงสามารถถูกค้นพบได้จาก `homeserver` พร้อม `userId` เมื่อข้อมูลรับรองที่แคชไว้สามารถตอบสนอง auth ได้ภายหลัง
หาก Matrix มีบัญชีที่ตั้งชื่อไว้เพียงบัญชีเดียวอยู่แล้ว หรือ `defaultAccount` ชี้ไปยังคีย์บัญชีที่ตั้งชื่อไว้ซึ่งมีอยู่จริง การโปรโมตจาก single-account ไป multi-account ระหว่าง repair/setup จะคงบัญชีนั้นไว้แทนการสร้าง entry `accounts.default` ใหม่ มีเพียงคีย์ Matrix auth/bootstrap เท่านั้นที่จะถูกย้ายเข้าไปยังบัญชีที่ถูกโปรโมตนั้น; ส่วนคีย์นโยบายการส่งที่ใช้ร่วมกันจะยังอยู่ที่ระดับบนสุด
ตั้งค่า `defaultAccount` เมื่อคุณต้องการให้ OpenClaw เลือกใช้บัญชี Matrix ที่ตั้งชื่อไว้บัญชีหนึ่งเป็นค่าหลักสำหรับการกำหนดเส้นทางโดยปริยาย การตรวจสอบ และการดำเนินการ CLI
หากมีการกำหนดค่าหลายบัญชี Matrix และหนึ่งใน account id คือ `default` OpenClaw จะใช้บัญชีนั้นโดยปริยายแม้ `defaultAccount` จะไม่ได้ตั้งค่าก็ตาม
หากคุณกำหนดค่าหลายบัญชีที่ตั้งชื่อไว้ ให้ตั้งค่า `defaultAccount` หรือส่ง `--account <id>` สำหรับคำสั่ง CLI ที่อาศัยการเลือกบัญชีโดยปริยาย
ส่ง `--account <id>` ให้กับ `openclaw matrix verify ...` และ `openclaw matrix devices ...` เมื่อคุณต้องการ override การเลือกโดยปริยายดังกล่าวสำหรับคำสั่งเดียว

ดู [ข้อมูลอ้างอิงการกำหนดค่า](/th/gateway/configuration-reference#multi-account-all-channels) สำหรับรูปแบบหลายบัญชีที่ใช้ร่วมกัน

## homeservers แบบ Private/LAN

ตามค่าเริ่มต้น OpenClaw จะบล็อก Matrix homeservers แบบ private/internal เพื่อป้องกัน SSRF เว้นแต่คุณ
จะ opt in อย่างชัดเจนเป็นรายบัญชี

หาก homeserver ของคุณทำงานบน localhost, IP แบบ LAN/Tailscale หรือ hostname ภายใน ให้เปิดใช้
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

การ opt-in นี้อนุญาตเฉพาะเป้าหมาย private/internal ที่เชื่อถือได้เท่านั้น ส่วน homeservers แบบ public cleartext เช่น
`http://matrix.example.org:8008` ยังคงถูกบล็อก ควรใช้ `https://` ทุกครั้งที่เป็นไปได้

## การใช้พร็อกซีกับทราฟฟิก Matrix

หากระบบ Matrix ของคุณต้องการ outbound HTTP(S) proxy แบบ explicit ให้ตั้งค่า `channels.matrix.proxy`:

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

บัญชีที่ตั้งชื่อไว้สามารถ override ค่าเริ่มต้นระดับบนสุดนี้ได้ด้วย `channels.matrix.accounts.<id>.proxy`
OpenClaw ใช้การตั้งค่า proxy เดียวกันทั้งสำหรับทราฟฟิก Matrix ขณะรันไทม์และการตรวจสอบสถานะบัญชี

## การ resolve เป้าหมาย

Matrix ยอมรับรูปแบบเป้าหมายเหล่านี้ในทุกที่ที่ OpenClaw ขอให้คุณระบุเป้าหมายห้องหรือผู้ใช้:

- ผู้ใช้: `@user:server`, `user:@user:server` หรือ `matrix:user:@user:server`
- ห้อง: `!room:server`, `room:!room:server` หรือ `matrix:room:!room:server`
- aliases: `#alias:server`, `channel:#alias:server` หรือ `matrix:channel:#alias:server`

การค้นหาไดเรกทอรีแบบสดใช้บัญชี Matrix ที่เข้าสู่ระบบอยู่:

- การค้นหาผู้ใช้จะค้นใน user directory ของ Matrix บน homeserver นั้น
- การค้นหาห้องจะยอมรับ room IDs และ aliases แบบ explicit ได้โดยตรง จากนั้นจึง fallback ไปค้นหาจากชื่อห้องที่เข้าร่วมอยู่สำหรับบัญชีนั้น
- การค้นหาชื่อห้องที่เข้าร่วมอยู่เป็นแบบ best-effort หากไม่สามารถ resolve ชื่อห้องไปเป็น ID หรือ alias ได้ ชื่อนั้นจะถูกเพิกเฉยโดยการ resolve allowlist ในรันไทม์

## ข้อมูลอ้างอิงการกำหนดค่า

- `enabled`: เปิดหรือปิด channel
- `name`: ป้ายชื่อสำหรับบัญชี (ไม่บังคับ)
- `defaultAccount`: account ID ที่ต้องการให้ใช้เป็นหลักเมื่อมีการกำหนดค่าหลายบัญชี Matrix
- `homeserver`: URL ของ homeserver เช่น `https://matrix.example.org`
- `network.dangerouslyAllowPrivateNetwork`: อนุญาตให้บัญชี Matrix นี้เชื่อมต่อกับ homeservers แบบ private/internal เปิดใช้งานค่านี้เมื่อ homeserver resolve ไปยัง `localhost`, IP แบบ LAN/Tailscale หรือโฮสต์ภายใน เช่น `matrix-synapse`
- `proxy`: URL ของ HTTP(S) proxy สำหรับทราฟฟิก Matrix (ไม่บังคับ) บัญชีที่ตั้งชื่อไว้สามารถ override ค่าเริ่มต้นระดับบนสุดด้วย `proxy` ของตนเองได้
- `userId`: Matrix user ID แบบเต็ม เช่น `@bot:example.org`
- `accessToken`: access token สำหรับการยืนยันตัวตนแบบ token รองรับทั้งค่า plaintext และค่า SecretRef สำหรับ `channels.matrix.accessToken` และ `channels.matrix.accounts.<id>.accessToken` ผ่าน providers แบบ env/file/exec ดู [Secrets Management](/th/gateway/secrets)
- `password`: password สำหรับการเข้าสู่ระบบแบบใช้ password รองรับทั้งค่า plaintext และค่า SecretRef
- `deviceId`: Matrix device ID แบบ explicit
- `deviceName`: ชื่อที่แสดงของอุปกรณ์สำหรับการเข้าสู่ระบบแบบใช้ password
- `avatarUrl`: self-avatar URL ที่จัดเก็บไว้สำหรับการซิงก์โปรไฟล์และการอัปเดต `profile set`
- `initialSyncLimit`: จำนวน events สูงสุดที่ดึงระหว่าง startup sync
- `encryption`: เปิดใช้ E2EE
- `allowlistOnly`: เมื่อเป็น `true` จะอัปเกรดนโยบายห้องแบบ `open` เป็น `allowlist` และบังคับให้นโยบาย DM ที่ใช้งานอยู่ทั้งหมด ยกเว้น `disabled` (รวมถึง `pairing` และ `open`) กลายเป็น `allowlist` ไม่มีผลกับนโยบาย `disabled`
- `allowBots`: อนุญาตข้อความจากบัญชี Matrix ของ OpenClaw อื่นที่กำหนดค่าไว้ (`true` หรือ `"mentions"`)
- `groupPolicy`: `open`, `allowlist` หรือ `disabled`
- `contextVisibility`: โหมดการมองเห็นบริบทห้องเสริม (`all`, `allowlist`, `allowlist_quote`)
- `groupAllowFrom`: allowlist ของ user IDs สำหรับทราฟฟิกในห้อง Matrix user IDs แบบเต็มปลอดภัยที่สุด; exact directory matches จะถูก resolve ตอนเริ่มต้นและเมื่อ allowlist เปลี่ยนระหว่างที่ monitor กำลังทำงาน ชื่อที่ resolve ไม่ได้จะถูกเพิกเฉย
- `historyLimit`: จำนวนสูงสุดของข้อความห้องที่จะรวมเป็นบริบทประวัติกลุ่ม โดยจะ fallback ไปใช้ `messages.groupChat.historyLimit`; หากไม่ได้ตั้งค่าทั้งคู่ ค่าเริ่มต้นที่มีผลจริงคือ `0` ตั้งค่าเป็น `0` เพื่อปิดใช้งาน
- `replyToMode`: `off`, `first`, `all` หรือ `batched`
- `markdown`: การกำหนดค่าการเรนเดอร์ Markdown สำหรับข้อความ Matrix ขาออก (ไม่บังคับ)
- `streaming`: `off` (ค่าเริ่มต้น), `"partial"`, `"quiet"`, `true` หรือ `false` โดย `"partial"` และ `true` จะเปิดใช้การอัปเดต draft แบบแสดงตัวอย่างก่อนด้วยข้อความ Matrix ปกติ ส่วน `"quiet"` ใช้ preview notices แบบไม่แจ้งเตือนสำหรับการตั้งค่า push-rule แบบ self-hosted และ `false` เทียบเท่ากับ `"off"`
- `blockStreaming`: `true` จะเปิดใช้ข้อความความคืบหน้าแยกสำหรับ assistant blocks ที่เสร็จแล้ว ขณะมีการสตรีม draft preview
- `threadReplies`: `off`, `inbound` หรือ `always`
- `threadBindings`: overrides ราย channel สำหรับการกำหนดเส้นทางและวงจรชีวิตของ session ที่ผูกกับ thread
- `startupVerification`: โหมดคำขอยืนยันตัวตนกับตนเองอัตโนมัติขณะเริ่มต้น (`if-unverified`, `off`)
- `startupVerificationCooldownHours`: ระยะคูลดาวน์ก่อนลองใหม่สำหรับคำขอยืนยันตัวตนอัตโนมัติขณะเริ่มต้น
- `textChunkLimit`: ขนาด chunk ของข้อความขาออกเป็นจำนวนอักขระ (ใช้เมื่อ `chunkMode` เป็น `length`)
- `chunkMode`: `length` แบ่งข้อความตามจำนวนอักขระ; `newline` แบ่งตามขอบเขตบรรทัด
- `responsePrefix`: สตริงที่ไม่บังคับซึ่งจะถูกเติมไว้หน้าคำตอบขาออกทั้งหมดสำหรับ channel นี้
- `ackReaction`: override ของ ack reaction สำหรับ channel/บัญชีนี้ (ไม่บังคับ)
- `ackReactionScope`: override ของขอบเขต ack reaction (ไม่บังคับ) (`group-mentions`, `group-all`, `direct`, `all`, `none`, `off`)
- `reactionNotifications`: โหมดการแจ้งเตือน reaction ขาเข้า (`own`, `off`)
- `mediaMaxMb`: ขีดจำกัดขนาดสื่อเป็น MB สำหรับการส่งขาออกและการประมวลผลสื่อขาเข้า
- `autoJoin`: นโยบายเข้าร่วมอัตโนมัติเมื่อถูกเชิญ (`always`, `allowlist`, `off`) ค่าเริ่มต้น: `off` ใช้กับคำเชิญ Matrix ทุกประเภท รวมถึงคำเชิญแบบ DM
- `autoJoinAllowlist`: ห้อง/aliases ที่อนุญาตเมื่อ `autoJoin` เป็น `allowlist` โดย alias entries จะถูก resolve เป็น room IDs ระหว่างจัดการคำเชิญ OpenClaw จะไม่เชื่อถือสถานะ alias ที่ห้องที่ถูกเชิญอ้างมา
- `dm`: บล็อกนโยบาย DM (`enabled`, `policy`, `allowFrom`, `sessionScope`, `threadReplies`)
- `dm.policy`: ควบคุมการเข้าถึง DM หลังจาก OpenClaw เข้าร่วมห้องแล้วและจัดประเภทห้องว่าเป็น DM แล้ว ไม่ได้เปลี่ยนว่าคำเชิญจะถูกเข้าร่วมอัตโนมัติหรือไม่
- `dm.allowFrom`: allowlist ของ user IDs สำหรับทราฟฟิก DM Matrix user IDs แบบเต็มปลอดภัยที่สุด; exact directory matches จะถูก resolve ตอนเริ่มต้นและเมื่อ allowlist เปลี่ยนระหว่างที่ monitor กำลังทำงาน ชื่อที่ resolve ไม่ได้จะถูกเพิกเฉย
- `dm.sessionScope`: `per-user` (ค่าเริ่มต้น) หรือ `per-room` ใช้ `per-room` เมื่อคุณต้องการให้แต่ละห้อง Matrix DM แยกบริบทออกจากกัน แม้ peer จะเป็นคนเดียวกันก็ตาม
- `dm.threadReplies`: override นโยบาย thread สำหรับ DM เท่านั้น (`off`, `inbound`, `always`) โดยจะแทนที่การตั้งค่า `threadReplies` ระดับบนสุดทั้งสำหรับตำแหน่งการตอบกลับและการแยก session ใน DM
- `execApprovals`: การส่ง exec approval แบบ native ของ Matrix (`enabled`, `approvers`, `target`, `agentFilter`, `sessionFilter`)
- `execApprovals.approvers`: Matrix user IDs ที่ได้รับอนุญาตให้อนุมัติคำขอ exec เป็นค่าไม่บังคับเมื่อ `dm.allowFrom` ระบุผู้อนุมัติไว้แล้ว
- `execApprovals.target`: `dm | channel | both` (ค่าเริ่มต้น: `dm`)
- `accounts`: overrides รายบัญชีแบบตั้งชื่อ ค่า `channels.matrix` ระดับบนสุดจะทำหน้าที่เป็นค่าเริ่มต้นสำหรับ entries เหล่านี้
- `groups`: แผนที่นโยบายรายห้อง ควรใช้ room IDs หรือ aliases; ชื่อห้องที่ resolve ไม่ได้จะถูกเพิกเฉยขณะรันไทม์ โดย session/group identity จะใช้ room ID ที่เสถียรหลังการ resolve
- `groups.<room>.account`: จำกัด room entry ที่สืบทอดมาเพียงรายการเดียวให้ใช้กับบัญชี Matrix เฉพาะในการตั้งค่าแบบหลายบัญชี
- `groups.<room>.allowBots`: override ระดับห้องสำหรับผู้ส่งที่เป็นบอตที่กำหนดค่าไว้ (`true` หรือ `"mentions"`)
- `groups.<room>.users`: allowlist ของผู้ส่งรายห้อง
- `groups.<room>.tools`: overrides การอนุญาต/ปฏิเสธ tools รายห้อง
- `groups.<room>.autoReply`: override ระดับห้องสำหรับ mention-gating โดย `true` จะปิดข้อกำหนดการ mention สำหรับห้องนั้น และ `false` จะบังคับให้เปิดกลับ
- `groups.<room>.skills`: ตัวกรอง Skills ระดับห้อง (ไม่บังคับ)
- `groups.<room>.systemPrompt`: ส่วนเสริม system prompt ระดับห้อง (ไม่บังคับ)
- `rooms`: alias แบบเดิมของ `groups`
- `actions`: การควบคุมการใช้เครื่องมือราย action (`messages`, `reactions`, `pins`, `profile`, `memberInfo`, `channelInfo`, `verification`)

## ที่เกี่ยวข้อง

- [ภาพรวม Channels](/th/channels) — channels ที่รองรับทั้งหมด
- [Pairing](/th/channels/pairing) — การยืนยันตัวตน DM และโฟลว์ pairing
- [Groups](/th/channels/groups) — พฤติกรรมแชตกลุ่มและ mention gating
- [Channel Routing](/th/channels/channel-routing) — การกำหนดเส้นทาง session สำหรับข้อความ
- [Security](/th/gateway/security) — โมเดลการเข้าถึงและการทำให้ปลอดภัยเพิ่มเติม
