---
read_when:
    - คุณต้องการรัน OpenClaw ด้วยโมเดลโอเพนซอร์สผ่าน LM Studio
    - คุณต้องการตั้งค่าและกำหนดค่า LM Studio
summary: รัน OpenClaw ด้วย LM Studio
title: LM Studio
x-i18n:
    generated_at: "2026-04-23T05:51:46Z"
    model: gpt-5.4
    provider: openai
    source_hash: 11264584e8277260d4215feb7c751329ce04f59e9228da1c58e147c21cd9ac2c
    source_path: providers/lmstudio.md
    workflow: 15
---

# LM Studio

LM Studio เป็นแอปที่ใช้งานง่ายแต่ทรงพลังสำหรับรันโมเดล open-weight บนฮาร์ดแวร์ของคุณเอง รองรับการรัน llama.cpp (GGUF) หรือโมเดล MLX (Apple Silicon) มาได้ทั้งแบบแพ็กเกจ GUI หรือ daemon แบบ headless (`llmster`) สำหรับเอกสารผลิตภัณฑ์และการตั้งค่า ดู [lmstudio.ai](https://lmstudio.ai/)

## เริ่มต้นอย่างรวดเร็ว

1. ติดตั้ง LM Studio (เดสก์ท็อป) หรือ `llmster` (headless) จากนั้นเริ่ม local server:

```bash
curl -fsSL https://lmstudio.ai/install.sh | bash
```

2. เริ่มเซิร์ฟเวอร์

ตรวจสอบให้แน่ใจว่าคุณได้เปิดแอปเดสก์ท็อป หรือรัน daemon ด้วยคำสั่งต่อไปนี้:

```bash
lms daemon up
```

```bash
lms server start --port 1234
```

หากคุณใช้แอป ให้ตรวจสอบว่าเปิด JIT แล้วเพื่อประสบการณ์ที่ลื่นไหล ดูข้อมูลเพิ่มเติมได้ใน [คู่มือ LM Studio JIT และ TTL](https://lmstudio.ai/docs/developer/core/ttl-and-auto-evict)

3. OpenClaw ต้องใช้ค่า token ของ LM Studio ให้ตั้ง `LM_API_TOKEN`:

```bash
export LM_API_TOKEN="your-lm-studio-api-token"
```

หากปิดการยืนยันตัวตนของ LM Studio ให้ใช้ค่า token ใดก็ได้ที่ไม่ว่าง:

```bash
export LM_API_TOKEN="placeholder-key"
```

สำหรับรายละเอียดการตั้งค่า auth ของ LM Studio ดู [LM Studio Authentication](https://lmstudio.ai/docs/developer/core/authentication)

4. รัน onboarding แล้วเลือก `LM Studio`:

```bash
openclaw onboard
```

5. ระหว่าง onboarding ให้ใช้พรอมป์ต์ `Default model` เพื่อเลือกโมเดล LM Studio ของคุณ

คุณยังสามารถตั้งค่าหรือเปลี่ยนภายหลังได้:

```bash
openclaw models set lmstudio/qwen/qwen3.5-9b
```

คีย์โมเดลของ LM Studio อยู่ในรูปแบบ `author/model-name` (เช่น `qwen/qwen3.5-9b`) OpenClaw
จะเติมชื่อผู้ให้บริการนำหน้า model refs: `lmstudio/qwen/qwen3.5-9b` คุณสามารถดูคีย์ที่ตรงตัว
ของโมเดลได้ด้วยการรัน `curl http://localhost:1234/api/v1/models` แล้วดูที่ฟิลด์ `key`

## การเริ่มต้นใช้งานแบบ non-interactive

ใช้ onboarding แบบ non-interactive เมื่อต้องการเขียนสคริปต์สำหรับการตั้งค่า (CI, provisioning, remote bootstrap):

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

`--custom-model-id` รับค่า model key ตามที่ LM Studio ส่งคืน (เช่น `qwen/qwen3.5-9b`) โดยไม่ต้อง
ใส่คำนำหน้าผู้ให้บริการ `lmstudio/`

onboarding แบบ non-interactive ต้องใช้ `--lmstudio-api-key` (หรือ `LM_API_TOKEN` ใน env)
สำหรับเซิร์ฟเวอร์ LM Studio ที่ไม่ต้องยืนยันตัวตน ค่าที่ไม่ว่างใดๆ ก็ใช้ได้

`--custom-api-key` ยังคงรองรับเพื่อความเข้ากันได้ แต่สำหรับ LM Studio ควรใช้ `--lmstudio-api-key`

วิธีนี้จะเขียน `models.providers.lmstudio`, ตั้งค่าโมเดลเริ่มต้นเป็น
`lmstudio/<custom-model-id>` และเขียน auth profile `lmstudio:default`

การตั้งค่าแบบ interactive สามารถถาม preferred load context length แบบเลือกได้ และจะใช้ค่าดังกล่าวกับโมเดล LM Studio ที่ค้นพบทั้งหมดซึ่งบันทึกลงใน config

## การกำหนดค่า

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

### ไม่พบ LM Studio

ตรวจสอบว่า LM Studio กำลังทำงานอยู่ และคุณได้ตั้ง `LM_API_TOKEN` แล้ว (สำหรับเซิร์ฟเวอร์ที่ไม่ต้องยืนยันตัวตน ใช้ค่าใดก็ได้ที่ไม่ว่าง):

```bash
# เริ่มผ่านแอปเดสก์ท็อป หรือแบบ headless:
lms server start --port 1234
```

ตรวจสอบว่า API เข้าถึงได้:

```bash
curl http://localhost:1234/api/v1/models
```

### ข้อผิดพลาดการยืนยันตัวตน (HTTP 401)

หากการตั้งค่ารายงาน HTTP 401 ให้ตรวจสอบ API key ของคุณ:

- ตรวจสอบว่า `LM_API_TOKEN` ตรงกับคีย์ที่กำหนดไว้ใน LM Studio
- สำหรับรายละเอียดการตั้งค่า auth ของ LM Studio ดู [LM Studio Authentication](https://lmstudio.ai/docs/developer/core/authentication)
- หากเซิร์ฟเวอร์ของคุณไม่ต้องการการยืนยันตัวตน ให้ใช้ค่าใดก็ได้ที่ไม่ว่างสำหรับ `LM_API_TOKEN`

### การโหลดโมเดลแบบ just-in-time

LM Studio รองรับการโหลดโมเดลแบบ just-in-time (JIT) ซึ่งโมเดลจะถูกโหลดเมื่อมีคำขอครั้งแรก ให้ตรวจสอบว่าเปิดสิ่งนี้ไว้เพื่อหลีกเลี่ยงข้อผิดพลาด 'Model not loaded'
