---
read_when:
    - การรัน OpenClaw Gateway ใน WSL2 ขณะที่ Chrome อยู่บน Windows
    - พบข้อผิดพลาด browser/control-ui ที่ซ้อนกันข้าม WSL2 และ Windows
    - การตัดสินใจระหว่าง Chrome MCP แบบ host-local กับ raw remote CDP ในการตั้งค่าแบบแยกโฮสต์
summary: แก้ปัญหา Gateway บน WSL2 + Windows Chrome remote CDP แบบแยกเป็นชั้นๆ
title: การแก้ปัญหา WSL2 + Windows + remote Chrome CDP்
x-i18n:
    generated_at: "2026-04-23T05:59:11Z"
    model: gpt-5.4
    provider: openai
    source_hash: 99df2988d3c6cf36a8c2124d5b724228d095a60b2d2b552f3810709b5086127d
    source_path: tools/browser-wsl2-windows-remote-cdp-troubleshooting.md
    workflow: 15
---

# การแก้ปัญหา WSL2 + Windows + remote Chrome CDP

คู่มือนี้ครอบคลุมการตั้งค่าแบบแยกโฮสต์ที่พบบ่อย ซึ่งมีลักษณะดังนี้:

- OpenClaw Gateway รันอยู่ภายใน WSL2
- Chrome รันอยู่บน Windows
- browser control ต้องข้ามขอบเขตระหว่าง WSL2/Windows

