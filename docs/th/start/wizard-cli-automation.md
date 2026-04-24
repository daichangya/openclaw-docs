---
read_when:
    - คุณกำลังทำให้การเริ่มต้นใช้งานเป็นแบบอัตโนมัติในสคริปต์หรือ CI
    - คุณต้องการตัวอย่างแบบไม่โต้ตอบสำหรับ provider ที่เฉพาะเจาะจง
sidebarTitle: CLI automation
summary: การเริ่มต้นใช้งานแบบสคริปต์และการตั้งค่าเอเจนต์สำหรับ OpenClaw CLI
title: การทำงานอัตโนมัติของ CLI
x-i18n:
    generated_at: "2026-04-24T09:34:08Z"
    model: gpt-5.4
    provider: openai
    source_hash: b114b6b4773af8f23be0e65485bdcb617848e35cfde1642776c75108d470cea3
    source_path: start/wizard-cli-automation.md
    workflow: 15
---

ใช้ `--non-interactive` เพื่อทำ `openclaw onboard` ให้เป็นอัตโนมัติ

<Note>
`--json` ไม่ได้หมายความว่าจะเป็นโหมดไม่โต้ตอบโดยอัตโนมัติ สำหรับสคริปต์ให้ใช้ `--non-interactive` (และ `--workspace`)
</Note>

## ตัวอย่างพื้นฐานแบบไม่โต้ตอบ

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

เพิ่ม `--json` เพื่อให้ได้สรุปที่เครื่องอ่านได้

ใช้ `--secret-input-mode ref` เพื่อเก็บ ref ที่อิง env ไว้ใน auth profile แทนการเก็บค่าแบบ plaintext
ในการเริ่มต้นใช้งานมีการเลือกแบบโต้ตอบระหว่าง env refs และ provider refs ที่กำหนดค่าไว้ (`file` หรือ `exec`)

ในโหมด `ref` แบบไม่โต้ตอบ ตัวแปร env ของ provider ต้องถูกตั้งค่าไว้ใน environment ของโปรเซส
หากส่งแฟล็กคีย์แบบ inline โดยไม่มี env var ที่ตรงกัน ระบบจะล้มเหลวทันที

ตัวอย่าง:

```bash
openclaw onboard --non-interactive \
  --mode local \
  --auth-choice openai-api-key \
  --secret-input-mode ref \
  --accept-risk
```

## ตัวอย่างเฉพาะ provider

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
  <Accordion title="ตัวอย่าง provider แบบกำหนดเอง">
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

    `--custom-api-key` เป็นทางเลือก หากไม่ระบุ การเริ่มต้นใช้งานจะตรวจสอบ `CUSTOM_API_KEY`

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

    ในโหมดนี้ การเริ่มต้นใช้งานจะเก็บ `apiKey` เป็น `{ source: "env", provider: "default", id: "CUSTOM_API_KEY" }`

  </Accordion>
</AccordionGroup>

Anthropic setup-token ยังคงใช้งานได้ในฐานะเส้นทางโทเค็นที่รองรับสำหรับการเริ่มต้นใช้งาน แต่ตอนนี้ OpenClaw จะเลือกใช้ Claude CLI ซ้ำก่อนเมื่อพร้อมใช้งาน
สำหรับการใช้งานจริง แนะนำให้ใช้ Anthropic API key

## เพิ่มเอเจนต์อีกตัว

ใช้ `openclaw agents add <name>` เพื่อสร้างเอเจนต์แยกต่างหากที่มี workspace,
เซสชัน และ auth profiles ของตัวเอง หากรันโดยไม่ใช้ `--workspace` ระบบจะเปิดวิซาร์ด

```bash
openclaw agents add work \
  --workspace ~/.openclaw/workspace-work \
  --model openai/gpt-5.4 \
  --bind whatsapp:biz \
  --non-interactive \
  --json
```

สิ่งที่จะถูกตั้งค่า:

- `agents.list[].name`
- `agents.list[].workspace`
- `agents.list[].agentDir`

หมายเหตุ:

- workspace เริ่มต้นจะเป็นรูปแบบ `~/.openclaw/workspace-<agentId>`
- เพิ่ม `bindings` เพื่อกำหนดเส้นทางข้อความขาเข้า (วิซาร์ดสามารถทำได้)
- แฟล็กสำหรับโหมดไม่โต้ตอบ: `--model`, `--agent-dir`, `--bind`, `--non-interactive`

## เอกสารที่เกี่ยวข้อง

- ศูนย์กลางการเริ่มต้นใช้งาน: [Onboarding (CLI)](/th/start/wizard)
- เอกสารอ้างอิงแบบเต็ม: [CLI Setup Reference](/th/start/wizard-cli-reference)
- เอกสารอ้างอิงคำสั่ง: [`openclaw onboard`](/th/cli/onboard)
