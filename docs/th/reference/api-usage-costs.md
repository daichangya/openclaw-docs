---
read_when:
    - คุณต้องการทำความเข้าใจว่าฟีเจอร์ใดบ้างที่อาจเรียกใช้ API แบบมีค่าใช้จ่าย
    - คุณต้องการตรวจสอบคีย์ ต้นทุน และการมองเห็นการใช้งาน
    - คุณกำลังอธิบายการรายงานของ `/status` หรือ `/usage cost`
summary: ตรวจสอบว่าอะไรบ้างที่อาจมีค่าใช้จ่าย ใช้คีย์ใดบ้าง และดูการใช้งานได้อย่างไร
title: การใช้งาน API และค่าใช้จ่าย
x-i18n:
    generated_at: "2026-04-23T05:54:46Z"
    model: gpt-5.4
    provider: openai
    source_hash: f5077e74d38ef781ac7a72603e9f9e3829a628b95c5a9967915ab0f321565429
    source_path: reference/api-usage-costs.md
    workflow: 15
---

# การใช้งาน API และค่าใช้จ่าย

เอกสารนี้แสดงรายการ **ฟีเจอร์ที่สามารถเรียกใช้ API key ได้** และระบุว่าค่าใช้จ่ายของมันแสดงที่ใด โดยเน้นที่
ฟีเจอร์ของ OpenClaw ที่สามารถก่อให้เกิดการใช้งานของผู้ให้บริการหรือการเรียก API แบบมีค่าใช้จ่ายได้

## ค่าใช้จ่ายแสดงที่ไหนบ้าง (แชต + CLI)

**สแนปชอตค่าใช้จ่ายแยกตามเซสชัน**

- `/status` แสดงโมเดลปัจจุบันของเซสชัน การใช้บริบท และโทเคนของคำตอบล่าสุด
- หากโมเดลใช้ **การยืนยันตัวตนแบบ API key** `/status` จะแสดง **ค่าใช้จ่ายโดยประมาณ** ของคำตอบล่าสุดด้วย
- หากเมทาดาทาของเซสชันสดมีข้อมูลน้อยเกินไป `/status` สามารถกู้คืน
  token/cache counter และป้ายชื่อโมเดล runtime ที่ active อยู่จากรายการ usage ล่าสุดใน transcript ได้
  อย่างไรก็ตามค่าจากข้อมูลสดที่เป็น nonzero จะยังมีความสำคัญก่อน และยอดรวมจาก transcript ที่มีขนาดระดับ prompt ก็อาจชนะได้เมื่อยอดรวมที่เก็บไว้ไม่มีหรือมีค่าน้อยกว่า

**footer ค่าใช้จ่ายต่อข้อความ**

- `/usage full` จะต่อ footer การใช้งานไว้กับทุกคำตอบ รวมถึง **ค่าใช้จ่ายโดยประมาณ** (เฉพาะ API key)
- `/usage tokens` จะแสดงเฉพาะโทเคน; โฟลว์แบบ OAuth/token หรือ CLI ที่มีลักษณะเป็น subscription จะซ่อนค่าใช้จ่ายแบบดอลลาร์
- หมายเหตุสำหรับ Gemini CLI: เมื่อ CLI ส่งคืนเอาต์พุตแบบ JSON OpenClaw จะอ่าน usage จาก
  `stats`, normalize `stats.cached` ให้เป็น `cacheRead`, และอนุมานโทเคนขาเข้าจาก
  `stats.input_tokens - stats.cached` เมื่อจำเป็น

หมายเหตุเกี่ยวกับ Anthropic: เจ้าหน้าที่ของ Anthropic แจ้งเราว่าการใช้ Claude CLI แบบสไตล์ OpenClaw
ได้รับอนุญาตอีกครั้ง ดังนั้น OpenClaw จึงถือว่าการใช้ Claude CLI ซ้ำและ `claude -p`
เป็นแนวทางที่ได้รับอนุญาตสำหรับ integration นี้ เว้นแต่ Anthropic จะประกาศนโยบายใหม่
อย่างไรก็ตาม Anthropic ยังไม่เปิดเผยการประเมินค่าใช้จ่ายต่อข้อความที่ OpenClaw จะสามารถ
แสดงใน `/usage full` ได้

