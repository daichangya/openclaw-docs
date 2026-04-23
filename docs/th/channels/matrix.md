---
read_when:
    - การตั้งค่า Matrix ใน OpenClaw
    - การกำหนดค่า E2EE และการยืนยันตัวตนของ Matrix
summary: สถานะการรองรับ การตั้งค่า และตัวอย่างการกำหนดค่าของ Matrix
title: Matrix
x-i18n:
    generated_at: "2026-04-23T05:26:17Z"
    model: gpt-5.4
    provider: openai
    source_hash: 5e78d85096ea84361951935a0daf34966c575d822f8581277eb384276c7c706a
    source_path: channels/matrix.md
    workflow: 15
---

# Matrix

Matrix เป็น bundled channel plugin สำหรับ OpenClaw
โดยใช้ `matrix-js-sdk` อย่างเป็นทางการ และรองรับ DM, ห้อง, thread, สื่อ, reactions, โพล, ตำแหน่งที่ตั้ง และ E2EE

## Bundled plugin

Matrix มาพร้อมเป็น bundled plugin ใน OpenClaw รุ่นปัจจุบัน ดังนั้น
build แบบแพ็กเกจปกติไม่ต้องติดตั้งแยก

หากคุณใช้ build รุ่นเก่าหรือการติดตั้งแบบกำหนดเองที่ไม่รวม Matrix ให้ติดตั้ง
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
   - OpenClaw รุ่นแพ็กเกจปัจจุบันจะรวมมาให้แล้ว
   - การติดตั้งแบบเก่าหรือแบบกำหนดเองสามารถเพิ่มได้ด้วยคำสั่งด้านบน
2. สร้างบัญชี Matrix บน homeserver ของคุณ
3. กำหนดค่า `channels.matrix` ด้วยอย่างใดอย่างหนึ่งต่อไปนี้:
   - `homeserver` + `accessToken` หรือ
   - `homeserver` + `userId` + `password`
4. รีสตาร์ต gateway
5. เริ่ม DM กับบอทหรือเชิญบอทเข้าห้อง
   - คำเชิญ Matrix ใหม่จะใช้งานได้ก็ต่อเมื่อ `channels.matrix.autoJoin` อนุญาตไว้

เส้นทางการตั้งค่าแบบโต้ตอบ:

```bash
openclaw channels add
openclaw configure --section channels
```

วิซาร์ด Matrix จะถามข้อมูลดังนี้:

- URL ของ homeserver
- วิธี auth: access token หรือ password
- user ID (เฉพาะการ auth ด้วย password)
- ชื่ออุปกรณ์ (ไม่บังคับ)
- จะเปิดใช้ E2EE หรือไม่
- จะกำหนดค่าการเข้าถึงห้องและการเข้าร่วมคำเชิญอัตโนมัติหรือไม่

พฤติกรรมสำคัญของวิซาร์ด:

- หากมี env vars สำหรับ auth ของ Matrix อยู่แล้ว และบัญชีนั้นยังไม่ได้บันทึก auth ไว้ใน config วิซาร์ดจะเสนอทางลัดแบบ env เพื่อเก็บ auth ไว้ใน env vars
- ชื่อบัญชีจะถูกทำให้เป็นมาตรฐานเป็น account ID ตัวอย่างเช่น `Ops Bot` จะกลายเป็น `ops-bot`
- รายการ DM allowlist ยอมรับ `@user:server` ได้โดยตรง; display name ใช้ได้เฉพาะเมื่อการค้นหา live directory พบผลลัพธ์ที่ตรงกันแบบพอดีหนึ่งรายการ
- รายการ room allowlist ยอมรับ room ID และ alias ได้โดยตรง ควรใช้ `!room:server` หรือ `#alias:server`; ชื่อที่ยัง resolve ไม่ได้จะถูกละเลยขณะรันจริงโดยกระบวนการ resolve allowlist
- ในโหมด invite auto-join แบบ allowlist ให้ใช้เฉพาะเป้าหมายคำเชิญที่เสถียร: `!roomId:server`, `#alias:server` หรือ `*` ระบบจะปฏิเสธชื่อห้องแบบ plain
- หากต้องการ resolve ชื่อห้องก่อนบันทึก ให้ใช้ `openclaw channels resolve --channel matrix "Project Room"`

<Warning>
`channels.matrix.autoJoin` มีค่าเริ่มต้นเป็น `off`

หากคุณปล่อยไว้โดยไม่ตั้งค่า บอทจะไม่เข้าห้องที่ได้รับเชิญหรือคำเชิญแบบ DM ใหม่ ดังนั้นบอทจะไม่ปรากฏในกลุ่มใหม่หรือ DM ที่ได้รับเชิญ เว้นแต่คุณจะเข้าร่วมด้วยตนเองก่อน

ตั้งค่า `autoJoin: "allowlist"` ร่วมกับ `autoJoinAllowlist` เพื่อจำกัดว่าบอทจะรับคำเชิญใดบ้าง หรือกำหนด `autoJoin: "always"` หากคุณต้องการให้บอทเข้าร่วมทุกคำเชิญ

ในโหมด `allowlist`, `autoJoinAllowlist` รับได้เฉพาะ `!roomId:server`, `#alias:server` หรือ `*`
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

การตั้งค่าแบบใช้ password (จะ cache token หลังจากล็อกอิน):

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

Matrix จะเก็บ credentials ที่ cache แล้วไว้ใน `~/.openclaw/credentials/matrix/`
บัญชีค่าเริ่มต้นใช้ `credentials.json`; บัญชีที่ตั้งชื่อใช้ `credentials-<account>.json`
เมื่อมี cached credentials อยู่ที่นั่น OpenClaw จะถือว่า Matrix ถูกกำหนดค่าแล้วสำหรับการตั้งค่า doctor และการค้นหาสถานะ channel แม้ว่า auth ปัจจุบันจะไม่ได้ตั้งไว้โดยตรงใน config ก็ตาม

ตัวแปรสภาพแวดล้อมที่เทียบเท่ากัน (ใช้เมื่อไม่ได้ตั้งค่า config key):

- `MATRIX_HOMESERVER`
- `MATRIX_ACCESS_TOKEN`
- `MATRIX_USER_ID`
- `MATRIX_PASSWORD`
- `MATRIX_DEVICE_ID`
- `MATRIX_DEVICE_NAME`

สำหรับบัญชีที่ไม่ใช่ค่าเริ่มต้น ให้ใช้ env vars แบบกำหนดขอบเขตตามบัญชี:

- `MATRIX_<ACCOUNT_ID>_HOMESERVER`
- `MATRIX_<ACCOUNT_ID>_ACCESS_TOKEN`
- `MATRIX_<ACCOUNT_ID>_USER_ID`
- `MATRIX_<ACCOUNT_ID>_PASSWORD`
- `MATRIX_<ACCOUNT_ID>_DEVICE_ID`
- `MATRIX_<ACCOUNT_ID>_DEVICE_NAME`

ตัวอย่างสำหรับบัญชี `ops`:

- `MATRIX_OPS_HOMESERVER`
- `MATRIX_OPS_ACCESS_TOKEN`

สำหรับ account ID ที่ถูกทำให้เป็นมาตรฐานเป็น `ops-bot` ให้ใช้:

- `MATRIX_OPS_X2D_BOT_HOMESERVER`
- `MATRIX_OPS_X2D_BOT_ACCESS_TOKEN`

Matrix จะ escape เครื่องหมายวรรคตอนใน account ID เพื่อป้องกันการชนกันของ env vars แบบกำหนดขอบเขต
ตัวอย่างเช่น `-` จะกลายเป็น `_X2D_` ดังนั้น `ops-prod` จะถูกแมปเป็น `MATRIX_OPS_X2D_PROD_*`

วิซาร์ดแบบโต้ตอบจะเสนอทางลัดแบบ env-var เฉพาะเมื่อมี env vars สำหรับ auth เหล่านั้นอยู่แล้ว และบัญชีที่เลือกยังไม่ได้บันทึก auth ของ Matrix ไว้ใน config

## ตัวอย่างการกำหนดค่า

นี่คือตัวอย่าง config พื้นฐานที่ใช้งานได้จริง โดยเปิด DM pairing, room allowlist และ E2EE:

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
จำแนกได้อย่างน่าเชื่อถือว่าห้องที่ได้รับเชิญเป็น DM หรือกลุ่มในเวลาที่เชิญ ดังนั้นคำเชิญทั้งหมดจะผ่าน `autoJoin`
ก่อนเสมอ ส่วน `dm.policy` จะมีผลหลังจากบอทเข้าร่วมห้องแล้วและห้องนั้นถูกจัดประเภทเป็น DM

## ตัวอย่างการสตรีม

การสตรีมคำตอบของ Matrix เป็นการเลือกใช้แบบ opt-in

