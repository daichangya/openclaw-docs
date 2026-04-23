---
read_when:
    - การสร้างภาพผ่านเอเจนต์
    - การตั้งค่า providers และโมเดลสำหรับการสร้างภาพ
    - การทำความเข้าใจพารามิเตอร์ของเครื่องมือ `image_generate`
summary: สร้างและแก้ไขภาพโดยใช้ providers ที่ตั้งค่าไว้ (OpenAI, Google Gemini, fal, MiniMax, ComfyUI, Vydra, xAI)
title: การสร้างภาพ
x-i18n:
    generated_at: "2026-04-23T06:01:14Z"
    model: gpt-5.4
    provider: openai
    source_hash: 228049c74dd3437544cda6418da665aed375c0494ef36a6927d15c28d7783bbd
    source_path: tools/image-generation.md
    workflow: 15
---

# การสร้างภาพ

เครื่องมือ `image_generate` ช่วยให้เอเจนต์สร้างและแก้ไขภาพโดยใช้ providers ที่คุณตั้งค่าไว้ ภาพที่สร้างขึ้นจะถูกส่งกลับโดยอัตโนมัติเป็นไฟล์แนบสื่อในการตอบกลับของเอเจนต์

<Note>
เครื่องมือนี้จะแสดงขึ้นก็ต่อเมื่อมี image generation provider อย่างน้อยหนึ่งตัวพร้อมใช้งาน หากคุณไม่เห็น `image_generate` ในรายการเครื่องมือของเอเจนต์ ให้ตั้งค่า `agents.defaults.imageGenerationModel` หรือกำหนด provider API key
</Note>

## เริ่มต้นอย่างรวดเร็ว

1. ตั้งค่า API key สำหรับอย่างน้อยหนึ่ง provider (ตัวอย่างเช่น `OPENAI_API_KEY` หรือ `GEMINI_API_KEY`)
2. ตั้งค่าโมเดลที่ต้องการแบบไม่บังคับ:

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

3. สั่งเอเจนต์ว่า: _"Generate an image of a friendly lobster mascot."_

เอเจนต์จะเรียก `image_generate` โดยอัตโนมัติ ไม่ต้องตั้ง allow-list ของเครื่องมือ — มันเปิดใช้งานเป็นค่าเริ่มต้นเมื่อมี provider พร้อมใช้งาน

## Providers ที่รองรับ

| Provider | โมเดลเริ่มต้น                     | รองรับการแก้ไข                   | API key                                                |
| -------- | ---------------------------------- | -------------------------------- | ------------------------------------------------------ |
| OpenAI   | `gpt-image-2`                      | ใช่ (สูงสุด 5 ภาพ)              | `OPENAI_API_KEY`                                       |
| Google   | `gemini-3.1-flash-image-preview`   | ใช่                              | `GEMINI_API_KEY` หรือ `GOOGLE_API_KEY`                 |
| fal      | `fal-ai/flux/dev`                  | ใช่                              | `FAL_KEY`                                              |
| MiniMax  | `image-01`                         | ใช่ (อ้างอิง subject)            | `MINIMAX_API_KEY` หรือ MiniMax OAuth (`minimax-portal`) |
| ComfyUI  | `workflow`                         | ใช่ (1 ภาพ, กำหนดโดย workflow)  | `COMFY_API_KEY` หรือ `COMFY_CLOUD_API_KEY` สำหรับ cloud |
| Vydra    | `grok-imagine`                     | ไม่                              | `VYDRA_API_KEY`                                        |
| xAI      | `grok-imagine-image`               | ใช่ (สูงสุด 5 ภาพ)              | `XAI_API_KEY`                                          |

ใช้ `action: "list"` เพื่อตรวจดู providers และโมเดลที่พร้อมใช้งานในรันไทม์:

```
/tool image_generate action=list
```

## พารามิเตอร์ของเครื่องมือ

| พารามิเตอร์   | ชนิด     | คำอธิบาย                                                                 |
| ------------- | -------- | ------------------------------------------------------------------------ |
| `prompt`      | string   | พรอมป์ต์สำหรับการสร้างภาพ (จำเป็นสำหรับ `action: "generate"`)            |
| `action`      | string   | `"generate"` (ค่าเริ่มต้น) หรือ `"list"` เพื่อตรวจดู providers          |
| `model`       | string   | override ของ provider/model เช่น `openai/gpt-image-2`                   |
| `image`       | string   | พาธหรือ URL ของภาพอ้างอิงภาพเดียวสำหรับโหมดแก้ไข                         |
| `images`      | string[] | ภาพอ้างอิงหลายภาพสำหรับโหมดแก้ไข (สูงสุด 5)                             |
| `size`        | string   | คำใบ้เรื่องขนาด: `1024x1024`, `1536x1024`, `1024x1536`, `2048x2048`, `3840x2160` |
| `aspectRatio` | string   | อัตราส่วนภาพ: `1:1`, `2:3`, `3:2`, `3:4`, `4:3`, `4:5`, `5:4`, `9:16`, `16:9`, `21:9` |
| `resolution`  | string   | คำใบ้เรื่องความละเอียด: `1K`, `2K` หรือ `4K`                           |
| `count`       | number   | จำนวนภาพที่จะสร้าง (1–4)                                                |
| `filename`    | string   | คำใบ้ชื่อไฟล์เอาต์พุต                                                   |

