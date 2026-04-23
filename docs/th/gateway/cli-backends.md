---
read_when:
    - คุณต้องการ fallback ที่เชื่อถือได้เมื่อผู้ให้บริการ API ล้มเหลว
    - คุณกำลังรัน Codex CLI หรือ AI CLI ในเครื่องตัวอื่นและต้องการนำกลับมาใช้ซ้ำ
    - คุณต้องการทำความเข้าใจสะพาน MCP loopback สำหรับการเข้าถึง tool ของแบ็กเอนด์ CLI
summary: 'แบ็กเอนด์ CLI: การ fallback ไปยัง AI CLI ในเครื่องพร้อมสะพาน MCP tool แบบทางเลือก'
title: แบ็กเอนด์ CLI
x-i18n:
    generated_at: "2026-04-23T05:32:48Z"
    model: gpt-5.4
    provider: openai
    source_hash: d36aea09a97b980e6938e12ea3bb5c01aa5f6c4275879d51879e48d5a2225fb2
    source_path: gateway/cli-backends.md
    workflow: 15
---

# แบ็กเอนด์ CLI (runtime สำหรับ fallback)

OpenClaw สามารถรัน **AI CLI ในเครื่อง** เป็น **fallback แบบข้อความล้วน** เมื่อผู้ให้บริการ API ใช้งานไม่ได้
ถูกจำกัดอัตรา หรือมีพฤติกรรมผิดปกติชั่วคราว การออกแบบนี้ตั้งใจให้ระมัดระวังเป็นพิเศษ:

- **OpenClaw จะไม่ฉีด tool โดยตรง** แต่แบ็กเอนด์ที่มี `bundleMcp: true`
  สามารถรับ tool ของ gateway ผ่านสะพาน MCP loopback ได้
- **การสตรีมแบบ JSONL** สำหรับ CLI ที่รองรับ
- **รองรับเซสชัน** (เพื่อให้ turn ติดตามผลยังคงต่อเนื่อง)
- **สามารถส่งผ่านรูปภาพได้** หาก CLI รับพาธรูปภาพ

สิ่งนี้ถูกออกแบบให้เป็น **เครือข่ายความปลอดภัย** มากกว่าเส้นทางหลัก ใช้มันเมื่อคุณ
ต้องการการตอบกลับแบบข้อความที่ “ใช้งานได้เสมอ” โดยไม่ต้องพึ่ง API ภายนอก

หากคุณต้องการ runtime แบบ harness เต็มรูปแบบพร้อมตัวควบคุมเซสชัน ACP, แบ็กกราวด์ทาสก์,
การ bind เธรด/การสนทนา และเซสชันเขียนโค้ดภายนอกแบบคงอยู่ ให้ใช้
[ACP Agents](/th/tools/acp-agents) แทน แบ็กเอนด์ CLI ไม่ใช่ ACP

## เริ่มต้นอย่างรวดเร็วสำหรับผู้เริ่มต้น

คุณสามารถใช้ Codex CLI **ได้โดยไม่ต้องมี config ใด ๆ** (plugin OpenAI ที่มาพร้อมระบบ
จะลงทะเบียนแบ็กเอนด์เริ่มต้นไว้ให้):

```bash
openclaw agent --message "hi" --model codex-cli/gpt-5.4
```

หาก Gateway ของคุณรันภายใต้ launchd/systemd และ `PATH` มีน้อย ให้เพิ่มเพียงพาธของคำสั่ง:

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

เพียงเท่านี้ ไม่ต้องใช้คีย์ และไม่ต้องมี config ยืนยันตัวตนเพิ่มเติมนอกเหนือจากตัว CLI เอง

หากคุณใช้แบ็กเอนด์ CLI ที่มาพร้อมระบบเป็น **ผู้ให้บริการข้อความหลัก** บน
โฮสต์ Gateway ตอนนี้ OpenClaw จะโหลด bundled plugin เจ้าของแบ็กเอนด์นั้นโดยอัตโนมัติเมื่อ config ของคุณ
อ้างอิงแบ็กเอนด์นั้นอย่างชัดเจนใน model ref หรือภายใต้
`agents.defaults.cliBackends`

