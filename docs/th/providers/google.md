---
read_when:
    - คุณต้องการใช้โมเดล Google Gemini กับ OpenClaw
    - คุณต้องการโฟลว์การยืนยันตัวตนแบบ API key หรือ OAuth
summary: การตั้งค่า Google Gemini (API key + OAuth, การสร้างภาพ, การทำความเข้าใจสื่อ, TTS, การค้นหาเว็บ)
title: Google (Gemini)
x-i18n:
    generated_at: "2026-04-24T09:28:00Z"
    model: gpt-5.4
    provider: openai
    source_hash: 7e66c9dd637e26976659d04b9b7e2452e6881945dab6011970f9e1c5e4a9a685
    source_path: providers/google.md
    workflow: 15
---

ปลั๊กอิน Google ให้การเข้าถึงโมเดล Gemini ผ่าน Google AI Studio พร้อมทั้ง
การสร้างภาพ การทำความเข้าใจสื่อ (ภาพ/เสียง/วิดีโอ) การแปลงข้อความเป็นเสียง และการค้นหาเว็บผ่าน
Gemini Grounding

- ผู้ให้บริการ: `google`
- การยืนยันตัวตน: `GEMINI_API_KEY` หรือ `GOOGLE_API_KEY`
- API: Google Gemini API
- ผู้ให้บริการทางเลือก: `google-gemini-cli` (OAuth)

## เริ่มต้นใช้งาน

เลือกวิธีการยืนยันตัวตนที่คุณต้องการ แล้วทำตามขั้นตอนการตั้งค่า

<Tabs>
  <Tab title="API key">
    **เหมาะที่สุดสำหรับ:** การเข้าถึง Gemini API มาตรฐานผ่าน Google AI Studio

    <Steps>
      <Step title="รันการตั้งค่าเริ่มต้น">
        ```bash
        openclaw onboard --auth-choice gemini-api-key
        ```

        หรือส่งคีย์โดยตรง:

        ```bash
        openclaw onboard --non-interactive \
          --mode local \
          --auth-choice gemini-api-key \
          --gemini-api-key "$GEMINI_API_KEY"
        ```
      </Step>
      <Step title="ตั้งค่าโมเดลเริ่มต้น">
        ```json5
        {
          agents: {
            defaults: {
              model: { primary: "google/gemini-3.1-pro-preview" },
            },
          },
        }
        ```
      </Step>
      <Step title="ตรวจสอบว่าโมเดลพร้อมใช้งาน">
        ```bash
        openclaw models list --provider google
        ```
      </Step>
    </Steps>

    <Tip>
    ยอมรับทั้งตัวแปรสภาพแวดล้อม `GEMINI_API_KEY` และ `GOOGLE_API_KEY` ให้ใช้ตัวที่คุณตั้งค่าไว้อยู่แล้วได้เลย
    </Tip>

  </Tab>

  <Tab title="Gemini CLI (OAuth)">
    **เหมาะที่สุดสำหรับ:** ใช้การล็อกอิน Gemini CLI ที่มีอยู่แล้วผ่าน PKCE OAuth แทน API key แยกต่างหาก

    <Warning>
    ผู้ให้บริการ `google-gemini-cli` เป็นการเชื่อมต่อแบบไม่เป็นทางการ ผู้ใช้บางราย
    รายงานว่าพบบัญชีถูกจำกัดเมื่อใช้ OAuth ในลักษณะนี้ ใช้งานโดยยอมรับความเสี่ยงด้วยตนเอง
    </Warning>

    <Steps>
      <Step title="ติดตั้ง Gemini CLI">
        คำสั่ง `gemini` ในเครื่องต้องพร้อมใช้งานบน `PATH`

        ```bash
        # Homebrew
        brew install gemini-cli

        # หรือ npm
        npm install -g @google/gemini-cli
        ```

        OpenClaw รองรับทั้งการติดตั้งผ่าน Homebrew และการติดตั้ง npm แบบ global รวมถึง
        เลย์เอาต์ Windows/npm ทั่วไป
      </Step>
      <Step title="ล็อกอินผ่าน OAuth">
        ```bash
        openclaw models auth login --provider google-gemini-cli --set-default
        ```
      </Step>
      <Step title="ตรวจสอบว่าโมเดลพร้อมใช้งาน">
        ```bash
        openclaw models list --provider google-gemini-cli
        ```
      </Step>
    </Steps>

    - โมเดลเริ่มต้น: `google-gemini-cli/gemini-3-flash-preview`
    - ชื่อแฝง: `gemini-cli`

    **ตัวแปรสภาพแวดล้อม:**

    - `OPENCLAW_GEMINI_OAUTH_CLIENT_ID`
    - `OPENCLAW_GEMINI_OAUTH_CLIENT_SECRET`

    (หรือเวอร์ชัน `GEMINI_CLI_*`)

    <Note>
    หากคำขอ OAuth ของ Gemini CLI ล้มเหลวหลังจากล็อกอินแล้ว ให้ตั้งค่า `GOOGLE_CLOUD_PROJECT` หรือ
    `GOOGLE_CLOUD_PROJECT_ID` บนโฮสต์ gateway แล้วลองอีกครั้ง
    </Note>

    <Note>
    หากการล็อกอินล้มเหลวก่อนเริ่มโฟลว์ในเบราว์เซอร์ ให้ตรวจสอบว่ามีการติดตั้งคำสั่ง `gemini`
    ในเครื่องและอยู่บน `PATH`
    </Note>

    ผู้ให้บริการ `google-gemini-cli` ที่รองรับเฉพาะ OAuth เป็นพื้นผิว
    การอนุมานข้อความแยกต่างหาก ส่วนการสร้างภาพ การทำความเข้าใจสื่อ และ Gemini Grounding ยังคงอยู่บน
    id ผู้ให้บริการ `google`

  </Tab>
