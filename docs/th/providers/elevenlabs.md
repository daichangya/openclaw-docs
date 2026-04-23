---
read_when:
    - คุณต้องการใช้ text-to-speech ของ ElevenLabs ใน OpenClaw
    - คุณต้องการใช้ speech-to-text ของ ElevenLabs Scribe สำหรับไฟล์แนบเสียง
    - คุณต้องการใช้ realtime transcription ของ ElevenLabs สำหรับ Voice Call
summary: ใช้ speech ของ ElevenLabs, Scribe STT และ realtime transcription กับ OpenClaw
title: ElevenLabs
x-i18n:
    generated_at: "2026-04-23T05:51:04Z"
    model: gpt-5.4
    provider: openai
    source_hash: 62768d0b8a951548be2a5b293a766432f6345087ed145afc942134513dd9618c
    source_path: providers/elevenlabs.md
    workflow: 15
---

# ElevenLabs

OpenClaw ใช้ ElevenLabs สำหรับ text-to-speech, batch speech-to-text ด้วย Scribe
v2 และ Voice Call streaming STT ด้วย Scribe v2 Realtime

| ความสามารถ              | พื้นผิวของ OpenClaw                          | ค่าเริ่มต้น               |
| ----------------------- | -------------------------------------------- | ------------------------- |
| Text-to-speech          | `messages.tts` / `talk`                      | `eleven_multilingual_v2`  |
| Batch speech-to-text    | `tools.media.audio`                          | `scribe_v2`               |
| Streaming speech-to-text | Voice Call `streaming.provider: "elevenlabs"` | `scribe_v2_realtime`      |

## การยืนยันตัวตน

ตั้งค่า `ELEVENLABS_API_KEY` ใน environment โดยยอมรับ `XI_API_KEY` ด้วยเพื่อ
compatibility กับเครื่องมือของ ElevenLabs ที่มีอยู่แล้ว

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

ใช้ Scribe v2 สำหรับไฟล์แนบเสียงขาเข้าและเสียงที่อัดสั้นๆ:

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
`model_id: "scribe_v2"` โดยคำใบ้ภาษาเมื่อมีจะถูกแมปไปยัง `language_code`

## Voice Call streaming STT

Plugin `elevenlabs` ที่ bundled มา จะลงทะเบียน Scribe v2 Realtime สำหรับ Voice Call
streaming transcription

| การตั้งค่า        | พาธของ config                                                            | ค่าเริ่มต้น                                        |
| ---------------- | ------------------------------------------------------------------------- | -------------------------------------------------- |
| API key          | `plugins.entries.voice-call.config.streaming.providers.elevenlabs.apiKey` | fallback ไปที่ `ELEVENLABS_API_KEY` / `XI_API_KEY` |
| Model            | `...elevenlabs.modelId`                                                   | `scribe_v2_realtime`                               |
| รูปแบบเสียง      | `...elevenlabs.audioFormat`                                               | `ulaw_8000`                                        |
| Sample rate      | `...elevenlabs.sampleRate`                                                | `8000`                                             |
| Commit strategy  | `...elevenlabs.commitStrategy`                                            | `vad`                                              |
| ภาษา             | `...elevenlabs.languageCode`                                              | (ไม่ได้ตั้งค่า)                                    |

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
Voice Call รับสื่อของ Twilio มาในรูปแบบ 8 kHz G.711 u-law โดย provider แบบ realtime ของ ElevenLabs ใช้ค่าเริ่มต้นเป็น `ulaw_8000` ดังนั้นเฟรมเสียงจากระบบโทรศัพท์จึงสามารถส่งต่อได้โดยไม่ต้องแปลงรหัส
</Note>
