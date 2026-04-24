---
read_when:
    - คุณต้องการใช้การสร้างสื่อของ Vydra ใน OpenClaw
    - คุณต้องการคำแนะนำในการตั้งค่า API key ของ Vydra
summary: ใช้ภาพ วิดีโอ และเสียงพูดของ Vydra ใน OpenClaw
title: Vydra
x-i18n:
    generated_at: "2026-04-24T09:30:25Z"
    model: gpt-5.4
    provider: openai
    source_hash: 85420c3f337c13313bf571d5ee92c1f1988ff8119d401e7ec0ea0db1e74d9b69
    source_path: providers/vydra.md
    workflow: 15
---

Plugin Vydra แบบ bundled เพิ่มสิ่งต่อไปนี้:

- การสร้างภาพผ่าน `vydra/grok-imagine`
- การสร้างวิดีโอผ่าน `vydra/veo3` และ `vydra/kling`
- การสังเคราะห์เสียงพูดผ่านเส้นทาง TTS ของ Vydra ที่ทำงานบน ElevenLabs

OpenClaw ใช้ `VYDRA_API_KEY` เดียวกันสำหรับความสามารถทั้งสามนี้

<Warning>
ให้ใช้ `https://www.vydra.ai/api/v1` เป็น base URL

โฮสต์ apex ของ Vydra (`https://vydra.ai/api/v1`) จะรีไดเรกต์ไปยัง `www` ในปัจจุบัน HTTP client บางตัวจะทิ้ง `Authorization` เมื่อมีการรีไดเรกต์ข้ามโฮสต์ ซึ่งทำให้ API key ที่ถูกต้องกลายเป็นความล้มเหลวด้าน auth ที่ชวนให้เข้าใจผิด Plugin แบบ bundled ใช้ base URL แบบ `www` โดยตรงเพื่อหลีกเลี่ยงปัญหานี้
</Warning>

## การตั้งค่า

<Steps>
  <Step title="รัน onboarding แบบโต้ตอบ">
    ```bash
    openclaw onboard --auth-choice vydra-api-key
    ```

    หรือกำหนดตัวแปร env โดยตรง:

    ```bash
    export VYDRA_API_KEY="vydra_live_..."
    ```

  </Step>
  <Step title="เลือกความสามารถเริ่มต้น">
    เลือกหนึ่งหรือหลายความสามารถด้านล่างนี้ (ภาพ วิดีโอ หรือเสียงพูด) แล้วใช้คอนฟิกที่ตรงกัน
  </Step>
</Steps>

## ความสามารถ

<AccordionGroup>
  <Accordion title="การสร้างภาพ">
    โมเดลภาพเริ่มต้น:

    - `vydra/grok-imagine`

    ตั้งค่าเป็นผู้ให้บริการภาพเริ่มต้น:

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

    การรองรับแบบ bundled ในปัจจุบันมีเฉพาะข้อความเป็นภาพเท่านั้น เส้นทางแก้ไขภาพแบบโฮสต์ของ Vydra ต้องใช้ URL ภาพระยะไกล และ OpenClaw ยังไม่ได้เพิ่มสะพานอัปโหลดเฉพาะของ Vydra ใน Plugin แบบ bundled

    <Note>
    ดู [Image Generation](/th/tools/image-generation) สำหรับพารามิเตอร์ของเครื่องมือแบบใช้ร่วมกัน การเลือกผู้ให้บริการ และพฤติกรรม failover
    </Note>

  </Accordion>

  <Accordion title="การสร้างวิดีโอ">
    โมเดลวิดีโอที่ลงทะเบียนไว้:

    - `vydra/veo3` สำหรับข้อความเป็นวิดีโอ
    - `vydra/kling` สำหรับภาพเป็นวิดีโอ

    ตั้งค่า Vydra เป็นผู้ให้บริการวิดีโอเริ่มต้น:

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

    - `vydra/veo3` ถูก bundled มาเป็นข้อความเป็นวิดีโอเท่านั้น
    - `vydra/kling` ในปัจจุบันต้องใช้การอ้างอิง URL ภาพระยะไกล การอัปโหลดไฟล์ภายในเครื่องจะถูกปฏิเสธตั้งแต่ต้น
    - เส้นทาง HTTP `kling` ปัจจุบันของ Vydra ยังไม่สม่ำเสมอว่าต้องใช้ `image_url` หรือ `video_url`; ผู้ให้บริการแบบ bundled จะแมป URL ภาพระยะไกลเดียวกันไปยังทั้งสองฟิลด์
    - Plugin แบบ bundled ใช้แนวทางอนุรักษ์นิยมและจะไม่ส่งต่อปุ่มควบคุม style ที่ไม่มีเอกสาร เช่น aspect ratio, resolution, watermark หรือ generated audio

    <Note>
    ดู [Video Generation](/th/tools/video-generation) สำหรับพารามิเตอร์ของเครื่องมือแบบใช้ร่วมกัน การเลือกผู้ให้บริการ และพฤติกรรม failover
    </Note>

  </Accordion>

  <Accordion title="การทดสอบวิดีโอแบบ live">
    ความครอบคลุมแบบ live เฉพาะผู้ให้บริการ:

    ```bash
    OPENCLAW_LIVE_TEST=1 \
    OPENCLAW_LIVE_VYDRA_VIDEO=1 \
    pnpm test:live -- extensions/vydra/vydra.live.test.ts
    ```

    ไฟล์ live ของ Vydra แบบ bundled ตอนนี้ครอบคลุม:

    - `vydra/veo3` แบบข้อความเป็นวิดีโอ
    - `vydra/kling` แบบภาพเป็นวิดีโอโดยใช้ URL ภาพระยะไกล

    Override fixture ภาพระยะไกลได้เมื่อจำเป็น:

    ```bash
    export OPENCLAW_LIVE_VYDRA_KLING_IMAGE_URL="https://example.com/reference.png"
    ```

  </Accordion>

  <Accordion title="การสังเคราะห์เสียงพูด">
    ตั้งค่า Vydra เป็นผู้ให้บริการเสียงพูด:

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
    - voice id: `21m00Tcm4TlvDq8ikWAM`

    ปัจจุบัน Plugin แบบ bundled เปิดเผยเสียงเริ่มต้นที่ผ่านการทดสอบแล้วเพียงหนึ่งเสียง และส่งกลับไฟล์เสียง MP3

  </Accordion>
</AccordionGroup>

## ที่เกี่ยวข้อง

<CardGroup cols={2}>
  <Card title="Provider directory" href="/th/providers/index" icon="list">
    เรียกดูผู้ให้บริการทั้งหมดที่พร้อมใช้งาน
  </Card>
  <Card title="Image generation" href="/th/tools/image-generation" icon="image">
    พารามิเตอร์ของเครื่องมือภาพแบบใช้ร่วมกันและการเลือกผู้ให้บริการ
  </Card>
  <Card title="Video generation" href="/th/tools/video-generation" icon="video">
    พารามิเตอร์ของเครื่องมือวิดีโอแบบใช้ร่วมกันและการเลือกผู้ให้บริการ
  </Card>
  <Card title="Configuration reference" href="/th/gateway/config-agents#agent-defaults" icon="gear">
    ค่าเริ่มต้นของเอเจนต์และการกำหนดค่าโมเดล
  </Card>
</CardGroup>
