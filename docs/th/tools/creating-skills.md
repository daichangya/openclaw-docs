---
read_when:
    - คุณกำลังสร้าง Skill แบบกำหนดเองใหม่ใน workspace ของคุณ
    - คุณต้องการเวิร์กโฟลว์เริ่มต้นอย่างรวดเร็วสำหรับ Skills ที่อิงกับ SKILL.md
summary: สร้างและทดสอบ Skills ของ workspace แบบกำหนดเองด้วย SKILL.md
title: การสร้าง Skills
x-i18n:
    generated_at: "2026-04-24T09:35:56Z"
    model: gpt-5.4
    provider: openai
    source_hash: df9249e14936c65143580a6618679cf2d79a2960390e5c7afc5dbea1a9a6e045
    source_path: tools/creating-skills.md
    workflow: 15
---

Skills สอนเอเจนต์ว่าควรใช้เครื่องมืออย่างไรและเมื่อใด โดยแต่ละ Skill เป็นไดเรกทอรี
ที่มีไฟล์ `SKILL.md` พร้อม YAML frontmatter และคำสั่งแบบ Markdown

สำหรับวิธีโหลดและลำดับความสำคัญของ Skills ดู [Skills](/th/tools/skills)

## สร้าง Skill แรกของคุณ

<Steps>
  <Step title="สร้างไดเรกทอรีของ Skill">
    Skills อยู่ใน workspace ของคุณ สร้างโฟลเดอร์ใหม่:

    ```bash
    mkdir -p ~/.openclaw/workspace/skills/hello-world
    ```

  </Step>

  <Step title="เขียน SKILL.md">
    สร้าง `SKILL.md` ภายในไดเรกทอรีนั้น frontmatter ใช้กำหนด metadata
    และเนื้อหา Markdown ใช้ใส่คำสั่งสำหรับเอเจนต์

    ```markdown
    ---
    name: hello_world
    description: A simple skill that says hello.
    ---

    # Hello World Skill

    When the user asks for a greeting, use the `echo` tool to say
    "Hello from your custom skill!".
    ```

  </Step>

  <Step title="เพิ่มเครื่องมือ (ไม่บังคับ)">
    คุณสามารถกำหนดสคีมาเครื่องมือแบบกำหนดเองใน frontmatter หรือสั่งให้เอเจนต์
    ใช้เครื่องมือของระบบที่มีอยู่แล้ว (เช่น `exec` หรือ `browser`) Skills ยังสามารถ
    จัดส่งมากับ Plugin ควบคู่กับเครื่องมือที่อธิบายไว้ได้ด้วย

  </Step>

  <Step title="โหลด Skill">
    เริ่มเซสชันใหม่เพื่อให้ OpenClaw โหลด Skill นี้:

    ```bash
    # From chat
    /new

    # Or restart the gateway
    openclaw gateway restart
    ```

    ตรวจสอบว่าโหลด Skill แล้ว:

    ```bash
    openclaw skills list
    ```

  </Step>

  <Step title="ทดสอบ">
    ส่งข้อความที่ควรทำให้ Skill ทำงาน:

    ```bash
    openclaw agent --message "give me a greeting"
    ```

    หรือแค่แชตกับเอเจนต์แล้วขอคำทักทายก็ได้

  </Step>
</Steps>

## ข้อมูลอ้างอิง metadata ของ Skill

YAML frontmatter รองรับฟิลด์เหล่านี้:

| ฟิลด์                              | จำเป็น | คำอธิบาย                                  |
| ---------------------------------- | ------ | ----------------------------------------- |
| `name`                             | ใช่    | ตัวระบุเฉพาะ (snake_case)                 |
| `description`                      | ใช่    | คำอธิบายหนึ่งบรรทัดที่แสดงให้เอเจนต์เห็น |
| `metadata.openclaw.os`             | ไม่    | ตัวกรอง OS (`["darwin"]`, `["linux"]` ฯลฯ) |
| `metadata.openclaw.requires.bins`  | ไม่    | ไบนารีที่ต้องมีบน PATH                    |
| `metadata.openclaw.requires.config`| ไม่    | คีย์คอนฟิกที่จำเป็น                        |

## แนวทางปฏิบัติที่ดี

- **กระชับไว้ก่อน** — บอกโมเดลว่า _ต้องทำอะไร_ ไม่ใช่ให้เป็น AI อย่างไร
- **ความปลอดภัยมาก่อน** — หาก Skill ของคุณใช้ `exec` ให้แน่ใจว่า prompt ไม่เปิดช่องให้มีการฉีดคำสั่งตามอำเภอใจจากอินพุตที่ไม่น่าเชื่อถือ
- **ทดสอบในเครื่อง** — ใช้ `openclaw agent --message "..."` เพื่อทดสอบก่อนแชร์
- **ใช้ ClawHub** — เรียกดูและมีส่วนร่วมกับ Skills ได้ที่ [ClawHub](https://clawhub.ai)

## ตำแหน่งที่เก็บ Skills

| ตำแหน่ง                        | ลำดับความสำคัญ | ขอบเขต                |
| ------------------------------ | --------------- | --------------------- |
| `\<workspace\>/skills/`        | สูงสุด          | ต่อเอเจนต์            |
| `\<workspace\>/.agents/skills/`| สูง             | ต่อ workspace agent   |
| `~/.agents/skills/`            | ปานกลาง        | โปรไฟล์เอเจนต์ที่ใช้ร่วมกัน |
| `~/.openclaw/skills/`          | ปานกลาง        | ใช้ร่วมกัน (ทุกเอเจนต์) |
| Bundled (มาพร้อม OpenClaw)    | ต่ำ             | ระดับ global          |
| `skills.load.extraDirs`        | ต่ำสุด          | โฟลเดอร์ที่ใช้ร่วมกันแบบกำหนดเอง |

## ที่เกี่ยวข้อง

- [Skills reference](/th/tools/skills) — กฎการโหลด ลำดับความสำคัญ และ gating
- [Skills config](/th/tools/skills-config) — สคีมาคอนฟิก `skills.*`
- [ClawHub](/th/tools/clawhub) — รีจิสทรีสาธารณะของ Skills
- [Building Plugins](/th/plugins/building-plugins) — Plugin สามารถจัดส่ง Skills ได้
