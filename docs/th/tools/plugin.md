---
read_when:
    - การติดตั้งหรือกำหนดค่าปลั๊กอิน
    - การทำความเข้าใจการค้นหาปลั๊กอินและกฎการโหลด
    - การทำงานกับปลั๊กอิน bundles ที่เข้ากันได้กับ Codex/Claude
sidebarTitle: Install and Configure
summary: ติดตั้ง กำหนดค่า และจัดการปลั๊กอิน OpenClaw
title: ปลั๊กอิน
x-i18n:
    generated_at: "2026-04-24T09:38:09Z"
    model: gpt-5.4
    provider: openai
    source_hash: 83ab1218d6677ad518a4991ca546d55eed9648e1fa92b76b7433ecd5df569e28
    source_path: tools/plugin.md
    workflow: 15
---

ปลั๊กอินช่วยขยาย OpenClaw ด้วยความสามารถใหม่ๆ เช่น channels, ผู้ให้บริการโมเดล,
agent harnesses, tools, Skills, speech, realtime transcription, realtime
voice, media-understanding, การสร้างภาพ, การสร้างวิดีโอ, web fetch, web
search และอื่นๆ ปลั๊กอินบางตัวเป็น **core** (มาพร้อมกับ OpenClaw) และบางตัว
เป็น **external** (เผยแพร่บน npm โดยชุมชน)

## เริ่มต้นอย่างรวดเร็ว

<Steps>
  <Step title="ดูว่ามีอะไรถูกโหลดอยู่บ้าง">
    ```bash
    openclaw plugins list
    ```
  </Step>

  <Step title="ติดตั้งปลั๊กอิน">
    ```bash
    # จาก npm
    openclaw plugins install @openclaw/voice-call

    # จากไดเรกทอรีในเครื่องหรือไฟล์เก็บถาวร
    openclaw plugins install ./my-plugin
    openclaw plugins install ./my-plugin.tgz
    ```

  </Step>

  <Step title="รีสตาร์ต Gateway">
    ```bash
    openclaw gateway restart
    ```

    จากนั้นกำหนดค่าภายใต้ `plugins.entries.\<id\>.config` ในไฟล์ config ของคุณ

  </Step>
</Steps>

หากคุณต้องการควบคุมแบบ native ในแชต ให้เปิดใช้ `commands.plugins: true` แล้วใช้:

```text
/plugin install clawhub:@openclaw/voice-call
/plugin show voice-call
/plugin enable voice-call
```

เส้นทางการติดตั้งใช้ resolver เดียวกับ CLI: local path/archive, `clawhub:<pkg>` แบบ explicit หรือ package spec แบบเปล่า (ClawHub ก่อน จากนั้น fallback ไป npm)

หาก config ไม่ถูกต้อง การติดตั้งมักจะล้มเหลวแบบ fail closed และชี้คุณไปที่
`openclaw doctor --fix` ข้อยกเว้นด้านการกู้คืนเพียงกรณีเดียวคือเส้นทาง reinstall แบบแคบสำหรับปลั๊กอิน bundled
ที่เลือกใช้
`openclaw.install.allowInvalidConfigRecovery`

การติดตั้ง OpenClaw แบบแพ็กเกจจะไม่ติดตั้ง
runtime dependency tree ของปลั๊กอิน bundled ทุกตัวแบบ eager หากปลั๊กอินแบบ bundled ที่เป็นของ OpenClaw ทำงานอยู่จาก
plugin config, legacy channel config หรือ manifest ที่เปิดใช้โดยค่าเริ่มต้น
startup repairs จะซ่อมเฉพาะ runtime dependencies ที่ปลั๊กอินนั้นประกาศไว้ก่อนการ import
ส่วนปลั๊กอิน external และ custom load paths จะยังคงต้องติดตั้งผ่าน
`openclaw plugins install`

## ประเภทของปลั๊กอิน

OpenClaw รู้จักรูปแบบปลั๊กอินสองแบบ:

| รูปแบบ | วิธีการทำงาน | ตัวอย่าง |
| ---------- | ------------------------------------------------------------------ | ------------------------------------------------------ |
| **Native** | `openclaw.plugin.json` + runtime module; ทำงานใน-process | ปลั๊กอินอย่างเป็นทางการ, แพ็กเกจ npm จากชุมชน |
| **Bundle** | เลย์เอาต์ที่เข้ากันได้กับ Codex/Claude/Cursor; ถูกแมปไปยังฟีเจอร์ของ OpenClaw | `.codex-plugin/`, `.claude-plugin/`, `.cursor-plugin/` |

ทั้งสองแบบจะแสดงภายใต้ `openclaw plugins list` ดูรายละเอียดของ bundle ได้ที่ [Plugin Bundles](/th/plugins/bundles)

หากคุณกำลังเขียนปลั๊กอินแบบ native ให้เริ่มต้นที่ [Building Plugins](/th/plugins/building-plugins)
และ [Plugin SDK Overview](/th/plugins/sdk-overview)

## ปลั๊กอินอย่างเป็นทางการ

### ติดตั้งได้ (npm)

| ปลั๊กอิน | แพ็กเกจ | เอกสาร |
| --------------- | ---------------------- | ------------------------------------ |
| Matrix | `@openclaw/matrix` | [Matrix](/th/channels/matrix) |
| Microsoft Teams | `@openclaw/msteams` | [Microsoft Teams](/th/channels/msteams) |
| Nostr | `@openclaw/nostr` | [Nostr](/th/channels/nostr) |
| Voice Call | `@openclaw/voice-call` | [Voice Call](/th/plugins/voice-call) |
| Zalo | `@openclaw/zalo` | [Zalo](/th/channels/zalo) |
| Zalo Personal | `@openclaw/zalouser` | [Zalo Personal](/th/plugins/zalouser) |

### Core (มาพร้อมกับ OpenClaw)

<AccordionGroup>
  <Accordion title="ผู้ให้บริการโมเดล (เปิดใช้โดยค่าเริ่มต้น)">
    `anthropic`, `byteplus`, `cloudflare-ai-gateway`, `github-copilot`, `google`,
    `huggingface`, `kilocode`, `kimi-coding`, `minimax`, `mistral`, `qwen`,
    `moonshot`, `nvidia`, `openai`, `opencode`, `opencode-go`, `openrouter`,
    `qianfan`, `synthetic`, `together`, `venice`,
    `vercel-ai-gateway`, `volcengine`, `xiaomi`, `zai`
  </Accordion>

  <Accordion title="ปลั๊กอินหน่วยความจำ">
    - `memory-core` — memory search แบบ bundled (ค่าเริ่มต้นผ่าน `plugins.slots.memory`)
    - `memory-lancedb` — หน่วยความจำระยะยาวแบบติดตั้งเมื่อจำเป็น พร้อม auto-recall/capture (ตั้งค่า `plugins.slots.memory = "memory-lancedb"`)
  </Accordion>

  <Accordion title="ผู้ให้บริการ speech (เปิดใช้โดยค่าเริ่มต้น)">
    `elevenlabs`, `microsoft`
  </Accordion>

  <Accordion title="อื่นๆ">
    - `browser` — ปลั๊กอิน browser แบบ bundled สำหรับ browser tool, CLI `openclaw browser`, gateway method `browser.request`, browser runtime และบริการควบคุมเบราว์เซอร์ค่าเริ่มต้น (เปิดใช้โดยค่าเริ่มต้น; ปิดก่อนหากจะเปลี่ยนแทนที่)
    - `copilot-proxy` — สะพานเชื่อม VS Code Copilot Proxy (ปิดโดยค่าเริ่มต้น)
  </Accordion>
</AccordionGroup>

กำลังมองหาปลั๊กอินจากบุคคลที่สามอยู่หรือไม่? ดู [Community Plugins](/th/plugins/community)

## การกำหนดค่า

```json5
{
  plugins: {
    enabled: true,
    allow: ["voice-call"],
    deny: ["untrusted-plugin"],
    load: { paths: ["~/Projects/oss/voice-call-plugin"] },
    entries: {
      "voice-call": { enabled: true, config: { provider: "twilio" } },
    },
  },
}
```

