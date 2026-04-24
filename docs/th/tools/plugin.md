---
read_when:
    - การติดตั้งหรือกำหนดค่า Plugin
    - ทำความเข้าใจกฎการค้นหาและการโหลด Plugin
    - การทำงานกับชุด Plugin ที่เข้ากันได้กับ Codex/Claude
sidebarTitle: Install and Configure
summary: ติดตั้ง กำหนดค่า และจัดการ Plugin ของ OpenClaw
title: Plugin
x-i18n:
    generated_at: "2026-04-24T15:22:10Z"
    model: gpt-5.4
    provider: openai
    source_hash: 947bb7ffc13280fd63f79bb68cb18a37c6614144b91a83afd38e5ac3c5187aed
    source_path: tools/plugin.md
    workflow: 15
---

Plugin ช่วยขยายความสามารถของ OpenClaw ด้วยความสามารถใหม่ ๆ เช่น channels, ผู้ให้บริการโมเดล, agent harnesses, tools, Skills, speech, การถอดเสียงแบบเรียลไทม์, เสียงแบบเรียลไทม์, การทำความเข้าใจสื่อ, การสร้างภาพ, การสร้างวิดีโอ, web fetch, web search และอื่น ๆ บาง Plugin เป็น **core** (มาพร้อมกับ OpenClaw) ส่วนบาง Plugin เป็น **external** (เผยแพร่บน npm โดยชุมชน)

## เริ่มต้นอย่างรวดเร็ว

<Steps>
  <Step title="ดูว่ามีอะไรถูกโหลดอยู่">
    ```bash
    openclaw plugins list
    ```
  </Step>

  <Step title="ติดตั้ง Plugin">
    ```bash
    # จาก npm
    openclaw plugins install @openclaw/voice-call

    # จากไดเรกทอรีหรือไฟล์ archive ในเครื่อง
    openclaw plugins install ./my-plugin
    openclaw plugins install ./my-plugin.tgz
    ```

  </Step>

  <Step title="รีสตาร์ท Gateway">
    ```bash
    openclaw gateway restart
    ```

    จากนั้นกำหนดค่าภายใต้ `plugins.entries.\<id\>.config` ในไฟล์ config ของคุณ

  </Step>
</Steps>

หากคุณต้องการควบคุมผ่านแชตโดยตรง ให้เปิดใช้งาน `commands.plugins: true` แล้วใช้:

```text
/plugin install clawhub:@openclaw/voice-call
/plugin show voice-call
/plugin enable voice-call
```

เส้นทางการติดตั้งใช้ตัวแก้ไขเดียวกับ CLI: พาธ/archive ในเครื่อง, `clawhub:<pkg>` แบบระบุชัดเจน หรือสเปกแพ็กเกจแบบเปล่า (ClawHub ก่อน แล้วค่อย fallback ไป npm)

หาก config ไม่ถูกต้อง โดยปกติการติดตั้งจะล้มเหลวแบบปิดกั้นไว้ก่อน และชี้ให้คุณไปที่ `openclaw doctor --fix` ข้อยกเว้นด้านการกู้คืนเพียงอย่างเดียวคือเส้นทางติดตั้งใหม่ของ bundled-plugin แบบจำกัด สำหรับ Plugin ที่เลือกใช้
`openclaw.install.allowInvalidConfigRecovery`

การติดตั้ง OpenClaw แบบแพ็กเกจจะไม่ติดตั้ง dependency runtime tree ของ bundled plugin ทุกตัวล่วงหน้า เมื่อ OpenClaw-owned plugin แบบ bundled ทำงานจาก plugin config, legacy channel config หรือ manifest ที่เปิดใช้โดยค่าเริ่มต้น ขั้นตอน startup จะซ่อมแซมเฉพาะ declared runtime dependencies ของ Plugin นั้นก่อนนำเข้าเท่านั้น Plugin ภายนอกและพาธโหลดแบบกำหนดเองยังคงต้องติดตั้งผ่าน
`openclaw plugins install`

## ประเภทของ Plugin

OpenClaw รู้จักรูปแบบ Plugin สองแบบ:

| รูปแบบ      | วิธีการทำงาน                                                      | ตัวอย่าง                                               |
| ----------- | ----------------------------------------------------------------- | ------------------------------------------------------ |
| **Native**  | `openclaw.plugin.json` + โมดูล runtime; ทำงานในโปรเซสเดียวกัน     | Plugin ทางการ, แพ็กเกจ npm จากชุมชน                  |
| **Bundle**  | เลย์เอาต์ที่เข้ากันได้กับ Codex/Claude/Cursor; แมปไปยังความสามารถของ OpenClaw | `.codex-plugin/`, `.claude-plugin/`, `.cursor-plugin/` |

