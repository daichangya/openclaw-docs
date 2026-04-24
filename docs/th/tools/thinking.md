---
read_when:
    - การปรับการแยกวิเคราะห์หรือค่าเริ่มต้นของ directive สำหรับระดับการคิด โหมด fast หรือ verbose
summary: ไวยากรณ์ directive สำหรับ /think, /fast, /verbose, /trace และการมองเห็น reasoning
title: Thinking levels
x-i18n:
    generated_at: "2026-04-24T09:38:54Z"
    model: gpt-5.4
    provider: openai
    source_hash: cc251ffa601646bf8672200b416661ae91fb21ff84525eedf6d6c538ff0e36cf
    source_path: tools/thinking.md
    workflow: 15
---

## สิ่งที่ทำได้

- directive แบบ inline ในเนื้อหาข้อความขาเข้าทุกรายการ: `/t <level>`, `/think:<level>` หรือ `/thinking <level>`
- ระดับ (alias): `off | minimal | low | medium | high | xhigh | adaptive | max`
  - minimal → “think”
  - low → “think hard”
  - medium → “think harder”
  - high → “ultrathink” (งบประมาณสูงสุด)
  - xhigh → “ultrathink+” (โมเดล GPT-5.2+ และ Codex รวมถึง effort ของ Anthropic Claude Opus 4.7)
  - adaptive → การคิดแบบ adaptive ที่ผู้ให้บริการจัดการเอง (รองรับสำหรับ Claude 4.6 บน Anthropic/Bedrock และ Anthropic Claude Opus 4.7)
  - max → reasoning สูงสุดของผู้ให้บริการ (ปัจจุบันคือ Anthropic Claude Opus 4.7)
  - `x-high`, `x_high`, `extra-high`, `extra high` และ `extra_high` จะถูกแมปไปที่ `xhigh`
  - `highest` จะถูกแมปไปที่ `high`
- หมายเหตุเกี่ยวกับผู้ให้บริการ:
  - เมนูและตัวเลือกการคิดขับเคลื่อนด้วย provider profile ผู้ให้บริการ Plugin จะประกาศชุดระดับที่แน่นอนสำหรับโมเดลที่เลือก รวมถึง label เช่น `on` แบบไบนารี
  - `adaptive`, `xhigh` และ `max` จะถูกประกาศเฉพาะสำหรับ provider/model profile ที่รองรับเท่านั้น directive แบบมีชนิดกำกับสำหรับระดับที่ไม่รองรับจะถูกปฏิเสธพร้อมตัวเลือกที่ใช้ได้ของโมเดลนั้น
  - ระดับที่ไม่รองรับซึ่งเก็บไว้ก่อนหน้านี้จะถูกแมปใหม่ตามลำดับอันดับของ provider profile `adaptive` จะ fallback ไปที่ `medium` บนโมเดลที่ไม่รองรับ adaptive ส่วน `xhigh` และ `max` จะ fallback ไปยังระดับที่ไม่ใช่ `off` ที่สูงที่สุดซึ่งโมเดลที่เลือกนั้นรองรับ
  - โมเดล Anthropic Claude 4.6 จะใช้ค่าเริ่มต้นเป็น `adaptive` เมื่อไม่ได้ตั้งค่าระดับการคิดอย่างชัดเจน
  - Anthropic Claude Opus 4.7 ไม่ได้ใช้ adaptive thinking เป็นค่าเริ่มต้น ค่า effort เริ่มต้นของ API ยังคงเป็นของผู้ให้บริการ เว้นแต่คุณจะตั้งค่าระดับการคิดอย่างชัดเจน
  - Anthropic Claude Opus 4.7 แมป `/think xhigh` ไปยัง adaptive thinking พร้อม `output_config.effort: "xhigh"` เนื่องจาก `/think` เป็น directive ด้านการคิด และ `xhigh` เป็นค่าการตั้ง effort ของ Opus 4.7
  - Anthropic Claude Opus 4.7 ยังรองรับ `/think max` ด้วย โดยจะถูกแมปไปยังเส้นทาง max effort แบบเดียวกันที่ผู้ให้บริการกำหนด
  - โมเดล OpenAI GPT แมป `/think` ผ่านการรองรับ effort ของ Responses API ที่เฉพาะกับแต่ละโมเดล `/think off` จะส่ง `reasoning.effort: "none"` เฉพาะเมื่อโมเดลเป้าหมายรองรับเท่านั้น มิฉะนั้น OpenClaw จะละ payload สำหรับปิด reasoning แทนการส่งค่าที่ไม่รองรับ
  - MiniMax (`minimax/*`) บนเส้นทางสตรีมที่เข้ากันได้กับ Anthropic จะตั้งค่าเริ่มต้นเป็น `thinking: { type: "disabled" }` เว้นแต่คุณจะตั้งค่าการคิดอย่างชัดเจนใน model params หรือ request params เพื่อหลีกเลี่ยง `reasoning_content` delta ที่รั่วออกมาจากรูปแบบสตรีม Anthropic ที่ไม่ใช่แบบเนทีฟของ MiniMax
  - Z.AI (`zai/*`) รองรับเฉพาะการคิดแบบไบนารี (`on`/`off`) ระดับใดก็ตามที่ไม่ใช่ `off` จะถูกมองว่าเป็น `on` (แมปเป็น `low`)
  - Moonshot (`moonshot/*`) แมป `/think off` ไปยัง `thinking: { type: "disabled" }` และระดับใดก็ตามที่ไม่ใช่ `off` ไปยัง `thinking: { type: "enabled" }` เมื่อเปิดการคิด Moonshot จะยอมรับ `tool_choice` ได้เฉพาะ `auto|none` เท่านั้น OpenClaw จะ normalize ค่าที่ไม่เข้ากันให้เป็น `auto`