| ฟิลด์ | คำอธิบาย |
| ---------------- | --------------------------------------------------------- |
| `enabled` | master toggle (ค่าเริ่มต้น: `true`) |
| `allow` | allowlist ของปลั๊กอิน (ไม่บังคับ) |
| `deny` | denylist ของปลั๊กอิน (ไม่บังคับ; deny มีผลเหนือกว่า) |
| `load.paths` | ไฟล์/ไดเรกทอรีปลั๊กอินเพิ่มเติม |
| `slots` | ตัวเลือกสล็อตแบบเอกสิทธิ์ (เช่น `memory`, `contextEngine`) |
| `entries.\<id\>` | toggles + config ต่อปลั๊กอิน |

การเปลี่ยนแปลง config **ต้องรีสตาร์ต gateway** หาก Gateway กำลังทำงานพร้อม config
watch + in-process restart ที่เปิดใช้งานอยู่ (เส้นทาง `openclaw gateway` ค่าเริ่มต้น) การ
รีสตาร์ตนั้นมักจะดำเนินการให้อัตโนมัติไม่นานหลังจากที่มีการเขียน config

<Accordion title="สถานะปลั๊กอิน: disabled เทียบกับ missing เทียบกับ invalid">
  - **Disabled**: มีปลั๊กอินอยู่ แต่กฎการเปิดใช้ได้ปิดมันไว้ Config ยังคงถูกเก็บไว้
  - **Missing**: config อ้างอิง plugin id ที่การค้นหาไม่พบ
  - **Invalid**: มีปลั๊กอินอยู่ แต่ config ของมันไม่ตรงกับ schema ที่ประกาศไว้
</Accordion>

## การค้นหาและลำดับความสำคัญ

OpenClaw จะสแกนหาปลั๊กอินตามลำดับนี้ (เจออันแรกถือว่าใช้):

<Steps>
  <Step title="พาธจาก config">
    `plugins.load.paths` — พาธไฟล์หรือไดเรกทอรีที่ระบุชัดเจน
  </Step>

  <Step title="ปลั๊กอินใน workspace">
    `\<workspace\>/.openclaw/<plugin-root>/*.ts` และ `\<workspace\>/.openclaw/<plugin-root>/*/index.ts`
  </Step>

  <Step title="ปลั๊กอิน global">
    `~/.openclaw/<plugin-root>/*.ts` และ `~/.openclaw/<plugin-root>/*/index.ts`
  </Step>

  <Step title="ปลั๊กอิน bundled">
    มาพร้อมกับ OpenClaw หลายตัวเปิดใช้งานโดยค่าเริ่มต้น (ผู้ให้บริการโมเดล, speech)
    ส่วนบางตัวต้องเปิดใช้อย่างชัดเจน
  </Step>
</Steps>

### กฎการเปิดใช้

- `plugins.enabled: false` ปิดปลั๊กอินทั้งหมด
- `plugins.deny` มีผลเหนือ allow เสมอ
- `plugins.entries.\<id\>.enabled: false` ปิดปลั๊กอินนั้น
- ปลั๊กอินที่มาจาก workspace จะ **ปิดโดยค่าเริ่มต้น** (ต้องเปิดใช้อย่างชัดเจน)
- ปลั๊กอิน bundled จะทำตามชุดที่เปิดใช้โดยค่าเริ่มต้นในตัว เว้นแต่จะถูก override
- สล็อตแบบเอกสิทธิ์สามารถบังคับเปิดใช้ปลั๊กอินที่ถูกเลือกสำหรับสล็อตนั้นได้
- ปลั๊กอิน bundled แบบ opt-in บางตัวจะถูกเปิดใช้อัตโนมัติเมื่อ config ระบุ
  พื้นผิวที่ปลั๊กอินนั้นเป็นเจ้าของ เช่น provider model ref, channel config หรือ harness
  runtime
- เส้นทาง Codex ตระกูล OpenAI ยังคงแยกขอบเขตของปลั๊กอินออกจากกัน:
  `openai-codex/*` เป็นของปลั๊กอิน OpenAI ส่วนปลั๊กอิน bundled Codex
  app-server จะถูกเลือกโดย `embeddedHarness.runtime: "codex"` หรือ model refs แบบเดิม
  `codex/*`

## สล็อตปลั๊กอิน (หมวดหมู่แบบเอกสิทธิ์)

