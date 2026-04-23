---
read_when:
    - คุณต้องการการตั้งค่าแบบมีคำแนะนำสำหรับ gateway, workspace, auth, channels และ Skills
summary: ข้อมูลอ้างอิง CLI สำหรับ `openclaw onboard` (การเริ่มต้นใช้งานแบบโต้ตอบ)
title: onboard
x-i18n:
    generated_at: "2026-04-23T06:19:01Z"
    model: gpt-5.4
    provider: openai
    source_hash: 348ee9cbc14ff78b588f10297e728473668a72f9f16be385f25022bf5108340c
    source_path: cli/onboard.md
    workflow: 15
---

# `openclaw onboard`

การเริ่มต้นใช้งานแบบโต้ตอบสำหรับการตั้งค่า Gateway แบบ local หรือระยะไกล

## คู่มือที่เกี่ยวข้อง

- ศูนย์รวมการเริ่มต้นใช้งาน CLI: [การเริ่มต้นใช้งาน (CLI)](/th/start/wizard)
- ภาพรวมการเริ่มต้นใช้งาน: [ภาพรวมการเริ่มต้นใช้งาน](/th/start/onboarding-overview)
- ข้อมูลอ้างอิงการเริ่มต้นใช้งาน CLI: [ข้อมูลอ้างอิงการตั้งค่า CLI](/th/start/wizard-cli-reference)
- ระบบอัตโนมัติของ CLI: [ระบบอัตโนมัติของ CLI](/th/start/wizard-cli-automation)
- การเริ่มต้นใช้งานบน macOS: [การเริ่มต้นใช้งาน (แอป macOS)](/th/start/onboarding)

## ตัวอย่าง

```bash
openclaw onboard
openclaw onboard --flow quickstart
openclaw onboard --flow manual
openclaw onboard --mode remote --remote-url wss://gateway-host:18789
```

สำหรับเป้าหมาย `ws://` แบบ plaintext บนเครือข่ายส่วนตัว (เฉพาะเครือข่ายที่เชื่อถือได้เท่านั้น) ให้ตั้งค่า
`OPENCLAW_ALLOW_INSECURE_PRIVATE_WS=1` ในสภาพแวดล้อมของกระบวนการ onboarding

provider แบบกำหนดเองในโหมด non-interactive:

```bash
openclaw onboard --non-interactive \
  --auth-choice custom-api-key \
  --custom-base-url "https://llm.example.com/v1" \
  --custom-model-id "foo-large" \
  --custom-api-key "$CUSTOM_API_KEY" \
  --secret-input-mode plaintext \
  --custom-compatibility openai
```

`--custom-api-key` เป็นตัวเลือกเสริมในโหมด non-interactive หากไม่ระบุ onboarding จะตรวจสอบ `CUSTOM_API_KEY`

LM Studio ยังรองรับแฟล็กคีย์เฉพาะ provider ในโหมด non-interactive:

```bash
openclaw onboard --non-interactive \
  --auth-choice lmstudio \
  --custom-base-url "http://localhost:1234/v1" \
  --custom-model-id "qwen/qwen3.5-9b" \
  --lmstudio-api-key "$LM_API_TOKEN" \
  --accept-risk
```

Ollama ในโหมด non-interactive:

```bash
openclaw onboard --non-interactive \
  --auth-choice ollama \
  --custom-base-url "http://ollama-host:11434" \
  --custom-model-id "qwen3.5:27b" \
  --accept-risk
```

`--custom-base-url` มีค่าเริ่มต้นเป็น `http://127.0.0.1:11434` `--custom-model-id` เป็นตัวเลือกเสริม; หากไม่ระบุ onboarding จะใช้ค่าเริ่มต้นที่ Ollama แนะนำ model IDs บน cloud เช่น `kimi-k2.5:cloud` ก็ใช้ได้ที่นี่เช่นกัน

จัดเก็บคีย์ของ provider เป็น refs แทน plaintext:

```bash
openclaw onboard --non-interactive \
  --auth-choice openai-api-key \
  --secret-input-mode ref \
  --accept-risk
```

