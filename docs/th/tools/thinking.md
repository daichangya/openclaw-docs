---
read_when:
    - กำลังปรับการแยกวิเคราะห์หรือค่าเริ่มต้นของ directives สำหรับการคิด fast-mode หรือ verbose
summary: ไวยากรณ์ของ directives สำหรับ /think, /fast, /verbose, /trace และการมองเห็น reasoning
title: ระดับการคิด
x-i18n:
    generated_at: "2026-04-23T06:03:36Z"
    model: gpt-5.4
    provider: openai
    source_hash: c77f6f1318c428bbd21725ea5f32f8088506a10cbbf5b5cbca5973c72a5a81f9
    source_path: tools/thinking.md
    workflow: 15
---

# ระดับการคิด (/think directives)

## สิ่งที่มันทำ

- Inline directive ใน body ขาเข้าใดก็ได้: `/t <level>`, `/think:<level>` หรือ `/thinking <level>`
- ระดับ (aliases): `off | minimal | low | medium | high | xhigh | adaptive | max`
  - minimal → “think”
  - low → “think hard”
  - medium → “think harder”
  - high → “ultrathink” (งบประมาณสูงสุด)
  - xhigh → “ultrathink+” (GPT-5.2 + โมเดล Codex และ effort ของ Anthropic Claude Opus 4.7)
  - adaptive → การคิดแบบ adaptive ที่ผู้ให้บริการจัดการเอง (รองรับสำหรับ Claude 4.6 บน Anthropic/Bedrock และ Anthropic Claude Opus 4.7)
  - max → การใช้ reasoning สูงสุดของผู้ให้บริการ (ปัจจุบันคือ Anthropic Claude Opus 4.7)
  - `x-high`, `x_high`, `extra-high`, `extra high` และ `extra_high` จะถูกแมปเป็น `xhigh`
  - `highest` จะถูกแมปเป็น `high`
- หมายเหตุเฉพาะผู้ให้บริการ:
  - เมนูและตัวเลือกของการคิดถูกขับเคลื่อนด้วย provider profile ผู้ให้บริการ plugins จะประกาศชุดระดับที่แน่นอนสำหรับโมเดลที่เลือก รวมถึง labels เช่น binary `on`
  - `adaptive`, `xhigh` และ `max` จะถูกประกาศเฉพาะกับ provider/model profiles ที่รองรับเท่านั้น Typed directives สำหรับระดับที่ไม่รองรับจะถูกปฏิเสธพร้อม valid options ของโมเดลนั้น
  - ระดับที่จัดเก็บไว้เดิมซึ่งไม่รองรับจะถูก remap ตามลำดับอันดับของ provider profile `adaptive` จะ fallback ไปเป็น `medium` บนโมเดลที่ไม่รองรับ adaptive ส่วน `xhigh` และ `max` จะ fallback ไปเป็นระดับที่ไม่ใช่ `off` ที่สูงที่สุดซึ่งโมเดลที่เลือกยังรองรับอยู่
  - โมเดล Anthropic Claude 4.6 ใช้ค่าเริ่มต้นเป็น `adaptive` เมื่อไม่ได้ตั้งระดับการคิดแบบ explicit
  - Anthropic Claude Opus 4.7 ไม่ได้ใช้ adaptive thinking เป็นค่าเริ่มต้น API effort เริ่มต้นของมันยังคงเป็นสิ่งที่ผู้ให้บริการเป็นเจ้าของ เว้นแต่คุณจะตั้งระดับการคิดแบบ explicit
  - Anthropic Claude Opus 4.7 แมป `/think xhigh` ไปเป็น adaptive thinking พร้อม `output_config.effort: "xhigh"` เพราะ `/think` เป็น thinking directive และ `xhigh` คือค่าการตั้ง effort ของ Opus 4.7
  - Anthropic Claude Opus 4.7 ยังเปิดให้ใช้ `/think max`; มันจะถูกแมปไปยังเส้นทาง max effort แบบเดียวกันที่ผู้ให้บริการเป็นเจ้าของ
  - โมเดล OpenAI GPT จะแมป `/think` ผ่านการรองรับ effort ของ Responses API แบบเฉพาะโมเดล `/think off` จะส่ง `reasoning.effort: "none"` เฉพาะเมื่อโมเดลเป้าหมายรองรับเท่านั้น มิฉะนั้น OpenClaw จะละ payload ของ disabled reasoning ทิ้งแทนการส่งค่าที่ไม่รองรับ
  - MiniMax (`minimax/*`) บนเส้นทางสตรีมที่เข้ากันได้กับ Anthropic มีค่าเริ่มต้นเป็น `thinking: { type: "disabled" }` เว้นแต่คุณจะตั้ง thinking แบบ explicit ใน model params หรือ request params สิ่งนี้ช่วยหลีกเลี่ยง `reasoning_content` deltas ที่รั่วออกมาจากรูปแบบสตรีม Anthropic ที่ไม่ใช่ native ของ MiniMax
  - Z.AI (`zai/*`) รองรับเฉพาะการคิดแบบไบนารี (`on`/`off`) ระดับใดก็ตามที่ไม่ใช่ `off` จะถูกมองเป็น `on` (แมปไปเป็น `low`)
  - Moonshot (`moonshot/*`) แมป `/think off` ไปเป็น `thinking: { type: "disabled" }` และระดับใดก็ตามที่ไม่ใช่ `off` ไปเป็น `thinking: { type: "enabled" }` เมื่อเปิดใช้ thinking, Moonshot จะยอมรับ `tool_choice` ได้เพียง `auto|none`; OpenClaw จะ normalize ค่าที่ไม่เข้ากันให้เป็น `auto`

