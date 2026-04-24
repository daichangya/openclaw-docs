---
read_when:
    - คุณต้องการ fallback ที่เชื่อถือได้เมื่อ API providers ล้มเหลว
    - คุณกำลังใช้งาน Codex CLI หรือ AI CLI อื่นๆ ในเครื่องและต้องการนำมาใช้ซ้ำ
    - คุณต้องการเข้าใจ local loopback bridge ของ MCP สำหรับการเข้าถึงเครื่องมือจากแบ็กเอนด์ CLI
summary: 'แบ็กเอนด์ CLI: fallback ไปใช้ AI CLI ในเครื่อง พร้อมสะพานเครื่องมือ MCP แบบไม่บังคับ'
title: แบ็กเอนด์ CLI
x-i18n:
    generated_at: "2026-04-24T09:08:51Z"
    model: gpt-5.4
    provider: openai
    source_hash: 8f36ea909118e173d397a21bb4ee2c33be0965be4bf57649efef038caeead3ab
    source_path: gateway/cli-backends.md
    workflow: 15
---

# แบ็กเอนด์ CLI (รันไทม์ fallback)

OpenClaw สามารถรัน **AI CLI ในเครื่อง** เป็น **fallback แบบข้อความล้วน** เมื่อ API providers ล่ม
ติด rate limit หรือมีพฤติกรรมผิดปกติชั่วคราว แนวทางนี้ตั้งใจให้ระมัดระวังเป็นพิเศษ:

- **เครื่องมือของ OpenClaw จะไม่ถูก inject โดยตรง** แต่แบ็กเอนด์ที่มี `bundleMcp: true`
  สามารถรับเครื่องมือของ gateway ผ่าน MCP bridge แบบ local loopback ได้
- **รองรับ JSONL streaming** สำหรับ CLI ที่รองรับ
- **รองรับ sessions** (เพื่อให้รอบสนทนาถัดไปยังคงต่อเนื่อง)
- **สามารถส่ง images ผ่านได้** หาก CLI รับพาธของรูปภาพ

สิ่งนี้ออกแบบมาให้เป็น **ตาข่ายนิรภัย** มากกว่าเส้นทางหลัก ใช้เมื่อคุณ
ต้องการคำตอบข้อความแบบ “ใช้งานได้เสมอ” โดยไม่ต้องพึ่งพา API ภายนอก

หากคุณต้องการรันไทม์ harness แบบเต็มที่มีการควบคุมเซสชันแบบ ACP, งานเบื้องหลัง,
การผูกกับ thread/การสนทนา และเซสชันการเขียนโค้ดภายนอกแบบถาวร ให้ใช้
[ACP Agents](/th/tools/acp-agents) แทน แบ็กเอนด์ CLI ไม่ใช่ ACP

## เริ่มต้นแบบเป็นมิตรกับผู้เริ่มต้น

คุณสามารถใช้ Codex CLI ได้ **โดยไม่ต้องมี config ใดๆ** (OpenAI plugin ที่มากับระบบ
จะลงทะเบียนแบ็กเอนด์เริ่มต้นไว้ให้):

```bash
openclaw agent --message "hi" --model codex-cli/gpt-5.5
```

หาก gateway ของคุณทำงานภายใต้ launchd/systemd และ PATH มีน้อย ให้เพิ่มเพียงพาธของคำสั่ง:

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

เท่านี้ก็พอแล้ว ไม่ต้องใช้คีย์หรือ config auth เพิ่มเติมนอกเหนือจากตัว CLI เอง

หากคุณใช้ bundled CLI backend เป็น **provider หลักของข้อความ** บน
โฮสต์ gateway ตอนนี้ OpenClaw จะโหลด bundled plugin เจ้าของโดยอัตโนมัติเมื่อ config ของคุณ
อ้างถึงแบ็กเอนด์นั้นอย่างชัดเจนใน model ref หรือภายใต้
`agents.defaults.cliBackends`

## ใช้เป็น fallback

เพิ่ม CLI backend ลงในรายการ fallback เพื่อให้ทำงานเฉพาะเมื่อโมเดลหลักล้มเหลว:

```json5
{
  agents: {
    defaults: {
      model: {
        primary: "anthropic/claude-opus-4-6",
        fallbacks: ["codex-cli/gpt-5.5"],
      },
      models: {
        "anthropic/claude-opus-4-6": { alias: "Opus" },
        "codex-cli/gpt-5.5": {},
      },
    },
  },
}
```

หมายเหตุ:

