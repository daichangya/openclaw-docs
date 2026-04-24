---
read_when:
    - คุณต้องเข้าใจว่าเหตุใดงาน CI จึงรันหรือไม่รัน
    - คุณกำลังแก้ปัญหา GitHub Actions checks ที่ล้มเหลว
summary: กราฟงาน CI, เกตตามขอบเขต และคำสั่งเทียบเท่าสำหรับรันในเครื่อง
title: ไปป์ไลน์ CI
x-i18n:
    generated_at: "2026-04-24T09:01:14Z"
    model: gpt-5.4
    provider: openai
    source_hash: 489ac05725a316b25f56f7f754d6a8652abbd60481fbe6e692572b81581fe405
    source_path: ci.md
    workflow: 15
---

CI จะรันในทุกการ push ไปที่ `main` และทุก pull request โดยใช้การกำหนดขอบเขตอัจฉริยะเพื่อข้ามงานที่มีค่าใช้จ่ายสูงเมื่อมีการเปลี่ยนแปลงเฉพาะส่วนที่ไม่เกี่ยวข้อง

QA Lab มี lane ใน CI เฉพาะของตัวเองแยกจาก workflow หลักที่ใช้การกำหนดขอบเขตอัจฉริยะ
workflow `Parity gate` จะรันเมื่อมีการเปลี่ยนแปลงใน PR ที่ตรงเงื่อนไขและเมื่อสั่ง manual dispatch; โดยจะ
build รันไทม์ QA ส่วนตัวและเปรียบเทียบ agentic pack จำลองของ GPT-5.4 และ Opus 4.6
workflow `QA-Lab - All Lanes` จะรันทุกคืนบน `main` และเมื่อสั่ง
manual dispatch; โดยจะแตกออกเป็น mock parity gate, live Matrix lane และ live
Telegram lane เป็นงานขนานกัน งานแบบ live ใช้ environment `qa-live-shared`
และ Telegram lane ใช้ Convex lease ส่วน `OpenClaw Release
Checks` ก็รัน QA Lab lane ชุดเดียวกันนี้ก่อนอนุมัติ release ด้วย

workflow `Duplicate PRs After Merge` เป็น workflow สำหรับผู้ดูแลแบบ manual
ใช้สำหรับล้าง PR ซ้ำหลังการ merge โดยตั้งต้นเป็น dry-run และจะปิดเฉพาะ PR ที่ระบุ
ไว้อย่างชัดเจนเมื่อ `apply=true` ก่อนแก้ไขสถานะใน GitHub
workflow จะตรวจสอบก่อนว่า PR ที่ land แล้วถูก merge แล้วจริง และ PR ซ้ำแต่ละรายการมีทั้ง issue อ้างอิงร่วมกัน
หรือมี hunk ที่เปลี่ยนแปลงทับซ้อนกัน

workflow `Docs Agent` เป็น lane ดูแลรักษา Codex แบบขับเคลื่อนด้วยเหตุการณ์ สำหรับให้
เอกสารที่มีอยู่สอดคล้องกับการเปลี่ยนแปลงที่เพิ่ง land ไป ไม่มีตารางเวลาแบบล้วน:
การรัน CI ที่สำเร็จจาก non-bot push บน `main` สามารถทริกเกอร์มันได้ และ
manual dispatch ก็สามารถรันมันได้โดยตรง การเรียกแบบ workflow-run จะข้ามเมื่อ
`main` เปลี่ยนไปแล้ว หรือเมื่อมีการสร้าง Docs Agent run แบบ non-skipped อื่นขึ้นในชั่วโมงที่ผ่านมา
เมื่อมันรัน มันจะตรวจสอบช่วง commit ตั้งแต่ source SHA ของ Docs Agent แบบ non-skipped ครั้งก่อน
จนถึง `main` ปัจจุบัน ดังนั้นการรันหนึ่งครั้งต่อชั่วโมงสามารถครอบคลุมการเปลี่ยนแปลงทั้งหมดบน main
ที่สะสมมาตั้งแต่รอบ docs ครั้งก่อน