## ลำดับการ resolve

1. directive แบบ inline บนข้อความ (มีผลเฉพาะกับข้อความนั้น)
2. session override (ตั้งค่าโดยการส่งข้อความที่มีแต่ directive อย่างเดียว)
3. ค่าเริ่มต้นต่อเอเจนต์ (`agents.list[].thinkingDefault` ในคอนฟิก)
4. ค่าเริ่มต้นระดับ global (`agents.defaults.thinkingDefault` ในคอนฟิก)
5. Fallback: ค่าเริ่มต้นที่ผู้ให้บริการประกาศเมื่อมี; มิฉะนั้นโมเดลที่รองรับ reasoning จะ resolve เป็น `medium` หรือระดับที่ใกล้ที่สุดซึ่งไม่ใช่ `off` และโมเดลที่ไม่รองรับ reasoning จะคงเป็น `off`

## การตั้งค่า session default

- ส่งข้อความที่มี **เฉพาะ** directive เท่านั้น (อนุญาตให้มีช่องว่างได้) เช่น `/think:medium` หรือ `/t high`
- ค่านั้นจะคงอยู่สำหรับเซสชันปัจจุบัน (ค่าเริ่มต้นเป็นแบบต่อผู้ส่ง); ถูกล้างด้วย `/think:off` หรือการรีเซ็ตเมื่อเซสชันว่าง
- จะมีการส่งข้อความยืนยัน (`Thinking level set to high.` / `Thinking disabled.`) หากระดับไม่ถูกต้อง (เช่น `/thinking big`) คำสั่งจะถูกปฏิเสธพร้อม hint และสถานะของเซสชันจะไม่เปลี่ยนแปลง
- ส่ง `/think` (หรือ `/think:`) โดยไม่ใส่อาร์กิวเมนต์เพื่อดูระดับการคิดปัจจุบัน

## การนำไปใช้โดยเอเจนต์

- **Embedded Pi**: ระดับที่ resolve แล้วจะถูกส่งต่อไปยังรันไทม์เอเจนต์ Pi ในโปรเซส

## โหมด Fast (/fast)

- ระดับ: `on|off`
- ข้อความที่มีเฉพาะ directive จะสลับ session override ของโหมด fast และตอบกลับ `Fast mode enabled.` / `Fast mode disabled.`
- ส่ง `/fast` (หรือ `/fast status`) โดยไม่ระบุโหมดเพื่อดูสถานะโหมด fast ที่มีผลจริงในปัจจุบัน
- OpenClaw จะ resolve โหมด fast ตามลำดับนี้:
  1. `/fast on|off` แบบ inline/directive-only
  2. Session override
  3. ค่าเริ่มต้นต่อเอเจนต์ (`agents.list[].fastModeDefault`)
  4. คอนฟิกต่อโมเดล: `agents.defaults.models["<provider>/<model>"].params.fastMode`
  5. Fallback: `off`
