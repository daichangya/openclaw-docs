---
read_when:
    - การตั้งค่าการรองรับ Signal
    - การแก้ปัญหาการส่ง/รับของ Signal
summary: การรองรับ Signal ผ่าน signal-cli (JSON-RPC + SSE), เส้นทางการตั้งค่า และโมเดลหมายเลขโทรศัพท์
title: Signal
x-i18n:
    generated_at: "2026-04-24T08:59:44Z"
    model: gpt-5.4
    provider: openai
    source_hash: 8fb4f08f8607dbe923fdc24d9599623165e1f1268c7fc48ecb457ce3d61172d2
    source_path: channels/signal.md
    workflow: 15
---

# Signal (`signal-cli`)

สถานะ: การเชื่อมต่อ CLI ภายนอก Gateway สื่อสารกับ `signal-cli` ผ่าน HTTP JSON-RPC + SSE

## ข้อกำหนดเบื้องต้น

- ติดตั้ง OpenClaw บนเซิร์ฟเวอร์ของคุณแล้ว (ขั้นตอนสำหรับ Linux ด้านล่างทดสอบบน Ubuntu 24)
- มี `signal-cli` พร้อมใช้งานบนโฮสต์ที่ gateway ทำงานอยู่
- มีหมายเลขโทรศัพท์ที่สามารถรับ SMS ยืนยันตัวตนได้หนึ่งครั้ง (สำหรับเส้นทางการลงทะเบียนผ่าน SMS)
- เข้าถึงเบราว์เซอร์สำหรับ captcha ของ Signal (`signalcaptchas.org`) ระหว่างการลงทะเบียน

## การตั้งค่าอย่างรวดเร็ว (สำหรับผู้เริ่มต้น)

1. ใช้ **หมายเลข Signal แยกต่างหาก** สำหรับบอต (แนะนำ)
2. ติดตั้ง `signal-cli` (ต้องมี Java หากคุณใช้รุ่น JVM)
3. เลือกหนึ่งเส้นทางการตั้งค่า:
   - **เส้นทาง A (ลิงก์ QR):** `signal-cli link -n "OpenClaw"` แล้วสแกนด้วย Signal
   - **เส้นทาง B (ลงทะเบียนผ่าน SMS):** ลงทะเบียนหมายเลขเฉพาะสำหรับบอตด้วย captcha + การยืนยันตัวตนผ่าน SMS
4. กำหนดค่า OpenClaw แล้วรีสตาร์ต gateway
5. ส่ง DM แรกและอนุมัติการจับคู่ (`openclaw pairing approve signal <CODE>`)

คอนฟิกขั้นต่ำ:

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

ข้อมูลอ้างอิงฟิลด์:

| ฟิลด์       | คำอธิบาย                                                |
| ----------- | ------------------------------------------------------- |
| `account`   | หมายเลขโทรศัพท์ของบอตในรูปแบบ E.164 (`+15551234567`)    |
| `cliPath`   | พาธไปยัง `signal-cli` (`signal-cli` หากอยู่ใน `PATH`)    |
| `dmPolicy`  | นโยบายการเข้าถึง DM (แนะนำให้ใช้ `pairing`)             |
| `allowFrom` | หมายเลขโทรศัพท์หรือค่า `uuid:<id>` ที่ได้รับอนุญาตให้ส่ง DM |

## สิ่งนี้คืออะไร

- ช่องทาง Signal ผ่าน `signal-cli` (ไม่ใช่ libsignal แบบฝังในระบบ)
- การ route แบบกำหนดแน่นอน: คำตอบจะถูกส่งกลับไปที่ Signal เสมอ
- DM ใช้ main session ของเอเจนต์ร่วมกัน; กลุ่มจะถูกแยกออก (`agent:<agentId>:signal:group:<groupId>`)

## การเขียนคอนฟิก

โดยค่าปริยาย Signal ได้รับอนุญาตให้เขียนอัปเดตคอนฟิกที่ถูกทริกเกอร์โดย `/config set|unset` (ต้องใช้ `commands.config: true`)

ปิดใช้งานด้วย:

```json5
{
  channels: { signal: { configWrites: false } },
}
```

## โมเดลหมายเลขโทรศัพท์ (สำคัญ)

- gateway เชื่อมต่อกับ **อุปกรณ์** Signal (บัญชี `signal-cli`)
- หากคุณรันบอตบน **บัญชี Signal ส่วนตัวของคุณเอง** ระบบจะละเลยข้อความของคุณเอง (การป้องกันลูป)
- หากต้องการให้ “ฉันส่งข้อความหาบอตแล้วบอตตอบกลับ” ให้ใช้ **หมายเลขบอตแยกต่างหาก**

