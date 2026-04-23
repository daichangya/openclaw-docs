---
read_when:
    - คุณต้องการกลไกสำรองที่เชื่อถือได้เมื่อผู้ให้บริการ API ล้มเหลว
    - คุณกำลังใช้งาน Codex CLI หรือ AI CLI ภายในเครื่องอื่นๆ และต้องการนำกลับมาใช้ซ้ำ
    - คุณต้องการทำความเข้าใจบริดจ์ local loopback ของ MCP สำหรับการเข้าถึงเครื่องมือของแบ็กเอนด์ CLI
summary: 'แบ็กเอนด์ CLI: กลไกสำรองเป็น AI CLI ภายในเครื่อง พร้อมบริดจ์เครื่องมือ MCP แบบเลือกได้'
title: แบ็กเอนด์ CLI
x-i18n:
    generated_at: "2026-04-23T14:56:01Z"
    model: gpt-5.4
    provider: openai
    source_hash: ff7458d18b8a5b716930579241177917fd3edffcf7f6e211c7d570cf76519316
    source_path: gateway/cli-backends.md
    workflow: 15
---

# แบ็กเอนด์ CLI (รันไทม์สำรอง)

OpenClaw สามารถเรียกใช้ **AI CLI ภายในเครื่อง** เป็น **กลไกสำรองแบบข้อความเท่านั้น** เมื่อผู้ให้บริการ API ใช้งานไม่ได้,
ถูกจำกัดอัตราการใช้งาน หรือมีปัญหาชั่วคราวได้ โดยแนวทางนี้ออกแบบมาอย่างระมัดระวังโดยตั้งใจ:

- **จะไม่ฉีดเครื่องมือ OpenClaw เข้าไปโดยตรง** แต่แบ็กเอนด์ที่ตั้งค่า `bundleMcp: true`
  สามารถรับเครื่องมือ Gateway ผ่านบริดจ์ MCP แบบ loopback ได้
- **สตรีม JSONL** สำหรับ CLI ที่รองรับ
- **รองรับเซสชัน** (เพื่อให้ข้อความต่อเนื่องยังคงสอดคล้องกัน)
- **สามารถส่งภาพผ่านต่อได้** หาก CLI รับพาธของไฟล์ภาพ

สิ่งนี้ถูกออกแบบให้เป็น **ตาข่ายนิรภัย** มากกว่าเส้นทางหลัก ใช้เมื่อคุณ
ต้องการคำตอบแบบข้อความที่ “ใช้งานได้เสมอ” โดยไม่ต้องพึ่งพา API ภายนอก

หากคุณต้องการรันไทม์แบบ harness เต็มรูปแบบพร้อมการควบคุมเซสชัน ACP, งานเบื้องหลัง,
การผูกเธรด/บทสนทนา และเซสชันการเขียนโค้ดภายนอกแบบถาวร ให้ใช้
[ACP Agents](/th/tools/acp-agents) แทน แบ็กเอนด์ CLI ไม่ใช่ ACP

## เริ่มต้นอย่างรวดเร็วสำหรับผู้เริ่มต้น

คุณสามารถใช้ Codex CLI ได้ **โดยไม่ต้องตั้งค่าใดๆ** (Plugin OpenAI ที่มาพร้อมระบบ
จะลงทะเบียนแบ็กเอนด์เริ่มต้นให้):

```bash
openclaw agent --message "hi" --model codex-cli/gpt-5.4
```

หาก Gateway ของคุณทำงานภายใต้ launchd/systemd และ PATH มีรายการน้อย ให้เพิ่มเพียง
พาธของคำสั่ง:

```json5
{
  agents: {
    defaults: {
      cliBackends: {
        "codex-cli": {
          command: "/opt/homebrew/bin/codex",
        },
      },
    },
  },
}
```

เพียงเท่านี้ ไม่ต้องใช้คีย์ และไม่ต้องมีการตั้งค่าการยืนยันตัวตนเพิ่มเติมนอกเหนือจากตัว CLI เอง

