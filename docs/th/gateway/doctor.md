---
read_when:
    - กำลังเพิ่มหรือแก้ไข migrations ของ doctor
    - กำลังเพิ่มการเปลี่ยนแปลง config ที่อาจไม่เข้ากันย้อนหลัง
summary: 'คำสั่ง Doctor: การตรวจสุขภาพ การย้าย config และขั้นตอนการซ่อมแซม'
title: Doctor
x-i18n:
    generated_at: "2026-04-24T09:10:05Z"
    model: gpt-5.4
    provider: openai
    source_hash: 0cc0ddb91af47a246c9a37528942b7d53c166255469169d6cb0268f83359c400
    source_path: gateway/doctor.md
    workflow: 15
---

`openclaw doctor` คือเครื่องมือซ่อมแซม + ย้ายข้อมูลสำหรับ OpenClaw มันใช้แก้
config/state ที่เก่าค้าง ตรวจสุขภาพ และให้ขั้นตอนซ่อมแซมที่ทำตามได้จริง

## เริ่มต้นอย่างรวดเร็ว

```bash
openclaw doctor
```

### Headless / ระบบอัตโนมัติ

```bash
openclaw doctor --yes
```

ยอมรับค่าเริ่มต้นโดยไม่ถาม (รวมถึงขั้นตอนรีสตาร์ต/บริการ/ซ่อม sandbox เมื่อเกี่ยวข้อง)

```bash
openclaw doctor --repair
```

ใช้การซ่อมแซมที่แนะนำโดยไม่ถาม (ซ่อมแซม + รีสตาร์ตเมื่อปลอดภัย)

```bash
openclaw doctor --repair --force
```

ใช้การซ่อมแซมแบบเข้มข้นด้วย (เขียนทับ config ของ supervisor แบบกำหนดเอง)

```bash
openclaw doctor --non-interactive
```

รันโดยไม่มีการถามและใช้เฉพาะ migrations ที่ปลอดภัย (การทำ config ให้เป็นมาตรฐาน + การย้าย state บนดิสก์) ข้ามการกระทำที่เกี่ยวกับรีสตาร์ต/บริการ/sandbox ที่ต้องการการยืนยันจากมนุษย์
legacy state migrations จะรันอัตโนมัติเมื่อถูกตรวจพบ

```bash
openclaw doctor --deep
```

สแกนบริการของระบบเพื่อหา gateway installs เพิ่มเติม (launchd/systemd/schtasks)

หากคุณต้องการตรวจทานการเปลี่ยนแปลงก่อนเขียน ให้เปิดไฟล์ config ก่อน:

```bash
cat ~/.openclaw/openclaw.json
```

## สิ่งที่มันทำ (สรุป)

- อัปเดตล่วงหน้าแบบไม่บังคับสำหรับการติดตั้งจาก git (เฉพาะแบบ interactive)
- ตรวจความใหม่ของโปรโตคอล UI (สร้าง Control UI ใหม่เมื่อ schema ของโปรโตคอลใหม่กว่า)
- ตรวจสุขภาพ + ถามเพื่อรีสตาร์ต
- สรุปสถานะ Skills (ใช้งานได้/ขาดหาย/ถูกบล็อก) และสถานะ plugin
- ทำ config ให้เป็นมาตรฐานสำหรับค่าแบบ legacy
- ย้าย config ของ Talk จากฟิลด์ `talk.*` แบบแบนเดิมไปเป็น `talk.provider` + `talk.providers.<provider>`
- ตรวจ migration ของเบราว์เซอร์สำหรับ Chrome extension config แบบ legacy และความพร้อมของ Chrome MCP
- คำเตือนสำหรับการ override OpenCode provider (`models.providers.opencode` / `models.providers.opencode-go`)
- คำเตือนเรื่อง Codex OAuth shadowing (`models.providers.openai-codex`)
- ตรวจข้อกำหนดเบื้องต้นด้าน OAuth TLS สำหรับ OpenAI Codex OAuth profiles
- ย้าย legacy on-disk state (sessions/agent dir/WhatsApp auth)
- ย้าย legacy plugin manifest contract key (`speechProviders`, `realtimeTranscriptionProviders`, `realtimeVoiceProviders`, `mediaUnderstandingProviders`, `imageGenerationProviders`, `videoGenerationProviders`, `webFetchProviders`, `webSearchProviders` → `contracts`)
- ย้าย legacy cron store (`jobId`, `schedule.cron`, ฟิลด์ delivery/payload ระดับบนสุด, payload `provider`, งาน webhook fallback แบบง่าย `notify: true`)
- ตรวจไฟล์ล็อกของเซสชันและล้าง stale lock
- ตรวจความสมบูรณ์ของ state และสิทธิ์การเข้าถึง (sessions, transcripts, state dir)
- ตรวจสิทธิ์ไฟล์ config (chmod 600) เมื่อรันในเครื่อง
- สุขภาพของ model auth: ตรวจการหมดอายุของ OAuth, สามารถรีเฟรชโทเค็นที่ใกล้หมดอายุ และรายงานสถานะ cooldown/disabled ของ auth-profile
- ตรวจหา workspace dir เพิ่มเติม (`~/openclaw`)
- ซ่อม image ของ sandbox เมื่อเปิดใช้ sandboxing
- ย้ายบริการแบบ legacy และตรวจหา gateways เพิ่มเติม
- ย้าย legacy state ของ Matrix channel (ในโหมด `--fix` / `--repair`)
- ตรวจ runtime ของ Gateway (ติดตั้งบริการแล้วแต่ยังไม่ทำงาน; cached launchd label)
- คำเตือนสถานะ channel (probe จาก gateway ที่กำลังรัน)
- ตรวจสอบ config ของ supervisor (launchd/systemd/schtasks) พร้อมตัวเลือกซ่อม
- ตรวจแนวปฏิบัติที่ดีของ Gateway runtime (Node เทียบกับ Bun, พาธจาก version manager)
- การวินิจฉัยการชนกันของพอร์ต Gateway (ค่าเริ่มต้น `18789`)
- คำเตือนด้านความปลอดภัยสำหรับ DM policy แบบเปิด
- ตรวจ auth ของ Gateway สำหรับ local token mode (เสนอการสร้าง token เมื่อไม่มีแหล่ง token; ไม่เขียนทับ token SecretRef configs)
- ตรวจปัญหาการ pairing อุปกรณ์ (คำขอ pair ครั้งแรกที่ค้างอยู่, การอัปเกรด role/scope ที่ค้าง, stale local device-token cache drift และ paired-record auth drift)
- ตรวจ systemd linger บน Linux
- ตรวจขนาดไฟล์ bootstrap ของ workspace (คำเตือนเรื่อง truncation/ใกล้ถึงขีดจำกัดสำหรับไฟล์บริบท)
- ตรวจสถานะ shell completion และติดตั้ง/อัปเกรดอัตโนมัติ
- ตรวจความพร้อมของ embedding provider สำหรับการค้นหา memory (local model, remote API key หรือไบนารี QMD)
- ตรวจการติดตั้งจาก source (pnpm workspace ไม่ตรงกัน, ไม่มี UI assets, ไม่มีไบนารี tsx)
- เขียน config และ wizard metadata ที่อัปเดตแล้ว

