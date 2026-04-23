---
read_when:
    - คุณต้องการใช้การสร้างสื่อของ Vydra ใน OpenClaw
    - คุณต้องการคำแนะนำในการตั้งค่า Vydra API key
summary: ใช้ image, video และ speech ของ Vydra ใน OpenClaw
title: Vydra
x-i18n:
    generated_at: "2026-04-23T05:53:50Z"
    model: gpt-5.4
    provider: openai
    source_hash: ab623d14b656ce0b68d648a6393fcee3bb880077d6583e0d5c1012e91757f20e
    source_path: providers/vydra.md
    workflow: 15
---

# Vydra

Plugin Vydra ที่ bundled มา จะเพิ่มสิ่งต่อไปนี้:

- การสร้างภาพผ่าน `vydra/grok-imagine`
- การสร้างวิดีโอผ่าน `vydra/veo3` และ `vydra/kling`
- การสังเคราะห์เสียงพูดผ่านเส้นทาง TTS ของ Vydra ที่อิงกับ ElevenLabs

OpenClaw ใช้ `VYDRA_API_KEY` เดียวกันสำหรับความสามารถทั้งสามนี้

<Warning>
ให้ใช้ `https://www.vydra.ai/api/v1` เป็น base URL

ปัจจุบัน apex host ของ Vydra (`https://vydra.ai/api/v1`) จะเปลี่ยนเส้นทางไปยัง `www` โดย HTTP clients บางตัวจะทิ้ง `Authorization` ระหว่างการเปลี่ยนเส้นทางข้ามโฮสต์ ซึ่งทำให้ API key ที่ถูกต้องกลายเป็นความล้มเหลวด้าน auth ที่ทำให้เข้าใจผิด Plugin แบบ bundled ใช้ `www` base URL โดยตรงเพื่อหลีกเลี่ยงปัญหานี้
</Warning>

## การตั้งค่า

<Steps>
  <Step title="รัน onboarding แบบโต้ตอบ">
    ```bash
    openclaw onboard --auth-choice vydra-api-key
    ```

    หรือตั้งค่า env var โดยตรง:

    ```bash
    export VYDRA_API_KEY="vydra_live_..."
    ```

  </Step>
  <Step title="เลือกความสามารถเริ่มต้น">
    เลือกหนึ่งหรือหลายความสามารถด้านล่าง (image, video หรือ speech) แล้วใช้การตั้งค่าที่ตรงกัน
  </Step>
</Steps>

## ความสามารถ

<AccordionGroup>
  <Accordion title="การสร้างภาพ">
    โมเดลภาพเริ่มต้น:

    - `vydra/grok-imagine`

    ตั้งให้เป็น image provider ค่าเริ่มต้น:

    ```json5
    {
      agents: {
        defaults: {
          imageGenerationModel: {
            primary: "vydra/grok-imagine",
          },
        },
      },
    }
    ```

    การรองรับแบบ bundled ในปัจจุบันรองรับเฉพาะ text-to-image เท่านั้น โดย hosted edit routes ของ Vydra คาดหวัง remote image URLs และตอนนี้ OpenClaw ยังไม่ได้เพิ่มสะพานอัปโหลดเฉพาะ Vydra ใน bundled Plugin

    <Note>
    ดู [Image Generation](/th/tools/image-generation) สำหรับพารามิเตอร์ของเครื่องมือแบบใช้ร่วมกัน การเลือก provider และพฤติกรรม failover
    </Note>

  </Accordion>

  <Accordion title="การสร้างวิดีโอ">
    โมเดลวิดีโอที่ลงทะเบียนไว้:

    - `vydra/veo3` สำหรับ text-to-video
    - `vydra/kling` สำหรับ image-to-video

    ตั้ง Vydra ให้เป็น video provider ค่าเริ่มต้น:

    ```json5
    {
      agents: {
        defaults: {
          videoGenerationModel: {
            primary: "vydra/veo3",
          },
        },
      },
    }
    ```

    หมายเหตุ:

    - `vydra/veo3` ถูก bundled มาแบบ text-to-video เท่านั้น
    - ปัจจุบัน `vydra/kling` ต้องใช้การอ้างอิง remote image URL โดยจะปฏิเสธการอัปโหลดไฟล์ในเครื่องตั้งแต่ต้น
    - ปัจจุบัน HTTP route ของ `kling` จาก Vydra มีความไม่สม่ำเสมอว่าต้องใช้ `image_url` หรือ `video_url`; bundled provider จะแมป remote image URL เดียวกันไปยังทั้งสองฟิลด์
    - bundled Plugin ใช้แนวทางระมัดระวังและจะไม่ส่งต่อ style knobs ที่ไม่มีเอกสาร เช่น aspect ratio, resolution, watermark หรือ generated audio

    <Note>
    ดู [Video Generation](/th/tools/video-generation) สำหรับพารามิเตอร์ของเครื่องมือแบบใช้ร่วมกัน การเลือก provider และพฤติกรรม failover
    </Note>

  </Accordion>

  <Accordion title="การทดสอบแบบ live สำหรับวิดีโอ">
    การครอบคลุมแบบ live เฉพาะ provider:

    ```bash
    OPENCLAW_LIVE_TEST=1 \
    OPENCLAW_LIVE_VYDRA_VIDEO=1 \
    pnpm test:live -- extensions/vydra/vydra.live.test.ts
    ```

    ไฟล์ live ของ Vydra แบบ bundled ตอนนี้ครอบคลุม:

    - `vydra/veo3` แบบ text-to-video
    - `vydra/kling` แบบ image-to-video โดยใช้ remote image URL

    override remote image fixture ได้เมื่อจำเป็น:

    ```bash
    export OPENCLAW_LIVE_VYDRA_KLING_IMAGE_URL="https://example.com/reference.png"
    ```

  </Accordion>

  <Accordion title="การสังเคราะห์เสียงพูด">
    ตั้ง Vydra เป็น speech provider:

    ```json5
    {
      messages: {
        tts: {
          provider: "vydra",
          providers: {
            vydra: {
              apiKey: "${VYDRA_API_KEY}",
              voiceId: "21m00Tcm4TlvDq8ikWAM",
            },
          },
        },
      },
    }
    ```

    ค่าเริ่มต้น:

    - โมเดล: `elevenlabs/tts`
    - Voice id: `21m00Tcm4TlvDq8ikWAM`

    ปัจจุบัน bundled Plugin เปิดเผยเสียงเริ่มต้นที่ใช้งานได้ดีหนึ่งรายการ และคืนไฟล์เสียงแบบ MP3

  </Accordion>
</AccordionGroup>

## ที่เกี่ยวข้อง

<CardGroup cols={2}>
  <Card title="ไดเรกทอรีของ Provider" href="/th/providers/index" icon="list">
    เรียกดู providers ทั้งหมดที่พร้อมใช้งาน
  </Card>
  <Card title="การสร้างภาพ" href="/th/tools/image-generation" icon="image">
    พารามิเตอร์ของ image tool แบบใช้ร่วมกันและการเลือก provider
  </Card>
  <Card title="การสร้างวิดีโอ" href="/th/tools/video-generation" icon="video">
    พารามิเตอร์ของ video tool แบบใช้ร่วมกันและการเลือก provider
  </Card>
  <Card title="เอกสารอ้างอิงการตั้งค่า" href="/th/gateway/configuration-reference#agent-defaults" icon="gear">
    ค่าเริ่มต้นของเอเจนต์และการตั้งค่าโมเดล
  </Card>
</CardGroup>
