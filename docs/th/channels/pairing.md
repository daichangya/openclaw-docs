---
read_when:
    - การตั้งค่าการควบคุมการเข้าถึง DM
    - การจับคู่ Node iOS/Android ใหม่
    - การตรวจสอบสถานะด้านความปลอดภัยของ OpenClaw
summary: 'ภาพรวมการจับคู่: อนุมัติว่าใครสามารถส่ง DM ถึงคุณได้ + อนุมัติว่า Node ใดสามารถเข้าร่วมได้'
title: การจับคู่
x-i18n:
    generated_at: "2026-04-24T08:59:14Z"
    model: gpt-5.4
    provider: openai
    source_hash: 373eaa02865995ada0c906df9bad4e8328f085a8bb3679b0a5820dc397130137
    source_path: channels/pairing.md
    workflow: 15
---

“การจับคู่” คือขั้นตอน **การอนุมัติโดยเจ้าของ** แบบชัดเจนของ OpenClaw
โดยใช้ใน 2 กรณี:

1. **การจับคู่ DM** (ใครได้รับอนุญาตให้คุยกับบอตได้)
2. **การจับคู่ Node** (อุปกรณ์/Node ใดได้รับอนุญาตให้เข้าร่วมเครือข่าย gateway ได้)

บริบทด้านความปลอดภัย: [Security](/th/gateway/security)

## 1) การจับคู่ DM (การเข้าถึงแชตขาเข้า)

เมื่อช่องทางถูกกำหนดด้วยนโยบาย DM เป็น `pairing` ผู้ส่งที่ไม่รู้จักจะได้รับรหัสสั้น ๆ และข้อความของพวกเขา **จะไม่ถูกประมวลผล** จนกว่าคุณจะอนุมัติ

นโยบาย DM ค่าปริยายมีเอกสารอยู่ที่: [Security](/th/gateway/security)

รหัสการจับคู่:

- ยาว 8 อักขระ, เป็นตัวพิมพ์ใหญ่, ไม่มีอักขระที่สับสนได้ง่าย (`0O1I`)
- **หมดอายุหลัง 1 ชั่วโมง** บอตจะส่งข้อความการจับคู่เฉพาะเมื่อมีการสร้างคำขอใหม่เท่านั้น (โดยประมาณคือหนึ่งครั้งต่อชั่วโมงต่อผู้ส่งหนึ่งราย)
- คำขอจับคู่ DM ที่รอดำเนินการถูกจำกัดที่ **3 คำขอต่อช่องทาง** โดยค่าปริยาย; คำขอเพิ่มเติมจะถูกละเลยจนกว่าคำขอหนึ่งจะหมดอายุหรือได้รับการอนุมัติ

### อนุมัติผู้ส่ง

```bash
openclaw pairing list telegram
openclaw pairing approve telegram <CODE>
```

ช่องทางที่รองรับ: `bluebubbles`, `discord`, `feishu`, `googlechat`, `imessage`, `irc`, `line`, `matrix`, `mattermost`, `msteams`, `nextcloud-talk`, `nostr`, `openclaw-weixin`, `signal`, `slack`, `synology-chat`, `telegram`, `twitch`, `whatsapp`, `zalo`, `zalouser`

### ตำแหน่งที่จัดเก็บสถานะ

จัดเก็บภายใต้ `~/.openclaw/credentials/`:

- คำขอที่รอดำเนินการ: `<channel>-pairing.json`
- ที่เก็บ allowlist ที่ได้รับอนุมัติ:
  - บัญชีค่าปริยาย: `<channel>-allowFrom.json`
  - บัญชีที่ไม่ใช่ค่าปริยาย: `<channel>-<accountId>-allowFrom.json`

พฤติกรรมการกำหนดขอบเขตตามบัญชี:

- บัญชีที่ไม่ใช่ค่าปริยายจะอ่าน/เขียนเฉพาะไฟล์ allowlist ที่อยู่ในขอบเขตของตน
- บัญชีค่าปริยายจะใช้ไฟล์ allowlist แบบไม่มีขอบเขตที่อยู่ในขอบเขตของช่องทาง

ให้ถือว่าสิ่งเหล่านี้เป็นข้อมูลอ่อนไหว (เพราะเป็นตัวควบคุมการเข้าถึงผู้ช่วยของคุณ)

ข้อสำคัญ: ที่เก็บนี้ใช้สำหรับการเข้าถึง DM การอนุญาตของกลุ่มเป็นคนละส่วนกัน
การอนุมัติรหัสจับคู่ DM จะไม่อนุญาตให้ผู้ส่งนั้นสั่งคำสั่งในกลุ่มหรือควบคุมบอตในกลุ่มโดยอัตโนมัติ สำหรับการเข้าถึงกลุ่ม ให้กำหนดค่า allowlist ของกลุ่มแบบชัดเจนของช่องทางนั้น (เช่น `groupAllowFrom`, `groups` หรือ override รายกลุ่ม/รายหัวข้อ ขึ้นอยู่กับช่องทาง)

## 2) การจับคู่อุปกรณ์ Node (Node iOS/Android/macOS/headless)

Node เชื่อมต่อกับ Gateway ในฐานะ **อุปกรณ์** ที่มี `role: node` Gateway
จะสร้างคำขอจับคู่อุปกรณ์ที่ต้องได้รับการอนุมัติก่อน

