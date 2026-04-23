---
read_when:
    - คุณต้องการกำหนดค่าผู้ให้บริการ memory search หรือ embedding models
    - คุณต้องการตั้งค่า backend ของ QMD
    - คุณต้องการปรับแต่ง hybrid search, MMR หรือ temporal decay
    - คุณต้องการเปิดใช้การทำดัชนี memory แบบมัลติโหมด
summary: ตัวเลือกการกำหนดค่าทั้งหมดสำหรับ memory search, embedding providers, QMD, hybrid search และการทำดัชนีแบบมัลติโหมด
title: เอกสารอ้างอิงการกำหนดค่า memory
x-i18n:
    generated_at: "2026-04-23T05:55:03Z"
    model: gpt-5.4
    provider: openai
    source_hash: 334c3c4dac08e864487047d3822c75f96e9e7a97c38be4b4e0cd9e63c4489a53
    source_path: reference/memory-config.md
    workflow: 15
---

# เอกสารอ้างอิงการกำหนดค่า memory

หน้านี้แสดงตัวเลือกการกำหนดค่าทั้งหมดสำหรับ memory search ของ OpenClaw สำหรับ
ภาพรวมเชิงแนวคิด ดู:

- [Memory Overview](/th/concepts/memory) -- วิธีการทำงานของ memory
- [Builtin Engine](/th/concepts/memory-builtin) -- backend SQLite ค่าเริ่มต้น
- [QMD Engine](/th/concepts/memory-qmd) -- sidecar แบบ local-first
- [Memory Search](/th/concepts/memory-search) -- ไปป์ไลน์การค้นหาและการปรับแต่ง
- [Active Memory](/th/concepts/active-memory) -- การเปิดใช้ memory sub-agent สำหรับ interactive sessions

การตั้งค่า memory search ทั้งหมดอยู่ภายใต้ `agents.defaults.memorySearch` ใน
`openclaw.json` เว้นแต่จะระบุไว้เป็นอย่างอื่น

หากคุณกำลังมองหาสวิตช์เปิดใช้ **active memory** และ config ของ sub-agent
สิ่งนั้นจะอยู่ภายใต้ `plugins.entries.active-memory` แทน `memorySearch`

active memory ใช้โมเดล two-gate:

1. ต้องเปิดใช้ plugin และกำหนดเป้าหมายไปยัง agent id ปัจจุบัน
2. คำขอต้องเป็น interactive persistent chat session ที่มีสิทธิ์

ดู [Active Memory](/th/concepts/active-memory) สำหรับโมเดลการเปิดใช้งาน,
config ที่ Plugin เป็นเจ้าของ, transcript persistence และรูปแบบการ rollout ที่ปลอดภัย

---

## การเลือกผู้ให้บริการ

| คีย์       | ชนิด      | ค่าเริ่มต้น         | คำอธิบาย                                                                                                    |
| ---------- | --------- | ------------------- | ------------------------------------------------------------------------------------------------------------ |
| `provider` | `string`  | ตรวจพบอัตโนมัติ     | embedding adapter ID: `bedrock`, `gemini`, `github-copilot`, `local`, `mistral`, `ollama`, `openai`, `voyage` |
| `model`    | `string`  | ค่าเริ่มต้นของผู้ให้บริการ | ชื่อ embedding model                                                                                      |
| `fallback` | `string`  | `"none"`            | fallback adapter ID เมื่อ primary ล้มเหลว                                                                    |
| `enabled`  | `boolean` | `true`              | เปิดหรือปิด memory search                                                                                   |

### ลำดับการตรวจจับอัตโนมัติ

เมื่อไม่ได้ตั้ง `provider` ไว้ OpenClaw จะเลือกตัวแรกที่พร้อมใช้งาน:

