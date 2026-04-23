---
read_when:
    - กำลังเพิ่มหรือแก้ไข migration ของ doctor
    - กำลังนำการเปลี่ยนแปลง config ที่ไม่เข้ากันย้อนหลังเข้ามา
summary: 'คำสั่ง Doctor: การตรวจสอบสุขภาพ การย้าย config และขั้นตอนการซ่อมแซม'
title: Doctor
x-i18n:
    generated_at: "2026-04-23T05:33:29Z"
    model: gpt-5.4
    provider: openai
    source_hash: 6460fe657e7cf0d938bfbb77e1cc0355c1b67830327d441878e48375de52a46f
    source_path: gateway/doctor.md
    workflow: 15
---

# Doctor

`openclaw doctor` คือเครื่องมือสำหรับซ่อมแซม + migration ของ OpenClaw โดยจะซ่อม
config/state ที่ล้าสมัย ตรวจสอบสุขภาพระบบ และให้ขั้นตอนการซ่อมแซมที่นำไปทำต่อได้ทันที

## เริ่มต้นอย่างรวดเร็ว

```bash
openclaw doctor
```

### headless / ระบบอัตโนมัติ

```bash
openclaw doctor --yes
```

ยอมรับค่าเริ่มต้นโดยไม่ถามเพิ่ม (รวมถึงขั้นตอนรีสตาร์ต/service/sandbox repair เมื่อเกี่ยวข้อง)

```bash
openclaw doctor --repair
```

ใช้การซ่อมแซมที่แนะนำโดยไม่ถามเพิ่ม (การซ่อมแซม + การรีสตาร์ตเมื่อปลอดภัย)

```bash
openclaw doctor --repair --force
```

ใช้การซ่อมแซมแบบเข้มข้นด้วย (เขียนทับ config ของ supervisor แบบกำหนดเอง)

```bash
openclaw doctor --non-interactive
```

รันโดยไม่มีพรอมป์ และใช้เฉพาะ migration ที่ปลอดภัย (การทำ config ให้เป็นมาตรฐาน + การย้ายสถานะบนดิสก์) โดยข้ามการกระทำ restart/service/sandbox ที่ต้องยืนยันโดยมนุษย์
migration ของสถานะแบบเดิมจะรันอัตโนมัติเมื่อถูกตรวจพบ

```bash
openclaw doctor --deep
```

สแกน system service เพื่อหา gateway install เพิ่มเติม (launchd/systemd/schtasks)

หากคุณต้องการตรวจสอบการเปลี่ยนแปลงก่อนเขียน ให้เปิดไฟล์ config ก่อน:

```bash
cat ~/.openclaw/openclaw.json
```

## สิ่งที่มันทำ (สรุป)

- อัปเดตล่วงหน้าก่อนเริ่มแบบไม่บังคับสำหรับการติดตั้งจาก git (เฉพาะแบบ interactive)
- ตรวจสอบความใหม่ของโปรโตคอล UI (rebuild Control UI เมื่อ schema ของโปรโตคอลใหม่กว่า)
- ตรวจสอบสุขภาพ + พรอมป์ให้รีสตาร์ต
- สรุปสถานะ Skills (มีสิทธิ์/ขาดหาย/ถูกบล็อก) และสถานะ Plugin
- ทำ config ให้เป็นมาตรฐานสำหรับค่าแบบเดิม
- migration ของ config Talk จากฟิลด์แบนแบบเดิม `talk.*` ไปเป็น `talk.provider` + `talk.providers.<provider>`
- ตรวจสอบ migration ของ browser สำหรับ config Chrome extension แบบเดิมและความพร้อมของ Chrome MCP
- คำเตือนการ override provider ของ OpenCode (`models.providers.opencode` / `models.providers.opencode-go`)
- คำเตือน Codex OAuth shadowing (`models.providers.openai-codex`)
- ตรวจสอบข้อกำหนดเบื้องต้นด้าน TLS ของ OAuth สำหรับ OpenAI Codex OAuth profile
- migration ของสถานะบนดิสก์แบบเดิม (sessions/agent dir/WhatsApp auth)
- migration ของคีย์สัญญา manifest ของ Plugin แบบเดิม (`speechProviders`, `realtimeTranscriptionProviders`, `realtimeVoiceProviders`, `mediaUnderstandingProviders`, `imageGenerationProviders`, `videoGenerationProviders`, `webFetchProviders`, `webSearchProviders` → `contracts`)
- migration ของ cron store แบบเดิม (`jobId`, `schedule.cron`, ฟิลด์ delivery/payload ระดับบนสุด, payload `provider`, งาน fallback ของ Webhook แบบง่าย `notify: true`)
- ตรวจสอบไฟล์ล็อกของเซสชันและล้างล็อกที่ค้างเก่า
- ตรวจสอบความสมบูรณ์และสิทธิ์ของ state (sessions, transcripts, state dir)
- ตรวจสอบสิทธิ์ของไฟล์ config (chmod 600) เมื่อรันในเครื่อง
- สุขภาพการยืนยันตัวตนของโมเดล: ตรวจสอบการหมดอายุของ OAuth, รีเฟรชโทเค็นที่ใกล้หมดอายุได้, และรายงานสถานะ cooldown/disabled ของ auth profile
- ตรวจพบไดเรกทอรี workspace เพิ่มเติม (`~/openclaw`)
- ซ่อมอิมเมจ sandbox เมื่อเปิดใช้ sandboxing
- migration ของ service แบบเดิมและการตรวจพบ gateway เพิ่มเติม
- migration ของสถานะแบบเดิมของช่องทาง Matrix (ในโหมด `--fix` / `--repair`)
- ตรวจสอบรันไทม์ของ Gateway (ติดตั้ง service แล้วแต่ไม่รัน; ป้าย launchd ที่แคชไว้)
- คำเตือนสถานะช่องทาง (probe จาก gateway ที่กำลังรันอยู่)
- ตรวจสอบ config ของ supervisor (launchd/systemd/schtasks) พร้อมตัวเลือกการซ่อม
- ตรวจสอบแนวปฏิบัติที่ดีของรันไทม์ Gateway (Node เทียบกับ Bun, พาธของ version manager)
- การวินิจฉัยการชนกันของพอร์ต Gateway (ค่าเริ่มต้น `18789`)
- คำเตือนด้านความปลอดภัยสำหรับนโยบาย DM แบบเปิด
- การตรวจสอบ auth ของ Gateway สำหรับโหมด local token (เสนอการสร้างโทเค็นเมื่อไม่มีแหล่งโทเค็น; ไม่เขียนทับ config SecretRef ของโทเค็น)
- การตรวจพบปัญหาการจับคู่อุปกรณ์ (คำขอจับคู่ครั้งแรกที่ค้างอยู่, การอัปเกรด role/scope ที่ค้างอยู่, ความคลาดเคลื่อนของ local device-token cache ที่ล้าสมัย, และความคลาดเคลื่อนด้าน auth ของ paired-record)
- ตรวจสอบ systemd linger บน Linux
- ตรวจสอบขนาดไฟล์ bootstrap ของ workspace (คำเตือนเรื่องการตัด/ใกล้ถึงขีดจำกัดสำหรับไฟล์บริบท)
- ตรวจสอบสถานะ shell completion และติดตั้ง/อัปเกรดอัตโนมัติ
- ตรวจสอบความพร้อมของ provider สำหรับ embedding ใน memory search (โมเดลในเครื่อง, remote API key, หรือไบนารี QMD)
- ตรวจสอบ source install (pnpm workspace mismatch, ขาด UI assets, ขาดไบนารี tsx)
- เขียน config และ metadata ของ wizard ที่อัปเดตแล้ว

