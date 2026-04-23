---
read_when:
    - การกำหนดค่าการอนุมัติ exec หรือ allowlist to=functions.read commentary 】【。】【”】【json  күниpath":"docs/AGENTS.md","offset":1,"limit":200} code
    - กำลังติดตั้ง UX การอนุมัติ exec ในแอป macOS to=functions.read commentary  ಒಂದjson ӡбpath":"docs/AGENTS.md","offset":1,"limit":200} code
    - การทบทวนพรอมป์การออกจาก sandbox และผลกระทบ դրանց to=functions.read commentary  ընդունվածjson რობისpath":"docs/AGENTS.md","offset":1,"limit":200} code
summary: การอนุมัติ exec, allowlist และพรอมป์การออกจาก sandbox
title: การอนุมัติ exec
x-i18n:
    generated_at: "2026-04-23T06:00:15Z"
    model: gpt-5.4
    provider: openai
    source_hash: 0738108dd21e24eb6317d437b7ac693312743eddc3ec295ba62c4e60356cb33e
    source_path: tools/exec-approvals.md
    workflow: 15
---

# การอนุมัติ exec

การอนุมัติ exec คือ **guardrail ของ companion app / โฮสต์ node** สำหรับการให้เอเจนต์ที่อยู่ใน sandbox รัน
คำสั่งบนโฮสต์จริง (`gateway` หรือ `node`) ให้มองมันเหมือนระบบ interlock ด้านความปลอดภัย:
คำสั่งจะถูกอนุญาตก็ต่อเมื่อ policy + allowlist + (การอนุมัติจากผู้ใช้แบบไม่บังคับ) เห็นพ้องกันทั้งหมด
การอนุมัติ exec เป็นสิ่งที่อยู่ **เพิ่มเติมจาก** นโยบายเครื่องมือและ elevated gating (เว้นแต่ elevated จะตั้งเป็น `full` ซึ่งจะข้ามการอนุมัติ)
นโยบายที่มีผลคือค่าที่ **เข้มงวดกว่า** ระหว่าง `tools.exec.*` และค่าเริ่มต้นของ approvals; หากละฟิลด์ของ approvals ไว้ จะใช้ค่าจาก `tools.exec`
host exec ยังใช้สถานะ approvals ในเครื่องของเครื่องนั้นด้วย ค่า `ask: "always"` ที่เป็น host-local
ใน `~/.openclaw/exec-approvals.json` จะยังคงถามทุกครั้ง แม้ว่าค่าเริ่มต้นของ session หรือ config จะร้องขอ `ask: "on-miss"`
ใช้ `openclaw approvals get`, `openclaw approvals get --gateway` หรือ
`openclaw approvals get --node <id|name|ip>` เพื่อตรวจสอบนโยบายที่ร้องขอ,
แหล่งนโยบายของโฮสต์ และผลลัพธ์ที่มีผลจริง
สำหรับเครื่อง local, `openclaw exec-policy show` จะแสดงมุมมองที่ถูกรวมแบบเดียวกัน และ
`openclaw exec-policy set|preset` สามารถซิงก์นโยบาย local ที่ร้องขอเข้ากับ
ไฟล์ approvals ของโฮสต์ local ได้ในขั้นตอนเดียว เมื่อขอบเขต local ร้องขอ `host=node`,
`openclaw exec-policy show` จะรายงานขอบเขตนั้นว่าได้รับการจัดการโดย node ขณะรันไทม์ แทนที่จะ
แสร้งว่าไฟล์ approvals ในเครื่องคือแหล่งความจริงที่มีผล

หาก UI ของ companion app **ไม่พร้อมใช้งาน** คำขอใดก็ตามที่ต้องมีพรอมป์
จะถูกตัดสินโดย **ask fallback** (ค่าเริ่มต้น: deny)

ไคลเอนต์การอนุมัติผ่านแชตแบบ native ยังสามารถแสดง affordance เฉพาะช่องทางบนข้อความอนุมัติ
ที่ค้างอยู่ได้ ตัวอย่างเช่น Matrix สามารถใส่ reaction shortcut ลงในพรอมป์อนุมัติ (`✅` อนุญาตครั้งเดียว, `❌` ปฏิเสธ และ `♾️` อนุญาตตลอดเมื่อมี) ขณะเดียวกันก็ยังคงปล่อยคำสั่ง `/approve ...` ไว้ในข้อความเป็น fallback

## ใช้กับที่ไหน

การอนุมัติ exec ถูกบังคับใช้ในเครื่องบนโฮสต์ที่ทำการรัน:

- **โฮสต์ gateway** → โปรเซส `openclaw` บนเครื่อง gateway
- **โฮสต์ node** → ตัวรัน node (แอปคู่หู macOS หรือโฮสต์ node แบบ headless)

หมายเหตุเรื่องโมเดลความเชื่อถือ:

- ผู้เรียกที่ยืนยันตัวตนกับ Gateway แล้วเป็นผู้ปฏิบัติงานที่เชื่อถือได้สำหรับ Gateway นั้น
- Node ที่จับคู่แล้วจะขยายความสามารถของผู้ปฏิบัติงานที่เชื่อถือได้นั้นไปยังโฮสต์ node
- การอนุมัติ exec ลดความเสี่ยงจากการรันโดยไม่ตั้งใจ แต่ไม่ใช่ขอบเขต auth ต่อผู้ใช้
- การรันบนโฮสต์ node ที่ได้รับอนุมัติจะ bind กับบริบทการรันแบบ canonical: cwd แบบ canonical, argv ที่ตรงกันทุกตัว, การ bind env
  เมื่อมีอยู่ และพาธ executable ที่ถูก pin เมื่อเกี่ยวข้อง
- สำหรับ shell script และการเรียกใช้ไฟล์แบบ direct interpreter/runtime, OpenClaw จะพยายาม bind
  กับ file operand ในเครื่องที่เป็นรูปธรรมหนึ่งรายการด้วย หากไฟล์ที่ bind ไว้เปลี่ยนไปหลังอนุมัติแต่ก่อนรัน
  การรันจะถูกปฏิเสธแทนที่จะรันเนื้อหาที่ drift ไปแล้ว
