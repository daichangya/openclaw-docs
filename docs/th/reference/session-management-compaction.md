---
read_when:
    - คุณต้องการดีบัก session id, transcript JSONL หรือฟิลด์ใน `sessions.json` to=final
    - คุณกำลังเปลี่ยนพฤติกรรม Compaction อัตโนมัติ หรือเพิ่ม housekeeping แบบ “ก่อน Compaction” to=final
    - คุณต้องการพัฒนา memory flush หรือ system turn แบบเงียบ to=final
summary: 'เจาะลึก: ที่เก็บเซสชันและ transcript, วงจรชีวิต และ internals ของ Compaction (อัตโนมัติ)'
title: เจาะลึกการจัดการเซสชัน
x-i18n:
    generated_at: "2026-04-23T05:55:15Z"
    model: gpt-5.4
    provider: openai
    source_hash: cb1a4048646486693db8943a9e9c6c5bcb205f0ed532b34842de3d0346077454
    source_path: reference/session-management-compaction.md
    workflow: 15
---

# การจัดการเซสชันและ Compaction (เจาะลึก)

เอกสารนี้อธิบายวิธีที่ OpenClaw จัดการเซสชันแบบครบวงจร:

- **การกำหนดเส้นทางเซสชัน** (ข้อความขาเข้าแมปไปยัง `sessionKey` อย่างไร)
- **ที่เก็บเซสชัน** (`sessions.json`) และสิ่งที่มันติดตาม
- **การเก็บ transcript** (`*.jsonl`) และโครงสร้างของมัน
- **Transcript hygiene** (การปรับแก้เฉพาะผู้ให้บริการก่อนการรัน)
- **ขีดจำกัดของบริบท** (หน้าต่างบริบทเทียบกับ token ที่ติดตามไว้)
- **Compaction** (Compaction แบบ manual + อัตโนมัติ) และจุดที่ควร hook งาน pre-compaction
- **Silent housekeeping** (เช่น การเขียน memory ที่ไม่ควรสร้างเอาต์พุตที่ผู้ใช้มองเห็น)

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

- UI ต่าง ๆ (แอป macOS, web Control UI, TUI) ควร query Gateway เพื่อดูรายการเซสชันและจำนวน token
- ในโหมด remote ไฟล์เซสชันจะอยู่บนโฮสต์ระยะไกล; การ “ตรวจสอบไฟล์บน Mac ของคุณในเครื่อง” จะไม่สะท้อนสิ่งที่ Gateway ใช้อยู่

---

## ชั้นของการเก็บข้อมูลถาวรสองชั้น

OpenClaw เก็บเซสชันไว้ในสองชั้น:

1. **ที่เก็บเซสชัน (`sessions.json`)**
   - แผนที่ key/value: `sessionKey -> SessionEntry`
   - มีขนาดเล็ก เปลี่ยนแปลงได้ ปลอดภัยต่อการแก้ไข (หรือลบรายการ)
   - ติดตาม metadata ของเซสชัน (session id ปัจจุบัน กิจกรรมล่าสุด toggles ตัวนับ token ฯลฯ)

2. **Transcript (`<sessionId>.jsonl`)**
   - transcript แบบ append-only ที่มีโครงสร้างแบบต้นไม้ (entry มี `id` + `parentId`)
   - เก็บการสนทนาจริง + การเรียก tool + สรุปจาก Compaction
   - ใช้สร้างบริบทของโมเดลขึ้นใหม่สำหรับเทิร์นในอนาคต

---

## ตำแหน่งบนดิสก์

ต่อเอเจนต์หนึ่งตัว บนโฮสต์ของ Gateway:

- Store: `~/.openclaw/agents/<agentId>/sessions/sessions.json`
- Transcripts: `~/.openclaw/agents/<agentId>/sessions/<sessionId>.jsonl`
  - เซสชันหัวข้อ Telegram: `.../<sessionId>-topic-<threadId>.jsonl`

OpenClaw resolve สิ่งเหล่านี้ผ่าน `src/config/sessions.ts`

---

