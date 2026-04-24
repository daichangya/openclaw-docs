---
read_when:
    - การใช้งานหรือกำหนดค่าคำสั่งแชต
    - การดีบักการกำหนดเส้นทางคำสั่งหรือสิทธิ์การเข้าถึง
summary: 'คำสั่งแบบสแลช: แบบข้อความเทียบกับแบบเนทีฟ การกำหนดค่า และคำสั่งที่รองรับ'
title: คำสั่งแบบสแลช
x-i18n:
    generated_at: "2026-04-24T09:38:23Z"
    model: gpt-5.4
    provider: openai
    source_hash: f708cb3c4c22dc7a97b62ce5e2283b4ecfa5c44f72eb501934e80f80181953b7
    source_path: tools/slash-commands.md
    workflow: 15
---

คำสั่งจะถูกจัดการโดย Gateway คำสั่งส่วนใหญ่ต้องส่งเป็นข้อความ **เดี่ยวๆ** ที่ขึ้นต้นด้วย `/`
คำสั่ง bash แชตแบบโฮสต์เท่านั้นใช้ `! <cmd>` (โดยมี `/bash <cmd>` เป็น alias)

มีสองระบบที่เกี่ยวข้องกัน:

- **Commands**: ข้อความ `/...` แบบเดี่ยวๆ
- **Directives**: `/think`, `/fast`, `/verbose`, `/trace`, `/reasoning`, `/elevated`, `/exec`, `/model`, `/queue`
  - Directives จะถูกตัดออกจากข้อความก่อนที่โมเดลจะเห็น
  - ในข้อความแชตปกติ (ไม่ใช่ข้อความที่มีแต่ directive) จะถือเป็น “คำใบ้แบบ inline” และ **จะไม่** คงค่าการตั้งค่าไว้ในเซสชัน
  - ในข้อความที่มีแต่ directive (ข้อความมีเฉพาะ directives) ค่านั้นจะถูกคงไว้ในเซสชันและตอบกลับด้วยการยืนยัน
  - Directives จะถูกนำไปใช้เฉพาะกับ **ผู้ส่งที่ได้รับอนุญาต** เท่านั้น หากตั้งค่า `commands.allowFrom` ไว้ จะใช้สิ่งนี้เป็น
    allowlist เดียว มิฉะนั้นการอนุญาตจะมาจาก channel allowlists/pairing ร่วมกับ `commands.useAccessGroups`
    ผู้ส่งที่ไม่ได้รับอนุญาตจะเห็น directives ถูกปฏิบัติเป็นข้อความธรรมดา

ยังมี **inline shortcuts** บางรายการด้วย (เฉพาะผู้ส่งที่อยู่ใน allowlist/ได้รับอนุญาต): `/help`, `/commands`, `/status`, `/whoami` (`/id`)
คำสั่งเหล่านี้จะทำงานทันที ถูกตัดออกก่อนที่โมเดลจะเห็นข้อความ และข้อความที่เหลือจะดำเนินต่อไปตามโฟลว์ปกติ

## การกำหนดค่า

```json5
{
  commands: {
    native: "auto",
    nativeSkills: "auto",
    text: true,
    bash: false,
    bashForegroundMs: 2000,
    config: false,
    mcp: false,
    plugins: false,
    debug: false,
    restart: true,
    ownerAllowFrom: ["discord:123456789012345678"],
    ownerDisplay: "raw",
    ownerDisplaySecret: "${OWNER_ID_HASH_SECRET}",
    allowFrom: {
      "*": ["user1"],
      discord: ["user:123"],
    },
    useAccessGroups: true,
  },
}
```

- `commands.text` (ค่าเริ่มต้น `true`) เปิดใช้การแยกวิเคราะห์ `/...` ในข้อความแชต
  - บนพื้นผิวที่ไม่มีคำสั่งแบบ native (WhatsApp/WebChat/Signal/iMessage/Google Chat/Microsoft Teams) คำสั่งแบบข้อความยังคงทำงานได้แม้คุณจะตั้งค่านี้เป็น `false`
- `commands.native` (ค่าเริ่มต้น `"auto"`) ลงทะเบียนคำสั่งแบบ native
  - Auto: เปิดสำหรับ Discord/Telegram; ปิดสำหรับ Slack (จนกว่าคุณจะเพิ่ม slash commands); ถูกละเลยสำหรับ provider ที่ไม่รองรับ native
  - ตั้งค่า `channels.discord.commands.native`, `channels.telegram.commands.native` หรือ `channels.slack.commands.native` เพื่อ override แยกตาม provider (bool หรือ `"auto"`)
  - `false` จะล้างคำสั่งที่ลงทะเบียนไว้ก่อนหน้านี้บน Discord/Telegram ตอนเริ่มต้น Slack commands จัดการในแอป Slack และจะไม่ถูกลบโดยอัตโนมัติ