## การเติมย้อนหลังและรีเซ็ต Dreams UI

ฉาก Dreams ใน Control UI มีการดำเนินการ **Backfill**, **Reset** และ **Clear Grounded**
สำหรับเวิร์กโฟลว์ grounded dreaming การดำเนินการเหล่านี้ใช้ RPC method
สไตล์ doctor ของ gateway แต่ **ไม่** เป็นส่วนหนึ่งของการซ่อมแซม/migration ของ CLI `openclaw doctor`

สิ่งที่มันทำ:

- **Backfill** จะสแกนไฟล์ `memory/YYYY-MM-DD.md` ในอดีตใน
  workspace ที่ใช้งานอยู่ รัน grounded REM diary pass และเขียนรายการ backfill
  ที่ย้อนกลับได้ลงใน `DREAMS.md`
- **Reset** จะลบเฉพาะรายการ diary ที่เป็น backfill ที่ถูกทำเครื่องหมายไว้จาก `DREAMS.md`
- **Clear Grounded** จะลบเฉพาะรายการระยะสั้นแบบ grounded-only ที่ถูกจัดฉากไว้
  ซึ่งมาจากการเล่นประวัติย้อนหลัง และยังไม่ได้สะสม live recall หรือ daily
  support

สิ่งที่มัน **ไม่** ทำด้วยตัวเอง:

- มันจะไม่แก้ไข `MEMORY.md`
- มันจะไม่รัน migration แบบเต็มของ doctor
- มันจะไม่จัดฉาก grounded candidate เข้าไปใน store สำหรับการโปรโมตระยะสั้นแบบ live
  โดยอัตโนมัติ เว้นแต่คุณจะรันพาธ CLI สำหรับ staged อย่างชัดเจนก่อน

หากคุณต้องการให้การเล่นประวัติ grounded ย้อนหลังส่งผลกับ lane การโปรโมตเชิงลึกตามปกติ
ให้ใช้โฟลว์ CLI แทน:

```bash
openclaw memory rem-backfill --path ./memory --stage-short-term
```

คำสั่งนี้จะจัดฉาก grounded durable candidate ลงใน short-term dreaming store ขณะที่
ยังคงให้ `DREAMS.md` เป็นพื้นผิวสำหรับการตรวจทาน

## พฤติกรรมโดยละเอียดและเหตุผล

### 0) การอัปเดตแบบไม่บังคับ (การติดตั้งจาก git)

หากนี่คือ git checkout และ doctor รันแบบ interactive มันจะเสนอให้
อัปเดต (fetch/rebase/build) ก่อนรัน doctor

### 1) การทำ config ให้เป็นมาตรฐาน

หาก config มีรูปแบบค่าที่เป็นแบบเดิม (เช่น `messages.ackReaction`
โดยไม่มี channel-specific override) doctor จะทำให้เป็นมาตรฐานตาม
schema ปัจจุบัน

ซึ่งรวมถึงฟิลด์แบนของ Talk แบบเดิมด้วย config สาธารณะของ Talk ปัจจุบันคือ
`talk.provider` + `talk.providers.<provider>` doctor จะเขียนรูปแบบเก่า
`talk.voiceId` / `talk.voiceAliases` / `talk.modelId` / `talk.outputFormat` /
`talk.apiKey` ไปเป็นแผนที่ provider

### 2) migration ของคีย์ config แบบเดิม

เมื่อ config มีคีย์ที่เลิกใช้แล้ว คำสั่งอื่นจะปฏิเสธการทำงานและขอให้
คุณรัน `openclaw doctor`

Doctor จะ:

- อธิบายว่าพบคีย์แบบเดิมใดบ้าง
- แสดง migration ที่ถูกใช้
- เขียน `~/.openclaw/openclaw.json` ใหม่ด้วย schema ที่อัปเดตแล้ว

Gateway ยังรัน migration ของ doctor อัตโนมัติเมื่อเริ่มต้น หากตรวจพบ
รูปแบบ config แบบเดิม ดังนั้น config ที่ล้าสมัยจะถูกซ่อมแซมโดยไม่ต้องแทรกแซงด้วยมือ
migration ของ cron job store จัดการโดย `openclaw doctor --fix`

migration ปัจจุบัน:

- `routing.allowFrom` → `channels.whatsapp.allowFrom`
- `routing.groupChat.requireMention` → `channels.whatsapp/telegram/imessage.groups."*".requireMention`
- `routing.groupChat.historyLimit` → `messages.groupChat.historyLimit`
- `routing.groupChat.mentionPatterns` → `messages.groupChat.mentionPatterns`
- `routing.queue` → `messages.queue`
- `routing.bindings` → `bindings` ระดับบนสุด
- `routing.agents`/`routing.defaultAgentId` → `agents.list` + `agents.list[].default`
- `talk.voiceId`/`talk.voiceAliases`/`talk.modelId`/`talk.outputFormat`/`talk.apiKey` แบบเดิม → `talk.provider` + `talk.providers.<provider>`
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
- สำหรับช่องทางที่มี `accounts` แบบมีชื่อ แต่ยังมีค่าระดับบนสุดของช่องทางแบบ single-account ค้างอยู่ ให้ย้ายค่าขอบเขตบัญชีเหล่านั้นไปยังบัญชีที่ถูกยกระดับซึ่งเลือกไว้สำหรับช่องทางนั้น (`accounts.default` สำหรับช่องทางส่วนใหญ่; Matrix สามารถคงเป้าหมาย named/default ที่ตรงกันอยู่แล้วได้)
- `identity` → `agents.list[].identity`
- `agent.*` → `agents.defaults` + `tools.*` (tools/elevated/exec/sandbox/subagents)
- `agent.model`/`allowedModels`/`modelAliases`/`modelFallbacks`/`imageModelFallbacks`
  → `agents.defaults.models` + `agents.defaults.model.primary/fallbacks` + `agents.defaults.imageModel.primary/fallbacks`
- `browser.ssrfPolicy.allowPrivateNetwork` → `browser.ssrfPolicy.dangerouslyAllowPrivateNetwork`
- `browser.profiles.*.driver: "extension"` → `"existing-session"`
- ลบ `browser.relayBindHost` (การตั้งค่า relay ของ extension แบบเดิม)

คำเตือนของ doctor ยังรวมคำแนะนำเกี่ยวกับค่าเริ่มต้นของบัญชีสำหรับช่องทางแบบหลายบัญชีด้วย:

- หากมีการกำหนดค่า `channels.<channel>.accounts` ตั้งแต่สองรายการขึ้นไปโดยไม่มี `channels.<channel>.defaultAccount` หรือ `accounts.default`, doctor จะเตือนว่าการกำหนดเส้นทาง fallback อาจเลือกบัญชีที่ไม่คาดคิด
- หาก `channels.<channel>.defaultAccount` ถูกตั้งเป็นรหัสบัญชีที่ไม่รู้จัก doctor จะเตือนและแสดงรายการรหัสบัญชีที่กำหนดค่าไว้

### 2b) การ override provider ของ OpenCode

หากคุณเพิ่ม `models.providers.opencode`, `opencode-zen`, หรือ `opencode-go`
ด้วยตนเอง มันจะ override แค็ตตาล็อก OpenCode แบบ built-in จาก `@mariozechner/pi-ai`
ซึ่งอาจบังคับให้โมเดลไปใช้ API ผิดตัวหรือทำให้ค่าใช้จ่ายกลายเป็นศูนย์ Doctor จะเตือนเพื่อให้
คุณลบ override และคืนค่าการกำหนดเส้นทาง API + ค่าใช้จ่ายรายโมเดล

### 2c) migration ของ browser และความพร้อมของ Chrome MCP

หาก config ของ browser ยังชี้ไปยังพาธ Chrome extension ที่ถูกถอดออกแล้ว doctor
จะทำให้เป็นมาตรฐานไปยังโมเดลการเชื่อมต่อ Chrome MCP แบบ host-local ปัจจุบัน:

- `browser.profiles.*.driver: "extension"` จะกลายเป็น `"existing-session"`
- `browser.relayBindHost` จะถูกลบออก

Doctor ยังตรวจสอบพาธ Chrome MCP แบบ host-local เมื่อคุณใช้ `defaultProfile:
"user"` หรือโปรไฟล์ `existing-session` ที่กำหนดค่าไว้:

- ตรวจสอบว่ามีการติดตั้ง Google Chrome อยู่บนโฮสต์เดียวกันหรือไม่สำหรับโปรไฟล์
  auto-connect เริ่มต้น
- ตรวจสอบเวอร์ชัน Chrome ที่ตรวจพบ และเตือนเมื่อยังต่ำกว่า Chrome 144
- เตือนให้คุณเปิดใช้ remote debugging ในหน้า inspect ของ browser (เช่น
  `chrome://inspect/#remote-debugging`, `brave://inspect/#remote-debugging`,
  หรือ `edge://inspect/#remote-debugging`)

Doctor ไม่สามารถเปิดใช้การตั้งค่าฝั่ง Chrome ให้คุณได้ Host-local Chrome MCP
ยังคงต้องการ:

- browser ที่ใช้ Chromium 144+ บนโฮสต์ gateway/node
- browser ที่กำลังรันอยู่ในเครื่อง
- เปิดใช้ remote debugging ใน browser นั้น
- อนุมัติพรอมป์ขอความยินยอมสำหรับการเชื่อมต่อครั้งแรกใน browser

ความพร้อมในที่นี้เป็นเพียงเรื่องข้อกำหนดเบื้องต้นของการเชื่อมต่อในเครื่อง Existing-session ยังคงข้อจำกัดของเส้นทาง Chrome MCP ปัจจุบันไว้; เส้นทางขั้นสูงอย่าง `responsebody`, การส่งออก PDF, การดักจับการดาวน์โหลด และ batch action ยังคงต้องใช้ browser ที่มีการจัดการหรือ raw CDP profile

การตรวจสอบนี้ **ไม่** ใช้กับ Docker, sandbox, remote-browser หรือโฟลว์ headless อื่น ๆ ซึ่งยังคงใช้ raw CDP ต่อไป

