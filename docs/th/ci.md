---
read_when:
    - คุณต้องเข้าใจว่าทำไมงาน CI จึงทำงานหรือไม่ได้ทำงาน
    - คุณกำลังดีบักการตรวจสอบ GitHub Actions ที่ล้มเหลว
summary: กราฟงาน CI, เกตตามขอบเขต และคำสั่งเทียบเท่าบนเครื่อง локալ
title: ไปป์ไลน์ CI
x-i18n:
    generated_at: "2026-04-23T13:58:19Z"
    model: gpt-5.4
    provider: openai
    source_hash: c5a8ea0d8e428826169b0e6aced1caeb993106fe79904002125ace86b48cae1f
    source_path: ci.md
    workflow: 15
---

# ไปป์ไลน์ CI

CI จะทำงานทุกครั้งที่มีการ push ไปยัง `main` และทุก pull request โดยใช้การกำหนดขอบเขตอัจฉริยะเพื่อข้ามงานที่มีค่าใช้จ่ายสูงเมื่อมีการเปลี่ยนแปลงเฉพาะส่วนที่ไม่เกี่ยวข้อง

QA Lab มีเลน CI เฉพาะของตัวเองที่แยกออกจากเวิร์กโฟลว์หลักแบบกำหนดขอบเขตอัจฉริยะ
เวิร์กโฟลว์ `Parity gate` จะทำงานเมื่อมีการเปลี่ยนแปลงใน PR ที่ตรงเงื่อนไขและเมื่อสั่งแบบ manual dispatch; เวิร์กโฟลว์นี้จะสร้างรันไทม์ QA ส่วนตัวและเปรียบเทียบแพ็ก agentic แบบ mock ของ GPT-5.4 และ Opus 4.6
เวิร์กโฟลว์ `QA-Lab - All Lanes` จะทำงานทุกคืนบน `main` และเมื่อสั่งแบบ manual dispatch; โดยจะกระจาย mock parity gate, เลน Matrix แบบ live และเลน Telegram แบบ live ออกเป็นงานขนานกัน
งานแบบ live ใช้ environment `qa-live-shared` และเลน Telegram ใช้ Convex leases
`OpenClaw Release Checks` ก็จะรันเลน QA Lab ชุดเดียวกันนี้ก่อนอนุมัติรีลีสด้วย

## ภาพรวมของงาน