workflow `Test Performance Agent` เป็น lane ดูแลรักษา Codex แบบขับเคลื่อนด้วยเหตุการณ์
สำหรับทดสอบที่ช้า มันไม่มีตารางเวลาแบบล้วน: การรัน CI ที่สำเร็จจาก non-bot push บน
`main` สามารถทริกเกอร์มันได้ แต่จะข้ามหากมีการเรียกแบบ workflow-run อื่น
รันไปแล้วหรือกำลังรันอยู่ในวัน UTC นั้น Manual dispatch จะข้าม daily activity
gate นี้ lane นี้จะ build รายงานประสิทธิภาพ Vitest แบบ grouped ของทั้งชุดทดสอบ ให้ Codex
ทำได้เฉพาะการแก้ไขประสิทธิภาพการทดสอบขนาดเล็กที่ยังคง coverage แทนการ refactor กว้าง ๆ
จากนั้นจะรันรายงานทั้งชุดอีกครั้ง และปฏิเสธการเปลี่ยนแปลงที่ทำให้จำนวน baseline test
ที่ผ่านลดลง หาก baseline มี test ที่ล้มเหลว Codex อาจแก้ได้เฉพาะ failure ที่ชัดเจนเท่านั้น
และรายงานทั้งชุดหลังเอเจนต์ต้องผ่านก่อนจึงจะ commit อะไรได้ เมื่อ `main`
ขยับไปก่อนที่ bot push จะ land lane นี้จะ rebase patch ที่ผ่านการตรวจสอบแล้ว
รัน `pnpm check:changed` ใหม่ และลอง push อีกครั้ง; patch เก่าที่ขัดแย้งกันจะถูกข้าม
มันใช้ GitHub-hosted Ubuntu เพื่อให้แอ็กชัน Codex
คงแนวทางความปลอดภัยแบบ drop-sudo เดียวกับ docs agent ได้

```bash
gh workflow run duplicate-after-merge.yml \
  -f landed_pr=70532 \
  -f duplicate_prs='70530,70592' \
  -f apply=true
```

## ภาพรวมงาน

| งาน                              | วัตถุประสงค์                                                                                 | รันเมื่อใด                           |
| -------------------------------- | -------------------------------------------------------------------------------------------- | ------------------------------------ |
| `preflight`                      | ตรวจหาการเปลี่ยนแปลงเฉพาะ docs, ขอบเขตที่เปลี่ยน, extension ที่เปลี่ยน และ build CI manifest | เสมอบน push และ PR ที่ไม่ใช่ draft   |
| `security-scm-fast`              | ตรวจจับ private key และตรวจสอบ workflow ผ่าน `zizmor`                                       | เสมอบน push และ PR ที่ไม่ใช่ draft   |
| `security-dependency-audit`      | ตรวจสอบ lockfile สำหรับ production ที่ไม่พึ่ง dependency กับ npm advisories                  | เสมอบน push และ PR ที่ไม่ใช่ draft   |
| `security-fast`                  | ตัวรวมที่จำเป็นสำหรับงาน security แบบเร็ว                                                   | เสมอบน push และ PR ที่ไม่ใช่ draft   |
| `build-artifacts`                | build `dist/`, Control UI, ตรวจ built-artifact และ artifact สำหรับ downstream ที่ใช้ซ้ำได้ | การเปลี่ยนแปลงที่เกี่ยวข้องกับ Node  |
| `checks-fast-core`               | lane ตรวจความถูกต้องบน Linux แบบเร็ว เช่น bundled/plugin-contract/protocol checks          | การเปลี่ยนแปลงที่เกี่ยวข้องกับ Node  |
| `checks-fast-contracts-channels` | sharded channel contract checks พร้อมผลตรวจรวมที่เสถียร                                     | การเปลี่ยนแปลงที่เกี่ยวข้องกับ Node  |
| `checks-node-extensions`         | shard ทดสอบ Plugin ที่มาพร้อมระบบแบบเต็มทั้งชุด extension                                   | การเปลี่ยนแปลงที่เกี่ยวข้องกับ Node  |
| `checks-node-core-test`          | shard ทดสอบ Node core โดยไม่รวม lane ของ channel, bundled, contract และ extension          | การเปลี่ยนแปลงที่เกี่ยวข้องกับ Node  |
| `extension-fast`                 | ทดสอบแบบเจาะจงเฉพาะ bundled plugin ที่เปลี่ยน                                              | Pull request ที่มีการเปลี่ยน extension |
| `check`                          | ตัวเทียบเท่า local gate หลักแบบ sharded: prod types, lint, guards, test types และ strict smoke | การเปลี่ยนแปลงที่เกี่ยวข้องกับ Node  |
| `check-additional`               | การ์ดด้านสถาปัตยกรรม, boundary, extension-surface, package-boundary และ gateway-watch shards | การเปลี่ยนแปลงที่เกี่ยวข้องกับ Node  |
| `build-smoke`                    | smoke test ของ built-CLI และ startup-memory smoke                                           | การเปลี่ยนแปลงที่เกี่ยวข้องกับ Node  |
| `checks`                         | ตัวตรวจสอบสำหรับ built-artifact channel tests พร้อม Node 22 compatibility สำหรับ push เท่านั้น | การเปลี่ยนแปลงที่เกี่ยวข้องกับ Node  |
| `check-docs`                     | ตรวจการจัดรูปแบบ docs, lint และ broken-link checks                                          | เมื่อ docs เปลี่ยน                    |
| `skills-python`                  | Ruff + pytest สำหรับ Skills ที่รองรับด้วย Python                                            | การเปลี่ยนแปลงที่เกี่ยวข้องกับ Python skill |
| `checks-windows`                 | lane ทดสอบเฉพาะ Windows                                                                     | การเปลี่ยนแปลงที่เกี่ยวข้องกับ Windows |
| `macos-node`                     | lane ทดสอบ TypeScript บน macOS โดยใช้ built artifacts ที่ใช้ร่วมกัน                        | การเปลี่ยนแปลงที่เกี่ยวข้องกับ macOS |
| `macos-swift`                    | lint, build และทดสอบ Swift สำหรับแอป macOS                                                  | การเปลี่ยนแปลงที่เกี่ยวข้องกับ macOS |
| `android`                        | Android unit tests สำหรับทั้งสอง flavor พร้อม build debug APK หนึ่งรายการ                  | การเปลี่ยนแปลงที่เกี่ยวข้องกับ Android |
| `test-performance-agent`         | Codex ปรับแต่ง slow-test รายวันหลังจากกิจกรรมที่เชื่อถือได้                                 | เมื่อ Main CI สำเร็จหรือ manual dispatch |