## Dreams UI backfill และ reset

ฉาก Dreams ของ Control UI มีการกระทำ **Backfill**, **Reset** และ **Clear Grounded**
สำหรับเวิร์กโฟลว์ grounded dreaming การกระทำเหล่านี้ใช้เมธอด RPC
แบบ doctor-style ของ gateway แต่ **ไม่ใช่** ส่วนหนึ่งของการซ่อมแซม/ย้ายข้อมูลใน CLI `openclaw doctor`

สิ่งที่มันทำ:

- **Backfill** สแกนไฟล์ `memory/YYYY-MM-DD.md` ในอดีตใน
  workspace ที่ใช้งานอยู่ รัน grounded REM diary pass และเขียนรายการ backfill
  แบบย้อนกลับได้ลงใน `DREAMS.md`
- **Reset** ลบเฉพาะรายการไดอารี backfill ที่มีเครื่องหมายไว้จาก `DREAMS.md`
- **Clear Grounded** ลบเฉพาะรายการ short-term แบบ grounded-only ที่ staged ไว้
  ซึ่งมาจากการเล่นย้อนหลังของประวัติ และยังไม่ได้สะสม live recall หรือ
  daily support

สิ่งที่มัน **ไม่** ทำด้วยตัวเอง:

- มันไม่แก้ไข `MEMORY.md`
- มันไม่รัน doctor migrations แบบเต็ม
- มันไม่ stage grounded candidates เข้าไปใน live short-term
  promotion store โดยอัตโนมัติ เว้นแต่คุณจะรันเส้นทาง CLI แบบ staged ก่อนอย่างชัดเจน

หากคุณต้องการให้การเล่นย้อนหลังแบบ grounded ของประวัติส่งผลต่อ deep promotion lane
ปกติ ให้ใช้โฟลว์ CLI แทน:

```bash
openclaw memory rem-backfill --path ./memory --stage-short-term
```

คำสั่งนี้จะ stage grounded durable candidates เข้าไปใน short-term dreaming store ขณะเดียวกันก็ยังใช้
`DREAMS.md` เป็นพื้นผิวสำหรับการทบทวน

## พฤติกรรมและเหตุผลโดยละเอียด

### 0) อัปเดตแบบไม่บังคับ (การติดตั้งจาก git)

หากนี่คือ git checkout และ doctor กำลังทำงานแบบ interactive มันจะเสนอให้
อัปเดต (fetch/rebase/build) ก่อนรัน doctor

### 1) การทำ config ให้เป็นมาตรฐาน

หาก config มีรูปแบบค่าแบบ legacy (เช่น `messages.ackReaction`
โดยไม่มีการ override เฉพาะ channel) doctor จะทำให้เป็น schema
ปัจจุบัน

ซึ่งรวมถึงฟิลด์ Talk แบบแบนเดิมด้วย ปัจจุบัน public Talk config คือ
`talk.provider` + `talk.providers.<provider>` doctor จะเขียนรูปแบบเก่า
อย่าง `talk.voiceId` / `talk.voiceAliases` / `talk.modelId` / `talk.outputFormat` /
`talk.apiKey` ใหม่ให้อยู่ใน provider map

### 2) การย้าย legacy config keys

เมื่อ config มี keys ที่เลิกใช้แล้ว คำสั่งอื่นจะปฏิเสธการทำงานและขอ
ให้คุณรัน `openclaw doctor`

Doctor จะ:

- อธิบายว่าพบ legacy keys ใดบ้าง
- แสดง migration ที่มันใช้ไป
- เขียน `~/.openclaw/openclaw.json` ใหม่ด้วย schema ที่อัปเดตแล้ว

Gateway จะรัน doctor migrations อัตโนมัติระหว่างเริ่มต้นด้วยเมื่อมันตรวจพบ
รูปแบบ config แบบ legacy ดังนั้น config เก่าค้างจะถูกซ่อมโดยไม่ต้องทำเอง
cron job store migrations จัดการโดย `openclaw doctor --fix`

migrations ปัจจุบัน:

