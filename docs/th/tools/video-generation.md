---
read_when:
    - การสร้างวิดีโอผ่าน agent
    - การกำหนดค่า providers และโมเดลสำหรับการสร้างวิดีโอ
    - การทำความเข้าใจพารามิเตอร์ของเครื่องมือ video_generate
summary: สร้างวิดีโอจากข้อความ ภาพ หรือวิดีโอที่มีอยู่ โดยใช้แบ็กเอนด์ของผู้ให้บริการ 14 ราย
title: การสร้างวิดีโอ
x-i18n:
    generated_at: "2026-04-24T09:39:14Z"
    model: gpt-5.4
    provider: openai
    source_hash: c5ddefd4fcde2b22be6631c160ed6e128a97b0800d32c65fb5fe36227ce4f368
    source_path: tools/video-generation.md
    workflow: 15
---

OpenClaw agents สามารถสร้างวิดีโอจากพรอมป์ข้อความ ภาพอ้างอิง หรือวิดีโอที่มีอยู่ได้ รองรับแบ็กเอนด์ของผู้ให้บริการ 14 ราย โดยแต่ละรายมีตัวเลือกโมเดล โหมดอินพุต และชุดความสามารถที่แตกต่างกัน agent จะเลือก provider ที่เหมาะสมให้อัตโนมัติตามการกำหนดค่าของคุณและ API keys ที่มีอยู่

<Note>
เครื่องมือ `video_generate` จะปรากฏเฉพาะเมื่อมี provider สำหรับการสร้างวิดีโออย่างน้อยหนึ่งรายพร้อมใช้งาน หากคุณไม่เห็นเครื่องมือนี้ในเครื่องมือของ agent ให้ตั้งค่า API key ของ provider หรือกำหนดค่า `agents.defaults.videoGenerationModel`
</Note>

OpenClaw มองว่าการสร้างวิดีโอมีโหมดรันไทม์ 3 แบบ:

- `generate` สำหรับคำขอ text-to-video ที่ไม่มีสื่ออ้างอิง
- `imageToVideo` เมื่อคำขอมีภาพอ้างอิงอย่างน้อยหนึ่งภาพ
- `videoToVideo` เมื่อคำขอมีวิดีโออ้างอิงอย่างน้อยหนึ่งรายการ

providers สามารถรองรับเพียงบางส่วนของโหมดเหล่านี้ก็ได้ เครื่องมือจะตรวจสอบโหมด
ที่ใช้งานอยู่ก่อนส่ง และรายงานโหมดที่รองรับใน `action=list`

## เริ่มต้นอย่างรวดเร็ว

1. ตั้งค่า API key สำหรับ provider ที่รองรับรายใดก็ได้:

```bash
export GEMINI_API_KEY="your-key"
```

2. เลือกโมเดลเริ่มต้นแบบระบุชัดเจนได้ตามต้องการ:

```bash
openclaw config set agents.defaults.videoGenerationModel.primary "google/veo-3.1-fast-generate-preview"
```

3. สั่ง agent:

> สร้างวิดีโอความยาว 5 วินาทีแบบภาพยนตร์ของกุ้งล็อบสเตอร์เป็นมิตรที่กำลังเล่นเซิร์ฟตอนพระอาทิตย์ตก

agent จะเรียก `video_generate` โดยอัตโนมัติ ไม่ต้องทำ allowlisting ให้กับเครื่องมือ

## สิ่งที่เกิดขึ้นเมื่อคุณสร้างวิดีโอ

การสร้างวิดีโอเป็นแบบอะซิงโครนัส เมื่อ agent เรียก `video_generate` ในเซสชัน:

1. OpenClaw ส่งคำขอไปยัง provider และส่ง task ID กลับทันที
2. provider ประมวลผลงานในเบื้องหลัง (โดยทั่วไป 30 วินาทีถึง 5 นาที ขึ้นอยู่กับ provider และความละเอียด)
3. เมื่อวิดีโอพร้อม OpenClaw จะปลุกเซสชันเดิมด้วย completion event ภายใน
4. agent จะโพสต์วิดีโอที่เสร็จแล้วกลับเข้าไปในบทสนทนาเดิม

