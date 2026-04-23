---
read_when:
    - การ resolve secret refs ใหม่ขณะรันไทม์
    - การตรวจสอบร่องรอย plaintext และ refs ที่ยัง resolve ไม่ได้
    - การกำหนดค่า SecretRefs และใช้การเปลี่ยนแปลงการล้างข้อมูลแบบทางเดียว
summary: เอกสารอ้างอิง CLI สำหรับ `openclaw secrets` (โหลดใหม่ ตรวจสอบ กำหนดค่า ใช้การเปลี่ยนแปลง)
title: ความลับ
x-i18n:
    generated_at: "2026-04-23T06:19:27Z"
    model: gpt-5.4
    provider: openai
    source_hash: f436ba089d752edb766c0a3ce746ee6bca1097b22c9b30e3d9715cb0bb50bf47
    source_path: cli/secrets.md
    workflow: 15
---

# `openclaw secrets`

ใช้ `openclaw secrets` เพื่อจัดการ SecretRefs และทำให้สแนปช็อตรันไทม์ที่ใช้งานอยู่มีสภาพสมบูรณ์

บทบาทของคำสั่ง:

- `reload`: gateway RPC (`secrets.reload`) ที่ resolve refs ใหม่และสลับสแนปช็อตรันไทม์เฉพาะเมื่อสำเร็จทั้งหมดเท่านั้น (ไม่มีการเขียน config)
- `audit`: สแกนแบบอ่านอย่างเดียวสำหรับ configuration/auth/generated-model stores และร่องรอยตกค้างแบบ legacy เพื่อหา plaintext, refs ที่ resolve ไม่ได้ และ precedence drift (ระบบจะข้าม exec refs เว้นแต่จะตั้ง `--allow-exec`)
- `configure`: ตัววางแผนแบบโต้ตอบสำหรับการตั้งค่า provider, การแมปเป้าหมาย และ preflight (ต้องใช้ TTY)
- `apply`: ดำเนินการตามแผนที่บันทึกไว้ (`--dry-run` สำหรับตรวจสอบความถูกต้องเท่านั้น; dry-run จะข้ามการตรวจสอบ exec โดยค่าเริ่มต้น และโหมดเขียนจะปฏิเสธแผนที่มี exec เว้นแต่จะตั้ง `--allow-exec`) จากนั้นล้างร่องรอย plaintext ที่ระบุเป้าหมาย

ลูปการทำงานที่แนะนำสำหรับผู้ปฏิบัติงาน:

```bash
openclaw secrets audit --check
openclaw secrets configure
openclaw secrets apply --from /tmp/openclaw-secrets-plan.json --dry-run
openclaw secrets apply --from /tmp/openclaw-secrets-plan.json
openclaw secrets audit --check
openclaw secrets reload
```

หากแผนของคุณมี `exec` SecretRefs/providers ให้ส่ง `--allow-exec` ทั้งในคำสั่ง apply แบบ dry-run และแบบเขียนจริง

หมายเหตุเรื่อง exit code สำหรับ CI/gates:

- `audit --check` จะคืนค่า `1` เมื่อพบรายการผิดปกติ
- refs ที่ resolve ไม่ได้จะคืนค่า `2`

ที่เกี่ยวข้อง:

- คู่มือ Secrets: [Secrets Management](/th/gateway/secrets)
- พื้นผิวข้อมูลรับรอง: [SecretRef Credential Surface](/th/reference/secretref-credential-surface)
- คู่มือความปลอดภัย: [Security](/th/gateway/security)

## โหลดสแนปช็อตรันไทม์ใหม่

resolve secret refs ใหม่และสลับสแนปช็อตรันไทม์แบบอะตอมมิก

```bash
openclaw secrets reload
openclaw secrets reload --json
openclaw secrets reload --url ws://127.0.0.1:18789 --token <token>
```

หมายเหตุ:

- ใช้ gateway RPC method `secrets.reload`
- หากการ resolve ล้มเหลว gateway จะคงสแนปช็อตล่าสุดที่ใช้งานได้ไว้และส่งคืนข้อผิดพลาด (ไม่มีการเปิดใช้งานบางส่วน)
- การตอบกลับแบบ JSON มี `warningCount`

ตัวเลือก:

- `--url <url>`
- `--token <token>`
- `--timeout <ms>`
- `--json`

## ตรวจสอบ

