---
read_when:
    - การเพิ่มหรือแก้ไข config ของ Skills
    - การปรับ allowlist แบบ bundled หรือพฤติกรรมการติดตั้ง
summary: สคีมาของ config สำหรับ Skills และตัวอย่าง
title: config ของ Skills
x-i18n:
    generated_at: "2026-04-24T09:38:19Z"
    model: gpt-5.4
    provider: openai
    source_hash: 4d5e156adb9b88d7ade1976005c11faffe5107661e4f3da5d878cc0ac648bcbb
    source_path: tools/skills-config.md
    workflow: 15
---

config ของตัวโหลด/ติดตั้ง Skills ส่วนใหญ่อยู่ภายใต้ `skills` ใน
`~/.openclaw/openclaw.json` ส่วนการมองเห็น Skill เฉพาะเอเจนต์อยู่ภายใต้
`agents.defaults.skills` และ `agents.list[].skills`

```json5
{
  skills: {
    allowBundled: ["gemini", "peekaboo"],
    load: {
      extraDirs: ["~/Projects/agent-scripts/skills", "~/Projects/oss/some-skill-pack/skills"],
      watch: true,
      watchDebounceMs: 250,
    },
    install: {
      preferBrew: true,
      nodeManager: "npm", // npm | pnpm | yarn | bun (รันไทม์ของ Gateway ยังคงเป็น Node; ไม่แนะนำ bun)
    },
    entries: {
      "image-lab": {
        enabled: true,
        apiKey: { source: "env", provider: "default", id: "GEMINI_API_KEY" }, // หรือสตริง plaintext
        env: {
          GEMINI_API_KEY: "GEMINI_KEY_HERE",
        },
      },
      peekaboo: { enabled: true },
      sag: { enabled: false },
    },
  },
}
```

สำหรับการสร้าง/แก้ไขรูปภาพในตัว ให้ใช้ `agents.defaults.imageGenerationModel`
ร่วมกับเครื่องมือ `image_generate` หลักแทน `skills.entries.*` มีไว้เฉพาะสำหรับเวิร์กโฟลว์ของ Skill แบบกำหนดเองหรือจาก third-party เท่านั้น

หากคุณเลือกผู้ให้บริการ/โมเดลรูปภาพแบบเฉพาะเจาะจง ให้กำหนดค่าการยืนยันตัวตน/API key
ของผู้ให้บริการนั้นด้วย ตัวอย่างทั่วไป: `GEMINI_API_KEY` หรือ `GOOGLE_API_KEY` สำหรับ
`google/*`, `OPENAI_API_KEY` สำหรับ `openai/*` และ `FAL_KEY` สำหรับ `fal/*`

ตัวอย่าง:

- การตั้งค่าแบบ Native Nano Banana Pro-style: `agents.defaults.imageGenerationModel.primary: "google/gemini-3-pro-image-preview"`
- การตั้งค่า fal แบบ native: `agents.defaults.imageGenerationModel.primary: "fal/fal-ai/flux/dev"`

## allowlist ของ Skill ต่อเอเจนต์

ใช้ config ของเอเจนต์เมื่อคุณต้องการให้มี root ของ Skill ในระดับเครื่อง/workspace เหมือนกัน แต่มี
ชุด Skill ที่มองเห็นได้ต่างกันในแต่ละเอเจนต์

```json5
{
  agents: {
    defaults: {
      skills: ["github", "weather"],
    },
    list: [
      { id: "writer" }, // สืบทอดค่าเริ่มต้น -> github, weather
      { id: "docs", skills: ["docs-search"] }, // แทนที่ค่าเริ่มต้น
      { id: "locked-down", skills: [] }, // ไม่มี Skills
    ],
  },
}
```

กฎ:

- `agents.defaults.skills`: allowlist พื้นฐานที่ใช้ร่วมกันสำหรับเอเจนต์ที่ไม่ได้ระบุ
  `agents.list[].skills`
- ไม่ต้องระบุ `agents.defaults.skills` หากต้องการไม่จำกัด Skills ตามค่าเริ่มต้น
- `agents.list[].skills`: ชุด Skill สุดท้ายแบบ explicit สำหรับเอเจนต์นั้น; จะไม่
  รวมกับค่าเริ่มต้น
- `agents.list[].skills: []`: ไม่เปิดเผย Skill ใด ๆ สำหรับเอเจนต์นั้น

## ฟิลด์

- root ของ Skill ในตัวจะรวม `~/.openclaw/skills`, `~/.agents/skills`,
  `<workspace>/.agents/skills` และ `<workspace>/skills` เสมอ
