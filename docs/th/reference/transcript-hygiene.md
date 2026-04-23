---
read_when:
    - คุณกำลังดีบักการปฏิเสธคำขอจาก provider ที่ผูกกับรูปทรงของทรานสคริปต์аԥсыра to=final code omitted】【。analysis to=final code omitted
    - คุณกำลังเปลี่ยนตรรกะการ sanitize ทรานสคริปต์หรือการซ่อมแซม tool-call
    - คุณกำลังสืบสวนความไม่ตรงกันของ tool-call id ข้าม providers
summary: 'เอกสารอ้างอิง: กฎการ sanitize และซ่อมแซมทรานสคริปต์ที่เฉพาะกับ provider'
title: Transcript Hygiene
x-i18n:
    generated_at: "2026-04-23T05:56:41Z"
    model: gpt-5.4
    provider: openai
    source_hash: 217afafb693cf89651e8fa361252f7b5c197feb98d20be4697a83e6dedc0ec3f
    source_path: reference/transcript-hygiene.md
    workflow: 15
---

# Transcript Hygiene (Provider Fixups)

เอกสารนี้อธิบาย **การแก้ไขเฉพาะของ provider** ที่ถูกนำไปใช้กับทรานสคริปต์ก่อนการรัน
(ระหว่างการสร้าง model context) การทำ hygiene เหล่านี้เป็นการปรับแบบ **ในหน่วยความจำ**
เพื่อให้ตรงตามข้อกำหนดที่เข้มงวดของ provider โดยขั้นตอน hygiene เหล่านี้ **จะไม่** เขียนทรานสคริปต์ JSONL ที่เก็บอยู่บนดิสก์ใหม่
อย่างไรก็ตาม มีขั้นตอน repair ของ session-file แยกต่างหากที่อาจเขียนไฟล์ JSONL ที่ผิดรูปใหม่
โดยการทิ้งบรรทัดที่ไม่ถูกต้องก่อนโหลด session เมื่อมีการ repair เกิดขึ้น
ไฟล์ต้นฉบับจะถูกสำรองไว้ข้างๆ session file

ขอบเขตครอบคลุม:

- การ sanitize tool call id
- การตรวจสอบความถูกต้องของ tool call input
- การซ่อมแซมการจับคู่ tool result
- การตรวจสอบ / การจัดลำดับเทิร์น
- การ cleanup thought signature
- การ sanitize image payload
- การติดแท็ก provenance ของ user-input (สำหรับพรอมป์ต์ที่ถูกกำหนดเส้นทางข้ามเซสชัน)

หากคุณต้องการรายละเอียดการเก็บทรานสคริปต์ โปรดดู:

- [/reference/session-management-compaction](/th/reference/session-management-compaction)

---

## ส่วนที่รันสิ่งนี้

Transcript hygiene ทั้งหมดถูกรวมศูนย์ไว้ใน embedded runner:

- การเลือกนโยบาย: `src/agents/transcript-policy.ts`
- การนำการ sanitize/repair ไปใช้: `sanitizeSessionHistory` ใน `src/agents/pi-embedded-runner/google.ts`

นโยบายจะใช้ `provider`, `modelApi` และ `modelId` เพื่อตัดสินใจว่าจะใช้สิ่งใดบ้าง

แยกจาก transcript hygiene ไฟล์ session จะถูก repair (หากจำเป็น) ก่อนโหลด:

- `repairSessionFileIfNeeded` ใน `src/agents/session-file-repair.ts`
- ถูกเรียกจาก `run/attempt.ts` และ `compact.ts` (embedded runner)

---

## กฎระดับโกลบอล: การ sanitize รูปภาพ

image payloads จะถูก sanitize เสมอเพื่อป้องกันการถูก provider ปฏิเสธเนื่องจากขนาด
เกินขีดจำกัด (ลดขนาด/บีบอัดใหม่สำหรับรูป base64 ที่ใหญ่เกินไป)

สิ่งนี้ยังช่วยควบคุมแรงกดดันด้านโทเค็นที่เกิดจากรูปภาพสำหรับโมเดลที่รองรับ vision ได้ด้วย
โดยขนาดด้านสูงสุดที่เล็กลงมักลดการใช้โทเค็น; ขนาดที่สูงขึ้นจะคงรายละเอียดไว้ได้มากกว่า

การติดตั้งใช้งาน:

- `sanitizeSessionMessagesImages` ใน `src/agents/pi-embedded-helpers/images.ts`
- `sanitizeContentBlocksImages` ใน `src/agents/tool-images.ts`
- ขนาดด้านสูงสุดของรูปตั้งค่าได้ผ่าน `agents.defaults.imageMaxDimensionPx` (ค่าเริ่มต้น: `1200`)

---

## กฎระดับโกลบอล: malformed tool calls

บล็อก tool-call ของ assistant ที่ไม่มีทั้ง `input` และ `arguments` จะถูกทิ้ง
ก่อนสร้าง model context สิ่งนี้ป้องกันการปฏิเสธจาก provider อันเกิดจาก
tool calls ที่ถูกเก็บถาวรแบบไม่สมบูรณ์ (ตัวอย่างเช่น หลัง rate limit failure)

