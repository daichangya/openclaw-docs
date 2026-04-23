---
read_when:
    - การสร้างวิดีโอผ่านเอเจนต์
    - การกำหนดค่า providers และโมเดลสำหรับการสร้างวิดีโอ
    - การทำความเข้าใจพารามิเตอร์ของเครื่องมือ `video_generate`
summary: สร้างวิดีโอจากข้อความ รูปภาพ หรือวิดีโอที่มีอยู่โดยใช้ provider backends 14 รายการ
title: การสร้างวิดีโอ
x-i18n:
    generated_at: "2026-04-23T06:04:18Z"
    model: gpt-5.4
    provider: openai
    source_hash: c182f24b25e44f157a820e82a1f7422247f26125956944b5eb98613774268cfe
    source_path: tools/video-generation.md
    workflow: 15
---

# การสร้างวิดีโอ

เอเจนต์ OpenClaw สามารถสร้างวิดีโอจากพรอมป์ต์ข้อความ รูปภาพอ้างอิง หรือวิดีโอที่มีอยู่ได้ รองรับ provider backends ทั้งหมดสิบสี่ราย โดยแต่ละรายมีตัวเลือกโมเดล โหมดอินพุต และชุดความสามารถที่ต่างกัน เอเจนต์จะเลือกผู้ให้บริการที่เหมาะสมโดยอัตโนมัติตามการกำหนดค่าของคุณและ API keys ที่มีอยู่

<Note>
เครื่องมือ `video_generate` จะปรากฏก็ต่อเมื่อมีผู้ให้บริการสร้างวิดีโออย่างน้อยหนึ่งรายเท่านั้น หากคุณไม่เห็นเครื่องมือนี้ในเครื่องมือของเอเจนต์ ให้ตั้ง provider API key หรือกำหนดค่า `agents.defaults.videoGenerationModel`
</Note>

OpenClaw มองการสร้างวิดีโอเป็นสามโหมดการทำงาน:

- `generate` สำหรับคำขอ text-to-video ที่ไม่มีสื่ออ้างอิง
- `imageToVideo` เมื่อคำขอมีรูปภาพอ้างอิงอย่างน้อยหนึ่งภาพ
- `videoToVideo` เมื่อคำขอมีวิดีโออ้างอิงอย่างน้อยหนึ่งรายการ

ผู้ให้บริการอาจรองรับเพียงบางส่วนของโหมดเหล่านี้ เครื่องมือจะตรวจสอบโหมด
ที่กำลังใช้งานก่อนส่งคำขอ และรายงานโหมดที่รองรับใน `action=list`

## เริ่มต้นอย่างรวดเร็ว

1. ตั้ง API key สำหรับผู้ให้บริการที่รองรับรายใดก็ได้:

```bash
export GEMINI_API_KEY="your-key"
```

2. เลือกตรึงโมเดลค่าเริ่มต้นได้ตามต้องการ:

```bash
openclaw config set agents.defaults.videoGenerationModel.primary "google/veo-3.1-fast-generate-preview"
```

3. สั่งเอเจนต์:

> สร้างวิดีโอภาพยนตร์ความยาว 5 วินาทีของล็อบสเตอร์ที่เป็นมิตรเล่นเซิร์ฟตอนพระอาทิตย์ตก

เอเจนต์จะเรียก `video_generate` โดยอัตโนมัติ ไม่ต้องมีการ allowlist เครื่องมือ

## สิ่งที่เกิดขึ้นเมื่อคุณสร้างวิดีโอ

การสร้างวิดีโอเป็นแบบ asynchronous เมื่อเอเจนต์เรียก `video_generate` ในเซสชัน:

1. OpenClaw ส่งคำขอไปยังผู้ให้บริการและคืน task ID ทันที
2. ผู้ให้บริการประมวลผลงานใน background (โดยทั่วไป 30 วินาทีถึง 5 นาที ขึ้นอยู่กับผู้ให้บริการและความละเอียด)
3. เมื่อวิดีโอพร้อม OpenClaw จะปลุกเซสชันเดิมด้วย internal completion event
4. เอเจนต์จะโพสต์วิดีโอที่เสร็จแล้วกลับเข้าไปในการสนทนาเดิม

ขณะที่งานกำลังอยู่ระหว่างประมวลผล การเรียก `video_generate` ซ้ำในเซสชันเดียวกันจะคืนสถานะ task ปัจจุบันแทนการเริ่มสร้างใหม่ ใช้ `openclaw tasks list` หรือ `openclaw tasks show <taskId>` เพื่อตรวจสอบความคืบหน้าจาก CLI

