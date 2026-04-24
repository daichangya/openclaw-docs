---
read_when:
    - คุณต้องการกำหนดค่า providers สำหรับการค้นหา memory หรือโมเดล embeddings
    - คุณต้องการตั้งค่าแบ็กเอนด์ QMD
    - คุณต้องการปรับแต่ง hybrid search, MMR หรือการลดน้ำหนักตามเวลา
    - คุณต้องการเปิดใช้การทำดัชนี memory แบบหลายรูปแบบ
summary: ตัวเลือกการตั้งค่าทั้งหมดสำหรับการค้นหา memory, embedding providers, QMD, hybrid search และการทำดัชนีหลายรูปแบบ
title: เอกสารอ้างอิงการตั้งค่า memory
x-i18n:
    generated_at: "2026-04-24T09:31:29Z"
    model: gpt-5.4
    provider: openai
    source_hash: b9152d6cdf3959319c2ba000fae06c72b27b9b8c90ee08ce57b80d1c0670f850
    source_path: reference/memory-config.md
    workflow: 15
---

หน้านี้แสดงตัวเลือกการตั้งค่าทั้งหมดสำหรับการค้นหา memory ของ OpenClaw สำหรับ
ภาพรวมเชิงแนวคิด โปรดดู:

- [ภาพรวม Memory](/th/concepts/memory) -- memory ทำงานอย่างไร
- [Builtin Engine](/th/concepts/memory-builtin) -- แบ็กเอนด์ SQLite เริ่มต้น
- [QMD Engine](/th/concepts/memory-qmd) -- sidecar ที่เน้น local-first
- [Memory Search](/th/concepts/memory-search) -- ไปป์ไลน์การค้นหาและการปรับแต่ง
- [Active Memory](/th/concepts/active-memory) -- การเปิดใช้ sub-agent ของ memory สำหรับเซสชันแบบโต้ตอบ

การตั้งค่าการค้นหา memory ทั้งหมดอยู่ภายใต้ `agents.defaults.memorySearch` ใน
`openclaw.json` เว้นแต่จะระบุไว้เป็นอย่างอื่น

หากคุณกำลังมองหาปุ่มเปิดใช้ฟีเจอร์ **active memory** และ config ของ sub-agent
สิ่งนั้นอยู่ภายใต้ `plugins.entries.active-memory` แทน `memorySearch`

Active Memory ใช้โมเดลสองเกต:

1. ต้องเปิดใช้งาน plugin และกำหนดเป้าหมายไปยัง agent id ปัจจุบัน
2. คำขอต้องเป็นเซสชันแชตแบบโต้ตอบที่มี persistence และเข้าเกณฑ์

ดู [Active Memory](/th/concepts/active-memory) สำหรับโมเดลการเปิดใช้งาน
config ที่ plugin เป็นเจ้าของ การเก็บ transcript แบบถาวร และรูปแบบการเปิดใช้ที่ปลอดภัย

---

## การเลือก provider

| คีย์        | ชนิด      | ค่าเริ่มต้น      | คำอธิบาย                                                                                                 |
| ----------- | --------- | ---------------- | --------------------------------------------------------------------------------------------------------- |
| `provider`  | `string`  | ตรวจจับอัตโนมัติ | embedding adapter ID: `bedrock`, `gemini`, `github-copilot`, `local`, `mistral`, `ollama`, `openai`, `voyage` |
| `model`     | `string`  | ค่าเริ่มต้นของ provider | ชื่อโมเดล embeddings                                                                                 |
| `fallback`  | `string`  | `"none"`         | fallback adapter ID เมื่อ primary ล้มเหลว                                                                |
| `enabled`   | `boolean` | `true`           | เปิดหรือปิดการค้นหา memory                                                                               |

### ลำดับการตรวจจับอัตโนมัติ

เมื่อไม่ได้ตั้งค่า `provider` OpenClaw จะเลือกตัวแรกที่พร้อมใช้งาน:

