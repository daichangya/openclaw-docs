---
read_when:
    - คุณต้องการทำดัชนีหรือค้นหา semantic memory
    - คุณกำลังดีบักความพร้อมใช้งานหรือการทำดัชนีของ memory
    - คุณต้องการโปรโมต short-term memory ที่เรียกคืนมาเข้าไปยัง `MEMORY.md`
summary: เอกสารอ้างอิง CLI สำหรับ `openclaw memory` (status/index/search/promote/promote-explain/rem-harness)
title: Memory
x-i18n:
    generated_at: "2026-04-24T09:03:12Z"
    model: gpt-5.4
    provider: openai
    source_hash: 4bcb1af05ecddceef7cd1d3244c8f0e4fc740d6d41fc5e9daa37177d1bfe3674
    source_path: cli/memory.md
    workflow: 15
---

# `openclaw memory`

จัดการการทำดัชนีและการค้นหา semantic memory
ให้บริการโดย Plugin memory ที่กำลังใช้งานอยู่ (ค่าเริ่มต้น: `memory-core`; ตั้งค่า `plugins.slots.memory = "none"` เพื่อปิดใช้งาน)

ที่เกี่ยวข้อง:

- แนวคิดเรื่อง Memory: [Memory](/th/concepts/memory)
- วิกิ Memory: [Memory Wiki](/th/plugins/memory-wiki)
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

- `--agent <id>`: กำหนดขอบเขตไปยังเอเจนต์เดียว หากไม่ระบุ คำสั่งเหล่านี้จะทำงานกับเอเจนต์ที่กำหนดค่าทุกตัว; หากไม่ได้กำหนดรายการเอเจนต์ไว้ จะ fallback ไปยังเอเจนต์เริ่มต้น
- `--verbose`: แสดง logs แบบละเอียดระหว่างการ probe และการทำดัชนี

`memory status`:

- `--deep`: probe ความพร้อมใช้งานของ vector + embedding
- `--index`: เรียกทำดัชนีใหม่หาก store อยู่ในสถานะ dirty (มีผลเท่ากับ `--deep`)
- `--fix`: ซ่อมแซม recall locks ที่ค้างอยู่และทำ promotion metadata ให้เป็นมาตรฐาน
- `--json`: พิมพ์เอาต์พุตเป็น JSON

