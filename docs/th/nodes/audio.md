---
read_when:
    - การเปลี่ยนการถอดเสียงหรือการจัดการสื่อเสียง
summary: วิธีที่เสียงขาเข้า/voice note ถูกดาวน์โหลด ถอดความ และ inject เข้าไปในการตอบกลับ
title: เสียงและ voice note
x-i18n:
    generated_at: "2026-04-23T05:42:39Z"
    model: gpt-5.4
    provider: openai
    source_hash: dd464df24268b1104c9bbdb6f424ba90747342b4c0f4d2e39d95055708cbd0ae
    source_path: nodes/audio.md
    workflow: 15
---

# เสียง / voice note (2026-01-17)

## สิ่งที่ใช้งานได้

- **การทำความเข้าใจสื่อ (เสียง)**: หากเปิดใช้การทำความเข้าใจเสียงไว้ (หรือมีการตรวจจับอัตโนมัติ) OpenClaw จะ:
  1. ค้นหาไฟล์แนบเสียงรายการแรก (พาธในเครื่องหรือ URL) และดาวน์โหลดหากจำเป็น
  2. บังคับใช้ `maxBytes` ก่อนส่งให้แต่ละรายการโมเดล
  3. รันรายการโมเดลแรกที่เข้าเกณฑ์ตามลำดับ (ผู้ให้บริการหรือ CLI)
  4. หากล้มเหลวหรือข้าม (ขนาด/timeout) จะลองรายการถัดไป
  5. เมื่อสำเร็จ จะแทนที่ `Body` ด้วยบล็อก `[Audio]` และตั้งค่า `{{Transcript}}`
- **การแยกคำสั่ง**: เมื่อการถอดเสียงสำเร็จ `CommandBody`/`RawBody` จะถูกตั้งเป็น transcript เพื่อให้ slash command ยังทำงานได้
- **Verbose logging**: ในโหมด `--verbose` เราจะบันทึก log เมื่อมีการถอดเสียง และเมื่อมีการแทนที่ body

## การตรวจจับอัตโนมัติ (ค่าเริ่มต้น)

หากคุณ **ไม่ได้กำหนดค่าโมเดล** และ `tools.media.audio.enabled` **ไม่ได้**ตั้งเป็น `false`,
OpenClaw จะตรวจจับอัตโนมัติตามลำดับนี้ และหยุดเมื่อเจอตัวเลือกแรกที่ใช้งานได้:

1. **โมเดลตอบกลับที่กำลังใช้งานอยู่** เมื่อผู้ให้บริการรองรับการทำความเข้าใจเสียง
2. **CLI ภายในเครื่อง** (หากติดตั้งไว้)
   - `sherpa-onnx-offline` (ต้องใช้ `SHERPA_ONNX_MODEL_DIR` พร้อม encoder/decoder/joiner/tokens)
   - `whisper-cli` (จาก `whisper-cpp`; ใช้ `WHISPER_CPP_MODEL` หรือโมเดล tiny แบบ bundled)
   - `whisper` (Python CLI; ดาวน์โหลดโมเดลอัตโนมัติ)
3. **Gemini CLI** (`gemini`) โดยใช้ `read_many_files`
4. **การยืนยันตัวตนของผู้ให้บริการ**
   - รายการ `models.providers.*` ที่ตั้งค่าไว้และรองรับเสียงจะถูกลองก่อน
   - ลำดับ fallback แบบ bundled คือ: OpenAI → Groq → Deepgram → Google → Mistral

หากต้องการปิดการตรวจจับอัตโนมัติ ให้ตั้ง `tools.media.audio.enabled: false`
หากต้องการปรับแต่ง ให้ตั้ง `tools.media.audio.models`
หมายเหตุ: การตรวจจับไบนารีเป็นแบบ best-effort ข้าม macOS/Linux/Windows; ตรวจสอบให้แน่ใจว่า CLI อยู่ใน `PATH` (เราขยาย `~`) หรือกำหนด CLI model แบบ explicit พร้อมพาธคำสั่งเต็ม

