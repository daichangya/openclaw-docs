---
read_when:
    - การเปิดใช้ text-to-speech สำหรับคำตอบ to=functions.read commentary ＿一本道json ьӡpath":"docs/AGENTS.md","offset":1,"limit":200} code
    - การกำหนดค่า provider หรือขีดจำกัดของ TTS to=functions.read commentary ＿一本道json ៉ះpath":"docs/AGENTS.md","offset":1,"limit":200} code
    - การใช้คำสั่ง `/tts` to=functions.read commentary ＿一本道json ់path":"docs/AGENTS.md","offset":1,"limit":200} code
summary: Text-to-speech (TTS) สำหรับคำตอบขาออก
title: Text-to-Speech
x-i18n:
    generated_at: "2026-04-23T06:04:32Z"
    model: gpt-5.4
    provider: openai
    source_hash: be8f5a8ce90c56bcce58723702d51154fea3f9fd27a69ace144e2b1e5bdd7049
    source_path: tools/tts.md
    workflow: 15
---

# Text-to-speech (TTS)

OpenClaw สามารถแปลงคำตอบขาออกเป็นเสียงด้วย ElevenLabs, Google Gemini, Microsoft, MiniMax, OpenAI หรือ xAI
มันทำงานได้ทุกที่ที่ OpenClaw สามารถส่งเสียงได้

## บริการที่รองรับ

- **ElevenLabs** (provider หลักหรือ fallback)
- **Google Gemini** (provider หลักหรือ fallback; ใช้ Gemini API TTS)
- **Microsoft** (provider หลักหรือ fallback; implementation แบบ bundled ปัจจุบันใช้ `node-edge-tts`)
- **MiniMax** (provider หลักหรือ fallback; ใช้ T2A v2 API)
- **OpenAI** (provider หลักหรือ fallback; ใช้สำหรับสรุปด้วย)
- **xAI** (provider หลักหรือ fallback; ใช้ xAI TTS API)

### หมายเหตุเกี่ยวกับ Microsoft speech

provider ด้าน speech ของ Microsoft ที่มากับระบบในปัจจุบันใช้บริการ
neural TTS ออนไลน์ของ Microsoft Edge ผ่านไลบรารี `node-edge-tts` นี่เป็นบริการแบบโฮสต์ (ไม่ใช่
ในเครื่อง) ใช้ endpoint ของ Microsoft และไม่ต้องใช้ API key
`node-edge-tts` เปิดเผยตัวเลือกการกำหนดค่าเสียงพูดและรูปแบบเอาต์พุต แต่
ไม่ใช่ทุกตัวเลือกที่จะรองรับโดยบริการ อินพุต config และ directive แบบเดิมที่ใช้
`edge` ยังใช้งานได้และจะถูก normalize เป็น `microsoft`

เนื่องจากเส้นทางนี้เป็นบริการเว็บสาธารณะที่ไม่มี SLA หรือ quota ที่เผยแพร่อย่างเป็นทางการ
ให้ถือว่าเป็นแบบ best-effort หากคุณต้องการขีดจำกัดและการสนับสนุนที่รับประกัน ให้ใช้ OpenAI
หรือ ElevenLabs

## คีย์แบบไม่บังคับ

หากคุณต้องการใช้ OpenAI, ElevenLabs, Google Gemini, MiniMax หรือ xAI:

- `ELEVENLABS_API_KEY` (หรือ `XI_API_KEY`)
- `GEMINI_API_KEY` (หรือ `GOOGLE_API_KEY`)
- `MINIMAX_API_KEY`
- `OPENAI_API_KEY`
- `XAI_API_KEY`

Microsoft speech **ไม่** ต้องใช้ API key

หากกำหนดค่าหลาย provider ไว้ จะใช้ provider ที่เลือกก่อน และตัวอื่นจะเป็นตัวเลือก fallback
การสรุปอัตโนมัติจะใช้ `summaryModel` ที่กำหนดไว้ (หรือ `agents.defaults.model.primary`)
ดังนั้น provider นั้นต้องได้รับการยืนยันตัวตนด้วย หากคุณเปิดใช้การสรุป

## ลิงก์บริการ

