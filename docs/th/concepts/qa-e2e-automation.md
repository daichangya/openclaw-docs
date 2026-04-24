---
read_when:
    - การขยาย qa-lab หรือ qa-channel
    - การเพิ่มสถานการณ์ QA ที่อิงกับ repo
    - การสร้างระบบอัตโนมัติ QA ที่มีความสมจริงสูงขึ้นรอบแดชบอร์ด Gateway
summary: รูปแบบระบบอัตโนมัติ QA แบบส่วนตัวสำหรับ qa-lab, qa-channel, สถานการณ์ทดสอบแบบมี seed และรายงานโปรโตคอล
title: ระบบอัตโนมัติ QA E2E
x-i18n:
    generated_at: "2026-04-24T09:07:11Z"
    model: gpt-5.4
    provider: openai
    source_hash: bbde51169a1572dc6753ab550ca29ca98abb2394e8991a8482bd7b66ea80ce76
    source_path: concepts/qa-e2e-automation.md
    workflow: 15
---

สแตก QA แบบส่วนตัวถูกออกแบบมาเพื่อทดสอบ OpenClaw ในรูปแบบที่สมจริงและมีลักษณะ
ใกล้เคียงกับช่องทางมากกว่าที่ unit test เดี่ยวจะทำได้

องค์ประกอบปัจจุบัน:

- `extensions/qa-channel`: ช่องทางข้อความสังเคราะห์ที่มีพื้นผิวสำหรับ DM, channel, thread,
  reaction, edit และ delete
- `extensions/qa-lab`: UI สำหรับดีบักและ QA bus สำหรับสังเกตทรานสคริปต์,
  inject ข้อความขาเข้า และ export รายงาน Markdown
- `qa/`: seed asset ที่อิงกับ repo สำหรับงาน kickoff และสถานการณ์ QA
  พื้นฐาน

โฟลว์ผู้ปฏิบัติงาน QA ปัจจุบันเป็นไซต์ QA แบบสองพาเนล:

- ซ้าย: แดชบอร์ด Gateway (Control UI) พร้อมเอเจนต์
- ขวา: QA Lab ที่แสดงทรานสคริปต์สไตล์ Slack-ish และแผนสถานการณ์

รันด้วย:

```bash
pnpm qa:lab:up
```

คำสั่งนี้จะ build ไซต์ QA, เริ่ม lane gateway แบบ Docker-backed และเปิดเผย
หน้า QA Lab ที่ผู้ปฏิบัติงานหรือลูประบบอัตโนมัติสามารถมอบภารกิจ QA ให้เอเจนต์
สังเกตพฤติกรรมช่องทางจริง และบันทึกสิ่งที่ทำงานได้ ล้มเหลว หรือยังคงติดขัด

หากต้องการวนพัฒนา UI ของ QA Lab ให้เร็วขึ้นโดยไม่ต้อง rebuild Docker image ทุกครั้ง
ให้เริ่มสแตกด้วย QA Lab bundle แบบ bind-mounted:

```bash
pnpm openclaw qa docker-build-image
pnpm qa:lab:build
pnpm qa:lab:up:fast
pnpm qa:lab:watch
```

`qa:lab:up:fast` จะคงบริการ Docker ไว้บน image ที่ build ไว้ล่วงหน้า และ bind-mount
`extensions/qa-lab/web/dist` เข้าไปใน container `qa-lab` ส่วน `qa:lab:watch`
จะ rebuild bundle นี้เมื่อมีการเปลี่ยนแปลง และเบราว์เซอร์จะ reload อัตโนมัติเมื่อ hash ของ asset ใน QA Lab เปลี่ยน

สำหรับ lane smoke ของ Matrix ที่ใช้ transport จริง ให้รัน:

```bash
pnpm openclaw qa matrix
```

lane นี้จะ provision homeserver Tuwunel แบบชั่วคราวใน Docker, ลงทะเบียน
ผู้ใช้ชั่วคราวสำหรับ driver, SUT และ observer, สร้างห้องส่วนตัวหนึ่งห้อง จากนั้นรัน
Plugin Matrix จริงภายใน child gateway ของ QA live transport lane จะคงคอนฟิกของ child
ให้อยู่ในขอบเขตของ transport ที่กำลังทดสอบ ดังนั้น Matrix จะรันโดยไม่มี
`qa-channel` ในคอนฟิกของ child มันจะเขียน artifact รายงานแบบมีโครงสร้างและ
log stdout/stderr แบบรวมลงในไดเรกทอรีผลลัพธ์ Matrix QA ที่เลือก หากต้องการเก็บ
เอาต์พุต build/launcher ของ `scripts/run-node.mjs` ภายนอกด้วย ให้ตั้ง
`OPENCLAW_RUN_NODE_OUTPUT_LOG=<path>` ไปยังไฟล์ log ที่อยู่ภายใน repo

