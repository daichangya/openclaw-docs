---
read_when:
    - คุณต้องการให้การยกระดับหน่วยความจำทำงานโดยอัตโนมัติ
    - คุณต้องการเข้าใจว่าแต่ละเฟสของ Dreaming ทำอะไรบ้าง
    - คุณต้องการปรับแต่งการรวมหน่วยความจำโดยไม่ทำให้ `MEMORY.md` ปะปนไปด้วยข้อมูล არასისტंट to=final
summary: การรวมหน่วยความจำเบื้องหลังด้วยเฟส light, deep และ REM พร้อม Dream Diary
title: Dreaming
x-i18n:
    generated_at: "2026-04-23T05:29:57Z"
    model: gpt-5.4
    provider: openai
    source_hash: 050e99bd2b3a18d7d2f02747e3010a7679515098369af5061d0a97b5703fc581
    source_path: concepts/dreaming.md
    workflow: 15
---

# Dreaming

Dreaming คือระบบรวมหน่วยความจำเบื้องหลังใน `memory-core`
ซึ่งช่วยให้ OpenClaw ย้ายสัญญาณระยะสั้นที่มีความสำคัญไปเป็นหน่วยความจำที่คงทน
โดยยังคงทำให้กระบวนการนี้อธิบายได้และตรวจทานได้

Dreaming เป็น **opt-in** และถูกปิดใช้งานเป็นค่าเริ่มต้น

## สิ่งที่ Dreaming เขียน

Dreaming เก็บเอาต์พุตไว้สองประเภท:

- **สถานะของเครื่อง** ใน `memory/.dreams/` (ที่เก็บ recall, phase signals, ingestion checkpoints, locks)
- **เอาต์พุตที่มนุษย์อ่านได้** ใน `DREAMS.md` (หรือ `dreams.md` ที่มีอยู่เดิม) และไฟล์รายงาน phase แบบไม่บังคับใต้ `memory/dreaming/<phase>/YYYY-MM-DD.md`

การยกระดับเป็นหน่วยความจำระยะยาวยังคงเขียนลง `MEMORY.md` เท่านั้น

## โมเดลเฟส

Dreaming ใช้สามเฟสที่ทำงานร่วมกัน:

| Phase | วัตถุประสงค์                              | การเขียนแบบคงทน |
| ----- | ----------------------------------------- | ---------------- |
| Light | คัดแยกและจัดเตรียมข้อมูลระยะสั้นล่าสุด   | ไม่              |
| Deep  | ให้คะแนนและยกระดับรายการที่ควรเก็บถาวร   | ใช่ (`MEMORY.md`) |
| REM   | ทบทวนธีมและแนวคิดที่เกิดซ้ำ              | ไม่              |

เฟสเหล่านี้เป็นรายละเอียดการทำงานภายใน ไม่ใช่ "โหมด"
แยกที่ผู้ใช้กำหนดค่าเองได้

### เฟส Light

เฟส Light จะนำเข้าสัญญาณหน่วยความจำรายวันล่าสุดและร่องรอย recall มาหักรายการซ้ำ
แล้วจัดเตรียมบรรทัดตัวเลือก

- อ่านจากสถานะ recall ระยะสั้น ไฟล์หน่วยความจำรายวันล่าสุด และ transcript ของเซสชันที่ผ่านการปกปิดข้อมูลแล้วเมื่อมี
- เขียนบล็อก `## Light Sleep` ที่ระบบจัดการให้เมื่อที่เก็บรองรับเอาต์พุตแบบ inline
- บันทึกสัญญาณ reinforcement สำหรับการจัดอันดับแบบ deep ในภายหลัง
- ไม่เขียนลง `MEMORY.md` เด็ดขาด

### เฟส Deep

เฟส Deep เป็นตัวตัดสินว่าอะไรจะกลายเป็นหน่วยความจำระยะยาว

