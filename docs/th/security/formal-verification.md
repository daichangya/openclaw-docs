---
permalink: /security/formal-verification/
read_when:
    - การทบทวนการรับประกันหรือข้อจำกัดของโมเดลความปลอดภัยแบบ formal
    - การทำซ้ำหรืออัปเดตการตรวจสอบโมเดลความปลอดภัย TLA+/TLC
summary: โมเดลความปลอดภัยที่ตรวจสอบด้วยเครื่องสำหรับเส้นทางที่มีความเสี่ยงสูงสุดของ OpenClaw
title: Formal Verification (โมเดลความปลอดภัย)
x-i18n:
    generated_at: "2026-04-23T05:56:47Z"
    model: gpt-5.4
    provider: openai
    source_hash: 0f7cd2461dcc00d320a5210e50279d76a7fa84e0830c440398323d75e262a38a
    source_path: security/formal-verification.md
    workflow: 15
---

# Formal Verification (โมเดลความปลอดภัย)

หน้านี้ติดตาม **โมเดลความปลอดภัยแบบ formal** ของ OpenClaw (ปัจจุบันคือ TLA+/TLC; และอื่น ๆ ตามความจำเป็น)

> หมายเหตุ: ลิงก์เก่าบางส่วนอาจอ้างถึงชื่อโครงการก่อนหน้า

**เป้าหมาย (วิสัยทัศน์หลัก):** ให้เหตุผลที่ตรวจสอบด้วยเครื่องว่า OpenClaw บังคับใช้นโยบายความปลอดภัยตามที่ตั้งใจไว้
(การกำหนดสิทธิ์ การแยกเซสชัน การควบคุมการใช้ tool และความปลอดภัยจากการกำหนดค่าผิดพลาด) ภายใต้สมมติฐานที่ระบุชัดเจน

**สิ่งที่หน้านี้เป็นอยู่ (ในปัจจุบัน):** ชุด **security regression** แบบรันได้ซึ่งขับเคลื่อนโดยผู้โจมตี

- ทุกข้ออ้างมีการตรวจสอบโมเดลที่รันได้บน finite state space
- หลายข้ออ้างมี **negative model** ที่จับคู่กัน ซึ่งสร้าง counterexample trace สำหรับคลาสของบั๊กที่สมจริง

**สิ่งที่หน้านี้ยังไม่เป็น (ในตอนนี้):** ไม่ใช่ข้อพิสูจน์ว่า “OpenClaw ปลอดภัยในทุกแง่มุม” หรือว่า implementation TypeScript ทั้งหมดถูกต้อง

## ตำแหน่งที่เก็บโมเดล