ทั้งสองแบบจะแสดงใน `openclaw plugins list` ดูรายละเอียดของ bundle ได้ที่ [Plugin Bundles](/th/plugins/bundles)

หากคุณกำลังเขียน native plugin ให้เริ่มจาก [Building Plugins](/th/plugins/building-plugins)
และ [Plugin SDK Overview](/th/plugins/sdk-overview)

## Plugin ทางการ

### ติดตั้งได้ (npm)

| Plugin          | แพ็กเกจ                | เอกสาร                                |
| --------------- | ---------------------- | ------------------------------------ |
| Matrix          | `@openclaw/matrix`     | [Matrix](/th/channels/matrix)           |
| Microsoft Teams | `@openclaw/msteams`    | [Microsoft Teams](/th/channels/msteams) |
| Nostr           | `@openclaw/nostr`      | [Nostr](/th/channels/nostr)             |
| Voice Call      | `@openclaw/voice-call` | [Voice Call](/th/plugins/voice-call)    |
| Zalo            | `@openclaw/zalo`       | [Zalo](/th/channels/zalo)               |
| Zalo Personal   | `@openclaw/zalouser`   | [Zalo Personal](/th/plugins/zalouser)   |

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
    - `memory-core` — bundled memory search (ค่าเริ่มต้นผ่าน `plugins.slots.memory`)
    - `memory-lancedb` — หน่วยความจำระยะยาวแบบ install-on-demand พร้อม auto-recall/capture (ตั้งค่า `plugins.slots.memory = "memory-lancedb"`)
  </Accordion>

  <Accordion title="ผู้ให้บริการเสียงพูด (เปิดใช้งานโดยค่าเริ่มต้น)">
    `elevenlabs`, `microsoft`
  </Accordion>

  <Accordion title="อื่น ๆ">
    - `browser` — bundled browser plugin สำหรับ browser tool, CLI `openclaw browser`, เมธอด Gateway `browser.request`, browser runtime และบริการควบคุมเบราว์เซอร์เริ่มต้น (เปิดใช้งานโดยค่าเริ่มต้น; ปิดก่อนหากจะนำตัวอื่นมาแทน)
    - `copilot-proxy` — สะพานเชื่อม VS Code Copilot Proxy (ปิดใช้งานโดยค่าเริ่มต้น)
  </Accordion>
</AccordionGroup>

กำลังมองหา Plugin จากบุคคลที่สามอยู่หรือไม่ ดูได้ที่ [Community Plugins](/th/plugins/community)

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

| ฟิลด์            | คำอธิบาย                                                |
| ---------------- | -------------------------------------------------------- |
| `enabled`        | สวิตช์หลัก (ค่าเริ่มต้น: `true`)                        |
| `allow`          | allowlist ของ Plugin (ไม่บังคับ)                         |
| `deny`           | denylist ของ Plugin (ไม่บังคับ; deny มีผลเหนือกว่า)     |
| `load.paths`     | ไฟล์/ไดเรกทอรี Plugin เพิ่มเติม                           |
| `slots`          | ตัวเลือก slot แบบเอกสิทธิ์ (เช่น `memory`, `contextEngine`) |
| `entries.\<id\>` | สวิตช์และ config ราย Plugin                              |

การเปลี่ยนแปลง config **ต้องรีสตาร์ท gateway** หาก Gateway ทำงานพร้อมการเฝ้าดู config + การรีสตาร์ทในโปรเซส (ซึ่งเป็นเส้นทางค่าเริ่มต้นของ `openclaw gateway`) โดยทั่วไปการรีสตาร์ทนั้นจะเกิดขึ้นอัตโนมัติไม่นานหลังจากมีการเขียน config เสร็จ ไม่มีเส้นทาง hot-reload ที่รองรับสำหรับโค้ด runtime ของ native plugin หรือ lifecycle hooks; ให้รีสตาร์ทโปรเซส Gateway ที่ให้บริการ live channel ก่อน แล้วจึงคาดหวังว่าโค้ด `register(api)` ที่อัปเดตแล้ว, hooks ของ `api.on(...)`, tools, services หรือ provider/runtime hooks จะเริ่มทำงาน

