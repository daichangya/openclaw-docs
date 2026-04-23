---
read_when:
    - การสร้างรูปภาพผ่านเอเจนต์
    - การกำหนดค่าผู้ให้บริการและโมเดลสำหรับการสร้างรูปภาพ
    - ทำความเข้าใจพารามิเตอร์ของเครื่องมือ image_generate
summary: สร้างและแก้ไขรูปภาพโดยใช้ผู้ให้บริการที่กำหนดค่าไว้ (OpenAI, Google Gemini, fal, MiniMax, ComfyUI, Vydra, xAI)
title: การสร้างรูปภาพ
x-i18n:
    generated_at: "2026-04-23T13:58:19Z"
    model: gpt-5.4
    provider: openai
    source_hash: 0fbd8eda2cb0867d1426b9349f6778c231051d600ebe451534efbee0e215c871
    source_path: tools/image-generation.md
    workflow: 15
---

# การสร้างรูปภาพ

เครื่องมือ `image_generate` ช่วยให้เอเจนต์สร้างและแก้ไขรูปภาพโดยใช้ผู้ให้บริการที่คุณกำหนดค่าไว้ รูปภาพที่สร้างขึ้นจะถูกส่งให้อัตโนมัติเป็นไฟล์แนบสื่อในคำตอบของเอเจนต์

<Note>
เครื่องมือนี้จะแสดงขึ้นก็ต่อเมื่อมีผู้ให้บริการสร้างรูปภาพอย่างน้อยหนึ่งรายเท่านั้น หากคุณไม่เห็น `image_generate` ในเครื่องมือของเอเจนต์ ให้กำหนดค่า `agents.defaults.imageGenerationModel` หรือตั้งค่า API key ของผู้ให้บริการ
</Note>

## เริ่มต้นอย่างรวดเร็ว

1. ตั้งค่า API key สำหรับผู้ให้บริการอย่างน้อยหนึ่งราย (เช่น `OPENAI_API_KEY` หรือ `GEMINI_API_KEY`)
2. เลือกตั้งค่าโมเดลที่ต้องการ:

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

3. ขอให้เอเจนต์: _"สร้างรูปภาพมาสคอตล็อบสเตอร์ที่เป็นมิตร"_

เอเจนต์จะเรียก `image_generate` โดยอัตโนมัติ ไม่ต้องกำหนด allow-list ของเครื่องมือ เพราะจะเปิดใช้งานเป็นค่าเริ่มต้นเมื่อมีผู้ให้บริการพร้อมใช้งาน

## ผู้ให้บริการที่รองรับ

| ผู้ให้บริการ | โมเดลเริ่มต้น                    | รองรับการแก้ไข                    | API key                                               |
| -------- | -------------------------------- | ---------------------------------- | ----------------------------------------------------- |
| OpenAI   | `gpt-image-2`                    | ใช่ (สูงสุด 5 รูป)                | `OPENAI_API_KEY`                                      |
| Google   | `gemini-3.1-flash-image-preview` | ใช่                                | `GEMINI_API_KEY` หรือ `GOOGLE_API_KEY`                |
| fal      | `fal-ai/flux/dev`                | ใช่                                | `FAL_KEY`                                             |
| MiniMax  | `image-01`                       | ใช่ (อ้างอิงวัตถุหลัก)            | `MINIMAX_API_KEY` หรือ MiniMax OAuth (`minimax-portal`) |
| ComfyUI  | `workflow`                       | ใช่ (1 รูป, กำหนดโดย workflow)    | `COMFY_API_KEY` หรือ `COMFY_CLOUD_API_KEY` สำหรับคลาวด์ |
| Vydra    | `grok-imagine`                   | ไม่                                | `VYDRA_API_KEY`                                       |
| xAI      | `grok-imagine-image`             | ใช่ (สูงสุด 5 รูป)                | `XAI_API_KEY`                                         |

ใช้ `action: "list"` เพื่อตรวจสอบผู้ให้บริการและโมเดลที่พร้อมใช้งานขณะรัน:

```
/tool image_generate action=list
```

## พารามิเตอร์ของเครื่องมือ

