---
read_when:
    - คุณต้องตรวจสอบเอาต์พุตดิบของโมเดลสำหรับการรั่วไหลของ reasoning
    - คุณต้องการรัน Gateway ในโหมดเฝ้าดูขณะทำงานวนซ้ำ
    - คุณต้องการเวิร์กโฟลว์การแก้ไขปัญหาที่ทำซ้ำได้ consistently
summary: 'การแก้ไขปัญหาเครื่องมือ: โหมดเฝ้าดู สตรีมโมเดลดิบ และการติดตาม reasoning ที่รั่วไหล'
title: การแก้ไขปัญหา
x-i18n:
    generated_at: "2026-04-24T09:13:49Z"
    model: gpt-5.4
    provider: openai
    source_hash: 8d52070204e21cd7e5bff565fadab96fdeee0ad906c4c8601572761a096d9025
    source_path: help/debugging.md
    workflow: 15
---

หน้านี้ครอบคลุมตัวช่วยสำหรับการแก้ไขปัญหาของเอาต์พุตแบบสตรีม โดยเฉพาะเมื่อ
ผู้ให้บริการผสม reasoning เข้ากับข้อความปกติ

## การ override สำหรับการแก้ไขปัญหาขณะรัน

ใช้ `/debug` ในแชตเพื่อตั้งค่า override ของ config แบบ **runtime-only** (อยู่ในหน่วยความจำ ไม่เขียนลงดิสก์)
`/debug` ถูกปิดใช้งานโดยค่าเริ่มต้น; เปิดได้ด้วย `commands.debug: true`
สิ่งนี้มีประโยชน์เมื่อคุณต้องการสลับการตั้งค่าที่ไม่ค่อยใช้โดยไม่ต้องแก้ไข `openclaw.json`

ตัวอย่าง:

```
/debug show
/debug set messages.responsePrefix="[openclaw]"
/debug unset messages.responsePrefix
/debug reset
```

`/debug reset` จะล้าง override ทั้งหมดและกลับไปใช้ config บนดิสก์

## เอาต์พุต trace ของเซสชัน

ใช้ `/trace` เมื่อคุณต้องการดูบรรทัด trace/debug ที่เป็นเจ้าของโดย Plugin ในเซสชันเดียว
โดยไม่ต้องเปิดโหมด verbose เต็มรูปแบบ

ตัวอย่าง:

```text
/trace
/trace on
/trace off
```

ใช้ `/trace` สำหรับการวินิจฉัยของ Plugin เช่นสรุปการแก้ไขปัญหาของ Active Memory
ยังคงใช้ `/verbose` สำหรับสถานะ/เอาต์พุตเครื่องมือตามปกติ และยังคงใช้
`/debug` สำหรับการ override config แบบ runtime-only

## การจับเวลา debug ชั่วคราวของ CLI

OpenClaw เก็บ `src/cli/debug-timing.ts` ไว้เป็นตัวช่วยขนาดเล็กสำหรับการตรวจสอบในเครื่อง
โดยตั้งใจจะไม่ต่อเข้ากับการเริ่มต้นของ CLI, การกำหนดเส้นทางคำสั่ง หรือคำสั่งใด ๆ โดยค่าเริ่มต้น ใช้มันเฉพาะระหว่างการแก้ไขปัญหาคำสั่งที่ช้า แล้วนำ import และ span ออกก่อนจะรวมการเปลี่ยนแปลงพฤติกรรมจริง

ใช้สิ่งนี้เมื่อคำสั่งทำงานช้าและคุณต้องการการแจกแจงตามช่วงอย่างรวดเร็วก่อน
ตัดสินใจว่าจะใช้ CPU profiler หรือแก้ไขซับซิสเต็มใดโดยเฉพาะ

### เพิ่ม span ชั่วคราว

เพิ่ม helper ใกล้กับโค้ดที่คุณกำลังตรวจสอบ ตัวอย่างเช่น ขณะกำลังแก้ไขปัญหา
`openclaw models list`, patch ชั่วคราวใน
`src/commands/models/list.list-command.ts` อาจมีลักษณะดังนี้:

```ts
// ใช้สำหรับการแก้ไขปัญหาชั่วคราวเท่านั้น เอาออกก่อนรวม
import { createCliDebugTiming } from "../../cli/debug-timing.js";

const timing = createCliDebugTiming({ command: "models list" });

const authStore = timing.time("debug:models:list:auth_store", () => ensureAuthProfileStore());

const loaded = await timing.timeAsync(
  "debug:models:list:registry",
  () => loadListModelRegistry(cfg, { sourceConfig }),
  (result) => ({
    models: result.models.length,
    discoveredKeys: result.discoveredKeys.size,
  }),
);
```

