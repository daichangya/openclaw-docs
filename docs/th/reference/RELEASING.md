---
read_when:
    - กำลังมองหาคำนิยามของช่องทางการเผยแพร่สาธารณะ
    - กำลังมองหารูปแบบการตั้งชื่อเวอร์ชันและรอบการออกเวอร์ชัน
summary: ช่องทางการเผยแพร่สาธารณะ รูปแบบการตั้งชื่อเวอร์ชัน และรอบการออกเวอร์ชัน
title: นโยบายการเผยแพร่
x-i18n:
    generated_at: "2026-04-24T09:31:13Z"
    model: gpt-5.4
    provider: openai
    source_hash: 2cba6cd02c6fb2380abd8d46e10567af2f96c7c6e45236689d69289348b829ce
    source_path: reference/RELEASING.md
    workflow: 15
---

OpenClaw มีช่องทางการเผยแพร่สาธารณะ 3 ช่องทาง:

- stable: รุ่นที่ติดแท็กแล้วและเผยแพร่ไปยัง npm `beta` โดยค่าเริ่มต้น หรือไปยัง npm `latest` เมื่อร้องขออย่างชัดเจน
- beta: แท็ก prerelease ที่เผยแพร่ไปยัง npm `beta`
- dev: หัวล่าสุดที่เคลื่อนไหวของ `main`

## การตั้งชื่อเวอร์ชัน

- เวอร์ชัน stable release: `YYYY.M.D`
  - Git tag: `vYYYY.M.D`
- เวอร์ชัน stable correction release: `YYYY.M.D-N`
  - Git tag: `vYYYY.M.D-N`
- เวอร์ชัน beta prerelease: `YYYY.M.D-beta.N`
  - Git tag: `vYYYY.M.D-beta.N`
- อย่าเติมศูนย์นำหน้าที่เดือนหรือวัน
- `latest` หมายถึง stable npm release ปัจจุบันที่ได้รับการโปรโมต
- `beta` หมายถึงเป้าหมายการติดตั้ง beta ปัจจุบัน
- stable และ stable correction releases จะเผยแพร่ไปยัง npm `beta` โดยค่าเริ่มต้น; ผู้ดูแลการเผยแพร่สามารถกำหนดเป้าหมายเป็น `latest` ได้อย่างชัดเจน หรือโปรโมต beta build ที่ผ่านการตรวจสอบแล้วในภายหลัง
- ทุก stable OpenClaw release จะส่ง npm package และแอป macOS มาด้วยกัน;
  ส่วน beta releases โดยปกติจะตรวจสอบและเผยแพร่เส้นทาง npm/package ก่อน โดยการ build/sign/notarize ของแอป mac จะสงวนไว้สำหรับ stable เว้นแต่จะมีการร้องขออย่างชัดเจน

## รอบการออกเวอร์ชัน

- releases จะเริ่มจาก beta-first
- stable จะตามมาหลังจาก beta ล่าสุดผ่านการตรวจสอบแล้วเท่านั้น
- โดยปกติผู้ดูแลจะตัด releases จากสาขา `release/YYYY.M.D` ที่สร้าง
  จาก `main` ปัจจุบัน เพื่อให้การตรวจสอบ release และการแก้ไขไม่บล็อกการพัฒนาใหม่บน `main`
- หากมีการ push หรือ publish beta tag แล้วและต้องแก้ไข ผู้ดูแลจะตัด
  แท็ก `-beta.N` ถัดไปแทนการลบหรือสร้าง beta tag เดิมใหม่
- ขั้นตอนการเผยแพร่โดยละเอียด approvals ข้อมูลรับรอง และบันทึกการกู้คืนเป็นข้อมูลสำหรับผู้ดูแลเท่านั้น

## Release preflight

- รัน `pnpm check:test-types` ก่อน release preflight เพื่อให้ test TypeScript
  ยังคงได้รับการครอบคลุมนอกเหนือจาก local `pnpm check` gate แบบเร็ว
