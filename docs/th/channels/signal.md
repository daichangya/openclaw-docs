---
read_when:
    - การตั้งค่าการรองรับ Signal
    - การดีบักการส่ง/รับของ Signal
summary: การรองรับ Signal ผ่าน signal-cli (JSON-RPC + SSE), พาธการตั้งค่า และโมเดลหมายเลขโทรศัพท์
title: Signal
x-i18n:
    generated_at: "2026-04-23T05:27:17Z"
    model: gpt-5.4
    provider: openai
    source_hash: cdd855eb353aca6a1c2b04d14af0e3da079349297b54fa8243562c52b29118d9
    source_path: channels/signal.md
    workflow: 15
---

# Signal (signal-cli)

สถานะ: การผสานรวม CLI ภายนอก Gateway สื่อสารกับ `signal-cli` ผ่าน HTTP JSON-RPC + SSE

## ข้อกำหนดเบื้องต้น

- ติดตั้ง OpenClaw บนเซิร์ฟเวอร์ของคุณแล้ว (โฟลว์ Linux ด้านล่างทดสอบบน Ubuntu 24)
- มี `signal-cli` อยู่บนโฮสต์ที่ Gateway ทำงาน
- หมายเลขโทรศัพท์ที่สามารถรับ SMS ยืนยันตัวตนได้หนึ่งครั้ง (สำหรับเส้นทางการลงทะเบียนด้วย SMS)
- เข้าถึงเบราว์เซอร์สำหรับ captcha ของ Signal (`signalcaptchas.org`) ระหว่างการลงทะเบียน

## การตั้งค่าอย่างรวดเร็ว (สำหรับผู้เริ่มต้น)

1. ใช้ **หมายเลข Signal แยกต่างหาก** สำหรับบอต (แนะนำ)
2. ติดตั้ง `signal-cli` (ต้องใช้ Java หากคุณใช้ build แบบ JVM)
3. เลือกหนึ่งเส้นทางการตั้งค่า:
   - **Path A (ลิงก์ด้วย QR):** `signal-cli link -n "OpenClaw"` แล้วสแกนด้วย Signal
   - **Path B (ลงทะเบียนด้วย SMS):** ลงทะเบียนหมายเลขเฉพาะสำหรับบอตด้วย captcha + การยืนยันทาง SMS
4. กำหนดค่า OpenClaw แล้วรีสตาร์ต Gateway
5. ส่ง DM แรกและอนุมัติ pairing (`openclaw pairing approve signal <CODE>`)

config ขั้นต่ำ:

```json5
{
  channels: {
    signal: {
      enabled: true,
      account: "+15551234567",
      cliPath: "signal-cli",
      dmPolicy: "pairing",
      allowFrom: ["+15557654321"],
    },
  },
}
```

เอกสารอ้างอิงฟิลด์:

| ฟิลด์       | คำอธิบาย                                            |
| ----------- | --------------------------------------------------- |
| `account`   | หมายเลขโทรศัพท์ของบอตในรูปแบบ E.164 (`+15551234567`) |
| `cliPath`   | พาธไปยัง `signal-cli` (`signal-cli` หากอยู่ใน `PATH`) |
| `dmPolicy`  | นโยบายการเข้าถึง DM (แนะนำ `pairing`)               |
| `allowFrom` | หมายเลขโทรศัพท์หรือค่า `uuid:<id>` ที่ได้รับอนุญาตให้ส่ง DM |

## มันคืออะไร

- แชนเนล Signal ผ่าน `signal-cli` (ไม่ใช่ libsignal แบบฝังในตัว)
- การกำหนดเส้นทางแบบกำหนดแน่นอน: การตอบกลับจะย้อนกลับไปยัง Signal เสมอ
- DM ใช้เซสชันหลักของเอเจนต์ร่วมกัน; กลุ่มจะแยกกัน (`agent:<agentId>:signal:group:<groupId>`)

## การเขียน config