บางหมวดหมู่เป็นแบบเอกสิทธิ์ (ทำงานได้ครั้งละหนึ่งตัวเท่านั้น):

```json5
{
  plugins: {
    slots: {
      memory: "memory-core", // หรือ "none" เพื่อปิด
      contextEngine: "legacy", // หรือ plugin id
    },
  },
}
```

| สล็อต | สิ่งที่ควบคุม | ค่าเริ่มต้น |
| --------------- | --------------------- | ------------------- |
| `memory` | ปลั๊กอินหน่วยความจำที่ทำงานอยู่ | `memory-core` |
| `contextEngine` | context engine ที่ทำงานอยู่ | `legacy` (มีในตัว) |

## เอกสารอ้างอิง CLI

```bash
openclaw plugins list                       # inventory แบบย่อ
openclaw plugins list --enabled            # เฉพาะปลั๊กอินที่โหลดอยู่
openclaw plugins list --verbose            # บรรทัดรายละเอียดต่อปลั๊กอิน
openclaw plugins list --json               # inventory แบบอ่านด้วยเครื่อง
openclaw plugins inspect <id>              # รายละเอียดเชิงลึก
openclaw plugins inspect <id> --json       # แบบอ่านด้วยเครื่อง
openclaw plugins inspect --all             # ตารางทั้งชุด
openclaw plugins info <id>                 # ชื่อแฝงของ inspect
openclaw plugins doctor                    # การวินิจฉัย

openclaw plugins install <package>         # ติดตั้ง (ClawHub ก่อน แล้ว npm)
openclaw plugins install clawhub:<pkg>     # ติดตั้งจาก ClawHub เท่านั้น
openclaw plugins install <spec> --force    # เขียนทับการติดตั้งที่มีอยู่
openclaw plugins install <path>            # ติดตั้งจากพาธในเครื่อง
openclaw plugins install -l <path>         # ลิงก์ (ไม่คัดลอก) สำหรับพัฒนา
openclaw plugins install <plugin> --marketplace <source>
openclaw plugins install <plugin> --marketplace https://github.com/<owner>/<repo>
openclaw plugins install <spec> --pin      # บันทึก exact resolved npm spec
openclaw plugins install <spec> --dangerously-force-unsafe-install
openclaw plugins update <id-or-npm-spec> # อัปเดตปลั๊กอินหนึ่งตัว
openclaw plugins update <id-or-npm-spec> --dangerously-force-unsafe-install
openclaw plugins update --all            # อัปเดตทั้งหมด
openclaw plugins uninstall <id>          # ลบ config/บันทึกการติดตั้ง
openclaw plugins uninstall <id> --keep-files
openclaw plugins marketplace list <source>
openclaw plugins marketplace list <source> --json

openclaw plugins enable <id>
openclaw plugins disable <id>
```

ปลั๊กอิน bundled มาพร้อมกับ OpenClaw หลายตัวเปิดใช้งานโดยค่าเริ่มต้น (เช่น
ผู้ให้บริการโมเดลแบบ bundled, ผู้ให้บริการ speech แบบ bundled และปลั๊กอิน browser แบบ bundled)
ส่วนปลั๊กอิน bundled อื่นๆ ยังคงต้องใช้ `openclaw plugins enable <id>`

`--force` จะเขียนทับปลั๊กอินหรือ hook pack ที่ติดตั้งอยู่แล้วในตำแหน่งเดิม ให้ใช้
`openclaw plugins update <id-or-npm-spec>` สำหรับการอัปเกรดตามปกติของปลั๊กอิน npm
ที่ติดตามอยู่ ตัวเลือกนี้ไม่รองรับร่วมกับ `--link` ซึ่งใช้พาธต้นทางซ้ำ
แทนการคัดลอกทับเป้าหมายการติดตั้งที่จัดการอยู่

เมื่อมีการตั้งค่า `plugins.allow` อยู่แล้ว `openclaw plugins install` จะเพิ่ม
id ของปลั๊กอินที่ติดตั้งลงใน allowlist นั้นก่อนเปิดใช้งาน ทำให้หลังรีสตาร์ตสามารถโหลดได้ทันที