- [คู่มือ OpenAI Text-to-Speech](https://platform.openai.com/docs/guides/text-to-speech)
- [เอกสารอ้างอิง OpenAI Audio API](https://platform.openai.com/docs/api-reference/audio)
- [ElevenLabs Text to Speech](https://elevenlabs.io/docs/api-reference/text-to-speech)
- [ElevenLabs Authentication](https://elevenlabs.io/docs/api-reference/authentication)
- [MiniMax T2A v2 API](https://platform.minimaxi.com/document/T2A%20V2)
- [node-edge-tts](https://github.com/SchneeHertz/node-edge-tts)
- [รูปแบบเอาต์พุต Microsoft Speech](https://learn.microsoft.com/azure/ai-services/speech-service/rest-text-to-speech#audio-outputs)
- [xAI Text to Speech](https://docs.x.ai/developers/rest-api-reference/inference/voice#text-to-speech-rest)

## เปิดใช้โดยค่าเริ่มต้นหรือไม่?

ไม่ การทำ Auto‑TTS **ปิดอยู่** โดยค่าเริ่มต้น ให้เปิดใช้ใน config ด้วย
`messages.tts.auto` หรือในเครื่องด้วย `/tts on`

เมื่อยังไม่ได้ตั้ง `messages.tts.provider` OpenClaw จะเลือก speech provider ตัวแรก
ที่กำหนดค่าไว้ตามลำดับ auto-select ของ registry

## การกำหนดค่า

config ของ TTS อยู่ภายใต้ `messages.tts` ใน `openclaw.json`
schema แบบเต็มอยู่ใน [Gateway configuration](/th/gateway/configuration)

### config ขั้นต่ำ (เปิดใช้ + provider)

```json5
{
  messages: {
    tts: {
      auto: "always",
      provider: "elevenlabs",
    },
  },
}
```

### OpenAI เป็นหลัก พร้อม ElevenLabs เป็น fallback

```json5
{
  messages: {
    tts: {
      auto: "always",
      provider: "openai",
      summaryModel: "openai/gpt-4.1-mini",
      modelOverrides: {
        enabled: true,
      },
      providers: {
        openai: {
          apiKey: "openai_api_key",
          baseUrl: "https://api.openai.com/v1",
          model: "gpt-4o-mini-tts",
          voice: "alloy",
        },
        elevenlabs: {
          apiKey: "elevenlabs_api_key",
          baseUrl: "https://api.elevenlabs.io",
          voiceId: "voice_id",
          modelId: "eleven_multilingual_v2",
          seed: 42,
          applyTextNormalization: "auto",
          languageCode: "en",
          voiceSettings: {
            stability: 0.5,
            similarityBoost: 0.75,
            style: 0.0,
            useSpeakerBoost: true,
            speed: 1.0,
          },
        },
      },
    },
  },
}
```

### Microsoft เป็นหลัก (ไม่ต้องใช้ API key)

```json5
{
  messages: {
    tts: {
      auto: "always",
      provider: "microsoft",
      providers: {
        microsoft: {
          enabled: true,
          voice: "en-US-MichelleNeural",
          lang: "en-US",
          outputFormat: "audio-24khz-48kbitrate-mono-mp3",
          rate: "+10%",
          pitch: "-5%",
        },
      },
    },
  },
}
```

### MiniMax เป็นหลัก

```json5
{
  messages: {
    tts: {
      auto: "always",
      provider: "minimax",
      providers: {
        minimax: {
          apiKey: "minimax_api_key",
          baseUrl: "https://api.minimax.io",
          model: "speech-2.8-hd",
          voiceId: "English_expressive_narrator",
          speed: 1.0,
          vol: 1.0,
          pitch: 0,
        },
      },
    },
  },
}
```

### Google Gemini เป็นหลัก

```json5
{
  messages: {
    tts: {
      auto: "always",
      provider: "google",
      providers: {
        google: {
          apiKey: "gemini_api_key",
          model: "gemini-3.1-flash-tts-preview",
          voiceName: "Kore",
        },
      },
    },
  },
}
```

Google Gemini TTS ใช้พาธ API key ของ Gemini คีย์ API จาก Google Cloud Console ที่
จำกัดไว้เฉพาะ Gemini API ใช้ได้ที่นี่ และเป็นรูปแบบคีย์เดียวกับที่ใช้
โดย provider สำหรับ image-generation ของ Google ที่มากับระบบ ลำดับการ resolve คือ
`messages.tts.providers.google.apiKey` -> `models.providers.google.apiKey` ->
`GEMINI_API_KEY` -> `GOOGLE_API_KEY`

### xAI เป็นหลัก

```json5
{
  messages: {
    tts: {
      auto: "always",
      provider: "xai",
      providers: {
        xai: {
          apiKey: "xai_api_key",
          voiceId: "eve",
          language: "en",
          responseFormat: "mp3",
          speed: 1.0,
        },
      },
    },
  },
}
```

xAI TTS ใช้พาธ `XAI_API_KEY` เดียวกับ provider โมเดล Grok ที่มากับระบบ
ลำดับการ resolve คือ `messages.tts.providers.xai.apiKey` -> `XAI_API_KEY`
เสียงที่มีใช้งานอยู่ปัจจุบันคือ `ara`, `eve`, `leo`, `rex`, `sal` และ `una`; `eve`
เป็นค่าเริ่มต้น `language` รองรับแท็ก BCP-47 หรือ `auto`

### ปิดการใช้งาน Microsoft speech

```json5
{
  messages: {
    tts: {
      providers: {
        microsoft: {
          enabled: false,
        },
      },
    },
  },
}
```

### ขีดจำกัดแบบกำหนดเอง + พาธ prefs

```json5
{
  messages: {
    tts: {
      auto: "always",
      maxTextLength: 4000,
      timeoutMs: 30000,
      prefsPath: "~/.openclaw/settings/tts.json",
    },
  },
}
```

### ตอบกลับด้วยเสียงเฉพาะหลังจากได้รับข้อความเสียงขาเข้า

```json5
{
  messages: {
    tts: {
      auto: "inbound",
    },
  },
}
```

### ปิดการสรุปอัตโนมัติสำหรับคำตอบยาว

```json5
{
  messages: {
    tts: {
      auto: "always",
    },
  },
}
```

จากนั้นรัน:

```
/tts summary off
```

### หมายเหตุเกี่ยวกับฟิลด์

- `auto`: โหมด auto‑TTS (`off`, `always`, `inbound`, `tagged`)
  - `inbound` จะส่งเสียงเฉพาะหลังจากได้รับข้อความเสียงขาเข้า
  - `tagged` จะส่งเสียงเฉพาะเมื่อคำตอบมี directive `[[tts:key=value]]` หรือบล็อก `[[tts:text]]...[[/tts:text]]`
- `enabled`: สวิตช์แบบเดิม (doctor จะย้ายค่านี้ไปยัง `auto`)
- `mode`: `"final"` (ค่าเริ่มต้น) หรือ `"all"` (รวมคำตอบจากเครื่องมือ/บล็อก)
- `provider`: รหัส speech provider เช่น `"elevenlabs"`, `"google"`, `"microsoft"`, `"minimax"` หรือ `"openai"` (fallback เป็นอัตโนมัติ)
- หาก **ไม่** ตั้ง `provider`, OpenClaw จะใช้ speech provider ตัวแรกที่กำหนดค่าไว้ตามลำดับ auto-select ของ registry
- `provider: "edge"` แบบเดิมยังใช้งานได้และจะถูก normalize เป็น `microsoft`
- `summaryModel`: โมเดลราคาถูกแบบไม่บังคับสำหรับการสรุปอัตโนมัติ; ค่าเริ่มต้นคือ `agents.defaults.model.primary`
  - รองรับ `provider/model` หรือ model alias ที่กำหนดค่าไว้
- `modelOverrides`: อนุญาตให้โมเดลส่ง directive ของ TTS (เปิดใช้โดยค่าเริ่มต้น)
  - `allowProvider` มีค่าเริ่มต้นเป็น `false` (การสลับ provider ต้องเลือกเปิดเอง)
- `providers.<id>`: การตั้งค่าที่เป็นของ provider โดยใช้รหัส speech provider เป็นคีย์
- บล็อก provider แบบตรงตัวรุ่นเดิม (`messages.tts.openai`, `messages.tts.elevenlabs`, `messages.tts.microsoft`, `messages.tts.edge`) จะถูกย้ายอัตโนมัติไปยัง `messages.tts.providers.<id>` ตอนโหลด
- `maxTextLength`: เพดานแบบ hard cap สำหรับอินพุตของ TTS (อักขระ) `/tts audio` จะล้มเหลวหากเกิน
- `timeoutMs`: timeout ของคำขอ (ms)
- `prefsPath`: override พาธของ prefs JSON ในเครื่อง (provider/limit/summary)
- ค่า `apiKey` จะ fallback ไปยัง env var (`ELEVENLABS_API_KEY`/`XI_API_KEY`, `GEMINI_API_KEY`/`GOOGLE_API_KEY`, `MINIMAX_API_KEY`, `OPENAI_API_KEY`)
- `providers.elevenlabs.baseUrl`: override base URL ของ ElevenLabs API
- `providers.openai.baseUrl`: override endpoint ของ OpenAI TTS
  - ลำดับการ resolve: `messages.tts.providers.openai.baseUrl` -> `OPENAI_TTS_BASE_URL` -> `https://api.openai.com/v1`
  - ค่าที่ไม่ใช่ค่าเริ่มต้นจะถูกปฏิบัติเป็น endpoint ของ TTS แบบ OpenAI-compatible ดังนั้นจึงยอมรับชื่อโมเดลและเสียงแบบกำหนดเองได้
- `providers.elevenlabs.voiceSettings`:
  - `stability`, `similarityBoost`, `style`: `0..1`
  - `useSpeakerBoost`: `true|false`
  - `speed`: `0.5..2.0` (1.0 = ปกติ)
- `providers.elevenlabs.applyTextNormalization`: `auto|on|off`
- `providers.elevenlabs.languageCode`: ISO 639-1 แบบ 2 ตัวอักษร (เช่น `en`, `de`)
- `providers.elevenlabs.seed`: จำนวนเต็ม `0..4294967295` (determinism แบบ best-effort)
- `providers.minimax.baseUrl`: override MiniMax API base URL (ค่าเริ่มต้น `https://api.minimax.io`, env: `MINIMAX_API_HOST`)
- `providers.minimax.model`: โมเดล TTS (ค่าเริ่มต้น `speech-2.8-hd`, env: `MINIMAX_TTS_MODEL`)
- `providers.minimax.voiceId`: ตัวระบุเสียง (ค่าเริ่มต้น `English_expressive_narrator`, env: `MINIMAX_TTS_VOICE_ID`)
- `providers.minimax.speed`: ความเร็วการเล่น `0.5..2.0` (ค่าเริ่มต้น 1.0)
- `providers.minimax.vol`: ระดับเสียง `(0, 10]` (ค่าเริ่มต้น 1.0; ต้องมากกว่า 0)
- `providers.minimax.pitch`: การเลื่อน pitch `-12..12` (ค่าเริ่มต้น 0)
- `providers.google.model`: โมเดล Gemini TTS (ค่าเริ่มต้น `gemini-3.1-flash-tts-preview`)
- `providers.google.voiceName`: ชื่อเสียงที่มีมาให้ของ Gemini (ค่าเริ่มต้น `Kore`; รองรับ `voice` ด้วย)
- `providers.google.baseUrl`: override base URL ของ Gemini API รองรับเฉพาะ `https://generativelanguage.googleapis.com`
  - หากไม่ระบุ `messages.tts.providers.google.apiKey`, TTS สามารถนำ `models.providers.google.apiKey` กลับมาใช้ก่อน fallback ไปยัง env ได้
- `providers.xai.apiKey`: xAI TTS API key (env: `XAI_API_KEY`)
- `providers.xai.baseUrl`: override base URL ของ xAI TTS (ค่าเริ่มต้น `https://api.x.ai/v1`, env: `XAI_BASE_URL`)
- `providers.xai.voiceId`: รหัสเสียงของ xAI (ค่าเริ่มต้น `eve`; เสียงที่มีใช้งานปัจจุบัน: `ara`, `eve`, `leo`, `rex`, `sal`, `una`)
- `providers.xai.language`: รหัสภาษาแบบ BCP-47 หรือ `auto` (ค่าเริ่มต้น `en`)
- `providers.xai.responseFormat`: `mp3`, `wav`, `pcm`, `mulaw` หรือ `alaw` (ค่าเริ่มต้น `mp3`)
- `providers.xai.speed`: override ความเร็วแบบ native ของ provider
- `providers.microsoft.enabled`: อนุญาตการใช้ Microsoft speech (ค่าเริ่มต้น `true`; ไม่ต้องใช้ API key)
- `providers.microsoft.voice`: ชื่อเสียง neural ของ Microsoft (เช่น `en-US-MichelleNeural`)
- `providers.microsoft.lang`: รหัสภาษา (เช่น `en-US`)
- `providers.microsoft.outputFormat`: รูปแบบเอาต์พุตของ Microsoft (เช่น `audio-24khz-48kbitrate-mono-mp3`)
  - ดู Microsoft Speech output formats สำหรับค่าที่ใช้ได้; ไม่ใช่ทุก format ที่จะรองรับโดย transport แบบ Edge-backed ที่มากับระบบ
- `providers.microsoft.rate` / `providers.microsoft.pitch` / `providers.microsoft.volume`: สตริงแบบเปอร์เซ็นต์ (เช่น `+10%`, `-5%`)
- `providers.microsoft.saveSubtitles`: เขียน subtitle แบบ JSON ควบคู่กับไฟล์เสียง
- `providers.microsoft.proxy`: proxy URL สำหรับคำขอ Microsoft speech
- `providers.microsoft.timeoutMs`: override timeout ของคำขอ (ms)
- `edge.*`: alias แบบเดิมสำหรับการตั้งค่า Microsoft เดียวกัน

## การ override ที่ขับเคลื่อนโดยโมเดล (เปิดใช้โดยค่าเริ่มต้น)

โดยค่าเริ่มต้น โมเดล **สามารถ** ส่ง directive ของ TTS สำหรับคำตอบหนึ่งรายการได้
เมื่อ `messages.tts.auto` เป็น `tagged`, จำเป็นต้องมี directive เหล่านี้จึงจะทริกเกอร์เสียงได้

เมื่อเปิดใช้ โมเดลสามารถส่ง directive `[[tts:...]]` เพื่อ override เสียง
สำหรับคำตอบหนึ่งรายการได้ พร้อมกับบล็อก `[[tts:text]]...[[/tts:text]]` แบบไม่บังคับ เพื่อ
ให้แท็กเชิงการแสดงออก (เสียงหัวเราะ คิวร้องเพลง ฯลฯ) ที่ควรปรากฏเฉพาะใน
เสียงเท่านั้น

directive `provider=...` จะถูกเพิกเฉย เว้นแต่ `modelOverrides.allowProvider: true`

ตัวอย่าง payload ของคำตอบ:

```
Here you go.

[[tts:voiceId=pMsXgVXv3BLzUgSXRplE model=eleven_v3 speed=1.1]]
[[tts:text]](laughs) Read the song once more.[[/tts:text]]
```

คีย์ directive ที่ใช้ได้ (เมื่อเปิดใช้):

- `provider` (รหัส speech provider ที่ลงทะเบียนไว้ เช่น `openai`, `elevenlabs`, `google`, `minimax` หรือ `microsoft`; ต้องมี `allowProvider: true`)
- `voice` (เสียงของ OpenAI), `voiceName` / `voice_name` / `google_voice` (เสียงของ Google) หรือ `voiceId` (ElevenLabs / MiniMax / xAI)
- `model` (โมเดล OpenAI TTS, รหัสโมเดลของ ElevenLabs หรือโมเดล MiniMax) หรือ `google_model` (โมเดล Google TTS)
- `stability`, `similarityBoost`, `style`, `speed`, `useSpeakerBoost`
- `vol` / `volume` (ระดับเสียงของ MiniMax, 0-10)
- `pitch` (pitch ของ MiniMax, -12 ถึง 12)
- `applyTextNormalization` (`auto|on|off`)
- `languageCode` (ISO 639-1)
- `seed`

ปิด model override ทั้งหมด:

```json5
{
  messages: {
    tts: {
      modelOverrides: {
        enabled: false,
      },
    },
  },
}
```

allowlist แบบไม่บังคับ (เปิดให้สลับ provider ได้ ขณะยังคงให้ตั้งค่าปุ่มอื่นได้):

```json5
{
  messages: {
    tts: {
      modelOverrides: {
        enabled: true,
        allowProvider: true,
        allowSeed: false,
      },
    },
  },
}
```

## การตั้งค่าต่อผู้ใช้

slash command จะเขียน override ในเครื่องไปยัง `prefsPath` (ค่าเริ่มต้น:
`~/.openclaw/settings/tts.json`, override ได้ด้วย `OPENCLAW_TTS_PREFS` หรือ
`messages.tts.prefsPath`)

ฟิลด์ที่จัดเก็บ:

- `enabled`
- `provider`
- `maxLength` (threshold สำหรับสรุป; ค่าเริ่มต้น 1500 อักขระ)
- `summarize` (ค่าเริ่มต้น `true`)

ฟิลด์เหล่านี้จะ override `messages.tts.*` สำหรับโฮสต์นั้น

## รูปแบบเอาต์พุต (ตายตัว)

- **Feishu / Matrix / Telegram / WhatsApp**: ข้อความเสียงแบบ Opus (`opus_48000_64` จาก ElevenLabs, `opus` จาก OpenAI)
  - 48kHz / 64kbps เป็นจุดสมดุลที่ดีสำหรับข้อความเสียง
- **ช่องทางอื่น**: MP3 (`mp3_44100_128` จาก ElevenLabs, `mp3` จาก OpenAI)
  - 44.1kHz / 128kbps เป็นสมดุลเริ่มต้นสำหรับความชัดเจนของเสียงพูด
- **MiniMax**: MP3 (โมเดล `speech-2.8-hd`, อัตราสุ่มตัวอย่าง 32kHz) ไม่รองรับรูปแบบ voice-note แบบ native; ใช้ OpenAI หรือ ElevenLabs หากคุณต้องการข้อความเสียง Opus ที่รับประกันได้
- **Google Gemini**: Gemini API TTS จะคืนค่า PCM แบบดิบที่ 24kHz OpenClaw จะห่อมันเป็น WAV สำหรับไฟล์แนบเสียง และคืน PCM โดยตรงสำหรับ Talk/telephony พาธนี้ไม่รองรับรูปแบบ voice-note แบบ Opus โดย native
- **xAI**: ค่าเริ่มต้นเป็น MP3; `responseFormat` อาจเป็น `mp3`, `wav`, `pcm`, `mulaw` หรือ `alaw` OpenClaw ใช้ endpoint batch REST TTS ของ xAI และคืนไฟล์แนบเสียงที่สมบูรณ์; provider path นี้ไม่ได้ใช้ WebSocket TTS แบบสตรีมของ xAI พาธนี้ไม่รองรับรูปแบบ voice-note แบบ Opus โดย native
- **Microsoft**: ใช้ `microsoft.outputFormat` (ค่าเริ่มต้น `audio-24khz-48kbitrate-mono-mp3`)
  - transport ที่มากับระบบรองรับ `outputFormat` แต่ไม่ใช่ทุก format ที่มีให้จากบริการ
  - ค่า output format เป็นไปตาม Microsoft Speech output formats (รวมถึง Ogg/WebM Opus)
  - `sendVoice` ของ Telegram รองรับ OGG/MP3/M4A; ใช้ OpenAI/ElevenLabs หากคุณต้องการ
    ข้อความเสียง Opus ที่รับประกันได้
  - หาก output format ของ Microsoft ที่ตั้งค่าไว้ล้มเหลว OpenClaw จะลองใหม่ด้วย MP3

รูปแบบเอาต์พุตของ OpenAI/ElevenLabs ถูกกำหนดตายตัวตามช่องทาง (ดูด้านบน)

## พฤติกรรมของ Auto-TTS

เมื่อเปิดใช้ OpenClaw จะ:

- ข้าม TTS หากคำตอบมีสื่ออยู่แล้ว หรือมี directive `MEDIA:`
- ข้ามคำตอบที่สั้นมาก (< 10 อักขระ)
- สรุปคำตอบที่ยาวเมื่อเปิดใช้งาน โดยใช้ `agents.defaults.model.primary` (หรือ `summaryModel`)
- แนบเสียงที่สร้างขึ้นไปกับคำตอบ

หากคำตอบยาวเกิน `maxLength` และปิดการสรุปอยู่ (หรือไม่มี API key สำหรับ
summary model) ระบบจะข้ามเสียง
และส่งคำตอบข้อความปกติแทน

## แผนภาพโฟลว์

```
Reply -> เปิดใช้ TTS หรือไม่?
  no  -> ส่งข้อความ
  yes -> มีสื่อ / MEDIA: / สั้นหรือไม่?
          yes -> ส่งข้อความ
          no  -> ความยาว > limit?
                   no  -> TTS -> แนบเสียง
                   yes -> เปิดใช้การสรุปหรือไม่?
                            no  -> ส่งข้อความ
                            yes -> สรุป (summaryModel หรือ agents.defaults.model.primary)
                                      -> TTS -> แนบเสียง
```

## การใช้ slash command

มีคำสั่งเดียว: `/tts`
ดู [Slash commands](/th/tools/slash-commands) สำหรับรายละเอียดการเปิดใช้งาน

หมายเหตุสำหรับ Discord: `/tts` เป็นคำสั่ง built-in ของ Discord ดังนั้น OpenClaw จึงลงทะเบียน
`/voice` เป็นคำสั่ง native แทนที่นั่น ส่วนข้อความ `/tts ...` ยังใช้งานได้

```
/tts off
/tts on
/tts status
/tts provider openai
/tts limit 2000
/tts summary off
/tts audio Hello from OpenClaw
```

หมายเหตุ:

- คำสั่งต้องมาจากผู้ส่งที่ได้รับอนุญาต (กฎ allowlist/owner ยังคงมีผล)
- ต้องเปิดใช้ `commands.text` หรือการลงทะเบียนคำสั่ง native
- config `messages.tts.auto` รองรับ `off|always|inbound|tagged`
- `/tts on` จะเขียนค่าการตั้งค่า TTS ในเครื่องเป็น `always`; `/tts off` จะเขียนเป็น `off`
- ใช้ config เมื่อต้องการค่าเริ่มต้นแบบ `inbound` หรือ `tagged`
- `limit` และ `summary` จะถูกเก็บไว้ใน prefs ในเครื่อง ไม่ใช่ config หลัก
- `/tts audio` จะสร้างคำตอบเสียงแบบครั้งเดียว (ไม่ได้เปิด TTS ถาวร)
- `/tts status` มีการมองเห็น fallback สำหรับความพยายามล่าสุด:
  - fallback สำเร็จ: `Fallback: <primary> -> <used>` พร้อม `Attempts: ...`
  - ล้มเหลว: `Error: ...` พร้อม `Attempts: ...`
  - การวินิจฉัยแบบละเอียด: `Attempt details: provider:outcome(reasonCode) latency`
- ความล้มเหลวของ API จาก OpenAI และ ElevenLabs ตอนนี้จะรวมรายละเอียดข้อผิดพลาดของ provider ที่ parse แล้วและ request id (เมื่อ provider ส่งกลับมา) ซึ่งจะแสดงในข้อผิดพลาด/ล็อกของ TTS

## เครื่องมือของเอเจนต์

เครื่องมือ `tts` จะแปลงข้อความเป็นเสียงและคืนไฟล์แนบเสียงสำหรับ
การส่งคำตอบ เมื่อช่องทางเป็น Feishu, Matrix, Telegram หรือ WhatsApp
เสียงจะถูกส่งเป็นข้อความเสียงแทนไฟล์แนบ

## Gateway RPC

เมธอดของ Gateway:

- `tts.status`
- `tts.enable`
- `tts.disable`
- `tts.convert`
- `tts.setProvider`
- `tts.providers`