- `commands.nativeSkills` (ค่าเริ่มต้น `"auto"`) ลงทะเบียนคำสั่ง **skill** แบบ native เมื่อรองรับ
  - Auto: เปิดสำหรับ Discord/Telegram; ปิดสำหรับ Slack (Slack ต้องสร้าง slash command แยกสำหรับแต่ละ skill)
  - ตั้งค่า `channels.discord.commands.nativeSkills`, `channels.telegram.commands.nativeSkills` หรือ `channels.slack.commands.nativeSkills` เพื่อ override แยกตาม provider (bool หรือ `"auto"`)
- `commands.bash` (ค่าเริ่มต้น `false`) เปิดใช้ `! <cmd>` เพื่อรันคำสั่ง shell บนโฮสต์ (`/bash <cmd>` เป็น alias; ต้องใช้ allowlists ของ `tools.elevated`)
- `commands.bashForegroundMs` (ค่าเริ่มต้น `2000`) ควบคุมระยะเวลาที่ bash จะรอก่อนสลับไปโหมดเบื้องหลัง (`0` จะย้ายไปเบื้องหลังทันที)
- `commands.config` (ค่าเริ่มต้น `false`) เปิดใช้ `/config` (อ่าน/เขียน `openclaw.json`)
- `commands.mcp` (ค่าเริ่มต้น `false`) เปิดใช้ `/mcp` (อ่าน/เขียน config MCP ที่ OpenClaw จัดการภายใต้ `mcp.servers`)
- `commands.plugins` (ค่าเริ่มต้น `false`) เปิดใช้ `/plugins` (การค้นหา/สถานะ Plugin พร้อมตัวควบคุม install + enable/disable)
- `commands.debug` (ค่าเริ่มต้น `false`) เปิดใช้ `/debug` (override เฉพาะรันไทม์)
- `commands.restart` (ค่าเริ่มต้น `true`) เปิดใช้ `/restart` พร้อม action ของเครื่องมือรีสตาร์ต gateway
- `commands.ownerAllowFrom` (ไม่บังคับ) ตั้ง explicit owner allowlist สำหรับพื้นผิวคำสั่ง/เครื่องมือที่เป็น owner-only โดยแยกจาก `commands.allowFrom`
- ค่า `channels.<channel>.commands.enforceOwnerForCommands` ต่อช่องทาง (ไม่บังคับ ค่าเริ่มต้น `false`) จะทำให้คำสั่งที่เป็น owner-only ต้องใช้ **ตัวตนของ owner** เพื่อรันบนพื้นผิวนั้น เมื่อเป็น `true` ผู้ส่งต้องตรงกับ resolved owner candidate (เช่น รายการใน `commands.ownerAllowFrom` หรือเมทาดาทา owner แบบ native ของ provider) หรือมี scope ภายใน `operator.admin` บน internal message channel รายการ wildcard ใน `allowFrom` ของ channel หรือรายการ owner-candidate ที่ว่าง/resolve ไม่ได้ **ไม่** เพียงพอ — คำสั่ง owner-only จะ fail closed บน channel นั้น ปล่อยค่านี้ไว้ปิดหากคุณต้องการให้คำสั่ง owner-only ถูกควบคุมด้วย `ownerAllowFrom` และ allowlists คำสั่งมาตรฐานเท่านั้น
- `commands.ownerDisplay` ควบคุมวิธีที่ owner ids ปรากฏใน system prompt: `raw` หรือ `hash`
- `commands.ownerDisplaySecret` ใช้ตั้งค่า HMAC secret แบบเลือกได้เมื่อ `commands.ownerDisplay="hash"`
- `commands.allowFrom` (ไม่บังคับ) ตั้ง per-provider allowlist สำหรับการอนุญาตคำสั่ง เมื่อกำหนดค่าไว้แล้ว จะเป็น
  แหล่งการอนุญาตเพียงแหล่งเดียวสำหรับ commands และ directives (channel allowlists/pairing และ `commands.useAccessGroups`
  จะถูกละเลย) ใช้ `"*"` สำหรับค่าเริ่มต้นแบบ global; คีย์เฉพาะ provider จะ override ค่านี้
- `commands.useAccessGroups` (ค่าเริ่มต้น `true`) บังคับใช้ allowlists/policies สำหรับคำสั่งเมื่อไม่ได้ตั้งค่า `commands.allowFrom`

## รายการคำสั่ง

แหล่งข้อมูลจริงในปัจจุบัน:

- core built-ins มาจาก `src/auto-reply/commands-registry.shared.ts`
- dock commands ที่สร้างขึ้นมาจาก `src/auto-reply/commands-registry.data.ts`
- plugin commands มาจากการเรียก `registerCommand()` ของ Plugin
- ความพร้อมใช้งานจริงบน gateway ของคุณยังขึ้นอยู่กับแฟล็ก config, พื้นผิวของ channel และ Plugins ที่ติดตั้ง/เปิดใช้งานอยู่

