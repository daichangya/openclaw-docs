---
read_when:
    - การใช้หรือตั้งค่าคำสั่งแชต
    - การดีบักการกำหนดเส้นทางคำสั่งหรือสิทธิ์ გამოყენassistant to=final code omitted.
summary: 'Slash commands: แบบข้อความเทียบกับแบบ native, คอนฟิก และคำสั่งที่รองรับ'
title: Slash Commands
x-i18n:
    generated_at: "2026-04-23T06:03:36Z"
    model: gpt-5.4
    provider: openai
    source_hash: 43cc050149de60ca39083009fd6ce566af3bfa79d455e2e0f44e2d878bf4d2d9
    source_path: tools/slash-commands.md
    workflow: 15
---

# Slash Commands

คำสั่งต่าง ๆ ถูกจัดการโดย Gateway คำสั่งส่วนใหญ่ต้องส่งเป็นข้อความ **เดี่ยว**
ที่ขึ้นต้นด้วย `/`
คำสั่งแชตแบบ bash ที่ใช้ได้เฉพาะโฮสต์ใช้ `! <cmd>` (โดยมี `/bash <cmd>` เป็น alias)

มีสองระบบที่เกี่ยวข้องกัน:

- **Commands**: ข้อความเดี่ยวแบบ `/...`
- **Directives**: `/think`, `/fast`, `/verbose`, `/trace`, `/reasoning`, `/elevated`, `/exec`, `/model`, `/queue`
  - directive จะถูกตัดออกจากข้อความก่อนที่โมเดลจะเห็น
  - ในข้อความแชตปกติ (ไม่ใช่ directive-only) มันจะถูกมองเป็น “inline hint” และจะ **ไม่**คงการตั้งค่าไว้ในเซสชัน
  - ในข้อความแบบ directive-only (ข้อความมีแต่ directive เท่านั้น) มันจะถูกเก็บถาวรลงในเซสชันและตอบกลับด้วยข้อความยืนยัน
  - directive จะถูกใช้งานเฉพาะสำหรับ **ผู้ส่งที่ได้รับอนุญาต** เท่านั้น หากตั้งค่า `commands.allowFrom` ไว้ มันจะเป็น allowlist เดียวที่ใช้ มิฉะนั้นการอนุญาตจะมาจาก allowlist/pairing ของช่องทางร่วมกับ `commands.useAccessGroups`
    ผู้ส่งที่ไม่ได้รับอนุญาตจะเห็น directive ถูกปฏิบัติเป็นข้อความธรรมดา

ยังมี **inline shortcut** ไม่กี่ตัว (เฉพาะผู้ส่งที่อยู่ใน allowlist/ได้รับอนุญาต): `/help`, `/commands`, `/status`, `/whoami` (`/id`)
ซึ่งจะทำงานทันที ถูกตัดออกก่อนที่โมเดลจะเห็น และข้อความที่เหลือจะเข้าสู่โฟลว์ปกติต่อไป

## คอนฟิก

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

- `commands.text` (ค่าเริ่มต้น `true`) เปิดใช้การ parse `/...` ในข้อความแชต
  - บนพื้นผิวที่ไม่มี native command (WhatsApp/WebChat/Signal/iMessage/Google Chat/Microsoft Teams) text command ก็ยังทำงานได้ แม้คุณจะตั้งค่านี้เป็น `false`
- `commands.native` (ค่าเริ่มต้น `"auto"`) ลงทะเบียน native command
  - Auto: เปิดสำหรับ Discord/Telegram; ปิดสำหรับ Slack (จนกว่าคุณจะเพิ่ม slash command); ไม่มีผลกับผู้ให้บริการที่ไม่รองรับ native
  - ตั้ง `channels.discord.commands.native`, `channels.telegram.commands.native` หรือ `channels.slack.commands.native` เพื่อ override แยกตามผู้ให้บริการ (bool หรือ `"auto"`)
  - `false` จะล้างคำสั่งที่ลงทะเบียนไว้ก่อนหน้านี้บน Discord/Telegram ตอนเริ่มระบบ ส่วนคำสั่งของ Slack ถูกจัดการในแอป Slack และจะไม่ถูกลบโดยอัตโนมัติ
- `commands.nativeSkills` (ค่าเริ่มต้น `"auto"`) ลงทะเบียนคำสั่งของ **Skills** แบบ native เมื่อรองรับ
  - Auto: เปิดสำหรับ Discord/Telegram; ปิดสำหรับ Slack (Slack ต้องสร้าง slash command แยกต่อหนึ่ง Skill)
  - ตั้ง `channels.discord.commands.nativeSkills`, `channels.telegram.commands.nativeSkills` หรือ `channels.slack.commands.nativeSkills` เพื่อ override แยกตามผู้ให้บริการ (bool หรือ `"auto"`)
