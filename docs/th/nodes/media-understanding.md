---
read_when:
    - การออกแบบหรือปรับโครงสร้างการทำความเข้าใจสื่อ
    - การปรับแต่งการประมวลผลล่วงหน้าสำหรับเสียง/วิดีโอ/รูปภาพขาเข้า
summary: การทำความเข้าใจรูปภาพ/เสียง/วิดีโอขาเข้า (ไม่บังคับ) พร้อม fallbacks ของ provider + CLI
title: การทำความเข้าใจสื่อ
x-i18n:
    generated_at: "2026-04-24T09:20:09Z"
    model: gpt-5.4
    provider: openai
    source_hash: a9eb9449fbc1bed170bbef213aa43d71d4146edbc0dd626ef50af9e044a8e299
    source_path: nodes/media-understanding.md
    workflow: 15
---

# การทำความเข้าใจสื่อ - ขาเข้า (2026-01-17)

OpenClaw สามารถ **สรุปสื่อขาเข้า** (รูปภาพ/เสียง/วิดีโอ) ก่อนที่ reply pipeline จะทำงาน มันจะตรวจจับอัตโนมัติเมื่อมี local tools หรือ provider keys พร้อมใช้งาน และสามารถปิดหรือปรับแต่งได้ หากปิดการทำความเข้าใจไว้ โมเดลก็ยังคงได้รับไฟล์/URLs ต้นฉบับตามปกติ

พฤติกรรมของสื่อที่เฉพาะกับ vendor จะถูกลงทะเบียนโดย vendor plugins ขณะที่
core ของ OpenClaw เป็นเจ้าของ `tools.media` config ที่ใช้ร่วมกัน ลำดับ fallback และการผสานเข้ากับ reply pipeline

## เป้าหมาย

- ไม่บังคับ: ย่อยสื่อขาเข้าให้เป็นข้อความสั้นล่วงหน้า เพื่อให้ routing เร็วขึ้นและแปลคำสั่งได้ดีขึ้น
- รักษาการส่งมอบสื่อต้นฉบับไปยังโมเดลไว้เสมอ
- รองรับทั้ง **provider APIs** และ **CLI fallbacks**
- อนุญาตหลายโมเดลพร้อม fallback แบบมีลำดับ (error/size/timeout)

## พฤติกรรมระดับสูง

1. รวบรวม attachments ขาเข้า (`MediaPaths`, `MediaUrls`, `MediaTypes`)
2. สำหรับแต่ละ capability ที่เปิดใช้งาน (image/audio/video), เลือก attachments ตาม policy (ค่าเริ่มต้น: **ตัวแรก**)
3. เลือก model entry ตัวแรกที่เข้าเงื่อนไข (size + capability + auth)
4. หากโมเดลล้มเหลวหรือสื่อมีขนาดใหญ่เกินไป ให้ **fallback ไปยัง entry ถัดไป**
5. เมื่อสำเร็จ:
   - `Body` จะกลายเป็นบล็อก `[Image]`, `[Audio]` หรือ `[Video]`
   - เสียงจะตั้งค่า `{{Transcript}}`; การแปลคำสั่งจะใช้ข้อความคำบรรยายเมื่อมี
     มิฉะนั้นจะใช้ transcript
   - คำบรรยายจะถูกเก็บรักษาไว้เป็น `User text:` ภายในบล็อก

หากการทำความเข้าใจล้มเหลวหรือถูกปิดใช้งาน **reply flow จะทำงานต่อ** โดยใช้ body + attachments ต้นฉบับ

## ภาพรวมของ Config

`tools.media` รองรับทั้ง **shared models** และการกำหนดแทนราย capability:

- `tools.media.models`: shared model list (ใช้ `capabilities` เพื่อจำกัดการใช้)
- `tools.media.image` / `tools.media.audio` / `tools.media.video`:
  - ค่าเริ่มต้น (`prompt`, `maxChars`, `maxBytes`, `timeoutSeconds`, `language`)
  - provider overrides (`baseUrl`, `headers`, `providerOptions`)
  - ตัวเลือกเสียงของ Deepgram ผ่าน `tools.media.audio.providerOptions.deepgram`
  - การควบคุมการสะท้อน audio transcript (`echoTranscript`, ค่าเริ่มต้น `false`; `echoFormat`)
  - **per-capability `models` list** แบบไม่บังคับ (จะถูกใช้ก่อน shared models)
  - policy ของ `attachments` (`mode`, `maxAttachments`, `prefer`)
  - `scope` (การจำกัดแบบไม่บังคับตาม channel/chatType/session key)
