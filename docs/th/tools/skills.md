---
read_when:
    - การเพิ่มหรือแก้ไข Skills
    - การเปลี่ยนกฎการควบคุมหรือกฎการโหลดของ skill
summary: 'Skills: แบบที่จัดการโดยระบบเทียบกับแบบในพื้นที่ทำงาน, กฎการควบคุม และการเชื่อมต่อ config/env'
title: Skills
x-i18n:
    generated_at: "2026-04-24T09:38:19Z"
    model: gpt-5.4
    provider: openai
    source_hash: 3c7db23e1eb818d62283376cb33353882a9cb30e4476c5775218137da2ba82d9
    source_path: tools/skills.md
    workflow: 15
---

OpenClaw ใช้โฟลเดอร์ skill ที่เข้ากันได้กับ **[AgentSkills](https://agentskills.io)** เพื่อสอนเอเจนต์ให้รู้วิธีใช้เครื่องมือ แต่ละ skill เป็นไดเรกทอรีที่มี `SKILL.md` พร้อม YAML frontmatter และคำแนะนำ OpenClaw จะโหลด **bundled skills** พร้อม local overrides แบบทางเลือก และกรองตั้งแต่ตอนโหลดตามสภาพแวดล้อม คอนฟิก และการมีอยู่ของไบนารี

## ตำแหน่งและลำดับความสำคัญ

OpenClaw โหลด skills จากแหล่งต่อไปนี้:

1. **โฟลเดอร์ skill เพิ่มเติม**: กำหนดด้วย `skills.load.extraDirs`
2. **Bundled skills**: มากับการติดตั้ง (npm package หรือ OpenClaw.app)
3. **Managed/local skills**: `~/.openclaw/skills`
4. **Personal agent skills**: `~/.agents/skills`
5. **Project agent skills**: `<workspace>/.agents/skills`
6. **Workspace skills**: `<workspace>/skills`

หากชื่อ skill ซ้ำกัน ลำดับความสำคัญคือ:

`<workspace>/skills` (สูงสุด) → `<workspace>/.agents/skills` → `~/.agents/skills` → `~/.openclaw/skills` → bundled skills → `skills.load.extraDirs` (ต่ำสุด)

## Skills ต่อเอเจนต์ เทียบกับ Skills ที่ใช้ร่วมกัน

ในระบบ **หลายเอเจนต์** แต่ละเอเจนต์จะมี workspace ของตัวเอง ซึ่งหมายความว่า:

- **Skills ต่อเอเจนต์** อยู่ใน `<workspace>/skills` สำหรับเอเจนต์นั้นเท่านั้น
- **Project agent skills** อยู่ใน `<workspace>/.agents/skills` และมีผลกับ
  workspace นั้นก่อนโฟลเดอร์ `skills/` ปกติของ workspace
- **Personal agent skills** อยู่ใน `~/.agents/skills` และมีผลข้าม
  workspaces บนเครื่องนั้น
- **Skills ที่ใช้ร่วมกัน** อยู่ใน `~/.openclaw/skills` (managed/local) และมองเห็นได้
  สำหรับ **ทุกเอเจนต์** บนเครื่องเดียวกัน
- **โฟลเดอร์ที่ใช้ร่วมกัน** ยังสามารถเพิ่มผ่าน `skills.load.extraDirs` ได้ (ลำดับความสำคัญ
  ต่ำสุด) หากคุณต้องการชุด Skills กลางที่เอเจนต์หลายตัวใช้ร่วมกัน

หากมีชื่อ skill เดียวกันในหลายตำแหน่ง ให้ใช้ลำดับความสำคัญตามปกติ:
workspace ชนะ ตามด้วย project agent skills แล้ว personal agent skills
จากนั้น managed/local แล้ว bundled และสุดท้าย extra dirs

## Allowlists ของ skill ต่อเอเจนต์

**ตำแหน่ง** ของ skill และ **การมองเห็น** ของ skill เป็นการควบคุมคนละส่วน

- ตำแหน่ง/ลำดับความสำคัญเป็นตัวตัดสินว่าสำเนาใดของ skill ชื่อเดียวกันจะชนะ
- allowlists ของเอเจนต์เป็นตัวตัดสินว่า skill ที่มองเห็นได้ตัวใดที่เอเจนต์สามารถใช้ได้จริง

ใช้ `agents.defaults.skills` สำหรับ baseline ที่ใช้ร่วมกัน แล้ว override ต่อเอเจนต์ด้วย
`agents.list[].skills`:

```json5
{
  agents: {
    defaults: {
      skills: ["github", "weather"],
    },
    list: [
      { id: "writer" }, // inherits github, weather
      { id: "docs", skills: ["docs-search"] }, // replaces defaults
      { id: "locked-down", skills: [] }, // no skills
    ],
  },
}
```

กฎ:

- ไม่ต้องกำหนด `agents.defaults.skills` หากต้องการให้ Skills ไม่ถูกจำกัดโดยค่าเริ่มต้น
- ไม่ต้องกำหนด `agents.list[].skills` หากต้องการให้สืบทอด `agents.defaults.skills`
- ตั้ง `agents.list[].skills: []` หากไม่ต้องการ Skills เลย
- รายการ `agents.list[].skills` ที่ไม่ว่างคือชุดสุดท้ายสำหรับเอเจนต์นั้น
  โดยจะไม่ merge กับ defaults

OpenClaw จะใช้ชุด skill ที่มีผลจริงของเอเจนต์กับการสร้าง prompt,
การค้นพบ skill slash-command, การซิงก์ sandbox และ snapshots ของ skill

## Plugins + Skills

Plugins สามารถมากับ skills ของตัวเองได้โดยระบุไดเรกทอรี `skills` ใน
`openclaw.plugin.json` (พาธสัมพัทธ์กับรากของ plugin) Skills ของ Plugin จะถูกโหลด
เมื่อ Plugin ถูกเปิดใช้งาน ปัจจุบันไดเรกทอรีเหล่านั้นจะถูกรวมเข้าไปในพาธลำดับความสำคัญต่ำชุดเดียวกับ `skills.load.extraDirs` ดังนั้นหากมี skill ชื่อเดียวกัน
bundled, managed, agent หรือ workspace skill จะ override มัน
คุณสามารถควบคุมการโหลดด้วย `metadata.openclaw.requires.config` บนรายการ config
ของ Plugin ดู [Plugins](/th/tools/plugin) สำหรับการค้นพบ/การกำหนดค่า และ [Tools](/th/tools) สำหรับ
พื้นผิวเครื่องมือที่ Skills เหล่านั้นใช้สอน

## Skill Workshop

Plugin Skill Workshop แบบทางเลือกและ experimental สามารถสร้างหรืออัปเดต workspace
skills จากกระบวนการที่นำกลับมาใช้ใหม่ได้ซึ่งสังเกตเห็นระหว่างการทำงานของเอเจนต์ โดยถูกปิดไว้เป็นค่าเริ่มต้น และต้องเปิดใช้งานอย่างชัดเจนผ่าน
`plugins.entries.skill-workshop`

Skill Workshop จะเขียนเฉพาะไปยัง `<workspace>/skills`, สแกนเนื้อหาที่สร้างขึ้น,
รองรับการอนุมัติแบบรอดำเนินการหรือการเขียนที่ปลอดภัยแบบอัตโนมัติ, กักกัน
ข้อเสนอที่ไม่ปลอดภัย และรีเฟรช snapshot ของ skill หลังจากเขียนสำเร็จ เพื่อให้ Skills ใหม่พร้อมใช้งานได้โดยไม่ต้องรีสตาร์ต Gateway

ใช้เมื่อคุณต้องการให้การแก้ไขเช่น “ครั้งหน้าให้ตรวจสอบแหล่งที่มาของ GIF” หรือ
เวิร์กโฟลว์ที่ได้มาด้วยความพยายาม เช่น เช็กลิสต์ QA ของสื่อ กลายเป็นคำสั่งเชิงกระบวนการที่คงทน เริ่มด้วยการอนุมัติแบบรอดำเนินการ; ใช้การเขียนอัตโนมัติเฉพาะใน workspace ที่เชื่อถือได้หลังจากตรวจทานข้อเสนอแล้ว คู่มือเต็ม:
[Skill Workshop Plugin](/th/plugins/skill-workshop)

## ClawHub (ติดตั้ง + ซิงก์)

ClawHub คือรีจิสทรี Skills สาธารณะสำหรับ OpenClaw เรียกดูได้ที่
[https://clawhub.ai](https://clawhub.ai) ใช้คำสั่ง `openclaw skills`
แบบเนทีฟเพื่อค้นหา/ติดตั้ง/อัปเดต Skills หรือใช้ CLI `clawhub` แยกต่างหากเมื่อ
คุณต้องการเวิร์กโฟลว์การเผยแพร่/ซิงก์
คู่มือเต็ม: [ClawHub](/th/tools/clawhub)

โฟลว์ทั่วไป:

- ติดตั้ง skill ลงใน workspace ของคุณ:
  - `openclaw skills install <skill-slug>`
- อัปเดต Skills ที่ติดตั้งทั้งหมด:
  - `openclaw skills update --all`
- ซิงก์ (สแกน + เผยแพร่การอัปเดต):
  - `clawhub sync --all`

`openclaw skills install` แบบเนทีฟจะติดตั้งลงในไดเรกทอรี `skills/` ของ workspace ที่กำลังใช้งาน CLI `clawhub` ที่แยกต่างหากก็จะติดตั้งลงใน `./skills` ภายใต้
ไดเรกทอรีทำงานปัจจุบันของคุณเช่นกัน (หรือ fallback ไปยัง workspace ของ OpenClaw ที่ตั้งค่าไว้)
OpenClaw จะรับสิ่งนั้นมาเป็น `<workspace>/skills` ในเซสชันถัดไป

## หมายเหตุด้านความปลอดภัย

- ให้ถือว่า third-party skills เป็น **โค้ดที่ไม่น่าเชื่อถือ** อ่านก่อนเปิดใช้
- ควรใช้การรันแบบ sandboxed สำหรับอินพุตที่ไม่น่าเชื่อถือและเครื่องมือที่มีความเสี่ยง ดู [Sandboxing](/th/gateway/sandboxing)
- การค้นพบ skill ใน workspace และ extra-dir จะยอมรับเฉพาะรากของ skill และไฟล์ `SKILL.md` ที่ resolved realpath ยังอยู่ภายในรากที่ตั้งค่าไว้เท่านั้น
- การติดตั้ง dependency ของ skill ที่ขับเคลื่อนโดย Gateway (`skills.install`, onboarding และ Skills settings UI) จะรัน dangerous-code scanner ที่มีมาในตัวก่อนรัน metadata ของตัวติดตั้ง ผลลัพธ์ระดับ `critical` จะถูกบล็อกโดยค่าเริ่มต้น เว้นแต่ผู้เรียกจะตั้ง dangerous override อย่างชัดเจน; ส่วนผลลัพธ์ที่น่าสงสัยยังคงเป็นเพียงคำเตือนเท่านั้น
- `openclaw skills install <slug>` แตกต่างออกไป: มันจะดาวน์โหลดโฟลเดอร์ skill ของ ClawHub ลงใน workspace และไม่ใช้พาธ installer-metadata ตามที่กล่าวถึงด้านบน
- `skills.entries.*.env` และ `skills.entries.*.apiKey` จะ inject ความลับเข้าสู่โพรเซส **host**
  สำหรับ agent turn นั้น (ไม่ใช่ sandbox) เก็บความลับให้ห่างจาก prompts และ logs
- สำหรับแบบจำลองภัยคุกคามและเช็กลิสต์ที่กว้างขึ้น ดู [ความปลอดภัย](/th/gateway/security)

## รูปแบบ (เข้ากันได้กับ AgentSkills + Pi)

`SKILL.md` ต้องมีอย่างน้อย:

```markdown
---
name: image-lab
description: Generate or edit images via a provider-backed image workflow
---
```

หมายเหตุ:

- เราปฏิบัติตามสเปก AgentSkills สำหรับเลย์เอาต์/เจตนา
- parser ที่เอเจนต์แบบฝังใช้รองรับคีย์ frontmatter แบบ **บรรทัดเดียว** เท่านั้น
- `metadata` ควรเป็น **ออบเจ็กต์ JSON แบบบรรทัดเดียว**
- ใช้ `{baseDir}` ในคำสั่งเพื่ออ้างถึงพาธโฟลเดอร์ของ skill
- คีย์ frontmatter แบบทางเลือก:
  - `homepage` — URL ที่แสดงเป็น “Website” ใน UI Skills บน macOS (รองรับผ่าน `metadata.openclaw.homepage` ด้วย)
  - `user-invocable` — `true|false` (ค่าเริ่มต้น: `true`) เมื่อเป็น `true` skill จะถูกเปิดเผยเป็น user slash command
  - `disable-model-invocation` — `true|false` (ค่าเริ่มต้น: `false`) เมื่อเป็น `true` skill จะไม่ถูกรวมใน prompt ของโมเดล (แต่ยังเรียกใช้ผ่านผู้ใช้ได้)
  - `command-dispatch` — `tool` (ทางเลือก) เมื่อกำหนดเป็น `tool` slash command จะข้ามโมเดลและส่งตรงไปยังเครื่องมือ
  - `command-tool` — ชื่อเครื่องมือที่จะเรียกเมื่อกำหนด `command-dispatch: tool`
  - `command-arg-mode` — `raw` (ค่าเริ่มต้น) สำหรับการส่งไปยังเครื่องมือ จะส่งต่อสตริง args ดิบไปยังเครื่องมือ (ไม่มีการ parse ในแกนกลาง)

    เครื่องมือจะถูกเรียกด้วยพารามิเตอร์:
    `{ command: "<raw args>", commandName: "<slash command>", skillName: "<skill name>" }`

## การควบคุม (ตัวกรองตอนโหลด)

OpenClaw จะ **กรอง Skills ตั้งแต่ตอนโหลด** โดยใช้ `metadata` (JSON แบบบรรทัดเดียว):

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

- `always: true` — รวม skill นี้เสมอ (ข้ามการควบคุมอื่น)
- `emoji` — อีโมจิแบบทางเลือกที่ใช้โดย UI Skills บน macOS
- `homepage` — URL แบบทางเลือกที่แสดงเป็น “Website” ใน UI Skills บน macOS
- `os` — รายการแพลตฟอร์มแบบทางเลือก (`darwin`, `linux`, `win32`) หากกำหนดไว้ skill จะมีสิทธิ์เฉพาะบน OS เหล่านั้น
- `requires.bins` — รายการ; แต่ละตัวต้องมีอยู่บน `PATH`
- `requires.anyBins` — รายการ; ต้องมีอย่างน้อยหนึ่งตัวบน `PATH`
- `requires.env` — รายการ; env var ต้องมีอยู่ **หรือ** ถูกจัดให้ผ่าน config
- `requires.config` — รายการพาธ `openclaw.json` ที่ต้องมีค่าเป็น truthy
- `primaryEnv` — ชื่อ env var ที่เชื่อมโยงกับ `skills.entries.<name>.apiKey`
- `install` — อาร์เรย์แบบทางเลือกของสเปกตัวติดตั้งที่ UI Skills บน macOS ใช้ (brew/node/go/uv/download)

หมายเหตุเรื่อง sandboxing:

- `requires.bins` จะถูกตรวจสอบบน **host** ตอนโหลด skill
- หากเอเจนต์ถูก sandboxed ไบนารีนั้นต้องมีอยู่ **ภายในคอนเทนเนอร์ด้วย**
  ให้ติดตั้งผ่าน `agents.defaults.sandbox.docker.setupCommand` (หรือ image แบบกำหนดเอง)
  `setupCommand` จะรันหนึ่งครั้งหลังจากคอนเทนเนอร์ถูกสร้าง
  การติดตั้งแพ็กเกจยังต้องใช้ network egress, root FS ที่เขียนได้ และผู้ใช้ root ใน sandbox
  ตัวอย่าง: skill `summarize` (`skills/summarize/SKILL.md`) ต้องใช้ CLI `summarize`
  ในคอนเทนเนอร์ sandbox เพื่อให้รันที่นั่นได้

ตัวอย่างตัวติดตั้ง:

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

- หากมีตัวติดตั้งหลายรายการ Gateway จะเลือกตัวเลือกที่ต้องการเพียง **หนึ่ง** รายการ (brew หากมี มิฉะนั้น node)
- หากตัวติดตั้งทั้งหมดเป็น `download`, OpenClaw จะแสดงทุกรายการเพื่อให้คุณเห็นอาร์ติแฟกต์ที่มีอยู่
- สเปกตัวติดตั้งสามารถมี `os: ["darwin"|"linux"|"win32"]` เพื่อกรองตัวเลือกตามแพลตฟอร์ม
- การติดตั้งแบบ Node จะใช้ `skills.install.nodeManager` ใน `openclaw.json` (ค่าเริ่มต้น: npm; ตัวเลือก: npm/pnpm/yarn/bun)
  สิ่งนี้มีผลเฉพาะกับ **การติดตั้ง skill**; runtime ของ Gateway เองยังคงควรเป็น Node
  (ไม่แนะนำ Bun สำหรับ WhatsApp/Telegram)
- การเลือกตัวติดตั้งที่ขับเคลื่อนโดย Gateway เป็นแบบอิงความต้องการ ไม่ได้จำกัดเฉพาะ node:
  เมื่อสเปกตัวติดตั้งมีหลายชนิดปนกัน OpenClaw จะให้ความสำคัญกับ Homebrew เมื่อ
  เปิด `skills.install.preferBrew` และมี `brew`, จากนั้น `uv`, แล้วจึง
  node manager ที่ตั้งค่าไว้ ตามด้วย fallback อื่น ๆ เช่น `go` หรือ `download`
- หาก install spec ทุกตัวเป็น `download`, OpenClaw จะแสดงตัวเลือกดาวน์โหลดทั้งหมด
  แทนการยุบเหลือ installer ที่ต้องการเพียงตัวเดียว
- การติดตั้งแบบ Go: หากไม่มี `go` และมี `brew`, gateway จะติดตั้ง Go ผ่าน Homebrew ก่อน และตั้ง `GOBIN` ไปยัง `bin` ของ Homebrew เมื่อทำได้
- การติดตั้งแบบดาวน์โหลด: `url` (จำเป็น), `archive` (`tar.gz` | `tar.bz2` | `zip`), `extract` (ค่าเริ่มต้น: อัตโนมัติเมื่อตรวจพบ archive), `stripComponents`, `targetDir` (ค่าเริ่มต้น: `~/.openclaw/tools/<skillKey>`)

หากไม่มี `metadata.openclaw`, skill จะมีสิทธิ์ใช้งานได้เสมอ (เว้นแต่
จะถูกปิดใน config หรือถูกบล็อกโดย `skills.allowBundled` สำหรับ bundled skills)

## การ override คอนฟิก (`~/.openclaw/openclaw.json`)

Bundled/managed skills สามารถเปิดปิดได้และสามารถรับค่า env ได้:

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

หมายเหตุ: หากชื่อ skill มีขีดกลาง ให้ใส่เครื่องหมายอัญประกาศรอบคีย์ (JSON5 อนุญาตให้ใช้คีย์ที่ใส่อัญประกาศได้)

หากคุณต้องการการสร้าง/แก้ไขภาพแบบมาตรฐานภายใน OpenClaw เอง ให้ใช้
เครื่องมือแกนกลาง `image_generate` กับ `agents.defaults.imageGenerationModel` แทน
bundled skill ตัวอย่าง skill ที่นี่มีไว้สำหรับเวิร์กโฟลว์แบบกำหนดเองหรือของ third-party

สำหรับการวิเคราะห์ภาพแบบเนทีฟ ให้ใช้เครื่องมือ `image` กับ `agents.defaults.imageModel`
สำหรับการสร้าง/แก้ไขภาพแบบเนทีฟ ให้ใช้ `image_generate` กับ
`agents.defaults.imageGenerationModel` หากคุณเลือก `openai/*`, `google/*`,
`fal/*` หรือโมเดลภาพเฉพาะผู้ให้บริการอื่น ๆ ให้เพิ่มการยืนยันตัวตน/API
key ของผู้ให้บริการนั้นด้วย

คีย์คอนฟิกจะตรงกับ **ชื่อ skill** โดยค่าเริ่มต้น หาก skill กำหนด
`metadata.openclaw.skillKey` ให้ใช้คีย์นั้นภายใต้ `skills.entries`

กฎ:

- `enabled: false` จะปิด skill แม้ว่าจะเป็น bundled/installed อยู่ก็ตาม
- `env`: จะถูก inject **ก็ต่อเมื่อ** ตัวแปรนั้นยังไม่ได้ตั้งค่าอยู่ในโพรเซส
- `apiKey`: ตัวช่วยสำหรับ Skills ที่ประกาศ `metadata.openclaw.primaryEnv`
  รองรับสตริง plaintext หรือ SecretRef object (`{ source, provider, id }`)
- `config`: ถุงเก็บค่าทางเลือกสำหรับฟิลด์เฉพาะต่อ skill; คีย์แบบกำหนดเองต้องอยู่ที่นี่
- `allowBundled`: allowlist แบบทางเลือกสำหรับ **bundled** skills เท่านั้น หากตั้งค่าไว้
  จะมีสิทธิ์เฉพาะ bundled skills ที่อยู่ในรายการเท่านั้น (managed/workspace skills ไม่ได้รับผลกระทบ)

## การ inject สภาพแวดล้อม (ต่อการรันเอเจนต์)

เมื่อเริ่มการรันเอเจนต์ OpenClaw จะ:

1. อ่าน metadata ของ skill
2. ใช้ `skills.entries.<key>.env` หรือ `skills.entries.<key>.apiKey` กับ
   `process.env`
3. สร้าง system prompt ด้วย Skills ที่ **มีสิทธิ์ใช้งาน**
4. คืนค่าสภาพแวดล้อมดั้งเดิมหลังจากจบการรัน

สิ่งนี้ **ถูกจำกัดอยู่กับการรันเอเจนต์นั้น** ไม่ใช่สภาพแวดล้อมเชลล์แบบโกลบอล

สำหรับแบ็กเอนด์ `claude-cli` ที่ bundled มาด้วย OpenClaw ยังสร้าง snapshot ที่มีสิทธิ์ใช้งานเดียวกัน
ออกมาเป็น Claude Code plugin ชั่วคราว และส่งผ่านด้วย
`--plugin-dir` จากนั้น Claude Code จะสามารถใช้ตัวแก้ไข skill แบบเนทีฟของมันได้ ในขณะที่
OpenClaw ยังคงเป็นเจ้าของลำดับความสำคัญ, allowlists ต่อเอเจนต์, การควบคุม และ
การ inject env/API key ของ `skills.entries.*` แบ็กเอนด์ CLI อื่น ๆ ใช้เพียง
แค็ตตาล็อกใน prompt เท่านั้น

## Session snapshot (ประสิทธิภาพ)

OpenClaw จะทำ snapshot ของ Skills ที่มีสิทธิ์ใช้งาน **เมื่อเซสชันเริ่มต้น** และนำรายการนั้นกลับมาใช้ซ้ำสำหรับ turn ถัด ๆ ไปในเซสชันเดียวกัน การเปลี่ยนแปลงของ Skills หรือคอนฟิกจะมีผลในเซสชันใหม่ครั้งถัดไป

Skills ยังสามารถรีเฟรชกลางเซสชันได้เมื่อเปิดใช้ skills watcher หรือเมื่อมี remote node ใหม่ที่มีสิทธิ์ใช้งานปรากฏขึ้น (ดูด้านล่าง) ให้มองสิ่งนี้เป็น **hot reload**: รายการที่รีเฟรชแล้วจะถูกนำไปใช้ใน agent turn ถัดไป

หาก allowlist ของ skill ที่มีผลจริงสำหรับเอเจนต์นั้นเปลี่ยนแปลง OpenClaw
จะรีเฟรช snapshot เพื่อให้ Skills ที่มองเห็นได้ยังสอดคล้องกับเอเจนต์ปัจจุบัน

## Remote macOS nodes (Linux gateway)

หาก Gateway ทำงานอยู่บน Linux แต่มี **macOS node** เชื่อมต่ออยู่ **โดยอนุญาต `system.run`** (ความปลอดภัยของ Exec approvals ไม่ได้ตั้งเป็น `deny`) OpenClaw สามารถถือว่า skills ที่ใช้ได้เฉพาะบน macOS มีสิทธิ์ใช้งานได้ เมื่อไบนารีที่ต้องการมีอยู่บน node นั้น เอเจนต์ควรรัน Skills เหล่านั้นผ่านเครื่องมือ `exec` โดยใช้ `host=node`

สิ่งนี้อาศัยการที่ node รายงานการรองรับคำสั่งของตนเอง และอาศัยการ probe ไบนารีผ่าน `system.run` หาก macOS node หลุดออฟไลน์ภายหลัง Skills จะยังคงมองเห็นได้; การเรียกใช้อาจล้มเหลวจนกว่า node จะเชื่อมต่อกลับมา

## Skills watcher (รีเฟรชอัตโนมัติ)

โดยค่าเริ่มต้น OpenClaw จะเฝ้าดูโฟลเดอร์ skill และเพิ่มเวอร์ชัน snapshot ของ skill เมื่อไฟล์ `SKILL.md` เปลี่ยนแปลง กำหนดค่านี้ภายใต้ `skills.load`:

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

## ผลกระทบต่อโทเค็น (รายการ Skills)

เมื่อ Skills มีสิทธิ์ใช้งาน OpenClaw จะ inject รายการ XML แบบกะทัดรัดของ Skills ที่ใช้งานได้เข้าไปใน system prompt (ผ่าน `formatSkillsForPrompt` ใน `pi-coding-agent`) ต้นทุนนี้เป็นแบบกำหนดได้แน่นอน:

- **ค่าใช้จ่ายพื้นฐาน (เฉพาะเมื่อมี ≥1 skill):** 195 อักขระ
- **ต่อหนึ่ง skill:** 97 อักขระ + ความยาวของค่า `<name>`, `<description>` และ `<location>` ที่ผ่าน XML-escaped แล้ว

สูตร (อักขระ):

```
total = 195 + Σ (97 + len(name_escaped) + len(description_escaped) + len(location_escaped))
```

หมายเหตุ:

- XML escaping จะขยาย `& < > " '` เป็นเอนทิตี (`&amp;`, `&lt;` ฯลฯ) ทำให้ความยาวเพิ่มขึ้น
- จำนวนโทเค็นจะแตกต่างกันตาม tokenizer ของแต่ละโมเดล ค่าประมาณแบบ OpenAI คร่าว ๆ คือ ~4 อักขระ/โทเค็น ดังนั้น **97 อักขระ ≈ 24 โทเค็น** ต่อหนึ่ง skill บวกกับความยาวจริงของฟิลด์ของคุณ

## วงจรชีวิตของ managed skills

OpenClaw มาพร้อมชุด Skills พื้นฐานในรูปของ **bundled skills** ซึ่งเป็นส่วนหนึ่งของ
การติดตั้ง (npm package หรือ OpenClaw.app) `~/.openclaw/skills` มีไว้สำหรับ local
overrides (เช่น การ pin/patch skill โดยไม่เปลี่ยนสำเนา bundled)
Workspace skills เป็นของผู้ใช้ และจะ override ทั้งสองแบบเมื่อชื่อชนกัน

## ข้อมูลอ้างอิงคอนฟิก

ดู [การกำหนดค่า Skills](/th/tools/skills-config) สำหรับสคีมาคอนฟิกฉบับเต็ม

## กำลังมองหา Skills เพิ่มเติมอยู่หรือไม่?

เรียกดูได้ที่ [https://clawhub.ai](https://clawhub.ai)

---

## ที่เกี่ยวข้อง

- [การสร้าง Skills](/th/tools/creating-skills) — การสร้าง Skills แบบกำหนดเอง
- [การกำหนดค่า Skills](/th/tools/skills-config) — ข้อมูลอ้างอิงการกำหนดค่า skill
- [คำสั่งสแลช](/th/tools/slash-commands) — คำสั่งสแลชทั้งหมดที่มีให้ใช้งาน
- [Plugins](/th/tools/plugin) — ภาพรวมระบบ Plugin