- `commands.bash` (ค่าเริ่มต้น `false`) เปิดใช้ `! <cmd>` เพื่อรันคำสั่ง shell บนโฮสต์ (`/bash <cmd>` เป็น alias; ต้องใช้ allowlist ของ `tools.elevated`)
- `commands.bashForegroundMs` (ค่าเริ่มต้น `2000`) ควบคุมเวลาที่ bash จะรอก่อนสลับไปเป็นโหมด background (`0` จะส่งไป background ทันที)
- `commands.config` (ค่าเริ่มต้น `false`) เปิดใช้ `/config` (อ่าน/เขียน `openclaw.json`)
- `commands.mcp` (ค่าเริ่มต้น `false`) เปิดใช้ `/mcp` (อ่าน/เขียนคอนฟิก MCP ที่ OpenClaw จัดการไว้ภายใต้ `mcp.servers`)
- `commands.plugins` (ค่าเริ่มต้น `false`) เปิดใช้ `/plugins` (การค้นพบ/สถานะของ Plugin พร้อมตัวควบคุม install + enable/disable)
- `commands.debug` (ค่าเริ่มต้น `false`) เปิดใช้ `/debug` (override เฉพาะรันไทม์)
- `commands.restart` (ค่าเริ่มต้น `true`) เปิดใช้ `/restart` พร้อมการกระทำของ tool สำหรับ restart Gateway
- `commands.ownerAllowFrom` (ไม่บังคับ) ตั้ง allowlist แบบ explicit สำหรับเจ้าของ สำหรับพื้นผิวคำสั่ง/tool ที่ใช้ได้เฉพาะเจ้าของ ซึ่งแยกจาก `commands.allowFrom`
- ค่าแยกตามช่องทาง `channels.<channel>.commands.enforceOwnerForCommands` (ไม่บังคับ, ค่าเริ่มต้น `false`) ทำให้คำสั่งที่ใช้ได้เฉพาะเจ้าของต้องใช้ **ตัวตนของเจ้าของ** เพื่อรันบนพื้นผิวนั้น เมื่อเป็น `true` ผู้ส่งต้องตรงกับ candidate ของเจ้าของที่ resolve ได้ (เช่น รายการใน `commands.ownerAllowFrom` หรือเมทาดาทาเจ้าของแบบ native ของผู้ให้บริการ) หรือถือ scope ภายใน `operator.admin` บน message channel ภายใน รายการ wildcard ใน `allowFrom` ของช่องทาง หรือรายการ candidate ของเจ้าของที่ว่าง/resolve ไม่ได้ **ไม่**เพียงพอ — คำสั่งที่ใช้ได้เฉพาะเจ้าของจะ fail closed บนช่องทางนั้น ปล่อยให้ค่านี้ปิดอยู่หากคุณต้องการให้คำสั่งสำหรับเจ้าของถูกควบคุมเพียงด้วย `ownerAllowFrom` และ allowlist คำสั่งมาตรฐาน
- `commands.ownerDisplay` ควบคุมวิธีแสดง owner id ใน system prompt: `raw` หรือ `hash`
- `commands.ownerDisplaySecret` ตั้งค่า HMAC secret แบบไม่บังคับเมื่อ `commands.ownerDisplay="hash"`
- `commands.allowFrom` (ไม่บังคับ) ตั้ง allowlist แยกตามผู้ให้บริการสำหรับการอนุญาตคำสั่ง เมื่อมีการตั้งค่า มันจะเป็นแหล่งอนุญาตเดียวสำหรับ commands และ directives (`commands.useAccessGroups`
  รวมถึง allowlist/pairing ของช่องทางจะถูกเพิกเฉย) ใช้ `"*"` สำหรับค่าเริ่มต้นแบบ global; คีย์แยกตามผู้ให้บริการจะ override
- `commands.useAccessGroups` (ค่าเริ่มต้น `true`) บังคับใช้ allowlist/นโยบายสำหรับคำสั่งเมื่อไม่ได้ตั้ง `commands.allowFrom`

## รายการคำสั่ง

แหล่งข้อมูลจริงในปัจจุบัน:

- built-in ของ core มาจาก `src/auto-reply/commands-registry.shared.ts`
- คำสั่ง dock ที่สร้างขึ้น มาจาก `src/auto-reply/commands-registry.data.ts`
- คำสั่งของ Plugin มาจากการเรียก `registerCommand()` ของ Plugin
- ความพร้อมใช้งานจริงบน Gateway ของคุณยังขึ้นอยู่กับแฟล็กในคอนฟิก พื้นผิวของช่องทาง และ Plugin ที่ติดตั้ง/เปิดใช้งาน

### คำสั่ง built-in ของ core

คำสั่ง built-in ที่มีอยู่ในปัจจุบัน:

