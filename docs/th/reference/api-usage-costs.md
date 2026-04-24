---
read_when:
    - คุณต้องการทำความเข้าใจว่าฟีเจอร์ใดบ้างที่อาจเรียกใช้ API แบบมีค่าใช้จ่าย
    - คุณต้องการตรวจสอบคีย์ ต้นทุน และการมองเห็นการใช้งาน
    - คุณกำลังอธิบายการรายงานค่าใช้จ่ายของ `/status` หรือ `/usage`
summary: ตรวจสอบสิ่งที่อาจมีค่าใช้จ่าย คีย์ที่ใช้งานอยู่ และวิธีดูการใช้งาน
title: การใช้งาน API และค่าใช้จ่าย
x-i18n:
    generated_at: "2026-04-24T09:31:08Z"
    model: gpt-5.4
    provider: openai
    source_hash: d44b34a782a4090a074c49b91df3fa9733f13f16b3d39258b6cf57cf24043f43
    source_path: reference/api-usage-costs.md
    workflow: 15
---

# การใช้งาน API และค่าใช้จ่าย

เอกสารนี้แสดงรายการ **ฟีเจอร์ที่สามารถเรียกใช้ API key ได้** และตำแหน่งที่ค่าใช้จ่ายของฟีเจอร์เหล่านั้นจะแสดงขึ้น โดยมุ่งเน้นไปที่ฟีเจอร์ของ OpenClaw ที่อาจก่อให้เกิดการใช้งาน provider หรือการเรียก API แบบมีค่าใช้จ่าย

## ตำแหน่งที่ค่าใช้จ่ายจะแสดงขึ้น (แชต + CLI)

**ภาพรวมค่าใช้จ่ายต่อเซสชัน**

- `/status` แสดง model ปัจจุบันของเซสชัน การใช้คอนเท็กซ์ และจำนวนโทเคนของการตอบกลับล่าสุด
- หาก model ใช้ **การยืนยันตัวตนแบบ API key** `/status` จะแสดง **ค่าใช้จ่ายโดยประมาณ** สำหรับการตอบกลับล่าสุดด้วย
- หากเมทาดาทาเซสชันสดมีข้อมูลไม่ครบ `/status` สามารถกู้คืนตัวนับโทเคน/แคช
  และป้ายกำกับ model runtime ที่ใช้งานอยู่จากรายการ usage ล่าสุดใน transcript ได้
  ค่าที่มีอยู่แบบสดและไม่เป็นศูนย์จะยังคงมีลำดับความสำคัญสูงกว่า และยอดรวมจาก transcript
  ที่มีขนาดในระดับ prompt อาจชนะเมื่อยอดรวมที่จัดเก็บไว้ไม่มีหรือมีขนาดเล็กกว่า

**ส่วนท้ายค่าใช้จ่ายต่อข้อความ**

- `/usage full` จะเพิ่มส่วนท้ายการใช้งานในทุกการตอบกลับ รวมถึง **ค่าใช้จ่ายโดยประมาณ** (เฉพาะ API key)
- `/usage tokens` จะแสดงเฉพาะโทเคน; flow แบบ subscription-style OAuth/token และ CLI จะซ่อนค่าใช้จ่ายเป็นดอลลาร์
- หมายเหตุเกี่ยวกับ Gemini CLI: เมื่อ CLI ส่งคืนเอาต์พุต JSON OpenClaw จะอ่าน usage จาก
  `stats`, ทำ normalization ของ `stats.cached` เป็น `cacheRead` และคำนวณโทเคนขาเข้า
  จาก `stats.input_tokens - stats.cached` เมื่อต้องใช้

หมายเหตุเกี่ยวกับ Anthropic: ทีมงาน Anthropic แจ้งเราว่าการใช้งาน Claude CLI แบบ OpenClaw
ได้รับอนุญาตอีกครั้งแล้ว ดังนั้น OpenClaw จึงถือว่าการใช้ Claude CLI ซ้ำและการใช้ `claude -p`
ได้รับการรับรองสำหรับการผสานรวมนี้ เว้นแต่ Anthropic จะเผยแพร่นโยบายใหม่
อย่างไรก็ตาม Anthropic ยังไม่ได้เปิดเผยการประมาณค่าใช้จ่ายรายข้อความที่ OpenClaw
จะแสดงใน `/usage full` ได้

