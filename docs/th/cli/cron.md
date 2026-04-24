---
read_when:
    - คุณต้องการงานที่ตั้งเวลาไว้และการปลุกให้ทำงาน
    - คุณกำลังแก้ไขปัญหาการทำงานและบันทึกของ Cron
summary: เอกสารอ้างอิง CLI สำหรับ `openclaw cron` (กำหนดเวลาและรันงานเบื้องหลัง)
title: Cron
x-i18n:
    generated_at: "2026-04-24T09:02:23Z"
    model: gpt-5.4
    provider: openai
    source_hash: d3f5c262092b9b5b821ec824bc02dbbd806936d91f1d03ac6eb789f7e71ffc07
    source_path: cli/cron.md
    workflow: 15
---

# `openclaw cron`

จัดการงาน Cron สำหรับตัวจัดตารางเวลาของ Gateway

ที่เกี่ยวข้อง:

- งาน Cron: [งาน Cron](/th/automation/cron-jobs)

เคล็ดลับ: รัน `openclaw cron --help` เพื่อดูพื้นผิวคำสั่งทั้งหมด

หมายเหตุ: `openclaw cron list` และ `openclaw cron show <job-id>` จะแสดงตัวอย่างเส้นทางการส่งที่ resolve แล้ว สำหรับ `channel: "last"` ตัวอย่างจะแสดงว่าเส้นทางนั้น resolve จากเซสชันหลัก/ปัจจุบัน หรือจะ fail closed

หมายเหตุ: งาน `cron add` แบบ isolated จะใช้การส่งแบบ `--announce` เป็นค่าเริ่มต้น ใช้ `--no-deliver` หากต้องการเก็บเอาต์พุตไว้ภายใน `--deliver` ยังคงอยู่ในฐานะ alias ที่เลิกใช้แล้วของ `--announce`

หมายเหตุ: การส่งไปยังแชตของ cron แบบ isolated เป็นแบบใช้ร่วมกัน `--announce` คือการส่งแบบ fallback ของ runner สำหรับคำตอบสุดท้าย; `--no-deliver` ปิด fallback นี้ แต่จะไม่ลบเครื่องมือ `message` ของเอเจนต์เมื่อมีเส้นทางแชตให้ใช้งาน

หมายเหตุ: งานแบบ one-shot (`--at`) จะถูกลบหลังจากสำเร็จโดยค่าเริ่มต้น ใช้ `--keep-after-run` หากต้องการเก็บไว้

หมายเหตุ: `--session` รองรับ `main`, `isolated`, `current` และ `session:<id>` ใช้ `current` เพื่อผูกกับเซสชันที่ใช้งานอยู่ในเวลาที่สร้าง หรือใช้ `session:<id>` สำหรับ session key แบบคงอยู่ที่ระบุชัดเจน

หมายเหตุ: สำหรับงาน CLI แบบ one-shot ค่า datetime ของ `--at` ที่ไม่มี offset จะถือเป็น UTC เว้นแต่คุณจะส่ง `--tz <iana>` ด้วย ซึ่งจะตีความเวลานาฬิกาท้องถิ่นนั้นใน timezone ที่กำหนด

หมายเหตุ: ตอนนี้งานแบบเกิดซ้ำใช้ exponential retry backoff หลังเกิดข้อผิดพลาดต่อเนื่อง (30 วินาที → 1 นาที → 5 นาที → 15 นาที → 60 นาที) จากนั้นจะกลับสู่ตารางปกติหลังจากการรันครั้งถัดไปที่สำเร็จ

หมายเหตุ: ตอนนี้ `openclaw cron run` จะคืนค่าทันทีที่การรันด้วยตนเองถูกเข้าคิวเพื่อดำเนินการ การตอบกลับที่สำเร็จจะมี `{ ok: true, enqueued: true, runId }`; ใช้ `openclaw cron runs --id <job-id>` เพื่อติดตามผลลัพธ์สุดท้าย

หมายเหตุ: `openclaw cron run <job-id>` จะบังคับรันโดยค่าเริ่มต้น ใช้ `--due` หากต้องการคงพฤติกรรมเดิมแบบ "รันเฉพาะเมื่อถึงกำหนด"

