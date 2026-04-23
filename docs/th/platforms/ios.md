---
read_when:
    - การ pairing หรือเชื่อมต่อ Node บน iOS ใหม่
    - การรันแอป iOS จากซอร์ส
    - การดีบักการค้นพบ gateway หรือคำสั่ง canvas
summary: 'แอป Node บน iOS: เชื่อมต่อกับ Gateway, การ pairing, canvas และการแก้ไขปัญหา'
title: แอป iOS
x-i18n:
    generated_at: "2026-04-23T05:44:14Z"
    model: gpt-5.4
    provider: openai
    source_hash: f3e0a6e33e72d4c9f1f17ef70a1b67bae9ebe4a2dca16677ea6b28d0ddac1b4e
    source_path: platforms/ios.md
    workflow: 15
---

# แอป iOS (Node)

ความพร้อมใช้งาน: พรีวิวภายใน แอป iOS ยังไม่ได้เผยแพร่สู่สาธารณะ

## มันทำอะไรได้บ้าง

- เชื่อมต่อกับ Gateway ผ่าน WebSocket (LAN หรือ tailnet)
- เปิดเผยความสามารถของ Node: Canvas, Screen snapshot, Camera capture, Location, Talk mode, Voice wake
- รับคำสั่ง `node.invoke` และรายงาน event สถานะของ node

## ข้อกำหนด

- Gateway ที่กำลังทำงานบนอุปกรณ์อีกเครื่องหนึ่ง (macOS, Linux หรือ Windows ผ่าน WSL2)
- เส้นทางเครือข่าย:
  - อยู่ใน LAN เดียวกันผ่าน Bonjour **หรือ**
  - ผ่าน tailnet ด้วย unicast DNS-SD (ตัวอย่างโดเมน: `openclaw.internal.`) **หรือ**
  - host/port แบบกำหนดเองด้วยตนเอง (fallback)

## เริ่มต้นอย่างรวดเร็ว (pair + connect)

1. เริ่ม Gateway:

```bash
openclaw gateway --port 18789
```

2. ในแอป iOS เปิด Settings แล้วเลือก gateway ที่ค้นพบ (หรือเปิด Manual Host แล้วกรอก host/port)

3. อนุมัติคำขอ pairing บนโฮสต์ของ gateway:

```bash
openclaw devices list
openclaw devices approve <requestId>
```

หากแอปลองจับคู่ใหม่โดยมีรายละเอียด auth เปลี่ยนไป (role/scopes/public key)
คำขอที่รอดำเนินการก่อนหน้าจะถูกแทนที่ และจะสร้าง `requestId` ใหม่
ให้รัน `openclaw devices list` อีกครั้งก่อนอนุมัติ

4. ตรวจสอบการเชื่อมต่อ:

```bash
openclaw nodes status
openclaw gateway call node.list --params "{}"
```

## push แบบมี relay สำหรับ build ทางการ

build iOS ทางการที่แจกจ่ายจะใช้ push relay ภายนอกแทนการเผยแพร่ APNs token ดิบ
ไปยัง gateway

ข้อกำหนดฝั่ง Gateway:

```json5
{
  gateway: {
    push: {
      apns: {
        relay: {
          baseUrl: "https://relay.example.com",
        },
      },
    },
  },
}
```

โฟลว์ทำงานอย่างไร:

- แอป iOS ลงทะเบียนกับ relay โดยใช้ App Attest และ app receipt
- relay ส่งคืน relay handle แบบ opaque พร้อม send grant ที่กำหนดขอบเขตตามการลงทะเบียน
- แอป iOS ดึงข้อมูลตัวตนของ gateway ที่จับคู่ไว้และรวมเข้าไปในการลงทะเบียน relay ด้วย ดังนั้น registration แบบ relay-backed จะถูกมอบสิทธิ์ไปยัง gateway นั้นโดยเฉพาะ
- แอปส่งต่อ relay-backed registration นั้นไปยัง gateway ที่จับคู่ผ่าน `push.apns.register`
- gateway ใช้ relay handle ที่เก็บไว้นั้นสำหรับ `push.test`, background wake และ wake nudge
- relay base URL ของ gateway ต้องตรงกับ relay URL ที่ฝังอยู่ใน build iOS ทางการ/TestFlight
- หากภายหลังแอปเชื่อมต่อกับ gateway อื่น หรือ build ที่มี relay base URL ต่างออกไป แอปจะรีเฟรช relay registration แทนการใช้ binding เดิมซ้ำ

สิ่งที่ gateway **ไม่** ต้องใช้สำหรับเส้นทางนี้:

- ไม่ต้องใช้ relay token ระดับ deployment
- ไม่ต้องใช้ APNs key โดยตรงสำหรับการส่งแบบ relay-backed ของ build ทางการ/TestFlight

โฟลว์ที่ผู้ปฏิบัติการคาดว่าจะทำ:

