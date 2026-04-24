---
read_when:
    - การกำหนดค่าการอนุมัติ exec หรือ allowlist
    - การ implement UX สำหรับการอนุมัติ exec ในแอป macOS
    - การทบทวนพรอมป์ต์การออกจาก sandbox และผลกระทบที่ตามมา
summary: การอนุมัติ exec, allowlist และพรอมป์ต์สำหรับออกจาก sandbox
title: การอนุมัติ exec
x-i18n:
    generated_at: "2026-04-24T09:36:24Z"
    model: gpt-5.4
    provider: openai
    source_hash: 0d7c5cd24e7c1831d5a865da6fa20f4c23280a0ec12b9e8f7f3245170a05a37d
    source_path: tools/exec-approvals.md
    workflow: 15
---

การอนุมัติ exec คือ **ราวกั้นความปลอดภัยของ companion app / node host** สำหรับการอนุญาตให้
เอเจนต์ที่อยู่ใน sandbox รันคำสั่งบนโฮสต์จริง (`gateway` หรือ `node`) เป็นตัวอินเทอร์ล็อกด้านความปลอดภัย:
คำสั่งจะได้รับอนุญาตก็ต่อเมื่อ policy + allowlist + (การอนุมัติจากผู้ใช้แบบไม่บังคับ) เห็นพ้องกันทั้งหมด
การอนุมัติ exec จะซ้อน **อยู่ด้านบน** ของนโยบายเครื่องมือและ elevated gating
(เว้นแต่ elevated ถูกตั้งเป็น `full` ซึ่งจะข้ามการอนุมัติ)

<Note>
นโยบายที่มีผลจริงคือค่าที่ **เข้มงวดกว่า** ระหว่างค่าเริ่มต้นของ `tools.exec.*` และ approvals;
หากมีการละฟิลด์ของ approvals ไว้ จะใช้ค่าจาก `tools.exec` แทน
host exec ยังใช้สถานะ approvals ภายในเครื่องบนเครื่องนั้นด้วย — หากมี `ask: "always"` แบบ host-local
ใน `~/.openclaw/exec-approvals.json` ระบบก็จะยังคงถามทุกครั้งแม้เซสชันหรือค่าเริ่มต้นในคอนฟิกจะร้องขอ `ask: "on-miss"`
</Note>

## การตรวจสอบนโยบายที่มีผลจริง

- `openclaw approvals get`, `... --gateway`, `... --node <id|name|ip>` — แสดงนโยบายที่ร้องขอ แหล่งนโยบายของโฮสต์ และผลลัพธ์ที่มีผลจริง
- `openclaw exec-policy show` — มุมมองแบบรวมของเครื่องภายในเครื่อง
- `openclaw exec-policy set|preset` — ซิงโครไนซ์นโยบายที่ร้องขอภายในเครื่องกับไฟล์ approvals ของโฮสต์ภายในเครื่องในขั้นตอนเดียว

เมื่อขอบเขตภายในเครื่องร้องขอ `host=node`, `exec-policy show` จะรายงานขอบเขตนั้น
ว่าเป็นแบบจัดการโดย Node ในเวลารันจริง แทนที่จะทำเหมือนไฟล์ approvals ภายในเครื่องคือแหล่งความจริง

หาก UI ของ companion app **ไม่พร้อมใช้งาน** คำขอใดก็ตามที่ปกติจะต้องมีการถาม จะถูกตัดสินด้วย **ask fallback** (ค่าเริ่มต้น: ปฏิเสธ)

<Tip>
ไคลเอนต์อนุมัติในแชตแบบเนทีฟสามารถเตรียม affordance เฉพาะ channel ไว้บน
ข้อความการอนุมัติที่กำลังรอได้ ตัวอย่างเช่น Matrix จะเตรียมชอร์ตคัต reaction (`✅`
อนุญาตครั้งเดียว, `❌` ปฏิเสธ, `♾️` อนุญาตเสมอ) ขณะเดียวกันก็ยังคงมีคำสั่ง `/approve ...`
ในข้อความไว้เป็น fallback
</Tip>

