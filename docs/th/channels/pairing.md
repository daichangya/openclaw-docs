---
read_when:
    - การตั้งค่าการควบคุมการเข้าถึง DM
    - การจับคู่ Node iOS/Android ใหม่
    - การทบทวนแนวทางความปลอดภัยของ OpenClaw
summary: 'ภาพรวมการจับคู่: อนุมัติว่าใครสามารถส่ง DM ถึงคุณได้บ้าง + Node ใดบ้างที่สามารถเข้าร่วมได้'
title: การจับคู่
x-i18n:
    generated_at: "2026-04-23T05:26:51Z"
    model: gpt-5.4
    provider: openai
    source_hash: 4161629ead02dc0bdcd283cc125fe6579a579e03740127f4feb22dfe344bd028
    source_path: channels/pairing.md
    workflow: 15
---

# การจับคู่

“การจับคู่” คือขั้นตอน**การอนุมัติโดยเจ้าของ**อย่างชัดเจนของ OpenClaw
ซึ่งถูกใช้ใน 2 กรณี:

1. **การจับคู่ DM** (ใครได้รับอนุญาตให้คุยกับบอตได้)
2. **การจับคู่ Node** (อุปกรณ์/Node ใดบ้างที่ได้รับอนุญาตให้เข้าร่วมเครือข่าย Gateway)

บริบทด้านความปลอดภัย: [Security](/th/gateway/security)

## 1) การจับคู่ DM (การเข้าถึงแชตขาเข้า)

เมื่อมีการตั้งค่าช่องทางด้วยนโยบาย DM เป็น `pairing` ผู้ส่งที่ไม่รู้จักจะได้รับรหัสสั้น ๆ และข้อความของพวกเขาจะ**ไม่ถูกประมวลผล**จนกว่าคุณจะอนุมัติ

นโยบาย DM เริ่มต้นมีระบุไว้ใน: [Security](/th/gateway/security)

รหัสการจับคู่:

- 8 อักขระ, ตัวพิมพ์ใหญ่, ไม่มีอักขระที่กำกวม (`0O1I`)
- **หมดอายุภายใน 1 ชั่วโมง** บอตจะส่งข้อความการจับคู่เฉพาะเมื่อมีการสร้างคำขอใหม่เท่านั้น (โดยประมาณคือหนึ่งครั้งต่อชั่วโมงต่อผู้ส่งหนึ่งราย)
- คำขอจับคู่ DM ที่รอดำเนินการถูกจำกัดไว้ที่ **3 รายการต่อช่องทาง** โดยค่าเริ่มต้น; คำขอเพิ่มเติมจะถูกเพิกเฉยจนกว่าจะมีรายการหนึ่งหมดอายุหรือได้รับการอนุมัติ

### อนุมัติผู้ส่ง

```bash
openclaw pairing list telegram
openclaw pairing approve telegram <CODE>
```

ช่องทางที่รองรับ: `bluebubbles`, `discord`, `feishu`, `googlechat`, `imessage`, `irc`, `line`, `matrix`, `mattermost`, `msteams`, `nextcloud-talk`, `nostr`, `openclaw-weixin`, `signal`, `slack`, `synology-chat`, `telegram`, `twitch`, `whatsapp`, `zalo`, `zalouser`

### ตำแหน่งที่เก็บสถานะ

จัดเก็บไว้ภายใต้ `~/.openclaw/credentials/`:

- คำขอที่รอดำเนินการ: `<channel>-pairing.json`
- ที่เก็บ allowlist ที่ได้รับอนุมัติ:
  - บัญชีเริ่มต้น: `<channel>-allowFrom.json`
  - บัญชีที่ไม่ใช่ค่าเริ่มต้น: `<channel>-<accountId>-allowFrom.json`

พฤติกรรมการกำหนดขอบเขตตามบัญชี:

- บัญชีที่ไม่ใช่ค่าเริ่มต้นจะอ่าน/เขียนเฉพาะไฟล์ allowlist ที่อยู่ในขอบเขตของบัญชีนั้น
- บัญชีเริ่มต้นจะใช้ไฟล์ allowlist แบบไม่กำหนดขอบเขตที่ระดับช่องทาง

ให้ถือว่าสิ่งเหล่านี้เป็นข้อมูลที่มีความละเอียดอ่อน (เพราะเป็นตัวกำหนดสิทธิ์เข้าถึงผู้ช่วยของคุณ)

ข้อสำคัญ: ที่เก็บนี้ใช้สำหรับการเข้าถึง DM การอนุญาตกลุ่มเป็นคนละส่วนกัน
การอนุมัติรหัสจับคู่ DM ไม่ได้ทำให้ผู้ส่งรายนั้นได้รับอนุญาตให้ใช้คำสั่งกลุ่มหรือควบคุมบอตในกลุ่มโดยอัตโนมัติ สำหรับการเข้าถึงกลุ่ม ให้กำหนด allowlist กลุ่มแบบ explicit ของช่องทางนั้น (เช่น `groupAllowFrom`, `groups` หรือ override แยกตามกลุ่ม/หัวข้อ ตามที่ช่องทางนั้นรองรับ)

