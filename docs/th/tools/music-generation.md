---
read_when:
    - การสร้างเพลงหรือเสียงผ่านเอเจนต์
    - การตั้งค่าผู้ให้บริการและโมเดลสำหรับการสร้างเพลง
    - การทำความเข้าใจพารามิเตอร์ของ tool `music_generate`
summary: สร้างเพลงด้วยผู้ให้บริการแบบใช้ร่วมกัน รวมถึง Plugin แบบ workflow-backed
title: การสร้างเพลง
x-i18n:
    generated_at: "2026-04-23T06:02:18Z"
    model: gpt-5.4
    provider: openai
    source_hash: ce8da8dfc188efe8593ca5cbec0927dd1d18d2861a1a828df89c8541ccf1cb25
    source_path: tools/music-generation.md
    workflow: 15
---

# การสร้างเพลง

tool `music_generate` ช่วยให้เอเจนต์สร้างเพลงหรือเสียงผ่านความสามารถด้านการสร้างเพลงแบบใช้ร่วมกัน โดยใช้ผู้ให้บริการที่ตั้งค่าไว้ เช่น Google,
MiniMax และ ComfyUI ที่ตั้งค่าผ่าน workflow

สำหรับเซสชันของเอเจนต์ที่มีผู้ให้บริการแบบใช้ร่วมกันรองรับ OpenClaw จะเริ่มการสร้างเพลงเป็น
งานเบื้องหลัง ติดตามมันใน task ledger แล้วปลุกเอเจนต์อีกครั้งเมื่อ
แทร็กพร้อม เพื่อให้เอเจนต์โพสต์เสียงที่เสร็จแล้วกลับเข้าไปใน
ช่องทางเดิม

<Note>
tool แบบใช้ร่วมกันที่มีมาในตัวจะปรากฏเฉพาะเมื่อมีผู้ให้บริการสำหรับการสร้างเพลงอย่างน้อยหนึ่งรายเท่านั้น หากคุณไม่เห็น `music_generate` ในรายการ tools ของเอเจนต์ ให้ตั้งค่า `agents.defaults.musicGenerationModel` หรือกำหนด API key ของผู้ให้บริการ
</Note>

## เริ่มต้นอย่างรวดเร็ว

### การสร้างแบบใช้ร่วมกันที่มีผู้ให้บริการรองรับ

1. ตั้งค่า API key สำหรับผู้ให้บริการอย่างน้อยหนึ่งราย เช่น `GEMINI_API_KEY` หรือ
   `MINIMAX_API_KEY`
2. ตั้งค่าโมเดลที่ต้องการแบบไม่บังคับ:

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

3. ขอให้เอเจนต์: _"Generate an upbeat synthpop track about a night drive
   through a neon city."_

เอเจนต์จะเรียก `music_generate` โดยอัตโนมัติ ไม่ต้องทำ allow-list สำหรับ tool

สำหรับบริบทแบบ synchronous โดยตรงที่ไม่มีการรันของเอเจนต์ที่มี session รองรับ tool ที่มีมาในตัว
ก็ยัง fallback ไปใช้การสร้างแบบ inline และคืนพาธของสื่อสุดท้ายใน
ผลลัพธ์ของ tool

ตัวอย่าง prompt:

```text
Generate a cinematic piano track with soft strings and no vocals.
```

```text
Generate an energetic chiptune loop about launching a rocket at sunrise.
```

### การสร้างแบบ workflow-driven ของ Comfy

Plugin `comfy` แบบ bundled เชื่อมเข้ากับ tool `music_generate` ที่ใช้ร่วมกัน
ผ่าน registry ของผู้ให้บริการการสร้างเพลง

1. ตั้งค่า `models.providers.comfy.music` ด้วย workflow JSON และ
   node สำหรับ prompt/output
2. หากคุณใช้ Comfy Cloud ให้ตั้ง `COMFY_API_KEY` หรือ `COMFY_CLOUD_API_KEY`
3. ขอให้เอเจนต์สร้างเพลง หรือเรียก tool โดยตรง