## การบำรุงรักษา store และการควบคุมพื้นที่ดิสก์

การคงอยู่ของเซสชันมีตัวควบคุมการบำรุงรักษาอัตโนมัติ (`session.maintenance`) สำหรับ `sessions.json` และ transcript artifacts:

- `mode`: `warn` (ค่าเริ่มต้น) หรือ `enforce`
- `pruneAfter`: เกณฑ์อายุสำหรับตัดรายการที่เก่าออก (ค่าเริ่มต้น `30d`)
- `maxEntries`: จำกัดจำนวนรายการใน `sessions.json` (ค่าเริ่มต้น `500`)
- `rotateBytes`: หมุน `sessions.json` เมื่อขนาดเกิน (ค่าเริ่มต้น `10mb`)
- `resetArchiveRetention`: ระยะเวลาเก็บ transcript archive แบบ `*.reset.<timestamp>` (ค่าเริ่มต้น: เท่ากับ `pruneAfter`; ตั้ง `false` เพื่อปิดการล้าง)
- `maxDiskBytes`: งบประมาณขนาดไดเรกทอรีเซสชันแบบไม่บังคับ
- `highWaterBytes`: เป้าหมายหลัง cleanup แบบไม่บังคับ (ค่าเริ่มต้น `80%` ของ `maxDiskBytes`)

ลำดับการบังคับใช้สำหรับ cleanup ตามงบประมาณดิสก์ (`mode: "enforce"`):

1. ลบ archived หรือ orphan transcript artifact ที่เก่าที่สุดก่อน
2. หากยังเกินเป้าหมาย ให้ไล่ evict รายการเซสชันที่เก่าที่สุดพร้อมไฟล์ transcript ของมัน
3. ทำต่อไปจนกว่าการใช้งานจะอยู่ที่หรือต่ำกว่า `highWaterBytes`

ใน `mode: "warn"` OpenClaw จะรายงานการ evict ที่อาจเกิดขึ้น แต่จะไม่เปลี่ยนแปลง store/ไฟล์

รัน maintenance ตามต้องการ:

```bash
openclaw sessions cleanup --dry-run
openclaw sessions cleanup --enforce
```

---

## เซสชันของ Cron และ run logs

การรัน Cron แบบแยกก็สร้างรายการเซสชัน/transcript เช่นกัน และมีตัวควบคุมการเก็บรักษาเฉพาะของมัน:

- `cron.sessionRetention` (ค่าเริ่มต้น `24h`) จะตัดเซสชันของ isolated cron run ที่เก่าออกจาก session store (`false` เพื่อปิดใช้งาน)
- `cron.runLog.maxBytes` + `cron.runLog.keepLines` จะตัดไฟล์ `~/.openclaw/cron/runs/<jobId>.jsonl` (ค่าเริ่มต้น: `2_000_000` bytes และ `2000` lines)

---

## Session keys (`sessionKey`)

`sessionKey` ระบุว่า _คุณอยู่ในถังการสนทนาใด_ (การกำหนดเส้นทาง + การแยก)

รูปแบบที่พบบ่อย:

- แชตหลัก/โดยตรง (ต่อเอเจนต์): `agent:<agentId>:<mainKey>` (ค่าเริ่มต้น `main`)
- กลุ่ม: `agent:<agentId>:<channel>:group:<id>`
- ห้อง/ช่อง (Discord/Slack): `agent:<agentId>:<channel>:channel:<id>` หรือ `...:room:<id>`
- Cron: `cron:<job.id>`
- Webhook: `hook:<uuid>` (เว้นแต่จะมีการ override)

กฎแบบ canonical ถูกอธิบายไว้ที่ [/concepts/session](/th/concepts/session)

---

## Session ids (`sessionId`)

แต่ละ `sessionKey` จะชี้ไปยัง `sessionId` ปัจจุบัน (ไฟล์ transcript ที่ดำเนินบทสนทนาต่อ)

กฎแบบคร่าว ๆ:

