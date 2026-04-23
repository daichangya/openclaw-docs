---
read_when:
    - การใช้หรือการกำหนดค่าคำสั่งแชต
    - การดีบักการกำหนดเส้นทางคำสั่งหรือสิทธิ์
summary: 'คำสั่งแบบสแลช: ข้อความเทียบกับแบบเนทีฟ, การกำหนดค่า และคำสั่งที่รองรับ'
title: คำสั่งแบบสแลช
x-i18n:
    generated_at: "2026-04-23T13:58:16Z"
    model: gpt-5.4
    provider: openai
    source_hash: 13290dcdf649ae66603a92a0aca68460bb63ff476179cc2dded796aaa841d66c
    source_path: tools/slash-commands.md
    workflow: 15
---

# คำสั่งแบบสแลช

คำสั่งจะถูกจัดการโดย Gateway คำสั่งส่วนใหญ่ต้องส่งเป็นข้อความแบบ **เดี่ยว ๆ** ที่ขึ้นต้นด้วย `/`
คำสั่งแชต bash แบบโฮสต์เท่านั้นใช้ `! <cmd>` (โดยมี `/bash <cmd>` เป็นนามแฝง)

มีสองระบบที่เกี่ยวข้องกัน:

- **Commands**: ข้อความ `/...` แบบเดี่ยว ๆ
- **Directives**: `/think`, `/fast`, `/verbose`, `/trace`, `/reasoning`, `/elevated`, `/exec`, `/model`, `/queue`
  - Directives จะถูกตัดออกจากข้อความก่อนที่โมเดลจะเห็น
  - ในข้อความแชตปกติ (ไม่ใช่ข้อความที่มีเฉพาะ directive) จะถือเป็น “คำใบ้ในบรรทัด” และจะ **ไม่** คงค่าการตั้งค่าของเซสชัน
  - ในข้อความที่มีเฉพาะ directive (ข้อความมีแต่ directives เท่านั้น) ค่าจะคงอยู่ในเซสชันและตอบกลับด้วยการยืนยัน
  - Directives จะถูกนำไปใช้เฉพาะกับ **ผู้ส่งที่ได้รับอนุญาต** เท่านั้น หากตั้งค่า `commands.allowFrom` ไว้ จะใช้เป็นรายการอนุญาตเพียงรายการเดียว มิฉะนั้นการอนุญาตจะมาจากรายการอนุญาต/การจับคู่ของช่องทางร่วมกับ `commands.useAccessGroups`
    ผู้ส่งที่ไม่ได้รับอนุญาตจะเห็น directives ถูกปฏิบัติเสมือนเป็นข้อความธรรมดา

ยังมี **ทางลัดแบบอินไลน์** บางรายการด้วย (เฉพาะผู้ส่งที่อยู่ในรายการอนุญาต/ได้รับอนุญาต): `/help`, `/commands`, `/status`, `/whoami` (`/id`)
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
  - บนพื้นผิวที่ไม่มีคำสั่งแบบเนทีฟ (WhatsApp/WebChat/Signal/iMessage/Google Chat/Microsoft Teams) คำสั่งข้อความจะยังคงทำงานได้แม้ว่าคุณจะตั้งค่านี้เป็น `false`
- `commands.native` (ค่าเริ่มต้น `"auto"`) ลงทะเบียนคำสั่งแบบเนทีฟ
  - อัตโนมัติ: เปิดสำหรับ Discord/Telegram; ปิดสำหรับ Slack (จนกว่าคุณจะเพิ่ม slash commands); ถูกละเว้นสำหรับผู้ให้บริการที่ไม่รองรับแบบเนทีฟ
  - ตั้งค่า `channels.discord.commands.native`, `channels.telegram.commands.native` หรือ `channels.slack.commands.native` เพื่อเขียนทับเป็นรายผู้ให้บริการ (bool หรือ `"auto"`)
  - `false` จะล้างคำสั่งที่ลงทะเบียนไว้ก่อนหน้านี้บน Discord/Telegram ตอนเริ่มต้น Slack commands ถูกจัดการในแอป Slack และจะไม่ถูกลบออกโดยอัตโนมัติ
- `commands.nativeSkills` (ค่าเริ่มต้น `"auto"`) ลงทะเบียนคำสั่ง **skill** แบบเนทีฟเมื่อรองรับ
  - อัตโนมัติ: เปิดสำหรับ Discord/Telegram; ปิดสำหรับ Slack (Slack ต้องสร้าง slash command แยกสำหรับแต่ละ skill)
  - ตั้งค่า `channels.discord.commands.nativeSkills`, `channels.telegram.commands.nativeSkills` หรือ `channels.slack.commands.nativeSkills` เพื่อเขียนทับเป็นรายผู้ให้บริการ (bool หรือ `"auto"`)
