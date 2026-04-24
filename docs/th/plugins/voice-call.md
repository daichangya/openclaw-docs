---
read_when:
    - คุณต้องการโทรออกด้วยเสียงจาก OpenClaw
    - คุณกำลังกำหนดค่าหรือพัฒนา Plugin voice-call
summary: 'Plugin Voice Call: โทรออก + รับสายผ่าน Twilio/Telnyx/Plivo (การติดตั้ง Plugin + คอนฟิก + CLI)'
title: Plugin Voice Call
x-i18n:
    generated_at: "2026-04-24T09:26:31Z"
    model: gpt-5.4
    provider: openai
    source_hash: 4cd57118133506c22604ab9592a823546a91795ab425de4b7a81edbbb8374e6d
    source_path: plugins/voice-call.md
    workflow: 15
---

# Voice Call (Plugin)

การโทรด้วยเสียงสำหรับ OpenClaw ผ่าน Plugin รองรับการแจ้งเตือนแบบโทรออกและ
การสนทนาหลายเทิร์น พร้อมนโยบายสำหรับสายเข้า

provider ปัจจุบัน:

- `twilio` (Programmable Voice + Media Streams)
- `telnyx` (Call Control v2)
- `plivo` (Voice API + XML transfer + GetInput speech)
- `mock` (dev/ไม่มีเครือข่าย)

ภาพรวมแบบสั้น:

- ติดตั้ง Plugin
- รีสตาร์ต Gateway
- กำหนดค่าภายใต้ `plugins.entries.voice-call.config`
- ใช้ `openclaw voicecall ...` หรือเครื่องมือ `voice_call`

## ตำแหน่งที่มันทำงาน (local vs remote)

Plugin Voice Call ทำงาน **ภายในโพรเซสของ Gateway**

หากคุณใช้ Gateway แบบ remote ให้ติดตั้ง/กำหนดค่า Plugin บน **เครื่องที่รัน Gateway** แล้วรีสตาร์ต Gateway เพื่อโหลดมัน

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

## คอนฟิก

ตั้งค่าภายใต้ `plugins.entries.voice-call.config`:

```json5
{
  plugins: {
    entries: {
      "voice-call": {
        enabled: true,
        config: {
          provider: "twilio", // or "telnyx" | "plivo" | "mock"
          fromNumber: "+15550001234", // or TWILIO_FROM_NUMBER for Twilio
          toNumber: "+15550005678",

          twilio: {
            accountSid: "ACxxxxxxxx",
            authToken: "...",
          },

          telnyx: {
            apiKey: "...",
            connectionId: "...",
            // Telnyx webhook public key from the Telnyx Mission Control Portal
            // (Base64 string; can also be set via TELNYX_PUBLIC_KEY).
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

          // Webhook security (recommended for tunnels/proxies)
          webhookSecurity: {
            allowedHosts: ["voice.example.com"],
            trustedProxyIPs: ["100.64.0.1"],
          },

          // Public exposure (pick one)
          // publicUrl: "https://example.ngrok.app/voice/webhook",
          // tunnel: { provider: "ngrok" },
          // tailscale: { mode: "funnel", path: "/voice/webhook" }

          outbound: {
            defaultMode: "notify", // notify | conversation
          },

          streaming: {
            enabled: true,
            provider: "openai", // optional; first registered realtime transcription provider when unset
            streamPath: "/voice/stream",
            providers: {
              openai: {
                apiKey: "sk-...", // optional if OPENAI_API_KEY is set
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

- Twilio/Telnyx ต้องใช้ URL ของ webhook ที่ **เข้าถึงได้จากสาธารณะ**
- Plivo ต้องใช้ URL ของ webhook ที่ **เข้าถึงได้จากสาธารณะ**
- `mock` เป็น provider สำหรับ local dev (ไม่มี network call)
- หากคอนฟิกเก่ายังคงใช้ `provider: "log"`, `twilio.from` หรือคีย์ OpenAI แบบ legacy ใน `streaming.*` ให้รัน `openclaw doctor --fix` เพื่อเขียนใหม่
- Telnyx ต้องใช้ `telnyx.publicKey` (หรือ `TELNYX_PUBLIC_KEY`) เว้นแต่ `skipSignatureVerification` จะเป็น true
- `skipSignatureVerification` มีไว้สำหรับการทดสอบในเครื่องเท่านั้น
- หากคุณใช้ ngrok free tier ให้ตั้ง `publicUrl` เป็น URL ของ ngrok แบบตรงตัว; การตรวจสอบลายเซ็นจะถูกบังคับใช้เสมอ
- `tunnel.allowNgrokFreeTierLoopbackBypass: true` อนุญาตให้ webhook ของ Twilio ที่มีลายเซ็นไม่ถูกต้องผ่านได้ **เฉพาะ** เมื่อ `tunnel.provider="ngrok"` และ `serve.bind` เป็น loopback (ngrok local agent) ใช้สำหรับ local dev เท่านั้น
- URL ของ ngrok free tier อาจเปลี่ยนหรือมีพฤติกรรม interstitial เพิ่มเติม; หาก `publicUrl` ไม่ตรง ลายเซ็นของ Twilio จะล้มเหลว สำหรับ production ควรใช้โดเมนที่คงที่หรือ Tailscale funnel
- ค่าเริ่มต้นด้านความปลอดภัยของ streaming:
  - `streaming.preStartTimeoutMs` จะปิด socket ที่ไม่เคยส่งเฟรม `start` ที่ถูกต้อง
- `streaming.maxPendingConnections` จำกัดจำนวน socket ก่อนเริ่มที่ยังไม่ยืนยันตัวตนทั้งหมด
- `streaming.maxPendingConnectionsPerIp` จำกัดจำนวน socket ก่อนเริ่มที่ยังไม่ยืนยันตัวตนต่อ source IP
- `streaming.maxConnections` จำกัดจำนวน socket ของ media stream ที่เปิดอยู่ทั้งหมด (ทั้ง pending + active)
- runtime fallback ยังคงยอมรับคีย์ voice-call เก่าเหล่านั้นอยู่ในตอนนี้ แต่เส้นทางสำหรับการเขียนใหม่คือ `openclaw doctor --fix` และ compat shim นี้เป็นเพียงชั่วคราว

## การถอดเสียงแบบสตรีม

`streaming` ใช้เลือก provider สำหรับการถอดเสียงแบบ realtime สำหรับเสียงการโทรสด

พฤติกรรมของ runtime ปัจจุบัน:

- `streaming.provider` เป็นแบบไม่บังคับ หากไม่ตั้งค่า Voice Call จะใช้
  realtime transcription provider ตัวแรกที่ลงทะเบียนไว้
- realtime transcription provider ที่มาพร้อมระบบได้แก่ Deepgram (`deepgram`),
  ElevenLabs (`elevenlabs`), Mistral (`mistral`), OpenAI (`openai`) และ xAI
  (`xai`) ซึ่งลงทะเบียนโดย provider plugin ของแต่ละตัว
- raw config ที่ provider เป็นเจ้าของอยู่ภายใต้ `streaming.providers.<providerId>`
- หาก `streaming.provider` ชี้ไปยัง provider ที่ยังไม่ได้ลงทะเบียน หรือไม่มี realtime
  transcription provider ลงทะเบียนไว้เลย Voice Call จะบันทึกคำเตือนและ
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
                apiKey: "sk-...", // optional if OPENAI_API_KEY is set
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
                apiKey: "${XAI_API_KEY}", // optional if XAI_API_KEY is set
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

คีย์แบบ legacy ยังคงถูกย้ายอัตโนมัติโดย `openclaw doctor --fix`:

- `streaming.sttProvider` → `streaming.provider`
- `streaming.openaiApiKey` → `streaming.providers.openai.apiKey`
- `streaming.sttModel` → `streaming.providers.openai.model`
- `streaming.silenceDurationMs` → `streaming.providers.openai.silenceDurationMs`
- `streaming.vadThreshold` → `streaming.providers.openai.vadThreshold`

## ตัวเก็บกวาดสายค้าง

ใช้ `staleCallReaperSeconds` เพื่อจบสายที่ไม่เคยได้รับ terminal webhook
(เช่น สายโหมด notify ที่ไม่เคยเสร็จสมบูรณ์) ค่าปริยายคือ `0`
(ปิดใช้งาน)

ช่วงค่าที่แนะนำ:

- **Production:** `120`–`300` วินาทีสำหรับ flow แบบ notify
- ควรตั้งค่านี้ **ให้มากกว่า `maxDurationSeconds`** เพื่อให้สายปกติ
  จบการทำงานได้ ค่าเริ่มต้นที่ดีคือ `maxDurationSeconds + 30–60` วินาที

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
URL สาธารณะขึ้นใหม่สำหรับการตรวจสอบลายเซ็น ตัวเลือกเหล่านี้ใช้ควบคุมว่าจะเชื่อถือ
forwarded header ใดบ้าง

`webhookSecurity.allowedHosts` ใช้ทำ allowlist ของ host จาก forwarding header

`webhookSecurity.trustForwardingHeaders` ใช้เชื่อถือ forwarded header โดยไม่ต้องมี allowlist

`webhookSecurity.trustedProxyIPs` จะเชื่อถือ forwarded header เฉพาะเมื่อ
remote IP ของคำขอตรงกับรายการเท่านั้น

ระบบเปิดใช้การป้องกัน webhook replay สำหรับ Twilio และ Plivo คำขอ webhook ที่ถูก replay
และยังมีลายเซ็นถูกต้องจะถูกรับทราบ แต่จะข้าม side effect

เทิร์นการสนทนาของ Twilio จะมีโทเค็นต่อเทิร์นอยู่ใน callback ของ `<Gather>` ดังนั้น callback ของคำพูดที่เก่าหรือถูก replay จะไม่สามารถทำให้ transcript turn ที่รออยู่ใหม่สำเร็จได้

คำขอ webhook ที่ไม่ผ่านการยืนยันตัวตนจะถูกปฏิเสธก่อนอ่าน body เมื่อ
ไม่มี signature header ที่ provider ต้องการ

webhook ของ voice-call ใช้ pre-auth body profile ที่ใช้ร่วมกัน (64 KB / 5 วินาที)
พร้อมเพดานจำนวน in-flight ต่อ IP ก่อนการตรวจสอบลายเซ็น

ตัวอย่างที่ใช้ public host แบบคงที่:

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

Voice Call ใช้คอนฟิก `messages.tts` ของ core สำหรับ
การสตรีมเสียงพูดบนสายโทร คุณสามารถ override ได้ภายใต้คอนฟิกของ Plugin โดยใช้
**โครงสร้างเดียวกัน** — มันจะ deep‑merge กับ `messages.tts`

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

- คีย์แบบ legacy `tts.<provider>` ภายในคอนฟิกของ Plugin (`openai`, `elevenlabs`, `microsoft`, `edge`) จะถูกย้ายไปยัง `tts.providers.<provider>` อัตโนมัติระหว่างโหลด ควรใช้โครงสร้าง `providers` ในคอนฟิกที่ commit ไว้
- **Microsoft speech จะถูกละเลยสำหรับ voice call** (เสียงโทรศัพท์ต้องใช้ PCM; transport ปัจจุบันของ Microsoft ยังไม่เปิดเผยเอาต์พุต PCM สำหรับโทรศัพท์)
- จะใช้ core TTS เมื่อเปิดใช้ Twilio media streaming; มิฉะนั้นสายโทรจะ fallback ไปใช้เสียงเนทีฟของ provider
- หากมี Twilio media stream เปิดใช้งานอยู่แล้ว Voice Call จะไม่ fallback ไปใช้ TwiML `<Say>` หาก telephony TTS ใช้ไม่ได้ในสถานะนั้น คำขอเล่นเสียงจะล้มเหลวแทนที่จะผสมเส้นทางการเล่นสองแบบเข้าด้วยกัน
- เมื่อ telephony TTS fallback ไปยัง provider รอง Voice Call จะบันทึกคำเตือนพร้อม provider chain (`from`, `to`, `attempts`) เพื่อช่วยในการดีบัก

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

override เป็น ElevenLabs เฉพาะสำหรับการโทร (ยังคงค่าเริ่มต้นของ core ไว้สำหรับที่อื่น):

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

override เฉพาะโมเดล OpenAI สำหรับการโทร (ตัวอย่าง deep‑merge):

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

## สายเข้า

นโยบายสายเข้ามีค่าปริยายเป็น `disabled` หากต้องการเปิดใช้สายเข้า ให้ตั้งค่า:

```json5
{
  inboundPolicy: "allowlist",
  allowFrom: ["+15550001234"],
  inboundGreeting: "Hello! How can I help?",
}
```

`inboundPolicy: "allowlist"` เป็นเพียงการคัดกรอง caller ID แบบความเชื่อมั่นต่ำ Plugin จะ
normalize ค่า `From` ที่ provider ส่งมา แล้วเปรียบเทียบกับ `allowFrom`
การตรวจสอบ webhook ช่วยยืนยันการส่งมาจาก provider และความสมบูรณ์ของ payload แต่
ไม่ได้พิสูจน์ความเป็นเจ้าของหมายเลขผู้โทรบน PSTN/VoIP ให้ถือว่า `allowFrom` เป็นการกรองตาม caller ID ไม่ใช่การยืนยันตัวตนของผู้โทรที่แข็งแรง

การตอบกลับอัตโนมัติใช้ระบบเอเจนต์ ปรับแต่งได้ด้วย:

- `responseModel`
- `responseSystemPrompt`
- `responseTimeoutMs`

### สัญญาของเอาต์พุตเสียงพูด

สำหรับการตอบกลับอัตโนมัติ Voice Call จะต่อสัญญาเอาต์พุตเสียงพูดแบบเข้มงวดเข้ากับ system prompt:

- `{"spoken":"..."}`

จากนั้น Voice Call จะดึงข้อความพูดแบบป้องกันไว้ก่อน:

- ละเลย payload ที่ถูกทำเครื่องหมายว่าเป็นเนื้อหา reasoning/error
- parse ได้ทั้ง JSON ตรง ๆ, JSON ที่อยู่ใน code fence หรือคีย์ `"spoken"` แบบ inline
- fallback ไปใช้ข้อความล้วน และลบย่อหน้านำที่น่าจะเป็นข้อความวางแผน/meta ออก

สิ่งนี้ทำให้การเล่นเสียงพูดโฟกัสที่ข้อความสำหรับผู้โทร และหลีกเลี่ยงการรั่วไหลของข้อความวางแผนออกไปเป็นเสียง

### พฤติกรรมตอนเริ่มการสนทนา

สำหรับสายโทรออกแบบ `conversation` การจัดการข้อความแรกจะผูกกับสถานะการเล่นสด:

- การล้างคิวสำหรับ barge-in และการตอบกลับอัตโนมัติจะถูกระงับเฉพาะขณะที่คำทักทายเริ่มต้นกำลังเล่นอยู่เท่านั้น
- หากการเล่นเริ่มต้นล้มเหลว สายจะกลับสู่สถานะ `listening` และข้อความเริ่มต้นจะยังคงอยู่ในคิวเพื่อให้ลองใหม่
- การเล่นเริ่มต้นสำหรับ Twilio streaming จะเริ่มเมื่อ stream เชื่อมต่อ โดยไม่มีการหน่วงเพิ่มเติม

### ช่วงผ่อนผันเมื่อ Twilio stream หลุด

เมื่อ Twilio media stream หลุด Voice Call จะรอ `2000ms` ก่อนจบสายอัตโนมัติ:

- หาก stream เชื่อมต่อใหม่ภายในช่วงเวลานั้น การจบสายอัตโนมัติจะถูกยกเลิก
- หากไม่มี stream ใดถูกลงทะเบียนใหม่หลังหมดช่วงผ่อนผัน สายจะถูกจบเพื่อป้องกันสาย active ที่ค้างอยู่

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
openclaw voicecall latency                     # summarize turn latency from logs
openclaw voicecall expose --mode funnel
```