- หากคุณใช้ `agents.defaults.models` (allowlist) คุณต้องรวมโมเดลของ CLI backend ไว้ที่นั่นด้วย
- หาก provider หลักล้มเหลว (auth, rate limits, timeouts) OpenClaw จะ
  ลอง CLI backend ถัดไป

## ภาพรวมการกำหนดค่า

CLI backends ทั้งหมดอยู่ภายใต้:

```
agents.defaults.cliBackends
```

แต่ละรายการจะใช้ **provider id** เป็นคีย์ (เช่น `codex-cli`, `my-cli`)
provider id จะกลายเป็นฝั่งซ้ายของ model ref ของคุณ:

```
<provider>/<model>
```

### ตัวอย่าง config

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
          // CLI แบบ Codex สามารถชี้ไปยังไฟล์ prompt แทนได้:
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

1. **เลือกแบ็กเอนด์** ตาม prefix ของ provider (`codex-cli/...`)
2. **สร้าง system prompt** โดยใช้พรอมป์ต์และบริบท workspace แบบเดียวกับ OpenClaw
3. **เรียกใช้ CLI** พร้อม session id (หากรองรับ) เพื่อให้ประวัติยังคงสอดคล้องกัน
   แบ็กเอนด์ `claude-cli` ที่มากับระบบจะคง process stdio ของ Claude ไว้ต่อ
   หนึ่งเซสชัน OpenClaw และส่งรอบสนทนาถัดไปผ่าน stdin แบบ stream-json
4. **parse เอาต์พุต** (JSON หรือข้อความล้วน) แล้วส่งคืนข้อความสุดท้าย
5. **บันทึก session ids** แยกตามแบ็กเอนด์ เพื่อให้รอบสนทนาถัดไปใช้เซสชัน CLI เดิม

<Note>
แบ็กเอนด์ `claude-cli` ของ Anthropic ที่มากับระบบกลับมารองรับอีกครั้งแล้ว ทีมงาน Anthropic
แจ้งกับเราว่าการใช้งาน Claude CLI ในลักษณะ OpenClaw ได้รับอนุญาตอีกครั้ง ดังนั้น OpenClaw จึงถือว่า
การใช้ `claude -p` เป็นสิ่งที่ได้รับอนุญาตสำหรับการเชื่อมต่อนี้ เว้นแต่ Anthropic จะเผยแพร่นโยบายใหม่
</Note>

แบ็กเอนด์ `codex-cli` ของ OpenAI ที่มากับระบบจะส่ง system prompt ของ OpenClaw ผ่าน
config override `model_instructions_file` ของ Codex (`-c
model_instructions_file="..."`) Codex ไม่มี flag แบบ
`--append-system-prompt` เหมือน Claude ดังนั้น OpenClaw จึงเขียนพรอมป์ต์ที่ประกอบเสร็จแล้วลงใน
ไฟล์ชั่วคราวสำหรับแต่ละเซสชัน Codex CLI ใหม่

แบ็กเอนด์ `claude-cli` ของ Anthropic ที่มากับระบบจะรับ snapshot ของ Skills จาก OpenClaw
สองทาง: แค็ตตาล็อก Skills แบบย่อของ OpenClaw ใน appended system prompt และ
Claude Code Plugin ชั่วคราวที่ส่งผ่าน `--plugin-dir` Plugin
นี้จะมีเฉพาะ Skills ที่เข้าเกณฑ์สำหรับเอเจนต์/เซสชันนั้น ดังนั้นตัวแก้ชื่อ Skill แบบ native ของ Claude Code
จะเห็นชุด Skills ที่ถูกกรองแบบเดียวกับที่ OpenClaw จะโฆษณาในพรอมป์ต์ การ override env/API key ของ Skill
ยังคงถูกนำไปใช้โดย OpenClaw กับสภาพแวดล้อมของ child process สำหรับการรันนั้น

Claude CLI ยังมีโหมดสิทธิ์แบบ noninteractive ของตัวเองด้วย OpenClaw จะ map สิ่งนั้น
เข้ากับนโยบาย exec ที่มีอยู่แทนการเพิ่ม config เฉพาะของ Claude: เมื่อ requested exec policy ที่มีผลจริงเป็น
YOLO (`tools.exec.security: "full"` และ `tools.exec.ask: "off"`) OpenClaw จะเพิ่ม `--permission-mode bypassPermissions`
ค่าต่อเอเจนต์ `agents.list[].tools.exec` จะ override `tools.exec` ระดับ global สำหรับเอเจนต์นั้น หากต้องการบังคับโหมด Claude ที่ต่างออกไป ให้ตั้ง raw backend args
อย่างชัดเจน เช่น `--permission-mode default` หรือ `--permission-mode acceptEdits` ภายใต้
`agents.defaults.cliBackends.claude-cli.args` และ `resumeArgs` ที่ตรงกัน

