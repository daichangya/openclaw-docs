---
read_when:
    - คุณต้องเข้าใจว่าเหตุใดงาน CI จึงทำงานหรือไม่ทำงาน
    - คุณกำลังดีบักการตรวจสอบ GitHub Actions ที่ล้มเหลว
summary: กราฟงาน CI เกณฑ์การจำกัดขอบเขต และคำสั่งในเครื่องที่เทียบเท่ากัน
title: ไปป์ไลน์ CI
x-i18n:
    generated_at: "2026-04-23T14:56:06Z"
    model: gpt-5.4
    provider: openai
    source_hash: e9a03440ae28a15167fc08d9c66bb1fd719ddfa1517aaecb119c80f2ad826c0d
    source_path: ci.md
    workflow: 15
---

# ไปป์ไลน์ CI

CI จะทำงานทุกครั้งที่มีการ push ไปยัง `main` และทุก pull request โดยใช้การกำหนดขอบเขตแบบอัจฉริยะเพื่อข้ามงานที่มีค่าใช้จ่ายสูงเมื่อมีการเปลี่ยนแปลงเฉพาะส่วนที่ไม่เกี่ยวข้อง

QA Lab มีเลน CI เฉพาะของตัวเองแยกจากเวิร์กโฟลว์หลักที่ใช้การกำหนดขอบเขตแบบอัจฉริยะ เวิร์กโฟลว์ `Parity gate` จะทำงานเมื่อมีการเปลี่ยนแปลง PR ที่ตรงเงื่อนไขและเมื่อสั่งทำงานเอง โดยจะสร้าง private QA runtime และเปรียบเทียบแพ็ก agentic จำลองของ GPT-5.4 และ Opus 4.6 เวิร์กโฟลว์ `QA-Lab - All Lanes` จะทำงานทุกคืนบน `main` และเมื่อสั่งทำงานเอง โดยจะแตกงานเป็น mock parity gate, เลน Matrix แบบ live และเลน Telegram แบบ live ที่ทำงานขนานกัน งานแบบ live ใช้ environment `qa-live-shared` และเลน Telegram ใช้ Convex leases นอกจากนี้ `OpenClaw Release Checks` ยังเรียกใช้เลน QA Lab ชุดเดียวกันก่อนอนุมัติการออกรีลีสด้วย

## ภาพรวมของงาน