ตัวอย่าง:

```text
/tool music_generate prompt="Warm ambient synth loop with soft tape texture"
```

## การรองรับผู้ให้บริการแบบ bundled ที่ใช้ร่วมกัน

| ผู้ให้บริการ | โมเดลเริ่มต้น          | อินพุตอ้างอิง      | ตัวควบคุมที่รองรับ                                        | API key                                |
| ------------ | ---------------------- | ------------------ | --------------------------------------------------------- | -------------------------------------- |
| ComfyUI      | `workflow`             | สูงสุด 1 ภาพ       | เพลงหรือเสียงตามที่ workflow กำหนด                         | `COMFY_API_KEY`, `COMFY_CLOUD_API_KEY` |
| Google       | `lyria-3-clip-preview` | สูงสุด 10 ภาพ      | `lyrics`, `instrumental`, `format`                        | `GEMINI_API_KEY`, `GOOGLE_API_KEY`     |
| MiniMax      | `music-2.5+`           | ไม่มี              | `lyrics`, `instrumental`, `durationSeconds`, `format=mp3` | `MINIMAX_API_KEY`                      |

### เมทริกซ์ความสามารถที่ประกาศไว้

นี่คือสัญญาโหมดแบบ explicit ที่ใช้โดย `music_generate`, contract test
และ shared live sweep

| ผู้ให้บริการ | `generate` | `edit` | ขีดจำกัดการแก้ไข | shared live lane                                                        |
| ------------ | ---------- | ------ | ----------------- | ----------------------------------------------------------------------- |
| ComfyUI      | ใช่        | ใช่    | 1 ภาพ             | ไม่อยู่ใน shared sweep; ครอบคลุมโดย `extensions/comfy/comfy.live.test.ts` |
| Google       | ใช่        | ใช่    | 10 ภาพ            | `generate`, `edit`                                                      |
| MiniMax      | ใช่        | ไม่    | ไม่มี             | `generate`                                                              |

ใช้ `action: "list"` เพื่อตรวจสอบผู้ให้บริการและโมเดลแบบใช้ร่วมกันที่มีอยู่
ใน runtime:

```text
/tool music_generate action=list
```

ใช้ `action: "status"` เพื่อตรวจสอบงานสร้างเพลงที่มี session รองรับซึ่งกำลัง active อยู่:

```text
/tool music_generate action=status
```

ตัวอย่างการสร้างโดยตรง:

```text
/tool music_generate prompt="Dreamy lo-fi hip hop with vinyl texture and gentle rain" instrumental=true
```

## พารามิเตอร์ของ tool ที่มีมาในตัว

| พารามิเตอร์      | ชนิด     | คำอธิบาย                                                                                       |
| ---------------- | -------- | ----------------------------------------------------------------------------------------------- |
| `prompt`         | string   | prompt สำหรับการสร้างเพลง (บังคับสำหรับ `action: "generate"`)                                 |
| `action`         | string   | `"generate"` (ค่าเริ่มต้น), `"status"` สำหรับ task ของเซสชันปัจจุบัน หรือ `"list"` เพื่อตรวจสอบผู้ให้บริการ |
| `model`          | string   | override ผู้ให้บริการ/โมเดล เช่น `google/lyria-3-pro-preview` หรือ `comfy/workflow`             |
| `lyrics`         | string   | เนื้อเพลงแบบไม่บังคับ เมื่อผู้ให้บริการรองรับการป้อนเนื้อเพลงโดยตรง                            |
| `instrumental`   | boolean  | ขอเอาต์พุตแบบดนตรีล้วนเมื่อผู้ให้บริการรองรับ                                                  |
| `image`          | string   | พาธหรือ URL ของภาพอ้างอิงเดี่ยว                                                                 |
| `images`         | string[] | ภาพอ้างอิงหลายภาพ (สูงสุด 10)                                                                   |
| `durationSeconds`| number   | ระยะเวลาเป้าหมายเป็นวินาที เมื่อผู้ให้บริการรองรับการบอกใบ้เรื่องระยะเวลา                       |
| `format`         | string   | hint ของรูปแบบเอาต์พุต (`mp3` หรือ `wav`) เมื่อผู้ให้บริการรองรับ                               |
| `filename`       | string   | hint ของชื่อไฟล์เอาต์พุต                                                                         |