- `commands.bash` (ค่าเริ่มต้น `false`) เปิดใช้ `! <cmd>` เพื่อรันคำสั่งเชลล์บนโฮสต์ (`/bash <cmd>` เป็นนามแฝง; ต้องใช้รายการอนุญาต `tools.elevated`)
- `commands.bashForegroundMs` (ค่าเริ่มต้น `2000`) ควบคุมว่า bash จะรอนานเท่าใดก่อนสลับไปโหมดเบื้องหลัง (`0` จะส่งไปเบื้องหลังทันที)
- `commands.config` (ค่าเริ่มต้น `false`) เปิดใช้ `/config` (อ่าน/เขียน `openclaw.json`)
- `commands.mcp` (ค่าเริ่มต้น `false`) เปิดใช้ `/mcp` (อ่าน/เขียนการกำหนดค่า MCP ที่ OpenClaw จัดการภายใต้ `mcp.servers`)
- `commands.plugins` (ค่าเริ่มต้น `false`) เปิดใช้ `/plugins` (การค้นหา/สถานะของ plugin รวมถึงการติดตั้ง + ตัวควบคุมเปิด/ปิดใช้งาน)
- `commands.debug` (ค่าเริ่มต้น `false`) เปิดใช้ `/debug` (การเขียนทับแบบ runtime เท่านั้น)
- `commands.restart` (ค่าเริ่มต้น `true`) เปิดใช้ `/restart` รวมถึงการกระทำของเครื่องมือรีสตาร์ต gateway
- `commands.ownerAllowFrom` (ไม่บังคับ) ตั้งค่ารายการอนุญาตเจ้าของแบบชัดเจนสำหรับพื้นผิวคำสั่ง/เครื่องมือที่จำกัดเฉพาะเจ้าของ ซึ่งแยกจาก `commands.allowFrom`
- `channels.<channel>.commands.enforceOwnerForCommands` ต่อช่องทาง (ไม่บังคับ, ค่าเริ่มต้น `false`) ทำให้คำสั่งที่จำกัดเฉพาะเจ้าของต้องใช้ **ตัวตนของเจ้าของ** จึงจะรันได้บนพื้นผิวนั้น เมื่อเป็น `true` ผู้ส่งต้องตรงกับผู้สมัครเจ้าของที่แก้ค่าแล้ว (เช่น รายการใน `commands.ownerAllowFrom` หรือเมทาดาทาเจ้าของแบบเนทีฟของผู้ให้บริการ) หรือมี scope ภายใน `operator.admin` บนช่องข้อความภายใน รายการ wildcard ใน `allowFrom` ของช่องทาง หรือรายการผู้สมัครเจ้าของที่ว่าง/แก้ค่าไม่ได้ จะ **ไม่** เพียงพอ — คำสั่งเฉพาะเจ้าของจะปิดการทำงานโดยปริยายบนช่องทางนั้น ปล่อยค่านี้เป็นปิดไว้ หากคุณต้องการให้คำสั่งเฉพาะเจ้าของถูกจำกัดเพียงด้วย `ownerAllowFrom` และรายการอนุญาตคำสั่งมาตรฐาน
- `commands.ownerDisplay` ควบคุมว่ารหัสเจ้าของจะแสดงอย่างไรใน system prompt: `raw` หรือ `hash`
- `commands.ownerDisplaySecret` ตั้งค่าซีเคร็ต HMAC ที่ใช้เมื่อ `commands.ownerDisplay="hash"` ได้ตามต้องการ
- `commands.allowFrom` (ไม่บังคับ) ตั้งค่ารายการอนุญาตต่อผู้ให้บริการสำหรับการอนุญาตคำสั่ง เมื่อกำหนดค่าแล้ว จะเป็นแหล่งการอนุญาตเพียงแหล่งเดียวสำหรับคำสั่งและ directives (รายการอนุญาต/การจับคู่ของช่องทางและ `commands.useAccessGroups` จะถูกละเว้น) ใช้ `"*"` สำหรับค่าเริ่มต้นแบบโกลบอล; คีย์เฉพาะผู้ให้บริการจะเขียนทับค่านี้
- `commands.useAccessGroups` (ค่าเริ่มต้น `true`) บังคับใช้รายการอนุญาต/นโยบายกับคำสั่งเมื่อไม่ได้ตั้งค่า `commands.allowFrom`

## รายการคำสั่ง

แหล่งข้อมูลอ้างอิงปัจจุบัน:

- คำสั่ง built-in ของแกนหลักมาจาก `src/auto-reply/commands-registry.shared.ts`
- คำสั่ง dock ที่สร้างขึ้นมาจาก `src/auto-reply/commands-registry.data.ts`
- คำสั่ง plugin มาจากการเรียก `registerCommand()` ของ plugin
- การใช้งานได้จริงบน gateway ของคุณยังขึ้นอยู่กับแฟล็กการกำหนดค่า พื้นผิวของช่องทาง และ plugin ที่ติดตั้ง/เปิดใช้งานอยู่

### คำสั่ง built-in ของแกนหลัก

คำสั่ง built-in ที่พร้อมใช้งานในปัจจุบัน:

- `/new [model]` เริ่มเซสชันใหม่; `/reset` เป็นนามแฝงสำหรับรีเซ็ต
- `/reset soft [message]` เก็บ transcript ปัจจุบันไว้ ลบรหัสเซสชันของแบ็กเอนด์ CLI ที่นำกลับมาใช้ซ้ำ และรันการโหลด startup/system prompt ใหม่ในที่เดิม
- `/compact [instructions]` ทำ Compaction บริบทของเซสชัน ดู [/concepts/compaction](/th/concepts/compaction)
- `/stop` ยกเลิกการรันปัจจุบัน
- `/session idle <duration|off>` และ `/session max-age <duration|off>` จัดการการหมดอายุของการผูกกับเธรด
- `/think <level>` ตั้งค่าระดับการคิด ตัวเลือกมาจากโปรไฟล์ผู้ให้บริการของโมเดลที่ใช้งานอยู่ ระดับที่พบบ่อยคือ `off`, `minimal`, `low`, `medium` และ `high` พร้อมระดับแบบกำหนดเอง เช่น `xhigh`, `adaptive`, `max` หรือแบบไบนารี `on` เฉพาะในกรณีที่รองรับ นามแฝง: `/thinking`, `/t`
- `/verbose on|off|full` สลับการแสดงผลแบบ verbose นามแฝง: `/v`
- `/trace on|off` สลับการแสดงผล trace ของ plugin สำหรับเซสชันปัจจุบัน
- `/fast [status|on|off]` แสดงหรือตั้งค่า fast mode
- `/reasoning [on|off|stream]` สลับการมองเห็น reasoning นามแฝง: `/reason`
- `/elevated [on|off|ask|full]` สลับ elevated mode นามแฝง: `/elev`
- `/exec host=<auto|sandbox|gateway|node> security=<deny|allowlist|full> ask=<off|on-miss|always> node=<id>` แสดงหรือตั้งค่าเริ่มต้นของ exec
- `/model [name|#|status]` แสดงหรือตั้งค่าโมเดล
- `/models [provider] [page] [limit=<n>|size=<n>|all]` แสดงรายการผู้ให้บริการหรือโมเดลของผู้ให้บริการ
- `/queue <mode>` จัดการพฤติกรรมคิว (`steer`, `interrupt`, `followup`, `collect`, `steer-backlog`) พร้อมตัวเลือกอย่าง `debounce:2s cap:25 drop:summarize`
- `/help` แสดงสรุปวิธีใช้แบบสั้น
- `/commands` แสดงแค็ตตาล็อกคำสั่งที่สร้างขึ้น
- `/tools [compact|verbose]` แสดงสิ่งที่เอเจนต์ปัจจุบันสามารถใช้ได้ในตอนนี้
- `/status` แสดงสถานะ runtime รวมถึงป้าย `Runtime`/`Runner` และการใช้งาน/โควตาของผู้ให้บริการเมื่อมี
- `/tasks` แสดงรายการงานเบื้องหลังที่กำลังทำงาน/ล่าสุดสำหรับเซสชันปัจจุบัน
- `/context [list|detail|json]` อธิบายวิธีประกอบบริบท
- `/export-session [path]` ส่งออกเซสชันปัจจุบันเป็น HTML นามแฝง: `/export`
- `/export-trajectory [path]` ส่งออก [trajectory bundle](/th/tools/trajectory) แบบ JSONL สำหรับเซสชันปัจจุบัน นามแฝง: `/trajectory`
- `/whoami` แสดงรหัสผู้ส่งของคุณ นามแฝง: `/id`
- `/skill <name> [input]` เรียกใช้ skill ตามชื่อ
- `/allowlist [list|add|remove] ...` จัดการรายการใน allowlist ใช้ได้เฉพาะแบบข้อความเท่านั้น
- `/approve <id> <decision>` จัดการคำขออนุมัติ exec ให้เสร็จสิ้น
- `/btw <question>` ถามคำถามแทรกโดยไม่เปลี่ยนบริบทของเซสชันในอนาคต ดู [/tools/btw](/th/tools/btw)
- `/subagents list|kill|log|info|send|steer|spawn` จัดการการรัน sub-agent สำหรับเซสชันปัจจุบัน
- `/acp spawn|cancel|steer|close|sessions|status|set-mode|set|cwd|permissions|timeout|model|reset-options|doctor|install|help` จัดการเซสชัน ACP และตัวเลือกรันไทม์
- `/focus <target>` ผูกเธรด Discord หรือหัวข้อ/การสนทนา Telegram ปัจจุบันเข้ากับเป้าหมายของเซสชัน
- `/unfocus` เอาการผูกปัจจุบันออก
- `/agents` แสดงรายการเอเจนต์ที่ผูกกับเธรดสำหรับเซสชันปัจจุบัน
- `/kill <id|#|all>` ยกเลิก sub-agent ที่กำลังรันอยู่หนึ่งตัวหรือทั้งหมด
- `/steer <id|#> <message>` ส่งคำสั่งกำกับไปยัง sub-agent ที่กำลังรันอยู่ นามแฝง: `/tell`
- `/config show|get|set|unset` อ่านหรือเขียน `openclaw.json` เฉพาะเจ้าของ ต้องมี `commands.config: true`
- `/mcp show|get|set|unset` อ่านหรือเขียนการกำหนดค่าเซิร์ฟเวอร์ MCP ที่ OpenClaw จัดการภายใต้ `mcp.servers` เฉพาะเจ้าของ ต้องมี `commands.mcp: true`
- `/plugins list|inspect|show|get|install|enable|disable` ตรวจสอบหรือเปลี่ยนสถานะ plugin `/plugin` เป็นนามแฝง การเขียนจำกัดเฉพาะเจ้าของ ต้องมี `commands.plugins: true`
- `/debug show|set|unset|reset` จัดการการเขียนทับการกำหนดค่าแบบ runtime เท่านั้น เฉพาะเจ้าของ ต้องมี `commands.debug: true`
- `/usage off|tokens|full|cost` ควบคุมส่วนท้ายการใช้งานต่อการตอบกลับ หรือพิมพ์สรุปค่าใช้จ่ายในเครื่อง
- `/tts on|off|status|provider|limit|summary|audio|help` ควบคุม TTS ดู [/tools/tts](/th/tools/tts)
- `/restart` รีสตาร์ต OpenClaw เมื่อเปิดใช้งาน ค่าเริ่มต้น: เปิดใช้งาน; ตั้ง `commands.restart: false` เพื่อปิด
- `/activation mention|always` ตั้งค่าโหมดการเปิดใช้งานกลุ่ม
- `/send on|off|inherit` ตั้งค่านโยบายการส่ง เฉพาะเจ้าของ
- `/bash <command>` รันคำสั่งเชลล์บนโฮสต์ ใช้ได้เฉพาะแบบข้อความเท่านั้น นามแฝง: `! <command>` ต้องมี `commands.bash: true` พร้อม allowlist ของ `tools.elevated`
- `!poll [sessionId]` ตรวจสอบงาน bash เบื้องหลัง
- `!stop [sessionId]` หยุดงาน bash เบื้องหลัง