ขณะมีงานที่กำลังทำอยู่ การเรียก `video_generate` ซ้ำในเซสชันเดียวกันจะส่งกลับสถานะของ task ปัจจุบันแทนการเริ่มการสร้างใหม่ ใช้ `openclaw tasks list` หรือ `openclaw tasks show <taskId>` เพื่อตรวจสอบความคืบหน้าจาก CLI

นอกการรันของ agent ที่อิงกับเซสชัน (เช่น การเรียกเครื่องมือโดยตรง) เครื่องมือจะ fallback ไปใช้การสร้างแบบอินไลน์ และส่งกลับพาธของสื่อสุดท้ายในเทิร์นเดียวกัน

### วงจรชีวิตของ task

คำขอ `video_generate` แต่ละรายการจะเคลื่อนผ่าน 4 สถานะ:

1. **queued** -- สร้าง task แล้ว กำลังรอให้ provider รับงาน
2. **running** -- provider กำลังประมวลผล (โดยทั่วไป 30 วินาทีถึง 5 นาที ขึ้นอยู่กับ provider และความละเอียด)
3. **succeeded** -- วิดีโอพร้อมแล้ว; agent ถูกปลุกและโพสต์วิดีโอเข้าไปในบทสนทนา
4. **failed** -- provider เกิดข้อผิดพลาดหรือหมดเวลา; agent ถูกปลุกพร้อมรายละเอียดข้อผิดพลาด

ตรวจสอบสถานะจาก CLI:

```bash
openclaw tasks list
openclaw tasks show <taskId>
openclaw tasks cancel <taskId>
```

การป้องกันรายการซ้ำ: หากมี video task อยู่แล้วในสถานะ `queued` หรือ `running` สำหรับเซสชันปัจจุบัน `video_generate` จะส่งกลับสถานะของ task เดิมแทนการเริ่มงานใหม่ ใช้ `action: "status"` เพื่อตรวจสอบอย่างชัดเจนโดยไม่กระตุ้นการสร้างใหม่

## ผู้ให้บริการที่รองรับ

| Provider              | โมเดลเริ่มต้น                  | ข้อความ | ภาพอ้างอิง                                           | วิดีโออ้างอิง    | คีย์ API                                  |
| --------------------- | ------------------------------ | ------- | ---------------------------------------------------- | ---------------- | ---------------------------------------- |
| Alibaba               | `wan2.6-t2v`                   | ใช่     | ใช่ (remote URL)                                     | ใช่ (remote URL) | `MODELSTUDIO_API_KEY`                    |
| BytePlus (1.0)        | `seedance-1-0-pro-250528`      | ใช่     | สูงสุด 2 ภาพ (เฉพาะโมเดล I2V; เฟรมแรก + เฟรมสุดท้าย) | ไม่               | `BYTEPLUS_API_KEY`                       |
| BytePlus Seedance 1.5 | `seedance-1-5-pro-251215`      | ใช่     | สูงสุด 2 ภาพ (เฟรมแรก + เฟรมสุดท้ายผ่าน role)        | ไม่               | `BYTEPLUS_API_KEY`                       |
| BytePlus Seedance 2.0 | `dreamina-seedance-2-0-260128` | ใช่     | สูงสุด 9 ภาพอ้างอิง                                  | สูงสุด 3 วิดีโอ   | `BYTEPLUS_API_KEY`                       |
| ComfyUI               | `workflow`                     | ใช่     | 1 ภาพ                                                | ไม่               | `COMFY_API_KEY` หรือ `COMFY_CLOUD_API_KEY` |
| fal                   | `fal-ai/minimax/video-01-live` | ใช่     | 1 ภาพ                                                | ไม่               | `FAL_KEY`                                |
| Google                | `veo-3.1-fast-generate-preview` | ใช่    | 1 ภาพ                                                | 1 วิดีโอ         | `GEMINI_API_KEY`                         |
| MiniMax               | `MiniMax-Hailuo-2.3`           | ใช่     | 1 ภาพ                                                | ไม่               | `MINIMAX_API_KEY`                        |
| OpenAI                | `sora-2`                       | ใช่     | 1 ภาพ                                                | 1 วิดีโอ         | `OPENAI_API_KEY`                         |
| Qwen                  | `wan2.6-t2v`                   | ใช่     | ใช่ (remote URL)                                     | ใช่ (remote URL) | `QWEN_API_KEY`                           |
| Runway                | `gen4.5`                       | ใช่     | 1 ภาพ                                                | 1 วิดีโอ         | `RUNWAYML_API_SECRET`                    |
| Together              | `Wan-AI/Wan2.2-T2V-A14B`       | ใช่     | 1 ภาพ                                                | ไม่               | `TOGETHER_API_KEY`                       |
| Vydra                 | `veo3`                         | ใช่     | 1 ภาพ (`kling`)                                      | ไม่               | `VYDRA_API_KEY`                          |
| xAI                   | `grok-imagine-video`           | ใช่     | 1 ภาพ                                                | 1 วิดีโอ         | `XAI_API_KEY`                            |

