---
read_when:
    - คุณต้องการใช้โมเดล Grok ใน OpenClaw
    - คุณกำลังกำหนดค่า xAI auth หรือ model ids
summary: ใช้โมเดล xAI Grok ใน OpenClaw
title: xAI
x-i18n:
    generated_at: "2026-04-24T09:30:40Z"
    model: gpt-5.4
    provider: openai
    source_hash: bf125767e3123d6fbf000825323dc736712feea65582c1db9f7ffccc2bc20bb4
    source_path: providers/xai.md
    workflow: 15
---

OpenClaw มาพร้อม bundled provider plugin `xai` สำหรับโมเดล Grok

## เริ่มต้นใช้งาน

<Steps>
  <Step title="สร้าง API key">
    สร้าง API key ใน [xAI console](https://console.x.ai/)
  </Step>
  <Step title="ตั้งค่า API key ของคุณ">
    ตั้งค่า `XAI_API_KEY` หรือรัน:

    ```bash
    openclaw onboard --auth-choice xai-api-key
    ```

  </Step>
  <Step title="เลือกโมเดล">
    ```json5
    {
      agents: { defaults: { model: { primary: "xai/grok-4" } } },
    }
    ```
  </Step>
</Steps>

<Note>
OpenClaw ใช้ xAI Responses API เป็นทรานสปอร์ต xAI แบบ bundled `XAI_API_KEY`
ตัวเดียวกันยังสามารถใช้กับ `web_search` ที่ขับเคลื่อนด้วย Grok, `x_search` แบบ first-class
และ `code_execution` ระยะไกลได้ด้วย
หากคุณเก็บคีย์ xAI ไว้ที่ `plugins.entries.xai.config.webSearch.apiKey`,
bundled xAI model provider จะนำคีย์นั้นมาใช้เป็น fallback ด้วยเช่นกัน
การปรับแต่ง `code_execution` อยู่ใต้ `plugins.entries.xai.config.codeExecution`
</Note>

## แค็ตตาล็อกที่มาพร้อมระบบ

OpenClaw มีตระกูลโมเดล xAI เหล่านี้มาให้พร้อมใช้งาน:

| ตระกูล | Model ids |
| -------------- | ------------------------------------------------------------------------ |
| Grok 3 | `grok-3`, `grok-3-fast`, `grok-3-mini`, `grok-3-mini-fast` |
| Grok 4 | `grok-4`, `grok-4-0709` |
| Grok 4 Fast | `grok-4-fast`, `grok-4-fast-non-reasoning` |
| Grok 4.1 Fast | `grok-4-1-fast`, `grok-4-1-fast-non-reasoning` |
| Grok 4.20 Beta | `grok-4.20-beta-latest-reasoning`, `grok-4.20-beta-latest-non-reasoning` |
| Grok Code | `grok-code-fast-1` |

plugin นี้ยัง resolve ไปข้างหน้าสำหรับ ids รุ่นใหม่ของ `grok-4*` และ `grok-code-fast*` เมื่อ
พวกมันยังคงใช้รูปแบบ API เดียวกัน

<Tip>
`grok-4-fast`, `grok-4-1-fast` และ variants ของ `grok-4.20-beta-*` คือ
refs ของ Grok ที่รองรับภาพใน bundled catalog ปัจจุบัน
</Tip>

## ความครอบคลุมของฟีเจอร์ใน OpenClaw

bundled plugin นี้แมปพื้นผิว API สาธารณะปัจจุบันของ xAI เข้ากับสัญญา
provider และ tool ที่ใช้ร่วมกันของ OpenClaw ความสามารถที่ไม่เข้ากับ shared contract
(เช่น streaming TTS และ realtime voice) จะไม่ถูกเปิดเผย — ดูตาราง
ด้านล่าง

| ความสามารถของ xAI | พื้นผิวใน OpenClaw | สถานะ |
| -------------------------- | ----------------------------------------- | ------------------------------------------------------------------- |
| Chat / Responses | provider โมเดล `xai/<model>` | ใช่ |
| Server-side web search | provider ของ `web_search` ชื่อ `grok` | ใช่ |
| Server-side X search | เครื่องมือ `x_search` | ใช่ |
| Server-side code execution | เครื่องมือ `code_execution` | ใช่ |
| รูปภาพ | `image_generate` | ใช่ |
| วิดีโอ | `video_generate` | ใช่ |
| Batch text-to-speech | `messages.tts.provider: "xai"` / `tts` | ใช่ |
| Streaming TTS | — | ไม่เปิดเผย; สัญญา TTS ของ OpenClaw คืน complete audio buffers |
| Batch speech-to-text | `tools.media.audio` / media understanding | ใช่ |
| Streaming speech-to-text | Voice Call `streaming.provider: "xai"` | ใช่ |
| Realtime voice | — | ยังไม่เปิดเผย; ใช้ session/WebSocket contract คนละแบบ |
| Files / batches | ความเข้ากันได้ของ generic model API เท่านั้น | ไม่ใช่เครื่องมือ first-class ของ OpenClaw |

<Note>
OpenClaw ใช้ REST APIs ของ xAI สำหรับ image/video/TTS/STT สำหรับการสร้างสื่อ,
speech และ batch transcription, ใช้ xAI streaming STT WebSocket สำหรับ live
voice-call transcription และใช้ Responses API สำหรับเครื่องมือ model, search และ
code-execution ฟีเจอร์ที่ต้องใช้สัญญา OpenClaw แบบอื่น เช่น
Realtime voice sessions จะถูกบันทึกไว้ที่นี่ในฐานะความสามารถฝั่ง upstream แทนที่จะซ่อนไว้เป็นพฤติกรรมภายในของ Plugin
</Note>

### การแมปของ Fast-mode

`/fast on` หรือ `agents.defaults.models["xai/<model>"].params.fastMode: true`
จะเขียนทับ native xAI requests ดังนี้:

| โมเดลต้นทาง | เป้าหมายใน fast-mode |
| ------------- | ------------------ |
| `grok-3` | `grok-3-fast` |
| `grok-3-mini` | `grok-3-mini-fast` |
| `grok-4` | `grok-4-fast` |
| `grok-4-0709` | `grok-4-fast` |

### Legacy compatibility aliases

aliases แบบเดิมจะยัง normalize ไปยัง bundled ids แบบ canonical:

| Legacy alias | Canonical id |
| ------------------------- | ------------------------------------- |
| `grok-4-fast-reasoning` | `grok-4-fast` |
| `grok-4-1-fast-reasoning` | `grok-4-1-fast` |
| `grok-4.20-reasoning` | `grok-4.20-beta-latest-reasoning` |
| `grok-4.20-non-reasoning` | `grok-4.20-beta-latest-non-reasoning` |

## ฟีเจอร์

<AccordionGroup>
  <Accordion title="Web search">
    bundled `grok` web-search provider ก็ใช้ `XAI_API_KEY` เช่นกัน:

    ```bash
    openclaw config set tools.web.search.provider grok
    ```

  </Accordion>

  <Accordion title="การสร้างวิดีโอ">
    bundled `xai` plugin ลงทะเบียนการสร้างวิดีโอผ่าน
    เครื่องมือ `video_generate` ที่ใช้ร่วมกัน

    - โมเดลวิดีโอเริ่มต้น: `xai/grok-imagine-video`
    - โหมด: text-to-video, image-to-video, remote video edit และ remote video
      extension
    - อัตราส่วนภาพ: `1:1`, `16:9`, `9:16`, `4:3`, `3:4`, `3:2`, `2:3`
    - ความละเอียด: `480P`, `720P`
    - ระยะเวลา: 1-15 วินาทีสำหรับ generation/image-to-video, 2-10 วินาทีสำหรับ
      extension

    <Warning>
    ไม่รองรับ local video buffers ให้ใช้ remote `http(s)` URLs สำหรับ
    อินพุตของ video edit/extend ส่วน image-to-video รองรับ local image buffers เพราะ
    OpenClaw สามารถเข้ารหัสสิ่งเหล่านั้นเป็น data URLs สำหรับ xAI ได้
    </Warning>

    หากต้องการใช้ xAI เป็นผู้ให้บริการวิดีโอเริ่มต้น:

    ```json5
    {
      agents: {
        defaults: {
          videoGenerationModel: {
            primary: "xai/grok-imagine-video",
          },
        },
      },
    }
    ```

    <Note>
    โปรดดู [Video Generation](/th/tools/video-generation) สำหรับพารามิเตอร์ของเครื่องมือที่ใช้ร่วมกัน,
    การเลือกผู้ให้บริการ และลักษณะการทำงานของ failover
    </Note>

  </Accordion>

  <Accordion title="การสร้างรูปภาพ">
    bundled `xai` plugin ลงทะเบียนการสร้างรูปภาพผ่าน
    เครื่องมือ `image_generate` ที่ใช้ร่วมกัน

    - โมเดลภาพเริ่มต้น: `xai/grok-imagine-image`
    - โมเดลเพิ่มเติม: `xai/grok-imagine-image-pro`
    - โหมด: text-to-image และ reference-image edit
    - อินพุตอ้างอิง: `image` หนึ่งรายการ หรือ `images` ได้สูงสุดห้ารายการ
    - อัตราส่วนภาพ: `1:1`, `16:9`, `9:16`, `4:3`, `3:4`, `2:3`, `3:2`
    - ความละเอียด: `1K`, `2K`
    - จำนวน: สูงสุด 4 ภาพ

    OpenClaw จะขอผลลัพธ์ภาพจาก xAI ในรูปแบบ `b64_json` เพื่อให้สามารถ
    จัดเก็บและส่งสื่อที่สร้างขึ้นผ่านเส้นทางไฟล์แนบปกติของช่องทางได้
    รูปอ้างอิงแบบโลคัลจะถูกแปลงเป็น data URLs; ส่วน reference แบบ `http(s)` ระยะไกลจะถูกส่งผ่านตรง

    หากต้องการใช้ xAI เป็นผู้ให้บริการภาพเริ่มต้น:

    ```json5
    {
      agents: {
        defaults: {
          imageGenerationModel: {
            primary: "xai/grok-imagine-image",
          },
        },
      },
    }
    ```

    <Note>
    xAI ยังมีเอกสารสำหรับ `quality`, `mask`, `user` และอัตราส่วนแบบ native เพิ่มเติม
    เช่น `1:2`, `2:1`, `9:20` และ `20:9` ปัจจุบัน OpenClaw ส่งต่อเฉพาะ
    ตัวควบคุมภาพแบบใช้ร่วมกันข้ามผู้ให้บริการเท่านั้น ปุ่มควบคุม native-only ที่ไม่รองรับ
    จึงตั้งใจไม่เปิดเผยผ่าน `image_generate`
    </Note>

  </Accordion>

  <Accordion title="Text-to-speech">
    bundled `xai` plugin ลงทะเบียน text-to-speech ผ่านพื้นผิว
    `tts` provider ที่ใช้ร่วมกัน

    - Voices: `eve`, `ara`, `rex`, `sal`, `leo`, `una`
    - เสียงเริ่มต้น: `eve`
    - Formats: `mp3`, `wav`, `pcm`, `mulaw`, `alaw`
    - ภาษา: BCP-47 code หรือ `auto`
    - ความเร็ว: การ override ความเร็วแบบ native ของ provider
    - ไม่รองรับรูปแบบ voice-note แบบ Opus native

    หากต้องการใช้ xAI เป็นผู้ให้บริการ TTS เริ่มต้น:

    ```json5
    {
      messages: {
        tts: {
          provider: "xai",
          providers: {
            xai: {
              voiceId: "eve",
            },
          },
        },
      },
    }
    ```

    <Note>
    OpenClaw ใช้ endpoint `/v1/tts` แบบเป็นชุดของ xAI xAI ยังมี streaming TTS
    ผ่าน WebSocket ด้วย แต่ปัจจุบันสัญญาของ speech provider ใน OpenClaw คาดหวัง
    audio buffer ที่สมบูรณ์ก่อนส่งคำตอบ
    </Note>

  </Accordion>

  <Accordion title="Speech-to-text">
    bundled `xai` plugin ลงทะเบียน batch speech-to-text ผ่านพื้นผิว
    media-understanding transcription ของ OpenClaw

    - โมเดลเริ่มต้น: `grok-stt`
    - Endpoint: xAI REST `/v1/stt`
    - เส้นทางอินพุต: multipart audio file upload
    - รองรับใน OpenClaw ทุกที่ที่การถอดเสียง audio ขาเข้าใช้
      `tools.media.audio` รวมถึงส่วนเสียงใน Discord voice-channel และ
      ไฟล์แนบ audio ของช่องทางต่าง ๆ

    หากต้องการบังคับใช้ xAI สำหรับการถอดเสียง audio ขาเข้า:

    ```json5
    {
      tools: {
        media: {
          audio: {
            models: [
              {
                type: "provider",
                provider: "xai",
                model: "grok-stt",
              },
            ],
          },
        },
      },
    }
    ```

    สามารถระบุภาษาได้ผ่าน shared audio media config หรือคำขอ
    transcription แบบต่อครั้ง Prompt hints ยอมรับได้ผ่านพื้นผิวที่ใช้ร่วมกันของ OpenClaw
    แต่ integration ของ xAI REST STT จะส่งต่อเฉพาะ file, model และ
    language เพราะสิ่งเหล่านี้แมปกับ endpoint สาธารณะปัจจุบันของ xAI ได้อย่างตรงไปตรงมา

  </Accordion>

  <Accordion title="Streaming speech-to-text">
    bundled `xai` plugin ยังลงทะเบียน realtime transcription provider
    สำหรับ live voice-call audio ด้วย

    - Endpoint: xAI WebSocket `wss://api.x.ai/v1/stt`
    - encoding เริ่มต้น: `mulaw`
    - sample rate เริ่มต้น: `8000`
    - endpointing เริ่มต้น: `800ms`
    - interim transcripts: เปิดใช้ตามค่าเริ่มต้น

    สตรีมสื่อของ Voice Call จาก Twilio ส่งเฟรมเสียง G.711 µ-law ดังนั้น
    provider ของ xAI จึงสามารถส่งต่อเฟรมเหล่านั้นได้โดยตรงโดยไม่ต้องแปลงรหัส:

    ```json5
    {
      plugins: {
        entries: {
          "voice-call": {
            config: {
              streaming: {
                enabled: true,
                provider: "xai",
                providers: {
                  xai: {
                    apiKey: "${XAI_API_KEY}",
                    endpointingMs: 800,
                    language: "en",
                  },
                },
              },
            },
          },
        },
      },
    }
    ```

    config ที่เป็นของ provider อยู่ใต้
    `plugins.entries.voice-call.config.streaming.providers.xai` คีย์ที่รองรับ
    คือ `apiKey`, `baseUrl`, `sampleRate`, `encoding` (`pcm`, `mulaw` หรือ
    `alaw`), `interimResults`, `endpointingMs` และ `language`

    <Note>
    streaming provider นี้มีไว้สำหรับเส้นทาง realtime transcription ของ Voice Call
    ปัจจุบัน Discord voice ยังอัดเสียงเป็นช่วงสั้น ๆ และใช้เส้นทาง batch
    `tools.media.audio` transcription แทน
    </Note>

  </Accordion>

  <Accordion title="การกำหนดค่า x_search">
    bundled xAI plugin เปิดเผย `x_search` เป็นเครื่องมือของ OpenClaw สำหรับค้นหา
    เนื้อหาบน X (เดิมคือ Twitter) ผ่าน Grok

    เส้นทาง config: `plugins.entries.xai.config.xSearch`

| คีย์ | ชนิด | ค่าเริ่มต้น | คำอธิบาย |
| ------------------ | ------- | ------------------ | ------------------------------------ |
| `enabled` | boolean | — | เปิดหรือปิด x_search |
| `model` | string | `grok-4-1-fast` | โมเดลที่ใช้สำหรับคำขอ x_search |
| `inlineCitations` | boolean | — | รวมการอ้างอิงแบบ inline ในผลลัพธ์ |
| `maxTurns` | number | — | จำนวนเทิร์นของบทสนทนาสูงสุด |
| `timeoutSeconds` | number | — | request timeout เป็นวินาที |
| `cacheTtlMinutes` | number | — | เวลา cache time-to-live เป็นนาที |

```json5
{
  plugins: {
    entries: {
      xai: {
        config: {
          xSearch: {
            enabled: true,
            model: "grok-4-1-fast",
            inlineCitations: true,
          },
        },
      },
    },
  },
}
```

  </Accordion>

  <Accordion title="การกำหนดค่า code execution">
    bundled xAI plugin เปิดเผย `code_execution` เป็นเครื่องมือของ OpenClaw สำหรับ
    การรันโค้ดระยะไกลในสภาพแวดล้อม sandbox ของ xAI

    เส้นทาง config: `plugins.entries.xai.config.codeExecution`

    | คีย์ | ชนิด | ค่าเริ่มต้น | คำอธิบาย |
    | ----------------- | ------- | ------------------ | ---------------------------------------- |
    | `enabled` | boolean | `true` (หากมีคีย์พร้อมใช้) | เปิดหรือปิด code execution |
    | `model` | string | `grok-4-1-fast` | โมเดลที่ใช้สำหรับคำขอ code execution |
    | `maxTurns` | number | — | จำนวนเทิร์นของบทสนทนาสูงสุด |
    | `timeoutSeconds` | number | — | request timeout เป็นวินาที |

    <Note>
    นี่คือการรันใน sandbox ระยะไกลของ xAI ไม่ใช่ [`exec`](/th/tools/exec) แบบโลคัล
    </Note>

    ```json5
    {
      plugins: {
        entries: {
          xai: {
            config: {
              codeExecution: {
                enabled: true,
                model: "grok-4-1-fast",
              },
            },
          },
        },
      },
    }
    ```

  </Accordion>

  <Accordion title="ข้อจำกัดที่ทราบ">
    - ปัจจุบัน auth รองรับเฉพาะ API-key เท่านั้น ยังไม่มี xAI OAuth หรือ device-code flow ใน
      OpenClaw
    - `grok-4.20-multi-agent-experimental-beta-0304` ไม่รองรับบน
      เส้นทาง xAI provider ปกติ เพราะต้องใช้พื้นผิว API ของ upstream
      ที่ต่างจาก transport xAI มาตรฐานของ OpenClaw
    - xAI Realtime voice ยังไม่ได้ลงทะเบียนเป็น provider ของ OpenClaw มัน
      ต้องใช้สัญญา bidirectional voice session ที่ต่างจาก batch STT หรือ
      streaming transcription
    - xAI image `quality`, image `mask` และอัตราส่วน native-only เพิ่มเติม
      ยังไม่ถูกเปิดเผยจนกว่าเครื่องมือ `image_generate` แบบใช้ร่วมกันจะมีตัวควบคุม
      ที่เทียบกันได้ข้ามผู้ให้บริการ
  </Accordion>

  <Accordion title="หมายเหตุขั้นสูง">
    - OpenClaw จะใช้การแก้ไขเฉพาะ xAI สำหรับความเข้ากันได้ของ tool-schema และ tool-call
      โดยอัตโนมัติบน shared runner path
    - native xAI requests จะตั้งค่าเริ่มต้น `tool_stream: true` ใช้
      `agents.defaults.models["xai/<model>"].params.tool_stream` เป็น `false` เพื่อ
      ปิดใช้งาน
    - xAI wrapper ที่มาพร้อมระบบจะตัด strict tool-schema flags ที่ไม่รองรับและ
      reasoning payload keys ออกก่อนส่ง native xAI requests
    - `web_search`, `x_search` และ `code_execution` ถูกเปิดเผยเป็นเครื่องมือของ OpenClaw
      โดย OpenClaw จะเปิดเฉพาะ xAI built-in ที่ต้องใช้ในแต่ละคำขอของเครื่องมือ
      แทนที่จะผูก native tools ทั้งหมดกับทุกแชตเทิร์น
    - `x_search` และ `code_execution` เป็นของ bundled xAI plugin
      ไม่ได้ถูก hardcode ไว้ใน core model runtime
    - `code_execution` คือการรันใน sandbox ระยะไกลของ xAI ไม่ใช่
      [`exec`](/th/tools/exec) แบบโลคัล
  </Accordion>
</AccordionGroup>

## การทดสอบแบบ Live

เส้นทางสื่อของ xAI ถูกครอบคลุมด้วย unit tests และ live suites แบบ opt-in คำสั่ง
live จะโหลด secrets จาก login shell ของคุณ รวมถึง `~/.profile` ก่อน
probe `XAI_API_KEY`

```bash
pnpm test extensions/xai
OPENCLAW_LIVE_TEST=1 OPENCLAW_LIVE_TEST_QUIET=1 pnpm test:live -- extensions/xai/xai.live.test.ts
OPENCLAW_LIVE_TEST=1 OPENCLAW_LIVE_TEST_QUIET=1 OPENCLAW_LIVE_IMAGE_GENERATION_PROVIDERS=xai pnpm test:live -- test/image-generation.runtime.live.test.ts
```

ไฟล์ live แบบเฉพาะ provider จะทำการสังเคราะห์ TTS แบบปกติ, TTS แบบ PCM ที่เหมาะกับการโทร,
ถอดเสียง audio ผ่าน xAI batch STT, สตรีม PCM เดียวกันผ่าน xAI
realtime STT, สร้างผลลัพธ์แบบ text-to-image และแก้ไขรูปอ้างอิง ส่วน
ไฟล์ image live ที่ใช้ร่วมกันจะตรวจสอบ provider xAI ตัวเดียวกันผ่าน
runtime selection, fallback, normalization และเส้นทาง media attachment ของ OpenClaw

## ที่เกี่ยวข้อง

<CardGroup cols={2}>
  <Card title="การเลือกโมเดล" href="/th/concepts/model-providers" icon="layers">
    การเลือก providers, model refs และลักษณะการทำงานของ failover
  </Card>
  <Card title="การสร้างวิดีโอ" href="/th/tools/video-generation" icon="video">
    พารามิเตอร์ของเครื่องมือวิดีโอแบบใช้ร่วมกันและการเลือกผู้ให้บริการ
  </Card>
  <Card title="ผู้ให้บริการทั้งหมด" href="/th/providers/index" icon="grid-2">
    ภาพรวมของผู้ให้บริการแบบกว้าง
  </Card>
  <Card title="การแก้ไขปัญหา" href="/th/help/troubleshooting" icon="wrench">
    ปัญหาทั่วไปและวิธีแก้ไข
  </Card>
</CardGroup>
