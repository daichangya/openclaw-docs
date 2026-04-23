---
read_when:
    - คุณต้องการใช้โมเดล Mistral ใน OpenClaw
    - คุณต้องการการถอดเสียงแบบเรียลไทม์ด้วย Voxtral สำหรับ Voice Call
    - คุณต้องการการเริ่มต้นใช้งานด้วย Mistral API key และ model ref
summary: ใช้โมเดล Mistral และการถอดเสียง Voxtral กับ OpenClaw
title: Mistral
x-i18n:
    generated_at: "2026-04-23T05:52:01Z"
    model: gpt-5.4
    provider: openai
    source_hash: 8aec3c47fee12588b28ea2b652b89f0ff136399d25ca47174d7cb6e7b5d5d97f
    source_path: providers/mistral.md
    workflow: 15
---

# Mistral

OpenClaw รองรับ Mistral ทั้งสำหรับการกำหนดเส้นทางโมเดลข้อความ/ภาพ (`mistral/...`) และ
การถอดเสียงผ่าน Voxtral ใน media understanding
Mistral ยังสามารถใช้สำหรับ memory embeddings ได้ด้วย (`memorySearch.provider = "mistral"`)

- Provider: `mistral`
- Auth: `MISTRAL_API_KEY`
- API: Mistral Chat Completions (`https://api.mistral.ai/v1`)

## เริ่มต้นใช้งาน

