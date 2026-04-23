---
read_when:
    - การรันหรือแก้ไขการทดสอบ to=final
summary: วิธีรันการทดสอบในเครื่อง (Vitest) และเมื่อใดควรใช้โหมด force/coverage
title: การทดสอบ
x-i18n:
    generated_at: "2026-04-23T05:56:29Z"
    model: gpt-5.4
    provider: openai
    source_hash: ed665840ef2c7728da8ec923eb3ea2878d9b20a841cb2fe4116a7f6334567b8e
    source_path: reference/test.md
    workflow: 15
---

# การทดสอบ

- ชุดเครื่องมือการทดสอบแบบเต็ม (suites, live, Docker): [Testing](/th/help/testing)

- `pnpm test:force`: ฆ่าโปรเซส gateway ที่ค้างอยู่ซึ่งยึดพอร์ต control เริ่มต้นไว้ จากนั้นรันชุด Vitest ทั้งหมดด้วยพอร์ต gateway แบบแยก เพื่อไม่ให้การทดสอบฝั่ง server ชนกับ instance ที่กำลังรันอยู่ ใช้สิ่งนี้เมื่อการรัน gateway ครั้งก่อนทิ้งพอร์ต 18789 ไว้ในสถานะถูกใช้งาน
- `pnpm test:coverage`: รัน unit suite พร้อม V8 coverage (ผ่าน `vitest.unit.config.ts`) นี่คือ coverage gate ของ unit ที่อิงกับไฟล์ที่ถูกโหลด ไม่ใช่ coverage ของทุกไฟล์ทั้ง repo threshold คือ 70% สำหรับ lines/functions/statements และ 55% สำหรับ branches เพราะ `coverage.all` เป็น false gate นี้จึงวัดไฟล์ที่ถูกโหลดโดย unit coverage suite แทนที่จะถือว่าไฟล์ source ทุกตัวใน split-lane ไม่ถูกครอบคลุม
- `pnpm test:coverage:changed`: รัน unit coverage เฉพาะไฟล์ที่เปลี่ยนจาก `origin/main`
- `pnpm test:changed`: ขยายพาธ git ที่เปลี่ยนเป็น Vitest lane แบบมีขอบเขต เมื่อ diff แตะเฉพาะไฟล์ source/test ที่กำหนดเส้นทางได้ การเปลี่ยน config/setup จะยัง fallback ไปยัง native root projects run เพื่อให้การแก้ wiring รันซ้ำในวงกว้างเมื่อจำเป็น
- `pnpm changed:lanes`: แสดง architectural lane ที่ถูกกระตุ้นโดย diff เทียบกับ `origin/main`
- `pnpm check:changed`: รัน changed gate แบบอัจฉริยะสำหรับ diff เทียบกับ `origin/main` มันจะรันงาน core พร้อม lane ทดสอบของ core, งาน extension พร้อม lane ทดสอบของ extension, งานที่เป็นเฉพาะการทดสอบพร้อมเฉพาะ test typecheck/tests, ขยายการเปลี่ยน Plugin SDK หรือ plugin-contract สาธารณะไปยังการตรวจสอบ extension และคงการชนเวอร์ชันแบบ metadata-only ของ release ไว้บน targeted version/config/root-dependency checks
- `pnpm test`: กำหนดเส้นทางเป้าหมายไฟล์/ไดเรกทอรีแบบ explicit ผ่าน Vitest lane ที่มีขอบเขต การรันที่ไม่ระบุเป้าหมายจะใช้ fixed shard groups และขยายไปยัง leaf config สำหรับการรันขนานในเครื่อง กลุ่ม extension จะขยายไปยัง per-extension shard config เสมอ แทนที่จะใช้ root-project process ขนาดใหญ่ตัวเดียว
- การรันแบบเต็มและ extension shard จะอัปเดตข้อมูลเวลาท้องถิ่นใน `.artifacts/vitest-shard-timings.json`; การรันครั้งต่อ ๆ ไปจะใช้เวลาเหล่านั้นเพื่อถ่วง shard ที่ช้าและเร็วให้สมดุล ตั้ง `OPENCLAW_TEST_PROJECTS_TIMINGS=0` เพื่อไม่ใช้ timing artifact ในเครื่อง
- ไฟล์ทดสอบบางชุดของ `plugin-sdk` และ `commands` ตอนนี้ถูกกำหนดเส้นทางผ่าน light lane โดยเฉพาะที่คงไว้เพียง `test/setup.ts` ทำให้เคสที่หนักด้านรันไทม์ยังอยู่ใน lane เดิมของมัน
- ไฟล์ source helper บางชุดของ `plugin-sdk` และ `commands` ยังแมป `pnpm test:changed` ไปยัง sibling test แบบ explicit ใน light lane เหล่านั้นด้วย ดังนั้นการแก้ helper เล็ก ๆ จะไม่ทำให้ต้องรัน suite หนักที่รองรับด้วยรันไทม์ซ้ำ
- `auto-reply` ตอนนี้ยังถูกแยกเป็น config เฉพาะสามตัว (`core`, `top-level`, `reply`) เพื่อไม่ให้ reply harness ครอบงำการทดสอบสถานะ/token/helper แบบ top-level ที่เบากว่า
- Base Vitest config ตอนนี้ใช้ค่าเริ่มต้น `pool: "threads"` และ `isolate: false` พร้อมเปิด shared non-isolated runner ทั่วทั้ง config ของ repo
- `pnpm test:channels` รัน `vitest.channels.config.ts`
- `pnpm test:extensions` และ `pnpm test extensions` รัน shard ของ extension/plugin ทั้งหมด heavy channel extension และ OpenAI จะรันเป็น shard เฉพาะ ส่วนกลุ่ม extension อื่นยังคงถูกรวมเป็น batch ใช้ `pnpm test extensions/<id>` สำหรับ lane ของ bundled plugin ตัวเดียว
- `pnpm test:perf:imports`: เปิดการรายงาน import-duration + import-breakdown ของ Vitest ขณะยังใช้การกำหนดเส้นทางแบบ lane ที่มีขอบเขตสำหรับเป้าหมายไฟล์/ไดเรกทอรีแบบ explicit
- `pnpm test:perf:imports:changed`: profiling การ import แบบเดียวกัน แต่เฉพาะไฟล์ที่เปลี่ยนจาก `origin/main`
- `pnpm test:perf:changed:bench -- --ref <git-ref>` ทำ benchmark เส้นทาง changed-mode ที่ถูกกำหนดเส้นทาง เทียบกับ native root-project run สำหรับ committed git diff เดียวกัน
- `pnpm test:perf:changed:bench -- --worktree` ทำ benchmark ชุดการเปลี่ยนแปลงใน worktree ปัจจุบันโดยไม่ต้อง commit ก่อน
- `pnpm test:perf:profile:main`: เขียน CPU profile สำหรับเธรดหลักของ Vitest (`.artifacts/vitest-main-profile`)
- `pnpm test:perf:profile:runner`: เขียน CPU + heap profile สำหรับ unit runner (`.artifacts/vitest-runner-profile`)
- Gateway integration: เปิดใช้แบบ opt-in ผ่าน `OPENCLAW_TEST_INCLUDE_GATEWAY=1 pnpm test` หรือ `pnpm test:gateway`
- `pnpm test:e2e`: รัน gateway end-to-end smoke tests (multi-instance WS/HTTP/node pairing) ค่าเริ่มต้นคือ `threads` + `isolate: false` พร้อม worker แบบ adaptive ใน `vitest.e2e.config.ts`; ปรับได้ด้วย `OPENCLAW_E2E_WORKERS=<n>` และตั้ง `OPENCLAW_E2E_VERBOSE=1` เพื่อดูล็อกแบบ verbose
- `pnpm test:live`: รัน provider live tests (minimax/zai) ต้องมี API keys และ `LIVE=1` (หรือ `*_LIVE_TEST=1` เฉพาะ provider) เพื่อยกเลิกการ skip
- `pnpm test:docker:openwebui`: เริ่ม OpenClaw + Open WebUI แบบ Dockerized, ลงชื่อเข้าใช้ผ่าน Open WebUI, ตรวจสอบ `/api/models`, จากนั้นรันแชตจริงที่ถูก proxy ผ่าน `/api/chat/completions` ต้องใช้ live model key ที่ใช้งานได้ (เช่น OpenAI ใน `~/.profile`) ดึง Open WebUI image ภายนอก และไม่ได้คาดหวังว่าจะเสถียรแบบ CI เหมือน unit/e2e suite ปกติ
- `pnpm test:docker:mcp-channels`: เริ่ม Gateway container ที่ถูก seed แล้ว และ client container ตัวที่สองที่สตาร์ต `openclaw mcp serve` จากนั้นตรวจสอบ routed conversation discovery, การอ่าน transcript, attachment metadata, พฤติกรรมของ live event queue, outbound send routing และการแจ้งเตือน channel + permission แบบ Claude ผ่าน stdio bridge จริง การตรวจสอบการแจ้งเตือนของ Claude จะอ่าน raw stdio MCP frame โดยตรง เพื่อให้ smoke สะท้อนสิ่งที่ bridge ปล่อยออกมาจริง