## 2) การจับคู่ Node ของอุปกรณ์ (iOS/Android/macOS/Node แบบ headless)

Node จะเชื่อมต่อกับ Gateway ในฐานะ**อุปกรณ์**ด้วย `role: node` โดย Gateway
จะสร้างคำขอจับคู่อุปกรณ์ที่ต้องได้รับการอนุมัติ

### จับคู่ผ่าน Telegram (แนะนำสำหรับ iOS)

หากคุณใช้ Plugin `device-pair` คุณสามารถจับคู่อุปกรณ์ครั้งแรกทั้งหมดผ่าน Telegram ได้เลย:

1. ใน Telegram ส่งข้อความถึงบอตของคุณ: `/pair`
2. บอตจะตอบกลับด้วยสองข้อความ: ข้อความคำแนะนำ และข้อความ **setup code** แยกต่างหาก (คัดลอก/วางใน Telegram ได้สะดวก)
3. บนโทรศัพท์ของคุณ เปิดแอป OpenClaw บน iOS → Settings → Gateway
4. วาง setup code แล้วเชื่อมต่อ
5. กลับไปที่ Telegram: `/pair pending` (เพื่อตรวจสอบ request ID, role และ scope) จากนั้นจึงอนุมัติ

setup code คือ payload JSON ที่เข้ารหัสแบบ base64 ซึ่งประกอบด้วย:

- `url`: URL ของ WebSocket สำหรับ Gateway (`ws://...` หรือ `wss://...`)
- `bootstrapToken`: bootstrap token แบบอายุสั้นสำหรับอุปกรณ์เดียว ใช้สำหรับ handshake การจับคู่เริ่มต้น

bootstrap token นั้นมีโปรไฟล์ bootstrap สำหรับการจับคู่ที่มีมาในตัว:

- token `node` หลักที่ส่งต่อยังคงมี `scopes: []`
- token `operator` ใด ๆ ที่ส่งต่อจะยังคงถูกจำกัดอยู่ใน bootstrap allowlist:
  `operator.approvals`, `operator.read`, `operator.talk.secrets`, `operator.write`
- การตรวจสอบ scope ของ bootstrap ใช้คำนำหน้า role ไม่ใช่ pool ของ scope แบบแบนรวมกัน:
  รายการ scope ของ operator จะใช้ตอบสนองเฉพาะคำขอของ operator เท่านั้น และ role ที่ไม่ใช่ operator
  ยังคงต้องขอ scope ภายใต้คำนำหน้า role ของตนเอง

ให้ถือ setup code นี้เสมือนรหัสผ่านตราบเท่าที่ยังใช้งานได้

### อนุมัติอุปกรณ์ Node

```bash
openclaw devices list
openclaw devices approve <requestId>
openclaw devices reject <requestId>
```

หากอุปกรณ์เดียวกันลองใหม่ด้วยรายละเอียดการยืนยันตัวตนที่ต่างออกไป (เช่น
role/scope/public key ต่างกัน) คำขอที่รอดำเนินการก่อนหน้าจะถูกแทนที่ และจะมีการสร้าง `requestId` ใหม่

ข้อสำคัญ: อุปกรณ์ที่จับคู่แล้วจะไม่ได้รับสิทธิ์ที่กว้างขึ้นแบบเงียบ ๆ หากมัน
เชื่อมต่อใหม่โดยขอ scope เพิ่มเติมหรือ role ที่กว้างขึ้น OpenClaw จะคง
การอนุมัติเดิมไว้ตามเดิม และสร้างคำขออัปเกรดที่รอดำเนินการใหม่ ใช้
`openclaw devices list` เพื่อเปรียบเทียบสิทธิ์ที่อนุมัติอยู่ในปัจจุบันกับสิทธิ์ที่ร้องขอใหม่
ก่อนที่คุณจะอนุมัติ

### ที่เก็บสถานะการจับคู่ Node

จัดเก็บไว้ภายใต้ `~/.openclaw/devices/`:

- `pending.json` (อายุสั้น; คำขอที่รอดำเนินการจะหมดอายุ)
- `paired.json` (อุปกรณ์ที่จับคู่แล้ว + token)

### หมายเหตุ

- API `node.pair.*` แบบ legacy (CLI: `openclaw nodes pending|approve|reject|rename`) เป็น
  ที่เก็บการจับคู่อีกชุดหนึ่งที่ Gateway เป็นเจ้าของแยกต่างหาก แต่ Node ผ่าน WS ก็ยังต้องใช้การจับคู่อุปกรณ์
- ระเบียนการจับคู่คือแหล่งข้อมูลจริงแบบคงทนสำหรับ role ที่ได้รับอนุมัติ
  token ของอุปกรณ์ที่ยัง active จะยังคงถูกจำกัดอยู่ตามชุด role ที่อนุมัติแล้ว; รายการ token ที่หลุดมา
  อยู่นอกเหนือ role ที่ได้รับอนุมัติจะไม่ก่อให้เกิดสิทธิ์เข้าถึงใหม่

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
