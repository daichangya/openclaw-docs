---
read_when:
    - การออกแบบหรือปรับโครงสร้างการทำความเข้าใจสื่อ
    - การปรับแต่งการประมวลผลล่วงหน้าของเสียง/วิดีโอ/รูปภาพขาเข้า
summary: การทำความเข้าใจรูปภาพ/เสียง/วิดีโอขาเข้า (ไม่บังคับ) พร้อม fallback ของผู้ให้บริการ + CLI
title: การทำความเข้าใจสื่อ
x-i18n:
    generated_at: "2026-04-23T05:42:58Z"
    model: gpt-5.4
    provider: openai
    source_hash: 5bb2d0eab59d857c2849f329435f8fad3eeff427f7984d011bd5b7d9fd7bf51c
    source_path: nodes/media-understanding.md
    workflow: 15
---

# การทำความเข้าใจสื่อ - ขาเข้า (2026-01-17)

OpenClaw สามารถ**สรุปสื่อขาเข้า** (รูปภาพ/เสียง/วิดีโอ) ก่อนที่ไปป์ไลน์การตอบกลับจะทำงาน มันจะตรวจจับโดยอัตโนมัติเมื่อมี local tools หรือ provider keys พร้อมใช้งาน และสามารถปิดหรือปรับแต่งได้ หากปิดการทำความเข้าใจไว้ โมเดลก็จะยังได้รับไฟล์/URL ต้นฉบับตามปกติเช่นเดิม

พฤติกรรมสื่อเฉพาะของผู้ขายจะถูกลงทะเบียนโดย vendor plugins ขณะที่แกนของ OpenClaw
เป็นเจ้าของ config `tools.media` ที่ใช้ร่วมกัน ลำดับ fallback และการผสานเข้ากับ reply pipeline

## เป้าหมาย

- เป็นตัวเลือก: ย่อยสื่อขาเข้าเป็นข้อความสั้นล่วงหน้า เพื่อการจัดเส้นทางที่เร็วขึ้น + การแยกคำสั่งที่ดีขึ้น
- คงการส่งสื่อดั้งเดิมไปยังโมเดลไว้เสมอ (เสมอ)
- รองรับทั้ง **provider APIs** และ **CLI fallbacks**
- อนุญาตหลายโมเดลพร้อม fallback ตามลำดับ (error/size/timeout)

## พฤติกรรมระดับสูง

1. รวบรวมไฟล์แนบขาเข้า (`MediaPaths`, `MediaUrls`, `MediaTypes`)
2. สำหรับแต่ละ capability ที่เปิดใช้งาน (รูปภาพ/เสียง/วิดีโอ) ให้เลือกไฟล์แนบตามนโยบาย (ค่าเริ่มต้น: **ตัวแรก**)
3. เลือก model entry ตัวแรกที่เข้าเงื่อนไข (size + capability + auth)
4. หากโมเดลล้มเหลวหรือสื่อใหญ่เกินไป จะ **fallback ไปยัง entry ถัดไป**
5. เมื่อสำเร็จ:
   - `Body` จะกลายเป็นบล็อก `[Image]`, `[Audio]` หรือ `[Video]`
   - เสียงจะตั้งค่า `{{Transcript}}`; การแยกคำสั่งจะใช้ข้อความคำบรรยายเมื่อมี
     มิฉะนั้นจะใช้ transcript
   - captions จะถูกเก็บไว้เป็น `User text:` ภายในบล็อก

หากการทำความเข้าใจล้มเหลวหรือถูกปิดใช้งาน **โฟลว์การตอบกลับจะดำเนินต่อไป** ด้วย body + attachments เดิม

## ภาพรวมของ config

`tools.media` รองรับทั้ง **shared models** และ overrides ราย capability:

- `tools.media.models`: รายการโมเดลที่ใช้ร่วมกัน (ใช้ `capabilities` เพื่อกำหนดขอบเขต)
- `tools.media.image` / `tools.media.audio` / `tools.media.video`:
  - ค่าเริ่มต้น (`prompt`, `maxChars`, `maxBytes`, `timeoutSeconds`, `language`)
  - provider overrides (`baseUrl`, `headers`, `providerOptions`)
  - ตัวเลือก Deepgram สำหรับเสียงผ่าน `tools.media.audio.providerOptions.deepgram`
  - ตัวควบคุมการ echo transcript ของเสียง (`echoTranscript`, ค่าเริ่มต้น `false`; `echoFormat`)
  - **รายการ `models` ราย capability** แบบเลือกได้ (จะถูกใช้ก่อน shared models)
  - นโยบาย `attachments` (`mode`, `maxAttachments`, `prefer`)
  - `scope` (ตัวเลือกสำหรับการกำหนดขอบเขตตาม channel/chatType/session key)
