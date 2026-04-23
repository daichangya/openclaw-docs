---
read_when:
    - คุณต้องการทำดัชนีหรือค้นหา semantic memory
    - คุณกำลังดีบักความพร้อมใช้งานของหน่วยความจำหรือการทำดัชนี
    - คุณต้องการเลื่อนระดับหน่วยความจำระยะสั้นที่เรียกคืนได้ไปยัง `MEMORY.md`
summary: ข้อมูลอ้างอิง CLI สำหรับ `openclaw memory` (status/index/search/promote/promote-explain/rem-harness)
title: หน่วยความจำ
x-i18n:
    generated_at: "2026-04-23T06:18:34Z"
    model: gpt-5.4
    provider: openai
    source_hash: c9ea7aa2858b18cc6daa6531c45c9e838015b84de1c7a1b88716f2b1323e419c
    source_path: cli/memory.md
    workflow: 15
---

# `openclaw memory`

จัดการการทำดัชนีและการค้นหา semantic memory
ให้บริการโดย Plugin หน่วยความจำที่ใช้งานอยู่ (ค่าเริ่มต้น: `memory-core`; ตั้งค่า `plugins.slots.memory = "none"` เพื่อปิดใช้งาน)

ที่เกี่ยวข้อง:

- แนวคิดเรื่องหน่วยความจำ: [หน่วยความจำ](/th/concepts/memory)
- วิกิหน่วยความจำ: [วิกิหน่วยความจำ](/th/plugins/memory-wiki)
- Wiki CLI: [wiki](/th/cli/wiki)
- Plugins: [Plugins](/th/tools/plugin)

## ตัวอย่าง

```bash
openclaw memory status
openclaw memory status --deep
openclaw memory status --fix
openclaw memory index --force
openclaw memory search "meeting notes"
openclaw memory search --query "deployment" --max-results 20
openclaw memory promote --limit 10 --min-score 0.75
openclaw memory promote --apply
openclaw memory promote --json --min-recall-count 0 --min-unique-queries 0
openclaw memory promote-explain "router vlan"
openclaw memory promote-explain "router vlan" --json
openclaw memory rem-harness
openclaw memory rem-harness --json
openclaw memory status --json
openclaw memory status --deep --index
openclaw memory status --deep --index --verbose
openclaw memory status --agent main
openclaw memory index --agent main --verbose
```

## ตัวเลือก

`memory status` และ `memory index`:

- `--agent <id>`: จำกัดขอบเขตไปยังเอเจนต์เดียว หากไม่ระบุ คำสั่งเหล่านี้จะรันสำหรับเอเจนต์ที่กำหนดค่าไว้แต่ละตัว; หากไม่มีการกำหนดค่ารายการเอเจนต์ จะย้อนกลับไปใช้เอเจนต์เริ่มต้น
- `--verbose`: แสดงบันทึกโดยละเอียดระหว่างการ probe และการทำดัชนี

`memory status`:

- `--deep`: probe ความพร้อมใช้งานของเวกเตอร์ + embedding
- `--index`: รันการทำดัชนีใหม่หาก store อยู่ในสถานะ dirty (รวม `--deep`)
- `--fix`: ซ่อมแซม recall lock ที่ค้างอยู่และทำให้ข้อมูลเมตาการเลื่อนระดับเป็นมาตรฐาน
- `--json`: พิมพ์เอาต์พุต JSON

`memory index`:

- `--force`: บังคับให้ทำดัชนีใหม่ทั้งหมด

`memory search`:

- อินพุตคำค้นหา: ส่งได้ทั้ง `[query]` แบบตามตำแหน่งหรือ `--query <text>`
- หากระบุทั้งสองแบบ `--query` จะมีผลเหนือกว่า
- หากไม่ระบุทั้งคู่ คำสั่งจะออกพร้อมข้อผิดพลาด
- `--agent <id>`: จำกัดขอบเขตไปยังเอเจนต์เดียว (ค่าเริ่มต้น: เอเจนต์เริ่มต้น)
- `--max-results <n>`: จำกัดจำนวนผลลัพธ์ที่ส่งกลับ
- `--min-score <n>`: กรองรายการที่มีคะแนนต่ำออก
- `--json`: พิมพ์ผลลัพธ์ JSON

`memory promote`:

ดูตัวอย่างและปรับใช้การเลื่อนระดับหน่วยความจำระยะสั้น

```bash
openclaw memory promote [--apply] [--limit <n>] [--include-promoted]
```

