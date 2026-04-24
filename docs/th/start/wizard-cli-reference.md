---
read_when:
    - คุณต้องการทราบพฤติกรรมโดยละเอียดของ `openclaw onboard`
    - คุณกำลังดีบักผลลัพธ์ของ onboarding หรือผสานรวมไคลเอนต์ onboarding
sidebarTitle: CLI reference
summary: ข้อมูลอ้างอิงแบบสมบูรณ์สำหรับขั้นตอนการตั้งค่าผ่าน CLI, การตั้งค่า auth/โมเดล, เอาต์พุต และรายละเอียดภายใน
title: ข้อมูลอ้างอิงการตั้งค่าผ่าน CLI
x-i18n:
    generated_at: "2026-04-24T09:34:18Z"
    model: gpt-5.4
    provider: openai
    source_hash: e4b9377e84a6f8063f20a80fe08b5ea2eccdd5b329ec8dfd9d16cbf425d01f66
    source_path: start/wizard-cli-reference.md
    workflow: 15
---

หน้านี้คือข้อมูลอ้างอิงแบบเต็มสำหรับ `openclaw onboard`
สำหรับคู่มือแบบสั้น ดู [Onboarding (CLI)](/th/start/wizard)

## วิซาร์ดทำอะไรบ้าง

โหมดภายในเครื่อง (ค่าเริ่มต้น) จะพาคุณผ่านขั้นตอนดังนี้:

- การตั้งค่าโมเดลและ auth (OpenAI Code subscription OAuth, Anthropic Claude CLI หรือ API key รวมถึงตัวเลือก MiniMax, GLM, Ollama, Moonshot, StepFun และ AI Gateway)
- ตำแหน่ง workspace และไฟล์ bootstrap
- การตั้งค่า Gateway (พอร์ต, bind, auth, Tailscale)
- channels และผู้ให้บริการ (Telegram, WhatsApp, Discord, Google Chat, Mattermost, Signal, BlueBubbles และ bundled channel plugin อื่น ๆ)
- การติดตั้ง daemon (LaunchAgent, systemd user unit หรือ Windows Scheduled Task แบบเนทีฟพร้อม fallback เป็น Startup-folder)
- การตรวจสอบสุขภาพระบบ
- การตั้งค่า Skills

โหมดระยะไกลจะกำหนดค่าเครื่องนี้ให้เชื่อมต่อกับ Gateway ที่อยู่ที่อื่น
โดยจะไม่ติดตั้งหรือแก้ไขอะไรบนโฮสต์ระยะไกล

## รายละเอียดของโหมดภายในเครื่อง