</Tabs>

## ความสามารถ

| ความสามารถ | รองรับ |
| ---------------------- | ----------------------------- |
| Chat completions | ใช่ |
| การสร้างภาพ | ใช่ |
| การสร้างเพลง | ใช่ |
| การแปลงข้อความเป็นเสียง | ใช่ |
| เสียงแบบเรียลไทม์ | ใช่ (Google Live API) |
| การทำความเข้าใจภาพ | ใช่ |
| การถอดเสียงจากเสียง | ใช่ |
| การทำความเข้าใจวิดีโอ | ใช่ |
| การค้นหาเว็บ (Grounding) | ใช่ |
| การคิด/การให้เหตุผล | ใช่ (Gemini 2.5+ / Gemini 3+) |
| โมเดล Gemma 4 | ใช่ |

<Tip>
โมเดล Gemini 3 ใช้ `thinkingLevel` แทน `thinkingBudget` OpenClaw แมป
ตัวควบคุมการให้เหตุผลของ Gemini 3, Gemini 3.1 และ alias `gemini-*-latest` ไปยัง
`thinkingLevel` เพื่อให้การรันแบบค่าเริ่มต้น/หน่วงต่ำไม่ส่งค่า
`thinkingBudget` ที่ถูกปิดใช้งาน

โมเดล Gemma 4 (เช่น `gemma-4-26b-a4b-it`) รองรับโหมดคิด OpenClaw
จะเขียน `thinkingBudget` ใหม่เป็น `thinkingLevel` ของ Google ที่รองรับสำหรับ Gemma 4
การตั้งค่าการคิดเป็น `off` จะคงสถานะปิดการคิดไว้ แทนที่จะแมปเป็น
`MINIMAL`
</Tip>

## การสร้างภาพ

ผู้ให้บริการการสร้างภาพ `google` แบบ bundled จะใช้ค่าเริ่มต้นเป็น
`google/gemini-3.1-flash-image-preview`

