---
read_when:
    - คุณต้องการเสิร์ฟโมเดลจากเครื่อง GPU ของคุณเอง
    - คุณกำลังเชื่อมต่อ LM Studio หรือพร็อกซีที่เข้ากันได้กับ OpenAI
    - คุณต้องการคำแนะนำที่ปลอดภัยที่สุดสำหรับโมเดลในเครื่อง
summary: รัน OpenClaw บน LLM ในเครื่อง (LM Studio, vLLM, LiteLLM, custom OpenAI endpoints)
title: โมเดลในเครื่อง
x-i18n:
    generated_at: "2026-04-23T05:33:55Z"
    model: gpt-5.4
    provider: openai
    source_hash: 7a506ff83e4c2870d3878339f646c906584454a156ecd618c360f592cf3b0011
    source_path: gateway/local-models.md
    workflow: 15
---

# โมเดลในเครื่อง

การรันในเครื่องทำได้ แต่ OpenClaw คาดหวัง context ขนาดใหญ่และการป้องกัน prompt injection ที่แข็งแรง การ์ดขนาดเล็กจะตัด context และทำให้ความปลอดภัยรั่วไหล ควรตั้งเป้าสูง: **อย่างน้อย 2 Mac Studio ที่อัดสเปกเต็ม หรือเครื่อง GPU ระดับเทียบเท่า (~$30k+)** GPU **24 GB** เดี่ยวใช้ได้เฉพาะพรอมป์ที่เบากว่าพร้อม latency ที่สูงขึ้น ใช้ **โมเดลขนาดใหญ่สุด / รุ่นเต็มขนาดที่คุณรันได้**; checkpoint ที่ quantize หนักหรือรุ่น “small” จะเพิ่มความเสี่ยงต่อ prompt injection (ดู [ความปลอดภัย](/th/gateway/security))

หากคุณต้องการการตั้งค่า local ที่ฝืดน้อยที่สุด ให้เริ่มด้วย [LM Studio](/th/providers/lmstudio) หรือ [Ollama](/th/providers/ollama) และ `openclaw onboard` หน้านี้คือคู่มือแบบมีจุดยืนสำหรับสแตก local ระดับสูงกว่าและเซิร์ฟเวอร์ local ที่เข้ากันได้กับ OpenAI แบบกำหนดเอง

## แนะนำ: LM Studio + โมเดล local ขนาดใหญ่ (Responses API)

เป็นสแตก local ที่ดีที่สุดในตอนนี้ โหลดโมเดลขนาดใหญ่ใน LM Studio (เช่น build เต็มขนาดของ Qwen, DeepSeek หรือ Llama) เปิดใช้ local server (ค่าเริ่มต้น `http://127.0.0.1:1234`) และใช้ Responses API เพื่อแยก reasoning ออกจากข้อความสุดท้าย

```json5
{
  agents: {
    defaults: {
      model: { primary: "lmstudio/my-local-model" },
      models: {
        "anthropic/claude-opus-4-6": { alias: "Opus" },
        "lmstudio/my-local-model": { alias: "Local" },
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

**เช็กลิสต์การตั้งค่า**

- ติดตั้ง LM Studio: [https://lmstudio.ai](https://lmstudio.ai)
- ใน LM Studio ให้ดาวน์โหลด **build โมเดลที่ใหญ่ที่สุดที่มีให้ใช้** (หลีกเลี่ยงรุ่น “small”/รุ่นที่ quantize หนัก) เริ่มเซิร์ฟเวอร์ และยืนยันว่า `http://127.0.0.1:1234/v1/models` แสดงรายการโมเดลนั้น
- แทนที่ `my-local-model` ด้วย model ID จริงที่แสดงใน LM Studio
- โหลดโมเดลค้างไว้; การโหลดแบบ cold-load จะเพิ่ม latency ตอนเริ่มต้น
- ปรับ `contextWindow`/`maxTokens` หาก build ของ LM Studio ของคุณต่างออกไป
- สำหรับ WhatsApp ให้ยึด Responses API เพื่อให้ส่งเฉพาะข้อความสุดท้ายเท่านั้น

คงการตั้งค่าโมเดลแบบโฮสต์ไว้แม้ขณะรัน local; ใช้ `models.mode: "merge"` เพื่อให้ fallback ยังคงพร้อมใช้งาน

### config แบบไฮบริด: โฮสต์เป็นตัวหลัก, local เป็น fallback

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

### local-first พร้อม safety net แบบโฮสต์

สลับลำดับของ primary และ fallback; คง providers block เดิมและ `models.mode: "merge"` ไว้ เพื่อให้คุณ fallback ไปที่ Sonnet หรือ Opus ได้เมื่อเครื่อง local ล่ม

### โฮสต์ตามภูมิภาค / การกำหนดเส้นทางข้อมูล

- รุ่น MiniMax/Kimi/GLM แบบโฮสต์ก็มีอยู่บน OpenRouter เช่นกันพร้อม endpoint ที่ตรึงภูมิภาค (เช่น โฮสต์ในสหรัฐฯ) เลือกรุ่นตามภูมิภาคที่นั่นเพื่อให้ทราฟฟิกอยู่ในเขตอำนาจที่คุณเลือก ขณะยังใช้ `models.mode: "merge"` สำหรับ fallback ของ Anthropic/OpenAI
- local-only ยังคงเป็นเส้นทางความเป็นส่วนตัวที่แข็งแรงที่สุด; การกำหนดเส้นทางแบบ regional hosting เป็นทางสายกลางเมื่อคุณต้องการฟีเจอร์ของผู้ให้บริการแต่ยังต้องการควบคุมการไหลของข้อมูล

