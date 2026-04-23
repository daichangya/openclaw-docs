---
read_when:
    - การติดตั้งหรือกำหนดค่า Plugins to=functions.read commentary ＿欧美json 福利彩票天天path":"docs/AGENTS.md","offset":1,"limit":200} code
    - การทำความเข้าใจการค้นพบ Plugin และกฎการโหลด to=functions.read commentary ＿一本道json արթpath":"docs/AGENTS.md","offset":1,"limit":200} code
    - การทำงานกับ bundle ของ Plugin ที่เข้ากันได้กับ Codex/Claude to=functions.read commentary ＿一本道json ೆಲ್ಲಿpath":"docs/AGENTS.md","offset":1,"limit":200} code
sidebarTitle: Install and Configure
summary: ติดตั้ง กำหนดค่า และจัดการ Plugins ของ OpenClaw
title: Plugins
x-i18n:
    generated_at: "2026-04-23T06:02:48Z"
    model: gpt-5.4
    provider: openai
    source_hash: 120c96e5b80b6dc9f6c842f9d04ada595f32e21a311128ae053828747a793033
    source_path: tools/plugin.md
    workflow: 15
---

# Plugins

Plugin ช่วยขยาย OpenClaw ด้วยความสามารถใหม่ ๆ: ช่องทาง, model provider,
เครื่องมือ, Skills, speech, realtime transcription, realtime voice,
media-understanding, image generation, video generation, web fetch, web
search และอีกมากมาย Plugin บางตัวเป็น **core** (มากับ OpenClaw), ส่วนบางตัวเป็น
**external** (เผยแพร่บน npm โดยชุมชน)

## เริ่มต้นอย่างรวดเร็ว