### คำสั่ง built-in ของ core

คำสั่ง built-in ที่ใช้งานได้ในตอนนี้:

- `/new [model]` เริ่มเซสชันใหม่; `/reset` เป็น alias สำหรับรีเซ็ต
- `/reset soft [message]` จะคงทรานสคริปต์ปัจจุบันไว้ ลบ session ids ของ CLI backend ที่นำกลับมาใช้ใหม่ และรันการโหลด startup/system-prompt ใหม่ในที่เดิม
- `/compact [instructions]` ทำ Compaction ให้กับ context ของเซสชัน ดู [/concepts/compaction](/th/concepts/compaction)
- `/stop` ยกเลิกการรันปัจจุบัน
- `/session idle <duration|off>` และ `/session max-age <duration|off>` จัดการอายุหมดของ thread-binding
- `/think <level>` ตั้งค่าระดับการคิด ตัวเลือกมาจาก provider profile ของโมเดลที่ใช้งานอยู่ ระดับที่พบได้บ่อยคือ `off`, `minimal`, `low`, `medium` และ `high` พร้อมทั้งระดับแบบกำหนดเองเช่น `xhigh`, `adaptive`, `max` หรือแบบไบนารี `on` เฉพาะเมื่อรองรับ Aliases: `/thinking`, `/t`
- `/verbose on|off|full` สลับการแสดงผลแบบ verbose Alias: `/v`
- `/trace on|off` สลับเอาต์พุต trace ของ Plugin สำหรับเซสชันปัจจุบัน
- `/fast [status|on|off]` แสดงหรือตั้งค่า fast mode
- `/reasoning [on|off|stream]` สลับการมองเห็น reasoning Alias: `/reason`
- `/elevated [on|off|ask|full]` สลับ elevated mode Alias: `/elev`
- `/exec host=<auto|sandbox|gateway|node> security=<deny|allowlist|full> ask=<off|on-miss|always> node=<id>` แสดงหรือตั้งค่า exec defaults
- `/model [name|#|status]` แสดงหรือตั้งค่าโมเดล
- `/models [provider] [page] [limit=<n>|size=<n>|all]` แสดงรายการ providers หรือโมเดลของ provider
- `/queue <mode>` จัดการพฤติกรรมคิว (`steer`, `interrupt`, `followup`, `collect`, `steer-backlog`) พร้อมตัวเลือกอย่าง `debounce:2s cap:25 drop:summarize`
- `/help` แสดงสรุปความช่วยเหลือแบบสั้น
- `/commands` แสดงแค็ตตาล็อกคำสั่งที่สร้างขึ้น
- `/tools [compact|verbose]` แสดงสิ่งที่เอเจนต์ปัจจุบันใช้ได้ในขณะนี้
- `/status` แสดงสถานะรันไทม์ รวมถึงป้าย `Runtime`/`Runner` และการใช้/โควตาของ provider เมื่อมี
- `/tasks` แสดงรายการงานเบื้องหลังที่กำลังทำงาน/ล่าสุดของเซสชันปัจจุบัน
- `/context [list|detail|json]` อธิบายวิธีประกอบ context
- `/export-session [path]` ส่งออกเซสชันปัจจุบันเป็น HTML Alias: `/export`
- `/export-trajectory [path]` ส่งออก [trajectory bundle](/th/tools/trajectory) แบบ JSONL สำหรับเซสชันปัจจุบัน Alias: `/trajectory`
- `/whoami` แสดง sender id ของคุณ Alias: `/id`
- `/skill <name> [input]` รัน skill ตามชื่อ
- `/allowlist [list|add|remove] ...` จัดการรายการ allowlist แบบข้อความเท่านั้น
- `/approve <id> <decision>` จัดการพรอมป์อนุมัติ exec ให้เสร็จสิ้น
- `/btw <question>` ถามคำถามแทรกโดยไม่เปลี่ยน context ของเซสชันในอนาคต ดู [/tools/btw](/th/tools/btw)
- `/subagents list|kill|log|info|send|steer|spawn` จัดการการรัน sub-agent สำหรับเซสชันปัจจุบัน
- `/acp spawn|cancel|steer|close|sessions|status|set-mode|set|cwd|permissions|timeout|model|reset-options|doctor|install|help` จัดการเซสชัน ACP และตัวเลือกของรันไทม์
- `/focus <target>` ผูก Discord thread หรือ Telegram topic/conversation ปัจจุบันเข้ากับเป้าหมายของเซสชัน
- `/unfocus` เอาการผูกปัจจุบันออก
- `/agents` แสดงรายการเอเจนต์ที่ผูกกับเธรดสำหรับเซสชันปัจจุบัน
- `/kill <id|#|all>` ยกเลิก sub-agent ที่กำลังรันอยู่หนึ่งตัวหรือทั้งหมด
- `/steer <id|#> <message>` ส่งคำสั่ง steer ไปยัง sub-agent ที่กำลังรันอยู่ Alias: `/tell`
- `/config show|get|set|unset` อ่านหรือเขียน `openclaw.json` Owner-only ต้องใช้ `commands.config: true`
- `/mcp show|get|set|unset` อ่านหรือเขียน config MCP server ที่ OpenClaw จัดการภายใต้ `mcp.servers` Owner-only ต้องใช้ `commands.mcp: true`
- `/plugins list|inspect|show|get|install|enable|disable` ตรวจสอบหรือเปลี่ยนสถานะ Plugin `/plugin` เป็น alias เขียนได้เฉพาะ owner-only ต้องใช้ `commands.plugins: true`
- `/debug show|set|unset|reset` จัดการ runtime-only config overrides Owner-only ต้องใช้ `commands.debug: true`
- `/usage off|tokens|full|cost` ควบคุมส่วนท้ายการใช้งานต่อคำตอบ หรือพิมพ์สรุปต้นทุนในเครื่อง
- `/tts on|off|status|provider|limit|summary|audio|help` ควบคุม TTS ดู [/tools/tts](/th/tools/tts)
- `/restart` รีสตาร์ต OpenClaw เมื่อเปิดใช้งาน ค่าเริ่มต้น: เปิด; ตั้ง `commands.restart: false` เพื่อปิด
- `/activation mention|always` ตั้งค่าโหมดการเปิดใช้งานในกลุ่ม
- `/send on|off|inherit` ตั้งค่านโยบายการส่ง Owner-only
- `/bash <command>` รันคำสั่ง shell บนโฮสต์ แบบข้อความเท่านั้น Alias: `! <command>` ต้องใช้ `commands.bash: true` และ allowlists ของ `tools.elevated`
- `!poll [sessionId]` ตรวจสอบงาน bash เบื้องหลัง
- `!stop [sessionId]` หยุดงาน bash เบื้องหลัง

