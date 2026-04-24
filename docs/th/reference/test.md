---
read_when:
    - การรันหรือแก้ไขการทดสอบ
summary: วิธีรันการทดสอบในเครื่อง (vitest) และควรใช้โหมด force/coverage เมื่อใด
title: การทดสอบ
x-i18n:
    generated_at: "2026-04-24T09:32:55Z"
    model: gpt-5.4
    provider: openai
    source_hash: 26cdb5fe005e738ddd00b183e91ccebe08c709bd64eed377d573a37b76e3a3bf
    source_path: reference/test.md
    workflow: 15
---

- ชุดเครื่องมือทดสอบเต็มรูปแบบ (suites, live, Docker): [Testing](/th/help/testing)

- `pnpm test:force`: ปิดโปรเซส gateway ที่ค้างอยู่ซึ่งยึด control port ค่าเริ่มต้น แล้วรัน Vitest suite แบบเต็มด้วย gateway port ที่แยกออกมา เพื่อไม่ให้ server tests ชนกับอินสแตนซ์ที่กำลังทำงานอยู่ ใช้สิ่งนี้เมื่อ gateway ที่รันก่อนหน้าทิ้งพอร์ต 18789 ไว้ในสถานะถูกใช้งาน
- `pnpm test:coverage`: รัน unit suite พร้อม V8 coverage (ผ่าน `vitest.unit.config.ts`) นี่คือ coverage gate สำหรับ unit ของไฟล์ที่ถูกโหลด ไม่ใช่ all-file coverage ทั้ง repo ค่า threshold คือ 70% สำหรับ lines/functions/statements และ 55% สำหรับ branches เนื่องจาก `coverage.all` เป็น false gate นี้จึงวัดเฉพาะไฟล์ที่ถูกโหลดโดย unit coverage suite แทนที่จะมองทุกไฟล์ source ใน split-lane ว่าไม่ได้ถูกครอบคลุม
- `pnpm test:coverage:changed`: รัน unit coverage เฉพาะไฟล์ที่เปลี่ยนไปจาก `origin/main`
- `pnpm test:changed`: ขยายพาธ git ที่เปลี่ยนไปเป็น Vitest lanes แบบมีขอบเขต เมื่อ diff แตะเฉพาะไฟล์ source/test ที่กำหนดเส้นทางได้ ส่วนการเปลี่ยนแปลง config/setup จะยัง fallback ไปที่การรัน native root projects เพื่อให้การแก้ wiring ถูกรันซ้ำแบบกว้างเมื่อจำเป็น
- `pnpm changed:lanes`: แสดง lanes เชิงสถาปัตยกรรมที่ถูกกระตุ้นโดย diff เทียบกับ `origin/main`
- `pnpm check:changed`: รัน changed gate อัจฉริยะสำหรับ diff เทียบกับ `origin/main` มันรันงาน core พร้อม core test lanes, งาน extension พร้อม extension test lanes, งานที่แตะเฉพาะ test พร้อม test typecheck/tests เท่านั้น, ขยายการเปลี่ยนแปลงสาธารณะของ Plugin SDK หรือ plugin-contract ให้มีการตรวจสอบ extension หนึ่งรอบ และคงการ bump เวอร์ชันที่แตะเฉพาะ release metadata ไว้ที่การตรวจสอบ version/config/root-dependency แบบเจาะจง
- `pnpm test`: กำหนดเส้นทาง target แบบไฟล์/ไดเรกทอรีที่ระบุชัดผ่าน Vitest lanes แบบมีขอบเขต การรันที่ไม่ระบุเป้าหมายจะใช้ shard groups แบบคงที่และขยายไปยัง leaf configs สำหรับการรันแบบขนานในเครื่อง กลุ่ม extension จะขยายไปยัง per-extension shard configs เสมอ แทนที่จะเป็นโปรเซส root-project ขนาดใหญ่ตัวเดียว
- การรันแบบเต็มและแบบ extension shard จะอัปเดตข้อมูล timing ในเครื่องไว้ที่ `.artifacts/vitest-shard-timings.json`; การรันครั้งถัดไปจะใช้ timing เหล่านั้นเพื่อถ่วงดุล shard ที่ช้าและเร็ว ตั้ง `OPENCLAW_TEST_PROJECTS_TIMINGS=0` เพื่อไม่ใช้ timing artifact ในเครื่อง
- ไฟล์ทดสอบ `plugin-sdk` และ `commands` บางชุดจะถูกกำหนดเส้นทางไปยัง light lanes เฉพาะที่คงไว้เพียง `test/setup.ts` ส่วนกรณีที่หนักทาง runtime จะยังอยู่บน lanes เดิม
- ไฟล์ source helper บางชุดของ `plugin-sdk` และ `commands` ยังแมป `pnpm test:changed` ไปยัง sibling tests แบบ explicit ใน light lanes เหล่านั้นด้วย ดังนั้นการแก้ helper เล็กๆ จะไม่ต้องรัน suites ที่หนักและพึ่ง runtime ซ้ำทั้งหมด
- `auto-reply` ตอนนี้ยังถูกแยกเป็นสาม config เฉพาะ (`core`, `top-level`, `reply`) เพื่อไม่ให้ reply harness ครอบงำการทดสอบ status/token/helper ระดับบนที่เบากว่า
- Base Vitest config ตอนนี้ใช้ค่าเริ่มต้นเป็น `pool: "threads"` และ `isolate: false` พร้อมเปิดใช้ shared non-isolated runner ทั่วทั้ง repo configs
- `pnpm test:channels` รัน `vitest.channels.config.ts`
- `pnpm test:extensions` และ `pnpm test extensions` รัน shards ของ extension/plugin ทั้งหมด ปลั๊กอินช่องทางส่งข้อความขนาดหนัก ปลั๊กอิน browser และ OpenAI จะรันเป็น shards เฉพาะ ส่วนกลุ่มปลั๊กอินอื่นยังคงถูกรวมเป็นชุด ใช้ `pnpm test extensions/<id>` สำหรับ lane ของปลั๊กอิน bundled หนึ่งตัว
- `pnpm test:perf:imports`: เปิดรายงาน Vitest import-duration + import-breakdown ขณะยังคงใช้การกำหนดเส้นทาง lane แบบมีขอบเขตสำหรับ target แบบไฟล์/ไดเรกทอรีที่ระบุชัด
- `pnpm test:perf:imports:changed`: โปรไฟล์ import เช่นเดียวกัน แต่เฉพาะไฟล์ที่เปลี่ยนไปจาก `origin/main`
- `pnpm test:perf:changed:bench -- --ref <git-ref>` วัดประสิทธิภาพเส้นทาง changed-mode ที่ถูกกำหนดเส้นทางเทียบกับการรัน native root-project สำหรับ git diff ที่ commit แล้วชุดเดียวกัน
- `pnpm test:perf:changed:bench -- --worktree` วัดประสิทธิภาพชุดการเปลี่ยนแปลงใน worktree ปัจจุบันโดยไม่ต้อง commit ก่อน
- `pnpm test:perf:profile:main`: เขียน CPU profile สำหรับ Vitest main thread (`.artifacts/vitest-main-profile`)
- `pnpm test:perf:profile:runner`: เขียน CPU + heap profiles สำหรับ unit runner (`.artifacts/vitest-runner-profile`)
- `pnpm test:perf:groups --full-suite --allow-failures --output .artifacts/test-perf/baseline-before.json`: รันทุก full-suite Vitest leaf config แบบลำดับเดียว และเขียนข้อมูล duration แบบจัดกลุ่มพร้อม artifact JSON/log ต่อ config Test Performance Agent ใช้สิ่งนี้เป็น baseline ก่อนพยายามแก้ slow tests
- `pnpm test:perf:groups:compare .artifacts/test-perf/baseline-before.json .artifacts/test-perf/after-agent.json`: เปรียบเทียบรายงานแบบจัดกลุ่มหลังการเปลี่ยนแปลงที่เน้นประสิทธิภาพ
- Gateway integration: เลือกเปิดใช้ด้วย `OPENCLAW_TEST_INCLUDE_GATEWAY=1 pnpm test` หรือ `pnpm test:gateway`
- `pnpm test:e2e`: รัน gateway end-to-end smoke tests (multi-instance WS/HTTP/node pairing) ใช้ค่าเริ่มต้นเป็น `threads` + `isolate: false` พร้อม workers แบบ adaptive ใน `vitest.e2e.config.ts`; ปรับได้ด้วย `OPENCLAW_E2E_WORKERS=<n>` และตั้ง `OPENCLAW_E2E_VERBOSE=1` เพื่อดู log แบบละเอียด
- `pnpm test:live`: รัน provider live tests (minimax/zai) ต้องมี API keys และ `LIVE=1` (หรือ `*_LIVE_TEST=1` เฉพาะผู้ให้บริการ) เพื่อเอา skip ออก
- `pnpm test:docker:all`: build shared live-test image และ Docker E2E image หนึ่งครั้ง แล้วรัน Docker smoke lanes ด้วย `OPENCLAW_SKIP_DOCKER_BUILD=1` โดยใช้ concurrency 8 เป็นค่าเริ่มต้น ปรับ main pool ได้ด้วย `OPENCLAW_DOCKER_ALL_PARALLELISM=<n>` และ provider-sensitive tail pool ด้วย `OPENCLAW_DOCKER_ALL_TAIL_PARALLELISM=<n>`; ทั้งคู่มีค่าเริ่มต้นเป็น 8 การเริ่ม lane จะถูกเหลื่อมกันทีละ 2 วินาทีโดยค่าเริ่มต้นเพื่อหลีกเลี่ยง create storms บน local Docker daemon; override ได้ด้วย `OPENCLAW_DOCKER_ALL_START_STAGGER_MS=<ms>` ตัวรันจะหยุดจัดตาราง pooled lanes ใหม่หลังความล้มเหลวครั้งแรก เว้นแต่จะตั้ง `OPENCLAW_DOCKER_ALL_FAIL_FAST=0` และแต่ละ lane มี timeout 120 นาทีที่ override ได้ด้วย `OPENCLAW_DOCKER_ALL_LANE_TIMEOUT_MS` log ต่อ lane จะถูกเขียนไว้ใต้ `.artifacts/docker-tests/<run-id>/`
- `pnpm test:docker:openwebui`: เริ่ม Dockerized OpenClaw + Open WebUI, ลงชื่อเข้าใช้ผ่าน Open WebUI, ตรวจสอบ `/api/models` แล้วรันแชตจริงผ่านพร็อกซีบน `/api/chat/completions` ต้องมี live model key ที่ใช้งานได้ (เช่น OpenAI ใน `~/.profile`) มีการดึง image ของ Open WebUI ภายนอก และไม่ได้คาดหวังให้เสถียรใน CI เหมือนชุด unit/e2e ปกติ
- `pnpm test:docker:mcp-channels`: เริ่ม seeded Gateway container และ client container ตัวที่สองที่ spawn `openclaw mcp serve` จากนั้นตรวจสอบ routed conversation discovery, การอ่าน transcript, ข้อมูลเมตาไฟล์แนบ, พฤติกรรม live event queue, การกำหนดเส้นทาง outbound send และการแจ้งเตือนช่องทางส่งข้อความ + สิทธิ์แบบ Claude ผ่าน stdio bridge จริง การยืนยันการแจ้งเตือนของ Claude จะอ่าน raw stdio MCP frames โดยตรงเพื่อให้ smoke นี้สะท้อนสิ่งที่ bridge ส่งออกจริง

