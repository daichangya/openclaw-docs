---
read_when:
    - คุณต้องดีบัก session ids, transcript JSONL หรือฟิลด์ใน sessions.json
    - คุณกำลังเปลี่ยนพฤติกรรม Compaction อัตโนมัติหรือเพิ่มงานดูแลก่อน Compaction ต่ํา
    - คุณต้องการติดตั้งใช้งานการ flush หน่วยความจำหรือ system turns แบบเงียบ
summary: 'เจาะลึก: session store + transcripts, วงจรชีวิต และรายละเอียดภายในของ Compaction (อัตโนมัติ)'
title: เจาะลึกการจัดการเซสชัน
x-i18n:
    generated_at: "2026-04-24T09:31:51Z"
    model: gpt-5.4
    provider: openai
    source_hash: 9e236840ebf9d4980339c801c1ecb70a7f413ea18987400ac47db0818b5cab8c
    source_path: reference/session-management-compaction.md
    workflow: 15
---

# การจัดการเซสชันและ Compaction (เจาะลึก)

เอกสารนี้อธิบายวิธีที่ OpenClaw จัดการเซสชันแบบครบวงจร:

- **การกำหนดเส้นทางเซสชัน** (ข้อความขาเข้าแมปไปยัง `sessionKey` อย่างไร)
- **Session store** (`sessions.json`) และสิ่งที่มันติดตาม
- **การ persist transcript** (`*.jsonl`) และโครงสร้างของมัน
- **สุขอนามัยของ transcript** (การแก้ไขเฉพาะผู้ให้บริการก่อนการรัน)
- **ขีดจำกัดบริบท** (context window เทียบกับโทเค็นที่ติดตาม)
- **Compaction** (Compaction แบบ manual + auto-compaction) และตำแหน่งที่ใช้เชื่อมงานก่อน Compaction
- **งานดูแลแบบเงียบ** (เช่น การเขียนหน่วยความจำที่ไม่ควรสร้างเอาต์พุตที่ผู้ใช้มองเห็น)

หากคุณต้องการภาพรวมระดับสูงก่อน ให้เริ่มที่:

- [/concepts/session](/th/concepts/session)
- [/concepts/compaction](/th/concepts/compaction)
- [/concepts/memory](/th/concepts/memory)
- [/concepts/memory-search](/th/concepts/memory-search)
- [/concepts/session-pruning](/th/concepts/session-pruning)
- [/reference/transcript-hygiene](/th/reference/transcript-hygiene)

---

## แหล่งข้อมูลจริง: Gateway

OpenClaw ถูกออกแบบโดยมี **โปรเซส Gateway เดียว** ที่เป็นเจ้าของสถานะของเซสชัน

- UI ต่างๆ (แอป macOS, เว็บ Control UI, TUI) ควรคิวรี Gateway เพื่อดูรายการเซสชันและจำนวนโทเค็น
- ในโหมดระยะไกล ไฟล์เซสชันจะอยู่บนโฮสต์ระยะไกล; การ “ตรวจสอบไฟล์บน Mac ในเครื่องของคุณ” จะไม่สะท้อนสิ่งที่ Gateway กำลังใช้อยู่

---

## ชั้นการ persist สองชั้น

OpenClaw persist เซสชันไว้ในสองชั้น:

1. **Session store (`sessions.json`)**
   - แมปแบบคีย์/ค่า: `sessionKey -> SessionEntry`
   - ขนาดเล็ก เปลี่ยนแปลงได้ ปลอดภัยต่อการแก้ไข (หรือลบรายการ)
   - ติดตามข้อมูลเมตาของเซสชัน (id เซสชันปัจจุบัน กิจกรรมล่าสุด toggles ตัวนับโทเค็น ฯลฯ)

2. **Transcript (`<sessionId>.jsonl`)**
   - transcript แบบ append-only ที่มีโครงสร้างเป็นต้นไม้ (รายการมี `id` + `parentId`)
   - เก็บบทสนทนาจริง + การเรียกใช้เครื่องมือ + สรุป Compaction
   - ใช้สร้างบริบทของโมเดลกลับขึ้นมาใหม่สำหรับ turns ในอนาคต

---

## ตำแหน่งบนดิสก์

ต่อเอเจนต์หนึ่งตัว บนโฮสต์ Gateway:

- Store: `~/.openclaw/agents/<agentId>/sessions/sessions.json`
- Transcripts: `~/.openclaw/agents/<agentId>/sessions/<sessionId>.jsonl`
  - เซสชันหัวข้อ Telegram: `.../<sessionId>-topic-<threadId>.jsonl`

OpenClaw resolve ตำแหน่งเหล่านี้ผ่าน `src/config/sessions.ts`

---

## การบำรุงรักษา store และการควบคุมดิสก์

การ persist เซสชันมีตัวควบคุมการบำรุงรักษาอัตโนมัติ (`session.maintenance`) สำหรับ `sessions.json` และ artifact ของ transcript:

- `mode`: `warn` (ค่าเริ่มต้น) หรือ `enforce`
- `pruneAfter`: ค่าตัดอายุของรายการที่ stale (ค่าเริ่มต้น `30d`)
- `maxEntries`: จำกัดจำนวนรายการใน `sessions.json` (ค่าเริ่มต้น `500`)
- `rotateBytes`: rotate `sessions.json` เมื่อมีขนาดใหญ่เกินไป (ค่าเริ่มต้น `10mb`)
- `resetArchiveRetention`: ระยะเวลาเก็บรักษา transcript archive แบบ `*.reset.<timestamp>` (ค่าเริ่มต้น: เท่ากับ `pruneAfter`; `false` จะปิดการล้างข้อมูล)
- `maxDiskBytes`: งบประมาณขนาดไดเรกทอรีเซสชันแบบไม่บังคับ
- `highWaterBytes`: เป้าหมายหลังการล้างข้อมูลแบบไม่บังคับ (ค่าเริ่มต้น `80%` ของ `maxDiskBytes`)

ลำดับการบังคับใช้สำหรับการล้างข้อมูลตามงบประมาณดิสก์ (`mode: "enforce"`):

1. ลบ archived transcript artifact หรือ orphan ที่เก่าที่สุดก่อน
2. หากยังเกินเป้าหมาย ให้ขับรายการเซสชันที่เก่าที่สุดและไฟล์ transcript ของรายการนั้นออก
3. ทำต่อไปจนกว่าการใช้งานจะอยู่ที่หรือต่ำกว่า `highWaterBytes`

ใน `mode: "warn"` OpenClaw จะรายงานการขับออกที่อาจเกิดขึ้น แต่จะไม่เปลี่ยนแปลง store/ไฟล์

รันการบำรุงรักษาเมื่อใดก็ได้:

```bash
openclaw sessions cleanup --dry-run
openclaw sessions cleanup --enforce
```

---

## เซสชัน Cron และบันทึกการรัน

การรัน Cron แบบแยกก็สร้างรายการเซสชัน/transcript เช่นกัน และมีตัวควบคุมการเก็บรักษาเฉพาะ:

- `cron.sessionRetention` (ค่าเริ่มต้น `24h`) จะ prune เซสชันการรัน Cron แบบแยกที่เก่าออกจาก session store (`false` คือปิดใช้งาน)
- `cron.runLog.maxBytes` + `cron.runLog.keepLines` จะ prune ไฟล์ `~/.openclaw/cron/runs/<jobId>.jsonl` (ค่าเริ่มต้น: `2_000_000` bytes และ `2000` บรรทัด)

---

## คีย์เซสชัน (`sessionKey`)

`sessionKey` ใช้ระบุว่าอยู่ใน _bucket ของบทสนทนาใด_ (การกำหนดเส้นทาง + การแยกกัน)

รูปแบบที่พบบ่อย:

- แชตหลัก/แชตตรง (ต่อเอเจนต์): `agent:<agentId>:<mainKey>` (ค่าเริ่มต้น `main`)
- กลุ่ม: `agent:<agentId>:<channel>:group:<id>`
- ห้อง/แชนเนล (Discord/Slack): `agent:<agentId>:<channel>:channel:<id>` หรือ `...:room:<id>`
- Cron: `cron:<job.id>`
- Webhook: `hook:<uuid>` (เว้นแต่จะ override)

กฎแบบ canonical มีเอกสารไว้ที่ [/concepts/session](/th/concepts/session)

---

## id ของเซสชัน (`sessionId`)

