---
read_when:
    - การขยาย qa-lab หรือ qa-channel
    - การเพิ่มสถานการณ์ QA ที่อิงกับ repo
    - การสร้างระบบอัตโนมัติ QA ที่มีความสมจริงสูงขึ้นรอบแดชบอร์ด Gateway
summary: รูปแบบการทำงานอัตโนมัติ QA แบบส่วนตัวสำหรับ qa-lab, qa-channel, สถานการณ์ที่มีการ seed ไว้ และรายงานโปรโตคอล
title: ระบบอัตโนมัติ QA E2E
x-i18n:
    generated_at: "2026-04-23T05:31:15Z"
    model: gpt-5.4
    provider: openai
    source_hash: 34245ce871356caeab0d9e0eeeaa9fb4e408920a4a97ad27567fa365d8db17c7
    source_path: concepts/qa-e2e-automation.md
    workflow: 15
---

# ระบบอัตโนมัติ QA E2E

สแตก QA แบบส่วนตัวมีไว้เพื่อทดสอบ OpenClaw ในรูปแบบที่สมจริงกว่า
และมีลักษณะคล้ายช่องทางมากกว่าที่ unit test เดี่ยวจะทำได้

องค์ประกอบปัจจุบัน:

- `extensions/qa-channel`: ช่องข้อความสังเคราะห์ที่มีพื้นผิวสำหรับ DM, channel, thread,
  reaction, edit และ delete
- `extensions/qa-lab`: UI สำหรับดีบักและ QA bus สำหรับสังเกต transcript,
  ฉีดข้อความขาเข้า และส่งออกรายงาน Markdown
- `qa/`: แอสเซ็ต seed ที่อิงกับ repo สำหรับงาน kickoff และ
  สถานการณ์ QA พื้นฐาน

โฟลว์ผู้ปฏิบัติงาน QA ปัจจุบันเป็นไซต์ QA แบบสองหน้าต่าง:

- ซ้าย: แดชบอร์ด Gateway (Control UI) พร้อมเอเจนต์
- ขวา: QA Lab แสดง transcript ลักษณะคล้าย Slack และแผนสถานการณ์

รันด้วย:

```bash
pnpm qa:lab:up
```

คำสั่งนี้จะ build ไซต์ QA เริ่ม gateway lane ที่ใช้ Docker อยู่เบื้องหลัง และเปิดเผย
หน้า QA Lab ที่ผู้ปฏิบัติงานหรือ automation loop สามารถมอบภารกิจ QA ให้เอเจนต์
สังเกตพฤติกรรมจริงของช่องทาง และบันทึกว่าสิ่งใดทำงาน สิ่งใดล้มเหลว หรือ
สิ่งใดยังคงติดขัด

หากต้องการวนปรับ UI ของ QA Lab ให้เร็วขึ้นโดยไม่ต้อง rebuild Docker image ทุกครั้ง
ให้เริ่มสแตกด้วย QA Lab bundle แบบ bind-mounted:

```bash
pnpm openclaw qa docker-build-image
pnpm qa:lab:build
pnpm qa:lab:up:fast
pnpm qa:lab:watch
```

`qa:lab:up:fast` จะคงบริการ Docker ไว้บน image ที่ build ไว้ล่วงหน้า และ bind-mount
`extensions/qa-lab/web/dist` เข้าไปใน container `qa-lab` ส่วน `qa:lab:watch`
จะ rebuild bundle นั้นเมื่อมีการเปลี่ยนแปลง และเบราว์เซอร์จะ auto-reload เมื่อ asset hash ของ QA Lab เปลี่ยน

สำหรับ Matrix smoke lane แบบ transport-real ให้รัน:

```bash
pnpm openclaw qa matrix
```

lane นี้จะ provision Tuwunel homeserver แบบใช้แล้วทิ้งใน Docker, ลงทะเบียน
ผู้ใช้ driver, SUT และ observer ชั่วคราว, สร้าง private room หนึ่งห้อง จากนั้นรัน
Matrix plugin จริงภายใน QA gateway child live transport lane จะคง config ของ child
ให้จำกัดอยู่กับ transport ที่กำลังทดสอบ ดังนั้น Matrix จะรันได้โดยไม่มี
`qa-channel` ใน config ของ child มันจะเขียน structured report artifacts และ
combined stdout/stderr log ลงในไดเรกทอรีเอาต์พุต Matrix QA ที่เลือกไว้ หากต้องการ
เก็บเอาต์พุต build/launcher ของ `scripts/run-node.mjs` ชั้นนอกด้วย ให้ตั้งค่า
`OPENCLAW_RUN_NODE_OUTPUT_LOG=<path>` ไปยังไฟล์ log ภายใน repo

สำหรับ Telegram smoke lane แบบ transport-real ให้รัน:

```bash
pnpm openclaw qa telegram
```