**หน้าต่างการใช้งานใน CLI (โควตาของผู้ให้บริการ)**

- `openclaw status --usage` และ `openclaw channels list` แสดง **หน้าต่างการใช้งาน**
  ของผู้ให้บริการ (เป็นสแนปชอตโควตา ไม่ใช่ค่าใช้จ่ายต่อข้อความ)
- เอาต์พุตที่มนุษย์อ่านได้จะถูก normalize เป็น `X% left` เหมือนกันทุกผู้ให้บริการ
- ผู้ให้บริการที่รองรับหน้าต่างการใช้งานในปัจจุบัน: Anthropic, GitHub Copilot, Gemini CLI,
  OpenAI Codex, MiniMax, Xiaomi และ z.ai
- หมายเหตุเกี่ยวกับ MiniMax: ฟิลด์ดิบ `usage_percent` / `usagePercent` ของมันหมายถึง
  โควตาที่เหลือ ดังนั้น OpenClaw จะกลับค่าก่อนแสดงผล ส่วนฟิลด์แบบนับจำนวนจะยังมีความสำคัญก่อน
  เมื่อมีอยู่ หากผู้ให้บริการส่งกลับ `model_remains` OpenClaw จะเลือกข้อมูลของ chat-model ก่อน
  อนุมานป้ายชื่อหน้าต่างจาก timestamp เมื่อจำเป็น และรวมชื่อโมเดลไว้ในป้ายชื่อแผน
- auth สำหรับการใช้งานหน้าต่างโควตาเหล่านั้นมาจาก hook เฉพาะของผู้ให้บริการเมื่อมี
  มิฉะนั้น OpenClaw จะ fallback ไปจับคู่ credentials แบบ OAuth/API-key
  จาก auth profile, env หรือ config

ดูรายละเอียดและตัวอย่างได้ที่ [การใช้โทเคนและค่าใช้จ่าย](/th/reference/token-use)

## วิธีค้นพบ key

OpenClaw สามารถหยิบ credentials ได้จาก:

- **Auth profiles** (แยกตามเอเจนต์ เก็บไว้ใน `auth-profiles.json`)
- **ตัวแปรสภาพแวดล้อม** (เช่น `OPENAI_API_KEY`, `BRAVE_API_KEY`, `FIRECRAWL_API_KEY`)
- **Config** (`models.providers.*.apiKey`, `plugins.entries.*.config.webSearch.apiKey`,
  `plugins.entries.firecrawl.config.webFetch.apiKey`, `memorySearch.*`,
  `talk.providers.*.apiKey`)
- **Skills** (`skills.entries.<name>.apiKey`) ซึ่งอาจ export key เข้า env ของโปรเซส Skill

## ฟีเจอร์ที่อาจใช้ key

### 1) การตอบกลับจากโมเดลหลัก (แชต + tools)

ทุกคำตอบหรือ tool call ใช้ **ผู้ให้บริการโมเดลปัจจุบัน** (OpenAI, Anthropic ฯลฯ) นี่คือ
แหล่งการใช้งานและค่าใช้จ่ายหลัก

สิ่งนี้ยังรวมถึงผู้ให้บริการแบบโฮสต์ที่เป็น subscription ซึ่งยังคงเรียกเก็บเงินนอก
UI ภายในเครื่องของ OpenClaw ด้วย เช่น **OpenAI Codex**, **Alibaba Cloud Model Studio
Coding Plan**, **MiniMax Coding Plan**, **Z.AI / GLM Coding Plan** และ
เส้นทาง Claude-login ของ Anthropic ใน OpenClaw ที่เปิด **Extra Usage**

ดู [Models](/th/providers/models) สำหรับคอนฟิกราคา และ [การใช้โทเคนและค่าใช้จ่าย](/th/reference/token-use) สำหรับการแสดงผล

### 2) การทำความเข้าใจสื่อ (เสียง/ภาพ/วิดีโอ)

