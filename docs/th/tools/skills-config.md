---
read_when:
    - การเพิ่มหรือแก้ไขคอนฟิก Skills
    - การปรับ allowlist แบบ bundled หรือพฤติกรรมการติดตั้ง
summary: สคีมาคอนฟิกและตัวอย่างของ Skills
title: คอนฟิก Skills
x-i18n:
    generated_at: "2026-04-23T06:04:18Z"
    model: gpt-5.4
    provider: openai
    source_hash: 8af3a51af5d6d6af355c529bb8ec0a045046c635d8fff0dec20cd875ec12e88b
    source_path: tools/skills-config.md
    workflow: 15
---

# คอนฟิก Skills

คอนฟิกส่วนใหญ่ของตัวโหลด/ติดตั้ง Skills จะอยู่ภายใต้ `skills` ใน
`~/.openclaw/openclaw.json` ส่วนการมองเห็น skill เฉพาะเอเจนต์จะอยู่ภายใต้
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
      nodeManager: "npm", // npm | pnpm | yarn | bun (runtime ของ Gateway ยังคงเป็น Node; ไม่แนะนำ bun)
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

สำหรับการสร้าง/แก้ไขภาพแบบ built-in ให้ใช้ `agents.defaults.imageGenerationModel`
ร่วมกับ core tool `image_generate` เป็นหลัก `skills.entries.*` มีไว้สำหรับเวิร์กโฟลว์ skill แบบกำหนดเองหรือของ third-party เท่านั้น

หากคุณเลือก image provider/model แบบเฉพาะ ให้กำหนดค่า auth/API key ของ provider นั้นด้วย
ตัวอย่างทั่วไป: `GEMINI_API_KEY` หรือ `GOOGLE_API_KEY` สำหรับ
`google/*`, `OPENAI_API_KEY` สำหรับ `openai/*`, และ `FAL_KEY` สำหรับ `fal/*`

ตัวอย่าง:

- การตั้งค่าแบบ Native Nano Banana-style: `agents.defaults.imageGenerationModel.primary: "google/gemini-3.1-flash-image-preview"`
- การตั้งค่า fal แบบเนทีฟ: `agents.defaults.imageGenerationModel.primary: "fal/fal-ai/flux/dev"`

## allowlist ของ skill รายเอเจนต์

ใช้ config ฝั่งเอเจนต์เมื่อคุณต้องการใช้ skill root ของเครื่อง/workspace เดียวกัน แต่ต้องการชุด skill ที่มองเห็นได้แตกต่างกันในแต่ละเอเจนต์

```json5
{
  agents: {
    defaults: {
      skills: ["github", "weather"],
    },
    list: [
      { id: "writer" }, // สืบทอดค่าเริ่มต้น -> github, weather
      { id: "docs", skills: ["docs-search"] }, // แทนที่ค่าเริ่มต้น
      { id: "locked-down", skills: [] }, // ไม่มี skills
    ],
  },
}
```

กฎ:

- `agents.defaults.skills`: baseline allowlist ร่วมสำหรับเอเจนต์ที่ละ
  `agents.list[].skills`
- ละ `agents.defaults.skills` ไว้เพื่อปล่อยให้ Skills ไม่ถูกจำกัดโดยค่าเริ่มต้น
- `agents.list[].skills`: ชุด skill ขั้นสุดท้ายแบบ explicit สำหรับเอเจนต์นั้น; จะไม่ merge กับค่าเริ่มต้น
- `agents.list[].skills: []`: ไม่เปิดเผย skill ใดเลยสำหรับเอเจนต์นั้น

## ฟิลด์

- skill root แบบ built-in จะรวม `~/.openclaw/skills`, `~/.agents/skills`,
  `<workspace>/.agents/skills` และ `<workspace>/skills` เสมอ
- `allowBundled`: allowlist แบบไม่บังคับสำหรับ Skills แบบ **bundled** เท่านั้น เมื่อตั้งค่าไว้
  จะมีสิทธิ์เฉพาะ bundled skill ที่อยู่ในรายการเท่านั้น (ไม่กระทบ managed, agent และ workspace skill)