หมายเหตุ: เทิร์น cron แบบ isolated จะระงับคำตอบเก่าที่เป็นเพียงการรับทราบเท่านั้น หากผลลัพธ์แรกเป็นเพียงการอัปเดตสถานะชั่วคราว และไม่มีการรัน subagent ลูกหลานที่รับผิดชอบต่อคำตอบสุดท้าย cron จะพรอมป์ซ้ำหนึ่งครั้งเพื่อขอผลลัพธ์จริงก่อนส่ง

หมายเหตุ: หากการรันแบบ isolated คืนค่าเฉพาะโทเค็นเงียบ (`NO_REPLY` / `no_reply`) cron จะระงับทั้งการส่งขาออกโดยตรงและเส้นทางสรุปแบบเข้าคิว fallback ด้วย ดังนั้นจะไม่มีอะไรถูกโพสต์กลับไปยังแชต

หมายเหตุ: `cron add|edit --model ...` จะใช้ allowed model ที่เลือกนั้นสำหรับงาน หาก model ไม่ได้รับอนุญาต cron จะเตือนและ fallback ไปใช้การเลือก model ของเอเจนต์/ค่าเริ่มต้นของงานแทน ห่วงโซ่ fallback ที่กำหนดค่าไว้ยังคงมีผล แต่การ override model แบบธรรมดาที่ไม่มีรายการ fallback ต่อ-งานแบบ explicit จะไม่ผนวก model หลักของเอเจนต์เป็นเป้าหมาย retry เพิ่มเติมแบบซ่อนอยู่อีกต่อไป

หมายเหตุ: ลำดับความสำคัญของ model สำหรับ cron แบบ isolated คือ override ของ Gmail hook ก่อน จากนั้นเป็น `--model` ต่อ-งาน จากนั้นเป็น cron-session model override ที่จัดเก็บไว้ แล้วจึงเป็นการเลือกเอเจนต์/ค่าเริ่มต้นตามปกติ

หมายเหตุ: fast mode ของ cron แบบ isolated จะเป็นไปตามการเลือก live model ที่ resolve แล้ว โดย `params.fastMode` ใน config ของ model จะมีผลโดยค่าเริ่มต้น แต่ session `fastMode` override ที่จัดเก็บไว้ยังคงมีลำดับความสำคัญเหนือ config

หมายเหตุ: หากการรันแบบ isolated โยน `LiveSessionModelSwitchError` cron จะบันทึก provider/model ที่สลับแล้ว (และ auth profile override ที่สลับแล้วหากมี) ก่อนลองใหม่ ลูป retry ภายนอกถูกจำกัดไว้ที่ 2 ครั้งของ switch retry หลังจากความพยายามเริ่มต้น จากนั้นจะยกเลิกแทนที่จะวนลูปไม่สิ้นสุด

หมายเหตุ: การแจ้งเตือนความล้มเหลวจะใช้ `delivery.failureDestination` ก่อน จากนั้นเป็น `cron.failureDestination` แบบส่วนกลาง และสุดท้าย fallback ไปยังเป้าหมาย announce หลักของงานเมื่อไม่มีการกำหนด failure destination แบบ explicit

หมายเหตุ: การเก็บรักษา/การล้างถูกควบคุมใน config:

- `cron.sessionRetention` (ค่าเริ่มต้น `24h`) จะล้างเซสชันการรันแบบ isolated ที่เสร็จสมบูรณ์แล้ว
- `cron.runLog.maxBytes` + `cron.runLog.keepLines` จะล้าง `~/.openclaw/cron/runs/<jobId>.jsonl`

หมายเหตุการอัปเกรด: หากคุณมีงาน cron รุ่นเก่าจากก่อนรูปแบบ delivery/store ปัจจุบัน ให้รัน `openclaw doctor --fix` ตอนนี้ Doctor จะ normalize ฟิลด์ cron แบบ legacy (`jobId`, `schedule.cron`, ฟิลด์ delivery ระดับบนสุดรวมถึง `threadId` แบบ legacy, alias delivery แบบ `provider` ใน payload) และย้ายงาน webhook fallback แบบง่ายที่มี `notify: true` ไปเป็นการส่ง webhook แบบ explicit เมื่อมีการกำหนด `cron.webhook`

