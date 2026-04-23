---
read_when:
    - คุณต้องการ speech-to-text ของ Deepgram สำหรับไฟล์แนบเสียง аиҳassistant to=final
    - คุณต้องการการถอดเสียงแบบสตรีมของ Deepgram สำหรับ Voice Call
    - คุณต้องการตัวอย่างคอนฟิก Deepgram แบบรวดเร็ว
summary: การถอดเสียงด้วย Deepgram สำหรับ voice note ขาเข้า
title: Deepgram
x-i18n:
    generated_at: "2026-04-23T05:50:52Z"
    model: gpt-5.4
    provider: openai
    source_hash: ddc55436ebae295db9bd979765fbccab3ba7f25a6f5354a4e7964d151faffa22
    source_path: providers/deepgram.md
    workflow: 15
---

# Deepgram (การถอดเสียง)

Deepgram คือ API สำหรับ speech-to-text ใน OpenClaw มันถูกใช้สำหรับ
การถอดเสียงจากเสียงขาเข้า/voice note ผ่าน `tools.media.audio` และสำหรับ
STT แบบสตรีมของ Voice Call ผ่าน `plugins.entries.voice-call.config.streaming`

สำหรับการถอดเสียงแบบแบตช์ OpenClaw จะอัปโหลดไฟล์เสียงทั้งไฟล์ไปยัง Deepgram
และ inject transcript เข้าไปใน pipeline การตอบกลับ (`{{Transcript}}` +
บล็อก `[Audio]`) สำหรับการถอดเสียงแบบสตรีมของ Voice Call OpenClaw จะส่งต่อเฟรม G.711
u-law แบบสดผ่าน endpoint WebSocket `listen` ของ Deepgram และปล่อย transcript แบบ partial หรือ
แบบ final ออกมาเมื่อ Deepgram ส่งกลับ