- `/new [model]` เริ่มเซสชันใหม่; `/reset` เป็น alias สำหรับ reset
- `/reset soft [message]` คง transcript ปัจจุบันไว้ ทิ้ง session id ของ CLI backend ที่นำกลับมาใช้ซ้ำ และรัน startup/system-prompt loading ใหม่ในที่เดิม
- `/compact [instructions]` ทำ Compaction กับบริบทของเซสชัน ดู [/concepts/compaction](/th/concepts/compaction)
- `/stop` abort การรันปัจจุบัน
- `/session idle <duration|off>` และ `/session max-age <duration|off>` จัดการการหมดอายุของ thread-binding
- `/think <level>` ตั้งค่าระดับ thinking ตัวเลือกมาจากโปรไฟล์ของผู้ให้บริการของโมเดลที่ active อยู่ ระดับที่พบบ่อยคือ `off`, `minimal`, `low`, `medium` และ `high` โดยจะมีระดับแบบกำหนดเอง เช่น `xhigh`, `adaptive`, `max` หรือค่าแบบไบนารี `on` เฉพาะในที่ที่รองรับ alias: `/thinking`, `/t`
- `/verbose on|off|full` เปิด/ปิดเอาต์พุตแบบ verbose alias: `/v`
- `/trace on|off` เปิด/ปิดเอาต์พุต trace ของ Plugin สำหรับเซสชันปัจจุบัน
- `/fast [status|on|off]` แสดงหรือตั้งค่า fast mode
- `/reasoning [on|off|stream]` เปิด/ปิดการมองเห็น reasoning alias: `/reason`
- `/elevated [on|off|ask|full]` เปิด/ปิด elevated mode alias: `/elev`
- `/exec host=<auto|sandbox|gateway|node> security=<deny|allowlist|full> ask=<off|on-miss|always> node=<id>` แสดงหรือตั้งค่า exec defaults
- `/model [name|#|status]` แสดงหรือตั้งค่าโมเดล
- `/models [provider] [page] [limit=<n>|size=<n>|all]` แสดงรายการผู้ให้บริการหรือโมเดลของผู้ให้บริการหนึ่ง
- `/queue <mode>` จัดการพฤติกรรมของคิว (`steer`, `interrupt`, `followup`, `collect`, `steer-backlog`) พร้อมตัวเลือก เช่น `debounce:2s cap:25 drop:summarize`
- `/help` แสดงสรุปความช่วยเหลือแบบสั้น
- `/commands` แสดงแค็ตตาล็อกคำสั่งที่สร้างขึ้น
- `/tools [compact|verbose]` แสดงว่าเอเจนต์ปัจจุบันใช้เครื่องมืออะไรได้บ้างในตอนนี้
- `/status` แสดงสถานะของรันไทม์ รวมถึงการใช้งาน/โควตาของผู้ให้บริการเมื่อมี
- `/tasks` แสดงงานเบื้องหลังที่ active/ล่าสุดสำหรับเซสชันปัจจุบัน
- `/context [list|detail|json]` อธิบายว่าบริบทถูกประกอบขึ้นอย่างไร
- `/export-session [path]` export เซสชันปัจจุบันเป็น HTML alias: `/export`
- `/whoami` แสดง sender id ของคุณ alias: `/id`
- `/skill <name> [input]` รัน Skill ตามชื่อ
- `/allowlist [list|add|remove] ...` จัดการรายการ allowlist ใช้ได้เฉพาะข้อความ
- `/approve <id> <decision>` จัดการ prompt การอนุมัติ exec
- `/btw <question>` ถามคำถามแทรกโดยไม่เปลี่ยนบริบทของเซสชันในอนาคต ดู [/tools/btw](/th/tools/btw)
- `/subagents list|kill|log|info|send|steer|spawn` จัดการการรันของ sub-agent สำหรับเซสชันปัจจุบัน
- `/acp spawn|cancel|steer|close|sessions|status|set-mode|set|cwd|permissions|timeout|model|reset-options|doctor|install|help` จัดการเซสชัน ACP และตัวเลือกของรันไทม์
- `/focus <target>` ผูกเธรด Discord หรือ topic/conversation ของ Telegram ปัจจุบันเข้ากับเป้าหมายของเซสชัน
- `/unfocus` ลบการผูกปัจจุบัน
- `/agents` แสดงเอเจนต์ที่ผูกกับเธรดสำหรับเซสชันปัจจุบัน
- `/kill <id|#|all>` abort sub-agent ที่กำลังรันอยู่หนึ่งตัวหรือทั้งหมด
- `/steer <id|#> <message>` ส่งคำสั่งชี้ทางให้ sub-agent ที่กำลังรันอยู่ alias: `/tell`
- `/config show|get|set|unset` อ่านหรือเขียน `openclaw.json` ใช้ได้เฉพาะเจ้าของ ต้องเปิด `commands.config: true`
- `/mcp show|get|set|unset` อ่านหรือเขียนคอนฟิก MCP server ที่ OpenClaw จัดการไว้ภายใต้ `mcp.servers` ใช้ได้เฉพาะเจ้าของ ต้องเปิด `commands.mcp: true`
- `/plugins list|inspect|show|get|install|enable|disable` ตรวจสอบหรือเปลี่ยนแปลงสถานะของ Plugin `/plugin` เป็น alias ใช้ได้เฉพาะเจ้าของสำหรับการเขียน ต้องเปิด `commands.plugins: true`
- `/debug show|set|unset|reset` จัดการ runtime-only config override ใช้ได้เฉพาะเจ้าของ ต้องเปิด `commands.debug: true`
- `/usage off|tokens|full|cost` ควบคุม footer การใช้งานต่อคำตอบ หรือพิมพ์สรุปค่าใช้จ่ายภายในเครื่อง
- `/tts on|off|status|provider|limit|summary|audio|help` ควบคุม TTS ดู [/tools/tts](/th/tools/tts)
- `/restart` รีสตาร์ต OpenClaw เมื่อเปิดใช้งาน ค่าเริ่มต้นคือเปิด; ตั้ง `commands.restart: false` เพื่อปิด
- `/activation mention|always` ตั้งค่าโหมดการเปิดใช้งานของกลุ่ม
- `/send on|off|inherit` ตั้งค่านโยบายการส่ง ใช้ได้เฉพาะเจ้าของ
- `/bash <command>` รันคำสั่ง shell บนโฮสต์ ใช้ได้เฉพาะข้อความ alias: `! <command>` ต้องใช้ `commands.bash: true` ร่วมกับ allowlist ของ `tools.elevated`
- `!poll [sessionId]` ตรวจสอบงาน bash แบบ background
- `!stop [sessionId]` หยุดงาน bash แบบ background