- `routing.allowFrom` → `channels.whatsapp.allowFrom`
- `routing.groupChat.requireMention` → `channels.whatsapp/telegram/imessage.groups."*".requireMention`
- `routing.groupChat.historyLimit` → `messages.groupChat.historyLimit`
- `routing.groupChat.mentionPatterns` → `messages.groupChat.mentionPatterns`
- `routing.queue` → `messages.queue`
- `routing.bindings` → `bindings` ระดับบนสุด
- `routing.agents`/`routing.defaultAgentId` → `agents.list` + `agents.list[].default`
- `talk.voiceId`/`talk.voiceAliases`/`talk.modelId`/`talk.outputFormat`/`talk.apiKey` แบบ legacy → `talk.provider` + `talk.providers.<provider>`
- `routing.agentToAgent` → `tools.agentToAgent`
- `routing.transcribeAudio` → `tools.media.audio.models`
- `messages.tts.<provider>` (`openai`/`elevenlabs`/`microsoft`/`edge`) → `messages.tts.providers.<provider>`
- `channels.discord.voice.tts.<provider>` (`openai`/`elevenlabs`/`microsoft`/`edge`) → `channels.discord.voice.tts.providers.<provider>`
- `channels.discord.accounts.<id>.voice.tts.<provider>` (`openai`/`elevenlabs`/`microsoft`/`edge`) → `channels.discord.accounts.<id>.voice.tts.providers.<provider>`
- `plugins.entries.voice-call.config.tts.<provider>` (`openai`/`elevenlabs`/`microsoft`/`edge`) → `plugins.entries.voice-call.config.tts.providers.<provider>`
- `plugins.entries.voice-call.config.provider: "log"` → `"mock"`
- `plugins.entries.voice-call.config.twilio.from` → `plugins.entries.voice-call.config.fromNumber`
- `plugins.entries.voice-call.config.streaming.sttProvider` → `plugins.entries.voice-call.config.streaming.provider`
- `plugins.entries.voice-call.config.streaming.openaiApiKey|sttModel|silenceDurationMs|vadThreshold`
  → `plugins.entries.voice-call.config.streaming.providers.openai.*`
- `bindings[].match.accountID` → `bindings[].match.accountId`
- สำหรับ channels ที่มี `accounts` แบบมีชื่อ แต่ยังมีค่าระดับบนสุดของ channel แบบ single-account ค้างอยู่ ให้ย้ายค่าระดับบัญชีนั้นไปยังบัญชีที่ถูกยกระดับซึ่งเลือกสำหรับ channel นั้น (`accounts.default` สำหรับ channels ส่วนใหญ่; Matrix สามารถเก็บเป้าหมายแบบมีชื่อ/ค่าเริ่มต้นที่ตรงกันอยู่แล้วไว้ได้)
- `identity` → `agents.list[].identity`
- `agent.*` → `agents.defaults` + `tools.*` (tools/elevated/exec/sandbox/subagents)
- `agent.model`/`allowedModels`/`modelAliases`/`modelFallbacks`/`imageModelFallbacks`
  → `agents.defaults.models` + `agents.defaults.model.primary/fallbacks` + `agents.defaults.imageModel.primary/fallbacks`
- `browser.ssrfPolicy.allowPrivateNetwork` → `browser.ssrfPolicy.dangerouslyAllowPrivateNetwork`
- `browser.profiles.*.driver: "extension"` → `"existing-session"`
- ลบ `browser.relayBindHost` (การตั้งค่า extension relay แบบ legacy)

คำเตือนของ doctor ยังรวมถึงคำแนะนำเรื่อง account-default สำหรับ multi-account channels ด้วย:

- หากมีการกำหนดค่า `channels.<channel>.accounts` สองรายการขึ้นไปโดยไม่มี `channels.<channel>.defaultAccount` หรือ `accounts.default`, doctor จะเตือนว่า fallback routing อาจเลือกบัญชีที่ไม่คาดคิด
- หาก `channels.<channel>.defaultAccount` ถูกตั้งเป็น account ID ที่ไม่รู้จัก doctor จะเตือนและแสดงรายการ account IDs ที่กำหนดค่าไว้

### 2b) การ override OpenCode provider

หากคุณเพิ่ม `models.providers.opencode`, `opencode-zen` หรือ `opencode-go`
ด้วยตนเอง มันจะ override แค็ตตาล็อก OpenCode ที่มีมาในตัวจาก `@mariozechner/pi-ai`
ซึ่งอาจบังคับให้ models ไปใช้ API ผิดตัว หรือทำให้ค่าใช้จ่ายกลายเป็นศูนย์ Doctor จะเตือนเพื่อให้
คุณลบ override ออก แล้วคืนการ route API + ค่าใช้จ่ายราย model ให้กลับมา

### 2c) การย้ายเบราว์เซอร์และความพร้อมของ Chrome MCP

หาก browser config ของคุณยังชี้ไปยังเส้นทาง Chrome extension ที่ถูกลบไปแล้ว doctor
จะทำให้เป็นรูปแบบปัจจุบันของ host-local Chrome MCP attach model:

- `browser.profiles.*.driver: "extension"` จะกลายเป็น `"existing-session"`
- `browser.relayBindHost` จะถูกลบออก

Doctor ยังตรวจเส้นทาง host-local Chrome MCP ด้วยเมื่อคุณใช้ `defaultProfile:
"user"` หรือโปรไฟล์ `existing-session` ที่กำหนดค่าไว้:

- ตรวจว่า Google Chrome ติดตั้งอยู่บนโฮสต์เดียวกันหรือไม่สำหรับโปรไฟล์ auto-connect
  แบบเริ่มต้น
- ตรวจเวอร์ชัน Chrome ที่พบ และเตือนเมื่อเวอร์ชันต่ำกว่า Chrome 144
- เตือนให้คุณเปิดใช้ remote debugging ในหน้า inspect ของเบราว์เซอร์ (เช่น `chrome://inspect/#remote-debugging`, `brave://inspect/#remote-debugging`
  หรือ `edge://inspect/#remote-debugging`)

Doctor ไม่สามารถเปิดการตั้งค่าฝั่ง Chrome ให้คุณได้ เส้นทาง host-local Chrome MCP
ยังคงต้องมี:

- เบราว์เซอร์ที่อิง Chromium เวอร์ชัน 144+ บนโฮสต์ gateway/node
- เบราว์เซอร์ที่กำลังทำงานในเครื่อง
- เปิดใช้ remote debugging ในเบราว์เซอร์นั้น
- อนุมัติพรอมป์ต์ยินยอม attach ครั้งแรกในเบราว์เซอร์