1. `local` -- หากกำหนดค่า `memorySearch.local.modelPath` และไฟล์มีอยู่
2. `github-copilot` -- หากสามารถ resolve โทเค็น GitHub Copilot ได้ (env var หรือ auth profile)
3. `openai` -- หากสามารถ resolve คีย์ OpenAI ได้
4. `gemini` -- หากสามารถ resolve คีย์ Gemini ได้
5. `voyage` -- หากสามารถ resolve คีย์ Voyage ได้
6. `mistral` -- หากสามารถ resolve คีย์ Mistral ได้
7. `bedrock` -- หาก AWS SDK credential chain resolve ได้ (instance role, access keys, profile, SSO, web identity หรือ shared config)

รองรับ `ollama` แต่จะไม่ตรวจจับอัตโนมัติ (ให้ตั้งค่าเองอย่างชัดเจน)

### การ resolve คีย์ API

embeddings แบบ remote ต้องใช้คีย์ API ส่วน Bedrock ใช้ AWS SDK default
credential chain แทน (instance roles, SSO, access keys)

| Provider       | Env var                                            | คีย์ config                       |
| -------------- | -------------------------------------------------- | --------------------------------- |
| Bedrock        | AWS credential chain                               | ไม่ต้องใช้คีย์ API                |
| Gemini         | `GEMINI_API_KEY`                                   | `models.providers.google.apiKey`  |
| GitHub Copilot | `COPILOT_GITHUB_TOKEN`, `GH_TOKEN`, `GITHUB_TOKEN` | Auth profile ผ่าน device login    |
| Mistral        | `MISTRAL_API_KEY`                                  | `models.providers.mistral.apiKey` |
| Ollama         | `OLLAMA_API_KEY` (ตัวแทนชั่วคราว)                 | --                                |
| OpenAI         | `OPENAI_API_KEY`                                   | `models.providers.openai.apiKey`  |
| Voyage         | `VOYAGE_API_KEY`                                   | `models.providers.voyage.apiKey`  |

Codex OAuth ครอบคลุมเฉพาะ chat/completions เท่านั้น และไม่รองรับคำขอ
embeddings

---

## config ของ endpoint แบบ remote

สำหรับ endpoints แบบเข้ากันได้กับ OpenAI ที่กำหนดเอง หรือการ override ค่าเริ่มต้นของ provider:

| คีย์               | ชนิด     | คำอธิบาย                                    |
| ------------------ | -------- | ------------------------------------------- |
| `remote.baseUrl`   | `string` | API base URL แบบกำหนดเอง                    |
| `remote.apiKey`    | `string` | override คีย์ API                            |
| `remote.headers`   | `object` | HTTP headers เพิ่มเติม (รวมกับค่าเริ่มต้นของ provider) |

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

## config เฉพาะของ Gemini

| คีย์                   | ชนิด     | ค่าเริ่มต้น             | คำอธิบาย                                 |
| ---------------------- | -------- | ----------------------- | ---------------------------------------- |
| `model`                | `string` | `gemini-embedding-001`  | รองรับ `gemini-embedding-2-preview` ด้วย  |
| `outputDimensionality` | `number` | `3072`                  | สำหรับ Embedding 2: 768, 1536 หรือ 3072  |

<Warning>
การเปลี่ยนโมเดลหรือ `outputDimensionality` จะทำให้เกิดการทำดัชนีใหม่ทั้งชุดโดยอัตโนมัติ
</Warning>

---

## config embeddings ของ Bedrock

Bedrock ใช้ AWS SDK default credential chain -- ไม่ต้องใช้คีย์ API
หาก OpenClaw ทำงานบน EC2 พร้อม instance role ที่เปิดใช้ Bedrock อยู่ ให้เพียงตั้งค่า
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

| คีย์                   | ชนิด     | ค่าเริ่มต้น                   | คำอธิบาย                          |
| ---------------------- | -------- | ----------------------------- | --------------------------------- |
| `model`                | `string` | `amazon.titan-embed-text-v2:0` | Bedrock embedding model ID ใดก็ได้ |
| `outputDimensionality` | `number` | ค่าเริ่มต้นของโมเดล           | สำหรับ Titan V2: 256, 512 หรือ 1024 |

### โมเดลที่รองรับ