### 2d) ข้อกำหนดเบื้องต้นด้าน OAuth TLS

เมื่อมีการกำหนดค่า OpenAI Codex OAuth profile, doctor จะ probe
endpoint การอนุญาตของ OpenAI เพื่อตรวจสอบว่า local Node/OpenSSL TLS stack สามารถ
ตรวจสอบ certificate chain ได้ หาก probe ล้มเหลวด้วยข้อผิดพลาดเกี่ยวกับ certificate (เช่น
`UNABLE_TO_GET_ISSUER_CERT_LOCALLY`, cert หมดอายุ หรือ cert แบบ self-signed),
doctor จะพิมพ์คำแนะนำการแก้ไขเฉพาะแพลตฟอร์ม บน macOS ที่ใช้ Homebrew Node การแก้ไข
มักเป็น `brew postinstall ca-certificates` เมื่อใช้ `--deep`, probe จะรัน
แม้ว่า gateway จะยังมีสุขภาพดีอยู่ก็ตาม

### 2c) การ override provider ของ Codex OAuth

หากก่อนหน้านี้คุณได้เพิ่มการตั้งค่า OpenAI transport แบบเดิมไว้ใต้
`models.providers.openai-codex` การตั้งค่าเหล่านั้นอาจไป shadow พาธ provider
Codex OAuth แบบ built-in ที่รุ่นใหม่ใช้โดยอัตโนมัติ Doctor จะเตือนเมื่อพบ
การตั้งค่า transport แบบเก่าเหล่านั้นอยู่ร่วมกับ Codex OAuth เพื่อให้คุณสามารถลบหรือเขียนใหม่
transport override ที่ล้าสมัยและนำพฤติกรรม routing/fallback แบบ built-in กลับมาได้
proxy แบบกำหนดเองและ override เฉพาะ header ยังคงรองรับอยู่และจะไม่
ทำให้เกิดคำเตือนนี้

### 3) migration ของสถานะแบบเดิม (โครงสร้างบนดิสก์)

Doctor สามารถย้ายโครงสร้างบนดิสก์แบบเก่าไปยังโครงสร้างปัจจุบันได้:

- store ของเซสชัน + ทรานสคริปต์:
  - จาก `~/.openclaw/sessions/` ไปยัง `~/.openclaw/agents/<agentId>/sessions/`
- ไดเรกทอรี agent:
  - จาก `~/.openclaw/agent/` ไปยัง `~/.openclaw/agents/<agentId>/agent/`
- สถานะ auth ของ WhatsApp (Baileys):
  - จาก `~/.openclaw/credentials/*.json` แบบเดิม (ยกเว้น `oauth.json`)
  - ไปยัง `~/.openclaw/credentials/whatsapp/<accountId>/...` (รหัสบัญชีเริ่มต้น: `default`)

migration เหล่านี้เป็นแบบ best-effort และ idempotent; doctor จะปล่อยคำเตือนเมื่อ
ยังมีโฟลเดอร์แบบเดิมหลงเหลืออยู่เป็นข้อมูลสำรอง Gateway/CLI ยังทำ auto-migrate
เซสชันแบบเดิม + ไดเรกทอรี agent ตอนเริ่มต้นด้วย เพื่อให้ประวัติ/auth/โมเดลลงไปยัง
พาธต่อเอเจนต์ได้โดยไม่ต้องรัน doctor ด้วยตนเอง โดยตั้งใจให้ WhatsApp auth
ย้ายผ่าน `openclaw doctor` เท่านั้น ขณะนี้การทำ Talk provider/provider-map ให้เป็นมาตรฐาน
จะเทียบโดย structural equality ดังนั้นความต่างที่เป็นเพียงลำดับคีย์จะไม่ทำให้เกิด
การเปลี่ยนแปลง `doctor --fix` แบบ no-op ซ้ำอีก

### 3a) migration ของ manifest Plugin แบบเดิม

Doctor จะสแกน manifest ของ Plugin ที่ติดตั้งทั้งหมดเพื่อหาคีย์ capability ระดับบนสุดที่เลิกใช้แล้ว
(`speechProviders`, `realtimeTranscriptionProviders`,
`realtimeVoiceProviders`, `mediaUnderstandingProviders`,
`imageGenerationProviders`, `videoGenerationProviders`, `webFetchProviders`,
`webSearchProviders`) เมื่อพบ มันจะเสนอให้ย้ายค่าเหล่านั้นเข้าไปในอ็อบเจ็กต์ `contracts`
และเขียนไฟล์ manifest ทับในที่เดิม migration นี้เป็นแบบ idempotent;
หากคีย์ `contracts` มีค่าเดียวกันอยู่แล้ว คีย์แบบเดิมจะถูกลบออก
โดยไม่ทำให้ข้อมูลซ้ำ

### 3b) migration ของ cron store แบบเดิม

Doctor ยังตรวจสอบ cron job store (`~/.openclaw/cron/jobs.json` โดยค่าเริ่มต้น
หรือ `cron.store` หากมีการ override) เพื่อหารูปแบบ job แบบเก่าที่ scheduler ยัง
ยอมรับเพื่อความเข้ากันได้

การ cleanup ของ cron ปัจจุบันรวมถึง:

- `jobId` → `id`
- `schedule.cron` → `schedule.expr`
- ฟิลด์ payload ระดับบนสุด (`message`, `model`, `thinking`, ...) → `payload`
- ฟิลด์ delivery ระดับบนสุด (`deliver`, `channel`, `to`, `provider`, ...) → `delivery`
- alias ของ payload `provider` delivery → `delivery.channel` แบบชัดเจน
- งาน Webhook fallback แบบเดิมชนิดง่าย `notify: true` → `delivery.mode="webhook"` แบบชัดเจน พร้อม `delivery.to=cron.webhook`

Doctor จะทำ auto-migrate job แบบ `notify: true` เฉพาะเมื่อสามารถทำได้
โดยไม่เปลี่ยนพฤติกรรม หาก job ใดผสม notify fallback แบบเดิมเข้ากับ
delivery mode แบบ non-webhook ที่มีอยู่ doctor จะเตือนและปล่อย job นั้นไว้ให้ตรวจทานด้วยมือ