### Dock commands ที่สร้างขึ้น

Dock commands ถูกสร้างจาก channel plugins ที่รองรับ native-command ชุดที่มากับระบบในปัจจุบัน:

- `/dock-discord` (alias: `/dock_discord`)
- `/dock-mattermost` (alias: `/dock_mattermost`)
- `/dock-slack` (alias: `/dock_slack`)
- `/dock-telegram` (alias: `/dock_telegram`)

### คำสั่งจาก Plugin ที่มากับระบบ

Bundled plugins สามารถเพิ่ม slash commands ได้อีก คำสั่ง bundled ปัจจุบันใน repo นี้:

- `/dreaming [on|off|status|help]` สลับ memory dreaming ดู [Dreaming](/th/concepts/dreaming)
- `/pair [qr|status|pending|approve|cleanup|notify]` จัดการโฟลว์การจับคู่/การตั้งค่าอุปกรณ์ ดู [Pairing](/th/channels/pairing)
- `/phone status|arm <camera|screen|writes|all> [duration]|disarm` เปิดใช้งานคำสั่ง phone node ที่มีความเสี่ยงสูงชั่วคราว
- `/voice status|list [limit]|set <voiceId|name>` จัดการ config เสียงของ Talk บน Discord ชื่อคำสั่งแบบ native คือ `/talkvoice`
- `/card ...` ส่งพรีเซ็ต rich card ของ LINE ดู [LINE](/th/channels/line)
- `/codex status|models|threads|resume|compact|review|account|mcp|skills` ตรวจสอบและควบคุม app-server harness ของ Codex ที่มากับระบบ ดู [Codex Harness](/th/plugins/codex-harness)
- คำสั่งเฉพาะ QQBot:
  - `/bot-ping`
  - `/bot-version`
  - `/bot-help`
  - `/bot-upgrade`
  - `/bot-logs`

### Dynamic skill commands

Skills ที่ผู้ใช้เรียกได้จะถูกเปิดเผยเป็น slash commands ด้วย:

- `/skill <name> [input]` ใช้งานได้เสมอในฐานะ entrypoint แบบทั่วไป
- skills อาจปรากฏเป็นคำสั่งตรง เช่น `/prose` เมื่อ skill/plugin ลงทะเบียนไว้
- การลงทะเบียน native skill-command ถูกควบคุมโดย `commands.nativeSkills` และ `channels.<provider>.commands.nativeSkills`

หมายเหตุ:

- คำสั่งรองรับ `:` แบบเลือกได้ระหว่างคำสั่งกับอาร์กิวเมนต์ (เช่น `/think: high`, `/send: on`, `/help:`)
- `/new <model>` รองรับ model alias, `provider/model` หรือชื่อ provider (จับคู่แบบ fuzzy); หากไม่พบที่ตรงกัน ข้อความจะถูกถือเป็นเนื้อหาข้อความ
- สำหรับรายละเอียดการใช้งาน provider แบบเต็ม ให้ใช้ `openclaw status --usage`
- `/allowlist add|remove` ต้องใช้ `commands.config=true` และเป็นไปตาม `configWrites` ของ channel
- ใน channel แบบหลายบัญชี `/allowlist --account <id>` ที่กำหนดเป้าหมาย config และ `/config set channels.<provider>.accounts.<id>...` จะเป็นไปตาม `configWrites` ของบัญชีเป้าหมายด้วย
- `/usage` ควบคุมส่วนท้ายการใช้งานต่อคำตอบ; `/usage cost` พิมพ์สรุปต้นทุนในเครื่องจาก session logs ของ OpenClaw
- `/restart` เปิดใช้งานโดยค่าเริ่มต้น; ตั้ง `commands.restart: false` เพื่อปิดใช้งาน
- `/plugins install <spec>` รองรับ plugin specs แบบเดียวกับ `openclaw plugins install`: local path/archive, npm package หรือ `clawhub:<pkg>`
- `/plugins enable|disable` จะอัปเดต config ของ Plugin และอาจขอให้รีสตาร์ต
- คำสั่งแบบ native เฉพาะ Discord: `/vc join|leave|status` ใช้ควบคุม voice channels (ต้องใช้ `channels.discord.voice` และ native commands; ไม่มีให้ใช้เป็นข้อความ)
- คำสั่ง Discord thread-binding (`/focus`, `/unfocus`, `/agents`, `/session idle`, `/session max-age`) ต้องเปิดใช้ effective thread bindings (`session.threadBindings.enabled` และ/หรือ `channels.discord.threadBindings.enabled`)
- เอกสารอ้างอิงคำสั่ง ACP และพฤติกรรมของรันไทม์: [ACP Agents](/th/tools/acp-agents)
- `/verbose` มีไว้สำหรับการดีบักและการมองเห็นเพิ่มเติม; ในการใช้งานปกติควรปิดไว้ **off**
- `/trace` แคบกว่า `/verbose`: มันเปิดเผยเฉพาะบรรทัด trace/debug ที่ Plugin เป็นเจ้าของ และคงการแสดงข้อความเครื่องมือแบบ verbose ปกติไว้ปิด
- `/fast on|off` จะคงค่า override ของเซสชันไว้ ใช้ตัวเลือก `inherit` ใน Sessions UI เพื่อล้างค่าและ fallback กลับไปใช้ค่าเริ่มต้นจาก config
- `/fast` ขึ้นอยู่กับ provider: OpenAI/OpenAI Codex จะ map ไปเป็น `service_tier=priority` บน native Responses endpoints ขณะที่คำขอ Anthropic สาธารณะแบบตรง รวมถึงทราฟฟิกที่ยืนยันตัวตนด้วย OAuth และส่งไปยัง `api.anthropic.com` จะ map ไปเป็น `service_tier=auto` หรือ `standard_only` ดู [OpenAI](/th/providers/openai) และ [Anthropic](/th/providers/anthropic)
- สรุปความล้มเหลวของเครื่องมือยังคงแสดงเมื่อเกี่ยวข้อง แต่ข้อความความล้มเหลวแบบละเอียดจะรวมมาด้วยเฉพาะเมื่อ `/verbose` เป็น `on` หรือ `full`
- `/reasoning`, `/verbose` และ `/trace` มีความเสี่ยงในบริบทกลุ่ม: อาจเปิดเผย reasoning ภายใน เอาต์พุตของเครื่องมือ หรือข้อมูลวินิจฉัยของ Plugin ที่คุณไม่ได้ตั้งใจให้เห็น ควรปล่อยไว้ปิด โดยเฉพาะในแชตกลุ่ม
- `/model` จะคงโมเดลเซสชันใหม่ทันที
- หากเอเจนต์กำลังว่าง การรันครั้งถัดไปจะใช้โมเดลนั้นทันที
- หากมีการรันที่กำลังทำงานอยู่แล้ว OpenClaw จะทำเครื่องหมายการสลับแบบ live ว่ารอดำเนินการ และจะรีสตาร์ตเข้าโมเดลใหม่เมื่อถึงจุด retry ที่เหมาะสม
- หากกิจกรรมของเครื่องมือหรือเอาต์พุตคำตอบเริ่มไปแล้ว การสลับที่รอดำเนินการอาจค้างอยู่จนกว่าจะมีโอกาส retry ภายหลังหรือถึงเทิร์นถัดไปของผู้ใช้
- **เส้นทางเร็ว:** ข้อความที่มีแต่คำสั่งจากผู้ส่งที่อยู่ใน allowlist จะถูกจัดการทันที (ข้ามคิว + โมเดล)
- **การควบคุมด้วยการ mention ในกลุ่ม:** ข้อความที่มีแต่คำสั่งจากผู้ส่งที่อยู่ใน allowlist จะข้ามข้อกำหนดการ mention
- **Inline shortcuts (เฉพาะผู้ส่งใน allowlist):** คำสั่งบางรายการยังใช้ได้เมื่อฝังอยู่ในข้อความปกติ และจะถูกตัดออกก่อนที่โมเดลจะเห็นข้อความที่เหลือ
  - ตัวอย่าง: `hey /status` จะทริกเกอร์คำตอบสถานะ และข้อความที่เหลือจะไปตามโฟลว์ปกติ