ตามค่าเริ่มต้น Signal ได้รับอนุญาตให้เขียนการอัปเดต config ที่ถูกเรียกโดย `/config set|unset` (ต้องใช้ `commands.config: true`)

ปิดใช้งานด้วย:

```json5
{
  channels: { signal: { configWrites: false } },
}
```

## โมเดลหมายเลขโทรศัพท์ (สำคัญ)

- Gateway เชื่อมต่อกับ **อุปกรณ์ Signal** (บัญชี `signal-cli`)
- หากคุณรันบอตบน **บัญชี Signal ส่วนตัวของคุณเอง** ระบบจะเพิกเฉยต่อข้อความของคุณเอง (การป้องกันลูป)
- หากต้องการให้เป็นลักษณะ "ฉันส่งข้อความหาบอตแล้วมันตอบกลับ" ให้ใช้ **หมายเลขบอตแยกต่างหาก**

## เส้นทางการตั้งค่า A: ลิงก์บัญชี Signal ที่มีอยู่แล้ว (QR)

1. ติดตั้ง `signal-cli` (build แบบ JVM หรือ native)
2. ลิงก์บัญชีบอต:
   - `signal-cli link -n "OpenClaw"` แล้วสแกน QR ใน Signal
3. กำหนดค่า Signal และเริ่ม Gateway

ตัวอย่าง:

```json5
{
  channels: {
    signal: {
      enabled: true,
      account: "+15551234567",
      cliPath: "signal-cli",
      dmPolicy: "pairing",
      allowFrom: ["+15557654321"],
    },
  },
}
```

