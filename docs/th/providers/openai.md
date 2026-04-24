---
read_when:
    - คุณต้องการใช้โมเดล OpenAI ใน OpenClaw
    - คุณต้องการใช้การยืนยันตัวตนแบบ Codex subscription แทน API keys
    - คุณต้องการพฤติกรรมการรันเอเจนต์ของ GPT-5 ที่เข้มงวดยิ่งขึ้น
summary: ใช้ OpenAI ผ่าน API keys หรือ Codex subscription ใน OpenClaw
title: OpenAI
x-i18n:
    generated_at: "2026-04-24T09:29:10Z"
    model: gpt-5.4
    provider: openai
    source_hash: 3d533338fa15d866bb69584706162ce099bb4a1edc9851183fb5442730ebdd9b
    source_path: providers/openai.md
    workflow: 15
---

OpenAI ให้บริการ developer APIs สำหรับโมเดล GPT โดย OpenClaw รองรับเส้นทางในตระกูล OpenAI อยู่ 3 แบบ ซึ่ง prefix ของโมเดลเป็นตัวเลือกเส้นทาง:

- **API key** — เข้าถึง OpenAI Platform โดยตรงพร้อมการคิดค่าบริการตามการใช้งาน (`openai/*` models)
- **Codex subscription ผ่าน PI** — ลงชื่อเข้าใช้ ChatGPT/Codex พร้อมการเข้าถึงผ่าน subscription (`openai-codex/*` models)
- **Codex app-server harness** — การรันแบบเนทีฟผ่าน Codex app-server (`openai/*` models ร่วมกับ `agents.defaults.embeddedHarness.runtime: "codex"`)

OpenAI รองรับการใช้ subscription OAuth ใน external tools และเวิร์กโฟลว์อย่าง OpenClaw อย่างชัดเจน

<Note>
ขณะนี้ GPT-5.5 ใช้งานใน OpenClaw ได้ผ่านเส้นทาง subscription/OAuth:
`openai-codex/gpt-5.5` กับ PI runner หรือ `openai/gpt-5.5` กับ
Codex app-server harness ส่วน direct API-key access สำหรับ `openai/gpt-5.5`
จะรองรับเมื่อ OpenAI เปิดใช้ GPT-5.5 บน public API; จนกว่าจะถึงตอนนั้นให้ใช้
โมเดลที่เปิดใช้ API แล้ว เช่น `openai/gpt-5.4` สำหรับการตั้งค่าแบบ `OPENAI_API_KEY`
</Note>

<Note>
การเปิดใช้ OpenAI plugin หรือการเลือกโมเดล `openai-codex/*` จะไม่
เปิด bundled Codex app-server plugin แอปนี้โดยอัตโนมัติ OpenClaw จะเปิด plugin นั้นก็ต่อเมื่อ
คุณเลือก native Codex harness อย่างชัดเจนด้วย
`embeddedHarness.runtime: "codex"` หรือใช้ legacy `codex/*` model ref
</Note>

## ความครอบคลุมฟีเจอร์ของ OpenClaw

| ความสามารถของ OpenAI     | พื้นผิวใน OpenClaw                                      | สถานะ                                                    |
| ------------------------- | ------------------------------------------------------- | -------------------------------------------------------- |
| Chat / Responses          | `openai/<model>` model provider                         | ใช่                                                      |
| Codex subscription models | `openai-codex/<model>` พร้อม `openai-codex` OAuth      | ใช่                                                      |
| Codex app-server harness  | `openai/<model>` พร้อม `embeddedHarness.runtime: codex` | ใช่                                                      |
| Server-side web search    | Native OpenAI Responses tool                            | ใช่ เมื่อเปิดใช้ web search และไม่ได้ตรึง provider ไว้ |
| Images                    | `image_generate`                                        | ใช่                                                      |
| Videos                    | `video_generate`                                        | ใช่                                                      |
| Text-to-speech            | `messages.tts.provider: "openai"` / `tts`               | ใช่                                                      |
| Batch speech-to-text      | `tools.media.audio` / media understanding               | ใช่                                                      |
| Streaming speech-to-text  | Voice Call `streaming.provider: "openai"`               | ใช่                                                      |
| Realtime voice            | Voice Call `realtime.provider: "openai"` / Control UI Talk | ใช่                                                   |
| Embeddings                | memory embedding provider                               | ใช่                                                      |

## เริ่มต้นใช้งาน

เลือกวิธี auth ที่คุณต้องการ แล้วทำตามขั้นตอนการตั้งค่า

