---
read_when:
    - คุณต้องการการตั้งค่าแบบมีผู้แนะนำสำหรับ Gateway, พื้นที่ทำงาน, auth, ช่องทาง และ Skills
summary: เอกสารอ้างอิง CLI สำหรับ `openclaw onboard` (การเริ่มต้นใช้งานแบบโต้ตอบ)
title: Onboard
x-i18n:
    generated_at: "2026-04-24T09:03:36Z"
    model: gpt-5.4
    provider: openai
    source_hash: c1959ad7014b891230e497a2e0ab494ba316090c81629f25b8147614b694ead5
    source_path: cli/onboard.md
    workflow: 15
---

# `openclaw onboard`

การเริ่มต้นใช้งานแบบโต้ตอบสำหรับการตั้งค่า Gateway แบบ local หรือ remote

## คู่มือที่เกี่ยวข้อง

- ศูนย์กลางการเริ่มต้นใช้งาน CLI: [Onboarding (CLI)](/th/start/wizard)
- ภาพรวมการเริ่มต้นใช้งาน: [Onboarding Overview](/th/start/onboarding-overview)
- เอกสารอ้างอิงการเริ่มต้นใช้งาน CLI: [CLI Setup Reference](/th/start/wizard-cli-reference)
- Automation ของ CLI: [CLI Automation](/th/start/wizard-cli-automation)
- การเริ่มต้นใช้งาน macOS: [Onboarding (macOS App)](/th/start/onboarding)

## ตัวอย่าง

```bash
openclaw onboard
openclaw onboard --flow quickstart
openclaw onboard --flow manual
openclaw onboard --mode remote --remote-url wss://gateway-host:18789
```

สำหรับเป้าหมาย `ws://` แบบ plaintext บน private network (ใช้เฉพาะเครือข่ายที่เชื่อถือได้เท่านั้น) ให้ตั้ง
`OPENCLAW_ALLOW_INSECURE_PRIVATE_WS=1` ในสภาพแวดล้อมของกระบวนการ onboarding
ไม่มีค่าเทียบเท่าใน `openclaw.json` สำหรับ break-glass ฝั่งไคลเอนต์ของ transport นี้

ผู้ให้บริการแบบกำหนดเองที่ไม่ต้องโต้ตอบ:

```bash
openclaw onboard --non-interactive \
  --auth-choice custom-api-key \
  --custom-base-url "https://llm.example.com/v1" \
  --custom-model-id "foo-large" \
  --custom-api-key "$CUSTOM_API_KEY" \
  --secret-input-mode plaintext \
  --custom-compatibility openai
```

`--custom-api-key` เป็นตัวเลือกเสริมในโหมด non-interactive หากไม่ส่งมา onboarding จะตรวจสอบ `CUSTOM_API_KEY`

LM Studio ยังรองรับแฟล็กคีย์เฉพาะผู้ให้บริการในโหมด non-interactive:

```bash
openclaw onboard --non-interactive \
  --auth-choice lmstudio \
  --custom-base-url "http://localhost:1234/v1" \
  --custom-model-id "qwen/qwen3.5-9b" \
  --lmstudio-api-key "$LM_API_TOKEN" \
  --accept-risk
```

Ollama แบบ non-interactive:

```bash
openclaw onboard --non-interactive \
  --auth-choice ollama \
  --custom-base-url "http://ollama-host:11434" \
  --custom-model-id "qwen3.5:27b" \
  --accept-risk
```

`--custom-base-url` มีค่าเริ่มต้นเป็น `http://127.0.0.1:11434` `--custom-model-id` เป็นตัวเลือกเสริม; หากไม่ระบุ onboarding จะใช้ค่าเริ่มต้นที่ Ollama แนะนำ model ID บนคลาวด์อย่าง `kimi-k2.5:cloud` ก็ใช้ที่นี่ได้เช่นกัน

เก็บคีย์ของผู้ให้บริการเป็น ref แทนข้อความล้วน:

```bash
openclaw onboard --non-interactive \
  --auth-choice openai-api-key \
  --secret-input-mode ref \
  --accept-risk
```