หากคุณใช้แบ็กเอนด์ CLI ที่มาพร้อมระบบเป็น **ผู้ให้บริการข้อความหลัก** บน
โฮสต์ Gateway ตอนนี้ OpenClaw จะโหลด Plugin ที่เป็นเจ้าของแบ็กเอนด์นั้นโดยอัตโนมัติเมื่อการตั้งค่าของคุณ
อ้างถึงแบ็กเอนด์นั้นอย่างชัดเจนใน model ref หรือภายใต้
`agents.defaults.cliBackends`

## การใช้งานเป็นกลไกสำรอง

เพิ่มแบ็กเอนด์ CLI ลงในรายการกลไกสำรองของคุณเพื่อให้มันทำงานเฉพาะเมื่อโมเดลหลักล้มเหลว:

```json5
{
  agents: {
    defaults: {
      model: {
        primary: "anthropic/claude-opus-4-6",
        fallbacks: ["codex-cli/gpt-5.4"],
      },
      models: {
        "anthropic/claude-opus-4-6": { alias: "Opus" },
        "codex-cli/gpt-5.4": {},
      },
    },
  },
}
```

หมายเหตุ:

- หากคุณใช้ `agents.defaults.models` (allowlist) คุณต้องรวมโมเดลของแบ็กเอนด์ CLI ของคุณไว้ที่นั่นด้วย
- หากผู้ให้บริการหลักล้มเหลว (การยืนยันตัวตน, การจำกัดอัตรา, หมดเวลา) OpenClaw จะ
  ลองใช้แบ็กเอนด์ CLI ถัดไป

## ภาพรวมการตั้งค่า

แบ็กเอนด์ CLI ทั้งหมดอยู่ภายใต้:

```
agents.defaults.cliBackends
```

แต่ละรายการจะใช้ **รหัส provider** เป็นคีย์ (เช่น `codex-cli`, `my-cli`)
รหัส provider จะกลายเป็นด้านซ้ายของ model ref ของคุณ:

```
<provider>/<model>
```

### ตัวอย่างการตั้งค่า

```json5
{
  agents: {
    defaults: {
      cliBackends: {
        "codex-cli": {
          command: "/opt/homebrew/bin/codex",
        },
        "my-cli": {
          command: "my-cli",
          args: ["--json"],
          output: "json",
          input: "arg",
          modelArg: "--model",
          modelAliases: {
            "claude-opus-4-6": "opus",
            "claude-sonnet-4-6": "sonnet",
          },
          sessionArg: "--session",
          sessionMode: "existing",
          sessionIdFields: ["session_id", "conversation_id"],
          systemPromptArg: "--system",
          // CLI แบบ Codex สามารถชี้ไปยังไฟล์ prompt ได้แทน:
          // systemPromptFileConfigArg: "-c",
          // systemPromptFileConfigKey: "model_instructions_file",
          systemPromptWhen: "first",
          imageArg: "--image",
          imageMode: "repeat",
          serialize: true,
        },
      },
    },
  },
}
```

## วิธีการทำงาน

1. **เลือกแบ็กเอนด์** ตามคำนำหน้า provider (`codex-cli/...`)
2. **สร้าง system prompt** โดยใช้ prompt + บริบทเวิร์กสเปซแบบเดียวกับ OpenClaw
3. **เรียกใช้ CLI** พร้อม session id (หากรองรับ) เพื่อให้ประวัติยังคงสอดคล้องกัน
   แบ็กเอนด์ `claude-cli` ที่มาพร้อมระบบจะคงโปรเซส Claude stdio หนึ่งตัวต่อ
   เซสชัน OpenClaw และส่งข้อความต่อเนื่องผ่าน stream-json stdin
4. **แยกวิเคราะห์เอาต์พุต** (JSON หรือข้อความล้วน) และส่งคืนข้อความสุดท้าย
5. **บันทึก session id** แยกตามแบ็กเอนด์ เพื่อให้ข้อความต่อเนื่องใช้เซสชัน CLI เดิมได้

