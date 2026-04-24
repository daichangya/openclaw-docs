---
read_when:
    - การสร้างภาพผ่านเอเจนต์
    - การกำหนดค่า provider และโมเดลสำหรับการสร้างภาพ
    - ทำความเข้าใจพารามิเตอร์ของเครื่องมือ `image_generate`
summary: สร้างและแก้ไขภาพโดยใช้ provider ที่กำหนดค่าไว้ (OpenAI, OpenAI Codex OAuth, Google Gemini, OpenRouter, fal, MiniMax, ComfyUI, Vydra, xAI)
title: การสร้างภาพ
x-i18n:
    generated_at: "2026-04-24T09:37:04Z"
    model: gpt-5.4
    provider: openai
    source_hash: 51ffc32165c5e25925460f95f3a6e674a004e6640b7a4b9e88d025eb40943b4b
    source_path: tools/image-generation.md
    workflow: 15
---

เครื่องมือ `image_generate` ช่วยให้เอเจนต์สร้างและแก้ไขภาพโดยใช้ provider ที่คุณกำหนดค่าไว้ ภาพที่สร้างขึ้นจะถูกส่งให้อัตโนมัติเป็นไฟล์แนบสื่อในคำตอบของเอเจนต์

<Note>
เครื่องมือนี้จะแสดงเฉพาะเมื่อมี provider สำหรับการสร้างภาพอย่างน้อยหนึ่งตัวเท่านั้น หากคุณไม่เห็น `image_generate` ในเครื่องมือของเอเจนต์ ให้กำหนดค่า `agents.defaults.imageGenerationModel`, ตั้งค่า API key ของ provider หรือเข้าสู่ระบบด้วย OpenAI Codex OAuth
</Note>

## เริ่มต้นอย่างรวดเร็ว

1. ตั้งค่า API key สำหรับ provider อย่างน้อยหนึ่งตัว (เช่น `OPENAI_API_KEY`, `GEMINI_API_KEY` หรือ `OPENROUTER_API_KEY`) หรือเข้าสู่ระบบด้วย OpenAI Codex OAuth
2. จะตั้งค่าโมเดลที่ต้องการก็ได้:

```json5
{
  agents: {
    defaults: {
      imageGenerationModel: {
        primary: "openai/gpt-image-2",
      },
    },
  },
}
```

Codex OAuth ใช้ model ref `openai/gpt-image-2` เดียวกัน เมื่อมีการกำหนดค่า
โปรไฟล์ OAuth `openai-codex` ไว้ OpenClaw จะกำหนดเส้นทางคำขอภาพ
ผ่านโปรไฟล์ OAuth เดียวกันนั้น แทนที่จะลอง `OPENAI_API_KEY` ก่อน
การกำหนดค่า image แบบ custom ของ `models.providers.openai` อย่างชัดเจน เช่น API key หรือ
base URL แบบ custom/Azure จะเป็นการเลือกกลับไปใช้เส้นทาง OpenAI Images API โดยตรง
สำหรับ endpoint แบบ OpenAI-compatible LAN เช่น LocalAI ให้คงค่า
`models.providers.openai.baseUrl` แบบ custom และเลือกเปิดใช้อย่างชัดเจนด้วย
`browser.ssrfPolicy.dangerouslyAllowPrivateNetwork: true`; endpoint ภาพแบบ private/internal
ยังคงถูกบล็อกโดยค่าเริ่มต้น

3. ถามเอเจนต์ว่า: _"Generate an image of a friendly robot mascot."_

เอเจนต์จะเรียก `image_generate` โดยอัตโนมัติ ไม่ต้องเพิ่มใน allow-list ของเครื่องมือ — เครื่องมือนี้จะเปิดใช้งานโดยค่าเริ่มต้นเมื่อมี provider พร้อมใช้งาน

## provider ที่รองรับ