เมื่อใช้ `--secret-input-mode ref`, onboarding จะเขียน ref ที่อิงกับ env แทนค่าคีย์แบบข้อความล้วน
สำหรับผู้ให้บริการที่รองรับ auth-profile ระบบจะเขียนรายการ `keyRef`; สำหรับผู้ให้บริการแบบกำหนดเอง ระบบจะเขียน `models.providers.<id>.apiKey` เป็น env ref (เช่น `{ source: "env", provider: "default", id: "CUSTOM_API_KEY" }`)

สัญญาโหมด `ref` แบบ non-interactive:

- ตั้ง env var ของผู้ให้บริการไว้ในสภาพแวดล้อมของกระบวนการ onboarding (เช่น `OPENAI_API_KEY`)
- อย่าส่งแฟล็กคีย์แบบ inline (เช่น `--openai-api-key`) เว้นแต่ env var นั้นจะถูกตั้งไว้ด้วย
- หากส่งแฟล็กคีย์แบบ inline โดยไม่มี env var ที่จำเป็น onboarding จะล้มเหลวทันทีพร้อมคำแนะนำ

ตัวเลือก Gateway token ในโหมด non-interactive:

- `--gateway-auth token --gateway-token <token>` จะเก็บ token แบบข้อความล้วน
- `--gateway-auth token --gateway-token-ref-env <name>` จะเก็บ `gateway.auth.token` เป็น env SecretRef
- `--gateway-token` และ `--gateway-token-ref-env` ใช้ร่วมกันไม่ได้
- `--gateway-token-ref-env` ต้องมี env var ที่ไม่ว่างในสภาพแวดล้อมของกระบวนการ onboarding
- เมื่อใช้ `--install-daemon` หาก token auth ต้องใช้ token, Gateway token ที่จัดการด้วย SecretRef จะถูกตรวจสอบแต่จะไม่ถูกคงไว้เป็น plaintext ที่ resolve แล้วใน metadata ของสภาพแวดล้อม service ของ supervisor
- เมื่อใช้ `--install-daemon` หากโหมด token ต้องการ token และ SecretRef ของ token ที่กำหนดค่าไว้ยัง resolve ไม่ได้ onboarding จะ fail closed พร้อมคำแนะนำในการแก้ไข
- เมื่อใช้ `--install-daemon` หากมีการกำหนดทั้ง `gateway.auth.token` และ `gateway.auth.password` แต่ไม่ได้ตั้ง `gateway.auth.mode` onboarding จะบล็อกการติดตั้งจนกว่าจะมีการตั้งโหมดอย่างชัดเจน
- local onboarding จะเขียน `gateway.mode="local"` ลงใน config หากไฟล์ config ภายหลังไม่มี `gateway.mode` ให้ถือว่าเป็นความเสียหายของ config หรือการแก้ไขด้วยตนเองที่ไม่สมบูรณ์ ไม่ใช่ทางลัดโหมด local ที่ถูกต้อง
- `--allow-unconfigured` เป็น escape hatch ของ runtime Gateway ที่แยกต่างหาก มันไม่ได้หมายความว่า onboarding สามารถละ `gateway.mode` ได้

ตัวอย่าง:

```bash
export OPENCLAW_GATEWAY_TOKEN="your-token"
openclaw onboard --non-interactive \
  --mode local \
  --auth-choice skip \
  --gateway-auth token \
  --gateway-token-ref-env OPENCLAW_GATEWAY_TOKEN \
  --accept-risk
```

สุขภาพของ local Gateway แบบ non-interactive:

- เว้นแต่คุณจะส่ง `--skip-health`, onboarding จะรอจนกว่า local Gateway จะเข้าถึงได้ก่อนจึงจะออกสำเร็จ
- `--install-daemon` จะเริ่มเส้นทางติดตั้ง Gateway แบบมีการจัดการก่อน หากไม่ใช้ คุณต้องมี local Gateway ที่กำลังทำงานอยู่แล้ว เช่น `openclaw gateway run`
- หากคุณต้องการเพียงการเขียน config/workspace/bootstrap ใน Automation ให้ใช้ `--skip-health`
- บน Windows แบบ native, `--install-daemon` จะลองใช้ Scheduled Tasks ก่อน และ fallback ไปใช้ login item ใน Startup-folder ระดับผู้ใช้หากการสร้าง task ถูกปฏิเสธ

