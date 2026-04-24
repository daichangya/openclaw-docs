---
read_when:
    - การใช้งานหรือแก้ไข Exec tool
    - การดีบักพฤติกรรมของ stdin หรือ TTY
summary: การใช้งาน Exec tool, โหมด stdin และการรองรับ TTY
title: Exec tool
x-i18n:
    generated_at: "2026-04-24T09:36:23Z"
    model: gpt-5.4
    provider: openai
    source_hash: 4cad17fecfaf7d6a523282ef4f0090e4ffaab89ab53945b5cd831e426f3fc3ac
    source_path: tools/exec.md
    workflow: 15
---

รันคำสั่ง shell ใน workspace รองรับการทำงานแบบ foreground + background ผ่าน `process`
หาก `process` ไม่ได้รับอนุญาต `exec` จะรันแบบ synchronous และจะไม่สนใจ `yieldMs`/`background`
เซสชันเบื้องหลังถูกจำกัดขอบเขตตามเอเจนต์; `process` จะมองเห็นเฉพาะเซสชันจากเอเจนต์เดียวกัน

## พารามิเตอร์

<ParamField path="command" type="string" required>
คำสั่ง shell ที่จะรัน
</ParamField>

<ParamField path="workdir" type="string" default="cwd">
ไดเรกทอรีทำงานสำหรับคำสั่ง
</ParamField>

<ParamField path="env" type="object">
การ override environment แบบคีย์/ค่าที่ถูก merge ทับบน environment ที่สืบทอดมา
</ParamField>

<ParamField path="yieldMs" type="number" default="10000">
ย้ายคำสั่งไปทำงานแบบ background อัตโนมัติหลังจากหน่วงเวลานี้ (ms)
</ParamField>

<ParamField path="background" type="boolean" default="false">
ย้ายคำสั่งไป background ทันทีแทนที่จะรอ `yieldMs`
</ParamField>

<ParamField path="timeout" type="number" default="1800">
ฆ่าคำสั่งหลังจากจำนวนวินาทีนี้
</ParamField>

<ParamField path="pty" type="boolean" default="false">
รันใน pseudo-terminal เมื่อพร้อมใช้งาน ใช้สำหรับ CLI ที่ทำงานได้เฉพาะกับ TTY, coding agents และ terminal UIs
</ParamField>

<ParamField path="host" type="'auto' | 'sandbox' | 'gateway' | 'node'" default="auto">
ตำแหน่งที่จะรัน `auto` จะ resolve เป็น `sandbox` เมื่อมี sandbox runtime ทำงานอยู่ และเป็น `gateway` ในกรณีอื่น
</ParamField>

<ParamField path="security" type="'deny' | 'allowlist' | 'full'">
โหมดการบังคับใช้สำหรับการทำงานบน `gateway` / `node`
</ParamField>

<ParamField path="ask" type="'off' | 'on-miss' | 'always'">
พฤติกรรมของ prompt ขออนุมัติสำหรับการทำงานบน `gateway` / `node`
</ParamField>

<ParamField path="node" type="string">
id/name ของ Node เมื่อ `host=node`
</ParamField>

<ParamField path="elevated" type="boolean" default="false">
ร้องขอโหมดยกระดับสิทธิ์ — ออกจาก sandbox ไปยังพาธโฮสต์ที่กำหนดไว้ `security=full` จะถูกบังคับใช้เฉพาะเมื่อ elevated resolve เป็น `full`
</ParamField>

หมายเหตุ:

- `host` ใช้ค่าเริ่มต้นเป็น `auto`: เป็น sandbox เมื่อ sandbox runtime ทำงานอยู่สำหรับเซสชันนั้น มิฉะนั้นเป็น gateway
- `auto` เป็นกลยุทธ์การกำหนดเส้นทางค่าเริ่มต้น ไม่ใช่ wildcard การเรียกต่อครั้งด้วย `host=node` อนุญาตจาก `auto`; การเรียกต่อครั้งด้วย `host=gateway` อนุญาตเฉพาะเมื่อไม่มี sandbox runtime ทำงานอยู่
- หากไม่มี config เพิ่มเติม `host=auto` ก็ยัง “ใช้งานได้เลย”: ไม่มี sandbox ก็ resolve เป็น `gateway`; หากมี sandbox ที่กำลังทำงานอยู่ก็จะคงอยู่ใน sandbox
- `elevated` จะออกจาก sandbox ไปยังพาธโฮสต์ที่กำหนดไว้: `gateway` โดยค่าเริ่มต้น หรือ `node` เมื่อ `tools.exec.host=node` (หรือค่าเริ่มต้นของเซสชันเป็น `host=node`) ใช้งานได้เฉพาะเมื่อเปิดใช้ elevated access สำหรับเซสชัน/ผู้ให้บริการปัจจุบัน
- การอนุมัติ `gateway`/`node` ถูกควบคุมโดย `~/.openclaw/exec-approvals.json`
- `node` ต้องมี node ที่จับคู่ไว้ (companion app หรือโฮสต์ node แบบ headless)
- หากมีหลาย node ให้ตั้ง `exec.node` หรือ `tools.exec.node` เพื่อเลือก
- `exec host=node` เป็นเส้นทางเดียวสำหรับการรัน shell บน nodes; wrapper แบบเดิม `nodes.run` ถูกนำออกแล้ว
- บนโฮสต์ที่ไม่ใช่ Windows exec จะใช้ `SHELL` หากมีการตั้งค่า; ถ้า `SHELL` เป็น `fish` ระบบจะเลือก `bash` (หรือ `sh`)
  จาก `PATH` ก่อนเพื่อหลีกเลี่ยงสคริปต์ที่ไม่เข้ากันกับ fish แล้วจึง fallback ไปใช้ `SHELL` หากไม่มีทั้งสองตัว
- บนโฮสต์ Windows exec จะเลือกค้นหา PowerShell 7 (`pwsh`) ก่อน (Program Files, ProgramW6432 แล้วจึง PATH)
  จากนั้นจึง fallback ไปใช้ Windows PowerShell 5.1
- การทำงานบนโฮสต์ (`gateway`/`node`) จะปฏิเสธ `env.PATH` และ loader overrides (`LD_*`/`DYLD_*`) เพื่อ
  ป้องกัน binary hijacking หรือการแทรกโค้ด
- OpenClaw ตั้งค่า `OPENCLAW_SHELL=exec` ใน environment ของคำสั่งที่ถูก spawn (รวมถึง PTY และ sandbox execution) เพื่อให้กฎของ shell/profile สามารถตรวจจับบริบทของ exec-tool ได้
- สำคัญ: sandboxing **ปิดอยู่โดยค่าเริ่มต้น** หาก sandboxing ปิดอยู่ implicit `host=auto`
  จะ resolve เป็น `gateway` ส่วน `host=sandbox` แบบ explicit จะยังคง fail closed แทนที่จะไปรันบน gateway host แบบเงียบๆ ให้เปิด sandboxing หรือใช้ `host=gateway` พร้อม approvals
- การตรวจสอบ preflight ของสคริปต์ (สำหรับข้อผิดพลาด shell-syntax ทั่วไปของ Python/Node) จะตรวจสอบเฉพาะไฟล์ที่อยู่ภายใน
  ขอบเขต `workdir` ที่มีผลจริง หากพาธของสคริปต์ resolve ออกนอก `workdir` การตรวจสอบ preflight ของ
  ไฟล์นั้นจะถูกข้าม
- สำหรับงานที่ใช้เวลานานซึ่งเริ่มตอนนี้ ให้เริ่มเพียงครั้งเดียวและพึ่งพา
  automatic completion wake เมื่อเปิดใช้งานและเมื่อคำสั่งมีเอาต์พุตหรือเกิดความล้มเหลว
  ใช้ `process` สำหรับ logs, status, input หรือการแทรกแซง; อย่าจำลอง
  การตั้งเวลาด้วย sleep loops, timeout loops หรือ repeated polling