## ใช้กับที่ไหนบ้าง

การอนุมัติ exec ถูกบังคับใช้ในเครื่องบนโฮสต์ที่ใช้รัน:

- **gateway host** → โปรเซส `openclaw` บนเครื่อง Gateway
- **node host** → ตัวรัน Node (macOS companion app หรือ node host แบบ headless)

หมายเหตุเรื่องโมเดลความเชื่อถือ:

- ผู้เรียกที่ยืนยันตัวตนกับ Gateway แล้วจะถือเป็น operator ที่เชื่อถือได้สำหรับ Gateway นั้น
- Node ที่จับคู่แล้วจะขยายความสามารถของ operator ที่เชื่อถือได้นั้นไปยัง Node host
- การอนุมัติ exec ช่วยลดความเสี่ยงจากการรันโดยไม่ตั้งใจ แต่ไม่ใช่ขอบเขต auth แบบรายผู้ใช้
- การรันบน Node host ที่ได้รับการอนุมัติแล้วจะผูกกับบริบทการรันแบบ canonical: cwd แบบ canonical, argv แบบตรงตัว, การผูก env
  เมื่อมี และพาธ executable ที่ถูกปักหมุดเมื่อเกี่ยวข้อง
- สำหรับ shell script และการเรียกไฟล์ interpreter/runtime โดยตรง OpenClaw จะพยายามผูก
  operand ไฟล์ภายในเครื่องแบบเป็นรูปธรรมเพียงหนึ่งรายการด้วย หากไฟล์ที่ผูกนั้นเปลี่ยนหลังการอนุมัติแต่ก่อนการรัน
  การรันจะถูกปฏิเสธแทนที่จะรันเนื้อหาที่เปลี่ยนไปแล้ว
- การผูกไฟล์นี้ตั้งใจให้เป็นแบบ best-effort ไม่ใช่โมเดลเชิงความหมายที่สมบูรณ์ของทุกเส้นทางโหลดของ interpreter/runtime
  หากโหมดการอนุมัติไม่สามารถระบุไฟล์ภายในเครื่องแบบเป็นรูปธรรมเพียงหนึ่งรายการที่จะผูกได้อย่างแม่นยำ
  ระบบจะปฏิเสธการออกการรันที่มีการอนุมัติรองรับ แทนที่จะแสร้งว่าครอบคลุมครบถ้วน

การแยกบน macOS:

- **บริการ node host** จะส่งต่อ `system.run` ไปยัง **แอป macOS** ผ่าน local IPC
- **แอป macOS** จะบังคับใช้การอนุมัติ + รันคำสั่งในบริบท UI

## การตั้งค่าและการจัดเก็บ

approvals จะอยู่ในไฟล์ JSON ภายในเครื่องบนโฮสต์ที่ใช้รัน:

`~/.openclaw/exec-approvals.json`

ตัวอย่างสคีมา:

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

หากคุณต้องการให้ host exec รันได้โดยไม่มีพรอมป์ต์ขออนุมัติ คุณต้องเปิด **ทั้งสอง** ชั้นของ policy:

- นโยบาย exec ที่ร้องขอในคอนฟิก OpenClaw (`tools.exec.*`)
- นโยบาย approvals ของโฮสต์ใน `~/.openclaw/exec-approvals.json`

นี่คือลักษณะพฤติกรรมเริ่มต้นของโฮสต์ในตอนนี้ เว้นแต่คุณจะทำให้เข้มงวดขึ้นอย่างชัดเจน:

- `tools.exec.security`: `full` บน `gateway`/`node`
- `tools.exec.ask`: `off`
- host `askFallback`: `full`

ความแตกต่างที่สำคัญ:

- `tools.exec.host=auto` เลือกว่าจะรัน exec ที่ไหน: ใน sandbox เมื่อมี ไม่เช่นนั้นใช้ gateway
- YOLO เลือกว่าการอนุมัติ host exec ทำอย่างไร: `security=full` พร้อม `ask=off`
- ผู้ให้บริการที่อิงกับ CLI ซึ่งมีโหมดสิทธิ์แบบไม่โต้ตอบของตัวเองสามารถทำตามนโยบายนี้ได้
  Claude CLI จะเพิ่ม `--permission-mode bypassPermissions` เมื่อ exec policy ที่ OpenClaw ร้องขอเป็น
  YOLO คุณสามารถ override พฤติกรรมของแบ็กเอนด์นั้นได้ด้วยอาร์กิวเมนต์ Claude แบบระบุชัดเจนภายใต้
  `agents.defaults.cliBackends.claude-cli.args` / `resumeArgs` เช่น
  `--permission-mode default`, `acceptEdits` หรือ `bypassPermissions`
- ในโหมด YOLO OpenClaw จะไม่เพิ่มเกตการอนุมัติเพิ่มเติมสำหรับการอำพรางคำสั่งแบบฮิวริสติก หรือเลเยอร์ปฏิเสธล่วงหน้าของสคริปต์ แยกต่างหากบน host exec policy ที่กำหนดไว้
- `auto` ไม่ได้ทำให้การกำหนดเส้นทางผ่าน gateway เป็นการ override แบบฟรีจากเซสชันที่อยู่ใน sandbox เสมอไป คำขอ `host=node` แบบต่อการเรียกหนึ่งครั้งได้รับอนุญาตจาก `auto` ได้ และ `host=gateway` จะได้รับอนุญาตจาก `auto` ก็ต่อเมื่อไม่มี sandbox runtime ที่กำลังทำงานอยู่เท่านั้น หากคุณต้องการค่าเริ่มต้นที่คงที่และไม่ใช่ auto ให้ตั้ง `tools.exec.host` หรือใช้ `/exec host=...` อย่างชัดเจน

หากคุณต้องการการตั้งค่าที่ระมัดระวังมากขึ้น ให้ทำให้ชั้นใดชั้นหนึ่งกลับเข้มงวดเป็น `allowlist` / `on-miss`
หรือ `deny`

การตั้งค่าแบบ persistent สำหรับ gateway-host ที่ "ไม่ต้องถามเลย":

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

ชอร์ตคัตภายในเครื่องสำหรับนโยบาย gateway-host เดียวกันบนเครื่องปัจจุบัน:

```bash
openclaw exec-policy preset yolo
```

ชอร์ตคัตภายในเครื่องนี้จะอัปเดตทั้งสองส่วน:

- `tools.exec.host/security/ask` ภายในเครื่อง
- ค่าเริ่มต้นของ `~/.openclaw/exec-approvals.json` ภายในเครื่อง

มันตั้งใจให้ใช้ได้เฉพาะภายในเครื่องเท่านั้น หากคุณต้องการเปลี่ยน approvals ของ gateway-host หรือ node-host
จากระยะไกล ให้ใช้ `openclaw approvals set --gateway` หรือ
`openclaw approvals set --node <id|name|ip>` ต่อไป

สำหรับ Node host ให้ใช้ไฟล์ approvals เดียวกันนั้นบน Node นั้นแทน:

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

ข้อจำกัดสำคัญที่เป็นแบบภายในเครื่องเท่านั้น:

- `openclaw exec-policy` ไม่ซิงโครไนซ์ approvals ของ Node
- `openclaw exec-policy set --host node` จะถูกปฏิเสธ
- การอนุมัติ exec ของ Node ถูกดึงจาก Node ในเวลารันจริง ดังนั้นการอัปเดตที่มุ่งไปยัง Node ต้องใช้ `openclaw approvals --node ...`

ชอร์ตคัตเฉพาะเซสชัน:

- `/exec security=full ask=off` เปลี่ยนเฉพาะเซสชันปัจจุบัน
- `/elevated full` เป็นชอร์ตคัตแบบ break-glass ที่จะข้ามการอนุมัติ exec สำหรับเซสชันนั้นด้วย

หากไฟล์ approvals ของโฮสต์ยังคงเข้มงวดกว่าคอนฟิก นโยบายของโฮสต์ที่เข้มงวดกว่าจะยังคงมีผลชนะ

