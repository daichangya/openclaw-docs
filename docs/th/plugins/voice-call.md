---
read_when:
    - คุณต้องการโทรออกด้วยเสียงจาก OpenClaw
    - คุณกำลังกำหนดค่าหรือพัฒนา voice-call Plugin
summary: 'Voice Call Plugin: การโทรขาออก + ขาเข้าผ่าน Twilio/Telnyx/Plivo (การติดตั้ง Plugin + การกำหนดค่า + CLI)'
title: Voice Call Plugin
x-i18n:
    generated_at: "2026-04-23T05:49:21Z"
    model: gpt-5.4
    provider: openai
    source_hash: 2fbfe1aba459dd4fbe1b5c100430ff8cbe8987d7d34b875d115afcaee6e56412
    source_path: plugins/voice-call.md
    workflow: 15
---

# Voice Call (Plugin)

การโทรด้วยเสียงสำหรับ OpenClaw ผ่าน Plugin รองรับทั้งการโทรขาออกแบบแจ้งเตือนและ
การสนทนาแบบหลายเทิร์น พร้อมนโยบายสำหรับสายขาเข้า

ผู้ให้บริการปัจจุบัน:

- `twilio` (Programmable Voice + Media Streams)
- `telnyx` (Call Control v2)
- `plivo` (Voice API + XML transfer + GetInput speech)
- `mock` (dev/ไม่มีเครือข่าย)

ภาพรวมแบบสั้น:

- ติดตั้ง Plugin
- รีสตาร์ต Gateway
- กำหนดค่าภายใต้ `plugins.entries.voice-call.config`
- ใช้ `openclaw voicecall ...` หรือเครื่องมือ `voice_call`

## มันรันที่ไหน (local เทียบกับ remote)

Voice Call Plugin รัน **ภายใน process ของ Gateway**

หากคุณใช้ Gateway ระยะไกล ให้ติดตั้ง/กำหนดค่า Plugin บน **เครื่องที่รัน Gateway** แล้วรีสตาร์ต Gateway เพื่อโหลดมัน

## ติดตั้ง

### ตัวเลือก A: ติดตั้งจาก npm (แนะนำ)

```bash
openclaw plugins install @openclaw/voice-call
```

จากนั้นรีสตาร์ต Gateway

### ตัวเลือก B: ติดตั้งจากโฟลเดอร์ในเครื่อง (dev, ไม่ต้องคัดลอก)

```bash
PLUGIN_SRC=./path/to/local/voice-call-plugin
openclaw plugins install "$PLUGIN_SRC"
cd "$PLUGIN_SRC" && pnpm install
```

จากนั้นรีสตาร์ต Gateway

## การกำหนดค่า

ตั้งค่า config ภายใต้ `plugins.entries.voice-call.config`:

```json5
{
  plugins: {
    entries: {
      "voice-call": {
        enabled: true,
        config: {
          provider: "twilio", // หรือ "telnyx" | "plivo" | "mock"
          fromNumber: "+15550001234",
          toNumber: "+15550005678",

          twilio: {
            accountSid: "ACxxxxxxxx",
            authToken: "...",
          },

          telnyx: {
            apiKey: "...",
            connectionId: "...",
            // Telnyx webhook public key จาก Telnyx Mission Control Portal
            // (สตริง Base64; ตั้งผ่าน TELNYX_PUBLIC_KEY ได้เช่นกัน)
            publicKey: "...",
          },

          plivo: {
            authId: "MAxxxxxxxxxxxxxxxxxxxx",
            authToken: "...",
          },

          // Webhook server
          serve: {
            port: 3334,
            path: "/voice/webhook",
          },

          // ความปลอดภัยของ Webhook (แนะนำสำหรับ tunnels/proxies)
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
            provider: "openai", // ไม่บังคับ; จะใช้ผู้ให้บริการ realtime transcription ตัวแรกที่ลงทะเบียนไว้เมื่อไม่ตั้งค่า
            streamPath: "/voice/stream",
            providers: {
              openai: {
                apiKey: "sk-...", // ไม่บังคับหากตั้ง OPENAI_API_KEY แล้ว
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
        },
      },
    },
  },
}
```

หมายเหตุ:

