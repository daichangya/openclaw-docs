---
read_when:
    - คุณต้องการใช้การสร้างวิดีโอด้วย Runway ใน OpenClaw
    - คุณต้องการการตั้งค่า Runway API key/env
    - คุณต้องการให้ Runway เป็นผู้ให้บริการวิดีโอเริ่มต้น
summary: การตั้งค่าการสร้างวิดีโอด้วย Runway ใน OpenClaw
title: Runway
x-i18n:
    generated_at: "2026-04-23T05:53:07Z"
    model: gpt-5.4
    provider: openai
    source_hash: fb9a2d26687920544222b0769f314743af245629fd45b7f456c0161a47476176
    source_path: providers/runway.md
    workflow: 15
---

# Runway

OpenClaw มาพร้อม provider `runway` ที่รวมอยู่ในชุด สำหรับการสร้างวิดีโอแบบโฮสต์

| คุณสมบัติ    | ค่า                                                               |
| ------------ | ----------------------------------------------------------------- |
| Provider id  | `runway`                                                          |
| Auth         | `RUNWAYML_API_SECRET` (canonical) หรือ `RUNWAY_API_KEY`           |
| API          | การสร้างวิดีโอแบบ task-based ของ Runway (`GET /v1/tasks/{id}` polling) |

## เริ่มต้นใช้งาน

<Steps>
  <Step title="ตั้ง API key">
    ```bash
    openclaw onboard --auth-choice runway-api-key
    ```
  </Step>
  <Step title="ตั้ง Runway เป็นผู้ให้บริการวิดีโอเริ่มต้น">
    ```bash
    openclaw config set agents.defaults.videoGenerationModel.primary "runway/gen4.5"
    ```
  </Step>
  <Step title="สร้างวิดีโอ">
    ขอให้เอเจนต์สร้างวิดีโอ ระบบจะใช้ Runway ให้อัตโนมัติ
  </Step>
</Steps>

## โหมดที่รองรับ

| โหมด            | โมเดล              | อินพุตอ้างอิง               |
| --------------- | ------------------ | --------------------------- |
| Text-to-video   | `gen4.5` (ค่าเริ่มต้น) | ไม่มี                        |
| Image-to-video  | `gen4.5`           | ภาพภายในเครื่องหรือระยะไกล 1 ภาพ |
| Video-to-video  | `gen4_aleph`       | วิดีโอภายในเครื่องหรือระยะไกล 1 วิดีโอ |

<Note>
รองรับภาพและวิดีโออ้างอิงภายในเครื่องผ่าน data URI สำหรับการรันแบบ text-only
ปัจจุบันเปิดให้ใช้เฉพาะอัตราส่วน `16:9` และ `9:16`
</Note>

<Warning>
ปัจจุบัน video-to-video ต้องใช้ `runway/gen4_aleph` โดยเฉพาะ
</Warning>

## การกำหนดค่า

```json5
{
  agents: {
    defaults: {
      videoGenerationModel: {
        primary: "runway/gen4.5",
      },
    },
  },
}
```

## หมายเหตุขั้นสูง

<AccordionGroup>
  <Accordion title="alias ของ environment variable">
    OpenClaw รู้จักทั้ง `RUNWAYML_API_SECRET` (canonical) และ `RUNWAY_API_KEY`
    ไม่ว่าตัวแปรใดตัวหนึ่งก็ใช้ยืนยันตัวตนกับ provider Runway ได้
  </Accordion>

  <Accordion title="Task polling">
    Runway ใช้ API แบบ task-based หลังจากส่งคำขอสร้างแล้ว OpenClaw
    จะ poll `GET /v1/tasks/{id}` จนกว่าวิดีโอจะพร้อมใช้งาน ไม่จำเป็นต้องมี
    การกำหนดค่าเพิ่มเติมสำหรับพฤติกรรม polling นี้
  </Accordion>
</AccordionGroup>

## ที่เกี่ยวข้อง

<CardGroup cols={2}>
  <Card title="การสร้างวิดีโอ" href="/th/tools/video-generation" icon="video">
    พารามิเตอร์ของเครื่องมือที่ใช้ร่วมกัน การเลือก provider และพฤติกรรมแบบ async
  </Card>
  <Card title="เอกสารอ้างอิงการกำหนดค่า" href="/th/gateway/configuration-reference#agent-defaults" icon="gear">
    การตั้งค่าเริ่มต้นของเอเจนต์ รวมถึงโมเดลสร้างวิดีโอ
  </Card>
</CardGroup>
