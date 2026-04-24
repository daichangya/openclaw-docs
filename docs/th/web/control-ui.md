---
read_when:
    - คุณต้องการใช้งาน Gateway จากเบราว์เซอร์
    - คุณต้องการเข้าถึงผ่าน tailnet โดยไม่ต้องใช้ SSH tunnel
summary: Control UI แบบใช้เบราว์เซอร์สำหรับ Gateway (แชต, Node, คอนฟิก)
title: Control UI
x-i18n:
    generated_at: "2026-04-24T09:39:47Z"
    model: gpt-5.4
    provider: openai
    source_hash: c84a74e20d6c8829168025830ff4ec8f650f10f72fcaed7c8d2f5d92ab98d616
    source_path: web/control-ui.md
    workflow: 15
---

Control UI คือแอปหน้าเดียวขนาดเล็กแบบ **Vite + Lit** ที่ Gateway เป็นผู้ให้บริการ:

- ค่าเริ่มต้น: `http://<host>:18789/`
- รองรับ prefix แบบไม่บังคับ: ตั้งค่า `gateway.controlUi.basePath` (เช่น `/openclaw`)

มันสื่อสาร **โดยตรงกับ Gateway WebSocket** บนพอร์ตเดียวกัน

## เปิดใช้งานอย่างรวดเร็ว (ภายในเครื่อง)

หาก Gateway กำลังทำงานอยู่บนคอมพิวเตอร์เครื่องเดียวกัน ให้เปิด:

- [http://127.0.0.1:18789/](http://127.0.0.1:18789/) (หรือ [http://localhost:18789/](http://localhost:18789/))

หากหน้าไม่โหลด ให้เริ่ม Gateway ก่อน: `openclaw gateway`

auth จะถูกส่งระหว่าง WebSocket handshake ผ่าน:

- `connect.params.auth.token`
- `connect.params.auth.password`
- header แสดงตัวตนของ Tailscale Serve เมื่อ `gateway.auth.allowTailscale: true`
- header แสดงตัวตนของ trusted-proxy เมื่อ `gateway.auth.mode: "trusted-proxy"`

แผงตั้งค่าแดชบอร์ดจะเก็บ token ไว้สำหรับเซสชันแท็บเบราว์เซอร์ปัจจุบัน
และ URL ของ Gateway ที่เลือกไว้; password จะไม่ถูกเก็บไว้ โดยทั่วไป onboarding
จะสร้าง gateway token สำหรับ shared-secret auth ในการเชื่อมต่อครั้งแรก แต่ password
auth ก็ใช้งานได้เช่นกันเมื่อ `gateway.auth.mode` เป็น `"password"`

## การจับคู่อุปกรณ์ (การเชื่อมต่อครั้งแรก)

เมื่อคุณเชื่อมต่อกับ Control UI จากเบราว์เซอร์หรืออุปกรณ์ใหม่ Gateway
จะต้องมีการ **อนุมัติการจับคู่แบบครั้งเดียว** — แม้ว่าคุณจะอยู่บน Tailnet เดียวกันโดยมี `gateway.auth.allowTailscale: true` ก็ตาม นี่เป็นมาตรการด้านความปลอดภัยเพื่อป้องกัน
การเข้าถึงที่ไม่ได้รับอนุญาต

**สิ่งที่คุณจะเห็น:** "disconnected (1008): pairing required"

**วิธีอนุมัติอุปกรณ์:**

```bash
# List pending requests
openclaw devices list

# Approve by request ID
openclaw devices approve <requestId>
```

หากเบราว์เซอร์ลองจับคู่ใหม่ด้วยรายละเอียด auth ที่เปลี่ยนไป (role/scopes/public
key) คำขอที่รอก่อนหน้าจะถูกแทนที่ และจะมีการสร้าง `requestId` ใหม่
ให้รัน `openclaw devices list` อีกครั้งก่อนอนุมัติ

หากเบราว์เซอร์ถูกจับคู่ไว้แล้ว และคุณเปลี่ยนจากการเข้าถึงแบบอ่านอย่างเดียวเป็น
การเข้าถึงแบบเขียน/แอดมิน สิ่งนี้จะถูกมองว่าเป็นการยกระดับการอนุมัติ ไม่ใช่การเชื่อมต่อใหม่แบบเงียบ ๆ
OpenClaw จะคงการอนุมัติเดิมไว้ บล็อกการเชื่อมต่อใหม่ที่มีสิทธิ์กว้างขึ้น
และขอให้คุณอนุมัติชุด scope ใหม่อย่างชัดเจน

เมื่อได้รับการอนุมัติแล้ว อุปกรณ์จะถูกจดจำไว้ และจะไม่ต้องขออนุมัติอีก เว้นแต่
คุณจะเพิกถอนมันด้วย `openclaw devices revoke --device <id> --role <role>` ดู
[Devices CLI](/th/cli/devices) สำหรับการหมุนเวียน token และการเพิกถอน

**หมายเหตุ:**

- การเชื่อมต่อจากเบราว์เซอร์แบบ direct local loopback (`127.0.0.1` / `localhost`) จะได้รับการอนุมัติอัตโนมัติ
- การเชื่อมต่อจากเบราว์เซอร์ผ่าน tailnet และ LAN ยังคงต้องได้รับการอนุมัติอย่างชัดเจน แม้ว่าจะมาจากเครื่องเดียวกันก็ตาม
- โปรไฟล์เบราว์เซอร์แต่ละตัวจะสร้าง device ID ที่ไม่ซ้ำกัน ดังนั้นการสลับเบราว์เซอร์หรือการล้างข้อมูลเบราว์เซอร์จะต้องจับคู่ใหม่

## อัตลักษณ์ส่วนตัว (ภายในเบราว์เซอร์)

Control UI รองรับอัตลักษณ์ส่วนตัวแบบต่อเบราว์เซอร์ (ชื่อที่ใช้แสดงและ
อวาตาร์) ซึ่งจะแนบไปกับข้อความขาออกเพื่อใช้ระบุที่มาในเซสชันที่ใช้ร่วมกัน มัน
จะอยู่ในที่เก็บข้อมูลของเบราว์เซอร์ จำกัดอยู่ที่โปรไฟล์เบราว์เซอร์ปัจจุบัน และจะไม่
ซิงก์ไปยังอุปกรณ์อื่น หรือถูกเก็บฝั่งเซิร์ฟเวอร์เกินกว่าข้อมูล metadata ผู้เขียนใน transcript ปกติของข้อความที่คุณส่งจริง การล้างข้อมูลไซต์หรือเปลี่ยนเบราว์เซอร์จะรีเซ็ตให้ว่าง

## ปลายทางคอนฟิกรันไทม์

Control UI จะดึงการตั้งค่ารันไทม์จาก
`/__openclaw/control-ui-config.json` ปลายทางนี้ถูกควบคุมด้วย auth ของ
Gateway แบบเดียวกับพื้นผิว HTTP ส่วนที่เหลือ: เบราว์เซอร์ที่ยังไม่ได้ยืนยันตัวตน
จะดึงมันไม่ได้ และการดึงที่สำเร็จต้องอาศัย token/password ของ Gateway ที่ถูกต้องอยู่แล้ว,
ตัวตนจาก Tailscale Serve หรือ trusted-proxy identity

## การรองรับภาษา

Control UI สามารถแปลภาษาตัวเองได้ตั้งแต่การโหลดครั้งแรก โดยอิงจาก locale ของเบราว์เซอร์
หากต้องการ override ในภายหลัง ให้เปิด **Overview -> Gateway Access -> Language** ตัวเลือก
locale อยู่ในการ์ด Gateway Access ไม่ได้อยู่ภายใต้ Appearance

- locale ที่รองรับ: `en`, `zh-CN`, `zh-TW`, `pt-BR`, `de`, `es`, `ja-JP`, `ko`, `fr`, `tr`, `uk`, `id`, `pl`, `th`
- คำแปลที่ไม่ใช่ภาษาอังกฤษจะถูกโหลดแบบ lazy ในเบราว์เซอร์
- locale ที่เลือกจะถูกบันทึกไว้ใน storage ของเบราว์เซอร์และใช้ซ้ำในการเยี่ยมชมครั้งต่อไป
- คีย์คำแปลที่ขาดหายจะ fallback ไปเป็นภาษาอังกฤษ

## สิ่งที่ทำได้ (ตอนนี้)

- แชตกับโมเดลผ่าน Gateway WS (`chat.history`, `chat.send`, `chat.abort`, `chat.inject`)
- คุยกับ OpenAI Realtime โดยตรงจากเบราว์เซอร์ผ่าน WebRTC Gateway
  จะออก Realtime client secret แบบอายุสั้นด้วย `talk.realtime.session`; เบราว์เซอร์จะส่งเสียงจากไมโครโฟนตรงไปยัง OpenAI และส่งต่อการเรียกเครื่องมือ
  `openclaw_agent_consult` กลับผ่าน `chat.send` ไปยังโมเดล OpenClaw ขนาดใหญ่ที่กำหนดค่าไว้
- สตรีมการเรียกเครื่องมือ + การ์ดแสดงเอาต์พุตเครื่องมือแบบสดในแชต (agent event)
- channels: สถานะของ built-in รวมทั้ง bundled/external plugin channels, การเข้าสู่ระบบด้วย QR และคอนฟิกแบบต่อ channel (`channels.status`, `web.login.*`, `config.patch`)
- Instances: รายการ presence + รีเฟรช (`system-presence`)
- Sessions: รายการ + override แบบต่อเซสชันสำหรับ model/thinking/fast/verbose/trace/reasoning (`sessions.list`, `sessions.patch`)
- Dreams: สถานะ Dreaming, ปุ่มเปิด/ปิด และตัวอ่าน Dream Diary (`doctor.memory.status`, `doctor.memory.dreamDiary`, `config.patch`)
- งาน Cron: แสดงรายการ/เพิ่ม/แก้ไข/รัน/เปิด/ปิด + ประวัติการรัน (`cron.*`)
- Skills: สถานะ, เปิด/ปิด, ติดตั้ง, อัปเดต API key (`skills.*`)
- Node: แสดงรายการ + ความสามารถ (`node.list`)
- การอนุมัติ exec: แก้ไข allowlist ของ gateway หรือ Node + นโยบาย ask สำหรับ `exec host=gateway/node` (`exec.approvals.*`)
- คอนฟิก: ดู/แก้ไข `~/.openclaw/openclaw.json` (`config.get`, `config.set`)
- คอนฟิก: apply + restart พร้อมการตรวจสอบ (`config.apply`) และปลุกเซสชันที่ใช้งานล่าสุด
- การเขียนคอนฟิกมี base-hash guard เพื่อป้องกันการเขียนทับการแก้ไขพร้อมกัน
- การเขียนคอนฟิก (`config.set`/`config.apply`/`config.patch`) ยังตรวจสอบล่วงหน้าการ resolve SecretRef ที่ใช้งานอยู่สำหรับ ref ใน payload คอนฟิกที่ส่งมา; ref ที่ส่งมาซึ่งใช้งานอยู่แต่ resolve ไม่ได้ จะถูกปฏิเสธก่อนเขียน
- สคีมาคอนฟิก + การเรนเดอร์แบบฟอร์ม (`config.schema` / `config.schema.lookup`,
  รวมทั้ง `title` / `description` ของฟิลด์, UI hint ที่จับคู่, สรุปลูกโดยตรงทันที,
  docs metadata บน nested object/wildcard/array/composition node
  รวมถึงสคีมาของ Plugin + channel เมื่อมี); ตัวแก้ไข Raw JSON
  จะใช้ได้เฉพาะเมื่อ snapshot นั้น round-trip แบบ raw ได้อย่างปลอดภัย
- หาก snapshot ไม่สามารถ round-trip แบบ raw ได้อย่างปลอดภัย Control UI จะบังคับใช้โหมด Form และปิดโหมด Raw สำหรับ snapshot นั้น
- คำสั่ง "Reset to saved" ในตัวแก้ไข Raw JSON จะคงรูปร่างที่เขียนแบบ raw ไว้ (การจัดรูปแบบ, คอมเมนต์, โครงร่าง `$include`) แทนการเรนเดอร์ snapshot ที่ flatten แล้วใหม่ ดังนั้นการแก้ไขจากภายนอกจะยังอยู่เมื่อรีเซ็ต หาก snapshot นั้น round-trip ได้อย่างปลอดภัย
- ค่าของ structured SecretRef object จะแสดงแบบอ่านอย่างเดียวในช่องข้อความของฟอร์ม เพื่อป้องกันความเสียหายจากการแปลง object เป็น string โดยไม่ตั้งใจ
- ดีบัก: snapshot ของ status/health/models + event log + การเรียก RPC แบบแมนนวล (`status`, `health`, `models.list`)
- ล็อก: live tail ของ file log ของ Gateway พร้อมตัวกรอง/ส่งออก (`logs.tail`)
- อัปเดต: รันการอัปเดตแพ็กเกจ/git + restart (`update.run`) พร้อมรายงานการ restart

หมายเหตุเกี่ยวกับแผงงาน Cron:

- สำหรับงานแบบ isolated การส่งมอบจะใช้ค่าเริ่มต้นเป็นการประกาศสรุป คุณสามารถสลับเป็น none ได้หากต้องการให้รันภายในเท่านั้น
- ฟิลด์ channel/target จะปรากฏเมื่อเลือก announce
- โหมด Webhook ใช้ `delivery.mode = "webhook"` โดยตั้ง `delivery.to` เป็น URL Webhook `HTTP(S)` ที่ถูกต้อง
- สำหรับงานของเซสชันหลัก จะมีโหมดส่งมอบแบบ webhook และ none ให้ใช้
- ตัวควบคุมการแก้ไขขั้นสูงมี delete-after-run, clear agent override, ตัวเลือก cron แบบ exact/stagger,
  override สำหรับ model/thinking ของเอเจนต์ และตัวเลือกการส่งมอบแบบ best-effort
- การตรวจสอบแบบฟอร์มทำงานแบบ inline พร้อมข้อผิดพลาดระดับฟิลด์; ค่าที่ไม่ถูกต้องจะปิดปุ่มบันทึกจนกว่าจะแก้ไข
- ตั้งค่า `cron.webhookToken` เพื่อส่ง bearer token เฉพาะ หากไม่ตั้งค่า Webhook จะถูกส่งโดยไม่มี auth header
- fallback แบบ deprecated: งานเก่าที่เก็บไว้พร้อม `notify: true` ยังสามารถใช้ `cron.webhook` ได้จนกว่าจะถูกย้าย

## พฤติกรรมของแชต

- `chat.send` เป็นแบบ **ไม่บล็อก**: มันตอบรับทันทีด้วย `{ runId, status: "started" }` และคำตอบจะสตรีมผ่าน event ของ `chat`
- การส่งซ้ำด้วย `idempotencyKey` เดิมจะได้ `{ status: "in_flight" }` ขณะกำลังรัน และ `{ status: "ok" }` หลังเสร็จสิ้น
- คำตอบจาก `chat.history` ถูกจำกัดขนาดเพื่อความปลอดภัยของ UI เมื่อรายการใน transcript มีขนาดใหญ่เกินไป Gateway อาจตัดข้อความยาว, ละบล็อก metadata หนัก ๆ และแทนข้อความที่ใหญ่เกินไปด้วย placeholder (`[chat.history omitted: message too large]`)
- ภาพที่ assistant สร้างขึ้นจะถูกเก็บเป็น managed media reference และส่งกลับผ่าน URL สื่อของ Gateway ที่ผ่าน auth แล้ว ดังนั้นการรีโหลดจึงไม่ต้องพึ่ง payload ภาพ base64 ดิบที่ยังคงอยู่ในคำตอบของประวัติแชต
- `chat.history` ยังลบแท็ก inline directive ที่มีไว้แสดงผลเท่านั้นออกจากข้อความ assistant ที่ผู้ใช้มองเห็น (เช่น `[[reply_to_*]]` และ `[[audio_as_voice]]`), payload XML การเรียกเครื่องมือแบบข้อความล้วน (รวมถึง `<tool_call>...</tool_call>`, `<function_call>...</function_call>`, `<tool_calls>...</tool_calls>`, `<function_calls>...</function_calls>` และบล็อกการเรียกเครื่องมือที่ถูกตัดทอน), รวมถึง token ควบคุมโมเดลแบบ ASCII/ตัวเต็มความกว้างที่รั่วออกมา และละรายการของ assistant ที่ข้อความที่มองเห็นได้ทั้งหมดมีเพียง token เงียบตรงตัว `NO_REPLY` / `no_reply`
- `chat.inject` จะเพิ่มโน้ตของ assistant ลงใน session transcript และกระจาย event `chat` สำหรับการอัปเดตเฉพาะ UI (ไม่มีการรันเอเจนต์ ไม่มีการส่งผ่าน channel)
- ตัวเลือก model และ thinking ในส่วนหัวของแชตจะ patch เซสชันที่ใช้งานอยู่ทันทีผ่าน `sessions.patch`; สิ่งเหล่านี้เป็น session override แบบคงอยู่ ไม่ใช่ตัวเลือกส่งแบบใช้ครั้งเดียว
- โหมด Talk ใช้ผู้ให้บริการ realtime voice ที่ลงทะเบียนไว้ซึ่งรองรับ
  session WebRTC ในเบราว์เซอร์ กำหนดค่า OpenAI ด้วย `talk.provider: "openai"` พร้อม
  `talk.providers.openai.apiKey` หรือใช้คอนฟิกผู้ให้บริการ Voice Call realtime ซ้ำ เบราว์เซอร์จะไม่เคยได้รับ standard OpenAI API key; มันจะได้รับ
  เพียง Realtime client secret แบบชั่วคราวเท่านั้น Google Live realtime voice
  รองรับสำหรับ Voice Call ฝั่งแบ็กเอนด์และสะพาน Google Meet แต่ยังไม่รองรับเส้นทาง WebRTC ในเบราว์เซอร์นี้ Realtime session prompt จะถูกประกอบโดย Gateway; `talk.realtime.session` ไม่ยอมรับ instruction override จากผู้เรียก
- ในตัวเขียนแชต ปุ่ม Talk คือปุ่มคลื่นที่อยู่ถัดจาก
  ปุ่มไมโครโฟนสำหรับการป้อนตามคำบอก เมื่อ Talk เริ่ม แถวสถานะของตัวเขียนจะ
  แสดง `Connecting Talk...` จากนั้นเป็น `Talk live` เมื่อเสียงเชื่อมต่อแล้ว หรือ
  `Asking OpenClaw...` ระหว่างที่การเรียกเครื่องมือแบบ realtime กำลังปรึกษาโมเดลที่ใหญ่กว่าซึ่งกำหนดไว้ผ่าน `chat.send`
- หยุด:
  - คลิก **Stop** (เรียก `chat.abort`)
  - ขณะที่มีงานกำลังทำงานอยู่ ข้อความติดตามปกติจะถูกเข้าคิว คลิก **Steer** บนข้อความที่อยู่ในคิวเพื่อ inject ข้อความติดตามนั้นเข้าไปในเทิร์นที่กำลังทำงาน
  - พิมพ์ `/stop` (หรือวลี abort แบบเดี่ยว ๆ เช่น `stop`, `stop action`, `stop run`, `stop openclaw`, `please stop`) เพื่อ abort แบบ out-of-band
  - `chat.abort` รองรับ `{ sessionKey }` (ไม่ต้องมี `runId`) เพื่อ abort งานที่กำลังทำงานทั้งหมดของเซสชันนั้น
- การเก็บ partial เมื่อ abort:
  - เมื่อมีการ abort งาน ข้อความ assistant บางส่วนยังคงอาจแสดงใน UI ได้
  - Gateway จะเก็บข้อความ assistant บางส่วนที่ถูก abort ลงในประวัติ transcript เมื่อมี buffered output อยู่
  - รายการที่เก็บไว้จะมี abort metadata เพื่อให้ผู้ใช้ transcript แยกแยะข้อความ partial จากการ abort ออกจากเอาต์พุตที่เสร็จสมบูรณ์ตามปกติได้

## Hosted embed

ข้อความของ assistant สามารถเรนเดอร์เนื้อหาเว็บแบบโฮสต์ภายในบรรทัดได้ด้วย shortcode `[embed ...]`
นโยบาย sandbox ของ iframe ถูกควบคุมโดย
`gateway.controlUi.embedSandbox`:

- `strict`: ปิดการทำงานของสคริปต์ภายใน hosted embed
- `scripts`: อนุญาต embed แบบโต้ตอบได้ ขณะยังคงแยก origin; นี่คือ
  ค่าเริ่มต้นและโดยมากเพียงพอสำหรับเกม/วิดเจ็ตในเบราว์เซอร์แบบพึ่งพาตัวเอง
- `trusted`: เพิ่ม `allow-same-origin` ทับบน `allow-scripts` สำหรับเอกสาร same-site
  ที่ตั้งใจต้องการสิทธิ์ที่สูงกว่า

ตัวอย่าง:

```json5
{
  gateway: {
    controlUi: {
      embedSandbox: "scripts",
    },
  },
}
```

ใช้ `trusted` เฉพาะเมื่อเอกสารที่ฝังอยู่นั้นต้องการพฤติกรรม same-origin จริง ๆ
สำหรับเกมที่เอเจนต์สร้างขึ้นและ canvas แบบโต้ตอบส่วนใหญ่ `scripts` เป็น
ตัวเลือกที่ปลอดภัยกว่า

URL embed ภายนอกแบบสัมบูรณ์ `http(s)` ยังคงถูกบล็อกโดยค่าเริ่มต้น หากคุณ
ตั้งใจต้องการให้ `[embed url="https://..."]` โหลดหน้าเว็บของบุคคลที่สาม ให้ตั้งค่า
`gateway.controlUi.allowExternalEmbedUrls: true`

## การเข้าถึงผ่าน tailnet (แนะนำ)

### Tailscale Serve แบบรวมในตัว (แนะนำที่สุด)

คง Gateway ไว้บน loopback แล้วให้ Tailscale Serve พร็อกซีมันผ่าน HTTPS:

```bash
openclaw gateway --tailscale serve
```

เปิด:

- `https://<magicdns>/` (หรือ `gateway.controlUi.basePath` ที่คุณตั้งไว้)

โดยค่าเริ่มต้น คำขอจาก Serve ไปยัง Control UI/WebSocket สามารถยืนยันตัวตนผ่าน header แสดงตัวตนของ Tailscale
(`tailscale-user-login`) ได้เมื่อ `gateway.auth.allowTailscale` เป็น `true` OpenClaw
จะตรวจสอบตัวตนโดย resolve ที่อยู่ `x-forwarded-for` ด้วย
`tailscale whois` แล้วจับคู่กับ header และจะยอมรับเฉพาะเมื่อ
คำขอนั้นมาถึง loopback พร้อม header `x-forwarded-*` ของ Tailscale เท่านั้น ให้ตั้ง
`gateway.auth.allowTailscale: false` หากคุณต้องการบังคับให้ใช้ข้อมูลรับรอง shared-secret
อย่างชัดเจนแม้กับทราฟฟิกจาก Serve จากนั้นใช้ `gateway.auth.mode: "token"` หรือ
`"password"`
สำหรับเส้นทาง Serve identity แบบ async นี้ ความพยายาม auth ที่ล้มเหลวสำหรับ client IP
และ auth scope เดียวกันจะถูก serialize ก่อนเขียน rate-limit ดังนั้นการลองผิดซ้ำพร้อมกัน
จากเบราว์เซอร์เดียวกันอาจแสดง `retry later` ในคำขอที่สอง
แทนที่จะเกิด mismatch สองรายการแบบแข่งกันพร้อมกัน
การทำ auth ของ Serve โดยไม่ใช้ token ถือว่าโฮสต์ของ Gateway เป็นแหล่งที่เชื่อถือได้ หากมีโค้ดภายในเครื่องที่ไม่น่าเชื่อถืออาจรันบนโฮสต์นั้น ให้บังคับใช้ token/password auth

### bind กับ tailnet + token

```bash
openclaw gateway --bind tailnet --token "$(openssl rand -hex 32)"
```

จากนั้นเปิด:

- `http://<tailscale-ip>:18789/` (หรือ `gateway.controlUi.basePath` ที่คุณตั้งไว้)

วาง shared secret ที่ตรงกันลงในตั้งค่าของ UI (ส่งเป็น
`connect.params.auth.token` หรือ `connect.params.auth.password`)

## HTTP ที่ไม่ปลอดภัย

หากคุณเปิดแดชบอร์ดผ่าน HTTP แบบธรรมดา (`http://<lan-ip>` หรือ `http://<tailscale-ip>`),
เบราว์เซอร์จะทำงานใน **non-secure context** และบล็อก WebCrypto โดยค่าเริ่มต้น
OpenClaw จะ **บล็อก** การเชื่อมต่อ Control UI ที่ไม่มี device identity

ข้อยกเว้นที่มีเอกสารกำกับ:

- ความเข้ากันได้ของ HTTP แบบไม่ปลอดภัยเฉพาะ localhost ด้วย `gateway.controlUi.allowInsecureAuth=true`
- auth ของ operator Control UI ที่สำเร็จผ่าน `gateway.auth.mode: "trusted-proxy"`
- โหมด break-glass `gateway.controlUi.dangerouslyDisableDeviceAuth=true`

**วิธีแก้ที่แนะนำ:** ใช้ HTTPS (Tailscale Serve) หรือเปิด UI ในเครื่อง:

- `https://<magicdns>/` (Serve)
- `http://127.0.0.1:18789/` (บนโฮสต์ Gateway)

**พฤติกรรมของตัวสลับ insecure-auth:**

```json5
{
  gateway: {
    controlUi: { allowInsecureAuth: true },
    bind: "tailnet",
    auth: { mode: "token", token: "replace-me" },
  },
}
```

`allowInsecureAuth` เป็นเพียงตัวสลับความเข้ากันได้ภายในเครื่องเท่านั้น:

- มันอนุญาตให้เซสชัน Control UI บน localhost ดำเนินการต่อโดยไม่มี device identity ใน
  non-secure HTTP context
- มันไม่ข้ามการตรวจสอบการจับคู่
- มันไม่ผ่อนคลายข้อกำหนด device identity สำหรับการเชื่อมต่อระยะไกล (ที่ไม่ใช่ localhost)

**ใช้เฉพาะแบบ break-glass เท่านั้น:**

```json5
{
  gateway: {
    controlUi: { dangerouslyDisableDeviceAuth: true },
    bind: "tailnet",
    auth: { mode: "token", token: "replace-me" },
  },
}
```

`dangerouslyDisableDeviceAuth` จะปิดการตรวจสอบ device identity ของ Control UI และเป็น
การลดระดับความปลอดภัยอย่างรุนแรง ควรย้อนกลับโดยเร็วหลังจากใช้ในกรณีฉุกเฉิน

หมายเหตุเกี่ยวกับ trusted-proxy:

- auth ผ่าน trusted-proxy ที่สำเร็จสามารถยอมรับเซสชัน Control UI ของ **operator** ได้โดยไม่มี
  device identity
- สิ่งนี้ **ไม่** ครอบคลุมไปถึงเซสชัน Control UI ที่มีบทบาทเป็น Node
- reverse proxy แบบ loopback บนโฮสต์เดียวกันก็ยังไม่ผ่านเงื่อนไข trusted-proxy auth; ดู
  [Trusted Proxy Auth](/th/gateway/trusted-proxy-auth)

ดู [Tailscale](/th/gateway/tailscale) สำหรับแนวทางการตั้งค่า HTTPS

## Content Security Policy

Control UI มาพร้อมนโยบาย `img-src` ที่เข้มงวด: อนุญาตเฉพาะ asset แบบ **same-origin** และ URL แบบ `data:` เท่านั้น URL รูปภาพระยะไกลแบบ `http(s)` และ protocol-relative จะถูกเบราว์เซอร์ปฏิเสธ และจะไม่มีการส่งคำขอเครือข่ายออกไป

ในทางปฏิบัติสิ่งนี้หมายความว่า:

- อวาตาร์และภาพที่ให้บริการภายใต้พาธแบบ relative (เช่น `/avatars/<id>`) ยังแสดงผลได้
- URL แบบ inline `data:image/...` ยังแสดงผลได้ (มีประโยชน์สำหรับ payload ภายในโปรโตคอล)
- URL อวาตาร์ระยะไกลที่ปล่อยออกมาจาก metadata ของ channel จะถูกลบออกที่ตัวช่วยอวาตาร์ของ Control UI และแทนที่ด้วยโลโก้/ป้ายที่มีมาให้ ดังนั้น channel ที่ถูกบุกรุกหรือเป็นอันตรายจึงไม่สามารถบังคับให้เบราว์เซอร์ของ operator ดึงรูปภาพระยะไกลตามอำเภอใจได้

คุณไม่จำเป็นต้องเปลี่ยนแปลงอะไรเพื่อให้ได้พฤติกรรมนี้ — มันเปิดใช้งานอยู่เสมอและกำหนดค่าไม่ได้

## auth ของเส้นทางอวาตาร์

เมื่อมีการกำหนดค่า auth ของ Gateway ปลายทางอวาตาร์ของ Control UI จะต้องใช้ gateway token เดียวกับ API ส่วนที่เหลือ:

- `GET /avatar/<agentId>` จะส่งคืนภาพอวาตาร์เฉพาะแก่ผู้เรียกที่ยืนยันตัวตนแล้วเท่านั้น `GET /avatar/<agentId>?meta=1` จะส่งคืน metadata ของอวาตาร์ภายใต้กฎเดียวกัน
- คำขอที่ยังไม่ได้ยืนยันตัวตนไปยังทั้งสองเส้นทางจะถูกปฏิเสธ (สอดคล้องกับเส้นทางสื่อของ assistant ที่เป็นพี่น้องกัน) สิ่งนี้ป้องกันไม่ให้เส้นทางอวาตาร์รั่วไหลอัตลักษณ์ของเอเจนต์บนโฮสต์ที่ได้รับการป้องกันในส่วนอื่น
- ตัว Control UI เองจะส่งต่อ gateway token เป็น bearer header เมื่อดึงอวาตาร์ และใช้ blob URL ที่ยืนยันตัวตนแล้ว เพื่อให้ภาพยังคงแสดงผลในแดชบอร์ดได้

หากคุณปิด auth ของ Gateway (ไม่แนะนำบนโฮสต์ที่ใช้ร่วมกัน) เส้นทางอวาตาร์ก็จะกลายเป็นแบบไม่ต้องยืนยันตัวตนเช่นกัน ให้สอดคล้องกับส่วนอื่นของ Gateway

## การ build UI

Gateway ให้บริการไฟล์ static จาก `dist/control-ui` ให้ build ด้วย:

```bash
pnpm ui:build
```

base แบบสัมบูรณ์ที่ไม่บังคับ (เมื่อคุณต้องการ URL ของ asset แบบคงที่):

```bash
OPENCLAW_CONTROL_UI_BASE_PATH=/openclaw/ pnpm ui:build
```

สำหรับการพัฒนาในเครื่อง (dev server แยกต่างหาก):

```bash
pnpm ui:dev
```

จากนั้นชี้ UI ไปยัง URL ของ Gateway WS ของคุณ (เช่น `ws://127.0.0.1:18789`)

## การดีบัก/ทดสอบ: dev server + Gateway ระยะไกล

Control UI เป็นไฟล์ static; เป้าหมาย WebSocket สามารถกำหนดค่าได้และอาจ
ต่างจาก HTTP origin ก็ได้ สิ่งนี้มีประโยชน์เมื่อคุณต้องการใช้ Vite dev server
ภายในเครื่อง แต่ Gateway รันอยู่ที่อื่น

1. เริ่ม UI dev server: `pnpm ui:dev`
2. เปิด URL ลักษณะนี้:

```text
http://localhost:5173/?gatewayUrl=ws://<gateway-host>:18789
```

auth แบบครั้งเดียวที่ไม่บังคับ (หากจำเป็น):

```text
http://localhost:5173/?gatewayUrl=wss://<gateway-host>:18789#token=<gateway-token>
```

หมายเหตุ:

- `gatewayUrl` จะถูกเก็บไว้ใน localStorage หลังโหลด และถูกลบออกจาก URL
- ควรส่ง `token` ผ่าน URL fragment (`#token=...`) เมื่อทำได้ Fragment จะไม่ถูกส่งไปยังเซิร์ฟเวอร์ ซึ่งช่วยหลีกเลี่ยงการรั่วไหลไปยัง request log และ Referer พารามิเตอร์ query แบบเก่า `?token=` ยังคงถูกนำเข้าได้หนึ่งครั้งเพื่อความเข้ากันได้ แต่เป็นเพียง fallback เท่านั้น และจะถูกลบทันทีหลัง bootstrap
- `password` จะถูกเก็บไว้ในหน่วยความจำเท่านั้น
- เมื่อมีการตั้งค่า `gatewayUrl` แล้ว UI จะไม่ fallback ไปใช้ข้อมูลรับรองจาก config หรือ environment
  ต้องระบุ `token` (หรือ `password`) อย่างชัดเจน การไม่มีข้อมูลรับรองแบบ explicit ถือเป็นข้อผิดพลาด
- ใช้ `wss://` เมื่อ Gateway อยู่หลัง TLS (Tailscale Serve, HTTPS proxy ฯลฯ)
- `gatewayUrl` จะยอมรับเฉพาะในหน้าต่างระดับบนสุดเท่านั้น (ไม่ใช่แบบฝัง) เพื่อป้องกัน clickjacking
- การติดตั้งใช้งาน Control UI ที่ไม่ใช่ loopback ต้องตั้ง `gateway.controlUi.allowedOrigins`
  อย่างชัดเจน (origin แบบเต็ม) ซึ่งรวมถึงการตั้งค่า dev ระยะไกลด้วย
- อย่าใช้ `gateway.controlUi.allowedOrigins: ["*"]` ยกเว้นสำหรับการทดสอบภายในเครื่องที่ควบคุมอย่างแน่นหนา
  เพราะมันหมายถึงอนุญาตทุก browser origin ไม่ใช่ “จับคู่กับโฮสต์ใดก็ตามที่ฉัน
  กำลังใช้อยู่”
- `gateway.controlUi.dangerouslyAllowHostHeaderOriginFallback=true` เปิดใช้งาน
  โหมด fallback ของ origin ตาม Host header แต่เป็นโหมดความปลอดภัยที่อันตราย

ตัวอย่าง:

```json5
{
  gateway: {
    controlUi: {
      allowedOrigins: ["http://localhost:5173"],
    },
  },
}
```

รายละเอียดการตั้งค่าการเข้าถึงระยะไกล: [Remote access](/th/gateway/remote)

## ที่เกี่ยวข้อง

- [Dashboard](/th/web/dashboard) — แดชบอร์ดของ Gateway
- [WebChat](/th/web/webchat) — อินเทอร์เฟซแชตผ่านเบราว์เซอร์
- [TUI](/th/web/tui) — ส่วนติดต่อผู้ใช้แบบเทอร์มินัล
- [Health Checks](/th/gateway/health) — การติดตามสุขภาพของ Gateway