สำหรับ lane smoke ของ Telegram ที่ใช้ transport จริง ให้รัน:

```bash
pnpm openclaw qa telegram
```

lane นี้จะกำหนดเป้าหมายไปที่กลุ่ม Telegram ส่วนตัวจริงหนึ่งกลุ่ม แทนการ provision
เซิร์ฟเวอร์ชั่วคราว โดยต้องใช้ `OPENCLAW_QA_TELEGRAM_GROUP_ID`,
`OPENCLAW_QA_TELEGRAM_DRIVER_BOT_TOKEN` และ
`OPENCLAW_QA_TELEGRAM_SUT_BOT_TOKEN` รวมถึงบอต 2 ตัวที่แตกต่างกันในกลุ่มส่วนตัวเดียวกัน
บอต SUT ต้องมีชื่อผู้ใช้ Telegram และการสังเกตการณ์ bot-to-bot
จะทำงานได้ดีที่สุดเมื่อบอตทั้งสองเปิดใช้ Bot-to-Bot Communication Mode
ใน `@BotFather`
คำสั่งนี้จะออกด้วยสถานะ non-zero เมื่อสถานการณ์ใดล้มเหลว ใช้ `--allow-failures` เมื่อ
คุณต้องการ artifact โดยไม่ต้องการ exit code แบบล้มเหลว
รายงานและสรุปของ Telegram จะรวม RTT ต่อคำตอบ โดยวัดจากคำขอส่งข้อความของ driver
จนถึงคำตอบของ SUT ที่ถูกสังเกตเห็น เริ่มต้นตั้งแต่ canary

สำหรับ lane smoke ของ Discord ที่ใช้ transport จริง ให้รัน:

```bash
pnpm openclaw qa discord
```

lane นี้จะกำหนดเป้าหมายไปที่ช่อง guild ส่วนตัวจริงของ Discord หนึ่งช่อง โดยใช้บอต 2 ตัว:
บอต driver ที่ถูกควบคุมโดย harness และบอต SUT ที่เริ่มโดย child
gateway ของ OpenClaw ผ่าน Plugin Discord ที่มาพร้อมระบบ โดยต้องใช้
`OPENCLAW_QA_DISCORD_GUILD_ID`, `OPENCLAW_QA_DISCORD_CHANNEL_ID`,
`OPENCLAW_QA_DISCORD_DRIVER_BOT_TOKEN`, `OPENCLAW_QA_DISCORD_SUT_BOT_TOKEN`
และ `OPENCLAW_QA_DISCORD_SUT_APPLICATION_ID` เมื่อใช้ข้อมูลรับรองจาก env
lane นี้จะตรวจสอบการจัดการ channel mention และตรวจว่าบอต SUT ได้
ลงทะเบียนคำสั่ง `/help` แบบเนทีฟกับ Discord แล้ว
คำสั่งนี้จะออกด้วยสถานะ non-zero เมื่อสถานการณ์ใดล้มเหลว ใช้ `--allow-failures` เมื่อ
คุณต้องการ artifact โดยไม่ต้องการ exit code แบบล้มเหลว

ตอนนี้ live transport lane ใช้สัญญาร่วมขนาดเล็กชุดเดียวกัน แทนที่แต่ละ lane จะคิด
รูปรายการสถานการณ์ของตัวเอง:

`qa-channel` ยังคงเป็นชุดทดสอบพฤติกรรมผลิตภัณฑ์แบบสังเคราะห์ในวงกว้าง และไม่ได้เป็นส่วนหนึ่ง
ของเมทริกซ์ coverage ของ live transport

| Lane     | Canary | Mention gating | Allowlist block | Top-level reply | Restart resume | Thread follow-up | Thread isolation | Reaction observation | Help command | Native command registration |
| -------- | ------ | -------------- | --------------- | --------------- | -------------- | ---------------- | ---------------- | -------------------- | ------------ | --------------------------- |
| Matrix   | x      | x              | x               | x               | x              | x                | x                | x                    |              |                             |
| Telegram | x      | x              |                 |                 |                |                  |                  |                      | x            |                             |
| Discord  | x      | x              |                 |                 |                |                  |                  |                      |              | x                           |