## เส้นทางการตั้งค่า A: ลิงก์บัญชี Signal ที่มีอยู่แล้ว (QR)

1. ติดตั้ง `signal-cli` (รุ่น JVM หรือ native)
2. ลิงก์บัญชีบอต:
   - `signal-cli link -n "OpenClaw"` แล้วสแกน QR ใน Signal
3. กำหนดค่า Signal และเริ่ม gateway

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

รองรับหลายบัญชี: ใช้ `channels.signal.accounts` พร้อมคอนฟิกรายบัญชีและ `name` แบบเลือกได้ ดู [`gateway/configuration`](/th/gateway/config-channels#multi-account-all-channels) สำหรับรูปแบบที่ใช้ร่วมกัน

## เส้นทางการตั้งค่า B: ลงทะเบียนหมายเลขบอตเฉพาะ (SMS, Linux)

ใช้วิธีนี้เมื่อคุณต้องการหมายเลขเฉพาะสำหรับบอตแทนการลิงก์บัญชีแอป Signal ที่มีอยู่

1. เตรียมหมายเลขที่สามารถรับ SMS ได้ (หรือรับการยืนยันทางเสียงสำหรับโทรศัพท์บ้าน)
   - ใช้หมายเลขเฉพาะสำหรับบอตเพื่อหลีกเลี่ยงความขัดแย้งของบัญชี/เซสชัน
2. ติดตั้ง `signal-cli` บนโฮสต์ gateway:

```bash
VERSION=$(curl -Ls -o /dev/null -w %{url_effective} https://github.com/AsamK/signal-cli/releases/latest | sed -e 's/^.*\/v//')
curl -L -O "https://github.com/AsamK/signal-cli/releases/download/v${VERSION}/signal-cli-${VERSION}-Linux-native.tar.gz"
sudo tar xf "signal-cli-${VERSION}-Linux-native.tar.gz" -C /opt
sudo ln -sf /opt/signal-cli /usr/local/bin/
signal-cli --version
```

หากคุณใช้รุ่น JVM (`signal-cli-${VERSION}.tar.gz`) ให้ติดตั้ง JRE 25+ ก่อน
ควรอัปเดต `signal-cli` ให้ใหม่อยู่เสมอ; เอกสารต้นน้ำระบุว่ารุ่นเก่าอาจใช้ไม่ได้เมื่อ API ของเซิร์ฟเวอร์ Signal เปลี่ยนแปลง

3. ลงทะเบียนและยืนยันหมายเลข:

```bash
signal-cli -a +<BOT_PHONE_NUMBER> register
```

หากจำเป็นต้องใช้ captcha:

1. เปิด `https://signalcaptchas.org/registration/generate.html`
2. ทำ captcha ให้เสร็จ แล้วคัดลอกเป้าหมายลิงก์ `signalcaptcha://...` จาก "Open Signal"
3. ควรรันจาก IP ภายนอกเดียวกับเซสชันเบราว์เซอร์ถ้าเป็นไปได้
4. รันการลงทะเบียนอีกครั้งทันที (โทเค็น captcha หมดอายุเร็ว):

```bash
signal-cli -a +<BOT_PHONE_NUMBER> register --captcha '<SIGNALCAPTCHA_URL>'
signal-cli -a +<BOT_PHONE_NUMBER> verify <VERIFICATION_CODE>
```

4. กำหนดค่า OpenClaw รีสตาร์ต gateway และตรวจสอบช่องทาง:

```bash
# หากคุณรัน gateway เป็นบริการ systemd ระดับผู้ใช้:
systemctl --user restart openclaw-gateway.service

# จากนั้นตรวจสอบ:
openclaw doctor
openclaw channels status --probe
```

5. จับคู่ผู้ส่ง DM ของคุณ:
   - ส่งข้อความใดก็ได้ไปยังหมายเลขบอต
   - อนุมัติรหัสบนเซิร์ฟเวอร์: `openclaw pairing approve signal <PAIRING_CODE>`
   - บันทึกหมายเลขบอตเป็นรายชื่อติดต่อบนโทรศัพท์ของคุณเพื่อหลีกเลี่ยง "Unknown contact"

ข้อสำคัญ: การลงทะเบียนบัญชีหมายเลขโทรศัพท์ด้วย `signal-cli` อาจทำให้เซสชันแอป Signal หลักของหมายเลขนั้นถูก de-authenticate ควรใช้หมายเลขบอตเฉพาะ หรือใช้โหมดลิงก์ QR หากคุณต้องการคงการตั้งค่าแอปโทรศัพท์เดิมไว้

ข้อมูลอ้างอิงต้นน้ำ:

- README ของ `signal-cli`: `https://github.com/AsamK/signal-cli`
- ขั้นตอน captcha: `https://github.com/AsamK/signal-cli/wiki/Registration-with-captcha`
- ขั้นตอนการลิงก์: `https://github.com/AsamK/signal-cli/wiki/Linking-other-devices-(Provisioning)`

## โหมด daemon ภายนอก (`httpUrl`)

หากคุณต้องการจัดการ `signal-cli` เอง (เช่น cold start ของ JVM ช้า, การเริ่มต้น container หรือใช้ CPU ร่วมกัน) ให้รัน daemon แยกต่างหากแล้วชี้ OpenClaw ไปที่ daemon นั้น:

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

วิธีนี้จะข้ามการสตาร์ตอัตโนมัติและการรอเริ่มทำงานภายใน OpenClaw สำหรับกรณีเริ่มช้าเมื่อใช้การสตาร์ตอัตโนมัติ ให้ตั้ง `channels.signal.startupTimeoutMs`

## การควบคุมการเข้าถึง (DM + กลุ่ม)

DM:

- ค่าปริยาย: `channels.signal.dmPolicy = "pairing"`
- ผู้ส่งที่ไม่รู้จักจะได้รับรหัสการจับคู่; ข้อความจะถูกละเลยจนกว่าจะได้รับอนุมัติ (รหัสหมดอายุหลัง 1 ชั่วโมง)
- อนุมัติผ่าน:
  - `openclaw pairing list signal`
  - `openclaw pairing approve signal <CODE>`
- การจับคู่คือการแลกเปลี่ยนโทเค็นค่าปริยายสำหรับ DM ของ Signal รายละเอียด: [Pairing](/th/channels/pairing)
- ผู้ส่งที่มีเฉพาะ UUID (จาก `sourceUuid`) จะถูกเก็บเป็น `uuid:<id>` ใน `channels.signal.allowFrom`

กลุ่ม:

- `channels.signal.groupPolicy = open | allowlist | disabled`
- `channels.signal.groupAllowFrom` ควบคุมว่าใครสามารถทริกเกอร์ในกลุ่มได้เมื่อกำหนด `allowlist`
- `channels.signal.groups["<group-id>" | "*"]` สามารถ override พฤติกรรมของกลุ่มด้วย `requireMention`, `tools` และ `toolsBySender`
- ใช้ `channels.signal.accounts.<id>.groups` สำหรับ override รายบัญชีในการตั้งค่าแบบหลายบัญชี
- หมายเหตุรันไทม์: หากไม่มี `channels.signal` เลย รันไทม์จะ fallback ไปใช้ `groupPolicy="allowlist"` สำหรับการตรวจสอบกลุ่ม (แม้จะตั้ง `channels.defaults.groupPolicy` ไว้ก็ตาม)

## วิธีการทำงาน (พฤติกรรม)

- `signal-cli` ทำงานเป็น daemon; gateway อ่านเหตุการณ์ผ่าน SSE
- ข้อความขาเข้าจะถูก normalize ให้อยู่ใน channel envelope ที่ใช้ร่วมกัน
- คำตอบจะถูก route กลับไปยังหมายเลขหรือกลุ่มเดิมเสมอ

## สื่อ + ข้อจำกัด

- ข้อความขาออกจะถูกแบ่งตาม `channels.signal.textChunkLimit` (ค่าปริยาย 4000)
- การแบ่งตามบรรทัดใหม่แบบเลือกได้: ตั้ง `channels.signal.chunkMode="newline"` เพื่อแบ่งที่บรรทัดว่าง (ขอบเขตย่อหน้า) ก่อนแบ่งตามความยาว
- รองรับไฟล์แนบ (ดึง base64 จาก `signal-cli`)
- ขีดจำกัดสื่อค่าปริยาย: `channels.signal.mediaMaxMb` (ค่าปริยาย 8)
- ใช้ `channels.signal.ignoreAttachments` เพื่อข้ามการดาวน์โหลดสื่อ
- บริบทประวัติกลุ่มใช้ `channels.signal.historyLimit` (หรือ `channels.signal.accounts.*.historyLimit`) โดย fallback ไปที่ `messages.groupChat.historyLimit` ตั้งค่าเป็น `0` เพื่อปิดใช้งาน (ค่าปริยาย 50)

## สถานะกำลังพิมพ์ + ใบตอบรับการอ่าน

- **ตัวบ่งชี้การกำลังพิมพ์**: OpenClaw ส่งสัญญาณกำลังพิมพ์ผ่าน `signal-cli sendTyping` และรีเฟรชระหว่างที่คำตอบกำลังรัน
- **ใบตอบรับการอ่าน**: เมื่อ `channels.signal.sendReadReceipts` เป็น true, OpenClaw จะส่งต่อใบตอบรับการอ่านสำหรับ DM ที่ได้รับอนุญาต
- Signal-cli ไม่เปิดเผยใบตอบรับการอ่านสำหรับกลุ่ม

## รีแอ็กชัน (message tool)

- ใช้ `message action=react` กับ `channel=signal`
- เป้าหมาย: E.164 ของผู้ส่งหรือ UUID (ใช้ `uuid:<id>` จากผลลัพธ์การจับคู่; UUID แบบไม่ใส่คำนำหน้าก็ใช้ได้เช่นกัน)
- `messageId` คือ timestamp ของ Signal สำหรับข้อความที่คุณกำลังจะใส่รีแอ็กชัน
- รีแอ็กชันในกลุ่มต้องใช้ `targetAuthor` หรือ `targetAuthorUuid`

ตัวอย่าง:

```
message action=react channel=signal target=uuid:123e4567-e89b-12d3-a456-426614174000 messageId=1737630212345 emoji=🔥
message action=react channel=signal target=+15551234567 messageId=1737630212345 emoji=🔥 remove=true
message action=react channel=signal target=signal:group:<groupId> targetAuthor=uuid:<sender-uuid> messageId=1737630212345 emoji=✅
```

คอนฟิก:

- `channels.signal.actions.reactions`: เปิด/ปิดแอ็กชันรีแอ็กชัน (ค่าปริยาย true)
- `channels.signal.reactionLevel`: `off | ack | minimal | extensive`
  - `off`/`ack` ปิดการใช้รีแอ็กชันของเอเจนต์ (`react` ใน message tool จะ error)
  - `minimal`/`extensive` เปิดใช้รีแอ็กชันของเอเจนต์และกำหนดระดับคำแนะนำ
- override รายบัญชี: `channels.signal.accounts.<id>.actions.reactions`, `channels.signal.accounts.<id>.reactionLevel`

## เป้าหมายการส่งต่อ (CLI/cron)

- DM: `signal:+15551234567` (หรือ E.164 แบบธรรมดา)
- DM แบบ UUID: `uuid:<id>` (หรือ UUID แบบธรรมดา)
- กลุ่ม: `signal:group:<groupId>`
- ชื่อผู้ใช้: `username:<name>` (หากบัญชี Signal ของคุณรองรับ)

## การแก้ปัญหา

ให้รันลำดับนี้ก่อน:

```bash
openclaw status
openclaw gateway status
openclaw logs --follow
openclaw doctor
openclaw channels status --probe
```

จากนั้นตรวจสอบสถานะการจับคู่ DM หากจำเป็น:

```bash
openclaw pairing list signal
```

ปัญหาที่พบบ่อย:

- เข้าถึง daemon ได้แต่ไม่มีคำตอบ: ตรวจสอบการตั้งค่าบัญชี/daemon (`httpUrl`, `account`) และโหมดการรับ
- DM ถูกละเลย: ผู้ส่งยังรอการอนุมัติการจับคู่
- ข้อความกลุ่มถูกละเลย: การควบคุมผู้ส่ง/การ mention ในกลุ่มบล็อกการส่งต่อ
- คอนฟิก validation error หลังแก้ไข: รัน `openclaw doctor --fix`
- ไม่มี Signal ในข้อมูลวินิจฉัย: ยืนยันว่า `channels.signal.enabled: true`

การตรวจสอบเพิ่มเติม:

```bash
openclaw pairing list signal
pgrep -af signal-cli
grep -i "signal" "/tmp/openclaw/openclaw-$(date +%Y-%m-%d).log" | tail -20
```

สำหรับขั้นตอนการ triage: [/channels/troubleshooting](/th/channels/troubleshooting)

## หมายเหตุด้านความปลอดภัย

- `signal-cli` จัดเก็บคีย์บัญชีไว้ในเครื่อง (โดยทั่วไปคือ `~/.local/share/signal-cli/data/`)
- สำรองข้อมูลสถานะบัญชี Signal ก่อนย้ายเซิร์ฟเวอร์หรือสร้างระบบใหม่
- คงค่า `channels.signal.dmPolicy: "pairing"` ไว้ เว้นแต่คุณต้องการเปิดการเข้าถึง DM ให้กว้างขึ้นอย่างชัดเจน
- การยืนยันตัวตนผ่าน SMS จำเป็นเฉพาะสำหรับการลงทะเบียนหรือการกู้คืน แต่การสูญเสียการควบคุมหมายเลข/บัญชีอาจทำให้การลงทะเบียนใหม่ซับซ้อนขึ้น

## ข้อมูลอ้างอิงคอนฟิก (Signal)

คอนฟิกทั้งหมด: [Configuration](/th/gateway/configuration)

ตัวเลือกผู้ให้บริการ:

- `channels.signal.enabled`: เปิด/ปิดการเริ่มต้นช่องทาง
- `channels.signal.account`: E.164 สำหรับบัญชีบอต
- `channels.signal.cliPath`: พาธไปยัง `signal-cli`
- `channels.signal.httpUrl`: URL แบบเต็มของ daemon (override host/port)
- `channels.signal.httpHost`, `channels.signal.httpPort`: การ bind ของ daemon (ค่าปริยาย 127.0.0.1:8080)
- `channels.signal.autoStart`: สตาร์ต daemon อัตโนมัติ (ค่าปริยาย true หากไม่ได้ตั้ง `httpUrl`)
- `channels.signal.startupTimeoutMs`: เวลารอเริ่มต้นเป็นมิลลิวินาที (ค่าสูงสุด 120000)
- `channels.signal.receiveMode`: `on-start | manual`
- `channels.signal.ignoreAttachments`: ข้ามการดาวน์โหลดไฟล์แนบ
- `channels.signal.ignoreStories`: ละเลย stories จาก daemon
- `channels.signal.sendReadReceipts`: ส่งต่อใบตอบรับการอ่าน
- `channels.signal.dmPolicy`: `pairing | allowlist | open | disabled` (ค่าปริยาย: pairing)
- `channels.signal.allowFrom`: allowlist สำหรับ DM (E.164 หรือ `uuid:<id>`) `open` ต้องใช้ `"*"` Signal ไม่มีชื่อผู้ใช้; ใช้หมายเลขโทรศัพท์/ID แบบ UUID
- `channels.signal.groupPolicy`: `open | allowlist | disabled` (ค่าปริยาย: allowlist)
- `channels.signal.groupAllowFrom`: allowlist ของผู้ส่งในกลุ่ม
- `channels.signal.groups`: override รายกลุ่มโดยอ้างอิงจาก group id ของ Signal (หรือ `"*"`) ฟิลด์ที่รองรับ: `requireMention`, `tools`, `toolsBySender`
- `channels.signal.accounts.<id>.groups`: เวอร์ชันรายบัญชีของ `channels.signal.groups` สำหรับการตั้งค่าแบบหลายบัญชี
- `channels.signal.historyLimit`: จำนวนข้อความกลุ่มสูงสุดที่จะรวมเป็นบริบท (`0` คือปิดใช้งาน)
- `channels.signal.dmHistoryLimit`: ขีดจำกัดประวัติ DM ในหน่วย user turn override รายผู้ใช้: `channels.signal.dms["<phone_or_uuid>"].historyLimit`
- `channels.signal.textChunkLimit`: ขนาดชังก์ขาออก (จำนวนอักขระ)
- `channels.signal.chunkMode`: `length` (ค่าปริยาย) หรือ `newline` เพื่อแบ่งที่บรรทัดว่าง (ขอบเขตย่อหน้า) ก่อนแบ่งตามความยาว
- `channels.signal.mediaMaxMb`: ขีดจำกัดสื่อขาเข้า/ขาออก (MB)

ตัวเลือกส่วนกลางที่เกี่ยวข้อง:

- `agents.list[].groupChat.mentionPatterns` (Signal ไม่รองรับ mention แบบเนทีฟ)
- `messages.groupChat.mentionPatterns` (fallback ส่วนกลาง)
- `messages.responsePrefix`

## ที่เกี่ยวข้อง

- [ภาพรวมช่องทาง](/th/channels) — ช่องทางทั้งหมดที่รองรับ
- [การจับคู่](/th/channels/pairing) — การยืนยันตัวตน DM และโฟลว์การจับคู่
- [Groups](/th/channels/groups) — พฤติกรรมแชตกลุ่มและการควบคุมการ mention
- [การ route ช่องทาง](/th/channels/channel-routing) — การ route เซสชันสำหรับข้อความ
- [Security](/th/gateway/security) — โมเดลการเข้าถึงและการเสริมความปลอดภัย