รองรับโมเดลดังต่อไปนี้ (พร้อมการตรวจจับ family และค่าเริ่มต้นของมิติ):

| Model ID                                   | Provider   | มิติเริ่มต้น | มิติที่กำหนดค่าได้   |
| ------------------------------------------ | ---------- | ------------ | -------------------- |
| `amazon.titan-embed-text-v2:0`             | Amazon     | 1024         | 256, 512, 1024       |
| `amazon.titan-embed-text-v1`               | Amazon     | 1536         | --                   |
| `amazon.titan-embed-g1-text-02`            | Amazon     | 1536         | --                   |
| `amazon.titan-embed-image-v1`              | Amazon     | 1024         | --                   |
| `amazon.nova-2-multimodal-embeddings-v1:0` | Amazon     | 1024         | 256, 384, 1024, 3072 |
| `cohere.embed-english-v3`                  | Cohere     | 1024         | --                   |
| `cohere.embed-multilingual-v3`             | Cohere     | 1024         | --                   |
| `cohere.embed-v4:0`                        | Cohere     | 1536         | 256-1536             |
| `twelvelabs.marengo-embed-3-0-v1:0`        | TwelveLabs | 512          | --                   |
| `twelvelabs.marengo-embed-2-7-v1:0`        | TwelveLabs | 1024         | --                   |

ตัวแปรที่มี suffix ด้าน throughput (เช่น `amazon.titan-embed-text-v1:2:8k`) จะสืบทอด
config ของโมเดลฐาน

### การยืนยันตัวตน

การยืนยันตัวตนของ Bedrock ใช้ลำดับการ resolve credentials มาตรฐานของ AWS SDK:

1. ตัวแปรสภาพแวดล้อม (`AWS_ACCESS_KEY_ID` + `AWS_SECRET_ACCESS_KEY`)
2. SSO token cache
3. Web identity token credentials
4. ไฟล์ shared credentials และ config
5. ECS หรือ EC2 metadata credentials

Region จะถูก resolve จาก `AWS_REGION`, `AWS_DEFAULT_REGION`, `baseUrl` ของ provider
`amazon-bedrock` หรือจะใช้ค่าเริ่มต้นเป็น `us-east-1`

### สิทธิ์ IAM

IAM role หรือผู้ใช้ต้องมี:

```json
{
  "Effect": "Allow",
  "Action": "bedrock:InvokeModel",
  "Resource": "*"
}
```

สำหรับ least-privilege ให้จำกัด `InvokeModel` ไปยังโมเดลที่ต้องการ:

```
arn:aws:bedrock:*::foundation-model/amazon.titan-embed-text-v2:0
```

---

## config embeddings แบบ local

| คีย์                  | ชนิด               | ค่าเริ่มต้น            | คำอธิบาย                                                                                                                                                                                                                                                                                                  |
| --------------------- | ------------------ | ---------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `local.modelPath`     | `string`           | ดาวน์โหลดอัตโนมัติ     | พาธไปยังไฟล์โมเดล GGUF                                                                                                                                                                                                                                                                                     |
| `local.modelCacheDir` | `string`           | ค่าเริ่มต้นของ node-llama-cpp | ไดเรกทอรีแคชสำหรับโมเดลที่ดาวน์โหลด                                                                                                                                                                                                                                                                |
| `local.contextSize`   | `number \| "auto"` | `4096`                 | ขนาด context window สำหรับ embedding context ค่า 4096 ครอบคลุม chunks ทั่วไป (128–512 tokens) ขณะเดียวกันก็จำกัด VRAM ที่ไม่ใช่น้ำหนักโมเดล ลดลงเหลือ 1024–2048 ได้บนโฮสต์ที่มีข้อจำกัด `"auto"` จะใช้ค่าสูงสุดที่โมเดลถูกฝึกมา — ไม่แนะนำสำหรับโมเดล 8B+ (Qwen3-Embedding-8B: 40 960 tokens → VRAM ~32 GB เทียบกับ ~8.8 GB ที่ 4096) |

โมเดลเริ่มต้น: `embeddinggemma-300m-qat-Q8_0.gguf` (~0.6 GB, ดาวน์โหลดอัตโนมัติ)
ต้องมี native build: `pnpm approve-builds` จากนั้น `pnpm rebuild node-llama-cpp`

