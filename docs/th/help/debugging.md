---
read_when:
    - คุณต้องการตรวจสอบเอาต์พุตดิบของโมเดลเพื่อติดตามการรั่วไหลของ reasoning
    - คุณต้องการรัน Gateway ในโหมดเฝ้าดูระหว่างการวนรอบพัฒนา
    - คุณต้องการเวิร์กโฟลว์การดีบักที่ทำซ้ำได้
summary: 'เครื่องมือสำหรับดีบัก: โหมดเฝ้าดู, สตรีมโมเดลดิบ และการติดตามการรั่วไหลของ reasoning'
title: การดีบัก
x-i18n:
    generated_at: "2026-04-23T05:36:40Z"
    model: gpt-5.4
    provider: openai
    source_hash: 45f1c55268c02d2d52abf348760d1e00e7536788c3a9aa77854692c4d964fb6e
    source_path: help/debugging.md
    workflow: 15
---

# การดีบัก

หน้านี้ครอบคลุมตัวช่วยสำหรับการดีบักเอาต์พุตแบบสตรีม โดยเฉพาะเมื่อ
ผู้ให้บริการผสม reasoning เข้ามาในข้อความปกติ

## Runtime debug overrides

ใช้ `/debug` ในแชตเพื่อตั้งค่า overrides ของ config แบบ **เฉพาะรันไทม์** (อยู่ในหน่วยความจำ ไม่เขียนลงดิสก์)
`/debug` ถูกปิดไว้ตามค่าเริ่มต้น; เปิดใช้ด้วย `commands.debug: true`
วิธีนี้มีประโยชน์เมื่อคุณต้องการสลับการตั้งค่าที่ไม่ค่อยได้ใช้โดยไม่ต้องแก้ไข `openclaw.json`

ตัวอย่าง:

```
/debug show
/debug set messages.responsePrefix="[openclaw]"
/debug unset messages.responsePrefix
/debug reset
```

`/debug reset` จะล้าง overrides ทั้งหมดและกลับไปใช้ config บนดิสก์

## เอาต์พุต trace ของเซสชัน

ใช้ `/trace` เมื่อต้องการเห็นบรรทัด trace/debug ที่เป็นเจ้าของโดย Plugin ภายในเซสชันเดียว
โดยไม่ต้องเปิด verbose mode เต็มรูปแบบ

ตัวอย่าง:

```text
/trace
/trace on
/trace off
```

ใช้ `/trace` สำหรับการวินิจฉัยของ Plugin เช่นสรุปการดีบักของ Active Memory
ยังคงใช้ `/verbose` สำหรับสถานะ/เอาต์พุตเครื่องมือแบบ verbose ตามปกติ และใช้
`/debug` สำหรับ runtime-only config overrides

## ตัวช่วยจับเวลา debug ของ CLI แบบชั่วคราว

OpenClaw เก็บ `src/cli/debug-timing.ts` ไว้เป็นตัวช่วยขนาดเล็กสำหรับการตรวจสอบ
ในเครื่อง โดยตั้งใจไม่เชื่อมต่อเข้ากับการเริ่มต้นของ CLI, การจัดเส้นทางคำสั่ง
หรือคำสั่งใดๆ ตามค่าเริ่มต้น ใช้มันเฉพาะขณะดีบักคำสั่งที่ช้า แล้ว
ลบ import และ spans ออกก่อนนำการเปลี่ยนแปลงพฤติกรรมนั้นไปลงจริง

ใช้สิ่งนี้เมื่อคำสั่งทำงานช้าและคุณต้องการแยกดูแต่ละช่วงอย่างรวดเร็วก่อน
ตัดสินใจว่าจะใช้ CPU profiler หรือแก้ subsystem ใด subsystem หนึ่งโดยเฉพาะ

### เพิ่ม spans แบบชั่วคราว

เพิ่มตัวช่วยใกล้กับโค้ดที่คุณกำลังตรวจสอบ เช่น ขณะดีบัก
`openclaw models list` แพตช์ชั่วคราวใน
`src/commands/models/list.list-command.ts` อาจมีลักษณะดังนี้:

