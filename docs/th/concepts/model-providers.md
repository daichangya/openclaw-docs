---
read_when:
    - คุณต้องการเอกสารอ้างอิงการตั้งค่าโมเดลแยกตามผู้ให้บริการแต่ละราย
    - คุณต้องการตัวอย่างการตั้งค่าหรือคำสั่งเริ่มต้นใช้งาน CLI สำหรับผู้ให้บริการโมเดล
summary: ภาพรวมผู้ให้บริการโมเดลพร้อมตัวอย่างการตั้งค่า + ขั้นตอนการทำงานของ CLI
title: ผู้ให้บริการโมเดล
x-i18n:
    generated_at: "2026-04-24T15:22:05Z"
    model: gpt-5.4
    provider: openai
    source_hash: 79258cb26fae7926c65b6fe0db938c7b5736a540b33bc24c1fad5ad706ac8204
    source_path: concepts/model-providers.md
    workflow: 15
---

หน้านี้ครอบคลุม**ผู้ให้บริการ LLM/โมเดล** (ไม่ใช่ช่องทางแชตอย่าง WhatsApp/Telegram)
สำหรับกฎการเลือกโมเดล ดูที่ [/concepts/models](/th/concepts/models)

## กฎแบบรวดเร็ว

- การอ้างอิงโมเดลใช้ `provider/model` (ตัวอย่าง: `opencode/claude-opus-4-6`)
- `agents.defaults.models` ทำหน้าที่เป็นรายการที่อนุญาตเมื่อมีการตั้งค่า
- ตัวช่วย CLI: `openclaw onboard`, `openclaw models list`, `openclaw models set <provider/model>`
- `models.providers.*.models[].contextWindow` คือข้อมูลเมตาโมเดลแบบเนทีฟ; `contextTokens` คือขีดจำกัดขณะรันจริงที่มีผล
- กฎการสลับไปใช้โมเดลสำรอง, การตรวจสอบคูลดาวน์, และการคงอยู่ของการแทนที่เซสชัน: [Model failover](/th/concepts/model-failover)
- เส้นทางตระกูล OpenAI แยกตามคำนำหน้า: `openai/<model>` ใช้ผู้ให้บริการคีย์ API ของ OpenAI โดยตรงใน PI, `openai-codex/<model>` ใช้ Codex OAuth ใน PI, และ `openai/<model>` ร่วมกับ `agents.defaults.embeddedHarness.runtime: "codex"` ใช้ harness app-server ของ Codex แบบเนทีฟ ดู [OpenAI](/th/providers/openai) และ [Codex harness](/th/plugins/codex-harness)
- การเปิดใช้งาน Plugin อัตโนมัติก็ยึดขอบเขตเดียวกันนั้น: `openai-codex/<model>` อยู่ภายใต้ OpenAI Plugin ส่วน Codex Plugin จะถูกเปิดใช้งานโดย `embeddedHarness.runtime: "codex"` หรือการอ้างอิงแบบเดิม `codex/<model>`
- ขณะนี้ GPT-5.5 ใช้งานได้ผ่านเส้นทาง subscription/OAuth: `openai-codex/gpt-5.5` ใน PI หรือ `openai/gpt-5.5` พร้อม Codex app-server harness เส้นทางคีย์ API โดยตรงสำหรับ `openai/gpt-5.5` จะรองรับเมื่อ OpenAI เปิดใช้ GPT-5.5 บน public API; ก่อนหน้านั้นให้ใช้โมเดลที่เปิดใช้ API แล้ว เช่น `openai/gpt-5.4` สำหรับการตั้งค่า `OPENAI_API_KEY`

## พฤติกรรมผู้ให้บริการที่เป็นเจ้าของโดย Plugin

ลอจิกเฉพาะของผู้ให้บริการส่วนใหญ่อยู่ใน provider plugins (`registerProvider(...)`) ขณะที่ OpenClaw คงลูปการทำ inference แบบทั่วไปไว้ Plugin เป็นผู้ดูแล onboarding, แค็ตตาล็อกโมเดล, การแมปตัวแปรสภาพแวดล้อมสำหรับการยืนยันตัวตน, การปรับการขนส่ง/การตั้งค่าให้เป็นรูปแบบปกติ, การทำความสะอาด schema ของเครื่องมือ, การจัดหมวดหมู่ failover, การรีเฟรช OAuth, การรายงานการใช้งาน, โปรไฟล์ thinking/reasoning และอื่นๆ

รายการเต็มของ hook ใน provider-SDK และตัวอย่าง bundled-plugin อยู่ที่ [Provider plugins](/th/plugins/sdk-provider-plugins) ผู้ให้บริการที่ต้องใช้ตัวดำเนินการคำขอแบบกำหนดเองทั้งหมดจะเป็นพื้นผิวการขยายอีกแบบหนึ่งที่ลึกกว่าและแยกออกไป

