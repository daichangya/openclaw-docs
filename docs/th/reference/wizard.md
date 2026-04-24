---
read_when:
    - กำลังค้นหาขั้นตอนหรือแฟล็กเฉพาะของ onboarding
    - การทำ onboarding แบบอัตโนมัติด้วยโหมดไม่โต้ตอบ
    - การดีบักพฤติกรรมของ onboarding
sidebarTitle: Onboarding Reference
summary: 'เอกสารอ้างอิงแบบเต็มสำหรับการทำ onboarding ผ่าน CLI: ทุกขั้นตอน ทุกแฟล็ก และทุกฟิลด์ config'
title: เอกสารอ้างอิงการทำ onboarding
x-i18n:
    generated_at: "2026-04-24T09:33:07Z"
    model: gpt-5.4
    provider: openai
    source_hash: 3f191b7d8a6d47638d9d0c9acf47a286225174c580aa0db89cf0c208d47ffee5
    source_path: reference/wizard.md
    workflow: 15
---

นี่คือเอกสารอ้างอิงแบบเต็มสำหรับ `openclaw onboard`
สำหรับภาพรวมระดับสูง โปรดดู [Onboarding (CLI)](/th/start/wizard)

## รายละเอียดของโฟลว์ (โหมด local)

<Steps>
  <Step title="การตรวจพบ config ที่มีอยู่">
    - หากมี `~/.openclaw/openclaw.json` อยู่แล้ว ให้เลือก **Keep / Modify / Reset**
    - การรัน onboarding ซ้ำจะ **ไม่** ลบอะไร เว้นแต่คุณจะเลือก **Reset** อย่างชัดเจน
      (หรือส่ง `--reset`)
    - CLI `--reset` ใช้ค่าเริ่มต้นเป็น `config+creds+sessions`; ใช้ `--reset-scope full`
      หากต้องการลบ workspace ด้วย
    - หาก config ไม่ถูกต้องหรือมีคีย์แบบ legacy ตัววิซาร์ดจะหยุดและขอให้
      คุณรัน `openclaw doctor` ก่อนจึงจะดำเนินการต่อได้
    - การรีเซ็ตใช้ `trash` (ไม่ใช้ `rm`) และมีขอบเขตให้เลือก:
      - เฉพาะ Config
      - Config + credentials + sessions
      - รีเซ็ตทั้งหมด (ลบ workspace ด้วย)
  </Step>
  <Step title="Model/Auth">
    - **คีย์ API ของ Anthropic**: ใช้ `ANTHROPIC_API_KEY` หากมีอยู่ หรือจะถามหาคีย์ แล้วบันทึกไว้สำหรับใช้งานกับ daemon
    - **คีย์ API ของ Anthropic**: เป็นตัวเลือกผู้ช่วย Anthropic ที่แนะนำใน onboarding/configure
    - **setup-token ของ Anthropic**: ยังใช้งานได้ใน onboarding/configure แม้ว่า OpenClaw ตอนนี้จะเลือกใช้ Claude CLI ซ้ำเมื่อทำได้
    - **การสมัครใช้งาน OpenAI Code (Codex) (OAuth)**: โฟลว์ผ่านเบราว์เซอร์; วาง `code#state`
      - ตั้งค่า `agents.defaults.model` เป็น `openai-codex/gpt-5.5` เมื่อยังไม่ได้ตั้งโมเดล หรือเมื่อเป็นตระกูล OpenAI อยู่แล้ว
    - **การสมัครใช้งาน OpenAI Code (Codex) (device pairing)**: โฟลว์จับคู่ผ่านเบราว์เซอร์ด้วย device code แบบอายุสั้น
      - ตั้งค่า `agents.defaults.model` เป็น `openai-codex/gpt-5.5` เมื่อยังไม่ได้ตั้งโมเดล หรือเมื่อเป็นตระกูล OpenAI อยู่แล้ว
    - **คีย์ API ของ OpenAI**: ใช้ `OPENAI_API_KEY` หากมีอยู่ หรือถามหาคีย์ แล้วเก็บไว้ใน auth profiles
      - ตั้งค่า `agents.defaults.model` เป็น `openai/gpt-5.4` เมื่อโมเดลยังไม่ได้ตั้งค่า เป็น `openai/*` หรือ `openai-codex/*`
    - **คีย์ API ของ xAI (Grok)**: จะถามหา `XAI_API_KEY` และกำหนดค่า xAI เป็น model provider
    - **OpenCode**: จะถามหา `OPENCODE_API_KEY` (หรือ `OPENCODE_ZEN_API_KEY`, รับได้ที่ https://opencode.ai/auth) และให้คุณเลือกแค็ตตาล็อก Zen หรือ Go
    - **Ollama**: จะเสนอ **Cloud + Local**, **Cloud only** หรือ **Local only** ก่อน `Cloud only` จะถามหา `OLLAMA_API_KEY` และใช้ `https://ollama.com`; โหมดที่ใช้โฮสต์เป็นฐานจะถามหา base URL ของ Ollama ค้นพบโมเดลที่มี และดึงโมเดล local ที่เลือกโดยอัตโนมัติเมื่อจำเป็น; `Cloud + Local` จะตรวจสอบเพิ่มเติมว่าโฮสต์ Ollama นั้นลงชื่อเข้าใช้สำหรับ cloud access อยู่หรือไม่
    - รายละเอียดเพิ่มเติม: [Ollama](/th/providers/ollama)
    - **คีย์ API**: จะเก็บคีย์ให้คุณ
    - **Vercel AI Gateway (พร็อกซีหลายโมเดล)**: จะถามหา `AI_GATEWAY_API_KEY`
    - รายละเอียดเพิ่มเติม: [Vercel AI Gateway](/th/providers/vercel-ai-gateway)
    - **Cloudflare AI Gateway**: จะถามหา Account ID, Gateway ID และ `CLOUDFLARE_AI_GATEWAY_API_KEY`
    - รายละเอียดเพิ่มเติม: [Cloudflare AI Gateway](/th/providers/cloudflare-ai-gateway)
    - **MiniMax**: ระบบจะเขียน config ให้อัตโนมัติ; ค่าเริ่มต้นแบบโฮสต์คือ `MiniMax-M2.7`
      การตั้งค่าแบบคีย์ API ใช้ `minimax/...` และการตั้งค่าแบบ OAuth ใช้
      `minimax-portal/...`
    - รายละเอียดเพิ่มเติม: [MiniMax](/th/providers/minimax)
    - **StepFun**: ระบบจะเขียน config ให้อัตโนมัติสำหรับ StepFun standard หรือ Step Plan บน endpoints ของจีนหรือ global
    - ปัจจุบัน Standard มี `step-3.5-flash` และ Step Plan มี `step-3.5-flash-2603` เพิ่มด้วย
    - รายละเอียดเพิ่มเติม: [StepFun](/th/providers/stepfun)
    - **Synthetic (เข้ากันได้กับ Anthropic)**: จะถามหา `SYNTHETIC_API_KEY`
    - รายละเอียดเพิ่มเติม: [Synthetic](/th/providers/synthetic)
    - **Moonshot (Kimi K2)**: ระบบจะเขียน config ให้อัตโนมัติ
    - **Kimi Coding**: ระบบจะเขียน config ให้อัตโนมัติ
    - รายละเอียดเพิ่มเติม: [Moonshot AI (Kimi + Kimi Coding)](/th/providers/moonshot)
    - **Skip**: ยังไม่กำหนดค่า auth
    - เลือกโมเดลเริ่มต้นจากตัวเลือกที่ตรวจพบ (หรือป้อน provider/model เองด้วยตนเอง) เพื่อคุณภาพที่ดีที่สุดและลดความเสี่ยงจาก prompt injection ให้เลือกโมเดลรุ่นล่าสุดที่แข็งแกร่งที่สุดที่มีอยู่ในสแตก provider ของคุณ
    - Onboarding จะรันการตรวจสอบโมเดลและแสดงคำเตือนหากโมเดลที่กำหนดค่าไว้ไม่รู้จักหรือไม่มี auth
    - โหมดจัดเก็บคีย์ API ใช้ค่าเริ่มต้นเป็นค่า plaintext ใน auth-profile ใช้ `--secret-input-mode ref` เพื่อเก็บเป็น env-backed refs แทน (เช่น `keyRef: { source: "env", provider: "default", id: "OPENAI_API_KEY" }`)
    - Auth profiles อยู่ใน `~/.openclaw/agents/<agentId>/agent/auth-profiles.json` (คีย์ API + OAuth) ส่วน `~/.openclaw/credentials/oauth.json` เป็นแบบ legacy และใช้สำหรับนำเข้าเท่านั้น
    - รายละเอียดเพิ่มเติม: [/concepts/oauth](/th/concepts/oauth)
    <Note>
    เคล็ดลับสำหรับระบบ headless/server: ทำ OAuth ให้เสร็จบนเครื่องที่มีเบราว์เซอร์ จากนั้นคัดลอก `auth-profiles.json` ของ agent นั้น (เช่น
    `~/.openclaw/agents/<agentId>/agent/auth-profiles.json` หรือ path
    `$OPENCLAW_STATE_DIR/...` ที่ตรงกัน) ไปยังโฮสต์ gateway โดย `credentials/oauth.json`
    เป็นเพียงแหล่งนำเข้าแบบ legacy เท่านั้น
    </Note>
  </Step>
  <Step title="Workspace">
    - ค่าเริ่มต้นคือ `~/.openclaw/workspace` (กำหนดค่าได้)
    - จะ seed ไฟล์ใน workspace ที่จำเป็นสำหรับพิธี bootstrap ของ agent
    - ผัง workspace แบบเต็ม + คู่มือสำรองข้อมูล: [workspace ของ agent](/th/concepts/agent-workspace)
  </Step>
  <Step title="Gateway">
    - พอร์ต, bind, โหมด auth, การเปิดเผยผ่าน Tailscale
    - คำแนะนำด้าน auth: คงค่า **Token** ไว้แม้สำหรับ loopback เพื่อให้ไคลเอนต์ WS ในเครื่องต้องยืนยันตัวตน
    - ในโหมด token การตั้งค่าแบบโต้ตอบมีตัวเลือก:
      - **สร้าง/เก็บโทเค็นแบบ plaintext** (ค่าเริ่มต้น)
      - **ใช้ SecretRef** (เลือกใช้)
      - Quickstart จะใช้ SecretRefs ของ `gateway.auth.token` ที่มีอยู่ซ้ำในผู้ให้บริการ `env`, `file` และ `exec` สำหรับ onboarding probe/dashboard bootstrap
      - หากมีการกำหนด SecretRef นั้นไว้แต่ resolve ไม่ได้ onboarding จะล้มเหลวตั้งแต่ต้นพร้อมข้อความแก้ไขที่ชัดเจน แทนที่จะลดระดับ runtime auth แบบเงียบ ๆ
    - ในโหมด password การตั้งค่าแบบโต้ตอบก็รองรับการจัดเก็บแบบ plaintext หรือ SecretRef เช่นกัน
    - เส้นทาง SecretRef ของ token สำหรับโหมดไม่โต้ตอบ: `--gateway-token-ref-env <ENV_VAR>`
      - ต้องมี env var ที่ไม่ว่างในสภาพแวดล้อมของโปรเซส onboarding
      - ใช้ร่วมกับ `--gateway-token` ไม่ได้
    - ปิด auth ได้ก็ต่อเมื่อคุณเชื่อถือทุกโปรเซสในเครื่องอย่างสมบูรณ์
    - bind ที่ไม่ใช่ loopback ยังต้องใช้ auth
  </Step>
  <Step title="Channels">
    - [WhatsApp](/th/channels/whatsapp): การเข้าสู่ระบบด้วย QR แบบไม่บังคับ
    - [Telegram](/th/channels/telegram): โทเค็นบอต
    - [Discord](/th/channels/discord): โทเค็นบอต
    - [Google Chat](/th/channels/googlechat): JSON ของ service account + webhook audience
    - [Mattermost](/th/channels/mattermost) (plugin): โทเค็นบอต + base URL
    - [Signal](/th/channels/signal): การติดตั้ง `signal-cli` แบบไม่บังคับ + config บัญชี
    - [BlueBubbles](/th/channels/bluebubbles): **แนะนำสำหรับ iMessage**; URL ของเซิร์ฟเวอร์ + รหัสผ่าน + webhook
    - [iMessage](/th/channels/imessage): พาธ `imsg` CLI แบบ legacy + การเข้าถึง DB
    - ความปลอดภัยของ DM: ค่าเริ่มต้นคือการจับคู่ DM แรกจะส่งรหัส; อนุมัติผ่าน `openclaw pairing approve <channel> <code>` หรือใช้ allowlists
  </Step>
  <Step title="การค้นหาเว็บ">
    - เลือก provider ที่รองรับ เช่น Brave, DuckDuckGo, Exa, Firecrawl, Gemini, Grok, Kimi, MiniMax Search, Ollama Web Search, Perplexity, SearXNG หรือ Tavily (หรือข้าม)
    - providers ที่ใช้ API สามารถใช้ env vars หรือ config ที่มีอยู่สำหรับการตั้งค่าอย่างรวดเร็ว; providers ที่ไม่ใช้คีย์จะใช้ข้อกำหนดเบื้องต้นเฉพาะของตนแทน
    - ข้ามด้วย `--skip-search`
    - กำหนดค่าภายหลังได้ด้วย `openclaw configure --section web`
  </Step>
  <Step title="การติดตั้ง daemon">
    - macOS: LaunchAgent
      - ต้องมีเซสชันผู้ใช้ที่ล็อกอินอยู่; หากเป็น headless ให้ใช้ LaunchDaemon แบบกำหนดเอง (ไม่มีมาให้)
    - Linux (และ Windows ผ่าน WSL2): systemd user unit
      - Onboarding จะพยายามเปิดใช้ lingering ผ่าน `loginctl enable-linger <user>` เพื่อให้ Gateway ทำงานต่อหลังออกจากระบบ
      - อาจถาม sudo (เขียนไปที่ `/var/lib/systemd/linger`); จะลองโดยไม่ใช้ sudo ก่อน
    - **การเลือก runtime:** Node (แนะนำ; จำเป็นสำหรับ WhatsApp/Telegram) ไม่แนะนำให้ใช้ **Bun**
    - หาก token auth ต้องใช้โทเค็น และ `gateway.auth.token` ถูกจัดการด้วย SecretRef การติดตั้ง daemon จะตรวจสอบความถูกต้อง แต่จะไม่เก็บค่า plaintext token ที่ resolve แล้วลงใน service environment metadata ของ supervisor
    - หาก token auth ต้องใช้โทเค็น และ token SecretRef ที่กำหนดค่าไว้ resolve ไม่ได้ การติดตั้ง daemon จะถูกบล็อกพร้อมคำแนะนำที่นำไปทำต่อได้
    - หากมีการกำหนดทั้ง `gateway.auth.token` และ `gateway.auth.password` แต่ไม่ได้ตั้ง `gateway.auth.mode` ไว้ การติดตั้ง daemon จะถูกบล็อกจนกว่าจะตั้งค่า mode อย่างชัดเจน
  </Step>
  <Step title="การตรวจสอบสุขภาพ">
    - เริ่ม Gateway (หากจำเป็น) และรัน `openclaw health`
    - เคล็ดลับ: `openclaw status --deep` จะเพิ่มการตรวจสอบสุขภาพของ live gateway ลงในผลลัพธ์สถานะ รวมถึง channel probes เมื่อรองรับ (ต้องเข้าถึง gateway ได้)
  </Step>
  <Step title="Skills (แนะนำ)">
    - อ่าน Skills ที่มีและตรวจสอบข้อกำหนด
    - ให้คุณเลือกตัวจัดการ node: **npm / pnpm** (ไม่แนะนำ bun)
    - ติดตั้ง dependencies แบบไม่บังคับ (บางรายการใช้ Homebrew บน macOS)
  </Step>
  <Step title="เสร็จสิ้น">
    - สรุป + ขั้นตอนถัดไป รวมถึงแอป iOS/Android/macOS สำหรับฟีเจอร์เพิ่มเติม
  </Step>
</Steps>

<Note>
หากไม่ตรวจพบ GUI onboarding จะแสดงคำสั่ง SSH port-forward สำหรับ Control UI แทนการเปิดเบราว์เซอร์
หาก assets ของ Control UI หายไป onboarding จะพยายาม build ให้; fallback คือ `pnpm ui:build` (ติดตั้ง UI deps อัตโนมัติ)
</Note>

## โหมดไม่โต้ตอบ

ใช้ `--non-interactive` เพื่อทำ onboarding แบบอัตโนมัติหรือใช้ในสคริปต์:

```bash
openclaw onboard --non-interactive \
  --mode local \
  --auth-choice apiKey \
  --anthropic-api-key "$ANTHROPIC_API_KEY" \
  --gateway-port 18789 \
  --gateway-bind loopback \
  --install-daemon \
  --daemon-runtime node \
  --skip-skills
```

เพิ่ม `--json` เพื่อให้ได้สรุปแบบเครื่องอ่านได้

เส้นทาง SecretRef ของ token สำหรับ Gateway ในโหมดไม่โต้ตอบ:

```bash
export OPENCLAW_GATEWAY_TOKEN="your-token"
openclaw onboard --non-interactive \
  --mode local \
  --auth-choice skip \
  --gateway-auth token \
  --gateway-token-ref-env OPENCLAW_GATEWAY_TOKEN
```

`--gateway-token` และ `--gateway-token-ref-env` ใช้ร่วมกันไม่ได้

<Note>
`--json` **ไม่ได้** หมายถึงโหมดไม่โต้ตอบโดยอัตโนมัติ ใช้ `--non-interactive` (และ `--workspace`) สำหรับสคริปต์
</Note>

ตัวอย่างคำสั่งเฉพาะ provider อยู่ใน [CLI Automation](/th/start/wizard-cli-automation#provider-specific-examples)
ให้ใช้หน้าอ้างอิงนี้สำหรับความหมายของแฟล็กและลำดับขั้นตอน

### เพิ่ม agent (โหมดไม่โต้ตอบ)

```bash
openclaw agents add work \
  --workspace ~/.openclaw/workspace-work \
  --model openai/gpt-5.4 \
  --bind whatsapp:biz \
  --non-interactive \
  --json
```

## RPC ของวิซาร์ด Gateway

Gateway เปิดเผยโฟลว์ onboarding ผ่าน RPC (`wizard.start`, `wizard.next`, `wizard.cancel`, `wizard.status`)
ไคลเอนต์ (แอป macOS, Control UI) สามารถแสดงขั้นตอนต่าง ๆ ได้โดยไม่ต้องนำตรรกะ onboarding ไปเขียนใหม่

## การตั้งค่า Signal (`signal-cli`)

Onboarding สามารถติดตั้ง `signal-cli` จาก GitHub releases ได้:

- ดาวน์โหลด release asset ที่เหมาะสม
- เก็บไว้ใน `~/.openclaw/tools/signal-cli/<version>/`
- เขียน `channels.signal.cliPath` ลงใน config ของคุณ

หมายเหตุ:

- build แบบ JVM ต้องใช้ **Java 21**
- จะใช้ build แบบ native เมื่อมีให้ใช้งาน
- บน Windows จะใช้ WSL2; การติดตั้ง signal-cli จะทำตามโฟลว์ Linux ภายใน WSL

## สิ่งที่วิซาร์ดเขียนลงไป

ฟิลด์ทั่วไปใน `~/.openclaw/openclaw.json`:

- `agents.defaults.workspace`
- `agents.defaults.model` / `models.providers` (หากเลือก Minimax)
- `tools.profile` (onboarding แบบ local ใช้ค่าเริ่มต้นเป็น `"coding"` เมื่อยังไม่ได้ตั้งค่า; ค่าที่ตั้งไว้อย่างชัดเจนอยู่แล้วจะถูกเก็บไว้)
- `gateway.*` (mode, bind, auth, tailscale)
- `session.dmScope` (รายละเอียดพฤติกรรม: [เอกสารอ้างอิงการตั้งค่า CLI](/th/start/wizard-cli-reference#outputs-and-internals))
- `channels.telegram.botToken`, `channels.discord.token`, `channels.matrix.*`, `channels.signal.*`, `channels.imessage.*`
- allowlists ของ channel (Slack/Discord/Matrix/Microsoft Teams) เมื่อคุณเลือกใช้ระหว่างขั้นตอนพรอมป์ (ระบบจะ resolve ชื่อเป็น IDs เมื่อทำได้)
- `skills.install.nodeManager`
  - `setup --node-manager` รองรับ `npm`, `pnpm` หรือ `bun`
  - config ที่ตั้งค่าด้วยตนเองยังคงใช้ `yarn` ได้โดยตั้งค่า `skills.install.nodeManager` โดยตรง
- `wizard.lastRunAt`
- `wizard.lastRunVersion`
- `wizard.lastRunCommit`
- `wizard.lastRunCommand`
- `wizard.lastRunMode`

`openclaw agents add` จะเขียน `agents.list[]` และ `bindings` แบบไม่บังคับ

credentials ของ WhatsApp จะอยู่ภายใต้ `~/.openclaw/credentials/whatsapp/<accountId>/`
sessions จะถูกเก็บไว้ภายใต้ `~/.openclaw/agents/<agentId>/sessions/`

บาง channels ถูกส่งมอบในรูปแบบ plugins เมื่อคุณเลือกหนึ่งในนั้นระหว่างการตั้งค่า onboarding
จะถามเพื่อติดตั้งมัน (ผ่าน npm หรือ local path) ก่อนจึงจะกำหนดค่าได้

## เอกสารที่เกี่ยวข้อง

- ภาพรวม onboarding: [Onboarding (CLI)](/th/start/wizard)
- onboarding ของแอป macOS: [Onboarding](/th/start/onboarding)
- เอกสารอ้างอิง config: [การตั้งค่า Gateway](/th/gateway/configuration)
- Providers: [WhatsApp](/th/channels/whatsapp), [Telegram](/th/channels/telegram), [Discord](/th/channels/discord), [Google Chat](/th/channels/googlechat), [Signal](/th/channels/signal), [BlueBubbles](/th/channels/bluebubbles) (iMessage), [iMessage](/th/channels/imessage) (legacy)
- Skills: [Skills](/th/tools/skills), [config ของ Skills](/th/tools/skills-config)
