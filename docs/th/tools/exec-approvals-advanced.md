---
read_when:
    - การกำหนดค่า safe bins หรือโปรไฟล์ safe-bin แบบกำหนดเอง
    - การส่งต่อการอนุมัติไปยัง Slack/Discord/Telegram หรือช่องแชตอื่น ๆ
    - การติดตั้งใช้งานไคลเอนต์การอนุมัติแบบเนทีฟสำหรับช่องทางหนึ่ง ๆ
summary: 'การอนุมัติ `exec` ขั้นสูง: safe bins, การ bind ตัวแปลภาษา, การส่งต่อการอนุมัติ, การส่งมอบแบบเนทีฟ'
title: การอนุมัติ `exec` — ขั้นสูง
x-i18n:
    generated_at: "2026-04-24T09:36:13Z"
    model: gpt-5.4
    provider: openai
    source_hash: b7834a8ebfb623b38e4c2676f0e24285d5b44e2dce45c55a33db842d1bbf81be
    source_path: tools/exec-approvals-advanced.md
    workflow: 15
---

หัวข้อขั้นสูงของการอนุมัติ `exec`: fast-path ของ `safeBins`, การ bind ตัวแปลภาษา/runtime และการส่งต่อการอนุมัติไปยังช่องแชต (รวมถึงการส่งมอบแบบเนทีฟ)
สำหรับนโยบายหลักและโฟลว์การอนุมัติ ดู [Exec approvals](/th/tools/exec-approvals)

## Safe bins (stdin-only)

`tools.exec.safeBins` กำหนดรายการไบนารี **stdin-only** ขนาดเล็ก (เช่น `cut`) ที่สามารถทำงานในโหมด allowlist ได้ **โดยไม่ต้อง** มีรายการ allowlist แบบชัดเจน Safe bins จะปฏิเสธ positional file args และโทเค็นที่มีลักษณะเป็น path ดังนั้นจึงทำงานได้เฉพาะกับสตรีมขาเข้าเท่านั้น ควรมองสิ่งนี้เป็น fast-path แบบจำกัดสำหรับตัวกรองสตรีม ไม่ใช่รายการเชื่อถือทั่วไป

<Warning>
อย่าเพิ่มไบนารีของตัวแปลภาษาหรือ runtime (เช่น `python3`, `node`,
`ruby`, `bash`, `sh`, `zsh`) ลงใน `safeBins` หากคำสั่งสามารถประเมินโค้ด,
รัน subcommands หรืออ่านไฟล์ได้ตามการออกแบบ ควรใช้รายการ allowlist แบบชัดเจน
และเปิดใช้พรอมป์ต์อนุมัติไว้ โปรไฟล์ safe bin แบบกำหนดเองต้องกำหนดโปรไฟล์อย่างชัดเจนใน
`tools.exec.safeBinProfiles.<bin>`
</Warning>

safe bins เริ่มต้น:

[//]: # "SAFE_BIN_DEFAULTS:START"

`cut`, `uniq`, `head`, `tail`, `tr`, `wc`

[//]: # "SAFE_BIN_DEFAULTS:END"

`grep` และ `sort` ไม่ได้อยู่ในรายการเริ่มต้น หากคุณเลือกเปิดใช้ ให้คงรายการ
allowlist แบบชัดเจนไว้สำหรับเวิร์กโฟลว์ที่ไม่ใช่ stdin สำหรับ `grep` ในโหมด safe-bin
ให้ระบุ pattern ด้วย `-e`/`--regexp`; รูปแบบ positional pattern จะถูกปฏิเสธ
เพื่อไม่ให้ file operands ถูกแอบส่งผ่านในรูป positional ที่กำกวม

### การตรวจสอบ argv และแฟล็กที่ถูกปฏิเสธ

การตรวจสอบเป็นแบบ deterministic จากรูปร่างของ argv เท่านั้น (ไม่มีการตรวจสอบการมีอยู่ของไฟล์ใน filesystem ของโฮสต์) ซึ่งช่วยป้องกันพฤติกรรมแบบ file-existence oracle จากความแตกต่างระหว่าง allow/deny ตัวเลือกที่เกี่ยวกับไฟล์จะถูกปฏิเสธสำหรับ safe bins เริ่มต้น; long options จะถูกตรวจสอบแบบ fail-closed (แฟล็กที่ไม่รู้จักและตัวย่อที่กำกวมจะถูกปฏิเสธ)

แฟล็กที่ถูกปฏิเสธตามโปรไฟล์ safe-bin:

[//]: # "SAFE_BIN_DENIED_FLAGS:START"

- `grep`: `--dereference-recursive`, `--directories`, `--exclude-from`, `--file`, `--recursive`, `-R`, `-d`, `-f`, `-r`
- `jq`: `--argfile`, `--from-file`, `--library-path`, `--rawfile`, `--slurpfile`, `-L`, `-f`
- `sort`: `--compress-program`, `--files0-from`, `--output`, `--random-source`, `--temporary-directory`, `-T`, `-o`
- `wc`: `--files0-from`

[//]: # "SAFE_BIN_DENIED_FLAGS:END"

Safe bins ยังบังคับให้โทเค็น argv ถูกตีความเป็น **ข้อความล้วน** ในเวลา execute
(ไม่มี globbing และไม่มีการขยาย `$VARS`) สำหรับเซกเมนต์ stdin-only ดังนั้น pattern
เช่น `*` หรือ `$HOME/...` จึงไม่สามารถใช้เพื่อแอบอ่านไฟล์ได้

### ไดเรกทอรีไบนารีที่เชื่อถือได้

Safe bins ต้อง resolve มาจากไดเรกทอรีไบนารีที่เชื่อถือได้ (ค่าเริ่มต้นของระบบร่วมกับ `tools.exec.safeBinTrustedDirs` แบบทางเลือก) รายการใน `PATH` จะไม่มีวันถูกเชื่อถือโดยอัตโนมัติ ไดเรกทอรีที่เชื่อถือได้เริ่มต้นถูกตั้งใจให้มีน้อยที่สุด: `/bin`, `/usr/bin` หากไฟล์ปฏิบัติการ safe-bin ของคุณอยู่ในพาธของ package manager/ผู้ใช้ (เช่น `/opt/homebrew/bin`, `/usr/local/bin`, `/opt/local/bin`, `/snap/bin`) ให้เพิ่มพาธเหล่านั้นอย่างชัดเจนใน `tools.exec.safeBinTrustedDirs`

### การเชื่อมคำสั่งใน shell, wrappers และ multiplexers

การเชื่อมคำสั่งใน shell (`&&`, `||`, `;`) อนุญาตได้เมื่อทุกเซกเมนต์ระดับบนสุด
ตรงตาม allowlist (รวมถึง safe bins หรือ skill auto-allow) การ redirect ยังคงไม่รองรับในโหมด allowlist การแทนที่คำสั่ง (`$()` / backticks) จะถูกปฏิเสธระหว่างการ parse allowlist รวมถึงภายใน double quotes; ให้ใช้ single quotes หากคุณต้องการข้อความ `$()` แบบ literal

บนการอนุมัติผ่านแอปคู่หู macOS ข้อความ shell ดิบที่มีไวยากรณ์ควบคุม shell หรือ
ไวยากรณ์การขยายค่า (`&&`, `||`, `;`, `|`, `` ` ``, `$`, `<`, `>`, `(`, `)`) จะ
ถือว่าไม่ตรง allowlist เว้นแต่ตัวไบนารี shell เองจะอยู่ใน allowlist

สำหรับ shell wrappers (`bash|sh|zsh ... -c/-lc`) env overrides ระดับคำขอจะถูกลดเหลือ allowlist แบบชัดเจนขนาดเล็ก (`TERM`, `LANG`, `LC_*`, `COLORTERM`,
`NO_COLOR`, `FORCE_COLOR`)

สำหรับการตัดสินใจ `allow-always` ในโหมด allowlist wrappers ที่เป็น known dispatch (`env`,
`nice`, `nohup`, `stdbuf`, `timeout`) จะบันทึกพาธของ executable ภายในแทนที่จะเป็นพาธของ wrapper Shell multiplexers (`busybox`, `toybox`) จะถูกแกะออกสำหรับ shell applets (`sh`, `ash` ฯลฯ) ในลักษณะเดียวกัน หาก wrapper หรือ multiplexer ไม่สามารถแกะออกได้อย่างปลอดภัย จะไม่มีการบันทึกรายการ allowlist โดยอัตโนมัติ

หากคุณใส่ตัวแปลภาษาอย่าง `python3` หรือ `node` ไว้ใน allowlist ควรใช้
`tools.exec.strictInlineEval=true` เพื่อให้ inline eval ยังคงต้องได้รับการอนุมัติ
อย่างชัดเจน ใน strict mode การตั้ง `allow-always` ยังสามารถบันทึก
การเรียกใช้ตัวแปลภาษา/สคริปต์ที่ไม่เป็นอันตรายได้ แต่ inline-eval carriers จะไม่ถูกบันทึกโดยอัตโนมัติ

### Safe bins เทียบกับ allowlist

| หัวข้อ | `tools.exec.safeBins` | Allowlist (`exec-approvals.json`) |
| ---------------- | ------------------------------------------------------ | ------------------------------------------------------------ |
| เป้าหมาย | อนุญาตตัวกรอง stdin แบบจำกัดโดยอัตโนมัติ | เชื่อถือ executable ที่ระบุอย่างชัดเจน |
| ชนิดการจับคู่ | ชื่อ executable + นโยบาย argv ของ safe-bin | รูปแบบ glob ของพาธ executable ที่ resolve แล้ว |
| ขอบเขตของอาร์กิวเมนต์ | ถูกจำกัดโดยโปรไฟล์ safe-bin และกฎ literal-token | จับคู่เฉพาะพาธ; ส่วนอาร์กิวเมนต์เป็นความรับผิดชอบของคุณ |
| ตัวอย่างทั่วไป | `head`, `tail`, `tr`, `wc` | `jq`, `python3`, `node`, `ffmpeg`, CLI แบบกำหนดเอง |
| การใช้งานที่เหมาะสม | การแปลงข้อความความเสี่ยงต่ำใน pipeline | เครื่องมือใด ๆ ที่มีพฤติกรรมกว้างขึ้นหรือมีผลข้างเคียง |

ตำแหน่งการกำหนดค่า:

- `safeBins` มาจาก config (`tools.exec.safeBins` หรือ `agents.list[].tools.exec.safeBins` ต่อเอเจนต์)
- `safeBinTrustedDirs` มาจาก config (`tools.exec.safeBinTrustedDirs` หรือ `agents.list[].tools.exec.safeBinTrustedDirs` ต่อเอเจนต์)
- `safeBinProfiles` มาจาก config (`tools.exec.safeBinProfiles` หรือ `agents.list[].tools.exec.safeBinProfiles` ต่อเอเจนต์) คีย์ของโปรไฟล์ต่อเอเจนต์จะมีลำดับความสำคัญเหนือคีย์ระดับโกลบอล
- รายการ allowlist อยู่ใน `~/.openclaw/exec-approvals.json` บนโฮสต์ภายใต้ `agents.<id>.allowlist` (หรือผ่าน Control UI / `openclaw approvals allowlist ...`)
- `openclaw security audit` จะเตือนด้วย `tools.exec.safe_bins_interpreter_unprofiled` เมื่อมีไบนารีของตัวแปลภาษา/runtime อยู่ใน `safeBins` โดยไม่มีโปรไฟล์แบบชัดเจน
- `openclaw doctor --fix` สามารถ scaffold รายการ `safeBinProfiles.<bin>` แบบกำหนดเองที่ขาดหายเป็น `{}` ได้ (จากนั้นให้ตรวจทานและจำกัดให้รัดกุมขึ้น) ไบนารีของตัวแปลภาษา/runtime จะไม่ถูก scaffold ให้อัตโนมัติ

ตัวอย่างโปรไฟล์แบบกำหนดเอง:
__OC_I18N_900000__
หากคุณเลือกใส่ `jq` ลงใน `safeBins` อย่างชัดเจน OpenClaw ก็ยังคงปฏิเสธ `env` builtin ในโหมด safe-bin
ดังนั้น `jq -n env` จึงไม่สามารถ dump environment ของโพรเซสโฮสต์ได้โดยไม่มีพาธ allowlist แบบชัดเจน
หรือพรอมป์ต์การอนุมัติ

## คำสั่งของตัวแปลภาษา/runtime

การรันตัวแปลภาษา/runtime ที่มีการอนุมัติรองรับจะมีแนวทางแบบอนุรักษ์นิยมโดยเจตนา:

- จะ bind บริบท exact argv/cwd/env เสมอ
- รูปแบบ direct shell script และ direct runtime file จะ bind กับ snapshot ของไฟล์ในเครื่องที่เป็นรูปธรรมหนึ่งไฟล์แบบ best-effort
- รูปแบบ common package-manager wrapper ที่ยัง resolve ไปยังไฟล์ในเครื่องโดยตรงเพียงไฟล์เดียวได้ (เช่น
  `pnpm exec`, `pnpm node`, `npm exec`, `npx`) จะถูกแกะออกก่อนทำการ bind
- หาก OpenClaw ไม่สามารถระบุไฟล์ในเครื่องที่เป็นรูปธรรมได้ **เพียงหนึ่งไฟล์อย่างชัดเจน** สำหรับคำสั่งตัวแปลภาษา/runtime
  (เช่น package scripts, รูปแบบ eval, runtime-specific loader chains หรือรูปแบบหลายไฟล์ที่กำกวม)
  การ execute ที่รองรับด้วยการอนุมัติจะถูกปฏิเสธ แทนที่จะอ้างว่าครอบคลุมเชิงความหมายทั้งที่จริงไม่ครอบคลุม
- สำหรับเวิร์กโฟลว์เหล่านั้น ควรใช้ sandboxing, ขอบเขตโฮสต์แยกต่างหาก หรือ trusted
  allowlist/full workflow แบบชัดเจนที่โอเปอเรเตอร์ยอมรับ semantics ของ runtime ที่กว้างกว่า

เมื่อจำเป็นต้องมีการอนุมัติ เครื่องมือ exec จะส่งกลับทันทีพร้อม approval id ใช้ id นั้นเพื่อ
เชื่อมโยงกับเหตุการณ์ระบบที่ตามมา (`Exec finished` / `Exec denied`) หากไม่มีการตัดสินใจมาถึงก่อน timeout คำขอนั้นจะถูกถือว่าเป็น approval timeout และแสดงเป็นเหตุผลการปฏิเสธ

### พฤติกรรมการส่งมอบ followup

หลังจาก async exec ที่ได้รับการอนุมัติทำงานเสร็จ OpenClaw จะส่ง `agent` turn ติดตามผลไปยังเซสชันเดิม

- หากมีเป้าหมายการส่งภายนอกที่ถูกต้องอยู่ (ช่องทางที่ส่งได้พร้อม target `to`) การส่งมอบ followup จะใช้ช่องทางนั้น
- ในโฟลว์ที่มีเฉพาะ webchat หรือ internal-session ที่ไม่มีเป้าหมายภายนอก การส่งมอบ followup จะอยู่เฉพาะในเซสชัน (`deliver: false`)
- หากผู้เรียกขอการส่งมอบภายนอกแบบ strict อย่างชัดเจน แต่ไม่สามารถ resolve ช่องทางภายนอกได้ คำขอจะล้มเหลวด้วย `INVALID_REQUEST`
- หากเปิดใช้ `bestEffortDeliver` และไม่สามารถ resolve ช่องทางภายนอกได้ การส่งมอบจะถูกลดระดับเป็น session-only แทนที่จะล้มเหลว

## การส่งต่อการอนุมัติไปยังช่องแชต

คุณสามารถส่งต่อพรอมป์ต์การอนุมัติ exec ไปยังช่องแชตใดก็ได้ (รวมถึงช่องทาง Plugin) และอนุมัติ
ผ่าน `/approve` โดยใช้ไปป์ไลน์การส่งออกปกติ

คอนฟิก:
__OC_I18N_900001__
ตอบกลับในแชต:
__OC_I18N_900002__
คำสั่ง `/approve` รองรับทั้งการอนุมัติ exec และการอนุมัติ Plugin หาก ID ไม่ตรงกับ exec approval ที่กำลังรออยู่ ระบบจะตรวจสอบการอนุมัติ Plugin โดยอัตโนมัติแทน

### การส่งต่อการอนุมัติ Plugin

การส่งต่อการอนุมัติ Plugin ใช้ไปป์ไลน์การส่งมอบเดียวกับการอนุมัติ exec แต่มีคอนฟิกแยกอิสระของตัวเองภายใต้ `approvals.plugin` การเปิดหรือปิดอย่างหนึ่งจะไม่ส่งผลต่ออีกอย่าง
__OC_I18N_900003__
รูปแบบคอนฟิกเหมือนกับ `approvals.exec`: `enabled`, `mode`, `agentFilter`,
`sessionFilter` และ `targets` ทำงานเหมือนกัน

ช่องทางที่รองรับการตอบกลับแบบ interactive ร่วมกันจะแสดงปุ่มอนุมัติชุดเดียวกันสำหรับทั้ง exec และ
การอนุมัติ Plugin ช่องทางที่ไม่มี UI แบบ interactive ร่วมกันจะ fallback เป็นข้อความธรรมดาพร้อมคำสั่ง `/approve`

### การอนุมัติในแชตเดียวกันบนทุกช่องทาง

เมื่อคำขออนุมัติ exec หรือ Plugin เริ่มต้นมาจากพื้นผิวแชตที่สามารถส่งมอบได้ แชตเดิมนั้น
จะสามารถอนุมัติผ่าน `/approve` ได้โดยค่าเริ่มต้นแล้ว สิ่งนี้ใช้กับช่องทางต่าง ๆ เช่น Slack, Matrix และ
Microsoft Teams เพิ่มเติมจากโฟลว์ Web UI และ terminal UI ที่มีอยู่เดิม

เส้นทางข้อความร่วมนี้ใช้โมเดลการยืนยันตัวตนของช่องทางนั้นสำหรับการสนทนานั้นตามปกติ หากแชตต้นทาง
สามารถส่งคำสั่งและรับคำตอบได้อยู่แล้ว คำขออนุมัติก็ไม่จำเป็นต้องมี native delivery adapter แยกต่างหากเพียงเพื่อคงสถานะ pending

Discord และ Telegram ก็รองรับ `/approve` ในแชตเดียวกันเช่นกัน แต่ช่องทางเหล่านั้นยังคงใช้
รายการ approver ที่ resolve แล้วสำหรับการให้สิทธิ์ แม้เมื่อปิดใช้งาน native approval delivery อยู่

สำหรับ Telegram และ native approval clients อื่น ๆ ที่เรียก Gateway โดยตรง
fallback นี้ถูกจำกัดโดยเจตนาไว้เฉพาะความล้มเหลวแบบ "approval not found" เท่านั้น การปฏิเสธ/ข้อผิดพลาดของ
exec approval จริงจะไม่ retry ไปเป็นการอนุมัติ Plugin แบบเงียบ ๆ

### การส่งมอบการอนุมัติแบบเนทีฟ

บางช่องทางสามารถทำหน้าที่เป็น native approval clients ได้ด้วย Native clients จะเพิ่ม approver DMs, origin-chat
fanout และ UX การอนุมัติแบบ interactive เฉพาะช่องทาง ทับซ้อนบนโฟลว์ `/approve` ในแชตเดียวกันแบบร่วม

เมื่อมี cards/buttons การอนุมัติแบบเนทีฟให้ใช้ UI แบบเนทีฟนั้นเป็นเส้นทางหลัก
ที่เอเจนต์ใช้ เอเจนต์ไม่ควร echo คำสั่งแชต `/approve` แบบข้อความธรรมดาซ้ำอีก
เว้นแต่ผลลัพธ์ของเครื่องมือจะระบุว่าไม่สามารถอนุมัติผ่านแชตได้ หรือการอนุมัติด้วยตนเองเป็นเส้นทางที่เหลืออยู่เพียงอย่างเดียว

โมเดลทั่วไป:

- นโยบาย `exec` ของโฮสต์ยังคงเป็นตัวตัดสินว่าจำเป็นต้องมีการอนุมัติ `exec` หรือไม่
- `approvals.exec` ควบคุมการส่งต่อพรอมป์ต์การอนุมัติไปยังปลายทางแชตอื่น ๆ
- `channels.<channel>.execApprovals` ควบคุมว่าช่องทางนั้นจะทำหน้าที่เป็น native approval client หรือไม่

Native approval clients จะเปิดใช้การส่งแบบ DM-first โดยอัตโนมัติเมื่อเงื่อนไขทั้งหมดต่อไปนี้เป็นจริง:

- ช่องทางนั้นรองรับการส่งมอบการอนุมัติแบบเนทีฟ
- สามารถ resolve approvers ได้จาก `execApprovals.approvers` แบบชัดเจน หรือจาก
  แหล่ง fallback ที่มีการอธิบายไว้สำหรับช่องทางนั้น
- `channels.<channel>.execApprovals.enabled` ไม่ได้ตั้งค่าไว้ หรือเป็น `"auto"`

ตั้งค่า `enabled: false` เพื่อปิด native approval client อย่างชัดเจน ตั้งค่า `enabled: true` เพื่อบังคับ
ให้เปิดเมื่อ resolve approvers ได้ การส่งมอบไปยัง origin-chat แบบสาธารณะยังคงต้องกำหนดอย่างชัดเจนผ่าน
`channels.<channel>.execApprovals.target`

คำถามที่พบบ่อย: [ทำไมจึงมีคอนฟิกการอนุมัติ exec สำหรับการอนุมัติผ่านแชตอยู่สองชุด?](/help/faq-first-run#why-are-there-two-exec-approval-configs-for-chat-approvals)

- Discord: `channels.discord.execApprovals.*`
- Slack: `channels.slack.execApprovals.*`
- Telegram: `channels.telegram.execApprovals.*`

Native approval clients เหล่านี้จะเพิ่มการกำหนดเส้นทาง DM และการ fanout ไปยังช่องทางแบบทางเลือก ทับซ้อนบน
โฟลว์ `/approve` ในแชตเดียวกันแบบร่วม และปุ่มอนุมัติร่วม

พฤติกรรมร่วม:

- Slack, Matrix, Microsoft Teams และแชตที่ส่งมอบได้ในลักษณะใกล้เคียงกัน ใช้โมเดลการยืนยันตัวตนของช่องทางตามปกติ
  สำหรับ `/approve` ในแชตเดียวกัน
- เมื่อ native approval client เปิดใช้อัตโนมัติ เป้าหมายการส่งมอบแบบเนทีฟเริ่มต้นคือ DM ของ approver
- สำหรับ Discord และ Telegram จะมีเพียง approvers ที่ resolve แล้วเท่านั้นที่สามารถอนุมัติหรือปฏิเสธได้
- approvers ของ Discord อาจระบุแบบชัดเจน (`execApprovals.approvers`) หรืออนุมานจาก `commands.ownerAllowFrom`
- approvers ของ Telegram อาจระบุแบบชัดเจน (`execApprovals.approvers`) หรืออนุมานจากคอนฟิกเจ้าของที่มีอยู่ (`allowFrom` รวมถึง `defaultTo` ของ direct-message เมื่อรองรับ)
- approvers ของ Slack อาจระบุแบบชัดเจน (`execApprovals.approvers`) หรืออนุมานจาก `commands.ownerAllowFrom`
- ปุ่มแบบเนทีฟของ Slack จะคงชนิดของ approval id ไว้ ดังนั้น id แบบ `plugin:` จึงสามารถ resolve การอนุมัติ Plugin ได้
  โดยไม่ต้องมีชั้น fallback ภายใน Slack เพิ่มอีกชั้น
- การกำหนดเส้นทาง DM/ช่องทางแบบเนทีฟของ Matrix และทางลัดแบบ reaction รองรับทั้งการอนุมัติ exec และ Plugin;
  ส่วนการให้สิทธิ์ Plugin ยังคงมาจาก `channels.matrix.dm.allowFrom`
- ผู้ร้องขอไม่จำเป็นต้องเป็น approver
- แชตต้นทางสามารถอนุมัติโดยตรงด้วย `/approve` ได้ เมื่อแชตนั้นรองรับคำสั่งและคำตอบอยู่แล้ว
- ปุ่มอนุมัติ Discord แบบเนทีฟจะกำหนดเส้นทางตามชนิดของ approval id: id แบบ `plugin:` จะไป
  ที่การอนุมัติ Plugin โดยตรง ส่วนกรณีอื่นทั้งหมดจะไปที่การอนุมัติ exec
- ปุ่มอนุมัติ Telegram แบบเนทีฟใช้ fallback แบบมีขอบเขตจาก exec ไป Plugin เช่นเดียวกับ `/approve`
- เมื่อ `target` แบบเนทีฟเปิดใช้การส่งมอบไปยัง origin-chat พรอมป์ต์การอนุมัติจะรวมข้อความคำสั่งไว้ด้วย
- exec approvals ที่ค้างอยู่จะหมดอายุภายใน 30 นาทีโดยค่าเริ่มต้น
- หากไม่มี UI ของโอเปอเรเตอร์หรือ approval client ที่กำหนดไว้สามารถรับคำขอได้ พรอมป์ต์จะ fallback ไปที่ `askFallback`

ค่าเริ่มต้นของ Telegram จะใช้ DM ของ approver (`target: "dm"`) คุณสามารถเปลี่ยนเป็น `channel` หรือ `both` ได้เมื่อ
ต้องการให้พรอมป์ต์การอนุมัติแสดงในแชต/หัวข้อ Telegram ต้นทางด้วย สำหรับหัวข้อฟอรัมของ Telegram
OpenClaw จะคงหัวข้อนั้นไว้ทั้งสำหรับพรอมป์ต์การอนุมัติและ follow-up หลังการอนุมัติ

ดูเพิ่มเติม:

- [Discord](/channels/discord)
- [Telegram](/channels/telegram)

### โฟลว์ IPC ของ macOS
__OC_I18N_900004__
หมายเหตุด้านความปลอดภัย:

- Unix socket mode `0600`, โทเค็นเก็บไว้ใน `exec-approvals.json`
- การตรวจสอบ peer ที่ใช้ UID เดียวกัน
- Challenge/response (nonce + HMAC token + request hash) + TTL แบบสั้น

## ที่เกี่ยวข้อง

- [Exec approvals](/th/tools/exec-approvals) — นโยบายหลักและโฟลว์การอนุมัติ
- [เครื่องมือ Exec](/th/tools/exec)
- [โหมดยกระดับสิทธิ์](/th/tools/elevated)
- [Skills](/th/tools/skills) — พฤติกรรม auto-allow ที่อิงกับ skill
