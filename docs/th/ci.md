---
read_when:
    - คุณต้องเข้าใจว่าทำไมงาน CI จึงรันหรือไม่รัน
    - คุณกำลังดีบักการตรวจสอบ GitHub Actions ที่ล้มเหลว
summary: กราฟงาน CI, เกตขอบเขตการเปลี่ยนแปลง และคำสั่งในเครื่องที่เทียบเท่ากัน
title: ไปป์ไลน์ CI
x-i18n:
    generated_at: "2026-04-23T05:28:50Z"
    model: gpt-5.4
    provider: openai
    source_hash: 5c89c66204b203a39435cfc19de7b437867f2792bbfa2c3948371abde9f80e11
    source_path: ci.md
    workflow: 15
---

# ไปป์ไลน์ CI

CI จะรันในทุกการ push ไปยัง `main` และทุก pull request โดยใช้การกำหนดขอบเขตอัจฉริยะเพื่อข้ามงานที่มีค่าใช้จ่ายสูงเมื่อมีการเปลี่ยนแปลงเฉพาะส่วนที่ไม่เกี่ยวข้อง

QA Lab มี lane ของ CI โดยเฉพาะแยกจากเวิร์กโฟลว์หลักที่กำหนดขอบเขตแบบอัจฉริยะ เวิร์กโฟลว์
`Parity gate` จะรันบนการเปลี่ยนแปลง PR ที่ตรงเงื่อนไขและการสั่งรันด้วยตนเอง โดยจะ
build runtime QA ส่วนตัวและเปรียบเทียบแพ็ก agentic จำลองของ GPT-5.4 และ Opus 4.6
เวิร์กโฟลว์ `QA-Lab - All Lanes` จะรันทุกคืนบน `main` และเมื่อสั่งรันด้วยตนเอง โดยจะ
แตกงานออกเป็น mock parity gate, live Matrix lane และ live Telegram lane แบบขนาน
งานแบบ live ใช้ environment `qa-live-shared` และ Telegram lane ใช้ Convex lease
`OpenClaw Release Checks` ยังรัน lane ของ QA Lab ชุดเดียวกันก่อนอนุมัติ release

## ภาพรวมของงาน