### 3c) การล้าง session lock

Doctor จะสแกนไดเรกทอรีเซสชันของทุกเอเจนต์เพื่อหาไฟล์ write-lock ที่ค้างอยู่ —
ไฟล์ที่ถูกทิ้งไว้เมื่อเซสชันออกอย่างผิดปกติ สำหรับแต่ละไฟล์ล็อกที่พบ จะรายงาน:
พาธ, PID, PID ยังมีชีวิตอยู่หรือไม่, อายุของล็อก, และถือว่า
ล้าสมัยหรือไม่ (PID ตายแล้วหรือเก่ากว่า 30 นาที) ในโหมด `--fix` / `--repair`
ระบบจะลบไฟล์ล็อกที่ล้าสมัยโดยอัตโนมัติ; มิฉะนั้นจะพิมพ์หมายเหตุและ
แนะนำให้คุณรันใหม่ด้วย `--fix`

### 4) การตรวจสอบความสมบูรณ์ของ state (ความคงอยู่ของเซสชัน การกำหนดเส้นทาง และความปลอดภัย)

ไดเรกทอรี state คือสมองส่วนก้านของการปฏิบัติการ หากมันหายไป คุณจะสูญเสีย
เซสชัน ข้อมูลรับรอง ล็อก และ config (เว้นแต่คุณมีข้อมูลสำรองไว้ที่อื่น)

Doctor ตรวจสอบ:

- **ไม่มี state dir**: เตือนเกี่ยวกับการสูญเสีย state แบบร้ายแรง เสนอให้สร้าง
  ไดเรกทอรีใหม่ และเตือนว่ามันไม่สามารถกู้ข้อมูลที่หายไปได้
- **สิทธิ์ของ state dir**: ตรวจสอบว่าสามารถเขียนได้; เสนอซ่อมสิทธิ์
  (และส่งคำใบ้ `chown` เมื่อพบว่า owner/group ไม่ตรงกัน)
- **state dir บน macOS ที่ซิงก์ผ่านคลาวด์**: เตือนเมื่อ state resolve อยู่ใต้ iCloud Drive
  (`~/Library/Mobile Documents/com~apple~CloudDocs/...`) หรือ
  `~/Library/CloudStorage/...` เพราะพาธที่มีการ sync อาจทำให้ I/O ช้าลง
  และเกิด race ของ lock/sync
- **state dir บน Linux ที่อยู่บน SD หรือ eMMC**: เตือนเมื่อ state resolve ไปยังแหล่งเมานต์ `mmcblk*`
  เพราะ random I/O บน SD หรือ eMMC อาจช้ากว่าและสึกหรอเร็วกว่า
  ภายใต้การเขียน session และ credential
- **ไม่มีไดเรกทอรีเซสชัน**: `sessions/` และไดเรกทอรีของ session store
  จำเป็นต่อการคงประวัติและหลีกเลี่ยงข้อขัดข้อง `ENOENT`
- **ทรานสคริปต์ไม่ตรงกัน**: เตือนเมื่อรายการเซสชันล่าสุดมี
  ไฟล์ทรานสคริปต์ที่หายไป
- **Main session “1-line JSONL”**: แจ้งเตือนเมื่อทรานสคริปต์หลักมีเพียงหนึ่ง
  บรรทัด (ประวัติไม่ได้สะสม)
- **มีหลาย state dir**: เตือนเมื่อมีโฟลเดอร์ `~/.openclaw` หลายชุดข้าม
  home directory หรือเมื่อ `OPENCLAW_STATE_DIR` ชี้ไปที่อื่น (ประวัติอาจ
  แยกกันอยู่ระหว่างการติดตั้ง)
- **การเตือนโหมดรีโมต**: หาก `gateway.mode=remote`, doctor จะเตือนให้คุณรัน
  บนโฮสต์ระยะไกล (state อยู่ที่นั่น)
- **สิทธิ์ของไฟล์ config**: เตือนหาก `~/.openclaw/openclaw.json` เปิดให้อ่านได้
  สำหรับ group/world และเสนอให้ปรับให้เข้มขึ้นเป็น `600`

### 5) สุขภาพการยืนยันตัวตนของโมเดล (การหมดอายุของ OAuth)

Doctor จะตรวจสอบ OAuth profile ใน auth store เตือนเมื่อโทเค็น
ใกล้หมดอายุ/หมดอายุ และสามารถรีเฟรชได้เมื่อปลอดภัย หาก Anthropic
OAuth/token profile ล้าสมัย มันจะแนะนำ Anthropic API key หรือ
พาธ setup-token ของ Anthropic
พรอมป์ให้รีเฟรชจะแสดงเฉพาะเมื่อรันแบบ interactive (TTY); `--non-interactive`
จะข้ามการพยายามรีเฟรช

เมื่อการรีเฟรช OAuth ล้มเหลวแบบถาวร (เช่น `refresh_token_reused`,
`invalid_grant`, หรือ provider แจ้งให้คุณลงชื่อเข้าใช้อีกครั้ง), doctor จะรายงาน
ว่าจำเป็นต้อง re-auth และพิมพ์คำสั่ง `openclaw models auth login --provider ...`
ที่ต้องรันอย่างชัดเจน

Doctor ยังรายงาน auth profile ที่ใช้งานไม่ได้ชั่วคราวเนื่องจาก:

- cooldown ระยะสั้น (rate limit/timeout/auth failure)
- การปิดใช้งานที่ยาวกว่า (billing/credit failure)

### 6) การตรวจสอบโมเดลของ Hooks

หากตั้งค่า `hooks.gmail.model`, doctor จะตรวจสอบ model reference กับ
catalog และ allowlist และเตือนเมื่อมันจะ resolve ไม่ได้หรือไม่ถูกอนุญาต

