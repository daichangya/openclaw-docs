---
read_when:
    - Pairing or reconnecting the iOS node
    - การรันแอป iOS จากซอร์ส
    - การแก้ไขปัญหาการค้นหา Gateway หรือคำสั่ง canvas
summary: 'แอป Node บน iOS: เชื่อมต่อกับ Gateway การจับคู่ canvas และการแก้ไขปัญหา'
title: แอป iOS
x-i18n:
    generated_at: "2026-04-24T09:21:20Z"
    model: gpt-5.4
    provider: openai
    source_hash: 87eaa706993bec9434bf22e18022af711b8398efff11c7fba4887aba46041ed3
    source_path: platforms/ios.md
    workflow: 15
---

สถานะพร้อมใช้งาน: พรีวิวภายใน แอป iOS ยังไม่ได้เผยแพร่สู่สาธารณะ

## สิ่งที่มันทำได้

- เชื่อมต่อกับ Gateway ผ่าน WebSocket (LAN หรือ tailnet)
- เปิดเผยความสามารถของ Node: Canvas, ภาพหน้าจอ, การจับภาพจากกล้อง, ตำแหน่ง, โหมด Talk, การปลุกด้วยเสียง
- รับคำสั่ง `node.invoke` และรายงานเหตุการณ์สถานะของ Node

## ข้อกำหนด

- Gateway ที่กำลังรันอยู่บนอุปกรณ์อื่น (macOS, Linux หรือ Windows ผ่าน WSL2)
- เส้นทางเครือข่าย:
  - อยู่บน LAN เดียวกันผ่าน Bonjour **หรือ**
  - อยู่บน tailnet ผ่าน unicast DNS-SD (ตัวอย่างโดเมน: `openclaw.internal.`) **หรือ**
  - ระบุ host/port ด้วยตนเอง (ทางเลือกสำรอง)

## เริ่มต้นอย่างรวดเร็ว (จับคู่ + เชื่อมต่อ)

1. เริ่ม Gateway:

```bash
openclaw gateway --port 18789
```

2. ในแอป iOS ให้เปิด Settings แล้วเลือก gateway ที่ค้นพบได้ (หรือเปิด Manual Host แล้วใส่ host/port)

3. อนุมัติคำขอจับคู่บนโฮสต์ gateway:

```bash
openclaw devices list
openclaw devices approve <requestId>
```

หากแอปลองจับคู่อีกครั้งด้วยรายละเอียด auth ที่เปลี่ยนไป (role/scopes/public key),
คำขอที่รอก่อนหน้าจะถูกแทนที่ และจะมีการสร้าง `requestId` ใหม่
ให้รัน `openclaw devices list` อีกครั้งก่อนอนุมัติ

4. ตรวจสอบการเชื่อมต่อ:

```bash
openclaw nodes status
openclaw gateway call node.list --params "{}"
```

## Relay-backed push สำหรับบิลด์ทางการ

บิลด์ iOS ทางการที่แจกจ่ายจริงจะใช้ external push relay แทนการเผยแพร่ APNs token ดิบไปยัง gateway

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
- relay จะคืน relay handle แบบทึบพร้อม send grant ที่มีขอบเขตตามการลงทะเบียน
- แอป iOS จะดึงตัวตนของ gateway ที่จับคู่ไว้และรวมมันไว้ในการลงทะเบียนกับ relay เพื่อให้การลงทะเบียนแบบ relay-backed ถูกมอบหมายให้กับ gateway ตัวนั้นโดยเฉพาะ
- แอปจะส่งต่อการลงทะเบียนแบบ relay-backed นั้นไปยัง gateway ที่จับคู่ด้วย `push.apns.register`
- gateway จะใช้ relay handle ที่จัดเก็บไว้นั้นสำหรับ `push.test`, background wake และ wake nudge
- relay base URL ของ gateway ต้องตรงกับ relay URL ที่ฝังมาในบิลด์ iOS ทางการ/TestFlight
- หากภายหลังแอปเชื่อมต่อกับ gateway ตัวอื่น หรือกับบิลด์ที่มี relay base URL ต่างกัน มันจะรีเฟรช relay registration แทนการใช้ binding เดิมซ้ำ

สิ่งที่ gateway **ไม่** ต้องใช้สำหรับเส้นทางนี้:

- ไม่ต้องมี relay token ระดับ deployment
- ไม่ต้องมี APNs key โดยตรงสำหรับการส่งแบบ relay-backed ของ official/TestFlight

โฟลว์ที่ผู้ปฏิบัติการคาดหวัง:

1. ติดตั้งบิลด์ iOS ทางการ/TestFlight
2. ตั้ง `gateway.push.apns.relay.baseUrl` บน gateway
3. จับคู่แอปกับ gateway และปล่อยให้มันเชื่อมต่อจนเสร็จ
4. แอปจะเผยแพร่ `push.apns.register` โดยอัตโนมัติหลังจากมี APNs token แล้ว เซสชัน operator เชื่อมต่ออยู่ และการลงทะเบียนกับ relay สำเร็จ
5. หลังจากนั้น `push.test`, reconnect wake และ wake nudge จะสามารถใช้ relay-backed registration ที่จัดเก็บไว้ได้

