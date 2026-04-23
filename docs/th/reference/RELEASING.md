---
read_when:
    - กำลังมองหาคำจำกัดความของช่องทางรีลีสสาธารณะ
    - กำลังมองหาการตั้งชื่อเวอร์ชันและรอบจังหวะการออกรีลีส
summary: ช่องทางการออกรีลีสสู่สาธารณะ การตั้งชื่อเวอร์ชัน และรอบจังหวะการออกรีลีส
title: นโยบายการออกรีลีส
x-i18n:
    generated_at: "2026-04-23T05:54:34Z"
    model: gpt-5.4
    provider: openai
    source_hash: 979fd30ec717e107858ff812ef4b46060b9a00a0b5a3c23085d95b8fb81723b8
    source_path: reference/RELEASING.md
    workflow: 15
---

# นโยบายการออกรีลีส

OpenClaw มี public release lanes อยู่สามแบบ:

- stable: รีลีสที่ติดแท็กและเผยแพร่ไปยัง npm `beta` เป็นค่าเริ่มต้น หรือไปยัง npm `latest` เมื่อมีการร้องขออย่างชัดเจน
- beta: แท็ก prerelease ที่เผยแพร่ไปยัง npm `beta`
- dev: หัวเคลื่อนที่ของ `main`

## การตั้งชื่อเวอร์ชัน

- เวอร์ชันรีลีส stable: `YYYY.M.D`
  - Git tag: `vYYYY.M.D`
- เวอร์ชันรีลีสแก้ไขของ stable: `YYYY.M.D-N`
  - Git tag: `vYYYY.M.D-N`
- เวอร์ชัน prerelease แบบ beta: `YYYY.M.D-beta.N`
  - Git tag: `vYYYY.M.D-beta.N`
- ห้าม zero-pad เดือนหรือวัน
- `latest` หมายถึง npm stable release ที่ถูกโปรโมตในปัจจุบัน
- `beta` หมายถึงเป้าหมายการติดตั้ง beta ปัจจุบัน
- stable และ stable correction releases จะเผยแพร่ไปยัง npm `beta` เป็นค่าเริ่มต้น; ผู้ปฏิบัติการรีลีสสามารถกำหนดเป้าหมายเป็น `latest` อย่างชัดเจน หรือโปรโมต beta build ที่ผ่านการตรวจสอบแล้วในภายหลัง
- ทุกรีลีส stable ของ OpenClaw จะส่ง npm package และ macOS app มาพร้อมกัน;
  โดยปกติ beta releases จะตรวจสอบและเผยแพร่เส้นทาง npm/package ก่อน ส่วนการ build/sign/notarize ของ mac app จะสงวนไว้ให้ stable เว้นแต่จะมีการร้องขออย่างชัดเจน

## รอบจังหวะการออกรีลีส

- รีลีสจะเดินแบบ beta-first
- stable จะตามมาหลังจาก beta ล่าสุดผ่านการตรวจสอบแล้วเท่านั้น
- โดยปกติผู้ดูแลจะตัดรีลีสจาก branch `release/YYYY.M.D` ที่สร้างขึ้น
  จาก `main` ปัจจุบัน เพื่อให้การตรวจสอบรีลีสและการแก้ไขไม่ไปบล็อก
  การพัฒนาใหม่บน `main`
- หากมีการ push หรือ publish beta tag ไปแล้วและต้องแก้ไข ผู้ดูแลจะตัด
  แท็ก `-beta.N` ถัดไป แทนการลบหรือสร้าง beta tag เก่าซ้ำ
- ขั้นตอนรีลีสโดยละเอียด การอนุมัติ credentials และบันทึกการกู้คืน
  เป็นข้อมูลสำหรับผู้ดูแลเท่านั้น

## การเตรียมก่อนรีลีส

- รัน `pnpm check:test-types` ก่อนขั้นตอน preflight ของรีลีส เพื่อให้ test TypeScript
  ยังคงได้รับการตรวจนอกเหนือจากเกต `pnpm check` ในเครื่องที่เร็วกว่า
- รัน `pnpm check:architecture` ก่อน preflight ของรีลีส เพื่อให้การตรวจ import
  cycle และขอบเขตสถาปัตยกรรมที่กว้างขึ้นเป็นสีเขียวนอกเหนือจากเกตในเครื่องที่เร็วกว่า
- รัน `pnpm build && pnpm ui:build` ก่อน `pnpm release:check` เพื่อให้มี
  `dist/*` release artifacts และ Control UI bundle ตามที่คาดไว้สำหรับขั้นตอนตรวจสอบ pack