สิ่งนี้ทำให้ `qa-channel` ยังคงเป็นชุดทดสอบพฤติกรรมผลิตภัณฑ์แบบกว้าง ขณะที่
Matrix, Telegram และ transport จริงในอนาคตใช้เช็กลิสต์ transport-contract
ที่ชัดเจนร่วมกัน

สำหรับ lane แบบ Linux VM ชั่วคราวโดยไม่ดึง Docker เข้ามาอยู่ในเส้นทาง QA ให้รัน:

```bash
pnpm openclaw qa suite --runner multipass --scenario channel-chat-baseline
```

คำสั่งนี้จะบูต guest Multipass ใหม่, ติดตั้ง dependency, build OpenClaw
ภายใน guest, รัน `qa suite` จากนั้นคัดลอกรายงานและสรุป QA ปกติกลับมายัง
`.artifacts/qa-e2e/...` บนโฮสต์
มันใช้พฤติกรรมการเลือกสถานการณ์เดียวกันกับ `qa suite` บนโฮสต์
การรัน suite ทั้งบนโฮสต์และ Multipass จะรันหลายสถานการณ์ที่เลือกไว้แบบขนานโดยใช้
worker gateway แบบแยกกันเป็นค่าปริยาย `qa-channel` ใช้ concurrency ค่าปริยายที่
4 และถูกจำกัดด้วยจำนวนสถานการณ์ที่เลือก ใช้ `--concurrency <count>` เพื่อปรับ
จำนวน worker หรือ `--concurrency 1` สำหรับการรันแบบอนุกรม
คำสั่งนี้จะออกด้วยสถานะ non-zero เมื่อสถานการณ์ใดล้มเหลว ใช้ `--allow-failures` เมื่อ
คุณต้องการ artifact โดยไม่ต้องการ exit code แบบล้มเหลว
การรันแบบ live จะส่งต่ออินพุตการยืนยันตัวตน QA ที่รองรับซึ่งใช้งานได้จริงสำหรับ
guest: provider key จาก env, พาธคอนฟิก provider แบบ QA live และ
`CODEX_HOME` หากมีอยู่ ให้เก็บ `--output-dir` ไว้ภายใต้ repo root เพื่อให้ guest
เขียนกลับผ่าน workspace ที่ mount ไว้ได้

## seed ที่อิงกับ repo

seed asset อยู่ใน `qa/`:

- `qa/scenarios/index.md`
- `qa/scenarios/<theme>/*.md`

สิ่งเหล่านี้ตั้งใจเก็บไว้ใน git เพื่อให้ทั้งมนุษย์และ
เอเจนต์มองเห็นแผน QA ได้

`qa-lab` ควรคงเป็น markdown runner แบบทั่วไป ไฟล์ Markdown ของแต่ละสถานการณ์
คือแหล่งข้อมูลจริงสำหรับการรันทดสอบหนึ่งครั้ง และควรกำหนดสิ่งต่อไปนี้:

- metadata ของสถานการณ์
- metadata ของ category, capability, lane และ risk แบบไม่บังคับ
- การอ้างอิง docs และโค้ด
- ความต้องการ Plugin แบบไม่บังคับ
- patch คอนฟิก gateway แบบไม่บังคับ
- `qa-flow` ที่รันได้จริง

พื้นผิวรันไทม์ที่ใช้ซ้ำได้ซึ่งรองรับ `qa-flow` ได้รับอนุญาตให้คงความทั่วไป
และครอบคลุมหลายส่วน ตัวอย่างเช่น สถานการณ์ Markdown สามารถรวมตัวช่วยฝั่ง transport
เข้ากับตัวช่วยฝั่งเบราว์เซอร์ที่ขับ Control UI แบบฝังผ่าน
Gateway seam `browser.request` โดยไม่ต้องเพิ่ม runner แบบกรณีพิเศษ

ไฟล์สถานการณ์ควรถูกจัดกลุ่มตาม capability ของผลิตภัณฑ์ ไม่ใช่ตามโฟลเดอร์ของ source tree
ควรคง scenario ID ให้เสถียรเมื่อมีการย้ายไฟล์; ใช้ `docsRefs` และ `codeRefs`
สำหรับการติดตามย้อนกลับไปยัง implementation