- **Reset** (`/new`, `/reset`) จะสร้าง `sessionId` ใหม่สำหรับ `sessionKey` นั้น
- **Daily reset** (ค่าเริ่มต้น 4:00 AM ตามเวลาท้องถิ่นของโฮสต์ gateway) จะสร้าง `sessionId` ใหม่ในการส่งข้อความครั้งถัดไปหลังข้ามเส้น reset
- **Idle expiry** (`session.reset.idleMinutes` หรือแบบเดิม `session.idleMinutes`) จะสร้าง `sessionId` ใหม่เมื่อมีข้อความเข้ามาหลังพ้นช่วง idle หากกำหนดทั้ง daily + idle สิ่งที่หมดอายุก่อนจะเป็นตัวตัดสิน
- **Thread parent fork guard** (`session.parentForkMaxTokens`, ค่าเริ่มต้น `100000`) จะข้ามการ fork transcript ของ parent เมื่อเซสชันแม่มีขนาดใหญ่เกินไป; thread ใหม่จะเริ่มใหม่สด ๆ ตั้งค่า `0` เพื่อปิดใช้งาน

รายละเอียดการติดตั้ง: การตัดสินใจนี้เกิดขึ้นใน `initSessionState()` ใน `src/auto-reply/reply/session.ts`

---

## schema ของ session store (`sessions.json`)

ชนิดของค่าภายใน store คือ `SessionEntry` ใน `src/config/sessions.ts`

ฟิลด์สำคัญ (ไม่ครบทั้งหมด):

- `sessionId`: transcript id ปัจจุบัน (ชื่อไฟล์ถูก derive จากค่านี้ เว้นแต่จะตั้ง `sessionFile`)
- `updatedAt`: เวลาเกิดกิจกรรมล่าสุด
- `sessionFile`: การ override พาธ transcript แบบ explicit (ไม่บังคับ)
- `chatType`: `direct | group | room` (ช่วย UI และ send policy)
- `provider`, `subject`, `room`, `space`, `displayName`: metadata สำหรับป้ายชื่อกลุ่ม/ช่อง
- Toggles:
  - `thinkingLevel`, `verboseLevel`, `reasoningLevel`, `elevatedLevel`
  - `sendPolicy` (override ต่อเซสชัน)
- การเลือกโมเดล:
  - `providerOverride`, `modelOverride`, `authProfileOverride`
- ตัวนับ token (best-effort / ขึ้นกับผู้ให้บริการ):
  - `inputTokens`, `outputTokens`, `totalTokens`, `contextTokens`
- `compactionCount`: จำนวนครั้งที่ auto-compaction เสร็จสมบูรณ์สำหรับ session key นี้
- `memoryFlushAt`: timestamp ของ pre-compaction memory flush ล่าสุด
- `memoryFlushCompactionCount`: จำนวน compaction ตอนที่ flush ล่าสุดทำงาน

store ปลอดภัยต่อการแก้ไข แต่ Gateway คือผู้มีอำนาจจริง: มันอาจเขียนทับหรือเติมข้อมูลรายการใหม่ขณะเซสชันทำงาน

---

## โครงสร้าง Transcript (`*.jsonl`)

Transcript ถูกจัดการโดย `SessionManager` ของ `@mariozechner/pi-coding-agent`

ไฟล์เป็น JSONL:

- บรรทัดแรก: session header (`type: "session"` และมี `id`, `cwd`, `timestamp`, `parentSession` แบบไม่บังคับ)
- หลังจากนั้น: session entries ที่มี `id` + `parentId` (โครงสร้างแบบต้นไม้)

ประเภท entry ที่สำคัญ:

- `message`: ข้อความของ user/assistant/toolResult
- `custom_message`: ข้อความที่ extension ฉีดเข้าไปและ _เข้าสู่บริบทของโมเดล_ (ซ่อนจาก UI ได้)
- `custom`: สถานะของ extension ที่ _ไม่_ เข้าสู่บริบทของโมเดล
- `compaction`: สรุปจาก Compaction ที่ถูกเก็บถาวร พร้อม `firstKeptEntryId` และ `tokensBefore`
- `branch_summary`: สรุปที่ถูกเก็บถาวรเมื่อมีการนำทางไปยัง branch ของต้นไม้