| งาน                              | วัตถุประสงค์                                                                                 | ช่วงเวลาที่ทำงาน                       |
| -------------------------------- | -------------------------------------------------------------------------------------------- | -------------------------------------- |
| `preflight`                      | ตรวจจับการเปลี่ยนแปลงเฉพาะ docs, ขอบเขตที่เปลี่ยน, extensions ที่เปลี่ยน และสร้าง CI manifest | ทำงานเสมอบน push และ PR ที่ไม่ใช่ draft |
| `security-scm-fast`              | ตรวจจับ private key และตรวจสอบ workflow ผ่าน `zizmor`                                       | ทำงานเสมอบน push และ PR ที่ไม่ใช่ draft |
| `security-dependency-audit`      | ตรวจสอบ production lockfile โดยไม่พึ่ง dependency เทียบกับ npm advisories                   | ทำงานเสมอบน push และ PR ที่ไม่ใช่ draft |
| `security-fast`                  | งานรวมที่จำเป็นสำหรับงาน security แบบเร็ว                                                  | ทำงานเสมอบน push และ PR ที่ไม่ใช่ draft |
| `build-artifacts`                | สร้าง `dist/`, Control UI, ตรวจสอบ built artifacts และสร้าง artifacts ที่ใช้ซ้ำได้ปลายทาง    | เมื่อมีการเปลี่ยนแปลงที่เกี่ยวข้องกับ Node |
| `checks-fast-core`               | เลนตรวจความถูกต้องบน Linux แบบเร็ว เช่น bundled/plugin-contract/protocol checks            | เมื่อมีการเปลี่ยนแปลงที่เกี่ยวข้องกับ Node |
| `checks-fast-contracts-channels` | ตรวจสอบ channel contract แบบแบ่ง shard พร้อมผล aggregate check ที่คงที่                     | เมื่อมีการเปลี่ยนแปลงที่เกี่ยวข้องกับ Node |
| `checks-node-extensions`         | ทดสอบ bundled plugin แบบแบ่ง shard ครบทั้งชุด extension                                    | เมื่อมีการเปลี่ยนแปลงที่เกี่ยวข้องกับ Node |
| `checks-node-core-test`          | ชุดทดสอบ Node ของ core แบบแบ่ง shard โดยไม่รวมเลน channel, bundled, contract และ extension | เมื่อมีการเปลี่ยนแปลงที่เกี่ยวข้องกับ Node |
| `extension-fast`                 | ทดสอบแบบเจาะจงเฉพาะ bundled plugins ที่เปลี่ยน                                             | Pull requests ที่มีการเปลี่ยน extension |
| `check`                          | สิ่งเทียบเท่า local gate หลักแบบแบ่ง shard: prod types, lint, guards, test types และ strict smoke | เมื่อมีการเปลี่ยนแปลงที่เกี่ยวข้องกับ Node |
| `check-additional`               | architecture, boundary, guards ของ extension-surface, package-boundary และ gateway-watch shards | เมื่อมีการเปลี่ยนแปลงที่เกี่ยวข้องกับ Node |
| `build-smoke`                    | ทดสอบ built-CLI smoke และ startup-memory smoke                                              | เมื่อมีการเปลี่ยนแปลงที่เกี่ยวข้องกับ Node |
| `checks`                         | ตัวตรวจสอบสำหรับ built-artifact channel tests พร้อมความเข้ากันได้กับ Node 22 ที่รันเฉพาะ push | เมื่อมีการเปลี่ยนแปลงที่เกี่ยวข้องกับ Node |
| `check-docs`                     | ตรวจสอบการจัดรูปแบบ docs, lint และ broken links                                            | เมื่อ docs มีการเปลี่ยนแปลง             |
| `skills-python`                  | Ruff + pytest สำหรับ Skills ที่รองรับด้วย Python                                            | เมื่อมีการเปลี่ยนแปลงที่เกี่ยวข้องกับ Python skill |
| `checks-windows`                 | เลนทดสอบเฉพาะ Windows                                                                       | เมื่อมีการเปลี่ยนแปลงที่เกี่ยวข้องกับ Windows |
| `macos-node`                     | เลนทดสอบ TypeScript บน macOS โดยใช้ built artifacts ที่แชร์ร่วมกัน                           | เมื่อมีการเปลี่ยนแปลงที่เกี่ยวข้องกับ macOS |
| `macos-swift`                    | lint, build และทดสอบ Swift สำหรับแอป macOS                                                 | เมื่อมีการเปลี่ยนแปลงที่เกี่ยวข้องกับ macOS |
| `android`                        | ทดสอบยูนิต Android สำหรับทั้งสอง flavor พร้อม build debug APK หนึ่งรายการ                  | เมื่อมีการเปลี่ยนแปลงที่เกี่ยวข้องกับ Android |

## ลำดับการหยุดเมื่อพบความล้มเหลวอย่างรวดเร็ว

งานต่าง ๆ ถูกจัดลำดับให้การตรวจสอบที่มีต้นทุนต่ำล้มเหลวก่อนที่งานราคาแพงจะเริ่มทำงาน:

1. `preflight` เป็นตัวตัดสินว่าจะมีเลนใดอยู่บ้าง `docs-scope` และตรรกะ `changed-scope` เป็นขั้นตอนภายในงานนี้ ไม่ใช่งานแยกต่างหาก
2. `security-scm-fast`, `security-dependency-audit`, `security-fast`, `check`, `check-additional`, `check-docs` และ `skills-python` จะล้มเหลวได้อย่างรวดเร็วโดยไม่ต้องรอ artifact และงานเมทริกซ์ของแพลตฟอร์มที่หนักกว่า
3. `build-artifacts` จะทำงานซ้อนกับเลน Linux แบบเร็ว เพื่อให้ downstream consumers เริ่มได้ทันทีเมื่อ shared build พร้อม
4. หลังจากนั้นเลนแพลตฟอร์มและรันไทม์ที่หนักกว่าจะกระจายออก: `checks-fast-core`, `checks-fast-contracts-channels`, `checks-node-extensions`, `checks-node-core-test`, `extension-fast` ที่รันเฉพาะ PR, `checks`, `checks-windows`, `macos-node`, `macos-swift` และ `android`

