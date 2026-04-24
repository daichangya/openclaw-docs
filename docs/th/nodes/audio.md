---
read_when:
    - การเปลี่ยนการถอดเสียงหรือการจัดการสื่อเสียง
summary: วิธีที่ระบบดาวน์โหลด ถอดเสียง และแทรกเสียงขาเข้าหรือ voice notes ลงในคำตอบ
title: เสียงและ voice notes
x-i18n:
    generated_at: "2026-04-24T09:19:31Z"
    model: gpt-5.4
    provider: openai
    source_hash: 464b569c97715e483c4bfc8074d2775965a0635149e0933c8e5b5d9c29d34269
    source_path: nodes/audio.md
    workflow: 15
---

# เสียง / Voice Notes (2026-01-17)

## สิ่งที่ใช้งานได้

- **ความเข้าใจสื่อ (เสียง)**: หากเปิดใช้ความเข้าใจเสียงไว้ (หรือระบบตรวจพบอัตโนมัติ) OpenClaw จะ:
  1. ค้นหาไฟล์แนบเสียงรายการแรก (พาธภายในเครื่องหรือ URL) และดาวน์โหลดหากจำเป็น
  2. บังคับใช้ `maxBytes` ก่อนส่งไปยังแต่ละ model entry
  3. รัน model entry แรกที่เข้าเกณฑ์ตามลำดับ (provider หรือ CLI)
  4. หากล้มเหลวหรือข้ามไป (ขนาด/timeout) จะลองรายการถัดไป
  5. เมื่อสำเร็จ จะแทนที่ `Body` ด้วยบล็อก `[Audio]` และตั้งค่า `{{Transcript}}`
- **การ parse คำสั่ง**: เมื่อถอดเสียงสำเร็จ `CommandBody`/`RawBody` จะถูกตั้งเป็น transcript เพื่อให้ slash commands ยังทำงานได้
- **Verbose logging**: ในโหมด `--verbose` ระบบจะบันทึกเมื่อเริ่มการถอดเสียงและเมื่อมีการแทนที่ body

## การตรวจจับอัตโนมัติ (ค่าเริ่มต้น)

หากคุณ **ไม่ได้กำหนดค่า models** และ `tools.media.audio.enabled` **ไม่ได้** ถูกตั้งเป็น `false`,
OpenClaw จะตรวจจับอัตโนมัติตามลำดับนี้และหยุดที่ตัวเลือกแรกที่ใช้งานได้:

1. **โมเดลตอบกลับที่ใช้งานอยู่** เมื่อ provider ของมันรองรับความเข้าใจเสียง
2. **CLIs ภายในเครื่อง** (หากติดตั้งไว้)
   - `sherpa-onnx-offline` (ต้องใช้ `SHERPA_ONNX_MODEL_DIR` พร้อม encoder/decoder/joiner/tokens)
   - `whisper-cli` (จาก `whisper-cpp`; ใช้ `WHISPER_CPP_MODEL` หรือ bundled tiny model)
   - `whisper` (Python CLI; ดาวน์โหลดโมเดลอัตโนมัติ)
3. **Gemini CLI** (`gemini`) โดยใช้ `read_many_files`
4. **Provider auth**
   - รายการ `models.providers.*` ที่กำหนดค่าไว้และรองรับเสียงจะถูกลองก่อน
   - ลำดับ fallback แบบ bundled คือ: OpenAI → Groq → Deepgram → Google → Mistral

หากต้องการปิดการตรวจจับอัตโนมัติ ให้ตั้ง `tools.media.audio.enabled: false`
หากต้องการกำหนดเอง ให้ตั้ง `tools.media.audio.models`
หมายเหตุ: การตรวจจับไบนารีเป็นแบบ best-effort บน macOS/Linux/Windows; ตรวจสอบให้แน่ใจว่า CLI อยู่ใน `PATH` (เราขยาย `~`) หรือกำหนด CLI model แบบ explicit พร้อมพาธคำสั่งเต็ม

## ตัวอย่าง config

### Provider + CLI fallback (OpenAI + Whisper CLI)