1. `local` -- หากตั้ง `memorySearch.local.modelPath` และมีไฟล์อยู่จริง
2. `github-copilot` -- หากสามารถ resolve GitHub Copilot token ได้ (env var หรือ auth profile)
3. `openai` -- หากสามารถ resolve OpenAI key ได้
4. `gemini` -- หากสามารถ resolve Gemini key ได้
5. `voyage` -- หากสามารถ resolve Voyage key ได้
6. `mistral` -- หากสามารถ resolve Mistral key ได้
7. `bedrock` -- หาก AWS SDK credential chain resolve ได้ (instance role, access keys, profile, SSO, web identity หรือ shared config)

รองรับ `ollama` แต่จะไม่ถูกตรวจจับอัตโนมัติ (ต้องตั้งค่าอย่างชัดเจน)

### การ resolve API key

remote embeddings ต้องใช้ API key ส่วน Bedrock ใช้ AWS SDK default
credential chain แทน (instance roles, SSO, access keys)

| ผู้ให้บริการ     | Env var                                            | Config key                        |
| ---------------- | -------------------------------------------------- | --------------------------------- |
| Bedrock          | AWS credential chain                               | ไม่ต้องใช้ API key                |
| Gemini           | `GEMINI_API_KEY`                                   | `models.providers.google.apiKey`  |
| GitHub Copilot   | `COPILOT_GITHUB_TOKEN`, `GH_TOKEN`, `GITHUB_TOKEN` | Auth profile ผ่าน device login    |
| Mistral          | `MISTRAL_API_KEY`                                  | `models.providers.mistral.apiKey` |
| Ollama           | `OLLAMA_API_KEY` (placeholder)                     | --                                |
| OpenAI           | `OPENAI_API_KEY`                                   | `models.providers.openai.apiKey`  |
| Voyage           | `VOYAGE_API_KEY`                                   | `models.providers.voyage.apiKey`  |

Codex OAuth ครอบคลุมเฉพาะ chat/completions เท่านั้น และไม่เพียงพอสำหรับคำขอ embedding

---

## การกำหนดค่า remote endpoint

สำหรับ custom OpenAI-compatible endpoints หรือการ override ค่าเริ่มต้นของผู้ให้บริการ:

| คีย์             | ชนิด     | คำอธิบาย                                      |
| ---------------- | -------- | --------------------------------------------- |
| `remote.baseUrl` | `string` | custom API base URL                           |
| `remote.apiKey`  | `string` | override API key                              |
| `remote.headers` | `object` | HTTP headers เพิ่มเติม (merge กับค่าเริ่มต้นของผู้ให้บริการ) |

```json5
{
  agents: {
    defaults: {
      memorySearch: {
        provider: "openai",
        model: "text-embedding-3-small",
        remote: {
          baseUrl: "https://api.example.com/v1/",
          apiKey: "YOUR_KEY",
        },
      },
    },
  },
}
```

---

## การกำหนดค่าเฉพาะ Gemini

| คีย์                   | ชนิด     | ค่าเริ่มต้น           | คำอธิบาย                                  |
| ---------------------- | -------- | --------------------- | ----------------------------------------- |
| `model`                | `string` | `gemini-embedding-001` | รองรับ `gemini-embedding-2-preview` ด้วย |
| `outputDimensionality` | `number` | `3072`                | สำหรับ Embedding 2: 768, 1536 หรือ 3072  |

<Warning>
การเปลี่ยน `model` หรือ `outputDimensionality` จะทริกเกอร์ full reindex โดยอัตโนมัติ
</Warning>

---

## การกำหนดค่า Bedrock embedding

Bedrock ใช้ AWS SDK default credential chain -- ไม่ต้องใช้ API keys
หาก OpenClaw รันอยู่บน EC2 พร้อม instance role ที่เปิดใช้ Bedrock ก็เพียงตั้ง
provider และ model:

```json5
{
  agents: {
    defaults: {
      memorySearch: {
        provider: "bedrock",
        model: "amazon.titan-embed-text-v2:0",
      },
    },
  },
}
```

