---
read_when:
    - คุณต้องการใช้ GitHub Copilot เป็นผู้ให้บริการโมเดล
    - คุณต้องการขั้นตอน `openclaw models auth login-github-copilot`
summary: ลงชื่อเข้าใช้ GitHub Copilot จาก OpenClaw โดยใช้ device flow
title: GitHub Copilot
x-i18n:
    generated_at: "2026-04-24T09:27:46Z"
    model: gpt-5.4
    provider: openai
    source_hash: 8b54a063e30e9202c6b9de35a1a3736ef8c36020296215491fb719afe73a0c3e
    source_path: providers/github-copilot.md
    workflow: 15
---

GitHub Copilot คือผู้ช่วยเขียนโค้ดด้วย AI ของ GitHub โดยให้การเข้าถึงโมเดล Copilot
ตามบัญชีและแพ็กเกจของ GitHub ของคุณ OpenClaw สามารถใช้ Copilot เป็นผู้ให้บริการโมเดลได้
สองวิธีที่แตกต่างกัน

## สองวิธีในการใช้ Copilot ใน OpenClaw

<Tabs>
  <Tab title="Built-in provider (github-copilot)">
    ใช้ขั้นตอนการเข้าสู่ระบบด้วย device flow แบบเนทีฟเพื่อรับโทเคน GitHub จากนั้นจึงแลกเป็น
    โทเคน Copilot API เมื่อ OpenClaw ทำงาน นี่คือเส้นทาง **ค่าเริ่มต้น** และง่ายที่สุด
    เพราะไม่ต้องใช้ VS Code

    <Steps>
      <Step title="รันคำสั่งเข้าสู่ระบบ">
        ```bash
        openclaw models auth login-github-copilot
        ```

        ระบบจะขอให้คุณไปที่ URL หนึ่งและกรอกรหัสใช้ครั้งเดียว โปรดเปิดเทอร์มินัลทิ้งไว้
        จนกว่ากระบวนการจะเสร็จสิ้น
      </Step>
      <Step title="ตั้งค่าโมเดลเริ่มต้น">
        ```bash
        openclaw models set github-copilot/claude-opus-4.7
        ```

        หรือในคอนฟิก:

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
    ใช้ส่วนขยาย VS Code **Copilot Proxy** เป็นสะพานภายในเครื่อง OpenClaw จะสื่อสารกับ
    ปลายทาง `/v1` ของพร็อกซีและใช้รายการโมเดลที่คุณกำหนดค่าไว้ที่นั่น

    <Note>
    เลือกแนวทางนี้เมื่อคุณใช้งาน Copilot Proxy ใน VS Code อยู่แล้ว หรือจำเป็นต้องส่งผ่าน
    มัน คุณต้องเปิดใช้ Plugin และทำให้ส่วนขยาย VS Code ทำงานอยู่ตลอด
    </Note>

  </Tab>
</Tabs>

## แฟล็กแบบไม่บังคับ

| แฟล็ก            | คำอธิบาย                                            |
| ---------------- | --------------------------------------------------- |
| `--yes`          | ข้ามพรอมป์ต์ยืนยัน                                  |
| `--set-default`  | ใช้โมเดลเริ่มต้นที่ผู้ให้บริการแนะนำด้วย           |

```bash
# Skip confirmation
openclaw models auth login-github-copilot --yes

# Login and set the default model in one step
openclaw models auth login --provider github-copilot --method device --set-default
```