- `tools.media.concurrency`: จำนวน capability runs พร้อมกันสูงสุด (ค่าเริ่มต้น **2**)

```json5
{
  tools: {
    media: {
      models: [
        /* รายการ shared */
      ],
      image: {
        /* overrides แบบไม่บังคับ */
      },
      audio: {
        /* overrides แบบไม่บังคับ */
        echoTranscript: true,
        echoFormat: '📝 "{transcript}"',
      },
      video: {
        /* overrides แบบไม่บังคับ */
      },
    },
  },
}
```

### Model entries

แต่ละ `models[]` entry สามารถเป็นได้ทั้ง **provider** หรือ **CLI**:

```json5
{
  type: "provider", // ค่าเริ่มต้นหากไม่ระบุ
  provider: "openai",
  model: "gpt-5.5",
  prompt: "Describe the image in <= 500 chars.",
  maxChars: 500,
  maxBytes: 10485760,
  timeoutSeconds: 60,
  capabilities: ["image"], // ไม่บังคับ ใช้สำหรับ entries แบบหลายสื่อ
  profile: "vision-profile",
  preferredProfile: "vision-fallback",
}
```

```json5
{
  type: "cli",
  command: "gemini",
  args: [
    "-m",
    "gemini-3-flash",
    "--allowed-tools",
    "read_file",
    "Read the media at {{MediaPath}} and describe it in <= {{MaxChars}} characters.",
  ],
  maxChars: 500,
  maxBytes: 52428800,
  timeoutSeconds: 120,
  capabilities: ["video", "image"],
}
```

CLI templates ยังสามารถใช้:

- `{{MediaDir}}` (ไดเรกทอรีที่มีไฟล์สื่อ)
- `{{OutputDir}}` (scratch dir ที่สร้างขึ้นสำหรับการรันครั้งนี้)
- `{{OutputBase}}` (base path ของ scratch file โดยไม่มีนามสกุล)

## ค่าเริ่มต้นและขีดจำกัด

ค่าเริ่มต้นที่แนะนำ:

- `maxChars`: **500** สำหรับภาพ/วิดีโอ (สั้น เป็นมิตรกับคำสั่ง)
- `maxChars`: **ไม่ตั้งค่า** สำหรับเสียง (transcript เต็ม เว้นแต่คุณจะตั้งขีดจำกัด)
- `maxBytes`:
  - ภาพ: **10MB**
  - เสียง: **20MB**
  - วิดีโอ: **50MB**

กฎ:

- หากสื่อมีขนาดเกิน `maxBytes`, โมเดลนั้นจะถูกข้ามและ **ลองโมเดลถัดไป**
- ไฟล์เสียงที่เล็กกว่า **1024 bytes** จะถือว่าเป็นไฟล์ว่าง/เสีย และจะถูกข้ามก่อนการถอดเสียงผ่าน provider/CLI
- หากโมเดลส่งผลลัพธ์เกิน `maxChars`, ผลลัพธ์จะถูกตัด
- `prompt` มีค่าเริ่มต้นเป็น “Describe the {media}.” แบบง่าย ๆ พร้อมคำแนะนำเรื่อง `maxChars` (เฉพาะภาพ/วิดีโอ)
- หาก primary image model ที่ใช้งานอยู่รองรับ vision แบบเนทีฟอยู่แล้ว OpenClaw
  จะข้ามบล็อกสรุป `[Image]` และส่งภาพต้นฉบับเข้าโมเดลโดยตรงแทน
- หาก primary model ของ Gateway/WebChat เป็นแบบข้อความล้วน ไฟล์แนบรูปภาพจะถูกเก็บไว้เป็น offloaded `media://inbound/*` refs เพื่อให้ image tool หรือ image model ที่กำหนดค่าไว้ยังสามารถตรวจสอบได้ แทนที่จะสูญเสียไฟล์แนบไป
- คำขอแบบชัดเจน `openclaw infer image describe --model <provider/model>`
  แตกต่างออกไป: มันจะรัน provider/model ที่รองรับภาพนั้นโดยตรง รวมถึง Ollama refs เช่น `ollama/qwen2.5vl:7b`
- หาก `<capability>.enabled: true` แต่ไม่ได้กำหนด models ไว้ OpenClaw จะลอง
  **reply model ที่ใช้งานอยู่** เมื่อ provider ของมันรองรับ capability นั้น