| งาน                              | วัตถุประสงค์                                                                                 | ทำงานเมื่อใด                          |
| -------------------------------- | --------------------------------------------------------------------------------------------- | ------------------------------------- |
| `preflight`                      | ตรวจจับการเปลี่ยนแปลงเฉพาะ docs, ขอบเขตที่เปลี่ยน, extensions ที่เปลี่ยน และสร้าง CI manifest | ทำงานเสมอบน push และ PR ที่ไม่ใช่ draft |
| `security-scm-fast`              | ตรวจจับ private key และตรวจสอบ workflow ผ่าน `zizmor`                                        | ทำงานเสมอบน push และ PR ที่ไม่ใช่ draft |
| `security-dependency-audit`      | ตรวจสอบ production lockfile แบบไม่พึ่ง dependency เทียบกับ npm advisories                    | ทำงานเสมอบน push และ PR ที่ไม่ใช่ draft |
| `security-fast`                  | งานรวมที่จำเป็นสำหรับงาน security แบบเร็ว                                                    | ทำงานเสมอบน push และ PR ที่ไม่ใช่ draft |
| `build-artifacts`                | สร้าง `dist/`, Control UI, ตรวจสอบ built artifact และสร้าง artifacts ใช้ซ้ำสำหรับ downstream  | เมื่อมีการเปลี่ยนแปลงที่เกี่ยวข้องกับ Node |
| `checks-fast-core`               | เลนตรวจสอบความถูกต้องแบบเร็วบน Linux เช่น bundled/plugin-contract/protocol checks             | เมื่อมีการเปลี่ยนแปลงที่เกี่ยวข้องกับ Node |
| `checks-fast-contracts-channels` | การตรวจสอบ channel contract แบบแยก shard พร้อมผลตรวจสอบรวมที่เสถียร                         | เมื่อมีการเปลี่ยนแปลงที่เกี่ยวข้องกับ Node |
| `checks-node-extensions`         | test shards เต็มรูปแบบสำหรับ bundled-plugin ทั้งชุดของ extension                              | เมื่อมีการเปลี่ยนแปลงที่เกี่ยวข้องกับ Node |
| `checks-node-core-test`          | core Node test shards โดยไม่รวม channel, bundled, contract และ extension lanes                | เมื่อมีการเปลี่ยนแปลงที่เกี่ยวข้องกับ Node |
| `extension-fast`                 | การทดสอบแบบเจาะจงสำหรับ bundled plugins ที่เปลี่ยนเท่านั้น                                   | pull requests ที่มีการเปลี่ยนแปลง extension |
| `check`                          | ค่าที่เทียบเท่ากับ local gate หลักแบบแยก shard: prod types, lint, guards, test types และ strict smoke | เมื่อมีการเปลี่ยนแปลงที่เกี่ยวข้องกับ Node |
| `check-additional`               | architecture, boundary, extension-surface guards, package-boundary และ gateway-watch shards   | เมื่อมีการเปลี่ยนแปลงที่เกี่ยวข้องกับ Node |
| `build-smoke`                    | built-CLI smoke tests และ startup-memory smoke                                                | เมื่อมีการเปลี่ยนแปลงที่เกี่ยวข้องกับ Node |
| `checks`                         | ตัวตรวจยืนยันสำหรับ built-artifact channel tests พร้อมการรองรับ Node 22 แบบ push-only         | เมื่อมีการเปลี่ยนแปลงที่เกี่ยวข้องกับ Node |
| `check-docs`                     | ตรวจสอบรูปแบบ docs, lint และลิงก์เสีย                                                         | เมื่อ docs มีการเปลี่ยนแปลง              |
| `skills-python`                  | Ruff + pytest สำหรับ Skills ที่รองรับด้วย Python                                              | เมื่อมีการเปลี่ยนแปลงที่เกี่ยวข้องกับ Python skill |
| `checks-windows`                 | เลนทดสอบเฉพาะ Windows                                                                        | เมื่อมีการเปลี่ยนแปลงที่เกี่ยวข้องกับ Windows |
| `macos-node`                     | เลนทดสอบ TypeScript บน macOS โดยใช้ built artifacts ร่วมกัน                                   | เมื่อมีการเปลี่ยนแปลงที่เกี่ยวข้องกับ macOS |
| `macos-swift`                    | Swift lint, build และ tests สำหรับแอป macOS                                                   | เมื่อมีการเปลี่ยนแปลงที่เกี่ยวข้องกับ macOS |
| `android`                        | Android unit tests สำหรับทั้งสอง flavor พร้อมสร้าง debug APK หนึ่งชุด                        | เมื่อมีการเปลี่ยนแปลงที่เกี่ยวข้องกับ Android |

## ลำดับการล้มเหลวแบบรวดเร็ว

งานถูกจัดลำดับเพื่อให้การตรวจสอบที่มีต้นทุนต่ำล้มเหลวก่อนที่งานราคาแพงจะเริ่มทำงาน:

1. `preflight` จะตัดสินใจก่อนเลยว่ามีเลนใดบ้างที่ต้องมีอยู่จริง ตรรกะ `docs-scope` และ `changed-scope` เป็นขั้นตอนภายในงานนี้ ไม่ใช่งานแยก
2. `security-scm-fast`, `security-dependency-audit`, `security-fast`, `check`, `check-additional`, `check-docs` และ `skills-python` จะล้มเหลวได้อย่างรวดเร็วโดยไม่ต้องรอ artifact และ platform matrix jobs ที่หนักกว่า
3. `build-artifacts` จะทำงานทับซ้อนกับเลน Linux แบบเร็ว เพื่อให้ downstream consumers เริ่มได้ทันทีที่ shared build พร้อม
4. จากนั้นเลน platform และ runtime ที่หนักกว่าจะกระจายทำงานต่อ: `checks-fast-core`, `checks-fast-contracts-channels`, `checks-node-extensions`, `checks-node-core-test`, `extension-fast` ที่ใช้เฉพาะ PR, `checks`, `checks-windows`, `macos-node`, `macos-swift` และ `android`