<AccordionGroup>
  <Accordion title="ต้องใช้ TTY แบบโต้ตอบ">
    ขั้นตอนการเข้าสู่ระบบแบบ device ต้องใช้ TTY แบบโต้ตอบ ให้รันโดยตรงใน
    เทอร์มินัล ไม่ใช่ในสคริปต์แบบไม่โต้ตอบหรือ pipeline ของ CI
  </Accordion>

  <Accordion title="ความพร้อมใช้งานของโมเดลขึ้นอยู่กับแพ็กเกจของคุณ">
    ความพร้อมใช้งานของโมเดล Copilot ขึ้นอยู่กับแพ็กเกจ GitHub ของคุณ หากโมเดลถูก
    ปฏิเสธ ให้ลองใช้ ID อื่น (ตัวอย่างเช่น `github-copilot/gpt-4.1`)
  </Accordion>

  <Accordion title="การเลือก transport">
    ID โมเดล Claude จะใช้ transport แบบ Anthropic Messages โดยอัตโนมัติ ส่วนโมเดล GPT,
    o-series และ Gemini จะยังคงใช้ transport แบบ OpenAI Responses OpenClaw
    จะเลือก transport ที่ถูกต้องตาม model ref
  </Accordion>

  <Accordion title="ลำดับการ resolve ตัวแปรสภาพแวดล้อม">
    OpenClaw จะ resolve auth ของ Copilot จากตัวแปรสภาพแวดล้อมตามลำดับ
    ความสำคัญดังต่อไปนี้:

    | ลำดับความสำคัญ | ตัวแปร                | หมายเหตุ                              |
    | -------------- | --------------------- | ------------------------------------- |
    | 1              | `COPILOT_GITHUB_TOKEN` | ความสำคัญสูงสุด, เฉพาะ Copilot         |
    | 2              | `GH_TOKEN`            | โทเคน GitHub CLI (fallback)          |
    | 3              | `GITHUB_TOKEN`        | โทเคน GitHub มาตรฐาน (ต่ำสุด)         |

    เมื่อมีการตั้งค่าหลายตัวแปร OpenClaw จะใช้ตัวที่มีความสำคัญสูงสุด
    ขั้นตอนการเข้าสู่ระบบแบบ device (`openclaw models auth login-github-copilot`) จะเก็บ
    โทเคนไว้ใน auth profile store และมีลำดับความสำคัญเหนือกว่าตัวแปรสภาพแวดล้อมทั้งหมด

  </Accordion>

  <Accordion title="การจัดเก็บโทเคน">
    การเข้าสู่ระบบจะเก็บโทเคน GitHub ไว้ใน auth profile store และแลกเปลี่ยนมัน
    เป็นโทเคน Copilot API เมื่อ OpenClaw ทำงาน คุณไม่จำเป็นต้องจัดการโทเคน
    ด้วยตนเอง
  </Accordion>
</AccordionGroup>

<Warning>
ต้องใช้ TTY แบบโต้ตอบ ให้รันคำสั่งเข้าสู่ระบบโดยตรงในเทอร์มินัล ไม่ใช่
ภายในสคริปต์แบบ headless หรืองาน CI
</Warning>

## embedding สำหรับการค้นหาหน่วยความจำ

GitHub Copilot ยังสามารถทำหน้าที่เป็นผู้ให้บริการ embedding สำหรับ
[การค้นหาหน่วยความจำ](/th/concepts/memory-search) ได้ด้วย หากคุณมีการสมัครใช้งาน Copilot และ
ได้เข้าสู่ระบบแล้ว OpenClaw สามารถใช้มันสำหรับ embedding ได้โดยไม่ต้องมี API key แยกต่างหาก

### การตรวจจับอัตโนมัติ

เมื่อ `memorySearch.provider` เป็น `"auto"` (ค่าเริ่มต้น) GitHub Copilot จะถูกลองใช้
ที่ลำดับความสำคัญ 15 -- หลัง embedding ภายในเครื่อง แต่ก่อน OpenAI และผู้ให้บริการ
แบบมีค่าใช้จ่ายรายอื่น หากมีโทเคน GitHub พร้อมใช้งาน OpenClaw จะค้นหาโมเดล embedding
ที่มีอยู่จาก Copilot API และเลือกตัวที่ดีที่สุดโดยอัตโนมัติ

### คอนฟิกแบบระบุชัดเจน

```json5
{
  agents: {
    defaults: {
      memorySearch: {
        provider: "github-copilot",
        // Optional: override the auto-discovered model
        model: "text-embedding-3-small",
      },
    },
  },
}
```

### วิธีการทำงาน

1. OpenClaw จะ resolve โทเคน GitHub ของคุณ (จากตัวแปรสภาพแวดล้อมหรือ auth profile)
2. แลกเปลี่ยนเป็นโทเคน Copilot API แบบอายุสั้น
3. คิวรีปลายทาง Copilot `/models` เพื่อค้นหาโมเดล embedding ที่มีอยู่
4. เลือกโมเดลที่ดีที่สุด (ให้ความสำคัญกับ `text-embedding-3-small`)
5. ส่งคำขอ embedding ไปยังปลายทาง Copilot `/embeddings`

ความพร้อมใช้งานของโมเดลขึ้นอยู่กับแพ็กเกจ GitHub ของคุณ หากไม่มีโมเดล embedding
พร้อมใช้งาน OpenClaw จะข้าม Copilot และลองผู้ให้บริการถัดไป

## ที่เกี่ยวข้อง

<CardGroup cols={2}>
  <Card title="Model selection" href="/th/concepts/model-providers" icon="layers">
    การเลือกผู้ให้บริการ, model ref และพฤติกรรม failover
  </Card>
  <Card title="OAuth and auth" href="/th/gateway/authentication" icon="key">
    รายละเอียด auth และกฎการใช้ข้อมูลรับรองซ้ำ
  </Card>
</CardGroup>