ความพร้อมในที่นี้หมายถึงเฉพาะข้อกำหนดเบื้องต้นสำหรับการ attach ในเครื่องเท่านั้น `existing-session` ยังคงมีข้อจำกัดของเส้นทาง Chrome MCP ปัจจุบัน; เส้นทางขั้นสูงอย่าง `responsebody`, การส่งออก PDF, download interception และ batch actions ยังต้องใช้ managed
browser หรือโปรไฟล์ CDP แบบดิบ

การตรวจนี้ **ไม่** ใช้กับโฟลว์ Docker, sandbox, remote-browser หรือ
headless อื่นๆ ซึ่งยังคงใช้ CDP แบบดิบต่อไป

### 2d) ข้อกำหนดเบื้องต้นด้าน OAuth TLS

เมื่อมีการกำหนดค่า OpenAI Codex OAuth profile ไว้ doctor จะ probe
endpoint สำหรับการยืนยันตัวตนของ OpenAI เพื่อตรวจสอบว่า local Node/OpenSSL TLS stack
สามารถตรวจสอบ certificate chain ได้ หาก probe ล้มเหลวด้วยข้อผิดพลาดด้าน certificate (เช่น
`UNABLE_TO_GET_ISSUER_CERT_LOCALLY`, cert หมดอายุ หรือ self-signed cert)
doctor จะแสดงคำแนะนำการแก้ไขตามแพลตฟอร์ม บน macOS ที่ใช้ Homebrew Node วิธีแก้
มักจะเป็น `brew postinstall ca-certificates` เมื่อใช้ `--deep` การ probe นี้จะรัน
แม้ gateway จะปกติดีอยู่ก็ตาม

### 2c) การ override Codex OAuth provider

หากก่อนหน้านี้คุณได้เพิ่มการตั้งค่า OpenAI transport แบบ legacy ไว้ภายใต้
`models.providers.openai-codex` การตั้งค่านั้นอาจไปบดบังเส้นทาง
provider ของ Codex OAuth ที่มีมาในตัว ซึ่งรุ่นใหม่ใช้โดยอัตโนมัติ Doctor จะเตือนเมื่อมันเห็น
การตั้งค่า transport แบบเก่าเหล่านั้นร่วมกับ Codex OAuth เพื่อให้คุณลบหรือเขียน
transport override ที่ล้าสมัยนั้นใหม่ แล้วได้พฤติกรรม routing/fallback ที่มีมาในตัว
กลับคืนมา การใช้ custom proxies และการ override เฉพาะ headers ยังคงรองรับอยู่และจะไม่
ทำให้เกิดคำเตือนนี้

### 3) Legacy state migrations (โครงสร้างบนดิสก์)

Doctor สามารถย้ายโครงสร้างบนดิสก์รุ่นเก่าไปยังโครงสร้างปัจจุบันได้:

- ที่เก็บ sessions + transcripts:
  - จาก `~/.openclaw/sessions/` ไปยัง `~/.openclaw/agents/<agentId>/sessions/`
- agent dir:
  - จาก `~/.openclaw/agent/` ไปยัง `~/.openclaw/agents/<agentId>/agent/`
- สถานะ auth ของ WhatsApp (Baileys):
  - จาก `~/.openclaw/credentials/*.json` แบบ legacy (ยกเว้น `oauth.json`)
  - ไปยัง `~/.openclaw/credentials/whatsapp/<accountId>/...` (account id เริ่มต้น: `default`)

migrations เหล่านี้เป็นแบบ best-effort และทำซ้ำได้อย่างปลอดภัย; doctor จะส่งคำเตือนเมื่อ
มันปล่อยโฟลเดอร์ legacy ใดๆ ไว้เป็นข้อมูลสำรอง Gateway/CLI ยังย้าย
legacy sessions + agent dir อัตโนมัติระหว่างเริ่มต้นระบบด้วย เพื่อให้ประวัติ/auth/models ไปอยู่ใน
พาธต่อเอเจนต์โดยไม่ต้องรัน doctor เอง การย้าย WhatsApp auth ตั้งใจให้ทำผ่าน
`openclaw doctor` เท่านั้น ตอนนี้การทำ Talk provider/provider-map ให้เป็นมาตรฐานจะ
เปรียบเทียบด้วยความเท่ากันเชิงโครงสร้าง ดังนั้นความต่างที่มีแค่ลำดับของคีย์จึงไม่ทำให้เกิด
การเปลี่ยนแปลง `doctor --fix` แบบ no-op ซ้ำๆ อีก

### 3a) Legacy plugin manifest migrations

Doctor จะสแกน manifests ของ plugins ที่ติดตั้งทั้งหมดเพื่อหาคีย์ capability ระดับบนสุด
ที่เลิกใช้แล้ว (`speechProviders`, `realtimeTranscriptionProviders`,
`realtimeVoiceProviders`, `mediaUnderstandingProviders`,
`imageGenerationProviders`, `videoGenerationProviders`, `webFetchProviders`,
`webSearchProviders`) เมื่อพบ มันจะเสนอให้ย้ายสิ่งเหล่านั้นไปไว้ในออบเจ็กต์ `contracts`
และเขียนไฟล์ manifest ใหม่ในตำแหน่งเดิม การย้ายนี้ทำซ้ำได้อย่างปลอดภัย;
หากคีย์ `contracts` มีค่าเดียวกันอยู่แล้ว คีย์ legacy จะถูกลบออก
โดยไม่ทำข้อมูลซ้ำ

### 3b) Legacy cron store migrations

Doctor จะตรวจ cron job store ด้วย (`~/.openclaw/cron/jobs.json` โดยค่าเริ่มต้น
หรือ `cron.store` หากมีการ override) เพื่อหา job shapes แบบเก่าที่ตัว scheduler ยัง
ยอมรับได้เพื่อความเข้ากันได้

การทำความสะอาด cron ปัจจุบันรวมถึง:

- `jobId` → `id`
- `schedule.cron` → `schedule.expr`
- ฟิลด์ payload ระดับบนสุด (`message`, `model`, `thinking`, ...) → `payload`
- ฟิลด์ delivery ระดับบนสุด (`deliver`, `channel`, `to`, `provider`, ...) → `delivery`
- delivery aliases ของ payload `provider` → `delivery.channel` แบบชัดเจน
- งาน webhook fallback แบบ legacy `notify: true` ธรรมดา → `delivery.mode="webhook"` แบบชัดเจน พร้อม `delivery.to=cron.webhook`

Doctor จะย้าย jobs แบบ `notify: true` อัตโนมัติเฉพาะเมื่อมันทำได้โดย
ไม่เปลี่ยนพฤติกรรม หาก job ใดรวม notify fallback แบบ legacy เข้ากับโหมด
delivery แบบไม่ใช่ webhook ที่มีอยู่แล้ว doctor จะเตือนและปล่อย job นั้นไว้ให้ตรวจทานเอง

### 3c) การล้าง session lock

Doctor จะสแกนไดเรกทอรี session ของทุกเอเจนต์เพื่อหาไฟล์ write-lock ที่ค้างอยู่ — ไฟล์ที่
เหลือทิ้งไว้เมื่อเซสชันปิดตัวผิดปกติ สำหรับแต่ละไฟล์ล็อกที่พบ มันจะรายงาน:
พาธ, PID, PID ยังมีชีวิตอยู่หรือไม่, อายุของล็อก และถือว่า
เป็น stale หรือไม่ (PID ตายแล้วหรือเก่ากว่า 30 นาที) ในโหมด `--fix` / `--repair`
มันจะลบไฟล์ล็อกที่ stale โดยอัตโนมัติ; ถ้าไม่ใช่ มันจะพิมพ์หมายเหตุและ
บอกให้คุณรันใหม่ด้วย `--fix`

### 4) การตรวจความสมบูรณ์ของ state (การคงอยู่ของเซสชัน การ route และความปลอดภัย)

state directory คือแกนประสาทการปฏิบัติงาน ถ้ามันหายไป คุณจะสูญเสีย
sessions, credentials, logs และ config (เว้นแต่คุณจะมีข้อมูลสำรองที่อื่น)

Doctor ตรวจสิ่งต่อไปนี้:

- **ไม่มี state dir**: เตือนเรื่องการสูญเสีย state แบบรุนแรง, ถามเพื่อสร้าง
  ไดเรกทอรีใหม่ และเตือนว่ามันไม่สามารถกู้ข้อมูลที่หายไปได้
- **สิทธิ์ของ state dir**: ตรวจสอบว่าสามารถเขียนได้หรือไม่; เสนอให้ซ่อมสิทธิ์
  (และแสดงคำแนะนำ `chown` เมื่อพบว่าเจ้าของ/กลุ่มไม่ตรงกัน)
- **state dir บน macOS ที่ซิงก์กับคลาวด์**: เตือนเมื่อ state ชี้ไปอยู่ภายใต้ iCloud Drive
  (`~/Library/Mobile Documents/com~apple~CloudDocs/...`) หรือ
  `~/Library/CloudStorage/...` เพราะพาธที่รองรับด้วยการซิงก์อาจทำให้ I/O ช้าลง
  และเกิด lock/sync races
- **state dir บน Linux ที่อยู่บน SD หรือ eMMC**: เตือนเมื่อ state ชี้ไปยัง mount source แบบ `mmcblk*`
  เพราะ random I/O บน SD หรือ eMMC อาจช้ากว่าและสึกหรอได้เร็วกว่าภายใต้การเขียน sessions และ credentials
- **ไม่มี session dirs**: `sessions/` และไดเรกทอรีที่เก็บ session store เป็นสิ่งจำเป็น
  เพื่อคงประวัติไว้และหลีกเลี่ยงการล่มแบบ `ENOENT`
- **transcript ไม่ตรงกัน**: เตือนเมื่อรายการเซสชันล่าสุดมี
  transcript files ที่หายไป
- **เซสชันหลักแบบ “1-line JSONL”**: แจ้งเตือนเมื่อ transcript หลักมีเพียงหนึ่งบรรทัด (ประวัติไม่สะสม)
- **หลาย state dirs**: เตือนเมื่อมีหลายโฟลเดอร์ `~/.openclaw` อยู่ในหลาย
  home directories หรือเมื่อ `OPENCLAW_STATE_DIR` ชี้ไปที่อื่น (ประวัติอาจ
  แยกกันระหว่าง installs)
- **การเตือนโหมด remote**: หาก `gateway.mode=remote`, doctor จะเตือนให้คุณรัน
  บนโฮสต์ remote (เพราะ state อยู่ที่นั่น)
- **สิทธิ์ไฟล์ config**: เตือนหาก `~/.openclaw/openclaw.json` สามารถอ่านได้โดย
  group/world และเสนอให้ทำให้เข้มงวดเป็น `600`

### 5) สุขภาพของ model auth (การหมดอายุของ OAuth)

Doctor จะตรวจ OAuth profiles ใน auth store, เตือนเมื่อโทเค็น
ใกล้หมดอายุ/หมดอายุแล้ว และสามารถรีเฟรชได้เมื่อปลอดภัย หาก Anthropic
OAuth/token profile เก่าค้าง มันจะเสนอให้ใช้ Anthropic API key หรือ
เส้นทาง Anthropic setup-token
พรอมป์ต์สำหรับรีเฟรชจะแสดงเฉพาะเมื่อรันแบบ interactive (TTY); `--non-interactive`
จะข้ามการพยายามรีเฟรช

เมื่อการรีเฟรช OAuth ล้มเหลวถาวร (เช่น `refresh_token_reused`,
`invalid_grant` หรือ provider บอกให้คุณลงชื่อเข้าใช้อีกครั้ง) doctor จะรายงาน
ว่าต้อง re-auth และพิมพ์คำสั่ง `openclaw models auth login --provider ...`
ที่ต้องรันแบบตรงตัว

