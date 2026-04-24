---
read_when:
    - การสร้างเพลงหรือเสียงผ่านเอเจนต์
    - การกำหนดค่าผู้ให้บริการและโมเดลสำหรับการสร้างเพลง
    - การทำความเข้าใจพารามิเตอร์ของเครื่องมือ `music_generate`
summary: สร้างเพลงด้วยผู้ให้บริการแบบใช้ร่วมกัน รวมถึง Plugin ที่มี workflow หนุนหลัง
title: การสร้างเพลง
x-i18n:
    generated_at: "2026-04-24T09:37:47Z"
    model: gpt-5.4
    provider: openai
    source_hash: c5fe640c6b83f6f2cf5ad8e57294da147f241706c30eee0d0eb6f7d82cbbe0d3
    source_path: tools/music-generation.md
    workflow: 15
---

เครื่องมือ `music_generate` ช่วยให้เอเจนต์สร้างเพลงหรือเสียงผ่าน
capability การสร้างเพลงแบบใช้ร่วมกัน โดยใช้ผู้ให้บริการที่กำหนดค่าไว้ เช่น Google,
MiniMax และ ComfyUI ที่กำหนดค่าผ่าน workflow

สำหรับเซสชันเอเจนต์ที่ทำงานบนผู้ให้บริการแบบใช้ร่วมกัน OpenClaw จะเริ่มงานสร้างเพลงเป็น
งานเบื้องหลัง ติดตามงานนั้นใน task ledger จากนั้นปลุกเอเจนต์อีกครั้งเมื่อเพลงพร้อม
เพื่อให้เอเจนต์โพสต์ไฟล์เสียงที่เสร็จแล้วกลับเข้าไปใน channel เดิม

<Note>
เครื่องมือแบบใช้ร่วมกันที่มีมาให้จะแสดงเฉพาะเมื่อมีผู้ให้บริการการสร้างเพลงอย่างน้อยหนึ่งรายพร้อมใช้งาน หากคุณไม่เห็น `music_generate` ในเครื่องมือของเอเจนต์ ให้กำหนดค่า `agents.defaults.musicGenerationModel` หรือตั้งค่า API key ของผู้ให้บริการ
</Note>

## เริ่มต้นอย่างรวดเร็ว

### การสร้างแบบมีผู้ให้บริการแบบใช้ร่วมกันหนุนหลัง

1. ตั้งค่า API key สำหรับผู้ให้บริการอย่างน้อยหนึ่งราย เช่น `GEMINI_API_KEY` หรือ
   `MINIMAX_API_KEY`
2. จะตั้งค่าโมเดลที่ต้องการไว้ก็ได้:

```json5
{
  agents: {
    defaults: {
      musicGenerationModel: {
        primary: "google/lyria-3-clip-preview",
      },
    },
  },
}
```

3. บอกเอเจนต์ว่า: _"Generate an upbeat synthpop track about a night drive
   through a neon city."_

เอเจนต์จะเรียก `music_generate` โดยอัตโนมัติ ไม่ต้องเพิ่มลง allowlist ของเครื่องมือ

สำหรับบริบทแบบ synchronous โดยตรงที่ไม่มีการรันของเอเจนต์แบบมีเซสชันหนุนหลัง
เครื่องมือที่มีมาให้ก็ยังคง fallback ไปเป็นการสร้างแบบ inline และส่งกลับพาธของสื่อสุดท้ายในผลลัพธ์ของเครื่องมือ

ตัวอย่างพรอมป์ต์:

```text
Generate a cinematic piano track with soft strings and no vocals.
```

```text
Generate an energetic chiptune loop about launching a rocket at sunrise.
```

### การสร้างผ่าน Comfy ที่ขับเคลื่อนด้วย workflow

Plugin `comfy` แบบ bundled เชื่อมต่อเข้ากับเครื่องมือ `music_generate` แบบใช้ร่วมกันผ่าน
รีจิสทรีผู้ให้บริการการสร้างเพลง

1. กำหนดค่า `models.providers.comfy.music` ด้วย workflow JSON และ
   prompt/output node