ใช้ CLI แบบสแตนด์อโลนเพื่อตรวจสอบเส้นทาง provider เดียวกับที่ Gateway ใช้:

```bash
openclaw memory status --deep --agent main
openclaw memory index --force --agent main
```

หาก `provider` เป็น `auto` จะเลือก `local` ก็ต่อเมื่อ `local.modelPath`
ชี้ไปยังไฟล์ในเครื่องที่มีอยู่เท่านั้น ยังสามารถใช้การอ้างอิงโมเดลแบบ `hf:` และ HTTP(S)
ได้อย่างชัดเจนกับ `provider: "local"` แต่จะไม่ทำให้ `auto`
เลือก local ก่อนที่โมเดลจะพร้อมใช้งานบนดิสก์

---

## config ของ hybrid search

ทั้งหมดอยู่ภายใต้ `memorySearch.query.hybrid`:

| คีย์                  | ชนิด      | ค่าเริ่มต้น | คำอธิบาย                          |
| --------------------- | --------- | ----------- | --------------------------------- |
| `enabled`             | `boolean` | `true`      | เปิดใช้ hybrid search แบบ BM25 + vector |
| `vectorWeight`        | `number`  | `0.7`       | น้ำหนักของคะแนน vector (0-1)      |
| `textWeight`          | `number`  | `0.3`       | น้ำหนักของคะแนน BM25 (0-1)        |
| `candidateMultiplier` | `number`  | `4`         | ตัวคูณขนาด candidate pool         |

### MMR (ความหลากหลาย)

| คีย์          | ชนิด      | ค่าเริ่มต้น | คำอธิบาย                             |
| ------------- | --------- | ----------- | ------------------------------------ |
| `mmr.enabled` | `boolean` | `false`     | เปิดใช้การจัดอันดับใหม่แบบ MMR      |
| `mmr.lambda`  | `number`  | `0.7`       | 0 = ความหลากหลายสูงสุด, 1 = ความเกี่ยวข้องสูงสุด |

### การลดน้ำหนักตามเวลา (ความใหม่)

| คีย์                         | ชนิด      | ค่าเริ่มต้น | คำอธิบาย                    |
| ---------------------------- | --------- | ----------- | --------------------------- |
| `temporalDecay.enabled`      | `boolean` | `false`     | เปิดใช้การเพิ่มน้ำหนักตามความใหม่ |
| `temporalDecay.halfLifeDays` | `number`  | `30`        | คะแนนจะลดลงครึ่งหนึ่งทุก N วัน |

ไฟล์ถาวร (`MEMORY.md`, ไฟล์ที่ไม่มีวันที่ใน `memory/`) จะไม่ถูกลดน้ำหนักตามเวลา

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

## เส้นทาง memory เพิ่มเติม

| คีย์         | ชนิด       | คำอธิบาย                              |
| ------------ | ---------- | ------------------------------------- |
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

เส้นทางอาจเป็นแบบสัมบูรณ์หรือสัมพันธ์กับ workspace ก็ได้ ไดเรกทอรีจะถูกสแกน
แบบ recursive สำหรับไฟล์ `.md` การจัดการ symlink ขึ้นอยู่กับแบ็กเอนด์ที่ใช้งานอยู่:
builtin engine จะไม่สนใจ symlinks ขณะที่ QMD จะทำตามพฤติกรรมของสแกนเนอร์ QMD
ที่อยู่ด้านล่าง

สำหรับการค้นหา transcript ข้าม agent แบบกำหนดขอบเขตตาม agent ให้ใช้
`agents.list[].memorySearch.qmd.extraCollections` แทน `memory.qmd.paths`
extra collections เหล่านั้นใช้รูปแบบเดียวกัน `{ path, name, pattern? }` แต่
จะถูกรวมตามแต่ละ agent และสามารถคงชื่อที่แชร์แบบชัดเจนไว้ได้เมื่อ path
ชี้ออกนอก workspace ปัจจุบัน
หาก path ที่ resolve แล้วตัวเดียวกันปรากฏทั้งใน `memory.qmd.paths` และ
`memorySearch.qmd.extraCollections` QMD จะเก็บรายการแรกไว้และข้ามรายการซ้ำ

