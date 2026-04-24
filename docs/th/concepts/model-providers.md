---
read_when:
    - |-
      คุณต้องการข้อมูลอ้างอิงการตั้งค่าโมเดลแยกตามผู้ให้บริการ 摩臣յանassistant to=commentary.multi_tool_use.parallel  大发分分彩  天天中彩票粤json
      {"tool_uses":[{"recipient_name":"functions.read","parameters":{"path":"docs/AGENTS.md"}},{"recipient_name":"functions.bash","parameters":{"command":"pwd && ls -1 .. && rg -n \"Model providers|provider overview|example configs\" -S ../.. | head -50","timeout":10}}]}
    - คุณต้องการตัวอย่างการกำหนดค่าหรือคำสั่ง onboarding ของ CLI สำหรับผู้ให้บริการโมเดล
summary: ภาพรวมผู้ให้บริการโมเดลพร้อมตัวอย่างการกำหนดค่า + โฟลว์ CLI
title: ผู้ให้บริการโมเดล
x-i18n:
    generated_at: "2026-04-24T09:06:40Z"
    model: gpt-5.4
    provider: openai
    source_hash: ac9bf48897446576d8bc339b340295691741a589863bb57b379c17a5519bffd7
    source_path: concepts/model-providers.md
    workflow: 15
---

หน้านี้ครอบคลุม **ผู้ให้บริการ LLM/โมเดล** (ไม่ใช่ช่องทางแชตอย่าง WhatsApp/Telegram)
สำหรับกฎการเลือกโมเดล ดู [/concepts/models](/th/concepts/models)

## กฎแบบรวดเร็ว

- การอ้างอิงโมเดลใช้ `provider/model` (ตัวอย่าง: `opencode/claude-opus-4-6`)
- `agents.defaults.models` จะทำหน้าที่เป็น allowlist เมื่อมีการตั้งค่า
- ตัวช่วย CLI: `openclaw onboard`, `openclaw models list`, `openclaw models set <provider/model>`
- `models.providers.*.models[].contextWindow` คือเมทาดาทาเนทีฟของโมเดล; `contextTokens` คือเพดานรันไทม์ที่มีผลจริง
- กฎ fallback, cooldown probes และการคงอยู่ของ session-override: [Model failover](/th/concepts/model-failover)
- เส้นทางตระกูล OpenAI มี prefix เฉพาะ: `openai/<model>` ใช้ผู้ให้บริการ API key ของ OpenAI โดยตรงใน PI, `openai-codex/<model>` ใช้ Codex OAuth ใน PI และ `openai/<model>` ร่วมกับ `agents.defaults.embeddedHarness.runtime: "codex"` จะใช้ native Codex app-server harness ดู [OpenAI](/th/providers/openai)
  และ [Codex harness](/th/plugins/codex-harness)
- การเปิดใช้ Plugin อัตโนมัติก็เป็นไปตามขอบเขตเดียวกันนั้น: `openai-codex/<model>` เป็นของ
  OpenAI Plugin ขณะที่ Codex Plugin จะถูกเปิดใช้โดย
  `embeddedHarness.runtime: "codex"` หรือการอ้างอิง `codex/<model>` แบบเดิม
- ปัจจุบัน GPT-5.5 ใช้งานได้ผ่านเส้นทาง subscription/OAuth:
  `openai-codex/gpt-5.5` ใน PI หรือ `openai/gpt-5.5` พร้อม Codex app-server
  harness เส้นทาง API key โดยตรงสำหรับ `openai/gpt-5.5` จะรองรับเมื่อ
  OpenAI เปิดใช้ GPT-5.5 บน public API; จนกว่าจะถึงตอนนั้นให้ใช้โมเดลที่เปิดใช้ API แล้ว
  เช่น `openai/gpt-5.4` สำหรับการตั้งค่า `OPENAI_API_KEY`

## พฤติกรรมผู้ให้บริการที่เป็นเจ้าของโดย Plugin

ตรรกะเฉพาะของผู้ให้บริการส่วนใหญ่อยู่ใน provider plugins (`registerProvider(...)`) ขณะที่ OpenClaw ดูแลลูปการอนุมานแบบทั่วไป Plugins เป็นเจ้าของ onboarding, แค็ตตาล็อกโมเดล, การแมป auth env-var, การทำ transport/config normalization, การทำความสะอาด tool-schema, การจัดประเภท failover, การรีเฟรช OAuth, การรายงานการใช้งาน, โปรไฟล์การคิด/การใช้เหตุผล และอื่น ๆ

รายการเต็มของ hook ใน provider-SDK และตัวอย่าง bundled-plugin อยู่ที่ [Provider plugins](/th/plugins/sdk-provider-plugins) ผู้ให้บริการที่ต้องใช้ตัวดำเนินการคำขอแบบกำหนดเองทั้งหมดจะเป็นพื้นผิวการขยายอีกแบบหนึ่งที่ลึกกว่า

