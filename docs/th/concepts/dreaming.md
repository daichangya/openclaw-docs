---
read_when:
    - คุณต้องการให้การเลื่อนระดับหน่วยความจำทำงานโดยอัตโนมัติ
    - คุณต้องการเข้าใจว่าช่วง Dreaming แต่ละช่วงทำอะไร
    - คุณต้องการปรับแต่งการรวมหน่วยความจำโดยไม่ทำให้ MEMORY.md ปะปนไปด้วยข้อมูล غير ആവശ്യকারী
summary: การรวมหน่วยความจำเบื้องหลังด้วยช่วง light, deep และ REM พร้อม Dream Diary
title: Dreaming
x-i18n:
    generated_at: "2026-04-24T09:05:46Z"
    model: gpt-5.4
    provider: openai
    source_hash: a3c0f6ff18ac78980be07452859ec79e9a5b2ebb513c69e38eb09eff66291395
    source_path: concepts/dreaming.md
    workflow: 15
---

Dreaming คือระบบรวมหน่วยความจำเบื้องหลังใน `memory-core`
ซึ่งช่วยให้ OpenClaw ย้ายสัญญาณระยะสั้นที่มีความสำคัญไปเป็นหน่วยความจำถาวร
โดยยังคงทำให้กระบวนการอธิบายได้และตรวจทานได้

Dreaming เป็นฟีเจอร์แบบ **opt-in** และปิดใช้งานตามค่าเริ่มต้น

## สิ่งที่ Dreaming เขียน

Dreaming เก็บเอาต์พุตไว้ 2 ประเภท:

- **สถานะของระบบ** ใน `memory/.dreams/` (recall store, phase signals, ingestion checkpoints, locks)
- **เอาต์พุตที่มนุษย์อ่านได้** ใน `DREAMS.md` (หรือ `dreams.md` ที่มีอยู่แล้ว) และไฟล์รายงานของแต่ละ phase แบบไม่บังคับภายใต้ `memory/dreaming/<phase>/YYYY-MM-DD.md`

การเลื่อนระดับไปยังหน่วยความจำระยะยาวยังคงเขียนลง `MEMORY.md` เท่านั้น

## โมเดลของ phase

Dreaming ใช้ 3 phase ที่ทำงานร่วมกัน:

| Phase | จุดประสงค์ | การเขียนถาวร |
| ----- | ----------- | ------------- |
| Light | จัดเรียงและจัดเตรียมข้อมูลระยะสั้นล่าสุด | ไม่ |
| Deep  | ให้คะแนนและเลื่อนระดับรายการที่ควรเก็บถาวร | ใช่ (`MEMORY.md`) |
| REM   | สะท้อนธีมและแนวคิดที่เกิดซ้ำ | ไม่ |

phase เหล่านี้เป็นรายละเอียดการทำงานภายใน ไม่ใช่ "modes"
แยกต่างหากที่ผู้ใช้กำหนดได้

### Light phase

Light phase จะนำเข้าสัญญาณหน่วยความจำรายวันล่าสุดและ recall traces มาลดข้อมูลซ้ำ
แล้วจัดเตรียมบรรทัดที่เป็นตัวเลือก

- อ่านจากสถานะ short-term recall, ไฟล์หน่วยความจำรายวันล่าสุด และ session transcripts ที่ถูกปกปิดข้อมูลแล้วเมื่อมี
- เขียนบล็อก `## Light Sleep` ที่ระบบจัดการให้ เมื่อพื้นที่จัดเก็บรองรับเอาต์พุตแบบ inline
- บันทึกสัญญาณ reinforcement เพื่อใช้ในการจัดอันดับ deep ภายหลัง
- จะไม่เขียนลง `MEMORY.md`

### Deep phase

Deep phase เป็นผู้ตัดสินว่าอะไรจะกลายเป็นหน่วยความจำระยะยาว

- จัดอันดับรายการตัวเลือกด้วย weighted scoring และ threshold gates
- ต้องผ่าน `minScore`, `minRecallCount` และ `minUniqueQueries`
- ดึง snippets จากไฟล์รายวันที่ยังใช้งานอยู่กลับมาอีกครั้งก่อนเขียน ดังนั้น snippets ที่เก่าหรือถูกลบจะถูกข้าม
- ต่อท้ายรายการที่เลื่อนระดับแล้วลงใน `MEMORY.md`
- เขียนสรุป `## Deep Sleep` ลงใน `DREAMS.md` และอาจเขียน `memory/dreaming/deep/YYYY-MM-DD.md` ด้วย