2. หากคุณใช้ Comfy Cloud ให้ตั้งค่า `COMFY_API_KEY` หรือ `COMFY_CLOUD_API_KEY`
3. ขอให้เอเจนต์สร้างเพลงหรือเรียกเครื่องมือโดยตรง

ตัวอย่าง:

```text
/tool music_generate prompt="Warm ambient synth loop with soft tape texture"
```

## การรองรับผู้ให้บริการแบบ bundled ที่ใช้ร่วมกัน

| ผู้ให้บริการ | โมเดลเริ่มต้น            | อินพุตอ้างอิง      | ตัวควบคุมที่รองรับ                                      | API key                                |
| ------------ | ------------------------ | ------------------ | ------------------------------------------------------- | -------------------------------------- |
| ComfyUI      | `workflow`               | ภาพสูงสุด 1 ภาพ    | เพลงหรือเสียงตามที่ workflow กำหนด                      | `COMFY_API_KEY`, `COMFY_CLOUD_API_KEY` |
| Google       | `lyria-3-clip-preview`   | ภาพสูงสุด 10 ภาพ   | `lyrics`, `instrumental`, `format`                      | `GEMINI_API_KEY`, `GOOGLE_API_KEY`     |
| MiniMax      | `music-2.5+`             | ไม่มี               | `lyrics`, `instrumental`, `durationSeconds`, `format=mp3` | `MINIMAX_API_KEY`                    |

### เมทริกซ์ capability ที่ประกาศไว้

นี่คือสัญญาโหมดแบบชัดเจนที่ใช้โดย `music_generate`, การทดสอบสัญญา
และชุดทดสอบ live แบบใช้ร่วมกัน

| ผู้ให้บริการ | `generate` | `edit` | ขีดจำกัดการแก้ไข | shared live lane                                                         |
| ------------ | ---------- | ------ | ----------------- | ------------------------------------------------------------------------ |
| ComfyUI      | ใช่        | ใช่    | 1 ภาพ             | ไม่รวมอยู่ใน shared sweep; ครอบคลุมโดย `extensions/comfy/comfy.live.test.ts` |
| Google       | ใช่        | ใช่    | 10 ภาพ            | `generate`, `edit`                                                       |
| MiniMax      | ใช่        | ไม่    | ไม่มี              | `generate`                                                               |

ใช้ `action: "list"` เพื่อตรวจสอบผู้ให้บริการและโมเดลแบบใช้ร่วมกันที่พร้อมใช้งาน
ในเวลารันจริง:

```text
/tool music_generate action=list
```

ใช้ `action: "status"` เพื่อตรวจสอบงานสร้างเพลงของเซสชันที่กำลังทำงานอยู่:

```text
/tool music_generate action=status
```

ตัวอย่างการสร้างโดยตรง:

```text
/tool music_generate prompt="Dreamy lo-fi hip hop with vinyl texture and gentle rain" instrumental=true
```

## พารามิเตอร์ของเครื่องมือที่มีมาให้

| พารามิเตอร์       | ชนิดข้อมูล | คำอธิบาย                                                                                     |
| ----------------- | ---------- | --------------------------------------------------------------------------------------------- |
| `prompt`          | string     | พรอมป์ต์สำหรับการสร้างเพลง (จำเป็นสำหรับ `action: "generate"`)                                |
| `action`          | string     | `"generate"` (ค่าเริ่มต้น), `"status"` สำหรับงานของเซสชันปัจจุบัน หรือ `"list"` เพื่อตรวจสอบผู้ให้บริการ |
| `model`           | string     | override ผู้ให้บริการ/โมเดล เช่น `google/lyria-3-pro-preview` หรือ `comfy/workflow`          |
| `lyrics`          | string     | เนื้อเพลงแบบไม่บังคับ เมื่อผู้ให้บริการรองรับการป้อนเนื้อเพลงโดยตรง                           |
| `instrumental`    | boolean    | ขอเอาต์พุตแบบดนตรีล้วนเมื่อผู้ให้บริการรองรับ                                                |
| `image`           | string     | พาธหรือ URL ของภาพอ้างอิงเดี่ยว                                                               |
| `images`          | string[]   | ภาพอ้างอิงหลายภาพ (สูงสุด 10 ภาพ)                                                             |
| `durationSeconds` | number     | ระยะเวลาเป้าหมายเป็นวินาที เมื่อผู้ให้บริการรองรับคำแนะนำเรื่องระยะเวลา                        |
| `timeoutMs`       | number     | เวลา timeout ของคำขอผู้ให้บริการเป็นมิลลิวินาทีแบบไม่บังคับ                                  |
| `format`          | string     | คำแนะนำรูปแบบเอาต์พุต (`mp3` หรือ `wav`) เมื่อผู้ให้บริการรองรับ                              |
| `filename`        | string     | คำแนะนำชื่อไฟล์เอาต์พุต                                                                        |

