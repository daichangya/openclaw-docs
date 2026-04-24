---
read_when:
    - คุณต้องการใช้การสร้างวิดีโอของ Runway ใน OpenClaw
    - คุณต้องการการตั้งค่า API key/env ของ Runway
    - คุณต้องการตั้งให้ Runway เป็น provider วิดีโอเริ่มต้น
summary: การตั้งค่า Runway สำหรับการสร้างวิดีโอใน OpenClaw
title: Runway
x-i18n:
    generated_at: "2026-04-24T09:29:53Z"
    model: gpt-5.4
    provider: openai
    source_hash: 9648ca4403283cd23bf899d697f35a6b63986e8860227628c0d5789fceee3ce8
    source_path: providers/runway.md
    workflow: 15
---

OpenClaw มาพร้อม provider `runway` สำหรับการสร้างวิดีโอแบบโฮสต์

| คุณสมบัติ    | ค่า                                                               |
| ----------- | ----------------------------------------------------------------- |
| Provider id | `runway`                                                          |
| Auth        | `RUNWAYML_API_SECRET` (canonical) หรือ `RUNWAY_API_KEY`           |
| API         | การสร้างวิดีโอแบบ task-based ของ Runway (`GET /v1/tasks/{id}` polling) |

## เริ่มต้นใช้งาน

<Steps>
  <Step title="ตั้งค่า API key">
    ```bash
    openclaw onboard --auth-choice runway-api-key
    ```
  </Step>
  <Step title="ตั้ง Runway เป็น provider วิดีโอเริ่มต้น">
    ```bash
    openclaw config set agents.defaults.videoGenerationModel.primary "runway/gen4.5"
    ```
  </Step>
  <Step title="สร้างวิดีโอ">
    สั่งให้ agent สร้างวิดีโอ ระบบจะใช้ Runway โดยอัตโนมัติ
  </Step>
</Steps>

## โหมดที่รองรับ

| โหมด            | Model              | อินพุตอ้างอิง              |
| --------------- | ------------------ | -------------------------- |
| Text-to-video   | `gen4.5` (ค่าเริ่มต้น) | ไม่มี                    |
| Image-to-video  | `gen4.5`           | รูปภาพ local หรือ remote 1 ภาพ |
| Video-to-video  | `gen4_aleph`       | วิดีโอ local หรือ remote 1 ไฟล์ |

<Note>
รองรับการอ้างอิงรูปภาพและวิดีโอ local ผ่าน data URI สำหรับการรันแบบข้อความอย่างเดียว
ปัจจุบันรองรับอัตราส่วนภาพ `16:9` และ `9:16`
</Note>

<Warning>
ปัจจุบัน Video-to-video ต้องใช้ `runway/gen4_aleph` โดยเฉพาะ
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

## การกำหนดค่าขั้นสูง

<AccordionGroup>
  <Accordion title="alias ของตัวแปรสภาพแวดล้อม">
    OpenClaw รู้จักทั้ง `RUNWAYML_API_SECRET` (canonical) และ `RUNWAY_API_KEY`
    โดยตัวแปรใดตัวแปรหนึ่งก็สามารถใช้ยืนยันตัวตนให้ provider ของ Runway ได้
  </Accordion>

  <Accordion title="การ polling ของ task">
    Runway ใช้ API แบบ task-based หลังจากส่งคำขอสร้างแล้ว OpenClaw
    จะ poll `GET /v1/tasks/{id}` จนกว่าวิดีโอจะพร้อมใช้งาน โดยไม่ต้องมี
    การกำหนดค่าเพิ่มเติมสำหรับพฤติกรรมการ polling นี้
  </Accordion>
</AccordionGroup>

## ที่เกี่ยวข้อง

<CardGroup cols={2}>
  <Card title="การสร้างวิดีโอ" href="/th/tools/video-generation" icon="video">
    พารามิเตอร์ของ tool ที่ใช้ร่วมกัน การเลือก provider และพฤติกรรมแบบ async
  </Card>
  <Card title="ข้อมูลอ้างอิงการกำหนดค่า" href="/th/gateway/config-agents#agent-defaults" icon="gear">
    การตั้งค่าเริ่มต้นของ agent รวมถึง model สำหรับการสร้างวิดีโอ
  </Card>
</CardGroup>