## การใช้เป็น fallback

เพิ่มแบ็กเอนด์ CLI ลงในรายการ fallback เพื่อให้มันทำงานเฉพาะเมื่อโมเดลหลักล้มเหลว:

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

- หากคุณใช้ `agents.defaults.models` (allowlist) คุณต้องรวมโมเดลของแบ็กเอนด์ CLI ไว้ที่นั่นด้วย
- หากผู้ให้บริการหลักล้มเหลว (auth, rate limit, timeout) OpenClaw จะ
  ลองแบ็กเอนด์ CLI ถัดไป

## ภาพรวมการกำหนดค่า

แบ็กเอนด์ CLI ทั้งหมดอยู่ภายใต้:

```
agents.defaults.cliBackends
```

แต่ละรายการถูกกำหนดคีย์ด้วย **provider id** (เช่น `codex-cli`, `my-cli`)
provider id จะกลายเป็นด้านซ้ายของ model ref ของคุณ:

```
<provider>/<model>
```

### ตัวอย่างการกำหนดค่า

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
2. **สร้าง system prompt** โดยใช้ prompt + context ของ workspace แบบเดียวกับ OpenClaw
3. **เรียกใช้ CLI** พร้อม session id (หากรองรับ) เพื่อให้ประวัติยังคงสอดคล้องกัน
   แบ็กเอนด์ `claude-cli` ที่มาพร้อมระบบจะคงโปรเซส Claude stdio ไว้ต่อหนึ่ง
   เซสชันของ OpenClaw และส่ง turn ติดตามผลผ่าน stream-json stdin
4. **แยกวิเคราะห์เอาต์พุต** (JSON หรือข้อความปกติ) และส่งคืนข้อความสุดท้าย
5. **จัดเก็บ session id** แยกตามแบ็กเอนด์ เพื่อให้การติดตามผลใช้เซสชัน CLI เดิมซ้ำ

<Note>
แบ็กเอนด์ `claude-cli` ของ Anthropic ที่มาพร้อมระบบกลับมารองรับอีกครั้งแล้ว เจ้าหน้าที่ Anthropic
แจ้งเราว่าการใช้งาน Claude CLI แบบ OpenClaw ได้รับอนุญาตอีกครั้ง ดังนั้น OpenClaw จึงถือว่า
การใช้ `claude -p` ได้รับอนุญาตสำหรับการผสานรวมนี้ เว้นแต่ Anthropic จะเผยแพร่นโยบายใหม่
</Note>

แบ็กเอนด์ `codex-cli` ของ OpenAI ที่มาพร้อมระบบจะส่ง system prompt ของ OpenClaw ผ่าน
การแทนที่ config `model_instructions_file` ของ Codex (`-c
model_instructions_file="..."`) Codex ไม่มีแฟล็กแบบ
`--append-system-prompt` สไตล์ Claude ดังนั้น OpenClaw จึงเขียน prompt ที่ประกอบแล้วลงใน
ไฟล์ชั่วคราวสำหรับแต่ละเซสชัน Codex CLI ใหม่

แบ็กเอนด์ `claude-cli` ของ Anthropic ที่มาพร้อมระบบจะรับ snapshot ของ Skills ของ OpenClaw
สองทาง: แค็ตตาล็อก Skills แบบย่อของ OpenClaw ใน appended system prompt และ
Claude Code plugin ชั่วคราวที่ส่งผ่าน `--plugin-dir` plugin นี้มีเฉพาะ
Skills ที่มีสิทธิ์สำหรับเอเจนต์/เซสชันนั้น ดังนั้นตัวแก้ไข Skills แบบเนทีฟของ Claude Code
จะเห็นชุดเดียวกับที่ OpenClaw จะประกาศใน prompt ค่าการแทนที่ env/API key ของ Skills
ยังคงถูกใช้โดย OpenClaw กับ environment ของโปรเซสลูกสำหรับการรันนั้น

## เซสชัน