ตรรกะการกำหนดขอบเขตอยู่ใน `scripts/ci-changed-scope.mjs` และมี unit tests ครอบคลุมใน `src/scripts/ci-changed-scope.test.ts`
การแก้ไข CI workflow จะตรวจสอบกราฟ Node CI และ workflow linting แต่จะไม่บังคับให้รัน Windows, Android หรือ native builds ของ macOS เพียงเพราะมีการแก้ workflow; เลนของแพลตฟอร์มเหล่านั้นยังคงถูกกำหนดขอบเขตตามการเปลี่ยนแปลงในซอร์สของแพลตฟอร์มนั้น
การตรวจสอบ Node บน Windows ถูกกำหนดขอบเขตให้ครอบคลุมเฉพาะ process/path wrappers ที่เฉพาะกับ Windows, ตัวช่วย npm/pnpm/UI runner, การตั้งค่า package manager และพื้นผิวของ CI workflow ที่รันเลนนั้น; การเปลี่ยนแปลงซอร์ส, plugin, install-smoke และเฉพาะการทดสอบที่ไม่เกี่ยวข้อง จะยังอยู่ในเลน Linux Node เพื่อไม่ให้ต้องจอง worker Windows แบบ 16-vCPU สำหรับความครอบคลุมที่เลนทดสอบปกติได้ครอบคลุมอยู่แล้ว
เวิร์กโฟลว์ `install-smoke` แยกต่างหากนำสคริปต์กำหนดขอบเขตเดียวกันมาใช้ผ่านงาน `preflight` ของตัวเอง โดยคำนวณ `run_install_smoke` จากสัญญาณ changed-smoke ที่แคบกว่า ดังนั้น Docker/install smoke จะรันเมื่อมีการเปลี่ยนแปลงที่เกี่ยวกับ install, packaging, container, bundled extension production และพื้นผิว core plugin/channel/gateway/Plugin SDK ที่งาน Docker smoke ใช้งาน การแก้ไขเฉพาะ test และ docs จะไม่จอง Docker workers
QR package smoke ของมันจะบังคับให้ Docker `pnpm install` layer รันใหม่ โดยยังคงรักษา BuildKit pnpm store cache เอาไว้ จึงยังคงทดสอบการติดตั้งได้โดยไม่ต้องดาวน์โหลด dependencies ใหม่ทุกครั้ง
gateway-network e2e ของมันจะใช้ runtime image ที่สร้างไว้ก่อนหน้าในงานเดิมซ้ำ จึงเพิ่มความครอบคลุม WebSocket แบบ container-to-container จริง โดยไม่ต้องเพิ่มการ build Docker อีกครั้ง
บนเครื่อง local, `test:docker:all` จะ prebuild live-test image ที่แชร์ร่วมกันหนึ่งรายการ และ built-app image จาก `scripts/e2e/Dockerfile` ที่แชร์ร่วมกันอีกหนึ่งรายการ จากนั้นจึงรันเลน live/E2E แบบขนานด้วย `OPENCLAW_SKIP_DOCKER_BUILD=1`; สามารถปรับ concurrency ค่าเริ่มต้นที่ 4 ได้ด้วย `OPENCLAW_DOCKER_ALL_PARALLELISM`
ตัว aggregate บนเครื่อง local จะหยุดกำหนดตารางเลนใหม่ใน pool หลังจากเจอความล้มเหลวครั้งแรกตามค่าเริ่มต้น และแต่ละเลนมี timeout 120 นาที ซึ่ง override ได้ด้วย `OPENCLAW_DOCKER_ALL_LANE_TIMEOUT_MS`
เลนที่ไวต่อ startup หรือ provider จะรันแบบ exclusive หลังจาก pool แบบขนานเสร็จแล้ว
เวิร์กโฟลว์ live/E2E แบบใช้ซ้ำได้สะท้อนรูปแบบ shared-image เดียวกัน โดยสร้างและ push Docker E2E image บน GHCR ที่ติดแท็กด้วย SHA หนึ่งรายการก่อน Docker matrix แล้วจึงรันเมทริกซ์ด้วย `OPENCLAW_SKIP_DOCKER_BUILD=1`
เวิร์กโฟลว์ live/E2E แบบ scheduled จะรันชุด Docker สำหรับเส้นทางรีลีสเต็มรูปแบบทุกวัน
การทดสอบ Docker ของ QR และ installer ยังคงใช้ Dockerfiles เฉพาะของตัวเองที่มุ่งเน้นการติดตั้ง
มีงาน `docker-e2e-fast` แยกต่างหากที่รันโปรไฟล์ Docker ของ bundled-plugin แบบมีขอบเขต ภายใต้ command timeout 120 วินาที: setup-entry dependency repair พร้อม synthetic bundled-loader failure isolation
เมทริกซ์ bundled update/channel แบบเต็มยังคงเป็นแบบ manual/full-suite เพราะมีการทำ npm update จริงซ้ำหลายครั้งและทำ doctor repair pass