OpenClaw ตั้งใจ **ไม่** “แก้ไข” transcript; Gateway ใช้ `SessionManager` ในการอ่าน/เขียนมัน

---

## หน้าต่างบริบทเทียบกับ token ที่ติดตามไว้

มีแนวคิดสองอย่างที่สำคัญ:

1. **หน้าต่างบริบทของโมเดล**: เพดานสูงสุดแบบตายตัวต่อโมเดล (จำนวน token ที่มองเห็นได้โดยโมเดล)
2. **ตัวนับใน session store**: ค่าสถิติแบบหมุนเวียนที่เขียนลง `sessions.json` (ใช้สำหรับ /status และ dashboard)

หากคุณกำลังปรับแต่งขีดจำกัด:

- หน้าต่างบริบทมาจากแค็ตตาล็อกของโมเดล (และ override ได้ผ่าน config)
- `contextTokens` ใน store เป็นค่าประมาณ/การรายงานในรันไทม์; อย่าถือว่าเป็นการรับประกันแบบเข้มงวด

ดูเพิ่มเติมได้ที่ [/token-use](/th/reference/token-use)

---

## Compaction: มันคืออะไร

Compaction จะสรุปส่วนที่เก่ากว่าของการสนทนาให้กลายเป็น entry แบบ `compaction` ที่ถูกเก็บถาวรใน transcript และคงข้อความล่าสุดไว้ครบ

หลังจาก Compaction เทิร์นในอนาคตจะเห็น:

- สรุปจาก Compaction
- ข้อความหลัง `firstKeptEntryId`

Compaction เป็นแบบ **ถาวร** (ต่างจาก session pruning) ดู [/concepts/session-pruning](/th/concepts/session-pruning)

## ขอบเขต chunk ของ Compaction และการจับคู่ tool

เมื่อ OpenClaw แบ่ง transcript ยาวออกเป็น chunk สำหรับ Compaction มันจะคง
assistant tool calls ไว้คู่กับ `toolResult` ที่ตรงกัน

- หากจุดแบ่งตามสัดส่วน token ไปตกอยู่ระหว่าง tool call กับผลลัพธ์ OpenClaw
  จะเลื่อนขอบเขตกลับไปที่ข้อความ assistant tool-call แทนที่จะปล่อยให้คู่แยกจากกัน
- หากบล็อก tool-result ท้ายสุดจะดัน chunk ให้เกินเป้าหมาย OpenClaw
  จะเก็บบล็อก tool ที่ค้างอยู่นั้นไว้ และคง unsummarized tail ไว้ครบ
- บล็อก tool-call ที่ abort/error จะไม่ทำให้ pending split ค้างไว้

---

## Auto-compaction เกิดขึ้นเมื่อใด (Pi runtime)

ใน embedded Pi agent auto-compaction จะเกิดในสองกรณี:

1. **การกู้คืนจาก overflow**: โมเดลคืนค่าข้อผิดพลาดเรื่องบริบทล้น
   (`request_too_large`, `context length exceeded`, `input exceeds the maximum
number of tokens`, `input token count exceeds the maximum number of input
tokens`, `input is too long for the model`, `ollama error: context length
exceeded` และรูปแบบเฉพาะผู้ให้บริการที่คล้ายกัน) → compact → retry
2. **การบำรุงรักษาตาม threshold**: หลังเทิร์นที่สำเร็จ เมื่อ:

`contextTokens > contextWindow - reserveTokens`

โดยที่:

- `contextWindow` คือหน้าต่างบริบทของโมเดล
- `reserveTokens` คือพื้นที่เผื่อที่สงวนไว้สำหรับพรอมป์ + เอาต์พุตของโมเดลในเทิร์นถัดไป

สิ่งเหล่านี้เป็นความหมายเชิง runtime ของ Pi (OpenClaw บริโภค events เหล่านั้น แต่ Pi เป็นผู้ตัดสินใจว่าจะ compact เมื่อใด)

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

OpenClaw ยังบังคับใช้ safety floor สำหรับ embedded run ด้วย:

- หาก `compaction.reserveTokens < reserveTokensFloor` OpenClaw จะดันค่าให้สูงขึ้น
- ค่า floor เริ่มต้นคือ `20000` tokens
- ตั้ง `agents.defaults.compaction.reserveTokensFloor: 0` เพื่อปิด floor
- หากค่าปัจจุบันสูงกว่านั้นอยู่แล้ว OpenClaw จะปล่อยไว้

เหตุผล: เพื่อเหลือ headroom มากพอสำหรับ “housekeeping” หลายเทิร์น (เช่น การเขียน memory) ก่อนที่ Compaction จะหลีกเลี่ยงไม่ได้

รายละเอียดการติดตั้ง: `ensurePiCompactionReserveTokens()` ใน `src/agents/pi-settings.ts`
(ถูกเรียกจาก `src/agents/pi-embedded-runner.ts`)

---

## ผู้ให้บริการ Compaction แบบเสียบปลั๊กได้

Plugin สามารถ register ผู้ให้บริการ Compaction ผ่าน `registerCompactionProvider()` บน plugin API ได้ เมื่อ `agents.defaults.compaction.provider` ถูกตั้งเป็น provider id ที่ลงทะเบียนไว้ safeguard extension จะ delegate การสรุปให้ผู้ให้บริการนั้นแทน pipeline `summarizeInStages` ที่มีมาในตัว

- `provider`: id ของ plugin ผู้ให้บริการ Compaction ที่ลงทะเบียนไว้ ปล่อยว่างไว้เพื่อใช้การสรุปด้วย LLM แบบเริ่มต้น
- การตั้งค่า `provider` จะบังคับให้ใช้ `mode: "safeguard"`
- ผู้ให้บริการจะได้รับคำสั่ง Compaction และนโยบายการคงตัวระบุเหมือนกับเส้นทางที่มีมาในตัว
- safeguard ยังคงเก็บบริบท suffix ของเทิร์นล่าสุดและ split-turn ไว้หลังจากได้ผลลัพธ์จากผู้ให้บริการ
- หากผู้ให้บริการล้มเหลวหรือคืนผลลัพธ์ว่าง OpenClaw จะ fallback ไปใช้การสรุปด้วย LLM ที่มีมาในตัวโดยอัตโนมัติ
- สัญญาณ abort/timeout จะถูกโยนต่อออกไป (ไม่ถูกกลืน) เพื่อเคารพการยกเลิกจากผู้เรียก

source: `src/plugins/compaction-provider.ts`, `src/agents/pi-hooks/compaction-safeguard.ts`

---

## พื้นผิวที่ผู้ใช้มองเห็นได้

คุณสามารถสังเกต Compaction และสถานะเซสชันได้ผ่าน:

- `/status` (ในเซสชันแชตใดก็ได้)
- `openclaw status` (CLI)
- `openclaw sessions` / `sessions --json`
- โหมด verbose: `🧹 Auto-compaction complete` + จำนวนครั้งของ Compaction

---

## Silent housekeeping (`NO_REPLY`)

OpenClaw รองรับเทิร์นแบบ “เงียบ” สำหรับงานเบื้องหลังที่ผู้ใช้ไม่ควรเห็นเอาต์พุตระหว่างทาง

ธรรมเนียม:

- ผู้ช่วยเริ่มเอาต์พุตด้วย silent token ที่ตรงตัว `NO_REPLY` /
  `no_reply` เพื่อสื่อว่า “อย่าส่งคำตอบให้ผู้ใช้”
- OpenClaw จะตัด/ระงับสิ่งนี้ในชั้นการส่งมอบ
- การระงับแบบ silent-token ที่ตรงตัวจะไม่สนตัวพิมพ์เล็กใหญ่ ดังนั้น `NO_REPLY` และ
  `no_reply` จะนับเหมือนกันเมื่อ payload ทั้งหมดมีเพียง silent token เท่านั้น