```json5
{
  tools: {
    media: {
      audio: {
        enabled: true,
        maxBytes: 20971520,
        models: [
          { provider: "openai", model: "gpt-4o-mini-transcribe" },
          {
            type: "cli",
            command: "whisper",
            args: ["--model", "base", "{{MediaPath}}"],
            timeoutSeconds: 45,
          },
        ],
      },
    },
  },
}
```

### Provider-only พร้อม scope gating

```json5
{
  tools: {
    media: {
      audio: {
        enabled: true,
        scope: {
          default: "allow",
          rules: [{ action: "deny", match: { chatType: "group" } }],
        },
        models: [{ provider: "openai", model: "gpt-4o-mini-transcribe" }],
      },
    },
  },
}
```

### Provider-only (Deepgram)

```json5
{
  tools: {
    media: {
      audio: {
        enabled: true,
        models: [{ provider: "deepgram", model: "nova-3" }],
      },
    },
  },
}
```

### Provider-only (Mistral Voxtral)

```json5
{
  tools: {
    media: {
      audio: {
        enabled: true,
        models: [{ provider: "mistral", model: "voxtral-mini-latest" }],
      },
    },
  },
}
```

### ส่ง transcript กลับไปในแชต (ต้อง opt-in)

```json5
{
  tools: {
    media: {
      audio: {
        enabled: true,
        echoTranscript: true, // ค่าเริ่มต้นคือ false
        echoFormat: '📝 "{transcript}"', // ไม่บังคับ รองรับ {transcript}
        models: [{ provider: "openai", model: "gpt-4o-mini-transcribe" }],
      },
    },
  },
}
```

## หมายเหตุและข้อจำกัด

- auth ของ provider เป็นไปตามลำดับ auth ของโมเดลมาตรฐาน (auth profiles, env vars, `models.providers.*.apiKey`)
- รายละเอียดการตั้งค่า Groq: [Groq](/th/providers/groq)
- Deepgram จะใช้ `DEEPGRAM_API_KEY` เมื่อใช้ `provider: "deepgram"`
- รายละเอียดการตั้งค่า Deepgram: [Deepgram (audio transcription)](/th/providers/deepgram)
- รายละเอียดการตั้งค่า Mistral: [Mistral](/th/providers/mistral)
- providers ด้านเสียงสามารถแทนที่ `baseUrl`, `headers` และ `providerOptions` ได้ผ่าน `tools.media.audio`
- ขีดจำกัดขนาดเริ่มต้นคือ 20MB (`tools.media.audio.maxBytes`) เสียงที่เกินขนาดจะถูกข้ามสำหรับโมเดลนั้น และจะลองรายการถัดไป
- ไฟล์เสียงเล็กมาก/ว่างที่ต่ำกว่า 1024 ไบต์จะถูกข้ามก่อนการถอดเสียงผ่าน provider/CLI
- ค่า `maxChars` เริ่มต้นสำหรับเสียงคือ **ไม่ได้ตั้งไว้** (ใช้ transcript เต็ม) ตั้ง `tools.media.audio.maxChars` หรือ `maxChars` แยกต่อ entry เพื่อตัดความยาวเอาต์พุต
- ค่าเริ่มต้นอัตโนมัติของ OpenAI คือ `gpt-4o-mini-transcribe`; ตั้ง `model: "gpt-4o-transcribe"` เพื่อความแม่นยำที่สูงกว่า
- ใช้ `tools.media.audio.attachments` เพื่อประมวลผล voice notes หลายรายการ (`mode: "all"` + `maxAttachments`)
- transcript ใช้ได้ใน templates ผ่าน `{{Transcript}}`
- `tools.media.audio.echoTranscript` ปิดไว้เป็นค่าเริ่มต้น; เปิดใช้หากต้องการส่งการยืนยัน transcript กลับไปยังแชตต้นทางก่อนประมวลผลโดยเอเจนต์
- `tools.media.audio.echoFormat` ใช้ปรับแต่งข้อความ echo (placeholder: `{transcript}`)
- stdout ของ CLI ถูกจำกัดไว้ที่ 5MB; ควรทำให้เอาต์พุตของ CLI กระชับ

### การรองรับ proxy environment