- การ bind ไฟล์นี้เป็นแบบ best-effort โดยตั้งใจ ไม่ใช่โมเดลเชิงความหมายที่สมบูรณ์ของทุก
  พาธ loader ของ interpreter/runtime หากโหมด approval ไม่สามารถระบุไฟล์ local แบบเป็นรูปธรรมได้อย่างแน่นอนเพียงหนึ่งรายการ
  มันจะปฏิเสธการสร้างการรันที่อาศัย approval แทนที่จะเสแสร้งว่าครอบคลุมทั้งหมด

การแยกบน macOS:

- **service ของโฮสต์ node** จะส่งต่อ `system.run` ไปยัง **แอป macOS** ผ่าน local IPC
- **แอป macOS** จะบังคับใช้การอนุมัติ + ดำเนินการคำสั่งในบริบทของ UI

## การตั้งค่าและการจัดเก็บ

การอนุมัติจะอยู่ในไฟล์ JSON ในเครื่องบนโฮสต์ที่ทำการรัน:

`~/.openclaw/exec-approvals.json`

schema ตัวอย่าง:

```json
{
  "version": 1,
  "socket": {
    "path": "~/.openclaw/exec-approvals.sock",
    "token": "base64url-token"
  },
  "defaults": {
    "security": "deny",
    "ask": "on-miss",
    "askFallback": "deny",
    "autoAllowSkills": false
  },
  "agents": {
    "main": {
      "security": "allowlist",
      "ask": "on-miss",
      "askFallback": "deny",
      "autoAllowSkills": true,
      "allowlist": [
        {
          "id": "B0C8C0B3-2C2D-4F8A-9A3C-5A4B3C2D1E0F",
          "pattern": "~/Projects/**/bin/rg",
          "lastUsedAt": 1737150000000,
          "lastUsedCommand": "rg -n TODO",
          "lastResolvedPath": "/Users/user/Projects/.../bin/rg"
        }
      ]
    }
  }
}
```

## โหมด "YOLO" แบบไม่ต้องอนุมัติ

หากคุณต้องการให้ host exec รันได้โดยไม่มีพรอมป์อนุมัติ คุณต้องเปิด **ทั้งสอง** ชั้นของนโยบาย:

- นโยบาย exec ที่ร้องขอใน config ของ OpenClaw (`tools.exec.*`)
- นโยบาย approvals ของโฮสต์ใน `~/.openclaw/exec-approvals.json`

ตอนนี้นี่คือพฤติกรรมเริ่มต้นของโฮสต์ เว้นแต่คุณจะทำให้เข้มขึ้นอย่างชัดเจน:

- `tools.exec.security`: `full` บน `gateway`/`node`
- `tools.exec.ask`: `off`
- โฮสต์ `askFallback`: `full`

ความแตกต่างสำคัญ:

- `tools.exec.host=auto` เลือกว่าควรรัน exec ที่ไหน: ใน sandbox เมื่อมี มิฉะนั้นที่ gateway
- YOLO เลือกว่าการอนุมัติ host exec จะเป็นอย่างไร: `security=full` บวก `ask=off`
- ในโหมด YOLO, OpenClaw จะไม่เพิ่ม gate สำหรับการอนุมัติ command-obfuscation แบบ heuristic หรือชั้นปฏิเสธ script-preflight แยกต่างหากทับลงบน policy host exec ที่กำหนดไว้
- `auto` ไม่ได้ทำให้การกำหนดเส้นทางไปยัง gateway เป็น override แบบฟรีจากเซสชันที่อยู่ใน sandbox คำขอ `host=node` ต่อครั้งได้รับอนุญาตจาก `auto` และ `host=gateway` จะได้รับอนุญาตจาก `auto` ก็ต่อเมื่อไม่มี sandbox runtime ที่ทำงานอยู่ หากคุณต้องการค่าเริ่มต้นแบบไม่ใช่ auto ที่คงที่ ให้ตั้ง `tools.exec.host` หรือใช้ `/exec host=...` อย่างชัดเจน

หากคุณต้องการการตั้งค่าที่ระมัดระวังกว่านี้ ให้ทำให้ชั้นใดชั้นหนึ่งเข้มกลับไปเป็น `allowlist` / `on-miss`
หรือ `deny`

การตั้งค่า "ไม่ต้องถามอีก" แบบถาวรสำหรับโฮสต์ gateway:

```bash
openclaw config set tools.exec.host gateway
openclaw config set tools.exec.security full
openclaw config set tools.exec.ask off
openclaw gateway restart
```

จากนั้นตั้งค่าไฟล์ approvals ของโฮสต์ให้ตรงกัน:

```bash
openclaw approvals set --stdin <<'EOF'
{
  version: 1,
  defaults: {
    security: "full",
    ask: "off",
    askFallback: "full"
  }
}
EOF
```

ทางลัดในเครื่องสำหรับนโยบายโฮสต์ gateway แบบเดียวกันบนเครื่องปัจจุบัน:

```bash
openclaw exec-policy preset yolo
```

ทางลัดในเครื่องนี้จะอัปเดตทั้ง:

- local `tools.exec.host/security/ask`
- ค่าเริ่มต้นของ `~/.openclaw/exec-approvals.json` ในเครื่อง

มันตั้งใจให้ใช้ได้เฉพาะในเครื่องเท่านั้น หากคุณต้องการเปลี่ยน approvals ของโฮสต์ gateway หรือโฮสต์ node
จากระยะไกล ให้ใช้ `openclaw approvals set --gateway` หรือ
`openclaw approvals set --node <id|name|ip>` ต่อไป

สำหรับโฮสต์ node ให้ใช้ไฟล์ approvals แบบเดียวกันบน node นั้นแทน:

```bash
openclaw approvals set --node <id|name|ip> --stdin <<'EOF'
{
  version: 1,
  defaults: {
    security: "full",
    ask: "off",
    askFallback: "full"
  }
}
EOF
```

ข้อจำกัดสำคัญที่ใช้ได้เฉพาะในเครื่อง:

- `openclaw exec-policy` จะไม่ซิงก์ approvals ของ node
- `openclaw exec-policy set --host node` จะถูกปฏิเสธ
- approvals ของ node exec จะถูกดึงจาก node ขณะรันไทม์ ดังนั้นการอัปเดตที่มุ่งไปยัง node ต้องใช้ `openclaw approvals --node ...`

ทางลัดเฉพาะเซสชัน:

- `/exec security=full ask=off` เปลี่ยนเฉพาะเซสชันปัจจุบัน
- `/elevated full` เป็นทางลัดแบบ break-glass ที่ข้ามการอนุมัติ exec สำหรับเซสชันนั้นด้วย

หากไฟล์ approvals ของโฮสต์ยังคงเข้มกว่า config นโยบายของโฮสต์ที่เข้มกว่าจะยังคงมีผล

## ตัวปรับนโยบาย

### Security (`exec.security`)

- **deny**: บล็อกคำขอ host exec ทั้งหมด
- **allowlist**: อนุญาตเฉพาะคำสั่งที่อยู่ใน allowlist
- **full**: อนุญาตทุกอย่าง (เทียบเท่ากับ elevated)

### Ask (`exec.ask`)

- **off**: ไม่ถามเลย
- **on-miss**: ถามเฉพาะเมื่อ allowlist ไม่ตรง
- **always**: ถามทุกคำสั่ง
- ความเชื่อใจแบบ durable `allow-always` จะไม่ระงับพรอมป์เมื่อโหมด ask ที่มีผลเป็น `always`

### Ask fallback (`askFallback`)

หากต้องมีพรอมป์แต่ไม่สามารถเข้าถึง UI ได้ fallback จะเป็นตัวตัดสิน:

- **deny**: บล็อก
- **allowlist**: อนุญาตเฉพาะเมื่อ allowlist ตรง
- **full**: อนุญาต

### การทำ hardening สำหรับ inline interpreter eval (`tools.exec.strictInlineEval`)

เมื่อ `tools.exec.strictInlineEval=true`, OpenClaw จะถือว่ารูปแบบ inline code-eval ต้องใช้การอนุมัติ แม้ไบนารี interpreter เองจะอยู่ใน allowlist

ตัวอย่าง:

- `python -c`
- `node -e`, `node --eval`, `node -p`
- `ruby -e`
- `perl -e`, `perl -E`
- `php -r`
- `lua -e`
- `osascript -e`

นี่คือ defense-in-depth สำหรับ loader ของ interpreter ที่ไม่สามารถแมปไปยัง file operand ที่คงที่เพียงหนึ่งเดียวได้อย่างสะอาด ใน strict mode:

- คำสั่งเหล่านี้ยังคงต้องได้รับการอนุมัติอย่างชัดเจน
- `allow-always` จะไม่คงรายการ allowlist ใหม่สำหรับคำสั่งเหล่านี้โดยอัตโนมัติ

## Allowlist (ต่อเอเจนต์)

allowlist เป็นแบบ **ต่อเอเจนต์** หากมีหลายเอเจนต์ ให้สลับว่า
กำลังแก้ไขเอเจนต์ใดอยู่ในแอป macOS แพตเทิร์นเป็น **glob แบบไม่สนตัวพิมพ์เล็ก/ใหญ่**
แพตเทิร์นควร resolve ไปยัง **พาธไบนารี** (รายการที่มีเฉพาะ basename จะถูกละเลย)
รายการ `agents.default` แบบเดิมจะถูกย้ายไปยัง `agents.main` ตอนโหลด
shell chain เช่น `echo ok && pwd` ยังคงต้องให้ทุก top-level segment ผ่านกฎ allowlist

ตัวอย่าง:

- `~/Projects/**/bin/peekaboo`
- `~/.local/bin/*`
- `/opt/homebrew/bin/rg`

แต่ละรายการใน allowlist จะติดตาม:

- **id** UUID ที่คงที่ใช้เป็นตัวตนใน UI (ไม่บังคับ)
- **last used** timestamp
- **last used command**
- **last resolved path**

## อนุญาต CLI ของ skill อัตโนมัติ

เมื่อเปิดใช้ **Auto-allow skill CLIs**, executable ที่ถูกอ้างอิงโดย skill ที่รู้จัก
จะถูกถือว่าอยู่ใน allowlist บน node (macOS node หรือโฮสต์ node แบบ headless) สิ่งนี้ใช้
`skills.bins` ผ่าน Gateway RPC เพื่อดึงรายการ bin ของ skill ปิดสิ่งนี้หากคุณต้องการ allowlist แบบแมนนวลที่เข้มงวด

หมายเหตุสำคัญด้านความเชื่อถือ:

- นี่คือ **implicit convenience allowlist** แยกจากรายการ allowlist แบบแมนนวลของพาธ
- มันมีไว้สำหรับสภาพแวดล้อมของผู้ปฏิบัติงานที่เชื่อถือได้ ซึ่ง Gateway และ node อยู่ในขอบเขตความเชื่อถือเดียวกัน
- หากคุณต้องการความเชื่อถือที่เข้มงวดแบบ explicit ให้คง `autoAllowSkills: false` และใช้เฉพาะรายการ allowlist ของพาธแบบแมนนวล

## safeBins (stdin-only)