พฤติกรรมการ onboarding แบบโต้ตอบกับโหมด reference:

- เลือก **Use secret reference** เมื่อระบบถาม
- จากนั้นเลือกอย่างใดอย่างหนึ่ง:
  - ตัวแปรสภาพแวดล้อม
  - ผู้ให้บริการ secret ที่กำหนดค่าไว้ (`file` หรือ `exec`)
- Onboarding จะทำ preflight validation แบบรวดเร็วก่อนบันทึก ref
  - หาก validation ล้มเหลว onboarding จะแสดงข้อผิดพลาดและให้คุณลองใหม่ได้

ตัวเลือก endpoint ของ Z.AI แบบ non-interactive:

หมายเหตุ: ตอนนี้ `--auth-choice zai-api-key` จะตรวจจับ endpoint Z.AI ที่ดีที่สุดสำหรับคีย์ของคุณโดยอัตโนมัติ (ให้ความสำคัญกับ general API พร้อม `zai/glm-5.1`)
หากคุณต้องการ endpoint ของ GLM Coding Plan โดยเฉพาะ ให้เลือก `zai-coding-global` หรือ `zai-coding-cn`

```bash
# การเลือก endpoint แบบไม่ต้องมีพรอมป์
openclaw onboard --non-interactive \
  --auth-choice zai-coding-global \
  --zai-api-key "$ZAI_API_KEY"

# ตัวเลือก endpoint Z.AI อื่น ๆ:
# --auth-choice zai-coding-cn
# --auth-choice zai-global
# --auth-choice zai-cn
```

ตัวอย่าง Mistral แบบ non-interactive:

```bash
openclaw onboard --non-interactive \
  --auth-choice mistral-api-key \
  --mistral-api-key "$MISTRAL_API_KEY"
```

หมายเหตุของ flow:

- `quickstart`: พรอมป์น้อยที่สุด, สร้าง Gateway token อัตโนมัติ
- `manual`: พรอมป์เต็มรูปแบบสำหรับ port/bind/auth (เป็น alias ของ `advanced`)
- เมื่อ auth choice บ่งชี้ถึงผู้ให้บริการที่แนะนำ onboarding จะ prefilter ตัวเลือก default-model และ allowlist ไปยังผู้ให้บริการนั้น สำหรับ Volcengine และ BytePlus จะรวมถึงตัวแปร coding-plan ด้วย (`volcengine-plan/*`, `byteplus-plan/*`)
- หากตัวกรอง preferred-provider ไม่มี model ที่โหลดอยู่เลย onboarding จะ fallback ไปใช้ catalog ที่ไม่กรองแทนที่จะปล่อยให้ตัวเลือกว่าง
- ในขั้นตอน web-search ผู้ให้บริการบางรายสามารถกระตุ้นพรอมป์ติดตามผลเฉพาะผู้ให้บริการได้:
  - **Grok** อาจเสนอการตั้งค่า `x_search` แบบเลือกได้โดยใช้ `XAI_API_KEY` เดียวกัน และตัวเลือก model `x_search`
  - **Kimi** อาจถามถึง region ของ Moonshot API (`api.moonshot.ai` เทียบกับ `api.moonshot.cn`) และ model web-search เริ่มต้นของ Kimi
- พฤติกรรมขอบเขต DM ของ local onboarding: [CLI Setup Reference](/th/start/wizard-cli-reference#outputs-and-internals)
- แชตแรกที่เร็วที่สุด: `openclaw dashboard` (Control UI, ไม่ต้องตั้งค่าช่องทาง)
- ผู้ให้บริการแบบกำหนดเอง: เชื่อมต่อ endpoint ที่เข้ากันได้กับ OpenAI หรือ Anthropic ใดก็ได้ รวมถึงผู้ให้บริการโฮสต์ที่ไม่ได้อยู่ในรายการ ใช้ Unknown เพื่อให้ตรวจจับอัตโนมัติ

## คำสั่งติดตามผลที่พบบ่อย

```bash
openclaw configure
openclaw agents add <name>
```

<Note>
`--json` ไม่ได้หมายถึงโหมด non-interactive โดยอัตโนมัติ ใช้ `--non-interactive` สำหรับสคริปต์
</Note>