### 7) การซ่อมอิมเมจ sandbox

เมื่อเปิดใช้ sandboxing, doctor จะตรวจสอบอิมเมจ Docker และเสนอให้ build หรือ
สลับไปใช้ชื่อแบบเดิมหากอิมเมจปัจจุบันหายไป

### 7b) dependency ของรันไทม์สำหรับ Plugin ที่มากับระบบ

Doctor จะตรวจสอบ dependency ของรันไทม์เฉพาะสำหรับ Plugin ที่มากับระบบและกำลังใช้งานอยู่ใน
config ปัจจุบันหรือถูกเปิดใช้โดยค่าเริ่มต้นของ manifest ที่มากับระบบ เช่น
`plugins.entries.discord.enabled: true`, แบบเดิม
`channels.discord.enabled: true`, หรือ provider ที่มากับระบบซึ่งเปิดใช้โดยค่าเริ่มต้น หากมีรายการใดหายไป doctor จะรายงานแพ็กเกจและติดตั้งให้ในโหมด
`openclaw doctor --fix` / `openclaw doctor --repair` Plugin ภายนอกยังคง
ใช้ `openclaw plugins install` / `openclaw plugins update`; doctor จะไม่
ติดตั้ง dependency สำหรับพาธ Plugin ใด ๆ ตามอำเภอใจ

### 8) migration ของ Gateway service และคำใบ้สำหรับ cleanup

Doctor ตรวจพบ Gateway service แบบเดิม (launchd/systemd/schtasks) และ
เสนอให้ลบออกแล้วติดตั้ง service ของ OpenClaw โดยใช้พอร์ต gateway ปัจจุบัน
นอกจากนี้ยังสามารถสแกนหา service เพิ่มเติมที่คล้าย gateway และพิมพ์คำใบ้สำหรับ cleanup ได้
OpenClaw gateway service ที่ตั้งชื่อตามโปรไฟล์ถือเป็นรูปแบบปกติและจะไม่ถูก
แจ้งว่าเป็น "extra"

### 8b) Startup Matrix migration

เมื่อบัญชีช่องทาง Matrix มี migration ของสถานะแบบเดิมที่ค้างอยู่หรือดำเนินการได้
doctor (ในโหมด `--fix` / `--repair`) จะสร้าง snapshot ก่อน migration แล้วจึง
รันขั้นตอน migration แบบ best-effort ได้แก่ migration ของ Matrix state แบบเดิม
และการเตรียม encrypted-state แบบเดิม ทั้งสองขั้นตอนไม่ถือว่า fatal;
ข้อผิดพลาดจะถูกบันทึกเป็นล็อกและการเริ่มต้นจะดำเนินต่อไป ในโหมดอ่านอย่างเดียว (`openclaw doctor` โดยไม่มี `--fix`) การตรวจสอบนี้
จะถูกข้ามทั้งหมด

### 8c) การจับคู่อุปกรณ์และ auth drift

ขณะนี้ Doctor จะตรวจสอบสถานะ device-pairing เป็นส่วนหนึ่งของ health pass ปกติแล้ว

สิ่งที่มันรายงาน:

- คำขอจับคู่ครั้งแรกที่ค้างอยู่
- การอัปเกรด role ที่ค้างอยู่สำหรับอุปกรณ์ที่จับคู่แล้ว
- การอัปเกรด scope ที่ค้างอยู่สำหรับอุปกรณ์ที่จับคู่แล้ว
- การซ่อมแซม public-key mismatch กรณีที่ device id ยังตรงกัน แต่อัตลักษณ์ของอุปกรณ์
  ไม่ตรงกับเรคคอร์ดที่อนุมัติแล้วอีกต่อไป
- paired record ที่ขาดโทเค็นที่ใช้งานอยู่สำหรับ role ที่ได้รับอนุมัติ
- paired token ที่มี scope drift ออกนอก baseline ของการจับคู่ที่ได้รับอนุมัติ
- รายการ device-token ที่แคชไว้ในเครื่องสำหรับเครื่องปัจจุบันซึ่งเก่ากว่าการหมุนโทเค็นฝั่ง
  gateway หรือมี metadata ของ scope ที่ล้าสมัย

Doctor จะไม่อนุมัติคำขอจับคู่โดยอัตโนมัติหรือหมุน device token ให้โดยอัตโนมัติ แต่
จะพิมพ์ขั้นตอนถัดไปที่แน่นอนแทน:

- ตรวจสอบคำขอที่ค้างด้วย `openclaw devices list`
- อนุมัติคำขอที่ต้องการด้วย `openclaw devices approve <requestId>`
- หมุนโทเค็นใหม่ด้วย `openclaw devices rotate --device <deviceId> --role <role>`
- ลบและอนุมัติใหม่เรคคอร์ดที่ล้าสมัยด้วย `openclaw devices remove <deviceId>`

สิ่งนี้ปิดช่องโหว่ทั่วไปแบบ "จับคู่แล้วแต่ยังขึ้นว่าต้องจับคู่"
โดยตอนนี้ doctor จะแยกแยะได้ระหว่างการจับคู่ครั้งแรก การอัปเกรด role/scope ที่ค้างอยู่
และ drift ของ token/device identity ที่ล้าสมัย

### 9) คำเตือนด้านความปลอดภัย

Doctor จะปล่อยคำเตือนเมื่อ provider เปิดรับ DM โดยไม่มี allowlist หรือ
เมื่อนโยบายถูกกำหนดค่าในลักษณะที่อันตราย

### 10) systemd linger (Linux)

หากรันเป็น systemd user service, doctor จะตรวจสอบให้แน่ใจว่าเปิด lingering อยู่ เพื่อให้
gateway ยังทำงานต่อหลัง logout

### 11) สถานะของ workspace (Skills, Plugins และไดเรกทอรีแบบเดิม)

Doctor จะพิมพ์สรุปสถานะของ workspace สำหรับเอเจนต์เริ่มต้น:

- **สถานะ Skills**: นับจำนวน skill ที่มีสิทธิ์, ขาดข้อกำหนด, และถูกบล็อกโดย allowlist
- **ไดเรกทอรี workspace แบบเดิม**: เตือนเมื่อมี `~/openclaw` หรือไดเรกทอรี workspace แบบเดิมอื่น
  อยู่ร่วมกับ workspace ปัจจุบัน
- **สถานะ Plugin**: นับจำนวน Plugin ที่โหลดแล้ว/ปิดใช้งาน/เกิดข้อผิดพลาด; แสดงรหัส Plugin สำหรับรายการที่
  มีข้อผิดพลาด; รายงานความสามารถของ Plugin ที่มากับระบบ
- **คำเตือนความเข้ากันได้ของ Plugin**: แจ้ง Plugin ที่มีปัญหาความเข้ากันได้กับ
  รันไทม์ปัจจุบัน
- **การวินิจฉัย Plugin**: แสดงคำเตือนหรือข้อผิดพลาดขณะโหลดที่ถูกปล่อยโดย
  plugin registry

### 11b) ขนาดไฟล์ Bootstrap

Doctor จะตรวจสอบว่าไฟล์ bootstrap ของ workspace (เช่น `AGENTS.md`,
`CLAUDE.md` หรือไฟล์บริบทอื่นที่ถูกฉีด) ใกล้ถึงหรือเกิน
งบประมาณจำนวนอักขระที่กำหนดไว้หรือไม่ โดยจะรายงานจำนวนอักขระต่อไฟล์แบบ raw เทียบกับ injected,
เปอร์เซ็นต์การตัด, สาเหตุของการตัด (`max/file` หรือ `max/total`), และจำนวนอักขระที่ฉีดรวม
ในฐานะสัดส่วนของงบประมาณทั้งหมด เมื่อไฟล์ถูกตัดหรือใกล้ถึงขีดจำกัด
doctor จะพิมพ์คำแนะนำสำหรับการปรับ `agents.defaults.bootstrapMaxChars`
และ `agents.defaults.bootstrapTotalMaxChars`

### 11c) Shell completion

Doctor จะตรวจสอบว่ามีการติดตั้ง tab completion สำหรับ shell ปัจจุบันหรือไม่
(zsh, bash, fish หรือ PowerShell):

- หากโปรไฟล์ของ shell ใช้รูปแบบ completion แบบ dynamic ที่ช้า
  (`source <(openclaw completion ...)`), doctor จะอัปเกรดเป็น
  แบบใช้ไฟล์แคชที่เร็วกว่า
- หากมีการกำหนดค่า completion ไว้ในโปรไฟล์ แต่ไฟล์แคชหายไป
  doctor จะสร้างแคชใหม่ให้อัตโนมัติ
- หากยังไม่ได้กำหนดค่า completion เลย doctor จะถามเพื่อติดตั้ง
  (เฉพาะโหมด interactive; ข้ามเมื่อใช้ `--non-interactive`)

รัน `openclaw completion --write-state` เพื่อสร้างแคชใหม่ด้วยตนเอง

### 12) การตรวจสอบ auth ของ Gateway (local token)

Doctor ตรวจสอบความพร้อมของ auth แบบ local gateway token

- หากโหมด token ต้องใช้โทเค็นและยังไม่มีแหล่งโทเค็น doctor จะเสนอให้สร้างหนึ่งรายการ
- หาก `gateway.auth.token` ถูกจัดการด้วย SecretRef แต่ไม่พร้อมใช้งาน doctor จะเตือนและจะไม่เขียนทับด้วย plaintext
- `openclaw doctor --generate-gateway-token` จะบังคับสร้างเฉพาะเมื่อไม่มีการกำหนดค่า token SecretRef

### 12b) การซ่อมแซมแบบอ่านอย่างเดียวที่รับรู้ SecretRef

โฟลว์การซ่อมแซมบางอย่างจำเป็นต้องตรวจสอบข้อมูลรับรองที่กำหนดค่าไว้โดยไม่ลดทอนพฤติกรรม fail-fast ของรันไทม์

- ขณะนี้ `openclaw doctor --fix` ใช้โมเดลสรุป SecretRef แบบอ่านอย่างเดียวเดียวกันกับคำสั่งตระกูล status สำหรับการซ่อมแซม config แบบเจาะจง
- ตัวอย่าง: การซ่อม `allowFrom` / `groupAllowFrom` แบบ `@username` ของ Telegram จะพยายามใช้ข้อมูลรับรองบอตที่กำหนดค่าไว้เมื่อพร้อมใช้งาน
- หากโทเค็นบอต Telegram ถูกกำหนดค่าผ่าน SecretRef แต่ไม่พร้อมใช้งานในพาธคำสั่งปัจจุบัน doctor จะรายงานว่าข้อมูลรับรองถูกกำหนดค่าไว้แต่ไม่พร้อมใช้งาน และข้ามการ resolve อัตโนมัติแทนที่จะล้มเหลวหรือรายงานผิดว่าโทเค็นหายไป

### 13) การตรวจสอบสุขภาพของ Gateway + การรีสตาร์ต

Doctor จะรันการตรวจสอบสุขภาพและเสนอให้รีสตาร์ต gateway เมื่อดูเหมือนว่า
ไม่สมบูรณ์

### 13b) ความพร้อมของ memory search

Doctor ตรวจสอบว่า provider สำหรับ embedding ของ memory search ที่กำหนดค่าไว้พร้อม
สำหรับเอเจนต์เริ่มต้นหรือไม่ พฤติกรรมขึ้นอยู่กับ backend และ provider ที่กำหนดค่าไว้:

- **QMD backend**: probe ว่ามีไบนารี `qmd` และเริ่มทำงานได้หรือไม่
  หากไม่ได้ จะพิมพ์คำแนะนำการแก้ไข รวมถึงแพ็กเกจ npm และตัวเลือกพาธไบนารีแบบกำหนดเอง