## ลำดับการ resolve

1. Inline directive บนข้อความ (มีผลเฉพาะข้อความนั้น)
2. Session override (ตั้งค่าโดยการส่งข้อความที่มีแต่ directive)
3. ค่าเริ่มต้นแบบรายเอเจนต์ (`agents.list[].thinkingDefault` ในคอนฟิก)
4. ค่าเริ่มต้นแบบ global (`agents.defaults.thinkingDefault` ในคอนฟิก)
5. Fallback: ค่าเริ่มต้นที่ผู้ให้บริการประกาศไว้เมื่อมี, `low` สำหรับ catalog models อื่นที่ถูกระบุว่ารองรับ reasoning และ `off` ในกรณีอื่น

## การตั้งค่า default ของ session

- ส่งข้อความที่มี **เฉพาะ** directive เท่านั้น (อนุญาตให้มี whitespace ได้) เช่น `/think:medium` หรือ `/t high`
- ค่านี้จะคงอยู่สำหรับ session ปัจจุบัน (โดยค่าเริ่มต้นเป็น per-sender); จะถูกล้างด้วย `/think:off` หรือการรีเซ็ตเมื่อ session idle
- จะมีข้อความยืนยันตอบกลับ (`Thinking level set to high.` / `Thinking disabled.`) หากระดับไม่ถูกต้อง (เช่น `/thinking big`) คำสั่งจะถูกปฏิเสธพร้อมคำใบ้ และสถานะของ session จะไม่เปลี่ยน
- ส่ง `/think` (หรือ `/think:`) โดยไม่มีอาร์กิวเมนต์เพื่อดูระดับการคิดปัจจุบัน

## การนำไปใช้โดยเอเจนต์

- **Embedded Pi**: ระดับที่ resolve ได้จะถูกส่งต่อไปยัง in-process Pi agent runtime

## Fast mode (/fast)

- ระดับ: `on|off`
- ข้อความที่มีแต่ directive จะสลับ fast-mode override ของ session และตอบกลับ `Fast mode enabled.` / `Fast mode disabled.`
- ส่ง `/fast` (หรือ `/fast status`) โดยไม่มีโหมดเพื่อดูสถานะ fast-mode ที่มีผลจริงในปัจจุบัน
- OpenClaw จะ resolve fast mode ตามลำดับนี้:
  1. Inline/directive-only `/fast on|off`
  2. Session override
  3. ค่าเริ่มต้นแบบรายเอเจนต์ (`agents.list[].fastModeDefault`)
  4. คอนฟิกแบบรายโมเดล: `agents.defaults.models["<provider>/<model>"].params.fastMode`
  5. Fallback: `off`