1. ติดตั้ง build iOS ทางการ/TestFlight
2. ตั้งค่า `gateway.push.apns.relay.baseUrl` บน gateway
3. pair แอปเข้ากับ gateway และปล่อยให้เชื่อมต่อจนเสร็จ
4. แอปจะเผยแพร่ `push.apns.register` โดยอัตโนมัติหลังจากมี APNs token แล้ว เซสชันของผู้ปฏิบัติการเชื่อมต่ออยู่ และการลงทะเบียนกับ relay สำเร็จ
5. หลังจากนั้น `push.test`, reconnect wake และ wake nudge จะใช้ relay-backed registration ที่เก็บไว้ได้

หมายเหตุด้านความเข้ากันได้:

- `OPENCLAW_APNS_RELAY_BASE_URL` ยังใช้เป็น env override ชั่วคราวสำหรับ gateway ได้

## โฟลว์การยืนยันตัวตนและความเชื่อถือ

relay มีไว้เพื่อบังคับใช้ข้อจำกัดสองข้อที่ APNs-on-gateway แบบตรงไม่สามารถให้ได้
สำหรับ build iOS ทางการ:

- ใช้ relay แบบโฮสต์ได้เฉพาะ build iOS ของ OpenClaw ที่แท้จริงซึ่งแจกจ่ายผ่าน Apple เท่านั้น
- gateway สามารถส่ง push แบบ relay-backed ได้เฉพาะสำหรับอุปกรณ์ iOS ที่จับคู่กับ gateway นั้นโดยเฉพาะ

ทีละช่วงการเดินทาง:

1. `แอป iOS -> gateway`
   - แอปจะ pair กับ gateway ก่อนผ่านโฟลว์ Gateway auth ปกติ
   - สิ่งนี้ทำให้แอปมีทั้ง authenticated node session และ authenticated operator session
   - operator session ใช้เรียก `gateway.identity.get`

2. `แอป iOS -> relay`
   - แอปเรียก endpoint สำหรับการลงทะเบียนของ relay ผ่าน HTTPS
   - การลงทะเบียนรวม App Attest proof พร้อม app receipt
   - relay ตรวจสอบ bundle ID, App Attest proof และ Apple receipt และต้องเป็น
     เส้นทางการแจกจ่ายแบบทางการ/production
   - นี่คือสิ่งที่กันไม่ให้ local Xcode/dev build ใช้ hosted relay ได้ local build อาจ
     ถูกเซ็นจริง แต่ไม่ผ่านหลักฐานการแจกจ่ายแบบทางการของ Apple ที่ relay คาดหวัง

3. `การมอบสิทธิ์ตัวตนของ gateway`
   - ก่อนลงทะเบียนกับ relay แอปจะดึงตัวตนของ gateway ที่จับคู่ไว้จาก
     `gateway.identity.get`
   - แอปรวมตัวตนของ gateway นั้นไว้ใน payload ของการลงทะเบียน relay
   - relay ส่งคืน relay handle และ registration-scoped send grant ที่ถูกมอบให้กับ
     ตัวตนของ gateway นั้น

4. `gateway -> relay`
   - gateway เก็บ relay handle และ send grant จาก `push.apns.register`
   - ใน `push.test`, reconnect wake และ wake nudge gateway จะเซ็นคำขอส่งด้วย
     device identity ของตัวเอง
   - relay ตรวจสอบทั้ง send grant ที่เก็บไว้และลายเซ็นของ gateway เทียบกับ
     delegated gateway identity จากการลงทะเบียน
   - gateway อื่นไม่สามารถใช้ registration ที่เก็บไว้นี้ซ้ำได้ แม้ว่าจะ somehow ได้ handle ไปก็ตาม

5. `relay -> APNs`
   - relay เป็นเจ้าของ production APNs credentials และ raw APNs token สำหรับ build ทางการ
   - gateway จะไม่เก็บ raw APNs token สำหรับ build ทางการแบบ relay-backed
   - relay ส่ง push สุดท้ายไปยัง APNs ในนามของ gateway ที่จับคู่ไว้

เหตุผลที่ออกแบบเช่นนี้:

- เพื่อเก็บ production APNs credentials ให้อยู่นอก gateway ของผู้ใช้
- เพื่อหลีกเลี่ยงการเก็บ raw APNs token ของ build ทางการบน gateway
- เพื่อให้ใช้งาน hosted relay ได้เฉพาะกับ build OpenClaw ทางการ/TestFlight
- เพื่อป้องกันไม่ให้ gateway หนึ่งส่ง wake push ไปยังอุปกรณ์ iOS ที่เป็นของ gateway อื่น

local/manual build ยังคงใช้ APNs แบบตรง หากคุณกำลังทดสอบ build เหล่านั้นโดยไม่มี relay
gateway ยังคงต้องใช้ direct APNs credentials:

```bash
export OPENCLAW_APNS_TEAM_ID="TEAMID"
export OPENCLAW_APNS_KEY_ID="KEYID"
export OPENCLAW_APNS_PRIVATE_KEY_P8="$(cat /path/to/AuthKey_KEYID.p8)"
```

