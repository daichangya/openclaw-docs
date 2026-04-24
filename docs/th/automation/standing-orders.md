---
read_when:
    - การตั้งค่าเวิร์กโฟลว์เอเจนต์อัตโนมัติที่ทำงานโดยไม่ต้องมีพรอมป์ต่อแต่ละงาน
    - การกำหนดสิ่งที่เอเจนต์สามารถทำได้อย่างอิสระ เทียบกับสิ่งที่ต้องได้รับการอนุมัติจากมนุษย์
    - การจัดโครงสร้างเอเจนต์หลายโปรแกรมให้มีขอบเขตที่ชัดเจนและกฎการยกระดับที่ชัดเจน
summary: กำหนดอำนาจการดำเนินงานถาวรสำหรับโปรแกรมเอเจนต์อัตโนมัติ
title: คำสั่งถาวร
x-i18n:
    generated_at: "2026-04-24T08:57:14Z"
    model: gpt-5.4
    provider: openai
    source_hash: a69cd16b23caedea5020e6bf6dfbe4f77b5bcd5a329af7dfcf535c6aa0924ce4
    source_path: automation/standing-orders.md
    workflow: 15
---

คำสั่งถาวรมอบ **อำนาจการดำเนินงานถาวร** ให้เอเจนต์ของคุณสำหรับโปรแกรมที่กำหนดไว้ แทนที่จะต้องให้คำสั่งงานทีละรายการทุกครั้ง คุณจะกำหนดโปรแกรมพร้อมขอบเขต ทริกเกอร์ และกฎการยกระดับที่ชัดเจน — แล้วเอเจนต์จะดำเนินการโดยอัตโนมัติภายในขอบเขตเหล่านั้น

นี่คือความแตกต่างระหว่างการบอกผู้ช่วยของคุณว่า "ส่งรายงานประจำสัปดาห์" ทุกวันศุกร์ กับการมอบอำนาจถาวรว่า: "คุณรับผิดชอบรายงานประจำสัปดาห์ รวบรวมมันทุกวันศุกร์ ส่งมันออกไป และยกระดับเฉพาะเมื่อมีบางอย่างดูผิดปกติ"

## ทำไมต้องใช้คำสั่งถาวร?

**หากไม่มีคำสั่งถาวร:**

- คุณต้องพรอมป์เอเจนต์สำหรับทุกงาน
- เอเจนต์จะว่างงานระหว่างคำขอ
- งานประจำจะถูกลืมหรือล่าช้า
- คุณกลายเป็นคอขวด

**เมื่อมีคำสั่งถาวร:**

- เอเจนต์ทำงานโดยอัตโนมัติภายในขอบเขตที่กำหนด
- งานประจำเกิดขึ้นตามกำหนดโดยไม่ต้องพรอมป์
- คุณมีส่วนร่วมเฉพาะกรณียกเว้นและการอนุมัติ
- เอเจนต์ใช้เวลาว่างให้เกิดประโยชน์

## วิธีการทำงาน

คำสั่งถาวรถูกกำหนดไว้ในไฟล์ [พื้นที่ทำงานเอเจนต์](/th/concepts/agent-workspace) ของคุณ วิธีที่แนะนำคือใส่ไว้โดยตรงใน `AGENTS.md` (ซึ่งจะถูกฉีดเข้าไปอัตโนมัติทุกเซสชัน) เพื่อให้เอเจนต์มีบริบทนี้เสมอ สำหรับการตั้งค่าที่ใหญ่ขึ้น คุณยังสามารถวางไว้ในไฟล์เฉพาะอย่าง `standing-orders.md` แล้วอ้างอิงจาก `AGENTS.md`

แต่ละโปรแกรมจะระบุ:

1. **ขอบเขต** — สิ่งที่เอเจนต์ได้รับอนุญาตให้ทำ
2. **ทริกเกอร์** — ควรดำเนินการเมื่อใด (ตามกำหนดเวลา เหตุการณ์ หรือเงื่อนไข)
3. **จุดตรวจการอนุมัติ** — สิ่งใดที่ต้องได้รับการลงนามอนุมัติจากมนุษย์ก่อนดำเนินการ
4. **กฎการยกระดับ** — ควรหยุดและขอความช่วยเหลือเมื่อใด

เอเจนต์จะโหลดคำสั่งเหล่านี้ทุกเซสชันผ่านไฟล์บูตสแตรปของพื้นที่ทำงาน (ดู [พื้นที่ทำงานเอเจนต์](/th/concepts/agent-workspace) สำหรับรายการไฟล์ที่ถูกฉีดอัตโนมัติทั้งหมด) และดำเนินการตามคำสั่งเหล่านั้นร่วมกับ [งาน Cron](/th/automation/cron-jobs) เพื่อบังคับใช้ตามเวลา

<Tip>
ใส่คำสั่งถาวรไว้ใน `AGENTS.md` เพื่อรับประกันว่าจะถูกโหลดในทุกเซสชัน การบูตสแตรปของพื้นที่ทำงานจะฉีด `AGENTS.md`, `SOUL.md`, `TOOLS.md`, `IDENTITY.md`, `USER.md`, `HEARTBEAT.md`, `BOOTSTRAP.md` และ `MEMORY.md` โดยอัตโนมัติ — แต่จะไม่ฉีดไฟล์ตามอำเภอใจในไดเรกทอรีย่อย
</Tip>

