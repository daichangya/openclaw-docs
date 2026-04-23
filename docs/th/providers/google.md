---
read_when:
    - คุณต้องการใช้โมเดล Google Gemini กับ OpenClaw
    - คุณต้องการโฟลว์การยืนยันตัวตนแบบ API key หรือ OAuth
summary: การตั้งค่า Google Gemini (API key + OAuth, image generation, media understanding, TTS, web search)
title: Google (Gemini)
x-i18n:
    generated_at: "2026-04-23T05:51:21Z"
    model: gpt-5.4
    provider: openai
    source_hash: e5e055b02cc51899e11836a882f1f981fedfa5c4dbe42261ac2f2eba5e4d707c
    source_path: providers/google.md
    workflow: 15
---

# Google (Gemini)

plugin Google ให้การเข้าถึงโมเดล Gemini ผ่าน Google AI Studio รวมถึง
image generation, media understanding (ภาพ/เสียง/วิดีโอ), text-to-speech และ web search ผ่าน
Gemini Grounding

- Provider: `google`
- Auth: `GEMINI_API_KEY` หรือ `GOOGLE_API_KEY`
- API: Google Gemini API
- ผู้ให้บริการทางเลือก: `google-gemini-cli` (OAuth)

## เริ่มต้นใช้งาน

เลือกวิธี auth ที่คุณต้องการและทำตามขั้นตอนการตั้งค่า

<Tabs>
  <Tab title="API key">
    **เหมาะที่สุดสำหรับ:** การเข้าถึง Gemini API แบบมาตรฐานผ่าน Google AI Studio

    <Steps>
      <Step title="รัน onboarding">
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
    รองรับทั้งตัวแปร environment `GEMINI_API_KEY` และ `GOOGLE_API_KEY` ให้ใช้ตัวที่คุณตั้งค่าไว้แล้ว
    </Tip>

  </Tab>

  <Tab title="Gemini CLI (OAuth)">
    **เหมาะที่สุดสำหรับ:** การใช้ Gemini CLI login ที่มีอยู่แล้วผ่าน PKCE OAuth แทนการใช้ API key แยก

    <Warning>
    provider `google-gemini-cli` เป็น integration ที่ไม่เป็นทางการ ผู้ใช้บางราย
    รายงานว่าพบบัญชีถูกจำกัดเมื่อใช้ OAuth ในลักษณะนี้ ใช้งานด้วยความเสี่ยงของคุณเอง
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

        OpenClaw รองรับทั้งการติดตั้งผ่าน Homebrew และการติดตั้งแบบ global ผ่าน npm รวมถึง
        layout ทั่วไปของ Windows/npm
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
    - Alias: `gemini-cli`

    **ตัวแปร environment:**

    - `OPENCLAW_GEMINI_OAUTH_CLIENT_ID`
    - `OPENCLAW_GEMINI_OAUTH_CLIENT_SECRET`

    (หรือรุ่น `GEMINI_CLI_*`)

    <Note>
    หากคำขอ Gemini CLI OAuth ล้มเหลวหลังล็อกอิน ให้ตั้ง `GOOGLE_CLOUD_PROJECT` หรือ
    `GOOGLE_CLOUD_PROJECT_ID` บนโฮสต์ของ gateway แล้วลองใหม่
    </Note>

    <Note>
    หากการล็อกอินล้มเหลวก่อนเริ่มโฟลว์ในเบราว์เซอร์ ให้ตรวจสอบว่าได้ติดตั้งคำสั่ง `gemini`
    ในเครื่องและอยู่บน `PATH` แล้ว
    </Note>

    provider `google-gemini-cli` ที่ใช้ OAuth เท่านั้นเป็นพื้นผิว text-inference แยกต่างหาก
    ส่วน image generation, media understanding และ Gemini Grounding ยังคงอยู่บน
    provider id `google`

  </Tab>
</Tabs>

## Capabilities