- **provider ภายในเครื่องแบบชัดเจน**: ตรวจสอบว่าไฟล์โมเดลภายในเครื่องมีอยู่หรือไม่ หรือมี
  URL ของโมเดลแบบ remote/downloadable ที่รู้จักหรือไม่ หากไม่พบ จะเสนอให้สลับไปใช้ provider ระยะไกล
- **provider ระยะไกลแบบชัดเจน** (`openai`, `voyage` เป็นต้น): ตรวจสอบว่า
  มี API key อยู่ในสภาพแวดล้อมหรือ auth store หรือไม่ หากไม่มีจะพิมพ์คำแนะนำการแก้ไขที่ดำเนินการได้
- **provider อัตโนมัติ**: ตรวจสอบความพร้อมของโมเดลภายในเครื่องก่อน แล้วจึงลองแต่ละ remote
  provider ตามลำดับการเลือกอัตโนมัติ

เมื่อมีผลลัพธ์จาก gateway probe พร้อมใช้งาน (gateway มีสุขภาพดีขณะตรวจสอบ)
doctor จะอ้างอิงผลลัพธ์ดังกล่าวเทียบกับ config ที่มองเห็นจาก CLI และระบุ
ความคลาดเคลื่อนหากมี

ใช้ `openclaw memory status --deep` เพื่อตรวจสอบความพร้อมของ embedding ขณะรันไทม์

### 14) คำเตือนสถานะช่องทาง

หาก gateway มีสุขภาพดี doctor จะรัน channel status probe และรายงาน
คำเตือนพร้อมวิธีแก้ที่แนะนำ

### 15) การตรวจสอบและซ่อมแซม config ของ supervisor

Doctor จะตรวจสอบ config ของ supervisor ที่ติดตั้งไว้ (launchd/systemd/schtasks) เพื่อหา
ค่าเริ่มต้นที่หายไปหรือล้าสมัย (เช่น dependency ของ systemd network-online และ
ดีเลย์การรีสตาร์ต) เมื่อพบความไม่ตรงกัน มันจะแนะนำให้อัปเดตและสามารถ
เขียนไฟล์ service/task ใหม่ให้เป็นค่าเริ่มต้นปัจจุบันได้

หมายเหตุ:

- `openclaw doctor` จะถามก่อนเขียน config ของ supervisor ใหม่
- `openclaw doctor --yes` จะยอมรับพรอมป์การซ่อมแซมเริ่มต้น
- `openclaw doctor --repair` จะใช้การแก้ไขที่แนะนำโดยไม่ถาม
- `openclaw doctor --repair --force` จะเขียนทับ config ของ supervisor แบบกำหนดเอง
- หาก token auth ต้องใช้โทเค็น และ `gateway.auth.token` ถูกจัดการด้วย SecretRef, การติดตั้ง/ซ่อมแซม service ของ doctor จะตรวจสอบ SecretRef แต่จะไม่บันทึกค่าโทเค็น plaintext ที่ resolve ได้ลงใน metadata สภาพแวดล้อมของ service supervisor
- หาก token auth ต้องใช้โทเค็น และ token SecretRef ที่กำหนดค่าไว้ยัง resolve ไม่ได้ doctor จะบล็อกพาธการติดตั้ง/ซ่อมแซมพร้อมคำแนะนำที่ทำตามได้
- หากกำหนดค่าทั้ง `gateway.auth.token` และ `gateway.auth.password` และยังไม่ได้ตั้ง `gateway.auth.mode`, doctor จะบล็อกการติดตั้ง/ซ่อมแซมจนกว่าจะตั้งโหมดอย่างชัดเจน
- สำหรับ unit แบบ user-systemd บน Linux การตรวจสอบ token drift ของ doctor ตอนนี้รวมทั้งแหล่ง `Environment=` และ `EnvironmentFile=` เมื่อเปรียบเทียบ metadata auth ของ service
- คุณสามารถบังคับเขียนใหม่ทั้งหมดได้เสมอด้วย `openclaw gateway install --force`

### 16) การวินิจฉัยรันไทม์ของ Gateway + พอร์ต

Doctor จะตรวจสอบรันไทม์ของ service (PID, สถานะ exit ล่าสุด) และเตือนเมื่อ
service ถูกติดตั้งไว้แต่ไม่ได้รันจริง นอกจากนี้ยังตรวจสอบการชนกันของพอร์ต
บนพอร์ตของ gateway (ค่าเริ่มต้น `18789`) และรายงานสาเหตุที่เป็นไปได้ (gateway กำลังรันอยู่แล้ว, SSH tunnel)

### 17) แนวปฏิบัติที่ดีของรันไทม์ Gateway

Doctor จะเตือนเมื่อ service ของ gateway รันบน Bun หรือใช้พาธ Node ที่จัดการด้วย version manager
(`nvm`, `fnm`, `volta`, `asdf` เป็นต้น) ช่องทาง WhatsApp + Telegram ต้องใช้ Node
และพาธจาก version manager อาจพังหลังอัปเกรดได้ เพราะ service ไม่ได้
โหลด shell init ของคุณ Doctor จะเสนอให้ย้ายไปใช้การติดตั้ง Node ระดับระบบเมื่อ
พร้อมใช้งาน (Homebrew/apt/choco)

### 18) การเขียน config + metadata ของ wizard

Doctor จะบันทึกการเปลี่ยนแปลง config ทั้งหมดและประทับ metadata ของ wizard เพื่อบันทึก
การรัน doctor

### 19) เคล็ดลับสำหรับ workspace (backup + ระบบหน่วยความจำ)

Doctor จะแนะนำระบบหน่วยความจำของ workspace เมื่อยังไม่มี และพิมพ์คำแนะนำเรื่อง backup
หาก workspace ยังไม่ได้อยู่ภายใต้ git

ดู [/concepts/agent-workspace](/th/concepts/agent-workspace) สำหรับคู่มือฉบับเต็มเกี่ยวกับ
โครงสร้าง workspace และการสำรองด้วย git (แนะนำ private GitHub หรือ GitLab)