| Provider   | โมเดลเริ่มต้น                           | รองรับการแก้ไข                    | การยืนยันตัวตน                                        |
| ---------- | --------------------------------------- | ---------------------------------- | ----------------------------------------------------- |
| OpenAI     | `gpt-image-2`                           | รองรับ (สูงสุด 4 ภาพ)              | `OPENAI_API_KEY` หรือ OpenAI Codex OAuth              |
| OpenRouter | `google/gemini-3.1-flash-image-preview` | รองรับ (ภาพนำเข้าสูงสุด 5 ภาพ)     | `OPENROUTER_API_KEY`                                  |
| Google     | `gemini-3.1-flash-image-preview`        | รองรับ                            | `GEMINI_API_KEY` หรือ `GOOGLE_API_KEY`                |
| fal        | `fal-ai/flux/dev`                       | รองรับ                            | `FAL_KEY`                                             |
| MiniMax    | `image-01`                              | รองรับ (อ้างอิง subject)           | `MINIMAX_API_KEY` หรือ MiniMax OAuth (`minimax-portal`) |
| ComfyUI    | `workflow`                              | รองรับ (1 ภาพ, กำหนดโดย workflow) | `COMFY_API_KEY` หรือ `COMFY_CLOUD_API_KEY` สำหรับคลาวด์ |
| Vydra      | `grok-imagine`                          | ไม่รองรับ                         | `VYDRA_API_KEY`                                       |
| xAI        | `grok-imagine-image`                    | รองรับ (สูงสุด 5 ภาพ)              | `XAI_API_KEY`                                         |

ใช้ `action: "list"` เพื่อตรวจสอบ provider และโมเดลที่ใช้งานได้ในรันไทม์:

```
/tool image_generate action=list
```

## พารามิเตอร์ของเครื่องมือ

<ParamField path="prompt" type="string" required>
พรอมป์สำหรับการสร้างภาพ จำเป็นสำหรับ `action: "generate"`
</ParamField>

<ParamField path="action" type="'generate' | 'list'" default="generate">
ใช้ `"list"` เพื่อตรวจสอบ provider และโมเดลที่ใช้งานได้ในรันไทม์
</ParamField>

<ParamField path="model" type="string">
override provider/model เช่น `openai/gpt-image-2`
</ParamField>

<ParamField path="image" type="string">
พาธหรือ URL ของภาพอ้างอิงเดี่ยวสำหรับโหมดแก้ไข
</ParamField>

<ParamField path="images" type="string[]">
ภาพอ้างอิงหลายภาพสำหรับโหมดแก้ไข (สูงสุด 5 ภาพ)
</ParamField>

<ParamField path="size" type="string">
คำใบ้ขนาด: `1024x1024`, `1536x1024`, `1024x1536`, `2048x2048`, `3840x2160`
</ParamField>

<ParamField path="aspectRatio" type="string">
อัตราส่วนภาพ: `1:1`, `2:3`, `3:2`, `3:4`, `4:3`, `4:5`, `5:4`, `9:16`, `16:9`, `21:9`
</ParamField>

<ParamField path="resolution" type="'1K' | '2K' | '4K'">
คำใบ้ความละเอียด
</ParamField>

<ParamField path="quality" type="'low' | 'medium' | 'high' | 'auto'">
คำใบ้คุณภาพเมื่อ provider รองรับ
</ParamField>

<ParamField path="outputFormat" type="'png' | 'jpeg' | 'webp'">
คำใบ้รูปแบบผลลัพธ์เมื่อ provider รองรับ
</ParamField>

<ParamField path="count" type="number">
จำนวนภาพที่จะสร้าง (1–4)
</ParamField>

<ParamField path="timeoutMs" type="number">
timeout ของคำขอ provider แบบเลือกได้ หน่วยเป็นมิลลิวินาที
</ParamField>

<ParamField path="filename" type="string">
คำใบ้ชื่อไฟล์ผลลัพธ์
</ParamField>

<ParamField path="openai" type="object">
คำใบ้เฉพาะ OpenAI: `background`, `moderation`, `outputCompression` และ `user`
</ParamField>

ไม่ใช่ทุก provider ที่รองรับทุกพารามิเตอร์ เมื่อ provider สำรองรองรับตัวเลือกเรขาคณิตที่ใกล้เคียงแทนค่าที่ร้องขอแบบตรงตัว OpenClaw จะ remap ไปยังขนาด อัตราส่วนภาพ หรือความละเอียดที่รองรับซึ่งใกล้ที่สุดก่อนส่งคำขอ คำใบ้ผลลัพธ์ที่ไม่รองรับ เช่น `quality` หรือ `outputFormat` จะถูกตัดออกสำหรับ provider ที่ไม่ได้ประกาศว่ารองรับ และจะถูกรายงานในผลลัพธ์ของเครื่องมือ