ตรรกะ local changed-lane อยู่ใน `scripts/changed-lanes.mjs` และถูกรันโดย `scripts/check-changed.mjs`
local gate นี้เข้มงวดกว่าการกำหนดขอบเขตแพลตฟอร์มแบบกว้างของ CI ในเรื่อง architecture boundaries: การเปลี่ยนแปลง production ของ core จะรัน core prod typecheck พร้อม core tests, การเปลี่ยนแปลงเฉพาะการทดสอบของ core จะรันเฉพาะ core test typecheck/tests, การเปลี่ยนแปลง production ของ extension จะรัน extension prod typecheck พร้อม extension tests และการเปลี่ยนแปลงเฉพาะการทดสอบของ extension จะรันเฉพาะ extension test typecheck/tests
การเปลี่ยนแปลง Public Plugin SDK หรือ plugin-contract จะขยายไปสู่การตรวจสอบ extension ด้วย เพราะ extensions พึ่งพา core contracts เหล่านั้น
การ bump เวอร์ชันที่เป็น metadata สำหรับรีลีสเท่านั้นจะรัน targeted version/config/root-dependency checks
การเปลี่ยนแปลง root/config ที่ไม่ทราบประเภทจะ fail safe ไปยังทุกเลน

บน push, เมทริกซ์ `checks` จะเพิ่มเลน `compat-node22` ที่รันเฉพาะ push
บน pull request เลนนั้นจะถูกข้ามไป และเมทริกซ์จะยังคงเน้นเฉพาะเลนทดสอบ/channel ปกติ

ตระกูลการทดสอบ Node ที่ช้าที่สุดถูกแยกหรือถ่วงดุลเพื่อให้งานแต่ละงานมีขนาดเล็ก: channel contracts แยกความครอบคลุมของ registry และ core ออกเป็นทั้งหมดหก shard แบบถ่วงน้ำหนัก, การทดสอบ bundled plugin ถ่วงดุลข้าม workers ของ extension จำนวนหกตัว, auto-reply รันเป็น workers แบบถ่วงดุลสามตัวแทนที่จะเป็น workers เล็ก ๆ หกตัว และ configs ของ agentic gateway/plugin จะถูกกระจายไปยังงาน source-only agentic Node ที่มีอยู่แทนที่จะไปรอ built artifacts
การทดสอบ browser, QA, media และ plugin เบ็ดเตล็ดแบบกว้างใช้ Vitest config เฉพาะของตัวเอง แทนที่จะใช้ plugin catch-all ที่แชร์ร่วมกัน
เลน agents แบบกว้างใช้ตัวจัดตาราง file-parallel ของ Vitest ที่แชร์ร่วมกัน เพราะถูกครอบงำด้วยการ import/การจัดตาราง มากกว่าจะเป็นเจ้าของโดยไฟล์ทดสอบช้าไฟล์เดียว
`runtime-config` รันร่วมกับ infra core-runtime shard เพื่อไม่ให้ shared runtime shard เป็นเจ้าของส่วนท้ายของงาน
`check-additional` รวม package-boundary compile/canary work ไว้ด้วยกัน และแยก runtime topology architecture ออกจาก gateway watch coverage; boundary guard shard จะรัน guards อิสระขนาดเล็กของตัวเองพร้อมกันภายในงานเดียว
Gateway watch, channel tests และ core support-boundary shard จะรันพร้อมกันภายใน `build-artifacts` หลังจากสร้าง `dist/` และ `dist-runtime/` เรียบร้อยแล้ว โดยคงชื่อ check เดิมไว้เป็นงาน verifier แบบเบา ขณะเดียวกันก็หลีกเลี่ยงการใช้ Blacksmith workers เพิ่มอีกสองตัวและหลีกเลี่ยงคิว artifact-consumer รอบที่สอง
Android CI จะรันทั้ง `testPlayDebugUnitTest` และ `testThirdPartyDebugUnitTest` จากนั้นจึง build Play debug APK
third-party flavor ไม่มี source set หรือ manifest แยกต่างหาก; เลน unit-test ของมันยังคงคอมไพล์ flavor นั้นด้วยแฟล็ก BuildConfig ของ SMS/call-log ขณะเดียวกันก็หลีกเลี่ยงงาน debug APK packaging ที่ซ้ำซ้อนในทุก push ที่เกี่ยวข้องกับ Android
`extension-fast` เป็น PR-only เพราะการรันบน push ได้รัน bundled plugin shards แบบเต็มอยู่แล้ว ซึ่งช่วยให้มี feedback สำหรับ plugin ที่เปลี่ยนระหว่างรีวิว โดยไม่ต้องจอง Blacksmith worker เพิ่มบน `main` สำหรับความครอบคลุมที่มีอยู่แล้วใน `checks-node-extensions`