### REM phase

REM phase ดึงรูปแบบและสัญญาณเชิงสะท้อนออกมา

- สร้างสรุปธีมและการสะท้อนจาก short-term traces ล่าสุด
- เขียนบล็อก `## REM Sleep` ที่ระบบจัดการให้ เมื่อพื้นที่จัดเก็บรองรับเอาต์พุตแบบ inline
- บันทึกสัญญาณ reinforcement ของ REM ที่ใช้ในการจัดอันดับ deep
- จะไม่เขียนลง `MEMORY.md`

## การนำเข้า session transcript

Dreaming สามารถนำ session transcripts ที่ถูกปกปิดข้อมูลแล้วเข้าสู่ dreaming corpus ได้ เมื่อ
มี transcripts อยู่ ระบบจะป้อนข้อมูลเหล่านี้เข้า light phase ร่วมกับสัญญาณหน่วยความจำรายวันและ recall traces เนื้อหาส่วนตัวและเนื้อหาที่อ่อนไหวจะถูกปกปิดก่อนการนำเข้า

## Dream Diary

Dreaming ยังเก็บ **Dream Diary** แบบเล่าเรื่องไว้ใน `DREAMS.md`
หลังจากแต่ละ phase มีข้อมูลมากพอ `memory-core` จะรัน subagent turn เบื้องหลังแบบ best-effort
(โดยใช้โมเดลรันไทม์เริ่มต้น) และต่อท้ายรายการไดอารีสั้น ๆ

ไดอารีนี้มีไว้เพื่อให้มนุษย์อ่านใน Dreams UI ไม่ใช่แหล่งสำหรับการเลื่อนระดับ
artifacts ประเภทรายงาน/ไดอารีที่สร้างโดย Dreaming จะถูกกันออกจากการเลื่อนระดับระยะสั้น
มีเพียง snippets ของหน่วยความจำที่ยึดโยงกับข้อมูลจริงเท่านั้นที่มีสิทธิ์ถูกเลื่อนระดับเข้าไปใน
`MEMORY.md`

ยังมีช่องทาง backfill เชิงประวัติที่ยึดโยงกับข้อมูลจริงสำหรับงานตรวจทานและกู้คืนด้วย:

- `memory rem-harness --path ... --grounded` แสดงตัวอย่างเอาต์พุตไดอารีแบบ grounded จากโน้ต `YYYY-MM-DD.md` ในอดีต
- `memory rem-backfill --path ...` เขียนรายการไดอารีแบบ grounded ที่ย้อนกลับได้ลงใน `DREAMS.md`
- `memory rem-backfill --path ... --stage-short-term` จัดเตรียมรายการตัวเลือกถาวรแบบ grounded ลงในที่เก็บหลักฐานระยะสั้นเดียวกันกับที่ deep phase ปกติใช้อยู่แล้ว
- `memory rem-backfill --rollback` และ `--rollback-short-term` จะลบ artifacts ของ backfill ที่จัดเตรียมไว้ โดยไม่แตะรายการไดอารีปกติหรือ live short-term recall

Control UI เปิดให้ใช้ flow การ backfill/reset ของไดอารีแบบเดียวกัน เพื่อให้คุณตรวจสอบ
ผลลัพธ์ในฉาก Dreams ก่อนตัดสินใจว่ารายการตัวเลือก grounded เหล่านั้น
สมควรถูกเลื่อนระดับหรือไม่ Scene ยังแสดง grounded lane แยกต่างหากเพื่อให้คุณเห็นว่า
รายการ short-term ที่ถูกจัดเตรียมใดมาจากการเล่นซ้ำข้อมูลย้อนหลัง รายการที่ถูกเลื่อนระดับใดถูกนำโดย grounded และสามารถล้างเฉพาะรายการที่จัดเตรียมไว้แบบ grounded-only ได้โดยไม่แตะสถานะ short-term ปกติที่ยังใช้งานอยู่

## สัญญาณการจัดอันดับ deep

การจัดอันดับ deep ใช้สัญญาณพื้นฐานที่มีน้ำหนัก 6 รายการ บวก phase reinforcement:

| สัญญาณ | น้ำหนัก | คำอธิบาย |
| ------------------- | ------ | ------------------------------------------------- |
| Frequency | 0.24 | รายการนั้นสะสมสัญญาณระยะสั้นไว้กี่ครั้ง |
| Relevance | 0.30 | คุณภาพการดึงข้อมูลเฉลี่ยของรายการนั้น |
| Query diversity | 0.15 | จำนวนบริบท query/day ที่แตกต่างกันที่ทำให้รายการนี้ปรากฏ |
| Recency | 0.15 | คะแนนความใหม่แบบ time-decayed |
| Consolidation | 0.10 | ความแรงของการเกิดซ้ำข้ามหลายวัน |
| Conceptual richness | 0.06 | ความหนาแน่นของ concept-tag จาก snippet/path |

