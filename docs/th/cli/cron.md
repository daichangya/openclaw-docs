---
read_when:
    - คุณต้องการงานที่กำหนดเวลาไว้และการปลุกการทำงาน
    - คุณกำลังดีบักการทำงานและบันทึกของ Cron
summary: ข้อมูลอ้างอิง CLI สำหรับ `openclaw cron` (กำหนดเวลาและเรียกใช้งานงานเบื้องหลัง)
title: Cron
x-i18n:
    generated_at: "2026-04-23T06:17:44Z"
    model: gpt-5.4
    provider: openai
    source_hash: f5216f220748b05df5202af778878b37148d6abe235be9fe82ddcf976d51532a
    source_path: cli/cron.md
    workflow: 15
---

# `openclaw cron`

จัดการงาน Cron สำหรับตัวจัดตารางเวลาของ Gateway

ที่เกี่ยวข้อง:

- งาน Cron: [งาน Cron](/th/automation/cron-jobs)

เคล็ดลับ: รัน `openclaw cron --help` เพื่อดูชุดคำสั่งทั้งหมด

หมายเหตุ: `openclaw cron list` และ `openclaw cron show <job-id>` จะแสดงตัวอย่าง
เส้นทางการส่งที่ resolve แล้ว สำหรับ `channel: "last"` ตัวอย่างจะแสดงว่า
เส้นทางนั้น resolve จากเซสชัน main/current หรือจะล้มเหลวแบบปิด

หมายเหตุ: งาน `cron add` แบบ isolated จะใช้การส่งแบบ `--announce` เป็นค่าเริ่มต้น ใช้ `--no-deliver` เพื่อเก็บ
เอาต์พุตไว้ภายใน `--deliver` ยังคงมีอยู่ในฐานะ alias ที่เลิกใช้งานแล้วสำหรับ `--announce`

หมายเหตุ: การส่งแชตของ cron แบบ isolated ใช้ร่วมกัน `--announce` คือการส่งสำรองของตัวรัน
สำหรับคำตอบสุดท้าย ส่วน `--no-deliver` จะปิดการส่งสำรองนั้น แต่
ไม่ได้ลบเครื่องมือ `message` ของเอเจนต์เมื่อมีเส้นทางแชตพร้อมใช้งาน

หมายเหตุ: งานแบบครั้งเดียว (`--at`) จะถูกลบหลังจากสำเร็จตามค่าเริ่มต้น ใช้ `--keep-after-run` เพื่อเก็บไว้

หมายเหตุ: `--session` รองรับ `main`, `isolated`, `current` และ `session:<id>`
ใช้ `current` เพื่อผูกกับเซสชันที่ใช้งานอยู่ ณ เวลาสร้าง หรือใช้ `session:<id>` สำหรับ
คีย์เซสชันถาวรแบบระบุชัดเจน

หมายเหตุ: สำหรับงาน CLI แบบครั้งเดียว ค่าวันที่เวลา `--at` ที่ไม่มี offset จะถือเป็น UTC เว้นแต่คุณจะส่ง
`--tz <iana>` ด้วย ซึ่งจะตีความเวลาท้องถิ่นนั้นตามเขตเวลาที่ระบุ

หมายเหตุ: งานที่เกิดซ้ำตอนนี้ใช้การหน่วงเวลาก่อนลองใหม่แบบเอ็กซ์โปเนนเชียลหลังเกิดข้อผิดพลาดต่อเนื่อง (30 วินาที → 1 นาที → 5 นาที → 15 นาที → 60 นาที) แล้วจึงกลับสู่ตารางเวลาปกติหลังจากรันสำเร็จครั้งถัดไป

หมายเหตุ: ตอนนี้ `openclaw cron run` จะคืนค่าทันทีที่จัดคิวการรันด้วยตนเองเพื่อดำเนินการแล้ว การตอบกลับที่สำเร็จจะมี `{ ok: true, enqueued: true, runId }`; ใช้ `openclaw cron runs --id <job-id>` เพื่อติดตามผลลัพธ์ในภายหลัง

หมายเหตุ: `openclaw cron run <job-id>` จะบังคับรันตามค่าเริ่มต้น ใช้ `--due` เพื่อคง
พฤติกรรมเดิมแบบ "รันเฉพาะเมื่อถึงกำหนด"