<Steps>
  <Step title="ดูว่ามีอะไรถูกโหลดอยู่บ้าง">
    ```bash
    openclaw plugins list
    ```
  </Step>

  <Step title="ติดตั้ง Plugin">
    ```bash
    # จาก npm
    openclaw plugins install @openclaw/voice-call

    # จากไดเรกทอรีหรือ archive ในเครื่อง
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

หากคุณต้องการควบคุมผ่านแชตแบบ native ให้เปิด `commands.plugins: true` และใช้:

```text
/plugin install clawhub:@openclaw/voice-call
/plugin show voice-call
/plugin enable voice-call
```

พาธการติดตั้งใช้ resolver ตัวเดียวกับ CLI: local path/archive, `clawhub:<pkg>` แบบ explicit หรือ package spec แบบเปล่า (ClawHub ก่อน แล้ว fallback ไป npm)

หาก config ไม่ถูกต้อง การติดตั้งจะล้มเหลวแบบ fail closed ตามปกติและชี้คุณไปที่
`openclaw doctor --fix` ข้อยกเว้นด้านการกู้คืนมีเพียงพาธติดตั้งใหม่ของ Plugin ที่มากับระบบแบบแคบสำหรับ Plugin ที่เลือกใช้
`openclaw.install.allowInvalidConfigRecovery`

แพ็กเกจติดตั้งของ OpenClaw จะไม่ติดตั้งต้นไม้ dependency ของ runtime สำหรับ Plugin ที่มากับระบบทุกตัวแบบ eager หาก Plugin ที่ OpenClaw เป็นเจ้าของและมากับระบบกำลังใช้งานอยู่จาก
config ของ Plugin, config ของช่องทางแบบเดิม หรือ manifest ที่เปิดใช้โดยค่าเริ่มต้น การซ่อมแซมระหว่างเริ่มต้นระบบจะติดตั้งเฉพาะ runtime dependency ที่ Plugin นั้นประกาศไว้ก่อน import เท่านั้น
Plugin ภายนอกและพาธโหลดแบบกำหนดเองยังคงต้องติดตั้งผ่าน
`openclaw plugins install`

## ประเภทของ Plugin

OpenClaw รู้จัก Plugin สองรูปแบบ:

| รูปแบบ     | วิธีการทำงาน                                                      | ตัวอย่าง                                                |
| ---------- | ----------------------------------------------------------------- | ------------------------------------------------------- |
| **Native** | `openclaw.plugin.json` + runtime module; รันในโปรเซสเดียวกัน      | Plugin ทางการ, แพ็กเกจ npm จากชุมชน                    |
| **Bundle** | layout ที่เข้ากันได้กับ Codex/Claude/Cursor; แมปไปยังความสามารถของ OpenClaw | `.codex-plugin/`, `.claude-plugin/`, `.cursor-plugin/` |

ทั้งสองแบบจะแสดงใน `openclaw plugins list` ดู [Plugin Bundles](/th/plugins/bundles) สำหรับรายละเอียดของ bundle

หากคุณกำลังเขียน Plugin แบบ native ให้เริ่มด้วย [Building Plugins](/th/plugins/building-plugins)
และ [Plugin SDK Overview](/th/plugins/sdk-overview)

## Plugin ทางการ

### ติดตั้งได้ (npm)

| Plugin          | Package                | เอกสาร                               |
| --------------- | ---------------------- | ------------------------------------ |
| Matrix          | `@openclaw/matrix`     | [Matrix](/th/channels/matrix)           |
| Microsoft Teams | `@openclaw/msteams`    | [Microsoft Teams](/th/channels/msteams) |
| Nostr           | `@openclaw/nostr`      | [Nostr](/th/channels/nostr)             |
| Voice Call      | `@openclaw/voice-call` | [Voice Call](/th/plugins/voice-call)    |
| Zalo            | `@openclaw/zalo`       | [Zalo](/th/channels/zalo)               |
| Zalo Personal   | `@openclaw/zalouser`   | [Zalo Personal](/th/plugins/zalouser)   |

### Core (มากับ OpenClaw)

<AccordionGroup>
  <Accordion title="Model provider (เปิดใช้โดยค่าเริ่มต้น)">
    `anthropic`, `byteplus`, `cloudflare-ai-gateway`, `github-copilot`, `google`,
    `huggingface`, `kilocode`, `kimi-coding`, `minimax`, `mistral`, `qwen`,
    `moonshot`, `nvidia`, `openai`, `opencode`, `opencode-go`, `openrouter`,
    `qianfan`, `synthetic`, `together`, `venice`,
    `vercel-ai-gateway`, `volcengine`, `xiaomi`, `zai`
  </Accordion>

  <Accordion title="Memory plugin">
    - `memory-core` — memory search แบบ bundled (ค่าเริ่มต้นผ่าน `plugins.slots.memory`)
    - `memory-lancedb` — long-term memory แบบติดตั้งเมื่อร้องขอ พร้อม auto-recall/capture (ตั้ง `plugins.slots.memory = "memory-lancedb"`)
  </Accordion>

  <Accordion title="Speech provider (เปิดใช้โดยค่าเริ่มต้น)">
    `elevenlabs`, `microsoft`
  </Accordion>

  <Accordion title="อื่น ๆ">
    - `browser` — Plugin browser แบบ bundled สำหรับเครื่องมือ browser, CLI `openclaw browser`, เมธอด gateway `browser.request`, browser runtime และบริการ browser control เริ่มต้น (เปิดใช้โดยค่าเริ่มต้น; ให้ปิดก่อนหากคุณจะเปลี่ยนแทน)
    - `copilot-proxy` — สะพาน VS Code Copilot Proxy (ปิดโดยค่าเริ่มต้น)
  </Accordion>
</AccordionGroup>

กำลังมองหา Plugin จากบุคคลที่สามอยู่หรือ? ดู [Community Plugins](/th/plugins/community)

## การกำหนดค่า

```json5
{
  plugins: {
    enabled: true,
    allow: ["voice-call"],
    deny: ["untrusted-plugin"],
    load: { paths: ["~/Projects/oss/voice-call-extension"] },
    entries: {
      "voice-call": { enabled: true, config: { provider: "twilio" } },
    },
  },
}
```

| ฟิลด์            | คำอธิบาย                                                 |
| ---------------- | -------------------------------------------------------- |
| `enabled`        | สวิตช์หลัก (ค่าเริ่มต้น: `true`)                        |
| `allow`          | allowlist ของ Plugin (ไม่บังคับ)                        |
| `deny`           | denylist ของ Plugin (ไม่บังคับ; deny มีผลเหนือกว่า)      |
| `load.paths`     | ไฟล์/ไดเรกทอรี Plugin เพิ่มเติม                          |
| `slots`          | ตัวเลือก slot แบบ exclusive (เช่น `memory`, `contextEngine`) |
| `entries.\<id\>` | สวิตช์ + config ต่อ Plugin                               |

การเปลี่ยนแปลง config **ต้องรีสตาร์ต gateway** หาก Gateway กำลังรันพร้อม config
watch + in-process restart enabled (ค่าเริ่มต้นของ `openclaw gateway`) การรีสตาร์ตนั้น
มักจะเกิดขึ้นอัตโนมัติไม่นานหลังจากที่มีการเขียน config

<Accordion title="สถานะของ Plugin: disabled vs missing vs invalid">
  - **Disabled**: มี Plugin อยู่ แต่กฎการเปิดใช้งานทำให้มันถูกปิด Config ยังคงถูกเก็บไว้
  - **Missing**: config อ้างอิงรหัส Plugin ที่การค้นพบหาไม่พบ
  - **Invalid**: มี Plugin อยู่ แต่ config ของมันไม่ตรงกับ schema ที่ประกาศไว้
</Accordion>

## การค้นพบและลำดับความสำคัญ

OpenClaw สแกนหา Plugin ตามลำดับนี้ (พบก่อนชนะ):

<Steps>
  <Step title="พาธจาก config">
    `plugins.load.paths` — พาธไฟล์หรือไดเรกทอรีที่ระบุแบบ explicit
  </Step>

  <Step title="ส่วนขยายของ workspace">
    `\<workspace\>/.openclaw/<plugin-root>/*.ts` และ `\<workspace\>/.openclaw/<plugin-root>/*/index.ts`
  </Step>

  <Step title="ส่วนขยายระดับ global">
    `~/.openclaw/<plugin-root>/*.ts` และ `~/.openclaw/<plugin-root>/*/index.ts`
  </Step>

  <Step title="Plugin ที่มากับระบบ">
    มาพร้อมกับ OpenClaw หลายตัวเปิดใช้โดยค่าเริ่มต้น (model provider, speech)
    ส่วนตัวอื่นต้องเปิดใช้อย่างชัดเจน
  </Step>
</Steps>

### กฎการเปิดใช้งาน

- `plugins.enabled: false` ปิด Plugin ทั้งหมด
- `plugins.deny` มีผลเหนือ allow เสมอ
- `plugins.entries.\<id\>.enabled: false` ปิด Plugin นั้น
- Plugin ที่มาจาก workspace จะ **ปิดโดยค่าเริ่มต้น** (ต้องเปิดใช้อย่างชัดเจน)
- Plugin ที่มากับระบบจะเป็นไปตามชุดค่าเริ่มต้นที่เปิดไว้ ยกเว้นมีการ override
- slot แบบ exclusive อาจบังคับเปิด Plugin ที่ถูกเลือกสำหรับ slot นั้น

## Plugin slot (หมวดหมู่แบบ exclusive)

บางหมวดหมู่เป็นแบบ exclusive (มีได้เพียงหนึ่งตัวที่ active ในเวลาเดียวกัน):

```json5
{
  plugins: {
    slots: {
      memory: "memory-core", // หรือ "none" เพื่อปิด
      contextEngine: "legacy", // หรือรหัส Plugin
    },
  },
}
```

| Slot            | สิ่งที่ควบคุม            | ค่าเริ่มต้น         |
| --------------- | ------------------------ | ------------------- |
| `memory`        | memory plugin ที่ active  | `memory-core`       |
| `contextEngine` | context engine ที่ active | `legacy` (built-in) |

## เอกสารอ้างอิง CLI

```bash
openclaw plugins list                       # inventory แบบย่อ
openclaw plugins list --enabled            # เฉพาะ Plugin ที่โหลดแล้ว
openclaw plugins list --verbose            # รายละเอียดต่อ Plugin
openclaw plugins list --json               # inventory แบบอ่านได้ด้วยเครื่อง
openclaw plugins inspect <id>              # รายละเอียดเชิงลึก
openclaw plugins inspect <id> --json       # แบบอ่านได้ด้วยเครื่อง
openclaw plugins inspect --all             # ตารางทั้งระบบ
openclaw plugins info <id>                 # alias ของ inspect
openclaw plugins doctor                    # การวินิจฉัย

