---
read_when:
    - การเพิ่มระบบอัตโนมัติเบราว์เซอร์ที่ควบคุมโดยเอเจนต์
    - การดีบักว่าทำไม openclaw ถึงไปรบกวน Chrome ของคุณเอง
    - การติดตั้งใช้งานการตั้งค่าและวงจรชีวิตของเบราว์เซอร์ในแอป macOS
summary: บริการควบคุมเบราว์เซอร์แบบรวมศูนย์ + คำสั่ง action
title: Browser (จัดการโดย OpenClaw)
x-i18n:
    generated_at: "2026-04-23T05:59:15Z"
    model: gpt-5.4
    provider: openai
    source_hash: 865b0020d66366a62939f8ed28b9cda88d56ee7f5245b1b24a4e804ce55ea42d
    source_path: tools/browser.md
    workflow: 15
---

# Browser (จัดการโดย openclaw)

OpenClaw สามารถรัน **โปรไฟล์ Chrome/Brave/Edge/Chromium แบบเฉพาะ** ที่เอเจนต์ควบคุมได้
มันแยกจากเบราว์เซอร์ส่วนตัวของคุณ และถูกจัดการผ่านบริการควบคุมภายในเครื่องขนาดเล็ก
ภายใน Gateway (loopback เท่านั้น)

มุมมองสำหรับผู้เริ่มต้น:

- ให้คิดว่ามันคือ **เบราว์เซอร์แยกต่างหากที่มีไว้สำหรับเอเจนต์เท่านั้น**
- โปรไฟล์ `openclaw` จะ **ไม่แตะต้องโปรไฟล์เบราว์เซอร์ส่วนตัว** ของคุณ
- เอเจนต์สามารถ **เปิดแท็บ อ่านหน้า คลิก และพิมพ์** ได้ในเลนที่ปลอดภัย
- โปรไฟล์ `user` ที่มีมาในตัวจะเชื่อมกับเซสชัน Chrome จริงที่คุณล็อกอินอยู่ผ่าน Chrome MCP

## สิ่งที่คุณจะได้รับ

- โปรไฟล์เบราว์เซอร์แยกต่างหากชื่อ **openclaw** (ค่าเริ่มต้นเป็นโทนสีส้ม)
- การควบคุมแท็บแบบ deterministic (แสดงรายการ/เปิด/โฟกัส/ปิด)
- action ของเอเจนต์ (คลิก/พิมพ์/ลาก/เลือก), snapshot, screenshot, PDF
- รองรับหลายโปรไฟล์แบบไม่บังคับ (`openclaw`, `work`, `remote`, ...)

เบราว์เซอร์นี้ **ไม่ใช่** daily driver ของคุณ มันคือพื้นผิวที่ปลอดภัยและแยกขอบเขตสำหรับ
automation และการตรวจสอบโดยเอเจนต์

## เริ่มต้นอย่างรวดเร็ว

```bash
openclaw browser --browser-profile openclaw status
openclaw browser --browser-profile openclaw start
openclaw browser --browser-profile openclaw open https://example.com
openclaw browser --browser-profile openclaw snapshot
```

หากคุณเจอ “Browser disabled” ให้เปิดใช้มันใน config (ดูด้านล่าง) แล้วรีสตาร์ต
Gateway