## ลำดับ Fail-Fast

งานถูกจัดลำดับเพื่อให้งานตรวจสอบราคาถูกล้มเหลวก่อนที่งานราคาแพงจะเริ่มรัน:

1. `preflight` ตัดสินว่าควรมี lane ใดบ้าง logic `docs-scope` และ `changed-scope` เป็น step ภายในงานนี้ ไม่ใช่งานแยก
2. `security-scm-fast`, `security-dependency-audit`, `security-fast`, `check`, `check-additional`, `check-docs` และ `skills-python` ล้มเหลวได้เร็วโดยไม่ต้องรอ artifact และ platform matrix ที่หนักกว่า
3. `build-artifacts` รันทับซ้อนกับ lane Linux แบบเร็ว เพื่อให้ consumer ที่พึ่งพาต่อสามารถเริ่มได้ทันทีเมื่อ shared build พร้อม
4. จากนั้น lane ที่หนักกว่าด้าน platform และ runtime จะกระจายออก: `checks-fast-core`, `checks-fast-contracts-channels`, `checks-node-extensions`, `checks-node-core-test`, `extension-fast` ที่มีเฉพาะ PR, `checks`, `checks-windows`, `macos-node`, `macos-swift` และ `android`

logic การกำหนดขอบเขตอยู่ใน `scripts/ci-changed-scope.mjs` และมี unit test ครอบคลุมใน `src/scripts/ci-changed-scope.test.ts`
การแก้ไข workflow ของ CI จะตรวจสอบกราฟ Node CI พร้อม workflow linting แต่จะไม่บังคับให้ build native ของ Windows, Android หรือ macOS ด้วยตัวมันเอง; lane ของ platform เหล่านั้นยังคงถูกกำหนดขอบเขตตามการเปลี่ยนแปลงของซอร์สเฉพาะ platform
การตรวจ Node บน Windows ถูกกำหนดขอบเขตไปยัง wrapper ของ process/path เฉพาะ Windows, ตัวช่วย npm/pnpm/UI runner, คอนฟิก package manager และพื้นผิว workflow CI ที่รัน lane นั้น; การเปลี่ยนแปลงซอร์ส, Plugin, install-smoke และ test-only ที่ไม่เกี่ยวข้องจะยังอยู่ใน Linux Node lane เพื่อไม่ให้ไปจอง worker Windows 16-vCPU สำหรับ coverage ที่ได้ตรวจไปแล้วใน shard ทดสอบปกติ
workflow `install-smoke` แยกต่างหากใช้ scope script เดียวกันซ้ำผ่านงาน `preflight` ของตัวเอง มันแยก smoke coverage เป็น `run_fast_install_smoke` และ `run_full_install_smoke` Pull request จะรันเส้นทางเร็วสำหรับพื้นผิว Docker/package, การเปลี่ยนแปลงแพ็กเกจ/manifest ของ bundled plugin และพื้นผิว core plugin/channel/gateway/Plugin SDK ที่ Docker smoke jobs ใช้ การเปลี่ยนแปลง bundled plugin แบบ source-only, การแก้ไขเฉพาะ test และการเปลี่ยนแปลง docs-only จะไม่ไปจอง Docker worker เส้นทางเร็วจะ build image จาก root Dockerfile หนึ่งครั้ง, ตรวจสอบ CLI, รัน container gateway-network e2e, ตรวจสอบ bundled extension build arg และรัน bounded bundled-plugin Docker profile ภายใต้ command timeout 120 วินาที เส้นทางเต็มยังคงครอบคลุม QR package install และ installer Docker/update สำหรับ nightly scheduled runs, manual dispatches, workflow-call release checks และ pull request ที่แตะพื้นผิว installer/package/Docker จริง ๆ การ push ไปที่ `main` รวมถึง merge commit จะไม่บังคับใช้เส้นทางเต็ม; เมื่อ logic changed-scope ขอ full coverage บน push workflow จะยังคงรัน fast Docker smoke และปล่อย full install smoke ไว้ให้ nightly หรือ release validation ส่วน smoke แบบ Bun global install image-provider ที่ช้าถูกคุมด้วยเกตแยก `run_bun_global_install_smoke`; มันจะรันใน nightly schedule และจาก workflow release checks และ manual `install-smoke` dispatch สามารถเลือกเปิดได้ แต่ pull request และ `main` push จะไม่รัน การทดสอบ QR และ installer Docker ยังคงใช้ Dockerfile ที่เน้น install ของตนเอง ภายในเครื่อง `test:docker:all` จะ prebuild image ที่ใช้ร่วมกันหนึ่งชุดสำหรับ live-test และ built-app image จาก `scripts/e2e/Dockerfile` อีกหนึ่งชุด จากนั้นรัน live/E2E smoke lanes แบบขนานโดยมี `OPENCLAW_SKIP_DOCKER_BUILD=1`; ปรับ concurrency ของ main pool ค่าปริยาย 8 ด้วย `OPENCLAW_DOCKER_ALL_PARALLELISM` และ concurrency ของ tail pool ที่ไวต่อ provider ค่าปริยาย 8 ด้วย `OPENCLAW_DOCKER_ALL_TAIL_PARALLELISM` การเริ่ม lane จะถูกหน่วงทีละ 2 วินาทีเป็นค่าปริยายเพื่อหลีกเลี่ยง create storm ของ Docker daemon ในเครื่อง; override ได้ด้วย `OPENCLAW_DOCKER_ALL_START_STAGGER_MS=0` หรือค่าอื่นเป็นมิลลิวินาที ตัวรวมในเครื่องจะหยุดจัดคิว lane ใหม่หลัง failure แรกเป็นค่าปริยาย และแต่ละ lane มี timeout 120 นาทีซึ่ง override ได้ด้วย `OPENCLAW_DOCKER_ALL_LANE_TIMEOUT_MS` workflow live/E2E แบบใช้ซ้ำได้สะท้อนรูปแบบ shared-image เดียวกันโดย build และ push Docker E2E image แบบติดแท็ก SHA ไปยัง GHCR หนึ่งครั้งก่อน Docker matrix แล้วรัน matrix โดยมี `OPENCLAW_SKIP_DOCKER_BUILD=1` workflow live/E2E แบบ scheduled จะรัน Docker suite เส้นทาง release แบบเต็มทุกวัน ส่วน bundled update/channel matrix เต็มรูปแบบยังคงเป็นแบบ manual/full-suite เพราะมีการรัน npm update จริงและ doctor repair ซ้ำหลายรอบ