รองรับหลายบัญชี: ใช้ `channels.signal.accounts` พร้อม config รายบัญชีและ `name` แบบทางเลือก ดู [`gateway/configuration`](/th/gateway/configuration-reference#multi-account-all-channels) สำหรับรูปแบบที่ใช้ร่วมกัน

## เส้นทางการตั้งค่า B: ลงทะเบียนหมายเลขบอตเฉพาะ (SMS, Linux)

ใช้วิธีนี้เมื่อคุณต้องการหมายเลขบอตเฉพาะแทนการลิงก์บัญชีแอป Signal ที่มีอยู่

1. เตรียมหมายเลขที่สามารถรับ SMS ได้ (หรือการยืนยันด้วยเสียงสำหรับโทรศัพท์บ้าน)
   - ใช้หมายเลขบอตเฉพาะเพื่อหลีกเลี่ยงความขัดแย้งของบัญชี/เซสชัน
2. ติดตั้ง `signal-cli` บนโฮสต์ของ Gateway:

```bash
VERSION=$(curl -Ls -o /dev/null -w %{url_effective} https://github.com/AsamK/signal-cli/releases/latest | sed -e 's/^.*\/v//')
curl -L -O "https://github.com/AsamK/signal-cli/releases/download/v${VERSION}/signal-cli-${VERSION}-Linux-native.tar.gz"
sudo tar xf "signal-cli-${VERSION}-Linux-native.tar.gz" -C /opt
sudo ln -sf /opt/signal-cli /usr/local/bin/
signal-cli --version
```

หากคุณใช้ build แบบ JVM (`signal-cli-${VERSION}.tar.gz`) ให้ติดตั้ง JRE 25+ ก่อน
ควรอัปเดต `signal-cli` อยู่เสมอ; upstream ระบุว่า release เก่าอาจใช้งานไม่ได้เมื่อ API ฝั่งเซิร์ฟเวอร์ของ Signal เปลี่ยนแปลง

3. ลงทะเบียนและยืนยันหมายเลข:

```bash
signal-cli -a +<BOT_PHONE_NUMBER> register
```

หากจำเป็นต้องใช้ captcha:

1. เปิด `https://signalcaptchas.org/registration/generate.html`
2. ทำ captcha ให้เสร็จ แล้วคัดลอกลิงก์เป้าหมาย `signalcaptcha://...` จาก "Open Signal"
3. หากเป็นไปได้ ให้รันจาก IP ภายนอกเดียวกับเซสชันในเบราว์เซอร์
4. รันการลงทะเบียนอีกครั้งทันที (โทเค็น captcha หมดอายุเร็ว):

```bash
signal-cli -a +<BOT_PHONE_NUMBER> register --captcha '<SIGNALCAPTCHA_URL>'
signal-cli -a +<BOT_PHONE_NUMBER> verify <VERIFICATION_CODE>
```

4. กำหนดค่า OpenClaw รีสตาร์ต Gateway และตรวจสอบแชนเนล:

```bash
# หากคุณรัน Gateway เป็นบริการ systemd ระดับผู้ใช้:
systemctl --user restart openclaw-gateway.service

# จากนั้นตรวจสอบ:
openclaw doctor
openclaw channels status --probe
```

5. ทำ pairing กับผู้ส่ง DM ของคุณ:
   - ส่งข้อความใดก็ได้ไปยังหมายเลขบอต
   - อนุมัติรหัสบนเซิร์ฟเวอร์: `openclaw pairing approve signal <PAIRING_CODE>`
   - บันทึกหมายเลขบอตเป็นรายชื่อผู้ติดต่อบนโทรศัพท์ของคุณเพื่อหลีกเลี่ยง "Unknown contact"

สำคัญ: การลงทะเบียนบัญชีหมายเลขโทรศัพท์ด้วย `signal-cli` อาจทำให้เซสชันแอป Signal หลักของหมายเลขนั้นหลุดการยืนยันตัวตน ควรใช้หมายเลขบอตเฉพาะ หรือใช้โหมดลิงก์ด้วย QR หากคุณต้องการคงการตั้งค่าแอปในโทรศัพท์เดิมไว้

ข้อมูลอ้างอิง upstream:

- README ของ `signal-cli`: `https://github.com/AsamK/signal-cli`
- โฟลว์ captcha: `https://github.com/AsamK/signal-cli/wiki/Registration-with-captcha`
- โฟลว์การลิงก์: `https://github.com/AsamK/signal-cli/wiki/Linking-other-devices-(Provisioning)`

## โหมด daemon ภายนอก (`httpUrl`)

หากคุณต้องการจัดการ `signal-cli` เอง (เช่น JVM เริ่มเย็นช้า, container init หรือ CPU ใช้ร่วมกัน) ให้รัน daemon แยกต่างหากแล้วชี้ OpenClaw ไปที่มัน:

```json5
{
  channels: {
    signal: {
      httpUrl: "http://127.0.0.1:8080",
      autoStart: false,
    },
  },
}
```

วิธีนี้จะข้ามการสตาร์ตอัตโนมัติและการรอเริ่มต้นภายใน OpenClaw สำหรับกรณีเริ่มช้าเมื่อใช้การสตาร์ตอัตโนมัติ ให้ตั้งค่า `channels.signal.startupTimeoutMs`

## การควบคุมการเข้าถึง (DM + กลุ่ม)

DM:

- ค่าเริ่มต้น: `channels.signal.dmPolicy = "pairing"`
- ผู้ส่งที่ไม่รู้จักจะได้รับรหัส pairing; ข้อความจะถูกเพิกเฉยจนกว่าจะได้รับอนุมัติ (รหัสหมดอายุหลัง 1 ชั่วโมง)
- อนุมัติผ่าน:
  - `openclaw pairing list signal`
  - `openclaw pairing approve signal <CODE>`
- Pairing คือการแลกเปลี่ยนโทเค็นเริ่มต้นสำหรับ DM ของ Signal รายละเอียด: [Pairing](/th/channels/pairing)
- ผู้ส่งแบบ UUID-only (จาก `sourceUuid`) จะถูกเก็บเป็น `uuid:<id>` ใน `channels.signal.allowFrom`

กลุ่ม:

- `channels.signal.groupPolicy = open | allowlist | disabled`
- `channels.signal.groupAllowFrom` ควบคุมว่าใครสามารถทริกเกอร์ในกลุ่มได้เมื่อกำหนด `allowlist`
- `channels.signal.groups["<group-id>" | "*"]` สามารถแทนที่พฤติกรรมของกลุ่มด้วย `requireMention`, `tools` และ `toolsBySender`
- ใช้ `channels.signal.accounts.<id>.groups` สำหรับการแทนที่รายบัญชีในการตั้งค่าหลายบัญชี
- หมายเหตุด้าน runtime: หากไม่มี `channels.signal` เลย runtime จะ fallback เป็น `groupPolicy="allowlist"` สำหรับการตรวจสอบกลุ่ม (แม้ว่าจะมีการตั้งค่า `channels.defaults.groupPolicy` ก็ตาม)

## วิธีการทำงาน (พฤติกรรม)

- `signal-cli` ทำงานเป็น daemon; Gateway อ่าน event ผ่าน SSE
- ข้อความขาเข้าจะถูกทำให้เป็นมาตรฐานเข้าสู่ channel envelope ที่ใช้ร่วมกัน
- การตอบกลับจะถูกกำหนดเส้นทางกลับไปยังหมายเลขหรือกลุ่มเดิมเสมอ

## สื่อ + ขีดจำกัด

- ข้อความขาออกจะถูกแบ่งชังก์ตาม `channels.signal.textChunkLimit` (ค่าเริ่มต้น 4000)
- การแบ่งชังก์ตามบรรทัดใหม่แบบทางเลือก: ตั้งค่า `channels.signal.chunkMode="newline"` เพื่อแบ่งตามบรรทัดว่าง (ขอบเขตย่อหน้า) ก่อนการแบ่งตามความยาว
- รองรับไฟล์แนบ (ดึง base64 จาก `signal-cli`)
- ขีดจำกัดสื่อเริ่มต้น: `channels.signal.mediaMaxMb` (ค่าเริ่มต้น 8)
- ใช้ `channels.signal.ignoreAttachments` เพื่อข้ามการดาวน์โหลดสื่อ
- บริบทประวัติกลุ่มใช้ `channels.signal.historyLimit` (หรือ `channels.signal.accounts.*.historyLimit`) โดย fallback ไปที่ `messages.groupChat.historyLimit` ตั้งค่า `0` เพื่อปิดใช้งาน (ค่าเริ่มต้น 50)

## การพิมพ์ + ใบตอบรับการอ่าน

- **ตัวบ่งชี้การพิมพ์**: OpenClaw ส่งสัญญาณการพิมพ์ผ่าน `signal-cli sendTyping` และรีเฟรชสัญญาณเหล่านี้ระหว่างที่การตอบกลับกำลังทำงาน
- **ใบตอบรับการอ่าน**: เมื่อ `channels.signal.sendReadReceipts` เป็น true OpenClaw จะส่งต่อใบตอบรับการอ่านสำหรับ DM ที่ได้รับอนุญาต
- Signal-cli ไม่เปิดเผยใบตอบรับการอ่านสำหรับกลุ่ม

## Reaction (message tool)

- ใช้ `message action=react` กับ `channel=signal`
- เป้าหมาย: E.164 ของผู้ส่งหรือ UUID (ใช้ `uuid:<id>` จากเอาต์พุต pairing; UUID เปล่าก็ใช้ได้เช่นกัน)
- `messageId` คือ timestamp ของ Signal สำหรับข้อความที่คุณกำลังส่ง reaction ให้
- reaction ในกลุ่มต้องใช้ `targetAuthor` หรือ `targetAuthorUuid`

ตัวอย่าง:

```
message action=react channel=signal target=uuid:123e4567-e89b-12d3-a456-426614174000 messageId=1737630212345 emoji=🔥
message action=react channel=signal target=+15551234567 messageId=1737630212345 emoji=🔥 remove=true
message action=react channel=signal target=signal:group:<groupId> targetAuthor=uuid:<sender-uuid> messageId=1737630212345 emoji=✅
```

config:

- `channels.signal.actions.reactions`: เปิด/ปิดใช้งาน action แบบ reaction (ค่าเริ่มต้น true)
- `channels.signal.reactionLevel`: `off | ack | minimal | extensive`
  - `off`/`ack` ปิดใช้งาน reaction ของเอเจนต์ (message tool `react` จะเกิดข้อผิดพลาด)
  - `minimal`/`extensive` เปิดใช้งาน reaction ของเอเจนต์และกำหนดระดับคำแนะนำ
- การแทนที่รายบัญชี: `channels.signal.accounts.<id>.actions.reactions`, `channels.signal.accounts.<id>.reactionLevel`

## เป้าหมายการส่ง (CLI/Cron)

- DM: `signal:+15551234567` (หรือ E.164 แบบปกติ)
- UUID DM: `uuid:<id>` (หรือ UUID เปล่า)
- กลุ่ม: `signal:group:<groupId>`
- ชื่อผู้ใช้: `username:<name>` (หากบัญชี Signal ของคุณรองรับ)

## การแก้ไขปัญหา

ให้รันลำดับนี้ก่อน:

```bash
openclaw status
openclaw gateway status
openclaw logs --follow
openclaw doctor
openclaw channels status --probe
```

จากนั้นยืนยันสถานะ pairing ของ DM หากจำเป็น:

```bash
openclaw pairing list signal
```

ปัญหาที่พบบ่อย:

- เข้าถึง daemon ได้แต่ไม่มีการตอบกลับ: ตรวจสอบการตั้งค่าบัญชี/daemon (`httpUrl`, `account`) และโหมดการรับ
- DM ถูกเพิกเฉย: ผู้ส่งยังรอการอนุมัติ pairing
- ข้อความกลุ่มถูกเพิกเฉย: การควบคุมผู้ส่ง/การ mention ของกลุ่มบล็อกการส่ง
- ข้อผิดพลาดการตรวจสอบ config หลังการแก้ไข: รัน `openclaw doctor --fix`
- ไม่พบ Signal ในการวินิจฉัย: ยืนยัน `channels.signal.enabled: true`

การตรวจสอบเพิ่มเติม:

```bash
openclaw pairing list signal
pgrep -af signal-cli
grep -i "signal" "/tmp/openclaw/openclaw-$(date +%Y-%m-%d).log" | tail -20
```

สำหรับโฟลว์การคัดแยกปัญหา: [/channels/troubleshooting](/th/channels/troubleshooting)

## หมายเหตุด้านความปลอดภัย

- `signal-cli` จัดเก็บคีย์บัญชีไว้ในเครื่อง (โดยทั่วไปคือ `~/.local/share/signal-cli/data/`)
- สำรองสถานะบัญชี Signal ก่อนย้ายเซิร์ฟเวอร์หรือสร้างใหม่
- คง `channels.signal.dmPolicy: "pairing"` ไว้ เว้นแต่คุณต้องการเปิดสิทธิ์ DM กว้างกว่านั้นโดยชัดเจน
- การยืนยันผ่าน SMS จำเป็นเฉพาะสำหรับโฟลว์การลงทะเบียนหรือกู้คืน แต่การสูญเสียการควบคุมหมายเลข/บัญชีอาจทำให้การลงทะเบียนใหม่ซับซ้อนขึ้น

## เอกสารอ้างอิงการกำหนดค่า (Signal)

การกำหนดค่าแบบเต็ม: [Configuration](/th/gateway/configuration)

ตัวเลือกของผู้ให้บริการ:

- `channels.signal.enabled`: เปิด/ปิดการเริ่มต้นแชนเนล
- `channels.signal.account`: E.164 สำหรับบัญชีบอต
- `channels.signal.cliPath`: พาธไปยัง `signal-cli`
- `channels.signal.httpUrl`: URL แบบเต็มของ daemon (ใช้แทน host/port)
- `channels.signal.httpHost`, `channels.signal.httpPort`: bind ของ daemon (ค่าเริ่มต้น 127.0.0.1:8080)
- `channels.signal.autoStart`: สตาร์ต daemon อัตโนมัติ (ค่าเริ่มต้น true หากไม่ได้ตั้งค่า `httpUrl`)
- `channels.signal.startupTimeoutMs`: timeout การรอเริ่มต้นเป็นมิลลิวินาที (สูงสุด 120000)
- `channels.signal.receiveMode`: `on-start | manual`
- `channels.signal.ignoreAttachments`: ข้ามการดาวน์โหลดไฟล์แนบ
- `channels.signal.ignoreStories`: เพิกเฉยต่อสตอรี่จาก daemon
- `channels.signal.sendReadReceipts`: ส่งต่อใบตอบรับการอ่าน
- `channels.signal.dmPolicy`: `pairing | allowlist | open | disabled` (ค่าเริ่มต้น: pairing)
- `channels.signal.allowFrom`: allowlist ของ DM (E.164 หรือ `uuid:<id>`). `open` ต้องใช้ `"*"`. Signal ไม่มี username; ให้ใช้หมายเลขโทรศัพท์/UUID
- `channels.signal.groupPolicy`: `open | allowlist | disabled` (ค่าเริ่มต้น: allowlist)
- `channels.signal.groupAllowFrom`: allowlist ของผู้ส่งในกลุ่ม
- `channels.signal.groups`: การแทนที่รายกลุ่มโดยคีย์ด้วย Signal group id (หรือ `"*"`). ฟิลด์ที่รองรับ: `requireMention`, `tools`, `toolsBySender`
- `channels.signal.accounts.<id>.groups`: เวอร์ชันรายบัญชีของ `channels.signal.groups` สำหรับการตั้งค่าหลายบัญชี
- `channels.signal.historyLimit`: จำนวนข้อความกลุ่มสูงสุดที่จะรวมเป็นบริบท (0 คือปิดใช้งาน)
- `channels.signal.dmHistoryLimit`: ขีดจำกัดประวัติ DM ในหน่วย user turn การแทนที่รายผู้ใช้: `channels.signal.dms["<phone_or_uuid>"].historyLimit`
- `channels.signal.textChunkLimit`: ขนาดชังก์ขาออก (อักขระ)
- `channels.signal.chunkMode`: `length` (ค่าเริ่มต้น) หรือ `newline` เพื่อแบ่งตามบรรทัดว่าง (ขอบเขตย่อหน้า) ก่อนการแบ่งตามความยาว
- `channels.signal.mediaMaxMb`: ขีดจำกัดสื่อขาเข้า/ขาออก (MB)

ตัวเลือกส่วนกลางที่เกี่ยวข้อง:

- `agents.list[].groupChat.mentionPatterns` (Signal ไม่รองรับการ mention แบบเนทีฟ)
- `messages.groupChat.mentionPatterns` (fallback ส่วนกลาง)
- `messages.responsePrefix`

## ที่เกี่ยวข้อง

- [ภาพรวมแชนเนล](/th/channels) — แชนเนลที่รองรับทั้งหมด
- [Pairing](/th/channels/pairing) — การยืนยันตัวตนผ่าน DM และโฟลว์ pairing
- [กลุ่ม](/th/channels/groups) — พฤติกรรมของแชตกลุ่มและการควบคุมด้วยการ mention
- [การกำหนดเส้นทางแชนเนล](/th/channels/channel-routing) — การกำหนดเส้นทางเซสชันสำหรับข้อความ
- [ความปลอดภัย](/th/gateway/security) — โมเดลการเข้าถึงและการเสริมความแข็งแกร่งด้านความปลอดภัย