`openclaw plugins update <id-or-npm-spec>` ใช้กับการติดตั้งที่ติดตามอยู่ การส่ง
npm package spec ที่มี dist-tag หรือเวอร์ชันที่แน่นอน จะ resolve ชื่อแพ็กเกจ
กลับไปยังบันทึกปลั๊กอินที่ติดตามอยู่ และบันทึก spec ใหม่สำหรับการอัปเดตครั้งถัดไป
การส่งชื่อแพ็กเกจโดยไม่มีเวอร์ชันจะย้ายการติดตั้งแบบ pin เวอร์ชันแน่นอนกลับไปยัง
สายรีลีสค่าเริ่มต้นของ registry หากปลั๊กอิน npm ที่ติดตั้งอยู่ตรงกับเวอร์ชัน
ที่ resolve แล้วและ identity ของ artifact ที่บันทึกไว้ OpenClaw จะข้ามการอัปเดต
โดยไม่ดาวน์โหลด ติดตั้งใหม่ หรือเขียน config ใหม่

`--pin` ใช้ได้เฉพาะกับ npm เท่านั้น ไม่รองรับร่วมกับ `--marketplace` เพราะ
การติดตั้งผ่าน marketplace จะ persist ข้อมูลเมตาแหล่งที่มาของ marketplace แทน npm spec

`--dangerously-force-unsafe-install` เป็นตัว override แบบ break-glass สำหรับ false
positives จาก dangerous-code scanner ที่มีในตัว มันอนุญาตให้การติดตั้งและการอัปเดตปลั๊กอินดำเนินต่อไปได้แม้มีผลการค้นพบระดับ `critical` จากตัวสแกนในตัว แต่ก็ยัง
ไม่ข้ามการบล็อกจากนโยบาย `before_install` ของปลั๊กอิน หรือการบล็อกจาก scan-failure

แฟลก CLI นี้ใช้กับโฟลว์การติดตั้ง/อัปเดตปลั๊กอินเท่านั้น ส่วนการติดตั้ง dependency ของ Skills
ที่ขับเคลื่อนโดย Gateway จะใช้ request override ที่ตรงกันชื่อ `dangerouslyForceUnsafeInstall` แทน ขณะที่ `openclaw skills install` ยังคงเป็นโฟลว์แยกสำหรับการดาวน์โหลด/ติดตั้ง Skills จาก ClawHub

bundles ที่เข้ากันได้จะเข้าร่วมอยู่ในโฟลว์เดียวกันของการ list/inspect/enable/disable ปลั๊กอิน
การรองรับ runtime ในปัจจุบันรวมถึง Skills ของ bundle, command-skills ของ Claude,
ค่าเริ่มต้นจาก `settings.json` ของ Claude, ค่าเริ่มต้นจาก `.lsp.json` ของ Claude และ
`lspServers` ที่ประกาศใน manifest, command-skills ของ Cursor และไดเรกทอรี hook
ของ Codex ที่เข้ากันได้

`openclaw plugins inspect <id>` ยังรายงานความสามารถของ bundle ที่ตรวจพบ รวมถึง
รายการเซิร์ฟเวอร์ MCP และ LSP ที่รองรับหรือไม่รองรับสำหรับปลั๊กอินที่ขับเคลื่อนด้วย bundle

แหล่งที่มาของ marketplace สามารถเป็นชื่อ known-marketplace ของ Claude จาก
`~/.claude/plugins/known_marketplaces.json`, root ของ marketplace ในเครื่องหรือพาธ
`marketplace.json`, รูปแบบย่อของ GitHub เช่น `owner/repo`, URL ของ repo บน GitHub
หรือ git URL สำหรับ marketplace ระยะไกล รายการปลั๊กอินต้องอยู่ภายใน
repo ของ marketplace ที่ clone มา และใช้เฉพาะแหล่งที่มาของพาธแบบ relative

ดู [`openclaw plugins` CLI reference](/th/cli/plugins) สำหรับรายละเอียดทั้งหมด

## ภาพรวม Plugin API

ปลั๊กอินแบบ native จะ export entry object ที่เปิดเผย `register(api)` ปลั๊กอินรุ่นเก่า
อาจยังใช้ `activate(api)` เป็นชื่อแฝงแบบเดิมอยู่ แต่ปลั๊กอินใหม่ควรใช้
`register`