## ปุ่มควบคุมนโยบาย

### ความปลอดภัย (`exec.security`)

- **deny**: บล็อกคำขอ host exec ทั้งหมด
- **allowlist**: อนุญาตเฉพาะคำสั่งที่อยู่ใน allowlist
- **full**: อนุญาตทุกอย่าง (เทียบเท่ากับ elevated)

### Ask (`exec.ask`)

- **off**: ไม่ถามเลย
- **on-miss**: ถามเฉพาะเมื่อ allowlist ไม่ตรง
- **always**: ถามทุกคำสั่ง
- `allow-always` แบบ durable trust จะไม่ระงับพรอมป์ต์เมื่อโหมด ask ที่มีผลจริงเป็น `always`

### Ask fallback (`askFallback`)

หากจำเป็นต้องมีพรอมป์ต์แต่ไม่มี UI ที่เข้าถึงได้ fallback จะเป็นผู้ตัดสิน:

- **deny**: บล็อก
- **allowlist**: อนุญาตเฉพาะเมื่อ allowlist ตรง
- **full**: อนุญาต

### การทำให้เข้มงวดกับ inline interpreter eval (`tools.exec.strictInlineEval`)

เมื่อ `tools.exec.strictInlineEval=true`, OpenClaw จะถือว่ารูปแบบ inline code-eval
เป็นแบบต้องขออนุมัติเท่านั้น แม้ว่าไบนารี interpreter เองจะอยู่ใน allowlist แล้วก็ตาม

ตัวอย่าง:

- `python -c`
- `node -e`, `node --eval`, `node -p`
- `ruby -e`
- `perl -e`, `perl -E`
- `php -r`
- `lua -e`
- `osascript -e`

นี่คือการเสริมความปลอดภัยสำหรับตัวโหลด interpreter ที่ไม่สามารถแมปเข้ากับ file operand ที่คงที่หนึ่งรายการได้อย่างชัดเจน ในโหมด strict:

- คำสั่งเหล่านี้ยังคงต้องได้รับการอนุมัติอย่างชัดเจน
- `allow-always` จะไม่เก็บรายการ allowlist ใหม่สำหรับคำสั่งเหล่านี้โดยอัตโนมัติ

## Allowlist (ต่อเอเจนต์)

allowlist เป็นแบบ **ต่อเอเจนต์** หากมีหลายเอเจนต์ ให้สลับเอเจนต์ที่คุณกำลัง
แก้ไขในแอป macOS รูปแบบคือการจับคู่ glob แบบ **ไม่สนตัวพิมพ์เล็กใหญ่**
pattern ควร resolve ไปยัง **พาธไบนารี** (รายการที่มีเพียง basename จะถูกละเลย)
รายการ `agents.default` แบบเก่าจะถูกย้ายเป็น `agents.main` ตอนโหลด
shell chain เช่น `echo ok && pwd` ยังคงต้องให้ทุก top-level segment ผ่านกฎ allowlist

ตัวอย่าง:

- `~/Projects/**/bin/peekaboo`
- `~/.local/bin/*`
- `/opt/homebrew/bin/rg`

แต่ละรายการใน allowlist จะติดตามสิ่งต่อไปนี้:

- **id** UUID แบบคงที่ที่ใช้เป็นอัตลักษณ์ใน UI (ไม่บังคับ)
- **last used** timestamp
- **last used command**
- **last resolved path**

## อนุญาต CLI ของ Skills อัตโนมัติ

เมื่อเปิด **Auto-allow skill CLIs** executable ที่ถูกอ้างอิงโดย Skills ที่รู้จัก
จะถูกถือว่าอยู่ใน allowlist บน Node (macOS node หรือ headless node host) กลไกนี้ใช้
`skills.bins` ผ่าน Gateway RPC เพื่อดึงรายการไบนารีของ Skill ปิดสิ่งนี้หากคุณต้องการ allowlist แบบแมนนวลที่เข้มงวด

หมายเหตุด้านความเชื่อถือที่สำคัญ:

- นี่คือ **implicit convenience allowlist** ซึ่งแยกจากรายการ allowlist แบบพาธที่เพิ่มด้วยตนเอง
- มันมีไว้สำหรับสภาพแวดล้อม operator ที่เชื่อถือได้ ซึ่ง Gateway และ Node อยู่ในขอบเขตความเชื่อถือเดียวกัน
- หากคุณต้องการความเชื่อถือที่ชัดเจนและเข้มงวด ให้คง `autoAllowSkills: false` และใช้เฉพาะรายการ allowlist แบบพาธที่เพิ่มด้วยตนเอง

## safe bins และการส่งต่อการอนุมัติ

สำหรับ safe bins (เส้นทางลัดแบบ stdin-only) รายละเอียดการผูก interpreter และวิธี
ส่งต่อพรอมป์ต์การอนุมัติไปยัง Slack/Discord/Telegram (หรือรันสิ่งเหล่านั้นเป็น native
approval client) ดู [Exec approvals — advanced](/th/tools/exec-approvals-advanced)

<!-- moved to /tools/exec-approvals-advanced -->

## การแก้ไขใน Control UI

ใช้การ์ด **Control UI → Nodes → Exec approvals** เพื่อแก้ไขค่าเริ่มต้น override
แบบต่อเอเจนต์ และ allowlist เลือกขอบเขต (Defaults หรือเอเจนต์) ปรับนโยบาย
เพิ่ม/ลบ pattern ใน allowlist แล้วกด **Save** UI จะแสดง metadata แบบ **last used**
ต่อ pattern เพื่อให้คุณจัดรายการให้เรียบร้อยได้

ตัวเลือกเป้าหมายจะเลือก **Gateway** (approvals ภายในเครื่อง) หรือ **Node**
Node ต้องประกาศ `system.execApprovals.get/set` (แอป macOS หรือ headless node host)
หาก Node ยังไม่ประกาศ exec approvals ให้แก้ไข
`~/.openclaw/exec-approvals.json` ภายในเครื่องของมันโดยตรง

CLI: `openclaw approvals` รองรับการแก้ไข gateway หรือ Node (ดู [Approvals CLI](/th/cli/approvals))

## ขั้นตอนการอนุมัติ

เมื่อจำเป็นต้องมีพรอมป์ต์ Gateway จะกระจาย `exec.approval.requested` ไปยัง operator client
Control UI และแอป macOS จะ resolve ผ่าน `exec.approval.resolve` จากนั้น Gateway จะส่งต่อ
คำขอที่ได้รับการอนุมัติไปยัง Node host

สำหรับ `host=node` คำขออนุมัติจะมี payload `systemRunPlan` แบบ canonical Gateway ใช้
plan นี้เป็นบริบทคำสั่ง/cwd/เซสชันที่เชื่อถือได้แบบ authoritative เมื่อส่งต่อคำขอ `system.run`
ที่ได้รับการอนุมัติแล้ว

สิ่งนี้สำคัญต่อ latency ของการอนุมัติแบบ async:

- เส้นทาง node exec จะเตรียม plan แบบ canonical หนึ่งชุดไว้ล่วงหน้า
- ระเบียนการอนุมัติจะเก็บ plan นั้นพร้อม metadata การผูกของมัน
- เมื่อได้รับอนุมัติแล้ว การเรียก `system.run` ที่ส่งต่อครั้งสุดท้ายจะใช้ plan ที่เก็บไว้ซ้ำ
  แทนที่จะเชื่อการแก้ไขภายหลังของผู้เรียก
- หากผู้เรียกเปลี่ยน `command`, `rawCommand`, `cwd`, `agentId` หรือ
  `sessionKey` หลังจากสร้างคำขออนุมัติแล้ว Gateway จะปฏิเสธ
  การรันที่ส่งต่อเพราะไม่ตรงกับการอนุมัติ

## System event

วงจรชีวิตของ exec จะแสดงเป็น system message:

- `Exec running` (เฉพาะเมื่อคำสั่งใช้เวลานานเกินเกณฑ์ของ running notice)
- `Exec finished`
- `Exec denied`

