---
read_when:
    - การจับคู่หรือเชื่อมต่อ Android node ใหม่อีกครั้ง
    - การดีบักการค้นพบ Gateway หรือ auth บน Android
    - การตรวจสอบความสอดคล้องของประวัติแชตข้ามไคลเอนต์
summary: 'แอป Android (node): คู่มือการเชื่อมต่อ + พื้นผิวคำสั่งของ Connect/Chat/Voice/Canvas'
title: แอป Android
x-i18n:
    generated_at: "2026-04-23T05:43:55Z"
    model: gpt-5.4
    provider: openai
    source_hash: 2223891afc3aa34af4aaf5410b4f1c6aebcf24bab68a6c47dd9832882d5260db
    source_path: platforms/android.md
    workflow: 15
---

# แอป Android (node)

> **หมายเหตุ:** แอป Android ยังไม่ได้เผยแพร่สู่สาธารณะในตอนนี้ ซอร์สโค้ดมีอยู่ใน [OpenClaw repository](https://github.com/openclaw/openclaw) ภายใต้ `apps/android` คุณสามารถ build ได้เองโดยใช้ Java 17 และ Android SDK (`./gradlew :app:assemblePlayDebug`) ดูวิธี build ได้ที่ [apps/android/README.md](https://github.com/openclaw/openclaw/blob/main/apps/android/README.md)

## ภาพรวมการรองรับ

- บทบาท: แอป node คู่หู (Android ไม่ได้โฮสต์ Gateway)
- ต้องมี Gateway: ใช่ (รันบน macOS, Linux หรือ Windows ผ่าน WSL2)
- การติดตั้ง: [Getting Started](/th/start/getting-started) + [Pairing](/th/channels/pairing)
- Gateway: [Runbook](/th/gateway) + [Configuration](/th/gateway/configuration)
  - Protocols: [Gateway protocol](/th/gateway/protocol) (nodes + control plane)

## การควบคุมระบบ

การควบคุมระบบ (launchd/systemd) อยู่บนโฮสต์ของ Gateway ดู [Gateway](/th/gateway)

## คู่มือการเชื่อมต่อ

แอป Android node ⇄ (mDNS/NSD + WebSocket) ⇄ **Gateway**

Android เชื่อมต่อโดยตรงกับ Gateway WebSocket และใช้ device pairing (`role: node`)

สำหรับ Tailscale หรือโฮสต์สาธารณะ Android ต้องใช้ endpoint ที่ปลอดภัย:

- แนะนำ: Tailscale Serve / Funnel พร้อม `https://<magicdns>` / `wss://<magicdns>`
- รองรับด้วยเช่นกัน: Gateway URL แบบ `wss://` อื่นใดก็ตามที่มี TLS endpoint จริง
- `ws://` แบบ cleartext ยังคงรองรับบน private LAN addresses / โฮสต์ `.local` รวมถึง `localhost`, `127.0.0.1` และ Android emulator bridge (`10.0.2.2`)

### สิ่งที่ต้องมีล่วงหน้า

- คุณสามารถรัน Gateway บนเครื่อง “master” ได้
- อุปกรณ์/emulator Android สามารถเข้าถึง gateway WebSocket ได้:
  - อยู่บน LAN เดียวกันพร้อม mDNS/NSD **หรือ**
  - อยู่บน Tailscale tailnet เดียวกันโดยใช้ Wide-Area Bonjour / unicast DNS-SD (ดูด้านล่าง) **หรือ**
  - ระบุ gateway host/port เองด้วยมือ (fallback)
- การจับคู่ผ่านมือถือแบบ tailnet/public จะ **ไม่** ใช้ raw tailnet IP `ws://` endpoints ให้ใช้ Tailscale Serve หรือ `wss://` URL แบบอื่นแทน
- คุณสามารถรัน CLI (`openclaw`) บนเครื่อง gateway ได้ (หรือผ่าน SSH)

### 1) เริ่ม Gateway

```bash
openclaw gateway --port 18789 --verbose
```

ยืนยันใน logs ว่าคุณเห็นข้อความประมาณนี้:

- `listening on ws://0.0.0.0:18789`

สำหรับการเข้าถึง Android ระยะไกลผ่าน Tailscale ให้เลือก Serve/Funnel แทน raw tailnet bind:

```bash
openclaw gateway --tailscale serve
```

สิ่งนี้จะให้ secure endpoint แบบ `wss://` / `https://` แก่ Android การตั้งค่า `gateway.bind: "tailnet"` แบบ plain อย่างเดียวไม่เพียงพอสำหรับการจับคู่ Android ระยะไกลครั้งแรก เว้นแต่คุณจะทำ TLS termination แยกเองด้วย

### 2) ตรวจสอบการค้นพบ (ไม่บังคับ)

จากเครื่อง gateway:

```bash
dns-sd -B _openclaw-gw._tcp local.
```

หมายเหตุการดีบักเพิ่มเติม: [Bonjour](/th/gateway/bonjour)

หากคุณตั้งค่า wide-area discovery domain ไว้ด้วย ให้เปรียบเทียบกับ:

```bash
openclaw gateway discover --json
```

คำสั่งนี้จะแสดงทั้ง `local.` และ wide-area domain ที่ตั้งค่าไว้ในครั้งเดียว และใช้
service endpoint ที่ resolve แล้ว แทนการใช้เพียงคำใบ้จาก TXT

#### การค้นพบผ่าน tailnet (Vienna ⇄ London) ด้วย unicast DNS-SD

การค้นพบของ Android NSD/mDNS จะไม่ข้ามเครือข่าย หาก Android node กับ gateway อยู่คนละเครือข่าย แต่เชื่อมต่อกันผ่าน Tailscale ให้ใช้ Wide-Area Bonjour / unicast DNS-SD แทน

การค้นพบเพียงอย่างเดียวไม่เพียงพอสำหรับการจับคู่ Android แบบ tailnet/public เส้นทางที่ค้นพบแล้วยังต้องใช้ secure endpoint (`wss://` หรือ Tailscale Serve) อยู่ดี:

1. ตั้งค่า DNS-SD zone (ตัวอย่าง `openclaw.internal.`) บนโฮสต์ gateway และเผยแพร่ `_openclaw-gw._tcp` records
2. ตั้งค่า Tailscale split DNS สำหรับโดเมนที่คุณเลือกให้ชี้ไปยัง DNS server นั้น

รายละเอียดและตัวอย่าง CoreDNS config: [Bonjour](/th/gateway/bonjour)

### 3) เชื่อมต่อจาก Android

ในแอป Android:

- แอปจะคงการเชื่อมต่อกับ gateway ไว้ผ่าน **foreground service** (การแจ้งเตือนแบบคงอยู่)
- เปิดแท็บ **Connect**
- ใช้โหมด **Setup Code** หรือ **Manual**
- หากการค้นพบถูกบล็อก ให้ใช้ host/port แบบ manual ใน **Advanced controls** สำหรับโฮสต์ private LAN ยังใช้ `ws://` ได้ สำหรับโฮสต์ Tailscale/public ให้เปิด TLS และใช้ endpoint แบบ `wss://` / Tailscale Serve

หลังจากจับคู่สำเร็จครั้งแรก Android จะเชื่อมต่อใหม่อัตโนมัติเมื่อเปิดแอป:

- manual endpoint (ถ้าเปิดใช้) มิฉะนั้น
- gateway ตัวล่าสุดที่ค้นพบ (best-effort)

### 4) อนุมัติการจับคู่ (CLI)

บนเครื่อง gateway:

```bash
openclaw devices list
openclaw devices approve <requestId>
openclaw devices reject <requestId>
```

รายละเอียดการจับคู่: [Pairing](/th/channels/pairing)

### 5) ตรวจสอบว่า node เชื่อมต่ออยู่

- ผ่านสถานะของ nodes:

  ```bash
  openclaw nodes status
  ```

- ผ่าน Gateway:

  ```bash
  openclaw gateway call node.list --params "{}"
  ```

### 6) แชต + ประวัติ

แท็บ Chat ของ Android รองรับการเลือก session (ค่าเริ่มต้นคือ `main` รวมถึง sessions อื่นที่มีอยู่):

- ประวัติ: `chat.history` (ผ่านการ normalize เพื่อแสดงผล; inline directive tags จะ
  ถูกตัดออกจากข้อความที่มองเห็น, เพย์โหลด XML ของ tool-call แบบข้อความล้วน
  (รวมถึง `<tool_call>...</tool_call>`, `<function_call>...</function_call>`,
  `<tool_calls>...</tool_calls>`, `<function_calls>...</function_calls>` และ
  บล็อก tool-call ที่ถูกตัดทอน) และ model control tokens แบบ ASCII/full-width ที่หลุดออกมา
  จะถูกตัดออก, แถวของ assistant ที่เป็น silent-token ล้วน เช่น `NO_REPLY` /
  `no_reply` แบบตรงตัวจะถูกละไว้, และแถวที่ใหญ่เกินไปอาจถูกแทนด้วย placeholders)
- ส่ง: `chat.send`
- อัปเดตแบบ push (best-effort): `chat.subscribe` → `event:"chat"`

### 7) Canvas + กล้อง

#### Gateway Canvas Host (แนะนำสำหรับเนื้อหาเว็บ)

หากคุณต้องการให้ node แสดง HTML/CSS/JS จริงที่เอเจนต์สามารถแก้ไขบนดิสก์ได้ ให้ชี้ node ไปยัง Gateway canvas host

หมายเหตุ: nodes จะโหลด canvas จากเซิร์ฟเวอร์ HTTP ของ Gateway (พอร์ตเดียวกับ `gateway.port`, ค่าเริ่มต้น `18789`)

1. สร้าง `~/.openclaw/workspace/canvas/index.html` บนโฮสต์ gateway

2. สั่งให้ node นำทางไปยังไฟล์นั้น (LAN):

```bash
openclaw nodes invoke --node "<Android Node>" --command canvas.navigate --params '{"url":"http://<gateway-hostname>.local:18789/__openclaw__/canvas/"}'
```

Tailnet (ไม่บังคับ): หากทั้งสองอุปกรณ์อยู่บน Tailscale ให้ใช้ชื่อ MagicDNS หรือ tailnet IP แทน `.local` เช่น `http://<gateway-magicdns>:18789/__openclaw__/canvas/`

เซิร์ฟเวอร์นี้จะ inject live-reload client เข้าไปใน HTML และรีโหลดเมื่อไฟล์เปลี่ยน
A2UI host อยู่ที่ `http://<gateway-host>:18789/__openclaw__/a2ui/`

คำสั่ง Canvas (เฉพาะตอนอยู่ foreground):

- `canvas.eval`, `canvas.snapshot`, `canvas.navigate` (ใช้ `{"url":""}` หรือ `{"url":"/"}` เพื่อกลับไปยัง scaffold ค่าเริ่มต้น) `canvas.snapshot` จะคืน `{ format, base64 }` (ค่าเริ่มต้น `format="jpeg"`)
- A2UI: `canvas.a2ui.push`, `canvas.a2ui.reset` (`canvas.a2ui.pushJSONL` เป็น legacy alias)

คำสั่งกล้อง (เฉพาะตอนอยู่ foreground; มีเกตด้านสิทธิ์):

- `camera.snap` (jpg)
- `camera.clip` (mp4)

ดู [Camera node](/th/nodes/camera) สำหรับพารามิเตอร์และตัวช่วย CLI

### 8) Voice + พื้นผิวคำสั่ง Android แบบขยาย

- Voice: Android ใช้โฟลว์ไมค์เปิด/ปิดแบบเดียวในแท็บ Voice พร้อมการจับทรานสคริปต์และการเล่นกลับผ่าน `talk.speak` ระบบจะใช้ local system TTS เฉพาะเมื่อ `talk.speak` ใช้ไม่ได้ Voice จะหยุดเมื่อแอปออกจาก foreground
- ตอนนี้ตัวสลับ voice wake/talk-mode ถูกนำออกจาก UX/runtime ของ Android แล้ว
- กลุ่มคำสั่ง Android เพิ่มเติม (การพร้อมใช้งานขึ้นกับอุปกรณ์ + สิทธิ์):
  - `device.status`, `device.info`, `device.permissions`, `device.health`
  - `notifications.list`, `notifications.actions` (ดู [Notification forwarding](#notification-forwarding) ด้านล่าง)
  - `photos.latest`
  - `contacts.search`, `contacts.add`
  - `calendar.events`, `calendar.add`
  - `callLog.search`
  - `sms.search`
  - `motion.activity`, `motion.pedometer`

## จุดเริ่มต้นของ assistant

Android รองรับการเปิด OpenClaw จาก system assistant trigger (Google
Assistant) เมื่อกำหนดค่าไว้ การกดปุ่มโฮมค้างไว้หรือพูดว่า "Hey Google, ask
OpenClaw..." จะเปิดแอปและส่งพรอมป์ต์เข้าไปยังตัวเขียนข้อความแชต

สิ่งนี้ใช้ metadata ของ Android **App Actions** ที่ประกาศไว้ใน manifest ของแอป ไม่ต้องมีการตั้งค่าเพิ่มเติมฝั่ง gateway — assistant intent จะถูกจัดการโดยแอป Android ทั้งหมด และถูกส่งต่อเป็นข้อความแชตปกติ

<Note>
ความพร้อมใช้งานของ App Actions ขึ้นกับอุปกรณ์ เวอร์ชันของ Google Play Services
และว่าผู้ใช้ได้ตั้ง OpenClaw เป็นแอป assistant เริ่มต้นหรือไม่
</Note>

## Notification forwarding

Android สามารถส่งต่อการแจ้งเตือนของอุปกรณ์ไปยัง gateway ในรูปของ events ได้ โดยมีตัวควบคุมหลายอย่างให้กำหนดขอบเขตว่า notification ใดจะถูกส่งต่อและเมื่อใด

| คีย์                             | ชนิด           | คำอธิบาย                                                                                     |
| -------------------------------- | -------------- | --------------------------------------------------------------------------------------------- |
| `notifications.allowPackages`    | string[]       | ส่งต่อเฉพาะ notifications จาก package names เหล่านี้ หากตั้งค่าไว้ packages อื่นทั้งหมดจะถูกเพิกเฉย |
| `notifications.denyPackages`     | string[]       | ห้ามส่งต่อ notifications จาก package names เหล่านี้โดยเด็ดขาด โดยจะมีผลหลัง `allowPackages`        |
| `notifications.quietHours.start` | string (HH:mm) | เวลาเริ่มต้นของช่วง quiet hours (ตามเวลาท้องถิ่นของอุปกรณ์) notifications จะถูกกดระหว่างช่วงนี้ |
| `notifications.quietHours.end`   | string (HH:mm) | เวลาสิ้นสุดของช่วง quiet hours                                                                |
| `notifications.rateLimit`        | number         | จำนวน notifications สูงสุดต่อ package ต่อนาทีที่จะส่งต่อได้ ส่วนที่เกินจะถูกทิ้ง                   |

ตัวเลือก notification ยังใช้พฤติกรรมที่ปลอดภัยขึ้นสำหรับ forwarded notification events เพื่อป้องกันการส่งต่อ notifications ของระบบที่อ่อนไหวโดยไม่ได้ตั้งใจ

ตัวอย่างการตั้งค่า:

```json5
{
  notifications: {
    allowPackages: ["com.slack", "com.whatsapp"],
    denyPackages: ["com.android.systemui"],
    quietHours: {
      start: "22:00",
      end: "07:00",
    },
    rateLimit: 5,
  },
}
```

<Note>
การส่งต่อ notifications ต้องใช้สิทธิ์ Android Notification Listener โดยแอปจะขอสิทธิ์นี้ระหว่างการตั้งค่า
</Note>