logic changed-lane ในเครื่องอยู่ใน `scripts/changed-lanes.mjs` และถูกเรียกใช้โดย `scripts/check-changed.mjs` local gate นี้เข้มงวดกว่า CI platform scope แบบกว้าง: การเปลี่ยนแปลง production ของ core จะรัน core prod typecheck พร้อม core tests, การเปลี่ยนแปลงเฉพาะ core test จะรันเฉพาะ core test typecheck/tests, การเปลี่ยนแปลง production ของ extension จะรัน extension prod typecheck พร้อม extension tests และการเปลี่ยนแปลงเฉพาะ extension test จะรันเฉพาะ extension test typecheck/tests การเปลี่ยนแปลง public Plugin SDK หรือ plugin-contract จะขยายไปยังการตรวจ extension เพราะ extension พึ่งพา contract หลักเหล่านั้น การ bump เวอร์ชันแบบ metadata-only สำหรับ release จะรัน targeted version/config/root-dependency checks ส่วนการเปลี่ยนแปลง root/config ที่ไม่รู้จักจะ fail safe ไปทุก lane

บน push, matrix ของ `checks` จะเพิ่ม lane `compat-node22` ที่มีเฉพาะ push เท่านั้น บน pull request lane นี้จะถูกข้าม และ matrix จะโฟกัสที่ lane ทดสอบ/ช่องทางตามปกติเท่านั้น