- หาก CLI รองรับเซสชัน ให้ตั้ง `sessionArg` (เช่น `--session-id`) หรือ
  `sessionArgs` (placeholder `{sessionId}`) เมื่อต้องใส่ ID ลงในหลายแฟล็ก
- หาก CLI ใช้ **resume subcommand** ที่มีแฟล็กต่างออกไป ให้ตั้ง
  `resumeArgs` (แทนที่ `args` เมื่อต้อง resume) และเลือกตั้ง `resumeOutput`
  ได้ (สำหรับการ resume ที่ไม่ใช่ JSON)
- `sessionMode`:
  - `always`: ส่ง session id เสมอ (หากยังไม่มีการเก็บไว้จะสร้าง UUID ใหม่)
  - `existing`: ส่ง session id เฉพาะเมื่อเคยเก็บไว้ก่อนแล้ว
  - `none`: ไม่ส่ง session id เลย
- `claude-cli` มีค่าเริ่มต้นเป็น `liveSession: "claude-stdio"`, `output: "jsonl"`,
  และ `input: "stdin"` เพื่อให้ turn ติดตามผลใช้โปรเซส Claude เดิมซ้ำได้ขณะที่
  มันยังทำงานอยู่ หาก Gateway รีสตาร์ตหรือโปรเซสว่างงานปิดตัว OpenClaw
  จะ resume จาก Claude session id ที่จัดเก็บไว้
- เซสชัน CLI ที่จัดเก็บไว้เป็นความต่อเนื่องที่ผู้ให้บริการเป็นเจ้าของ การรีเซ็ตเซสชันรายวันโดยปริยาย
  จะไม่ตัดมัน; แต่ `/reset` และนโยบาย `session.reset` แบบชัดเจนจะตัด

หมายเหตุเกี่ยวกับการ serialize:

- `serialize: true` ทำให้การรันใน lane เดียวกันคงลำดับ
- CLI ส่วนใหญ่ serialize บน provider lane เดียว
- OpenClaw จะทิ้งการใช้เซสชัน CLI ที่จัดเก็บไว้ซ้ำเมื่อ identity ด้าน auth ที่เลือกเปลี่ยนไป
  รวมถึง profile id ของ auth ที่เปลี่ยน, API key แบบคงที่, token แบบคงที่ หรือ identity ของบัญชี OAuth เมื่อ CLI เปิดเผยได้
  การหมุน access token และ refresh token ของ OAuth จะไม่ตัดเซสชัน CLI ที่จัดเก็บไว้ หาก CLI ใดไม่เปิดเผย OAuth account id ที่เสถียร OpenClaw จะปล่อยให้ CLI นั้นบังคับใช้สิทธิ์ในการ resume เอง

## รูปภาพ (ส่งผ่าน)

หาก CLI ของคุณรับพาธรูปภาพ ให้ตั้ง `imageArg`:

```json5
imageArg: "--image",
imageMode: "repeat"
```

OpenClaw จะเขียนรูปภาพ base64 ลงเป็นไฟล์ชั่วคราว หากตั้ง `imageArg` ไว้
พาธเหล่านั้นจะถูกส่งเป็นอาร์กิวเมนต์ของ CLI หากไม่มี `imageArg` OpenClaw จะต่อ
พาธไฟล์เหล่านั้นเข้าไปใน prompt (path injection) ซึ่งเพียงพอสำหรับ CLI ที่โหลด
ไฟล์ในเครื่องจากพาธข้อความธรรมดาโดยอัตโนมัติ

## อินพุต / เอาต์พุต

- `output: "json"` (ค่าเริ่มต้น) จะพยายาม parse JSON และดึงข้อความ + session id
- สำหรับเอาต์พุต JSON ของ Gemini CLI OpenClaw จะอ่านข้อความตอบกลับจาก `response` และ
  usage จาก `stats` เมื่อ `usage` ไม่มีหรือว่างเปล่า
- `output: "jsonl"` จะ parse สตรีม JSONL (เช่น Codex CLI `--json`) และดึงข้อความ agent สุดท้ายพร้อมตัวระบุเซสชันเมื่อมี
- `output: "text"` จะถือว่า stdout คือการตอบกลับสุดท้าย