การพบใน phase Light และ REM จะเพิ่มค่าส่งเสริมเล็กน้อยแบบ recency-decayed จาก
`memory/.dreams/phase-signals.json`

## การตั้งเวลา

เมื่อเปิดใช้งาน `memory-core` จะจัดการงาน Cron หนึ่งรายการโดยอัตโนมัติสำหรับการกวาด Dreaming
แบบเต็ม แต่ละรอบจะรัน phases ตามลำดับ: light -> REM -> deep

พฤติกรรม cadence เริ่มต้น:

| การตั้งค่า | ค่าเริ่มต้น |
| -------------------- | ----------- |
| `dreaming.frequency` | `0 3 * * *` |

## เริ่มต้นอย่างรวดเร็ว

เปิดใช้ Dreaming:

```json
{
  "plugins": {
    "entries": {
      "memory-core": {
        "config": {
          "dreaming": {
            "enabled": true
          }
        }
      }
    }
  }
}
```

เปิดใช้ Dreaming พร้อม cadence การกวาดแบบกำหนดเอง:

```json
{
  "plugins": {
    "entries": {
      "memory-core": {
        "config": {
          "dreaming": {
            "enabled": true,
            "timezone": "America/Los_Angeles",
            "frequency": "0 */6 * * *"
          }
        }
      }
    }
  }
}
```

## Slash command

```text
/dreaming status
/dreaming on
/dreaming off
/dreaming help
```

## เวิร์กโฟลว์ CLI

ใช้การเลื่อนระดับผ่าน CLI เพื่อดูตัวอย่างหรือสั่งใช้งานด้วยตนเอง:

```bash
openclaw memory promote
openclaw memory promote --apply
openclaw memory promote --limit 5
openclaw memory status --deep
```

`memory promote` แบบแมนนวลจะใช้ thresholds ของ deep phase ตามค่าเริ่มต้น เว้นแต่จะ override
ด้วยแฟลก CLI

อธิบายว่าทำไมรายการตัวเลือกหนึ่งรายการจึงจะหรือจะไม่ถูกเลื่อนระดับ:

```bash
openclaw memory promote-explain "router vlan"
openclaw memory promote-explain "router vlan" --json
```

แสดงตัวอย่าง REM reflections, candidate truths และเอาต์พุตการเลื่อนระดับของ deep โดยไม่
เขียนอะไรลงไป:

```bash
openclaw memory rem-harness
openclaw memory rem-harness --json
```

## ค่าเริ่มต้นสำคัญ

การตั้งค่าทั้งหมดอยู่ใต้ `plugins.entries.memory-core.config.dreaming`

| คีย์ | ค่าเริ่มต้น |
| ----------- | ----------- |
| `enabled` | `false` |
| `frequency` | `0 3 * * *` |

นโยบาย phase, thresholds และพฤติกรรมการจัดเก็บเป็นรายละเอียดการทำงาน
ภายใน (ไม่ใช่ config ที่เปิดให้ผู้ใช้ตั้งค่า)

ดู [ข้อมูลอ้างอิงการกำหนดค่า Memory](/th/reference/memory-config#dreaming)
สำหรับรายการคีย์ทั้งหมด

## Dreams UI

เมื่อเปิดใช้งาน แท็บ **Dreams** ใน Gateway จะแสดง:

- สถานะการเปิดใช้ Dreaming ปัจจุบัน
- สถานะระดับ phase และการมีอยู่ของ managed-sweep
- จำนวนรายการ short-term, grounded, signal และ promoted-today
- เวลาของรอบถัดไปที่ตั้งเวลาไว้
- grounded Scene lane แยกต่างหากสำหรับรายการ replay เชิงประวัติที่ถูกจัดเตรียมไว้
- ตัวอ่าน Dream Diary แบบขยายได้ซึ่งขับเคลื่อนโดย `doctor.memory.dreamDiary`

## ที่เกี่ยวข้อง

- [Memory](/th/concepts/memory)
- [Memory Search](/th/concepts/memory-search)
- [memory CLI](/th/cli/memory)
- [ข้อมูลอ้างอิงการกำหนดค่า Memory](/th/reference/memory-config)