ตระกูลการทดสอบ Node ที่ช้าที่สุดถูกแยกหรือปรับสมดุล เพื่อให้งานแต่ละงานยังคงมีขนาดเล็กโดยไม่จอง runner เกินจำเป็น: channel contracts รันเป็น 3 shard แบบถ่วงน้ำหนัก, การทดสอบ bundled plugin กระจายสมดุลไปยัง 6 worker สำหรับ extension, lane unit ของ core ขนาดเล็กถูกรวมเป็นคู่, auto-reply รันด้วย 3 worker แบบสมดุลแทน 6 worker เล็ก ๆ และการตั้งค่า agentic gateway/plugin ถูกกระจายไปยังงาน Node แบบ agentic ที่เป็น source-only ที่มีอยู่แล้ว แทนที่จะรอ built artifacts การทดสอบ browser, QA, media และ plugin เบ็ดเตล็ดในวงกว้างใช้คอนฟิก Vitest เฉพาะของตัวเอง แทนที่จะใช้ plugin catch-all ที่ใช้ร่วมกัน งาน shard ของ extension จะรันกลุ่มคอนฟิก Plugin แบบอนุกรมด้วย Vitest worker เพียงหนึ่งตัวและ Node heap ที่ใหญ่ขึ้น เพื่อไม่ให้ batch Plugin ที่ import หนักใช้ทรัพยากร runner CI ขนาดเล็กเกินตัว lane agents แบบกว้างใช้ scheduler แบบ file-parallel ของ Vitest ที่ใช้ร่วมกัน เพราะถูกครอบงำด้วย import/การจัดตาราง มากกว่าจะมีไฟล์ทดสอบช้าไฟล์เดียวเป็นเจ้าของ `runtime-config` รันร่วมกับ shard `infra core-runtime` เพื่อไม่ให้ shard runtime ที่ใช้ร่วมกันเป็นเจ้าของส่วนหาง `check-additional` จะคงงาน package-boundary compile/canary ไว้ด้วยกัน และแยกสถาปัตยกรรม topology ของ runtime ออกจาก coverage ของ gateway watch; shard สำหรับ boundary guard จะรัน guard ขนาดเล็กที่เป็นอิสระพร้อมกันภายในงานเดียว Gateway watch, channel tests และ shard `core support-boundary` จะรันพร้อมกันภายใน `build-artifacts` หลังจาก build `dist/` และ `dist-runtime/` แล้ว ทำให้ยังคงชื่อ check เดิมไว้เป็นงาน verifier แบบเบา ขณะเดียวกันก็หลีกเลี่ยง worker Blacksmith เพิ่มอีก 2 ตัวและคิว consumer ของ artifact รอบที่สอง

Android CI รันทั้ง `testPlayDebugUnitTest` และ `testThirdPartyDebugUnitTest` จากนั้น build Play debug APK flavor แบบ third-party ไม่มี source set หรือ manifest แยกต่างหาก; lane unit-test ของมันยังคง compile flavor นั้นพร้อมแฟล็ก BuildConfig สำหรับ SMS/call-log ขณะเดียวกันก็หลีกเลี่ยงงาน packaging debug APK ซ้ำในทุก push ที่เกี่ยวข้องกับ Android
`extension-fast` มีเฉพาะ PR เพราะการรันบน push ได้รัน shard ของ bundled plugin แบบเต็มอยู่แล้ว วิธีนี้ทำให้มี feedback สำหรับ Plugin ที่เปลี่ยนระหว่างการรีวิว โดยไม่ต้องจอง worker Blacksmith เพิ่มบน `main` สำหรับ coverage ที่มีอยู่แล้วใน `checks-node-extensions`

