---
read_when:
    - คุณต้องการพฤติกรรมแบบละเอียดของ `openclaw onboard`
    - คุณกำลังดีบักผลลัพธ์ของ onboarding หรือกำลังเชื่อมไคลเอนต์เข้ากับ onboarding
sidebarTitle: CLI reference
summary: เอกสารอ้างอิงแบบครบถ้วนสำหรับโฟลว์การตั้งค่าผ่าน CLI, การตั้งค่า auth/โมเดล, เอาต์พุต และกลไกภายใน
title: เอกสารอ้างอิงการตั้งค่าผ่าน CLI
x-i18n:
    generated_at: "2026-04-23T05:58:11Z"
    model: gpt-5.4
    provider: openai
    source_hash: 60b47a3cd7eaa6e10b5e7108ba4eb331afddffa55a321eac98243611fd7e721b
    source_path: start/wizard-cli-reference.md
    workflow: 15
---

# เอกสารอ้างอิงการตั้งค่าผ่าน CLI

หน้านี้คือเอกสารอ้างอิงแบบเต็มสำหรับ `openclaw onboard`
สำหรับคู่มือแบบย่อ โปรดดู [Onboarding (CLI)](/th/start/wizard)

## Wizard ทำอะไรบ้าง

โหมด local (ค่าเริ่มต้น) จะพาคุณผ่าน:

- การตั้งค่าโมเดลและ auth (OpenAI Code subscription OAuth, Anthropic Claude CLI หรือ API key รวมถึงตัวเลือก MiniMax, GLM, Ollama, Moonshot, StepFun และ AI Gateway)
- ตำแหน่งของ workspace และไฟล์ bootstrap
- การตั้งค่า Gateway (port, bind, auth, tailscale)
- Channels และ providers (Telegram, WhatsApp, Discord, Google Chat, Mattermost, Signal, BlueBubbles และ bundled channel plugins อื่นๆ)
- การติดตั้ง daemon (LaunchAgent, systemd user unit หรือ native Windows Scheduled Task พร้อม Startup-folder fallback)
- Health check
- การตั้งค่า Skills

โหมด remote ใช้ตั้งค่าเครื่องนี้ให้เชื่อมต่อกับ gateway ที่อยู่ที่อื่น
โดยมันจะไม่ติดตั้งหรือแก้ไขอะไรบนโฮสต์ปลายทาง

## รายละเอียดของ local flow