แต่ละ `sessionKey` จะชี้ไปยัง `sessionId` ปัจจุบัน (ไฟล์ transcript ที่ใช้บทสนทนาต่อ)

กฎคร่าวๆ:

- **Reset** (`/new`, `/reset`) จะสร้าง `sessionId` ใหม่สำหรับ `sessionKey` นั้น
- **Daily reset** (ค่าเริ่มต้น 4:00 น. ตามเวลาท้องถิ่นบนโฮสต์ gateway) จะสร้าง `sessionId` ใหม่ในข้อความถัดไปหลังผ่านขอบเขตเวลาการรีเซ็ต
- **Idle expiry** (`session.reset.idleMinutes` หรือ `session.idleMinutes` แบบเดิม) จะสร้าง `sessionId` ใหม่เมื่อมีข้อความเข้ามาหลังเกินช่วง idle หากตั้งค่าทั้ง daily + idle ระบบจะยึดตัวที่หมดอายุก่อน
- **Thread parent fork guard** (`session.parentForkMaxTokens`, ค่าเริ่มต้น `100000`) จะข้ามการ fork transcript ของ parent เมื่อเซสชัน parent มีขนาดใหญ่เกินไปอยู่แล้ว; thread ใหม่จะเริ่มแบบ fresh ตั้งค่า `0` เพื่อปิดใช้งาน

รายละเอียด implementation: การตัดสินใจนี้เกิดขึ้นใน `initSessionState()` ใน `src/auto-reply/reply/session.ts`

---

## สคีมาของ session store (`sessions.json`)

ชนิดค่าของ store คือ `SessionEntry` ใน `src/config/sessions.ts`

ฟิลด์สำคัญ (ไม่ครบทั้งหมด):

- `sessionId`: id transcript ปัจจุบัน (ชื่อไฟล์ derive จากค่านี้ เว้นแต่จะตั้ง `sessionFile`)
- `updatedAt`: เวลากิจกรรมล่าสุด
- `sessionFile`: override พาธ transcript แบบ explicit ที่เป็นทางเลือก
- `chatType`: `direct | group | room` (ช่วย UI และนโยบายการส่ง)
- `provider`, `subject`, `room`, `space`, `displayName`: ข้อมูลเมตาสำหรับป้ายกำกับกลุ่ม/แชนเนล
- Toggles:
  - `thinkingLevel`, `verboseLevel`, `reasoningLevel`, `elevatedLevel`
  - `sendPolicy` (override ต่อเซสชัน)
- การเลือกโมเดล:
  - `providerOverride`, `modelOverride`, `authProfileOverride`
- ตัวนับโทเค็น (best-effort / ขึ้นกับผู้ให้บริการ):
  - `inputTokens`, `outputTokens`, `totalTokens`, `contextTokens`
- `compactionCount`: จำนวนครั้งที่ auto-compaction เสร็จสิ้นสำหรับคีย์เซสชันนี้
- `memoryFlushAt`: เวลาประทับสำหรับ pre-compaction memory flush ครั้งล่าสุด
- `memoryFlushCompactionCount`: จำนวน Compaction ตอนที่ flush ครั้งล่าสุดทำงาน

store ปลอดภัยต่อการแก้ไข แต่ Gateway เป็นผู้มีอำนาจหลัก: มันอาจเขียนทับหรือ rehydrate รายการต่างๆ ระหว่างที่เซสชันกำลังทำงาน

---

## โครงสร้าง transcript (`*.jsonl`)

transcript ถูกจัดการโดย `SessionManager` ของ `@mariozechner/pi-coding-agent`

ไฟล์เป็น JSONL:

- บรรทัดแรก: session header (`type: "session"` มี `id`, `cwd`, `timestamp`, `parentSession` แบบไม่บังคับ)
- หลังจากนั้น: รายการเซสชันที่มี `id` + `parentId` (โครงสร้างต้นไม้)

ชนิดรายการที่สำคัญ:

- `message`: ข้อความ user/assistant/toolResult
- `custom_message`: ข้อความที่ extension inject และ _เข้าสู่ model context_ (สามารถซ่อนจาก UI ได้)
- `custom`: สถานะของ extension ที่ _ไม่_ เข้าสู่ model context
- `compaction`: สรุป Compaction ที่ persist พร้อม `firstKeptEntryId` และ `tokensBefore`
- `branch_summary`: สรุปที่ persist เมื่อมีการนำทางใน tree branch