โหมดอินพุต:

- `input: "arg"` (ค่าเริ่มต้น) ส่ง prompt เป็นอาร์กิวเมนต์สุดท้ายของ CLI
- `input: "stdin"` ส่ง prompt ผ่าน stdin
- หาก prompt ยาวมากและมีการตั้ง `maxPromptArgChars` ไว้ จะใช้ stdin

## ค่าเริ่มต้น (เป็นเจ้าของโดย plugin)

plugin OpenAI ที่มาพร้อมระบบยังลงทะเบียนค่าเริ่มต้นสำหรับ `codex-cli` ด้วย:

- `command: "codex"`
- `args: ["exec","--json","--color","never","--sandbox","workspace-write","--skip-git-repo-check"]`
- `resumeArgs: ["exec","resume","{sessionId}","-c","sandbox_mode=\"workspace-write\"","--skip-git-repo-check"]`
- `output: "jsonl"`
- `resumeOutput: "text"`
- `modelArg: "--model"`
- `imageArg: "--image"`
- `sessionMode: "existing"`

plugin Google ที่มาพร้อมระบบยังลงทะเบียนค่าเริ่มต้นสำหรับ `google-gemini-cli` ด้วย:

- `command: "gemini"`
- `args: ["--output-format", "json", "--prompt", "{prompt}"]`
- `resumeArgs: ["--resume", "{sessionId}", "--output-format", "json", "--prompt", "{prompt}"]`
- `imageArg: "@"`
- `imagePathScope: "workspace"`
- `modelArg: "--model"`
- `sessionMode: "existing"`
- `sessionIdFields: ["session_id", "sessionId"]`

ข้อกำหนดเบื้องต้น: ต้องติดตั้ง Gemini CLI ในเครื่องและพร้อมใช้งานเป็น
`gemini` บน `PATH` (`brew install gemini-cli` หรือ
`npm install -g @google/gemini-cli`)

หมายเหตุเกี่ยวกับ JSON ของ Gemini CLI:

- ข้อความตอบกลับจะถูกอ่านจากฟิลด์ JSON `response`
- usage จะ fallback ไปใช้ `stats` เมื่อ `usage` ไม่มีหรือว่างเปล่า
- `stats.cached` จะถูกทำให้เป็นมาตรฐานเป็น `cacheRead` ของ OpenClaw
- หาก `stats.input` ไม่มี OpenClaw จะคำนวณโทเค็นขาเข้าจาก
  `stats.input_tokens - stats.cached`

ให้แทนที่เฉพาะเมื่อจำเป็น (ที่พบบ่อย: พาธ `command` แบบ absolute)

## ค่าเริ่มต้นที่เป็นเจ้าของโดย plugin

ค่าเริ่มต้นของแบ็กเอนด์ CLI ตอนนี้เป็นส่วนหนึ่งของพื้นผิว plugin:

- Plugins ลงทะเบียนด้วย `api.registerCliBackend(...)`
- `id` ของแบ็กเอนด์จะกลายเป็น prefix ของ provider ใน model ref
- config ของผู้ใช้ใน `agents.defaults.cliBackends.<id>` ยังสามารถแทนที่ค่าเริ่มต้นของ plugin ได้
- การล้าง config เฉพาะแบ็กเอนด์ยังคงเป็นความรับผิดชอบของ plugin ผ่าน hook
  `normalizeConfig` แบบทางเลือก

Plugins ที่ต้องการ shim เล็ก ๆ สำหรับความเข้ากันได้ของ prompt/message สามารถประกาศ
การแปลงข้อความแบบสองทิศทางได้โดยไม่ต้องแทนที่ provider หรือแบ็กเอนด์ CLI:

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

`input` จะเขียนใหม่ทั้ง system prompt และ user prompt ที่ส่งให้ CLI ส่วน `output`
จะเขียนใหม่ทั้ง streamed assistant delta และข้อความสุดท้ายที่ parse แล้ว ก่อนที่ OpenClaw จะจัดการ
control marker ของตัวเองและการส่งผ่านแชนเนล