### คำสั่ง dock ที่สร้างขึ้น

คำสั่ง dock ถูกสร้างจาก channel plugin ที่รองรับ native-command ชุด bundled ปัจจุบันคือ:

- `/dock-discord` (alias: `/dock_discord`)
- `/dock-mattermost` (alias: `/dock_mattermost`)
- `/dock-slack` (alias: `/dock_slack`)
- `/dock-telegram` (alias: `/dock_telegram`)

### คำสั่งของ bundled plugin

bundled plugin สามารถเพิ่ม slash command ได้อีก คำสั่งแบบ bundled ปัจจุบันในรีโปนี้คือ:

- `/dreaming [on|off|status|help]` เปิด/ปิด memory Dreaming ดู [Dreaming](/th/concepts/dreaming)
- `/pair [qr|status|pending|approve|cleanup|notify]` จัดการโฟลว์การจับคู่/การตั้งค่าอุปกรณ์ ดู [Pairing](/th/channels/pairing)
- `/phone status|arm <camera|screen|writes|all> [duration]|disarm` เปิดสิทธิ์ชั่วคราวให้คำสั่ง node บนโทรศัพท์ที่มีความเสี่ยงสูง
- `/voice status|list [limit]|set <voiceId|name>` จัดการคอนฟิกเสียงของ Talk บน Discord ชื่อคำสั่ง native คือ `/talkvoice`
- `/card ...` ส่ง preset ของ LINE rich card ดู [LINE](/th/channels/line)
- `/codex status|models|threads|resume|compact|review|account|mcp|skills` ตรวจสอบและควบคุม bundled Codex app-server harness ดู [Codex Harness](/th/plugins/codex-harness)
- คำสั่งเฉพาะของ QQBot:
  - `/bot-ping`
  - `/bot-version`
  - `/bot-help`
  - `/bot-upgrade`
  - `/bot-logs`

### คำสั่ง Skill แบบไดนามิก

Skills ที่ผู้ใช้เรียกได้ก็ถูกเปิดเผยเป็น slash command ด้วย:

- `/skill <name> [input]` ใช้งานได้เสมอในฐานะ entrypoint แบบทั่วไป
- Skills อาจปรากฏเป็นคำสั่งโดยตรงอย่าง `/prose` เมื่อ Skill/Plugin ลงทะเบียนไว้
- การลงทะเบียนคำสั่ง Skill แบบ native ถูกควบคุมโดย `commands.nativeSkills` และ `channels.<provider>.commands.nativeSkills`

หมายเหตุ:

- คำสั่งรองรับ `:` แบบไม่บังคับระหว่างคำสั่งกับอาร์กิวเมนต์ (เช่น `/think: high`, `/send: on`, `/help:`)
- `/new <model>` รองรับ alias ของโมเดล, `provider/model` หรือชื่อผู้ให้บริการ (จับคู่แบบฟัซซี); หากไม่พบรายการที่ตรงกัน ข้อความนั้นจะถูกปฏิบัติเป็นเนื้อหาข้อความ
- หากต้องการดูรายละเอียดการใช้งานแยกตามผู้ให้บริการแบบครบถ้วน ให้ใช้ `openclaw status --usage`
- `/allowlist add|remove` ต้องใช้ `commands.config=true` และจะยึดตาม `configWrites` ของช่องทาง
- ในช่องทางแบบหลายบัญชี `/allowlist --account <id>` ที่เจาะจงคอนฟิก และ `/config set channels.<provider>.accounts.<id>...` ก็จะยึดตาม `configWrites` ของบัญชีเป้าหมายด้วย
- `/usage` ควบคุม footer การใช้งานต่อคำตอบ; `/usage cost` พิมพ์สรุปค่าใช้จ่ายภายในเครื่องจาก log เซสชันของ OpenClaw
- `/restart` เปิดใช้งานอยู่โดยค่าเริ่มต้น; ตั้ง `commands.restart: false` เพื่อปิดใช้งาน
- `/plugins install <spec>` รองรับ plugin spec แบบเดียวกับ `openclaw plugins install`: พาธ/ไฟล์ archive ในเครื่อง, npm package หรือ `clawhub:<pkg>`
- `/plugins enable|disable` จะอัปเดตคอนฟิกของ Plugin และอาจ prompt ให้รีสตาร์ต
- คำสั่ง native เฉพาะ Discord: `/vc join|leave|status` ใช้ควบคุม voice channel (ต้องมี `channels.discord.voice` และ native commands; ไม่มีในแบบข้อความ)
- คำสั่งสำหรับการผูกเธรดใน Discord (`/focus`, `/unfocus`, `/agents`, `/session idle`, `/session max-age`) ต้องเปิด effective thread bindings (`session.threadBindings.enabled` และ/หรือ `channels.discord.threadBindings.enabled`)
- เอกสารอ้างอิงคำสั่ง ACP และพฤติกรรมรันไทม์: [ACP Agents](/th/tools/acp-agents)
- `/verbose` มีไว้สำหรับการดีบักและการมองเห็นเพิ่มเติม; ในการใช้งานปกติควรปิดไว้
- `/trace` แคบกว่า `/verbose`: มันเปิดเผยเฉพาะบรรทัด trace/debug ที่เป็นของ Plugin และยังคงปิดข้อความ chatter ของ tool แบบ verbose ตามปกติไว้
- `/fast on|off` จะคงค่า override ไว้ในเซสชัน ใช้ตัวเลือก `inherit` ใน Sessions UI เพื่อล้างค่านี้และ fallback กลับไปใช้ค่าเริ่มต้นจากคอนฟิก
- `/fast` ขึ้นกับผู้ให้บริการ: OpenAI/OpenAI Codex จะ map มันไปยัง `service_tier=priority` บน native Responses endpoint ขณะที่คำขอ Anthropic สาธารณะแบบตรง รวมถึงทราฟฟิกที่ยืนยันตัวตนด้วย OAuth และส่งไปที่ `api.anthropic.com` จะ map ไปยัง `service_tier=auto` หรือ `standard_only` ดู [OpenAI](/th/providers/openai) และ [Anthropic](/th/providers/anthropic)
- สรุปความล้มเหลวของ tool จะยังแสดงเมื่อเกี่ยวข้อง แต่ข้อความรายละเอียดความล้มเหลวจะรวมมาด้วยก็ต่อเมื่อ `/verbose` เป็น `on` หรือ `full`
- `/reasoning`, `/verbose` และ `/trace` มีความเสี่ยงในบริบทของกลุ่ม: มันอาจเปิดเผย reasoning ภายใน เอาต์พุตของ tool หรือข้อมูลวินิจฉัยของ Plugin ที่คุณไม่ได้ตั้งใจให้เห็น ควรปล่อยให้ปิดไว้ โดยเฉพาะในแชตกลุ่ม
- `/model` จะบันทึกโมเดลเซสชันใหม่ทันที
- หากเอเจนต์กำลัง idle การรันครั้งถัดไปจะใช้โมเดลนั้นทันที
- หากมีการรันที่ active อยู่แล้ว OpenClaw จะทำเครื่องหมายว่าการสลับแบบ live กำลังรอดำเนินการ และจะรีสตาร์ตเข้าโมเดลใหม่เมื่อถึงจุด retry ที่สะอาดเท่านั้น
- หากกิจกรรมของ tool หรือการส่งเอาต์พุตคำตอบเริ่มไปแล้ว การสลับที่รออยู่สามารถค้างอยู่ในคิวได้จนกว่าจะมีโอกาส retry ในภายหลัง หรือถึง turn ถัดไปของผู้ใช้
- **เส้นทางเร็ว:** ข้อความที่มีแต่คำสั่งจากผู้ส่งที่อยู่ใน allowlist จะถูกจัดการทันที (ข้ามคิว + โมเดล)
- **การบังคับ mention ในกลุ่ม:** ข้อความที่มีแต่คำสั่งจากผู้ส่งที่อยู่ใน allowlist จะข้ามข้อกำหนดเรื่อง mention
- **inline shortcut (เฉพาะผู้ส่งที่อยู่ใน allowlist):** คำสั่งบางรายการยังทำงานได้เมื่อฝังอยู่ในข้อความปกติ และจะถูกตัดออกก่อนที่โมเดลจะเห็นข้อความที่เหลือ
  - ตัวอย่าง: `hey /status` จะทริกเกอร์การตอบกลับสถานะ และข้อความที่เหลือจะไหลเข้าสู่โฟลว์ปกติต่อไป