OpenClaw ตั้งใจ **ไม่** “แก้ไข” transcript; Gateway ใช้ `SessionManager` เพื่ออ่าน/เขียนโดยตรง

---

## context windows เทียบกับโทเค็นที่ติดตาม

มีสองแนวคิดที่สำคัญ:

1. **Model context window**: เพดานตายตัวต่อโมเดล (โทเค็นที่โมเดลมองเห็นได้)
2. **ตัวนับใน session store**: สถิติแบบ rolling ที่เขียนลงใน `sessions.json` (ใช้กับ /status และแดชบอร์ด)

หากคุณกำลังปรับจูนขีดจำกัด:

- context window มาจากแค็ตตาล็อกโมเดล (และสามารถ override ผ่าน config ได้)
- `contextTokens` ใน store เป็นค่าประมาณ/ค่ารายงานขณะรัน; อย่ามองว่าเป็นการรับประกันแบบเข้มงวด

ดูเพิ่มเติมได้ที่ [/token-use](/th/reference/token-use)

---

## Compaction: มันคืออะไร

Compaction จะสรุปบทสนทนาเก่าให้กลายเป็นรายการ `compaction` ที่ persist อยู่ใน transcript และเก็บข้อความล่าสุดไว้ครบ

หลัง Compaction แล้ว turns ในอนาคตจะเห็น:

- สรุป Compaction
- ข้อความหลัง `firstKeptEntryId`

Compaction เป็นแบบ **persistent** (ไม่เหมือน session pruning) ดู [/concepts/session-pruning](/th/concepts/session-pruning)

## ขอบเขต chunk ของ Compaction และการจับคู่เครื่องมือ

เมื่อ OpenClaw แบ่ง transcript ยาวออกเป็น chunk สำหรับ Compaction มันจะคง
assistant tool calls ให้จับคู่กับรายการ `toolResult` ที่ตรงกันไว้

- หากจุดแบ่งตามสัดส่วนโทเค็นตกอยู่ระหว่าง tool call กับผลลัพธ์ OpenClaw
  จะเลื่อนขอบเขตกลับไปยังข้อความ assistant tool-call แทนที่จะให้คู่ดังกล่าวแยกจากกัน
- หากบล็อก tool-result ตอนท้ายจะทำให้ chunk เกินเป้าหมาย OpenClaw
  จะคงบล็อก tool ที่ยังค้างนั้นไว้ และเก็บ tail ที่ยังไม่ถูกสรุปให้คงเดิม
- บล็อก tool-call ที่ถูก abort/เกิด error จะไม่ทำให้มีการค้างการแบ่งเอาไว้

---

## เมื่อใดที่ auto-compaction เกิดขึ้น (Pi runtime)

ในเอเจนต์ Pi แบบฝัง auto-compaction จะถูกกระตุ้นในสองกรณี:

1. **การกู้คืนจาก overflow**: โมเดลคืนค่า error เรื่อง context overflow
   (`request_too_large`, `context length exceeded`, `input exceeds the maximum
number of tokens`, `input token count exceeds the maximum number of input
tokens`, `input is too long for the model`, `ollama error: context length
exceeded` และรูปแบบอื่นที่คล้ายกันตามผู้ให้บริการ) → compact → retry
2. **การบำรุงรักษาตาม threshold**: หลังจบ turn สำเร็จ เมื่อ:

`contextTokens > contextWindow - reserveTokens`

โดยที่:

- `contextWindow` คือ context window ของโมเดล
- `reserveTokens` คือ headroom ที่สงวนไว้สำหรับ prompts + เอาต์พุตของโมเดลครั้งถัดไป

นี่เป็น semantics ของ Pi runtime (OpenClaw เป็นผู้ใช้เหตุการณ์เหล่านั้น แต่ Pi เป็นผู้ตัดสินใจว่าจะ Compact เมื่อใด)

---

## การตั้งค่า Compaction (`reserveTokens`, `keepRecentTokens`)

การตั้งค่า Compaction ของ Pi อยู่ใน Pi settings:

```json5
{
  compaction: {
    enabled: true,
    reserveTokens: 16384,
    keepRecentTokens: 20000,
  },
}
```