Doctor ยังรายงาน auth profiles ที่ใช้งานไม่ได้ชั่วคราวเนื่องจาก:

- cooldown สั้นๆ (rate limits/timeouts/auth failures)
- การปิดใช้งานที่นานกว่า (billing/credit failures)

### 6) การตรวจสอบ model ของ hooks

หากตั้งค่า `hooks.gmail.model` ไว้ doctor จะตรวจสอบ model reference เทียบกับ
catalog และ allowlist และเตือนเมื่อมัน resolve ไม่ได้หรือไม่ได้รับอนุญาต

### 7) การซ่อม image ของ sandbox

เมื่อเปิดใช้ sandboxing doctor จะตรวจ Docker images และเสนอให้ build หรือ
สลับไปใช้ชื่อแบบ legacy หาก image ปัจจุบันไม่มีอยู่

### 7b) runtime deps ของ bundled plugin

Doctor จะตรวจ runtime dependencies เฉพาะสำหรับ bundled plugins ที่ active อยู่ใน
config ปัจจุบันหรือถูกเปิดใช้โดยค่าเริ่มต้นของ bundled manifest เช่น
`plugins.entries.discord.enabled: true`, แบบ legacy
`channels.discord.enabled: true` หรือ bundled provider ที่เปิดใช้โดยค่าเริ่มต้น หากมีสิ่งใดหายไป doctor จะรายงานแพ็กเกจเหล่านั้นและติดตั้งให้ใน
โหมด `openclaw doctor --fix` / `openclaw doctor --repair` ส่วน external plugins ยังคง
ใช้ `openclaw plugins install` / `openclaw plugins update`; doctor จะไม่
ติดตั้ง dependencies ให้กับ plugin paths ใดๆ ตามอำเภอใจ

### 8) การย้ายบริการ Gateway และคำแนะนำการทำความสะอาด

Doctor ตรวจพบบริการ gateway แบบ legacy (launchd/systemd/schtasks) และ
เสนอให้ลบออกแล้วติดตั้งบริการ OpenClaw โดยใช้พอร์ต gateway
ปัจจุบัน นอกจากนี้ยังสามารถสแกนหา services คล้าย gateway เพิ่มเติมและพิมพ์คำแนะนำการทำความสะอาดได้
บริการ OpenClaw gateway ที่ตั้งชื่อตาม profile ถือเป็นสิ่งที่รองรับอย่างสมบูรณ์และจะไม่ถูก
แจ้งว่าเป็น "extra"

### 8b) การย้าย Matrix ตอนเริ่มต้นระบบ

เมื่อบัญชี Matrix channel มี legacy state migration ที่รอดำเนินการหรือดำเนินการได้
doctor (ในโหมด `--fix` / `--repair`) จะสร้าง snapshot ก่อน migration แล้ว
รันขั้นตอนการย้ายแบบ best-effort: การย้าย legacy Matrix state และการเตรียม
legacy encrypted-state ทั้งสองขั้นตอนนี้ไม่เป็น fatal; ข้อผิดพลาดจะถูกบันทึกและ
การเริ่มต้นระบบจะดำเนินต่อไป ในโหมดอ่านอย่างเดียว (`openclaw doctor` โดยไม่มี `--fix`) การตรวจนี้
จะถูกข้ามทั้งหมด

### 8c) การ pairing อุปกรณ์และ auth drift

ตอนนี้ doctor จะตรวจสถานะ device-pairing เป็นส่วนหนึ่งของ health pass ปกติ

สิ่งที่มันรายงาน:

- คำขอ pairing ครั้งแรกที่รอดำเนินการ
- การอัปเกรด role สำหรับอุปกรณ์ที่ pair แล้วแต่ยังค้างอยู่
- การอัปเกรด scope สำหรับอุปกรณ์ที่ pair แล้วแต่ยังค้างอยู่
- การซ่อมความไม่ตรงกันของ public-key ในกรณีที่ device id ยังตรงกัน แต่
  identity ของอุปกรณ์ไม่ตรงกับบันทึกที่ได้รับอนุมัติแล้ว
- บันทึกที่ pair แล้วแต่ไม่มี active token สำหรับ role ที่ได้รับอนุมัติ
- paired tokens ที่ scopes เบี่ยงเบนออกจาก baseline ที่ pairing อนุมัติไว้
- รายการ local cached device-token สำหรับเครื่องปัจจุบันที่เก่ากว่า
  การหมุน token ฝั่ง gateway หรือมี metadata ของ scope ที่ล้าสมัย

Doctor จะไม่อนุมัติคำขอ pair อัตโนมัติหรือหมุน device tokens อัตโนมัติ แต่จะ
พิมพ์ขั้นตอนถัดไปที่ต้องทำให้แบบตรงตัวแทน:

- ตรวจคำขอที่รอดำเนินการด้วย `openclaw devices list`
- อนุมัติคำขอที่แน่นอนด้วย `openclaw devices approve <requestId>`
- หมุน token ใหม่ด้วย `openclaw devices rotate --device <deviceId> --role <role>`
- ลบและอนุมัติบันทึกเก่าค้างใหม่ด้วย `openclaw devices remove <deviceId>`

สิ่งนี้ช่วยปิดช่องโหว่ที่พบบ่อยแบบ "pair แล้วแต่ยังเจอ pairing required"
ตอนนี้ doctor จะแยกแยะได้ว่ากรณีไหนเป็น pairing ครั้งแรก กรณีไหนเป็นการอัปเกรด role/scope
ที่ค้างอยู่ และกรณีไหนเป็น stale token/device-identity drift

### 9) คำเตือนด้านความปลอดภัย

Doctor จะส่งคำเตือนเมื่อ provider เปิดรับ DMs โดยไม่มี allowlist หรือ
เมื่อนโยบายถูกกำหนดในรูปแบบที่อันตราย