- รัน `pnpm release:check` ก่อนทุก tagged release
- ตอนนี้การตรวจรีลีสรันใน workflow แบบ manual แยกต่างหาก:
  `OpenClaw Release Checks`
- `OpenClaw Release Checks` ยังรัน QA Lab mock parity gate รวมถึง QA lanes
  แบบ live ของ Matrix และ Telegram ก่อนการอนุมัติรีลีส โดย live lanes ใช้
  environment `qa-live-shared`; ส่วน Telegram ยังใช้ Convex CI credential leases ด้วย
- การตรวจสอบ runtime สำหรับการติดตั้งและอัปเกรดข้ามระบบปฏิบัติการจะถูก dispatch จาก
  private caller workflow
  `openclaw/releases-private/.github/workflows/openclaw-cross-os-release-checks.yml`
  ซึ่งเรียก reusable public workflow
  `.github/workflows/openclaw-cross-os-release-checks-reusable.yml`
- การแยกนี้เกิดขึ้นโดยตั้งใจ: เพื่อให้เส้นทาง npm release จริงสั้น
  กำหนดแน่นอน และเน้น artifacts ขณะที่ live checks ที่ช้ากว่าจะอยู่ในเลนของตัวเอง
  เพื่อไม่ให้ถ่วงหรือบล็อกการ publish
- release checks ต้องถูก dispatch จาก workflow ref ของ `main` หรือจาก
  workflow ref ของ `release/YYYY.M.D` เพื่อให้ตรรกะ workflow และ secrets
  อยู่ภายใต้การควบคุม
- workflow นั้นรองรับทั้ง release tag ที่มีอยู่แล้ว หรือ current full
  40-character workflow-branch commit SHA
- ในโหมด commit-SHA จะยอมรับเฉพาะ HEAD ปัจจุบันของ workflow-branch เท่านั้น; ใช้
  release tag สำหรับ release commits ที่เก่ากว่า
- preflight แบบ validation-only ของ `OpenClaw NPM Release` ก็ยอมรับ current
  full 40-character workflow-branch commit SHA ได้เช่นกัน โดยไม่ต้องมี pushed tag
- เส้นทาง SHA นั้นเป็นแบบ validation-only และไม่สามารถถูกโปรโมตไปเป็นการ publish จริงได้
- ในโหมด SHA workflow จะสังเคราะห์ `v<package.json version>` ขึ้นมาเฉพาะสำหรับการตรวจ metadata ของแพ็กเกจ; การ publish จริงยังคงต้องใช้ release tag จริง
- ทั้งสอง workflows จะเก็บเส้นทาง publish และ promotion จริงไว้บน GitHub-hosted
  runners ขณะที่เส้นทาง validation แบบไม่เปลี่ยนแปลงสามารถใช้
  Blacksmith Linux runners ที่ใหญ่กว่าได้
- workflow นั้นจะรัน
  `OPENCLAW_LIVE_TEST=1 OPENCLAW_LIVE_CACHE_TEST=1 pnpm test:live:cache`
  โดยใช้ทั้ง workflow secrets `OPENAI_API_KEY` และ `ANTHROPIC_API_KEY`
- preflight ของ npm release จะไม่รอแยก release checks lane อีกต่อไป
- รัน `RELEASE_TAG=vYYYY.M.D node --import tsx scripts/openclaw-npm-release-check.ts`
  (หรือแท็ก beta/correction ที่ตรงกัน) ก่อนอนุมัติ
- หลัง npm publish ให้รัน
  `node --import tsx scripts/openclaw-npm-postpublish-verify.ts YYYY.M.D`
  (หรือเวอร์ชัน beta/correction ที่ตรงกัน) เพื่อตรวจสอบเส้นทางติดตั้งจาก registry ที่เผยแพร่แล้วใน temp prefix ใหม่
