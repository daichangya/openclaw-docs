---
read_when:
    - กำลังตรวจสอบความครอบคลุมของข้อมูลรับรอง SecretRef
    - กำลังตรวจสอบว่าข้อมูลรับรองมีสิทธิ์สำหรับ `secrets configure` หรือ `secrets apply` หรือไม่
    - กำลังตรวจสอบว่าทำไมข้อมูลรับรองจึงอยู่นอกพื้นผิวที่รองรับ
summary: พื้นผิวข้อมูลรับรอง SecretRef แบบ canonical ที่รองรับเทียบกับไม่รองรับ
title: พื้นผิวข้อมูลรับรอง SecretRef
x-i18n:
    generated_at: "2026-04-23T05:55:18Z"
    model: gpt-5.4
    provider: openai
    source_hash: dd0b9c379236b17a72f552d6360b8b5a2269009e019c138c6bb50f4f7328ddaf
    source_path: reference/secretref-credential-surface.md
    workflow: 15
---

# พื้นผิวข้อมูลรับรอง SecretRef

หน้านี้กำหนดพื้นผิวข้อมูลรับรอง SecretRef แบบ canonical

เจตนาของขอบเขต:

- อยู่ในขอบเขต: ข้อมูลรับรองที่ผู้ใช้จัดหาให้โดยตรงอย่างเคร่งครัด ซึ่ง OpenClaw ไม่ได้สร้างหรือหมุนให้
- นอกขอบเขต: ข้อมูลรับรองที่สร้างหรือหมุนขณะรันไทม์, วัสดุสำหรับรีเฟรช OAuth และอาร์ติแฟกต์ที่มีลักษณะคล้ายเซสชัน

## ข้อมูลรับรองที่รองรับ

### เป้าหมายใน `openclaw.json` (`secrets configure` + `secrets apply` + `secrets audit`)

