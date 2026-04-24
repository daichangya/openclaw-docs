---
read_when:
    - การรัน OpenClaw Gateway ใน WSL2 ขณะที่ Chrome อยู่บน Windows
    - พบข้อผิดพลาดของเบราว์เซอร์/Control UI ที่ทับซ้อนกันระหว่าง WSL2 และ Windows
    - การตัดสินใจระหว่าง Chrome MCP บนโฮสต์ภายในเครื่องกับ remote CDP แบบดิบในสภาพแวดล้อมแยกโฮสต์
summary: แก้ปัญหา Gateway บน WSL2 + Chrome บน Windows แบบ remote CDP เป็นลำดับชั้น
title: การแก้ปัญหา WSL2 + Windows + remote Chrome CDP
x-i18n:
    generated_at: "2026-04-24T09:35:22Z"
    model: gpt-5.4
    provider: openai
    source_hash: 30c8b94332e74704f85cbce5891b677b264fd155bc180c44044ab600e84018fd
    source_path: tools/browser-wsl2-windows-remote-cdp-troubleshooting.md
    workflow: 15
---

คู่มือนี้ครอบคลุมการตั้งค่าแบบแยกโฮสต์ที่พบบ่อยซึ่ง:

- OpenClaw Gateway ทำงานอยู่ภายใน WSL2
- Chrome ทำงานอยู่บน Windows
- การควบคุมเบราว์เซอร์ต้องข้ามขอบเขตระหว่าง WSL2/Windows