GitHub อาจทำเครื่องหมายงานที่ถูกแทนที่แล้วเป็น `cancelled` เมื่อมี push ใหม่กว่ามาลงบน PR เดิมหรือ ref `main` เดิม ให้ถือว่านี่เป็น noise ของ CI เว้นแต่ว่าการรันล่าสุดสำหรับ ref เดียวกันนั้นจะล้มเหลวด้วย aggregate shard checks ใช้ `!cancelled() && always()` เพื่อให้ยังรายงาน failure ของ shard ตามปกติได้ แต่จะไม่เข้าคิวหลังจากทั้ง workflow ถูกแทนที่ไปแล้ว
คีย์ concurrency ของ CI มีการใส่เวอร์ชัน (`CI-v7-*`) เพื่อไม่ให้ zombie ฝั่ง GitHub ใน queue group เก่ามาบล็อกการรันบน main ที่ใหม่กว่าได้ไม่สิ้นสุด

## Runner

| Runner                           | งาน                                                                                                                                                                                                                                                                                                                                                                                                                                                                      |
| -------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `ubuntu-24.04`                   | `preflight`, งาน security แบบเร็วและตัวรวม (`security-scm-fast`, `security-dependency-audit`, `security-fast`), checks แบบเร็วสำหรับ protocol/contract/bundled, sharded channel contract checks, shard ของ `check` ยกเว้น lint, shard และตัวรวมของ `check-additional`, verifier แบบ aggregate สำหรับ Node test, docs checks, Python Skills, workflow-sanity, labeler, auto-response; preflight ของ install-smoke ก็ใช้ GitHub-hosted Ubuntu เช่นกัน เพื่อให้ Blacksmith matrix เข้าคิวได้เร็วขึ้น |
| `blacksmith-8vcpu-ubuntu-2404`   | `build-artifacts`, build-smoke, shard ทดสอบ Linux Node, shard ทดสอบ bundled plugin, `android`                                                                                                                                                                                                                                                                                                                                                                           |
| `blacksmith-16vcpu-ubuntu-2404`  | `check-lint` ซึ่งยังคงไวต่อ CPU มากพอจน 8 vCPU มีต้นทุนมากกว่าที่ช่วยได้; Docker build ของ install-smoke ซึ่งเวลาเข้าคิวของ 32-vCPU มีต้นทุนมากกว่าที่ช่วยได้                                                                                                                                                                                                                                                                                                  |
| `blacksmith-16vcpu-windows-2025` | `checks-windows`                                                                                                                                                                                                                                                                                                                                                                                                                                                          |
| `blacksmith-6vcpu-macos-latest`  | `macos-node` บน `openclaw/openclaw`; fork จะ fallback ไปใช้ `macos-latest`                                                                                                                                                                                                                                                                                                                                                                                              |
| `blacksmith-12vcpu-macos-latest` | `macos-swift` บน `openclaw/openclaw`; fork จะ fallback ไปใช้ `macos-latest`                                                                                                                                                                                                                                                                                                                                                                                             |

## คำสั่งเทียบเท่าสำหรับรันในเครื่อง

```bash
pnpm changed:lanes   # ตรวจดูตัวจัดประเภท changed-lane ในเครื่องสำหรับ origin/main...HEAD
pnpm check:changed   # local gate อัจฉริยะ: typecheck/lint/tests ตาม lane ของ boundary ที่เปลี่ยน
pnpm check          # local gate แบบเร็ว: production tsgo + sharded lint + fast guards แบบขนาน
pnpm check:test-types
pnpm check:timed    # gate เดียวกันพร้อมเวลาแต่ละสเตจ
pnpm build:strict-smoke
pnpm check:architecture
pnpm test:gateway:watch-regression
pnpm test           # ทดสอบ vitest
pnpm test:channels
pnpm test:contracts:channels
pnpm check:docs     # format + lint + broken links ของ docs
pnpm build          # build dist เมื่อ lane ของ artifact/build-smoke ใน CI มีความสำคัญ
node scripts/ci-run-timings.mjs <run-id>      # สรุป wall time, queue time และงานที่ช้าที่สุด
node scripts/ci-run-timings.mjs --recent 10   # เปรียบเทียบการรัน main CI ที่สำเร็จล่าสุด
pnpm test:perf:groups --full-suite --allow-failures --output .artifacts/test-perf/baseline-before.json
pnpm test:perf:groups:compare .artifacts/test-perf/baseline-before.json .artifacts/test-perf/after-agent.json
```

## ที่เกี่ยวข้อง

- [ภาพรวมการติดตั้ง](/th/install)
- [ช่องทาง release](/th/install/development-channels)