<Note>
แบ็กเอนด์ Anthropic `claude-cli` ที่มาพร้อมระบบกลับมารองรับอีกครั้งแล้ว เจ้าหน้าที่ Anthropic
แจ้งกับเราว่าการใช้งาน Claude CLI แบบ OpenClaw ได้รับอนุญาตอีกครั้ง ดังนั้น OpenClaw จึงถือว่า
การใช้งาน `claude -p` ได้รับการรับรองสำหรับการผสานรวมนี้ เว้นแต่ Anthropic จะเผยแพร่
นโยบายใหม่
</Note>

แบ็กเอนด์ OpenAI `codex-cli` ที่มาพร้อมระบบจะส่ง system prompt ของ OpenClaw ผ่าน
การ override ค่า config `model_instructions_file` ของ Codex (`-c
model_instructions_file="..."`) Codex ไม่มีแฟลกแบบ Claude
`--append-system-prompt` ดังนั้น OpenClaw จึงเขียน prompt ที่ประกอบเสร็จแล้วลงใน
ไฟล์ชั่วคราวสำหรับแต่ละเซสชัน Codex CLI ใหม่

แบ็กเอนด์ Anthropic `claude-cli` ที่มาพร้อมระบบจะรับสแนปช็อต Skills ของ OpenClaw
ด้วยสองวิธี: แค็ตตาล็อก Skills ของ OpenClaw แบบย่อใน appended system prompt และ
Claude Code Plugin ชั่วคราวที่ส่งผ่าน `--plugin-dir` Plugin นี้มีเฉพาะ
Skills ที่มีสิทธิ์สำหรับ agent/เซสชันนั้นเท่านั้น ดังนั้นตัวแก้ Skills แบบเนทีฟของ Claude Code
จึงมองเห็นชุด Skills ที่ผ่านการกรองแบบเดียวกับที่ OpenClaw
จะประกาศใน prompt อยู่แล้ว การ override ค่าของ env/API key สำหรับ Skills ยังคงถูกใช้โดย OpenClaw กับ
environment ของ child process สำหรับการรันนั้น

ก่อนที่ OpenClaw จะใช้แบ็กเอนด์ `claude-cli` ที่มาพร้อมระบบได้ ตัว Claude Code เอง
ต้องล็อกอินไว้บนโฮสต์เดียวกันก่อนแล้ว:

```bash
claude auth login
claude auth status --text
openclaw models auth login --provider anthropic --method cli --set-default
```

ใช้ `agents.defaults.cliBackends.claude-cli.command` เฉพาะเมื่อไบนารี `claude`
ยังไม่ได้อยู่ใน `PATH`

## เซสชัน

- หาก CLI รองรับเซสชัน ให้ตั้งค่า `sessionArg` (เช่น `--session-id`) หรือ
  `sessionArgs` (placeholder `{sessionId}`) เมื่อต้องแทรก ID
  ลงในหลายแฟลก
- หาก CLI ใช้ **subcommand สำหรับ resume** พร้อมแฟลกที่ต่างออกไป ให้ตั้งค่า
  `resumeArgs` (แทนที่ `args` เมื่อ resume) และอาจตั้ง `resumeOutput`
  เพิ่มเติมด้วย (สำหรับการ resume ที่ไม่ใช่ JSON)
- `sessionMode`:
  - `always`: ส่ง session id เสมอ (สร้าง UUID ใหม่หากยังไม่มีการจัดเก็บ)
  - `existing`: ส่ง session id เฉพาะเมื่อเคยจัดเก็บไว้ก่อนแล้ว
  - `none`: ไม่ส่ง session id เลย
- `claude-cli` มีค่าเริ่มต้นเป็น `liveSession: "claude-stdio"`, `output: "jsonl"`,
  และ `input: "stdin"` ดังนั้นข้อความต่อเนื่องจะใช้โปรเซส Claude แบบ live เดิมซ้ำขณะ
  ที่ยังทำงานอยู่ โดยตอนนี้ warm stdio เป็นค่าเริ่มต้นแล้ว รวมถึงสำหรับการตั้งค่าแบบกำหนดเอง
  ที่ไม่ได้ระบุฟิลด์ transport หาก Gateway รีสตาร์ตหรือโปรเซสที่ว่างอยู่สิ้นสุดลง
  OpenClaw จะ resume จาก Claude session id ที่เก็บไว้ โดย session id ที่เก็บไว้จะถูกตรวจสอบ
  เทียบกับ project transcript ที่อ่านได้และมีอยู่จริงก่อน resume ดังนั้นการผูกที่เป็น phantom
  จะถูกล้างด้วย `reason=transcript-missing` แทนที่จะเริ่มเซสชัน Claude CLI ใหม่
  ภายใต้ `--resume` แบบเงียบๆ