- สำหรับ `openai/*`, fast mode จะถูกแมปไปเป็น OpenAI priority processing โดยส่ง `service_tier=priority` บน Responses requests ที่รองรับ
- สำหรับ `openai-codex/*`, fast mode จะส่งแฟล็ก `service_tier=priority` แบบเดียวกันบน Codex Responses OpenClaw ใช้ toggle `/fast` ตัวเดียวร่วมกันในทั้งสองเส้นทาง auth
- สำหรับคำขอแบบ direct public `anthropic/*` รวมถึงทราฟฟิกแบบ OAuth-authenticated ที่ส่งไปยัง `api.anthropic.com`, fast mode จะถูกแมปไปเป็น Anthropic service tiers: `/fast on` ตั้ง `service_tier=auto`, `/fast off` ตั้ง `service_tier=standard_only`
- สำหรับ `minimax/*` บนเส้นทางที่เข้ากันได้กับ Anthropic, `/fast on` (หรือ `params.fastMode: true`) จะ rewrite `MiniMax-M2.7` เป็น `MiniMax-M2.7-highspeed`
- explicit Anthropic `serviceTier` / `service_tier` model params จะ override ค่าเริ่มต้นของ fast-mode เมื่อมีการตั้งทั้งสองอย่าง OpenClaw จะยังคงข้ามการ inject Anthropic service-tier สำหรับ proxy base URLs ที่ไม่ใช่ Anthropic

## Verbose directives (/verbose หรือ /v)

- ระดับ: `on` (minimal) | `full` | `off` (ค่าเริ่มต้น)
- ข้อความที่มีแต่ directive จะสลับ verbose ของ session และตอบกลับ `Verbose logging enabled.` / `Verbose logging disabled.`; ระดับที่ไม่ถูกต้องจะคืนคำใบ้โดยไม่เปลี่ยนสถานะ
- `/verbose off` จะเก็บ explicit session override ไว้; ล้างได้ผ่าน Sessions UI โดยเลือก `inherit`
- Inline directive มีผลเฉพาะกับข้อความนั้น; ค่าเริ่มต้นของ session/global จะมีผลในกรณีอื่น
- ส่ง `/verbose` (หรือ `/verbose:`) โดยไม่มีอาร์กิวเมนต์เพื่อดูระดับ verbose ปัจจุบัน
- เมื่อเปิด verbose เอเจนต์ที่ปล่อย structured tool results (Pi, เอเจนต์ JSON อื่นๆ) จะส่งแต่ละ tool call กลับมาเป็น metadata-only message ของตัวเอง โดยมี prefix เป็น `<emoji> <tool-name>: <arg>` เมื่อมีให้ใช้ (path/command) tool summaries เหล่านี้จะถูกส่งทันทีที่แต่ละเครื่องมือเริ่มทำงาน (เป็นบับเบิลแยกกัน) ไม่ใช่เป็น streaming deltas
- สรุปความล้มเหลวของเครื่องมือจะยังคงมองเห็นได้ในโหมดปกติ แต่ raw error detail suffixes จะถูกซ่อน เว้นแต่ verbose เป็น `on` หรือ `full`
- เมื่อ verbose เป็น `full` เอาต์พุตของเครื่องมือจะถูกส่งต่อหลังเสร็จสิ้นด้วย (เป็นบับเบิลแยก ตัดทอนให้ยาวในระดับปลอดภัย) หากคุณสลับ `/verbose on|full|off` ขณะมีการรันค้างอยู่ tool bubbles ถัดไปจะเคารพค่าการตั้งใหม่

## Plugin trace directives (/trace)

- ระดับ: `on` | `off` (ค่าเริ่มต้น)
- ข้อความที่มีแต่ directive จะสลับ plugin trace output ของ session และตอบกลับ `Plugin trace enabled.` / `Plugin trace disabled.`
- Inline directive มีผลเฉพาะกับข้อความนั้น; ค่าเริ่มต้นของ session/global จะมีผลในกรณีอื่น
- ส่ง `/trace` (หรือ `/trace:`) โดยไม่มีอาร์กิวเมนต์เพื่อดูระดับ trace ปัจจุบัน
- `/trace` แคบกว่า `/verbose`: มันเปิดเผยเฉพาะบรรทัด trace/debug ที่ Plugin เป็นเจ้าของ เช่น Active Memory debug summaries
- บรรทัด trace สามารถปรากฏใน `/status` และในข้อความวินิจฉัยติดตามผลหลังการตอบกลับปกติของผู้ช่วย

## การมองเห็น Reasoning (/reasoning)