ผู้ให้บริการบางรายยอมรับ env vars สำหรับคีย์ API เพิ่มเติมหรือทางเลือกอื่น โปรดดู [หน้าของ provider](#related) แต่ละรายสำหรับรายละเอียด

รัน `video_generate action=list` เพื่อตรวจสอบ providers, models และ
runtime modes ที่พร้อมใช้งานจริงระหว่างรันไทม์

### เมทริกซ์ความสามารถที่ประกาศไว้

นี่คือสัญญาโหมดแบบชัดเจนที่ใช้โดย `video_generate`, contract tests
และ shared live sweep

| Provider | `generate` | `imageToVideo` | `videoToVideo` | shared live lanes ปัจจุบัน                                                                                                              |
| -------- | ---------- | -------------- | -------------- | ---------------------------------------------------------------------------------------------------------------------------------------- |
| Alibaba  | ใช่        | ใช่            | ใช่            | `generate`, `imageToVideo`; ข้าม `videoToVideo` เพราะ provider นี้ต้องใช้ remote `http(s)` video URLs                               |
| BytePlus | ใช่        | ใช่            | ไม่            | `generate`, `imageToVideo`                                                                                                               |
| ComfyUI  | ใช่        | ใช่            | ไม่            | ไม่อยู่ใน shared sweep; ความครอบคลุมเฉพาะ workflow อยู่กับการทดสอบของ Comfy                                                           |
| fal      | ใช่        | ใช่            | ไม่            | `generate`, `imageToVideo`                                                                                                               |
| Google   | ใช่        | ใช่            | ใช่            | `generate`, `imageToVideo`; shared `videoToVideo` ถูกข้ามเพราะ Gemini/Veo sweep แบบ buffer-backed ปัจจุบันไม่รับอินพุตนั้น        |
| MiniMax  | ใช่        | ใช่            | ไม่            | `generate`, `imageToVideo`                                                                                                               |
| OpenAI   | ใช่        | ใช่            | ใช่            | `generate`, `imageToVideo`; shared `videoToVideo` ถูกข้ามเพราะเส้นทาง org/input นี้ปัจจุบันต้องใช้ provider-side inpaint/remix access |
| Qwen     | ใช่        | ใช่            | ใช่            | `generate`, `imageToVideo`; ข้าม `videoToVideo` เพราะ provider นี้ต้องใช้ remote `http(s)` video URLs                               |
| Runway   | ใช่        | ใช่            | ใช่            | `generate`, `imageToVideo`; `videoToVideo` จะรันก็ต่อเมื่อโมเดลที่เลือกคือ `runway/gen4_aleph`                                      |
| Together | ใช่        | ใช่            | ไม่            | `generate`, `imageToVideo`                                                                                                               |
| Vydra    | ใช่        | ใช่            | ไม่            | `generate`; shared `imageToVideo` ถูกข้ามเพราะ `veo3` แบบ bundled รองรับเฉพาะข้อความ และ `kling` แบบ bundled ต้องใช้ remote image URL |
| xAI      | ใช่        | ใช่            | ใช่            | `generate`, `imageToVideo`; `videoToVideo` ถูกข้ามเพราะ provider นี้ปัจจุบันต้องใช้ remote MP4 URL                                |

## พารามิเตอร์ของเครื่องมือ

### จำเป็น

| พารามิเตอร์ | ชนิด  | คำอธิบาย                                                                 |
| ----------- | ----- | ------------------------------------------------------------------------ |
| `prompt`    | string | คำอธิบายข้อความของวิดีโอที่จะสร้าง (จำเป็นสำหรับ `action: "generate"`) |

### อินพุตของเนื้อหา

| พารามิเตอร์  | ชนิด     | คำอธิบาย                                                                                                                            |
| ------------ | -------- | -------------------------------------------------------------------------------------------------------------------------------------- |
| `image`      | string   | ภาพอ้างอิงเดี่ยว (พาธหรือ URL)                                                                                                       |
| `images`     | string[] | ภาพอ้างอิงหลายภาพ (สูงสุด 9)                                                                                                         |
| `imageRoles` | string[] | คำใบ้ role ต่อแต่ละตำแหน่งแบบไม่บังคับ ซึ่งขนานกับรายการภาพรวม ค่า canonical คือ `first_frame`, `last_frame`, `reference_image` |
| `video`      | string   | วิดีโออ้างอิงเดี่ยว (พาธหรือ URL)                                                                                                     |
| `videos`     | string[] | วิดีโออ้างอิงหลายรายการ (สูงสุด 4)                                                                                                    |
| `videoRoles` | string[] | คำใบ้ role ต่อแต่ละตำแหน่งแบบไม่บังคับ ซึ่งขนานกับรายการวิดีโอรวม ค่า canonical คือ `reference_video`                              |
| `audioRef`   | string   | เสียงอ้างอิงเดี่ยว (พาธหรือ URL) ใช้สำหรับเช่น ดนตรีพื้นหลังหรือเสียงอ้างอิง เมื่อ provider รองรับอินพุตเสียง                      |
| `audioRefs`  | string[] | เสียงอ้างอิงหลายรายการ (สูงสุด 3)                                                                                                     |
| `audioRoles` | string[] | คำใบ้ role ต่อแต่ละตำแหน่งแบบไม่บังคับ ซึ่งขนานกับรายการเสียงรวม ค่า canonical คือ `reference_audio`                              |

คำใบ้ role จะถูกส่งต่อไปยัง provider ตามที่เป็นอยู่ ค่า canonical มาจาก
union `VideoGenerationAssetRole` แต่ providers อาจยอมรับ
สตริง role เพิ่มเติมได้เช่นกัน อาร์เรย์ `*Roles` ต้องมีจำนวนรายการไม่มากกว่า
รายการอ้างอิงที่สอดคล้องกัน ความผิดพลาดแบบ off-by-one จะล้มเหลวพร้อมข้อผิดพลาดที่ชัดเจน
ใช้สตริงว่างเพื่อปล่อยให้ช่องนั้นไม่ถูกตั้งค่า

### ตัวควบคุมสไตล์

| พารามิเตอร์      | ชนิด    | คำอธิบาย                                                                                  |
| ---------------- | ------- | ------------------------------------------------------------------------------------------ |
| `aspectRatio`    | string  | `1:1`, `2:3`, `3:2`, `3:4`, `4:3`, `4:5`, `5:4`, `9:16`, `16:9`, `21:9` หรือ `adaptive` |
| `resolution`     | string  | `480P`, `720P`, `768P` หรือ `1080P`                                                        |
| `durationSeconds` | number | ระยะเวลาที่ต้องการเป็นวินาที (จะปัดเป็นค่าที่ใกล้ที่สุดที่ provider รองรับ)              |
| `size`           | string  | คำใบ้เรื่องขนาดเมื่อ provider รองรับ                                                      |
| `audio`          | boolean | เปิดใช้เสียงที่สร้างในเอาต์พุตเมื่อรองรับ แยกจาก `audioRef*` (อินพุต)                    |
| `watermark`      | boolean | สลับการใส่ลายน้ำของ provider เมื่อรองรับ                                                   |

`adaptive` เป็น sentinel เฉพาะของ provider: จะถูกส่งต่อไปตามเดิมให้กับ
providers ที่ประกาศ `adaptive` ใน capabilities ของตน (เช่น BytePlus
Seedance ใช้มันเพื่อตรวจจับอัตราส่วนจากมิติของภาพอินพุตโดยอัตโนมัติ) providers ที่ไม่ได้ประกาศค่านี้จะส่งค่านี้ผ่าน
`details.ignoredOverrides` ในผลลัพธ์ของเครื่องมือ เพื่อให้เห็นได้ว่าค่านั้นถูกละทิ้ง

### ขั้นสูง

| พารามิเตอร์      | ชนิด   | คำอธิบาย                                                                                                                                                                                                                                                                                                                                 |
| ---------------- | ------ | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `action`         | string | `"generate"` (ค่าเริ่มต้น), `"status"` หรือ `"list"`                                                                                                                                                                                                                                                                                   |
| `model`          | string | override provider/model (เช่น `runway/gen4.5`)                                                                                                                                                                                                                                                                                          |
| `filename`       | string | คำใบ้ชื่อไฟล์เอาต์พุต                                                                                                                                                                                                                                                                                                                   |
| `timeoutMs`      | number | เวลาหมดเขตของคำขอไปยัง provider เป็นมิลลิวินาทีแบบไม่บังคับ                                                                                                                                                                                                                                                                            |
| `providerOptions` | object | ตัวเลือกเฉพาะ provider ในรูปแบบอ็อบเจ็กต์ JSON (เช่น `{"seed": 42, "draft": true}`) providers ที่ประกาศ schema แบบมีชนิดจะตรวจสอบคีย์และชนิดของค่า; คีย์ที่ไม่รู้จักหรือชนิดไม่ตรงจะทำให้ข้าม candidate นั้นระหว่าง fallback providers ที่ไม่มี schema ที่ประกาศไว้จะได้รับตัวเลือกเหล่านี้ตามที่เป็นอยู่ รัน `video_generate action=list` เพื่อดูว่าแต่ละ provider ยอมรับอะไรบ้าง |

ไม่ใช่ทุก provider ที่รองรับทุกพารามิเตอร์ OpenClaw จะทำ normalization ระยะเวลาเป็นค่าที่ใกล้ที่สุดที่ provider รองรับให้อยู่แล้ว และยัง remap คำใบ้ทางเรขาคณิตที่ถูกแปลแล้ว เช่น size-to-aspect-ratio เมื่อ fallback provider เปิดเผยพื้นผิวการควบคุมที่ต่างออกไป ส่วน overrides ที่ไม่รองรับจริง ๆ จะถูกละเลยในลักษณะ best-effort และรายงานเป็นคำเตือนในผลลัพธ์ของเครื่องมือ ข้อจำกัดความสามารถแบบ hard limit (เช่น มีอินพุตอ้างอิงมากเกินไป) จะล้มเหลวก่อนส่งคำขอ

ผลลัพธ์ของเครื่องมือจะรายงานการตั้งค่าที่ถูกใช้ เมื่อ OpenClaw ทำการ remap ระยะเวลาหรือเรขาคณิตระหว่าง provider fallback ค่า `durationSeconds`, `size`, `aspectRatio` และ `resolution` ที่ส่งกลับจะสะท้อนสิ่งที่ถูกส่งจริง และ `details.normalization` จะบันทึกการแปลจากค่าที่ร้องขอไปยังค่าที่ถูกใช้

อินพุตอ้างอิงยังใช้เลือกโหมดรันไทม์ด้วย:

- ไม่มีสื่ออ้างอิง: `generate`
- มีภาพอ้างอิงใด ๆ: `imageToVideo`
- มีวิดีโออ้างอิงใด ๆ: `videoToVideo`
- อินพุตเสียงอ้างอิงไม่เปลี่ยนโหมดที่ resolve แล้ว; มันจะถูกใช้ซ้อนทับบนโหมดที่ภาพ/วิดีโออ้างอิงเลือกไว้ และใช้ได้เฉพาะกับ providers ที่ประกาศ `maxInputAudios`

การผสมภาพและวิดีโออ้างอิงไม่ใช่พื้นผิวความสามารถแบบใช้ร่วมกันที่เสถียร
ควรใช้ชนิดอ้างอิงเพียงแบบเดียวต่อคำขอ

#### Fallback และตัวเลือกแบบมีชนิด

การตรวจสอบความสามารถบางอย่างจะถูกใช้ที่ชั้น fallback แทนที่จะเป็นที่
ขอบเขตของเครื่องมือ เพื่อให้คำขอที่เกินขีดจำกัดของ provider หลัก
ยังสามารถรันบน fallback ที่รองรับได้:

- หาก candidate ที่ใช้งานอยู่ไม่ได้ประกาศ `maxInputAudios` (หรือประกาศเป็น
  `0`) candidate นั้นจะถูกข้ามเมื่อคำขอมี audio references และจะลอง
  candidate ถัดไป
- หาก `maxDurationSeconds` ของ candidate ที่ใช้งานอยู่ต่ำกว่า
  `durationSeconds` ที่ร้องขอ และ candidate ไม่ได้ประกาศรายการ
  `supportedDurationSeconds` candidate นั้นจะถูกข้าม
- หากคำขอมี `providerOptions` และ candidate ที่ใช้งานอยู่
  ประกาศ schema ของ `providerOptions` แบบมีชนิดไว้อย่างชัดเจน candidate จะ
  ถูกข้ามเมื่อคีย์ที่ส่งมาไม่อยู่ใน schema หรือชนิดของค่าไม่ตรง
  providers ที่ยังไม่ได้ประกาศ schema จะได้รับ options ตามที่เป็นอยู่
  (pass-through ที่เข้ากันได้ย้อนหลัง) provider หนึ่งสามารถ
  เลือกไม่รับ provider options ทั้งหมดได้อย่างชัดเจนโดยประกาศ schema ว่าง
  (`capabilities.providerOptions: {}`) ซึ่งจะทำให้เกิดการข้ามแบบเดียวกับ
  การไม่ตรงชนิด

เหตุผลการข้ามครั้งแรกในคำขอจะถูก log ที่ระดับ `warn` เพื่อให้ผู้ดูแลระบบเห็นว่า
provider หลักของตนถูกข้ามเมื่อใด; การข้ามครั้งต่อ ๆ ไปจะ log ที่
`debug` เพื่อให้ fallback chains ยาว ๆ เงียบลง หาก candidate ทุกตัวถูกข้าม
ข้อผิดพลาดแบบรวมจะรวมเหตุผลการข้ามของแต่ละตัวไว้ด้วย

## Actions

- **generate** (ค่าเริ่มต้น) -- สร้างวิดีโอจากพรอมป์ที่ให้มาและอินพุตอ้างอิงแบบไม่บังคับ
- **status** -- ตรวจสอบสถานะของ video task ที่กำลังทำงานสำหรับเซสชันปัจจุบันโดยไม่เริ่มการสร้างใหม่
- **list** -- แสดง providers, models และ capabilities ที่พร้อมใช้งาน

## การเลือกโมเดล

เมื่อสร้างวิดีโอ OpenClaw จะ resolve โมเดลตามลำดับนี้:

1. **พารามิเตอร์ `model` ของเครื่องมือ** -- หาก agent ระบุมาในการเรียก
2. **`videoGenerationModel.primary`** -- จาก config
3. **`videoGenerationModel.fallbacks`** -- ลองตามลำดับ
4. **การตรวจจับอัตโนมัติ** -- ใช้ providers ที่มี auth ถูกต้อง โดยเริ่มจาก provider เริ่มต้นปัจจุบัน จากนั้นจึง providers ที่เหลือตามลำดับตัวอักษร

หาก provider ล้มเหลว candidate ถัดไปจะถูกลองโดยอัตโนมัติ หากทุก candidate ล้มเหลว ข้อผิดพลาดจะมีรายละเอียดจากทุก attempt

ตั้งค่า `agents.defaults.mediaGenerationAutoProviderFallback: false` หากคุณต้องการให้
การสร้างวิดีโอใช้เฉพาะรายการ `model`, `primary` และ `fallbacks`
ที่ระบุไว้อย่างชัดเจนเท่านั้น

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

## หมายเหตุของ provider

<AccordionGroup>
  <Accordion title="Alibaba">
    ใช้ endpoint แบบ async ของ DashScope / Model Studio ภาพและวิดีโออ้างอิงต้องเป็น remote `http(s)` URLs
  </Accordion>

  <Accordion title="BytePlus (1.0)">
    provider id: `byteplus`

    โมเดล: `seedance-1-0-pro-250528` (ค่าเริ่มต้น), `seedance-1-0-pro-t2v-250528`, `seedance-1-0-pro-fast-251015`, `seedance-1-0-lite-t2v-250428`, `seedance-1-0-lite-i2v-250428`

    โมเดล T2V (`*-t2v-*`) ไม่รับอินพุตภาพ; โมเดล I2V และโมเดลทั่วไป `*-pro-*` รองรับภาพอ้างอิงหนึ่งภาพ (เฟรมแรก) ส่งภาพตามตำแหน่งหรือกำหนด `role: "first_frame"` โมเดล T2V IDs จะถูกสลับอัตโนมัติไปยังรุ่น I2V ที่สอดคล้องกันเมื่อมีการส่งภาพมา

    คีย์ `providerOptions` ที่รองรับ: `seed` (number), `draft` (boolean — บังคับ 480p), `camera_fixed` (boolean)

  </Accordion>

  <Accordion title="BytePlus Seedance 1.5">
    ต้องใช้ plugin [`@openclaw/byteplus-modelark`](https://www.npmjs.com/package/@openclaw/byteplus-modelark) provider id: `byteplus-seedance15` โมเดล: `seedance-1-5-pro-251215`

    ใช้ API `content[]` แบบรวม รองรับภาพอินพุตได้สูงสุด 2 ภาพ (`first_frame` + `last_frame`) อินพุตทั้งหมดต้องเป็น remote `https://` URLs กำหนด `role: "first_frame"` / `"last_frame"` ให้แต่ละภาพ หรือส่งภาพตามตำแหน่ง

    `aspectRatio: "adaptive"` จะตรวจจับอัตราส่วนจากภาพอินพุตอัตโนมัติ `audio: true` จะถูกแมปไปเป็น `generate_audio` และ `providerOptions.seed` (number) จะถูกส่งต่อ

  </Accordion>

  <Accordion title="BytePlus Seedance 2.0">
    ต้องใช้ plugin [`@openclaw/byteplus-modelark`](https://www.npmjs.com/package/@openclaw/byteplus-modelark) provider id: `byteplus-seedance2` โมเดล: `dreamina-seedance-2-0-260128`, `dreamina-seedance-2-0-fast-260128`

    ใช้ API `content[]` แบบรวม รองรับภาพอ้างอิงได้สูงสุด 9 ภาพ วิดีโออ้างอิง 3 รายการ และเสียงอ้างอิง 3 รายการ อินพุตทั้งหมดต้องเป็น remote `https://` URLs กำหนด `role` ให้แต่ละ asset — ค่าที่รองรับคือ `"first_frame"`, `"last_frame"`, `"reference_image"`, `"reference_video"`, `"reference_audio"`

    `aspectRatio: "adaptive"` จะตรวจจับอัตราส่วนจากภาพอินพุตอัตโนมัติ `audio: true` จะถูกแมปไปเป็น `generate_audio` และ `providerOptions.seed` (number) จะถูกส่งต่อ

  </Accordion>

  <Accordion title="ComfyUI">
    การทำงานแบบ local หรือ cloud ที่ขับเคลื่อนด้วย workflow รองรับ text-to-video และ image-to-video ผ่านกราฟที่กำหนดค่าไว้
  </Accordion>

  <Accordion title="fal">
    ใช้โฟลว์แบบมีคิวรองรับงานที่ใช้เวลานาน รองรับภาพอ้างอิงเดี่ยวเท่านั้น
  </Accordion>

  <Accordion title="Google (Gemini / Veo)">
    รองรับภาพอ้างอิงหนึ่งภาพหรือวิดีโออ้างอิงหนึ่งรายการ
  </Accordion>

  <Accordion title="MiniMax">
    รองรับภาพอ้างอิงเดี่ยวเท่านั้น
  </Accordion>

  <Accordion title="OpenAI">
    ส่งต่อเฉพาะ override ของ `size` เท่านั้น ส่วน style overrides อื่น (`aspectRatio`, `resolution`, `audio`, `watermark`) จะถูกละเลยพร้อมคำเตือน
  </Accordion>

  <Accordion title="Qwen">
    ใช้แบ็กเอนด์ DashScope เดียวกับ Alibaba อินพุตอ้างอิงต้องเป็น remote `http(s)` URLs; ไฟล์ในเครื่องจะถูกปฏิเสธตั้งแต่ต้น
  </Accordion>

  <Accordion title="Runway">
    รองรับไฟล์ในเครื่องผ่าน data URIs สำหรับ video-to-video ต้องใช้ `runway/gen4_aleph` การรันแบบข้อความล้วนเปิดเผยอัตราส่วน `16:9` และ `9:16`
  </Accordion>

  <Accordion title="Together">
    รองรับภาพอ้างอิงเดี่ยวเท่านั้น
  </Accordion>

  <Accordion title="Vydra">
    ใช้ `https://www.vydra.ai/api/v1` โดยตรงเพื่อหลีกเลี่ยง redirects ที่ทำ auth หาย `veo3` ที่ bundled มาให้รองรับเฉพาะ text-to-video; `kling` ต้องใช้ remote image URL
  </Accordion>

  <Accordion title="xAI">
    รองรับ text-to-video, image-to-video และโฟลว์ remote video edit/extend
  </Accordion>
</AccordionGroup>

## โหมดความสามารถของ provider

สัญญาการสร้างวิดีโอแบบใช้ร่วมกันตอนนี้ทำให้ providers สามารถประกาศ
capabilities แบบเฉพาะโหมดได้ แทนที่จะมีเพียงข้อจำกัดรวมแบบแบน
implementation ของ provider ใหม่ควรเลือกใช้บล็อกโหมดแบบชัดเจน:

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

ฟิลด์รวมแบบแบนอย่าง `maxInputImages` และ `maxInputVideos` เพียงอย่างเดียว
ไม่เพียงพอสำหรับการประกาศการรองรับ transform-mode providers ควรประกาศ
`generate`, `imageToVideo` และ `videoToVideo` อย่างชัดเจน เพื่อให้ live tests,
contract tests และเครื่องมือ `video_generate` แบบใช้ร่วมกันสามารถตรวจสอบการรองรับโหมดได้
อย่างกำหนดแน่ชัด

## การทดสอบแบบ live

ความครอบคลุมแบบ live ที่เปิดใช้เมื่อเลือกเองสำหรับ bundled providers แบบใช้ร่วมกัน:

```bash
OPENCLAW_LIVE_TEST=1 pnpm test:live -- extensions/video-generation-providers.live.test.ts
```

wrapper ของรีโป:

```bash
pnpm test:live:media video
```

ไฟล์ live นี้จะโหลด provider env vars ที่ขาดหายจาก `~/.profile`, เลือก
คีย์ API แบบ live/env ก่อน stored auth profiles โดยค่าเริ่มต้น และรัน smoke แบบปลอดภัยต่อรีลีสเป็นค่าเริ่มต้น:

- `generate` สำหรับทุก provider ที่ไม่ใช่ FAL ใน sweep
- พรอมป์ lobster ความยาวหนึ่งวินาที
- ขีดจำกัดการทำงานต่อ provider จาก `OPENCLAW_LIVE_VIDEO_GENERATION_TIMEOUT_MS`
  (`180000` โดยค่าเริ่มต้น)

FAL เป็นแบบเลือกใช้ เนื่องจาก latency จากคิวฝั่ง provider อาจกลายเป็นปัจจัยหลักของเวลารีลีส:

```bash
pnpm test:live:media video --video-providers fal
```

ตั้งค่า `OPENCLAW_LIVE_VIDEO_GENERATION_FULL_MODES=1` เพื่อรัน transform
modes ที่ประกาศไว้เพิ่มเติม ซึ่ง shared sweep สามารถทดสอบได้อย่างปลอดภัยด้วยสื่อในเครื่อง:

- `imageToVideo` เมื่อ `capabilities.imageToVideo.enabled`
- `videoToVideo` เมื่อ `capabilities.videoToVideo.enabled` และ provider/model
  รับอินพุตวิดีโอในเครื่องแบบ buffer-backed ได้ใน shared sweep

ปัจจุบัน live lane ของ `videoToVideo` แบบใช้ร่วมกันครอบคลุม:

- `runway` เฉพาะเมื่อคุณเลือก `runway/gen4_aleph`

## การตั้งค่า

ตั้งค่าโมเดลเริ่มต้นสำหรับการสร้างวิดีโอใน config ของ OpenClaw:

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

- [ภาพรวมเครื่องมือ](/th/tools)
- [งานเบื้องหลัง](/th/automation/tasks) -- การติดตาม task สำหรับการสร้างวิดีโอแบบอะซิงโครนัส
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
- [เอกสารอ้างอิงการตั้งค่า](/th/gateway/config-agents#agent-defaults)
- [โมเดล](/th/concepts/models)