ก่อนที่ OpenClaw จะใช้แบ็กเอนด์ `claude-cli` ที่มากับระบบได้ ต้องล็อกอิน Claude Code
บนโฮสต์เดียวกันก่อน:

```bash
claude auth login
claude auth status --text
openclaw models auth login --provider anthropic --method cli --set-default
```

ใช้ `agents.defaults.cliBackends.claude-cli.command` เฉพาะเมื่อไบนารี `claude`
ไม่ได้อยู่บน `PATH` อยู่แล้ว

## Sessions

- หาก CLI รองรับ sessions ให้ตั้ง `sessionArg` (เช่น `--session-id`) หรือ
  `sessionArgs` (placeholder `{sessionId}`) เมื่อจำเป็นต้องแทรก ID ลงใน
  หลาย flags
- หาก CLI ใช้ **resume subcommand** ที่มี flags ต่างออกไป ให้ตั้ง
  `resumeArgs` (แทนที่ `args` เมื่อทำการ resume) และอาจตั้ง `resumeOutput`
  เพิ่มเติม (สำหรับการ resume ที่ไม่ใช่ JSON)
- `sessionMode`:
  - `always`: ส่ง session id เสมอ (สร้าง UUID ใหม่หากยังไม่มีการเก็บไว้)
  - `existing`: ส่ง session id เฉพาะเมื่อเคยเก็บไว้ก่อน
  - `none`: ไม่ส่ง session id เลย
- `claude-cli` ใช้ค่าเริ่มต้นเป็น `liveSession: "claude-stdio"`, `output: "jsonl"`
  และ `input: "stdin"` ดังนั้นรอบสนทนาถัดไปจะใช้ process Claude เดิมต่อในขณะที่
  ยังทำงานอยู่ ตอนนี้ warm stdio เป็นค่าเริ่มต้นแล้ว รวมถึงสำหรับ config แบบกำหนดเอง
  ที่ไม่ได้ระบุฟิลด์ transport หาก Gateway รีสตาร์ตหรือ process ที่ idle
  ปิดตัวลง OpenClaw จะ resume จาก Claude session id ที่เก็บไว้ session ids ที่เก็บไว้จะถูกตรวจสอบเทียบกับ project transcript ที่มีอยู่และอ่านได้ก่อน
  ทำการ resume ดังนั้น phantom bindings จะถูกล้างด้วย `reason=transcript-missing`
  แทนที่จะเริ่มเซสชัน Claude CLI ใหม่แบบเงียบๆ ภายใต้ `--resume`
- CLI sessions ที่เก็บไว้เป็นความต่อเนื่องที่เจ้าของคือ provider การรีเซ็ตเซสชันรายวันโดยปริยาย
  จะไม่ตัดมัน แต่ `/reset` และนโยบาย `session.reset` แบบชัดเจนยังคงตัด

หมายเหตุเรื่องการ serialize:

- `serialize: true` จะทำให้การรันใน lane เดียวกันยังคงมีลำดับ
- CLI ส่วนใหญ่ serialize บน provider lane เดียว
- OpenClaw จะยกเลิกการใช้ CLI session ที่เก็บไว้ซ้ำเมื่อ identity ของ auth ที่เลือกเปลี่ยนไป
  รวมถึงเมื่อ auth profile id เปลี่ยน, API key แบบคงที่เปลี่ยน, token แบบคงที่เปลี่ยน หรือ identity บัญชี OAuth เปลี่ยนเมื่อ CLI เปิดให้ใช้งาน หาก CLI นั้นเปิดเผยได้ การหมุนเวียน access token และ refresh token ของ OAuth จะไม่ตัด stored CLI session หาก CLI ไม่เปิดเผย stable OAuth account id, OpenClaw จะปล่อยให้ CLI นั้นบังคับใช้สิทธิ์การ resume เอง

## รูปภาพ (pass-through)

หาก CLI ของคุณรับ image paths ได้ ให้ตั้ง `imageArg`:

```json5
imageArg: "--image",
imageMode: "repeat"
```

OpenClaw จะเขียนรูปภาพ base64 ลงในไฟล์ชั่วคราว หากมีการตั้ง `imageArg`
พาธเหล่านั้นจะถูกส่งเป็นอาร์กิวเมนต์ของ CLI หากไม่มี `imageArg` OpenClaw จะต่อพาธไฟล์
ท้ายพรอมป์ต์ (path injection) ซึ่งเพียงพอสำหรับ CLI ที่โหลด
ไฟล์ในเครื่องจากพาธล้วนโดยอัตโนมัติ