### คำสั่ง dock ที่สร้างขึ้น

คำสั่ง dock ถูกสร้างจาก channel plugins ที่รองรับคำสั่งแบบเนทีฟ ชุดที่มากับระบบในปัจจุบันคือ:

- `/dock-discord` (นามแฝง: `/dock_discord`)
- `/dock-mattermost` (นามแฝง: `/dock_mattermost`)
- `/dock-slack` (นามแฝง: `/dock_slack`)
- `/dock-telegram` (นามแฝง: `/dock_telegram`)

### คำสั่ง plugin ที่มากับระบบ

Bundled plugins สามารถเพิ่ม slash commands ได้อีก คำสั่งที่มากับระบบในรีโปนี้ในปัจจุบันคือ:

- `/dreaming [on|off|status|help]` สลับ Dreaming ของหน่วยความจำ ดู [Dreaming](/th/concepts/dreaming)
- `/pair [qr|status|pending|approve|cleanup|notify]` จัดการโฟลว์การจับคู่อุปกรณ์/การตั้งค่า ดู [Pairing](/th/channels/pairing)
- `/phone status|arm <camera|screen|writes|all> [duration]|disarm` เปิดใช้งานคำสั่ง node โทรศัพท์ที่มีความเสี่ยงสูงชั่วคราว
- `/voice status|list [limit]|set <voiceId|name>` จัดการการกำหนดค่าเสียง Talk บน Discord ชื่อคำสั่งแบบเนทีฟคือ `/talkvoice`
- `/card ...` ส่งพรีเซ็ต rich card ของ LINE ดู [LINE](/th/channels/line)
- `/codex status|models|threads|resume|compact|review|account|mcp|skills` ตรวจสอบและควบคุมชุด harness app-server ของ Codex ที่มากับระบบ ดู [Codex Harness](/th/plugins/codex-harness)
- คำสั่งเฉพาะ QQBot:
  - `/bot-ping`
  - `/bot-version`
  - `/bot-help`
  - `/bot-upgrade`
  - `/bot-logs`

### คำสั่ง skill แบบไดนามิก

Skills ที่ผู้ใช้เรียกใช้ได้จะถูกเปิดเผยเป็น slash commands ด้วย:

- `/skill <name> [input]` ใช้งานได้เสมอในฐานะจุดเข้าใช้งานแบบทั่วไป
- skills อาจปรากฏเป็นคำสั่งโดยตรง เช่น `/prose` เมื่อ skill/plugin ลงทะเบียนไว้
- การลงทะเบียนคำสั่ง skill แบบเนทีฟควบคุมโดย `commands.nativeSkills` และ `channels.<provider>.commands.nativeSkills`

หมายเหตุ:

- คำสั่งรองรับ `:` แบบไม่บังคับระหว่างคำสั่งกับอาร์กิวเมนต์ (เช่น `/think: high`, `/send: on`, `/help:`)
- `/new <model>` รับนามแฝงของโมเดล, `provider/model` หรือชื่อผู้ให้บริการ (จับคู่แบบฟัซซี); หากไม่พบรายการที่ตรงกัน ข้อความนั้นจะถูกถือเป็นเนื้อหาข้อความ
- สำหรับรายละเอียดการใช้งานของผู้ให้บริการแบบเต็ม ให้ใช้ `openclaw status --usage`
- `/allowlist add|remove` ต้องใช้ `commands.config=true` และเป็นไปตาม `configWrites` ของช่องทาง
- ในช่องทางแบบหลายบัญชี `/allowlist --account <id>` ที่กำหนดเป้าหมายการตั้งค่า และ `/config set channels.<provider>.accounts.<id>...` จะเป็นไปตาม `configWrites` ของบัญชีเป้าหมายด้วย
- `/usage` ควบคุมส่วนท้ายการใช้งานต่อการตอบกลับ; `/usage cost` จะพิมพ์สรุปค่าใช้จ่ายในเครื่องจากบันทึกเซสชัน OpenClaw
- `/restart` เปิดใช้งานโดยค่าเริ่มต้น; ตั้ง `commands.restart: false` เพื่อปิดใช้งาน
- `/plugins install <spec>` รับสเปก plugin แบบเดียวกับ `openclaw plugins install`: พาธ/ไฟล์เก็บถาวรในเครื่อง, แพ็กเกจ npm หรือ `clawhub:<pkg>`
- `/plugins enable|disable` อัปเดตการกำหนดค่า plugin และอาจแจ้งให้รีสตาร์ต
- คำสั่งแบบเนทีฟเฉพาะ Discord: `/vc join|leave|status` ใช้ควบคุมช่องเสียง (ต้องใช้ `channels.discord.voice` และคำสั่งแบบเนทีฟ; ไม่มีให้ใช้แบบข้อความ)
- คำสั่งผูกกับเธรดของ Discord (`/focus`, `/unfocus`, `/agents`, `/session idle`, `/session max-age`) ต้องเปิดใช้การผูกกับเธรดอย่างมีผลอยู่ (`session.threadBindings.enabled` และ/หรือ `channels.discord.threadBindings.enabled`)
- เอกสารอ้างอิงคำสั่ง ACP และพฤติกรรมรันไทม์: [ACP Agents](/th/tools/acp-agents)
- `/verbose` มีไว้สำหรับการดีบักและการมองเห็นเพิ่มเติม; ในการใช้งานปกติควรปิดไว้ **off**
- `/trace` มีขอบเขตแคบกว่า `/verbose`: จะแสดงเฉพาะบรรทัด trace/debug ที่ plugin เป็นเจ้าของ และยังคงปิดการแสดงผล chatter ของเครื่องมือแบบ verbose ปกติไว้
- `/fast on|off` จะคงค่าการเขียนทับระดับเซสชัน ใช้ตัวเลือก `inherit` ใน UI Sessions เพื่อล้างค่านี้และกลับไปใช้ค่าเริ่มต้นจากการกำหนดค่า
- `/fast` ขึ้นอยู่กับผู้ให้บริการ: OpenAI/OpenAI Codex จะจับคู่เป็น `service_tier=priority` บน native Responses endpoints ขณะที่คำขอ Anthropic สาธารณะโดยตรง รวมถึงทราฟฟิกที่ยืนยันตัวตนด้วย OAuth และส่งไปยัง `api.anthropic.com` จะจับคู่เป็น `service_tier=auto` หรือ `standard_only` ดู [OpenAI](/th/providers/openai) และ [Anthropic](/th/providers/anthropic)
- สรุปความล้มเหลวของเครื่องมือจะยังคงแสดงเมื่อเกี่ยวข้อง แต่ข้อความความล้มเหลวโดยละเอียดจะรวมมาให้เฉพาะเมื่อ `/verbose` เป็น `on` หรือ `full`
- `/reasoning`, `/verbose` และ `/trace` มีความเสี่ยงในบริบทกลุ่ม: อาจเปิดเผย reasoning ภายใน เอาต์พุตของเครื่องมือ หรือข้อมูลวินิจฉัยของ plugin ที่คุณไม่ได้ตั้งใจให้เห็น ควรปล่อยให้ปิดไว้ โดยเฉพาะในแชตกลุ่ม
- `/model` จะคงค่าโมเดลเซสชันใหม่ทันที
- หากเอเจนต์ว่างอยู่ การรันถัดไปจะใช้ค่านั้นทันที
- หากมีการรันที่กำลังทำงานอยู่แล้ว OpenClaw จะทำเครื่องหมายการสลับสดว่าอยู่ระหว่างรอดำเนินการ และจะรีสตาร์ตเข้าโมเดลใหม่เมื่อถึงจุดลองใหม่ที่สะอาดเท่านั้น
- หากกิจกรรมของเครื่องมือหรือเอาต์พุตการตอบกลับเริ่มต้นไปแล้ว การสลับที่รอดำเนินการอาจค้างอยู่ในคิวจนกว่าจะมีโอกาสลองใหม่ในภายหลังหรือจนถึงตาของผู้ใช้ถัดไป
- **เส้นทางเร็ว:** ข้อความที่มีแต่คำสั่งจากผู้ส่งที่อยู่ใน allowlist จะถูกจัดการทันที (ข้ามคิว + โมเดล)
- **การบังคับด้วยการเมนชันในกลุ่ม:** ข้อความที่มีแต่คำสั่งจากผู้ส่งที่อยู่ใน allowlist จะข้ามข้อกำหนดเรื่องการเมนชัน
- **ทางลัดแบบอินไลน์ (เฉพาะผู้ส่งที่อยู่ใน allowlist):** คำสั่งบางรายการใช้ได้ด้วยเมื่อฝังอยู่ในข้อความปกติ และจะถูกตัดออกก่อนที่โมเดลจะเห็นข้อความที่เหลือ
  - ตัวอย่าง: `hey /status` จะเรียกการตอบกลับสถานะ และข้อความที่เหลือจะดำเนินต่อไปตามโฟลว์ปกติ
