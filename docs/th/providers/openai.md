---
read_when:
    - คุณต้องการใช้โมเดล OpenAI ใน OpenClaw
    - คุณต้องการใช้การยืนยันตัวตนด้วยการสมัครใช้งาน Codex แทนคีย์ API
    - คุณต้องการพฤติกรรมการทำงานของเอเจนต์ GPT-5 ที่เข้มงวดมากขึ้น
summary: ใช้ OpenAI ผ่านคีย์ API หรือการสมัครใช้งาน Codex ใน OpenClaw
title: OpenAI
x-i18n:
    generated_at: "2026-04-23T13:58:20Z"
    model: gpt-5.4
    provider: openai
    source_hash: ac42660234e1971440f6de3b04adb1d3a1fddca20219fb68936c36e4c2f95265
    source_path: providers/openai.md
    workflow: 15
---

  # OpenAI

  OpenAI มี API สำหรับนักพัฒนาสำหรับโมเดล GPT OpenClaw รองรับการยืนยันตัวตน 2 รูปแบบ:

  - **คีย์ API** — เข้าถึง OpenAI Platform โดยตรงพร้อมการคิดค่าบริการตามการใช้งาน (`openai/*` models)
  - **การสมัครใช้งาน Codex** — ลงชื่อเข้าใช้ ChatGPT/Codex พร้อมสิทธิ์การเข้าถึงตามการสมัครใช้งาน (`openai-codex/*` models)

  OpenAI รองรับการใช้งาน subscription OAuth ในเครื่องมือภายนอกและเวิร์กโฟลว์อย่าง OpenClaw อย่างชัดเจน

  ## ความครอบคลุมของฟีเจอร์ใน OpenClaw

  | ความสามารถของ OpenAI      | พื้นที่ใน OpenClaw                        | สถานะ                                                   |
  | ------------------------- | ----------------------------------------- | ------------------------------------------------------ |
  | แชต / Responses          | ผู้ให้บริการโมเดล `openai/<model>`           | ใช่                                                    |
  | โมเดลการสมัครใช้งาน Codex | ผู้ให้บริการโมเดล `openai-codex/<model>`     | ใช่                                                    |
  | การค้นหาเว็บฝั่งเซิร์ฟเวอร์ | เครื่องมือ OpenAI Responses แบบเนทีฟ          | ใช่ เมื่อเปิดใช้การค้นหาเว็บและไม่ได้ปักหมุด provider |
  | รูปภาพ                    | `image_generate`                          | ใช่                                                    |
  | วิดีโอ                    | `video_generate`                          | ใช่                                                    |
  | การแปลงข้อความเป็นเสียง   | `messages.tts.provider: "openai"` / `tts` | ใช่                                                    |
  | การแปลงเสียงเป็นข้อความแบบแบตช์ | `tools.media.audio` / media understanding | ใช่                                                    |
  | การแปลงเสียงเป็นข้อความแบบสตรีมมิง | Voice Call `streaming.provider: "openai"` | ใช่                                                    |
  | เสียงแบบเรียลไทม์          | Voice Call `realtime.provider: "openai"`  | ใช่                                                    |
  | Embeddings                | ผู้ให้บริการ memory embedding             | ใช่                                                    |

  ## เริ่มต้นใช้งาน

  เลือกวิธีการยืนยันตัวตนที่คุณต้องการ แล้วทำตามขั้นตอนการตั้งค่า

  <Tabs>
  <Tab title="คีย์ API (OpenAI Platform)">
    **เหมาะสำหรับ:** การเข้าถึง API โดยตรงและการคิดค่าบริการตามการใช้งาน

    <Steps>
      <Step title="รับคีย์ API ของคุณ">
        สร้างหรือคัดลอกคีย์ API จาก [แดชบอร์ด OpenAI Platform](https://platform.openai.com/api-keys)
      </Step>
      <Step title="เรียกใช้ onboarding">
        ```bash
        openclaw onboard --auth-choice openai-api-key
        ```

        หรือส่งคีย์โดยตรง:

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

    | Model ref | Route | Auth |
    |-----------|-------|------|
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
    OpenClaw **ไม่** เปิดให้ใช้ `openai/gpt-5.3-codex-spark` บนเส้นทาง direct API คำขอ OpenAI API จริงจะปฏิเสธโมเดลนั้น Spark ใช้งานได้เฉพาะกับ Codex เท่านั้น
    </Warning>

  </Tab>

  <Tab title="การสมัครใช้งาน Codex">
    **เหมาะสำหรับ:** ใช้การสมัครใช้งาน ChatGPT/Codex ของคุณแทนคีย์ API แยกต่างหาก Codex cloud ต้องใช้การลงชื่อเข้าใช้ ChatGPT

    <Steps>
      <Step title="เรียกใช้ Codex OAuth">
        ```bash
        openclaw onboard --auth-choice openai-codex
        ```

        หรือเรียกใช้ OAuth โดยตรง:

        ```bash
        openclaw models auth login --provider openai-codex
        ```

        สำหรับการตั้งค่าแบบ headless หรือแบบที่ไม่เหมาะกับ callback ให้เพิ่ม `--device-code` เพื่อลงชื่อเข้าใช้ด้วยโฟลว์ device-code ของ ChatGPT แทน localhost browser callback:

        ```bash
        openclaw models auth login --provider openai-codex --device-code
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

    | Model ref | Route | Auth |
    |-----------|-------|------|
    | `openai-codex/gpt-5.4` | ChatGPT/Codex OAuth | การลงชื่อเข้าใช้ Codex |
    | `openai-codex/gpt-5.3-codex-spark` | ChatGPT/Codex OAuth | การลงชื่อเข้าใช้ Codex (ขึ้นอยู่กับ entitlement) |

    <Note>
    เส้นทางนี้แยกจาก `openai/gpt-5.4` โดยตั้งใจ ใช้ `openai/*` กับคีย์ API สำหรับการเข้าถึง Platform โดยตรง และใช้ `openai-codex/*` สำหรับการเข้าถึงผ่านการสมัครใช้งาน Codex
    </Note>

    ### ตัวอย่าง config

    ```json5
    {
      agents: { defaults: { model: { primary: "openai-codex/gpt-5.4" } } },
    }
    ```

    <Note>
    Onboarding จะไม่ import ข้อมูล OAuth จาก `~/.codex` อีกต่อไป ให้ลงชื่อเข้าใช้ด้วย browser OAuth (ค่าเริ่มต้น) หรือโฟลว์ device-code ด้านบน — OpenClaw จะจัดการข้อมูลรับรองที่ได้ในที่เก็บการยืนยันตัวตนของเอเจนต์ของตัวเอง
    </Note>

    ### เพดาน context window

    OpenClaw จัดการข้อมูลเมตาของโมเดลและเพดาน context ระหว่างรันไทม์เป็นคนละค่า

    สำหรับ `openai-codex/gpt-5.4`:

    - `contextWindow` แบบเนทีฟ: `1050000`
    - เพดาน `contextTokens` ระหว่างรันไทม์เริ่มต้น: `272000`

    เพดานเริ่มต้นที่เล็กกว่านี้ให้คุณลักษณะด้านเวลาแฝงและคุณภาพที่ดีกว่าในทางปฏิบัติ แทนที่ค่าได้ด้วย `contextTokens`:

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
    ใช้ `contextWindow` เพื่อประกาศข้อมูลเมตาเนทีฟของโมเดล ใช้ `contextTokens` เพื่อจำกัดงบประมาณ context ระหว่างรันไทม์
    </Note>

  </Tab>
</Tabs>

## การสร้างภาพ

Plugin `openai` ที่มาพร้อมกันจะลงทะเบียนการสร้างภาพผ่านเครื่องมือ `image_generate`

| ความสามารถ                | ค่า                                 |
| ------------------------- | ---------------------------------- |
| โมเดลเริ่มต้น             | `openai/gpt-image-2`               |
| จำนวนภาพสูงสุดต่อคำขอ    | 4                                  |
| โหมดแก้ไข                 | เปิดใช้งาน (อ้างอิงภาพได้สูงสุด 5 ภาพ) |
| การแทนที่ขนาด            | รองรับ รวมถึงขนาด 2K/4K           |
| อัตราส่วนภาพ / ความละเอียด | ไม่ส่งต่อไปยัง OpenAI Images API |

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
ดู [การสร้างภาพ](/th/tools/image-generation) สำหรับพารามิเตอร์เครื่องมือที่ใช้ร่วมกัน การเลือก provider และพฤติกรรม failover
</Note>

`gpt-image-2` เป็นค่าเริ่มต้นสำหรับทั้งการสร้างภาพจากข้อความของ OpenAI และการแก้ไขภาพ ส่วน `gpt-image-1` ยังคงใช้งานได้เมื่อระบุเป็นการแทนที่โมเดลแบบชัดเจน แต่เวิร์กโฟลว์ภาพใหม่ของ OpenAI ควรใช้ `openai/gpt-image-2`

สร้าง:

```
/tool image_generate model=openai/gpt-image-2 prompt="โปสเตอร์เปิดตัว OpenClaw บน macOS ที่ดูประณีต" size=3840x2160 count=1
```

แก้ไข:

```
/tool image_generate model=openai/gpt-image-2 prompt="คงรูปทรงของวัตถุไว้ เปลี่ยนวัสดุเป็นกระจกโปร่งแสง" image=/path/to/reference.png size=1024x1536
```

## การสร้างวิดีโอ

Plugin `openai` ที่มาพร้อมกันจะลงทะเบียนการสร้างวิดีโอผ่านเครื่องมือ `video_generate`

| ความสามารถ       | ค่า                                                                                |
| ---------------- | --------------------------------------------------------------------------------- |
| โมเดลเริ่มต้น    | `openai/sora-2`                                                                   |
| โหมด            | ข้อความเป็นวิดีโอ, ภาพเป็นวิดีโอ, แก้ไขวิดีโอเดี่ยว                                  |
| อินพุตอ้างอิง    | 1 ภาพ หรือ 1 วิดีโอ                                                                |
| การแทนที่ขนาด   | รองรับ                                                                             |
| การแทนที่อื่นๆ   | `aspectRatio`, `resolution`, `audio`, `watermark` จะถูกละเว้นพร้อมคำเตือนจากเครื่องมือ |

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
ดู [การสร้างวิดีโอ](/th/tools/video-generation) สำหรับพารามิเตอร์เครื่องมือที่ใช้ร่วมกัน การเลือก provider และพฤติกรรม failover
</Note>

## การเพิ่มพรอมป์สำหรับ GPT-5

OpenClaw เพิ่มการเพิ่มพรอมป์ GPT-5 ที่ใช้ร่วมกันสำหรับการรันตระกูล GPT-5 ข้าม providers โดยจะนำไปใช้ตาม id ของโมเดล ดังนั้น `openai/gpt-5.4`, `openai-codex/gpt-5.4`, `openrouter/openai/gpt-5.4`, `opencode/gpt-5.4` และ ref ของ GPT-5 ที่เข้ากันได้อื่นๆ จะได้รับ overlay เดียวกัน ส่วนโมเดล GPT-4.x รุ่นเก่าจะไม่ได้รับ

provider native Codex harness (`codex/*`) ที่มาพร้อมกันใช้พฤติกรรม GPT-5 เดียวกันและ Heartbeat overlay ผ่านคำสั่งนักพัฒนาใน Codex app-server ดังนั้นเซสชัน `codex/gpt-5.x` จะยังคงมีแนวทางการติดตามงานต่อเนื่องและ Heartbeat เชิงรุกแบบเดียวกัน แม้ว่า Codex จะเป็นผู้ควบคุมพรอมป์ส่วนที่เหลือของ harness

การเพิ่มพรอมป์ GPT-5 จะเพิ่มสัญญาพฤติกรรมแบบติดแท็กสำหรับการคงบุคลิก การทำงานอย่างปลอดภัย วินัยในการใช้เครื่องมือ รูปแบบผลลัพธ์ การตรวจสอบความสมบูรณ์ และการยืนยันผล พฤติกรรมการตอบกลับและข้อความเงียบที่เฉพาะกับช่องทางยังคงอยู่ใน system prompt ที่ใช้ร่วมกันของ OpenClaw และนโยบายการส่งออกข้อความ การแนะนำสำหรับ GPT-5 จะเปิดใช้งานเสมอสำหรับโมเดลที่ตรงกัน ส่วนเลเยอร์รูปแบบการโต้ตอบแบบเป็นมิตรนั้นแยกออกมาต่างหากและกำหนดค่าได้

| ค่า                    | ผลลัพธ์                                      |
| ---------------------- | ------------------------------------------- |
| `"friendly"` (ค่าเริ่มต้น) | เปิดใช้เลเยอร์รูปแบบการโต้ตอบแบบเป็นมิตร |
| `"on"`                 | ชื่อแทนของ `"friendly"`                      |
| `"off"`                | ปิดเฉพาะเลเยอร์สไตล์แบบเป็นมิตร            |

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
ค่าต่างๆ ไม่สนตัวพิมพ์เล็ก-ใหญ่ในระหว่างรันไทม์ ดังนั้นทั้ง `"Off"` และ `"off"` จะปิดเลเยอร์สไตล์แบบเป็นมิตร
</Tip>

<Note>
ระบบยังคงอ่าน `plugins.entries.openai.config.personality` แบบเดิมเป็น fallback เพื่อความเข้ากันได้ เมื่อไม่ได้ตั้งค่า `agents.defaults.promptOverlays.gpt5.personality` ที่ใช้ร่วมกัน
</Note>

## เสียงและคำพูด

<AccordionGroup>
  <Accordion title="การสังเคราะห์เสียงพูด (TTS)">
    Plugin `openai` ที่มาพร้อมกันจะลงทะเบียนการสังเคราะห์เสียงพูดสำหรับพื้นที่ `messages.tts`

    | การตั้งค่า | เส้นทาง config | ค่าเริ่มต้น |
    |---------|------------|---------|
    | โมเดล | `messages.tts.providers.openai.model` | `gpt-4o-mini-tts` |
    | เสียง | `messages.tts.providers.openai.voice` | `coral` |
    | ความเร็ว | `messages.tts.providers.openai.speed` | (ไม่ได้ตั้งค่า) |
    | คำสั่ง | `messages.tts.providers.openai.instructions` | (ไม่ได้ตั้งค่า, เฉพาะ `gpt-4o-mini-tts`) |
    | รูปแบบ | `messages.tts.providers.openai.responseFormat` | `opus` สำหรับบันทึกเสียง, `mp3` สำหรับไฟล์ |
    | คีย์ API | `messages.tts.providers.openai.apiKey` | fallback ไปที่ `OPENAI_API_KEY` |
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
    ตั้งค่า `OPENAI_TTS_BASE_URL` เพื่อแทนที่ TTS base URL โดยไม่กระทบ endpoint ของ chat API
    </Note>

  </Accordion>

  <Accordion title="การแปลงเสียงเป็นข้อความ">
    Plugin `openai` ที่มาพร้อมกันจะลงทะเบียนการแปลงเสียงเป็นข้อความแบบแบตช์ผ่าน
    พื้นที่การถอดเสียง media-understanding ของ OpenClaw

    - โมเดลเริ่มต้น: `gpt-4o-transcribe`
    - Endpoint: OpenAI REST `/v1/audio/transcriptions`
    - เส้นทางอินพุต: อัปโหลดไฟล์เสียงแบบ multipart
    - รองรับโดย OpenClaw ในทุกที่ที่การถอดเสียงจากเสียงขาเข้าใช้
      `tools.media.audio` รวมถึงส่วนเสียงของช่องเสียง Discord และ
      ไฟล์แนบเสียงของช่องทางต่างๆ

    หากต้องการบังคับใช้ OpenAI สำหรับการถอดเสียงจากเสียงขาเข้า:

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

    คำใบ้ด้านภาษาและพรอมป์จะถูกส่งต่อไปยัง OpenAI เมื่อมีการระบุผ่าน
    config เสียงมีเดียที่ใช้ร่วมกัน หรือคำขอถอดเสียงรายครั้ง

  </Accordion>

  <Accordion title="การถอดเสียงแบบเรียลไทม์">
    Plugin `openai` ที่มาพร้อมกันจะลงทะเบียนการถอดเสียงแบบเรียลไทม์สำหรับ Plugin Voice Call

    | การตั้งค่า | เส้นทาง config | ค่าเริ่มต้น |
    |---------|------------|---------|
    | โมเดล | `plugins.entries.voice-call.config.streaming.providers.openai.model` | `gpt-4o-transcribe` |
    | ภาษา | `...openai.language` | (ไม่ได้ตั้งค่า) |
    | พรอมป์ | `...openai.prompt` | (ไม่ได้ตั้งค่า) |
    | ระยะเวลาความเงียบ | `...openai.silenceDurationMs` | `800` |
    | ค่า VAD threshold | `...openai.vadThreshold` | `0.5` |
    | คีย์ API | `...openai.apiKey` | fallback ไปที่ `OPENAI_API_KEY` |

    <Note>
    ใช้การเชื่อมต่อ WebSocket ไปยัง `wss://api.openai.com/v1/realtime` พร้อมเสียงรูปแบบ G.711 u-law (`g711_ulaw` / `audio/pcmu`) provider การสตรีมนี้ใช้สำหรับเส้นทางการถอดเสียงแบบเรียลไทม์ของ Voice Call ส่วน Discord voice ในปัจจุบันจะบันทึกเป็นช่วงสั้นๆ และใช้เส้นทางการถอดเสียงแบบแบตช์ `tools.media.audio` แทน
    </Note>

  </Accordion>

  <Accordion title="เสียงแบบเรียลไทม์">
    Plugin `openai` ที่มาพร้อมกันจะลงทะเบียนเสียงแบบเรียลไทม์สำหรับ Plugin Voice Call

    | การตั้งค่า | เส้นทาง config | ค่าเริ่มต้น |
    |---------|------------|---------|
    | โมเดล | `plugins.entries.voice-call.config.realtime.providers.openai.model` | `gpt-realtime` |
    | เสียง | `...openai.voice` | `alloy` |
    | Temperature | `...openai.temperature` | `0.8` |
    | ค่า VAD threshold | `...openai.vadThreshold` | `0.5` |
    | ระยะเวลาความเงียบ | `...openai.silenceDurationMs` | `500` |
    | คีย์ API | `...openai.apiKey` | fallback ไปที่ `OPENAI_API_KEY` |

    <Note>
    รองรับ Azure OpenAI ผ่านคีย์ config `azureEndpoint` และ `azureDeployment` รองรับการเรียกใช้เครื่องมือแบบสองทิศทาง ใช้รูปแบบเสียง G.711 u-law
    </Note>

  </Accordion>
</AccordionGroup>

## endpoint ของ Azure OpenAI

provider `openai` ที่มาพร้อมกันสามารถกำหนดเป้าหมายไปยัง resource ของ Azure OpenAI สำหรับการสร้างภาพ
ได้โดยการแทนที่ base URL ในเส้นทางการสร้างภาพ OpenClaw
จะตรวจจับ hostname ของ Azure บน `models.providers.openai.baseUrl` และสลับไปใช้
รูปแบบคำขอของ Azure โดยอัตโนมัติ

<Note>
เสียงแบบเรียลไทม์ใช้เส้นทาง config แยกต่างหาก
(`plugins.entries.voice-call.config.realtime.providers.openai.azureEndpoint`)
และไม่ได้รับผลจาก `models.providers.openai.baseUrl` โปรดดูหัวข้อ **เสียงแบบเรียลไทม์**
ใต้ [เสียงและคำพูด](#voice-and-speech) สำหรับการตั้งค่า Azure ของฟีเจอร์นี้
</Note>

ใช้ Azure OpenAI เมื่อ:

- คุณมีการสมัครใช้งาน Azure OpenAI, quota หรือข้อตกลงระดับองค์กรอยู่แล้ว
- คุณต้องการการคงอยู่ของข้อมูลตามภูมิภาคหรือการควบคุมด้าน compliance ที่ Azure มีให้
- คุณต้องการให้ทราฟฟิกอยู่ภายใน tenancy ของ Azure ที่มีอยู่เดิม

### การกำหนดค่า

สำหรับการสร้างภาพผ่าน Azure โดยใช้ provider `openai` ที่มาพร้อมกัน ให้ชี้
`models.providers.openai.baseUrl` ไปที่ resource Azure ของคุณ และตั้งค่า `apiKey` เป็น
คีย์ Azure OpenAI (ไม่ใช่คีย์ OpenAI Platform):

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

OpenClaw รู้จัก suffix ของโฮสต์ Azure เหล่านี้สำหรับเส้นทางการสร้างภาพบน Azure:

- `*.openai.azure.com`
- `*.services.ai.azure.com`
- `*.cognitiveservices.azure.com`

สำหรับคำขอสร้างภาพบนโฮสต์ Azure ที่ระบบรู้จัก OpenClaw จะ:

- ส่ง header `api-key` แทน `Authorization: Bearer`
- ใช้เส้นทางแบบ deployment-scoped (`/openai/deployments/{deployment}/...`)
- ต่อท้าย `?api-version=...` ในแต่ละคำขอ

base URL อื่นๆ (OpenAI สาธารณะ, proxy ที่เข้ากันได้กับ OpenAI) จะยังคงใช้
รูปแบบคำขอภาพมาตรฐานของ OpenAI

<Note>
การกำหนดเส้นทาง Azure สำหรับเส้นทางการสร้างภาพของ provider `openai`
ต้องใช้ OpenClaw 2026.4.22 หรือใหม่กว่า เวอร์ชันก่อนหน้านั้นจะมองว่า
`openai.baseUrl` แบบกำหนดเองทั้งหมดเป็น endpoint สาธารณะของ OpenAI และจะล้มเหลวกับ deployment
ภาพบน Azure
</Note>

### เวอร์ชัน API

ตั้งค่า `AZURE_OPENAI_API_VERSION` เพื่อปักหมุดเวอร์ชัน preview หรือ GA ของ Azure แบบเฉพาะ
สำหรับเส้นทางการสร้างภาพบน Azure:

```bash
export AZURE_OPENAI_API_VERSION="2024-12-01-preview"
```

ค่าเริ่มต้นคือ `2024-12-01-preview` เมื่อไม่ได้ตั้งค่าตัวแปรนี้

### ชื่อโมเดลคือชื่อ deployment

Azure OpenAI ผูกโมเดลเข้ากับ deployment สำหรับคำขอสร้างภาพบน Azure
ที่ถูกกำหนดเส้นทางผ่าน provider `openai` ที่มาพร้อมกัน ฟิลด์ `model` ใน OpenClaw
ต้องเป็น **ชื่อ deployment ของ Azure** ที่คุณกำหนดในพอร์ทัล Azure ไม่ใช่
id โมเดลสาธารณะของ OpenAI

หากคุณสร้าง deployment ชื่อ `gpt-image-2-prod` ที่ให้บริการ `gpt-image-2`:

```
/tool image_generate model=openai/gpt-image-2-prod prompt="โปสเตอร์ที่สะอาดตา" size=1024x1024 count=1
```

กฎเรื่องชื่อ deployment เดียวกันนี้ใช้กับการเรียกสร้างภาพ
ที่ถูกกำหนดเส้นทางผ่าน provider `openai` ที่มาพร้อมกันเช่นกัน

### ความพร้อมใช้งานตามภูมิภาค

ปัจจุบันการสร้างภาพบน Azure ใช้งานได้เฉพาะในบางภูมิภาคเท่านั้น
(เช่น `eastus2`, `swedencentral`, `polandcentral`, `westus3`,
`uaenorth`) โปรดตรวจสอบรายการภูมิภาคล่าสุดของ Microsoft ก่อนสร้าง
deployment และยืนยันว่าโมเดลที่ต้องการมีให้ใช้ในภูมิภาคของคุณ

### ความแตกต่างของพารามิเตอร์

Azure OpenAI และ OpenAI สาธารณะไม่ได้ยอมรับพารามิเตอร์ภาพเหมือนกันเสมอไป
Azure อาจปฏิเสธตัวเลือกที่ OpenAI สาธารณะยอมรับได้ (เช่นค่า `background`
บางค่าใน `gpt-image-2`) หรือเปิดให้ใช้ได้เฉพาะในบางเวอร์ชันของโมเดลเท่านั้น
ความแตกต่างเหล่านี้มาจาก Azure และโมเดลพื้นฐาน ไม่ใช่ OpenClaw
หากคำขอ Azure ล้มเหลวด้วยข้อผิดพลาดการตรวจสอบความถูกต้อง ให้ตรวจสอบ
ชุดพารามิเตอร์ที่ deployment และเวอร์ชัน API เฉพาะของคุณรองรับใน
พอร์ทัล Azure

<Note>
Azure OpenAI ใช้การขนส่งแบบเนทีฟและพฤติกรรม compat แต่จะไม่ได้รับ
header attribution แบบซ่อนของ OpenClaw โปรดดูหัวข้อ **เส้นทางแบบเนทีฟเทียบกับแบบเข้ากันได้กับ OpenAI**
ใต้ [การกำหนดค่าขั้นสูง](#advanced-configuration)
สำหรับรายละเอียด
</Note>

<Tip>
สำหรับ provider Azure OpenAI Responses แบบแยกต่างหาก (ต่างจาก provider `openai`)
โปรดดู model ref `azure-openai-responses/*` ในหัวข้อ
[Compaction ฝั่งเซิร์ฟเวอร์](#server-side-compaction-responses-api)
</Tip>

<Note>
ทราฟฟิก Azure chat และ Responses ต้องใช้ config provider/API แบบเฉพาะของ Azure เพิ่มเติม
นอกเหนือจากการแทนที่ base URL หากคุณต้องการเรียกใช้โมเดล Azure นอกเหนือจากการ
สร้างภาพ ให้ใช้โฟลว์ onboarding หรือ config provider ที่ตั้งค่า
รูปแบบ Azure API/auth ที่เหมาะสม แทนการสมมติว่า `openai.baseUrl` เพียงอย่างเดียวเพียงพอ
</Note>

## การกำหนดค่าขั้นสูง

<AccordionGroup>
  <Accordion title="การขนส่ง (WebSocket เทียบกับ SSE)">
    OpenClaw ใช้ WebSocket ก่อน พร้อม fallback ไปยัง SSE (`"auto"`) สำหรับทั้ง `openai/*` และ `openai-codex/*`

    ในโหมด `"auto"` OpenClaw จะ:
    - ลองใหม่หนึ่งครั้งเมื่อ WebSocket ล้มเหลวในช่วงต้น ก่อน fallback ไปยัง SSE
    - หลังจากเกิดความล้มเหลว จะทำเครื่องหมายว่า WebSocket เสื่อมสภาพเป็นเวลาประมาณ 60 วินาที และใช้ SSE ระหว่างช่วง cool-down
    - แนบ header รหัสประจำเซสชันและเทิร์นที่คงที่สำหรับการลองใหม่และการเชื่อมต่อใหม่
    - ทำให้ตัวนับการใช้งาน (`input_tokens` / `prompt_tokens`) เป็นมาตรฐานเดียวกันข้ามรูปแบบการขนส่ง

    | ค่า | พฤติกรรม |
    |-------|----------|
    | `"auto"` (ค่าเริ่มต้น) | ใช้ WebSocket ก่อน แล้ว fallback ไปยัง SSE |
    | `"sse"` | บังคับใช้เฉพาะ SSE |
    | `"websocket"` | บังคับใช้เฉพาะ WebSocket |

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

  <Accordion title="การวอร์มอัป WebSocket">
    OpenClaw เปิดใช้การวอร์มอัป WebSocket โดยค่าเริ่มต้นสำหรับ `openai/*` เพื่อลดเวลาแฝงของเทิร์นแรก

    ```json5
    // ปิดใช้งานการวอร์มอัป
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

<a id="openai-fast-mode"></a>

  <Accordion title="โหมดเร็ว">
    OpenClaw เปิดให้ใช้สวิตช์โหมดเร็วแบบใช้ร่วมกันสำหรับทั้ง `openai/*` และ `openai-codex/*`:

    - **แชต/UI:** `/fast status|on|off`
    - **Config:** `agents.defaults.models["<provider>/<model>"].params.fastMode`

    เมื่อเปิดใช้งาน OpenClaw จะจับคู่โหมดเร็วเข้ากับการประมวลผลแบบ priority ของ OpenAI (`service_tier = "priority"`) โดยจะคงค่า `service_tier` เดิมไว้ และโหมดเร็วจะไม่เขียนทับ `reasoning` หรือ `text.verbosity`

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
    การแทนที่ระดับเซสชันมีผลเหนือกว่า config การล้างการแทนที่ระดับเซสชันใน Sessions UI จะทำให้เซสชันกลับไปใช้ค่าเริ่มต้นที่กำหนดไว้
    </Note>

  </Accordion>

  <Accordion title="การประมวลผลแบบ priority (service_tier)">
    API ของ OpenAI เปิดให้ใช้การประมวลผลแบบ priority ผ่าน `service_tier` ตั้งค่าต่อโมเดลใน OpenClaw ได้ดังนี้:

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
    `serviceTier` จะถูกส่งต่อเฉพาะไปยัง endpoint เนทีฟของ OpenAI (`api.openai.com`) และ endpoint เนทีฟของ Codex (`chatgpt.com/backend-api`) เท่านั้น หากคุณกำหนดเส้นทาง provider ใด provider หนึ่งผ่าน proxy OpenClaw จะไม่แตะต้อง `service_tier`
    </Warning>

  </Accordion>

  <Accordion title="Compaction ฝั่งเซิร์ฟเวอร์ (Responses API)">
    สำหรับโมเดล OpenAI Responses โดยตรง (`openai/*` บน `api.openai.com`) OpenClaw จะเปิดใช้ Compaction ฝั่งเซิร์ฟเวอร์โดยอัตโนมัติ:

    - บังคับ `store: true` (เว้นแต่ model compat จะตั้งค่า `supportsStore: false`)
    - แทรก `context_management: [{ type: "compaction", compact_threshold: ... }]`
    - `compact_threshold` เริ่มต้น: 70% ของ `contextWindow` (หรือ `80000` เมื่อไม่มีข้อมูล)

    <Tabs>
      <Tab title="เปิดใช้อย่างชัดเจน">
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
      <Tab title="เกณฑ์ที่กำหนดเอง">
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
    `responsesServerCompaction` ควบคุมเฉพาะการแทรก `context_management` เท่านั้น โมเดล Direct OpenAI Responses จะยังคงบังคับ `store: true` เว้นแต่ compat จะตั้งค่า `supportsStore: false`
    </Note>

  </Accordion>

  <Accordion title="โหมด GPT แบบเอเจนต์เข้มงวด">
    สำหรับการรันตระกูล GPT-5 บน `openai/*` และ `openai-codex/*` OpenClaw สามารถใช้สัญญาการทำงานแบบฝังตัวที่เข้มงวดยิ่งขึ้นได้:

    ```json5
    {
      agents: {
        defaults: {
          embeddedPi: { executionContract: "strict-agentic" },
        },
      },
    }
    ```

    เมื่อใช้ `strict-agentic` OpenClaw จะ:
    - ไม่ถือว่าเทิร์นที่มีเพียงแผนเป็นความคืบหน้าที่สำเร็จอีกต่อไปเมื่อมีการกระทำผ่านเครื่องมือที่พร้อมใช้งาน
    - ลองเทิร์นนั้นใหม่พร้อมคำชี้นำให้ลงมือทำทันที
    - เปิดใช้ `update_plan` โดยอัตโนมัติสำหรับงานที่มีสาระสำคัญ
    - แสดงสถานะถูกบล็อกอย่างชัดเจนหากโมเดลยังคงวางแผนโดยไม่ลงมือทำ

    <Note>
    จำกัดขอบเขตเฉพาะการรันตระกูล GPT-5 ของ OpenAI และ Codex เท่านั้น providers อื่นและตระกูลโมเดลที่เก่ากว่าจะยังคงใช้พฤติกรรมเริ่มต้น
    </Note>

  </Accordion>

  <Accordion title="เส้นทางแบบเนทีฟเทียบกับแบบเข้ากันได้กับ OpenAI">
    OpenClaw ปฏิบัติต่อ endpoint ของ OpenAI โดยตรง, Codex และ Azure OpenAI แตกต่างจาก proxy `/v1` แบบเข้ากันได้กับ OpenAI ทั่วไป:

    **เส้นทางแบบเนทีฟ** (`openai/*`, `openai-codex/*`, Azure OpenAI):
    - คง `reasoning: { effort: "none" }` ไว้เฉพาะสำหรับโมเดลที่รองรับค่า effort แบบ OpenAI `none`
    - ละเว้น reasoning ที่ปิดใช้งานสำหรับโมเดลหรือ proxy ที่ปฏิเสธ `reasoning.effort: "none"`
    - ตั้งค่า schema ของเครื่องมือให้เป็นโหมด strict โดยค่าเริ่มต้น
    - แนบ header attribution แบบซ่อนเฉพาะบนโฮสต์เนทีฟที่ผ่านการยืนยันแล้วเท่านั้น
    - คงรูปแบบคำขอเฉพาะของ OpenAI (`service_tier`, `store`, reasoning-compat, คำใบ้ prompt-cache)

    **เส้นทางแบบ proxy/compatible:**
    - ใช้พฤติกรรม compat ที่ผ่อนคลายกว่า
    - ไม่บังคับ schema เครื่องมือแบบ strict หรือ header แบบเนทีฟเท่านั้น

    Azure OpenAI ใช้การขนส่งแบบเนทีฟและพฤติกรรม compat แต่จะไม่ได้รับ header attribution แบบซ่อน

  </Accordion>
</AccordionGroup>

## ที่เกี่ยวข้อง

<CardGroup cols={2}>
  <Card title="การเลือกโมเดล" href="/th/concepts/model-providers" icon="layers">
    การเลือก provider, model ref และพฤติกรรม failover
  </Card>
  <Card title="การสร้างภาพ" href="/th/tools/image-generation" icon="image">
    พารามิเตอร์เครื่องมือภาพที่ใช้ร่วมกันและการเลือก provider
  </Card>
  <Card title="การสร้างวิดีโอ" href="/th/tools/video-generation" icon="video">
    พารามิเตอร์เครื่องมือวิดีโอที่ใช้ร่วมกันและการเลือก provider
  </Card>
  <Card title="OAuth และการยืนยันตัวตน" href="/th/gateway/authentication" icon="key">
    รายละเอียดการยืนยันตัวตนและกฎการใช้ข้อมูลรับรองซ้ำ
  </Card>
</CardGroup>