แนวทาง:

- เติมคำนำหน้า `debug:` ให้ชื่อ phase ชั่วคราว
- เพิ่มเพียงไม่กี่ span รอบส่วนที่สงสัยว่าช้า
- ให้ใช้ phase กว้าง ๆ เช่น `registry`, `auth_store` หรือ `rows` แทน
  ชื่อ helper
- ใช้ `time()` สำหรับงานแบบ synchronous และ `timeAsync()` สำหรับ promise
- รักษา stdout ให้สะอาด helper จะเขียนไปยัง stderr ดังนั้นเอาต์พุต JSON ของคำสั่งยัง parse ได้
- ลบ import และ span ชั่วคราวก่อนเปิด PR สำหรับการแก้ไขสุดท้าย
- ใส่เอาต์พุตการจับเวลาหรือสรุปสั้น ๆ ใน issue หรือ PR ที่อธิบายการเพิ่มประสิทธิภาพ

### รันด้วยเอาต์พุตแบบอ่านง่าย

โหมดแบบอ่านง่ายเหมาะที่สุดสำหรับการแก้ไขปัญหาแบบสด:

```bash
OPENCLAW_DEBUG_TIMING=1 pnpm openclaw models list --all --provider moonshot
```

ตัวอย่างเอาต์พุตจากการตรวจสอบ `models list` แบบชั่วคราว:

```text
OpenClaw CLI debug timing: models list
     0ms     +0ms start all=true json=false local=false plain=false provider="moonshot"
     2ms     +2ms debug:models:list:import_runtime duration=2ms
    17ms    +14ms debug:models:list:load_config duration=14ms sourceConfig=true
  20.3s  +20.3s debug:models:list:auth_store duration=20.3s
  20.3s     +0ms debug:models:list:resolve_agent_dir duration=0ms agentDir=true
  20.3s     +0ms debug:models:list:resolve_provider_filter duration=0ms
  25.3s   +5.0s debug:models:list:ensure_models_json duration=5.0s
  31.2s   +5.9s debug:models:list:load_model_registry duration=5.9s models=869 availableKeys=38 discoveredKeys=868 availabilityError=false
  31.2s     +0ms debug:models:list:resolve_configured_entries duration=0ms entries=1
  31.2s     +0ms debug:models:list:build_configured_lookup duration=0ms entries=1
  33.6s   +2.4s debug:models:list:read_registry_models duration=2.4s models=871
  35.2s   +1.5s debug:models:list:append_discovered_rows duration=1.5s seenKeys=0 rows=0
  36.9s   +1.7s debug:models:list:append_catalog_supplement_rows duration=1.7s seenKeys=5 rows=5

Model                                      Input       Ctx   Local Auth  Tags
moonshot/kimi-k2-thinking                  text        256k  no    no
moonshot/kimi-k2-thinking-turbo            text        256k  no    no
moonshot/kimi-k2-turbo                     text        250k  no    no
moonshot/kimi-k2.5                         text+image  256k  no    no
moonshot/kimi-k2.6                         text+image  256k  no    no

  36.9s     +0ms debug:models:list:print_model_table duration=0ms rows=5
  36.9s     +0ms complete rows=5
```

สิ่งที่พบจากเอาต์พุตนี้:

| Phase                                    |       Time | สิ่งที่หมายความว่า |
| ---------------------------------------- | ---------: | ------------------------------------------------------------------------------------------------------- |
| `debug:models:list:auth_store`           |      20.3s | การโหลด auth-profile store มีต้นทุนสูงที่สุดและควรถูกตรวจสอบก่อน |
| `debug:models:list:ensure_models_json`   |       5.0s | การซิงก์ `models.json` มีต้นทุนสูงพอที่จะตรวจสอบเรื่องการแคชหรือเงื่อนไขการข้าม |
| `debug:models:list:load_model_registry`  |       5.9s | การสร้าง registry และงาน availability ของผู้ให้บริการก็มีต้นทุนที่มีนัยสำคัญเช่นกัน |
| `debug:models:list:read_registry_models` |       2.4s | การอ่าน registry model ทั้งหมดไม่ฟรี และอาจสำคัญเมื่อใช้ `--all` |
| phase การ append row                     | 3.2s รวม | การสร้างแถวที่แสดงเพียงห้าแถวยังใช้เวลาหลายวินาที ดังนั้นเส้นทางการกรองควรได้รับการตรวจสอบใกล้ชิดขึ้น |
| `debug:models:list:print_model_table`    |        0ms | การเรนเดอร์ไม่ใช่คอขวด |