สื่อขาเข้าสามารถถูกสรุป/ถอดเสียงก่อนที่การตอบกลับจะเริ่มทำงาน ซึ่งใช้ API ของโมเดล/ผู้ให้บริการ

- เสียง: OpenAI / Groq / Deepgram / Google / Mistral
- ภาพ: OpenAI / OpenRouter / Anthropic / Google / MiniMax / Moonshot / Qwen / Z.AI
- วิดีโอ: Google / Qwen / Moonshot

ดู [การทำความเข้าใจสื่อ](/th/nodes/media-understanding)

### 3) การสร้างภาพและวิดีโอ

ความสามารถด้านการสร้างที่ใช้ร่วมกันก็อาจใช้ key ของผู้ให้บริการได้เช่นกัน:

- การสร้างภาพ: OpenAI / Google / fal / MiniMax
- การสร้างวิดีโอ: Qwen

การสร้างภาพสามารถอนุมานผู้ให้บริการเริ่มต้นที่มี auth รองรับได้เมื่อ
ไม่ได้ตั้ง `agents.defaults.imageGenerationModel` ไว้ การสร้างวิดีโอในปัจจุบัน
ยังต้องใช้ `agents.defaults.videoGenerationModel` แบบ explicit เช่น
`qwen/wan2.6-t2v`

ดู [การสร้างภาพ](/th/tools/image-generation), [Qwen Cloud](/th/providers/qwen)
และ [Models](/th/concepts/models)

### 4) Embedding ของ memory + การค้นหาเชิงความหมาย

การค้นหา memory เชิงความหมายใช้ **embedding API** เมื่อกำหนดค่าให้ใช้ผู้ให้บริการระยะไกล:

- `memorySearch.provider = "openai"` → embedding ของ OpenAI
- `memorySearch.provider = "gemini"` → embedding ของ Gemini
- `memorySearch.provider = "voyage"` → embedding ของ Voyage
- `memorySearch.provider = "mistral"` → embedding ของ Mistral
- `memorySearch.provider = "lmstudio"` → embedding ของ LM Studio (รันในเครื่อง/โฮสต์เอง)
- `memorySearch.provider = "ollama"` → embedding ของ Ollama (รันในเครื่อง/โฮสต์เอง; โดยทั่วไปไม่มีค่าใช้จ่าย API แบบโฮสต์)
- fallback แบบไม่บังคับไปยังผู้ให้บริการระยะไกล หาก embedding ภายในเครื่องล้มเหลว

คุณสามารถคงทุกอย่างไว้ในเครื่องได้ด้วย `memorySearch.provider = "local"` (ไม่มีการใช้ API)

ดู [Memory](/th/concepts/memory)

### 5) Web search tool

`web_search` อาจมีค่าใช้จ่ายตามผู้ให้บริการของคุณ:

- **Brave Search API**: `BRAVE_API_KEY` หรือ `plugins.entries.brave.config.webSearch.apiKey`
- **Exa**: `EXA_API_KEY` หรือ `plugins.entries.exa.config.webSearch.apiKey`
- **Firecrawl**: `FIRECRAWL_API_KEY` หรือ `plugins.entries.firecrawl.config.webSearch.apiKey`
- **Gemini (Google Search)**: `GEMINI_API_KEY` หรือ `plugins.entries.google.config.webSearch.apiKey`
- **Grok (xAI)**: `XAI_API_KEY` หรือ `plugins.entries.xai.config.webSearch.apiKey`
- **Kimi (Moonshot)**: `KIMI_API_KEY`, `MOONSHOT_API_KEY` หรือ `plugins.entries.moonshot.config.webSearch.apiKey`
- **MiniMax Search**: `MINIMAX_CODE_PLAN_KEY`, `MINIMAX_CODING_API_KEY`, `MINIMAX_API_KEY` หรือ `plugins.entries.minimax.config.webSearch.apiKey`
- **Ollama Web Search**: ค่าเริ่มต้นไม่ต้องใช้ key แต่ต้องมีโฮสต์ Ollama ที่เข้าถึงได้พร้อม `ollama signin`; ยังสามารถใช้ bearer auth ของผู้ให้บริการ Ollama ปกติซ้ำได้เมื่อโฮสต์นั้นบังคับใช้
- **Perplexity Search API**: `PERPLEXITY_API_KEY`, `OPENROUTER_API_KEY` หรือ `plugins.entries.perplexity.config.webSearch.apiKey`
- **Tavily**: `TAVILY_API_KEY` หรือ `plugins.entries.tavily.config.webSearch.apiKey`
- **DuckDuckGo**: fallback แบบไม่ใช้ key (ไม่มีค่าใช้จ่าย API แต่ไม่เป็นทางการและอิง HTML)
- **SearXNG**: `SEARXNG_BASE_URL` หรือ `plugins.entries.searxng.config.webSearch.baseUrl` (ไม่ใช้ key/โฮสต์เอง; ไม่มีค่าใช้จ่าย API แบบโฮสต์)

