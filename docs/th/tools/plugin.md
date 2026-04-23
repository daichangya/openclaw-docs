---
read_when:
    - การติดตั้งหรือการกำหนดค่า Plugin
    - ทำความเข้าใจกฎการค้นหาและการโหลด Plugin
    - การทำงานกับชุด Plugin ที่เข้ากันได้กับ Codex/Claude
sidebarTitle: Install and Configure
summary: ติดตั้ง กำหนดค่า และจัดการ Plugin ของ OpenClaw
title: Plugin
x-i18n:
    generated_at: "2026-04-23T06:08:16Z"
    model: gpt-5.4
    provider: openai
    source_hash: fb81789de548aed0cd0404e8c42a2d9ce00d0e9163f944e07237b164d829ac40
    source_path: tools/plugin.md
    workflow: 15
---

# Plugin

Plugin ช่วยขยายความสามารถของ OpenClaw ด้วยความสามารถใหม่ๆ เช่น channels, ผู้ให้บริการโมเดล, tools, Skills, speech, การถอดเสียงแบบเรียลไทม์, เสียงแบบเรียลไทม์, การทำความเข้าใจสื่อ, การสร้างภาพ, การสร้างวิดีโอ, การดึงข้อมูลเว็บ, การค้นหาเว็บ และอื่นๆ อีกมากมาย Plugin บางตัวเป็น **core** (มาพร้อมกับ OpenClaw) ขณะที่บางตัวเป็น **external** (เผยแพร่บน npm โดยชุมชน)

## เริ่มต้นอย่างรวดเร็ว

