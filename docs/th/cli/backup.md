---
read_when:
    - คุณต้องการไฟล์เก็บถาวรสำรองข้อมูลแบบ first-class สำหรับสถานะ OpenClaw ในเครื่อง
    - คุณต้องการดูตัวอย่างว่าเส้นทางใดจะถูกรวมไว้ก่อนทำการรีเซ็ตหรือลบการติดตั้ง
summary: เอกสารอ้างอิง CLI สำหรับ `openclaw backup` (สร้างไฟล์เก็บถาวรสำรองข้อมูลในเครื่อง)
title: การสำรองข้อมูล
x-i18n:
    generated_at: "2026-04-24T09:01:54Z"
    model: gpt-5.4
    provider: openai
    source_hash: 88d83cf04c163d76658575aa6d90be1dd7379934fa2822a07e13311c4324f8fd
    source_path: cli/backup.md
    workflow: 15
---

# `openclaw backup`

สร้างไฟล์เก็บถาวรสำรองข้อมูลในเครื่องสำหรับสถานะ OpenClaw, config, โปรไฟล์การยืนยันตัวตน, ข้อมูลรับรองของช่องทาง/ผู้ให้บริการ, เซสชัน และรวมถึง workspace ได้ตามต้องการ

```bash
openclaw backup create
openclaw backup create --output ~/Backups
openclaw backup create --dry-run --json
openclaw backup create --verify
openclaw backup create --no-include-workspace
openclaw backup create --only-config
openclaw backup verify ./2026-03-09T00-00-00.000Z-openclaw-backup.tar.gz
```

## หมายเหตุ

- ไฟล์เก็บถาวรจะมีไฟล์ `manifest.json` ซึ่งบันทึก source paths ที่ resolve แล้วและโครงสร้างภายในไฟล์เก็บถาวร
- ปลายทางเริ่มต้นคือไฟล์เก็บถาวร `.tar.gz` ที่มีชื่อแบบประทับเวลาในไดเรกทอรีทำงานปัจจุบัน
- หากไดเรกทอรีทำงานปัจจุบันอยู่ภายใน source tree ที่จะสำรองข้อมูล OpenClaw จะย้อนกลับไปใช้โฮมไดเรกทอรีของคุณเป็นตำแหน่งเริ่มต้นของไฟล์เก็บถาวร
- จะไม่มีการเขียนทับไฟล์เก็บถาวรที่มีอยู่แล้ว
- ระบบจะปฏิเสธ output paths ที่อยู่ภายใน source state/workspace trees เพื่อหลีกเลี่ยงการรวมตัวเองเข้าไป
- `openclaw backup verify <archive>` จะตรวจสอบว่าไฟล์เก็บถาวรมี root manifest เพียงหนึ่งเดียว ปฏิเสธ archive paths แบบ traversal และตรวจสอบว่า payload ทุกชิ้นที่ประกาศไว้ใน manifest มีอยู่จริงใน tarball
- `openclaw backup create --verify` จะรันการตรวจสอบนั้นทันทีหลังจากเขียนไฟล์เก็บถาวรเสร็จ
- `openclaw backup create --only-config` จะสำรองเฉพาะไฟล์ JSON config ที่ใช้งานอยู่

## สิ่งที่จะถูกสำรองข้อมูล

`openclaw backup create` จะวางแผนแหล่งข้อมูลสำรองจากการติดตั้ง OpenClaw ในเครื่องของคุณ:

- ไดเรกทอรีสถานะที่ได้จาก local state resolver ของ OpenClaw ซึ่งโดยทั่วไปคือ `~/.openclaw`
- เส้นทางของไฟล์ config ที่ใช้งานอยู่
- ไดเรกทอรี `credentials/` ที่ resolve แล้ว เมื่อไดเรกทอรีนั้นอยู่นอกไดเรกทอรีสถานะ
- ไดเรกทอรี workspace ที่ค้นพบจาก config ปัจจุบัน เว้นแต่คุณจะส่ง `--no-include-workspace`

โปรไฟล์การยืนยันตัวตนของโมเดลเป็นส่วนหนึ่งของไดเรกทอรีสถานะอยู่แล้วภายใต้
`agents/<agentId>/agent/auth-profiles.json` ดังนั้นโดยปกติจึงถูกรวมอยู่แล้วโดย
รายการสำรองข้อมูลสถานะ