โมเดลถูกดูแลใน repo แยก: [vignesh07/openclaw-formal-models](https://github.com/vignesh07/openclaw-formal-models)

## ข้อควรระวังสำคัญ

- นี่คือ **โมเดล** ไม่ใช่ implementation TypeScript เต็มรูปแบบ ความคลาดเคลื่อนระหว่างโมเดลกับโค้ดจริงเป็นไปได้
- ผลลัพธ์ถูกจำกัดด้วย state space ที่ TLC สำรวจ “เขียว” ไม่ได้หมายความว่าปลอดภัยเกินกว่าสมมติฐานและขอบเขตที่อยู่ในโมเดล
- บางข้ออ้างอิงกับสมมติฐานของสภาพแวดล้อมอย่างชัดเจน (เช่น การติดตั้งถูกต้อง อินพุตการกำหนดค่าถูกต้อง)

## การทำซ้ำผลลัพธ์

ปัจจุบัน สามารถทำซ้ำผลลัพธ์ได้โดย clone repo ของโมเดลในเครื่องและรัน TLC (ดูด้านล่าง) ในอนาคตอาจมี:

- โมเดลที่รันใน CI พร้อม artifact สาธารณะ (counterexample trace, run log)
- เวิร์กโฟลว์แบบโฮสต์ “รันโมเดลนี้” สำหรับการตรวจสอบขนาดเล็กที่มีขอบเขตจำกัด

เริ่มต้น:

```bash
git clone https://github.com/vignesh07/openclaw-formal-models
cd openclaw-formal-models

# ต้องใช้ Java 11+ (TLC รันบน JVM)
# repo นี้ vendor `tla2tools.jar` ที่ปักหมุดไว้ (เครื่องมือ TLA+) และมี `bin/tlc` + Make target ให้

make <target>
```

### การเปิดเผย Gateway และการกำหนดค่า gateway แบบเปิด

**ข้ออ้าง:** การ bind เกิน loopback โดยไม่มี auth อาจทำให้การบุกรุกจากระยะไกลเป็นไปได้ / เพิ่มการเปิดเผย; token/password บล็อกผู้โจมตีที่ไม่มีสิทธิ์ (ภายใต้สมมติฐานของโมเดล)

- การรันแบบเขียว:
  - `make gateway-exposure-v2`
  - `make gateway-exposure-v2-protected`
- แบบแดง (คาดไว้):
  - `make gateway-exposure-v2-negative`

ดูเพิ่มเติม: `docs/gateway-exposure-matrix.md` ใน repo ของโมเดล

### ไปป์ไลน์ node exec (capability ที่มีความเสี่ยงสูงสุด)

**ข้ออ้าง:** `exec host=node` ต้องการ (a) allowlist ของคำสั่ง node พร้อมคำสั่งที่ประกาศไว้ และ (b) การอนุมัติแบบ live เมื่อถูกกำหนดค่าไว้; การอนุมัติถูกทำให้มี token เพื่อป้องกัน replay (ในโมเดล)

- การรันแบบเขียว:
  - `make nodes-pipeline`
  - `make approvals-token`
- แบบแดง (คาดไว้):
  - `make nodes-pipeline-negative`
  - `make approvals-token-negative`

### pairing store (DM gating)

**ข้ออ้าง:** คำขอ pairing เคารพ TTL และจำนวนสูงสุดของ pending request

- การรันแบบเขียว:
  - `make pairing`
  - `make pairing-cap`
- แบบแดง (คาดไว้):
  - `make pairing-negative`
  - `make pairing-cap-negative`

### ingress gating (mentions + control-command bypass)

**ข้ออ้าง:** ในบริบทกลุ่มที่ต้อง mention คำสั่ง “control command” ที่ไม่ได้รับอนุญาตไม่สามารถ bypass mention gating ได้

- แบบเขียว:
  - `make ingress-gating`
- แบบแดง (คาดไว้):
  - `make ingress-gating-negative`

### การแยกเส้นทาง/คีย์เซสชัน

**ข้ออ้าง:** DM จาก peer ที่ต่างกันจะไม่ถูกรวมเข้าเซสชันเดียวกัน เว้นแต่จะมีการเชื่อมโยง/กำหนดค่าไว้อย่างชัดเจน

- แบบเขียว:
  - `make routing-isolation`
- แบบแดง (คาดไว้):
  - `make routing-isolation-negative`

## v1++: โมเดลที่มีขอบเขตจำกัดเพิ่มเติม (concurrency, retries, trace correctness)

นี่คือโมเดลต่อเนื่องที่เพิ่มความเที่ยงตรงให้ใกล้กับโหมดล้มเหลวในโลกจริงมากขึ้น (การอัปเดตที่ไม่เป็นอะตอม การลองใหม่ และ message fan-out)

### pairing store concurrency / idempotency

**ข้ออ้าง:** pairing store ควรบังคับใช้ `MaxPending` และ idempotency ได้แม้อยู่ภายใต้การสลับลำดับ (กล่าวคือ “check-then-write” ต้องเป็นอะตอม/ล็อก; การ refresh ไม่ควรสร้างข้อมูลซ้ำ)

ความหมายคือ:

- ภายใต้คำขอพร้อมกัน จะเกิน `MaxPending` สำหรับแชนเนลหนึ่งไม่ได้
- คำขอ/การ refresh ซ้ำสำหรับ `(channel, sender)` เดียวกัน ไม่ควรสร้างแถว pending ที่ยัง active ซ้ำ

- การรันแบบเขียว:
  - `make pairing-race` (การตรวจ cap แบบอะตอมหรือมีล็อก)
  - `make pairing-idempotency`
  - `make pairing-refresh`
  - `make pairing-refresh-race`
- แบบแดง (คาดไว้):
  - `make pairing-race-negative` (การแข่งขันของ cap ระหว่าง begin/commit แบบไม่เป็นอะตอม)
  - `make pairing-idempotency-negative`
  - `make pairing-refresh-negative`
  - `make pairing-refresh-race-negative`

### ingress trace correlation / idempotency

**ข้ออ้าง:** ingestion ควรคง trace correlation ผ่าน fan-out และมี idempotency ภายใต้การ retry ของ provider

ความหมายคือ:

- เมื่อหนึ่ง external event กลายเป็นหลาย internal message ทุกส่วนต้องคงตัวตน trace/event เดียวกัน
- การ retry ต้องไม่ทำให้เกิดการประมวลผลซ้ำสองครั้ง
- หากไม่มี provider event ID, การ dedupe จะ fallback ไปใช้ key ที่ปลอดภัย (เช่น trace ID) เพื่อหลีกเลี่ยงการทิ้ง event คนละตัวโดยผิดพลาด

- แบบเขียว:
  - `make ingress-trace`
  - `make ingress-trace2`
  - `make ingress-idempotency`
  - `make ingress-dedupe-fallback`
- แบบแดง (คาดไว้):
  - `make ingress-trace-negative`
  - `make ingress-trace2-negative`
  - `make ingress-idempotency-negative`
  - `make ingress-dedupe-fallback-negative`

### ลำดับความสำคัญของ routing dmScope + identityLinks

**ข้ออ้าง:** routing ต้องคง DM session ให้แยกจากกันโดยค่าเริ่มต้น และจะรวมเซสชันได้เฉพาะเมื่อมีการกำหนดค่าไว้อย่างชัดเจน (ลำดับความสำคัญของแชนเนล + identity link)

ความหมายคือ:

- การแทนที่ dmScope แบบเฉพาะแชนเนลต้องมีสิทธิ์เหนือกว่าค่าเริ่มต้นระดับ global
- identityLinks ควรรวมเซสชันเฉพาะภายในกลุ่มที่เชื่อมโยงไว้อย่างชัดเจน ไม่ใช่ข้าม peer ที่ไม่เกี่ยวข้อง

- แบบเขียว:
  - `make routing-precedence`
  - `make routing-identitylinks`
- แบบแดง (คาดไว้):
  - `make routing-precedence-negative`
  - `make routing-identitylinks-negative`