## พร็อกซี local แบบเข้ากันได้กับ OpenAI อื่น ๆ

vLLM, LiteLLM, OAI-proxy หรือ gateway แบบกำหนดเอง ใช้งานได้หากเปิด endpoint สไตล์ OpenAI ที่ `/v1` ให้แทนที่ providers block ด้านบนด้วย endpoint และ model ID ของคุณ:

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

คง `models.mode: "merge"` ไว้เพื่อให้โมเดลแบบโฮสต์ยังใช้เป็น fallback ได้

หมายเหตุพฤติกรรมสำหรับแบ็กเอนด์ `/v1` แบบ local/proxy:

- OpenClaw ปฏิบัติต่อสิ่งเหล่านี้เป็นเส้นทางแบบพร็อกซีที่เข้ากันได้กับ OpenAI ไม่ใช่
  endpoint OpenAI แบบเนทีฟ
- การจัดรูปคำขอแบบเฉพาะ OpenAI เนทีฟจะไม่ถูกใช้ที่นี่: ไม่มี
  `service_tier`, ไม่มี Responses `store`, ไม่มีการจัดรูป payload ด้าน reasoning แบบเข้ากันได้กับ OpenAI
  และไม่มี prompt-cache hints
- header attribution แบบซ่อนของ OpenClaw (`originator`, `version`, `User-Agent`)
  จะไม่ถูกฉีดลงบน URL ของพร็อกซีแบบกำหนดเองเหล่านี้

หมายเหตุความเข้ากันได้สำหรับแบ็กเอนด์ OpenAI-compatible ที่เข้มงวดกว่า:

- บางเซิร์ฟเวอร์ยอมรับเฉพาะ `messages[].content` แบบสตริงบน Chat Completions ไม่รับ
  อาร์เรย์ structured content-part ให้ตั้ง
  `models.providers.<provider>.models[].compat.requiresStringContent: true` สำหรับ
  endpoint เหล่านั้น
- แบ็กเอนด์ local บางตัวที่เล็กกว่าหรือเข้มงวดกว่าอาจไม่เสถียรกับรูปแบบพรอมป์เต็มของ agent-runtime ของ OpenClaw โดยเฉพาะเมื่อมี tool schema รวมอยู่ด้วย หาก
  แบ็กเอนด์ทำงานได้กับการเรียก `/v1/chat/completions` โดยตรงแบบเล็ก ๆ แต่ล้มเหลวกับ turn ของเอเจนต์ OpenClaw ปกติ ให้ลอง
  `agents.defaults.experimental.localModelLean: true` ก่อนเพื่อตัด
  tool เริ่มต้นที่มีน้ำหนักมากอย่าง `browser`, `cron` และ `message`; นี่คือ
  แฟล็ก experimental ไม่ใช่การตั้งค่าโหมดเริ่มต้นแบบเสถียร ดู
  [ฟีเจอร์ทดลอง](/th/concepts/experimental-features) หากยังล้มเหลว ให้ลอง
  `models.providers.<provider>.models[].compat.supportsTools: false`
- หากแบ็กเอนด์ยังคงล้มเหลวเฉพาะบนการรัน OpenClaw ขนาดใหญ่กว่า ปัญหาที่เหลือ
  มักเป็นข้อจำกัดของความสามารถโมเดล/เซิร์ฟเวอร์ฝั่งต้นทาง หรือบั๊กของแบ็กเอนด์ ไม่ใช่
  transport layer ของ OpenClaw

## การแก้ไขปัญหา

- Gateway เข้าถึงพร็อกซีได้หรือไม่? `curl http://127.0.0.1:1234/v1/models`
- โมเดลใน LM Studio ถูก unload หรือไม่? โหลดใหม่; cold start เป็นสาเหตุทั่วไปของอาการ “ค้าง”
- OpenClaw จะเตือนเมื่อ context window ที่ตรวจพบต่ำกว่า **32k** และจะบล็อกเมื่อ ต่ำกว่า **16k** หากคุณเจอ preflight นี้ ให้เพิ่มขีดจำกัด context ของเซิร์ฟเวอร์/โมเดล หรือเลือกโมเดลที่ใหญ่กว่า
- เกิดข้อผิดพลาดด้าน context? ลด `contextWindow` หรือตั้งขีดจำกัดเซิร์ฟเวอร์ให้สูงขึ้น
- เซิร์ฟเวอร์ OpenAI-compatible ส่งกลับ `messages[].content ... expected a string`?
  ให้เพิ่ม `compat.requiresStringContent: true` ในรายการโมเดลนั้น
- การเรียก `/v1/chat/completions` แบบเล็ก ๆ โดยตรงใช้ได้ แต่ `openclaw infer model run`
  ล้มเหลวบน Gemma หรือโมเดล local ตัวอื่น? ปิด tool schema ก่อนด้วย
  `compat.supportsTools: false` แล้วทดสอบใหม่ หากเซิร์ฟเวอร์ยังพังเฉพาะกับพรอมป์ OpenClaw ขนาดใหญ่กว่า ให้ถือว่าเป็นข้อจำกัดของเซิร์ฟเวอร์/โมเดลต้นทาง
- ความปลอดภัย: โมเดล local ข้ามตัวกรองฝั่งผู้ให้บริการ; ควรทำให้เอเจนต์แคบ และเปิด Compaction ไว้เพื่อจำกัด blast radius ของ prompt injection