ไม่ใช่ทุกผู้ให้บริการจะรองรับทุกพารามิเตอร์ OpenClaw ยังคงตรวจสอบข้อจำกัดที่แน่นอน
เช่น จำนวนอินพุต ก่อนส่งคำขอ เมื่อผู้ให้บริการรองรับระยะเวลาแต่
ใช้ค่าสูงสุดที่สั้นกว่าค่าที่ร้องขอ OpenClaw จะ clamp
ไปยังระยะเวลาที่รองรับและใกล้ที่สุดโดยอัตโนมัติ ส่วน hint แบบไม่บังคับที่ไม่รองรับจริง
จะถูกเพิกเฉยพร้อมคำเตือน เมื่อผู้ให้บริการหรือโมเดลที่เลือกไม่สามารถรองรับได้

ผลลัพธ์ของ tool จะรายงานการตั้งค่าที่ถูกใช้ เมื่อ OpenClaw ทำการ clamp ระยะเวลาระหว่าง fallback ของผู้ให้บริการ `durationSeconds` ที่ส่งกลับจะสะท้อนค่าที่ถูกส่งจริง และ `details.normalization.durationSeconds` จะแสดงการแมประหว่างค่าที่ร้องขอกับค่าที่ถูกใช้จริง

## พฤติกรรมแบบ async สำหรับเส้นทางที่มีผู้ให้บริการแบบใช้ร่วมกันรองรับ

- การรันของเอเจนต์ที่มี session รองรับ: `music_generate` จะสร้างงานเบื้องหลัง ส่งคืนการตอบกลับแบบเริ่มต้นแล้ว/มี task ทันที และโพสต์แทร็กที่เสร็จแล้วภายหลังในข้อความติดตามผลของเอเจนต์
- การป้องกันการสร้างซ้ำ: ขณะที่งานเบื้องหลังนั้นยังเป็น `queued` หรือ `running`, การเรียก `music_generate` ครั้งถัดไปในเซสชันเดียวกันจะส่งคืนสถานะ task แทนการเริ่มการสร้างใหม่
- การดูสถานะ: ใช้ `action: "status"` เพื่อตรวจสอบ task สร้างเพลงที่มี session รองรับซึ่งกำลัง active อยู่ โดยไม่เริ่มการสร้างใหม่
- การติดตาม task: ใช้ `openclaw tasks list` หรือ `openclaw tasks show <taskId>` เพื่อตรวจสอบสถานะ queued, running และ terminal ของการสร้าง
- การปลุกเมื่อเสร็จสิ้น: OpenClaw จะ inject event ภายในเมื่อเสร็จสิ้นกลับเข้าไปยังเซสชันเดิม เพื่อให้โมเดลเขียนข้อความติดตามผลที่ผู้ใช้มองเห็นได้ด้วยตัวเอง
- hint ใน prompt: turn ของผู้ใช้/turn แบบ manual ที่มาภายหลังในเซสชันเดียวกันจะได้รับ runtime hint ขนาดเล็กเมื่อมี task สร้างเพลงกำลังวิ่งอยู่แล้ว เพื่อไม่ให้โมเดลเรียก `music_generate` ซ้ำอย่างมืดบอด
- fallback เมื่อไม่มีเซสชัน: บริบทแบบตรง/ภายในเครื่องที่ไม่มีเซสชันเอเจนต์จริงจะยังรันแบบ inline และคืนผลลัพธ์เสียงสุดท้ายใน turn เดียวกัน

