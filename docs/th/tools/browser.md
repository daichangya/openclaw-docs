---
read_when:
    - การเพิ่มระบบอัตโนมัติของเบราว์เซอร์ที่เอเจนต์ควบคุมได้
    - การดีบักว่าเหตุใด openclaw จึงไปรบกวน Chrome ของคุณเอง
    - การติดตั้งใช้งานการตั้งค่าและวงจรชีวิตของเบราว์เซอร์ในแอป macOS
summary: บริการควบคุมเบราว์เซอร์แบบผสานรวม + คำสั่ง action
title: เบราว์เซอร์ (จัดการโดย OpenClaw)
x-i18n:
    generated_at: "2026-04-24T09:35:18Z"
    model: gpt-5.4
    provider: openai
    source_hash: 80805676213ef5195093163874a848955b3c25364b20045a8d759d03ac088e14
    source_path: tools/browser.md
    workflow: 15
---

OpenClaw สามารถรัน **โปรไฟล์ Chrome/Brave/Edge/Chromium แบบเฉพาะ** ที่เอเจนต์ควบคุมได้
โดยแยกจากเบราว์เซอร์ส่วนตัวของคุณ และจัดการผ่านบริการควบคุมในเครื่องขนาดเล็ก
ภายใน Gateway (เฉพาะ loopback)

มุมมองสำหรับผู้เริ่มต้น:

- ให้คิดว่านี่คือ **เบราว์เซอร์แยกสำหรับเอเจนต์เท่านั้น**
- โปรไฟล์ `openclaw` จะ **ไม่** ไปแตะโปรไฟล์เบราว์เซอร์ส่วนตัวของคุณ
- เอเจนต์สามารถ **เปิดแท็บ อ่านหน้า คลิก และพิมพ์** ได้ในเส้นทางที่ปลอดภัย
- โปรไฟล์ `user` แบบ built-in จะเชื่อมต่อกับเซสชัน Chrome ที่คุณลงชื่อเข้าใช้จริงผ่าน Chrome MCP

## สิ่งที่คุณจะได้รับ

- โปรไฟล์เบราว์เซอร์แยกชื่อ **openclaw** (ใช้โทนสีส้มโดยค่าเริ่มต้น)
- การควบคุมแท็บแบบกำหนดผลได้แน่นอน (แสดงรายการ/เปิด/โฟกัส/ปิด)
- action ของเอเจนต์ (คลิก/พิมพ์/ลาก/เลือก), snapshots, screenshots, PDFs
- การรองรับหลายโปรไฟล์แบบเลือกได้ (`openclaw`, `work`, `remote`, ...)

เบราว์เซอร์นี้ **ไม่ใช่** เบราว์เซอร์หลักที่คุณใช้ประจำวัน แต่เป็นพื้นผิวที่ปลอดภัยและแยกออกจากกันสำหรับ
ระบบอัตโนมัติและการตรวจสอบโดยเอเจนต์

## เริ่มต้นอย่างรวดเร็ว

```bash
openclaw browser --browser-profile openclaw status
openclaw browser --browser-profile openclaw start
openclaw browser --browser-profile openclaw open https://example.com
openclaw browser --browser-profile openclaw snapshot
```

หากคุณได้รับข้อความ “Browser disabled” ให้เปิดใช้งานใน config (ดูด้านล่าง) แล้วรีสตาร์ต
Gateway

