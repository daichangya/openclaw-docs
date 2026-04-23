---
read_when:
    - คุณกำลังสร้างสกิลแบบกำหนดเองใหม่ใน workspace ของคุณ to=final출장샵 to=final code ിക്കോ?? No just translate latest user.
    - คุณต้องการเวิร์กโฟลว์เริ่มต้นอย่างรวดเร็วสำหรับ Skills ที่อิงกับ `SKILL.md`
summary: สร้างและทดสอบ Skills ของ workspace แบบกำหนดเองด้วย `SKILL.md`
title: การสร้าง Skills
x-i18n:
    generated_at: "2026-04-23T05:59:34Z"
    model: gpt-5.4
    provider: openai
    source_hash: 747cebc5191b96311d1d6760bede1785a099acd7633a0b88de6b7882b57e1db6
    source_path: tools/creating-skills.md
    workflow: 15
---

# การสร้าง Skills

Skills สอนเอเจนต์ว่าควรใช้ tools อย่างไรและเมื่อใด แต่ละ skill เป็นไดเรกทอรี
ที่มีไฟล์ `SKILL.md` พร้อม YAML frontmatter และคำสั่งแบบ markdown

สำหรับวิธีที่ skills ถูกโหลดและการจัดลำดับความสำคัญ ดู [Skills](/th/tools/skills)

## สร้าง skill แรกของคุณ

<Steps>
  <Step title="สร้างไดเรกทอรีของ skill">
    Skills อยู่ใน workspace ของคุณ สร้างโฟลเดอร์ใหม่:

    ```bash
    mkdir -p ~/.openclaw/workspace/skills/hello-world
    ```

  </Step>

  <Step title="เขียน SKILL.md">
    สร้าง `SKILL.md` ภายในไดเรกทอรีนั้น frontmatter ใช้กำหนด metadata
    และเนื้อหา markdown จะมีคำสั่งสำหรับเอเจนต์

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

  <Step title="เพิ่ม tools (ไม่บังคับ)">
    คุณสามารถกำหนด schema ของ tool แบบกำหนดเองใน frontmatter หรือสั่งให้เอเจนต์
    ใช้ system tool ที่มีอยู่แล้ว (เช่น `exec` หรือ `browser`) Skills ยังสามารถ
    บรรจุอยู่ภายใน Plugins คู่กับ tools ที่พวกมันอธิบายได้ด้วย

  </Step>

  <Step title="โหลด skill">
    เริ่มเซสชันใหม่เพื่อให้ OpenClaw โหลด skill:

    ```bash
    # จากแชต
    /new

    # หรือรีสตาร์ต gateway
    openclaw gateway restart
    ```

    ตรวจสอบว่า skill ถูกโหลดแล้ว:

    ```bash
    openclaw skills list
    ```

  </Step>

  <Step title="ทดสอบ">
    ส่งข้อความที่ควรกระตุ้น skill:

    ```bash
    openclaw agent --message "give me a greeting"
    ```

    หรือแค่แชตกับเอเจนต์แล้วขอคำทักทาย

  </Step>
</Steps>

## เอกสารอ้างอิง metadata ของ Skill

YAML frontmatter รองรับฟิลด์เหล่านี้:

| ฟิลด์                               | จำเป็น | คำอธิบาย                                   |
| ----------------------------------- | ------ | ------------------------------------------ |
| `name`                              | ใช่    | ตัวระบุที่ไม่ซ้ำกัน (`snake_case`)          |
| `description`                       | ใช่    | คำอธิบายหนึ่งบรรทัดที่แสดงให้เอเจนต์เห็น     |
| `metadata.openclaw.os`              | ไม่    | ตัวกรอง OS (`["darwin"]`, `["linux"]` ฯลฯ) |
| `metadata.openclaw.requires.bins`   | ไม่    | ไบนารีที่ต้องมีบน PATH                     |
| `metadata.openclaw.requires.config` | ไม่    | คีย์ config ที่จำเป็น                      |

## แนวปฏิบัติที่ดีที่สุด

- **กระชับเข้าไว้** — สั่งโมเดลในเรื่อง _ต้องทำอะไร_ ไม่ใช่วิธีทำตัวเป็น AI
- **ความปลอดภัยมาก่อน** — หาก skill ของคุณใช้ `exec` ให้แน่ใจว่าพรอมป์ไม่เปิดช่องให้มีการฉีดคำสั่งจากอินพุตที่ไม่น่าเชื่อถือ
- **ทดสอบในเครื่อง** — ใช้ `openclaw agent --message "..."` เพื่อทดสอบก่อนแชร์
- **ใช้ ClawHub** — เรียกดูและมีส่วนร่วมกับ skills ได้ที่ [ClawHub](https://clawhub.ai)

## ตำแหน่งที่ skills อยู่

| ตำแหน่ง                        | ลำดับความสำคัญ | ขอบเขต                |
| ------------------------------ | --------------- | --------------------- |
| `\<workspace\>/skills/`         | สูงสุด          | ต่อเอเจนต์            |
| `\<workspace\>/.agents/skills/` | สูง             | ต่อเอเจนต์ของ workspace |
| `~/.agents/skills/`             | กลาง            | โปรไฟล์เอเจนต์ร่วมกัน |
| `~/.openclaw/skills/`           | กลาง            | ใช้ร่วมกัน (ทุกเอเจนต์) |
| Bundled (มาพร้อม OpenClaw)      | ต่ำ             | แบบ global            |
| `skills.load.extraDirs`         | ต่ำสุด          | โฟลเดอร์ร่วมแบบกำหนดเอง |

## ที่เกี่ยวข้อง

- [เอกสารอ้างอิง Skills](/th/tools/skills) — การโหลด ลำดับความสำคัญ และกฎการควบคุม
- [Skills config](/th/tools/skills-config) — schema ของ config `skills.*`
- [ClawHub](/th/tools/clawhub) — รีจิสทรีสกิลสาธารณะ
- [Building Plugins](/th/plugins/building-plugins) — Plugins สามารถบรรจุ Skills ได้