การถอดเสียงแบบใช้ provider จะรองรับ outbound proxy env vars มาตรฐาน:

- `HTTPS_PROXY`
- `HTTP_PROXY`
- `https_proxy`
- `http_proxy`

หากไม่ได้ตั้ง proxy env vars ระบบจะใช้ direct egress หาก config ของ proxy ผิดรูปแบบ OpenClaw จะบันทึกคำเตือนและ fallback ไปใช้ direct fetch

## การตรวจจับ mention ในกลุ่ม

เมื่อมีการตั้ง `requireMention: true` สำหรับแชตกลุ่ม OpenClaw จะถอดเสียง **ก่อน** ตรวจ mentions วิธีนี้ทำให้ voice notes ถูกประมวลผลได้แม้จะมี mentions อยู่ภายในเสียงนั้น

**วิธีการทำงาน:**

1. หากข้อความเสียงไม่มี text body และกลุ่มนั้นต้องมี mentions, OpenClaw จะทำการถอดเสียงแบบ "preflight"
2. transcript จะถูกตรวจหา mention patterns (เช่น `@BotName`, ทริกเกอร์แบบอีโมจิ)
3. หากพบ mention ข้อความจะเข้าสู่ reply pipeline เต็มรูปแบบ
4. transcript จะถูกใช้ในการตรวจจับ mention เพื่อให้ voice notes ผ่าน mention gate ได้

**พฤติกรรม fallback:**

- หากการถอดเสียงล้มเหลวในระหว่าง preflight (timeout, API error เป็นต้น) ข้อความจะถูกประมวลผลโดยอิงจากการตรวจจับ mention แบบ text-only
- วิธีนี้ช่วยให้ mixed messages (text + audio) ไม่ถูกทิ้งอย่างผิดพลาด

**Opt-out แยกตาม Telegram group/topic:**

- ตั้งค่า `channels.telegram.groups.<chatId>.disableAudioPreflight: true` เพื่อข้ามการตรวจ mention จาก transcript แบบ preflight สำหรับกลุ่มนั้น
- ตั้งค่า `channels.telegram.groups.<chatId>.topics.<threadId>.disableAudioPreflight` เพื่อแทนที่แยกตาม topic (`true` เพื่อข้าม, `false` เพื่อบังคับเปิดใช้)
- ค่าเริ่มต้นคือ `false` (เปิดใช้ preflight เมื่อเงื่อนไข mention-gated ตรงกัน)

**ตัวอย่าง:** ผู้ใช้ส่ง voice note พูดว่า "Hey @Claude, what's the weather?" ในกลุ่ม Telegram ที่ตั้ง `requireMention: true` ระบบจะถอดเสียง voice note, ตรวจพบ mention แล้วเอเจนต์จะตอบกลับ

## ข้อควรระวัง

- กฎ scope ใช้แบบ first-match wins ค่า `chatType` จะถูก normalize เป็น `direct`, `group` หรือ `room`
- ตรวจให้แน่ใจว่า CLI ของคุณ exit 0 และพิมพ์ plain text; หากเป็น JSON ต้องปรับแต่งด้วย `jq -r .text`
- สำหรับ `parakeet-mlx` หากคุณส่ง `--output-dir`, OpenClaw จะอ่าน `<output-dir>/<media-basename>.txt` เมื่อ `--output-format` เป็น `txt` (หรือไม่ได้ระบุ); output formats ที่ไม่ใช่ `txt` จะ fallback ไปใช้การ parse จาก stdout
- กำหนด timeouts ให้สมเหตุสมผล (`timeoutSeconds`, ค่าเริ่มต้น 60 วินาที) เพื่อหลีกเลี่ยงการบล็อก reply queue
- การถอดเสียงแบบ preflight จะประมวลผลเฉพาะไฟล์แนบเสียง **รายการแรก** เท่านั้นสำหรับการตรวจจับ mention เสียงเพิ่มเติมจะถูกประมวลผลในระยะ media understanding หลัก

## ที่เกี่ยวข้อง

- [Media understanding](/th/nodes/media-understanding)
- [Talk mode](/th/nodes/talk)
- [Voice wake](/th/nodes/voicewake)