### จับคู่ผ่าน Telegram (แนะนำสำหรับ iOS)

หากคุณใช้ Plugin `device-pair` คุณสามารถทำการจับคู่อุปกรณ์ครั้งแรกทั้งหมดผ่าน Telegram ได้เลย:

1. ใน Telegram ส่งข้อความถึงบอตของคุณ: `/pair`
2. บอตจะตอบกลับด้วย 2 ข้อความ: ข้อความคำแนะนำ และข้อความ **setup code** แยกต่างหาก (คัดลอก/วางใน Telegram ได้ง่าย)
3. บนโทรศัพท์ของคุณ เปิดแอป OpenClaw บน iOS → Settings → Gateway
4. วาง setup code แล้วเชื่อมต่อ
5. กลับไปที่ Telegram: `/pair pending` (ตรวจสอบ request ID, role และ scope) แล้วจึงอนุมัติ

setup code คือ payload JSON ที่เข้ารหัสแบบ base64 ซึ่งมีข้อมูลดังนี้:

- `url`: URL WebSocket ของ Gateway (`ws://...` หรือ `wss://...`)
- `bootstrapToken`: bootstrap token แบบอายุสั้นสำหรับอุปกรณ์เดียว ใช้สำหรับ handshake การจับคู่ครั้งแรก

bootstrap token นั้นจะมีโปรไฟล์ bootstrap สำหรับการจับคู่ในตัวดังนี้:

- โทเค็น `node` หลักที่ส่งต่อจะยังคงเป็น `scopes: []`
- โทเค็น `operator` ที่ส่งต่อจะยังคงถูกจำกัดอยู่ใน bootstrap allowlist:
  `operator.approvals`, `operator.read`, `operator.talk.secrets`, `operator.write`
- การตรวจสอบ scope ของ bootstrap ใช้คำนำหน้าตาม role ไม่ใช่ pool scope แบนชุดเดียว:
  รายการ scope ของ operator จะตอบสนองได้เฉพาะคำขอของ operator เท่านั้น และ role ที่ไม่ใช่ operator
  ยังคงต้องร้องขอ scope ภายใต้คำนำหน้าของ role ของตัวเอง

ให้ถือว่า setup code เป็นเหมือนรหัสผ่านในช่วงที่มันยังใช้ได้

### อนุมัติอุปกรณ์ Node

```bash
openclaw devices list
openclaw devices approve <requestId>
openclaw devices reject <requestId>
```

หากอุปกรณ์เดียวกันลองใหม่ด้วยรายละเอียดการยืนยันตัวตนที่ต่างออกไป (เช่น
role/scope/public key คนละค่า) คำขอที่รอดำเนินการก่อนหน้าจะถูกแทนที่ และจะมีการสร้าง `requestId` ใหม่

ข้อสำคัญ: อุปกรณ์ที่จับคู่แล้วจะไม่ได้รับสิทธิ์ที่กว้างขึ้นแบบเงียบ ๆ หากมัน
เชื่อมต่อใหม่โดยขอ scope เพิ่มเติมหรือ role ที่กว้างขึ้น OpenClaw จะคงการอนุมัติ
เดิมไว้ตามเดิม และสร้างคำขออัปเกรดที่รอดำเนินการใหม่ ใช้
`openclaw devices list` เพื่อเปรียบเทียบสิทธิ์ที่ได้รับอนุมัติอยู่ในปัจจุบันกับสิทธิ์ใหม่ที่ร้องขอ
ก่อนที่คุณจะอนุมัติ

### ที่เก็บสถานะการจับคู่ Node

จัดเก็บภายใต้ `~/.openclaw/devices/`:

- `pending.json` (อายุสั้น; คำขอที่รอดำเนินการจะหมดอายุ)
- `paired.json` (อุปกรณ์ที่จับคู่แล้ว + โทเค็น)

### หมายเหตุ

- API `node.pair.*` แบบเดิม (CLI: `openclaw nodes pending|approve|reject|rename`) เป็น
  ที่เก็บการจับคู่แยกต่างหากที่ gateway เป็นเจ้าของ Node แบบ WS ยังคงต้องใช้การจับคู่อุปกรณ์
- ระเบียนการจับคู่คือแหล่งข้อมูลจริงแบบถาวรสำหรับ role ที่ได้รับอนุมัติ โทเค็นอุปกรณ์
  ที่ใช้งานอยู่จะยังถูกจำกัดอยู่ภายในชุด role ที่ได้รับอนุมัตินั้น; รายการโทเค็นที่หลุดมา
  อยู่นอก role ที่ได้รับอนุมัติจะไม่ทำให้เกิดสิทธิ์ใหม่

## เอกสารที่เกี่ยวข้อง

- โมเดลความปลอดภัย + prompt injection: [Security](/th/gateway/security)
- การอัปเดตอย่างปลอดภัย (รัน doctor): [Updating](/th/install/updating)
- คอนฟิกช่องทาง:
  - Telegram: [Telegram](/th/channels/telegram)
  - WhatsApp: [WhatsApp](/th/channels/whatsapp)
  - Signal: [Signal](/th/channels/signal)
  - BlueBubbles (iMessage): [BlueBubbles](/th/channels/bluebubbles)
  - iMessage (legacy): [iMessage](/th/channels/imessage)
  - Discord: [Discord](/th/channels/discord)
  - Slack: [Slack](/th/channels/slack)