<Steps>
  <Step title="ดูว่ามีอะไรถูกโหลดอยู่บ้าง">
    ```bash
    openclaw plugins list
    ```
  </Step>

  <Step title="ติดตั้ง Plugin">
    ```bash
    # From npm
    openclaw plugins install @openclaw/voice-call

    # From a local directory or archive
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

หากคุณต้องการควบคุมผ่านแชตโดยตรง ให้เปิดใช้ `commands.plugins: true` แล้วใช้:

```text
/plugin install clawhub:@openclaw/voice-call
/plugin show voice-call
/plugin enable voice-call
```

เส้นทางการติดตั้งใช้ตัวแก้ไขเดียวกับ CLI: path/archive ในเครื่อง, `clawhub:<pkg>` แบบระบุชัดเจน หรือ package spec แบบไม่ระบุแหล่ง (ClawHub ก่อน แล้ว fallback ไป npm)

หาก config ไม่ถูกต้อง โดยปกติการติดตั้งจะล้มเหลวแบบปิดไว้ก่อนและชี้ให้คุณไปใช้ `openclaw doctor --fix` ข้อยกเว้นการกู้คืนเพียงอย่างเดียวคือเส้นทางการติดตั้งใหม่ของ bundled-plugin แบบจำกัด สำหรับ Plugin ที่เลือกใช้
`openclaw.install.allowInvalidConfigRecovery`

การติดตั้ง OpenClaw แบบแพ็กเกจจะไม่ติดตั้ง dependency runtime tree ของ bundled plugin ทุกตัวล่วงหน้าแบบ eager เมื่อ bundled plugin ที่ OpenClaw เป็นเจ้าของถูกเปิดใช้งานจาก plugin config, legacy channel config หรือ manifest ที่เปิดใช้งานเป็นค่าเริ่มต้น การซ่อมแซมระหว่างเริ่มต้นระบบจะซ่อมเฉพาะ declared runtime dependencies ของ Plugin นั้นก่อน import เท่านั้น ส่วน external plugins และ custom load paths ยังต้องติดตั้งผ่าน `openclaw plugins install`

## ประเภทของ Plugin

OpenClaw รู้จัก Plugin อยู่สองรูปแบบ:

| รูปแบบ     | วิธีการทำงาน                                                       | ตัวอย่าง                                                |
| ---------- | ------------------------------------------------------------------ | ------------------------------------------------------ |
| **Native** | `openclaw.plugin.json` + โมดูล runtime; ทำงานใน process เดียวกัน  | Official plugins, community npm packages               |
| **Bundle** | เลย์เอาต์ที่เข้ากันได้กับ Codex/Claude/Cursor; แมปไปยังความสามารถของ OpenClaw | `.codex-plugin/`, `.claude-plugin/`, `.cursor-plugin/` |

ทั้งสองแบบจะแสดงใน `openclaw plugins list` ดูรายละเอียดของ bundle ได้ที่ [Plugin Bundles](/th/plugins/bundles)

หากคุณกำลังเขียน native plugin ให้เริ่มที่ [Building Plugins](/th/plugins/building-plugins)
และ [ภาพรวม Plugin SDK](/th/plugins/sdk-overview)

## Official plugins

### ติดตั้งได้ (npm)

| Plugin          | Package                | เอกสาร                              |
| --------------- | ---------------------- | ----------------------------------- |
| Matrix          | `@openclaw/matrix`     | [Matrix](/th/channels/matrix)          |
| Microsoft Teams | `@openclaw/msteams`    | [Microsoft Teams](/th/channels/msteams) |
| Nostr           | `@openclaw/nostr`      | [Nostr](/th/channels/nostr)            |
| Voice Call      | `@openclaw/voice-call` | [Voice Call](/th/plugins/voice-call)   |
| Zalo            | `@openclaw/zalo`       | [Zalo](/th/channels/zalo)              |
| Zalo Personal   | `@openclaw/zalouser`   | [Zalo Personal](/th/plugins/zalouser)  |

### Core (มาพร้อมกับ OpenClaw)

<AccordionGroup>
  <Accordion title="ผู้ให้บริการโมเดล (เปิดใช้งานโดยค่าเริ่มต้น)">
    `anthropic`, `byteplus`, `cloudflare-ai-gateway`, `github-copilot`, `google`,
    `huggingface`, `kilocode`, `kimi-coding`, `minimax`, `mistral`, `qwen`,
    `moonshot`, `nvidia`, `openai`, `opencode`, `opencode-go`, `openrouter`,
    `qianfan`, `synthetic`, `together`, `venice`,
    `vercel-ai-gateway`, `volcengine`, `xiaomi`, `zai`
  </Accordion>

  <Accordion title="Plugin หน่วยความจำ">
    - `memory-core` — การค้นหาหน่วยความจำแบบ bundled (ค่าเริ่มต้นผ่าน `plugins.slots.memory`)
    - `memory-lancedb` — หน่วยความจำระยะยาวแบบติดตั้งเมื่อจำเป็น พร้อม auto-recall/capture (ตั้งค่า `plugins.slots.memory = "memory-lancedb"`)
  </Accordion>

  <Accordion title="ผู้ให้บริการ speech (เปิดใช้งานโดยค่าเริ่มต้น)">
    `elevenlabs`, `microsoft`
  </Accordion>

  <Accordion title="อื่นๆ">
    - `browser` — browser plugin แบบ bundled สำหรับ browser tool, CLI `openclaw browser`, เมธอด Gateway `browser.request`, browser runtime และบริการควบคุมเบราว์เซอร์เริ่มต้น (เปิดใช้งานโดยค่าเริ่มต้น; ปิดก่อนหากต้องการแทนที่)
    - `copilot-proxy` — บริดจ์ VS Code Copilot Proxy (ปิดโดยค่าเริ่มต้น)
  </Accordion>
</AccordionGroup>

กำลังมองหา third-party plugins อยู่ใช่ไหม ดูได้ที่ [Community Plugins](/th/plugins/community)

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

| ฟิลด์            | คำอธิบาย                                                   |
| ---------------- | ---------------------------------------------------------- |
| `enabled`        | สวิตช์หลัก (ค่าเริ่มต้น: `true`)                           |
| `allow`          | allowlist ของ Plugin (ไม่บังคับ)                           |
| `deny`           | denylist ของ Plugin (ไม่บังคับ; deny มีสิทธิ์เหนือกว่า)    |
| `load.paths`     | ไฟล์/ไดเรกทอรี Plugin เพิ่มเติม                            |
| `slots`          | ตัวเลือก slot แบบ exclusive (เช่น `memory`, `contextEngine`) |
| `entries.\<id\>` | การเปิด/ปิดและ config ราย Plugin                           |

การเปลี่ยนแปลง config **ต้องรีสตาร์ต gateway** หาก Gateway กำลังทำงานโดยเปิดใช้การเฝ้าดู config + การรีสตาร์ตภายใน process (ซึ่งเป็นเส้นทางเริ่มต้นของ `openclaw gateway`) โดยปกติการรีสตาร์ตนั้นจะถูกดำเนินการโดยอัตโนมัติไม่นานหลังจากมีการเขียน config

<Accordion title="สถานะของ Plugin: disabled vs missing vs invalid">
  - **Disabled**: มี Plugin อยู่ แต่กฎการเปิดใช้งานทำให้ถูกปิดไว้ Config จะยังคงถูกเก็บไว้
  - **Missing**: config อ้างอิง plugin id ที่การค้นหาไม่พบ
  - **Invalid**: มี Plugin อยู่ แต่ config ไม่ตรงกับ schema ที่ประกาศไว้
</Accordion>

## การค้นหาและลำดับความสำคัญ

OpenClaw สแกนหา Plugin ตามลำดับนี้ (ที่ตรงกันตัวแรกจะชนะ):

<Steps>
  <Step title="Path ใน config">
    `plugins.load.paths` — path ของไฟล์หรือไดเรกทอรีที่ระบุชัดเจน
  </Step>

  <Step title="Workspace plugins">
    `\<workspace\>/.openclaw/<plugin-root>/*.ts` และ `\<workspace\>/.openclaw/<plugin-root>/*/index.ts`
  </Step>

  <Step title="Global plugins">
    `~/.openclaw/<plugin-root>/*.ts` และ `~/.openclaw/<plugin-root>/*/index.ts`
  </Step>

  <Step title="Bundled plugins">
    มาพร้อมกับ OpenClaw หลายตัวเปิดใช้งานโดยค่าเริ่มต้น (ผู้ให้บริการโมเดล, speech)
    ส่วนตัวอื่นต้องเปิดใช้งานอย่างชัดเจน
  </Step>
</Steps>

### กฎการเปิดใช้งาน

- `plugins.enabled: false` ปิด Plugin ทั้งหมด
- `plugins.deny` มีสิทธิ์เหนือกว่า `allow` เสมอ
- `plugins.entries.\<id\>.enabled: false` ปิด Plugin นั้น
- Plugin ที่มาจาก workspace จะ **ถูกปิดโดยค่าเริ่มต้น** (ต้องเปิดใช้งานอย่างชัดเจน)
- Bundled plugins จะทำตามชุดที่เปิดไว้เป็นค่าเริ่มต้นในตัว เว้นแต่จะถูก override
- slot แบบ exclusive สามารถบังคับเปิด Plugin ที่ถูกเลือกสำหรับ slot นั้นได้

## Plugin slots (หมวดหมู่แบบ exclusive)

บางหมวดหมู่เป็นแบบ exclusive (เปิดใช้งานได้ครั้งละหนึ่งตัวเท่านั้น):

```json5
{
  plugins: {
    slots: {
      memory: "memory-core", // or "none" to disable
      contextEngine: "legacy", // or a plugin id
    },
  },
}
```

| Slot            | ควบคุมอะไร               | ค่าเริ่มต้น          |
| --------------- | ------------------------ | -------------------- |
| `memory`        | Active Memory plugin     | `memory-core`        |
| `contextEngine` | กลไก context ที่ใช้งานอยู่ | `legacy` (มีมาในตัว) |

## เอกสารอ้างอิง CLI

```bash
openclaw plugins list                       # inventory แบบย่อ
openclaw plugins list --enabled            # เฉพาะ Plugin ที่ถูกโหลด
openclaw plugins list --verbose            # บรรทัดรายละเอียดราย Plugin
openclaw plugins list --json               # inventory สำหรับเครื่องอ่าน
openclaw plugins inspect <id>              # รายละเอียดเชิงลึก
openclaw plugins inspect <id> --json       # สำหรับเครื่องอ่าน
openclaw plugins inspect --all             # ตารางทั้งชุด
openclaw plugins info <id>                 # alias ของ inspect
openclaw plugins doctor                    # การวินิจฉัย