| งาน                              | วัตถุประสงค์                                                                                  | รันเมื่อใด                           |
| -------------------------------- | --------------------------------------------------------------------------------------------- | ------------------------------------ |
| `preflight`                      | ตรวจหาการเปลี่ยนแปลงเฉพาะ docs, ขอบเขตที่เปลี่ยน, extensions ที่เปลี่ยน, และ build CI manifest | เสมอบน push และ PR ที่ไม่ใช่ draft   |
| `security-scm-fast`              | ตรวจจับ private key และ audit workflow ผ่าน `zizmor`                                         | เสมอบน push และ PR ที่ไม่ใช่ draft   |
| `security-dependency-audit`      | audit lockfile สำหรับ production ที่ไม่ต้องใช้ dependency เทียบกับ advisory ของ npm         | เสมอบน push และ PR ที่ไม่ใช่ draft   |
| `security-fast`                  | ตัวรวมที่จำเป็นสำหรับงาน security แบบเร็ว                                                   | เสมอบน push และ PR ที่ไม่ใช่ draft   |
| `build-artifacts`                | build `dist/`, Control UI, การตรวจสอบ built artifact และ artifact ใช้ซ้ำสำหรับงานปลายทาง     | เมื่อมีการเปลี่ยนแปลงที่เกี่ยวข้องกับ Node |
| `checks-fast-core`               | lane ความถูกต้องแบบเร็วบน Linux เช่น bundled/plugin-contract/protocol checks                | เมื่อมีการเปลี่ยนแปลงที่เกี่ยวข้องกับ Node |
| `checks-fast-contracts-channels` | ตรวจสอบ channel contract แบบแบ่ง shard พร้อมผล aggregate check ที่คงที่                     | เมื่อมีการเปลี่ยนแปลงที่เกี่ยวข้องกับ Node |
| `checks-node-extensions`         | shard การทดสอบ bundled plugin แบบเต็มทั้งชุด extension                                      | เมื่อมีการเปลี่ยนแปลงที่เกี่ยวข้องกับ Node |
| `checks-node-core-test`          | shard การทดสอบ core Node โดยไม่รวม lane ของ channel, bundled, contract และ extension       | เมื่อมีการเปลี่ยนแปลงที่เกี่ยวข้องกับ Node |
| `extension-fast`                 | การทดสอบแบบเจาะจงสำหรับเฉพาะ bundled plugin ที่เปลี่ยน                                      | Pull request ที่มีการเปลี่ยนแปลง extension |
| `check`                          | ตัวเทียบเท่า local gate หลักแบบแบ่ง shard: prod types, lint, guards, test types และ strict smoke | เมื่อมีการเปลี่ยนแปลงที่เกี่ยวข้องกับ Node |
| `check-additional`               | สถาปัตยกรรม, boundary, guards ของ extension surface, package-boundary และ shard ของ gateway-watch | เมื่อมีการเปลี่ยนแปลงที่เกี่ยวข้องกับ Node |
| `build-smoke`                    | การทดสอบ smoke ของ built CLI และ smoke ด้านหน่วยความจำขณะเริ่มต้น                          | เมื่อมีการเปลี่ยนแปลงที่เกี่ยวข้องกับ Node |
| `checks`                         | ตัวตรวจสอบสำหรับ channel test ของ built artifact พร้อม compatibility ของ Node 22 แบบ push-only | เมื่อมีการเปลี่ยนแปลงที่เกี่ยวข้องกับ Node |
| `check-docs`                     | ตรวจรูปแบบเอกสาร lint และลิงก์เสีย                                                           | เมื่อ docs เปลี่ยน                   |
| `skills-python`                  | Ruff + pytest สำหรับ Skills ที่ใช้ Python                                                    | เมื่อมีการเปลี่ยนแปลงที่เกี่ยวข้องกับ Python skill |
| `checks-windows`                 | lane การทดสอบเฉพาะ Windows                                                                   | เมื่อมีการเปลี่ยนแปลงที่เกี่ยวข้องกับ Windows |
| `macos-node`                     | lane ทดสอบ TypeScript บน macOS โดยใช้ built artifact ที่ใช้ร่วมกัน                          | เมื่อมีการเปลี่ยนแปลงที่เกี่ยวข้องกับ macOS |
| `macos-swift`                    | Swift lint, build และทดสอบสำหรับแอป macOS                                                    | เมื่อมีการเปลี่ยนแปลงที่เกี่ยวข้องกับ macOS |
| `android`                        | Android unit tests สำหรับทั้งสอง flavor พร้อม build debug APK หนึ่งชุด                      | เมื่อมีการเปลี่ยนแปลงที่เกี่ยวข้องกับ Android |

## ลำดับการ fail-fast

งานต่าง ๆ ถูกจัดลำดับเพื่อให้การตรวจสอบที่ต้นทุนต่ำล้มเหลวก่อนที่งานราคาแพงจะเริ่มรัน:

1. `preflight` จะตัดสินใจว่า lane ใดควรมีอยู่ตั้งแต่แรก โดยตรรกะ `docs-scope` และ `changed-scope` เป็น step ภายในงานนี้ ไม่ใช่งานแยก
2. `security-scm-fast`, `security-dependency-audit`, `security-fast`, `check`, `check-additional`, `check-docs` และ `skills-python` จะล้มเหลวได้อย่างรวดเร็วโดยไม่ต้องรอ artifact หนักและงานเมทริกซ์ตามแพลตฟอร์ม
3. `build-artifacts` ทำงานทับซ้อนกับ lane Linux แบบเร็ว เพื่อให้ consumer ปลายทางเริ่มได้ทันทีเมื่อ shared build พร้อม
4. หลังจากนั้น lane ที่หนักกว่าตามแพลตฟอร์มและ runtime จะแตกออก: `checks-fast-core`, `checks-fast-contracts-channels`, `checks-node-extensions`, `checks-node-core-test`, `extension-fast` เฉพาะ PR, `checks`, `checks-windows`, `macos-node`, `macos-swift` และ `android`