ไม่ใช่ทุกผู้ให้บริการจะรองรับทุกพารามิเตอร์ OpenClaw ยังคงตรวจสอบขีดจำกัดแบบฮาร์ด เช่น
จำนวนอินพุต ก่อนส่งคำขอ เมื่อผู้ให้บริการรองรับระยะเวลาแต่ใช้ค่าสูงสุดที่สั้นกว่าค่าที่ร้องขอ
OpenClaw จะ clamp ให้ใกล้ค่าที่รองรับที่สุดโดยอัตโนมัติ ส่วน hint แบบไม่บังคับที่ไม่รองรับจริง
จะถูกละเลยพร้อมคำเตือนเมื่อผู้ให้บริการหรือโมเดลที่เลือกไม่สามารถรองรับได้

ผลลัพธ์ของเครื่องมือจะรายงานค่าที่ถูกนำไปใช้ เมื่อ OpenClaw clamp ระยะเวลาระหว่าง fallback ของผู้ให้บริการ ค่า `durationSeconds` ที่ส่งกลับจะสะท้อนค่าที่ส่งไปจริง และ `details.normalization.durationSeconds` จะแสดงการแมประหว่างค่าที่ร้องขอกับค่าที่ถูกนำไปใช้

## พฤติกรรมแบบ async สำหรับเส้นทางที่มีผู้ให้บริการแบบใช้ร่วมกันหนุนหลัง

- การรันเอเจนต์แบบมีเซสชันหนุนหลัง: `music_generate` จะสร้างงานเบื้องหลัง ส่งกลับผลลัพธ์แบบ started/task ทันที และโพสต์เพลงที่เสร็จแล้วในข้อความติดตามผลจากเอเจนต์ภายหลัง
- การป้องกันงานซ้ำ: ขณะที่งานเบื้องหลังนั้นยังเป็น `queued` หรือ `running`, การเรียก `music_generate` ครั้งถัดไปในเซสชันเดียวกันจะส่งกลับสถานะของงานแทนที่จะเริ่มการสร้างใหม่อีกครั้ง
- การดูสถานะ: ใช้ `action: "status"` เพื่อตรวจสอบงานสร้างเพลงของเซสชันที่กำลังทำงานอยู่โดยไม่เริ่มงานใหม่
- การติดตามงาน: ใช้ `openclaw tasks list` หรือ `openclaw tasks show <taskId>` เพื่อตรวจสอบสถานะ queued, running และ terminal ของการสร้าง
- การปลุกเมื่อเสร็จ: OpenClaw จะ inject event ภายในเมื่อการสร้างเสร็จกลับเข้าไปในเซสชันเดิม เพื่อให้โมเดลสามารถเขียนข้อความติดตามผลที่ผู้ใช้มองเห็นได้ด้วยตัวเอง
- Prompt hint: เทิร์นของผู้ใช้/แบบแมนนวลในภายหลังภายในเซสชันเดียวกันจะได้รับ hint ของรันไทม์เล็กน้อยเมื่อมีงานเพลงกำลังทำงานอยู่ เพื่อไม่ให้โมเดลเรียก `music_generate` ซ้ำแบบไม่รู้ตัว
- fallback เมื่อไม่มีเซสชัน: บริบทแบบตรง/ภายในเครื่องที่ไม่มีเซสชันเอเจนต์จริงจะยังคงรันแบบ inline และส่งกลับผลลัพธ์เสียงสุดท้ายในเทิร์นเดียวกัน

### วงจรชีวิตของงาน