- รองรับ `google/gemini-3-pro-image-preview` ด้วย
- สร้างได้: สูงสุด 4 ภาพต่อคำขอ
- โหมดแก้ไข: เปิดใช้งาน รองรับภาพอินพุตสูงสุด 5 ภาพ
- ตัวควบคุมเรขาคณิต: `size`, `aspectRatio` และ `resolution`

หากต้องการใช้ Google เป็นผู้ให้บริการภาพเริ่มต้น:

```json5
{
  agents: {
    defaults: {
      imageGenerationModel: {
        primary: "google/gemini-3.1-flash-image-preview",
      },
    },
  },
}
```

<Note>
ดู [Image Generation](/th/tools/image-generation) สำหรับพารามิเตอร์ร่วมของเครื่องมือ การเลือกผู้ให้บริการ และพฤติกรรม failover
</Note>

## การสร้างวิดีโอ

ปลั๊กอิน `google` แบบ bundled ยังลงทะเบียนการสร้างวิดีโอผ่านเครื่องมือร่วม
`video_generate` ด้วย

- โมเดลวิดีโอเริ่มต้น: `google/veo-3.1-fast-generate-preview`
- โหมด: text-to-video, image-to-video และโฟลว์อ้างอิงวิดีโอเดี่ยว
- รองรับ `aspectRatio`, `resolution` และ `audio`
- การจำกัดระยะเวลาปัจจุบัน: **4 ถึง 8 วินาที**

หากต้องการใช้ Google เป็นผู้ให้บริการวิดีโอเริ่มต้น:

```json5
{
  agents: {
    defaults: {
      videoGenerationModel: {
        primary: "google/veo-3.1-fast-generate-preview",
      },
    },
  },
}
```

<Note>
ดู [Video Generation](/th/tools/video-generation) สำหรับพารามิเตอร์ร่วมของเครื่องมือ การเลือกผู้ให้บริการ และพฤติกรรม failover
</Note>

## การสร้างเพลง

ปลั๊กอิน `google` แบบ bundled ยังลงทะเบียนการสร้างเพลงผ่านเครื่องมือร่วม
`music_generate` ด้วย

- โมเดลเพลงเริ่มต้น: `google/lyria-3-clip-preview`
- รองรับ `google/lyria-3-pro-preview` ด้วย
- ตัวควบคุม prompt: `lyrics` และ `instrumental`
- รูปแบบเอาต์พุต: `mp3` โดยค่าเริ่มต้น และ `wav` บน `google/lyria-3-pro-preview`
- อินพุตอ้างอิง: สูงสุด 10 ภาพ
- การรันแบบ session-backed จะถูกแยกออกผ่านโฟลว์ task/status ร่วม รวมถึง `action: "status"`

หากต้องการใช้ Google เป็นผู้ให้บริการเพลงเริ่มต้น:

```json5
{
  agents: {
    defaults: {
      musicGenerationModel: {
        primary: "google/lyria-3-clip-preview",
      },
    },
  },
}
```

<Note>
ดู [Music Generation](/th/tools/music-generation) สำหรับพารามิเตอร์ร่วมของเครื่องมือ การเลือกผู้ให้บริการ และพฤติกรรม failover
</Note>

## การแปลงข้อความเป็นเสียง

ผู้ให้บริการ speech `google` แบบ bundled ใช้เส้นทาง Gemini API TTS ร่วมกับ
`gemini-3.1-flash-tts-preview`

- เสียงเริ่มต้น: `Kore`
- การยืนยันตัวตน: `messages.tts.providers.google.apiKey`, `models.providers.google.apiKey`, `GEMINI_API_KEY` หรือ `GOOGLE_API_KEY`
- เอาต์พุต: WAV สำหรับไฟล์แนบ TTS ปกติ, PCM สำหรับ Talk/ระบบโทรศัพท์
- เอาต์พุตแบบ voice-note เนทีฟ: ไม่รองรับบนเส้นทาง Gemini API นี้ เพราะ API คืนค่า PCM แทน Opus

