---
read_when:
    - การเปิดใช้การแปลงข้อความเป็นเสียงพูดสำหรับการตอบกลับ
    - การกำหนดค่าผู้ให้บริการ TTS หรือขีดจำกัด
    - การใช้คำสั่ง `/tts`
summary: การแปลงข้อความเป็นเสียงพูด (TTS) สำหรับการตอบกลับขาออก
title: การแปลงข้อความเป็นเสียงพูด【อ่านข้อความเต็มanalysis to=final code  omitted because final must only translated text? Wait user asks for translation phrase only. Need translate next user likely omitted? Actually need answer latest user "Text-to-speech" only. Already answered maybe continue? Need respond to latest only.
x-i18n:
    generated_at: "2026-04-24T09:39:07Z"
    model: gpt-5.4
    provider: openai
    source_hash: 935fec2325a08da6f4ecd8ba5a9b889cd265025c5c7ee43bc4e0da36c1003d8f
    source_path: tools/tts.md
    workflow: 15
---

OpenClaw สามารถแปลงการตอบกลับขาออกเป็นเสียงได้โดยใช้ ElevenLabs, Google Gemini, Microsoft, MiniMax, OpenAI หรือ xAI
และทำงานได้ทุกที่ที่ OpenClaw สามารถส่งเสียงได้

## บริการที่รองรับ

- **ElevenLabs** (ผู้ให้บริการหลักหรือผู้ให้บริการสำรอง)
- **Google Gemini** (ผู้ให้บริการหลักหรือผู้ให้บริการสำรอง; ใช้ Gemini API TTS)
- **Microsoft** (ผู้ให้บริการหลักหรือผู้ให้บริการสำรอง; implementation ที่มาพร้อมกันในปัจจุบันใช้ `node-edge-tts`)
- **MiniMax** (ผู้ให้บริการหลักหรือผู้ให้บริการสำรอง; ใช้ T2A v2 API)
- **OpenAI** (ผู้ให้บริการหลักหรือผู้ให้บริการสำรอง; ใช้สำหรับสรุปด้วย)
- **xAI** (ผู้ให้บริการหลักหรือผู้ให้บริการสำรอง; ใช้ xAI TTS API)

### หมายเหตุเกี่ยวกับ Microsoft speech

ผู้ให้บริการ speech ของ Microsoft ที่มาพร้อมกันในปัจจุบันใช้บริการ neural TTS ออนไลน์ของ Microsoft Edge
ผ่านไลบรารี `node-edge-tts` นี่เป็นบริการแบบโฮสต์ (ไม่ใช่แบบ local)
ใช้ endpoint ของ Microsoft และไม่ต้องใช้คีย์ API
`node-edge-tts` เปิดให้ใช้ตัวเลือกการกำหนดค่า speech และรูปแบบเอาต์พุต แต่
ไม่ใช่ทุกตัวเลือกที่จะได้รับการรองรับโดยบริการนี้ อินพุต config และ directive แบบ legacy
ที่ใช้ `edge` ยังคงใช้งานได้และจะถูกทำให้เป็น `microsoft`

เนื่องจากเส้นทางนี้เป็นบริการเว็บสาธารณะที่ไม่มี SLA หรือโควตาที่ประกาศไว้
จึงควรมองว่าเป็นแบบ best-effort หากคุณต้องการขีดจำกัดที่รับประกันได้และการสนับสนุน ให้ใช้ OpenAI
หรือ ElevenLabs

## คีย์ที่ไม่บังคับ

หากคุณต้องการใช้ OpenAI, ElevenLabs, Google Gemini, MiniMax หรือ xAI:

- `ELEVENLABS_API_KEY` (หรือ `XI_API_KEY`)
- `GEMINI_API_KEY` (หรือ `GOOGLE_API_KEY`)
- `MINIMAX_API_KEY`
- `OPENAI_API_KEY`
- `XAI_API_KEY`

Microsoft speech **ไม่** ต้องใช้คีย์ API

หากกำหนดค่าผู้ให้บริการหลายราย ระบบจะใช้ผู้ให้บริการที่เลือกก่อน และใช้รายอื่นเป็นตัวสำรอง
การสรุปอัตโนมัติจะใช้ `summaryModel` ที่กำหนดไว้ (หรือ `agents.defaults.model.primary`)
ดังนั้นผู้ให้บริการนั้นต้องผ่านการยืนยันตัวตนด้วยเช่นกันหากคุณเปิดใช้การสรุป

## ลิงก์บริการ