`tools.exec.safeBins` กำหนดรายการไบนารี **stdin-only** ขนาดเล็ก (เช่น `cut`)
ที่สามารถรันในโหมด allowlist ได้ **โดยไม่ต้องมี** รายการ allowlist แบบชัดเจน safe bin จะปฏิเสธ
file arg แบบ positional และ token ที่ดูเหมือนพาธ ดังนั้นมันจึงทำงานได้เฉพาะกับสตรีมขาเข้า
ให้ถือว่านี่เป็น fast-path แบบแคบสำหรับ stream filter ไม่ใช่ trust list ทั่วไป
**อย่า** เพิ่มไบนารี interpreter หรือ runtime (เช่น `python3`, `node`, `ruby`, `bash`, `sh`, `zsh`) ลงใน `safeBins`
หากคำสั่งสามารถประเมินโค้ด รัน subcommand หรืออ่านไฟล์ได้โดยการออกแบบ ให้ใช้รายการ allowlist แบบชัดเจนและคงพรอมป์อนุมัติไว้
safe bin แบบกำหนดเองต้องกำหนดโปรไฟล์แบบชัดเจนใน `tools.exec.safeBinProfiles.<bin>`
การตรวจสอบเป็นแบบกำหนดผลลัพธ์ได้แน่นอนจากรูปร่างของ argv เท่านั้น (ไม่มีการตรวจสอบว่าไฟล์มีอยู่จริงบนโฮสต์) ซึ่ง
ป้องกันพฤติกรรมแบบ file-existence oracle จากความแตกต่างระหว่าง allow/deny
ตัวเลือกที่อิงไฟล์จะถูกปฏิเสธสำหรับ safe bin เริ่มต้น (เช่น `sort -o`, `sort --output`,
`sort --files0-from`, `sort --compress-program`, `sort --random-source`,
`sort --temporary-directory`/`-T`, `wc --files0-from`, `jq -f/--from-file`,
`grep -f/--file`)
safe bin ยังบังคับใช้นโยบายแฟล็กต่อไบนารีอย่างชัดเจนสำหรับตัวเลือกที่ทำให้พฤติกรรม stdin-only พัง
(เช่น `sort -o/--output/--compress-program` และแฟล็ก recursive ของ grep)
long option จะถูกตรวจสอบแบบ fail-closed ในโหมด safe-bin: แฟล็กที่ไม่รู้จักและ
ตัวย่อที่กำกวมจะถูกปฏิเสธ
แฟล็กที่ถูกปฏิเสธตามโปรไฟล์ safe-bin:

[//]: # "SAFE_BIN_DENIED_FLAGS:START"

- `grep`: `--dereference-recursive`, `--directories`, `--exclude-from`, `--file`, `--recursive`, `-R`, `-d`, `-f`, `-r`
- `jq`: `--argfile`, `--from-file`, `--library-path`, `--rawfile`, `--slurpfile`, `-L`, `-f`
- `sort`: `--compress-program`, `--files0-from`, `--output`, `--random-source`, `--temporary-directory`, `-T`, `-o`
- `wc`: `--files0-from`

[//]: # "SAFE_BIN_DENIED_FLAGS:END"

safe bin ยังบังคับให้ token ใน argv ถูกปฏิบัติเป็น **ข้อความตามตัวอักษร** ขณะรันจริงด้วย (ไม่มีการ globbing
และไม่มีการขยาย `$VARS`) สำหรับส่วนที่เป็น stdin-only ดังนั้นรูปแบบอย่าง `*` หรือ `$HOME/...` จึงไม่สามารถ
ถูกใช้ลักลอบอ่านไฟล์ได้
safe bin ยังต้อง resolve มาจากไดเรกทอรีไบนารีที่เชื่อถือได้ด้วย (ค่าเริ่มต้นของระบบ บวกกับ
`tools.exec.safeBinTrustedDirs` แบบไม่บังคับ) รายการใน `PATH` จะไม่ถูกเชื่อถือโดยอัตโนมัติ
ไดเรกทอรี safe-bin ที่เชื่อถือได้โดยค่าเริ่มต้นถูกทำให้แคบโดยตั้งใจ: `/bin`, `/usr/bin`
หาก executable ของ safe-bin ของคุณอยู่ในพาธของ package manager/ผู้ใช้ (เช่น
`/opt/homebrew/bin`, `/usr/local/bin`, `/opt/local/bin`, `/snap/bin`) ให้เพิ่มอย่างชัดเจน
ลงใน `tools.exec.safeBinTrustedDirs`
shell chaining และ redirection จะไม่ถูก auto-allow ในโหมด allowlist

อนุญาต shell chaining (`&&`, `||`, `;`) ได้เมื่อทุก top-level segment ตรงตาม allowlist
(รวมทั้ง safe bin หรือ skill auto-allow) ส่วน redirection ยังไม่รองรับในโหมด allowlist
command substitution (`$()` / backticks) จะถูกปฏิเสธระหว่างการ parse allowlist รวมถึงภายใน
double quote; ให้ใช้ single quote หากคุณต้องการข้อความ `$()` แบบตามตัวอักษร
ในการอนุมัติผ่าน companion app บน macOS ข้อความ shell ดิบที่มี shell control หรือ expansion syntax
(`&&`, `||`, `;`, `|`, `` ` ``, `$`, `<`, `>`, `(`, `)`) จะถูกถือว่า allowlist miss เว้นแต่
ตัวไบนารี shell เองจะอยู่ใน allowlist
สำหรับ shell wrapper (`bash|sh|zsh ... -c/-lc`), env override ที่มีขอบเขตต่อคำขอจะถูกลดเหลือ
allowlist แบบชัดเจนขนาดเล็ก (`TERM`, `LANG`, `LC_*`, `COLORTERM`, `NO_COLOR`, `FORCE_COLOR`)
สำหรับการตัดสินใจ allow-always ในโหมด allowlist, dispatch wrapper ที่รู้จัก
(`env`, `nice`, `nohup`, `stdbuf`, `timeout`) จะคงพาธของ executable ด้านในแทนพาธของ wrapper
ส่วน shell multiplexer (`busybox`, `toybox`) ก็จะถูกแกะออกสำหรับ shell applet (`sh`, `ash`,
ฯลฯ) เช่นกัน เพื่อให้คง executable ด้านในแทนไบนารี multiplexer หาก wrapper หรือ
multiplexer ใดไม่สามารถแกะออกได้อย่างปลอดภัย จะไม่มีการคงรายการ allowlist ให้อัตโนมัติ
หากคุณใส่ interpreter อย่าง `python3` หรือ `node` ลงใน allowlist ควรตั้ง `tools.exec.strictInlineEval=true` เพื่อให้ inline eval ยังคงต้องได้รับการอนุมัติอย่างชัดเจน ใน strict mode, `allow-always` ยังสามารถคงการเรียกใช้ interpreter/script ที่ไม่เป็นอันตรายไว้ได้ แต่ carrier ของ inline-eval จะไม่ถูกคงโดยอัตโนมัติ

safe bin เริ่มต้น:

[//]: # "SAFE_BIN_DEFAULTS:START"

`cut`, `uniq`, `head`, `tail`, `tr`, `wc`

[//]: # "SAFE_BIN_DEFAULTS:END"

`grep` และ `sort` ไม่อยู่ในรายการเริ่มต้น หากคุณเลือกเปิดใช้เอง ให้คงรายการ allowlist แบบชัดเจนไว้สำหรับ
เวิร์กโฟลว์ที่ไม่ใช่ stdin ของมัน
สำหรับ `grep` ในโหมด safe-bin ให้ระบุแพตเทิร์นด้วย `-e`/`--regexp`; รูปแบบแพตเทิร์นแบบ positional
จะถูกปฏิเสธ เพื่อไม่ให้ file operand ถูกลักลอบเข้ามาในฐานะ positional ที่กำกวม

### safe bin เทียบกับ allowlist

| หัวข้อ            | `tools.exec.safeBins`                                 | Allowlist (`exec-approvals.json`)                        |
| ----------------- | ----------------------------------------------------- | -------------------------------------------------------- |
| เป้าหมาย          | อนุญาต stream filter แบบแคบโดยอัตโนมัติ             | เชื่อถือ executable ที่ระบุอย่างชัดเจน                  |
| ชนิดการจับคู่     | ชื่อ executable + นโยบาย argv ของ safe-bin           | รูปแบบ glob ของพาธ executable ที่ resolve แล้ว          |
| ขอบเขตของอาร์กิวเมนต์ | ถูกจำกัดโดยโปรไฟล์ safe-bin และกฎ token แบบตามตัวอักษร | จับคู่เฉพาะพาธ; อาร์กิวเมนต์เป็นความรับผิดชอบของคุณเอง |
| ตัวอย่างทั่วไป     | `head`, `tail`, `tr`, `wc`                            | `jq`, `python3`, `node`, `ffmpeg`, CLI แบบกำหนดเอง      |
| การใช้งานที่เหมาะ | การแปลงข้อความความเสี่ยงต่ำใน pipeline               | เครื่องมือใด ๆ ที่มีพฤติกรรมกว้างหรือมี side effect    |

ตำแหน่งการกำหนดค่า:

- `safeBins` มาจาก config (`tools.exec.safeBins` หรือราย agent ที่ `agents.list[].tools.exec.safeBins`)
- `safeBinTrustedDirs` มาจาก config (`tools.exec.safeBinTrustedDirs` หรือราย agent ที่ `agents.list[].tools.exec.safeBinTrustedDirs`)
- `safeBinProfiles` มาจาก config (`tools.exec.safeBinProfiles` หรือราย agent ที่ `agents.list[].tools.exec.safeBinProfiles`) คีย์โปรไฟล์ราย agent จะ override คีย์ระดับ global
- รายการ allowlist อยู่ใน `~/.openclaw/exec-approvals.json` ของโฮสต์ในเครื่อง ภายใต้ `agents.<id>.allowlist` (หรือผ่าน Control UI / `openclaw approvals allowlist ...`)
- `openclaw security audit` จะเตือนด้วย `tools.exec.safe_bins_interpreter_unprofiled` เมื่อพบ interpreter/runtime bin อยู่ใน `safeBins` โดยไม่มีโปรไฟล์แบบชัดเจน
- `openclaw doctor --fix` สามารถ scaffold รายการ `safeBinProfiles.<bin>` แบบกำหนดเองที่หายไปเป็น `{}` ได้ (ให้ทบทวนและทำให้เข้มขึ้นภายหลัง) ส่วน interpreter/runtime bin จะไม่ถูก scaffold ให้อัตโนมัติ

ตัวอย่างโปรไฟล์แบบกำหนดเอง:
__OC_I18N_900005__
หากคุณเลือกใส่ `jq` ลงใน `safeBins` อย่างชัดเจน OpenClaw ก็ยังจะปฏิเสธ `env` builtin ในโหมด safe-bin
ดังนั้น `jq -n env` จึงไม่สามารถ dump สภาพแวดล้อมของโปรเซสบนโฮสต์ได้หากไม่มีพาธ allowlist แบบชัดเจน
หรือพรอมป์อนุมัติ

## การแก้ไขใน Control UI

ใช้การ์ด **Control UI → Nodes → Exec approvals** เพื่อแก้ไขค่าเริ่มต้น override
รายเอเจนต์ และ allowlist เลือกขอบเขต (Defaults หรือเอเจนต์), ปรับนโยบาย,
เพิ่ม/ลบแพตเทิร์นของ allowlist แล้วกด **Save** UI จะแสดง metadata ของ **last used**
ต่อแพตเทิร์น เพื่อให้คุณจัดรายการให้เรียบร้อยได้

ตัวเลือกเป้าหมายให้เลือก **Gateway** (approvals ในเครื่อง) หรือ **Node**
Node ต้องโฆษณา `system.execApprovals.get/set` (แอป macOS หรือโฮสต์ node แบบ headless)
หาก node ยังไม่โฆษณา exec approvals ให้แก้ไข
`~/.openclaw/exec-approvals.json` ในเครื่องของมันโดยตรง

CLI: `openclaw approvals` รองรับการแก้ไขทั้ง gateway หรือ node (ดู [Approvals CLI](/cli/approvals))

## โฟลว์การอนุมัติ

เมื่อจำเป็นต้องมีพรอมป์ gateway จะ broadcast `exec.approval.requested` ไปยังไคลเอนต์ผู้ปฏิบัติงาน
Control UI และแอป macOS จะ resolve มันผ่าน `exec.approval.resolve` จากนั้น gateway จะส่งต่อ
คำขอที่ได้รับอนุมัติไปยังโฮสต์ node

สำหรับ `host=node`, คำขออนุมัติจะมี payload `systemRunPlan` แบบ canonical อยู่ด้วย gateway จะใช้
แผนนั้นเป็นคำสั่ง/cwd/session context ที่เป็น authoritative เมื่อส่งต่อคำขอ `system.run`
ที่ได้รับอนุมัติแล้ว

สิ่งนี้สำคัญสำหรับ latency ของการอนุมัติแบบ async:

- พาธ node exec จะเตรียม canonical plan เพียงหนึ่งชุดไว้ล่วงหน้า
- เรคคอร์ดการอนุมัติจะจัดเก็บแผนนั้นและ metadata ของการ bind ของมัน
- เมื่อได้รับอนุมัติแล้ว การเรียก `system.run` สุดท้ายที่ถูกส่งต่อจะนำแผนที่จัดเก็บไว้มาใช้ซ้ำ
  แทนที่จะเชื่อการแก้ไขของผู้เรียกในภายหลัง
- หากผู้เรียกเปลี่ยน `command`, `rawCommand`, `cwd`, `agentId` หรือ
  `sessionKey` หลังจากสร้างคำขออนุมัติแล้ว gateway จะปฏิเสธ
  การรันที่ถูกส่งต่อว่า approval mismatch

## คำสั่ง interpreter/runtime

การรัน interpreter/runtime ที่อาศัย approval ถูกทำให้อนุรักษ์นิยมโดยตั้งใจ:

- บริบท exact ของ argv/cwd/env จะถูก bind เสมอ
- รูปแบบ direct shell script และ direct runtime file จะถูก bind แบบ best-effort กับ snapshot ของไฟล์ local แบบเป็นรูปธรรมเพียงหนึ่งรายการ
- รูปแบบ package-manager wrapper ที่พบบ่อยซึ่งยังคง resolve ไปยังไฟล์ local โดยตรงเพียงหนึ่งรายการ (เช่น
  `pnpm exec`, `pnpm node`, `npm exec`, `npx`) จะถูกแกะออกก่อนทำการ bind
- หาก OpenClaw ไม่สามารถระบุไฟล์ local แบบเป็นรูปธรรมได้อย่างแน่นอนเพียงหนึ่งรายการสำหรับคำสั่ง interpreter/runtime
  (เช่น package script, eval form, runtime-specific loader chain หรือรูปแบบหลายไฟล์ที่กำกวม)
  การรันที่อาศัย approval จะถูกปฏิเสธ แทนที่จะอ้างว่าครอบคลุม semantics ที่มันไม่ได้มี
- สำหรับเวิร์กโฟลว์เหล่านั้น ควรใช้ sandboxing, ขอบเขตโฮสต์แยกต่างหาก หรือเวิร์กโฟลว์ allowlist/full ที่เชื่อถือได้อย่างชัดเจน
  ซึ่งผู้ปฏิบัติงานยอมรับ semantics ของ runtime ที่กว้างกว่า

เมื่อจำเป็นต้องใช้ approvals เครื่องมือ exec จะคืนค่าทันทีพร้อม approval id ใช้ id นั้นเพื่อ
เชื่อมโยงกับ system event ที่มาภายหลัง (`Exec finished` / `Exec denied`) หากไม่มีการตัดสินใจก่อนถึง
timeout คำขอนั้นจะถูกถือว่าเป็น approval timeout และแสดงเป็นเหตุผลของการปฏิเสธ

### พฤติกรรมการส่งต่อ followup

หลังจาก async exec ที่ได้รับอนุมัติแล้วเสร็จ OpenClaw จะส่งเทิร์น `agent` แบบ followup ไปยังเซสชันเดิม

- หากมีเป้าหมายการส่งภายนอกที่ใช้ได้ (ช่องทางที่ส่งได้พร้อมเป้าหมาย `to`) การส่ง followup จะใช้ช่องทางนั้น
- ในโฟลว์แบบ webchat-only หรือ internal-session ที่ไม่มีเป้าหมายภายนอก followup จะยังคงเป็นแบบ session-only (`deliver: false`)
- หากผู้เรียกร้องขอ strict external delivery อย่างชัดเจนแต่ไม่มีช่องทางภายนอกที่ resolve ได้ คำขอจะล้มเหลวด้วย `INVALID_REQUEST`
- หากเปิดใช้ `bestEffortDeliver` และไม่สามารถ resolve ช่องทางภายนอกได้ การส่งจะถูกลดระดับเป็น session-only แทนที่จะล้มเหลว

กล่องโต้ตอบยืนยันจะประกอบด้วย:

- command + args
- cwd
- agent id
- พาธ executable ที่ resolve แล้ว
- host + metadata ของ policy

การกระทำ:

- **Allow once** → รันทันที
- **Always allow** → เพิ่มลง allowlist + รัน
- **Deny** → บล็อก

## การส่งต่อการอนุมัติไปยังช่องทางแชต

คุณสามารถส่งต่อพรอมป์การอนุมัติ exec ไปยังช่องทางแชตใดก็ได้ (รวมถึงช่องทางของ Plugin) และอนุมัติ
ด้วย `/approve` สิ่งนี้ใช้ pipeline การส่งขาออกตามปกติ

Config:
__OC_I18N_900006__
ตอบกลับในแชต:
__OC_I18N_900007__
คำสั่ง `/approve` จัดการทั้งการอนุมัติ exec และการอนุมัติ Plugin หาก ID ไม่ตรงกับการอนุมัติ exec ที่ค้างอยู่ มันจะตรวจสอบการอนุมัติ Plugin ต่อโดยอัตโนมัติ

### การส่งต่อการอนุมัติ Plugin

การส่งต่อการอนุมัติ Plugin ใช้ delivery pipeline แบบเดียวกับการอนุมัติ exec แต่มี config ของตัวเอง
แยกต่างหากภายใต้ `approvals.plugin` การเปิดหรือปิดใช้อย่างใดอย่างหนึ่งไม่ส่งผลต่ออีกอัน
__OC_I18N_900008__
รูปแบบ config เหมือนกับ `approvals.exec`: `enabled`, `mode`, `agentFilter`,
`sessionFilter` และ `targets` ทำงานแบบเดียวกัน

ช่องทางที่รองรับ interactive reply แบบใช้ร่วมกันจะแสดงปุ่มอนุมัติแบบเดียวกันสำหรับทั้งการอนุมัติ exec และ
Plugin ส่วนช่องทางที่ไม่มี interactive UI แบบใช้ร่วมกันจะ fallback ไปใช้ข้อความธรรมดาพร้อมคำสั่ง `/approve`

### การอนุมัติในแชตเดียวกันบนทุกช่องทาง

เมื่อคำขออนุมัติ exec หรือ Plugin เริ่มต้นจากพื้นผิวแชตที่ส่งได้ แชตเดียวกันนั้น
ก็สามารถอนุมัติด้วย `/approve` ได้โดยค่าเริ่มต้น สิ่งนี้ใช้กับช่องทางอย่าง Slack, Matrix และ
Microsoft Teams นอกเหนือจากโฟลว์ผ่าน Web UI และ terminal UI ที่มีอยู่แล้ว

พาธคำสั่งข้อความแบบใช้ร่วมกันนี้ใช้นโยบาย auth ของช่องทางตามปกติสำหรับบทสนทนานั้น หาก
แชตต้นทางสามารถส่งคำสั่งและรับคำตอบได้อยู่แล้ว คำขออนุมัติไม่จำเป็นต้องมี
native delivery adapter แยกต่างหากเพียงเพื่อคงสถานะรอดำเนินการอีกต่อไป

Discord และ Telegram ก็รองรับ `/approve` ในแชตเดียวกันเช่นกัน แต่ช่องทางเหล่านั้นยังคงใช้
รายการ approver ที่ resolve ได้สำหรับการอนุญาต แม้จะปิด native approval delivery อยู่ก็ตาม

สำหรับ Telegram และ native approval client อื่นที่เรียก Gateway โดยตรง
fallback นี้จะถูกจำกัดไว้โดยตั้งใจเฉพาะกรณี "approval not found" เท่านั้น ความล้มเหลว/ข้อผิดพลาดของการอนุมัติ exec จริง
จะไม่ retry แบบเงียบ ๆ ว่าเป็นการอนุมัติ Plugin

### การส่งมอบการอนุมัติแบบ native

บางช่องทางยังสามารถทำหน้าที่เป็น native approval client ได้ด้วย native client จะเพิ่ม DM ของ approver, origin-chat
fanout และ UX การอนุมัติแบบโต้ตอบเฉพาะช่องทาง ทับลงบนโฟลว์ `/approve`
ในแชตเดียวกันแบบใช้ร่วมกัน

เมื่อมีการ์ด/ปุ่มอนุมัติแบบ native UI แบบ native นั้นจะเป็นเส้นทางหลักที่หันหน้าเข้าหาเอเจนต์
เอเจนต์ไม่ควร echo คำสั่ง plain chat แบบ `/approve` ซ้ำออกมาอีก เว้นแต่ผลลัพธ์ของเครื่องมือจะระบุว่าการอนุมัติผ่านแชตไม่พร้อมใช้งาน หรือการอนุมัติแบบแมนนวลเป็นเส้นทางเดียวที่เหลืออยู่

โมเดลทั่วไป:

- นโยบาย host exec ยังคงเป็นตัวตัดสินว่าจำเป็นต้องมีการอนุมัติ exec หรือไม่
- `approvals.exec` ควบคุมการส่งต่อพรอมป์การอนุมัติไปยังปลายทางแชตอื่น
- `channels.<channel>.execApprovals` ควบคุมว่าช่องทางนั้นจะทำหน้าที่เป็น native approval client หรือไม่

native approval client จะเปิดใช้การส่งแบบ DM-first อัตโนมัติเมื่อเงื่อนไขทั้งหมดต่อไปนี้เป็นจริง:

- ช่องทางนั้นรองรับการส่งมอบการอนุมัติแบบ native
- สามารถ resolve approver ได้จาก `execApprovals.approvers` แบบชัดเจน หรือจากแหล่ง fallback ที่มีเอกสารรองรับของช่องทางนั้น
- `channels.<channel>.execApprovals.enabled` ยังไม่ได้ตั้งค่า หรือเป็น `"auto"`

ตั้ง `enabled: false` เพื่อปิด native approval client อย่างชัดเจน ตั้ง `enabled: true` เพื่อบังคับ
เปิดเมื่อสามารถ resolve approver ได้ การส่งไปยัง origin-chat แบบสาธารณะยังคงต้องเลือกเปิดอย่างชัดเจนผ่าน
`channels.<channel>.execApprovals.target`

FAQ: [Why are there two exec approval configs for chat approvals?](/help/faq#why-are-there-two-exec-approval-configs-for-chat-approvals)

- Discord: `channels.discord.execApprovals.*`
- Slack: `channels.slack.execApprovals.*`
- Telegram: `channels.telegram.execApprovals.*`

native approval client เหล่านี้เพิ่มการกำหนดเส้นทาง DM และ channel fanout แบบไม่บังคับทับลงบน
โฟลว์ `/approve` ในแชตเดียวกันแบบใช้ร่วมกันและปุ่มอนุมัติแบบใช้ร่วมกัน

พฤติกรรมที่ใช้ร่วมกัน:

- Slack, Matrix, Microsoft Teams และแชตที่ส่งได้ในลักษณะใกล้เคียงกัน ใช้โมเดล auth ของช่องทางตามปกติ
  สำหรับ `/approve` ในแชตเดียวกัน
- เมื่อ native approval client เปิดใช้แบบอัตโนมัติ เป้าหมายการส่งแบบ native เริ่มต้นคือ DM ของ approver
- สำหรับ Discord และ Telegram มีเพียง approver ที่ resolve ได้เท่านั้นที่สามารถอนุมัติหรือปฏิเสธได้
- approver ของ Discord อาจระบุแบบ explicit (`execApprovals.approvers`) หรืออนุมานจาก `commands.ownerAllowFrom`
- approver ของ Telegram อาจระบุแบบ explicit (`execApprovals.approvers`) หรืออนุมานจาก config ของ owner ที่มีอยู่ (`allowFrom` บวก direct-message `defaultTo` เมื่อรองรับ)
- approver ของ Slack อาจระบุแบบ explicit (`execApprovals.approvers`) หรืออนุมานจาก `commands.ownerAllowFrom`
- ปุ่ม native ของ Slack จะคงชนิดของ approval id ไว้ ดังนั้น id แบบ `plugin:` จึงสามารถ resolve การอนุมัติ Plugin ได้
  โดยไม่ต้องมีชั้น fallback ภายใน Slack ชั้นที่สอง
- การกำหนดเส้นทาง DM/ช่องทางแบบ native ของ Matrix และ reaction shortcut จัดการทั้งการอนุมัติ exec และ Plugin;
  การอนุญาตของ Plugin ยังคงมาจาก `channels.matrix.dm.allowFrom`
- ผู้ร้องขอไม่จำเป็นต้องเป็น approver
- แชตต้นทางสามารถอนุมัติโดยตรงด้วย `/approve` ได้ เมื่อแชตนั้นรองรับคำสั่งและคำตอบอยู่แล้ว
- ปุ่มอนุมัติ Discord แบบ native จะกำหนดเส้นทางตามชนิดของ approval id: id แบบ `plugin:` จะไป
  ยังการอนุมัติ Plugin โดยตรง ส่วนอย่างอื่นทั้งหมดจะไปยังการอนุมัติ exec
- ปุ่มอนุมัติ Telegram แบบ native ใช้ fallback จาก exec ไปยัง Plugin แบบจำกัดเดียวกับ `/approve`
- เมื่อ native `target` เปิดใช้การส่งไปยัง origin-chat พรอมป์อนุมัติจะมีข้อความคำสั่งรวมอยู่ด้วย
- การอนุมัติ exec ที่ค้างอยู่จะหมดอายุหลัง 30 นาทีโดยค่าเริ่มต้น
- หากไม่มี UI ของผู้ปฏิบัติงานหรือ approval client ที่กำหนดค่าไว้ซึ่งสามารถรับคำขอได้ พรอมป์จะ fallback ไปที่ `askFallback`

โดยค่าเริ่มต้น Telegram ใช้ DM ของ approver (`target: "dm"`) คุณสามารถสลับเป็น `channel` หรือ `both` ได้เมื่อต้องการให้พรอมป์การอนุมัติปรากฏในแชต/หัวข้อ Telegram ต้นทางด้วย สำหรับหัวข้อ forum ของ Telegram OpenClaw จะคงหัวข้อนั้นไว้สำหรับพรอมป์การอนุมัติและ follow-up หลังการอนุมัติ

ดู:

- [Discord](/channels/discord)
- [Telegram](/channels/telegram)

### โฟลว์ IPC ของ macOS
__OC_I18N_900009__
หมายเหตุด้านความปลอดภัย:

- โหมด Unix socket `0600`, token ถูกเก็บไว้ใน `exec-approvals.json`
- การตรวจสอบ peer ที่มี UID เดียวกัน
- challenge/response (nonce + HMAC token + request hash) + TTL แบบสั้น

## เหตุการณ์ระบบ

วงจรชีวิตของ exec ถูกแสดงเป็นข้อความระบบ:

- `Exec running` (เฉพาะเมื่อคำสั่งใช้เวลานานเกินเกณฑ์การแจ้งว่ากำลังรัน)
- `Exec finished`
- `Exec denied`

ข้อความเหล่านี้จะถูกโพสต์ไปยังเซสชันของเอเจนต์หลังจาก node รายงานเหตุการณ์แล้ว
การอนุมัติ exec บนโฮสต์ gateway จะปล่อยเหตุการณ์วงจรชีวิตแบบเดียวกันเมื่อคำสั่งเสร็จสิ้น (และอาจปล่อยเมื่อรันนานเกินเกณฑ์ด้วย)
exec ที่อาศัย approval จะใช้ approval id ซ้ำเป็น `runId` ในข้อความเหล่านี้ เพื่อให้เชื่อมโยงกันได้ง่าย

## พฤติกรรมเมื่อการอนุมัติถูกปฏิเสธ

เมื่อ async exec approval ถูกปฏิเสธ OpenClaw จะป้องกันไม่ให้เอเจนต์นำ
เอาต์พุตจากการรันก่อนหน้าของคำสั่งเดียวกันในเซสชันกลับมาใช้ซ้ำ เหตุผลของการปฏิเสธ
จะถูกส่งต่อพร้อมคำแนะนำอย่างชัดเจนว่าไม่มีเอาต์พุตของคำสั่งให้ใช้ ซึ่งหยุดเอเจนต์จากการอ้างว่ามีเอาต์พุตใหม่ หรือทำซ้ำคำสั่งที่ถูกปฏิเสธพร้อมผลลัพธ์เก่าจากการรันที่เคยสำเร็จก่อนหน้า

## ผลกระทบ

- **full** มีพลังมาก; ควรใช้ allowlist เมื่อทำได้
- **ask** ทำให้คุณยังอยู่ในลูป ขณะเดียวกันก็ยังอนุมัติได้อย่างรวดเร็ว
- allowlist ต่อเอเจนต์ช่วยป้องกันไม่ให้การอนุมัติของเอเจนต์หนึ่งรั่วไปยังอีกเอเจนต์
- approvals ใช้กับคำขอ host exec จาก **ผู้ส่งที่ได้รับอนุญาต** เท่านั้น ผู้ส่งที่ไม่ได้รับอนุญาตไม่สามารถออก `/exec` ได้
- `/exec security=full` เป็นทางลัดระดับเซสชันสำหรับผู้ปฏิบัติงานที่ได้รับอนุญาต และจะข้าม approvals โดยการออกแบบ
  หากต้องการบล็อก host exec แบบ hard-block ให้ตั้ง approvals security เป็น `deny` หรือ deny เครื่องมือ `exec` ผ่านนโยบายเครื่องมือ

ที่เกี่ยวข้อง:

- [Exec tool](/th/tools/exec)
- [Elevated mode](/th/tools/elevated)
- [Skills](/th/tools/skills)

## ที่เกี่ยวข้อง

- [Exec](/th/tools/exec) — เครื่องมือสำหรับรันคำสั่ง shell
- [Sandboxing](/th/gateway/sandboxing) — โหมด sandbox และการเข้าถึง workspace
- [Security](/th/gateway/security) — โมเดลความปลอดภัยและการ harden
- [Sandbox vs Tool Policy vs Elevated](/th/gateway/sandbox-vs-tool-policy-vs-elevated) — ควรใช้แต่ละอย่างเมื่อใด