## อินพุต / เอาต์พุต

- `output: "json"` (ค่าเริ่มต้น) จะพยายาม parse JSON และดึงข้อความ + session id
- สำหรับเอาต์พุต JSON ของ Gemini CLI OpenClaw จะอ่านข้อความตอบกลับจาก `response` และ
  ข้อมูล usage จาก `stats` เมื่อ `usage` ไม่มีหรือว่างเปล่า
- `output: "jsonl"` จะ parse สตรีม JSONL (เช่น Codex CLI `--json`) และดึงข้อความ agent สุดท้ายพร้อมตัวระบุเซสชันเมื่อมี
- `output: "text"` จะถือว่า stdout คือการตอบกลับสุดท้าย

โหมดอินพุต:

- `input: "arg"` (ค่าเริ่มต้น) จะส่งพรอมป์ต์เป็นอาร์กิวเมนต์สุดท้ายของ CLI
- `input: "stdin"` จะส่งพรอมป์ต์ผ่าน stdin
- หากพรอมป์ต์ยาวมากและมีการตั้ง `maxPromptArgChars` ระบบจะใช้ stdin

## ค่าเริ่มต้น (เจ้าของคือ plugin)

OpenAI plugin ที่มากับระบบยังลงทะเบียนค่าเริ่มต้นสำหรับ `codex-cli`:

- `command: "codex"`
- `args: ["exec","--json","--color","never","--sandbox","workspace-write","--skip-git-repo-check"]`
- `resumeArgs: ["exec","resume","{sessionId}","-c","sandbox_mode=\"workspace-write\"","--skip-git-repo-check"]`
- `output: "jsonl"`
- `resumeOutput: "text"`
- `modelArg: "--model"`
- `imageArg: "--image"`
- `sessionMode: "existing"`

Google plugin ที่มากับระบบยังลงทะเบียนค่าเริ่มต้นสำหรับ `google-gemini-cli`:

- `command: "gemini"`
- `args: ["--output-format", "json", "--prompt", "{prompt}"]`
- `resumeArgs: ["--resume", "{sessionId}", "--output-format", "json", "--prompt", "{prompt}"]`
- `imageArg: "@"`
- `imagePathScope: "workspace"`
- `modelArg: "--model"`
- `sessionMode: "existing"`
- `sessionIdFields: ["session_id", "sessionId"]`

ข้อกำหนดเบื้องต้น: ต้องติดตั้ง Gemini CLI ในเครื่องและเรียกใช้ได้เป็น
`gemini` บน `PATH` (`brew install gemini-cli` หรือ
`npm install -g @google/gemini-cli`)

หมายเหตุเกี่ยวกับ JSON ของ Gemini CLI:

- ข้อความตอบกลับจะถูกอ่านจากฟิลด์ JSON `response`
- usage จะ fallback ไปใช้ `stats` เมื่อ `usage` ไม่มีหรือว่างเปล่า
- `stats.cached` จะถูกทำให้เป็นมาตรฐานเป็น `cacheRead` ของ OpenClaw
- หาก `stats.input` ไม่มี OpenClaw จะคำนวณ input tokens จาก
  `stats.input_tokens - stats.cached`

ให้ override เฉพาะเมื่อจำเป็น (ที่พบบ่อยคือพาธ `command` แบบสัมบูรณ์)

## ค่าเริ่มต้นที่ plugin เป็นเจ้าของ

ค่าเริ่มต้นของ CLI backend ตอนนี้เป็นส่วนหนึ่งของพื้นผิว plugin แล้ว:

- Plugins ลงทะเบียนด้วย `api.registerCliBackend(...)`
- `id` ของ backend จะกลายเป็น provider prefix ใน model refs
- config ของผู้ใช้ใน `agents.defaults.cliBackends.<id>` ยังคง override ค่าเริ่มต้นจาก plugin ได้
- การล้าง config เฉพาะของ backend ยังคงเป็นความรับผิดชอบของ plugin ผ่าน hook `normalizeConfig`
  แบบไม่บังคับ

Plugins ที่ต้องการ shim ความเข้ากันได้ของ prompt/message เล็กน้อย สามารถประกาศ
text transforms แบบสองทางได้โดยไม่ต้องแทนที่ provider หรือ CLI backend:

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
จะเขียน streamed assistant deltas และ parsed final text ใหม่ก่อนที่ OpenClaw จะจัดการ
control markers ของตัวเองและการส่งผ่าน channel