---

## memory แบบหลายรูปแบบ (Gemini)

ทำดัชนีภาพและเสียงควบคู่ไปกับ Markdown โดยใช้ Gemini Embedding 2:

| คีย์                      | ชนิด       | ค่าเริ่มต้น | คำอธิบาย                             |
| ------------------------- | ---------- | ----------- | ------------------------------------ |
| `multimodal.enabled`      | `boolean`  | `false`     | เปิดใช้การทำดัชนีแบบหลายรูปแบบ        |
| `multimodal.modalities`   | `string[]` | --          | `["image"]`, `["audio"]` หรือ `["all"]` |
| `multimodal.maxFileBytes` | `number`   | `10000000`  | ขนาดไฟล์สูงสุดสำหรับการทำดัชนี        |

ใช้กับไฟล์ใน `extraPaths` เท่านั้น ราก memory เริ่มต้นจะยังคงเป็น Markdown อย่างเดียว
ต้องใช้ `gemini-embedding-2-preview` และ `fallback` ต้องเป็น `"none"`

รูปแบบที่รองรับ: `.jpg`, `.jpeg`, `.png`, `.webp`, `.gif`, `.heic`, `.heif`
(ภาพ); `.mp3`, `.wav`, `.ogg`, `.opus`, `.m4a`, `.aac`, `.flac` (เสียง)

---

## แคช embeddings

| คีย์               | ชนิด      | ค่าเริ่มต้น | คำอธิบาย                         |
| ------------------ | --------- | ----------- | -------------------------------- |
| `cache.enabled`    | `boolean` | `false`     | แคช chunk embeddings ใน SQLite   |
| `cache.maxEntries` | `number`  | `50000`     | จำนวน embeddings สูงสุดที่แคชได้ |

ป้องกันการสร้าง embeddings ใหม่ให้กับข้อความที่ไม่เปลี่ยนแปลงระหว่างการทำดัชนีใหม่หรือการอัปเดต transcript

---

## การทำดัชนีแบบเป็นชุด

| คีย์                          | ชนิด      | ค่าเริ่มต้น | คำอธิบาย                  |
| ----------------------------- | --------- | ----------- | ------------------------- |
| `remote.batch.enabled`        | `boolean` | `false`     | เปิดใช้ API embeddings แบบเป็นชุด |
| `remote.batch.concurrency`    | `number`  | `2`         | งานแบบเป็นชุดที่ทำงานขนานกัน |
| `remote.batch.wait`           | `boolean` | `true`      | รอให้ batch เสร็จสมบูรณ์     |
| `remote.batch.pollIntervalMs` | `number`  | --          | ช่วงเวลาในการ poll         |
| `remote.batch.timeoutMinutes` | `number`  | --          | หมดเวลาสำหรับ batch       |

ใช้ได้กับ `openai`, `gemini` และ `voyage` โดยทั่วไป OpenAI batch
จะเร็วที่สุดและถูกที่สุดสำหรับการเติมข้อมูลย้อนหลังจำนวนมาก

---

## การค้นหา memory ของ session (experimental)

ทำดัชนี transcripts ของ session และแสดงผ่าน `memory_search`:

| คีย์                          | ชนิด       | ค่าเริ่มต้น    | คำอธิบาย                                  |
| ----------------------------- | ---------- | -------------- | ----------------------------------------- |
| `experimental.sessionMemory`  | `boolean`  | `false`        | เปิดใช้การทำดัชนี session                 |
| `sources`                     | `string[]` | `["memory"]`   | เพิ่ม `"sessions"` เพื่อรวม transcripts   |
| `sync.sessions.deltaBytes`    | `number`   | `100000`       | เกณฑ์จำนวนไบต์สำหรับการทำดัชนีใหม่        |
| `sync.sessions.deltaMessages` | `number`   | `50`           | เกณฑ์จำนวนข้อความสำหรับการทำดัชนีใหม่      |