<Note>
`capabilities` ของรันไทม์ผู้ให้บริการเป็นข้อมูลเมตาของ runner ที่ใช้ร่วมกัน (ตระกูลผู้ให้บริการ, ความแตกต่างของ transcript/tooling, คำใบ้เกี่ยวกับ transport/cache) ซึ่งไม่เหมือนกับ [public capability model](/th/plugins/architecture#public-capability-model) ที่อธิบายว่า Plugin ลงทะเบียนอะไรไว้บ้าง (text inference, speech ฯลฯ)
</Note>

## การหมุนเวียน API key

- รองรับการหมุนเวียนคีย์แบบทั่วไปสำหรับผู้ให้บริการที่เลือกไว้
- กำหนดค่าหลายคีย์ผ่าน:
  - `OPENCLAW_LIVE_<PROVIDER>_KEY` (การแทนที่ live เดี่ยว ลำดับความสำคัญสูงสุด)
  - `<PROVIDER>_API_KEYS` (รายการคั่นด้วย comma หรือ semicolon)
  - `<PROVIDER>_API_KEY` (คีย์หลัก)
  - `<PROVIDER>_API_KEY_*` (รายการแบบมีหมายเลข เช่น `<PROVIDER>_API_KEY_1`)
- สำหรับผู้ให้บริการ Google จะรวม `GOOGLE_API_KEY` เป็นตัวสำรองด้วย
- ลำดับการเลือกคีย์จะคงลำดับความสำคัญไว้และตัดค่าที่ซ้ำกันออก
- ระบบจะลองคำขอใหม่ด้วยคีย์ถัดไปเฉพาะเมื่อได้รับการตอบกลับแบบ rate-limit เท่านั้น (เช่น `429`, `rate_limit`, `quota`, `resource exhausted`, `Too many
concurrent requests`, `ThrottlingException`, `concurrency limit reached`,
  `workers_ai ... quota limit exceeded` หรือข้อความจำกัดการใช้งานเป็นช่วงๆ)
- ความล้มเหลวที่ไม่ใช่ rate-limit จะล้มเหลวทันที; จะไม่มีการพยายามหมุนเวียนคีย์
- เมื่อคีย์ที่เป็นไปได้ทั้งหมดล้มเหลว จะส่งคืนข้อผิดพลาดสุดท้ายจากการพยายามครั้งล่าสุด

## ผู้ให้บริการในตัว (แค็ตตาล็อก pi-ai)

OpenClaw มาพร้อมกับแค็ตตาล็อก pi‑ai ผู้ให้บริการเหล่านี้ไม่ต้องมีการตั้งค่า `models.providers`; เพียงตั้งค่าการยืนยันตัวตนและเลือกโมเดล

### OpenAI

- ผู้ให้บริการ: `openai`
- การยืนยันตัวตน: `OPENAI_API_KEY`
- การหมุนเวียนเพิ่มเติม: `OPENAI_API_KEYS`, `OPENAI_API_KEY_1`, `OPENAI_API_KEY_2` และ `OPENCLAW_LIVE_OPENAI_KEY` (การแทนที่เดี่ยว)
- โมเดลตัวอย่าง: `openai/gpt-5.4`, `openai/gpt-5.4-mini`
- รองรับ GPT-5.5 แบบ direct API ในอนาคตเมื่อ OpenAI เปิดให้ใช้ GPT-5.5 บน API
- CLI: `openclaw onboard --auth-choice openai-api-key`
- transport เริ่มต้นคือ `auto` (WebSocket ก่อน, SSE เป็นตัวสำรอง)
- แทนที่รายโมเดลผ่าน `agents.defaults.models["openai/<model>"].params.transport` (`"sse"`, `"websocket"` หรือ `"auto"`)
- การวอร์มอัป OpenAI Responses WebSocket เปิดใช้งานเป็นค่าเริ่มต้นผ่าน `params.openaiWsWarmup` (`true`/`false`)
- การประมวลผลแบบลำดับความสำคัญของ OpenAI สามารถเปิดได้ผ่าน `agents.defaults.models["openai/<model>"].params.serviceTier`
- `/fast` และ `params.fastMode` จะจับคู่คำขอ `openai/*` Responses โดยตรงไปยัง `service_tier=priority` บน `api.openai.com`
- ใช้ `params.serviceTier` เมื่อคุณต้องการกำหนด tier อย่างชัดเจนแทนการใช้สวิตช์ `/fast` ร่วมกัน
- ส่วนหัวระบุที่มาของ OpenClaw ที่ซ่อนอยู่ (`originator`, `version`,
  `User-Agent`) จะใช้เฉพาะกับทราฟฟิก OpenAI แบบเนทีฟไปยัง `api.openai.com` เท่านั้น ไม่ใช้กับพร็อกซีแบบ OpenAI-compatible ทั่วไป
- เส้นทาง OpenAI แบบเนทีฟยังคงเก็บ Responses `store`, คำใบ้ prompt-cache และการจัดรูปแบบ payload ให้เข้ากันได้กับ OpenAI reasoning; ส่วนเส้นทางพร็อกซีจะไม่เก็บไว้
- `openai/gpt-5.3-codex-spark` ถูกซ่อนไว้อย่างตั้งใจใน OpenClaw เพราะคำขอ OpenAI API แบบ live ปฏิเสธโมเดลนี้ และแค็ตตาล็อก Codex ปัจจุบันก็ยังไม่เปิดเผยโมเดลนี้

```json5
{
  agents: { defaults: { model: { primary: "openai/gpt-5.4" } } },
}
```

### Anthropic

- ผู้ให้บริการ: `anthropic`
- การยืนยันตัวตน: `ANTHROPIC_API_KEY`
- การหมุนเวียนเพิ่มเติม: `ANTHROPIC_API_KEYS`, `ANTHROPIC_API_KEY_1`, `ANTHROPIC_API_KEY_2` และ `OPENCLAW_LIVE_ANTHROPIC_KEY` (การแทนที่เดี่ยว)
- โมเดลตัวอย่าง: `anthropic/claude-opus-4-6`
- CLI: `openclaw onboard --auth-choice apiKey`
- คำขอ Anthropic สาธารณะแบบตรงรองรับสวิตช์ `/fast` ร่วมกันและ `params.fastMode` รวมถึงทราฟฟิกที่ยืนยันตัวตนด้วย API key และ OAuth ที่ส่งไปยัง `api.anthropic.com`; OpenClaw จะจับคู่สิ่งนี้กับ Anthropic `service_tier` (`auto` เทียบกับ `standard_only`)
- หมายเหตุเกี่ยวกับ Anthropic: ทีมงาน Anthropic แจ้งเราว่าการใช้งาน Claude CLI แบบ OpenClaw ได้รับอนุญาตอีกครั้ง ดังนั้น OpenClaw จึงถือว่าการใช้ Claude CLI ซ้ำและการใช้ `claude -p` เป็นแนวทางที่ได้รับอนุญาตสำหรับการผสานรวมนี้ เว้นแต่ Anthropic จะเผยแพร่นโยบายใหม่
- Anthropic setup-token ยังคงพร้อมใช้งานเป็นเส้นทางโทเค็นที่ OpenClaw รองรับ แต่ตอนนี้ OpenClaw ให้ความสำคัญกับการใช้ Claude CLI ซ้ำและ `claude -p` เมื่อใช้งานได้

```json5
{
  agents: { defaults: { model: { primary: "anthropic/claude-opus-4-6" } } },
}
```

### OpenAI Codex OAuth

- ผู้ให้บริการ: `openai-codex`
- การยืนยันตัวตน: OAuth (ChatGPT)
- การอ้างอิงโมเดล PI: `openai-codex/gpt-5.5`
- การอ้างอิง native Codex app-server harness: `openai/gpt-5.5` พร้อม `agents.defaults.embeddedHarness.runtime: "codex"`
- การอ้างอิงโมเดลแบบเดิม: `codex/gpt-*`
- ขอบเขต Plugin: `openai-codex/*` จะโหลด OpenAI Plugin; native Codex
  app-server Plugin จะถูกเลือกเฉพาะโดยรันไทม์ Codex harness หรือการอ้างอิงแบบเดิม `codex/*`
- CLI: `openclaw onboard --auth-choice openai-codex` หรือ `openclaw models auth login --provider openai-codex`
- transport เริ่มต้นคือ `auto` (WebSocket ก่อน, SSE เป็นตัวสำรอง)
- แทนที่ราย PI model ผ่าน `agents.defaults.models["openai-codex/<model>"].params.transport` (`"sse"`, `"websocket"` หรือ `"auto"`)
- `params.serviceTier` จะถูกส่งต่อบนคำขอ native Codex Responses ด้วย (`chatgpt.com/backend-api`)
- ส่วนหัวระบุที่มาของ OpenClaw ที่ซ่อนอยู่ (`originator`, `version`,
  `User-Agent`) จะถูกแนบเฉพาะกับทราฟฟิก Codex แบบเนทีฟไปยัง
  `chatgpt.com/backend-api` เท่านั้น ไม่ใช้กับพร็อกซีแบบ OpenAI-compatible ทั่วไป
- ใช้สวิตช์ `/fast` และการตั้งค่า `params.fastMode` ร่วมกับ `openai/*` โดย OpenClaw จะจับคู่สิ่งนี้ไปยัง `service_tier=priority`
- `openai-codex/gpt-5.5` คงค่าแบบเนทีฟ `contextWindow = 1000000` และค่าเริ่มต้นรันไทม์ `contextTokens = 272000`; แทนที่ขีดจำกัดรันไทม์ได้ด้วย `models.providers.openai-codex.models[].contextTokens`
- หมายเหตุนโยบาย: OpenAI Codex OAuth รองรับอย่างชัดเจนสำหรับเครื่องมือ/เวิร์กโฟลว์ภายนอกอย่าง OpenClaw
- การเข้าถึง GPT-5.5 ในปัจจุบันใช้เส้นทาง OAuth/subscription นี้จนกว่า OpenAI จะเปิดใช้ GPT-5.5 บน public API

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

### ตัวเลือกโฮสต์แบบ subscription อื่นๆ

- [Qwen Cloud](/th/providers/qwen): พื้นผิวผู้ให้บริการ Qwen Cloud รวมถึงการแมปปลายทาง Alibaba DashScope และ Coding Plan
- [MiniMax](/th/providers/minimax): การเข้าถึง MiniMax Coding Plan ผ่าน OAuth หรือ API key
- [GLM Models](/th/providers/glm): ปลายทาง Z.AI Coding Plan หรือ API ทั่วไป

### OpenCode

- การยืนยันตัวตน: `OPENCODE_API_KEY` (หรือ `OPENCODE_ZEN_API_KEY`)
- ผู้ให้บริการ Zen runtime: `opencode`
- ผู้ให้บริการ Go runtime: `opencode-go`
- โมเดลตัวอย่าง: `opencode/claude-opus-4-6`, `opencode-go/kimi-k2.5`
- CLI: `openclaw onboard --auth-choice opencode-zen` หรือ `openclaw onboard --auth-choice opencode-go`

```json5
{
  agents: { defaults: { model: { primary: "opencode/claude-opus-4-6" } } },
}
```

### Google Gemini (API key)

- ผู้ให้บริการ: `google`
- การยืนยันตัวตน: `GEMINI_API_KEY`
- การหมุนเวียนเพิ่มเติม: `GEMINI_API_KEYS`, `GEMINI_API_KEY_1`, `GEMINI_API_KEY_2`, ตัวสำรอง `GOOGLE_API_KEY` และ `OPENCLAW_LIVE_GEMINI_KEY` (การแทนที่เดี่ยว)
- โมเดลตัวอย่าง: `google/gemini-3.1-pro-preview`, `google/gemini-3-flash-preview`
- ความเข้ากันได้: การตั้งค่า OpenClaw แบบเดิมที่ใช้ `google/gemini-3.1-flash-preview` จะถูกปรับให้เป็น `google/gemini-3-flash-preview`
- CLI: `openclaw onboard --auth-choice gemini-api-key`
- การรัน Gemini โดยตรงยังยอมรับ `agents.defaults.models["google/<model>"].params.cachedContent`
  (หรือ `cached_content` แบบเดิม) เพื่อส่งต่อแฮนเดิล
  `cachedContents/...` แบบเนทีฟของผู้ให้บริการ; การเข้าถึงแคชของ Gemini จะแสดงเป็น OpenClaw `cacheRead`

### Google Vertex และ Gemini CLI

- ผู้ให้บริการ: `google-vertex`, `google-gemini-cli`
- การยืนยันตัวตน: Vertex ใช้ gcloud ADC; Gemini CLI ใช้โฟลว์ OAuth ของตัวเอง
- ข้อควรระวัง: Gemini CLI OAuth ใน OpenClaw เป็นการผสานรวมที่ไม่เป็นทางการ ผู้ใช้บางรายรายงานว่าบัญชี Google ถูกจำกัดหลังจากใช้ไคลเอนต์ของบุคคลที่สาม โปรดตรวจสอบเงื่อนไขของ Google และใช้บัญชีที่ไม่สำคัญหากคุณเลือกดำเนินการต่อ
- Gemini CLI OAuth ถูกส่งมาพร้อมกับ `google` Plugin ที่รวมมาในชุด
  - ติดตั้ง Gemini CLI ก่อน:
    - `brew install gemini-cli`
    - หรือ `npm install -g @google/gemini-cli`
  - เปิดใช้งาน: `openclaw plugins enable google`
  - ล็อกอิน: `openclaw models auth login --provider google-gemini-cli --set-default`
  - โมเดลเริ่มต้น: `google-gemini-cli/gemini-3-flash-preview`
  - หมายเหตุ: คุณ**ไม่ต้อง**วาง client id หรือ secret ลงใน `openclaw.json` โฟลว์การล็อกอินของ CLI จะจัดเก็บ
    โทเค็นไว้ในโปรไฟล์การยืนยันตัวตนบนโฮสต์ Gateway
  - หากคำขอล้มเหลวหลังจากล็อกอิน ให้ตั้งค่า `GOOGLE_CLOUD_PROJECT` หรือ `GOOGLE_CLOUD_PROJECT_ID` บนโฮสต์ Gateway
  - คำตอบ JSON ของ Gemini CLI จะถูกแยกจาก `response`; ข้อมูลการใช้งานจะย้อนกลับไปใช้
    `stats` โดย `stats.cached` จะถูกทำให้เป็นรูปแบบปกติเป็น OpenClaw `cacheRead`

### Z.AI (GLM)

- ผู้ให้บริการ: `zai`
- การยืนยันตัวตน: `ZAI_API_KEY`
- โมเดลตัวอย่าง: `zai/glm-5.1`
- CLI: `openclaw onboard --auth-choice zai-api-key`
  - ชื่อแทน: `z.ai/*` และ `z-ai/*` จะถูกปรับให้เป็น `zai/*`
  - `zai-api-key` จะตรวจจับปลายทาง Z.AI ที่ตรงกันโดยอัตโนมัติ; `zai-coding-global`, `zai-coding-cn`, `zai-global` และ `zai-cn` จะบังคับให้ใช้พื้นผิวที่ระบุ

### Vercel AI Gateway

- ผู้ให้บริการ: `vercel-ai-gateway`
- การยืนยันตัวตน: `AI_GATEWAY_API_KEY`
- โมเดลตัวอย่าง: `vercel-ai-gateway/anthropic/claude-opus-4.6`,
  `vercel-ai-gateway/moonshotai/kimi-k2.6`
- CLI: `openclaw onboard --auth-choice ai-gateway-api-key`

### Kilo Gateway

- ผู้ให้บริการ: `kilocode`
- การยืนยันตัวตน: `KILOCODE_API_KEY`
- โมเดลตัวอย่าง: `kilocode/kilo/auto`
- CLI: `openclaw onboard --auth-choice kilocode-api-key`
- URL พื้นฐาน: `https://api.kilo.ai/api/gateway/`
- แค็ตตาล็อกสำรองแบบคงที่มาพร้อม `kilocode/kilo/auto`; การค้นหาแบบ live จาก
  `https://api.kilo.ai/api/gateway/models` สามารถขยายแค็ตตาล็อกรันไทม์เพิ่มเติมได้
- การกำหนดเส้นทางต้นทางจริงที่อยู่เบื้องหลัง `kilocode/kilo/auto` เป็นความรับผิดชอบของ Kilo Gateway ไม่ได้ฮาร์ดโค้ดไว้ใน OpenClaw

ดูรายละเอียดการตั้งค่าได้ที่ [/providers/kilocode](/th/providers/kilocode)

### bundled provider plugins อื่นๆ

| ผู้ให้บริการ             | Id                               | ตัวแปรสภาพแวดล้อมสำหรับการยืนยันตัวตน                    | โมเดลตัวอย่าง                                  |
| ------------------------ | -------------------------------- | --------------------------------------------------------- | ---------------------------------------------- |
| BytePlus                 | `byteplus` / `byteplus-plan`     | `BYTEPLUS_API_KEY`                                        | `byteplus-plan/ark-code-latest`                |
| Cerebras                 | `cerebras`                       | `CEREBRAS_API_KEY`                                        | `cerebras/zai-glm-4.7`                         |
| Cloudflare AI Gateway    | `cloudflare-ai-gateway`          | `CLOUDFLARE_AI_GATEWAY_API_KEY`                           | —                                              |
| DeepSeek                 | `deepseek`                       | `DEEPSEEK_API_KEY`                                        | `deepseek/deepseek-v4-flash`                   |
| GitHub Copilot           | `github-copilot`                 | `COPILOT_GITHUB_TOKEN` / `GH_TOKEN` / `GITHUB_TOKEN`      | —                                              |
| Groq                     | `groq`                           | `GROQ_API_KEY`                                            | —                                              |
| Hugging Face Inference   | `huggingface`                    | `HUGGINGFACE_HUB_TOKEN` หรือ `HF_TOKEN`                   | `huggingface/deepseek-ai/DeepSeek-R1`          |
| Kilo Gateway             | `kilocode`                       | `KILOCODE_API_KEY`                                        | `kilocode/kilo/auto`                           |
| Kimi Coding              | `kimi`                           | `KIMI_API_KEY` หรือ `KIMICODE_API_KEY`                    | `kimi/kimi-code`                               |
| MiniMax                  | `minimax` / `minimax-portal`     | `MINIMAX_API_KEY` / `MINIMAX_OAUTH_TOKEN`                 | `minimax/MiniMax-M2.7`                         |
| Mistral                  | `mistral`                        | `MISTRAL_API_KEY`                                         | `mistral/mistral-large-latest`                 |
| Moonshot                 | `moonshot`                       | `MOONSHOT_API_KEY`                                        | `moonshot/kimi-k2.6`                           |
| NVIDIA                   | `nvidia`                         | `NVIDIA_API_KEY`                                          | `nvidia/nvidia/llama-3.1-nemotron-70b-instruct` |
| OpenRouter               | `openrouter`                     | `OPENROUTER_API_KEY`                                      | `openrouter/auto`                              |
| Qianfan                  | `qianfan`                        | `QIANFAN_API_KEY`                                         | `qianfan/deepseek-v3.2`                        |
| Qwen Cloud               | `qwen`                           | `QWEN_API_KEY` / `MODELSTUDIO_API_KEY` / `DASHSCOPE_API_KEY` | `qwen/qwen3.5-plus`                          |
| StepFun                  | `stepfun` / `stepfun-plan`       | `STEPFUN_API_KEY`                                         | `stepfun/step-3.5-flash`                       |
| Together                 | `together`                       | `TOGETHER_API_KEY`                                        | `together/moonshotai/Kimi-K2.5`                |
| Venice                   | `venice`                         | `VENICE_API_KEY`                                          | —                                              |
| Vercel AI Gateway        | `vercel-ai-gateway`              | `AI_GATEWAY_API_KEY`                                      | `vercel-ai-gateway/anthropic/claude-opus-4.6`  |
| Volcano Engine (Doubao)  | `volcengine` / `volcengine-plan` | `VOLCANO_ENGINE_API_KEY`                                  | `volcengine-plan/ark-code-latest`              |
| xAI                      | `xai`                            | `XAI_API_KEY`                                             | `xai/grok-4`                                   |
| Xiaomi                   | `xiaomi`                         | `XIAOMI_API_KEY`                                          | `xiaomi/mimo-v2-flash`                         |

ข้อแตกต่างที่ควรรู้:

- **OpenRouter** จะใช้ส่วนหัว app-attribution และตัวทำเครื่องหมาย Anthropic `cache_control` เฉพาะบนเส้นทาง `openrouter.ai` ที่ตรวจสอบแล้วเท่านั้น ในฐานะเส้นทางแบบพร็อกซีที่เข้ากันได้กับ OpenAI ระบบจะข้ามการปรับแต่งที่มีเฉพาะ OpenAI แบบเนทีฟ (`serviceTier`, Responses `store`, คำใบ้ prompt-cache, ความเข้ากันได้ของ OpenAI reasoning) สำหรับการอ้างอิงที่ขับเคลื่อนด้วย Gemini จะคงไว้เฉพาะการทำความสะอาด thought-signature ของ Gemini แบบพร็อกซีเท่านั้น
- **Kilo Gateway** การอ้างอิงที่ขับเคลื่อนด้วย Gemini จะทำตามเส้นทางการทำความสะอาด Gemini แบบพร็อกซีเดียวกัน; `kilocode/kilo/auto` และการอ้างอิงอื่นที่ไม่รองรับ proxy-reasoning จะข้ามการแทรก reasoning แบบพร็อกซี
- **MiniMax** การทำ onboarding ด้วย API key จะเขียนนิยามโมเดล M2.7 แบบชัดเจนพร้อม `input: ["text", "image"]`; แค็ตตาล็อกที่รวมมาในชุดจะคงการอ้างอิงแชตให้เป็น text-only จนกว่าจะมีการสร้างการตั้งค่านั้นขึ้นมา
- **xAI** ใช้เส้นทาง xAI Responses `/fast` หรือ `params.fastMode: true` จะเขียน `grok-3`, `grok-3-mini`, `grok-4` และ `grok-4-0709` ใหม่เป็นตัวแปร `*-fast` โดย `tool_stream` จะเปิดตามค่าเริ่มต้น; ปิดได้ด้วย `agents.defaults.models["xai/<model>"].params.tool_stream=false`
- **Cerebras** โมเดล GLM ใช้ `zai-glm-4.7` / `zai-glm-4.6`; base URL แบบเข้ากันได้กับ OpenAI คือ `https://api.cerebras.ai/v1`

## ผู้ให้บริการผ่าน `models.providers` (กำหนดเอง/base URL)

ใช้ `models.providers` (หรือ `models.json`) เพื่อเพิ่มผู้ให้บริการแบบ**กำหนดเอง**หรือพร็อกซีที่เข้ากันได้กับ OpenAI/Anthropic

bundled provider plugins จำนวนมากด้านล่างนี้เผยแพร่แค็ตตาล็อกเริ่มต้นไว้อยู่แล้ว
ให้ใช้รายการ `models.providers.<id>` แบบชัดเจนก็ต่อเมื่อคุณต้องการแทนที่
base URL, headers หรือรายการโมเดลเริ่มต้น

### Moonshot AI (Kimi)

Moonshot มาพร้อมเป็น bundled provider Plugin ให้ใช้ผู้ให้บริการในตัวเป็นค่าเริ่มต้น
และเพิ่มรายการ `models.providers.moonshot` แบบชัดเจนเฉพาะเมื่อคุณ
ต้องการแทนที่ base URL หรือข้อมูลเมตาของโมเดล:

- ผู้ให้บริการ: `moonshot`
- การยืนยันตัวตน: `MOONSHOT_API_KEY`
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

Kimi Coding ใช้ปลายทางที่เข้ากันได้กับ Anthropic ของ Moonshot AI:

- ผู้ให้บริการ: `kimi`
- การยืนยันตัวตน: `KIMI_API_KEY`
- โมเดลตัวอย่าง: `kimi/kimi-code`

```json5
{
  env: { KIMI_API_KEY: "sk-..." },
  agents: {
    defaults: { model: { primary: "kimi/kimi-code" } },
  },
}
```

`kimi/k2p5` แบบเดิมยังคงยอมรับได้ในฐานะ model id เพื่อความเข้ากันได้

### Volcano Engine (Doubao)

Volcano Engine (火山引擎) ให้การเข้าถึง Doubao และโมเดลอื่นๆ ในจีน

- ผู้ให้บริการ: `volcengine` (ด้าน coding: `volcengine-plan`)
- การยืนยันตัวตน: `VOLCANO_ENGINE_API_KEY`
- โมเดลตัวอย่าง: `volcengine-plan/ark-code-latest`
- CLI: `openclaw onboard --auth-choice volcengine-api-key`

```json5
{
  agents: {
    defaults: { model: { primary: "volcengine-plan/ark-code-latest" } },
  },
}
```

การทำ onboarding จะใช้พื้นผิวสำหรับ coding เป็นค่าเริ่มต้น แต่แค็ตตาล็อกทั่วไป `volcengine/*`
จะถูกลงทะเบียนพร้อมกันในเวลาเดียวกัน

ในตัวเลือกโมเดลสำหรับ onboarding/configure การเลือกการยืนยันตัวตนของ Volcengine จะให้ความสำคัญกับทั้งแถว
`volcengine/*` และ `volcengine-plan/*` หากโมเดลเหล่านั้นยังไม่ถูกโหลด
OpenClaw จะย้อนกลับไปใช้แค็ตตาล็อกที่ไม่กรองแทนที่จะแสดงตัวเลือก
ที่จำกัดตามผู้ให้บริการแต่เป็นค่าว่าง

โมเดลที่พร้อมใช้งาน:

- `volcengine/doubao-seed-1-8-251228` (Doubao Seed 1.8)
- `volcengine/doubao-seed-code-preview-251028`
- `volcengine/kimi-k2-5-260127` (Kimi K2.5)
- `volcengine/glm-4-7-251222` (GLM 4.7)
- `volcengine/deepseek-v3-2-251201` (DeepSeek V3.2 128K)

โมเดลสำหรับ Coding (`volcengine-plan`):

- `volcengine-plan/ark-code-latest`
- `volcengine-plan/doubao-seed-code`
- `volcengine-plan/kimi-k2.5`
- `volcengine-plan/kimi-k2-thinking`
- `volcengine-plan/glm-4.7`

### BytePlus (นานาชาติ)

BytePlus ARK ให้การเข้าถึงโมเดลชุดเดียวกับ Volcano Engine สำหรับผู้ใช้ต่างประเทศ

- ผู้ให้บริการ: `byteplus` (ด้าน coding: `byteplus-plan`)
- การยืนยันตัวตน: `BYTEPLUS_API_KEY`
- โมเดลตัวอย่าง: `byteplus-plan/ark-code-latest`
- CLI: `openclaw onboard --auth-choice byteplus-api-key`

```json5
{
  agents: {
    defaults: { model: { primary: "byteplus-plan/ark-code-latest" } },
  },
}
```

การทำ onboarding จะใช้พื้นผิวสำหรับ coding เป็นค่าเริ่มต้น แต่แค็ตตาล็อกทั่วไป `byteplus/*`
จะถูกลงทะเบียนพร้อมกันในเวลาเดียวกัน

ในตัวเลือกโมเดลสำหรับ onboarding/configure การเลือกการยืนยันตัวตนของ BytePlus จะให้ความสำคัญกับทั้ง
แถว `byteplus/*` และ `byteplus-plan/*` หากโมเดลเหล่านั้นยังไม่ถูกโหลด
OpenClaw จะย้อนกลับไปใช้แค็ตตาล็อกที่ไม่กรองแทนที่จะแสดงตัวเลือก
ที่จำกัดตามผู้ให้บริการแต่เป็นค่าว่าง

โมเดลที่พร้อมใช้งาน:

- `byteplus/seed-1-8-251228` (Seed 1.8)
- `byteplus/kimi-k2-5-260127` (Kimi K2.5)
- `byteplus/glm-4-7-251222` (GLM 4.7)

โมเดลสำหรับ Coding (`byteplus-plan`):

- `byteplus-plan/ark-code-latest`
- `byteplus-plan/doubao-seed-code`
- `byteplus-plan/kimi-k2.5`
- `byteplus-plan/kimi-k2-thinking`
- `byteplus-plan/glm-4.7`

### Synthetic

Synthetic ให้บริการโมเดลที่เข้ากันได้กับ Anthropic ภายใต้ผู้ให้บริการ `synthetic`:

- ผู้ให้บริการ: `synthetic`
- การยืนยันตัวตน: `SYNTHETIC_API_KEY`
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

MiniMax ถูกกำหนดค่าผ่าน `models.providers` เพราะใช้ปลายทางแบบกำหนดเอง:

- MiniMax OAuth (Global): `--auth-choice minimax-global-oauth`
- MiniMax OAuth (CN): `--auth-choice minimax-cn-oauth`
- MiniMax API key (Global): `--auth-choice minimax-global-api`
- MiniMax API key (CN): `--auth-choice minimax-cn-api`
- การยืนยันตัวตน: `MINIMAX_API_KEY` สำหรับ `minimax`; `MINIMAX_OAUTH_TOKEN` หรือ
  `MINIMAX_API_KEY` สำหรับ `minimax-portal`

ดูรายละเอียดการตั้งค่า ตัวเลือกโมเดล และตัวอย่าง config ได้ที่ [/providers/minimax](/th/providers/minimax)

บนเส้นทางสตรีมมิงแบบเข้ากันได้กับ Anthropic ของ MiniMax, OpenClaw จะปิดการทำงานของ thinking ตามค่าเริ่มต้น
เว้นแต่คุณจะตั้งค่าไว้อย่างชัดเจน และ `/fast on` จะเขียน
`MiniMax-M2.7` ใหม่เป็น `MiniMax-M2.7-highspeed`

การแยก capability ที่เป็นเจ้าของโดย Plugin:

- ค่าเริ่มต้นสำหรับข้อความ/แชตยังคงใช้ `minimax/MiniMax-M2.7`
- การสร้างภาพคือ `minimax/image-01` หรือ `minimax-portal/image-01`
- การทำความเข้าใจภาพเป็น `MiniMax-VL-01` ที่ Plugin เป็นเจ้าของบนทั้งสองเส้นทางการยืนยันตัวตนของ MiniMax
- การค้นหาเว็บยังคงใช้ provider id `minimax`

### LM Studio

LM Studio มาพร้อมเป็น bundled provider Plugin ซึ่งใช้ API แบบเนทีฟ:

- ผู้ให้บริการ: `lmstudio`
- การยืนยันตัวตน: `LM_API_TOKEN`
- base URL สำหรับ inference เริ่มต้น: `http://localhost:1234/v1`

จากนั้นตั้งค่าโมเดล (แทนที่ด้วยหนึ่งใน ID ที่ส่งกลับจาก `http://localhost:1234/api/v1/models`):

```json5
{
  agents: {
    defaults: { model: { primary: "lmstudio/openai/gpt-oss-20b" } },
  },
}
```

OpenClaw ใช้ `/api/v1/models` และ `/api/v1/models/load` แบบเนทีฟของ LM Studio สำหรับการค้นหา + โหลดอัตโนมัติ และใช้ `/v1/chat/completions` สำหรับ inference เป็นค่าเริ่มต้น
ดูรายละเอียดการตั้งค่าและการแก้ปัญหาได้ที่ [/providers/lmstudio](/th/providers/lmstudio)

### Ollama

Ollama มาพร้อมเป็น bundled provider Plugin และใช้ API แบบเนทีฟของ Ollama:

- ผู้ให้บริการ: `ollama`
- การยืนยันตัวตน: ไม่ต้องใช้ (เซิร์ฟเวอร์ภายในเครื่อง)
- โมเดลตัวอย่าง: `ollama/llama3.3`
- การติดตั้ง: [https://ollama.com/download](https://ollama.com/download)

```bash
# ติดตั้ง Ollama จากนั้นดึงโมเดล:
ollama pull llama3.3
```

```json5
{
  agents: {
    defaults: { model: { primary: "ollama/llama3.3" } },
  },
}
```

ระบบจะตรวจพบ Ollama ในเครื่องที่ `http://127.0.0.1:11434` เมื่อคุณเลือกใช้
`OLLAMA_API_KEY` และ bundled provider Plugin จะเพิ่ม Ollama เข้าไปยัง
`openclaw onboard` และตัวเลือกโมเดลโดยตรง ดู [/providers/ollama](/th/providers/ollama)
สำหรับการทำ onboarding, โหมด cloud/local และการกำหนดค่าแบบกำหนดเอง

### vLLM

vLLM มาพร้อมเป็น bundled provider Plugin สำหรับเซิร์ฟเวอร์แบบ
OpenAI-compatible ที่รันในเครื่อง/โฮสต์เอง:

- ผู้ให้บริการ: `vllm`
- การยืนยันตัวตน: ไม่บังคับ (ขึ้นอยู่กับเซิร์ฟเวอร์ของคุณ)
- base URL เริ่มต้น: `http://127.0.0.1:8000/v1`

หากต้องการเลือกใช้การค้นหาอัตโนมัติในเครื่อง (ใช้ค่าใดก็ได้หากเซิร์ฟเวอร์ของคุณไม่ได้บังคับการยืนยันตัวตน):

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

ดูรายละเอียดได้ที่ [/providers/vllm](/th/providers/vllm)

### SGLang

SGLang มาพร้อมเป็น bundled provider Plugin สำหรับเซิร์ฟเวอร์
OpenAI-compatible ที่โฮสต์เองและทำงานได้รวดเร็ว:

- ผู้ให้บริการ: `sglang`
- การยืนยันตัวตน: ไม่บังคับ (ขึ้นอยู่กับเซิร์ฟเวอร์ของคุณ)
- base URL เริ่มต้น: `http://127.0.0.1:30000/v1`

หากต้องการเลือกใช้การค้นหาอัตโนมัติในเครื่อง (ใช้ค่าใดก็ได้หากเซิร์ฟเวอร์ของคุณไม่ได้
บังคับการยืนยันตัวตน):

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

ดูรายละเอียดได้ที่ [/providers/sglang](/th/providers/sglang)

### พร็อกซีภายในเครื่อง (LM Studio, vLLM, LiteLLM ฯลฯ)

ตัวอย่าง (OpenAI-compatible):

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
- แนะนำ: กำหนดค่าแบบชัดเจนให้ตรงกับขีดจำกัดของพร็อกซี/โมเดลของคุณ
- สำหรับ `api: "openai-completions"` บนปลายทางที่ไม่ใช่แบบเนทีฟ (ทุกกรณีที่ `baseUrl` ไม่ว่าง/ถูกกำหนดไว้และ host ไม่ใช่ `api.openai.com`) OpenClaw จะบังคับ `compat.supportsDeveloperRole: false` เพื่อหลีกเลี่ยงข้อผิดพลาด 400 จากผู้ให้บริการที่ไม่รองรับบทบาท `developer`
- เส้นทาง OpenAI-compatible แบบพร็อกซียังข้ามการปรับแต่งคำขอที่มีเฉพาะ OpenAI แบบเนทีฟด้วย:
  ไม่มี `service_tier`, ไม่มี Responses `store`, ไม่มีคำใบ้ prompt-cache, ไม่มี
  การจัดรูปแบบ payload ให้เข้ากันได้กับ OpenAI reasoning และไม่มี
  ส่วนหัวระบุที่มาของ OpenClaw ที่ซ่อนอยู่
- หาก `baseUrl` ว่างหรือไม่ระบุ OpenClaw จะคงพฤติกรรม OpenAI เริ่มต้นไว้ (ซึ่งจะชี้ไปที่ `api.openai.com`)
- เพื่อความปลอดภัย การกำหนด `compat.supportsDeveloperRole: true` แบบชัดเจนก็ยังจะถูกแทนที่บนปลายทาง `openai-completions` ที่ไม่ใช่แบบเนทีฟ

## ตัวอย่าง CLI

```bash
openclaw onboard --auth-choice opencode-zen
openclaw models set opencode/claude-opus-4-6
openclaw models list
```

ดูเพิ่มเติม: [/gateway/configuration](/th/gateway/configuration) สำหรับตัวอย่างการกำหนดค่าแบบเต็ม

## ที่เกี่ยวข้อง

- [Models](/th/concepts/models) — การกำหนดค่าโมเดลและชื่อแทน
- [Model Failover](/th/concepts/model-failover) — ลำดับโมเดลสำรองและพฤติกรรมการลองใหม่
- [Configuration Reference](/th/gateway/config-agents#agent-defaults) — คีย์การตั้งค่าโมเดล
- [Providers](/th/providers) — คู่มือการตั้งค่าแยกตามผู้ให้บริการ