สำหรับ CLI ที่ส่ง JSONL ที่เข้ากันได้กับ stream-json ของ Claude Code ให้ตั้ง
`jsonlDialect: "claude-stream-json"` ใน config ของ backend นั้น

## Bundle MCP overlays

CLI backends จะ **ไม่ได้รับ** การเรียกใช้เครื่องมือของ OpenClaw โดยตรง แต่ backend สามารถ
เลือกใช้ generated MCP config overlay ได้ด้วย `bundleMcp: true`

พฤติกรรมแบบ bundled ปัจจุบัน:

- `claude-cli`: ไฟล์ config แบบ strict MCP ที่สร้างขึ้นอัตโนมัติ
- `codex-cli`: config overrides แบบอินไลน์สำหรับ `mcp_servers`; เซิร์ฟเวอร์
  loopback ของ OpenClaw ที่สร้างขึ้นจะถูกทำเครื่องหมายด้วยโหมดอนุมัติเครื่องมือรายเซิร์ฟเวอร์ของ Codex
  เพื่อไม่ให้การเรียก MCP ค้างรอพรอมป์ต์อนุมัติภายในเครื่อง
- `google-gemini-cli`: ไฟล์ Gemini system settings ที่สร้างขึ้นอัตโนมัติ

เมื่อเปิดใช้ bundle MCP OpenClaw จะ:

- สร้างเซิร์ฟเวอร์ MCP แบบ HTTP local loopback ที่เปิดเผยเครื่องมือของ gateway ให้ process ของ CLI
- ยืนยันตัวตนของ bridge ด้วยโทเค็นต่อเซสชัน (`OPENCLAW_MCP_TOKEN`)
- จำกัดขอบเขตการเข้าถึงเครื่องมือให้ตรงกับบริบทของเซสชัน บัญชี และ channel ปัจจุบัน
- โหลดเซิร์ฟเวอร์ bundle-MCP ที่เปิดใช้งานอยู่สำหรับ workspace ปัจจุบัน
- รวมเข้ากับรูปแบบ config/settings MCP ของ backend ที่มีอยู่แล้ว
- เขียน config การเปิดใช้งานใหม่โดยใช้โหมด integration ที่ backend เป็นเจ้าของจาก extension เจ้าของนั้น

หากไม่มี MCP servers ที่เปิดใช้ OpenClaw ก็ยังคง inject config แบบ strict เมื่อ
backend เลือกใช้ bundle MCP เพื่อให้การรันเบื้องหลังยังคงแยกออกจากกัน

## ข้อจำกัด

- **ไม่มีการเรียกใช้เครื่องมือของ OpenClaw โดยตรง** OpenClaw จะไม่ inject การเรียกใช้เครื่องมือเข้าไปใน
  protocol ของ CLI backend แบ็กเอนด์จะเห็นเครื่องมือของ gateway ได้ก็ต่อเมื่อเลือกใช้
  `bundleMcp: true`
- **การสตรีมขึ้นอยู่กับ backend** บาง backend สตรีม JSONL; บางตัวบัฟเฟอร์
  จนกว่าจะจบการทำงาน
- **เอาต์พุตแบบมีโครงสร้าง** ขึ้นอยู่กับรูปแบบ JSON ของ CLI นั้น
- **เซสชันของ Codex CLI** จะ resume ผ่านเอาต์พุตแบบข้อความ (ไม่ใช่ JSONL) ซึ่งมี
  โครงสร้างน้อยกว่าการรัน `--json` ครั้งแรก แต่เซสชันของ OpenClaw ยังทำงานได้ตามปกติ

## การแก้ปัญหา

- **ไม่พบ CLI**: ตั้ง `command` เป็นพาธเต็ม
- **ชื่อ model ไม่ถูกต้อง**: ใช้ `modelAliases` เพื่อแมป `provider/model` → model ของ CLI
- **ไม่มีความต่อเนื่องของเซสชัน**: ตรวจสอบว่าได้ตั้ง `sessionArg` และ `sessionMode` ไม่ใช่
  `none` (ปัจจุบัน Codex CLI ยังไม่สามารถ resume พร้อมเอาต์พุต JSON ได้)
- **รูปภาพถูกเพิกเฉย**: ตั้ง `imageArg` (และตรวจสอบว่า CLI รองรับ file paths)

## ที่เกี่ยวข้อง

- [Gateway runbook](/th/gateway)
- [Local models](/th/gateway/local-models)