หมายเหตุ: การรัน cron แบบ isolated จะระงับการตอบกลับแบบยืนยันอย่างเดียวที่ล้าสมัย หาก
ผลลัพธ์แรกเป็นเพียงการอัปเดตสถานะชั่วคราว และไม่มีการรัน subagent ลูกหลานใด
รับผิดชอบต่อคำตอบสุดท้าย cron จะ prompt ใหม่หนึ่งครั้งสำหรับผลลัพธ์จริงก่อนส่ง

หมายเหตุ: หากการรัน cron แบบ isolated ส่งกลับมาเพียงโทเค็นแบบเงียบ (`NO_REPLY` /
`no_reply`) cron จะระงับทั้งการส่งออกโดยตรงและเส้นทางสรุปแบบเข้าคิวสำรอง
ดังนั้นจะไม่มีการโพสต์อะไรกลับไปยังแชต

หมายเหตุ: `cron add|edit --model ...` จะใช้โมเดลที่อนุญาตที่เลือกนั้นสำหรับงาน
หากโมเดลไม่ได้รับอนุญาต cron จะเตือนและย้อนกลับไปใช้การเลือกโมเดล
ของเอเจนต์/ค่าเริ่มต้นของงานแทน ห่วงโซ่ fallback ที่กำหนดค่าไว้ยังคงมีผล แต่การ override
โมเดลแบบธรรมดาโดยไม่มีรายการ fallback ต่อหนึ่งงานแบบระบุชัดเจน จะไม่ต่อท้าย
โมเดลหลักของเอเจนต์เป็นเป้าหมายลองใหม่แบบซ่อนอยู่อีกตัวหนึ่งอีกต่อไป

หมายเหตุ: ลำดับความสำคัญของโมเดล cron แบบ isolated คือ override ของ Gmail-hook ก่อน จากนั้นเป็น
`--model` ต่อหนึ่งงาน จากนั้นเป็น override โมเดลของ cron-session ที่จัดเก็บไว้ แล้วจึงเป็นการเลือก
เอเจนต์/ค่าเริ่มต้นตามปกติ

หมายเหตุ: โหมดเร็วของ cron แบบ isolated จะทำตามการเลือกโมเดล live ที่ resolve แล้ว
`params.fastMode` ใน config ของโมเดลจะมีผลตามค่าเริ่มต้น แต่ override `fastMode`
ของเซสชันที่จัดเก็บไว้จะยังมีความสำคัญเหนือกว่า config

หมายเหตุ: หากการรันแบบ isolated โยน `LiveSessionModelSwitchError` cron จะคงค่า
provider/model ที่สลับแล้วไว้ (รวมถึง override โปรไฟล์การยืนยันตัวตนที่สลับแล้วเมื่อมี) ก่อน
ลองใหม่ ลูปการลองใหม่ชั้นนอกถูกจำกัดไว้ที่การลองใหม่จากการสลับ 2 ครั้งหลังความพยายาม
ครั้งแรก จากนั้นจะยุติแทนที่จะวนลูปไม่สิ้นสุด

หมายเหตุ: การแจ้งเตือนความล้มเหลวจะใช้ `delivery.failureDestination` ก่อน จากนั้น
`cron.failureDestination` แบบ global และสุดท้ายจะย้อนกลับไปใช้เป้าหมาย announce หลัก
ของงานเมื่อไม่ได้กำหนดปลายทางสำหรับความล้มเหลวไว้อย่างชัดเจน

หมายเหตุ: การเก็บรักษา/การล้างข้อมูลส่วนเกินควบคุมใน config:

- `cron.sessionRetention` (ค่าเริ่มต้น `24h`) จะล้างเซสชันการรัน isolated ที่เสร็จสมบูรณ์
- `cron.runLog.maxBytes` + `cron.runLog.keepLines` จะล้าง `~/.openclaw/cron/runs/<jobId>.jsonl`