- รัน `pnpm check:architecture` ก่อน release preflight เพื่อให้การตรวจสอบ import
  cycle และ architecture boundary ที่กว้างกว่ายังคงผ่านนอกเหนือจาก local gate แบบเร็ว
- รัน `pnpm build && pnpm ui:build` ก่อน `pnpm release:check` เพื่อให้มี
  `dist/*` release artifacts และ Control UI bundle ตามที่คาดไว้สำหรับขั้นตอน
  pack validation
- รัน `pnpm release:check` ก่อนทุก tagged release
- ตอนนี้ release checks จะรันใน workflow แบบ manual แยกต่างหาก:
  `OpenClaw Release Checks`
- `OpenClaw Release Checks` ยังรัน QA Lab mock parity gate พร้อม live
  Matrix และ Telegram QA lanes ก่อนอนุมัติ release โดย live lanes ใช้
  environment `qa-live-shared`; ส่วน Telegram ยังใช้ Convex CI credential leases
- การตรวจสอบการติดตั้งและอัปเกรดข้ามระบบปฏิบัติการจะถูก dispatch จาก
  private caller workflow
  `openclaw/releases-private/.github/workflows/openclaw-cross-os-release-checks.yml`
  ซึ่งเรียก reusable public workflow
  `.github/workflows/openclaw-cross-os-release-checks-reusable.yml`
- การแยกนี้เป็นไปโดยตั้งใจ: เพื่อให้เส้นทาง npm release จริงสั้น
  กำหนดแน่นอน และเน้น artifacts ขณะที่ live checks ที่ช้ากว่าจะอยู่ใน
  lane ของตัวเองเพื่อไม่ให้ค้างหรือบล็อกการ publish
- release checks ต้องถูก dispatch จาก workflow ref ของ `main` หรือ
  workflow ref ของ `release/YYYY.M.D` เพื่อให้ตรรกะของ workflow และ secrets ยังคง
  ถูกควบคุม
- workflow นั้นรับได้ทั้ง release tag ที่มีอยู่แล้ว หรือ current full
  40-character workflow-branch commit SHA
- ในโหมด commit-SHA จะรับเฉพาะ HEAD ปัจจุบันของ workflow-branch เท่านั้น; ให้ใช้
  release tag สำหรับ release commits ที่เก่ากว่า
- preflight แบบ validation-only ของ `OpenClaw NPM Release` ก็รับ current
  full 40-character workflow-branch commit SHA ได้เช่นกัน โดยไม่ต้องมี pushed tag
- เส้นทางแบบ SHA นั้นมีไว้เพื่อ validation-only และไม่สามารถถูกโปรโมตเป็น publish จริงได้
- ในโหมด SHA workflow จะสังเคราะห์ `v<package.json version>` เฉพาะสำหรับ
  การตรวจสอบ package metadata; ส่วน real publish ยังต้องใช้ real release tag
- ทั้งสอง workflows ยังคงเก็บเส้นทาง publish และ promotion จริงไว้บน GitHub-hosted
  runners ขณะที่เส้นทาง validation แบบไม่เปลี่ยนแปลงสามารถใช้
  Blacksmith Linux runners ขนาดใหญ่กว่าได้
- workflow นั้นรัน
  `OPENCLAW_LIVE_TEST=1 OPENCLAW_LIVE_CACHE_TEST=1 pnpm test:live:cache`
  โดยใช้ workflow secrets ทั้ง `OPENAI_API_KEY` และ `ANTHROPIC_API_KEY`
- npm release preflight จะไม่รอ release checks lane ที่แยกออกไปแล้วอีกต่อไป
- รัน `RELEASE_TAG=vYYYY.M.D node --import tsx scripts/openclaw-npm-release-check.ts`
  (หรือแท็ก beta/correction ที่ตรงกัน) ก่อนอนุมัติ
