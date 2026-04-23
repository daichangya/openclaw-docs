---
read_when:
    - การรันหรือแก้ไขการทดสอบ
summary: วิธีรันการทดสอบในเครื่อง (vitest) และควรใช้โหมด force/coverage เมื่อใด
title: การทดสอบ
x-i18n:
    generated_at: "2026-04-23T13:58:16Z"
    model: gpt-5.4
    provider: openai
    source_hash: e0bcecb0868b3b68361e5ef78afc3170f2a481771bda8f7d54200b1d778d044a
    source_path: reference/test.md
    workflow: 15
---

# การทดสอบ

- ชุดเครื่องมือการทดสอบแบบครบชุด (suites, live, Docker): [การทดสอบ](/th/help/testing)

- `pnpm test:force`: ฆ่าโปรเซส gateway ที่ยังค้างอยู่และยึดพอร์ตควบคุมเริ่มต้น จากนั้นรันชุด Vitest ทั้งหมดด้วยพอร์ต gateway แบบแยก เพื่อไม่ให้การทดสอบเซิร์ฟเวอร์ชนกับอินสแตนซ์ที่กำลังรันอยู่ ใช้คำสั่งนี้เมื่อการรัน gateway ก่อนหน้าทิ้งให้พอร์ต 18789 ยังถูกใช้งานอยู่
- `pnpm test:coverage`: รันชุด unit พร้อม V8 coverage (ผ่าน `vitest.unit.config.ts`) นี่คือเกณฑ์ coverage ของ unit สำหรับไฟล์ที่ถูกโหลด ไม่ใช่ coverage ของทั้งรีโปทุกไฟล์ เกณฑ์คือ 70% สำหรับ lines/functions/statements และ 55% สำหรับ branches เนื่องจาก `coverage.all` เป็น false เกณฑ์นี้จึงวัดไฟล์ที่ถูกโหลดโดยชุด unit coverage แทนที่จะนับทุกไฟล์ซอร์สใน lane ที่ถูกแยกเป็น uncovered
- `pnpm test:coverage:changed`: รัน unit coverage เฉพาะไฟล์ที่เปลี่ยนไปจาก `origin/main`
- `pnpm test:changed`: ขยายพาธ git ที่เปลี่ยนไปเป็น lane ของ Vitest แบบกำหนดขอบเขต เมื่อ diff แตะเฉพาะไฟล์ซอร์ส/ทดสอบที่สามารถ route ได้ การเปลี่ยนแปลง config/setup จะยัง fallback ไปใช้การรัน root projects แบบปกติ เพื่อให้การแก้ wiring มีการรันซ้ำในขอบเขตกว้างเมื่อจำเป็น
- `pnpm changed:lanes`: แสดง lane ทางสถาปัตยกรรมที่ถูกทริกเกอร์โดย diff เทียบกับ `origin/main`
- `pnpm check:changed`: รัน smart changed gate สำหรับ diff เทียบกับ `origin/main` โดยจะรันงาน core พร้อม lane ทดสอบของ core, งาน extension พร้อม lane ทดสอบของ extension, งานที่เปลี่ยนเฉพาะการทดสอบพร้อม typecheck/tests ของการทดสอบเท่านั้น, ขยายการเปลี่ยนแปลงใน public Plugin SDK หรือ plugin-contract ไปยังการตรวจสอบ extension และคงการตรวจสอบแบบเจาะจงสำหรับ version/config/root-dependency checks เมื่อเป็น version bump ที่แตะเฉพาะ release metadata
- `pnpm test`: route เป้าหมายไฟล์/ไดเรกทอรีที่ระบุอย่างชัดเจนผ่าน lane ของ Vitest แบบกำหนดขอบเขต การรันที่ไม่ระบุเป้าหมายจะใช้กลุ่ม shard แบบคงที่และขยายไปยัง leaf configs เพื่อการรันแบบขนานในเครื่อง กลุ่ม extension จะขยายไปยัง per-extension shard configs เสมอ แทนที่จะเป็นโปรเซส root-project ขนาดใหญ่เพียงตัวเดียว
- การรันแบบเต็มและแบบ extension shard จะอัปเดตข้อมูล timing ในเครื่องที่ `.artifacts/vitest-shard-timings.json`; การรันครั้งถัดไปจะใช้ timing เหล่านี้เพื่อถ่วงดุล shard ที่ช้ากับเร็ว ตั้งค่า `OPENCLAW_TEST_PROJECTS_TIMINGS=0` เพื่อไม่ใช้ timing artifact ในเครื่อง
- ไฟล์ทดสอบ `plugin-sdk` และ `commands` บางรายการตอนนี้จะ route ผ่าน light lanes แบบเฉพาะที่คงไว้เพียง `test/setup.ts` โดยปล่อยเคสที่ใช้ runtime หนักให้อยู่ใน lane เดิม
- ไฟล์ซอร์ส helper บางรายการของ `plugin-sdk` และ `commands` ก็แมป `pnpm test:changed` ไปยังการทดสอบข้างเคียงแบบชัดเจนใน light lanes เช่นกัน เพื่อให้การแก้ helper ขนาดเล็กไม่ต้องรันชุดที่พึ่งพา runtime หนักซ้ำ
- ตอนนี้ `auto-reply` ถูกแยกเป็นสาม config เฉพาะ (`core`, `top-level`, `reply`) ด้วย เพื่อให้ reply harness ไม่กลายเป็นภาระหลักของการทดสอบ top-level status/token/helper ที่เบากว่า
- ตอนนี้ base Vitest config ใช้ค่าเริ่มต้นเป็น `pool: "threads"` และ `isolate: false` พร้อมเปิดใช้ shared non-isolated runner ทั่ว repo configs
- `pnpm test:channels` รัน `vitest.channels.config.ts`
- `pnpm test:extensions` และ `pnpm test extensions` รัน shard ของ extension/plugin ทั้งหมด extension ของ channel ที่หนักและ OpenAI จะรันเป็น shard เฉพาะ ส่วนกลุ่ม extension อื่นยังคงถูกรวมเป็นชุด ใช้ `pnpm test extensions/<id>` สำหรับ lane ของ bundled plugin รายตัว
- `pnpm test:perf:imports`: เปิดใช้การรายงาน import-duration + import-breakdown ของ Vitest ขณะยังคงใช้การ route ผ่าน lane แบบกำหนดขอบเขตสำหรับเป้าหมายไฟล์/ไดเรกทอรีที่ระบุอย่างชัดเจน
- `pnpm test:perf:imports:changed`: โปรไฟล์ import แบบเดียวกัน แต่สำหรับเฉพาะไฟล์ที่เปลี่ยนจาก `origin/main`
- `pnpm test:perf:changed:bench -- --ref <git-ref>` ทำ benchmark เส้นทาง changed-mode ที่ถูก route เทียบกับการรัน root-project แบบปกติ สำหรับ git diff ที่ commit แล้วชุดเดียวกัน
- `pnpm test:perf:changed:bench -- --worktree` ทำ benchmark ชุดการเปลี่ยนแปลงใน worktree ปัจจุบันโดยไม่ต้อง commit ก่อน
- `pnpm test:perf:profile:main`: เขียน CPU profile สำหรับ Vitest main thread (`.artifacts/vitest-main-profile`)
- `pnpm test:perf:profile:runner`: เขียน CPU + heap profiles สำหรับ unit runner (`.artifacts/vitest-runner-profile`)
- Gateway integration: เปิดใช้แบบ opt-in ด้วย `OPENCLAW_TEST_INCLUDE_GATEWAY=1 pnpm test` หรือ `pnpm test:gateway`
- `pnpm test:e2e`: รันการทดสอบ gateway end-to-end smoke (multi-instance WS/HTTP/node pairing) โดยใช้ค่าเริ่มต้นเป็น `threads` + `isolate: false` พร้อม adaptive workers ใน `vitest.e2e.config.ts`; ปรับแต่งได้ด้วย `OPENCLAW_E2E_WORKERS=<n>` และตั้ง `OPENCLAW_E2E_VERBOSE=1` เพื่อดูล็อกแบบละเอียด
- `pnpm test:live`: รันการทดสอบ provider แบบ live (minimax/zai) ต้องมี API keys และ `LIVE=1` (หรือ `*_LIVE_TEST=1` เฉพาะ provider) เพื่อยกเลิกการ skip
- `pnpm test:docker:all`: สร้าง shared live-test image และ Docker E2E image เพียงครั้งเดียว จากนั้นรัน Docker smoke lanes โดยใช้ `OPENCLAW_SKIP_DOCKER_BUILD=1` ด้วย concurrency ค่าเริ่มต้นที่ 4 ปรับได้ด้วย `OPENCLAW_DOCKER_ALL_PARALLELISM=<n>` ตัวรันจะหยุดจัดคิว lane ใหม่หลังจากความล้มเหลวครั้งแรก เว้นแต่จะตั้ง `OPENCLAW_DOCKER_ALL_FAIL_FAST=0` และแต่ละ lane มี timeout 120 นาที ซึ่ง override ได้ด้วย `OPENCLAW_DOCKER_ALL_LANE_TIMEOUT_MS` lane ที่ไวต่อการเริ่มต้นระบบหรือ provider จะรันแบบ exclusive หลังจาก parallel pool จบแล้ว ล็อกของแต่ละ lane จะถูกเขียนไว้ภายใต้ `.artifacts/docker-tests/<run-id>/`
- `pnpm test:docker:openwebui`: เริ่ม OpenClaw + Open WebUI บน Docker, ลงชื่อเข้าใช้ผ่าน Open WebUI, ตรวจสอบ `/api/models`, จากนั้นรันแชต proxied จริงผ่าน `/api/chat/completions` ต้องมี live model key ที่ใช้งานได้ (เช่น OpenAI ใน `~/.profile`), ดึง image ของ Open WebUI จากภายนอก และไม่ได้คาดหวังว่าจะเสถียรใน CI เท่ากับชุด unit/e2e ปกติ
- `pnpm test:docker:mcp-channels`: เริ่มคอนเทนเนอร์ Gateway ที่ seeded แล้ว และคอนเทนเนอร์ client ตัวที่สองซึ่งสตาร์ต `openclaw mcp serve` จากนั้นตรวจสอบ routed conversation discovery, การอ่าน transcript, attachment metadata, พฤติกรรมของ live event queue, การ route สำหรับ outbound send และการแจ้งเตือน channel + permission แบบ Claude ผ่าน stdio bridge จริง การยืนยัน Claude notification จะอ่าน raw stdio MCP frames โดยตรง เพื่อให้ smoke test สะท้อนสิ่งที่ bridge ส่งออกจริง