### การตรวจจับอัตโนมัติของ media understanding (ค่าเริ่มต้น)

หาก `tools.media.<capability>.enabled` **ไม่ได้** ถูกตั้งเป็น `false` และคุณยัง
ไม่ได้กำหนด models ไว้ OpenClaw จะตรวจจับอัตโนมัติตามลำดับนี้ และ **หยุดที่ตัวเลือกแรก
ที่ทำงานได้**:

1. **reply model ที่ใช้งานอยู่** เมื่อ provider ของมันรองรับ capability นั้น
2. **`agents.defaults.imageModel`** primary/fallback refs (เฉพาะภาพ)
3. **CLI ในเครื่อง** (เฉพาะเสียง; หากติดตั้งไว้)
   - `sherpa-onnx-offline` (ต้องมี `SHERPA_ONNX_MODEL_DIR` พร้อม encoder/decoder/joiner/tokens)
   - `whisper-cli` (`whisper-cpp`; ใช้ `WHISPER_CPP_MODEL` หรือ bundled tiny model)
   - `whisper` (Python CLI; ดาวน์โหลด models อัตโนมัติ)
4. **Gemini CLI** (`gemini`) โดยใช้ `read_many_files`
5. **Provider auth**
   - `models.providers.*` entries ที่กำหนดค่าไว้และรองรับ capability นั้น
     จะถูกลองก่อน bundled fallback order
   - config providers แบบ image-only ที่มีโมเดลรองรับภาพจะลงทะเบียนตัวเองอัตโนมัติสำหรับ
     media understanding แม้จะไม่ใช่ bundled vendor plugin
   - Ollama image understanding ใช้งานได้เมื่อถูกเลือกอย่างชัดเจน เช่นผ่าน `agents.defaults.imageModel` หรือ
     `openclaw infer image describe --model ollama/<vision-model>`
   - ลำดับ bundled fallback:
     - เสียง: OpenAI → Groq → xAI → Deepgram → Google → Mistral
     - ภาพ: OpenAI → Anthropic → Google → MiniMax → MiniMax Portal → Z.AI
     - วิดีโอ: Google → Qwen → Moonshot

หากต้องการปิดการตรวจจับอัตโนมัติ ให้ตั้งค่า:

```json5
{
  tools: {
    media: {
      audio: {
        enabled: false,
      },
    },
  },
}
```

หมายเหตุ: การตรวจจับ binary เป็นแบบ best-effort บน macOS/Linux/Windows; ตรวจสอบให้แน่ใจว่า CLI อยู่ใน `PATH` (เราขยาย `~`) หรือกำหนด CLI model แบบชัดเจนพร้อม command path แบบเต็ม

### การรองรับ proxy environment (provider models)

เมื่อเปิดใช้ media understanding แบบ **audio** และ **video** ที่อิง provider, OpenClaw
จะใช้ตัวแปรสภาพแวดล้อม proxy ขาออกมาตรฐานสำหรับการเรียก HTTP ของ provider:

- `HTTPS_PROXY`
- `HTTP_PROXY`
- `https_proxy`
- `http_proxy`

หากไม่ได้ตั้ง proxy env vars, media understanding จะใช้ direct egress
หากค่า proxy ผิดรูปแบบ OpenClaw จะบันทึกคำเตือนและย้อนกลับไปใช้ direct
fetch

## Capabilities (ไม่บังคับ)

หากคุณตั้ง `capabilities`, entry นั้นจะทำงานเฉพาะกับชนิดสื่อเหล่านั้น สำหรับ shared
lists, OpenClaw สามารถอนุมานค่าเริ่มต้นได้:

- `openai`, `anthropic`, `minimax`: **image**
- `minimax-portal`: **image**
- `moonshot`: **image + video**
- `openrouter`: **image**
- `google` (Gemini API): **image + audio + video**
- `qwen`: **image + video**
- `mistral`: **audio**
- `zai`: **image**
- `groq`: **audio**
- `xai`: **audio**
- `deepgram`: **audio**
- Any `models.providers.<id>.models[]` catalog ที่มีโมเดลรองรับภาพ:
  **image**

สำหรับ CLI entries, **ให้ตั้ง `capabilities` อย่างชัดเจน** เพื่อหลีกเลี่ยงการจับคู่ที่ไม่คาดคิด
หากคุณไม่ระบุ `capabilities`, entry นั้นจะมีสิทธิ์สำหรับรายการที่มันปรากฏอยู่