- `tools.media.concurrency`: จำนวน capability runs พร้อมกันสูงสุด (ค่าเริ่มต้น **2**)

```json5
{
  tools: {
    media: {
      models: [
        /* shared list */
      ],
      image: {
        /* optional overrides */
      },
      audio: {
        /* optional overrides */
        echoTranscript: true,
        echoFormat: '📝 "{transcript}"',
      },
      video: {
        /* optional overrides */
      },
    },
  },
}
```

### Model entries

แต่ละ `models[]` entry สามารถเป็นแบบ **provider** หรือ **CLI**:

```json5
{
  type: "provider", // default if omitted
  provider: "openai",
  model: "gpt-5.4-mini",
  prompt: "Describe the image in <= 500 chars.",
  maxChars: 500,
  maxBytes: 10485760,
  timeoutSeconds: 60,
  capabilities: ["image"], // optional, used for multi‑modal entries
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

CLI templates ยังใช้สิ่งต่อไปนี้ได้ด้วย:

- `{{MediaDir}}` (ไดเรกทอรีที่มีไฟล์สื่อ)
- `{{OutputDir}}` (scratch dir ที่สร้างขึ้นสำหรับรอบนี้)
- `{{OutputBase}}` (พาธฐานของ scratch file ไม่มีนามสกุล)

## ค่าเริ่มต้นและขีดจำกัด

ค่าเริ่มต้นที่แนะนำ:

- `maxChars`: **500** สำหรับรูปภาพ/วิดีโอ (สั้น เป็นมิตรกับคำสั่ง)
- `maxChars`: **ไม่ตั้งค่า** สำหรับเสียง (จะใช้ transcript เต็ม เว้นแต่คุณจะกำหนดขีดจำกัด)
- `maxBytes`:
  - รูปภาพ: **10MB**
  - เสียง: **20MB**
  - วิดีโอ: **50MB**

กฎ:

- หากสื่อมีขนาดเกิน `maxBytes` โมเดลนั้นจะถูกข้ามและจะ **ลองโมเดลถัดไป**
- ไฟล์เสียงที่เล็กกว่า **1024 bytes** จะถือว่าเป็นไฟล์ว่าง/เสียหาย และจะถูกข้ามก่อนการถอดเสียงผ่าน provider/CLI
- หากโมเดลคืนค่ามามากกว่า `maxChars` เอาต์พุตจะถูกตัด
- `prompt` มีค่าเริ่มต้นเป็น “Describe the {media}.” แบบเรียบง่าย พร้อมคำแนะนำ `maxChars` (เฉพาะรูปภาพ/วิดีโอ)
- หาก active primary image model รองรับ vision แบบเนทีฟอยู่แล้ว OpenClaw
  จะข้ามบล็อกสรุป `[Image]` และส่งรูปภาพต้นฉบับเข้า
  โมเดลแทน
- คำขอ `openclaw infer image describe --model <provider/model>` แบบ explicit
  แตกต่างออกไป: มันจะรัน provider/model ที่รองรับรูปภาพนั้นโดยตรง รวมถึง
  refs ของ Ollama เช่น `ollama/qwen2.5vl:7b`
- หาก `<capability>.enabled: true` แต่ไม่ได้กำหนดโมเดลไว้ OpenClaw จะลอง
  **active reply model** เมื่อ provider ของมันรองรับ capability นั้น

### การตรวจจับการทำความเข้าใจสื่ออัตโนมัติ (ค่าเริ่มต้น)

หากไม่ได้ตั้ง `tools.media.<capability>.enabled` เป็น **false** และคุณยังไม่ได้
กำหนดค่าโมเดล OpenClaw จะตรวจจับอัตโนมัติตามลำดับนี้ และ **หยุดที่ตัวเลือกแรก
ที่ใช้งานได้**:

1. **Active reply model** เมื่อ provider ของมันรองรับ capability นั้น
2. refs primary/fallback ของ **`agents.defaults.imageModel`** (เฉพาะรูปภาพ)
3. **Local CLIs** (เฉพาะเสียง; หากติดตั้งไว้)
   - `sherpa-onnx-offline` (ต้องใช้ `SHERPA_ONNX_MODEL_DIR` พร้อม encoder/decoder/joiner/tokens)
   - `whisper-cli` (`whisper-cpp`; ใช้ `WHISPER_CPP_MODEL` หรือโมเดล tiny ที่มากับระบบ)
   - `whisper` (Python CLI; ดาวน์โหลดโมเดลอัตโนมัติ)
4. **Gemini CLI** (`gemini`) โดยใช้ `read_many_files`
5. **Provider auth**
   - entries ของ `models.providers.*` ที่กำหนดค่าไว้และรองรับ capability นั้น
     จะถูกลองก่อนลำดับ fallback แบบ bundled
   - config providers แบบ image-only ที่มีโมเดลรองรับรูปภาพจะ auto-register สำหรับ
     media understanding แม้ว่าจะไม่ใช่ bundled vendor plugin
   - การทำความเข้าใจรูปภาพของ Ollama ใช้งานได้เมื่อถูกเลือกแบบ explicit เช่นผ่าน `agents.defaults.imageModel` หรือ
     `openclaw infer image describe --model ollama/<vision-model>`
   - ลำดับ fallback แบบ bundled:
     - เสียง: OpenAI → Groq → xAI → Deepgram → Google → Mistral
     - รูปภาพ: OpenAI → Anthropic → Google → MiniMax → MiniMax Portal → Z.AI
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

หมายเหตุ: การตรวจจับไบนารีเป็นแบบ best-effort บน macOS/Linux/Windows; ตรวจสอบให้แน่ใจว่า CLI อยู่ใน `PATH` (เราจะขยาย `~`) หรือกำหนด CLI model แบบ explicit พร้อมพาธคำสั่งเต็ม

### การรองรับ proxy environment (provider models)

เมื่อเปิดใช้ media understanding แบบ **audio** และ **video** ที่อิง provider OpenClaw
จะเคารพตัวแปรสภาพแวดล้อม proxy ขาออกมาตรฐานสำหรับการเรียก HTTP ของ provider:

- `HTTPS_PROXY`
- `HTTP_PROXY`
- `https_proxy`
- `http_proxy`

หากไม่ได้ตั้ง proxy env vars ไว้ media understanding จะใช้ออกอินเทอร์เน็ตโดยตรง
หากค่า proxy ผิดรูปแบบ OpenClaw จะบันทึกคำเตือนและ fallback กลับไปใช้การดึงแบบตรง

## Capabilities (ตัวเลือก)

หากคุณตั้ง `capabilities` entry นั้นจะรันเฉพาะกับประเภทสื่อเหล่านั้น สำหรับ shared
lists OpenClaw สามารถอนุมานค่าเริ่มต้นได้:

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
- แค็ตตาล็อก `models.providers.<id>.models[]` ใดๆ ที่มีโมเดลรองรับรูปภาพ:
  **image**

สำหรับ CLI entries **ให้ตั้ง `capabilities` อย่างชัดเจน** เพื่อหลีกเลี่ยงการจับคู่ที่คาดไม่ถึง
หากคุณละ `capabilities` ไว้ entry นั้นจะเข้าเงื่อนไขสำหรับรายการที่มันปรากฏอยู่

## เมทริกซ์การรองรับของผู้ให้บริการ (OpenClaw integrations)

| Capability | การเชื่อมต่อผู้ให้บริการ                                                                | หมายเหตุ                                                                                                                                    |
| ---------- | ----------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------- |
| รูปภาพ     | OpenAI, OpenRouter, Anthropic, Google, MiniMax, Moonshot, Qwen, Z.AI, config providers   | Vendor plugins ลงทะเบียนการรองรับรูปภาพ; MiniMax และ MiniMax OAuth ต่างก็ใช้ `MiniMax-VL-01`; config providers ที่รองรับรูปภาพจะ auto-register |
| เสียง      | OpenAI, Groq, Deepgram, Google, Mistral                                                   | การถอดเสียงผ่าน provider (Whisper/Deepgram/Gemini/Voxtral)                                                                                  |
| วิดีโอ     | Google, Qwen, Moonshot                                                                    | การทำความเข้าใจวิดีโอผ่าน provider โดย vendor plugins; การทำความเข้าใจวิดีโอของ Qwen ใช้ Standard DashScope endpoints                     |

หมายเหตุเกี่ยวกับ MiniMax:

- การทำความเข้าใจรูปภาพของ `minimax` และ `minimax-portal` มาจาก media provider
  `MiniMax-VL-01` ที่ Plugin เป็นเจ้าของ
- แค็ตตาล็อกข้อความแบบ bundled ของ MiniMax ยังคงเริ่มต้นแบบ text-only; entries
  แบบ explicit ของ `models.providers.minimax` จะ materialize refs แชต M2.7 ที่รองรับรูปภาพ

## แนวทางการเลือกโมเดล

- ควรใช้โมเดลรุ่นล่าสุดที่แข็งแรงที่สุดที่มีสำหรับแต่ละ media capability เมื่อคุณภาพและความปลอดภัยสำคัญ
- สำหรับเอเจนต์ที่เปิดใช้เครื่องมือและจัดการอินพุตที่ไม่เชื่อถือได้ ให้หลีกเลี่ยงโมเดลสื่อรุ่นเก่า/อ่อนกว่า
- ควรมี fallback อย่างน้อยหนึ่งตัวต่อ capability เพื่อความพร้อมใช้งาน (โมเดลคุณภาพสูง + โมเดลที่เร็ว/ถูกกว่า)
- CLI fallbacks (`whisper-cli`, `whisper`, `gemini`) มีประโยชน์เมื่อ provider APIs ใช้งานไม่ได้
- หมายเหตุ `parakeet-mlx`: เมื่อใช้ `--output-dir`, OpenClaw จะอ่าน `<output-dir>/<media-basename>.txt` เมื่อรูปแบบเอาต์พุตเป็น `txt` (หรือไม่ได้ระบุ); รูปแบบที่ไม่ใช่ `txt` จะ fallback ไปที่ stdout

## นโยบายไฟล์แนบ

`attachments` แบบราย capability ควบคุมว่าจะประมวลผลไฟล์แนบใดบ้าง:

- `mode`: `first` (ค่าเริ่มต้น) หรือ `all`
- `maxAttachments`: จำกัดจำนวนที่ประมวลผล (ค่าเริ่มต้น **1**)
- `prefer`: `first`, `last`, `path`, `url`

เมื่อ `mode: "all"` เอาต์พุตจะถูกติดป้ายเป็น `[Image 1/2]`, `[Audio 2/2]` เป็นต้น

พฤติกรรมการดึงข้อมูลจากไฟล์แนบ:

- ข้อความที่ดึงจากไฟล์จะถูกห่อเป็น **untrusted external content** ก่อน
  ที่จะถูกต่อท้ายลงใน media prompt
- บล็อกที่ inject เข้าไปจะใช้ boundary markers แบบชัดเจน เช่น
  `<<<EXTERNAL_UNTRUSTED_CONTENT id="...">>>` /
  `<<<END_EXTERNAL_UNTRUSTED_CONTENT id="...">>>` และมีบรรทัด metadata
  `Source: External`
- เส้นทางการดึงข้อมูลจากไฟล์แนบนี้ตั้งใจละเว้นแบนเนอร์ยาว
  `SECURITY NOTICE:` เพื่อหลีกเลี่ยงไม่ให้ media prompt พองเกินไป; boundary
  markers และ metadata จะยังคงอยู่
- หากไฟล์ไม่มีข้อความที่ดึงได้ OpenClaw จะ inject `[No extractable text]`
- หาก PDF fallback ไปใช้ภาพของหน้าที่เรนเดอร์แล้วในเส้นทางนี้ media prompt จะคง
  placeholder `[PDF content rendered to images; images not forwarded to model]`
  ไว้ เพราะขั้นตอนการดึงข้อมูลจากไฟล์แนบนี้ส่งต่อบล็อกข้อความ ไม่ใช่ภาพ PDF ที่เรนเดอร์แล้ว

## ตัวอย่าง config

### 1) รายการโมเดลแบบใช้ร่วมกัน + overrides

```json5
{
  tools: {
    media: {
      models: [
        { provider: "openai", model: "gpt-5.4-mini", capabilities: ["image"] },
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

### 2) เฉพาะเสียง + วิดีโอ (ปิดรูปภาพ)

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

### 3) การทำความเข้าใจรูปภาพแบบไม่บังคับ

```json5
{
  tools: {
    media: {
      image: {
        enabled: true,
        maxBytes: 10485760,
        maxChars: 500,
        models: [
          { provider: "openai", model: "gpt-5.4-mini" },
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

### 4) รายการ single entry แบบหลายโหมด (ระบุ capabilities ชัดเจน)

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

## เอาต์พุตสถานะ

เมื่อ media understanding ทำงาน `/status` จะรวมบรรทัดสรุปสั้นๆ:

```
📎 Media: image ok (openai/gpt-5.4-mini) · audio skipped (maxBytes)
```

บรรทัดนี้แสดงผลลัพธ์ราย capability และ provider/model ที่ถูกเลือกเมื่อเกี่ยวข้อง

## หมายเหตุ

- การทำความเข้าใจเป็นแบบ **best-effort** ข้อผิดพลาดจะไม่บล็อกการตอบกลับ
- ไฟล์แนบจะยังคงถูกส่งต่อไปยังโมเดลแม้เมื่อปิดการทำความเข้าใจไว้
- ใช้ `scope` เพื่อจำกัดว่าการทำความเข้าใจจะรันที่ใด (เช่น เฉพาะ DM)

## เอกสารที่เกี่ยวข้อง

- [Configuration](/th/gateway/configuration)
- [Image & Media Support](/th/nodes/images)
