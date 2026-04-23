---
read_when:
    - การค้นหาขั้นตอนหรือแฟล็กของ onboarding ที่เฉพาะเจาะจง
    - การทำ onboarding ให้เป็นอัตโนมัติด้วยโหมด non-interactive
    - การดีบักพฤติกรรมของ onboarding
sidebarTitle: Onboarding Reference
summary: 'เอกสารอ้างอิงแบบเต็มสำหรับ onboarding ผ่าน CLI: ทุกขั้นตอน ทุกแฟล็ก และทุกฟิลด์คอนฟิก'
title: เอกสารอ้างอิง Onboarding
x-i18n:
    generated_at: "2026-04-23T05:56:46Z"
    model: gpt-5.4
    provider: openai
    source_hash: 51405f5d9ba3d9553662fd0a03254a709d5eb4b27339c5edfe1da1111629d0dd
    source_path: reference/wizard.md
    workflow: 15
---

# เอกสารอ้างอิง Onboarding

นี่คือเอกสารอ้างอิงแบบเต็มสำหรับ `openclaw onboard`
สำหรับภาพรวมระดับสูง ดู [Onboarding (CLI)](/th/start/wizard)

## รายละเอียดของโฟลว์ (โหมด local)

<Steps>
  <Step title="การตรวจจับคอนฟิกที่มีอยู่">
    - หากมี `~/.openclaw/openclaw.json` อยู่แล้ว ให้เลือก **Keep / Modify / Reset**
    - การรัน onboarding ซ้ำจะ **ไม่**ล้างอะไร เว้นแต่คุณจะเลือก **Reset** อย่างชัดเจน
      (หรือส่ง `--reset`)
    - `--reset` ใน CLI ใช้ค่าเริ่มต้นเป็น `config+creds+sessions`; ใช้ `--reset-scope full`
      หากต้องการลบ workspace ด้วย
    - หากคอนฟิกไม่ถูกต้องหรือมีคีย์แบบ legacy wizard จะหยุดและขอ
      ให้คุณรัน `openclaw doctor` ก่อนจึงจะทำต่อได้
    - การ reset ใช้ `trash` (ไม่ใช้ `rm`) และมีขอบเขตให้เลือก:
      - เฉพาะคอนฟิก
      - คอนฟิก + credentials + sessions
      - รีเซ็ตทั้งหมด (รวมถึงลบ workspace)
  </Step>
  <Step title="Model/Auth">
    - **Anthropic API key**: ใช้ `ANTHROPIC_API_KEY` หากมีอยู่แล้ว หรือถามหา key จากนั้นบันทึกไว้สำหรับใช้งานกับ daemon
    - **Anthropic API key**: เป็นตัวเลือกผู้ช่วยของ Anthropic ที่แนะนำใน onboarding/configure
    - **Anthropic setup-token**: ยังมีให้ใช้ใน onboarding/configure แม้ตอนนี้ OpenClaw จะเลือกใช้ Claude CLI ซ้ำเมื่อทำได้เป็นหลัก
    - **OpenAI Code (Codex) subscription (OAuth)**: โฟลว์ผ่านเบราว์เซอร์; ให้วาง `code#state`
      - ตั้ง `agents.defaults.model` เป็น `openai-codex/gpt-5.4` เมื่อยังไม่ได้ตั้งโมเดล หรือยังเป็น `openai/*`
    - **OpenAI Code (Codex) subscription (device pairing)**: โฟลว์จับคู่ผ่านเบราว์เซอร์ด้วย device code แบบอายุสั้น
      - ตั้ง `agents.defaults.model` เป็น `openai-codex/gpt-5.4` เมื่อยังไม่ได้ตั้งโมเดล หรือยังเป็น `openai/*`
    - **OpenAI API key**: ใช้ `OPENAI_API_KEY` หากมีอยู่แล้ว หรือถามหา key จากนั้นเก็บไว้ใน auth profile
      - ตั้ง `agents.defaults.model` เป็น `openai/gpt-5.4` เมื่อยังไม่ได้ตั้งโมเดล, หรือยังเป็น `openai/*` หรือ `openai-codex/*`
    - **xAI (Grok) API key**: ถามหา `XAI_API_KEY` และตั้งค่า xAI เป็นผู้ให้บริการโมเดล
    - **OpenCode**: ถามหา `OPENCODE_API_KEY` (หรือ `OPENCODE_ZEN_API_KEY`, ขอได้ที่ https://opencode.ai/auth) และให้คุณเลือกแค็ตตาล็อก Zen หรือ Go
    - **Ollama**: ให้เลือกก่อนระหว่าง **Cloud + Local**, **Cloud only** หรือ **Local only** `Cloud only` จะถามหา `OLLAMA_API_KEY` และใช้ `https://ollama.com`; ส่วนโหมดที่อิงโฮสต์จะถามหา base URL ของ Ollama, ค้นหาโมเดลที่มีอยู่ และดึงโมเดลภายในเครื่องที่เลือกโดยอัตโนมัติเมื่อจำเป็น; `Cloud + Local` ยังตรวจสอบด้วยว่าโฮสต์ Ollama นั้นลงชื่อเข้าใช้สำหรับ cloud access หรือไม่
    - รายละเอียดเพิ่มเติม: [Ollama](/th/providers/ollama)
    - **API key**: เก็บ key ให้คุณ
    - **Vercel AI Gateway (พร็อกซีหลายโมเดล)**: ถามหา `AI_GATEWAY_API_KEY`
    - รายละเอียดเพิ่มเติม: [Vercel AI Gateway](/th/providers/vercel-ai-gateway)
    - **Cloudflare AI Gateway**: ถามหา Account ID, Gateway ID และ `CLOUDFLARE_AI_GATEWAY_API_KEY`
    - รายละเอียดเพิ่มเติม: [Cloudflare AI Gateway](/th/providers/cloudflare-ai-gateway)
    - **MiniMax**: คอนฟิกจะถูกเขียนให้อัตโนมัติ; ค่าเริ่มต้นแบบโฮสต์คือ `MiniMax-M2.7`
      การตั้งค่าแบบ API key ใช้ `minimax/...` และการตั้งค่าแบบ OAuth ใช้
      `minimax-portal/...`
    - รายละเอียดเพิ่มเติม: [MiniMax](/th/providers/minimax)
    - **StepFun**: คอนฟิกจะถูกเขียนให้อัตโนมัติสำหรับ StepFun standard หรือ Step Plan บน endpoint จีนหรือ global
    - ปัจจุบัน Standard มี `step-3.5-flash` และ Step Plan มี `step-3.5-flash-2603` ด้วย
    - รายละเอียดเพิ่มเติม: [StepFun](/th/providers/stepfun)
    - **Synthetic (เข้ากันได้กับ Anthropic)**: ถามหา `SYNTHETIC_API_KEY`
    - รายละเอียดเพิ่มเติม: [Synthetic](/th/providers/synthetic)
    - **Moonshot (Kimi K2)**: คอนฟิกจะถูกเขียนให้อัตโนมัติ
    - **Kimi Coding**: คอนฟิกจะถูกเขียนให้อัตโนมัติ
    - รายละเอียดเพิ่มเติม: [Moonshot AI (Kimi + Kimi Coding)](/th/providers/moonshot)
    - **Skip**: ยังไม่ตั้งค่า auth
    - เลือกโมเดลเริ่มต้นจากตัวเลือกที่ตรวจพบ (หรือกรอก provider/model เองด้วยตนเอง) เพื่อคุณภาพที่ดีที่สุดและลดความเสี่ยงจาก prompt injection ให้เลือกโมเดลรุ่นใหม่ล่าสุดที่แข็งแกร่งที่สุดซึ่งมีอยู่ในชุดผู้ให้บริการของคุณ
    - Onboarding จะรันการตรวจสอบโมเดล และเตือนหากโมเดลที่ตั้งค่าไว้ไม่รู้จักหรือไม่มี auth
    - โหมดการเก็บ API key ใช้ค่าเริ่มต้นเป็นค่าแบบ plaintext ใน auth profile ใช้ `--secret-input-mode ref` เพื่อเก็บเป็น ref ที่อิง env แทน (เช่น `keyRef: { source: "env", provider: "default", id: "OPENAI_API_KEY" }`)
    - auth profile อยู่ที่ `~/.openclaw/agents/<agentId>/agent/auth-profiles.json` (API key + OAuth) ส่วน `~/.openclaw/credentials/oauth.json` เป็นแบบ legacy ที่ใช้สำหรับ import เท่านั้น
    - รายละเอียดเพิ่มเติม: [/concepts/oauth](/th/concepts/oauth)
    <Note>
    เคล็ดลับสำหรับเซิร์ฟเวอร์/headless: ทำ OAuth ให้เสร็จบนเครื่องที่มีเบราว์เซอร์ แล้วคัดลอก
    `auth-profiles.json` ของเอเจนต์นั้น (เช่น
    `~/.openclaw/agents/<agentId>/agent/auth-profiles.json` หรือพาธ
    `$OPENCLAW_STATE_DIR/...` ที่ตรงกัน) ไปยังโฮสต์ของ Gateway `credentials/oauth.json`
    ใช้เป็นแหล่งนำเข้าแบบ legacy เท่านั้น
    </Note>
  </Step>
  <Step title="Workspace">
    - ค่าเริ่มต้นคือ `~/.openclaw/workspace` (เปลี่ยนได้)
    - seed ไฟล์ workspace ที่จำเป็นสำหรับพิธี bootstrap ของเอเจนต์
    - คู่มือโครงสร้าง workspace และการสำรองข้อมูลแบบเต็ม: [Agent workspace](/th/concepts/agent-workspace)
  </Step>
  <Step title="Gateway">
    - พอร์ต, bind, โหมด auth, การเปิดออกผ่าน Tailscale
    - คำแนะนำเรื่อง auth: ควรใช้ **Token** ไว้ แม้จะเป็น loopback ก็ตาม เพื่อให้ไคลเอนต์ WS ในเครื่องต้องยืนยันตัวตน
    - ในโหมด token การตั้งค่าแบบโต้ตอบจะมีตัวเลือก:
      - **Generate/store plaintext token** (ค่าเริ่มต้น)
      - **Use SecretRef** (เลือกเปิดเอง)
      - Quickstart จะใช้ `gateway.auth.token` SecretRef ที่มีอยู่แล้วซ้ำได้ข้ามผู้ให้บริการ `env`, `file` และ `exec` สำหรับ onboarding probe/dashboard bootstrap
      - หาก SecretRef ถูกตั้งค่าไว้แต่ไม่สามารถ resolve ได้ onboarding จะล้มเหลวตั้งแต่เนิ่น ๆ พร้อมข้อความแก้ไขที่ชัดเจน แทนที่จะลดระดับ auth ของรันไทม์แบบเงียบ ๆ
    - ในโหมด password การตั้งค่าแบบโต้ตอบก็รองรับทั้งการเก็บแบบ plaintext หรือ SecretRef
    - เส้นทาง SecretRef ของ token แบบ non-interactive: `--gateway-token-ref-env <ENV_VAR>`
      - ต้องมี env var ที่ไม่ว่างใน environment ของโปรเซส onboarding
      - ใช้ร่วมกับ `--gateway-token` ไม่ได้
    - ปิด auth เฉพาะเมื่อคุณเชื่อถือทุกโปรเซสภายในเครื่องโดยสมบูรณ์เท่านั้น
    - bind แบบ non-loopback ก็ยังต้องใช้ auth
  </Step>
  <Step title="Channels">
    - [WhatsApp](/th/channels/whatsapp): การล็อกอินผ่าน QR แบบไม่บังคับ
    - [Telegram](/th/channels/telegram): bot token
    - [Discord](/th/channels/discord): bot token
    - [Google Chat](/th/channels/googlechat): JSON ของ service account + webhook audience
    - [Mattermost](/th/channels/mattermost) (Plugin): bot token + base URL
    - [Signal](/th/channels/signal): การติดตั้ง `signal-cli` แบบไม่บังคับ + คอนฟิกบัญชี
    - [BlueBubbles](/th/channels/bluebubbles): **แนะนำสำหรับ iMessage**; server URL + password + webhook
    - [iMessage](/th/channels/imessage): legacy `imsg` CLI path + การเข้าถึง DB
    - ความปลอดภัยของ DM: ค่าเริ่มต้นคือ pairing DM แรกจะส่งรหัส; อนุมัติผ่าน `openclaw pairing approve <channel> <code>` หรือใช้ allowlist
  </Step>
  <Step title="Web search">
    - เลือกผู้ให้บริการที่รองรับ เช่น Brave, DuckDuckGo, Exa, Firecrawl, Gemini, Grok, Kimi, MiniMax Search, Ollama Web Search, Perplexity, SearXNG หรือ Tavily (หรือข้าม)
    - ผู้ให้บริการที่มี API สามารถใช้ env var หรือคอนฟิกที่มีอยู่แล้วเพื่อการตั้งค่าแบบรวดเร็ว; ผู้ให้บริการที่ไม่ใช้ key จะใช้ข้อกำหนดเฉพาะผู้ให้บริการของตัวเองแทน
    - ข้ามได้ด้วย `--skip-search`
    - ตั้งค่าทีหลังได้: `openclaw configure --section web`
  </Step>
  <Step title="ติดตั้ง daemon">
    - macOS: LaunchAgent
      - ต้องใช้เซสชันผู้ใช้ที่ล็อกอินอยู่; สำหรับแบบ headless ให้ใช้ LaunchDaemon แบบกำหนดเอง (ไม่มีมาให้)
    - Linux (และ Windows ผ่าน WSL2): systemd user unit
      - Onboarding จะพยายามเปิด lingering ผ่าน `loginctl enable-linger <user>` เพื่อให้ Gateway ทำงานต่อหลัง logout
      - อาจถามหา sudo (เขียนไปที่ `/var/lib/systemd/linger`); มันจะลองแบบไม่ใช้ sudo ก่อน
    - **การเลือกรันไทม์:** Node (แนะนำ; จำเป็นสำหรับ WhatsApp/Telegram) ไม่แนะนำให้ใช้ Bun
    - หาก token auth ต้องใช้ token และ `gateway.auth.token` ถูกจัดการด้วย SecretRef การติดตั้ง daemon จะตรวจสอบมัน แต่จะไม่เก็บค่า plaintext token ที่ resolve แล้วลงในเมทาดาทา environment ของ service supervisor
    - หาก token auth ต้องใช้ token และ token SecretRef ที่ตั้งค่าไว้นั้นยัง resolve ไม่ได้ การติดตั้ง daemon จะถูกบล็อกพร้อมคำแนะนำที่ดำเนินการได้
    - หากตั้งค่า `gateway.auth.token` และ `gateway.auth.password` ไว้ทั้งคู่ แต่ `gateway.auth.mode` ยังไม่ได้ตั้ง การติดตั้ง daemon จะถูกบล็อกจนกว่าจะตั้ง mode อย่างชัดเจน
  </Step>
  <Step title="Health check">
    - เริ่ม Gateway (หากจำเป็น) และรัน `openclaw health`
    - เคล็ดลับ: `openclaw status --deep` จะเพิ่ม live gateway health probe เข้าไปในเอาต์พุตสถานะ รวมถึง channel probe เมื่อรองรับ (ต้องเข้าถึง Gateway ได้)
  </Step>
  <Step title="Skills (แนะนำ)">
    - อ่าน Skills ที่มีอยู่และตรวจสอบข้อกำหนด
    - ให้คุณเลือกตัวจัดการ node: **npm / pnpm** (ไม่แนะนำ bun)
    - ติดตั้ง dependency แบบไม่บังคับ (บางตัวใช้ Homebrew บน macOS)
  </Step>
  <Step title="เสร็จสิ้น">
    - สรุป + ขั้นตอนถัดไป รวมถึงแอป iOS/Android/macOS สำหรับฟีเจอร์เพิ่มเติม
  </Step>
</Steps>

<Note>
หากตรวจไม่พบ GUI onboarding จะพิมพ์คำแนะนำสำหรับ SSH port-forward ไปยัง Control UI แทนการเปิดเบราว์เซอร์
หาก asset ของ Control UI หายไป onboarding จะพยายาม build มัน; fallback คือ `pnpm ui:build` (จะติดตั้ง dependency ของ UI ให้อัตโนมัติ)
</Note>

## โหมด non-interactive

ใช้ `--non-interactive` เพื่อทำ onboarding แบบอัตโนมัติหรือแบบสคริปต์:

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

เพิ่ม `--json` เพื่อสรุปผลแบบ machine-readable

เส้นทาง SecretRef ของ token สำหรับ Gateway ในโหมด non-interactive:

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
`--json` **ไม่ได้**หมายความว่าเป็นโหมด non-interactive โดยอัตโนมัติ ให้ใช้ `--non-interactive` (และ `--workspace`) สำหรับสคริปต์
</Note>

ตัวอย่างคำสั่งเฉพาะของผู้ให้บริการอยู่ใน [CLI Automation](/th/start/wizard-cli-automation#provider-specific-examples)
ให้ใช้หน้าอ้างอิงนี้สำหรับความหมายของแฟล็กและลำดับขั้นตอน

### เพิ่มเอเจนต์ (non-interactive)

```bash
openclaw agents add work \
  --workspace ~/.openclaw/workspace-work \
  --model openai/gpt-5.4 \
  --bind whatsapp:biz \
  --non-interactive \
  --json
```

## Gateway wizard RPC

Gateway เปิดเผยโฟลว์ onboarding ผ่าน RPC (`wizard.start`, `wizard.next`, `wizard.cancel`, `wizard.status`)
ไคลเอนต์ต่าง ๆ (แอป macOS, Control UI) สามารถเรนเดอร์ขั้นตอนได้โดยไม่ต้อง implement ตรรกะ onboarding ใหม่

## การตั้งค่า Signal (`signal-cli`)

Onboarding สามารถติดตั้ง `signal-cli` จาก GitHub releases ได้:

- ดาวน์โหลด release asset ที่เหมาะสม
- จัดเก็บไว้ภายใต้ `~/.openclaw/tools/signal-cli/<version>/`
- เขียน `channels.signal.cliPath` ลงในคอนฟิกของคุณ

หมายเหตุ:

- build แบบ JVM ต้องใช้ **Java 21**
- จะใช้ build แบบ native เมื่อมี
- Windows ใช้ WSL2; การติดตั้ง signal-cli จะใช้โฟลว์ Linux ภายใน WSL

## สิ่งที่ wizard เขียน

ฟิลด์ทั่วไปใน `~/.openclaw/openclaw.json`:

- `agents.defaults.workspace`
- `agents.defaults.model` / `models.providers` (หากเลือก MiniMax)
- `tools.profile` (onboarding แบบ local จะใช้ค่าเริ่มต้นเป็น `"coding"` เมื่อยังไม่ได้ตั้งค่า; ค่าที่ตั้งไว้อย่างชัดเจนอยู่แล้วจะถูกคงไว้)
- `gateway.*` (mode, bind, auth, Tailscale)
- `session.dmScope` (รายละเอียดพฤติกรรม: [เอกสารอ้างอิงการตั้งค่า CLI](/th/start/wizard-cli-reference#outputs-and-internals))
- `channels.telegram.botToken`, `channels.discord.token`, `channels.matrix.*`, `channels.signal.*`, `channels.imessage.*`
- allowlist ของช่องทาง (Slack/Discord/Matrix/Microsoft Teams) เมื่อคุณเลือกใช้ระหว่าง prompt (ชื่อจะถูก resolve เป็น ID เมื่อทำได้)
- `skills.install.nodeManager`
  - `setup --node-manager` รับค่า `npm`, `pnpm` หรือ `bun`
  - คอนฟิกแบบ manual ยังใช้ `yarn` ได้โดยตั้งค่า `skills.install.nodeManager` โดยตรง
- `wizard.lastRunAt`
- `wizard.lastRunVersion`
- `wizard.lastRunCommit`
- `wizard.lastRunCommand`
- `wizard.lastRunMode`

`openclaw agents add` จะเขียน `agents.list[]` และ `bindings` แบบไม่บังคับ

credentials ของ WhatsApp จะอยู่ภายใต้ `~/.openclaw/credentials/whatsapp/<accountId>/`
ส่วนเซสชันจะถูกเก็บภายใต้ `~/.openclaw/agents/<agentId>/sessions/`

บางช่องทางถูกส่งมาในรูป Plugin เมื่อคุณเลือกหนึ่งในนั้นระหว่าง setup onboarding
จะถามเพื่อติดตั้งมัน (ผ่าน npm หรือพาธในเครื่อง) ก่อนจึงจะตั้งค่าได้

## เอกสารที่เกี่ยวข้อง

- ภาพรวม onboarding: [Onboarding (CLI)](/th/start/wizard)
- onboarding ของแอป macOS: [Onboarding](/th/start/onboarding)
- เอกสารอ้างอิงคอนฟิก: [Gateway configuration](/th/gateway/configuration)
- ผู้ให้บริการ: [WhatsApp](/th/channels/whatsapp), [Telegram](/th/channels/telegram), [Discord](/th/channels/discord), [Google Chat](/th/channels/googlechat), [Signal](/th/channels/signal), [BlueBubbles](/th/channels/bluebubbles) (iMessage), [iMessage](/th/channels/imessage) (legacy)
- Skills: [Skills](/th/tools/skills), [Skills config](/th/tools/skills-config)