## เมทริกซ์การรองรับของ Provider (OpenClaw integrations)

| Capability | Provider integration                                                                                                         | หมายเหตุ                                                                                                                                                                                                                               |
| ---------- | ---------------------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| ภาพ        | OpenAI, OpenAI Codex OAuth, Codex app-server, OpenRouter, Anthropic, Google, MiniMax, Moonshot, Qwen, Z.AI, config providers | vendor plugins ลงทะเบียนการรองรับภาพ; `openai-codex/*` ใช้โครงสร้าง OAuth provider; `codex/*` ใช้ Codex app-server turn แบบมีขอบเขต; MiniMax และ MiniMax OAuth ต่างใช้ `MiniMax-VL-01`; image-capable config providers ลงทะเบียนตัวเองอัตโนมัติ |
| เสียง      | OpenAI, Groq, Deepgram, Google, Mistral                                                                                      | provider transcription (Whisper/Deepgram/Gemini/Voxtral)                                                                                                                                                                               |
| วิดีโอ     | Google, Qwen, Moonshot                                                                                                       | provider video understanding ผ่าน vendor plugins; Qwen video understanding ใช้ Standard DashScope endpoints                                                                                                                             |

หมายเหตุเกี่ยวกับ MiniMax:

- media understanding ของภาพสำหรับ `minimax` และ `minimax-portal` มาจาก
  media provider `MiniMax-VL-01` ที่ Plugin เป็นเจ้าของ
- bundled MiniMax text catalog ยังคงเริ่มแบบ text-only; entries แบบชัดเจนของ
  `models.providers.minimax` จะ materialize M2.7 chat refs ที่รองรับภาพ

## แนวทางการเลือกโมเดล

- ควรเลือกโมเดลรุ่นล่าสุดที่แข็งแรงที่สุดสำหรับแต่ละ media capability เมื่อคุณภาพและความปลอดภัยสำคัญ
- สำหรับเอเจนต์ที่เปิดใช้ tools และจัดการกับอินพุตที่ไม่น่าเชื่อถือ ให้หลีกเลี่ยง media models ที่เก่ากว่าหรืออ่อนกว่า
- ควรมี fallback อย่างน้อยหนึ่งตัวต่อ capability เพื่อความพร้อมใช้งาน (โมเดลคุณภาพ + โมเดลที่เร็วกว่า/ถูกกว่า)
- CLI fallbacks (`whisper-cli`, `whisper`, `gemini`) มีประโยชน์เมื่อ provider APIs ไม่พร้อมใช้งาน
- หมายเหตุ `parakeet-mlx`: เมื่อใช้ `--output-dir`, OpenClaw จะอ่าน `<output-dir>/<media-basename>.txt` เมื่อ output format เป็น `txt` (หรือไม่ระบุ); รูปแบบที่ไม่ใช่ `txt` จะย้อนกลับไปใช้ stdout

## Attachment policy

`attachments` ราย capability ควบคุมว่าจะประมวลผล attachments ใดบ้าง:

- `mode`: `first` (ค่าเริ่มต้น) หรือ `all`
- `maxAttachments`: จำกัดจำนวนที่จะประมวลผล (ค่าเริ่มต้น **1**)
- `prefer`: `first`, `last`, `path`, `url`

เมื่อใช้ `mode: "all"`, ผลลัพธ์จะถูกติดป้าย `[Image 1/2]`, `[Audio 2/2]` เป็นต้น

พฤติกรรมการดึงข้อมูลจากไฟล์แนบ:

- ข้อความที่ดึงได้จากไฟล์จะถูกห่อเป็น **เนื้อหาภายนอกที่ไม่น่าเชื่อถือ** ก่อน
  จะถูกต่อเข้ากับ media prompt
- บล็อกที่ถูก inject จะใช้ตัวคั่นขอบเขตอย่างชัดเจน เช่น
  `<<<EXTERNAL_UNTRUSTED_CONTENT id="...">>>` /
  `<<<END_EXTERNAL_UNTRUSTED_CONTENT id="...">>>` และมีบรรทัด metadata
  `Source: External`
- เส้นทางการดึงข้อมูลไฟล์แนบนี้จงใจละเว้นแบนเนอร์
  `SECURITY NOTICE:` แบบยาวเพื่อไม่ให้ media prompt พองเกินไป; ตัวคั่นขอบเขต
  และ metadata จะยังคงอยู่