พาธผู้ให้บริการแบบ legacy `tools.web.search.*` ยังโหลดผ่าน compatibility shim ชั่วคราว แต่ไม่ใช่พื้นผิวคอนฟิกที่แนะนำอีกต่อไป

**เครดิตฟรีของ Brave Search:** แผนของ Brave ทุกแผนมีเครดิตฟรีแบบต่ออายุ \$5/เดือน
แผน Search มีค่าใช้จ่าย \$5 ต่อ 1,000 คำขอ ดังนั้นเครดิตนี้ครอบคลุม
1,000 คำขอ/เดือนโดยไม่เสียค่าใช้จ่าย ตั้งค่าขีดจำกัดการใช้งานในแดชบอร์ดของ Brave
เพื่อหลีกเลี่ยงค่าใช้จ่ายที่ไม่คาดคิด

ดู [Web tools](/th/tools/web)

### 5) Web fetch tool (Firecrawl)

`web_fetch` สามารถเรียก **Firecrawl** ได้เมื่อมี API key:

- `FIRECRAWL_API_KEY` หรือ `plugins.entries.firecrawl.config.webFetch.apiKey`

หากไม่ได้ตั้งค่า Firecrawl tool จะ fallback ไปใช้ direct fetch + readability (ไม่มี API แบบมีค่าใช้จ่าย)

ดู [Web tools](/th/tools/web)

### 6) สแนปชอตการใช้งานของผู้ให้บริการ (status/health)

คำสั่งสถานะบางตัวจะเรียก **endpoint การใช้งานของผู้ให้บริการ** เพื่อแสดงหน้าต่างโควตาหรือสุขภาพของ auth
โดยปกติแล้วเป็นการเรียกปริมาณต่ำ แต่ก็ยังถือว่าเรียก API ของผู้ให้บริการ:

- `openclaw status --usage`
- `openclaw models status --json`

ดู [Models CLI](/cli/models)

### 7) การสรุปของ Compaction safeguard

compaction safeguard สามารถสรุปประวัติของเซสชันโดยใช้ **โมเดลปัจจุบัน** ซึ่ง
จะเรียก API ของผู้ให้บริการเมื่อมันทำงาน

ดู [การจัดการเซสชัน + Compaction](/th/reference/session-management-compaction)

### 8) การสแกน / probe โมเดล

`openclaw models scan` สามารถ probe โมเดลของ OpenRouter ได้ และจะใช้ `OPENROUTER_API_KEY` เมื่อ
เปิดใช้การ probe

ดู [Models CLI](/cli/models)

### 9) Talk (เสียงพูด)

Talk mode สามารถเรียก **ElevenLabs** ได้เมื่อมีการตั้งค่า:

- `ELEVENLABS_API_KEY` หรือ `talk.providers.elevenlabs.apiKey`

ดู [Talk mode](/th/nodes/talk)

### 10) Skills (API ของบุคคลที่สาม)

Skills สามารถเก็บ `apiKey` ไว้ใน `skills.entries.<name>.apiKey` หาก Skill ใช้ key นั้นกับ
API ภายนอก ก็อาจก่อให้เกิดค่าใช้จ่ายตามผู้ให้บริการของ Skill นั้น

ดู [Skills](/th/tools/skills)
