---
read_when:
    - การเพิ่มหรือแก้ไข Skills
    - การเปลี่ยนกฎการควบคุมหรือกฎการโหลดของ Skills
summary: 'Skills: แบบ managed เทียบกับ workspace, กฎการควบคุม และการเชื่อมต่อ config/env'
title: Skills
x-i18n:
    generated_at: "2026-04-23T06:04:32Z"
    model: gpt-5.4
    provider: openai
    source_hash: c2ff6a3a92bc3c1c3892620a00e2eb01c73364bc6388a3513943defa46e49749
    source_path: tools/skills.md
    workflow: 15
---

# Skills (OpenClaw)

OpenClaw ใช้โฟลเดอร์ skill ที่ **เข้ากันได้กับ [AgentSkills](https://agentskills.io)** เพื่อสอนเอเจนต์ให้รู้วิธีใช้ tools แต่ละ skill เป็นไดเรกทอรีที่มี `SKILL.md` พร้อม YAML frontmatter และคำสั่ง OpenClaw จะโหลดทั้ง **bundled skills** และ local override แบบไม่บังคับ แล้วกรองตอนเวลาโหลดตาม environment, config และการมีอยู่ของไบนารี

## ตำแหน่งและลำดับความสำคัญ

OpenClaw โหลด skills จากแหล่งเหล่านี้:

1. **โฟลเดอร์ skill เพิ่มเติม**: กำหนดผ่าน `skills.load.extraDirs`
2. **Bundled skills**: มาพร้อมกับการติดตั้ง (แพ็กเกจ npm หรือ OpenClaw.app)
3. **Managed/local skills**: `~/.openclaw/skills`
4. **Personal agent skills**: `~/.agents/skills`
5. **Project agent skills**: `<workspace>/.agents/skills`
6. **Workspace skills**: `<workspace>/skills`

หากชื่อ skill ชนกัน ลำดับความสำคัญคือ:

`<workspace>/skills` (สูงสุด) → `<workspace>/.agents/skills` → `~/.agents/skills` → `~/.openclaw/skills` → bundled skills → `skills.load.extraDirs` (ต่ำสุด)

## Skills แบบต่อเอเจนต์เทียบกับแบบใช้ร่วมกัน

ในการตั้งค่าแบบ **multi-agent** แต่ละเอเจนต์จะมี workspace ของตัวเอง ซึ่งหมายความว่า:

- **Per-agent skills** อยู่ใน `<workspace>/skills` สำหรับเอเจนต์นั้นเท่านั้น
- **Project agent skills** อยู่ใน `<workspace>/.agents/skills` และมีผลกับ
  workspace นั้นก่อนโฟลเดอร์ `skills/` ปกติของ workspace
- **Personal agent skills** อยู่ใน `~/.agents/skills` และใช้ได้ข้าม
  workspaces บนเครื่องนั้น
- **Shared skills** อยู่ใน `~/.openclaw/skills` (managed/local) และมองเห็นได้
  สำหรับ **เอเจนต์ทุกตัว** บนเครื่องเดียวกัน
- **Shared folders** สามารถเพิ่มผ่าน `skills.load.extraDirs` ได้เช่นกัน (ลำดับ
  ต่ำสุด) หากคุณต้องการชุด skills กลางที่ใช้โดยหลายเอเจนต์

หาก skill ชื่อเดียวกันมีอยู่มากกว่าหนึ่งที่ ก็ใช้ลำดับความสำคัญตามปกติ:
workspace ชนะ จากนั้น project agent skills, personal agent skills,
managed/local, bundled และ extra dirs

## allowlist ของ Skills ต่อเอเจนต์

**ตำแหน่ง** ของ skill และ **การมองเห็น** ของ skill เป็นตัวควบคุมคนละส่วน

- ตำแหน่ง/ลำดับความสำคัญเป็นตัวตัดสินว่าสำเนาใดของ skill ชื่อเดียวกันจะชนะ
- allowlist ของเอเจนต์เป็นตัวตัดสินว่า skill ที่มองเห็นได้ใดบ้างที่เอเจนต์จะใช้ได้จริง

ใช้ `agents.defaults.skills` เป็น baseline แบบใช้ร่วมกัน แล้ว override ต่อเอเจนต์ด้วย
`agents.list[].skills`:

```json5
{
  agents: {
    defaults: {
      skills: ["github", "weather"],
    },
    list: [
      { id: "writer" }, // รับช่วง github, weather
      { id: "docs", skills: ["docs-search"] }, // แทนที่ defaults
      { id: "locked-down", skills: [] }, // ไม่มี skills
    ],
  },
}
```

กฎ:

- ละเว้น `agents.defaults.skills` หากต้องการให้ skills ไม่ถูกจำกัดโดยค่าเริ่มต้น
- ละเว้น `agents.list[].skills` เพื่อรับช่วง `agents.defaults.skills`
- ตั้ง `agents.list[].skills: []` หากไม่ต้องการ skills
- รายการ `agents.list[].skills` ที่ไม่ว่างคือชุดสุดท้ายสำหรับเอเจนต์นั้น; มัน
  จะไม่ merge กับ defaults

OpenClaw ใช้ชุด skill ที่มีผลจริงของเอเจนต์ตลอดทั้งการสร้าง prompt,
การค้นพบ skill slash-command, การ sync sandbox และ skill snapshots

## Plugins + skills

Plugins สามารถมาพร้อม skills ของตัวเองได้โดยการระบุไดเรกทอรี `skills` ใน
`openclaw.plugin.json` (พาธอิงจากรากของ plugin) skill ของ plugin จะถูกโหลด
เมื่อ plugin ถูกเปิดใช้งาน ปัจจุบันไดเรกทอรีเหล่านั้นจะถูกรวมเข้าในพาธ
ลำดับความสำคัญต่ำเดียวกับ `skills.load.extraDirs` ดังนั้น skill ที่ชื่อซ้ำกันใน bundled,
managed, agent หรือ workspace จะ override พวกมัน
คุณสามารถควบคุมมันได้ผ่าน `metadata.openclaw.requires.config` บนรายการ config
ของ plugin ดู [Plugins](/th/tools/plugin) สำหรับการค้นพบ/การตั้งค่า และ [Tools](/th/tools) สำหรับ
พื้นผิวของ tool ที่ skills เหล่านั้นสอน

## Skill Workshop

Plugin Skill Workshop แบบไม่บังคับและยังอยู่ในขั้นทดลอง สามารถสร้างหรืออัปเดต workspace
skills จากกระบวนการที่นำกลับมาใช้ใหม่ได้ซึ่งถูกสังเกตระหว่างการทำงานของเอเจนต์ มันถูกปิดไว้
โดยค่าเริ่มต้น และต้องเปิดใช้อย่างชัดเจนผ่าน
`plugins.entries.skill-workshop`

Skill Workshop เขียนเฉพาะลงใน `<workspace>/skills` เท่านั้น, สแกนเนื้อหาที่สร้างขึ้น,
รองรับการอนุมัติแบบ pending หรือการเขียนอัตโนมัติแบบปลอดภัย, กักกันข้อเสนอที่ไม่ปลอดภัย,
และรีเฟรช skill snapshot หลังจากเขียนสำเร็จ เพื่อให้ skill ใหม่พร้อมใช้งานได้โดยไม่ต้องรีสตาร์ต Gateway

ใช้มันเมื่อคุณต้องการให้การแก้ไขอย่าง “ครั้งหน้าให้ตรวจสอบที่มาของ GIF” หรือ
เวิร์กโฟลว์ที่ได้มาด้วยความยาก เช่น checklist สำหรับ media QA กลายเป็นคำสั่งเชิงกระบวนการที่คงทน
เริ่มจาก pending approval ก่อน; ใช้การเขียนอัตโนมัติเฉพาะใน workspace ที่เชื่อถือได้หลังจาก
ตรวจสอบข้อเสนอของมันแล้ว คู่มือเต็ม:
[Skill Workshop Plugin](/th/plugins/skill-workshop)

## ClawHub (ติดตั้ง + sync)

ClawHub คือรีจิสทรีสกิลสาธารณะสำหรับ OpenClaw เรียกดูได้ที่
[https://clawhub.ai](https://clawhub.ai) ใช้คำสั่ง `openclaw skills`
แบบเนทีฟเพื่อค้นหา/ติดตั้ง/อัปเดต skills หรือใช้ CLI แยก `clawhub` เมื่อ
คุณต้องการเวิร์กโฟลว์ publish/sync
คู่มือเต็ม: [ClawHub](/th/tools/clawhub)

โฟลว์ที่พบบ่อย:

- ติดตั้ง skill ลงใน workspace ของคุณ:
  - `openclaw skills install <skill-slug>`
- อัปเดต skills ที่ติดตั้งทั้งหมด:
  - `openclaw skills update --all`
- Sync (สแกน + publish การอัปเดต):
  - `clawhub sync --all`

`openclaw skills install` แบบเนทีฟจะติดตั้งลงในไดเรกทอรี `skills/`
ของ workspace ที่ใช้งานอยู่ ส่วน CLI `clawhub` แยกจะติดตั้งลงใน `./skills` ภายใต้
ไดเรกทอรีทำงานปัจจุบันของคุณด้วย (หรือ fallback ไปยัง workspace OpenClaw ที่กำหนดไว้)
OpenClaw จะโหลดสิ่งนั้นเป็น `<workspace>/skills` ในเซสชันถัดไป

## หมายเหตุด้านความปลอดภัย

- ให้ถือว่า skills จากบุคคลที่สามเป็น **โค้ดที่ไม่น่าเชื่อถือ** อ่านก่อนเปิดใช้
- ควรใช้การรันแบบ sandbox สำหรับอินพุตที่ไม่น่าเชื่อถือและ tools ที่มีความเสี่ยง ดู [Sandboxing](/th/gateway/sandboxing)
- การค้นพบ skill ของ workspace และ extra-dir จะยอมรับเฉพาะ skill roots และไฟล์ `SKILL.md` ที่ realpath ที่ resolve แล้ว
  ยังอยู่ภายใน root ที่กำหนดค่าไว้
- การติดตั้ง dependency ของ skill ที่ทำผ่าน Gateway (`skills.install`, onboarding และ UI ตั้งค่า Skills)
  จะรัน dangerous-code scanner ในตัวก่อนจะดำเนินการ metadata ของตัวติดตั้ง การพบระดับ `critical`
  จะบล็อกโดยค่าเริ่มต้น เว้นแต่ผู้เรียกจะตั้ง dangerous override อย่างชัดเจน; ส่วนการพบที่น่าสงสัยยังคงเป็นเพียงคำเตือน
- `openclaw skills install <slug>` แตกต่างออกไป: มันดาวน์โหลดโฟลเดอร์ skill จาก ClawHub ลงใน workspace และไม่ใช้เส้นทาง installer-metadata ข้างต้น
- `skills.entries.*.env` และ `skills.entries.*.apiKey` จะ inject ความลับเข้าสู่ process บน **host**
  สำหรับเทิร์นของเอเจนต์นั้น (ไม่ใช่ใน sandbox) เก็บความลับให้ห่างจาก prompts และ logs
- สำหรับ threat model และ checklist ที่กว้างกว่า ดู [Security](/th/gateway/security)

## รูปแบบ (AgentSkills + เข้ากันได้กับ Pi)

`SKILL.md` ต้องมีอย่างน้อย:

```markdown
---
name: image-lab
description: Generate or edit images via a provider-backed image workflow
---
```

หมายเหตุ:

- เราทำตามสเปก AgentSkills สำหรับ layout/intent
- parser ที่เอเจนต์แบบฝังตัวใช้ รองรับคีย์ frontmatter แบบ **บรรทัดเดียว** เท่านั้น
- `metadata` ควรเป็น **อ็อบเจ็กต์ JSON แบบบรรทัดเดียว**
- ใช้ `{baseDir}` ในคำสั่งเพื่ออ้างอิงพาธโฟลเดอร์ของ skill
- คีย์ frontmatter แบบไม่บังคับ:
  - `homepage` — URL ที่จะแสดงเป็น “Website” ใน macOS Skills UI (รองรับผ่าน `metadata.openclaw.homepage` ได้เช่นกัน)
  - `user-invocable` — `true|false` (ค่าเริ่มต้น: `true`) เมื่อเป็น `true` skill จะถูกเปิดเผยเป็น user slash command
  - `disable-model-invocation` — `true|false` (ค่าเริ่มต้น: `false`) เมื่อเป็น `true` skill จะถูกตัดออกจาก model prompt (แต่ยังเรียกใช้ผ่านผู้ใช้ได้)
  - `command-dispatch` — `tool` (ไม่บังคับ) เมื่อตั้งเป็น `tool` slash command จะข้ามโมเดลและส่งต่อไปยัง tool โดยตรง
  - `command-tool` — ชื่อ tool ที่จะเรียกเมื่อมีการตั้ง `command-dispatch: tool`
  - `command-arg-mode` — `raw` (ค่าเริ่มต้น) สำหรับการส่งต่อไปยัง tool จะส่งต่อสตริง args ดิบไปยัง tool (ไม่มีการ parse ใน core)

    tool จะถูกเรียกพร้อม params:
    `{ command: "<raw args>", commandName: "<slash command>", skillName: "<skill name>" }`

## การควบคุม (ตัวกรองตอนโหลด)

OpenClaw **กรอง skills ตอนเวลาโหลด** โดยใช้ `metadata` (JSON แบบบรรทัดเดียว):

```markdown
---
name: image-lab
description: Generate or edit images via a provider-backed image workflow
metadata:
  {
    "openclaw":
      {
        "requires": { "bins": ["uv"], "env": ["GEMINI_API_KEY"], "config": ["browser.enabled"] },
        "primaryEnv": "GEMINI_API_KEY",
      },
  }
---
```

ฟิลด์ภายใต้ `metadata.openclaw`:

- `always: true` — รวม skill นี้เสมอ (ข้าม gates อื่น)
- `emoji` — emoji แบบไม่บังคับที่ใช้โดย macOS Skills UI
- `homepage` — URL แบบไม่บังคับที่แสดงเป็น “Website” ใน macOS Skills UI
- `os` — รายการแพลตฟอร์มแบบไม่บังคับ (`darwin`, `linux`, `win32`) หากตั้งไว้ skill จะมีสิทธิ์เฉพาะบน OS เหล่านั้น
- `requires.bins` — รายการ; แต่ละรายการต้องมีอยู่บน `PATH`
- `requires.anyBins` — รายการ; ต้องมีอย่างน้อยหนึ่งรายการอยู่บน `PATH`
- `requires.env` — รายการ; env var ต้องมีอยู่ **หรือ** ถูกจัดเตรียมผ่าน config
- `requires.config` — รายการพาธของ `openclaw.json` ที่ต้องเป็น truthy
- `primaryEnv` — ชื่อ env var ที่เชื่อมกับ `skills.entries.<name>.apiKey`
- `install` — อาร์เรย์แบบไม่บังคับของ installer spec ที่ใช้โดย macOS Skills UI (brew/node/go/uv/download)

หมายเหตุเกี่ยวกับ sandboxing:

- `requires.bins` ถูกตรวจสอบบน **host** ตอนเวลาโหลด skill
- หากเอเจนต์อยู่ใน sandbox ไบนารีนั้นต้องมีอยู่ **ภายใน container** ด้วย
  ให้ติดตั้งผ่าน `agents.defaults.sandbox.docker.setupCommand` (หรือ image แบบกำหนดเอง)
  `setupCommand` จะรันหนึ่งครั้งหลังจากสร้าง container แล้ว
  การติดตั้งแพ็กเกจยังต้องมี network egress, root FS ที่เขียนได้ และผู้ใช้ root ใน sandbox
  ตัวอย่าง: skill `summarize` (`skills/summarize/SKILL.md`) ต้องใช้ `summarize` CLI
  ภายใน container ของ sandbox จึงจะรันที่นั่นได้

ตัวอย่าง installer:

```markdown
---
name: gemini
description: Use Gemini CLI for coding assistance and Google search lookups.
metadata:
  {
    "openclaw":
      {
        "emoji": "♊️",
        "requires": { "bins": ["gemini"] },
        "install":
          [
            {
              "id": "brew",
              "kind": "brew",
              "formula": "gemini-cli",
              "bins": ["gemini"],
              "label": "Install Gemini CLI (brew)",
            },
          ],
      },
  }
---
```

หมายเหตุ:

- หากมี installer หลายรายการ gateway จะเลือกตัวเลือกที่ต้องการ **เพียงตัวเดียว** (brew เมื่อมี ไม่เช่นนั้นเป็น node)
- หาก installer ทั้งหมดเป็น `download` OpenClaw จะแสดงแต่ละรายการเพื่อให้คุณเห็น artifact ที่มี
- installer spec สามารถมี `os: ["darwin"|"linux"|"win32"]` เพื่อกรองตัวเลือกตามแพลตฟอร์ม
- การติดตั้งผ่าน node จะยึดตาม `skills.install.nodeManager` ใน `openclaw.json` (ค่าเริ่มต้น: npm; ตัวเลือก: npm/pnpm/yarn/bun)
  สิ่งนี้มีผลเฉพาะกับ **การติดตั้ง skill**; ส่วน runtime ของ Gateway ยังควรเป็น Node
  (ไม่แนะนำ Bun สำหรับ WhatsApp/Telegram)
- การเลือก installer ที่ทำผ่าน Gateway เป็นแบบอิงค่าความชอบ ไม่ใช่เฉพาะ node:
  เมื่อ install specs มีหลายชนิด OpenClaw จะให้ความสำคัญกับ Homebrew เมื่อ
  เปิด `skills.install.preferBrew` และมี `brew`, จากนั้น `uv`, แล้วจึงเป็น
  node manager ที่กำหนดค่าไว้ จากนั้นค่อยเป็น fallback อื่น เช่น `go` หรือ `download`
- หาก install spec ทุกตัวเป็น `download` OpenClaw จะแสดงตัวเลือกดาวน์โหลดทั้งหมด
  แทนที่จะยุบเหลือ installer ที่ต้องการเพียงตัวเดียว
- การติดตั้ง Go: หากไม่มี `go` และมี `brew` gateway จะติดตั้ง Go ผ่าน Homebrew ก่อน แล้วตั้ง `GOBIN` ไปยัง `bin` ของ Homebrew หากทำได้
- การติดตั้งแบบดาวน์โหลด: `url` (จำเป็น), `archive` (`tar.gz` | `tar.bz2` | `zip`), `extract` (ค่าเริ่มต้น: อัตโนมัติเมื่อพบว่าเป็น archive), `stripComponents`, `targetDir` (ค่าเริ่มต้น: `~/.openclaw/tools/<skillKey>`)

หากไม่มี `metadata.openclaw` skill จะมีสิทธิ์ใช้งานเสมอ (เว้นแต่
จะถูกปิดใน config หรือถูกบล็อกโดย `skills.allowBundled` สำหรับ bundled skills)

## Config overrides (`~/.openclaw/openclaw.json`)

Bundled/managed skills สามารถเปิดปิดและรับค่า env ที่ส่งเข้าไปได้:

```json5
{
  skills: {
    entries: {
      "image-lab": {
        enabled: true,
        apiKey: { source: "env", provider: "default", id: "GEMINI_API_KEY" }, // หรือสตริง plaintext
        env: {
          GEMINI_API_KEY: "GEMINI_KEY_HERE",
        },
        config: {
          endpoint: "https://example.invalid",
          model: "nano-pro",
        },
      },
      peekaboo: { enabled: true },
      sag: { enabled: false },
    },
  },
}
```

หมายเหตุ: หากชื่อ skill มีเครื่องหมายขีดกลาง ให้ใส่คีย์นั้นในเครื่องหมายคำพูด (JSON5 อนุญาตให้ใช้คีย์แบบใส่เครื่องหมายคำพูดได้)

หากคุณต้องการการสร้าง/แก้ไขภาพแบบ stock ภายใน OpenClaw เอง ให้ใช้
tool หลัก `image_generate` พร้อม `agents.defaults.imageGenerationModel` แทน
bundled skill ตัวอย่าง skill ที่นี่มีไว้สำหรับเวิร์กโฟลว์แบบกำหนดเองหรือจากบุคคลที่สาม

สำหรับการวิเคราะห์ภาพแบบเนทีฟ ให้ใช้ tool `image` พร้อม `agents.defaults.imageModel`
สำหรับการสร้าง/แก้ไขภาพแบบเนทีฟ ให้ใช้ `image_generate` พร้อม
`agents.defaults.imageGenerationModel` หากคุณเลือก `openai/*`, `google/*`,
`fal/*` หรือโมเดลภาพเฉพาะผู้ให้บริการอื่น ให้เพิ่ม auth/API
key ของผู้ให้บริการนั้นด้วย

คีย์ config จะตรงกับ **ชื่อ skill** ตามค่าเริ่มต้น หาก skill ใดกำหนด
`metadata.openclaw.skillKey` ให้ใช้คีย์นั้นภายใต้ `skills.entries`

กฎ:

- `enabled: false` จะปิดการใช้งาน skill แม้ว่าจะเป็น bundled/installed อยู่ก็ตาม
- `env`: จะถูก inject **เฉพาะเมื่อ** ตัวแปรนั้นยังไม่ได้ถูกตั้งไว้ใน process
- `apiKey`: ตัวช่วยสำหรับ skills ที่ประกาศ `metadata.openclaw.primaryEnv`
  รองรับทั้งสตริง plaintext หรืออ็อบเจ็กต์ SecretRef (`{ source, provider, id }`)
- `config`: ถุงเก็บข้อมูลแบบไม่บังคับสำหรับฟิลด์เฉพาะ skill; คีย์แบบกำหนดเองต้องอยู่ที่นี่
- `allowBundled`: allowlist แบบไม่บังคับสำหรับ **bundled** skills เท่านั้น หากมีการตั้งค่าไว้ จะมีสิทธิ์เฉพาะ
  bundled skills ที่อยู่ในรายการนั้นเท่านั้น (managed/workspace skills ไม่ได้รับผลกระทบ)

## การ inject environment (ต่อการรันของเอเจนต์)

เมื่อการรันของเอเจนต์เริ่มต้น OpenClaw จะ:

1. อ่าน metadata ของ skill
2. ใช้ `skills.entries.<key>.env` หรือ `skills.entries.<key>.apiKey` กับ
   `process.env`
3. สร้าง system prompt ด้วย skills ที่ **มีสิทธิ์ใช้งาน**
4. คืนค่า environment เดิมหลังจากการรันจบลง

สิ่งนี้มี **ขอบเขตเฉพาะกับการรันของเอเจนต์** ไม่ใช่ environment shell แบบ global

สำหรับ backend `claude-cli` ที่ bundled มากับระบบ OpenClaw ยังจะ materialize
snapshot ที่มีสิทธิ์ชุดเดียวกันเป็น Claude Code plugin ชั่วคราว และส่งผ่าน
`--plugin-dir` ด้วย จากนั้น Claude Code ก็สามารถใช้ native skill resolver ของมันได้
ขณะที่ OpenClaw ยังคงเป็นผู้ควบคุมเรื่องลำดับความสำคัญ, allowlist ต่อเอเจนต์, gating และ
การ inject env/API key ของ `skills.entries.*` ส่วน CLI backend อื่นจะใช้เฉพาะ prompt
catalog เท่านั้น

## Session snapshot (ประสิทธิภาพ)

OpenClaw จะสร้าง snapshot ของ skills ที่มีสิทธิ์ใช้งาน **เมื่อเซสชันเริ่มต้น** และนำรายการนั้นกลับมาใช้ซ้ำสำหรับเทิร์นถัด ๆ ไปในเซสชันเดียวกัน การเปลี่ยนแปลงของ skills หรือ config จะมีผลในเซสชันใหม่ครั้งถัดไป

Skills ยังสามารถรีเฟรชระหว่างเซสชันได้เมื่อเปิดใช้ skills watcher หรือเมื่อมี remote node ใหม่ที่มีสิทธิ์ใช้งานปรากฏขึ้น (ดูด้านล่าง) ให้คิดว่านี่คือ **hot reload**: รายการที่รีเฟรชแล้วจะถูกนำไปใช้ในเทิร์นถัดไปของเอเจนต์

หาก allowlist ของ skill ต่อเอเจนต์ที่มีผลกับเซสชันนั้นเปลี่ยนไป OpenClaw
จะรีเฟรช snapshot เพื่อให้ skills ที่มองเห็นได้ยังคงสอดคล้องกับเอเจนต์
ปัจจุบัน

## Remote macOS nodes (Linux gateway)

หาก Gateway กำลังรันอยู่บน Linux แต่มี **macOS node** เชื่อมต่ออยู่ **โดยอนุญาต `system.run`** (การตั้งค่าความปลอดภัย Exec approvals ไม่ได้ตั้งเป็น `deny`) OpenClaw สามารถถือว่า skills ที่ใช้ได้เฉพาะบน macOS มีสิทธิ์ใช้งานได้เมื่อมีไบนารีที่จำเป็นอยู่บน node นั้น เอเจนต์ควรเรียกใช้ skills เหล่านั้นผ่าน tool `exec` โดยใช้ `host=node`

สิ่งนี้อาศัยการที่ node รายงานการรองรับคำสั่งของตัวเอง และการ probe หาไบนารีผ่าน `system.run` หาก macOS node หลุดออฟไลน์ในภายหลัง skills จะยังคงมองเห็นได้; การเรียกใช้อาจล้มเหลวจนกว่า node จะเชื่อมต่อใหม่

## Skills watcher (รีเฟรชอัตโนมัติ)

ตามค่าเริ่มต้น OpenClaw จะเฝ้าดูโฟลเดอร์ skill และเพิ่มเวอร์ชันของ skills snapshot เมื่อไฟล์ `SKILL.md` เปลี่ยนแปลง กำหนดค่าได้ภายใต้ `skills.load`:

```json5
{
  skills: {
    load: {
      watch: true,
      watchDebounceMs: 250,
    },
  },
}
```

## ผลกระทบต่อ token (รายการ skills)

เมื่อมี skills ที่มีสิทธิ์ใช้งาน OpenClaw จะ inject รายการ XML แบบกระชับของ skills ที่ใช้งานได้ลงใน system prompt (ผ่าน `formatSkillsForPrompt` ใน `pi-coding-agent`) ค่าใช้จ่ายเป็นแบบกำหนดแน่นอน:

- **ค่า overhead พื้นฐาน (เฉพาะเมื่อมีอย่างน้อย 1 skill):** 195 อักขระ
- **ต่อ skill:** 97 อักขระ + ความยาวของค่า `<name>`, `<description>` และ `<location>` ที่ escape เป็น XML แล้ว

สูตร (อักขระ):

```
total = 195 + Σ (97 + len(name_escaped) + len(description_escaped) + len(location_escaped))
```

หมายเหตุ:

- การ escape XML จะขยาย `& < > " '` ให้เป็น entity (`&amp;`, `&lt;` ฯลฯ) ทำให้ความยาวเพิ่มขึ้น
- จำนวน token จะแตกต่างกันตาม tokenizer ของโมเดล ประมาณแบบคร่าว ๆ ตาม OpenAI คือ ~4 อักขระต่อ token ดังนั้น **97 อักขระ ≈ 24 tokens** ต่อ skill บวกกับความยาวจริงของแต่ละฟิลด์

## วงจรชีวิตของ managed skills

OpenClaw มาพร้อมชุด skills พื้นฐานในรูปของ **bundled skills** ซึ่งเป็นส่วนหนึ่งของ
การติดตั้ง (แพ็กเกจ npm หรือ OpenClaw.app) ส่วน `~/.openclaw/skills` มีไว้สำหรับ
local override (เช่น pin/patch skill โดยไม่แก้สำเนา bundled)
Workspace skills เป็นของผู้ใช้และจะ override ทั้งสองแบบเมื่อชื่อชนกัน

## เอกสารอ้างอิง Config

ดู [Skills config](/th/tools/skills-config) สำหรับ schema การตั้งค่าฉบับเต็ม

## กำลังมองหา skills เพิ่มเติมอยู่หรือไม่?

ดูได้ที่ [https://clawhub.ai](https://clawhub.ai)

---

## ที่เกี่ยวข้อง

- [Creating Skills](/th/tools/creating-skills) — การสร้าง skills แบบกำหนดเอง
- [Skills Config](/th/tools/skills-config) — เอกสารอ้างอิงการตั้งค่า skill
- [Slash Commands](/th/tools/slash-commands) — slash commands ที่ใช้ได้ทั้งหมด
- [Plugins](/th/tools/plugin) — ภาพรวมของระบบ Plugin