- สิ่งนี้มีไว้สำหรับเทิร์นที่เป็นงานเบื้องหลังจริง ๆ / ไม่มีการส่งมอบเท่านั้น; มันไม่ใช่ทางลัดสำหรับ
  คำขอของผู้ใช้ทั่วไปที่ต้องมีการดำเนินการ

ตั้งแต่ `2026.1.10` เป็นต้นมา OpenClaw ยังระงับ **draft/typing streaming** เมื่อ
partial chunk เริ่มต้นด้วย `NO_REPLY` ด้วย ดังนั้นการทำงานแบบเงียบจะไม่ทำให้เอาต์พุตบางส่วนรั่วออกมากลางเทิร์น

---

## “Memory flush” ก่อน Compaction (พัฒนาแล้ว)

เป้าหมาย: ก่อนที่ auto-compaction จะเกิดขึ้น ให้รัน agentic turn แบบเงียบที่เขียนสถานะที่คงทน
ลงดิสก์ (เช่น `memory/YYYY-MM-DD.md` ใน workspace ของเอเจนต์) เพื่อไม่ให้ Compaction
ลบบริบทสำคัญทิ้งได้

OpenClaw ใช้วิธี **pre-threshold flush**:

1. เฝ้าดูการใช้บริบทของเซสชัน
2. เมื่อมันข้าม “soft threshold” (ต่ำกว่า threshold ของ Compaction ใน Pi) ให้รันคำสั่ง
   “เขียนหน่วยความจำตอนนี้” แบบเงียบให้เอเจนต์
3. ใช้ silent token ที่ตรงตัว `NO_REPLY` / `no_reply` เพื่อให้ผู้ใช้
   ไม่เห็นอะไรเลย

Config (`agents.defaults.compaction.memoryFlush`):

- `enabled` (ค่าเริ่มต้น: `true`)
- `softThresholdTokens` (ค่าเริ่มต้น: `4000`)
- `prompt` (ข้อความผู้ใช้สำหรับ flush turn)
- `systemPrompt` (system prompt เพิ่มเติมที่ถูกต่อท้ายสำหรับ flush turn)

หมายเหตุ:

- prompt/system prompt เริ่มต้นมีคำใบ้ `NO_REPLY` เพื่อระงับ
  การส่งมอบ
- flush จะรันหนึ่งครั้งต่อหนึ่งรอบของ Compaction (ติดตามไว้ใน `sessions.json`)
- flush จะรันเฉพาะสำหรับ embedded Pi session (CLI backend จะข้าม)
- flush จะถูกข้ามเมื่อ workspace ของเซสชันเป็นแบบอ่านอย่างเดียว (`workspaceAccess: "ro"` หรือ `"none"`)
- ดู [Memory](/th/concepts/memory) สำหรับโครงสร้างไฟล์ของ workspace และรูปแบบการเขียน

Pi ยังเปิดเผย hook `session_before_compact` ใน extension API ด้วย แต่ตรรกะ flush ของ OpenClaw
ปัจจุบันอยู่ฝั่ง Gateway

---

## เช็กลิสต์การแก้ไขปัญหา

- session key ผิดหรือไม่? เริ่มที่ [/concepts/session](/th/concepts/session) และยืนยัน `sessionKey` ใน `/status`
- store กับ transcript ไม่ตรงกัน? ยืนยันโฮสต์ของ Gateway และพาธของ store จาก `openclaw status`
- Compaction ถี่เกินไป? ตรวจสอบ:
  - หน้าต่างบริบทของโมเดล (เล็กเกินไป)
  - การตั้งค่า Compaction (`reserveTokens` ที่สูงเกินไปเมื่อเทียบกับหน้าต่างของโมเดล อาจทำให้ Compaction เกิดเร็วขึ้น)
  - tool-result บวม: เปิดใช้/ปรับแต่ง session pruning
- เทิร์นเงียบมีข้อมูลรั่ว? ยืนยันว่าคำตอบเริ่มต้นด้วย `NO_REPLY` (โทเค็นตรงตัวแบบไม่สนตัวพิมพ์เล็กใหญ่) และคุณใช้บิลด์ที่มีการแก้ไขเรื่องการระงับการสตรีมแล้ว
