---
read_when:
    - คุณต้องการใช้ GitHub Copilot เป็นผู้ให้บริการโมเดล
    - คุณต้องการโฟลว์ `openclaw models auth login-github-copilot`
summary: ลงชื่อเข้าใช้ GitHub Copilot จาก OpenClaw โดยใช้ device flow
title: GitHub Copilot
x-i18n:
    generated_at: "2026-04-23T05:51:14Z"
    model: gpt-5.4
    provider: openai
    source_hash: b5169839322f64b24b194302b61c5bad67c6cb6595989f9a1ef65867d8b68659
    source_path: providers/github-copilot.md
    workflow: 15
---

# GitHub Copilot

GitHub Copilot คือผู้ช่วยเขียนโค้ดด้วย AI ของ GitHub มันให้การเข้าถึง
โมเดลของ Copilot สำหรับบัญชีและแผน GitHub ของคุณ OpenClaw สามารถใช้ Copilot
เป็นผู้ให้บริการโมเดลได้สองวิธีที่ต่างกัน

## สองวิธีในการใช้ Copilot ใน OpenClaw

<Tabs>
  <Tab title="Built-in provider (github-copilot)">
    ใช้ device-login flow แบบเนทีฟเพื่อรับ GitHub token จากนั้นนำไปแลกเป็น
    Copilot API tokens เมื่อ OpenClaw ทำงาน นี่คือเส้นทาง **ค่าเริ่มต้น** และง่ายที่สุด
    เพราะไม่ต้องใช้ VS Code

    <Steps>
      <Step title="รันคำสั่งล็อกอิน">
        ```bash
        openclaw models auth login-github-copilot
        ```

        ระบบจะขอให้คุณไปที่ URL และป้อน one-time code ให้
        เปิดเทอร์มินัลทิ้งไว้จนกว่ากระบวนการจะเสร็จ
      </Step>
      <Step title="ตั้งค่าโมเดลเริ่มต้น">
        ```bash
        openclaw models set github-copilot/claude-opus-4.7
        ```

        หรือใน config:

        ```json5
        {
          agents: {
            defaults: { model: { primary: "github-copilot/claude-opus-4.7" } },
          },
        }
        ```
      </Step>
    </Steps>

  </Tab>

  <Tab title="Copilot Proxy plugin (copilot-proxy)">
    ใช้ส่วนขยาย **Copilot Proxy** ของ VS Code เป็น local bridge OpenClaw จะคุยกับ
    endpoint `/v1` ของพร็อกซี และใช้รายการโมเดลที่คุณกำหนดค่าไว้ที่นั่น

    <Note>
    เลือกวิธีนี้เมื่อคุณใช้งาน Copilot Proxy อยู่แล้วใน VS Code หรือต้องการ route
    ผ่านมัน คุณต้องเปิดใช้ Plugin และให้ส่วนขยาย VS Code ทำงานอยู่ตลอด
    </Note>

  </Tab>
</Tabs>

## แฟล็กเพิ่มเติมแบบเลือกได้

| แฟล็ก           | คำอธิบาย                                        |
| --------------- | ------------------------------------------------ |
| `--yes`         | ข้ามพรอมป์ต์ยืนยัน                               |
| `--set-default` | ใช้โมเดลเริ่มต้นที่ผู้ให้บริการแนะนำด้วย        |

```bash
# ข้ามการยืนยัน
openclaw models auth login-github-copilot --yes

# ล็อกอินและตั้งค่าโมเดลเริ่มต้นในขั้นตอนเดียว
openclaw models auth login --provider github-copilot --method device --set-default
```