lane นี้จะกำหนดเป้าหมายไปยัง private Telegram group จริงหนึ่งกลุ่ม แทนการ provision
เซิร์ฟเวอร์แบบใช้แล้วทิ้ง โดยต้องใช้ `OPENCLAW_QA_TELEGRAM_GROUP_ID`,
`OPENCLAW_QA_TELEGRAM_DRIVER_BOT_TOKEN` และ
`OPENCLAW_QA_TELEGRAM_SUT_BOT_TOKEN` รวมถึงบอตสองตัวที่ต่างกันใน
private group เดียวกัน SUT bot ต้องมี Telegram username และการสังเกต bot-to-bot
จะทำงานได้ดีที่สุดเมื่อทั้งสองบอตเปิดใช้ Bot-to-Bot Communication Mode
ใน `@BotFather`
คำสั่งนี้จะออกด้วยสถานะ non-zero เมื่อมีสถานการณ์ใดล้มเหลว ใช้ `--allow-failures` เมื่อ
คุณต้องการ artifacts โดยไม่ให้ exit code เป็นความล้มเหลว

ตอนนี้ live transport lane ใช้ contract ขนาดเล็กชุดเดียวร่วมกัน แทนที่แต่ละ lane จะคิด
รูปแบบรายการสถานการณ์ของตัวเอง:

`qa-channel` ยังคงเป็นชุดทดสอบพฤติกรรมผลิตภัณฑ์แบบสังเคราะห์ที่ครอบคลุม และไม่ใช่ส่วนหนึ่ง
ของเมทริกซ์ความครอบคลุมของ live transport

| Lane     | Canary | การกำหนดให้ต้องมีการ mention | การบล็อก allowlist | การตอบกลับระดับบนสุด | การทำงานต่อหลังรีสตาร์ต | การติดตามผลใน thread | การแยก thread | การสังเกตรีแอ็กชัน | คำสั่งช่วยเหลือ |
| -------- | ------ | ----------------------------- | ------------------ | --------------------- | ------------------------ | -------------------- | ------------- | ------------------- | --------------- |
| Matrix   | x      | x                             | x                  | x                     | x                        | x                    | x             | x                   |                 |
| Telegram | x      |                               |                    |                       |                          |                      |               |                     | x               |

สิ่งนี้ทำให้ `qa-channel` ยังคงเป็นชุดทดสอบพฤติกรรมผลิตภัณฑ์ที่ครอบคลุม ขณะที่ Matrix,
Telegram และ transport แบบ live ในอนาคตใช้รายการตรวจสอบ transport-contract แบบชัดเจนชุดเดียวร่วมกัน

สำหรับ lane แบบ Linux VM ใช้แล้วทิ้ง โดยไม่ต้องนำ Docker เข้ามาอยู่ในเส้นทาง QA ให้รัน:

```bash
pnpm openclaw qa suite --runner multipass --scenario channel-chat-baseline
```

คำสั่งนี้จะบูต guest Multipass ใหม่ ติดตั้ง dependencies build OpenClaw ภายใน guest
รัน `qa suite` จากนั้นคัดลอกรายงาน QA ปกติและสรุปกลับมาไว้ที่ `.artifacts/qa-e2e/...`
บนโฮสต์
มันใช้พฤติกรรมการเลือกสถานการณ์เดียวกับ `qa suite` บนโฮสต์
การรัน suite ทั้งบนโฮสต์และ Multipass จะรันหลายสถานการณ์ที่เลือกแบบขนานพร้อม gateway worker แยกกันโดยค่าเริ่มต้น `qa-channel` มีค่า concurrency เริ่มต้นเป็น
4 โดยถูกจำกัดด้วยจำนวนสถานการณ์ที่เลือก ใช้ `--concurrency <count>` เพื่อปรับ
จำนวน worker หรือ `--concurrency 1` สำหรับการรันแบบอนุกรม
คำสั่งนี้จะออกด้วยสถานะ non-zero เมื่อมีสถานการณ์ใดล้มเหลว ใช้ `--allow-failures` เมื่อ
คุณต้องการ artifacts โดยไม่ให้ exit code เป็นความล้มเหลว
การรันแบบ live จะส่งต่ออินพุต QA auth ที่รองรับและใช้งานได้จริงสำหรับ
guest: provider key แบบ env, พาธ config ของ QA live provider และ
`CODEX_HOME` เมื่อมีอยู่ ให้เก็บ `--output-dir` ไว้ใต้รากของ repo เพื่อให้ guest
เขียนกลับผ่าน workspace ที่ mount ไว้ได้

## seed ที่อิงกับ repo

แอสเซ็ต seed อยู่ใน `qa/`:

- `qa/scenarios/index.md`
- `qa/scenarios/<theme>/*.md`