- ปัจจุบัน: `/help`, `/commands`, `/status`, `/whoami` (`/id`)
- ข้อความที่มีแต่คำสั่งจากผู้ใช้ที่ไม่ได้รับอนุญาตจะถูกเพิกเฉยอย่างเงียบๆ และโทเค็น `/...` แบบ inline จะถูกถือเป็นข้อความธรรมดา
- **Skill commands:** Skills ที่เป็น `user-invocable` จะถูกเปิดเผยเป็น slash commands ด้วย ชื่อจะถูกปรับให้อยู่ในรูป `a-z0-9_` (สูงสุด 32 อักขระ); หากชนกันจะเติม suffix เป็นตัวเลข (เช่น `_2`)
  - `/skill <name> [input]` รัน skill ตามชื่อ (มีประโยชน์เมื่อข้อจำกัดของ native command ทำให้สร้างคำสั่งแยกต่อ skill ไม่ได้)
  - โดยค่าเริ่มต้น skill commands จะถูกส่งต่อให้โมเดลเป็นคำขอปกติ
  - Skills สามารถประกาศ `command-dispatch: tool` แบบเลือกได้ เพื่อกำหนดเส้นทางคำสั่งไปยังเครื่องมือโดยตรง (กำหนดผลได้แน่นอน ไม่ใช้โมเดล)
  - ตัวอย่าง: `/prose` (Plugin OpenProse) — ดู [OpenProse](/th/prose)
- **อาร์กิวเมนต์ของ native command:** Discord ใช้ autocomplete สำหรับตัวเลือกแบบ dynamic (และเมนูปุ่มเมื่อคุณละอาร์กิวเมนต์ที่จำเป็น) Telegram และ Slack จะแสดงเมนูปุ่มเมื่อคำสั่งรองรับตัวเลือกและคุณละอาร์กิวเมนต์นั้น

## `/tools`

`/tools` ตอบคำถามด้านรันไทม์ ไม่ใช่คำถามด้าน config: **เอเจนต์นี้ใช้สิ่งใดได้บ้างในตอนนี้
ในการสนทนานี้**

- `/tools` แบบค่าเริ่มต้นเป็นแบบย่อ และปรับให้เหมาะกับการสแกนอย่างรวดเร็ว
- `/tools verbose` จะเพิ่มคำอธิบายสั้นๆ
- พื้นผิวแบบ native-command ที่รองรับอาร์กิวเมนต์จะเปิดเผยตัวสลับโหมดเดียวกันเป็น `compact|verbose`
- ผลลัพธ์มีขอบเขตในระดับเซสชัน ดังนั้นการเปลี่ยนเอเจนต์ channel thread การอนุญาตของผู้ส่ง หรือโมเดล สามารถ
  เปลี่ยนเอาต์พุตได้
- `/tools` รวมเครื่องมือที่เข้าถึงได้จริงในรันไทม์ รวมถึงเครื่องมือ core เครื่องมือ Plugin ที่เชื่อมต่ออยู่ และเครื่องมือที่เป็นเจ้าของโดย channel

สำหรับการแก้ไข profile และ override ให้ใช้แผง Tools ใน Control UI หรือพื้นผิว config/catalog แทน
อย่ามอง `/tools` ว่าเป็นแค็ตตาล็อกแบบคงที่

## พื้นผิวการใช้งาน (อะไรแสดงที่ไหน)

