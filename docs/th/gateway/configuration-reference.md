---
read_when:
    - คุณต้องการความหมายหรือค่าเริ่มต้นของคอนฟิกระดับฟิลด์แบบตรงตัว exact
    - คุณกำลังตรวจสอบบล็อกคอนฟิกของช่องทาง โมเดล gateway หรือเครื่องมือ
summary: ข้อมูลอ้างอิงคอนฟิก Gateway สำหรับคีย์หลัก ค่าเริ่มต้น และลิงก์ไปยังข้อมูลอ้างอิงเฉพาะของแต่ละระบบย่อยของ OpenClaw
title: ข้อมูลอ้างอิงการกำหนดค่า
x-i18n:
    generated_at: "2026-04-24T09:09:17Z"
    model: gpt-5.4
    provider: openai
    source_hash: dc0d9feea2f2707f267d50ec83aa664ef503db8f9132762345cc80305f8bef73
    source_path: gateway/configuration-reference.md
    workflow: 15
---

ข้อมูลอ้างอิงคอนฟิกหลักสำหรับ `~/.openclaw/openclaw.json` สำหรับภาพรวมที่อิงตามงาน โปรดดู [Configuration](/th/gateway/configuration)

หน้านี้ครอบคลุมพื้นผิวคอนฟิกหลักของ OpenClaw และลิงก์ออกไปเมื่อระบบย่อยมีข้อมูลอ้างอิงเชิงลึกของตัวเองแยกต่างหาก โดย **ไม่ได้** พยายามรวมแค็ตตาล็อกคำสั่งทั้งหมดที่เป็นของช่องทาง/Plugin หรือรวมตัวเลือกเชิงลึกทั้งหมดของ memory/QMD ไว้ในหน้าเดียว

แหล่งข้อมูลจริงจากโค้ด:

- `openclaw config schema` จะแสดง JSON Schema แบบ live ที่ใช้สำหรับ validation และ Control UI พร้อมรวม metadata ของ bundled/plugin/channel เมื่อมี
- `config.schema.lookup` จะคืน schema node ของพาธเดียวสำหรับเครื่องมือที่ต้องการเจาะลึก
- `pnpm config:docs:check` / `pnpm config:docs:gen` ใช้ตรวจสอบ baseline hash ของเอกสารคอนฟิกเทียบกับพื้นผิว schema ปัจจุบัน

ข้อมูลอ้างอิงเชิงลึกเฉพาะด้าน:

- [ข้อมูลอ้างอิงการกำหนดค่า memory](/th/reference/memory-config) สำหรับ `agents.defaults.memorySearch.*`, `memory.qmd.*`, `memory.citations` และคอนฟิก Dreaming ภายใต้ `plugins.entries.memory-core.config.dreaming`
- [Slash Commands](/th/tools/slash-commands) สำหรับแค็ตตาล็อกคำสั่ง built-in + bundled ปัจจุบัน
- หน้าเจ้าของของช่องทาง/Plugin สำหรับพื้นผิวคำสั่งเฉพาะของช่องทาง

รูปแบบคอนฟิกเป็น **JSON5** (รองรับคอมเมนต์และ trailing comma) ทุกฟิลด์เป็นแบบไม่บังคับ — OpenClaw จะใช้ค่าเริ่มต้นที่ปลอดภัยเมื่อไม่ได้ระบุ

---

## ช่องทาง

คีย์คอนฟิกรายช่องทางย้ายไปอยู่ในหน้าเฉพาะแล้ว — ดู
[Configuration — channels](/th/gateway/config-channels) สำหรับ `channels.*`,
รวมถึง Slack, Discord, Telegram, WhatsApp, Matrix, iMessage และช่องทาง bundled
อื่น ๆ (auth, การควบคุมการเข้าถึง, หลายบัญชี, การควบคุม mention)

## ค่าเริ่มต้นของเอเจนต์, หลายเอเจนต์, เซสชัน และข้อความ

ย้ายไปอยู่ในหน้าเฉพาะแล้ว — ดู
[Configuration — agents](/th/gateway/config-agents) สำหรับ:

- `agents.defaults.*` (workspace, model, thinking, Heartbeat, memory, media, Skills, sandbox)
- `multiAgent.*` (การ route และการผูกของหลายเอเจนต์)
- `session.*` (วงจรชีวิตของเซสชัน, Compaction, การตัดทิ้ง)
- `messages.*` (การส่งข้อความ, TTS, การ render Markdown)
- `talk.*` (โหมด Talk)
  - `talk.silenceTimeoutMs`: เมื่อไม่ได้ตั้งค่า Talk จะคงช่วงหยุดรอเริ่มต้นของแพลตฟอร์มก่อนส่งทรานสคริปต์ (`700 ms บน macOS และ Android, 900 ms บน iOS`)

## เครื่องมือและผู้ให้บริการแบบกำหนดเอง

นโยบายเครื่องมือ toggle แบบทดลอง คอนฟิกเครื่องมือที่ขับเคลื่อนด้วย provider และการตั้งค่า
provider / base-URL แบบกำหนดเองย้ายไปอยู่ในหน้าเฉพาะแล้ว — ดู
[Configuration — tools and custom providers](/th/gateway/config-tools)

## Skills

```json5
{
  skills: {
    allowBundled: ["gemini", "peekaboo"],
    load: {
      extraDirs: ["~/Projects/agent-scripts/skills"],
    },
    install: {
      preferBrew: true,
      nodeManager: "npm", // npm | pnpm | yarn | bun
    },
    entries: {
      "image-lab": {
        apiKey: { source: "env", provider: "default", id: "GEMINI_API_KEY" }, // or plaintext string
        env: { GEMINI_API_KEY: "GEMINI_KEY_HERE" },
      },
      peekaboo: { enabled: true },
      sag: { enabled: false },
    },
  },
}
```

- `allowBundled`: allowlist แบบไม่บังคับสำหรับ Skills ที่มาพร้อมระบบเท่านั้น (ไม่กระทบ Skills แบบ managed/workspace)
- `load.extraDirs`: ราก shared skill เพิ่มเติม (ลำดับความสำคัญต่ำสุด)
- `install.preferBrew`: เมื่อเป็น true จะเลือกตัวติดตั้ง Homebrew ก่อนเมื่อมี `brew`
  พร้อมใช้งาน ก่อน fallback ไปยังชนิดตัวติดตั้งอื่น
- `install.nodeManager`: ค่าที่ให้ความสำคัญสำหรับตัวติดตั้ง Node ในสเปก `metadata.openclaw.install`
  (`npm` | `pnpm` | `yarn` | `bun`)
- `entries.<skillKey>.enabled: false` จะปิด Skill แม้ว่าจะเป็น bundled/installed อยู่ก็ตาม
- `entries.<skillKey>.apiKey`: ฟิลด์ช่วยอำนวยความสะดวกสำหรับ Skills ที่ประกาศ primary env var (เป็นสตริง plaintext หรือออบเจ็กต์ SecretRef)

---

## Plugin

```json5
{
  plugins: {
    enabled: true,
    allow: ["voice-call"],
    deny: [],
    load: {
      paths: ["~/Projects/oss/voice-call-plugin"],
    },
    entries: {
      "voice-call": {
        enabled: true,
        hooks: {
          allowPromptInjection: false,
        },
        config: { provider: "twilio" },
      },
    },
  },
}
```

- โหลดจาก `~/.openclaw/extensions`, `<workspace>/.openclaw/extensions` และ `plugins.load.paths`
- การค้นพบรองรับทั้ง Plugin แบบเนทีฟของ OpenClaw รวมถึง bundle ที่เข้ากันได้ของ Codex และ Claude รวมถึง bundle ของ Claude แบบไม่มี manifest ที่ใช้เลย์เอาต์เริ่มต้น
- **การเปลี่ยนคอนฟิกต้องรีสตาร์ต gateway**
- `allow`: allowlist แบบไม่บังคับ (จะโหลดเฉพาะ Plugin ที่อยู่ในรายการ) โดย `deny` มีความสำคัญกว่า
- `plugins.entries.<id>.apiKey`: ฟิลด์ช่วยอำนวยความสะดวกระดับ Plugin สำหรับ API key (เมื่อ Plugin นั้นรองรับ)
- `plugins.entries.<id>.env`: แมป env var ภายใต้ขอบเขตของ Plugin
- `plugins.entries.<id>.hooks.allowPromptInjection`: เมื่อเป็น `false`, core จะบล็อก `before_prompt_build` และเพิกเฉยต่อฟิลด์ที่เปลี่ยนพรอมป์จาก `before_agent_start` แบบ legacy ขณะยังคง `modelOverride` และ `providerOverride` แบบ legacy ไว้ มีผลกับทั้ง native Plugin hook และไดเรกทอรี hook ที่ bundle ที่รองรับจัดให้
- `plugins.entries.<id>.subagent.allowModelOverride`: เชื่อถือ Plugin นี้อย่างชัดเจนให้ร้องขอการ override `provider` และ `model` ต่อการรันสำหรับ background subagent runs
- `plugins.entries.<id>.subagent.allowedModels`: allowlist แบบไม่บังคับของเป้าหมาย `provider/model` แบบ canonical สำหรับ trusted subagent override ใช้ `"*"` เฉพาะเมื่อคุณตั้งใจอนุญาตทุกโมเดลจริง ๆ
- `plugins.entries.<id>.config`: ออบเจ็กต์คอนฟิกที่ Plugin กำหนดเอง (validate ด้วย schema ของ native OpenClaw Plugin เมื่อมี)
- `plugins.entries.firecrawl.config.webFetch`: การตั้งค่า Firecrawl web-fetch provider
  - `apiKey`: Firecrawl API key (รองรับ SecretRef) fallback ไปที่ `plugins.entries.firecrawl.config.webSearch.apiKey`, `tools.web.fetch.firecrawl.apiKey` แบบ legacy หรือ env var `FIRECRAWL_API_KEY`
  - `baseUrl`: Firecrawl API base URL (ค่าปริยาย: `https://api.firecrawl.dev`)
  - `onlyMainContent`: ดึงเฉพาะเนื้อหาหลักจากหน้าเว็บ (ค่าปริยาย: `true`)
  - `maxAgeMs`: อายุแคชสูงสุดเป็นมิลลิวินาที (ค่าปริยาย: `172800000` / 2 วัน)
  - `timeoutSeconds`: หมดเวลา request scrape เป็นวินาที (ค่าปริยาย: `60`)