เมื่อใช้ `--secret-input-mode ref` onboarding จะเขียน refs ที่อิง env แทนค่าคีย์แบบ plaintext
สำหรับ providers ที่อิง auth-profile การดำเนินการนี้จะเขียนรายการ `keyRef`; สำหรับ providers แบบกำหนดเอง การดำเนินการนี้จะเขียน `models.providers.<id>.apiKey` เป็น env ref (ตัวอย่างเช่น `{ source: "env", provider: "default", id: "CUSTOM_API_KEY" }`)

สัญญาของโหมด `ref` แบบ non-interactive:

- ตั้งค่า env var ของ provider ในสภาพแวดล้อมของกระบวนการ onboarding (เช่น `OPENAI_API_KEY`)
- อย่าส่งแฟล็กคีย์แบบ inline (เช่น `--openai-api-key`) เว้นแต่ env var นั้นจะถูกตั้งค่าไว้ด้วย
- หากส่งแฟล็กคีย์แบบ inline โดยไม่มี env var ที่จำเป็น onboarding จะล้มเหลวทันทีพร้อมคำแนะนำ

ตัวเลือก gateway token ในโหมด non-interactive:

- `--gateway-auth token --gateway-token <token>` จัดเก็บ token แบบ plaintext
- `--gateway-auth token --gateway-token-ref-env <name>` จัดเก็บ `gateway.auth.token` เป็น env SecretRef
- `--gateway-token` และ `--gateway-token-ref-env` ใช้ร่วมกันไม่ได้
- `--gateway-token-ref-env` ต้องมี env var ที่ไม่ว่างอยู่ในสภาพแวดล้อมของกระบวนการ onboarding
- เมื่อใช้ `--install-daemon` หาก token auth ต้องใช้ token, gateway tokens ที่จัดการด้วย SecretRef จะถูกตรวจสอบ แต่จะไม่ถูกบันทึกเป็น plaintext ที่ resolve แล้วใน metadata ของ environment ของบริการ supervisor
- เมื่อใช้ `--install-daemon` หากโหมด token ต้องใช้ token และ token SecretRef ที่กำหนดค่าไว้ยัง resolve ไม่ได้ onboarding จะล้มเหลวแบบ fail closed พร้อมคำแนะนำในการแก้ไข
- เมื่อใช้ `--install-daemon` หากมีการกำหนดค่าทั้ง `gateway.auth.token` และ `gateway.auth.password` และไม่ได้ตั้งค่า `gateway.auth.mode` onboarding จะบล็อกการติดตั้งจนกว่าจะตั้งค่า mode อย่างชัดเจน
- การเริ่มต้นใช้งานแบบ local จะเขียน `gateway.mode="local"` ลงใน config หากภายหลังไฟล์ config ไม่มี `gateway.mode` ให้ถือว่าเป็นความเสียหายของ config หรือการแก้ไขด้วยตนเองที่ไม่สมบูรณ์ ไม่ใช่ทางลัดของ local mode ที่ถูกต้อง
- `--allow-unconfigured` เป็น escape hatch ของ runtime ของ gateway แยกต่างหาก ไม่ได้หมายความว่า onboarding สามารถละเว้น `gateway.mode` ได้

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

สถานะสุขภาพของ local gateway ในโหมด non-interactive:

- เว้นแต่คุณจะส่ง `--skip-health` onboarding จะรอให้ local gateway เข้าถึงได้ก่อนจึงจะออกสำเร็จ
- `--install-daemon` จะเริ่มเส้นทางการติดตั้ง gateway แบบจัดการให้ก่อน หากไม่ใช้ คุณต้องมี local gateway ที่กำลังรันอยู่แล้ว เช่น `openclaw gateway run`
- หากคุณต้องการเพียงการเขียน config/workspace/bootstrap ในระบบอัตโนมัติ ให้ใช้ `--skip-health`
- บน Windows แบบ native, `--install-daemon` จะพยายามใช้ Scheduled Tasks ก่อน และจะ fallback ไปยัง login item ต่อผู้ใช้ในโฟลเดอร์ Startup หากการสร้าง task ถูกปฏิเสธ