ตรรกะการกำหนดขอบเขตอยู่ใน `scripts/ci-changed-scope.mjs` และมี unit tests ครอบคลุมใน `src/scripts/ci-changed-scope.test.ts`
การแก้ไข CI workflow จะตรวจสอบกราฟ Node CI พร้อม workflow linting แต่จะไม่บังคับให้รัน native builds ของ Windows, Android หรือ macOS เพียงเพราะมีการแก้ไข workflow เหล่านั้น เลนของแต่ละแพลตฟอร์มยังคงถูกกำหนดขอบเขตตามการเปลี่ยนแปลงของซอร์สโค้ดของแพลตฟอร์มนั้น
การตรวจสอบ Node บน Windows จะถูกกำหนดขอบเขตไปยัง process/path wrappers, npm/pnpm/UI runner helpers, package manager config และพื้นผิวของ CI workflow ที่รันเลนนั้นโดยเฉพาะ ส่วนการเปลี่ยนแปลงซอร์สโค้ดที่ไม่เกี่ยวข้อง, plugin, install-smoke และการเปลี่ยนแปลงเฉพาะฝั่งทดสอบ จะยังคงอยู่ในเลน Linux Node เพื่อไม่ให้ต้องจอง Windows worker แบบ 16-vCPU สำหรับความครอบคลุมที่ถูกทดสอบอยู่แล้วด้วย test shards ปกติ
เวิร์กโฟลว์ `install-smoke` ที่แยกต่างหากจะใช้ scope script เดียวกันผ่านงาน `preflight` ของตัวเอง โดยคำนวณ `run_install_smoke` จากสัญญาณ changed-smoke ที่แคบกว่า ดังนั้น Docker/install smoke จะทำงานเมื่อมีการเปลี่ยนแปลงด้าน install, packaging, ส่วนที่เกี่ยวข้องกับ container, bundled extension production changes และพื้นผิว core plugin/channel/gateway/Plugin SDK ที่งาน Docker smoke ใช้งานอยู่ การแก้ไขเฉพาะ tests และ docs จะไม่จอง Docker workers การทดสอบ QR package smoke ของมันจะบังคับให้ Docker `pnpm install` layer รันใหม่ ขณะเดียวกันก็ยังคงเก็บ BuildKit pnpm store cache ไว้ จึงยังทดสอบการติดตั้งได้โดยไม่ต้องดาวน์โหลด dependencies ใหม่ทุกครั้งที่รัน งาน gateway-network e2e ของมันจะใช้ runtime image ที่สร้างไว้ก่อนหน้าในงานเดียวกันซ้ำ ทำให้เพิ่มความครอบคลุม WebSocket แบบ container-to-container จริงโดยไม่ต้องเพิ่ม Docker build อีกชุด ในเครื่อง `test:docker:all` จะ prebuild shared live-test image หนึ่งชุดและ shared built-app image จาก `scripts/e2e/Dockerfile` อีกหนึ่งชุด จากนั้นจึงรันเลน live/E2E smoke แบบขนานด้วย `OPENCLAW_SKIP_DOCKER_BUILD=1`; ปรับ concurrency เริ่มต้นที่ 4 ได้ด้วย `OPENCLAW_DOCKER_ALL_PARALLELISM` local aggregate จะหยุดจัดคิวเลนใหม่ใน pool หลังพบความล้มเหลวครั้งแรกตามค่าเริ่มต้น และแต่ละเลนมีการ override timeout ไว้ที่ 120 นาที ซึ่งเปลี่ยนได้ด้วย `OPENCLAW_DOCKER_ALL_LANE_TIMEOUT_MS` เลนที่ไวต่อ startup หรือ provider จะรันแบบ exclusive หลังจาก parallel pool เสร็จ เวิร์กโฟลว์ live/E2E ที่นำกลับมาใช้ซ้ำได้ก็ใช้รูปแบบ shared-image เดียวกัน โดยสร้างและ push GHCR Docker E2E image ที่ติดแท็กด้วย SHA หนึ่งชุดก่อน Docker matrix แล้วจึงรัน matrix ด้วย `OPENCLAW_SKIP_DOCKER_BUILD=1` เวิร์กโฟลว์ live/E2E แบบตามเวลา จะรันชุด Docker suite เต็มของเส้นทางรีลีสทุกวัน การทดสอบ Docker ของ QR และ installer ยังคงใช้ Dockerfiles สำหรับการติดตั้งของตัวเอง งาน `docker-e2e-fast` ที่แยกต่างหากจะรัน bounded bundled-plugin Docker profile ภายใต้ command timeout 120 วินาที: setup-entry dependency repair พร้อม synthetic bundled-loader failure isolation ส่วน full bundled update/channel matrix ยังเป็น manual/full-suite เพราะต้องทำ real npm update และ doctor repair ซ้ำหลายรอบ