- Twilio/Telnyx ต้องใช้ webhook URL ที่ **เข้าถึงได้จากสาธารณะ**
- Plivo ต้องใช้ webhook URL ที่ **เข้าถึงได้จากสาธารณะ**
- `mock` คือผู้ให้บริการสำหรับการพัฒนาในเครื่อง (ไม่มี network calls)
- หาก config เก่ายังใช้ `provider: "log"`, `twilio.from` หรือคีย์ OpenAI แบบ `streaming.*` รุ่นเดิม ให้รัน `openclaw doctor --fix` เพื่อ rewrite
- Telnyx ต้องใช้ `telnyx.publicKey` (หรือ `TELNYX_PUBLIC_KEY`) เว้นแต่ `skipSignatureVerification` จะเป็น true
- `skipSignatureVerification` มีไว้สำหรับการทดสอบในเครื่องเท่านั้น
- หากคุณใช้ ngrok free tier ให้ตั้ง `publicUrl` เป็น ngrok URL แบบตรงตัว; ระบบจะบังคับใช้การตรวจสอบลายเซ็นเสมอ
- `tunnel.allowNgrokFreeTierLoopbackBypass: true` อนุญาต Twilio webhooks ที่มีลายเซ็นไม่ถูกต้อง **เฉพาะเมื่อ** `tunnel.provider="ngrok"` และ `serve.bind` เป็น loopback (ngrok local agent) ใช้สำหรับ local dev เท่านั้น
- URL ของ ngrok free tier อาจเปลี่ยนหรือเพิ่มพฤติกรรม interstitial; หาก `publicUrl` เปลี่ยนไป การตรวจสอบลายเซ็นของ Twilio จะล้มเหลว สำหรับ production ควรใช้โดเมนที่คงที่หรือ Tailscale funnel
- ค่าเริ่มต้นด้านความปลอดภัยของ streaming:
  - `streaming.preStartTimeoutMs` จะปิด sockets ที่ไม่เคยส่ง `start` frame ที่ถูกต้อง
- `streaming.maxPendingConnections` จำกัดจำนวน pre-start sockets ที่ยังไม่ยืนยันตัวตนทั้งหมด
- `streaming.maxPendingConnectionsPerIp` จำกัดจำนวน pre-start sockets ที่ยังไม่ยืนยันตัวตนต่อ source IP
- `streaming.maxConnections` จำกัดจำนวน media stream sockets ที่เปิดอยู่ทั้งหมด (pending + active)
- Runtime fallback ยังยอมรับคีย์ voice-call แบบเก่าเหล่านั้นอยู่ในตอนนี้ แต่เส้นทาง rewrite คือ `openclaw doctor --fix` และ compat shim นี้เป็นเพียงชั่วคราว

## Streaming transcription

`streaming` ใช้เลือกผู้ให้บริการ realtime transcription สำหรับเสียงระหว่างสายแบบสด

พฤติกรรมรันไทม์ปัจจุบัน:

- `streaming.provider` ไม่บังคับ หากไม่ตั้งค่า Voice Call จะใช้
  ผู้ให้บริการ realtime transcription ตัวแรกที่ลงทะเบียนไว้
- ผู้ให้บริการ realtime transcription แบบ bundled มี Deepgram (`deepgram`),
  ElevenLabs (`elevenlabs`), Mistral (`mistral`), OpenAI (`openai`) และ xAI
  (`xai`) ซึ่งลงทะเบียนโดย provider plugins ของตน
- raw config ที่ผู้ให้บริการเป็นเจ้าของอยู่ภายใต้ `streaming.providers.<providerId>`
- หาก `streaming.provider` ชี้ไปยังผู้ให้บริการที่ยังไม่ได้ลงทะเบียน หรือไม่มีผู้ให้บริการ realtime
  transcription ที่ลงทะเบียนไว้เลย Voice Call จะบันทึกคำเตือนและ
  ข้าม media streaming แทนที่จะทำให้ทั้ง Plugin ล้มเหลว

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
                apiKey: "sk-...", // ไม่บังคับหากตั้ง OPENAI_API_KEY แล้ว
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
                apiKey: "${XAI_API_KEY}", // ไม่บังคับหากตั้ง XAI_API_KEY แล้ว
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

คีย์แบบเก่ายังคงถูกย้ายให้อัตโนมัติโดย `openclaw doctor --fix`:

- `streaming.sttProvider` → `streaming.provider`
- `streaming.openaiApiKey` → `streaming.providers.openai.apiKey`
- `streaming.sttModel` → `streaming.providers.openai.model`
- `streaming.silenceDurationMs` → `streaming.providers.openai.silenceDurationMs`
- `streaming.vadThreshold` → `streaming.providers.openai.vadThreshold`

## Stale call reaper

ใช้ `staleCallReaperSeconds` เพื่อจบสายที่ไม่เคยได้รับ terminal webhook
(เช่น สายแบบ notify-mode ที่ไม่เคยเสร็จสมบูรณ์) ค่าเริ่มต้นคือ `0`
(ปิดใช้งาน)

ช่วงค่าที่แนะนำ:

- **Production:** `120`–`300` วินาทีสำหรับโฟลว์แบบ notify
- ควรตั้งค่านี้ให้ **สูงกว่า `maxDurationSeconds`** เพื่อให้สายปกติ
  จบได้ ค่าตั้งต้นที่ดีคือ `maxDurationSeconds + 30–60` วินาที

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