`openclaw plugins list` เป็น snapshot ของ CLI/config ในเครื่อง `loaded` plugin ที่แสดงอยู่ตรงนั้นหมายความว่า Plugin สามารถถูกค้นพบและโหลดได้จาก config/ไฟล์ที่ CLI ครั้งนั้นมองเห็น ไม่ได้พิสูจน์ว่า child ของ Gateway ระยะไกลที่กำลังทำงานอยู่ได้รีสตาร์ทมาใช้โค้ด Plugin ชุดเดียวกันแล้ว ในการติดตั้งแบบ VPS/container ที่มี wrapper process ให้ส่งคำสั่งรีสตาร์ทไปยังโปรเซส `openclaw gateway run` ที่ทำงานจริง หรือใช้
`openclaw gateway restart` กับ Gateway ที่กำลังทำงานอยู่

<Accordion title="สถานะ Plugin: ปิดใช้งาน vs ขาดหาย vs ไม่ถูกต้อง">
  - **ปิดใช้งาน**: มี Plugin อยู่ แต่กฎการเปิดใช้งานทำให้มันถูกปิด config จะยังคงถูกเก็บไว้
  - **ขาดหาย**: config อ้างอิง id ของ Plugin ที่ระบบค้นหาไม่พบ
  - **ไม่ถูกต้อง**: มี Plugin อยู่ แต่ config ของมันไม่ตรงกับ schema ที่ประกาศไว้
</Accordion>

## การค้นหาและลำดับความสำคัญ

OpenClaw จะสแกนหา Plugin ตามลำดับนี้ (ตรงกันตัวแรกชนะ):

<Steps>
  <Step title="พาธใน config">
    `plugins.load.paths` — พาธไฟล์หรือไดเรกทอรีที่ระบุชัดเจน
  </Step>

  <Step title="Plugin ใน workspace">
    `\<workspace\>/.openclaw/<plugin-root>/*.ts` และ `\<workspace\>/.openclaw/<plugin-root>/*/index.ts`
  </Step>

  <Step title="Plugin แบบ global">
    `~/.openclaw/<plugin-root>/*.ts` และ `~/.openclaw/<plugin-root>/*/index.ts`
  </Step>

  <Step title="Plugin แบบ bundled">
    มาพร้อมกับ OpenClaw หลายตัวถูกเปิดใช้งานโดยค่าเริ่มต้น (ผู้ให้บริการโมเดล, speech)
    ส่วนที่เหลือต้องเปิดใช้งานอย่างชัดเจน
  </Step>
</Steps>

### กฎการเปิดใช้งาน

- `plugins.enabled: false` จะปิดใช้งาน Plugin ทั้งหมด
- `plugins.deny` มีผลเหนือกว่า allow เสมอ
- `plugins.entries.\<id\>.enabled: false` จะปิดใช้งาน Plugin นั้น
- Plugin ที่มาจาก workspace จะ **ปิดใช้งานโดยค่าเริ่มต้น** (ต้องเปิดใช้งานอย่างชัดเจน)
- bundled plugin ปฏิบัติตามชุดที่เปิดไว้โดยค่าเริ่มต้นในระบบ เว้นแต่จะมีการ override
- slot แบบเอกสิทธิ์สามารถบังคับเปิดใช้งาน Plugin ที่ถูกเลือกสำหรับ slot นั้นได้
- bundled opt-in plugins บางตัวจะถูกเปิดใช้งานโดยอัตโนมัติเมื่อ config ระบุพื้นผิวที่ Plugin เป็นเจ้าของ เช่น model ref ของ provider, channel config หรือ harness runtime
- เส้นทาง Codex ในตระกูล OpenAI ยังคงแยกขอบเขต Plugin ออกจากกัน:
  `openai-codex/*` เป็นของ OpenAI plugin ขณะที่ bundled Codex
  app-server plugin จะถูกเลือกด้วย `embeddedHarness.runtime: "codex"` หรือ `codex/*` model refs แบบ legacy

## การแก้ปัญหา Runtime Hooks

หาก Plugin แสดงใน `plugins list` แต่ side effects หรือ hooks ของ `register(api)` ไม่ทำงานในทราฟฟิกแชตจริง ให้ตรวจสอบสิ่งเหล่านี้ก่อน:

- รัน `openclaw gateway status --deep --require-rpc` และยืนยันว่า URL, โปรไฟล์, พาธ config และโปรเซสของ Gateway ที่กำลังใช้งานอยู่คือตัวเดียวกับที่คุณกำลังแก้ไข
- รีสตาร์ท Gateway ที่ใช้งานจริงหลังจากมีการติดตั้ง/กำหนดค่า/แก้โค้ด Plugin ใน container แบบ wrapper, PID 1 อาจเป็นเพียง supervisor; ให้รีสตาร์ทหรือส่งสัญญาณไปยัง child process ของ `openclaw gateway run`
- ใช้ `openclaw plugins inspect <id> --json` เพื่อยืนยันการลงทะเบียน hook และการวินิจฉัย conversation hooks ที่ไม่ใช่ bundled เช่น `llm_input`,
  `llm_output` และ `agent_end` จำเป็นต้องมี
  `plugins.entries.<id>.hooks.allowConversationAccess=true`
- สำหรับการสลับโมเดล ให้เลือกใช้ `before_model_resolve` ซึ่งจะทำงานก่อนการ resolve โมเดลสำหรับ agent turn; ส่วน `llm_output` จะทำงานหลังจากที่การพยายามใช้โมเดลสร้างผลลัพธ์ assistant ออกมาแล้วเท่านั้น
- หากต้องการพิสูจน์โมเดลจริงของ session ที่มีผลอยู่ ให้ใช้ `openclaw sessions` หรือพื้นผิว session/status ของ Gateway และเมื่อดีบัก payload ของ provider ให้เริ่ม Gateway ด้วย `--raw-stream --raw-stream-path <path>`

## Plugin slots (หมวดหมู่แบบเอกสิทธิ์)

บางหมวดหมู่เป็นแบบเอกสิทธิ์ (เปิดใช้งานได้ครั้งละตัวเดียว):

```json5
{
  plugins: {
    slots: {
      memory: "memory-core", // หรือ "none" เพื่อปิดใช้งาน
      contextEngine: "legacy", // หรือ id ของ plugin
    },
  },
}
```

| Slot            | สิ่งที่ควบคุม               | ค่าเริ่มต้น         |
| --------------- | --------------------------- | ------------------- |
| `memory`        | Active Memory plugin        | `memory-core`       |
| `contextEngine` | context engine ที่ใช้งานอยู่ | `legacy` (มีมาในตัว) |

## เอกสารอ้างอิง CLI

```bash
openclaw plugins list                       # รายการ inventory แบบย่อ
openclaw plugins list --enabled            # เฉพาะ Plugin ที่โหลดอยู่
openclaw plugins list --verbose            # รายละเอียดราย Plugin
openclaw plugins list --json               # inventory แบบอ่านได้ด้วยเครื่อง
openclaw plugins inspect <id>              # รายละเอียดเชิงลึก
openclaw plugins inspect <id> --json       # แบบอ่านได้ด้วยเครื่อง
openclaw plugins inspect --all             # ตารางทั้งชุด
openclaw plugins info <id>                 # alias ของ inspect
openclaw plugins doctor                    # การวินิจฉัย

openclaw plugins install <package>         # ติดตั้ง (ClawHub ก่อน แล้วค่อย npm)
openclaw plugins install clawhub:<pkg>     # ติดตั้งจาก ClawHub เท่านั้น
openclaw plugins install <spec> --force    # เขียนทับการติดตั้งเดิม
openclaw plugins install <path>            # ติดตั้งจากพาธในเครื่อง
openclaw plugins install -l <path>         # ลิงก์ (ไม่คัดลอก) สำหรับ dev
openclaw plugins install <plugin> --marketplace <source>
openclaw plugins install <plugin> --marketplace https://github.com/<owner>/<repo>
openclaw plugins install <spec> --pin      # บันทึก npm spec ที่ resolve แบบตรงตัว
openclaw plugins install <spec> --dangerously-force-unsafe-install
openclaw plugins update <id-or-npm-spec> # อัปเดต Plugin เดียว
openclaw plugins update <id-or-npm-spec> --dangerously-force-unsafe-install
openclaw plugins update --all            # อัปเดตทั้งหมด
openclaw plugins uninstall <id>          # ลบระเบียน config/การติดตั้ง
openclaw plugins uninstall <id> --keep-files
openclaw plugins marketplace list <source>
openclaw plugins marketplace list <source> --json

openclaw plugins enable <id>
openclaw plugins disable <id>
```