### วงจรชีวิตของ task

คำขอ `music_generate` แต่ละรายการจะเปลี่ยนผ่าน 4 สถานะ:

1. **queued** -- สร้าง task แล้ว กำลังรอให้ผู้ให้บริการรับคำขอ
2. **running** -- ผู้ให้บริการกำลังประมวลผล (โดยทั่วไป 30 วินาทีถึง 3 นาที ขึ้นอยู่กับผู้ให้บริการและระยะเวลา)
3. **succeeded** -- แทร็กพร้อมแล้ว; เอเจนต์ถูกปลุกและโพสต์มันไปยังการสนทนา
4. **failed** -- ผู้ให้บริการส่งข้อผิดพลาดหรือหมดเวลา; เอเจนต์ถูกปลุกพร้อมรายละเอียดข้อผิดพลาด

ตรวจสอบสถานะจาก CLI:

```bash
openclaw tasks list
openclaw tasks show <taskId>
openclaw tasks cancel <taskId>
```

การป้องกันการสร้างซ้ำ: หากมี music task ที่เป็น `queued` หรือ `running` อยู่แล้วสำหรับเซสชันปัจจุบัน `music_generate` จะส่งคืนสถานะของ task เดิมแทนการเริ่มรายการใหม่ ใช้ `action: "status"` เพื่อตรวจสอบอย่างชัดเจนโดยไม่ทริกเกอร์การสร้างใหม่

## การตั้งค่า

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

1. พารามิเตอร์ `model` จากการเรียก tool หากเอเจนต์ระบุมา
2. `musicGenerationModel.primary` จากคอนฟิก
3. `musicGenerationModel.fallbacks` ตามลำดับ
4. การตรวจจับอัตโนมัติโดยใช้เฉพาะค่าเริ่มต้นของผู้ให้บริการที่มี auth รองรับ:
   - ผู้ให้บริการเริ่มต้นปัจจุบันก่อน
   - ผู้ให้บริการการสร้างเพลงที่ลงทะเบียนที่เหลือตามลำดับ provider-id

หากผู้ให้บริการล้มเหลว ระบบจะลอง candidate ถัดไปอัตโนมัติ หากทุกตัวล้มเหลว
ข้อผิดพลาดจะมีรายละเอียดจากทุกความพยายามรวมอยู่ด้วย

ตั้งค่า `agents.defaults.mediaGenerationAutoProviderFallback: false` หากคุณต้องการให้
การสร้างเพลงใช้เฉพาะ `model`, `primary` และ `fallbacks`
ที่ระบุแบบ explicit เท่านั้น

## หมายเหตุเกี่ยวกับผู้ให้บริการ

- Google ใช้การสร้างแบบแบตช์ของ Lyria 3 โฟลว์แบบ bundled ปัจจุบันรองรับ
  prompt, ข้อความ lyrics แบบไม่บังคับ และภาพอ้างอิงแบบไม่บังคับ
- MiniMax ใช้ endpoint แบบแบตช์ `music_generation` โฟลว์แบบ bundled ปัจจุบัน
  รองรับ prompt, lyrics แบบไม่บังคับ, โหมด instrumental, การชี้นำเรื่องระยะเวลา และ
  เอาต์พุตแบบ mp3
- การรองรับ ComfyUI ขับเคลื่อนด้วย workflow และขึ้นอยู่กับ graph ที่ตั้งค่าไว้ รวมถึง
  mapping ของ node สำหรับฟิลด์ prompt/output

## โหมดความสามารถของผู้ให้บริการ

สัญญาสำหรับการสร้างเพลงแบบใช้ร่วมกันตอนนี้รองรับการประกาศโหมดแบบ explicit:

- `generate` สำหรับการสร้างจาก prompt อย่างเดียว
- `edit` เมื่อคำขอมีภาพอ้างอิงหนึ่งภาพหรือมากกว่า

