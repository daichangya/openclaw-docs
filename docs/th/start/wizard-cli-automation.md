---
read_when:
    - คุณกำลังทำ onboarding แบบอัตโนมัติในสคริปต์หรือ CI
    - คุณต้องการตัวอย่างแบบ non-interactive สำหรับผู้ให้บริการเฉพาะ【final
sidebarTitle: CLI automation
summary: การเริ่มต้นใช้งานแบบสคริปต์และการตั้งค่าเอเจนต์สำหรับ OpenClaw CLI
title: การทำงานอัตโนมัติผ่าน CLI
x-i18n:
    generated_at: "2026-04-23T05:58:00Z"
    model: gpt-5.4
    provider: openai
    source_hash: bca2dd6e482a16b27284fc76319e936e8df0ff5558134827c19f6875436cc652
    source_path: start/wizard-cli-automation.md
    workflow: 15
---

# การทำงานอัตโนมัติผ่าน CLI

ใช้ `--non-interactive` เพื่อทำ `openclaw onboard` แบบอัตโนมัติ

<Note>
`--json` ไม่ได้หมายถึงโหมด non-interactive โดยอัตโนมัติ สำหรับสคริปต์ ให้ใช้ `--non-interactive` (และ `--workspace`)
</Note>

## ตัวอย่าง non-interactive พื้นฐาน

```bash
openclaw onboard --non-interactive \
  --mode local \
  --auth-choice apiKey \
  --anthropic-api-key "$ANTHROPIC_API_KEY" \
  --secret-input-mode plaintext \
  --gateway-port 18789 \
  --gateway-bind loopback \
  --install-daemon \
  --daemon-runtime node \
  --skip-skills
```

เพิ่ม `--json` หากต้องการสรุปแบบ machine-readable

ใช้ `--secret-input-mode ref` เพื่อเก็บ refs ที่อิง env ลงใน auth profiles แทนค่าข้อความล้วน
การเลือกแบบ interactive ระหว่าง env refs และ configured provider refs (`file` หรือ `exec`) มีให้ใช้ใน onboarding flow

ในโหมด non-interactive แบบ `ref`, provider env vars ต้องถูกตั้งไว้ใน process environment
หากส่ง inline key flags โดยไม่มี env var ที่ตรงกัน ระบบจะล้มเหลวทันที

ตัวอย่าง:

```bash
openclaw onboard --non-interactive \
  --mode local \
  --auth-choice openai-api-key \
  --secret-input-mode ref \
  --accept-risk
```

## ตัวอย่างเฉพาะผู้ให้บริการ