- สำหรับ `openai/*` โหมด fast จะถูกแมปไปยังการประมวลผลแบบลำดับความสำคัญของ OpenAI โดยส่ง `service_tier=priority` บนคำขอ Responses ที่รองรับ
- สำหรับ `openai-codex/*` โหมด fast จะส่งแฟล็ก `service_tier=priority` เดียวกันบน Codex Responses OpenClaw ใช้ตัวสลับ `/fast` ร่วมกันหนึ่งตัวสำหรับทั้งสองเส้นทาง auth
- สำหรับคำขอ `anthropic/*` สาธารณะโดยตรง รวมถึงทราฟฟิกที่ยืนยันตัวตนด้วย OAuth ซึ่งส่งไปยัง `api.anthropic.com` โหมด fast จะถูกแมปไปยัง service tier ของ Anthropic: `/fast on` ตั้งค่า `service_tier=auto`, `/fast off` ตั้งค่า `service_tier=standard_only`
- สำหรับ `minimax/*` บนเส้นทางที่เข้ากันได้กับ Anthropic `/fast on` (หรือ `params.fastMode: true`) จะเขียน `MiniMax-M2.7` ใหม่เป็น `MiniMax-M2.7-highspeed`
- model params ของ Anthropic แบบ explicit `serviceTier` / `service_tier` จะ override ค่าเริ่มต้นของโหมด fast เมื่อมีการตั้งทั้งสองอย่าง OpenClaw ยังคงข้ามการฉีด service tier ของ Anthropic สำหรับ base URL ของพร็อกซีที่ไม่ใช่ Anthropic
- `/status` จะแสดง `Fast` เฉพาะเมื่อเปิดโหมด fast เท่านั้น

## directive แบบ Verbose (/verbose หรือ /v)

- ระดับ: `on` (ขั้นต่ำ) | `full` | `off` (ค่าเริ่มต้น)
- ข้อความที่มีเฉพาะ directive จะสลับ verbose ของเซสชันและตอบกลับ `Verbose logging enabled.` / `Verbose logging disabled.`; ระดับที่ไม่ถูกต้องจะส่งกลับ hint โดยไม่เปลี่ยนสถานะ
- `/verbose off` จะเก็บ session override แบบ explicit; ล้างค่าได้ผ่าน UI ของ Sessions โดยเลือก `inherit`
- directive แบบ inline มีผลเฉพาะกับข้อความนั้น; มิฉะนั้นจะใช้ค่าเริ่มต้นของ session/global
- ส่ง `/verbose` (หรือ `/verbose:`) โดยไม่ใส่อาร์กิวเมนต์เพื่อดูระดับ verbose ปัจจุบัน
- เมื่อเปิด verbose เอเจนต์ที่ปล่อยผลลัพธ์เครื่องมือแบบมีโครงสร้าง (Pi, เอเจนต์ JSON อื่น ๆ) จะส่งแต่ละการเรียกเครื่องมือกลับมาเป็นข้อความเฉพาะ metadata ของตัวเอง โดยมีคำนำหน้า `<emoji> <tool-name>: <arg>` เมื่อมี (path/command) สรุปเครื่องมือเหล่านี้จะถูกส่งทันทีที่เครื่องมือแต่ละตัวเริ่มทำงาน (เป็น bubble แยกกัน) ไม่ใช่เป็น streaming delta
- สรุปความล้มเหลวของเครื่องมือยังคงมองเห็นได้ในโหมดปกติ แต่ส่วนต่อท้ายรายละเอียดข้อผิดพลาดดิบจะถูกซ่อนไว้ เว้นแต่ verbose จะเป็น `on` หรือ `full`
- เมื่อ verbose เป็น `full` เอาต์พุตของเครื่องมือจะถูกส่งต่อด้วยหลังเสร็จสิ้น (bubble แยกต่างหาก ตัดให้สั้นในระดับที่ปลอดภัย) หากคุณสลับ `/verbose on|full|off` ขณะมีงานกำลังรันอยู่ bubble ของเครื่องมือถัดไปจะใช้การตั้งค่าใหม่

## directive สำหรับ Plugin trace (/trace)

- ระดับ: `on` | `off` (ค่าเริ่มต้น)
- ข้อความที่มีเฉพาะ directive จะสลับเอาต์พุต session plugin trace และตอบกลับ `Plugin trace enabled.` / `Plugin trace disabled.`
- directive แบบ inline มีผลเฉพาะกับข้อความนั้น; มิฉะนั้นจะใช้ค่าเริ่มต้นของ session/global
- ส่ง `/trace` (หรือ `/trace:`) โดยไม่ใส่อาร์กิวเมนต์เพื่อดูระดับ trace ปัจจุบัน
- `/trace` แคบกว่า `/verbose`: มันเปิดเผยเฉพาะบรรทัด trace/debug ที่เป็นของ Plugin เช่นสรุป debug ของ Active Memory
- บรรทัด trace สามารถปรากฏใน `/status` และเป็นข้อความวินิจฉัยติดตามผลหลังคำตอบปกติของผู้ช่วย

## การมองเห็น reasoning (/reasoning)