- เซสชัน CLI ที่จัดเก็บไว้เป็นความต่อเนื่องที่ provider เป็นเจ้าของ การรีเซ็ตเซสชันรายวันโดยปริยาย
  จะไม่ตัดสิ่งนี้; แต่ `/reset` และนโยบาย `session.reset` แบบชัดเจนจะยังมีผล

หมายเหตุเกี่ยวกับการ serialize:

- `serialize: true` ช่วยให้การรันในเลนเดียวกันเรียงลำดับ
- CLI ส่วนใหญ่จะ serialize บนเลนของ provider เดียว
- OpenClaw จะยกเลิกการใช้เซสชัน CLI ที่จัดเก็บไว้ซ้ำเมื่อข้อมูลประจำตัวการยืนยันตัวตนที่เลือกเปลี่ยนไป
  รวมถึงเมื่อ auth profile id, static API key, static token หรือข้อมูลประจำตัวบัญชี OAuth
  เปลี่ยนไปในกรณีที่ CLI เปิดเผยค่าเหล่านั้น การหมุนเวียน OAuth access token และ refresh token
  จะไม่ตัดเซสชัน CLI ที่จัดเก็บไว้ หาก CLI ไม่เปิดเผย OAuth account id ที่คงที่
  OpenClaw จะปล่อยให้ CLI นั้นบังคับใช้สิทธิ์การ resume เอง

## รูปภาพ (ส่งผ่านต่อ)

หาก CLI ของคุณรับพาธของภาพได้ ให้ตั้งค่า `imageArg`:

```json5
imageArg: "--image",
imageMode: "repeat"
```

OpenClaw จะเขียนภาพ base64 ลงเป็นไฟล์ชั่วคราว หากตั้งค่า `imageArg` ไว้
พาธเหล่านั้นจะถูกส่งเป็นอาร์กิวเมนต์ของ CLI หากไม่มี `imageArg` OpenClaw จะต่อท้าย
พาธไฟล์ลงใน prompt (path injection) ซึ่งเพียงพอสำหรับ CLI ที่โหลด
ไฟล์ภายในเครื่องจากพาธข้อความล้วนโดยอัตโนมัติ

## อินพุต / เอาต์พุต

- `output: "json"` (ค่าเริ่มต้น) จะพยายามแยกวิเคราะห์ JSON และดึงข้อความ + session id
- สำหรับเอาต์พุต JSON ของ Gemini CLI, OpenClaw จะอ่านข้อความตอบกลับจาก `response` และ
  usage จาก `stats` เมื่อ `usage` ไม่มีหรือว่างเปล่า
- `output: "jsonl"` จะวิเคราะห์สตรีม JSONL (เช่น Codex CLI `--json`) และดึงข้อความสุดท้ายของ agent พร้อมตัวระบุเซสชัน
  เมื่อมีอยู่
- `output: "text"` จะถือว่า stdout เป็นคำตอบสุดท้าย

โหมดอินพุต:

- `input: "arg"` (ค่าเริ่มต้น) จะส่ง prompt เป็นอาร์กิวเมนต์สุดท้ายของ CLI
- `input: "stdin"` จะส่ง prompt ผ่าน stdin
- หาก prompt ยาวมากและตั้งค่า `maxPromptArgChars` ไว้ จะใช้ stdin

## ค่าเริ่มต้น (เป็นเจ้าของโดย Plugin)

Plugin OpenAI ที่มาพร้อมระบบจะลงทะเบียนค่าเริ่มต้นสำหรับ `codex-cli` ด้วย:

- `command: "codex"`
- `args: ["exec","--json","--color","never","--sandbox","workspace-write","--skip-git-repo-check"]`
- `resumeArgs: ["exec","resume","{sessionId}","-c","sandbox_mode=\"workspace-write\"","--skip-git-repo-check"]`
- `output: "jsonl"`
- `resumeOutput: "text"`
- `modelArg: "--model"`
- `imageArg: "--image"`
- `sessionMode: "existing"`

Plugin Google ที่มาพร้อมระบบจะลงทะเบียนค่าเริ่มต้นสำหรับ `google-gemini-cli` ด้วย:

- `command: "gemini"`
- `args: ["--output-format", "json", "--prompt", "{prompt}"]`
- `resumeArgs: ["--resume", "{sessionId}", "--output-format", "json", "--prompt", "{prompt}"]`
- `imageArg: "@"`
- `imagePathScope: "workspace"`
- `modelArg: "--model"`
- `sessionMode: "existing"`
- `sessionIdFields: ["session_id", "sessionId"]`

ข้อกำหนดเบื้องต้น: ต้องติดตั้ง Gemini CLI ภายในเครื่องและพร้อมใช้งานเป็น
`gemini` ใน `PATH` (`brew install gemini-cli` หรือ
`npm install -g @google/gemini-cli`)

หมายเหตุเกี่ยวกับ JSON ของ Gemini CLI:

- ข้อความตอบกลับจะถูกอ่านจากฟิลด์ JSON `response`
- Usage จะ fallback ไปใช้ `stats` เมื่อ `usage` ไม่มีหรือว่างเปล่า
- `stats.cached` จะถูก normalize เป็น OpenClaw `cacheRead`
- หาก `stats.input` ไม่มี OpenClaw จะคำนวณโทเค็นอินพุตจาก
  `stats.input_tokens - stats.cached`

override เฉพาะเมื่อจำเป็นเท่านั้น (ที่พบบ่อย: พาธ `command` แบบสัมบูรณ์)

## ค่าเริ่มต้นที่เป็นเจ้าของโดย Plugin

ค่าเริ่มต้นของแบ็กเอนด์ CLI ตอนนี้เป็นส่วนหนึ่งของพื้นผิว Plugin แล้ว:

- Plugins ลงทะเบียนด้วย `api.registerCliBackend(...)`
- `id` ของแบ็กเอนด์จะกลายเป็นคำนำหน้า provider ใน model refs
- การตั้งค่าของผู้ใช้ใน `agents.defaults.cliBackends.<id>` ยังคง override ค่าเริ่มต้นของ Plugin ได้
- การล้างการตั้งค่าเฉพาะแบ็กเอนด์ยังคงเป็นเจ้าของโดย Plugin ผ่าน hook
  `normalizeConfig` แบบเลือกได้

Plugin ที่ต้องการ shim ความเข้ากันได้ของ prompt/ข้อความขนาดเล็กสามารถประกาศ
text transform แบบสองทิศทางได้โดยไม่ต้องแทนที่ provider หรือแบ็กเอนด์ CLI:

```typescript
api.registerTextTransforms({
  input: [
    { from: /red basket/g, to: "blue basket" },
    { from: /paper ticket/g, to: "digital ticket" },
    { from: /left shelf/g, to: "right shelf" },
  ],
  output: [
    { from: /blue basket/g, to: "red basket" },
    { from: /digital ticket/g, to: "paper ticket" },
    { from: /right shelf/g, to: "left shelf" },
  ],
});
```

`input` จะเขียน system prompt และ user prompt ที่ส่งไปยัง CLI ใหม่ `output`
จะเขียน assistant deltas ที่สตรีมออกมาและข้อความสุดท้ายที่แยกวิเคราะห์แล้วใหม่ ก่อนที่ OpenClaw จะจัดการ
control markers ของตัวเองและการส่งผ่านช่องทาง

สำหรับ CLI ที่ปล่อย JSONL ที่เข้ากันได้กับ Claude Code stream-json ให้ตั้งค่า
`jsonlDialect: "claude-stream-json"` ใน config ของแบ็กเอนด์นั้น