- `load.extraDirs`: ไดเรกทอรี skill เพิ่มเติมที่จะสแกน (precedence ต่ำสุด)
- `load.watch`: เฝ้าดูโฟลเดอร์ skill และรีเฟรช snapshot ของ Skills (ค่าเริ่มต้น: true)
- `load.watchDebounceMs`: ค่า debounce สำหรับ event ของ skill watcher เป็นมิลลิวินาที (ค่าเริ่มต้น: 250)
- `install.preferBrew`: เลือกใช้ตัวติดตั้ง brew ก่อนเมื่อมีให้ใช้ (ค่าเริ่มต้น: true)
- `install.nodeManager`: ค่าที่ใช้เลือกตัวติดตั้ง node (`npm` | `pnpm` | `yarn` | `bun`, ค่าเริ่มต้น: npm)
  ค่านี้มีผลเฉพาะกับ **การติดตั้ง skill**; runtime ของ Gateway ควรยังคงเป็น Node
  (ไม่แนะนำ Bun สำหรับ WhatsApp/Telegram)
  - `openclaw setup --node-manager` มีขอบเขตแคบกว่าและปัจจุบันรับ `npm`,
    `pnpm` หรือ `bun` เท่านั้น ให้ตั้ง `skills.install.nodeManager: "yarn"` ด้วยตนเองหากคุณ
    ต้องการการติดตั้ง skill ที่ใช้ Yarn
- `entries.<skillKey>`: override ราย skill
- `agents.defaults.skills`: allowlist ของ skill เริ่มต้นแบบไม่บังคับที่เอเจนต์ซึ่งละ `agents.list[].skills` จะสืบทอดไป
- `agents.list[].skills`: allowlist รายเอเจนต์แบบไม่บังคับสำหรับชุด skill ขั้นสุดท้าย; รายการ explicit
  จะมาแทนค่าเริ่มต้นที่สืบทอดมา แทนที่จะ merge กัน

ฟิลด์ราย skill:

- `enabled`: ตั้งเป็น `false` เพื่อปิด skill แม้ว่าจะเป็น bundled/installed อยู่ก็ตาม
- `env`: environment variable ที่ inject สำหรับการรันของเอเจนต์ (เฉพาะเมื่อยังไม่ได้ถูกตั้งไว้)
- `apiKey`: ตัวช่วยแบบไม่บังคับสำหรับ skill ที่ประกาศ primary env var
  รองรับสตริง plaintext หรือออบเจ็กต์ SecretRef (`{ source, provider, id }`)

## หมายเหตุ

- key ภายใต้ `entries` จะ map ไปยังชื่อ skill โดยค่าเริ่มต้น หาก skill ใดกำหนด
  `metadata.openclaw.skillKey` ให้ใช้ key นั้นแทน
- ลำดับ precedence ของการโหลดคือ `<workspace>/skills` → `<workspace>/.agents/skills` →
  `~/.agents/skills` → `~/.openclaw/skills` → bundled skills →
  `skills.load.extraDirs`
- การเปลี่ยนแปลง Skills จะถูกนำไปใช้ใน agent turn ถัดไปเมื่อ watcher เปิดใช้งานอยู่

### Skills แบบ sandboxed + env vars

เมื่อเซสชัน **ถูก sandboxed** โปรเซสของ skill จะรันภายใน
sandbox backend ที่กำหนดไว้ โดย sandbox จะ **ไม่** สืบทอด `process.env` ของโฮสต์

ให้ใช้วิธีใดวิธีหนึ่งต่อไปนี้:

- `agents.defaults.sandbox.docker.env` สำหรับ Docker backend (หรือ `agents.list[].sandbox.docker.env` รายเอเจนต์)
- bake env เข้าไปใน custom sandbox image หรือ remote sandbox environment ของคุณ

`env` แบบ global และ `skills.entries.<skill>.env/apiKey` ใช้กับการรันบน **host** เท่านั้น