- ระดับ: `on|off|stream`
- ข้อความที่มีเฉพาะ directive จะสลับว่าจะแสดงบล็อกการคิดในคำตอบหรือไม่
- เมื่อเปิดใช้งาน reasoning จะถูกส่งเป็น **ข้อความแยก** ที่มีคำนำหน้า `Reasoning:`
- `stream` (เฉพาะ Telegram): จะสตรีม reasoning ลงใน draft bubble ของ Telegram ขณะกำลังสร้างคำตอบ จากนั้นส่งคำตอบสุดท้ายโดยไม่มี reasoning
- Alias: `/reason`
- ส่ง `/reasoning` (หรือ `/reasoning:`) โดยไม่ใส่อาร์กิวเมนต์เพื่อดูระดับ reasoning ปัจจุบัน
- ลำดับการ resolve: directive แบบ inline จากนั้น session override จากนั้นค่าเริ่มต้นต่อเอเจนต์ (`agents.list[].reasoningDefault`) จากนั้น fallback (`off`)

## ที่เกี่ยวข้อง

- เอกสารโหมด elevated อยู่ที่ [Elevated mode](/th/tools/elevated)

## Heartbeats

- เนื้อความของ Heartbeat probe คือ prompt ของ Heartbeat ที่กำหนดไว้ (ค่าเริ่มต้น: `Read HEARTBEAT.md if it exists (workspace context). Follow it strictly. Do not infer or repeat old tasks from prior chats. If nothing needs attention, reply HEARTBEAT_OK.`) directive แบบ inline ในข้อความ Heartbeat จะมีผลตามปกติ (แต่ควรหลีกเลี่ยงการเปลี่ยนค่าเริ่มต้นของเซสชันจาก Heartbeat)
- การส่ง Heartbeat จะใช้ค่าเริ่มต้นเป็นเฉพาะ payload สุดท้าย หากต้องการส่งข้อความ `Reasoning:` แยกต่างหากด้วย (เมื่อมี) ให้ตั้งค่า `agents.defaults.heartbeat.includeReasoning: true` หรือแบบต่อเอเจนต์ `agents.list[].heartbeat.includeReasoning: true`

## Web chat UI

- ตัวเลือกระดับการคิดของ web chat จะสะท้อนระดับที่เก็บไว้ของเซสชันจาก inbound session store/config เมื่อโหลดหน้า
- การเลือกอีกระดับหนึ่งจะเขียน session override ทันทีผ่าน `sessions.patch`; ไม่ได้รอการส่งครั้งถัดไป และไม่ใช่ override แบบใช้ครั้งเดียว `thinkingOnce`
- ตัวเลือกแรกจะเป็น `Default (<resolved level>)` เสมอ โดยค่าเริ่มต้นที่ resolve แล้วมาจาก provider thinking profile ของโมเดลในเซสชันที่ใช้งานอยู่ บวกกับตรรกะ fallback แบบเดียวกับที่ `/status` และ `session_status` ใช้
- ตัวเลือกนี้ใช้ `thinkingOptions` ที่ Gateway row ส่งกลับมา UI ในเบราว์เซอร์จะไม่เก็บรายการ regex ของผู้ให้บริการไว้เอง Plugins เป็นเจ้าของชุดระดับที่เฉพาะกับโมเดล
- `/think:<level>` ยังคงทำงานและอัปเดตระดับของเซสชันที่เก็บไว้แบบเดียวกัน ดังนั้น directive ในแชตและตัวเลือกนี้จึงซิงก์กัน

## Provider profile

- Provider plugin สามารถเปิดเผย `resolveThinkingProfile(ctx)` เพื่อกำหนดระดับและค่าเริ่มต้นที่โมเดลรองรับ
- แต่ละระดับใน profile มี `id` แบบ canonical ที่เก็บไว้ (`off`, `minimal`, `low`, `medium`, `high`, `xhigh`, `adaptive` หรือ `max`) และอาจมี `label` สำหรับแสดงผล ผู้ให้บริการแบบไบนารีจะใช้ `{ id: "low", label: "on" }`
- hook แบบเก่าที่เผยแพร่อยู่ (`supportsXHighThinking`, `isBinaryThinking` และ `resolveDefaultThinkingLevel`) ยังคงมีอยู่เป็น adapter เพื่อความเข้ากันได้ แต่ชุดระดับแบบกำหนดเองใหม่ควรใช้ `resolveThinkingProfile`
- Gateway row จะเปิดเผย `thinkingOptions` และ `thinkingDefault` เพื่อให้ไคลเอนต์ ACP/chat แสดง profile เดียวกับที่การตรวจสอบในรันไทม์ใช้
