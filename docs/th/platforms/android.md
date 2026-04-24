---
read_when:
    - การจับคู่หรือเชื่อมต่อ Node Android ใหม่อีกครั้ง
    - การแก้ปัญหาการค้นหา gateway หรือ auth บน Android
    - การตรวจสอบความสอดคล้องของประวัติแชตข้ามไคลเอนต์ სხვადასხვა clients
summary: 'แอป Android (Node): คู่มือการเชื่อมต่อ + พื้นผิวคำสั่งของ Connect/Chat/Voice/Canvas'
title: แอป Android
x-i18n:
    generated_at: "2026-04-24T09:20:57Z"
    model: gpt-5.4
    provider: openai
    source_hash: 31b538a5bf45e78fde34e77a31384295b3e96f2fff6b3adfe37e5c569d858472
    source_path: platforms/android.md
    workflow: 15
---

> **หมายเหตุ:** แอป Android ยังไม่ได้เปิดตัวสู่สาธารณะในขณะนี้ ซอร์สโค้ดมีอยู่ใน [OpenClaw repository](https://github.com/openclaw/openclaw) ภายใต้ `apps/android` คุณสามารถ build ได้เองโดยใช้ Java 17 และ Android SDK (`./gradlew :app:assemblePlayDebug`) ดูคำแนะนำในการ build ได้ที่ [apps/android/README.md](https://github.com/openclaw/openclaw/blob/main/apps/android/README.md)

## ภาพรวมการรองรับ

- บทบาท: แอป Node คู่หู (Android ไม่ได้โฮสต์ Gateway)
- ต้องใช้ Gateway: ใช่ (รันบน macOS, Linux หรือ Windows ผ่าน WSL2)
- การติดตั้ง: [Getting Started](/th/start/getting-started) + [Pairing](/th/channels/pairing)
- Gateway: [Runbook](/th/gateway) + [Configuration](/th/gateway/configuration)
  - โปรโตคอล: [Gateway protocol](/th/gateway/protocol) (Node + control plane)

## การควบคุมระบบ

การควบคุมระบบ (launchd/systemd) อยู่บนโฮสต์ Gateway ดู [Gateway](/th/gateway)

## คู่มือการเชื่อมต่อ

แอป Node Android ⇄ (mDNS/NSD + WebSocket) ⇄ **Gateway**

Android เชื่อมต่อโดยตรงกับ Gateway WebSocket และใช้การจับคู่อุปกรณ์ (`role: node`)

สำหรับ Tailscale หรือโฮสต์สาธารณะ Android ต้องใช้ endpoint ที่ปลอดภัย:

- แนะนำ: Tailscale Serve / Funnel ด้วย `https://<magicdns>` / `wss://<magicdns>`
- รองรับเช่นกัน: Gateway URL แบบ `wss://` อื่น ๆ ที่มี TLS endpoint จริง
- `ws://` แบบ cleartext ยังรองรับบนที่อยู่ private LAN / โฮสต์ `.local` รวมถึง `localhost`, `127.0.0.1` และ Android emulator bridge (`10.0.2.2`)

### ข้อกำหนดเบื้องต้น

- คุณสามารถรัน Gateway บนเครื่อง “master” ได้
- อุปกรณ์/อีมูเลเตอร์ Android สามารถเข้าถึง gateway WebSocket ได้:
  - อยู่ใน LAN เดียวกันพร้อม mDNS/NSD **หรือ**
  - อยู่ใน Tailscale tailnet เดียวกันโดยใช้ Wide-Area Bonjour / unicast DNS-SD (ดูด้านล่าง) **หรือ**
  - ระบุโฮสต์/พอร์ตของ gateway ด้วยตนเอง (fallback)
- การจับคู่มือถือผ่าน tailnet/สาธารณะจะ **ไม่** ใช้ raw tailnet IP `ws://` endpoint ให้ใช้ Tailscale Serve หรือ `wss://` URL อื่นแทน
- คุณสามารถรัน CLI (`openclaw`) บนเครื่อง gateway ได้ (หรือผ่าน SSH)

### 1) เริ่ม Gateway

```bash
openclaw gateway --port 18789 --verbose
```

ยืนยันใน log ว่าคุณเห็นข้อความประมาณนี้:

- `listening on ws://0.0.0.0:18789`

สำหรับการเข้าถึง Android ระยะไกลผ่าน Tailscale ควรใช้ Serve/Funnel แทน raw tailnet bind:

```bash
openclaw gateway --tailscale serve
```

วิธีนี้จะให้ Android ใช้ endpoint แบบ `wss://` / `https://` ที่ปลอดภัย การตั้งค่า `gateway.bind: "tailnet"` แบบธรรมดาเพียงอย่างเดียวไม่เพียงพอสำหรับการจับคู่ Android ระยะไกลครั้งแรก เว้นแต่คุณจะทำ TLS termination แยกต่างหากด้วย

### 2) ตรวจสอบการค้นพบ (ไม่บังคับ)

จากเครื่อง gateway:

```bash
dns-sd -B _openclaw-gw._tcp local.
```

หมายเหตุการดีบักเพิ่มเติม: [Bonjour](/th/gateway/bonjour)

หากคุณกำหนดค่า wide-area discovery domain ไว้ด้วย ให้เปรียบเทียบกับ:

```bash
openclaw gateway discover --json
```

คำสั่งนี้จะแสดงทั้ง `local.` และ wide-area domain ที่กำหนดค่าไว้ในครั้งเดียว และใช้
service endpoint ที่ resolve แล้ว แทนการใช้เพียง TXT-only hint

#### การค้นพบบน tailnet (Vienna ⇄ London) ผ่าน unicast DNS-SD

การค้นหาแบบ Android NSD/mDNS จะไม่ข้ามเครือข่าย หาก Android node และ gateway ของคุณอยู่คนละเครือข่ายแต่เชื่อมต่อกันผ่าน Tailscale ให้ใช้ Wide-Area Bonjour / unicast DNS-SD แทน

การค้นพบเพียงอย่างเดียวยังไม่เพียงพอสำหรับการจับคู่ Android ผ่าน tailnet/สาธารณะ เส้นทางที่ค้นพบได้ยังต้องใช้ endpoint ที่ปลอดภัย (`wss://` หรือ Tailscale Serve):

1. ตั้งค่า DNS-SD zone (ตัวอย่าง `openclaw.internal.`) บนโฮสต์ gateway และเผยแพร่ระเบียน `_openclaw-gw._tcp`
2. กำหนดค่า Tailscale split DNS สำหรับโดเมนที่คุณเลือกให้ชี้ไปยัง DNS server นั้น

รายละเอียดและตัวอย่างการกำหนดค่า CoreDNS: [Bonjour](/th/gateway/bonjour)

### 3) เชื่อมต่อจาก Android

ในแอป Android:

- แอปจะคงการเชื่อมต่อกับ gateway ไว้ผ่าน **foreground service** (การแจ้งเตือนแบบคงอยู่)
- เปิดแท็บ **Connect**
- ใช้โหมด **Setup Code** หรือ **Manual**
- หากการค้นหาถูกบล็อก ให้ใช้โฮสต์/พอร์ตแบบ manual ใน **Advanced controls** สำหรับโฮสต์ใน private LAN, `ws://` ยังใช้งานได้ สำหรับโฮสต์ผ่าน Tailscale/สาธารณะ ให้เปิด TLS และใช้ endpoint แบบ `wss://` / Tailscale Serve

หลังจากจับคู่สำเร็จครั้งแรก Android จะเชื่อมต่อใหม่อัตโนมัติเมื่อเปิดแอป:

- Manual endpoint (หากเปิดใช้) มิฉะนั้น
- gateway ที่ค้นพบล่าสุด (best-effort)

### 4) อนุมัติการจับคู่ (CLI)

บนเครื่อง gateway:

```bash
openclaw devices list
openclaw devices approve <requestId>
openclaw devices reject <requestId>
```

รายละเอียดการจับคู่: [Pairing](/th/channels/pairing)

### 5) ตรวจสอบว่า Node เชื่อมต่ออยู่

- ผ่านสถานะของ Node:

  ```bash
  openclaw nodes status
  ```

- ผ่าน Gateway:

  ```bash
  openclaw gateway call node.list --params "{}"
  ```

### 6) แชต + ประวัติ

แท็บ Chat บน Android รองรับการเลือกเซสชัน (ค่าปริยาย `main` รวมถึงเซสชันอื่นที่มีอยู่):

- ประวัติ: `chat.history` (normalize สำหรับการแสดงผล; inline directive tag จะถูกตัดออกจากข้อความที่มองเห็นได้, payload XML ของ tool-call แบบข้อความล้วน (รวมถึง `<tool_call>...</tool_call>`, `<function_call>...</function_call>`, `<tool_calls>...</tool_calls>`, `<function_calls>...</function_calls>` และบล็อก tool-call ที่ถูกตัดทอน) รวมถึง model control token แบบ ASCII/full-width ที่รั่วไหล จะถูกตัดออก, แถวของ assistant ที่เป็น silent-token ล้วน เช่น `NO_REPLY` / `no_reply` แบบตรงตัวจะถูกละเว้น, และแถวที่ใหญ่เกินไปอาจถูกแทนที่ด้วย placeholder)
- ส่ง: `chat.send`
- การอัปเดตแบบ push (best-effort): `chat.subscribe` → `event:"chat"`

### 7) Canvas + กล้อง

#### Gateway Canvas Host (แนะนำสำหรับเนื้อหาเว็บ)

หากคุณต้องการให้ Node แสดง HTML/CSS/JS จริงที่เอเจนต์สามารถแก้ไขบนดิสก์ได้ ให้ชี้ Node ไปที่ Gateway canvas host

หมายเหตุ: Node จะโหลด canvas จาก Gateway HTTP server (พอร์ตเดียวกับ `gateway.port`, ค่าปริยาย `18789`)

1. สร้าง `~/.openclaw/workspace/canvas/index.html` บนโฮสต์ gateway

2. นำทาง Node ไปยังตำแหน่งนั้น (LAN):

```bash
openclaw nodes invoke --node "<Android Node>" --command canvas.navigate --params '{"url":"http://<gateway-hostname>.local:18789/__openclaw__/canvas/"}'
```

Tailnet (ไม่บังคับ): หากอุปกรณ์ทั้งสองอยู่บน Tailscale ให้ใช้ชื่อ MagicDNS หรือ tailnet IP แทน `.local` เช่น `http://<gateway-magicdns>:18789/__openclaw__/canvas/`

เซิร์ฟเวอร์นี้จะ inject live-reload client เข้าไปใน HTML และ reload เมื่อไฟล์มีการเปลี่ยนแปลง
A2UI host อยู่ที่ `http://<gateway-host>:18789/__openclaw__/a2ui/`

คำสั่ง Canvas (ใช้งานได้เฉพาะเบื้องหน้า):

- `canvas.eval`, `canvas.snapshot`, `canvas.navigate` (ใช้ `{"url":""}` หรือ `{"url":"/"}` เพื่อกลับไปยัง scaffold ค่าปริยาย) `canvas.snapshot` จะคืนค่า `{ format, base64 }` (ค่าปริยาย `format="jpeg"`)
- A2UI: `canvas.a2ui.push`, `canvas.a2ui.reset` (`canvas.a2ui.pushJSONL` เป็น legacy alias)

คำสั่งกล้อง (ใช้งานได้เฉพาะเบื้องหน้า; ต้องมีสิทธิ์):

- `camera.snap` (jpg)
- `camera.clip` (mp4)

ดู [Camera node](/th/nodes/camera) สำหรับพารามิเตอร์และตัวช่วย CLI

### 8) Voice + พื้นผิวคำสั่ง Android ที่ขยายเพิ่มเติม

- Voice: Android ใช้โฟลว์เปิด/ปิดไมค์แบบเดียวในแท็บ Voice พร้อมการจับทรานสคริปต์และการเล่นกลับผ่าน `talk.speak` จะใช้ local system TTS เฉพาะเมื่อไม่มี `talk.speak` Voice จะหยุดเมื่อแอปออกจากเบื้องหน้า
- ขณะนี้ wake/talk-mode toggle ของ Voice ถูกนำออกจาก UX/runtime บน Android แล้ว
- กลุ่มคำสั่ง Android เพิ่มเติม (ความพร้อมใช้งานขึ้นอยู่กับอุปกรณ์ + สิทธิ์):
  - `device.status`, `device.info`, `device.permissions`, `device.health`
  - `notifications.list`, `notifications.actions` (ดู [Notification forwarding](#notification-forwarding) ด้านล่าง)
  - `photos.latest`
  - `contacts.search`, `contacts.add`
  - `calendar.events`, `calendar.add`
  - `callLog.search`
  - `sms.search`
  - `motion.activity`, `motion.pedometer`

## จุดเริ่มต้นจากผู้ช่วยระบบ

Android รองรับการเปิด OpenClaw จากตัวทริกเกอร์ผู้ช่วยของระบบ (Google
Assistant) เมื่อกำหนดค่าไว้ การกดปุ่มโฮมค้างหรือพูดว่า "Hey Google, ask
OpenClaw..." จะเปิดแอปและส่งพรอมป์เข้าสู่ช่องพิมพ์แชต

สิ่งนี้ใช้ metadata ของ Android **App Actions** ที่ประกาศไว้ใน manifest ของแอป โดยไม่ต้อง
กำหนดค่าเพิ่มเติมฝั่ง gateway — assistant intent จะถูกจัดการทั้งหมดโดย
แอป Android และส่งต่อในฐานะข้อความแชตปกติ

<Note>
ความพร้อมใช้งานของ App Actions ขึ้นอยู่กับอุปกรณ์ เวอร์ชันของ Google Play Services
และการที่ผู้ใช้ได้ตั้ง OpenClaw เป็นแอปผู้ช่วยเริ่มต้นหรือไม่
</Note>

## การส่งต่อการแจ้งเตือน

Android สามารถส่งต่อการแจ้งเตือนของอุปกรณ์ไปยัง gateway ในรูปแบบเหตุการณ์ได้ โดยมีตัวควบคุมหลายอย่างให้คุณกำหนดขอบเขตว่าจะส่งต่อการแจ้งเตือนใดและเมื่อใด

| คีย์                              | ประเภท         | คำอธิบาย                                                                                         |
| -------------------------------- | -------------- | ------------------------------------------------------------------------------------------------- |
| `notifications.allowPackages`    | string[]       | ส่งต่อเฉพาะการแจ้งเตือนจากชื่อ package เหล่านี้ หากตั้งค่าไว้ package อื่นทั้งหมดจะถูกละเลย |
| `notifications.denyPackages`     | string[]       | ห้ามส่งต่อการแจ้งเตือนจากชื่อ package เหล่านี้โดยเด็ดขาด โดยจะถูกใช้หลัง `allowPackages`      |
| `notifications.quietHours.start` | string (HH:mm) | จุดเริ่มต้นของช่วงเวลาเงียบ (เวลาท้องถิ่นของอุปกรณ์) การแจ้งเตือนจะถูกระงับในช่วงเวลานี้     |
| `notifications.quietHours.end`   | string (HH:mm) | จุดสิ้นสุดของช่วงเวลาเงียบ                                                                        |
| `notifications.rateLimit`        | number         | จำนวนการแจ้งเตือนสูงสุดที่ส่งต่อได้ต่อนาทีต่อ package การแจ้งเตือนที่เกินมาจะถูกทิ้ง          |

ตัวเลือกการแจ้งเตือนยังใช้พฤติกรรมที่ปลอดภัยยิ่งขึ้นสำหรับเหตุการณ์การแจ้งเตือนที่ถูกส่งต่อ เพื่อป้องกันการส่งต่อการแจ้งเตือนของระบบที่อ่อนไหวโดยไม่ตั้งใจ

ตัวอย่างการกำหนดค่า:

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
การส่งต่อการแจ้งเตือนต้องใช้สิทธิ์ Android Notification Listener แอปจะพรอมป์ขอสิทธิ์นี้ระหว่างการตั้งค่า
</Note>

## ที่เกี่ยวข้อง

- [แอป iOS](/th/platforms/ios)
- [Nodes](/th/nodes)
- [การแก้ปัญหา Android node](/th/nodes/troubleshooting)