ตรรกะขอบเขตอยู่ใน `scripts/ci-changed-scope.mjs` และมี unit test ครอบคลุมใน `src/scripts/ci-changed-scope.test.ts`
การแก้ไข workflow ของ CI จะตรวจสอบกราฟ Node CI และ workflow linting แต่จะไม่บังคับให้เกิด build native ของ Windows, Android หรือ macOS ด้วยตัวเอง; lane ของแพลตฟอร์มเหล่านั้นยังคงผูกกับการเปลี่ยนแปลงในซอร์สของแพลตฟอร์มนั้น
การตรวจสอบ Node บน Windows ถูกกำหนดขอบเขตไปยัง wrapper เฉพาะของ Windows สำหรับ process/path, ตัวช่วย npm/pnpm/UI runner, config ของ package manager และพื้นผิว workflow ของ CI ที่รัน lane นั้น; การเปลี่ยนแปลงซอร์ส, plugin, install-smoke และ test-only ที่ไม่เกี่ยวข้องจะยังคงอยู่ใน lane Node บน Linux เพื่อไม่ให้จอง worker Windows 16-vCPU สำหรับการครอบคลุมที่ได้ถูกทดสอบแล้วใน shard ปกติ
เวิร์กโฟลว์ `install-smoke` แยกต่างหากนำสคริปต์กำหนดขอบเขตเดียวกันมาใช้ผ่านงาน `preflight` ของตัวเอง มันคำนวณ `run_install_smoke` จากสัญญาณ changed-smoke ที่แคบกว่า ดังนั้น Docker/install smoke จะรันสำหรับการเปลี่ยนแปลงด้าน install, packaging, container, การเปลี่ยนแปลง production ของ bundled extension และพื้นผิว core ของ plugin/channel/gateway/Plugin SDK ที่งาน Docker smoke ใช้ การแก้ไขเฉพาะ test และ docs จะไม่จอง worker ของ Docker การทดสอบ package แบบ QR จะบังคับให้เลเยอร์ Docker `pnpm install` รันใหม่ ขณะยังคงรักษาแคช BuildKit pnpm store ไว้ จึงยังได้ทดสอบการติดตั้งโดยไม่ต้องดาวน์โหลด dependency ใหม่ทุกครั้ง gateway-network e2e ใช้อิมเมจ runtime ที่ build ไว้ก่อนหน้านี้ในงานเดียวกันซ้ำ จึงเพิ่มการครอบคลุม WebSocket ระหว่างคอนเทนเนอร์จริงโดยไม่ต้องเพิ่ม Docker build อีกครั้ง `test:docker:all` ในเครื่องจะ prebuild built-app image ที่ใช้ร่วมกันจาก `scripts/e2e/Dockerfile` เพียงหนึ่งชุด และนำกลับมาใช้ซ้ำกับตัวรัน E2E container smoke โดยเวิร์กโฟลว์ live/E2E ที่ใช้ซ้ำได้ก็สะท้อนรูปแบบเดียวกัน โดย build และ push Docker E2E image ที่ติดแท็ก SHA ไปยัง GHCR หนึ่งครั้งก่อน Docker matrix จากนั้นรันเมทริกซ์ด้วย `OPENCLAW_SKIP_DOCKER_BUILD=1` การทดสอบ Docker แบบ QR และ installer ยังคงใช้ Dockerfile ที่เน้นด้าน install ของตนเอง งาน `docker-e2e-fast` แยกต่างหากจะรันโปรไฟล์ Docker ของ bundled plugin แบบมีขอบเขต ภายใต้ command timeout 120 วินาที: การซ่อมแซม dependency ของ setup-entry และการแยก failure ของ bundled-loader แบบสังเคราะห์ เมทริกซ์เต็มของ bundled update/channel ยังคงเป็น manual/full-suite เพราะมีการรัน npm update จริงซ้ำหลายรอบและ doctor repair