หาก `openclaw browser` หายไปทั้งคำสั่ง หรือเอเจนต์บอกว่า browser tool
ไม่พร้อมใช้งาน ให้ไปที่ [Missing browser command or tool](/th/tools/browser#missing-browser-command-or-tool)

## การควบคุมผ่าน Plugin

ตอนนี้เครื่องมือ `browser` ค่าเริ่มต้นเป็น bundled plugin ที่มาพร้อมแบบเปิดใช้งาน
เป็นค่าเริ่มต้น ซึ่งหมายความว่าคุณสามารถปิดหรือแทนที่มันได้โดยไม่ต้องลบส่วนอื่นของ
ระบบ Plugin ของ OpenClaw:

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

ให้ปิด bundled plugin ก่อนติดตั้ง plugin อื่นที่ให้
ชื่อเครื่องมือ `browser` เดียวกัน ประสบการณ์ browser ค่าเริ่มต้นต้องมีทั้ง:

- `plugins.entries.browser.enabled` ไม่ถูกปิดใช้งาน
- `browser.enabled=true`

หากคุณปิดเฉพาะ plugin อย่างเดียว bundled browser CLI (`openclaw browser`),
gateway method (`browser.request`), agent tool และบริการควบคุม browser เริ่มต้นทั้งหมดจะหายไปพร้อมกัน ส่วน `browser.*` config ของคุณจะยังคงอยู่เพื่อให้ replacement plugin นำไปใช้ต่อได้

ตอนนี้ bundled browser plugin เป็นเจ้าของ implementation ของ browser runtime ด้วย
core เหลือเพียง shared Plugin SDK helper และ compatibility re-export สำหรับ
internal import path รุ่นเก่าเท่านั้น ในทางปฏิบัติ การลบหรือแทนที่แพ็กเกจ browser
plugin จะลบชุดฟีเจอร์ browser ออกไป แทนที่จะเหลือ runtime ที่ core เป็นเจ้าของอีกตัวหนึ่งไว้

การเปลี่ยน browser config ยังคงต้องรีสตาร์ต Gateway เพื่อให้ bundled plugin
ลงทะเบียนบริการ browser ของมันใหม่ด้วยค่าตั้งใหม่

## Missing browser command or tool

หาก `openclaw browser` กลายเป็นคำสั่งที่ไม่รู้จักหลังการอัปเกรด หรือ
เอเจนต์รายงานว่า browser tool หายไป สาเหตุที่พบบ่อยที่สุดคือมี
`plugins.allow` list ที่เข้มงวดและไม่ได้รวม `browser` ไว้ด้วย

ตัวอย่าง config ที่พัง:

```json5
{
  plugins: {
    allow: ["telegram"],
  },
}
```

แก้โดยเพิ่ม `browser` เข้าไปใน plugin allowlist:

```json5
{
  plugins: {
    allow: ["telegram", "browser"],
  },
}
```

หมายเหตุสำคัญ:

- `browser.enabled=true` อย่างเดียวไม่เพียงพอเมื่อมีการตั้ง `plugins.allow`
- `plugins.entries.browser.enabled=true` อย่างเดียวก็ไม่เพียงพอเมื่อมีการตั้ง `plugins.allow`
- `tools.alsoAllow: ["browser"]` **ไม่ได้** โหลด bundled browser plugin มันเพียงปรับนโยบายของเครื่องมือหลังจาก plugin ถูกโหลดแล้วเท่านั้น
- หากคุณไม่ต้องการ plugin allowlist แบบเข้มงวด การลบ `plugins.allow` ออกก็จะคืนพฤติกรรม browser แบบ bundled เริ่มต้นได้เช่นกัน

อาการที่พบบ่อย:

- `openclaw browser` กลายเป็นคำสั่งที่ไม่รู้จัก
- `browser.request` หายไป
- เอเจนต์รายงานว่า browser tool ไม่พร้อมใช้งานหรือหายไป

## โปรไฟล์: `openclaw` กับ `user`

- `openclaw`: เบราว์เซอร์ที่จัดการเองและแยกขอบเขต (ไม่ต้องใช้ส่วนขยาย)
- `user`: โปรไฟล์ attach ผ่าน Chrome MCP ที่มีมาในตัวสำหรับ **Chrome จริงที่คุณล็อกอินอยู่**

สำหรับการเรียก browser tool ของเอเจนต์:

- ค่าเริ่มต้น: ใช้เบราว์เซอร์ `openclaw` แบบแยกขอบเขต
- ควรใช้ `profile="user"` เมื่อเซสชันที่ล็อกอินอยู่จริงมีความสำคัญ และผู้ใช้
  อยู่ที่เครื่องเพื่อคลิก/อนุมัติ prompt สำหรับการเชื่อมต่อหากมี
- `profile` คือ explicit override เมื่อคุณต้องการโหมดเบราว์เซอร์เฉพาะ

ตั้ง `browser.defaultProfile: "openclaw"` หากคุณต้องการให้ managed mode เป็นค่าเริ่มต้น

## การกำหนดค่า

การตั้งค่าเบราว์เซอร์อยู่ใน `~/.openclaw/openclaw.json`

```json5
{
  browser: {
    enabled: true, // ค่าเริ่มต้น: true
    ssrfPolicy: {
      // dangerouslyAllowPrivateNetwork: true, // opt in เฉพาะเมื่อเชื่อถือการเข้าถึงเบราว์เซอร์บนเครือข่าย private โดยตั้งใจ
      // allowPrivateNetwork: true, // alias แบบ legacy
      // hostnameAllowlist: ["*.example.com", "example.com"],
      // allowedHostnames: ["localhost"],
    },
    // cdpUrl: "http://127.0.0.1:18792", // override แบบ legacy สำหรับ single-profile
    remoteCdpTimeoutMs: 1500, // HTTP timeout ของ remote CDP (ms)
    remoteCdpHandshakeTimeoutMs: 3000, // WebSocket handshake timeout ของ remote CDP (ms)
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

หมายเหตุ:

- browser control service จะ bind กับ loopback บนพอร์ตที่คำนวณจาก `gateway.port`
  (ค่าเริ่มต้นคือ `18791` ซึ่งคือ gateway + 2)
- หากคุณ override พอร์ต Gateway (`gateway.port` หรือ `OPENCLAW_GATEWAY_PORT`),
  พอร์ต browser ที่คำนวณได้จะเลื่อนไปด้วยเพื่อให้อยู่ใน “ตระกูล” เดียวกัน
- `cdpUrl` จะใช้ local CDP port ที่ถูกจัดการให้อัตโนมัติเป็นค่าเริ่มต้นเมื่อไม่ได้ตั้งค่า
- `remoteCdpTimeoutMs` ใช้กับการตรวจสอบการเข้าถึง CDP แบบ remote (non-loopback)
- `remoteCdpHandshakeTimeoutMs` ใช้กับการตรวจสอบการเข้าถึง CDP WebSocket แบบ remote
- browser navigation/open-tab ถูกป้องกัน SSRF ก่อนนำทาง และจะมีการตรวจซ้ำแบบ best-effort กับ `http(s)` URL สุดท้ายหลังการนำทาง
- ในโหมด SSRF แบบเข้มงวด การค้นหา/probe ปลายทาง remote CDP (`cdpUrl` รวมถึงการ lookup `/json/version`) ก็ถูกตรวจด้วย
- `browser.ssrfPolicy.dangerouslyAllowPrivateNetwork` ถูกปิดไว้เป็นค่าเริ่มต้น ให้ตั้งเป็น `true` เฉพาะเมื่อคุณตั้งใจเชื่อถือการเข้าถึงเบราว์เซอร์ผ่านเครือข่าย private
- `browser.ssrfPolicy.allowPrivateNetwork` ยังคงรองรับในฐานะ alias แบบ legacy เพื่อความเข้ากันได้
- `attachOnly: true` หมายถึง “ห้ามเปิดเบราว์เซอร์ในเครื่อง; ให้ attach เฉพาะเมื่อมันรันอยู่แล้ว”
- `color` + `color` ต่อโปรไฟล์จะย้อม UI ของเบราว์เซอร์เพื่อให้คุณเห็นว่าโปรไฟล์ใดกำลัง active
- โปรไฟล์เริ่มต้นคือ `openclaw` (เบราว์เซอร์ standalone ที่จัดการโดย OpenClaw) ใช้ `defaultProfile: "user"` เพื่อ opt in ไปใช้เบราว์เซอร์ของผู้ใช้ที่ล็อกอินอยู่
- ลำดับการตรวจหาอัตโนมัติ: เบราว์เซอร์เริ่มต้นของระบบหากเป็น Chromium-based; มิฉะนั้น Chrome → Brave → Edge → Chromium → Chrome Canary
- โปรไฟล์ `openclaw` แบบ local จะกำหนด `cdpPort`/`cdpUrl` ให้อัตโนมัติ — ให้ตั้งค่าเหล่านั้นเฉพาะสำหรับ remote CDP
- `driver: "existing-session"` ใช้ Chrome DevTools MCP แทน raw CDP อย่า
  ตั้ง `cdpUrl` สำหรับ driver นี้
- ตั้ง `browser.profiles.<name>.userDataDir` เมื่อ existing-session profile
  ควร attach เข้ากับโปรไฟล์ Chromium ที่ไม่ใช่ค่าเริ่มต้น เช่น Brave หรือ Edge

## ใช้ Brave (หรือเบราว์เซอร์ที่ใช้ Chromium ตัวอื่น)

หากเบราว์เซอร์ **เริ่มต้นของระบบ** ของคุณเป็นแบบ Chromium-based (Chrome/Brave/Edge/อื่น ๆ)
OpenClaw จะใช้มันโดยอัตโนมัติ ตั้ง `browser.executablePath` เพื่อ override
การตรวจหาอัตโนมัติ:

ตัวอย่าง CLI:

```bash
openclaw config set browser.executablePath "/usr/bin/google-chrome"
```

```json5
// macOS
{
  browser: {
    executablePath: "/Applications/Brave Browser.app/Contents/MacOS/Brave Browser"
  }
}

// Windows
{
  browser: {
    executablePath: "C:\\Program Files\\BraveSoftware\\Brave-Browser\\Application\\brave.exe"
  }
}

// Linux
{
  browser: {
    executablePath: "/usr/bin/brave-browser"
  }
}
```

## การควบคุมแบบ local เทียบกับ remote

- **Local control (ค่าเริ่มต้น):** Gateway จะเริ่ม loopback control service และสามารถเปิดเบราว์เซอร์ภายในเครื่องได้
- **Remote control (node host):** รัน node host บนเครื่องที่มีเบราว์เซอร์; Gateway จะพร็อกซี action ของ browser ไปที่นั่น
- **Remote CDP:** ตั้ง `browser.profiles.<name>.cdpUrl` (หรือ `browser.cdpUrl`) เพื่อ
  attach เข้ากับเบราว์เซอร์แบบ Chromium-based ที่อยู่ระยะไกล ในกรณีนี้ OpenClaw จะไม่เปิดเบราว์เซอร์ในเครื่อง

พฤติกรรมการหยุดจะแตกต่างกันตามโหมดของโปรไฟล์:

- โปรไฟล์ local managed: `openclaw browser stop` จะหยุดโปรเซสเบราว์เซอร์ที่
  OpenClaw เป็นผู้เปิด
- โปรไฟล์ attach-only และ remote CDP: `openclaw browser stop` จะปิด control session ที่ active
  และปล่อย Playwright/CDP emulation override (viewport,
  color scheme, locale, timezone, offline mode และสถานะลักษณะใกล้เคียงกัน) แม้ว่า
  OpenClaw จะไม่ได้เป็นผู้เปิดโปรเซสเบราว์เซอร์เลยก็ตาม

URL ของ remote CDP สามารถมี auth ได้:

- query token (เช่น `https://provider.example?token=<token>`)
- HTTP Basic auth (เช่น `https://user:pass@provider.example`)

OpenClaw จะรักษา auth นี้ไว้ทั้งตอนเรียกปลายทาง `/json/*` และตอนเชื่อมต่อ
CDP WebSocket ควรใช้ environment variable หรือ secret manager สำหรับ
token แทนการ commit ลงไฟล์ config

## Node browser proxy (ค่าเริ่มต้นแบบ zero-config)

หากคุณรัน **node host** บนเครื่องที่มีเบราว์เซอร์ OpenClaw สามารถ
กำหนดเส้นทาง browser tool call ไปยัง node นั้นโดยอัตโนมัติโดยไม่ต้องมี browser config เพิ่มเติม
นี่คือเส้นทางค่าเริ่มต้นสำหรับ gateway ระยะไกล

หมายเหตุ:

- node host เปิดเผย local browser control server ผ่าน **proxy command**
- โปรไฟล์จะมาจาก config `browser.profiles` ของ node เอง (เหมือนกับ local)
- `nodeHost.browserProxy.allowProfiles` เป็นตัวเลือก ไม่ต้องตั้งค่าสำหรับพฤติกรรมเดิม/ค่าเริ่มต้น: โปรไฟล์ทั้งหมดที่กำหนดค่าไว้จะยังเข้าถึงได้ผ่าน proxy รวมถึงเส้นทาง create/delete โปรไฟล์
- หากคุณตั้ง `nodeHost.browserProxy.allowProfiles`, OpenClaw จะถือว่ามันเป็นขอบเขต least-privilege: จะกำหนดเป้าหมายได้เฉพาะโปรไฟล์ที่อยู่ใน allowlist และเส้นทาง create/delete โปรไฟล์แบบถาวรจะถูกบล็อกบนพื้นผิว proxy
- ปิดใช้งานได้หากคุณไม่ต้องการมัน:
  - บน node: `nodeHost.browserProxy.enabled=false`
  - บน gateway: `gateway.nodes.browser.mode="off"`

## Browserless (hosted remote CDP)

[Browserless](https://browserless.io) คือบริการ Chromium แบบโฮสต์ที่เปิดเผย
CDP connection URL ผ่าน HTTPS และ WebSocket OpenClaw ใช้ได้ทั้งสองแบบ แต่
สำหรับ remote browser profile ตัวเลือกที่ง่ายที่สุดคือ direct WebSocket URL
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

- แทนที่ `<BROWSERLESS_API_KEY>` ด้วย Browserless token จริงของคุณ
- เลือก region endpoint ให้ตรงกับบัญชี Browserless ของคุณ (ดูเอกสารของพวกเขา)
- หาก Browserless ให้ HTTPS base URL กับคุณ คุณสามารถแปลงมันเป็น
  `wss://` สำหรับ direct CDP connection หรือคง HTTPS URL ไว้แล้วให้ OpenClaw
  ค้นหา `/json/version` ให้ก็ได้

## Direct WebSocket CDP provider

บริการเบราว์เซอร์แบบโฮสต์บางเจ้าเปิดเผย endpoint แบบ **direct WebSocket** แทน
การค้นหา CDP แบบ HTTP มาตรฐาน (`/json/version`) OpenClaw ยอมรับรูปแบบ CDP URL ได้สามแบบ และจะเลือกกลยุทธ์การเชื่อมต่อที่เหมาะสมให้โดยอัตโนมัติ:

- **การค้นหาแบบ HTTP(S)** — `http://host[:port]` หรือ `https://host[:port]`
  OpenClaw จะเรียก `/json/version` เพื่อค้นหา WebSocket debugger URL แล้วจึง
  เชื่อมต่อ ไม่มี WebSocket fallback
- **ปลายทางแบบ Direct WebSocket** — `ws://host[:port]/devtools/<kind>/<id>` หรือ
  `wss://...` พร้อมพาธ `/devtools/browser|page|worker|shared_worker|service_worker/<id>`
  OpenClaw จะเชื่อมต่อโดยตรงผ่าน WebSocket handshake และข้าม
  `/json/version` ไปทั้งหมด
- **ราก WebSocket แบบเปล่า** — `ws://host[:port]` หรือ `wss://host[:port]` โดยไม่มี
  พาธ `/devtools/...` (เช่น [Browserless](https://browserless.io),
  [Browserbase](https://www.browserbase.com)) OpenClaw จะลองทำ HTTP
  `/json/version` discovery ก่อน (normalize scheme เป็น `http`/`https`);
  หาก discovery คืนค่า `webSocketDebuggerUrl` มันจะถูกใช้ มิฉะนั้น OpenClaw
  จะ fallback ไปทำ direct WebSocket handshake ที่รากแบบเปล่า กรณีนี้ครอบคลุม
  ทั้ง remote debug port แบบ Chrome-style และ provider ที่มีแต่ WebSocket เท่านั้น

`ws://host:port` / `wss://host:port` แบบธรรมดาที่ไม่มีพาธ `/devtools/...`
และชี้ไปยัง local Chrome instance ยังคงรองรับผ่าน discovery-first
fallback — Chrome จะยอมรับ WebSocket upgrade เฉพาะบนพาธต่อ browser
หรือต่อ target ที่ `/json/version` ส่งกลับมาเท่านั้น ดังนั้น handshake ที่รากเปล่าอย่างเดียว
จึงจะล้มเหลว

### Browserbase

[Browserbase](https://www.browserbase.com) คือแพลตฟอร์มคลาวด์สำหรับรัน
เบราว์เซอร์แบบ headless พร้อมการแก้ CAPTCHA ในตัว, stealth mode และ residential
proxy

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
  ของคุณจาก [Overview dashboard](https://www.browserbase.com/overview)
- แทนที่ `<BROWSERBASE_API_KEY>` ด้วย Browserbase API key จริงของคุณ
- Browserbase จะสร้าง browser session ให้อัตโนมัติเมื่อเชื่อมต่อ WebSocket ดังนั้นจึง
  ไม่ต้องมีขั้นตอนสร้าง session ด้วยตนเอง
- ฟรีเทียร์อนุญาตหนึ่ง concurrent session และหนึ่ง browser hour ต่อเดือน
  ดู [ราคา](https://www.browserbase.com/pricing) สำหรับข้อจำกัดของแผนแบบชำระเงิน
- ดู [เอกสาร Browserbase](https://docs.browserbase.com) สำหรับ
  API reference แบบเต็ม, คู่มือ SDK และตัวอย่าง integration

## ความปลอดภัย

แนวคิดสำคัญ:

- การควบคุมเบราว์เซอร์เป็นแบบ loopback-only; การเข้าถึงจะไหลผ่าน auth ของ Gateway หรือ node pairing
- standalone loopback browser HTTP API ใช้ **shared-secret auth เท่านั้น**:
  gateway token bearer auth, `x-openclaw-password` หรือ HTTP Basic auth พร้อม
  gateway password ที่กำหนดไว้
- Tailscale Serve identity header และ `gateway.auth.mode: "trusted-proxy"` จะ
  **ไม่** ใช้ยืนยันตัวตนกับ standalone loopback browser API นี้
- หากเปิดใช้ browser control และยังไม่ได้กำหนด shared-secret auth, OpenClaw
  จะสร้าง `gateway.auth.token` ให้อัตโนมัติตอนเริ่มต้นและบันทึกลง config
- OpenClaw จะ **ไม่** สร้าง token นั้นให้อัตโนมัติเมื่อ `gateway.auth.mode` เป็น
  `password`, `none` หรือ `trusted-proxy` อยู่แล้ว
- ให้เก็บ Gateway และ node host ต่าง ๆ ไว้บนเครือข่ายส่วนตัว (Tailscale); หลีกเลี่ยงการเปิดเผยสู่สาธารณะ
- ให้ถือว่า URL/token ของ remote CDP เป็นความลับ; ควรใช้ env var หรือ secrets manager

เคล็ดลับสำหรับ remote CDP:

- ควรใช้ปลายทางแบบเข้ารหัส (HTTPS หรือ WSS) และ token อายุสั้นเมื่อเป็นไปได้
- หลีกเลี่ยงการฝัง token อายุยาวลงในไฟล์ config โดยตรง

## โปรไฟล์ (หลายเบราว์เซอร์)

OpenClaw รองรับโปรไฟล์แบบมีชื่อหลายตัว (routing config) โปรไฟล์สามารถเป็นได้ดังนี้:

- **openclaw-managed**: อินสแตนซ์เบราว์เซอร์แบบ Chromium-based โดยเฉพาะ พร้อม user data directory + CDP port ของตัวเอง
- **remote**: CDP URL แบบ explicit (เบราว์เซอร์ Chromium-based ที่รันอยู่ที่อื่น)
- **existing session**: โปรไฟล์ Chrome ที่มีอยู่ของคุณผ่านการเชื่อมต่ออัตโนมัติของ Chrome DevTools MCP

ค่าเริ่มต้น:

- โปรไฟล์ `openclaw` จะถูกสร้างให้อัตโนมัติหากไม่มี
- โปรไฟล์ `user` มีมาในตัวสำหรับ existing-session attach ผ่าน Chrome MCP
- existing-session profile นอกเหนือจาก `user` ต้อง opt-in; สร้างด้วย `--driver existing-session`
- local CDP port จะถูกจัดสรรจากช่วง **18800–18899** เป็นค่าเริ่มต้น
- การลบโปรไฟล์จะย้าย local data directory ของมันไปไว้ใน Trash

ปลายทางควบคุมทั้งหมดรับ `?profile=<name>`; ส่วน CLI ใช้ `--browser-profile`

## Existing-session ผ่าน Chrome DevTools MCP

OpenClaw ยังสามารถ attach เข้ากับโปรไฟล์ของเบราว์เซอร์แบบ Chromium-based ที่กำลังรันอยู่ผ่าน
Chrome DevTools MCP server อย่างเป็นทางการได้ด้วย เส้นทางนี้จะใช้แท็บและสถานะการล็อกอิน
ที่เปิดอยู่แล้วในโปรไฟล์เบราว์เซอร์นั้นซ้ำ

ข้อมูลอ้างอิงทางการเกี่ยวกับพื้นหลังและการตั้งค่า:

- [Chrome for Developers: Use Chrome DevTools MCP with your browser session](https://developer.chrome.com/blog/chrome-devtools-mcp-debug-your-browser-session)
- [Chrome DevTools MCP README](https://github.com/ChromeDevTools/chrome-devtools-mcp)

โปรไฟล์ที่มีมาในตัว:

- `user`

ทางเลือกเพิ่มเติม: สร้าง existing-session profile แบบกำหนดเองของคุณเอง หากคุณต้องการ
ชื่อ สี หรือไดเรกทอรีข้อมูลเบราว์เซอร์ที่ต่างออกไป

พฤติกรรมเริ่มต้น:

- โปรไฟล์ `user` ที่มีมาในตัวใช้การเชื่อมต่ออัตโนมัติของ Chrome MCP ซึ่งจะชี้ไปที่
  โปรไฟล์ Google Chrome ในเครื่องแบบค่าเริ่มต้น

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
3. ให้เบราว์เซอร์ยังคงทำงานอยู่ และอนุมัติ connection prompt เมื่อ OpenClaw attach

หน้า inspect ที่พบบ่อย:

- Chrome: `chrome://inspect/#remote-debugging`
- Brave: `brave://inspect/#remote-debugging`
- Edge: `edge://inspect/#remote-debugging`

live attach smoke test:

```bash
openclaw browser --browser-profile user start
openclaw browser --browser-profile user status
openclaw browser --browser-profile user tabs
openclaw browser --browser-profile user snapshot --format ai
```

สิ่งที่ถือว่าสำเร็จ:

- `status` แสดง `driver: existing-session`
- `status` แสดง `transport: chrome-mcp`
- `status` แสดง `running: true`
- `tabs` แสดงแท็บเบราว์เซอร์ที่คุณเปิดอยู่แล้ว
- `snapshot` คืนค่า ref จาก live tab ที่เลือกอยู่

สิ่งที่ควรตรวจหาก attach ใช้งานไม่ได้:

- เบราว์เซอร์แบบ Chromium-based เป้าหมายเป็นเวอร์ชัน `144+`
- เปิดใช้ remote debugging แล้วในหน้า inspect ของเบราว์เซอร์นั้น
- เบราว์เซอร์แสดง prompt การ attach และคุณยอมรับแล้ว
- `openclaw doctor` จะย้าย browser config แบบเก่าที่อิง extension และตรวจว่า
  มี Chrome ติดตั้งอยู่ในเครื่องสำหรับโปรไฟล์ auto-connect เริ่มต้น แต่ไม่สามารถ
  เปิดใช้ remote debugging ฝั่งเบราว์เซอร์ให้คุณได้

การใช้งานโดยเอเจนต์:

- ใช้ `profile="user"` เมื่อคุณต้องการสถานะเบราว์เซอร์ที่ผู้ใช้ล็อกอินอยู่
- หากคุณใช้ existing-session profile แบบกำหนดเอง ให้ส่งชื่อโปรไฟล์นั้นอย่างชัดเจน
- เลือกโหมดนี้เฉพาะเมื่อผู้ใช้อยู่ที่เครื่องเพื่ออนุมัติ attach
  prompt
- Gateway หรือ node host สามารถสปิน `npx chrome-devtools-mcp@latest --autoConnect`

หมายเหตุ:

- เส้นทางนี้มีความเสี่ยงสูงกว่าโปรไฟล์ `openclaw` แบบแยกขอบเขต เพราะมันสามารถ
  กระทำการภายในเซสชันเบราว์เซอร์ที่คุณล็อกอินอยู่ได้
- OpenClaw จะไม่เปิดเบราว์เซอร์สำหรับ driver นี้; มัน attach เข้ากับ
  existing session เท่านั้น
- OpenClaw ใช้โฟลว์ `--autoConnect` ของ Chrome DevTools MCP อย่างเป็นทางการที่นี่ หาก
  มีการตั้ง `userDataDir`, OpenClaw จะส่งมันผ่านไปเพื่อกำหนดเป้าหมาย
  Chromium user data directory นั้นโดยเฉพาะ
- screenshot ของ existing-session รองรับการจับทั้งหน้าและการจับองค์ประกอบด้วย `--ref`
  จาก snapshot แต่ไม่รองรับ CSS selector แบบ `--element`
- screenshot ของหน้าใน existing-session ทำงานได้โดยไม่ต้องใช้ Playwright ผ่าน Chrome MCP
  screenshot ขององค์ประกอบแบบอิง ref (`--ref`) ก็ทำงานได้เช่นกัน แต่ `--full-page`
  ใช้ร่วมกับ `--ref` หรือ `--element` ไม่ได้
- action ของ existing-session ยังมีข้อจำกัดมากกว่าเส้นทาง managed browser:
  - `click`, `type`, `hover`, `scrollIntoView`, `drag` และ `select` ต้องใช้
    snapshot ref แทน CSS selector
  - `click` รองรับเฉพาะปุ่มซ้าย (ไม่รองรับ button override หรือ modifier)
  - `type` ไม่รองรับ `slowly=true`; ให้ใช้ `fill` หรือ `press`
  - `press` ไม่รองรับ `delayMs`
  - `hover`, `scrollIntoView`, `drag`, `select`, `fill` และ `evaluate` ไม่รองรับ
    timeout override ต่อการเรียก
  - ปัจจุบัน `select` รองรับเพียงค่าเดียว
- `wait --url` ของ existing-session รองรับรูปแบบ exact, substring และ glob
  เหมือนไดรเวอร์ browser อื่น ๆ ส่วน `wait --load networkidle` ยังไม่รองรับ
- hook สำหรับ upload ของ existing-session ต้องใช้ `ref` หรือ `inputRef`, รองรับครั้งละหนึ่งไฟล์ และไม่รองรับการระบุเป้าหมายด้วย CSS `element`
- hook สำหรับ dialog ของ existing-session ไม่รองรับ timeout override
- ฟีเจอร์บางอย่างยังคงต้องใช้เส้นทาง managed browser ได้แก่ batch
  action, การส่งออก PDF, download interception และ `responsebody`
- existing-session สามารถ attach บนโฮสต์ที่เลือก หรือผ่าน browser node ที่เชื่อมต่ออยู่ก็ได้ หาก Chrome อยู่ที่อื่นและไม่มี browser node เชื่อมต่ออยู่ ให้ใช้
  remote CDP หรือ node host แทน

## การรับประกันการแยกขอบเขต

- **Dedicated user data dir**: จะไม่แตะต้องโปรไฟล์เบราว์เซอร์ส่วนตัวของคุณ
- **Dedicated port**: หลีกเลี่ยง `9222` เพื่อไม่ให้ชนกับเวิร์กโฟลว์ dev
- **Deterministic tab control**: กำหนดเป้าหมายแท็บด้วย `targetId` ไม่ใช่ “แท็บล่าสุด”

## การเลือกเบราว์เซอร์

เมื่อเปิดในเครื่อง OpenClaw จะเลือกตัวแรกที่พร้อมใช้งาน:

1. Chrome
2. Brave
3. Edge
4. Chromium
5. Chrome Canary

คุณสามารถ override ได้ด้วย `browser.executablePath`

แพลตฟอร์ม:

- macOS: ตรวจสอบ `/Applications` และ `~/Applications`
- Linux: มองหา `google-chrome`, `brave`, `microsoft-edge`, `chromium` ฯลฯ
- Windows: ตรวจตำแหน่งติดตั้งทั่วไป

## Control API (ไม่บังคับ)

สำหรับ integration ภายในเครื่องเท่านั้น Gateway จะเปิดเผย loopback HTTP API ขนาดเล็ก:

- Status/start/stop: `GET /`, `POST /start`, `POST /stop`
- Tabs: `GET /tabs`, `POST /tabs/open`, `POST /tabs/focus`, `DELETE /tabs/:targetId`
- Snapshot/screenshot: `GET /snapshot`, `POST /screenshot`
- Actions: `POST /navigate`, `POST /act`
- Hooks: `POST /hooks/file-chooser`, `POST /hooks/dialog`
- Downloads: `POST /download`, `POST /wait/download`
- Debugging: `GET /console`, `POST /pdf`
- Debugging: `GET /errors`, `GET /requests`, `POST /trace/start`, `POST /trace/stop`, `POST /highlight`
- Network: `POST /response/body`
- State: `GET /cookies`, `POST /cookies/set`, `POST /cookies/clear`
- State: `GET /storage/:kind`, `POST /storage/:kind/set`, `POST /storage/:kind/clear`
- Settings: `POST /set/offline`, `POST /set/headers`, `POST /set/credentials`, `POST /set/geolocation`, `POST /set/media`, `POST /set/timezone`, `POST /set/locale`, `POST /set/device`

ทุกปลายทางรองรับ `?profile=<name>`

หากกำหนด shared-secret gateway auth ไว้ browser HTTP route ก็ต้องใช้ auth ด้วย:

- `Authorization: Bearer <gateway token>`
- `x-openclaw-password: <gateway password>` หรือ HTTP Basic auth พร้อมรหัสผ่านนั้น

หมายเหตุ:

- standalone loopback browser API นี้ **ไม่** ใช้ trusted-proxy หรือ
  Tailscale Serve identity header
- หาก `gateway.auth.mode` เป็น `none` หรือ `trusted-proxy`, route ของ browser บน loopback เหล่านี้
  จะไม่สืบทอดโหมดที่มีการระบุตัวตนนั้น; ให้คงมันไว้แบบ loopback-only

### สัญญาข้อผิดพลาดของ `/act`

`POST /act` ใช้การตอบกลับข้อผิดพลาดแบบมีโครงสร้างสำหรับการตรวจสอบระดับ route และ
ความล้มเหลวจากนโยบาย:

```json
{ "error": "<message>", "code": "ACT_*" }
```

ค่า `code` ปัจจุบัน:

- `ACT_KIND_REQUIRED` (HTTP 400): ไม่มี `kind` หรือไม่รู้จัก
- `ACT_INVALID_REQUEST` (HTTP 400): payload ของ action ไม่ผ่าน normalization หรือ validation
- `ACT_SELECTOR_UNSUPPORTED` (HTTP 400): ใช้ `selector` กับชนิด action ที่ไม่รองรับ
- `ACT_EVALUATE_DISABLED` (HTTP 403): `evaluate` (หรือ `wait --fn`) ถูกปิดด้วย config
- `ACT_TARGET_ID_MISMATCH` (HTTP 403): `targetId` ระดับบนสุดหรือใน batch ขัดแย้งกับเป้าหมายของคำขอ
- `ACT_EXISTING_SESSION_UNSUPPORTED` (HTTP 501): action นี้ไม่รองรับสำหรับโปรไฟล์ existing-session

ความล้มเหลวขณะรันไทม์อื่น ๆ อาจยังคงส่งกลับเป็น `{ "error": "<message>" }` โดยไม่มีฟิลด์ `code`

### ข้อกำหนดของ Playwright

ฟีเจอร์บางอย่าง (navigate/act/AI snapshot/role snapshot, ภาพหน้าจอขององค์ประกอบ, PDF) ต้องใช้ Playwright หากไม่ได้ติดตั้ง Playwright เอ็นด์พอยต์เหล่านั้นจะส่งกลับข้อผิดพลาด 501 ที่ชัดเจน

สิ่งที่ยังใช้งานได้โดยไม่ต้องมี Playwright:

- ARIA snapshots
- ภาพหน้าจอของหน้าสำหรับเบราว์เซอร์ `openclaw` ที่ถูกจัดการ เมื่อมี WebSocket CDP ต่อแท็บพร้อมใช้งาน
- ภาพหน้าจอของหน้าสำหรับโปรไฟล์ `existing-session` / Chrome MCP
- ภาพหน้าจอแบบอ้างอิง `--ref` ของ `existing-session` จากเอาต์พุต snapshot

สิ่งที่ยังต้องใช้ Playwright:

- `navigate`
- `act`
- AI snapshots / role snapshots
- ภาพหน้าจอขององค์ประกอบด้วย CSS selector (`--element`)
- การส่งออก PDF ของเบราว์เซอร์แบบเต็ม

ภาพหน้าจอขององค์ประกอบยังปฏิเสธ `--full-page` ด้วย โดยเส้นทางจะส่งกลับ `fullPage is not supported for element screenshots`

หากคุณเห็น `Playwright is not available in this gateway build` ให้ซ่อมแซม runtime dependencies ของ plugin เบราว์เซอร์ที่มาพร้อมกันเพื่อให้ติดตั้ง `playwright-core` แล้ว จากนั้นรีสตาร์ต Gateway สำหรับการติดตั้งแบบแพ็กเกจ ให้รัน `openclaw doctor --fix` สำหรับ Docker ให้ติดตั้ง Chromium browser binaries เพิ่มเติมตามที่แสดงด้านล่าง

#### การติดตั้ง Playwright ใน Docker

หาก Gateway ของคุณรันอยู่ใน Docker ให้หลีกเลี่ยง `npx playwright` (มีปัญหาความขัดแย้งของ npm override)
ให้ใช้ CLI ที่มาพร้อมกันแทน:

```bash
docker compose run --rm openclaw-cli \
  node /app/node_modules/playwright-core/cli.js install chromium
```

เพื่อให้การดาวน์โหลดเบราว์เซอร์คงอยู่ ให้ตั้งค่า `PLAYWRIGHT_BROWSERS_PATH` (ตัวอย่างเช่น
`/home/node/.cache/ms-playwright`) และตรวจสอบให้แน่ใจว่า `/home/node` ถูกเก็บถาวรผ่าน
`OPENCLAW_HOME_VOLUME` หรือ bind mount ดู [Docker](/th/install/docker)

## วิธีการทำงาน (ภายใน)

ลำดับการทำงานระดับสูง:

- **control server** ขนาดเล็กรับคำขอ HTTP
- มันเชื่อมต่อกับเบราว์เซอร์ที่ใช้ Chromium (Chrome/Brave/Edge/Chromium) ผ่าน **CDP**
- สำหรับการกระทำขั้นสูง (click/type/snapshot/PDF) มันใช้ **Playwright** บนชั้นของ CDP
- เมื่อไม่มี Playwright จะมีเพียงการดำเนินการที่ไม่ใช้ Playwright เท่านั้นที่พร้อมใช้งาน

การออกแบบนี้ช่วยให้เอเจนต์อยู่บนอินเทอร์เฟซที่เสถียรและกำหนดผลได้แน่นอน ขณะเดียวกันก็ให้คุณสลับระหว่างเบราว์เซอร์และโปรไฟล์แบบ local/remote ได้

## ข้อมูลอ้างอิงแบบย่อของ CLI

ทุกคำสั่งรองรับ `--browser-profile <name>` เพื่อกำหนดเป้าหมายโปรไฟล์เฉพาะ
ทุกคำสั่งยังรองรับ `--json` สำหรับเอาต์พุตที่เครื่องอ่านได้ (payloads ที่เสถียร)

พื้นฐาน:

- `openclaw browser status`
- `openclaw browser start`
- `openclaw browser stop`
- `openclaw browser tabs`
- `openclaw browser tab`
- `openclaw browser tab new`
- `openclaw browser tab select 2`
- `openclaw browser tab close 2`
- `openclaw browser open https://example.com`
- `openclaw browser focus abcd1234`
- `openclaw browser close abcd1234`

การตรวจสอบ:

- `openclaw browser screenshot`
- `openclaw browser screenshot --full-page`
- `openclaw browser screenshot --ref 12`
- `openclaw browser screenshot --ref e12`
- `openclaw browser snapshot`
- `openclaw browser snapshot --format aria --limit 200`
- `openclaw browser snapshot --interactive --compact --depth 6`
- `openclaw browser snapshot --efficient`
- `openclaw browser snapshot --labels`
- `openclaw browser snapshot --selector "#main" --interactive`
- `openclaw browser snapshot --frame "iframe#main" --interactive`
- `openclaw browser console --level error`

หมายเหตุเกี่ยวกับวงจรชีวิต:

- สำหรับโปรไฟล์แบบ attach-only และ remote CDP คำสั่ง `openclaw browser stop` ยังคงเป็น
  คำสั่ง cleanup ที่ถูกต้องหลังการทดสอบ โดยมันจะปิดเซสชันควบคุมที่ใช้งานอยู่และ
  ล้าง temporary emulation overrides แทนการ kill
  เบราว์เซอร์ต้นทาง
- `openclaw browser errors --clear`
- `openclaw browser requests --filter api --clear`
- `openclaw browser pdf`
- `openclaw browser responsebody "**/api" --max-chars 5000`

การกระทำ:

- `openclaw browser navigate https://example.com`
- `openclaw browser resize 1280 720`
- `openclaw browser click 12 --double`
- `openclaw browser click e12 --double`
- `openclaw browser type 23 "hello" --submit`
- `openclaw browser press Enter`
- `openclaw browser hover 44`
- `openclaw browser scrollintoview e12`
- `openclaw browser drag 10 11`
- `openclaw browser select 9 OptionA OptionB`
- `openclaw browser download e12 report.pdf`
- `openclaw browser waitfordownload report.pdf`
- `openclaw browser upload /tmp/openclaw/uploads/file.pdf`
- `openclaw browser fill --fields '[{"ref":"1","type":"text","value":"Ada"}]'`
- `openclaw browser dialog --accept`
- `openclaw browser wait --text "Done"`
- `openclaw browser wait "#main" --url "**/dash" --load networkidle --fn "window.ready===true"`
- `openclaw browser evaluate --fn '(el) => el.textContent' --ref 7`
- `openclaw browser highlight e12`
- `openclaw browser trace start`
- `openclaw browser trace stop`

สถานะ:

- `openclaw browser cookies`
- `openclaw browser cookies set session abc123 --url "https://example.com"`
- `openclaw browser cookies clear`
- `openclaw browser storage local get`
- `openclaw browser storage local set theme dark`
- `openclaw browser storage session clear`
- `openclaw browser set offline on`
- `openclaw browser set headers --headers-json '{"X-Debug":"1"}'`
- `openclaw browser set credentials user pass`
- `openclaw browser set credentials --clear`
- `openclaw browser set geo 37.7749 -122.4194 --origin "https://example.com"`
- `openclaw browser set geo --clear`
- `openclaw browser set media dark`
- `openclaw browser set timezone America/New_York`
- `openclaw browser set locale en-US`
- `openclaw browser set device "iPhone 14"`

หมายเหตุ:

- `upload` และ `dialog` เป็นการเรียกแบบ **arming**; ให้รันก่อนการ click/press
  ที่ทริกเกอร์ chooser/dialog
- เส้นทางเอาต์พุตของ download และ trace ถูกจำกัดให้อยู่ภายใต้ temp roots ของ OpenClaw:
  - traces: `/tmp/openclaw` (fallback: `${os.tmpdir()}/openclaw`)
  - downloads: `/tmp/openclaw/downloads` (fallback: `${os.tmpdir()}/openclaw/downloads`)
- เส้นทาง upload ถูกจำกัดให้อยู่ภายใต้ temp uploads root ของ OpenClaw:
  - uploads: `/tmp/openclaw/uploads` (fallback: `${os.tmpdir()}/openclaw/uploads`)
- `upload` ยังสามารถตั้งค่า file inputs โดยตรงผ่าน `--input-ref` หรือ `--element`
- `snapshot`:
  - `--format ai` (ค่าเริ่มต้นเมื่อมีการติดตั้ง Playwright): ส่งกลับ AI snapshot ที่มี numeric refs (`aria-ref="<n>"`)
  - `--format aria`: ส่งกลับ accessibility tree (ไม่มี refs; ใช้สำหรับการตรวจสอบเท่านั้น)
  - `--efficient` (หรือ `--mode efficient`): preset ของ role snapshot แบบกะทัดรัด (interactive + compact + depth + maxChars ที่ต่ำกว่า)
  - ค่าเริ่มต้นของ config (เฉพาะ tool/CLI): ตั้งค่า `browser.snapshotDefaults.mode: "efficient"` เพื่อใช้ efficient snapshots เมื่อผู้เรียกไม่ได้ส่งโหมดมา (ดู [การกำหนดค่า Gateway](/th/gateway/configuration-reference#browser))
  - ตัวเลือกของ role snapshot (`--interactive`, `--compact`, `--depth`, `--selector`) จะบังคับให้ใช้ role-based snapshot พร้อม refs เช่น `ref=e12`
  - `--frame "<iframe selector>"` ใช้จำกัดขอบเขต role snapshots ไปยัง iframe (จับคู่กับ role refs เช่น `e12`)
  - `--interactive` จะแสดงรายการแบบแบนที่เลือกใช้งานได้ง่ายขององค์ประกอบที่โต้ตอบได้ (ดีที่สุดสำหรับการขับเคลื่อนการกระทำ)
  - `--labels` จะเพิ่มภาพหน้าจอเฉพาะ viewport พร้อมป้ายกำกับ ref ที่ซ้อนทับอยู่ (พิมพ์ `MEDIA:<path>`)
- `click`/`type`/ฯลฯ ต้องใช้ `ref` จาก `snapshot` (จะเป็นตัวเลข `12` หรือ role ref `e12` ก็ได้)
  โดยตั้งใจไม่รองรับ CSS selectors สำหรับการกระทำ

## Snapshots และ refs

OpenClaw รองรับ “snapshot” อยู่สองรูปแบบ:

- **AI snapshot (numeric refs)**: `openclaw browser snapshot` (ค่าเริ่มต้น; `--format ai`)
  - เอาต์พุต: text snapshot ที่มี numeric refs อยู่ด้วย
  - การกระทำ: `openclaw browser click 12`, `openclaw browser type 23 "hello"`
  - ภายใน ระบบจะแก้ ref ผ่าน `aria-ref` ของ Playwright

- **Role snapshot (role refs เช่น `e12`)**: `openclaw browser snapshot --interactive` (หรือ `--compact`, `--depth`, `--selector`, `--frame`)
  - เอาต์พุต: รายการ/โครงสร้างแบบ role-based ที่มี `[ref=e12]` (และอาจมี `[nth=1]`)
  - การกระทำ: `openclaw browser click e12`, `openclaw browser highlight e12`
  - ภายใน ระบบจะแก้ ref ผ่าน `getByRole(...)` (บวก `nth()` สำหรับรายการซ้ำ)
  - เพิ่ม `--labels` เพื่อรวมภาพหน้าจอ viewport พร้อมป้ายกำกับ `e12` ที่ซ้อนทับอยู่

พฤติกรรมของ ref:

- Refs **ไม่คงที่ข้ามการนำทาง**; หากมีบางอย่างล้มเหลว ให้รัน `snapshot` ใหม่แล้วใช้ ref ใหม่
- หาก role snapshot ถูกถ่ายด้วย `--frame` role refs จะถูกจำกัดขอบเขตไว้ใน iframe นั้นจนกว่าจะมี role snapshot ครั้งถัดไป

## ความสามารถเพิ่มเติมของ wait

คุณสามารถรอได้มากกว่าแค่เวลา/ข้อความ:

- รอ URL (รองรับ glob โดย Playwright):
  - `openclaw browser wait --url "**/dash"`
- รอสถานะการโหลด:
  - `openclaw browser wait --load networkidle`
- รอ JS predicate:
  - `openclaw browser wait --fn "window.ready===true"`
- รอ selector ให้แสดงผล:
  - `openclaw browser wait "#main"`

สามารถใช้ร่วมกันได้:

```bash
openclaw browser wait "#main" \
  --url "**/dash" \
  --load networkidle \
  --fn "window.ready===true" \
  --timeout-ms 15000
```

## เวิร์กโฟลว์การดีบัก

เมื่อการกระทำล้มเหลว (เช่น “not visible”, “strict mode violation”, “covered”):

1. `openclaw browser snapshot --interactive`
2. ใช้ `click <ref>` / `type <ref>` (ควรใช้ role refs ในโหมด interactive)
3. หากยังล้มเหลว: `openclaw browser highlight <ref>` เพื่อดูว่า Playwright กำลังกำหนดเป้าหมายอะไร
4. หากหน้าทำงานผิดปกติ:
   - `openclaw browser errors --clear`
   - `openclaw browser requests --filter api --clear`
5. สำหรับการดีบักเชิงลึก: บันทึก trace:
   - `openclaw browser trace start`
   - ทำซ้ำปัญหา
   - `openclaw browser trace stop` (พิมพ์ `TRACE:<path>`)

## เอาต์พุต JSON

`--json` มีไว้สำหรับการเขียนสคริปต์และเครื่องมือแบบมีโครงสร้าง

ตัวอย่าง:

```bash
openclaw browser status --json
openclaw browser snapshot --interactive --json
openclaw browser requests --filter api --json
openclaw browser cookies --json
```

Role snapshots ใน JSON จะมี `refs` พร้อมกับบล็อก `stats` ขนาดเล็ก (lines/chars/refs/interactive) เพื่อให้เครื่องมือประเมินขนาดและความหนาแน่นของ payload ได้

## ตัวควบคุมสถานะและสภาพแวดล้อม

สิ่งเหล่านี้มีประโยชน์สำหรับเวิร์กโฟลว์แบบ “ทำให้ไซต์มีพฤติกรรมเหมือน X”:

- Cookies: `cookies`, `cookies set`, `cookies clear`
- Storage: `storage local|session get|set|clear`
- Offline: `set offline on|off`
- Headers: `set headers --headers-json '{"X-Debug":"1"}'` (legacy `set headers --json '{"X-Debug":"1"}'` ยังรองรับอยู่)
- HTTP basic auth: `set credentials user pass` (หรือ `--clear`)
- Geolocation: `set geo <lat> <lon> --origin "https://example.com"` (หรือ `--clear`)
- Media: `set media dark|light|no-preference|none`
- Timezone / locale: `set timezone ...`, `set locale ...`
- Device / viewport:
  - `set device "iPhone 14"` (device presets ของ Playwright)
  - `set viewport 1280 720`

## ความปลอดภัยและความเป็นส่วนตัว

- โปรไฟล์เบราว์เซอร์ openclaw อาจมีเซสชันที่ล็อกอินอยู่ ให้ถือว่าเป็นข้อมูลอ่อนไหว
- `browser act kind=evaluate` / `openclaw browser evaluate` และ `wait --fn`
  จะรัน JavaScript ใด ๆ ก็ได้ใน page context Prompt injection อาจชี้นำ
  สิ่งนี้ได้ ปิดใช้งานได้ด้วย `browser.evaluateEnabled=false` หากคุณไม่จำเป็นต้องใช้
- สำหรับบันทึกเกี่ยวกับการล็อกอินและ anti-bot (X/Twitter ฯลฯ) ดู [การล็อกอินเบราว์เซอร์ + การโพสต์ X/Twitter](/th/tools/browser-login)
- ทำให้โฮสต์ Gateway/node เป็นแบบส่วนตัวเสมอ (loopback หรือ tailnet-only)
- เอ็นด์พอยต์ CDP ระยะไกลมีอำนาจสูง ควรทำ tunnel และป้องกันให้ดี

ตัวอย่าง strict-mode (บล็อกปลายทาง private/internal โดยค่าเริ่มต้น):

```json5
{
  browser: {
    ssrfPolicy: {
      dangerouslyAllowPrivateNetwork: false,
      hostnameAllowlist: ["*.example.com", "example.com"],
      allowedHostnames: ["localhost"], // อนุญาตแบบตรงตัวเพิ่มเติมได้
    },
  },
}
```

## การแก้ปัญหา

สำหรับปัญหาเฉพาะบน Linux (โดยเฉพาะ snap Chromium) ดู
[การแก้ปัญหาเบราว์เซอร์](/th/tools/browser-linux-troubleshooting)

สำหรับการตั้งค่าแบบแยกโฮสต์ WSL2 Gateway + Windows Chrome ดู
[การแก้ปัญหา WSL2 + Windows + remote Chrome CDP](/th/tools/browser-wsl2-windows-remote-cdp-troubleshooting)

### การเริ่มต้น CDP ล้มเหลว เทียบกับการบล็อก SSRF ระหว่างการนำทาง

นี่คือความล้มเหลวคนละประเภทกัน และชี้ไปยัง code paths คนละส่วน

- **การเริ่มต้น CDP หรือความล้มเหลวด้านความพร้อมใช้งาน** หมายความว่า OpenClaw ไม่สามารถยืนยันได้ว่า control plane ของเบราว์เซอร์อยู่ในสภาพพร้อมใช้งาน
- **การบล็อก SSRF ระหว่างการนำทาง** หมายความว่า control plane ของเบราว์เซอร์ทำงานปกติ แต่เป้าหมายการนำทางของหน้าถูกปฏิเสธโดยนโยบาย

ตัวอย่างที่พบบ่อย:

- การเริ่มต้น CDP หรือความล้มเหลวด้านความพร้อมใช้งาน:
  - `Chrome CDP websocket for profile "openclaw" is not reachable after start`
  - `Remote CDP for profile "<name>" is not reachable at <cdpUrl>`
- การบล็อก SSRF ระหว่างการนำทาง:
  - โฟลว์ `open`, `navigate`, snapshot หรือการเปิดแท็บ ล้มเหลวด้วยข้อผิดพลาดด้านนโยบายของเบราว์เซอร์/เครือข่าย ในขณะที่ `start` และ `tabs` ยังใช้งานได้

ใช้ลำดับขั้นต่ำนี้เพื่อแยกความแตกต่างระหว่างสองกรณี:

```bash
openclaw browser --browser-profile openclaw start
openclaw browser --browser-profile openclaw tabs
openclaw browser --browser-profile openclaw open https://example.com
```

วิธีอ่านผลลัพธ์:

- หาก `start` ล้มเหลวด้วย `not reachable after start` ให้แก้ปัญหาความพร้อมใช้งานของ CDP ก่อน
- หาก `start` สำเร็จแต่ `tabs` ล้มเหลว control plane ยังไม่พร้อมใช้งาน ให้ถือว่านี่เป็นปัญหาการเข้าถึง CDP ไม่ใช่ปัญหาการนำทางของหน้า
- หาก `start` และ `tabs` สำเร็จ แต่ `open` หรือ `navigate` ล้มเหลว แปลว่า control plane ของเบราว์เซอร์พร้อมใช้งานแล้ว และความล้มเหลวอยู่ที่นโยบายการนำทางหรือหน้าปลายทาง
- หาก `start`, `tabs` และ `open` สำเร็จทั้งหมด แปลว่าเส้นทางควบคุมเบราว์เซอร์ที่ถูกจัดการพื้นฐานทำงานปกติ

รายละเอียดพฤติกรรมที่สำคัญ:

- การกำหนดค่าเบราว์เซอร์จะตั้งค่าเริ่มต้นเป็นอ็อบเจ็กต์นโยบาย SSRF แบบ fail-closed แม้ว่าคุณจะไม่ได้กำหนด `browser.ssrfPolicy`
- สำหรับโปรไฟล์ `openclaw` ที่ถูกจัดการใน local loopback การตรวจสอบสุขภาพของ CDP จะข้ามการบังคับใช้นโยบายการเข้าถึง SSRF ของเบราว์เซอร์โดยเจตนาสำหรับ local control plane ของ OpenClaw เอง
- การป้องกันการนำทางเป็นคนละส่วนกัน ผลลัพธ์ `start` หรือ `tabs` ที่สำเร็จไม่ได้หมายความว่าเป้าหมายของ `open` หรือ `navigate` ในภายหลังจะได้รับอนุญาต

คำแนะนำด้านความปลอดภัย:

- **อย่า** ผ่อนคลายนโยบาย SSRF ของเบราว์เซอร์โดยค่าเริ่มต้น
- ควรใช้ข้อยกเว้นโฮสต์แบบจำกัด เช่น `hostnameAllowlist` หรือ `allowedHostnames` แทนการอนุญาตให้เข้าถึงเครือข่ายส่วนตัวแบบกว้าง
- ใช้ `dangerouslyAllowPrivateNetwork: true` เฉพาะในสภาพแวดล้อมที่เชื่อถือได้โดยเจตนา ซึ่งจำเป็นต้องให้เบราว์เซอร์เข้าถึงเครือข่ายส่วนตัว และได้ผ่านการทบทวนแล้ว

ตัวอย่าง: การนำทางถูกบล็อก แต่ control plane ปกติ

- `start` สำเร็จ
- `tabs` สำเร็จ
- `open http://internal.example` ล้มเหลว

โดยทั่วไปหมายความว่าการเริ่มต้นเบราว์เซอร์ปกติดี และเป้าหมายการนำทางต้องได้รับการทบทวนนโยบาย

ตัวอย่าง: การเริ่มต้นถูกบล็อกก่อนที่การนำทางจะมีความสำคัญ

- `start` ล้มเหลวด้วย `not reachable after start`
- `tabs` ก็ล้มเหลวหรือรันไม่ได้เช่นกัน

นี่ชี้ไปที่การเปิดเบราว์เซอร์หรือการเข้าถึง CDP ไม่ใช่ปัญหา allowlist ของ URL หน้าเว็บ

## Agent tools + วิธีการทำงานของการควบคุม

เอเจนต์ได้รับ **หนึ่งเครื่องมือ** สำหรับการทำงานอัตโนมัติของเบราว์เซอร์:

- `browser` — status/start/stop/tabs/open/focus/close/snapshot/screenshot/navigate/act

การแมปทำงานดังนี้:

- `browser snapshot` ส่งกลับ UI tree ที่เสถียร (AI หรือ ARIA)
- `browser act` ใช้ `ref` IDs จาก snapshot เพื่อ click/type/drag/select
- `browser screenshot` จับภาพพิกเซล (ทั้งหน้า หรือเฉพาะองค์ประกอบ)
- `browser` รองรับ:
  - `profile` เพื่อเลือกโปรไฟล์เบราว์เซอร์แบบมีชื่อ (openclaw, chrome หรือ remote CDP)
  - `target` (`sandbox` | `host` | `node`) เพื่อเลือกตำแหน่งที่เบราว์เซอร์ทำงานอยู่
  - ในเซสชันแบบ sandbox หากใช้ `target: "host"` ต้องตั้งค่า `agents.defaults.sandbox.browser.allowHostControl=true`
  - หากไม่ระบุ `target`: เซสชันแบบ sandbox จะใช้ค่าเริ่มต้นเป็น `sandbox` ส่วนเซสชันที่ไม่ใช่ sandbox จะใช้ค่าเริ่มต้นเป็น `host`
  - หากมี Node ที่รองรับเบราว์เซอร์เชื่อมต่ออยู่ เครื่องมืออาจกำหนดเส้นทางไปยัง Node นั้นอัตโนมัติ เว้นแต่คุณจะปักหมุด `target="host"` หรือ `target="node"`

สิ่งนี้ช่วยให้เอเจนต์ทำงานอย่างกำหนดผลได้แน่นอน และหลีกเลี่ยง selector ที่เปราะบาง

## ที่เกี่ยวข้อง

- [ภาพรวมของ Tools](/th/tools) — เครื่องมือทั้งหมดของเอเจนต์ที่พร้อมใช้งาน
- [Sandboxing](/th/gateway/sandboxing) — การควบคุมเบราว์เซอร์ในสภาพแวดล้อมแบบ sandbox
- [Security](/th/gateway/security) — ความเสี่ยงและการทำ hardening สำหรับการควบคุมเบราว์เซอร์