- หลัง npm publish ให้รัน
  `node --import tsx scripts/openclaw-npm-postpublish-verify.ts YYYY.M.D`
  (หรือเวอร์ชัน beta/correction ที่ตรงกัน) เพื่อยืนยันเส้นทางการติดตั้งจาก registry ที่เผยแพร่แล้วใน temp prefix ใหม่
- หลัง beta publish ให้รัน `OPENCLAW_NPM_TELEGRAM_PACKAGE_SPEC=openclaw@YYYY.M.D-beta.N OPENCLAW_NPM_TELEGRAM_CREDENTIAL_SOURCE=convex OPENCLAW_NPM_TELEGRAM_CREDENTIAL_ROLE=ci pnpm test:docker:npm-telegram-live`
  เพื่อตรวจสอบ installed-package onboarding, Telegram setup และ Telegram E2E จริง
  กับ npm package ที่เผยแพร่แล้วโดยใช้ pooled Telegram credential แบบเช่าร่วม
  ในกรณี one-off ในเครื่องของผู้ดูแล สามารถละ Convex vars ออก และส่ง
  ข้อมูลรับรอง `OPENCLAW_QA_TELEGRAM_*` ทั้งสามตัวผ่าน env โดยตรงได้
- ผู้ดูแลสามารถรัน post-publish check เดียวกันจาก GitHub Actions ผ่าน
  workflow แบบ manual `NPM Telegram Beta E2E` ได้ โดยจงใจให้เป็น manual-only และไม่รันทุกครั้งที่ merge
- ตอนนี้ระบบ release automation ของผู้ดูแลใช้รูปแบบ preflight-then-promote:
  - npm publish จริงต้องผ่าน npm `preflight_run_id` ที่สำเร็จ
  - npm publish จริงต้องถูก dispatch จากสาขา `main` หรือ
    `release/YYYY.M.D` เดียวกันกับ preflight run ที่สำเร็จ
  - stable npm releases มีค่าเริ่มต้นเป็น `beta`
  - stable npm publish สามารถกำหนดเป้าหมายเป็น `latest` ได้อย่างชัดเจนผ่าน workflow input
  - การเปลี่ยน npm dist-tag แบบใช้ token ตอนนี้อยู่ใน
    `openclaw/releases-private/.github/workflows/openclaw-npm-dist-tags.yml`
    เพื่อความปลอดภัย เพราะ `npm dist-tag add` ยังต้องใช้ `NPM_TOKEN` ขณะที่
    public repo คงไว้เฉพาะ OIDC-only publish
  - public `macOS Release` เป็น validation-only
  - private mac publish จริงต้องผ่าน private mac
    `preflight_run_id` และ `validate_run_id` ที่สำเร็จ
  - เส้นทาง publish จริงจะโปรโมต prepared artifacts แทนการ build
    ซ้ำอีกครั้ง
- สำหรับ stable correction releases อย่าง `YYYY.M.D-N`, post-publish verifier
  ยังตรวจสอบ temp-prefix upgrade path เดียวกันจาก `YYYY.M.D` ไปยัง `YYYY.M.D-N`
  เพื่อไม่ให้ release corrections ทิ้ง global installs เก่าไว้กับ payload ของ stable รุ่นฐานอย่างเงียบ ๆ
- npm release preflight จะ fail closed เว้นแต่ tarball จะมีทั้ง
  `dist/control-ui/index.html` และ `dist/control-ui/assets/` ที่ไม่ว่างเปล่า
  เพื่อไม่ให้เราส่ง browser dashboard ที่ว่างเปล่าอีกครั้ง
- post-publish verification ยังตรวจสอบว่าการติดตั้งจาก registry ที่เผยแพร่แล้ว
  มี bundled plugin runtime deps ที่ไม่ว่างเปล่าภายใต้เลย์เอาต์ `dist/*`
  ระดับรากด้วย release ที่ส่งมาพร้อม payload ของ bundled plugin
  dependencies ที่หายไปหรือว่างเปล่าจะไม่ผ่าน postpublish verifier และไม่สามารถถูกโปรโมต
  ไปยัง `latest` ได้