ผลลัพธ์ของเครื่องมือจะรายงานการตั้งค่าที่ถูกนำไปใช้ เมื่อ OpenClaw remap เรขาคณิตระหว่างการ fallback ของ provider ค่า `size`, `aspectRatio` และ `resolution` ที่ส่งกลับจะสะท้อนสิ่งที่ถูกส่งจริง และ `details.normalization` จะบันทึกการแปลงจากค่าที่ร้องขอไปเป็นค่าที่ถูกใช้จริง

## การกำหนดค่า

### การเลือกโมเดล

```json5
{
  agents: {
    defaults: {
      imageGenerationModel: {
        primary: "openai/gpt-image-2",
        fallbacks: [
          "openrouter/google/gemini-3.1-flash-image-preview",
          "google/gemini-3.1-flash-image-preview",
          "fal/fal-ai/flux/dev",
        ],
      },
    },
  },
}
```

### ลำดับการเลือก provider

เมื่อสร้างภาพ OpenClaw จะลอง provider ตามลำดับนี้:

1. พารามิเตอร์ **`model`** จากการเรียกใช้เครื่องมือ (หากเอเจนต์ระบุไว้)
2. **`imageGenerationModel.primary`** จาก config
3. **`imageGenerationModel.fallbacks`** ตามลำดับ
4. **การตรวจจับอัตโนมัติ** — ใช้เฉพาะค่าเริ่มต้นของ provider ที่รองรับ auth:
   - current default provider ก่อน
   - provider สำหรับการสร้างภาพที่ลงทะเบียนไว้ที่เหลือตามลำดับ provider-id

หาก provider ล้มเหลว (ข้อผิดพลาด auth, rate limit ฯลฯ) ระบบจะลองตัวถัดไปโดยอัตโนมัติ หากทุกตัวล้มเหลว ข้อผิดพลาดจะรวมรายละเอียดจากแต่ละความพยายาม

หมายเหตุ:

- การตรวจจับอัตโนมัติรับรู้ auth provider default จะถูกเพิ่มเข้าสู่รายการตัวเลือก
  ก็ต่อเมื่อ OpenClaw สามารถยืนยันตัวตนกับ provider นั้นได้จริง
- การตรวจจับอัตโนมัติเปิดใช้โดยค่าเริ่มต้น ตั้งค่า
  `agents.defaults.mediaGenerationAutoProviderFallback: false` หากคุณต้องการให้การสร้างภาพ
  ใช้เฉพาะรายการ `model`, `primary` และ `fallbacks`
  ที่ระบุไว้อย่างชัดเจน
- ใช้ `action: "list"` เพื่อตรวจสอบ provider ที่ลงทะเบียนอยู่ในขณะนี้
  โมเดลเริ่มต้นของ provider เหล่านั้น และคำใบ้ env-var สำหรับ auth

### การแก้ไขภาพ

OpenAI, OpenRouter, Google, fal, MiniMax, ComfyUI และ xAI รองรับการแก้ไขภาพอ้างอิง ส่งพาธหรือ URL ของภาพอ้างอิง:

```
"Generate a watercolor version of this photo" + image: "/path/to/photo.jpg"
```

OpenAI, OpenRouter, Google และ xAI รองรับภาพอ้างอิงสูงสุด 5 ภาพผ่านพารามิเตอร์ `images` ส่วน fal, MiniMax และ ComfyUI รองรับ 1 ภาพ

### โมเดลภาพของ OpenRouter

การสร้างภาพผ่าน OpenRouter ใช้ `OPENROUTER_API_KEY` เดียวกันและกำหนดเส้นทางผ่าน image API ของ chat completions ของ OpenRouter เลือกโมเดลภาพของ OpenRouter ด้วย prefix `openrouter/`:

```json5
{
  agents: {
    defaults: {
      imageGenerationModel: {
        primary: "openrouter/google/gemini-3.1-flash-image-preview",
      },
    },
  },
}
```