<AccordionGroup>
  <Accordion title="ตัวอย่าง Anthropic API key">
    ```bash
    openclaw onboard --non-interactive \
      --mode local \
      --auth-choice apiKey \
      --anthropic-api-key "$ANTHROPIC_API_KEY" \
      --gateway-port 18789 \
      --gateway-bind loopback
    ```
  </Accordion>
  <Accordion title="ตัวอย่าง Gemini">
    ```bash
    openclaw onboard --non-interactive \
      --mode local \
      --auth-choice gemini-api-key \
      --gemini-api-key "$GEMINI_API_KEY" \
      --gateway-port 18789 \
      --gateway-bind loopback
    ```
  </Accordion>
  <Accordion title="ตัวอย่าง Z.AI">
    ```bash
    openclaw onboard --non-interactive \
      --mode local \
      --auth-choice zai-api-key \
      --zai-api-key "$ZAI_API_KEY" \
      --gateway-port 18789 \
      --gateway-bind loopback
    ```
  </Accordion>
  <Accordion title="ตัวอย่าง Vercel AI Gateway">
    ```bash
    openclaw onboard --non-interactive \
      --mode local \
      --auth-choice ai-gateway-api-key \
      --ai-gateway-api-key "$AI_GATEWAY_API_KEY" \
      --gateway-port 18789 \
      --gateway-bind loopback
    ```
  </Accordion>
  <Accordion title="ตัวอย่าง Cloudflare AI Gateway">
    ```bash
    openclaw onboard --non-interactive \
      --mode local \
      --auth-choice cloudflare-ai-gateway-api-key \
      --cloudflare-ai-gateway-account-id "your-account-id" \
      --cloudflare-ai-gateway-gateway-id "your-gateway-id" \
      --cloudflare-ai-gateway-api-key "$CLOUDFLARE_AI_GATEWAY_API_KEY" \
      --gateway-port 18789 \
      --gateway-bind loopback
    ```
  </Accordion>
  <Accordion title="ตัวอย่าง Moonshot">
    ```bash
    openclaw onboard --non-interactive \
      --mode local \
      --auth-choice moonshot-api-key \
      --moonshot-api-key "$MOONSHOT_API_KEY" \
      --gateway-port 18789 \
      --gateway-bind loopback
    ```
  </Accordion>
  <Accordion title="ตัวอย่าง Mistral">
    ```bash
    openclaw onboard --non-interactive \
      --mode local \
      --auth-choice mistral-api-key \
      --mistral-api-key "$MISTRAL_API_KEY" \
      --gateway-port 18789 \
      --gateway-bind loopback
    ```
  </Accordion>
  <Accordion title="ตัวอย่าง Synthetic">
    ```bash
    openclaw onboard --non-interactive \
      --mode local \
      --auth-choice synthetic-api-key \
      --synthetic-api-key "$SYNTHETIC_API_KEY" \
      --gateway-port 18789 \
      --gateway-bind loopback
    ```
  </Accordion>
  <Accordion title="ตัวอย่าง OpenCode">
    ```bash
    openclaw onboard --non-interactive \
      --mode local \
      --auth-choice opencode-zen \
      --opencode-zen-api-key "$OPENCODE_API_KEY" \
      --gateway-port 18789 \
      --gateway-bind loopback
    ```
    สลับเป็น `--auth-choice opencode-go --opencode-go-api-key "$OPENCODE_API_KEY"` สำหรับแค็ตตาล็อก Go
  </Accordion>
  <Accordion title="ตัวอย่าง Ollama">
    ```bash
    openclaw onboard --non-interactive \
      --mode local \
      --auth-choice ollama \
      --custom-model-id "qwen3.5:27b" \
      --accept-risk \
      --gateway-port 18789 \
      --gateway-bind loopback
    ```
  </Accordion>
  <Accordion title="ตัวอย่าง Custom provider">
    ```bash
    openclaw onboard --non-interactive \
      --mode local \
      --auth-choice custom-api-key \
      --custom-base-url "https://llm.example.com/v1" \
      --custom-model-id "foo-large" \
      --custom-api-key "$CUSTOM_API_KEY" \
      --custom-provider-id "my-custom" \
      --custom-compatibility anthropic \
      --gateway-port 18789 \
      --gateway-bind loopback
    ```

    `--custom-api-key` เป็นตัวเลือก หากละไว้ onboarding จะตรวจสอบ `CUSTOM_API_KEY`

    ตัวแปรแบบ ref-mode:

    ```bash
    export CUSTOM_API_KEY="your-key"
    openclaw onboard --non-interactive \
      --mode local \
      --auth-choice custom-api-key \
      --custom-base-url "https://llm.example.com/v1" \
      --custom-model-id "foo-large" \
      --secret-input-mode ref \
      --custom-provider-id "my-custom" \
      --custom-compatibility anthropic \
      --gateway-port 18789 \
      --gateway-bind loopback
    ```

    ในโหมดนี้ onboarding จะเก็บ `apiKey` เป็น `{ source: "env", provider: "default", id: "CUSTOM_API_KEY" }`

  </Accordion>
</AccordionGroup>

setup-token ของ Anthropic ยังคงใช้ได้ในฐานะเส้นทาง token สำหรับ onboarding ที่รองรับ แต่ตอนนี้ OpenClaw จะให้ความสำคัญกับการนำ Claude CLI มาใช้ซ้ำเมื่อมีให้ใช้
สำหรับ production ควรใช้ Anthropic API key

## เพิ่มเอเจนต์อีกตัว

ใช้ `openclaw agents add <name>` เพื่อสร้างเอเจนต์แยกที่มี workspace,
sessions และ auth profiles ของตัวเอง การรันโดยไม่มี `--workspace` จะเปิดวิซาร์ด

```bash
openclaw agents add work \
  --workspace ~/.openclaw/workspace-work \
  --model openai/gpt-5.4 \
  --bind whatsapp:biz \
  --non-interactive \
  --json
```

สิ่งที่มันตั้งค่า:

- `agents.list[].name`
- `agents.list[].workspace`
- `agents.list[].agentDir`

หมายเหตุ:

- workspace เริ่มต้นใช้รูปแบบ `~/.openclaw/workspace-<agentId>`
- เพิ่ม `bindings` เพื่อจัดเส้นทางข้อความขาเข้า (วิซาร์ดสามารถทำสิ่งนี้ได้)
- แฟล็กสำหรับ non-interactive: `--model`, `--agent-dir`, `--bind`, `--non-interactive`

## เอกสารที่เกี่ยวข้อง

- ศูนย์กลาง onboarding: [Onboarding (CLI)](/th/start/wizard)
- เอกสารอ้างอิงแบบเต็ม: [CLI Setup Reference](/th/start/wizard-cli-reference)
- เอกสารอ้างอิงคำสั่ง: [`openclaw onboard`](/cli/onboard)