## องค์ประกอบของคำสั่งถาวร

```markdown
## Program: Weekly Status Report

**Authority:** Compile data, generate report, deliver to stakeholders
**Trigger:** Every Friday at 4 PM (enforced via cron job)
**Approval gate:** None for standard reports. Flag anomalies for human review.
**Escalation:** If data source is unavailable or metrics look unusual (>2σ from norm)

### Execution Steps

1. Pull metrics from configured sources
2. Compare to prior week and targets
3. Generate report in Reports/weekly/YYYY-MM-DD.md
4. Deliver summary via configured channel
5. Log completion to Agent/Logs/

### What NOT to Do

- Do not send reports to external parties
- Do not modify source data
- Do not skip delivery if metrics look bad — report accurately
```

## คำสั่งถาวร + งาน Cron

คำสั่งถาวรกำหนดว่าเอเจนต์ได้รับอนุญาตให้ทำ **อะไร** ส่วน [งาน Cron](/th/automation/cron-jobs) กำหนดว่า **เมื่อใด** ที่จะเกิดขึ้น ทั้งสองอย่างทำงานร่วมกัน:

```
Standing Order: "You own the daily inbox triage"
    ↓
Cron Job (8 AM daily): "Execute inbox triage per standing orders"
    ↓
Agent: Reads standing orders → executes steps → reports results
```

พรอมป์ของงาน Cron ควรอ้างอิงถึงคำสั่งถาวร แทนที่จะทำซ้ำเนื้อหาเดิม:

```bash
openclaw cron add \
  --name daily-inbox-triage \
  --cron "0 8 * * 1-5" \
  --tz America/New_York \
  --timeout-seconds 300 \
  --announce \
  --channel bluebubbles \
  --to "+1XXXXXXXXXX" \
  --message "Execute daily inbox triage per standing orders. Check mail for new alerts. Parse, categorize, and persist each item. Report summary to owner. Escalate unknowns."
```

## ตัวอย่าง

### ตัวอย่างที่ 1: เนื้อหาและโซเชียลมีเดีย (รอบรายสัปดาห์)

```markdown
## Program: Content & Social Media

**Authority:** Draft content, schedule posts, compile engagement reports
**Approval gate:** All posts require owner review for first 30 days, then standing approval
**Trigger:** Weekly cycle (Monday review → mid-week drafts → Friday brief)

### Weekly Cycle

- **Monday:** Review platform metrics and audience engagement
- **Tuesday–Thursday:** Draft social posts, create blog content
- **Friday:** Compile weekly marketing brief → deliver to owner

### Content Rules

- Voice must match the brand (see SOUL.md or brand voice guide)
- Never identify as AI in public-facing content
- Include metrics when available
- Focus on value to audience, not self-promotion
```

### ตัวอย่างที่ 2: การดำเนินงานด้านการเงิน (ทริกเกอร์ตามเหตุการณ์)

```markdown
## Program: Financial Processing

**Authority:** Process transaction data, generate reports, send summaries
**Approval gate:** None for analysis. Recommendations require owner approval.
**Trigger:** New data file detected OR scheduled monthly cycle

### When New Data Arrives

1. Detect new file in designated input directory
2. Parse and categorize all transactions
3. Compare against budget targets
4. Flag: unusual items, threshold breaches, new recurring charges
5. Generate report in designated output directory
6. Deliver summary to owner via configured channel

### Escalation Rules

- Single item > $500: immediate alert
- Category > budget by 20%: flag in report
- Unrecognizable transaction: ask owner for categorization
- Failed processing after 2 retries: report failure, do not guess
```

### ตัวอย่างที่ 3: การมอนิเตอร์และการแจ้งเตือน (ต่อเนื่อง)

```markdown
## Program: System Monitoring

**Authority:** Check system health, restart services, send alerts
**Approval gate:** Restart services automatically. Escalate if restart fails twice.
**Trigger:** Every heartbeat cycle

### Checks

- Service health endpoints responding
- Disk space above threshold
- Pending tasks not stale (>24 hours)
- Delivery channels operational

### Response Matrix

| Condition        | Action                   | Escalate?                |
| ---------------- | ------------------------ | ------------------------ |
| Service down     | Restart automatically    | Only if restart fails 2x |
| Disk space < 10% | Alert owner              | Yes                      |
| Stale task > 24h | Remind owner             | No                       |
| Channel offline  | Log and retry next cycle | If offline > 2 hours     |
```

## รูปแบบ Execute-Verify-Report

คำสั่งถาวรจะทำงานได้ดีที่สุดเมื่อใช้ร่วมกับวินัยในการปฏิบัติงานที่เข้มงวด ทุกงานในคำสั่งถาวรควรเป็นไปตามลูปนี้:

1. **ดำเนินการ** — ทำงานจริง (ไม่ใช่เพียงรับทราบคำสั่ง)
2. **ตรวจสอบยืนยัน** — ยืนยันว่าผลลัพธ์ถูกต้อง (ไฟล์มีอยู่จริง ข้อความถูกส่งแล้ว ข้อมูลถูกแยกวิเคราะห์แล้ว)
3. **รายงาน** — แจ้งเจ้าของว่าทำอะไรไปแล้ว และตรวจสอบยืนยันอะไรแล้วบ้าง

```markdown
### Execution Rules

- Every task follows Execute-Verify-Report. No exceptions.
- "I'll do that" is not execution. Do it, then report.
- "Done" without verification is not acceptable. Prove it.
- If execution fails: retry once with adjusted approach.
- If still fails: report failure with diagnosis. Never silently fail.
- Never retry indefinitely — 3 attempts max, then escalate.
```

รูปแบบนี้ช่วยป้องกันโหมดความล้มเหลวที่พบบ่อยที่สุดของเอเจนต์: รับทราบงานแต่ไม่ทำให้เสร็จ

## สถาปัตยกรรมหลายโปรแกรม

สำหรับเอเจนต์ที่ดูแลหลายส่วนงาน ให้จัดคำสั่งถาวรเป็นโปรแกรมแยกกันพร้อมขอบเขตที่ชัดเจน:

```markdown
# Standing Orders

## Program 1: [Domain A] (Weekly)

...

## Program 2: [Domain B] (Monthly + On-Demand)

...

## Program 3: [Domain C] (As-Needed)

...

## Escalation Rules (All Programs)

- [Common escalation criteria]
- [Approval gates that apply across programs]
```

แต่ละโปรแกรมควรมี:

- **รอบทริกเกอร์** ของตัวเอง (รายสัปดาห์ รายเดือน ขับเคลื่อนด้วยเหตุการณ์ หรือแบบต่อเนื่อง)
- **จุดตรวจการอนุมัติ** ของตัวเอง (บางโปรแกรมต้องการการกำกับดูแลมากกว่าโปรแกรมอื่น)
- **ขอบเขต** ที่ชัดเจน (เอเจนต์ควรรู้ว่าโปรแกรมหนึ่งจบตรงไหนและอีกโปรแกรมเริ่มตรงไหน)

## แนวทางปฏิบัติที่ดีที่สุด

### ควรทำ

- เริ่มด้วยอำนาจที่แคบก่อน แล้วค่อยขยายเมื่อความไว้วางใจเพิ่มขึ้น
- กำหนดจุดตรวจการอนุมัติอย่างชัดเจนสำหรับการดำเนินการที่มีความเสี่ยงสูง
- ใส่ส่วน "สิ่งที่ห้ามทำ" — ขอบเขตสำคัญพอ ๆ กับสิทธิ์ที่ได้รับ
- ใช้ร่วมกับงาน Cron เพื่อให้การทำงานตามเวลามีความน่าเชื่อถือ
- ตรวจสอบบันทึกของเอเจนต์ทุกสัปดาห์เพื่อยืนยันว่ามีการปฏิบัติตามคำสั่งถาวร
- อัปเดตคำสั่งถาวรเมื่อความต้องการของคุณเปลี่ยนไป — มันคือเอกสารที่มีชีวิต

### หลีกเลี่ยง

- มอบอำนาจกว้างขวางตั้งแต่วันแรก ("ทำอะไรก็ได้ที่คุณคิดว่าดีที่สุด")
- ข้ามกฎการยกระดับ — ทุกโปรแกรมต้องมีเงื่อนไข "เมื่อใดควรหยุดและถาม"
- คิดว่าเอเจนต์จะจำคำสั่งด้วยวาจาได้ — ใส่ทุกอย่างไว้ในไฟล์
- ปะปนหลายเรื่องไว้ในโปรแกรมเดียว — แยกโปรแกรมสำหรับแต่ละขอบเขตงาน
- ลืมบังคับใช้ด้วยงาน Cron — คำสั่งถาวรที่ไม่มีทริกเกอร์จะกลายเป็นเพียงข้อเสนอแนะ

## ที่เกี่ยวข้อง

- [Automation & Tasks](/th/automation) — ภาพรวมของกลไกอัตโนมัติทั้งหมด
- [งาน Cron](/th/automation/cron-jobs) — การบังคับใช้ตามกำหนดเวลาสำหรับคำสั่งถาวร
- [Hooks](/th/automation/hooks) — สคริปต์ที่ขับเคลื่อนด้วยเหตุการณ์สำหรับเหตุการณ์ในวงจรชีวิตของเอเจนต์
- [Webhooks](/th/automation/cron-jobs#webhooks) — ทริกเกอร์เหตุการณ์ HTTP ขาเข้า
- [พื้นที่ทำงานเอเจนต์](/th/concepts/agent-workspace) — ตำแหน่งที่คำสั่งถาวรอยู่ รวมถึงรายการทั้งหมดของไฟล์บูตสแตรปที่ถูกฉีดอัตโนมัติ (AGENTS.md, SOUL.md เป็นต้น)