bundled plugin มาพร้อมกับ OpenClaw หลายตัวถูกเปิดใช้งานโดยค่าเริ่มต้น (ตัวอย่างเช่น bundled model providers, bundled speech providers และ bundled browser plugin) ส่วน bundled plugin อื่น ๆ ยังต้องใช้ `openclaw plugins enable <id>`

`--force` จะเขียนทับ Plugin หรือ hook pack ที่ติดตั้งอยู่แล้วในตำแหน่งเดิม ใช้
`openclaw plugins update <id-or-npm-spec>` สำหรับการอัปเกรดตามปกติของ npm
plugin ที่มีการติดตามไว้ ตัวเลือกนี้ไม่รองรับกับ `--link` ซึ่งจะนำพาธต้นทางกลับมาใช้ซ้ำแทนการคัดลอกไปยังปลายทางการติดตั้งที่ระบบจัดการให้

เมื่อมีการตั้งค่า `plugins.allow` ไว้แล้ว `openclaw plugins install` จะเพิ่ม id ของ Plugin ที่ติดตั้งเข้าไปใน allowlist นั้นก่อนเปิดใช้งาน ดังนั้นหลังรีสตาร์ทแล้วจึงสามารถโหลดได้ทันที

`openclaw plugins update <id-or-npm-spec>` ใช้กับการติดตั้งที่มีการติดตามไว้ การส่ง npm package spec ที่มี dist-tag หรือเวอร์ชันแบบตรงตัวจะทำให้ระบบ resolve ชื่อแพ็กเกจกลับไปยังระเบียน Plugin ที่ติดตามไว้ และบันทึก spec ใหม่ไว้สำหรับการอัปเดตในอนาคต การส่งชื่อแพ็กเกจโดยไม่ระบุเวอร์ชันจะย้ายการติดตั้งแบบ pin เวอร์ชันตรงตัวกลับไปยัง release line เริ่มต้นของ registry หาก npm plugin ที่ติดตั้งอยู่ตรงกับเวอร์ชันที่ resolve ได้และตรงกับ identity ของ artifact ที่บันทึกไว้แล้ว OpenClaw จะข้ามการอัปเดตโดยไม่ดาวน์โหลด ติดตั้งใหม่ หรือเขียน config ใหม่

`--pin` ใช้ได้กับ npm เท่านั้น ไม่รองรับร่วมกับ `--marketplace` เพราะการติดตั้งจาก marketplace จะเก็บ metadata ของแหล่ง marketplace แทน npm spec

`--dangerously-force-unsafe-install` เป็นตัว override แบบ break-glass สำหรับ false
positive จาก dangerous-code scanner ที่มีมาในระบบ ช่วยให้การติดตั้งและการอัปเดต Plugin ดำเนินต่อไปได้แม้จะพบผลการตรวจระดับ `critical` จากระบบ แต่ก็ยังไม่ข้าม plugin `before_install` policy blocks หรือการบล็อกจาก scan-failure

แฟล็ก CLI นี้ใช้กับ flow การติดตั้ง/อัปเดต Plugin เท่านั้น การติดตั้ง dependency ของ Skills ที่มี Gateway เป็นตัวทำงานเบื้องหลังจะใช้ request override ที่ตรงกันคือ `dangerouslyForceUnsafeInstall` แทน ขณะที่ `openclaw skills install` ยังคงเป็น flow ดาวน์โหลด/ติดตั้ง Skills จาก ClawHub ที่แยกต่างหาก

bundle ที่เข้ากันได้จะเข้าร่วมใน flow เดียวกันของ plugin list/inspect/enable/disable ปัจจุบันรองรับ runtime สำหรับ bundle skills, Claude command-skills, ค่าเริ่มต้นของ Claude `settings.json`, ค่าเริ่มต้นของ Claude `.lsp.json` และ `lspServers` ที่ประกาศใน manifest, Cursor command-skills และไดเรกทอรี hooks ของ Codex ที่เข้ากันได้

`openclaw plugins inspect <id>` ยังรายงานความสามารถของ bundle ที่ตรวจพบ รวมถึงรายการ MCP และ LSP server ที่รองรับหรือไม่รองรับสำหรับ bundle-backed plugin ด้วย

แหล่ง marketplace สามารถเป็นชื่อ marketplace ที่ Claude รู้จักจาก
`~/.claude/plugins/known_marketplaces.json`, ราก marketplace ในเครื่องหรือพาธ
`marketplace.json`, รูปแบบย่อ GitHub เช่น `owner/repo`, URL ของ GitHub repo หรือ
git URL สำหรับ marketplace ระยะไกล รายการ Plugin ต้องคงอยู่ภายใน marketplace repo ที่ clone มา และใช้เฉพาะแหล่งที่มาแบบ relative path เท่านั้น