การติดตั้งใช้งาน:

- `sanitizeToolCallInputs` ใน `src/agents/session-transcript-repair.ts`
- ถูกนำไปใช้ใน `sanitizeSessionHistory` ใน `src/agents/pi-embedded-runner/google.ts`

---

## กฎระดับโกลบอล: provenance ของอินพุตข้ามเซสชัน

เมื่อเอเจนต์ส่งพรอมป์ต์เข้าไปยังอีกเซสชันหนึ่งผ่าน `sessions_send` (รวมถึง
ขั้นตอน reply/announce แบบ agent-to-agent) OpenClaw จะเก็บ user turn ที่ถูกสร้างขึ้นพร้อมกับ:

- `message.provenance.kind = "inter_session"`

metadata นี้จะถูกเขียนตอน append ทรานสคริปต์ และไม่เปลี่ยน role
(`role: "user"` ยังคงเดิมเพื่อความเข้ากันได้กับ provider) ตัวอ่านทรานสคริปต์สามารถใช้สิ่งนี้เพื่อหลีกเลี่ยงการมองพรอมป์ต์ภายในที่ถูกกำหนดเส้นทางว่าเป็นคำสั่งที่เขียนโดยผู้ใช้ปลายทางจริง

ระหว่างการสร้างบริบทใหม่ OpenClaw ยัง prepend marker สั้นๆ `[Inter-session message]`
ให้กับ user turns เหล่านั้นในหน่วยความจำ เพื่อให้โมเดลแยกความต่างออกจาก
คำสั่งของผู้ใช้ปลายทางภายนอกได้

---

## เมทริกซ์ของ provider (พฤติกรรมปัจจุบัน)

**OpenAI / OpenAI Codex**

- sanitize เฉพาะรูปภาพเท่านั้น
- ทิ้ง reasoning signatures ที่กำพร้า (reasoning items ที่อยู่เดี่ยวโดยไม่มี content block ตามหลัง) สำหรับทรานสคริปต์แบบ OpenAI Responses/Codex
- ไม่มีการ sanitize tool call id
- ไม่มีการซ่อมแซมการจับคู่ tool result
- ไม่มีการตรวจสอบหรือจัดลำดับเทิร์นใหม่
- ไม่มี synthetic tool results
- ไม่มีการลบ thought signature

**Google (Generative AI / Gemini CLI / Antigravity)**

- sanitize tool call id: alphanumeric แบบเข้มงวด
- ซ่อมแซมการจับคู่ tool result และสร้าง synthetic tool results
- ตรวจสอบเทิร์น (การสลับเทิร์นแบบ Gemini)
- แก้ไขลำดับเทิร์นของ Google (prepend user bootstrap เล็กๆ หากประวัติเริ่มด้วย assistant)
- Antigravity Claude: normalize thinking signatures; ทิ้ง thinking blocks ที่ไม่มี signature

**Anthropic / Minimax (Anthropic-compatible)**

- ซ่อมแซมการจับคู่ tool result และสร้าง synthetic tool results
- ตรวจสอบเทิร์น (merge user turns ที่ติดกันเพื่อให้ตรงกับการสลับเทิร์นแบบเข้มงวด)

**Mistral (รวมถึงการตรวจจับที่อิงกับ model-id)**

- sanitize tool call id: strict9 (alphanumeric ความยาว 9)

**OpenRouter Gemini**

- cleanup thought signature: ตัดค่า `thought_signature` ที่ไม่ใช่ base64 ออก (คงค่า base64 ไว้)

**อย่างอื่นทั้งหมด**

- sanitize เฉพาะรูปภาพเท่านั้น

---

## พฤติกรรมในอดีต (ก่อน 2026.1.22)

ก่อนรีลีส 2026.1.22 OpenClaw ใช้ transcript hygiene หลายชั้น:

- **transcript-sanitize extension** จะรันในทุกการสร้างบริบทและสามารถ:
  - ซ่อมแซมการจับคู่ tool use/result
  - sanitize tool call ids (รวมถึงโหมดไม่เข้มงวดที่คง `_`/`-` ไว้)
- runner เองก็ทำการ sanitize เฉพาะ provider ด้วย ซึ่งซ้ำซ้อนกับงานเดิม
- มีการกลายพันธุ์เพิ่มเติมนอกนโยบายของ provider รวมถึง:
  - การลบแท็ก `<final>` ออกจากข้อความของ assistant ก่อนเก็บถาวร
  - การทิ้ง assistant error turns ที่ว่างเปล่า
  - การตัด assistant content หลัง tool calls

ความซับซ้อนนี้ทำให้เกิด regression ข้าม provider (โดยเฉพาะการจับคู่
`call_id|fc_id` ของ `openai-responses`) การ cleanup ใน 2026.1.22 จึงลบ extension ออก รวมตรรกะทั้งหมดไว้ใน runner และทำให้ OpenAI เป็นแบบ **no-touch**
ยกเว้นเฉพาะการ sanitize รูปภาพ