<Steps>
  <Step title="การตรวจพบคอนฟิกที่มีอยู่เดิม">
    - หากมี `~/.openclaw/openclaw.json` อยู่แล้ว ให้เลือก Keep, Modify หรือ Reset
    - การรันวิซาร์ดซ้ำจะไม่ลบอะไร เว้นแต่คุณจะเลือก Reset อย่างชัดเจน (หรือส่ง `--reset`)
    - CLI `--reset` จะตั้งค่าเริ่มต้นเป็น `config+creds+sessions`; ใช้ `--reset-scope full` หากต้องการลบ workspace ด้วย
    - หากคอนฟิกไม่ถูกต้องหรือมีคีย์แบบเก่า วิซาร์ดจะหยุดและขอให้คุณรัน `openclaw doctor` ก่อนดำเนินการต่อ
    - Reset ใช้ `trash` และมีขอบเขตให้เลือก:
      - เฉพาะคอนฟิก
      - คอนฟิก + ข้อมูลรับรอง + เซสชัน
      - รีเซ็ตทั้งหมด (ลบ workspace ด้วย)
  </Step>
  <Step title="โมเดลและ auth">
    - ตารางตัวเลือกแบบเต็มอยู่ใน [ตัวเลือก auth และโมเดล](#auth-and-model-options)
  </Step>
  <Step title="Workspace">
    - ค่าเริ่มต้นคือ `~/.openclaw/workspace` (ปรับแต่งได้)
    - สร้างไฟล์ workspace ที่จำเป็นสำหรับพิธี bootstrap ครั้งแรก
    - โครงสร้าง workspace: [Agent workspace](/th/concepts/agent-workspace)
  </Step>
  <Step title="Gateway">
    - จะถามเกี่ยวกับพอร์ต, bind, โหมด auth และการเปิดใช้งานผ่าน Tailscale
    - คำแนะนำ: คงการใช้ token auth ไว้แม้สำหรับ loopback เพื่อให้ไคลเอนต์ WS ภายในเครื่องต้องยืนยันตัวตน
    - ในโหมด token การตั้งค่าแบบโต้ตอบมีตัวเลือก:
      - **Generate/store plaintext token** (ค่าเริ่มต้น)
      - **Use SecretRef** (ต้องเลือกใช้เอง)
    - ในโหมด password การตั้งค่าแบบโต้ตอบก็รองรับทั้ง plaintext หรือการเก็บแบบ SecretRef
    - พาธ SecretRef สำหรับ token แบบไม่โต้ตอบ: `--gateway-token-ref-env <ENV_VAR>`
      - ต้องมีตัวแปร env ที่ไม่ว่างในสภาพแวดล้อมของกระบวนการ onboarding
      - ใช้ร่วมกับ `--gateway-token` ไม่ได้
    - ให้ปิด auth เฉพาะเมื่อคุณเชื่อถือทุกโปรเซสในเครื่องอย่างสมบูรณ์
    - bind ที่ไม่ใช่ loopback ยังคงต้องใช้ auth
  </Step>
  <Step title="Channels">
    - [WhatsApp](/th/channels/whatsapp): เข้าสู่ระบบด้วย QR แบบไม่บังคับ
    - [Telegram](/th/channels/telegram): bot token
    - [Discord](/th/channels/discord): bot token
    - [Google Chat](/th/channels/googlechat): service account JSON + webhook audience
    - [Mattermost](/th/channels/mattermost): bot token + base URL
    - [Signal](/th/channels/signal): ติดตั้ง `signal-cli` แบบไม่บังคับ + คอนฟิกบัญชี
    - [BlueBubbles](/th/channels/bluebubbles): แนะนำสำหรับ iMessage; URL ของเซิร์ฟเวอร์ + password + webhook
    - [iMessage](/th/channels/imessage): พาธ CLI `imsg` แบบเก่า + การเข้าถึง DB
    - ความปลอดภัยของ DM: ค่าเริ่มต้นคือการจับคู่ ผู้ส่ง DM ครั้งแรกจะได้รับรหัส; อนุมัติผ่าน
      `openclaw pairing approve <channel> <code>` หรือใช้ allowlist
  </Step>
  <Step title="การติดตั้ง daemon">
    - macOS: LaunchAgent
      - ต้องมีเซสชันผู้ใช้ที่ล็อกอินอยู่; สำหรับแบบ headless ให้ใช้ LaunchDaemon แบบกำหนดเอง (ไม่ได้จัดมาให้)
    - Linux และ Windows ผ่าน WSL2: systemd user unit
      - วิซาร์ดจะพยายามรัน `loginctl enable-linger <user>` เพื่อให้ Gateway ทำงานต่อหลังออกจากระบบ
      - อาจขอ sudo (เขียนไปยัง `/var/lib/systemd/linger`); จะลองแบบไม่ใช้ sudo ก่อน
    - Windows แบบเนทีฟ: ใช้ Scheduled Task ก่อน
      - หากการสร้าง task ถูกปฏิเสธ OpenClaw จะ fallback ไปใช้รายการล็อกอินแบบต่อผู้ใช้ใน Startup folder และเริ่ม Gateway ทันที
      - Scheduled Task ยังคงเป็นตัวเลือกที่แนะนำ เพราะให้สถานะ supervisor ที่ดีกว่า
    - การเลือกรันไทม์: Node (แนะนำ; จำเป็นสำหรับ WhatsApp และ Telegram) ไม่แนะนำ Bun
  </Step>
  <Step title="การตรวจสอบสุขภาพระบบ">
    - เริ่ม Gateway (หากจำเป็น) และรัน `openclaw health`
    - `openclaw status --deep` จะเพิ่ม live gateway health probe ลงในเอาต์พุตสถานะ รวมถึง channel probe เมื่อรองรับ
  </Step>
  <Step title="Skills">
    - อ่าน Skills ที่มีอยู่และตรวจสอบข้อกำหนด
    - ให้คุณเลือกตัวจัดการ Node: npm, pnpm หรือ bun
    - ติดตั้ง dependency แบบไม่บังคับ (บางตัวใช้ Homebrew บน macOS)
  </Step>
  <Step title="เสร็จสิ้น">
    - สรุปและขั้นตอนถัดไป รวมถึงตัวเลือกแอป iOS, Android และ macOS
  </Step>
</Steps>

<Note>
หากไม่พบ GUI วิซาร์ดจะพิมพ์คำแนะนำสำหรับการทำ SSH port-forward ไปยัง Control UI แทนการเปิดเบราว์เซอร์
หากไม่มี asset ของ Control UI วิซาร์ดจะพยายาม build ให้; fallback คือ `pnpm ui:build` (ติดตั้ง UI dependency ให้อัตโนมัติ)
</Note>

## รายละเอียดของโหมดระยะไกล

โหมดระยะไกลจะกำหนดค่าเครื่องนี้ให้เชื่อมต่อกับ Gateway ที่อยู่ที่อื่น

<Info>
โหมดระยะไกลจะไม่ติดตั้งหรือแก้ไขอะไรบนโฮสต์ระยะไกล
</Info>

สิ่งที่คุณตั้งค่า:

- URL ของ Remote Gateway (`ws://...`)
- token หาก Remote Gateway ต้องใช้ auth (แนะนำ)

<Note>
- หาก Gateway ผูกกับ loopback เท่านั้น ให้ใช้ SSH tunneling หรือ tailnet
- คำแนะนำในการค้นพบ:
  - macOS: Bonjour (`dns-sd`)
  - Linux: Avahi (`avahi-browse`)
</Note>

## ตัวเลือก auth และโมเดล

<AccordionGroup>
  <Accordion title="Anthropic API key">
    ใช้ `ANTHROPIC_API_KEY` หากมีอยู่ หรือถามหา key จากนั้นบันทึกไว้สำหรับการใช้งานของ daemon
  </Accordion>
  <Accordion title="OpenAI Code subscription (OAuth)">
    ขั้นตอนผ่านเบราว์เซอร์; วาง `code#state`

    ตั้งค่า `agents.defaults.model` เป็น `openai-codex/gpt-5.5` เมื่อยังไม่ได้ตั้งค่าโมเดล หรือเมื่อตั้งเป็นตระกูล OpenAI อยู่แล้ว

  </Accordion>
  <Accordion title="OpenAI Code subscription (device pairing)">
    ขั้นตอนการจับคู่ผ่านเบราว์เซอร์ด้วย device code อายุสั้น

    ตั้งค่า `agents.defaults.model` เป็น `openai-codex/gpt-5.5` เมื่อยังไม่ได้ตั้งค่าโมเดล หรือเมื่อตั้งเป็นตระกูล OpenAI อยู่แล้ว

  </Accordion>
  <Accordion title="OpenAI API key">
    ใช้ `OPENAI_API_KEY` หากมีอยู่ หรือถามหา key จากนั้นจัดเก็บข้อมูลรับรองไว้ใน auth profile

    ตั้งค่า `agents.defaults.model` เป็น `openai/gpt-5.4` เมื่อโมเดลยังไม่ได้ตั้งค่า เป็น `openai/*` หรือ `openai-codex/*`

  </Accordion>
  <Accordion title="xAI (Grok) API key">
    ถามหา `XAI_API_KEY` และกำหนดค่า xAI เป็นผู้ให้บริการโมเดล
  </Accordion>
  <Accordion title="OpenCode">
    ถามหา `OPENCODE_API_KEY` (หรือ `OPENCODE_ZEN_API_KEY`) และให้คุณเลือกแค็ตตาล็อก Zen หรือ Go
    URL สำหรับการตั้งค่า: [opencode.ai/auth](https://opencode.ai/auth)
  </Accordion>
  <Accordion title="API key (generic)">
    จัดเก็บ key ให้คุณ
  </Accordion>
  <Accordion title="Vercel AI Gateway">
    ถามหา `AI_GATEWAY_API_KEY`
    รายละเอียดเพิ่มเติม: [Vercel AI Gateway](/th/providers/vercel-ai-gateway)
  </Accordion>
  <Accordion title="Cloudflare AI Gateway">
    ถามหา account ID, gateway ID และ `CLOUDFLARE_AI_GATEWAY_API_KEY`
    รายละเอียดเพิ่มเติม: [Cloudflare AI Gateway](/th/providers/cloudflare-ai-gateway)
  </Accordion>
  <Accordion title="MiniMax">
    เขียนคอนฟิกให้อัตโนมัติ ค่าเริ่มต้นแบบโฮสต์คือ `MiniMax-M2.7`; การตั้งค่าแบบ API key ใช้
    `minimax/...` และการตั้งค่าแบบ OAuth ใช้ `minimax-portal/...`
    รายละเอียดเพิ่มเติม: [MiniMax](/th/providers/minimax)
  </Accordion>
  <Accordion title="StepFun">
    เขียนคอนฟิกให้อัตโนมัติสำหรับ StepFun standard หรือ Step Plan บนปลายทาง China หรือ global
    ปัจจุบัน Standard มี `step-3.5-flash` และ Step Plan มี `step-3.5-flash-2603` ด้วย
    รายละเอียดเพิ่มเติม: [StepFun](/th/providers/stepfun)
  </Accordion>
  <Accordion title="Synthetic (Anthropic-compatible)">
    ถามหา `SYNTHETIC_API_KEY`
    รายละเอียดเพิ่มเติม: [Synthetic](/th/providers/synthetic)
  </Accordion>
  <Accordion title="Ollama (Cloud and local open models)">
    ถามก่อนว่าจะใช้ `Cloud + Local`, `Cloud only` หรือ `Local only`
    `Cloud only` ใช้ `OLLAMA_API_KEY` กับ `https://ollama.com`
    โหมดที่ใช้โฮสต์จะถามหา base URL (ค่าเริ่มต้น `http://127.0.0.1:11434`) ค้นหาโมเดลที่มีอยู่ และแนะนำค่าเริ่มต้น
    `Cloud + Local` ยังตรวจสอบด้วยว่า Ollama host นั้นลงชื่อเข้าใช้สำหรับการเข้าถึง cloud แล้วหรือไม่
    รายละเอียดเพิ่มเติม: [Ollama](/th/providers/ollama)
  </Accordion>
  <Accordion title="Moonshot and Kimi Coding">
    คอนฟิกของ Moonshot (Kimi K2) และ Kimi Coding จะถูกเขียนให้อัตโนมัติ
    รายละเอียดเพิ่มเติม: [Moonshot AI (Kimi + Kimi Coding)](/th/providers/moonshot)
  </Accordion>
  <Accordion title="Custom provider">
    ใช้งานได้กับปลายทางที่เข้ากันได้กับ OpenAI และ Anthropic

    onboarding แบบโต้ตอบรองรับตัวเลือกการจัดเก็บ API key แบบเดียวกับขั้นตอน API key ของผู้ให้บริการอื่น:
    - **Paste API key now** (plaintext)
    - **Use secret reference** (env ref หรือ configured provider ref พร้อมการตรวจสอบ preflight)

    แฟล็กแบบไม่โต้ตอบ:
    - `--auth-choice custom-api-key`
    - `--custom-base-url`
    - `--custom-model-id`
    - `--custom-api-key` (ไม่บังคับ; fallback ไปใช้ `CUSTOM_API_KEY`)
    - `--custom-provider-id` (ไม่บังคับ)
    - `--custom-compatibility <openai|anthropic>` (ไม่บังคับ; ค่าเริ่มต้น `openai`)

  </Accordion>
  <Accordion title="Skip">
    ปล่อยให้ auth ยังไม่ได้กำหนดค่า
  </Accordion>
</AccordionGroup>

พฤติกรรมของโมเดล:

- เลือกโมเดลเริ่มต้นจากตัวเลือกที่ตรวจพบ หรือป้อนผู้ให้บริการและโมเดลด้วยตนเอง
- เมื่อ onboarding เริ่มจากตัวเลือก auth ของผู้ให้บริการ ตัวเลือกโมเดลจะให้ความสำคัญกับ
  ผู้ให้บริการนั้นโดยอัตโนมัติ สำหรับ Volcengine และ BytePlus การให้ความสำคัญแบบเดียวกันนี้
  ยังครอบคลุมตัวแปรแผนแบบ coding ของพวกมันด้วย (`volcengine-plan/*`,
  `byteplus-plan/*`)
- หากตัวกรองผู้ให้บริการที่ต้องการนั้นว่าง ตัวเลือกโมเดลจะ fallback กลับไปยังแค็ตตาล็อกเต็มแทนที่จะแสดงว่าไม่มีโมเดล
- วิซาร์ดจะรันการตรวจสอบโมเดลและเตือนหากโมเดลที่กำหนดค่าไว้ไม่รู้จักหรือไม่มี auth

พาธของข้อมูลรับรองและ profile:

- Auth profile (API key + OAuth): `~/.openclaw/agents/<agentId>/agent/auth-profiles.json`
- การนำเข้า OAuth แบบเก่า: `~/.openclaw/credentials/oauth.json`

โหมดการจัดเก็บข้อมูลรับรอง:

- พฤติกรรม onboarding เริ่มต้นจะเก็บ API key เป็นค่า plaintext ใน auth profile
- `--secret-input-mode ref` จะเปิดโหมดอ้างอิงแทนการเก็บ key แบบ plaintext
  ในการตั้งค่าแบบโต้ตอบ คุณสามารถเลือกได้อย่างใดอย่างหนึ่ง:
  - environment variable ref (เช่น `keyRef: { source: "env", provider: "default", id: "OPENAI_API_KEY" }`)
  - configured provider ref (`file` หรือ `exec`) พร้อม provider alias + id
- โหมดอ้างอิงแบบโต้ตอบจะรันการตรวจสอบ preflight แบบรวดเร็วก่อนบันทึก
  - Env ref: ตรวจสอบชื่อตัวแปร + ค่าที่ไม่ว่างในสภาพแวดล้อม onboarding ปัจจุบัน
  - Provider ref: ตรวจสอบคอนฟิกของ provider และ resolve id ที่ร้องขอ
  - หาก preflight ล้มเหลว onboarding จะแสดงข้อผิดพลาดและให้คุณลองใหม่
- ในโหมดไม่โต้ตอบ `--secret-input-mode ref` รองรับเฉพาะแบบ env-backed
  - ตั้งค่าตัวแปร env ของ provider ในสภาพแวดล้อมของกระบวนการ onboarding
  - แฟล็ก key แบบ inline (เช่น `--openai-api-key`) ต้องมี env var นั้นตั้งค่าอยู่ มิฉะนั้น onboarding จะล้มเหลวทันที
  - สำหรับ custom provider โหมด `ref` แบบไม่โต้ตอบจะเก็บ `models.providers.<id>.apiKey` เป็น `{ source: "env", provider: "default", id: "CUSTOM_API_KEY" }`
  - ในกรณี custom provider นั้น `--custom-api-key` ต้องมีการตั้งค่า `CUSTOM_API_KEY` ไว้ มิฉะนั้น onboarding จะล้มเหลวทันที
- ข้อมูลรับรอง auth ของ Gateway รองรับทั้ง plaintext และ SecretRef ในการตั้งค่าแบบโต้ตอบ:
  - โหมด token: **Generate/store plaintext token** (ค่าเริ่มต้น) หรือ **Use SecretRef**
  - โหมด password: plaintext หรือ SecretRef
- พาธ token SecretRef แบบไม่โต้ตอบ: `--gateway-token-ref-env <ENV_VAR>`
- การตั้งค่า plaintext ที่มีอยู่เดิมยังคงใช้งานได้เหมือนเดิม

<Note>
คำแนะนำสำหรับระบบ headless และเซิร์ฟเวอร์: ทำ OAuth ให้เสร็จบนเครื่องที่มีเบราว์เซอร์ จากนั้นคัดลอก
`auth-profiles.json` ของเอเจนต์นั้น (เช่น
`~/.openclaw/agents/<agentId>/agent/auth-profiles.json` หรือพาธ
`$OPENCLAW_STATE_DIR/...` ที่ตรงกัน) ไปยังโฮสต์ Gateway `credentials/oauth.json`
เป็นเพียงแหล่งนำเข้าแบบเก่าเท่านั้น
</Note>

## เอาต์พุตและรายละเอียดภายใน

ฟิลด์ทั่วไปใน `~/.openclaw/openclaw.json`:

- `agents.defaults.workspace`
- `agents.defaults.model` / `models.providers` (หากเลือก MiniMax)
- `tools.profile` (onboarding ภายในเครื่องจะตั้งค่าเริ่มต้นเป็น `"coding"` เมื่อยังไม่ได้ตั้งค่า; ค่าที่ระบุไว้อย่างชัดเจนเดิมจะถูกเก็บไว้)
- `gateway.*` (mode, bind, auth, Tailscale)
- `session.dmScope` (onboarding ภายในเครื่องจะตั้งค่าเริ่มต้นนี้เป็น `per-channel-peer` เมื่อยังไม่ได้ตั้งค่า; ค่าที่ระบุไว้อย่างชัดเจนเดิมจะถูกเก็บไว้)
- `channels.telegram.botToken`, `channels.discord.token`, `channels.matrix.*`, `channels.signal.*`, `channels.imessage.*`
- allowlist ของ channel (Slack, Discord, Matrix, Microsoft Teams) เมื่อคุณเลือกใช้ระหว่างการตอบพรอมป์ต์ (ชื่อจะถูก resolve เป็น ID เมื่อทำได้)
- `skills.install.nodeManager`
  - แฟล็ก `setup --node-manager` รองรับ `npm`, `pnpm` หรือ `bun`
  - การกำหนดค่าด้วยตนเองยังคงสามารถตั้ง `skills.install.nodeManager: "yarn"` ภายหลังได้
- `wizard.lastRunAt`
- `wizard.lastRunVersion`
- `wizard.lastRunCommit`
- `wizard.lastRunCommand`
- `wizard.lastRunMode`

`openclaw agents add` จะเขียน `agents.list[]` และ `bindings` แบบไม่บังคับ

ข้อมูลรับรองของ WhatsApp จะอยู่ใต้ `~/.openclaw/credentials/whatsapp/<accountId>/`
เซสชันจะถูกเก็บไว้ใต้ `~/.openclaw/agents/<agentId>/sessions/`

<Note>
บาง channel ถูกส่งมาในรูปแบบ Plugin เมื่อเลือกใช้ระหว่างการตั้งค่า วิซาร์ด
จะถามให้ติดตั้ง Plugin (npm หรือพาธภายในเครื่อง) ก่อนการกำหนดค่า channel
</Note>

Gateway wizard RPC:

- `wizard.start`
- `wizard.next`
- `wizard.cancel`
- `wizard.status`

ไคลเอนต์ (แอป macOS และ Control UI) สามารถเรนเดอร์ขั้นตอนได้โดยไม่ต้องนำตรรกะ onboarding ไปเขียนใหม่

พฤติกรรมการตั้งค่า Signal:

- ดาวน์โหลด release asset ที่เหมาะสม
- จัดเก็บไว้ใต้ `~/.openclaw/tools/signal-cli/<version>/`
- เขียน `channels.signal.cliPath` ลงในคอนฟิก
- build แบบ JVM ต้องใช้ Java 21
- จะใช้ build แบบเนทีฟเมื่อมีให้ใช้
- Windows ใช้ WSL2 และทำตาม flow ของ signal-cli บน Linux ภายใน WSL

## เอกสารที่เกี่ยวข้อง

- ศูนย์รวม onboarding: [Onboarding (CLI)](/th/start/wizard)
- ระบบอัตโนมัติและสคริปต์: [CLI Automation](/th/start/wizard-cli-automation)
- ข้อมูลอ้างอิงคำสั่ง: [`openclaw onboard`](/th/cli/onboard)