หาก `memory status` แสดง `Dreaming status: blocked` หมายความว่า Cron ของ Dreaming ที่จัดการไว้ถูกเปิดใช้งาน แต่ heartbeat ที่ขับเคลื่อนมันไม่ได้ทำงานสำหรับเอเจนต์เริ่มต้น ดู [Dreaming never runs](/th/concepts/dreaming#dreaming-never-runs-status-shows-blocked) สำหรับสองสาเหตุที่พบบ่อย

`memory index`:

- `--force`: บังคับทำดัชนีใหม่ทั้งหมด

`memory search`:

- อินพุตคำค้น: ส่งได้ทั้ง `[query]` แบบระบุตำแหน่งหรือ `--query <text>`
- หากส่งมาทั้งคู่ `--query` จะมีลำดับความสำคัญสูงกว่า
- หากไม่ส่งมาทั้งสองแบบ คำสั่งจะออกพร้อมข้อผิดพลาด
- `--agent <id>`: กำหนดขอบเขตไปยังเอเจนต์เดียว (ค่าเริ่มต้น: เอเจนต์เริ่มต้น)
- `--max-results <n>`: จำกัดจำนวนผลลัพธ์ที่ส่งกลับ
- `--min-score <n>`: กรองผลลัพธ์ที่มีคะแนนต่ำออก
- `--json`: พิมพ์ผลลัพธ์เป็น JSON

`memory promote`:

ดูตัวอย่างและนำการโปรโมต short-term memory ไปใช้

```bash
openclaw memory promote [--apply] [--limit <n>] [--include-promoted]
```

- `--apply` -- เขียน promotions ลงใน `MEMORY.md` (ค่าเริ่มต้น: ดูตัวอย่างเท่านั้น)
- `--limit <n>` -- จำกัดจำนวน candidates ที่แสดง
- `--include-promoted` -- รวมรายการที่เคยโปรโมตแล้วในรอบก่อนหน้าด้วย

ตัวเลือกทั้งหมด:

- จัดอันดับ short-term candidates จาก `memory/YYYY-MM-DD.md` โดยใช้สัญญาณ promotion แบบถ่วงน้ำหนัก (`frequency`, `relevance`, `query diversity`, `recency`, `consolidation`, `conceptual richness`)
- ใช้สัญญาณ short-term จากทั้ง memory recalls และ daily-ingestion passes รวมถึงสัญญาณ reinforcement ของระยะ light/REM
- เมื่อเปิดใช้ Dreaming, `memory-core` จะจัดการ Cron job หนึ่งรายการโดยอัตโนมัติเพื่อรันการกวาดเต็มรูปแบบ (`light -> REM -> deep`) ในเบื้องหลัง (ไม่ต้อง `openclaw cron add` ด้วยตนเอง)
- `--agent <id>`: กำหนดขอบเขตไปยังเอเจนต์เดียว (ค่าเริ่มต้น: เอเจนต์เริ่มต้น)
- `--limit <n>`: จำนวน candidates สูงสุดที่จะส่งกลับ/นำไปใช้
- `--min-score <n>`: คะแนน promotion แบบถ่วงน้ำหนักขั้นต่ำ
- `--min-recall-count <n>`: จำนวน recall ขั้นต่ำที่ candidate ต้องมี
- `--min-unique-queries <n>`: จำนวนคำค้นที่แตกต่างกันขั้นต่ำที่ candidate ต้องมี
- `--apply`: เพิ่ม candidates ที่เลือกลงใน `MEMORY.md` และทำเครื่องหมายว่าโปรโมตแล้ว
- `--include-promoted`: รวม candidates ที่โปรโมตแล้วในเอาต์พุต
- `--json`: พิมพ์เอาต์พุตเป็น JSON

`memory promote-explain`:

อธิบาย candidate สำหรับการโปรโมตแบบเจาะจงและรายละเอียดการคำนวณคะแนน

```bash
openclaw memory promote-explain <selector> [--agent <id>] [--include-promoted] [--json]
```

- `<selector>`: คีย์ candidate, ส่วนของพาธ, หรือส่วนของ snippet ที่ใช้ค้นหา
- `--agent <id>`: กำหนดขอบเขตไปยังเอเจนต์เดียว (ค่าเริ่มต้น: เอเจนต์เริ่มต้น)
- `--include-promoted`: รวม candidates ที่โปรโมตแล้ว
- `--json`: พิมพ์เอาต์พุตเป็น JSON

`memory rem-harness`:

ดูตัวอย่าง REM reflections, candidate truths และเอาต์พุต deep promotion โดยไม่เขียนอะไรลงไฟล์

```bash
openclaw memory rem-harness [--agent <id>] [--include-promoted] [--json]
```

- `--agent <id>`: กำหนดขอบเขตไปยังเอเจนต์เดียว (ค่าเริ่มต้น: เอเจนต์เริ่มต้น)
- `--include-promoted`: รวม deep candidates ที่โปรโมตแล้ว
- `--json`: พิมพ์เอาต์พุตเป็น JSON

## Dreaming

Dreaming คือระบบรวมความทรงจำในเบื้องหลังที่มีสามระยะทำงานร่วมกัน:
**light** (จัดเรียง/จัดเตรียมข้อมูลระยะสั้น), **deep** (โปรโมต
ข้อเท็จจริงที่คงทนลงใน `MEMORY.md`) และ **REM** (สะท้อนและดึงธีมออกมา)

- เปิดใช้งานด้วย `plugins.entries.memory-core.config.dreaming.enabled: true`
- สลับจากแชตด้วย `/dreaming on|off` (หรือตรวจสอบด้วย `/dreaming status`)
- Dreaming ทำงานตามตารางการกวาดที่ถูกจัดการไว้หนึ่งรายการ (`dreaming.frequency`) และรันระยะต่าง ๆ ตามลำดับ: light, REM, deep
- มีเพียงระยะ deep เท่านั้นที่เขียน durable memory ลงใน `MEMORY.md`
- เอาต์พุตของแต่ละระยะที่มนุษย์อ่านได้และรายการบันทึกประจำวันจะถูกเขียนลงใน `DREAMS.md` (หรือ `dreams.md` ที่มีอยู่แล้ว) พร้อมรายงานแยกตามระยะใน `memory/dreaming/<phase>/YYYY-MM-DD.md` ตามตัวเลือก
- การจัดอันดับใช้สัญญาณแบบถ่วงน้ำหนัก: ความถี่ในการ recall, ความเกี่ยวข้องในการดึงคืน, ความหลากหลายของคำค้น, ความใหม่ตามเวลา, การรวมข้ามวัน และความอุดมสมบูรณ์ของแนวคิดที่อนุมานได้
- ก่อนเขียนลง `MEMORY.md` การโปรโมตจะอ่านบันทึกประจำวันล่าสุดจริงซ้ำอีกครั้ง ดังนั้น snippets ระยะสั้นที่ถูกแก้ไขหรือลบไปแล้วจะไม่ถูกโปรโมตจาก snapshots ของ recall-store ที่ล้าสมัย
- การรัน `memory promote` แบบตั้งเวลาและแบบแมนนวลใช้ค่าเริ่มต้นของระยะ deep ร่วมกัน เว้นแต่คุณจะส่งตัวเลือก threshold ของ CLI เพื่อแทนที่แบบครั้งเดียว
- การรันอัตโนมัติจะแยกกระจายไปยัง memory workspaces ที่กำหนดค่าไว้

การตั้งเวลาค่าเริ่มต้น:

- **รอบการกวาด**: `dreaming.frequency = 0 3 * * *`
- **เกณฑ์ของ Deep**: `minScore=0.8`, `minRecallCount=3`, `minUniqueQueries=3`, `recencyHalfLifeDays=14`, `maxAgeDays=30`

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

- `memory index --verbose` จะแสดงรายละเอียดแยกตามระยะ (provider, model, sources, กิจกรรมของ batch)
- `memory status` จะรวมพาธเพิ่มเติมที่กำหนดไว้ผ่าน `memorySearch.extraPaths`
- หากฟิลด์ API key ระยะไกลของ Active Memory ที่มีผลจริงถูกกำหนดค่าเป็น SecretRefs คำสั่งนี้จะ resolve ค่าดังกล่าวจาก gateway snapshot ที่กำลังใช้งานอยู่ หาก gateway ไม่พร้อมใช้งาน คำสั่งจะล้มเหลวทันที
- หมายเหตุเรื่อง gateway version skew: เส้นทางคำสั่งนี้ต้องการ gateway ที่รองรับ `secrets.resolve`; gateways รุ่นเก่าจะส่งข้อผิดพลาด unknown-method กลับมา
- ปรับรอบการกวาดตามเวลาที่ตั้งไว้ด้วย `dreaming.frequency` ส่วนนโยบาย deep promotion จะเป็นภายในระบบ; ใช้ flags ของ CLI บน `memory promote` เมื่อต้องการแทนที่แบบครั้งเดียว
- `memory rem-harness --path <file-or-dir> --grounded` ดูตัวอย่าง `What Happened`, `Reflections` และ `Possible Lasting Updates` แบบ grounded จากบันทึกประจำวันย้อนหลังโดยไม่เขียนอะไรลงไฟล์
- `memory rem-backfill --path <file-or-dir>` เขียนรายการบันทึก grounded ที่ย้อนกลับได้ลงใน `DREAMS.md` เพื่อให้ตรวจสอบใน UI
- `memory rem-backfill --path <file-or-dir> --stage-short-term` จะใส่ grounded durable candidates ลงใน live short-term promotion store ด้วย เพื่อให้ระยะ deep ปกติจัดอันดับต่อได้
- `memory rem-backfill --rollback` จะลบรายการบันทึก grounded ที่เคยเขียนไว้ก่อนหน้า และ `memory rem-backfill --rollback-short-term` จะลบ grounded short-term candidates ที่เคยถูก stage ไว้ก่อนหน้า
- ดู [Dreaming](/th/concepts/dreaming) สำหรับคำอธิบายแต่ละระยะและเอกสารอ้างอิงการกำหนดค่าแบบเต็ม

## ที่เกี่ยวข้อง

- [CLI reference](/th/cli)
- [Memory overview](/th/concepts/memory)