OpenClaw จะส่งต่อ `prompt`, `count`, ภาพอ้างอิง และคำใบ้ `aspectRatio` / `resolution` ที่เข้ากันได้กับ Gemini ไปยัง OpenRouter shortcut ของโมเดลภาพ OpenRouter ที่มีมาในตัวปัจจุบันรวมถึง `google/gemini-3.1-flash-image-preview`, `google/gemini-3-pro-image-preview` และ `openai/gpt-5.4-image-2`; ใช้ `action: "list"` เพื่อดูว่า Plugin ที่คุณกำหนดค่าไว้เปิดเผยอะไรบ้าง

### OpenAI `gpt-image-2`

การสร้างภาพของ OpenAI ใช้ค่าเริ่มต้นเป็น `openai/gpt-image-2` หากมีการกำหนดค่า
โปรไฟล์ OAuth `openai-codex` ไว้ OpenClaw จะนำโปรไฟล์ OAuth เดียวกัน
ที่ใช้โดยโมเดลแชตแบบ subscription ของ Codex มาใช้ซ้ำ และส่งคำขอภาพ
ผ่านแบ็กเอนด์ Codex Responses; จะไม่ fallback ไปใช้
`OPENAI_API_KEY` สำหรับคำขอนั้นแบบเงียบๆ หากต้องการบังคับให้กำหนดเส้นทางผ่าน OpenAI Images API โดยตรง
ให้กำหนด `models.providers.openai` อย่างชัดเจนด้วย API key, custom base URL,
หรือ Azure endpoint โมเดลรุ่นเก่า
`openai/gpt-image-1` ยังสามารถเลือกใช้ได้อย่างชัดเจน แต่คำขอสร้างภาพและแก้ไขภาพใหม่ของ OpenAI
ควรใช้ `gpt-image-2`

`gpt-image-2` รองรับทั้งการสร้างภาพจากข้อความและการแก้ไขภาพอ้างอิง
ผ่านเครื่องมือ `image_generate` เดียวกัน OpenClaw จะส่งต่อ `prompt`,
`count`, `size`, `quality`, `outputFormat` และภาพอ้างอิงไปยัง OpenAI
OpenAI จะไม่ได้รับ `aspectRatio` หรือ `resolution` โดยตรง; หากเป็นไปได้
OpenClaw จะ map ค่าเหล่านั้นไปเป็น `size` ที่รองรับ มิฉะนั้นเครื่องมือจะรายงานว่าเป็น
override ที่ถูกละเว้น

ตัวเลือกเฉพาะ OpenAI อยู่ภายใต้อ็อบเจ็กต์ `openai`:

```json
{
  "quality": "low",
  "outputFormat": "jpeg",
  "openai": {
    "background": "opaque",
    "moderation": "low",
    "outputCompression": 60,
    "user": "end-user-42"
  }
}
```

`openai.background` รับค่า `transparent`, `opaque` หรือ `auto`; ผลลัพธ์แบบโปร่งใส
ต้องใช้ `outputFormat` เป็น `png` หรือ `webp` `openai.outputCompression`
ใช้กับผลลัพธ์แบบ JPEG/WebP

สร้างภาพแนวนอน 4K หนึ่งภาพ:

```
/tool image_generate action=generate model=openai/gpt-image-2 prompt="A clean editorial poster for OpenClaw image generation" size=3840x2160 count=1
```

สร้างภาพสี่เหลี่ยมจัตุรัสสองภาพ:

```
/tool image_generate action=generate model=openai/gpt-image-2 prompt="Two visual directions for a calm productivity app icon" size=1024x1024 count=2
```

แก้ไขภาพอ้างอิงในเครื่องหนึ่งภาพ:

```
/tool image_generate action=generate model=openai/gpt-image-2 prompt="Keep the subject, replace the background with a bright studio setup" image=/path/to/reference.png size=1024x1536
```

แก้ไขด้วยภาพอ้างอิงหลายภาพ:

```
/tool image_generate action=generate model=openai/gpt-image-2 prompt="Combine the character identity from the first image with the color palette from the second" images='["/path/to/character.png","/path/to/palette.jpg"]' size=1536x1024
```