## PR gate ในเครื่อง

สำหรับการตรวจสอบก่อน land/gate PR ในเครื่อง ให้รัน:

- `pnpm check:changed`
- `pnpm check`
- `pnpm check:test-types`
- `pnpm build`
- `pnpm test`
- `pnpm check:docs`

หาก `pnpm test` มีอาการ flake บนเครื่องที่มีโหลดสูง ให้รันซ้ำหนึ่งครั้งก่อนจะถือว่าเป็น regression จากนั้นค่อยแยกตรวจด้วย `pnpm test <path/to/test>` สำหรับเครื่องที่มีข้อจำกัดด้านหน่วยความจำ ให้ใช้:

- `OPENCLAW_VITEST_MAX_WORKERS=1 pnpm test`
- `OPENCLAW_VITEST_FS_MODULE_CACHE_PATH=/tmp/openclaw-vitest-cache pnpm test:changed`

## benchmark ความหน่วงของโมเดล (คีย์ในเครื่อง)

สคริปต์: [`scripts/bench-model.ts`](https://github.com/openclaw/openclaw/blob/main/scripts/bench-model.ts)

วิธีใช้:

- `source ~/.profile && pnpm tsx scripts/bench-model.ts --runs 10`
- ตัวแปรแวดล้อมเสริม: `MINIMAX_API_KEY`, `MINIMAX_BASE_URL`, `MINIMAX_MODEL`, `ANTHROPIC_API_KEY`
- prompt เริ่มต้น: “Reply with a single word: ok. No punctuation or extra text.”

ผลการรันล่าสุด (2025-12-31, 20 ครั้ง):

- minimax มัธยฐาน 1279ms (ต่ำสุด 1114, สูงสุด 2431)
- opus มัธยฐาน 2454ms (ต่ำสุด 1224, สูงสุด 3170)

## benchmark เวลาเริ่มต้น CLI

สคริปต์: [`scripts/bench-cli-startup.ts`](https://github.com/openclaw/openclaw/blob/main/scripts/bench-cli-startup.ts)

วิธีใช้:

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

ชุดพรีเซ็ต:

- `startup`: `--version`, `--help`, `health`, `health --json`, `status --json`, `status`
- `real`: `health`, `status`, `status --json`, `sessions`, `sessions --json`, `agents list --json`, `gateway status`, `gateway status --json`, `gateway health --json`, `config get gateway.port`
- `all`: ทั้งสองพรีเซ็ต

ผลลัพธ์จะรวม `sampleCount`, avg, p50, p95, min/max, การกระจายของ exit-code/signal และสรุป max RSS สำหรับแต่ละคำสั่ง ตัวเลือก `--cpu-prof-dir` / `--heap-prof-dir` จะเขียน V8 profiles ต่อการรันแต่ละครั้ง เพื่อให้การจับเวลาและการเก็บโปรไฟล์ใช้ harness เดียวกัน

รูปแบบผลลัพธ์ที่บันทึก:

- `pnpm test:startup:bench:smoke` จะเขียน targeted smoke artifact ไปที่ `.artifacts/cli-startup-bench-smoke.json`
- `pnpm test:startup:bench:save` จะเขียน artifact ของชุดเต็มไปที่ `.artifacts/cli-startup-bench-all.json` โดยใช้ `runs=5` และ `warmup=1`
- `pnpm test:startup:bench:update` จะรีเฟรช baseline fixture ที่ check-in ไว้ที่ `test/fixtures/cli-startup-bench.json` โดยใช้ `runs=5` และ `warmup=1`

fixture ที่ check-in ไว้:

- `test/fixtures/cli-startup-bench.json`
- รีเฟรชด้วย `pnpm test:startup:bench:update`
- เปรียบเทียบผลปัจจุบันกับ fixture ด้วย `pnpm test:startup:bench:check`

## Onboarding E2E (Docker)

Docker เป็นทางเลือก ส่วนนี้จำเป็นเฉพาะสำหรับการทดสอบ onboarding smoke แบบคอนเทนเนอร์

โฟลว์ cold-start แบบเต็มในคอนเทนเนอร์ Linux ที่สะอาด:

```bash
scripts/e2e/onboard-docker.sh
```

สคริปต์นี้จะขับวิซาร์ดแบบโต้ตอบผ่าน pseudo-tty, ตรวจสอบไฟล์ config/workspace/session จากนั้นสตาร์ต gateway และรัน `openclaw health`

## QR import smoke (Docker)

ยืนยันว่า `qrcode-terminal` โหลดได้ภายใต้ Docker Node runtimes ที่รองรับ (ค่าเริ่มต้น Node 24, รองรับ Node 22):

```bash
pnpm test:docker:qr
```