สิ่งเหล่านี้คือ runtime env var ของโฮสต์ gateway ไม่ใช่การตั้งค่า Fastlane `apps/ios/fastlane/.env` เก็บเฉพาะ
auth ของ App Store Connect / TestFlight เช่น `ASC_KEY_ID` และ `ASC_ISSUER_ID`; มันไม่ได้กำหนดค่า
การส่ง direct APNs สำหรับ local iOS build

ที่เก็บบนโฮสต์ gateway ที่แนะนำ:

```bash
mkdir -p ~/.openclaw/credentials/apns
chmod 700 ~/.openclaw/credentials/apns
mv /path/to/AuthKey_KEYID.p8 ~/.openclaw/credentials/apns/AuthKey_KEYID.p8
chmod 600 ~/.openclaw/credentials/apns/AuthKey_KEYID.p8
export OPENCLAW_APNS_PRIVATE_KEY_PATH="$HOME/.openclaw/credentials/apns/AuthKey_KEYID.p8"
```

ห้ามคอมมิตไฟล์ `.p8` หรือวางไว้ใต้ checkout ของ repo

## เส้นทางการค้นพบ

### Bonjour (LAN)

แอป iOS จะ browse `_openclaw-gw._tcp` บน `local.` และเมื่อมีการกำหนดค่าไว้ ก็จะ browse
โดเมน discovery แบบ wide-area DNS-SD เดียวกันด้วย Gateway ใน LAN เดียวกันจะปรากฏโดยอัตโนมัติจาก `local.`;
การค้นพบข้ามเครือข่ายสามารถใช้โดเมน wide-area ที่กำหนดค่าไว้ได้โดยไม่ต้องเปลี่ยนประเภทของ beacon

### Tailnet (ข้ามเครือข่าย)

หาก mDNS ถูกบล็อก ให้ใช้โซน unicast DNS-SD (เลือกโดเมนหนึ่ง; ตัวอย่าง:
`openclaw.internal.`) และ Tailscale split DNS
ดู [Bonjour](/th/gateway/bonjour) สำหรับตัวอย่าง CoreDNS

### host/port แบบกำหนดด้วยตนเอง

ใน Settings ให้เปิด **Manual Host** แล้วกรอก host + port ของ gateway (ค่าเริ่มต้น `18789`)

## Canvas + A2UI

iOS node เรนเดอร์ canvas ด้วย WKWebView ใช้ `node.invoke` เพื่อควบคุมมัน:

```bash
openclaw nodes invoke --node "iOS Node" --command canvas.navigate --params '{"url":"http://<gateway-host>:18789/__openclaw__/canvas/"}'
```

หมายเหตุ:

- canvas host ของ Gateway ให้บริการที่ `/__openclaw__/canvas/` และ `/__openclaw__/a2ui/`
- มันถูกเสิร์ฟจากเซิร์ฟเวอร์ HTTP ของ Gateway (พอร์ตเดียวกับ `gateway.port`, ค่าเริ่มต้น `18789`)
- iOS node จะนำทางไปยัง A2UI โดยอัตโนมัติเมื่อเชื่อมต่อ หากมีการประกาศ canvas host URL
- กลับไปยัง scaffold ที่มีอยู่ภายในด้วย `canvas.navigate` และ `{"url":""}`

### Canvas eval / snapshot

```bash
openclaw nodes invoke --node "iOS Node" --command canvas.eval --params '{"javaScript":"(() => { const {ctx} = window.__openclaw; ctx.clearRect(0,0,innerWidth,innerHeight); ctx.lineWidth=6; ctx.strokeStyle=\"#ff2d55\"; ctx.beginPath(); ctx.moveTo(40,40); ctx.lineTo(innerWidth-40, innerHeight-40); ctx.stroke(); return \"ok\"; })()"}'
```

```bash
openclaw nodes invoke --node "iOS Node" --command canvas.snapshot --params '{"maxWidth":900,"format":"jpeg"}'
```

## Voice wake + talk mode

- Voice wake และ talk mode มีอยู่ใน Settings
- iOS อาจระงับเสียงที่ทำงานเบื้องหลัง; ให้ถือว่าฟีเจอร์เสียงเป็นแบบ best-effort เมื่อแอปไม่ได้ active อยู่

## ข้อผิดพลาดที่พบบ่อย

- `NODE_BACKGROUND_UNAVAILABLE`: ให้นำแอป iOS ขึ้นมาไว้ใน foreground (คำสั่ง canvas/camera/screen ต้องใช้)
- `A2UI_HOST_NOT_CONFIGURED`: Gateway ไม่ได้ประกาศ canvas host URL; ตรวจสอบ `canvasHost` ใน [การกำหนดค่า Gateway](/th/gateway/configuration)
- ไม่เคยมี pairing prompt ปรากฏ: รัน `openclaw devices list` แล้วอนุมัติด้วยตนเอง
- reconnect ไม่ได้หลังติดตั้งใหม่: โทเค็น pairing ใน Keychain ถูกล้างแล้ว; ให้ pair node ใหม่

## เอกสารที่เกี่ยวข้อง

- [Pairing](/th/channels/pairing)
- [Discovery](/th/gateway/discovery)
- [Bonjour](/th/gateway/bonjour)