| พารามิเตอร์   | ประเภท   | คำอธิบาย                                                                              |
| ------------- | -------- | -------------------------------------------------------------------------------------- |
| `prompt`      | string   | พรอมป์ต์สำหรับการสร้างรูปภาพ (จำเป็นสำหรับ `action: "generate"`)                      |
| `action`      | string   | `"generate"` (ค่าเริ่มต้น) หรือ `"list"` เพื่อดูผู้ให้บริการ                         |
| `model`       | string   | ระบุผู้ให้บริการ/โมเดลทับค่าเดิม เช่น `openai/gpt-image-2`                            |
| `image`       | string   | พาธหรือ URL ของรูปภาพอ้างอิงเดี่ยวสำหรับโหมดแก้ไข                                    |
| `images`      | string[] | รูปภาพอ้างอิงหลายรูปสำหรับโหมดแก้ไข (สูงสุด 5 รูป)                                    |
| `size`        | string   | คำใบ้ขนาด: `1024x1024`, `1536x1024`, `1024x1536`, `2048x2048`, `3840x2160`             |
| `aspectRatio` | string   | อัตราส่วนภาพ: `1:1`, `2:3`, `3:2`, `3:4`, `4:3`, `4:5`, `5:4`, `9:16`, `16:9`, `21:9` |
| `resolution`  | string   | คำใบ้ความละเอียด: `1K`, `2K` หรือ `4K`                                                 |
| `count`       | number   | จำนวนรูปภาพที่ต้องการสร้าง (1–4)                                                       |
| `filename`    | string   | คำใบ้ชื่อไฟล์ผลลัพธ์                                                                    |

ผู้ให้บริการแต่ละรายไม่ได้รองรับทุกพารามิเตอร์เสมอไป เมื่อผู้ให้บริการสำรองรองรับตัวเลือกเรขาคณิตที่ใกล้เคียงแทนค่าที่ร้องขอแบบตรงตัว OpenClaw จะรีแมปไปยังขนาด อัตราส่วนภาพ หรือความละเอียดที่รองรับและใกล้ที่สุดก่อนส่งคำขอ ส่วนค่าที่ไม่รองรับจริงจะยังถูกรายงานอยู่ในผลลัพธ์ของเครื่องมือ

ผลลัพธ์ของเครื่องมือจะแสดงการตั้งค่าที่ถูกนำไปใช้ เมื่อ OpenClaw รีแมปค่าทางเรขาคณิตระหว่างการ fallback ของผู้ให้บริการ ค่า `size`, `aspectRatio` และ `resolution` ที่ส่งกลับจะสะท้อนค่าที่ถูกส่งจริง และ `details.normalization` จะเก็บการแปลงจากค่าที่ร้องขอไปเป็นค่าที่นำไปใช้

## การกำหนดค่า

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

### ลำดับการเลือกผู้ให้บริการ

เมื่อสร้างรูปภาพ OpenClaw จะลองผู้ให้บริการตามลำดับนี้:

1. **พารามิเตอร์ `model`** จากการเรียกเครื่องมือ (หากเอเจนต์ระบุไว้)
2. **`imageGenerationModel.primary`** จากการตั้งค่า
3. **`imageGenerationModel.fallbacks`** ตามลำดับ
4. **การตรวจจับอัตโนมัติ** — ใช้เฉพาะค่าเริ่มต้นของผู้ให้บริการที่มีการยืนยันตัวตนรองรับเท่านั้น:
   - ผู้ให้บริการเริ่มต้นปัจจุบันก่อน
   - ผู้ให้บริการสร้างรูปภาพที่ลงทะเบียนไว้ที่เหลือตามลำดับ provider-id

หากผู้ให้บริการรายหนึ่งล้มเหลว (ข้อผิดพลาดการยืนยันตัวตน, ติด rate limit ฯลฯ) ระบบจะลองตัวเลือกถัดไปโดยอัตโนมัติ หากล้มเหลวทั้งหมด ข้อผิดพลาดจะมีรายละเอียดจากแต่ละความพยายาม

หมายเหตุ:

- การตรวจจับอัตโนมัติรับรู้สถานะการยืนยันตัวตน ผู้ให้บริการเริ่มต้นจะถูกเพิ่มเข้าไปในรายการตัวเลือกก็ต่อเมื่อ OpenClaw สามารถยืนยันตัวตนกับผู้ให้บริการนั้นได้จริง
- การตรวจจับอัตโนมัติเปิดใช้งานเป็นค่าเริ่มต้น ตั้งค่า
  `agents.defaults.mediaGenerationAutoProviderFallback: false` หากคุณต้องการให้การสร้างรูปภาพ
  ใช้เฉพาะรายการ `model`, `primary` และ `fallbacks`
  ที่ระบุไว้อย่างชัดเจนเท่านั้น
- ใช้ `action: "list"` เพื่อตรวจสอบผู้ให้บริการที่ลงทะเบียนอยู่ในขณะนี้
  โมเดลเริ่มต้นของแต่ละราย และคำใบ้เกี่ยวกับ env var สำหรับการยืนยันตัวตน

### การแก้ไขรูปภาพ

OpenAI, Google, fal, MiniMax, ComfyUI และ xAI รองรับการแก้ไขรูปภาพอ้างอิง ส่งพาธหรือ URL ของรูปภาพอ้างอิงได้ดังนี้:

```
"สร้างภาพถ่ายนี้ในเวอร์ชันสีน้ำ" + image: "/path/to/photo.jpg"
```

OpenAI, Google และ xAI รองรับรูปภาพอ้างอิงได้สูงสุด 5 รูปผ่านพารามิเตอร์ `images` ส่วน fal, MiniMax และ ComfyUI รองรับ 1 รูป

### OpenAI `gpt-image-2`

การสร้างรูปภาพของ OpenAI ใช้ค่าเริ่มต้นเป็น `openai/gpt-image-2` โมเดลรุ่นเก่า
`openai/gpt-image-1` ยังสามารถเลือกใช้อย่างชัดเจนได้ แต่คำขอสร้างรูปภาพและแก้ไขรูปภาพใหม่ของ OpenAI
ควรใช้ `gpt-image-2`

`gpt-image-2` รองรับทั้งการสร้างรูปภาพจากข้อความและการแก้ไขรูปภาพอ้างอิง
ผ่านเครื่องมือ `image_generate` ตัวเดียวกัน OpenClaw จะส่งต่อ `prompt`,
`count`, `size` และรูปภาพอ้างอิงไปยัง OpenAI โดย OpenAI จะไม่ได้รับ
`aspectRatio` หรือ `resolution` โดยตรง; เมื่อเป็นไปได้ OpenClaw จะจับคู่ค่าเหล่านั้นไปเป็น
`size` ที่รองรับ มิฉะนั้นเครื่องมือจะรายงานว่าเป็นค่าทับที่ถูกละเว้น

สร้างรูปภาพแนวนอน 4K หนึ่งรูป:

```
/tool image_generate action=generate model=openai/gpt-image-2 prompt="A clean editorial poster for OpenClaw image generation" size=3840x2160 count=1
```

สร้างรูปภาพสี่เหลี่ยมจัตุรัสสองรูป:

```
/tool image_generate action=generate model=openai/gpt-image-2 prompt="Two visual directions for a calm productivity app icon" size=1024x1024 count=2
```

แก้ไขรูปภาพอ้างอิงภายในเครื่องหนึ่งรูป:

```
/tool image_generate action=generate model=openai/gpt-image-2 prompt="Keep the subject, replace the background with a bright studio setup" image=/path/to/reference.png size=1024x1536
```

แก้ไขโดยใช้รูปภาพอ้างอิงหลายรูป:

```
/tool image_generate action=generate model=openai/gpt-image-2 prompt="Combine the character identity from the first image with the color palette from the second" images='["/path/to/character.png","/path/to/palette.jpg"]' size=1536x1024
```