OpenClaw ยังบังคับใช้ safety floor สำหรับการรันแบบฝังด้วย:

- หาก `compaction.reserveTokens < reserveTokensFloor` OpenClaw จะเพิ่มค่าให้
- floor ค่าเริ่มต้นคือ `20000` tokens
- ตั้ง `agents.defaults.compaction.reserveTokensFloor: 0` เพื่อปิด floor นี้
- หากค่าสูงกว่าอยู่แล้ว OpenClaw จะปล่อยไว้ตามเดิม

เหตุผล: เพื่อคง headroom ให้เพียงพอสำหรับ “งานดูแล” หลาย turn (เช่น การเขียนหน่วยความจำ) ก่อนที่ Compaction จะเลี่ยงไม่ได้

Implementation: `ensurePiCompactionReserveTokens()` ใน `src/agents/pi-settings.ts`
(ถูกเรียกจาก `src/agents/pi-embedded-runner.ts`)

---

## ผู้ให้บริการ Compaction แบบเสียบปลั๊กได้

ปลั๊กอินสามารถลงทะเบียนผู้ให้บริการ Compaction ผ่าน `registerCompactionProvider()` บน API ของปลั๊กอิน เมื่อกำหนด `agents.defaults.compaction.provider` เป็น id ของผู้ให้บริการที่ลงทะเบียนไว้ safeguard extension จะมอบหมายงานสรุปให้ผู้ให้บริการนั้นแทน pipeline `summarizeInStages` แบบในตัว

- `provider`: id ของปลั๊กอินผู้ให้บริการ Compaction ที่ลงทะเบียนไว้ เว้นว่างไว้เพื่อใช้การสรุปด้วย LLM แบบค่าเริ่มต้น
- การตั้งค่า `provider` จะบังคับ `mode: "safeguard"`
- ผู้ให้บริการจะได้รับคำสั่งสำหรับ Compaction และนโยบายการคงตัวระบุเหมือนกับเส้นทางแบบในตัว
- safeguard ยังคงรักษาบริบท suffix ของ recent-turn และ split-turn หลังผลลัพธ์จากผู้ให้บริการ
- หากผู้ให้บริการล้มเหลวหรือคืนผลลัพธ์ว่าง OpenClaw จะ fallback ไปใช้การสรุปด้วย LLM แบบในตัวโดยอัตโนมัติ
- สัญญาณ abort/timeout จะถูกโยนกลับขึ้นไป (ไม่ถูกกลืน) เพื่อเคารพการยกเลิกจากผู้เรียก

Source: `src/plugins/compaction-provider.ts`, `src/agents/pi-hooks/compaction-safeguard.ts`

---

## พื้นผิวที่ผู้ใช้มองเห็นได้

คุณสามารถสังเกต Compaction และสถานะเซสชันได้ผ่าน:

- `/status` (ในทุกแชตเซสชัน)
- `openclaw status` (CLI)
- `openclaw sessions` / `sessions --json`
- โหมด verbose: `🧹 Auto-compaction complete` + จำนวน Compaction

---

## งานดูแลแบบเงียบ (`NO_REPLY`)

OpenClaw รองรับ turns แบบ “เงียบ” สำหรับงานเบื้องหลังที่ผู้ใช้ไม่ควรเห็นเอาต์พุตระหว่างทาง

ข้อตกลง:

- ผู้ช่วยเริ่มเอาต์พุตด้วยโทเค็นแบบเงียบที่ตรงกันทุกตัวอักษร `NO_REPLY` /
  `no_reply` เพื่อระบุว่า “ไม่ต้องส่งคำตอบให้ผู้ใช้”
- OpenClaw จะตัด/ระงับสิ่งนี้ในชั้นการส่ง
- การระงับด้วยโทเค็นแบบเงียบที่ตรงกันทุกตัวอักษรจะไม่สนตัวพิมพ์เล็ก-ใหญ่ ดังนั้น `NO_REPLY` และ
  `no_reply` จะถือว่าใช้ได้ทั้งคู่เมื่อ payload ทั้งหมดมีเพียงโทเค็นแบบเงียบนั้น
- สิ่งนี้มีไว้สำหรับ turns แบบเบื้องหลัง/ไม่ส่งออกจริงๆ เท่านั้น; ไม่ใช่ทางลัดสำหรับ
  คำขอปกติจากผู้ใช้ที่ต้องดำเนินการ

