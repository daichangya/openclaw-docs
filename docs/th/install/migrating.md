---
read_when:
    - คุณกำลังย้าย OpenClaw ไปยังแล็ปท็อป/เซิร์ฟเวอร์เครื่องใหม่
    - คุณต้องการเก็บรักษา sessions, auth และการล็อกอินของช่องทาง (เช่น WhatsApp) ไว้中央値との差analysis to=functions.read  天天中彩票篮球 commentary  微信天天中彩票json  大发游戏{"path":"/home/runner/work/docs/docs/source/.agents/skills/openclaw-pr-maintainer/SKILL.md","offset":1,"limit":20}
summary: ย้าย (migrate) การติดตั้ง OpenClaw จากเครื่องหนึ่งไปยังอีกเครื่องหนึ่ง
title: คู่มือการย้ายระบบ
x-i18n:
    generated_at: "2026-04-23T05:41:14Z"
    model: gpt-5.4
    provider: openai
    source_hash: 403f0b9677ce723c84abdbabfad20e0f70fd48392ebf23eabb7f8a111fd6a26d
    source_path: install/migrating.md
    workflow: 15
---

# การย้าย OpenClaw ไปยังเครื่องใหม่

คู่มือนี้ช่วยย้าย OpenClaw gateway ไปยังเครื่องใหม่โดยไม่ต้องทำ onboarding ใหม่

## สิ่งที่จะถูกย้าย

เมื่อคุณคัดลอกทั้ง **state directory** (`~/.openclaw/` โดยค่าเริ่มต้น) และ **workspace** ของคุณ คุณจะเก็บรักษาสิ่งต่อไปนี้ไว้ได้:

- **คอนฟิก** -- `openclaw.json` และการตั้งค่า gateway ทั้งหมด
- **Auth** -- `auth-profiles.json` แบบรายเอเจนต์ (API keys + OAuth) รวมถึงสถานะของช่องทาง/ผู้ให้บริการภายใต้ `credentials/`
- **Sessions** -- ประวัติการสนทนาและสถานะของเอเจนต์
- **สถานะของช่องทาง** -- การล็อกอิน WhatsApp, Telegram session ฯลฯ
- **ไฟล์ใน Workspace** -- `MEMORY.md`, `USER.md`, Skills และ prompts

<Tip>
รัน `openclaw status` บนเครื่องเก่าเพื่อยืนยันพาธของ state directory
โปรไฟล์แบบกำหนดเองใช้ `~/.openclaw-<profile>/` หรือพาธที่ตั้งผ่าน `OPENCLAW_STATE_DIR`
</Tip>

## ขั้นตอนการย้าย

<Steps>
  <Step title="หยุด gateway และสำรองข้อมูล">
    บนเครื่อง**เก่า** ให้หยุด gateway เพื่อไม่ให้ไฟล์เปลี่ยนระหว่างคัดลอก จากนั้น archive:

    ```bash
    openclaw gateway stop
    cd ~
    tar -czf openclaw-state.tgz .openclaw
    ```

    หากคุณใช้หลายโปรไฟล์ (เช่น `~/.openclaw-work`) ให้ archive แต่ละอันแยกกัน

  </Step>

  <Step title="ติดตั้ง OpenClaw บนเครื่องใหม่">
    [ติดตั้ง](/th/install) CLI (และ Node หากจำเป็น) บนเครื่องใหม่
    ไม่เป็นไรหาก onboarding สร้าง `~/.openclaw/` ใหม่ขึ้นมา — คุณจะเขียนทับมันในขั้นตอนถัดไป
  </Step>

  <Step title="คัดลอก state directory และ workspace">
    โอนไฟล์ archive ผ่าน `scp`, `rsync -a` หรือ external drive แล้วแตกไฟล์:

    ```bash
    cd ~
    tar -xzf openclaw-state.tgz
    ```

    ตรวจสอบว่าได้รวม hidden directories มาด้วย และ file ownership ตรงกับผู้ใช้ที่จะรัน gateway

  </Step>

  <Step title="รัน doctor และตรวจสอบ">
    บนเครื่องใหม่ ให้รัน [Doctor](/th/gateway/doctor) เพื่อใช้ config migrations และซ่อมแซมบริการ:

    ```bash
    openclaw doctor
    openclaw gateway restart
    openclaw status
    ```

  </Step>
</Steps>

## จุดที่มักพลาด

<AccordionGroup>
  <Accordion title="โปรไฟล์หรือ state-dir ไม่ตรงกัน">
    หาก gateway เก่าใช้ `--profile` หรือ `OPENCLAW_STATE_DIR` แต่เครื่องใหม่ไม่ได้ใช้
    ช่องทางจะดูเหมือนหลุดจากระบบ และ sessions จะว่างเปล่า
    ให้เปิด gateway ด้วยโปรไฟล์หรือ state-dir **เดียวกัน** กับที่คุณย้ายมา แล้วรัน `openclaw doctor` อีกครั้ง
  </Accordion>

  <Accordion title="คัดลอกเฉพาะ openclaw.json">
    ไฟล์คอนฟิกอย่างเดียวไม่เพียงพอ auth profiles ของโมเดลอยู่ภายใต้
    `agents/<agentId>/agent/auth-profiles.json` และสถานะของช่องทาง/ผู้ให้บริการ
    ยังอยู่ภายใต้ `credentials/` เสมอ ให้ย้าย **ทั้ง** state directory
  </Accordion>

  <Accordion title="สิทธิ์และ ownership">
    หากคุณคัดลอกในฐานะ root หรือสลับผู้ใช้ gateway อาจอ่าน credentials ไม่ได้
    ตรวจสอบให้แน่ใจว่า state directory และ workspace เป็นของผู้ใช้ที่รัน gateway
  </Accordion>

  <Accordion title="Remote mode">
    หาก UI ของคุณชี้ไปยัง gateway แบบ **remote** โฮสต์ระยะไกลนั้นคือเจ้าของ sessions และ workspace
    ให้ย้ายตัวโฮสต์ของ gateway เอง ไม่ใช่แล็ปท็อปในเครื่องของคุณ ดู [FAQ](/th/help/faq#where-things-live-on-disk)
  </Accordion>

  <Accordion title="ความลับในข้อมูลสำรอง">
    state directory มี auth profiles, credentials ของช่องทาง และสถานะอื่นๆ ของผู้ให้บริการ
    จัดเก็บข้อมูลสำรองแบบเข้ารหัส หลีกเลี่ยงช่องทางโอนย้ายที่ไม่ปลอดภัย และหมุนเวียนคีย์หากคุณสงสัยว่าข้อมูลอาจรั่วไหล
  </Accordion>
</AccordionGroup>

## เช็กลิสต์การตรวจสอบ

บนเครื่องใหม่ ให้ยืนยันว่า:

- [ ] `openclaw status` แสดงว่า gateway กำลังทำงาน
- [ ] ช่องทางยังคงเชื่อมต่ออยู่ (ไม่ต้องจับคู่ใหม่)
- [ ] dashboard เปิดได้และแสดง sessions เดิม
- [ ] ไฟล์ใน workspace (memory, คอนฟิก) ยังอยู่ครบ