- **การใช้งาน/โควตาของ provider** (ตัวอย่าง: “Claude เหลือ 80%”) จะแสดงใน `/status` สำหรับ provider ของโมเดลปัจจุบันเมื่อเปิดใช้การติดตามการใช้งาน OpenClaw จะทำให้หน้าต่างการใช้งานของ provider เป็นมาตรฐานเป็น `% ที่เหลือ`; สำหรับ MiniMax ฟิลด์เปอร์เซ็นต์แบบ remaining-only จะถูกกลับค่าก่อนแสดง และการตอบกลับ `model_remains` จะเลือกใช้รายการ chat-model พร้อมป้ายแผนที่มี model tag ก่อน
- **บรรทัด token/cache** ใน `/status` สามารถ fallback ไปใช้รายการ usage ล่าสุดของทรานสคริปต์ได้ เมื่อ snapshot ของเซสชัน live มีข้อมูลน้อย ค่าจริงแบบ live ที่ไม่เป็นศูนย์ยังคงมีสิทธิ์เหนือกว่า และ transcript fallback ยังสามารถกู้คืนป้ายชื่อโมเดลรันไทม์ที่ใช้งานอยู่รวมถึงค่ารวมที่เน้น prompt และมีขนาดใหญ่กว่าได้เมื่อค่ารวมที่เก็บไว้ไม่มีหรือเล็กกว่า
- **Runtime เทียบกับ runner:** `/status` รายงาน `Runtime` สำหรับเส้นทางการทำงานจริงและสถานะ sandbox และ `Runner` สำหรับผู้ที่รันเซสชันจริง: Pi แบบฝัง, provider ที่รองรับ CLI หรือ ACP harness/backend
- **โทเค็น/ต้นทุนต่อคำตอบ** ควบคุมโดย `/usage off|tokens|full` (ต่อท้ายในคำตอบปกติ)
- `/model status` เกี่ยวกับ **models/auth/endpoints** ไม่ใช่การใช้งาน

## การเลือกโมเดล (`/model`)

`/model` ถูกติดตั้งใช้งานในรูปแบบ directive

ตัวอย่าง:

```
/model
/model list
/model 3
/model openai/gpt-5.4
/model opus@anthropic:default
/model status
```

หมายเหตุ:

- `/model` และ `/model list` จะแสดงตัวเลือกแบบย่อที่มีหมายเลขกำกับ (ตระกูลโมเดล + providers ที่ใช้งานได้)
- บน Discord, `/model` และ `/models` จะเปิดตัวเลือกแบบโต้ตอบพร้อมดรอปดาวน์ของ provider และโมเดล รวมถึงขั้นตอน Submit
- `/model <#>` ใช้เลือกจากตัวเลือกนั้น (และจะเลือก provider ปัจจุบันก่อนหากเป็นไปได้)
- `/model status` จะแสดงมุมมองแบบละเอียด รวมถึง endpoint (`baseUrl`) และโหมด API (`api`) ของ provider ที่กำหนดค่าไว้เมื่อมี

## Debug overrides

`/debug` ช่วยให้คุณตั้งค่า config overrides แบบ **เฉพาะรันไทม์** (อยู่ในหน่วยความจำ ไม่ใช่บนดิสก์) Owner-only ปิดไว้โดยค่าเริ่มต้น; เปิดใช้ด้วย `commands.debug: true`

ตัวอย่าง:

```
/debug show
/debug set messages.responsePrefix="[openclaw]"
/debug set channels.whatsapp.allowFrom=["+1555","+4477"]
/debug unset messages.responsePrefix
/debug reset
```

หมายเหตุ:

- Overrides มีผลทันทีต่อการอ่าน config ใหม่ แต่จะ **ไม่** เขียนลง `openclaw.json`
- ใช้ `/debug reset` เพื่อล้าง overrides ทั้งหมดและกลับไปใช้ config บนดิสก์

## เอาต์พุต trace ของ Plugin

`/trace` ช่วยให้คุณสลับ **บรรทัด trace/debug ของ Plugin ที่มีขอบเขตระดับเซสชัน** ได้โดยไม่ต้องเปิด full verbose mode

ตัวอย่าง:

```text
/trace
/trace on
/trace off
```

หมายเหตุ:

- `/trace` โดยไม่ใส่อาร์กิวเมนต์จะแสดงสถานะ trace ปัจจุบันของเซสชัน
- `/trace on` เปิดใช้บรรทัด trace ของ Plugin สำหรับเซสชันปัจจุบัน
- `/trace off` ปิดอีกครั้ง
- บรรทัด trace ของ Plugin อาจปรากฏใน `/status` และในข้อความวินิจฉัยติดตามหลังคำตอบปกติของผู้ช่วย
- `/trace` ไม่ได้ใช้แทน `/debug`; `/debug` ยังคงใช้จัดการ runtime-only config overrides
- `/trace` ไม่ได้ใช้แทน `/verbose`; เอาต์พุตเครื่องมือ/สถานะแบบ verbose ปกติยังคงเป็นหน้าที่ของ `/verbose`

## การอัปเดต config

`/config` จะเขียนไปยัง config บนดิสก์ของคุณ (`openclaw.json`) Owner-only ปิดไว้โดยค่าเริ่มต้น; เปิดใช้ด้วย `commands.config: true`

ตัวอย่าง:

```
/config show
/config show messages.responsePrefix
/config get messages.responsePrefix
/config set messages.responsePrefix="[openclaw]"
/config unset messages.responsePrefix
```

หมายเหตุ:

- config จะถูกตรวจสอบความถูกต้องก่อนเขียน; การเปลี่ยนแปลงที่ไม่ถูกต้องจะถูกปฏิเสธ
- การอัปเดตจาก `/config` จะคงอยู่ข้ามการรีสตาร์ต