| Capability             | รองรับ                        |
| ---------------------- | ----------------------------- |
| Chat completions       | ใช่                           |
| Image generation       | ใช่                           |
| Music generation       | ใช่                           |
| Text-to-speech         | ใช่                           |
| Image understanding    | ใช่                           |
| Audio transcription    | ใช่                           |
| Video understanding    | ใช่                           |
| Web search (Grounding) | ใช่                           |
| Thinking/reasoning     | ใช่ (Gemini 2.5+ / Gemini 3+) |
| Gemma 4 models         | ใช่                           |

<Tip>
โมเดล Gemini 3 ใช้ `thinkingLevel` แทน `thinkingBudget` OpenClaw จะแมป
ตัวควบคุม reasoning ของ Gemini 3, Gemini 3.1 และ alias `gemini-*-latest` ไปยัง
`thinkingLevel` เพื่อให้การรันแบบค่าเริ่มต้น/latency ต่ำไม่ส่งค่า
`thinkingBudget` ที่ถูกปิดใช้งาน

โมเดล Gemma 4 (เช่น `gemma-4-26b-a4b-it`) รองรับ thinking mode OpenClaw
จะเขียน `thinkingBudget` ใหม่เป็น `thinkingLevel` ของ Google ที่ Gemma 4 รองรับ
การตั้งค่า thinking เป็น `off` จะคงสถานะปิด thinking ไว้ แทนที่จะแมปเป็น
`MINIMAL`
</Tip>

## Image generation

provider สำหรับ image-generation แบบ bundled `google` ใช้ค่าเริ่มต้นเป็น
`google/gemini-3.1-flash-image-preview`

- รองรับ `google/gemini-3-pro-image-preview` ด้วย
- Generate: สูงสุด 4 ภาพต่อคำขอ
- โหมด Edit: เปิดใช้งาน, รองรับภาพอินพุตสูงสุด 5 ภาพ
- ตัวควบคุม geometry: `size`, `aspectRatio` และ `resolution`

หากต้องการใช้ Google เป็น provider ภาพเริ่มต้น:

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
ดู [Image Generation](/th/tools/image-generation) สำหรับพารามิเตอร์ของ tool แบบ shared, การเลือก provider และพฤติกรรม failover
</Note>

## Video generation

bundled `google` plugin ยังลงทะเบียน video generation ผ่าน
tool `video_generate` แบบ shared ด้วย

- โมเดลวิดีโอเริ่มต้น: `google/veo-3.1-fast-generate-preview`
- โหมด: text-to-video, image-to-video และโฟลว์แบบอ้างอิงวิดีโอเดี่ยว
- รองรับ `aspectRatio`, `resolution` และ `audio`
- ขีดจำกัด duration ปัจจุบัน: **4 ถึง 8 วินาที**

หากต้องการใช้ Google เป็น provider วิดีโอเริ่มต้น:

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
ดู [Video Generation](/th/tools/video-generation) สำหรับพารามิเตอร์ของ tool แบบ shared, การเลือก provider และพฤติกรรม failover
</Note>

## Music generation

bundled `google` plugin ยังลงทะเบียน music generation ผ่าน
tool `music_generate` แบบ shared ด้วย

- โมเดลเพลงเริ่มต้น: `google/lyria-3-clip-preview`
- รองรับ `google/lyria-3-pro-preview` ด้วย
- ตัวควบคุม prompt: `lyrics` และ `instrumental`
- รูปแบบเอาต์พุต: `mp3` เป็นค่าเริ่มต้น และ `wav` บน `google/lyria-3-pro-preview`
- อินพุตอ้างอิง: สูงสุด 10 ภาพ
- การรันที่มี session รองรับการ detach ผ่านโฟลว์ task/status แบบ shared รวมถึง `action: "status"`

หากต้องการใช้ Google เป็น provider เพลงเริ่มต้น:

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
ดู [Music Generation](/th/tools/music-generation) สำหรับพารามิเตอร์ของ tool แบบ shared, การเลือก provider และพฤติกรรม failover
</Note>

## Text-to-speech

speech provider แบบ bundled `google` ใช้เส้นทาง Gemini API TTS ผ่าน
`gemini-3.1-flash-tts-preview`