GitHub อาจทำเครื่องหมายงานที่ถูกแทนที่แล้วว่า `cancelled` เมื่อมี push ใหม่กว่ามายัง PR เดียวกันหรือ ref `main` เดียวกัน
ให้ถือว่านี่เป็นสัญญาณรบกวนของ CI เว้นแต่ว่าการรันล่าสุดสำหรับ ref เดียวกันนั้นจะล้มเหลวด้วย
การตรวจสอบ shard แบบ aggregate ใช้ `!cancelled() && always()` เพื่อให้ยังคงรายงานความล้มเหลวปกติของ shard ได้ แต่จะไม่เข้าคิวหลังจากที่ทั้ง workflow ถูกแทนที่ไปแล้ว

คีย์ concurrency ของ CI ถูกใส่เวอร์ชันไว้ (`CI-v7-*`) เพื่อไม่ให้ zombie ฝั่ง GitHub ใน queue group เก่าบล็อกการรันใหม่บน main ได้ไม่มีกำหนด

## รันเนอร์

| รันเนอร์                         | งาน                                                                                                                                                                                                                                                                                                                                                                                                                                                                     |
| -------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `ubuntu-24.04`                   | `preflight`, งาน security แบบเร็วและงาน aggregate (`security-scm-fast`, `security-dependency-audit`, `security-fast`), การตรวจสอบ protocol/contract/bundled แบบเร็ว, การตรวจสอบ channel contract แบบแบ่ง shard, shard ของ `check` ยกเว้น lint, shard และ aggregate ของ `check-additional`, ตัวตรวจสอบ aggregate ของชุดทดสอบ Node, การตรวจสอบ docs, Python Skills, workflow-sanity, labeler, auto-response; preflight ของ install-smoke ก็ใช้ Ubuntu ที่โฮสต์โดย GitHub เช่นกัน เพื่อให้เมทริกซ์ Blacksmith เข้าคิวได้เร็วขึ้น |
| `blacksmith-8vcpu-ubuntu-2404`   | `build-artifacts`, build-smoke, shard ของชุดทดสอบ Linux Node, shard ของชุดทดสอบ bundled plugin, `android`                                                                                                                                                                                                                                                                                                                                                            |
| `blacksmith-16vcpu-ubuntu-2404`  | `check-lint` ซึ่งยังคงไวต่อ CPU มากพอที่ 8 vCPU จะมีต้นทุนสูงกว่าประโยชน์ที่ได้; การ build Docker ของ install-smoke ซึ่งเวลาเข้าคิวของ 32-vCPU มีต้นทุนสูงกว่าประโยชน์ที่ได้                                                                                                                                                                                                                                                                                 |
| `blacksmith-16vcpu-windows-2025` | `checks-windows`                                                                                                                                                                                                                                                                                                                                                                                                                                                         |
| `blacksmith-6vcpu-macos-latest`  | `macos-node` บน `openclaw/openclaw`; fork จะ fallback ไปใช้ `macos-latest`                                                                                                                                                                                                                                                                                                                                                                                             |
| `blacksmith-12vcpu-macos-latest` | `macos-swift` บน `openclaw/openclaw`; fork จะ fallback ไปใช้ `macos-latest`                                                                                                                                                                                                                                                                                                                                                                                            |

## คำสั่งเทียบเท่าบนเครื่อง local

```bash
pnpm changed:lanes   # ตรวจสอบตัวจัดประเภท changed-lane บนเครื่องสำหรับ origin/main...HEAD
pnpm check:changed   # local gate อัจฉริยะ: typecheck/lint/tests ตามเลน boundary ที่เปลี่ยน
pnpm check          # local gate แบบเร็ว: production tsgo + lint แบบแบ่ง shard + fast guards แบบขนาน
pnpm check:test-types
pnpm check:timed    # gate เดียวกันพร้อมเวลาแยกตามแต่ละช่วง
pnpm build:strict-smoke
pnpm check:architecture
pnpm test:gateway:watch-regression
pnpm test           # การทดสอบ Vitest
pnpm test:channels
pnpm test:contracts:channels
pnpm check:docs     # จัดรูปแบบ docs + lint + broken links
pnpm build          # build dist เมื่อเลน artifact/build-smoke ของ CI มีความเกี่ยวข้อง
node scripts/ci-run-timings.mjs <run-id>  # สรุป wall time, queue time และงานที่ช้าที่สุด
```
