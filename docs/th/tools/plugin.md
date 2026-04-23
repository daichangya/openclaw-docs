---
read_when:
    - การติดตั้งหรือกำหนดค่า Plugin
    - ทำความเข้าใจกฎการค้นหาและการโหลด Plugin
    - การทำงานกับชุดรวม Plugin ที่เข้ากันได้กับ Codex/Claude
sidebarTitle: Install and Configure
summary: ติดตั้ง กำหนดค่า และจัดการ Plugin ของ OpenClaw
title: Plugin
x-i18n:
    generated_at: "2026-04-23T13:58:18Z"
    model: gpt-5.4
    provider: openai
    source_hash: 63aa1b5ed9e3aaa2117b78137a457582b00ea47d94af7da3780ddae38e8e3665
    source_path: tools/plugin.md
    workflow: 15
---

# Plugin

Plugin จะขยายความสามารถของ OpenClaw ด้วยฟีเจอร์ใหม่ ๆ เช่น แชนเนล ผู้ให้บริการโมเดล
เครื่องมือ Skills เสียง การถอดเสียงแบบเรียลไทม์ เสียงแบบเรียลไทม์
การทำความเข้าใจสื่อ การสร้างภาพ การสร้างวิดีโอ การดึงข้อมูลเว็บ การค้นหาเว็บ
และอื่น ๆ อีกมากมาย บาง Plugin เป็น **core** (มาพร้อมกับ OpenClaw) ส่วนบางตัว
เป็น **external** (เผยแพร่บน npm โดยชุมชน)

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

    # จากไดเรกทอรีหรือไฟล์เก็บถาวรในเครื่อง
    openclaw plugins install ./my-plugin
    openclaw plugins install ./my-plugin.tgz
    ```

  </Step>

  <Step title="รีสตาร์ต Gateway">
    ```bash
    openclaw gateway restart
    ```

    จากนั้นกำหนดค่าภายใต้ `plugins.entries.\<id\>.config` ในไฟล์คอนฟิกของคุณ

  </Step>
</Steps>

หากคุณต้องการควบคุมผ่านแชตโดยตรง ให้เปิดใช้ `commands.plugins: true` แล้วใช้:

```text
/plugin install clawhub:@openclaw/voice-call
/plugin show voice-call
/plugin enable voice-call
```

เส้นทางการติดตั้งจะใช้ตัวแก้ไขเดียวกับ CLI: พาธหรือไฟล์เก็บถาวรในเครื่อง, `clawhub:<pkg>`
แบบระบุชัดเจน, หรือสเปกแพ็กเกจแบบเปล่า (ClawHub ก่อน แล้วจึง fallback ไป npm)

หากคอนฟิกไม่ถูกต้อง โดยปกติการติดตั้งจะล้มเหลวแบบปิดทางไว้ก่อนและชี้ให้คุณไปที่
`openclaw doctor --fix` ข้อยกเว้นด้านการกู้คืนมีเพียงเส้นทางติดตั้งใหม่ของ bundled-plugin
แบบจำกัด สำหรับ Plugin ที่เลือกใช้
`openclaw.install.allowInvalidConfigRecovery`

การติดตั้ง OpenClaw แบบแพ็กเกจจะไม่ติดตั้ง dependency runtime ทั้งหมดของ bundled plugin
ทุกตัวแบบ eager ล่วงหน้า เมื่อ bundled plugin ที่ OpenClaw เป็นเจ้าของเปิดใช้งานจาก
คอนฟิก plugin, คอนฟิกแชนเนลแบบเดิม, หรือ manifest ที่เปิดใช้เป็นค่าเริ่มต้น
การซ่อมแซมตอนเริ่มทำงานจะซ่อมเฉพาะ dependency runtime ที่ประกาศไว้ของ Plugin นั้น
ก่อนนำเข้าเท่านั้น ส่วน Plugin ภายนอกและพาธการโหลดแบบกำหนดเองยังคงต้องติดตั้งผ่าน
`openclaw plugins install`

## ประเภทของ Plugin

OpenClaw รู้จักรูปแบบ Plugin สองแบบ:

| รูปแบบ     | วิธีการทำงาน                                                      | ตัวอย่าง                                                |
| ---------- | ----------------------------------------------------------------- | ------------------------------------------------------- |
| **Native** | `openclaw.plugin.json` + โมดูล runtime; ทำงานในโปรเซสเดียวกัน     | Plugin ทางการ, แพ็กเกจ npm จากชุมชน                  |
| **Bundle** | เลย์เอาต์ที่เข้ากันได้กับ Codex/Claude/Cursor; แมปเป็นความสามารถของ OpenClaw | `.codex-plugin/`, `.claude-plugin/`, `.cursor-plugin/` |

ทั้งสองแบบจะแสดงภายใต้ `openclaw plugins list` ดูรายละเอียดของ bundle ได้ที่ [ชุดรวม Plugin](/th/plugins/bundles)

หากคุณกำลังเขียน Native Plugin ให้เริ่มจาก [การสร้าง Plugin](/th/plugins/building-plugins)
และ [ภาพรวม Plugin SDK](/th/plugins/sdk-overview)

## Plugin ทางการ

### ติดตั้งได้ (npm)

| Plugin          | แพ็กเกจ                | เอกสาร                               |
| --------------- | ---------------------- | ------------------------------------ |
| Matrix          | `@openclaw/matrix`     | [Matrix](/th/channels/matrix)           |
| Microsoft Teams | `@openclaw/msteams`    | [Microsoft Teams](/th/channels/msteams) |
| Nostr           | `@openclaw/nostr`      | [Nostr](/th/channels/nostr)             |
| Voice Call      | `@openclaw/voice-call` | [Voice Call](/th/plugins/voice-call)    |
| Zalo            | `@openclaw/zalo`       | [Zalo](/th/channels/zalo)               |
| Zalo Personal   | `@openclaw/zalouser`   | [Zalo Personal](/th/plugins/zalouser)   |

### Core (มาพร้อมกับ OpenClaw)

<AccordionGroup>
  <Accordion title="ผู้ให้บริการโมเดล (เปิดใช้โดยค่าเริ่มต้น)">
    `anthropic`, `byteplus`, `cloudflare-ai-gateway`, `github-copilot`, `google`,
    `huggingface`, `kilocode`, `kimi-coding`, `minimax`, `mistral`, `qwen`,
    `moonshot`, `nvidia`, `openai`, `opencode`, `opencode-go`, `openrouter`,
    `qianfan`, `synthetic`, `together`, `venice`,
    `vercel-ai-gateway`, `volcengine`, `xiaomi`, `zai`
  </Accordion>

  <Accordion title="Plugin หน่วยความจำ">
    - `memory-core` — การค้นหาหน่วยความจำแบบ bundled (ค่าเริ่มต้นผ่าน `plugins.slots.memory`)
    - `memory-lancedb` — หน่วยความจำระยะยาวแบบ install-on-demand พร้อมการเรียกคืน/บันทึกอัตโนมัติ (ตั้งค่า `plugins.slots.memory = "memory-lancedb"`)
  </Accordion>

  <Accordion title="ผู้ให้บริการเสียง (เปิดใช้โดยค่าเริ่มต้น)">
    `elevenlabs`, `microsoft`
  </Accordion>

  <Accordion title="อื่น ๆ">
    - `browser` — browser plugin แบบ bundled สำหรับเครื่องมือ browser, CLI `openclaw browser`, เมธอด Gateway `browser.request`, browser runtime และบริการควบคุมเบราว์เซอร์ค่าเริ่มต้น (เปิดใช้โดยค่าเริ่มต้น; ปิดก่อนหากต้องการแทนที่)
    - `copilot-proxy` — สะพานเชื่อม VS Code Copilot Proxy (ปิดโดยค่าเริ่มต้น)
  </Accordion>
</AccordionGroup>

กำลังมองหา Plugin จากบุคคลที่สามอยู่หรือไม่ ดู [Plugin จากชุมชน](/th/plugins/community)

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

| ฟิลด์            | คำอธิบาย                                                  |
| ---------------- | --------------------------------------------------------- |
| `enabled`        | สวิตช์หลัก (ค่าเริ่มต้น: `true`)                          |
| `allow`          | allowlist ของ Plugin (ไม่บังคับ)                          |
| `deny`           | denylist ของ Plugin (ไม่บังคับ; deny มีสิทธิ์เหนือกว่า)   |
| `load.paths`     | ไฟล์/ไดเรกทอรี Plugin เพิ่มเติม                            |
| `slots`          | ตัวเลือก slot แบบ exclusive (เช่น `memory`, `contextEngine`) |
| `entries.\<id\>` | สวิตช์เปิด/ปิด + คอนฟิกราย Plugin                         |

การเปลี่ยนคอนฟิก **ต้องรีสตาร์ต gateway** หาก Gateway กำลังทำงานพร้อมการเฝ้าดูคอนฟิก
และเปิดใช้การรีสตาร์ตในโปรเซสไว้ (ซึ่งเป็นพฤติกรรมค่าเริ่มต้นของเส้นทาง `openclaw gateway`)
โดยปกติการรีสตาร์ตนั้นจะเกิดขึ้นโดยอัตโนมัติไม่นานหลังจากมีการเขียนคอนฟิก

<Accordion title="สถานะ Plugin: ปิดใช้งาน เทียบกับ ไม่พบ เทียบกับ ไม่ถูกต้อง">
  - **ปิดใช้งาน**: มี Plugin อยู่ แต่กฎการเปิดใช้ปิดมันไว้ คอนฟิกจะยังคงถูกเก็บไว้
  - **ไม่พบ**: คอนฟิกอ้างถึงรหัส Plugin ที่การค้นหาไม่พบ
  - **ไม่ถูกต้อง**: มี Plugin อยู่ แต่คอนฟิกของมันไม่ตรงกับ schema ที่ประกาศไว้
</Accordion>

## การค้นหาและลำดับความสำคัญ

OpenClaw จะสแกนหา Plugin ตามลำดับนี้ (ที่พบก่อนมีสิทธิ์ก่อน):

<Steps>
  <Step title="พาธในคอนฟิก">
    `plugins.load.paths` — พาธไฟล์หรือไดเรกทอรีที่ระบุชัดเจน
  </Step>

  <Step title="Plugin ใน workspace">
    `\<workspace\>/.openclaw/<plugin-root>/*.ts` และ `\<workspace\>/.openclaw/<plugin-root>/*/index.ts`
  </Step>

  <Step title="Plugin แบบ global">
    `~/.openclaw/<plugin-root>/*.ts` และ `~/.openclaw/<plugin-root>/*/index.ts`
  </Step>

  <Step title="Plugin แบบ bundled">
    มาพร้อมกับ OpenClaw หลายตัวเปิดใช้โดยค่าเริ่มต้น (ผู้ให้บริการโมเดล, เสียง)
    ส่วนตัวอื่นต้องเปิดใช้แบบระบุชัดเจน
  </Step>
</Steps>

### กฎการเปิดใช้

- `plugins.enabled: false` จะปิดใช้งาน Plugin ทั้งหมด
- `plugins.deny` มีสิทธิ์เหนือกว่า allow เสมอ
- `plugins.entries.\<id\>.enabled: false` จะปิดใช้งาน Plugin นั้น
- Plugin ที่มาจาก workspace จะ **ปิดใช้งานโดยค่าเริ่มต้น** (ต้องเปิดใช้แบบระบุชัดเจน)
- bundled plugin จะเป็นไปตามชุดค่าเริ่มต้นที่เปิดใช้อยู่ในระบบ เว้นแต่จะมีการ override
- slot แบบ exclusive สามารถบังคับเปิดใช้ Plugin ที่ถูกเลือกสำหรับ slot นั้นได้

## Plugin slots (หมวดหมู่แบบ exclusive)

บางหมวดหมู่เป็นแบบ exclusive (เปิดใช้งานได้ครั้งละตัวเดียว):

```json5
{
  plugins: {
    slots: {
      memory: "memory-core", // หรือ "none" เพื่อปิดใช้งาน
      contextEngine: "legacy", // หรือรหัส plugin
    },
  },
}
```

| Slot            | สิ่งที่ควบคุม             | ค่าเริ่มต้น         |
| --------------- | ------------------------- | ------------------- |
| `memory`        | Active Memory plugin      | `memory-core`       |
| `contextEngine` | กลไกบริบทที่ใช้งานอยู่    | `legacy` (มีมาในตัว) |

## เอกสารอ้างอิง CLI

```bash
openclaw plugins list                       # รายการสินค้าคงคลังแบบย่อ
openclaw plugins list --enabled            # เฉพาะ Plugin ที่ถูกโหลด
openclaw plugins list --verbose            # รายละเอียดต่อ Plugin
openclaw plugins list --json               # สินค้าคงคลังแบบอ่านได้โดยเครื่อง
openclaw plugins inspect <id>              # รายละเอียดเชิงลึก
openclaw plugins inspect <id> --json       # แบบอ่านได้โดยเครื่อง
openclaw plugins inspect --all             # ตารางทั้งชุด
openclaw plugins info <id>                 # alias ของ inspect
openclaw plugins doctor                    # การวินิจฉัย