นอกการรันของเอเจนต์ที่อิงกับเซสชัน (เช่น การเรียกเครื่องมือโดยตรง) เครื่องมือจะ fallback ไปเป็นการสร้างแบบ inline และคืนพาธสื่อสุดท้ายในเทิร์นเดียวกัน

### วงจรชีวิตของ Task

คำขอ `video_generate` แต่ละรายการจะเคลื่อนผ่านสี่สถานะ:

1. **queued** -- สร้าง task แล้ว กำลังรอให้ผู้ให้บริการรับงาน
2. **running** -- ผู้ให้บริการกำลังประมวลผล (โดยทั่วไป 30 วินาทีถึง 5 นาที ขึ้นอยู่กับผู้ให้บริการและความละเอียด)
3. **succeeded** -- วิดีโอพร้อมแล้ว; เอเจนต์จะถูกปลุกและโพสต์กลับไปยังการสนทนา
4. **failed** -- ผู้ให้บริการเกิดข้อผิดพลาดหรือหมดเวลา; เอเจนต์จะถูกปลุกพร้อมรายละเอียดข้อผิดพลาด

ตรวจสอบสถานะจาก CLI:

```bash
openclaw tasks list
openclaw tasks show <taskId>
openclaw tasks cancel <taskId>
```

การป้องกันการซ้ำ: หากมี video task ที่เป็น `queued` หรือ `running` อยู่แล้วสำหรับเซสชันปัจจุบัน `video_generate` จะคืนสถานะ task เดิมแทนการเริ่ม task ใหม่ ใช้ `action: "status"` เพื่อตรวจสอบแบบ explicit โดยไม่ทริกเกอร์การสร้างใหม่

## ผู้ให้บริการที่รองรับ

| Provider              | โมเดลค่าเริ่มต้น               | Text | Image ref                                            | Video ref        | API key                                  |
| --------------------- | ------------------------------- | ---- | ---------------------------------------------------- | ---------------- | ---------------------------------------- |
| Alibaba               | `wan2.6-t2v`                    | Yes  | Yes (remote URL)                                     | Yes (remote URL) | `MODELSTUDIO_API_KEY`                    |
| BytePlus (1.0)        | `seedance-1-0-pro-250528`       | Yes  | สูงสุด 2 ภาพ (เฉพาะโมเดล I2V; เฟรมแรก + เฟรมสุดท้าย) | No               | `BYTEPLUS_API_KEY`                       |
| BytePlus Seedance 1.5 | `seedance-1-5-pro-251215`       | Yes  | สูงสุด 2 ภาพ (เฟรมแรก + เฟรมสุดท้ายผ่าน role)         | No               | `BYTEPLUS_API_KEY`                       |
| BytePlus Seedance 2.0 | `dreamina-seedance-2-0-260128`  | Yes  | รูปภาพอ้างอิงสูงสุด 9 ภาพ                            | วิดีโอสูงสุด 3 รายการ | `BYTEPLUS_API_KEY`                    |
| ComfyUI               | `workflow`                      | Yes  | 1 ภาพ                                                | No               | `COMFY_API_KEY` or `COMFY_CLOUD_API_KEY` |
| fal                   | `fal-ai/minimax/video-01-live`  | Yes  | 1 ภาพ                                                | No               | `FAL_KEY`                                |
| Google                | `veo-3.1-fast-generate-preview` | Yes  | 1 ภาพ                                                | 1 วิดีโอ         | `GEMINI_API_KEY`                         |
| MiniMax               | `MiniMax-Hailuo-2.3`            | Yes  | 1 ภาพ                                                | No               | `MINIMAX_API_KEY`                        |
| OpenAI                | `sora-2`                        | Yes  | 1 ภาพ                                                | 1 วิดีโอ         | `OPENAI_API_KEY`                         |
| Qwen                  | `wan2.6-t2v`                    | Yes  | Yes (remote URL)                                     | Yes (remote URL) | `QWEN_API_KEY`                           |
| Runway                | `gen4.5`                        | Yes  | 1 ภาพ                                                | 1 วิดีโอ         | `RUNWAYML_API_SECRET`                    |
| Together              | `Wan-AI/Wan2.2-T2V-A14B`        | Yes  | 1 ภาพ                                                | No               | `TOGETHER_API_KEY`                       |
| Vydra                 | `veo3`                          | Yes  | 1 ภาพ (`kling`)                                      | No               | `VYDRA_API_KEY`                          |
| xAI                   | `grok-imagine-video`            | Yes  | 1 ภาพ                                                | 1 วิดีโอ         | `XAI_API_KEY`                            |

