---
read_when:
    - คุณต้องการใช้งาน Gateway จากเบราว์เซอร์
    - คุณต้องการเข้าถึงผ่าน Tailnet โดยไม่ต้องใช้ SSH tunnels
summary: Control UI สำหรับ Gateway บนเบราว์เซอร์ (แชต, nodes, config)
title: Control UI
x-i18n:
    generated_at: "2026-04-23T06:20:10Z"
    model: gpt-5.4
    provider: openai
    source_hash: 63e3dbba6b05a5e00499fbe75e6a66a89e0b6b3d9d66e69143068e087f517b8a
    source_path: web/control-ui.md
    workflow: 15
---

# Control UI (เบราว์เซอร์)

Control UI คือแอปหน้าเดียวขนาดเล็กแบบ **Vite + Lit** ที่ Gateway ให้บริการ:

- ค่าเริ่มต้น: `http://<host>:18789/`
- คำนำหน้าแบบไม่บังคับ: ตั้งค่า `gateway.controlUi.basePath` (เช่น `/openclaw`)

มันสื่อสาร **โดยตรงกับ Gateway WebSocket** บนพอร์ตเดียวกัน

## เปิดใช้งานอย่างรวดเร็ว (ภายในเครื่อง)

หาก Gateway กำลังทำงานอยู่บนคอมพิวเตอร์เครื่องเดียวกัน ให้เปิด:

- [http://127.0.0.1:18789/](http://127.0.0.1:18789/) (หรือ [http://localhost:18789/](http://localhost:18789/))

หากหน้าไม่โหลด ให้เริ่ม Gateway ก่อน: `openclaw gateway`

การยืนยันตัวตนจะถูกส่งระหว่างการจับมือของ WebSocket ผ่าน:

- `connect.params.auth.token`
- `connect.params.auth.password`
- ส่วนหัวข้อมูลตัวตนของ Tailscale Serve เมื่อ `gateway.auth.allowTailscale: true`
- ส่วนหัวข้อมูลตัวตนของ trusted-proxy เมื่อ `gateway.auth.mode: "trusted-proxy"`

แผงการตั้งค่าแดชบอร์ดจะเก็บโทเค็นไว้สำหรับเซสชันแท็บเบราว์เซอร์ปัจจุบัน
และ URL ของ gateway ที่เลือก; รหัสผ่านจะไม่ถูกเก็บไว้
โดยทั่วไปการเริ่มต้นใช้งานครั้งแรกจะสร้างโทเค็น gateway สำหรับการยืนยันตัวตนแบบ shared-secret ในการเชื่อมต่อครั้งแรก แต่การยืนยันตัวตนด้วยรหัสผ่านก็ใช้ได้เช่นกันเมื่อ `gateway.auth.mode` เป็น `"password"`

## การจับคู่อุปกรณ์ (การเชื่อมต่อครั้งแรก)

เมื่อคุณเชื่อมต่อกับ Control UI จากเบราว์เซอร์หรืออุปกรณ์ใหม่ Gateway
จะต้องมี **การอนุมัติการจับคู่แบบครั้งเดียว** — แม้ว่าคุณจะอยู่ใน Tailnet เดียวกัน
โดยมี `gateway.auth.allowTailscale: true` ก็ตาม นี่เป็นมาตรการด้านความปลอดภัยเพื่อป้องกัน
การเข้าถึงโดยไม่ได้รับอนุญาต

**สิ่งที่คุณจะเห็น:** "disconnected (1008): pairing required"

**วิธีอนุมัติอุปกรณ์:**

```bash
# แสดงรายการคำขอที่รอดำเนินการ
openclaw devices list

# อนุมัติตาม request ID
openclaw devices approve <requestId>
```

หากเบราว์เซอร์ลองจับคู่อีกครั้งโดยมีรายละเอียดการยืนยันตัวตนที่เปลี่ยนไป (role/scopes/public
key) คำขอที่รออยู่ก่อนหน้าจะถูกแทนที่ และจะมี `requestId` ใหม่
ถูกสร้างขึ้น ให้รัน `openclaw devices list` อีกครั้งก่อนอนุมัติ

หากเบราว์เซอร์ถูกจับคู่ไว้แล้วและคุณเปลี่ยนจากสิทธิ์อ่านเป็น
สิทธิ์เขียน/ผู้ดูแลระบบ สิ่งนี้จะถูกถือเป็นการอัปเกรดการอนุมัติ ไม่ใช่การเชื่อมต่อใหม่แบบเงียบ
OpenClaw จะคงการอนุมัติเดิมไว้ บล็อกการเชื่อมต่อใหม่ที่มีสิทธิ์กว้างขึ้น
และขอให้คุณอนุมัติชุดสิทธิ์ใหม่อย่างชัดเจน

เมื่ออนุมัติแล้ว อุปกรณ์จะถูกจดจำและจะไม่ต้องอนุมัติซ้ำอีก
เว้นแต่คุณจะเพิกถอนด้วย `openclaw devices revoke --device <id> --role <role>` ดู
[Devices CLI](/th/cli/devices) สำหรับการหมุนเวียนโทเค็นและการเพิกถอน

**หมายเหตุ:**

- การเชื่อมต่อเบราว์เซอร์ผ่าน local loopback โดยตรง (`127.0.0.1` / `localhost`) จะได้รับการอนุมัติอัตโนมัติ
- การเชื่อมต่อเบราว์เซอร์ผ่าน Tailnet และ LAN ยังคงต้องได้รับการอนุมัติอย่างชัดเจน แม้ว่า
  จะมาจากเครื่องเดียวกันก็ตาม
- แต่ละโปรไฟล์เบราว์เซอร์จะสร้าง device ID ที่ไม่ซ้ำกัน ดังนั้นการสลับเบราว์เซอร์หรือ
  การล้างข้อมูลเบราว์เซอร์จะต้องจับคู่ใหม่

## การรองรับภาษา

Control UI สามารถแปลภาษาตัวเองได้ในการโหลดครั้งแรกตาม locale ของเบราว์เซอร์คุณ
หากต้องการเปลี่ยนในภายหลัง ให้เปิด **Overview -> Gateway Access -> Language** ตัวเลือก
locale จะอยู่ในการ์ด Gateway Access ไม่ได้อยู่ใต้ Appearance

- locales ที่รองรับ: `en`, `zh-CN`, `zh-TW`, `pt-BR`, `de`, `es`, `ja-JP`, `ko`, `fr`, `tr`, `uk`, `id`, `pl`
- คำแปลที่ไม่ใช่ภาษาอังกฤษจะถูกโหลดแบบ lazy ในเบราว์เซอร์
- locale ที่เลือกจะถูกบันทึกไว้ในที่เก็บข้อมูลของเบราว์เซอร์และนำกลับมาใช้ในการเข้าชมครั้งต่อไป
- คีย์คำแปลที่ไม่มีจะ fallback กลับเป็นภาษาอังกฤษ

## สิ่งที่ทำได้ (ตอนนี้)

- แชตกับโมเดลผ่าน Gateway WS (`chat.history`, `chat.send`, `chat.abort`, `chat.inject`)
- สตรีมการเรียกใช้เครื่องมือ + การ์ดเอาต์พุตเครื่องมือสดใน Chat (เหตุการณ์ของเอเจนต์)
- Channels: สถานะของ channel ที่มีมาให้ในตัวรวมถึง channel จาก bundled/external Plugin, การล็อกอินด้วย QR และ config ราย channel (`channels.status`, `web.login.*`, `config.patch`)
- Instances: รายการสถานะออนไลน์ + รีเฟรช (`system-presence`)
- Sessions: แสดงรายการ + การ override รายเซสชันสำหรับ model/thinking/fast/verbose/trace/reasoning (`sessions.list`, `sessions.patch`)
- Dreams: สถานะ Dreaming, สวิตช์เปิด/ปิดใช้งาน และตัวอ่าน Dream Diary (`doctor.memory.status`, `doctor.memory.dreamDiary`, `config.patch`)
- งาน Cron: แสดงรายการ/เพิ่ม/แก้ไข/รัน/เปิดใช้งาน/ปิดใช้งาน + ประวัติการรัน (`cron.*`)
- Skills: สถานะ, เปิด/ปิดใช้งาน, ติดตั้ง, อัปเดต API key (`skills.*`)
- Nodes: แสดงรายการ + caps (`node.list`)
- การอนุมัติ exec: แก้ไข allowlists ของ gateway หรือ node + ถามนโยบายสำหรับ `exec host=gateway/node` (`exec.approvals.*`)
- Config: ดู/แก้ไข `~/.openclaw/openclaw.json` (`config.get`, `config.set`)
- Config: ใช้การตั้งค่า + รีสตาร์ทพร้อมการตรวจสอบความถูกต้อง (`config.apply`) และปลุกเซสชันที่ใช้งานล่าสุด
- การเขียน config มีตัวป้องกัน base-hash เพื่อไม่ให้เขียนทับการแก้ไขพร้อมกัน
- การเขียน config (`config.set`/`config.apply`/`config.patch`) ยังตรวจสอบล่วงหน้าการ resolve SecretRef ที่กำลังใช้งานสำหรับ refs ใน payload config ที่ส่งมา; refs ที่ส่งมาซึ่งยัง resolve ไม่ได้และกำลังใช้งานอยู่จะถูกปฏิเสธก่อนการเขียน
- Config schema + การเรนเดอร์ฟอร์ม (`config.schema` / `config.schema.lookup`,
  รวมถึง `title` / `description` ของฟิลด์, UI hints ที่จับคู่กัน, สรุปลูกโดยตรงทันที,
  เมทาดาต้า docs บนโหนด object/wildcard/array/composition ที่ซ้อนกัน,
  พร้อมทั้ง schemas ของ Plugin + channel เมื่อมี); ตัวแก้ไข Raw JSON
  จะใช้งานได้เฉพาะเมื่อ snapshot นั้นมีการ round-trip raw ที่ปลอดภัย
- หาก snapshot ไม่สามารถ round-trip ข้อความ raw ได้อย่างปลอดภัย Control UI จะบังคับใช้โหมด Form และปิดใช้งานโหมด Raw สำหรับ snapshot นั้น
- ค่า SecretRef object แบบมีโครงสร้างจะแสดงแบบอ่านอย่างเดียวในอินพุตข้อความของฟอร์มเพื่อป้องกันความเสียหายจากการแปลง object เป็น string โดยไม่ตั้งใจ
- ดีบัก: snapshots ของ status/health/models + บันทึกเหตุการณ์ + การเรียก RPC ด้วยตนเอง (`status`, `health`, `models.list`)
- Logs: live tail ของไฟล์บันทึกของ gateway พร้อมการกรอง/ส่งออก (`logs.tail`)
- อัปเดต: รันการอัปเดต package/git + รีสตาร์ท (`update.run`) พร้อมรายงานการรีสตาร์ท

หมายเหตุสำหรับแผงงาน Cron:

- สำหรับงานแบบ isolated การส่งจะตั้งค่าเริ่มต้นเป็นประกาศสรุป คุณสามารถสลับเป็นไม่มีได้หากต้องการให้รันภายในเท่านั้น
- ฟิลด์ channel/target จะแสดงเมื่อเลือก announce
- โหมด Webhook ใช้ `delivery.mode = "webhook"` โดยตั้งค่า `delivery.to` เป็น URL Webhook HTTP(S) ที่ถูกต้อง
- สำหรับงาน main-session จะมีโหมดการส่งแบบ webhook และ none ให้ใช้
- ตัวควบคุมการแก้ไขขั้นสูงรวมถึง delete-after-run, การล้าง agent override, ตัวเลือก cron แบบ exact/stagger,
  การ override model/thinking ของเอเจนต์ และสวิตช์ best-effort delivery
- การตรวจสอบฟอร์มจะทำแบบ inline พร้อมข้อผิดพลาดระดับฟิลด์; ค่าที่ไม่ถูกต้องจะปิดปุ่มบันทึกจนกว่าจะแก้ไข
- ตั้งค่า `cron.webhookToken` เพื่อส่ง bearer token เฉพาะได้ หากไม่ระบุ Webhook จะถูกส่งโดยไม่มีส่วนหัว auth
- fallback ที่เลิกใช้แล้ว: งานแบบเก่าที่เก็บไว้ด้วย `notify: true` ยังสามารถใช้ `cron.webhook` ได้จนกว่าจะย้ายข้อมูลเสร็จ

## พฤติกรรมของ Chat

- `chat.send` เป็นแบบ **ไม่บล็อก**: จะตอบรับทันทีด้วย `{ runId, status: "started" }` และคำตอบจะสตรีมผ่านเหตุการณ์ `chat`
- การส่งซ้ำด้วย `idempotencyKey` เดิมจะคืนค่า `{ status: "in_flight" }` ระหว่างที่กำลังรัน และ `{ status: "ok" }` หลังจากเสร็จสิ้น
- การตอบกลับของ `chat.history` มีการจำกัดขนาดเพื่อความปลอดภัยของ UI เมื่อรายการในทรานสคริปต์มีขนาดใหญ่เกินไป Gateway อาจตัดทอนฟิลด์ข้อความยาว ละบล็อกเมทาดาต้าหนัก ๆ และแทนข้อความที่ใหญ่เกินไปด้วย placeholder (`[chat.history omitted: message too large]`)
- `chat.history` ยังลบแท็ก directive แบบ inline ที่ใช้เพื่อการแสดงผลเท่านั้นออกจากข้อความผู้ช่วยที่มองเห็นได้ (เช่น `[[reply_to_*]]` และ `[[audio_as_voice]]`), เพย์โหลด XML ของการเรียกใช้เครื่องมือแบบข้อความล้วน (รวมถึง `<tool_call>...</tool_call>`, `<function_call>...</function_call>`, `<tool_calls>...</tool_calls>`, `<function_calls>...</function_calls>` และบล็อกการเรียกใช้เครื่องมือที่ถูกตัดทอน), รวมถึง token ควบคุมโมเดลแบบ ASCII/เต็มความกว้างที่รั่วออกมา และจะละรายการของผู้ช่วยที่ข้อความที่มองเห็นได้ทั้งหมดมีเพียง token เงียบตรงตัว `NO_REPLY` / `no_reply`
- `chat.inject` จะต่อท้ายหมายเหตุของผู้ช่วยลงในทรานสคริปต์ของเซสชันและกระจายเหตุการณ์ `chat` สำหรับการอัปเดตเฉพาะ UI (ไม่มีการรันเอเจนต์ ไม่มีการส่งไปยัง channel)
- ตัวเลือก model และ thinking ในส่วนหัวของแชตจะ patch เซสชันที่ใช้งานอยู่ทันทีผ่าน `sessions.patch`; สิ่งเหล่านี้เป็นการ override ถาวรของเซสชัน ไม่ใช่ตัวเลือกส่งแบบใช้แค่หนึ่งเทิร์น
- หยุด:
  - คลิก **Stop** (เรียก `chat.abort`)
  - พิมพ์ `/stop` (หรือวลีหยุดแบบสแตนด์อโลน เช่น `stop`, `stop action`, `stop run`, `stop openclaw`, `please stop`) เพื่อยกเลิกแบบ out-of-band
  - `chat.abort` รองรับ `{ sessionKey }` (ไม่มี `runId`) เพื่อยกเลิกการรันที่ใช้งานอยู่ทั้งหมดสำหรับเซสชันนั้น
- การเก็บบางส่วนเมื่อยกเลิก:
  - เมื่อการรันถูกยกเลิก ข้อความผู้ช่วยบางส่วนยังอาจแสดงใน UI
  - Gateway จะคงข้อความผู้ช่วยบางส่วนที่ถูกยกเลิกไว้ในประวัติทรานสคริปต์เมื่อมีเอาต์พุตที่บัฟเฟอร์ไว้
  - รายการที่คงไว้จะมีเมทาดาต้าการยกเลิกเพื่อให้ตัวใช้ทรานสคริปต์แยกแยะข้อความบางส่วนจากการยกเลิกกับเอาต์พุตที่เสร็จสมบูรณ์ตามปกติได้

## Hosted embeds

ข้อความของผู้ช่วยสามารถเรนเดอร์เว็บคอนเทนต์ที่โฮสต์ไว้แบบ inline ได้ด้วย shortcode `[embed ...]`
นโยบาย sandbox ของ iframe ถูกควบคุมโดย
`gateway.controlUi.embedSandbox`:

- `strict`: ปิดการทำงานของสคริปต์ภายใน hosted embeds
- `scripts`: อนุญาตให้มี embeds แบบโต้ตอบได้โดยยังคงการแยก origin; นี่คือ
  ค่าเริ่มต้น และโดยทั่วไปก็เพียงพอสำหรับเกม/วิดเจ็ตบนเบราว์เซอร์ที่มีองค์ประกอบในตัว
- `trusted`: เพิ่ม `allow-same-origin` บน `allow-scripts` สำหรับเอกสารไซต์เดียวกัน
  ที่ตั้งใจให้ต้องใช้สิทธิ์ที่มากกว่า

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

ใช้ `trusted` เฉพาะเมื่อเอกสารที่ฝังไว้ต้องการพฤติกรรมแบบ same-origin จริง ๆ
สำหรับเกมและแคนวาสแบบโต้ตอบที่เอเจนต์สร้างขึ้นส่วนใหญ่ `scripts` เป็น
ตัวเลือกที่ปลอดภัยกว่า

URL embed ภายนอกแบบ absolute `http(s)` จะยังถูกบล็อกเป็นค่าเริ่มต้น หากคุณ
ตั้งใจให้ `[embed url="https://..."]` โหลดหน้าเว็บของบุคคลที่สาม ให้ตั้งค่า
`gateway.controlUi.allowExternalEmbedUrls: true`

## การเข้าถึงผ่าน Tailnet (แนะนำ)

### Tailscale Serve แบบรวมในตัว (แนะนำ)

ให้ Gateway อยู่บน loopback และให้ Tailscale Serve ทำหน้าที่พร็อกซีให้ผ่าน HTTPS:

```bash
openclaw gateway --tailscale serve
```

เปิด:

- `https://<magicdns>/` (หรือ `gateway.controlUi.basePath` ที่คุณตั้งค่าไว้)

โดยค่าเริ่มต้น คำขอ Serve ของ Control UI/WebSocket สามารถยืนยันตัวตนผ่านส่วนหัวข้อมูลตัวตนของ Tailscale
(`tailscale-user-login`) ได้เมื่อ `gateway.auth.allowTailscale` เป็น `true` OpenClaw
จะตรวจสอบตัวตนโดย resolve ที่อยู่ `x-forwarded-for` ด้วย
`tailscale whois` และจับคู่กับส่วนหัว และจะยอมรับเฉพาะเมื่อ
คำขอมาถึง loopback พร้อมส่วนหัว `x-forwarded-*` ของ Tailscale เท่านั้น ตั้งค่า
`gateway.auth.allowTailscale: false` หากคุณต้องการบังคับให้ใช้ข้อมูลรับรอง shared-secret อย่างชัดเจน
แม้กับทราฟฟิกของ Serve จากนั้นใช้ `gateway.auth.mode: "token"` หรือ
`"password"`
สำหรับเส้นทางตัวตนของ Serve แบบ async นั้น ความพยายามยืนยันตัวตนที่ล้มเหลวจาก IP ไคลเอนต์เดียวกัน
และขอบเขต auth เดียวกันจะถูกจัดลำดับก่อนการเขียน rate-limit ดังนั้นการลองผิดพร้อมกัน
จากเบราว์เซอร์เดียวกันอาจแสดง `retry later` ในคำขอที่สอง แทนที่จะเป็นความไม่ตรงกันปกติสองครั้งที่แข่งกันแบบขนาน
การยืนยันตัวตนแบบ Serve ที่ไม่มีโทเค็นตั้งอยู่บนสมมติฐานว่าโฮสต์ gateway เชื่อถือได้ หากมีโค้ดภายในเครื่องที่ไม่น่าเชื่อถืออาจรันบนโฮสต์นั้น ให้บังคับใช้การยืนยันตัวตนด้วย token/password

### bind กับ tailnet + token

```bash
openclaw gateway --bind tailnet --token "$(openssl rand -hex 32)"
```

จากนั้นเปิด:

- `http://<tailscale-ip>:18789/` (หรือ `gateway.controlUi.basePath` ที่คุณตั้งค่าไว้)

วาง shared secret ที่ตรงกันลงใน UI settings (ส่งเป็น
`connect.params.auth.token` หรือ `connect.params.auth.password`)

## HTTP ที่ไม่ปลอดภัย

หากคุณเปิดแดชบอร์ดผ่าน HTTP แบบไม่เข้ารหัส (`http://<lan-ip>` หรือ `http://<tailscale-ip>`),
เบราว์เซอร์จะทำงานใน **บริบทที่ไม่ปลอดภัย** และบล็อก WebCrypto โดยค่าเริ่มต้น
OpenClaw จะ **บล็อก** การเชื่อมต่อของ Control UI ที่ไม่มีตัวตนอุปกรณ์

ข้อยกเว้นที่มีเอกสารระบุไว้:

- ความเข้ากันได้ของ HTTP แบบไม่ปลอดภัยสำหรับ localhost เท่านั้นด้วย `gateway.controlUi.allowInsecureAuth=true`
- การยืนยันตัวตนของผู้ปฏิบัติงาน Control UI ที่สำเร็จผ่าน `gateway.auth.mode: "trusted-proxy"`
- ตัวเลือกฉุกเฉิน `gateway.controlUi.dangerouslyDisableDeviceAuth=true`

**วิธีแก้ที่แนะนำ:** ใช้ HTTPS (Tailscale Serve) หรือเปิด UI ภายในเครื่อง:

- `https://<magicdns>/` (Serve)
- `http://127.0.0.1:18789/` (บนโฮสต์ gateway)

**พฤติกรรมของสวิตช์ insecure-auth:**

```json5
{
  gateway: {
    controlUi: { allowInsecureAuth: true },
    bind: "tailnet",
    auth: { mode: "token", token: "replace-me" },
  },
}
```

`allowInsecureAuth` เป็นสวิตช์ความเข้ากันได้ภายในเครื่องเท่านั้น:

- อนุญาตให้เซสชัน Control UI บน localhost ดำเนินการต่อได้โดยไม่มีตัวตนอุปกรณ์ใน
  บริบท HTTP ที่ไม่ปลอดภัย
- ไม่ข้ามการตรวจสอบการจับคู่
- ไม่ผ่อนคลายข้อกำหนดตัวตนอุปกรณ์สำหรับการเชื่อมต่อระยะไกล (ที่ไม่ใช่ localhost)

**ใช้เฉพาะกรณีฉุกเฉินเท่านั้น:**

```json5
{
  gateway: {
    controlUi: { dangerouslyDisableDeviceAuth: true },
    bind: "tailnet",
    auth: { mode: "token", token: "replace-me" },
  },
}
```

`dangerouslyDisableDeviceAuth` จะปิดการตรวจสอบตัวตนอุปกรณ์ของ Control UI และเป็นการลดระดับความปลอดภัยอย่างรุนแรง ควรย้อนกลับโดยเร็วหลังใช้ในกรณีฉุกเฉิน

หมายเหตุเกี่ยวกับ trusted-proxy:

- การยืนยันตัวตนผ่าน trusted-proxy ที่สำเร็จสามารถอนุญาตเซสชัน Control UI ของ **operator** ได้โดยไม่มีตัวตนอุปกรณ์
- แต่สิ่งนี้ **ไม่** ครอบคลุมถึงเซสชัน Control UI ที่มีบทบาทเป็น node
- reverse proxy แบบ loopback บนโฮสต์เดียวกันก็ยังไม่ผ่านการยืนยันตัวตนแบบ trusted-proxy; ดู
  [Trusted Proxy Auth](/th/gateway/trusted-proxy-auth)

ดู [Tailscale](/th/gateway/tailscale) สำหรับคำแนะนำในการตั้งค่า HTTPS

## นโยบาย Content Security Policy

Control UI มาพร้อมนโยบาย `img-src` ที่เข้มงวด: อนุญาตเฉพาะแอสเซ็ตแบบ **same-origin** และ URL `data:` เท่านั้น URL รูปภาพระยะไกลแบบ `http(s)` และแบบ protocol-relative จะถูกเบราว์เซอร์ปฏิเสธและจะไม่เกิดการดึงข้อมูลเครือข่าย

ในทางปฏิบัติหมายความว่า:

- รูปประจำตัวและรูปภาพที่ให้บริการภายใต้พาธแบบ relative (เช่น `/avatars/<id>`) ยังคงแสดงผลได้
- URL แบบ inline `data:image/...` ยังคงแสดงผลได้ (มีประโยชน์สำหรับเพย์โหลดภายในโปรโตคอล)
- URL รูปประจำตัวระยะไกลที่ส่งมาจากเมทาดาต้าของ channel จะถูกตัดออกโดยตัวช่วยจัดการรูปประจำตัวของ Control UI และแทนที่ด้วยโลโก้/ป้ายในตัว ดังนั้น channel ที่ถูกเจาะหรือเป็นอันตรายจะไม่สามารถบังคับให้เบราว์เซอร์ของ operator ดึงรูปภาพระยะไกลตามอำเภอใจได้

คุณไม่ต้องเปลี่ยนแปลงอะไรเพื่อให้ได้พฤติกรรมนี้ — มันเปิดใช้งานอยู่เสมอและไม่สามารถกำหนดค่าได้

## การยืนยันตัวตนของเส้นทาง avatar

เมื่อมีการตั้งค่า gateway auth ปลายทาง avatar ของ Control UI จะต้องใช้โทเค็น gateway เดียวกันกับ API ส่วนที่เหลือ:

- `GET /avatar/<agentId>` จะส่งคืนรูป avatar ให้เฉพาะผู้เรียกที่ยืนยันตัวตนแล้วเท่านั้น `GET /avatar/<agentId>?meta=1` จะส่งคืนเมทาดาต้าของ avatar ภายใต้กฎเดียวกัน
- คำขอที่ไม่ได้ยืนยันตัวตนไปยังทั้งสองเส้นทางจะถูกปฏิเสธ (สอดคล้องกับเส้นทาง assistant-media ที่เป็นคู่กัน) เพื่อป้องกันไม่ให้เส้นทาง avatar รั่วไหลข้อมูลตัวตนของเอเจนต์บนโฮสต์ที่มีการป้องกันในส่วนอื่นอยู่แล้ว
- ตัว Control UI เองจะส่งต่อโทเค็น gateway เป็น bearer header เมื่อดึง avatars และใช้ blob URL ที่ยืนยันตัวตนแล้วเพื่อให้รูปภาพยังคงแสดงในแดชบอร์ดได้

หากคุณปิด gateway auth (ไม่แนะนำบนโฮสต์ที่ใช้ร่วมกัน) เส้นทาง avatar ก็จะกลายเป็นแบบไม่ต้องยืนยันตัวตนเช่นกัน สอดคล้องกับส่วนอื่นของ gateway

## การ build UI

Gateway ให้บริการไฟล์สแตติกจาก `dist/control-ui` สร้างไฟล์เหล่านี้ด้วย:

```bash
pnpm ui:build
```

base แบบ absolute ที่ไม่บังคับ (เมื่อต้องการ URL แอสเซ็ตแบบคงที่):

```bash
OPENCLAW_CONTROL_UI_BASE_PATH=/openclaw/ pnpm ui:build
```

สำหรับการพัฒนาในเครื่อง (dev server แยกต่างหาก):

```bash
pnpm ui:dev
```

จากนั้นชี้ UI ไปที่ URL ของ Gateway WS ของคุณ (เช่น `ws://127.0.0.1:18789`)

## การดีบัก/ทดสอบ: dev server + Gateway ระยะไกล

Control UI เป็นไฟล์สแตติก; เป้าหมาย WebSocket สามารถกำหนดค่าได้และอาจ
ต่างจากต้นทาง HTTP ก็ได้ สิ่งนี้มีประโยชน์เมื่อคุณต้องการใช้ Vite dev server
ในเครื่อง แต่ Gateway รันอยู่ที่อื่น

1. เริ่ม UI dev server: `pnpm ui:dev`
2. เปิด URL ลักษณะนี้:

```text
http://localhost:5173/?gatewayUrl=ws://<gateway-host>:18789
```

การยืนยันตัวตนแบบใช้ครั้งเดียวที่ไม่บังคับ (หากจำเป็น):

```text
http://localhost:5173/?gatewayUrl=wss://<gateway-host>:18789#token=<gateway-token>
```

หมายเหตุ:

- `gatewayUrl` จะถูกเก็บไว้ใน localStorage หลังโหลดเสร็จและถูกลบออกจาก URL
- ควรส่ง `token` ผ่าน URL fragment (`#token=...`) เมื่อเป็นไปได้ Fragments จะไม่ถูกส่งไปยังเซิร์ฟเวอร์ ซึ่งช่วยหลีกเลี่ยงการรั่วไหลใน request log และ Referer พารามิเตอร์ query แบบเดิม `?token=` ยังคงถูกนำเข้าได้หนึ่งครั้งเพื่อความเข้ากันได้ แต่ใช้เป็น fallback เท่านั้น และจะถูกลบทันทีหลัง bootstrap
- `password` จะถูกเก็บไว้ในหน่วยความจำเท่านั้น
- เมื่อมีการตั้งค่า `gatewayUrl` UI จะไม่ fallback ไปใช้ข้อมูลรับรองจาก config หรือ environment
  ให้ระบุ `token` (หรือ `password`) อย่างชัดเจน การไม่มีข้อมูลรับรองที่ระบุชัดเจนถือเป็นข้อผิดพลาด
- ใช้ `wss://` เมื่อ Gateway อยู่หลัง TLS (Tailscale Serve, HTTPS proxy เป็นต้น)
- `gatewayUrl` จะยอมรับได้เฉพาะในหน้าต่างระดับบนสุดเท่านั้น (ไม่ใช่แบบฝัง) เพื่อป้องกัน clickjacking
- การ deploy Control UI ที่ไม่ใช่ loopback ต้องตั้งค่า `gateway.controlUi.allowedOrigins`
  อย่างชัดเจน (เป็น origin แบบเต็ม) ซึ่งรวมถึงการตั้งค่า dev ระยะไกลด้วย
- อย่าใช้ `gateway.controlUi.allowedOrigins: ["*"]` ยกเว้นสำหรับการทดสอบภายในเครื่อง
  ที่ควบคุมอย่างเข้มงวด เพราะมันหมายถึงอนุญาต browser origin ใดก็ได้ ไม่ใช่ “ให้ตรงกับโฮสต์ใดก็ตามที่ฉัน
  ใช้อยู่”
- `gateway.controlUi.dangerouslyAllowHostHeaderOriginFallback=true` จะเปิดใช้
  โหมด Host-header origin fallback แต่เป็นโหมดความปลอดภัยที่อันตราย

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

รายละเอียดการตั้งค่าการเข้าถึงระยะไกล: [การเข้าถึงระยะไกล](/th/gateway/remote)

## ที่เกี่ยวข้อง

- [Dashboard](/th/web/dashboard) — แดชบอร์ดของ gateway
- [WebChat](/th/web/webchat) — อินเทอร์เฟซแชตบนเบราว์เซอร์
- [TUI](/th/web/tui) — อินเทอร์เฟซผู้ใช้แบบเทอร์มินัล
- [Health Checks](/th/gateway/health) — การตรวจสอบสถานะสุขภาพของ gateway