ตั้งแต่ `2026.1.10` เป็นต้นมา OpenClaw ยังระงับ **draft/typing streaming** เมื่อ
partial chunk เริ่มต้นด้วย `NO_REPLY` ด้วย ดังนั้นการดำเนินการแบบเงียบจะไม่ปล่อย
เอาต์พุตบางส่วนระหว่าง turn ออกมา

---

## “memory flush” ก่อน Compaction (มีการติดตั้งใช้งานแล้ว)

เป้าหมาย: ก่อนที่ auto-compaction จะเกิดขึ้น ให้รัน turn แบบเอเจนต์ที่เงียบและเขียนสถานะแบบถาวรลงดิสก์ (เช่น `memory/YYYY-MM-DD.md` ใน workspace ของเอเจนต์) เพื่อให้ Compaction ไม่สามารถลบบริบทสำคัญได้

OpenClaw ใช้วิธี **flush ก่อนถึง threshold**:

1. ติดตามการใช้บริบทของเซสชัน
2. เมื่อข้าม “soft threshold” (ต่ำกว่า threshold ของ Compaction ใน Pi) ให้รันคำสั่งแบบเงียบ
   “เขียนหน่วยความจำตอนนี้” ไปยังเอเจนต์
3. ใช้โทเค็นแบบเงียบที่ตรงกันทุกตัวอักษร `NO_REPLY` / `no_reply` เพื่อไม่ให้ผู้ใช้เห็นอะไรเลย

Config (`agents.defaults.compaction.memoryFlush`):

- `enabled` (ค่าเริ่มต้น: `true`)
- `softThresholdTokens` (ค่าเริ่มต้น: `4000`)
- `prompt` (ข้อความผู้ใช้สำหรับ flush turn)
- `systemPrompt` (system prompt เพิ่มเติมที่ถูกต่อท้ายสำหรับ flush turn)

หมายเหตุ:

- prompt/system prompt ค่าเริ่มต้นมีคำใบ้ `NO_REPLY` เพื่อระงับ
  การส่ง
- flush จะรันหนึ่งครั้งต่อรอบของ Compaction (ติดตามไว้ใน `sessions.json`)
- flush จะรันเฉพาะสำหรับเซสชัน Pi แบบฝังเท่านั้น (แบ็กเอนด์ CLI จะข้าม)
- flush จะถูกข้ามเมื่อ workspace ของเซสชันเป็นแบบอ่านอย่างเดียว (`workspaceAccess: "ro"` หรือ `"none"`)
- ดู [Memory](/th/concepts/memory) สำหรับเลย์เอาต์ไฟล์ใน workspace และรูปแบบการเขียน

Pi ยังเปิดเผย hook `session_before_compact` ใน API ของ extension ด้วย แต่ตรรกะ
flush ของ OpenClaw ปัจจุบันอยู่ฝั่ง Gateway

---

## เช็กลิสต์การแก้ปัญหา

- session key ไม่ถูกต้อง? เริ่มที่ [/concepts/session](/th/concepts/session) และตรวจสอบ `sessionKey` ใน `/status`
- store กับ transcript ไม่ตรงกัน? ตรวจสอบโฮสต์ Gateway และพาธของ store จาก `openclaw status`
- Compaction ถี่เกิน? ตรวจสอบ:
  - context window ของโมเดล (เล็กเกินไป)
  - การตั้งค่า Compaction (`reserveTokens` สูงเกินไปเมื่อเทียบกับ context window ของโมเดลอาจทำให้ Compact เร็วขึ้น)
  - tool-result ที่พองเกิน: เปิดใช้/ปรับจูน session pruning
- turns แบบเงียบรั่ว? ตรวจสอบว่า reply เริ่มต้นด้วย `NO_REPLY` (โทเค็นตรงกันทุกตัวอักษรแบบไม่สนตัวพิมพ์เล็ก-ใหญ่) และคุณอยู่บน build ที่มีการแก้ไขการระงับสตรีมแล้ว

## ที่เกี่ยวข้อง

- [การจัดการเซสชัน](/th/concepts/session)
- [Session pruning](/th/concepts/session-pruning)
- [Context engine](/th/concepts/context-engine)