หมายเหตุการอัปเกรด: หากคุณมีงาน cron เก่าจากก่อนรูปแบบการส่ง/การจัดเก็บปัจจุบัน ให้รัน
`openclaw doctor --fix` ตอนนี้ Doctor จะปรับฟิลด์ cron แบบ legacy (`jobId`, `schedule.cron`,
ฟิลด์การส่งระดับบนสุดรวมถึง `threadId` แบบ legacy, alias การส่ง `provider` ใน payload) ให้เป็นมาตรฐาน และย้ายงาน fallback ของ webhook แบบง่ายที่ใช้
`notify: true` ไปเป็นการส่งผ่าน webhook แบบชัดเจนเมื่อมีการกำหนดค่า `cron.webhook`

## การแก้ไขทั่วไป

อัปเดตการตั้งค่าการส่งโดยไม่เปลี่ยนข้อความ:

```bash
openclaw cron edit <job-id> --announce --channel telegram --to "123456789"
```

ปิดการส่งสำหรับงานแบบ isolated:

```bash
openclaw cron edit <job-id> --no-deliver
```

เปิดใช้บริบท bootstrap แบบน้ำหนักเบาสำหรับงานแบบ isolated:

```bash
openclaw cron edit <job-id> --light-context
```

ประกาศไปยังช่องทางที่ระบุ:

```bash
openclaw cron edit <job-id> --announce --channel slack --to "channel:C1234567890"
```

สร้างงานแบบ isolated พร้อมบริบท bootstrap แบบน้ำหนักเบา:

```bash
openclaw cron add \
  --name "Lightweight morning brief" \
  --cron "0 7 * * *" \
  --session isolated \
  --message "Summarize overnight updates." \
  --light-context \
  --no-deliver
```

`--light-context` ใช้กับงาน agent-turn แบบ isolated เท่านั้น สำหรับการรัน cron โหมดน้ำหนักเบาจะคงบริบท bootstrap ให้เป็นค่าว่างแทนการ inject ชุด bootstrap ของเวิร์กสเปซแบบเต็ม

หมายเหตุเรื่องความเป็นเจ้าของการส่ง:

- การส่งแชตของ cron แบบ isolated ใช้ร่วมกัน เอเจนต์สามารถส่งโดยตรงด้วย
  เครื่องมือ `message` เมื่อมีเส้นทางแชตพร้อมใช้งาน
- `announce` จะส่งคำตอบสุดท้ายแบบสำรองเฉพาะเมื่อเอเจนต์ไม่ได้ส่ง
  ตรงไปยังเป้าหมายที่ resolve แล้ว `webhook` จะโพสต์เพย์โหลดที่เสร็จแล้วไปยัง URL
  ส่วน `none` จะปิดการส่งสำรองของตัวรัน

## คำสั่งผู้ดูแลระบบทั่วไป

การรันด้วยตนเอง:

```bash
openclaw cron list
openclaw cron show <job-id>
openclaw cron run <job-id>
openclaw cron run <job-id> --due
openclaw cron runs --id <job-id> --limit 50
```

รายการ `cron runs` จะรวมข้อมูลวินิจฉัยการส่ง โดยมีเป้าหมาย cron ที่ตั้งใจไว้
เป้าหมายที่ resolve แล้ว การส่งผ่านเครื่องมือข้อความ การใช้ fallback และสถานะการส่งสำเร็จ

การเปลี่ยนเป้าหมายเอเจนต์/เซสชัน:

```bash
openclaw cron edit <job-id> --agent ops
openclaw cron edit <job-id> --clear-agent
openclaw cron edit <job-id> --session current
openclaw cron edit <job-id> --session "session:daily-brief"
```

การปรับแต่งการส่ง:

```bash
openclaw cron edit <job-id> --announce --channel slack --to "channel:C1234567890"
openclaw cron edit <job-id> --best-effort-deliver
openclaw cron edit <job-id> --no-best-effort-deliver
openclaw cron edit <job-id> --no-deliver
```

หมายเหตุเกี่ยวกับการส่งเมื่อเกิดความล้มเหลว:

- รองรับ `delivery.failureDestination` สำหรับงานแบบ isolated
- งานเซสชัน main สามารถใช้ `delivery.failureDestination` ได้เฉพาะเมื่อ
  โหมดการส่งหลักคือ `webhook`
- หากคุณไม่ได้ตั้งค่าปลายทางความล้มเหลวไว้เลย และงานนั้นประกาศไปยัง
  ช่องทางอยู่แล้ว การแจ้งเตือนความล้มเหลวจะใช้เป้าหมาย announce เดิมนั้นซ้ำ