- ปัจจุบัน: `/help`, `/commands`, `/status`, `/whoami` (`/id`)
- ข้อความที่มีแต่คำสั่งจากผู้ที่ไม่ได้รับอนุญาตจะถูกเพิกเฉยแบบเงียบ ๆ และโทเค็น `/...` แบบอินไลน์จะถูกปฏิบัติเสมือนเป็นข้อความธรรมดา
- **คำสั่ง Skills:** Skills แบบ `user-invocable` จะถูกเปิดเผยเป็น slash commands ด้วย ชื่อจะถูกปรับให้เป็น `a-z0-9_` (สูงสุด 32 อักขระ); หากชนกันจะเติมคำต่อท้ายเป็นตัวเลข (เช่น `_2`)
  - `/skill <name> [input]` เรียกใช้ skill ตามชื่อ (มีประโยชน์เมื่อข้อจำกัดของคำสั่งแบบเนทีฟทำให้ไม่สามารถมีคำสั่งแยกต่อ skill ได้)
  - โดยค่าเริ่มต้น คำสั่ง skill จะถูกส่งต่อไปยังโมเดลเป็นคำขอปกติ
  - Skills สามารถประกาศ `command-dispatch: tool` แบบไม่บังคับเพื่อกำหนดเส้นทางคำสั่งไปยังเครื่องมือโดยตรงได้ (กำหนดแน่นอน ไม่ใช้โมเดล)
  - ตัวอย่าง: `/prose` (plugin OpenProse) — ดู [OpenProse](/th/prose)
- **อาร์กิวเมนต์ของคำสั่งแบบเนทีฟ:** Discord ใช้ autocomplete สำหรับตัวเลือกแบบไดนามิก (และใช้เมนูปุ่มเมื่อคุณละอาร์กิวเมนต์ที่จำเป็น) Telegram และ Slack จะแสดงเมนูปุ่มเมื่อคำสั่งรองรับตัวเลือกและคุณละอาร์กิวเมนต์นั้น

## `/tools`

`/tools` ตอบคำถามด้าน runtime ไม่ใช่คำถามด้านการกำหนดค่า: **สิ่งที่เอเจนต์นี้สามารถใช้ได้ในตอนนี้
ในการสนทนานี้**

- ค่าเริ่มต้นของ `/tools` เป็นแบบย่อและปรับให้เหมาะกับการสแกนอย่างรวดเร็ว
- `/tools verbose` จะเพิ่มคำอธิบายสั้น ๆ
- พื้นผิวคำสั่งแบบเนทีฟที่รองรับอาร์กิวเมนต์ จะแสดงตัวสลับโหมดเดียวกันเป็น `compact|verbose`
- ผลลัพธ์มีขอบเขตตามเซสชัน ดังนั้นการเปลี่ยนเอเจนต์ ช่องทาง เธรด การอนุญาตผู้ส่ง หรือโมเดล อาจ
  เปลี่ยนเอาต์พุตได้
- `/tools` รวมเครื่องมือที่เข้าถึงได้จริงขณะ runtime รวมถึงเครื่องมือแกนหลัก เครื่องมือ plugin
  ที่เชื่อมต่ออยู่ และเครื่องมือที่ช่องทางเป็นเจ้าของ

สำหรับการแก้ไขโปรไฟล์และการเขียนทับ ให้ใช้แผงเครื่องมือใน Control UI หรือพื้นผิว config/catalog แทน
การมอง `/tools` เป็นแค็ตตาล็อกแบบคงที่

## พื้นผิวการใช้งาน (อะไรแสดงที่ไหน)