```ts
// Temporary debugging only. Remove before landing.
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

- เติมคำนำหน้า `debug:` ให้ชื่อ phase แบบชั่วคราว
- เพิ่ม spans เพียงไม่กี่จุดรอบส่วนที่สงสัยว่าช้า
- ควรใช้ phase แบบกว้าง เช่น `registry`, `auth_store` หรือ `rows` แทน
  ชื่อ helper
- ใช้ `time()` สำหรับงาน synchronous และ `timeAsync()` สำหรับ promises
- รักษา stdout ให้สะอาด ตัวช่วยนี้จะเขียนไปที่ stderr ดังนั้นเอาต์พุต JSON ของคำสั่งยังคง parse ได้
- ลบ imports และ spans แบบชั่วคราวออกก่อนเปิด PR สำหรับตัวแก้สุดท้าย
- ใส่เอาต์พุตการจับเวลาหรือสรุปสั้นๆ ใน issue หรือ PR ที่อธิบายการปรับปรุงประสิทธิภาพนั้น

### รันด้วยเอาต์พุตแบบอ่านง่าย

โหมดแบบอ่านง่ายเหมาะที่สุดสำหรับการดีบักแบบสด:

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

ข้อค้นพบจากเอาต์พุตนี้:

| Phase                                    |       เวลา | ความหมาย                                                                                           |
| ---------------------------------------- | ---------: | --------------------------------------------------------------------------------------------------- |
| `debug:models:list:auth_store`           |      20.3s | การโหลด auth-profile store เป็นต้นทุนที่มากที่สุดและควรตรวจสอบก่อน                                   |
| `debug:models:list:ensure_models_json`   |       5.0s | การซิงก์ `models.json` มีต้นทุนมากพอที่จะควรตรวจดูเรื่อง caching หรือเงื่อนไขการข้าม                 |
| `debug:models:list:load_model_registry`  |       5.9s | การสร้าง registry และงานตรวจ availability ของผู้ให้บริการก็มีต้นทุนที่สำคัญ                           |
| `debug:models:list:read_registry_models` |       2.4s | การอ่าน registry models ทั้งหมดไม่ฟรี และอาจมีผลกับ `--all`                                         |
| phases ของการ append rows                | 3.2s รวม   | การสร้างแถวที่แสดงเพียงห้าแถวก็ยังใช้เวลาหลายวินาที ดังนั้นเส้นทางการกรองควรได้รับการตรวจดูใกล้ชิดขึ้น |
| `debug:models:list:print_model_table`    |        0ms | การเรนเดอร์ไม่ใช่คอขวด                                                                              |

ข้อค้นพบเหล่านี้เพียงพอที่จะชี้ทางให้แพตช์ถัดไป โดยไม่ต้องเก็บโค้ดจับเวลาไว้ใน
production paths

### รันด้วยเอาต์พุต JSON

ใช้โหมด JSON เมื่อต้องการบันทึกหรือเปรียบเทียบข้อมูลการจับเวลา:

```bash
OPENCLAW_DEBUG_TIMING=json pnpm openclaw models list --all --provider moonshot \
  2> .artifacts/models-list-timing.jsonl
```

แต่ละบรรทัดใน stderr คือหนึ่ง JSON object:

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

### ทำความสะอาดก่อนนำลงจริง

ก่อนเปิด PR สุดท้าย:

```bash
rg 'createCliDebugTiming|debug:[a-z0-9_-]+:' src/commands src/cli \
  --glob '!src/cli/debug-timing.*' \
  --glob '!*.test.ts'