หากต้องการกำหนดเส้นทางการสร้างภาพของ OpenAI ผ่าน deployment ของ Azure OpenAI แทน
`api.openai.com` ดู [Azure OpenAI endpoints](/th/providers/openai#azure-openai-endpoints)
ในเอกสารของ provider OpenAI

การสร้างภาพของ MiniMax ใช้งานได้ผ่านทั้งสองเส้นทาง auth ของ MiniMax ที่มากับระบบ:

- `minimax/image-01` สำหรับการตั้งค่าแบบ API key
- `minimax-portal/image-01` สำหรับการตั้งค่าแบบ OAuth

## ความสามารถของ provider

| ความสามารถ            | OpenAI               | Google               | fal                 | MiniMax                    | ComfyUI                            | Vydra       | xAI                  |
| --------------------- | -------------------- | -------------------- | ------------------- | -------------------------- | ---------------------------------- | ----------- | -------------------- |
| สร้างภาพ              | รองรับ (สูงสุด 4)    | รองรับ (สูงสุด 4)    | รองรับ (สูงสุด 4)   | รองรับ (สูงสุด 9)          | รองรับ (ผลลัพธ์กำหนดโดย workflow) | รองรับ (1)  | รองรับ (สูงสุด 4)    |
| แก้ไข/อ้างอิง         | รองรับ (สูงสุด 5 ภาพ) | รองรับ (สูงสุด 5 ภาพ) | รองรับ (1 ภาพ)      | รองรับ (1 ภาพ, subject ref) | รองรับ (1 ภาพ, กำหนดโดย workflow) | ไม่รองรับ   | รองรับ (สูงสุด 5 ภาพ) |
| ควบคุมขนาด           | รองรับ (สูงสุด 4K)   | รองรับ              | รองรับ              | ไม่รองรับ                  | ไม่รองรับ                          | ไม่รองรับ   | ไม่รองรับ            |
| อัตราส่วนภาพ         | ไม่รองรับ            | รองรับ              | รองรับ (เฉพาะการสร้าง) | รองรับ                    | ไม่รองรับ                          | ไม่รองรับ   | รองรับ              |
| ความละเอียด (1K/2K/4K) | ไม่รองรับ            | รองรับ              | รองรับ              | ไม่รองรับ                  | ไม่รองรับ                          | ไม่รองรับ   | รองรับ (1K/2K)       |

### xAI `grok-imagine-image`

provider xAI ที่มากับระบบใช้ `/v1/images/generations` สำหรับคำขอ
ที่มีเฉพาะพรอมป์ และใช้ `/v1/images/edits` เมื่อมี `image` หรือ `images`

- โมเดล: `xai/grok-imagine-image`, `xai/grok-imagine-image-pro`
- จำนวน: สูงสุด 4
- ภาพอ้างอิง: `image` หนึ่งภาพ หรือ `images` สูงสุดห้าภาพ
- อัตราส่วนภาพ: `1:1`, `16:9`, `9:16`, `4:3`, `3:4`, `2:3`, `3:2`
- ความละเอียด: `1K`, `2K`
- ผลลัพธ์: ส่งกลับเป็นไฟล์แนบภาพที่ OpenClaw จัดการ

OpenClaw ตั้งใจไม่เปิดเผย `quality`, `mask`, `user` แบบ native ของ xAI หรือ
อัตราส่วนภาพแบบ native-only เพิ่มเติม จนกว่าจะมีตัวควบคุมเหล่านั้นในสัญญา `image_generate`
แบบข้าม provider ที่ใช้ร่วมกัน

## ที่เกี่ยวข้อง

- [Tools Overview](/th/tools) — เครื่องมือเอเจนต์ทั้งหมดที่ใช้งานได้
- [fal](/th/providers/fal) — การตั้งค่า provider ภาพและวิดีโอ fal
- [ComfyUI](/th/providers/comfy) — การตั้งค่า workflow ของ ComfyUI ในเครื่องและ Comfy Cloud
- [Google (Gemini)](/th/providers/google) — การตั้งค่า provider ภาพ Gemini
- [MiniMax](/th/providers/minimax) — การตั้งค่า provider ภาพ MiniMax
- [OpenAI](/th/providers/openai) — การตั้งค่า provider OpenAI Images
- [Vydra](/th/providers/vydra) — การตั้งค่า Vydra สำหรับภาพ วิดีโอ และเสียงพูด
- [xAI](/th/providers/xai) — การตั้งค่า Grok สำหรับภาพ วิดีโอ การค้นหา การรันโค้ด และ TTS
- [Configuration Reference](/th/gateway/config-agents#agent-defaults) — config `imageGenerationModel`
- [Models](/th/concepts/models) — การกำหนดค่าโมเดลและ failover