ตั้งค่า `channels.matrix.streaming` เป็น `"partial"` เมื่อคุณต้องการให้ OpenClaw ส่งคำตอบตัวอย่างแบบสดหนึ่งรายการ
แก้ไขตัวอย่างนั้นในที่เดิมระหว่างที่โมเดลกำลังสร้างข้อความ แล้วจึงปิดท้ายเมื่อ
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
- `streaming: "partial"` จะสร้างข้อความตัวอย่างที่แก้ไขได้หนึ่งรายการสำหรับ assistant block ปัจจุบันโดยใช้ข้อความ Matrix ปกติ วิธีนี้จะคงพฤติกรรมการแจ้งเตือนแบบ preview-first แบบเดิมของ Matrix ไว้ ดังนั้น client มาตรฐานอาจแจ้งเตือนจากข้อความ preview ที่สตรีมครั้งแรกแทน block ที่เสร็จสมบูรณ์แล้ว
- `streaming: "quiet"` จะสร้าง notice ตัวอย่างแบบเงียบที่แก้ไขได้หนึ่งรายการสำหรับ assistant block ปัจจุบัน ใช้ตัวเลือกนี้เฉพาะเมื่อคุณกำหนดค่า recipient push rules สำหรับ finalized preview edits ด้วย
- `blockStreaming: true` จะเปิดข้อความความคืบหน้า Matrix แยกต่างหาก เมื่อเปิด preview streaming อยู่ Matrix จะคง draft สดไว้สำหรับ block ปัจจุบัน และเก็บ block ที่เสร็จสมบูรณ์แล้วเป็นข้อความแยกต่างหาก
- เมื่อเปิด preview streaming และ `blockStreaming` ปิดอยู่ Matrix จะแก้ไข draft สดในที่เดิม และปิดท้าย event เดิมนั้นเมื่อ block หรือเทิร์นเสร็จสิ้น
- หาก preview ไม่สามารถใส่ใน Matrix event เดียวได้อีกต่อไป OpenClaw จะหยุด preview streaming และย้อนกลับไปใช้การส่ง final แบบปกติ
- คำตอบที่มีสื่อยังคงส่งไฟล์แนบตามปกติ หาก preview เก่าที่ค้างอยู่ไม่สามารถนำกลับมาใช้ได้อย่างปลอดภัยอีก Matrix จะ redact มันก่อนส่งคำตอบสื่อสุดท้าย
- การแก้ไข preview มีค่าใช้จ่ายเป็น Matrix API call เพิ่มเติม ปล่อยให้ปิด streaming ไว้หากคุณต้องการพฤติกรรม rate-limit ที่ระมัดระวังที่สุด

`blockStreaming` ไม่ได้เปิด draft previews ด้วยตัวเอง
ให้ใช้ `streaming: "partial"` หรือ `streaming: "quiet"` สำหรับ preview edits; จากนั้นจึงเพิ่ม `blockStreaming: true` เฉพาะเมื่อคุณต้องการให้ assistant blocks ที่เสร็จแล้วคงมองเห็นได้เป็นข้อความความคืบหน้าแยกต่างหากด้วย

หากคุณต้องการการแจ้งเตือน Matrix มาตรฐานโดยไม่ใช้ push rules แบบกำหนดเอง ให้ใช้ `streaming: "partial"` สำหรับพฤติกรรมแบบ preview-first หรือปล่อย `streaming` ปิดไว้สำหรับการส่งเฉพาะข้อความสุดท้าย เมื่อใช้ `streaming: "off"`:

- `blockStreaming: true` จะส่งแต่ละ block ที่เสร็จสมบูรณ์เป็นข้อความ Matrix ปกติที่มีการแจ้งเตือน
- `blockStreaming: false` จะส่งเฉพาะคำตอบสุดท้ายที่เสร็จสมบูรณ์เป็นข้อความ Matrix ปกติที่มีการแจ้งเตือน

### Push rules แบบ self-hosted สำหรับ finalized previews แบบเงียบ

หากคุณรันโครงสร้างพื้นฐาน Matrix ของตัวเอง และต้องการให้ quiet previews แจ้งเตือนเฉพาะเมื่อ block หรือ
คำตอบสุดท้ายเสร็จแล้ว ให้ตั้งค่า `streaming: "quiet"` และเพิ่ม push rule ต่อผู้ใช้สำหรับ finalized preview edits

โดยปกติแล้วนี่เป็นการตั้งค่าฝั่งผู้ใช้ผู้รับ ไม่ใช่การเปลี่ยน config ระดับ homeserver ทั้งระบบ:

แผนที่อย่างย่อก่อนเริ่ม:

- recipient user = บุคคลที่ควรได้รับการแจ้งเตือน
- bot user = บัญชี Matrix ของ OpenClaw ที่ส่งคำตอบ
- ใช้ access token ของ recipient user สำหรับการเรียก API ด้านล่าง
- จับคู่ `sender` ใน push rule กับ MXID แบบเต็มของ bot user

1. กำหนดค่า OpenClaw ให้ใช้ quiet previews:

```json5
{
  channels: {
    matrix: {
      streaming: "quiet",
    },
  },
}
```

2. ตรวจสอบให้แน่ใจว่าบัญชีผู้รับได้รับ Matrix push notifications ปกติอยู่แล้ว push rule สำหรับ quiet preview
   จะทำงานได้ก็ต่อเมื่อผู้ใช้นั้นมี pusher/device ที่ใช้งานได้อยู่แล้ว

3. รับ access token ของ recipient user
   - ใช้ token ของผู้ใช้ที่รับข้อความ ไม่ใช่ token ของบอท
   - การนำ token ของ client session ที่มีอยู่มาใช้ซ้ำมักเป็นวิธีที่ง่ายที่สุด
   - หากคุณต้องการสร้าง token ใหม่ คุณสามารถล็อกอินผ่าน Matrix Client-Server API มาตรฐานได้:

```bash
curl -sS -X POST \
  "https://matrix.example.org/_matrix/client/v3/login" \
  -H "Content-Type: application/json" \
  --data '{
    "type": "m.login.password",
    "identifier": {
      "type": "m.id.user",
      "user": "@alice:example.org"
    },
    "password": "REDACTED"
  }'
```

4. ตรวจสอบว่าบัญชีผู้รับมี pusher อยู่แล้ว:

```bash
curl -sS \
  -H "Authorization: Bearer $USER_ACCESS_TOKEN" \
  "https://matrix.example.org/_matrix/client/v3/pushers"
```

หากคำสั่งนี้ไม่คืนค่า pusher/device ที่ใช้งานอยู่ ให้แก้ไขการแจ้งเตือน Matrix ปกติก่อน แล้วค่อยเพิ่ม
กฎ OpenClaw ด้านล่าง

OpenClaw จะทำเครื่องหมาย finalized text-only preview edits ด้วย:

```json
{
  "com.openclaw.finalized_preview": true
}
```

5. สร้าง override push rule สำหรับแต่ละบัญชีผู้รับที่ควรได้รับการแจ้งเตือนเหล่านี้:

```bash
curl -sS -X PUT \
  "https://matrix.example.org/_matrix/client/v3/pushrules/global/override/openclaw-finalized-preview-botname" \
  -H "Authorization: Bearer $USER_ACCESS_TOKEN" \
  -H "Content-Type: application/json" \
  --data '{
    "conditions": [
      { "kind": "event_match", "key": "type", "pattern": "m.room.message" },
      {
        "kind": "event_property_is",
        "key": "content.m\\.relates_to.rel_type",
        "value": "m.replace"
      },
      {
        "kind": "event_property_is",
        "key": "content.com\\.openclaw\\.finalized_preview",
        "value": true
      },
      { "kind": "event_match", "key": "sender", "pattern": "@bot:example.org" }
    ],
    "actions": [
      "notify",
      { "set_tweak": "sound", "value": "default" },
      { "set_tweak": "highlight", "value": false }
    ]
  }'
```

แทนค่าต่อไปนี้ก่อนรันคำสั่ง:

- `https://matrix.example.org`: URL พื้นฐานของ homeserver ของคุณ
- `$USER_ACCESS_TOKEN`: access token ของผู้ใช้ที่รับข้อความ
- `openclaw-finalized-preview-botname`: rule ID ที่ไม่ซ้ำสำหรับบอทนี้ของผู้ใช้ผู้รับรายนี้
- `@bot:example.org`: MXID ของบอท Matrix ใน OpenClaw ของคุณ ไม่ใช่ MXID ของผู้ใช้ผู้รับ

ข้อสำคัญสำหรับการตั้งค่าหลายบอท:

- Push rules ถูกอิงด้วย `ruleId` การเรียก `PUT` ซ้ำกับ rule ID เดิมจะเป็นการอัปเดตกฎนั้น
- หากผู้ใช้ผู้รับคนเดียวควรได้รับการแจ้งเตือนจากบัญชีบอท Matrix ของ OpenClaw หลายบัญชี ให้สร้างหนึ่งกฎต่อหนึ่งบอท โดยใช้ rule ID ที่ไม่ซ้ำกันสำหรับแต่ละการจับคู่ `sender`
- รูปแบบง่ายๆ คือ `openclaw-finalized-preview-<botname>` เช่น `openclaw-finalized-preview-ops` หรือ `openclaw-finalized-preview-support`

กฎนี้จะถูกประเมินเทียบกับผู้ส่ง event:

- ยืนยันตัวตนด้วย token ของผู้ใช้ผู้รับ
- จับคู่ `sender` กับ MXID ของบอท OpenClaw

6. ตรวจสอบว่ามีกฎอยู่แล้ว:

```bash
curl -sS \
  -H "Authorization: Bearer $USER_ACCESS_TOKEN" \
  "https://matrix.example.org/_matrix/client/v3/pushrules/global/override/openclaw-finalized-preview-botname"
```