- จัดอันดับตัวเลือกโดยใช้คะแนนถ่วงน้ำหนักและเกณฑ์ threshold
- ต้องผ่าน `minScore`, `minRecallCount` และ `minUniqueQueries`
- ดึง snippet จากไฟล์รายวันจริงกลับมาอีกครั้งก่อนเขียน ดังนั้น snippet ที่เก่าหรือถูกลบจะถูกข้าม
- เพิ่มรายการที่ถูกยกระดับต่อท้ายลงใน `MEMORY.md`
- เขียนสรุป `## Deep Sleep` ลงใน `DREAMS.md` และสามารถเขียน `memory/dreaming/deep/YYYY-MM-DD.md` ได้แบบไม่บังคับ

### เฟส REM

เฟส REM ดึงรูปแบบและสัญญาณเชิงสะท้อนคิดออกมา

- สร้างสรุปธีมและการสะท้อนคิดจากร่องรอยระยะสั้นล่าสุด
- เขียนบล็อก `## REM Sleep` ที่ระบบจัดการให้เมื่อที่เก็บรองรับเอาต์พุตแบบ inline
- บันทึกสัญญาณ reinforcement ของ REM ที่ใช้ในการจัดอันดับแบบ deep
- ไม่เขียนลง `MEMORY.md` เด็ดขาด

## การนำเข้า transcript ของเซสชัน

Dreaming สามารถนำ transcript ของเซสชันที่ผ่านการปกปิดข้อมูลแล้วเข้าสู่ corpus ของ Dreaming ได้ เมื่อ
มี transcript อยู่ ระบบจะป้อนข้อมูลเหล่านั้นเข้าสู่เฟส Light ร่วมกับสัญญาณ
หน่วยความจำรายวันและร่องรอย recall เนื้อหาส่วนตัวและเนื้อหาที่อ่อนไหวจะถูกปกปิด
ก่อนการนำเข้า

## Dream Diary

Dreaming ยังเก็บ **Dream Diary** แบบเล่าเรื่องไว้ใน `DREAMS.md`
หลังจากแต่ละเฟสมีข้อมูลเพียงพอ `memory-core` จะรัน subagent turn แบบเบื้องหลัง
โดยพยายามอย่างดีที่สุด (ใช้โมเดลรันไทม์เริ่มต้น) และเพิ่มรายการบันทึกสั้น ๆ ต่อท้าย

ไดอารี่นี้มีไว้ให้อ่านโดยมนุษย์ใน Dreams UI ไม่ใช่แหล่งสำหรับการยกระดับ
อาร์ติแฟกต์ของไดอารี่/รายงานที่สร้างโดย Dreaming จะถูกตัดออกจากการยกระดับระยะสั้น
มีเพียง snippet หน่วยความจำที่ยึดโยงกับข้อมูลจริงเท่านั้นที่มีสิทธิ์ถูกยกระดับลงใน
`MEMORY.md`

ยังมีเลน backfill เชิงประวัติที่ยึดโยงกับข้อมูลจริงสำหรับงานตรวจทานและกู้คืน:

- `memory rem-harness --path ... --grounded` แสดงตัวอย่างเอาต์พุตไดอารี่แบบ grounded จากบันทึก `YYYY-MM-DD.md` ในอดีต
- `memory rem-backfill --path ...` เขียนรายการไดอารี่แบบ grounded ที่ย้อนกลับได้ลงใน `DREAMS.md`
- `memory rem-backfill --path ... --stage-short-term` จัดเตรียมตัวเลือกแบบคงทนที่ grounded ไว้ใน evidence store ระยะสั้นเดียวกับที่เฟส deep ปกติใช้อยู่แล้ว
- `memory rem-backfill --rollback` และ `--rollback-short-term` ลบอาร์ติแฟกต์ backfill ที่จัดเตรียมไว้เหล่านั้น โดยไม่แตะต้องรายการไดอารี่ปกติหรือ recall ระยะสั้นที่ยังทำงานอยู่