สิ่งที่พบเหล่านี้เพียงพอสำหรับชี้นำ patch ถัดไป โดยไม่ต้องเก็บโค้ดจับเวลาไว้ใน
production path

### รันด้วยเอาต์พุต JSON

ใช้โหมด JSON เมื่อคุณต้องการบันทึกหรือเปรียบเทียบข้อมูลการจับเวลา:

```bash
OPENCLAW_DEBUG_TIMING=json pnpm openclaw models list --all --provider moonshot \
  2> .artifacts/models-list-timing.jsonl
```

แต่ละบรรทัดของ stderr จะเป็นออบเจ็กต์ JSON หนึ่งรายการ:

```json
{
  "command": "models list",
  "phase": "debug:models:list:registry",
  "elapsedMs": 31200,
  "deltaMs": 5900,
  "durationMs": 5900,
  "models": 869,
  "discoveredKeys": 868
}
```

### ทำความสะอาดก่อนรวม

ก่อนเปิด PR ขั้นสุดท้าย:

```bash
rg 'createCliDebugTiming|debug:[a-z0-9_-]+:' src/commands src/cli \
  --glob '!src/cli/debug-timing.*' \
  --glob '!*.test.ts'
```

คำสั่งนี้ไม่ควรคืน site การเรียก instrumentation ชั่วคราวใด ๆ เว้นแต่ PR
นั้นกำลังเพิ่มพื้นผิว diagnostics แบบถาวรอย่างชัดเจน สำหรับการแก้ไขประสิทธิภาพตามปกติ
ให้เก็บไว้เฉพาะการเปลี่ยนแปลงพฤติกรรม, tests และโน้ตสั้น ๆ พร้อมหลักฐานการจับเวลา

สำหรับ hotspot ของ CPU ที่ลึกกว่า ให้ใช้ Node profiling (`--cpu-prof`) หรือ
profiler ภายนอกแทนการเพิ่ม timing wrapper เพิ่มเติม

## โหมดเฝ้าดูของ Gateway

สำหรับการทำงานวนซ้ำอย่างรวดเร็ว ให้รัน gateway ภายใต้ file watcher:

```bash
pnpm gateway:watch
```

สิ่งนี้แมปกับ:

```bash
node scripts/watch-node.mjs gateway --force
```

watcher จะรีสตาร์ตเมื่อมีไฟล์ที่เกี่ยวข้องกับ build ภายใต้ `src/`, ไฟล์ source ของ extension,
ไฟล์ `package.json` ของ extension และ metadata `openclaw.plugin.json`, `tsconfig.json`,
`package.json` และ `tsdown.config.ts` การเปลี่ยน metadata ของ extension จะรีสตาร์ต
gateway โดยไม่บังคับ `tsdown` rebuild; ส่วนการเปลี่ยน source และ config จะยัง rebuild
`dist` ก่อน

เพิ่มแฟล็ก CLI ของ gateway ต่อท้าย `gateway:watch` ได้ และแฟล็กเหล่านั้นจะถูกส่งผ่านในทุก
การรีสตาร์ต ตอนนี้การรันคำสั่ง watch เดิมซ้ำสำหรับ repo/ชุดแฟล็กเดียวกันจะ
แทนที่ watcher ตัวเก่า แทนที่จะปล่อย watcher parent ซ้ำค้างไว้

## โปรไฟล์ dev + dev gateway (`--dev`)

ใช้โปรไฟล์ dev เพื่อแยกสถานะและสร้างสภาพแวดล้อมที่ปลอดภัยและทิ้งได้สำหรับ
การแก้ไขปัญหา มีแฟล็ก `--dev` อยู่ **สองตัว**:

- **Global `--dev` (profile):** แยกสถานะไปไว้ใต้ `~/.openclaw-dev` และ
  ตั้งค่าเริ่มต้นพอร์ต gateway เป็น `19001` (พอร์ตที่ได้จากมันจะเลื่อนไปตามนั้น)
- **`gateway --dev`:** สั่งให้ Gateway สร้าง config + พื้นที่ทำงานค่าเริ่มต้นโดยอัตโนมัติ**
  เมื่อยังไม่มี (และข้าม `BOOTSTRAP.md`)

โฟลว์ที่แนะนำ (dev profile + dev bootstrap):

```bash
pnpm gateway:dev
OPENCLAW_PROFILE=dev openclaw tui
```

หากคุณยังไม่มีการติดตั้งแบบ global ให้รัน CLI ผ่าน `pnpm openclaw ...`