- `--apply` -- เขียนการเลื่อนระดับลงใน `MEMORY.md` (ค่าเริ่มต้น: แสดงตัวอย่างเท่านั้น)
- `--limit <n>` -- จำกัดจำนวนผู้สมัครที่แสดง
- `--include-promoted` -- รวมรายการที่ถูกเลื่อนระดับไปแล้วในรอบก่อนหน้า

ตัวเลือกทั้งหมด:

- จัดอันดับผู้สมัครระยะสั้นจาก `memory/YYYY-MM-DD.md` โดยใช้สัญญาณการเลื่อนระดับแบบถ่วงน้ำหนัก (`frequency`, `relevance`, `query diversity`, `recency`, `consolidation`, `conceptual richness`)
- ใช้สัญญาณระยะสั้นจากทั้งการเรียกคืนหน่วยความจำและการส่งผ่าน ingestion รายวัน รวมถึงสัญญาณ reinforcement จากระยะ light/REM
- เมื่อเปิดใช้ Dreaming, `memory-core` จะจัดการงาน cron หนึ่งงานโดยอัตโนมัติซึ่งรันการกวาดแบบเต็ม (`light -> REM -> deep`) ในเบื้องหลัง (ไม่ต้องใช้ `openclaw cron add` ด้วยตนเอง)
- `--agent <id>`: จำกัดขอบเขตไปยังเอเจนต์เดียว (ค่าเริ่มต้น: เอเจนต์เริ่มต้น)
- `--limit <n>`: จำนวนผู้สมัครสูงสุดที่จะส่งกลับ/ปรับใช้
- `--min-score <n>`: คะแนนการเลื่อนระดับแบบถ่วงน้ำหนักขั้นต่ำ
- `--min-recall-count <n>`: จำนวนการเรียกคืนขั้นต่ำที่ผู้สมัครต้องมี
- `--min-unique-queries <n>`: จำนวนคำค้นหาที่แตกต่างกันขั้นต่ำที่ผู้สมัครต้องมี
- `--apply`: ผนวกรายการผู้สมัครที่เลือกลงใน `MEMORY.md` และทำเครื่องหมายว่าเลื่อนระดับแล้ว
- `--include-promoted`: รวมผู้สมัครที่ถูกเลื่อนระดับไปแล้วในเอาต์พุต
- `--json`: พิมพ์เอาต์พุต JSON

`memory promote-explain`:

อธิบายผู้สมัครสำหรับการเลื่อนระดับที่ระบุ และรายละเอียดการแบ่งคะแนนของผู้สมัครนั้น

```bash
openclaw memory promote-explain <selector> [--agent <id>] [--include-promoted] [--json]
```

- `<selector>`: คีย์ผู้สมัคร ชิ้นส่วนของพาธ หรือชิ้นส่วนของสไนปเพ็ตที่ใช้ค้นหา
- `--agent <id>`: จำกัดขอบเขตไปยังเอเจนต์เดียว (ค่าเริ่มต้น: เอเจนต์เริ่มต้น)
- `--include-promoted`: รวมผู้สมัครที่ถูกเลื่อนระดับไปแล้ว
- `--json`: พิมพ์เอาต์พุต JSON

`memory rem-harness`:

แสดงตัวอย่างการสะท้อน REM ข้อเท็จจริงผู้สมัคร และเอาต์พุตการเลื่อนระดับแบบ deep โดยไม่เขียนอะไรเลย

```bash
openclaw memory rem-harness [--agent <id>] [--include-promoted] [--json]
```

- `--agent <id>`: จำกัดขอบเขตไปยังเอเจนต์เดียว (ค่าเริ่มต้น: เอเจนต์เริ่มต้น)
- `--include-promoted`: รวมผู้สมัครแบบ deep ที่ถูกเลื่อนระดับไปแล้ว
- `--json`: พิมพ์เอาต์พุต JSON

## Dreaming

Dreaming คือระบบรวมหน่วยความจำเบื้องหลังที่มีสามระยะซึ่งทำงานร่วมกัน:
**light** (จัดเรียง/เตรียมเนื้อหาระยะสั้น), **deep** (เลื่อนระดับข้อเท็จจริงที่คงทน
ไปยัง `MEMORY.md`) และ **REM** (สะท้อนและดึงธีมสำคัญขึ้นมา)