คำขอ `music_generate` แต่ละรายการจะเคลื่อนผ่าน 4 สถานะ:

1. **queued** -- งานถูกสร้างแล้ว กำลังรอให้ผู้ให้บริการรับงาน
2. **running** -- ผู้ให้บริการกำลังประมวลผล (โดยทั่วไปใช้เวลา 30 วินาทีถึง 3 นาที ขึ้นอยู่กับผู้ให้บริการและระยะเวลา)
3. **succeeded** -- เพลงพร้อมแล้ว; เอเจนต์จะตื่นขึ้นและโพสต์เพลงลงในการสนทนา
4. **failed** -- ผู้ให้บริการเกิดข้อผิดพลาดหรือ timeout; เอเจนต์จะตื่นขึ้นพร้อมรายละเอียดข้อผิดพลาด

ตรวจสอบสถานะจาก CLI:

```bash
openclaw tasks list
openclaw tasks show <taskId>
openclaw tasks cancel <taskId>
```

การป้องกันงานซ้ำ: หากมีงานเพลงที่เป็น `queued` หรือ `running` อยู่แล้วสำหรับเซสชันปัจจุบัน `music_generate` จะส่งกลับสถานะของงานเดิมแทนที่จะเริ่มงานใหม่ ใช้ `action: "status"` เพื่อตรวจสอบอย่างชัดเจนโดยไม่กระตุ้นให้เกิดการสร้างใหม่

## การกำหนดค่า

### การเลือกโมเดล

```json5
{
  agents: {
    defaults: {
      musicGenerationModel: {
        primary: "google/lyria-3-clip-preview",
        fallbacks: ["minimax/music-2.5+"],
      },
    },
  },
}
```

### ลำดับการเลือกผู้ให้บริการ

เมื่อสร้างเพลง OpenClaw จะลองผู้ให้บริการตามลำดับนี้:

1. พารามิเตอร์ `model` จากการเรียกเครื่องมือ หากเอเจนต์ระบุไว้
2. `musicGenerationModel.primary` จากคอนฟิก
3. `musicGenerationModel.fallbacks` ตามลำดับ
4. การตรวจจับอัตโนมัติโดยใช้เฉพาะค่าเริ่มต้นของผู้ให้บริการที่มี auth หนุนหลัง:
   - ผู้ให้บริการเริ่มต้นปัจจุบันก่อน
   - ผู้ให้บริการการสร้างเพลงที่ลงทะเบียนที่เหลือตามลำดับ provider id

หากผู้ให้บริการรายหนึ่งล้มเหลว ระบบจะลองตัวเลือกถัดไปโดยอัตโนมัติ หากทุกตัวล้มเหลว
ข้อผิดพลาดจะรวมรายละเอียดจากแต่ละความพยายาม

ตั้งค่า `agents.defaults.mediaGenerationAutoProviderFallback: false` หากคุณต้องการให้
การสร้างเพลงใช้เฉพาะ `model`, `primary` และ `fallbacks` ที่ระบุไว้อย่างชัดเจนเท่านั้น

## หมายเหตุเกี่ยวกับผู้ให้บริการ

- Google ใช้การสร้างแบบ batch ของ Lyria 3 ปัจจุบัน flow แบบ bundled รองรับ
  prompt, ข้อความ lyrics แบบไม่บังคับ และภาพอ้างอิงแบบไม่บังคับ
- MiniMax ใช้ปลายทาง batch `music_generation` ปัจจุบัน flow แบบ bundled
  รองรับ prompt, lyrics แบบไม่บังคับ, โหมด instrumental, การกำหนดระยะเวลา และ
  เอาต์พุต mp3
- การรองรับ ComfyUI ขับเคลื่อนด้วย workflow และขึ้นอยู่กับกราฟที่กำหนดค่าไว้ รวมถึง
  node mapping สำหรับฟิลด์ prompt/output

## โหมด capability ของผู้ให้บริการ

สัญญาการสร้างเพลงแบบใช้ร่วมกันตอนนี้รองรับการประกาศโหมดแบบชัดเจน:

- `generate` สำหรับการสร้างจาก prompt อย่างเดียว
- `edit` เมื่อคำขอมีภาพอ้างอิงอย่างน้อยหนึ่งภาพ

