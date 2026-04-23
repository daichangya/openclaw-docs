---
read_when:
    - กำลังรันหรือกำหนดค่า onboarding ผ่าน CLI
    - Setting up a new machine
sidebarTitle: 'Onboarding: CLI'
summary: 'Onboarding ผ่าน CLI: การตั้งค่าแบบมีตัวช่วยสำหรับ gateway, workspace, ช่องทาง และ Skills'
title: Onboarding (CLI)
x-i18n:
    generated_at: "2026-04-23T05:58:16Z"
    model: gpt-5.4
    provider: openai
    source_hash: 6773b07afa8babf1b5ac94d857063d08094a962ee21ec96ca966e99ad57d107d
    source_path: start/wizard.md
    workflow: 15
---

# Onboarding (CLI)

Onboarding ผ่าน CLI เป็นวิธีที่**แนะนำ**สำหรับการตั้งค่า OpenClaw บน macOS,
Linux หรือ Windows (ผ่าน WSL2; แนะนำอย่างยิ่ง)
มันจะกำหนดค่าทั้ง local Gateway หรือการเชื่อมต่อไปยัง remote Gateway รวมถึง channels, Skills
และค่าเริ่มต้นของ workspace ใน flow แบบมีตัวช่วยเพียงครั้งเดียว

```bash
openclaw onboard
```

<Info>
วิธีที่เร็วที่สุดสำหรับการเริ่มแชตครั้งแรก: เปิด Control UI (ไม่ต้องตั้งค่าช่องทางก็ได้) รัน
`openclaw dashboard` แล้วแชตในเบราว์เซอร์ เอกสาร: [Dashboard](/web/dashboard)
</Info>

หากต้องการกำหนดค่าใหม่ภายหลัง:

```bash
openclaw configure
openclaw agents add <name>
```

<Note>
`--json` ไม่ได้หมายความว่าเป็นโหมด non-interactive โดยปริยาย สำหรับสคริปต์ ให้ใช้ `--non-interactive`
</Note>

<Tip>
CLI onboarding มีขั้นตอนสำหรับ web search ที่คุณสามารถเลือกผู้ให้บริการได้
เช่น Brave, DuckDuckGo, Exa, Firecrawl, Gemini, Grok, Kimi, MiniMax Search,
Ollama Web Search, Perplexity, SearXNG หรือ Tavily ผู้ให้บริการบางรายต้องใช้
API key ขณะที่บางรายไม่ต้องใช้คีย์ คุณยังสามารถกำหนดค่านี้ภายหลังได้ด้วย
`openclaw configure --section web` เอกสาร: [Web tools](/th/tools/web)
</Tip>

## QuickStart เทียบกับ Advanced

Onboarding เริ่มต้นด้วย **QuickStart** (ค่าเริ่มต้น) เทียบกับ **Advanced** (ควบคุมได้เต็มรูปแบบ)