## ตัวอย่างคอนฟิก

### ผู้ให้บริการ + CLI fallback (OpenAI + Whisper CLI)

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

### ผู้ให้บริการอย่างเดียวพร้อมการควบคุมด้วย scope

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

### ผู้ให้บริการอย่างเดียว (Deepgram)

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

### ผู้ให้บริการอย่างเดียว (Mistral Voxtral)

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

### ส่ง transcript กลับเข้าแชต (ต้องเลือกเปิดเอง)

```json5
{
  tools: {
    media: {
      audio: {
        enabled: true,
        echoTranscript: true, // default is false
        echoFormat: '📝 "{transcript}"', // optional, supports {transcript}
        models: [{ provider: "openai", model: "gpt-4o-mini-transcribe" }],
      },
    },
  },
}
```

## หมายเหตุและข้อจำกัด

- การยืนยันตัวตนของผู้ให้บริการเป็นไปตามลำดับการยืนยันตัวตนของโมเดลมาตรฐาน (auth profile, env var, `models.providers.*.apiKey`)
- รายละเอียดการตั้งค่า Groq: [Groq](/th/providers/groq)
- Deepgram จะหยิบ `DEEPGRAM_API_KEY` เมื่อใช้ `provider: "deepgram"`
- รายละเอียดการตั้งค่า Deepgram: [Deepgram (การถอดเสียง)](/th/providers/deepgram)
- รายละเอียดการตั้งค่า Mistral: [Mistral](/th/providers/mistral)
- ผู้ให้บริการเสียงสามารถ override `baseUrl`, `headers` และ `providerOptions` ผ่าน `tools.media.audio` ได้
- เพดานขนาดค่าเริ่มต้นคือ 20MB (`tools.media.audio.maxBytes`) เสียงที่ใหญ่เกินจะถูกข้ามสำหรับโมเดลนั้น และจะลองรายการถัดไป
- ไฟล์เสียงที่เล็กมาก/ว่างเปล่าซึ่งต่ำกว่า 1024 ไบต์จะถูกข้ามก่อนการถอดเสียงด้วยผู้ให้บริการ/CLI
- ค่า `maxChars` เริ่มต้นสำหรับเสียงคือ **ไม่ได้ตั้งค่า** (ใช้ transcript เต็ม) ตั้ง `tools.media.audio.maxChars` หรือ `maxChars` แยกต่อรายการเพื่อจำกัดผลลัพธ์
- ค่าเริ่มต้นอัตโนมัติของ OpenAI คือ `gpt-4o-mini-transcribe`; ตั้ง `model: "gpt-4o-transcribe"` เพื่อความแม่นยำที่สูงกว่า
- ใช้ `tools.media.audio.attachments` เพื่อประมวลผล voice note หลายรายการ (`mode: "all"` + `maxAttachments`)
- Transcript ใช้งานได้ใน template ผ่าน `{{Transcript}}`
- `tools.media.audio.echoTranscript` ปิดอยู่โดยค่าเริ่มต้น; ให้เปิดหากต้องการส่งการยืนยัน transcript กลับไปยังแชตต้นทางก่อนการประมวลผลของเอเจนต์
- `tools.media.audio.echoFormat` ใช้ปรับแต่งข้อความ echo (placeholder: `{transcript}`)
- stdout ของ CLI ถูกจำกัดไว้ที่ 5MB; ควรทำให้เอาต์พุตของ CLI กระชับ

### การรองรับตัวแปรสภาพแวดล้อม proxy

การถอดเสียงแบบอิงผู้ให้บริการรองรับ env var ของ proxy ขาออกมาตรฐาน:

- `HTTPS_PROXY`
- `HTTP_PROXY`
- `https_proxy`
- `http_proxy`

หากไม่มีการตั้ง proxy env var จะใช้การออกอินเทอร์เน็ตโดยตรง หากคอนฟิก proxy ผิดรูปแบบ OpenClaw จะบันทึกคำเตือนและ fallback ไปใช้การดึงข้อมูลโดยตรง

