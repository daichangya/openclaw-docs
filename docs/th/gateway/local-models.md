---
read_when:
    - คุณต้องการให้โมเดลทำงานจากเครื่อง GPU ของคุณเอง
    - คุณกำลังเชื่อมต่อ LM Studio หรือพร็อกซีที่เข้ากันได้กับ OpenAI
    - คุณต้องการคำแนะนำที่ปลอดภัยที่สุดสำหรับโมเดลในเครื่อง
summary: รัน OpenClaw บน LLM ในเครื่อง (LM Studio, vLLM, LiteLLM, custom OpenAI endpoints)
title: โมเดลในเครื่อง
x-i18n:
    generated_at: "2026-04-24T09:10:57Z"
    model: gpt-5.4
    provider: openai
    source_hash: 9315b03b4bacd44af50ebec899f1d13397b9ae91bde21742fe9f022c23d1e95c
    source_path: gateway/local-models.md
    workflow: 15
---

การรันในเครื่องทำได้ แต่ OpenClaw คาดหวัง context ขนาดใหญ่และการป้องกัน prompt injection ที่แข็งแรง การ์ดขนาดเล็กจะตัดทอน context และทำให้ความปลอดภัยรั่วไหล ควรตั้งเป้าสูง: **Mac Studio ที่อัดสเปกเต็มอย่างน้อย 2 เครื่อง หรือชุด GPU ระดับเทียบเท่า (~$30k+)** GPU **24 GB** เดี่ยวใช้งานได้เฉพาะกับ prompt ที่เบากว่าและมี latency สูงกว่า ใช้ **โมเดลขนาดใหญ่ที่สุด / รุ่นเต็มที่คุณรันได้**; checkpoints ที่ quantize หนักหรือรุ่น “small” จะเพิ่มความเสี่ยงต่อ prompt injection (ดู [Security](/th/gateway/security))

หากคุณต้องการการตั้งค่าในเครื่องที่มีแรงเสียดทานต่ำที่สุด ให้เริ่มจาก [LM Studio](/th/providers/lmstudio) หรือ [Ollama](/th/providers/ollama) และ `openclaw onboard` หน้านี้คือคู่มือเชิงความเห็นสำหรับสแตกในเครื่องระดับสูงกว่าและเซิร์ฟเวอร์ในเครื่องแบบกำหนดเองที่เข้ากันได้กับ OpenAI

## แนะนำ: LM Studio + โมเดลในเครื่องขนาดใหญ่ (Responses API)

สแตกในเครื่องที่ดีที่สุดในตอนนี้ โหลดโมเดลขนาดใหญ่ใน LM Studio (เช่น build ขนาดเต็มของ Qwen, DeepSeek หรือ Llama), เปิด local server (ค่าเริ่มต้น `http://127.0.0.1:1234`) และใช้ Responses API เพื่อแยก reasoning ออกจากข้อความสุดท้าย

```json5
{
  agents: {
    defaults: {
      model: { primary: “lmstudio/my-local-model” },
      models: {
        “anthropic/claude-opus-4-6”: { alias: “Opus” },
        “lmstudio/my-local-model”: { alias: “Local” },
      },
    },
  },
  models: {
    mode: “merge”,
    providers: {
      lmstudio: {
        baseUrl: “http://127.0.0.1:1234/v1”,
        apiKey: “lmstudio”,
        api: “openai-responses”,
        models: [
          {
            id: “my-local-model”,
            name: “Local Model”,
            reasoning: false,
            input: [“text”],
            cost: { input: 0, output: 0, cacheRead: 0, cacheWrite: 0 },
            contextWindow: 196608,
            maxTokens: 8192,
          },
        ],
      },
    },
  },
}
```

**เช็กลิสต์การตั้งค่า**