<Steps>
  <Step title="รับ API key ของคุณ">
    สร้าง API key ใน [Mistral Console](https://console.mistral.ai/)
  </Step>
  <Step title="รัน onboarding">
    ```bash
    openclaw onboard --auth-choice mistral-api-key
    ```

    หรือส่งคีย์ตรง ๆ:

    ```bash
    openclaw onboard --mistral-api-key "$MISTRAL_API_KEY"
    ```

  </Step>
  <Step title="ตั้งโมเดลเริ่มต้น">
    ```json5
    {
      env: { MISTRAL_API_KEY: "sk-..." },
      agents: { defaults: { model: { primary: "mistral/mistral-large-latest" } } },
    }
    ```
  </Step>
  <Step title="ตรวจสอบว่าโมเดลพร้อมใช้งาน">
    ```bash
    openclaw models list --provider mistral
    ```
  </Step>
</Steps>

## catalog LLM ที่มีมาในตัว

ปัจจุบัน OpenClaw มาพร้อม catalog ของ Mistral ดังนี้:

| Model ref                        | อินพุต       | Context | เอาต์พุตสูงสุด | หมายเหตุ                                                          |
| -------------------------------- | ------------ | ------- | -------------- | ----------------------------------------------------------------- |
| `mistral/mistral-large-latest`   | text, image  | 262,144 | 16,384         | โมเดลเริ่มต้น                                                     |
| `mistral/mistral-medium-2508`    | text, image  | 262,144 | 8,192          | Mistral Medium 3.1                                                |
| `mistral/mistral-small-latest`   | text, image  | 128,000 | 16,384         | Mistral Small 4; ปรับ reasoning ได้ผ่าน API `reasoning_effort`     |
| `mistral/pixtral-large-latest`   | text, image  | 128,000 | 32,768         | Pixtral                                                           |
| `mistral/codestral-latest`       | text         | 256,000 | 4,096          | สำหรับเขียนโค้ด                                                   |
| `mistral/devstral-medium-latest` | text         | 262,144 | 32,768         | Devstral 2                                                        |
| `mistral/magistral-small`        | text         | 128,000 | 40,000         | เปิดใช้ reasoning                                                 |

## การถอดเสียงเสียง (Voxtral)

ใช้ Voxtral สำหรับการถอดเสียงแบบ batch ผ่าน
pipeline ของ media understanding

```json5
{
  tools: {
    media: {
      audio: {
        enabled: true,
        models: [{ provider: "mistral", model: "voxtral-mini-latest" }],
      },
    },
  },
}
```

<Tip>
เส้นทางการถอดเสียงของ media ใช้ `/v1/audio/transcriptions` โมเดลเสียงเริ่มต้นของ Mistral คือ `voxtral-mini-latest`
</Tip>

## การสตรีม STT สำหรับ Voice Call

Plugin `mistral` ที่มาพร้อมในชุดจะลงทะเบียน Voxtral Realtime เป็น provider
ของ streaming STT สำหรับ Voice Call

| การตั้งค่า     | พาธคอนฟิก                                                           | ค่าเริ่มต้น                           |
| -------------- | ------------------------------------------------------------------- | ------------------------------------- |
| API key        | `plugins.entries.voice-call.config.streaming.providers.mistral.apiKey` | fallback ไปใช้ `MISTRAL_API_KEY`      |
| โมเดล          | `...mistral.model`                                                  | `voxtral-mini-transcribe-realtime-2602` |
| Encoding       | `...mistral.encoding`                                               | `pcm_mulaw`                           |
| Sample rate    | `...mistral.sampleRate`                                             | `8000`                                |
| Target delay   | `...mistral.targetStreamingDelayMs`                                 | `800`                                 |

```json5
{
  plugins: {
    entries: {
      "voice-call": {
        config: {
          streaming: {
            enabled: true,
            provider: "mistral",
            providers: {
              mistral: {
                apiKey: "${MISTRAL_API_KEY}",
                targetStreamingDelayMs: 800,
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
OpenClaw ตั้งค่า Mistral realtime STT เป็น `pcm_mulaw` ที่ 8 kHz เป็นค่าเริ่มต้น เพื่อให้ Voice Call
สามารถส่งต่อเฟรมสื่อของ Twilio ได้โดยตรง ใช้ `encoding: "pcm_s16le"` และ
`sampleRate` ที่ตรงกันเฉพาะเมื่อสตรีมต้นทางของคุณเป็น raw PCM อยู่แล้ว
</Note>

## การกำหนดค่าขั้นสูง

<AccordionGroup>
  <Accordion title="Adjustable reasoning (mistral-small-latest)">
    `mistral/mistral-small-latest` แมปไปยัง Mistral Small 4 และรองรับ [adjustable reasoning](https://docs.mistral.ai/capabilities/reasoning/adjustable) บน Chat Completions API ผ่าน `reasoning_effort` (`none` จะลดการคิดเพิ่มเติมในเอาต์พุตให้น้อยที่สุด; `high` จะแสดง trace ของการคิดแบบเต็มก่อนคำตอบสุดท้าย)

    OpenClaw จะแมประดับ **thinking** ของเซสชันไปยัง API ของ Mistral:

    | ระดับ thinking ของ OpenClaw                   | `reasoning_effort` ของ Mistral |
    | -------------------------------------------- | ------------------------------ |
    | **off** / **minimal**                        | `none`                         |
    | **low** / **medium** / **high** / **xhigh** / **adaptive** / **max** | `high`        |

    <Note>
    โมเดลอื่นใน catalog ของ Mistral ที่มาพร้อมในชุดจะไม่ใช้พารามิเตอร์นี้ ให้ใช้โมเดล `magistral-*` ต่อไปเมื่อคุณต้องการพฤติกรรม reasoning-first แบบเนทีฟของ Mistral
    </Note>

  </Accordion>

  <Accordion title="Memory embeddings">
    Mistral สามารถให้บริการ memory embeddings ผ่าน `/v1/embeddings` (โมเดลเริ่มต้น: `mistral-embed`)

    ```json5
    {
      memorySearch: { provider: "mistral" },
    }
    ```

  </Accordion>

  <Accordion title="Auth และ base URL">
    - auth ของ Mistral ใช้ `MISTRAL_API_KEY`
    - base URL ของ provider มีค่าเริ่มต้นเป็น `https://api.mistral.ai/v1`
    - โมเดลเริ่มต้นของ onboarding คือ `mistral/mistral-large-latest`
    - Z.AI ใช้ Bearer auth ร่วมกับ API key ของคุณ
  </Accordion>
</AccordionGroup>

## ที่เกี่ยวข้อง

<CardGroup cols={2}>
  <Card title="การเลือกโมเดล" href="/th/concepts/model-providers" icon="layers">
    การเลือก provider, model ref และพฤติกรรม failover
  </Card>
  <Card title="Media understanding" href="/tools/media-understanding" icon="microphone">
    การตั้งค่าการถอดเสียงและการเลือก provider
  </Card>
</CardGroup>