[//]: # "secretref-supported-list-start"

- `models.providers.*.apiKey`
- `models.providers.*.headers.*`
- `models.providers.*.request.auth.token`
- `models.providers.*.request.auth.value`
- `models.providers.*.request.headers.*`
- `models.providers.*.request.proxy.tls.ca`
- `models.providers.*.request.proxy.tls.cert`
- `models.providers.*.request.proxy.tls.key`
- `models.providers.*.request.proxy.tls.passphrase`
- `models.providers.*.request.tls.ca`
- `models.providers.*.request.tls.cert`
- `models.providers.*.request.tls.key`
- `models.providers.*.request.tls.passphrase`
- `skills.entries.*.apiKey`
- `agents.defaults.memorySearch.remote.apiKey`
- `agents.list[].memorySearch.remote.apiKey`
- `talk.providers.*.apiKey`
- `messages.tts.providers.*.apiKey`
- `tools.web.fetch.firecrawl.apiKey`
- `plugins.entries.brave.config.webSearch.apiKey`
- `plugins.entries.exa.config.webSearch.apiKey`
- `plugins.entries.google.config.webSearch.apiKey`
- `plugins.entries.xai.config.webSearch.apiKey`
- `plugins.entries.moonshot.config.webSearch.apiKey`
- `plugins.entries.perplexity.config.webSearch.apiKey`
- `plugins.entries.firecrawl.config.webSearch.apiKey`
- `plugins.entries.minimax.config.webSearch.apiKey`
- `plugins.entries.tavily.config.webSearch.apiKey`
- `tools.web.search.apiKey`
- `gateway.auth.password`
- `gateway.auth.token`
- `gateway.remote.token`
- `gateway.remote.password`
- `cron.webhookToken`
- `channels.telegram.botToken`
- `channels.telegram.webhookSecret`
- `channels.telegram.accounts.*.botToken`
- `channels.telegram.accounts.*.webhookSecret`
- `channels.slack.botToken`
- `channels.slack.appToken`
- `channels.slack.userToken`
- `channels.slack.signingSecret`
- `channels.slack.accounts.*.botToken`
- `channels.slack.accounts.*.appToken`
- `channels.slack.accounts.*.userToken`
- `channels.slack.accounts.*.signingSecret`
- `channels.discord.token`
- `channels.discord.pluralkit.token`
- `channels.discord.voice.tts.providers.*.apiKey`
- `channels.discord.accounts.*.token`
- `channels.discord.accounts.*.pluralkit.token`
- `channels.discord.accounts.*.voice.tts.providers.*.apiKey`
- `channels.irc.password`
- `channels.irc.nickserv.password`
- `channels.irc.accounts.*.password`
- `channels.irc.accounts.*.nickserv.password`
- `channels.bluebubbles.password`
- `channels.bluebubbles.accounts.*.password`
- `channels.feishu.appSecret`
- `channels.feishu.encryptKey`
- `channels.feishu.verificationToken`
- `channels.feishu.accounts.*.appSecret`
- `channels.feishu.accounts.*.encryptKey`
- `channels.feishu.accounts.*.verificationToken`
- `channels.msteams.appPassword`
- `channels.mattermost.botToken`
- `channels.mattermost.accounts.*.botToken`
- `channels.matrix.accessToken`
- `channels.matrix.password`
- `channels.matrix.accounts.*.accessToken`
- `channels.matrix.accounts.*.password`
- `channels.nextcloud-talk.botSecret`
- `channels.nextcloud-talk.apiPassword`
- `channels.nextcloud-talk.accounts.*.botSecret`
- `channels.nextcloud-talk.accounts.*.apiPassword`
- `channels.zalo.botToken`
- `channels.zalo.webhookSecret`
- `channels.zalo.accounts.*.botToken`
- `channels.zalo.accounts.*.webhookSecret`
- `channels.googlechat.serviceAccount` ผ่าน `serviceAccountRef` ที่เป็น sibling (ข้อยกเว้นเพื่อความเข้ากันได้)
- `channels.googlechat.accounts.*.serviceAccount` ผ่าน `serviceAccountRef` ที่เป็น sibling (ข้อยกเว้นเพื่อความเข้ากันได้)

### เป้าหมายใน `auth-profiles.json` (`secrets configure` + `secrets apply` + `secrets audit`)

- `profiles.*.keyRef` (`type: "api_key"`; ไม่รองรับเมื่อ `auth.profiles.<id>.mode = "oauth"`)
- `profiles.*.tokenRef` (`type: "token"`; ไม่รองรับเมื่อ `auth.profiles.<id>.mode = "oauth"`)

[//]: # "secretref-supported-list-end"

หมายเหตุ:

- เป้าหมายแผนของ auth-profile ต้องใช้ `agentId`
- รายการแผนจะชี้ไปที่ `profiles.*.key` / `profiles.*.token` และเขียน ref แบบ sibling (`keyRef` / `tokenRef`)
- ref ของ auth-profile ถูกรวมอยู่ในการ resolve ขณะรันไทม์และความครอบคลุมของการ audit
- ตัวป้องกันนโยบาย OAuth: `auth.profiles.<id>.mode = "oauth"` ไม่สามารถใช้ร่วมกับอินพุต SecretRef สำหรับโปรไฟล์นั้นได้ การเริ่มต้น/รีโหลดและการ resolve auth-profile จะ fail fast เมื่อมีการละเมิดนโยบายนี้
- สำหรับ model provider ที่จัดการด้วย SecretRef, รายการ `agents/*/agent/models.json` ที่ถูกสร้างขึ้นจะคง marker ที่ไม่ใช่ secret (ไม่ใช่ค่า secret ที่ resolve แล้ว) สำหรับพื้นผิว `apiKey`/header
- การคง marker ใช้ source-authoritative: OpenClaw เขียน marker จาก snapshot ของ config ต้นทางที่กำลังใช้งานอยู่ (ก่อน resolve) ไม่ใช่จากค่าความลับของรันไทม์ที่ resolve แล้ว
- สำหรับ web search:
  - ในโหมด explicit provider (ตั้ง `tools.web.search.provider` ไว้) จะมีเพียงคีย์ของ provider ที่เลือกเท่านั้นที่ active
  - ในโหมด auto (ยังไม่ได้ตั้ง `tools.web.search.provider`) จะมีเพียงคีย์ provider ตัวแรกที่ resolve ได้ตามลำดับความสำคัญเท่านั้นที่ active
  - ในโหมด auto, ref ของ provider ที่ไม่ได้ถูกเลือกจะถือว่า inactive จนกว่าจะถูกเลือก
  - พาธ provider แบบเดิมใน `tools.web.search.*` ยังคง resolve ได้ในช่วงหน้าต่างความเข้ากันได้ แต่พื้นผิว SecretRef แบบ canonical คือ `plugins.entries.<plugin>.config.webSearch.*`

## ข้อมูลรับรองที่ไม่รองรับ

ข้อมูลรับรองที่อยู่นอกขอบเขตประกอบด้วย:

[//]: # "secretref-unsupported-list-start"

- `commands.ownerDisplaySecret`
- `hooks.token`
- `hooks.gmail.pushToken`
- `hooks.mappings[].sessionKey`
- `auth-profiles.oauth.*`
- `channels.discord.threadBindings.webhookToken`
- `channels.discord.accounts.*.threadBindings.webhookToken`
- `channels.whatsapp.creds.json`
- `channels.whatsapp.accounts.*.creds.json`

[//]: # "secretref-unsupported-list-end"

เหตุผล:

- ข้อมูลรับรองเหล่านี้เป็นคลาสที่ถูกสร้างขึ้น หมุนเวียน มีสถานะของเซสชัน หรือคงอยู่แบบ OAuth ซึ่งไม่สอดคล้องกับการ resolve SecretRef ภายนอกแบบอ่านอย่างเดียว
