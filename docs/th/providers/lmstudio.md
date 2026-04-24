---
read_when:
    - คุณต้องการรัน OpenClaw กับโมเดลโอเพนซอร์สผ่าน LM Studio
    - คุณต้องการตั้งค่าและกำหนดค่า LM Studio
summary: รัน OpenClaw กับ LM Studio
title: LM Studio
x-i18n:
    generated_at: "2026-04-24T09:28:39Z"
    model: gpt-5.4
    provider: openai
    source_hash: 2077790173a8cb660409b64e199d2027dda7b5b55226a00eadb0cdc45061e3ce
    source_path: providers/lmstudio.md
    workflow: 15
---

LM Studio เป็นแอปที่ใช้งานง่ายแต่ทรงพลังสำหรับรันโมเดลแบบ open-weight บนฮาร์ดแวร์ของคุณเอง มันให้คุณรัน llama.cpp (GGUF) หรือโมเดล MLX (Apple Silicon) ได้ มีทั้งแพ็กเกจแบบ GUI และ daemon แบบ headless (`llmster`) สำหรับเอกสารเกี่ยวกับผลิตภัณฑ์และการตั้งค่า โปรดดู [lmstudio.ai](https://lmstudio.ai/)

## เริ่มต้นอย่างรวดเร็ว

1. ติดตั้ง LM Studio (เดสก์ท็อป) หรือ `llmster` (headless) จากนั้นเริ่ม local server:

```bash
curl -fsSL https://lmstudio.ai/install.sh | bash
```

2. เริ่มเซิร์ฟเวอร์

ตรวจสอบให้แน่ใจว่าคุณเปิดแอปเดสก์ท็อป หรือรัน daemon ด้วยคำสั่งต่อไปนี้:

```bash
lms daemon up
```

```bash
lms server start --port 1234
```

หากคุณใช้แอป ให้ตรวจสอบว่าเปิด JIT ไว้เพื่อให้ได้ประสบการณ์ที่ลื่นไหล อ่านเพิ่มเติมใน [คู่มือ LM Studio JIT และ TTL](https://lmstudio.ai/docs/developer/core/ttl-and-auto-evict)

3. OpenClaw ต้องใช้ค่าโทเค็นของ LM Studio ตั้งค่า `LM_API_TOKEN`:

```bash
export LM_API_TOKEN="your-lm-studio-api-token"
```

หากปิดการยืนยันตัวตนของ LM Studio ไว้ ให้ใช้ค่าโทเค็นใดก็ได้ที่ไม่ว่าง:

```bash
export LM_API_TOKEN="placeholder-key"
```

สำหรับรายละเอียดการตั้งค่า auth ของ LM Studio โปรดดู [LM Studio Authentication](https://lmstudio.ai/docs/developer/core/authentication)

4. รัน onboarding แล้วเลือก `LM Studio`:

```bash
openclaw onboard
```

5. ระหว่าง onboarding ให้ใช้พรอมป์ `Default model` เพื่อเลือกโมเดล LM Studio ของคุณ

คุณยังสามารถตั้งค่าหรือเปลี่ยนภายหลังได้:

```bash
openclaw models set lmstudio/qwen/qwen3.5-9b
```

คีย์โมเดลของ LM Studio ใช้รูปแบบ `author/model-name` (เช่น `qwen/qwen3.5-9b`) ส่วน
model ref ของ OpenClaw จะเติมชื่อ provider ไว้ด้านหน้า: `lmstudio/qwen/qwen3.5-9b` คุณสามารถดูคีย์ที่ตรงตัวของ
โมเดลได้โดยรัน `curl http://localhost:1234/api/v1/models` แล้วดูฟิลด์ `key`

## Onboarding แบบไม่โต้ตอบ

ใช้ onboarding แบบไม่โต้ตอบเมื่อคุณต้องการทำสคริปต์สำหรับการตั้งค่า (CI, provisioning, remote bootstrap):

```bash
openclaw onboard \
  --non-interactive \
  --accept-risk \
  --auth-choice lmstudio
```

หรือระบุ base URL หรือโมเดลพร้อม API key:

```bash
openclaw onboard \
  --non-interactive \
  --accept-risk \
  --auth-choice lmstudio \
  --custom-base-url http://localhost:1234/v1 \
  --lmstudio-api-key "$LM_API_TOKEN" \
  --custom-model-id qwen/qwen3.5-9b
```

`--custom-model-id` รับค่าเป็น model key ตามที่ LM Studio ส่งกลับมา (เช่น `qwen/qwen3.5-9b`) โดยไม่ต้องมี
prefix `lmstudio/` ด้านหน้า

onboarding แบบไม่โต้ตอบต้องใช้ `--lmstudio-api-key` (หรือ `LM_API_TOKEN` ใน env)
สำหรับเซิร์ฟเวอร์ LM Studio ที่ไม่ใช้การยืนยันตัวตน ค่าโทเค็นใด ๆ ที่ไม่ว่างก็ใช้ได้

`--custom-api-key` ยังคงรองรับเพื่อความเข้ากันได้ แต่ `--lmstudio-api-key` เป็นตัวเลือกที่ควรใช้สำหรับ LM Studio

สิ่งนี้จะเขียน `models.providers.lmstudio`, ตั้งค่าโมเดลเริ่มต้นเป็น
`lmstudio/<custom-model-id>` และเขียน auth profile `lmstudio:default`

การตั้งค่าแบบโต้ตอบสามารถพรอมป์ถาม preferred load context length แบบไม่บังคับ และจะนำค่าไปใช้กับโมเดล LM Studio ที่ค้นพบซึ่งบันทึกลงในคอนฟิก

## การกำหนดค่า

### ความเข้ากันได้ของ streaming usage

LM Studio เข้ากันได้กับ streaming-usage เมื่อมันไม่ส่ง
ออบเจ็กต์ `usage` ในรูปแบบ OpenAI OpenClaw จะกู้คืนจำนวนโทเค็นจาก metadata แบบ llama.cpp
`timings.prompt_n` / `timings.predicted_n` แทน

พฤติกรรมเดียวกันนี้ใช้กับแบ็กเอนด์ local ที่เข้ากันได้กับ OpenAI ต่อไปนี้ด้วย:

- vLLM
- SGLang
- llama.cpp
- LocalAI
- Jan
- TabbyAPI
- text-generation-webui

### การกำหนดค่าแบบ explicit

```json5
{
  models: {
    providers: {
      lmstudio: {
        baseUrl: "http://localhost:1234/v1",
        apiKey: "${LM_API_TOKEN}",
        api: "openai-completions",
        models: [
          {
            id: "qwen/qwen3-coder-next",
            name: "Qwen 3 Coder Next",
            reasoning: false,
            input: ["text"],
            cost: { input: 0, output: 0, cacheRead: 0, cacheWrite: 0 },
            contextWindow: 128000,
            maxTokens: 8192,
          },
        ],
      },
    },
  },
}
```

## การแก้ปัญหา

### ตรวจไม่พบ LM Studio

ตรวจสอบว่า LM Studio กำลังทำงานอยู่ และคุณได้ตั้งค่า `LM_API_TOKEN` แล้ว (สำหรับเซิร์ฟเวอร์ที่ไม่ใช้การยืนยันตัวตน ค่าโทเค็นใด ๆ ที่ไม่ว่างก็ใช้ได้):

```bash
# Start via desktop app, or headless:
lms server start --port 1234
```

ตรวจสอบว่า API เข้าถึงได้:

```bash
curl http://localhost:1234/api/v1/models
```

### ข้อผิดพลาดด้านการยืนยันตัวตน (HTTP 401)

หากการตั้งค่ารายงาน HTTP 401 ให้ตรวจสอบ API key ของคุณ:

- ตรวจสอบว่า `LM_API_TOKEN` ตรงกับคีย์ที่กำหนดไว้ใน LM Studio
- สำหรับรายละเอียดการตั้งค่า auth ของ LM Studio โปรดดู [LM Studio Authentication](https://lmstudio.ai/docs/developer/core/authentication)
- หากเซิร์ฟเวอร์ของคุณไม่ต้องใช้การยืนยันตัวตน ให้ใช้ค่าโทเค็นใดก็ได้ที่ไม่ว่างสำหรับ `LM_API_TOKEN`

### การโหลดโมเดลแบบ just-in-time

LM Studio รองรับการโหลดโมเดลแบบ just-in-time (JIT) ซึ่งโมเดลจะถูกโหลดเมื่อมีคำขอครั้งแรก ตรวจสอบให้แน่ใจว่าคุณเปิดใช้งานสิ่งนี้ไว้เพื่อหลีกเลี่ยงข้อผิดพลาด 'Model not loaded'

## ที่เกี่ยวข้อง

- [การเลือกโมเดล](/th/concepts/model-providers)
- [Ollama](/th/providers/ollama)
- [โมเดลในเครื่อง](/th/gateway/local-models)
