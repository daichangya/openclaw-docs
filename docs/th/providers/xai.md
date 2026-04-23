---
read_when:
    - คุณต้องการใช้โมเดล Grok ใน OpenClaw
    - คุณกำลังกำหนดค่า auth หรือ model id ของ xAI
summary: ใช้โมเดล xAI Grok ใน OpenClaw
title: xAI
x-i18n:
    generated_at: "2026-04-23T05:54:01Z"
    model: gpt-5.4
    provider: openai
    source_hash: 37a9fd184bab6f7ab363487332752141212a89c7380f6f91a659c78bcc470c9b
    source_path: providers/xai.md
    workflow: 15
---

# xAI

OpenClaw มาพร้อม provider plugin `xai` ที่รวมอยู่ในชุด สำหรับโมเดล Grok

## เริ่มต้นใช้งาน

<Steps>
  <Step title="สร้าง API key">
    สร้าง API key ใน [xAI console](https://console.x.ai/)
  </Step>
  <Step title="ตั้ง API key ของคุณ">
    ตั้ง `XAI_API_KEY` หรือรัน:

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
OpenClaw ใช้ xAI Responses API เป็น transport ของ xAI ที่มาพร้อมในชุด `XAI_API_KEY`
ตัวเดียวกันยังสามารถใช้กับ `web_search` ที่แบ็กด้วย Grok, `x_search` แบบ first-class
และ `code_execution` แบบ remote ได้ด้วย
หากคุณเก็บคีย์ xAI ไว้ภายใต้ `plugins.entries.xai.config.webSearch.apiKey`,
provider โมเดล xAI ที่มาพร้อมในชุดจะนำคีย์นั้นกลับมาใช้เป็น fallback ด้วย
การปรับแต่ง `code_execution` อยู่ภายใต้ `plugins.entries.xai.config.codeExecution`
</Note>

## catalog โมเดลที่มาพร้อมในชุด

OpenClaw มีตระกูลโมเดล xAI เหล่านี้มาให้พร้อมใช้งานทันที:

| ตระกูล          | Model id                                                                |
| --------------- | ----------------------------------------------------------------------- |
| Grok 3          | `grok-3`, `grok-3-fast`, `grok-3-mini`, `grok-3-mini-fast`              |
| Grok 4          | `grok-4`, `grok-4-0709`                                                 |
| Grok 4 Fast     | `grok-4-fast`, `grok-4-fast-non-reasoning`                              |
| Grok 4.1 Fast   | `grok-4-1-fast`, `grok-4-1-fast-non-reasoning`                          |
| Grok 4.20 Beta  | `grok-4.20-beta-latest-reasoning`, `grok-4.20-beta-latest-non-reasoning` |
| Grok Code       | `grok-code-fast-1`                                                      |

Plugin นี้ยัง forward-resolve `grok-4*` และ `grok-code-fast*` id รุ่นใหม่กว่าได้ด้วย เมื่อ
มันใช้รูปแบบ API เดียวกัน

<Tip>
`grok-4-fast`, `grok-4-1-fast` และตัวแปร `grok-4.20-beta-*` คือ
Grok ref ที่รองรับภาพใน catalog ที่มาพร้อมในชุด ณ ปัจจุบัน
</Tip>

## ขอบเขตฟีเจอร์ของ OpenClaw

Plugin ที่มาพร้อมในชุดจะแมปพื้นผิว API สาธารณะปัจจุบันของ xAI เข้ากับสัญญาของ
provider และ tool แบบใช้ร่วมกันของ OpenClaw ในกรณีที่พฤติกรรมเข้ากันได้อย่างชัดเจน

| ความสามารถของ xAI           | พื้นผิวใน OpenClaw                     | สถานะ                                                                |
| ---------------------------- | -------------------------------------- | --------------------------------------------------------------------- |
| Chat / Responses             | provider โมเดล `xai/<model>`          | ใช่                                                                   |
| Server-side web search       | provider `grok` ของ `web_search`      | ใช่                                                                   |
| Server-side X search         | เครื่องมือ `x_search`                  | ใช่                                                                   |
| Server-side code execution   | เครื่องมือ `code_execution`            | ใช่                                                                   |
| Images                       | `image_generate`                       | ใช่                                                                   |
| Videos                       | `video_generate`                       | ใช่                                                                   |
| Batch text-to-speech         | `messages.tts.provider: "xai"` / `tts` | ใช่                                                                   |
| Streaming TTS                | —                                      | ไม่เปิดเผย; สัญญา TTS ของ OpenClaw คืนค่าเป็น audio buffer ที่สมบูรณ์แล้ว |
| Batch speech-to-text         | `tools.media.audio` / media understanding | ใช่                                                                |
| Streaming speech-to-text     | Voice Call `streaming.provider: "xai"` | ใช่                                                                   |
| Realtime voice               | —                                      | ยังไม่เปิดเผย; ใช้สัญญา session/WebSocket ที่ต่างออกไป                |
| Files / batches              | ความเข้ากันได้กับ Generic model API เท่านั้น | ไม่ใช่ first-class tool ของ OpenClaw                               |

<Note>
OpenClaw ใช้ REST API ของ xAI สำหรับ image/video/TTS/STT สำหรับการสร้างสื่อ,
เสียงพูด และการถอดเสียงแบบ batch, ใช้ WebSocket ของ xAI สำหรับ streaming STT
สำหรับการถอดเสียงในการโทรแบบ live และใช้ Responses API สำหรับโมเดล การค้นหา และ
เครื่องมือ code-execution ฟีเจอร์ที่ต้องใช้สัญญาแบบอื่นของ OpenClaw เช่น
Realtime voice session จะถูกระบุไว้ที่นี่ในฐานะความสามารถของ upstream
แทนที่จะซ่อนไว้เป็นพฤติกรรมของ Plugin
</Note>

### การแมป fast mode

`/fast on` หรือ `agents.defaults.models["xai/<model>"].params.fastMode: true`
จะเขียนคำขอ xAI แบบเนทีฟใหม่ดังนี้:

| โมเดลต้นทาง   | เป้าหมายเมื่อเปิด fast mode |
| ------------- | ---------------------------- |
| `grok-3`      | `grok-3-fast`                |
| `grok-3-mini` | `grok-3-mini-fast`           |
| `grok-4`      | `grok-4-fast`                |
| `grok-4-0709` | `grok-4-fast`                |

### alias แบบ legacy เพื่อความเข้ากันได้

alias แบบ legacy จะยัง normalize ไปยัง id แบบ canonical ที่มาพร้อมในชุด:

| alias แบบ legacy            | canonical id                         |
| --------------------------- | ------------------------------------ |
| `grok-4-fast-reasoning`     | `grok-4-fast`                        |
| `grok-4-1-fast-reasoning`   | `grok-4-1-fast`                      |
| `grok-4.20-reasoning`       | `grok-4.20-beta-latest-reasoning`    |
| `grok-4.20-non-reasoning`   | `grok-4.20-beta-latest-non-reasoning` |

## ฟีเจอร์

<AccordionGroup>
  <Accordion title="Web search">
    provider `grok` สำหรับ web-search ที่มาพร้อมในชุดก็ใช้ `XAI_API_KEY` ด้วยเช่นกัน:

    ```bash
    openclaw config set tools.web.search.provider grok
    ```

  </Accordion>

  <Accordion title="การสร้างวิดีโอ">
    Plugin `xai` ที่มาพร้อมในชุดจะลงทะเบียนการสร้างวิดีโอผ่าน
    เครื่องมือ `video_generate` ที่ใช้ร่วมกัน

    - โมเดลวิดีโอเริ่มต้น: `xai/grok-imagine-video`
    - โหมด: text-to-video, image-to-video, remote video edit และ remote video
      extension
    - อัตราส่วนภาพ: `1:1`, `16:9`, `9:16`, `4:3`, `3:4`, `3:2`, `2:3`
    - ความละเอียด: `480P`, `720P`
    - ระยะเวลา: 1-15 วินาทีสำหรับ generation/image-to-video, 2-10 วินาทีสำหรับ
      extension

    <Warning>
    ไม่รองรับ local video buffer ให้ใช้ URL แบบ remote `http(s)` สำหรับ
    อินพุตของ video edit/extend ส่วน image-to-video รองรับ local image buffer เพราะ
    OpenClaw สามารถเข้ารหัสมันเป็น data URL ให้ xAI ได้
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
    ดู [การสร้างวิดีโอ](/th/tools/video-generation) สำหรับพารามิเตอร์ของเครื่องมือที่ใช้ร่วมกัน
    การเลือก provider และพฤติกรรม failover
    </Note>

  </Accordion>

  <Accordion title="การสร้างภาพ">
    Plugin `xai` ที่มาพร้อมในชุดจะลงทะเบียนการสร้างภาพผ่าน
    เครื่องมือ `image_generate` ที่ใช้ร่วมกัน

    - โมเดลภาพเริ่มต้น: `xai/grok-imagine-image`
    - โมเดลเพิ่มเติม: `xai/grok-imagine-image-pro`
    - โหมด: text-to-image และ reference-image edit
    - อินพุตอ้างอิง: หนึ่ง `image` หรือ `images` ได้สูงสุดห้ารายการ
    - อัตราส่วนภาพ: `1:1`, `16:9`, `9:16`, `4:3`, `3:4`, `2:3`, `3:2`
    - ความละเอียด: `1K`, `2K`
    - จำนวน: สูงสุด 4 ภาพ

    OpenClaw จะขอการตอบกลับภาพแบบ `b64_json` จาก xAI เพื่อให้สื่อที่สร้างขึ้น
    สามารถจัดเก็บและส่งมอบผ่านเส้นทางไฟล์แนบของช่องตามปกติได้ ภาพอ้างอิงภายในเครื่อง
    จะถูกแปลงเป็น data URL; ส่วนอ้างอิงแบบ remote `http(s)` จะถูกส่งผ่านตรงไป

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
    xAI ยังระบุ `quality`, `mask`, `user` และอัตราส่วนแบบ native เพิ่มเติม
    เช่น `1:2`, `2:1`, `9:20` และ `20:9` ไว้ในเอกสารด้วย แต่ปัจจุบัน OpenClaw
    ส่งต่อเฉพาะตัวควบคุมภาพแบบข้าม provider ที่ใช้ร่วมกันเท่านั้น knob แบบ native-only
    ที่ไม่รองรับจึงถูกตั้งใจไม่เปิดเผยผ่าน `image_generate`
    </Note>

  </Accordion>

  <Accordion title="Text-to-speech">
    Plugin `xai` ที่มาพร้อมในชุดจะลงทะเบียน text-to-speech ผ่านพื้นผิว
    provider `tts` ที่ใช้ร่วมกัน

    - เสียง: `eve`, `ara`, `rex`, `sal`, `leo`, `una`
    - เสียงเริ่มต้น: `eve`
    - ฟอร์แมต: `mp3`, `wav`, `pcm`, `mulaw`, `alaw`
    - ภาษา: รหัส BCP-47 หรือ `auto`
    - ความเร็ว: การ override ความเร็วแบบเนทีฟของ provider
    - ไม่รองรับฟอร์แมต voice-note แบบ Native Opus

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
    OpenClaw ใช้ endpoint `/v1/tts` แบบ batch ของ xAI xAI ยังมี TTS แบบสตรีม
    ผ่าน WebSocket ด้วย แต่ปัจจุบันสัญญา speech provider ของ OpenClaw คาดหวัง
    audio buffer ที่สมบูรณ์แล้วก่อนการส่งมอบคำตอบ
    </Note>

  </Accordion>

  <Accordion title="Speech-to-text">
    Plugin `xai` ที่มาพร้อมในชุดจะลงทะเบียน speech-to-text แบบ batch ผ่านพื้นผิว
    การถอดเสียงของ media-understanding ใน OpenClaw

    - โมเดลเริ่มต้น: `grok-stt`
    - Endpoint: xAI REST `/v1/stt`
    - เส้นทางอินพุต: อัปโหลดไฟล์เสียงแบบ multipart
    - รองรับทุกที่ใน OpenClaw ที่การถอดเสียงขาเข้าใช้
      `tools.media.audio` รวมถึง voice-channel segment ของ Discord และ
      ไฟล์แนบเสียงของช่อง

    หากต้องการบังคับใช้ xAI สำหรับการถอดเสียงขาเข้า:

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

    ภาษาอาจระบุผ่าน shared audio media config หรือผ่านคำขอ
    ถอดเสียงแบบต่อครั้ง คำใบ้ prompt รองรับโดยพื้นผิว OpenClaw แบบใช้ร่วมกัน
    แต่ integration ของ xAI REST STT จะส่งต่อเฉพาะ file, model และ
    language เพราะสิ่งเหล่านั้นแมปกับ endpoint สาธารณะปัจจุบันของ xAI ได้อย่างชัดเจน

  </Accordion>

  <Accordion title="Streaming speech-to-text">
    Plugin `xai` ที่มาพร้อมในชุดยังลงทะเบียน realtime transcription provider
    สำหรับเสียงของ Voice Call แบบสดด้วย

    - Endpoint: xAI WebSocket `wss://api.x.ai/v1/stt`
    - encoding เริ่มต้น: `mulaw`
    - sample rate เริ่มต้น: `8000`
    - endpointing เริ่มต้น: `800ms`
    - interim transcript: เปิดใช้งานเป็นค่าเริ่มต้น

    สตรีมสื่อของ Twilio สำหรับ Voice Call จะส่งเฟรมเสียงแบบ G.711 µ-law ดังนั้น
    provider ของ xAI จึงสามารถส่งต่อเฟรมเหล่านั้นได้โดยตรงโดยไม่ต้อง transcode:

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

    config ที่เป็นของ provider อยู่ภายใต้
    `plugins.entries.voice-call.config.streaming.providers.xai` คีย์ที่รองรับ
    คือ `apiKey`, `baseUrl`, `sampleRate`, `encoding` (`pcm`, `mulaw` หรือ
    `alaw`), `interimResults`, `endpointingMs` และ `language`

    <Note>
    streaming provider นี้มีไว้สำหรับเส้นทางถอดเสียงแบบเรียลไทม์ของ Voice Call
    ส่วนเสียงของ Discord ปัจจุบันจะบันทึกเป็น segment สั้น ๆ แล้วใช้เส้นทางถอดเสียงแบบ batch ของ
    `tools.media.audio` แทน
    </Note>

  </Accordion>

  <Accordion title="การกำหนดค่า x_search">
    Plugin xAI ที่มาพร้อมในชุดเปิดเผย `x_search` เป็นเครื่องมือของ OpenClaw สำหรับการค้นหา
    เนื้อหาบน X (เดิมคือ Twitter) ผ่าน Grok

    พาธคอนฟิก: `plugins.entries.xai.config.xSearch`

    | คีย์                | ชนิด    | ค่าเริ่มต้น         | คำอธิบาย                           |
    | ------------------ | ------- | ------------------- | ---------------------------------- |
    | `enabled`          | boolean | —                   | เปิดหรือปิด x_search               |
    | `model`            | string  | `grok-4-1-fast`     | โมเดลที่ใช้สำหรับคำขอ x_search     |
    | `inlineCitations`  | boolean | —                   | รวม inline citation ในผลลัพธ์      |
    | `maxTurns`         | number  | —                   | จำนวนรอบการสนทนาสูงสุด            |
    | `timeoutSeconds`   | number  | —                   | request timeout เป็นวินาที         |
    | `cacheTtlMinutes`  | number  | —                   | cache time-to-live เป็นนาที        |

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
    Plugin xAI ที่มาพร้อมในชุดเปิดเผย `code_execution` เป็นเครื่องมือของ OpenClaw สำหรับ
    การรันโค้ดระยะไกลใน sandbox environment ของ xAI

    พาธคอนฟิก: `plugins.entries.xai.config.codeExecution`

    | คีย์              | ชนิด    | ค่าเริ่มต้น                | คำอธิบาย                                |
    | ----------------- | ------- | -------------------------- | --------------------------------------- |
    | `enabled`         | boolean | `true` (หากมีคีย์พร้อมใช้) | เปิดหรือปิด code execution             |
    | `model`           | string  | `grok-4-1-fast`            | โมเดลที่ใช้สำหรับคำขอ code execution    |
    | `maxTurns`        | number  | —                          | จำนวนรอบการสนทนาสูงสุด                 |
    | `timeoutSeconds`  | number  | —                          | request timeout เป็นวินาที             |

    <Note>
    นี่คือการรันใน sandbox ระยะไกลของ xAI ไม่ใช่ [`exec`](/th/tools/exec) ในเครื่อง
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
    - ปัจจุบัน auth รองรับเฉพาะ API key ยังไม่มีโฟลว์ xAI OAuth หรือ device-code ใน
      OpenClaw
    - `grok-4.20-multi-agent-experimental-beta-0304` ไม่รองรับบน
      เส้นทาง provider xAI ปกติ เพราะต้องใช้พื้นผิว API ของ upstream ที่ต่างออกไป
      จาก transport xAI มาตรฐานของ OpenClaw
    - xAI Realtime voice ยังไม่ได้ถูกลงทะเบียนเป็น provider ของ OpenClaw
      มันต้องใช้สัญญาเซสชันเสียงแบบ bidirectional ที่ต่างจาก batch STT หรือ
      streaming transcription
    - `quality`, `mask` ของภาพใน xAI และอัตราส่วนเพิ่มเติมแบบ native-only
      ยังไม่ถูกเปิดเผย จนกว่าเครื่องมือ `image_generate` ที่ใช้ร่วมกันจะมี
      ตัวควบคุมแบบข้าม provider ที่สอดคล้องกัน
  </Accordion>

  <Accordion title="หมายเหตุขั้นสูง">
    - OpenClaw จะใช้การแก้ไขความเข้ากันได้เฉพาะของ xAI สำหรับ tool-schema และ tool-call
      ให้อัตโนมัติบน shared runner path
    - คำขอ xAI แบบเนทีฟจะตั้งค่าเริ่มต้น `tool_stream: true` ตั้ง
      `agents.defaults.models["xai/<model>"].params.tool_stream` เป็น `false` เพื่อ
      ปิดมัน
    - ตัวห่อ xAI ที่มาพร้อมในชุดจะลบ strict tool-schema flag และ
      reasoning payload key ที่ไม่รองรับออกก่อนส่งคำขอ xAI แบบเนทีฟ
    - `web_search`, `x_search` และ `code_execution` ถูกเปิดเผยเป็นเครื่องมือของ OpenClaw
      โดย OpenClaw จะเปิดใช้ xAI built-in เฉพาะตัวที่จำเป็นในแต่ละคำขอของ tool
      แทนการแนบ native tool ทั้งหมดกับทุก turn ของแชต
    - `x_search` และ `code_execution` เป็นของ Plugin xAI ที่มาพร้อมในชุด
      ไม่ได้ฮาร์ดโค้ดไว้ใน core model runtime
    - `code_execution` คือการรันใน sandbox ระยะไกลของ xAI ไม่ใช่
      [`exec`](/th/tools/exec) ในเครื่อง
  </Accordion>
</AccordionGroup>

## Live testing

เส้นทางสื่อของ xAI ถูกครอบคลุมด้วย unit test และ live suite แบบ opt-in คำสั่ง live
จะโหลด secret จาก login shell ของคุณ รวมถึง `~/.profile` ก่อน
probe `XAI_API_KEY`

```bash
pnpm test extensions/xai
OPENCLAW_LIVE_TEST=1 OPENCLAW_LIVE_TEST_QUIET=1 pnpm test:live -- extensions/xai/xai.live.test.ts
OPENCLAW_LIVE_TEST=1 OPENCLAW_LIVE_TEST_QUIET=1 OPENCLAW_LIVE_IMAGE_GENERATION_PROVIDERS=xai pnpm test:live -- test/image-generation.runtime.live.test.ts
```

ไฟล์ live แบบเฉพาะ provider จะสังเคราะห์ TTS ปกติ, PCM
TTS ที่เหมาะกับโทรศัพท์, ถอดเสียงผ่าน xAI batch STT, สตรีม PCM เดียวกันผ่าน xAI
realtime STT, สร้างผลลัพธ์ text-to-image และแก้ไขภาพอ้างอิง ส่วน
ไฟล์ live สำหรับภาพแบบใช้ร่วมกันจะตรวจ provider xAI ตัวเดียวกันผ่าน
การเลือกในรันไทม์ของ OpenClaw, fallback, normalization และเส้นทางไฟล์แนบสื่อ

## ที่เกี่ยวข้อง

<CardGroup cols={2}>
  <Card title="การเลือกโมเดล" href="/th/concepts/model-providers" icon="layers">
    การเลือก provider, model ref และพฤติกรรม failover
  </Card>
  <Card title="การสร้างวิดีโอ" href="/th/tools/video-generation" icon="video">
    พารามิเตอร์ของเครื่องมือวิดีโอที่ใช้ร่วมกันและการเลือก provider
  </Card>
  <Card title="ผู้ให้บริการทั้งหมด" href="/th/providers/index" icon="grid-2">
    ภาพรวม provider แบบกว้าง
  </Card>
  <Card title="การแก้ไขปัญหา" href="/th/help/troubleshooting" icon="wrench">
    ปัญหาที่พบบ่อยและวิธีแก้
  </Card>
</CardGroup>