สำหรับ CLI ที่ส่ง JSONL ซึ่งเข้ากันได้กับ Claude Code stream-json ให้ตั้ง
`jsonlDialect: "claude-stream-json"` ใน config ของแบ็กเอนด์นั้น

## overlay ของ Bundle MCP

แบ็กเอนด์ CLI **จะไม่ได้รับ** การเรียก tool ของ OpenClaw โดยตรง แต่แบ็กเอนด์สามารถ
เลือกใช้ generated MCP config overlay ได้ด้วย `bundleMcp: true`

พฤติกรรมแบบ bundled ในปัจจุบัน:

- `claude-cli`: ไฟล์ MCP config แบบ strict ที่สร้างขึ้น
- `codex-cli`: การแทนที่ config แบบ inline สำหรับ `mcp_servers`
- `google-gemini-cli`: ไฟล์การตั้งค่าระบบ Gemini ที่สร้างขึ้น

เมื่อเปิดใช้ bundle MCP, OpenClaw จะ:

- spawn เซิร์ฟเวอร์ MCP แบบ loopback HTTP ที่เปิดเผย tool ของ gateway ให้โปรเซส CLI
- ยืนยันตัวตนของสะพานด้วยโทเค็นรายเซสชัน (`OPENCLAW_MCP_TOKEN`)
- กำหนดขอบเขตการเข้าถึง tool ให้กับบริบทของเซสชัน บัญชี และแชนเนลปัจจุบัน
- โหลดเซิร์ฟเวอร์ bundle-MCP ที่เปิดใช้งานสำหรับ workspace ปัจจุบัน
- รวมเข้ากับรูปร่าง config/settings MCP ที่แบ็กเอนด์มีอยู่แล้ว
- เขียน config การเปิดใช้งานใหม่โดยใช้โหมดการผสานรวมที่เป็นเจ้าของโดยแบ็กเอนด์จาก extension เจ้าของนั้น

หากไม่มีการเปิดใช้เซิร์ฟเวอร์ MCP ใดเลย OpenClaw ก็ยังคงฉีด strict config เมื่อ
แบ็กเอนด์เลือกใช้ bundle MCP เพื่อให้การรันเบื้องหลังยังคงแยกจากกัน

## ข้อจำกัด

- **ไม่มีการเรียก tool ของ OpenClaw โดยตรง** OpenClaw จะไม่ฉีดการเรียก tool เข้าไปใน
  โปรโตคอลของแบ็กเอนด์ CLI แบ็กเอนด์จะเห็น tool ของ gateway ได้เฉพาะเมื่อเลือกใช้
  `bundleMcp: true`
- **การสตรีมขึ้นอยู่กับแบ็กเอนด์** บางแบ็กเอนด์สตรีม JSONL; ตัวอื่นจะบัฟเฟอร์
  จนกว่าโปรเซสจะออก
- **Structured outputs** ขึ้นอยู่กับรูปแบบ JSON ของ CLI นั้น
- **เซสชันของ Codex CLI** resume ผ่านเอาต์พุตข้อความ (ไม่ใช่ JSONL) ซึ่งมีโครงสร้างน้อยกว่า
  การรัน `--json` ครั้งแรก แต่เซสชัน OpenClaw ยังทำงานได้ตามปกติ

## การแก้ไขปัญหา

- **ไม่พบ CLI**: ตั้งค่า `command` เป็นพาธแบบเต็ม
- **ชื่อโมเดลไม่ถูกต้อง**: ใช้ `modelAliases` เพื่อแมป `provider/model` → โมเดลของ CLI
- **ไม่มีความต่อเนื่องของเซสชัน**: ตรวจสอบว่าได้ตั้ง `sessionArg` และ `sessionMode` ไม่ได้เป็น
  `none` (ปัจจุบัน Codex CLI ยังไม่สามารถ resume พร้อมเอาต์พุต JSON ได้)
- **รูปภาพถูกเพิกเฉย**: ตั้งค่า `imageArg` (และตรวจสอบว่า CLI รองรับพาธไฟล์)