ดูรายละเอียดทั้งหมดได้ที่ [เอกสารอ้างอิง CLI `openclaw plugins`](/th/cli/plugins)

## ภาพรวม API ของ Plugin

native plugin จะ export entry object ที่เปิดเผย `register(api)` Plugin รุ่นเก่าอาจยังใช้ `activate(api)` เป็น alias แบบ legacy ได้อยู่ แต่ Plugin ใหม่ควรใช้ `register`

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

OpenClaw จะโหลด entry object และเรียก `register(api)` ระหว่างการเปิดใช้งาน Plugin ตัวโหลดจะยัง fallback ไปที่ `activate(api)` สำหรับ Plugin รุ่นเก่า แต่ bundled plugin และ external plugin ใหม่ควรมองว่า `register` เป็น public contract

เมธอดการลงทะเบียนที่ใช้บ่อย:

| Method                                  | สิ่งที่ลงทะเบียน            |
| --------------------------------------- | ---------------------------- |
| `registerProvider`                      | ผู้ให้บริการโมเดล (LLM)     |
| `registerChannel`                       | channel แชต                 |
| `registerTool`                          | tool ของ agent              |
| `registerHook` / `on(...)`              | lifecycle hooks              |
| `registerSpeechProvider`                | Text-to-speech / STT         |
| `registerRealtimeTranscriptionProvider` | Streaming STT                |
| `registerRealtimeVoiceProvider`         | เสียงเรียลไทม์แบบสองทิศทาง |
| `registerMediaUnderstandingProvider`    | การวิเคราะห์ภาพ/เสียง      |
| `registerImageGenerationProvider`       | การสร้างภาพ                 |
| `registerMusicGenerationProvider`       | การสร้างเพลง                |
| `registerVideoGenerationProvider`       | การสร้างวิดีโอ              |
| `registerWebFetchProvider`              | ผู้ให้บริการ web fetch / scrape |
| `registerWebSearchProvider`             | web search                   |
| `registerHttpRoute`                     | HTTP endpoint                |
| `registerCommand` / `registerCli`       | คำสั่ง CLI                  |
| `registerContextEngine`                 | context engine               |
| `registerService`                       | บริการเบื้องหลัง            |

พฤติกรรมของ hook guard สำหรับ typed lifecycle hooks:

- `before_tool_call`: `{ block: true }` เป็นคำตัดสินสุดท้าย; handler ที่มีลำดับความสำคัญต่ำกว่าจะถูกข้าม
- `before_tool_call`: `{ block: false }` ไม่มีผลใด ๆ และจะไม่ล้างการบล็อกที่เกิดขึ้นก่อนหน้า
- `before_install`: `{ block: true }` เป็นคำตัดสินสุดท้าย; handler ที่มีลำดับความสำคัญต่ำกว่าจะถูกข้าม
- `before_install`: `{ block: false }` ไม่มีผลใด ๆ และจะไม่ล้างการบล็อกที่เกิดขึ้นก่อนหน้า
- `message_sending`: `{ cancel: true }` เป็นคำตัดสินสุดท้าย; handler ที่มีลำดับความสำคัญต่ำกว่าจะถูกข้าม
- `message_sending`: `{ cancel: false }` ไม่มีผลใด ๆ และจะไม่ล้างการยกเลิกที่เกิดขึ้นก่อนหน้า

สำหรับพฤติกรรมเต็มรูปแบบของ typed hook โปรดดู [ภาพรวม SDK](/th/plugins/sdk-overview#hook-decision-semantics)

## ที่เกี่ยวข้อง

- [Building Plugins](/th/plugins/building-plugins) — สร้าง Plugin ของคุณเอง
- [Plugin Bundles](/th/plugins/bundles) — ความเข้ากันได้ของ bundle สำหรับ Codex/Claude/Cursor
- [Plugin Manifest](/th/plugins/manifest) — schema ของ manifest
- [Registering Tools](/th/plugins/building-plugins#registering-agent-tools) — เพิ่ม tools ของ agent ใน Plugin
- [Plugin Internals](/th/plugins/architecture) — โมเดลความสามารถและ pipeline การโหลด
- [Community Plugins](/th/plugins/community) — รายการจากบุคคลที่สาม