- **การใช้งาน/โควตาของผู้ให้บริการ** (ตัวอย่าง: “Claude เหลือ 80%”) จะแสดงใน `/status` สำหรับผู้ให้บริการของโมเดลปัจจุบันเมื่อเปิดใช้การติดตามการใช้งาน OpenClaw จะปรับหน้าต่างของผู้ให้บริการให้เป็น `% ที่เหลือ`; สำหรับ MiniMax ฟิลด์เปอร์เซ็นต์แบบเหลืออย่างเดียวจะถูกกลับค่า قبلแสดง และการตอบกลับ `model_remains` จะเลือกใช้รายการ chat-model พร้อมป้ายแผนที่ติดแท็กโมเดลก่อน
- บรรทัด **โทเค็น/แคช** ใน `/status` สามารถย้อนกลับไปใช้รายการการใช้งานล่าสุดใน transcript ได้เมื่อ snapshot ของเซสชันสดมีข้อมูลน้อย ค่าที่ไม่เป็นศูนย์จากข้อมูลสดที่มีอยู่เดิมยังคงมีลำดับความสำคัญสูงกว่า และการย้อนกลับไปใช้ transcript ยังสามารถกู้คืนป้ายโมเดล runtime ที่ใช้งานอยู่ รวมถึงยอดรวมที่เน้น prompt ซึ่งมากกว่าได้เมื่อยอดรวมที่เก็บไว้หายไปหรือมีค่าน้อยกว่า
- **Runtime เทียบกับ runner:** `/status` จะรายงาน `Runtime` สำหรับเส้นทางการทำงานจริงและสถานะ sandbox และรายงาน `Runner` ว่าใครเป็นผู้รันเซสชันจริง: Pi แบบฝัง, ผู้ให้บริการที่อิง CLI หรือ harness/backend ของ ACP
- **โทเค็น/ค่าใช้จ่ายต่อการตอบกลับ** ควบคุมโดย `/usage off|tokens|full` (ต่อท้ายกับการตอบกลับปกติ)
- `/model status` เกี่ยวกับ **โมเดล/การยืนยันตัวตน/endpoints** ไม่ใช่การใช้งาน

## การเลือกโมเดล (`/model`)

`/model` ถูกนำไปใช้งานในรูปแบบ directive

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

- `/model` และ `/model list` จะแสดงตัวเลือกแบบกะทัดรัดที่มีหมายเลขกำกับ (ตระกูลโมเดล + ผู้ให้บริการที่มี)
- บน Discord, `/model` และ `/models` จะเปิดตัวเลือกแบบโต้ตอบที่มีดรอปดาวน์ผู้ให้บริการและโมเดล พร้อมขั้นตอน Submit
- `/model <#>` เลือกจากตัวเลือกนั้น (และจะพยายามใช้ผู้ให้บริการปัจจุบันก่อนเมื่อเป็นไปได้)
- `/model status` จะแสดงมุมมองแบบละเอียด รวมถึง endpoint ของผู้ให้บริการที่กำหนดค่าไว้ (`baseUrl`) และโหมด API (`api`) เมื่อมี

## การเขียนทับสำหรับดีบัก

`/debug` ให้คุณตั้งค่าการเขียนทับการกำหนดค่าแบบ **runtime เท่านั้น** (อยู่ในหน่วยความจำ ไม่เขียนดิสก์) เฉพาะเจ้าของ ปิดไว้โดยค่าเริ่มต้น; เปิดใช้ด้วย `commands.debug: true`

ตัวอย่าง:

```
/debug show
/debug set messages.responsePrefix="[openclaw]"
/debug set channels.whatsapp.allowFrom=["+1555","+4477"]
/debug unset messages.responsePrefix
/debug reset
```

หมายเหตุ:

- การเขียนทับจะมีผลทันทีต่อการอ่านการกำหนดค่าใหม่ แต่จะ **ไม่** เขียนลง `openclaw.json`
- ใช้ `/debug reset` เพื่อล้างการเขียนทับทั้งหมดและกลับไปใช้การกำหนดค่าบนดิสก์

## เอาต์พุต trace ของ plugin

`/trace` ให้คุณสลับ **บรรทัด trace/debug ของ plugin ที่มีขอบเขตตามเซสชัน** ได้โดยไม่ต้องเปิดโหมด verbose เต็มรูปแบบ

ตัวอย่าง:

```text
/trace
/trace on
/trace off
```

หมายเหตุ:

- `/trace` โดยไม่มีอาร์กิวเมนต์จะแสดงสถานะ trace ปัจจุบันของเซสชัน
- `/trace on` เปิดใช้บรรทัด trace ของ plugin สำหรับเซสชันปัจจุบัน
- `/trace off` ปิดอีกครั้ง
- บรรทัด trace ของ plugin อาจปรากฏใน `/status` และเป็นข้อความวินิจฉัยติดตามหลังการตอบกลับปกติของผู้ช่วย
- `/trace` ไม่ได้ใช้แทน `/debug`; `/debug` ยังคงใช้จัดการการเขียนทับการกำหนดค่าแบบ runtime เท่านั้น
- `/trace` ไม่ได้ใช้แทน `/verbose`; เอาต์พุตเครื่องมือ/สถานะแบบ verbose ปกติยังคงเป็นหน้าที่ของ `/verbose`

## การอัปเดตการกำหนดค่า

`/config` จะเขียนไปยังไฟล์การกำหนดค่าบนดิสก์ของคุณ (`openclaw.json`) เฉพาะเจ้าของ ปิดไว้โดยค่าเริ่มต้น; เปิดใช้ด้วย `commands.config: true`

ตัวอย่าง:

```
/config show
/config show messages.responsePrefix
/config get messages.responsePrefix
/config set messages.responsePrefix="[openclaw]"
/config unset messages.responsePrefix
```

หมายเหตุ:

- การกำหนดค่าจะถูกตรวจสอบความถูกต้องก่อนเขียน; การเปลี่ยนแปลงที่ไม่ถูกต้องจะถูกปฏิเสธ
- การอัปเดต `/config` จะคงอยู่หลังการรีสตาร์ต

## การอัปเดต MCP

`/mcp` เขียนคำจำกัดความเซิร์ฟเวอร์ MCP ที่ OpenClaw จัดการไว้ภายใต้ `mcp.servers` เฉพาะเจ้าของ ปิดไว้โดยค่าเริ่มต้น; เปิดใช้ด้วย `commands.mcp: true`

ตัวอย่าง:

```text
/mcp show
/mcp show context7
/mcp set context7={"command":"uvx","args":["context7-mcp"]}
/mcp unset context7
```

หมายเหตุ:

- `/mcp` จะเก็บการกำหนดค่าไว้ในคอนฟิก OpenClaw ไม่ใช่การตั้งค่าโปรเจกต์ที่ Pi เป็นเจ้าของ
- อะแดปเตอร์รันไทม์จะเป็นผู้ตัดสินว่าทรานสปอร์ตใดสามารถรันได้จริง

## การอัปเดต plugin

`/plugins` ให้ผู้ปฏิบัติการตรวจสอบ plugin ที่ค้นพบและสลับการเปิดใช้งานในคอนฟิกได้ โฟลว์แบบอ่านอย่างเดียวสามารถใช้ `/plugin` เป็นนามแฝงได้ ปิดไว้โดยค่าเริ่มต้น; เปิดใช้ด้วย `commands.plugins: true`

ตัวอย่าง:

```text
/plugins
/plugins list
/plugin show context7
/plugins enable context7
/plugins disable context7
```

หมายเหตุ:

- `/plugins list` และ `/plugins show` ใช้การค้นหา plugin จริงกับ workspace ปัจจุบันพร้อมคอนฟิกบนดิสก์
- `/plugins enable|disable` จะอัปเดตเฉพาะคอนฟิกของ plugin; ไม่ได้ติดตั้งหรือลบการติดตั้ง plugin
- หลังเปลี่ยนแปลงการเปิด/ปิดใช้งาน ให้รีสตาร์ต gateway เพื่อให้มีผล

## หมายเหตุเกี่ยวกับพื้นผิว

- **คำสั่งแบบข้อความ** จะทำงานในเซสชันแชตปกติ (DM ใช้ `main` ร่วมกัน, กลุ่มมีเซสชันของตนเอง)
- **คำสั่งแบบเนทีฟ** ใช้เซสชันแยก:
  - Discord: `agent:<agentId>:discord:slash:<userId>`
  - Slack: `agent:<agentId>:slack:slash:<userId>` (คำนำหน้าปรับได้ผ่าน `channels.slack.slashCommand.sessionPrefix`)
  - Telegram: `telegram:slash:<userId>` (กำหนดเป้าหมายไปยังเซสชันแชตผ่าน `CommandTargetSessionKey`)
- **`/stop`** กำหนดเป้าหมายไปยังเซสชันแชตที่กำลังใช้งาน เพื่อให้สามารถยกเลิกการรันปัจจุบันได้
- **Slack:** `channels.slack.slashCommand` ยังรองรับอยู่สำหรับคำสั่งเดี่ยวสไตล์ `/openclaw` หากคุณเปิดใช้ `commands.native` คุณต้องสร้างคำสั่ง slash ของ Slack หนึ่งรายการต่อคำสั่ง built-in (ใช้ชื่อเดียวกับ `/help`) เมนูอาร์กิวเมนต์ของคำสั่งสำหรับ Slack จะถูกส่งเป็นปุ่ม Block Kit แบบ ephemeral
  - ข้อยกเว้นของคำสั่งแบบเนทีฟบน Slack: ลงทะเบียน `/agentstatus` (ไม่ใช่ `/status`) เพราะ Slack สงวน `/status` ไว้ ข้อความ `/status` ยังใช้ได้ในข้อความ Slack

## คำถามแทรก BTW

`/btw` คือ **คำถามแทรก** แบบรวดเร็วเกี่ยวกับเซสชันปัจจุบัน

ต่างจากแชตปกติ:

- มันใช้เซสชันปัจจุบันเป็นบริบทพื้นหลัง
- มันรันเป็นการเรียกแบบครั้งเดียวแยกต่างหากที่ **ไม่มีเครื่องมือ**
- มันไม่เปลี่ยนบริบทของเซสชันในอนาคต
- มันไม่ถูกเขียนลงในประวัติ transcript
- มันถูกส่งเป็นผลลัพธ์แทรกแบบสดแทนที่จะเป็นข้อความผู้ช่วยปกติ

สิ่งนี้ทำให้ `/btw` มีประโยชน์เมื่อคุณต้องการคำชี้แจงชั่วคราวในขณะที่งานหลัก
ยังดำเนินต่อไป

ตัวอย่าง:

```text
/btw what are we doing right now?
```

ดู [BTW Side Questions](/th/tools/btw) สำหรับรายละเอียดพฤติกรรมทั้งหมดและ UX ของไคลเอนต์