- เสียงเริ่มต้น: `Kore`
- Auth: `messages.tts.providers.google.apiKey`, `models.providers.google.apiKey`, `GEMINI_API_KEY` หรือ `GOOGLE_API_KEY`
- เอาต์พุต: WAV สำหรับไฟล์แนบ TTS ปกติ, PCM สำหรับ Talk/telephony
- เอาต์พุต voice-note แบบเนทีฟ: ไม่รองรับบนเส้นทาง Gemini API นี้ เพราะ API ส่งคืน PCM แทน Opus

หากต้องการใช้ Google เป็น provider TTS เริ่มต้น:

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

Gemini API TTS รองรับแท็กเสียงแบบ expressive ในวงเล็บเหลี่ยมในข้อความ เช่น
`[whispers]` หรือ `[laughs]` หากต้องการไม่ให้แท็กแสดงในข้อความแชตที่มองเห็น แต่ยังส่งไปยัง TTS ให้ใส่มันไว้ในบล็อก `[[tts:text]]...[[/tts:text]]`

```text
Here is the clean reply text.

[[tts:text]][whispers] Here is the spoken version.[[/tts:text]]
```

<Note>
Google Cloud Console API key ที่จำกัดเฉพาะ Gemini API ใช้ได้กับ
provider นี้ นี่ไม่ใช่เส้นทางแยกของ Cloud Text-to-Speech API
</Note>

## การกำหนดค่าขั้นสูง

<AccordionGroup>
  <Accordion title="การใช้ Gemini cache ซ้ำโดยตรง">
    สำหรับการรัน Gemini API โดยตรง (`api: "google-generative-ai"`), OpenClaw
    จะส่ง handle ของ `cachedContent` ที่กำหนดค่าไว้ต่อไปยังคำขอของ Gemini

    - กำหนดพารามิเตอร์รายโมเดลหรือแบบ global ได้ด้วยทั้ง
      `cachedContent` หรือ `cached_content` แบบเดิม
    - หากมีทั้งคู่ `cachedContent` จะมีสิทธิ์เหนือกว่า
    - ค่าตัวอย่าง: `cachedContents/prebuilt-context`
    - usage แบบ cache-hit ของ Gemini จะถูก normalize เป็น `cacheRead` ของ OpenClaw จาก
      upstream `cachedContentTokenCount`

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

  <Accordion title="หมายเหตุเรื่อง Gemini CLI JSON usage">
    เมื่อใช้ provider `google-gemini-cli` แบบ OAuth, OpenClaw จะ normalize
    เอาต์พุต JSON ของ CLI ดังนี้:

    - ข้อความตอบกลับมาจากฟิลด์ JSON `response` ของ CLI
    - Usage จะ fallback ไปใช้ `stats` เมื่อ CLI ปล่อย `usage` ว่างไว้
    - `stats.cached` จะถูก normalize เป็น `cacheRead` ของ OpenClaw
    - หาก `stats.input` ไม่มี OpenClaw จะอนุมานโทเค็นขาเข้าจาก
      `stats.input_tokens - stats.cached`

  </Accordion>

  <Accordion title="Environment และการตั้งค่า daemon">
    หาก Gateway รันเป็น daemon (launchd/systemd) ให้ตรวจสอบว่า `GEMINI_API_KEY`
    พร้อมใช้งานสำหรับโปรเซสนั้น (เช่นใน `~/.openclaw/.env` หรือผ่าน
    `env.shellEnv`)
  </Accordion>
</AccordionGroup>

## ที่เกี่ยวข้อง

<CardGroup cols={2}>
  <Card title="การเลือกโมเดล" href="/th/concepts/model-providers" icon="layers">
    การเลือก provider, model ref และพฤติกรรม failover
  </Card>
  <Card title="Image generation" href="/th/tools/image-generation" icon="image">
    พารามิเตอร์ของ image tool แบบ shared และการเลือก provider
  </Card>
  <Card title="Video generation" href="/th/tools/video-generation" icon="video">
    พารามิเตอร์ของ video tool แบบ shared และการเลือก provider
  </Card>
  <Card title="Music generation" href="/th/tools/music-generation" icon="music">
    พารามิเตอร์ของ music tool แบบ shared และการเลือก provider
  </Card>
</CardGroup>