ตรรกะ changed-lane ในเครื่องอยู่ใน `scripts/changed-lanes.mjs` และถูกรันโดย `scripts/check-changed.mjs` local gate นี้เข้มงวดกว่าขอบเขตแพลตฟอร์มกว้าง ๆ ของ CI ในด้าน boundary ของสถาปัตยกรรม: การเปลี่ยนแปลง production ของ core จะรัน core prod typecheck พร้อม core tests, การเปลี่ยนแปลงเฉพาะ test ของ core จะรันเฉพาะ core test typecheck/tests, การเปลี่ยนแปลง production ของ extension จะรัน extension prod typecheck พร้อม extension tests และการเปลี่ยนแปลงเฉพาะ test ของ extension จะรันเฉพาะ extension test typecheck/tests การเปลี่ยนแปลงของ Plugin SDK สาธารณะหรือ plugin-contract จะขยายไปยังการตรวจสอบ extension เพราะ extensions พึ่งพาสัญญาเหล่านั้น การ bump เวอร์ชันที่เป็นเฉพาะ release metadata จะรันการตรวจสอบแบบเจาะจงสำหรับ version/config/root-dependency ส่วนการเปลี่ยนแปลง root/config ที่ไม่รู้จักจะ fail-safe ไปยังทุก lane

สำหรับ push เมทริกซ์ `checks` จะเพิ่ม lane `compat-node22` แบบ push-only สำหรับ pull request lane นี้จะถูกข้าม และเมทริกซ์จะยังคงโฟกัสที่ lane การทดสอบ/แชนเนลปกติ

ตระกูลการทดสอบ Node ที่ช้าที่สุดถูกแยกหรือปรับสมดุลเพื่อให้งานแต่ละงานมีขนาดเล็ก: channel contracts แยกการครอบคลุม registry และ core เป็นทั้งหมดหก shard แบบถ่วงน้ำหนัก, bundled plugin tests ถูกปรับสมดุลบน worker ของ extension หกตัว, auto-reply รันเป็น worker ที่สมดุลสามตัวแทนหก worker เล็ก ๆ และ config ของ agentic gateway/plugin ถูกกระจายไปตามงาน agentic Node ที่ใช้เฉพาะซอร์สที่มีอยู่แล้ว แทนที่จะรอ built artifact การทดสอบกว้าง ๆ สำหรับ browser, QA, media และ plugin เบ็ดเตล็ด ใช้ config ของ Vitest เฉพาะแทน shared plugin catch-all lane ของ agents แบบกว้างใช้ตัวจัดตาราง file-parallel ร่วมของ Vitest เพราะถูกครอบงำด้วย import/scheduling มากกว่าจะมีไฟล์ทดสอบช้าเพียงไฟล์เดียว `runtime-config` รันร่วมกับ infra core-runtime shard เพื่อไม่ให้ shared runtime shard เป็นเจ้าของส่วนท้าย `check-additional` เก็บงาน compile/canary ของ package-boundary ไว้ด้วยกัน และแยกสถาปัตยกรรม topology ของ runtime ออกจากการครอบคลุม gateway watch; boundary guard shard รัน guard เล็กอิสระของมันพร้อมกันภายในงานเดียว Gateway watch, channel tests และ core support-boundary shard รันพร้อมกันภายใน `build-artifacts` หลังจาก `dist/` และ `dist-runtime/` ถูก build แล้ว ทำให้ยังคงชื่อ check เดิมเป็นงาน verifier แบบเบา ขณะหลีกเลี่ยง worker Blacksmith เพิ่มอีกสองตัวและคิว consumer artifact ชุดที่สอง
Android CI รันทั้ง `testPlayDebugUnitTest` และ `testThirdPartyDebugUnitTest` แล้วจึง build Play debug APK โดย flavor แบบ third-party ไม่มี source set หรือ manifest แยก แต่ lane ของ unit test ยัง compile flavor นั้นพร้อมแฟล็ก BuildConfig ของ SMS/call-log ขณะหลีกเลี่ยงงานแพ็กเกจ debug APK ซ้ำในทุก push ที่เกี่ยวข้องกับ Android
`extension-fast` เป็น PR-only เพราะการ push ได้รัน shard ของ bundled plugin แบบเต็มอยู่แล้ว ซึ่งทำให้ได้ feedback สำหรับ plugin ที่เปลี่ยนระหว่างการ review โดยไม่ต้องจอง worker Blacksmith เพิ่มบน `main` สำหรับการครอบคลุมที่มีอยู่แล้วใน `checks-node-extensions`

