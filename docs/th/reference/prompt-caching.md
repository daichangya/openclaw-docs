---
read_when:
    - คุณต้องการลดค่าใช้จ่ายของ prompt token ด้วย cache retention
    - คุณต้องการพฤติกรรมแคชแยกตาม agent ในการตั้งค่าแบบหลาย agent
    - คุณกำลังปรับแต่ง Heartbeat และการตัดแต่ง cache-ttl ไปพร้อมกัน
summary: ตัวเลือกการปรับ prompt caching, ลำดับการรวมค่า, พฤติกรรมของ provider และรูปแบบการปรับแต่ง
title: การแคช prompt
x-i18n:
    generated_at: "2026-04-24T09:31:27Z"
    model: gpt-5.4
    provider: openai
    source_hash: 2534a5648db39dae0979bd8b84263f83332fbaa2dc2c0675409c307fa991c7c8
    source_path: reference/prompt-caching.md
    workflow: 15
---

การแคช prompt หมายถึงผู้ให้บริการโมเดลสามารถนำ prompt prefix ที่ไม่เปลี่ยนแปลงมาใช้ซ้ำได้ (โดยทั่วไปคือคำสั่ง system/developer และบริบทคงที่อื่น ๆ) ข้ามหลายเทิร์น แทนที่จะต้องประมวลผลใหม่ทุกครั้ง OpenClaw จะ normalize usage ของ provider ไปเป็น `cacheRead` และ `cacheWrite` เมื่อ API ต้นทางเปิดเผยตัวนับเหล่านั้นโดยตรง

พื้นผิวสถานะยังสามารถกู้คืนตัวนับแคชจาก usage log ล่าสุดของ transcript
ได้เมื่อ snapshot ของเซสชันแบบสดไม่มีข้อมูลเหล่านั้น ดังนั้น `/status` จึงยังสามารถ
แสดงบรรทัดแคชต่อไปได้หลังการสูญหายบางส่วนของ metadata ของเซสชัน อย่างไรก็ตาม
ค่าแคชแบบสดที่ไม่เป็นศูนย์ที่มีอยู่แล้วจะยังคงมีลำดับความสำคัญเหนือค่าถอยกลับจาก transcript

เหตุใดสิ่งนี้จึงสำคัญ: ลดต้นทุนโทเค็น, ตอบกลับได้เร็วขึ้น และให้ประสิทธิภาพที่คาดการณ์ได้มากขึ้นสำหรับเซสชันระยะยาว หากไม่มีการแคช prompt ที่ถูกใช้ซ้ำจะต้องจ่ายต้นทุน prompt เต็มทุกเทิร์น แม้ว่าอินพุตส่วนใหญ่จะไม่เปลี่ยนแปลงก็ตาม

หน้านี้ครอบคลุมตัวเลือกทั้งหมดที่เกี่ยวข้องกับแคชซึ่งมีผลต่อการใช้ prompt ซ้ำและต้นทุนโทเค็น

ข้อมูลอ้างอิงของ provider:

- การแคช prompt ของ Anthropic: [https://platform.claude.com/docs/en/build-with-claude/prompt-caching](https://platform.claude.com/docs/en/build-with-claude/prompt-caching)
- การแคช prompt ของ OpenAI: [https://developers.openai.com/api/docs/guides/prompt-caching](https://developers.openai.com/api/docs/guides/prompt-caching)
- เฮดเดอร์ API และ request ID ของ OpenAI: [https://developers.openai.com/api/reference/overview](https://developers.openai.com/api/reference/overview)
- request ID และข้อผิดพลาดของ Anthropic: [https://platform.claude.com/docs/en/api/errors](https://platform.claude.com/docs/en/api/errors)

## ตัวเลือกหลัก

### `cacheRetention` (ค่าเริ่มต้นแบบ global, ระดับโมเดล และต่อ agent)

ตั้งค่า cache retention เป็นค่าเริ่มต้นแบบ global สำหรับทุกโมเดล:

```yaml
agents:
  defaults:
    params:
      cacheRetention: "long" # none | short | long
```

override ต่อโมเดล:

```yaml
agents:
  defaults:
    models:
      "anthropic/claude-opus-4-6":
        params:
          cacheRetention: "short" # none | short | long
```

override ต่อ agent:

```yaml
agents:
  list:
    - id: "alerts"
      params:
        cacheRetention: "none"
```

ลำดับการรวมคอนฟิก:

1. `agents.defaults.params` (ค่าเริ่มต้นแบบ global — ใช้กับทุกโมเดล)
2. `agents.defaults.models["provider/model"].params` (override ต่อโมเดล)
3. `agents.list[].params` (ตรงกับ agent id; override ตามคีย์)

### `contextPruning.mode: "cache-ttl"`

ตัดบริบทของผลลัพธ์จากเครื่องมือเก่าหลังหน้าต่าง TTL ของแคช เพื่อให้คำขอหลัง idle
ไม่ต้องแคชประวัติขนาดใหญ่ซ้ำอีก

```yaml
agents:
  defaults:
    contextPruning:
      mode: "cache-ttl"
      ttl: "1h"
```

ดู [Session Pruning](/th/concepts/session-pruning) สำหรับพฤติกรรมทั้งหมด

### Heartbeat keep-warm

Heartbeat สามารถช่วยคงความอุ่นของหน้าต่างแคชและลดการเขียนแคชซ้ำหลังช่วง idle

```yaml
agents:
  defaults:
    heartbeat:
      every: "55m"
```

รองรับ Heartbeat ต่อ agent ที่ `agents.list[].heartbeat`

## พฤติกรรมของ provider

### Anthropic (API โดยตรง)

- รองรับ `cacheRetention`
- สำหรับ auth profile แบบ Anthropic API key OpenClaw จะตั้งค่าเริ่มต้น `cacheRetention: "short"` ให้กับ Anthropic model ref เมื่อไม่ได้ตั้งค่าไว้
- การตอบกลับจาก Anthropic Messages แบบเนทีฟเปิดเผยทั้ง `cache_read_input_tokens` และ `cache_creation_input_tokens` ดังนั้น OpenClaw จึงสามารถแสดงทั้ง `cacheRead` และ `cacheWrite`
- สำหรับคำขอ Anthropic แบบเนทีฟ `cacheRetention: "short"` จะถูกแมปไปยังแคช ephemeral 5 นาทีตามค่าเริ่มต้น และ `cacheRetention: "long"` จะอัปเกรดเป็น TTL 1 ชั่วโมงเฉพาะบนโฮสต์ `api.anthropic.com` โดยตรงเท่านั้น

### OpenAI (API โดยตรง)

- การแคช prompt เป็นแบบอัตโนมัติบนโมเดลรุ่นใหม่ที่รองรับ OpenClaw ไม่จำเป็นต้อง inject cache marker ระดับบล็อก
- OpenClaw ใช้ `prompt_cache_key` เพื่อให้เส้นทางของแคชคงที่ข้ามหลายเทิร์น และใช้ `prompt_cache_retention: "24h"` เฉพาะเมื่อเลือก `cacheRetention: "long"` บนโฮสต์ OpenAI โดยตรง
- การตอบกลับของ OpenAI เปิดเผย cached prompt token ผ่าน `usage.prompt_tokens_details.cached_tokens` (หรือ `input_tokens_details.cached_tokens` ใน event ของ Responses API) OpenClaw จะแมปค่านั้นไปยัง `cacheRead`
- OpenAI ไม่เปิดเผยตัวนับโทเค็นสำหรับการเขียนแคชแยกต่างหาก ดังนั้น `cacheWrite` จะยังคงเป็น `0` บนเส้นทางของ OpenAI แม้ว่า provider จะกำลังอุ่นแคชอยู่ก็ตาม
- OpenAI ส่งคืนเฮดเดอร์สำหรับ tracing และ rate limit ที่มีประโยชน์ เช่น `x-request-id`, `openai-processing-ms` และ `x-ratelimit-*` แต่การนับ cache hit ควรอ้างอิงจาก usage payload ไม่ใช่จากเฮดเดอร์
- ในทางปฏิบัติ OpenAI มักทำงานคล้ายแคชของ prefix เริ่มต้น มากกว่าการใช้ประวัติเต็มแบบเลื่อนหน้าต่างของ Anthropic เท็กซ์แบบ long-prefix ที่คงที่อาจไปค้างใกล้เพดาน `4864` cached token ในการทดสอบสดปัจจุบัน ขณะที่ transcript แบบใช้เครื่องมือหนักหรือแบบ MCP มักค้างใกล้ `4608` cached token แม้จะทำซ้ำแบบตรงตัว

### Anthropic Vertex

- โมเดล Anthropic บน Vertex AI (`anthropic-vertex/*`) รองรับ `cacheRetention` เช่นเดียวกับ Anthropic โดยตรง
- `cacheRetention: "long"` จะถูกแมปไปยัง prompt-cache TTL 1 ชั่วโมงจริงบน endpoint ของ Vertex AI
- ค่าเริ่มต้นของ cache retention สำหรับ `anthropic-vertex` ตรงกับค่าเริ่มต้นของ Anthropic โดยตรง
- คำขอของ Vertex จะถูกกำหนดเส้นทางผ่านการจัดรูปแคชแบบรับรู้ boundary เพื่อให้การใช้แคชซ้ำสอดคล้องกับสิ่งที่ provider ได้รับจริง

### Amazon Bedrock

- Anthropic Claude model ref (`amazon-bedrock/*anthropic.claude*`) รองรับการส่งผ่าน `cacheRetention` แบบชัดเจน
- โมเดล Bedrock ที่ไม่ใช่ Anthropic จะถูกบังคับเป็น `cacheRetention: "none"` ที่ runtime

### โมเดล Anthropic บน OpenRouter

สำหรับ model ref แบบ `openrouter/anthropic/*` OpenClaw จะ inject
`cache_control` ของ Anthropic ลงในบล็อก prompt ของ system/developer เพื่อปรับปรุงการใช้ prompt-cache ซ้ำ
เฉพาะเมื่อคำขอยังคงกำหนดเป้าหมายไปยังเส้นทาง OpenRouter ที่ตรวจสอบแล้ว
(`openrouter` บน endpoint เริ่มต้นของมัน หรือ provider/base URL ใดก็ตามที่ resolve
ไปยัง `openrouter.ai`)

หากคุณเปลี่ยนปลายทางของโมเดลไปยัง proxy URL แบบเข้ากันได้กับ OpenAI อื่นตามอำเภอใจ OpenClaw
จะหยุด inject cache marker แบบ Anthropic ที่เฉพาะกับ OpenRouter เหล่านั้น

### provider อื่น ๆ

หาก provider ไม่รองรับโหมดแคชนี้ `cacheRetention` จะไม่มีผล

### Google Gemini direct API

- transport Gemini โดยตรง (`api: "google-generative-ai"`) รายงาน cache hit
  ผ่าน `cachedContentTokenCount` ของต้นทาง; OpenClaw จะแมปค่านั้นไปยัง `cacheRead`
- เมื่อมีการตั้งค่า `cacheRetention` บนโมเดล Gemini โดยตรง OpenClaw จะ
  สร้าง ใช้ซ้ำ และรีเฟรช resource `cachedContents` สำหรับ system prompt
  โดยอัตโนมัติในการรัน Google AI Studio ซึ่งหมายความว่าคุณไม่จำเป็นต้องสร้าง
  cached-content handle ล่วงหน้าด้วยตนเองอีกต่อไป
- คุณยังคงสามารถส่ง Gemini cached-content handle ที่มีอยู่แล้วผ่าน
  `params.cachedContent` (หรือ `params.cached_content` แบบ legacy) บน
  โมเดลที่กำหนดค่าไว้ได้
- สิ่งนี้แยกจากการแคช prompt-prefix ของ Anthropic/OpenAI สำหรับ Gemini
  OpenClaw จะจัดการ resource `cachedContents` แบบเนทีฟของ provider แทนที่จะ
  inject cache marker เข้าไปในคำขอ

### การใช้งาน JSON ของ Gemini CLI

- เอาต์พุต JSON ของ Gemini CLI สามารถแสดง cache hit ผ่าน `stats.cached`
  ได้เช่นกัน; OpenClaw จะแมปค่านั้นไปยัง `cacheRead`
- หาก CLI ไม่ส่งค่า `stats.input` โดยตรง OpenClaw จะคำนวณโทเค็นอินพุต
  จาก `stats.input_tokens - stats.cached`
- นี่เป็นเพียงการ normalize usage เท่านั้น ไม่ได้หมายความว่า OpenClaw กำลังสร้าง
  prompt-cache marker แบบ Anthropic/OpenAI สำหรับ Gemini CLI

## ขอบเขตแคชของ system-prompt

OpenClaw แยก system prompt ออกเป็น **prefix ที่คงที่** และ **suffix ที่เปลี่ยนแปลงได้**
โดยคั่นด้วย boundary ภายในสำหรับ cache-prefix เนื้อหาที่อยู่เหนือ
boundary (คำจำกัดความของเครื่องมือ, metadata ของ Skills, ไฟล์ workspace และ
บริบทอื่นที่ค่อนข้างคงที่) จะถูกจัดลำดับเพื่อให้คง byte-identical ข้ามหลายเทิร์น
เนื้อหาที่อยู่ใต้ boundary (เช่น `HEARTBEAT.md`, timestamp ของ runtime และ
metadata ต่อเทิร์นอื่น ๆ) สามารถเปลี่ยนแปลงได้โดยไม่ทำให้ prefix ที่แคชไว้
ใช้ไม่ได้

ตัวเลือกการออกแบบสำคัญ:

- ไฟล์บริบทโปรเจกต์ใน workspace ที่คงที่ จะถูกจัดลำดับก่อน `HEARTBEAT.md` เพื่อไม่ให้
  ความเปลี่ยนแปลงของ heartbeat ทำลาย stable prefix
- boundary นี้ถูกใช้ข้ามการจัดรูป transport ของตระกูล Anthropic, ตระกูล OpenAI, Google และ CLI เพื่อให้ provider ที่รองรับทั้งหมดได้ประโยชน์จากเสถียรภาพของ prefix แบบเดียวกัน
- คำขอ Codex Responses และ Anthropic Vertex ถูกกำหนดเส้นทางผ่าน
  การจัดรูปแคชแบบรับรู้ boundary เพื่อให้การใช้แคชซ้ำสอดคล้องกับสิ่งที่ provider ได้รับจริง
- fingerprint ของ system prompt ถูก normalize (ช่องว่าง, line ending,
  บริบทที่เพิ่มโดย hook, การจัดลำดับความสามารถของ runtime) เพื่อให้ prompt ที่มีความหมายเหมือนเดิมแชร์ KV/cache ข้ามหลายเทิร์นได้

หากคุณเห็น `cacheWrite` พุ่งสูงผิดปกติหลังการเปลี่ยนคอนฟิกหรือ workspace
ให้ตรวจสอบว่าการเปลี่ยนแปลงนั้นเกิดขึ้นเหนือหรือต่ำกว่า cache boundary การย้าย
เนื้อหาที่เปลี่ยนแปลงบ่อยไปไว้ใต้ boundary (หรือทำให้มันเสถียรขึ้น) มักช่วยแก้ปัญหานี้ได้

## กลไกคุ้มกันเสถียรภาพแคชของ OpenClaw

OpenClaw ยังทำให้รูปร่าง payload หลายอย่างที่ไวต่อแคชคงความแน่นอนก่อนที่
คำขอจะไปถึง provider:

- แค็ตตาล็อกเครื่องมือ MCP แบบ bundled จะถูกจัดเรียงอย่างกำหนดแน่นอนก่อนการลงทะเบียนเครื่องมือ
  ดังนั้นการเปลี่ยนลำดับ `listTools()` จะไม่ทำให้บล็อกเครื่องมือเปลี่ยนและไม่ทำลาย prompt-cache prefix
- เซสชันแบบ legacy ที่มี image block ถูกเก็บไว้ จะรักษา **3 เทิร์นที่เสร็จสมบูรณ์ล่าสุด**
  ไว้ครบถ้วน; image block ที่เก่ากว่าและผ่านการประมวลผลแล้วอาจถูกแทนที่ด้วย marker
  เพื่อให้การติดตามผลที่มีรูปภาพมากไม่ต้องส่ง payload ขนาดใหญ่ที่ล้าสมัยซ้ำไปมา

## รูปแบบการปรับแต่ง

### ทราฟฟิกแบบผสม (ค่าเริ่มต้นที่แนะนำ)

คงค่า baseline ระยะยาวไว้บน agent หลักของคุณ และปิดการแคชบน agent แจ้งเตือนที่ส่งเป็นช่วง ๆ:

```yaml
agents:
  defaults:
    model:
      primary: "anthropic/claude-opus-4-6"
    models:
      "anthropic/claude-opus-4-6":
        params:
          cacheRetention: "long"
  list:
    - id: "research"
      default: true
      heartbeat:
        every: "55m"
    - id: "alerts"
      params:
        cacheRetention: "none"
```

### baseline แบบเน้นประหยัดต้นทุน

- ตั้ง baseline `cacheRetention: "short"`
- เปิดใช้ `contextPruning.mode: "cache-ttl"`
- คง heartbeat ให้ต่ำกว่า TTL ของคุณเฉพาะสำหรับ agent ที่ได้ประโยชน์จากแคชอุ่นเท่านั้น

## การวินิจฉัยแคช

OpenClaw เปิดเผยการวินิจฉัย cache-trace โดยเฉพาะสำหรับการรัน embedded agent

สำหรับการวินิจฉัยทั่วไปที่ผู้ใช้มองเห็น `/status` และสรุป usage อื่น ๆ สามารถใช้
รายการ usage ล่าสุดของ transcript เป็นแหล่งข้อมูลถอยกลับสำหรับ `cacheRead` /
`cacheWrite` ได้ เมื่อรายการเซสชันแบบสดไม่มีตัวนับเหล่านั้น

## การทดสอบ regression แบบสด

OpenClaw เก็บเกตทดสอบ live cache regression แบบรวมชุดเดียวสำหรับ prefix ที่ทำซ้ำ, tool turn, image turn, transcript แบบเครื่องมือสไตล์ MCP และตัวควบคุมแบบไม่ใช้แคชของ Anthropic

- `src/agents/live-cache-regression.live.test.ts`
- `src/agents/live-cache-regression-baseline.ts`

รัน live gate แบบแคบด้วย:

```sh
OPENCLAW_LIVE_TEST=1 OPENCLAW_LIVE_CACHE_TEST=1 pnpm test:live:cache
```

ไฟล์ baseline จะเก็บตัวเลขแบบสดที่สังเกตได้ล่าสุด พร้อม regression floor เฉพาะ provider ที่ใช้โดยการทดสอบ
runner ยังใช้ session ID และ prompt namespace ใหม่ต่อการรันแต่ละครั้งด้วย เพื่อไม่ให้สถานะแคชก่อนหน้าไปรบกวนตัวอย่าง regression ปัจจุบัน

การทดสอบเหล่านี้ตั้งใจไม่ใช้เกณฑ์ความสำเร็จแบบเดียวกันทุก provider

### ความคาดหวังแบบสดของ Anthropic

- คาดว่าจะมีการเขียน warmup แบบชัดเจนผ่าน `cacheWrite`
- คาดว่าจะมีการใช้ประวัติซ้ำเกือบเต็มในการทำซ้ำหลายเทิร์น เพราะการควบคุมแคชของ Anthropic จะเลื่อนจุด breakpoint ของแคชไปตามบทสนทนา
- assertion แบบสดในปัจจุบันยังคงใช้ threshold อัตรา hit สูงสำหรับเส้นทางแบบคงที่, แบบเครื่องมือ และแบบรูปภาพ

### ความคาดหวังแบบสดของ OpenAI

- คาดเฉพาะ `cacheRead` `cacheWrite` จะยังคงเป็น `0`
- ให้มองการใช้แคชซ้ำในเทิร์นที่ทำซ้ำว่าเป็น plateau เฉพาะ provider ไม่ใช่การใช้ประวัติเต็มแบบเลื่อนหน้าต่างของ Anthropic
- assertion แบบสดในปัจจุบันใช้การตรวจสอบ floor แบบอนุรักษ์นิยมที่ได้จากพฤติกรรมแบบสดที่สังเกตได้บน `gpt-5.4-mini`:
  - stable prefix: `cacheRead >= 4608`, hit rate `>= 0.90`
  - tool transcript: `cacheRead >= 4096`, hit rate `>= 0.85`
  - image transcript: `cacheRead >= 3840`, hit rate `>= 0.82`
  - MCP-style transcript: `cacheRead >= 4096`, hit rate `>= 0.85`

การตรวจสอบแบบสดรวมล่าสุดเมื่อ 2026-04-04 ได้ผลลัพธ์ดังนี้:

- stable prefix: `cacheRead=4864`, hit rate `0.966`
- tool transcript: `cacheRead=4608`, hit rate `0.896`
- image transcript: `cacheRead=4864`, hit rate `0.954`
- MCP-style transcript: `cacheRead=4608`, hit rate `0.891`

เวลา wall-clock ล่าสุดบนเครื่องสำหรับเกตรวมชุดนี้อยู่ที่ประมาณ `88s`

เหตุผลที่ assertion แตกต่างกัน:

- Anthropic เปิดเผย cache breakpoint แบบชัดเจนและการใช้ประวัติการสนทนาแบบเลื่อนหน้าต่างซ้ำ
- การแคช prompt ของ OpenAI ยังคงไวต่อ exact-prefix แต่ prefix ที่นำกลับมาใช้ซ้ำได้จริงในทราฟฟิก Responses แบบสดอาจไปค้างที่จุดต่ำกว่าพรอมป์ต์เต็ม
- ด้วยเหตุนี้ การเปรียบเทียบ Anthropic และ OpenAI ด้วย threshold เปอร์เซ็นต์เดียวข้าม provider จะก่อให้เกิด false regression

### คอนฟิก `diagnostics.cacheTrace`

```yaml
diagnostics:
  cacheTrace:
    enabled: true
    filePath: "~/.openclaw/logs/cache-trace.jsonl" # optional
    includeMessages: false # default true
    includePrompt: false # default true
    includeSystem: false # default true
```

ค่าเริ่มต้น:

- `filePath`: `$OPENCLAW_STATE_DIR/logs/cache-trace.jsonl`
- `includeMessages`: `true`
- `includePrompt`: `true`
- `includeSystem`: `true`

### ตัวสลับ env (สำหรับดีบักแบบครั้งเดียว)

- `OPENCLAW_CACHE_TRACE=1` เปิดการทำ cache tracing
- `OPENCLAW_CACHE_TRACE_FILE=/path/to/cache-trace.jsonl` override พาธเอาต์พุต
- `OPENCLAW_CACHE_TRACE_MESSAGES=0|1` สลับการเก็บ payload ข้อความแบบเต็ม
- `OPENCLAW_CACHE_TRACE_PROMPT=0|1` สลับการเก็บข้อความ prompt
- `OPENCLAW_CACHE_TRACE_SYSTEM=0|1` สลับการเก็บ system prompt

### สิ่งที่ควรตรวจสอบ

- event ของ cache trace เป็น JSONL และมี snapshot ตามช่วง เช่น `session:loaded`, `prompt:before`, `stream:context` และ `session:after`
- ผลกระทบของ cache token ต่อเทิร์นสามารถดูได้จากพื้นผิว usage ปกติผ่าน `cacheRead` และ `cacheWrite` (เช่น `/usage full` และสรุป usage ของเซสชัน)
- สำหรับ Anthropic ควรเห็นทั้ง `cacheRead` และ `cacheWrite` เมื่อการแคชทำงานอยู่
- สำหรับ OpenAI ควรเห็น `cacheRead` เมื่อเกิด cache hit และ `cacheWrite` ควรยังคงเป็น `0`; OpenAI ไม่เผยแพร่ฟิลด์โทเค็นสำหรับการเขียนแคชแยกต่างหาก
- หากคุณต้องการ request tracing ให้บันทึก request ID และเฮดเดอร์ rate limit แยกจาก metric ของแคช เอาต์พุต cache-trace ปัจจุบันของ OpenClaw เน้นที่รูปร่างของ prompt/เซสชันและ usage โทเค็นที่ normalize แล้ว มากกว่าเฮดเดอร์การตอบกลับดิบของ provider

## การแก้ไขปัญหาอย่างรวดเร็ว

- `cacheWrite` สูงในเกือบทุกเทิร์น: ตรวจสอบอินพุต system prompt ที่เปลี่ยนแปลงบ่อย และยืนยันว่าโมเดล/ provider รองรับการตั้งค่าแคชของคุณ
- `cacheWrite` สูงบน Anthropic: มักหมายความว่า cache breakpoint ไปตกอยู่บนเนื้อหาที่เปลี่ยนทุกคำขอ
- `cacheRead` ของ OpenAI ต่ำ: ตรวจสอบว่า stable prefix อยู่ด้านหน้า, repeated prefix มีอย่างน้อย 1024 โทเค็น และมีการใช้ `prompt_cache_key` เดิมซ้ำในเทิร์นที่ควรแชร์แคช
- `cacheRetention` ไม่มีผล: ยืนยันว่าคีย์โมเดลตรงกับ `agents.defaults.models["provider/model"]`
- คำขอ Bedrock Nova/Mistral ที่มีการตั้งค่าแคช: เป็นพฤติกรรมที่คาดไว้ เพราะ runtime จะบังคับเป็น `none`

เอกสารที่เกี่ยวข้อง:

- [Anthropic](/th/providers/anthropic)
- [การใช้โทเค็นและค่าใช้จ่าย](/th/reference/token-use)
- [Session Pruning](/th/concepts/session-pruning)
- [ข้อมูลอ้างอิงการกำหนดค่า Gateway](/th/gateway/configuration-reference)

## ที่เกี่ยวข้อง

- [การใช้โทเค็นและค่าใช้จ่าย](/th/reference/token-use)
- [การใช้งาน API และค่าใช้จ่าย](/th/reference/api-usage-costs)