<Steps>
  <Step title="การตรวจจับ config ที่มีอยู่">
    - หากมี `~/.openclaw/openclaw.json` อยู่แล้ว ให้เลือก Keep, Modify หรือ Reset
    - การรัน wizard ซ้ำจะไม่ลบอะไร เว้นแต่คุณจะเลือก Reset อย่างชัดเจน (หรือส่ง `--reset`)
    - ค่าเริ่มต้นของ CLI `--reset` คือ `config+creds+sessions`; ใช้ `--reset-scope full` หากต้องการลบ workspace ด้วย
    - หาก config ไม่ถูกต้องหรือมี legacy keys wizard จะหยุดและขอให้คุณรัน `openclaw doctor` ก่อนดำเนินการต่อ
    - Reset ใช้ `trash` และมีขอบเขตให้เลือก:
      - Config อย่างเดียว
      - Config + credentials + sessions
      - Full reset (ลบ workspace ด้วย)
  </Step>
  <Step title="โมเดลและ auth">
    - เมทริกซ์ตัวเลือกแบบเต็มอยู่ใน [ตัวเลือก auth และโมเดล](#auth-and-model-options)
  </Step>
  <Step title="Workspace">
    - ค่าเริ่มต้น `~/.openclaw/workspace` (ตั้งค่าได้)
    - สร้างไฟล์ workspace ที่จำเป็นสำหรับพิธี bootstrap ครั้งแรก
    - โครงสร้าง workspace: [Agent workspace](/th/concepts/agent-workspace)
  </Step>
  <Step title="Gateway">
    - จะถามเรื่อง port, bind, auth mode และการเปิดเผยผ่าน tailscale
    - คำแนะนำ: คง token auth ไว้แม้สำหรับ loopback เพื่อให้ local WS clients ต้องยืนยันตัวตน
    - ในโหมด token การตั้งค่าแบบโต้ตอบมีตัวเลือก:
      - **Generate/store plaintext token** (ค่าเริ่มต้น)
      - **Use SecretRef** (ต้อง opt-in)
    - ในโหมด password การตั้งค่าแบบโต้ตอบก็รองรับทั้งการเก็บแบบ plaintext หรือ SecretRef
    - เส้นทาง SecretRef แบบ token ในโหมดไม่โต้ตอบ: `--gateway-token-ref-env <ENV_VAR>`
      - ต้องมี env var ที่ไม่ว่างในสภาพแวดล้อมของโปรเซส onboarding
      - ใช้ร่วมกับ `--gateway-token` ไม่ได้
    - ปิด auth เฉพาะเมื่อคุณเชื่อถือทุกโปรเซสในเครื่องอย่างสมบูรณ์
    - การ bind แบบ non-loopback ยังคงต้องใช้ auth
  </Step>
  <Step title="Channels">
    - [WhatsApp](/th/channels/whatsapp): QR login แบบไม่บังคับ
    - [Telegram](/th/channels/telegram): bot token
    - [Discord](/th/channels/discord): bot token
    - [Google Chat](/th/channels/googlechat): service account JSON + webhook audience
    - [Mattermost](/th/channels/mattermost): bot token + base URL
    - [Signal](/th/channels/signal): การติดตั้ง `signal-cli` แบบไม่บังคับ + การตั้งค่าบัญชี
    - [BlueBubbles](/th/channels/bluebubbles): แนะนำสำหรับ iMessage; server URL + password + webhook
    - [iMessage](/th/channels/imessage): พาธของ CLI `imsg` แบบเดิม + การเข้าถึง DB
    - ความปลอดภัยของ DM: ค่าเริ่มต้นคือ pairing โดย DM แรกจะส่งโค้ด; อนุมัติผ่าน
      `openclaw pairing approve <channel> <code>` หรือใช้ allowlists
  </Step>
  <Step title="การติดตั้ง daemon">
    - macOS: LaunchAgent
      - ต้องมี user session ที่ล็อกอินอยู่; หากเป็น headless ให้ใช้ custom LaunchDaemon (ไม่มีมาให้)
    - Linux และ Windows ผ่าน WSL2: systemd user unit
      - wizard จะพยายามรัน `loginctl enable-linger <user>` เพื่อให้ gateway ทำงานต่อหลัง logout
      - อาจถาม sudo (เขียนไปที่ `/var/lib/systemd/linger`); โดยจะลองแบบไม่ใช้ sudo ก่อน
    - Native Windows: ใช้ Scheduled Task ก่อน
      - หากถูกปฏิเสธการสร้าง task, OpenClaw จะ fallback ไปยัง Startup-folder login item แบบต่อผู้ใช้ และเริ่ม gateway ทันที
      - ยังคงแนะนำ Scheduled Tasks เพราะให้สถานะ supervisor ที่ดีกว่า
    - การเลือก runtime: Node (แนะนำ; จำเป็นสำหรับ WhatsApp และ Telegram) ไม่แนะนำ Bun
  </Step>
  <Step title="Health check">
    - เริ่ม gateway (หากจำเป็น) และรัน `openclaw health`
    - `openclaw status --deep` จะเพิ่ม live gateway health probe ลงในผลลัพธ์ของ status รวมถึง channel probes เมื่อรองรับ
  </Step>
  <Step title="Skills">
    - อ่าน Skills ที่มีอยู่และตรวจสอบข้อกำหนด
    - ให้คุณเลือก node manager: npm, pnpm หรือ bun
    - ติดตั้ง dependencies แบบไม่บังคับ (บางตัวใช้ Homebrew บน macOS)
  </Step>
  <Step title="เสร็จสิ้น">
    - สรุปผลและขั้นตอนถัดไป รวมถึงตัวเลือกสำหรับแอป iOS, Android และ macOS
  </Step>
</Steps>

<Note>
หากไม่พบ GUI wizard จะพิมพ์คำสั่ง SSH port-forward สำหรับ Control UI แทนการเปิดเบราว์เซอร์
หากไฟล์ assets ของ Control UI หายไป wizard จะพยายาม build ให้; fallback คือ `pnpm ui:build` (พร้อมติดตั้ง UI deps อัตโนมัติ)
</Note>

## รายละเอียดของโหมด remote

โหมด remote ใช้ตั้งค่าเครื่องนี้ให้เชื่อมต่อกับ gateway ที่อยู่ที่อื่น

<Info>
โหมด remote จะไม่ติดตั้งหรือแก้ไขอะไรบนโฮสต์ปลายทาง
</Info>

สิ่งที่คุณตั้งค่า:

- URL ของ remote gateway (`ws://...`)
- token หาก remote gateway ต้องใช้ auth (แนะนำ)

<Note>
- หาก gateway เปิดรับเฉพาะ loopback ให้ใช้ SSH tunneling หรือ tailnet
- คำใบ้ด้าน discovery:
  - macOS: Bonjour (`dns-sd`)
  - Linux: Avahi (`avahi-browse`)
</Note>

## ตัวเลือก auth และโมเดล

<AccordionGroup>
  <Accordion title="Anthropic API key">
    ใช้ `ANTHROPIC_API_KEY` หากมีอยู่ หรือถามคีย์จากคุณ จากนั้นบันทึกไว้สำหรับการใช้แบบ daemon
  </Accordion>
  <Accordion title="OpenAI Code subscription (OAuth)">
    โฟลว์ผ่านเบราว์เซอร์; วาง `code#state`

    จะตั้ง `agents.defaults.model` เป็น `openai-codex/gpt-5.4` เมื่อยังไม่ได้ตั้งโมเดล หรือเมื่อเป็น `openai/*`

  </Accordion>
  <Accordion title="OpenAI Code subscription (device pairing)">
    โฟลว์จับคู่ผ่านเบราว์เซอร์ด้วย device code อายุสั้น

    จะตั้ง `agents.defaults.model` เป็น `openai-codex/gpt-5.4` เมื่อยังไม่ได้ตั้งโมเดล หรือเมื่อเป็น `openai/*`

  </Accordion>
  <Accordion title="OpenAI API key">
    ใช้ `OPENAI_API_KEY` หากมีอยู่ หรือถามคีย์จากคุณ จากนั้นเก็บ credential ไว้ใน auth profiles

    จะตั้ง `agents.defaults.model` เป็น `openai/gpt-5.4` เมื่อยังไม่ได้ตั้งค่า เมื่อเป็น `openai/*` หรือ `openai-codex/*`

  </Accordion>
  <Accordion title="xAI (Grok) API key">
    จะถาม `XAI_API_KEY` และตั้งค่า xAI เป็น model provider
  </Accordion>
  <Accordion title="OpenCode">
    จะถาม `OPENCODE_API_KEY` (หรือ `OPENCODE_ZEN_API_KEY`) และให้คุณเลือก Zen หรือ Go catalog
    URL สำหรับการตั้งค่า: [opencode.ai/auth](https://opencode.ai/auth)
  </Accordion>
  <Accordion title="API key (generic)">
    เก็บคีย์ให้คุณ
  </Accordion>
  <Accordion title="Vercel AI Gateway">
    จะถาม `AI_GATEWAY_API_KEY`
    รายละเอียดเพิ่มเติม: [Vercel AI Gateway](/th/providers/vercel-ai-gateway)
  </Accordion>
  <Accordion title="Cloudflare AI Gateway">
    จะถาม account ID, gateway ID และ `CLOUDFLARE_AI_GATEWAY_API_KEY`
    รายละเอียดเพิ่มเติม: [Cloudflare AI Gateway](/th/providers/cloudflare-ai-gateway)
  </Accordion>
  <Accordion title="MiniMax">
    ระบบจะเขียน config ให้อัตโนมัติ ค่าเริ่มต้นแบบ hosted คือ `MiniMax-M2.7`; การตั้งค่าด้วย API key ใช้
    `minimax/...` และการตั้งค่าด้วย OAuth ใช้ `minimax-portal/...`
    รายละเอียดเพิ่มเติม: [MiniMax](/th/providers/minimax)
  </Accordion>
  <Accordion title="StepFun">
    ระบบจะเขียน config ให้อัตโนมัติสำหรับ StepFun standard หรือ Step Plan บน China หรือ global endpoints
    ปัจจุบัน Standard มี `step-3.5-flash` และ Step Plan มี `step-3.5-flash-2603` ด้วย
    รายละเอียดเพิ่มเติม: [StepFun](/th/providers/stepfun)
  </Accordion>
  <Accordion title="Synthetic (Anthropic-compatible)">
    จะถาม `SYNTHETIC_API_KEY`
    รายละเอียดเพิ่มเติม: [Synthetic](/th/providers/synthetic)
  </Accordion>
  <Accordion title="Ollama (Cloud และ local open models)">
    จะถามก่อนว่าเป็น `Cloud + Local`, `Cloud only` หรือ `Local only`
    `Cloud only` ใช้ `OLLAMA_API_KEY` กับ `https://ollama.com`
    โหมดที่อิงกับ host จะถาม base URL (ค่าเริ่มต้น `http://127.0.0.1:11434`), ค้นหาโมเดลที่พร้อมใช้ และแนะนำค่าเริ่มต้น
    `Cloud + Local` จะตรวจสอบด้วยว่า Ollama host นั้นได้ลงชื่อเข้าใช้เพื่อเข้าถึง cloud แล้วหรือยัง
    รายละเอียดเพิ่มเติม: [Ollama](/th/providers/ollama)
  </Accordion>
  <Accordion title="Moonshot และ Kimi Coding">
    ระบบจะเขียน config สำหรับ Moonshot (Kimi K2) และ Kimi Coding ให้อัตโนมัติ
    รายละเอียดเพิ่มเติม: [Moonshot AI (Kimi + Kimi Coding)](/th/providers/moonshot)
  </Accordion>
  <Accordion title="Custom provider">
    ใช้งานได้กับ endpoints แบบ OpenAI-compatible และ Anthropic-compatible

    onboarding แบบโต้ตอบรองรับตัวเลือกการเก็บ API key แบบเดียวกับโฟลว์ API key ของ provider อื่น:
    - **Paste API key now** (plaintext)
    - **Use secret reference** (env ref หรือ configured provider ref พร้อม preflight validation)

    แฟล็กสำหรับโหมดไม่โต้ตอบ:
    - `--auth-choice custom-api-key`
    - `--custom-base-url`
    - `--custom-model-id`
    - `--custom-api-key` (ไม่บังคับ; fallback ไปใช้ `CUSTOM_API_KEY`)
    - `--custom-provider-id` (ไม่บังคับ)
    - `--custom-compatibility <openai|anthropic>` (ไม่บังคับ; ค่าเริ่มต้น `openai`)

  </Accordion>
  <Accordion title="Skip">
    ปล่อย auth ไว้โดยยังไม่ตั้งค่า
  </Accordion>
</AccordionGroup>

พฤติกรรมของโมเดล:

- เลือกโมเดลเริ่มต้นจากตัวเลือกที่ตรวจพบ หรือกรอก provider และ model ด้วยตนเอง
- เมื่อ onboarding เริ่มจาก provider auth choice ตัวเลือกโมเดลจะให้ความสำคัญกับ
  provider นั้นโดยอัตโนมัติ สำหรับ Volcengine และ BytePlus การให้ความสำคัญแบบเดียวกันนี้
  ยังจับคู่กับ coding-plan variants ของพวกมันด้วย (`volcengine-plan/*`,
  `byteplus-plan/*`)
- หากตัวกรอง preferred-provider นั้นให้ผลลัพธ์ว่าง ตัวเลือกจะ fallback กลับไปใช้
  แค็ตตาล็อกเต็ม แทนการแสดงว่าไม่มีโมเดล
- wizard จะรัน model check และเตือนหากโมเดลที่ตั้งค่าไว้ไม่รู้จักหรือไม่มี auth

พาธของ credential และ profile:

- Auth profiles (API keys + OAuth): `~/.openclaw/agents/<agentId>/agent/auth-profiles.json`
- Legacy OAuth import: `~/.openclaw/credentials/oauth.json`

โหมดการเก็บ credential:

- พฤติกรรมเริ่มต้นของ onboarding จะเก็บ API keys เป็นค่า plaintext ใน auth profiles
- `--secret-input-mode ref` เปิดโหมดอ้างอิงแทนการเก็บคีย์แบบ plaintext
  ในการตั้งค่าแบบโต้ตอบ คุณสามารถเลือกได้ทั้ง:
  - environment variable ref (ตัวอย่างเช่น `keyRef: { source: "env", provider: "default", id: "OPENAI_API_KEY" }`)
  - configured provider ref (`file` หรือ `exec`) พร้อม provider alias + id
- โหมดอ้างอิงแบบโต้ตอบจะรัน preflight validation แบบเร็วก่อนบันทึก
  - Env refs: ตรวจสอบชื่อตัวแปร + ค่าที่ไม่ว่างใน environment ปัจจุบันของ onboarding
  - Provider refs: ตรวจสอบ provider config และ resolve id ที่ร้องขอ
  - หาก preflight ล้มเหลว onboarding จะแสดงข้อผิดพลาดและให้คุณลองใหม่
- ในโหมดไม่โต้ตอบ `--secret-input-mode ref` รองรับเฉพาะแบบ env-backed
  - ตั้ง provider env var ไว้ใน environment ของโปรเซส onboarding
  - inline key flags (ตัวอย่างเช่น `--openai-api-key`) ต้องมี env var นั้นอยู่; ไม่เช่นนั้น onboarding จะล้มเหลวทันที
  - สำหรับ custom providers โหมด `ref` แบบไม่โต้ตอบจะเก็บ `models.providers.<id>.apiKey` เป็น `{ source: "env", provider: "default", id: "CUSTOM_API_KEY" }`
  - ในกรณี custom-provider นั้น `--custom-api-key` ต้องมี `CUSTOM_API_KEY` ถูกตั้งไว้; ไม่เช่นนั้น onboarding จะล้มเหลวทันที
- Gateway auth credentials รองรับตัวเลือกแบบ plaintext และ SecretRef ในการตั้งค่าแบบโต้ตอบ:
  - โหมด token: **Generate/store plaintext token** (ค่าเริ่มต้น) หรือ **Use SecretRef**
  - โหมด password: plaintext หรือ SecretRef
- เส้นทาง token SecretRef แบบไม่โต้ตอบ: `--gateway-token-ref-env <ENV_VAR>`
- การตั้งค่าแบบ plaintext ที่มีอยู่เดิมยังคงใช้งานได้ตามเดิม

<Note>
เคล็ดลับสำหรับ headless และเซิร์ฟเวอร์: ทำ OAuth ให้เสร็จบนเครื่องที่มีเบราว์เซอร์ จากนั้นคัดลอก `auth-profiles.json` ของเอเจนต์นั้น (ตัวอย่างเช่น
`~/.openclaw/agents/<agentId>/agent/auth-profiles.json` หรือพาธที่ตรงกันภายใต้
`$OPENCLAW_STATE_DIR/...`) ไปยังโฮสต์ gateway โดย `credentials/oauth.json`
เป็นเพียงแหล่งนำเข้าแบบเดิมเท่านั้น
</Note>

## เอาต์พุตและกลไกภายใน

ฟิลด์ที่พบบ่อยใน `~/.openclaw/openclaw.json`:

- `agents.defaults.workspace`
- `agents.defaults.model` / `models.providers` (หากเลือก Minimax)
- `tools.profile` (local onboarding จะตั้งค่าเริ่มต้นเป็น `"coding"` เมื่อยังไม่ได้ตั้งไว้; ค่าที่ระบุไว้อย่างชัดเจนเดิมจะถูกคงไว้)
- `gateway.*` (mode, bind, auth, tailscale)
- `session.dmScope` (local onboarding จะตั้งค่าเริ่มต้นเป็น `per-channel-peer` เมื่อยังไม่ได้ตั้งไว้; ค่าที่ระบุไว้อย่างชัดเจนเดิมจะถูกคงไว้)
- `channels.telegram.botToken`, `channels.discord.token`, `channels.matrix.*`, `channels.signal.*`, `channels.imessage.*`
- allowlists ของช่องทาง (Slack, Discord, Matrix, Microsoft Teams) เมื่อคุณเลือกใช้ระหว่าง prompts (ชื่อจะถูก resolve เป็น IDs เมื่อทำได้)
- `skills.install.nodeManager`
  - แฟล็ก `setup --node-manager` รองรับ `npm`, `pnpm` หรือ `bun`
  - config แบบ manual ยังสามารถตั้ง `skills.install.nodeManager: "yarn"` ได้ในภายหลัง
- `wizard.lastRunAt`
- `wizard.lastRunVersion`
- `wizard.lastRunCommit`
- `wizard.lastRunCommand`
- `wizard.lastRunMode`

`openclaw agents add` จะเขียน `agents.list[]` และ `bindings` แบบไม่บังคับ

credentials ของ WhatsApp จะอยู่ภายใต้ `~/.openclaw/credentials/whatsapp/<accountId>/`
ส่วน sessions จะถูกเก็บไว้ภายใต้ `~/.openclaw/agents/<agentId>/sessions/`

<Note>
บางช่องทางถูกจัดส่งมาในรูปแบบ Plugins เมื่อถูกเลือกในระหว่างการตั้งค่า wizard
จะถามเพื่อติดตั้ง Plugin (npm หรือ local path) ก่อนเข้าสู่การตั้งค่าช่องทาง
</Note>

Gateway wizard RPC:

- `wizard.start`
- `wizard.next`
- `wizard.cancel`
- `wizard.status`

ไคลเอนต์ (แอป macOS และ Control UI) สามารถเรนเดอร์ขั้นตอนต่างๆ ได้โดยไม่ต้องนำตรรกะ onboarding ไปเขียนซ้ำเอง

พฤติกรรมการตั้งค่า Signal:

- ดาวน์โหลด release asset ที่เหมาะสม
- เก็บไว้ที่ `~/.openclaw/tools/signal-cli/<version>/`
- เขียน `channels.signal.cliPath` ลงใน config
- JVM builds ต้องใช้ Java 21
- จะใช้ native builds เมื่อมีให้ใช้
- บน Windows จะใช้ WSL2 และทำตามโฟลว์ signal-cli ของ Linux ภายใน WSL

## เอกสารที่เกี่ยวข้อง

- ศูนย์กลาง onboarding: [Onboarding (CLI)](/th/start/wizard)
- ระบบอัตโนมัติและสคริปต์: [CLI Automation](/th/start/wizard-cli-automation)
- เอกสารอ้างอิงคำสั่ง: [`openclaw onboard`](/cli/onboard)