ผู้ให้บริการบางรายรองรับตัวแปร env สำหรับ API key เพิ่มเติมหรือทางเลือกอื่น ดูรายละเอียดใน [หน้าผู้ให้บริการ](#related) ของแต่ละราย

รัน `video_generate action=list` เพื่อตรวจสอบผู้ให้บริการ โมเดล และ
โหมดการทำงานที่ใช้ได้จริงขณะรันไทม์

### เมทริกซ์ความสามารถที่ประกาศไว้

นี่คือสัญญาโหมดแบบ explicit ที่ใช้โดย `video_generate`, contract tests
และ shared live sweep

| Provider | `generate` | `imageToVideo` | `videoToVideo` | Shared live lanes วันนี้                                                                                                                |
| -------- | ---------- | -------------- | -------------- | ---------------------------------------------------------------------------------------------------------------------------------------- |
| Alibaba  | Yes        | Yes            | Yes            | `generate`, `imageToVideo`; ข้าม `videoToVideo` เพราะผู้ให้บริการนี้ต้องใช้ remote `http(s)` video URLs                                |
| BytePlus | Yes        | Yes            | No             | `generate`, `imageToVideo`                                                                                                               |
| ComfyUI  | Yes        | Yes            | No             | ไม่อยู่ใน shared sweep; coverage แบบ workflow-specific อยู่กับการทดสอบของ Comfy                                                         |
| fal      | Yes        | Yes            | No             | `generate`, `imageToVideo`                                                                                                               |
| Google   | Yes        | Yes            | Yes            | `generate`, `imageToVideo`; shared `videoToVideo` ถูกข้ามเพราะ Gemini/Veo sweep แบบ buffer-backed ปัจจุบันไม่รับอินพุตนั้น            |
| MiniMax  | Yes        | Yes            | No             | `generate`, `imageToVideo`                                                                                                               |
| OpenAI   | Yes        | Yes            | Yes            | `generate`, `imageToVideo`; shared `videoToVideo` ถูกข้ามเพราะเส้นทาง org/input นี้ปัจจุบันต้องใช้ provider-side inpaint/remix access |
| Qwen     | Yes        | Yes            | Yes            | `generate`, `imageToVideo`; ข้าม `videoToVideo` เพราะผู้ให้บริการนี้ต้องใช้ remote `http(s)` video URLs                                 |
| Runway   | Yes        | Yes            | Yes            | `generate`, `imageToVideo`; `videoToVideo` จะรันเฉพาะเมื่อโมเดลที่เลือกคือ `runway/gen4_aleph`                                          |
| Together | Yes        | Yes            | No             | `generate`, `imageToVideo`                                                                                                               |
| Vydra    | Yes        | Yes            | No             | `generate`; shared `imageToVideo` ถูกข้ามเพราะ `veo3` ที่ bundled มาเป็น text-only และ `kling` ที่ bundled ต้องใช้ remote image URL   |
| xAI      | Yes        | Yes            | Yes            | `generate`, `imageToVideo`; ข้าม `videoToVideo` เพราะผู้ให้บริการนี้ปัจจุบันต้องใช้ remote MP4 URL                                      |

## พารามิเตอร์ของเครื่องมือ

### จำเป็น

| พารามิเตอร์ | ประเภท | คำอธิบาย                                                                    |
| --------- | ------ | ---------------------------------------------------------------------------- |
| `prompt`  | string | คำอธิบายข้อความของวิดีโอที่จะสร้าง (จำเป็นสำหรับ `action: "generate"`) |

### อินพุตเนื้อหา

| พารามิเตอร์   | ประเภท   | คำอธิบาย                                                                                                                               |
| ------------ | -------- | --------------------------------------------------------------------------------------------------------------------------------------- |
| `image`      | string   | รูปภาพอ้างอิงเดี่ยว (พาธหรือ URL)                                                                                                      |
| `images`     | string[] | รูปภาพอ้างอิงหลายภาพ (สูงสุด 9 ภาพ)                                                                                                   |
| `imageRoles` | string[] | role hints แบบไม่บังคับตามตำแหน่ง ขนานกับรายการรูปภาพรวม ค่า canonical ได้แก่ `first_frame`, `last_frame`, `reference_image`         |
| `video`      | string   | วิดีโออ้างอิงเดี่ยว (พาธหรือ URL)                                                                                                      |
| `videos`     | string[] | วิดีโออ้างอิงหลายรายการ (สูงสุด 4 รายการ)                                                                                             |
| `videoRoles` | string[] | role hints แบบไม่บังคับตามตำแหน่ง ขนานกับรายการวิดีโอรวม ค่า canonical คือ `reference_video`                                         |
| `audioRef`   | string   | เสียงอ้างอิงเดี่ยว (พาธหรือ URL) ใช้สำหรับสิ่งต่างๆ เช่น เพลงพื้นหลังหรือเสียงอ้างอิง เมื่อผู้ให้บริการรองรับ audio inputs            |
| `audioRefs`  | string[] | เสียงอ้างอิงหลายรายการ (สูงสุด 3 รายการ)                                                                                               |
| `audioRoles` | string[] | role hints แบบไม่บังคับตามตำแหน่ง ขนานกับรายการเสียงรวม ค่า canonical คือ `reference_audio`                                           |

role hints จะถูกส่งต่อไปยังผู้ให้บริการตามเดิม ค่า canonical มาจาก
union `VideoGenerationAssetRole` แต่ผู้ให้บริการอาจรองรับ
สตริง role อื่นเพิ่มเติมได้ อาร์เรย์ `*Roles` ต้องมีจำนวนรายการไม่มากกว่า
รายการอ้างอิงที่สอดคล้องกัน; หากคลาดเคลื่อนแบบ off-by-one จะล้มเหลวพร้อมข้อผิดพลาดที่ชัดเจน
ใช้สตริงว่างหากต้องการเว้นตำแหน่งนั้นไว้

### ตัวควบคุมสไตล์

| พารามิเตอร์      | ประเภท  | คำอธิบาย                                                                                |
| ---------------- | ------- | ---------------------------------------------------------------------------------------- |
| `aspectRatio`    | string  | `1:1`, `2:3`, `3:2`, `3:4`, `4:3`, `4:5`, `5:4`, `9:16`, `16:9`, `21:9` หรือ `adaptive` |
| `resolution`     | string  | `480P`, `720P`, `768P` หรือ `1080P`                                                      |
| `durationSeconds`| number  | ระยะเวลาที่ต้องการเป็นวินาที (ปัดเป็นค่าที่ผู้ให้บริการรองรับใกล้ที่สุด)                 |
| `size`           | string  | size hint เมื่อผู้ให้บริการรองรับ                                                       |
| `audio`          | boolean | เปิดใช้เสียงที่สร้างขึ้นในเอาต์พุตเมื่อรองรับ แยกจาก `audioRef*` (อินพุต)               |
| `watermark`      | boolean | เปิดหรือปิดลายน้ำของผู้ให้บริการเมื่อรองรับ                                             |

`adaptive` เป็น sentinel แบบเฉพาะผู้ให้บริการ: ค่านี้จะถูกส่งต่อไปตามเดิมยัง
ผู้ให้บริการที่ประกาศ `adaptive` ไว้ใน capabilities ของตน (เช่น BytePlus
Seedance ใช้มันเพื่อตรวจจับอัตราส่วนจากขนาดของภาพอินพุตโดยอัตโนมัติ)
ผู้ให้บริการที่ไม่ได้ประกาศค่านี้จะแสดงค่าดังกล่าวผ่าน
`details.ignoredOverrides` ในผลลัพธ์ของเครื่องมือ เพื่อให้เห็นชัดว่าค่านี้ถูกละทิ้ง

### ขั้นสูง

| พารามิเตอร์      | ประเภท | คำอธิบาย                                                                                                                                                                                                                                                                                                                                           |
| ---------------- | ------ | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `action`         | string | `"generate"` (ค่าเริ่มต้น), `"status"` หรือ `"list"`                                                                                                                                                                                                                                                                                               |
| `model`          | string | override ผู้ให้บริการ/โมเดล (เช่น `runway/gen4.5`)                                                                                                                                                                                                                                                                                                 |
| `filename`       | string | hint สำหรับชื่อไฟล์เอาต์พุต                                                                                                                                                                                                                                                                                                                         |
| `providerOptions`| object | ตัวเลือกเฉพาะผู้ให้บริการในรูปอ็อบเจ็กต์ JSON (เช่น `{"seed": 42, "draft": true}`) ผู้ให้บริการที่ประกาศสคีมาแบบมีชนิดจะตรวจสอบคีย์และชนิดข้อมูล; คีย์ที่ไม่รู้จักหรือชนิดที่ไม่ตรงกันจะทำให้ข้าม candidate นั้นระหว่าง fallback ผู้ให้บริการที่ไม่ได้ประกาศสคีมาจะได้รับตัวเลือกตามเดิม รัน `video_generate action=list` เพื่อดูว่าผู้ให้บริการแต่ละรายรองรับอะไร |

ไม่ใช่ทุกผู้ให้บริการจะรองรับทุกพารามิเตอร์ OpenClaw จะปรับระยะเวลาให้เป็นค่าที่ผู้ให้บริการรองรับใกล้ที่สุดอยู่แล้ว และยัง remap geometry hints ที่แปลแล้ว เช่น size-to-aspect-ratio เมื่อ fallback provider มีพื้นผิวการควบคุมที่ต่างกัน ส่วน overrides ที่ไม่รองรับจริงๆ จะถูกละเลยแบบ best-effort และรายงานเป็นคำเตือนในผลลัพธ์ของเครื่องมือ ข้อจำกัดด้าน capability แบบ hard (เช่น มีอินพุตอ้างอิงมากเกินไป) จะทำให้ล้มเหลวก่อนส่งคำขอ

ผลลัพธ์ของเครื่องมือจะรายงานการตั้งค่าที่ถูกใช้จริง เมื่อ OpenClaw remap ระยะเวลาหรือ geometry ระหว่าง provider fallback ค่า `durationSeconds`, `size`, `aspectRatio` และ `resolution` ที่ส่งกลับจะสะท้อนค่าที่ถูกส่งจริง และ `details.normalization` จะเก็บการแปลงจากค่าที่ร้องขอไปเป็นค่าที่ใช้จริง

อินพุตอ้างอิงยังใช้ในการเลือกโหมดการทำงานด้วย:

- ไม่มีสื่ออ้างอิง: `generate`
- มีรูปภาพอ้างอิงใดๆ: `imageToVideo`
- มีวิดีโออ้างอิงใดๆ: `videoToVideo`
- อินพุตเสียงอ้างอิงจะไม่เปลี่ยนโหมดที่ resolve ได้; มันจะถูกใช้เพิ่มบนโหมดใดก็ตามที่ image/video references เลือกไว้ และใช้งานได้เฉพาะกับผู้ให้บริการที่ประกาศ `maxInputAudios`

การผสมรูปภาพอ้างอิงและวิดีโออ้างอิงเข้าด้วยกันไม่ใช่พื้นผิว capability ร่วมที่เสถียร
ควรใช้ชนิดอ้างอิงเพียงแบบเดียวต่อหนึ่งคำขอ

#### Fallback และ typed options

การตรวจสอบ capability บางอย่างจะถูกใช้ที่ชั้น fallback แทนที่จะเป็นที่ขอบเขตของ
เครื่องมือ เพื่อให้คำขอที่เกินขีดจำกัดของผู้ให้บริการหลักยังสามารถรันบน fallback ที่รองรับได้:

- หาก candidate ที่กำลังใช้งานไม่ได้ประกาศ `maxInputAudios` (หรือประกาศเป็น
  `0`) ระบบจะข้าม candidate นั้นเมื่อคำขอมี audio references และลองใช้
  candidate ถัดไป
- หาก `maxDurationSeconds` ของ candidate ที่กำลังใช้งานต่ำกว่า
  `durationSeconds` ที่ร้องขอ และ candidate นั้นไม่ได้ประกาศรายการ
  `supportedDurationSeconds` ระบบจะข้าม candidate นั้น
- หากคำขอมี `providerOptions` และ candidate ที่กำลังใช้งาน
  ประกาศสคีมา `providerOptions` แบบมีชนิดอย่างชัดเจน candidate นั้นจะถูก
  ข้ามเมื่อคีย์ที่ส่งมาไม่มีในสคีมา หรือชนิดของค่าไม่ตรงกัน ผู้ให้บริการที่ยังไม่ประกาศสคีมา
  จะได้รับตัวเลือกตามเดิม (pass-through ที่เข้ากันได้ย้อนหลัง) ผู้ให้บริการสามารถ
  เลือกไม่รับ provider options ทั้งหมดอย่างชัดเจนได้โดยประกาศสคีมาว่าง
  (`capabilities.providerOptions: {}`) ซึ่งจะทำให้ถูกข้ามแบบเดียวกับ
  การไม่ตรงกันของชนิด

เหตุผลแรกที่ทำให้ข้ามในคำขอหนึ่งรายการจะถูกบันทึกที่ระดับ `warn` เพื่อให้ผู้ดูแลระบบเห็น
เมื่อผู้ให้บริการหลักของตนถูกข้าม ส่วนการข้ามถัดๆ ไปจะบันทึกที่ระดับ
`debug` เพื่อไม่ให้ห่วงโซ่ fallback ยาวๆ มี log มากเกินไป หากทุก candidate ถูกข้าม
ข้อผิดพลาดแบบรวมจะมีเหตุผลของการข้ามสำหรับแต่ละตัว

## Actions

- **generate** (ค่าเริ่มต้น) -- สร้างวิดีโอจากพรอมป์ต์ที่กำหนดและอินพุตอ้างอิงแบบไม่บังคับ
- **status** -- ตรวจสอบสถานะของ video task ที่กำลังทำงานสำหรับเซสชันปัจจุบันโดยไม่เริ่มการสร้างใหม่
- **list** -- แสดงผู้ให้บริการ โมเดล และ capabilities ที่ใช้ได้

## การเลือกโมเดล

เมื่อสร้างวิดีโอ OpenClaw จะ resolve โมเดลตามลำดับนี้:

1. **พารามิเตอร์เครื่องมือ `model`** -- หากเอเจนต์ระบุมาในการเรียก
2. **`videoGenerationModel.primary`** -- จาก config
3. **`videoGenerationModel.fallbacks`** -- ลองตามลำดับ
4. **การตรวจจับอัตโนมัติ** -- ใช้ผู้ให้บริการที่มี auth ถูกต้อง โดยเริ่มจากผู้ให้บริการค่าเริ่มต้นปัจจุบัน แล้วตามด้วยผู้ให้บริการที่เหลือเรียงตามตัวอักษร

หากผู้ให้บริการรายหนึ่งล้มเหลว candidate ถัดไปจะถูกลองโดยอัตโนมัติ หากทุก candidate ล้มเหลว ข้อผิดพลาดจะรวมรายละเอียดจากแต่ละความพยายามไว้

ตั้ง `agents.defaults.mediaGenerationAutoProviderFallback: false` หากคุณต้องการ
ให้การสร้างวิดีโอใช้เฉพาะรายการ `model`, `primary` และ `fallbacks`
ที่ระบุอย่างชัดเจนเท่านั้น

```json5
{
  agents: {
    defaults: {
      videoGenerationModel: {
        primary: "google/veo-3.1-fast-generate-preview",
        fallbacks: ["runway/gen4.5", "qwen/wan2.6-t2v"],
      },
    },
  },
}
```

## หมายเหตุเฉพาะผู้ให้บริการ

| Provider              | หมายเหตุ                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                              |
| --------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| Alibaba               | ใช้ async endpoint ของ DashScope/Model Studio รูปภาพและวิดีโออ้างอิงต้องเป็น remote `http(s)` URLs                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                     |
| BytePlus (1.0)        | Provider id คือ `byteplus` โมเดล: `seedance-1-0-pro-250528` (ค่าเริ่มต้น), `seedance-1-0-pro-t2v-250528`, `seedance-1-0-pro-fast-251015`, `seedance-1-0-lite-t2v-250428`, `seedance-1-0-lite-i2v-250428` โมเดล T2V (`*-t2v-*`) ไม่รับอินพุตรูปภาพ; โมเดล I2V และโมเดลทั่วไป `*-pro-*` รองรับรูปภาพอ้างอิงหนึ่งภาพ (เฟรมแรก) ส่งภาพตามลำดับตำแหน่งหรือกำหนด `role: "first_frame"` ก็ได้ ระบบจะสลับ model IDs ของ T2V ไปยัง I2V variant ที่สอดคล้องกันโดยอัตโนมัติเมื่อมีการส่งรูปภาพมา คีย์ `providerOptions` ที่รองรับ: `seed` (number), `draft` (boolean, บังคับเป็น 480p), `camera_fixed` (boolean) |
| BytePlus Seedance 1.5 | ต้องใช้ Plugin [`@openclaw/byteplus-modelark`](https://www.npmjs.com/package/@openclaw/byteplus-modelark) Provider id คือ `byteplus-seedance15` โมเดล: `seedance-1-5-pro-251215` ใช้ API แบบรวม `content[]` รองรับรูปภาพอินพุตได้สูงสุด 2 ภาพ (first_frame + last_frame) อินพุตทั้งหมดต้องเป็น remote `https://` URLs ตั้ง `role: "first_frame"` / `"last_frame"` ให้แต่ละภาพ หรือส่งภาพตามลำดับตำแหน่งก็ได้ `aspectRatio: "adaptive"` จะตรวจจับอัตราส่วนจากภาพอินพุตโดยอัตโนมัติ `audio: true` จะถูกแมปเป็น `generate_audio` ส่วน `providerOptions.seed` (number) จะถูกส่งต่อ                                                                                                                                                             |
| BytePlus Seedance 2.0 | ต้องใช้ Plugin [`@openclaw/byteplus-modelark`](https://www.npmjs.com/package/@openclaw/byteplus-modelark) Provider id คือ `byteplus-seedance2` โมเดล: `dreamina-seedance-2-0-260128`, `dreamina-seedance-2-0-fast-260128` ใช้ API แบบรวม `content[]` รองรับรูปภาพอ้างอิงได้สูงสุด 9 ภาพ วิดีโออ้างอิง 3 รายการ และเสียงอ้างอิง 3 รายการ อินพุตทั้งหมดต้องเป็น remote `https://` URLs ตั้ง `role` ให้ asset แต่ละรายการ — ค่าที่รองรับคือ `"first_frame"`, `"last_frame"`, `"reference_image"`, `"reference_video"`, `"reference_audio"` `aspectRatio: "adaptive"` จะตรวจจับอัตราส่วนจากภาพอินพุตโดยอัตโนมัติ `audio: true` จะถูกแมปเป็น `generate_audio` ส่วน `providerOptions.seed` (number) จะถูกส่งต่อ |
| ComfyUI               | การทำงานแบบ local หรือ cloud ที่ขับเคลื่อนด้วย workflow รองรับ text-to-video และ image-to-video ผ่านกราฟที่กำหนดค่าไว้                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                 |
| fal                   | ใช้ flow ที่มีคิวรองรับสำหรับงานที่ใช้เวลานาน รองรับรูปภาพอ้างอิงเพียงหนึ่งภาพเท่านั้น                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                 |
| Google                | ใช้ Gemini/Veo รองรับรูปภาพอ้างอิงหนึ่งภาพหรือวิดีโออ้างอิงหนึ่งรายการ                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                  |
| MiniMax               | รองรับรูปภาพอ้างอิงเพียงหนึ่งภาพเท่านั้น                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                               |
| OpenAI                | จะส่งต่อเฉพาะ override ของ `size` เท่านั้น ส่วน style overrides อื่น (`aspectRatio`, `resolution`, `audio`, `watermark`) จะถูกละเลยพร้อมคำเตือน                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                           |
| Qwen                  | ใช้ backend DashScope เดียวกับ Alibaba อินพุตอ้างอิงต้องเป็น remote `http(s)` URLs; ระบบจะปฏิเสธไฟล์ local ตั้งแต่ต้น                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                   |
| Runway                | รองรับไฟล์ local ผ่าน data URIs การทำ video-to-video ต้องใช้ `runway/gen4_aleph` การรันแบบ text-only รองรับอัตราส่วน `16:9` และ `9:16`                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                  |
| Together              | รองรับรูปภาพอ้างอิงเพียงหนึ่งภาพเท่านั้น                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                               |
| Vydra                 | ใช้ `https://www.vydra.ai/api/v1` โดยตรงเพื่อหลีกเลี่ยง redirects ที่ทำให้ auth หลุด `veo3` ที่ bundled มาเป็น text-to-video เท่านั้น; `kling` ต้องใช้ remote image URL                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                   |
| xAI                   | รองรับ flow แบบ text-to-video, image-to-video และการแก้ไข/ขยายวิดีโอจาก remote                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                           |

## โหมด capability ของผู้ให้บริการ

สัญญา video-generation แบบใช้ร่วมกันตอนนี้เปิดให้ผู้ให้บริการประกาศ
capabilities แบบเฉพาะโหมดได้ แทนที่จะมีเพียงข้อจำกัดรวมแบบแบนเท่านั้น ผู้ให้บริการใหม่
ควรใช้บล็อกโหมดแบบ explicit:

```typescript
capabilities: {
  generate: {
    maxVideos: 1,
    maxDurationSeconds: 10,
    supportsResolution: true,
  },
  imageToVideo: {
    enabled: true,
    maxVideos: 1,
    maxInputImages: 1,
    maxDurationSeconds: 5,
  },
  videoToVideo: {
    enabled: true,
    maxVideos: 1,
    maxInputVideos: 1,
    maxDurationSeconds: 5,
  },
}
```

ฟิลด์รวมแบบแบนอย่าง `maxInputImages` และ `maxInputVideos` นั้นไม่เพียงพอ
สำหรับการประกาศการรองรับโหมด transform ผู้ให้บริการควรประกาศ
`generate`, `imageToVideo` และ `videoToVideo` อย่างชัดเจน เพื่อให้ live tests,
contract tests และเครื่องมือ `video_generate` แบบใช้ร่วมกันสามารถตรวจสอบการรองรับโหมดได้
อย่างกำหนดได้แน่นอน

## Live tests

การทดสอบสดแบบ opt-in สำหรับผู้ให้บริการแบบ bundled ที่ใช้ร่วมกัน:

```bash
OPENCLAW_LIVE_TEST=1 pnpm test:live -- extensions/video-generation-providers.live.test.ts
```

wrapper ของ repo:

```bash
pnpm test:live:media video
```

ไฟล์ live นี้จะโหลดตัวแปร env ของผู้ให้บริการที่ขาดหายจาก `~/.profile`, ให้ความสำคัญกับ
API keys จาก live/env เหนือ auth profiles ที่จัดเก็บไว้ตามค่าเริ่มต้น และรัน smoke ที่ปลอดภัยสำหรับรีลีสเป็นค่าเริ่มต้น:

- `generate` สำหรับทุกผู้ให้บริการที่ไม่ใช่ FAL ใน sweep
- พรอมป์ต์ lobster ความยาวหนึ่งวินาที
- operation cap ต่อผู้ให้บริการจาก `OPENCLAW_LIVE_VIDEO_GENERATION_TIMEOUT_MS`
  (`180000` ตามค่าเริ่มต้น)

FAL เป็นแบบ opt-in เพราะ latency ของคิวฝั่งผู้ให้บริการอาจครองเวลารีลีส:

```bash
pnpm test:live:media video --video-providers fal
```

ตั้ง `OPENCLAW_LIVE_VIDEO_GENERATION_FULL_MODES=1` เพื่อให้รันโหมด transform ที่ประกาศไว้ด้วย
ซึ่ง shared sweep สามารถทดสอบได้อย่างปลอดภัยด้วยสื่อ local:

- `imageToVideo` เมื่อ `capabilities.imageToVideo.enabled`
- `videoToVideo` เมื่อ `capabilities.videoToVideo.enabled` และผู้ให้บริการ/โมเดลนั้น
  รับอินพุตวิดีโอ local แบบ buffer-backed ใน shared sweep

ปัจจุบัน live lane ของ `videoToVideo` แบบใช้ร่วมกันครอบคลุม:

- `runway` เท่านั้น เมื่อคุณเลือก `runway/gen4_aleph`

## การกำหนดค่า

ตั้งค่าโมเดลสร้างวิดีโอเริ่มต้นใน config ของ OpenClaw:

```json5
{
  agents: {
    defaults: {
      videoGenerationModel: {
        primary: "qwen/wan2.6-t2v",
        fallbacks: ["qwen/wan2.6-r2v-flash"],
      },
    },
  },
}
```

หรือผ่าน CLI:

```bash
openclaw config set agents.defaults.videoGenerationModel.primary "qwen/wan2.6-t2v"
```

## ที่เกี่ยวข้อง

- [Tools Overview](/th/tools)
- [Background Tasks](/th/automation/tasks) -- การติดตาม task สำหรับการสร้างวิดีโอแบบ async
- [Alibaba Model Studio](/th/providers/alibaba)
- [BytePlus](/th/concepts/model-providers#byteplus-international)
- [ComfyUI](/th/providers/comfy)
- [fal](/th/providers/fal)
- [Google (Gemini)](/th/providers/google)
- [MiniMax](/th/providers/minimax)
- [OpenAI](/th/providers/openai)
- [Qwen](/th/providers/qwen)
- [Runway](/th/providers/runway)
- [Together AI](/th/providers/together)
- [Vydra](/th/providers/vydra)
- [xAI](/th/providers/xai)
- [Configuration Reference](/th/gateway/configuration-reference#agent-defaults)
- [Models](/th/concepts/models)