implementation ของผู้ให้บริการใหม่ควรใช้บล็อกโหมดแบบ explicit:

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

ฟิลด์ flat แบบ legacy เช่น `maxInputImages`, `supportsLyrics` และ
`supportsFormat` ยังไม่เพียงพอสำหรับการประกาศการรองรับ edit ผู้ให้บริการควร
ประกาศ `generate` และ `edit` อย่างชัดเจน เพื่อให้ live test, contract test และ
tool `music_generate` ที่ใช้ร่วมกันสามารถตรวจสอบการรองรับโหมดได้อย่าง deterministic

## การเลือกเส้นทางที่เหมาะสม

- ใช้เส้นทางแบบใช้ร่วมกันที่มีผู้ให้บริการรองรับ เมื่อคุณต้องการการเลือกโมเดล การ failover ของผู้ให้บริการ และโฟลว์ task/status แบบ async ที่มีมาในตัว
- ใช้เส้นทางของ Plugin เช่น ComfyUI เมื่อคุณต้องการ graph ของ workflow แบบกำหนดเอง หรือผู้ให้บริการที่ไม่อยู่ในความสามารถด้านการสร้างเพลงแบบ bundled ที่ใช้ร่วมกัน
- หากคุณกำลังดีบักพฤติกรรมเฉพาะของ ComfyUI ให้ดู [ComfyUI](/th/providers/comfy) หากคุณกำลังดีบักพฤติกรรมของผู้ให้บริการแบบใช้ร่วมกัน ให้เริ่มที่ [Google (Gemini)](/th/providers/google) หรือ [MiniMax](/th/providers/minimax)

## Live tests

ความครอบคลุมแบบ live ที่ต้องเลือกเปิดเองสำหรับผู้ให้บริการแบบ bundled ที่ใช้ร่วมกัน:

```bash
OPENCLAW_LIVE_TEST=1 pnpm test:live -- extensions/music-generation-providers.live.test.ts
```

wrapper ของรีโป:

```bash
pnpm test:live:media music
```

ไฟล์ live นี้จะโหลด env var ของผู้ให้บริการที่ยังขาดจาก `~/.profile`, ให้ความสำคัญกับ
API key แบบ live/env มากกว่า auth profile ที่เก็บไว้โดยค่าเริ่มต้น และรันความครอบคลุมทั้งแบบ
`generate` และ `edit` ที่ประกาศไว้ เมื่อผู้ให้บริการเปิดใช้ edit mode

ปัจจุบันหมายความว่า:

- `google`: `generate` และ `edit`
- `minimax`: `generate` เท่านั้น
- `comfy`: ใช้ความครอบคลุม live ของ Comfy แยกต่างหาก ไม่อยู่ใน shared provider sweep

ความครอบคลุมแบบ live ที่ต้องเลือกเปิดเองสำหรับเส้นทางเพลงของ ComfyUI แบบ bundled:

```bash
OPENCLAW_LIVE_TEST=1 COMFY_LIVE_TEST=1 pnpm test:live -- extensions/comfy/comfy.live.test.ts
```

ไฟล์ live ของ Comfy ยังครอบคลุม workflow ด้านภาพและวิดีโอของ Comfy ด้วย เมื่อมีการตั้งค่าส่วนนั้นไว้

## ที่เกี่ยวข้อง

- [งานเบื้องหลัง](/th/automation/tasks) - การติดตาม task สำหรับการรัน `music_generate` แบบแยกส่วน
- [เอกสารอ้างอิงคอนฟิก](/th/gateway/configuration-reference#agent-defaults) - คอนฟิก `musicGenerationModel`
- [ComfyUI](/th/providers/comfy)
- [Google (Gemini)](/th/providers/google)
- [MiniMax](/th/providers/minimax)
- [Models](/th/concepts/models) - การตั้งค่าโมเดลและ failover
- [ภาพรวมของ Tools](/th/tools)
