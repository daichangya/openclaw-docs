---
read_when:
    - การปรับค่าเริ่มต้นของเอเจนต์ (models, thinking, พื้นที่ทำงาน, Heartbeat, สื่อ, Skills)
    - การกำหนดค่าการกำหนดเส้นทางและ bindings แบบหลายเอเจนต์
    - การปรับพฤติกรรมของเซสชัน การส่งข้อความ และโหมดการพูดคุย
summary: ค่าเริ่มต้นของเอเจนต์ การกำหนดเส้นทางหลายเอเจนต์ การกำหนดค่าเซสชัน ข้อความ และการพูดคุย
title: Configuration — เอเจนต์
x-i18n:
    generated_at: "2026-04-24T09:08:51Z"
    model: gpt-5.4
    provider: openai
    source_hash: de1587358404808b4a11a92a9392d7cc5bdd2b599773f8a0f7b4331551841991
    source_path: gateway/config-agents.md
    workflow: 15
---

คีย์การกำหนดค่าระดับเอเจนต์ภายใต้ `agents.*`, `multiAgent.*`, `session.*`,
`messages.*` และ `talk.*` สำหรับช่องทาง เครื่องมือ runtime ของ Gateway และคีย์ระดับบนอื่น ๆ ดูที่ [เอกสารอ้างอิงการกำหนดค่า](/th/gateway/configuration-reference)

## ค่าเริ่มต้นของเอเจนต์

### `agents.defaults.workspace`

ค่าเริ่มต้น: `~/.openclaw/workspace`

```json5
{
  agents: { defaults: { workspace: "~/.openclaw/workspace" } },
}
```

### `agents.defaults.repoRoot`

รากรีโพแบบเลือกได้ที่แสดงในบรรทัด Runtime ของ system prompt หากไม่ได้ตั้งค่า OpenClaw จะตรวจจับอัตโนมัติโดยไล่ขึ้นไปจากพื้นที่ทำงาน

```json5
{
  agents: { defaults: { repoRoot: "~/Projects/openclaw" } },
}
```

### `agents.defaults.skills`

allowlist ของ Skills เริ่มต้นแบบเลือกได้สำหรับเอเจนต์ที่ไม่ได้ตั้ง
`agents.list[].skills`

```json5
{
  agents: {
    defaults: { skills: ["github", "weather"] },
    list: [
      { id: "writer" }, // สืบทอด github, weather
      { id: "docs", skills: ["docs-search"] }, // แทนที่ค่าเริ่มต้น
      { id: "locked-down", skills: [] }, // ไม่มี Skills
    ],
  },
}
```

- ละ `agents.defaults.skills` เพื่อให้ Skills ไม่ถูกจำกัดโดยค่าเริ่มต้น
- ละ `agents.list[].skills` เพื่อสืบทอดค่าเริ่มต้น
- ตั้ง `agents.list[].skills: []` หากไม่ต้องการ Skills
- รายการ `agents.list[].skills` ที่ไม่ว่างคือชุดสุดท้ายสำหรับเอเจนต์นั้น; มัน
  จะไม่ถูกรวมกับค่าเริ่มต้น

### `agents.defaults.skipBootstrap`

ปิดใช้งานการสร้างไฟล์ bootstrap ของพื้นที่ทำงานอัตโนมัติ (`AGENTS.md`, `SOUL.md`, `TOOLS.md`, `IDENTITY.md`, `USER.md`, `HEARTBEAT.md`, `BOOTSTRAP.md`)

```json5
{
  agents: { defaults: { skipBootstrap: true } },
}
```

### `agents.defaults.contextInjection`

ควบคุมว่าไฟล์ bootstrap ของพื้นที่ทำงานจะถูกฉีดเข้า system prompt เมื่อใด ค่าเริ่มต้น: `"always"`

- `"continuation-skip"`: เทิร์น continuation ที่ปลอดภัย (หลังจากการตอบกลับของผู้ช่วยเสร็จสมบูรณ์แล้ว) จะข้ามการฉีด workspace bootstrap ซ้ำ ช่วยลดขนาดของพรอมป์ การรัน Heartbeat และ retry หลัง Compaction ยังคงสร้างบริบทใหม่

```json5
{
  agents: { defaults: { contextInjection: "continuation-skip" } },
}
```

### `agents.defaults.bootstrapMaxChars`

จำนวนอักขระสูงสุดต่อไฟล์ bootstrap ของพื้นที่ทำงานก่อนถูกตัด ค่าเริ่มต้น: `12000`

```json5
{
  agents: { defaults: { bootstrapMaxChars: 12000 } },
}
```

### `agents.defaults.bootstrapTotalMaxChars`

จำนวนอักขระรวมสูงสุดที่ฉีดเข้าไปในทุกไฟล์ bootstrap ของพื้นที่ทำงาน ค่าเริ่มต้น: `60000`

```json5
{
  agents: { defaults: { bootstrapTotalMaxChars: 60000 } },
}
```

### `agents.defaults.bootstrapPromptTruncationWarning`

ควบคุมข้อความเตือนที่เอเจนต์มองเห็นได้เมื่อบริบท bootstrap ถูกตัดทอน
ค่าเริ่มต้น: `"once"`

- `"off"`: ไม่ฉีดข้อความเตือนเข้า system prompt เลย
- `"once"`: ฉีดคำเตือนหนึ่งครั้งต่อ signature ของการตัดทอนที่ไม่ซ้ำกัน (แนะนำ)
- `"always"`: ฉีดคำเตือนทุกครั้งที่มีการตัดทอน

```json5
{
  agents: { defaults: { bootstrapPromptTruncationWarning: "once" } }, // off | once | always
}
```

### แผนผังความเป็นเจ้าของงบประมาณบริบท

OpenClaw มีงบประมาณพรอมป์/บริบทปริมาณสูงหลายส่วน และตั้งใจแยก
ตามซับซิสเต็มแทนที่จะให้ทั้งหมดไหลผ่านตัวปรับทั่วไปตัวเดียว

- `agents.defaults.bootstrapMaxChars` /
  `agents.defaults.bootstrapTotalMaxChars`:
  การฉีด bootstrap ของพื้นที่ทำงานแบบปกติ
- `agents.defaults.startupContext.*`:
  prelude ตอนเริ่มต้นแบบ one-shot สำหรับ `/new` และ `/reset` รวมถึงไฟล์
  `memory/*.md` รายวันล่าสุด
- `skills.limits.*`:
  รายการ Skills แบบกะทัดรัดที่ถูกฉีดเข้า system prompt
- `agents.defaults.contextLimits.*`:
  excerpt ของ runtime แบบมีขอบเขตและบล็อกที่ runtime เป็นเจ้าของซึ่งถูกฉีดเข้าไป
- `memory.qmd.limits.*`:
  การกำหนดขนาด snippet และการฉีดของการค้นหาหน่วยความจำที่ทำดัชนีไว้

ใช้ override ต่อเอเจนต์ที่ตรงกันเฉพาะเมื่อเอเจนต์หนึ่งต้องการ
งบประมาณที่ต่างออกไป:

- `agents.list[].skillsLimits.maxSkillsPromptChars`
- `agents.list[].contextLimits.*`

#### `agents.defaults.startupContext`

ควบคุม startup prelude ของเทิร์นแรกที่ถูกฉีดเข้าไปในการรัน `/new` และ `/reset` แบบเปล่า

```json5
{
  agents: {
    defaults: {
      startupContext: {
        enabled: true,
        applyOn: ["new", "reset"],
        dailyMemoryDays: 2,
        maxFileBytes: 16384,
        maxFileChars: 1200,
        maxTotalChars: 2800,
      },
    },
  },
}
```

#### `agents.defaults.contextLimits`

ค่าเริ่มต้นร่วมสำหรับพื้นผิวบริบทของ runtime แบบมีขอบเขต

```json5
{
  agents: {
    defaults: {
      contextLimits: {
        memoryGetMaxChars: 12000,
        memoryGetDefaultLines: 120,
        toolResultMaxChars: 16000,
        postCompactionMaxChars: 1800,
      },
    },
  },
}
```

- `memoryGetMaxChars`: เพดาน excerpt เริ่มต้นของ `memory_get` ก่อนจะเพิ่ม
  metadata ของการตัดทอนและประกาศ continuation
- `memoryGetDefaultLines`: หน้าต่างบรรทัดเริ่มต้นของ `memory_get` เมื่อไม่ได้ระบุ
  `lines`
- `toolResultMaxChars`: เพดานผลลัพธ์ของเครื่องมือแบบ live ที่ใช้สำหรับผลลัพธ์ที่คงไว้และ
  การกู้คืนเมื่อเกินขนาด
- `postCompactionMaxChars`: เพดาน excerpt ของ AGENTS.md ที่ใช้ระหว่างการฉีด
  รีเฟรชหลัง Compaction

#### `agents.list[].contextLimits`

override ต่อเอเจนต์สำหรับตัวปรับ `contextLimits` ร่วม ฟิลด์ที่ละไว้จะสืบทอด
จาก `agents.defaults.contextLimits`

```json5
{
  agents: {
    defaults: {
      contextLimits: {
        memoryGetMaxChars: 12000,
        toolResultMaxChars: 16000,
      },
    },
    list: [
      {
        id: "tiny-local",
        contextLimits: {
          memoryGetMaxChars: 6000,
          toolResultMaxChars: 8000,
        },
      },
    ],
  },
}
```

#### `skills.limits.maxSkillsPromptChars`

เพดานส่วนกลางสำหรับรายการ Skills แบบกะทัดรัดที่ถูกฉีดเข้า system prompt สิ่งนี้
ไม่กระทบการอ่านไฟล์ `SKILL.md` ตามต้องการ

```json5
{
  skills: {
    limits: {
      maxSkillsPromptChars: 18000,
    },
  },
}
```

#### `agents.list[].skillsLimits.maxSkillsPromptChars`

override ต่อเอเจนต์สำหรับงบประมาณพรอมป์ของ Skills

```json5
{
  agents: {
    list: [
      {
        id: "tiny-local",
        skillsLimits: {
          maxSkillsPromptChars: 6000,
        },
      },
    ],
  },
}
```

