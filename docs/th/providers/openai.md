---
read_when:
    - คุณต้องการใช้โมเดล OpenAI ใน OpenClaw
    - คุณต้องการใช้การยืนยันตัวตนแบบการสมัคร Codex แทน API key
    - คุณต้องการพฤติกรรมการทำงานของเอเจนต์ GPT-5 ที่เข้มงวดยิ่งขึ้น
summary: ใช้ OpenAI ผ่าน API key หรือการสมัคร Codex ใน OpenClaw
title: OpenAI
x-i18n:
    generated_at: "2026-04-23T05:52:22Z"
    model: gpt-5.4
    provider: openai
    source_hash: 775a937680731ff09181dd58d2be1ca1a751c9193ac299ba6657266490a6a9b7
    source_path: providers/openai.md
    workflow: 15
---

  # OpenAI

  OpenAI ให้ API สำหรับนักพัฒนาเพื่อใช้งานโมเดล GPT OpenClaw รองรับเส้นทาง auth สองแบบ:

  - **API key** — เข้าถึง OpenAI Platform โดยตรงพร้อมการคิดค่าบริการตามการใช้งาน (`openai/*` models)
  - **การสมัคร Codex** — ลงชื่อเข้าใช้ ChatGPT/Codex พร้อมการเข้าถึงผ่านการสมัคร (`openai-codex/*` models)

  OpenAI รองรับการใช้งาน subscription OAuth ในเครื่องมือและเวิร์กโฟลว์ภายนอกอย่าง OpenClaw อย่างชัดเจน

  ## ความครอบคลุมของความสามารถใน OpenClaw

  | ความสามารถของ OpenAI     | พื้นผิวใน OpenClaw                        | สถานะ                                                    |
  | ------------------------- | ----------------------------------------- | -------------------------------------------------------- |
  | Chat / Responses          | model provider `openai/<model>`           | ใช่                                                      |
  | โมเดลการสมัคร Codex      | model provider `openai-codex/<model>`     | ใช่                                                      |
  | Server-side web search    | เครื่องมือ Native OpenAI Responses        | ใช่ เมื่อเปิดใช้ web search และไม่มีการ pin provider      |
  | Images                    | `image_generate`                          | ใช่                                                      |
  | Videos                    | `video_generate`                          | ใช่                                                      |
  | Text-to-speech            | `messages.tts.provider: "openai"` / `tts` | ใช่                                                      |
  | Batch speech-to-text      | `tools.media.audio` / media understanding | ใช่                                                      |
  | Streaming speech-to-text  | Voice Call `streaming.provider: "openai"` | ใช่                                                      |
  | Realtime voice            | Voice Call `realtime.provider: "openai"`  | ใช่                                                      |
  | Embeddings                | memory embedding provider                 | ใช่                                                      |

  ## เริ่มต้นใช้งาน

  เลือกวิธียืนยันตัวตนที่คุณต้องการ แล้วทำตามขั้นตอนการตั้งค่า

  <Tabs>
  <Tab title="API key (OpenAI Platform)">
    **เหมาะที่สุดสำหรับ:** การเข้าถึง API โดยตรงและการคิดค่าบริการตามการใช้งาน

    <Steps>
      <Step title="รับ API key ของคุณ">
        สร้างหรือคัดลอก API key จาก [แดชบอร์ด OpenAI Platform](https://platform.openai.com/api-keys)
      </Step>
      <Step title="รัน onboarding">
        ```bash
        openclaw onboard --auth-choice openai-api-key
        ```

        หรือส่ง key โดยตรง:

        ```bash
        openclaw onboard --openai-api-key "$OPENAI_API_KEY"
        ```
      </Step>
      <Step title="ตรวจสอบว่าโมเดลพร้อมใช้งาน">
        ```bash
        openclaw models list --provider openai
        ```
      </Step>
    </Steps>

    ### สรุปเส้นทาง

    | Model ref | เส้นทาง | Auth |
    |-----------|---------|------|
    | `openai/gpt-5.4` | Direct OpenAI Platform API | `OPENAI_API_KEY` |
    | `openai/gpt-5.4-pro` | Direct OpenAI Platform API | `OPENAI_API_KEY` |

    <Note>
    การลงชื่อเข้าใช้ ChatGPT/Codex จะถูกกำหนดเส้นทางผ่าน `openai-codex/*` ไม่ใช่ `openai/*`
    </Note>

    ### ตัวอย่าง config

    ```json5
    {
      env: { OPENAI_API_KEY: "sk-..." },
      agents: { defaults: { model: { primary: "openai/gpt-5.4" } } },
    }
    ```

    <Warning>
    OpenClaw **ไม่** เปิดเผย `openai/gpt-5.3-codex-spark` บนเส้นทาง direct API คำขอ OpenAI API จริงจะปฏิเสธโมเดลนี้ Spark ใช้ได้เฉพาะกับ Codex เท่านั้น
    </Warning>

  </Tab>

  <Tab title="การสมัคร Codex">
    **เหมาะที่สุดสำหรับ:** ใช้การสมัคร ChatGPT/Codex ของคุณแทน API key แยกต่างหาก Codex cloud ต้องใช้การลงชื่อเข้าใช้ ChatGPT

    <Steps>
      <Step title="รัน Codex OAuth">
        ```bash
        openclaw onboard --auth-choice openai-codex
        ```

        หรือรัน OAuth โดยตรง:

        ```bash
        openclaw models auth login --provider openai-codex
        ```
      </Step>
      <Step title="ตั้งค่าโมเดลเริ่มต้น">
        ```bash
        openclaw config set agents.defaults.model.primary openai-codex/gpt-5.4
        ```
      </Step>
      <Step title="ตรวจสอบว่าโมเดลพร้อมใช้งาน">
        ```bash
        openclaw models list --provider openai-codex
        ```
      </Step>
    </Steps>

    ### สรุปเส้นทาง

    | Model ref | เส้นทาง | Auth |
    |-----------|---------|------|
    | `openai-codex/gpt-5.4` | ChatGPT/Codex OAuth | การลงชื่อเข้าใช้ Codex |
    | `openai-codex/gpt-5.3-codex-spark` | ChatGPT/Codex OAuth | การลงชื่อเข้าใช้ Codex (ขึ้นอยู่กับ entitlement) |

    <Note>
    เส้นทางนี้แยกจาก `openai/gpt-5.4` โดยตั้งใจ ใช้ `openai/*` กับ API key สำหรับการเข้าถึง Platform โดยตรง และใช้ `openai-codex/*` สำหรับการเข้าถึงผ่านการสมัคร Codex
    </Note>

    ### ตัวอย่าง config

    ```json5
    {
      agents: { defaults: { model: { primary: "openai-codex/gpt-5.4" } } },
    }
    ```

    <Tip>
    หาก onboarding นำการล็อกอิน Codex CLI ที่มีอยู่กลับมาใช้ ข้อมูลรับรองเหล่านั้นจะยังคงถูกจัดการโดย Codex CLI เมื่อหมดอายุ OpenClaw จะอ่านแหล่ง Codex ภายนอกใหม่ก่อน และเขียนข้อมูลรับรองที่รีเฟรชแล้วกลับไปยังที่เก็บของ Codex
    </Tip>

    ### เพดาน context window

    OpenClaw ถือว่า metadata ของโมเดลและเพดานบริบทขณะรันไทม์เป็นคนละค่า

    สำหรับ `openai-codex/gpt-5.4`:

    - `contextWindow` แบบ native: `1050000`
    - เพดาน `contextTokens` ขณะรันไทม์เริ่มต้น: `272000`

    เพดานเริ่มต้นที่เล็กกว่านี้ให้ latency และคุณภาพที่ดีกว่าในทางปฏิบัติ คุณสามารถ override ได้ด้วย `contextTokens`:

    ```json5
    {
      models: {
        providers: {
          "openai-codex": {
            models: [{ id: "gpt-5.4", contextTokens: 160000 }],
          },
        },
      },
    }
    ```

    <Note>
    ใช้ `contextWindow` เพื่อประกาศ metadata แบบ native ของโมเดล ใช้ `contextTokens` เพื่อจำกัดงบประมาณบริบทขณะรันไทม์
    </Note>

  </Tab>
</Tabs>

## การสร้างภาพ

Plugin `openai` ที่มากับระบบจะลงทะเบียนการสร้างภาพผ่านเครื่องมือ `image_generate`

| ความสามารถ                | ค่า                                  |
| ------------------------- | ------------------------------------ |
| โมเดลเริ่มต้น             | `openai/gpt-image-2`                 |
| จำนวนภาพสูงสุดต่อคำขอ     | 4                                    |
| โหมดแก้ไข                 | เปิดใช้ (สูงสุด 5 ภาพอ้างอิง)        |
| การ override ขนาด         | รองรับ รวมถึงขนาด 2K/4K              |
| อัตราส่วนภาพ / ความละเอียด | จะไม่ถูกส่งต่อไปยัง OpenAI Images API |

```json5
{
  agents: {
    defaults: {
      imageGenerationModel: { primary: "openai/gpt-image-2" },
    },
  },
}
```

<Note>
ดู [Image Generation](/th/tools/image-generation) สำหรับพารามิเตอร์ของเครื่องมือที่ใช้ร่วมกัน การเลือก provider และพฤติกรรม failover
</Note>

`gpt-image-2` เป็นค่าเริ่มต้นทั้งสำหรับการสร้างภาพจากข้อความของ OpenAI และการแก้ไขภาพ
`gpt-image-1` ยังคงใช้งานได้เมื่อ override โมเดลอย่างชัดเจน แต่เวิร์กโฟลว์ภาพใหม่ของ OpenAI
ควรใช้ `openai/gpt-image-2`

สร้างภาพ:

```
/tool image_generate model=openai/gpt-image-2 prompt="A polished launch poster for OpenClaw on macOS" size=3840x2160 count=1
```

แก้ไขภาพ:

```
/tool image_generate model=openai/gpt-image-2 prompt="Preserve the object shape, change the material to translucent glass" image=/path/to/reference.png size=1024x1536
```

## การสร้างวิดีโอ

Plugin `openai` ที่มากับระบบจะลงทะเบียนการสร้างวิดีโอผ่านเครื่องมือ `video_generate`

| ความสามารถ       | ค่า                                                                              |
| ---------------- | -------------------------------------------------------------------------------- |
| โมเดลเริ่มต้น    | `openai/sora-2`                                                                  |
| โหมด             | Text-to-video, image-to-video, single-video edit                                 |
| อินพุตอ้างอิง    | 1 ภาพ หรือ 1 วิดีโอ                                                              |
| การ override ขนาด | รองรับ                                                                           |
| การ override อื่น | `aspectRatio`, `resolution`, `audio`, `watermark` จะถูกละเลยพร้อมคำเตือนจากเครื่องมือ |

```json5
{
  agents: {
    defaults: {
      videoGenerationModel: { primary: "openai/sora-2" },
    },
  },
}
```

<Note>
ดู [Video Generation](/th/tools/video-generation) สำหรับพารามิเตอร์ของเครื่องมือที่ใช้ร่วมกัน การเลือก provider และพฤติกรรม failover
</Note>

## ส่วนเสริมพรอมป์ของ GPT-5

OpenClaw เพิ่มส่วนเสริมพรอมป์ GPT-5 แบบใช้ร่วมกันสำหรับการรันตระกูล GPT-5 ข้าม provider โดยใช้ตาม model id ดังนั้น `openai/gpt-5.4`, `openai-codex/gpt-5.4`, `openrouter/openai/gpt-5.4`, `opencode/gpt-5.4` และ ref ของ GPT-5 ที่เข้ากันได้อื่น ๆ จะได้รับ overlay เดียวกัน ส่วนโมเดล GPT-4.x ที่เก่ากว่าจะไม่ได้รับ

provider ของ native Codex harness ที่มากับระบบ (`codex/*`) ใช้พฤติกรรม GPT-5 และ Heartbeat overlay เดียวกันผ่านคำสั่งนักพัฒนาของ Codex app-server ดังนั้นเซสชัน `codex/gpt-5.x` จะยังคงมีคำแนะนำเรื่องการติดตามงานให้ครบและ Heartbeat เชิงรุกแบบเดียวกัน แม้ Codex จะเป็นเจ้าของพรอมป์ส่วนอื่นของ harness

ส่วนเสริม GPT-5 จะเพิ่มสัญญาพฤติกรรมแบบมีแท็กสำหรับการคงบุคลิก ความปลอดภัยในการดำเนินการ วินัยในการใช้เครื่องมือ รูปแบบของเอาต์พุต การตรวจสอบความสมบูรณ์ และการตรวจยืนยัน พฤติกรรมการตอบกลับเฉพาะช่องทางและพฤติกรรมข้อความเงียบยังคงอยู่ใน system prompt แบบใช้ร่วมกันของ OpenClaw และนโยบายการส่งขาออก คำแนะนำของ GPT-5 จะเปิดใช้อยู่เสมอสำหรับโมเดลที่ตรงกัน ส่วนเลเยอร์สไตล์การโต้ตอบที่เป็นมิตรจะแยกออกมาและกำหนดค่าได้

| ค่า                    | ผลลัพธ์                                      |
| ---------------------- | -------------------------------------------- |
| `"friendly"` (ค่าเริ่มต้น) | เปิดใช้เลเยอร์สไตล์การโต้ตอบที่เป็นมิตร      |
| `"on"`                 | alias ของ `"friendly"`                       |
| `"off"`                | ปิดเฉพาะเลเยอร์สไตล์ที่เป็นมิตร             |

<Tabs>
  <Tab title="Config">
    ```json5
    {
      agents: {
        defaults: {
          promptOverlays: {
            gpt5: { personality: "friendly" },
          },
        },
      },
    }
    ```
  </Tab>
  <Tab title="CLI">
    ```bash
    openclaw config set agents.defaults.promptOverlays.gpt5.personality off
    ```
  </Tab>
</Tabs>

<Tip>
ค่าจะไม่สนตัวพิมพ์เล็ก/ใหญ่ขณะรันไทม์ ดังนั้น `"Off"` และ `"off"` ต่างก็ปิดเลเยอร์สไตล์ที่เป็นมิตรได้เหมือนกัน
</Tip>

<Note>
ยังคงอ่าน `plugins.entries.openai.config.personality` แบบเดิมเป็น fallback เพื่อความเข้ากันได้ เมื่อยังไม่ได้ตั้งค่าร่วม `agents.defaults.promptOverlays.gpt5.personality`
</Note>

## เสียงและคำพูด

<AccordionGroup>
  <Accordion title="การสังเคราะห์เสียงพูด (TTS)">
    Plugin `openai` ที่มากับระบบจะลงทะเบียนการสังเคราะห์เสียงพูดสำหรับพื้นผิว `messages.tts`

    | การตั้งค่า | พาธ config | ค่าเริ่มต้น |
    |-----------|------------|-------------|
    | โมเดล | `messages.tts.providers.openai.model` | `gpt-4o-mini-tts` |
    | เสียง | `messages.tts.providers.openai.voice` | `coral` |
    | ความเร็ว | `messages.tts.providers.openai.speed` | (ไม่ได้ตั้งค่า) |
    | คำสั่ง | `messages.tts.providers.openai.instructions` | (ไม่ได้ตั้งค่า, ใช้ได้กับ `gpt-4o-mini-tts` เท่านั้น) |
    | รูปแบบ | `messages.tts.providers.openai.responseFormat` | `opus` สำหรับ voice note, `mp3` สำหรับไฟล์ |
    | API key | `messages.tts.providers.openai.apiKey` | fallback ไปที่ `OPENAI_API_KEY` |
    | Base URL | `messages.tts.providers.openai.baseUrl` | `https://api.openai.com/v1` |

    โมเดลที่ใช้ได้: `gpt-4o-mini-tts`, `tts-1`, `tts-1-hd` เสียงที่ใช้ได้: `alloy`, `ash`, `ballad`, `cedar`, `coral`, `echo`, `fable`, `juniper`, `marin`, `onyx`, `nova`, `sage`, `shimmer`, `verse`

    ```json5
    {
      messages: {
        tts: {
          providers: {
            openai: { model: "gpt-4o-mini-tts", voice: "coral" },
          },
        },
      },
    }
    ```

    <Note>
    ตั้ง `OPENAI_TTS_BASE_URL` เพื่อ override base URL ของ TTS โดยไม่กระทบ endpoint ของ chat API
    </Note>

  </Accordion>

  <Accordion title="Speech-to-text">
    Plugin `openai` ที่มากับระบบจะลงทะเบียน batch speech-to-text ผ่าน
    พื้นผิวการถอดเสียงของ media-understanding ของ OpenClaw

    - โมเดลเริ่มต้น: `gpt-4o-transcribe`
    - Endpoint: OpenAI REST `/v1/audio/transcriptions`
    - พาธอินพุต: การอัปโหลดไฟล์เสียงแบบ multipart
    - รองรับโดย OpenClaw ทุกที่ที่การถอดเสียงขาเข้าใช้
      `tools.media.audio` รวมถึงส่วนเสียงจากช่องทางเสียงของ Discord และไฟล์แนบเสียงของช่องทาง

    หากต้องการบังคับใช้ OpenAI สำหรับการถอดเสียงขาเข้า:

    ```json5
    {
      tools: {
        media: {
          audio: {
            models: [
              {
                type: "provider",
                provider: "openai",
                model: "gpt-4o-transcribe",
              },
            ],
          },
        },
      },
    }
    ```

    คำใบ้เรื่องภาษาและพรอมป์จะถูกส่งต่อไปยัง OpenAI เมื่อมีการระบุจาก
    config สื่อเสียงแบบใช้ร่วมกันหรือคำขอการถอดเสียงต่อครั้ง

  </Accordion>

  <Accordion title="การถอดเสียงแบบเรียลไทม์">
    Plugin `openai` ที่มากับระบบจะลงทะเบียนการถอดเสียงแบบเรียลไทม์สำหรับ Plugin Voice Call

    | การตั้งค่า | พาธ config | ค่าเริ่มต้น |
    |---------|------------|-------------|
    | โมเดล | `plugins.entries.voice-call.config.streaming.providers.openai.model` | `gpt-4o-transcribe` |
    | ภาษา | `...openai.language` | (ไม่ได้ตั้งค่า) |
    | พรอมป์ | `...openai.prompt` | (ไม่ได้ตั้งค่า) |
    | ระยะเวลาเงียบ | `...openai.silenceDurationMs` | `800` |
    | เกณฑ์ VAD | `...openai.vadThreshold` | `0.5` |
    | API key | `...openai.apiKey` | fallback ไปที่ `OPENAI_API_KEY` |

    <Note>
    ใช้การเชื่อมต่อ WebSocket ไปยัง `wss://api.openai.com/v1/realtime` พร้อมเสียงแบบ G.711 u-law (`g711_ulaw` / `audio/pcmu`) provider แบบสตรีมนี้มีไว้สำหรับพาธการถอดเสียงแบบเรียลไทม์ของ Voice Call; ปัจจุบัน Discord voice จะอัดเป็นส่วนสั้น ๆ แล้วใช้พาธการถอดเสียงแบบ batch ของ `tools.media.audio` แทน
    </Note>

  </Accordion>

  <Accordion title="เสียงแบบเรียลไทม์">
    Plugin `openai` ที่มากับระบบจะลงทะเบียนเสียงแบบเรียลไทม์สำหรับ Plugin Voice Call

    | การตั้งค่า | พาธ config | ค่าเริ่มต้น |
    |---------|------------|-------------|
    | โมเดล | `plugins.entries.voice-call.config.realtime.providers.openai.model` | `gpt-realtime` |
    | เสียง | `...openai.voice` | `alloy` |
    | อุณหภูมิ | `...openai.temperature` | `0.8` |
    | เกณฑ์ VAD | `...openai.vadThreshold` | `0.5` |
    | ระยะเวลาเงียบ | `...openai.silenceDurationMs` | `500` |
    | API key | `...openai.apiKey` | fallback ไปที่ `OPENAI_API_KEY` |

    <Note>
    รองรับ Azure OpenAI ผ่านคีย์ config `azureEndpoint` และ `azureDeployment` รองรับการเรียกใช้เครื่องมือแบบสองทาง ใช้รูปแบบเสียง G.711 u-law
    </Note>

  </Accordion>
</AccordionGroup>

## การกำหนดค่าขั้นสูง

<AccordionGroup>
  <Accordion title="ทรานสปอร์ต (WebSocket เทียบกับ SSE)">
    OpenClaw ใช้ WebSocket ก่อน พร้อม fallback เป็น SSE (`"auto"`) สำหรับทั้ง `openai/*` และ `openai-codex/*`

    ในโหมด `"auto"`, OpenClaw จะ:
    - ลองใหม่หนึ่งครั้งเมื่อ WebSocket ล้มเหลวในช่วงต้นก่อน fallback ไปยัง SSE
    - หลังเกิดความล้มเหลว จะทำเครื่องหมาย WebSocket ว่า degraded ประมาณ 60 วินาที และใช้ SSE ระหว่างช่วง cool-down
    - แนบ header ตัวตนของเซสชันและเทิร์นที่คงที่สำหรับการ retry และ reconnect
    - ทำให้ตัวนับการใช้งาน (`input_tokens` / `prompt_tokens`) เป็นมาตรฐานข้ามรูปแบบทรานสปอร์ต

    | ค่า | พฤติกรรม |
    |-----|----------|
    | `"auto"` (ค่าเริ่มต้น) | WebSocket ก่อน, fallback เป็น SSE |
    | `"sse"` | บังคับใช้ SSE เท่านั้น |
    | `"websocket"` | บังคับใช้ WebSocket เท่านั้น |

    ```json5
    {
      agents: {
        defaults: {
          models: {
            "openai-codex/gpt-5.4": {
              params: { transport: "auto" },
            },
          },
        },
      },
    }
    ```

    เอกสาร OpenAI ที่เกี่ยวข้อง:
    - [Realtime API with WebSocket](https://platform.openai.com/docs/guides/realtime-websocket)
    - [Streaming API responses (SSE)](https://platform.openai.com/docs/guides/streaming-responses)

  </Accordion>

  <Accordion title="การอุ่นเครื่อง WebSocket">
    OpenClaw เปิดใช้การอุ่นเครื่อง WebSocket โดยค่าเริ่มต้นสำหรับ `openai/*` เพื่อลด latency ของเทิร์นแรก

    ```json5
    // ปิดการอุ่นเครื่อง
    {
      agents: {
        defaults: {
          models: {
            "openai/gpt-5.4": {
              params: { openaiWsWarmup: false },
            },
          },
        },
      },
    }
    ```

  </Accordion>

  <Accordion title="โหมดเร็ว">
    OpenClaw เปิดเผยสวิตช์โหมดเร็วแบบใช้ร่วมกันสำหรับทั้ง `openai/*` และ `openai-codex/*`:

    - **แชต/UI:** `/fast status|on|off`
    - **Config:** `agents.defaults.models["<provider>/<model>"].params.fastMode`

    เมื่อเปิดใช้ OpenClaw จะ map โหมดเร็วไปยังการประมวลผลแบบ priority ของ OpenAI (`service_tier = "priority"`) ค่า `service_tier` ที่มีอยู่จะถูกคงไว้ และโหมดเร็วจะไม่เขียนทับ `reasoning` หรือ `text.verbosity`

    ```json5
    {
      agents: {
        defaults: {
          models: {
            "openai/gpt-5.4": { params: { fastMode: true } },
            "openai-codex/gpt-5.4": { params: { fastMode: true } },
          },
        },
      },
    }
    ```

    <Note>
    การ override ระดับเซสชันมีลำดับเหนือกว่า config การล้าง session override ใน Sessions UI จะทำให้เซสชันกลับไปใช้ค่าเริ่มต้นที่กำหนดไว้
    </Note>

  </Accordion>

  <Accordion title="Priority processing (`service_tier`)">
    API ของ OpenAI เปิดเผยการประมวลผลแบบ priority ผ่าน `service_tier` ตั้งค่าต่อโมเดลใน OpenClaw ได้ดังนี้:

    ```json5
    {
      agents: {
        defaults: {
          models: {
            "openai/gpt-5.4": { params: { serviceTier: "priority" } },
            "openai-codex/gpt-5.4": { params: { serviceTier: "priority" } },
          },
        },
      },
    }
    ```

    ค่าที่รองรับ: `auto`, `default`, `flex`, `priority`

    <Warning>
    `serviceTier` จะถูกส่งต่อเฉพาะไปยัง endpoint ของ OpenAI native (`api.openai.com`) และ endpoint ของ Codex native (`chatgpt.com/backend-api`) หากคุณกำหนดเส้นทาง provider ตัวใดผ่าน proxy, OpenClaw จะปล่อย `service_tier` ไว้ตามเดิม
    </Warning>

  </Accordion>

  <Accordion title="Compaction ฝั่งเซิร์ฟเวอร์ (Responses API)">
    สำหรับโมเดล OpenAI Responses โดยตรง (`openai/*` บน `api.openai.com`), OpenClaw จะเปิดใช้ Compaction ฝั่งเซิร์ฟเวอร์อัตโนมัติ:

    - บังคับ `store: true` (เว้นแต่ compat ของโมเดลจะตั้ง `supportsStore: false`)
    - ฉีด `context_management: [{ type: "compaction", compact_threshold: ... }]`
    - ค่าเริ่มต้นของ `compact_threshold`: 70% ของ `contextWindow` (หรือ `80000` เมื่อไม่มีค่า)

    <Tabs>
      <Tab title="เปิดใช้แบบชัดเจน">
        มีประโยชน์สำหรับ endpoint ที่เข้ากันได้ เช่น Azure OpenAI Responses:

        ```json5
        {
          agents: {
            defaults: {
              models: {
                "azure-openai-responses/gpt-5.4": {
                  params: { responsesServerCompaction: true },
                },
              },
            },
          },
        }
        ```
      </Tab>
      <Tab title="threshold แบบกำหนดเอง">
        ```json5
        {
          agents: {
            defaults: {
              models: {
                "openai/gpt-5.4": {
                  params: {
                    responsesServerCompaction: true,
                    responsesCompactThreshold: 120000,
                  },
                },
              },
            },
          },
        }
        ```
      </Tab>
      <Tab title="ปิดใช้งาน">
        ```json5
        {
          agents: {
            defaults: {
              models: {
                "openai/gpt-5.4": {
                  params: { responsesServerCompaction: false },
                },
              },
            },
          },
        }
        ```
      </Tab>
    </Tabs>

    <Note>
    `responsesServerCompaction` ควบคุมเฉพาะการฉีด `context_management` เท่านั้น โมเดล OpenAI Responses โดยตรงยังคงบังคับ `store: true` เว้นแต่ compat จะตั้ง `supportsStore: false`
    </Note>

  </Accordion>

  <Accordion title="โหมด GPT แบบ strict-agentic">
    สำหรับการรันตระกูล GPT-5 บน `openai/*` และ `openai-codex/*`, OpenClaw สามารถใช้สัญญาการดำเนินการแบบ embedded ที่เข้มงวดกว่าได้:

    ```json5
    {
      agents: {
        defaults: {
          embeddedPi: { executionContract: "strict-agentic" },
        },
      },
    }
    ```

    เมื่อใช้ `strict-agentic`, OpenClaw จะ:
    - ไม่ถือว่าเทิร์นที่มีแต่แผนเป็นความคืบหน้าที่สำเร็จอีกต่อไป เมื่อมีการกระทำผ่านเครื่องมือให้ใช้ได้
    - ลองเทิร์นนั้นใหม่พร้อมการชี้นำให้ลงมือทันที
    - เปิดใช้ `update_plan` อัตโนมัติสำหรับงานที่มีสาระสำคัญ
    - แสดงสถานะ blocked แบบชัดเจน หากโมเดลยังคงวางแผนโดยไม่ลงมือทำ

    <Note>
    จำกัดเฉพาะการรันตระกูล GPT-5 ของ OpenAI และ Codex เท่านั้น provider อื่นและตระกูลโมเดลที่เก่ากว่าจะยังคงใช้พฤติกรรมเริ่มต้น
    </Note>

  </Accordion>

  <Accordion title="เส้นทางแบบ native เทียบกับ OpenAI-compatible">
    OpenClaw ปฏิบัติต่อ endpoint ของ OpenAI โดยตรง, Codex และ Azure OpenAI แตกต่างจาก proxy `/v1` แบบ OpenAI-compatible ทั่วไป:

    **เส้นทางแบบ native** (`openai/*`, `openai-codex/*`, Azure OpenAI):
    - คง `reasoning: { effort: "none" }` ไว้เฉพาะสำหรับโมเดลที่รองรับ `none` effort ของ OpenAI
    - ละ reasoning ที่ปิดใช้งานแล้วสำหรับโมเดลหรือ proxy ที่ปฏิเสธ `reasoning.effort: "none"`
    - ตั้งค่า schema ของเครื่องมือเป็น strict mode โดยค่าเริ่มต้น
    - แนบ header ระบุที่มาที่ซ่อนอยู่บนโฮสต์ native ที่ตรวจสอบแล้วเท่านั้น
    - คงการจัดรูปคำขอเฉพาะ OpenAI (`service_tier`, `store`, reasoning-compat, prompt-cache hint)

    **เส้นทางแบบ proxy/compatible:**
    - ใช้พฤติกรรม compat ที่ผ่อนกว่่า
    - ไม่บังคับ schema ของเครื่องมือแบบ strict หรือ header แบบ native-only

    Azure OpenAI ใช้ทรานสปอร์ตและพฤติกรรม compat แบบ native แต่จะไม่ได้รับ hidden attribution header

  </Accordion>
</AccordionGroup>

## ที่เกี่ยวข้อง

<CardGroup cols={2}>
  <Card title="การเลือกโมเดล" href="/th/concepts/model-providers" icon="layers">
    การเลือก provider, model ref และพฤติกรรม failover
  </Card>
  <Card title="การสร้างภาพ" href="/th/tools/image-generation" icon="image">
    พารามิเตอร์ของเครื่องมือภาพแบบใช้ร่วมกันและการเลือก provider
  </Card>
  <Card title="การสร้างวิดีโอ" href="/th/tools/video-generation" icon="video">
    พารามิเตอร์ของเครื่องมือวิดีโอแบบใช้ร่วมกันและการเลือก provider
  </Card>
  <Card title="OAuth และ auth" href="/th/gateway/authentication" icon="key">
    รายละเอียดของ auth และกฎการใช้ข้อมูลรับรองซ้ำ
  </Card>
</CardGroup>