<Note>
`capabilities` ของรันไทม์ผู้ให้บริการเป็นเมทาดาทาของตัวรันที่ใช้ร่วมกัน (ตระกูลผู้ให้บริการ, ลักษณะเฉพาะของทรานสคริปต์/เครื่องมือ, คำใบ้ transport/cache) มันไม่เหมือนกับ [โมเดล capability สาธารณะ](/th/plugins/architecture#public-capability-model) ซึ่งอธิบายว่า Plugin ลงทะเบียนอะไรไว้บ้าง (การอนุมานข้อความ เสียงพูด ฯลฯ)
</Note>

## การหมุนเวียน API key

- รองรับการหมุนเวียนผู้ให้บริการแบบทั่วไปสำหรับผู้ให้บริการที่เลือกไว้
- กำหนดค่าหลายคีย์ผ่าน:
  - `OPENCLAW_LIVE_<PROVIDER>_KEY` (การ override live เดี่ยว ลำดับความสำคัญสูงสุด)
  - `<PROVIDER>_API_KEYS` (รายการคั่นด้วยจุลภาคหรืออัฒภาค)
  - `<PROVIDER>_API_KEY` (คีย์หลัก)
  - `<PROVIDER>_API_KEY_*` (รายการแบบมีหมายเลข เช่น `<PROVIDER>_API_KEY_1`)
- สำหรับผู้ให้บริการ Google จะรวม `GOOGLE_API_KEY` เป็น fallback ด้วย
- ลำดับการเลือกคีย์จะคงลำดับความสำคัญและตัดค่าซ้ำ
- คำขอจะถูกลองใหม่ด้วยคีย์ถัดไปเฉพาะเมื่อเป็นการตอบกลับแบบ rate-limit (เช่น
  `429`, `rate_limit`, `quota`, `resource exhausted`, `Too many
concurrent requests`, `ThrottlingException`, `concurrency limit reached`,
  `workers_ai ... quota limit exceeded` หรือข้อความจำกัดการใช้งานตามช่วงเวลา)
- ความล้มเหลวที่ไม่ใช่ rate-limit จะล้มเหลวทันที; จะไม่มีการหมุนเวียนคีย์
- เมื่อคีย์ที่เป็นไปได้ทั้งหมดล้มเหลว จะส่งคืนข้อผิดพลาดสุดท้ายจากความพยายามครั้งท้าย

## ผู้ให้บริการที่มีมาในตัว (แค็ตตาล็อก pi-ai)

OpenClaw มาพร้อมแค็ตตาล็อก pi‑ai ผู้ให้บริการเหล่านี้ **ไม่ต้อง**
กำหนดค่า `models.providers`; เพียงตั้งค่า auth + เลือกโมเดล

### OpenAI

- ผู้ให้บริการ: `openai`
- Auth: `OPENAI_API_KEY`
- การหมุนเวียนแบบไม่บังคับ: `OPENAI_API_KEYS`, `OPENAI_API_KEY_1`, `OPENAI_API_KEY_2`, พร้อม `OPENCLAW_LIVE_OPENAI_KEY` (override เดี่ยว)
- โมเดลตัวอย่าง: `openai/gpt-5.4`, `openai/gpt-5.4-mini`
- การรองรับ GPT-5.5 แบบ direct API เตรียมพร้อมไว้แล้วที่นี่เมื่อ OpenAI เปิดให้ GPT-5.5 บน API
- CLI: `openclaw onboard --auth-choice openai-api-key`
- transport เริ่มต้นคือ `auto` (WebSocket ก่อน, SSE fallback)
- override ต่อโมเดลผ่าน `agents.defaults.models["openai/<model>"].params.transport` (`"sse"`, `"websocket"` หรือ `"auto"`)
- การ warm-up ของ OpenAI Responses WebSocket เปิดใช้เป็นค่าเริ่มต้นผ่าน `params.openaiWsWarmup` (`true`/`false`)
- การประมวลผลแบบ priority ของ OpenAI สามารถเปิดใช้ได้ผ่าน `agents.defaults.models["openai/<model>"].params.serviceTier`
- `/fast` และ `params.fastMode` จะแมปคำขอ Responses แบบ direct `openai/*` ไปยัง `service_tier=priority` บน `api.openai.com`
- ใช้ `params.serviceTier` เมื่อต้องการ tier แบบชัดเจนแทนการใช้สวิตช์ `/fast` ร่วมกัน
- ส่วนหัว attribution ที่ซ่อนไว้ของ OpenClaw (`originator`, `version`,
  `User-Agent`) จะใช้เฉพาะกับทราฟฟิก OpenAI เนทีฟไปยัง `api.openai.com` ไม่ใช่
  generic OpenAI-compatible proxies
- เส้นทาง OpenAI เนทีฟยังคงรักษา Responses `store`, คำใบ้ prompt-cache และ
  การจัดรูป payload เพื่อความเข้ากันได้กับ OpenAI reasoning; เส้นทาง proxy จะไม่ทำ
- `openai/gpt-5.3-codex-spark` ถูกซ่อนไว้โดยตั้งใจใน OpenClaw เพราะคำขอ OpenAI API แบบ live ปฏิเสธมัน และแค็ตตาล็อก Codex ปัจจุบันก็ไม่เปิดเผยโมเดลนี้

```json5
{
  agents: { defaults: { model: { primary: "openai/gpt-5.4" } } },
}
```

### Anthropic

- ผู้ให้บริการ: `anthropic`
- Auth: `ANTHROPIC_API_KEY`
- การหมุนเวียนแบบไม่บังคับ: `ANTHROPIC_API_KEYS`, `ANTHROPIC_API_KEY_1`, `ANTHROPIC_API_KEY_2`, พร้อม `OPENCLAW_LIVE_ANTHROPIC_KEY` (override เดี่ยว)
- โมเดลตัวอย่าง: `anthropic/claude-opus-4-6`
- CLI: `openclaw onboard --auth-choice apiKey`
- คำขอ Anthropic สาธารณะโดยตรงรองรับสวิตช์ `/fast` ร่วมกันและ `params.fastMode` รวมถึงทราฟฟิกที่ยืนยันตัวตนด้วย API key และ OAuth ที่ส่งไปยัง `api.anthropic.com`; OpenClaw จะแมปสิ่งนี้ไปยัง Anthropic `service_tier` (`auto` เทียบกับ `standard_only`)
- หมายเหตุ Anthropic: ทีมงาน Anthropic แจ้งกับเราว่าการใช้ Claude CLI แบบ OpenClaw ใช้งานได้อีกครั้งแล้ว ดังนั้น OpenClaw จึงถือว่าการใช้ Claude CLI ซ้ำและการใช้ `claude -p` เป็นสิ่งที่ได้รับอนุญาตสำหรับการเชื่อมต่อนี้ เว้นแต่ Anthropic จะเผยแพร่นโยบายใหม่
- Anthropic setup-token ยังคงใช้งานได้ในฐานะเส้นทางโทเค็นที่รองรับของ OpenClaw แต่ตอนนี้ OpenClaw ให้ความสำคัญกับการใช้ Claude CLI ซ้ำและ `claude -p` เมื่อมีให้ใช้

```json5
{
  agents: { defaults: { model: { primary: "anthropic/claude-opus-4-6" } } },
}
```

### OpenAI Codex OAuth

- ผู้ให้บริการ: `openai-codex`
- Auth: OAuth (ChatGPT)
- การอ้างอิงโมเดล PI: `openai-codex/gpt-5.5`
- การอ้างอิง native Codex app-server harness: `openai/gpt-5.5` พร้อม `agents.defaults.embeddedHarness.runtime: "codex"`
- การอ้างอิงโมเดลแบบเดิม: `codex/gpt-*`
- ขอบเขต Plugin: `openai-codex/*` จะโหลด OpenAI Plugin; native Codex
  app-server plugin จะถูกเลือกเฉพาะโดย Codex harness runtime หรือ
  การอ้างอิง `codex/*` แบบเดิม
- CLI: `openclaw onboard --auth-choice openai-codex` หรือ `openclaw models auth login --provider openai-codex`
- transport เริ่มต้นคือ `auto` (WebSocket ก่อน, SSE fallback)
- override ต่อโมเดล PI ผ่าน `agents.defaults.models["openai-codex/<model>"].params.transport` (`"sse"`, `"websocket"` หรือ `"auto"`)
- `params.serviceTier` จะถูกส่งต่อด้วยบนคำขอ native Codex Responses (`chatgpt.com/backend-api`)
- ส่วนหัว attribution ที่ซ่อนไว้ของ OpenClaw (`originator`, `version`,
  `User-Agent`) จะถูกแนบเฉพาะกับทราฟฟิก Codex เนทีฟไปยัง
  `chatgpt.com/backend-api` ไม่ใช่ generic OpenAI-compatible proxies
- ใช้สวิตช์ `/fast` ร่วมกันและ config `params.fastMode` แบบเดียวกับ `openai/*` โดยตรง; OpenClaw จะแมปสิ่งนี้ไปยัง `service_tier=priority`
- `openai-codex/gpt-5.5` คงค่าเนทีฟ `contextWindow = 1000000` และค่า runtime เริ่มต้น `contextTokens = 272000`; override เพดานรันไทม์ได้ด้วย `models.providers.openai-codex.models[].contextTokens`
- หมายเหตุนโยบาย: OpenAI Codex OAuth รองรับอย่างชัดเจนสำหรับเครื่องมือ/เวิร์กโฟลว์ภายนอกอย่าง OpenClaw
- การเข้าถึง GPT-5.5 ปัจจุบันใช้เส้นทาง OAuth/subscription นี้จนกว่า OpenAI จะเปิดใช้ GPT-5.5 บน public API

```json5
{
  agents: { defaults: { model: { primary: "openai-codex/gpt-5.5" } } },
}
```

```json5
{
  models: {
    providers: {
      "openai-codex": {
        models: [{ id: "gpt-5.5", contextTokens: 160000 }],
      },
    },
  },
}
```

### ตัวเลือกโฮสต์แบบ subscription อื่น ๆ

- [Qwen Cloud](/th/providers/qwen): พื้นผิวผู้ให้บริการ Qwen Cloud พร้อมการแมป endpoint ของ Alibaba DashScope และ Coding Plan
- [MiniMax](/th/providers/minimax): การเข้าถึง MiniMax Coding Plan ผ่าน OAuth หรือ API key
- [GLM Models](/th/providers/glm): endpoint ของ Z.AI Coding Plan หรือ API ทั่วไป

### OpenCode

- Auth: `OPENCODE_API_KEY` (หรือ `OPENCODE_ZEN_API_KEY`)
- ผู้ให้บริการรันไทม์ Zen: `opencode`
- ผู้ให้บริการรันไทม์ Go: `opencode-go`
- โมเดลตัวอย่าง: `opencode/claude-opus-4-6`, `opencode-go/kimi-k2.5`
- CLI: `openclaw onboard --auth-choice opencode-zen` หรือ `openclaw onboard --auth-choice opencode-go`

```json5
{
  agents: { defaults: { model: { primary: "opencode/claude-opus-4-6" } } },
}
```

### Google Gemini (API key)

- ผู้ให้บริการ: `google`
- Auth: `GEMINI_API_KEY`
- การหมุนเวียนแบบไม่บังคับ: `GEMINI_API_KEYS`, `GEMINI_API_KEY_1`, `GEMINI_API_KEY_2`, `GOOGLE_API_KEY` แบบ fallback และ `OPENCLAW_LIVE_GEMINI_KEY` (override เดี่ยว)
- โมเดลตัวอย่าง: `google/gemini-3.1-pro-preview`, `google/gemini-3-flash-preview`
- ความเข้ากันได้: config OpenClaw แบบเดิมที่ใช้ `google/gemini-3.1-flash-preview` จะถูก normalize เป็น `google/gemini-3-flash-preview`
- CLI: `openclaw onboard --auth-choice gemini-api-key`
- การรัน Gemini โดยตรงยังยอมรับ `agents.defaults.models["google/<model>"].params.cachedContent`
  (หรือ `cached_content` แบบเดิม) เพื่อส่งต่อ handle
  `cachedContents/...` แบบเนทีฟของผู้ให้บริการ; Gemini cache hit จะแสดงเป็น OpenClaw `cacheRead`

### Google Vertex และ Gemini CLI

- ผู้ให้บริการ: `google-vertex`, `google-gemini-cli`
- Auth: Vertex ใช้ gcloud ADC; Gemini CLI ใช้โฟลว์ OAuth ของตัวเอง
- ข้อควรระวัง: Gemini CLI OAuth ใน OpenClaw เป็นการเชื่อมต่อที่ไม่เป็นทางการ ผู้ใช้บางรายรายงานข้อจำกัดของบัญชี Google หลังจากใช้ไคลเอนต์ของบุคคลที่สาม โปรดทบทวนข้อกำหนดของ Google และใช้บัญชีที่ไม่สำคัญหากคุณเลือกดำเนินการต่อ
- Gemini CLI OAuth มาพร้อมเป็นส่วนหนึ่งของ `google` Plugin ที่ bundled ไว้
  - ติดตั้ง Gemini CLI ก่อน:
    - `brew install gemini-cli`
    - หรือ `npm install -g @google/gemini-cli`
  - เปิดใช้: `openclaw plugins enable google`
  - เข้าสู่ระบบ: `openclaw models auth login --provider google-gemini-cli --set-default`
  - โมเดลเริ่มต้น: `google-gemini-cli/gemini-3-flash-preview`
  - หมายเหตุ: คุณ **ไม่** ต้องวาง client id หรือ secret ลงใน `openclaw.json` โฟลว์ login ของ CLI จะเก็บ
    โทเค็นไว้ในโปรไฟล์ auth บนโฮสต์ gateway
  - หากคำขอล้มเหลวหลังเข้าสู่ระบบ ให้ตั้งค่า `GOOGLE_CLOUD_PROJECT` หรือ `GOOGLE_CLOUD_PROJECT_ID` บนโฮสต์ gateway
  - คำตอบ JSON ของ Gemini CLI จะถูก parse จาก `response`; การใช้งานจะ fallback ไปที่
    `stats` โดย `stats.cached` จะถูก normalize เป็น OpenClaw `cacheRead`

### Z.AI (GLM)

- ผู้ให้บริการ: `zai`
- Auth: `ZAI_API_KEY`
- โมเดลตัวอย่าง: `zai/glm-5.1`
- CLI: `openclaw onboard --auth-choice zai-api-key`
  - ชื่อเรียกแทน: `z.ai/*` และ `z-ai/*` จะถูก normalize เป็น `zai/*`
  - `zai-api-key` จะตรวจจับ endpoint Z.AI ที่ตรงกันโดยอัตโนมัติ; `zai-coding-global`, `zai-coding-cn`, `zai-global` และ `zai-cn` จะบังคับใช้พื้นผิวเฉพาะ

### Vercel AI Gateway

- ผู้ให้บริการ: `vercel-ai-gateway`
- Auth: `AI_GATEWAY_API_KEY`
- โมเดลตัวอย่าง: `vercel-ai-gateway/anthropic/claude-opus-4.6`,
  `vercel-ai-gateway/moonshotai/kimi-k2.6`
- CLI: `openclaw onboard --auth-choice ai-gateway-api-key`

### Kilo Gateway

- ผู้ให้บริการ: `kilocode`
- Auth: `KILOCODE_API_KEY`
- โมเดลตัวอย่าง: `kilocode/kilo/auto`
- CLI: `openclaw onboard --auth-choice kilocode-api-key`
- Base URL: `https://api.kilo.ai/api/gateway/`
- แค็ตตาล็อก fallback แบบคงที่มาพร้อม `kilocode/kilo/auto`; การค้นพบแบบ live จาก
  `https://api.kilo.ai/api/gateway/models` สามารถขยายแค็ตตาล็อกรันไทม์
  เพิ่มเติมได้
- การกำหนดเส้นทาง upstream ที่แน่นอนเบื้องหลัง `kilocode/kilo/auto` เป็นของ Kilo Gateway
  ไม่ได้ถูกฮาร์ดโค้ดไว้ใน OpenClaw

ดู [/providers/kilocode](/th/providers/kilocode) สำหรับรายละเอียดการตั้งค่า

### provider plugins แบบ bundled อื่น ๆ

| Provider                | Id                               | Auth env                                                     | Example model                                   |
| ----------------------- | -------------------------------- | ------------------------------------------------------------ | ----------------------------------------------- |
| BytePlus                | `byteplus` / `byteplus-plan`     | `BYTEPLUS_API_KEY`                                           | `byteplus-plan/ark-code-latest`                 |
| Cerebras                | `cerebras`                       | `CEREBRAS_API_KEY`                                           | `cerebras/zai-glm-4.7`                          |
| Cloudflare AI Gateway   | `cloudflare-ai-gateway`          | `CLOUDFLARE_AI_GATEWAY_API_KEY`                              | —                                               |
| GitHub Copilot          | `github-copilot`                 | `COPILOT_GITHUB_TOKEN` / `GH_TOKEN` / `GITHUB_TOKEN`         | —                                               |
| Groq                    | `groq`                           | `GROQ_API_KEY`                                               | —                                               |
| Hugging Face Inference  | `huggingface`                    | `HUGGINGFACE_HUB_TOKEN` or `HF_TOKEN`                        | `huggingface/deepseek-ai/DeepSeek-R1`           |
| Kilo Gateway            | `kilocode`                       | `KILOCODE_API_KEY`                                           | `kilocode/kilo/auto`                            |
| Kimi Coding             | `kimi`                           | `KIMI_API_KEY` or `KIMICODE_API_KEY`                         | `kimi/kimi-code`                                |
| MiniMax                 | `minimax` / `minimax-portal`     | `MINIMAX_API_KEY` / `MINIMAX_OAUTH_TOKEN`                    | `minimax/MiniMax-M2.7`                          |
| Mistral                 | `mistral`                        | `MISTRAL_API_KEY`                                            | `mistral/mistral-large-latest`                  |
| Moonshot                | `moonshot`                       | `MOONSHOT_API_KEY`                                           | `moonshot/kimi-k2.6`                            |
| NVIDIA                  | `nvidia`                         | `NVIDIA_API_KEY`                                             | `nvidia/nvidia/llama-3.1-nemotron-70b-instruct` |
| OpenRouter              | `openrouter`                     | `OPENROUTER_API_KEY`                                         | `openrouter/auto`                               |
| Qianfan                 | `qianfan`                        | `QIANFAN_API_KEY`                                            | `qianfan/deepseek-v3.2`                         |
| Qwen Cloud              | `qwen`                           | `QWEN_API_KEY` / `MODELSTUDIO_API_KEY` / `DASHSCOPE_API_KEY` | `qwen/qwen3.5-plus`                             |
| StepFun                 | `stepfun` / `stepfun-plan`       | `STEPFUN_API_KEY`                                            | `stepfun/step-3.5-flash`                        |
| Together                | `together`                       | `TOGETHER_API_KEY`                                           | `together/moonshotai/Kimi-K2.5`                 |
| Venice                  | `venice`                         | `VENICE_API_KEY`                                             | —                                               |
| Vercel AI Gateway       | `vercel-ai-gateway`              | `AI_GATEWAY_API_KEY`                                         | `vercel-ai-gateway/anthropic/claude-opus-4.6`   |
| Volcano Engine (Doubao) | `volcengine` / `volcengine-plan` | `VOLCANO_ENGINE_API_KEY`                                     | `volcengine-plan/ark-code-latest`               |
| xAI                     | `xai`                            | `XAI_API_KEY`                                                | `xai/grok-4`                                    |
| Xiaomi                  | `xiaomi`                         | `XIAOMI_API_KEY`                                             | `xiaomi/mimo-v2-flash`                          |

ข้อสังเกตที่ควรรู้:

- **OpenRouter** จะใช้ส่วนหัว app-attribution และตัวทำเครื่องหมาย Anthropic `cache_control` เฉพาะบนเส้นทาง `openrouter.ai` ที่ผ่านการยืนยันแล้วเท่านั้น เนื่องจากเป็นเส้นทาง proxy-style ที่เข้ากันได้กับ OpenAI จึงจะข้ามการจัดรูปแบบเฉพาะ OpenAI แบบเนทีฟ (`serviceTier`, Responses `store`, คำใบ้ prompt-cache, ความเข้ากันได้ของ OpenAI reasoning) การอ้างอิงที่รองรับโดย Gemini จะยังคงใช้การทำความสะอาด thought-signature ของ proxy-Gemini เท่านั้น
- **Kilo Gateway** การอ้างอิงที่รองรับโดย Gemini จะทำตามเส้นทางการทำความสะอาดของ proxy-Gemini แบบเดียวกัน; `kilocode/kilo/auto` และการอ้างอิงอื่น ๆ ที่ไม่รองรับ proxy-reasoning จะข้ามการแทรก proxy reasoning
- **MiniMax** การ onboarding ด้วย API key จะเขียนคำจำกัดความโมเดล M2.7 แบบชัดเจนพร้อม `input: ["text", "image"]`; แค็ตตาล็อกที่มาพร้อมจะคงการอ้างอิงแชตไว้เป็นข้อความอย่างเดียวจนกว่าจะมีการ materialize config นั้น
- **xAI** ใช้เส้นทาง xAI Responses `/fast` หรือ `params.fastMode: true` จะเขียน `grok-3`, `grok-3-mini`, `grok-4` และ `grok-4-0709` ใหม่เป็นรุ่น `*-fast` ของแต่ละตัว `tool_stream` เปิดใช้เป็นค่าเริ่มต้น; ปิดได้ผ่าน `agents.defaults.models["xai/<model>"].params.tool_stream=false`
- **Cerebras** โมเดล GLM ใช้ `zai-glm-4.7` / `zai-glm-4.6`; base URL ที่เข้ากันได้กับ OpenAI คือ `https://api.cerebras.ai/v1`

## ผู้ให้บริการผ่าน `models.providers` (กำหนดเอง/base URL)

ใช้ `models.providers` (หรือ `models.json`) เพื่อเพิ่ม **ผู้ให้บริการแบบกำหนดเอง** หรือ
proxy ที่เข้ากันได้กับ OpenAI/Anthropic

provider plugins แบบ bundled ด้านล่างจำนวนมากมีแค็ตตาล็อกเริ่มต้นเผยแพร่อยู่แล้ว
ให้ใช้รายการ `models.providers.<id>` แบบชัดเจนเฉพาะเมื่อคุณต้องการ override
base URL, headers หรือรายการโมเดลเริ่มต้น

### Moonshot AI (Kimi)

Moonshot มาพร้อมเป็น bundled provider plugin โดยค่าเริ่มต้นให้ใช้ผู้ให้บริการที่มีมาในตัว
และเพิ่มรายการ `models.providers.moonshot` แบบชัดเจนเฉพาะเมื่อคุณ
ต้องการ override base URL หรือเมทาดาทาของโมเดล:

- Provider: `moonshot`
- Auth: `MOONSHOT_API_KEY`
- โมเดลตัวอย่าง: `moonshot/kimi-k2.6`
- CLI: `openclaw onboard --auth-choice moonshot-api-key` หรือ `openclaw onboard --auth-choice moonshot-api-key-cn`

รหัสโมเดล Kimi K2:

[//]: # "moonshot-kimi-k2-model-refs:start"

- `moonshot/kimi-k2.6`
- `moonshot/kimi-k2.5`
- `moonshot/kimi-k2-thinking`
- `moonshot/kimi-k2-thinking-turbo`
- `moonshot/kimi-k2-turbo`

[//]: # "moonshot-kimi-k2-model-refs:end"

```json5
{
  agents: {
    defaults: { model: { primary: "moonshot/kimi-k2.6" } },
  },
  models: {
    mode: "merge",
    providers: {
      moonshot: {
        baseUrl: "https://api.moonshot.ai/v1",
        apiKey: "${MOONSHOT_API_KEY}",
        api: "openai-completions",
        models: [{ id: "kimi-k2.6", name: "Kimi K2.6" }],
      },
    },
  },
}
```

### Kimi Coding

Kimi Coding ใช้ endpoint แบบเข้ากันได้กับ Anthropic ของ Moonshot AI:

- Provider: `kimi`
- Auth: `KIMI_API_KEY`
- โมเดลตัวอย่าง: `kimi/kimi-code`

```json5
{
  env: { KIMI_API_KEY: "sk-..." },
  agents: {
    defaults: { model: { primary: "kimi/kimi-code" } },
  },
}
```

`kimi/k2p5` แบบเดิมยังคงยอมรับเป็น model id เพื่อความเข้ากันได้

### Volcano Engine (Doubao)

Volcano Engine (火山引擎) ให้การเข้าถึง Doubao และโมเดลอื่น ๆ ในจีน

- Provider: `volcengine` (สาย coding: `volcengine-plan`)
- Auth: `VOLCANO_ENGINE_API_KEY`
- โมเดลตัวอย่าง: `volcengine-plan/ark-code-latest`
- CLI: `openclaw onboard --auth-choice volcengine-api-key`

```json5
{
  agents: {
    defaults: { model: { primary: "volcengine-plan/ark-code-latest" } },
  },
}
```

Onboarding จะใช้พื้นผิวสาย coding เป็นค่าเริ่มต้น แต่แค็ตตาล็อกทั่วไป `volcengine/*`
ก็จะถูกลงทะเบียนพร้อมกันในเวลาเดียวกัน

ในตัวเลือกโมเดลของ onboarding/configure ตัวเลือก auth ของ Volcengine จะให้ความสำคัญกับทั้งแถว
`volcengine/*` และ `volcengine-plan/*` หากโมเดลเหล่านั้นยังไม่ถูกโหลด OpenClaw จะ fallback ไปยังแค็ตตาล็อกที่ไม่กรองแทนการแสดงตัวเลือกแบบมีขอบเขตผู้ให้บริการที่ว่างเปล่า

โมเดลที่มีให้ใช้:

- `volcengine/doubao-seed-1-8-251228` (Doubao Seed 1.8)
- `volcengine/doubao-seed-code-preview-251028`
- `volcengine/kimi-k2-5-260127` (Kimi K2.5)
- `volcengine/glm-4-7-251222` (GLM 4.7)
- `volcengine/deepseek-v3-2-251201` (DeepSeek V3.2 128K)

โมเดลสาย coding (`volcengine-plan`):

- `volcengine-plan/ark-code-latest`
- `volcengine-plan/doubao-seed-code`
- `volcengine-plan/kimi-k2.5`
- `volcengine-plan/kimi-k2-thinking`
- `volcengine-plan/glm-4.7`

### BytePlus (นานาชาติ)

BytePlus ARK ให้การเข้าถึงโมเดลชุดเดียวกันกับ Volcano Engine สำหรับผู้ใช้นานาชาติ

- Provider: `byteplus` (สาย coding: `byteplus-plan`)
- Auth: `BYTEPLUS_API_KEY`
- โมเดลตัวอย่าง: `byteplus-plan/ark-code-latest`
- CLI: `openclaw onboard --auth-choice byteplus-api-key`

```json5
{
  agents: {
    defaults: { model: { primary: "byteplus-plan/ark-code-latest" } },
  },
}
```

Onboarding จะใช้พื้นผิวสาย coding เป็นค่าเริ่มต้น แต่แค็ตตาล็อกทั่วไป `byteplus/*`
ก็จะถูกลงทะเบียนพร้อมกันในเวลาเดียวกัน

ในตัวเลือกโมเดลของ onboarding/configure ตัวเลือก auth ของ BytePlus จะให้ความสำคัญกับทั้ง
แถว `byteplus/*` และ `byteplus-plan/*` หากโมเดลเหล่านั้นยังไม่ถูกโหลด
OpenClaw จะ fallback ไปยังแค็ตตาล็อกที่ไม่กรองแทนการแสดงตัวเลือกแบบมีขอบเขตผู้ให้บริการที่ว่างเปล่า

โมเดลที่มีให้ใช้:

- `byteplus/seed-1-8-251228` (Seed 1.8)
- `byteplus/kimi-k2-5-260127` (Kimi K2.5)
- `byteplus/glm-4-7-251222` (GLM 4.7)

โมเดลสาย coding (`byteplus-plan`):

- `byteplus-plan/ark-code-latest`
- `byteplus-plan/doubao-seed-code`
- `byteplus-plan/kimi-k2.5`
- `byteplus-plan/kimi-k2-thinking`
- `byteplus-plan/glm-4.7`

### Synthetic

Synthetic ให้โมเดลที่เข้ากันได้กับ Anthropic ภายใต้ผู้ให้บริการ `synthetic`:

- Provider: `synthetic`
- Auth: `SYNTHETIC_API_KEY`
- โมเดลตัวอย่าง: `synthetic/hf:MiniMaxAI/MiniMax-M2.5`
- CLI: `openclaw onboard --auth-choice synthetic-api-key`

```json5
{
  agents: {
    defaults: { model: { primary: "synthetic/hf:MiniMaxAI/MiniMax-M2.5" } },
  },
  models: {
    mode: "merge",
    providers: {
      synthetic: {
        baseUrl: "https://api.synthetic.new/anthropic",
        apiKey: "${SYNTHETIC_API_KEY}",
        api: "anthropic-messages",
        models: [{ id: "hf:MiniMaxAI/MiniMax-M2.5", name: "MiniMax M2.5" }],
      },
    },
  },
}
```

### MiniMax

MiniMax ถูกกำหนดค่าผ่าน `models.providers` เพราะใช้ endpoint แบบกำหนดเอง:

- MiniMax OAuth (Global): `--auth-choice minimax-global-oauth`
- MiniMax OAuth (CN): `--auth-choice minimax-cn-oauth`
- MiniMax API key (Global): `--auth-choice minimax-global-api`
- MiniMax API key (CN): `--auth-choice minimax-cn-api`
- Auth: `MINIMAX_API_KEY` สำหรับ `minimax`; `MINIMAX_OAUTH_TOKEN` หรือ
  `MINIMAX_API_KEY` สำหรับ `minimax-portal`

ดู [/providers/minimax](/th/providers/minimax) สำหรับรายละเอียดการตั้งค่า ตัวเลือกโมเดล และตัวอย่าง config

บนเส้นทางสตรีมมิงที่เข้ากันได้กับ Anthropic ของ MiniMax OpenClaw จะปิดการคิดไว้โดย
ค่าเริ่มต้น เว้นแต่คุณจะตั้งค่าไว้อย่างชัดเจน และ `/fast on` จะเขียน
`MiniMax-M2.7` ใหม่เป็น `MiniMax-M2.7-highspeed`

การแยก capability ที่เป็นเจ้าของโดย Plugin:

- ค่าเริ่มต้นของข้อความ/แชตยังคงอยู่ที่ `minimax/MiniMax-M2.7`
- การสร้างภาพคือ `minimax/image-01` หรือ `minimax-portal/image-01`
- การทำความเข้าใจภาพคือ `MiniMax-VL-01` ที่เป็นของ Plugin บนทั้งสองเส้นทาง auth ของ MiniMax
- การค้นหาเว็บยังคงอยู่บน provider id `minimax`

### LM Studio

LM Studio มาพร้อมเป็น bundled provider plugin ซึ่งใช้ API แบบเนทีฟ:

- Provider: `lmstudio`
- Auth: `LM_API_TOKEN`
- base URL การอนุมานเริ่มต้น: `http://localhost:1234/v1`

จากนั้นตั้งค่าโมเดล (แทนที่ด้วยหนึ่งใน ID ที่ส่งกลับจาก `http://localhost:1234/api/v1/models`):

```json5
{
  agents: {
    defaults: { model: { primary: "lmstudio/openai/gpt-oss-20b" } },
  },
}
```

OpenClaw ใช้ `/api/v1/models` และ `/api/v1/models/load` แบบเนทีฟของ LM Studio สำหรับการค้นพบ + การโหลดอัตโนมัติ โดยใช้ `/v1/chat/completions` สำหรับการอนุมานเป็นค่าเริ่มต้น
ดู [/providers/lmstudio](/th/providers/lmstudio) สำหรับการตั้งค่าและการแก้ไขปัญหา

### Ollama

Ollama มาพร้อมเป็น bundled provider plugin และใช้ API แบบเนทีฟของ Ollama:

- ผู้ให้บริการ: `ollama`
- Auth: ไม่จำเป็นต้องมี (เซิร์ฟเวอร์ในเครื่อง)
- โมเดลตัวอย่าง: `ollama/llama3.3`
- การติดตั้ง: [https://ollama.com/download](https://ollama.com/download)

```bash
# Install Ollama, then pull a model:
ollama pull llama3.3
```

```json5
{
  agents: {
    defaults: { model: { primary: "ollama/llama3.3" } },
  },
}
```

ระบบจะตรวจพบ Ollama ในเครื่องที่ `http://127.0.0.1:11434` เมื่อคุณเลือกใช้ด้วย
`OLLAMA_API_KEY` และ bundled provider plugin จะเพิ่ม Ollama โดยตรงเข้าไปใน
`openclaw onboard` และตัวเลือกโมเดล ดู [/providers/ollama](/th/providers/ollama)
สำหรับ onboarding, โหมด cloud/local และการกำหนดค่าแบบกำหนดเอง

### vLLM

vLLM มาพร้อมเป็น bundled provider plugin สำหรับเซิร์ฟเวอร์ที่เข้ากันได้กับ OpenAI แบบ local/self-hosted:

- ผู้ให้บริการ: `vllm`
- Auth: ไม่บังคับ (ขึ้นอยู่กับเซิร์ฟเวอร์ของคุณ)
- base URL เริ่มต้น: `http://127.0.0.1:8000/v1`

หากต้องการเลือกใช้การค้นพบอัตโนมัติในเครื่อง (ใช้ค่าใดก็ได้หากเซิร์ฟเวอร์ของคุณไม่บังคับ auth):

```bash
export VLLM_API_KEY="vllm-local"
```

จากนั้นตั้งค่าโมเดล (แทนที่ด้วยหนึ่งใน ID ที่ส่งกลับจาก `/v1/models`):

```json5
{
  agents: {
    defaults: { model: { primary: "vllm/your-model-id" } },
  },
}
```

ดู [/providers/vllm](/th/providers/vllm) สำหรับรายละเอียด

### SGLang

SGLang มาพร้อมเป็น bundled provider plugin สำหรับเซิร์ฟเวอร์ที่เข้ากันได้กับ OpenAI แบบ self-hosted ความเร็วสูง:

- ผู้ให้บริการ: `sglang`
- Auth: ไม่บังคับ (ขึ้นอยู่กับเซิร์ฟเวอร์ของคุณ)
- base URL เริ่มต้น: `http://127.0.0.1:30000/v1`

หากต้องการเลือกใช้การค้นพบอัตโนมัติในเครื่อง (ใช้ค่าใดก็ได้หากเซิร์ฟเวอร์ของคุณไม่ได้
บังคับ auth):

```bash
export SGLANG_API_KEY="sglang-local"
```

จากนั้นตั้งค่าโมเดล (แทนที่ด้วยหนึ่งใน ID ที่ส่งกลับจาก `/v1/models`):

```json5
{
  agents: {
    defaults: { model: { primary: "sglang/your-model-id" } },
  },
}
```

ดู [/providers/sglang](/th/providers/sglang) สำหรับรายละเอียด

### พร็อกซีในเครื่อง (LM Studio, vLLM, LiteLLM เป็นต้น)

ตัวอย่าง (เข้ากันได้กับ OpenAI):

```json5
{
  agents: {
    defaults: {
      model: { primary: "lmstudio/my-local-model" },
      models: { "lmstudio/my-local-model": { alias: "Local" } },
    },
  },
  models: {
    providers: {
      lmstudio: {
        baseUrl: "http://localhost:1234/v1",
        apiKey: "${LM_API_TOKEN}",
        api: "openai-completions",
        models: [
          {
            id: "my-local-model",
            name: "Local Model",
            reasoning: false,
            input: ["text"],
            cost: { input: 0, output: 0, cacheRead: 0, cacheWrite: 0 },
            contextWindow: 200000,
            maxTokens: 8192,
          },
        ],
      },
    },
  },
}
```

หมายเหตุ:

- สำหรับผู้ให้บริการแบบกำหนดเอง `reasoning`, `input`, `cost`, `contextWindow` และ `maxTokens` เป็นตัวเลือกเสริม
  หากไม่ระบุ OpenClaw จะใช้ค่าเริ่มต้นดังนี้:
  - `reasoning: false`
  - `input: ["text"]`
  - `cost: { input: 0, output: 0, cacheRead: 0, cacheWrite: 0 }`
  - `contextWindow: 200000`
  - `maxTokens: 8192`
- แนะนำ: ให้ตั้งค่าที่ชัดเจนให้ตรงกับข้อจำกัดของพร็อกซี/โมเดลของคุณ
- สำหรับ `api: "openai-completions"` บน endpoint ที่ไม่ใช่แบบเนทีฟ (ทุก `baseUrl` ที่ไม่ว่างซึ่ง host ไม่ใช่ `api.openai.com`) OpenClaw จะบังคับ `compat.supportsDeveloperRole: false` เพื่อหลีกเลี่ยงข้อผิดพลาด 400 จากผู้ให้บริการในกรณีที่ไม่รองรับ role แบบ `developer`
- เส้นทางแบบพร็อกซีที่เข้ากันได้กับ OpenAI จะข้ามการจัดรูปคำขอเฉพาะ OpenAI แบบเนทีฟด้วย:
  ไม่มี `service_tier`, ไม่มี Responses `store`, ไม่มีคำใบ้ prompt-cache, ไม่มี
  การจัดรูป payload เพื่อความเข้ากันได้กับ OpenAI reasoning และไม่มีส่วนหัว attribution
  ที่ซ่อนไว้ของ OpenClaw
- หาก `baseUrl` ว่าง/ไม่ระบุ OpenClaw จะคงพฤติกรรม OpenAI เริ่มต้นไว้ (ซึ่ง resolve ไปที่ `api.openai.com`)
- เพื่อความปลอดภัย แม้จะระบุ `compat.supportsDeveloperRole: true` อย่างชัดเจน ก็ยังจะถูก override บน endpoint `openai-completions` ที่ไม่ใช่แบบเนทีฟ

## ตัวอย่าง CLI

```bash
openclaw onboard --auth-choice opencode-zen
openclaw models set opencode/claude-opus-4-6
openclaw models list
```

ดูเพิ่มเติม: [/gateway/configuration](/th/gateway/configuration) สำหรับตัวอย่างการกำหนดค่าแบบเต็ม

## ที่เกี่ยวข้อง

- [โมเดล](/th/concepts/models) — การกำหนดค่าโมเดลและ aliases
- [Model Failover](/th/concepts/model-failover) — fallback chains และพฤติกรรมการลองใหม่
- [ข้อมูลอ้างอิงการกำหนดค่า](/th/gateway/config-agents#agent-defaults) — คีย์ config ของโมเดล
- [Providers](/th/providers) — คู่มือการตั้งค่าแยกตามผู้ให้บริการ