หมายเหตุเรื่องความเข้ากันได้:

- `OPENCLAW_APNS_RELAY_BASE_URL` ยังคงใช้เป็น env override ชั่วคราวสำหรับ gateway ได้

## โฟลว์การยืนยันตัวตนและความเชื่อถือ

relay มีไว้เพื่อบังคับใช้ข้อจำกัดสองอย่างที่ direct APNs-on-gateway ไม่สามารถให้ได้สำหรับ
บิลด์ iOS ทางการ:

- มีเพียงบิลด์ iOS ของ OpenClaw แท้ที่แจกจ่ายผ่าน Apple เท่านั้นที่สามารถใช้ hosted relay ได้
- gateway สามารถส่ง push แบบ relay-backed ได้เฉพาะให้กับอุปกรณ์ iOS ที่จับคู่กับ gateway ตัวนั้นโดยเฉพาะ

ทีละช่วง:

1. `iOS app -> gateway`
   - แอปจะจับคู่กับ gateway ก่อนผ่านโฟลว์ auth ปกติของ Gateway
   - สิ่งนี้ทำให้แอปมีทั้งเซสชัน node ที่ยืนยันตัวตนแล้วและเซสชัน operator ที่ยืนยันตัวตนแล้ว
   - เซสชัน operator ใช้เรียก `gateway.identity.get`

2. `iOS app -> relay`
   - แอปเรียก endpoint การลงทะเบียนของ relay ผ่าน HTTPS
   - การลงทะเบียนมี App Attest proof พร้อม app receipt
   - relay จะตรวจสอบ bundle ID, App Attest proof และ Apple receipt และกำหนดให้ต้องเป็น
     เส้นทางการแจกจ่ายแบบทางการ/production
   - นี่คือสิ่งที่บล็อกไม่ให้บิลด์ local Xcode/dev ใช้ hosted relay บิลด์ local อาจ
     ถูกเซ็นแล้ว แต่ไม่ได้ผ่านหลักฐานการแจกจ่ายทางการของ Apple ที่ relay คาดหวัง

3. `gateway identity delegation`
   - ก่อนการลงทะเบียนกับ relay แอปจะดึงตัวตนของ gateway ที่จับคู่ไว้จาก
     `gateway.identity.get`
   - แอปจะรวมตัวตนของ gateway นั้นไว้ใน payload การลงทะเบียนกับ relay
   - relay จะคืน relay handle และ send grant ที่มีขอบเขตตามการลงทะเบียน ซึ่งถูกมอบหมายให้
     ตัวตนของ gateway นั้น

4. `gateway -> relay`
   - gateway จะเก็บ relay handle และ send grant จาก `push.apns.register`
   - ใน `push.test`, reconnect wake และ wake nudge, gateway จะเซ็นคำขอส่งด้วย
     ตัวตนอุปกรณ์ของมันเอง
   - relay จะตรวจสอบทั้ง send grant ที่เก็บไว้และลายเซ็นของ gateway เทียบกับ delegated
     gateway identity จากการลงทะเบียน
   - gateway อื่นไม่สามารถใช้ registration ที่จัดเก็บไว้นี้ซ้ำได้ แม้ว่ามันจะ somehow ได้ handle ไปก็ตาม

5. `relay -> APNs`
   - relay เป็นเจ้าของข้อมูลรับรอง APNs สำหรับ production และ APNs token ดิบสำหรับบิลด์ทางการ
   - gateway จะไม่เก็บ APNs token ดิบสำหรับบิลด์ทางการแบบ relay-backed
   - relay จะส่ง push สุดท้ายไปยัง APNs ในนามของ gateway ที่จับคู่ไว้

เหตุผลที่ออกแบบเช่นนี้:

- เพื่อเก็บข้อมูลรับรอง APNs สำหรับ production ไว้ไม่ให้อยู่ใน gateway ของผู้ใช้
- เพื่อหลีกเลี่ยงการเก็บ APNs token ดิบของบิลด์ทางการไว้บน gateway
- เพื่อให้การใช้ hosted relay จำกัดอยู่เฉพาะบิลด์ OpenClaw ทางการ/TestFlight
- เพื่อป้องกันไม่ให้ gateway หนึ่งส่ง wake push ไปยังอุปกรณ์ iOS ที่เป็นของอีก gateway หนึ่ง

บิลด์ local/manual ยังคงใช้ direct APNs หากคุณกำลังทดสอบบิลด์เหล่านั้นโดยไม่ใช้ relay
gateway ยังต้องใช้ข้อมูลรับรอง APNs โดยตรง:

```bash
export OPENCLAW_APNS_TEAM_ID="TEAMID"
export OPENCLAW_APNS_KEY_ID="KEYID"
export OPENCLAW_APNS_PRIVATE_KEY_P8="$(cat /path/to/AuthKey_KEYID.p8)"
```

