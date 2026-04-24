---
read_when:
    - คุณต้องการใช้โมเดล Anthropic ใน OpenClaw
summary: ใช้ Anthropic Claude ผ่าน API key หรือ Claude CLI ใน OpenClaw
title: Anthropic
x-i18n:
    generated_at: "2026-04-24T09:26:59Z"
    model: gpt-5.4
    provider: openai
    source_hash: 9db63fd33dce27b18f5807c995d9ce71b9d14fde55064f745bace31d7991b985
    source_path: providers/anthropic.md
    workflow: 15
---

# Anthropic (Claude)

Anthropic พัฒนาโมเดลตระกูล **Claude** OpenClaw รองรับเส้นทางการยืนยันตัวตน 2 แบบ:

- **API key** — เข้าถึง Anthropic API โดยตรงพร้อมการเรียกเก็บเงินตามการใช้งาน (โมเดล `anthropic/*`)
- **Claude CLI** — ใช้การล็อกอิน Claude CLI ที่มีอยู่แล้วบนโฮสต์เดียวกันซ้ำ

<Warning>
เจ้าหน้าที่ของ Anthropic แจ้งเราว่าการใช้งาน Claude CLI ในลักษณะของ OpenClaw ได้รับอนุญาตอีกครั้งแล้ว ดังนั้น
OpenClaw จึงถือว่าการใช้ Claude CLI ที่ล็อกอินไว้แล้วซ้ำและการใช้งาน `claude -p` เป็นแนวทางที่ได้รับอนุมัติ เว้นแต่
Anthropic จะเผยแพร่นโยบายใหม่

สำหรับโฮสต์ Gateway ที่ใช้งานระยะยาว Anthropic API key ยังคงเป็นเส้นทางสำหรับ production ที่ชัดเจนและ
คาดการณ์ได้มากที่สุด

เอกสารสาธารณะปัจจุบันของ Anthropic:

- [ข้อมูลอ้างอิง Claude Code CLI](https://code.claude.com/docs/en/cli-reference)
- [ภาพรวม Claude Agent SDK](https://platform.claude.com/docs/en/agent-sdk/overview)
- [การใช้ Claude Code กับแพ็กเกจ Pro หรือ Max ของคุณ](https://support.claude.com/en/articles/11145838-using-claude-code-with-your-pro-or-max-plan)
- [การใช้ Claude Code กับแพ็กเกจ Team หรือ Enterprise ของคุณ](https://support.anthropic.com/en/articles/11845131-using-claude-code-with-your-team-or-enterprise-plan/)

</Warning>

## เริ่มต้นใช้งาน

<Tabs>
  <Tab title="API key">
    **เหมาะสำหรับ:** การเข้าถึง API มาตรฐานและการเรียกเก็บเงินตามการใช้งาน

    <Steps>
      <Step title="รับ API key ของคุณ">
        สร้าง API key ใน [Anthropic Console](https://console.anthropic.com/)
      </Step>
      <Step title="เรียกใช้การตั้งค่าเริ่มต้น">
        ```bash
        openclaw onboard
        # choose: Anthropic API key
        ```

        หรือส่ง key โดยตรง:

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

    ### ตัวอย่างคอนฟิก

    ```json5
    {
      env: { ANTHROPIC_API_KEY: "sk-ant-..." },
      agents: { defaults: { model: { primary: "anthropic/claude-opus-4-6" } } },
    }
    ```

  </Tab>

  <Tab title="Claude CLI">
    **เหมาะสำหรับ:** ใช้การล็อกอิน Claude CLI ที่มีอยู่แล้วซ้ำโดยไม่ต้องมี API key แยกต่างหาก

    <Steps>
      <Step title="ตรวจสอบให้แน่ใจว่าได้ติดตั้งและล็อกอิน Claude CLI แล้ว">
        ตรวจสอบด้วย:

        ```bash
        claude --version
        ```
      </Step>
      <Step title="เรียกใช้การตั้งค่าเริ่มต้น">
        ```bash
        openclaw onboard
        # choose: Claude CLI
        ```

        OpenClaw จะตรวจพบและใช้ข้อมูลรับรอง Claude CLI ที่มีอยู่แล้วซ้ำ
      </Step>
      <Step title="ตรวจสอบว่าโมเดลพร้อมใช้งาน">
        ```bash
        openclaw models list --provider anthropic
        ```
      </Step>
    </Steps>

    <Note>
    รายละเอียดการตั้งค่าและ runtime สำหรับแบ็กเอนด์ Claude CLI อยู่ใน [CLI Backends](/th/gateway/cli-backends)
    </Note>

    <Tip>
    หากคุณต้องการเส้นทางการเรียกเก็บเงินที่ชัดเจนที่สุด ให้ใช้ Anthropic API key แทน OpenClaw ยังรองรับตัวเลือกแบบสมัครสมาชิกจาก [OpenAI Codex](/th/providers/openai), [Qwen Cloud](/th/providers/qwen), [MiniMax](/th/providers/minimax) และ [Z.AI / GLM](/th/providers/glm) ด้วย
    </Tip>

  </Tab>
</Tabs>

## ค่าเริ่มต้นของ thinking (Claude 4.6)

โมเดล Claude 4.6 ใช้ `adaptive` thinking เป็นค่าเริ่มต้นใน OpenClaw เมื่อไม่ได้ตั้งค่าระดับ thinking แบบชัดเจน

override รายข้อความได้ด้วย `/think:<level>` หรือในพารามิเตอร์ของโมเดล:

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

## การแคช prompt

OpenClaw รองรับฟีเจอร์การแคช prompt ของ Anthropic สำหรับการยืนยันตัวตนแบบ API key

| Value               | ระยะเวลาแคช | คำอธิบาย                               |
| ------------------- | ------------ | -------------------------------------- |
| `"short"` (ค่าเริ่มต้น) | 5 นาที       | ใช้โดยอัตโนมัติสำหรับการยืนยันตัวตนแบบ API key |
| `"long"`            | 1 ชั่วโมง    | แคชแบบขยายเวลา                         |
| `"none"`            | ไม่แคช       | ปิดการแคช prompt                       |

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
  <Accordion title="การ override แคชราย agent">
    ใช้พารามิเตอร์ระดับโมเดลเป็นค่าพื้นฐาน แล้ว override เฉพาะ agent ผ่าน `agents.list[].params`:

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

    ลำดับการรวมคอนฟิก:

    1. `agents.defaults.models["provider/model"].params`
    2. `agents.list[].params` (ตรงกับ `id`, override ตามคีย์)

    วิธีนี้ช่วยให้ agent หนึ่งคงแคชระยะยาวไว้ได้ ขณะที่อีก agent หนึ่งบนโมเดลเดียวกันปิดการแคชสำหรับทราฟฟิกแบบ bursty/ใช้งานซ้ำน้อยได้

  </Accordion>

  <Accordion title="หมายเหตุเกี่ยวกับ Bedrock Claude">
    - โมเดล Anthropic Claude บน Bedrock (`amazon-bedrock/*anthropic.claude*`) รับค่า `cacheRetention` แบบ pass-through เมื่อมีการกำหนดค่าไว้
    - โมเดล Bedrock ที่ไม่ใช่ Anthropic จะถูกบังคับเป็น `cacheRetention: "none"` ที่ runtime
    - ค่าเริ่มต้นอัจฉริยะของ API key จะตั้งค่า `cacheRetention: "short"` ให้กับ ref ของ Claude-on-Bedrock ด้วยเช่นกัน เมื่อไม่ได้ตั้งค่าแบบชัดเจน
  </Accordion>
</AccordionGroup>

## การกำหนดค่าขั้นสูง

<AccordionGroup>
  <Accordion title="โหมดเร็ว">
    ตัวสลับ `/fast` ที่ใช้ร่วมกันของ OpenClaw รองรับทราฟฟิก Anthropic โดยตรง (`api.anthropic.com` ทั้งแบบ API key และ OAuth)

    | Command | แมปไปยัง |
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
    - จะถูก inject เฉพาะกับคำขอโดยตรงไปยัง `api.anthropic.com` เท่านั้น เส้นทางผ่านพร็อกซีจะไม่แตะต้อง `service_tier`
    - พารามิเตอร์ `serviceTier` หรือ `service_tier` แบบชัดเจนจะ override `/fast` เมื่อมีการตั้งค่าทั้งคู่
    - ในบัญชีที่ไม่มีความจุของ Priority Tier ค่า `service_tier: "auto"` อาจ resolve เป็น `standard`
    </Note>

  </Accordion>

  <Accordion title="ความเข้าใจสื่อ (ภาพและ PDF)">
    Anthropic plugin ที่ bundled มาให้จะลงทะเบียนความสามารถในการทำความเข้าใจภาพและ PDF OpenClaw
    จะ resolve ความสามารถด้านสื่อโดยอัตโนมัติจากการยืนยันตัวตน Anthropic ที่กำหนดค่าไว้ โดย
    ไม่ต้องมีคอนฟิกเพิ่มเติม

    | Property       | Value                |
    | -------------- | -------------------- |
    | โมเดลเริ่มต้น  | `claude-opus-4-6`    |
    | อินพุตที่รองรับ | ภาพ, เอกสาร PDF |

    เมื่อแนบภาพหรือ PDF เข้ากับการสนทนา OpenClaw จะกำหนดเส้นทาง
    ผ่านผู้ให้บริการ media understanding ของ Anthropic โดยอัตโนมัติ

  </Accordion>

  <Accordion title="หน้าต่างบริบท 1M (เบต้า)">
    หน้าต่างบริบท 1M ของ Anthropic อยู่ภายใต้ข้อจำกัดแบบเบต้า เปิดใช้งานต่อโมเดลได้ดังนี้:

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

    OpenClaw จะแมปสิ่งนี้ไปยัง `anthropic-beta: context-1m-2025-08-07` ในคำขอ

    <Warning>
    ต้องมีสิทธิ์เข้าถึง long-context บนข้อมูลรับรอง Anthropic ของคุณ การยืนยันตัวตนแบบโทเค็นรุ่นเก่า (`sk-ant-oat-*`) จะถูกปฏิเสธสำหรับคำขอแบบบริบท 1M — OpenClaw จะบันทึกคำเตือนและถอยกลับไปใช้หน้าต่างบริบทมาตรฐาน
    </Warning>

  </Accordion>

  <Accordion title="บริบท 1M ของ Claude Opus 4.7">
    `anthropic/claude-opus-4.7` และตัวแปร `claude-cli` ของมันมีหน้าต่างบริบท 1M
    เป็นค่าเริ่มต้นอยู่แล้ว — ไม่จำเป็นต้องมี `params.context1m: true`
  </Accordion>
</AccordionGroup>

## การแก้ไขปัญหา

<AccordionGroup>
  <Accordion title="ข้อผิดพลาด 401 / โทเค็นใช้ไม่ได้กะทันหัน">
    การยืนยันตัวตนด้วยโทเค็นของ Anthropic หมดอายุได้และอาจถูกเพิกถอนได้ สำหรับการตั้งค่าใหม่ ให้ใช้ Anthropic API key แทน
  </Accordion>

  <Accordion title='ไม่พบ API key สำหรับ provider "anthropic"'>
    การยืนยันตัวตน Anthropic เป็นแบบ **ต่อ agent** — agent ใหม่จะไม่รับช่วง key ของ agent หลัก เรียกใช้ onboarding ใหม่สำหรับ agent นั้น (หรือกำหนดค่า API key บนโฮสต์ Gateway) จากนั้นตรวจสอบด้วย `openclaw models status`
  </Accordion>

  <Accordion title='ไม่พบข้อมูลรับรองสำหรับ profile "anthropic:default"'>
    เรียกใช้ `openclaw models status` เพื่อดูว่า auth profile ใดกำลังทำงานอยู่ เรียกใช้ onboarding ใหม่ หรือกำหนดค่า API key สำหรับพาธ profile นั้น
  </Accordion>

  <Accordion title="ไม่มี auth profile ที่ใช้ได้ (ทั้งหมดอยู่ในช่วง cooldown)">
    ตรวจสอบ `openclaw models status --json` สำหรับ `auth.unusableProfiles` การ cooldown จากการจำกัดอัตราของ Anthropic อาจผูกกับระดับโมเดล ดังนั้นโมเดล Anthropic ตัวอื่นที่อยู่ข้างเคียงอาจยังใช้งานได้ เพิ่ม Anthropic profile อีกตัวหรือรอให้ cooldown หมด
  </Accordion>
</AccordionGroup>

<Note>
ความช่วยเหลือเพิ่มเติม: [การแก้ไขปัญหา](/th/help/troubleshooting) และ [คำถามที่พบบ่อย](/th/help/faq)
</Note>

## ที่เกี่ยวข้อง

<CardGroup cols={2}>
  <Card title="การเลือกโมเดล" href="/th/concepts/model-providers" icon="layers">
    การเลือก provider, model ref และพฤติกรรม failover
  </Card>
  <Card title="CLI backends" href="/th/gateway/cli-backends" icon="terminal">
    รายละเอียดการตั้งค่าและ runtime ของแบ็กเอนด์ Claude CLI
  </Card>
  <Card title="การแคช prompt" href="/th/reference/prompt-caching" icon="database">
    วิธีการทำงานของการแคช prompt ข้าม provider ต่าง ๆ
  </Card>
  <Card title="OAuth และ auth" href="/th/gateway/authentication" icon="key">
    รายละเอียด auth และกฎการใช้ข้อมูลรับรองซ้ำ
  </Card>
</CardGroup>
