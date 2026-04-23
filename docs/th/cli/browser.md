---
read_when:
    - คุณใช้ `openclaw browser` และต้องการตัวอย่างสำหรับงานทั่วไป
    - คุณต้องการควบคุมเบราว์เซอร์ที่ทำงานอยู่บนเครื่องอื่นผ่านโฮสต์ Node
    - คุณต้องการเชื่อมต่อกับ Chrome ในเครื่องของคุณที่ลงชื่อเข้าใช้อยู่ผ่าน Chrome MCP
summary: ข้อมูลอ้างอิง CLI สำหรับ `openclaw browser` (วงจรชีวิต, โปรไฟล์, แท็บ, การดำเนินการ, สถานะ และการดีบัก)
title: เบราว์เซอร์
x-i18n:
    generated_at: "2026-04-23T06:17:07Z"
    model: gpt-5.4
    provider: openai
    source_hash: 0cf1a5168e690121d4fc4eac984580c89bc50844f15558413ba6d8a635da2ed6
    source_path: cli/browser.md
    workflow: 15
---

# `openclaw browser`

จัดการพื้นผิวการควบคุมเบราว์เซอร์ของ OpenClaw และเรียกใช้การดำเนินการของเบราว์เซอร์ (วงจรชีวิต, โปรไฟล์, แท็บ, snapshot, screenshot, การนำทาง, การป้อนข้อมูล, การจำลองสถานะ และการดีบัก)

ที่เกี่ยวข้อง:

- เครื่องมือเบราว์เซอร์ + API: [เครื่องมือเบราว์เซอร์](/th/tools/browser)

## แฟล็กทั่วไป

- `--url <gatewayWsUrl>`: URL WebSocket ของ Gateway (ค่าเริ่มต้นจาก config)
- `--token <token>`: โทเค็นของ Gateway (หากจำเป็น)
- `--timeout <ms>`: หมดเวลาคำขอ (มิลลิวินาที)
- `--expect-final`: รอการตอบกลับสุดท้ายจาก Gateway
- `--browser-profile <name>`: เลือกโปรไฟล์เบราว์เซอร์ (ค่าเริ่มต้นจาก config)
- `--json`: เอาต์พุตที่เครื่องอ่านได้ (ในจุดที่รองรับ)

## เริ่มต้นใช้งานอย่างรวดเร็ว (ในเครื่อง)

```bash
openclaw browser profiles
openclaw browser --browser-profile openclaw start
openclaw browser --browser-profile openclaw open https://example.com
openclaw browser --browser-profile openclaw snapshot
```

## การแก้ปัญหาอย่างรวดเร็ว

หาก `start` ล้มเหลวพร้อม `not reachable after start` ให้แก้ปัญหาความพร้อมของ CDP ก่อน หาก `start` และ `tabs` สำเร็จ แต่ `open` หรือ `navigate` ล้มเหลว แสดงว่าระนาบควบคุมเบราว์เซอร์ทำงานปกติ และปัญหามักเป็นนโยบาย SSRF ของการนำทาง

ลำดับขั้นต่ำ:

```bash
openclaw browser --browser-profile openclaw start
openclaw browser --browser-profile openclaw tabs
openclaw browser --browser-profile openclaw open https://example.com
```