## Bundle MCP overlays

แบ็กเอนด์ CLI จะ **ไม่ได้รับ** การเรียกใช้เครื่องมือ OpenClaw โดยตรง แต่แบ็กเอนด์สามารถ
เลือกใช้ MCP config overlay ที่สร้างขึ้นได้ด้วย `bundleMcp: true`

พฤติกรรมที่มาพร้อมระบบในปัจจุบัน:

- `claude-cli`: ไฟล์ config MCP แบบ strict ที่สร้างขึ้น
- `codex-cli`: การ override config แบบ inline สำหรับ `mcp_servers`
- `google-gemini-cli`: ไฟล์การตั้งค่าระบบ Gemini ที่สร้างขึ้น

เมื่อเปิดใช้ bundle MCP, OpenClaw จะ:

- สร้างเซิร์ฟเวอร์ MCP HTTP แบบ loopback ที่เปิดเผยเครื่องมือ Gateway ให้กับโปรเซส CLI
- ยืนยันตัวตนของบริดจ์ด้วยโทเค็นต่อเซสชัน (`OPENCLAW_MCP_TOKEN`)
- จำกัดขอบเขตการเข้าถึงเครื่องมือไว้ที่บริบทของเซสชัน, บัญชี และช่องทางปัจจุบัน
- โหลดเซิร์ฟเวอร์ bundle-MCP ที่เปิดใช้งานสำหรับเวิร์กสเปซปัจจุบัน
- ผสานรวมเข้ากับรูปแบบ config/settings MCP ของแบ็กเอนด์ที่มีอยู่
- เขียน config การเปิดใช้งานใหม่โดยใช้โหมดการผสานรวมที่เป็นเจ้าของแบ็กเอนด์จาก extension เจ้าของนั้น

หากไม่มีการเปิดใช้เซิร์ฟเวอร์ MCP ใดๆ OpenClaw ก็จะยังคง inject config แบบ strict เมื่อ
แบ็กเอนด์เลือกใช้ bundle MCP เพื่อให้การรันเบื้องหลังยังคงถูกแยกออกจากกัน

## ข้อจำกัด

- **ไม่มีการเรียกใช้เครื่องมือ OpenClaw โดยตรง** OpenClaw จะไม่ inject การเรียกใช้เครื่องมือเข้าไปใน
  โปรโตคอลของแบ็กเอนด์ CLI แบ็กเอนด์จะมองเห็นเครื่องมือ Gateway ได้ก็ต่อเมื่อเลือกใช้
  `bundleMcp: true`
- **การสตรีมขึ้นอยู่กับแบ็กเอนด์** บางแบ็กเอนด์สตรีม JSONL; บางแบ็กเอนด์บัฟเฟอร์
  จนกว่าจะสิ้นสุดการทำงาน
- **Structured outputs** ขึ้นอยู่กับรูปแบบ JSON ของ CLI
- **เซสชัน Codex CLI** resume ผ่านเอาต์พุตข้อความ (ไม่มี JSONL) ซึ่งมีโครงสร้างน้อยกว่า
  การรัน `--json` ครั้งแรก อย่างไรก็ตาม เซสชัน OpenClaw ยังคงทำงานได้ตามปกติ

## การแก้ปัญหา

- **ไม่พบ CLI**: ตั้งค่า `command` ให้เป็นพาธแบบเต็ม
- **ชื่อโมเดลไม่ถูกต้อง**: ใช้ `modelAliases` เพื่อแมป `provider/model` → โมเดลของ CLI
- **ไม่มีความต่อเนื่องของเซสชัน**: ตรวจสอบให้แน่ใจว่าตั้งค่า `sessionArg` แล้ว และ `sessionMode` ไม่ใช่
  `none` (ขณะนี้ Codex CLI ยังไม่สามารถ resume ด้วยเอาต์พุต JSON ได้)
- **ระบบไม่สนใจรูปภาพ**: ตั้งค่า `imageArg` (และตรวจสอบว่า CLI รองรับพาธไฟล์)