<AccordionGroup>
  <Accordion title="ต้องใช้ TTY แบบโต้ตอบ">
    device-login flow ต้องใช้ TTY แบบโต้ตอบ ให้รันโดยตรงใน
    เทอร์มินัล ไม่ใช่ในสคริปต์แบบ non-interactive หรือใน CI pipeline
  </Accordion>

  <Accordion title="ความพร้อมใช้งานของโมเดลขึ้นอยู่กับแผนของคุณ">
    ความพร้อมใช้งานของโมเดล Copilot ขึ้นอยู่กับแผน GitHub ของคุณ หากโมเดลใด
    ถูกปฏิเสธ ให้ลองใช้ ID อื่นแทน (เช่น `github-copilot/gpt-4.1`)
  </Accordion>

  <Accordion title="การเลือก transport">
    model IDs ของ Claude จะใช้ Anthropic Messages transport โดยอัตโนมัติ ส่วน GPT,
    o-series และ Gemini models จะยังคงใช้ OpenAI Responses transport OpenClaw
    จะเลือก transport ที่ถูกต้องตาม model ref
  </Accordion>

  <Accordion title="ลำดับการ resolve environment variables">
    OpenClaw จะ resolve Copilot auth จาก environment variables ตาม
    ลำดับความสำคัญดังนี้:

    | ลำดับความสำคัญ | ตัวแปร               | หมายเหตุ                              |
    | --------------- | -------------------- | ------------------------------------- |
    | 1               | `COPILOT_GITHUB_TOKEN` | ลำดับสูงสุด, เฉพาะสำหรับ Copilot      |
    | 2               | `GH_TOKEN`           | GitHub CLI token (fallback)           |
    | 3               | `GITHUB_TOKEN`       | GitHub token มาตรฐาน (ลำดับต่ำสุด)    |

    เมื่อมีการตั้งค่าหลายตัวแปร OpenClaw จะใช้ตัวที่มีลำดับความสำคัญสูงสุด
    device-login flow (`openclaw models auth login-github-copilot`) จะเก็บ
    token ของมันไว้ใน auth profile store และมีลำดับความสำคัญเหนือ environment
    variables ทั้งหมด

  </Accordion>

  <Accordion title="การจัดเก็บโทเค็น">
    การล็อกอินจะเก็บ GitHub token ไว้ใน auth profile store และนำมันไปแลกเป็น
    Copilot API token เมื่อ OpenClaw ทำงาน คุณไม่จำเป็นต้องจัดการ
    token ด้วยตนเอง
  </Accordion>
</AccordionGroup>

<Warning>
ต้องใช้ TTY แบบโต้ตอบ ให้รันคำสั่งล็อกอินโดยตรงในเทอร์มินัล ไม่ใช่
ภายในสคริปต์แบบ headless หรือ CI job
</Warning>

## embeddings สำหรับ memory search

GitHub Copilot ยังสามารถใช้เป็น embedding provider สำหรับ
[memory search](/th/concepts/memory-search) ได้ด้วย หากคุณมีการสมัคร Copilot และ
ได้ล็อกอินแล้ว OpenClaw สามารถใช้มันสำหรับ embeddings ได้โดยไม่ต้องใช้ API key แยก

### การตรวจจับอัตโนมัติ

เมื่อ `memorySearch.provider` เป็น `"auto"` (ค่าเริ่มต้น) GitHub Copilot จะถูกลอง
ที่ลำดับความสำคัญ 15 -- หลัง local embeddings แต่ก่อน OpenAI และผู้ให้บริการแบบชำระเงิน
รายอื่น หากมี GitHub token พร้อมใช้งาน OpenClaw จะค้นหา
embedding models ที่มีจาก Copilot API และเลือกตัวที่ดีที่สุดให้อัตโนมัติ

### config แบบ explicit

```json5
{
  agents: {
    defaults: {
      memorySearch: {
        provider: "github-copilot",
        // ตัวเลือก: override โมเดลที่ค้นพบอัตโนมัติ
        model: "text-embedding-3-small",
      },
    },
  },
}
```

### วิธีการทำงาน

1. OpenClaw resolve GitHub token ของคุณ (จาก env vars หรือ auth profile)
2. แลกมันเป็น Copilot API token แบบอายุสั้น
3. query endpoint `/models` ของ Copilot เพื่อค้นหา embedding models ที่มีอยู่
4. เลือกโมเดลที่ดีที่สุด (ให้ความสำคัญกับ `text-embedding-3-small`)
5. ส่งคำขอ embeddings ไปยัง endpoint `/embeddings` ของ Copilot

ความพร้อมใช้งานของโมเดลขึ้นอยู่กับแผน GitHub ของคุณ หากไม่มี embedding models
พร้อมใช้ OpenClaw จะข้าม Copilot และลองผู้ให้บริการถัดไป

## ที่เกี่ยวข้อง

<CardGroup cols={2}>
  <Card title="การเลือกโมเดล" href="/th/concepts/model-providers" icon="layers">
    การเลือกผู้ให้บริการ, model refs และพฤติกรรม failover
  </Card>
  <Card title="OAuth และ auth" href="/th/gateway/authentication" icon="key">
    รายละเอียด auth และกฎการใช้ข้อมูลรับรองซ้ำ
  </Card>
</CardGroup>