รายการพื้นฐานควรกว้างพอที่จะครอบคลุม:

- แชต DM และ channel
- พฤติกรรมของ thread
- วงจรชีวิตของ action บนข้อความ
- callback ของ cron
- การเรียกคืน memory
- การสลับโมเดล
- การส่งต่องานให้ซับเอเจนต์
- การอ่าน repo และการอ่าน docs
- งาน build ขนาดเล็กหนึ่งอย่าง เช่น Lobster Invaders

## lane mock ของ provider

`qa suite` มี lane mock ของ provider ในเครื่องอยู่ 2 แบบ:

- `mock-openai` คือ mock ของ OpenClaw ที่รับรู้สถานการณ์ มันยังคงเป็น
  lane mock แบบกำหนดแน่นอนค่าปริยายสำหรับ QA ที่อิงกับ repo และ parity gate
- `aimock` จะเริ่มเซิร์ฟเวอร์ provider ที่รองรับด้วย AIMock สำหรับงาน protocol,
  fixture, record/replay และ chaos coverage เชิงทดลอง มันเป็นแบบเพิ่มเติม และไม่ได้มาแทน
  ตัว dispatch สถานการณ์ของ `mock-openai`

implementation ของ provider lane อยู่ใต้ `extensions/qa-lab/src/providers/`
แต่ละ provider เป็นเจ้าของค่าเริ่มต้นของตัวเอง การเริ่มเซิร์ฟเวอร์ในเครื่อง
คอนฟิกโมเดล gateway ความต้องการในการ stage auth profile และแฟล็กความสามารถแบบ live/mock
ส่วนโค้ด suite และ gateway ที่ใช้ร่วมกันควร route ผ่าน registry ของ provider แทนการแตกแขนงตามชื่อ provider

## ตัวปรับ transport

`qa-lab` เป็นเจ้าของ seam transport แบบทั่วไปสำหรับสถานการณ์ QA แบบ Markdown
`qa-channel` คือ adapter ตัวแรกบน seam นี้ แต่เป้าหมายของการออกแบบกว้างกว่านั้น:
ช่องทางในอนาคต ไม่ว่าจะจริงหรือสังเคราะห์ ควรเสียบเข้ากับ suite runner เดียวกัน
แทนการเพิ่ม QA runner เฉพาะ transport

ในระดับสถาปัตยกรรม การแยกส่วนมีดังนี้:

- `qa-lab` เป็นเจ้าของการรันสถานการณ์แบบทั่วไป concurrency ของ worker การเขียน artifact และการรายงาน
- transport adapter เป็นเจ้าของคอนฟิก gateway ความพร้อมใช้งาน การสังเกตการณ์ขาเข้าและขาออก การกระทำของ transport และสถานะ transport ที่ normalize แล้ว
- ไฟล์สถานการณ์ Markdown ภายใต้ `qa/scenarios/` เป็นตัวกำหนดการรันทดสอบ; `qa-lab` จัดเตรียมพื้นผิวรันไทม์ที่ใช้ซ้ำได้สำหรับการรันมัน