## Webhook Security

เมื่อมี proxy หรือ tunnel อยู่หน้า Gateway Plugin จะสร้าง
public URL ขึ้นใหม่เพื่อใช้ตรวจสอบลายเซ็น ตัวเลือกเหล่านี้ควบคุมว่า forwarded
headers ใดบ้างที่เชื่อถือได้

`webhookSecurity.allowedHosts` ใช้ allowlist กับ hosts จาก forwarding headers

`webhookSecurity.trustForwardingHeaders` จะเชื่อถือ forwarded headers โดยไม่ต้องมี allowlist

`webhookSecurity.trustedProxyIPs` จะเชื่อถือ forwarded headers เฉพาะเมื่อ
IP ระยะไกลของคำขอตรงกับรายการที่กำหนด

มีการเปิดใช้การป้องกัน webhook replay สำหรับ Twilio และ Plivo คำขอ webhook
ที่ถูก replay และยังมีลายเซ็นถูกต้องจะถูกรับทราบ แต่จะข้าม side effects

เทิร์นการสนทนาของ Twilio จะมี per-turn token ใน `<Gather>` callbacks ดังนั้น
speech callbacks ที่เก่าหรือถูก replay จึงไม่สามารถตอบสนอง transcript turn ที่ใหม่กว่าซึ่งกำลังรออยู่ได้

ระบบจะปฏิเสธคำขอ webhook ที่ยังไม่ยืนยันตัวตนก่อนอ่าน body เมื่อขาด required signature headers ของผู้ให้บริการ

voice-call webhook ใช้ shared pre-auth body profile (64 KB / 5 วินาที)
พร้อม per-IP in-flight cap ก่อนการตรวจสอบลายเซ็น

ตัวอย่างเมื่อใช้ public host ที่คงที่:

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

## TTS สำหรับการโทร

Voice Call ใช้การกำหนดค่า `messages.tts` ของแกนหลักสำหรับ
การสตรีมเสียงพูดระหว่างสาย คุณสามารถ override ได้ภายใต้ config ของ Plugin ด้วย
**โครงสร้างเดียวกัน** — ระบบจะทำ deep-merge เข้ากับ `messages.tts`

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

- คีย์ `tts.<provider>` แบบเก่าภายใน config ของ Plugin (`openai`, `elevenlabs`, `microsoft`, `edge`) จะถูกย้ายให้อัตโนมัติเป็น `tts.providers.<provider>` ระหว่างโหลด ควรใช้โครงสร้าง `providers` ใน config ที่ commit แล้ว
- **Microsoft speech จะถูกละเลยสำหรับการโทรด้วยเสียง** (เสียงสำหรับระบบโทรศัพท์ต้องใช้ PCM; transport ของ Microsoft ปัจจุบันยังไม่เปิดให้ใช้ telephony PCM output)
- ระบบจะใช้ core TTS เมื่อเปิด Twilio media streaming; มิฉะนั้นสายจะ fallback ไปใช้ native voices ของผู้ให้บริการ
- หากมี Twilio media stream ทำงานอยู่แล้ว Voice Call จะไม่ fallback ไปใช้ TwiML `<Say>` หากไม่มี telephony TTS ในสถานะนั้น คำขอเล่นเสียงจะล้มเหลวแทนที่จะผสมสองเส้นทางการเล่นเสียงเข้าด้วยกัน
- เมื่อ telephony TTS fallback ไปยังผู้ให้บริการสำรอง Voice Call จะบันทึกคำเตือนพร้อม provider chain (`from`, `to`, `attempts`) เพื่อใช้ดีบัก

### ตัวอย่างเพิ่มเติม

ใช้เฉพาะ core TTS (ไม่ override):

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

override เป็น ElevenLabs เฉพาะสำหรับการโทร (คงค่า core default ไว้ที่อื่น):

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

override เฉพาะ OpenAI model สำหรับการโทร (ตัวอย่าง deep-merge):

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

## สายขาเข้า

นโยบายขาเข้ามีค่าเริ่มต้นเป็น `disabled` หากต้องการเปิดใช้สายขาเข้า ให้ตั้งค่า:

```json5
{
  inboundPolicy: "allowlist",
  allowFrom: ["+15550001234"],
  inboundGreeting: "Hello! How can I help?",
}
```