การทำดัชนี session เป็นแบบ opt-in และทำงานแบบอะซิงโครนัส ผลลัพธ์อาจ
ไม่ทันสมัยเล็กน้อย logs ของ session อยู่บนดิสก์ ดังนั้นให้ถือว่าการเข้าถึงระบบไฟล์เป็น
ขอบเขตความเชื่อถือ

---

## การเร่ง vector ของ SQLite (sqlite-vec)

| คีย์                         | ชนิด      | ค่าเริ่มต้น | คำอธิบาย                          |
| ---------------------------- | --------- | ----------- | --------------------------------- |
| `store.vector.enabled`       | `boolean` | `true`      | ใช้ sqlite-vec สำหรับคำสั่งค้นหา vector |
| `store.vector.extensionPath` | `string`  | bundled     | override พาธของ sqlite-vec        |

เมื่อ sqlite-vec ใช้งานไม่ได้ OpenClaw จะ fallback ไปใช้ in-process cosine
similarity โดยอัตโนมัติ

---

## ที่เก็บดัชนี

| คีย์                  | ชนิด     | ค่าเริ่มต้น                         | คำอธิบาย                                 |
| --------------------- | -------- | ----------------------------------- | ---------------------------------------- |
| `store.path`          | `string` | `~/.openclaw/memory/{agentId}.sqlite` | ตำแหน่งดัชนี (รองรับโทเค็น `{agentId}`) |
| `store.fts.tokenizer` | `string` | `unicode61`                         | FTS5 tokenizer (`unicode61` หรือ `trigram`) |

---

## config ของแบ็กเอนด์ QMD

ตั้งค่า `memory.backend = "qmd"` เพื่อเปิดใช้งาน การตั้งค่า QMD ทั้งหมดอยู่ภายใต้
`memory.qmd`:

| คีย์                     | ชนิด      | ค่าเริ่มต้น | คำอธิบาย                                   |
| ------------------------ | --------- | ----------- | ------------------------------------------ |
| `command`                | `string`  | `qmd`       | พาธของ executable QMD                      |
| `searchMode`             | `string`  | `search`    | คำสั่งค้นหา: `search`, `vsearch`, `query` |
| `includeDefaultMemory`   | `boolean` | `true`      | ทำดัชนี `MEMORY.md` + `memory/**/*.md` อัตโนมัติ |
| `paths[]`                | `array`   | --          | เส้นทางเพิ่มเติม: `{ name, path, pattern? }` |
| `sessions.enabled`       | `boolean` | `false`     | ทำดัชนี transcripts ของ session             |
| `sessions.retentionDays` | `number`  | --          | ระยะเวลาการเก็บ transcripts                |
| `sessions.exportDir`     | `string`  | --          | ไดเรกทอรีสำหรับส่งออก                      |

OpenClaw จะเลือกใช้รูปแบบ collection และ query ของ QMD และ MCP ปัจจุบันก่อน แต่ยังคงทำให้
QMD รุ่นเก่ายังคงทำงานได้ด้วยการ fallback ไปใช้ flags ของ collection แบบ `--mask`
รุ่นเก่า และชื่อเครื่องมือ MCP แบบเก่าเมื่อจำเป็น

การ override โมเดลของ QMD จะอยู่ฝั่ง QMD ไม่ใช่ config ของ OpenClaw หากคุณต้องการ
override โมเดลของ QMD แบบ global ให้ตั้งค่าตัวแปรสภาพแวดล้อม เช่น
`QMD_EMBED_MODEL`, `QMD_RERANK_MODEL` และ `QMD_GENERATE_MODEL` ใน
สภาพแวดล้อมรันไทม์ของ gateway

### ตารางการอัปเดต