- ตอนนี้ระบบอัตโนมัติสำหรับรีลีสของผู้ดูแลใช้รูปแบบ preflight-then-promote:
  - npm publish จริงต้องผ่าน npm `preflight_run_id` ที่สำเร็จก่อน
  - npm publish จริงต้องถูก dispatch จาก branch `main` หรือ
    `release/YYYY.M.D` เดียวกับ preflight run ที่สำเร็จ
  - stable npm releases มีค่าเริ่มต้นเป็น `beta`
  - stable npm publish สามารถกำหนดเป้าหมาย `latest` อย่างชัดเจนผ่าน workflow input ได้
  - การเปลี่ยน npm dist-tag แบบใช้ token ตอนนี้อยู่ใน
    `openclaw/releases-private/.github/workflows/openclaw-npm-dist-tags.yml`
    เพื่อความปลอดภัย เพราะ `npm dist-tag add` ยังต้องใช้ `NPM_TOKEN` ขณะที่
    public repo ยังคงใช้ OIDC-only publish
  - public `macOS Release` เป็นแบบ validation-only
  - private mac publish จริงต้องผ่าน preflight และ validate run ids ของ private mac ที่สำเร็จ
  - เส้นทาง publish จริงจะโปรโมต artifacts ที่เตรียมไว้แล้ว แทนการ build ใหม่อีกครั้ง
- สำหรับ stable correction releases แบบ `YYYY.M.D-N`, post-publish verifier
  จะตรวจสอบเส้นทางอัปเกรดใน temp-prefix เดียวกันจาก `YYYY.M.D` ไปยัง `YYYY.M.D-N`
  ด้วย เพื่อให้ release corrections ไม่ทิ้ง older global installs ให้ยังคงอยู่บน payload ของ stable รุ่นฐานแบบเงียบๆ
- preflight ของ npm release จะล้มเหลวแบบ fail closed เว้นแต่ tarball จะมีทั้ง
  `dist/control-ui/index.html` และ payload `dist/control-ui/assets/` ที่ไม่ว่าง
  เพื่อให้เราไม่ส่ง browser dashboard ว่างเปล่าออกไปอีก
- `pnpm test:install:smoke` ยังบังคับใช้ budget ของ `unpackedSize` ใน npm pack
  บน candidate update tarball ด้วย เพื่อให้ installer e2e จับ pack bloat ที่เกิดขึ้นโดยไม่ตั้งใจก่อนเข้าสู่เส้นทาง publish ของรีลีส
- หากงานรีลีสแตะต้อง CI planning, extension timing manifests หรือ
  extension test matrices ให้ regenerate และ review workflow matrix outputs ที่ planner เป็นเจ้าของของ
  `checks-node-extensions` จาก `.github/workflows/ci.yml` ก่อนอนุมัติ เพื่อไม่ให้ release notes อธิบาย layout ของ CI ที่ stale
- ความพร้อมสำหรับ stable macOS release ยังรวมถึงพื้นผิวของ updater ด้วย:
  - GitHub release ต้องมีทั้ง `.zip`, `.dmg` และ `.dSYM.zip` ที่แพ็กแล้ว
  - `appcast.xml` บน `main` ต้องชี้ไปยัง stable zip ตัวใหม่หลัง publish
  - แอปที่แพ็กแล้วต้องคง bundle id แบบ non-debug, Sparkle feed
    URL ที่ไม่ว่าง และ `CFBundleVersion` ที่อย่างน้อยต้องเท่ากับ canonical Sparkle build floor
    สำหรับเวอร์ชันรีลีสนั้น

## อินพุตของ NPM workflow

`OpenClaw NPM Release` รับอินพุตที่ผู้ปฏิบัติการควบคุมได้ดังนี้:

- `tag`: release tag ที่จำเป็น เช่น `v2026.4.2`, `v2026.4.2-1` หรือ
  `v2026.4.2-beta.1`; เมื่อ `preflight_only=true` ก็อาจเป็น current
  full 40-character workflow-branch commit SHA สำหรับ validation-only preflight ได้
- `preflight_only`: `true` สำหรับ validation/build/package เท่านั้น, `false` สำหรับ
  เส้นทาง publish จริง
- `preflight_run_id`: จำเป็นบนเส้นทาง publish จริง เพื่อให้ workflow นำ tarball ที่เตรียมไว้จาก preflight run ที่สำเร็จมาใช้ซ้ำ
- `npm_dist_tag`: npm target tag สำหรับเส้นทาง publish; ค่าเริ่มต้นคือ `beta`

`OpenClaw Release Checks` รับอินพุตที่ผู้ปฏิบัติการควบคุมได้ดังนี้:

- `ref`: release tag ที่มีอยู่แล้ว หรือ current full 40-character `main` commit
  SHA ที่ต้องการตรวจสอบเมื่อ dispatch จาก `main`; หาก dispatch จาก release branch ให้ใช้
  release tag ที่มีอยู่แล้ว หรือ current full 40-character release-branch commit
  SHA

กฎ:

- แท็ก stable และ correction สามารถเผยแพร่ไปยังได้ทั้ง `beta` หรือ `latest`
- แท็ก beta prerelease สามารถเผยแพร่ไปยัง `beta` ได้เท่านั้น
- สำหรับ `OpenClaw NPM Release` อินพุตแบบ full commit SHA อนุญาตได้เฉพาะเมื่อ
  `preflight_only=true`
- `OpenClaw Release Checks` เป็นแบบ validation-only เสมอ และยังยอมรับ
  current workflow-branch commit SHA ด้วย
- โหมด commit-SHA ของ release checks ยังต้องใช้ current workflow-branch HEAD
- เส้นทาง publish จริงต้องใช้ `npm_dist_tag` เดียวกับที่ใช้ระหว่าง preflight;
  workflow จะตรวจสอบ metadata นั้นก่อนให้ publish ต่อ

## ลำดับของ stable npm release

เมื่อจะตัด stable npm release:

1. รัน `OpenClaw NPM Release` ด้วย `preflight_only=true`
   - ก่อนที่จะมี tag คุณอาจใช้ current full workflow-branch commit
     SHA เพื่อทำ dry run แบบ validation-only ของ preflight workflow
2. เลือก `npm_dist_tag=beta` สำหรับโฟลว์ beta-first ปกติ หรือ `latest` เฉพาะ
   เมื่อคุณตั้งใจจะ publish stable โดยตรง
3. รัน `OpenClaw Release Checks` แยกต่างหากด้วย tag เดียวกันหรือ
   full current workflow-branch commit SHA เดียวกัน เมื่อคุณต้องการความครอบคลุมของ live prompt cache,
   QA Lab parity, Matrix และ Telegram
   - สิ่งนี้แยกออกมาโดยตั้งใจ เพื่อให้ live coverage ยังคงใช้ได้โดยไม่ดึง checks ที่รันนานหรือ flaky กลับมาเชื่อมกับ publish workflow อีก
4. บันทึก `preflight_run_id` ที่สำเร็จไว้
5. รัน `OpenClaw NPM Release` อีกครั้งด้วย `preflight_only=false`, `tag`
   เดิม, `npm_dist_tag` เดิม และ `preflight_run_id` ที่บันทึกไว้
6. หากรีลีสนั้นลงที่ `beta` ให้ใช้ private
   workflow `openclaw/releases-private/.github/workflows/openclaw-npm-dist-tags.yml`
   เพื่อโปรโมต stable version นั้นจาก `beta` ไปยัง `latest`
7. หากรีลีสนั้นตั้งใจเผยแพร่ตรงไปยัง `latest` และต้องการให้ `beta`
   ตาม stable build เดียวกันทันที ให้ใช้ private workflow เดียวกันนั้นชี้ทั้งสอง dist-tags ไปยัง stable version หรือปล่อยให้ scheduled
   self-healing sync ของมันย้าย `beta` ในภายหลัง

การเปลี่ยน dist-tag อยู่ใน private repo เพื่อความปลอดภัย เพราะมันยังคง
ต้องใช้ `NPM_TOKEN` ขณะที่ public repo ยังคงใช้ OIDC-only publish

สิ่งนี้ทำให้ทั้งเส้นทาง direct publish และเส้นทางโปรโมตแบบ beta-first
ถูกบันทึกไว้และผู้ปฏิบัติการมองเห็นได้

## เอกสารอ้างอิงสาธารณะ

- [`.github/workflows/openclaw-npm-release.yml`](https://github.com/openclaw/openclaw/blob/main/.github/workflows/openclaw-npm-release.yml)
- [`.github/workflows/openclaw-release-checks.yml`](https://github.com/openclaw/openclaw/blob/main/.github/workflows/openclaw-release-checks.yml)
- [`.github/workflows/openclaw-cross-os-release-checks-reusable.yml`](https://github.com/openclaw/openclaw/blob/main/.github/workflows/openclaw-cross-os-release-checks-reusable.yml)
- [`scripts/openclaw-npm-release-check.ts`](https://github.com/openclaw/openclaw/blob/main/scripts/openclaw-npm-release-check.ts)
- [`scripts/package-mac-dist.sh`](https://github.com/openclaw/openclaw/blob/main/scripts/package-mac-dist.sh)
- [`scripts/make_appcast.sh`](https://github.com/openclaw/openclaw/blob/main/scripts/make_appcast.sh)

ผู้ดูแลจะใช้เอกสารรีลีสแบบ private ใน
[`openclaw/maintainers/release/README.md`](https://github.com/openclaw/maintainers/blob/main/release/README.md)
เป็นคู่มือปฏิบัติจริง