- `allowBundled`: allowlist แบบไม่บังคับสำหรับ Skills แบบ **bundled** เท่านั้น เมื่อกำหนดแล้ว จะมีเพียง
  Skills แบบ bundled ที่อยู่ในรายการเท่านั้นที่มีสิทธิ์ (ไม่กระทบ Skills แบบ managed, ของเอเจนต์ และของ workspace)
- `load.extraDirs`: ไดเรกทอรี Skill เพิ่มเติมที่จะสแกน (ลำดับความสำคัญต่ำสุด)
- `load.watch`: เฝ้าดูโฟลเดอร์ Skill และรีเฟรช snapshot ของ Skills (ค่าเริ่มต้น: true)
- `load.watchDebounceMs`: debounce สำหรับเหตุการณ์จาก watcher ของ Skill เป็นมิลลิวินาที (ค่าเริ่มต้น: 250)
- `install.preferBrew`: ให้ความสำคัญกับตัวติดตั้ง brew เมื่อมี (ค่าเริ่มต้น: true)
- `install.nodeManager`: ค่าที่เลือกใช้สำหรับตัวติดตั้ง node (`npm` | `pnpm` | `yarn` | `bun`, ค่าเริ่มต้น: npm)
  มีผลเฉพาะกับ **การติดตั้ง Skill** เท่านั้น; รันไทม์ของ Gateway ควรยังคงเป็น Node
  (ไม่แนะนำ Bun สำหรับ WhatsApp/Telegram)
  - `openclaw setup --node-manager` มีขอบเขตแคบกว่า และปัจจุบันรองรับ `npm`,
    `pnpm` หรือ `bun` เท่านั้น ตั้งค่า `skills.install.nodeManager: "yarn"` เองหากคุณ
    ต้องการการติดตั้ง Skill ที่ใช้ Yarn
- `entries.<skillKey>`: override ต่อ Skill
- `agents.defaults.skills`: allowlist ของ Skill เริ่มต้นแบบไม่บังคับที่เอเจนต์จะสืบทอด
  เมื่อไม่ได้ระบุ `agents.list[].skills`
- `agents.list[].skills`: allowlist ของ Skill ขั้นสุดท้ายต่อเอเจนต์แบบไม่บังคับ; รายการแบบ explicit
  จะแทนที่ค่าเริ่มต้นที่สืบทอดมา แทนการรวมกัน

ฟิลด์ต่อ Skill:

- `enabled`: ตั้งเป็น `false` เพื่อปิดใช้งาน Skill แม้ว่าจะเป็น bundled/ติดตั้งแล้วก็ตาม
- `env`: ตัวแปรสภาพแวดล้อมที่ฉีดให้กับการรันของเอเจนต์ (เฉพาะเมื่อยังไม่ได้ตั้งค่าไว้)
- `apiKey`: ตัวช่วยแบบไม่บังคับสำหรับ Skills ที่ประกาศ primary env var
  รองรับสตริง plaintext หรือออบเจ็กต์ SecretRef (`{ source, provider, id }`)

## หมายเหตุ

- คีย์ภายใต้ `entries` จะจับคู่กับชื่อ Skill ตามค่าเริ่มต้น หาก Skill ใดกำหนด
  `metadata.openclaw.skillKey` ให้ใช้คีย์นั้นแทน
- ลำดับความสำคัญของการโหลดคือ `<workspace>/skills` → `<workspace>/.agents/skills` →
  `~/.agents/skills` → `~/.openclaw/skills` → Skills แบบ bundled →
  `skills.load.extraDirs`
- การเปลี่ยนแปลง Skills จะถูกนำมาใช้ในเทิร์นถัดไปของเอเจนต์เมื่อเปิด watcher ไว้

### Skills แบบ sandboxed + env vars

เมื่อเซสชันอยู่ใน **sandbox** process ของ Skill จะรันภายใน
sandbox backend ที่กำหนดไว้ โดย sandbox จะ **ไม่** สืบทอด `process.env` ของโฮสต์

ให้ใช้วิธีใดวิธีหนึ่งต่อไปนี้:

- `agents.defaults.sandbox.docker.env` สำหรับแบ็กเอนด์ Docker (หรือ `agents.list[].sandbox.docker.env` ต่อเอเจนต์)
- bake env เข้าไปในอิมเมจ sandbox แบบกำหนดเองของคุณ หรือในสภาพแวดล้อม sandbox ระยะไกล

`env` ระดับโกลบอลและ `skills.entries.<skill>.env/apiKey` มีผลกับการรันบน **โฮสต์** เท่านั้น

## ที่เกี่ยวข้อง

- [Skills](/th/tools/skills)
- [การสร้าง Skills](/th/tools/creating-skills)
- [คำสั่ง Slash](/th/tools/slash-commands)