| คีย์                      | ชนิด      | ค่าเริ่มต้น | คำอธิบาย                              |
| ------------------------- | --------- | ----------- | ------------------------------------- |
| `update.interval`         | `string`  | `5m`        | ช่วงเวลาสำหรับรีเฟรช                  |
| `update.debounceMs`       | `number`  | `15000`     | debounce การเปลี่ยนแปลงของไฟล์        |
| `update.onBoot`           | `boolean` | `true`      | รีเฟรชตอนเริ่มต้นระบบ                  |
| `update.waitForBootSync`  | `boolean` | `false`     | บล็อกการเริ่มต้นจนกว่าการรีเฟรชจะเสร็จ |
| `update.embedInterval`    | `string`  | --          | รอบเวลาของ embed แยกต่างหาก           |
| `update.commandTimeoutMs` | `number`  | --          | เวลาหมดเขตสำหรับคำสั่ง QMD            |
| `update.updateTimeoutMs`  | `number`  | --          | เวลาหมดเขตสำหรับการอัปเดตของ QMD      |
| `update.embedTimeoutMs`   | `number`  | --          | เวลาหมดเขตสำหรับการ embed ของ QMD      |

### ข้อจำกัด

| คีย์                      | ชนิด     | ค่าเริ่มต้น | คำอธิบาย                     |
| ------------------------- | -------- | ----------- | ---------------------------- |
| `limits.maxResults`       | `number` | `6`         | จำนวนผลการค้นหาสูงสุด        |
| `limits.maxSnippetChars`  | `number` | --          | จำกัดความยาวของ snippet     |
| `limits.maxInjectedChars` | `number` | --          | จำกัดจำนวนอักขระที่ inject รวม |
| `limits.timeoutMs`        | `number` | `4000`      | เวลาหมดเขตของการค้นหา        |

### ขอบเขต

ควบคุมว่า session ใดสามารถรับผลการค้นหา QMD ได้ ใช้ schema เดียวกับ
[`session.sendPolicy`](/th/gateway/config-agents#session):

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

ค่าเริ่มต้นที่มาพร้อมระบบอนุญาตทั้ง direct และ channel sessions ขณะที่ยังคงปฏิเสธ
groups

ค่าเริ่มต้นคือ DM เท่านั้น `match.keyPrefix` จะจับคู่กับ session key ที่ทำให้เป็นมาตรฐานแล้ว;
`match.rawKeyPrefix` จะจับคู่กับ raw key รวมทั้ง `agent:<id>:`

### การอ้างอิงแหล่งที่มา

`memory.citations` ใช้กับทุกแบ็กเอนด์:

| ค่า              | พฤติกรรม                                           |
| ---------------- | -------------------------------------------------- |
| `auto` (ค่าเริ่มต้น) | รวม footer `Source: <path#line>` ใน snippets      |
| `on`             | รวม footer เสมอ                                    |
| `off`            | ไม่ใส่ footer (แต่ path ยังคงถูกส่งให้ agent ภายใน) |

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

Dreaming ทำงานเป็นรอบกวาดตามเวลาที่กำหนดหนึ่งรอบ และใช้เฟส light/deep/REM ภายในเป็น
รายละเอียดของ implementation

สำหรับพฤติกรรมเชิงแนวคิดและ slash commands โปรดดู [Dreaming](/th/concepts/dreaming)

### การตั้งค่าของผู้ใช้

| คีย์        | ชนิด      | ค่าเริ่มต้น  | คำอธิบาย                                      |
| ----------- | --------- | ------------ | --------------------------------------------- |
| `enabled`   | `boolean` | `false`      | เปิดหรือปิด Dreaming ทั้งหมด                  |
| `frequency` | `string`  | `0 3 * * *`  | รอบเวลา Cron แบบไม่บังคับสำหรับการกวาด Dreaming ทั้งรอบ |

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

- Dreaming เขียนสถานะของเครื่องลงใน `memory/.dreams/`
- Dreaming เขียนผลลัพธ์เชิงบรรยายที่มนุษย์อ่านได้ลงใน `DREAMS.md` (หรือ `dreams.md` ที่มีอยู่)
- นโยบายและเกณฑ์ของเฟส light/deep/REM เป็นพฤติกรรมภายใน ไม่ใช่ config ที่ผู้ใช้ต้องตั้งค่า

## ที่เกี่ยวข้อง

- [ภาพรวม Memory](/th/concepts/memory)
- [Memory search](/th/concepts/memory-search)
- [เอกสารอ้างอิงการตั้งค่า](/th/gateway/configuration-reference)
