---
read_when:
    - คุณต้องการสลับระหว่าง stable/beta/dev
    - คุณต้องการปักเวอร์ชัน แท็ก หรือ SHA ที่เฉพาะเจาะจง
    - คุณกำลังติดแท็กหรือเผยแพร่ prerelease
sidebarTitle: Release Channels
summary: 'ช่องทาง stable, beta และ dev: ความหมาย การสลับ การปักเวอร์ชัน และการติดแท็ก'
title: ช่องทางรีลีส
x-i18n:
    generated_at: "2026-04-23T05:38:55Z"
    model: gpt-5.4
    provider: openai
    source_hash: 3f33a77bf356f989cd4de5f8bb57f330c276e7571b955bea6994a4527e40258d
    source_path: install/development-channels.md
    workflow: 15
---

# ช่องทางพัฒนา

OpenClaw มีช่องทางอัปเดต 3 แบบ:

- **stable**: npm dist-tag `latest` แนะนำสำหรับผู้ใช้ส่วนใหญ่
- **beta**: npm dist-tag `beta` เมื่อเป็นตัวล่าสุด; หากไม่มี beta หรือเก่ากว่า
  stable release ล่าสุด โฟลว์การอัปเดตจะ fallback ไปใช้ `latest`
- **dev**: head ที่ขยับตลอดของ `main` (git) npm dist-tag: `dev` (เมื่อมีการเผยแพร่)
  สาขา `main` ใช้สำหรับการทดลองและการพัฒนาอย่างต่อเนื่อง อาจมี
  ฟีเจอร์ที่ยังไม่เสร็จหรือการเปลี่ยนแปลงที่ทำให้ใช้งานร่วมกันไม่ได้ ห้ามใช้กับ Gateway สำหรับ production

โดยปกติเราจะปล่อย build แบบ stable ไปที่ **beta** ก่อน ทดสอบที่นั่น แล้วจึงรัน
ขั้นตอน promotion แบบ explicit เพื่อย้าย build ที่ผ่านการตรวจสอบแล้วไปที่ `latest` โดย
ไม่เปลี่ยนหมายเลขเวอร์ชัน ผู้ดูแลสามารถเผยแพร่ stable release
ตรงไปยัง `latest` ได้เมื่อจำเป็น dist-tag คือแหล่งข้อมูลจริงสำหรับการติดตั้งผ่าน npm

## การสลับช่องทาง

```bash
openclaw update --channel stable
openclaw update --channel beta
openclaw update --channel dev
```

`--channel` จะบันทึกตัวเลือกของคุณไว้ในคอนฟิก (`update.channel`) และจัดแนว
วิธีติดตั้งให้ตรงกัน:

- **`stable`** (การติดตั้งแบบแพ็กเกจ): อัปเดตผ่าน npm dist-tag `latest`
- **`beta`** (การติดตั้งแบบแพ็กเกจ): จะเลือก npm dist-tag `beta` ก่อน แต่จะ fallback ไป
  `latest` เมื่อ `beta` ไม่มีหรือเก่ากว่า stable tag ปัจจุบัน
- **`stable`** (การติดตั้งแบบ git): checkout git tag ของ stable ล่าสุด
- **`beta`** (การติดตั้งแบบ git): จะเลือก beta git tag ล่าสุดก่อน แต่จะ fallback ไปยัง
  stable git tag ล่าสุดเมื่อไม่มี beta หรือ beta เก่ากว่า
- **`dev`**: ตรวจให้แน่ใจว่ามี git checkout (ค่าเริ่มต้น `~/openclaw`, override ได้ด้วย
  `OPENCLAW_GIT_DIR`) จากนั้นสลับไปที่ `main`, rebase จาก upstream, build และ
  ติดตั้ง global CLI จาก checkout นั้น

เคล็ดลับ: หากคุณต้องการใช้ stable + dev พร้อมกัน ให้เก็บสอง clone แล้วชี้
Gateway ของคุณไปยังตัว stable

## การกำหนดเป้าหมายเวอร์ชันหรือแท็กแบบครั้งเดียว

ใช้ `--tag` เพื่อกำหนดเป้าหมายเป็น dist-tag, เวอร์ชัน หรือ package spec ที่เจาะจงสำหรับ
การอัปเดต **เพียงครั้งเดียว** โดยไม่เปลี่ยนช่องทางที่บันทึกไว้:

```bash
# ติดตั้งเวอร์ชันที่ระบุ
openclaw update --tag 2026.4.1-beta.1

# ติดตั้งจาก dist-tag beta (ครั้งเดียว ไม่บันทึก)
openclaw update --tag beta

# ติดตั้งจากสาขา main บน GitHub (npm tarball)
openclaw update --tag main

# ติดตั้งจาก npm package spec ที่ระบุ
openclaw update --tag openclaw@2026.4.1-beta.1
```

หมายเหตุ:

- `--tag` ใช้ได้เฉพาะกับ **การติดตั้งแบบแพ็กเกจ (npm)** เท่านั้น การติดตั้งแบบ git จะเพิกเฉยต่อมัน
- tag นี้จะไม่ถูกบันทึก การรัน `openclaw update` ครั้งถัดไปของคุณจะใช้ช่องทางที่ตั้งค่าไว้
  ตามปกติ
- การป้องกันการ downgrade: หากเวอร์ชันเป้าหมายเก่ากว่าเวอร์ชันปัจจุบันของคุณ
  OpenClaw จะขอการยืนยัน (ข้ามได้ด้วย `--yes`)
- `--channel beta` ต่างจาก `--tag beta`: โฟลว์แบบ channel สามารถ fallback
  ไปยัง stable/latest ได้เมื่อไม่มี beta หรือ beta เก่ากว่า ขณะที่ `--tag beta` จะชี้ไปยัง
  dist-tag `beta` แบบดิบสำหรับการรันครั้งนั้นเท่านั้น

## Dry run

ดูตัวอย่างว่า `openclaw update` จะทำอะไรโดยไม่เปลี่ยนแปลงจริง:

```bash
openclaw update --dry-run
openclaw update --channel beta --dry-run
openclaw update --tag 2026.4.1-beta.1 --dry-run
openclaw update --dry-run --json
```

dry run จะแสดงช่องทางที่มีผลจริง เวอร์ชันเป้าหมาย การกระทำที่วางแผนไว้ และ
จำเป็นต้องมีการยืนยันการ downgrade หรือไม่

## Plugin และช่องทาง

เมื่อคุณสลับช่องทางด้วย `openclaw update` OpenClaw จะซิงก์
แหล่งที่มาของ Plugin ด้วย:

- `dev` จะเลือก bundled plugin จาก git checkout
- `stable` และ `beta` จะกู้คืนแพ็กเกจ Plugin ที่ติดตั้งผ่าน npm
- Plugin ที่ติดตั้งผ่าน npm จะถูกอัปเดตหลังจากการอัปเดตแกนหลักเสร็จสิ้น

## การตรวจสอบสถานะปัจจุบัน

```bash
openclaw update status
```

จะแสดงช่องทางที่ใช้งานอยู่ ประเภทการติดตั้ง (git หรือ package) เวอร์ชันปัจจุบัน และ
แหล่งที่มา (config, git tag, git branch หรือค่าเริ่มต้น)

## แนวทางปฏิบัติที่ดีที่สุดสำหรับการติดแท็ก

- ติดแท็กรีลีสที่คุณต้องการให้ git checkout ไปลงที่นั่น (`vYYYY.M.D` สำหรับ stable,
  `vYYYY.M.D-beta.N` สำหรับ beta)
- `vYYYY.M.D.beta.N` ก็ยังรองรับเพื่อความเข้ากันได้ แต่ควรใช้ `-beta.N`
- แท็กแบบ legacy `vYYYY.M.D-<patch>` ก็ยังรองรับว่าเป็น stable (ไม่ใช่ beta)
- รักษาแท็กให้ไม่เปลี่ยนแปลง: ห้ามย้ายหรือใช้แท็กซ้ำ
- npm dist-tag ยังคงเป็นแหล่งข้อมูลจริงสำหรับการติดตั้งผ่าน npm:
  - `latest` -> stable
  - `beta` -> candidate build หรือ stable build ที่ปล่อยให้ beta ก่อน
  - `dev` -> snapshot ของ main (ไม่บังคับ)

## ความพร้อมใช้งานของแอป macOS

build แบบ beta และ dev อาจ **ไม่มี** รีลีสของแอป macOS ซึ่งไม่เป็นปัญหา:

- ยังสามารถเผยแพร่ git tag และ npm dist-tag ได้
- ควรระบุว่า "ไม่มี macOS build สำหรับ beta นี้" ใน release note หรือ changelog