คู่มือนี้ยังครอบคลุมรูปแบบความล้มเหลวแบบหลายชั้นจาก [issue #39369](https://github.com/openclaw/openclaw/issues/39369): ปัญหาอิสระหลายอย่างอาจเกิดขึ้นพร้อมกัน ซึ่งทำให้ดูเหมือนว่าชั้นที่ผิดกำลังพังก่อน

## เลือกโหมด browser ที่ถูกต้องก่อน

คุณมีรูปแบบที่ใช้ได้สองแบบ:

### ตัวเลือก 1: Raw remote CDP จาก WSL2 ไปยัง Windows

ใช้ remote browser profile ที่ชี้จาก WSL2 ไปยัง Windows Chrome CDP endpoint

เลือกตัวเลือกนี้เมื่อ:

- Gateway ยังคงอยู่ภายใน WSL2
- Chrome รันอยู่บน Windows
- คุณต้องให้ browser control ข้ามขอบเขต WSL2/Windows

### ตัวเลือก 2: Chrome MCP แบบ host-local

ใช้ `existing-session` / `user` เฉพาะเมื่อ Gateway เองรันอยู่บนโฮสต์เดียวกับ Chrome

เลือกตัวเลือกนี้เมื่อ:

- OpenClaw และ Chrome อยู่บนเครื่องเดียวกัน
- คุณต้องการใช้สถานะ browser ที่ signed-in ในเครื่อง
- คุณไม่ต้องการ browser transport แบบข้ามโฮสต์
- คุณไม่ต้องการเส้นทางขั้นสูงแบบ managed/raw-CDP-only เช่น `responsebody`, การส่งออก PDF,
  download interception หรือ batch actions

สำหรับกรณี Gateway บน WSL2 + Chrome บน Windows ควรใช้ raw remote CDP Chrome MCP เป็นแบบ host-local ไม่ใช่สะพานจาก WSL2 ไปยัง Windows

## สถาปัตยกรรมที่ใช้งานได้

รูปแบบอ้างอิง:

- WSL2 รัน Gateway ที่ `127.0.0.1:18789`
- Windows เปิด Control UI ในเบราว์เซอร์ปกติที่ `http://127.0.0.1:18789/`
- Windows Chrome เปิดเผย CDP endpoint บนพอร์ต `9222`
- WSL2 สามารถเข้าถึง Windows CDP endpoint นั้นได้
- OpenClaw ชี้ browser profile ไปยังที่อยู่ที่ WSL2 เข้าถึงได้

## ทำไมการตั้งค่านี้จึงสับสน

ความล้มเหลวหลายอย่างอาจซ้อนกันได้:

- WSL2 เข้าถึง Windows CDP endpoint ไม่ได้
- เปิด Control UI จาก origin ที่ไม่ปลอดภัย
- `gateway.controlUi.allowedOrigins` ไม่ตรงกับ page origin
- ขาด token หรือ pairing
- browser profile ชี้ไปยังที่อยู่ผิด

เพราะเหตุนี้ แม้จะแก้ปัญหาชั้นหนึ่งแล้ว ก็อาจยังมีข้อผิดพลาดจากอีกชั้นหนึ่งแสดงอยู่ได้

## กฎสำคัญสำหรับ Control UI

เมื่อเปิด UI จาก Windows ให้ใช้ Windows localhost เว้นแต่คุณจะมีการตั้งค่า HTTPS แบบตั้งใจไว้แล้ว

ให้ใช้:

`http://127.0.0.1:18789/`

อย่าใช้ LAN IP เป็นค่าเริ่มต้นสำหรับ Control UI plain HTTP บนที่อยู่ LAN หรือ tailnet อาจทำให้เกิดพฤติกรรม insecure-origin/device-auth ที่ไม่เกี่ยวกับ CDP เอง ดู [Control UI](/web/control-ui)

## ตรวจสอบทีละชั้น

ทำจากบนลงล่าง อย่าข้ามขั้น

### ชั้น 1: ตรวจสอบว่า Chrome กำลังให้บริการ CDP บน Windows

เริ่ม Chrome บน Windows โดยเปิด remote debugging:

```powershell
chrome.exe --remote-debugging-port=9222
```

จาก Windows ให้ตรวจสอบ Chrome เองก่อน:

```powershell
curl http://127.0.0.1:9222/json/version
curl http://127.0.0.1:9222/json/list
```

หากตรงนี้ล้มเหลว ปัญหายังไม่ใช่ที่ OpenClaw

### ชั้น 2: ตรวจสอบว่า WSL2 เข้าถึง Windows endpoint นั้นได้

จาก WSL2 ให้ทดสอบที่อยู่แบบตรงตัวที่คุณวางแผนจะใช้ใน `cdpUrl`:

```bash
curl http://WINDOWS_HOST_OR_IP:9222/json/version
curl http://WINDOWS_HOST_OR_IP:9222/json/list
```

ผลลัพธ์ที่ดี:

- `/json/version` คืน JSON ที่มีข้อมูล Browser / Protocol-Version
- `/json/list` คืน JSON (จะเป็นอาร์เรย์ว่างก็ได้ หากยังไม่มีหน้าเว็บเปิดอยู่)

หากตรงนี้ล้มเหลว:

- Windows ยังไม่เปิดเผยพอร์ตให้ WSL2 เข้าถึง
- ที่อยู่ที่ใช้ผิดสำหรับฝั่ง WSL2
- ยังขาด firewall / port forwarding / local proxying

แก้ปัญหานี้ก่อนแตะ config ของ OpenClaw

### ชั้น 3: กำหนด browser profile ให้ถูกต้อง

สำหรับ raw remote CDP ให้ชี้ OpenClaw ไปยังที่อยู่ที่ WSL2 เข้าถึงได้:

```json5
{
  browser: {
    enabled: true,
    defaultProfile: "remote",
    profiles: {
      remote: {
        cdpUrl: "http://WINDOWS_HOST_OR_IP:9222",
        attachOnly: true,
        color: "#00AA00",
      },
    },
  },
}
```

หมายเหตุ:

- ใช้ที่อยู่ที่ WSL2 เข้าถึงได้ ไม่ใช่ค่าที่ใช้ได้เฉพาะบน Windows
- คง `attachOnly: true` ไว้สำหรับเบราว์เซอร์ที่จัดการจากภายนอก
- `cdpUrl` ใช้ได้กับ `http://`, `https://`, `ws://` หรือ `wss://`
- ใช้ HTTP(S) เมื่อคุณต้องการให้ OpenClaw ค้นหา `/json/version`
- ใช้ WS(S) เฉพาะเมื่อผู้ให้บริการ browser ของคุณให้ direct DevTools socket URL มาโดยตรง
- ทดสอบ URL เดียวกันนั้นด้วย `curl` ก่อนคาดหวังว่า OpenClaw จะทำงานได้

### ชั้น 4: ตรวจสอบชั้นของ Control UI แยกต่างหาก

เปิด UI จาก Windows:

`http://127.0.0.1:18789/`

จากนั้นตรวจสอบ:

- page origin ตรงกับที่ `gateway.controlUi.allowedOrigins` คาดหวังหรือไม่
- token auth หรือ pairing ถูกกำหนดค่าอย่างถูกต้องหรือไม่
- คุณไม่ได้กำลังดีบักปัญหา auth ของ Control UI ราวกับว่าเป็นปัญหาของ browser

หน้าที่มีประโยชน์:

- [Control UI](/web/control-ui)

### ชั้น 5: ตรวจสอบ browser control แบบครบเส้นทาง

จาก WSL2:

```bash
openclaw browser open https://example.com --browser-profile remote
openclaw browser tabs --browser-profile remote
```

ผลลัพธ์ที่ดี:

- tab เปิดขึ้นใน Windows Chrome
- `openclaw browser tabs` คืน target กลับมา
- การกระทำถัดไป (`snapshot`, `screenshot`, `navigate`) ใช้งานได้จาก profile เดียวกัน

## ข้อผิดพลาดที่ทำให้เข้าใจผิดได้บ่อย

ให้มองแต่ละข้อความเป็นคำใบ้เฉพาะชั้น:

- `control-ui-insecure-auth`
  - เป็นปัญหาชั้น UI origin / secure-context ไม่ใช่ปัญหาของ CDP transport
- `token_missing`
  - เป็นปัญหาการกำหนดค่า auth
- `pairing required`
  - เป็นปัญหาการอนุมัติอุปกรณ์
- `Remote CDP for profile "remote" is not reachable`
  - WSL2 เข้าถึง `cdpUrl` ที่กำหนดค่าไว้ไม่ได้
- `Browser attachOnly is enabled and CDP websocket for profile "remote" is not reachable`
  - HTTP endpoint ตอบแล้ว แต่ยังเปิด DevTools WebSocket ไม่ได้
- viewport / dark-mode / locale / offline overrides ที่ค้างหลังเซสชันระยะไกล
  - รัน `openclaw browser stop --browser-profile remote`
  - วิธีนี้จะปิดเซสชันควบคุมที่กำลังใช้งานและปล่อยสถานะการจำลองของ Playwright/CDP โดยไม่ต้องรีสตาร์ต gateway หรือเบราว์เซอร์ภายนอก
- `gateway timeout after 1500ms`
  - มักยังเป็นปัญหาเรื่องการเข้าถึง CDP หรือ remote endpoint ช้า/เข้าถึงไม่ได้
- `No Chrome tabs found for profile="user"`
  - เลือก local Chrome MCP profile ในกรณีที่ไม่มีแท็บแบบ host-local ให้ใช้

## เช็กลิสต์สำหรับ triage แบบเร็ว

1. Windows: `curl http://127.0.0.1:9222/json/version` ใช้งานได้หรือไม่?
2. WSL2: `curl http://WINDOWS_HOST_OR_IP:9222/json/version` ใช้งานได้หรือไม่?
3. OpenClaw config: `browser.profiles.<name>.cdpUrl` ใช้ที่อยู่แบบตรงตัวที่ WSL2 เข้าถึงได้นั้นหรือไม่?
4. Control UI: คุณกำลังเปิด `http://127.0.0.1:18789/` แทน LAN IP หรือไม่?
5. คุณกำลังพยายามใช้ `existing-session` ข้าม WSL2 และ Windows แทน raw remote CDP หรือไม่?

## ข้อสรุปเชิงปฏิบัติ

โดยทั่วไปการตั้งค่านี้ใช้งานได้จริง สิ่งที่ยากคือ browser transport, ความปลอดภัยของ origin ใน Control UI และ token/pairing ต่างก็ล้มเหลวแยกจากกันได้ ขณะที่จากฝั่งผู้ใช้มันดูคล้ายกัน

เมื่อไม่แน่ใจ:

- ตรวจสอบ Windows Chrome endpoint ในเครื่องก่อน
- จากนั้นตรวจสอบ endpoint เดียวกันนั้นจาก WSL2
- ค่อยไปดีบัก OpenClaw config หรือ Control UI auth เป็นขั้นถัดไป