`latency` จะอ่าน `calls.jsonl` จากพาธจัดเก็บเริ่มต้นของ voice-call ใช้
`--file <path>` เพื่อชี้ไปยัง log อื่น และ `--last <n>` เพื่อจำกัดการวิเคราะห์
ไว้ที่ N ระเบียนล่าสุด (ค่าปริยาย 200) เอาต์พุตจะรวม p50/p90/p99 สำหรับ
turn latency และเวลา listen-wait

## เครื่องมือของเอเจนต์

ชื่อเครื่องมือ: `voice_call`

action:

- `initiate_call` (message, to?, mode?)
- `continue_call` (callId, message)
- `speak_to_user` (callId, message)
- `send_dtmf` (callId, digits)
- `end_call` (callId)
- `get_status` (callId)

repo นี้มาพร้อมเอกสาร skill ที่ตรงกันที่ `skills/voice-call/SKILL.md`

## Gateway RPC

- `voicecall.initiate` (`to?`, `message`, `mode?`)
- `voicecall.continue` (`callId`, `message`)
- `voicecall.speak` (`callId`, `message`)
- `voicecall.dtmf` (`callId`, `digits`)
- `voicecall.end` (`callId`)
- `voicecall.status` (`callId`)

## ที่เกี่ยวข้อง

- [Text-to-speech](/th/tools/tts)
- [โหมด Talk](/th/nodes/talk)
- [Voice wake](/th/nodes/voicewake)