### 10) systemd linger (Linux)

หากทำงานเป็น systemd user service doctor จะตรวจให้แน่ใจว่าเปิด lingering ไว้ เพื่อให้
gateway ยังคงทำงานหลังออกจากระบบ

### 11) สถานะ workspace (Skills, plugins และ legacy dirs)

Doctor จะพิมพ์สรุปสถานะ workspace สำหรับเอเจนต์เริ่มต้น:

- **สถานะ Skills**: นับจำนวน Skills ที่ใช้งานได้, ขาดข้อกำหนด และถูกบล็อกด้วย allowlist
- **legacy workspace dirs**: เตือนเมื่อมี `~/openclaw` หรือไดเรกทอรี workspace แบบ legacy อื่นๆ
  อยู่ควบคู่กับ workspace ปัจจุบัน
- **สถานะ plugin**: นับ loaded/disabled/errored plugins; แสดง plugin IDs สำหรับรายการที่
  มีข้อผิดพลาด; รายงานความสามารถของ bundled plugin
- **คำเตือนเรื่องความเข้ากันได้ของ plugin**: แจ้งเตือน plugins ที่มีปัญหาความเข้ากันได้กับ
  runtime ปัจจุบัน
- **การวินิจฉัย plugin**: แสดงคำเตือนหรือข้อผิดพลาดใดๆ ที่ถูกปล่อยออกมาระหว่างโหลดโดย
  plugin registry

### 11b) ขนาดไฟล์ Bootstrap

Doctor จะตรวจว่าไฟล์ bootstrap ของ workspace (เช่น `AGENTS.md`,
`CLAUDE.md` หรือไฟล์บริบทอื่นๆ ที่ถูก inject) ใกล้หรือเกิน
งบอักขระที่กำหนดไว้หรือไม่ มันจะรายงานจำนวนอักขระต่อไฟล์แบบ raw เทียบกับแบบ injected, เปอร์เซ็นต์การ truncation
, สาเหตุของการ truncation (`max/file` หรือ `max/total`) และจำนวนอักขระที่ถูก inject ทั้งหมด
เทียบเป็นสัดส่วนกับงบรวมทั้งหมด เมื่อไฟล์ถูก truncate หรือใกล้ถึงขีดจำกัด
doctor จะพิมพ์คำแนะนำสำหรับการปรับ `agents.defaults.bootstrapMaxChars`
และ `agents.defaults.bootstrapTotalMaxChars`

### 11c) Shell completion

Doctor จะตรวจว่าได้ติดตั้ง tab completion สำหรับ shell ปัจจุบัน
(zsh, bash, fish หรือ PowerShell) หรือไม่:

- หากโปรไฟล์ shell ใช้รูปแบบ dynamic completion ที่ช้า
  (`source <(openclaw completion ...)`) doctor จะอัปเกรดเป็น
  รูปแบบไฟล์แคชที่เร็วกว่า
- หากมีการกำหนด completion ในโปรไฟล์แล้วแต่ไม่มีไฟล์แคช
  doctor จะสร้างแคชใหม่ให้อัตโนมัติ
- หากยังไม่ได้กำหนด completion เลย doctor จะถามเพื่อติดตั้ง
  (เฉพาะโหมด interactive; ข้ามเมื่อใช้ `--non-interactive`)

รัน `openclaw completion --write-state` เพื่อสร้างแคชใหม่ด้วยตนเอง

### 12) การตรวจ auth ของ Gateway (local token)

Doctor จะตรวจความพร้อมของ local gateway token auth

- หาก token mode ต้องใช้ token และไม่มีแหล่ง token อยู่ doctor จะเสนอให้สร้างใหม่
- หาก `gateway.auth.token` ถูกจัดการด้วย SecretRef แต่ใช้งานไม่ได้ doctor จะเตือนและจะไม่เขียนทับด้วย plaintext
- `openclaw doctor --generate-gateway-token` จะบังคับสร้างเฉพาะเมื่อไม่มี token SecretRef ถูกกำหนดไว้

### 12b) การซ่อมแซมแบบ read-only ที่รับรู้ SecretRef

บาง flow ของการซ่อมแซมจำเป็นต้องตรวจ credentials ที่กำหนดค่าไว้โดยไม่ทำให้พฤติกรรม fail-fast ของ runtime อ่อนลง

- `openclaw doctor --fix` ตอนนี้ใช้โมเดลสรุป SecretRef แบบอ่านอย่างเดียวเดียวกับคำสั่งตระกูล status สำหรับการซ่อม targeted config
- ตัวอย่าง: การซ่อม `allowFrom` / `groupAllowFrom` ของ Telegram แบบ `@username` จะพยายามใช้ credentials ของบอทที่กำหนดค่าไว้เมื่อมี
- หาก bot token ของ Telegram ถูกกำหนดค่าผ่าน SecretRef แต่ไม่พร้อมใช้งานในเส้นทางคำสั่งปัจจุบัน doctor จะรายงานว่า credential ถูกกำหนดค่าไว้แต่ใช้งานไม่ได้ และจะข้ามการ resolve อัตโนมัติแทนที่จะล้มเหลวหรือรายงานผิดว่าไม่มี token

### 13) การตรวจสุขภาพของ Gateway + การรีสตาร์ต

Doctor จะรัน health check และเสนอให้รีสตาร์ต gateway เมื่อมันดู
ไม่ปกติ

### 13b) ความพร้อมของการค้นหา memory

Doctor จะตรวจว่า embedding provider สำหรับการค้นหา memory ที่กำหนดค่าไว้พร้อมใช้งาน
สำหรับเอเจนต์เริ่มต้นหรือไม่ พฤติกรรมขึ้นอยู่กับ backend และ provider ที่กำหนดค่าไว้:

- **QMD backend**: probe ว่ามีไบนารี `qmd` และเริ่มทำงานได้หรือไม่
  หากไม่ได้ จะพิมพ์คำแนะนำการแก้ไขรวมถึงแพ็กเกจ npm และตัวเลือกพาธไบนารีแบบกำหนดเอง