- ปัจจุบัน: `/help`, `/commands`, `/status`, `/whoami` (`/id`)
- ข้อความที่มีแต่คำสั่งจากผู้ที่ไม่ได้รับอนุญาตจะถูกเพิกเฉยอย่างเงียบ ๆ และ token แบบ inline `/...` จะถูกปฏิบัติเป็นข้อความธรรมดา
- **คำสั่ง Skill:** Skills แบบ `user-invocable` จะถูกเปิดเผยเป็น slash command ด้วย ชื่อจะถูก sanitize เป็น `a-z0-9_` (ยาวสูงสุด 32 ตัวอักษร); หากชนกันจะเติม suffix เป็นตัวเลข (เช่น `_2`)
  - `/skill <name> [input]` รัน Skill ตามชื่อ (มีประโยชน์เมื่อข้อจำกัดของ native command ทำให้สร้างคำสั่งแยกต่อ Skill ไม่ได้)
  - โดยค่าเริ่มต้น คำสั่ง Skill จะถูกส่งต่อไปยังโมเดลเป็นคำขอปกติ
  - Skills สามารถประกาศ `command-dispatch: tool` แบบไม่บังคับ เพื่อกำหนดเส้นทางคำสั่งไปยัง tool โดยตรงได้ (deterministic, ไม่ผ่านโมเดล)
  - ตัวอย่าง: `/prose` (Plugin OpenProse) — ดู [OpenProse](/th/prose)
- **อาร์กิวเมนต์ของ native command:** Discord ใช้ autocomplete สำหรับตัวเลือกแบบไดนามิก (และใช้เมนูปุ่มเมื่อคุณไม่ใส่อาร์กิวเมนต์ที่จำเป็น) Telegram และ Slack จะแสดงเมนูปุ่มเมื่อคำสั่งรองรับตัวเลือกและคุณละอาร์กิวเมนต์นั้นไว้

## `/tools`

`/tools` ตอบคำถามเกี่ยวกับ runtime ไม่ใช่คำถามเกี่ยวกับคอนฟิก: **เอเจนต์ตัวนี้ใช้สิ่งใดได้บ้างในตอนนี้
ภายใต้การสนทนานี้**

- ค่าเริ่มต้นของ `/tools` เป็นแบบ compact และปรับให้เหมาะกับการสแกนอย่างรวดเร็ว
- `/tools verbose` จะเพิ่มคำอธิบายสั้น ๆ
- พื้นผิว native-command ที่รองรับอาร์กิวเมนต์ จะเปิดให้ใช้การสลับโหมดแบบ `compact|verbose` เดียวกัน
- ผลลัพธ์เป็นขอบเขตระดับเซสชัน ดังนั้นการเปลี่ยนเอเจนต์ ช่องทาง เธรด การอนุญาตของผู้ส่ง หรือโมเดล อาจทำให้เอาต์พุตเปลี่ยนไป
- `/tools` รวมเฉพาะ tool ที่เข้าถึงได้จริงใน runtime รวมถึง tool ของ core, tool ของ Plugin ที่เชื่อมต่ออยู่ และ tool ที่เป็นเจ้าของโดยช่องทาง

สำหรับการแก้ไขโปรไฟล์และ override ให้ใช้แผง Tools ใน Control UI หรือพื้นผิวคอนฟิก/แค็ตตาล็อก แทนที่จะมอง `/tools` เป็นแค็ตตาล็อกแบบคงที่

## พื้นผิวการใช้งาน (สิ่งที่แสดงที่ไหน)

