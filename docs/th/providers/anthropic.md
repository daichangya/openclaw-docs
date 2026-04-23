---
read_when:
    - คุณต้องการใช้โมเดล Anthropic ใน OpenClaw
summary: ใช้ Anthropic Claude ผ่าน API keys หรือ Claude CLI ใน OpenClaw
title: Anthropic
x-i18n:
    generated_at: "2026-04-23T05:50:00Z"
    model: gpt-5.4
    provider: openai
    source_hash: 5e3dda5f98ade9d4c3841888103bfb43d59e075d358a701ed0ae3ffb8d5694a7
    source_path: providers/anthropic.md
    workflow: 15
---

# Anthropic (Claude)

Anthropic สร้างตระกูลโมเดล **Claude** OpenClaw รองรับเส้นทาง auth สองแบบ:

- **API key** — เข้าถึง Anthropic API โดยตรงพร้อมการคิดค่าบริการตามการใช้งาน (`anthropic/*` models)
- **Claude CLI** — ใช้การล็อกอิน Claude CLI ที่มีอยู่แล้วบนโฮสต์เดียวกันซ้ำ

<Warning>
ทีมงาน Anthropic แจ้งเราว่าการใช้งาน Claude CLI ในลักษณะของ OpenClaw ได้รับอนุญาตอีกครั้ง ดังนั้น
OpenClaw จึงถือว่าการใช้ Claude CLI ซ้ำและการใช้งาน `claude -p` เป็นสิ่งที่ได้รับอนุญาต เว้นแต่
Anthropic จะเผยแพร่นโยบายใหม่

สำหรับโฮสต์ gateway ที่รันระยะยาว Anthropic API key ยังคงเป็นเส้นทาง production
ที่ชัดเจนและคาดเดาได้มากที่สุด

เอกสารสาธารณะปัจจุบันของ Anthropic:

- [Claude Code CLI reference](https://code.claude.com/docs/en/cli-reference)
- [Claude Agent SDK overview](https://platform.claude.com/docs/en/agent-sdk/overview)
- [Using Claude Code with your Pro or Max plan](https://support.claude.com/en/articles/11145838-using-claude-code-with-your-pro-or-max-plan)
- [Using Claude Code with your Team or Enterprise plan](https://support.anthropic.com/en/articles/11845131-using-claude-code-with-your-team-or-enterprise-plan/)
  </Warning>

## เริ่มต้นใช้งาน

<Tabs>
  <Tab title="API key">
    **เหมาะที่สุดสำหรับ:** การเข้าถึง API แบบมาตรฐานและการคิดค่าบริการตามการใช้งาน

    <Steps>
      <Step title="รับ API key ของคุณ">
        สร้าง API key ใน [Anthropic Console](https://console.anthropic.com/)
      </Step>
      <Step title="รัน onboarding">
        ```bash
        openclaw onboard
        # เลือก: Anthropic API key
        ```

        หรือส่งคีย์โดยตรง:

        ```bash
        openclaw onboard --anthropic-api-key "$ANTHROPIC_API_KEY"
        ```
      </Step>
      <Step title="ตรวจสอบว่าโมเดลพร้อมใช้งาน">
        ```bash
        openclaw models list --provider anthropic
        ```
      </Step>
    </Steps>

    ### ตัวอย่าง config

    ```json5
    {
      env: { ANTHROPIC_API_KEY: "sk-ant-..." },
      agents: { defaults: { model: { primary: "anthropic/claude-opus-4-6" } } },
    }
    ```

  </Tab>

  <Tab title="Claude CLI">
    **เหมาะที่สุดสำหรับ:** ใช้การล็อกอิน Claude CLI ที่มีอยู่แล้วซ้ำ โดยไม่ต้องมี API key แยก

    <Steps>
      <Step title="ตรวจสอบให้แน่ใจว่าติดตั้งและล็อกอิน Claude CLI แล้ว">
        ตรวจสอบด้วย:

        ```bash
        claude --version
        ```
      </Step>
      <Step title="รัน onboarding">
        ```bash
        openclaw onboard
        # เลือก: Claude CLI
        ```

        OpenClaw จะตรวจจับและใช้ข้อมูลรับรอง Claude CLI ที่มีอยู่แล้วซ้ำ
      </Step>
      <Step title="ตรวจสอบว่าโมเดลพร้อมใช้งาน">
        ```bash
        openclaw models list --provider anthropic
        ```
      </Step>
    </Steps>

    <Note>
    รายละเอียดการตั้งค่าและรันไทม์สำหรับ Claude CLI backend อยู่ใน [CLI Backends](/th/gateway/cli-backends)
    </Note>

    <Tip>
    หากคุณต้องการเส้นทางด้านการเรียกเก็บเงินที่ชัดเจนที่สุด ให้ใช้ Anthropic API key แทน OpenClaw ยังรองรับตัวเลือกแบบสมัครสมาชิกจาก [OpenAI Codex](/th/providers/openai), [Qwen Cloud](/th/providers/qwen), [MiniMax](/th/providers/minimax) และ [Z.AI / GLM](/th/providers/glm) ด้วย
    </Tip>

  </Tab>
</Tabs>

## ค่าเริ่มต้นของ thinking (Claude 4.6)

โมเดล Claude 4.6 จะใช้ `adaptive` thinking เป็นค่าเริ่มต้นใน OpenClaw เมื่อไม่ได้ตั้งระดับ thinking แบบ explicit

override ต่อข้อความได้ด้วย `/think:<level>` หรือใน model params:

```json5
{
  agents: {
    defaults: {
      models: {
        "anthropic/claude-opus-4-6": {
          params: { thinking: "adaptive" },
        },
      },
    },
  },
}
```

<Note>
เอกสาร Anthropic ที่เกี่ยวข้อง:
- [Adaptive thinking](https://platform.claude.com/docs/en/build-with-claude/adaptive-thinking)
- [Extended thinking](https://platform.claude.com/docs/en/build-with-claude/extended-thinking)
</Note>

## Prompt caching

OpenClaw รองรับฟีเจอร์ prompt caching ของ Anthropic สำหรับการยืนยันตัวตนด้วย API key

| ค่า                 | ระยะเวลา cache | คำอธิบาย                                 |
| ------------------- | -------------- | ---------------------------------------- |
| `"short"` (ค่าเริ่มต้น) | 5 นาที      | ใช้โดยอัตโนมัติสำหรับ API-key auth      |
| `"long"`            | 1 ชั่วโมง      | cache แบบขยายเวลา                        |
| `"none"`            | ไม่มี cache    | ปิด prompt caching                       |

```json5
{
  agents: {
    defaults: {
      models: {
        "anthropic/claude-opus-4-6": {
          params: { cacheRetention: "long" },
        },
      },
    },
  },
}
```

<AccordionGroup>
  <Accordion title="override cache ต่อเอเจนต์">
    ใช้ model-level params เป็น baseline ของคุณ จากนั้น override เอเจนต์เฉพาะผ่าน `agents.list[].params`:

    ```json5
    {
      agents: {
        defaults: {
          model: { primary: "anthropic/claude-opus-4-6" },
          models: {
            "anthropic/claude-opus-4-6": {
              params: { cacheRetention: "long" },
            },
          },
        },
        list: [
          { id: "research", default: true },
          { id: "alerts", params: { cacheRetention: "none" } },
        ],
      },
    }
    ```

    ลำดับการ merge ของ config:

    1. `agents.defaults.models["provider/model"].params`
    2. `agents.list[].params` (จับคู่ตาม `id`, override ตามคีย์)

    สิ่งนี้ทำให้เอเจนต์หนึ่งสามารถเก็บ cache ระยะยาวไว้ได้ ขณะที่อีกเอเจนต์หนึ่งบนโมเดลเดียวกันปิด caching สำหรับทราฟฟิกแบบ bursty/การใช้ซ้ำต่ำ

  </Accordion>

  <Accordion title="หมายเหตุเกี่ยวกับ Bedrock Claude">
    - โมเดล Anthropic Claude บน Bedrock (`amazon-bedrock/*anthropic.claude*`) รับค่า `cacheRetention` แบบ pass-through เมื่อมีการกำหนดค่า
    - โมเดล Bedrock ที่ไม่ใช่ Anthropic จะถูกบังคับให้ใช้ `cacheRetention: "none"` ในรันไทม์
    - ค่าเริ่มต้นอัจฉริยะแบบ API-key ยังเติม `cacheRetention: "short"` ให้สำหรับ ref ของ Claude-on-Bedrock เมื่อไม่มีการตั้งค่า explicit
  </Accordion>
</AccordionGroup>

## การกำหนดค่าขั้นสูง

<AccordionGroup>
  <Accordion title="โหมด Fast">
    ตัวสลับ `/fast` แบบใช้ร่วมกันของ OpenClaw รองรับทราฟฟิก Anthropic โดยตรง (API-key และ OAuth ไปยัง `api.anthropic.com`)

    | คำสั่ง | แมปไปที่ |
    |---------|---------|
    | `/fast on` | `service_tier: "auto"` |
    | `/fast off` | `service_tier: "standard_only"` |

    ```json5
    {
      agents: {
        defaults: {
          models: {
            "anthropic/claude-sonnet-4-6": {
              params: { fastMode: true },
            },
          },
        },
      },
    }
    ```

    <Note>
    - จะถูกฉีดเข้าไปเฉพาะสำหรับคำขอโดยตรงไปยัง `api.anthropic.com` เท่านั้น เส้นทาง proxy จะไม่แตะต้อง `service_tier`
    - ค่า `serviceTier` หรือ `service_tier` แบบ explicit จะ override `/fast` เมื่อมีการตั้งค่าทั้งสองอย่าง
    - บนบัญชีที่ไม่มี Priority Tier capacity ค่า `service_tier: "auto"` อาจ resolve เป็น `standard`
    </Note>

  </Accordion>

  <Accordion title="Media understanding (ภาพและ PDF)">
    Anthropic plugin ที่มาพร้อมกันจะ register ความสามารถในการเข้าใจภาพและ PDF OpenClaw
    จะ resolve ความสามารถด้านสื่อโดยอัตโนมัติจาก Anthropic auth ที่กำหนดไว้ — ไม่ต้อง
    มี config เพิ่มเติม

    | Property       | Value                |
    | -------------- | -------------------- |
    | โมเดลเริ่มต้น  | `claude-opus-4-6`    |
    | อินพุตที่รองรับ | Images, PDF documents |

    เมื่อมีการแนบภาพหรือ PDF เข้ากับการสนทนา OpenClaw จะกำหนดเส้นทางมันโดยอัตโนมัติ
    ผ่าน Anthropic media understanding provider

  </Accordion>

  <Accordion title="หน้าต่างบริบท 1M (beta)">
    หน้าต่างบริบท 1M ของ Anthropic ถูกควบคุมด้วยสิทธิ์ beta เปิดใช้ต่อโมเดลได้ดังนี้:

    ```json5
    {
      agents: {
        defaults: {
          models: {
            "anthropic/claude-opus-4-6": {
              params: { context1m: true },
            },
          },
        },
      },
    }
    ```

    OpenClaw จะ map สิ่งนี้ไปเป็น `anthropic-beta: context-1m-2025-08-07` ในคำขอ

    <Warning>
    ต้องมีสิทธิ์ long-context บนข้อมูลรับรอง Anthropic ของคุณ legacy token auth (`sk-ant-oat-*`) จะถูกปฏิเสธสำหรับคำขอ 1M context — OpenClaw จะบันทึกคำเตือนและ fallback ไปยังหน้าต่างบริบทมาตรฐาน
    </Warning>

  </Accordion>
</AccordionGroup>

## การแก้ไขปัญหา

<AccordionGroup>
  <Accordion title="401 errors / token ใช้งานไม่ได้กะทันหัน">
    token auth ของ Anthropic อาจหมดอายุหรือถูกเพิกถอน สำหรับการตั้งค่าใหม่ แนะนำให้ย้ายไปใช้ Anthropic API key
  </Accordion>

  <Accordion title='No API key found for provider "anthropic"'>
    Auth เป็นแบบ **ต่อเอเจนต์** เอเจนต์ใหม่จะไม่สืบทอดคีย์ของเอเจนต์หลัก ให้รัน onboarding ใหม่สำหรับเอเจนต์นั้น หรือกำหนดค่า API key บนโฮสต์ของ gateway จากนั้นตรวจสอบด้วย `openclaw models status`
  </Accordion>

  <Accordion title='No credentials found for profile "anthropic:default"'>
    รัน `openclaw models status` เพื่อดูว่า auth profile ใดกำลัง active อยู่ รัน onboarding ใหม่ หรือกำหนดค่า API key สำหรับพาธโปรไฟล์นั้น
  </Accordion>

  <Accordion title="No available auth profile (all in cooldown)">
    ตรวจสอบ `openclaw models status --json` เพื่อดู `auth.unusableProfiles` cooldown จาก rate-limit ของ Anthropic อาจมีขอบเขตเป็นรายโมเดล ดังนั้นโมเดล Anthropic ที่เป็น sibling อาจยังใช้งานได้ ให้เพิ่ม Anthropic profile อีกตัว หรือรอให้ cooldown หมด
  </Accordion>
</AccordionGroup>

<Note>
ความช่วยเหลือเพิ่มเติม: [การแก้ไขปัญหา](/th/help/troubleshooting) และ [FAQ](/th/help/faq)
</Note>

## ที่เกี่ยวข้อง

<CardGroup cols={2}>
  <Card title="การเลือกโมเดล" href="/th/concepts/model-providers" icon="layers">
    การเลือกผู้ให้บริการ, model ref และพฤติกรรม failover
  </Card>
  <Card title="CLI backends" href="/th/gateway/cli-backends" icon="terminal">
    การตั้งค่า Claude CLI backend และรายละเอียดของรันไทม์
  </Card>
  <Card title="Prompt caching" href="/th/reference/prompt-caching" icon="database">
    วิธีการทำงานของ prompt caching ข้ามผู้ให้บริการ
  </Card>
  <Card title="OAuth และ auth" href="/th/gateway/authentication" icon="key">
    รายละเอียดของ auth และกฎการใช้ข้อมูลรับรองซ้ำ
  </Card>
</CardGroup>