ข้อความเหล่านี้จะถูกโพสต์ลงในเซสชันของเอเจนต์หลังจาก Node รายงาน event แล้ว
การอนุมัติ exec บน gateway-host จะปล่อย event วงจรชีวิตแบบเดียวกันเมื่อคำสั่งเสร็จสิ้น (และอาจรวมถึงตอนกำลังทำงานหากนานเกินเกณฑ์)
exec ที่ถูกควบคุมด้วยการอนุมัติจะใช้ approval id ซ้ำเป็น `runId` ในข้อความเหล่านี้เพื่อให้เชื่อมโยงกันได้ง่าย

## พฤติกรรมเมื่อการอนุมัติถูกปฏิเสธ

เมื่อการอนุมัติ exec แบบ async ถูกปฏิเสธ OpenClaw จะป้องกันไม่ให้เอเจนต์นำเอาต์พุต
จากการรันก่อนหน้าของคำสั่งเดียวกันในเซสชันกลับมาใช้ซ้ำ เหตุผลของการปฏิเสธ
จะถูกส่งต่อไปพร้อมคำแนะนำอย่างชัดเจนว่าไม่มีเอาต์พุตของคำสั่งพร้อมใช้งาน ซึ่งป้องกันไม่ให้
เอเจนต์อ้างว่ามีเอาต์พุตใหม่ หรือทำซ้ำคำสั่งที่ถูกปฏิเสธโดยใช้ผลลัพธ์เก่าจากการรันที่เคยสำเร็จก่อนหน้า

## ผลกระทบที่ตามมา

- **full** มีอำนาจสูง; หากเป็นไปได้ควรใช้ allowlist
- **ask** ทำให้คุณยังอยู่ในวงอนุมัติ ขณะเดียวกันก็ยังอนุมัติได้รวดเร็ว
- allowlist แบบต่อเอเจนต์ช่วยป้องกันไม่ให้การอนุมัติของเอเจนต์หนึ่งรั่วไปยังอีกเอเจนต์
- การอนุมัติใช้กับคำขอ host exec จาก **ผู้ส่งที่ได้รับอนุญาต** เท่านั้น ผู้ส่งที่ไม่ได้รับอนุญาตไม่สามารถใช้ `/exec` ได้
- `/exec security=full` เป็นทางลัดระดับเซสชันสำหรับ operator ที่ได้รับอนุญาต และจะข้ามการอนุมัติตามการออกแบบ หากต้องการบล็อก host exec แบบเด็ดขาด ให้ตั้ง approvals security เป็น `deny` หรือปฏิเสธเครื่องมือ `exec` ผ่าน tool policy

## ที่เกี่ยวข้อง

<CardGroup cols={2}>
  <Card title="Exec approvals — advanced" href="/th/tools/exec-approvals-advanced" icon="gear">
    Safe bins, การผูก interpreter และการส่งต่อการอนุมัติไปยังแชต
  </Card>
  <Card title="Exec tool" href="/th/tools/exec" icon="terminal">
    เครื่องมือสำหรับรันคำสั่ง shell
  </Card>
  <Card title="Elevated mode" href="/th/tools/elevated" icon="shield-exclamation">
    เส้นทาง break-glass ที่จะข้ามการอนุมัติด้วย
  </Card>
  <Card title="Sandboxing" href="/th/gateway/sandboxing" icon="box">
    โหมด sandbox และการเข้าถึง workspace
  </Card>
  <Card title="Security" href="/th/gateway/security" icon="lock">
    โมเดลความปลอดภัยและการทำให้แข็งแรงขึ้น
  </Card>
  <Card title="Sandbox vs tool policy vs elevated" href="/th/gateway/sandbox-vs-tool-policy-vs-elevated" icon="sliders">
    ควรเลือกใช้ตัวควบคุมแต่ละแบบเมื่อใด
  </Card>
  <Card title="Skills" href="/th/tools/skills" icon="sparkles">
    พฤติกรรม auto-allow ที่มี Skill หนุนหลัง
  </Card>
</CardGroup>