openclaw plugins install <package>         # ติดตั้ง (ClawHub ก่อน แล้วจึง npm)
openclaw plugins install clawhub:<pkg>     # ติดตั้งจาก ClawHub เท่านั้น
openclaw plugins install <spec> --force    # เขียนทับการติดตั้งที่มีอยู่
openclaw plugins install <path>            # ติดตั้งจากพาธในเครื่อง
openclaw plugins install -l <path>         # ลิงก์ (ไม่คัดลอก) สำหรับการพัฒนา
openclaw plugins install <plugin> --marketplace <source>
openclaw plugins install <plugin> --marketplace https://github.com/<owner>/<repo>
openclaw plugins install <spec> --pin      # บันทึกสเปก npm ที่ resolve แบบเจาะจง
openclaw plugins install <spec> --dangerously-force-unsafe-install
openclaw plugins update <id-or-npm-spec> # อัปเดต Plugin หนึ่งตัว
openclaw plugins update <id-or-npm-spec> --dangerously-force-unsafe-install
openclaw plugins update --all            # อัปเดตทั้งหมด
openclaw plugins uninstall <id>          # ลบระเบียนคอนฟิก/การติดตั้ง
openclaw plugins uninstall <id> --keep-files
openclaw plugins marketplace list <source>
openclaw plugins marketplace list <source> --json