openclaw plugins install <package>         # ติดตั้ง (ClawHub ก่อน แล้วค่อย npm)
openclaw plugins install clawhub:<pkg>     # ติดตั้งจาก ClawHub เท่านั้น
openclaw plugins install <spec> --force    # เขียนทับการติดตั้งที่มีอยู่
openclaw plugins install <path>            # ติดตั้งจาก path ในเครื่อง
openclaw plugins install -l <path>         # link (ไม่คัดลอก) สำหรับการพัฒนา
openclaw plugins install <plugin> --marketplace <source>
openclaw plugins install <plugin> --marketplace https://github.com/<owner>/<repo>
openclaw plugins install <spec> --pin      # บันทึก npm spec ที่ resolve แล้วแบบตรงตัว
openclaw plugins install <spec> --dangerously-force-unsafe-install
openclaw plugins update <id-or-npm-spec> # อัปเดต Plugin เดียว
openclaw plugins update <id-or-npm-spec> --dangerously-force-unsafe-install
openclaw plugins update --all            # อัปเดตทั้งหมด
openclaw plugins uninstall <id>          # ลบระเบียน config/install
openclaw plugins uninstall <id> --keep-files
openclaw plugins marketplace list <source>
openclaw plugins marketplace list <source> --json

openclaw plugins enable <id>
openclaw plugins disable <id>
```

Bundled plugins มาพร้อมกับ OpenClaw หลายตัวเปิดใช้งานโดยค่าเริ่มต้น (ตัวอย่างเช่น bundled model providers, bundled speech providers และ bundled browser plugin) ส่วน bundled plugins อื่นยังคงต้องใช้ `openclaw plugins enable <id>`

`--force` จะเขียนทับ Plugin หรือ hook pack ที่ติดตั้งไว้แล้วในตำแหน่งเดิม ใช้
`openclaw plugins update <id-or-npm-spec>` สำหรับการอัปเกรดตามปกติของ tracked npm
plugins โดยไม่รองรับการใช้ร่วมกับ `--link` ซึ่งจะนำ source path เดิมกลับมาใช้แทน
การคัดลอกไปยัง managed install target

`openclaw plugins update <id-or-npm-spec>` ใช้กับการติดตั้งที่มีการติดตามอยู่ การส่ง
npm package spec ที่มี dist-tag หรือเวอร์ชันแบบตรงตัว จะ resolve ชื่อ package
กลับไปยัง tracked plugin record และบันทึก spec ใหม่ไว้สำหรับการอัปเดตครั้งถัดไป
การส่งชื่อ package โดยไม่มีเวอร์ชัน จะย้ายการติดตั้งแบบปักหมุดตรงตัวกลับไปยัง
สายรีลีสเริ่มต้นของ registry หาก npm plugin ที่ติดตั้งไว้ตรงกับเวอร์ชันที่ resolve ได้
และตรงกับ artifact identity ที่บันทึกไว้แล้ว OpenClaw จะข้ามการอัปเดตโดยไม่ดาวน์โหลด
ติดตั้งใหม่ หรือเขียน config ใหม่

`--pin` ใช้ได้กับ npm เท่านั้น ไม่รองรับร่วมกับ `--marketplace` เพราะการติดตั้งจาก
marketplace จะบันทึก metadata ของแหล่ง marketplace แทน npm spec

`--dangerously-force-unsafe-install` เป็นตัว override แบบใช้งานฉุกเฉินสำหรับ false
positive จากตัวสแกนโค้ดอันตรายในตัว ระบบจะอนุญาตให้การติดตั้งและการอัปเดต Plugin
ดำเนินต่อไปแม้จะพบผลการตรวจจับระดับ `critical` จากในตัว แต่ยังคงไม่ข้าม policy block
ของ plugin `before_install` หรือการบล็อกจากการสแกนล้มเหลว

แฟล็ก CLI นี้ใช้กับ flow การติดตั้ง/อัปเดต Plugin เท่านั้น การติดตั้ง dependency ของ Skills ที่ขับเคลื่อนด้วย Gateway จะใช้ request override ที่สอดคล้องกันคือ `dangerouslyForceUnsafeInstall` แทน ส่วน `openclaw skills install` ยังคงเป็น flow แยกต่างหากสำหรับการดาวน์โหลด/ติดตั้ง Skills จาก ClawHub

bundle ที่เข้ากันได้จะเข้าร่วมใน flow เดียวกันของการ list/inspect/enable/disable Plugin การรองรับ runtime ปัจจุบันครอบคลุม bundle Skills, Claude command-skills,
ค่าเริ่มต้นของ Claude `settings.json`, ค่าเริ่มต้นของ Claude `.lsp.json` และ `lspServers` ที่ประกาศใน manifest, Cursor command-skills และไดเรกทอรี Codex hook ที่เข้ากันได้

`openclaw plugins inspect <id>` ยังรายงานความสามารถของ bundle ที่ตรวจพบ รวมถึงรายการ MCP และ LSP server ที่รองรับหรือไม่รองรับสำหรับ bundle-backed plugins ด้วย

แหล่ง marketplace สามารถเป็นชื่อ known-marketplace ของ Claude จาก
`~/.claude/plugins/known_marketplaces.json`, root ของ marketplace ในเครื่อง หรือ
path ของ `marketplace.json`, ชื่อย่อ GitHub เช่น `owner/repo`, URL ของ GitHub repo
หรือ URL ของ git ก็ได้ สำหรับ marketplace ระยะไกล รายการ Plugin ต้องอยู่ภายใน
repo marketplace ที่ถูก clone และใช้เฉพาะแหล่งที่มาแบบ relative path เท่านั้น

ดูรายละเอียดทั้งหมดได้ที่[เอกสารอ้างอิง CLI `openclaw plugins`](/cli/plugins)

## ภาพรวม Plugin API

native plugins จะ export entry object ที่เปิดให้ใช้ `register(api)` ได้ Plugin รุ่นเก่า
อาจยังใช้ `activate(api)` เป็น alias แบบ legacy ได้อยู่ แต่ Plugin ใหม่ควรใช้
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

OpenClaw จะโหลด entry object และเรียก `register(api)` ระหว่างการเปิดใช้งาน Plugin
loader ยังคง fallback ไปใช้ `activate(api)` สำหรับ Plugin รุ่นเก่า แต่ bundled plugins
และ external plugins ใหม่ควรมองว่า `register` เป็น public contract

เมธอดการลงทะเบียนที่ใช้บ่อย:

| เมธอด                                  | สิ่งที่ลงทะเบียน            |
| --------------------------------------- | --------------------------- |
| `registerProvider`                      | ผู้ให้บริการโมเดล (LLM)     |
| `registerChannel`                       | ช่องทางแชต                  |
| `registerTool`                          | เครื่องมือ agent            |
| `registerHook` / `on(...)`              | lifecycle hooks             |
| `registerSpeechProvider`                | แปลงข้อความเป็นเสียง / STT |
| `registerRealtimeTranscriptionProvider` | STT แบบสตรีม                |
| `registerRealtimeVoiceProvider`         | เสียงเรียลไทม์แบบสองทาง     |
| `registerMediaUnderstandingProvider`    | การวิเคราะห์ภาพ/เสียง       |
| `registerImageGenerationProvider`       | การสร้างภาพ                 |
| `registerMusicGenerationProvider`       | การสร้างเพลง                |
| `registerVideoGenerationProvider`       | การสร้างวิดีโอ              |
| `registerWebFetchProvider`              | ผู้ให้บริการดึงข้อมูล / scrape เว็บ |
| `registerWebSearchProvider`             | การค้นหาเว็บ                |
| `registerHttpRoute`                     | HTTP endpoint               |
| `registerCommand` / `registerCli`       | คำสั่ง CLI                  |
| `registerContextEngine`                 | context engine              |
| `registerService`                       | บริการเบื้องหลัง            |

พฤติกรรมของ hook guard สำหรับ typed lifecycle hooks:

- `before_tool_call`: `{ block: true }` เป็นผลลัพธ์สิ้นสุดทันที; handlers ที่มีลำดับความสำคัญต่ำกว่าจะถูกข้าม
- `before_tool_call`: `{ block: false }` ไม่มีผลใดๆ และจะไม่ล้าง block ที่เกิดขึ้นก่อนหน้า
- `before_install`: `{ block: true }` เป็นผลลัพธ์สิ้นสุดทันที; handlers ที่มีลำดับความสำคัญต่ำกว่าจะถูกข้าม
- `before_install`: `{ block: false }` ไม่มีผลใดๆ และจะไม่ล้าง block ที่เกิดขึ้นก่อนหน้า
- `message_sending`: `{ cancel: true }` เป็นผลลัพธ์สิ้นสุดทันที; handlers ที่มีลำดับความสำคัญต่ำกว่าจะถูกข้าม
- `message_sending`: `{ cancel: false }` ไม่มีผลใดๆ และจะไม่ล้าง cancel ที่เกิดขึ้นก่อนหน้า

สำหรับพฤติกรรมของ typed hook แบบเต็ม ดูได้ที่ [ภาพรวม SDK](/th/plugins/sdk-overview#hook-decision-semantics)

## ที่เกี่ยวข้อง

- [Building Plugins](/th/plugins/building-plugins) — สร้าง Plugin ของคุณเอง
- [Plugin Bundles](/th/plugins/bundles) — ความเข้ากันได้ของ bundle สำหรับ Codex/Claude/Cursor
- [Plugin Manifest](/th/plugins/manifest) — schema ของ manifest
- [Registering Tools](/th/plugins/building-plugins#registering-agent-tools) — เพิ่มเครื่องมือ agent ใน Plugin
- [Plugin Internals](/th/plugins/architecture) — โมเดลความสามารถและไปป์ไลน์การโหลด
- [Community Plugins](/th/plugins/community) — รายการจาก third-party