```

คำสั่งนี้ไม่ควรคืน call sites ของ instrumentation แบบชั่วคราวใดๆ เว้นแต่ PR
นั้นจะตั้งใจเพิ่มพื้นผิว diagnostics แบบถาวรอย่างชัดเจน สำหรับการแก้ประสิทธิภาพ
ตามปกติ ให้คงไว้เฉพาะการเปลี่ยนพฤติกรรม, tests และบันทึกสั้นๆ พร้อมหลักฐานการจับเวลา

สำหรับคอขวดด้าน CPU ที่ลึกกว่า ให้ใช้ Node profiling (`--cpu-prof`) หรือ
external profiler แทนการเพิ่ม timing wrappers เพิ่มเติม

## โหมด watch ของ Gateway

เพื่อการวนรอบพัฒนาที่รวดเร็ว ให้รัน gateway ภายใต้ file watcher:

```bash
pnpm gateway:watch
```

คำสั่งนี้แมปไปยัง:

```bash
node scripts/watch-node.mjs gateway --force
```

watcher จะรีสตาร์ตเมื่อไฟล์ที่เกี่ยวข้องกับการ build เปลี่ยนภายใต้ `src/`, ไฟล์ source ของ extension,
ไฟล์ `package.json` และข้อมูลเมตา `openclaw.plugin.json` ของ extension, `tsconfig.json`,
`package.json` และ `tsdown.config.ts` การเปลี่ยนแปลงข้อมูลเมตาของ extension จะรีสตาร์ต
gateway โดยไม่บังคับ `tsdown` rebuild; ส่วนการเปลี่ยน source และ config ยังจะ rebuild `dist` ก่อน

เพิ่มแฟล็ก Gateway CLI ใดๆ ต่อท้าย `gateway:watch` แล้วแฟล็กเหล่านั้นจะถูกส่งต่อทุกครั้ง
ที่รีสตาร์ต การรันคำสั่ง watch ชุดเดิมซ้ำสำหรับ repo/ชุดแฟล็กเดียวกัน ตอนนี้
จะแทนที่ watcher เก่าก่อนหน้า แทนที่จะปล่อยให้มี watcher parent ซ้ำกัน

## โปรไฟล์ dev + dev gateway (`--dev`)

ใช้โปรไฟล์ dev เพื่อแยกสถานะและสร้างสภาพแวดล้อมที่ปลอดภัยและทิ้งได้สำหรับ
การดีบัก มีแฟล็ก `--dev` อยู่ **สองตัว**:

- **Global `--dev` (โปรไฟล์):** แยกสถานะไว้ใต้ `~/.openclaw-dev` และ
  ใช้พอร์ต gateway เริ่มต้นเป็น `19001` (พอร์ตที่คำนวณต่อจะเลื่อนตาม)
- **`gateway --dev`: บอกให้ Gateway สร้าง config + workspace ค่าเริ่มต้นโดยอัตโนมัติ**
  เมื่อยังไม่มี (และข้าม `BOOTSTRAP.md`)

โฟลว์ที่แนะนำ (dev profile + dev bootstrap):

```bash
pnpm gateway:dev
OPENCLAW_PROFILE=dev openclaw tui
```

หากคุณยังไม่ได้ติดตั้งแบบ global ให้รัน CLI ผ่าน `pnpm openclaw ...`

สิ่งที่กระบวนการนี้ทำ:

1. **การแยกโปรไฟล์** (global `--dev`)
   - `OPENCLAW_PROFILE=dev`
   - `OPENCLAW_STATE_DIR=~/.openclaw-dev`
   - `OPENCLAW_CONFIG_PATH=~/.openclaw-dev/openclaw.json`
   - `OPENCLAW_GATEWAY_PORT=19001` (browser/canvas จะเลื่อนตาม)

2. **Dev bootstrap** (`gateway --dev`)
   - เขียน config ขั้นต่ำหากยังไม่มี (`gateway.mode=local`, bind loopback)
   - ตั้ง `agent.workspace` ไปยัง dev workspace
   - ตั้ง `agent.skipBootstrap=true` (ไม่มี `BOOTSTRAP.md`)
   - เติมไฟล์ใน workspace หากยังไม่มี:
     `AGENTS.md`, `SOUL.md`, `TOOLS.md`, `IDENTITY.md`, `USER.md`, `HEARTBEAT.md`
   - ตัวตนเริ่มต้น: **C3‑PO** (protocol droid)
   - ข้าม channel providers ในโหมด dev (`OPENCLAW_SKIP_CHANNELS=1`)

โฟลว์รีเซ็ต (เริ่มใหม่ทั้งหมด):

```bash
pnpm gateway:dev:reset
```

หมายเหตุ: `--dev` เป็นแฟล็กโปรไฟล์แบบ **global** และอาจถูกกินโดย runners บางตัว
หากคุณต้องการระบุให้ชัด ให้ใช้รูปแบบ env var:

```bash
OPENCLAW_PROFILE=dev openclaw gateway --dev --reset
```

`--reset` จะล้าง config, credentials, sessions และ dev workspace (ใช้
`trash` ไม่ใช่ `rm`) จากนั้นสร้างสภาพแวดล้อม dev เริ่มต้นใหม่

เคล็ดลับ: หากมี gateway ที่ไม่ใช่ dev กำลังรันอยู่แล้ว (launchd/systemd) ให้หยุดมันก่อน:

```bash
openclaw gateway stop
```

## การบันทึกสตรีมดิบ (OpenClaw)

OpenClaw สามารถบันทึก **assistant stream แบบดิบ** ก่อนมีการกรอง/จัดรูปแบบใดๆ
นี่คือวิธีที่ดีที่สุดในการดูว่า reasoning มากับข้อความ delta แบบธรรมดา
(หรือมาเป็น thinking blocks แยกต่างหาก)

เปิดใช้ผ่าน CLI:

```bash
pnpm gateway:watch --raw-stream
```

override พาธได้แบบเลือกได้:

```bash
pnpm gateway:watch --raw-stream --raw-stream-path ~/.openclaw/logs/raw-stream.jsonl
```

env vars ที่เทียบเท่ากัน:

```bash
OPENCLAW_RAW_STREAM=1
OPENCLAW_RAW_STREAM_PATH=~/.openclaw/logs/raw-stream.jsonl
```

ไฟล์เริ่มต้น:

`~/.openclaw/logs/raw-stream.jsonl`

## การบันทึกชังก์ดิบ (pi-mono)

เพื่อจับ **OpenAI-compat chunks แบบดิบ** ก่อนที่มันจะถูก parse เป็น blocks
pi-mono มี logger แยกต่างหาก:

```bash
PI_RAW_STREAM=1
```

พาธแบบเลือกได้:

```bash
PI_RAW_STREAM_PATH=~/.pi-mono/logs/raw-openai-completions.jsonl
```

ไฟล์เริ่มต้น:

`~/.pi-mono/logs/raw-openai-completions.jsonl`

> หมายเหตุ: ระบบจะส่งสิ่งนี้ออกมาเฉพาะจาก process ที่ใช้
> provider `openai-completions` ของ pi-mono

## หมายเหตุด้านความปลอดภัย

- raw stream logs อาจมีพรอมป์ต์เต็ม ผลลัพธ์ของเครื่องมือ และข้อมูลผู้ใช้
- เก็บ logs ไว้ภายในเครื่องและลบทิ้งหลังดีบักเสร็จ
- หากคุณแชร์ logs ให้ลบ secrets และ PII ออกก่อน