GitHub อาจทำเครื่องหมายงานที่ถูกแทนที่ว่าเป็น `cancelled` เมื่อมี push ใหม่กว่ามาถึง PR เดียวกันหรือ ref `main` เดียวกัน ให้ถือว่านี่เป็น noise ของ CI เว้นแต่ว่าการรันล่าสุดสำหรับ ref เดียวกันนั้นก็ยังล้มเหลวด้วย aggregate shard checks ใช้ `!cancelled() && always()` เพื่อให้ยังรายงานความล้มเหลวปกติของ shard แต่จะไม่เข้าแถวหลังจากทั้ง workflow ถูกแทนที่ไปแล้ว
คีย์ concurrency ของ CI ถูกกำหนดเวอร์ชัน (`CI-v7-*`) เพื่อไม่ให้ zombie ฝั่ง GitHub ในกลุ่มคิวเก่าบล็อกการรันใหม่บน main ได้ไม่มีกำหนด

## Runner

| Runner                           | งาน                                                                                                                                                                                                                                                                                                                                                                                                                                                                        |
| -------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `ubuntu-24.04`                   | `preflight`, งาน security แบบเร็วและตัวรวม (`security-scm-fast`, `security-dependency-audit`, `security-fast`), การตรวจสอบ protocol/contract/bundled แบบเร็ว, การตรวจสอบ channel contract แบบแบ่ง shard, shard ของ `check` ยกเว้น lint, shard และตัวรวมของ `check-additional`, ตัวตรวจสอบ aggregate ของ Node test, การตรวจสอบ docs, Python Skills, workflow-sanity, labeler, auto-response; preflight ของ install-smoke ก็ใช้ Ubuntu ที่โฮสต์โดย GitHub เช่นกัน เพื่อให้เมทริกซ์ Blacksmith เข้าแถวได้เร็วขึ้น |
| `blacksmith-8vcpu-ubuntu-2404`   | `build-artifacts`, build-smoke, shard การทดสอบ Linux Node, shard การทดสอบ bundled plugin, `android`                                                                                                                                                                                                                                                                                                                                                                       |
| `blacksmith-16vcpu-ubuntu-2404`  | `check-lint` ซึ่งยังไวต่อ CPU มากพอที่ 8 vCPU มีต้นทุนมากกว่าประโยชน์ที่ประหยัดได้; Docker build ของ install-smoke ซึ่งเวลาเข้าคิวของ 32-vCPU มีต้นทุนมากกว่าประโยชน์ที่ประหยัดได้                                                                                                                                                                                                                                                                                   |
| `blacksmith-16vcpu-windows-2025` | `checks-windows`                                                                                                                                                                                                                                                                                                                                                                                                                                                            |
| `blacksmith-6vcpu-macos-latest`  | `macos-node` บน `openclaw/openclaw`; fork จะ fallback ไปใช้ `macos-latest`                                                                                                                                                                                                                                                                                                                                                                                                |
| `blacksmith-12vcpu-macos-latest` | `macos-swift` บน `openclaw/openclaw`; fork จะ fallback ไปใช้ `macos-latest`                                                                                                                                                                                                                                                                                                                                                                                               |

## คำสั่งในเครื่องที่เทียบเท่ากัน

```bash
pnpm changed:lanes   # ตรวจสอบตัวจำแนก changed-lane ในเครื่องสำหรับ origin/main...HEAD
pnpm check:changed   # local gate อัจฉริยะ: typecheck/lint/tests ที่เปลี่ยนตาม boundary lane
pnpm check          # local gate แบบเร็ว: production tsgo + lint แบบแบ่ง shard + fast guards แบบขนาน
pnpm check:test-types
pnpm check:timed    # gate เดิมพร้อมเวลาแยกตามแต่ละสเตจ
pnpm build:strict-smoke
pnpm check:architecture
pnpm test:gateway:watch-regression
pnpm test           # การทดสอบ vitest
pnpm test:channels
pnpm test:contracts:channels
pnpm check:docs     # รูปแบบ docs + lint + ลิงก์เสีย
pnpm build          # build dist เมื่อ lane ของ artifact/build-smoke ใน CI มีความเกี่ยวข้อง
node scripts/ci-run-timings.mjs <run-id>  # สรุป wall time, queue time และงานที่ช้าที่สุด
```