ไม่ใช่ทุก provider ที่รองรับทุกพารามิเตอร์ เมื่อ fallback provider รองรับตัวเลือก geometry ที่ใกล้เคียงแทนค่าที่ร้องขอแบบตรงตัว OpenClaw จะ remap ไปยัง size, aspect ratio หรือ resolution ที่รองรับและใกล้ที่สุดก่อนส่งคำขอ ส่วน overrides ที่ไม่รองรับจริงๆ จะยังคงถูกรายงานในผลลัพธ์ของเครื่องมือ

ผลลัพธ์ของเครื่องมือจะรายงานค่าการตั้งค่าที่ถูกนำไปใช้ เมื่อ OpenClaw ทำการ remap geometry ระหว่าง provider fallback ค่า `size`, `aspectRatio` และ `resolution` ที่คืนมาจะสะท้อนสิ่งที่ถูกส่งจริง และ `details.normalization` จะเก็บการแปลจากค่าที่ร้องขอไปเป็นค่าที่ถูกนำไปใช้

## การตั้งค่า

### การเลือกโมเดล

```json5
{
  agents: {
    defaults: {
      imageGenerationModel: {
        primary: "openai/gpt-image-2",
        fallbacks: ["google/gemini-3.1-flash-image-preview", "fal/fal-ai/flux/dev"],
      },
    },
  },
}
```

### ลำดับการเลือก provider

เมื่อสร้างภาพ OpenClaw จะลอง providers ตามลำดับนี้:

1. **พารามิเตอร์ `model`** จากการเรียกเครื่องมือ (หากเอเจนต์ระบุมา)
2. **`imageGenerationModel.primary`** จาก config
3. **`imageGenerationModel.fallbacks`** ตามลำดับ
4. **Auto-detection** — ใช้เฉพาะ provider defaults ที่รองรับ auth:
   - current default provider ก่อน
   - providers สำหรับการสร้างภาพที่ลงทะเบียนไว้ที่เหลือตามลำดับ provider-id

หาก provider ล้มเหลว (auth error, rate limit ฯลฯ) ระบบจะลองตัวเลือกถัดไปโดยอัตโนมัติ หากทุกตัวล้มเหลว ข้อผิดพลาดจะรวมรายละเอียดจากทุกความพยายาม

หมายเหตุ:

- Auto-detection รับรู้สถานะ auth ด้วย provider default จะเข้ารายการตัวเลือก
  ก็ต่อเมื่อ OpenClaw สามารถยืนยันตัวตนกับ provider นั้นได้จริง
- Auto-detection เปิดใช้เป็นค่าเริ่มต้น ตั้ง
  `agents.defaults.mediaGenerationAutoProviderFallback: false` หากคุณต้องการให้ image
  generation ใช้เฉพาะ `model`, `primary` และ `fallbacks`
  ที่ระบุไว้อย่างชัดเจนเท่านั้น
- ใช้ `action: "list"` เพื่อตรวจดู providers ที่ลงทะเบียนไว้ในปัจจุบัน
  โมเดลเริ่มต้นของแต่ละตัว และคำใบ้ env-var สำหรับ auth

### การแก้ไขภาพ

OpenAI, Google, fal, MiniMax, ComfyUI และ xAI รองรับการแก้ไขภาพอ้างอิง ส่งพาธหรือ URL ของภาพอ้างอิงเข้าไป:

```
"Generate a watercolor version of this photo" + image: "/path/to/photo.jpg"
```

OpenAI, Google และ xAI รองรับภาพอ้างอิงได้สูงสุด 5 ภาพผ่านพารามิเตอร์ `images` ส่วน fal, MiniMax และ ComfyUI รองรับ 1 ภาพ

### OpenAI `gpt-image-2`

การสร้างภาพของ OpenAI ใช้ค่าเริ่มต้นเป็น `openai/gpt-image-2` โดยโมเดลเก่า
`openai/gpt-image-1` ยังสามารถเลือกใช้อย่างชัดเจนได้ แต่คำขอสร้างภาพและแก้ไขภาพใหม่ของ OpenAI ควรใช้ `gpt-image-2`

