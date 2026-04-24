---
read_when:
    - คุณต้องการใช้การสร้างภาพของ fal ใน OpenClaw
    - คุณต้องการโฟลว์ auth ของ FAL_KEY
    - คุณต้องการค่าเริ่มต้นของ fal สำหรับ `image_generate` หรือ `video_generate`
summary: การตั้งค่า fal สำหรับการสร้างภาพและวิดีโอใน OpenClaw
title: Fal
x-i18n:
    generated_at: "2026-04-24T09:27:57Z"
    model: gpt-5.4
    provider: openai
    source_hash: d23d2d0d27e5f60f9dacb4a6a7e4c07248cf45ccd80bfabaf6bb99f5f78946b2
    source_path: providers/fal.md
    workflow: 15
---

OpenClaw มาพร้อม provider `fal` สำหรับการสร้างภาพและวิดีโอแบบโฮสต์

| Property | Value                                                         |
| -------- | ------------------------------------------------------------- |
| Provider | `fal`                                                         |
| Auth     | `FAL_KEY` (เป็นค่ามาตรฐาน; `FAL_API_KEY` ก็ใช้ได้เป็น fallback) |
| API      | ปลายทางโมเดลของ fal                                          |

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

provider สำหรับการสร้างภาพของ `fal` ที่มาพร้อมกันมีค่าเริ่มต้นเป็น
`fal/fal-ai/flux/dev`

| Capability     | Value                      |
| -------------- | -------------------------- |
| จำนวนภาพสูงสุด | 4 ต่อหนึ่งคำขอ            |
| โหมดแก้ไข      | เปิดใช้, รูปอ้างอิง 1 รูป   |
| การกำหนดแทนขนาด | รองรับ                    |
| อัตราส่วนภาพ   | รองรับ                    |
| ความละเอียด     | รองรับ                    |

<Warning>
ปลายทางสำหรับการแก้ไขภาพของ fal **ไม่** รองรับการกำหนดแทน `aspectRatio`
</Warning>

หากต้องการใช้ fal เป็น provider ภาพเริ่มต้น:

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

provider สำหรับการสร้างวิดีโอของ `fal` ที่มาพร้อมกันมีค่าเริ่มต้นเป็น
`fal/fal-ai/minimax/video-01-live`

| Capability | Value                                                        |
| ---------- | ------------------------------------------------------------ |
| โหมด       | แปลงข้อความเป็นวิดีโอ, รูปอ้างอิงเดี่ยว                     |
| Runtime    | โฟลว์ submit/status/result แบบใช้คิวสำหรับงานที่ใช้เวลานาน |

<AccordionGroup>
  <Accordion title="โมเดลวิดีโอที่พร้อมใช้งาน">
    **HeyGen video-agent:**

    - `fal/fal-ai/heygen/v2/video-agent`

    **Seedance 2.0:**

    - `fal/bytedance/seedance-2.0/fast/text-to-video`
    - `fal/bytedance/seedance-2.0/fast/image-to-video`
    - `fal/bytedance/seedance-2.0/text-to-video`
    - `fal/bytedance/seedance-2.0/image-to-video`

  </Accordion>

  <Accordion title="ตัวอย่าง config ของ Seedance 2.0">
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

  <Accordion title="ตัวอย่าง config ของ HeyGen video-agent">
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
ใช้ `openclaw models list --provider fal` เพื่อดูรายการโมเดล fal ที่มีทั้งหมด
รวมถึง entries ที่เพิ่งเพิ่มเข้ามาล่าสุด
</Tip>

## ที่เกี่ยวข้อง

<CardGroup cols={2}>
  <Card title="การสร้างภาพ" href="/th/tools/image-generation" icon="image">
    พารามิเตอร์ของ image tool แบบใช้ร่วมกันและการเลือก provider
  </Card>
  <Card title="การสร้างวิดีโอ" href="/th/tools/video-generation" icon="video">
    พารามิเตอร์ของ video tool แบบใช้ร่วมกันและการเลือก provider
  </Card>
  <Card title="เอกสารอ้างอิงการกำหนดค่า" href="/th/gateway/config-agents#agent-defaults" icon="gear">
    ค่าเริ่มต้นของเอเจนต์ รวมถึงการเลือกโมเดลภาพและวิดีโอ
  </Card>
</CardGroup>