### `agents.defaults.imageMaxDimensionPx`

ขนาดพิกเซลสูงสุดของด้านที่ยาวที่สุดของรูปภาพในบล็อกรูปภาพของ transcript/เครื่องมือก่อนเรียกผู้ให้บริการ
ค่าเริ่มต้น: `1200`

ค่าที่ต่ำกว่ามักช่วยลดการใช้ vision token และขนาด payload ของคำขอสำหรับการรันที่มีภาพหน้าจอจำนวนมาก
ค่าที่สูงกว่าจะรักษารายละเอียดภาพได้มากกว่า

```json5
{
  agents: { defaults: { imageMaxDimensionPx: 1200 } },
}
```

### `agents.defaults.userTimezone`

Timezone สำหรับบริบทของ system prompt (ไม่ใช่ timestamp ของข้อความ) จะ fallback ไปใช้ timezone ของโฮสต์

```json5
{
  agents: { defaults: { userTimezone: "America/Chicago" } },
}
```

### `agents.defaults.timeFormat`

รูปแบบเวลาใน system prompt ค่าเริ่มต้น: `auto` (ค่ากำหนดของ OS)

```json5
{
  agents: { defaults: { timeFormat: "auto" } }, // auto | 12 | 24
}
```

### `agents.defaults.model`

```json5
{
  agents: {
    defaults: {
      models: {
        "anthropic/claude-opus-4-6": { alias: "opus" },
        "minimax/MiniMax-M2.7": { alias: "minimax" },
      },
      model: {
        primary: "anthropic/claude-opus-4-6",
        fallbacks: ["minimax/MiniMax-M2.7"],
      },
      imageModel: {
        primary: "openrouter/qwen/qwen-2.5-vl-72b-instruct:free",
        fallbacks: ["openrouter/google/gemini-2.0-flash-vision:free"],
      },
      imageGenerationModel: {
        primary: "openai/gpt-image-2",
        fallbacks: ["google/gemini-3.1-flash-image-preview"],
      },
      videoGenerationModel: {
        primary: "qwen/wan2.6-t2v",
        fallbacks: ["qwen/wan2.6-i2v"],
      },
      pdfModel: {
        primary: "anthropic/claude-opus-4-6",
        fallbacks: ["openai/gpt-5.4-mini"],
      },
      params: { cacheRetention: "long" }, // พารามิเตอร์ของผู้ให้บริการค่าเริ่มต้นแบบส่วนกลาง
      embeddedHarness: {
        runtime: "auto", // auto | pi | registered harness id, e.g. codex
        fallback: "pi", // pi | none
      },
      pdfMaxBytesMb: 10,
      pdfMaxPages: 20,
      thinkingDefault: "low",
      verboseDefault: "off",
      elevatedDefault: "on",
      timeoutSeconds: 600,
      mediaMaxMb: 5,
      contextTokens: 200000,
      maxConcurrent: 3,
    },
  },
}
```

- `model`: รับได้ทั้งสตริง (`"provider/model"`) หรือออบเจ็กต์ (`{ primary, fallbacks }`)
  - รูปแบบสตริงจะตั้งเฉพาะ model หลัก
  - รูปแบบออบเจ็กต์จะตั้ง model หลักพร้อม model failover ตามลำดับ
- `imageModel`: รับได้ทั้งสตริง (`"provider/model"`) หรือออบเจ็กต์ (`{ primary, fallbacks }`)
  - ใช้โดยเส้นทางเครื่องมือ `image` เป็น config ของ vision-model
  - ยังใช้เป็นเส้นทาง fallback เมื่อ model ที่เลือก/ค่าเริ่มต้นไม่สามารถรับอินพุตรูปภาพได้
- `imageGenerationModel`: รับได้ทั้งสตริง (`"provider/model"`) หรือออบเจ็กต์ (`{ primary, fallbacks }`)
  - ใช้โดย capability การสร้างรูปภาพแบบใช้ร่วมกัน และพื้นผิวเครื่องมือ/Plugin ในอนาคตที่สร้างรูปภาพ
  - ค่าทั่วไป: `google/gemini-3.1-flash-image-preview` สำหรับการสร้างรูปภาพแบบเนทีฟของ Gemini, `fal/fal-ai/flux/dev` สำหรับ fal หรือ `openai/gpt-image-2` สำหรับ OpenAI Images
  - หากคุณเลือก provider/model โดยตรง ให้กำหนดค่า auth ของผู้ให้บริการที่ตรงกันด้วย (เช่น `GEMINI_API_KEY` หรือ `GOOGLE_API_KEY` สำหรับ `google/*`, `OPENAI_API_KEY` หรือ OpenAI Codex OAuth สำหรับ `openai/gpt-image-2`, `FAL_KEY` สำหรับ `fal/*`)
  - หากละไว้ `image_generate` ยังสามารถอนุมานค่าเริ่มต้นของผู้ให้บริการที่มี auth รองรับได้ โดยจะลองผู้ให้บริการค่าเริ่มต้นปัจจุบันก่อน จากนั้นจึงลองผู้ให้บริการสร้างรูปภาพที่ลงทะเบียนไว้ที่เหลือตามลำดับ provider-id
- `musicGenerationModel`: รับได้ทั้งสตริง (`"provider/model"`) หรือออบเจ็กต์ (`{ primary, fallbacks }`)
  - ใช้โดย capability การสร้างเพลงแบบใช้ร่วมกันและเครื่องมือ `music_generate` ที่มีมาในตัว
  - ค่าทั่วไป: `google/lyria-3-clip-preview`, `google/lyria-3-pro-preview` หรือ `minimax/music-2.5+`
  - หากละไว้ `music_generate` ยังสามารถอนุมานค่าเริ่มต้นของผู้ให้บริการที่มี auth รองรับได้ โดยจะลองผู้ให้บริการค่าเริ่มต้นปัจจุบันก่อน จากนั้นจึงลองผู้ให้บริการสร้างเพลงที่ลงทะเบียนไว้ที่เหลือตามลำดับ provider-id
  - หากคุณเลือก provider/model โดยตรง ให้กำหนดค่า auth/API key ของผู้ให้บริการที่ตรงกันด้วย
- `videoGenerationModel`: รับได้ทั้งสตริง (`"provider/model"`) หรือออบเจ็กต์ (`{ primary, fallbacks }`)
  - ใช้โดย capability การสร้างวิดีโอแบบใช้ร่วมกันและเครื่องมือ `video_generate` ที่มีมาในตัว
  - ค่าทั่วไป: `qwen/wan2.6-t2v`, `qwen/wan2.6-i2v`, `qwen/wan2.6-r2v`, `qwen/wan2.6-r2v-flash` หรือ `qwen/wan2.7-r2v`
  - หากละไว้ `video_generate` ยังสามารถอนุมานค่าเริ่มต้นของผู้ให้บริการที่มี auth รองรับได้ โดยจะลองผู้ให้บริการค่าเริ่มต้นปัจจุบันก่อน จากนั้นจึงลองผู้ให้บริการสร้างวิดีโอที่ลงทะเบียนไว้ที่เหลือตามลำดับ provider-id
  - หากคุณเลือก provider/model โดยตรง ให้กำหนดค่า auth/API key ของผู้ให้บริการที่ตรงกันด้วย
  - ผู้ให้บริการสร้างวิดีโอ Qwen ที่มาพร้อมในชุดรองรับวิดีโอเอาต์พุตสูงสุด 1 รายการ, รูปภาพอินพุต 1 ภาพ, วิดีโออินพุต 4 รายการ, ความยาว 10 วินาที และตัวเลือกระดับผู้ให้บริการ `size`, `aspectRatio`, `resolution`, `audio` และ `watermark`
- `pdfModel`: รับได้ทั้งสตริง (`"provider/model"`) หรือออบเจ็กต์ (`{ primary, fallbacks }`)
  - ใช้โดยเครื่องมือ `pdf` สำหรับการกำหนดเส้นทาง model
  - หากละไว้ เครื่องมือ PDF จะ fallback ไปใช้ `imageModel` แล้วจึง fallback ไปใช้ model ของเซสชัน/ค่าเริ่มต้นที่ resolve แล้ว
