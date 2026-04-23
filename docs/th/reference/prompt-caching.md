---
read_when:
    - คุณต้องการลดต้นทุนโทเค็นของ prompt ด้วยการคงแคชไว้
    - คุณต้องการพฤติกรรมแคชแบบรายเอเจนต์ในการตั้งค่าแบบหลายเอเจนต์
    - คุณกำลังกำหนดจูน Heartbeat และการตัดทอน cache-ttl ร่วมกัน
summary: ตัวเลือกควบคุม prompt caching ลำดับการ merge พฤติกรรมของผู้ให้บริการ และรูปแบบการปรับแต่ง
title: Prompt Caching
x-i18n:
    generated_at: "2026-04-23T05:55:19Z"
    model: gpt-5.4
    provider: openai
    source_hash: 13d5f3153b6593ae22cd04a6c2540e074cf15df9f1990fc5b7184fe803f4a1bd
    source_path: reference/prompt-caching.md
    workflow: 15
---

# Prompt Caching

Prompt caching หมายถึงความสามารถที่ผู้ให้บริการโมเดลสามารถนำ prompt prefix ที่ไม่เปลี่ยนแปลงกลับมาใช้ซ้ำได้ (โดยทั่วไปคือ system/developer instructions และบริบทคงที่อื่นๆ) ข้ามหลายเทิร์น แทนที่จะต้องประมวลผลใหม่ทุกครั้ง OpenClaw จะ normalize การใช้งานของผู้ให้บริการเป็น `cacheRead` และ `cacheWrite` เมื่อ upstream API เปิดเผยตัวนับเหล่านั้นโดยตรง

พื้นผิวสถานะยังสามารถกู้คืนตัวนับแคชจาก usage log ล่าสุดใน transcript ได้
เมื่อ live session snapshot ไม่มีค่าพวกนั้นอยู่ ทำให้ `/status` ยังคง
แสดงบรรทัดแคชต่อไปได้หลังเกิดการสูญหายบางส่วนของ metadata ใน session ค่าแคชสดที่ไม่เป็นศูนย์ซึ่งมีอยู่แล้วจะยังมีลำดับความสำคัญเหนือค่าที่ fallback มาจาก transcript

เหตุผลที่สิ่งนี้สำคัญ: ลดต้นทุนโทเค็น ตอบกลับได้เร็วขึ้น และให้ประสิทธิภาพที่คาดเดาได้มากขึ้นสำหรับเซสชันที่ทำงานยาวนาน หากไม่มี caching prompts ที่ซ้ำกันจะต้องจ่ายต้นทุน prompt เต็มจำนวนในทุกเทิร์น แม้ว่าส่วนใหญ่ของอินพุตจะไม่เปลี่ยนก็ตาม

หน้านี้ครอบคลุมตัวเลือกที่เกี่ยวข้องกับแคชทั้งหมดที่มีผลต่อการใช้ prompt ซ้ำและต้นทุนโทเค็น

เอกสารอ้างอิงของผู้ให้บริการ:

- Anthropic prompt caching: [https://platform.claude.com/docs/en/build-with-claude/prompt-caching](https://platform.claude.com/docs/en/build-with-claude/prompt-caching)
- OpenAI prompt caching: [https://developers.openai.com/api/docs/guides/prompt-caching](https://developers.openai.com/api/docs/guides/prompt-caching)
- OpenAI API headers และ request IDs: [https://developers.openai.com/api/reference/overview](https://developers.openai.com/api/reference/overview)
- Anthropic request IDs และ errors: [https://platform.claude.com/docs/en/api/errors](https://platform.claude.com/docs/en/api/errors)

## ตัวเลือกหลัก

### `cacheRetention` (ค่าเริ่มต้นแบบ global, model และรายเอเจนต์)

ตั้งค่า cache retention เป็นค่าเริ่มต้นแบบ global สำหรับทุกโมเดล:

```yaml
agents:
  defaults:
    params:
      cacheRetention: "long" # none | short | long
```

แทนที่เป็นรายโมเดล:

```yaml
agents:
  defaults:
    models:
      "anthropic/claude-opus-4-6":
        params:
          cacheRetention: "short" # none | short | long
```

แทนที่เป็นรายเอเจนต์:

```yaml
agents:
  list:
    - id: "alerts"
      params:
        cacheRetention: "none"
```

ลำดับการ merge ของคอนฟิก:

1. `agents.defaults.params` (ค่าเริ่มต้นแบบ global — ใช้กับทุกโมเดล)
2. `agents.defaults.models["provider/model"].params` (การแทนที่แบบรายโมเดล)
3. `agents.list[].params` (agent id ที่ตรงกัน; แทนที่เป็นรายคีย์)

### `contextPruning.mode: "cache-ttl"`

ตัดทอนบริบทของผลลัพธ์จากเครื่องมือเก่า หลังหมดช่วง TTL ของแคช เพื่อให้คำขอหลัง idle ไม่ต้อง re-cache ประวัติที่มีขนาดใหญ่เกินไป

```yaml
agents:
  defaults:
    contextPruning:
      mode: "cache-ttl"
      ttl: "1h"
```

ดู [Session Pruning](/th/concepts/session-pruning) สำหรับพฤติกรรมแบบเต็ม

### Heartbeat keep-warm

Heartbeat สามารถช่วยรักษาหน้าต่างแคชให้อุ่นอยู่ และลดการเขียนแคชซ้ำหลังจากมีช่วง idle

```yaml
agents:
  defaults:
    heartbeat:
      every: "55m"
```

รองรับ heartbeat แบบรายเอเจนต์ที่ `agents.list[].heartbeat`

## พฤติกรรมของผู้ให้บริการ

### Anthropic (direct API)

- รองรับ `cacheRetention`
- เมื่อใช้ auth profiles แบบ Anthropic API-key OpenClaw จะ seed `cacheRetention: "short"` ให้กับ Anthropic model refs เมื่อยังไม่ได้ตั้งค่า
- การตอบกลับแบบ Anthropic Messages native เปิดเผยทั้ง `cache_read_input_tokens` และ `cache_creation_input_tokens` ดังนั้น OpenClaw จึงแสดงทั้ง `cacheRead` และ `cacheWrite` ได้
- สำหรับคำขอแบบ Anthropic native, `cacheRetention: "short"` จะถูกแมปไปยัง ephemeral cache 5 นาทีตามค่าเริ่มต้น และ `cacheRetention: "long"` จะอัปเกรดไปยัง TTL 1 ชั่วโมงเฉพาะบนโฮสต์ direct `api.anthropic.com`

### OpenAI (direct API)

- Prompt caching เป็นอัตโนมัติบนโมเดลใหม่ที่รองรับ OpenClaw ไม่จำเป็นต้อง inject block-level cache markers
- OpenClaw ใช้ `prompt_cache_key` เพื่อให้ cache routing คงที่ข้ามหลายเทิร์น และใช้ `prompt_cache_retention: "24h"` เฉพาะเมื่อเลือก `cacheRetention: "long"` บน direct OpenAI hosts
- การตอบกลับของ OpenAI เปิดเผย cached prompt tokens ผ่าน `usage.prompt_tokens_details.cached_tokens` (หรือ `input_tokens_details.cached_tokens` บน Responses API events) OpenClaw จะแมปสิ่งนั้นไปที่ `cacheRead`
- OpenAI ไม่เปิดเผยตัวนับ token สำหรับ cache-write แยกต่างหาก ดังนั้น `cacheWrite` จะคงเป็น `0` บนเส้นทาง OpenAI แม้ผู้ให้บริการกำลัง warm cache อยู่
- OpenAI คืน tracing และ rate-limit headers ที่มีประโยชน์ เช่น `x-request-id`, `openai-processing-ms` และ `x-ratelimit-*` แต่การนับ cache-hit ควรมาจาก usage payload ไม่ใช่จาก headers
- ในทางปฏิบัติ OpenAI มักมีพฤติกรรมคล้าย initial-prefix cache มากกว่าการใช้ full-history ซ้ำแบบ moving window ของ Anthropic เทิร์นข้อความที่มี long-prefix คงที่สามารถไปหยุดใกล้ระดับ `4864` cached tokens ใน live probes ปัจจุบัน ขณะที่ transcript ที่มีเครื่องมือหนักหรือแบบ MCP มักไปหยุดใกล้ `4608` cached tokens แม้จะทำซ้ำแบบตรงตัว

### Anthropic Vertex

- โมเดล Anthropic บน Vertex AI (`anthropic-vertex/*`) รองรับ `cacheRetention` แบบเดียวกับ Anthropic โดยตรง
- `cacheRetention: "long"` จะถูกแมปไปยัง prompt-cache TTL จริง 1 ชั่วโมงบน Vertex AI endpoints
- ค่าเริ่มต้นของ cache retention สำหรับ `anthropic-vertex` ตรงกับค่าเริ่มต้นของ Anthropic โดยตรง
- คำขอของ Vertex ถูก route ผ่าน cache shaping ที่รับรู้ขอบเขต เพื่อให้การใช้แคชซ้ำสอดคล้องกับสิ่งที่ผู้ให้บริการได้รับจริง

### Amazon Bedrock

- Anthropic Claude model refs (`amazon-bedrock/*anthropic.claude*`) รองรับ explicit `cacheRetention` pass-through
- โมเดล Bedrock ที่ไม่ใช่ Anthropic จะถูกบังคับเป็น `cacheRetention: "none"` ระหว่าง runtime

### โมเดล Anthropic บน OpenRouter

สำหรับ model refs แบบ `openrouter/anthropic/*`, OpenClaw จะ inject
Anthropic `cache_control` ลงใน system/developer prompt blocks เพื่อเพิ่มการใช้ prompt-cache ซ้ำ
เฉพาะเมื่อคำขอยังคงชี้ไปยัง verified OpenRouter route
(`openrouter` บน endpoint ค่าเริ่มต้นของมัน หรือ provider/base URL ใดก็ตามที่ resolve
ไปยัง `openrouter.ai`)

หากคุณเปลี่ยนปลายทางของโมเดลไปยัง proxy URL แบบ OpenAI-compatible อื่นโดยพลการ OpenClaw
จะหยุด inject OpenRouter-specific Anthropic cache markers เหล่านั้น

### ผู้ให้บริการอื่น

หากผู้ให้บริการไม่รองรับโหมดแคชนี้ `cacheRetention` จะไม่มีผล

### Google Gemini direct API

- Direct Gemini transport (`api: "google-generative-ai"`) รายงาน cache hits
  ผ่าน `cachedContentTokenCount` ของ upstream; OpenClaw จะแมปสิ่งนั้นไปที่ `cacheRead`
- เมื่อมีการตั้ง `cacheRetention` บน direct Gemini model, OpenClaw จะสร้าง ใช้ซ้ำ และรีเฟรช
  resources แบบ `cachedContents` โดยอัตโนมัติสำหรับ system prompts
  ในการรัน Google AI Studio นั่นหมายความว่าคุณไม่จำเป็นต้องสร้าง
  cached-content handle ล่วงหน้าอีกต่อไป
- คุณยังสามารถส่ง Gemini cached-content handle ที่มีอยู่แล้วผ่าน
  `params.cachedContent` (หรือ `params.cached_content` แบบเดิม) บน
  โมเดลที่กำหนดค่าไว้
- สิ่งนี้แยกจาก prompt-prefix caching ของ Anthropic/OpenAI สำหรับ Gemini,
  OpenClaw จะจัดการ resource `cachedContents` แบบ native ของผู้ให้บริการ แทน
  การ inject cache markers ลงในคำขอ

### Gemini CLI JSON usage

- เอาต์พุต JSON ของ Gemini CLI สามารถแสดง cache hits ผ่าน `stats.cached` ได้เช่นกัน;
  OpenClaw จะแมปสิ่งนั้นไปที่ `cacheRead`
- หาก CLI ละค่า `stats.input` โดยตรงไว้ OpenClaw จะ derive input tokens
  จาก `stats.input_tokens - stats.cached`
- นี่เป็นเพียงการ normalize usage เท่านั้น ไม่ได้หมายความว่า OpenClaw กำลังสร้าง
  prompt-cache markers แบบ Anthropic/OpenAI สำหรับ Gemini CLI

## ขอบเขตแคชของ system prompt

OpenClaw แบ่ง system prompt ออกเป็น **stable prefix** และ **volatile
suffix** โดยคั่นด้วย cache-prefix boundary ภายใน เนื้อหาที่อยู่เหนือ
boundary (คำจำกัดความของเครื่องมือ metadata ของ Skills ไฟล์ใน workspace และบริบท
แบบคงที่อื่นๆ) จะถูกจัดลำดับให้คงไบต์เดิมข้ามหลายเทิร์น
เนื้อหาที่อยู่ใต้ boundary (เช่น `HEARTBEAT.md`, timestamps ของ runtime และ
metadata แบบต่อเทิร์นอื่นๆ) สามารถเปลี่ยนแปลงได้โดยไม่ทำให้ cached
prefix ใช้งานไม่ได้

ตัวเลือกการออกแบบที่สำคัญ:

- ไฟล์ project-context ที่คงที่ใน workspace จะถูกจัดลำดับให้อยู่ก่อน `HEARTBEAT.md` เพื่อให้
  การเปลี่ยนแปลงของ heartbeat ไม่ทำลาย stable prefix
- boundary นี้ถูกใช้กับการจัดรูป cache ของ transport แบบ Anthropic-family, OpenAI-family, Google และ
  CLI ดังนั้นผู้ให้บริการที่รองรับทั้งหมดจึงได้ประโยชน์จากเสถียรภาพของ prefix แบบเดียวกัน
- คำขอของ Codex Responses และ Anthropic Vertex ถูก route ผ่าน
  cache shaping ที่รับรู้ขอบเขต เพื่อให้การใช้แคชซ้ำสอดคล้องกับสิ่งที่ผู้ให้บริการได้รับจริง
- ลายนิ้วมือของ system prompt ถูก normalize (whitespace, line endings,
  hook-added context, ลำดับของ runtime capability) เพื่อให้ prompts ที่ไม่เปลี่ยนแปลงในเชิงความหมายสามารถใช้ KV/cache ร่วมกันข้ามหลายเทิร์นได้

หากคุณเห็น `cacheWrite` พุ่งขึ้นอย่างไม่คาดคิดหลังจากเปลี่ยนคอนฟิกหรือ workspace ให้ตรวจสอบว่าการเปลี่ยนแปลงนั้นอยู่เหนือหรือต่ำกว่า cache boundary การย้าย
เนื้อหาที่เปลี่ยนแปลงบ่อยไปไว้ใต้ boundary (หรือทำให้มันคงที่ขึ้น) มักช่วยแก้ปัญหาได้

## ตัวป้องกันเสถียรภาพของแคชใน OpenClaw

OpenClaw ยังทำให้รูปทรง payload ที่ไวต่อแคชหลายแบบมีความกำหนดแน่นอนก่อน
คำขอจะไปถึงผู้ให้บริการ:

- แค็ตตาล็อก MCP tool แบบบันเดิลจะถูกเรียงแบบกำหนดแน่นอนก่อนการลงทะเบียนเครื่องมือ
  ดังนั้นการเปลี่ยนลำดับ `listTools()` จะไม่ทำให้บล็อก tools เปลี่ยนและไม่ทำให้ prompt-cache prefixes ใช้งานไม่ได้
- sessions แบบเดิมที่มี persisted image blocks จะคง **3 เทิร์นที่เสร็จสมบูรณ์ล่าสุด**
  ไว้เหมือนเดิม; image blocks ที่เก่ากว่าและถูกประมวลผลแล้วอาจถูก
  แทนที่ด้วย marker เพื่อไม่ให้การติดตามผลที่มีภาพจำนวนมากต้องส่ง payload เก่าขนาดใหญ่ซ้ำไปมา

## รูปแบบการปรับแต่ง

### ทราฟฟิกแบบผสม (ค่าเริ่มต้นที่แนะนำ)

คง baseline ระยะยาวไว้บนเอเจนต์หลักของคุณ และปิด caching บนเอเจนต์แจ้งเตือนที่เป็น bursty:

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

### baseline แบบเน้นต้นทุน

- ตั้ง baseline เป็น `cacheRetention: "short"`
- เปิด `contextPruning.mode: "cache-ttl"`
- ใช้ heartbeat ต่ำกว่า TTL เฉพาะเอเจนต์ที่ได้ประโยชน์จากแคชที่อุ่นอยู่

## การวินิจฉัยแคช

OpenClaw เปิดให้ใช้การวินิจฉัยแบบ cache-trace โดยเฉพาะสำหรับการรัน embedded agent

สำหรับการวินิจฉัยปกติที่ผู้ใช้มองเห็นได้ `/status` และสรุป usage อื่นๆ สามารถใช้
latest transcript usage entry เป็นแหล่ง fallback สำหรับ `cacheRead` /
`cacheWrite` เมื่อ live session entry ไม่มีตัวนับเหล่านั้น

## การทดสอบ regression แบบสด

OpenClaw มี combined live cache regression gate หนึ่งชุด สำหรับ repeated prefixes, tool turns, image turns, transcripts แบบ MCP-style และ Anthropic no-cache control

- `src/agents/live-cache-regression.live.test.ts`
- `src/agents/live-cache-regression-baseline.ts`

รัน live gate แบบแคบด้วย:

```sh
OPENCLAW_LIVE_TEST=1 OPENCLAW_LIVE_CACHE_TEST=1 pnpm test:live:cache
```

ไฟล์ baseline จะเก็บตัวเลข live ล่าสุดที่สังเกตได้ พร้อม regression floors แบบเฉพาะผู้ให้บริการที่การทดสอบใช้
ตัว runner ยังใช้ session IDs และ prompt namespaces แบบใหม่ต่อการรัน เพื่อไม่ให้สถานะแคชจากก่อนหน้าเข้ามาปนกับ regression sample ปัจจุบัน

การทดสอบเหล่านี้ตั้งใจไม่ใช้เกณฑ์ความสำเร็จแบบเดียวกันทุกผู้ให้บริการ

### ความคาดหวังแบบ live ของ Anthropic

- คาดว่าจะมี warmup writes แบบ explicit ผ่าน `cacheWrite`
- คาดว่าจะมีการใช้ประวัติแทบทั้งหมดซ้ำในเทิร์นที่ทำซ้ำ เพราะ Anthropic cache control จะเลื่อน cache breakpoint ไปตามบทสนทนา
- assertions แบบ live ปัจจุบันยังใช้เกณฑ์ hit-rate สูงสำหรับเส้นทางแบบ stable, tool และ image

### ความคาดหวังแบบ live ของ OpenAI

- คาดหวังเฉพาะ `cacheRead` ส่วน `cacheWrite` ยังคงเป็น `0`
- มองการใช้แคชซ้ำในเทิร์นที่ทำซ้ำเป็น plateau แบบเฉพาะผู้ให้บริการ ไม่ใช่การใช้ full-history แบบ moving window ของ Anthropic
- assertions แบบ live ปัจจุบันใช้การตรวจสอบขั้นต่ำแบบ conservative ที่ได้จากพฤติกรรมสดที่สังเกตได้บน `gpt-5.4-mini`:
  - stable prefix: `cacheRead >= 4608`, hit rate `>= 0.90`
  - tool transcript: `cacheRead >= 4096`, hit rate `>= 0.85`
  - image transcript: `cacheRead >= 3840`, hit rate `>= 0.82`
  - transcript แบบ MCP-style: `cacheRead >= 4096`, hit rate `>= 0.85`

การตรวจสอบ combined live แบบใหม่เมื่อวันที่ 2026-04-04 ไปสิ้นสุดที่:

- stable prefix: `cacheRead=4864`, hit rate `0.966`
- tool transcript: `cacheRead=4608`, hit rate `0.896`
- image transcript: `cacheRead=4864`, hit rate `0.954`
- transcript แบบ MCP-style: `cacheRead=4608`, hit rate `0.891`

wall-clock time แบบ local ล่าสุดสำหรับ combined gate อยู่ที่ประมาณ `88s`

เหตุผลที่ assertions แตกต่างกัน:

- Anthropic เปิดเผย cache breakpoints แบบ explicit และการใช้ประวัติการสนทนาแบบเคลื่อนที่ซ้ำ
- OpenAI prompt caching ยังคงไวต่อ exact-prefix แต่ reusable prefix ที่ใช้ได้จริงใน live Responses traffic อาจไปหยุดก่อนถึง prompt เต็ม
- ด้วยเหตุนี้ การเปรียบเทียบ Anthropic และ OpenAI ด้วย percentage threshold ข้ามผู้ให้บริการเพียงค่าเดียวจึงก่อให้เกิด false regressions

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

### Env toggles (สำหรับการดีบักแบบครั้งคราว)

- `OPENCLAW_CACHE_TRACE=1` เปิดใช้ cache tracing
- `OPENCLAW_CACHE_TRACE_FILE=/path/to/cache-trace.jsonl` แทนที่พาธเอาต์พุต
- `OPENCLAW_CACHE_TRACE_MESSAGES=0|1` สลับการจับ payload ของข้อความแบบเต็ม
- `OPENCLAW_CACHE_TRACE_PROMPT=0|1` สลับการจับข้อความของ prompt
- `OPENCLAW_CACHE_TRACE_SYSTEM=0|1` สลับการจับ system prompt

### สิ่งที่ควรตรวจสอบ

- cache trace events อยู่ในรูปแบบ JSONL และมี staged snapshots เช่น `session:loaded`, `prompt:before`, `stream:context` และ `session:after`
- ผลกระทบของ cache token ต่อเทิร์นสามารถมองเห็นได้ผ่านพื้นผิว usage ปกติผ่าน `cacheRead` และ `cacheWrite` (เช่น `/usage full` และ session usage summaries)
- สำหรับ Anthropic ให้คาดหวังทั้ง `cacheRead` และ `cacheWrite` เมื่อ caching ทำงานอยู่
- สำหรับ OpenAI ให้คาดหวัง `cacheRead` เมื่อเกิด cache hits และ `cacheWrite` จะยังคงเป็น `0`; OpenAI ไม่เผยแพร่ฟิลด์ cache-write token แยกต่างหาก
- หากคุณต้องการ request tracing ให้บันทึก request IDs และ rate-limit headers แยกจาก cache metrics เอาต์พุต cache-trace ปัจจุบันของ OpenClaw เน้นที่รูปทรง prompt/session และ normalized token usage มากกว่า raw provider response headers

## การแก้ไขปัญหาแบบรวดเร็ว

- `cacheWrite` สูงในแทบทุกเทิร์น: ตรวจสอบอินพุตของ system prompt ที่เปลี่ยนแปลงบ่อย และตรวจสอบว่า model/provider รองรับการตั้งค่าแคชของคุณ
- `cacheWrite` สูงบน Anthropic: มักหมายความว่า cache breakpoint ไปตกอยู่บนเนื้อหาที่เปลี่ยนทุกคำขอ
- `cacheRead` ต่ำบน OpenAI: ตรวจสอบว่า stable prefix อยู่ด้านหน้า repeated prefix มีอย่างน้อย 1024 tokens และมีการใช้ `prompt_cache_key` เดียวกันซ้ำสำหรับเทิร์นที่ควรใช้แคชร่วมกัน
- `cacheRetention` ไม่มีผล: ยืนยันว่า model key ตรงกับ `agents.defaults.models["provider/model"]`
- คำขอ Bedrock Nova/Mistral ที่มีการตั้งค่าแคช: เป็นไปตามคาดว่าจะถูกบังคับเป็น `none` ระหว่าง runtime

เอกสารที่เกี่ยวข้อง:

- [Anthropic](/th/providers/anthropic)
- [การใช้โทเค็นและต้นทุน](/th/reference/token-use)
- [Session Pruning](/th/concepts/session-pruning)
- [เอกสารอ้างอิงการกำหนดค่า Gateway](/th/gateway/configuration-reference)