หากต้องการให้การสร้างรูปภาพของ OpenAI ส่งผ่านการติดตั้งใช้งาน Azure OpenAI แทน
`api.openai.com` โปรดดู [Azure OpenAI endpoints](/th/providers/openai#azure-openai-endpoints)
ในเอกสารของผู้ให้บริการ OpenAI

การสร้างรูปภาพของ MiniMax ใช้งานได้ผ่านทั้งสองเส้นทางการยืนยันตัวตน MiniMax ที่มีมาให้:

- `minimax/image-01` สำหรับการตั้งค่าด้วย API key
- `minimax-portal/image-01` สำหรับการตั้งค่าด้วย OAuth

## ความสามารถของผู้ให้บริการ

| ความสามารถ          | OpenAI               | Google               | fal                 | MiniMax                    | ComfyUI                            | Vydra   | xAI                  |
| ------------------- | -------------------- | -------------------- | ------------------- | -------------------------- | ---------------------------------- | ------- | -------------------- |
| สร้าง                | ใช่ (สูงสุด 4)       | ใช่ (สูงสุด 4)       | ใช่ (สูงสุด 4)      | ใช่ (สูงสุด 9)             | ใช่ (ผลลัพธ์กำหนดโดย workflow)    | ใช่ (1) | ใช่ (สูงสุด 4)       |
| แก้ไข/อ้างอิง        | ใช่ (สูงสุด 5 รูป)   | ใช่ (สูงสุด 5 รูป)   | ใช่ (1 รูป)         | ใช่ (1 รูป, อ้างอิงวัตถุหลัก) | ใช่ (1 รูป, กำหนดโดย workflow) | ไม่      | ใช่ (สูงสุด 5 รูป)   |
| ควบคุมขนาด          | ใช่ (สูงสุด 4K)      | ใช่                  | ใช่                 | ไม่                        | ไม่                                 | ไม่      | ไม่                   |
| อัตราส่วนภาพ        | ไม่                   | ใช่                  | ใช่ (เฉพาะการสร้าง) | ใช่                        | ไม่                                 | ไม่      | ใช่                  |
| ความละเอียด (1K/2K/4K) | ไม่                | ใช่                  | ใช่                 | ไม่                        | ไม่                                 | ไม่      | ใช่ (1K/2K)          |

### xAI `grok-imagine-image`

ผู้ให้บริการ xAI ที่มีมาให้ใช้ `/v1/images/generations` สำหรับคำขอที่มีเฉพาะพรอมป์ต์
และใช้ `/v1/images/edits` เมื่อมี `image` หรือ `images`

- โมเดล: `xai/grok-imagine-image`, `xai/grok-imagine-image-pro`
- จำนวน: สูงสุด 4
- รูปภาพอ้างอิง: `image` หนึ่งรายการ หรือ `images` สูงสุดห้ารายการ
- อัตราส่วนภาพ: `1:1`, `16:9`, `9:16`, `4:3`, `3:4`, `2:3`, `3:2`
- ความละเอียด: `1K`, `2K`
- ผลลัพธ์: ส่งกลับเป็นไฟล์แนบรูปภาพที่ OpenClaw จัดการให้

OpenClaw ตั้งใจไม่เปิดเผย `quality`, `mask`, `user` ของ xAI โดยตรง หรือ
อัตราส่วนภาพเพิ่มเติมที่มีเฉพาะแบบ native จนกว่าตัวควบคุมเหล่านั้นจะมีอยู่ในสัญญา
`image_generate` แบบใช้ร่วมกันข้ามผู้ให้บริการ

## ที่เกี่ยวข้อง

- [ภาพรวมของเครื่องมือ](/th/tools) — เครื่องมือเอเจนต์ทั้งหมดที่พร้อมใช้งาน
- [fal](/th/providers/fal) — การตั้งค่าผู้ให้บริการภาพและวิดีโอ fal
- [ComfyUI](/th/providers/comfy) — การตั้งค่า workflow ของ ComfyUI ภายในเครื่องและ Comfy Cloud
- [Google (Gemini)](/th/providers/google) — การตั้งค่าผู้ให้บริการภาพ Gemini
- [MiniMax](/th/providers/minimax) — การตั้งค่าผู้ให้บริการภาพ MiniMax
- [OpenAI](/th/providers/openai) — การตั้งค่าผู้ให้บริการ OpenAI Images
- [Vydra](/th/providers/vydra) — การตั้งค่ารูปภาพ วิดีโอ และเสียงพูดของ Vydra
- [xAI](/th/providers/xai) — การตั้งค่า Grok สำหรับรูปภาพ วิดีโอ การค้นหา การรันโค้ด และ TTS
- [ข้อมูลอ้างอิงการกำหนดค่า](/th/gateway/configuration-reference#agent-defaults) — ค่ากำหนด `imageGenerationModel`
- [โมเดล](/th/concepts/models) — การกำหนดค่าโมเดลและการ failover