7. ทดสอบคำตอบแบบสตรีม ในโหมด quiet ห้องควรแสดง draft preview แบบเงียบ และการแก้ไขในที่เดิมครั้งสุดท้าย
   ควรแจ้งเตือนเมื่อ block หรือเทิร์นเสร็จสิ้น

หากภายหลังคุณต้องการลบกฎ ให้ลบ rule ID เดิมนั้นด้วย token ของผู้ใช้ผู้รับ:

```bash
curl -sS -X DELETE \
  -H "Authorization: Bearer $USER_ACCESS_TOKEN" \
  "https://matrix.example.org/_matrix/client/v3/pushrules/global/override/openclaw-finalized-preview-botname"
```

หมายเหตุ:

- สร้างกฎด้วย access token ของผู้ใช้ผู้รับ ไม่ใช่ของบอท
- กฎ `override` ที่ผู้ใช้กำหนดใหม่จะถูกแทรกไว้ก่อนกฎ suppress เริ่มต้น ดังนั้นไม่จำเป็นต้องมีพารามิเตอร์ลำดับเพิ่มเติม
- สิ่งนี้มีผลเฉพาะกับ preview edits แบบข้อความล้วนที่ OpenClaw สามารถ finalize ในที่เดิมได้อย่างปลอดภัยเท่านั้น fallback สำหรับสื่อและ fallback สำหรับ preview ที่ค้างจะยังใช้การส่งแบบ Matrix ปกติ
- หาก `GET /_matrix/client/v3/pushers` แสดงว่าไม่มี pusher แสดงว่าผู้ใช้ยังไม่มีการส่ง push ของ Matrix ที่ทำงานได้สำหรับบัญชี/อุปกรณ์นี้

#### Synapse

สำหรับ Synapse การตั้งค่าด้านบนมักเพียงพออยู่แล้ว:

- ไม่จำเป็นต้องเปลี่ยน `homeserver.yaml` เป็นพิเศษสำหรับการแจ้งเตือน finalized preview ของ OpenClaw
- หาก deployment ของ Synapse ของคุณส่ง Matrix push notifications ปกติได้อยู่แล้ว การเรียกด้วย user token + `pushrules` ด้านบนคือขั้นตอนหลักในการตั้งค่า
- หากคุณรัน Synapse หลัง reverse proxy หรือ workers ให้ตรวจสอบว่า `/_matrix/client/.../pushrules/` ส่งถึง Synapse ได้อย่างถูกต้อง
- หากคุณใช้ Synapse workers ให้ตรวจสอบว่า pushers ทำงานปกติ การส่ง push จะถูกจัดการโดย process หลัก หรือโดย `synapse.app.pusher` / pusher workers ที่กำหนดค่าไว้

#### Tuwunel

สำหรับ Tuwunel ให้ใช้ขั้นตอนการตั้งค่าเดียวกันและการเรียก API `pushrules` แบบเดียวกับที่แสดงด้านบน:

- ไม่จำเป็นต้องมี config เฉพาะของ Tuwunel สำหรับ finalized preview marker เอง
- หาก Matrix notifications ปกติทำงานได้อยู่แล้วสำหรับผู้ใช้นั้น การเรียกด้วย user token + `pushrules` ด้านบนคือขั้นตอนหลักในการตั้งค่า
- หากการแจ้งเตือนดูเหมือนหายไปขณะที่ผู้ใช้กำลังใช้งานบนอีกอุปกรณ์หนึ่ง ให้ตรวจสอบว่าเปิด `suppress_push_when_active` อยู่หรือไม่ Tuwunel เพิ่มตัวเลือกนี้ใน Tuwunel 1.4.2 เมื่อวันที่ 12 กันยายน 2025 และอาจตั้งใจระงับ push ไปยังอุปกรณ์อื่นขณะที่มีอุปกรณ์หนึ่งกำลังใช้งานอยู่

## ห้องบอทต่อบอท

โดยค่าเริ่มต้น Matrix messages จากบัญชี Matrix ของ OpenClaw อื่นที่กำหนดค่าไว้จะถูกละเลย

ใช้ `allowBots` เมื่อต้องการให้มีการรับส่ง Matrix ระหว่างเอเจนต์โดยเจตนา:

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

- `allowBots: true` ยอมรับข้อความจากบัญชีบอท Matrix อื่นที่กำหนดค่าไว้ในห้องและ DM ที่ได้รับอนุญาต
- `allowBots: "mentions"` ยอมรับข้อความเหล่านั้นเฉพาะเมื่อมีการ mention บอทนี้อย่างชัดเจนในห้อง ส่วน DM ยังคงอนุญาต
- `groups.<room>.allowBots` จะ override การตั้งค่าระดับบัญชีสำหรับห้องเดียว
- OpenClaw ยังคงละเลยข้อความจาก Matrix user ID เดียวกันเพื่อหลีกเลี่ยงลูปตอบตัวเอง
- Matrix ไม่มี bot flag แบบเนทีฟสำหรับกรณีนี้ OpenClaw จะถือว่า "bot-authored" หมายถึง "ส่งโดยบัญชี Matrix อื่นที่กำหนดค่าไว้บน OpenClaw gateway นี้"

ใช้ room allowlist ที่เข้มงวดและข้อกำหนดเรื่อง mention เมื่อเปิดใช้งานการรับส่งแบบบอทต่อบอทในห้องที่ใช้ร่วมกัน

## การเข้ารหัสและการยืนยันตัวตน

ในห้องที่เข้ารหัส (E2EE) event รูปภาพขาออกจะใช้ `thumbnail_file` เพื่อให้ภาพตัวอย่างถูกเข้ารหัสไปพร้อมกับไฟล์แนบเต็ม ห้องที่ไม่เข้ารหัสจะยังใช้ `thumbnail_url` แบบปกติ ไม่ต้องกำหนดค่าเพิ่ม — Plugin จะตรวจจับสถานะ E2EE โดยอัตโนมัติ

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

ตรวจสอบสถานะการยืนยันตัวตน:

```bash
openclaw matrix verify status
```

สถานะแบบละเอียด (การวินิจฉัยแบบเต็ม):

```bash
openclaw matrix verify status --verbose
```

รวม recovery key ที่จัดเก็บไว้ในผลลัพธ์แบบ machine-readable:

```bash
openclaw matrix verify status --include-recovery-key --json
```

ตั้งค่าเริ่มต้น cross-signing และสถานะการยืนยันตัวตน:

```bash
openclaw matrix verify bootstrap
```

การวินิจฉัย bootstrap แบบละเอียด:

```bash
openclaw matrix verify bootstrap --verbose
```

บังคับรีเซ็ต cross-signing identity ใหม่ก่อนเริ่ม bootstrap:

```bash
openclaw matrix verify bootstrap --force-reset-cross-signing
```

ยืนยันอุปกรณ์นี้ด้วย recovery key:

```bash
openclaw matrix verify device "<your-recovery-key>"
```

รายละเอียดการยืนยันอุปกรณ์แบบละเอียด:

```bash
openclaw matrix verify device "<your-recovery-key>" --verbose
```

ตรวจสอบสุขภาพของ room-key backup:

```bash
openclaw matrix verify backup status
```

การวินิจฉัยสุขภาพ backup แบบละเอียด:

```bash
openclaw matrix verify backup status --verbose
```

กู้คืน room keys จาก server backup:

```bash
openclaw matrix verify backup restore
```

การวินิจฉัยการกู้คืนแบบละเอียด:

```bash
openclaw matrix verify backup restore --verbose
```

ลบ server backup ปัจจุบันและสร้าง backup baseline ใหม่ หากไม่สามารถโหลด
backup key ที่จัดเก็บไว้ได้อย่างสะอาด การรีเซ็ตนี้ยังสามารถสร้าง secret storage ใหม่เพื่อให้
การเริ่มเย็นครั้งถัดไปสามารถโหลด backup key ใหม่ได้:

```bash
openclaw matrix verify backup reset --yes
```

คำสั่ง `verify` ทั้งหมดจะแสดงผลแบบกระชับโดยค่าเริ่มต้น (รวมถึงการบันทึกภายใน SDK แบบเงียบ) และจะแสดงการวินิจฉัยแบบละเอียดเฉพาะเมื่อใช้ `--verbose`
ใช้ `--json` สำหรับผลลัพธ์แบบ machine-readable เต็มรูปแบบเมื่อเขียนสคริปต์

ในการตั้งค่าแบบหลายบัญชี คำสั่ง Matrix CLI จะใช้บัญชี Matrix ค่าเริ่มต้นโดยปริยาย เว้นแต่คุณจะส่ง `--account <id>`
หากคุณกำหนดค่าหลายบัญชีแบบตั้งชื่อ ให้ตั้ง `channels.matrix.defaultAccount` ก่อน ไม่เช่นนั้นการทำงาน CLI แบบปริยายเหล่านั้นจะหยุดและขอให้คุณเลือกบัญชีอย่างชัดเจน
ใช้ `--account` ทุกครั้งที่คุณต้องการให้การยืนยันตัวตนหรือการทำงานกับอุปกรณ์มุ่งไปยังบัญชีที่ตั้งชื่ออย่างชัดเจน:

```bash
openclaw matrix verify status --account assistant
openclaw matrix verify backup restore --account assistant
openclaw matrix devices list --account assistant
```