**หน้าต่างการใช้งานใน CLI (โควตาของ provider)**

- `openclaw status --usage` และ `openclaw channels list` จะแสดง **หน้าต่างการใช้งาน**
  ของ provider (ภาพรวมโควตา ไม่ใช่ค่าใช้จ่ายต่อข้อความ)
- เอาต์พุตสำหรับมนุษย์อ่านจะถูก normalize เป็น `X% left` ในทุก provider
- provider หน้าต่างการใช้งานในปัจจุบัน: Anthropic, GitHub Copilot, Gemini CLI,
  OpenAI Codex, MiniMax, Xiaomi และ z.ai
- หมายเหตุเกี่ยวกับ MiniMax: ฟิลด์ดิบ `usage_percent` / `usagePercent` ของมันหมายถึง
  โควตาที่เหลืออยู่ ดังนั้น OpenClaw จะกลับค่าก่อนแสดงผล ฟิลด์ที่อิงตามจำนวนจะยังคงมีลำดับความสำคัญ
  สูงกว่าเมื่อมีอยู่ หาก provider ส่งคืน `model_remains` OpenClaw จะเลือกใช้รายการ
  chat-model ก่อน คำนวณป้ายกำกับหน้าต่างจาก timestamp เมื่อต้องใช้ และ
  รวมชื่อ model ไว้ในป้ายกำกับแพ็กเกจ
- Auth สำหรับการใช้งานหน้าต่างโควตาเหล่านั้นมาจาก hook เฉพาะของ provider เมื่อมีให้ใช้;
  มิฉะนั้น OpenClaw จะ fallback ไปจับคู่ credential แบบ OAuth/API key
  จาก auth profile, env หรือ config

ดู [การใช้โทเคนและค่าใช้จ่าย](/th/reference/token-use) สำหรับรายละเอียดและตัวอย่าง

## วิธีการค้นหา key

OpenClaw สามารถรับ credential ได้จาก:

- **Auth profile** (ต่อ agent, จัดเก็บใน `auth-profiles.json`)
- **ตัวแปรสภาพแวดล้อม** (เช่น `OPENAI_API_KEY`, `BRAVE_API_KEY`, `FIRECRAWL_API_KEY`)
- **Config** (`models.providers.*.apiKey`, `plugins.entries.*.config.webSearch.apiKey`,
  `plugins.entries.firecrawl.config.webFetch.apiKey`, `memorySearch.*`,
  `talk.providers.*.apiKey`)
- **Skills** (`skills.entries.<name>.apiKey`) ซึ่งอาจ export key ไปยัง env ของ process ของ skill

## ฟีเจอร์ที่อาจใช้ key จนเกิดค่าใช้จ่าย

### 1) การตอบกลับของ model หลัก (แชต + tool)

ทุกการตอบกลับหรือการเรียก tool จะใช้ **provider ของ model ปัจจุบัน** (OpenAI, Anthropic ฯลฯ) นี่คือ
แหล่งหลักของการใช้งานและค่าใช้จ่าย

นี่ยังรวมถึง provider แบบโฮสต์ในลักษณะ subscription-style ที่ยังคงเรียกเก็บเงินนอก
UI ภายในของ OpenClaw เช่น **OpenAI Codex**, **Alibaba Cloud Model Studio
Coding Plan**, **MiniMax Coding Plan**, **Z.AI / GLM Coding Plan** และ
เส้นทาง Claude-login ของ Anthropic ใน OpenClaw ที่เปิดใช้ **Extra Usage**

ดู [Models](/th/providers/models) สำหรับการกำหนดค่าราคา และ [การใช้โทเคนและค่าใช้จ่าย](/th/reference/token-use) สำหรับการแสดงผล

### 2) การทำความเข้าใจสื่อ (เสียง/ภาพ/วิดีโอ)