## การแก้ไขที่พบบ่อย

อัปเดตการตั้งค่าการส่งโดยไม่เปลี่ยนข้อความ:

```bash
openclaw cron edit <job-id> --announce --channel telegram --to "123456789"
```

ปิดใช้งานการส่งสำหรับงานแบบ isolated:

```bash
openclaw cron edit <job-id> --no-deliver
```

เปิดใช้งานบริบท bootstrap แบบเบาสำหรับงานแบบ isolated:

```bash
openclaw cron edit <job-id> --light-context
```

ประกาศไปยังช่องทางที่ระบุ:

```bash
openclaw cron edit <job-id> --announce --channel slack --to "channel:C1234567890"
```

สร้างงานแบบ isolated พร้อมบริบท bootstrap แบบเบา:

```bash
openclaw cron add \
  --name "Lightweight morning brief" \
  --cron "0 7 * * *" \
  --session isolated \
  --message "Summarize overnight updates." \
  --light-context \
  --no-deliver
```

`--light-context` ใช้ได้เฉพาะกับงาน agent-turn cron แบบ isolated เท่านั้น สำหรับการรัน cron โหมด lightweight จะคงบริบท bootstrap ให้เป็นค่าว่างแทนการฉีดชุด workspace bootstrap ทั้งหมด

หมายเหตุเรื่องความเป็นเจ้าของการส่ง:

- การส่งไปยังแชตของ cron แบบ isolated เป็นแบบใช้ร่วมกัน เอเจนต์สามารถส่งโดยตรงด้วยเครื่องมือ `message` ได้เมื่อมีเส้นทางแชตให้ใช้งาน
- `announce` จะส่งคำตอบสุดท้ายแบบ fallback เฉพาะเมื่อเอเจนต์ไม่ได้ส่งตรงไปยังเป้าหมายที่ resolve แล้ว `webhook` จะโพสต์ payload ที่เสร็จสมบูรณ์ไปยัง URL ส่วน `none` จะปิดการส่ง fallback ของ runner

## คำสั่งดูแลระบบที่พบบ่อย

การรันด้วยตนเอง:

```bash
openclaw cron list
openclaw cron show <job-id>
openclaw cron run <job-id>
openclaw cron run <job-id> --due
openclaw cron runs --id <job-id> --limit 50
```

รายการ `cron runs` มีข้อมูลวินิจฉัยการส่ง รวมถึงเป้าหมาย cron ที่ตั้งใจไว้ เป้าหมายที่ resolve แล้ว การส่งด้วยเครื่องมือ message การใช้ fallback และสถานะที่ส่งแล้ว

การเปลี่ยนเป้าหมายเอเจนต์/เซสชัน:

```bash
openclaw cron edit <job-id> --agent ops
openclaw cron edit <job-id> --clear-agent
openclaw cron edit <job-id> --session current
openclaw cron edit <job-id> --session "session:daily-brief"
```

การปรับการส่ง:

```bash
openclaw cron edit <job-id> --announce --channel slack --to "channel:C1234567890"
openclaw cron edit <job-id> --best-effort-deliver
openclaw cron edit <job-id> --no-best-effort-deliver
openclaw cron edit <job-id> --no-deliver
```

หมายเหตุเรื่องการส่งเมื่อเกิดความล้มเหลว:

- รองรับ `delivery.failureDestination` สำหรับงานแบบ isolated
- งานเซสชันหลักสามารถใช้ `delivery.failureDestination` ได้เฉพาะเมื่อโหมดการส่งหลักเป็น `webhook`
- หากคุณไม่ได้ตั้ง failure destination ใดไว้เลย และงานนั้นประกาศไปยังช่องทางอยู่แล้ว การแจ้งเตือนความล้มเหลวจะใช้เป้าหมาย announce เดิมนั้นซ้ำ

## ที่เกี่ยวข้อง

- [เอกสารอ้างอิง CLI](/th/cli)
- [งานที่ตั้งเวลาไว้](/th/automation/cron-jobs)