ตรรกะ changed-lane ในเครื่องอยู่ใน `scripts/changed-lanes.mjs` และถูกรันโดย `scripts/check-changed.mjs` local gate นี้เข้มงวดกว่าการกำหนดขอบเขตแพลตฟอร์มแบบกว้างของ CI ในแง่ของ architecture boundaries: การเปลี่ยนแปลง production ใน core จะรัน core prod typecheck พร้อม core tests, การเปลี่ยนแปลงเฉพาะ core tests จะรันเฉพาะ core test typecheck/tests, การเปลี่ยนแปลง production ใน extension จะรัน extension prod typecheck พร้อม extension tests และการเปลี่ยนแปลงเฉพาะ extension tests จะรันเฉพาะ extension test typecheck/tests การเปลี่ยนแปลง Public Plugin SDK หรือ plugin-contract จะขยายไปถึงการตรวจสอบ extension เพราะ extensions พึ่งพา core contracts เหล่านั้น การ bump เวอร์ชันที่เป็น release metadata-only จะรัน targeted version/config/root-dependency checks ส่วนการเปลี่ยนแปลง root/config ที่ไม่ทราบแน่ชัดจะ fail safe ไปทุกเลน

บนการ push, matrix ของ `checks` จะเพิ่มเลน `compat-node22` ที่ใช้เฉพาะการ push ส่วนบน pull requests เลนนี้จะถูกข้าม และ matrix จะยังคงโฟกัสที่เลน test/channel ปกติ

กลุ่ม Node test ที่ช้าที่สุดถูกแยกหรือถ่วงน้ำหนักใหม่เพื่อให้งานแต่ละตัวมีขนาดเล็กโดยไม่จอง runners มากเกินไป: channel contracts รันเป็นสาม shards แบบถ่วงน้ำหนัก, bundled plugin tests ถูกกระจายสมดุลไปยัง extension workers หกตัว, core unit lanes ขนาดเล็กถูกจับคู่กัน, auto-reply รันเป็นสาม workers แบบสมดุลแทนที่จะเป็นหก workers ขนาดเล็ก และ agentic gateway/plugin configs ถูกกระจายไปยัง source-only agentic Node jobs ที่มีอยู่แล้วแทนการรอ built artifacts กลุ่ม browser, QA, media และ miscellaneous plugin tests แบบกว้าง จะใช้ Vitest configs เฉพาะของตัวเองแทน shared plugin catch-all เลน agents แบบกว้างใช้ shared Vitest file-parallel scheduler เพราะถูกครอบงำโดย import/scheduling มากกว่าจะเป็น test file ช้าตัวเดียว `runtime-config` รันร่วมกับ infra core-runtime shard เพื่อไม่ให้ shared runtime shard กลายเป็นตัวถ่วงท้าย `check-additional` จะเก็บงาน package-boundary compile/canary ไว้ด้วยกัน และแยก runtime topology architecture ออกจาก gateway watch coverage; boundary guard shard จะรัน guards อิสระขนาดเล็กของมันพร้อมกันภายในงานเดียว Gateway watch, channel tests และ core support-boundary shard จะรันพร้อมกันภายใน `build-artifacts` หลังจากสร้าง `dist/` และ `dist-runtime/` แล้ว ทำให้ยังคงชื่อ check เดิมไว้เป็นงาน verifier น้ำหนักเบา ขณะเดียวกันก็เลี่ยงการใช้ Blacksmith workers เพิ่มอีกสองตัวและหลีกเลี่ยงคิว artifact-consumer รอบที่สอง
Android CI จะรันทั้ง `testPlayDebugUnitTest` และ `testThirdPartyDebugUnitTest` จากนั้นจึงสร้าง Play debug APK โดย third-party flavor ไม่มี source set หรือ manifest แยกต่างหาก แต่ unit-test lane ของมันยังคงคอมไพล์ flavor นั้นพร้อม BuildConfig flags สำหรับ SMS/call-log ขณะเดียวกันก็หลีกเลี่ยงงาน packaging debug APK ซ้ำในทุก push ที่เกี่ยวข้องกับ Android
`extension-fast` ใช้เฉพาะ PR เพราะการ push จะรัน full bundled plugin shards อยู่แล้ว แนวทางนี้ช่วยให้ได้ feedback สำหรับ changed-plugin ระหว่างการรีวิว โดยไม่ต้องจอง Blacksmith worker เพิ่มบน `main` สำหรับความครอบคลุมที่มีอยู่แล้วใน `checks-node-extensions`