- ติดตั้ง LM Studio: [https://lmstudio.ai](https://lmstudio.ai)
- ใน LM Studio ดาวน์โหลด **build โมเดลที่ใหญ่ที่สุดที่มีให้ใช้** (หลีกเลี่ยงรุ่น “small”/รุ่นที่ quantize หนัก), เริ่มเซิร์ฟเวอร์ และยืนยันว่า `http://127.0.0.1:1234/v1/models` แสดงรายการโมเดลนั้น
- แทนที่ `my-local-model` ด้วย model ID จริงที่แสดงใน LM Studio
- ให้โมเดลยังคงถูกโหลดอยู่; การโหลดแบบ cold-load จะเพิ่ม latency ตอนเริ่มต้น
- ปรับ `contextWindow`/`maxTokens` หาก build ของ LM Studio ของคุณแตกต่างออกไป
- สำหรับ WhatsApp ให้ใช้ Responses API ต่อไปเพื่อส่งเฉพาะข้อความสุดท้าย

คงการกำหนดค่าโมเดลที่โฮสต์ไว้แม้ตอนที่รันในเครื่อง; ใช้ `models.mode: "merge"` เพื่อให้ fallbacks ยังใช้งานได้

### คอนฟิกแบบไฮบริด: primary แบบโฮสต์, fallback แบบในเครื่อง

```json5
{
  agents: {
    defaults: {
      model: {
        primary: "anthropic/claude-sonnet-4-6",
        fallbacks: ["lmstudio/my-local-model", "anthropic/claude-opus-4-6"],
      },
      models: {
        "anthropic/claude-sonnet-4-6": { alias: "Sonnet" },
        "lmstudio/my-local-model": { alias: "Local" },
        "anthropic/claude-opus-4-6": { alias: "Opus" },
      },
    },
  },
  models: {
    mode: "merge",
    providers: {
      lmstudio: {
        baseUrl: "http://127.0.0.1:1234/v1",
        apiKey: "lmstudio",
        api: "openai-responses",
        models: [
          {
            id: "my-local-model",
            name: "Local Model",
            reasoning: false,
            input: ["text"],
            cost: { input: 0, output: 0, cacheRead: 0, cacheWrite: 0 },
            contextWindow: 196608,
            maxTokens: 8192,
          },
        ],
      },
    },
  },
}
```

### local-first พร้อมเครือข่ายนิรภัยแบบโฮสต์

สลับลำดับของ primary และ fallback; คงบล็อก providers เดิมและ `models.mode: "merge"` ไว้ เพื่อให้ fallback ไปยัง Sonnet หรือ Opus ได้เมื่อเครื่อง local ใช้งานไม่ได้

### การโฮสต์ตามภูมิภาค / การกำหนดเส้นทางข้อมูล

- รุ่น MiniMax/Kimi/GLM แบบโฮสต์ก็มีอยู่บน OpenRouter พร้อม endpoints ที่ปักหมุดภูมิภาคไว้เช่นกัน (เช่น โฮสต์ในสหรัฐฯ) เลือกรุ่นตามภูมิภาคที่นั่นเพื่อให้ทราฟฟิกอยู่ในเขตอำนาจที่คุณเลือก ขณะเดียวกันก็ยังใช้ `models.mode: "merge"` สำหรับ fallbacks ของ Anthropic/OpenAI
- การใช้เฉพาะในเครื่องยังคงเป็นเส้นทางที่เป็นส่วนตัวที่สุด; การกำหนดเส้นทางแบบโฮสต์ตามภูมิภาคเป็นจุดกึ่งกลางเมื่อคุณต้องการความสามารถของผู้ให้บริการแต่ยังต้องการควบคุมการไหลของข้อมูล

## พร็อกซีในเครื่องอื่น ๆ ที่เข้ากันได้กับ OpenAI

vLLM, LiteLLM, OAI-proxy หรือ gateway แบบกำหนดเองใช้งานได้ หากเปิดเผย endpoint `/v1` แบบสไตล์ OpenAI แทนที่บล็อก provider ด้านบนด้วย endpoint และ model ID ของคุณ:

```json5
{
  models: {
    mode: "merge",
    providers: {
      local: {
        baseUrl: "http://127.0.0.1:8000/v1",
        apiKey: "sk-local",
        api: "openai-responses",
        models: [
          {
            id: "my-local-model",
            name: "Local Model",
            reasoning: false,
            input: ["text"],
            cost: { input: 0, output: 0, cacheRead: 0, cacheWrite: 0 },
            contextWindow: 120000,
            maxTokens: 8192,
          },
        ],
      },
    },
  },
}
```

คง `models.mode: "merge"` ไว้เพื่อให้โมเดลที่โฮสต์ยังพร้อมใช้งานเป็น fallbacks

หมายเหตุด้านพฤติกรรมสำหรับแบ็กเอนด์ `/v1` แบบ local/proxied:

- OpenClaw ปฏิบัติต่อสิ่งเหล่านี้เป็นเส้นทาง proxy-style ที่เข้ากันได้กับ OpenAI ไม่ใช่
  endpoints OpenAI แบบ native
- การจัดรูปแบบ request แบบเฉพาะ OpenAI-native จะไม่ถูกใช้ที่นี่: ไม่มี
  `service_tier`, ไม่มี Responses `store`, ไม่มีการจัดรูปแบบ payload เพื่อความเข้ากันได้กับ OpenAI reasoning
  และไม่มี prompt-cache hints
- hidden OpenClaw attribution headers (`originator`, `version`, `User-Agent`)
  จะไม่ถูก inject บน custom proxy URLs เหล่านี้

หมายเหตุด้านความเข้ากันได้สำหรับแบ็กเอนด์ที่เข้ากันได้กับ OpenAI แต่เข้มงวดกว่า:

- เซิร์ฟเวอร์บางตัวรับเฉพาะ `messages[].content` แบบ string บน Chat Completions ไม่ใช่
  structured content-part arrays ให้ตั้งค่า
  `models.providers.<provider>.models[].compat.requiresStringContent: true` สำหรับ
  endpoints เหล่านั้น
- แบ็กเอนด์ในเครื่องบางตัวที่เล็กกว่าหรือเข้มงวดกว่ามีความไม่เสถียรกับ prompt shape
  เต็มรูปแบบของ agent-runtime ของ OpenClaw โดยเฉพาะเมื่อมี tool schemas รวมอยู่ด้วย หาก
  แบ็กเอนด์ทำงานได้กับการเรียก `/v1/chat/completions` ตรง ๆ ขนาดเล็ก แต่ล้มเหลวกับ agent turns ปกติของ OpenClaw
  ให้ลอง
  `agents.defaults.experimental.localModelLean: true` ก่อนเพื่อตัดเครื่องมือเริ่มต้นที่หนัก
  อย่าง `browser`, `cron` และ `message`; นี่เป็นแฟล็ก experimental ไม่ใช่การตั้งค่าโหมดเริ่มต้นที่เสถียร ดู
  [ฟีเจอร์ทดลอง](/th/concepts/experimental-features) หากยังล้มเหลว ให้ลอง
  `models.providers.<provider>.models[].compat.supportsTools: false`
- หากแบ็กเอนด์ยังคงล้มเหลวเฉพาะกับการรัน OpenClaw ที่ใหญ่กว่า ปัญหาที่เหลืออยู่มักเป็น
  ความสามารถของโมเดล/เซิร์ฟเวอร์ต้นทางหรือบั๊กของแบ็กเอนด์ ไม่ใช่ transport layer ของ OpenClaw

## การแก้ไขปัญหา

- Gateway เข้าถึงพร็อกซีได้หรือไม่? `curl http://127.0.0.1:1234/v1/models`
- โมเดล LM Studio ถูก unload ไปหรือไม่? โหลดใหม่; cold start เป็นสาเหตุทั่วไปของอาการ “ค้าง”
- OpenClaw จะเตือนเมื่อ context window ที่ตรวจพบต่ำกว่า **32k** และบล็อกเมื่อ ต่ำกว่า **16k** หากคุณเจอ preflight นี้ ให้เพิ่มขีดจำกัด context ของเซิร์ฟเวอร์/โมเดลหรือเลือกโมเดลที่ใหญ่ขึ้น
- ข้อผิดพลาดเรื่อง context? ลด `contextWindow` หรือเพิ่มขีดจำกัดของเซิร์ฟเวอร์
- เซิร์ฟเวอร์ที่เข้ากันได้กับ OpenAI ส่งกลับ `messages[].content ... expected a string`?
  เพิ่ม `compat.requiresStringContent: true` ในรายการโมเดลนั้น
- การเรียก `/v1/chat/completions` ตรง ๆ ขนาดเล็กใช้งานได้ แต่ `openclaw infer model run`
  ล้มเหลวบน Gemma หรือโมเดลในเครื่องอื่นหรือไม่? ปิด tool schemas ก่อนด้วย
  `compat.supportsTools: false` แล้วทดสอบอีกครั้ง หากเซิร์ฟเวอร์ยังพังเฉพาะ
  บน prompt ของ OpenClaw ที่ใหญ่กว่า ให้ถือว่าเป็นข้อจำกัดของเซิร์ฟเวอร์/โมเดลต้นทาง
- ความปลอดภัย: โมเดลในเครื่องข้ามตัวกรองฝั่งผู้ให้บริการ; ให้จำกัดเอเจนต์ให้แคบและเปิด Compaction ไว้เพื่อลดขอบเขตผลกระทบของ prompt injection

## ที่เกี่ยวข้อง

- [เอกสารอ้างอิงการกำหนดค่า](/th/gateway/configuration-reference)
- [Model Failover](/th/concepts/model-failover)