สื่อขาเข้าสามารถถูกสรุป/ถอดเสียงก่อนเริ่มตอบกลับได้ โดยใช้ API ของ model/provider

- เสียง: OpenAI / Groq / Deepgram / Google / Mistral
- ภาพ: OpenAI / OpenRouter / Anthropic / Google / MiniMax / Moonshot / Qwen / Z.AI
- วิดีโอ: Google / Qwen / Moonshot

ดู [การทำความเข้าใจสื่อ](/th/nodes/media-understanding)

### 3) การสร้างภาพและวิดีโอ

ความสามารถในการสร้างแบบใช้ร่วมกันก็อาจใช้ key ของ provider จนเกิดค่าใช้จ่ายได้:

- การสร้างภาพ: OpenAI / Google / fal / MiniMax
- การสร้างวิดีโอ: Qwen

การสร้างภาพสามารถอนุมาน provider เริ่มต้นที่มี auth รองรับได้เมื่อ
`agents.defaults.imageGenerationModel` ไม่ได้ตั้งค่าไว้ ปัจจุบันการสร้างวิดีโอจำเป็นต้องมี
`agents.defaults.videoGenerationModel` แบบ explicit เช่น
`qwen/wan2.6-t2v`

ดู [การสร้างภาพ](/th/tools/image-generation), [Qwen Cloud](/th/providers/qwen)
และ [Models](/th/concepts/models)

### 4) embedding ของ memory + semantic search

การค้นหา memory แบบ semantic ใช้ **API สำหรับ embedding** เมื่อกำหนดค่าให้ใช้ provider ระยะไกล:

- `memorySearch.provider = "openai"` → embedding ของ OpenAI
- `memorySearch.provider = "gemini"` → embedding ของ Gemini
- `memorySearch.provider = "voyage"` → embedding ของ Voyage
- `memorySearch.provider = "mistral"` → embedding ของ Mistral
- `memorySearch.provider = "lmstudio"` → embedding ของ LM Studio (local/self-hosted)
- `memorySearch.provider = "ollama"` → embedding ของ Ollama (local/self-hosted; โดยทั่วไปไม่มีค่าใช้จ่ายจาก hosted API)
- fallback แบบไม่บังคับไปยัง provider ระยะไกล หาก embedding ในเครื่องล้มเหลว

คุณสามารถทำให้เป็น local ล้วนได้ด้วย `memorySearch.provider = "local"` (ไม่มีการใช้ API)

ดู [Memory](/th/concepts/memory)

### 5) เครื่องมือค้นหาเว็บ

`web_search` อาจมีค่าใช้จ่ายตาม provider ของคุณ:

- **Brave Search API**: `BRAVE_API_KEY` หรือ `plugins.entries.brave.config.webSearch.apiKey`
- **Exa**: `EXA_API_KEY` หรือ `plugins.entries.exa.config.webSearch.apiKey`
- **Firecrawl**: `FIRECRAWL_API_KEY` หรือ `plugins.entries.firecrawl.config.webSearch.apiKey`
- **Gemini (Google Search)**: `GEMINI_API_KEY` หรือ `plugins.entries.google.config.webSearch.apiKey`
- **Grok (xAI)**: `XAI_API_KEY` หรือ `plugins.entries.xai.config.webSearch.apiKey`
- **Kimi (Moonshot)**: `KIMI_API_KEY`, `MOONSHOT_API_KEY` หรือ `plugins.entries.moonshot.config.webSearch.apiKey`
- **MiniMax Search**: `MINIMAX_CODE_PLAN_KEY`, `MINIMAX_CODING_API_KEY`, `MINIMAX_API_KEY` หรือ `plugins.entries.minimax.config.webSearch.apiKey`
- **Ollama Web Search**: โดยค่าเริ่มต้นไม่ต้องใช้ key แต่ต้องเข้าถึงโฮสต์ Ollama ได้และมี `ollama signin`; ยังสามารถใช้ Bearer auth ปกติของ provider Ollama ซ้ำได้เมื่อโฮสต์ต้องการ
- **Perplexity Search API**: `PERPLEXITY_API_KEY`, `OPENROUTER_API_KEY` หรือ `plugins.entries.perplexity.config.webSearch.apiKey`
- **Tavily**: `TAVILY_API_KEY` หรือ `plugins.entries.tavily.config.webSearch.apiKey`
- **DuckDuckGo**: fallback ที่ไม่ต้องใช้ key (ไม่มีค่าใช้จ่าย API แต่ไม่เป็นทางการและอิง HTML)
- **SearXNG**: `SEARXNG_BASE_URL` หรือ `plugins.entries.searxng.config.webSearch.baseUrl` (ไม่ต้องใช้ key/self-hosted; ไม่มีค่าใช้จ่าย hosted API)

