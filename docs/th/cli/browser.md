---
read_when:
    - คุณใช้ `openclaw browser` และต้องการตัวอย่างสำหรับงานทั่วไป
    - คุณต้องการควบคุมเบราว์เซอร์ที่ทำงานอยู่บนอีกเครื่องหนึ่งผ่านโฮสต์ Node
    - คุณต้องการเชื่อมต่อกับ Chrome ในเครื่องที่ลงชื่อเข้าใช้อยู่แล้วผ่าน Chrome MCP
summary: เอกสารอ้างอิง CLI สำหรับ `openclaw browser` (วงจรชีวิต โปรไฟล์ แท็บ actions สถานะ และการดีบัก)
title: เบราว์เซอร์
x-i18n:
    generated_at: "2026-04-24T09:01:56Z"
    model: gpt-5.4
    provider: openai
    source_hash: 1b93ea053b7fc047fad79397e0298cc530673a64d5873d98be9f910df1ea2fde
    source_path: cli/browser.md
    workflow: 15
---

# `openclaw browser`

จัดการพื้นผิวการควบคุมเบราว์เซอร์ของ OpenClaw และรันการดำเนินการของเบราว์เซอร์ (วงจรชีวิต โปรไฟล์ แท็บ snapshot ภาพหน้าจอ การนำทาง การป้อนข้อมูล การจำลองสถานะ และการดีบัก)

ที่เกี่ยวข้อง:

- เครื่องมือเบราว์เซอร์ + API: [Browser tool](/th/tools/browser)

## แฟล็กทั่วไป

- `--url <gatewayWsUrl>`: URL WebSocket ของ Gateway (ค่าเริ่มต้นจากคอนฟิก)
- `--token <token>`: โทเค็นของ Gateway (หากจำเป็น)
- `--timeout <ms>`: timeout ของคำขอ (มิลลิวินาที)
- `--expect-final`: รอการตอบกลับสุดท้ายจาก Gateway
- `--browser-profile <name>`: เลือกโปรไฟล์เบราว์เซอร์ (ค่าเริ่มต้นจากคอนฟิก)
- `--json`: เอาต์พุตแบบอ่านได้ด้วยเครื่อง (เมื่อรองรับ)

## เริ่มต้นอย่างรวดเร็ว (ในเครื่อง)

```bash
openclaw browser profiles
openclaw browser --browser-profile openclaw start
openclaw browser --browser-profile openclaw open https://example.com
openclaw browser --browser-profile openclaw snapshot
```

## การแก้ไขปัญหาอย่างรวดเร็ว

หาก `start` ล้มเหลวพร้อม `not reachable after start` ให้ตรวจสอบความพร้อมของ CDP ก่อน หาก `start` และ `tabs` สำเร็จ แต่ `open` หรือ `navigate` ล้มเหลว แปลว่า control plane ของเบราว์เซอร์ทำงานปกติ และความล้มเหลวมักเกิดจากนโยบาย SSRF ของการนำทาง

ลำดับขั้นต่ำ:

```bash
openclaw browser --browser-profile openclaw start
openclaw browser --browser-profile openclaw tabs
openclaw browser --browser-profile openclaw open https://example.com
```