openclaw plugins enable <id>
openclaw plugins disable <id>
```

bundled plugin จะมาพร้อมกับ OpenClaw หลายตัวเปิดใช้โดยค่าเริ่มต้น (เช่น
bundled ผู้ให้บริการโมเดล, bundled ผู้ให้บริการเสียง, และ bundled browser
plugin) ส่วน bundled plugin อื่น ๆ ยังต้องใช้ `openclaw plugins enable <id>`

`--force` จะเขียนทับ Plugin หรือ hook pack ที่ติดตั้งอยู่แล้วในตำแหน่งเดิม ใช้
`openclaw plugins update <id-or-npm-spec>` สำหรับการอัปเกรดตามปกติของ npm
plugin ที่ติดตามอยู่ ไม่รองรับการใช้ร่วมกับ `--link` ซึ่งจะใช้พาธต้นทางซ้ำแทน
การคัดลอกไปยังปลายทางการติดตั้งที่จัดการโดยระบบ

เมื่อมีการตั้งค่า `plugins.allow` อยู่แล้ว `openclaw plugins install` จะเพิ่ม
รหัส Plugin ที่ติดตั้งเข้าไปใน allowlist นั้นก่อนเปิดใช้งาน เพื่อให้โหลดได้ทันที
หลังรีสตาร์ต

`openclaw plugins update <id-or-npm-spec>` ใช้กับการติดตั้งที่ติดตามอยู่ การส่ง
สเปกแพ็กเกจ npm ที่มี dist-tag หรือเวอร์ชันแบบเจาะจงจะ resolve ชื่อแพ็กเกจกลับไปยัง
ระเบียน Plugin ที่ติดตามอยู่ และบันทึกสเปกใหม่ไว้สำหรับการอัปเดตครั้งถัดไป
การส่งชื่อแพ็กเกจโดยไม่มีเวอร์ชันจะย้ายการติดตั้งแบบ pinned เวอร์ชันแน่นอนกลับไปยัง
สายรีลีสค่าเริ่มต้นของ registry หาก npm plugin ที่ติดตั้งอยู่ตรงกับเวอร์ชันที่ resolve ได้
และ identity ของ artifact ที่บันทึกไว้แล้ว OpenClaw จะข้ามการอัปเดตโดยไม่ดาวน์โหลด
ติดตั้งใหม่ หรือเขียนคอนฟิกใหม่

`--pin` ใช้ได้กับ npm เท่านั้น ไม่รองรับร่วมกับ `--marketplace` เพราะการติดตั้งจาก
marketplace จะเก็บ metadata ของแหล่งที่มาจาก marketplace แทนสเปก npm

`--dangerously-force-unsafe-install` เป็นตัวเลือก override แบบ break-glass สำหรับ
false positive จากตัวสแกนโค้ดอันตรายในตัว อนุญาตให้การติดตั้ง Plugin
และการอัปเดต Plugin ดำเนินต่อไปได้แม้จะพบผลลัพธ์ `critical` จากระบบในตัว แต่ก็ยัง
ไม่ข้ามการบล็อกตามนโยบาย `before_install` ของ Plugin หรือการบล็อกจากความล้มเหลวในการสแกน

แฟล็ก CLI นี้ใช้กับ flow การติดตั้ง/อัปเดต Plugin เท่านั้น การติดตั้ง dependency ของ Skills
ที่อาศัย Gateway จะใช้ request override ชื่อ `dangerouslyForceUnsafeInstall`
ที่สอดคล้องกันแทน ขณะที่ `openclaw skills install` ยังคงเป็น flow แยกต่างหากสำหรับ
การดาวน์โหลด/ติดตั้ง Skills จาก ClawHub

bundle ที่เข้ากันได้จะเข้าร่วม flow เดียวกันของการแสดงรายการ/ตรวจสอบ/เปิดใช้/ปิดใช้
Plugin รองรับ runtime ในปัจจุบันรวมถึง bundle skills, Claude command-skills,
ค่าเริ่มต้นของ Claude `settings.json`, ค่าเริ่มต้นของ Claude `.lsp.json` และ
`lspServers` ที่ประกาศใน manifest, Cursor command-skills และไดเรกทอรี hook ของ Codex
ที่เข้ากันได้

`openclaw plugins inspect <id>` ยังรายงานความสามารถของ bundle ที่ตรวจพบ รวมถึง
รายการ MCP และเซิร์ฟเวอร์ LSP ที่รองรับหรือไม่รองรับสำหรับ Plugin ที่อิง bundle ด้วย

แหล่งที่มาของ marketplace สามารถเป็นชื่อ known-marketplace ของ Claude จาก
`~/.claude/plugins/known_marketplaces.json`, root ของ marketplace ในเครื่อง หรือพาธ
`marketplace.json`, รูปแบบย่อ GitHub เช่น `owner/repo`, URL ของ repo บน GitHub
หรือ URL ของ git ก็ได้ สำหรับ marketplace ระยะไกล รายการ Plugin จะต้องอยู่ภายใน
repo ของ marketplace ที่ถูกโคลน และใช้เฉพาะแหล่งที่มาแบบพาธสัมพัทธ์เท่านั้น

ดูรายละเอียดทั้งหมดได้ที่ [เอกสารอ้างอิง CLI `openclaw plugins`](/th/cli/plugins)

## ภาพรวม Plugin API

Native plugin จะ export ออบเจ็กต์ entry ที่เปิดเผย `register(api)` Plugin รุ่นเก่า
อาจยังใช้ `activate(api)` เป็น alias แบบ legacy ได้ แต่ Plugin ใหม่ควรใช้
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

OpenClaw จะโหลดออบเจ็กต์ entry และเรียก `register(api)` ระหว่างการเปิดใช้งาน Plugin
ตัวโหลดจะยังคง fallback ไปใช้ `activate(api)` สำหรับ Plugin รุ่นเก่า แต่ bundled plugin
และ Plugin ภายนอกตัวใหม่ควรมองว่า `register` เป็นสัญญาสาธารณะ

เมธอดการลงทะเบียนที่ใช้บ่อย:

| เมธอด                                  | สิ่งที่ลงทะเบียน            |
| -------------------------------------- | --------------------------- |
| `registerProvider`                     | ผู้ให้บริการโมเดล (LLM)     |
| `registerChannel`                      | แชนเนลแชต                  |
| `registerTool`                         | เครื่องมือของเอเจนต์       |
| `registerHook` / `on(...)`             | hook ของวงจรชีวิต          |
| `registerSpeechProvider`               | การแปลงข้อความเป็นเสียง / STT |
| `registerRealtimeTranscriptionProvider` | STT แบบสตรีม               |
| `registerRealtimeVoiceProvider`        | เสียงแบบเรียลไทม์สองทิศทาง |
| `registerMediaUnderstandingProvider`   | การวิเคราะห์ภาพ/เสียง      |
| `registerImageGenerationProvider`      | การสร้างภาพ                |
| `registerMusicGenerationProvider`      | การสร้างเพลง               |
| `registerVideoGenerationProvider`      | การสร้างวิดีโอ             |
| `registerWebFetchProvider`             | ผู้ให้บริการดึงข้อมูล / scrape เว็บ |
| `registerWebSearchProvider`            | การค้นหาเว็บ               |
| `registerHttpRoute`                    | endpoint HTTP              |
| `registerCommand` / `registerCli`      | คำสั่ง CLI                 |
| `registerContextEngine`                | กลไกบริบท                  |
| `registerService`                      | บริการเบื้องหลัง          |

พฤติกรรม guard ของ hook สำหรับ hook วงจรชีวิตแบบกำหนดชนิด:

- `before_tool_call`: `{ block: true }` เป็นสถานะสิ้นสุด; handler ที่มีลำดับความสำคัญต่ำกว่าจะถูกข้าม
- `before_tool_call`: `{ block: false }` ไม่มีผล และจะไม่ล้างการ block ที่เกิดขึ้นก่อนหน้า
- `before_install`: `{ block: true }` เป็นสถานะสิ้นสุด; handler ที่มีลำดับความสำคัญต่ำกว่าจะถูกข้าม
- `before_install`: `{ block: false }` ไม่มีผล และจะไม่ล้างการ block ที่เกิดขึ้นก่อนหน้า
- `message_sending`: `{ cancel: true }` เป็นสถานะสิ้นสุด; handler ที่มีลำดับความสำคัญต่ำกว่าจะถูกข้าม
- `message_sending`: `{ cancel: false }` ไม่มีผล และจะไม่ล้างการ cancel ที่เกิดขึ้นก่อนหน้า

สำหรับพฤติกรรม hook แบบกำหนดชนิดทั้งหมด ดู [ภาพรวม SDK](/th/plugins/sdk-overview#hook-decision-semantics)

## ที่เกี่ยวข้อง

- [การสร้าง Plugin](/th/plugins/building-plugins) — สร้าง plugin ของคุณเอง
- [ชุดรวม Plugin](/th/plugins/bundles) — ความเข้ากันได้ของ bundle กับ Codex/Claude/Cursor
- [Plugin Manifest](/th/plugins/manifest) — schema ของ manifest
- [การลงทะเบียนเครื่องมือ](/th/plugins/building-plugins#registering-agent-tools) — เพิ่มเครื่องมือของเอเจนต์ใน Plugin
- [โครงสร้างภายในของ Plugin](/th/plugins/architecture) — โมเดลความสามารถและไปป์ไลน์การโหลด
- [Plugin จากชุมชน](/th/plugins/community) — รายการจากบุคคลที่สาม
