---
read_when:
    - คุณต้องการใช้การสร้างภาพด้วย fal ใน OpenClaw
    - คุณต้องการขั้นตอนการยืนยันตัวตนด้วย `FAL_KEY`
    - คุณต้องการค่าเริ่มต้นของ fal สำหรับ `image_generate` หรือ `video_generate`
summary: การตั้งค่า fal สำหรับการสร้างภาพและวิดีโอใน OpenClaw
title: fal
x-i18n:
    generated_at: "2026-04-23T05:51:13Z"
    model: gpt-5.4
    provider: openai
    source_hash: ff275233179b4808d625383efe04189ad9e92af09944ba39f1e953e77378e347
    source_path: providers/fal.md
    workflow: 15
---

# fal

OpenClaw มาพร้อมผู้ให้บริการ `fal` ที่บันเดิลมา สำหรับการสร้างภาพและวิดีโอแบบโฮสต์

| คุณสมบัติ | ค่า                                                         |
| -------- | ------------------------------------------------------------- |
| ผู้ให้บริการ | `fal`                                                         |
| Auth     | `FAL_KEY` (canonical; `FAL_API_KEY` ก็ใช้ได้เป็น fallback) |
| API      | fal model endpoints                                           |

## เริ่มต้นใช้งาน

<Steps>
  <Step title="ตั้งค่า API key">
    ```bash
    openclaw onboard --auth-choice fal-api-key
    ```
  </Step>
  <Step title="ตั้งค่าโมเดลภาพเริ่มต้น">
    ```json5
    {
      agents: {
        defaults: {
          imageGenerationModel: {
            primary: "fal/fal-ai/flux/dev",
          },
        },
      },
    }
    ```
  </Step>
</Steps>

## การสร้างภาพ

ผู้ให้บริการการสร้างภาพ `fal` ที่บันเดิลมามีค่าเริ่มต้นเป็น
`fal/fal-ai/flux/dev`

| ความสามารถ     | ค่า                      |
| -------------- | -------------------------- |
| จำนวนภาพสูงสุด     | 4 ต่อคำขอ              |
| โหมดแก้ไข      | เปิดใช้งาน, ใช้ภาพอ้างอิงได้ 1 ภาพ |
| การแทนที่ขนาด | รองรับ                  |
| อัตราส่วนภาพ   | รองรับ                  |
| ความละเอียด     | รองรับ                  |

<Warning>
endpoint สำหรับการแก้ไขภาพของ fal **ไม่** รองรับการแทนที่ `aspectRatio`
</Warning>

หากต้องการใช้ fal เป็นผู้ให้บริการภาพเริ่มต้น:

```json5
{
  agents: {
    defaults: {
      imageGenerationModel: {
        primary: "fal/fal-ai/flux/dev",
      },
    },
  },
}
```

## การสร้างวิดีโอ

ผู้ให้บริการการสร้างวิดีโอ `fal` ที่บันเดิลมามีค่าเริ่มต้นเป็น
`fal/fal-ai/minimax/video-01-live`

| ความสามารถ | ค่า                                                        |
| ---------- | ------------------------------------------------------------ |
| โหมด      | Text-to-video, ภาพอ้างอิงเดี่ยว                        |
| Runtime    | flow แบบ submit/status/result ที่ใช้คิวสำหรับงานที่รันนาน |

<AccordionGroup>
  <Accordion title="โมเดลวิดีโอที่มีให้">
    **HeyGen video-agent:**

    - `fal/fal-ai/heygen/v2/video-agent`

    **Seedance 2.0:**

    - `fal/bytedance/seedance-2.0/fast/text-to-video`
    - `fal/bytedance/seedance-2.0/fast/image-to-video`
    - `fal/bytedance/seedance-2.0/text-to-video`
    - `fal/bytedance/seedance-2.0/image-to-video`

  </Accordion>

  <Accordion title="ตัวอย่างคอนฟิกของ Seedance 2.0">
    ```json5
    {
      agents: {
        defaults: {
          videoGenerationModel: {
            primary: "fal/bytedance/seedance-2.0/fast/text-to-video",
          },
        },
      },
    }
    ```
  </Accordion>

  <Accordion title="ตัวอย่างคอนฟิกของ HeyGen video-agent">
    ```json5
    {
      agents: {
        defaults: {
          videoGenerationModel: {
            primary: "fal/fal-ai/heygen/v2/video-agent",
          },
        },
      },
    }
    ```
  </Accordion>
</AccordionGroup>

<Tip>
ใช้ `openclaw models list --provider fal` เพื่อดูรายการโมเดล fal ทั้งหมด
รวมถึงรายการที่อาจเพิ่งถูกเพิ่มเข้ามา
</Tip>

## ที่เกี่ยวข้อง

<CardGroup cols={2}>
  <Card title="การสร้างภาพ" href="/th/tools/image-generation" icon="image">
    พารามิเตอร์ของเครื่องมือภาพแบบใช้ร่วมกันและการเลือกผู้ให้บริการ
  </Card>
  <Card title="การสร้างวิดีโอ" href="/th/tools/video-generation" icon="video">
    พารามิเตอร์ของเครื่องมือวิดีโอแบบใช้ร่วมกันและการเลือกผู้ให้บริการ
  </Card>
  <Card title="เอกสารอ้างอิงการกำหนดค่า" href="/th/gateway/configuration-reference#agent-defaults" icon="gear">
    ค่าเริ่มต้นของเอเจนต์ รวมถึงการเลือกโมเดลภาพและวิดีโอ
  </Card>
</CardGroup>