<Tabs>
  <Tab title="QuickStart (ค่าเริ่มต้น)">
    - Local gateway (loopback)
    - Workspace ค่าเริ่มต้น (หรือ workspace ที่มีอยู่แล้ว)
    - พอร์ต Gateway **18789**
    - Gateway auth แบบ **Token** (สร้างอัตโนมัติ แม้บน loopback)
    - นโยบายเครื่องมือเริ่มต้นสำหรับการตั้งค่า local ใหม่: `tools.profile: "coding"` (จะคง explicit profile ที่มีอยู่แล้วไว้)
    - ค่าเริ่มต้นของการแยก DM: local onboarding จะเขียน `session.dmScope: "per-channel-peer"` เมื่อยังไม่ได้ตั้งค่า รายละเอียด: [เอกสารอ้างอิงการตั้งค่า CLI](/th/start/wizard-cli-reference#outputs-and-internals)
    - การเปิดออกผ่าน Tailscale **ปิด**
    - ค่าเริ่มต้นของ Telegram + WhatsApp DM เป็น **allowlist** (ระบบจะถามหมายเลขโทรศัพท์ของคุณ)
  </Tab>
  <Tab title="Advanced (ควบคุมได้เต็มรูปแบบ)">
    - เปิดเผยทุกขั้นตอน (mode, workspace, gateway, channels, daemon, Skills)
  </Tab>
</Tabs>

## สิ่งที่ onboarding กำหนดค่าให้

**โหมด Local (ค่าเริ่มต้น)** จะพาคุณผ่านขั้นตอนเหล่านี้:

1. **Model/Auth** — เลือก flow ของผู้ให้บริการ/การยืนยันตัวตนที่รองรับใดก็ได้ (API key, OAuth หรือการยืนยันตัวตนแบบ manual เฉพาะผู้ให้บริการ) รวมถึง Custom Provider
   (OpenAI-compatible, Anthropic-compatible หรือ Unknown auto-detect) จากนั้นเลือกโมเดลเริ่มต้น
   หมายเหตุด้านความปลอดภัย: หากเอเจนต์นี้จะรันเครื่องมือหรือประมวลผลเนื้อหาจาก webhook/hooks ให้เลือกโมเดลรุ่นล่าสุดที่แข็งแรงที่สุดเท่าที่มี และคง tool policy แบบเข้มงวดไว้ รุ่นที่อ่อนกว่าหรือเก่ากว่าถูก prompt-inject ได้ง่ายกว่า
   สำหรับการรันแบบ non-interactive, `--secret-input-mode ref` จะเก็บ refs ที่อิง env ลงใน auth profiles แทนค่าของ API key แบบ plaintext
   ในโหมด non-interactive แบบ `ref` ตัวแปร env ของผู้ให้บริการต้องถูกตั้งค่าไว้; หากส่ง inline key flags โดยไม่มี env var ดังกล่าว ระบบจะ fail fast
   ในการรันแบบ interactive การเลือกโหมด secret reference จะทำให้คุณสามารถชี้ไปยังทั้ง environment variable หรือ provider ref ที่กำหนดค่าไว้ (`file` หรือ `exec`) พร้อม fast preflight validation ก่อนบันทึก
   สำหรับ Anthropic, onboarding/configure แบบ interactive จะเสนอ **Anthropic Claude CLI** เป็นเส้นทาง local ที่แนะนำ และ **Anthropic API key** เป็นเส้นทาง production ที่แนะนำ Anthropic setup-token ยังคงมีให้ใช้ในฐานะเส้นทาง token-auth ที่รองรับเช่นกัน
2. **Workspace** — ตำแหน่งสำหรับไฟล์ของเอเจนต์ (ค่าเริ่มต้น `~/.openclaw/workspace`) จะ seed bootstrap files
3. **Gateway** — พอร์ต, bind address, auth mode และการเปิดผ่าน Tailscale
   ในโหมด token แบบ interactive ให้เลือกการเก็บ token แบบ plaintext ค่าเริ่มต้น หรือเลือกใช้ SecretRef
   เส้นทาง SecretRef ของ token ในโหมด non-interactive: `--gateway-token-ref-env <ENV_VAR>`
4. **Channels** — ช่องทางแชตที่มีมาในตัวและแบบบันเดิล เช่น BlueBubbles, Discord, Feishu, Google Chat, Mattermost, Microsoft Teams, QQ Bot, Signal, Slack, Telegram, WhatsApp และอื่นๆ
5. **Daemon** — ติดตั้ง LaunchAgent (macOS), systemd user unit (Linux/WSL2) หรือ Windows Scheduled Task แบบเนทีฟพร้อม fallback เป็น per-user Startup-folder
   หาก token auth ต้องใช้ token และ `gateway.auth.token` ถูกจัดการด้วย SecretRef การติดตั้ง daemon จะตรวจสอบค่า แต่จะไม่ persist token ที่ resolve แล้วลงใน metadata ของสภาพแวดล้อมบริการ supervisor
   หาก token auth ต้องใช้ token และ token SecretRef ที่กำหนดค่าไว้ยัง resolve ไม่ได้ การติดตั้ง daemon จะถูกบล็อกพร้อมคำแนะนำที่นำไปทำต่อได้
   หากมีการกำหนดค่าทั้ง `gateway.auth.token` และ `gateway.auth.password` แต่ไม่ได้ตั้ง `gateway.auth.mode` การติดตั้ง daemon จะถูกบล็อกจนกว่าจะตั้ง mode อย่าง explicit
6. **Health check** — เริ่ม Gateway และตรวจสอบว่ามันกำลังทำงานอยู่
7. **Skills** — ติดตั้ง Skills ที่แนะนำและ dependencies แบบไม่บังคับ

<Note>
การรัน onboarding ซ้ำ **จะไม่** ลบอะไร เว้นแต่คุณจะเลือก **Reset** อย่าง explicit (หรือส่ง `--reset`)
CLI `--reset` มีค่าเริ่มต้นเป็นการรีเซ็ต config, credentials และ sessions; ใช้ `--reset-scope full` หากต้องการรวม workspace ด้วย
หากคอนฟิกไม่ถูกต้องหรือมี legacy keys onboarding จะขอให้คุณรัน `openclaw doctor` ก่อน
</Note>

**โหมด Remote** จะกำหนดค่าเฉพาะไคลเอนต์ในเครื่องให้เชื่อมต่อไปยัง Gateway ที่อยู่ที่อื่น
มันจะ **ไม่** ติดตั้งหรือเปลี่ยนแปลงสิ่งใดบนโฮสต์ระยะไกล

## เพิ่มเอเจนต์อีกตัว

ใช้ `openclaw agents add <name>` เพื่อสร้างเอเจนต์แยกต่างหากที่มี workspace,
sessions และ auth profiles ของตัวเอง การรันโดยไม่มี `--workspace` จะเปิด onboarding

สิ่งที่มันตั้งค่า:

- `agents.list[].name`
- `agents.list[].workspace`
- `agents.list[].agentDir`

หมายเหตุ:

- workspaces เริ่มต้นจะเป็นรูปแบบ `~/.openclaw/workspace-<agentId>`
- เพิ่ม `bindings` เพื่อกำหนดเส้นทางข้อความขาเข้า (onboarding ทำสิ่งนี้ให้ได้)
- flags สำหรับ non-interactive: `--model`, `--agent-dir`, `--bind`, `--non-interactive`

## เอกสารอ้างอิงแบบเต็ม

สำหรับรายละเอียดแบบทีละขั้นตอนและเอาต์พุตของคอนฟิก ดู
[เอกสารอ้างอิงการตั้งค่า CLI](/th/start/wizard-cli-reference)
สำหรับตัวอย่างแบบ non-interactive ดู [CLI Automation](/th/start/wizard-cli-automation)
สำหรับเอกสารอ้างอิงเชิงเทคนิคที่ลึกกว่า รวมถึงรายละเอียด RPC ดู
[Onboarding Reference](/th/reference/wizard)

## เอกสารที่เกี่ยวข้อง

- เอกสารอ้างอิงคำสั่ง CLI: [`openclaw onboard`](/cli/onboard)
- ภาพรวม onboarding: [Onboarding Overview](/th/start/onboarding-overview)
- onboarding ของแอป macOS: [Onboarding](/th/start/onboarding)
- พิธีเริ่มต้นครั้งแรกของเอเจนต์: [Agent Bootstrapping](/th/start/bootstrapping)