- ระดับ: `on|off|stream`
- ข้อความที่มีแต่ directive จะสลับว่าจะให้แสดงบล็อกการคิดในคำตอบหรือไม่
- เมื่อเปิดใช้งาน reasoning จะถูกส่งเป็น **ข้อความแยก** โดยมี prefix ว่า `Reasoning:`
- `stream` (Telegram เท่านั้น): จะสตรีม reasoning ลงใน Telegram draft bubble ขณะที่กำลังสร้างคำตอบ จากนั้นจึงส่งคำตอบสุดท้ายโดยไม่มี reasoning
- Alias: `/reason`
- ส่ง `/reasoning` (หรือ `/reasoning:`) โดยไม่มีอาร์กิวเมนต์เพื่อดูระดับ reasoning ปัจจุบัน
- ลำดับการ resolve: inline directive, จากนั้น session override, จากนั้นค่าเริ่มต้นแบบรายเอเจนต์ (`agents.list[].reasoningDefault`) แล้วจึง fallback (`off`)

## ที่เกี่ยวข้อง

- เอกสารของ Elevated mode อยู่ที่ [Elevated mode](/th/tools/elevated)

## Heartbeats

- body ของ Heartbeat probe คือ heartbeat prompt ที่กำหนดค่าไว้ (ค่าเริ่มต้น: `Read HEARTBEAT.md if it exists (workspace context). Follow it strictly. Do not infer or repeat old tasks from prior chats. If nothing needs attention, reply HEARTBEAT_OK.`) Inline directives ในข้อความ heartbeat จะมีผลตามปกติ (แต่ควรหลีกเลี่ยงการเปลี่ยนค่าเริ่มต้นของ session จาก heartbeats)
- ค่าเริ่มต้นของการส่ง Heartbeat คือส่งเฉพาะ final payload เท่านั้น หากต้องการให้ส่งข้อความ `Reasoning:` แยกด้วย (เมื่อมี) ให้ตั้ง `agents.defaults.heartbeat.includeReasoning: true` หรือ `agents.list[].heartbeat.includeReasoning: true` แบบรายเอเจนต์

## Web chat UI

- ตัวเลือกการคิดใน web chat จะสะท้อนระดับที่เก็บไว้ของ session จาก inbound session store/config เมื่อหน้าโหลด
- การเลือกอีกระดับหนึ่งจะเขียน session override ทันทีผ่าน `sessions.patch`; ไม่ต้องรอการส่งครั้งถัดไป และไม่ใช่ one-shot override แบบ `thinkingOnce`
- ตัวเลือกแรกจะเป็น `Default (<resolved level>)` เสมอ โดย resolved default มาจาก provider thinking profile ของ active session model
- ตัวเลือกใช้ `thinkingOptions` ที่ส่งกลับโดย gateway session row เบราว์เซอร์ UI ไม่ได้เก็บ provider regex list ของตัวเอง; plugins เป็นเจ้าของชุดระดับเฉพาะโมเดล
- `/think:<level>` ยังใช้งานได้ และจะอัปเดตระดับ session ที่เก็บไว้ตัวเดียวกัน ดังนั้น chat directives และตัวเลือกใน picker จึงคงซิงก์กัน

## Provider profiles

- Provider plugins สามารถเปิดเผย `resolveThinkingProfile(ctx)` เพื่อกำหนดระดับที่รองรับและค่าเริ่มต้นของโมเดล
- แต่ละระดับของ profile มี canonical `id` ที่เก็บไว้ (`off`, `minimal`, `low`, `medium`, `high`, `xhigh`, `adaptive` หรือ `max`) และอาจมี `label` สำหรับแสดงผลด้วย ผู้ให้บริการแบบ binary ใช้ `{ id: "low", label: "on" }`
- hooks แบบเดิมที่เผยแพร่แล้ว (`supportsXHighThinking`, `isBinaryThinking` และ `resolveDefaultThinkingLevel`) ยังคงอยู่เป็น compatibility adapters แต่ชุดระดับแบบกำหนดเองใหม่ควรใช้ `resolveThinkingProfile`
- แถวของ Gateway จะเปิดเผย `thinkingOptions` และ `thinkingDefault` เพื่อให้ ACP/chat clients เรนเดอร์ profile เดียวกันกับที่ runtime validation ใช้