GitHub อาจทำเครื่องหมายงานที่ถูกแทนที่แล้วเป็น `cancelled` เมื่อมีการ push ใหม่เข้ามาบน PR เดียวกันหรือบน ref `main` เดียวกัน ให้ถือว่านั่นเป็นเพียงสัญญาณรบกวนของ CI เว้นแต่ run ล่าสุดสำหรับ ref เดียวกันนั้นจะล้มเหลวด้วย Aggregate shard checks ใช้ `!cancelled() && always()` เพื่อให้ยังคงรายงาน shard failures ตามปกติ แต่จะไม่เข้าคิวหลังจากทั้ง workflow ถูกแทนที่ไปแล้ว
CI concurrency key ถูกกำหนดเวอร์ชันไว้ (`CI-v7-*`) เพื่อไม่ให้ zombie ฝั่ง GitHub ใน queue group เก่ามาบล็อก main runs ใหม่ได้ไม่สิ้นสุด

## Runners

| ตัวรัน                           | งาน                                                                                                                                                                                                                                                                                                                                                                                                                                                                     |
| -------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `ubuntu-24.04`                   | `preflight`, งาน security แบบเร็วและงานรวม (`security-scm-fast`, `security-dependency-audit`, `security-fast`), การตรวจสอบ protocol/contract/bundled แบบเร็ว, การตรวจสอบ channel contract แบบแยก shard, shards ของ `check` ยกเว้น lint, shards และงานรวมของ `check-additional`, ตัวตรวจยืนยันรวมของ Node tests, การตรวจสอบ docs, Python Skills, workflow-sanity, labeler, auto-response; preflight ของ install-smoke ก็ใช้ Ubuntu ที่โฮสต์โดย GitHub เช่นกัน เพื่อให้ Blacksmith matrix เข้าคิวได้เร็วขึ้น |
| `blacksmith-8vcpu-ubuntu-2404`   | `build-artifacts`, build-smoke, Linux Node test shards, bundled plugin test shards, `android`                                                                                                                                                                                                                                                                                                                                                                            |
| `blacksmith-16vcpu-ubuntu-2404`  | `check-lint` ซึ่งยังไวต่อ CPU มากพอที่ 8 vCPU จะมีต้นทุนมากกว่าประโยชน์ที่ได้; install-smoke Docker builds ซึ่ง queue time ของ 32 vCPU มีต้นทุนมากกว่าประโยชน์ที่ได้                                                                                                                                                                                                                                                                                               |
| `blacksmith-16vcpu-windows-2025` | `checks-windows`                                                                                                                                                                                                                                                                                                                                                                                                                                                         |
| `blacksmith-6vcpu-macos-latest`  | `macos-node` บน `openclaw/openclaw`; fork จะ fallback ไปใช้ `macos-latest`                                                                                                                                                                                                                                                                                                                                                                                              |
| `blacksmith-12vcpu-macos-latest` | `macos-swift` บน `openclaw/openclaw`; fork จะ fallback ไปใช้ `macos-latest`                                                                                                                                                                                                                                                                                                                                                                                             |

## คำสั่งในเครื่องที่เทียบเท่ากัน

```bash
pnpm changed:lanes   # ตรวจสอบตัวจัดประเภท changed-lane ในเครื่องสำหรับ origin/main...HEAD
pnpm check:changed   # local gate แบบอัจฉริยะ: typecheck/lint/tests ที่เปลี่ยนตาม boundary lane
pnpm check          # local gate แบบเร็ว: production tsgo + lint แบบแยก shard + fast guards แบบขนาน
pnpm check:test-types
pnpm check:timed    # gate เดียวกันพร้อมเวลาในแต่ละสเตจ
pnpm build:strict-smoke
pnpm check:architecture
pnpm test:gateway:watch-regression
pnpm test           # การทดสอบ vitest
pnpm test:channels
pnpm test:contracts:channels
pnpm check:docs     # รูปแบบ docs + lint + ตรวจลิงก์เสีย
pnpm build          # สร้าง dist เมื่อเลน artifact/build-smoke ของ CI มีความเกี่ยวข้อง
node scripts/ci-run-timings.mjs <run-id>      # สรุปเวลารวม เวลารอคิว และงานที่ช้าที่สุด
node scripts/ci-run-timings.mjs --recent 10   # เปรียบเทียบ main CI runs ที่สำเร็จล่าสุด
```