พาธ provider แบบเดิม `tools.web.search.*` ยังถูกโหลดผ่าน compatibility shim ชั่วคราว แต่ไม่ใช่พื้นผิว config ที่แนะนำอีกต่อไป

**เครดิตฟรีของ Brave Search:** แผนแต่ละแบบของ Brave มีเครดิตฟรีที่ต่ออายุ
เดือนละ \$5 แผน Search มีราคา \$5 ต่อ 1,000 คำขอ ดังนั้นเครดิตฟรีจะครอบคลุม
1,000 คำขอต่อเดือนโดยไม่มีค่าใช้จ่าย ตั้งขีดจำกัดการใช้งานในแดชบอร์ด Brave
เพื่อหลีกเลี่ยงค่าใช้จ่ายที่ไม่คาดคิด

ดู [เครื่องมือเว็บ](/th/tools/web)

### 5) เครื่องมือดึงข้อมูลเว็บ (Firecrawl)

`web_fetch` สามารถเรียก **Firecrawl** ได้เมื่อมี API key:

- `FIRECRAWL_API_KEY` หรือ `plugins.entries.firecrawl.config.webFetch.apiKey`

หากไม่ได้กำหนดค่า Firecrawl เครื่องมือจะ fallback ไปใช้ direct fetch + readability (ไม่มี API แบบเสียเงิน)

ดู [เครื่องมือเว็บ](/th/tools/web)

### 6) ภาพรวมการใช้งานของ provider (status/health)

คำสั่งสถานะบางคำสั่งจะเรียก **endpoint การใช้งานของ provider** เพื่อแสดงหน้าต่างโควตาหรือสถานะ auth
โดยทั่วไปคำขอเหล่านี้มีปริมาณต่ำ แต่ยังคงเรียก API ของ provider:

- `openclaw status --usage`
- `openclaw models status --json`

ดู [Models CLI](/th/cli/models)

### 7) การสรุปโดยตัวป้องกัน Compaction

ตัวป้องกัน Compaction สามารถสรุปประวัติเซสชันโดยใช้ **model ปัจจุบัน** ซึ่ง
จะเรียก API ของ provider เมื่อมันทำงาน

ดู [การจัดการเซสชัน + Compaction](/th/reference/session-management-compaction)

### 8) การสแกน / โพรบ model

`openclaw models scan` สามารถโพรบ model ของ OpenRouter ได้ และใช้ `OPENROUTER_API_KEY` เมื่อ
เปิดใช้การโพรบ

ดู [Models CLI](/th/cli/models)

### 9) Talk (เสียงพูด)

โหมด Talk สามารถเรียก **ElevenLabs** ได้เมื่อกำหนดค่าไว้:

- `ELEVENLABS_API_KEY` หรือ `talk.providers.elevenlabs.apiKey`

ดู [โหมด Talk](/th/nodes/talk)

### 10) Skills (API ของบุคคลที่สาม)

Skills สามารถจัดเก็บ `apiKey` ไว้ใน `skills.entries.<name>.apiKey` หาก skill ใช้ key นั้นสำหรับ
API ภายนอก ก็อาจมีค่าใช้จ่ายตาม provider ของ skill นั้น

ดู [Skills](/th/tools/skills)

## ที่เกี่ยวข้อง

- [การใช้โทเคนและค่าใช้จ่าย](/th/reference/token-use)
- [การแคช prompt](/th/reference/prompt-caching)
- [การติดตามการใช้งาน](/th/concepts/usage-tracking)