- `pdfMaxBytesMb`: ขีดจำกัดขนาด PDF เริ่มต้นสำหรับเครื่องมือ `pdf` เมื่อไม่ได้ส่ง `maxBytesMb` ตอนเรียกใช้งาน
- `pdfMaxPages`: จำนวนหน้าสูงสุดเริ่มต้นที่โหมด extraction fallback ของเครื่องมือ `pdf` จะพิจารณา
- `verboseDefault`: ระดับ verbose เริ่มต้นสำหรับเอเจนต์ ค่า: `"off"`, `"on"`, `"full"` ค่าเริ่มต้น: `"off"`
- `elevatedDefault`: ระดับเอาต์พุต elevated เริ่มต้นสำหรับเอเจนต์ ค่า: `"off"`, `"on"`, `"ask"`, `"full"` ค่าเริ่มต้น: `"on"`
- `model.primary`: รูปแบบ `provider/model` (เช่น `openai/gpt-5.4` สำหรับการเข้าถึงด้วย API key หรือ `openai-codex/gpt-5.5` สำหรับ Codex OAuth) หากคุณละ provider ไว้ OpenClaw จะลอง alias ก่อน จากนั้นจึงลองจับคู่ configured-provider ที่ไม่ซ้ำสำหรับ model id ตรงนั้น และสุดท้ายจึง fallback ไปยังผู้ให้บริการค่าเริ่มต้นที่กำหนดไว้ (เป็นพฤติกรรมความเข้ากันได้แบบเลิกใช้แล้ว ดังนั้นควรใช้ `provider/model` แบบ explicit) หากผู้ให้บริการนั้นไม่เปิดเผย model ค่าเริ่มต้นที่กำหนดไว้อีกต่อไป OpenClaw จะ fallback ไปยัง provider/model ที่กำหนดค่าไว้ตัวแรกแทนที่จะแสดงค่าเริ่มต้นของผู้ให้บริการที่ถูกลบซึ่งล้าสมัย
- `models`: แค็ตตาล็อก model และ allowlist ที่กำหนดค่าไว้สำหรับ `/model` แต่ละรายการสามารถมี `alias` (ทางลัด) และ `params` (เฉพาะผู้ให้บริการ เช่น `temperature`, `maxTokens`, `cacheRetention`, `context1m`, `responsesServerCompaction`, `responsesCompactThreshold`)
  - การแก้ไขที่ปลอดภัย: ใช้ `openclaw config set agents.defaults.models '<json>' --strict-json --merge` เพื่อเพิ่มรายการ `config set` จะปฏิเสธการแทนที่ที่จะลบรายการ allowlist ที่มีอยู่ เว้นแต่คุณจะส่ง `--replace`
  - โฟลว์ configure/onboarding ที่มีขอบเขตตามผู้ให้บริการจะรวม model ของผู้ให้บริการที่เลือกลงในแผนที่นี้ และคงผู้ให้บริการอื่นที่กำหนดค่าไว้แล้วซึ่งไม่เกี่ยวข้องไว้
  - สำหรับ OpenAI Responses model แบบตรง ระบบจะเปิดใช้ Compaction ฝั่งเซิร์ฟเวอร์โดยอัตโนมัติ ใช้ `params.responsesServerCompaction: false` เพื่อหยุดการฉีด `context_management` หรือใช้ `params.responsesCompactThreshold` เพื่อ override threshold ดู [OpenAI server-side compaction](/th/providers/openai#server-side-compaction-responses-api)
- `params`: พารามิเตอร์ผู้ให้บริการค่าเริ่มต้นแบบส่วนกลางที่ใช้กับทุก model ตั้งที่ `agents.defaults.params` (เช่น `{ cacheRetention: "long" }`)
- ลำดับการรวม `params` (config): `agents.defaults.params` (ฐานส่วนกลาง) จะถูก override โดย `agents.defaults.models["provider/model"].params` (ต่อ-model) จากนั้น `agents.list[].params` (agent id ที่ตรงกัน) จะ override ตามคีย์ ดู [Prompt Caching](/th/reference/prompt-caching) สำหรับรายละเอียด
- `embeddedHarness`: นโยบาย runtime เอเจนต์แบบ embedded ระดับล่างเริ่มต้น ใช้ `runtime: "auto"` เพื่อให้ harness ของ Plugin ที่ลงทะเบียนไว้ claim model ที่รองรับ, `runtime: "pi"` เพื่อบังคับใช้ PI harness ที่มีมาในตัว หรือ registered harness id เช่น `runtime: "codex"` ตั้ง `fallback: "none"` เพื่อปิดการ fallback ไปยัง PI โดยอัตโนมัติ
- ตัวเขียน config ที่เปลี่ยนฟิลด์เหล่านี้ (เช่น `/models set`, `/models set-image` และคำสั่งเพิ่ม/ลบ fallback) จะบันทึกในรูปแบบออบเจ็กต์มาตรฐานและคงรายการ fallback ที่มีอยู่ไว้เมื่อเป็นไปได้
- `maxConcurrent`: จำนวนการรันเอเจนต์แบบขนานสูงสุดข้ามเซสชัน (แต่ละเซสชันยังคง serial อยู่) ค่าเริ่มต้น: 4

### `agents.defaults.embeddedHarness`

`embeddedHarness` ควบคุมว่า executor ระดับล่างตัวใดจะรัน embedded agent turn
การติดตั้งส่วนใหญ่ควรคงค่าเริ่มต้น `{ runtime: "auto", fallback: "pi" }`
ใช้สิ่งนี้เมื่อ Plugin ที่เชื่อถือได้ให้ native harness มา เช่น
Codex app-server harness ที่มาพร้อมในชุด

```json5
{
  agents: {
    defaults: {
      model: "openai/gpt-5.5",
      embeddedHarness: {
        runtime: "codex",
        fallback: "none",
      },
    },
  },
}
```

- `runtime`: `"auto"`, `"pi"` หรือ registered plugin harness id โดย Codex Plugin ที่มาพร้อมในชุดจะลงทะเบียน `codex`
- `fallback`: `"pi"` หรือ `"none"` โดย `"pi"` จะคง PI harness ที่มีมาในตัวไว้เป็น compatibility fallback เมื่อไม่มีการเลือก plugin harness ส่วน `"none"` จะทำให้การเลือก plugin harness ที่ขาดหายหรือไม่รองรับล้มเหลวแทนที่จะใช้ PI แบบเงียบ ๆ ความล้มเหลวของ plugin harness ที่ถูกเลือกจะถูกแสดงออกมาโดยตรงเสมอ
- env override: `OPENCLAW_AGENT_RUNTIME=<id|auto|pi>` จะ override `runtime`; `OPENCLAW_AGENT_HARNESS_FALLBACK=none` จะปิด PI fallback สำหรับโปรเซสนั้น
- สำหรับการติดตั้งที่ใช้ Codex เท่านั้น ให้ตั้ง `model: "openai/gpt-5.5"`, `embeddedHarness.runtime: "codex"` และ `embeddedHarness.fallback: "none"`
- การเลือก harness จะถูก pin ต่อ session id หลังจาก embedded run ครั้งแรก การเปลี่ยน config/env จะมีผลกับเซสชันใหม่หรือเซสชันที่ reset แล้ว ไม่ใช่กับ transcript ที่มีอยู่เดิม เซสชันเก่าที่มีประวัติ transcript แต่ไม่มี pin ที่บันทึกไว้จะถูกมองว่า pin กับ PI ไว้ `/status` จะแสดง harness id ที่ไม่ใช่ PI เช่น `codex` ถัดจาก `Fast`
- สิ่งนี้ควบคุมเฉพาะ embedded chat harness เท่านั้น การสร้างสื่อ, vision, PDF, music, video และ TTS ยังคงใช้การตั้งค่า provider/model ของตนเอง

**alias shorthand ที่มีมาในตัว** (ใช้ได้เฉพาะเมื่อ model อยู่ใน `agents.defaults.models`):

| Alias               | Model                                              |
| ------------------- | -------------------------------------------------- |
| `opus`              | `anthropic/claude-opus-4-6`                        |
| `sonnet`            | `anthropic/claude-sonnet-4-6`                      |
| `gpt`               | `openai/gpt-5.4` หรือ GPT-5.5 แบบ Codex OAuth ที่กำหนดค่าไว้ |
| `gpt-mini`          | `openai/gpt-5.4-mini`                              |
| `gpt-nano`          | `openai/gpt-5.4-nano`                              |
| `gemini`            | `google/gemini-3.1-pro-preview`                    |
| `gemini-flash`      | `google/gemini-3-flash-preview`                    |
| `gemini-flash-lite` | `google/gemini-3.1-flash-lite-preview`             |

alias ที่คุณกำหนดค่าไว้จะมีลำดับความสำคัญเหนือค่ามาตรฐานเสมอ

model Z.AI GLM-4.x จะเปิดใช้โหมด thinking โดยอัตโนมัติ เว้นแต่คุณจะตั้ง `--thinking off` หรือกำหนด `agents.defaults.models["zai/<model>"].params.thinking` ด้วยตัวเอง
model Z.AI จะเปิดใช้ `tool_stream` โดยค่าเริ่มต้นสำหรับการสตรีมการเรียกเครื่องมือ ตั้ง `agents.defaults.models["zai/<model>"].params.tool_stream` เป็น `false` เพื่อปิดใช้งาน
model Anthropic Claude 4.6 จะใช้ `adaptive` thinking โดยค่าเริ่มต้นเมื่อไม่มีการตั้งระดับ thinking แบบ explicit

### `agents.defaults.cliBackends`

CLI backend แบบเลือกได้สำหรับการรัน fallback แบบข้อความล้วน (ไม่มีการเรียกเครื่องมือ) มีประโยชน์เป็นตัวสำรองเมื่อผู้ให้บริการ API ล้มเหลว

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
          modelArg: "--model",
          sessionArg: "--session",
          sessionMode: "existing",
          systemPromptArg: "--system",
          systemPromptWhen: "first",
          imageArg: "--image",
          imageMode: "repeat",
        },
      },
    },
  },
}
```

- CLI backend เน้นข้อความเป็นหลัก; เครื่องมือจะถูกปิดใช้งานเสมอ
- รองรับเซสชันเมื่อมีการตั้ง `sessionArg`
- รองรับ image pass-through เมื่อ `imageArg` รับพาธไฟล์ได้

### `agents.defaults.systemPromptOverride`

แทนที่ system prompt ทั้งหมดที่ OpenClaw ประกอบขึ้นด้วยสตริงคงที่ ตั้งได้ที่ระดับค่าเริ่มต้น (`agents.defaults.systemPromptOverride`) หรือแยกต่อเอเจนต์ (`agents.list[].systemPromptOverride`) ค่าต่อเอเจนต์มีลำดับความสำคัญสูงกว่า; ค่าที่ว่างหรือมีแต่ช่องว่างจะถูกเพิกเฉย มีประโยชน์สำหรับการทดลองพรอมป์แบบควบคุม

```json5
{
  agents: {
    defaults: {
      systemPromptOverride: "You are a helpful assistant.",
    },
  },
}
```

### `agents.defaults.promptOverlays`

prompt overlay ที่ไม่ขึ้นกับผู้ให้บริการและใช้ตามตระกูล model model id ในตระกูล GPT-5 จะได้รับสัญญาพฤติกรรมร่วมข้ามผู้ให้บริการ โดย `personality` จะควบคุมเฉพาะเลเยอร์รูปแบบการโต้ตอบที่เป็นมิตรเท่านั้น

```json5
{
  agents: {
    defaults: {
      promptOverlays: {
        gpt5: {
          personality: "friendly", // friendly | on | off
        },
      },
    },
  },
}
```

- `"friendly"` (ค่าเริ่มต้น) และ `"on"` จะเปิดใช้เลเยอร์รูปแบบการโต้ตอบที่เป็นมิตร
- `"off"` จะปิดเฉพาะเลเยอร์ที่เป็นมิตร; สัญญาพฤติกรรม GPT-5 แบบติดแท็กยังคงเปิดใช้งานอยู่
- ค่าเดิม `plugins.entries.openai.config.personality` ยังถูกอ่านเมื่อไม่ได้ตั้งค่าร่วมนี้

### `agents.defaults.heartbeat`

การรัน Heartbeat เป็นระยะ

```json5
{
  agents: {
    defaults: {
      heartbeat: {
        every: "30m", // 0m คือปิดใช้งาน
        model: "openai/gpt-5.4-mini",
        includeReasoning: false,
        includeSystemPromptSection: true, // ค่าเริ่มต้น: true; false จะละส่วน Heartbeat ออกจาก system prompt
        lightContext: false, // ค่าเริ่มต้น: false; true จะคงไว้เฉพาะ HEARTBEAT.md จากไฟล์ bootstrap ของพื้นที่ทำงาน
        isolatedSession: false, // ค่าเริ่มต้น: false; true จะรัน Heartbeat แต่ละครั้งในเซสชันใหม่ (ไม่มีประวัติการสนทนา)
        session: "main",
        to: "+15555550123",
        directPolicy: "allow", // allow (ค่าเริ่มต้น) | block
        target: "none", // ค่าเริ่มต้น: none | ตัวเลือก: last | whatsapp | telegram | discord | ...
        prompt: "Read HEARTBEAT.md if it exists...",
        ackMaxChars: 300,
        suppressToolErrorWarnings: false,
        timeoutSeconds: 45,
      },
    },
  },
}
```

- `every`: สตริงระยะเวลา (ms/s/m/h) ค่าเริ่มต้น: `30m` (auth แบบ API key) หรือ `1h` (auth แบบ OAuth) ตั้งเป็น `0m` เพื่อปิดใช้งาน
- `includeSystemPromptSection`: เมื่อเป็น false จะละส่วน Heartbeat ออกจาก system prompt และข้ามการฉีด `HEARTBEAT.md` เข้า bootstrap context ค่าเริ่มต้น: `true`
- `suppressToolErrorWarnings`: เมื่อเป็น true จะระงับ payload คำเตือนข้อผิดพลาดของเครื่องมือระหว่างการรัน Heartbeat
- `timeoutSeconds`: เวลาสูงสุดเป็นวินาทีที่อนุญาตสำหรับ Heartbeat agent turn ก่อนจะถูกยกเลิก ปล่อยว่างไว้เพื่อใช้ `agents.defaults.timeoutSeconds`
- `directPolicy`: นโยบายการส่งแบบ direct/DM `allow` (ค่าเริ่มต้น) อนุญาตการส่งตรงถึงเป้าหมาย `block` จะระงับการส่งตรงถึงเป้าหมายและปล่อย `reason=dm-blocked`
- `lightContext`: เมื่อเป็น true การรัน Heartbeat จะใช้ bootstrap context แบบเบา และคงไว้เฉพาะ `HEARTBEAT.md` จากไฟล์ bootstrap ของพื้นที่ทำงาน
- `isolatedSession`: เมื่อเป็น true Heartbeat แต่ละครั้งจะรันในเซสชันใหม่โดยไม่มีประวัติการสนทนาก่อนหน้า ใช้รูปแบบการแยกเดียวกับ cron `sessionTarget: "isolated"` ช่วยลดค่าใช้จ่ายโทเค็นต่อ Heartbeat จากประมาณ ~100K เหลือ ~2-5K โทเค็น
- ต่อเอเจนต์: ตั้ง `agents.list[].heartbeat` เมื่อมีเอเจนต์ใดกำหนด `heartbeat`, จะมี **เฉพาะเอเจนต์เหล่านั้น** ที่รัน Heartbeat
- Heartbeat จะรัน agent turn แบบเต็ม — ช่วงเวลาที่สั้นลงจะเผาโทเค็นมากขึ้น

### `agents.defaults.compaction`

```json5
{
  agents: {
    defaults: {
      compaction: {
        mode: "safeguard", // default | safeguard
        provider: "my-provider", // id ของ Plugin ผู้ให้บริการ compaction ที่ลงทะเบียนไว้ (ไม่บังคับ)
        timeoutSeconds: 900,
        reserveTokensFloor: 24000,
        identifierPolicy: "strict", // strict | off | custom
        identifierInstructions: "Preserve deployment IDs, ticket IDs, and host:port pairs exactly.", // ใช้เมื่อ identifierPolicy=custom
        postCompactionSections: ["Session Startup", "Red Lines"], // [] คือปิดการฉีดซ้ำ
        model: "openrouter/anthropic/claude-sonnet-4-6", // override model สำหรับ compaction เท่านั้น (ไม่บังคับ)
        notifyUser: true, // ส่งข้อความสั้น ๆ เมื่อ compaction เริ่มและเสร็จ (ค่าเริ่มต้น: false)
        memoryFlush: {
          enabled: true,
          softThresholdTokens: 6000,
          systemPrompt: "Session nearing compaction. Store durable memories now.",
          prompt: "Write any lasting notes to memory/YYYY-MM-DD.md; reply with the exact silent token NO_REPLY if nothing to store.",
        },
      },
    },
  },
}
```

- `mode`: `default` หรือ `safeguard` (การสรุปแบบแบ่งเป็นช่วงสำหรับประวัติยาว) ดู [Compaction](/th/concepts/compaction)
- `provider`: id ของ Plugin ผู้ให้บริการ compaction ที่ลงทะเบียนไว้ เมื่อกำหนดไว้ ระบบจะเรียก `summarize()` ของผู้ให้บริการนั้นแทนการสรุปด้วย LLM ในตัว หากล้มเหลวจะ fallback ไปใช้แบบในตัว การตั้งผู้ให้บริการจะบังคับ `mode: "safeguard"` ดู [Compaction](/th/concepts/compaction)
- `timeoutSeconds`: จำนวนวินาทีสูงสุดที่อนุญาตสำหรับการทำ compaction หนึ่งครั้งก่อนที่ OpenClaw จะยกเลิก ค่าเริ่มต้น: `900`
- `identifierPolicy`: `strict` (ค่าเริ่มต้น), `off` หรือ `custom` โดย `strict` จะใส่คำแนะนำการเก็บ opaque identifier ของระบบในตัวไว้ข้างหน้าระหว่างการสรุป compaction
- `identifierInstructions`: ข้อความการคง identifier แบบกำหนดเองที่ไม่บังคับ ใช้เมื่อ `identifierPolicy=custom`
- `postCompactionSections`: ชื่อ section H2/H3 ใน AGENTS.md ที่เลือกได้เพื่อฉีดกลับเข้าไปหลัง compaction ค่าเริ่มต้นคือ `["Session Startup", "Red Lines"]`; ตั้ง `[]` เพื่อปิดการฉีดกลับ เมื่อไม่ได้ตั้งค่าหรือตั้งเป็นคู่ค่าเริ่มต้นดังกล่าว ระบบจะยอมรับหัวข้อเก่า `Every Session`/`Safety` เป็น legacy fallback ได้ด้วย
- `model`: override `provider/model-id` แบบเลือกได้สำหรับการสรุป compaction เท่านั้น ใช้เมื่อต้องการให้เซสชันหลักคงใช้ model หนึ่งไว้ แต่ให้สรุป compaction ไปรันบนอีก model หนึ่ง; หากไม่ได้ตั้งค่า compaction จะใช้ model หลักของเซสชัน
- `notifyUser`: เมื่อเป็น `true` จะส่งข้อความสั้น ๆ ให้ผู้ใช้เมื่อ compaction เริ่มและเมื่อเสร็จ (เช่น “Compacting context...” และ “Compaction complete”) ปิดใช้งานโดยค่าเริ่มต้นเพื่อให้ compaction เงียบ
- `memoryFlush`: agentic turn แบบเงียบก่อน auto-compaction เพื่อเก็บความทรงจำที่ควรคงไว้ จะถูกข้ามเมื่อพื้นที่ทำงานเป็นแบบ read-only

### `agents.defaults.contextPruning`

ลบ **ผลลัพธ์ของเครื่องมือเก่า** ออกจากบริบทในหน่วยความจำก่อนส่งไปยัง LLM โดย **ไม่** แก้ไขประวัติเซสชันบนดิสก์

```json5
{
  agents: {
    defaults: {
      contextPruning: {
        mode: "cache-ttl", // off | cache-ttl
        ttl: "1h", // ระยะเวลา (ms/s/m/h), หน่วยเริ่มต้น: นาที
        keepLastAssistants: 3,
        softTrimRatio: 0.3,
        hardClearRatio: 0.5,
        minPrunableToolChars: 50000,
        softTrim: { maxChars: 4000, headChars: 1500, tailChars: 1500 },
        hardClear: { enabled: true, placeholder: "[Old tool result content cleared]" },
        tools: { deny: ["browser", "canvas"] },
      },
    },
  },
}
```

<Accordion title="พฤติกรรมของโหมด cache-ttl">

- `mode: "cache-ttl"` เปิดใช้งานรอบการ pruning
- `ttl` ควบคุมว่าการ pruning จะรันได้อีกครั้งเมื่อใด (หลังจาก cache touch ล่าสุด)
- การ pruning จะ soft-trim ผลลัพธ์เครื่องมือขนาดใหญ่เกินก่อน จากนั้นจึง hard-clear ผลลัพธ์เครื่องมือที่เก่ากว่าหากยังจำเป็น

**Soft-trim** จะเก็บส่วนต้น + ส่วนท้าย แล้วแทรก `...` ไว้ตรงกลาง

**Hard-clear** จะแทนที่ผลลัพธ์เครื่องมือทั้งหมดด้วย placeholder

หมายเหตุ:

- บล็อกรูปภาพจะไม่ถูก trim/clear
- อัตราส่วนต่าง ๆ คิดตามจำนวนอักขระ (โดยประมาณ) ไม่ใช่จำนวนโทเค็นแบบแม่นยำ
- หากมีข้อความผู้ช่วยน้อยกว่า `keepLastAssistants` ระบบจะข้ามการ pruning

</Accordion>

ดู [Session Pruning](/th/concepts/session-pruning) สำหรับรายละเอียดพฤติกรรม

### Block streaming

```json5
{
  agents: {
    defaults: {
      blockStreamingDefault: "off", // on | off
      blockStreamingBreak: "text_end", // text_end | message_end
      blockStreamingChunk: { minChars: 800, maxChars: 1200 },
      blockStreamingCoalesce: { idleMs: 1000 },
      humanDelay: { mode: "natural" }, // off | natural | custom (ใช้ minMs/maxMs)
    },
  },
}
```

- ช่องทางที่ไม่ใช่ Telegram ต้องตั้ง `*.blockStreaming: true` แบบ explicit เพื่อเปิดใช้การตอบกลับแบบ block
- override ต่อช่องทาง: `channels.<channel>.blockStreamingCoalesce` (และตัวแปรต่อบัญชี) โดย Signal/Slack/Discord/Google Chat มีค่าเริ่มต้น `minChars: 1500`
- `humanDelay`: การหน่วงแบบสุ่มระหว่างการตอบกลับแบบ block โดย `natural` = 800–2500ms ส่วน override ต่อเอเจนต์: `agents.list[].humanDelay`

ดู [Streaming](/th/concepts/streaming) สำหรับรายละเอียดพฤติกรรม + การแบ่ง chunk

### ตัวบ่งชี้การพิมพ์

```json5
{
  agents: {
    defaults: {
      typingMode: "instant", // never | instant | thinking | message
      typingIntervalSeconds: 6,
    },
  },
}
```

- ค่าเริ่มต้น: `instant` สำหรับแชตโดยตรง/การกล่าวถึง, `message` สำหรับแชตกลุ่มที่ไม่มีการกล่าวถึง
- override ต่อเซสชัน: `session.typingMode`, `session.typingIntervalSeconds`

ดู [Typing Indicators](/th/concepts/typing-indicators)

<a id="agentsdefaultssandbox"></a>

### `agents.defaults.sandbox`

Sandboxing แบบเลือกได้สำหรับ embedded agent ดู [Sandboxing](/th/gateway/sandboxing) สำหรับคู่มือฉบับเต็ม

```json5
{
  agents: {
    defaults: {
      sandbox: {
        mode: "non-main", // off | non-main | all
        backend: "docker", // docker | ssh | openshell
        scope: "agent", // session | agent | shared
        workspaceAccess: "none", // none | ro | rw
        workspaceRoot: "~/.openclaw/sandboxes",
        docker: {
          image: "openclaw-sandbox:bookworm-slim",
          containerPrefix: "openclaw-sbx-",
          workdir: "/workspace",
          readOnlyRoot: true,
          tmpfs: ["/tmp", "/var/tmp", "/run"],
          network: "none",
          user: "1000:1000",
          capDrop: ["ALL"],
          env: { LANG: "C.UTF-8" },
          setupCommand: "apt-get update && apt-get install -y git curl jq",
          pidsLimit: 256,
          memory: "1g",
          memorySwap: "2g",
          cpus: 1,
          ulimits: {
            nofile: { soft: 1024, hard: 2048 },
            nproc: 256,
          },
          seccompProfile: "/path/to/seccomp.json",
          apparmorProfile: "openclaw-sandbox",
          dns: ["1.1.1.1", "8.8.8.8"],
          extraHosts: ["internal.service:10.0.0.5"],
          binds: ["/home/user/source:/source:rw"],
        },
        ssh: {
          target: "user@gateway-host:22",
          command: "ssh",
          workspaceRoot: "/tmp/openclaw-sandboxes",
          strictHostKeyChecking: true,
          updateHostKeys: true,
          identityFile: "~/.ssh/id_ed25519",
          certificateFile: "~/.ssh/id_ed25519-cert.pub",
          knownHostsFile: "~/.ssh/known_hosts",
          // รองรับ SecretRef / เนื้อหาแบบ inline ด้วย:
          // identityData: { source: "env", provider: "default", id: "SSH_IDENTITY" },
          // certificateData: { source: "env", provider: "default", id: "SSH_CERTIFICATE" },
          // knownHostsData: { source: "env", provider: "default", id: "SSH_KNOWN_HOSTS" },
        },
        browser: {
          enabled: false,
          image: "openclaw-sandbox-browser:bookworm-slim",
          network: "openclaw-sandbox-browser",
          cdpPort: 9222,
          cdpSourceRange: "172.21.0.1/32",
          vncPort: 5900,
          noVncPort: 6080,
          headless: false,
          enableNoVnc: true,
          allowHostControl: false,
          autoStart: true,
          autoStartTimeoutMs: 12000,
        },
        prune: {
          idleHours: 24,
          maxAgeDays: 7,
        },
      },
    },
  },
  tools: {
    sandbox: {
      tools: {
        allow: [
          "exec",
          "process",
          "read",
          "write",
          "edit",
          "apply_patch",
          "sessions_list",
          "sessions_history",
          "sessions_send",
          "sessions_spawn",
          "session_status",
        ],
        deny: ["browser", "canvas", "nodes", "cron", "discord", "gateway"],
      },
    },
  },
}
```

<Accordion title="รายละเอียดของ Sandbox">

**Backend:**

- `docker`: runtime Docker ในเครื่อง (ค่าเริ่มต้น)
- `ssh`: runtime แบบ remote ทั่วไปที่อิง SSH
- `openshell`: runtime ของ OpenShell

เมื่อเลือก `backend: "openshell"` การตั้งค่าเฉพาะ runtime จะย้ายไปอยู่ที่
`plugins.entries.openshell.config`

**config ของ SSH backend:**

- `target`: เป้าหมาย SSH ในรูปแบบ `user@host[:port]`
- `command`: คำสั่งไคลเอนต์ SSH (ค่าเริ่มต้น: `ssh`)
- `workspaceRoot`: รากแบบ absolute ฝั่ง remote ที่ใช้สำหรับ workspace ตาม scope
- `identityFile` / `certificateFile` / `knownHostsFile`: ไฟล์ในเครื่องที่มีอยู่แล้วซึ่งส่งผ่านไปยัง OpenSSH
- `identityData` / `certificateData` / `knownHostsData`: เนื้อหาแบบ inline หรือ SecretRef ที่ OpenClaw จะ materialize เป็นไฟล์ชั่วคราวขณะรัน
- `strictHostKeyChecking` / `updateHostKeys`: ตัวปรับนโยบาย host-key ของ OpenSSH

**ลำดับความสำคัญของ SSH auth:**

- `identityData` มีลำดับความสำคัญเหนือ `identityFile`
- `certificateData` มีลำดับความสำคัญเหนือ `certificateFile`
- `knownHostsData` มีลำดับความสำคัญเหนือ `knownHostsFile`
- ค่า `*Data` ที่อิง SecretRef จะถูก resolve จาก snapshot ของ runtime สำหรับ secrets ที่กำลังใช้งานอยู่ก่อนเซสชัน sandbox จะเริ่มต้น

**พฤติกรรมของ SSH backend:**

- วาง seed ให้ workspace ฝั่ง remote หนึ่งครั้งหลังการสร้างหรือสร้างใหม่
- จากนั้นคง workspace SSH ฝั่ง remote ให้เป็น canonical
- กำหนดเส้นทาง `exec`, เครื่องมือไฟล์ และพาธสื่อผ่าน SSH
- ไม่ซิงก์การเปลี่ยนแปลงฝั่ง remote กลับมายังโฮสต์โดยอัตโนมัติ
- ไม่รองรับ container เบราว์เซอร์ของ sandbox

**การเข้าถึงพื้นที่ทำงาน:**

- `none`: workspace ของ sandbox ตาม scope ภายใต้ `~/.openclaw/sandboxes`
- `ro`: workspace ของ sandbox ที่ `/workspace`, พื้นที่ทำงานของเอเจนต์ถูก mount แบบ read-only ที่ `/agent`
- `rw`: พื้นที่ทำงานของเอเจนต์ถูก mount แบบ read/write ที่ `/workspace`

**Scope:**

- `session`: container + workspace ต่อเซสชัน
- `agent`: container + workspace หนึ่งชุดต่อเอเจนต์ (ค่าเริ่มต้น)
- `shared`: container และ workspace แบบใช้ร่วมกัน (ไม่มีการแยกข้ามเซสชัน)

**config ของ OpenShell Plugin:**

```json5
{
  plugins: {
    entries: {
      openshell: {
        enabled: true,
        config: {
          mode: "mirror", // mirror | remote
          from: "openclaw",
          remoteWorkspaceDir: "/sandbox",
          remoteAgentWorkspaceDir: "/agent",
          gateway: "lab", // ไม่บังคับ
          gatewayEndpoint: "https://lab.example", // ไม่บังคับ
          policy: "strict", // optional OpenShell policy id
          providers: ["openai"], // ไม่บังคับ
          autoProviders: true,
          timeoutSeconds: 120,
        },
      },
    },
  },
}
```

**โหมดของ OpenShell:**

- `mirror`: วาง seed ให้ฝั่ง remote จาก local ก่อน exec แล้วซิงก์กลับหลัง exec; พื้นที่ทำงาน local ยังคงเป็น canonical
- `remote`: วาง seed ให้ฝั่ง remote หนึ่งครั้งเมื่อ sandbox ถูกสร้าง จากนั้นคงพื้นที่ทำงานฝั่ง remote ให้เป็น canonical

ในโหมด `remote` การแก้ไขบนโฮสต์ local ที่ทำจากภายนอก OpenClaw จะไม่ถูกซิงก์เข้า sandbox โดยอัตโนมัติหลังขั้นตอน seed
transport คือ SSH เข้าไปยัง OpenShell sandbox แต่ Plugin เป็นผู้ดูแลวงจรชีวิตของ sandbox และการซิงก์แบบ mirror ที่เป็นตัวเลือก

**`setupCommand`** จะรันหนึ่งครั้งหลังสร้าง container (ผ่าน `sh -lc`) ต้องการ network egress, root ที่เขียนได้ และผู้ใช้ root

**container มีค่าเริ่มต้นเป็น `network: "none"`** — ตั้งเป็น `"bridge"` (หรือ custom bridge network) หากเอเจนต์ต้องการการเข้าถึงขาออก
`"host"` ถูกบล็อก `"container:<id>"` ถูกบล็อกโดยค่าเริ่มต้น เว้นแต่คุณจะตั้ง
`sandbox.docker.dangerouslyAllowContainerNamespaceJoin: true` อย่างชัดเจน (break-glass)

**ไฟล์แนบขาเข้า** จะถูกจัดวางไว้ใน `media/inbound/*` ภายในพื้นที่ทำงานที่กำลังใช้งานอยู่

**`docker.binds`** ใช้ mount ไดเรกทอรีโฮสต์เพิ่มเติม; bind แบบส่วนกลางและแบบต่อเอเจนต์จะถูกรวมเข้าด้วยกัน

**เบราว์เซอร์แบบ sandboxed** (`sandbox.browser.enabled`): Chromium + CDP ใน container โดย URL ของ noVNC จะถูกฉีดเข้า system prompt ไม่ต้องใช้ `browser.enabled` ใน `openclaw.json`
การเข้าถึงแบบ observer ผ่าน noVNC ใช้ VNC auth เป็นค่าเริ่มต้น และ OpenClaw จะปล่อย URL ที่มีโทเค็นอายุสั้น (แทนการเปิดเผยรหัสผ่านใน URL ที่ใช้ร่วมกัน)

- `allowHostControl: false` (ค่าเริ่มต้น) จะบล็อกเซสชันที่ sandboxed ไม่ให้กำหนดเป้าหมายไปยังเบราว์เซอร์ของโฮสต์
- `network` มีค่าเริ่มต้นเป็น `openclaw-sandbox-browser` (bridge network เฉพาะ) ตั้งเป็น `bridge` เฉพาะเมื่อคุณต้องการการเชื่อมต่อ bridge แบบส่วนกลางอย่างชัดเจน
- `cdpSourceRange` ใช้จำกัด CDP ingress ที่ขอบ container เป็นช่วง CIDR ได้ตามต้องการ (เช่น `172.21.0.1/32`)
- `sandbox.browser.binds` ใช้ mount ไดเรกทอรีโฮสต์เพิ่มเติมเข้าเฉพาะ container เบราว์เซอร์ของ sandbox เมื่อมีการตั้งค่า (รวมถึง `[]`) มันจะแทนที่ `docker.binds` สำหรับ container เบราว์เซอร์
- ค่าเริ่มต้นของการ launch ถูกกำหนดไว้ใน `scripts/sandbox-browser-entrypoint.sh` และปรับแต่งสำหรับโฮสต์แบบ container:
  - `--remote-debugging-address=127.0.0.1`
  - `--remote-debugging-port=<derived from OPENCLAW_BROWSER_CDP_PORT>`
  - `--user-data-dir=${HOME}/.chrome`
  - `--no-first-run`
  - `--no-default-browser-check`
  - `--disable-3d-apis`
  - `--disable-gpu`
  - `--disable-software-rasterizer`
  - `--disable-dev-shm-usage`
  - `--disable-background-networking`
  - `--disable-features=TranslateUI`
  - `--disable-breakpad`
  - `--disable-crash-reporter`
  - `--renderer-process-limit=2`
  - `--no-zygote`
  - `--metrics-recording-only`
  - `--disable-extensions` (เปิดใช้งานโดยค่าเริ่มต้น)
  - `--disable-3d-apis`, `--disable-software-rasterizer` และ `--disable-gpu`
    เปิดใช้งานโดยค่าเริ่มต้น และสามารถปิดได้ด้วย
    `OPENCLAW_BROWSER_DISABLE_GRAPHICS_FLAGS=0` หากการใช้งาน WebGL/3D ต้องการ
  - `OPENCLAW_BROWSER_DISABLE_EXTENSIONS=0` จะเปิดส่วนขยายกลับมา หากเวิร์กโฟลว์ของคุณ
    พึ่งพาพวกมัน
  - `--renderer-process-limit=2` สามารถเปลี่ยนได้ด้วย
    `OPENCLAW_BROWSER_RENDERER_PROCESS_LIMIT=<N>`; ตั้งเป็น `0` เพื่อใช้
    ขีดจำกัด process เริ่มต้นของ Chromium
  - รวมถึง `--no-sandbox` และ `--disable-setuid-sandbox` เมื่อเปิดใช้ `noSandbox`
  - ค่าเริ่มต้นคือ baseline ของ container image; ใช้ browser image แบบกำหนดเองพร้อม
    entrypoint แบบกำหนดเองเพื่อเปลี่ยนค่าเริ่มต้นของ container

</Accordion>

browser sandboxing และ `sandbox.docker.binds` ใช้ได้เฉพาะกับ Docker เท่านั้น

สร้าง image:

```bash
scripts/sandbox-setup.sh           # image sandbox หลัก
scripts/sandbox-browser-setup.sh   # image เบราว์เซอร์เสริม
```

### `agents.list` (override ต่อเอเจนต์)

```json5
{
  agents: {
    list: [
      {
        id: "main",
        default: true,
        name: "Main Agent",
        workspace: "~/.openclaw/workspace",
        agentDir: "~/.openclaw/agents/main/agent",
        model: "anthropic/claude-opus-4-6", // หรือ { primary, fallbacks }
        thinkingDefault: "high", // override ระดับ thinking ต่อเอเจนต์
        reasoningDefault: "on", // override การมองเห็น reasoning ต่อเอเจนต์
        fastModeDefault: false, // override fast mode ต่อเอเจนต์
        embeddedHarness: { runtime: "auto", fallback: "pi" },
        params: { cacheRetention: "none" }, // override params ของ defaults.models ที่ตรงกันตามคีย์
        skills: ["docs-search"], // แทนที่ agents.defaults.skills เมื่อมีการตั้งค่า
        identity: {
          name: "Samantha",
          theme: "helpful sloth",
          emoji: "🦥",
          avatar: "avatars/samantha.png",
        },
        groupChat: { mentionPatterns: ["@openclaw"] },
        sandbox: { mode: "off" },
        runtime: {
          type: "acp",
          acp: {
            agent: "codex",
            backend: "acpx",
            mode: "persistent",
            cwd: "/workspace/openclaw",
          },
        },
        subagents: { allowAgents: ["*"] },
        tools: {
          profile: "coding",
          allow: ["browser"],
          deny: ["canvas"],
          elevated: { enabled: true },
        },
      },
    ],
  },
}
```

- `id`: agent id ที่เสถียร (จำเป็น)
- `default`: หากตั้งหลายตัว ตัวแรกจะชนะ (มีการบันทึกคำเตือน) หากไม่ตั้งเลย รายการแรกใน list จะเป็นค่าเริ่มต้น
- `model`: รูปแบบสตริง override เฉพาะ `primary`; รูปแบบออบเจ็กต์ `{ primary, fallbacks }` จะ override ทั้งคู่ (`[]` คือปิด global fallback) งาน Cron ที่ override เฉพาะ `primary` ยังคงสืบทอด fallback เริ่มต้น เว้นแต่คุณจะตั้ง `fallbacks: []`
- `params`: stream params ต่อเอเจนต์ที่ถูกรวมทับบนรายการ model ที่เลือกใน `agents.defaults.models` ใช้สิ่งนี้สำหรับ override เฉพาะเอเจนต์ เช่น `cacheRetention`, `temperature` หรือ `maxTokens` โดยไม่ต้องทำสำเนาแค็ตตาล็อก model ทั้งหมด
- `skills`: allowlist ของ Skills ต่อเอเจนต์แบบไม่บังคับ หากละไว้ เอเจนต์จะสืบทอด `agents.defaults.skills` เมื่อมีการตั้งค่าไว้; รายการแบบ explicit จะแทนที่ค่าเริ่มต้นแทนที่จะรวมกัน และ `[]` หมายถึงไม่มี Skills
- `thinkingDefault`: ระดับ thinking เริ่มต้นต่อเอเจนต์แบบไม่บังคับ (`off | minimal | low | medium | high | xhigh | adaptive | max`) จะ override `agents.defaults.thinkingDefault` สำหรับเอเจนต์นี้เมื่อไม่มี override ต่อข้อความหรือเซสชัน
- `reasoningDefault`: การมองเห็น reasoning เริ่มต้นต่อเอเจนต์แบบไม่บังคับ (`on | off | stream`) จะมีผลเมื่อไม่มี override reasoning ต่อข้อความหรือเซสชัน
- `fastModeDefault`: ค่าเริ่มต้นของ fast mode ต่อเอเจนต์แบบไม่บังคับ (`true | false`) จะมีผลเมื่อไม่มี override fast-mode ต่อข้อความหรือเซสชัน
- `embeddedHarness`: override นโยบาย harness ระดับล่างต่อเอเจนต์แบบไม่บังคับ ใช้ `{ runtime: "codex", fallback: "none" }` เพื่อทำให้เอเจนต์หนึ่งเป็น Codex-only ในขณะที่เอเจนต์อื่นยังคงใช้ PI fallback ค่าเริ่มต้น
- `runtime`: ตัวบอก runtime ต่อเอเจนต์แบบไม่บังคับ ใช้ `type: "acp"` พร้อมค่าเริ่มต้นของ `runtime.acp` (`agent`, `backend`, `mode`, `cwd`) เมื่อเอเจนต์ควรใช้เซสชัน ACP harness เป็นค่าเริ่มต้น
- `identity.avatar`: พาธแบบสัมพันธ์กับพื้นที่ทำงาน, URL `http(s)` หรือ URI แบบ `data:`
- `identity` จะสร้างค่าเริ่มต้นอนุพันธ์: `ackReaction` จาก `emoji`, `mentionPatterns` จาก `name`/`emoji`
- `subagents.allowAgents`: allowlist ของ agent id สำหรับ `sessions_spawn` (`["*"]` = ใดก็ได้; ค่าเริ่มต้น: เฉพาะเอเจนต์เดียวกัน)
- ตัวป้องกันการสืบทอด Sandbox: หากเซสชันของผู้ร้องขอถูก sandboxed, `sessions_spawn` จะปฏิเสธเป้าหมายที่จะรันโดยไม่ใช้ sandbox
- `subagents.requireAgentId`: เมื่อเป็น true จะบล็อกการเรียก `sessions_spawn` ที่ละ `agentId` (บังคับให้เลือกโปรไฟล์แบบ explicit; ค่าเริ่มต้น: false)

---

## การกำหนดเส้นทางหลายเอเจนต์

รันเอเจนต์แบบ isolated หลายตัวภายใน Gateway เดียว ดู [Multi-Agent](/th/concepts/multi-agent)

```json5
{
  agents: {
    list: [
      { id: "home", default: true, workspace: "~/.openclaw/workspace-home" },
      { id: "work", workspace: "~/.openclaw/workspace-work" },
    ],
  },
  bindings: [
    { agentId: "home", match: { channel: "whatsapp", accountId: "personal" } },
    { agentId: "work", match: { channel: "whatsapp", accountId: "biz" } },
  ],
}
```

### ฟิลด์การจับคู่ของ Binding

- `type` (ไม่บังคับ): `route` สำหรับการกำหนดเส้นทางปกติ (หากไม่มี type จะใช้ route เป็นค่าเริ่มต้น), `acp` สำหรับการผูกการสนทนา ACP แบบคงอยู่
- `match.channel` (จำเป็น)
- `match.accountId` (ไม่บังคับ; `*` = ทุกบัญชี; ละไว้ = บัญชีค่าเริ่มต้น)
- `match.peer` (ไม่บังคับ; `{ kind: direct|group|channel, id }`)
- `match.guildId` / `match.teamId` (ไม่บังคับ; เฉพาะบางช่องทาง)
- `acp` (ไม่บังคับ; ใช้เฉพาะกับ `type: "acp"`): `{ mode, label, cwd, backend }`

**ลำดับการจับคู่แบบกำหนดแน่นอน:**

1. `match.peer`
2. `match.guildId`
3. `match.teamId`
4. `match.accountId` (ตรงตัว, ไม่มี peer/guild/team)
5. `match.accountId: "*"` (ครอบคลุมทั้งช่องทาง)
6. เอเจนต์ค่าเริ่มต้น

ภายในแต่ละระดับ รายการ `bindings` ที่ตรงกันตัวแรกจะชนะ

สำหรับรายการ `type: "acp"` OpenClaw จะ resolve ตามตัวตนการสนทนาแบบตรงตัว (`match.channel` + บัญชี + `match.peer.id`) และจะไม่ใช้ลำดับระดับของ route binding ด้านบน

### โปรไฟล์การเข้าถึงต่อเอเจนต์

<Accordion title="เข้าถึงเต็มรูปแบบ (ไม่มี sandbox)">

```json5
{
  agents: {
    list: [
      {
        id: "personal",
        workspace: "~/.openclaw/workspace-personal",
        sandbox: { mode: "off" },
      },
    ],
  },
}
```

</Accordion>

<Accordion title="เครื่องมือ + พื้นที่ทำงานแบบอ่านอย่างเดียว">

```json5
{
  agents: {
    list: [
      {
        id: "family",
        workspace: "~/.openclaw/workspace-family",
        sandbox: { mode: "all", scope: "agent", workspaceAccess: "ro" },
        tools: {
          allow: [
            "read",
            "sessions_list",
            "sessions_history",
            "sessions_send",
            "sessions_spawn",
            "session_status",
          ],
          deny: ["write", "edit", "apply_patch", "exec", "process", "browser"],
        },
      },
    ],
  },
}
```

</Accordion>

<Accordion title="ไม่มีการเข้าถึงระบบไฟล์ (ส่งข้อความเท่านั้น)">

```json5
{
  agents: {
    list: [
      {
        id: "public",
        workspace: "~/.openclaw/workspace-public",
        sandbox: { mode: "all", scope: "agent", workspaceAccess: "none" },
        tools: {
          allow: [
            "sessions_list",
            "sessions_history",
            "sessions_send",
            "sessions_spawn",
            "session_status",
            "whatsapp",
            "telegram",
            "slack",
            "discord",
            "gateway",
          ],
          deny: [
            "read",
            "write",
            "edit",
            "apply_patch",
            "exec",
            "process",
            "browser",
            "canvas",
            "nodes",
            "cron",
            "gateway",
            "image",
          ],
        },
      },
    ],
  },
}
```

</Accordion>

ดู [Multi-Agent Sandbox & Tools](/th/tools/multi-agent-sandbox-tools) สำหรับรายละเอียดเรื่องลำดับความสำคัญ

---

## เซสชัน

```json5
{
  session: {
    scope: "per-sender",
    dmScope: "main", // main | per-peer | per-channel-peer | per-account-channel-peer
    identityLinks: {
      alice: ["telegram:123456789", "discord:987654321012345678"],
    },
    reset: {
      mode: "daily", // daily | idle
      atHour: 4,
      idleMinutes: 60,
    },
    resetByType: {
      thread: { mode: "daily", atHour: 4 },
      direct: { mode: "idle", idleMinutes: 240 },
      group: { mode: "idle", idleMinutes: 120 },
    },
    resetTriggers: ["/new", "/reset"],
    store: "~/.openclaw/agents/{agentId}/sessions/sessions.json",
    parentForkMaxTokens: 100000, // ข้ามการ fork จากเธรดแม่เมื่อเกินจำนวนโทเค็นนี้ (0 คือปิดใช้งาน)
    maintenance: {
      mode: "warn", // warn | enforce
      pruneAfter: "30d",
      maxEntries: 500,
      rotateBytes: "10mb",
      resetArchiveRetention: "30d", // ระยะเวลา หรือ false
      maxDiskBytes: "500mb", // hard budget แบบเลือกได้
      highWaterBytes: "400mb", // เป้าหมาย cleanup แบบเลือกได้
    },
    threadBindings: {
      enabled: true,
      idleHours: 24, // auto-unfocus ตามค่าเริ่มต้นเมื่อไม่มีการใช้งาน เป็นชั่วโมง (`0` คือปิดใช้งาน)
      maxAgeHours: 0, // อายุสูงสุดแบบ hard ตามค่าเริ่มต้น เป็นชั่วโมง (`0` คือปิดใช้งาน)
    },
    mainKey: "main", // แบบเก่า (runtime ใช้ "main" เสมอ)
    agentToAgent: { maxPingPongTurns: 5 },
    sendPolicy: {
      rules: [{ action: "deny", match: { channel: "discord", chatType: "group" } }],
      default: "allow",
    },
  },
}
```

<Accordion title="รายละเอียดฟิลด์ของเซสชัน">

- **`scope`**: กลยุทธ์การจัดกลุ่มเซสชันพื้นฐานสำหรับบริบทแชตกลุ่ม
  - `per-sender` (ค่าเริ่มต้น): ผู้ส่งแต่ละคนจะได้เซสชันแบบ isolated ภายในบริบทของช่องทาง
  - `global`: ผู้เข้าร่วมทั้งหมดในบริบทของช่องทางจะแชร์เซสชันเดียวกัน (ใช้เฉพาะเมื่อเจตนาคือให้แชร์บริบท)
- **`dmScope`**: วิธีจัดกลุ่ม DM
  - `main`: DM ทั้งหมดแชร์เซสชันหลัก
  - `per-peer`: แยกตาม sender id ข้ามช่องทาง
  - `per-channel-peer`: แยกตามช่องทาง + ผู้ส่ง (แนะนำสำหรับกล่องข้อความหลายผู้ใช้)
  - `per-account-channel-peer`: แยกตามบัญชี + ช่องทาง + ผู้ส่ง (แนะนำสำหรับหลายบัญชี)
- **`identityLinks`**: แมป canonical id ไปยัง peer แบบมี prefix ของผู้ให้บริการเพื่อแชร์เซสชันข้ามช่องทาง
- **`reset`**: นโยบายรีเซ็ตหลัก `daily` จะรีเซ็ตที่ `atHour` ตามเวลาท้องถิ่น; `idle` จะรีเซ็ตหลัง `idleMinutes` เมื่อกำหนดทั้งสองแบบ ตัวที่หมดอายุก่อนจะชนะ
- **`resetByType`**: override ตามประเภท (`direct`, `group`, `thread`) โดยระบบยังยอมรับ `dm` แบบเก่าเป็น alias ของ `direct`
- **`parentForkMaxTokens`**: จำนวน `totalTokens` สูงสุดของเซสชันแม่ที่อนุญาตเมื่อสร้างเซสชันเธรดแบบ forked (ค่าเริ่มต้น `100000`)
  - หาก `totalTokens` ของ parent สูงกว่าค่านี้ OpenClaw จะเริ่มเซสชันเธรดใหม่แทนการสืบทอดประวัติ transcript ของ parent
  - ตั้ง `0` เพื่อปิด guard นี้และอนุญาตการ forking จาก parent เสมอ
- **`mainKey`**: ฟิลด์แบบเก่า runtime ใช้ `"main"` เสมอสำหรับบักเก็ตแชตโดยตรงหลัก
- **`agentToAgent.maxPingPongTurns`**: จำนวนเทิร์น reply-back สูงสุดระหว่างเอเจนต์ในการแลกเปลี่ยนแบบ agent-to-agent (จำนวนเต็ม, ช่วง: `0`–`5`) ค่า `0` จะปิด ping-pong chaining
- **`sendPolicy`**: จับคู่ตาม `channel`, `chatType` (`direct|group|channel` โดย `dm` แบบเก่าเป็น alias), `keyPrefix` หรือ `rawKeyPrefix` โดย deny ตัวแรกจะชนะ
- **`maintenance`**: การ cleanup + การควบคุม retention ของ session-store
  - `mode`: `warn` จะปล่อยคำเตือนเท่านั้น; `enforce` จะใช้ cleanup จริง
  - `pruneAfter`: จุดตัดอายุตามเวลาสำหรับรายการที่ stale (ค่าเริ่มต้น `30d`)
  - `maxEntries`: จำนวนรายการสูงสุดใน `sessions.json` (ค่าเริ่มต้น `500`)
  - `rotateBytes`: หมุน `sessions.json` เมื่อมีขนาดเกินค่านี้ (ค่าเริ่มต้น `10mb`)
  - `resetArchiveRetention`: retention สำหรับ transcript archive แบบ `*.reset.<timestamp>` ค่าเริ่มต้นจะใช้ `pruneAfter`; ตั้ง `false` เพื่อปิดใช้งาน
  - `maxDiskBytes`: งบประมาณดิสก์ของไดเรกทอรีเซสชันแบบเลือกได้ ในโหมด `warn` จะบันทึกคำเตือน; ในโหมด `enforce` จะลบ artifact/เซสชันที่เก่าที่สุดก่อน
  - `highWaterBytes`: เป้าหมายหลัง cleanup ตามงบประมาณแบบเลือกได้ ค่าเริ่มต้นคือ `80%` ของ `maxDiskBytes`
- **`threadBindings`**: ค่าเริ่มต้นส่วนกลางสำหรับฟีเจอร์เซสชันที่ผูกกับเธรด
  - `enabled`: สวิตช์ค่าเริ่มต้นหลัก (ผู้ให้บริการสามารถ override ได้; Discord ใช้ `channels.discord.threadBindings.enabled`)
  - `idleHours`: auto-unfocus ตามค่าเริ่มต้นเมื่อไม่มีการใช้งาน เป็นชั่วโมง (`0` คือปิดใช้งาน; ผู้ให้บริการสามารถ override ได้)
  - `maxAgeHours`: อายุสูงสุดแบบ hard ตามค่าเริ่มต้น เป็นชั่วโมง (`0` คือปิดใช้งาน; ผู้ให้บริการสามารถ override ได้)

</Accordion>

---

## ข้อความ

```json5
{
  messages: {
    responsePrefix: "🦞", // หรือ "auto"
    ackReaction: "👀",
    ackReactionScope: "group-mentions", // group-mentions | group-all | direct | all
    removeAckAfterReply: false,
    queue: {
      mode: "collect", // steer | followup | collect | steer-backlog | steer+backlog | queue | interrupt
      debounceMs: 1000,
      cap: 20,
      drop: "summarize", // old | new | summarize
      byChannel: {
        whatsapp: "collect",
        telegram: "collect",
      },
    },
    inbound: {
      debounceMs: 2000, // 0 คือปิดใช้งาน
      byChannel: {
        whatsapp: 5000,
        slack: 1500,
      },
    },
  },
}
```

### คำนำหน้าการตอบกลับ

override ต่อช่องทาง/บัญชี: `channels.<channel>.responsePrefix`, `channels.<channel>.accounts.<id>.responsePrefix`

การ resolve (เฉพาะเจาะจงที่สุดชนะ): บัญชี → ช่องทาง → ส่วนกลาง ค่า `""` จะปิดใช้งานและหยุดการไล่ลำดับค่า `"auto"` จะสร้างจาก `[{identity.name}]`

**ตัวแปรของเทมเพลต:**

| ตัวแปร | คำอธิบาย | ตัวอย่าง |
| ----------------- | ---------------------- | --------------------------- |
| `{model}`         | ชื่อ model แบบสั้น | `claude-opus-4-6` |
| `{modelFull}`     | ตัวระบุ model แบบเต็ม | `anthropic/claude-opus-4-6` |
| `{provider}`      | ชื่อผู้ให้บริการ | `anthropic` |
| `{thinkingLevel}` | ระดับ thinking ปัจจุบัน | `high`, `low`, `off` |
| `{identity.name}` | ชื่อ identity ของเอเจนต์ | (เหมือนกับ `"auto"`) |

ตัวแปรไม่แยกตัวพิมพ์เล็ก-ใหญ่ `{think}` เป็น alias ของ `{thinkingLevel}`

### Ack reaction

- มีค่าเริ่มต้นเป็น `identity.emoji` ของเอเจนต์ที่กำลังใช้งานอยู่ มิฉะนั้นเป็น `"👀"` ตั้ง `""` เพื่อปิดใช้งาน
- override ต่อช่องทาง: `channels.<channel>.ackReaction`, `channels.<channel>.accounts.<id>.ackReaction`
- ลำดับการ resolve: บัญชี → ช่องทาง → `messages.ackReaction` → identity fallback
- ขอบเขต: `group-mentions` (ค่าเริ่มต้น), `group-all`, `direct`, `all`
- `removeAckAfterReply`: จะลบ ack หลังตอบกลับบน Slack, Discord และ Telegram
- `messages.statusReactions.enabled`: เปิดใช้งาน lifecycle status reaction บน Slack, Discord และ Telegram
  บน Slack และ Discord หากไม่ได้ตั้งค่า ระบบจะคง status reaction ให้เปิดไว้เมื่อมี ack reaction ทำงาน
  บน Telegram ให้ตั้งเป็น `true` อย่างชัดเจนเพื่อเปิดใช้งาน lifecycle status reaction

### Inbound debounce

จัดกลุ่มข้อความแบบข้อความล้วนที่เข้ามาอย่างรวดเร็วจากผู้ส่งคนเดียวกันให้เป็น agent turn เดียว สื่อ/ไฟล์แนบจะ flush ทันที คำสั่งควบคุมจะข้ามการ debounce

### TTS (text-to-speech)

```json5
{
  messages: {
    tts: {
      auto: "always", // off | always | inbound | tagged
      mode: "final", // final | all
      provider: "elevenlabs",
      summaryModel: "openai/gpt-4.1-mini",
      modelOverrides: { enabled: true },
      maxTextLength: 4000,
      timeoutMs: 30000,
      prefsPath: "~/.openclaw/settings/tts.json",
      elevenlabs: {
        apiKey: "elevenlabs_api_key",
        baseUrl: "https://api.elevenlabs.io",
        voiceId: "voice_id",
        modelId: "eleven_multilingual_v2",
        seed: 42,
        applyTextNormalization: "auto",
        languageCode: "en",
        voiceSettings: {
          stability: 0.5,
          similarityBoost: 0.75,
          style: 0.0,
          useSpeakerBoost: true,
          speed: 1.0,
        },
      },
      openai: {
        apiKey: "openai_api_key",
        baseUrl: "https://api.openai.com/v1",
        model: "gpt-4o-mini-tts",
        voice: "alloy",
      },
    },
  },
}
```

- `auto` ควบคุมโหมด auto-TTS เริ่มต้น: `off`, `always`, `inbound` หรือ `tagged` โดย `/tts on|off` สามารถ override local prefs ได้ และ `/tts status` จะแสดงสถานะที่มีผลจริง
- `summaryModel` จะ override `agents.defaults.model.primary` สำหรับ auto-summary
- `modelOverrides` เปิดใช้งานอยู่โดยค่าเริ่มต้น; `modelOverrides.allowProvider` มีค่าเริ่มต้นเป็น `false` (ต้องเปิดใช้เอง)
- API key จะ fallback ไปใช้ `ELEVENLABS_API_KEY`/`XI_API_KEY` และ `OPENAI_API_KEY`
- `openai.baseUrl` ใช้ override endpoint ของ OpenAI TTS โดยลำดับการ resolve คือ config, จากนั้น `OPENAI_TTS_BASE_URL`, แล้วจึง `https://api.openai.com/v1`
- เมื่อ `openai.baseUrl` ชี้ไปยัง endpoint ที่ไม่ใช่ OpenAI, OpenClaw จะถือว่ามันเป็นเซิร์ฟเวอร์ TTS ที่เข้ากันได้กับ OpenAI และจะผ่อนปรนการตรวจสอบ model/voice

---

## Talk

ค่าเริ่มต้นสำหรับโหมด Talk (macOS/iOS/Android)

```json5
{
  talk: {
    provider: "elevenlabs",
    providers: {
      elevenlabs: {
        voiceId: "elevenlabs_voice_id",
        voiceAliases: {
          Clawd: "EXAVITQu4vr4xnSDxMaL",
          Roger: "CwhRBWXzGAHq8TQ4Fs17",
        },
        modelId: "eleven_v3",
        outputFormat: "mp3_44100_128",
        apiKey: "elevenlabs_api_key",
      },
    },
    silenceTimeoutMs: 1500,
    interruptOnSpeech: true,
  },
}
```

- `talk.provider` ต้องตรงกับคีย์ใน `talk.providers` เมื่อมีการกำหนดค่า Talk provider หลายตัว
- คีย์ Talk แบบ flat รุ่นเก่า (`talk.voiceId`, `talk.voiceAliases`, `talk.modelId`, `talk.outputFormat`, `talk.apiKey`) ใช้เพื่อความเข้ากันได้เท่านั้น และจะถูกย้ายอัตโนมัติไปยัง `talk.providers.<provider>`
- Voice ID จะ fallback ไปใช้ `ELEVENLABS_VOICE_ID` หรือ `SAG_VOICE_ID`
- `providers.*.apiKey` รับได้ทั้งสตริงข้อความล้วนหรือออบเจ็กต์ SecretRef
- fallback ของ `ELEVENLABS_API_KEY` จะมีผลเฉพาะเมื่อไม่มีการกำหนดค่า Talk API key
- `providers.*.voiceAliases` ช่วยให้ directive ของ Talk ใช้ชื่อที่เป็นมิตรได้
- `silenceTimeoutMs` ควบคุมว่าโหมด Talk จะรอนานเท่าใดหลังจากผู้ใช้เงียบก่อนส่ง transcript หากไม่ได้ตั้งค่า ระบบจะใช้หน้าต่างหยุดชั่วคราวเริ่มต้นของแพลตฟอร์ม (`700 ms บน macOS และ Android, 900 ms บน iOS`)

---

## ที่เกี่ยวข้อง

- [เอกสารอ้างอิงการกำหนดค่า](/th/gateway/configuration-reference) — คีย์ config อื่น ๆ ทั้งหมด
- [Configuration](/th/gateway/configuration) — งานทั่วไปและการตั้งค่าแบบรวดเร็ว
- [ตัวอย่างการกำหนดค่า](/th/gateway/configuration-examples)