- `plugins.entries.xai.config.xSearch`: การตั้งค่า xAI X Search (การค้นหาเว็บของ Grok)
  - `enabled`: เปิดใช้ X Search provider
  - `model`: โมเดล Grok ที่จะใช้ค้นหา (เช่น `"grok-4-1-fast"`)
- `plugins.entries.memory-core.config.dreaming`: การตั้งค่า memory Dreaming ดู [Dreaming](/th/concepts/dreaming) สำหรับเฟสและ threshold
  - `enabled`: สวิตช์หลักของ Dreaming (ค่าปริยาย `false`)
  - `frequency`: จังหวะ Cron สำหรับการกวาด Dreaming แบบเต็มแต่ละครั้ง (ค่าปริยาย `"0 3 * * *"`)
  - นโยบายของเฟสและ threshold เป็นรายละเอียดระดับ implementation (ไม่ใช่คีย์คอนฟิกที่มุ่งให้ผู้ใช้ตั้ง)
- คอนฟิก memory ทั้งหมดอยู่ใน [ข้อมูลอ้างอิงการกำหนดค่า memory](/th/reference/memory-config):
  - `agents.defaults.memorySearch.*`
  - `memory.backend`
  - `memory.citations`
  - `memory.qmd.*`
  - `plugins.entries.memory-core.config.dreaming`
- Claude bundle Plugin ที่เปิดใช้งานยังสามารถเพิ่มค่าเริ่มต้นของ Pi แบบฝังมาจาก `settings.json` ได้ด้วย; OpenClaw จะนำมาใช้เป็นการตั้งค่าเอเจนต์ที่ sanitize แล้ว ไม่ใช่ patch คอนฟิก OpenClaw แบบดิบ
- `plugins.slots.memory`: เลือก id ของ memory Plugin ที่กำลังใช้งาน หรือ `"none"` เพื่อปิดการใช้ memory plugin
- `plugins.slots.contextEngine`: เลือก id ของ context engine plugin ที่กำลังใช้งาน; ค่าปริยายเป็น `"legacy"` เว้นแต่คุณจะติดตั้งและเลือก engine อื่น
- `plugins.installs`: metadata การติดตั้งที่ CLI จัดการ ใช้โดย `openclaw plugins update`
  - รวม `source`, `spec`, `sourcePath`, `installPath`, `version`, `resolvedName`, `resolvedVersion`, `resolvedSpec`, `integrity`, `shasum`, `resolvedAt`, `installedAt`
  - ให้ถือว่า `plugins.installs.*` เป็นสถานะที่ระบบจัดการเอง; ควรใช้คำสั่ง CLI มากกว่าการแก้ไขด้วยตนเอง

ดู [Plugins](/th/tools/plugin)

---

## เบราว์เซอร์

```json5
{
  browser: {
    enabled: true,
    evaluateEnabled: true,
    defaultProfile: "user",
    ssrfPolicy: {
      // dangerouslyAllowPrivateNetwork: true, // opt in only for trusted private-network access
      // allowPrivateNetwork: true, // legacy alias
      // hostnameAllowlist: ["*.example.com", "example.com"],
      // allowedHostnames: ["localhost"],
    },
    profiles: {
      openclaw: { cdpPort: 18800, color: "#FF4500" },
      work: { cdpPort: 18801, color: "#0066CC" },
      user: { driver: "existing-session", attachOnly: true, color: "#00AA00" },
      brave: {
        driver: "existing-session",
        attachOnly: true,
        userDataDir: "~/Library/Application Support/BraveSoftware/Brave-Browser",
        color: "#FB542B",
      },
      remote: { cdpUrl: "http://10.0.0.42:9222", color: "#00AA00" },
    },
    color: "#FF4500",
    // headless: false,
    // noSandbox: false,
    // extraArgs: [],
    // executablePath: "/Applications/Brave Browser.app/Contents/MacOS/Brave Browser",
    // attachOnly: false,
  },
}
```

- `evaluateEnabled: false` จะปิด `act:evaluate` และ `wait --fn`
- `ssrfPolicy.dangerouslyAllowPrivateNetwork` จะถูกปิดเมื่อไม่ได้ตั้งค่า ดังนั้นการนำทางของเบราว์เซอร์จะเข้มงวดโดยค่าปริยาย
- ตั้ง `ssrfPolicy.dangerouslyAllowPrivateNetwork: true` เฉพาะเมื่อคุณตั้งใจเชื่อถือการนำทางของเบราว์เซอร์ไปยังเครือข่ายส่วนตัวจริง ๆ
- ในโหมด strict ปลายทาง remote CDP profile (`profiles.*.cdpUrl`) จะอยู่ภายใต้การบล็อกเครือข่ายส่วนตัวแบบเดียวกันระหว่างการตรวจการเข้าถึง/การค้นพบ
- `ssrfPolicy.allowPrivateNetwork` ยังคงรองรับในฐานะ alias แบบ legacy
- ในโหมด strict ให้ใช้ `ssrfPolicy.hostnameAllowlist` และ `ssrfPolicy.allowedHostnames` สำหรับข้อยกเว้นแบบ explicit
- โปรไฟล์ระยะไกลเป็นแบบ attach-only (ปิดการ start/stop/reset)
- `profiles.*.cdpUrl` รองรับ `http://`, `https://`, `ws://` และ `wss://`
  ใช้ HTTP(S) เมื่อคุณต้องการให้ OpenClaw ค้นพบ `/json/version`; ใช้ WS(S)
  เมื่อ provider ของคุณให้ DevTools WebSocket URL โดยตรงมา
- โปรไฟล์ `existing-session` ใช้ Chrome MCP แทน CDP และสามารถ attach บน
  โฮสต์ที่เลือกหรือผ่าน browser Node ที่เชื่อมต่ออยู่
- โปรไฟล์ `existing-session` สามารถตั้ง `userDataDir` เพื่อกำหนดเป้าหมายไปยัง
  โปรไฟล์ของเบราว์เซอร์ที่อิง Chromium โดยเฉพาะ เช่น Brave หรือ Edge
- โปรไฟล์ `existing-session` ยังคงข้อจำกัดเส้นทาง Chrome MCP ปัจจุบัน:
  แอ็กชันแบบ snapshot/ref แทนการกำหนดเป้าหมายด้วย CSS selector, hook สำหรับอัปโหลดไฟล์ครั้งละหนึ่งไฟล์,
  ไม่มี dialog timeout override, ไม่มี `wait --load networkidle`, และไม่มี
  `responsebody`, การ export PDF, download interception หรือ batch actions
- โปรไฟล์ `openclaw` แบบ managed ในเครื่องจะกำหนด `cdpPort` และ `cdpUrl` ให้อัตโนมัติ; ควร
  ตั้ง `cdpUrl` เองเฉพาะสำหรับ remote CDP
- ลำดับการตรวจหาอัตโนมัติ: เบราว์เซอร์เริ่มต้นถ้าอิง Chromium → Chrome → Brave → Edge → Chromium → Chrome Canary
- บริการควบคุม: loopback เท่านั้น (port ได้มาจาก `gateway.port`, ค่าปริยาย `18791`)
- `extraArgs` จะต่อ launch flag เพิ่มเติมเข้ากับการเริ่ม Chromium ในเครื่อง (เช่น
  `--disable-gpu`, การกำหนดขนาดหน้าต่าง หรือ debug flag)

---

## UI

```json5
{
  ui: {
    seamColor: "#FF4500",
    assistant: {
      name: "OpenClaw",
      avatar: "CB", // emoji, short text, image URL, or data URI
    },
  },
}
```

- `seamColor`: สีเน้นสำหรับ UI chrome ของแอปเนทีฟ (สี bubble ของโหมด Talk เป็นต้น)
- `assistant`: การ override ตัวตนของ Control UI fallback ไปใช้ตัวตนของเอเจนต์ที่กำลังใช้งาน

---

## Gateway

```json5
{
  gateway: {
    mode: "local", // local | remote
    port: 18789,
    bind: "loopback",
    auth: {
      mode: "token", // none | token | password | trusted-proxy
      token: "your-token",
      // password: "your-password", // or OPENCLAW_GATEWAY_PASSWORD
      // trustedProxy: { userHeader: "x-forwarded-user" }, // for mode=trusted-proxy; see /gateway/trusted-proxy-auth
      allowTailscale: true,
      rateLimit: {
        maxAttempts: 10,
        windowMs: 60000,
        lockoutMs: 300000,
        exemptLoopback: true,
      },
    },
    tailscale: {
      mode: "off", // off | serve | funnel
      resetOnExit: false,
    },
    controlUi: {
      enabled: true,
      basePath: "/openclaw",
      // root: "dist/control-ui",
      // embedSandbox: "scripts", // strict | scripts | trusted
      // allowExternalEmbedUrls: false, // dangerous: allow absolute external http(s) embed URLs
      // allowedOrigins: ["https://control.example.com"], // required for non-loopback Control UI
      // dangerouslyAllowHostHeaderOriginFallback: false, // dangerous Host-header origin fallback mode
      // allowInsecureAuth: false,
      // dangerouslyDisableDeviceAuth: false,
    },
    remote: {
      url: "ws://gateway.tailnet:18789",
      transport: "ssh", // ssh | direct
      token: "your-token",
      // password: "your-password",
    },
    trustedProxies: ["10.0.0.1"],
    // Optional. Default false.
    allowRealIpFallback: false,
    tools: {
      // Additional /tools/invoke HTTP denies
      deny: ["browser"],
      // Remove tools from the default HTTP deny list
      allow: ["gateway"],
    },
    push: {
      apns: {
        relay: {
          baseUrl: "https://relay.example.com",
          timeoutMs: 10000,
        },
      },
    },
  },
}
```