หากคุณใช้ `--only-config` OpenClaw จะข้ามการค้นหา state, ไดเรกทอรี credentials และ workspace และจะเก็บถาวรเฉพาะเส้นทางของไฟล์ config ที่ใช้งานอยู่

OpenClaw จะทำให้ paths เป็น canonical ก่อนสร้างไฟล์เก็บถาวร หาก config,
ไดเรกทอรี credentials หรือ workspace อยู่ภายในไดเรกทอรีสถานะอยู่แล้ว
จะไม่มีการทำซ้ำเป็นแหล่งข้อมูลสำรองระดับบนสุดแยกต่างหาก เส้นทางที่ไม่มีอยู่จริงจะถูกข้าม

payload ของไฟล์เก็บถาวรจะเก็บเนื้อหาไฟล์จาก source trees เหล่านั้น และ `manifest.json` ที่ฝังอยู่จะบันทึก absolute source paths ที่ resolve แล้วพร้อมทั้งโครงสร้างภายในไฟล์เก็บถาวรที่ใช้สำหรับแต่ละ asset

## พฤติกรรมเมื่อ config ไม่ถูกต้อง

`openclaw backup` ถูกออกแบบมาให้ข้ามการตรวจสอบเบื้องต้นของ config ตามปกติโดยตั้งใจ เพื่อให้ยังช่วยในการกู้คืนได้ อย่างไรก็ตาม เนื่องจากการค้นหา workspace ขึ้นอยู่กับ config ที่ถูกต้อง `openclaw backup create` จะล้มเหลวทันทีเมื่อไฟล์ config มีอยู่แต่ไม่ถูกต้อง และยังเปิดการสำรองข้อมูล workspace อยู่

หากคุณยังต้องการการสำรองข้อมูลบางส่วนในสถานการณ์นั้น ให้รันใหม่ด้วย:

```bash
openclaw backup create --no-include-workspace
```

วิธีนี้จะยังคงรวม state, config และไดเรกทอรี credentials ภายนอกไว้
ขณะเดียวกันก็ข้ามการค้นหา workspace ทั้งหมด

หากคุณต้องการเพียงสำเนาของไฟล์ config เอง `--only-config` ก็ใช้ได้เช่นกันเมื่อ config มีรูปแบบไม่ถูกต้อง เพราะไม่ต้องพึ่งการ parse config เพื่อค้นหา workspace

## ขนาดและประสิทธิภาพ

OpenClaw ไม่ได้บังคับขนาดสูงสุดของไฟล์สำรองข้อมูลหรือขนาดสูงสุดต่อไฟล์ไว้ภายในระบบ

ข้อจำกัดในทางปฏิบัติมาจากเครื่องภายในและระบบไฟล์ปลายทาง:

- พื้นที่ว่างสำหรับการเขียนไฟล์เก็บถาวรชั่วคราวและไฟล์เก็บถาวรสุดท้าย
- เวลาที่ใช้เดินสำรวจ workspace ขนาดใหญ่และบีบอัดเป็น `.tar.gz`
- เวลาที่ใช้สแกนไฟล์เก็บถาวรอีกครั้งหากคุณใช้ `openclaw backup create --verify` หรือรัน `openclaw backup verify`
- พฤติกรรมของระบบไฟล์ที่เส้นทางปลายทาง OpenClaw จะพยายามใช้ขั้นตอนการเผยแพร่ผ่าน hard link แบบไม่เขียนทับก่อน และจะย้อนกลับไปใช้การคัดลอกแบบ exclusive เมื่อไม่รองรับ hard links

workspace ขนาดใหญ่มักเป็นปัจจัยหลักที่ทำให้ไฟล์เก็บถาวรมีขนาดใหญ่ หากคุณต้องการไฟล์สำรองข้อมูลที่เล็กลงหรือเร็วขึ้น ให้ใช้ `--no-include-workspace`

หากต้องการไฟล์เก็บถาวรที่เล็กที่สุด ให้ใช้ `--only-config`

## ที่เกี่ยวข้อง

- [เอกสารอ้างอิง CLI](/th/cli)