```typescript
export default definePluginEntry({
  id: "my-plugin",
  name: "My Plugin",
  register(api) {
    api.registerProvider({
      /* ... */
    });
    api.registerTool({
      /* ... */
    });
    api.registerChannel({
      /* ... */
    });
  },
});
```

OpenClaw จะโหลด entry object แล้วเรียก `register(api)` ระหว่างการเปิดใช้ปลั๊กอิน
ตัวโหลดจะยังคง fallback ไปใช้ `activate(api)` สำหรับปลั๊กอินรุ่นเก่า
แต่ปลั๊กอิน bundled และปลั๊กอิน external ใหม่ควรมอง `register` เป็นสัญญาสาธารณะ

เมธอดการลงทะเบียนที่พบบ่อย:

| เมธอด | สิ่งที่ลงทะเบียน |
| --------------------------------------- | --------------------------- |
| `registerProvider` | ผู้ให้บริการโมเดล (LLM) |
| `registerChannel` | ช่องทางแชต |
| `registerTool` | เครื่องมือเอเจนต์ |
| `registerHook` / `on(...)` | lifecycle hooks |
| `registerSpeechProvider` | การแปลงข้อความเป็นเสียง / STT |
| `registerRealtimeTranscriptionProvider` | STT แบบสตรีม |
| `registerRealtimeVoiceProvider` | เสียงแบบเรียลไทม์สองทาง |
| `registerMediaUnderstandingProvider` | การวิเคราะห์ภาพ/เสียง |
| `registerImageGenerationProvider` | การสร้างภาพ |
| `registerMusicGenerationProvider` | การสร้างเพลง |
| `registerVideoGenerationProvider` | การสร้างวิดีโอ |
| `registerWebFetchProvider` | ผู้ให้บริการ web fetch / scrape |
| `registerWebSearchProvider` | การค้นหาเว็บ |
| `registerHttpRoute` | HTTP endpoint |
| `registerCommand` / `registerCli` | คำสั่ง CLI |
| `registerContextEngine` | context engine |
| `registerService` | บริการเบื้องหลัง |

พฤติกรรมของ hook guard สำหรับ lifecycle hooks แบบมีชนิด:

- `before_tool_call`: `{ block: true }` ถือเป็นผลลัพธ์สิ้นสุด; handler ที่มีลำดับความสำคัญต่ำกว่าจะถูกข้าม
- `before_tool_call`: `{ block: false }` ไม่มีผลใดๆ และไม่ล้าง block ก่อนหน้า
- `before_install`: `{ block: true }` ถือเป็นผลลัพธ์สิ้นสุด; handler ที่มีลำดับความสำคัญต่ำกว่าจะถูกข้าม
- `before_install`: `{ block: false }` ไม่มีผลใดๆ และไม่ล้าง block ก่อนหน้า
- `message_sending`: `{ cancel: true }` ถือเป็นผลลัพธ์สิ้นสุด; handler ที่มีลำดับความสำคัญต่ำกว่าจะถูกข้าม
- `message_sending`: `{ cancel: false }` ไม่มีผลใดๆ และไม่ล้าง cancel ก่อนหน้า

สำหรับพฤติกรรมของ typed hook แบบเต็ม ดู [SDK Overview](/th/plugins/sdk-overview#hook-decision-semantics)

## ที่เกี่ยวข้อง

- [Building Plugins](/th/plugins/building-plugins) — สร้างปลั๊กอินของคุณเอง
- [Plugin Bundles](/th/plugins/bundles) — ความเข้ากันได้ของ bundles แบบ Codex/Claude/Cursor
- [Plugin Manifest](/th/plugins/manifest) — สคีมา manifest
- [Registering Tools](/th/plugins/building-plugins#registering-agent-tools) — เพิ่มเครื่องมือเอเจนต์ในปลั๊กอิน
- [Plugin Internals](/th/plugins/architecture) — โมเดลความสามารถและไปป์ไลน์การโหลด
- [Community Plugins](/th/plugins/community) — รายการจากบุคคลที่สาม