<Accordion title="รายละเอียดฟิลด์ของ Gateway">

- `mode`: `local` (รัน gateway) หรือ `remote` (เชื่อมต่อไปยัง gateway ระยะไกล) Gateway จะปฏิเสธการเริ่มทำงานหากไม่ใช่ `local`
- `port`: พอร์ตเดียวแบบ multiplexed สำหรับ WS + HTTP ลำดับความสำคัญ: `--port` > `OPENCLAW_GATEWAY_PORT` > `gateway.port` > `18789`
- `bind`: `auto`, `loopback` (ค่าปริยาย), `lan` (`0.0.0.0`), `tailnet` (เฉพาะ IP ของ Tailscale) หรือ `custom`
- **alias ของ bind แบบ legacy**: ใช้ค่า bind mode ใน `gateway.bind` (`auto`, `loopback`, `lan`, `tailnet`, `custom`) ไม่ใช่ alias ของ host (`0.0.0.0`, `127.0.0.1`, `localhost`, `::`, `::1`)
- **หมายเหตุเกี่ยวกับ Docker**: ค่า bind แบบ `loopback` ค่าปริยายจะฟังที่ `127.0.0.1` ภายในคอนเทนเนอร์ เมื่อใช้ Docker bridge networking (`-p 18789:18789`) ทราฟฟิกจะเข้าทาง `eth0` ทำให้เข้าถึง gateway ไม่ได้ ใช้ `--network host` หรือกำหนด `bind: "lan"` (หรือ `bind: "custom"` พร้อม `customBindHost: "0.0.0.0"`) เพื่อให้ฟังทุก interface
- **Auth**: ต้องใช้เป็นค่าปริยาย bind ที่ไม่ใช่ loopback ต้องใช้ gateway auth ในทางปฏิบัติหมายถึง token/รหัสผ่านแบบใช้ร่วมกัน หรือ reverse proxy ที่รับรู้ตัวตนโดยใช้ `gateway.auth.mode: "trusted-proxy"` ตัวช่วย onboarding จะสร้าง token ให้เป็นค่าปริยาย
- หากกำหนดค่าทั้ง `gateway.auth.token` และ `gateway.auth.password` (รวมถึง SecretRef) ให้ตั้ง `gateway.auth.mode` อย่างชัดเจนเป็น `token` หรือ `password` การเริ่มทำงานและ flow สำหรับติดตั้ง/ซ่อมแซม service จะล้มเหลวเมื่อมีการกำหนดค่าทั้งสองอย่างแต่ไม่ได้ตั้ง mode
- `gateway.auth.mode: "none"`: โหมดไม่ใช้ auth แบบ explicit ใช้เฉพาะกับการตั้งค่า local loopback ที่เชื่อถือได้เท่านั้น; ตัวเลือกนี้จะไม่ถูกเสนอโดยพรอมป์ onboarding โดยตั้งใจ
- `gateway.auth.mode: "trusted-proxy"`: มอบหมาย auth ให้ reverse proxy ที่รับรู้ตัวตน และเชื่อถือ identity header จาก `gateway.trustedProxies` (ดู [Trusted Proxy Auth](/th/gateway/trusted-proxy-auth)) โหมดนี้คาดหวัง **แหล่ง proxy ที่ไม่ใช่ loopback**; reverse proxy แบบ loopback บนโฮสต์เดียวกันไม่ถือว่าผ่าน trusted-proxy auth
- `gateway.auth.allowTailscale`: เมื่อเป็น `true`, identity header ของ Tailscale Serve สามารถใช้ผ่าน Control UI/WebSocket auth ได้ (ตรวจสอบผ่าน `tailscale whois`) ส่วน HTTP API endpoint **จะไม่** ใช้ Tailscale header auth นี้; จะใช้โหมด HTTP auth ปกติของ gateway แทน flow แบบไม่ใช้ token นี้ถือว่าโฮสต์ gateway เป็นที่เชื่อถือได้ ค่าปริยายคือ `true` เมื่อ `tailscale.mode = "serve"`
- `gateway.auth.rateLimit`: ตัวจำกัดการ auth ที่ล้มเหลวแบบไม่บังคับ ใช้แยกตาม client IP และ auth scope (shared-secret และ device-token ถูกติดตามแยกกัน) ความพยายามที่ถูกบล็อกจะได้ `429` + `Retry-After`
  - บนเส้นทาง async Tailscale Serve Control UI ความพยายามที่ล้มเหลวสำหรับ `{scope, clientIp}` เดียวกันจะถูก serialize ก่อนการเขียน failure ดังนั้น bad attempt ที่เกิดพร้อมกันจาก client เดียวกันอาจทำให้ติด limiter ตั้งแต่คำขอที่สอง แทนที่จะให้ทั้งสองคำขอหลุดผ่านไปเป็นเพียงการไม่ตรงกันแบบปกติ
  - `gateway.auth.rateLimit.exemptLoopback` มีค่าปริยายเป็น `true`; ตั้งเป็น `false` เมื่อตั้งใจให้ทราฟฟิก localhost ถูกจำกัดอัตราด้วย (สำหรับชุดทดสอบหรือการใช้งาน proxy แบบเข้มงวด)
- ความพยายาม auth แบบ browser-origin WS จะถูก throttle เสมอโดยปิดการยกเว้น loopback (ป้องกันเชิงลึกต่อ brute force บน localhost จากเบราว์เซอร์)
- บน loopback การ lockout จาก browser-origin เหล่านั้นจะแยกตามค่า `Origin`
  ที่ normalize แล้ว ดังนั้นความล้มเหลวซ้ำ ๆ จาก localhost origin หนึ่งจะไม่ทำให้
  อีก origin หนึ่งถูก lockout โดยอัตโนมัติ
- `tailscale.mode`: `serve` (เฉพาะ tailnet, bind แบบ loopback) หรือ `funnel` (สาธารณะ, ต้องใช้ auth)
- `controlUi.allowedOrigins`: allowlist ของ browser-origin แบบ explicit สำหรับการเชื่อมต่อ Gateway WebSocket จำเป็นเมื่อคาดว่าจะมี browser client จาก origin ที่ไม่ใช่ loopback
- `controlUi.dangerouslyAllowHostHeaderOriginFallback`: โหมดอันตรายที่เปิดใช้ Host-header origin fallback สำหรับ deployment ที่ตั้งใจพึ่งนโยบาย origin ตาม Host header
- `remote.transport`: `ssh` (ค่าปริยาย) หรือ `direct` (ws/wss) สำหรับ `direct`, `remote.url` ต้องเป็น `ws://` หรือ `wss://`
- `OPENCLAW_ALLOW_INSECURE_PRIVATE_WS=1`: ตัว override แบบ break-glass ใน process-environment ฝั่ง client
  ที่อนุญาตให้ใช้ `ws://` แบบ plaintext กับ IP เครือข่ายส่วนตัวที่เชื่อถือได้;
  ค่าปริยายยังคงอนุญาต plaintext ได้เฉพาะ loopback เท่านั้น ไม่มีตัวเทียบเท่าใน `openclaw.json`
  และคอนฟิกเครือข่ายส่วนตัวของเบราว์เซอร์ เช่น
  `browser.ssrfPolicy.dangerouslyAllowPrivateNetwork` ก็ไม่มีผลต่อ Gateway
  WebSocket client