สิ่งเหล่านี้ตั้งใจเก็บไว้ใน git เพื่อให้ทั้งมนุษย์และเอเจนต์มองเห็นแผน QA ได้

`qa-lab` ควรคงเป็น runner ของ Markdown แบบทั่วไป ไฟล์ Markdown ของแต่ละสถานการณ์
เป็นแหล่งข้อมูลจริงสำหรับการทดสอบหนึ่งครั้ง และควรกำหนด:

- metadata ของสถานการณ์
- metadata ของหมวดหมู่ ความสามารถ lane และความเสี่ยงแบบไม่บังคับ
- การอ้างอิงเอกสารและโค้ด
- ข้อกำหนด Plugin แบบไม่บังคับ
- patch config ของ gateway แบบไม่บังคับ
- `qa-flow` ที่สามารถรันได้จริง

พื้นผิวรันไทม์แบบใช้ซ้ำได้ที่รองรับ `qa-flow` ได้รับอนุญาตให้คงความเป็นทั่วไป
และครอบคลุมหลายส่วนได้ ตัวอย่างเช่น สถานการณ์ Markdown สามารถรวม
helper ฝั่ง transport เข้ากับ helper ฝั่งเบราว์เซอร์ที่ขับเคลื่อน Control UI แบบฝังตัวผ่าน
Gateway `browser.request` seam โดยไม่ต้องเพิ่ม runner แบบกรณีพิเศษ

ไฟล์สถานการณ์ควรถูกจัดกลุ่มตามความสามารถของผลิตภัณฑ์ ไม่ใช่ตามโฟลเดอร์ของ source tree
ให้คง scenario ID ให้เสถียรแม้ไฟล์จะย้ายตำแหน่ง และใช้ `docsRefs` กับ `codeRefs`
สำหรับการติดตามย้อนกลับไปยัง implementation

รายการพื้นฐานควรครอบคลุมกว้างพอสำหรับ:

- แชตแบบ DM และ channel
- พฤติกรรมของ thread
- วงจรชีวิตของ message action
- callback ของ Cron
- memory recall
- การสลับโมเดล
- การส่งต่องานไปยัง subagent
- การอ่าน repo และการอ่านเอกสาร
- งาน build เล็ก ๆ หนึ่งอย่าง เช่น Lobster Invaders

## lane ของ provider mock

`qa suite` มี lane ของ provider mock แบบ local สองแบบ:

- `mock-openai` คือ OpenClaw mock ที่รับรู้สถานการณ์ มันยังคงเป็น
  lane mock แบบกำหนดแน่นอนเริ่มต้นสำหรับ QA ที่อิงกับ repo และ parity gate
- `aimock` จะเริ่มเซิร์ฟเวอร์ provider ที่ขับเคลื่อนด้วย AIMock สำหรับการครอบคลุมด้าน protocol,
  fixture, record/replay และ chaos แบบทดลอง เป็นส่วนเสริมและไม่ได้แทนที่ตัว dispatch สถานการณ์ของ `mock-openai`

implementation ของ provider-lane อยู่ใต้ `extensions/qa-lab/src/providers/`
แต่ละ provider เป็นเจ้าของค่าเริ่มต้นของตัวเอง การเริ่มเซิร์ฟเวอร์ local, config โมเดลของ gateway,
ความต้องการในการจัดเตรียม auth-profile และแฟล็กความสามารถของ live/mock
suite และโค้ด gateway ที่ใช้ร่วมกันควรกำหนดเส้นทางผ่านรีจิสทรีของ provider แทนการแตกแขนง
ตามชื่อ provider

## transport adapter

`qa-lab` เป็นเจ้าของ seam ของ transport แบบทั่วไปสำหรับสถานการณ์ QA แบบ Markdown
`qa-channel` คือ adapter ตัวแรกบน seam นี้ แต่เป้าหมายการออกแบบนั้นกว้างกว่า:
ช่องทางจริงหรือสังเคราะห์ในอนาคตควรเสียบเข้ากับ suite runner เดียวกันได้
แทนที่จะเพิ่ม QA runner เฉพาะ transport

ในระดับสถาปัตยกรรม การแยกหน้าที่คือ:

- `qa-lab` เป็นเจ้าของการรันสถานการณ์ทั่วไป, worker concurrency, การเขียน artifact และการรายงาน
- transport adapter เป็นเจ้าของ config ของ gateway, ความพร้อมใช้งาน, การสังเกตขาเข้าและขาออก, transport actions และสถานะ transport ที่ถูกทำให้เป็นมาตรฐาน
- ไฟล์สถานการณ์ Markdown ใต้ `qa/scenarios/` เป็นตัวกำหนดการทดสอบ; `qa-lab` ให้พื้นผิวรันไทม์แบบใช้ซ้ำได้ที่ใช้รันสิ่งเหล่านั้น

