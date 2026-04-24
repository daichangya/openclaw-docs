---
read_when:
    - คุณต้องการโทรออกด้วยเสียงจาก OpenClaw
    - คุณกำลังกำหนดค่าหรือพัฒนา Plugin voice-call
summary: 'Plugin Voice Call: การโทรออกและรับสายผ่าน Twilio/Telnyx/Plivo (การติดตั้ง Plugin + การกำหนดค่า + CLI)'
title: Plugin Voice Call
x-i18n:
    generated_at: "2026-04-24T09:53:38Z"
    model: gpt-5.4
    provider: openai
    source_hash: 6aed4e33ce090c86f43c71280f033e446f335c53d42456fdc93c9938250e9af6
    source_path: plugins/voice-call.md
    workflow: 15
---

# Voice Call (Plugin)

การโทรด้วยเสียงสำหรับ OpenClaw ผ่าน Plugin รองรับการแจ้งเตือนแบบโทรออกและ
การสนทนาหลายรอบพร้อมนโยบายสายเรียกเข้า

ผู้ให้บริการปัจจุบัน:

- `twilio` (Programmable Voice + Media Streams)
- `telnyx` (Call Control v2)
- `plivo` (Voice API + XML transfer + GetInput speech)
- `mock` (สำหรับพัฒนา/ไม่ใช้เครือข่าย)

โมเดลภาพรวมอย่างรวดเร็ว:

- ติดตั้ง Plugin
- รีสตาร์ท Gateway
- กำหนดค่าภายใต้ `plugins.entries.voice-call.config`
- ใช้ `openclaw voicecall ...` หรือเครื่องมือ `voice_call`

## ตำแหน่งที่รัน (local เทียบกับ remote)

Plugin Voice Call ทำงาน **ภายในโปรเซส Gateway**

หากคุณใช้ Gateway ระยะไกล ให้ติดตั้ง/กำหนดค่า Plugin บน **เครื่องที่รัน Gateway**
จากนั้นรีสตาร์ท Gateway เพื่อโหลดมัน

## การติดตั้ง

### ตัวเลือก A: ติดตั้งจาก npm (แนะนำ)

```bash
openclaw plugins install @openclaw/voice-call
```

หลังจากนั้นให้รีสตาร์ท Gateway

### ตัวเลือก B: ติดตั้งจากโฟลเดอร์ local (สำหรับพัฒนา, ไม่คัดลอก)

```bash
PLUGIN_SRC=./path/to/local/voice-call-plugin
openclaw plugins install "$PLUGIN_SRC"
cd "$PLUGIN_SRC" && pnpm install
```

หลังจากนั้นให้รีสตาร์ท Gateway

## การกำหนดค่า

ตั้งค่าภายใต้ `plugins.entries.voice-call.config`:

```json5
{
  plugins: {
    entries: {
      "voice-call": {
        enabled: true,
        config: {
          provider: "twilio", // หรือ "telnyx" | "plivo" | "mock"
          fromNumber: "+15550001234", // หรือ TWILIO_FROM_NUMBER สำหรับ Twilio
          toNumber: "+15550005678",

          twilio: {
            accountSid: "ACxxxxxxxx",
            authToken: "...",
          },

          telnyx: {
            apiKey: "...",
            connectionId: "...",
            // คีย์สาธารณะ Webhook ของ Telnyx จาก Telnyx Mission Control Portal
            // (สตริง Base64; สามารถตั้งค่าผ่าน TELNYX_PUBLIC_KEY ได้เช่นกัน)
            publicKey: "...",
          },

          plivo: {
            authId: "MAxxxxxxxxxxxxxxxxxxxx",
            authToken: "...",
          },

          // เซิร์ฟเวอร์ Webhook
          serve: {
            port: 3334,
            path: "/voice/webhook",
          },

          // ความปลอดภัยของ Webhook (แนะนำสำหรับ tunnel/proxy)
          webhookSecurity: {
            allowedHosts: ["voice.example.com"],
            trustedProxyIPs: ["100.64.0.1"],
          },

          // การเปิดเผยสู่สาธารณะ (เลือกอย่างใดอย่างหนึ่ง)
          // publicUrl: "https://example.ngrok.app/voice/webhook",
          // tunnel: { provider: "ngrok" },
          // tailscale: { mode: "funnel", path: "/voice/webhook" }

          outbound: {
            defaultMode: "notify", // notify | conversation
          },

          streaming: {
            enabled: true,
            provider: "openai", // ไม่บังคับ; ใช้ผู้ให้บริการถอดเสียงแบบ realtime รายแรกที่ลงทะเบียนไว้เมื่อไม่ตั้งค่า
            streamPath: "/voice/stream",
            providers: {
              openai: {
                apiKey: "sk-...", // ไม่บังคับหากตั้งค่า OPENAI_API_KEY แล้ว
                model: "gpt-4o-transcribe",
                silenceDurationMs: 800,
                vadThreshold: 0.5,
              },
            },
            preStartTimeoutMs: 5000,
            maxPendingConnections: 32,
            maxPendingConnectionsPerIp: 4,
            maxConnections: 128,
          },

          realtime: {
            enabled: false,
            provider: "google", // ไม่บังคับ; ใช้ผู้ให้บริการเสียงแบบ realtime รายแรกที่ลงทะเบียนไว้เมื่อไม่ตั้งค่า
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

หมายเหตุ:

- Twilio/Telnyx ต้องใช้ URL Webhook ที่ **เข้าถึงได้จากสาธารณะ**
- Plivo ต้องใช้ URL Webhook ที่ **เข้าถึงได้จากสาธารณะ**
- `mock` เป็นผู้ให้บริการสำหรับพัฒนาแบบ local (ไม่มีการเรียกเครือข่าย)
- หากการกำหนดค่าเก่ายังคงใช้ `provider: "log"`, `twilio.from` หรือคีย์ OpenAI แบบเดิมของ `streaming.*` ให้รัน `openclaw doctor --fix` เพื่อเขียนใหม่
- Telnyx ต้องใช้ `telnyx.publicKey` (หรือ `TELNYX_PUBLIC_KEY`) เว้นแต่ `skipSignatureVerification` จะเป็น true
- `skipSignatureVerification` ใช้สำหรับการทดสอบแบบ local เท่านั้น
- หากคุณใช้ ngrok แบบฟรี ให้ตั้งค่า `publicUrl` เป็น URL ngrok ที่ตรงกันทุกประการ; การตรวจสอบลายเซ็นจะถูกบังคับใช้เสมอ
- `tunnel.allowNgrokFreeTierLoopbackBypass: true` อนุญาต Webhook ของ Twilio ที่มีลายเซ็นไม่ถูกต้อง **เฉพาะเมื่อ** `tunnel.provider="ngrok"` และ `serve.bind` เป็น loopback (ngrok local agent) ใช้สำหรับพัฒนาแบบ local เท่านั้น
- URL ของ ngrok แบบฟรีอาจเปลี่ยนหรือเพิ่มพฤติกรรม interstitial; หาก `publicUrl` เปลี่ยนไป ลายเซ็นของ Twilio จะตรวจสอบไม่ผ่าน สำหรับ production ให้ใช้โดเมนคงที่หรือ Tailscale funnel
- `realtime.enabled` เริ่มต้นการสนทนาเสียงต่อเสียงแบบเต็มรูปแบบ; อย่าเปิดใช้งานพร้อมกับ `streaming.enabled`
- ค่าเริ่มต้นด้านความปลอดภัยของ streaming:
  - `streaming.preStartTimeoutMs` จะปิด socket ที่ไม่เคยส่งเฟรม `start` ที่ถูกต้อง
- `streaming.maxPendingConnections` จำกัดจำนวน socket ก่อนเริ่มต้นที่ยังไม่ยืนยันตัวตนทั้งหมด
- `streaming.maxPendingConnectionsPerIp` จำกัดจำนวน socket ก่อนเริ่มต้นที่ยังไม่ยืนยันตัวตนต่อ IP ต้นทาง
- `streaming.maxConnections` จำกัดจำนวน socket สตรีมสื่อที่เปิดอยู่ทั้งหมด (รอดำเนินการ + ใช้งานอยู่)
- การสำรองการทำงานตอนรันไทม์ยังคงยอมรับคีย์ voice-call แบบเก่าเหล่านั้นในตอนนี้ แต่เส้นทางการเขียนใหม่คือ `openclaw doctor --fix` และ compat shim เป็นเพียงชั่วคราว

## การสนทนาเสียงแบบ Realtime

`realtime` ใช้เลือกผู้ให้บริการเสียงแบบ realtime แบบ full duplex สำหรับเสียงสายแบบสด
โดยแยกจาก `streaming` ซึ่งส่งต่อเสียงไปยังผู้ให้บริการถอดเสียงแบบ realtime เท่านั้น

พฤติกรรมรันไทม์ปัจจุบัน:

- รองรับ `realtime.enabled` สำหรับ Twilio Media Streams
- ไม่สามารถใช้ `realtime.enabled` ร่วมกับ `streaming.enabled`
- `realtime.provider` เป็นตัวเลือกเพิ่มเติม หากไม่ตั้งค่า Voice Call จะใช้
  ผู้ให้บริการเสียงแบบ realtime รายแรกที่ลงทะเบียนไว้
- ผู้ให้บริการเสียงแบบ realtime ที่มาพร้อมกันมี Google Gemini Live (`google`) และ
  OpenAI (`openai`) ซึ่งลงทะเบียนโดย Plugin ผู้ให้บริการของตน
- การกำหนดค่า raw ที่ผู้ให้บริการเป็นเจ้าของอยู่ภายใต้ `realtime.providers.<providerId>`
- หาก `realtime.provider` ชี้ไปยังผู้ให้บริการที่ยังไม่ได้ลงทะเบียน หรือไม่มีผู้ให้บริการเสียงแบบ realtime
  ที่ลงทะเบียนไว้เลย Voice Call จะบันทึกคำเตือนและข้ามสื่อแบบ realtime
  แทนที่จะทำให้ Plugin ทั้งหมดล้มเหลว

ค่าเริ่มต้นของ Google Gemini Live realtime:

- API key: `realtime.providers.google.apiKey`, `GEMINI_API_KEY`, หรือ
  `GOOGLE_GENERATIVE_AI_API_KEY`
- model: `gemini-2.5-flash-native-audio-preview-12-2025`
- voice: `Kore`

ตัวอย่าง:

```json5
{
  plugins: {
    entries: {
      "voice-call": {
        config: {
          provider: "twilio",
          inboundPolicy: "allowlist",
          allowFrom: ["+15550005678"],
          realtime: {
            enabled: true,
            provider: "google",
            instructions: "พูดให้สั้น กระชับ และถามก่อนใช้เครื่องมือ",
            providers: {
              google: {
                apiKey: "${GEMINI_API_KEY}",
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

ใช้ OpenAI แทน:

```json5
{
  plugins: {
    entries: {
      "voice-call": {
        config: {
          realtime: {
            enabled: true,
            provider: "openai",
            providers: {
              openai: {
                apiKey: "${OPENAI_API_KEY}",
              },
            },
          },
        },
      },
    },
  },
}
```

ดู [Google provider](/th/providers/google) และ [OpenAI provider](/th/providers/openai)
สำหรับตัวเลือกเสียงแบบ realtime ที่เฉพาะกับผู้ให้บริการ

## การถอดเสียงแบบ Streaming

`streaming` ใช้เลือกผู้ให้บริการถอดเสียงแบบ realtime สำหรับเสียงสายแบบสด

พฤติกรรมรันไทม์ปัจจุบัน:

- `streaming.provider` เป็นตัวเลือกเพิ่มเติม หากไม่ตั้งค่า Voice Call จะใช้
  ผู้ให้บริการถอดเสียงแบบ realtime รายแรกที่ลงทะเบียนไว้
- ผู้ให้บริการถอดเสียงแบบ realtime ที่มาพร้อมกันมี Deepgram (`deepgram`),
  ElevenLabs (`elevenlabs`), Mistral (`mistral`), OpenAI (`openai`) และ xAI
  (`xai`) ซึ่งลงทะเบียนโดย Plugin ผู้ให้บริการของตน
- การกำหนดค่า raw ที่ผู้ให้บริการเป็นเจ้าของอยู่ภายใต้ `streaming.providers.<providerId>`
- หาก `streaming.provider` ชี้ไปยังผู้ให้บริการที่ยังไม่ได้ลงทะเบียน หรือไม่มีผู้ให้บริการถอดเสียงแบบ realtime
  ที่ลงทะเบียนไว้เลย Voice Call จะบันทึกคำเตือนและ
  ข้ามการสตรีมสื่อแทนที่จะทำให้ Plugin ทั้งหมดล้มเหลว

ค่าเริ่มต้นของ OpenAI streaming transcription:

- API key: `streaming.providers.openai.apiKey` หรือ `OPENAI_API_KEY`
- model: `gpt-4o-transcribe`
- `silenceDurationMs`: `800`
- `vadThreshold`: `0.5`

ค่าเริ่มต้นของ xAI streaming transcription:

- API key: `streaming.providers.xai.apiKey` หรือ `XAI_API_KEY`
- endpoint: `wss://api.x.ai/v1/stt`
- `encoding`: `mulaw`
- `sampleRate`: `8000`
- `endpointingMs`: `800`
- `interimResults`: `true`

ตัวอย่าง:

```json5
{
  plugins: {
    entries: {
      "voice-call": {
        config: {
          streaming: {
            enabled: true,
            provider: "openai",
            streamPath: "/voice/stream",
            providers: {
              openai: {
                apiKey: "sk-...", // ไม่บังคับหากตั้งค่า OPENAI_API_KEY แล้ว
                model: "gpt-4o-transcribe",
                silenceDurationMs: 800,
                vadThreshold: 0.5,
              },
            },
          },
        },
      },
    },
  },
}
```

ใช้ xAI แทน:

```json5
{
  plugins: {
    entries: {
      "voice-call": {
        config: {
          streaming: {
            enabled: true,
            provider: "xai",
            streamPath: "/voice/stream",
            providers: {
              xai: {
                apiKey: "${XAI_API_KEY}", // ไม่บังคับหากตั้งค่า XAI_API_KEY แล้ว
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

คีย์แบบเดิมยังคงถูกย้ายโดยอัตโนมัติด้วย `openclaw doctor --fix`:

- `streaming.sttProvider` → `streaming.provider`
- `streaming.openaiApiKey` → `streaming.providers.openai.apiKey`
- `streaming.sttModel` → `streaming.providers.openai.model`
- `streaming.silenceDurationMs` → `streaming.providers.openai.silenceDurationMs`
- `streaming.vadThreshold` → `streaming.providers.openai.vadThreshold`

## ตัวเก็บกวาดสายที่ค้างอยู่

ใช้ `staleCallReaperSeconds` เพื่อยุติสายที่ไม่เคยได้รับ Webhook สถานะสิ้นสุด
(ตัวอย่างเช่น สายโหมด notify ที่ไม่เคยเสร็จสมบูรณ์) ค่าเริ่มต้นคือ `0`
(ปิดใช้งาน)

ช่วงค่าที่แนะนำ:

- **Production:** `120`–`300` วินาทีสำหรับโฟลว์แบบ notify
- ให้ค่านี้ **สูงกว่า `maxDurationSeconds`** เพื่อให้สายปกติ
  เสร็จสิ้นได้ จุดเริ่มต้นที่ดีคือ `maxDurationSeconds + 30–60` วินาที

ตัวอย่าง:

```json5
{
  plugins: {
    entries: {
      "voice-call": {
        config: {
          maxDurationSeconds: 300,
          staleCallReaperSeconds: 360,
        },
      },
    },
  },
}
```

## ความปลอดภัยของ Webhook

เมื่อมี proxy หรือ tunnel อยู่หน้า Gateway Plugin จะสร้าง
URL สาธารณะขึ้นใหม่เพื่อใช้ตรวจสอบลายเซ็น ตัวเลือกเหล่านี้ใช้ควบคุมว่า
จะเชื่อถือ forwarding header ใดบ้าง

`webhookSecurity.allowedHosts` ใช้กำหนด allowlist ของ host จาก forwarding headers

`webhookSecurity.trustForwardingHeaders` เชื่อถือ forwarding headers โดยไม่ต้องมี allowlist

`webhookSecurity.trustedProxyIPs` จะเชื่อถือ forwarding headers เฉพาะเมื่อ request
มี IP ระยะไกลตรงกับรายการที่กำหนด

การป้องกัน Webhook replay ถูกเปิดใช้สำหรับ Twilio และ Plivo แล้ว
คำขอ Webhook ที่ถูก replay และยังมีลายเซ็นถูกต้องจะได้รับการตอบรับ แต่จะไม่ก่อให้เกิดผลข้างเคียง

แต่ละรอบการสนทนาของ Twilio มีโทเค็นประจำรอบใน callback ของ `<Gather>` ดังนั้น
callback ของคำพูดที่ค้างหรือถูก replay จึงไม่สามารถตอบสนองรอบ transcript ที่รออยู่ใหม่กว่าได้

คำขอ Webhook ที่ไม่ผ่านการยืนยันตัวตนจะถูกปฏิเสธก่อนอ่าน body หากไม่มี
signature header ที่ผู้ให้บริการกำหนด

voice-call Webhook ใช้โปรไฟล์ body ก่อนยืนยันตัวตนร่วมกัน (64 KB / 5 วินาที)
ร่วมกับการจำกัดจำนวน in-flight ต่อ IP ก่อนการตรวจสอบลายเซ็น

ตัวอย่างเมื่อใช้ host สาธารณะที่คงที่:

```json5
{
  plugins: {
    entries: {
      "voice-call": {
        config: {
          publicUrl: "https://voice.example.com/voice/webhook",
          webhookSecurity: {
            allowedHosts: ["voice.example.com"],
          },
        },
      },
    },
  },
}
```

## TTS สำหรับสายโทร

Voice Call ใช้การกำหนดค่า `messages.tts` หลักสำหรับ
การสตรีมเสียงพูดบนสายโทร คุณสามารถ override ได้ภายใต้การกำหนดค่า Plugin ด้วย
**โครงสร้างเดียวกัน** — โดยจะ deep-merge กับ `messages.tts`

```json5
{
  tts: {
    provider: "elevenlabs",
    providers: {
      elevenlabs: {
        voiceId: "pMsXgVXv3BLzUgSXRplE",
        modelId: "eleven_multilingual_v2",
      },
    },
  },
}
```

หมายเหตุ:

- คีย์ `tts.<provider>` แบบเดิมภายในการกำหนดค่า Plugin (`openai`, `elevenlabs`, `microsoft`, `edge`) จะถูกย้ายไปยัง `tts.providers.<provider>` อัตโนมัติเมื่อโหลด ควรใช้รูปแบบ `providers` ในการกำหนดค่าที่ commit แล้ว
- **Microsoft speech จะถูกละเว้นสำหรับสายโทรด้วยเสียง** (เสียงโทรศัพท์ต้องใช้ PCM; transport ปัจจุบันของ Microsoft ยังไม่รองรับเอาต์พุต PCM สำหรับโทรศัพท์)
- ระบบ TTS หลักจะถูกใช้เมื่อเปิดใช้งาน Twilio media streaming; มิฉะนั้นสายจะ fallback ไปใช้เสียง native ของผู้ให้บริการ
- หากมี Twilio media stream ทำงานอยู่แล้ว Voice Call จะไม่ fallback ไปใช้ TwiML `<Say>` หาก TTS สำหรับโทรศัพท์ใช้งานไม่ได้ในสถานะนั้น คำขอเล่นเสียงจะล้มเหลวแทนที่จะผสมเส้นทางการเล่นสองแบบ
- เมื่อ TTS สำหรับโทรศัพท์ fallback ไปยังผู้ให้บริการสำรอง Voice Call จะบันทึกคำเตือนพร้อมสายโซ่ของผู้ให้บริการ (`from`, `to`, `attempts`) เพื่อการดีบัก

### ตัวอย่างเพิ่มเติม

ใช้ TTS หลักเท่านั้น (ไม่ override):

```json5
{
  messages: {
    tts: {
      provider: "openai",
      providers: {
        openai: { voice: "alloy" },
      },
    },
  },
}
```

override เป็น ElevenLabs สำหรับสายโทรเท่านั้น (คงค่าเริ่มต้นหลักไว้ที่อื่น):

```json5
{
  plugins: {
    entries: {
      "voice-call": {
        config: {
          tts: {
            provider: "elevenlabs",
            providers: {
              elevenlabs: {
                apiKey: "elevenlabs_key",
                voiceId: "pMsXgVXv3BLzUgSXRplE",
                modelId: "eleven_multilingual_v2",
              },
            },
          },
        },
      },
    },
  },
}
```

override เฉพาะ model ของ OpenAI สำหรับสายโทร (ตัวอย่าง deep-merge):

```json5
{
  plugins: {
    entries: {
      "voice-call": {
        config: {
          tts: {
            providers: {
              openai: {
                model: "gpt-4o-mini-tts",
                voice: "marin",
              },
            },
          },
        },
      },
    },
  },
}
```

## สายเรียกเข้า

นโยบายสายเรียกเข้ามีค่าเริ่มต้นเป็น `disabled` หากต้องการเปิดใช้สายเรียกเข้า ให้ตั้งค่า:

```json5
{
  inboundPolicy: "allowlist",
  allowFrom: ["+15550001234"],
  inboundGreeting: "สวัสดี! ฉันช่วยอะไรได้บ้าง",
}
```

`inboundPolicy: "allowlist"` เป็นการคัดกรอง caller ID แบบความเชื่อมั่นต่ำ Plugin
จะ normalize ค่า `From` ที่ผู้ให้บริการส่งมาและเปรียบเทียบกับ `allowFrom`
การตรวจสอบ Webhook ยืนยันการส่งมอบจากผู้ให้บริการและความสมบูรณ์ของ payload แต่
ไม่ได้พิสูจน์ความเป็นเจ้าของหมายเลขผู้โทรบน PSTN/VoIP ให้ถือว่า `allowFrom` เป็น
การกรอง caller ID ไม่ใช่การยืนยันตัวตนผู้โทรแบบเข้มงวด

การตอบกลับอัตโนมัติใช้ระบบ agent ปรับแต่งได้ด้วย:

- `responseModel`
- `responseSystemPrompt`
- `responseTimeoutMs`

### ข้อตกลงของเอาต์พุตเสียงพูด

สำหรับการตอบกลับอัตโนมัติ Voice Call จะต่อท้ายข้อตกลงเอาต์พุตเสียงพูดแบบเข้มงวดเข้ากับ system prompt:

- `{"spoken":"..."}`

จากนั้น Voice Call จะดึงข้อความพูดอย่างระมัดระวัง:

- ละเว้น payload ที่ถูกทำเครื่องหมายว่าเป็นเนื้อหาประเภท reasoning/error
- parse JSON โดยตรง, JSON แบบ fenced หรือคีย์ `"spoken"` แบบ inline
- fallback เป็นข้อความธรรมดาและลบย่อหน้าเกริ่นนำที่น่าจะเป็นการวางแผน/เมตา

วิธีนี้ช่วยให้เสียงที่เล่นเน้นเฉพาะข้อความสำหรับผู้โทร และหลีกเลี่ยงการรั่วไหลของข้อความการวางแผนไปยังเสียง

### พฤติกรรมการเริ่มต้นการสนทนา

สำหรับสายโทรออกแบบ `conversation` การจัดการข้อความแรกจะเชื่อมโยงกับสถานะการเล่นเสียงแบบสด:

- การล้างคิวสำหรับ barge-in และการตอบกลับอัตโนมัติจะถูกระงับเฉพาะขณะที่คำทักทายแรกกำลังพูดอยู่จริง
- หากการเล่นครั้งแรกล้มเหลว สายจะกลับไปที่ `listening` และข้อความแรกจะยังคงอยู่ในคิวเพื่อรอลองใหม่
- การเล่นครั้งแรกสำหรับ Twilio streaming จะเริ่มเมื่อ stream เชื่อมต่อโดยไม่มีความล่าช้าเพิ่มเติม

### ช่วงผ่อนผันเมื่อ Twilio stream ตัดการเชื่อมต่อ

เมื่อ Twilio media stream ตัดการเชื่อมต่อ Voice Call จะรอ `2000ms` ก่อนจบสายโดยอัตโนมัติ:

- หาก stream เชื่อมต่อใหม่ภายในช่วงเวลาดังกล่าว การจบสายอัตโนมัติจะถูกยกเลิก
- หากไม่มี stream ใดถูกลงทะเบียนใหม่หลังหมดช่วงผ่อนผัน สายจะถูกจบเพื่อป้องกันไม่ให้มีสายที่ยัง active ค้างอยู่

## CLI

```bash
openclaw voicecall call --to "+15555550123" --message "Hello from OpenClaw"
openclaw voicecall start --to "+15555550123"   # alias for call
openclaw voicecall continue --call-id <id> --message "Any questions?"
openclaw voicecall speak --call-id <id> --message "One moment"
openclaw voicecall dtmf --call-id <id> --digits "ww123456#"
openclaw voicecall end --call-id <id>
openclaw voicecall status --call-id <id>
openclaw voicecall tail
openclaw voicecall latency                     # สรุป latency ของแต่ละรอบจาก log
openclaw voicecall expose --mode funnel
```

`latency` จะอ่าน `calls.jsonl` จากพาธจัดเก็บ voice-call เริ่มต้น ใช้
`--file <path>` เพื่อชี้ไปยัง log อื่น และ `--last <n>` เพื่อจำกัดการวิเคราะห์
ไว้ที่ N รายการล่าสุด (ค่าเริ่มต้น 200) เอาต์พุตจะมี p50/p90/p99 สำหรับ
latency ของแต่ละรอบและเวลา listen-wait

## เครื่องมือ Agent

ชื่อเครื่องมือ: `voice_call`

การทำงาน:

- `initiate_call` (message, to?, mode?)
- `continue_call` (callId, message)
- `speak_to_user` (callId, message)
- `send_dtmf` (callId, digits)
- `end_call` (callId)
- `get_status` (callId)

repo นี้มีเอกสาร Skills ที่สอดคล้องกันอยู่ที่ `skills/voice-call/SKILL.md`

## Gateway RPC

- `voicecall.initiate` (`to?`, `message`, `mode?`)
- `voicecall.continue` (`callId`, `message`)
- `voicecall.speak` (`callId`, `message`)
- `voicecall.dtmf` (`callId`, `digits`)
- `voicecall.end` (`callId`)
- `voicecall.status` (`callId`)

## ที่เกี่ยวข้อง

- [Text-to-speech](/th/tools/tts)
- [Talk mode](/th/nodes/talk)
- [Voice wake](/th/nodes/voicewake)