สิ่งที่ทำ:

1. **การแยกโปรไฟล์** (global `--dev`)
   - `OPENCLAW_PROFILE=dev`
   - `OPENCLAW_STATE_DIR=~/.openclaw-dev`
   - `OPENCLAW_CONFIG_PATH=~/.openclaw-dev/openclaw.json`
   - `OPENCLAW_GATEWAY_PORT=19001` (browser/canvas จะเลื่อนตาม)

2. **Dev bootstrap** (`gateway --dev`)
   - เขียน config ขั้นต่ำหากยังไม่มี (`gateway.mode=local`, bind loopback)
   - ตั้ง `agent.workspace` ให้เป็น dev workspace
   - ตั้ง `agent.skipBootstrap=true` (ไม่มี `BOOTSTRAP.md`)
   - วาง seed ให้ไฟล์พื้นที่ทำงานหากยังไม่มี:
     `AGENTS.md`, `SOUL.md`, `TOOLS.md`, `IDENTITY.md`, `USER.md`, `HEARTBEAT.md`
   - identity เริ่มต้น: **C3‑PO** (protocol droid)
   - ข้ามผู้ให้บริการช่องทางในโหมด dev (`OPENCLAW_SKIP_CHANNELS=1`)

โฟลว์รีเซ็ต (เริ่มใหม่ทั้งหมด):

```bash
pnpm gateway:dev:reset
```

หมายเหตุ: `--dev` เป็นแฟล็กของโปรไฟล์ **ระดับ global** และอาจถูกบาง runner กินไป
หากคุณต้องการระบุให้ชัด ให้ใช้รูปแบบ env var:

```bash
OPENCLAW_PROFILE=dev openclaw gateway --dev --reset
```

`--reset` จะล้าง config, ข้อมูลรับรอง, เซสชัน และพื้นที่ทำงาน dev (โดยใช้
`trash` ไม่ใช่ `rm`) จากนั้นจะสร้างการตั้งค่า dev เริ่มต้นขึ้นใหม่

เคล็ดลับ: หากมี gateway ที่ไม่ใช่ dev กำลังรันอยู่แล้ว (launchd/systemd) ให้หยุดมันก่อน:

```bash
openclaw gateway stop
```

## การบันทึก raw stream (OpenClaw)

OpenClaw สามารถบันทึก **assistant stream แบบดิบ** ก่อนผ่านการกรอง/จัดรูปแบบใด ๆ
นี่คือวิธีที่ดีที่สุดในการดูว่า reasoning กำลังมาถึงในรูปของ delta ข้อความล้วน
(หรือเป็นบล็อก thinking แยกต่างหาก)

เปิดใช้งานผ่าน CLI:

```bash
pnpm gateway:watch --raw-stream
```

override พาธแบบเลือกได้:

```bash
pnpm gateway:watch --raw-stream --raw-stream-path ~/.openclaw/logs/raw-stream.jsonl
```

env var ที่เทียบเท่ากัน:

```bash
OPENCLAW_RAW_STREAM=1
OPENCLAW_RAW_STREAM_PATH=~/.openclaw/logs/raw-stream.jsonl
```

ไฟล์เริ่มต้น:

`~/.openclaw/logs/raw-stream.jsonl`

## การบันทึก raw chunk (pi-mono)

เพื่อจับ **chunk แบบ OpenAI-compat ดิบ** ก่อนจะถูก parse เป็นบล็อก,
pi-mono เปิดเผย logger แยกต่างหาก:

```bash
PI_RAW_STREAM=1
```

พาธแบบเลือกได้:

```bash
PI_RAW_STREAM_PATH=~/.pi-mono/logs/raw-openai-completions.jsonl
```

ไฟล์เริ่มต้น:

`~/.pi-mono/logs/raw-openai-completions.jsonl`

> หมายเหตุ: สิ่งนี้จะถูกปล่อยออกมาเฉพาะโดยโปรเซสที่ใช้
> ผู้ให้บริการ `openai-completions` ของ pi-mono เท่านั้น

## หมายเหตุด้านความปลอดภัย

- บันทึก raw stream อาจมีพรอมป์ทั้งหมด, เอาต์พุตของเครื่องมือ และข้อมูลผู้ใช้
- เก็บบันทึกไว้ในเครื่องและลบทิ้งหลังแก้ไขปัญหาเสร็จ
- หากคุณต้องแชร์บันทึก ให้ลบความลับและ PII ก่อน

## ที่เกี่ยวข้อง

- [Troubleshooting](/th/help/troubleshooting)
- [FAQ](/th/help/faq)