เมื่อปิดการเข้ารหัสหรือไม่สามารถใช้ได้สำหรับบัญชีที่ตั้งชื่อ คำเตือนและข้อผิดพลาดการยืนยันตัวตนของ Matrix จะชี้ไปที่ config key ของบัญชีนั้น เช่น `channels.matrix.accounts.assistant.encryption`

### ความหมายของ "verified"

OpenClaw จะถือว่าอุปกรณ์ Matrix นี้ได้รับการยืนยันแล้วก็ต่อเมื่อมันได้รับการยืนยันโดย cross-signing identity ของคุณเอง
ในทางปฏิบัติ `openclaw matrix verify status --verbose` จะแสดง trust signals สามรายการ:

- `Locally trusted`: อุปกรณ์นี้เชื่อถือโดย client ปัจจุบันเท่านั้น
- `Cross-signing verified`: SDK รายงานว่าอุปกรณ์นี้ได้รับการยืนยันผ่าน cross-signing
- `Signed by owner`: อุปกรณ์นี้ถูกลงนามโดย self-signing key ของคุณเอง

`Verified by owner` จะกลายเป็น `yes` ก็ต่อเมื่อมีการยืนยันด้วย cross-signing หรือมีการลงนามโดยเจ้าของ
local trust เพียงอย่างเดียวไม่เพียงพอให้ OpenClaw ถือว่าอุปกรณ์นี้ได้รับการยืนยันอย่างสมบูรณ์

### สิ่งที่ bootstrap ทำ

`openclaw matrix verify bootstrap` คือคำสั่งสำหรับซ่อมแซมและตั้งค่าบัญชี Matrix ที่เข้ารหัส
โดยจะทำสิ่งต่อไปนี้ทั้งหมดตามลำดับ:

- เริ่มต้น secret storage โดยนำ recovery key เดิมกลับมาใช้เมื่อเป็นไปได้
- เริ่มต้น cross-signing และอัปโหลด public cross-signing keys ที่ขาดหายไป
- พยายามทำเครื่องหมายและ cross-sign อุปกรณ์ปัจจุบัน
- สร้าง server-side room-key backup ใหม่ หากยังไม่มีอยู่

หาก homeserver ต้องใช้ interactive auth เพื่ออัปโหลด cross-signing keys, OpenClaw จะลองอัปโหลดโดยไม่ใช้ auth ก่อน จากนั้นลองด้วย `m.login.dummy` แล้วจึงลองด้วย `m.login.password` เมื่อมีการกำหนด `channels.matrix.password`

ใช้ `--force-reset-cross-signing` เฉพาะเมื่อคุณตั้งใจจะทิ้ง cross-signing identity ปัจจุบันและสร้างใหม่เท่านั้น

หากคุณตั้งใจจะทิ้ง room-key backup ปัจจุบันและเริ่ม
backup baseline ใหม่สำหรับข้อความในอนาคต ให้ใช้ `openclaw matrix verify backup reset --yes`
ทำเช่นนี้เฉพาะเมื่อคุณยอมรับว่าประวัติที่เข้ารหัสเก่าซึ่งกู้คืนไม่ได้จะยังคง
ไม่สามารถใช้งานได้ และ OpenClaw อาจสร้าง secret storage ใหม่หากไม่สามารถโหลด
backup secret ปัจจุบันได้อย่างปลอดภัย

### Fresh backup baseline

หากคุณต้องการให้ข้อความเข้ารหัสในอนาคตยังทำงานได้และยอมรับการสูญเสียประวัติเก่าที่กู้คืนไม่ได้ ให้รันคำสั่งเหล่านี้ตามลำดับ:

```bash
openclaw matrix verify backup reset --yes
openclaw matrix verify backup status --verbose
openclaw matrix verify status
```

เพิ่ม `--account <id>` ในแต่ละคำสั่งเมื่อคุณต้องการเจาะจงบัญชี Matrix แบบตั้งชื่อ

### พฤติกรรมเมื่อเริ่มต้นระบบ

เมื่อ `encryption: true`, Matrix จะตั้งค่าเริ่มต้น `startupVerification` เป็น `"if-unverified"`
เมื่อเริ่มต้น หากอุปกรณ์นี้ยังไม่ผ่านการยืนยัน Matrix จะขอ self-verification ใน Matrix client อื่น
ข้ามคำขอซ้ำเมื่อมีคำขอหนึ่งค้างอยู่แล้ว และใช้ cooldown ภายในเครื่องก่อนลองใหม่หลังการรีสตาร์ต
ความพยายามที่ล้มเหลวจะลองใหม่เร็วกว่ากรณีสร้างคำขอสำเร็จโดยค่าเริ่มต้น
ตั้งค่า `startupVerification: "off"` เพื่อปิดคำขออัตโนมัติเมื่อเริ่มต้น หรือปรับ `startupVerificationCooldownHours`
หากคุณต้องการช่วงเวลาลองใหม่ที่สั้นหรือยาวขึ้น

การเริ่มต้นระบบยังทำ crypto bootstrap pass แบบระมัดระวังโดยอัตโนมัติด้วย
ขั้นตอนนั้นจะพยายามนำ secret storage และ cross-signing identity ปัจจุบันกลับมาใช้ก่อน และหลีกเลี่ยงการรีเซ็ต cross-signing เว้นแต่คุณจะรันขั้นตอนซ่อม bootstrap อย่างชัดเจน

หากตอนเริ่มต้นระบบยังพบสถานะ bootstrap ที่เสียหาย OpenClaw อาจลองใช้เส้นทางซ่อมแซมแบบมีการป้องกันแม้ไม่ได้กำหนด `channels.matrix.password`
หาก homeserver ต้องใช้ UIA แบบอิงรหัสผ่านสำหรับการซ่อมนั้น OpenClaw จะบันทึกคำเตือนและคงการเริ่มต้นระบบไว้แบบไม่ fatal แทนที่จะยกเลิกบอท
หากอุปกรณ์ปัจจุบันถูกลงนามโดยเจ้าของอยู่แล้ว OpenClaw จะรักษา identity นั้นไว้แทนการรีเซ็ตโดยอัตโนมัติ

ดู [Matrix migration](/th/install/migrating-matrix) สำหรับขั้นตอนอัปเกรดแบบเต็ม ข้อจำกัด คำสั่งกู้คืน และข้อความการย้ายที่พบบ่อย

### ข้อความแจ้งการยืนยันตัวตน

Matrix จะโพสต์ข้อความแจ้งวงจรชีวิตของการยืนยันตัวตนลงในห้อง DM สำหรับการยืนยันแบบเข้มงวดโดยตรง เป็นข้อความ `m.notice`
ซึ่งรวมถึง:

- ข้อความแจ้งคำขอการยืนยันตัวตน
- ข้อความแจ้งว่าพร้อมยืนยันตัวตนแล้ว (พร้อมคำแนะนำชัดเจนว่า "ยืนยันด้วยอีโมจิ")
- ข้อความแจ้งเริ่มต้นและเสร็จสิ้นการยืนยันตัวตน
- รายละเอียด SAS (อีโมจิและเลขฐานสิบ) เมื่อมี

คำขอการยืนยันตัวตนขาเข้าจาก Matrix client อื่นจะถูกติดตามและ auto-accept โดย OpenClaw
สำหรับโฟลว์ self-verification, OpenClaw จะเริ่ม SAS flow โดยอัตโนมัติด้วยเมื่อการยืนยันด้วยอีโมจิพร้อมใช้งาน และยืนยันฝั่งของตัวเอง
สำหรับคำขอการยืนยันตัวตนจากผู้ใช้/อุปกรณ์ Matrix อื่น OpenClaw จะ auto-accept คำขอ จากนั้นรอให้ SAS flow ดำเนินไปตามปกติ
คุณยังคงต้องเปรียบเทียบอีโมจิหรือ SAS แบบตัวเลขใน Matrix client ของคุณ และยืนยันว่า "They match" ที่นั่นเพื่อทำให้การยืนยันเสร็จสมบูรณ์

OpenClaw จะไม่ auto-accept self-initiated duplicate flows แบบไม่ตรวจสอบ เมื่อเริ่มต้นระบบจะข้ามการสร้างคำขอใหม่หากมีคำขอ self-verification ค้างอยู่แล้ว

ข้อความแจ้งของระบบ/โปรโตคอลการยืนยันตัวตนจะไม่ถูกส่งต่อไปยังไปป์ไลน์แชตของเอเจนต์ ดังนั้นจึงไม่ก่อให้เกิด `NO_REPLY`

### สุขอนามัยของอุปกรณ์

อุปกรณ์ Matrix ที่ OpenClaw จัดการรุ่นเก่าอาจสะสมอยู่ในบัญชีและทำให้การพิจารณาความเชื่อถือในห้องที่เข้ารหัสทำได้ยากขึ้น
แสดงรายการได้ด้วย:

```bash
openclaw matrix devices list
```

ลบอุปกรณ์เก่าที่ OpenClaw จัดการด้วย:

```bash
openclaw matrix devices prune-stale
```

### ที่เก็บข้อมูล crypto