แนวทางการนำไปใช้สำหรับผู้ดูแลในการเพิ่ม adapter ของช่องทางใหม่อยู่ใน
[Testing](/th/help/testing#adding-a-channel-to-qa)

## การรายงาน

`qa-lab` จะ export รายงานโปรโตคอลแบบ Markdown จากไทม์ไลน์ของ bus ที่สังเกตเห็น
รายงานควรตอบคำถามต่อไปนี้:

- อะไรทำงานได้
- อะไรล้มเหลว
- อะไรยังคงติดขัด
- ควรเพิ่มสถานการณ์ติดตามผลใดบ้าง

สำหรับการตรวจสอบด้านลักษณะและสไตล์ ให้รันสถานการณ์เดียวกันข้ามหลาย model ref
แบบ live แล้วเขียนรายงาน Markdown ที่มีการตัดสิน:

```bash
pnpm openclaw qa character-eval \
  --model openai/gpt-5.4,thinking=medium,fast \
  --model openai/gpt-5.2,thinking=xhigh \
  --model openai/gpt-5,thinking=xhigh \
  --model anthropic/claude-opus-4-6,thinking=high \
  --model anthropic/claude-sonnet-4-6,thinking=high \
  --model zai/glm-5.1,thinking=high \
  --model moonshot/kimi-k2.5,thinking=high \
  --model google/gemini-3.1-pro-preview,thinking=high \
  --judge-model openai/gpt-5.4,thinking=xhigh,fast \
  --judge-model anthropic/claude-opus-4-6,thinking=high \
  --blind-judge-models \
  --concurrency 16 \
  --judge-concurrency 16
```

คำสั่งนี้รัน child process ของ QA gateway ในเครื่อง ไม่ใช่ Docker สถานการณ์
character eval ควรกำหนด persona ผ่าน `SOUL.md` จากนั้นจึงรัน user turn ปกติ
เช่น แชต การช่วยเหลือเกี่ยวกับ workspace และงานไฟล์ขนาดเล็ก ไม่ควรบอกโมเดล
ตัวเลือกว่า它กำลังถูกประเมินอยู่ คำสั่งนี้จะเก็บทรานสคริปต์ฉบับเต็มแต่ละรายการ บันทึกสถิติการรันพื้นฐาน จากนั้นจึงขอให้ judge model ใน fast mode พร้อม
reasoning ระดับ `xhigh` เมื่อรองรับ ทำการจัดอันดับผลการรันตามความเป็นธรรมชาติ บรรยากาศ และอารมณ์ขัน
ใช้ `--blind-judge-models` เมื่อต้องการเปรียบเทียบข้าม provider: พรอมป์ของ judge ยังคงได้รับ
ทุกทรานสคริปต์และสถานะการรัน แต่ candidate ref จะถูกแทนด้วยป้ายกลาง ๆ
เช่น `candidate-01`; รายงานจะจับคู่ลำดับกลับไปยัง ref จริงหลังจาก parse แล้ว

การรันของ candidate ใช้การคิดระดับ `high` เป็นค่าปริยาย โดยใช้ `medium` สำหรับ GPT-5.4 และ `xhigh`
สำหรับ OpenAI eval ref รุ่นเก่าที่รองรับ override candidate เฉพาะรายแบบ inline ได้ด้วย
`--model provider/model,thinking=<level>` ส่วน `--thinking <level>` ยังคงใช้ตั้งค่า
fallback ส่วนกลาง และรูปแบบเก่า `--model-thinking <provider/model=level>` ยังคงมีไว้เพื่อความเข้ากันได้

ref ของ candidate ฝั่ง OpenAI จะใช้ fast mode เป็นค่าปริยาย เพื่อใช้ priority processing
เมื่อ provider รองรับ เพิ่ม `,fast`, `,no-fast` หรือ `,fast=false` แบบ inline เมื่อต้องการ
override สำหรับ candidate หรือ judge บางรายการ ใช้ `--fast` เฉพาะเมื่อคุณต้องการ
บังคับเปิด fast mode ให้ทุก candidate model ระยะเวลาของ candidate และ judge จะถูกบันทึกไว้
ในรายงานเพื่อใช้วิเคราะห์ benchmark แต่พรอมป์ของ judge ระบุไว้อย่างชัดเจนว่า
ไม่ให้จัดอันดับตามความเร็ว

ทั้งการรันของ candidate และ judge model ใช้ concurrency 16 เป็นค่าปริยาย ลดค่า
`--concurrency` หรือ `--judge-concurrency` เมื่อลิมิตของ provider หรือแรงกดดันจาก gateway ในเครื่อง
ทำให้การรันมีสัญญาณรบกวนมากเกินไป
เมื่อไม่มีการส่ง `--model` สำหรับ candidate character eval จะใช้ค่าปริยายเป็น
`openai/gpt-5.4`, `openai/gpt-5.2`, `openai/gpt-5`, `anthropic/claude-opus-4-6`,
`anthropic/claude-sonnet-4-6`, `zai/glm-5.1`,
`moonshot/kimi-k2.5` และ
`google/gemini-3.1-pro-preview` เมื่อไม่ได้ส่ง `--model`
เมื่อไม่ได้ส่ง `--judge-model` judge จะใช้ค่าปริยายเป็น
`openai/gpt-5.4,thinking=xhigh,fast` และ
`anthropic/claude-opus-4-6,thinking=high`

## เอกสารที่เกี่ยวข้อง

- [Testing](/th/help/testing)
- [QA Channel](/th/channels/qa-channel)
- [Dashboard](/th/web/dashboard)