สแกนสถานะของ OpenClaw เพื่อหา:

- การจัดเก็บความลับแบบ plaintext
- refs ที่ resolve ไม่ได้
- precedence drift (`auth-profiles.json` credentials ที่บัง `openclaw.json` refs)
- ร่องรอยใน `agents/*/agent/models.json` ที่สร้างขึ้น (`apiKey` ของ provider และ provider headers ที่ละเอียดอ่อน)
- ร่องรอยแบบ legacy (รายการใน legacy auth store, การเตือน OAuth)

หมายเหตุเรื่องร่องรอยของ header:

- การตรวจจับ provider header ที่ละเอียดอ่อนอิงตาม heuristic ของชื่อ (ชื่อ header และชิ้นส่วนชื่อที่พบบ่อยเกี่ยวกับ auth/credentials เช่น `authorization`, `x-api-key`, `token`, `secret`, `password` และ `credential`)

```bash
openclaw secrets audit
openclaw secrets audit --check
openclaw secrets audit --json
openclaw secrets audit --allow-exec
```

พฤติกรรมการออก:

- `--check` จะออกด้วยค่าที่ไม่เป็นศูนย์เมื่อพบรายการผิดปกติ
- refs ที่ resolve ไม่ได้จะออกด้วยรหัสที่ไม่เป็นศูนย์ซึ่งมีลำดับความสำคัญสูงกว่า

จุดเด่นของรูปแบบรายงาน:

- `status`: `clean | findings | unresolved`
- `resolution`: `refsChecked`, `skippedExecRefs`, `resolvabilityComplete`
- `summary`: `plaintextCount`, `unresolvedRefCount`, `shadowedRefCount`, `legacyResidueCount`
- รหัสรายการผิดปกติ:
  - `PLAINTEXT_FOUND`
  - `REF_UNRESOLVED`
  - `REF_SHADOWED`
  - `LEGACY_RESIDUE`

## กำหนดค่า (ตัวช่วยแบบโต้ตอบ)

สร้างการเปลี่ยนแปลง provider และ SecretRef แบบโต้ตอบ รัน preflight และเลือก apply ได้:

```bash
openclaw secrets configure
openclaw secrets configure --plan-out /tmp/openclaw-secrets-plan.json
openclaw secrets configure --apply --yes
openclaw secrets configure --providers-only
openclaw secrets configure --skip-provider-setup
openclaw secrets configure --agent ops
openclaw secrets configure --json
```

ลำดับการทำงาน:

- ตั้งค่า Provider ก่อน (`add/edit/remove` สำหรับ aliases ใน `secrets.providers`)
- แมปข้อมูลรับรองเป็นลำดับถัดไป (เลือกฟิลด์และกำหนด refs แบบ `{source, provider, id}`)
- Preflight และ apply แบบไม่บังคับเป็นลำดับสุดท้าย

แฟล็ก:

- `--providers-only`: กำหนดค่าเฉพาะ `secrets.providers` ข้ามการแมปข้อมูลรับรอง
- `--skip-provider-setup`: ข้ามการตั้งค่า provider และแมปข้อมูลรับรองไปยัง providers ที่มีอยู่
- `--agent <id>`: กำหนดขอบเขตการค้นหาเป้าหมายและการเขียนใน `auth-profiles.json` ไปยัง store ของ agent เดียว
- `--allow-exec`: อนุญาตการตรวจสอบ exec SecretRef ระหว่าง preflight/apply (อาจมีการรันคำสั่งของ provider)

หมายเหตุ:

- ต้องใช้ TTY แบบโต้ตอบ
- คุณไม่สามารถใช้ `--providers-only` ร่วมกับ `--skip-provider-setup`
- `configure` กำหนดเป้าหมายไปยังฟิลด์ที่มีความลับใน `openclaw.json` รวมถึง `auth-profiles.json` สำหรับขอบเขต agent ที่เลือก
- `configure` รองรับการสร้างการแมป `auth-profiles.json` ใหม่โดยตรงภายในขั้นตอนตัวเลือก
- พื้นผิวที่รองรับตามมาตรฐาน: [SecretRef Credential Surface](/th/reference/secretref-credential-surface)
- ระบบจะทำ preflight resolve ก่อน apply
- หาก preflight/apply มี exec refs ให้คง `--allow-exec` ไว้ทั้งสองขั้นตอน
- แผนที่สร้างขึ้นจะใช้ตัวเลือก scrub โดยค่าเริ่มต้น (`scrubEnv`, `scrubAuthProfilesForProviderTargets`, `scrubLegacyAuthJson` เปิดทั้งหมด)
- เส้นทาง apply เป็นแบบทางเดียวสำหรับค่า plaintext ที่ถูก scrub
- หากไม่ใช้ `--apply` CLI จะยังถาม `Apply this plan now?` หลัง preflight
- เมื่อใช้ `--apply` (และไม่มี `--yes`) CLI จะถามการยืนยันเพิ่มเติมที่ไม่สามารถย้อนกลับได้
- `--json` จะพิมพ์แผน + รายงาน preflight แต่คำสั่งยังคงต้องใช้ TTY แบบโต้ตอบ

หมายเหตุด้านความปลอดภัยของ exec provider:

- การติดตั้งผ่าน Homebrew มักเปิดเผยไบนารีแบบ symlink ภายใต้ `/opt/homebrew/bin/*`
- ตั้งค่า `allowSymlinkCommand: true` เฉพาะเมื่อจำเป็นสำหรับพาธของ package manager ที่เชื่อถือได้ และใช้ร่วมกับ `trustedDirs` (ตัวอย่างเช่น `["/opt/homebrew"]`)
- บน Windows หากไม่สามารถยืนยัน ACL สำหรับพาธของ provider ได้ OpenClaw จะล้มเหลวแบบปิดไว้ก่อน สำหรับพาธที่เชื่อถือได้เท่านั้น ให้ตั้ง `allowInsecurePath: true` บน provider นั้นเพื่อข้ามการตรวจสอบความปลอดภัยของพาธ

## ใช้แผนที่บันทึกไว้

apply หรือ preflight แผนที่สร้างไว้ก่อนหน้านี้:

```bash
openclaw secrets apply --from /tmp/openclaw-secrets-plan.json
openclaw secrets apply --from /tmp/openclaw-secrets-plan.json --allow-exec
openclaw secrets apply --from /tmp/openclaw-secrets-plan.json --dry-run
openclaw secrets apply --from /tmp/openclaw-secrets-plan.json --dry-run --allow-exec
openclaw secrets apply --from /tmp/openclaw-secrets-plan.json --json
```

พฤติกรรมของ exec:

- `--dry-run` ตรวจสอบ preflight โดยไม่เขียนไฟล์
- การตรวจสอบ exec SecretRef จะถูกข้ามโดยค่าเริ่มต้นใน dry-run
- โหมดเขียนจะปฏิเสธแผนที่มี exec SecretRefs/providers เว้นแต่จะตั้ง `--allow-exec`
- ใช้ `--allow-exec` เพื่อเลือกเข้าร่วมการตรวจสอบ/การรัน exec provider ในทั้งสองโหมด

รายละเอียดของสัญญาแผน (พาธเป้าหมายที่อนุญาต กฎการตรวจสอบ และความหมายของความล้มเหลว):

- [Secrets Apply Plan Contract](/th/gateway/secrets-plan-contract)

สิ่งที่ `apply` อาจอัปเดต:

- `openclaw.json` (เป้าหมาย SecretRef + การ upsert/delete ของ provider)
- `auth-profiles.json` (การ scrub เป้าหมายของ provider)
- ร่องรอยใน `auth.json` แบบ legacy
- คีย์ความลับที่รู้จักใน `~/.openclaw/.env` ซึ่งมีค่าถูกย้ายแล้ว

## เหตุใดจึงไม่มีแบ็กอัปสำหรับ rollback

`secrets apply` ตั้งใจไม่เขียนแบ็กอัปสำหรับ rollback ที่มีค่า plaintext เดิม

ความปลอดภัยมาจาก preflight ที่เข้มงวด + apply แบบกึ่งอะตอมมิก พร้อมการกู้คืนในหน่วยความจำแบบ best-effort เมื่อเกิดความล้มเหลว

## ตัวอย่าง

```bash
openclaw secrets audit --check
openclaw secrets configure
openclaw secrets audit --check
```

หาก `audit --check` ยังคงรายงานการพบ plaintext ให้ปรับปรุงพาธเป้าหมายที่ยังถูกรายงานอยู่ แล้วรัน audit อีกครั้ง