Matrix E2EE ใช้เส้นทาง Rust crypto ของ `matrix-js-sdk` อย่างเป็นทางการใน Node โดยใช้ `fake-indexeddb` เป็น IndexedDB shim สถานะ crypto จะถูกเก็บถาวรไว้ในไฟล์ snapshot (`crypto-idb-snapshot.json`) และกู้คืนเมื่อเริ่มต้นระบบ ไฟล์ snapshot นี้เป็นสถานะรันไทม์ที่ละเอียดอ่อนและจัดเก็บด้วยสิทธิ์ไฟล์แบบจำกัด

สถานะรันไทม์ที่เข้ารหัสจะอยู่ภายใต้รูทแบบต่อบัญชี ต่อผู้ใช้ และต่อ token-hash ใน
`~/.openclaw/matrix/accounts/<account>/<homeserver>__<user>/<token-hash>/`
ไดเรกทอรีนั้นประกอบด้วย sync store (`bot-storage.json`), crypto store (`crypto/`),
ไฟล์ recovery key (`recovery-key.json`), IndexedDB snapshot (`crypto-idb-snapshot.json`),
thread bindings (`thread-bindings.json`) และสถานะ startup verification (`startup-verification.json`)
เมื่อ token เปลี่ยนแต่ identity ของบัญชียังคงเดิม OpenClaw จะนำรูทที่ดีที่สุดที่มีอยู่สำหรับชุด account/homeserver/user นั้นกลับมาใช้ เพื่อให้สถานะ sync เดิม, สถานะ crypto เดิม, thread bindings,
และสถานะ startup verification ยังคงมองเห็นได้

## การจัดการโปรไฟล์

อัปเดต self-profile ของ Matrix สำหรับบัญชีที่เลือกด้วย:

```bash
openclaw matrix profile set --name "OpenClaw Assistant"
openclaw matrix profile set --avatar-url https://cdn.example.org/avatar.png
```

เพิ่ม `--account <id>` เมื่อต้องการระบุบัญชี Matrix แบบตั้งชื่ออย่างชัดเจน

Matrix รองรับ URL รูปประจำตัวแบบ `mxc://` ได้โดยตรง เมื่อคุณส่ง URL รูปประจำตัวแบบ `http://` หรือ `https://` OpenClaw จะอัปโหลดไปยัง Matrix ก่อน แล้วบันทึก URL `mxc://` ที่ resolve แล้วกลับไปยัง `channels.matrix.avatarUrl` (หรือ override ของบัญชีที่เลือก)

## Threads

Matrix รองรับ Matrix threads แบบเนทีฟทั้งสำหรับการตอบกลับอัตโนมัติและการส่งด้วย message tool

- `dm.sessionScope: "per-user"` (ค่าเริ่มต้น) จะคงการจัดเส้นทาง DM ของ Matrix แบบยึดตามผู้ส่ง ดังนั้นห้อง DM หลายห้องสามารถใช้ session เดียวกันได้เมื่อ resolve ไปยังคู่สนทนาเดียวกัน
- `dm.sessionScope: "per-room"` จะแยกแต่ละห้อง DM ของ Matrix ออกเป็น session key ของตัวเอง ขณะเดียวกันก็ยังใช้การตรวจสอบ auth และ allowlist ของ DM แบบปกติ
- explicit Matrix conversation bindings ยังคงมีลำดับความสำคัญเหนือ `dm.sessionScope` ดังนั้นห้องและ thread ที่ bind ไว้จะคง target session ที่เลือกไว้
- `threadReplies: "off"` จะคงคำตอบไว้ระดับบนสุด และคงข้อความ threaded ขาเข้าไว้ใน parent session
- `threadReplies: "inbound"` จะตอบใน thread ก็ต่อเมื่อข้อความขาเข้านั้นอยู่ใน thread นั้นอยู่แล้ว
- `threadReplies: "always"` จะคงคำตอบของห้องไว้ใน thread ที่ยึดจากข้อความที่เป็นตัวกระตุ้น และจัดเส้นทางการสนทนานั้นผ่าน thread-scoped session ที่ตรงกันตั้งแต่ข้อความกระตุ้นครั้งแรก
- `dm.threadReplies` จะ override การตั้งค่าระดับบนสุดสำหรับ DM เท่านั้น ตัวอย่างเช่น คุณสามารถคง threads ในห้องให้แยกกัน ขณะเดียวกันคง DM ให้เป็นแบบแบนได้
- ข้อความ threaded ขาเข้าจะรวมข้อความรากของ thread เป็นบริบทเพิ่มเติมให้เอเจนต์
- การส่งผ่าน message tool จะสืบทอด Matrix thread ปัจจุบันโดยอัตโนมัติเมื่อ target เป็นห้องเดียวกัน หรือเป็น DM user target เดียวกัน เว้นแต่จะมีการระบุ `threadId` แบบ explicit
- การใช้ซ้ำ DM user-target ของ session เดียวกันจะทำงานก็ต่อเมื่อ metadata ของ session ปัจจุบันพิสูจน์ได้ว่าเป็น DM peer เดียวกันบนบัญชี Matrix เดียวกัน มิฉะนั้น OpenClaw จะย้อนกลับไปใช้การจัดเส้นทางแบบยึดตามผู้ใช้ตามปกติ
- เมื่อ OpenClaw พบว่าห้อง DM ของ Matrix ชนกับห้อง DM อื่นบน shared Matrix DM session เดียวกัน มันจะโพสต์ `m.notice` แบบครั้งเดียวในห้องนั้นพร้อม escape hatch `/focus` เมื่อเปิดใช้ thread bindings และมีคำใบ้ `dm.sessionScope`
- รองรับ runtime thread bindings สำหรับ Matrix `/focus`, `/unfocus`, `/agents`, `/session idle`, `/session max-age` และ `/acp spawn` ที่ bind กับ thread ใช้งานได้ในห้องและ DM ของ Matrix
- `/focus` ระดับบนสุดในห้อง/DM ของ Matrix จะสร้าง Matrix thread ใหม่และ bind เข้ากับ target session เมื่อ `threadBindings.spawnSubagentSessions=true`
- การรัน `/focus` หรือ `/acp spawn --thread here` ภายใน Matrix thread ที่มีอยู่แล้ว จะ bind thread ปัจจุบันนั้นแทน

## ACP conversation bindings

ห้อง, DM และ Matrix threads ที่มีอยู่แล้วสามารถเปลี่ยนให้เป็น ACP workspace แบบถาวรได้ โดยไม่ต้องเปลี่ยนพื้นผิวแชต

โฟลว์แบบรวดเร็วสำหรับผู้ปฏิบัติการ:

- รัน `/acp spawn codex --bind here` ภายใน Matrix DM, ห้อง หรือ thread ที่มีอยู่แล้วที่คุณต้องการใช้งานต่อ
- ใน Matrix DM หรือห้องระดับบนสุด DM/ห้องปัจจุบันจะยังคงเป็นพื้นผิวแชต และข้อความในอนาคตจะถูกจัดเส้นทางไปยัง ACP session ที่ spawn ขึ้น
- ภายใน Matrix thread ที่มีอยู่แล้ว `--bind here` จะ bind thread ปัจจุบันนั้นไว้ในที่เดิม
- `/new` และ `/reset` จะรีเซ็ต ACP session ที่ bind เดิมนั้นในที่เดิม
- `/acp close` จะปิด ACP session และลบ binding

หมายเหตุ:

- `--bind here` จะไม่สร้าง child Matrix thread
- `threadBindings.spawnAcpSessions` จำเป็นเฉพาะสำหรับ `/acp spawn --thread auto|here` ซึ่ง OpenClaw ต้องสร้างหรือ bind child Matrix thread

### การกำหนดค่า thread binding

Matrix รับค่าเริ่มต้นระดับ global จาก `session.threadBindings` และยังรองรับ overrides ระดับช่องทาง:

- `threadBindings.enabled`
- `threadBindings.idleHours`
- `threadBindings.maxAgeHours`
- `threadBindings.spawnSubagentSessions`
- `threadBindings.spawnAcpSessions`

แฟล็กการ spawn แบบ thread-bound ของ Matrix เป็นแบบ opt-in:

- ตั้ง `threadBindings.spawnSubagentSessions: true` เพื่ออนุญาตให้ `/focus` ระดับบนสุดสร้างและ bind Matrix threads ใหม่
- ตั้ง `threadBindings.spawnAcpSessions: true` เพื่ออนุญาตให้ `/acp spawn --thread auto|here` bind ACP sessions เข้ากับ Matrix threads

## Reactions

Matrix รองรับการทำงานของ reactions ขาออก การแจ้งเตือน reactions ขาเข้า และ ack reactions ขาเข้า

- เครื่องมือ reaction ขาออกจะถูกควบคุมด้วย `channels["matrix"].actions.reactions`
- `react` เพิ่ม reaction ให้กับ Matrix event ที่ระบุ
- `reactions` แสดงสรุป reaction ปัจจุบันสำหรับ Matrix event ที่ระบุ
- `emoji=""` จะลบ reactions ของบัญชีบอทเองบน event นั้น
- `remove: true` จะลบเฉพาะ reaction อีโมจิที่ระบุของบัญชีบอท

ขอบเขตของ ack reaction ถูก resolve ตามลำดับมาตรฐานของ OpenClaw:

- `channels["matrix"].accounts.<accountId>.ackReaction`
- `channels["matrix"].ackReaction`
- `messages.ackReaction`
- emoji สำรองจาก identity ของเอเจนต์