พฤติกรรมการเริ่มต้นใช้งานแบบโต้ตอบในโหมด reference:

- เลือก **Use secret reference** เมื่อมีพรอมป์ต์
- จากนั้นเลือกอย่างใดอย่างหนึ่ง:
  - ตัวแปรสภาพแวดล้อม
  - provider ของ secret ที่ตั้งค่าไว้ (`file` หรือ `exec`)
- Onboarding จะทำการตรวจสอบ preflight แบบรวดเร็วก่อนบันทึก ref
  - หากการตรวจสอบล้มเหลว onboarding จะแสดงข้อผิดพลาดและให้คุณลองใหม่ได้

ตัวเลือก endpoint ของ Z.AI ในโหมด non-interactive:

หมายเหตุ: ขณะนี้ `--auth-choice zai-api-key` จะตรวจจับ endpoint ของ Z.AI ที่เหมาะสมที่สุดสำหรับคีย์ของคุณโดยอัตโนมัติ (ให้ความสำคัญกับ general API ที่ใช้ `zai/glm-5.1`)
หากคุณต้องการ GLM Coding Plan endpoints โดยเฉพาะ ให้เลือก `zai-coding-global` หรือ `zai-coding-cn`

```bash
# การเลือก endpoint โดยไม่มีพรอมป์ต์
openclaw onboard --non-interactive \
  --auth-choice zai-coding-global \
  --zai-api-key "$ZAI_API_KEY"

# ตัวเลือก endpoint ของ Z.AI อื่น ๆ:
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

หมายเหตุเกี่ยวกับ flow:

- `quickstart`: พรอมป์ต์น้อยที่สุด สร้าง gateway token โดยอัตโนมัติ
- `manual`: พรอมป์ต์แบบเต็มสำหรับ port/bind/auth (ชื่อเรียกแทนของ `advanced`)
- เมื่อ auth choice บ่งชี้ถึง provider ที่ควรใช้เป็นพิเศษ onboarding จะ prefilter ตัวเลือก default-model และ allowlist ไปยัง provider นั้น สำหรับ Volcengine และ BytePlus จะรวมถึงรุ่น coding-plan ด้วย
  (`volcengine-plan/*`, `byteplus-plan/*`)
- หากตัวกรอง preferred-provider ยังไม่พบ models ที่โหลดไว้ onboarding จะ fallback ไปใช้ catalog ที่ไม่กรอง แทนที่จะปล่อยให้ตัวเลือกว่าง
- ในขั้นตอน web-search บาง providers อาจทำให้เกิดพรอมป์ต์ติดตามผลเฉพาะ provider:
  - **Grok** อาจเสนอการตั้งค่า `x_search` แบบไม่บังคับด้วย `XAI_API_KEY` เดียวกัน
    และตัวเลือกโมเดล `x_search`
  - **Kimi** อาจถาม region ของ Moonshot API (`api.moonshot.ai` เทียบกับ
    `api.moonshot.cn`) และโมเดล web-search เริ่มต้นของ Kimi
- พฤติกรรมขอบเขต DM ของการเริ่มต้นใช้งานแบบ local: [ข้อมูลอ้างอิงการตั้งค่า CLI](/th/start/wizard-cli-reference#outputs-and-internals)
- แชตแรกที่เร็วที่สุด: `openclaw dashboard` (Control UI โดยไม่ต้องตั้งค่า channel)
- Custom Provider: เชื่อมต่อ endpoint ที่เข้ากันได้กับ OpenAI หรือ Anthropic ใดก็ได้
  รวมถึง providers แบบ hosted ที่ไม่ได้ระบุไว้ ใช้ Unknown เพื่อตรวจจับอัตโนมัติ

## คำสั่งติดตามผลที่พบบ่อย

```bash
openclaw configure
openclaw agents add <name>
```

<Note>
`--json` ไม่ได้หมายความว่าเป็นโหมด non-interactive ใช้ `--non-interactive` สำหรับสคริปต์
</Note>