- `gateway.remote.token` / `.password` เป็นฟิลด์ข้อมูลรับรองของ remote-client โดยตัวมันเองไม่ได้กำหนดค่า gateway auth
- `gateway.push.apns.relay.baseUrl`: base HTTPS URL สำหรับ APNs relay ภายนอกที่ใช้โดย iOS build แบบ official/TestFlight หลังจาก publish การลงทะเบียนที่ใช้ relay-backed ไปยัง gateway แล้ว URL นี้ต้องตรงกับ relay URL ที่คอมไพล์เข้าไปใน iOS build
- `gateway.push.apns.relay.timeoutMs`: timeout สำหรับการส่งจาก gateway ไป relay ในหน่วยมิลลิวินาที ค่าปริยายคือ `10000`
- การลงทะเบียนแบบ relay-backed จะถูกมอบหมายให้กับ identity เฉพาะของ gateway แอป iOS ที่จับคู่แล้วจะดึง `gateway.identity.get`, รวม identity นั้นในการลงทะเบียน relay และส่งต่อ send grant ที่อยู่ในขอบเขตของการลงทะเบียนไปยัง gateway ดังนั้น gateway อื่นจะไม่สามารถนำการลงทะเบียนที่เก็บไว้นี้ไปใช้ซ้ำได้
- `OPENCLAW_APNS_RELAY_BASE_URL` / `OPENCLAW_APNS_RELAY_TIMEOUT_MS`: env override ชั่วคราวสำหรับคอนฟิก relay ข้างต้น
- `OPENCLAW_APNS_RELAY_ALLOW_HTTP=true`: escape hatch สำหรับการพัฒนาเท่านั้น เพื่อใช้ relay URL แบบ HTTP บน loopback ส่วน relay URL สำหรับ production ควรเป็น HTTPS
- `gateway.channelHealthCheckMinutes`: ช่วงเวลาของตัวตรวจสุขภาพช่องทางในหน่วยนาที ตั้ง `0` เพื่อปิดการรีสตาร์ตโดย health-monitor ทั่วทั้งระบบ ค่าปริยาย: `5`
- `gateway.channelStaleEventThresholdMinutes`: threshold ของ socket ค้างในหน่วยนาที ควรให้ค่านี้มากกว่าหรือเท่ากับ `gateway.channelHealthCheckMinutes` ค่าปริยาย: `30`
- `gateway.channelMaxRestartsPerHour`: จำนวนการรีสตาร์ตสูงสุดต่อช่องทาง/บัญชีในหนึ่งชั่วโมงแบบ rolling ค่าปริยาย: `10`
- `channels.<provider>.healthMonitor.enabled`: opt-out รายช่องทางสำหรับการรีสตาร์ตโดย health-monitor โดยยังคงเปิด global monitor ไว้
- `channels.<provider>.accounts.<accountId>.healthMonitor.enabled`: override รายบัญชีสำหรับช่องทางแบบหลายบัญชี เมื่อมีการตั้งค่าไว้ จะมีความสำคัญเหนือกว่า override ระดับช่องทาง
- เส้นทางการเรียก local gateway สามารถใช้ `gateway.remote.*` เป็น fallback ได้ก็ต่อเมื่อ `gateway.auth.*` ยังไม่ได้ตั้งค่า
- หากมีการกำหนด `gateway.auth.token` / `gateway.auth.password` ผ่าน SecretRef อย่างชัดเจน และ resolve ไม่ได้ การ resolve จะ fail closed (ไม่มี remote fallback มาช่วยปกปิด)
- `trustedProxies`: IP ของ reverse proxy ที่ทำ TLS termination หรือ inject forwarded-client header ควรระบุเฉพาะ proxy ที่คุณควบคุมเท่านั้น รายการ loopback ยังคงใช้ได้สำหรับการตั้งค่าแบบ same-host proxy/local-detection (เช่น Tailscale Serve หรือ reverse proxy ในเครื่อง) แต่รายการเหล่านั้น **ไม่ได้** ทำให้คำขอ loopback มีคุณสมบัติสำหรับ `gateway.auth.mode: "trusted-proxy"`
- `allowRealIpFallback`: เมื่อเป็น `true`, gateway จะยอมรับ `X-Real-IP` หากไม่มี `X-Forwarded-For` ค่าปริยาย `false` เพื่อให้เป็น fail-closed
- `gateway.tools.deny`: ชื่อเครื่องมือเพิ่มเติมที่ถูกบล็อกสำหรับ HTTP `POST /tools/invoke` (ขยาย default deny list)
- `gateway.tools.allow`: ลบชื่อเครื่องมือออกจาก default HTTP deny list

</Accordion>

### endpoint ที่เข้ากันได้กับ OpenAI

- Chat Completions: ปิดไว้เป็นค่าปริยาย เปิดได้ด้วย `gateway.http.endpoints.chatCompletions.enabled: true`
- Responses API: `gateway.http.endpoints.responses.enabled`
- การเสริมความปลอดภัยสำหรับ URL-input ของ Responses:
  - `gateway.http.endpoints.responses.maxUrlParts`
  - `gateway.http.endpoints.responses.files.urlAllowlist`
  - `gateway.http.endpoints.responses.images.urlAllowlist`
    allowlist ที่ว่างจะถือว่าเหมือนไม่ได้ตั้งค่า; ใช้ `gateway.http.endpoints.responses.files.allowUrl=false`
    และ/หรือ `gateway.http.endpoints.responses.images.allowUrl=false` เพื่อปิดการดึง URL