ขอบเขตของ ack reaction จะ resolve ตามลำดับนี้:

- `channels["matrix"].accounts.<accountId>.ackReactionScope`
- `channels["matrix"].ackReactionScope`
- `messages.ackReactionScope`

โหมดการแจ้งเตือน reaction จะ resolve ตามลำดับนี้:

- `channels["matrix"].accounts.<accountId>.reactionNotifications`
- `channels["matrix"].reactionNotifications`
- ค่าเริ่มต้น: `own`

พฤติกรรม:

- `reactionNotifications: "own"` จะส่งต่อ event `m.reaction` ที่ถูกเพิ่มเข้ามาเมื่อมันชี้ไปยังข้อความ Matrix ที่บอทเป็นผู้สร้าง
- `reactionNotifications: "off"` จะปิด event ระบบของ reaction
- การลบ reaction จะไม่ถูกสังเคราะห์เป็น event ระบบ เพราะ Matrix แสดงสิ่งเหล่านั้นเป็น redactions ไม่ใช่การลบ `m.reaction` แบบสแตนด์อโลน

## บริบทประวัติ

- `channels.matrix.historyLimit` ควบคุมจำนวนข้อความล่าสุดในห้องที่จะรวมเป็น `InboundHistory` เมื่อข้อความในห้อง Matrix เป็นตัวกระตุ้นเอเจนต์ หากไม่ตั้งค่า จะ fallback ไปที่ `messages.groupChat.historyLimit`; หากไม่ได้ตั้งค่าทั้งคู่ ค่าเริ่มต้นที่มีผลจริงคือ `0` ตั้งเป็น `0` เพื่อปิดใช้งาน
- ประวัติห้องของ Matrix เป็นแบบห้องเท่านั้น DM จะยังคงใช้ประวัติ session ตามปกติ
- ประวัติห้อง Matrix เป็นแบบ pending-only: OpenClaw จะบัฟเฟอร์ข้อความห้องที่ยังไม่ทำให้เกิดการตอบกลับ แล้ว snapshot หน้าต่างนั้นเมื่อมี mention หรือ trigger อื่นเข้ามา
- ข้อความ trigger ปัจจุบันจะไม่ถูกรวมใน `InboundHistory`; มันจะอยู่ในเนื้อหาขาเข้าหลักสำหรับเทิร์นนั้น
- การ retry ของ Matrix event เดิมจะนำ history snapshot เดิมกลับมาใช้แทนที่จะเลื่อนไปตามข้อความห้องใหม่กว่า

## การมองเห็นบริบท

Matrix รองรับการควบคุม `contextVisibility` แบบใช้ร่วมกันสำหรับบริบทห้องเสริม เช่น ข้อความตอบกลับที่ดึงมา, thread roots และ pending history

- `contextVisibility: "all"` เป็นค่าเริ่มต้น บริบทเสริมจะถูกเก็บไว้ตามที่ได้รับ
- `contextVisibility: "allowlist"` จะกรองบริบทเสริมให้เหลือเฉพาะผู้ส่งที่ผ่านการตรวจสอบ allowlist ของห้อง/ผู้ใช้ที่ใช้งานอยู่
- `contextVisibility: "allowlist_quote"` ทำงานเหมือน `allowlist` แต่ยังคงเก็บข้อความตอบกลับที่อ้างอิงโดยชัดเจนไว้หนึ่งรายการ

การตั้งค่านี้มีผลต่อการมองเห็นบริบทเสริม ไม่ใช่ว่าข้อความขาเข้านั้นสามารถ trigger การตอบกลับได้หรือไม่
การอนุญาตการ trigger ยังคงมาจากการตั้งค่า `groupPolicy`, `groups`, `groupAllowFrom` และนโยบาย DM

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

หากผู้ใช้ Matrix ที่ยังไม่ได้รับอนุมัติส่งข้อความหาคุณซ้ำๆ ก่อนการอนุมัติ OpenClaw จะใช้รหัส pairing ที่ค้างอยู่เดิมซ้ำ และอาจส่งข้อความเตือนอีกครั้งหลังช่วง cooldown สั้นๆ แทนการออกโค้ดใหม่

ดู [Pairing](/th/channels/pairing) สำหรับโฟลว์ DM pairing แบบใช้ร่วมกันและโครงสร้างการจัดเก็บ

## การซ่อมแซมห้อง direct

หากสถานะ direct-message ไม่ตรงกัน OpenClaw อาจลงเอยด้วย mapping `m.direct` ที่ล้าสมัยซึ่งชี้ไปยังห้องเดี่ยวเก่าแทน DM ปัจจุบัน ตรวจสอบ mapping ปัจจุบันสำหรับ peer ได้ด้วย:

```bash
openclaw matrix direct inspect --user-id @alice:example.org
```

ซ่อมแซมได้ด้วย:

```bash
openclaw matrix direct repair --user-id @alice:example.org
```

โฟลว์การซ่อมแซม:

- ให้ความสำคัญกับ DM แบบ 1:1 ที่เข้มงวดซึ่งถูกแมปอยู่แล้วใน `m.direct`
- หากไม่พบ จะ fallback ไปยัง DM แบบ 1:1 ที่เข้าร่วมอยู่ในปัจจุบันกับผู้ใช้นั้น
- สร้างห้อง direct ใหม่และเขียน `m.direct` ใหม่หากไม่มี DM ที่สมบูรณ์อยู่

โฟลว์การซ่อมแซมจะไม่ลบห้องเก่าโดยอัตโนมัติ มันเพียงเลือก DM ที่สมบูรณ์และอัปเดต mapping เพื่อให้การส่ง Matrix ใหม่ การแจ้งเตือนการยืนยันตัวตน และโฟลว์ direct-message อื่นๆ มุ่งไปยังห้องที่ถูกต้องอีกครั้ง

## การอนุมัติ exec

Matrix สามารถทำหน้าที่เป็น native approval client สำหรับบัญชี Matrix ได้ โดยปุ่มควบคุมการจัดเส้นทาง DM/channel แบบเนทีฟยังคงอยู่ภายใต้ config ของ exec approval:

- `channels.matrix.execApprovals.enabled`
- `channels.matrix.execApprovals.approvers` (ไม่บังคับ; fallback ไปที่ `channels.matrix.dm.allowFrom`)
- `channels.matrix.execApprovals.target` (`dm` | `channel` | `both`, ค่าเริ่มต้น: `dm`)
- `channels.matrix.execApprovals.agentFilter`
- `channels.matrix.execApprovals.sessionFilter`

ผู้อนุมัติต้องเป็น Matrix user ID เช่น `@owner:example.org` Matrix จะเปิด native approvals โดยอัตโนมัติเมื่อ `enabled` ไม่ได้ตั้งค่าไว้หรือเป็น `"auto"` และสามารถ resolve ผู้อนุมัติได้อย่างน้อยหนึ่งราย Exec approvals จะใช้ชุดผู้อนุมัติจาก `execApprovals.approvers` ก่อน และสามารถ fallback ไปยัง `channels.matrix.dm.allowFrom` ได้ Plugin approvals จะอนุญาตผ่าน `channels.matrix.dm.allowFrom` ตั้ง `enabled: false` เพื่อปิด Matrix ไม่ให้เป็น native approval client อย่างชัดเจน มิฉะนั้นคำขออนุมัติจะ fallback ไปยังเส้นทางอนุมัติอื่นที่กำหนดค่าไว้ หรือนโยบาย approval fallback

การจัดเส้นทางแบบเนทีฟของ Matrix รองรับทั้งการอนุมัติสองประเภท:

- `channels.matrix.execApprovals.*` ควบคุมโหมด fanout แบบเนทีฟของ DM/channel สำหรับพรอมป์ต์การอนุมัติของ Matrix
- Exec approvals ใช้ชุดผู้อนุมัติ exec จาก `execApprovals.approvers` หรือ `channels.matrix.dm.allowFrom`
- Plugin approvals ใช้ Matrix DM allowlist จาก `channels.matrix.dm.allowFrom`
- ทางลัด reaction ของ Matrix และการอัปเดตข้อความใช้ได้ทั้งกับ exec และ plugin approvals

กฎการส่ง:

- `target: "dm"` จะส่งพรอมป์ต์การอนุมัติไปยัง DM ของผู้อนุมัติ
- `target: "channel"` จะส่งพรอมป์ต์กลับไปยังห้องหรือ DM ของ Matrix ต้นทาง
- `target: "both"` จะส่งไปยัง DM ของผู้อนุมัติและห้องหรือ DM ของ Matrix ต้นทาง

พรอมป์ต์การอนุมัติของ Matrix จะตั้งค่า reaction shortcuts บนข้อความอนุมัติหลัก:

- `✅` = อนุญาตครั้งเดียว
- `❌` = ปฏิเสธ
- `♾️` = อนุญาตเสมอ เมื่อการตัดสินใจนั้นได้รับอนุญาตโดยนโยบาย exec ที่มีผลจริง

ผู้อนุมัติสามารถตอบด้วย reaction บนข้อความนั้น หรือใช้ slash commands สำรอง: `/approve <id> allow-once`, `/approve <id> allow-always` หรือ `/approve <id> deny`