- **local provider แบบระบุชัดเจน**: ตรวจหาไฟล์ model ในเครื่องหรือ
  URL ของโมเดลแบบ remote/ดาวน์โหลดได้ที่รู้จัก หากไม่มี จะเสนอให้เปลี่ยนไปใช้ remote provider
- **explicit remote provider** (`openai`, `voyage` ฯลฯ): ตรวจว่า API key
  มีอยู่ใน environment หรือ auth store หรือไม่ หากไม่มี จะพิมพ์คำแนะนำแก้ไขที่ทำตามได้
- **auto provider**: ตรวจความพร้อมของ local model ก่อน แล้วจึงลองแต่ละ remote
  provider ตามลำดับการเลือกอัตโนมัติ

เมื่อมีผลลัพธ์ gateway probe อยู่แล้ว (gateway ปกติดีในเวลาที่
ตรวจ) doctor จะอ้างอิงผลนั้นร่วมกับ config ที่มองเห็นได้จาก CLI และระบุ
ความคลาดเคลื่อนถ้ามี

ใช้ `openclaw memory status --deep` เพื่อตรวจความพร้อมของ embedding ระหว่าง runtime

### 14) คำเตือนสถานะ channel

หาก gateway ปกติดี doctor จะรัน channel status probe และรายงาน
คำเตือนพร้อมวิธีแก้ที่แนะนำ

### 15) การตรวจสอบ supervisor config + การซ่อมแซม

Doctor จะตรวจ supervisor config ที่ติดตั้งไว้ (launchd/systemd/schtasks) เพื่อหา
ค่าเริ่มต้นที่หายไปหรือล้าสมัย (เช่น dependencies ของ network-online ของ systemd และ
restart delay) เมื่อพบความไม่ตรงกัน มันจะแนะนำให้อัปเดตและสามารถ
เขียนไฟล์ service/task ใหม่ให้เป็นค่าเริ่มต้นปัจจุบันได้

หมายเหตุ:

- `openclaw doctor` จะถามก่อนเขียน supervisor config ใหม่
- `openclaw doctor --yes` จะยอมรับพรอมป์ต์ซ่อมแซมค่าเริ่มต้น
- `openclaw doctor --repair` จะใช้การแก้ไขที่แนะนำโดยไม่ถาม
- `openclaw doctor --repair --force` จะเขียนทับ supervisor configs แบบกำหนดเอง
- หาก token auth ต้องใช้ token และ `gateway.auth.token` ถูกจัดการด้วย SecretRef, เส้นทาง install/repair ของบริการผ่าน doctor จะตรวจ SecretRef แต่จะไม่บันทึกค่า plaintext token ที่ resolve แล้วลงใน metadata สภาพแวดล้อมของ supervisor service
- หาก token auth ต้องใช้ token และ token SecretRef ที่กำหนดค่าไว้ยัง resolve ไม่ได้ doctor จะบล็อกเส้นทาง install/repair พร้อมคำแนะนำที่ทำตามได้
- หากกำหนดทั้ง `gateway.auth.token` และ `gateway.auth.password` และไม่ได้ตั้ง `gateway.auth.mode` ไว้ doctor จะบล็อกการติดตั้ง/ซ่อมแซมจนกว่าจะตั้งโหมดอย่างชัดเจน
- สำหรับ Linux user-systemd units ตอนนี้การตรวจ token drift ของ doctor จะรวมทั้งแหล่ง `Environment=` และ `EnvironmentFile=` เมื่อเปรียบเทียบ metadata ด้าน auth ของบริการ
- คุณสามารถบังคับเขียนใหม่ทั้งหมดได้เสมอด้วย `openclaw gateway install --force`

### 16) การวินิจฉัย runtime + พอร์ตของ Gateway

Doctor จะตรวจ runtime ของบริการ (PID, สถานะการออกครั้งล่าสุด) และเตือนเมื่อ
บริการถูกติดตั้งแล้วแต่ไม่ได้กำลังทำงานจริง นอกจากนี้ยังตรวจการชนกันของพอร์ต
บนพอร์ตของ gateway (ค่าเริ่มต้น `18789`) และรายงานสาเหตุที่เป็นไปได้ (gateway กำลังรันอยู่แล้ว,
SSH tunnel)

### 17) แนวปฏิบัติที่ดีของ Gateway runtime

Doctor จะเตือนเมื่อบริการ gateway รันบน Bun หรือพาธของ Node ที่จัดการโดย version manager
(`nvm`, `fnm`, `volta`, `asdf` ฯลฯ) channels WhatsApp + Telegram ต้องใช้ Node
และพาธจาก version manager อาจพังหลังอัปเกรด เพราะบริการไม่ได้
โหลด shell init ของคุณ Doctor จะเสนอให้ย้ายไปใช้การติดตั้ง Node แบบระบบ
เมื่อมีให้ใช้ (Homebrew/apt/choco)

### 18) การเขียน config + wizard metadata

Doctor จะบันทึกการเปลี่ยนแปลงของ config และประทับ wizard metadata เพื่อบันทึก
การรัน doctor

### 19) เคล็ดลับสำหรับ workspace (การสำรองข้อมูล + ระบบ memory)

Doctor จะแนะนำระบบ memory ของ workspace เมื่อยังไม่มี และพิมพ์เคล็ดลับเรื่องการสำรองข้อมูล
หาก workspace ยังไม่ได้อยู่ภายใต้ git

ดู [/concepts/agent-workspace](/th/concepts/agent-workspace) สำหรับคำแนะนำแบบเต็มเกี่ยวกับ
โครงสร้าง workspace และการสำรองข้อมูลด้วย git (แนะนำให้ใช้ GitHub หรือ GitLab ส่วนตัว)

## ที่เกี่ยวข้อง

- [Gateway troubleshooting](/th/gateway/troubleshooting)
- [Gateway runbook](/th/gateway)