- header สำหรับเสริมความปลอดภัยของ response แบบไม่บังคับ:
  - `gateway.http.securityHeaders.strictTransportSecurity` (ตั้งค่านี้เฉพาะกับ HTTPS origin ที่คุณควบคุม; ดู [Trusted Proxy Auth](/th/gateway/trusted-proxy-auth#tls-termination-and-hsts))

### การแยกหลายอินสแตนซ์

รันหลาย gateway บนโฮสต์เดียวกันโดยใช้พอร์ตและ state dir ที่ไม่ซ้ำกัน:

```bash
OPENCLAW_CONFIG_PATH=~/.openclaw/a.json \
OPENCLAW_STATE_DIR=~/.openclaw-a \
openclaw gateway --port 19001
```

แฟล็กอำนวยความสะดวก: `--dev` (ใช้ `~/.openclaw-dev` + พอร์ต `19001`), `--profile <name>` (ใช้ `~/.openclaw-<name>`)

ดู [Multiple Gateways](/th/gateway/multiple-gateways)

### `gateway.tls`

```json5
{
  gateway: {
    tls: {
      enabled: false,
      autoGenerate: false,
      certPath: "/etc/openclaw/tls/server.crt",
      keyPath: "/etc/openclaw/tls/server.key",
      caPath: "/etc/openclaw/tls/ca-bundle.crt",
    },
  },
}
```

- `enabled`: เปิดใช้ TLS termination ที่ตัว listener ของ gateway (HTTPS/WSS) (ค่าปริยาย: `false`)
- `autoGenerate`: สร้างคู่ cert/key แบบ self-signed ในเครื่องอัตโนมัติเมื่อไม่ได้กำหนดไฟล์ไว้โดยชัดเจน; ใช้สำหรับ local/dev เท่านั้น
- `certPath`: พาธในไฟล์ระบบไปยังไฟล์ TLS certificate
- `keyPath`: พาธในไฟล์ระบบไปยังไฟล์ TLS private key; ควรจำกัดสิทธิ์การเข้าถึง
- `caPath`: พาธของ CA bundle แบบไม่บังคับ สำหรับการตรวจสอบไคลเอนต์หรือ custom trust chain

### `gateway.reload`

```json5
{
  gateway: {
    reload: {
      mode: "hybrid", // off | restart | hot | hybrid
      debounceMs: 500,
      deferralTimeoutMs: 300000,
    },
  },
}
```

- `mode`: ควบคุมว่าการแก้ไขคอนฟิกจะถูกนำมาใช้ระหว่างรันไทม์อย่างไร
  - `"off"`: ไม่สนใจการแก้ไขแบบ live; การเปลี่ยนแปลงต้องรีสตาร์ตอย่างชัดเจน
  - `"restart"`: รีสตาร์ตโพรเซส gateway ทุกครั้งเมื่อคอนฟิกเปลี่ยน
  - `"hot"`: นำการเปลี่ยนแปลงมาใช้ในโพรเซสโดยไม่ต้องรีสตาร์ต
  - `"hybrid"` (ค่าปริยาย): ลอง hot reload ก่อน; fallback ไปรีสตาร์ตหากจำเป็น
- `debounceMs`: ช่วง debounce เป็นมิลลิวินาทีก่อนนำการเปลี่ยนแปลงคอนฟิกมาใช้ (เป็นจำนวนเต็มไม่ติดลบ)
- `deferralTimeoutMs`: เวลาสูงสุดเป็นมิลลิวินาทีที่รอให้ operation ที่กำลังทำงานอยู่เสร็จก่อนจะบังคับรีสตาร์ต (ค่าปริยาย: `300000` = 5 นาที)

---

## Hook

```json5
{
  hooks: {
    enabled: true,
    token: "shared-secret",
    path: "/hooks",
    maxBodyBytes: 262144,
    defaultSessionKey: "hook:ingress",
    allowRequestSessionKey: true,
    allowedSessionKeyPrefixes: ["hook:", "hook:gmail:"],
    allowedAgentIds: ["hooks", "main"],
    presets: ["gmail"],
    transformsDir: "~/.openclaw/hooks/transforms",
    mappings: [
      {
        match: { path: "gmail" },
        action: "agent",
        agentId: "hooks",
        wakeMode: "now",
        name: "Gmail",
        sessionKey: "hook:gmail:{{messages[0].id}}",
        messageTemplate: "From: {{messages[0].from}}\nSubject: {{messages[0].subject}}\n{{messages[0].snippet}}",
        deliver: true,
        channel: "last",
        model: "openai/gpt-5.4-mini",
      },
    ],
  },
}
```

Auth: `Authorization: Bearer <token>` หรือ `x-openclaw-token: <token>`
ระบบจะปฏิเสธ hook token ใน query string

หมายเหตุเกี่ยวกับ validation และความปลอดภัย:

- `hooks.enabled=true` ต้องใช้ `hooks.token` ที่ไม่ว่าง
- `hooks.token` ต้อง **แตกต่าง** จาก `gateway.auth.token`; ระบบจะปฏิเสธการใช้ Gateway token ซ้ำ
- `hooks.path` ต้องไม่เป็น `/`; ให้ใช้ subpath เฉพาะ เช่น `/hooks`
- หาก `hooks.allowRequestSessionKey=true` ให้จำกัด `hooks.allowedSessionKeyPrefixes` (เช่น `["hook:"]`)
- หาก mapping หรือ preset ใช้ `sessionKey` แบบเทมเพลต ให้ตั้ง `hooks.allowedSessionKeyPrefixes` และ `hooks.allowRequestSessionKey=true` คีย์แบบ static ของ mapping ไม่ต้องใช้ opt-in นี้

**endpoint:**

- `POST /hooks/wake` → `{ text, mode?: "now"|"next-heartbeat" }`
- `POST /hooks/agent` → `{ message, name?, agentId?, sessionKey?, wakeMode?, deliver?, channel?, to?, model?, thinking?, timeoutSeconds? }`
  - `sessionKey` จาก request payload จะถูกรับได้ก็ต่อเมื่อ `hooks.allowRequestSessionKey=true` (ค่าปริยาย: `false`)
- `POST /hooks/<name>` → resolve ผ่าน `hooks.mappings`
  - ค่า `sessionKey` ของ mapping ที่ render จากเทมเพลตจะถือว่าเป็นค่าที่มาจากภายนอก และต้องใช้ `hooks.allowRequestSessionKey=true` เช่นกัน

<Accordion title="รายละเอียดของ Mapping">

- `match.path` จับคู่ sub-path หลัง `/hooks` (เช่น `/hooks/gmail` → `gmail`)
- `match.source` จับคู่ฟิลด์ใน payload สำหรับ path แบบทั่วไป
- เทมเพลตอย่าง `{{messages[0].subject}}` จะอ่านค่าจาก payload
- `transform` สามารถชี้ไปยังโมดูล JS/TS ที่คืนค่าเป็น hook action
  - `transform.module` ต้องเป็นพาธแบบ relative และต้องอยู่ภายใน `hooks.transformsDir` (ระบบจะปฏิเสธ absolute path และการ traversal)
- `agentId` ใช้ route ไปยังเอเจนต์ที่ระบุ; ID ที่ไม่รู้จักจะ fallback ไปยังค่าเริ่มต้น
- `allowedAgentIds`: จำกัดการ route แบบ explicit (`*` หรือไม่ระบุ = อนุญาตทั้งหมด, `[]` = ปฏิเสธทั้งหมด)
- `defaultSessionKey`: session key แบบคงที่ที่ไม่บังคับ สำหรับ hook agent run ที่ไม่มี `sessionKey` แบบ explicit
- `allowRequestSessionKey`: อนุญาตให้ผู้เรียก `/hooks/agent` และ session key ของ mapping ที่ขับเคลื่อนด้วยเทมเพลตกำหนด `sessionKey` ได้ (ค่าปริยาย: `false`)
- `allowedSessionKeyPrefixes`: allowlist แบบ prefix ที่ไม่บังคับสำหรับค่า `sessionKey` แบบ explicit (ทั้ง request + mapping) เช่น `["hook:"]` จะกลายเป็นสิ่งจำเป็นเมื่อ mapping หรือ preset ใดก็ตามใช้ `sessionKey` แบบเทมเพลต
- `deliver: true` จะส่งคำตอบสุดท้ายไปยังช่องทาง; `channel` มีค่าปริยายเป็น `last`
- `model` ใช้ override LLM สำหรับ hook run นี้ (ต้องได้รับอนุญาตหากมีการตั้ง model catalog)

</Accordion>

### การผสานรวม Gmail

- Gmail preset ที่มีมาในตัวใช้ `sessionKey: "hook:gmail:{{messages[0].id}}"`
- หากคุณคงการ route แบบต่อข้อความนี้ไว้ ให้ตั้ง `hooks.allowRequestSessionKey: true` และจำกัด `hooks.allowedSessionKeyPrefixes` ให้ตรงกับ namespace ของ Gmail เช่น `["hook:", "hook:gmail:"]`
- หากคุณต้องการ `hooks.allowRequestSessionKey: false` ให้ override preset ด้วย `sessionKey` แบบ static แทนค่าเริ่มต้นแบบเทมเพลต

```json5
{
  hooks: {
    gmail: {
      account: "openclaw@gmail.com",
      topic: "projects/<project-id>/topics/gog-gmail-watch",
      subscription: "gog-gmail-watch-push",
      pushToken: "shared-push-token",
      hookUrl: "http://127.0.0.1:18789/hooks/gmail",
      includeBody: true,
      maxBytes: 20000,
      renewEveryMinutes: 720,
      serve: { bind: "127.0.0.1", port: 8788, path: "/" },
      tailscale: { mode: "funnel", path: "/gmail-pubsub" },
      model: "openrouter/meta-llama/llama-3.3-70b-instruct:free",
      thinking: "off",
    },
  },
}
```

- Gateway จะเริ่ม `gog gmail watch serve` อัตโนมัติตอนบูตเมื่อมีการกำหนดค่าไว้ ตั้ง `OPENCLAW_SKIP_GMAIL_WATCHER=1` เพื่อปิดการทำงานนี้
- อย่ารัน `gog gmail watch serve` แยกต่างหากควบคู่ไปกับ Gateway

---

## โฮสต์ Canvas

```json5
{
  canvasHost: {
    root: "~/.openclaw/workspace/canvas",
    liveReload: true,
    // enabled: false, // or OPENCLAW_SKIP_CANVAS_HOST=1
  },
}
```

- ให้บริการ HTML/CSS/JS ที่เอเจนต์แก้ไขได้และ A2UI ผ่าน HTTP ภายใต้พอร์ต Gateway:
  - `http://<gateway-host>:<gateway.port>/__openclaw__/canvas/`
  - `http://<gateway-host>:<gateway.port>/__openclaw__/a2ui/`
- เฉพาะในเครื่องเท่านั้น: ควรใช้ `gateway.bind: "loopback"` (ค่าปริยาย)
- bind ที่ไม่ใช่ loopback: เส้นทาง canvas ต้องใช้ Gateway auth (token/password/trusted-proxy) เช่นเดียวกับพื้นผิว HTTP อื่นของ Gateway
- โดยทั่วไป Node WebView จะไม่ส่ง auth header; หลังจากจับคู่และเชื่อมต่อ Node แล้ว Gateway จะประกาศ capability URL แบบอยู่ในขอบเขตของ Node สำหรับการเข้าถึง canvas/A2UI
- Capability URL จะผูกกับเซสชัน WS ของ Node ที่กำลังใช้งานอยู่และหมดอายุอย่างรวดเร็ว ไม่มีการใช้ fallback แบบอิง IP
- inject live-reload client เข้าไปใน HTML ที่ให้บริการ
- สร้าง `index.html` เริ่มต้นให้อัตโนมัติเมื่อยังว่างอยู่
- ให้บริการ A2UI ที่ `/__openclaw__/a2ui/` ด้วย
- การเปลี่ยนแปลงต้องรีสตาร์ต gateway
- ปิด live reload สำหรับไดเรกทอรีขนาดใหญ่หรือเมื่อเกิดข้อผิดพลาด `EMFILE`

---

## Discovery

### mDNS (Bonjour)

```json5
{
  discovery: {
    mdns: {
      mode: "minimal", // minimal | full | off
    },
  },
}
```

- `minimal` (ค่าปริยาย): ไม่ใส่ `cliPath` + `sshPort` ใน TXT record
- `full`: ใส่ `cliPath` + `sshPort`
- ชื่อโฮสต์มีค่าปริยายเป็น `openclaw` override ได้ด้วย `OPENCLAW_MDNS_HOSTNAME`

### แบบ Wide-area (DNS-SD)

```json5
{
  discovery: {
    wideArea: { enabled: true },
  },
}
```

เขียน unicast DNS-SD zone ภายใต้ `~/.openclaw/dns/` สำหรับการค้นพบข้ามเครือข่าย ให้ใช้ร่วมกับ DNS server (แนะนำ CoreDNS) + Tailscale split DNS

การตั้งค่า: `openclaw dns setup --apply`

---

## สภาพแวดล้อม

### `env` (env var แบบ inline)

```json5
{
  env: {
    OPENROUTER_API_KEY: "sk-or-...",
    vars: {
      GROQ_API_KEY: "gsk-...",
    },
    shellEnv: {
      enabled: true,
      timeoutMs: 15000,
    },
  },
}
```

- env var แบบ inline จะถูกนำมาใช้ก็ต่อเมื่อ process env ไม่มีคีย์นั้นอยู่
- ไฟล์ `.env`: `.env` ของ CWD + `~/.openclaw/.env` (ทั้งสองตำแหน่งจะไม่ override ตัวแปรที่มีอยู่แล้ว)
- `shellEnv`: นำเข้าคีย์ที่คาดว่าจะต้องใช้ซึ่งยังขาดอยู่จากโปรไฟล์ login shell ของคุณ
- ดู [Environment](/th/help/environment) สำหรับลำดับความสำคัญแบบเต็ม

### การแทนค่าด้วย env var

อ้างอิง env var ในสตริงคอนฟิกใดก็ได้ด้วย `${VAR_NAME}`:

```json5
{
  gateway: {
    auth: { token: "${OPENCLAW_GATEWAY_TOKEN}" },
  },
}
```

- จับคู่เฉพาะชื่อตัวพิมพ์ใหญ่: `[A-Z_][A-Z0-9_]*`
- ตัวแปรที่หายไป/ว่างจะทำให้เกิดข้อผิดพลาดตอนโหลดคอนฟิก
- escape ด้วย `$${VAR}` หากต้องการ `${VAR}` แบบตัวอักษรตามตรง
- ใช้งานได้กับ `$include`

---

## Secrets

Secret ref เป็นแบบเพิ่มเติม: ค่าที่เป็น plaintext ก็ยังใช้งานได้

### `SecretRef`

ใช้รูปแบบออบเจ็กต์เดียว:

```json5
{ source: "env" | "file" | "exec", provider: "default", id: "..." }
```

Validation:

- รูปแบบ `provider`: `^[a-z][a-z0-9_-]{0,63}$`
- รูปแบบ `id` สำหรับ `source: "env"`: `^[A-Z][A-Z0-9_]{0,127}$`
- `id` สำหรับ `source: "file"`: absolute JSON pointer (เช่น `"/providers/openai/apiKey"`)
- รูปแบบ `id` สำหรับ `source: "exec"`: `^[A-Za-z0-9][A-Za-z0-9._:/-]{0,255}$`
- `id` ของ `source: "exec"` ต้องไม่มี path segment แบบ `.` หรือ `..` ที่คั่นด้วย slash (เช่น `a/../b` จะถูกปฏิเสธ)

### พื้นผิวข้อมูลรับรองที่รองรับ

- เมทริกซ์มาตรฐาน: [SecretRef Credential Surface](/th/reference/secretref-credential-surface)
- `secrets apply` จะกำหนดเป้าหมายไปยังพาธข้อมูลรับรองใน `openclaw.json` ที่รองรับ
- ref ใน `auth-profiles.json` จะถูกรวมอยู่ในการ resolve ระหว่างรันไทม์และในการตรวจสอบ audit

### คอนฟิก Secret provider

```json5
{
  secrets: {
    providers: {
      default: { source: "env" }, // optional explicit env provider
      filemain: {
        source: "file",
        path: "~/.openclaw/secrets.json",
        mode: "json",
        timeoutMs: 5000,
      },
      vault: {
        source: "exec",
        command: "/usr/local/bin/openclaw-vault-resolver",
        passEnv: ["PATH", "VAULT_ADDR"],
      },
    },
    defaults: {
      env: "default",
      file: "filemain",
      exec: "vault",
    },
  },
}
```

หมายเหตุ:

- provider แบบ `file` รองรับ `mode: "json"` และ `mode: "singleValue"` (`id` ต้องเป็น `"value"` ในโหมด singleValue)
- พาธของ file และ exec provider จะ fail closed เมื่อไม่สามารถตรวจสอบ Windows ACL ได้ ตั้ง `allowInsecurePath: true` เฉพาะกับพาธที่เชื่อถือได้ซึ่งไม่สามารถตรวจสอบได้เท่านั้น
- provider แบบ `exec` ต้องใช้ `command` แบบ absolute path และใช้ payload โปรโตคอลผ่าน stdin/stdout
- โดยค่าปริยาย ระบบจะปฏิเสธพาธคำสั่งที่เป็น symlink ตั้ง `allowSymlinkCommand: true` เพื่ออนุญาตพาธแบบ symlink โดยยังตรวจสอบพาธเป้าหมายที่ resolve แล้ว
- หากมีการกำหนด `trustedDirs` ไว้ การตรวจสอบ trusted-dir จะใช้กับพาธเป้าหมายที่ resolve แล้ว
- สภาพแวดล้อมของ child สำหรับ `exec` จะมีขนาดเล็กเป็นค่าปริยาย; ให้ส่งตัวแปรที่ต้องการแบบ explicit ผ่าน `passEnv`
- Secret ref จะถูก resolve ตอน activation ไปเป็น snapshot ในหน่วยความจำ จากนั้นเส้นทาง request จะอ่านจาก snapshot เท่านั้น
- การกรอง active-surface จะถูกนำมาใช้ระหว่าง activation: ref ที่ resolve ไม่ได้บนพื้นผิวที่เปิดใช้งานอยู่จะทำให้ startup/reload ล้มเหลว ขณะที่พื้นผิวที่ไม่ active จะถูกข้ามพร้อมข้อมูลวินิจฉัย

---

## ที่เก็บ auth

```json5
{
  auth: {
    profiles: {
      "anthropic:default": { provider: "anthropic", mode: "api_key" },
      "anthropic:work": { provider: "anthropic", mode: "api_key" },
      "openai-codex:personal": { provider: "openai-codex", mode: "oauth" },
    },
    order: {
      anthropic: ["anthropic:default", "anthropic:work"],
      "openai-codex": ["openai-codex:personal"],
    },
  },
}
```

- profile รายเอเจนต์จะถูกจัดเก็บที่ `<agentDir>/auth-profiles.json`
- `auth-profiles.json` รองรับ ref ระดับค่า (`keyRef` สำหรับ `api_key`, `tokenRef` สำหรับ `token`) สำหรับโหมดข้อมูลรับรองแบบคงที่
- profile แบบ OAuth (`auth.profiles.<id>.mode = "oauth"`) ไม่รองรับข้อมูลรับรองใน auth-profile ที่รองรับด้วย SecretRef
- ข้อมูลรับรอง runtime แบบคงที่มาจาก snapshot ที่ resolve แล้วในหน่วยความจำ; รายการ `auth.json` แบบ static รุ่นเก่าจะถูกล้างออกเมื่อพบ
- รองรับการนำเข้า OAuth แบบ legacy จาก `~/.openclaw/credentials/oauth.json`
- ดู [OAuth](/th/concepts/oauth)
- พฤติกรรม runtime ของ Secrets และเครื่องมือ `audit/configure/apply`: [Secrets Management](/th/gateway/secrets)

### `auth.cooldowns`

```json5
{
  auth: {
    cooldowns: {
      billingBackoffHours: 5,
      billingBackoffHoursByProvider: { anthropic: 3, openai: 8 },
      billingMaxHours: 24,
      authPermanentBackoffMinutes: 10,
      authPermanentMaxMinutes: 60,
      failureWindowHours: 24,
      overloadedProfileRotations: 1,
      overloadedBackoffMs: 0,
      rateLimitedProfileRotations: 1,
    },
  },
}
```

- `billingBackoffHours`: ระยะ backoff พื้นฐานเป็นชั่วโมงเมื่อ profile ล้มเหลวเพราะ
  ข้อผิดพลาดด้านการเรียกเก็บเงินจริง/เครดิตไม่พอ (ค่าปริยาย: `5`) ข้อความด้าน billing แบบ explicit
  ยังคงเข้ามาในเส้นทางนี้ได้แม้ตอบกลับเป็น `401`/`403` แต่ text matcher
  แบบเฉพาะ provider จะยังคงถูกจำกัดอยู่กับ provider ที่เป็นเจ้าของมันเท่านั้น (เช่น OpenRouter
  `Key limit exceeded`) ข้อความ `402` แบบ retry ได้ที่เกี่ยวกับ usage-window หรือ
  spend-limit ของ organization/workspace จะยังคงอยู่ในเส้นทาง `rate_limit`
  แทน
- `billingBackoffHoursByProvider`: override ราย provider แบบไม่บังคับสำหรับจำนวนชั่วโมงของ billing backoff
- `billingMaxHours`: ค่าสูงสุดเป็นชั่วโมงสำหรับการเติบโตแบบ exponential ของ billing backoff (ค่าปริยาย: `24`)
- `authPermanentBackoffMinutes`: ระยะ backoff พื้นฐานเป็นนาทีสำหรับความล้มเหลวแบบ `auth_permanent` ที่มีความเชื่อมั่นสูง (ค่าปริยาย: `10`)
- `authPermanentMaxMinutes`: ค่าสูงสุดเป็นนาทีสำหรับการเติบโตของ backoff สำหรับ `auth_permanent` (ค่าปริยาย: `60`)
- `failureWindowHours`: หน้าต่างเวลาแบบ rolling เป็นชั่วโมงที่ใช้สำหรับตัวนับ backoff (ค่าปริยาย: `24`)
- `overloadedProfileRotations`: จำนวนการหมุน auth-profile สูงสุดภายใน provider เดียวกันสำหรับข้อผิดพลาดแบบ overloaded ก่อนสลับไปใช้ model fallback (ค่าปริยาย: `1`) รูปแบบ provider-busy เช่น `ModelNotReadyException` จะอยู่ในกลุ่มนี้
- `overloadedBackoffMs`: ระยะหน่วงคงที่ก่อน retry การหมุน provider/profile ที่ overloaded (ค่าปริยาย: `0`)
- `rateLimitedProfileRotations`: จำนวนการหมุน auth-profile สูงสุดภายใน provider เดียวกันสำหรับข้อผิดพลาดแบบ rate limit ก่อนสลับไปใช้ model fallback (ค่าปริยาย: `1`) กลุ่ม rate-limit นี้รวมข้อความที่มีลักษณะเฉพาะของ provider เช่น `Too many concurrent requests`, `ThrottlingException`, `concurrency limit reached`, `workers_ai ... quota limit exceeded` และ `resource exhausted`

---

## Logging

```json5
{
  logging: {
    level: "info",
    file: "/tmp/openclaw/openclaw.log",
    consoleLevel: "info",
    consoleStyle: "pretty", // pretty | compact | json
    redactSensitive: "tools", // off | tools
    redactPatterns: ["\\bTOKEN\\b\\s*[=:]\\s*([\"']?)([^\\s\"']+)\\1"],
  },
}
```

- ไฟล์ log ค่าปริยาย: `/tmp/openclaw/openclaw-YYYY-MM-DD.log`
- ตั้ง `logging.file` หากต้องการพาธที่คงที่
- `consoleLevel` จะเพิ่มเป็น `debug` เมื่อใช้ `--verbose`
- `maxFileBytes`: ขนาดไฟล์ log สูงสุดเป็นไบต์ก่อนที่จะหยุดการเขียนเพิ่ม (เป็นจำนวนเต็มบวก; ค่าปริยาย: `524288000` = 500 MB) สำหรับ deployment ระดับ production ควรใช้การหมุน log ภายนอก

---

## การวินิจฉัย

```json5
{
  diagnostics: {
    enabled: true,
    flags: ["telegram.*"],
    stuckSessionWarnMs: 30000,

    otel: {
      enabled: false,
      endpoint: "https://otel-collector.example.com:4318",
      protocol: "http/protobuf", // http/protobuf | grpc
      headers: { "x-tenant-id": "my-org" },
      serviceName: "openclaw-gateway",
      traces: true,
      metrics: true,
      logs: false,
      sampleRate: 1.0,
      flushIntervalMs: 5000,
    },

    cacheTrace: {
      enabled: false,
      filePath: "~/.openclaw/logs/cache-trace.jsonl",
      includeMessages: true,
      includePrompt: true,
      includeSystem: true,
    },
  },
}
```

- `enabled`: สวิตช์หลักสำหรับเอาต์พุต instrumentation (ค่าปริยาย: `true`)
- `flags`: อาร์เรย์ของสตริงแฟล็กที่เปิดใช้เอาต์พุต log แบบเจาะจงเป้าหมาย (รองรับ wildcard เช่น `"telegram.*"` หรือ `"*"`)
- `stuckSessionWarnMs`: ค่า threshold ของอายุเป็นมิลลิวินาทีสำหรับการส่งคำเตือน stuck-session ขณะที่เซสชันยังคงอยู่ในสถานะกำลังประมวลผล
- `otel.enabled`: เปิดใช้ไปป์ไลน์ส่งออก OpenTelemetry (ค่าปริยาย: `false`)
- `otel.endpoint`: URL ของ collector สำหรับส่งออก OTel
- `otel.protocol`: `"http/protobuf"` (ค่าปริยาย) หรือ `"grpc"`
- `otel.headers`: header metadata HTTP/gRPC เพิ่มเติมที่ส่งไปพร้อมคำขอส่งออก OTel
- `otel.serviceName`: ชื่อบริการสำหรับ resource attribute
- `otel.traces` / `otel.metrics` / `otel.logs`: เปิดใช้การส่งออก trace, metrics หรือ log
- `otel.sampleRate`: อัตราการสุ่มตัวอย่าง trace `0`–`1`
- `otel.flushIntervalMs`: ช่วงเวลา flush telemetry แบบเป็นคาบในหน่วยมิลลิวินาที
- `cacheTrace.enabled`: บันทึก snapshot ของ cache trace สำหรับ embedded run (ค่าปริยาย: `false`)
- `cacheTrace.filePath`: พาธเอาต์พุตสำหรับ cache trace JSONL (ค่าปริยาย: `$OPENCLAW_STATE_DIR/logs/cache-trace.jsonl`)
- `cacheTrace.includeMessages` / `includePrompt` / `includeSystem`: ควบคุมสิ่งที่จะรวมอยู่ในเอาต์พุต cache trace (ค่าปริยายทั้งหมดเป็น `true`)

---

## การอัปเดต

```json5
{
  update: {
    channel: "stable", // stable | beta | dev
    checkOnStart: true,

    auto: {
      enabled: false,
      stableDelayHours: 6,
      stableJitterHours: 12,
      betaCheckIntervalHours: 1,
    },
  },
}
```

- `channel`: release channel สำหรับการติดตั้งแบบ npm/git — `"stable"`, `"beta"` หรือ `"dev"`
- `checkOnStart`: ตรวจสอบการอัปเดตของ npm เมื่อตอน gateway เริ่มทำงาน (ค่าปริยาย: `true`)
- `auto.enabled`: เปิดใช้งานการอัปเดตอัตโนมัติในเบื้องหลังสำหรับการติดตั้งแบบแพ็กเกจ (ค่าปริยาย: `false`)
- `auto.stableDelayHours`: ระยะหน่วงขั้นต่ำเป็นชั่วโมงก่อน auto-apply บน stable channel (ค่าปริยาย: `6`; สูงสุด: `168`)
- `auto.stableJitterHours`: หน้าต่างกระจาย rollout เพิ่มเติมสำหรับ stable channel เป็นชั่วโมง (ค่าปริยาย: `12`; สูงสุด: `168`)
- `auto.betaCheckIntervalHours`: ความถี่ในการตรวจสอบสำหรับ beta channel เป็นชั่วโมง (ค่าปริยาย: `1`; สูงสุด: `24`)

---

## ACP

```json5
{
  acp: {
    enabled: false,
    dispatch: { enabled: true },
    backend: "acpx",
    defaultAgent: "main",
    allowedAgents: ["main", "ops"],
    maxConcurrentSessions: 10,

    stream: {
      coalesceIdleMs: 50,
      maxChunkChars: 1000,
      repeatSuppression: true,
      deliveryMode: "live", // live | final_only
      hiddenBoundarySeparator: "paragraph", // none | space | newline | paragraph
      maxOutputChars: 50000,
      maxSessionUpdateChars: 500,
    },

    runtime: {
      ttlMinutes: 30,
    },
  },
}
```

- `enabled`: เกตฟีเจอร์หลักของ ACP ทั่วทั้งระบบ (ค่าปริยาย: `false`)
- `dispatch.enabled`: เกตแยกต่างหากสำหรับการ dispatch เทิร์นของ ACP session (ค่าปริยาย: `true`) ตั้งเป็น `false` เพื่อให้คำสั่ง ACP ยังใช้งานได้แต่บล็อกการทำงานจริง
- `backend`: id ของ ACP runtime backend ค่าปริยาย (ต้องตรงกับ ACP runtime plugin ที่ลงทะเบียนไว้)
- `defaultAgent`: id ของเอเจนต์เป้าหมายแบบ fallback สำหรับ ACP เมื่อการ spawn ไม่ได้ระบุเป้าหมายอย่างชัดเจน
- `allowedAgents`: allowlist ของ id เอเจนต์ที่อนุญาตสำหรับ ACP runtime session; หากว่างหมายถึงไม่มีข้อจำกัดเพิ่มเติม
- `maxConcurrentSessions`: จำนวน ACP session ที่ active พร้อมกันได้สูงสุด
- `stream.coalesceIdleMs`: หน้าต่าง idle flush เป็นมิลลิวินาทีสำหรับข้อความที่สตรีม
- `stream.maxChunkChars`: ขนาดชังก์สูงสุดก่อนแบ่งการฉายบล็อกที่สตรีม
- `stream.repeatSuppression`: ระงับบรรทัดสถานะ/เครื่องมือที่ซ้ำกันในแต่ละเทิร์น (ค่าปริยาย: `true`)
- `stream.deliveryMode`: `"live"` สตรีมแบบค่อยเป็นค่อยไป; `"final_only"` บัฟเฟอร์ไว้จนถึงเหตุการณ์ terminal ของเทิร์น
- `stream.hiddenBoundarySeparator`: ตัวคั่นก่อนข้อความที่มองเห็นได้หลังเหตุการณ์เครื่องมือที่ซ่อนอยู่ (ค่าปริยาย: `"paragraph"`)
- `stream.maxOutputChars`: จำนวนอักขระเอาต์พุตของ assistant สูงสุดที่ฉายต่อหนึ่ง ACP turn
- `stream.maxSessionUpdateChars`: จำนวนอักขระสูงสุดสำหรับบรรทัดสถานะ/อัปเดต ACP ที่ฉายออกมา
- `stream.tagVisibility`: ระเบียนของชื่อแท็กไปยังค่า boolean สำหรับ override การมองเห็นของเหตุการณ์ที่สตรีม
- `runtime.ttlMinutes`: idle TTL เป็นนาทีสำหรับ ACP session worker ก่อนจะมีสิทธิ์ถูกล้าง
- `runtime.installCommand`: คำสั่งติดตั้งแบบไม่บังคับที่จะรันเมื่อ bootstrap สภาพแวดล้อมของ ACP runtime

---

## CLI

```json5
{
  cli: {
    banner: {
      taglineMode: "off", // random | default | off
    },
  },
}
```

- `cli.banner.taglineMode` ควบคุมสไตล์ tagline ของแบนเนอร์:
  - `"random"` (ค่าปริยาย): tagline แบบหมุนเวียน แนวตลก/ตามฤดูกาล
  - `"default"`: tagline แบบกลาง ๆ คงที่ (`All your chats, one OpenClaw.`)
  - `"off"`: ไม่มีข้อความ tagline (ยังคงแสดงชื่อแบนเนอร์/เวอร์ชัน)
- หากต้องการซ่อนทั้งแบนเนอร์ (ไม่ใช่แค่ tagline) ให้ตั้ง env `OPENCLAW_HIDE_BANNER=1`

---

## Wizard

metadata ที่เขียนโดย flow การตั้งค่าแบบมีตัวช่วยของ CLI (`onboard`, `configure`, `doctor`):

```json5
{
  wizard: {
    lastRunAt: "2026-01-01T00:00:00.000Z",
    lastRunVersion: "2026.1.4",
    lastRunCommit: "abc1234",
    lastRunCommand: "configure",
    lastRunMode: "local",
  },
}
```

---

## Identity

ดูฟิลด์ identity ใน `agents.list` ภายใต้ [ค่าเริ่มต้นของเอเจนต์](/th/gateway/config-agents#agent-defaults)

---

## Bridge (legacy, ถูกลบแล้ว)

บิลด์ปัจจุบันไม่มี TCP bridge อีกต่อไปแล้ว Node จะเชื่อมต่อผ่าน Gateway WebSocket คีย์ `bridge.*` ไม่ได้เป็นส่วนหนึ่งของ config schema อีกต่อไป (validation จะล้มเหลวจนกว่าจะลบออก; `openclaw doctor --fix` สามารถลบคีย์ที่ไม่รู้จักออกได้)

<Accordion title="คอนฟิก bridge แบบ legacy (ข้อมูลอ้างอิงเชิงประวัติ)">

```json
{
  "bridge": {
    "enabled": true,
    "port": 18790,
    "bind": "tailnet",
    "tls": {
      "enabled": true,
      "autoGenerate": true
    }
  }
}
```

</Accordion>

---

## Cron

```json5
{
  cron: {
    enabled: true,
    maxConcurrentRuns: 2,
    webhook: "https://example.invalid/legacy", // deprecated fallback for stored notify:true jobs
    webhookToken: "replace-with-dedicated-token", // optional bearer token for outbound webhook auth
    sessionRetention: "24h", // duration string or false
    runLog: {
      maxBytes: "2mb", // default 2_000_000 bytes
      keepLines: 2000, // default 2000
    },
  },
}
```

- `sessionRetention`: ระยะเวลาที่จะเก็บเซสชันของการรัน cron แบบ isolated ที่เสร็จแล้วไว้ก่อนจะตัดออกจาก `sessions.json` ค่านี้ยังควบคุมการล้างทรานสคริปต์ cron ที่ถูกลบซึ่งถูกเก็บถาวรไว้ด้วย ค่าปริยาย: `24h`; ตั้งเป็น `false` เพื่อปิดใช้งาน
- `runLog.maxBytes`: ขนาดสูงสุดต่อไฟล์ run log (`cron/runs/<jobId>.jsonl`) ก่อนตัดแต่ง ค่าปริยาย: `2_000_000` ไบต์
- `runLog.keepLines`: จำนวนบรรทัดล่าสุดที่จะเก็บไว้เมื่อมีการตัดแต่ง run-log ค่าปริยาย: `2000`
- `webhookToken`: bearer token ที่ใช้สำหรับการส่ง cron webhook POST (`delivery.mode = "webhook"`), หากไม่ระบุจะไม่ส่ง auth header
- `webhook`: URL ของ fallback webhook แบบ legacy ที่เลิกใช้แล้ว (http/https) ใช้เฉพาะกับงานที่จัดเก็บไว้ซึ่งยังมี `notify: true`

### `cron.retry`

```json5
{
  cron: {
    retry: {
      maxAttempts: 3,
      backoffMs: [30000, 60000, 300000],
      retryOn: ["rate_limit", "overloaded", "network", "timeout", "server_error"],
    },
  },
}
```

- `maxAttempts`: จำนวน retry สูงสุดสำหรับงานครั้งเดียวเมื่อเกิดข้อผิดพลาดชั่วคราว (ค่าปริยาย: `3`; ช่วง: `0`–`10`)
- `backoffMs`: อาร์เรย์ของระยะหน่วง backoff ในหน่วยมิลลิวินาทีสำหรับแต่ละความพยายาม retry (ค่าปริยาย: `[30000, 60000, 300000]`; ได้ 1–10 รายการ)
- `retryOn`: ประเภทข้อผิดพลาดที่ทริกเกอร์การ retry — `"rate_limit"`, `"overloaded"`, `"network"`, `"timeout"`, `"server_error"` หากไม่ระบุจะ retry ทุกประเภทที่เป็นชั่วคราว

มีผลเฉพาะกับงาน cron แบบครั้งเดียวเท่านั้น งานแบบวนซ้ำใช้การจัดการความล้มเหลวแยกต่างหาก

### `cron.failureAlert`

```json5
{
  cron: {
    failureAlert: {
      enabled: false,
      after: 3,
      cooldownMs: 3600000,
      mode: "announce",
      accountId: "main",
    },
  },
}
```

- `enabled`: เปิดใช้การแจ้งเตือนความล้มเหลวสำหรับงาน cron (ค่าปริยาย: `false`)
- `after`: จำนวนครั้งที่ล้มเหลวต่อเนื่องก่อนจะส่งการแจ้งเตือน (จำนวนเต็มบวก, ขั้นต่ำ: `1`)
- `cooldownMs`: จำนวนมิลลิวินาทีขั้นต่ำระหว่างการแจ้งเตือนซ้ำสำหรับงานเดียวกัน (จำนวนเต็มไม่ติดลบ)
- `mode`: โหมดการส่ง — `"announce"` ส่งผ่านข้อความในช่องทาง; `"webhook"` ส่ง POST ไปยัง webhook ที่กำหนดค่าไว้
- `accountId`: ID ของบัญชีหรือช่องทางแบบไม่บังคับเพื่อกำหนดขอบเขตการส่งการแจ้งเตือน

### `cron.failureDestination`

```json5
{
  cron: {
    failureDestination: {
      mode: "announce",
      channel: "last",
      to: "channel:C1234567890",
      accountId: "main",
    },
  },
}
```

- ปลายทางค่าปริยายสำหรับการแจ้งเตือนความล้มเหลวของ cron ในทุกงาน
- `mode`: `"announce"` หรือ `"webhook"`; ค่าปริยายเป็น `"announce"` เมื่อมีข้อมูลเป้าหมายเพียงพอ
- `channel`: override ช่องทางสำหรับการส่งแบบ announce `"last"` จะนำช่องทางการส่งล่าสุดที่รู้จักมาใช้ซ้ำ
- `to`: เป้าหมาย announce แบบ explicit หรือ URL ของ webhook จำเป็นสำหรับโหมด webhook
- `accountId`: override บัญชีสำหรับการส่งแบบไม่บังคับ
- `delivery.failureDestination` ระดับงานจะ override ค่าเริ่มต้นส่วนกลางนี้
- เมื่อไม่ได้ตั้งค่าปลายทางความล้มเหลวทั้งแบบส่วนกลางและแบบรายงาน งานที่ส่งผ่าน `announce` อยู่แล้วจะ fallback ไปยังเป้าหมาย announce หลักนั้นเมื่อเกิดความล้มเหลว
- `delivery.failureDestination` รองรับเฉพาะงาน `sessionTarget="isolated"` เว้นแต่ว่า `delivery.mode` หลักของงานจะเป็น `"webhook"`

ดู [งาน Cron](/th/automation/cron-jobs) การรัน cron แบบ isolated จะถูกติดตามในฐานะ [งานเบื้องหลัง](/th/automation/tasks)

---

## ตัวแปรเทมเพลตของโมเดลสื่อ

placeholder ของเทมเพลตที่ขยายใน `tools.media.models[].args`:

| ตัวแปร             | คำอธิบาย                                        |
| ------------------ | ------------------------------------------------ |
| `{{Body}}`         | เนื้อหาข้อความขาเข้าแบบเต็ม                     |
| `{{RawBody}}`      | เนื้อหาดิบ (ไม่มี wrapper ของประวัติ/ผู้ส่ง)    |
| `{{BodyStripped}}` | เนื้อหาที่ตัด group mention ออกแล้ว             |
| `{{From}}`         | ตัวระบุผู้ส่ง                                     |
| `{{To}}`           | ตัวระบุปลายทาง                                   |
| `{{MessageSid}}`   | ID ข้อความของช่องทาง                            |
| `{{SessionId}}`    | UUID ของเซสชันปัจจุบัน                          |
| `{{IsNewSession}}` | `"true"` เมื่อมีการสร้างเซสชันใหม่              |
| `{{MediaUrl}}`     | pseudo-URL ของสื่อขาเข้า                        |
| `{{MediaPath}}`    | พาธสื่อในเครื่อง                                 |
| `{{MediaType}}`    | ประเภทสื่อ (image/audio/document/…)             |
| `{{Transcript}}`   | ทรานสคริปต์ของเสียง                              |
| `{{Prompt}}`       | media prompt ที่ resolve แล้วสำหรับรายการ CLI    |
| `{{MaxChars}}`     | จำนวนอักขระเอาต์พุตสูงสุดที่ resolve แล้วสำหรับรายการ CLI |
| `{{ChatType}}`     | `"direct"` หรือ `"group"`                        |
| `{{GroupSubject}}` | หัวข้อกลุ่ม (best effort)                        |
| `{{GroupMembers}}` | ตัวอย่างสมาชิกกลุ่ม (best effort)               |
| `{{SenderName}}`   | ชื่อแสดงผลของผู้ส่ง (best effort)               |
| `{{SenderE164}}`   | หมายเลขโทรศัพท์ของผู้ส่ง (best effort)          |
| `{{Provider}}`     | คำใบ้ของ provider (whatsapp, telegram, discord ฯลฯ) |

---

## Config include (`$include`)

แยกคอนฟิกออกเป็นหลายไฟล์:

```json5
// ~/.openclaw/openclaw.json
{
  gateway: { port: 18789 },
  agents: { $include: "./agents.json5" },
  broadcast: {
    $include: ["./clients/mueller.json5", "./clients/schmidt.json5"],
  },
}
```

**พฤติกรรมการ merge:**

- ไฟล์เดี่ยว: แทนที่ออบเจ็กต์ที่ครอบอยู่ทั้งหมด
- อาร์เรย์ของไฟล์: deep-merge ตามลำดับ (ไฟล์หลัง override ไฟล์ก่อน)
- คีย์ข้างเคียง: merge หลัง include (override ค่าที่ถูก include มา)
- include แบบซ้อน: ลึกได้สูงสุด 10 ระดับ
- พาธ: resolve แบบอิงจากไฟล์ที่ include อยู่ แต่ต้องยังคงอยู่ภายในไดเรกทอรีคอนฟิกระดับบนสุด (`dirname` ของ `openclaw.json`) รูปแบบ absolute/`../` ใช้ได้ก็ต่อเมื่อสุดท้ายแล้วยัง resolve อยู่ภายในขอบเขตนั้น
- การเขียนที่เป็นของ OpenClaw ซึ่งเปลี่ยนเฉพาะ top-level section เดียวที่รองรับด้วย include แบบไฟล์เดี่ยว จะเขียนทะลุไปยังไฟล์ที่ include นั้น ตัวอย่างเช่น `plugins install` จะอัปเดต `plugins: { $include: "./plugins.json5" }` ใน `plugins.json5` และปล่อย `openclaw.json` ไว้ตามเดิม
- root include, include array และ include ที่มี sibling override จะเป็นแบบอ่านอย่างเดียวสำหรับการเขียนที่เป็นของ OpenClaw; การเขียนเหล่านั้นจะ fail closed แทนที่จะ flatten คอนฟิก
- ข้อผิดพลาด: มีข้อความชัดเจนสำหรับกรณีไฟล์หาย parse error และ circular include

---

_ที่เกี่ยวข้อง: [Configuration](/th/gateway/configuration) · [ตัวอย่าง Configuration](/th/gateway/configuration-examples) · [Doctor](/th/gateway/doctor)_

## ที่เกี่ยวข้อง

- [Configuration](/th/gateway/configuration)
- [ตัวอย่าง Configuration](/th/gateway/configuration-examples)