นอกจากนี้ยังครอบคลุมรูปแบบความล้มเหลวแบบเป็นชั้นจาก [issue #39369](https://github.com/openclaw/openclaw/issues/39369): ปัญหาอิสระหลายอย่างสามารถเกิดขึ้นพร้อมกันได้ ซึ่งทำให้ดูเหมือนว่าเลเยอร์ที่ผิดเป็นตัวที่พังก่อน

## เลือกโหมดเบราว์เซอร์ที่ถูกต้องก่อน

คุณมีรูปแบบที่ใช้ได้สองแบบ:

### ตัวเลือก 1: remote CDP แบบดิบจาก WSL2 ไปยัง Windows

ใช้โปรไฟล์เบราว์เซอร์ระยะไกลที่ชี้จาก WSL2 ไปยัง endpoint CDP ของ Chrome บน Windows

เลือกวิธีนี้เมื่อ:

- Gateway ยังคงอยู่ภายใน WSL2
- Chrome ทำงานอยู่บน Windows
- คุณต้องการให้การควบคุมเบราว์เซอร์ข้ามขอบเขตระหว่าง WSL2/Windows

### ตัวเลือก 2: Chrome MCP แบบ host-local

ใช้ `existing-session` / `user` เฉพาะเมื่อ Gateway เองทำงานอยู่บนโฮสต์เดียวกับ Chrome

เลือกวิธีนี้เมื่อ:

- OpenClaw และ Chrome อยู่บนเครื่องเดียวกัน
- คุณต้องการสถานะเบราว์เซอร์ในเครื่องที่ลงชื่อเข้าใช้ไว้แล้ว
- คุณไม่ต้องการทรานสปอร์ตเบราว์เซอร์ข้ามโฮสต์
- คุณไม่ต้องการเส้นทางขั้นสูงแบบ managed/raw-CDP-only เช่น `responsebody`, การส่งออก PDF
  การดักจับการดาวน์โหลด หรือ batch actions

สำหรับ Gateway บน WSL2 + Chrome บน Windows ให้เลือก remote CDP แบบดิบ Chrome MCP เป็นแบบ host-local ไม่ใช่สะพานจาก WSL2 ไปยัง Windows

## สถาปัตยกรรมที่ทำงานได้

รูปแบบอ้างอิง:

- WSL2 รัน Gateway ที่ `127.0.0.1:18789`
- Windows เปิด Control UI ในเบราว์เซอร์ปกติที่ `http://127.0.0.1:18789/`
- Chrome บน Windows เปิดเผย endpoint CDP บนพอร์ต `9222`
- WSL2 สามารถเข้าถึง endpoint CDP ของ Windows นั้นได้
- OpenClaw ชี้โปรไฟล์เบราว์เซอร์ไปยังที่อยู่ที่ WSL2 เข้าถึงได้

## เหตุใดการตั้งค่านี้จึงชวนสับสน

ความล้มเหลวหลายอย่างสามารถซ้อนทับกันได้:

- WSL2 ไม่สามารถเข้าถึง endpoint CDP ของ Windows ได้
- Control UI ถูกเปิดจาก origin ที่ไม่ปลอดภัย
- `gateway.controlUi.allowedOrigins` ไม่ตรงกับ origin ของหน้า
- token หรือ pairing หายไป
- โปรไฟล์เบราว์เซอร์ชี้ไปยังที่อยู่ผิด

ด้วยเหตุนี้ การแก้เลเยอร์หนึ่งแล้วก็อาจยังมี error จากอีกเลเยอร์หนึ่งแสดงอยู่

## กฎสำคัญสำหรับ Control UI

เมื่อ UI ถูกเปิดจาก Windows ให้ใช้ localhost ของ Windows เว้นแต่คุณจะตั้งค่า HTTPS แบบตั้งใจไว้

ให้ใช้:

`http://127.0.0.1:18789/`

อย่าใช้ LAN IP เป็นค่าเริ่มต้นสำหรับ Control UI โดยปกติ Plain HTTP บนที่อยู่ LAN หรือ tailnet อาจกระตุ้นพฤติกรรม insecure-origin/device-auth ที่ไม่เกี่ยวกับ CDP เอง ดู [Control UI](/th/web/control-ui)

## ตรวจสอบแบบเป็นลำดับชั้น

ไล่จากบนลงล่าง อย่าข้ามขั้น

### เลเยอร์ 1: ตรวจสอบว่า Chrome เปิดให้บริการ CDP บน Windows

เริ่ม Chrome บน Windows โดยเปิดใช้ remote debugging:

```powershell
chrome.exe --remote-debugging-port=9222
```

จาก Windows ให้ตรวจสอบตัว Chrome เองก่อน:

```powershell
curl http://127.0.0.1:9222/json/version
curl http://127.0.0.1:9222/json/list
```

หากสิ่งนี้ล้มเหลวบน Windows ปัญหายังไม่ใช่ OpenClaw

### เลเยอร์ 2: ตรวจสอบว่า WSL2 เข้าถึง endpoint ของ Windows นั้นได้

จาก WSL2 ให้ทดสอบที่อยู่เดียวกับที่คุณจะใช้ใน `cdpUrl`:

```bash
curl http://WINDOWS_HOST_OR_IP:9222/json/version
curl http://WINDOWS_HOST_OR_IP:9222/json/list
```

ผลลัพธ์ที่ดี:

- `/json/version` คืน JSON พร้อมข้อมูลเมตา Browser / Protocol-Version
- `/json/list` คืน JSON (จะเป็นอาร์เรย์ว่างก็ได้หากยังไม่มีหน้าเปิดอยู่)

หากสิ่งนี้ล้มเหลว:

- Windows ยังไม่ได้เปิดเผยพอร์ตให้ WSL2 เข้าถึง
- ที่อยู่ผิดสำหรับฝั่ง WSL2
- firewall / port forwarding / local proxying ยังขาดอยู่

ให้แก้ตรงนี้ก่อนค่อยแตะ config ของ OpenClaw

### เลเยอร์ 3: กำหนดค่าโปรไฟล์เบราว์เซอร์ที่ถูกต้อง

สำหรับ remote CDP แบบดิบ ให้ชี้ OpenClaw ไปยังที่อยู่ที่ WSL2 เข้าถึงได้:

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

- ใช้ที่อยู่ที่ WSL2 เข้าถึงได้ ไม่ใช่ที่อยู่ที่ใช้งานได้เฉพาะบน Windows
- คง `attachOnly: true` ไว้สำหรับเบราว์เซอร์ที่ถูกจัดการจากภายนอก
- `cdpUrl` สามารถเป็น `http://`, `https://`, `ws://` หรือ `wss://`
- ใช้ HTTP(S) เมื่อคุณต้องการให้ OpenClaw ค้นหา `/json/version`
- ใช้ WS(S) เฉพาะเมื่อผู้ให้บริการเบราว์เซอร์ให้ URL ของ DevTools socket โดยตรง
- ทดสอบ URL เดียวกันด้วย `curl` ก่อนคาดหวังว่า OpenClaw จะสำเร็จ

### เลเยอร์ 4: ตรวจสอบเลเยอร์ของ Control UI แยกต่างหาก

เปิด UI จาก Windows:

`http://127.0.0.1:18789/`

จากนั้นตรวจสอบ:

- page origin ตรงกับสิ่งที่ `gateway.controlUi.allowedOrigins` คาดหวังหรือไม่
- token auth หรือ pairing ถูกกำหนดค่าไว้อย่างถูกต้องหรือไม่
- คุณไม่ได้กำลังดีบักปัญหา auth ของ Control UI ราวกับว่าเป็นปัญหาเบราว์เซอร์

หน้าที่มีประโยชน์:

- [Control UI](/th/web/control-ui)

### เลเยอร์ 5: ตรวจสอบการควบคุมเบราว์เซอร์แบบ end-to-end

จาก WSL2:

```bash
openclaw browser open https://example.com --browser-profile remote
openclaw browser tabs --browser-profile remote
```

ผลลัพธ์ที่ดี:

- แท็บเปิดขึ้นใน Chrome บน Windows
- `openclaw browser tabs` คืนค่า target
- action ถัดไป (`snapshot`, `screenshot`, `navigate`) ทำงานได้จากโปรไฟล์เดียวกัน

## ข้อผิดพลาดที่ชวนให้เข้าใจผิดที่พบบ่อย

ให้มองแต่ละข้อความเป็นเบาะแสเฉพาะเลเยอร์:

- `control-ui-insecure-auth`
  - เป็นปัญหา UI origin / secure-context ไม่ใช่ปัญหาทรานสปอร์ต CDP
- `token_missing`
  - เป็นปัญหาการกำหนดค่า auth
- `pairing required`
  - เป็นปัญหาการอนุมัติอุปกรณ์
- `Remote CDP for profile "remote" is not reachable`
  - WSL2 เข้าถึง `cdpUrl` ที่กำหนดค่าไว้ไม่ได้
- `Browser attachOnly is enabled and CDP websocket for profile "remote" is not reachable`
  - endpoint แบบ HTTP ตอบแล้ว แต่ยังเปิด DevTools WebSocket ไม่ได้
- ค่า override ของ viewport / dark-mode / locale / offline ที่ค้างหลังจบ remote session
  - รัน `openclaw browser stop --browser-profile remote`
  - สิ่งนี้จะปิด active control session และปล่อยสถานะ emulation ของ Playwright/CDP โดยไม่ต้องรีสตาร์ต gateway หรือเบราว์เซอร์ภายนอก
- `gateway timeout after 1500ms`
  - มักยังเป็นปัญหาการเข้าถึง CDP หรือ endpoint ระยะไกลที่ช้า/เข้าถึงไม่ได้
- `No Chrome tabs found for profile="user"`
  - มีการเลือกโปรไฟล์ Chrome MCP แบบ local ในขณะที่ไม่มีแท็บแบบ host-local ใช้งานได้

## เช็กลิสต์คัดกรองอย่างรวดเร็ว

1. Windows: `curl http://127.0.0.1:9222/json/version` ทำงานหรือไม่?
2. WSL2: `curl http://WINDOWS_HOST_OR_IP:9222/json/version` ทำงานหรือไม่?
3. config ของ OpenClaw: `browser.profiles.<name>.cdpUrl` ใช้ที่อยู่ที่ WSL2 เข้าถึงได้แบบตรงกันนี้หรือไม่?
4. Control UI: คุณกำลังเปิด `http://127.0.0.1:18789/` แทน LAN IP อยู่หรือไม่?
5. คุณกำลังพยายามใช้ `existing-session` ข้าม WSL2 และ Windows แทนที่จะใช้ remote CDP แบบดิบหรือไม่?

## ข้อสรุปเชิงปฏิบัติ

โดยทั่วไปการตั้งค่านี้ใช้งานได้จริง ส่วนที่ยากคือทรานสปอร์ตเบราว์เซอร์, ความปลอดภัยของ origin ใน Control UI และ token/pairing ต่างก็ล้มเหลวได้อย่างอิสระ ในขณะที่ดูคล้ายกันจากฝั่งผู้ใช้

เมื่อไม่แน่ใจ:

- ตรวจสอบ endpoint ของ Chrome บน Windows ในเครื่องก่อน
- ตรวจสอบ endpoint เดียวกันจาก WSL2 เป็นลำดับที่สอง
- จากนั้นค่อยดีบัก config ของ OpenClaw หรือ auth ของ Control UI

## ที่เกี่ยวข้อง

- [Browser](/th/tools/browser)
- [Browser login](/th/tools/browser-login)
- [Browser Linux troubleshooting](/th/tools/browser-linux-troubleshooting)