## การอัปเดต MCP

`/mcp` จะเขียนคำจำกัดความ MCP server ที่ OpenClaw จัดการไว้ภายใต้ `mcp.servers` Owner-only ปิดไว้โดยค่าเริ่มต้น; เปิดใช้ด้วย `commands.mcp: true`

ตัวอย่าง:

```text
/mcp show
/mcp show context7
/mcp set context7={"command":"uvx","args":["context7-mcp"]}
/mcp unset context7
```

หมายเหตุ:

- `/mcp` เก็บ config ไว้ใน config ของ OpenClaw ไม่ใช่การตั้งค่าโปรเจกต์ที่ Pi เป็นเจ้าของ
- runtime adapters เป็นผู้ตัดสินว่า transport ใดสามารถรันได้จริง

## การอัปเดต Plugin

`/plugins` ช่วยให้โอเปอเรเตอร์ตรวจสอบ Plugins ที่ค้นพบและสลับการเปิดใช้งานใน config ได้ โฟลว์แบบอ่านอย่างเดียวสามารถใช้ `/plugin` เป็น alias ได้ ปิดไว้โดยค่าเริ่มต้น; เปิดใช้ด้วย `commands.plugins: true`

ตัวอย่าง:

```text
/plugins
/plugins list
/plugin show context7
/plugins enable context7
/plugins disable context7
```

หมายเหตุ:

- `/plugins list` และ `/plugins show` ใช้การค้นหา Plugin จริงกับ workspace ปัจจุบันและ config บนดิสก์
- `/plugins enable|disable` อัปเดตเฉพาะ config ของ Plugin; ไม่ได้ติดตั้งหรือลบการติดตั้ง Plugin
- หลังจากเปลี่ยน enable/disable ให้รีสตาร์ต gateway เพื่อให้มีผล

## หมายเหตุของพื้นผิว

- **คำสั่งแบบข้อความ** ทำงานในเซสชันแชตปกติ (DMs ใช้ `main` ร่วมกัน, กลุ่มมีเซสชันของตัวเอง)
- **คำสั่งแบบ native** ใช้เซสชันแยก:
  - Discord: `agent:<agentId>:discord:slash:<userId>`
  - Slack: `agent:<agentId>:slack:slash:<userId>` (prefix กำหนดค่าได้ผ่าน `channels.slack.slashCommand.sessionPrefix`)
  - Telegram: `telegram:slash:<userId>` (กำหนดเป้าหมายไปยังเซสชันแชตผ่าน `CommandTargetSessionKey`)
- **`/stop`** กำหนดเป้าหมายไปยังเซสชันแชตที่กำลังใช้งาน เพื่อยกเลิกการรันปัจจุบัน
- **Slack:** `channels.slack.slashCommand` ยังรองรับสำหรับคำสั่งแบบเดี่ยวสไตล์ `/openclaw` หากคุณเปิด `commands.native` คุณต้องสร้าง Slack slash command หนึ่งรายการต่อคำสั่ง built-in (ใช้ชื่อเดียวกับ `/help`) เมนูอาร์กิวเมนต์ของคำสั่งสำหรับ Slack จะส่งเป็นปุ่ม Block Kit แบบ ephemeral
  - ข้อยกเว้นของ Slack native: ลงทะเบียน `/agentstatus` (ไม่ใช่ `/status`) เพราะ Slack สงวน `/status` ไว้ ข้อความ `/status` ยังคงใช้ได้ในข้อความ Slack

## BTW side questions

`/btw` คือ **คำถามแทรก** แบบรวดเร็วเกี่ยวกับเซสชันปัจจุบัน

ต่างจากแชตปกติ:

- มันใช้เซสชันปัจจุบันเป็นบริบทพื้นหลัง
- มันรันเป็นการเรียกแบบครั้งเดียวแยกต่างหากที่ **ไม่มีเครื่องมือ**
- มันไม่เปลี่ยน context ของเซสชันในอนาคต
- มันไม่ถูกเขียนลงในประวัติทรานสคริปต์
- มันถูกส่งเป็นผลลัพธ์แทรกแบบสดแทนข้อความผู้ช่วยปกติ

สิ่งนี้ทำให้ `/btw` มีประโยชน์เมื่อคุณต้องการคำชี้แจงชั่วคราวในขณะที่งานหลัก
ยังดำเนินต่อไป

ตัวอย่าง:

```text
/btw what are we doing right now?
```

ดู [BTW Side Questions](/th/tools/btw) สำหรับรายละเอียดพฤติกรรมแบบเต็มและ UX
ของไคลเอนต์

## ที่เกี่ยวข้อง

- [Skills](/th/tools/skills)
- [Skills config](/th/tools/skills-config)
- [Creating skills](/th/tools/creating-skills)