`gpt-image-2` รองรับทั้งการสร้างภาพจากข้อความและการแก้ไขภาพอ้างอิง
ผ่านเครื่องมือ `image_generate` เดียวกัน OpenClaw จะส่งต่อ `prompt`,
`count`, `size` และภาพอ้างอิงไปยัง OpenAI โดย OpenAI จะไม่ได้รับ
`aspectRatio` หรือ `resolution` โดยตรง; หากเป็นไปได้ OpenClaw จะแมปสิ่งเหล่านี้ไปยัง
`size` ที่รองรับ มิฉะนั้นเครื่องมือจะรายงานว่าเป็น overrides ที่ถูกละเลย

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

การสร้างภาพของ MiniMax ใช้งานได้ผ่านทั้งสองเส้นทาง auth ของ MiniMax ที่ bundled มา:

- `minimax/image-01` สำหรับการตั้งค่าด้วย API key
- `minimax-portal/image-01` สำหรับการตั้งค่าด้วย OAuth

## ความสามารถของ Provider

| ความสามารถ             | OpenAI               | Google               | fal                 | MiniMax                    | ComfyUI                            | Vydra   | xAI                  |
| ---------------------- | -------------------- | -------------------- | ------------------- | -------------------------- | ---------------------------------- | ------- | -------------------- |
| Generate               | ใช่ (สูงสุด 4)       | ใช่ (สูงสุด 4)       | ใช่ (สูงสุด 4)      | ใช่ (สูงสุด 9)             | ใช่ (outputs ตาม workflow)         | ใช่ (1) | ใช่ (สูงสุด 4)       |
| Edit/reference         | ใช่ (สูงสุด 5 ภาพ)   | ใช่ (สูงสุด 5 ภาพ)   | ใช่ (1 ภาพ)         | ใช่ (1 ภาพ, subject ref)   | ใช่ (1 ภาพ, กำหนดโดย workflow)     | ไม่      | ใช่ (สูงสุด 5 ภาพ)   |
| Size control           | ใช่ (สูงสุด 4K)      | ใช่                  | ใช่                 | ไม่                         | ไม่                                 | ไม่      | ไม่                   |
| Aspect ratio           | ไม่                   | ใช่                  | ใช่ (เฉพาะ generate) | ใช่                        | ไม่                                 | ไม่      | ใช่                   |
| Resolution (1K/2K/4K)  | ไม่                   | ใช่                  | ใช่                 | ไม่                         | ไม่                                 | ไม่      | ใช่ (1K/2K)          |

### xAI `grok-imagine-image`

xAI provider แบบ bundled ใช้ `/v1/images/generations` สำหรับคำขอแบบ prompt-only
และใช้ `/v1/images/edits` เมื่อมี `image` หรือ `images`

- Models: `xai/grok-imagine-image`, `xai/grok-imagine-image-pro`
- Count: สูงสุด 4
- References: `image` หนึ่งรายการ หรือ `images` สูงสุดห้ารายการ
- Aspect ratios: `1:1`, `16:9`, `9:16`, `4:3`, `3:4`, `2:3`, `3:2`
- Resolutions: `1K`, `2K`
- Outputs: คืนค่าเป็น image attachments ที่ OpenClaw จัดการให้

OpenClaw ตั้งใจไม่เปิดเผย `quality`, `mask`, `user` หรือ
native-only aspect ratios เพิ่มเติมของ xAI จนกว่าตัวควบคุมเหล่านั้นจะมีอยู่ในสัญญา `image_generate` แบบใช้ร่วมกันข้าม providers

## ที่เกี่ยวข้อง

- [Tools Overview](/th/tools) — เครื่องมือของเอเจนต์ทั้งหมดที่มีให้ใช้
- [fal](/th/providers/fal) — การตั้งค่า provider สำหรับภาพและวิดีโอของ fal
- [ComfyUI](/th/providers/comfy) — การตั้งค่า workflow ของ ComfyUI ในเครื่องและ Comfy Cloud
- [Google (Gemini)](/th/providers/google) — การตั้งค่า provider ภาพของ Gemini
- [MiniMax](/th/providers/minimax) — การตั้งค่า provider ภาพของ MiniMax
- [OpenAI](/th/providers/openai) — การตั้งค่า provider OpenAI Images
- [Vydra](/th/providers/vydra) — การตั้งค่า image, video และ speech ของ Vydra
- [xAI](/th/providers/xai) — การตั้งค่า Grok สำหรับ image, video, search, code execution และ TTS
- [Configuration Reference](/th/gateway/configuration-reference#agent-defaults) — การตั้งค่า `imageGenerationModel`
- [Models](/th/concepts/models) — การตั้งค่าโมเดลและ failover