หากไม่มี `openclaw browser` อยู่เลย หรือเอเจนต์แจ้งว่า browser tool
ไม่พร้อมใช้งาน ให้ข้ามไปที่ [คำสั่งหรือเครื่องมือเบราว์เซอร์หายไป](/th/tools/browser#missing-browser-command-or-tool)

## การควบคุม Plugin

เครื่องมือ `browser` เริ่มต้นเป็น Plugin ที่มากับระบบ ปิดการใช้งานเพื่อแทนที่ด้วย Plugin อื่นที่ลงทะเบียนชื่อเครื่องมือ `browser` เดียวกัน:

```json5
{
  plugins: {
    entries: {
      browser: {
        enabled: false,
      },
    },
  },
}
```

ค่าเริ่มต้นต้องมีทั้ง `plugins.entries.browser.enabled` **และ** `browser.enabled=true` การปิดเฉพาะ Plugin จะลบ CLI `openclaw browser`, เมธอด gateway `browser.request`, เครื่องมือของเอเจนต์ และบริการควบคุมออกเป็นชุดเดียว; config `browser.*` ของคุณจะยังคงอยู่สำหรับตัวแทนที่มาแทน

การเปลี่ยน config ของเบราว์เซอร์ต้องรีสตาร์ต Gateway เพื่อให้ Plugin ลงทะเบียนบริการของมันใหม่ได้

## คำสั่งหรือเครื่องมือเบราว์เซอร์หายไป

หาก `openclaw browser` ไม่รู้จักหลังการอัปเกรด, ไม่มี `browser.request` หรือเอเจนต์รายงานว่า browser tool ไม่พร้อมใช้งาน สาเหตุที่พบบ่อยคือรายการ `plugins.allow` ที่ไม่ได้รวม `browser` ไว้ ให้เพิ่มเข้าไป:

```json5
{
  plugins: {
    allow: ["telegram", "browser"],
  },
}
```

`browser.enabled=true`, `plugins.entries.browser.enabled=true` และ `tools.alsoAllow: ["browser"]` ไม่สามารถใช้แทนการเป็นสมาชิกของ allowlist ได้ — allowlist เป็นตัวควบคุมการโหลด Plugin และนโยบายเครื่องมือจะทำงานหลังจากโหลดแล้วเท่านั้น การลบ `plugins.allow` ออกทั้งหมดก็จะคืนค่าพฤติกรรมเริ่มต้นเช่นกัน

## โปรไฟล์: `openclaw` เทียบกับ `user`

- `openclaw`: เบราว์เซอร์แบบจัดการและแยกออกจากกัน (ไม่ต้องใช้ส่วนขยาย)
- `user`: โปรไฟล์เชื่อมต่อ Chrome MCP แบบ built-in สำหรับเซสชัน **Chrome ที่คุณลงชื่อเข้าใช้จริง**

สำหรับการเรียก browser tool ของเอเจนต์:

- ค่าเริ่มต้น: ใช้เบราว์เซอร์ `openclaw` ที่แยกออกจากกัน
- ควรใช้ `profile="user"` เมื่อเซสชันที่ล็อกอินอยู่เดิมมีความสำคัญ และผู้ใช้
  อยู่หน้าคอมพิวเตอร์เพื่อคลิก/อนุมัติพรอมป์การเชื่อมต่อใดๆ
- `profile` เป็นตัว override แบบชัดเจนเมื่อคุณต้องการโหมดเบราว์เซอร์ที่เฉพาะเจาะจง

ตั้ง `browser.defaultProfile: "openclaw"` หากคุณต้องการให้โหมดแบบจัดการเป็นค่าเริ่มต้น

## การกำหนดค่า

การตั้งค่าเบราว์เซอร์อยู่ใน `~/.openclaw/openclaw.json`

```json5
{
  browser: {
    enabled: true, // ค่าเริ่มต้น: true
    ssrfPolicy: {
      // dangerouslyAllowPrivateNetwork: true, // เลือกเปิดใช้เฉพาะเมื่อเชื่อถือการเข้าถึงเบราว์เซอร์ใน private network โดยตั้งใจ
      // allowPrivateNetwork: true, // alias แบบเดิม
      // hostnameAllowlist: ["*.example.com", "example.com"],
      // allowedHostnames: ["localhost"],
    },
    // cdpUrl: "http://127.0.0.1:18792", // override โปรไฟล์เดี่ยวแบบเดิม
    remoteCdpTimeoutMs: 1500, // timeout ของ CDP HTTP ระยะไกลสำหรับการตรวจสอบการเข้าถึง (มิลลิวินาที)
    remoteCdpHandshakeTimeoutMs: 3000, // timeout ของ CDP WebSocket handshake ระยะไกล (มิลลิวินาที)
    defaultProfile: "openclaw",
    color: "#FF4500",
    headless: false,
    noSandbox: false,
    attachOnly: false,
    executablePath: "/Applications/Brave Browser.app/Contents/MacOS/Brave Browser",
    profiles: {
      openclaw: { cdpPort: 18800, color: "#FF4500" },
      work: { cdpPort: 18801, color: "#0066CC" },
      user: {
        driver: "existing-session",
        attachOnly: true,
        color: "#00AA00",
      },
      brave: {
        driver: "existing-session",
        attachOnly: true,
        userDataDir: "~/Library/Application Support/BraveSoftware/Brave-Browser",
        color: "#FB542B",
      },
      remote: { cdpUrl: "http://10.0.0.42:9222", color: "#00AA00" },
    },
  },
}
```

<AccordionGroup>

<Accordion title="พอร์ตและการเข้าถึง">

- บริการควบคุม bind กับ loopback บนพอร์ตที่คำนวณจาก `gateway.port` (ค่าเริ่มต้น `18791` = gateway + 2) การ override `gateway.port` หรือ `OPENCLAW_GATEWAY_PORT` จะเลื่อนพอร์ตที่คำนวณได้ในกลุ่มเดียวกัน
- โปรไฟล์ `openclaw` แบบ local จะกำหนด `cdpPort`/`cdpUrl` อัตโนมัติ; ให้ตั้งค่าเหล่านี้เฉพาะสำหรับ CDP ระยะไกล `cdpUrl` จะใช้ค่าเริ่มต้นเป็นพอร์ต CDP ในเครื่องที่จัดการโดยระบบเมื่อไม่ได้ตั้งค่า
- `remoteCdpTimeoutMs` ใช้กับการตรวจสอบการเข้าถึง CDP HTTP ระยะไกล (ที่ไม่ใช่ loopback); `remoteCdpHandshakeTimeoutMs` ใช้กับ CDP WebSocket handshakes ระยะไกล

</Accordion>

<Accordion title="นโยบาย SSRF">

- การนำทางของเบราว์เซอร์และ open-tab จะถูกป้องกัน SSRF ก่อนนำทาง และพยายามตรวจสอบอีกครั้งกับ URL `http(s)` ปลายทางหลังจากนั้น
- ในโหมด SSRF แบบเข้มงวด การค้นหา endpoint ของ CDP ระยะไกลและการ probe `/json/version` (`cdpUrl`) ก็จะถูกตรวจสอบด้วย
- `browser.ssrfPolicy.dangerouslyAllowPrivateNetwork` ปิดไว้โดยค่าเริ่มต้น; เปิดใช้เฉพาะเมื่อเชื่อถือการเข้าถึงเบราว์เซอร์ใน private network โดยเจตนาเท่านั้น
- `browser.ssrfPolicy.allowPrivateNetwork` ยังคงรองรับในฐานะ alias แบบเดิม

</Accordion>

<Accordion title="พฤติกรรมของโปรไฟล์">

- `attachOnly: true` หมายถึงจะไม่เปิดเบราว์เซอร์ในเครื่องเอง; จะเชื่อมต่อก็ต่อเมื่อมีเบราว์เซอร์ที่รันอยู่แล้วเท่านั้น
- `color` (ทั้งระดับบนสุดและต่อโปรไฟล์) จะย้อมสี UI ของเบราว์เซอร์เพื่อให้คุณเห็นว่าโปรไฟล์ใดกำลังใช้งานอยู่
- โปรไฟล์เริ่มต้นคือ `openclaw` (แบบ standalone ที่จัดการโดยระบบ) ใช้ `defaultProfile: "user"` เพื่อเลือกใช้เบราว์เซอร์ของผู้ใช้ที่ลงชื่อเข้าใช้แล้ว
- ลำดับการตรวจจับอัตโนมัติ: เบราว์เซอร์เริ่มต้นของระบบหากเป็น Chromium-based; หากไม่ใช่จะเป็น Chrome → Brave → Edge → Chromium → Chrome Canary
- `driver: "existing-session"` ใช้ Chrome DevTools MCP แทน CDP แบบดิบ อย่าตั้ง `cdpUrl` สำหรับ driver นี้
- ตั้ง `browser.profiles.<name>.userDataDir` เมื่อโปรไฟล์ existing-session ควรเชื่อมต่อกับโปรไฟล์ผู้ใช้ Chromium ที่ไม่ใช่ค่าเริ่มต้น (Brave, Edge ฯลฯ)

</Accordion>

</AccordionGroup>

## ใช้ Brave (หรือเบราว์เซอร์ Chromium-based อื่น)

หากเบราว์เซอร์ **ค่าเริ่มต้นของระบบ** ของคุณเป็น Chromium-based (Chrome/Brave/Edge/ฯลฯ)
OpenClaw จะใช้มันโดยอัตโนมัติ ตั้ง `browser.executablePath` เพื่อ override
การตรวจจับอัตโนมัติ:

```bash
openclaw config set browser.executablePath "/usr/bin/google-chrome"
```

หรือตั้งค่าใน config แยกตามแพลตฟอร์ม:

<Tabs>
  <Tab title="macOS">
```json5
{
  browser: {
    executablePath: "/Applications/Brave Browser.app/Contents/MacOS/Brave Browser",
  },
}
```
  </Tab>
  <Tab title="Windows">
```json5
{
  browser: {
    executablePath: "C:\\Program Files\\BraveSoftware\\Brave-Browser\\Application\\brave.exe",
  },
}
```
  </Tab>
  <Tab title="Linux">
```json5
{
  browser: {
    executablePath: "/usr/bin/brave-browser",
  },
}
```
  </Tab>
</Tabs>

## การควบคุมแบบ local เทียบกับ remote

- **การควบคุมแบบ local (ค่าเริ่มต้น):** Gateway จะเริ่มบริการควบคุม loopback และสามารถเปิดเบราว์เซอร์ในเครื่องได้
- **การควบคุมแบบ remote (โฮสต์ node):** รันโฮสต์ node บนเครื่องที่มีเบราว์เซอร์; Gateway จะพร็อกซี action ของเบราว์เซอร์ไปยังโฮสต์นั้น
- **CDP ระยะไกล:** ตั้ง `browser.profiles.<name>.cdpUrl` (หรือ `browser.cdpUrl`) เพื่อ
  เชื่อมต่อกับเบราว์เซอร์ Chromium-based ระยะไกล ในกรณีนี้ OpenClaw จะไม่เปิดเบราว์เซอร์ในเครื่อง

พฤติกรรมการหยุดจะแตกต่างกันตามโหมดของโปรไฟล์:

- โปรไฟล์แบบจัดการในเครื่อง: `openclaw browser stop` จะหยุดโปรเซสเบราว์เซอร์ที่
  OpenClaw เป็นผู้เปิด
- โปรไฟล์ attach-only และ CDP ระยะไกล: `openclaw browser stop` จะปิด
  control session ที่ใช้งานอยู่ และปล่อย overrides ของ Playwright/CDP emulation (viewport,
  color scheme, locale, timezone, offline mode และสถานะคล้ายกัน) แม้ว่า
  OpenClaw จะไม่ได้เป็นผู้เปิดโปรเซสเบราว์เซอร์ก็ตาม

URL ของ CDP ระยะไกลสามารถมีการยืนยันตัวตนได้:

- โทเค็นใน query (เช่น `https://provider.example?token=<token>`)
- HTTP Basic auth (เช่น `https://user:pass@provider.example`)

OpenClaw จะเก็บข้อมูลยืนยันตัวตนไว้เมื่อเรียก endpoint `/json/*` และเมื่อเชื่อมต่อ
กับ CDP WebSocket ควรใช้ environment variables หรือ secrets managers สำหรับ
โทเค็นแทนการ commit ลงในไฟล์ config

## Node browser proxy (ค่าเริ่มต้นแบบ zero-config)

หากคุณรัน **node host** บนเครื่องที่มีเบราว์เซอร์ของคุณ OpenClaw สามารถ
กำหนดเส้นทางการเรียก browser tool ไปยัง node นั้นโดยอัตโนมัติโดยไม่ต้องมี config เบราว์เซอร์เพิ่มเติม
นี่คือเส้นทางเริ่มต้นสำหรับ gateway ระยะไกล

หมายเหตุ:

- node host จะเปิดเผย browser control server ในเครื่องของมันผ่าน **proxy command**
- โปรไฟล์มาจาก config `browser.profiles` ของ node เอง (เหมือนกับ local)
- `nodeHost.browserProxy.allowProfiles` เป็นทางเลือก ปล่อยว่างไว้เพื่อใช้พฤติกรรมแบบเดิม/ค่าเริ่มต้น: ทุกโปรไฟล์ที่กำหนดค่าไว้ยังคงเข้าถึงได้ผ่าน proxy รวมถึงเส้นทาง create/delete โปรไฟล์
- หากคุณตั้ง `nodeHost.browserProxy.allowProfiles` OpenClaw จะถือว่านี่เป็นขอบเขต least-privilege: จะกำหนดเป้าหมายได้เฉพาะโปรไฟล์ที่อยู่ใน allowlist และเส้นทาง create/delete โปรไฟล์แบบถาวรจะถูกบล็อกบนพื้นผิว proxy
- ปิดการใช้งานได้หากคุณไม่ต้องการ:
  - บน node: `nodeHost.browserProxy.enabled=false`
  - บน gateway: `gateway.nodes.browser.mode="off"`

## Browserless (CDP ระยะไกลแบบโฮสต์)

[Browserless](https://browserless.io) เป็นบริการ Chromium แบบโฮสต์ที่เปิดเผย
URL สำหรับเชื่อมต่อ CDP ผ่าน HTTPS และ WebSocket OpenClaw สามารถใช้ได้ทั้งสองรูปแบบ แต่
สำหรับโปรไฟล์เบราว์เซอร์ระยะไกล ตัวเลือกที่ง่ายที่สุดคือใช้ URL WebSocket โดยตรง
จากเอกสารการเชื่อมต่อของ Browserless

ตัวอย่าง:

```json5
{
  browser: {
    enabled: true,
    defaultProfile: "browserless",
    remoteCdpTimeoutMs: 2000,
    remoteCdpHandshakeTimeoutMs: 4000,
    profiles: {
      browserless: {
        cdpUrl: "wss://production-sfo.browserless.io?token=<BROWSERLESS_API_KEY>",
        color: "#00AA00",
      },
    },
  },
}
```

หมายเหตุ:

- แทนที่ `<BROWSERLESS_API_KEY>` ด้วยโทเค็น Browserless จริงของคุณ
- เลือก region endpoint ที่ตรงกับบัญชี Browserless ของคุณ (ดูเอกสารของพวกเขา)
- หาก Browserless ให้ URL ฐานแบบ HTTPS มา คุณสามารถแปลงเป็น
  `wss://` เพื่อเชื่อมต่อ CDP โดยตรง หรือใช้ URL HTTPS เดิมและให้ OpenClaw
  ค้นหา `/json/version` ก็ได้

## ผู้ให้บริการ CDP แบบ WebSocket โดยตรง

บริการเบราว์เซอร์แบบโฮสต์บางแห่งเปิดเผย endpoint แบบ **WebSocket โดยตรง** แทน
การค้นหา CDP มาตรฐานแบบ HTTP (`/json/version`) OpenClaw รองรับ
รูปแบบ CDP URL สามแบบและจะเลือกกลยุทธ์การเชื่อมต่อที่ถูกต้องโดยอัตโนมัติ:

- **การค้นหาผ่าน HTTP(S)** — `http://host[:port]` หรือ `https://host[:port]`
  OpenClaw จะเรียก `/json/version` เพื่อค้นหา WebSocket debugger URL แล้วจึง
  เชื่อมต่อ ไม่มี WebSocket fallback
- **endpoint แบบ WebSocket โดยตรง** — `ws://host[:port]/devtools/<kind>/<id>` หรือ
  `wss://...` ที่มีพาธ `/devtools/browser|page|worker|shared_worker|service_worker/<id>`
  OpenClaw จะเชื่อมต่อโดยตรงผ่าน WebSocket handshake และข้าม
  `/json/version` ทั้งหมด
- **root WebSocket แบบเปล่า** — `ws://host[:port]` หรือ `wss://host[:port]` โดยไม่มี
  พาธ `/devtools/...` (เช่น [Browserless](https://browserless.io),
  [Browserbase](https://www.browserbase.com)) OpenClaw จะพยายามใช้การค้นหา HTTP
  `/json/version` ก่อน (โดยปรับ scheme เป็น `http`/`https`);
  หากการค้นหาส่งกลับ `webSocketDebuggerUrl` ระบบจะใช้ค่านั้น มิฉะนั้น OpenClaw
  จะ fallback ไปใช้ WebSocket handshake โดยตรงที่ root เปล่า วิธีนี้ทำให้
  `ws://` เปล่าที่ชี้ไปยัง Chrome ในเครื่องยังเชื่อมต่อได้ เพราะ Chrome
  ยอมรับ WebSocket upgrades เฉพาะบนพาธเฉพาะต่อเป้าหมายจาก
  `/json/version` เท่านั้น

### Browserbase

[Browserbase](https://www.browserbase.com) คือแพลตฟอร์มคลาวด์สำหรับรัน
เบราว์เซอร์แบบ headless พร้อมความสามารถแก้ CAPTCHA, โหมด stealth และ
residential proxies ในตัว

```json5
{
  browser: {
    enabled: true,
    defaultProfile: "browserbase",
    remoteCdpTimeoutMs: 3000,
    remoteCdpHandshakeTimeoutMs: 5000,
    profiles: {
      browserbase: {
        cdpUrl: "wss://connect.browserbase.com?apiKey=<BROWSERBASE_API_KEY>",
        color: "#F97316",
      },
    },
  },
}
```

หมายเหตุ:

- [สมัครใช้งาน](https://www.browserbase.com/sign-up) และคัดลอก **API Key**
  ของคุณจาก [แดชบอร์ด Overview](https://www.browserbase.com/overview)
- แทนที่ `<BROWSERBASE_API_KEY>` ด้วย Browserbase API key จริงของคุณ
- Browserbase จะสร้าง browser session ให้อัตโนมัติเมื่อเชื่อมต่อ WebSocket ดังนั้น
  จึงไม่จำเป็นต้องมีขั้นตอนสร้าง session ด้วยตนเอง
- แพ็กเกจฟรีอนุญาตหนึ่ง concurrent session และหนึ่ง browser hour ต่อเดือน
  ดู [pricing](https://www.browserbase.com/pricing) สำหรับขีดจำกัดของแพ็กเกจแบบชำระเงิน
- ดู [เอกสาร Browserbase](https://docs.browserbase.com) สำหรับเอกสารอ้างอิง API แบบเต็ม
  คู่มือ SDK และตัวอย่างการผสานรวม

## ความปลอดภัย

แนวคิดสำคัญ:

- การควบคุมเบราว์เซอร์เป็นแบบ loopback-only; การเข้าถึงจะผ่านการยืนยันตัวตนของ Gateway หรือการจับคู่ node
- HTTP API ของเบราว์เซอร์แบบ standalone loopback ใช้ **การยืนยันตัวตนแบบ shared-secret เท่านั้น**:
  gateway token bearer auth, `x-openclaw-password` หรือ HTTP Basic auth พร้อม
  รหัสผ่าน gateway ที่กำหนดค่าไว้
- ส่วนหัวระบุตัวตนของ Tailscale Serve และ `gateway.auth.mode: "trusted-proxy"` จะ
  **ไม่** ใช้ยืนยันตัวตนกับ loopback browser API แบบ standalone นี้
- หากเปิดใช้การควบคุมเบราว์เซอร์และไม่ได้กำหนดค่า shared-secret auth, OpenClaw
  จะสร้าง `gateway.auth.token` ให้อัตโนมัติเมื่อเริ่มต้นและบันทึกลง config
- OpenClaw จะ **ไม่** สร้างโทเค็นนั้นอัตโนมัติหาก `gateway.auth.mode` ถูกตั้งเป็น
  `password`, `none` หรือ `trusted-proxy` อยู่แล้ว
- ให้เก็บ Gateway และ node host ทั้งหมดไว้บน private network (Tailscale); หลีกเลี่ยงการเปิดเผยสู่สาธารณะ
- ให้ถือว่า URL/โทเค็น CDP ระยะไกลเป็นความลับ; ควรใช้ env vars หรือ secrets manager

เคล็ดลับสำหรับ CDP ระยะไกล:

- ควรใช้ endpoint ที่เข้ารหัส (HTTPS หรือ WSS) และโทเค็นอายุสั้นเมื่อเป็นไปได้
- หลีกเลี่ยงการฝังโทเค็นอายุยาวไว้ในไฟล์ config โดยตรง

## โปรไฟล์ (หลายเบราว์เซอร์)

OpenClaw รองรับหลายโปรไฟล์แบบตั้งชื่อ (routing configs) โปรไฟล์สามารถเป็นได้ดังนี้:

- **openclaw-managed**: อินสแตนซ์เบราว์เซอร์ Chromium-based แบบเฉพาะ พร้อม user data directory และพอร์ต CDP ของตัวเอง
- **remote**: URL CDP แบบระบุชัดเจน (เบราว์เซอร์ Chromium-based ที่รันอยู่ที่อื่น)
- **existing session**: โปรไฟล์ Chrome ปัจจุบันของคุณผ่านการเชื่อมต่ออัตโนมัติของ Chrome DevTools MCP

ค่าเริ่มต้น:

- โปรไฟล์ `openclaw` จะถูกสร้างอัตโนมัติหากไม่มี
- โปรไฟล์ `user` เป็น built-in สำหรับการเชื่อมต่อ existing-session ผ่าน Chrome MCP
- โปรไฟล์ existing-session นอกเหนือจาก `user` ต้องเลือกเปิดใช้เอง; สร้างได้ด้วย `--driver existing-session`
- พอร์ต CDP แบบ local จะถูกจัดสรรจากช่วง **18800–18899** โดยค่าเริ่มต้น
- เมื่อลบโปรไฟล์ user data directory ในเครื่องจะถูกย้ายไปยัง Trash

endpoint การควบคุมทั้งหมดรองรับ `?profile=<name>`; ส่วน CLI ใช้ `--browser-profile`

## Existing-session ผ่าน Chrome DevTools MCP

OpenClaw ยังสามารถเชื่อมต่อกับโปรไฟล์เบราว์เซอร์ Chromium-based ที่กำลังรันอยู่ผ่าน
Chrome DevTools MCP server อย่างเป็นทางการได้ด้วย วิธีนี้จะใช้แท็บและสถานะการล็อกอิน
ที่เปิดอยู่แล้วในโปรไฟล์เบราว์เซอร์นั้นซ้ำ

ข้อมูลพื้นฐานอย่างเป็นทางการและเอกสารอ้างอิงการตั้งค่า:

- [Chrome for Developers: Use Chrome DevTools MCP with your browser session](https://developer.chrome.com/blog/chrome-devtools-mcp-debug-your-browser-session)
- [Chrome DevTools MCP README](https://github.com/ChromeDevTools/chrome-devtools-mcp)

โปรไฟล์แบบ built-in:

- `user`

ทางเลือก: สร้างโปรไฟล์ existing-session แบบกำหนดเองของคุณเอง หากคุณต้องการ
ชื่อ สี หรือ browser data directory ที่ต่างออกไป

พฤติกรรมเริ่มต้น:

- โปรไฟล์ `user` แบบ built-in ใช้การเชื่อมต่ออัตโนมัติของ Chrome MCP ซึ่งกำหนดเป้าหมายไปที่
  โปรไฟล์ Google Chrome ในเครื่องค่าเริ่มต้น

ใช้ `userDataDir` สำหรับ Brave, Edge, Chromium หรือโปรไฟล์ Chrome ที่ไม่ใช่ค่าเริ่มต้น:

```json5
{
  browser: {
    profiles: {
      brave: {
        driver: "existing-session",
        attachOnly: true,
        userDataDir: "~/Library/Application Support/BraveSoftware/Brave-Browser",
        color: "#FB542B",
      },
    },
  },
}
```

จากนั้นในเบราว์เซอร์ที่ตรงกัน:

1. เปิดหน้า inspect ของเบราว์เซอร์นั้นสำหรับ remote debugging
2. เปิดใช้ remote debugging
3. ให้เบราว์เซอร์ยังคงทำงานอยู่ และอนุมัติพรอมป์การเชื่อมต่อเมื่อ OpenClaw เชื่อมต่อเข้ามา

หน้า inspect ที่พบบ่อย:

- Chrome: `chrome://inspect/#remote-debugging`
- Brave: `brave://inspect/#remote-debugging`
- Edge: `edge://inspect/#remote-debugging`

การทดสอบแบบ smoke test สำหรับการเชื่อมต่อจริง:

```bash
openclaw browser --browser-profile user start
openclaw browser --browser-profile user status
openclaw browser --browser-profile user tabs
openclaw browser --browser-profile user snapshot --format ai
```

ลักษณะของการทำงานสำเร็จ:

- `status` แสดง `driver: existing-session`
- `status` แสดง `transport: chrome-mcp`
- `status` แสดง `running: true`
- `tabs` แสดงรายการแท็บเบราว์เซอร์ที่คุณเปิดอยู่แล้ว
- `snapshot` ส่งคืน refs จากแท็บที่ใช้งานจริงที่เลือกอยู่

สิ่งที่ควรตรวจสอบหากการเชื่อมต่อไม่ทำงาน:

- เบราว์เซอร์ Chromium-based เป้าหมายเป็นเวอร์ชัน `144+`
- เปิดใช้ remote debugging ในหน้า inspect ของเบราว์เซอร์นั้นแล้ว
- เบราว์เซอร์แสดงพรอมป์ขอเชื่อมต่อและคุณได้ยอมรับแล้ว
- `openclaw doctor` จะย้าย config เบราว์เซอร์แบบเดิมที่อิง extension และตรวจสอบว่า
  มีการติดตั้ง Chrome ในเครื่องสำหรับโปรไฟล์ auto-connect เริ่มต้น แต่ไม่สามารถ
  เปิดใช้ remote debugging ฝั่งเบราว์เซอร์ให้คุณได้

การใช้งานโดยเอเจนต์:

- ใช้ `profile="user"` เมื่อคุณต้องการสถานะเบราว์เซอร์ที่ผู้ใช้ล็อกอินอยู่
- หากคุณใช้โปรไฟล์ existing-session แบบกำหนดเอง ให้ส่งชื่อโปรไฟล์นั้นอย่างชัดเจน
- เลือกโหมดนี้เฉพาะเมื่อผู้ใช้อยู่หน้าคอมพิวเตอร์เพื่ออนุมัติพรอมป์การเชื่อมต่อ
- Gateway หรือ node host สามารถ spawn `npx chrome-devtools-mcp@latest --autoConnect`

หมายเหตุ:

- เส้นทางนี้มีความเสี่ยงสูงกว่าโปรไฟล์ `openclaw` แบบแยกออกจากกัน เพราะสามารถ
  ทำงานภายในเซสชันเบราว์เซอร์ที่คุณลงชื่อเข้าใช้อยู่ได้
- OpenClaw จะไม่เปิดเบราว์เซอร์สำหรับ driver นี้; จะเชื่อมต่อเท่านั้น
- OpenClaw ใช้โฟลว์ `--autoConnect` ของ Chrome DevTools MCP อย่างเป็นทางการในส่วนนี้ หาก
  มีการตั้ง `userDataDir` ระบบจะส่งต่อค่าไปเพื่อกำหนดเป้าหมาย user data directory นั้น
- existing-session สามารถเชื่อมต่อบนโฮสต์ที่เลือกหรือผ่าน
  browser node ที่เชื่อมต่ออยู่ได้ หาก Chrome อยู่ที่อื่นและไม่มี browser node เชื่อมต่ออยู่ ให้ใช้
  CDP ระยะไกลหรือ node host แทน

<Accordion title="ข้อจำกัดของฟีเจอร์ Existing-session">

เมื่อเทียบกับโปรไฟล์ `openclaw` แบบจัดการแล้ว driver แบบ existing-session มีข้อจำกัดมากกว่า:

- **ภาพหน้าจอ** — การจับภาพทั้งหน้าและการจับด้วยองค์ประกอบ `--ref` ใช้งานได้; ตัวเลือก CSS `--element` ใช้ไม่ได้ `--full-page` ไม่สามารถใช้ร่วมกับ `--ref` หรือ `--element` ได้ ไม่จำเป็นต้องใช้ Playwright สำหรับภาพหน้าจอทั้งหน้าหรือแบบอิง ref
- **Actions** — `click`, `type`, `hover`, `scrollIntoView`, `drag` และ `select` ต้องใช้ snapshot refs (ไม่รองรับ CSS selectors) `click` รองรับเฉพาะปุ่มซ้าย `type` ไม่รองรับ `slowly=true`; ให้ใช้ `fill` หรือ `press` `press` ไม่รองรับ `delayMs` `type`, `hover`, `scrollIntoView`, `drag`, `select`, `fill` และ `evaluate` ไม่รองรับ timeout รายการต่อรายการ `select` รับค่าได้เพียงค่าเดียว
- **Wait / upload / dialog** — `wait --url` รองรับรูปแบบ exact, substring และ glob; ไม่รองรับ `wait --load networkidle` hook สำหรับอัปโหลดต้องใช้ `ref` หรือ `inputRef`, อัปโหลดได้ครั้งละหนึ่งไฟล์ และไม่รองรับ CSS `element` hook สำหรับ dialog ไม่รองรับการ override timeout
- **ฟีเจอร์เฉพาะแบบ managed** — batch actions, การส่งออก PDF, การดักจับการดาวน์โหลด และ `responsebody` ยังคงต้องใช้เส้นทางเบราว์เซอร์แบบ managed

</Accordion>

## การรับประกันการแยกออกจากกัน

- **user data dir แบบเฉพาะ**: จะไม่แตะโปรไฟล์เบราว์เซอร์ส่วนตัวของคุณ
- **พอร์ตแบบเฉพาะ**: หลีกเลี่ยง `9222` เพื่อป้องกันการชนกับเวิร์กโฟลว์สำหรับการพัฒนา
- **การควบคุมแท็บแบบกำหนดผลได้แน่นอน**: กำหนดเป้าหมายแท็บด้วย `targetId` ไม่ใช่ “แท็บล่าสุด”

## การเลือกเบราว์เซอร์

เมื่อเปิดใช้งานในเครื่อง OpenClaw จะเลือกตัวแรกที่พร้อมใช้งาน:

1. Chrome
2. Brave
3. Edge
4. Chromium
5. Chrome Canary

คุณสามารถ override ได้ด้วย `browser.executablePath`

แพลตฟอร์ม:

- macOS: ตรวจสอบ `/Applications` และ `~/Applications`
- Linux: มองหา `google-chrome`, `brave`, `microsoft-edge`, `chromium` เป็นต้น
- Windows: ตรวจสอบตำแหน่งติดตั้งที่พบบ่อย

## API ควบคุม (ทางเลือก)

สำหรับการเขียนสคริปต์และการดีบัก Gateway จะเปิดเผย **HTTP
control API แบบ loopback-only** ขนาดเล็ก พร้อมกับ CLI `openclaw browser` ที่ตรงกัน (snapshots, refs, ความสามารถเพิ่มเติมของ wait, JSON output, เวิร์กโฟลว์ดีบัก) ดู
[Browser control API](/th/tools/browser-control) สำหรับเอกสารอ้างอิงแบบเต็ม

## การแก้ปัญหา

สำหรับปัญหาเฉพาะบน Linux (โดยเฉพาะ snap Chromium) โปรดดู
[Browser troubleshooting](/th/tools/browser-linux-troubleshooting)

สำหรับการตั้งค่าแบบแยกโฮสต์ WSL2 Gateway + Windows Chrome โปรดดู
[WSL2 + Windows + remote Chrome CDP troubleshooting](/th/tools/browser-wsl2-windows-remote-cdp-troubleshooting)

### ความล้มเหลวของการเริ่มต้น CDP เทียบกับการบล็อก SSRF ตอนนำทาง

นี่เป็นคนละประเภทของความล้มเหลว และชี้ไปยังเส้นทางโค้ดคนละส่วน

- **ความล้มเหลวของการเริ่มต้นหรือความพร้อมของ CDP** หมายความว่า OpenClaw ไม่สามารถยืนยันได้ว่า control plane ของเบราว์เซอร์อยู่ในสถานะพร้อมใช้งาน
- **การบล็อก SSRF ตอนนำทาง** หมายความว่า control plane ของเบราว์เซอร์พร้อมใช้งานแล้ว แต่เป้าหมายการนำทางของหน้าถูกนโยบายปฏิเสธ

ตัวอย่างที่พบบ่อย:

- ความล้มเหลวของการเริ่มต้นหรือความพร้อมของ CDP:
  - `Chrome CDP websocket for profile "openclaw" is not reachable after start`
  - `Remote CDP for profile "<name>" is not reachable at <cdpUrl>`
- การบล็อก SSRF ตอนนำทาง:
  - โฟลว์ `open`, `navigate`, snapshot หรือการเปิดแท็บล้มเหลวพร้อมข้อผิดพลาดด้านนโยบายเบราว์เซอร์/เครือข่าย ขณะที่ `start` และ `tabs` ยังทำงานได้

ใช้ลำดับสั้นๆ นี้เพื่อแยกสองกรณีออกจากกัน:

```bash
openclaw browser --browser-profile openclaw start
openclaw browser --browser-profile openclaw tabs
openclaw browser --browser-profile openclaw open https://example.com
```

วิธีอ่านผลลัพธ์:

- หาก `start` ล้มเหลวพร้อม `not reachable after start` ให้แก้ปัญหาความพร้อมของ CDP ก่อน
- หาก `start` สำเร็จแต่ `tabs` ล้มเหลว แสดงว่า control plane ยังไม่สมบูรณ์ ให้ถือว่านี่เป็นปัญหาการเข้าถึง CDP ไม่ใช่ปัญหาการนำทางของหน้า
- หาก `start` และ `tabs` สำเร็จ แต่ `open` หรือ `navigate` ล้มเหลว แสดงว่า browser control plane ทำงานแล้ว และความล้มเหลวอยู่ที่นโยบายการนำทางหรือหน้าปลายทาง
- หาก `start`, `tabs` และ `open` สำเร็จทั้งหมด แสดงว่าเส้นทางควบคุมเบราว์เซอร์แบบ managed ขั้นพื้นฐานใช้งานได้ปกติ

รายละเอียดพฤติกรรมที่สำคัญ:

- config ของเบราว์เซอร์มีค่าเริ่มต้นเป็นอ็อบเจ็กต์นโยบาย SSRF แบบ fail-closed แม้ว่าคุณจะไม่ได้กำหนดค่า `browser.ssrfPolicy`
- สำหรับโปรไฟล์ managed `openclaw` แบบ local loopback การตรวจสอบสถานะ CDP จะข้ามการบังคับใช้นโยบายการเข้าถึง SSRF ของเบราว์เซอร์โดยตั้งใจสำหรับ local control plane ของ OpenClaw เอง
- การป้องกันการนำทางเป็นอีกส่วนหนึ่ง การที่ `start` หรือ `tabs` สำเร็จไม่ได้หมายความว่าเป้าหมาย `open` หรือ `navigate` ในภายหลังจะได้รับอนุญาต

แนวทางด้านความปลอดภัย:

- **อย่า** ผ่อนคลายนโยบาย SSRF ของเบราว์เซอร์โดยค่าเริ่มต้น
- ควรใช้ข้อยกเว้นโฮสต์แบบแคบ เช่น `hostnameAllowlist` หรือ `allowedHostnames` มากกว่าการเปิดการเข้าถึง private network แบบกว้าง
- ใช้ `dangerouslyAllowPrivateNetwork: true` เฉพาะในสภาพแวดล้อมที่เชื่อถือได้โดยเจตนา ซึ่งจำเป็นต้องมีการเข้าถึงเบราว์เซอร์ใน private network และผ่านการตรวจสอบแล้ว

## เครื่องมือของเอเจนต์ + วิธีการทำงานของการควบคุม

เอเจนต์จะได้รับ **หนึ่งเครื่องมือ** สำหรับระบบอัตโนมัติของเบราว์เซอร์:

- `browser` — status/start/stop/tabs/open/focus/close/snapshot/screenshot/navigate/act

การแมปการทำงาน:

- `browser snapshot` จะส่งคืนต้นไม้ UI แบบคงที่ (AI หรือ ARIA)
- `browser act` ใช้ `ref` IDs จาก snapshot เพื่อคลิก/พิมพ์/ลาก/เลือก
- `browser screenshot` ใช้จับภาพพิกเซล (ทั้งหน้าหรือเฉพาะองค์ประกอบ)
- `browser` รองรับ:
  - `profile` เพื่อเลือกโปรไฟล์เบราว์เซอร์แบบตั้งชื่อ (openclaw, chrome หรือ CDP ระยะไกล)
  - `target` (`sandbox` | `host` | `node`) เพื่อเลือกตำแหน่งที่เบราว์เซอร์อยู่
  - ในเซสชันแบบ sandboxed, `target: "host"` ต้องมี `agents.defaults.sandbox.browser.allowHostControl=true`
  - หากไม่ระบุ `target`: เซสชันแบบ sandboxed จะใช้ค่าเริ่มต้นเป็น `sandbox`, เซสชันที่ไม่ใช่ sandbox จะใช้ค่าเริ่มต้นเป็น `host`
  - หากมี node ที่รองรับเบราว์เซอร์เชื่อมต่ออยู่ เครื่องมืออาจกำหนดเส้นทางไปยัง node นั้นโดยอัตโนมัติ เว้นแต่คุณจะตรึงค่าไว้ด้วย `target="host"` หรือ `target="node"`

วิธีนี้ช่วยให้เอเจนต์มีความกำหนดแน่นอนและหลีกเลี่ยงตัวเลือกที่เปราะบาง

## ที่เกี่ยวข้อง

- [Tools Overview](/th/tools) — เครื่องมือเอเจนต์ทั้งหมดที่ใช้งานได้
- [Sandboxing](/th/gateway/sandboxing) — การควบคุมเบราว์เซอร์ในสภาพแวดล้อมแบบ sandbox
- [Security](/th/gateway/security) — ความเสี่ยงและการเสริมความแข็งแกร่งของการควบคุมเบราว์เซอร์