- **การใช้งาน/โควตาของผู้ให้บริการ** (ตัวอย่าง: “Claude เหลือ 80%”) จะแสดงใน `/status` สำหรับผู้ให้บริการของโมเดลปัจจุบัน เมื่อเปิดใช้การติดตามการใช้งาน OpenClaw จะ normalize หน้าต่างของผู้ให้บริการให้เป็น `% left`; สำหรับ MiniMax ฟิลด์เปอร์เซ็นต์ที่ให้มาแบบเหลืออยู่เท่านั้นจะถูกกลับค่า (invert) ก่อนแสดง และการตอบกลับแบบ `model_remains` จะให้ความสำคัญกับรายการ chat-model พร้อมป้าย plan ที่ผูกกับโมเดล
- **บรรทัด token/cache** ใน `/status` สามารถ fallback ไปใช้รายการ usage ล่าสุดใน transcript ได้ เมื่อสแนปชอตของ live session มีข้อมูลน้อย ค่า live ที่ไม่เป็นศูนย์และมีอยู่เดิมยังคงมีลำดับความสำคัญสูงกว่า และ transcript fallback ยังสามารถกู้คืนป้ายชื่อโมเดล runtime ที่ active รวมถึงยอดรวมที่เน้น prompt และมีขนาดใหญ่กว่าได้ เมื่อยอดรวมที่เก็บไว้ไม่มีหรือมีค่าน้อยกว่า
- **token/cost ต่อคำตอบ** ถูกควบคุมโดย `/usage off|tokens|full` (ต่อท้ายกับคำตอบปกติ)
- `/model status` เกี่ยวกับ **โมเดล/auth/endpoints** ไม่ใช่การใช้งาน

## การเลือกโมเดล (`/model`)

`/model` ถูก implement เป็น directive

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

- `/model` และ `/model list` จะแสดงตัวเลือกแบบย่อที่มีหมายเลขกำกับ (ตระกูลโมเดล + ผู้ให้บริการที่ใช้ได้)
- บน Discord, `/model` และ `/models` จะเปิดตัวเลือกแบบโต้ตอบได้ พร้อม dropdown ของผู้ให้บริการและโมเดล รวมถึงขั้นตอน Submit
- `/model <#>` จะเลือกจากตัวเลือกนั้น (และจะพยายามใช้ผู้ให้บริการปัจจุบันก่อนเมื่อเป็นไปได้)
- `/model status` จะแสดงมุมมองแบบละเอียด รวมถึง endpoint ของผู้ให้บริการที่ตั้งค่าไว้ (`baseUrl`) และโหมด API (`api`) เมื่อมี

## override สำหรับการดีบัก

`/debug` ให้คุณตั้งค่า override ของคอนฟิกแบบ **runtime-only** (อยู่ในหน่วยความจำ ไม่เขียนลงดิสก์) ใช้ได้เฉพาะเจ้าของ ปิดไว้โดยค่าเริ่มต้น; เปิดด้วย `commands.debug: true`

ตัวอย่าง:

```
/debug show
/debug set messages.responsePrefix="[openclaw]"
/debug set channels.whatsapp.allowFrom=["+1555","+4477"]
/debug unset messages.responsePrefix
/debug reset
```

หมายเหตุ:

- override จะมีผลทันทีต่อการอ่านคอนฟิกใหม่ แต่จะ **ไม่**เขียนลง `openclaw.json`
- ใช้ `/debug reset` เพื่อล้าง override ทั้งหมดและกลับไปใช้คอนฟิกบนดิสก์

## เอาต์พุต trace ของ Plugin

`/trace` ช่วยให้คุณเปิด/ปิด **บรรทัด trace/debug ของ Plugin ในขอบเขตระดับเซสชัน** โดยไม่ต้องเปิด verbose mode เต็มรูปแบบ

ตัวอย่าง:

```text
/trace
/trace on
/trace off
```

หมายเหตุ:

- `/trace` โดยไม่ใส่อาร์กิวเมนต์ จะแสดงสถานะ trace ปัจจุบันของเซสชัน
- `/trace on` จะเปิดบรรทัด trace ของ Plugin สำหรับเซสชันปัจจุบัน
- `/trace off` จะปิดมันอีกครั้ง
- บรรทัด trace ของ Plugin อาจปรากฏใน `/status` และเป็นข้อความวินิจฉัยติดตามผลหลังจากคำตอบปกติของ assistant
- `/trace` ไม่ได้มาแทน `/debug`; `/debug` ยังคงใช้จัดการ runtime-only config override
- `/trace` ไม่ได้มาแทน `/verbose`; เอาต์พุต tool/status แบบ verbose ตามปกติยังเป็นหน้าที่ของ `/verbose`

## การอัปเดตคอนฟิก

`/config` จะเขียนลงคอนฟิกบนดิสก์ของคุณ (`openclaw.json`) ใช้ได้เฉพาะเจ้าของ ปิดไว้โดยค่าเริ่มต้น; เปิดด้วย `commands.config: true`

ตัวอย่าง:

```
/config show
/config show messages.responsePrefix
/config get messages.responsePrefix
/config set messages.responsePrefix="[openclaw]"
/config unset messages.responsePrefix
```

หมายเหตุ:

- คอนฟิกจะถูกตรวจสอบความถูกต้องก่อนเขียน; การเปลี่ยนที่ไม่ถูกต้องจะถูกปฏิเสธ
- การอัปเดตด้วย `/config` จะคงอยู่ข้ามการรีสตาร์ต

## การอัปเดต MCP

`/mcp` จะเขียนนิยาม MCP server ที่ OpenClaw จัดการไว้ภายใต้ `mcp.servers` ใช้ได้เฉพาะเจ้าของ ปิดไว้โดยค่าเริ่มต้น; เปิดด้วย `commands.mcp: true`

ตัวอย่าง:

```text
/mcp show
/mcp show context7
/mcp set context7={"command":"uvx","args":["context7-mcp"]}
/mcp unset context7
```

หมายเหตุ:

- `/mcp` จะเก็บคอนฟิกไว้ในคอนฟิกของ OpenClaw ไม่ใช่การตั้งค่าโปรเจกต์ที่ Pi เป็นเจ้าของ
- runtime adapter จะเป็นตัวตัดสินว่า transport ใดสามารถรันได้จริง

## การอัปเดต Plugin

`/plugins` ให้ผู้ปฏิบัติงานตรวจสอบ Plugin ที่ค้นพบแล้ว และสลับสถานะการเปิดใช้งานในคอนฟิก โฟลว์แบบอ่านอย่างเดียวสามารถใช้ `/plugin` เป็น alias ได้ ปิดไว้โดยค่าเริ่มต้น; เปิดด้วย `commands.plugins: true`

ตัวอย่าง:

```text
/plugins
/plugins list
/plugin show context7
/plugins enable context7
/plugins disable context7
```

หมายเหตุ:

- `/plugins list` และ `/plugins show` ใช้การค้นหา Plugin จริงกับ workspace ปัจจุบัน รวมถึงคอนฟิกบนดิสก์
- `/plugins enable|disable` จะอัปเดตเฉพาะคอนฟิกของ Plugin; มันไม่ได้ติดตั้งหรือลบการติดตั้ง Plugin
- หลังจากเปลี่ยนการ enable/disable แล้ว ให้รีสตาร์ต gateway เพื่อให้มีผล

## หมายเหตุเรื่องพื้นผิว

- **text commands** ทำงานในเซสชันแชตปกติ (DM แชร์ `main`, กลุ่มมีเซสชันของตัวเอง)
- **native commands** ใช้เซสชันแบบแยก:
  - Discord: `agent:<agentId>:discord:slash:<userId>`
  - Slack: `agent:<agentId>:slack:slash:<userId>` (prefix ปรับได้ผ่าน `channels.slack.slashCommand.sessionPrefix`)
  - Telegram: `telegram:slash:<userId>` (กำหนดเป้าหมายไปยังเซสชันแชตผ่าน `CommandTargetSessionKey`)
- **`/stop`** จะกำหนดเป้าหมายไปยังเซสชันแชตที่ active เพื่อให้ abort การรันปัจจุบันได้
- **Slack:** `channels.slack.slashCommand` ยังรองรับอยู่สำหรับคำสั่งเดี่ยวสไตล์ `/openclaw` หากคุณเปิด `commands.native` คุณต้องสร้าง Slack slash command แยกหนึ่งรายการต่อหนึ่ง built-in command (ใช้ชื่อเดียวกับ `/help`) เมนูอาร์กิวเมนต์ของคำสั่งสำหรับ Slack จะถูกส่งเป็นปุ่ม Block Kit แบบ ephemeral
  - ข้อยกเว้นของ Slack native: ให้ลงทะเบียน `/agentstatus` (ไม่ใช่ `/status`) เพราะ Slack สงวน `/status` ไว้ ส่วน text `/status` ยังใช้ได้ในข้อความ Slack

## คำถามแทรกแบบ BTW

`/btw` คือ **คำถามแทรก** แบบรวดเร็วเกี่ยวกับเซสชันปัจจุบัน

ต่างจากแชตปกติ:

- มันใช้เซสชันปัจจุบันเป็นบริบทพื้นหลัง
- มันรันเป็นการเรียกแบบ one-shot **ที่ไม่มี tool**
- มันไม่เปลี่ยนบริบทของเซสชันในอนาคต
- มันไม่ถูกเขียนลงในประวัติ transcript
- มันถูกส่งเป็นผลลัพธ์แทรกแบบสด แทนที่จะเป็นข้อความปกติของ assistant

สิ่งนี้ทำให้ `/btw` มีประโยชน์เมื่อคุณต้องการคำชี้แจงชั่วคราวในขณะที่งานหลัก
ยังดำเนินต่อไป

ตัวอย่าง:

```text
/btw what are we doing right now?
```

ดู [BTW Side Questions](/th/tools/btw) สำหรับรายละเอียดพฤติกรรมแบบเต็มและ
รายละเอียด UX ของไคลเอนต์