คำแนะนำโดยละเอียด: [การแก้ปัญหาเบราว์เซอร์](/th/tools/browser#cdp-startup-failure-vs-navigation-ssrf-block)

## วงจรชีวิต

```bash
openclaw browser status
openclaw browser start
openclaw browser stop
openclaw browser --browser-profile openclaw reset-profile
```

หมายเหตุ:

- สำหรับโปรไฟล์ `attachOnly` และ CDP ระยะไกล คำสั่ง `openclaw browser stop` จะปิดเซสชันควบคุมที่ใช้งานอยู่และล้างการแทนที่การจำลองชั่วคราว แม้ว่า OpenClaw จะไม่ได้เป็นผู้เปิดโปรเซสเบราว์เซอร์เองก็ตาม
- สำหรับโปรไฟล์ที่จัดการในเครื่อง `openclaw browser stop` จะหยุดโปรเซสเบราว์เซอร์ที่ถูกสร้างขึ้น

## หากไม่มีคำสั่งนี้

หาก `openclaw browser` เป็นคำสั่งที่ไม่รู้จัก ให้ตรวจสอบ `plugins.allow` ใน `~/.openclaw/openclaw.json`

เมื่อมี `plugins.allow` อยู่ ต้องระบุ browser Plugin ที่มากับระบบไว้อย่างชัดเจน:

```json5
{
  plugins: {
    allow: ["telegram", "browser"],
  },
}
```

`browser.enabled=true` จะไม่กู้คืนคำสั่งย่อย CLI หาก allowlist ของ plugin ตัด `browser` ออก

ที่เกี่ยวข้อง: [เครื่องมือเบราว์เซอร์](/th/tools/browser#missing-browser-command-or-tool)

## โปรไฟล์

โปรไฟล์คือการกำหนดค่าการกำหนดเส้นทางเบราว์เซอร์ตามชื่อ ในทางปฏิบัติ:

- `openclaw`: เปิดหรือเชื่อมต่อกับอินสแตนซ์ Chrome ที่ OpenClaw จัดการโดยเฉพาะ (ไดเรกทอรีข้อมูลผู้ใช้แบบแยก)
- `user`: ควบคุมเซสชัน Chrome ที่ลงชื่อเข้าใช้อยู่ของคุณผ่าน Chrome DevTools MCP
- โปรไฟล์ CDP แบบกำหนดเอง: ชี้ไปยังปลายทาง CDP ในเครื่องหรือระยะไกล

```bash
openclaw browser profiles
openclaw browser create-profile --name work --color "#FF5A36"
openclaw browser create-profile --name chrome-live --driver existing-session
openclaw browser create-profile --name remote --cdp-url https://browser-host.example.com
openclaw browser delete-profile --name work
```

ใช้โปรไฟล์เฉพาะ:

```bash
openclaw browser --browser-profile work tabs
```

## แท็บ

```bash
openclaw browser tabs
openclaw browser tab new
openclaw browser tab select 2
openclaw browser tab close 2
openclaw browser open https://docs.openclaw.ai
openclaw browser focus <targetId>
openclaw browser close <targetId>
```

## Snapshot / screenshot / การดำเนินการ

Snapshot:

```bash
openclaw browser snapshot
```

Screenshot:

```bash
openclaw browser screenshot
openclaw browser screenshot --full-page
openclaw browser screenshot --ref e12
```

หมายเหตุ:

- `--full-page` ใช้ได้เฉพาะกับการจับภาพทั้งหน้าเท่านั้น ไม่สามารถใช้ร่วมกับ `--ref` หรือ `--element`
- โปรไฟล์ `existing-session` / `user` รองรับ screenshot ของหน้าและ screenshot แบบ `--ref` จากเอาต์พุต snapshot แต่ไม่รองรับ screenshot แบบ CSS `--element`

นำทาง/คลิก/พิมพ์ (ระบบอัตโนมัติ UI แบบอ้างอิง ref):

```bash
openclaw browser navigate https://example.com
openclaw browser click <ref>
openclaw browser type <ref> "hello"
openclaw browser press Enter
openclaw browser hover <ref>
openclaw browser scrollintoview <ref>
openclaw browser drag <startRef> <endRef>
openclaw browser select <ref> OptionA OptionB
openclaw browser fill --fields '[{"ref":"1","value":"Ada"}]'
openclaw browser wait --text "Done"
openclaw browser evaluate --fn '(el) => el.textContent' --ref <ref>
```

ตัวช่วยไฟล์ + กล่องโต้ตอบ:

```bash
openclaw browser upload /tmp/openclaw/uploads/file.pdf --ref <ref>
openclaw browser waitfordownload
openclaw browser download <ref> report.pdf
openclaw browser dialog --accept
```

## สถานะและที่เก็บข้อมูล

Viewport + การจำลอง:

```bash
openclaw browser resize 1280 720
openclaw browser set viewport 1280 720
openclaw browser set offline on
openclaw browser set media dark
openclaw browser set timezone Europe/London
openclaw browser set locale en-GB
openclaw browser set geo 51.5074 -0.1278 --accuracy 25
openclaw browser set device "iPhone 14"
openclaw browser set headers '{"x-test":"1"}'
openclaw browser set credentials myuser mypass
```

คุกกี้ + ที่เก็บข้อมูล:

```bash
openclaw browser cookies
openclaw browser cookies set session abc123 --url https://example.com
openclaw browser cookies clear
openclaw browser storage local get
openclaw browser storage local set token abc123
openclaw browser storage session clear
```

## การดีบัก

```bash
openclaw browser console --level error
openclaw browser pdf
openclaw browser responsebody "**/api"
openclaw browser highlight <ref>
openclaw browser errors --clear
openclaw browser requests --filter api
openclaw browser trace start
openclaw browser trace stop --out trace.zip
```

## Chrome ที่มีอยู่แล้วผ่าน MCP

ใช้โปรไฟล์ `user` ที่มีมาให้ หรือสร้างโปรไฟล์ `existing-session` ของคุณเอง:

```bash
openclaw browser --browser-profile user tabs
openclaw browser create-profile --name chrome-live --driver existing-session
openclaw browser create-profile --name brave-live --driver existing-session --user-data-dir "~/Library/Application Support/BraveSoftware/Brave-Browser"
openclaw browser --browser-profile chrome-live tabs
```

เส้นทางนี้ใช้ได้เฉพาะบนโฮสต์เท่านั้น สำหรับ Docker, เซิร์ฟเวอร์แบบ headless, Browserless หรือการตั้งค่าระยะไกลอื่น ๆ ให้ใช้โปรไฟล์ CDP แทน

ข้อจำกัดปัจจุบันของ existing-session:

- การดำเนินการที่ขับเคลื่อนด้วย snapshot ใช้ ref ไม่ใช่ตัวเลือก CSS
- `click` รองรับเฉพาะคลิกซ้าย
- `type` ไม่รองรับ `slowly=true`
- `press` ไม่รองรับ `delayMs`
- `hover`, `scrollintoview`, `drag`, `select`, `fill` และ `evaluate` จะปฏิเสธการแทนที่ timeout รายคำสั่ง
- `select` รองรับค่าเดียวเท่านั้น
- ไม่รองรับ `wait --load networkidle`
- การอัปโหลดไฟล์ต้องใช้ `--ref` / `--input-ref`, ไม่รองรับ CSS `--element` และปัจจุบันรองรับครั้งละหนึ่งไฟล์
- hook ของกล่องโต้ตอบไม่รองรับ `--timeout`
- screenshot รองรับการจับภาพทั้งหน้าและ `--ref` แต่ไม่รองรับ CSS `--element`
- `responsebody`, การดักจับการดาวน์โหลด, การส่งออก PDF และการดำเนินการแบบแบตช์ ยังคงต้องใช้เบราว์เซอร์ที่มีการจัดการหรือโปรไฟล์ CDP ดิบ

## การควบคุมเบราว์เซอร์ระยะไกล (พร็อกซีโฮสต์ node)

หาก Gateway ทำงานอยู่คนละเครื่องกับเบราว์เซอร์ ให้รัน **node host** บนเครื่องที่มี Chrome/Brave/Edge/Chromium จากนั้น Gateway จะพร็อกซีการดำเนินการของเบราว์เซอร์ไปยัง node นั้น (ไม่ต้องใช้เซิร์ฟเวอร์ควบคุมเบราว์เซอร์แยกต่างหาก)

ใช้ `gateway.nodes.browser.mode` เพื่อควบคุมการกำหนดเส้นทางอัตโนมัติ และใช้ `gateway.nodes.browser.node` เพื่อปักหมุด node ที่ต้องการหากมีหลาย node เชื่อมต่ออยู่

ความปลอดภัย + การตั้งค่าระยะไกล: [เครื่องมือเบราว์เซอร์](/th/tools/browser), [การเข้าถึงระยะไกล](/th/gateway/remote), [Tailscale](/th/gateway/tailscale), [ความปลอดภัย](/th/gateway/security)