implementation ของผู้ให้บริการใหม่ควรใช้บล็อกโหมดแบบชัดเจน:

```typescript
capabilities: {
  generate: {
    maxTracks: 1,
    supportsLyrics: true,
    supportsFormat: true,
  },
  edit: {
    enabled: true,
    maxTracks: 1,
    maxInputImages: 1,
    supportsFormat: true,
  },
}
```

ฟิลด์แบบ flat รุ่นเก่า เช่น `maxInputImages`, `supportsLyrics` และ
`supportsFormat` ไม่เพียงพอสำหรับการประกาศการรองรับ `edit` ผู้ให้บริการควร
ประกาศ `generate` และ `edit` อย่างชัดเจน เพื่อให้การทดสอบ live, การทดสอบสัญญา และ
เครื่องมือ `music_generate` แบบใช้ร่วมกัน สามารถตรวจสอบการรองรับโหมดได้อย่างแน่นอน

## การเลือกเส้นทางที่เหมาะสม

- ใช้เส้นทางแบบมีผู้ให้บริการแบบใช้ร่วมกันหนุนหลัง เมื่อคุณต้องการการเลือกโมเดล, fallback ของผู้ให้บริการ และ flow task/status แบบ async ที่มีมาให้
- ใช้เส้นทางแบบ Plugin เช่น ComfyUI เมื่อต้องการกราฟ workflow แบบกำหนดเอง หรือผู้ให้บริการที่ไม่ได้เป็นส่วนหนึ่งของ capability การสร้างเพลงแบบใช้ร่วมกันที่ bundled มา
- หากคุณกำลังดีบักพฤติกรรมเฉพาะของ ComfyUI ให้ดู [ComfyUI](/th/providers/comfy) หากคุณกำลังดีบักพฤติกรรมของผู้ให้บริการแบบใช้ร่วมกัน ให้เริ่มจาก [Google (Gemini)](/th/providers/google) หรือ [MiniMax](/th/providers/minimax)

## การทดสอบแบบ live

ความครอบคลุมแบบ live ที่ต้อง opt-in สำหรับผู้ให้บริการแบบ bundled ที่ใช้ร่วมกัน:

```bash
OPENCLAW_LIVE_TEST=1 pnpm test:live -- extensions/music-generation-providers.live.test.ts
```

wrapper ระดับรีโพ:

```bash
pnpm test:live:media music
```

ไฟล์ live นี้จะโหลดตัวแปร env ของผู้ให้บริการที่ขาดหายจาก `~/.profile`, ให้ความสำคัญกับ
API key จาก live/env ก่อน auth profile ที่จัดเก็บไว้เป็นค่าเริ่มต้น และรันทั้งความครอบคลุม
`generate` และ `edit` ที่ประกาศไว้ เมื่อผู้ให้บริการเปิดโหมด edit

ปัจจุบันหมายความว่า:

- `google`: `generate` และ `edit`
- `minimax`: เฉพาะ `generate`
- `comfy`: มีความครอบคลุม live แยกของ Comfy ไม่รวมอยู่ใน shared provider sweep

ความครอบคลุมแบบ live ที่ต้อง opt-in สำหรับเส้นทางเพลง ComfyUI แบบ bundled:

```bash
OPENCLAW_LIVE_TEST=1 COMFY_LIVE_TEST=1 pnpm test:live -- extensions/comfy/comfy.live.test.ts
```

ไฟล์ live ของ Comfy ยังครอบคลุม workflow ภาพและวิดีโอของ comfy ด้วย เมื่อ
มีการกำหนดค่าส่วนเหล่านั้นไว้

## ที่เกี่ยวข้อง

- [Background Tasks](/th/automation/tasks) - การติดตามงานสำหรับการรัน `music_generate` แบบแยกออก
- [Configuration Reference](/th/gateway/config-agents#agent-defaults) - คอนฟิก `musicGenerationModel`
- [ComfyUI](/th/providers/comfy)
- [Google (Gemini)](/th/providers/google)
- [MiniMax](/th/providers/minimax)
- [Models](/th/concepts/models) - การกำหนดค่าโมเดลและ failover
- [Tools Overview](/th/tools)