- เปิดใช้งานด้วย `plugins.entries.memory-core.config.dreaming.enabled: true`
- สลับจากแชตด้วย `/dreaming on|off` (หรือตรวจสอบด้วย `/dreaming status`)
- Dreaming ทำงานตามตารางการกวาดที่มีการจัดการหนึ่งรายการ (`dreaming.frequency`) และดำเนินการตามลำดับ: light, REM, deep
- มีเพียงระยะ deep เท่านั้นที่เขียนหน่วยความจำแบบคงทนลงใน `MEMORY.md`
- เอาต์พุตระยะที่มนุษย์อ่านได้และรายการบันทึกประจำวันจะถูกเขียนลงใน `DREAMS.md` (หรือ `dreams.md` ที่มีอยู่) พร้อมรายงานแยกตามระยะตามตัวเลือกใน `memory/dreaming/<phase>/YYYY-MM-DD.md`
- การจัดอันดับใช้สัญญาณแบบถ่วงน้ำหนัก: ความถี่ในการเรียกคืน ความเกี่ยวข้องของการดึงคืน ความหลากหลายของคำค้นหา ความใหม่ตามเวลา การรวมข้ามวัน และความสมบูรณ์ของแนวคิดที่อนุมานได้
- การเลื่อนระดับจะอ่านบันทึกรายวันที่ใช้งานจริงซ้ำก่อนเขียนลง `MEMORY.md` ดังนั้นสไนปเพ็ตระยะสั้นที่ถูกแก้ไขหรือลบแล้วจะไม่ถูกเลื่อนระดับจากสแนปชอต recall-store ที่ล้าสมัย
- การรัน `memory promote` ทั้งแบบกำหนดเวลาและแบบแมนนวลใช้ค่าเริ่มต้นของระยะ deep เดียวกัน เว้นแต่คุณจะส่ง override เกณฑ์ผ่าน CLI
- การรันอัตโนมัติจะแยกทำงานไปยังเวิร์กสเปซหน่วยความจำที่กำหนดค่าไว้

การจัดตารางเวลาเริ่มต้น:

- **รอบการกวาด**: `dreaming.frequency = 0 3 * * *`
- **เกณฑ์ deep**: `minScore=0.8`, `minRecallCount=3`, `minUniqueQueries=3`, `recencyHalfLifeDays=14`, `maxAgeDays=30`

ตัวอย่าง:

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

หมายเหตุ:

- `memory index --verbose` จะแสดงรายละเอียดแยกตามระยะ (provider, model, แหล่งข้อมูล, กิจกรรมแบบ batch)
- `memory status` จะรวมพาธเพิ่มเติมที่กำหนดค่าไว้ผ่าน `memorySearch.extraPaths`
- หากฟิลด์คีย์ API ระยะไกลของหน่วยความจำที่ใช้งานจริงถูกกำหนดค่าเป็น SecretRefs คำสั่งจะ resolve ค่าเหล่านั้นจาก snapshot Gateway ที่ใช้งานอยู่ หาก Gateway ไม่พร้อมใช้งาน คำสั่งจะล้มเหลวทันที
- หมายเหตุเรื่องเวอร์ชัน Gateway ไม่ตรงกัน: เส้นทางคำสั่งนี้ต้องใช้ Gateway ที่รองรับ `secrets.resolve`; Gateway รุ่นเก่าจะส่งกลับข้อผิดพลาด unknown-method
- ปรับรอบการกวาดตามกำหนดเวลาด้วย `dreaming.frequency` ส่วนนโยบายการเลื่อนระดับแบบ deep เป็นเรื่องภายในตามปกติ; ใช้แฟล็ก CLI บน `memory promote` เมื่อคุณต้องการ override แบบแมนนวลเป็นครั้งคราว
- `memory rem-harness --path <file-or-dir> --grounded` จะแสดงตัวอย่าง `What Happened`, `Reflections` และ `Possible Lasting Updates` แบบ grounded จากบันทึกรายวันย้อนหลังโดยไม่เขียนอะไรเลย
- `memory rem-backfill --path <file-or-dir>` จะเขียนรายการบันทึกแบบ grounded ที่ย้อนกลับได้ลงใน `DREAMS.md` เพื่อให้ UI ตรวจสอบ
- `memory rem-backfill --path <file-or-dir> --stage-short-term` จะ seed ผู้สมัครแบบคงทน grounded ลงใน store การเลื่อนระดับระยะสั้นที่ใช้งานอยู่ด้วย เพื่อให้ระยะ deep ปกติสามารถจัดอันดับได้
- `memory rem-backfill --rollback` จะลบรายการบันทึกแบบ grounded ที่เขียนไว้ก่อนหน้านี้ และ `memory rem-backfill --rollback-short-term` จะลบผู้สมัครระยะสั้นแบบ grounded ที่จัดเตรียมไว้ก่อนหน้านี้
- ดู [Dreaming](/th/concepts/dreaming) สำหรับคำอธิบายแต่ละระยะและข้อมูลอ้างอิงการกำหนดค่าแบบเต็ม
