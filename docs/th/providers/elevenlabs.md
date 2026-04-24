---
read_when:
    - คุณต้องการใช้ text-to-speech ของ ElevenLabs ใน OpenClaw
    - คุณต้องการใช้ speech-to-text ของ ElevenLabs Scribe สำหรับไฟล์แนบเสียง
    - คุณต้องการใช้การถอดเสียงแบบเรียลไทม์ของ ElevenLabs สำหรับ Voice Call
summary: ใช้เสียงพูดของ ElevenLabs, Scribe STT และการถอดเสียงแบบเรียลไทม์กับ OpenClaw
title: ElevenLabs
x-i18n:
    generated_at: "2026-04-24T09:27:44Z"
    model: gpt-5.4
    provider: openai
    source_hash: cdf86afb839cf90c8caf73a194cb6eae0078661d3ab586d63b9e1276c845e7f7
    source_path: providers/elevenlabs.md
    workflow: 15
---

OpenClaw ใช้ ElevenLabs สำหรับ text-to-speech, batch speech-to-text ด้วย Scribe
v2 และ Voice Call streaming STT ด้วย Scribe v2 Realtime

| ความสามารถ                | พื้นผิวใน OpenClaw                              | ค่าเริ่มต้น              |
| ------------------------- | ----------------------------------------------- | ------------------------ |
| Text-to-speech            | `messages.tts` / `talk`                         | `eleven_multilingual_v2` |
| Batch speech-to-text      | `tools.media.audio`                             | `scribe_v2`              |
| Streaming speech-to-text  | Voice Call `streaming.provider: "elevenlabs"`   | `scribe_v2_realtime`     |

## การยืนยันตัวตน

ตั้งค่า `ELEVENLABS_API_KEY` ในสภาพแวดล้อม โดยรองรับ `XI_API_KEY` ด้วยเพื่อ
ความเข้ากันได้กับเครื่องมือ ElevenLabs ที่มีอยู่แล้ว

```bash
export ELEVENLABS_API_KEY="..."
```

## Text-to-speech

```json5
{
  messages: {
    tts: {
      providers: {
        elevenlabs: {
          apiKey: "${ELEVENLABS_API_KEY}",
          voiceId: "pMsXgVXv3BLzUgSXRplE",
          modelId: "eleven_multilingual_v2",
        },
      },
    },
  },
}
```

## Speech-to-text

ใช้ Scribe v2 สำหรับไฟล์แนบเสียงขาเข้าและคลิปเสียงที่บันทึกไว้สั้น ๆ:

```json5
{
  tools: {
    media: {
      audio: {
        enabled: true,
        models: [{ provider: "elevenlabs", model: "scribe_v2" }],
      },
    },
  },
}
```

OpenClaw จะส่งเสียงแบบ multipart ไปยัง ElevenLabs `/v1/speech-to-text` พร้อม
`model_id: "scribe_v2"` โดยคำใบ้ภาษา (language hints) จะถูกแมปไปยัง `language_code`
เมื่อมีการระบุ

## Voice Call streaming STT

plugin `elevenlabs` ที่มาพร้อมระบบจะลงทะเบียน Scribe v2 Realtime สำหรับ
การถอดเสียงแบบสตรีมมิงใน Voice Call

| การตั้งค่า       | เส้นทาง config                                                          | ค่าเริ่มต้น                                        |
| ---------------- | ----------------------------------------------------------------------- | -------------------------------------------------- |
| คีย์ API         | `plugins.entries.voice-call.config.streaming.providers.elevenlabs.apiKey` | fallback ไปที่ `ELEVENLABS_API_KEY` / `XI_API_KEY` |
| โมเดล            | `...elevenlabs.modelId`                                                 | `scribe_v2_realtime`                               |
| รูปแบบเสียง      | `...elevenlabs.audioFormat`                                             | `ulaw_8000`                                        |
| อัตราสุ่มตัวอย่าง | `...elevenlabs.sampleRate`                                              | `8000`                                             |
| กลยุทธ์การ commit | `...elevenlabs.commitStrategy`                                          | `vad`                                              |
| ภาษา             | `...elevenlabs.languageCode`                                            | (ไม่ได้ตั้งค่า)                                     |

```json5
{
  plugins: {
    entries: {
      "voice-call": {
        config: {
          streaming: {
            enabled: true,
            provider: "elevenlabs",
            providers: {
              elevenlabs: {
                apiKey: "${ELEVENLABS_API_KEY}",
                audioFormat: "ulaw_8000",
                commitStrategy: "vad",
                languageCode: "en",
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
Voice Call รับสื่อจาก Twilio เป็น G.711 u-law ที่ 8 kHz โดย provider realtime ของ ElevenLabs
ตั้งค่าเริ่มต้นเป็น `ulaw_8000` ดังนั้นเฟรมเสียงสำหรับระบบโทรศัพท์จึงสามารถส่งต่อได้
โดยไม่ต้องแปลงรหัส
</Note>

## ที่เกี่ยวข้อง

- [Text-to-speech](/th/tools/tts)
- [การเลือกโมเดล](/th/concepts/model-providers)