เฉพาะผู้อนุมัติที่ resolve ได้เท่านั้นที่สามารถอนุมัติหรือปฏิเสธได้ สำหรับ exec approvals การส่งผ่าน channel จะรวมข้อความคำสั่งด้วย ดังนั้นควรเปิด `channel` หรือ `both` เฉพาะในห้องที่เชื่อถือได้เท่านั้น

การ override ต่อบัญชี:

- `channels.matrix.accounts.<account>.execApprovals`

เอกสารที่เกี่ยวข้อง: [Exec approvals](/th/tools/exec-approvals)

## Slash commands

Matrix slash commands (เช่น `/new`, `/reset`, `/model`) ใช้งานได้โดยตรงใน DM ในห้อง OpenClaw ยังรองรับ slash commands ที่มี Matrix mention ของบอทเองนำหน้าได้ด้วย ดังนั้น `@bot:server /new` จะทริกเกอร์เส้นทางคำสั่งได้โดยไม่ต้องใช้ mention regex แบบกำหนดเอง วิธีนี้ช่วยให้บอทยังคงตอบสนองต่อโพสต์แบบ `@mention /command` ในห้องที่ Element และ client ลักษณะเดียวกันส่งออกมาเมื่อผู้ใช้แท็บเติมชื่อบอทก่อนพิมพ์คำสั่ง

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

ค่า `channels.matrix` ระดับบนสุดจะทำหน้าที่เป็นค่าเริ่มต้นสำหรับบัญชีที่ตั้งชื่อ เว้นแต่บัญชีนั้นจะ override เอง
คุณสามารถกำหนดขอบเขต room entry ที่สืบทอดมาให้ใช้กับบัญชี Matrix เดียวได้ด้วย `groups.<room>.account`
entry ที่ไม่มี `account` จะยังคงใช้ร่วมกันระหว่างทุกบัญชี Matrix และ entry ที่มี `account: "default"` ก็ยังใช้งานได้เมื่อกำหนดค่าบัญชีค่าเริ่มต้นไว้โดยตรงที่ `channels.matrix.*` ระดับบนสุด
ค่าเริ่มต้น auth ที่ใช้ร่วมกันแบบบางส่วนจะไม่สร้างบัญชี `default` โดยปริยายแยกต่างหากขึ้นมาเอง OpenClaw จะสังเคราะห์บัญชี `default` ระดับบนสุดก็ต่อเมื่อค่าเริ่มต้นนั้นมี auth ที่พร้อมใช้งานจริง (`homeserver` ร่วมกับ `accessToken` หรือ `homeserver` ร่วมกับ `userId` และ `password`) บัญชีที่ตั้งชื่อยังคงสามารถถูกค้นพบได้จาก `homeserver` ร่วมกับ `userId` เมื่อ cached credentials มาตอบสนอง auth ในภายหลัง
หาก Matrix มีบัญชีที่ตั้งชื่อไว้เพียงบัญชีเดียวอยู่แล้ว หรือ `defaultAccount` ชี้ไปยังคีย์บัญชีที่ตั้งชื่อซึ่งมีอยู่ กระบวนการซ่อมแซม/ตั้งค่าจากบัญชีเดียวไปหลายบัญชีจะคงบัญชีนั้นไว้แทนการสร้าง entry `accounts.default` ใหม่ มีเพียงคีย์ Matrix auth/bootstrap เท่านั้นที่ถูกย้ายไปยังบัญชีที่ถูกยกระดับนั้น ส่วนคีย์นโยบายการส่งที่ใช้ร่วมกันจะยังอยู่ที่ระดับบนสุด
ตั้ง `defaultAccount` เมื่อต้องการให้ OpenClaw เลือกใช้บัญชี Matrix ที่ตั้งชื่อไว้บัญชีหนึ่งเป็นค่าที่ต้องการสำหรับการจัดเส้นทาง การ probe และการทำงาน CLI แบบปริยาย
หากมีการกำหนดค่าหลายบัญชี Matrix และหนึ่งใน account id คือ `default` OpenClaw จะใช้บัญชีนั้นโดยปริยายแม้ไม่ได้ตั้ง `defaultAccount`
หากคุณกำหนดค่าหลายบัญชีแบบตั้งชื่อ ให้ตั้ง `defaultAccount` หรือส่ง `--account <id>` สำหรับคำสั่ง CLI ที่อาศัยการเลือกบัญชีแบบปริยาย
ส่ง `--account <id>` ให้ `openclaw matrix verify ...` และ `openclaw matrix devices ...` เมื่อต้องการ override การเลือกแบบปริยายดังกล่าวสำหรับคำสั่งใดคำสั่งหนึ่ง