Control UI แสดง flow สำหรับ backfill/reset ของไดอารี่แบบเดียวกัน เพื่อให้คุณตรวจสอบ
ผลลัพธ์ในฉาก Dreams ได้ก่อนตัดสินใจว่าตัวเลือก grounded เหล่านั้น
ควรถูกยกระดับหรือไม่ ฉากนี้ยังแสดงเลน grounded แยกต่างหาก เพื่อให้คุณเห็นได้ว่า
รายการระยะสั้นที่ถูกจัดเตรียมรายการใดมาจากการ replay ข้อมูลประวัติ รายการที่ถูกยกระดับใด
ถูกนำโดย grounded และสามารถล้างเฉพาะรายการ staged แบบ grounded-only ได้โดยไม่
แตะต้องสถานะระยะสั้นปกติที่ใช้งานอยู่

## สัญญาณการจัดอันดับแบบ Deep

การจัดอันดับแบบ Deep ใช้สัญญาณฐานถ่วงน้ำหนักหกตัว ร่วมกับ phase reinforcement:

| Signal              | Weight | คำอธิบาย                                               |
| ------------------- | ------ | ------------------------------------------------------ |
| Frequency           | 0.24   | รายการนั้นสะสมสัญญาณระยะสั้นไว้กี่ครั้ง                |
| Relevance           | 0.30   | คุณภาพการดึงคืนเฉลี่ยของรายการนั้น                     |
| Query diversity     | 0.15   | บริบท query/วันที่ที่แตกต่างกันซึ่งทำให้มันปรากฏขึ้น     |
| Recency             | 0.15   | คะแนนความใหม่ที่ลดทอนตามเวลา                          |
| Consolidation       | 0.10   | ความแข็งแรงของการเกิดซ้ำข้ามหลายวัน                    |
| Conceptual richness | 0.06   | ความหนาแน่นของ concept tag จาก snippet/path            |

การพบในเฟส Light และ REM จะเพิ่มแรงหนุนเล็กน้อยที่ลดทอนตามเวลา จาก
`memory/.dreams/phase-signals.json`

## การตั้งเวลา

เมื่อเปิดใช้งาน `memory-core` จะจัดการ Cron job หนึ่งรายการอัตโนมัติสำหรับการกวาด
Dreaming แบบเต็มหนึ่งรอบ แต่ละรอบจะรันเฟสตามลำดับ: light -> REM -> deep

พฤติกรรมรอบเวลาเริ่มต้น:

| การตั้งค่า             | ค่าเริ่มต้น |
| ---------------------- | ----------- |
| `dreaming.frequency`   | `0 3 * * *` |

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

เปิดใช้ Dreaming พร้อมรอบการกวาดแบบกำหนดเอง:

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

## คำสั่ง Slash

```
/dreaming status
/dreaming on
/dreaming off
/dreaming help
```

## เวิร์กโฟลว์ CLI

ใช้การยกระดับผ่าน CLI เพื่อดูตัวอย่างหรือสั่งใช้แบบ manual:

```bash
openclaw memory promote
openclaw memory promote --apply
openclaw memory promote --limit 5
openclaw memory status --deep
```

`memory promote` แบบ manual จะใช้ threshold ของเฟส deep เป็นค่าเริ่มต้น เว้นแต่จะมีการ override
ด้วยแฟล็ก CLI

อธิบายว่าทำไมตัวเลือกใดตัวเลือกหนึ่งจึงจะถูกยกระดับหรือไม่ถูกยกระดับ:

```bash
openclaw memory promote-explain "router vlan"
openclaw memory promote-explain "router vlan" --json
```

แสดงตัวอย่าง REM reflections, candidate truths และเอาต์พุตการยกระดับแบบ deep โดยไม่
เขียนอะไรเลย:

```bash
openclaw memory rem-harness
openclaw memory rem-harness --json
```