- หากไฟล์ไม่มีข้อความที่ดึงออกมาได้ OpenClaw จะ inject `[No extractable text]`
- หาก PDF ในเส้นทางนี้ต้อง fallback ไปเป็นภาพของแต่ละหน้า media prompt จะยังคงมี
  placeholder `[PDF content rendered to images; images not forwarded to model]`
  เพราะขั้นตอนการดึงข้อมูลไฟล์แนบนี้ส่งต่อบล็อกข้อความ ไม่ใช่ภาพ PDF ที่เรนเดอร์แล้ว

## ตัวอย่าง Config

### 1) Shared models list + overrides

```json5
{
  tools: {
    media: {
      models: [
        { provider: "openai", model: "gpt-5.5", capabilities: ["image"] },
        {
          provider: "google",
          model: "gemini-3-flash-preview",
          capabilities: ["image", "audio", "video"],
        },
        {
          type: "cli",
          command: "gemini",
          args: [
            "-m",
            "gemini-3-flash",
            "--allowed-tools",
            "read_file",
            "Read the media at {{MediaPath}} and describe it in <= {{MaxChars}} characters.",
          ],
          capabilities: ["image", "video"],
        },
      ],
      audio: {
        attachments: { mode: "all", maxAttachments: 2 },
      },
      video: {
        maxChars: 500,
      },
    },
  },
}
```

### 2) เฉพาะเสียง + วิดีโอ (ปิดภาพ)

```json5
{
  tools: {
    media: {
      audio: {
        enabled: true,
        models: [
          { provider: "openai", model: "gpt-4o-mini-transcribe" },
          {
            type: "cli",
            command: "whisper",
            args: ["--model", "base", "{{MediaPath}}"],
          },
        ],
      },
      video: {
        enabled: true,
        maxChars: 500,
        models: [
          { provider: "google", model: "gemini-3-flash-preview" },
          {
            type: "cli",
            command: "gemini",
            args: [
              "-m",
              "gemini-3-flash",
              "--allowed-tools",
              "read_file",
              "Read the media at {{MediaPath}} and describe it in <= {{MaxChars}} characters.",
            ],
          },
        ],
      },
    },
  },
}
```

### 3) การทำความเข้าใจภาพแบบไม่บังคับ

```json5
{
  tools: {
    media: {
      image: {
        enabled: true,
        maxBytes: 10485760,
        maxChars: 500,
        models: [
          { provider: "openai", model: "gpt-5.5" },
          { provider: "anthropic", model: "claude-opus-4-6" },
          {
            type: "cli",
            command: "gemini",
            args: [
              "-m",
              "gemini-3-flash",
              "--allowed-tools",
              "read_file",
              "Read the media at {{MediaPath}} and describe it in <= {{MaxChars}} characters.",
            ],
          },
        ],
      },
    },
  },
}
```

### 4) รายการเดียวแบบหลายสื่อ (ระบุ capabilities ชัดเจน)

```json5
{
  tools: {
    media: {
      image: {
        models: [
          {
            provider: "google",
            model: "gemini-3.1-pro-preview",
            capabilities: ["image", "video", "audio"],
          },
        ],
      },
      audio: {
        models: [
          {
            provider: "google",
            model: "gemini-3.1-pro-preview",
            capabilities: ["image", "video", "audio"],
          },
        ],
      },
      video: {
        models: [
          {
            provider: "google",
            model: "gemini-3.1-pro-preview",
            capabilities: ["image", "video", "audio"],
          },
        ],
      },
    },
  },
}
```

## ผลลัพธ์สถานะ

เมื่อ media understanding ทำงาน `/status` จะมีบรรทัดสรุปสั้น ๆ:

```
📎 Media: image ok (openai/gpt-5.4) · audio skipped (maxBytes)
```

บรรทัดนี้จะแสดงผลลัพธ์ราย capability และ provider/model ที่ถูกเลือกเมื่อมี

## หมายเหตุ

- การทำความเข้าใจเป็นแบบ **best-effort** ข้อผิดพลาดจะไม่บล็อกการตอบกลับ
- attachments จะยังคงถูกส่งไปยังโมเดล แม้ปิดการทำความเข้าใจไว้
- ใช้ `scope` เพื่อจำกัดว่าการทำความเข้าใจจะทำงานที่ใด (เช่น เฉพาะ DMs)

## เอกสารที่เกี่ยวข้อง

- [การกำหนดค่า](/th/gateway/configuration)
- [การรองรับภาพและสื่อ](/th/nodes/images)