- สำหรับงานที่ควรเกิดขึ้นภายหลังหรือตามกำหนดเวลา ให้ใช้ Cron แทน
  รูปแบบ sleep/delay ของ `exec`

## Config

- `tools.exec.notifyOnExit` (ค่าเริ่มต้น: true): เมื่อเป็น true เซสชัน exec ที่ถูกย้ายไป background จะเข้าคิว system event และร้องขอ Heartbeat เมื่อตอนจบ
- `tools.exec.approvalRunningNoticeMs` (ค่าเริ่มต้น: 10000): ปล่อย notice แบบ “running” หนึ่งครั้งเมื่อ exec ที่ต้องอนุมัติรันเกินเวลานี้ (0 คือปิด)
- `tools.exec.host` (ค่าเริ่มต้น: `auto`; resolve เป็น `sandbox` เมื่อ sandbox runtime ทำงานอยู่ มิฉะนั้นเป็น `gateway`)
- `tools.exec.security` (ค่าเริ่มต้น: `deny` สำหรับ sandbox, `full` สำหรับ gateway + node เมื่อไม่ได้ตั้งค่า)
- `tools.exec.ask` (ค่าเริ่มต้น: `off`)
- host exec แบบไม่ต้องอนุมัติเป็นค่าเริ่มต้นสำหรับ gateway + node หากคุณต้องการพฤติกรรม approvals/allowlist ให้ทำให้ทั้ง `tools.exec.*` และนโยบายโฮสต์ใน `~/.openclaw/exec-approvals.json` เข้มงวดยิ่งขึ้น; ดู [Exec approvals](/th/tools/exec-approvals#no-approval-yolo-mode)
- YOLO มาจากค่าเริ่มต้นของนโยบายโฮสต์ (`security=full`, `ask=off`) ไม่ได้มาจาก `host=auto` หากคุณต้องการบังคับให้กำหนดเส้นทางไป gateway หรือ node ให้ตั้ง `tools.exec.host` หรือใช้ `/exec host=...`
- ในโหมด `security=full` ร่วมกับ `ask=off` host exec จะทำตามนโยบายที่กำหนดไว้โดยตรง; จะไม่มีชั้น prefilter แบบ heuristic สำหรับ command-obfuscation หรือชั้นปฏิเสธจาก script-preflight เพิ่มเติม
- `tools.exec.node` (ค่าเริ่มต้น: ไม่ได้ตั้งค่า)
- `tools.exec.strictInlineEval` (ค่าเริ่มต้น: false): เมื่อเป็น true รูปแบบ inline interpreter eval เช่น `python -c`, `node -e`, `ruby -e`, `perl -e`, `php -r`, `lua -e` และ `osascript -e` จะต้องได้รับการอนุมัติแบบ explicit เสมอ `allow-always` ยังสามารถ persist การเรียก interpreter/script ที่ไม่อันตรายได้ แต่รูปแบบ inline-eval จะยังคงถามทุกครั้ง
- `tools.exec.pathPrepend`: รายการไดเรกทอรีที่จะ prepend เข้า `PATH` สำหรับการรัน exec (gateway + sandbox เท่านั้น)
- `tools.exec.safeBins`: ไบนารีที่ปลอดภัยแบบ stdin-only ซึ่งสามารถรันได้โดยไม่ต้องมี allowlist entry แบบ explicit สำหรับรายละเอียดพฤติกรรม ดู [Safe bins](/th/tools/exec-approvals-advanced#safe-bins-stdin-only)
- `tools.exec.safeBinTrustedDirs`: ไดเรกทอรี explicit เพิ่มเติมที่เชื่อถือได้สำหรับการตรวจสอบพาธของ `safeBins` รายการใน `PATH` จะไม่ถูกเชื่อถือโดยอัตโนมัติ ค่าเริ่มต้นที่มีในตัวคือ `/bin` และ `/usr/bin`
- `tools.exec.safeBinProfiles`: นโยบาย argv แบบกำหนดเองที่เป็นทางเลือกสำหรับ safe bin แต่ละตัว (`minPositional`, `maxPositional`, `allowedValueFlags`, `deniedFlags`)

ตัวอย่าง:

```json5
{
  tools: {
    exec: {
      pathPrepend: ["~/bin", "/opt/oss/bin"],
    },
  },
}
```

### การจัดการ PATH

- `host=gateway`: merge `PATH` ของ login-shell ของคุณเข้ากับ environment ของ exec การ override `env.PATH` จะ
  ถูกปฏิเสธสำหรับการทำงานบนโฮสต์ อย่างไรก็ตาม daemon เองยังคงทำงานด้วย `PATH` แบบขั้นต่ำ:
  - macOS: `/opt/homebrew/bin`, `/usr/local/bin`, `/usr/bin`, `/bin`
  - Linux: `/usr/local/bin`, `/usr/bin`, `/bin`
- `host=sandbox`: รัน `sh -lc` (login shell) ภายใน container ดังนั้น `/etc/profile` อาจรีเซ็ต `PATH`
  OpenClaw จะ prepend `env.PATH` หลังจาก profile sourcing ผ่าน env var ภายใน (ไม่มี shell interpolation);
  `tools.exec.pathPrepend` ก็มีผลที่นี่เช่นกัน
- `host=node`: จะส่งเฉพาะ env overrides ที่คุณส่งมาและไม่ถูกบล็อกไปยัง node การ override `env.PATH` จะ
  ถูกปฏิเสธสำหรับการทำงานบนโฮสต์และถูกละเลยโดย node hosts หากคุณต้องการรายการ PATH เพิ่มเติมบน node
  ให้กำหนดค่า environment ของบริการโฮสต์ node (systemd/launchd) หรือติดตั้งเครื่องมือไว้ในตำแหน่งมาตรฐาน

การ bind node ต่อเอเจนต์ (ใช้ดัชนีในรายการเอเจนต์ของ config):

```bash
openclaw config get agents.list
openclaw config set agents.list[0].tools.exec.node "node-id-or-name"
```

Control UI: แท็บ Nodes มีแผง “Exec node binding” ขนาดเล็กสำหรับการตั้งค่าเดียวกันนี้

## Overrides ระดับเซสชัน (`/exec`)

ใช้ `/exec` เพื่อกำหนดค่าเริ่มต้น **ต่อเซสชัน** สำหรับ `host`, `security`, `ask` และ `node`
ส่ง `/exec` โดยไม่มีอาร์กิวเมนต์เพื่อแสดงค่าปัจจุบัน

ตัวอย่าง:

```
/exec host=auto security=allowlist ask=on-miss node=mac-1
```

## โมเดลการอนุญาต

`/exec` จะมีผลเฉพาะกับ **ผู้ส่งที่ได้รับอนุญาต** เท่านั้น (allowlists/pairing ของช่องทางส่งข้อความ พร้อม `commands.useAccessGroups`)
มันอัปเดต **เฉพาะสถานะเซสชัน** และไม่เขียน config หากต้องการปิด exec แบบเด็ดขาด ให้
ปฏิเสธมันผ่านนโยบายเครื่องมือ (`tools.deny: ["exec"]` หรือแบบต่อเอเจนต์) ส่วน approvals บนโฮสต์ยังคงมีผล เว้นแต่คุณจะตั้ง
`security=full` และ `ask=off` อย่างชัดเจน

## Exec approvals (companion app / node host)

เอเจนต์ที่อยู่ใน sandbox สามารถถูกกำหนดให้ต้องมีการอนุมัติต่อคำขอก่อนที่ `exec` จะรันบน gateway หรือ node host
ดู [Exec approvals](/th/tools/exec-approvals) สำหรับนโยบาย allowlist และโฟลว์ UI

เมื่อจำเป็นต้องมี approvals exec tool จะคืนกลับทันทีพร้อม
`status: "approval-pending"` และ approval id เมื่อมีการอนุมัติ (หรือถูกปฏิเสธ / หมดเวลา)
Gateway จะปล่อย system events (`Exec finished` / `Exec denied`) หากคำสั่งยังคง
รันอยู่หลัง `tools.exec.approvalRunningNoticeMs` จะมี notice แบบ `Exec running` หนึ่งครั้งถูกปล่อยออกมา
บนช่องทางส่งข้อความที่มี approval cards/buttons แบบเนทีฟ เอเจนต์ควรพึ่งพา
UI แบบเนทีฟนั้นก่อน และควรใส่คำสั่ง `/approve` แบบแมนนวลเฉพาะเมื่อผลลัพธ์ของ tool
ระบุชัดว่าไม่มี approvals ในแชต หรือการอนุมัติแบบแมนนวลเป็น
เส้นทางเดียวเท่านั้น

## Allowlist + safe bins

การบังคับใช้ allowlist แบบแมนนวลจะจับคู่ **เฉพาะพาธไบนารีที่ resolve แล้วเท่านั้น** (ไม่มีการจับคู่ตาม basename) เมื่อ
`security=allowlist` คำสั่ง shell จะถูกอนุญาตอัตโนมัติเฉพาะเมื่อทุกส่วนของ pipeline อยู่ใน
allowlist หรือเป็น safe bin การ chaining (`;`, `&&`, `||`) และ redirections จะถูกปฏิเสธใน
โหมด allowlist เว้นแต่ทุกส่วนระดับบนสุดจะผ่าน allowlist (รวม safe bins ด้วย)
redirections ยังคงไม่รองรับ
ความเชื่อถือแบบ durable `allow-always` ไม่ได้ข้ามกฎนี้: คำสั่งที่ถูก chained ก็ยังคงต้องให้ทุก
ส่วนระดับบนสุดตรงตามเงื่อนไข

`autoAllowSkills` เป็นเส้นทางความสะดวกที่แยกต่างหากใน exec approvals มันไม่เหมือนกับ
รายการ allowlist แบบแมนนวลสำหรับพาธ หากต้องการความเชื่อถือแบบ explicit ที่เข้มงวด ให้ปิด `autoAllowSkills`

ใช้ตัวควบคุมทั้งสองนี้กับงานคนละแบบ:

- `tools.exec.safeBins`: ตัวกรองสตรีมขนาดเล็กแบบ stdin-only
- `tools.exec.safeBinTrustedDirs`: ไดเรกทอรีเชื่อถือได้เพิ่มเติมแบบ explicit สำหรับพาธ executable ของ safe-bin
- `tools.exec.safeBinProfiles`: นโยบาย argv แบบ explicit สำหรับ safe bins แบบกำหนดเอง
- allowlist: ความเชื่อถือแบบ explicit สำหรับพาธ executable

อย่ามอง `safeBins` เป็น allowlist ทั่วไป และอย่าเพิ่มไบนารีประเภท interpreter/runtime (เช่น `python3`, `node`, `ruby`, `bash`) หากคุณต้องการสิ่งเหล่านั้น ให้ใช้รายการ allowlist แบบ explicit และเปิด approval prompts ไว้
`openclaw security audit` จะเตือนเมื่อรายการ `safeBins` ที่เป็น interpreter/runtime ไม่มี explicit profiles และ `openclaw doctor --fix` สามารถ scaffold รายการ `safeBinProfiles` แบบกำหนดเองที่ขาดหายไปให้ได้
`openclaw security audit` และ `openclaw doctor` จะเตือนเช่นกันเมื่อคุณเพิ่มไบนารีพฤติกรรมกว้าง เช่น `jq` กลับเข้าไปใน `safeBins` แบบ explicit
หากคุณ allowlist interpreters แบบ explicit ให้เปิด `tools.exec.strictInlineEval` เพื่อให้รูปแบบ inline code-eval ยังคงต้องขออนุมัติใหม่ทุกครั้ง

สำหรับรายละเอียดของนโยบายเต็มรูปแบบและตัวอย่าง ดู [Exec approvals](/th/tools/exec-approvals-advanced#safe-bins-stdin-only) และ [Safe bins เทียบกับ allowlist](/th/tools/exec-approvals-advanced#safe-bins-versus-allowlist)

## ตัวอย่าง

Foreground:

```json
{ "tool": "exec", "command": "ls -la" }
```

Background + poll:

```json
{"tool":"exec","command":"npm run build","yieldMs":1000}
{"tool":"process","action":"poll","sessionId":"<id>"}
```

การ polling มีไว้สำหรับดูสถานะแบบตามต้องการ ไม่ใช่ลูปรอ หากเปิดใช้ automatic completion wake
ไว้ คำสั่งสามารถปลุกเซสชันได้เมื่อมีเอาต์พุตหรือเกิดความล้มเหลว

ส่งปุ่มกด (แบบ tmux):

```json
{"tool":"process","action":"send-keys","sessionId":"<id>","keys":["Enter"]}
{"tool":"process","action":"send-keys","sessionId":"<id>","keys":["C-c"]}
{"tool":"process","action":"send-keys","sessionId":"<id>","keys":["Up","Up","Enter"]}
```

ส่งคำสั่งยืนยัน (ส่งเฉพาะ CR):

```json
{ "tool": "process", "action": "submit", "sessionId": "<id>" }
```

วางข้อความ (ครอบแบบ bracketed โดยค่าเริ่มต้น):

```json
{ "tool": "process", "action": "paste", "sessionId": "<id>", "text": "line1\nline2\n" }
```

## `apply_patch`

`apply_patch` เป็นเครื่องมือย่อยของ `exec` สำหรับการแก้ไขหลายไฟล์แบบมีโครงสร้าง
โดยเปิดใช้งานเป็นค่าเริ่มต้นสำหรับโมเดล OpenAI และ OpenAI Codex ใช้ config เฉพาะ
เมื่อคุณต้องการปิดใช้งานหรือจำกัดให้ใช้กับบางโมเดลเท่านั้น:

```json5
{
  tools: {
    exec: {
      applyPatch: { workspaceOnly: true, allowModels: ["gpt-5.5"] },
    },
  },
}
```

หมายเหตุ:

- ใช้งานได้เฉพาะกับโมเดล OpenAI/OpenAI Codex
- นโยบายเครื่องมือยังคงมีผล; `allow: ["write"]` จะอนุญาต `apply_patch` โดยนัยด้วย
- config อยู่ภายใต้ `tools.exec.applyPatch`
- `tools.exec.applyPatch.enabled` มีค่าเริ่มต้นเป็น `true`; ตั้งเป็น `false` เพื่อปิดเครื่องมือนี้สำหรับโมเดล OpenAI
- `tools.exec.applyPatch.workspaceOnly` มีค่าเริ่มต้นเป็น `true` (จำกัดอยู่ใน workspace) ตั้งเป็น `false` เฉพาะเมื่อคุณตั้งใจจริงๆ ให้ `apply_patch` เขียน/ลบนอกไดเรกทอรี workspace

## ที่เกี่ยวข้อง

- [Exec Approvals](/th/tools/exec-approvals) — ด่านอนุมัติสำหรับคำสั่ง shell
- [Sandboxing](/th/gateway/sandboxing) — การรันคำสั่งในสภาพแวดล้อมแบบ sandbox
- [Background Process](/th/gateway/background-process) — exec ที่ทำงานยาวนานและเครื่องมือ process
- [Security](/th/gateway/security) — นโยบายเครื่องมือและการเข้าถึงแบบยกระดับ
