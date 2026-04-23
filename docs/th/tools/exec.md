---
read_when:
    - การใช้งานหรือแก้ไขเครื่องมือ exec
    - การดีบักพฤติกรรมของ stdin หรือ TTY
summary: การใช้งานเครื่องมือ exec, โหมด stdin และการรองรับ TTY
title: เครื่องมือ Exec
x-i18n:
    generated_at: "2026-04-23T06:00:33Z"
    model: gpt-5.4
    provider: openai
    source_hash: 5018468f31bb76fc142ddef7002c7bbc617406de7ce912670d1b9edef6a9a042
    source_path: tools/exec.md
    workflow: 15
---

# เครื่องมือ Exec

รันคำสั่ง shell ภายใน workspace รองรับทั้งการรันแบบ foreground และ background ผ่าน `process`
หาก `process` ไม่ได้รับอนุญาต `exec` จะรันแบบ synchronous และละเลย `yieldMs`/`background`
background sessions จะถูกกำหนดขอบเขตตามเอเจนต์; `process` จะเห็นเฉพาะ sessions ของเอเจนต์เดียวกัน

## พารามิเตอร์

- `command` (จำเป็น)
- `workdir` (ค่าเริ่มต้นคือ cwd)
- `env` (override แบบ key/value)
- `yieldMs` (ค่าเริ่มต้น 10000): เปลี่ยนเป็น background อัตโนมัติหลังดีเลย์
- `background` (bool): เปลี่ยนเป็น background ทันที
- `timeout` (วินาที, ค่าเริ่มต้น 1800): kill เมื่อหมดเวลา
- `pty` (bool): รันใน pseudo-terminal เมื่อมีให้ใช้ (CLI ที่ต้องใช้ TTY, coding agents, terminal UIs)
- `host` (`auto | sandbox | gateway | node`): ที่ที่จะรัน
- `security` (`deny | allowlist | full`): โหมดการบังคับใช้สำหรับ `gateway`/`node`
- `ask` (`off | on-miss | always`): approval prompts สำหรับ `gateway`/`node`
- `node` (string): node id/name สำหรับ `host=node`
- `elevated` (bool): ขอใช้โหมดยกระดับ (ออกจาก sandbox ไปยังเส้นทางโฮสต์ที่กำหนดค่าไว้); `security=full` จะถูกบังคับใช้ก็ต่อเมื่อ elevated resolve ไปเป็น `full`

หมายเหตุ:

- `host` มีค่าเริ่มต้นเป็น `auto`: ใช้ sandbox เมื่อ sandbox runtime ทำงานอยู่สำหรับเซสชันนั้น มิฉะนั้นใช้ gateway
- `auto` เป็นกลยุทธ์การจัดเส้นทางค่าเริ่มต้น ไม่ใช่ wildcard การเรียกต่อครั้งแบบ `host=node` อนุญาตจาก `auto`; ส่วน `host=gateway` แบบต่อครั้งจะอนุญาตเฉพาะเมื่อไม่มี sandbox runtime ทำงานอยู่
- หากไม่มีการตั้งค่าเพิ่มเติม `host=auto` ก็ยัง “ใช้งานได้ทันที”: ถ้าไม่มี sandbox ระบบจะ resolve ไปเป็น `gateway`; หากมี sandbox ที่กำลังทำงานอยู่ก็จะอยู่ใน sandbox ต่อไป
- `elevated` จะออกจาก sandbox ไปยังเส้นทางโฮสต์ที่กำหนดค่าไว้: ค่าเริ่มต้นคือ `gateway` หรือ `node` เมื่อ `tools.exec.host=node` (หรือค่าเริ่มต้นของเซสชันเป็น `host=node`) ใช้ได้เฉพาะเมื่อเปิดสิทธิ์ elevated access สำหรับเซสชัน/ผู้ให้บริการปัจจุบัน
- approvals ของ `gateway`/`node` ถูกควบคุมโดย `~/.openclaw/exec-approvals.json`
- `node` ต้องใช้ paired node (companion app หรือ headless node host)
- หากมีหลาย nodes ให้ตั้ง `exec.node` หรือ `tools.exec.node` เพื่อเลือกตัวใดตัวหนึ่ง
- `exec host=node` เป็นเส้นทางเดียวสำหรับการรัน shell บน nodes; ได้ถอด wrapper แบบเดิม `nodes.run` ออกแล้ว
- บนโฮสต์ที่ไม่ใช่ Windows, exec จะใช้ `SHELL` เมื่อมีการตั้งค่า; หาก `SHELL` เป็น `fish` จะเลือก `bash` (หรือ `sh`)
  จาก `PATH` ก่อนเพื่อหลีกเลี่ยงสคริปต์ที่ไม่เข้ากับ fish จากนั้นจึง fallback ไปใช้ `SHELL` หากไม่พบทั้งคู่