openclaw plugins install <package>         # ติดตั้ง (ClawHub ก่อน แล้ว npm)
openclaw plugins install clawhub:<pkg>     # ติดตั้งจาก ClawHub เท่านั้น
openclaw plugins install <spec> --force    # เขียนทับการติดตั้งที่มีอยู่
openclaw plugins install <path>            # ติดตั้งจากพาธในเครื่อง
openclaw plugins install -l <path>         # ลิงก์ (ไม่คัดลอก) สำหรับงาน dev
openclaw plugins install <plugin> --marketplace <source>
openclaw plugins install <plugin> --marketplace https://github.com/<owner>/<repo>
openclaw plugins install <spec> --pin      # บันทึก npm spec ที่ resolve แล้วแบบ exact
openclaw plugins install <spec> --dangerously-force-unsafe-install
openclaw plugins update <id-or-npm-spec> # อัปเดต Plugin เดียว
openclaw plugins update <id-or-npm-spec> --dangerously-force-unsafe-install
openclaw plugins update --all            # อัปเดตทั้งหมด
openclaw plugins uninstall <id>          # ลบเรคคอร์ด config/install
openclaw plugins uninstall <id> --keep-files
openclaw plugins marketplace list <source>
openclaw plugins marketplace list <source> --json

openclaw plugins enable <id>
openclaw plugins disable <id>
```

Plugin ที่มากับระบบจะมากับ OpenClaw หลายตัวถูกเปิดใช้โดยค่าเริ่มต้น (เช่น
model provider แบบ bundled, speech provider แบบ bundled และ browser
plugin แบบ bundled) ส่วน bundled plugin อื่นยังคงต้องใช้ `openclaw plugins enable <id>`

`--force` จะเขียนทับ Plugin หรือ hook pack ที่ติดตั้งอยู่แล้วในตำแหน่งเดิม ใช้
`openclaw plugins update <id-or-npm-spec>` สำหรับการอัปเกรดตามปกติของ npm
plugin ที่ถูกติดตามไว้ มันไม่รองรับร่วมกับ `--link` ซึ่งนำพาธต้นทางกลับมาใช้แทน
การคัดลอกไปยังเป้าหมายที่จัดการโดยระบบ

`openclaw plugins update <id-or-npm-spec>` ใช้กับการติดตั้งที่ติดตามอยู่ การส่ง
npm package spec พร้อม dist-tag หรือเวอร์ชันแบบ exact จะ resolve ชื่อแพ็กเกจ
กลับไปยังเรคคอร์ด Plugin ที่ติดตามไว้ และบันทึก spec ใหม่สำหรับการอัปเดตในอนาคต
การส่งชื่อแพ็กเกจโดยไม่มีเวอร์ชันจะย้าย npm plugin ที่ติดตั้งแบบ pin exact กลับไปยัง release line เริ่มต้นของ registry หาก npm plugin ที่ติดตั้งอยู่ตรงกับ
เวอร์ชันที่ resolve และ identity ของ artifact ที่บันทึกไว้แล้ว OpenClaw จะข้ามการอัปเดต
โดยไม่ดาวน์โหลด ติดตั้งใหม่ หรือเขียน config ใหม่

`--pin` ใช้ได้กับ npm เท่านั้น ไม่รองรับร่วมกับ `--marketplace` เพราะ
การติดตั้งจาก marketplace จะคง metadata ของแหล่ง marketplace แทน npm spec

`--dangerously-force-unsafe-install` เป็น override แบบ break-glass สำหรับ false
positive จากตัวสแกนโค้ดอันตรายแบบ built-in มันอนุญาตให้การติดตั้ง Plugin
และการอัปเดต Plugin ดำเนินต่อไปแม้จะมี finding ระดับ `critical` จาก built-in แต่ก็ยัง
ไม่ข้ามการบล็อกจากนโยบาย `before_install` ของ Plugin หรือการบล็อกจากความล้มเหลวของการสแกน

แฟล็ก CLI นี้ใช้กับโฟลว์ติดตั้ง/อัปเดต Plugin เท่านั้น การติดตั้ง dependency ของ skill ที่ขับเคลื่อนโดย Gateway ใช้ override คำขอ `dangerouslyForceUnsafeInstall` ที่ตรงกันแทน ขณะที่ `openclaw skills install` ยังคงเป็นโฟลว์ดาวน์โหลด/ติดตั้ง skill จาก ClawHub แยกต่างหาก

bundle ที่เข้ากันได้จะเข้าร่วมในโฟลว์ list/inspect/enable/disable ของ Plugin แบบเดียวกัน การรองรับขณะรันไทม์ปัจจุบันรวมถึง skill ของ bundle, Claude command-skill,
ค่าเริ่มต้น `settings.json` ของ Claude, ค่าเริ่มต้นจาก Claude `.lsp.json` และ `lspServers` ที่ประกาศใน manifest, Cursor command-skill และไดเรกทอรี hook ของ Codex ที่เข้ากันได้

`openclaw plugins inspect <id>` จะรายงานความสามารถของ bundle ที่ตรวจพบ รวมถึงรายการ MCP และ LSP server ที่รองรับหรือไม่รองรับสำหรับ Plugin ที่รองรับด้วย bundle อีกด้วย

แหล่ง marketplace อาจเป็นชื่อ known-marketplace ของ Claude จาก
`~/.claude/plugins/known_marketplaces.json`, root ของ marketplace ในเครื่อง หรือพาธ
`marketplace.json`, shorthand ของ GitHub เช่น `owner/repo`, URL ของ GitHub repo หรือ git URL สำหรับ marketplace ระยะไกล รายการของ Plugin ต้องอยู่ภายใน
repo ของ marketplace ที่ถูก clone และใช้เฉพาะแหล่งที่เป็นพาธแบบ relative เท่านั้น

ดู [`openclaw plugins` CLI reference](/cli/plugins) สำหรับรายละเอียดทั้งหมด

## ภาพรวม API ของ Plugin

Plugin แบบ native จะ export entry object ที่เปิดเผย `register(api)` Plugin รุ่นเก่า
อาจยังใช้ `activate(api)` เป็น alias แบบเดิมอยู่ แต่ Plugin ใหม่ควรใช้ `register`

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

OpenClaw จะโหลด entry object และเรียก `register(api)` ระหว่างการเปิดใช้งาน Plugin ตัวโหลดจะยัง fallback ไปที่ `activate(api)` สำหรับ Plugin รุ่นเก่า
แต่ bundled plugin และ external plugin ใหม่ควรมอง `register` ว่าเป็นสัญญาแบบสาธารณะ

เมธอดการลงทะเบียนที่ใช้บ่อย:

| เมธอด                                  | สิ่งที่มันลงทะเบียน             |
| --------------------------------------- | ------------------------------- |
| `registerProvider`                      | Model provider (LLM)            |
| `registerChannel`                       | Chat channel                    |
| `registerTool`                          | เครื่องมือของเอเจนต์            |
| `registerHook` / `on(...)`              | hook ของวงจรชีวิต              |
| `registerSpeechProvider`                | Text-to-speech / STT            |
| `registerRealtimeTranscriptionProvider` | Streaming STT                   |
| `registerRealtimeVoiceProvider`         | Duplex realtime voice           |
| `registerMediaUnderstandingProvider`    | การวิเคราะห์ภาพ/เสียง          |
| `registerImageGenerationProvider`       | การสร้างภาพ                    |
| `registerMusicGenerationProvider`       | การสร้างเพลง                   |
| `registerVideoGenerationProvider`       | การสร้างวิดีโอ                 |
| `registerWebFetchProvider`              | provider สำหรับ web fetch / scrape |
| `registerWebSearchProvider`             | Web search                      |
| `registerHttpRoute`                     | HTTP endpoint                   |
| `registerCommand` / `registerCli`       | คำสั่ง CLI                      |
| `registerContextEngine`                 | Context engine                  |
| `registerService`                       | Background service              |

พฤติกรรมของ hook guard สำหรับ lifecycle hook แบบมีชนิดข้อมูล:

- `before_tool_call`: `{ block: true }` เป็นคำตัดสินสุดท้าย; handler ที่มีลำดับความสำคัญต่ำกว่าจะถูกข้าม
- `before_tool_call`: `{ block: false }` เป็น no-op และจะไม่ล้างการ block ก่อนหน้า
- `before_install`: `{ block: true }` เป็นคำตัดสินสุดท้าย; handler ที่มีลำดับความสำคัญต่ำกว่าจะถูกข้าม
- `before_install`: `{ block: false }` เป็น no-op และจะไม่ล้างการ block ก่อนหน้า
- `message_sending`: `{ cancel: true }` เป็นคำตัดสินสุดท้าย; handler ที่มีลำดับความสำคัญต่ำกว่าจะถูกข้าม
- `message_sending`: `{ cancel: false }` เป็น no-op และจะไม่ล้างการ cancel ก่อนหน้า

สำหรับพฤติกรรมเต็มของ hook แบบมีชนิดข้อมูล ดู [SDK Overview](/th/plugins/sdk-overview#hook-decision-semantics)

## ที่เกี่ยวข้อง

- [Building Plugins](/th/plugins/building-plugins) — สร้าง Plugin ของคุณเอง
- [Plugin Bundles](/th/plugins/bundles) — ความเข้ากันได้ของ bundle สำหรับ Codex/Claude/Cursor
- [Plugin Manifest](/th/plugins/manifest) — schema ของ manifest
- [Registering Tools](/th/plugins/building-plugins#registering-agent-tools) — เพิ่มเครื่องมือของเอเจนต์ใน Plugin
- [Plugin Internals](/th/plugins/architecture) — capability model และ pipeline การโหลด
- [Community Plugins](/th/plugins/community) — รายการจากบุคคลที่สาม