| คีย์                   | ชนิด     | ค่าเริ่มต้น                   | คำอธิบาย                    |
| ---------------------- | -------- | ----------------------------- | --------------------------- |
| `model`                | `string` | `amazon.titan-embed-text-v2:0` | Bedrock embedding model ID ใดก็ได้ |
| `outputDimensionality` | `number` | ค่าเริ่มต้นของโมเดล          | สำหรับ Titan V2: 256, 512 หรือ 1024 |

### โมเดลที่รองรับ

รองรับโมเดลดังต่อไปนี้ (พร้อม family detection และ dimension
defaults):

| Model ID                                   | Provider   | Dims เริ่มต้น | Dims ที่กำหนดได้       |
| ------------------------------------------ | ---------- | ------------- | ---------------------- |
| `amazon.titan-embed-text-v2:0`             | Amazon     | 1024          | 256, 512, 1024         |
| `amazon.titan-embed-text-v1`               | Amazon     | 1536          | --                     |
| `amazon.titan-embed-g1-text-02`            | Amazon     | 1536          | --                     |
| `amazon.titan-embed-image-v1`              | Amazon     | 1024          | --                     |
| `amazon.nova-2-multimodal-embeddings-v1:0` | Amazon     | 1024          | 256, 384, 1024, 3072   |
| `cohere.embed-english-v3`                  | Cohere     | 1024          | --                     |
| `cohere.embed-multilingual-v3`             | Cohere     | 1024          | --                     |
| `cohere.embed-v4:0`                        | Cohere     | 1536          | 256-1536               |
| `twelvelabs.marengo-embed-3-0-v1:0`        | TwelveLabs | 512           | --                     |
| `twelvelabs.marengo-embed-2-7-v1:0`        | TwelveLabs | 1024          | --                     |

variants ที่มี throughput suffix (เช่น `amazon.titan-embed-text-v1:2:8k`) จะสืบทอด
การกำหนดค่าของโมเดลฐาน

### การยืนยันตัวตน

Bedrock auth ใช้ลำดับการ resolve ข้อมูลรับรองมาตรฐานของ AWS SDK:

1. Environment variables (`AWS_ACCESS_KEY_ID` + `AWS_SECRET_ACCESS_KEY`)
2. SSO token cache
3. Web identity token credentials
4. Shared credentials และ config files
5. ECS หรือ EC2 metadata credentials

Region จะถูก resolve จาก `AWS_REGION`, `AWS_DEFAULT_REGION`, `baseUrl`
ของผู้ให้บริการ `amazon-bedrock` หรือใช้ค่าเริ่มต้นเป็น `us-east-1`

### IAM permissions

IAM role หรือ user ต้องมี:

```json
{
  "Effect": "Allow",
  "Action": "bedrock:InvokeModel",
  "Resource": "*"
}
```

หากต้องการ least-privilege ให้จำกัด `InvokeModel` ไปยังโมเดลที่ต้องการ:

```
arn:aws:bedrock:*::foundation-model/amazon.titan-embed-text-v2:0
```

---

## การกำหนดค่า local embedding

| คีย์                  | ชนิด     | ค่าเริ่มต้น             | คำอธิบาย                   |
| --------------------- | -------- | ----------------------- | -------------------------- |
| `local.modelPath`     | `string` | ดาวน์โหลดอัตโนมัติ      | พาธไปยังไฟล์ GGUF model    |
| `local.modelCacheDir` | `string` | ค่าเริ่มต้นของ node-llama-cpp | cache dir สำหรับโมเดลที่ดาวน์โหลด |

โมเดลเริ่มต้น: `embeddinggemma-300m-qat-Q8_0.gguf` (~0.6 GB, ดาวน์โหลดอัตโนมัติ)
ต้องใช้ native build: `pnpm approve-builds` แล้ว `pnpm rebuild node-llama-cpp`

---

## การกำหนดค่า hybrid search

ทั้งหมดอยู่ภายใต้ `memorySearch.query.hybrid`:

| คีย์                  | ชนิด      | ค่าเริ่มต้น | คำอธิบาย                          |
| --------------------- | --------- | ----------- | --------------------------------- |
| `enabled`             | `boolean` | `true`      | เปิดใช้ hybrid BM25 + vector search |
| `vectorWeight`        | `number`  | `0.7`       | น้ำหนักสำหรับคะแนน vector (0-1)  |
| `textWeight`          | `number`  | `0.3`       | น้ำหนักสำหรับคะแนน BM25 (0-1)    |
| `candidateMultiplier` | `number`  | `4`         | ตัวคูณขนาด candidate pool         |

### MMR (ความหลากหลาย)

| คีย์          | ชนิด      | ค่าเริ่มต้น | คำอธิบาย                             |
| ------------- | --------- | ----------- | ------------------------------------ |
| `mmr.enabled` | `boolean` | `false`     | เปิดใช้การ re-rank แบบ MMR           |
| `mmr.lambda`  | `number`  | `0.7`       | 0 = ความหลากหลายสูงสุด, 1 = ความเกี่ยวข้องสูงสุด |

### Temporal decay (ความใหม่)

| คีย์                         | ชนิด      | ค่าเริ่มต้น | คำอธิบาย                   |
| --------------------------- | --------- | ----------- | -------------------------- |
| `temporalDecay.enabled`     | `boolean` | `false`     | เปิดใช้ recency boost      |
| `temporalDecay.halfLifeDays` | `number` | `30`        | คะแนนจะลดลงครึ่งหนึ่งทุก N วัน |

ไฟล์ Evergreen (`MEMORY.md`, ไฟล์ที่ไม่ลงวันที่ใน `memory/`) จะไม่ถูก decay

### ตัวอย่างแบบเต็ม

```json5
{
  agents: {
    defaults: {
      memorySearch: {
        query: {
          hybrid: {
            vectorWeight: 0.7,
            textWeight: 0.3,
            mmr: { enabled: true, lambda: 0.7 },
            temporalDecay: { enabled: true, halfLifeDays: 30 },
          },
        },
      },
    },
  },
}
```

---

## พาธหน่วยความจำเพิ่มเติม

| คีย์        | ชนิด       | คำอธิบาย                              |
| ----------- | ---------- | ------------------------------------- |
| `extraPaths` | `string[]` | ไดเรกทอรีหรือไฟล์เพิ่มเติมที่จะทำดัชนี |

```json5
{
  agents: {
    defaults: {
      memorySearch: {
        extraPaths: ["../team-docs", "/srv/shared-notes"],
      },
    },
  },
}
```

พาธสามารถเป็นแบบ absolute หรืออิงกับ workspace ได้ ไดเรกทอรีจะถูกสแกน
แบบ recursive สำหรับไฟล์ `.md` การจัดการ symlink ขึ้นอยู่กับ backend
ที่ใช้งานอยู่: builtin engine จะละเลย symlinks ส่วน QMD จะตามพฤติกรรม
ของ QMD scanner ที่อยู่ข้างใต้

สำหรับการค้นหา transcript ข้ามเอเจนต์แบบกำหนดขอบเขตตาม agent ให้ใช้
`agents.list[].memorySearch.qmd.extraCollections` แทน `memory.qmd.paths`
extra collections เหล่านั้นใช้รูปแบบ `{ path, name, pattern? }` เดียวกัน แต่
จะถูกรวมเป็นรายเอเจนต์ และสามารถคงชื่อที่แชร์ไว้แบบ explicit เมื่อพาธชี้ออกนอก workspace ปัจจุบัน
หาก resolved path เดียวกันปรากฏทั้งใน `memory.qmd.paths` และ
`memorySearch.qmd.extraCollections` QMD จะเก็บ entry แรกไว้และข้ามตัวซ้ำ

---

## Multimodal memory (Gemini)

ทำดัชนีรูปภาพและเสียงร่วมกับ Markdown โดยใช้ Gemini Embedding 2:

| คีย์                      | ชนิด       | ค่าเริ่มต้น | คำอธิบาย                                  |
| ------------------------ | ---------- | ----------- | ----------------------------------------- |
| `multimodal.enabled`     | `boolean`  | `false`     | เปิดใช้การทำดัชนีแบบมัลติโหมด            |
| `multimodal.modalities`  | `string[]` | --          | `["image"]`, `["audio"]` หรือ `["all"]`   |
| `multimodal.maxFileBytes` | `number`  | `10000000`  | ขนาดไฟล์สูงสุดสำหรับการทำดัชนี           |

มีผลเฉพาะกับไฟล์ใน `extraPaths` เท่านั้น รากหน่วยความจำค่าเริ่มต้นยังคงเป็น Markdown-only
ต้องใช้ `gemini-embedding-2-preview` และ `fallback` ต้องเป็น `"none"`

รูปแบบที่รองรับ: `.jpg`, `.jpeg`, `.png`, `.webp`, `.gif`, `.heic`, `.heif`
(รูปภาพ); `.mp3`, `.wav`, `.ogg`, `.opus`, `.m4a`, `.aac`, `.flac` (เสียง)

---

## Embedding cache

| คีย์               | ชนิด      | ค่าเริ่มต้น | คำอธิบาย                           |
| ------------------ | --------- | ----------- | ---------------------------------- |
| `cache.enabled`    | `boolean` | `false`     | แคช chunk embeddings ใน SQLite     |
| `cache.maxEntries` | `number`  | `50000`     | จำนวน cached embeddings สูงสุด     |

ช่วยป้องกันการทำ embedding ซ้ำกับข้อความที่ไม่เปลี่ยนระหว่าง reindex หรือ transcript updates

---

## Batch indexing

| คีย์                          | ชนิด      | ค่าเริ่มต้น | คำอธิบาย                    |
| ---------------------------- | --------- | ----------- | --------------------------- |
| `remote.batch.enabled`       | `boolean` | `false`     | เปิดใช้ batch embedding API |
| `remote.batch.concurrency`   | `number`  | `2`         | batch jobs ที่ทำงานขนานกัน |
| `remote.batch.wait`          | `boolean` | `true`      | รอให้ batch เสร็จสมบูรณ์   |
| `remote.batch.pollIntervalMs` | `number` | --          | ช่วงเวลา polling            |
| `remote.batch.timeoutMinutes` | `number` | --          | timeout ของ batch          |

ใช้ได้กับ `openai`, `gemini` และ `voyage` โดยทั่วไป OpenAI batch
เร็วที่สุดและถูกที่สุดสำหรับ backfills ขนาดใหญ่

---

## Session memory search (ทดลอง)

ทำดัชนี session transcripts และแสดงผ่าน `memory_search`:

| คีย์                          | ชนิด       | ค่าเริ่มต้น    | คำอธิบาย                               |
| ---------------------------- | ---------- | -------------- | -------------------------------------- |
| `experimental.sessionMemory` | `boolean`  | `false`        | เปิดใช้การทำดัชนีของเซสชัน             |
| `sources`                    | `string[]` | `["memory"]`   | เพิ่ม `"sessions"` เพื่อรวม transcripts |
| `sync.sessions.deltaBytes`   | `number`   | `100000`       | เกณฑ์จำนวนไบต์สำหรับ reindex           |
| `sync.sessions.deltaMessages` | `number`  | `50`           | เกณฑ์จำนวนข้อความสำหรับ reindex        |

การทำดัชนีเซสชันเป็นแบบ opt-in และทำงานแบบอะซิงโครนัส ผลลัพธ์อาจ
ล้าหลังเล็กน้อย session logs อยู่บนดิสก์ ดังนั้นให้ถือว่าการเข้าถึงระบบไฟล์คือขอบเขตความเชื่อถือ

---

## SQLite vector acceleration (sqlite-vec)

| คีย์                         | ชนิด      | ค่าเริ่มต้น | คำอธิบาย                            |
| --------------------------- | --------- | ----------- | ----------------------------------- |
| `store.vector.enabled`      | `boolean` | `true`      | ใช้ sqlite-vec สำหรับ vector queries |
| `store.vector.extensionPath` | `string` | bundled     | override พาธของ sqlite-vec         |