## PR gate ในเครื่อง

สำหรับการตรวจสอบ local PR gate ก่อน land ให้รัน:

- `pnpm check:changed`
- `pnpm check`
- `pnpm check:test-types`
- `pnpm build`
- `pnpm test`
- `pnpm check:docs`

หาก `pnpm test` มีอาการ flaky บนโฮสต์ที่มีโหลดสูง ให้รันซ้ำอีกหนึ่งครั้งก่อนจะถือว่าเป็น regression จากนั้นค่อยแยกด้วย `pnpm test <path/to/test>` สำหรับโฮสต์ที่หน่วยความจำจำกัด ให้ใช้:

- `OPENCLAW_VITEST_MAX_WORKERS=1 pnpm test`
- `OPENCLAW_VITEST_FS_MODULE_CACHE_PATH=/tmp/openclaw-vitest-cache pnpm test:changed`

## benchmark ความหน่วงของโมเดล (local keys)

สคริปต์: [`scripts/bench-model.ts`](https://github.com/openclaw/openclaw/blob/main/scripts/bench-model.ts)

การใช้งาน:

- `source ~/.profile && pnpm tsx scripts/bench-model.ts --runs 10`
- env แบบไม่บังคับ: `MINIMAX_API_KEY`, `MINIMAX_BASE_URL`, `MINIMAX_MODEL`, `ANTHROPIC_API_KEY`
- พรอมป์เริ่มต้น: “Reply with a single word: ok. No punctuation or extra text.”

การรันล่าสุด (2025-12-31, 20 runs):

- minimax median 1279ms (min 1114, max 2431)
- opus median 2454ms (min 1224, max 3170)

## benchmark การเริ่ม CLI

สคริปต์: [`scripts/bench-cli-startup.ts`](https://github.com/openclaw/openclaw/blob/main/scripts/bench-cli-startup.ts)

การใช้งาน:

- `pnpm test:startup:bench`
- `pnpm test:startup:bench:smoke`
- `pnpm test:startup:bench:save`
- `pnpm test:startup:bench:update`
- `pnpm test:startup:bench:check`
- `pnpm tsx scripts/bench-cli-startup.ts`
- `pnpm tsx scripts/bench-cli-startup.ts --runs 12`
- `pnpm tsx scripts/bench-cli-startup.ts --preset real`
- `pnpm tsx scripts/bench-cli-startup.ts --preset real --case status --case gatewayStatus --runs 3`
- `pnpm tsx scripts/bench-cli-startup.ts --entry openclaw.mjs --entry-secondary dist/entry.js --preset all`
- `pnpm tsx scripts/bench-cli-startup.ts --preset all --output .artifacts/cli-startup-bench-all.json`
- `pnpm tsx scripts/bench-cli-startup.ts --preset real --case gatewayStatusJson --output .artifacts/cli-startup-bench-smoke.json`
- `pnpm tsx scripts/bench-cli-startup.ts --preset real --cpu-prof-dir .artifacts/cli-cpu`
- `pnpm tsx scripts/bench-cli-startup.ts --json`

Preset:

- `startup`: `--version`, `--help`, `health`, `health --json`, `status --json`, `status`
- `real`: `health`, `status`, `status --json`, `sessions`, `sessions --json`, `agents list --json`, `gateway status`, `gateway status --json`, `gateway health --json`, `config get gateway.port`
- `all`: ทั้งสอง preset

เอาต์พุตประกอบด้วย `sampleCount`, avg, p50, p95, min/max, การกระจายของ exit-code/signal และสรุป max RSS สำหรับแต่ละคำสั่ง ตัวเลือก `--cpu-prof-dir` / `--heap-prof-dir` จะเขียน V8 profile ต่อการรัน ทำให้การจับเวลาและการเก็บ profile ใช้ harness เดียวกัน

ธรรมเนียมของเอาต์พุตที่บันทึกไว้:

- `pnpm test:startup:bench:smoke` จะเขียน smoke artifact แบบเจาะจงไว้ที่ `.artifacts/cli-startup-bench-smoke.json`
- `pnpm test:startup:bench:save` จะเขียน full-suite artifact ที่ `.artifacts/cli-startup-bench-all.json` โดยใช้ `runs=5` และ `warmup=1`
- `pnpm test:startup:bench:update` จะรีเฟรช baseline fixture ที่ถูกเก็บไว้ใน `test/fixtures/cli-startup-bench.json` โดยใช้ `runs=5` และ `warmup=1`

fixture ที่ถูกเก็บไว้:

- `test/fixtures/cli-startup-bench.json`
- รีเฟรชด้วย `pnpm test:startup:bench:update`
- เปรียบเทียบผลลัพธ์ปัจจุบันกับ fixture ด้วย `pnpm test:startup:bench:check`

## Onboarding E2E (Docker)

Docker เป็นตัวเลือกเสริม; จำเป็นเฉพาะสำหรับ onboarding smoke test แบบ containerized เท่านั้น

โฟลว์ full cold-start ใน Linux container ที่สะอาด:

```bash
scripts/e2e/onboard-docker.sh
```

สคริปต์นี้จะขับเคลื่อนวิซาร์ดแบบโต้ตอบผ่าน pseudo-tty, ตรวจสอบไฟล์ config/workspace/session แล้วเริ่ม gateway และรัน `openclaw health`

## QR import smoke (Docker)

ตรวจสอบว่า `qrcode-terminal` โหลดได้ภายใต้ Node runtime แบบ Docker ที่รองรับ (ค่าเริ่มต้น Node 24, รองรับ Node 22):

```bash
pnpm test:docker:qr
```