- `pnpm test:install:smoke` ยังบังคับใช้ npm pack `unpackedSize` budget กับ
  candidate update tarball ด้วย ดังนั้น installer e2e จึงจับ pack bloat ที่เกิดขึ้นโดยไม่ตั้งใจ
  ได้ก่อนถึงเส้นทาง release publish
- หากงาน release แตะ CI planning, extension timing manifests หรือ
  extension test matrices ให้ regenerate และทบทวน planner-owned
  `checks-node-extensions` workflow matrix outputs จาก `.github/workflows/ci.yml`
  ก่อนอนุมัติ เพื่อไม่ให้ release notes อธิบายเลย์เอาต์ CI ที่ล้าสมัย
- ความพร้อมของ stable macOS release ยังรวมถึง updater surfaces:
  - GitHub release ต้องลงท้ายด้วย `.zip`, `.dmg` และ `.dSYM.zip` ที่แพ็กเกจแล้ว
  - `appcast.xml` บน `main` ต้องชี้ไปยัง stable zip ใหม่หลัง publish
  - แอปที่แพ็กเกจแล้วต้องคง bundle id ที่ไม่ใช่ debug, Sparkle feed
    URL ที่ไม่ว่างเปล่า และ `CFBundleVersion` ที่มากกว่าหรือเท่ากับ canonical Sparkle build floor
    สำหรับ release version นั้น

## NPM workflow inputs

`OpenClaw NPM Release` รับ operator-controlled inputs ดังนี้:

- `tag`: release tag ที่จำเป็น เช่น `v2026.4.2`, `v2026.4.2-1` หรือ
  `v2026.4.2-beta.1`; เมื่อ `preflight_only=true`, อาจเป็น current
  full 40-character workflow-branch commit SHA สำหรับ validation-only preflight ก็ได้
- `preflight_only`: `true` สำหรับ validation/build/package เท่านั้น, `false` สำหรับ
  เส้นทาง publish จริง
- `preflight_run_id`: จำเป็นบนเส้นทาง publish จริง เพื่อให้ workflow ใช้ tarball ที่เตรียมไว้จาก preflight run ที่สำเร็จซ้ำ
- `npm_dist_tag`: npm target tag สำหรับเส้นทาง publish; ค่าเริ่มต้นคือ `beta`

`OpenClaw Release Checks` รับ operator-controlled inputs ดังนี้:

- `ref`: release tag ที่มีอยู่แล้ว หรือ current full 40-character `main` commit
  SHA ที่จะใช้ตรวจสอบเมื่อ dispatch จาก `main`; หาก dispatch จาก release branch ให้ใช้
  release tag ที่มีอยู่แล้ว หรือ current full 40-character release-branch commit
  SHA

กฎ:

- stable และ correction tags สามารถ publish ไปยัง `beta` หรือ `latest` ก็ได้
- beta prerelease tags สามารถ publish ได้เฉพาะ `beta`
- สำหรับ `OpenClaw NPM Release`, full commit SHA input อนุญาตเฉพาะเมื่อ
  `preflight_only=true`
- `OpenClaw Release Checks` เป็น validation-only เสมอ และยังรับ
  current workflow-branch commit SHA ได้ด้วย
- ในโหมด commit-SHA ของ release checks ยังต้องเป็น current workflow-branch HEAD
- เส้นทาง publish จริงต้องใช้ `npm_dist_tag` เดียวกันกับที่ใช้ตอน preflight;
  workflow จะตรวจสอบ metadata นั้นก่อน publish ต่อ

## ลำดับการออก stable npm release

เมื่อจะตัด stable npm release:

1. รัน `OpenClaw NPM Release` ด้วย `preflight_only=true`
   - ก่อนจะมีแท็ก คุณสามารถใช้ current full workflow-branch commit
     SHA เพื่อ dry run การตรวจสอบแบบ validation-only ของ preflight workflow ได้
2. เลือก `npm_dist_tag=beta` สำหรับโฟลว์ beta-first ปกติ หรือ `latest` เฉพาะ
   เมื่อคุณตั้งใจจะ publish stable โดยตรง
3. รัน `OpenClaw Release Checks` แยกต่างหากด้วยแท็กเดียวกันหรือ
   full current workflow-branch commit SHA เมื่อต้องการ coverage สำหรับ live prompt cache,
   QA Lab parity, Matrix และ Telegram
   - การแยกนี้มีขึ้นโดยตั้งใจเพื่อให้ live coverage ยังพร้อมใช้งานได้โดยไม่ต้อง
     ผูก checks ที่ใช้เวลานานหรือมีความเปราะบางกลับเข้า workflow ของ publish อีก
4. บันทึก `preflight_run_id` ที่สำเร็จไว้
5. รัน `OpenClaw NPM Release` อีกครั้งด้วย `preflight_only=false`, `tag`
   เดิม, `npm_dist_tag` เดิม และ `preflight_run_id` ที่บันทึกไว้
6. หาก release ลงที่ `beta`, ให้ใช้ private
   `openclaw/releases-private/.github/workflows/openclaw-npm-dist-tags.yml`
   workflow เพื่อโปรโมต stable version นั้นจาก `beta` ไปเป็น `latest`
7. หาก release ถูก publish ตรงไปยัง `latest` โดยตั้งใจ และ `beta`
   ควรชี้มาที่ stable build เดียวกันทันที ให้ใช้ private workflow เดียวกันนั้น
   เพื่อให้ทั้งสอง dist-tags ชี้ไปยัง stable version หรือปล่อยให้การ sync แบบ self-healing ตาม schedule ของมันขยับ `beta` ภายหลัง

การเปลี่ยน dist-tag ถูกเก็บไว้ใน private repo เพื่อความปลอดภัย เพราะมันยังคง
ต้องใช้ `NPM_TOKEN` ขณะที่ public repo คงไว้เฉพาะ OIDC-only publish

สิ่งนี้ทำให้ทั้งเส้นทาง publish โดยตรงและเส้นทางโปรโมตแบบ beta-first
ถูกบันทึกเป็นเอกสารและมองเห็นได้สำหรับผู้ปฏิบัติงาน

## เอกสารอ้างอิงสาธารณะ

- [`.github/workflows/openclaw-npm-release.yml`](https://github.com/openclaw/openclaw/blob/main/.github/workflows/openclaw-npm-release.yml)
- [`.github/workflows/openclaw-release-checks.yml`](https://github.com/openclaw/openclaw/blob/main/.github/workflows/openclaw-release-checks.yml)
- [`.github/workflows/openclaw-cross-os-release-checks-reusable.yml`](https://github.com/openclaw/openclaw/blob/main/.github/workflows/openclaw-cross-os-release-checks-reusable.yml)
- [`scripts/openclaw-npm-release-check.ts`](https://github.com/openclaw/openclaw/blob/main/scripts/openclaw-npm-release-check.ts)
- [`scripts/package-mac-dist.sh`](https://github.com/openclaw/openclaw/blob/main/scripts/package-mac-dist.sh)
- [`scripts/make_appcast.sh`](https://github.com/openclaw/openclaw/blob/main/scripts/make_appcast.sh)

ผู้ดูแลจะใช้เอกสาร release แบบ private ใน
[`openclaw/maintainers/release/README.md`](https://github.com/openclaw/maintainers/blob/main/release/README.md)
เป็น runbook จริง

## ที่เกี่ยวข้อง

- [ช่องทางการเผยแพร่](/th/install/development-channels)