- บนโฮสต์ Windows, exec จะเลือก PowerShell 7 (`pwsh`) ที่ตรวจพบได้ก่อน (Program Files, ProgramW6432 แล้วจึง PATH)
  จากนั้นจึง fallback ไปยัง Windows PowerShell 5.1
- การรันบนโฮสต์ (`gateway`/`node`) จะปฏิเสธ `env.PATH` และ loader overrides (`LD_*`/`DYLD_*`) เพื่อ
  ป้องกัน binary hijacking หรือ injected code
- OpenClaw จะตั้ง `OPENCLAW_SHELL=exec` ในสภาพแวดล้อมของคำสั่งที่ถูก spawn (รวมถึง PTY และ sandbox execution) เพื่อให้กฎ shell/profile ตรวจจับบริบทของ exec-tool ได้
- สำคัญ: sandboxing **ปิดอยู่ตามค่าเริ่มต้น** หาก sandboxing ปิดอยู่ `host=auto`
  แบบ implicit จะ resolve ไปเป็น `gateway` ส่วน `host=sandbox` แบบ explicit จะยังคง fail closed แทนที่จะรันบนโฮสต์ gateway แบบเงียบๆ เปิด sandboxing หรือใช้ `host=gateway` ร่วมกับ approvals
- การตรวจ preflight ของสคริปต์ (สำหรับข้อผิดพลาด syntax ของ Python/Node shell ที่พบบ่อย) จะตรวจเฉพาะไฟล์ภายใน
  ขอบเขต `workdir` ที่มีผลจริง หากพาธของสคริปต์ resolve ออกนอก `workdir` จะข้าม preflight
  สำหรับไฟล์นั้น
- สำหรับงานระยะยาวที่เริ่มตอนนี้ ให้เริ่มเพียงครั้งเดียวและอาศัย automatic
  completion wake เมื่อเปิดใช้งานไว้และคำสั่งมีเอาต์พุตหรือเกิดความล้มเหลว
  ใช้ `process` สำหรับ logs, status, input หรือการแทรกแซง; อย่าจำลอง
  scheduling ด้วย sleep loops, timeout loops หรือ repeated polling
- สำหรับงานที่ควรเกิดภายหลังหรือตามกำหนดเวลา ให้ใช้ cron แทน
  รูปแบบ sleep/delay ของ `exec`

## การกำหนดค่า