เมื่อ sqlite-vec ใช้งานไม่ได้ OpenClaw จะ fallback ไปใช้ in-process cosine
similarity โดยอัตโนมัติ

---

## ที่เก็บดัชนี

| คีย์                  | ชนิด     | ค่าเริ่มต้น                            | คำอธิบาย                                        |
| --------------------- | -------- | -------------------------------------- | ------------------------------------------------ |
| `store.path`          | `string` | `~/.openclaw/memory/{agentId}.sqlite`  | ตำแหน่งของดัชนี (รองรับโทเค็น `{agentId}`)     |
| `store.fts.tokenizer` | `string` | `unicode61`                            | FTS5 tokenizer (`unicode61` หรือ `trigram`)     |

---

## การกำหนดค่า QMD backend

ตั้ง `memory.backend = "qmd"` เพื่อเปิดใช้งาน การตั้งค่า QMD ทั้งหมดอยู่ภายใต้
`memory.qmd`:

| คีย์                     | ชนิด      | ค่าเริ่มต้น | คำอธิบาย                                        |
| ----------------------- | --------- | ----------- | ----------------------------------------------- |
| `command`               | `string`  | `qmd`       | พาธ executable ของ QMD                          |
| `searchMode`            | `string`  | `search`    | คำสั่งค้นหา: `search`, `vsearch`, `query`      |
| `includeDefaultMemory`  | `boolean` | `true`      | ทำดัชนี `MEMORY.md` + `memory/**/*.md` อัตโนมัติ |
| `paths[]`               | `array`   | --          | พาธเพิ่มเติม: `{ name, path, pattern? }`       |
| `sessions.enabled`      | `boolean` | `false`     | ทำดัชนี session transcripts                     |
| `sessions.retentionDays` | `number` | --          | ระยะเวลาเก็บรักษา transcript                   |
| `sessions.exportDir`    | `string`  | --          | ไดเรกทอรีสำหรับ export                          |

OpenClaw จะให้ความสำคัญกับ shapes ของ QMD collection และ MCP query
ปัจจุบัน แต่ยังทำให้ QMD รุ่นเก่าทำงานได้โดย fallback ไปใช้ legacy `--mask` collection flags
และชื่อ MCP tools แบบเก่าเมื่อจำเป็น

QMD model overrides ยังคงอยู่ฝั่ง QMD ไม่ได้อยู่ใน config ของ OpenClaw หากคุณต้องการ
override โมเดลของ QMD แบบ global ให้ตั้ง environment variables เช่น
`QMD_EMBED_MODEL`, `QMD_RERANK_MODEL` และ `QMD_GENERATE_MODEL` ในสภาพแวดล้อมรันไทม์ของ gateway

### ตารางอัปเดต

| คีย์                      | ชนิด      | ค่าเริ่มต้น | คำอธิบาย                               |
| ------------------------ | --------- | ----------- | -------------------------------------- |
| `update.interval`        | `string`  | `5m`        | ช่วงเวลารีเฟรช                         |
| `update.debounceMs`      | `number`  | `15000`     | debounce สำหรับการเปลี่ยนแปลงไฟล์     |
| `update.onBoot`          | `boolean` | `true`      | รีเฟรชเมื่อเริ่มต้น                    |
| `update.waitForBootSync` | `boolean` | `false`     | บล็อก startup จนกว่าจะรีเฟรชเสร็จ     |
| `update.embedInterval`   | `string`  | --          | cadence แยกสำหรับ embed               |
| `update.commandTimeoutMs` | `number` | --          | timeout สำหรับคำสั่ง QMD               |
| `update.updateTimeoutMs` | `number`  | --          | timeout สำหรับการอัปเดตของ QMD        |
| `update.embedTimeoutMs`  | `number`  | --          | timeout สำหรับการ embed ของ QMD       |

### ขีดจำกัด