ดู [Configuration reference](/th/gateway/configuration-reference#multi-account-all-channels) สำหรับรูปแบบหลายบัญชีแบบใช้ร่วมกัน

## homeserver แบบส่วนตัว/LAN

โดยค่าเริ่มต้น OpenClaw จะบล็อก Matrix homeserver แบบ private/internal เพื่อป้องกัน SSRF เว้นแต่คุณ
จะเลือกเปิดใช้งานต่อบัญชีอย่างชัดเจน

หาก homeserver ของคุณรันอยู่บน localhost, IP ใน LAN/Tailscale หรือ hostname ภายใน ให้เปิดใช้
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

การเลือกใช้นี้อนุญาตเฉพาะเป้าหมาย private/internal ที่เชื่อถือได้เท่านั้น ส่วน homeserver แบบ public cleartext เช่น
`http://matrix.example.org:8008` จะยังคงถูกบล็อก ควรใช้ `https://` เมื่อเป็นไปได้

## การ proxy การรับส่งข้อมูล Matrix

หากการติดตั้ง Matrix ของคุณต้องใช้ outbound HTTP(S) proxy แบบ explicit ให้ตั้ง `channels.matrix.proxy`:

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

บัญชีที่ตั้งชื่อสามารถ override ค่าเริ่มต้นระดับบนสุดได้ด้วย `channels.matrix.accounts.<id>.proxy`
OpenClaw จะใช้การตั้งค่า proxy เดียวกันทั้งกับการรับส่งข้อมูล Matrix ระหว่างรันจริงและการ probe สถานะบัญชี

## การ resolve เป้าหมาย

Matrix ยอมรับรูปแบบเป้าหมายเหล่านี้ทุกที่ที่ OpenClaw ขอให้คุณระบุห้องหรือผู้ใช้เป้าหมาย:

- ผู้ใช้: `@user:server`, `user:@user:server` หรือ `matrix:user:@user:server`
- ห้อง: `!room:server`, `room:!room:server` หรือ `matrix:room:!room:server`
- alias: `#alias:server`, `channel:#alias:server` หรือ `matrix:channel:#alias:server`

การค้นหา live directory จะใช้บัญชี Matrix ที่ล็อกอินอยู่:

- การค้นหาผู้ใช้จะ query Matrix user directory บน homeserver นั้น
- การค้นหาห้องยอมรับ room ID และ alias แบบ explicit ได้โดยตรง จากนั้นจึง fallback ไปค้นหาชื่อห้องที่เข้าร่วมอยู่สำหรับบัญชีนั้น
- การค้นหาชื่อห้องที่เข้าร่วมเป็นแบบ best-effort หากไม่สามารถ resolve ชื่อห้องเป็น ID หรือ alias ได้ ชื่อนั้นจะถูกละเลยโดยกระบวนการ resolve allowlist ระหว่างรันจริง

## เอกสารอ้างอิงการกำหนดค่า

- `enabled`: เปิดหรือปิด channel
- `name`: ป้ายชื่อเพิ่มเติมสำหรับบัญชี
- `defaultAccount`: account ID ที่ต้องการใช้เมื่อมีการกำหนดค่าหลายบัญชี Matrix
- `homeserver`: URL ของ homeserver เช่น `https://matrix.example.org`
- `network.dangerouslyAllowPrivateNetwork`: อนุญาตให้บัญชี Matrix นี้เชื่อมต่อกับ homeserver แบบ private/internal เปิดใช้งานเมื่อตัว homeserver resolve ไปยัง `localhost`, IP ใน LAN/Tailscale หรือโฮสต์ภายใน เช่น `matrix-synapse`
- `proxy`: URL ของ HTTP(S) proxy สำหรับการรับส่งข้อมูล Matrix โดยไม่บังคับ บัญชีที่ตั้งชื่อสามารถ override ค่าเริ่มต้นระดับบนสุดด้วย `proxy` ของตนเอง
- `userId`: Matrix user ID แบบเต็ม เช่น `@bot:example.org`
- `accessToken`: access token สำหรับ auth แบบใช้ token รองรับทั้งค่า plaintext และ SecretRef สำหรับ `channels.matrix.accessToken` และ `channels.matrix.accounts.<id>.accessToken` ข้ามผู้ให้บริการ env/file/exec ดู [Secrets Management](/th/gateway/secrets)
- `password`: รหัสผ่านสำหรับการล็อกอินแบบใช้รหัสผ่าน รองรับทั้งค่า plaintext และ SecretRef
- `deviceId`: Matrix device ID แบบ explicit
- `deviceName`: ชื่ออุปกรณ์ที่ใช้แสดงสำหรับการล็อกอินด้วยรหัสผ่าน
- `avatarUrl`: URL รูปประจำตัวของตนเองที่จัดเก็บไว้สำหรับการซิงก์โปรไฟล์และการอัปเดตด้วย `profile set`
- `initialSyncLimit`: จำนวน event สูงสุดที่ดึงระหว่าง startup sync
- `encryption`: เปิดใช้ E2EE
- `allowlistOnly`: เมื่อเป็น `true` จะยกระดับนโยบายห้องแบบ `open` เป็น `allowlist` และบังคับนโยบาย DM ที่ทำงานอยู่ทั้งหมด ยกเว้น `disabled` (รวมถึง `pairing` และ `open`) ให้เป็น `allowlist` ไม่มีผลกับนโยบาย `disabled`
- `allowBots`: อนุญาตข้อความจากบัญชี Matrix ของ OpenClaw อื่นที่กำหนดค่าไว้ (`true` หรือ `"mentions"`)
- `groupPolicy`: `open`, `allowlist` หรือ `disabled`
- `contextVisibility`: โหมดการมองเห็นบริบทห้องเสริม (`all`, `allowlist`, `allowlist_quote`)
- `groupAllowFrom`: allowlist ของ user ID สำหรับการรับส่งข้อมูลในห้อง Matrix user ID แบบเต็มปลอดภัยที่สุด; รายการที่ตรงกับ directory แบบ exact จะถูก resolve ตอนเริ่มต้นและเมื่อ allowlist เปลี่ยนระหว่างที่ monitor กำลังทำงาน รายการที่ resolve ไม่ได้จะถูกละเลย
- `historyLimit`: จำนวนข้อความห้องสูงสุดที่จะรวมเป็นบริบทประวัติกลุ่ม หากไม่ตั้งค่า จะ fallback ไปที่ `messages.groupChat.historyLimit`; หากไม่ได้ตั้งค่าทั้งคู่ ค่าเริ่มต้นที่มีผลจริงคือ `0` ตั้งเป็น `0` เพื่อปิดใช้งาน
- `replyToMode`: `off`, `first`, `all` หรือ `batched`
- `markdown`: การกำหนดค่าการเรนเดอร์ Markdown สำหรับข้อความ Matrix ขาออกโดยไม่บังคับ
- `streaming`: `off` (ค่าเริ่มต้น), `"partial"`, `"quiet"`, `true` หรือ `false` ค่า `"partial"` และ `true` เปิดการอัปเดต draft แบบ preview-first ด้วยข้อความ Matrix ปกติ ส่วน `"quiet"` ใช้ preview notice แบบไม่แจ้งเตือนสำหรับการตั้งค่า push-rule แบบ self-hosted ค่า `false` เทียบเท่ากับ `"off"`
- `blockStreaming`: `true` เปิดข้อความความคืบหน้าแยกต่างหากสำหรับ assistant blocks ที่เสร็จสมบูรณ์ในขณะที่ draft preview streaming กำลังทำงาน
- `threadReplies`: `off`, `inbound` หรือ `always`
- `threadBindings`: overrides ระดับช่องทางสำหรับการจัดเส้นทางและวงจรชีวิตของ session ที่ bind กับ thread
- `startupVerification`: โหมดคำขอ self-verification อัตโนมัติเมื่อเริ่มต้น (`if-unverified`, `off`)
- `startupVerificationCooldownHours`: ช่วง cooldown ก่อนลองคำขอ startup verification อัตโนมัติใหม่
- `textChunkLimit`: ขนาดชิ้นข้อความขาออกเป็นจำนวนอักขระ (ใช้เมื่อ `chunkMode` เป็น `length`)
- `chunkMode`: `length` แยกข้อความตามจำนวนอักขระ; `newline` แยกตามขอบเขตบรรทัด
- `responsePrefix`: สตริงเพิ่มเติมโดยไม่บังคับที่จะเติมหน้าคำตอบขาออกทั้งหมดสำหรับ channel นี้
- `ackReaction`: การ override ack reaction สำหรับ channel/บัญชีนี้โดยไม่บังคับ
- `ackReactionScope`: การ override ขอบเขตของ ack reaction โดยไม่บังคับ (`group-mentions`, `group-all`, `direct`, `all`, `none`, `off`)
- `reactionNotifications`: โหมดการแจ้งเตือน reaction ขาเข้า (`own`, `off`)
- `mediaMaxMb`: ขีดจำกัดขนาดสื่อเป็น MB สำหรับการส่งขาออกและการประมวลผลสื่อขาเข้า
- `autoJoin`: นโยบายเข้าร่วมคำเชิญอัตโนมัติ (`always`, `allowlist`, `off`) ค่าเริ่มต้น: `off` มีผลกับคำเชิญ Matrix ทุกประเภท รวมถึงคำเชิญแบบ DM
- `autoJoinAllowlist`: ห้อง/alias ที่อนุญาตเมื่อ `autoJoin` เป็น `allowlist` รายการ alias จะถูก resolve เป็น room ID ระหว่างการจัดการคำเชิญ OpenClaw จะไม่เชื่อถือสถานะ alias ที่ห้องที่เชิญอ้างสิทธิ์มา
- `dm`: บล็อกนโยบาย DM (`enabled`, `policy`, `allowFrom`, `sessionScope`, `threadReplies`)
- `dm.policy`: ควบคุมการเข้าถึง DM หลังจาก OpenClaw เข้าร่วมห้องและจัดประเภทห้องนั้นเป็น DM แล้ว ไม่ได้เปลี่ยนว่าคำเชิญจะถูกเข้าร่วมอัตโนมัติหรือไม่
- `dm.allowFrom`: allowlist ของ user ID สำหรับการรับส่งข้อมูล DM Matrix user ID แบบเต็มปลอดภัยที่สุด; รายการที่ตรงกับ directory แบบ exact จะถูก resolve ตอนเริ่มต้นและเมื่อ allowlist เปลี่ยนระหว่างที่ monitor กำลังทำงาน รายการที่ resolve ไม่ได้จะถูกละเลย
- `dm.sessionScope`: `per-user` (ค่าเริ่มต้น) หรือ `per-room` ใช้ `per-room` เมื่อต้องการให้แต่ละห้อง DM ของ Matrix แยกบริบทกัน แม้คู่สนทนาจะเป็นคนเดียวกัน
- `dm.threadReplies`: การ override นโยบาย thread สำหรับ DM เท่านั้น (`off`, `inbound`, `always`) โดยจะ override การตั้งค่า `threadReplies` ระดับบนสุดทั้งสำหรับตำแหน่งคำตอบและการแยก session ใน DM
- `execApprovals`: การส่ง exec approval แบบเนทีฟของ Matrix (`enabled`, `approvers`, `target`, `agentFilter`, `sessionFilter`)
- `execApprovals.approvers`: Matrix user ID ที่ได้รับอนุญาตให้อนุมัติคำขอ exec ไม่บังคับเมื่อ `dm.allowFrom` ระบุผู้อนุมัติไว้อยู่แล้ว
- `execApprovals.target`: `dm | channel | both` (ค่าเริ่มต้น: `dm`)
- `accounts`: overrides แบบตั้งชื่อรายบัญชี ค่า `channels.matrix` ระดับบนสุดจะทำหน้าที่เป็นค่าเริ่มต้นสำหรับ entries เหล่านี้
- `groups`: แผนที่นโยบายต่อห้อง ควรใช้ room ID หรือ alias; ชื่อห้องที่ resolve ไม่ได้จะถูกละเลยระหว่างรันจริง session/group identity จะใช้ room ID ที่เสถียรหลัง resolve แล้ว
- `groups.<room>.account`: จำกัด room entry ที่สืบทอดมารายการหนึ่งให้ใช้กับบัญชี Matrix เฉพาะในการตั้งค่าแบบหลายบัญชี
- `groups.<room>.allowBots`: override ระดับห้องสำหรับผู้ส่งที่เป็นบอทที่กำหนดค่าไว้ (`true` หรือ `"mentions"`)
- `groups.<room>.users`: allowlist ของผู้ส่งต่อห้อง
- `groups.<room>.tools`: overrides การอนุญาต/ปฏิเสธเครื่องมือต่อห้อง
- `groups.<room>.autoReply`: override การบังคับ mention ระดับห้อง ค่า `true` จะปิดข้อกำหนดเรื่อง mention สำหรับห้องนั้น; ค่า `false` จะบังคับกลับมาเปิดอีกครั้ง
- `groups.<room>.skills`: ตัวกรอง skill ระดับห้องโดยไม่บังคับ
- `groups.<room>.systemPrompt`: ส่วนเสริม system prompt ระดับห้องโดยไม่บังคับ
- `rooms`: alias แบบเดิมของ `groups`
- `actions`: การควบคุมเครื่องมือราย action (`messages`, `reactions`, `pins`, `profile`, `memberInfo`, `channelInfo`, `verification`)

## ที่เกี่ยวข้อง

- [ภาพรวมช่องทาง](/th/channels) — ช่องทางที่รองรับทั้งหมด
- [Pairing](/th/channels/pairing) — การยืนยันตัวตน DM และโฟลว์การจับคู่
- [Groups](/th/channels/groups) — พฤติกรรมแชตกลุ่มและการบังคับ mention
- [Channel Routing](/th/channels/channel-routing) — การจัดเส้นทางเซสชันสำหรับข้อความ
- [Security](/th/gateway/security) — โมเดลการเข้าถึงและการเสริมความปลอดภัย