## การตรวจจับการกล่าวถึงในกลุ่ม

เมื่อมีการตั้ง `requireMention: true` สำหรับแชตกลุ่ม ตอนนี้ OpenClaw จะถอดเสียง **ก่อน** ตรวจสอบการกล่าวถึง วิธีนี้ทำให้ voice note ถูกประมวลผลได้แม้ว่าจะมีการกล่าวถึงอยู่ภายในเสียงนั้นก็ตาม

**วิธีการทำงาน:**

1. หากข้อความเสียงไม่มีเนื้อหาข้อความ และกลุ่มนั้นกำหนดให้ต้องมีการกล่าวถึง OpenClaw จะทำการถอดเสียงแบบ "preflight"
2. transcript จะถูกตรวจสอบกับแพตเทิร์นการกล่าวถึง (เช่น `@BotName`, trigger แบบอีโมจิ)
3. หากพบการกล่าวถึง ข้อความจะเข้าสู่ pipeline การตอบกลับเต็มรูปแบบ
4. transcript จะถูกใช้สำหรับการตรวจจับการกล่าวถึง เพื่อให้ voice note ผ่าน mention gate ได้

**พฤติกรรม fallback:**

- หากการถอดเสียงล้มเหลวระหว่าง preflight (timeout, API error ฯลฯ) ข้อความจะถูกประมวลผลตามการตรวจจับการกล่าวถึงจากข้อความล้วน
- วิธีนี้ช่วยให้ข้อความแบบผสม (ข้อความ + เสียง) ไม่ถูกทิ้งผิดพลาด

**การเลือกไม่ใช้แยกตามกลุ่ม/หัวข้อของ Telegram:**

- ตั้ง `channels.telegram.groups.<chatId>.disableAudioPreflight: true` เพื่อข้ามการตรวจการกล่าวถึงผ่าน transcript แบบ preflight สำหรับกลุ่มนั้น
- ตั้ง `channels.telegram.groups.<chatId>.topics.<threadId>.disableAudioPreflight` เพื่อ override แยกตามหัวข้อ (`true` เพื่อข้าม, `false` เพื่อบังคับเปิด)
- ค่าเริ่มต้นคือ `false` (เปิด preflight เมื่อเงื่อนไข mention-gated ตรงกัน)

**ตัวอย่าง:** ผู้ใช้ส่ง voice note ที่พูดว่า "Hey @Claude, what's the weather?" ในกลุ่ม Telegram ที่ตั้ง `requireMention: true` voice note จะถูกถอดเสียง ตรวจพบการกล่าวถึง และเอเจนต์จะตอบกลับ

## ข้อควรระวัง

- กฎของ scope ใช้หลักจับคู่ตัวแรกชนะ `chatType` จะถูก normalize เป็น `direct`, `group` หรือ `room`
- ตรวจสอบให้แน่ใจว่า CLI ของคุณออกด้วยรหัส 0 และพิมพ์ข้อความล้วน; หากเป็น JSON ต้องจัดรูปแบบผ่าน `jq -r .text`
- สำหรับ `parakeet-mlx` หากคุณส่ง `--output-dir`, OpenClaw จะอ่าน `<output-dir>/<media-basename>.txt` เมื่อ `--output-format` เป็น `txt` (หรือไม่ได้ระบุ); รูปแบบเอาต์พุตที่ไม่ใช่ `txt` จะ fallback ไปแยกจาก stdout
- ควรตั้ง timeout ให้เหมาะสม (`timeoutSeconds`, ค่าเริ่มต้น 60 วินาที) เพื่อหลีกเลี่ยงการบล็อกคิวตอบกลับ
- การถอดเสียงแบบ preflight จะประมวลผลเฉพาะไฟล์แนบเสียง **รายการแรก** เพื่อใช้ตรวจจับการกล่าวถึงเท่านั้น ส่วนเสียงเพิ่มเติมจะถูกประมวลผลในช่วงหลักของการทำความเข้าใจสื่อ