แนวทางการนำไปใช้สำหรับผู้ดูแลเมื่อต้องเพิ่ม channel adapter ใหม่อยู่ใน
[Testing](/th/help/testing#adding-a-channel-to-qa)

## การรายงาน

`qa-lab` ส่งออกรายงานโปรโตคอลแบบ Markdown จากไทม์ไลน์ของ bus ที่สังเกตได้
รายงานควรตอบคำถามเหล่านี้:

- อะไรที่ทำงานได้
- อะไรที่ล้มเหลว
- อะไรที่ยังคงติดขัด
- มีสถานการณ์ติดตามผลใดที่ควรเพิ่ม

สำหรับการตรวจสอบด้านลักษณะและสไตล์ ให้รันสถานการณ์เดียวกันกับ live model ref หลายตัว
แล้วเขียนรายงาน Markdown ที่ผ่านการตัดสิน:

```bash
pnpm openclaw qa character-eval \
  --model openai/gpt-5.4,thinking=xhigh \
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

คำสั่งนี้จะรัน process ย่อยของ QA gateway แบบ local ไม่ใช่ Docker สถานการณ์ character eval
ควรกำหนด persona ผ่าน `SOUL.md` จากนั้นรัน user turn ปกติ
เช่น แชต ความช่วยเหลือเกี่ยวกับ workspace และงานไฟล์ขนาดเล็ก โมเดลผู้สมัคร
ไม่ควรถูกบอกว่ากำลังถูกประเมิน คำสั่งนี้จะเก็บ transcript ฉบับเต็มของแต่ละรอบไว้
บันทึกสถิติพื้นฐานของการรัน จากนั้นขอให้ judge model ในโหมด fast พร้อมเหตุผลแบบ
`xhigh` จัดอันดับรอบการรันตามความเป็นธรรมชาติ vibe และอารมณ์ขัน
ใช้ `--blind-judge-models` เมื่อเปรียบเทียบผู้ให้บริการ: พรอมป์ให้ผู้ตัดสินยังคงได้รับ
ทุก transcript และสถานะการรัน แต่ candidate ref จะถูกแทนที่ด้วยฉลากกลาง ๆ
เช่น `candidate-01`; รายงานจะ map ลำดับกลับไปยัง ref จริงหลัง parsing
candidate run มีค่าเริ่มต้นเป็นการคิดระดับ `high` และใช้ `xhigh` สำหรับโมเดล OpenAI ที่
รองรับ หากต้องการ override ผู้สมัครรายใดรายหนึ่งโดยตรง ให้ใช้
`--model provider/model,thinking=<level>` ส่วน `--thinking <level>` ยังคงตั้งค่า fallback
แบบ global และรูปแบบเก่า `--model-thinking <provider/model=level>` ยังถูกเก็บไว้เพื่อความเข้ากันได้
candidate ref ของ OpenAI มีค่าเริ่มต้นเป็นโหมด fast เพื่อให้มีการใช้ priority processing เมื่อ
ผู้ให้บริการรองรับ เพิ่ม `,fast`, `,no-fast` หรือ `,fast=false` แบบ inline เมื่อต้องการ override ให้กับ
ผู้สมัครหรือผู้ตัดสินรายเดียว ส่ง `--fast` เฉพาะเมื่อคุณต้องการ
บังคับเปิดโหมด fast ให้กับทุก candidate model ทั้งหมด ระยะเวลาของ candidate และ judge
จะถูกบันทึกไว้ในรายงานเพื่อใช้วิเคราะห์ benchmark แต่พรอมป์ของ judge ระบุชัดว่า
ไม่ให้จัดอันดับตามความเร็ว
ทั้งการรันของ candidate และ judge model มีค่า concurrency เริ่มต้นเป็น 16 ลดค่า
`--concurrency` หรือ `--judge-concurrency` เมื่อลิมิตของ provider หรือแรงกดดันของ gateway local
ทำให้การรันมีสัญญาณรบกวนมากเกินไป
หากไม่ได้ส่ง candidate `--model` มา character eval จะใช้ค่าเริ่มต้นเป็น
`openai/gpt-5.4`, `openai/gpt-5.2`, `openai/gpt-5`, `anthropic/claude-opus-4-6`,
`anthropic/claude-sonnet-4-6`, `zai/glm-5.1`,
`moonshot/kimi-k2.5` และ
`google/gemini-3.1-pro-preview` เมื่อไม่ได้ส่ง `--model` มา
หากไม่ได้ส่ง `--judge-model` มา ผู้ตัดสินจะใช้ค่าเริ่มต้นเป็น
`openai/gpt-5.4,thinking=xhigh,fast` และ
`anthropic/claude-opus-4-6,thinking=high`

## เอกสารที่เกี่ยวข้อง

- [Testing](/th/help/testing)
- [QA Channel](/th/channels/qa-channel)
- [Dashboard](/web/dashboard)