<Tabs>
  <Tab title="API key (OpenAI Platform)">
    **เหมาะที่สุดสำหรับ:** การเข้าถึง API โดยตรงและการคิดค่าบริการตามการใช้งาน

    <Steps>
      <Step title="รับ API key ของคุณ">
        สร้างหรือคัดลอก API key จาก [OpenAI Platform dashboard](https://platform.openai.com/api-keys)
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
    |-----------|-------|------|
    | `openai/gpt-5.4` | Direct OpenAI Platform API | `OPENAI_API_KEY` |
    | `openai/gpt-5.4-mini` | Direct OpenAI Platform API | `OPENAI_API_KEY` |
    | `openai/gpt-5.5` | เส้นทาง direct API ในอนาคตเมื่อ OpenAI เปิดใช้ GPT-5.5 บน API | `OPENAI_API_KEY` |

    <Note>
    `openai/*` คือเส้นทาง direct OpenAI API-key เว้นแต่คุณจะบังคับ
    Codex app-server harness อย่างชัดเจน GPT-5.5 เองขณะนี้ยังเป็นแบบ subscription/OAuth
    เท่านั้น; ให้ใช้ `openai-codex/*` สำหรับ Codex OAuth ผ่าน PI runner ค่าเริ่มต้น
    </Note>

    ### ตัวอย่าง Config

    ```json5
    {
      env: { OPENAI_API_KEY: "sk-..." },
      agents: { defaults: { model: { primary: "openai/gpt-5.4" } } },
    }
    ```

    <Warning>
    OpenClaw **ไม่** เปิดเผย `openai/gpt-5.3-codex-spark` คำขอ OpenAI API แบบ live จะปฏิเสธโมเดลนั้น และ current Codex catalog เองก็ไม่เปิดเผยโมเดลนี้เช่นกัน
    </Warning>

  </Tab>

  <Tab title="Codex subscription">
    **เหมาะที่สุดสำหรับ:** ใช้ ChatGPT/Codex subscription ของคุณแทน API key แยก Codex cloud ต้องใช้การลงชื่อเข้าใช้ ChatGPT

    <Steps>
      <Step title="รัน Codex OAuth">
        ```bash
        openclaw onboard --auth-choice openai-codex
        ```

        หรือรัน OAuth โดยตรง:

        ```bash
        openclaw models auth login --provider openai-codex
        ```

        สำหรับการตั้งค่าแบบ headless หรือสภาพแวดล้อมที่ไม่เป็นมิตรกับ callback ให้เพิ่ม `--device-code` เพื่อลงชื่อเข้าใช้ด้วย ChatGPT device-code flow แทน localhost browser callback:

        ```bash
        openclaw models auth login --provider openai-codex --device-code
        ```
      </Step>
      <Step title="ตั้งค่าโมเดลเริ่มต้น">
        ```bash
        openclaw config set agents.defaults.model.primary openai-codex/gpt-5.5
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
    |-----------|-------|------|
    | `openai-codex/gpt-5.5` | ChatGPT/Codex OAuth ผ่าน PI | Codex sign-in |
    | `openai/gpt-5.5` + `embeddedHarness.runtime: "codex"` | Codex app-server harness | Codex app-server auth |

    <Note>
    ให้ใช้ provider id `openai-codex` ต่อไปสำหรับคำสั่ง auth/profile
    โดย prefix โมเดล `openai-codex/*` ก็เป็นเส้นทาง PI แบบชัดเจนสำหรับ Codex OAuth เช่นกัน
    มันไม่ได้เลือกหรือเปิด bundled Codex app-server harness อัตโนมัติ
    </Note>

    ### ตัวอย่าง Config

    ```json5
    {
      agents: { defaults: { model: { primary: "openai-codex/gpt-5.5" } } },
    }
    ```

    <Note>
    ตอนนี้ onboarding จะไม่นำเข้า OAuth material จาก `~/.codex` อีกต่อไป ให้ลงชื่อเข้าใช้ด้วย browser OAuth (ค่าเริ่มต้น) หรือ device-code flow ด้านบน — OpenClaw จะจัดการข้อมูลรับรองที่ได้ใน agent auth store ของตัวเอง
    </Note>

    ### ตัวบ่งชี้สถานะ

    แชต `/status` จะแสดง embedded harness ที่มีผลจริงสำหรับ
    เซสชันปัจจุบัน โดย PI harness ค่าเริ่มต้นจะแสดงเป็น `Runner: pi (embedded)` และ
    ไม่เพิ่ม badge แยกต่างหาก เมื่อ bundled Codex app-server harness ถูก
    เลือก `/status` จะต่อ non-PI harness id ต่อท้าย `Fast` เช่น
    `Fast · codex` เซสชันเดิมจะคง harness id ที่บันทึกไว้ ดังนั้นให้ใช้
    `/new` หรือ `/reset` หลังจากเปลี่ยน `embeddedHarness` หากคุณต้องการให้ `/status`
    สะท้อนการเลือก PI/Codex แบบใหม่

    ### เพดานหน้าต่างบริบท

    OpenClaw มอง model metadata และ runtime context cap เป็นคนละค่า

    สำหรับ `openai-codex/gpt-5.5` ผ่าน Codex OAuth:

    - Native `contextWindow`: `1000000`
    - ค่าเริ่มต้นของ runtime `contextTokens` cap: `272000`

    เพดานที่เล็กกว่านี้ให้ลักษณะ latency และคุณภาพที่ดีกว่าในทางปฏิบัติ กำหนดแทนได้ด้วย `contextTokens`:

    ```json5
    {
      models: {
        providers: {
          "openai-codex": {
            models: [{ id: "gpt-5.5", contextTokens: 160000 }],
          },
        },
      },
    }
    ```

    <Note>
    ใช้ `contextWindow` เพื่อประกาศ native model metadata ใช้ `contextTokens` เพื่อจำกัดงบประมาณ runtime context
    </Note>

  </Tab>
</Tabs>

## การสร้างภาพ

plugin `openai` ที่มาพร้อมกันจะลงทะเบียนการสร้างภาพผ่าน tool `image_generate`
โดยรองรับทั้งการสร้างภาพด้วย OpenAI API-key และการสร้างภาพด้วย Codex OAuth
ผ่าน model ref เดียวกันคือ `openai/gpt-image-2`

| Capability                | OpenAI API key                     | Codex OAuth                          |
| ------------------------- | ---------------------------------- | ------------------------------------ |
| Model ref                 | `openai/gpt-image-2`               | `openai/gpt-image-2`                 |
| Auth                      | `OPENAI_API_KEY`                   | OpenAI Codex OAuth sign-in           |
| Transport                 | OpenAI Images API                  | Codex Responses backend              |
| จำนวนภาพสูงสุดต่อคำขอ    | 4                                  | 4                                    |
| โหมดแก้ไข                | เปิดใช้ (สูงสุด 5 รูปอ้างอิง)      | เปิดใช้ (สูงสุด 5 รูปอ้างอิง)        |
| การกำหนดแทนขนาด          | รองรับ รวมถึงขนาด 2K/4K            | รองรับ รวมถึงขนาด 2K/4K              |
| อัตราส่วน/ความละเอียด    | ไม่ส่งต่อไปยัง OpenAI Images API   | แมปไปยังขนาดที่รองรับเมื่อปลอดภัย    |

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
ดู [Image Generation](/th/tools/image-generation) สำหรับพารามิเตอร์ของ tool แบบใช้ร่วมกัน การเลือก provider และพฤติกรรม failover
</Note>

`gpt-image-2` คือค่าเริ่มต้นสำหรับทั้งการสร้างภาพจากข้อความและการแก้ไขภาพของ OpenAI
`gpt-image-1` ยังคงใช้ได้เป็น explicit model override แต่เวิร์กโฟลว์ภาพของ OpenAI ใหม่ ๆ ควรใช้ `openai/gpt-image-2`

สำหรับการติดตั้งแบบ Codex OAuth ให้คง ref เดิมคือ `openai/gpt-image-2` เมื่อมี
การกำหนดค่า `openai-codex` OAuth profile ไว้ OpenClaw จะ resolve OAuth
access token ที่จัดเก็บไว้นั้นและส่งคำขอภาพผ่าน Codex Responses backend โดย
จะไม่ลอง `OPENAI_API_KEY` ก่อน และไม่ fallback ไปยัง API key แบบเงียบ ๆ สำหรับคำขอนั้น
ให้กำหนดค่า `models.providers.openai` อย่างชัดเจนด้วย API key,
custom base URL หรือ Azure endpoint เมื่อคุณต้องการใช้เส้นทาง OpenAI Images API โดยตรงแทน
หาก custom image endpoint นั้นอยู่บน trusted LAN/private address ให้ตั้ง
`browser.ssrfPolicy.dangerouslyAllowPrivateNetwork: true` ด้วย; OpenClaw ยังคง
บล็อก OpenAI-compatible image endpoints แบบ private/internal เว้นแต่จะมี opt-in นี้

สร้างภาพ:

```
/tool image_generate model=openai/gpt-image-2 prompt="A polished launch poster for OpenClaw on macOS" size=3840x2160 count=1
```

แก้ไขภาพ:

```
/tool image_generate model=openai/gpt-image-2 prompt="Preserve the object shape, change the material to translucent glass" image=/path/to/reference.png size=1024x1536
```

## การสร้างวิดีโอ

plugin `openai` ที่มาพร้อมกันจะลงทะเบียนการสร้างวิดีโอผ่าน tool `video_generate`

| Capability       | Value                                                                             |
| ---------------- | --------------------------------------------------------------------------------- |
| โมเดลเริ่มต้น    | `openai/sora-2`                                                                   |
| โหมด            | แปลงข้อความเป็นวิดีโอ, แปลงภาพเป็นวิดีโอ, แก้ไขวิดีโอเดี่ยว                     |
| อินพุตอ้างอิง    | 1 ภาพ หรือ 1 วิดีโอ                                                               |
| การกำหนดแทนขนาด | รองรับ                                                                            |
| การกำหนดแทนอื่น  | `aspectRatio`, `resolution`, `audio`, `watermark` จะถูกเพิกเฉยพร้อมคำเตือนจาก tool |

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
ดู [Video Generation](/th/tools/video-generation) สำหรับพารามิเตอร์ของ tool แบบใช้ร่วมกัน การเลือก provider และพฤติกรรม failover
</Note>

## GPT-5 prompt contribution

OpenClaw จะเพิ่ม GPT-5 prompt contribution แบบใช้ร่วมกันสำหรับการรันในตระกูล GPT-5 ข้าม providers โดยจะใช้ตาม model id ดังนั้น `openai-codex/gpt-5.5`, `openai/gpt-5.4`, `openrouter/openai/gpt-5.5`, `opencode/gpt-5.5` และ GPT-5 refs อื่น ๆ ที่เข้ากันได้จะได้รับ overlay ชุดเดียวกัน ส่วนโมเดล GPT-4.x ที่เก่ากว่าจะไม่ถูกนำไปรวม

bundled native Codex harness ใช้พฤติกรรม GPT-5 และ Heartbeat overlay แบบเดียวกันผ่าน Codex app-server developer instructions ดังนั้นเซสชัน `openai/gpt-5.x` ที่ถูกบังคับผ่าน `embeddedHarness.runtime: "codex"` จะยังคงมีคำแนะนำด้านการติดตามงานและ Heartbeat เชิงรุกเหมือนกัน แม้ Codex จะเป็นเจ้าของส่วนที่เหลือของ harness prompt

GPT-5 contribution จะเพิ่ม tagged behavior contract สำหรับ persona persistence, execution safety, tool discipline, output shape, completion checks และ verification ส่วนพฤติกรรมการตอบกลับและ silent-message เฉพาะ channel ยังคงอยู่ใน shared OpenClaw system prompt และ outbound delivery policy คำแนะนำ GPT-5 จะเปิดใช้งานเสมอสำหรับโมเดลที่ตรงเงื่อนไข ขณะที่ชั้น friendly interaction-style จะแยกออกมาต่างหากและกำหนดค่าได้

| Value                  | Effect                                      |
| ---------------------- | ------------------------------------------- |
| `"friendly"` (ค่าเริ่มต้น) | เปิดใช้ชั้น friendly interaction-style     |
| `"on"`                 | alias สำหรับ `"friendly"`                   |
| `"off"`                | ปิดเฉพาะชั้น friendly style เท่านั้น       |

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
ค่าต่าง ๆ ไม่สนตัวพิมพ์เล็กใหญ่ในขณะรันไทม์ ดังนั้น `"Off"` และ `"off"` ต่างก็ปิดชั้น friendly style ได้เหมือนกัน
</Tip>

<Note>
legacy `plugins.entries.openai.config.personality` ยังคงถูกอ่านเป็น compatibility fallback เมื่อยังไม่ได้ตั้งค่า `agents.defaults.promptOverlays.gpt5.personality` แบบใช้ร่วมกัน
</Note>

## Voice และ speech

<AccordionGroup>
  <Accordion title="Speech synthesis (TTS)">
    plugin `openai` ที่มาพร้อมกันจะลงทะเบียน speech synthesis ให้กับพื้นผิว `messages.tts`

    | Setting | Config path | Default |
    |---------|------------|---------|
    | Model | `messages.tts.providers.openai.model` | `gpt-4o-mini-tts` |
    | Voice | `messages.tts.providers.openai.voice` | `coral` |
    | Speed | `messages.tts.providers.openai.speed` | (unset) |
    | Instructions | `messages.tts.providers.openai.instructions` | (unset, `gpt-4o-mini-tts` เท่านั้น) |
    | Format | `messages.tts.providers.openai.responseFormat` | `opus` สำหรับ voice notes, `mp3` สำหรับไฟล์ |
    | API key | `messages.tts.providers.openai.apiKey` | fallback ไปที่ `OPENAI_API_KEY` |
    | Base URL | `messages.tts.providers.openai.baseUrl` | `https://api.openai.com/v1` |

    โมเดลที่มีให้ใช้: `gpt-4o-mini-tts`, `tts-1`, `tts-1-hd` ส่วนเสียงที่มีให้ใช้คือ `alloy`, `ash`, `ballad`, `cedar`, `coral`, `echo`, `fable`, `juniper`, `marin`, `onyx`, `nova`, `sage`, `shimmer`, `verse`

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
    ตั้ง `OPENAI_TTS_BASE_URL` เพื่อกำหนดแทน TTS base URL โดยไม่กระทบ chat API endpoint
    </Note>

  </Accordion>

  <Accordion title="Speech-to-text">
    plugin `openai` ที่มาพร้อมกันจะลงทะเบียน batch speech-to-text ผ่าน
    พื้นผิวการถอดเสียงของ media-understanding ใน OpenClaw

    - โมเดลเริ่มต้น: `gpt-4o-transcribe`
    - ปลายทาง: OpenAI REST `/v1/audio/transcriptions`
    - เส้นทางอินพุต: อัปโหลดไฟล์เสียงแบบ multipart
    - รองรับโดย OpenClaw ในทุกจุดที่การถอดเสียงขาเข้าใช้
      `tools.media.audio` รวมถึง Discord voice-channel segments และ channel
      audio attachments

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

    language และ prompt hints จะถูกส่งต่อไปยัง OpenAI เมื่อมีการให้มาจาก
    shared audio media config หรือคำขอการถอดเสียงแบบ per-call

  </Accordion>

  <Accordion title="Realtime transcription">
    plugin `openai` ที่มาพร้อมกันจะลงทะเบียน realtime transcription ให้กับ Voice Call plugin

    | Setting | Config path | Default |
    |---------|------------|---------|
    | Model | `plugins.entries.voice-call.config.streaming.providers.openai.model` | `gpt-4o-transcribe` |
    | Language | `...openai.language` | (unset) |
    | Prompt | `...openai.prompt` | (unset) |
    | Silence duration | `...openai.silenceDurationMs` | `800` |
    | VAD threshold | `...openai.vadThreshold` | `0.5` |
    | API key | `...openai.apiKey` | fallback ไปที่ `OPENAI_API_KEY` |

    <Note>
    ใช้การเชื่อมต่อ WebSocket ไปยัง `wss://api.openai.com/v1/realtime` พร้อมเสียงแบบ G.711 u-law (`g711_ulaw` / `audio/pcmu`) provider การสตรีมนี้มีไว้สำหรับเส้นทาง realtime transcription ของ Voice Call; ส่วน Discord voice ในปัจจุบันยังคงบันทึกเป็นช่วงสั้น ๆ และใช้เส้นทาง batch transcription ผ่าน `tools.media.audio`
    </Note>

  </Accordion>

  <Accordion title="Realtime voice">
    plugin `openai` ที่มาพร้อมกันจะลงทะเบียน realtime voice ให้กับ Voice Call plugin

    | Setting | Config path | Default |
    |---------|------------|---------|
    | Model | `plugins.entries.voice-call.config.realtime.providers.openai.model` | `gpt-realtime-1.5` |
    | Voice | `...openai.voice` | `alloy` |
    | Temperature | `...openai.temperature` | `0.8` |
    | VAD threshold | `...openai.vadThreshold` | `0.5` |
    | Silence duration | `...openai.silenceDurationMs` | `500` |
    | API key | `...openai.apiKey` | fallback ไปที่ `OPENAI_API_KEY` |

    <Note>
    รองรับ Azure OpenAI ผ่านคีย์ config `azureEndpoint` และ `azureDeployment` รองรับ bidirectional tool calling และใช้รูปแบบเสียง G.711 u-law
    </Note>

  </Accordion>
</AccordionGroup>

## ปลายทาง Azure OpenAI

provider `openai` ที่มาพร้อมกันสามารถกำหนดเป้าหมายไปยัง Azure OpenAI resource สำหรับการสร้างภาพ
โดยการกำหนดแทน base URL บนเส้นทางการสร้างภาพ OpenClaw จะ
ตรวจจับ Azure hostnames บน `models.providers.openai.baseUrl` และสลับไปใช้
รูปแบบคำขอของ Azure โดยอัตโนมัติ

<Note>
realtime voice ใช้เส้นทางการกำหนดค่าคนละชุด
(`plugins.entries.voice-call.config.realtime.providers.openai.azureEndpoint`)
และจะไม่ได้รับผลจาก `models.providers.openai.baseUrl` ดูที่แอคคอร์เดียน **Realtime
voice** ภายใต้ [Voice and speech](#voice-and-speech) สำหรับการตั้งค่า Azure ของมัน
</Note>

ใช้ Azure OpenAI เมื่อ:

- คุณมี Azure OpenAI subscription, quota หรือ enterprise agreement อยู่แล้ว
- คุณต้องการ regional data residency หรือ compliance controls ที่ Azure มีให้
- คุณต้องการให้ทราฟฟิกอยู่ภายใน Azure tenancy ที่มีอยู่แล้ว

### การกำหนดค่า

สำหรับการสร้างภาพผ่าน Azure ด้วย provider `openai` ที่มาพร้อมกัน ให้ชี้
`models.providers.openai.baseUrl` ไปยัง Azure resource ของคุณ และตั้ง `apiKey` เป็น
Azure OpenAI key (ไม่ใช่ OpenAI Platform key):

```json5
{
  models: {
    providers: {
      openai: {
        baseUrl: "https://<your-resource>.openai.azure.com",
        apiKey: "<azure-openai-api-key>",
      },
    },
  },
}
```

OpenClaw จะรู้จัก host suffixes ของ Azure ต่อไปนี้สำหรับเส้นทางการสร้างภาพของ Azure:

- `*.openai.azure.com`
- `*.services.ai.azure.com`
- `*.cognitiveservices.azure.com`

สำหรับคำขอสร้างภาพบน Azure host ที่รู้จัก OpenClaw จะ:

- ส่ง header `api-key` แทน `Authorization: Bearer`
- ใช้เส้นทางแบบ deployment-scoped (`/openai/deployments/{deployment}/...`)
- ต่อท้าย `?api-version=...` กับทุกคำขอ

base URLs แบบอื่น (public OpenAI, OpenAI-compatible proxies) จะคงรูปแบบคำขอภาพมาตรฐานของ OpenAI ไว้

<Note>
การกำหนดเส้นทาง Azure สำหรับเส้นทางการสร้างภาพของ provider `openai` ต้องใช้
OpenClaw 2026.4.22 หรือใหม่กว่า เวอร์ชันก่อนหน้านี้จะมอง
`openai.baseUrl` แบบกำหนดเองทุกค่าเหมือนปลายทาง OpenAI สาธารณะ และจะล้มเหลวเมื่อใช้กับ Azure
image deployments
</Note>

### API version

ตั้ง `AZURE_OPENAI_API_VERSION` เพื่อปักหมุด preview หรือ GA version เฉพาะ
สำหรับเส้นทางการสร้างภาพของ Azure:

```bash
export AZURE_OPENAI_API_VERSION="2024-12-01-preview"
```

ค่าเริ่มต้นคือ `2024-12-01-preview` เมื่อไม่ได้ตั้งตัวแปรนี้

### ชื่อโมเดลคือชื่อ deployment

Azure OpenAI ผูกโมเดลเข้ากับ deployments สำหรับคำขอสร้างภาพของ Azure ที่ถูกกำหนดเส้นทางผ่าน provider `openai` ที่มาพร้อมกัน ฟิลด์ `model` ใน OpenClaw
ต้องเป็น **ชื่อ deployment ของ Azure** ที่คุณกำหนดไว้ใน Azure portal ไม่ใช่
public OpenAI model id

หากคุณสร้าง deployment ชื่อ `gpt-image-2-prod` ที่ให้บริการ `gpt-image-2`:

```
/tool image_generate model=openai/gpt-image-2-prod prompt="A clean poster" size=1024x1024 count=1
```

กฎเรื่องชื่อ deployment แบบเดียวกันนี้ใช้กับการเรียก image-generation ที่ถูกกำหนดเส้นทางผ่าน provider `openai` ที่มาพร้อมกันด้วย

### ความพร้อมใช้งานตามภูมิภาค

ขณะนี้การสร้างภาพของ Azure มีให้ใช้เฉพาะบาง region
(เช่น `eastus2`, `swedencentral`, `polandcentral`, `westus3`,
`uaenorth`) ให้ตรวจสอบรายการ region ปัจจุบันของ Microsoft ก่อนสร้าง
deployment และยืนยันว่าโมเดลเฉพาะที่คุณต้องการมีใน region ของคุณ

### ความแตกต่างของพารามิเตอร์

Azure OpenAI และ OpenAI สาธารณะไม่ได้ยอมรับพารามิเตอร์ภาพชุดเดียวกันเสมอไป
Azure อาจปฏิเสธตัวเลือกที่ OpenAI สาธารณะอนุญาต (เช่นค่า `background`
บางค่าใน `gpt-image-2`) หรือเปิดใช้เฉพาะในบาง model versions เท่านั้น
ความแตกต่างเหล่านี้มาจาก Azure และโมเดลต้นทาง ไม่ใช่จาก
OpenClaw หากคำขอ Azure ล้มเหลวด้วย validation error ให้ตรวจสอบ
ชุดพารามิเตอร์ที่ deployment และ API version ของคุณรองรับใน
Azure portal

<Note>
Azure OpenAI ใช้ native transport และพฤติกรรม compat แต่จะไม่ได้รับ
hidden attribution headers ของ OpenClaw — ดูแอคคอร์เดียน **Native vs OpenAI-compatible
routes** ภายใต้ [Advanced configuration](#advanced-configuration)

สำหรับทราฟฟิก chat หรือ Responses บน Azure (นอกเหนือจากการสร้างภาพ) ให้ใช้
onboarding flow หรือ Azure provider config โดยเฉพาะ — `openai.baseUrl` เพียงอย่างเดียวไม่ทำให้
เกิด Azure API/auth shape โดยอัตโนมัติ มี provider
`azure-openai-responses/*` แยกต่างหาก; ดู
แอคคอร์เดียน Server-side compaction ด้านล่าง
</Note>

## การกำหนดค่าขั้นสูง

<AccordionGroup>
  <Accordion title="Transport (WebSocket vs SSE)">
    OpenClaw ใช้ WebSocket-first พร้อม SSE fallback (`"auto"`) สำหรับทั้ง `openai/*` และ `openai-codex/*`

    ในโหมด `"auto"`, OpenClaw จะ:
    - retry ความล้มเหลวของ WebSocket ช่วงต้นหนึ่งครั้งก่อน fallback ไป SSE
    - หลังความล้มเหลว จะทำเครื่องหมายว่า WebSocket degraded ประมาณ 60 วินาทีและใช้ SSE ระหว่างช่วง cool-down
    - แนบ stable session และ turn identity headers สำหรับ retries และ reconnects
    - normalize usage counters (`input_tokens` / `prompt_tokens`) ข้าม transport variants

    | Value | Behavior |
    |-------|----------|
    | `"auto"` (ค่าเริ่มต้น) | WebSocket ก่อน, SSE fallback |
    | `"sse"` | บังคับใช้ SSE เท่านั้น |
    | `"websocket"` | บังคับใช้ WebSocket เท่านั้น |

    ```json5
    {
      agents: {
        defaults: {
          models: {
            "openai/gpt-5.4": {
              params: { transport: "auto" },
            },
            "openai-codex/gpt-5.5": {
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

  <Accordion title="WebSocket warm-up">
    OpenClaw เปิดใช้ WebSocket warm-up โดยค่าเริ่มต้นสำหรับ `openai/*` และ `openai-codex/*` เพื่อลด first-turn latency

    ```json5
    // ปิด warm-up
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

  <Accordion title="Fast mode">
    OpenClaw เปิดเผยตัวสลับ fast-mode แบบใช้ร่วมกันสำหรับ `openai/*` และ `openai-codex/*`:

    - **Chat/UI:** `/fast status|on|off`
    - **Config:** `agents.defaults.models["<provider>/<model>"].params.fastMode`

    เมื่อเปิดใช้งาน OpenClaw จะแมป fast mode ไปยัง OpenAI priority processing (`service_tier = "priority"`) โดยค่า `service_tier` ที่มีอยู่เดิมจะยังคงถูกเก็บไว้ และ fast mode จะไม่เขียน `reasoning` หรือ `text.verbosity` ใหม่

    ```json5
    {
      agents: {
        defaults: {
          models: {
            "openai/gpt-5.4": { params: { fastMode: true } },
          },
        },
      },
    }
    ```

    <Note>
    session overrides มีลำดับความสำคัญเหนือ config การล้าง session override ใน Sessions UI จะทำให้เซสชันกลับไปใช้ค่าเริ่มต้นตาม config
    </Note>

  </Accordion>

  <Accordion title="Priority processing (service_tier)">
    API ของ OpenAI เปิดเผย priority processing ผ่าน `service_tier` คุณสามารถตั้งค่านี้รายโมเดลใน OpenClaw ได้:

    ```json5
    {
      agents: {
        defaults: {
          models: {
            "openai/gpt-5.4": { params: { serviceTier: "priority" } },
          },
        },
      },
    }
    ```

    ค่าที่รองรับ: `auto`, `default`, `flex`, `priority`

    <Warning>
    `serviceTier` จะถูกส่งต่อเฉพาะไปยังปลายทาง OpenAI แบบเนทีฟ (`api.openai.com`) และปลายทาง Codex แบบเนทีฟ (`chatgpt.com/backend-api`) เท่านั้น หากคุณกำหนดเส้นทาง provider ใด provider หนึ่งผ่านพร็อกซี OpenClaw จะไม่แตะต้อง `service_tier`
    </Warning>

  </Accordion>

  <Accordion title="Server-side compaction (Responses API)">
    สำหรับ direct OpenAI Responses models (`openai/*` บน `api.openai.com`), Pi-harness stream wrapper ของ OpenAI plugin จะเปิดใช้ server-side compaction อัตโนมัติ:

    - บังคับ `store: true` (เว้นแต่ model compat จะตั้ง `supportsStore: false`)
    - inject `context_management: [{ type: "compaction", compact_threshold: ... }]`
    - ค่าเริ่มต้นของ `compact_threshold`: 70% ของ `contextWindow` (หรือ `80000` เมื่อไม่มีข้อมูล)

    สิ่งนี้ใช้กับเส้นทาง Pi harness ที่มีมาในตัว และกับ OpenAI provider hooks ที่ใช้โดย embedded runs ส่วน native Codex app-server harness จะจัดการ context ของตัวเองผ่าน Codex และกำหนดค่าแยกต่างหากผ่าน `agents.defaults.embeddedHarness.runtime`

    <Tabs>
      <Tab title="เปิดใช้แบบชัดเจน">
        มีประโยชน์สำหรับปลายทางที่เข้ากันได้ เช่น Azure OpenAI Responses:

        ```json5
        {
          agents: {
            defaults: {
              models: {
                "azure-openai-responses/gpt-5.5": {
                  params: { responsesServerCompaction: true },
                },
              },
            },
          },
        }
        ```
      </Tab>
      <Tab title="Threshold แบบกำหนดเอง">
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
    `responsesServerCompaction` ควบคุมเฉพาะการ inject `context_management` เท่านั้น ส่วน direct OpenAI Responses models ยังคงบังคับ `store: true` เว้นแต่ compat จะตั้ง `supportsStore: false`
    </Note>

  </Accordion>

  <Accordion title="Strict-agentic GPT mode">
    สำหรับการรันในตระกูล GPT-5 บน `openai/*`, OpenClaw สามารถใช้สัญญาการรันแบบฝังที่เข้มงวดยิ่งขึ้นได้:

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
    - ไม่ถือว่าเทิร์นที่มีแต่แผนเป็นความคืบหน้าที่สำเร็จอีกต่อไปเมื่อมี action ของ tool ให้ใช้
    - retry เทิร์นนั้นอีกครั้งพร้อมคำชี้นำให้ลงมือทำทันที
    - เปิดใช้ `update_plan` อัตโนมัติสำหรับงานที่มีสาระสำคัญ
    - แสดงสถานะ blocked แบบชัดเจน หากโมเดลยังคงวางแผนโดยไม่ลงมือทำ

    <Note>
    จำกัดขอบเขตเฉพาะการรันในตระกูล GPT-5 ของ OpenAI และ Codex เท่านั้น ส่วน providers อื่นและโมเดลตระกูลเก่ากว่าจะยังคงใช้พฤติกรรมเริ่มต้น
    </Note>

  </Accordion>

  <Accordion title="Native vs OpenAI-compatible routes">
    OpenClaw ปฏิบัติต่อปลายทาง OpenAI, Codex และ Azure OpenAI แบบเนทีฟ แตกต่างจากพร็อกซี `/v1` แบบ OpenAI-compatible ทั่วไป:

    **Native routes** (`openai/*`, Azure OpenAI):
    - คง `reasoning: { effort: "none" }` ไว้เฉพาะสำหรับโมเดลที่รองรับ OpenAI `none` effort
    - ละ reasoning ที่ปิดอยู่สำหรับโมเดลหรือพร็อกซีที่ปฏิเสธ `reasoning.effort: "none"`
    - ตั้งค่า tool schemas ให้ strict mode โดยค่าเริ่มต้น
    - แนบ hidden attribution headers เฉพาะบน native hosts ที่ผ่านการยืนยันเท่านั้น
    - คง OpenAI-only request shaping (`service_tier`, `store`, reasoning-compat, prompt-cache hints)

    **Proxy/compatible routes:**
    - ใช้พฤติกรรม compat ที่ผ่อนคลายกว่า
    - ไม่บังคับ strict tool schemas หรือ native-only headers

    Azure OpenAI ใช้ native transport และพฤติกรรม compat แต่จะไม่ได้รับ hidden attribution headers

  </Accordion>
</AccordionGroup>

## ที่เกี่ยวข้อง

<CardGroup cols={2}>
  <Card title="การเลือกโมเดล" href="/th/concepts/model-providers" icon="layers">
    การเลือก providers, model refs และพฤติกรรม failover
  </Card>
  <Card title="การสร้างภาพ" href="/th/tools/image-generation" icon="image">
    พารามิเตอร์ของ image tool แบบใช้ร่วมกันและการเลือก provider
  </Card>
  <Card title="การสร้างวิดีโอ" href="/th/tools/video-generation" icon="video">
    พารามิเตอร์ของ video tool แบบใช้ร่วมกันและการเลือก provider
  </Card>
  <Card title="OAuth และ auth" href="/th/gateway/authentication" icon="key">
    รายละเอียด auth และกฎการใช้ข้อมูลรับรองซ้ำ
  </Card>
</CardGroup>