## ค่าเริ่มต้นสำคัญ

การตั้งค่าทั้งหมดอยู่ใต้ `plugins.entries.memory-core.config.dreaming`

| Key         | ค่าเริ่มต้น |
| ----------- | ----------- |
| `enabled`   | `false`     |
| `frequency` | `0 3 * * *` |

นโยบายของเฟส threshold และพฤติกรรมของที่เก็บข้อมูล เป็นรายละเอียดการทำงาน
ภายใน (ไม่ใช่ config ที่ผู้ใช้ใช้งานโดยตรง)

ดู [เอกสารอ้างอิงการกำหนดค่า Memory](/th/reference/memory-config#dreaming)
สำหรับรายการคีย์ทั้งหมด

## Dreams UI

เมื่อเปิดใช้งาน แท็บ **Dreams** ของ Gateway จะแสดง:

- สถานะการเปิดใช้ Dreaming ปัจจุบัน
- สถานะระดับเฟสและการมีอยู่ของ managed sweep
- จำนวนรายการระยะสั้น grounded signal และรายการที่ถูกยกระดับวันนี้
- เวลาของการรันตามกำหนดครั้งถัดไป
- เลน grounded Scene แยกต่างหากสำหรับรายการ replay เชิงประวัติที่ถูกจัดเตรียมไว้
- ตัวอ่าน Dream Diary แบบขยายได้ที่ขับเคลื่อนโดย `doctor.memory.dreamDiary`

## การแก้ไขปัญหา

### Dreaming ไม่เคยทำงานเลย (สถานะแสดง blocked)

Cron ของ Dreaming ที่ระบบจัดการไว้จะอาศัย Heartbeat ของเอเจนต์เริ่มต้น หาก Heartbeat ไม่ทำงานสำหรับเอเจนต์นั้น
Cron จะเข้าคิว system event ที่ไม่มีใครมาประมวลผล และ Dreaming จะไม่ทำงานแบบเงียบ ๆ
ทั้ง `openclaw memory status` และ `/dreaming status` จะรายงานเป็น `blocked`
ในกรณีนั้น และระบุชื่อเอเจนต์ที่มี Heartbeat เป็นต้นเหตุของการบล็อก

สาเหตุที่พบบ่อยสองอย่าง:

- มีเอเจนต์อีกตัวประกาศบล็อก `heartbeat:` แบบ explicit เมื่อมีรายการใดใน `agents.list` มีบล็อก `heartbeat` เป็นของตัวเอง จะมีเฉพาะเอเจนต์เหล่านั้นเท่านั้นที่ทำ Heartbeat — ค่าเริ่มต้นจะไม่ถูกใช้กับทุกคนอีกต่อไป ดังนั้นเอเจนต์เริ่มต้นอาจเงียบไป ย้ายการตั้งค่า Heartbeat ไปไว้ที่ `agents.defaults.heartbeat` หรือเพิ่มบล็อก `heartbeat` แบบ explicit ให้กับเอเจนต์เริ่มต้น ดู [ขอบเขตและลำดับความสำคัญ](/th/gateway/heartbeat#scope-and-precedence)
- `heartbeat.every` เป็น `0`, ว่างเปล่า หรือ parse ไม่ได้ Cron จึงไม่มีช่วงเวลาให้ใช้ตั้งตาราง ทำให้ Heartbeat ถูกปิดใช้งานโดยพฤตินัย ตั้งค่า `every` เป็นระยะเวลาบวก เช่น `30m` ดู [ค่าเริ่มต้น](/th/gateway/heartbeat#defaults)

## ที่เกี่ยวข้อง

- [Heartbeat](/th/gateway/heartbeat)
- [Memory](/th/concepts/memory)
- [Memory Search](/th/concepts/memory-search)
- [memory CLI](/cli/memory)
- [เอกสารอ้างอิงการกำหนดค่า Memory](/th/reference/memory-config)