สิ่งเหล่านี้เป็น env var ของ runtime บนโฮสต์ gateway ไม่ใช่การตั้งค่า Fastlane `apps/ios/fastlane/.env` เก็บเฉพาะ auth ของ App Store Connect / TestFlight เช่น `ASC_KEY_ID` และ `ASC_ISSUER_ID`; มันไม่ได้กำหนดค่า direct APNs delivery สำหรับบิลด์ iOS แบบ local

การจัดเก็บบนโฮสต์ gateway ที่แนะนำ:

```bash
mkdir -p ~/.openclaw/credentials/apns
chmod 700 ~/.openclaw/credentials/apns
mv /path/to/AuthKey_KEYID.p8 ~/.openclaw/credentials/apns/AuthKey_KEYID.p8
chmod 600 ~/.openclaw/credentials/apns/AuthKey_KEYID.p8
export OPENCLAW_APNS_PRIVATE_KEY_PATH="$HOME/.openclaw/credentials/apns/AuthKey_KEYID.p8"
```

อย่า commit ไฟล์ `.p8` หรือวางไว้ใต้ repo checkout

## เส้นทางการค้นหา

### Bonjour (LAN)

แอป iOS จะ browse `_openclaw-gw._tcp` บน `local.` และเมื่อมีการกำหนดค่า จะ browse บนโดเมน wide-area DNS-SD เดียวกันด้วย Gateway ที่อยู่บน LAN เดียวกันจะปรากฏขึ้นโดยอัตโนมัติจาก `local.`; การค้นหาข้ามเครือข่ายสามารถใช้โดเมน wide-area ที่กำหนดค่าไว้โดยไม่ต้องเปลี่ยนชนิด beacon

### Tailnet (ข้ามเครือข่าย)

หาก mDNS ถูกบล็อก ให้ใช้โซน unicast DNS-SD (เลือกโดเมนหนึ่ง; ตัวอย่าง:
`openclaw.internal.`) และ Tailscale split DNS
ดู [Bonjour](/th/gateway/bonjour) สำหรับตัวอย่าง CoreDNS

### ระบุ host/port ด้วยตนเอง

ใน Settings ให้เปิด **Manual Host** แล้วกรอก host + port ของ gateway (ค่าเริ่มต้น `18789`)

## Canvas + A2UI

Node บน iOS จะเรนเดอร์ canvas แบบ WKWebView ใช้ `node.invoke` เพื่อควบคุมมัน:

```bash
openclaw nodes invoke --node "iOS Node" --command canvas.navigate --params '{"url":"http://<gateway-host>:18789/__openclaw__/canvas/"}'
```

หมายเหตุ:

- canvas host ของ Gateway ให้บริการ `/__openclaw__/canvas/` และ `/__openclaw__/a2ui/`
- มันให้บริการจากเซิร์ฟเวอร์ HTTP ของ Gateway (พอร์ตเดียวกับ `gateway.port`, ค่าเริ่มต้น `18789`)
- Node บน iOS จะนำทางไปยัง A2UI โดยอัตโนมัติเมื่อเชื่อมต่อ หากมีการประกาศ canvas host URL
- กลับไปยัง scaffold ที่มีมาในตัวด้วย `canvas.navigate` และ `{"url":""}`

### Canvas eval / snapshot

```bash
openclaw nodes invoke --node "iOS Node" --command canvas.eval --params '{"javaScript":"(() => { const {ctx} = window.__openclaw; ctx.clearRect(0,0,innerWidth,innerHeight); ctx.lineWidth=6; ctx.strokeStyle=\"#ff2d55\"; ctx.beginPath(); ctx.moveTo(40,40); ctx.lineTo(innerWidth-40, innerHeight-40); ctx.stroke(); return \"ok\"; })()"}'
```

```bash
openclaw nodes invoke --node "iOS Node" --command canvas.snapshot --params '{"maxWidth":900,"format":"jpeg"}'
```

## Voice wake + โหมด Talk

- Voice wake และโหมด Talk ใช้งานได้ใน Settings
- iOS อาจระงับเสียงเบื้องหลัง; ให้ถือว่าฟีเจอร์เสียงเป็นแบบ best-effort เมื่อแอปไม่ได้ active

## ข้อผิดพลาดที่พบบ่อย

- `NODE_BACKGROUND_UNAVAILABLE`: นำแอป iOS กลับมาไว้ที่ foreground (คำสั่ง canvas/camera/screen ต้องใช้ foreground)
- `A2UI_HOST_NOT_CONFIGURED`: Gateway ไม่ได้ประกาศ canvas host URL; ตรวจสอบ `canvasHost` ใน [การกำหนดค่า Gateway](/th/gateway/configuration)
- พรอมป์จับคู่ไม่เคยปรากฏ: รัน `openclaw devices list` แล้วอนุมัติด้วยตนเอง
- การเชื่อมต่อใหม่ล้มเหลวหลังติดตั้งใหม่: pairing token ใน Keychain ถูกล้าง; ให้จับคู่ Node ใหม่

## เอกสารที่เกี่ยวข้อง

- [Pairing](/th/channels/pairing)
- [Discovery](/th/gateway/discovery)
- [Bonjour](/th/gateway/bonjour)