## PR gate ในเครื่อง

สำหรับการตรวจสอบ PR ก่อน land/gate ในเครื่อง ให้รัน:

- `pnpm check:changed`
- `pnpm check`
- `pnpm check:test-types`
- `pnpm build`
- `pnpm test`
- `pnpm check:docs`

หาก `pnpm test` มีอาการ flake บนเครื่องที่มีโหลดสูง ให้รันซ้ำอีกหนึ่งครั้งก่อนถือว่าเป็น regression แล้วจึงแยกปัญหาด้วย `pnpm test <path/to/test>` สำหรับเครื่องที่หน่วยความจำจำกัด ให้ใช้:

- `OPENCLAW_VITEST_MAX_WORKERS=1 pnpm test`
- `OPENCLAW_VITEST_FS_MODULE_CACHE_PATH=/tmp/openclaw-vitest-cache pnpm test:changed`

## การวัด latency ของโมเดล (คีย์ในเครื่อง)

สคริปต์: [`scripts/bench-model.ts`](https://github.com/openclaw/openclaw/blob/main/scripts/bench-model.ts)

การใช้งาน:

- `source ~/.profile && pnpm tsx scripts/bench-model.ts --runs 10`
- env แบบไม่บังคับ: `MINIMAX_API_KEY`, `MINIMAX_BASE_URL`, `MINIMAX_MODEL`, `ANTHROPIC_API_KEY`
- prompt ค่าเริ่มต้น: “Reply with a single word: ok. No punctuation or extra text.”

การรันล่าสุด (2025-12-31, 20 รอบ):

- minimax median 1279ms (min 1114, max 2431)
- opus median 2454ms (min 1224, max 3170)

## การวัดการเริ่มต้นของ CLI

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

พรีเซ็ต:

- `startup`: `--version`, `--help`, `health`, `health --json`, `status --json`, `status`
- `real`: `health`, `status`, `status --json`, `sessions`, `sessions --json`, `agents list --json`, `gateway status`, `gateway status --json`, `gateway health --json`, `config get gateway.port`
- `all`: ทั้งสองพรีเซ็ต

เอาต์พุตจะมี `sampleCount`, avg, p50, p95, min/max, การกระจายของ exit-code/signal และสรุป max RSS สำหรับแต่ละคำสั่ง `--cpu-prof-dir` / `--heap-prof-dir` แบบไม่บังคับจะเขียน V8 profiles ต่อการรัน เพื่อให้การจับเวลาและการจับ profile ใช้ harness เดียวกัน

ข้อตกลงของเอาต์พุตที่บันทึก:

- `pnpm test:startup:bench:smoke` จะเขียน targeted smoke artifact ไปที่ `.artifacts/cli-startup-bench-smoke.json`
- `pnpm test:startup:bench:save` จะเขียน full-suite artifact ไปที่ `.artifacts/cli-startup-bench-all.json` โดยใช้ `runs=5` และ `warmup=1`
- `pnpm test:startup:bench:update` จะรีเฟรช baseline fixture ที่เช็กอินไว้ที่ `test/fixtures/cli-startup-bench.json` โดยใช้ `runs=5` และ `warmup=1`

fixture ที่เช็กอินไว้:

- `test/fixtures/cli-startup-bench.json`
- รีเฟรชด้วย `pnpm test:startup:bench:update`
- เปรียบเทียบผลลัพธ์ปัจจุบันกับ fixture ด้วย `pnpm test:startup:bench:check`

## Onboarding E2E (Docker)

Docker เป็นทางเลือก; ต้องใช้เฉพาะสำหรับ onboarding smoke tests แบบ containerized เท่านั้น

โฟลว์ cold-start แบบเต็มใน Linux container ที่สะอาด:

```bash
scripts/e2e/onboard-docker.sh
```

สคริปต์นี้จะขับ interactive wizard ผ่าน pseudo-tty, ตรวจสอบไฟล์ config/workspace/session จากนั้นเริ่ม gateway และรัน `openclaw health`

## QR import smoke (Docker)

ตรวจสอบว่า runtime helper สำหรับ QR ที่ดูแลอยู่สามารถโหลดได้ภายใต้ Docker Node runtimes ที่รองรับ (Node 24 เป็นค่าเริ่มต้น และ Node 22 ที่เข้ากันได้):

```bash
pnpm test:docker:qr
```

## ที่เกี่ยวข้อง

- [Testing](/th/help/testing)
- [Testing live](/th/help/testing-live)