หากต้องการใช้ Google เป็นผู้ให้บริการ TTS เริ่มต้น:

```json5
{
  messages: {
    tts: {
      auto: "always",
      provider: "google",
      providers: {
        google: {
          model: "gemini-3.1-flash-tts-preview",
          voiceName: "Kore",
        },
      },
    },
  },
}
```

Gemini API TTS ยอมรับแท็กเสียงในวงเล็บเหลี่ยมที่สื่ออารมณ์ในข้อความ เช่น
`[whispers]` หรือ `[laughs]` เพื่อไม่ให้แท็กปรากฏในข้อความตอบกลับที่มองเห็นได้
แต่ยังส่งไปยัง TTS ให้ใส่แท็กเหล่านั้นไว้ในบล็อก `[[tts:text]]...[[/tts:text]]`:

```text
นี่คือข้อความตอบกลับที่สะอาด

[[tts:text]][whispers] นี่คือเวอร์ชันที่พูดออกเสียง[[/tts:text]]
```

<Note>
Google Cloud Console API key ที่จำกัดสิทธิ์ไว้เฉพาะ Gemini API สามารถใช้กับ
ผู้ให้บริการนี้ได้ นี่ไม่ใช่เส้นทางของ Cloud Text-to-Speech API แยกต่างหาก
</Note>

## เสียงแบบเรียลไทม์

ปลั๊กอิน `google` แบบ bundled ลงทะเบียนผู้ให้บริการเสียงแบบเรียลไทม์ที่ขับเคลื่อนด้วย
Gemini Live API สำหรับสะพานเสียงฝั่งแบ็กเอนด์ เช่น Voice Call และ Google Meet

| การตั้งค่า | พาธ config | ค่าเริ่มต้น |
| --------------------- | ------------------------------------------------------------------- | ------------------------------------------------------------------------------------- |
| โมเดล | `plugins.entries.voice-call.config.realtime.providers.google.model` | `gemini-2.5-flash-native-audio-preview-12-2025` |
| เสียง | `...google.voice` | `Kore` |
| Temperature | `...google.temperature` | (ไม่ตั้งค่า) |
| ความไวเริ่มต้นของ VAD | `...google.startSensitivity` | (ไม่ตั้งค่า) |
| ความไวสิ้นสุดของ VAD | `...google.endSensitivity` | (ไม่ตั้งค่า) |
| ระยะเวลาเงียบ | `...google.silenceDurationMs` | (ไม่ตั้งค่า) |
| API key | `...google.apiKey` | fallback ไปยัง `models.providers.google.apiKey`, `GEMINI_API_KEY` หรือ `GOOGLE_API_KEY` |

ตัวอย่าง config แบบเรียลไทม์ของ Voice Call:

```json5
{
  plugins: {
    entries: {
      "voice-call": {
        enabled: true,
        config: {
          realtime: {
            enabled: true,
            provider: "google",
            providers: {
              google: {
                model: "gemini-2.5-flash-native-audio-preview-12-2025",
                voice: "Kore",
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
Google Live API ใช้เสียงสองทิศทางและ function calling ผ่าน WebSocket
OpenClaw จะปรับเสียงจาก telephony/Meet bridge ให้เข้ากับสตรีม PCM Live API ของ Gemini และ
คงการเรียกเครื่องมือไว้บนสัญญาเสียงแบบเรียลไทม์ร่วม ปล่อย `temperature`
ให้ไม่ถูกตั้งค่าไว้ เว้นแต่คุณต้องการเปลี่ยนการสุ่มตัวอย่าง OpenClaw จะละค่าที่ไม่เป็นบวก
เพราะ Google Live อาจคืนเฉพาะ transcript โดยไม่มีเสียงเมื่อ `temperature: 0`
การถอดเสียงด้วย Gemini API จะเปิดใช้งานโดยไม่ใช้ `languageCodes`; Google
SDK ปัจจุบันปฏิเสธคำใบ้รหัสภาษาในเส้นทาง API นี้
</Note>

<Note>
เซสชันเบราว์เซอร์ Talk ของ Control UI ยังคงต้องการผู้ให้บริการเสียงแบบเรียลไทม์ที่มี
การติดตั้งใช้งานเซสชัน WebRTC ในเบราว์เซอร์ ปัจจุบันเส้นทางนั้นคือ OpenAI Realtime; ส่วน
ผู้ให้บริการ Google ใช้สำหรับสะพานแบบเรียลไทม์ฝั่งแบ็กเอนด์
</Note>

## การตั้งค่าขั้นสูง

<AccordionGroup>
  <Accordion title="การใช้แคช Gemini โดยตรงซ้ำ">
    สำหรับการรัน Gemini API โดยตรง (`api: "google-generative-ai"`), OpenClaw
    จะส่งต่อ handle ของ `cachedContent` ที่ตั้งค่าไว้ไปยังคำขอ Gemini

    - ตั้งค่าพารามิเตอร์ต่อโมเดลหรือแบบ global ได้ด้วย
      `cachedContent` หรือ `cached_content` แบบเดิม
    - หากมีทั้งสองค่า `cachedContent` จะมีลำดับความสำคัญสูงกว่า
    - ค่าตัวอย่าง: `cachedContents/prebuilt-context`
    - การใช้งาน cache-hit ของ Gemini จะถูก normalize เป็น OpenClaw `cacheRead` จาก
      `cachedContentTokenCount` ของต้นทาง

    ```json5
    {
      agents: {
        defaults: {
          models: {
            "google/gemini-2.5-pro": {
              params: {
                cachedContent: "cachedContents/prebuilt-context",
              },
            },
          },
        },
      },
    }
    ```

  </Accordion>

  <Accordion title="หมายเหตุการใช้งาน JSON ของ Gemini CLI">
    เมื่อใช้ผู้ให้บริการ OAuth `google-gemini-cli` OpenClaw จะ normalize
    เอาต์พุต JSON ของ CLI ดังนี้:

    - ข้อความตอบกลับมาจากฟิลด์ `response` ของ JSON จาก CLI
    - การใช้งานจะ fallback ไปใช้ `stats` เมื่อ CLI ปล่อย `usage` ว่างไว้
    - `stats.cached` จะถูก normalize เป็น `cacheRead` ของ OpenClaw
    - หากไม่มี `stats.input` OpenClaw จะคำนวณโทเค็นอินพุตจาก
      `stats.input_tokens - stats.cached`

  </Accordion>

  <Accordion title="การตั้งค่าสภาพแวดล้อมและเดมอน">
    หาก Gateway ทำงานเป็นเดมอน (launchd/systemd) ให้ตรวจสอบว่า `GEMINI_API_KEY`
    พร้อมใช้งานสำหรับโปรเซสนั้น (ตัวอย่างเช่น ใน `~/.openclaw/.env` หรือผ่าน
    `env.shellEnv`)
  </Accordion>
</AccordionGroup>

## ที่เกี่ยวข้อง

<CardGroup cols={2}>
  <Card title="การเลือกโมเดล" href="/th/concepts/model-providers" icon="layers">
    การเลือกผู้ให้บริการ, model refs และพฤติกรรม failover
  </Card>
  <Card title="การสร้างภาพ" href="/th/tools/image-generation" icon="image">
    พารามิเตอร์ร่วมของเครื่องมือภาพและการเลือกผู้ให้บริการ
  </Card>
  <Card title="การสร้างวิดีโอ" href="/th/tools/video-generation" icon="video">
    พารามิเตอร์ร่วมของเครื่องมือวิดีโอและการเลือกผู้ให้บริการ
  </Card>
  <Card title="การสร้างเพลง" href="/th/tools/music-generation" icon="music">
    พารามิเตอร์ร่วมของเครื่องมือเพลงและการเลือกผู้ให้บริการ
  </Card>
</CardGroup>