| คีย์                      | ชนิด     | ค่าเริ่มต้น | คำอธิบาย                    |
| ------------------------ | -------- | ----------- | --------------------------- |
| `limits.maxResults`      | `number` | `6`         | จำนวนผลการค้นหาสูงสุด       |
| `limits.maxSnippetChars` | `number` | --          | จำกัดความยาว snippet        |
| `limits.maxInjectedChars` | `number` | --         | จำกัดจำนวนอักขระที่ inject ทั้งหมด |
| `limits.timeoutMs`       | `number` | `4000`      | timeout ของการค้นหา         |

### ขอบเขต

ควบคุมว่าเซสชันใดบ้างที่สามารถรับผลการค้นหาจาก QMD ได้ ใช้ schema เดียวกับ
[`session.sendPolicy`](/th/gateway/configuration-reference#session):

```json5
{
  memory: {
    qmd: {
      scope: {
        default: "deny",
        rules: [{ action: "allow", match: { chatType: "direct" } }],
      },
    },
  },
}
```

ค่าเริ่มต้นที่จัดส่งมาจะอนุญาต direct และ channel sessions ขณะเดียวกันยังคงปฏิเสธ
groups

ค่าเริ่มต้นคือ DM-only `match.keyPrefix` จะจับคู่กับ normalized session key;
`match.rawKeyPrefix` จะจับคู่กับคีย์ดิบรวม `agent:<id>:` ด้วย

### Citations

`memory.citations` ใช้กับทุก backend:

| ค่า              | พฤติกรรม                                            |
| ---------------- | --------------------------------------------------- |
| `auto` (ค่าเริ่มต้น) | รวม footer `Source: <path#line>` ใน snippets      |
| `on`             | รวม footer เสมอ                                     |
| `off`            | ละ footer (พาธยังคงถูกส่งให้เอเจนต์ภายใน)         |

### ตัวอย่าง QMD แบบเต็ม

```json5
{
  memory: {
    backend: "qmd",
    citations: "auto",
    qmd: {
      includeDefaultMemory: true,
      update: { interval: "5m", debounceMs: 15000 },
      limits: { maxResults: 6, timeoutMs: 4000 },
      scope: {
        default: "deny",
        rules: [{ action: "allow", match: { chatType: "direct" } }],
      },
      paths: [{ name: "docs", path: "~/notes", pattern: "**/*.md" }],
    },
  },
}
```

---

## Dreaming

Dreaming ถูกกำหนดค่าภายใต้ `plugins.entries.memory-core.config.dreaming`
ไม่ใช่ภายใต้ `agents.defaults.memorySearch`

Dreaming ทำงานเป็น scheduled sweep เดียว และใช้ phases แบบ light/deep/REM ภายใน
เป็นรายละเอียดระดับ implementation

สำหรับพฤติกรรมเชิงแนวคิดและ slash commands ดู [Dreaming](/th/concepts/dreaming)

### การตั้งค่าของผู้ใช้

| คีย์        | ชนิด      | ค่าเริ่มต้น  | คำอธิบาย                                     |
| ----------- | --------- | ------------ | -------------------------------------------- |
| `enabled`   | `boolean` | `false`      | เปิดหรือปิด Dreaming ทั้งหมด                |
| `frequency` | `string`  | `0 3 * * *`  | Cron cadence แบบเลือกได้สำหรับ dreaming sweep ทั้งหมด |

### ตัวอย่าง

```json5
{
  plugins: {
    entries: {
      "memory-core": {
        config: {
          dreaming: {
            enabled: true,
            frequency: "0 3 * * *",
          },
        },
      },
    },
  },
}
```

หมายเหตุ:

- Dreaming จะเขียนสถานะของเครื่องไปที่ `memory/.dreams/`
- Dreaming จะเขียนเอาต์พุตเชิงบรรยายแบบอ่านได้โดยมนุษย์ไปที่ `DREAMS.md` (หรือ `dreams.md` ที่มีอยู่)
- นโยบายและเกณฑ์ของ phases แบบ light/deep/REM เป็นพฤติกรรมภายใน ไม่ใช่ config สำหรับผู้ใช้