- [คู่มือ OpenAI Text-to-Speech](https://platform.openai.com/docs/guides/text-to-speech)
- [เอกสารอ้างอิง OpenAI Audio API](https://platform.openai.com/docs/api-reference/audio)
- [ElevenLabs Text to Speech](https://elevenlabs.io/docs/api-reference/text-to-speech)
- [ElevenLabs Authentication](https://elevenlabs.io/docs/api-reference/authentication)
- [MiniMax T2A v2 API](https://platform.minimaxi.com/document/T2A%20V2)
- [node-edge-tts](https://github.com/SchneeHertz/node-edge-tts)
- [Microsoft Speech output formats](https://learn.microsoft.com/azure/ai-services/speech-service/rest-text-to-speech#audio-outputs)
- [xAI Text to Speech](https://docs.x.ai/developers/rest-api-reference/inference/voice#text-to-speech-rest)

## เปิดใช้งานเป็นค่าเริ่มต้นหรือไม่?

ไม่ Auto‑TTS ถูก**ปิด**ไว้เป็นค่าเริ่มต้น เปิดใช้งานได้ใน config ด้วย
`messages.tts.auto` หรือเฉพาะที่ด้วย `/tts on`

เมื่อไม่ได้ตั้งค่า `messages.tts.provider` OpenClaw จะเลือก
ผู้ให้บริการ speech รายแรกที่ถูกกำหนดค่าไว้ตามลำดับการเลือกอัตโนมัติของรีจิสทรี

## Config

config ของ TTS อยู่ใต้ `messages.tts` ใน `openclaw.json`
schema แบบเต็มอยู่ใน [Gateway configuration](/th/gateway/configuration)

### config ขั้นต่ำ (เปิดใช้งาน + ผู้ให้บริการ)

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

### OpenAI เป็นหลักพร้อม ElevenLabs เป็นตัวสำรอง

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

### Microsoft เป็นหลัก (ไม่ต้องใช้คีย์ API)

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

Google Gemini TTS ใช้เส้นทางคีย์ API ของ Gemini คีย์ API จาก Google Cloud Console
ที่จำกัดไว้เฉพาะ Gemini API สามารถใช้ได้ที่นี่ และเป็นคีย์รูปแบบเดียวกับที่ใช้
โดยผู้ให้บริการสร้างภาพ Google ที่มาพร้อมกัน ลำดับการ resolve คือ
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

xAI TTS ใช้เส้นทาง `XAI_API_KEY` เดียวกับผู้ให้บริการโมเดล Grok ที่มาพร้อมกัน
ลำดับการ resolve คือ `messages.tts.providers.xai.apiKey` -> `XAI_API_KEY`
เสียงที่ใช้งานได้ในปัจจุบันคือ `ara`, `eve`, `leo`, `rex`, `sal` และ `una`; `eve` คือ
ค่าเริ่มต้น `language` รองรับแท็ก BCP-47 หรือ `auto`

### ปิด Microsoft speech

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

### กำหนดขีดจำกัดเอง + เส้นทาง prefs

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

### ตอบกลับด้วยเสียงเท่านั้นหลังจากได้รับข้อความเสียงขาเข้า

```json5
{
  messages: {
    tts: {
      auto: "inbound",
    },
  },
}
```

### ปิด auto-summary สำหรับการตอบกลับที่ยาว

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

### หมายเหตุเกี่ยวกับฟิลด์ต่างๆ

- `auto`: โหมด auto‑TTS (`off`, `always`, `inbound`, `tagged`)
  - `inbound` จะส่งเสียงหลังจากได้รับข้อความเสียงขาเข้าเท่านั้น
  - `tagged` จะส่งเสียงเฉพาะเมื่อคำตอบมี directive `[[tts:key=value]]` หรือบล็อก `[[tts:text]]...[[/tts:text]]`
- `enabled`: สวิตช์แบบ legacy (doctor จะย้ายค่านี้ไปเป็น `auto`)
- `mode`: `"final"` (ค่าเริ่มต้น) หรือ `"all"` (รวมการตอบกลับจาก tool/block)
- `provider`: รหัสผู้ให้บริการ speech เช่น `"elevenlabs"`, `"google"`, `"microsoft"`, `"minimax"` หรือ `"openai"` (fallback เป็นอัตโนมัติ)
- หาก **ไม่ได้ตั้งค่า** `provider`, OpenClaw จะใช้ผู้ให้บริการ speech รายแรกที่ถูกกำหนดค่าไว้ตามลำดับการเลือกอัตโนมัติของรีจิสทรี
- `provider: "edge"` แบบ legacy ยังคงใช้งานได้และจะถูกทำให้เป็น `microsoft`
- `summaryModel`: โมเดลราคาประหยัดแบบไม่บังคับสำหรับ auto-summary; ค่าเริ่มต้นคือ `agents.defaults.model.primary`
  - รองรับ `provider/model` หรือ model alias ที่กำหนดค่าไว้
- `modelOverrides`: อนุญาตให้โมเดลส่ง directive ของ TTS ได้ (เปิดอยู่โดยค่าเริ่มต้น)
  - `allowProvider` มีค่าเริ่มต้นเป็น `false` (การสลับ provider ต้องเปิดใช้เอง)
- `providers.<id>`: การตั้งค่าที่ผู้ให้บริการเป็นเจ้าของ โดยระบุด้วยรหัสผู้ให้บริการ speech
- บล็อกผู้ให้บริการโดยตรงแบบ legacy (`messages.tts.openai`, `messages.tts.elevenlabs`, `messages.tts.microsoft`, `messages.tts.edge`) จะถูกย้ายอัตโนมัติไปยัง `messages.tts.providers.<id>` ตอนโหลด
- `maxTextLength`: เพดานสูงสุดแบบตายตัวสำหรับอินพุต TTS (จำนวนอักขระ) `/tts audio` จะล้มเหลวหากเกิน
- `timeoutMs`: ระยะหมดเวลาของคำขอ (มิลลิวินาที)
- `prefsPath`: override เส้นทางของไฟล์ prefs JSON ในเครื่อง (provider/limit/summary)
- ค่า `apiKey` จะ fallback ไปใช้ env vars (`ELEVENLABS_API_KEY`/`XI_API_KEY`, `GEMINI_API_KEY`/`GOOGLE_API_KEY`, `MINIMAX_API_KEY`, `OPENAI_API_KEY`)
- `providers.elevenlabs.baseUrl`: override URL ฐานของ ElevenLabs API
- `providers.openai.baseUrl`: override endpoint ของ OpenAI TTS
  - ลำดับการ resolve: `messages.tts.providers.openai.baseUrl` -> `OPENAI_TTS_BASE_URL` -> `https://api.openai.com/v1`
  - ค่าที่ไม่ใช่ค่าเริ่มต้นจะถือเป็น endpoint TTS ที่เข้ากันได้กับ OpenAI ดังนั้นจึงรองรับชื่อโมเดลและเสียงแบบกำหนดเอง
- `providers.elevenlabs.voiceSettings`:
  - `stability`, `similarityBoost`, `style`: `0..1`
  - `useSpeakerBoost`: `true|false`
  - `speed`: `0.5..2.0` (1.0 = ปกติ)
- `providers.elevenlabs.applyTextNormalization`: `auto|on|off`
- `providers.elevenlabs.languageCode`: ISO 639-1 แบบ 2 ตัวอักษร (เช่น `en`, `de`)
- `providers.elevenlabs.seed`: จำนวนเต็ม `0..4294967295` (ความคงที่แบบ best-effort)
- `providers.minimax.baseUrl`: override URL ฐานของ MiniMax API (ค่าเริ่มต้น `https://api.minimax.io`, env: `MINIMAX_API_HOST`)
- `providers.minimax.model`: โมเดล TTS (ค่าเริ่มต้น `speech-2.8-hd`, env: `MINIMAX_TTS_MODEL`)
- `providers.minimax.voiceId`: ตัวระบุเสียง (ค่าเริ่มต้น `English_expressive_narrator`, env: `MINIMAX_TTS_VOICE_ID`)
- `providers.minimax.speed`: ความเร็วในการเล่น `0.5..2.0` (ค่าเริ่มต้น 1.0)
- `providers.minimax.vol`: ระดับเสียง `(0, 10]` (ค่าเริ่มต้น 1.0; ต้องมากกว่า 0)
- `providers.minimax.pitch`: การปรับระดับเสียง `-12..12` (ค่าเริ่มต้น 0)
- `providers.google.model`: โมเดล Gemini TTS (ค่าเริ่มต้น `gemini-3.1-flash-tts-preview`)
- `providers.google.voiceName`: ชื่อเสียงสำเร็จรูปของ Gemini (ค่าเริ่มต้น `Kore`; รองรับ `voice` ด้วย)
- `providers.google.baseUrl`: override URL ฐานของ Gemini API รองรับเฉพาะ `https://generativelanguage.googleapis.com`
  - หากไม่มี `messages.tts.providers.google.apiKey`, TTS สามารถนำ `models.providers.google.apiKey` กลับมาใช้ได้ก่อน fallback ไปยัง env
- `providers.xai.apiKey`: คีย์ API ของ xAI TTS (env: `XAI_API_KEY`)
- `providers.xai.baseUrl`: override URL ฐานของ xAI TTS (ค่าเริ่มต้น `https://api.x.ai/v1`, env: `XAI_BASE_URL`)
- `providers.xai.voiceId`: รหัสเสียงของ xAI (ค่าเริ่มต้น `eve`; เสียงที่ใช้งานได้ปัจจุบัน: `ara`, `eve`, `leo`, `rex`, `sal`, `una`)
- `providers.xai.language`: รหัสภาษาแบบ BCP-47 หรือ `auto` (ค่าเริ่มต้น `en`)
- `providers.xai.responseFormat`: `mp3`, `wav`, `pcm`, `mulaw` หรือ `alaw` (ค่าเริ่มต้น `mp3`)
- `providers.xai.speed`: การ override ความเร็วแบบ native ของผู้ให้บริการ
- `providers.microsoft.enabled`: อนุญาตให้ใช้ Microsoft speech (ค่าเริ่มต้น `true`; ไม่ต้องใช้คีย์ API)
- `providers.microsoft.voice`: ชื่อเสียง neural ของ Microsoft (เช่น `en-US-MichelleNeural`)
- `providers.microsoft.lang`: รหัสภาษา (เช่น `en-US`)
- `providers.microsoft.outputFormat`: รูปแบบเอาต์พุตของ Microsoft (เช่น `audio-24khz-48kbitrate-mono-mp3`)
  - ดู Microsoft Speech output formats สำหรับค่าที่ใช้ได้; ไม่ใช่ทุก format ที่รองรับโดย transport แบบ Edge-backed ที่มาพร้อมกัน
- `providers.microsoft.rate` / `providers.microsoft.pitch` / `providers.microsoft.volume`: สตริงเปอร์เซ็นต์ (เช่น `+10%`, `-5%`)
- `providers.microsoft.saveSubtitles`: เขียนคำบรรยาย JSON ไว้ข้างไฟล์เสียง
- `providers.microsoft.proxy`: proxy URL สำหรับคำขอ Microsoft speech
- `providers.microsoft.timeoutMs`: override ระยะหมดเวลาของคำขอ (มิลลิวินาที)
- `edge.*`: alias แบบ legacy สำหรับการตั้งค่า Microsoft เดียวกัน

## การ override ที่ขับเคลื่อนโดยโมเดล (เปิดไว้โดยค่าเริ่มต้น)

โดยค่าเริ่มต้น โมเดล**สามารถ**ส่ง directive ของ TTS สำหรับการตอบกลับเพียงครั้งเดียวได้
เมื่อ `messages.tts.auto` เป็น `tagged`, directive เหล่านี้จำเป็นต่อการกระตุ้นการส่งเสียง

เมื่อเปิดใช้งาน โมเดลสามารถส่ง directive `[[tts:...]]` เพื่อ override เสียง
สำหรับการตอบกลับครั้งเดียว พร้อมด้วยบล็อก `[[tts:text]]...[[/tts:text]]` แบบไม่บังคับเพื่อ
ใส่แท็กเชิงการแสดงออก (เสียงหัวเราะ, สัญญาณการร้องเพลง ฯลฯ) ที่ควรปรากฏ
เฉพาะในเสียงเท่านั้น

directive `provider=...` จะถูกละเว้น เว้นแต่ `modelOverrides.allowProvider: true`

ตัวอย่าง payload ของการตอบกลับ:

```
Here you go.

[[tts:voiceId=pMsXgVXv3BLzUgSXRplE model=eleven_v3 speed=1.1]]
[[tts:text]](laughs) Read the song once more.[[/tts:text]]
```

คีย์ directive ที่ใช้ได้ (เมื่อเปิดใช้งาน):

- `provider` (รหัสผู้ให้บริการ speech ที่ลงทะเบียนไว้ เช่น `openai`, `elevenlabs`, `google`, `minimax` หรือ `microsoft`; ต้องใช้ `allowProvider: true`)
- `voice` (เสียงของ OpenAI), `voiceName` / `voice_name` / `google_voice` (เสียงของ Google) หรือ `voiceId` (ElevenLabs / MiniMax / xAI)
- `model` (โมเดล OpenAI TTS, รหัสโมเดลของ ElevenLabs หรือโมเดลของ MiniMax) หรือ `google_model` (โมเดล Google TTS)
- `stability`, `similarityBoost`, `style`, `speed`, `useSpeakerBoost`
- `vol` / `volume` (ระดับเสียงของ MiniMax, 0-10)
- `pitch` (ระดับเสียงสูงต่ำของ MiniMax, -12 ถึง 12)
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

allowlist แบบไม่บังคับ (เปิดให้สลับ provider ได้ ขณะยังคงให้ปรับตัวเลือกอื่นได้):

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

## ค่ากำหนดต่อผู้ใช้

คำสั่ง Slash จะเขียนค่า override ในเครื่องไปยัง `prefsPath` (ค่าเริ่มต้น:
`~/.openclaw/settings/tts.json`, override ได้ด้วย `OPENCLAW_TTS_PREFS` หรือ
`messages.tts.prefsPath`)

ฟิลด์ที่จัดเก็บ:

- `enabled`
- `provider`
- `maxLength` (เกณฑ์สำหรับสรุป; ค่าเริ่มต้น 1500 อักขระ)
- `summarize` (ค่าเริ่มต้น `true`)

ค่าพวกนี้จะ override `messages.tts.*` สำหรับ host นั้น

## รูปแบบเอาต์พุต (กำหนดตายตัว)

- **Feishu / Matrix / Telegram / WhatsApp**: ข้อความเสียงแบบ Opus (`opus_48000_64` จาก ElevenLabs, `opus` จาก OpenAI)
  - 48kHz / 64kbps เป็นจุดสมดุลที่ดีสำหรับข้อความเสียง
- **ช่องทางอื่นๆ**: MP3 (`mp3_44100_128` จาก ElevenLabs, `mp3` จาก OpenAI)
  - 44.1kHz / 128kbps คือสมดุลค่าเริ่มต้นสำหรับความชัดของเสียงพูด
- **MiniMax**: MP3 (โมเดล `speech-2.8-hd`, อัตราสุ่มตัวอย่าง 32kHz) ไม่รองรับรูปแบบ voice-note แบบเนทีฟ; ใช้ OpenAI หรือ ElevenLabs หากต้องการข้อความเสียง Opus ที่รับประกันได้
- **Google Gemini**: Gemini API TTS ส่งคืน PCM ดิบ 24kHz OpenClaw จะห่อมันเป็น WAV สำหรับไฟล์แนบเสียง และส่งคืน PCM โดยตรงสำหรับ Talk/telephony เส้นทางนี้ไม่รองรับรูปแบบ voice-note แบบ Opus โดยกำเนิด
- **xAI**: ใช้ MP3 เป็นค่าเริ่มต้น; `responseFormat` สามารถเป็น `mp3`, `wav`, `pcm`, `mulaw` หรือ `alaw` OpenClaw ใช้ endpoint TTS แบบ batch REST ของ xAI และส่งคืนไฟล์แนบเสียงแบบสมบูรณ์; เส้นทางผู้ให้บริการนี้ไม่ได้ใช้ WebSocket TTS แบบสตรีมของ xAI เส้นทางนี้ไม่รองรับรูปแบบ voice-note แบบ Opus โดยกำเนิด
- **Microsoft**: ใช้ `microsoft.outputFormat` (ค่าเริ่มต้น `audio-24khz-48kbitrate-mono-mp3`)
  - transport ที่มาพร้อมกันรองรับ `outputFormat` แต่ไม่ใช่ทุก format จะมีให้ใช้จากบริการ
  - ค่า output format เป็นไปตาม Microsoft Speech output formats (รวมถึง Ogg/WebM Opus)
  - Telegram `sendVoice` รองรับ OGG/MP3/M4A; ใช้ OpenAI/ElevenLabs หากคุณต้องการ
    ข้อความเสียง Opus ที่รับประกันได้
  - หาก output format ของ Microsoft ที่กำหนดค่าไว้ล้มเหลว OpenClaw จะลองใหม่ด้วย MP3

รูปแบบเอาต์พุตของ OpenAI/ElevenLabs ถูกกำหนดตายตัวตามแต่ละช่องทาง (ดูด้านบน)

## พฤติกรรมของ Auto-TTS

เมื่อเปิดใช้งาน OpenClaw จะ:

- ข้าม TTS หากการตอบกลับมีสื่ออยู่แล้วหรือมี directive `MEDIA:`
- ข้ามการตอบกลับที่สั้นมาก (< 10 อักขระ)
- สรุปการตอบกลับที่ยาวเมื่อเปิดใช้งาน โดยใช้ `agents.defaults.model.primary` (หรือ `summaryModel`)
- แนบเสียงที่สร้างแล้วไปกับการตอบกลับ

หากการตอบกลับยาวเกิน `maxLength` และปิดการสรุปไว้ (หรือไม่มีคีย์ API สำหรับ
โมเดลสรุป) ระบบจะข้ามเสียง
และส่งการตอบกลับแบบข้อความตามปกติ

## แผนภาพโฟลว์

```
Reply -> เปิดใช้ TTS หรือไม่?
  ไม่  -> ส่งข้อความ
  ใช่ -> มี media / MEDIA: / สั้นเกินไปหรือไม่?
          ใช่ -> ส่งข้อความ
          ไม่  -> ความยาว > ขีดจำกัดหรือไม่?
                   ไม่  -> TTS -> แนบเสียง
                   ใช่ -> เปิดใช้การสรุปหรือไม่?
                            ไม่  -> ส่งข้อความ
                            ใช่ -> สรุป (summaryModel หรือ agents.defaults.model.primary)
                                      -> TTS -> แนบเสียง
```

## การใช้คำสั่ง Slash

มีคำสั่งเดียว: `/tts`
ดู [Slash commands](/th/tools/slash-commands) สำหรับรายละเอียดการเปิดใช้งาน

หมายเหตุสำหรับ Discord: `/tts` เป็นคำสั่งที่มีอยู่แล้วใน Discord ดังนั้น OpenClaw จะลงทะเบียน
`/voice` เป็นคำสั่งเนทีฟแทนในที่นั่น ข้อความ `/tts ...` ยังคงใช้งานได้

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

- คำสั่งต้องใช้ผู้ส่งที่ได้รับอนุญาต (กฎ allowlist/owner ยังคงมีผล)
- ต้องเปิดใช้ `commands.text` หรือการลงทะเบียนคำสั่งเนทีฟ
- config `messages.tts.auto` รองรับ `off|always|inbound|tagged`
- `/tts on` จะเขียนค่ากำหนด TTS ในเครื่องเป็น `always`; `/tts off` จะเขียนเป็น `off`
- ใช้ config เมื่อคุณต้องการค่าเริ่มต้นแบบ `inbound` หรือ `tagged`
- `limit` และ `summary` ถูกเก็บไว้ใน prefs ในเครื่อง ไม่ใช่ใน config หลัก
- `/tts audio` จะสร้างการตอบกลับเสียงแบบครั้งเดียว (ไม่ได้สลับเปิด TTS)
- `/tts status` มีการมองเห็น fallback สำหรับความพยายามล่าสุดด้วย:
  - fallback สำเร็จ: `Fallback: <primary> -> <used>` พร้อม `Attempts: ...`
  - ล้มเหลว: `Error: ...` พร้อม `Attempts: ...`
  - การวินิจฉัยแบบละเอียด: `Attempt details: provider:outcome(reasonCode) latency`
- ความล้มเหลวของ API ของ OpenAI และ ElevenLabs ตอนนี้รวมรายละเอียดข้อผิดพลาดจากผู้ให้บริการที่ parse แล้วและ request id (เมื่อผู้ให้บริการส่งกลับมา) ซึ่งจะแสดงในข้อผิดพลาด/logs ของ TTS

## เครื่องมือเอเจนต์

เครื่องมือ `tts` จะแปลงข้อความเป็นเสียงและส่งคืนไฟล์แนบเสียงสำหรับ
การส่งเป็นคำตอบ เมื่อช่องทางเป็น Feishu, Matrix, Telegram หรือ WhatsApp
เสียงจะถูกส่งเป็นข้อความเสียงแทนที่จะเป็นไฟล์แนบ
รองรับฟิลด์ `channel` และ `timeoutMs` แบบไม่บังคับ; `timeoutMs` คือ
ระยะหมดเวลาของคำขอผู้ให้บริการต่อการเรียกหนึ่งครั้งในหน่วยมิลลิวินาที

## Gateway RPC

เมธอดของ Gateway:

- `tts.status`
- `tts.enable`
- `tts.disable`
- `tts.convert`
- `tts.setProvider`
- `tts.providers`

## ที่เกี่ยวข้อง

- [ภาพรวม Media](/th/tools/media-overview)
- [การสร้างเพลง](/th/tools/music-generation)
- [การสร้างวิดีโอ](/th/tools/video-generation)