คำแนะนำโดยละเอียด: [การแก้ไขปัญหา Browser](/th/tools/browser#cdp-startup-failure-vs-navigation-ssrf-block)

## วงจรชีวิต

```bash
openclaw browser status
openclaw browser start
openclaw browser stop
openclaw browser --browser-profile openclaw reset-profile
```

หมายเหตุ:

- สำหรับโปรไฟล์ `attachOnly` และ CDP ระยะไกล `openclaw browser stop` จะปิด
  เซสชันควบคุมที่ active และล้างการ override การจำลองชั่วคราว แม้ว่า
  OpenClaw จะไม่ได้เป็นผู้เปิดโปรเซสเบราว์เซอร์เองก็ตาม
- สำหรับโปรไฟล์ที่จัดการในเครื่อง `openclaw browser stop` จะหยุดโปรเซส
  เบราว์เซอร์ที่ถูกเปิดขึ้นมา

## หากไม่มีคำสั่งนี้

หาก `openclaw browser` เป็นคำสั่งที่ไม่รู้จัก ให้ตรวจสอบ `plugins.allow` ใน
`~/.openclaw/openclaw.json`

เมื่อมี `plugins.allow` อยู่ Plugin browser ที่รวมมาให้จะต้องถูกระบุ
อย่างชัดเจน:

```json5
{
  plugins: {
    allow: ["telegram", "browser"],
  },
}
```

`browser.enabled=true` จะไม่กู้คืนคำสั่งย่อย CLI หาก
allowlist ของ Plugin ไม่รวม `browser`

ที่เกี่ยวข้อง: [Browser tool](/th/tools/browser#missing-browser-command-or-tool)

## โปรไฟล์

โปรไฟล์คือคอนฟิกการกำหนดเส้นทางของเบราว์เซอร์แบบมีชื่อ ในทางปฏิบัติ:

- `openclaw`: เปิดหรือเชื่อมต่อกับอินสแตนซ์ Chrome ที่ OpenClaw จัดการโดยเฉพาะ (isolated user data dir)
- `user`: ควบคุมเซสชัน Chrome ที่ลงชื่อเข้าใช้แล้วของคุณผ่าน Chrome DevTools MCP
- โปรไฟล์ CDP แบบกำหนดเอง: ชี้ไปยัง CDP endpoint ในเครื่องหรือระยะไกล

```bash
openclaw browser profiles
openclaw browser create-profile --name work --color "#FF5A36"
openclaw browser create-profile --name chrome-live --driver existing-session
openclaw browser create-profile --name remote --cdp-url https://browser-host.example.com
openclaw browser delete-profile --name work
```

ใช้โปรไฟล์ที่ระบุ:

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

## Snapshot / ภาพหน้าจอ / actions

Snapshot:

```bash
openclaw browser snapshot
```

ภาพหน้าจอ:

```bash
openclaw browser screenshot
openclaw browser screenshot --full-page
openclaw browser screenshot --ref e12
```

หมายเหตุ:

- `--full-page` ใช้สำหรับการจับภาพทั้งหน้าเท่านั้น; ไม่สามารถใช้ร่วมกับ `--ref`
  หรือ `--element` ได้
- โปรไฟล์ `existing-session` / `user` รองรับภาพหน้าจอทั้งหน้าและภาพหน้าจอแบบ `--ref`
  จากเอาต์พุต snapshot แต่ไม่รองรับภาพหน้าจอ CSS `--element`

Navigate/click/type (ระบบอัตโนมัติ UI แบบอิง ref):

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

ตัวช่วยไฟล์ + ไดอะล็อก:

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

Cookies + ที่เก็บข้อมูล:

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

ใช้โปรไฟล์ `user` ที่มีมาให้ในตัว หรือสร้างโปรไฟล์ `existing-session` ของคุณเอง:

```bash
openclaw browser --browser-profile user tabs
openclaw browser create-profile --name chrome-live --driver existing-session
openclaw browser create-profile --name brave-live --driver existing-session --user-data-dir "~/Library/Application Support/BraveSoftware/Brave-Browser"
openclaw browser --browser-profile chrome-live tabs
```

เส้นทางนี้ใช้ได้เฉพาะบนโฮสต์เท่านั้น สำหรับ Docker, เซิร์ฟเวอร์ headless, Browserless หรือการตั้งค่าระยะไกลอื่น ๆ ให้ใช้โปรไฟล์ CDP แทน

ข้อจำกัดปัจจุบันของ existing-session:

- actions ที่ขับเคลื่อนด้วย snapshot ใช้ refs ไม่ใช่ CSS selectors
- `click` รองรับเฉพาะคลิกซ้าย
- `type` ไม่รองรับ `slowly=true`
- `press` ไม่รองรับ `delayMs`
- `hover`, `scrollintoview`, `drag`, `select`, `fill` และ `evaluate` จะปฏิเสธ
  การ override timeout แบบต่อคำสั่ง
- `select` รองรับค่าเดียวเท่านั้น
- ไม่รองรับ `wait --load networkidle`
- การอัปโหลดไฟล์ต้องใช้ `--ref` / `--input-ref` ไม่รองรับ CSS
  `--element` และปัจจุบันรองรับครั้งละหนึ่งไฟล์
- dialog hooks ไม่รองรับ `--timeout`
- ภาพหน้าจอรองรับการจับภาพทั้งหน้าและ `--ref` แต่ไม่รองรับ CSS `--element`
- `responsebody`, การดักจับดาวน์โหลด, การส่งออก PDF และ batch actions ยังคง
  ต้องใช้เบราว์เซอร์ที่มีการจัดการหรือโปรไฟล์ CDP แบบดิบ

## การควบคุมเบราว์เซอร์ระยะไกล (proxy โฮสต์ Node)

หาก Gateway ทำงานอยู่คนละเครื่องกับเบราว์เซอร์ ให้รัน **โฮสต์ Node** บนเครื่องที่มี Chrome/Brave/Edge/Chromium อยู่ Gateway จะ proxy การดำเนินการของเบราว์เซอร์ไปยัง node นั้น (ไม่ต้องมีเซิร์ฟเวอร์ควบคุมเบราว์เซอร์แยกต่างหาก)

ใช้ `gateway.nodes.browser.mode` เพื่อควบคุมการกำหนดเส้นทางอัตโนมัติ และใช้ `gateway.nodes.browser.node` เพื่อปักหมุดไปยัง node ที่ระบุ หากมีหลาย node เชื่อมต่ออยู่

ความปลอดภัย + การตั้งค่าระยะไกล: [Browser tool](/th/tools/browser), [การเข้าถึงระยะไกล](/th/gateway/remote), [Tailscale](/th/gateway/tailscale), [Security](/th/gateway/security)

## ที่เกี่ยวข้อง

- [เอกสารอ้างอิง CLI](/th/cli)
- [Browser](/th/tools/browser)