`inboundPolicy: "allowlist"` เป็นการคัดกรอง caller ID แบบความเชื่อมั่นต่ำ Plugin จะ
normalize ค่า `From` ที่ผู้ให้บริการส่งมา แล้วเปรียบเทียบกับ `allowFrom`
การตรวจสอบ webhook ยืนยันความถูกต้องของการส่งจากผู้ให้บริการและความสมบูรณ์ของ payload ได้ แต่
ไม่ได้พิสูจน์ความเป็นเจ้าของหมายเลขผู้โทรของ PSTN/VoIP ดังนั้นให้ถือว่า `allowFrom` เป็นเพียง
การกรอง caller ID ไม่ใช่การยืนยันตัวตนผู้โทรอย่างเข้มงวด

การตอบกลับอัตโนมัติใช้ระบบเอเจนต์ ปรับแต่งได้ด้วย:

- `responseModel`
- `responseSystemPrompt`
- `responseTimeoutMs`

### สัญญาเอาต์พุตเสียงพูด

สำหรับการตอบกลับอัตโนมัติ Voice Call จะต่อสัญญาเอาต์พุตเสียงพูดแบบเข้มงวดไว้ท้าย system prompt:

- `{"spoken":"..."}`

จากนั้น Voice Call จะดึงข้อความสำหรับพูดอย่างระมัดระวัง:

- ละเลย payloads ที่ถูกทำเครื่องหมายว่าเป็น reasoning/error content
- parse ทั้ง JSON แบบตรง, fenced JSON หรือคีย์ `"spoken"` แบบ inline
- fallback ไปใช้ plain text และลบย่อหน้านำที่น่าจะเป็นข้อความวางแผน/เมตา

สิ่งนี้ช่วยให้การเล่นเสียงพูดเน้นเฉพาะข้อความที่หันหน้าเข้าหาผู้โทร และหลีกเลี่ยงการรั่วไหลของข้อความวางแผนเข้าสู่เสียง

### พฤติกรรมการเริ่มต้นการสนทนา

สำหรับสายขาออกแบบ `conversation` การจัดการข้อความแรกจะผูกกับสถานะการเล่นเสียงแบบสด:

- การล้าง barge-in queue และการตอบกลับอัตโนมัติจะถูกระงับเฉพาะขณะที่คำทักทายเริ่มต้นกำลังพูดอยู่เท่านั้น
- หากการเล่นเสียงเริ่มต้นล้มเหลว สายจะกลับสู่สถานะ `listening` และข้อความเริ่มต้นจะยังคงอยู่ในคิวเพื่อ retry
- การเล่นเสียงเริ่มต้นสำหรับ Twilio streaming จะเริ่มเมื่อ stream เชื่อมต่อ โดยไม่มีการหน่วงเพิ่มเติม

### Twilio stream disconnect grace

เมื่อ Twilio media stream ตัดการเชื่อมต่อ Voice Call จะรอ `2000ms` ก่อนจบสายโดยอัตโนมัติ:

- หาก stream เชื่อมต่อใหม่ภายในช่วงเวลานั้น การจบสายอัตโนมัติจะถูกยกเลิก
- หากไม่มี stream ใหม่ถูกลงทะเบียนหลังผ่านช่วง grace period ระบบจะจบสายเพื่อป้องกันไม่ให้มี active calls ที่ค้างอยู่

## CLI

```bash
openclaw voicecall call --to "+15555550123" --message "Hello from OpenClaw"
openclaw voicecall start --to "+15555550123"   # alias ของ call
openclaw voicecall continue --call-id <id> --message "Any questions?"
openclaw voicecall speak --call-id <id> --message "One moment"
openclaw voicecall end --call-id <id>
openclaw voicecall status --call-id <id>
openclaw voicecall tail
openclaw voicecall latency                     # สรุป turn latency จาก logs
openclaw voicecall expose --mode funnel
```

`latency` จะอ่าน `calls.jsonl` จากพาธเก็บข้อมูล voice-call เริ่มต้น ใช้
`--file <path>` เพื่อชี้ไปยัง log อื่น และ `--last <n>` เพื่อจำกัดการวิเคราะห์
เฉพาะ N records ล่าสุด (ค่าเริ่มต้น 200) เอาต์พุตจะรวม p50/p90/p99 สำหรับ turn
latency และ listen-wait times

## เครื่องมือของเอเจนต์

ชื่อเครื่องมือ: `voice_call`

Actions:

- `initiate_call` (message, to?, mode?)
- `continue_call` (callId, message)
- `speak_to_user` (callId, message)
- `end_call` (callId)
- `get_status` (callId)

repo นี้มีเอกสาร skill ที่ตรงกันอยู่ที่ `skills/voice-call/SKILL.md`

## Gateway RPC

- `voicecall.initiate` (`to?`, `message`, `mode?`)
- `voicecall.continue` (`callId`, `message`)
- `voicecall.speak` (`callId`, `message`)
- `voicecall.end` (`callId`)
- `voicecall.status` (`callId`)