- `tools.exec.notifyOnExit` (ค่าเริ่มต้น: true): เมื่อเป็น true backgrounded exec sessions จะเข้าคิว system event และร้องขอ Heartbeat เมื่อจบ
- `tools.exec.approvalRunningNoticeMs` (ค่าเริ่มต้น: 10000): ส่ง notice “running” หนึ่งครั้งเมื่อ approval-gated exec ใช้เวลานานกว่านี้ (ตั้งเป็น 0 เพื่อปิด)
- `tools.exec.host` (ค่าเริ่มต้น: `auto`; resolve เป็น `sandbox` เมื่อ sandbox runtime ทำงานอยู่ และเป็น `gateway` เมื่อไม่ทำงาน)
- `tools.exec.security` (ค่าเริ่มต้น: `deny` สำหรับ sandbox, `full` สำหรับ gateway + node เมื่อไม่ตั้งค่า)
- `tools.exec.ask` (ค่าเริ่มต้น: `off`)
- host exec แบบไม่ต้อง approval เป็นค่าเริ่มต้นสำหรับ gateway + node หากคุณต้องการพฤติกรรม approvals/allowlist ให้ทำให้ทั้ง `tools.exec.*` และนโยบายของโฮสต์ใน `~/.openclaw/exec-approvals.json` เข้มขึ้น; ดู [Exec approvals](/th/tools/exec-approvals#no-approval-yolo-mode)
- YOLO มาจากค่าเริ่มต้นของ host-policy (`security=full`, `ask=off`) ไม่ได้มาจาก `host=auto` หากต้องการบังคับการ route ไปที่ gateway หรือ node ให้ตั้ง `tools.exec.host` หรือใช้ `/exec host=...`
- ในโหมด `security=full` ร่วมกับ `ask=off`, host exec จะทำตามนโยบายที่กำหนดไว้โดยตรง; จะไม่มีชั้น prefilter สำหรับ command-obfuscation หรือชั้นปฏิเสธ script-preflight เพิ่มเติม
- `tools.exec.node` (ค่าเริ่มต้น: ไม่ได้ตั้งค่า)
- `tools.exec.strictInlineEval` (ค่าเริ่มต้น: false): เมื่อเป็น true รูปแบบ inline interpreter eval เช่น `python -c`, `node -e`, `ruby -e`, `perl -e`, `php -r`, `lua -e` และ `osascript -e` จะต้องได้รับการอนุมัติอย่างชัดเจนทุกครั้ง `allow-always` ยังคงบันทึกการเรียก interpreter/script ที่ไม่เป็นอันตรายได้ แต่รูปแบบ inline-eval จะยังถามทุกครั้ง
- `tools.exec.pathPrepend`: รายการไดเรกทอรีที่จะ prepend เข้า `PATH` สำหรับการรัน exec (เฉพาะ gateway + sandbox)
- `tools.exec.safeBins`: ไบนารีที่ปลอดภัยแบบ stdin-only ซึ่งสามารถรันได้โดยไม่ต้องมี allowlist entries แบบ explicit สำหรับรายละเอียดพฤติกรรม ดู [Safe bins](/th/tools/exec-approvals#safe-bins-stdin-only)
- `tools.exec.safeBinTrustedDirs`: ไดเรกทอรีเพิ่มเติมแบบ explicit ที่เชื่อถือได้สำหรับการตรวจสอบพาธ executable ของ `safeBins` รายการใน `PATH` จะไม่ถูกเชื่อถือโดยอัตโนมัติ ค่าเริ่มต้นที่มีในระบบคือ `/bin` และ `/usr/bin`
- `tools.exec.safeBinProfiles`: นโยบาย argv แบบกำหนดเองต่อ safe bin (`minPositional`, `maxPositional`, `allowedValueFlags`, `deniedFlags`)

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

- `host=gateway`: จะ merge `PATH` ของ login-shell ของคุณเข้ากับ exec environment `env.PATH` overrides จะ
  ถูกปฏิเสธสำหรับการรันบนโฮสต์ ส่วน daemon เองยังคงรันด้วย `PATH` ขั้นต่ำ:
  - macOS: `/opt/homebrew/bin`, `/usr/local/bin`, `/usr/bin`, `/bin`
  - Linux: `/usr/local/bin`, `/usr/bin`, `/bin`
- `host=sandbox`: รัน `sh -lc` (login shell) ภายใน container ดังนั้น `/etc/profile` อาจรีเซ็ต `PATH`
  OpenClaw จะ prepend `env.PATH` หลังจาก profile sourcing ผ่าน internal env var (ไม่มี shell interpolation);
  `tools.exec.pathPrepend` ก็มีผลที่นี่เช่นกัน
- `host=node`: จะส่งเฉพาะ env overrides ที่ไม่ถูกบล็อกไปยัง node เท่านั้น `env.PATH` overrides จะ
  ถูกปฏิเสธสำหรับการรันบนโฮสต์และจะถูกละเลยโดย node hosts หากต้องการ PATH entries เพิ่มบน node
  ให้กำหนดค่าสภาพแวดล้อมของ node host service (systemd/launchd) หรือติดตั้งเครื่องมือในตำแหน่งมาตรฐาน

การ bind node แบบรายเอเจนต์ (ใช้ดัชนี agent list ใน config):

```bash
openclaw config get agents.list
openclaw config set agents.list[0].tools.exec.node "node-id-or-name"
```

Control UI: แท็บ Nodes มีแผง “Exec node binding” ขนาดเล็กสำหรับการตั้งค่าเดียวกัน

## Session overrides (`/exec`)

ใช้ `/exec` เพื่อตั้งค่าเริ่มต้นแบบ **ต่อเซสชัน** สำหรับ `host`, `security`, `ask` และ `node`
ส่ง `/exec` โดยไม่ใส่อาร์กิวเมนต์เพื่อแสดงค่าปัจจุบัน

ตัวอย่าง:

```
/exec host=auto security=allowlist ask=on-miss node=mac-1
```

## โมเดลการอนุญาต

`/exec` จะถูกนำมาใช้เฉพาะกับ **ผู้ส่งที่ได้รับอนุญาต** เท่านั้น (channel allowlists/pairing ร่วมกับ `commands.useAccessGroups`)
มันจะอัปเดต **เฉพาะสถานะของเซสชัน** และไม่เขียน config หากต้องการปิด exec แบบเด็ดขาด ให้ deny ผ่าน tool
policy (`tools.deny: ["exec"]` หรือแบบรายเอเจนต์) host approvals ยังคงมีผล เว้นแต่คุณจะตั้ง `security=full` และ `ask=off` อย่างชัดเจน

## Exec approvals (companion app / node host)

เอเจนต์ที่ถูก sandbox สามารถกำหนดให้ต้องได้รับการอนุมัติรายคำขอก่อนที่ `exec` จะรันบน gateway หรือ node host ได้
ดู [Exec approvals](/th/tools/exec-approvals) สำหรับนโยบาย, allowlist และโฟลว์ UI

เมื่อจำเป็นต้องมี approvals เครื่องมือ exec จะคืนค่าทันทีพร้อม
`status: "approval-pending"` และ approval id เมื่ออนุมัติแล้ว (หรือถูกปฏิเสธ / หมดเวลา)
Gateway จะส่ง system events (`Exec finished` / `Exec denied`) หากคำสั่งยังคง
ทำงานอยู่หลัง `tools.exec.approvalRunningNoticeMs`, จะส่ง notice `Exec running` หนึ่งครั้ง
บน channels ที่มี approval cards/buttons แบบเนทีฟ เอเจนต์ควรพึ่ง UI
แบบเนทีฟนั้นก่อน และใส่คำสั่ง `/approve` แบบ manual เฉพาะเมื่อผลลัพธ์ของเครื่องมือ
ระบุอย่างชัดเจนว่า chat approvals ใช้งานไม่ได้ หรือการอนุมัติด้วยตนเองเป็น
เส้นทางเดียว

## Allowlist + safe bins

การบังคับใช้ allowlist แบบ manual จะจับคู่เฉพาะ **resolved binary paths เท่านั้น** (ไม่รองรับ basename matches) เมื่อ
`security=allowlist`, shell commands จะถูกอนุญาตอัตโนมัติเฉพาะเมื่อทุก pipeline segment
อยู่ใน allowlist หรือเป็น safe bin chaining (`;`, `&&`, `||`) และ redirections จะถูกปฏิเสธใน
โหมด allowlist เว้นแต่ทุก top-level segment จะผ่าน allowlist (รวมถึง safe bins)
ยังไม่รองรับ redirections
ความเชื่อถือแบบ durable `allow-always` ก็ไม่ข้ามกฎนี้: chained command จะยังต้องให้ทุก
top-level segment ตรงเงื่อนไข

`autoAllowSkills` เป็นเส้นทางความสะดวกแยกต่างหากใน exec approvals มันไม่เหมือนกับ
รายการ manual path allowlist สำหรับความเชื่อถือแบบ explicit ที่เข้มงวด ให้ปิด `autoAllowSkills`

ใช้ตัวควบคุมทั้งสองสำหรับงานคนละแบบ:

- `tools.exec.safeBins`: stream filters ขนาดเล็กแบบ stdin-only
- `tools.exec.safeBinTrustedDirs`: ไดเรกทอรีเพิ่มเติมที่เชื่อถือได้อย่างชัดเจนสำหรับพาธ executable ของ safe-bin
- `tools.exec.safeBinProfiles`: นโยบาย argv แบบ explicit สำหรับ safe bins แบบกำหนดเอง
- allowlist: ความเชื่อถือแบบ explicit สำหรับ executable paths

อย่าถือว่า `safeBins` เป็น generic allowlist และอย่าเพิ่ม interpreter/runtime binaries (เช่น `python3`, `node`, `ruby`, `bash`) หากคุณต้องการสิ่งเหล่านั้น ให้ใช้ allowlist entries แบบ explicit และคง approval prompts ไว้
`openclaw security audit` จะเตือนเมื่อมี entries ของ interpreter/runtime ใน `safeBins` ที่ไม่มี profiles แบบ explicit และ `openclaw doctor --fix` สามารถสร้างโครงของ `safeBinProfiles` แบบกำหนดเองที่ขาดหายไปได้
`openclaw security audit` และ `openclaw doctor` จะเตือนด้วยเมื่อคุณเพิ่ม bins ที่มีพฤติกรรมกว้าง เช่น `jq` กลับเข้า `safeBins` อย่างชัดเจน
หากคุณ allowlist interpreters อย่างชัดเจน ให้เปิด `tools.exec.strictInlineEval` เพื่อให้รูปแบบ inline code-eval ยังคงต้องขอการอนุมัติใหม่ทุกครั้ง

สำหรับรายละเอียดนโยบายแบบเต็มและตัวอย่าง ดู [Exec approvals](/th/tools/exec-approvals#safe-bins-stdin-only) และ [Safe bins versus allowlist](/th/tools/exec-approvals#safe-bins-versus-allowlist)

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

polling มีไว้สำหรับการตรวจสอบสถานะแบบตามต้องการ ไม่ใช่ลูปรอ หากเปิด automatic completion wake
ไว้ คำสั่งสามารถปลุกเซสชันได้เมื่อมีเอาต์พุตหรือเกิดความล้มเหลว

ส่งคีย์ (แบบ tmux):

```json
{"tool":"process","action":"send-keys","sessionId":"<id>","keys":["Enter"]}
{"tool":"process","action":"send-keys","sessionId":"<id>","keys":["C-c"]}
{"tool":"process","action":"send-keys","sessionId":"<id>","keys":["Up","Up","Enter"]}
```

Submit (ส่งเฉพาะ CR):

```json
{ "tool": "process", "action": "submit", "sessionId": "<id>" }
```

Paste (มีวงเล็บกำกับตามค่าเริ่มต้น):

```json
{ "tool": "process", "action": "paste", "sessionId": "<id>", "text": "line1\nline2\n" }
```

## apply_patch

`apply_patch` เป็น subtool ของ `exec` สำหรับการแก้ไขหลายไฟล์แบบมีโครงสร้าง
โดยค่าเริ่มต้นจะเปิดใช้สำหรับโมเดล OpenAI และ OpenAI Codex ใช้ config เฉพาะ
เมื่อต้องการปิดใช้งานหรือจำกัดให้ใช้กับบางโมเดล:

```json5
{
  tools: {
    exec: {
      applyPatch: { workspaceOnly: true, allowModels: ["gpt-5.4"] },
    },
  },
}
```

หมายเหตุ:

- ใช้งานได้เฉพาะกับโมเดล OpenAI/OpenAI Codex เท่านั้น
- tool policy ยังคงมีผล; `allow: ["write"]` จะอนุญาต `apply_patch` โดยนัยด้วย
- config อยู่ภายใต้ `tools.exec.applyPatch`
- `tools.exec.applyPatch.enabled` มีค่าเริ่มต้นเป็น `true`; ตั้งเป็น `false` เพื่อปิดเครื่องมือนี้สำหรับโมเดล OpenAI
- `tools.exec.applyPatch.workspaceOnly` มีค่าเริ่มต้นเป็น `true` (จำกัดอยู่ภายใน workspace) ตั้งเป็น `false` เฉพาะเมื่อคุณตั้งใจให้ `apply_patch` เขียน/ลบนอกไดเรกทอรี workspace

## ที่เกี่ยวข้อง

- [Exec Approvals](/th/tools/exec-approvals) — approval gates สำหรับคำสั่ง shell
- [Sandboxing](/th/gateway/sandboxing) — การรันคำสั่งในสภาพแวดล้อมแบบ sandbox
- [Background Process](/th/gateway/background-process) — exec ระยะยาวและเครื่องมือ process
- [Security](/th/gateway/security) — tool policy และ elevated access