| รายละเอียด      | ค่า                                                         |
| --------------- | ----------------------------------------------------------- |
| เว็บไซต์        | [deepgram.com](https://deepgram.com)                        |
| เอกสาร          | [developers.deepgram.com](https://developers.deepgram.com)  |
| การยืนยันตัวตน | `DEEPGRAM_API_KEY`                                          |
| โมเดลเริ่มต้น   | `nova-3`                                                    |

## เริ่มต้นใช้งาน

<Steps>
  <Step title="ตั้งค่า API key ของคุณ">
    เพิ่ม API key ของ Deepgram ลงใน environment:

    ```
    DEEPGRAM_API_KEY=dg_...
    ```

  </Step>
  <Step title="เปิดใช้ผู้ให้บริการเสียง">
    ```json5
    {
      tools: {
        media: {
          audio: {
            enabled: true,
            models: [{ provider: "deepgram", model: "nova-3" }],
          },
        },
      },
    }
    ```
  </Step>
  <Step title="ส่ง voice note">
    ส่งข้อความเสียงผ่านช่องทางใดก็ได้ที่เชื่อมต่อไว้ OpenClaw จะถอดเสียงมัน
    ผ่าน Deepgram และ inject transcript เข้าไปใน pipeline การตอบกลับ
  </Step>
</Steps>

## ตัวเลือกการตั้งค่า

| ตัวเลือก          | พาธคอนฟิก                                                   | คำอธิบาย                                |
| ----------------- | ------------------------------------------------------------ | --------------------------------------- |
| `model`           | `tools.media.audio.models[].model`                           | model id ของ Deepgram (ค่าเริ่มต้น: `nova-3`) |
| `language`        | `tools.media.audio.models[].language`                        | hint ของภาษา (ไม่บังคับ)               |
| `detect_language` | `tools.media.audio.providerOptions.deepgram.detect_language` | เปิดใช้การตรวจจับภาษา (ไม่บังคับ)      |
| `punctuate`       | `tools.media.audio.providerOptions.deepgram.punctuate`       | เปิดใช้เครื่องหมายวรรคตอน (ไม่บังคับ)  |
| `smart_format`    | `tools.media.audio.providerOptions.deepgram.smart_format`    | เปิดใช้การจัดรูปแบบอัจฉริยะ (ไม่บังคับ) |

<Tabs>
  <Tab title="พร้อม hint ของภาษา">
    ```json5
    {
      tools: {
        media: {
          audio: {
            enabled: true,
            models: [{ provider: "deepgram", model: "nova-3", language: "en" }],
          },
        },
      },
    }
    ```
  </Tab>
  <Tab title="พร้อมตัวเลือกของ Deepgram">
    ```json5
    {
      tools: {
        media: {
          audio: {
            enabled: true,
            providerOptions: {
              deepgram: {
                detect_language: true,
                punctuate: true,
                smart_format: true,
              },
            },
            models: [{ provider: "deepgram", model: "nova-3" }],
          },
        },
      },
    }
    ```
  </Tab>
</Tabs>

## STT แบบสตรีมของ Voice Call

Plugin `deepgram` แบบ bundled ยังลงทะเบียนผู้ให้บริการการถอดเสียงแบบ realtime
สำหรับ Plugin Voice Call ด้วย

| การตั้งค่า        | พาธคอนฟิก                                                            | ค่าเริ่มต้น                        |
| ----------------- | --------------------------------------------------------------------- | ---------------------------------- |
| API key           | `plugins.entries.voice-call.config.streaming.providers.deepgram.apiKey` | fallback ไปใช้ `DEEPGRAM_API_KEY` |
| Model             | `...deepgram.model`                                                   | `nova-3`                           |
| Language          | `...deepgram.language`                                                | (ไม่ได้ตั้งค่า)                    |
| Encoding          | `...deepgram.encoding`                                                | `mulaw`                            |
| Sample rate       | `...deepgram.sampleRate`                                              | `8000`                             |
| Endpointing       | `...deepgram.endpointingMs`                                           | `800`                              |
| Interim results   | `...deepgram.interimResults`                                          | `true`                             |

```json5
{
  plugins: {
    entries: {
      "voice-call": {
        config: {
          streaming: {
            enabled: true,
            provider: "deepgram",
            providers: {
              deepgram: {
                apiKey: "${DEEPGRAM_API_KEY}",
                model: "nova-3",
                endpointingMs: 800,
                language: "en-US",
              },
            },
          },
        },
      },
    },
  },
}
```

<Note>
Voice Call รับเสียงโทรศัพท์เป็น G.711 u-law 8 kHz ผู้ให้บริการสตรีมของ Deepgram
จึงใช้ค่าเริ่มต้น `encoding: "mulaw"` และ `sampleRate: 8000` ดังนั้น
เฟรมสื่อจาก Twilio จึงสามารถส่งต่อได้โดยตรง
</Note>

## หมายเหตุ

<AccordionGroup>
  <Accordion title="การยืนยันตัวตน">
    การยืนยันตัวตนเป็นไปตามลำดับ auth ของผู้ให้บริการมาตรฐาน `DEEPGRAM_API_KEY` คือ
    เส้นทางที่ง่ายที่สุด
  </Accordion>
  <Accordion title="Proxy และ endpoint แบบกำหนดเอง">
    override endpoint หรือ header ได้ด้วย `tools.media.audio.baseUrl` และ
    `tools.media.audio.headers` เมื่อใช้ proxy
  </Accordion>
  <Accordion title="พฤติกรรมของเอาต์พุต">
    เอาต์พุตเป็นไปตามกฎเสียงแบบเดียวกับผู้ให้บริการรายอื่น (เพดานขนาด, timeout,
    การ inject transcript)
  </Accordion>
</AccordionGroup>

## ที่เกี่ยวข้อง

<CardGroup cols={2}>
  <Card title="Media tools" href="/tools/media" icon="photo-film">
    ภาพรวมของ pipeline การประมวลผลเสียง ภาพ และวิดีโอ
  </Card>
  <Card title="Configuration" href="/th/gateway/configuration" icon="gear">
    เอกสารอ้างอิงคอนฟิกแบบเต็ม รวมถึงการตั้งค่าของ media tool
  </Card>
  <Card title="การแก้ไขปัญหา" href="/th/help/troubleshooting" icon="wrench">
    ปัญหาที่พบบ่อยและขั้นตอนการดีบัก
  </Card>
  <Card title="FAQ" href="/th/help/faq" icon="circle-question">
    คำถามที่พบบ่อยเกี่ยวกับการตั้งค่า OpenClaw
  </Card>
</CardGroup>
