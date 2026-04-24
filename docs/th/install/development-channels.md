---
read_when:
    - คุณต้องการสลับระหว่าง stable/beta/dev
    - คุณต้องการปักหมุดเวอร์ชัน แท็ก หรือ SHA ที่ระบุ კონკრეტულად
    - คุณกำลังติดแท็กหรือเผยแพร่รุ่นก่อนรีลีส
sidebarTitle: Release Channels
summary: 'ช่องทาง stable, beta และ dev: ความหมาย การสลับ การปักหมุด และการติดแท็ก'
title: ช่องทางรีลีส
x-i18n:
    generated_at: "2026-04-24T09:16:36Z"
    model: gpt-5.4
    provider: openai
    source_hash: d892f3b801cb480652e6e7e757c91c000e842689070564f18782c25108dafa3e
    source_path: install/development-channels.md
    workflow: 15
---

# ช่องทางการพัฒนา

OpenClaw มีช่องทางการอัปเดต 3 แบบ:

- **stable**: npm dist-tag `latest` แนะนำสำหรับผู้ใช้ส่วนใหญ่
- **beta**: npm dist-tag `beta` เมื่อเป็นรุ่นปัจจุบัน; หาก beta ไม่มีอยู่หรือเก่ากว่า
  stable release ล่าสุด โฟลว์การอัปเดตจะ fallback ไปยัง `latest`
- **dev**: ส่วนหัวที่เปลี่ยนตลอดของ `main` (git) npm dist-tag คือ `dev` (เมื่อมีการเผยแพร่)
  สาขา `main` มีไว้สำหรับการทดลองและการพัฒนาอย่างต่อเนื่อง อาจมี
  ฟีเจอร์ที่ยังไม่สมบูรณ์หรือการเปลี่ยนแปลงที่ทำให้ใช้งานร่วมกันไม่ได้ อย่าใช้กับ production gateways

โดยทั่วไปเราจะปล่อย stable builds ไปที่ **beta** ก่อน ทดสอบที่นั่น แล้วจึงทำ
ขั้นตอน promotion แบบ explicit ที่ย้าย build ที่ผ่านการตรวจสอบแล้วไปยัง `latest` โดย
ไม่เปลี่ยนหมายเลขเวอร์ชัน ผู้ดูแลสามารถเผยแพร่ stable release
ไปยัง `latest` ได้โดยตรงเมื่อจำเป็น dist-tags คือแหล่งข้อมูลจริงหลักสำหรับการติดตั้งผ่าน npm

## การสลับช่องทาง

```bash
openclaw update --channel stable
openclaw update --channel beta
openclaw update --channel dev
```

`--channel` จะบันทึกตัวเลือกของคุณไว้ใน config (`update.channel`) และทำให้
วิธีติดตั้งสอดคล้องกัน:

- **`stable`** (การติดตั้งแบบแพ็กเกจ): อัปเดตผ่าน npm dist-tag `latest`
- **`beta`** (การติดตั้งแบบแพ็กเกจ): ให้ความสำคัญกับ npm dist-tag `beta` แต่ fallback ไปที่
  `latest` เมื่อ `beta` ไม่มีอยู่หรือเก่ากว่า stable tag ปัจจุบัน
- **`stable`** (การติดตั้งแบบ git): checkout git tag ล่าสุดของ stable
- **`beta`** (การติดตั้งแบบ git): ให้ความสำคัญกับ beta git tag ล่าสุด แต่ fallback ไปที่
  stable git tag ล่าสุดเมื่อ beta ไม่มีอยู่หรือเก่ากว่า
- **`dev`**: ตรวจสอบให้มี git checkout (ค่าเริ่มต้น `~/openclaw`, แทนที่ได้ด้วย
  `OPENCLAW_GIT_DIR`) สลับไปที่ `main`, rebase กับ upstream, build แล้ว
  ติดตั้ง global CLI จาก checkout นั้น

เคล็ดลับ: หากคุณต้องการ stable + dev พร้อมกัน ให้เก็บสอง clone และชี้
gateway ของคุณไปยังตัว stable

## การกำหนดเป้าหมายเวอร์ชันหรือแท็กแบบครั้งเดียว

ใช้ `--tag` เพื่อกำหนดเป้าหมายไปยัง dist-tag, เวอร์ชัน หรือ package spec ที่เฉพาะเจาะจงสำหรับการ
อัปเดตครั้งเดียว **โดยไม่** เปลี่ยนช่องทางที่บันทึกไว้ถาวร:

```bash
# ติดตั้งเวอร์ชันที่ระบุ
openclaw update --tag 2026.4.1-beta.1

# ติดตั้งจาก beta dist-tag (ครั้งเดียว ไม่บันทึกถาวร)
openclaw update --tag beta

# ติดตั้งจาก GitHub main branch (npm tarball)
openclaw update --tag main

# ติดตั้ง npm package spec ที่ระบุ
openclaw update --tag openclaw@2026.4.1-beta.1
```

หมายเหตุ:

- `--tag` ใช้กับ **การติดตั้งแบบแพ็กเกจ (npm) เท่านั้น** การติดตั้งแบบ git จะเพิกเฉยต่อมัน
- tag จะไม่ถูกบันทึกถาวร `openclaw update` ครั้งถัดไปจะใช้
  channel ที่คุณกำหนดค่าไว้ตามปกติ
- การป้องกันการ downgrade: หากเวอร์ชันเป้าหมายเก่ากว่าเวอร์ชันปัจจุบันของคุณ
  OpenClaw จะขอการยืนยัน (ข้ามได้ด้วย `--yes`)
- `--channel beta` ต่างจาก `--tag beta`: โฟลว์ของ channel สามารถ fallback
  ไปยัง stable/latest เมื่อ beta ไม่มีอยู่หรือเก่ากว่าได้ ขณะที่ `--tag beta` จะกำหนดเป้าหมาย
  ไปยัง dist-tag `beta` แบบดิบสำหรับการรันครั้งนั้นเท่านั้น

## Dry run

ดูตัวอย่างว่า `openclaw update` จะทำอะไรโดยไม่ทำการเปลี่ยนแปลงจริง:

```bash
openclaw update --dry-run
openclaw update --channel beta --dry-run
openclaw update --tag 2026.4.1-beta.1 --dry-run
openclaw update --dry-run --json
```

dry run จะแสดง effective channel, เวอร์ชันเป้าหมาย, การกระทำที่วางแผนไว้ และ
จำเป็นต้องมีการยืนยันการ downgrade หรือไม่

## Plugins และช่องทาง

เมื่อคุณสลับช่องทางด้วย `openclaw update`, OpenClaw จะซิงก์แหล่งที่มาของ Plugin ด้วย:

- `dev` ให้ความสำคัญกับ bundled plugins จาก git checkout
- `stable` และ `beta` จะกู้คืนแพ็กเกจ Plugin ที่ติดตั้งผ่าน npm
- Plugins ที่ติดตั้งผ่าน npm จะถูกอัปเดตหลังจาก core update เสร็จสิ้น

## การตรวจสอบสถานะปัจจุบัน

```bash
openclaw update status
```

จะแสดงช่องทางที่ใช้งานอยู่ ประเภทการติดตั้ง (git หรือ package) เวอร์ชันปัจจุบัน และ
แหล่งที่มา (config, git tag, git branch หรือค่าเริ่มต้น)

## แนวทางปฏิบัติที่ดีในการติดแท็ก

- ติดแท็กรีลีสที่คุณต้องการให้ git checkouts ลงจอดที่ (`vYYYY.M.D` สำหรับ stable,
  `vYYYY.M.D-beta.N` สำหรับ beta)
- `vYYYY.M.D.beta.N` ยังรองรับเพื่อความเข้ากันได้ แต่แนะนำให้ใช้ `-beta.N`
- legacy tags แบบ `vYYYY.M.D-<patch>` ยังรับรู้เป็น stable (ไม่ใช่ beta)
- ให้ tags เป็นแบบ immutable: ห้ามย้ายหรือใช้ tag เดิมซ้ำ
- npm dist-tags ยังคงเป็นแหล่งข้อมูลจริงหลักสำหรับการติดตั้งผ่าน npm:
  - `latest` -> stable
  - `beta` -> candidate build หรือ stable build ที่ปล่อยไป beta ก่อน
  - `dev` -> snapshot ของ main (ไม่บังคับ)

## ความพร้อมใช้งานของแอป macOS

build แบบ beta และ dev อาจ **ไม่มี** macOS app release ซึ่งถือว่าไม่เป็นไร:

- git tag และ npm dist-tag ยังคงสามารถเผยแพร่ได้
- ระบุให้ชัดว่า "ไม่มี macOS build สำหรับ beta นี้" ใน release notes หรือ changelog

## ที่เกี่ยวข้อง

- [Updating](/th/install/updating)
- [Installer internals](/th/install/installer)
